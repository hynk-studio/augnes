// Private Browser-owner verdict state. The passive diagnostic sidecar is not an input.
const PROBE_PHASE = "companion_first_work_access";
const PROBE_PATH = "/api/vnext/operator/host-round-trip";

export function createProjectExperienceRequestVerdictV1() {
  const connections = new WeakMap();
  const failures = new WeakMap();
  let probe = null;

  return Object.freeze({
    connection() {
      const connection = Object.freeze({});
      connections.set(connection, new Map());
      return connection;
    },
    beginUnavailableExecutionProbe() {
      // One functional fetch owns this window; a second candidate fails closed.
      probe = { completed: false, request: null, ambiguous: false };
    },
    completeUnavailableExecutionProbe() {
      if (probe) probe.completed = true;
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
        };
        requests.set(key, context);
        if (
          probe && !probe.completed &&
          entry.phase === PROBE_PHASE && entry.path === PROBE_PATH &&
          entry.method === "GET" && entry.external === false
        ) {
          if (probe.request) probe.ambiguous = true;
          else probe.request = context;
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
      const evidence = failures.get(entry);
      if (!evidence || !probe?.completed || probe.ambiguous) return false;
      const { context, responseBeforeFailure: response, canceled } = evidence;
      const request = context.request;
      return (
        probe.request === context && !context.ambiguous &&
        request.phase === PROBE_PHASE && request.path === PROBE_PATH &&
        request.method === "GET" && request.external === false &&
        response !== null && response.path === PROBE_PATH && response.status === 404 &&
        entry.error_text === "net::ERR_ABORTED" && canceled === true
      );
    },
  });
}

function requestKey(sessionId, requestId) {
  if (typeof requestId !== "string" || requestId.length === 0) return null;
  if (sessionId != null && (typeof sessionId !== "string" || sessionId.length === 0)) return null;
  // Raw protocol identity stays in ephemeral map keys, never in verdict output.
  return JSON.stringify([sessionId ?? null, requestId]);
}
