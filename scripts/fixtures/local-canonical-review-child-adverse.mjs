// Focused candidate controls. Actual child lifecycle records are consumed by
// the test helper; malformed projections never copy arbitrary process output.
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
const scripts = path.resolve(process.argv[2]);
const { runCanonicalChild } = await import(pathToFileURL(path.join(scripts, "canonical-child-runner.mjs")).href);
const resources = await import(pathToFileURL(path.join(scripts, "canonical-test-environment.mjs")).href);
const { REVIEW_CHILD_RESULT_PREFIX, projectReviewChildResult, assertReviewChildLifecycle, createObserverFixtureProgressReader } = await import(pathToFileURL(path.join(scripts, "fixtures/local-canonical-review-child-result.mjs")).href);
const owner = resources.createCanonicalTestResourceRoot("ag-resource-test-");
resources.beginCanonicalTestResourceUse(owner);
const env = resources.buildCanonicalChildEnvironment({ temporaryRoot: owner.root });
const rows = [];
let complete = true;
async function child(controlId, code, { command = process.execPath, signal, stdout = { write() {} } } = {}) {
  const result = await runCanonicalChild({ suite: "review-result-adverse", label: controlId, command, args: ["-e", code],
    cwd: owner.root, env, signal, timeoutMs: 1000, stdout, stderr: { write() {} }, log() {} });
  complete &&= result.exit_observed && result.streams_closed && result.cleanup_completed && result.remaining_owned_processes === 0;
  assert(complete, "actual child must settle");
  rows.push(projectReviewChildResult(result, { controlId }));
  return result;
}
try {
  const natural = await child("normal-zero", "process.exit(0);");
  assertReviewChildLifecycle(natural, { controlId: "normal-zero" }); assert.equal(natural.exit_code, 0);
  const expectedFailure = await child("normal-one", "process.exit(1);");
  assertReviewChildLifecycle(expectedFailure, { controlId: "normal-one" }); assert.equal(expectedFailure.exit_code, 1);
  const signalled = await child("self-signalled", "process.kill(process.pid,'SIGTERM');");
  assert.equal(signalled.signal, "SIGTERM"); assert.equal(signalled.timed_out, false);
  assert.throws(() => assertReviewChildLifecycle(signalled, { controlId: "self-signalled" }));
  const timeout = await child("timeout-zero", "process.on('SIGTERM',()=>process.exit(0));setInterval(()=>{},1000);");
  assert.equal(timeout.exit_code, 0); assert.equal(timeout.timed_out, true);
  assert.throws(() => assertReviewChildLifecycle(timeout, { controlId: "timeout-zero" }));
  const controller = new AbortController(); let ready = "";
  const cancelled = await child("cancel-zero", "process.on('SIGTERM',()=>process.exit(0));setInterval(()=>{},1000);process.stdout.write('cancel-ready\\n');", {
    signal: controller.signal, stdout: { write(chunk) { ready += chunk.toString(); assert(ready.length <= 128); if (ready === "cancel-ready\n") controller.abort(); } },
  });
  assert.equal(cancelled.cancelled, true); assert.equal(cancelled.exit_code, 0); assert.equal(cancelled.timed_out, false);
  assert.throws(() => assertReviewChildLifecycle(cancelled, { controlId: "cancel-zero" }));
  assertReviewChildLifecycle(cancelled, { controlId: "cancel-zero", expectedCancellation: true });
  assert.throws(() => assertReviewChildLifecycle(natural, { controlId: "normal-zero", expectedCancellation: true }));
  const spawn = await child("missing-command", "", { command: path.join(owner.root, "nonexistent-command") });
  assert.equal(spawn.spawn_error_code, "ENOENT");
  assert.throws(() => assertReviewChildLifecycle(spawn, { controlId: "missing-command" }));
  for (const [field, value] of [["cleanup_started", false], ["cleanup_completed", false], ["exit_observed", false], ["streams_closed", false], ["remaining_owned_processes", 1]]) {
    assert.throws(() => assertReviewChildLifecycle({ ...natural, [field]: value }, { controlId: "malformed-settlement" }), field);
  }
  const projection = projectReviewChildResult({ ...natural, signal: "private-sentinel", spawn_error_code: "private-sentinel", termination_reason: "private-sentinel", stdout: "private-sentinel", stderr: "private-sentinel" }, { controlId: "private-sentinel/invalid", progress: { stage: "private-sentinel", completed_controls: 59 } });
  assert(!JSON.stringify(projection).includes("private-sentinel")); assert(JSON.stringify(projection).length < 2048);
  const reader = createObserverFixtureProgressReader();
  const prefix = "AUGNES_OBSERVER_FIXTURE_PROGRESS ";
  const first = prefix + JSON.stringify({ stage: "setup_start", completed_controls: 0 }) + "\n";
  for (const character of first) reader.write(character);
  assert.deepEqual(reader.snapshot(), { stage: "setup_start", completed_controls: 0 });
  for (const line of ["AUGNES_BROWSER_IDENTITY private-sentinel\n", prefix + JSON.stringify({ stage: "unknown-stage", completed_controls: 1 }) + "\n", prefix + JSON.stringify({ stage: "control_complete", completed_controls: 60 }) + "\n", prefix + "x".repeat(2048) + "\n", prefix + "not-json\n"]) reader.write(line);
  assert.deepEqual(reader.snapshot(), { stage: "setup_start", completed_controls: 0 });
  reader.write(prefix + JSON.stringify({ stage: "cleanup_complete", completed_controls: 59, raw_output: "private-sentinel" }) + "\n");
  assert.deepEqual(reader.snapshot(), { stage: "cleanup_complete", completed_controls: 59 });
  assert(!JSON.stringify(reader.snapshot()).includes("private-sentinel"));
  const nestedTimeout = projectReviewChildResult(timeout, { controlId: "observer-stock", progress: { stage: "stock_start", completed_controls: 58 } });
  const { timed_out: omittedTimeout, ...missingTimeout } = nestedTimeout;
  const nestedLine = REVIEW_CHILD_RESULT_PREFIX + JSON.stringify({ ...nestedTimeout, stdout: "private-sentinel", browser_identity: "private-sentinel" }) + "\n";
  for (const character of nestedLine) reader.write(character);
  assert.deepEqual(reader.childResults(), [nestedTimeout]);
  assert.equal(reader.childResults()[0].timed_out, true);
  assert.equal(reader.childResults()[0].termination_reason, "bounded_timeout");
  for (const payload of [
    "not-json", "x".repeat(2048), "null", "[]",
    JSON.stringify({ ...nestedTimeout, control_id: "unknown-control" }),
    JSON.stringify({ ...missingTimeout, control_id: "observer-race-1" }),
    JSON.stringify({ ...nestedTimeout, control_id: "observer-stock", timed_out: null }),
    JSON.stringify({ ...nestedTimeout, control_id: "observer-stock", signal: "private-sentinel" }),
    JSON.stringify({ ...nestedTimeout, control_id: "observer-stock", last_progress: { stage: "private-sentinel", completed_controls: 1 } }),
    JSON.stringify({ ...nestedTimeout, control_id: "observer-stock", raw_output: "x".repeat(2048) }),
  ]) reader.write(REVIEW_CHILD_RESULT_PREFIX + payload + "\n");
  assert.deepEqual(reader.childResults(), [nestedTimeout]);
  const fixedInnerIds = ["observer-regression-before", "observer-regression-after", "observer-race-1", "observer-race-2", "observer-stock"];
  for (const controlId of fixedInnerIds) {
    reader.write(REVIEW_CHILD_RESULT_PREFIX + JSON.stringify(projectReviewChildResult(natural, { controlId })) + "\n");
  }
  for (let index = 0; index < 10; index += 1) reader.write(nestedLine);
  const nested = reader.childResults();
  assert.equal(nested.length, 5);
  assert.deepEqual(new Set(nested.map(record => record.control_id)), new Set(fixedInnerIds));
  assert.deepEqual(nested.find(record => record.control_id === "observer-stock"), nestedTimeout);
  assert(!JSON.stringify(nested).includes("private-sentinel"));
  assert(JSON.stringify(nested).length < 5120);
  nested[0].timed_out = "private-sentinel";
  assert(!JSON.stringify(reader.childResults()).includes("private-sentinel"));
  console.log(JSON.stringify({ schema: "augnes.review-child-adverse.v0.1", status: "pass", actual_lifecycle_cases: rows, settlement_corruption_controls: 5,
    bounded_projection: true, progress_chunking_and_allowlist: true, nested_lifecycle_allowlist_and_bound: true, nested_actual_timeout_preserved: true,
    synthetic_browser_output_ignored: true, intentional_cancellation_preserved: true }));
} finally {
  if (complete) resources.settleCanonicalTestResourceUse(owner, { exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0 });
  assert(resources.cleanupCanonicalTestResources([owner])[0].completed);
}
