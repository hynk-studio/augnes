import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createCanonicalTestResourceRoot, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";
import { validateBranchTrackingAddition, inspectInputPredecessor, inspectInputRequalification } from "./local-canonical-input-requalification.mjs";
import { finalizeReceipt } from "./local-canonical-receipt.mjs";
import { digest } from "./local-canonical-inputs.mjs";
import { createFixture, runInvocation, prepareProof, request, read, write } from "./fixtures/input-requalification.mjs";

// The same immutable corpus and this driver run on both production versions.
// --record records expected historical failures without redefining acceptance.
const recording = process.argv[2] === "--record", rows = [];
const corpus = JSON.parse(readFileSync(new URL("./fixtures/input-requalification-regressions.json", import.meta.url), "utf8"));
function outcome(id, expected, fn) {
  let actual = true, code = null;
  try { fn(); } catch (e) { actual = false; code = e.code ?? e.message; }
  rows.push({ id, expected, actual, matches: actual === expected, code });
}
const parse = bytes => {
  try { return execFileSync("git", ["config", "--no-includes", "--file", "-", "--null", "--list"], { input: bytes, timeout: 5000, maxBuffer: 2 * 1024 * 1024, stdio: ["pipe", "pipe", "pipe"] }).toString().split("\0").slice(0, -1); }
  catch { return null; }
};
for (const c of corpus.cases) {
  const before = Buffer.from(c.before), after = Buffer.concat([before, Buffer.from(c.suffix ?? corpus.tracking)]);
  outcome(c.id, c.accept, () => validateBranchTrackingAddition(before, after));
  Object.assign(rows.at(-1), { before: parse(before), after: parse(after) });
}
const owner = createCanonicalTestResourceRoot("ag-resource-test-");
beginCanonicalTestResourceUse(owner);
let settled = false;
try {
  for (const prefix of ["phase", "child"]) {
    const f = createFixture(owner.root, `review-${prefix}`), first = await runInvocation(f, { mutate: true, settledPrefix: prefix });
    assert.equal(first.receipt.phases[0].status, "pass");
    if (prefix === "phase") assert.equal(first.receipt.phases[0].cleanup.termination_reason, "exited_with_owned_descendant_cleanup");
    else assert.match(readFileSync(path.join(f.checkout, first.receipt.phases[0].log.relative_path), "utf8"), /termination_reason=exited_with_owned_descendant_cleanup/u);
    assert.equal(first.receipt.phases[1].failure_code, "phase_cancelled");
    assert.equal(first.receipt.inputs.first_fault.disposition, "input_invalidation");
    assert(first.receipt.phases.slice(2).every(p => p.status === "not_run"));
    const proof = await prepareProof(f, first);
    outcome(`accepted-${prefix}-prefix-before-real-invalidation`, true, () => inspectInputRequalification(request(f, { proof })));
    rows.at(-1).phases = first.receipt.phases.map(p => ({ id: p.id, status: p.status, exit: p.exit_status, cleanup: p.cleanup }));
    const originalPath = path.join(f.checkout, first.relative), originalBytes = readFileSync(originalPath);
    const completionPath = path.join(f.anchor, ".augnes-local-verification/families", first.attempt.family_id, "completion-1.json"), completionBytes = readFileSync(completionPath);
    for (const [id, change] of [
      ["incomplete-cleanup", p => p.cleanup.completed = false],
      ["owned-residue", p => p.cleanup.remaining_owned_processes = 1],
      ["independent-failure", p => { p.status = "failure"; p.failure_code = "phase_failed"; p.exit_status = 1; }],
      ["unobserved-exit", p => p.cleanup.exit_observed = false],
      ["open-stream", p => p.cleanup.streams_closed = false],
      ["browser-requires-natural", p => p.browser = true],
    ]) {
      if (prefix === "child" && id === "browser-requires-natural") continue;
      const changed = structuredClone(first.receipt); change(changed.phases[0]); const sealed = finalizeReceipt(changed);
      write(originalPath, sealed); write(completionPath, { ...JSON.parse(completionBytes), receipt_fingerprint: sealed.integrity.content_fingerprint });
      outcome(`${prefix}-${id}`, false, () => inspectInputPredecessor({ anchorRoot: f.anchor, repositoryRoot: f.checkout, receiptPath: first.relative }));
      write(originalPath, originalBytes); write(completionPath, completionBytes);
    }
    assert.equal(digest(readFileSync(originalPath)), digest(originalBytes));
  }
  const f = createFixture(owner.root, "explicit-natural-child"), first = await runInvocation(f, { mutate: true, settledPrefix: "strict-child" });
  assert.equal(first.receipt.phases[0].status, "failure");
  assert(first.receipt.phases.slice(1).every(p => p.status === "not_run"));
  outcome("explicit-natural-child-owner-refuses-descendant-cleanup", false, () => inspectInputPredecessor({ anchorRoot: f.anchor, repositoryRoot: f.checkout, receiptPath: first.relative }));
  settled = true;
} finally {
  // runInvocation owns all children even when a later assertion fails.
  settleCanonicalTestResourceUse(owner, { exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0 });
  const [cleanup] = cleanupCanonicalTestResources([owner]);
  assert(cleanup.completed, JSON.stringify(cleanup));
}
console.log(JSON.stringify({ schema: "augnes.input-review-regression-results.v1", corpus_sha256: digest(readFileSync(new URL("./fixtures/input-requalification-regressions.json", import.meta.url))), driver_sha256: digest(readFileSync(fileURLToPath(import.meta.url))), rows, setup_complete: settled, matched: rows.filter(r => r.matches).length, total: rows.length }, null, 2));
if (!recording) assert(rows.every(r => r.matches), rows.filter(r => !r.matches).map(r => r.id).join(", "));
