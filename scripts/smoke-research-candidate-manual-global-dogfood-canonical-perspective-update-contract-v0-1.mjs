#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const files = {
  contractType:
    "types/research-candidate-manual-global-dogfood-canonical-perspective-update-contract.ts",
  reviewType:
    "types/research-candidate-manual-global-dogfood-canonical-perspective-update-review.ts",
  contractBuilder:
    "lib/research-candidate-review/manual-global-dogfood-canonical-perspective-update-contract.ts",
  reviewBuilder:
    "lib/research-candidate-review/manual-global-dogfood-canonical-perspective-update-review.ts",
  panel:
    "components/research-candidate-manual-global-dogfood-canonical-perspective-update-contract-panel.tsx",
  relayReadbackPanel:
    "components/research-candidate-manual-global-dogfood-perspective-relay-readback-panel.tsx",
  smoke:
    "scripts/smoke-research-candidate-manual-global-dogfood-canonical-perspective-update-contract-v0-1.mjs",
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
        "research-candidate-manual-global-dogfood-canonical-perspective-update-contract-v0-1",
      pass: true,
      preview_only: true,
      canonical_perspective_state_written: false,
      current_working_perspective_changed: false,
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
    "research_candidate_manual_global_dogfood_canonical_perspective_update_contract",
    "research_candidate_manual_global_dogfood_canonical_perspective_update_contract.v0.1",
    "source_perspective_relay_receipt_id",
    "source_perspective_relay_record_id",
    "source_perspective_relay_record_fingerprint",
    "source_next_work_signal_receipt_id",
    "source_next_work_bias_receipt_id",
    "proposed_canonical_perspective_update_mapping",
    "proposed_existing_perspective_update_compatibility",
    "can_write_canonical_perspective_state: false",
    "can_update_current_working_perspective: false",
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
    "accept_contract_for_future_canonical_perspective_update_write_slice",
    "needs_canonical_perspective_mapping_revision",
    "reject_canonical_perspective_update_contract",
    "defer_canonical_perspective_update_contract",
    "ready_for_future_canonical_perspective_update_write_slice",
    "blocked_canonical_perspective_contract_not_ready",
    "operator_note_persisted: false",
    "no_write_authority: true",
  ]) {
    assert.ok(
      source.reviewType.includes(requiredText),
      `review type must include ${requiredText}`,
    );
  }

  for (const requiredText of [
    "source_relay_readback_canonical_perspective_already_written",
    "source_relay_readback_perspective_promoted",
    "source_relay_readback_perspective_memory_written",
    "source_relay_readback_work_mutated",
    "source_relay_readback_proof_or_evidence_written",
    "source_relay_readback_metric_or_source_store_mutated",
    "source_relay_raw_text_or_operator_note_present",
    "relay_update_label_missing",
    "relay_update_rationale_missing",
    "selected_candidate_context_refs_missing",
    "source_next_work_candidate_card_ids_missing",
    "canonical_update_explanation_insufficient",
    "source_authority_boundary_not_read_only",
  ]) {
    assert.ok(
      source.contractBuilder.includes(requiredText),
      `contract builder must include ${requiredText}`,
    );
  }

  assert.doesNotMatch(
    `${source.contractBuilder}\n${source.reviewBuilder}`,
    /openDatabase|NextResponse|fetch\s*\(|writeCurrentWorkingPerspective|applyCurrentWorkingPerspective|writePerspectiveState|promotePerspective|writePerspectiveMemory|writeProof|writeEvidence|writeDogfoodMetric|writeResearchCandidateManualGlobalDogfoodPerspectiveRelay|writeResearchCandidateManualGlobalDogfoodNextWorkBias|executeCodex|runCodex|OPENAI_API_KEY|new\s+OpenAI|api\.openai\.com|api\.github\.com|retrieveSources\s*\(|runRetrieval\s*\(|ragIndex\s*\(|embedding\s*\(|vectorStore\s*\(|crawler\s*\(|crawlSources\s*\(/i,
    "contract/review builders must remain pure and avoid writers, DB, API, providers, and retrieval",
  );
  assert.doesNotMatch(
    `${source.contractBuilder}\n${source.reviewBuilder}`,
    /\bINSERT\s+INTO\b|\bUPDATE\s+[a-zA-Z_][a-zA-Z0-9_]*\b|\bDELETE\s+FROM\b/,
    "contract/review builders must not contain SQL writes",
  );

  assert.ok(
    source.relayReadbackPanel.includes(
      "ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateContractPanel",
    ),
    "relay readback panel must render canonical Perspective update contract panel",
  );
  assert.doesNotMatch(
    source.panel,
    /fetch\s*\(|localStorage|sessionStorage|navigator\.clipboard/i,
    "canonical contract panel must not fetch, persist browser state, or use clipboard",
  );
  assert.doesNotMatch(
    source.panel,
    /<button[\s\S]{0,240}(Write canonical Perspective|Update current working Perspective|Promote Perspective|Write Perspective Memory|Create work item)/i,
    "canonical contract panel must not expose forbidden write controls",
  );
  assert.ok(
    !existsSync(
      "app/api/research-candidate-review/manual-global-dogfood-canonical-perspective-update",
    ),
    "no canonical Perspective contract API route must be added",
  );
}

function buildSample() {
  const code = String.raw`
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { readResearchCandidateManualGlobalDogfoodPerspectiveRelay } from "./lib/research-candidate-review/read-manual-global-dogfood-perspective-relay";
import { buildResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateContract } from "./lib/research-candidate-review/manual-global-dogfood-canonical-perspective-update-contract";
import { buildResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReview } from "./lib/research-candidate-review/manual-global-dogfood-canonical-perspective-update-review";

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
  "research_candidate_manual_global_dogfood_perspective_relay_receipts",
  "research_candidate_manual_global_dogfood_perspective_relay_records",
  "research_candidate_manual_global_dogfood_perspective_relay_rollbacks",
  "perspective_states",
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
function insertRelaySource(status = "committed") {
  const createdAt = "2026-07-07T00:00:00.000Z";
  const receipt = {
    receipt_id: "manual-global-dogfood-perspective-relay-receipt:ready",
    created_at: createdAt,
    scope: "project:augnes",
    source_perspective_relay_contract_fingerprint: "fnv1a32:relay-contract",
    source_perspective_relay_review_fingerprint: "fnv1a32:relay-review",
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
    idempotency_key: "relay-idempotency-ready",
    write_status: status,
    authority_profile: "manual_global_dogfood_perspective_relay_write_authority.v0.1",
    receipt_fingerprint: "fnv1a32:relay-receipt",
    supersedes_receipt_id: null,
    rollback_of_receipt_id: status === "rolled_back" ? "manual-global-dogfood-perspective-relay-receipt:ready" : null,
    rollback_reason: status === "rolled_back" ? "source relay rollback" : null
  };
  const record = {
    perspective_relay_record_id: "manual-global-dogfood-perspective-relay-record:ready",
    receipt_id: receipt.receipt_id,
    created_at: createdAt,
    scope: receipt.scope,
    source_next_work_signal_receipt_id: receipt.source_next_work_signal_receipt_id,
    source_next_work_signal_record_id: receipt.source_next_work_signal_record_id,
    source_next_work_bias_receipt_id: receipt.source_next_work_bias_receipt_id,
    source_next_work_bias_record_id: receipt.source_next_work_bias_record_id,
    source_projection_fingerprint: receipt.source_projection_fingerprint,
    source_global_dogfood_ledger_receipt_id: receipt.source_global_dogfood_ledger_receipt_id,
    source_global_dogfood_ledger_record_id: receipt.source_global_dogfood_ledger_record_id,
    source_metric_snapshot_receipt_id: receipt.source_metric_snapshot_receipt_id,
    source_metric_snapshot_record_id: receipt.source_metric_snapshot_record_id,
    relay_update_label: "Carry manual dogfood relay into canonical update review",
    relay_update_rationale: "Expected and observed manual dogfood material shows a durable update candidate for the current Perspective loop spine.",
    recommended_next_work_label: "Review manual dogfood follow-up",
    outcome_label: "helpful",
    outcome_signal: "positive",
    expected_summary: "Expected manual dogfood loop to expose a candidate next work signal.",
    observed_summary: "Observed manual dogfood loop produced a committed relay update record.",
    mismatch_or_gap_summary: "Gap is that canonical Perspective update still needs a separate authorized write.",
    selected_candidate_context_refs_json: JSON.stringify(["candidate-context:ready"]),
    source_next_work_candidate_card_ids_json: JSON.stringify(["next-work-card:ready"]),
    manual_only_context_refs_json: JSON.stringify(["manual-only-context:ready"]),
    source_line: "Manual relay source line",
    blockers_json: JSON.stringify([]),
    warnings_json: JSON.stringify(["relay-warning:manual-only-context"]),
    source_refs_json: JSON.stringify(["relay-source:ready"]),
    authority_profile: receipt.authority_profile,
    perspective_relay_record_fingerprint: "fnv1a32:relay-record"
  };
  db.prepare([
    "INSERT INTO research_candidate_manual_global_dogfood_perspective_relay_receipts (",
    "receipt_id, created_at, scope, source_perspective_relay_contract_fingerprint,",
    "source_perspective_relay_review_fingerprint, source_next_work_signal_receipt_id,",
    "source_next_work_signal_record_id, source_next_work_signal_record_fingerprint,",
    "source_next_work_bias_receipt_id, source_next_work_bias_record_id,",
    "source_next_work_bias_record_fingerprint, source_projection_fingerprint,",
    "source_global_dogfood_ledger_receipt_id, source_global_dogfood_ledger_record_id,",
    "source_metric_snapshot_receipt_id, source_metric_snapshot_record_id,",
    "source_manual_receipt_id, source_handoff_seed_fingerprint,",
    "source_result_text_fingerprint, source_expected_observed_delta_record_ref,",
    "source_reuse_outcome_record_ref, idempotency_key, write_status,",
    "authority_profile, receipt_fingerprint, supersedes_receipt_id,",
    "rollback_of_receipt_id, rollback_reason",
    ") VALUES (",
    "@receipt_id, @created_at, @scope, @source_perspective_relay_contract_fingerprint,",
    "@source_perspective_relay_review_fingerprint, @source_next_work_signal_receipt_id,",
    "@source_next_work_signal_record_id, @source_next_work_signal_record_fingerprint,",
    "@source_next_work_bias_receipt_id, @source_next_work_bias_record_id,",
    "@source_next_work_bias_record_fingerprint, @source_projection_fingerprint,",
    "@source_global_dogfood_ledger_receipt_id, @source_global_dogfood_ledger_record_id,",
    "@source_metric_snapshot_receipt_id, @source_metric_snapshot_record_id,",
    "@source_manual_receipt_id, @source_handoff_seed_fingerprint,",
    "@source_result_text_fingerprint, @source_expected_observed_delta_record_ref,",
    "@source_reuse_outcome_record_ref, @idempotency_key, @write_status,",
    "@authority_profile, @receipt_fingerprint, @supersedes_receipt_id,",
    "@rollback_of_receipt_id, @rollback_reason",
    ")"
  ].join(" ")).run(receipt);
  db.prepare([
    "INSERT INTO research_candidate_manual_global_dogfood_perspective_relay_records (",
    "perspective_relay_record_id, receipt_id, created_at, scope,",
    "source_next_work_signal_receipt_id, source_next_work_signal_record_id,",
    "source_next_work_bias_receipt_id, source_next_work_bias_record_id,",
    "source_projection_fingerprint, source_global_dogfood_ledger_receipt_id,",
    "source_global_dogfood_ledger_record_id, source_metric_snapshot_receipt_id,",
    "source_metric_snapshot_record_id, relay_update_label, relay_update_rationale,",
    "recommended_next_work_label, outcome_label, outcome_signal, expected_summary,",
    "observed_summary, mismatch_or_gap_summary, selected_candidate_context_refs_json,",
    "source_next_work_candidate_card_ids_json, manual_only_context_refs_json,",
    "source_line, blockers_json, warnings_json, source_refs_json, authority_profile,",
    "perspective_relay_record_fingerprint",
    ") VALUES (",
    "@perspective_relay_record_id, @receipt_id, @created_at, @scope,",
    "@source_next_work_signal_receipt_id, @source_next_work_signal_record_id,",
    "@source_next_work_bias_receipt_id, @source_next_work_bias_record_id,",
    "@source_projection_fingerprint, @source_global_dogfood_ledger_receipt_id,",
    "@source_global_dogfood_ledger_record_id, @source_metric_snapshot_receipt_id,",
    "@source_metric_snapshot_record_id, @relay_update_label, @relay_update_rationale,",
    "@recommended_next_work_label, @outcome_label, @outcome_signal, @expected_summary,",
    "@observed_summary, @mismatch_or_gap_summary, @selected_candidate_context_refs_json,",
    "@source_next_work_candidate_card_ids_json, @manual_only_context_refs_json,",
    "@source_line, @blockers_json, @warnings_json, @source_refs_json, @authority_profile,",
    "@perspective_relay_record_fingerprint",
    ")"
  ].join(" ")).run(record);
}
function updateRelayStatus(status) {
  db.prepare(
    "UPDATE research_candidate_manual_global_dogfood_perspective_relay_receipts SET write_status = ?, rollback_of_receipt_id = CASE WHEN ? = 'rolled_back' THEN receipt_id ELSE rollback_of_receipt_id END WHERE receipt_id = ?"
  ).run(status, status, "manual-global-dogfood-perspective-relay-receipt:ready");
}
function buildContract(readback, overrides = {}) {
  return buildResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateContract({
    readback,
    operator_intent_label: "canonical_perspective_update_contract_smoke",
    ...overrides
  });
}
function mutateActiveRecord(readback, mutateRecord) {
  const mutated = clone(readback);
  const active = mutated.latest_active_committed;
  assert.ok(active?.perspective_relay_record);
  mutateRecord(active.perspective_relay_record);
  mutated.records_by_receipt = mutated.records_by_receipt.map((item) =>
    item.receipt.receipt_id === active.receipt.receipt_id ? active : item
  );
  return mutated;
}

const countsBefore = readCounts();
insertRelaySource("committed");
const readback = readResearchCandidateManualGlobalDogfoodPerspectiveRelay({ db, limit: 10 });
const readyContract = buildContract(readback);
const readyContractAgain = buildContract(readback);
const acceptedReview = buildResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReview({
  canonical_perspective_update_contract: readyContract,
  operator_decision: "accept_contract_for_future_canonical_perspective_update_write_slice",
  operator_note: "local-only smoke note"
});
const revisionReview = buildResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReview({
  canonical_perspective_update_contract: readyContract,
  operator_decision: "needs_canonical_perspective_mapping_revision"
});
const rejectReview = buildResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReview({
  canonical_perspective_update_contract: readyContract,
  operator_decision: "reject_canonical_perspective_update_contract"
});
const deferReview = buildResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReview({
  canonical_perspective_update_contract: readyContract,
  operator_decision: "defer_canonical_perspective_update_contract"
});

const noSourceContract = buildContract({
  ...clone(readback),
  records_by_receipt: [],
  latest_receipts: [],
  latest_active_committed: null,
  count: 0,
  perspective_relay_written: false
});
updateRelayStatus("rolled_back");
const rolledBackReadback = readResearchCandidateManualGlobalDogfoodPerspectiveRelay({ db, limit: 10 });
const rolledBackContract = buildContract(rolledBackReadback);
updateRelayStatus("superseded");
const supersededReadback = readResearchCandidateManualGlobalDogfoodPerspectiveRelay({ db, limit: 10 });
const supersededContract = buildContract(supersededReadback);
updateRelayStatus("committed");

const missingLabelContract = buildContract(mutateActiveRecord(readback, (record) => {
  record.relay_update_label = "";
}));
const missingRationaleContract = buildContract(mutateActiveRecord(readback, (record) => {
  record.relay_update_rationale = "";
}));
const missingContextContract = buildContract(mutateActiveRecord(readback, (record) => {
  record.selected_candidate_context_refs = [];
}));
const missingCardsContract = buildContract(mutateActiveRecord(readback, (record) => {
  record.source_next_work_candidate_card_ids = [];
}));
const insufficientExplanationContract = buildContract(mutateActiveRecord(readback, (record) => {
  record.expected_summary = null;
  record.observed_summary = null;
  record.mismatch_or_gap_summary = null;
}));

const mutationContracts = {};
for (const flag of [
  "perspective_state_written",
  "perspective_promoted",
  "perspective_memory_written",
  "work_mutated",
  "dogfood_metrics_written",
  "global_dogfood_ledger_mutated",
  "metric_snapshot_mutated",
  "next_work_signal_decision_mutated",
  "next_work_bias_mutated",
  "proof_or_evidence_rows_written",
  "product_write_executed",
  "raw_manual_note_text_present",
  "raw_result_report_text_present",
  "operator_notes_persisted"
]) {
  mutationContracts[flag] = buildContract({ ...clone(readback), [flag]: true });
}

const blockedAcceptReview = buildResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReview({
  canonical_perspective_update_contract: missingLabelContract,
  operator_decision: "accept_contract_for_future_canonical_perspective_update_write_slice"
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
  missingContextContract,
  missingCardsContract,
  insufficientExplanationContract,
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
    "ready_for_future_canonical_perspective_update_write_authorization",
  );
  assert.equal(
    sample.readyContract.proposed_perspective_update_candidate.candidate_status,
    "ready_for_future_canonical_perspective_update_write_authorization",
  );
  assert.equal(sample.readyContract.proposed_perspective_update_candidate.writes_now, false);
  assert.equal(
    sample.readyContract.proposed_perspective_update_candidate
      .would_write_canonical_perspective_state,
    false,
  );
  assert.equal(
    sample.readyContract.proposed_perspective_update_candidate
      .would_promote_perspective,
    false,
  );
  assert.equal(
    sample.readyContract.proposed_perspective_update_candidate
      .would_write_perspective_memory,
    false,
  );
  assert.equal(
    sample.readyContract.proposed_perspective_update_candidate.would_mutate_work,
    false,
  );
  assert.equal(
    sample.readyContract.proposed_perspective_update_candidate
      .would_write_proof_or_evidence,
    false,
  );
  assert.equal(
    sample.readyContract.idempotency_contract_preview.proposed_idempotency_key,
    sample.readyContractAgain.idempotency_contract_preview.proposed_idempotency_key,
  );
  assert.equal(
    sample.readyContract.source_perspective_relay_receipt_id,
    sample.readback.latest_active_committed.receipt.receipt_id,
  );
  assert.equal(
    sample.readyContract.source_perspective_relay_record_fingerprint,
    sample.readback.latest_active_committed.perspective_relay_record
      .perspective_relay_record_fingerprint,
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
    sample.readyContract.proposed_existing_perspective_update_compatibility
      .manual_source_refs_preserved,
    true,
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
    missingContextContract: sample.missingContextContract,
    missingCardsContract: sample.missingCardsContract,
    insufficientExplanationContract: sample.insufficientExplanationContract,
  })) {
    assert.equal(contract.validation.passed, false, `${label} must block`);
    assert.equal(
      contract.operator_authorization_mode,
      "blocked_before_canonical_perspective_update_authorization",
      `${label} must not be ready`,
    );
  }
  assert.ok(
    sample.noSourceContract.blocker_reasons.includes(
      "source_perspective_relay_receipt_not_active_committed",
    ),
  );
  assert.ok(
    sample.rolledBackContract.blocker_reasons.includes(
      "source_perspective_relay_receipt_not_active_committed",
    ),
  );
  assert.ok(
    sample.missingLabelContract.blocker_reasons.includes(
      "relay_update_label_missing",
    ),
  );
  assert.ok(
    sample.insufficientExplanationContract.blocker_reasons.includes(
      "canonical_update_explanation_insufficient",
    ),
  );

  for (const [flag, contract] of Object.entries(sample.mutationContracts)) {
    assert.equal(contract.validation.passed, false, `${flag} must block`);
    assert.equal(
      contract.operator_authorization_mode,
      "blocked_before_canonical_perspective_update_authorization",
      `${flag} must not be ready`,
    );
  }
  assert.ok(
    sample.mutationContracts.perspective_state_written.blocker_reasons.includes(
      "source_relay_readback_canonical_perspective_already_written",
    ),
  );
  assert.ok(
    sample.mutationContracts.global_dogfood_ledger_mutated.blocker_reasons.includes(
      "source_relay_readback_metric_or_source_store_mutated",
    ),
  );
  assert.ok(
    sample.mutationContracts.operator_notes_persisted.blocker_reasons.includes(
      "source_relay_raw_text_or_operator_note_present",
    ),
  );
}

function assertReview(sample) {
  assert.equal(
    sample.acceptedReview.review_status,
    "ready_for_future_canonical_perspective_update_write_slice",
  );
  assert.equal(sample.acceptedReview.validation.passed, true);
  assert.equal(sample.acceptedReview.validation.operator_note_persisted, false);
  assert.equal(sample.acceptedReview.validation.no_write_authority, true);
  assert.equal(
    sample.acceptedReview.accepted_mapping_summary.source_contract_fingerprint,
    sample.readyContract.validation.contract_fingerprint,
  );
  assert.equal(
    sample.acceptedReview.accepted_mapping_summary.source_perspective_relay_record_fingerprint,
    sample.readyContract.source_perspective_relay_record_fingerprint,
  );
  assert.equal(
    sample.acceptedReview.accepted_mapping_summary.proposed_idempotency_key,
    sample.readyContract.idempotency_contract_preview.proposed_idempotency_key,
  );
  assert.equal(
    sample.blockedAcceptReview.review_status,
    "blocked_canonical_perspective_contract_not_ready",
  );
  for (const review of [
    sample.revisionReview,
    sample.rejectReview,
    sample.deferReview,
  ]) {
    assert.notEqual(
      review.review_status,
      "ready_for_future_canonical_perspective_update_write_slice",
    );
    assert.equal(review.validation.passed, false);
  }
}

function assertNonTargetTables(sample) {
  assert.equal(
    sample.countsAfter.research_candidate_manual_global_dogfood_perspective_relay_receipts,
    1,
  );
  assert.equal(
    sample.countsAfter.research_candidate_manual_global_dogfood_perspective_relay_records,
    1,
  );
  assert.equal(
    sample.countsAfter.research_candidate_manual_global_dogfood_perspective_relay_rollbacks,
    0,
  );
  for (const table of [
    "perspective_states",
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
      "smoke:research-candidate-manual-global-dogfood-canonical-perspective-update-contract-v0-1"
    ],
    "node scripts/smoke-research-candidate-manual-global-dogfood-canonical-perspective-update-contract-v0-1.mjs",
  );
  for (const text of [
    "Active committed manual global dogfood Perspective relay readback",
    "canonical Perspective update authorization contract preview",
    "does not write canonical Perspective state",
  ]) {
    assert.ok(source.docs.includes(text), `docs must include ${text}`);
  }
  assert.match(
    source.docs,
    /Perspective promotion remains\s+out of scope/,
    "docs must state Perspective promotion remains out of scope",
  );
}
