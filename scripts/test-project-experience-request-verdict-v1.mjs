#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import "./test-project-experience-session-refusal-v1.mjs";
import {
  createProjectExperienceRequestVerdictV1,
  UNAVAILABLE_EXECUTION_PROBE_HEADERS_V1,
} from "./project-experience-request-verdict-v1.mjs";

const phase = "companion_first_work_access";
const route = "/api/vnext/operator/host-round-trip";
const source = readFileSync(new URL("./browser-validate-project-experience-v1.mjs", import.meta.url), "utf8");
function between(start, end) {
  const offset = source.indexOf(start);
  const limit = source.indexOf(end, offset + start.length);
  assert(offset >= 0 && limit > offset, "owned function boundary exists");
  return source.slice(offset, limit);
}

// Exercise the real observer and global-boundary classifier, without starting a Browser.
function fixture({ armed = true } = {}) {
  const listeners = [];
  const state = {
    requestVerdicts: createProjectExperienceRequestVerdictV1(),
    UNAVAILABLE_EXECUTION_PROBE_HEADERS_V1,
    requestDiagnostics: { connection: () => null, observe() {} },
    cdp: { on: listener => listeners.push(listener) },
    requests: [], responses: [], failedRequests: [], externalRequests: [],
    currentPhase: phase, lastObserverActivityAt: 0, Date, URL,
    LOCAL_HOSTNAMES: new Set(["localhost", "127.0.0.1", "[::1]"]),
  };
  const context = vm.createContext(state);
  vm.runInContext(
    between("function attachCdpObservers()", "async function restartRuntime(") +
    between("function expectedFailedRequest(", "async function assertLoopbackListener(") +
    "\nattachCdpObservers();", context,
  );
  let generation;
  const arm = () => (generation = state.requestVerdicts.armUnavailableExecutionProbe());
  if (armed) arm();
  const emit = (method, params, options) => {
    state.currentPhase = options.phase ?? phase;
    listeners[options.connection ?? 0]({ method, params,
      sessionId: Object.hasOwn(options, "session") ? options.session : "synthetic-session-a" });
  };
  return {
    state, context,
    request(options = {}) {
      emit("Network.requestWillBeSent", {
        requestId: Object.hasOwn(options, "id") ? options.id : "synthetic-probe",
        type: "Fetch", redirectResponse: options.redirectResponse,
        request: { method: options.method ?? "GET",
          url: `${options.origin ?? "http://localhost:3000"}${options.path ?? route}`,
          headers: Object.hasOwn(options, "headers") ? options.headers : UNAVAILABLE_EXECUTION_PROBE_HEADERS_V1 },
      }, options);
    },
    response(options = {}) {
      emit("Network.responseReceived", {
        requestId: options.id ?? "synthetic-probe", type: "Fetch",
        response: { status: options.status ?? 404,
          url: `http://localhost:3000${options.path ?? route}` },
      }, options);
    },
    finished(options = {}) {
      emit("Network.loadingFinished", { requestId: options.id ?? "synthetic-probe" }, options);
    },
    failure(options = {}) {
      emit("Network.loadingFailed", {
        requestId: options.id ?? "synthetic-probe", type: "Fetch",
        errorText: options.error ?? "net::ERR_ABORTED",
        canceled: Object.hasOwn(options, "canceled") ? options.canceled : true,
      }, options);
      return state.failedRequests.at(-1);
    },
    connection() {
      vm.runInContext("attachCdpObservers();", context);
      return listeners.length - 1;
    },
    arm,
    complete: (token = generation) => state.requestVerdicts.completeUnavailableExecutionProbe(token),
    expected: entry => state.expectedFailedRequest(entry),
    reason: entry => state.requestVerdicts.unavailableExecutionAbortReason(entry),
  };
}

// Historical response/failure ordering, with the new explicit test-only request marker.
// Neither unmarked traffic nor either historical failed receipt is reclassified here.
{
  const f = fixture();
  f.request();
  f.response();
  f.complete();
  const failure = f.failure();
  assert.equal(f.expected(failure), true);
  assert.equal(f.state.responses[0].method, "GET");
  assert.equal(JSON.stringify(failure).includes("synthetic-"), false, "no raw identity in failure output");
  assert.equal(f.expected({ ...failure }), false, "a coarse or copied row cannot forge correlation");
  const anotherRun = fixture();
  assert.equal(anotherRun.expected(failure), false, "evidence cannot transfer between runs");
  f.arm();
  assert.equal(f.expected(failure), false, "a new probe resets functional completion");
}

const rejected = [];
const boundedReasons = new Set([
  "no_failure_evidence", "request_phase_mismatch", "route_mismatch", "request_method_mismatch",
  "request_not_local", "probe_marker_absent", "probe_marker_mismatch", "probe_not_armed",
  "request_ambiguous", "multiple_marked_requests", "marked_request_not_observed",
  "failure_not_bound_to_probe", "probe_not_completed", "response_missing", "response_status_mismatch",
  "failure_error_mismatch", "cancellation_not_true", "completed_marked_probe_abort",
]);
function rejects(label, exercise, reason) {
  const f = fixture();
  const failure = exercise(f);
  assert.equal(f.expected(failure), false, label);
  assert(boundedReasons.has(f.reason(failure)), "rejection explanation is a fixed safe enum");
  if (reason) assert.equal(f.reason(failure), reason, label);
  rejected.push(label);
}
rejects("abort before any response", f => {
  f.request(); f.complete(); return f.failure();
});
rejects("response from a different request", f => {
  f.request(); f.complete();
  f.request({ id: "synthetic-other" }); f.response({ id: "synthetic-other" }); return f.failure();
});
for (const status of [200, 401, 409, 500, "404"]) {
  rejects(`response status ${JSON.stringify(status)}`, f => {
    f.request(); f.response({ status }); f.complete(); return f.failure();
  });
}
for (const method of ["POST", "get"]) {
  rejects(`request method ${method}`, f => {
    f.request({ method }); f.response(); f.complete(); return f.failure();
  });
}
for (const canceled of [false, undefined, null, "true"]) {
  rejects(`canceled ${String(canceled)}`, f => {
    f.request(); f.response(); f.complete(); return f.failure({ canceled });
  });
}
rejects("reused request identity", f => {
  f.request(); f.request(); f.response(); f.complete(); return f.failure();
});
rejects("identity reused after failure", f => {
  f.request(); f.response(); f.complete(); const failure = f.failure();
  f.request(); return failure;
});
rejects("redirect without an observed predecessor", f => {
  f.request({ redirectResponse: { status: 302 } }); f.response(); f.complete(); return f.failure();
});
rejects("redirect with the same protocol identity", f => {
  f.request(); f.request({ redirectResponse: { status: 302 } });
  f.response(); f.complete(); return f.failure();
});
rejects("unmatched response", f => {
  f.request(); f.response({ id: "synthetic-missing" }); f.complete(); return f.failure();
});
rejects("unmatched failure", f => {
  f.request(); f.response(); f.complete(); return f.failure({ id: "synthetic-missing" });
});
rejects("unmatched event followed by a reused identity", f => {
  f.response(); f.request(); f.response(); f.complete(); return f.failure();
});
rejects("functional probe incomplete", f => {
  f.request(); f.response(); return f.failure();
});
rejects("unrelated route", f => {
  f.request({ path: "/api/healthz" }); f.response({ path: "/api/healthz" }); f.complete(); return f.failure();
});
rejects("wrong request start phase", f => {
  f.request({ phase: "rendered_state_responsive_matrix" }); f.response(); f.complete(); return f.failure();
});
for (const error of ["net::ERR_FAILED", "net::ERR_CONNECTION_RESET"]) {
  rejects(error, f => {
    f.request(); f.response(); f.complete(); return f.failure({ error });
  });
}
rejects("response arrived after failure", f => {
  f.request(); f.complete(); const failure = f.failure(); f.response(); return failure;
});
rejects("response in a different session", f => {
  f.request(); f.response({ session: "synthetic-session-b" }); f.complete(); return f.failure();
});
rejects("response on a different connection", f => {
  f.request(); f.response({ connection: f.connection() }); f.complete(); return f.failure();
});
rejects("failure in a different session", f => {
  f.request(); f.response(); f.complete(); return f.failure({ session: "synthetic-session-b" });
});
rejects("failure on a different connection", f => {
  f.request(); f.response(); f.complete(); return f.failure({ connection: f.connection() });
});
rejects("duplicate response", f => {
  f.request(); f.response(); f.response(); f.complete(); return f.failure();
});
rejects("response path mismatch", f => {
  f.request(); f.response({ path: "/api/healthz" }); f.complete(); return f.failure();
});
rejects("two marked candidate fetches", f => {
  f.request(); f.request({ id: "synthetic-second" }); f.response(); f.complete(); return f.failure();
});
rejects("later same-route request cannot inherit completed probe", f => {
  f.request(); f.response(); f.complete(); f.request({ id: "synthetic-second" });
  f.response({ id: "synthetic-second" }); return f.failure({ id: "synthetic-second" });
});
rejects("external request", f => {
  f.request({ origin: "https://example.invalid" }); f.response(); f.complete(); return f.failure();
});
for (const id of [undefined, ""]) {
  rejects(`invalid request identity ${String(id)}`, f => {
    f.request({ id }); f.response(); f.complete(); return f.failure();
  });
}
rejects("invalid session identity", f => {
  f.request({ session: "" }); f.response({ session: "" }); f.complete(); return f.failure({ session: "" });
});
rejects("duplicate failure", f => {
  f.request(); f.response(); f.complete(); const failure = f.failure(); f.failure(); return failure;
});
const preservedNegativeCases = rejected.length;
assert.equal(preservedNegativeCases, 39, "all previous rejection cases remain covered");

// Background same-route traffic must neither claim nor contaminate the marked probe.
{
  const f = fixture();
  f.request({ id: "synthetic-background", headers: {} });
  f.request(); f.response(); f.complete();
  const markedFailure = f.failure();
  assert.equal(f.expected(markedFailure), true);
  assert.equal(f.reason(markedFailure), "completed_marked_probe_abort");
  f.response({ id: "synthetic-background" });
  const backgroundFailure = f.failure({ id: "synthetic-background" });
  assert.equal(f.expected(backgroundFailure), false);
  assert.equal(f.reason(backgroundFailure), "probe_marker_absent");
  assert.equal(f.expected(markedFailure), true, "the unmarked failure does not change probe identity");
  assert.equal(JSON.stringify(f.state.unavailableExecutionVerdictSummary()),
    JSON.stringify({ completed_marked_probe_abort: 1, probe_marker_absent: 1 }));
}
rejects("unmarked background abort after marked probe completes normally", f => {
  f.request({ id: "synthetic-background", headers: {} });
  f.request(); f.response(); f.complete(); f.finished();
  f.response({ id: "synthetic-background" });
  return f.failure({ id: "synthetic-background" });
}, "probe_marker_absent");
rejects("correct route and method without marker", f => {
  f.request({ headers: {} }); f.response(); f.complete(); return f.failure();
}, "probe_marker_absent");
for (const headers of [
  { "x-augnes-e2e-probe": "wrong-probe" },
  { "x-augnes-e2e-probe": "unavailable-execution-v1, other" },
  { "x-augnes-e2e-probe": ["unavailable-execution-v1"] },
  { ...UNAVAILABLE_EXECUTION_PROBE_HEADERS_V1, "X-Augnes-E2E-Probe": "unavailable-execution-v1" },
]) {
  rejects("wrong or ambiguous test marker", f => {
    f.request({ headers }); f.response(); f.complete(); return f.failure();
  }, "probe_marker_mismatch");
}
rejects("marked POST", f => {
  f.request({ method: "POST" }); f.response(); f.complete(); return f.failure();
}, "request_method_mismatch");
rejects("marker on unrelated route", f => {
  f.request({ path: "/api/healthz" }); f.response({ path: "/api/healthz" }); f.complete(); return f.failure();
}, "route_mismatch");
rejects("two marked requests including one after functional completion", f => {
  f.request(); f.response(); f.complete(); const failure = f.failure();
  f.request({ id: "synthetic-second" }); return failure;
}, "multiple_marked_requests");
rejects("marked identity reused", f => {
  f.request(); f.request(); f.response(); f.complete(); return f.failure();
}, "request_ambiguous");
rejects("marked redirect", f => {
  f.request({ redirectResponse: { status: 302 } }); f.response(); f.complete(); return f.failure();
}, "request_ambiguous");
rejects("response belongs to an unmarked request", f => {
  f.request(); f.request({ id: "synthetic-background", headers: {} });
  f.response({ id: "synthetic-background" }); f.complete(); return f.failure();
}, "response_missing");
rejects("completion token from another generation", f => {
  const previous = f.arm(); f.request({ id: "synthetic-old" }); f.response({ id: "synthetic-old" });
  f.arm(); f.request(); f.response(); f.complete(previous); return f.failure();
}, "probe_not_completed");
rejects("old failure cannot inherit new generation completion", f => {
  f.request({ id: "synthetic-old" }); f.response({ id: "synthetic-old" });
  f.arm(); f.request(); f.response(); f.complete(); return f.failure({ id: "synthetic-old" });
}, "failure_not_bound_to_probe");
rejects("unrecognized completion token", f => {
  f.request(); f.response(); f.complete({}); return f.failure();
}, "probe_not_completed");
rejects("marked request receives ERR_FAILED", f => {
  f.request(); f.response(); f.complete(); return f.failure({ error: "net::ERR_FAILED" });
}, "failure_error_mismatch");
for (const canceled of [false, undefined]) {
  rejects("marked request cancellation must be true", f => {
    f.request(); f.response(); f.complete(); return f.failure({ canceled });
  }, "cancellation_not_true");
}
{
  const f = fixture();
  f.request({ headers: { "X-Augnes-E2E-Probe": "unavailable-execution-v1" } });
  f.response(); f.complete();
  assert.equal(f.expected(f.failure()), true, "HTTP header names are case insensitive");
}

// Diagnostic output consists only of fixed reason enums and the existing safe failure fields.
{
  const f = fixture();
  const privateValue = "synthetic-private-cookie-token-and-path";
  const scope = { id: "synthetic-private-request-id", session: "synthetic-private-session-id" };
  f.request({ ...scope, path: `${route}?private=${privateValue}`,
    headers: { ...UNAVAILABLE_EXECUTION_PROBE_HEADERS_V1, Cookie: privateValue, Authorization: privateValue } });
  f.response({ ...scope, path: `${route}?private=${privateValue}` }); f.complete();
  const failure = f.failure({ ...scope, canceled: false });
  assert.equal(f.reason(failure), "cancellation_not_true");
  // Even accidental extra fields on a verdict row must not enter this assertion projection.
  failure.request_id = scope.id;
  failure.headers = { Cookie: privateValue };
  const projection = f.state.failedRequestAssertionEntry(failure);
  assert.equal(projection.verdict_reason, "cancellation_not_true");
  const output = JSON.stringify({ assertion: projection, reasons: f.state.unavailableExecutionVerdictSummary() });
  for (const value of [privateValue, scope.id, scope.session, "Cookie", "Authorization", "?private=", "headers"]) {
    assert.equal(output.includes(value), false, "private material must not enter verdict diagnostics");
  }
  assert.equal(f.reason({ ...failure }), "no_failure_evidence");
}

// Failure-receipt phase need not equal request-start phase; identity owns the match.
{
  const f = fixture();
  f.request(); f.response(); f.complete();
  assert.equal(f.expected(f.failure({ phase: "project_home_lifecycle_presentation" })), true);
}
{
  const f = fixture({ armed: false });
  f.request(); f.response(); f.complete();
  const failure = f.failure();
  assert.equal(f.expected(failure), false, "an unarmed fetch cannot inherit the probe marker");
  assert.equal(f.reason(failure), "probe_not_armed");
  f.arm(); f.complete();
  assert.equal(f.reason(failure), "marked_request_not_observed");
}

// Execute the actual functional call site and browserFetchJson with a synthetic fetch.
// Completion must wait for JSON and the 404 assertion, even when headers already arrived.
for (const outcome of ["404 body read", "wrong status", "body read failure", "new generation during body read"]) {
  const f = fixture({ armed: false });
  let bodyStarted, releaseBody, rejectBody, completed = false;
  const started = new Promise(resolve => { bodyStarted = resolve; });
  const body = new Promise((resolve, reject) => { releaseBody = resolve; rejectBody = reject; });
  const owner = f.state.requestVerdicts;
  f.state.requestVerdicts = { ...owner, completeUnavailableExecutionProbe(generation) {
    completed = true;
    owner.completeUnavailableExecutionProbe(generation);
  } };
  f.state.assert = assert;
  f.state.evaluateJson = expression => vm.runInNewContext(expression, {
    fetch: async (pathname, options) => {
      assert.equal(pathname, route);
      assert.equal(options.method, "GET");
      assert.equal(JSON.stringify(options.headers), JSON.stringify(UNAVAILABLE_EXECUTION_PROBE_HEADERS_V1));
      f.request({ headers: options.headers }); f.response({ status: outcome === "wrong status" ? 200 : 404 });
      return { status: outcome === "wrong status" ? 200 : 404, json() { bodyStarted(); return body; } };
    },
  });
  vm.runInContext(between("async function browserFetchJson(", "async function submitGuideBriefUtteranceForPausedInterpretation("), f.context);
  const callSite = between("    const unavailableExecutionProbe = requestVerdicts.armUnavailableExecutionProbe();", "    const savedDefinition =");
  const action = vm.runInContext(`(async () => { ${callSite} })()`, f.context);
  await started;
  assert.equal(completed, false, "response headers alone do not complete the probe");
  if (outcome === "new generation during body read") {
    f.arm(); f.request({ id: "synthetic-new-generation" }); f.response({ id: "synthetic-new-generation" });
  }
  if (outcome === "body read failure") rejectBody(new Error("synthetic_body_read_failure"));
  else releaseBody({});
  if (["404 body read", "new generation during body read"].includes(outcome)) await action;
  else await assert.rejects(action);
  assert.equal(completed, ["404 body read", "new generation during body read"].includes(outcome));
  const failure = f.failure(outcome === "new generation during body read" ? { id: "synthetic-new-generation" } : {});
  assert.equal(f.expected(failure), outcome === "404 body read");
  if (outcome === "new generation during body read") assert.equal(f.reason(failure), "probe_not_completed");
}

// The shared fetch helper does not automatically mark any other call, even to the same route.
{
  const f = fixture({ armed: false });
  f.state.evaluateJson = expression => vm.runInNewContext(expression, {
    fetch: async (_pathname, options) => {
      assert.equal(options.headers?.["x-augnes-e2e-probe"], undefined);
      if (options.method === "POST") assert.equal(options.headers["content-type"], "application/json");
      else assert.equal(options.headers, undefined);
      return { status: 404, json: async () => ({}) };
    },
  });
  vm.runInContext(between("async function browserFetchJson(", "async function submitGuideBriefUtteranceForPausedInterpretation("), f.context);
  await f.state.browserFetchJson(route);
  await f.state.browserFetchJson("/api/healthz", { method: "POST", explicitBody: {} });
}

process.stdout.write(`${JSON.stringify({ test: "project-experience-request-verdict-v1", status: "pass",
  synthetic_events_only: true, completed_marked_probe_shape_expected: true, negative_cases_rejected: rejected.length,
  previous_negative_cases_preserved: preservedNegativeCases, marked_background_collision_distinguished: true,
  functional_body_and_status_completion_required: true, generation_bound_completion: true,
  bounded_private_verdict_reasons: true, public_diagnostic_snapshot_not_used: true })}\n`);
