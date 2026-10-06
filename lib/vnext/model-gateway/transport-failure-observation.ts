const VERSION = "model_transport_failure_observation.v0.1" as const;
const NAMES = ["Error", "TypeError", "AggregateError", "AbortError", "TimeoutError"] as const;
const CODES = [
  "EACCES", "EPERM", "ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "ECONNRESET",
  "ENETUNREACH", "EHOSTUNREACH", "ETIMEDOUT", "EPIPE",
  "UND_ERR_CONNECT_TIMEOUT", "UND_ERR_HEADERS_TIMEOUT", "UND_ERR_BODY_TIMEOUT",
  "UND_ERR_SOCKET", "UND_ERR_ABORTED", "ERR_INVALID_CHAR", "ERR_INVALID_HTTP_TOKEN",
  "ERR_TLS_CERT_ALTNAME_INVALID", "CERT_HAS_EXPIRED", "DEPTH_ZERO_SELF_SIGNED_CERT",
  "SELF_SIGNED_CERT_IN_CHAIN", "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
] as const;

export interface ModelTransportFailureObservationV01 {
  observation_version: typeof VERSION;
  phase: "request_transport";
  error_name: (typeof NAMES)[number] | "unknown";
  error_code: (typeof CODES)[number] | null;
  cause_code: (typeof CODES)[number] | null;
  signal_aborted: boolean;
}

// Inspect only data properties, with bounded prototype traversal. Never invoke
// exception getters/toJSON or retain messages, stacks, headers, bodies or URLs.
function property(value: unknown, key: string): unknown {
  try {
    for (let depth = 0; depth < 3 && value && typeof value === "object"; depth++) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor) return "value" in descriptor ? descriptor.value : undefined;
      value = Object.getPrototypeOf(value);
    }
  } catch { /* Uninspectable exceptions convey no diagnostic value. */ }
  return undefined;
}

function member<T extends string>(values: readonly T[], value: unknown): T | null {
  return typeof value === "string" && values.includes(value as T) ? value as T : null;
}

export function projectModelTransportFailureObservationV01(
  error: unknown,
  signalAborted: boolean,
): ModelTransportFailureObservationV01 {
  return {
    observation_version: VERSION,
    phase: "request_transport",
    error_name: member(NAMES, property(error, "name")) ?? "unknown",
    error_code: member(CODES, property(error, "code")),
    cause_code: member(CODES, property(property(error, "cause"), "code")),
    signal_aborted: signalAborted,
  };
}

/** Re-project at error/persistence boundaries; never trust extra adapter fields.
 * This observation is diagnostic only, not delivery, settlement or retry proof. */
export function normalizeModelTransportFailureObservationV01(
  value: unknown,
): ModelTransportFailureObservationV01 | null {
  if (property(value, "observation_version") !== VERSION ||
      property(value, "phase") !== "request_transport" ||
      typeof property(value, "signal_aborted") !== "boolean") return null;
  return {
    observation_version: VERSION,
    phase: "request_transport",
    error_name: member(NAMES, property(value, "error_name")) ?? "unknown",
    error_code: member(CODES, property(value, "error_code")),
    cause_code: member(CODES, property(value, "cause_code")),
    signal_aborted: property(value, "signal_aborted") as boolean,
  };
}
