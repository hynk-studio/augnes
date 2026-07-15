import type Database from "better-sqlite3";

import { openDatabase, type StateEntry } from "@/lib/db";
import {
  assertModelEgressTextIsSafe,
  cloneBoundedModelEgressJson,
  isModelEgressBoundaryError,
  serializeModelEgressJson,
} from "@/lib/model-egress/bounded-model-payload";
import type { ValidatedProposal } from "@/lib/observe/proposal-contract";
import type { TemporalInterpretationPreview } from "@/lib/temporal-interpretation/types";
import { readRootAvailabilityV01 } from "@/lib/vnext/onboarding/local-project-onboarding";
import {
  findCanonicalProjectByLocalRootV01,
  readCanonicalProjectWithRootV01,
} from "@/lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01 } from "@/lib/vnext/persistence/project-lifecycle-registry";
import {
  createOpenAIResponsesAdapterV01,
} from "@/lib/vnext/model-gateway/openai/responses-adapter";
import { OBSERVE_MODEL_EGRESS_LIMITS } from "@/lib/vnext/model-gateway/openai/observe-codec";
import { PLANNER_MODEL_EGRESS_LIMITS } from "@/lib/vnext/model-gateway/openai/planner-codec";
import { TEMPORAL_MODEL_EGRESS_LIMITS } from "@/lib/vnext/model-gateway/openai/temporal-codec";
import {
  MODEL_GATEWAY_PURPOSES_V01,
  MODEL_GATEWAY_VERSION_V01,
  MODEL_INVOCATION_ENVELOPE_VERSION_V01,
  MODEL_INVOCATION_RECEIPT_VERSION_V01,
  ModelGatewayAdapterFailureV01,
  ModelGatewayInvocationErrorV01,
  OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
  PLANNER_MODEL_GATEWAY_PURPOSE_V01,
  TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
  type ModelAdapterImplementationV01,
  type ModelAdapterInvocationResultV01,
  type ModelAdapterSessionV01,
  type ModelAdapterV01,
  type ModelGatewayDataClassificationV01,
  type ModelGatewayExecutionModeV01,
  type ModelGatewayFailureCodeV01,
  type ModelGatewayPurposeV01,
  type ModelInvocationEnvelopeV01,
  type ModelInvocationReceiptV01,
  type ObserveModelGatewayResultV01,
  type ObserveModelInvocationEnvelopeV01,
  type PlannerModelGatewayResultV01,
  type PlannerModelInvocationEnvelopeV01,
  type PlannerRecommendationV01,
  type TemporalModelGatewayResultV01,
  type TemporalModelInvocationEnvelopeV01,
} from "@/lib/vnext/model-gateway/contracts";
import { LOCAL_PROJECT_ROOT_REF_VERSION_V01 } from "@/types/vnext/project-identity";

export const DETERMINISTIC_OBSERVE_IMPLEMENTATION_ID_V01 =
  "deterministic.observe" as const;
export const DETERMINISTIC_OBSERVE_IMPLEMENTATION_VERSION_V01 =
  "deterministic_observe.v0.1" as const;
export const DETERMINISTIC_PLANNER_IMPLEMENTATION_ID_V01 =
  "deterministic.planner" as const;
export const DETERMINISTIC_PLANNER_IMPLEMENTATION_VERSION_V01 =
  "deterministic_planner.v0.1" as const;
export const DETERMINISTIC_TEMPORAL_IMPLEMENTATION_ID_V01 =
  "deterministic.temporal" as const;
export const DETERMINISTIC_TEMPORAL_IMPLEMENTATION_VERSION_V01 =
  "deterministic_temporal.v0.1" as const;

const MAX_TIMEOUT_MS = 60_000;
const MAX_PROVENANCE_REFS = 16;
const MAX_OUTPUT_TOKENS = 4_096;
const CANONICAL_ID_PATTERN =
  /^(workspace|project):[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_IDENTIFIER_PATTERN = /^[A-Za-z0-9:._-]{1,256}$/;
const PROVENANCE_REF_PATTERN =
  /^(?:sha256:[0-9a-f]{64}|[a-z][a-z0-9_.-]{0,63}:[A-Za-z0-9:._-]{1,256})$/;
const PROVIDER_CONTROL_KEYS = new Set([
  "api_key",
  "authorization",
  "developer_prompt",
  "endpoint",
  "endpoint_url",
  "function",
  "functions",
  "model",
  "model_id",
  "model_identifier",
  "provider",
  "provider_id",
  "response_format",
  "response_schema",
  "role",
  "roles",
  "system_prompt",
  "tool",
  "tools",
]);

interface SharedModelGatewayDependenciesV01 {
  open_database?: () => Database.Database;
  adapter?: ModelAdapterV01;
  read_root_availability?: typeof readRootAvailabilityV01;
  now?: () => Date;
}

export interface ObserveModelGatewayDependenciesV01
  extends SharedModelGatewayDependenciesV01 {
  deterministic_execute: (
    input: ObserveModelInvocationEnvelopeV01["input"],
    lifecycle: { signal: AbortSignal },
  ) => ValidatedProposal[] | Promise<ValidatedProposal[]>;
}

export interface PlannerModelGatewayDependenciesV01
  extends SharedModelGatewayDependenciesV01 {
  deterministic_execute: (
    input: PlannerModelInvocationEnvelopeV01["input"],
    lifecycle: { signal: AbortSignal },
  ) => PlannerRecommendationV01[] | Promise<PlannerRecommendationV01[]>;
}

export interface TemporalModelGatewayDependenciesV01
  extends SharedModelGatewayDependenciesV01 {
  deterministic_execute: (
    input: TemporalModelInvocationEnvelopeV01["input"],
    lifecycle: { signal: AbortSignal },
  ) =>
    | TemporalInterpretationPreview
    | Promise<TemporalInterpretationPreview>;
}

type DeterministicOutputV01 =
  | {
      purpose: typeof OBSERVE_MODEL_GATEWAY_PURPOSE_V01;
      proposals: ValidatedProposal[];
    }
  | {
      purpose: typeof PLANNER_MODEL_GATEWAY_PURPOSE_V01;
      recommendations: PlannerRecommendationV01[];
    }
  | {
      purpose: typeof TEMPORAL_MODEL_GATEWAY_PURPOSE_V01;
      preview: TemporalInterpretationPreview;
    };

interface InternalModelGatewayDependenciesV01
  extends SharedModelGatewayDependenciesV01 {
  deterministic_execute: (
    input: ModelInvocationEnvelopeV01["input"],
    lifecycle: { signal: AbortSignal },
  ) => DeterministicOutputV01 | Promise<DeterministicOutputV01>;
  provider_failure_fallback: boolean;
}

type InternalGatewayResultV01 = {
  execution: "live" | "deterministic" | "fallback";
  output: ModelAdapterInvocationResultV01 | DeterministicOutputV01;
  model_invocation_receipt: ModelInvocationReceiptV01;
};

export async function invokeObserveModelGatewayV01(
  input: unknown,
  dependencies: ObserveModelGatewayDependenciesV01,
): Promise<ObserveModelGatewayResultV01> {
  const result = await invokeModelGatewayV01(input, {
    ...dependencies,
    provider_failure_fallback: false,
    async deterministic_execute(purposeInput, lifecycle) {
      if (purposeInput.input_kind !== OBSERVE_MODEL_GATEWAY_PURPOSE_V01) {
        throw new Error("purpose_mismatch");
      }
      return {
        purpose: OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
        proposals: await dependencies.deterministic_execute(
          purposeInput,
          lifecycle,
        ),
      };
    },
  });
  if (result.output.purpose !== OBSERVE_MODEL_GATEWAY_PURPOSE_V01) {
    throw gatewayFailure("model_gateway_provider_response_invalid");
  }
  return {
    compiler: result.execution === "live" ? "openai" : "mock",
    proposals: result.output.proposals,
    model_invocation_receipt: result.model_invocation_receipt,
  };
}

export async function invokePlannerModelGatewayV01(
  input: unknown,
  dependencies: PlannerModelGatewayDependenciesV01,
): Promise<PlannerModelGatewayResultV01> {
  const result = await invokeModelGatewayV01(input, {
    ...dependencies,
    provider_failure_fallback: false,
    async deterministic_execute(purposeInput, lifecycle) {
      if (purposeInput.input_kind !== PLANNER_MODEL_GATEWAY_PURPOSE_V01) {
        throw new Error("purpose_mismatch");
      }
      return {
        purpose: PLANNER_MODEL_GATEWAY_PURPOSE_V01,
        recommendations: await dependencies.deterministic_execute(
          purposeInput,
          lifecycle,
        ),
      };
    },
  });
  if (result.output.purpose !== PLANNER_MODEL_GATEWAY_PURPOSE_V01) {
    throw gatewayFailure("model_gateway_provider_response_invalid");
  }
  return {
    planner: result.execution === "live" ? "openai" : "mock",
    recommendations: result.output.recommendations,
    model_invocation_receipt: result.model_invocation_receipt,
  };
}

export async function invokeTemporalModelGatewayV01(
  input: unknown,
  dependencies: TemporalModelGatewayDependenciesV01,
): Promise<TemporalModelGatewayResultV01> {
  const result = await invokeModelGatewayV01(input, {
    ...dependencies,
    provider_failure_fallback: true,
    async deterministic_execute(purposeInput, lifecycle) {
      if (purposeInput.input_kind !== TEMPORAL_MODEL_GATEWAY_PURPOSE_V01) {
        throw new Error("purpose_mismatch");
      }
      return {
        purpose: TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
        preview: await dependencies.deterministic_execute(
          purposeInput,
          lifecycle,
        ),
      };
    },
  });
  if (result.output.purpose !== TEMPORAL_MODEL_GATEWAY_PURPOSE_V01) {
    throw gatewayFailure("model_gateway_provider_response_invalid");
  }
  return {
    generator:
      result.execution === "live"
        ? "openai"
        : result.execution === "fallback"
          ? "mock_fallback"
          : "mock",
    model:
      result.execution === "live" && "model_identifier" in result.output
        ? result.output.model_identifier
        : null,
    preview: result.output.preview,
    model_invocation_receipt: result.model_invocation_receipt,
  };
}

async function invokeModelGatewayV01(
  input: unknown,
  dependencies: InternalModelGatewayDependenciesV01,
): Promise<InternalGatewayResultV01> {
  const envelope = validateModelInvocationEnvelopeV01(input);
  const now = dependencies.now ?? (() => new Date());
  const started = now();
  const adapter = dependencies.adapter ?? createOpenAIResponsesAdapterV01();
  const adapterImplementation = adapter.describe(envelope.purpose);
  const lifecycle = createGatewayInvocationLifecycle(
    envelope.cancellation.signal,
    envelope.timeout_ms,
  );

  try {
    const scope = resolveCanonicalScopeRegistration(envelope, dependencies);
    const base = {
      envelope,
      workspace_id: scope.workspace_id,
      project_id: scope.project_id,
      started,
      now,
    };

    try {
      lifecycle.throwIfStopped();
    } catch (error) {
      if (isGatewayLifecycleStop(error)) {
        throw lifecycleGatewayFailure(error.code, base, {
          ...selectionImplementation(envelope, adapterImplementation),
          egress_attempted: false,
          input_bytes_used: null,
          provider_calls_used: 0,
        });
      }
      throw error;
    }

    try {
      const rootAvailability = await lifecycle.run(() =>
        (dependencies.read_root_availability ?? readRootAvailabilityV01)(
          scope.canonical_root,
        ),
      );
      if (rootAvailability !== "available") {
        throw gatewayFailure("model_gateway_scope_refused");
      }
      lifecycle.throwIfStopped();
    } catch (error) {
      if (isGatewayLifecycleStop(error)) {
        throw lifecycleGatewayFailure(error.code, base, {
          ...selectionImplementation(envelope, adapterImplementation),
          egress_attempted: false,
          input_bytes_used: null,
          provider_calls_used: 0,
        });
      }
      if (error instanceof ModelGatewayInvocationErrorV01) throw error;
      throw gatewayFailure("model_gateway_scope_refused");
    }

    if (envelope.execution_mode === "deterministic") {
      return await executeDeterministically(
        envelope,
        dependencies,
        base,
        lifecycle,
        "explicit_deterministic",
      );
    }

    let adapterSession: ModelAdapterSessionV01 | null;
    try {
      adapterSession = await lifecycle.run(() =>
        adapter.prepare(envelope.purpose, lifecycle.signal),
      );
      lifecycle.throwIfStopped();
    } catch (error) {
      if (isGatewayLifecycleStop(error)) {
        throw lifecycleGatewayFailure(error.code, base, {
          ...adapterImplementation,
          execution_mode: "live",
          selection_reason: "requested_live",
          egress_attempted: false,
          input_bytes_used: null,
          provider_calls_used: 0,
        });
      }
      throw gatewayFailure(
        "model_gateway_transport_failed",
        buildReceipt({
          ...base,
          ...adapterImplementation,
          execution_mode: "live",
          selection_reason: "requested_live",
          status: "failed",
          outcome: "provider_failure",
          egress_attempted: false,
          egress_status: "did_not_occur",
          usage: null,
          budget_decision: "not_used",
          input_bytes_used: null,
          provider_calls_used: 0,
          failure_code: "model_gateway_transport_failed",
        }),
      );
    }

    if (!adapterSession) {
      return await executeDeterministically(
        envelope,
        dependencies,
        base,
        lifecycle,
        "provider_unavailable",
      );
    }

    try {
      return await invokeLiveAdapter(
        envelope,
        scope.project_id,
        adapterSession,
        base,
        lifecycle,
      );
    } catch (error) {
      if (
        dependencies.provider_failure_fallback &&
        isFallbackEligibleGatewayFailure(error)
      ) {
        return await executeDeterministically(
          envelope,
          dependencies,
          base,
          lifecycle,
          "provider_failure_fallback",
          error.receipt,
        );
      }
      throw error;
    }
  } finally {
    lifecycle.dispose();
  }
}

export function validateObserveModelInvocationEnvelopeV01(
  input: unknown,
): ObserveModelInvocationEnvelopeV01 {
  const envelope = validateModelInvocationEnvelopeV01(input);
  if (envelope.purpose !== OBSERVE_MODEL_GATEWAY_PURPOSE_V01) invalid();
  return envelope;
}

export function validatePlannerModelInvocationEnvelopeV01(
  input: unknown,
): PlannerModelInvocationEnvelopeV01 {
  const envelope = validateModelInvocationEnvelopeV01(input);
  if (envelope.purpose !== PLANNER_MODEL_GATEWAY_PURPOSE_V01) invalid();
  return envelope;
}

export function validateTemporalModelInvocationEnvelopeV01(
  input: unknown,
): TemporalModelInvocationEnvelopeV01 {
  const envelope = validateModelInvocationEnvelopeV01(input);
  if (envelope.purpose !== TEMPORAL_MODEL_GATEWAY_PURPOSE_V01) invalid();
  return envelope;
}

export function validateModelInvocationEnvelopeV01(
  input: unknown,
): ModelInvocationEnvelopeV01 {
  try {
    const record = requirePlainRecord(input);
    requireExactKeys(
      record,
      [
        "envelope_version",
        "invocation_id",
        "workspace_id",
        "project_id",
        "purpose",
        "data_classification",
        "provenance_refs",
        "privacy",
        "budget",
        "timeout_ms",
        "cancellation",
        "execution_mode",
        "policy",
        "input",
      ],
      ["project_root"],
    );
    if (
      readOwn(record, "envelope_version") !==
      MODEL_INVOCATION_ENVELOPE_VERSION_V01
    ) {
      invalid();
    }
    const purpose = readOwn(record, "purpose");
    if (!isOneOf(purpose, MODEL_GATEWAY_PURPOSES_V01)) invalid();
    const invocationId = requireSafeIdentifier(readOwn(record, "invocation_id"));
    const workspaceId = requireCanonicalId(
      readOwn(record, "workspace_id"),
      "workspace",
    );
    const projectId = requireCanonicalId(
      readOwn(record, "project_id"),
      "project",
    );
    const dataClassification = readOwn(record, "data_classification");
    if (
      !isOneOf(dataClassification, [
        "public_safe",
        "private",
        "local_only",
        "secret",
      ])
    ) {
      invalid();
    }
    const executionMode = readOwn(record, "execution_mode");
    if (!isOneOf(executionMode, ["live", "deterministic"])) invalid();
    const rawPurposeInput = readOwn(record, "input");
    if (
      executionMode === "live" &&
      (dataClassification === "local_only" || dataClassification === "secret")
    ) {
      invalid();
    }

    const common = {
      envelope_version: MODEL_INVOCATION_ENVELOPE_VERSION_V01,
      invocation_id: invocationId,
      workspace_id: workspaceId,
      project_id: projectId,
      data_classification: dataClassification,
      provenance_refs: validateProvenance(readOwn(record, "provenance_refs")),
      privacy: validatePrivacy(readOwn(record, "privacy"), executionMode),
      budget: validateBudget(readOwn(record, "budget"), executionMode, purpose),
      timeout_ms: requireInteger(readOwn(record, "timeout_ms"), 1, MAX_TIMEOUT_MS),
      cancellation: validateCancellation(readOwn(record, "cancellation")),
      execution_mode: executionMode,
      policy: validatePolicy(readOwn(record, "policy")),
      ...(Object.hasOwn(record, "project_root")
        ? { project_root: validateProjectRoot(readOwn(record, "project_root")) }
        : {}),
    };

    if (purpose === OBSERVE_MODEL_GATEWAY_PURPOSE_V01) {
      const purposeInput = validatePurposeInput(rawPurposeInput, purpose, projectId);
      validatePurposeInputSafety(purpose, purposeInput);
      return { ...common, purpose, input: purposeInput };
    }
    if (purpose === PLANNER_MODEL_GATEWAY_PURPOSE_V01) {
      const purposeInput = validatePurposeInput(rawPurposeInput, purpose, projectId);
      validatePurposeInputSafety(purpose, purposeInput);
      return { ...common, purpose, input: purposeInput };
    }
    const purposeInput = validatePurposeInput(rawPurposeInput, purpose, projectId);
    validatePurposeInputSafety(purpose, purposeInput);
    return { ...common, purpose, input: purposeInput };
  } catch (error) {
    if (error instanceof ModelGatewayInvocationErrorV01) throw error;
    throw gatewayFailure("model_gateway_invalid_envelope");
  }
}

function resolveCanonicalScopeRegistration(
  envelope: ModelInvocationEnvelopeV01,
  dependencies: SharedModelGatewayDependenciesV01,
) {
  const db = (dependencies.open_database ?? openDatabase)();
  try {
    const registration = readCanonicalProjectWithRootV01(db, {
      workspace_id: envelope.workspace_id,
      project_id: envelope.project_id,
    });
    if (!registration) throw new Error("scope");
    const canonicalRoot = registration.root_binding.local_root;
    if (envelope.project_root) {
      if (
        envelope.project_root.path_flavor !== canonicalRoot.path_flavor ||
        envelope.project_root.normalized_path !== canonicalRoot.normalized_path
      ) {
        throw new Error("scope");
      }
      const byRoot = findCanonicalProjectByLocalRootV01(db, {
        workspace_id: envelope.workspace_id,
        local_root: {
          local_root_ref_version: LOCAL_PROJECT_ROOT_REF_VERSION_V01,
          ref_kind: "local_project_root",
          ...envelope.project_root,
        },
      });
      if (!byRoot || byRoot.project.project_id !== registration.project.project_id) {
        throw new Error("scope");
      }
    }
    if (envelope.policy.invocation_origin === "interactive") {
      const active = readActiveProjectSelectionV01(db, envelope.workspace_id);
      if (
        envelope.policy.expected_active_project_id !== envelope.project_id ||
        active?.project_id !== envelope.project_id ||
        active.selection_revision !==
          envelope.policy.expected_active_selection_revision
      ) {
        throw new Error("scope");
      }
    } else {
      // R3 requires a later capability grant for provider/model automation.
      throw gatewayFailure("model_gateway_policy_refused");
    }
    return {
      workspace_id: registration.project.workspace_id,
      project_id: registration.project.project_id,
      canonical_root: canonicalRoot.normalized_path,
    };
  } catch (error) {
    if (error instanceof ModelGatewayInvocationErrorV01) throw error;
    throw gatewayFailure("model_gateway_scope_refused");
  } finally {
    db.close();
  }
}

async function executeDeterministically(
  envelope: ModelInvocationEnvelopeV01,
  dependencies: InternalModelGatewayDependenciesV01,
  base: ReceiptBase,
  lifecycle: GatewayInvocationLifecycle,
  selectionReason:
    | "explicit_deterministic"
    | "provider_unavailable"
    | "provider_failure_fallback",
  priorReceipt: ModelInvocationReceiptV01 | null = null,
): Promise<InternalGatewayResultV01> {
  const implementation = deterministicImplementation(envelope.purpose);
  const priorEgress = priorReceipt?.egress_attempted === true;
  const inputBytesUsed = priorReceipt?.budget.input_bytes_used ?? null;
  const providerCallsUsed: 0 | 1 = priorEgress ? 1 : 0;
  let output: DeterministicOutputV01;
  try {
    output = await lifecycle.run(() =>
      dependencies.deterministic_execute(envelope.input, {
        signal: lifecycle.signal,
      }),
    );
    lifecycle.throwIfStopped();
    if (output.purpose !== envelope.purpose) throw new Error("purpose_mismatch");
  } catch (error) {
    if (isGatewayLifecycleStop(error)) {
      throw lifecycleGatewayFailure(error.code, base, {
        ...implementation,
        execution_mode: "deterministic",
        selection_reason: selectionReason,
        egress_attempted: priorEgress,
        input_bytes_used: inputBytesUsed,
        provider_calls_used: providerCallsUsed,
      });
    }
    throw gatewayFailure(
      "model_gateway_deterministic_failed",
      buildReceipt({
        ...base,
        ...implementation,
        execution_mode: "deterministic",
        selection_reason: selectionReason,
        status: "failed",
        outcome: "deterministic_failure",
        egress_attempted: priorEgress,
        egress_status: priorEgress ? "occurred" : "did_not_occur",
        usage: null,
        budget_decision: priorEgress ? "within_budget" : "not_used",
        input_bytes_used: inputBytesUsed,
        provider_calls_used: providerCallsUsed,
        failure_code: "model_gateway_deterministic_failed",
      }),
    );
  }
  return {
    execution:
      selectionReason === "provider_failure_fallback"
        ? "fallback"
        : "deterministic",
    output,
    model_invocation_receipt: buildReceipt({
      ...base,
      ...implementation,
      execution_mode: "deterministic",
      selection_reason: selectionReason,
      status: "completed",
      outcome:
        selectionReason === "provider_failure_fallback"
          ? "deterministic_fallback_success"
          : "deterministic_success",
      egress_attempted: priorEgress,
      egress_status: priorEgress ? "occurred" : "did_not_occur",
      usage: null,
      budget_decision: priorEgress ? "within_budget" : "not_used",
      input_bytes_used: inputBytesUsed,
      provider_calls_used: providerCallsUsed,
      failure_code:
        selectionReason === "provider_failure_fallback"
          ? priorReceipt?.failure_code ?? "model_gateway_transport_failed"
          : null,
    }),
  };
}

async function invokeLiveAdapter(
  envelope: ModelInvocationEnvelopeV01,
  canonicalProjectId: string,
  adapterSession: ModelAdapterSessionV01,
  base: ReceiptBase,
  lifecycle: GatewayInvocationLifecycle,
): Promise<InternalGatewayResultV01> {
  let egressAttempted = false;
  let inputBytesUsed: number | null = null;

  try {
    lifecycle.throwIfStopped();
    if (adapterSession.purpose !== envelope.purpose) {
      throw gatewayFailure("model_gateway_provider_response_invalid");
    }
    const result = await lifecycle.run(() =>
      adapterSession.invoke(
        { canonical_project_id: canonicalProjectId, ...envelope.input },
        {
          signal: lifecycle.signal,
          budget: envelope.budget,
          retention_class: envelope.privacy.retention_class,
          mark_egress_attempted() {
            lifecycle.throwIfStopped();
            if (egressAttempted) {
              throw gatewayFailure("model_gateway_budget_refused");
            }
            egressAttempted = true;
          },
          report_input_bytes(bytes) {
            lifecycle.throwIfStopped();
            if (
              !Number.isSafeInteger(bytes) ||
              bytes < 0 ||
              bytes > envelope.budget.max_input_bytes
            ) {
              throw gatewayFailure("model_gateway_budget_refused");
            }
            inputBytesUsed = bytes;
          },
        },
      ),
    );
    lifecycle.throwIfStopped();
    if (result.purpose !== envelope.purpose) {
      throw gatewayFailure("model_gateway_provider_response_invalid");
    }
    if (result.usage?.output_tokens && result.usage.output_tokens > envelope.budget.max_output_tokens) {
      throw gatewayFailure("model_gateway_budget_refused");
    }
    return {
      execution: "live",
      output: result,
      model_invocation_receipt: buildReceipt({
        ...base,
        implementation_id: adapterSession.implementation_id,
        implementation_version: adapterSession.implementation_version,
        execution_mode: "live",
        selection_reason: "requested_live",
        status: "completed",
        outcome: "live_success",
        egress_attempted: egressAttempted,
        egress_status: egressAttempted ? "occurred" : "did_not_occur",
        usage: result.usage,
        budget_decision: "within_budget",
        input_bytes_used: inputBytesUsed,
        provider_calls_used: egressAttempted ? 1 : 0,
        failure_code: null,
      }),
    };
  } catch (error) {
    const failureCode = normalizeFailureCode(error);
    const cancelled =
      failureCode === "model_gateway_cancelled" ||
      failureCode === "model_gateway_timeout";
    const blocked =
      failureCode === "model_gateway_budget_refused" ||
      failureCode === "model_gateway_egress_refused";
    throw gatewayFailure(
      failureCode,
      buildReceipt({
        ...base,
        implementation_id: adapterSession.implementation_id,
        implementation_version: adapterSession.implementation_version,
        execution_mode: "live",
        selection_reason: "requested_live",
        status: cancelled ? "cancelled" : blocked ? "blocked" : "failed",
        outcome:
          failureCode === "model_gateway_timeout"
            ? "timeout"
            : failureCode === "model_gateway_cancelled"
              ? "cancelled"
              : blocked
                ? "refused"
                : "provider_failure",
        egress_attempted: egressAttempted,
        egress_status:
          blocked && !egressAttempted
            ? "blocked"
            : egressAttempted
              ? "occurred"
              : "did_not_occur",
        usage: null,
        budget_decision: blocked
          ? "refused"
          : egressAttempted
            ? "within_budget"
            : "not_used",
        input_bytes_used: inputBytesUsed,
        provider_calls_used: egressAttempted ? 1 : 0,
        failure_code: failureCode,
      }),
    );
  }
}

type GatewayLifecycleFailureCode =
  | "model_gateway_cancelled"
  | "model_gateway_timeout";

interface GatewayInvocationLifecycle {
  signal: AbortSignal;
  run<T>(operation: () => T | Promise<T>): Promise<T>;
  throwIfStopped(): void;
  dispose(): void;
}

class GatewayLifecycleStop extends Error {
  constructor(readonly code: GatewayLifecycleFailureCode) {
    super("Model gateway invocation stopped.");
    this.name = "GatewayLifecycleStop";
  }
}

function createGatewayInvocationLifecycle(
  externalSignal: AbortSignal,
  timeoutMs: number,
): GatewayInvocationLifecycle {
  const controller = new AbortController();
  const deadline = Date.now() + timeoutMs;
  let stopCode: GatewayLifecycleFailureCode | null = null;
  let resolveStop!: (code: GatewayLifecycleFailureCode) => void;
  const stopped = new Promise<GatewayLifecycleFailureCode>((resolve) => {
    resolveStop = resolve;
  });
  const stop = (code: GatewayLifecycleFailureCode) => {
    if (stopCode) return;
    stopCode = code;
    controller.abort();
    resolveStop(code);
  };
  const onExternalAbort = () => stop("model_gateway_cancelled");

  externalSignal.addEventListener("abort", onExternalAbort, { once: true });
  if (externalSignal.aborted) onExternalAbort();
  const timeout = setTimeout(() => stop("model_gateway_timeout"), timeoutMs);

  const throwIfStopped = () => {
    if (!stopCode && Date.now() >= deadline) stop("model_gateway_timeout");
    if (stopCode) throw new GatewayLifecycleStop(stopCode);
  };

  return {
    signal: controller.signal,
    async run<T>(operation: () => T | Promise<T>): Promise<T> {
      throwIfStopped();
      const operationOutcome = Promise.resolve()
        .then(operation)
        .then(
          (value) => ({ kind: "value" as const, value }),
          (error: unknown) => ({ kind: "error" as const, error }),
        );
      const stopOutcome = stopped.then((code) => ({
        kind: "stop" as const,
        code,
      }));
      const outcome = await Promise.race([operationOutcome, stopOutcome]);
      if (outcome.kind === "stop") throw new GatewayLifecycleStop(outcome.code);
      throwIfStopped();
      if (outcome.kind === "error") throw outcome.error;
      return outcome.value;
    },
    throwIfStopped,
    dispose() {
      clearTimeout(timeout);
      externalSignal.removeEventListener("abort", onExternalAbort);
    },
  };
}

function lifecycleGatewayFailure(
  code: GatewayLifecycleFailureCode,
  base: ReceiptBase,
  implementation: ModelAdapterImplementationV01 & {
    execution_mode: ModelGatewayExecutionModeV01;
    selection_reason: ModelInvocationReceiptV01["selection_reason"];
    egress_attempted: boolean;
    input_bytes_used: number | null;
    provider_calls_used: 0 | 1;
  },
) {
  return gatewayFailure(
    code,
    buildReceipt({
      ...base,
      ...implementation,
      status: "cancelled",
      outcome: code === "model_gateway_timeout" ? "timeout" : "cancelled",
      egress_status: implementation.egress_attempted
        ? "occurred"
        : "did_not_occur",
      usage: null,
      budget_decision: implementation.egress_attempted
        ? "within_budget"
        : "not_used",
      failure_code: code,
    }),
  );
}

function isGatewayLifecycleStop(value: unknown): value is GatewayLifecycleStop {
  return value instanceof GatewayLifecycleStop;
}

type ReceiptBase = {
  envelope: ModelInvocationEnvelopeV01;
  workspace_id: string;
  project_id: string;
  started: Date;
  now: () => Date;
};

function buildReceipt(
  input: ReceiptBase &
    ModelAdapterImplementationV01 & {
      execution_mode: ModelGatewayExecutionModeV01;
      selection_reason: ModelInvocationReceiptV01["selection_reason"];
      status: ModelInvocationReceiptV01["status"];
      outcome: ModelInvocationReceiptV01["outcome"];
      egress_attempted: boolean;
      egress_status: ModelInvocationReceiptV01["egress_status"];
      usage: ModelInvocationReceiptV01["usage"];
      budget_decision: ModelInvocationReceiptV01["budget"]["decision"];
      input_bytes_used: number | null;
      provider_calls_used: 0 | 1;
      failure_code: ModelGatewayFailureCodeV01 | null;
    },
): ModelInvocationReceiptV01 {
  const finished = input.now();
  return {
    receipt_version: MODEL_INVOCATION_RECEIPT_VERSION_V01,
    gateway_version: MODEL_GATEWAY_VERSION_V01,
    invocation_id: input.envelope.invocation_id,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    purpose: input.envelope.purpose,
    implementation_id: boundedReceiptIdentifier(input.implementation_id),
    implementation_version: boundedReceiptIdentifier(input.implementation_version),
    requested_mode: input.envelope.execution_mode,
    execution_mode: input.execution_mode,
    selection_reason: input.selection_reason,
    started_at: input.started.toISOString(),
    finished_at: finished.toISOString(),
    latency_ms: Math.max(0, finished.getTime() - input.started.getTime()),
    status: input.status,
    outcome: input.outcome,
    egress_attempted: input.egress_attempted,
    egress_status: input.egress_status,
    usage: input.usage,
    budget: {
      decision: input.budget_decision,
      input_bytes_limit: input.envelope.budget.max_input_bytes,
      input_bytes_used: input.input_bytes_used,
      output_tokens_limit: input.envelope.budget.max_output_tokens,
      provider_call_limit: input.envelope.budget.max_provider_calls,
      provider_calls_used: input.provider_calls_used,
    },
    failure_code: input.failure_code,
    data_classification: input.envelope.data_classification,
    retention_class: "none",
    privacy_decision:
      input.egress_status === "occurred"
        ? "provider_egress_approved"
        : input.egress_status === "blocked"
          ? "provider_egress_blocked"
          : "provider_egress_not_used",
    provenance_refs: [...input.envelope.provenance_refs],
    raw_prompt_persisted: false,
    raw_response_persisted: false,
    hidden_reasoning_persisted: false,
    receipt_is_semantic_authority: false,
  };
}

function normalizeFailureCode(error: unknown): ModelGatewayFailureCodeV01 {
  if (isGatewayLifecycleStop(error)) return error.code;
  if (error instanceof ModelGatewayInvocationErrorV01) return error.code;
  if (isModelEgressBoundaryError(error)) return "model_gateway_egress_refused";
  if (error instanceof ModelGatewayAdapterFailureV01) {
    if (error.code === "adapter_provider_rejected") {
      return "model_gateway_provider_rejected";
    }
    if (error.code === "adapter_response_invalid") {
      return "model_gateway_provider_response_invalid";
    }
  }
  return "model_gateway_transport_failed";
}

function isFallbackEligibleGatewayFailure(
  error: unknown,
): error is ModelGatewayInvocationErrorV01 & {
  receipt: ModelInvocationReceiptV01;
} {
  return (
    error instanceof ModelGatewayInvocationErrorV01 &&
    error.receipt !== null &&
    error.receipt.egress_attempted &&
    (error.code === "model_gateway_provider_rejected" ||
      error.code === "model_gateway_provider_response_invalid" ||
      error.code === "model_gateway_transport_failed")
  );
}

function selectionImplementation(
  envelope: ModelInvocationEnvelopeV01,
  adapter: ModelAdapterImplementationV01,
) {
  if (envelope.execution_mode === "deterministic") {
    return {
      ...deterministicImplementation(envelope.purpose),
      execution_mode: "deterministic" as const,
      selection_reason: "explicit_deterministic" as const,
    };
  }
  return {
    ...adapter,
    execution_mode: "live" as const,
    selection_reason: "requested_live" as const,
  };
}

function deterministicImplementation(
  purpose: ModelGatewayPurposeV01,
): ModelAdapterImplementationV01 {
  if (purpose === OBSERVE_MODEL_GATEWAY_PURPOSE_V01) {
    return {
      implementation_id: DETERMINISTIC_OBSERVE_IMPLEMENTATION_ID_V01,
      implementation_version: DETERMINISTIC_OBSERVE_IMPLEMENTATION_VERSION_V01,
    };
  }
  if (purpose === PLANNER_MODEL_GATEWAY_PURPOSE_V01) {
    return {
      implementation_id: DETERMINISTIC_PLANNER_IMPLEMENTATION_ID_V01,
      implementation_version: DETERMINISTIC_PLANNER_IMPLEMENTATION_VERSION_V01,
    };
  }
  return {
    implementation_id: DETERMINISTIC_TEMPORAL_IMPLEMENTATION_ID_V01,
    implementation_version: DETERMINISTIC_TEMPORAL_IMPLEMENTATION_VERSION_V01,
  };
}

function validatePrivacy(
  value: unknown,
  mode: ModelGatewayExecutionModeV01,
): ModelInvocationEnvelopeV01["privacy"] {
  const record = requirePlainRecord(value);
  requireExactKeys(record, ["provider_egress", "retention_class"]);
  const providerEgress = readOwn(record, "provider_egress");
  if (
    providerEgress !== (mode === "live" ? "allow" : "deny") ||
    readOwn(record, "retention_class") !== "none"
  ) {
    invalid();
  }
  return {
    provider_egress: mode === "live" ? "allow" : "deny",
    retention_class: "none",
  };
}

function validateBudget(
  value: unknown,
  mode: ModelGatewayExecutionModeV01,
  purpose: ModelGatewayPurposeV01,
): ModelInvocationEnvelopeV01["budget"] {
  const record = requirePlainRecord(value);
  requireExactKeys(record, [
    "max_input_bytes",
    "max_output_tokens",
    "max_provider_calls",
  ]);
  const maxInputBytes = requireInteger(
    readOwn(record, "max_input_bytes"),
    1,
    maximumInputBytesForPurpose(purpose),
  );
  const maxOutputTokens = requireInteger(
    readOwn(record, "max_output_tokens"),
    1,
    MAX_OUTPUT_TOKENS,
  );
  const maxProviderCalls = readOwn(record, "max_provider_calls");
  if (maxProviderCalls !== (mode === "live" ? 1 : 0)) invalid();
  return {
    max_input_bytes: maxInputBytes,
    max_output_tokens: maxOutputTokens,
    max_provider_calls: mode === "live" ? 1 : 0,
  };
}

function maximumInputBytesForPurpose(purpose: ModelGatewayPurposeV01) {
  if (purpose === OBSERVE_MODEL_GATEWAY_PURPOSE_V01) {
    return OBSERVE_MODEL_EGRESS_LIMITS.finalRequestBytes;
  }
  if (purpose === PLANNER_MODEL_GATEWAY_PURPOSE_V01) {
    return PLANNER_MODEL_EGRESS_LIMITS.finalRequestBytes;
  }
  return TEMPORAL_MODEL_EGRESS_LIMITS.finalRequestBytes;
}

function validateCancellation(value: unknown) {
  const record = requirePlainRecord(value);
  requireExactKeys(record, ["signal"]);
  const signal = readOwn(record, "signal");
  if (
    typeof signal !== "object" ||
    signal === null ||
    typeof (signal as AbortSignal).aborted !== "boolean" ||
    typeof (signal as AbortSignal).addEventListener !== "function" ||
    typeof (signal as AbortSignal).removeEventListener !== "function"
  ) {
    invalid();
  }
  return { signal: signal as AbortSignal };
}

function validatePolicy(value: unknown): ModelInvocationEnvelopeV01["policy"] {
  const record = requirePlainRecord(value);
  const origin = readOwn(record, "invocation_origin");
  if (origin === "interactive") {
    requireExactKeys(record, [
      "invocation_origin",
      "expected_active_project_id",
      "expected_active_selection_revision",
    ]);
    return {
      invocation_origin: "interactive",
      expected_active_project_id: requireCanonicalId(
        readOwn(record, "expected_active_project_id"),
        "project",
      ),
      expected_active_selection_revision: requireInteger(
        readOwn(record, "expected_active_selection_revision"),
        1,
        Number.MAX_SAFE_INTEGER,
      ),
    };
  }
  if (origin === "policy_triggered") {
    requireExactKeys(record, ["invocation_origin", "automation_control_revision"]);
    return {
      invocation_origin: "policy_triggered",
      automation_control_revision: requireInteger(
        readOwn(record, "automation_control_revision"),
        1,
        Number.MAX_SAFE_INTEGER,
      ),
    };
  }
  return invalid();
}

function validateProjectRoot(value: unknown) {
  const record = requirePlainRecord(value);
  requireExactKeys(record, ["path_flavor", "normalized_path"]);
  const flavor = readOwn(record, "path_flavor");
  const normalizedPath = readOwn(record, "normalized_path");
  if (
    !isOneOf(flavor, ["posix", "win32"]) ||
    typeof normalizedPath !== "string" ||
    normalizedPath.length < 1 ||
    normalizedPath.length > 8_192 ||
    normalizedPath.includes("\0")
  ) {
    invalid();
  }
  return { path_flavor: flavor, normalized_path: normalizedPath };
}

function validatePurposeInput(
  value: unknown,
  purpose: typeof OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
  projectId: string,
): ObserveModelInvocationEnvelopeV01["input"];
function validatePurposeInput(
  value: unknown,
  purpose: typeof PLANNER_MODEL_GATEWAY_PURPOSE_V01,
  projectId: string,
): PlannerModelInvocationEnvelopeV01["input"];
function validatePurposeInput(
  value: unknown,
  purpose: typeof TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
  projectId: string,
): TemporalModelInvocationEnvelopeV01["input"];
function validatePurposeInput(
  value: unknown,
  purpose: ModelGatewayPurposeV01,
  projectId: string,
): ModelInvocationEnvelopeV01["input"] {
  const record = requirePlainRecord(value);
  if (purpose === OBSERVE_MODEL_GATEWAY_PURPOSE_V01) {
    requireExactKeys(record, ["input_kind", "message", "current_state"]);
    if (readOwn(record, "input_kind") !== purpose) invalid();
    const message = readOwn(record, "message");
    const currentState = readOwn(record, "current_state");
    if (
      typeof message !== "string" ||
      message.trim().length === 0 ||
      message.length > OBSERVE_MODEL_EGRESS_LIMITS.messageCharacters ||
      !Array.isArray(currentState) ||
      currentState.length > OBSERVE_MODEL_EGRESS_LIMITS.stateItems
    ) {
      invalid();
    }
    validateProjectScopedStateInput(currentState as StateEntry[], projectId);
    return { input_kind: purpose, message, current_state: currentState as StateEntry[] };
  }
  if (purpose === PLANNER_MODEL_GATEWAY_PURPOSE_V01) {
    requireExactKeys(record, ["input_kind", "message", "brief"]);
    if (readOwn(record, "input_kind") !== purpose) invalid();
    const message = readOwn(record, "message");
    const brief = requirePlainRecord(readOwn(record, "brief"));
    if (
      typeof message !== "string" ||
      message.trim().length === 0 ||
      message.length > PLANNER_MODEL_EGRESS_LIMITS.messageBytes ||
      readOwn(brief, "scope") !== projectId
    ) {
      invalid();
    }
    validatePlannerBriefScopes(brief, projectId);
    assertNoProviderControlFields(brief);
    return {
      input_kind: purpose,
      message,
      brief: brief as PlannerModelInvocationEnvelopeV01["input"]["brief"],
    };
  }
  requireExactKeys(record, ["input_kind", "context"]);
  if (readOwn(record, "input_kind") !== purpose) invalid();
  const context = requirePlainRecord(readOwn(record, "context"));
  requireExactKeys(context, [
    "scope",
    "as_of",
    "current_interpretation",
    "active_prior_context",
    "evidence_anchors",
    "summary_refs",
    "source_authority_profile",
    "counterexamples",
    "residual_tensions",
    "user_preferences",
    "safe_next_step",
    "non_authority_boundary",
    "active_context_admission_rationale",
    "active_context_admission",
    "suppressed_alternatives",
    "temporal_hierarchy_view",
    "memory_lifecycle_view",
    "interpretive_drivers",
    "axis_pressures",
  ]);
  if (readOwn(context, "scope") !== projectId) invalid();
  assertNoProviderControlFields(context);
  return {
    input_kind: purpose,
    context: context as TemporalModelInvocationEnvelopeV01["input"]["context"],
  };
}

function validatePurposeInputSafety(
  purpose: ModelGatewayPurposeV01,
  input: ModelInvocationEnvelopeV01["input"],
) {
  const value =
    input.input_kind === PLANNER_MODEL_GATEWAY_PURPOSE_V01
      ? { message: input.message }
      : input;
  const cloned = cloneBoundedModelEgressJson(purpose, value, {
    maximumDepth: 12,
    maximumNodes: 4_096,
  });
  const serialized = serializeModelEgressJson(purpose, cloned, 196_608);
  assertModelEgressTextIsSafe(purpose, serialized);
}

function validateProjectScopedStateInput(state: StateEntry[], projectId: string) {
  for (let index = 0; index < state.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(state, String(index));
    if (!descriptor || !("value" in descriptor)) invalid();
    const item = requirePlainRecord(descriptor.value);
    if (
      readOwn(item, "scope") !== projectId ||
      typeof readOwn(item, "state_key") !== "string"
    ) {
      invalid();
    }
  }
}

function validatePlannerBriefScopes(
  brief: Record<string, unknown>,
  projectId: string,
) {
  for (const key of [
    "active_state",
    "future_state",
    "completed_state",
    "deprecated_state",
    "open_tensions",
    "pending_proposals",
  ]) {
    const value = readOwn(brief, key);
    if (!Array.isArray(value)) invalid();
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (!descriptor || !("value" in descriptor)) invalid();
      const row = requirePlainRecord(descriptor.value);
      if (Object.hasOwn(row, "scope") && readOwn(row, "scope") !== projectId) {
        invalid();
      }
    }
  }
}

function assertNoProviderControlFields(value: unknown) {
  const cloned = cloneBoundedModelEgressJson(
    TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
    value,
    { maximumDepth: 12, maximumNodes: 4_096 },
  );
  const visit = (node: unknown) => {
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    if (typeof node !== "object" || node === null) return;
    for (const [key, child] of Object.entries(node)) {
      if (PROVIDER_CONTROL_KEYS.has(key.toLowerCase())) invalid();
      visit(child);
    }
  };
  visit(cloned);
}

function validateProvenance(value: unknown): string[] {
  if (
    !Array.isArray(value) ||
    value.length < 1 ||
    value.length > MAX_PROVENANCE_REFS
  ) {
    invalid();
  }
  return value.map((item) => {
    if (typeof item !== "string" || !PROVENANCE_REF_PATTERN.test(item)) invalid();
    return item;
  });
}

function requirePlainRecord(value: unknown): Record<string, unknown> {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    (Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null)
  ) {
    invalid();
  }
  return value as Record<string, unknown>;
}

function readOwn(record: Record<string, unknown>, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  if (!descriptor || !("value" in descriptor)) invalid();
  return descriptor.value;
}

function requireExactKeys(
  record: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[] = [],
) {
  const keys = Reflect.ownKeys(record);
  if (keys.some((key) => typeof key !== "string")) invalid();
  const allowed = new Set([...required, ...optional]);
  if (
    keys.some((key) => typeof key !== "string" || !allowed.has(key)) ||
    required.some((key) => !Object.hasOwn(record, key))
  ) {
    invalid();
  }
}

function requireCanonicalId(value: unknown, kind: "workspace" | "project") {
  if (
    typeof value !== "string" ||
    !CANONICAL_ID_PATTERN.test(value) ||
    !value.startsWith(`${kind}:`) ||
    value === "project:augnes"
  ) {
    invalid();
  }
  return value.toLowerCase();
}

function requireSafeIdentifier(value: unknown) {
  if (typeof value !== "string" || !SAFE_IDENTIFIER_PATTERN.test(value)) invalid();
  return value;
}

function requireInteger(value: unknown, minimum: number, maximum: number) {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    invalid();
  }
  return value;
}

function isOneOf<T extends string>(
  value: unknown,
  values: readonly T[],
): value is T {
  return typeof value === "string" && values.includes(value as T);
}

function boundedReceiptIdentifier(value: string) {
  return SAFE_IDENTIFIER_PATTERN.test(value) ? value : "implementation.invalid";
}

function gatewayFailure(
  code: ModelGatewayFailureCodeV01,
  receipt: ModelInvocationReceiptV01 | null = null,
) {
  return new ModelGatewayInvocationErrorV01(code, receipt);
}

function invalid(): never {
  throw gatewayFailure("model_gateway_invalid_envelope");
}
