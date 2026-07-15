import {
  MODEL_GATEWAY_PURPOSES_V01,
  type ModelGatewayBudgetV01,
  type ModelGatewayDataClassificationV01,
  type ModelGatewayExecutionModeV01,
  type ModelGatewayPolicyAuthorizationV01,
  type ModelGatewayPurposeV01,
} from "@/lib/vnext/model-gateway/contracts";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import {
  MODEL_INVOCATION_CAPABILITY_GRANT_VERSION_V01,
  type ModelInvocationCapabilityGrantV01,
} from "@/types/vnext/model-invocation-capability-grant";

const SAFE_IDENTIFIER = /^[A-Za-z0-9:._-]{1,256}$/;
const CANONICAL_WORKSPACE =
  /^workspace:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CANONICAL_PROJECT =
  /^project:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256 = /^sha256:[0-9a-f]{64}$/;
const MAX_INPUT_BYTES = 98_304;
const MAX_OUTPUT_TOKENS = 4_096;
const MAX_TIMEOUT_MS = 60_000;

const GRANT_KEYS = [
  "grant_version",
  "grant_id",
  "workspace_id",
  "project_id",
  "work_id",
  "run_id",
  "automation_control_revision",
  "permitted_purposes",
  "permitted_execution_modes",
  "provider_egress_allowed",
  "max_provider_calls",
  "max_input_bytes",
  "max_output_tokens",
  "max_timeout_ms",
  "max_model_invocations",
  "allowed_data_classifications",
  "issued_at",
  "expires_at",
  "status",
  "capability_status",
  "automatic_retry",
  "provider_failover",
  "semantic_mutation_authorized",
  "external_actions_authorized",
  "can_expand_own_authority",
  "lineage_fingerprint",
] as const;

export const MODEL_INVOCATION_GRANT_FAILURE_CODES_V01 = [
  "model_invocation_grant_missing",
  "model_invocation_grant_invalid",
  "model_invocation_grant_scope_mismatch",
  "model_invocation_grant_control_revision_mismatch",
  "model_invocation_grant_expired",
  "model_invocation_grant_revoked",
  "model_invocation_capability_unavailable",
  "model_invocation_grant_purpose_refused",
  "model_invocation_grant_mode_refused",
  "model_invocation_grant_egress_refused",
  "model_invocation_grant_classification_refused",
  "model_invocation_grant_budget_refused",
] as const;

export type ModelInvocationGrantFailureCodeV01 =
  (typeof MODEL_INVOCATION_GRANT_FAILURE_CODES_V01)[number];

export class ModelInvocationGrantErrorV01 extends Error {
  constructor(readonly code: ModelInvocationGrantFailureCodeV01) {
    super("Model invocation capability grant refused the request.");
    this.name = "ModelInvocationGrantErrorV01";
  }
}

export type ModelInvocationCapabilityGrantBuilderInputV01 = Omit<
  ModelInvocationCapabilityGrantV01,
  | "grant_version"
  | "max_model_invocations"
  | "automatic_retry"
  | "provider_failover"
  | "semantic_mutation_authorized"
  | "external_actions_authorized"
  | "can_expand_own_authority"
  | "lineage_fingerprint"
>;

export function buildModelInvocationCapabilityGrantV01(
  input: ModelInvocationCapabilityGrantBuilderInputV01,
): ModelInvocationCapabilityGrantV01 {
  const withoutFingerprint = {
    grant_version: MODEL_INVOCATION_CAPABILITY_GRANT_VERSION_V01,
    ...input,
    permitted_purposes: uniqueSorted(input.permitted_purposes),
    permitted_execution_modes: uniqueSorted(input.permitted_execution_modes),
    max_model_invocations: 1 as const,
    allowed_data_classifications: uniqueSorted(
      input.allowed_data_classifications,
    ),
    automatic_retry: false as const,
    provider_failover: false as const,
    semantic_mutation_authorized: false as const,
    external_actions_authorized: false as const,
    can_expand_own_authority: false as const,
  };
  return validateModelInvocationCapabilityGrantV01({
    ...withoutFingerprint,
    lineage_fingerprint: createGrantFingerprint(withoutFingerprint),
  });
}

export function validateModelInvocationCapabilityGrantV01(
  input: unknown,
): ModelInvocationCapabilityGrantV01 {
  try {
    const grant = exactRecord(input, GRANT_KEYS);
    literal(
      grant.grant_version,
      MODEL_INVOCATION_CAPABILITY_GRANT_VERSION_V01,
    );
    matches(grant.grant_id, SAFE_IDENTIFIER);
    matches(grant.workspace_id, CANONICAL_WORKSPACE);
    matches(grant.project_id, CANONICAL_PROJECT);
    matches(grant.work_id, SAFE_IDENTIFIER);
    matches(grant.run_id, SAFE_IDENTIFIER);
    positiveInteger(grant.automation_control_revision);
    validateMembers(grant.permitted_purposes, MODEL_GATEWAY_PURPOSES_V01);
    validateMembers(grant.permitted_execution_modes, [
      "live",
      "deterministic",
    ]);
    boolean(grant.provider_egress_allowed);
    member(grant.max_provider_calls, [0, 1]);
    boundedPositiveInteger(grant.max_input_bytes, MAX_INPUT_BYTES);
    boundedPositiveInteger(grant.max_output_tokens, MAX_OUTPUT_TOKENS);
    boundedPositiveInteger(grant.max_timeout_ms, MAX_TIMEOUT_MS);
    literal(grant.max_model_invocations, 1);
    validateMembers(grant.allowed_data_classifications, [
      "public_safe",
      "private",
      "local_only",
      "secret",
    ]);
    const issuedAt = timestamp(grant.issued_at);
    const expiresAt = timestamp(grant.expires_at);
    if (expiresAt <= issuedAt) invalid();
    member(grant.status, ["active", "revoked"]);
    member(grant.capability_status, ["available", "unavailable"]);
    literal(grant.automatic_retry, false);
    literal(grant.provider_failover, false);
    literal(grant.semantic_mutation_authorized, false);
    literal(grant.external_actions_authorized, false);
    literal(grant.can_expand_own_authority, false);
    matches(grant.lineage_fingerprint, SHA256);
    const normalized = JSON.parse(
      JSON.stringify(grant),
    ) as ModelInvocationCapabilityGrantV01;
    if (
      normalized.lineage_fingerprint !==
      createGrantFingerprint(withoutGrantFingerprint(normalized))
    ) {
      invalid();
    }
    return normalized;
  } catch (error) {
    if (error instanceof ModelInvocationGrantErrorV01) throw error;
    invalid();
  }
}

export function authorizeModelInvocationCapabilityGrantV01(input: {
  grant: unknown;
  now: string;
  workspace_id: string;
  project_id: string;
  work_id: string;
  run_id: string;
  automation_control_revision: number;
  purpose: ModelGatewayPurposeV01;
  execution_mode: ModelGatewayExecutionModeV01;
  data_classification: ModelGatewayDataClassificationV01;
  budget: ModelGatewayBudgetV01;
  timeout_ms: number;
  run_budget: ModelGatewayBudgetV01 & { max_timeout_ms: number };
}): {
  grant: ModelInvocationCapabilityGrantV01;
  authorization: ModelGatewayPolicyAuthorizationV01;
} {
  const grant = validateModelInvocationCapabilityGrantV01(input.grant);
  const now = timestamp(input.now);
  if (
    grant.workspace_id !== input.workspace_id ||
    grant.project_id !== input.project_id ||
    grant.work_id !== input.work_id ||
    grant.run_id !== input.run_id
  ) {
    refuse("model_invocation_grant_scope_mismatch");
  }
  if (grant.automation_control_revision !== input.automation_control_revision) {
    refuse("model_invocation_grant_control_revision_mismatch");
  }
  if (grant.status === "revoked") refuse("model_invocation_grant_revoked");
  if (now < timestamp(grant.issued_at) || now >= timestamp(grant.expires_at)) {
    refuse("model_invocation_grant_expired");
  }
  if (grant.capability_status !== "available") {
    refuse("model_invocation_capability_unavailable");
  }
  if (!grant.permitted_purposes.includes(input.purpose)) {
    refuse("model_invocation_grant_purpose_refused");
  }
  if (!grant.permitted_execution_modes.includes(input.execution_mode)) {
    refuse("model_invocation_grant_mode_refused");
  }
  if (input.execution_mode === "live" && !grant.provider_egress_allowed) {
    refuse("model_invocation_grant_egress_refused");
  }
  if (!grant.allowed_data_classifications.includes(input.data_classification)) {
    refuse("model_invocation_grant_classification_refused");
  }
  if (
    input.budget.max_provider_calls > grant.max_provider_calls ||
    input.budget.max_provider_calls > input.run_budget.max_provider_calls ||
    input.budget.max_input_bytes > grant.max_input_bytes ||
    input.budget.max_input_bytes > input.run_budget.max_input_bytes ||
    input.budget.max_output_tokens > grant.max_output_tokens ||
    input.budget.max_output_tokens > input.run_budget.max_output_tokens ||
    input.timeout_ms > grant.max_timeout_ms ||
    input.timeout_ms > input.run_budget.max_timeout_ms
  ) {
    refuse("model_invocation_grant_budget_refused");
  }
  return {
    grant,
    authorization: {
      workspace_id: grant.workspace_id,
      project_id: grant.project_id,
      work_id: grant.work_id,
      run_id: grant.run_id,
      automation_control_revision: grant.automation_control_revision,
      grant_lineage_ref: {
        ref_version: "external_ref.v0.1",
        ref_type: "model_invocation_capability_grant",
        external_id: grant.grant_id,
        source_ref: grant.lineage_fingerprint,
        trust_class: "direct_local_observation",
      },
      automation_control_lineage_ref: {
        ref_version: "external_ref.v0.1",
        ref_type: "project_automation_control",
        external_id: `${grant.project_id}:automation-control:${grant.automation_control_revision}`,
        source_ref: `control-revision:${grant.automation_control_revision}`,
        trust_class: "direct_local_observation",
      },
    },
  };
}

function createGrantFingerprint(
  value: Omit<ModelInvocationCapabilityGrantV01, "lineage_fingerprint">,
): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(value));
}

function withoutGrantFingerprint(
  grant: ModelInvocationCapabilityGrantV01,
): Omit<ModelInvocationCapabilityGrantV01, "lineage_fingerprint"> {
  const { lineage_fingerprint: _fingerprint, ...rest } = grant;
  return rest;
}

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort();
}

function validateMembers<T extends string>(
  value: unknown,
  allowed: readonly T[],
): asserts value is T[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > allowed.length) {
    invalid();
  }
  const normalized = uniqueSorted(value as T[]);
  if (
    normalized.length !== value.length ||
    normalized.some((item) => !allowed.includes(item)) ||
    canonicalizeProtocolValueV01(normalized) !==
      canonicalizeProtocolValueV01(value)
  ) {
    invalid();
  }
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

function timestamp(value: unknown): number {
  const parsed = parseStrictIsoTimestampV01(value);
  if (parsed === null) invalid();
  return parsed;
}

function matches(value: unknown, pattern: RegExp): asserts value is string {
  if (typeof value !== "string" || !pattern.test(value)) invalid();
}

function boolean(value: unknown): asserts value is boolean {
  if (typeof value !== "boolean") invalid();
}

function literal<T>(value: unknown, expected: T): asserts value is T {
  if (value !== expected) invalid();
}

function member<T>(value: unknown, values: readonly T[]): asserts value is T {
  if (!values.includes(value as T)) invalid();
}

function positiveInteger(value: unknown): void {
  boundedPositiveInteger(value, Number.MAX_SAFE_INTEGER);
}

function boundedPositiveInteger(value: unknown, maximum: number): void {
  if (!Number.isSafeInteger(value) || Number(value) < 1 || Number(value) > maximum) {
    invalid();
  }
}

function invalid(): never {
  throw new ModelInvocationGrantErrorV01("model_invocation_grant_invalid");
}

function refuse(code: ModelInvocationGrantFailureCodeV01): never {
  throw new ModelInvocationGrantErrorV01(code);
}
