import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { createContinuityWaitDiagnostic, withContinuityWaitDiagnostic } from "./continuity-wait-diagnostic-v1.mjs";

import {
  assertContinuityFinalSuccessV1,
  createContinuityCompletionOwnerV1,
  loadContinuityResultContractV1,
} from "./continuity-result-contract-v1.mjs";

const contract = loadContinuityResultContractV1();
assert.equal(contract.field_ids.length, 29);
assert.equal(contract.marker_ids.length, 30);
assert.equal(new Set(contract.field_ids).size, 29);
assert.equal(new Set(contract.marker_ids).size, 30);

const owner = createContinuityCompletionOwnerV1(contract);
for (const fieldId of contract.field_ids) owner.completeField(fieldId);
for (const markerId of contract.marker_ids) owner.recordMarker(markerId);
owner.assertExact();

assert.throws(
  () => owner.completeField(contract.field_ids[0]),
  /duplicate_continuity_field/u,
);
assert.throws(
  () => owner.recordMarker(contract.marker_ids[0]),
  /duplicate_continuity_marker/u,
);
assert.throws(
  () => createContinuityCompletionOwnerV1(contract).completeField("foreign"),
  /foreign_continuity_field/u,
);

const result = {
  ok: false,
  failure: null,
  completed_detailed_field_ids: owner.fieldIds(),
  completed_detailed_field_fingerprint: owner.fieldFingerprint(),
  semantic_markers: owner.markerIds(),
  semantic_marker_fingerprint: owner.markerFingerprint(),
  unexpected_external_request_count: 0,
  unexpected_console_failure_count: 0,
  unexpected_page_failure_count: 0,
  unexpected_request_failure_count: 0,
  credential_private_material_boundary: true,
  default_database_isolated: true,
  provider_or_external_network_call: false,
  cleanup_complete: true,
  owned_streams_settled: true,
  owned_process_residue_count: 0,
  listener_residue_count: 0,
  temporary_root_removed: true,
  temporary_process_root_removed: true,
  temporary_profile_removed: true,
  temporary_fixture_removed: true,
  temporary_database_removed: true,
  temporary_imported_database_removed: true,
  runtime_shutdown_complete: true,
  chrome_cdp_shutdown_complete: true,
  acceptance_bound_ms: 480_000,
  total_duration_ms: 1,
  ...Object.fromEntries(contract.field_ids.map((fieldId) => [fieldId, true])),
};

assertContinuityFinalSuccessV1({
  result,
  contract,
  completion_owner: owner,
  functional_execution_succeeded: true,
});

for (const mutation of [
  { field: contract.field_ids[0], value: false },
  { field: "cleanup_complete", value: false },
  { field: "owned_process_residue_count", value: 1 },
  { field: "listener_residue_count", value: 1 },
  { field: "unexpected_external_request_count", value: 1 },
]) {
  const changed = structuredClone(result);
  changed[mutation.field] = mutation.value;
  assert.throws(() =>
    assertContinuityFinalSuccessV1({
      result: changed,
      contract,
      completion_owner: owner,
      functional_execution_succeeded: true,
    }),
  );
}

await assertWaitDiagnostics();

process.stdout.write(
  `${JSON.stringify({
    test: "continuity-result-contract-v1",
    status: "pass",
    detailed_fields: contract.field_ids.length,
    semantic_markers: contract.marker_ids.length,
    wait_failure_diagnostics: "pass",
  })}\n`,
);

async function assertWaitDiagnostics() {
  // Exercise the actual harness polling function without starting Browser or a database.
  const harness = readFileSync(new URL("./browser-validate-continuity-v1.mjs", import.meta.url), "utf8");
  const waitSource = harness.slice(harness.indexOf("async function waitForCondition("), harness.indexOf("async function waitForHostCondition("));
  const predicate = harness.match(/`([^`]+)`,\s*"imported applied proposal remains visible after restart"/u)?.[1];
  assert.equal(typeof predicate, "string");
  const secret = "vnext_bootstrap_v01.private-token-and-path";
  const project = "private-project", proposal = "private-proposal", fingerprint = "private-fingerprint";
  const origin = "http://127.0.0.1:3001", path = "/workbench/semantic-review/expected";
  const phase = "final_r8_portability_reconciliation";
  const fixture = () => ({ proposal_present: true, project_matches: true, fingerprint_matches: true, secret });
  const make = (options = {}) => createContinuityWaitDiagnostic({ origin, project, proposal, fingerprint, path,
    send: async () => ({ body: "{}" }), ...options });
  const feed = (observer, id, route = "semantic-review", finish = true) => {
    const url = `${origin}/api/vnext/operator/${route}?proposal_id=${proposal}`;
    observer.observe({ method: "Network.requestWillBeSent", params: { requestId: id, frameId: secret, loaderId: secret,
      type: "Fetch", request: { url, method: "GET", headers: { Cookie: secret, "Augnes-Project-Id": project } } } }, phase);
    observer.observe({ method: "Network.responseReceived", params: { requestId: id, type: "Fetch", response: { url, status: 200 } } }, phase);
    if (finish) observer.observe({ method: "Network.loadingFinished", params: { requestId: id } }, phase);
  };
  const calls = [], emitted = [];
  const observer = make({ emit: value => emitted.push(value), send: async (method, params, timeout) => {
    calls.push({ method, timeout });
    if (params.requestId === "unreadable") throw Error("No resource with given identifier found");
    if (params.requestId === "missing") return {};
    if (params.requestId === "overflow") return { body: "x".repeat(2 * 1024 * 1024 + 1) };
    if (params.requestId === "malformed") return { body: "{" + secret };
    if (params.requestId === "refusal") return { body: JSON.stringify({ status: "error", error_code: "operator_session_scope_mismatch", secret }) };
    if (params.requestId === "unknown-refusal") return { body: JSON.stringify({ status: "error", error_code: secret }) };
    return { body: JSON.stringify({ status: "proposal_detail", cookie: secret, project: { project_id: project },
      proposal: { proposal: { proposal_id: proposal, integrity: { fingerprint } }, transition: { status: "applied" } } }) };
  } });
  for (const id of ["detail", "unreadable", "missing", "overflow", "malformed", "refusal", "unknown-refusal", "detail-2", "pending-limit"]) feed(observer, id);
  feed(observer, "incomplete", "session", false);
  observer.navigationStarted(`${origin}${path}?project_id=${project}`);
  observer.navigationResult({ frameId: secret, loaderId: "final-loader", errorText: secret });
  for (const method of ["Runtime.exceptionThrown", "Runtime.consoleAPICalled", "Network.loadingFailed"]) {
    observer.observe({ method, params: { type: "error", requestId: secret, errorText: secret,
      args: [{ value: secret }], exceptionDetails: { exception: { description: secret } } } }, phase);
  }

  let clock = 0, evaluations = 0, originalError, evidence, cleaned = false;
  const document = { readyState: "complete", querySelector(selector) {
    if (selector.includes("data-vnext-semantic-review-detail")) return { getAttribute: () => "not_applied" };
    if (selector.includes("data-vnext-operator-session")) return { getAttribute: () => "authenticated" };
    return null;
  } };
  const evaluate = expression => runInNewContext(expression, { URL, location: { href: `${origin}${path}?project_id=${project}` }, document });
  const wait = runInNewContext(`(${waitSource.trim()})`, {
    Date: { now: () => clock }, DEFAULT_TIMEOUT_MS: 45000,
    evaluateJson: async expression => { if (++evaluations === 2) throw Error("Execution context was destroyed: " + secret); return evaluate(expression); },
    evaluateBoolean: async expression => Boolean(evaluate(expression)),
    delay: async ms => { assert.equal(ms, 100); clock += ms; }, recordLongWait: () => assert.fail("false wait passed"),
  });
  try {
    await withContinuityWaitDiagnostic(observer, async () => {
      observer.waitStarted();
      try { await wait(predicate, "imported applied proposal remains visible after restart", 300, observer); }
      catch (error) { originalError = error; throw error; }
    }, fixture, value => { evidence = value; });
    assert.fail("failing wait passed");
  } catch (error) { assert.equal(error, originalError); assert.match(error.message, /Timed out waiting/u); }
  finally { cleaned = true; }
  assert(cleaned);
  assert.equal(evidence.terminal.outcome, "failure");
  assert.equal(evidence.counts.false_results, 2);
  assert.equal(evidence.counts.evaluation_errors, 1);
  assert.equal(evidence.terminal.last_condition_sample.detail_present, true);
  assert.equal(evidence.terminal.last_condition_sample.applied_marker_present, false);
  assert.equal(evidence.terminal.last_condition_sample.destination, "expected_proposal_detail");
  assert.equal(evidence.terminal.last_condition_sample.project_query, "expected");
  assert.equal(evidence.fixture.proposal_present, true);
  assert.equal(evidence.fixture.project_matches, true);
  assert.equal(evidence.fixture.fingerprint_matches, true);
  assert.equal(evidence.fixture.observation_order, "read_only_after_terminal_outcome");
  assert(evidence.fixture.at_ms >= evidence.terminal.at_ms);
  assert(emitted.some(e => e.kind === "condition_evaluation_error"));
  assert(evidence.events.some(e => e.kind === "response_body" && e.transition === "applied" && e.project_matches && e.fingerprint_matches));
  assert(evidence.events.some(e => e.kind === "response_body" && e.refusal_code === "operator_session_scope_mismatch"));
  assert(evidence.events.some(e => e.kind === "response_body" && e.refusal_code === "unrecognized_redacted"));
  assert.equal(evidence.events.filter(e => e.kind === "body_read_error").length, 4);
  assert.equal(evidence.events.filter(e => e.kind === "body_read_unavailable").length, 1);
  assert(evidence.events.some(e => e.kind === "body_read_skipped" && e.reason === "pending_limit"));
  assert(calls.every(c => c.method === "Network.getResponseBody" && c.timeout === 1000));
  for (const value of [secret, project, proposal, fingerprint, "final-loader"]) assert(!JSON.stringify(evidence).includes(value));
  const frozen = JSON.stringify(evidence);
  observer.observe({ method: "Runtime.exceptionThrown", params: {} }, phase);
  assert.equal(JSON.stringify(evidence), frozen);

  // Keep the original AND predicate, and let metadata failure neither accept nor reject it.
  for (const detail of [false, true]) for (const applied of [false, true]) {
    const value = runInNewContext(make().expression(predicate), { URL, location: { href: origin + path },
      document: { readyState: "complete", querySelector: selector => selector.includes("data-vnext-semantic-review-detail")
        ? detail ? { getAttribute: () => null } : null : selector.includes('data-vnext-transition-status="applied"') && applied ? {} : null } });
    assert.equal(value.accepted, detail && applied);
  }
  const metadataFailure = runInNewContext(make().expression("true"), { URL, location: { href: origin + path }, document: { querySelector() { throw Error(secret); } } });
  assert.equal(metadataFailure.accepted, true);
  assert.equal(metadataFailure.collection_error, true);
  assert.throws(() => runInNewContext(make().expression("missingSymbol"), {}), /missingSymbol/u);
  const corrupt = make();
  assert.equal(corrupt.conditionResult({ accepted: true, observation: { destination: secret, ready_state: secret, detail_present: secret, secret } }), true);
  assert(!JSON.stringify(corrupt.snapshot()).includes(secret));
  assert.equal(await withContinuityWaitDiagnostic(make({ emit() { throw Error(secret); } }), async () => 42,
    () => assert.fail("successful wait must not read fixture"), () => { throw Error(secret); }), 42);

  const failure = Error("original wait failure");
  async function captureFailure(candidate, readFixture = fixture) {
    let captured, cleanup = false;
    try { await withContinuityWaitDiagnostic(candidate, async () => { throw failure; }, readFixture, value => { captured = value; }); }
    catch (error) { assert.equal(error, failure); }
    finally { cleanup = true; }
    assert(cleanup); return captured;
  }
  const unreadableFixture = await captureFailure(make(), () => { throw Error(secret); });
  assert.equal(unreadableFixture.fixture.status, "collection_error");
  assert(!JSON.stringify(unreadableFixture).includes(secret));
  const timeout = make({ send: () => new Promise(() => {}) });
  feed(timeout, "stuck");
  const timed = await captureFailure(timeout);
  assert(timed.events.some(e => e.kind === "body_read_error" && e.error.known_message === "diagnostic_collection_timeout"));
  const stuckFixture = await captureFailure(make(), () => new Promise(() => {}));
  assert.equal(stuckFixture.fixture.error.known_message, "diagnostic_collection_timeout");
  let stopped = false;
  const broken = await captureFailure({ finish: () => new Promise(() => {}), stop() { stopped = true; } });
  assert(stopped); assert.equal(broken.collection_error.known_message, "diagnostic_collection_timeout");
  const threw = await captureFailure({ finish() { throw Error(secret); }, stop() {} });
  assert(threw.collection_error); assert(!JSON.stringify(threw).includes(secret));
  const unreadableError = await captureFailure({ finish() { throw { get message() { throw Error(secret); } }; }, stop() {} });
  assert.equal(unreadableError.collection_error.category, "unreadable_error");
  const journal = [], bounded = make({ emit: value => journal.push(value) });
  for (let i = 0; i < 300; i++) bounded.evaluationError(Error(secret));
  const truncated = await captureFailure(bounded);
  assert.equal(truncated.counts.evaluation_errors, 300);
  assert(truncated.events.length <= 96 && truncated.counts.omitted_events > 0);
  assert(journal.length <= 98 && truncated.counts.omitted_log_events > 0);
  assert.equal(truncated.terminal.outcome, "failure");
  assert(truncated.events.some(e => e.kind === "terminal_outcome"));
  assert(JSON.stringify(truncated).length < 100_000);
  assert(!JSON.stringify(truncated).includes(secret));
}
