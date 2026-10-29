import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runCanonicalChild } from "./canonical-child-runner.mjs";
import { createCanonicalTestResourceRoot, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse, cleanupCanonicalTestResources, buildCanonicalChildEnvironment } from "./canonical-test-environment.mjs";
import { REVIEW_CHILD_RESULT_PREFIX, projectReviewChildResult, assertReviewChildLifecycle } from "./fixtures/local-canonical-review-child-result.mjs";

const scripts = path.dirname(fileURLToPath(import.meta.url));
const owner = createCanonicalTestResourceRoot("ag-resource-test-");
const env = buildCanonicalChildEnvironment({ temporaryRoot: owner.root });
const checks = [];
let inFlight = false;
beginCanonicalTestResourceUse(owner);
try {
  for (const control of [
    { id: "review-child-acceptance", fixture: "local-canonical-review-child-acceptance.mjs", argument: path.join(scripts, "test-local-canonical-review-corrections.mjs"), schema: "augnes.review-owner-child-acceptance-regression.v0.1" },
    { id: "review-child-adverse", fixture: "local-canonical-review-child-adverse.mjs", argument: scripts, schema: "augnes.review-child-adverse.v0.1" },
  ]) {
    let output = "", overflow = false;
    inFlight = true;
    const result = await runCanonicalChild({ suite: "review-child-result", label: control.id, command: process.execPath,
      args: [path.join(scripts, "fixtures", control.fixture), control.argument], cwd: owner.root, env, timeoutMs: 12000,
      stdout: { write(chunk) { output += chunk.toString(); if (output.length > 32000) { overflow = true; output = ""; } } },
      stderr: { write() {} }, log() {} });
    inFlight = !(result.exit_observed && result.streams_closed && result.cleanup_completed && result.remaining_owned_processes === 0);
    const diagnostic = projectReviewChildResult(result, { controlId: control.id });
    console.log(REVIEW_CHILD_RESULT_PREFIX + JSON.stringify(diagnostic));
    assertReviewChildLifecycle(result, { controlId: control.id });
    assert.equal(result.exit_code, 0, JSON.stringify(diagnostic));
    assert(!overflow, "bounded regression output required");
    const lines = output.trim().split("\n");
    assert.equal(lines.length, 1, "only the bounded regression summary may escape");
    let summary;
    try { summary = JSON.parse(lines[0]); } catch { throw new Error("review_child_summary_invalid"); }
    assert(summary?.schema === control.schema, "known regression summary required");
    assert(summary?.status === "pass", "regression controls must pass");
    checks.push(control.id);
  }
} finally {
  if (!inFlight) settleCanonicalTestResourceUse(owner, { exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0 });
  assert(cleanupCanonicalTestResources([owner]).every(result => result.completed));
}
console.log(JSON.stringify({ status: "pass", checks, cleanup_complete: true }));
