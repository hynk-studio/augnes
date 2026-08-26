#!/usr/bin/env node

import assert from "node:assert/strict";

import {
  ExpectedRefusalAccountingError,
  createExpectedRefusalAccounting,
  unexpectedConsoleErrorsForExpectedRefusals,
} from "./browser-expected-refusal-accounting.mjs";

const SESSION_PATH = "/api/vnext/operator/session";
const REFUSAL_TEXT =
  "Failed to load resource: the server responded with a status of 403 (Forbidden)";
const tests = [];

test("one response and one immediate Chrome log", () => {
  const accounting = createAccounting();
  observeCompleteLifecycle(accounting, {
    refusalRequestId: "request:immediate",
    recoveryRequestId: "request:recovery",
    authenticatedRequestId: "request:authenticated",
  });
  const report = accounting.finalize();
  assert.equal(report.ok, true);
  assert.equal(report.tokens[0].refusal.response_count, 1);
  assert.equal(report.tokens[0].chrome_log.expected_count, 1);
  assert.equal(report.tokens[0].chrome_log.duplicate_count, 0);
});

test("one response and one late Chrome log", () => {
  const accounting = createAccounting();
  observeCompleteLifecycle(accounting, {
    refusalRequestId: "request:late",
    recoveryRequestId: "request:late-recovery",
    authenticatedRequestId: "request:late-authenticated",
    logAfterRecovery: true,
    logPhase: "later_phase",
  });
  const report = accounting.finalize();
  assert.equal(report.ok, true);
  assert.equal(report.tokens[0].refusal.phase_started, "refusal_phase");
  assert.equal(report.tokens[0].chrome_log.phase_observed, "later_phase");
});

test("duplicate observer delivery is recorded without double consumption", () => {
  const accounting = createAccounting();
  observeCompleteLifecycle(accounting, {
    refusalRequestId: "request:duplicate",
    recoveryRequestId: "request:duplicate-recovery",
    authenticatedRequestId: "request:duplicate-authenticated",
    duplicateLog: true,
  });
  const report = accounting.finalize();
  assert.equal(report.ok, true);
  assert.equal(report.tokens[0].chrome_log.expected_count, 1);
  assert.equal(report.tokens[0].chrome_log.duplicate_count, 1);
  assert.deepEqual(report.classified_console_indexes, [0, 1]);
  assert.equal(report.duplicate_deliveries.length, 1);
});

test("multiple exact refusal responses with different request IDs fail", () => {
  const accounting = createAccounting();
  accounting.observe(
    requestEvent({
      sequence: 1,
      requestId: "71071.22",
      phase: "refusal_phase",
    }),
  );
  accounting.observe(
    responseEvent({
      sequence: 2,
      requestId: "71071.22",
      status: 403,
      phase: "refusal_phase",
    }),
  );
  accounting.observe(
    requestEvent({
      sequence: 3,
      requestId: "71154.22",
      phase: "refusal_phase",
    }),
  );
  accounting.observe(
    responseEvent({
      sequence: 4,
      requestId: "71154.22",
      status: 403,
      phase: "refusal_phase",
    }),
  );
  assertAccountingError(
    () => accounting.finalize(),
    "multiple_exact_refusal_responses",
  );
});

test("an exact extra refusal in a later phase still fails", () => {
  const accounting = createAccounting();
  observeCompleteLifecycle(accounting, {
    refusalRequestId: "request:original-refusal",
    recoveryRequestId: "request:original-recovery",
    authenticatedRequestId: "request:original-authenticated",
  });
  accounting.observe(
    requestEvent({
      sequence: 11,
      requestId: "request:later-extra-refusal",
      phase: "later_phase",
    }),
  );
  accounting.observe(
    responseEvent({
      sequence: 12,
      requestId: "request:later-extra-refusal",
      status: 403,
      phase: "later_phase",
    }),
  );
  assertAccountingError(
    () => accounting.finalize(),
    "multiple_exact_refusal_responses",
  );
});

test("a response with a missing Chrome log fails", () => {
  const accounting = createAccounting();
  observeCompleteLifecycle(accounting, {
    refusalRequestId: "request:missing-log",
    recoveryRequestId: "request:missing-log-recovery",
    authenticatedRequestId: "request:missing-log-authenticated",
    omitLog: true,
  });
  assert.equal(accounting.isSettled("expected:stale-session"), false);
  assertAccountingError(
    () => accounting.finalize(),
    "expected_refusal_log_missing",
  );
});

test("an unrelated console error during the same phase remains unexpected", () => {
  const accounting = createAccounting();
  observeCompleteLifecycle(accounting, {
    refusalRequestId: "request:unrelated-console",
    recoveryRequestId: "request:unrelated-console-recovery",
    authenticatedRequestId: "request:unrelated-console-authenticated",
  });
  accounting.observe(
    runtimeConsoleEvent({
      sequence: 11,
      rawConsoleIndex: 1,
      phase: "refusal_phase",
      text: "unrelated application failure",
    }),
  );
  const report = accounting.finalize();
  assert.equal(
    report.event_ledger.at(-1).disposition,
    "unrelated_observer_event",
  );
  const rawConsoleErrors = [
    rawConsole(REFUSAL_TEXT, SESSION_PATH),
    rawConsole("unrelated application failure", "/api/unrelated"),
  ];
  const before = structuredClone(rawConsoleErrors);
  const unexpected = unexpectedConsoleErrorsForExpectedRefusals({
    rawConsoleErrors,
    accounting,
  });
  assert.deepEqual(unexpected, [rawConsoleErrors[1]]);
  assert.deepEqual(rawConsoleErrors, before);
});

test("successful authenticated-session recovery is separately bound", () => {
  const accounting = createAccounting();
  observeCompleteLifecycle(accounting, {
    refusalRequestId: "request:refusal",
    recoveryRequestId: "request:bootstrap-200",
    authenticatedRequestId: "request:authenticated-get-200",
  });
  const token = accounting.finalize().tokens[0];
  assert.equal(token.refusal.request_id, "request:refusal");
  assert.equal(token.refusal.status, 403);
  assert.equal(token.recovery.request_id, "request:bootstrap-200");
  assert.equal(token.recovery.status, 200);
  assert.equal(
    token.authenticated.request_id,
    "request:authenticated-get-200",
  );
  assert.equal(token.authenticated.status, 200);
  assert.notEqual(token.refusal.request_id, token.recovery.request_id);
  assert.notEqual(token.refusal.request_id, token.authenticated.request_id);
});

test("a permanently failing session fails closed", () => {
  const accounting = createAccounting();
  accounting.observe(
    requestEvent({
      sequence: 1,
      requestId: "request:permanent-refusal",
      phase: "refusal_phase",
    }),
  );
  accounting.observe(
    responseEvent({
      sequence: 2,
      requestId: "request:permanent-refusal",
      status: 403,
      phase: "refusal_phase",
    }),
  );
  accounting.observe(
    logEvent({
      sequence: 3,
      requestId: "request:permanent-refusal",
      rawConsoleIndex: 0,
      phase: "refusal_phase",
    }),
  );
  accounting.observe(
    terminalEvent({
      sequence: 4,
      requestId: "request:permanent-refusal",
      phase: "refusal_phase",
    }),
  );
  accounting.observe(
    requestEvent({
      sequence: 5,
      requestId: "request:permanent-recovery",
      method: "POST",
      phase: "refusal_phase",
    }),
  );
  accounting.observe(
    responseEvent({
      sequence: 6,
      requestId: "request:permanent-recovery",
      method: "POST",
      status: 403,
      phase: "refusal_phase",
    }),
  );
  assertAccountingError(
    () => accounting.finalize(),
    "expected_refusal_recovery_failed",
  );
});

test("a log observed in a later phase uses exact request identity", () => {
  const accounting = createAccounting();
  observeCompleteLifecycle(accounting, {
    refusalRequestId: "request:cross-phase",
    recoveryRequestId: "request:cross-phase-recovery",
    authenticatedRequestId: "request:cross-phase-authenticated",
    logAfterRecovery: true,
    logPhase: "phase_after_refusal",
  });
  const token = accounting.finalize().tokens[0];
  assert.equal(token.refusal.phase_started, "refusal_phase");
  assert.equal(token.chrome_log.phase_observed, "phase_after_refusal");
  assert.equal(token.chrome_log.network_request_id, "request:cross-phase");
});

test("a later 200 cannot satisfy the earlier 403 expectation", () => {
  const accounting = createAccounting();
  accounting.observe(
    requestEvent({
      sequence: 1,
      requestId: "request:wrong-status",
      phase: "refusal_phase",
    }),
  );
  accounting.observe(
    responseEvent({
      sequence: 2,
      requestId: "request:wrong-status",
      status: 200,
      phase: "refusal_phase",
    }),
  );
  assertAccountingError(
    () => accounting.finalize(),
    "expected_refusal_response_mismatch",
  );
});

test("another endpoint or status is not hidden", () => {
  const accounting = createAccounting();
  observeCompleteLifecycle(accounting, {
    refusalRequestId: "request:other-endpoint",
    recoveryRequestId: "request:other-endpoint-recovery",
    authenticatedRequestId: "request:other-endpoint-authenticated",
  });
  accounting.finalize();
  const rawConsoleErrors = [
    rawConsole(REFUSAL_TEXT, SESSION_PATH),
    rawConsole(
      "Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
      "/api/another-endpoint",
    ),
    rawConsole(
      "Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
      SESSION_PATH,
    ),
  ];
  assert.deepEqual(
    unexpectedConsoleErrorsForExpectedRefusals({
      rawConsoleErrors,
      accounting,
    }),
    [rawConsoleErrors[1], rawConsoleErrors[2]],
  );
  for (const [path, status] of [
    ["/api/another-endpoint", 500],
    [SESSION_PATH, 500],
  ]) {
    const networkAccounting = createAccounting();
    observeCompleteLifecycle(networkAccounting, {
      refusalRequestId: `request:network-error:${path}`,
      recoveryRequestId: `request:network-error-recovery:${path}`,
      authenticatedRequestId:
        `request:network-error-authenticated:${path}`,
    });
    networkAccounting.observe(
      requestEvent({
        sequence: 11,
        requestId: `request:unrelated-network:${path}`,
        phase: "later_phase",
        path,
      }),
    );
    networkAccounting.observe(
      responseEvent({
        sequence: 12,
        requestId: `request:unrelated-network:${path}`,
        phase: "later_phase",
        path,
        status,
      }),
    );
    assertAccountingError(
      () => networkAccounting.finalize(),
      "unexpected_network_error_response",
    );
  }
});

test("terminal-before-log and log-before-terminal orderings both settle", () => {
  for (const terminalBeforeLog of [false, true]) {
    const accounting = createAccounting();
    observeCompleteLifecycle(accounting, {
      refusalRequestId: `request:ordering:${terminalBeforeLog}`,
      recoveryRequestId: `request:ordering-recovery:${terminalBeforeLog}`,
      authenticatedRequestId:
        `request:ordering-authenticated:${terminalBeforeLog}`,
      terminalBeforeLog,
    });
    assert.equal(accounting.finalize().ok, true);
  }
});

test("a distinct second log is not treated as a duplicate", () => {
  const accounting = createAccounting();
  observeCompleteLifecycle(accounting, {
    refusalRequestId: "request:ambiguous-duplicate",
    recoveryRequestId: "request:ambiguous-duplicate-recovery",
    authenticatedRequestId: "request:ambiguous-duplicate-authenticated",
    secondDistinctLog: true,
  });
  assertAccountingError(
    () => accounting.finalize(),
    "multiple_refusal_logs",
  );
});

test("a missing-ID log falls back only for one unambiguous candidate", () => {
  const accounting = createAccounting();
  observeCompleteLifecycle(accounting, {
    refusalRequestId: "request:no-log-id",
    recoveryRequestId: "request:no-log-id-recovery",
    authenticatedRequestId: "request:no-log-id-authenticated",
    omitLogRequestId: true,
  });
  const token = accounting.finalize().tokens[0];
  assert.equal(token.chrome_log.network_request_id, null);
  assert.equal(token.chrome_log.correlation, "single_candidate_fallback");
});

test("a missing-ID log with multiple candidates fails as ambiguous", () => {
  const accounting = createExpectedRefusalAccounting();
  register(accounting, {
    tokenId: "expected:first",
    phase: "first_phase",
  });
  register(accounting, {
    tokenId: "expected:second",
    phase: "second_phase",
  });
  accounting.observe(
    requestEvent({
      sequence: 1,
      requestId: "request:first-candidate",
      phase: "first_phase",
    }),
  );
  accounting.observe(
    responseEvent({
      sequence: 2,
      requestId: "request:first-candidate",
      status: 403,
      phase: "first_phase",
    }),
  );
  accounting.observe(
    requestEvent({
      sequence: 3,
      requestId: "request:second-candidate",
      phase: "second_phase",
    }),
  );
  accounting.observe(
    responseEvent({
      sequence: 4,
      requestId: "request:second-candidate",
      status: 403,
      phase: "second_phase",
    }),
  );
  accounting.observe(
    logEvent({
      sequence: 5,
      requestId: null,
      rawConsoleIndex: 0,
      phase: "later_phase",
    }),
  );
  assertAccountingError(
    () => accounting.finalize(),
    "ambiguous_refusal_log_correlation",
  );
});

test("phase completion alone cannot settle a missing expected log", () => {
  const accounting = createAccounting();
  accounting.observe(
    requestEvent({
      sequence: 1,
      requestId: "request:phase-complete",
      phase: "refusal_phase",
    }),
  );
  accounting.observe(
    responseEvent({
      sequence: 2,
      requestId: "request:phase-complete",
      status: 403,
      phase: "refusal_phase",
    }),
  );
  accounting.observe(
    terminalEvent({
      sequence: 3,
      requestId: "request:phase-complete",
      phase: "refusal_phase",
    }),
  );
  assert.equal(accounting.isSettled("expected:stale-session"), false);
});

test("the final global audit still fails on unrelated raw errors", () => {
  const accounting = createAccounting();
  observeCompleteLifecycle(accounting, {
    refusalRequestId: "request:global-audit",
    recoveryRequestId: "request:global-audit-recovery",
    authenticatedRequestId: "request:global-audit-authenticated",
  });
  accounting.finalize();
  const rawConsoleErrors = [
    rawConsole(REFUSAL_TEXT, SESSION_PATH),
    rawConsole("unrelated raw console error", null),
  ];
  assert.throws(
    () =>
      assert.deepEqual(
        unexpectedConsoleErrorsForExpectedRefusals({
          rawConsoleErrors,
          accounting,
        }),
        [],
      ),
    assert.AssertionError,
  );
});

for (const { name, run } of tests) {
  run();
  process.stdout.write(`[expected-refusal] ${name}: pass\n`);
}

process.stdout.write(
  `${JSON.stringify({
    test: "browser-expected-refusal-accounting",
    status: "pass",
    cases: tests.length,
  })}\n`,
);

function test(name, run) {
  tests.push({ name, run });
}

function createAccounting() {
  const accounting = createExpectedRefusalAccounting();
  register(accounting, {
    tokenId: "expected:stale-session",
    phase: "refusal_phase",
  });
  return accounting;
}

function register(accounting, { tokenId, phase }) {
  accounting.register({
    token_id: tokenId,
    phase,
    refusal: {
      method: "GET",
      path: SESSION_PATH,
      status: 403,
      chrome_log_text: REFUSAL_TEXT,
    },
    recovery: {
      method: "POST",
      path: SESSION_PATH,
      status: 200,
    },
    authenticated: {
      method: "GET",
      path: SESSION_PATH,
      status: 200,
    },
  });
}

function observeCompleteLifecycle(
  accounting,
  {
    refusalRequestId,
    recoveryRequestId,
    authenticatedRequestId,
    terminalBeforeLog = false,
    logAfterRecovery = false,
    logPhase = "refusal_phase",
    duplicateLog = false,
    secondDistinctLog = false,
    omitLog = false,
    omitLogRequestId = false,
  },
) {
  let sequence = 1;
  accounting.observe(
    requestEvent({
      sequence: sequence++,
      requestId: refusalRequestId,
      phase: "refusal_phase",
    }),
  );
  accounting.observe(
    responseEvent({
      sequence: sequence++,
      requestId: refusalRequestId,
      status: 403,
      phase: "refusal_phase",
    }),
  );
  if (terminalBeforeLog) {
    accounting.observe(
      terminalEvent({
        sequence: sequence++,
        requestId: refusalRequestId,
        phase: "refusal_phase",
      }),
    );
  }
  if (!omitLog && !logAfterRecovery) {
    const primaryLogSequence = sequence++;
    accounting.observe(
      logEvent({
        sequence: primaryLogSequence,
        requestId: omitLogRequestId ? null : refusalRequestId,
        rawConsoleIndex: 0,
        phase: logPhase,
      }),
    );
    if (duplicateLog) {
      accounting.observe(
        logEvent({
          sequence: sequence++,
          requestId: omitLogRequestId ? null : refusalRequestId,
          rawConsoleIndex: 1,
          phase: logPhase,
          fingerprint: "log:refusal",
          cdpTimestamp: primaryLogSequence,
        }),
      );
    }
    if (secondDistinctLog) {
      accounting.observe(
        logEvent({
          sequence: sequence++,
          requestId: refusalRequestId,
          rawConsoleIndex: 1,
          phase: logPhase,
          fingerprint: "log:refusal:distinct",
        }),
      );
    }
  }
  if (!terminalBeforeLog) {
    accounting.observe(
      terminalEvent({
        sequence: sequence++,
        requestId: refusalRequestId,
        phase: "refusal_phase",
      }),
    );
  }
  accounting.observe(
    requestEvent({
      sequence: sequence++,
      requestId: recoveryRequestId,
      method: "POST",
      phase: "refusal_phase",
    }),
  );
  accounting.observe(
    responseEvent({
      sequence: sequence++,
      requestId: recoveryRequestId,
      method: "POST",
      status: 200,
      phase: "refusal_phase",
    }),
  );
  accounting.observe(
    terminalEvent({
      sequence: sequence++,
      requestId: recoveryRequestId,
      method: "POST",
      status: 200,
      phase: "refusal_phase",
    }),
  );
  accounting.observe(
    requestEvent({
      sequence: sequence++,
      requestId: authenticatedRequestId,
      phase: "refusal_phase",
    }),
  );
  accounting.observe(
    responseEvent({
      sequence: sequence++,
      requestId: authenticatedRequestId,
      status: 200,
      phase: "refusal_phase",
    }),
  );
  accounting.observe(
    terminalEvent({
      sequence: sequence++,
      requestId: authenticatedRequestId,
      status: 200,
      phase: "refusal_phase",
    }),
  );
  if (!omitLog && logAfterRecovery) {
    accounting.observe(
      logEvent({
        sequence: sequence++,
        requestId: omitLogRequestId ? null : refusalRequestId,
        rawConsoleIndex: 0,
        phase: logPhase,
      }),
    );
  }
}

function requestEvent({
  sequence,
  requestId,
  phase,
  method = "GET",
  path = SESSION_PATH,
}) {
  return {
    sequence,
    event_name: "Network.requestWillBeSent",
    request_id: requestId,
    log_network_request_id: null,
    phase_observed: phase,
    cdp_timestamp: sequence,
    observation_monotonic_ms: sequence,
    method,
    status: null,
    url: `http://127.0.0.1:3000${path}`,
    path,
    raw_text: null,
    raw_console_index: null,
    event_fingerprint: `request:${requestId}`,
  };
}

function responseEvent({
  sequence,
  requestId,
  phase,
  status,
  method = "GET",
  path = SESSION_PATH,
}) {
  return {
    ...requestEvent({ sequence, requestId, phase, method, path }),
    event_name: "Network.responseReceived",
    status,
    event_fingerprint: `response:${requestId}:${status}`,
  };
}

function terminalEvent({
  sequence,
  requestId,
  phase,
  status = null,
  method = "GET",
  path = SESSION_PATH,
}) {
  return {
    ...requestEvent({ sequence, requestId, phase, method, path }),
    event_name: "Network.loadingFinished",
    status,
    event_fingerprint: `finished:${requestId}`,
  };
}

function logEvent({
  sequence,
  requestId,
  phase,
  rawConsoleIndex,
  fingerprint = "log:refusal",
  cdpTimestamp = sequence,
}) {
  return {
    sequence,
    event_name: "Log.entryAdded",
    request_id: null,
    log_network_request_id: requestId,
    phase_observed: phase,
    cdp_timestamp: cdpTimestamp,
    observation_monotonic_ms: sequence,
    method: "GET",
    status: 403,
    url: `http://127.0.0.1:3000${SESSION_PATH}`,
    path: SESSION_PATH,
    raw_text: REFUSAL_TEXT,
    raw_console_index: rawConsoleIndex,
    event_fingerprint: fingerprint,
  };
}

function runtimeConsoleEvent({
  sequence,
  phase,
  rawConsoleIndex,
  text,
}) {
  return {
    sequence,
    observer_channel: "Runtime",
    event_name: "Runtime.consoleAPICalled",
    request_id: null,
    log_network_request_id: null,
    phase_observed: phase,
    cdp_timestamp: sequence,
    observation_monotonic_ms: sequence,
    method: null,
    status: null,
    url: null,
    path: null,
    raw_text: text,
    raw_console_index: rawConsoleIndex,
    event_fingerprint: `runtime-console:${sequence}:${text}`,
  };
}

function rawConsole(text, path) {
  return {
    phase: "refusal_phase",
    path,
    text,
  };
}

function assertAccountingError(run, code) {
  assert.throws(
    run,
    (error) =>
      error instanceof ExpectedRefusalAccountingError &&
      error.code === code,
  );
}
