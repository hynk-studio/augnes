import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const reviewDocPath =
  "docs/RESEARCH_TO_PERSPECTIVE_FOUNDATION_STATUS_REVIEW_V0_1.md";
const fixturePath =
  "fixtures/research-candidate-review.foundation-status-review.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const packageScriptName =
  "smoke:research-to-perspective-foundation-status-review-v0-1";
const packageScriptValue =
  "node scripts/smoke-research-to-perspective-foundation-status-review-v0-1.mjs";
const selectedSliceId = "research_candidate_lifecycle_read_model_v0_1";

for (const filePath of [reviewDocPath, fixturePath, packagePath, indexPath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const reviewDoc = readFile(reviewDocPath);
const fixture = readJson(fixturePath);
const packageJson = readJson(packagePath);
const indexDoc = readFile(indexPath);

assert.equal(
  fixture.fixture_version,
  "research_to_perspective_foundation_status_review.sample.v0.1",
);
assert.equal(
  fixture.review_version,
  "research_to_perspective_foundation_status_review.v0.1",
);
assert.equal(fixture.scope, "project:augnes");
assert.equal(fixture.status, "foundation_status_review_only");
assert.ok(fixture.baseline.after_prs.includes("#759"));
assert.ok(fixture.baseline.after_prs.includes("#760"));
assert.equal(fixture.product_write.parked_by, "#686");
assert.equal(fixture.product_write.reentry_allowed_now, false);
assert.equal(fixture.authority_boundary.classification_only, true);

for (const flag of [
  "runtime_persistence_now",
  "provider_openai_call_now",
  "source_fetch_now",
  "retrieval_rag_execution_now",
  "db_query_or_write_now",
  "proof_or_evidence_write_now",
  "perspective_promotion_now",
  "durable_perspective_state_write_now",
  "work_mutation_now",
  "codex_execution_now",
  "github_automation_now",
  "git_ledger_export_now",
  "product_write_now",
  "product_id_allocation_now",
  "ci_runtime_change_now",
  "github_actions_added_now",
]) {
  assert.equal(fixture.authority_boundary[flag], false, `${flag} must be false`);
}

assertRequiredRails();
assertCandidateNextSlices();
assertDocCoverage();
assertNoForbiddenPositiveAuthorityGrants(reviewDoc);
assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
assert.ok(indexDoc.includes(reviewDocPath), "index must point to status review doc");

console.log(
  JSON.stringify(
    {
      smoke: "research-to-perspective-foundation-status-review-v0-1",
      final_status: "pass",
      fixture_version: fixture.fixture_version,
      review_version: fixture.review_version,
      selected_next_slice: selectedSliceId,
      rail_statuses: fixture.rail_statuses.length,
      candidate_next_slices: fixture.candidate_next_slices.length,
      product_write_parked_by: fixture.product_write.parked_by,
    },
    null,
    2,
  ),
);

function assertRequiredRails() {
  const railIds = new Set(fixture.rail_statuses.map((rail) => rail.rail_id));
  for (const railId of [
    "research_to_perspective_foundation_milestone_closeout",
    "dogfooding_research_to_perspective_ci_expansion_closeout",
    "agent_perspective_substrate_feedback_loop",
    "perspective_packet_receipt_linkage",
    "codex_handoff_draft",
    "ai_context_packet",
    "perspective_geometry_digest",
    "project_constellation_runtime_layout",
    "durable_perspective_state_trajectory",
    "human_reviewed_durable_perspective_promotion",
    "non_authoritative_retrieval_rag",
    "operator_source_candidate_generation",
    "bounded_external_source_intake",
    "salience_governor",
    "recent_rehearsal_buffer",
    "formation_receipt_durable_event",
    "feedback_event_store",
  ]) {
    assert.ok(railIds.has(railId), `fixture must include rail ${railId}`);
  }
}

function assertCandidateNextSlices() {
  const sliceIds = new Set(fixture.candidate_next_slices.map((slice) => slice.slice_id));
  for (const sliceId of [
    "foundation_status_dashboard_readonly_ui_v0_1",
    "research_candidate_lifecycle_read_model_v0_1",
    "research_candidate_calibration_diagnostic_v0_1",
    "logical_claim_shape_preview_v0_1",
    "feedback_to_rule_candidate_loop_v0_1",
    "research_candidate_review_memory_contract_v0_1",
    "bounded_source_intake_runtime_contract_v0_1",
    "provider_assisted_extraction_candidate_only_contract_v0_1",
    "research_retrieval_runtime_contract_v0_1",
    "perspective_promotion_runtime_contract_v0_1",
    "git_ledger_export_contract_v0_1",
    "product_write_reentry_review_v0_1",
  ]) {
    assert.ok(sliceIds.has(sliceId), `fixture must include candidate slice ${sliceId}`);
  }

  const selected = fixture.candidate_next_slices.filter((slice) => slice.selected);
  assert.equal(selected.length, 1, "exactly one candidate slice must be selected");
  assert.equal(selected[0].slice_id, selectedSliceId);
  assert.equal(fixture.selected_next_slice.slice_id, selectedSliceId);
  assert.equal(fixture.selected_next_slice.selected, true);

  const dashboard = findCandidateSlice("foundation_status_dashboard_readonly_ui_v0_1");
  assert.ok(
    dashboard.decision === "deferred" || dashboard.selected === false,
    "foundation status dashboard must be deferred or not selected",
  );
  assert.equal(findCandidateSlice("product_write_reentry_review_v0_1").selected, false);

  const gitLedger = findCandidateSlice("git_ledger_export_contract_v0_1");
  assert.equal(gitLedger.selected, false);
  assert.equal(gitLedger.decision, "deferred");
  const gitLedgerBasis = JSON.stringify(gitLedger);
  assert.match(gitLedgerBasis, /human_reviewed_durable_promotion/);
  assert.match(gitLedgerBasis, /Formation Receipt/);
  assert.match(gitLedgerBasis, /durable state/);
}

function assertDocCoverage() {
  for (const requiredText of [
    "Selected next runtime/read-model slice:\nresearch_candidate_lifecycle_read_model_v0_1",
    "Product-write remains parked by #686",
    "product-write remains parked by #686",
    "Smoke pass is validation signal, not proof/evidence",
    "PR body is an operator report, not authority.",
    "CI signal is validation signal, not proof/evidence.",
    "Candidate remains candidate.",
    "Feedback remains operator signal, not truth.",
    "Retrieval/RAG remains recall/context, not authority.",
    "Provider/OpenAI output remains non-authoritative.",
    "Codex Handoff Draft remains draft, not execution approval.",
    "Git refs are not authority if mentioned at all.",
    "Foundation Status Dashboard is deferred and should not be the next implementation slice.",
    "Durable Candidate Review Memory is deferred until lifecycle read model and diagnostic basis are stable.",
    "Git Ledger / Export is deferred until after human-reviewed promotion, Formation Receipt, and durable state paths exist.",
    "The selected next slice is not implemented by this PR.",
  ]) {
    assert.ok(reviewDoc.includes(requiredText), `review doc must include ${requiredText}`);
  }
}

function assertNoForbiddenPositiveAuthorityGrants(source) {
  for (const forbidden of [
    "runtime_persistence_now: true",
    "provider_openai_call_now: true",
    "source_fetch_now: true",
    "retrieval_rag_execution_now: true",
    "db_query_or_write_now: true",
    "proof_or_evidence_write_now: true",
    "perspective_promotion_now: true",
    "durable_perspective_state_write_now: true",
    "work_mutation_now: true",
    "codex_execution_now: true",
    "github_automation_now: true",
    "git_ledger_export_now: true",
    "product_write_now: true",
    "product_id_allocation_now: true",
  ]) {
    assert.ok(!source.includes(forbidden), `review doc must not include ${forbidden}`);
  }
}

function findCandidateSlice(sliceId) {
  const slice = fixture.candidate_next_slices.find((item) => item.slice_id === sliceId);
  assert.ok(slice, `fixture must include ${sliceId}`);
  return slice;
}

function readJson(filePath) {
  return JSON.parse(readFile(filePath));
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}
