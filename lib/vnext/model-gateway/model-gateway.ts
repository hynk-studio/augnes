import type Database from "better-sqlite3";

import { openDatabase, type StateEntry } from "@/lib/db";
import { isModelEgressBoundaryError } from "@/lib/model-egress/bounded-model-payload";
import type { ValidatedProposal } from "@/lib/observe/proposal-contract";
import { readRootAvailabilityV01 } from "@/lib/vnext/onboarding/local-project-onboarding";
import {
  findCanonicalProjectByLocalRootV01,
  readCanonicalProjectWithRootV01,
} from "@/lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01 } from "@/lib/vnext/persistence/project-lifecycle-registry";
import {
  createOpenAIResponsesObserveAdapterV01,
  OBSERVE_MODEL_EGRESS_LIMITS,
} from "@/lib/vnext/model-gateway/openai-responses-observe-adapter";
import {
  MODEL_GATEWAY_VERSION_V01,
  MODEL_INVOCATION_ENVELOPE_VERSION_V01,
  MODEL_INVOCATION_RECEIPT_VERSION_V01,
  ModelGatewayAdapterFailureV01,
  ModelGatewayInvocationErrorV01,
  OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
  type ModelGatewayDataClassificationV01,
  type ModelGatewayExecutionModeV01,
  type ModelGatewayFailureCodeV01,
  type ModelInvocationReceiptV01,
  type ObserveModelAdapterSessionV01,
  type ObserveModelAdapterV01,
  type ObserveModelGatewayResultV01,
  type ObserveModelInvocationEnvelopeV01,
} from "@/lib/vnext/model-gateway/contracts";
import { LOCAL_PROJECT_ROOT_REF_VERSION_V01 } from "@/types/vnext/project-identity";

export const DETERMINISTIC_OBSERVE_IMPLEMENTATION_ID_V01 =
  "deterministic.observe" as const;
export const DETERMINISTIC_OBSERVE_IMPLEMENTATION_VERSION_V01 =
  "deterministic_observe.v0.1" as const;

const MAX_TIMEOUT_MS = 60_000;
const MAX_PROVENANCE_REFS = 16;
const MAX_OUTPUT_TOKENS = 4_096;
const CANONICAL_ID_PATTERN =
  /^(workspace|project):[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_IDENTIFIER_PATTERN = /^[A-Za-z0-9:._-]{1,256}$/;
const PROVENANCE_REF_PATTERN =
  /^(?:sha256:[0-9a-f]{64}|[a-z][a-z0-9_.-]{0,63}:[A-Za-z0-9:._-]{1,256})$/;

export interface ObserveModelGatewayDependenciesV01 {
  open_database?: () => Database.Database;
  adapter?: ObserveModelAdapterV01;
  deterministic_execute: (
    input: ObserveModelInvocationEnvelopeV01["input"],
  ) => ValidatedProposal[] | Promise<ValidatedProposal[]>;
  read_root_availability?: typeof readRootAvailabilityV01;
  now?: () => Date;
}

export async function invokeObserveModelGatewayV01(
  input: unknown,
  dependencies: ObserveModelGatewayDependenciesV01,
): Promise<ObserveModelGatewayResultV01> {
  const envelope = validateObserveModelInvocationEnvelopeV01(input);
  const now = dependencies.now ?? (() => new Date());
  const started = now();
  const scope = await resolveCanonicalScope(envelope, dependencies);
  const base = {
    envelope,
    workspace_id: scope.workspace_id,
    project_id: scope.project_id,
    started,
    now,
  };

  if (envelope.cancellation.signal.aborted) {
    throw gatewayFailure(
      "model_gateway_cancelled",
      buildReceipt({
        ...base,
        implementation_id: DETERMINISTIC_OBSERVE_IMPLEMENTATION_ID_V01,
        implementation_version: DETERMINISTIC_OBSERVE_IMPLEMENTATION_VERSION_V01,
        execution_mode: "deterministic",
        selection_reason:
          envelope.execution_mode === "deterministic"
            ? "explicit_deterministic"
            : "requested_live",
        status: "cancelled",
        outcome: "cancelled",
        egress_attempted: false,
        egress_status: "did_not_occur",
        usage: null,
        budget_decision: "not_used",
        input_bytes_used: null,
        provider_calls_used: 0,
        failure_code: "model_gateway_cancelled",
      }),
    );
  }

  if (envelope.execution_mode === "deterministic") {
    return executeDeterministically(
      envelope,
      dependencies,
      base,
      "explicit_deterministic",
    );
  }

  const adapter =
    dependencies.adapter ?? createOpenAIResponsesObserveAdapterV01();
  let adapterSession: ObserveModelAdapterSessionV01 | null;
  try {
    adapterSession = await adapter.prepare();
  } catch {
    throw gatewayFailure(
      "model_gateway_transport_failed",
      buildReceipt({
        ...base,
        implementation_id: adapter.implementation_id,
        implementation_version: adapter.implementation_version,
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
    return executeDeterministically(envelope, dependencies, base, "provider_unavailable");
  }

  const controller = new AbortController();
  let timedOut = false;
  let egressAttempted = false;
  let inputBytesUsed: number | null = null;
  const cancel = () => controller.abort(envelope.cancellation.signal.reason);
  envelope.cancellation.signal.addEventListener("abort", cancel, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, envelope.timeout_ms);

  try {
    const result = await adapterSession.invoke(
      {
        canonical_project_id: scope.project_id,
        message: envelope.input.message,
        current_state: envelope.input.current_state,
      },
      {
        signal: controller.signal,
        budget: envelope.budget,
        retention_class: envelope.privacy.retention_class,
        mark_egress_attempted() {
          if (egressAttempted) {
            throw gatewayFailure("model_gateway_budget_refused");
          }
          egressAttempted = true;
        },
        report_input_bytes(bytes) {
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
    );
    if (
      result.usage &&
      result.usage.output_tokens > envelope.budget.max_output_tokens
    ) {
      throw gatewayFailure("model_gateway_budget_refused");
    }
    return {
      compiler: "openai",
      proposals: result.proposals,
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
    const failureCode = normalizeFailureCode({
      error,
      timedOut,
      externallyCancelled: envelope.cancellation.signal.aborted,
    });
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
        egress_status: blocked && !egressAttempted
          ? "blocked"
          : egressAttempted
            ? "occurred"
            : "did_not_occur",
        usage: null,
        budget_decision: blocked ? "refused" : "within_budget",
        input_bytes_used: inputBytesUsed,
        provider_calls_used: egressAttempted ? 1 : 0,
        failure_code: failureCode,
      }),
    );
  } finally {
    clearTimeout(timeout);
    envelope.cancellation.signal.removeEventListener("abort", cancel);
  }
}

export function validateObserveModelInvocationEnvelopeV01(
  input: unknown,
): ObserveModelInvocationEnvelopeV01 {
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
    const envelopeVersion = readOwn(record, "envelope_version");
    const invocationId = requireSafeIdentifier(
      readOwn(record, "invocation_id"),
    );
    const workspaceId = requireCanonicalId(
      readOwn(record, "workspace_id"),
      "workspace",
    );
    const projectId = requireCanonicalId(
      readOwn(record, "project_id"),
      "project",
    );
    if (envelopeVersion !== MODEL_INVOCATION_ENVELOPE_VERSION_V01) invalid();
    if (readOwn(record, "purpose") !== OBSERVE_MODEL_GATEWAY_PURPOSE_V01) {
      invalid();
    }

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

    const provenanceRefs = validateProvenance(readOwn(record, "provenance_refs"));
    const privacy = validatePrivacy(readOwn(record, "privacy"), executionMode);
    const budget = validateBudget(readOwn(record, "budget"), executionMode);
    const timeoutMs = requireInteger(
      readOwn(record, "timeout_ms"),
      1,
      MAX_TIMEOUT_MS,
    );
    const cancellation = validateCancellation(readOwn(record, "cancellation"));
    const policy = validatePolicy(readOwn(record, "policy"));
    const projectRoot = Object.hasOwn(record, "project_root")
      ? validateProjectRoot(readOwn(record, "project_root"))
      : undefined;
    const purposeInput = validatePurposeInput(readOwn(record, "input"));
    validateProjectScopedStateInput(purposeInput.current_state, projectId);

    if (
      executionMode === "live" &&
      (dataClassification === "local_only" || dataClassification === "secret")
    ) invalid();

    return {
      envelope_version: MODEL_INVOCATION_ENVELOPE_VERSION_V01,
      invocation_id: invocationId,
      workspace_id: workspaceId,
      project_id: projectId,
      purpose: OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
      data_classification: dataClassification,
      provenance_refs: provenanceRefs,
      privacy,
      budget,
      timeout_ms: timeoutMs,
      cancellation,
      execution_mode: executionMode,
      policy,
      ...(projectRoot ? { project_root: projectRoot } : {}),
      input: purposeInput,
    };
  } catch (error) {
    if (error instanceof ModelGatewayInvocationErrorV01) throw error;
    throw gatewayFailure("model_gateway_invalid_envelope");
  }
}

async function resolveCanonicalScope(
  envelope: ObserveModelInvocationEnvelopeV01,
  dependencies: ObserveModelGatewayDependenciesV01,
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
      ) throw new Error("scope");
      const byRoot = findCanonicalProjectByLocalRootV01(db, {
        workspace_id: envelope.workspace_id,
        local_root: {
          local_root_ref_version: LOCAL_PROJECT_ROOT_REF_VERSION_V01,
          ref_kind: "local_project_root",
          ...envelope.project_root,
        },
      });
      if (
        !byRoot ||
        byRoot.project.project_id !== registration.project.project_id
      ) throw new Error("scope");
    }
    if (
      await (dependencies.read_root_availability ?? readRootAvailabilityV01)(
        canonicalRoot.normalized_path,
      ) !== "available"
    ) throw new Error("scope");

    if (envelope.policy.invocation_origin === "interactive") {
      const active = readActiveProjectSelectionV01(db, envelope.workspace_id);
      if (
        envelope.policy.expected_active_project_id !== envelope.project_id ||
        active?.project_id !== envelope.project_id ||
        active.selection_revision !==
          envelope.policy.expected_active_selection_revision
      ) throw new Error("scope");
    } else {
      // R3 explicitly requires a later capability grant for provider/model use.
      // Until that grant authority exists, policy-triggered model work is closed.
      throw gatewayFailure("model_gateway_policy_refused");
    }
    return {
      workspace_id: registration.project.workspace_id,
      project_id: registration.project.project_id,
    };
  } catch (error) {
    if (error instanceof ModelGatewayInvocationErrorV01) throw error;
    throw gatewayFailure("model_gateway_scope_refused");
  } finally {
    db.close();
  }
}

async function executeDeterministically(
  envelope: ObserveModelInvocationEnvelopeV01,
  dependencies: ObserveModelGatewayDependenciesV01,
  base: ReceiptBase,
  selectionReason: "explicit_deterministic" | "provider_unavailable",
): Promise<ObserveModelGatewayResultV01> {
  const proposals = await dependencies.deterministic_execute(envelope.input);
  return {
    compiler: "mock",
    proposals,
    model_invocation_receipt: buildReceipt({
      ...base,
      implementation_id: DETERMINISTIC_OBSERVE_IMPLEMENTATION_ID_V01,
      implementation_version: DETERMINISTIC_OBSERVE_IMPLEMENTATION_VERSION_V01,
      execution_mode: "deterministic",
      selection_reason: selectionReason,
      status: "completed",
      outcome: "deterministic_success",
      egress_attempted: false,
      egress_status: "did_not_occur",
      usage: null,
      budget_decision: "not_used",
      input_bytes_used: null,
      provider_calls_used: 0,
      failure_code: null,
    }),
  };
}

type ReceiptBase = {
  envelope: ObserveModelInvocationEnvelopeV01;
  workspace_id: string;
  project_id: string;
  started: Date;
  now: () => Date;
};

function buildReceipt(
  input: ReceiptBase & {
    implementation_id: string;
    implementation_version: string;
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
    purpose: OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
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

function normalizeFailureCode(input: {
  error: unknown;
  timedOut: boolean;
  externallyCancelled: boolean;
}): ModelGatewayFailureCodeV01 {
  if (input.timedOut) return "model_gateway_timeout";
  if (input.externallyCancelled) return "model_gateway_cancelled";
  if (input.error instanceof ModelGatewayInvocationErrorV01) return input.error.code;
  if (isModelEgressBoundaryError(input.error)) return "model_gateway_egress_refused";
  if (input.error instanceof ModelGatewayAdapterFailureV01) {
    if (input.error.code === "adapter_provider_rejected") {
      return "model_gateway_provider_rejected";
    }
    if (input.error.code === "adapter_response_invalid") {
      return "model_gateway_provider_response_invalid";
    }
  }
  return "model_gateway_transport_failed";
}

function validatePrivacy(
  value: unknown,
  mode: ModelGatewayExecutionModeV01,
): ObserveModelInvocationEnvelopeV01["privacy"] {
  const record = requirePlainRecord(value);
  requireExactKeys(record, ["provider_egress", "retention_class"]);
  const providerEgress = readOwn(record, "provider_egress");
  if (
    providerEgress !== (mode === "live" ? "allow" : "deny") ||
    readOwn(record, "retention_class") !== "none"
  ) invalid();
  return {
    provider_egress: mode === "live" ? "allow" : "deny",
    retention_class: "none",
  };
}

function validateBudget(
  value: unknown,
  mode: ModelGatewayExecutionModeV01,
): ObserveModelInvocationEnvelopeV01["budget"] {
  const record = requirePlainRecord(value);
  requireExactKeys(record, ["max_input_bytes", "max_output_tokens", "max_provider_calls"]);
  const maxInputBytes = requireInteger(
    readOwn(record, "max_input_bytes"),
    1,
    OBSERVE_MODEL_EGRESS_LIMITS.finalRequestBytes,
  );
  const maxOutputTokens = requireInteger(readOwn(record, "max_output_tokens"), 1, MAX_OUTPUT_TOKENS);
  const maxProviderCalls = readOwn(record, "max_provider_calls");
  if (maxProviderCalls !== (mode === "live" ? 1 : 0)) invalid();
  return {
    max_input_bytes: maxInputBytes,
    max_output_tokens: maxOutputTokens,
    max_provider_calls: mode === "live" ? 1 : 0,
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
  ) invalid();
  return { signal: signal as AbortSignal };
}

function validatePolicy(
  value: unknown,
): ObserveModelInvocationEnvelopeV01["policy"] {
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
  ) invalid();
  return { path_flavor: flavor, normalized_path: normalizedPath };
}

function validatePurposeInput(
  value: unknown,
): ObserveModelInvocationEnvelopeV01["input"] {
  const record = requirePlainRecord(value);
  requireExactKeys(record, ["input_kind", "message", "current_state"]);
  if (readOwn(record, "input_kind") !== OBSERVE_MODEL_GATEWAY_PURPOSE_V01) invalid();
  const message = readOwn(record, "message");
  const currentState = readOwn(record, "current_state");
  if (
    typeof message !== "string" ||
    message.trim().length === 0 ||
    message.length > OBSERVE_MODEL_EGRESS_LIMITS.messageCharacters ||
    !Array.isArray(currentState) ||
    currentState.length > OBSERVE_MODEL_EGRESS_LIMITS.stateItems
  ) invalid();
  return {
    input_kind: OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
    message,
    current_state: currentState as StateEntry[],
  };
}

function validateProjectScopedStateInput(
  state: StateEntry[],
  projectId: string,
) {
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

function validateProvenance(value: unknown): string[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_PROVENANCE_REFS) invalid();
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
    (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
  ) invalid();
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
  ) invalid();
}

function requireCanonicalId(value: unknown, kind: "workspace" | "project") {
  if (
    typeof value !== "string" ||
    !CANONICAL_ID_PATTERN.test(value) ||
    !value.startsWith(`${kind}:`) ||
    value === "project:augnes"
  ) invalid();
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
  ) invalid();
  return value;
}

function isOneOf<T extends string>(value: unknown, values: readonly T[]): value is T {
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
