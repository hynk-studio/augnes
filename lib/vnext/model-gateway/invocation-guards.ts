import { isHistoricalProjectSelectionRevision } from "@/lib/vnext/project-selection";

import {
  ModelGatewayInvocationErrorV01,
  type ModelGatewayFailureCodeV01,
  type ModelInvocationReceiptV02,
} from "@/lib/vnext/model-gateway/contracts";

const CANONICAL_ID_PATTERN =
  /^(workspace|project):[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_IDENTIFIER_PATTERN = /^[A-Za-z0-9:._-]{1,256}$/;
export function requirePlainRecord(value: unknown): Record<string, unknown> {
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

export function readOwn(record: Record<string, unknown>, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  if (!descriptor || !("value" in descriptor)) invalid();
  return descriptor.value;
}

export function requireExactKeys(
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

export function requireCanonicalId(value: unknown, kind: "workspace" | "project") {
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

export function requireSafeIdentifier(value: unknown) {
  if (typeof value !== "string" || !SAFE_IDENTIFIER_PATTERN.test(value)) invalid();
  return value;
}

export function requireSha256(value: unknown) {
  if (typeof value !== "string" || !/^sha256:[0-9a-f]{64}$/.test(value)) {
    invalid();
  }
  return value;
}

export function requireSelectionRevision(value: unknown) {
  if (!isHistoricalProjectSelectionRevision(value)) invalid();
  return value;
}

export function requireInteger(value: unknown, minimum: number, maximum: number) {
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

export function isOneOf<T extends string>(
  value: unknown,
  values: readonly T[],
): value is T {
  return typeof value === "string" && values.includes(value as T);
}

export function gatewayFailure(
  code: ModelGatewayFailureCodeV01,
  receipt: ModelInvocationReceiptV02 | null = null,
  providerRejectionObservation: ModelGatewayInvocationErrorV01["provider_rejection_observation"] = null,
  providerResponseInvalidObservation: ModelGatewayInvocationErrorV01["provider_response_invalid_observation"] = null,
  receivedResult: ModelGatewayInvocationErrorV01["received_result"] = null,
  transportFailureObservation: ModelGatewayInvocationErrorV01["transport_failure_observation"] = null,
) {
  return new ModelGatewayInvocationErrorV01(
    code,
    receipt,
    providerRejectionObservation,
    providerResponseInvalidObservation,
    receivedResult,
    transportFailureObservation,
  );
}

export function invalid(): never {
  throw gatewayFailure("model_gateway_invalid_envelope");
}
