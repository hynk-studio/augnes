import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { digest } from "../local-canonical-inputs.mjs";
import { collectSelectedStockEvidence } from "../local-canonical-evidence-retention.mjs";

const request = JSON.parse(readFileSync(process.argv[2], "utf8"));
assert.equal(request.fixture_identity, "production-ineligible-selected-pipeline");
const currentResources = request.currentResources.map(({ file, id, kind, logical_content }) => ({ id, kind, sha256: digest(readFileSync(file)),
  ...(logical_content ? { logical_content } : {}) }));
const results = request.records.map(({ label, binding, selected, children }) => {
  const receipt = { repository: { head_sha: binding.head, tree_sha: binding.tree }, executor: { source_fingerprint: binding.executor_fingerprint },
    inputs: { binding: { phase_inventory: binding.plan_fingerprint, selected_execution: { consumer_map_fingerprint: binding.consumer_map_fingerprint } } },
    selected_inputs: selected, owned_children: children };
  const observed = collectSelectedStockEvidence({ root: request.root, receipt, expectedBinding: binding, currentResources });
  assert.equal(observed.currentRetainedInputEvidence.valid, true, JSON.stringify(observed.currentRetainedInputEvidence));
  assert.equal(observed.currentRetainedChildEvidence.valid, true, JSON.stringify(observed.currentRetainedChildEvidence));
  assert.equal(observed.currentInputStateValid, true, JSON.stringify(observed.currentSelectedInputEvidence));
  return { label, valid: true, child_count: observed.currentRetainedChildEvidence.lifecycle.started_count };
});
process.stdout.write(JSON.stringify({ fixture_identity: request.fixture_identity, production_eligible: false, reader_pid: process.pid, results }));
