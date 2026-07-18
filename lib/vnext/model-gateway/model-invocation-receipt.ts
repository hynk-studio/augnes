import {
  MODEL_GATEWAY_EGRESS_POLICY_VERSION_V01,
  MODEL_GATEWAY_FAILURE_CODES_V01,
  MODEL_GATEWAY_PURPOSES_V01,
  MODEL_GATEWAY_VERSION_V01,
  MODEL_INVOCATION_RECEIPT_VERSION_V02,
  type ModelInvocationReceiptV02,
} from "@/lib/vnext/model-gateway/contracts";
import {
  parseStrictIsoTimestampV01,
  validateExternalRefStructureV01,
} from "@/lib/vnext/protocol-primitives";

const SAFE_IDENTIFIER = /^[A-Za-z0-9:._-]{1,256}$/;
const CANONICAL_WORKSPACE =
  /^workspace:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CANONICAL_PROJECT =
  /^project:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PROVENANCE_REF =
  /^(?:sha256:[0-9a-f]{64}|[a-z][a-z0-9_.-]{0,63}:[A-Za-z0-9:._-]{1,256})$/;
const PROVIDER_FAILURE_CODES = [
  "model_gateway_provider_rejected",
  "model_gateway_provider_response_invalid",
  "model_gateway_transport_failed",
] as const;
const REFUSAL_FAILURE_CODES = [
  "model_gateway_invalid_envelope",
  "model_gateway_scope_refused",
  "model_gateway_policy_refused",
  "model_gateway_budget_refused",
  "model_gateway_egress_refused",
] as const;

const ROOT_KEYS = [
  "receipt_version",
  "gateway_version",
  "invocation_id",
  "workspace_id",
  "project_id",
  "work_id",
  "run_id",
  "purpose",
  "invocation_origin",
  "attempted_implementation_id",
  "attempted_implementation_version",
  "attempted_provider_ref",
  "attempted_model_ref",
  "final_implementation_id",
  "final_implementation_version",
  "requested_mode",
  "execution_mode",
  "selection_reason",
  "started_at",
  "finished_at",
  "latency_ms",
  "status",
  "outcome",
  "egress_attempted",
  "egress_status",
  "egress_policy_version",
  "usage",
  "cost",
  "budget",
  "cancellation_disposition",
  "failure_code",
  "data_classification",
  "retention_class",
  "privacy_decision",
  "provenance_refs",
  "grant_lineage_ref",
  "automation_control_lineage_ref",
  "fallback_used",
  "coverage_class",
  "trust_class",
  "raw_prompt_persisted",
  "raw_response_persisted",
  "hidden_reasoning_persisted",
  "receipt_is_semantic_authority",
] as const;
const ROOT_KEYS_WITH_OUTPUT_FINGERPRINT = [
  ...ROOT_KEYS,
  "normalized_output_fingerprint",
] as const;

export class ModelInvocationReceiptValidationErrorV02 extends Error {
  readonly code = "model_invocation_receipt_invalid";

  constructor() {
    super("Model invocation receipt is invalid.");
    this.name = "ModelInvocationReceiptValidationErrorV02";
  }
}

export function validateModelInvocationReceiptV02(
  input: unknown,
): ModelInvocationReceiptV02 {
  try {
    const receipt = exactRecord(
      input,
      isPlainRecord(input) && Object.hasOwn(input, "normalized_output_fingerprint")
        ? ROOT_KEYS_WITH_OUTPUT_FINGERPRINT
        : ROOT_KEYS,
    );
    literal(receipt.receipt_version, MODEL_INVOCATION_RECEIPT_VERSION_V02);
    literal(receipt.gateway_version, MODEL_GATEWAY_VERSION_V01);
    safeIdentifier(receipt.invocation_id);
    matches(receipt.workspace_id, CANONICAL_WORKSPACE);
    matches(receipt.project_id, CANONICAL_PROJECT);
    nullableIdentifier(receipt.work_id);
    nullableIdentifier(receipt.run_id);
    member(receipt.purpose, MODEL_GATEWAY_PURPOSES_V01);
    member(receipt.invocation_origin, ["interactive", "policy_triggered"]);
    nullableIdentifier(receipt.attempted_implementation_id);
    nullableIdentifier(receipt.attempted_implementation_version);
    externalRef(receipt.attempted_provider_ref, true);
    externalRef(receipt.attempted_model_ref, true);
    safeIdentifier(receipt.final_implementation_id);
    safeIdentifier(receipt.final_implementation_version);
    member(receipt.requested_mode, ["live", "deterministic"]);
    member(receipt.execution_mode, ["live", "deterministic"]);
    member(receipt.selection_reason, [
      "requested_live",
      "explicit_deterministic",
      "provider_unavailable",
      "provider_failure_fallback",
    ]);
    const started = timestamp(receipt.started_at);
    const finished = timestamp(receipt.finished_at);
    if (finished < started) invalid();
    nonnegativeInteger(receipt.latency_ms);
    member(receipt.status, [
      "completed",
      "blocked",
      "failed",
      "cancelled",
      "timed_out",
    ]);
    member(receipt.outcome, [
      "live_success",
      "deterministic_success",
      "deterministic_fallback_success",
      "deterministic_failure",
      "refused",
      "provider_failure",
      "timeout",
      "cancelled",
    ]);
    boolean(receipt.egress_attempted);
    member(receipt.egress_status, ["occurred", "did_not_occur", "blocked"]);
    literal(
      receipt.egress_policy_version,
      MODEL_GATEWAY_EGRESS_POLICY_VERSION_V01,
    );
    validateUsage(receipt.usage);
    validateCost(receipt.cost);
    validateBudget(receipt.budget);
    member(receipt.cancellation_disposition, ["not_cancelled", "cancelled"]);
    if (receipt.failure_code !== null) {
      member(receipt.failure_code, MODEL_GATEWAY_FAILURE_CODES_V01);
    }
    member(receipt.data_classification, [
      "public_safe",
      "private",
      "local_only",
      "secret",
    ]);
    literal(receipt.retention_class, "none");
    member(receipt.privacy_decision, [
      "provider_egress_approved",
      "provider_egress_not_used",
      "provider_egress_blocked",
    ]);
    validateProvenance(receipt.provenance_refs);
    externalRef(receipt.grant_lineage_ref, true);
    externalRef(receipt.automation_control_lineage_ref, true);
    boolean(receipt.fallback_used);
    literal(receipt.coverage_class, "enforced");
    member(receipt.trust_class, [
      "direct_local_observation",
      "provider_report",
      "mixed",
    ]);
    literal(receipt.raw_prompt_persisted, false);
    literal(receipt.raw_response_persisted, false);
    literal(receipt.hidden_reasoning_persisted, false);
    literal(receipt.receipt_is_semantic_authority, false);
    if (Object.hasOwn(receipt, "normalized_output_fingerprint")) {
      if (
        receipt.normalized_output_fingerprint !== null &&
        (typeof receipt.normalized_output_fingerprint !== "string" ||
          !/^sha256:[0-9a-f]{64}$/.test(
            receipt.normalized_output_fingerprint,
          ))
      ) {
        invalid();
      }
    }
    if (
      receipt.purpose === "strategic_advantage_transfer" &&
      receipt.status === "completed" &&
      (typeof receipt.normalized_output_fingerprint !== "string" ||
        !/^sha256:[0-9a-f]{64}$/.test(
          receipt.normalized_output_fingerprint,
        ))
    ) {
      invalid();
    }
    validateReceiptConsistency(receipt);
    return JSON.parse(JSON.stringify(receipt)) as ModelInvocationReceiptV02;
  } catch (error) {
    if (error instanceof ModelInvocationReceiptValidationErrorV02) throw error;
    invalid();
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  );
}

function validateUsage(value: unknown): void {
  if (value === null) return;
  const usage = exactRecord(value, [
    "basis",
    "quality",
    "source",
    "input_tokens",
    "output_tokens",
    "total_tokens",
  ]);
  literal(usage.basis, "provider_report");
  literal(usage.quality, "reported");
  literal(usage.source, "provider_response");
  nonnegativeInteger(usage.input_tokens);
  nonnegativeInteger(usage.output_tokens);
  nonnegativeInteger(usage.total_tokens);
  if (
    Number(usage.total_tokens) <
    Number(usage.input_tokens) + Number(usage.output_tokens)
  ) {
    invalid();
  }
}

function validateCost(value: unknown): void {
  const cost = exactRecord(value, ["basis", "amount", "currency", "source"]);
  literal(cost.basis, "unavailable");
  literal(cost.amount, null);
  literal(cost.currency, null);
  literal(cost.source, "no_pricing_authority");
}

function validateBudget(value: unknown): void {
  const budget = exactRecord(value, [
    "decision",
    "input_bytes_limit",
    "input_bytes_used",
    "output_tokens_limit",
    "output_tokens_used",
    "provider_call_limit",
    "provider_calls_used",
    "timeout_limit_ms",
    "timeout_disposition",
  ]);
  member(budget.decision, ["within_budget", "not_used", "refused"]);
  positiveInteger(budget.input_bytes_limit);
  nullableNonnegativeInteger(budget.input_bytes_used);
  positiveInteger(budget.output_tokens_limit);
  nullableNonnegativeInteger(budget.output_tokens_used);
  member(budget.provider_call_limit, [0, 1]);
  member(budget.provider_calls_used, [0, 1]);
  positiveInteger(budget.timeout_limit_ms);
  member(budget.timeout_disposition, [
    "completed_within_deadline",
    "timed_out",
    "cancelled",
  ]);
  if (
    Number(budget.provider_calls_used) > Number(budget.provider_call_limit) ||
    (budget.input_bytes_used !== null &&
      Number(budget.input_bytes_used) > Number(budget.input_bytes_limit)) ||
    (budget.output_tokens_used !== null &&
      Number(budget.output_tokens_used) > Number(budget.output_tokens_limit))
  ) {
    invalid();
  }
}

function validateReceiptConsistency(receipt: Record<string, unknown>): void {
  const policyTriggered = receipt.invocation_origin === "policy_triggered";
  if (
    policyTriggered !==
      (receipt.work_id !== null &&
        receipt.run_id !== null &&
        receipt.grant_lineage_ref !== null &&
        receipt.automation_control_lineage_ref !== null) ||
    (!policyTriggered &&
      (receipt.work_id !== null ||
        receipt.run_id !== null ||
        receipt.grant_lineage_ref !== null ||
        receipt.automation_control_lineage_ref !== null))
  ) {
    invalid();
  }
  const attemptedImplementationPresent =
    receipt.attempted_implementation_id !== null &&
    receipt.attempted_implementation_version !== null;
  if (
    attemptedImplementationPresent !==
    (receipt.attempted_implementation_id !== null ||
      receipt.attempted_implementation_version !== null)
  ) {
    invalid();
  }
  if (
    (receipt.attempted_provider_ref === null) !==
    (receipt.attempted_model_ref === null)
  ) {
    invalid();
  }
  if (receipt.attempted_provider_ref !== null) {
    const provider = receipt.attempted_provider_ref as Record<string, unknown>;
    const model = receipt.attempted_model_ref as Record<string, unknown>;
    if (
      provider.ref_type !== "model_provider" ||
      model.ref_type !== "provider_model" ||
      provider.trust_class !== "direct_local_observation" ||
      model.trust_class !== "direct_local_observation" ||
      typeof provider.provider !== "string" ||
      provider.provider !== provider.external_id ||
      model.provider !== provider.external_id
    ) {
      invalid();
    }
  }
  if (policyTriggered) {
    const grant = receipt.grant_lineage_ref as Record<string, unknown>;
    const control = receipt.automation_control_lineage_ref as Record<
      string,
      unknown
    >;
    if (
      grant.ref_type !== "model_invocation_capability_grant" ||
      grant.trust_class !== "direct_local_observation" ||
      typeof grant.source_ref !== "string" ||
      !/^sha256:[0-9a-f]{64}$/.test(grant.source_ref) ||
      control.ref_type !== "project_automation_control" ||
      control.trust_class !== "direct_local_observation" ||
      typeof control.external_id !== "string" ||
      !control.external_id.startsWith(
        `${String(receipt.project_id)}:automation-control:`,
      ) ||
      typeof control.source_ref !== "string" ||
      !/^control-revision:[1-9][0-9]*$/.test(control.source_ref) ||
      control.external_id.slice(control.external_id.lastIndexOf(":") + 1) !==
        control.source_ref.slice("control-revision:".length)
    ) {
      invalid();
    }
  }
  const budget = receipt.budget as Record<string, unknown>;
  const usage = receipt.usage as Record<string, unknown> | null;
  const providerCallsUsed = Number(budget.provider_calls_used);
  const providerRefsPresent = receipt.attempted_provider_ref !== null;
  const expectedPrivacyDecision =
    receipt.egress_status === "occurred"
      ? "provider_egress_approved"
      : receipt.egress_status === "blocked"
        ? "provider_egress_blocked"
        : "provider_egress_not_used";
  const statusOutcomes: Record<string, readonly string[]> = {
    completed: [
      "live_success",
      "deterministic_success",
      "deterministic_fallback_success",
    ],
    blocked: ["refused"],
    failed: ["provider_failure", "deterministic_failure"],
    cancelled: ["cancelled"],
    timed_out: ["timeout"],
  };
  if (
    budget.output_tokens_used !== (usage?.output_tokens ?? null) ||
    receipt.egress_attempted !== (providerCallsUsed === 1) ||
    (receipt.egress_status === "occurred") !== (providerCallsUsed === 1) ||
    (providerCallsUsed === 1 && !providerRefsPresent) ||
    receipt.privacy_decision !== expectedPrivacyDecision ||
    (receipt.outcome !== "refused" && receipt.egress_status === "blocked") ||
    receipt.fallback_used !==
      (receipt.selection_reason === "provider_failure_fallback") ||
    !statusOutcomes[String(receipt.status)]?.includes(String(receipt.outcome)) ||
    (receipt.status === "completed"
      ? receipt.outcome === "deterministic_fallback_success"
        ? !PROVIDER_FAILURE_CODES.includes(
            receipt.failure_code as (typeof PROVIDER_FAILURE_CODES)[number],
          )
        : receipt.failure_code !== null
      : receipt.failure_code === null) ||
    (budget.decision === "refused") !== (receipt.outcome === "refused")
  ) {
    invalid();
  }

  if (
    usage !== null &&
    (providerCallsUsed !== 1 ||
      receipt.egress_status !== "occurred" ||
      !providerRefsPresent ||
      receipt.outcome !== "live_success" ||
      receipt.trust_class !== "provider_report")
  ) {
    invalid();
  }

  if (receipt.selection_reason === "explicit_deterministic") {
    if (
      receipt.requested_mode !== "deterministic" ||
      receipt.execution_mode !== "deterministic" ||
      attemptedImplementationPresent ||
      providerRefsPresent ||
      receipt.egress_attempted ||
      providerCallsUsed !== 0 ||
      receipt.egress_status !== "did_not_occur" ||
      usage !== null ||
      receipt.fallback_used ||
      receipt.trust_class !== "direct_local_observation"
    ) {
      invalid();
    }
  } else if (receipt.selection_reason === "provider_unavailable") {
    if (
      receipt.requested_mode !== "live" ||
      receipt.execution_mode !== "deterministic" ||
      !attemptedImplementationPresent ||
      providerRefsPresent ||
      receipt.egress_attempted ||
      providerCallsUsed !== 0 ||
      receipt.egress_status !== "did_not_occur" ||
      usage !== null ||
      receipt.fallback_used ||
      receipt.trust_class !== "direct_local_observation"
    ) {
      invalid();
    }
  } else if (receipt.selection_reason === "requested_live") {
    if (
      receipt.requested_mode !== "live" ||
      receipt.execution_mode !== "live" ||
      !attemptedImplementationPresent ||
      receipt.fallback_used ||
      receipt.trust_class !==
        (receipt.outcome === "live_success"
          ? "provider_report"
          : "direct_local_observation")
    ) {
      invalid();
    }
  } else if (
    receipt.requested_mode !== "live" ||
    receipt.execution_mode !== "deterministic" ||
    !attemptedImplementationPresent ||
    !providerRefsPresent ||
    receipt.final_implementation_id === receipt.attempted_implementation_id ||
    !receipt.egress_attempted ||
    providerCallsUsed !== 1 ||
    receipt.egress_status !== "occurred" ||
    usage !== null ||
    !receipt.fallback_used ||
    receipt.trust_class !== "mixed" ||
    ![
      "deterministic_fallback_success",
      "deterministic_failure",
      "timeout",
      "cancelled",
    ].includes(String(receipt.outcome))
  ) {
    invalid();
  }

  if (receipt.outcome === "live_success") {
    if (
      receipt.status !== "completed" ||
      receipt.requested_mode !== "live" ||
      receipt.execution_mode !== "live" ||
      receipt.selection_reason !== "requested_live" ||
      receipt.fallback_used ||
      !attemptedImplementationPresent ||
      !providerRefsPresent ||
      !receipt.egress_attempted ||
      receipt.egress_status !== "occurred" ||
      providerCallsUsed !== 1 ||
      receipt.failure_code !== null ||
      receipt.trust_class !== "provider_report" ||
      budget.decision !== "within_budget"
    ) {
      invalid();
    }
  } else if (receipt.outcome === "deterministic_success") {
    if (
      receipt.status !== "completed" ||
      receipt.execution_mode !== "deterministic" ||
      !["explicit_deterministic", "provider_unavailable"].includes(
        String(receipt.selection_reason),
      ) ||
      receipt.fallback_used ||
      receipt.egress_attempted ||
      providerCallsUsed !== 0 ||
      receipt.egress_status !== "did_not_occur" ||
      usage !== null ||
      receipt.failure_code !== null ||
      receipt.trust_class !== "direct_local_observation" ||
      budget.decision !== "not_used"
    ) {
      invalid();
    }
  } else if (receipt.outcome === "deterministic_fallback_success") {
    if (
      receipt.status !== "completed" ||
      receipt.selection_reason !== "provider_failure_fallback" ||
      !PROVIDER_FAILURE_CODES.includes(
        receipt.failure_code as (typeof PROVIDER_FAILURE_CODES)[number],
      ) ||
      budget.decision !== "within_budget"
    ) {
      invalid();
    }
  } else if (receipt.outcome === "provider_failure") {
    if (
      receipt.status !== "failed" ||
      receipt.requested_mode !== "live" ||
      receipt.execution_mode !== "live" ||
      receipt.selection_reason !== "requested_live" ||
      !PROVIDER_FAILURE_CODES.includes(
        receipt.failure_code as (typeof PROVIDER_FAILURE_CODES)[number],
      ) ||
      usage !== null ||
      receipt.trust_class !== "direct_local_observation" ||
      receipt.egress_status !==
        (providerCallsUsed === 1 ? "occurred" : "did_not_occur") ||
      budget.decision !== (providerCallsUsed === 1 ? "within_budget" : "not_used")
    ) {
      invalid();
    }
  } else if (receipt.outcome === "deterministic_failure") {
    if (
      receipt.status !== "failed" ||
      receipt.execution_mode !== "deterministic" ||
      receipt.failure_code !== "model_gateway_deterministic_failed" ||
      usage !== null
    ) {
      invalid();
    }
  } else if (receipt.outcome === "refused") {
    if (
      receipt.status !== "blocked" ||
      !REFUSAL_FAILURE_CODES.includes(
        receipt.failure_code as (typeof REFUSAL_FAILURE_CODES)[number],
      ) ||
      usage !== null ||
      budget.decision !== "refused" ||
      receipt.egress_status !==
        (providerCallsUsed === 1 ? "occurred" : "blocked")
    ) {
      invalid();
    }
  } else if (receipt.outcome === "timeout") {
    if (
      receipt.status !== "timed_out" ||
      receipt.failure_code !== "model_gateway_timeout" ||
      budget.timeout_disposition !== "timed_out" ||
      receipt.cancellation_disposition !== "not_cancelled" ||
      usage !== null ||
      budget.decision !== (providerCallsUsed === 1 ? "within_budget" : "not_used")
    ) {
      invalid();
    }
  } else if (receipt.outcome === "cancelled") {
    if (
      receipt.status !== "cancelled" ||
      receipt.failure_code !== "model_gateway_cancelled" ||
      budget.timeout_disposition !== "cancelled" ||
      receipt.cancellation_disposition !== "cancelled" ||
      usage !== null ||
      budget.decision !== (providerCallsUsed === 1 ? "within_budget" : "not_used")
    ) {
      invalid();
    }
  }

  if (
    receipt.fallback_used &&
    receipt.outcome === "deterministic_failure" &&
    receipt.failure_code !== "model_gateway_deterministic_failed"
  ) {
    invalid();
  }
}

function validateProvenance(value: unknown): void {
  if (!Array.isArray(value) || value.length < 1 || value.length > 16) invalid();
  for (const item of value) matches(item, PROVENANCE_REF);
}

function externalRef(value: unknown, nullable: boolean): void {
  if (value === null && nullable) return;
  let failed = false;
  validateExternalRefStructureV01(value, "$.ref", {
    error() {
      failed = true;
    },
    warning() {},
  });
  if (failed) invalid();
}

function exactRecord(
  value: unknown,
  expectedKeys: readonly string[],
): Record<string, unknown> {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    (Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null)
  ) {
    invalid();
  }
  const record = value as Record<string, unknown>;
  const keys = Reflect.ownKeys(record);
  if (
    keys.length !== expectedKeys.length ||
    keys.some((key) => typeof key !== "string" || !expectedKeys.includes(key)) ||
    expectedKeys.some((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(record, key);
      return !descriptor || !("value" in descriptor);
    })
  ) {
    invalid();
  }
  return record;
}

function member<T>(value: unknown, values: readonly T[]): asserts value is T {
  if (!values.includes(value as T)) invalid();
}

function literal<T>(value: unknown, expected: T): asserts value is T {
  if (value !== expected) invalid();
}

function matches(value: unknown, pattern: RegExp): asserts value is string {
  if (typeof value !== "string" || !pattern.test(value)) invalid();
}

function safeIdentifier(value: unknown): asserts value is string {
  matches(value, SAFE_IDENTIFIER);
}

function nullableIdentifier(value: unknown): void {
  if (value !== null) safeIdentifier(value);
}

function boolean(value: unknown): asserts value is boolean {
  if (typeof value !== "boolean") invalid();
}

function timestamp(value: unknown): number {
  const parsed = parseStrictIsoTimestampV01(value);
  if (parsed === null) invalid();
  return parsed;
}

function positiveInteger(value: unknown): void {
  if (!Number.isSafeInteger(value) || Number(value) < 1) invalid();
}

function nonnegativeInteger(value: unknown): void {
  if (!Number.isSafeInteger(value) || Number(value) < 0) invalid();
}

function nullableNonnegativeInteger(value: unknown): void {
  if (value !== null) nonnegativeInteger(value);
}

function invalid(): never {
  throw new ModelInvocationReceiptValidationErrorV02();
}
