#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createProjectExperienceRequestVerdictV1 } from "./project-experience-request-verdict-v1.mjs";

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
function fixture({ begin = true } = {}) {
  const listeners = [];
  const state = {
    requestVerdicts: createProjectExperienceRequestVerdictV1(),
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
  if (begin) state.requestVerdicts.beginUnavailableExecutionProbe();
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
          url: `${options.origin ?? "http://localhost:3000"}${options.path ?? route}` },
      }, options);
    },
    response(options = {}) {
      emit("Network.responseReceived", {
        requestId: options.id ?? "synthetic-probe", type: "Fetch",
        response: { status: options.status ?? 404,
          url: `http://localhost:3000${options.path ?? route}` },
      }, options);
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
    complete: () => state.requestVerdicts.completeUnavailableExecutionProbe(),
    expected: entry => state.expectedFailedRequest(entry),
  };
}

// Exact historical shape: same request, expected response, successful functional probe,
// then a canceled abort. The failed receipt itself is not reclassified by this test.
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
  f.state.requestVerdicts.beginUnavailableExecutionProbe();
  assert.equal(f.expected(failure), false, "a new probe resets functional completion");
}

const rejected = [];
function rejects(label, exercise) {
  const f = fixture();
  const failure = exercise(f);
  assert.equal(f.expected(failure), false, label);
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
rejects("two candidate fetches in the functional probe window", f => {
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

// Failure-receipt phase need not equal request-start phase; identity owns the match.
{
  const f = fixture();
  f.request(); f.response(); f.complete();
  assert.equal(f.expected(f.failure({ phase: "project_home_lifecycle_presentation" })), true);
}
{
  const f = fixture({ begin: false });
  f.request(); f.response(); f.complete();
  assert.equal(f.expected(f.failure()), false, "an unscoped fetch cannot inherit the probe marker");
}

// Execute the actual functional call site and browserFetchJson with a synthetic fetch.
// Completion must wait for JSON and the 404 assertion, even when headers already arrived.
for (const outcome of ["404 body read", "wrong status", "body read failure"]) {
  const f = fixture({ begin: false });
  let bodyStarted, releaseBody, rejectBody, completed = false;
  const started = new Promise(resolve => { bodyStarted = resolve; });
  const body = new Promise((resolve, reject) => { releaseBody = resolve; rejectBody = reject; });
  const owner = f.state.requestVerdicts;
  f.state.requestVerdicts = { ...owner, completeUnavailableExecutionProbe() {
    completed = true;
    owner.completeUnavailableExecutionProbe();
  } };
  f.state.assert = assert;
  f.state.evaluateJson = expression => vm.runInNewContext(expression, {
    fetch: async (pathname, options) => {
      assert.equal(pathname, route);
      assert.equal(options.method, "GET");
      f.request(); f.response({ status: outcome === "wrong status" ? 200 : 404 });
      return { status: outcome === "wrong status" ? 200 : 404, json() { bodyStarted(); return body; } };
    },
  });
  vm.runInContext(between("async function browserFetchJson(", "async function submitGuideBriefUtteranceForPausedInterpretation("), f.context);
  const callSite = between("    requestVerdicts.beginUnavailableExecutionProbe();", "    const savedDefinition =");
  const action = vm.runInContext(`(async () => { ${callSite} })()`, f.context);
  await started;
  assert.equal(completed, false, "response headers alone do not complete the probe");
  if (outcome === "body read failure") rejectBody(new Error("synthetic_body_read_failure"));
  else releaseBody({});
  if (outcome === "404 body read") await action;
  else await assert.rejects(action);
  assert.equal(completed, outcome === "404 body read");
  assert.equal(f.expected(f.failure()), outcome === "404 body read");
}

process.stdout.write(`${JSON.stringify({ test: "project-experience-request-verdict-v1", status: "pass",
  synthetic_events_only: true, historical_shape_expected: true, negative_cases_rejected: rejected.length,
  functional_body_and_status_completion_required: true, diagnostic_sidecar_not_used: true })}\n`);
