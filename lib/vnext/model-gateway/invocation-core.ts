import type { ProjectSelectionRevision } from "@/lib/vnext/project-selection";
import type Database from "better-sqlite3";

import { openDatabase } from "@/lib/db";
import { isModelEgressBoundaryError } from "@/lib/model-egress/bounded-model-payload";
import type { ValidatedProposal } from "@/lib/observe/proposal-contract";
import type { TemporalInterpretationPreview } from "@/lib/temporal-interpretation/types";
import {
  type GUIDE_BRIEF_INTERPRETATION_MODEL_GATEWAY_PURPOSE_V01,
  MODEL_GATEWAY_EGRESS_POLICY_VERSION_V01,
  MODEL_GATEWAY_PURPOSES_V01,
  MODEL_GATEWAY_VERSION_V01,
  MODEL_INVOCATION_ENVELOPE_VERSION_V01,
  MODEL_INVOCATION_RECEIPT_VERSION_V02,
  ModelGatewayAdapterFailureV01,
  ModelGatewayInvocationErrorV01,
  type OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
  type PLANNER_MODEL_GATEWAY_PURPOSE_V01,
  type TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
  type ModelAdapterImplementationV01,
  type ModelAdapterInvocationResultV01,
  type ModelAdapterSessionV01,
  type ModelAdapterV01,
  type ModelGatewayExecutionModeV01,
  type ModelGatewayFailureCodeV01,
  type ModelGatewayPolicyAuthorizationV01,
  type ModelGatewayPurposeV01,
  type ModelInvocationEnvelopeV01,
  type ModelInvocationReceiptV02,
  type PlannerRecommendationV01,
} from "@/lib/vnext/model-gateway/contracts";
import { assertModelGatewayCostBudgetCurrentV01, validateModelGatewayCostBudgetV01 } from "@/lib/vnext/model-gateway/cost-authority";
import { validateModelInvocationReceiptV02 } from "@/lib/vnext/model-gateway/model-invocation-receipt";
import { normalizeModelTransportFailureObservationV01 } from "@/lib/vnext/model-gateway/transport-failure-observation";
import { readRootAvailabilityV01 } from "@/lib/vnext/onboarding/local-project-onboarding";
import {
  findCanonicalProjectByLocalRootV01,
  normalizeLocalProjectRootRefV01,
  readCanonicalProjectWithRootV01,
  readDefaultWorkspaceIdentityV01,
} from "@/lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01 } from "@/lib/vnext/persistence/project-lifecycle-registry";
import { canonicalizeProtocolValueV01, createProtocolSha256V01 } from "@/lib/vnext/protocol-primitives";
import { LOCAL_PROJECT_ROOT_REF_VERSION_V01 } from "@/types/vnext/project-identity";

import {
  gatewayFailure,
  invalid,
  isOneOf,
  readOwn,
  requireCanonicalId,
  requireExactKeys,
  requireInteger,
  requirePlainRecord,
  requireSafeIdentifier,
  requireSelectionRevision,
  requireSha256,
} from "./invocation-guards";
export interface ModelGatewayCoreDependenciesV01 {
  open_database?: () => Database.Database;
  adapter?: ModelAdapterV01;
  read_root_availability?: typeof readRootAvailabilityV01;
  now?: () => Date;
  authorize_policy_invocation?: (
    envelope: ModelInvocationEnvelopeV01,
  ) => ModelGatewayPolicyAuthorizationV01;
  on_provider_egress_attempt?: () => void;
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
  }
  | {
    purpose: typeof GUIDE_BRIEF_INTERPRETATION_MODEL_GATEWAY_PURPOSE_V01;
    output: {
      coverage: "none";
      classification: "unsupported";
      candidate_tokens: [];
    };
  };

export interface InternalModelGatewayDependenciesV01
  extends ModelGatewayCoreDependenciesV01 {
  deterministic_execute: (
    input: ModelInvocationEnvelopeV01["input"],
    lifecycle: { signal: AbortSignal },
  ) => DeterministicOutputV01 | Promise<DeterministicOutputV01>;
  provider_failure_fallback: boolean;
  expected_route_status?: (session: ModelAdapterSessionV01, envelope: ModelInvocationEnvelopeV01) => "matched" | "receipt_refusal" | "bare_refusal";
}

export type InternalGatewayResultV01 = {
  execution: "live" | "deterministic" | "fallback";
  output: ModelAdapterInvocationResultV01 | DeterministicOutputV01;
  model_invocation_receipt: ModelInvocationReceiptV02;
};


/** Internal composition seam. Only the compatibility facade selects production methods. */
export interface GatewayMethodBindingV01 {
  readonly purpose: ModelGatewayPurposeV01;
  readonly maximum_input_bytes: number;
  readonly maximum_output_tokens: number;
  readonly maximum_timeout_ms: number;
  readonly requires_request_trace: boolean;
  readonly cost_budget: "required" | "optional" | "forbidden";
  readonly provider_unavailable_fallback: boolean;
  readonly deterministic_implementation: ModelAdapterImplementationV01;
  complete_envelope(common: GatewayCommonEnvelopeV01, rawInput: unknown, trace: string | null): ModelInvocationEnvelopeV01;
  cost_input_matches(envelope: ModelInvocationEnvelopeV01): boolean;
  local_identity(envelope: ModelInvocationEnvelopeV01): string | undefined;
  fingerprinted_output(result: ModelAdapterInvocationResultV01): { value: unknown } | null;
}
export type GatewayCommonEnvelopeV01 = Omit<ModelInvocationEnvelopeV01, "purpose" | "input" | "provider_request_trace_id">;
export type GatewayMethodResolverV01 = (purpose: ModelGatewayPurposeV01) => GatewayMethodBindingV01;
export interface ModelGatewayInteractiveAdmissionV01 {
  workspace_id: string;
  project_id: string;
  expected_active_selection_revision: ProjectSelectionRevision;
  project_root: {
    path_flavor: "posix" | "win32";
    normalized_path: string;
  };
  gateway_authorization_project_is_lab_experiment_meaning: false;
}

/**
 * Read-only admission material for a local interactive Gateway caller. The
 * returned identity authorizes Gateway scope only and must never be projected
 * into governed-actor model material.
 */
export function readModelGatewayInteractiveAdmissionForRootV01(
  projectRoot: string,
  dependencies: Pick<ModelGatewayCoreDependenciesV01, "open_database"> = {},
): ModelGatewayInteractiveAdmissionV01 {
  const db = (dependencies.open_database ?? openDatabase)();
  try {
    const workspace = readDefaultWorkspaceIdentityV01(db);
    if (!workspace) throw gatewayFailure("model_gateway_scope_refused");
    const localRoot = normalizeLocalProjectRootRefV01(projectRoot, {
      base_path: projectRoot,
    });
    const registration = findCanonicalProjectByLocalRootV01(db, {
      workspace_id: workspace.workspace_id,
      local_root: localRoot,
    });
    if (!registration) throw gatewayFailure("model_gateway_scope_refused");
    const active = readActiveProjectSelectionV01(db, workspace.workspace_id);
    if (!active || active.project_id !== registration.project.project_id) {
      throw gatewayFailure("model_gateway_scope_refused");
    }
    return {
      workspace_id: workspace.workspace_id,
      project_id: registration.project.project_id,
      expected_active_selection_revision: active.selection_revision,
      project_root: {
        path_flavor: registration.root_binding.local_root.path_flavor,
        normalized_path: registration.root_binding.local_root.normalized_path,
      },
      gateway_authorization_project_is_lab_experiment_meaning: false,
    };
  } finally {
    db.close();
  }
}

export async function invokeModelGatewayCoreV01(
  input: unknown,
  dependencies: InternalModelGatewayDependenciesV01 & { adapter: ModelAdapterV01 },
  resolveMethod: GatewayMethodResolverV01,
): Promise<InternalGatewayResultV01> {
  const envelope = validateModelInvocationEnvelopeCoreV01(input, resolveMethod);
  const method = resolveMethod(envelope.purpose);
  const now = dependencies.now ?? (() => new Date());
  const started = now();
  const adapter = dependencies.adapter;
  const adapterImplementation = adapter.describe(envelope.purpose);
  const lifecycle = createGatewayInvocationLifecycle(
    envelope.cancellation.signal,
    envelope.timeout_ms,
  );

  try {
    const scope = resolveCanonicalScopeRegistration(envelope, dependencies);
    const base = {
      envelope,
      method,
      workspace_id: scope.workspace_id,
      project_id: scope.project_id,
      adapter_implementation: adapterImplementation,
      grant_lineage_ref: scope.grant_lineage_ref,
      automation_control_lineage_ref:
        scope.automation_control_lineage_ref,
      started,
      now,
    };

    try {
      lifecycle.throwIfStopped();
    } catch (error) {
      if (isGatewayLifecycleStop(error)) {
        throw lifecycleGatewayFailure(error.code, base, {
          ...selectionImplementation(envelope, adapterImplementation, method),
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
          ...selectionImplementation(envelope, adapterImplementation, method),
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
      if (!method.provider_unavailable_fallback) {
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
      return await executeDeterministically(
        envelope,
        dependencies,
        base,
        lifecycle,
        "provider_unavailable",
      );
    }

    const routeStatus = dependencies.expected_route_status?.(adapterSession, envelope) ?? "matched";
    if (routeStatus === "bare_refusal") throw gatewayFailure("model_gateway_budget_refused");
    if (routeStatus === "receipt_refusal") {
      throw gatewayFailure(
        "model_gateway_budget_refused",
        buildReceipt({
          ...base,
          implementation_id: adapterSession.implementation_id,
          implementation_version: adapterSession.implementation_version,
          attempted_provider_ref: adapterSession.provider_ref,
          attempted_model_ref: adapterSession.model_ref,
          execution_mode: "live",
          selection_reason: "requested_live",
          status: "blocked",
          outcome: "refused",
          egress_attempted: false,
          egress_status: "blocked",
          usage: null,
          budget_decision: "refused",
          input_bytes_used: null,
          provider_calls_used: 0,
          failure_code: "model_gateway_budget_refused",
        }),
      );
    }

    if (method.cost_budget === "required" ||
      (method.cost_budget === "optional" && envelope.budget.cost_budget !== undefined)) {
      const costBudget = envelope.budget.cost_budget;
      if (!costBudget) {
        throw gatewayFailure("model_gateway_budget_refused");
      }
      if (
        canonicalizeProtocolValueV01(costBudget.authority.provider_ref) !==
        canonicalizeProtocolValueV01(adapterSession.provider_ref) ||
        canonicalizeProtocolValueV01(costBudget.authority.model_ref) !==
        canonicalizeProtocolValueV01(adapterSession.model_ref) ||
        costBudget.authority.workspace_id !== scope.workspace_id ||
        costBudget.authority.project_id !== scope.project_id ||
        costBudget.authority.purpose !== envelope.purpose ||
        costBudget.maximum_input_units !== envelope.budget.max_input_bytes ||
        costBudget.maximum_output_units !== envelope.budget.max_output_tokens ||
        costBudget.maximum_invocation_count !==
        envelope.budget.max_provider_calls ||
        costBudget.timeout_ms !== envelope.timeout_ms
      ) {
        throw gatewayFailure("model_gateway_budget_refused");
      }
      try {
        assertModelGatewayCostBudgetCurrentV01(
          costBudget,
          started.toISOString(),
        );
      } catch {
        throw gatewayFailure("model_gateway_budget_refused");
      }
      if (!method.cost_input_matches(envelope)) {
        throw gatewayFailure("model_gateway_budget_refused");
      }
    }

    try {
      return await invokeLiveAdapter(
        envelope,
        scope.project_id,
        adapterSession,
        base,
        lifecycle,
        dependencies.on_provider_egress_attempt,
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

export function validateModelInvocationEnvelopeCoreV01(
  input: unknown,
  resolveMethod: GatewayMethodResolverV01,
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
      ["project_root", "provider_request_trace_id"],
    );
    if (
      readOwn(record, "envelope_version") !==
      MODEL_INVOCATION_ENVELOPE_VERSION_V01
    ) {
      invalid();
    }
    const purpose = readOwn(record, "purpose");
    if (!isOneOf(purpose, MODEL_GATEWAY_PURPOSES_V01)) invalid();
    const method = resolveMethod(purpose);
    const providerRequestTraceId = Object.hasOwn(
      record,
      "provider_request_trace_id",
    )
      ? requireSafeIdentifier(readOwn(record, "provider_request_trace_id"))
      : null;
    if (
      method.requires_request_trace !==
      (providerRequestTraceId !== null)
    ) {
      invalid();
    }
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
      budget: validateBudget(readOwn(record, "budget"), executionMode, method),
      timeout_ms: requireInteger(
        readOwn(record, "timeout_ms"),
        1,
        method.maximum_timeout_ms,
      ),
      cancellation: validateCancellation(readOwn(record, "cancellation")),
      execution_mode: executionMode,
      policy: validatePolicy(readOwn(record, "policy")),
      ...(Object.hasOwn(record, "project_root")
        ? { project_root: validateProjectRoot(readOwn(record, "project_root")) }
        : {}),
    };

    return method.complete_envelope(common, rawPurposeInput, providerRequestTraceId);
  } catch (error) {
    if (error instanceof ModelGatewayInvocationErrorV01) throw error;
    throw gatewayFailure("model_gateway_invalid_envelope");
  }
}

function resolveCanonicalScopeRegistration(
  envelope: ModelInvocationEnvelopeV01,
  dependencies: ModelGatewayCoreDependenciesV01,
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
      let authorization: ModelGatewayPolicyAuthorizationV01 | undefined;
      try {
        authorization = dependencies.authorize_policy_invocation?.(envelope);
      } catch {
        throw gatewayFailure("model_gateway_policy_refused");
      }
      if (!authorization) {
        throw gatewayFailure("model_gateway_policy_refused");
      }
      validatePolicyAuthorization(envelope, authorization);
      return {
        workspace_id: registration.project.workspace_id,
        project_id: registration.project.project_id,
        canonical_root: canonicalRoot.normalized_path,
        grant_lineage_ref: copyPolicyLineageRef(
          authorization.grant_lineage_ref,
          "model_invocation_capability_grant",
        ),
        automation_control_lineage_ref: copyPolicyLineageRef(
          authorization.automation_control_lineage_ref,
          "project_automation_control",
        ),
      };
    }
    return {
      workspace_id: registration.project.workspace_id,
      project_id: registration.project.project_id,
      canonical_root: canonicalRoot.normalized_path,
      grant_lineage_ref: null,
      automation_control_lineage_ref: null,
    };
  } catch (error) {
    if (error instanceof ModelGatewayInvocationErrorV01) throw error;
    throw gatewayFailure("model_gateway_scope_refused");
  } finally {
    db.close();
  }
}

function validatePolicyAuthorization(
  envelope: ModelInvocationEnvelopeV01,
  authorization: ModelGatewayPolicyAuthorizationV01,
): void {
  if (envelope.policy.invocation_origin !== "policy_triggered") {
    throw gatewayFailure("model_gateway_policy_refused");
  }
  const policy = envelope.policy;
  if (
    authorization.workspace_id !== envelope.workspace_id ||
    authorization.project_id !== envelope.project_id ||
    authorization.work_id !== policy.work_id ||
    authorization.run_id !== policy.run_id ||
    authorization.automation_control_revision !==
    policy.automation_control_revision
  ) {
    throw gatewayFailure("model_gateway_policy_refused");
  }
  const grantRef = copyPolicyLineageRef(
    authorization.grant_lineage_ref,
    "model_invocation_capability_grant",
  );
  const controlRef = copyPolicyLineageRef(
    authorization.automation_control_lineage_ref,
    "project_automation_control",
  );
  if (
    grantRef.external_id !== policy.grant_id ||
    grantRef.source_ref !== policy.grant_fingerprint ||
    controlRef.external_id !==
    `${envelope.project_id}:automation-control:${policy.automation_control_revision}` ||
    controlRef.source_ref !==
    `control-revision:${policy.automation_control_revision}`
  ) {
    throw gatewayFailure("model_gateway_policy_refused");
  }
}

function copyPolicyLineageRef(
  value: ModelGatewayPolicyAuthorizationV01["grant_lineage_ref"],
  expectedType: "model_invocation_capability_grant" | "project_automation_control",
) {
  if (
    value.ref_version !== "external_ref.v0.1" ||
    value.ref_type !== expectedType ||
    !SAFE_IDENTIFIER_PATTERN.test(value.external_id) ||
    value.trust_class !== "direct_local_observation" ||
    typeof value.source_ref !== "string" ||
    !PROVENANCE_REF_PATTERN.test(value.source_ref) ||
    value.provider != null ||
    value.host != null ||
    value.compatibility_namespace != null
  ) {
    throw gatewayFailure("model_gateway_policy_refused");
  }
  return {
    ref_version: "external_ref.v0.1" as const,
    ref_type: expectedType,
    external_id: value.external_id,
    source_ref: value.source_ref,
    trust_class: "direct_local_observation" as const,
  };
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
  priorReceipt: ModelInvocationReceiptV02 | null = null,
): Promise<InternalGatewayResultV01> {
  const implementation = base.method.deterministic_implementation;
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
        attempted_provider_ref: priorReceipt?.attempted_provider_ref ?? null,
        attempted_model_ref: priorReceipt?.attempted_model_ref ?? null,
      });
    }
    throw gatewayFailure(
      "model_gateway_deterministic_failed",
      buildReceipt({
        ...base,
        ...implementation,
        attempted_provider_ref: priorReceipt?.attempted_provider_ref ?? null,
        attempted_model_ref: priorReceipt?.attempted_model_ref ?? null,
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
      attempted_provider_ref: priorReceipt?.attempted_provider_ref ?? null,
      attempted_model_ref: priorReceipt?.attempted_model_ref ?? null,
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
  onProviderEgressAttempt?: () => void,
): Promise<InternalGatewayResultV01> {
  let egressAttempted = false;
  let inputBytesUsed: number | null = null;
  let receivedResult: ModelGatewayInvocationErrorV01["received_result"] = null;

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
          ...("provider_request_trace_id" in envelope
            ? { provider_request_trace_id: envelope.provider_request_trace_id }
            : {}),
          mark_egress_attempted() {
            lifecycle.throwIfStopped();
            if (egressAttempted) {
              throw gatewayFailure("model_gateway_budget_refused");
            }
            onProviderEgressAttempt?.();
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
    // Keep received-but-refused distinct from transport loss. V0.2 failure
    // receipts do not admit over-budget usage; retain that reported evidence
    // separately without turning the failed receipt into a success.
    receivedResult = { usage: result.usage };
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
        attempted_provider_ref: adapterSession.provider_ref,
        attempted_model_ref: adapterSession.model_ref,
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
        normalized_output_fingerprint: normalizedOutputFingerprint(base.method, result),
      }),
    };
  } catch (error) {
    const failureCode = normalizeFailureCode(error);
    const providerRejectionObservation =
      error instanceof ModelGatewayAdapterFailureV01
        ? error.provider_rejection_observation
        : null;
    const providerResponseInvalidObservation =
      error instanceof ModelGatewayAdapterFailureV01
        ? error.provider_response_invalid_observation
        : null;
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
        attempted_provider_ref: adapterSession.provider_ref,
        attempted_model_ref: adapterSession.model_ref,
        execution_mode: "live",
        selection_reason: "requested_live",
        status:
          failureCode === "model_gateway_timeout"
            ? "timed_out"
            : cancelled
              ? "cancelled"
              : blocked
                ? "blocked"
                : "failed",
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
      providerRejectionObservation,
      providerResponseInvalidObservation,
      receivedResult ?? (error instanceof ModelGatewayAdapterFailureV01 ? error.received_result : null),
      error instanceof ModelGatewayAdapterFailureV01
        ? normalizeModelTransportFailureObservationV01(error.transport_failure_observation)
        : null,
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
    selection_reason: ModelInvocationReceiptV02["selection_reason"];
    egress_attempted: boolean;
    input_bytes_used: number | null;
    provider_calls_used: 0 | 1;
    attempted_provider_ref?: ModelAdapterSessionV01["provider_ref"] | null;
    attempted_model_ref?: ModelAdapterSessionV01["model_ref"] | null;
  },
) {
  return gatewayFailure(
    code,
    buildReceipt({
      ...base,
      ...implementation,
      attempted_provider_ref: implementation.attempted_provider_ref ?? null,
      attempted_model_ref: implementation.attempted_model_ref ?? null,
      status: code === "model_gateway_timeout" ? "timed_out" : "cancelled",
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
  method: GatewayMethodBindingV01;
  envelope: ModelInvocationEnvelopeV01;
  workspace_id: string;
  project_id: string;
  adapter_implementation: ModelAdapterImplementationV01;
  grant_lineage_ref: ModelGatewayPolicyAuthorizationV01["grant_lineage_ref"] | null;
  automation_control_lineage_ref:
  | ModelGatewayPolicyAuthorizationV01["automation_control_lineage_ref"]
  | null;
  started: Date;
  now: () => Date;
};

function buildReceipt(
  input: ReceiptBase &
    ModelAdapterImplementationV01 & {
      execution_mode: ModelGatewayExecutionModeV01;
      selection_reason: ModelInvocationReceiptV02["selection_reason"];
      status: ModelInvocationReceiptV02["status"];
      outcome: ModelInvocationReceiptV02["outcome"];
      egress_attempted: boolean;
      egress_status: ModelInvocationReceiptV02["egress_status"];
      usage: ModelInvocationReceiptV02["usage"];
      budget_decision: ModelInvocationReceiptV02["budget"]["decision"];
      input_bytes_used: number | null;
      provider_calls_used: 0 | 1;
      failure_code: ModelGatewayFailureCodeV01 | null;
      normalized_output_fingerprint?: string;
      attempted_provider_ref?: ModelAdapterSessionV01["provider_ref"] | null;
      attempted_model_ref?: ModelAdapterSessionV01["model_ref"] | null;
    },
): ModelInvocationReceiptV02 {
  const finished = input.now();
  const policy = input.envelope.policy;
  const attemptedImplementation =
    input.selection_reason === "explicit_deterministic"
      ? null
      : input.adapter_implementation;
  const timeoutDisposition =
    input.outcome === "timeout"
      ? "timed_out"
      : input.outcome === "cancelled"
        ? "cancelled"
        : "completed_within_deadline";
  const localIdentity = input.method.local_identity(input.envelope);
  const receipt: ModelInvocationReceiptV02 = {
    receipt_version: MODEL_INVOCATION_RECEIPT_VERSION_V02,
    gateway_version: MODEL_GATEWAY_VERSION_V01,
    invocation_id: input.envelope.invocation_id,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    work_id: policy.invocation_origin === "policy_triggered" ? policy.work_id : null,
    run_id: policy.invocation_origin === "policy_triggered" ? policy.run_id : null,
    purpose: input.envelope.purpose,
    ...(localIdentity === undefined ? {} : {
      local_invocation_identity_fingerprint: localIdentity,
    }),
    invocation_origin: policy.invocation_origin,
    attempted_implementation_id: attemptedImplementation
      ? boundedReceiptIdentifier(attemptedImplementation.implementation_id)
      : null,
    attempted_implementation_version: attemptedImplementation
      ? boundedReceiptIdentifier(attemptedImplementation.implementation_version)
      : null,
    attempted_provider_ref: input.attempted_provider_ref ?? null,
    attempted_model_ref: input.attempted_model_ref ?? null,
    final_implementation_id: boundedReceiptIdentifier(input.implementation_id),
    final_implementation_version: boundedReceiptIdentifier(
      input.implementation_version,
    ),
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
    egress_policy_version: MODEL_GATEWAY_EGRESS_POLICY_VERSION_V01,
    usage: input.usage,
    cost: {
      basis: "unavailable",
      amount: null,
      currency: null,
      source: input.envelope.budget.cost_budget
        ? "provider_cost_not_reported"
        : "no_pricing_authority",
    },
    budget: {
      decision: input.budget_decision,
      input_bytes_limit: input.envelope.budget.max_input_bytes,
      input_bytes_used: input.input_bytes_used,
      output_tokens_limit: input.envelope.budget.max_output_tokens,
      output_tokens_used: input.usage?.output_tokens ?? null,
      provider_call_limit: input.envelope.budget.max_provider_calls,
      provider_calls_used: input.provider_calls_used,
      timeout_limit_ms: input.envelope.timeout_ms,
      timeout_disposition: timeoutDisposition,
      ...(input.envelope.budget.cost_budget
        ? { cost_budget: input.envelope.budget.cost_budget }
        : {}),
    },
    cancellation_disposition:
      input.outcome === "cancelled" ? "cancelled" : "not_cancelled",
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
    grant_lineage_ref: input.grant_lineage_ref,
    automation_control_lineage_ref: input.automation_control_lineage_ref,
    fallback_used: input.selection_reason === "provider_failure_fallback",
    coverage_class: "enforced",
    trust_class:
      input.selection_reason === "provider_failure_fallback"
        ? "mixed"
        : input.outcome === "live_success"
          ? "provider_report"
          : "direct_local_observation",
    raw_prompt_persisted: false,
    raw_response_persisted: false,
    hidden_reasoning_persisted: false,
    receipt_is_semantic_authority: false,
    ...(input.normalized_output_fingerprint === undefined
      ? {}
      : {
        normalized_output_fingerprint:
          input.normalized_output_fingerprint,
      }),
  };
  return validateModelInvocationReceiptV02(receipt);
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
  receipt: ModelInvocationReceiptV02;
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
  method: GatewayMethodBindingV01,
) {
  if (envelope.execution_mode === "deterministic") {
    return {
      ...method.deterministic_implementation,
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
  method: GatewayMethodBindingV01,
): ModelInvocationEnvelopeV01["budget"] {
  const record = requirePlainRecord(value);
  requireExactKeys(record, [
    "max_input_bytes",
    "max_output_tokens",
    "max_provider_calls",
  ], method.cost_budget === "forbidden" ? [] : ["cost_budget"]);
  const maxInputBytes = requireInteger(
    readOwn(record, "max_input_bytes"),
    1,
    method.maximum_input_bytes,
  );
  const maxOutputTokens = requireInteger(
    readOwn(record, "max_output_tokens"),
    1,
    method.maximum_output_tokens,
  );
  const maxProviderCalls = readOwn(record, "max_provider_calls");
  if (maxProviderCalls !== (mode === "live" ? 1 : 0)) invalid();
  const costBudget = Object.hasOwn(record, "cost_budget")
    ? validateModelGatewayCostBudgetV01(readOwn(record, "cost_budget"))
    : undefined;
  if (method.cost_budget === "required" && !costBudget) {
    invalid();
  }
  return {
    max_input_bytes: maxInputBytes,
    max_output_tokens: maxOutputTokens,
    max_provider_calls: mode === "live" ? 1 : 0,
    ...(costBudget ? { cost_budget: costBudget } : {}),
  };
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
      expected_active_selection_revision: requireSelectionRevision(readOwn(record, "expected_active_selection_revision")),
    };
  }
  if (origin === "policy_triggered") {
    requireExactKeys(record, [
      "invocation_origin",
      "automation_control_revision",
      "work_id",
      "run_id",
      "grant_id",
      "grant_fingerprint",
    ]);
    return {
      invocation_origin: "policy_triggered",
      automation_control_revision: requireInteger(
        readOwn(record, "automation_control_revision"),
        1,
        Number.MAX_SAFE_INTEGER,
      ),
      work_id: requireSafeIdentifier(readOwn(record, "work_id")),
      run_id: requireSafeIdentifier(readOwn(record, "run_id")),
      grant_id: requireSafeIdentifier(readOwn(record, "grant_id")),
      grant_fingerprint: requireSha256(readOwn(record, "grant_fingerprint")),
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

function boundedReceiptIdentifier(value: string) {
  return SAFE_IDENTIFIER_PATTERN.test(value) ? value : "implementation.invalid";
}


function normalizedOutputFingerprint(method: GatewayMethodBindingV01, result: ModelAdapterInvocationResultV01): string | undefined {
  const output = method.fingerprinted_output(result);
  return output === null ? undefined : createProtocolSha256V01(canonicalizeProtocolValueV01(output.value));
}

const MAX_PROVENANCE_REFS = 16;
const PROVENANCE_REF_PATTERN = /^(?:sha256:[0-9a-f]{64}|[a-z][a-z0-9_.-]{0,63}:[A-Za-z0-9:._-]{1,256})$/;

const SAFE_IDENTIFIER_PATTERN = /^[A-Za-z0-9:._-]{1,256}$/;
