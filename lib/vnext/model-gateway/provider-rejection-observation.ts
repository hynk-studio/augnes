import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";

const SAFE_DIAGNOSTIC_TOKEN_V01 = /^[A-Za-z0-9:._/-]{1,160}$/u;
const SHA256_V01 = /^sha256:[0-9a-f]{64}$/u;

export const MODEL_PROVIDER_REQUEST_FAMILY_KINDS_V01 = [
  "cohort_attempt",
  "compatibility_probe",
  "replacement_cohort",
  "clean_control_compatibility_probe",
  "parser_closed_compatibility_probe",
  "parser_closed_clean_control_cohort",
  "operational_reentry_v04_compatibility_probe",
  "operational_reentry_v04_stale_reset_isolation_cohort",
] as const;

export type ModelProviderRequestFamilyKindV01 =
  (typeof MODEL_PROVIDER_REQUEST_FAMILY_KINDS_V01)[number];

export const MODEL_PROVIDER_REJECTION_OBSERVATION_VERSION_V01 =
  "model_provider_rejection_observation.v0.1" as const;

export interface ModelProviderRejectionObservationV01 {
  observation_version: typeof MODEL_PROVIDER_REJECTION_OBSERVATION_VERSION_V01;
  http_status: number;
  error_type: string | null;
  error_code: string | null;
  error_param: string | null;
  provider_request_id: string | null;
  client_request_id: string;
  route_fingerprint: string;
  request_fingerprint: string;
  schema_fingerprint: string;
}

/**
 * Creates a non-semantic trace for one sealed provider-request family. The
 * caller must supply a fingerprint unique to that authorized attempt, probe,
 * or replacement. Rebuilding the same sealed family remains deterministic.
 */
export function createDeterministicModelProviderRequestTraceV01(input: {
  request_family_kind: ModelProviderRequestFamilyKindV01;
  request_family_fingerprint: string;
}): string {
  if (
    !MODEL_PROVIDER_REQUEST_FAMILY_KINDS_V01.includes(
      input.request_family_kind,
    ) ||
    !SHA256_V01.test(input.request_family_fingerprint)
  ) {
    throw new Error("model_provider_request_trace_invalid");
  }
  return `acgc_trace_${protocolHashTokenV01(input)}`;
}

export function createDeterministicModelClientRequestIdV01(input: {
  purpose: string;
  provider_request_trace_id: string;
  call_slot_id: string;
  model: string;
}): string {
  if (
    !SAFE_DIAGNOSTIC_TOKEN_V01.test(input.purpose) ||
    !SAFE_DIAGNOSTIC_TOKEN_V01.test(input.provider_request_trace_id) ||
    !SAFE_DIAGNOSTIC_TOKEN_V01.test(input.call_slot_id) ||
    !SAFE_DIAGNOSTIC_TOKEN_V01.test(input.model)
  ) {
    throw new Error("model_client_request_id_input_invalid");
  }
  return `acgc_req_${protocolHashTokenV01(input)}`;
}

export function projectModelProviderRejectionObservationV01(input: {
  http_status: unknown;
  error_payload: unknown;
  provider_request_id: unknown;
  client_request_id: string;
  route_fingerprint: string;
  request_fingerprint: string;
  schema_fingerprint: string;
}): ModelProviderRejectionObservationV01 {
  if (
    !Number.isSafeInteger(input.http_status) ||
    (input.http_status as number) < 400 ||
    (input.http_status as number) > 599 ||
    !SAFE_DIAGNOSTIC_TOKEN_V01.test(input.client_request_id) ||
    !SHA256_V01.test(input.route_fingerprint) ||
    !SHA256_V01.test(input.request_fingerprint) ||
    !SHA256_V01.test(input.schema_fingerprint)
  ) {
    throw new Error("model_provider_rejection_observation_invalid");
  }
  const error = directErrorRecordV01(input.error_payload);
  return {
    observation_version: MODEL_PROVIDER_REJECTION_OBSERVATION_VERSION_V01,
    http_status: input.http_status as number,
    error_type: boundedSafeTokenV01(safeOwnValueV01(error, "type")),
    error_code: boundedSafeTokenV01(safeOwnValueV01(error, "code")),
    error_param: boundedSafeTokenV01(safeOwnValueV01(error, "param")),
    provider_request_id: boundedSafeTokenV01(input.provider_request_id),
    client_request_id: input.client_request_id,
    route_fingerprint: input.route_fingerprint,
    request_fingerprint: input.request_fingerprint,
    schema_fingerprint: input.schema_fingerprint,
  };
}

function safeOwnValueV01(
  value: Record<string, unknown> | null,
  key: string,
): unknown {
  if (!value) return null;
  try {
    return Object.getOwnPropertyDescriptor(value, key)?.value;
  } catch {
    return null;
  }
}

function directErrorRecordV01(value: unknown): Record<string, unknown> | null {
  try {
    if (!isPlainRecordV01(value)) return null;
    const error = Object.getOwnPropertyDescriptor(value, "error")?.value;
    return isPlainRecordV01(error) ? error : null;
  } catch {
    return null;
  }
}

function boundedSafeTokenV01(value: unknown): string | null {
  if (typeof value !== "string" || !SAFE_DIAGNOSTIC_TOKEN_V01.test(value)) {
    return null;
  }
  const lower = value.toLowerCase();
  const forbiddenFragments = [
    "sk-",
    ["bear", "er"].join(""),
    "eyj",
    ["author", "ization"].join(""),
    "api_key",
  ];
  if (
    lower.startsWith(forbiddenFragments[0]!) ||
    lower.startsWith(forbiddenFragments[1]!) ||
    lower.startsWith(forbiddenFragments[2]!) ||
    lower.includes(forbiddenFragments[3]!) ||
    lower.includes(forbiddenFragments[4]!)
  ) {
    return null;
  }
  return value;
}

function isPlainRecordV01(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function protocolHashTokenV01(value: unknown): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(value)).slice(
    "sha256:".length,
    "sha256:".length + 40,
  );
}
