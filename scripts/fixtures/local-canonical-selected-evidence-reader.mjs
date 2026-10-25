// Disposable fresh-process control for the real retained-input stock reader.
// This fixture never admits a repository, allocates a production attempt or validates a
// production deciding receipt. It receives no producer-approved booleans.
import assert from "node:assert/strict";
import { readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { inspectRetainedSelectedInputs, inspectRetainedChildLifecycleEvidence, collectSelectedStockEvidence } from "../local-canonical-evidence-retention.mjs";
import { digest } from "../local-canonical-inputs.mjs";
import { inspectAttemptRecords } from "../local-canonical-attempts.mjs";
import { inspectReceiptForDecision, finalizeReceipt } from "../local-canonical-receipt.mjs";
import { inspectSelectedStockRefusal } from "../run-local-canonical-verification.mjs";
import { createIsolatedInvocationResources } from "../local-canonical-isolated-resources.mjs";

const request = JSON.parse(readFileSync(process.argv[2], "utf8"));
assert.equal(request.fixture_identity, "production-ineligible-selected-evidence");
const results = request.cases.map(({ label, expected_valid, ...options }) => {
  const result = inspectRetainedSelectedInputs(options);
  assert.equal(result.valid, expected_valid, `${label}: ${JSON.stringify(result.reason_codes)}`);
  assert.equal(result.valid || result.reason_codes.length > 0, true);
  return { label, ...result };
});
const lifecycle_results = (request.lifecycle_cases ?? []).map(({ label, expected_valid, ...options }) => {
  const result = inspectRetainedChildLifecycleEvidence(options);
  assert.equal(result.valid, expected_valid, `${label}: ${JSON.stringify(result.reason_codes)}`);
  assert.equal(result.valid || result.reason_codes.length > 0, true);
  return { label, valid: result.valid, reason_codes: result.reason_codes, started_count: result.lifecycle?.started_count,
    settled_count: result.lifecycle?.settled_count, unknown_count: result.lifecycle?.unknown_count };
});
const stock_results = [];
const bootstrap_results = [];
let legacy_unchanged = false;
if (request.stock) {
  const { root, receiptFile, legacyFile, context, legacyContext, currentResources, cases: stockCases } = request.stock;
  const raw = readFileSync(receiptFile), original = JSON.parse(raw), originalOutcome = JSON.stringify(original.outcome);
  let bootstrapFailure;
  try { createIsolatedInvocationResources("8".repeat(32), {repositoryRoot:path.join(root,"missing-current-checkout")}); }
  catch(error) { bootstrapFailure=error; }
  assert(bootstrapFailure); assert.equal(bootstrapFailure.isolatedResourceCleanup.completed,true);
  const bootstrapRefusal = inspectSelectedStockRefusal({root,receipt:original,expectedRunId:original.run.id,error:bootstrapFailure});
  assert.equal(bootstrapRefusal.valid_deciding_evidence,false);
  assert.equal(bootstrapRefusal.dimensions.historical_integrity,"intact");
  assert.equal(bootstrapRefusal.dimensions.evidence_validity,"valid_in_recorded_context",JSON.stringify(bootstrapRefusal.issues));
  assert.equal(bootstrapRefusal.dimensions.safety,"unknown_current_state");
  assert.equal(bootstrapRefusal.dimensions.current_merge_applicability,"blocked");
  assert.equal(JSON.stringify(original.outcome),originalOutcome);
  bootstrap_results.push({label:"actual-current-bootstrap-refusal",...bootstrapRefusal});
  const sourceCorrectionUnavailable=structuredClone(original);
  sourceCorrectionUnavailable.attempt.source_correction={fixture:"production-ineligible-unavailable-source-correction"};
  const unverified=inspectSelectedStockRefusal({root,receipt:finalizeReceipt(sourceCorrectionUnavailable),error:bootstrapFailure});
  assert.equal(unverified.valid_deciding_evidence,false);assert.equal(unverified.dimensions.evidence_validity,"unverified_recorded_context");
  bootstrap_results.push({label:"source-correction-needs-selected-reader",...unverified});
  for (const { label, directory } of stockCases) {
    let receipt = JSON.parse(raw);
    const source = readFileSync(path.join(directory, "source"), "utf8");
    const expectedBinding = { head: digest(source).slice(0, 40), tree: digest(`tree:${source}`).slice(0, 40),
      executor_fingerprint: digest(readFileSync(path.join(directory, "executor"))), plan_fingerprint: digest(readFileSync(path.join(directory, "plan"))),
      consumer_map_fingerprint: digest(readFileSync(path.join(directory, "consumer"))) };
    const main = readFileSync(path.join(directory, "main"), "utf8");
    if (label === "descriptor-missing") delete receipt.selected_inputs;
    if (label === "descriptor-resource-missing") receipt.selected_inputs.resources.pop();
    if (label === "ledger-incomplete") { receipt.owned_children.complete = false; receipt.owned_children.settled_count--; receipt.owned_children.unknown_count++; }
    if (label.startsWith("descriptor-") || label === "ledger-incomplete") receipt = finalizeReceipt(receipt);
    if (label === "retained-input-missing") rmSync(path.join(root, ".augnes-local-verification/logs/matching/selected-inputs/git-head.input"));
    if (label === "retained-child-missing") rmSync(path.join(root, ".augnes-local-verification/logs/matching/child-lifecycle/events.jsonl"));
    const resources = label === "inventory-missing" ? [] : currentResources.map(({ id, kind, file, logical_content }) => ({ id, kind, sha256: digest(readFileSync(file)), ...(logical_content ? { logical_content } : {}) }));
    const observations = collectSelectedStockEvidence({ root, receipt, expectedBinding, currentResources: resources });
    const result = inspectReceiptForDecision(receipt, { ...context, ...observations,
      currentAttemptRecordsValid: inspectAttemptRecords({ anchorRoot: root, repositoryRoot: root, receipt }),
      currentSafetyStateValid: digest(readFileSync(path.join(directory, "authority"))) === receipt.inputs.binding.live_authority_fingerprint,
      currentIdentity: { ...context.currentIdentity, head_sha: expectedBinding.head }, currentExecutorFingerprint: expectedBinding.executor_fingerprint,
      currentIntegrationBase: { ...context.currentIntegrationBase, observation: { ...context.currentIntegrationBase.observation, sha: main },
        base_matches_current_main: main === receipt.repository.base_sha } });
    assert.equal(JSON.stringify(receipt.outcome), originalOutcome, `${label}: original outcome changed`);
    assert.equal(result.dimensions.execution, "complete_pass", label);
    assert.equal(result.dimensions.historical_integrity, "intact", label);
    const historicalInvalid = label.startsWith("descriptor-") || label === "ledger-incomplete" || label.startsWith("retained-");
    assert.equal(result.valid_deciding_evidence, label === "matching", `${label}: ${JSON.stringify(result.issues)}`);
    assert.equal(result.dimensions.evidence_validity, historicalInvalid ? "invalid_or_incomplete" : "valid_in_recorded_context", `${label}: ${JSON.stringify(result.issues)}`);
    if (label === "authority-changed") assert.equal(result.dimensions.safety, "blocked_current_state");
    if (!historicalInvalid && label !== "matching") assert.equal(result.dimensions.current_merge_applicability, "blocked", label);
    if (label === "retained-input-missing") assert(result.issues.includes("receipt_retained_input_evidence_invalid"));
    if (label === "retained-child-missing") assert(result.issues.includes("receipt_retained_child_evidence_invalid"));
    stock_results.push({ label, ...result });
  }
  assert.deepEqual(readFileSync(receiptFile), raw);
  const damagedRefusal=inspectSelectedStockRefusal({root,receipt:original,error:bootstrapFailure});
  assert.equal(damagedRefusal.dimensions.evidence_validity,"invalid_or_incomplete");
  assert.equal(damagedRefusal.valid_deciding_evidence,false);
  bootstrap_results.push({label:"bootstrap-refusal-with-missing-originals",...damagedRefusal});
  const legacyRaw = readFileSync(legacyFile), legacy = JSON.parse(legacyRaw);
  const before = inspectReceiptForDecision(legacy, legacyContext);
  const after = inspectReceiptForDecision(legacy, { ...legacyContext, currentRetainedInputEvidence: { valid: false, reason_codes: ["fixture"] },
    currentRetainedChildEvidence: { valid: false, reason_codes: ["fixture"] }, currentSafetyStateValid: false });
  assert.equal(before.valid_deciding_evidence, true); assert.deepEqual(after, before); assert.deepEqual(readFileSync(legacyFile), legacyRaw);
  legacy_unchanged = true;
}
process.stdout.write(`${JSON.stringify({ fixture_identity: request.fixture_identity, production_eligible: false, reader_pid: process.pid,
  results, lifecycle_results, stock_results, bootstrap_results, legacy_unchanged })}\n`);
