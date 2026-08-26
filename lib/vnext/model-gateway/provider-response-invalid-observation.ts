import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";

const SAFE_DIAGNOSTIC_TOKEN_V01 = /^[A-Za-z0-9:._/-]{1,160}$/u;
const SHA256_V01 = /^sha256:[0-9a-f]{64}$/u;

export const MODEL_PROVIDER_RESPONSE_INVALID_OBSERVATION_VERSION_V01 =
  "model_provider_response_invalid_observation.v0.1" as const;

export const MODEL_PROVIDER_RESPONSE_INVALID_STAGES_V01 = [
  "response_json_unreadable",
  "response_envelope_invalid",
  "response_status_not_completed",
  "response_output_text_missing",
  "response_output_text_out_of_bounds",
  "response_usage_invalid",
  "response_wire_json_invalid",
  "response_wire_shape_invalid",
  "response_wire_value_invalid",
  "response_wire_selection_invalid",
  "response_local_derivation_invalid",
  "response_other_invalid",
] as const;

export type ModelProviderResponseInvalidStageV01 =
  (typeof MODEL_PROVIDER_RESPONSE_INVALID_STAGES_V01)[number];

export const MODEL_PROVIDER_RESPONSE_STATUSES_V01 = [
  "completed",
  "incomplete",
  "failed",
  "unknown",
] as const;

export type ModelProviderResponseStatusV01 =
  (typeof MODEL_PROVIDER_RESPONSE_STATUSES_V01)[number];

export const MODEL_PROVIDER_INCOMPLETE_REASONS_V01 = [
  "max_output_tokens",
  "content_filter",
  "unknown",
] as const;

export type ModelProviderIncompleteReasonV01 =
  (typeof MODEL_PROVIDER_INCOMPLETE_REASONS_V01)[number];

export interface ModelProviderResponseInvalidObservationV01 {
  observation_version: typeof MODEL_PROVIDER_RESPONSE_INVALID_OBSERVATION_VERSION_V01;
  stage: ModelProviderResponseInvalidStageV01;
  provider_status: ModelProviderResponseStatusV01 | null;
  incomplete_reason: ModelProviderIncompleteReasonV01 | null;
  output_text_present: boolean;
  provider_request_id: string | null;
  client_request_id: string;
  route_fingerprint: string;
  request_fingerprint: string;
  schema_fingerprint: string;
}

export function projectModelProviderResponseInvalidObservationV01(input: {
  stage: ModelProviderResponseInvalidStageV01;
  provider_status?: unknown;
  incomplete_reason?: unknown;
  output_text_present: boolean;
  provider_request_id?: unknown;
  client_request_id: string;
  route_fingerprint: string;
  request_fingerprint: string;
  schema_fingerprint: string;
}): ModelProviderResponseInvalidObservationV01 {
  if (
    !MODEL_PROVIDER_RESPONSE_INVALID_STAGES_V01.includes(input.stage) ||
    typeof input.output_text_present !== "boolean" ||
    !SAFE_DIAGNOSTIC_TOKEN_V01.test(input.client_request_id) ||
    !SHA256_V01.test(input.route_fingerprint) ||
    !SHA256_V01.test(input.request_fingerprint) ||
    !SHA256_V01.test(input.schema_fingerprint)
  ) {
    throw new Error("model_provider_response_invalid_observation_invalid");
  }
  return {
    observation_version:
      MODEL_PROVIDER_RESPONSE_INVALID_OBSERVATION_VERSION_V01,
    stage: input.stage,
    provider_status: boundedProviderStatusV01(input.provider_status),
    incomplete_reason: boundedIncompleteReasonV01(input.incomplete_reason),
    output_text_present: input.output_text_present,
    provider_request_id: boundedSafeTokenV01(input.provider_request_id),
    client_request_id: input.client_request_id,
    route_fingerprint: input.route_fingerprint,
    request_fingerprint: input.request_fingerprint,
    schema_fingerprint: input.schema_fingerprint,
  };
}

export function fingerprintModelProviderResponseInvalidObservationV01(
  observation: ModelProviderResponseInvalidObservationV01,
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01(observation),
  );
}

function boundedProviderStatusV01(
  value: unknown,
): ModelProviderResponseStatusV01 | null {
  if (value === undefined || value === null) return null;
  return MODEL_PROVIDER_RESPONSE_STATUSES_V01.includes(
    value as ModelProviderResponseStatusV01,
  )
    ? (value as ModelProviderResponseStatusV01)
    : "unknown";
}

function boundedIncompleteReasonV01(
  value: unknown,
): ModelProviderIncompleteReasonV01 | null {
  if (value === undefined || value === null) return null;
  return MODEL_PROVIDER_INCOMPLETE_REASONS_V01.includes(
    value as ModelProviderIncompleteReasonV01,
  )
    ? (value as ModelProviderIncompleteReasonV01)
    : "unknown";
}

function boundedSafeTokenV01(value: unknown): string | null {
  if (typeof value !== "string" || !SAFE_DIAGNOSTIC_TOKEN_V01.test(value)) {
    return null;
  }
  const lower = value.toLowerCase();
  if (
    lower.startsWith("sk-") ||
    lower.startsWith("bearer") ||
    lower.startsWith("eyj") ||
    lower.includes("authorization") ||
    lower.includes("api_key")
  ) {
    return null;
  }
  return value;
}
