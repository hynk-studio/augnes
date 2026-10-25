import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runCanonicalChild } from "./canonical-child-runner.mjs";
import { createCanonicalTestResourceRoot, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse, cleanupCanonicalTestResources, buildCanonicalChildEnvironment } from "./canonical-test-environment.mjs";
import { inspectInputRequalification } from "./local-canonical-input-requalification.mjs";
import { validateAttemptAdmission } from "./local-canonical-attempts.mjs";
import { finalizeReceipt } from "./local-canonical-receipt.mjs";
import { createFixture, runInvocation, prepareProof, request, read, write } from "./fixtures/input-requalification.mjs";

// Additional real history stays in its own unchanged 30-second child bound;
// the original 40-case integrated control retains its complete workload.
const owned = createCanonicalTestResourceRoot("ag-resource-test-");
beginCanonicalTestResourceUse(owned);
let stockResult = null;
try {
  const f = createFixture(owned.root, "settled-prefix"), first = await runInvocation(f, { mutate: true, settledPrefix: "child" });
  assert.equal(first.receipt.phases[0].status, "pass");
  assert.equal(first.receipt.phases[1].failure_code, "phase_cancelled");
  const log = path.join(f.checkout, first.receipt.phases[0].log.relative_path), logBytes = readFileSync(log);
  assert.match(logBytes.toString(), /termination_reason=exited_with_owned_descendant_cleanup/u);
  const receiptPath = path.join(f.checkout, first.relative), completionPath = path.join(f.anchor, ".augnes-local-verification/families", first.attempt.family_id, "completion-1.json");
  const completionBytes = readFileSync(completionPath), refusals = [];
  for (const mutation of ["missing-owner-return", "explicit-natural-exit", "owner-incomplete-cleanup", "unknown-owner-policy", "owner-partial-inventory"]) {
    const lines = logBytes.toString().trimEnd().split("\n"), summary = JSON.parse(lines.pop());
    if (mutation === "explicit-natural-exit") summary.results[0].require_natural_exit = true;
    if (mutation === "owner-incomplete-cleanup") summary.results[0].cleanup_completed = false;
    if (mutation === "unknown-owner-policy") summary.results[0].require_natural_exit = "unknown";
    if (mutation === "owner-partial-inventory") summary.results = [];
    if (mutation !== "missing-owner-return") lines.push(JSON.stringify(summary));
    write(log, `${lines.join("\n")}\n`);
    const changed = structuredClone(first.receipt); changed.phases[0].log.bytes = readFileSync(log).length;
    const sealed = finalizeReceipt(changed); write(receiptPath, sealed);
    write(completionPath, { ...JSON.parse(completionBytes), receipt_fingerprint: sealed.integrity.content_fingerprint });
    try {
      const changedProof = await prepareProof(f, { ...first, receipt: sealed });
      assert.throws(() => inspectInputRequalification(request(f, { proof: changedProof })), /input_requalification_independent_child_failure/u, mutation);
      refusals.push(mutation);
    } finally { write(receiptPath, first.originalBytes); write(completionPath, completionBytes); write(log, logBytes); }
  }
  const proof = await prepareProof(f, first);
  inspectInputRequalification(request(f, { proof }));
  const second = await runInvocation(f, { proof });
  assert(second.receipt.phases.every(p => p.status === "pass"));
  const state = path.join(f.parent, "stock-state.json"); write(state, f);
  let stockOutput = "";
  stockResult = await runCanonicalChild({ suite: "settlement-continuation", label: "fresh-stock", command: process.execPath,
    args: [fileURLToPath(new URL("./test-local-canonical-input-requalification.mjs", import.meta.url)), "stock", state, second.relative],
    cwd: owned.root, env: buildCanonicalChildEnvironment({ temporaryRoot: owned.root }), timeoutMs: 3000,
    stdout: { write(b) { stockOutput += b; } }, stderr: { write() {} } });
  assert.equal(stockResult.exit_code, 0); assert.equal(JSON.parse(stockOutput).valid_deciding_evidence, true);
  assert.deepEqual(readFileSync(receiptPath), first.originalBytes);
  assert.throws(() => validateAttemptAdmission(request(f, { inputRequalification: proof })));
  console.log(JSON.stringify({ schema: "augnes.settled-prefix-continuation-control.v1", prefix: "owner-accepted descendant cleanup",
    original_disposition: first.receipt.outcome.disposition, original_receipt_unchanged: true, continuation_passed_phases: second.receipt.phases.length,
    fresh_process_stock: "valid disposable evidence", third_invocation: "refused", refusals }));
} finally {
  settleCanonicalTestResourceUse(owned, stockResult ?? { exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0 });
  const [cleanup] = cleanupCanonicalTestResources([owned]); assert(cleanup.completed, JSON.stringify(cleanup));
}
