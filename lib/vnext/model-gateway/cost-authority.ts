import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  normalizeExternalRefPrimitiveV01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import {
  MODEL_GATEWAY_COST_AUTHORITY_VERSION_V01,
  MODEL_GATEWAY_COST_BUDGET_VERSION_V01,
  type ModelGatewayCostAuthorityV01,
  type ModelGatewayCostBudgetV01,
  type ModelInvocationReceiptPurposeV02,
} from "@/types/vnext/model-invocation-receipt";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";

const SAFE_TEXT = /^[A-Za-z0-9:._-]{1,256}$/u;
const SHA256 = /^sha256:[0-9a-f]{64}$/u;

export class ModelGatewayCostAuthorityErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "ModelGatewayCostAuthorityErrorV01";
  }
}

export type ModelGatewayCostAuthorityBuilderInputV01 = Omit<
  ModelGatewayCostAuthorityV01,
  "authority_version" | "pricing_fingerprint"
>;

export function buildModelGatewayCostAuthorityV01(
  input: ModelGatewayCostAuthorityBuilderInputV01,
): ModelGatewayCostAuthorityV01 {
  const withoutFingerprint = {
    authority_version: MODEL_GATEWAY_COST_AUTHORITY_VERSION_V01,
    ...input,
    provider_ref: normalizeExternalRefPrimitiveV01(input.provider_ref),
    model_ref: normalizeExternalRefPrimitiveV01(input.model_ref),
  };
  return validateModelGatewayCostAuthorityV01({
    ...withoutFingerprint,
    pricing_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(withoutFingerprint),
    ),
  });
}

export function validateModelGatewayCostAuthorityV01(
  input: unknown,
): ModelGatewayCostAuthorityV01 {
  const value = plainRecord(input);
  exactKeys(value, [
    "authority_version",
    "authority_kind",
    "workspace_id",
    "project_id",
    "purpose",
    "provider_ref",
    "model_ref",
    "cost_unit",
    "input_rate",
    "output_rate",
    "pricing_source_version",
    "pricing_effective_at",
    "pricing_expires_at",
    "project_model_policy_fingerprint",
    "pricing_fingerprint",
  ]);
  if (
    value.authority_version !== MODEL_GATEWAY_COST_AUTHORITY_VERSION_V01 ||
    value.authority_kind !== "provider_model_pricing_snapshot" ||
    typeof value.workspace_id !== "string" ||
    !value.workspace_id.startsWith("workspace:") ||
    typeof value.project_id !== "string" ||
    !value.project_id.startsWith("project:") ||
    ![
      "observe_delta_compile",
      "planner_plan",
      "temporal_interpretation",
      "strategic_advantage_transfer",
    ].includes(String(value.purpose)) ||
    typeof value.cost_unit !== "string" ||
    !SAFE_TEXT.test(value.cost_unit) ||
    typeof value.pricing_source_version !== "string" ||
    !SAFE_TEXT.test(value.pricing_source_version) ||
    typeof value.project_model_policy_fingerprint !== "string" ||
    !SHA256.test(value.project_model_policy_fingerprint) ||
    typeof value.pricing_fingerprint !== "string" ||
    !SHA256.test(value.pricing_fingerprint)
  ) {
    invalid("model_gateway_cost_authority_invalid");
  }
  const providerRef = externalRef(value.provider_ref, "model_provider");
  const modelRef = externalRef(value.model_ref, "provider_model");
  if (
    providerRef.provider !== providerRef.external_id ||
    modelRef.provider !== providerRef.external_id
  ) {
    invalid("model_gateway_cost_route_conflict");
  }
  const inputRate = rate(value.input_rate, "utf8_byte");
  const outputRate = rate(value.output_rate, "token");
  const effective = timestamp(value.pricing_effective_at);
  const expires =
    value.pricing_expires_at === null
      ? null
      : timestamp(value.pricing_expires_at);
  if (expires !== null && expires <= effective) {
    invalid("model_gateway_cost_authority_invalid");
  }
  const normalized = structuredClone(value) as unknown as ModelGatewayCostAuthorityV01;
  const { pricing_fingerprint: _ignored, ...withoutFingerprint } = normalized;
  if (
    normalized.pricing_fingerprint !==
    createProtocolSha256V01(
      canonicalizeProtocolValueV01(withoutFingerprint),
    )
  ) {
    invalid("model_gateway_cost_binding_conflict");
  }
  return {
    ...normalized,
    provider_ref: providerRef,
    model_ref: modelRef,
    input_rate: inputRate,
    output_rate: outputRate,
  };
}

export function buildModelGatewayCostBudgetV01(input: {
  authority: unknown;
  workspace_id: string;
  project_id: string;
  purpose: ModelInvocationReceiptPurposeV02;
  provider_ref: ExternalRefV01;
  model_ref: ExternalRefV01;
  maximum_input_units: number;
  maximum_output_units: number;
  timeout_ms: number;
  maximum_permitted_cost: number;
  evaluated_at: string;
}): ModelGatewayCostBudgetV01 {
  const authority = validateModelGatewayCostAuthorityV01(input.authority);
  if (
    authority.workspace_id !== input.workspace_id ||
    authority.project_id !== input.project_id ||
    authority.purpose !== input.purpose ||
    canonicalizeProtocolValueV01(authority.provider_ref) !==
      canonicalizeProtocolValueV01(
        normalizeExternalRefPrimitiveV01(input.provider_ref),
      ) ||
    canonicalizeProtocolValueV01(authority.model_ref) !==
      canonicalizeProtocolValueV01(
        normalizeExternalRefPrimitiveV01(input.model_ref),
      )
  ) {
    invalid("model_gateway_cost_binding_conflict");
  }
  const evaluatedAt = timestamp(input.evaluated_at);
  const effectiveAt = timestamp(authority.pricing_effective_at);
  const expiresAt = authority.pricing_expires_at
    ? timestamp(authority.pricing_expires_at)
    : null;
  if (evaluatedAt < effectiveAt || (expiresAt !== null && evaluatedAt >= expiresAt)) {
    invalid("model_gateway_pricing_stale");
  }
  const maximumInputUnits = positiveSafeInteger(input.maximum_input_units);
  const maximumOutputUnits = positiveSafeInteger(input.maximum_output_units);
  const timeoutMs = positiveSafeInteger(input.timeout_ms);
  const maximumPermittedCost = nonnegativeSafeInteger(
    input.maximum_permitted_cost,
  );
  const inputCost = safeMultiply(
    maximumInputUnits,
    authority.input_rate.cost_per_unit,
  );
  const outputCost = safeMultiply(
    maximumOutputUnits,
    authority.output_rate.cost_per_unit,
  );
  const calculatedWorstCaseCost = safeAdd(inputCost, outputCost);
  if (calculatedWorstCaseCost > maximumPermittedCost) {
    invalid("model_gateway_cost_budget_exceeded");
  }
  return {
    budget_version: MODEL_GATEWAY_COST_BUDGET_VERSION_V01,
    authority,
    maximum_input_units: maximumInputUnits,
    maximum_output_units: maximumOutputUnits,
    maximum_invocation_count: 1,
    timeout_ms: timeoutMs,
    evaluated_at: input.evaluated_at,
    maximum_permitted_cost: maximumPermittedCost,
    calculated_worst_case_cost: calculatedWorstCaseCost,
    within_ceiling: true,
  };
}

export function validateModelGatewayCostBudgetV01(
  input: unknown,
): ModelGatewayCostBudgetV01 {
  const value = plainRecord(input);
  exactKeys(value, [
    "budget_version",
    "authority",
    "maximum_input_units",
    "maximum_output_units",
    "maximum_invocation_count",
    "timeout_ms",
    "evaluated_at",
    "maximum_permitted_cost",
    "calculated_worst_case_cost",
    "within_ceiling",
  ]);
  if (
    value.budget_version !== MODEL_GATEWAY_COST_BUDGET_VERSION_V01 ||
    value.maximum_invocation_count !== 1 ||
    value.within_ceiling !== true
  ) {
    invalid("model_gateway_cost_budget_invalid");
  }
  const authority = validateModelGatewayCostAuthorityV01(value.authority);
  const maximumInputUnits = positiveSafeInteger(value.maximum_input_units);
  const maximumOutputUnits = positiveSafeInteger(value.maximum_output_units);
  const timeoutMs = positiveSafeInteger(value.timeout_ms);
  timestamp(value.evaluated_at);
  const maximumPermittedCost = nonnegativeSafeInteger(
    value.maximum_permitted_cost,
  );
  const calculated = safeAdd(
    safeMultiply(maximumInputUnits, authority.input_rate.cost_per_unit),
    safeMultiply(maximumOutputUnits, authority.output_rate.cost_per_unit),
  );
  if (
    calculated !== value.calculated_worst_case_cost ||
    calculated > maximumPermittedCost
  ) {
    invalid("model_gateway_cost_binding_conflict");
  }
  return structuredClone(value) as unknown as ModelGatewayCostBudgetV01;
}

export function assertModelGatewayCostBudgetCurrentV01(
  input: unknown,
  evaluatedAt: string,
): ModelGatewayCostBudgetV01 {
  const budget = validateModelGatewayCostBudgetV01(input);
  const current = timestamp(evaluatedAt);
  const effective = timestamp(budget.authority.pricing_effective_at);
  const expires = budget.authority.pricing_expires_at
    ? timestamp(budget.authority.pricing_expires_at)
    : null;
  if (current < effective || (expires !== null && current >= expires)) {
    invalid("model_gateway_pricing_stale");
  }
  return budget;
}

function externalRef(value: unknown, type: string): ExternalRefV01 {
  const ref = normalizeExternalRefPrimitiveV01(value as ExternalRefV01);
  if (
    ref.ref_type !== type ||
    ref.trust_class !== "direct_local_observation" ||
    !ref.external_id
  ) {
    invalid("model_gateway_cost_route_conflict");
  }
  return ref;
}

function rate(
  value: unknown,
  unit: "utf8_byte",
): { unit: "utf8_byte"; cost_per_unit: number };
function rate(
  value: unknown,
  unit: "token",
): { unit: "token"; cost_per_unit: number };
function rate(value: unknown, unit: "utf8_byte" | "token") {
  const record = plainRecord(value);
  exactKeys(record, ["unit", "cost_per_unit"]);
  if (record.unit !== unit) invalid("model_gateway_cost_authority_invalid");
  return { unit, cost_per_unit: nonnegativeSafeInteger(record.cost_per_unit) };
}

function plainRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    invalid("model_gateway_cost_authority_invalid");
  }
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, keys: string[]): void {
  if (
    canonicalizeProtocolValueV01(Object.keys(value).sort()) !==
    canonicalizeProtocolValueV01([...keys].sort())
  ) {
    invalid("model_gateway_cost_authority_invalid");
  }
}

function timestamp(value: unknown): number {
  if (typeof value !== "string") invalid("model_gateway_cost_authority_invalid");
  try {
    const parsed = parseStrictIsoTimestampV01(value);
    if (parsed === null) invalid("model_gateway_cost_authority_invalid");
    return parsed;
  } catch {
    invalid("model_gateway_cost_authority_invalid");
  }
}

function positiveSafeInteger(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) <= 0) {
    invalid("model_gateway_cost_authority_invalid");
  }
  return Number(value);
}

function nonnegativeSafeInteger(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0) {
    invalid("model_gateway_cost_authority_invalid");
  }
  return Number(value);
}

function safeMultiply(left: number, right: number): number {
  const value = left * right;
  if (!Number.isSafeInteger(value)) invalid("model_gateway_cost_calculation_invalid");
  return value;
}

function safeAdd(left: number, right: number): number {
  const value = left + right;
  if (!Number.isSafeInteger(value)) invalid("model_gateway_cost_calculation_invalid");
  return value;
}

function invalid(code: string): never {
  throw new ModelGatewayCostAuthorityErrorV01(code);
}
