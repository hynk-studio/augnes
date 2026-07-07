#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const files = {
  contractType:
    "types/research-candidate-manual-global-dogfood-perspective-apply-contract.ts",
  reviewType:
    "types/research-candidate-manual-global-dogfood-perspective-apply-review.ts",
  contractBuilder:
    "lib/research-candidate-review/manual-global-dogfood-perspective-apply-contract.ts",
  reviewBuilder:
    "lib/research-candidate-review/manual-global-dogfood-perspective-apply-review.ts",
  panel:
    "components/research-candidate-manual-global-dogfood-perspective-apply-contract-panel.tsx",
  canonicalReadbackPanel:
    "components/research-candidate-manual-global-dogfood-canonical-perspective-update-readback-panel.tsx",
  smoke:
    "scripts/smoke-research-candidate-manual-global-dogfood-perspective-apply-contract-v0-1.mjs",
  docs: "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  packageJson: "package.json",
};

for (const filePath of Object.values(files)) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const source = Object.fromEntries(
  Object.entries(files).map(([key, filePath]) => [
    key,
    readFileSync(filePath, "utf8"),
  ]),
);
const packageJson = JSON.parse(source.packageJson);

assertStaticContracts();
const sample = buildSample();
assertContract(sample);
assertReview(sample);
assertNonTargetTables(sample);
assertDocsAndPackage();

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-manual-global-dogfood-perspective-apply-contract-v0-1",
      pass: true,
      preview_only: true,
      current_working_perspective_changed: false,
      canonical_perspective_state_written: false,
      perspective_promoted: false,
      perspective_memory_written: false,
      work_mutated: false,
      proof_or_evidence_rows_written: false,
      dogfood_metrics_written: false,
      schema_or_api_write_route_added: false,
    },
    null,
    2,
  ),
);

function assertStaticContracts() {
  for (const requiredText of [
    "research_candidate_manual_global_dogfood_perspective_apply_contract",
    "research_candidate_manual_global_dogfood_perspective_apply_contract.v0.1",
    "source_canonical_perspective_update_receipt_id",
    "source_canonical_perspective_update_record_id",
    "source_canonical_perspective_update_record_fingerprint",
    "source_perspective_relay_receipt_id",
    "source_next_work_signal_receipt_id",
    "source_next_work_bias_receipt_id",
    "proposed_perspective_apply_mapping",
    "proposed_existing_apply_path_compatibility",
    "can_update_current_working_perspective: false",
    "can_write_canonical_perspective_state: false",
    "can_promote_perspective: false",
    "can_write_perspective_memory: false",
    "can_mutate_work: false",
    "can_write_proof_or_evidence: false",
  ]) {
    assert.ok(
      source.contractType.includes(requiredText),
      `contract type must include ${requiredText}`,
    );
  }

  for (const requiredText of [
    "accept_contract_for_future_perspective_apply_write_slice",
    "needs_perspective_apply_mapping_revision",
    "reject_perspective_apply_contract",
    "defer_perspective_apply_contract",
    "ready_for_future_perspective_apply_write_slice",
    "blocked_perspective_apply_contract_not_ready",
    "operator_note_persisted: false",
    "no_write_authority: true",
  ]) {
    assert.ok(
      source.reviewType.includes(requiredText),
      `review type must include ${requiredText}`,
    );
  }

  for (const requiredText of [
    "source_canonical_update_readback_state_already_written",
    "source_canonical_update_readback_current_working_perspective_updated",
    "source_canonical_update_readback_perspective_promoted",
    "source_canonical_update_readback_perspective_memory_written",
    "source_canonical_update_readback_work_mutated",
    "source_canonical_update_readback_proof_or_evidence_written",
    "source_canonical_update_readback_metric_or_source_store_mutated",
    "source_canonical_update_raw_text_or_operator_note_present",
    "canonical_update_label_missing",
    "canonical_update_rationale_missing",
    "update_scope_hint_must_be_canonical_perspective_state",
    "selected_candidate_context_refs_missing",
    "source_next_work_candidate_card_ids_missing",
    "perspective_apply_explanation_insufficient",
    "manual_only_context_refs_must_not_be_treated_as_proof_or_evidence",
    "source_authority_boundary_not_read_only",
  ]) {
    assert.ok(
      source.contractBuilder.includes(requiredText),
      `contract builder must include ${requiredText}`,
    );
  }

  assert.doesNotMatch(
    `${source.contractBuilder}\n${source.reviewBuilder}`,
    /openDatabase|NextResponse|fetch\s*\(|writeCurrentWorkingPerspective|applyCurrentWorkingPerspective|writePerspectiveState|promotePerspective|writePerspectiveMemory|writeProof|writeEvidence|writeDogfoodMetric|writeResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdate|writeResearchCandidateManualGlobalDogfoodPerspectiveRelay|writeResearchCandidateManualGlobalDogfoodNextWorkBias|executeCodex|runCodex|OPENAI_API_KEY|new\s+OpenAI|api\.openai\.com|api\.github\.com|retrieveSources\s*\(|runRetrieval\s*\(|ragIndex\s*\(|embedding\s*\(|vectorStore\s*\(|crawler\s*\(|crawlSources\s*\(/i,
    "contract/review builders must remain pure and avoid writers, DB, API, providers, and retrieval",
  );
  assert.doesNotMatch(
    `${source.contractBuilder}\n${source.reviewBuilder}`,
    /\bINSERT\s+INTO\b|\bUPDATE\s+[a-zA-Z_][a-zA-Z0-9_]*\b|\bDELETE\s+FROM\b/,
    "contract/review builders must not contain SQL writes",
  );
  assert.ok(
    source.canonicalReadbackPanel.includes(
      "ResearchCandidateManualGlobalDogfoodPerspectiveApplyContractPanel",
    ),
    "canonical update readback panel must render Perspective apply contract panel",
  );
  assert.doesNotMatch(
    source.panel,
    /fetch\s*\(|localStorage|sessionStorage|navigator\.clipboard/i,
    "apply contract panel must not fetch, persist browser state, or use clipboard",
  );
  assert.doesNotMatch(
    source.panel,
    /<button[\s\S]{0,240}(Apply current-working Perspective|Update current working Perspective|Write canonical Perspective state|Promote Perspective|Write Perspective Memory|Create work item)/i,
    "apply contract panel must not expose forbidden write controls",
  );
  assert.ok(
    !existsSync(
      "app/api/research-candidate-review/manual-global-dogfood-perspective-apply-contract",
    ),
    "no Perspective apply contract preview API route must be added",
  );
}

function buildSample() {
  const code = String.raw`
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { readResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdate } from "./lib/research-candidate-review/read-manual-global-dogfood-canonical-perspective-update";
import { buildResearchCandidateManualGlobalDogfoodPerspectiveApplyContract } from "./lib/research-candidate-review/manual-global-dogfood-perspective-apply-contract";
import { buildResearchCandidateManualGlobalDogfoodPerspectiveApplyReview } from "./lib/research-candidate-review/manual-global-dogfood-perspective-apply-review";

const db = new Database(":memory:");
db.pragma("foreign_keys = ON");
db.exec(readFileSync("lib/db/schema.sql", "utf8"));

function tableExists(table) {
  return Boolean(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(table));
}
function count(table) {
  return tableExists(table) ? db.prepare("SELECT COUNT(*) AS count FROM " + table).get().count : 0;
}
const countTables = [
  "research_candidate_manual_global_dogfood_canonical_perspective_update_receipts",
  "research_candidate_manual_global_dogfood_canonical_perspective_update_records",
  "research_candidate_manual_global_dogfood_canonical_perspective_update_rollbacks",
  "perspective_states",
  "perspective_promotion_decisions",
  "perspective_formation_receipts",
  "perspective_memory_items",
  "work_items",
  "work_events",
  "verification_evidence_records",
  "dogfood_metric_snapshot_records",
  "dogfooding_records",
  "dogfooding_signals",
  "dogfooding_review_cues",
  "delivery_ledger"
];
function readCounts() {
  return Object.fromEntries(countTables.map((table) => [table, count(table)]));
}
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
function insert(table, row) {
  const keys = Object.keys(row);
  db.prepare("INSERT INTO " + table + " (" + keys.join(", ") + ") VALUES (" + keys.map(() => "?").join(", ") + ")").run(...keys.map((key) => row[key]));
}
function insertCanonicalUpdateSource(status = "committed") {
  const createdAt = "2026-07-07T00:00:00.000Z";
  const receipt = {
    receipt_id: "manual-global-dogfood-canonical-perspective-update-receipt:ready",
    created_at: createdAt,
    scope: "project:augnes",
    source_canonical_perspective_update_contract_fingerprint: "fnv1a32:canonical-contract",
    source_canonical_perspective_update_review_fingerprint: "fnv1a32:canonical-review",
    source_perspective_relay_receipt_id: "manual-global-dogfood-perspective-relay-receipt:ready",
    source_perspective_relay_record_id: "manual-global-dogfood-perspective-relay-record:ready",
    source_perspective_relay_record_fingerprint: "fnv1a32:relay-record",
    source_next_work_signal_receipt_id: "manual-global-dogfood-next-work-signal-receipt:ready",
    source_next_work_signal_record_id: "manual-global-dogfood-next-work-signal-record:ready",
    source_next_work_signal_record_fingerprint: "fnv1a32:signal-record",
    source_next_work_bias_receipt_id: "manual-global-dogfood-next-work-bias-receipt:ready",
    source_next_work_bias_record_id: "manual-global-dogfood-next-work-bias-record:ready",
    source_next_work_bias_record_fingerprint: "fnv1a32:bias-record",
    source_projection_fingerprint: "fnv1a32:projection",
    source_global_dogfood_ledger_receipt_id: "manual-global-dogfood-ledger-receipt:ready",
    source_global_dogfood_ledger_record_id: "manual-global-dogfood-ledger-record:ready",
    source_metric_snapshot_receipt_id: "manual-global-dogfood-metric-snapshot-receipt:ready",
    source_metric_snapshot_record_id: "manual-global-dogfood-metric-snapshot-record:ready",
    source_manual_receipt_id: "manual-result-receipt:ready",
    source_handoff_seed_fingerprint: "fnv1a32:handoff",
    source_result_text_fingerprint: "fnv1a32:result",
    source_expected_observed_delta_record_ref: "expected-observed-delta:ready",
    source_reuse_outcome_record_ref: "reuse-outcome:ready",
    idempotency_key: "canonical-update-idempotency-ready",
    write_status: status,
    authority_profile: "manual_global_dogfood_canonical_perspective_update_write_authority.v0.1",
    receipt_fingerprint: "fnv1a32:canonical-receipt",
    supersedes_receipt_id: null,
    rollback_of_receipt_id: status === "rolled_back" ? "manual-global-dogfood-canonical-perspective-update-receipt:ready" : null,
    rollback_reason: status === "rolled_back" ? "source canonical update rollback" : null
  };
  const record = {
    canonical_perspective_update_record_id: "manual-global-dogfood-canonical-perspective-update-record:ready",
    receipt_id: receipt.receipt_id,
    created_at: createdAt,
    scope: receipt.scope,
    source_perspective_relay_receipt_id: receipt.source_perspective_relay_receipt_id,
    source_perspective_relay_record_id: receipt.source_perspective_relay_record_id,
    source_next_work_signal_receipt_id: receipt.source_next_work_signal_receipt_id,
    source_next_work_signal_record_id: receipt.source_next_work_signal_record_id,
    source_next_work_bias_receipt_id: receipt.source_next_work_bias_receipt_id,
    source_next_work_bias_record_id: receipt.source_next_work_bias_record_id,
    source_projection_fingerprint: receipt.source_projection_fingerprint,
    source_global_dogfood_ledger_receipt_id: receipt.source_global_dogfood_ledger_receipt_id,
    source_global_dogfood_ledger_record_id: receipt.source_global_dogfood_ledger_record_id,
    source_metric_snapshot_receipt_id: receipt.source_metric_snapshot_receipt_id,
    source_metric_snapshot_record_id: receipt.source_metric_snapshot_record_id,
    canonical_update_label: "Apply manual dogfood canonical update candidate",
    canonical_update_rationale: "Expected and observed manual dogfood material supports a bounded canonical Perspective update record.",
    relay_update_label: "Carry manual dogfood relay into canonical update review",
    relay_update_rationale: "Relay material was explicitly authorized and remains scoped to manual dogfood metadata.",
    recommended_next_work_label: "Review manual dogfood follow-up",
    outcome_label: "helpful",
    outcome_signal: "positive",
    update_scope_hint: "canonical_perspective_state",
    update_strength_hint: "medium",
    expected_summary: "Expected manual dogfood loop to expose a candidate next work signal.",
    observed_summary: "Observed manual dogfood loop produced committed relay and canonical update records.",
    mismatch_or_gap_summary: "Gap is that Perspective apply still needs a separate authorization slice.",
    selected_candidate_context_refs_json: JSON.stringify(["candidate-context:ready"]),
    source_next_work_candidate_card_ids_json: JSON.stringify(["next-work-card:ready"]),
    manual_only_context_refs_json: JSON.stringify(["manual-context:ready"]),
    source_line: "manual dogfood result line 1",
    blockers_json: JSON.stringify([]),
    warnings_json: JSON.stringify(["manual_only_context_refs_preserved_not_proof_evidence"]),
    compatibility_findings_json: JSON.stringify(["canonical_update_ready"]),
    existing_perspective_update_compatibility_json: JSON.stringify({ existing_current_working_perspective_update_contract_compatible: false }),
    source_refs_json: JSON.stringify(["manual-source:ready"]),
    authority_profile: receipt.authority_profile,
    canonical_perspective_update_record_fingerprint: "fnv1a32:canonical-record"
  };
  insert("research_candidate_manual_global_dogfood_canonical_perspective_update_receipts", receipt);
  insert("research_candidate_manual_global_dogfood_canonical_perspective_update_records", record);
}
function setCanonicalStatus(status) {
  db.prepare("UPDATE research_candidate_manual_global_dogfood_canonical_perspective_update_receipts SET write_status = ?").run(status);
}
function mutateActiveRecord(readback, mutator) {
  const next = clone(readback);
  if (next.latest_active_committed?.canonical_perspective_update_record) {
    mutator(next.latest_active_committed.canonical_perspective_update_record);
  }
  return next;
}
function buildContract(readback) {
  return buildResearchCandidateManualGlobalDogfoodPerspectiveApplyContract({ readback });
}

insertCanonicalUpdateSource("committed");
const countsBefore = readCounts();
const readback = readResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdate({ db, limit: 10 });
const readyContract = buildContract(readback);
const readyContractAgain = buildContract(readback);
const acceptedReview = buildResearchCandidateManualGlobalDogfoodPerspectiveApplyReview({
  perspective_apply_contract: readyContract,
  operator_decision: "accept_contract_for_future_perspective_apply_write_slice",
  operator_note: "local note should not persist"
});
const revisionReview = buildResearchCandidateManualGlobalDogfoodPerspectiveApplyReview({
  perspective_apply_contract: readyContract,
  operator_decision: "needs_perspective_apply_mapping_revision"
});
const rejectReview = buildResearchCandidateManualGlobalDogfoodPerspectiveApplyReview({
  perspective_apply_contract: readyContract,
  operator_decision: "reject_perspective_apply_contract"
});
const deferReview = buildResearchCandidateManualGlobalDogfoodPerspectiveApplyReview({
  perspective_apply_contract: readyContract,
  operator_decision: "defer_perspective_apply_contract"
});
const noSourceContract = buildContract({
  ...clone(readback),
  records_by_receipt: [],
  latest_receipts: [],
  latest_active_committed: null,
  count: 0
});
setCanonicalStatus("rolled_back");
const rolledBackContract = buildContract(readResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdate({ db, limit: 10 }));
setCanonicalStatus("superseded");
const supersededContract = buildContract(readResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdate({ db, limit: 10 }));
setCanonicalStatus("committed");

const missingLabelContract = buildContract(mutateActiveRecord(readback, (record) => { record.canonical_update_label = ""; }));
const missingRationaleContract = buildContract(mutateActiveRecord(readback, (record) => { record.canonical_update_rationale = ""; }));
const currentWorkingScopeContract = buildContract(mutateActiveRecord(readback, (record) => { record.update_scope_hint = "current_working_perspective"; }));
const missingContextContract = buildContract(mutateActiveRecord(readback, (record) => { record.selected_candidate_context_refs = []; }));
const missingCardsContract = buildContract(mutateActiveRecord(readback, (record) => { record.source_next_work_candidate_card_ids = []; }));
const insufficientExplanationContract = buildContract(mutateActiveRecord(readback, (record) => {
  record.expected_summary = null;
  record.observed_summary = null;
  record.mismatch_or_gap_summary = null;
}));
const manualProofContract = buildContract(mutateActiveRecord(readback, (record) => { record.manual_only_context_refs = ["proof:fake"]; }));

const mutationContracts = {};
for (const flag of [
  "canonical_perspective_state_written",
  "current_working_perspective_updated",
  "perspective_promoted",
  "perspective_memory_written",
  "perspective_relay_mutated",
  "next_work_bias_mutated",
  "work_mutated",
  "dogfood_metrics_written",
  "global_dogfood_ledger_mutated",
  "metric_snapshot_mutated",
  "next_work_signal_decision_mutated",
  "proof_or_evidence_rows_written",
  "product_write_executed",
  "raw_manual_note_text_present",
  "raw_result_report_text_present",
  "operator_notes_persisted"
]) {
  mutationContracts[flag] = buildContract({ ...clone(readback), [flag]: true });
}

const blockedAcceptReview = buildResearchCandidateManualGlobalDogfoodPerspectiveApplyReview({
  perspective_apply_contract: missingLabelContract,
  operator_decision: "accept_contract_for_future_perspective_apply_write_slice"
});
const countsAfter = readCounts();

console.log(JSON.stringify({
  countsBefore,
  countsAfter,
  readback,
  readyContract,
  readyContractAgain,
  acceptedReview,
  revisionReview,
  rejectReview,
  deferReview,
  noSourceContract,
  rolledBackContract,
  supersededContract,
  missingLabelContract,
  missingRationaleContract,
  currentWorkingScopeContract,
  missingContextContract,
  missingCardsContract,
  insufficientExplanationContract,
  manualProofContract,
  mutationContracts,
  blockedAcceptReview
}));
`;

  const output = execFileSync("node", ["--import", "tsx", "--eval", code], {
    encoding: "utf8",
  });
  return JSON.parse(output);
}

function assertContract(sample) {
  assert.equal(sample.readyContract.validation.passed, true);
  assert.equal(
    sample.readyContract.operator_authorization_mode,
    "ready_for_future_perspective_apply_write_authorization",
  );
  assert.equal(
    sample.readyContract.proposed_apply_candidate.candidate_status,
    "ready_for_future_perspective_apply_write_authorization",
  );
  assert.equal(
    sample.readyContract.proposed_apply_candidate.apply_scope_hint,
    "canonical_perspective_state",
  );
  assert.equal(
    sample.readyContract.proposed_perspective_apply_mapping
      .intended_future_apply_target,
    "canonical_perspective_state",
  );
  assert.equal(sample.readyContract.proposed_apply_candidate.writes_now, false);
  assert.equal(
    sample.readyContract.proposed_apply_candidate
      .would_update_current_working_perspective,
    false,
  );
  assert.equal(
    sample.readyContract.proposed_apply_candidate
      .would_write_canonical_perspective_state,
    false,
  );
  assert.equal(
    sample.readyContract.proposed_apply_candidate.would_promote_perspective,
    false,
  );
  assert.equal(
    sample.readyContract.proposed_apply_candidate
      .would_write_perspective_memory,
    false,
  );
  assert.equal(sample.readyContract.proposed_apply_candidate.would_mutate_work, false);
  assert.equal(
    sample.readyContract.proposed_apply_candidate.would_write_proof_or_evidence,
    false,
  );
  assert.equal(
    sample.readyContract.idempotency_contract_preview.proposed_idempotency_key,
    sample.readyContractAgain.idempotency_contract_preview.proposed_idempotency_key,
  );
  assert.equal(
    sample.readyContract.source_canonical_perspective_update_receipt_id,
    sample.readback.latest_active_committed.receipt.receipt_id,
  );
  assert.equal(
    sample.readyContract.source_canonical_perspective_update_record_fingerprint,
    sample.readback.latest_active_committed.canonical_perspective_update_record
      .canonical_perspective_update_record_fingerprint,
  );
  assert.equal(
    sample.readyContract.source_perspective_relay_record_fingerprint,
    sample.readback.latest_active_committed.receipt
      .source_perspective_relay_record_fingerprint,
  );
  assert.equal(
    sample.readyContract.source_next_work_signal_record_fingerprint,
    sample.readback.latest_active_committed.receipt
      .source_next_work_signal_record_fingerprint,
  );
  assert.equal(
    sample.readyContract.source_next_work_bias_record_fingerprint,
    sample.readback.latest_active_committed.receipt
      .source_next_work_bias_record_fingerprint,
  );
  assert.equal(
    sample.readyContract.proposed_existing_apply_path_compatibility
      .manual_source_refs_preserved,
    true,
  );
  assert.equal(
    sample.readyContract.proposed_existing_apply_path_compatibility
      .existing_current_working_perspective_update_contract_preview_compatible,
    false,
  );
  assert.equal(
    sample.readyContract.proposed_existing_apply_path_compatibility
      .existing_current_working_perspective_apply_write_compatible,
    false,
  );
  assert.equal(
    sample.readyContract.proposed_existing_apply_path_compatibility
      .existing_route_integration_contract_compatible,
    false,
  );
  assert.ok(
    sample.readyContract.compatibility_findings.length > 0,
    "compatibility findings must be present",
  );

  for (const [label, contract] of Object.entries({
    noSourceContract: sample.noSourceContract,
    rolledBackContract: sample.rolledBackContract,
    supersededContract: sample.supersededContract,
    missingLabelContract: sample.missingLabelContract,
    missingRationaleContract: sample.missingRationaleContract,
    currentWorkingScopeContract: sample.currentWorkingScopeContract,
    missingContextContract: sample.missingContextContract,
    missingCardsContract: sample.missingCardsContract,
    insufficientExplanationContract: sample.insufficientExplanationContract,
    manualProofContract: sample.manualProofContract,
  })) {
    assert.equal(contract.validation.passed, false, `${label} must block`);
    assert.equal(
      contract.operator_authorization_mode,
      "blocked_before_perspective_apply_authorization",
      `${label} must not be ready`,
    );
    assert.equal(
      contract.proposed_apply_candidate.apply_scope_hint,
      "blocked",
      `${label} must use blocked scope hint`,
    );
  }
  assert.ok(
    sample.noSourceContract.blocker_reasons.includes(
      "source_canonical_perspective_update_receipt_not_active_committed",
    ),
  );
  assert.ok(
    sample.missingLabelContract.blocker_reasons.includes(
      "canonical_update_label_missing",
    ),
  );
  assert.ok(
    sample.currentWorkingScopeContract.blocker_reasons.includes(
      "update_scope_hint_must_be_canonical_perspective_state",
    ),
  );
  assert.ok(
    sample.insufficientExplanationContract.blocker_reasons.includes(
      "perspective_apply_explanation_insufficient",
    ),
  );
  assert.ok(
    sample.manualProofContract.blocker_reasons.includes(
      "manual_only_context_refs_must_not_be_treated_as_proof_or_evidence",
    ),
  );

  for (const [flag, contract] of Object.entries(sample.mutationContracts)) {
    assert.equal(contract.validation.passed, false, `${flag} must block`);
    assert.equal(
      contract.operator_authorization_mode,
      "blocked_before_perspective_apply_authorization",
      `${flag} must not be ready`,
    );
  }
  assert.ok(
    sample.mutationContracts.canonical_perspective_state_written.blocker_reasons.includes(
      "source_canonical_update_readback_state_already_written",
    ),
  );
  assert.ok(
    sample.mutationContracts.current_working_perspective_updated.blocker_reasons.includes(
      "source_canonical_update_readback_current_working_perspective_updated",
    ),
  );
  assert.ok(
    sample.mutationContracts.global_dogfood_ledger_mutated.blocker_reasons.includes(
      "source_canonical_update_readback_metric_or_source_store_mutated",
    ),
  );
  assert.ok(
    sample.mutationContracts.operator_notes_persisted.blocker_reasons.includes(
      "source_canonical_update_raw_text_or_operator_note_present",
    ),
  );
}

function assertReview(sample) {
  assert.equal(
    sample.acceptedReview.review_status,
    "ready_for_future_perspective_apply_write_slice",
  );
  assert.equal(sample.acceptedReview.validation.passed, true);
  assert.equal(sample.acceptedReview.validation.operator_note_persisted, false);
  assert.equal(sample.acceptedReview.validation.no_write_authority, true);
  assert.equal(
    sample.acceptedReview.accepted_mapping_summary.source_contract_fingerprint,
    sample.readyContract.validation.contract_fingerprint,
  );
  assert.equal(
    sample.acceptedReview.accepted_mapping_summary
      .source_canonical_perspective_update_record_fingerprint,
    sample.readyContract.source_canonical_perspective_update_record_fingerprint,
  );
  assert.equal(
    sample.acceptedReview.accepted_mapping_summary.proposed_idempotency_key,
    sample.readyContract.idempotency_contract_preview.proposed_idempotency_key,
  );
  assert.equal(
    sample.acceptedReview.accepted_mapping_summary.intended_future_apply_target,
    "canonical_perspective_state",
  );
  assert.equal(
    sample.blockedAcceptReview.review_status,
    "blocked_perspective_apply_contract_not_ready",
  );
  for (const review of [
    sample.revisionReview,
    sample.rejectReview,
    sample.deferReview,
  ]) {
    assert.notEqual(
      review.review_status,
      "ready_for_future_perspective_apply_write_slice",
    );
    assert.equal(review.validation.passed, false);
  }
}

function assertNonTargetTables(sample) {
  assert.deepEqual(
    sample.countsAfter,
    sample.countsBefore,
    "preview builders must not mutate DB row counts",
  );
  assert.equal(
    sample.countsAfter
      .research_candidate_manual_global_dogfood_canonical_perspective_update_receipts,
    1,
  );
  assert.equal(
    sample.countsAfter
      .research_candidate_manual_global_dogfood_canonical_perspective_update_records,
    1,
  );
  assert.equal(
    sample.countsAfter
      .research_candidate_manual_global_dogfood_canonical_perspective_update_rollbacks,
    0,
  );
  for (const table of [
    "perspective_states",
    "perspective_promotion_decisions",
    "perspective_formation_receipts",
    "perspective_memory_items",
    "work_items",
    "work_events",
    "verification_evidence_records",
    "dogfood_metric_snapshot_records",
    "dogfooding_records",
    "dogfooding_signals",
    "dogfooding_review_cues",
    "delivery_ledger",
  ]) {
    assert.equal(sample.countsAfter[table], 0, `${table} must remain empty`);
  }
}

function assertDocsAndPackage() {
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-manual-global-dogfood-perspective-apply-contract-v0-1"
    ],
    "node scripts/smoke-research-candidate-manual-global-dogfood-perspective-apply-contract-v0-1.mjs",
  );
  for (const text of [
    "Active committed manual global dogfood canonical Perspective update readback",
    "Perspective apply authorization contract preview",
    "does not update current-working Perspective",
    "does not directly mutate canonical Perspective state",
    "No schema or migration is added",
    "No API write route is added",
  ]) {
    assert.ok(source.docs.includes(text), `docs must include ${text}`);
  }
  assert.match(
    source.docs,
    /Perspective promotion remains\s+out of scope/,
    "docs must state Perspective promotion remains out of scope",
  );
}
