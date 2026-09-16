// Private Browser-owner verdict state. The passive diagnostic sidecar is not an input.
const PROBE_PHASE = "companion_first_work_access";
const PROBE_PATH = "/api/vnext/operator/host-round-trip";
const PROBE_HEADER = "x-augnes-e2e-probe";
const PROBE_VALUE = "unavailable-execution-v1";
export const UNAVAILABLE_EXECUTION_PROBE_HEADERS_V1 = Object.freeze({
  [PROBE_HEADER]: PROBE_VALUE,
});

export function createProjectExperienceRequestVerdictV1() {
  const connections = new WeakMap();
  const failures = new WeakMap();
  let probe = null;

  const rejected = reason => ({ expected: false, reason });
  function classifyFailure(entry) {
    const evidence = failures.get(entry);
    if (!evidence) return rejected("no_failure_evidence");
    const { context, responseBeforeFailure: response, canceled } = evidence;
    const request = context.request;
    if (request.phase !== PROBE_PHASE) return rejected("request_phase_mismatch");
    if (request.path !== PROBE_PATH) return rejected("route_mismatch");
    if (request.method !== "GET") return rejected("request_method_mismatch");
    if (request.external !== false) return rejected("request_not_local");
    if (context.marker === "absent") return rejected("probe_marker_absent");
    if (context.marker !== "exact") return rejected("probe_marker_mismatch");
    if (!probe) return rejected("probe_not_armed");
    if (context.ambiguous) return rejected("request_ambiguous");
    if (probe.multipleMarkedRequests) return rejected("multiple_marked_requests");
    if (!probe.request) return rejected("marked_request_not_observed");
    if (context.generation !== probe.generation || probe.request !== context) {
      return rejected("failure_not_bound_to_probe");
    }
    if (!probe.completed) return rejected("probe_not_completed");
    if (!response) return rejected("response_missing");
    if (response.path !== PROBE_PATH) return rejected("route_mismatch");
    if (response.status !== 404) return rejected("response_status_mismatch");
    if (entry.error_text !== "net::ERR_ABORTED") return rejected("failure_error_mismatch");
    if (canceled !== true) return rejected("cancellation_not_true");
    return { expected: true, reason: "completed_marked_probe_abort" };
  }

  return Object.freeze({
    connection() {
      const connection = Object.freeze({});
      connections.set(connection, new Map());
      return connection;
    },
    armUnavailableExecutionProbe() {
      const generation = Object.freeze({});
      probe = { generation, completed: false, request: null, multipleMarkedRequests: false };
      return generation;
    },
    completeUnavailableExecutionProbe(generation) {
      if (probe && generation === probe.generation) probe.completed = true;
    },
    observe(connection, payload, entry) {
      const requests = connections.get(connection);
      const params = payload.params ?? {};
      const key = requestKey(payload.sessionId, params.requestId);
      if (!requests || key === null) return;
      let context = requests.get(key);

      if (payload.method === "Network.requestWillBeSent") {
        const reused = requests.has(key);
        if (context) context.ambiguous = true;
        context = {
          request: entry,
          response: null,
          failed: false,
          ambiguous: reused || params.redirectResponse != null,
          marker: probeMarker(params.request?.headers),
          generation: null,
        };
        requests.set(key, context);
        if (
          probe && context.marker === "exact" && !context.ambiguous &&
          entry.phase === PROBE_PHASE && entry.path === PROBE_PATH &&
          entry.method === "GET" && entry.external === false
        ) {
          if (probe.request) probe.multipleMarkedRequests = true;
          else probe.request = context;
          context.generation = probe.generation;
        }
      } else if (payload.method === "Network.responseReceived") {
        if (!context) {
          requests.set(key, null); // A later start cannot repair an unmatched event.
          return;
        }
        if (context.response || context.failed || entry.path !== context.request.path) {
          context.ambiguous = true;
        }
        entry.method = context.request.method;
        context.response = entry;
      } else if (payload.method === "Network.loadingFailed") {
        if (!context) {
          requests.set(key, null);
          return;
        }
        if (context.failed) context.ambiguous = true;
        entry.path = context.request.path;
        failures.set(entry, {
          context,
          responseBeforeFailure: context.response,
          canceled: params.canceled,
        });
        context.failed = true;
      }
    },
    expectedUnavailableExecutionAbort(entry) {
      return classifyFailure(entry).expected;
    },
    unavailableExecutionAbortReason(entry) {
      // Explanatory only: the acceptance owner consumes the boolean, not this enum.
      return classifyFailure(entry).reason;
    },
  });
}

function probeMarker(headers) {
  if (!headers || typeof headers !== "object" || Array.isArray(headers)) return "absent";
  const names = Object.keys(headers).filter(name => name.toLowerCase() === PROBE_HEADER);
  if (names.length === 0) return "absent";
  return names.length === 1 && headers[names[0]] === PROBE_VALUE ? "exact" : "invalid";
}

function requestKey(sessionId, requestId) {
  if (typeof requestId !== "string" || requestId.length === 0) return null;
  if (sessionId != null && (typeof sessionId !== "string" || sessionId.length === 0)) return null;
  // Raw protocol identity stays in ephemeral map keys, never in verdict output.
  return JSON.stringify([sessionId ?? null, requestId]);
}
