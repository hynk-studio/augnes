#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const files = {
  type:
    "types/research-candidate-manual-global-dogfood-canonical-perspective-update-write.ts",
  writer:
    "lib/research-candidate-review/manual-global-dogfood-canonical-perspective-update-write.ts",
  readback:
    "lib/research-candidate-review/read-manual-global-dogfood-canonical-perspective-update.ts",
  route:
    "app/api/research-candidate-review/manual-global-dogfood-canonical-perspective-update/route.ts",
  rollbackRoute:
    "app/api/research-candidate-review/manual-global-dogfood-canonical-perspective-update/[receipt_id]/rollback/route.ts",
  writePanel:
    "components/research-candidate-manual-global-dogfood-canonical-perspective-update-write-panel.tsx",
  readbackPanel:
    "components/research-candidate-manual-global-dogfood-canonical-perspective-update-readback-panel.tsx",
  contractPanel:
    "components/research-candidate-manual-global-dogfood-canonical-perspective-update-contract-panel.tsx",
  schema: "lib/db/schema.sql",
  db: "lib/db.ts",
  migrations: "scripts/db-migrations.mjs",
  dbMigrate: "scripts/db-migrate.mjs",
  smoke:
    "scripts/smoke-research-candidate-manual-global-dogfood-canonical-perspective-update-write-v0-1.mjs",
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
assertRejections(sample);
assertCommitDuplicateRollbackSupersede(sample);
assertReadbackAndNonTargetTables(sample);
assertDocsAndPackage();

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-manual-global-dogfood-canonical-perspective-update-write-v0-1",
      pass: true,
      storage_path: "manual_specific_canonical_perspective_update_tables",
      source_perspective_relay_revalidated: true,
      rejection_cases_checked: true,
      commit_checked: true,
      duplicate_replay_checked: true,
      rollback_checked: true,
      supersede_checked: true,
      readback_checked: true,
      non_target_table_counts_checked: true,
      no_raw_text_or_operator_note_persistence_checked: true,
      static_forbidden_behavior_checked: true,
    },
    null,
    2,
  ),
);

function assertStaticContracts() {
  for (const requiredText of [
    "I authorize writing this manual global dogfood relay to a canonical Perspective update record",
    "I authorize rolling back this manual global dogfood canonical Perspective update receipt",
    "manual_operator_authorized_canonical_perspective_update_write",
    "manual_operator_authorized_canonical_perspective_update_rollback",
    "can_write_canonical_perspective_update_record: true",
    "can_write_canonical_perspective_update_receipt: true",
    "can_write_canonical_perspective_update_rollback_metadata: true",
    "can_write_canonical_perspective_state: false",
    "can_update_current_working_perspective: false",
    "can_promote_perspective: false",
    "can_write_perspective_memory: false",
    "can_mutate_perspective_relay: false",
    "can_mutate_next_work_bias: false",
    "can_write_work_item: false",
    "can_mutate_work: false",
    "can_write_dogfood_metrics: false",
    "can_write_global_dogfood_ledger: false",
    "can_write_metric_snapshot: false",
    "can_write_next_work_signal_decision: false",
    "can_write_proof_or_evidence: false",
    "persists_raw_manual_note_text: false",
    "persists_raw_result_report_text: false",
    "persists_operator_notes: false",
  ]) {
    assert.ok(source.type.includes(requiredText), `type must include ${requiredText}`);
  }

  for (const requiredText of [
    "research_candidate_manual_global_dogfood_canonical_perspective_update_receipts",
    "research_candidate_manual_global_dogfood_canonical_perspective_update_records",
    "research_candidate_manual_global_dogfood_canonical_perspective_update_rollbacks",
    "source_canonical_perspective_update_contract_fingerprint TEXT NOT NULL",
    "source_canonical_perspective_update_review_fingerprint TEXT NOT NULL",
    "source_perspective_relay_receipt_id TEXT NOT NULL",
    "source_perspective_relay_record_id TEXT NOT NULL",
    "source_perspective_relay_record_fingerprint TEXT NOT NULL",
    "source_next_work_signal_receipt_id TEXT NOT NULL",
    "source_next_work_bias_receipt_id TEXT NOT NULL",
    "source_projection_fingerprint TEXT NOT NULL",
    "source_global_dogfood_ledger_receipt_id TEXT NOT NULL",
    "source_metric_snapshot_receipt_id TEXT NOT NULL",
    "idempotency_key TEXT NOT NULL UNIQUE",
    "canonical_update_label TEXT NOT NULL",
    "canonical_update_rationale TEXT NOT NULL",
    "relay_update_label TEXT NOT NULL",
    "relay_update_rationale TEXT NOT NULL",
    "compatibility_findings_json TEXT NOT NULL",
    "existing_perspective_update_compatibility_json TEXT NOT NULL",
  ]) {
    assert.ok(source.schema.includes(requiredText), `schema must include ${requiredText}`);
  }

  assert.ok(
    source.db.includes(
      "migrateResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateTables",
    ),
    "lib/db.ts must migrate manual canonical Perspective update tables",
  );
  assert.ok(
    source.migrations.includes(
      "migrateResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdate",
    ),
    "db-migrations must expose manual canonical Perspective update migration",
  );
  assert.ok(
    source.dbMigrate.includes(
      "researchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateResult",
    ),
    "db-migrate must run manual canonical Perspective update migration",
  );

  assert.match(source.writer, /BEGIN IMMEDIATE/, "writer must use transaction");
  const transactionSlice = source.writer.slice(
    source.writer.indexOf('db.prepare("BEGIN IMMEDIATE").run();'),
    source.writer.indexOf("insertReceipt(db, receipt);"),
  );
  assert.match(
    transactionSlice,
    /validateSourcesForRequest/,
    "writer must revalidate source Perspective relay inside the transaction",
  );
  assert.match(
    source.writer,
    /canonical_perspective_update_review_contract_mismatch/,
    "writer must reject contract/review mismatches",
  );
  assert.match(
    source.writer,
    /canonical_perspective_update_review_source_mismatch/,
    "writer must reject review source mismatches",
  );
  assert.match(
    source.writer,
    /canonical_perspective_update_scope_hint_must_be_canonical_state/,
    "writer must refuse current-working Perspective scope hints",
  );
  const idempotencySlice = source.writer.slice(
    source.writer.indexOf("function computeCanonicalPerspectiveUpdateIdempotencyKey"),
    source.writer.indexOf("function validationWithFailures"),
  );
  assert.doesNotMatch(
    idempotencySlice,
    /review_fingerprint|operator_note|warning_reasons/,
    "durable idempotency must exclude local-only review note material",
  );
  assert.doesNotMatch(
    `${source.writer}\n${source.readback}\n${source.route}\n${source.rollbackRoute}`,
    /writeCurrentWorkingPerspective|applyCurrentWorkingPerspective|writePerspectiveState|promotePerspective|writePerspectiveMemory|writeProof|writeEvidence|writeDogfoodMetric|writeResearchCandidateManualGlobalDogfoodMetricSnapshot\s*\(|writeResearchCandidateManualGlobalDogfoodLedger\s*\(|writeResearchCandidateManualGlobalDogfoodNextWorkSignal\s*\(|writeResearchCandidateManualGlobalDogfoodNextWorkBias\s*\(|writeResearchCandidateManualGlobalDogfoodPerspectiveRelay\s*\(|executeCodex|runCodex|OPENAI_API_KEY|new\s+OpenAI|api\.openai\.com|api\.github\.com|retrieveSources\s*\(|runRetrieval\s*\(|ragIndex\s*\(|embedding\s*\(|vectorStore\s*\(|crawler\s*\(|crawlSources\s*\(/i,
    "manual canonical Perspective update writer/readback must not invoke forbidden writers or external behavior",
  );
  assert.doesNotMatch(
    `${source.writer}\n${source.readback}\n${source.route}\n${source.rollbackRoute}`,
    /INSERT\s+INTO\s+(dogfood_metric_snapshot_records|dogfooding_records|dogfooding_signals|dogfooding_review_cues|verification_evidence_records|work_items|work_events|perspective_states|perspective_memory_items|delivery_ledger)|UPDATE\s+(dogfood_metric_snapshot_records|dogfooding_records|dogfooding_signals|dogfooding_review_cues|verification_evidence_records|work_items|work_events|perspective_states|perspective_memory_items|delivery_ledger)|DELETE\s+FROM/i,
    "canonical Perspective update write path must not write non-target tables or delete rows",
  );
  assert.ok(source.route.includes("export async function GET"));
  assert.ok(source.route.includes("export async function POST"));
  assert.ok(source.rollbackRoute.includes("export async function POST"));
  assert.ok(source.route.includes("same_origin_required"));
  assert.ok(source.rollbackRoute.includes("same_origin_required"));
  assert.ok(source.route.includes("canonical_perspective_state_written: false"));
  assert.ok(source.route.includes("current_working_perspective_updated: false"));
  assert.ok(source.rollbackRoute.includes("perspective_memory_written: false"));
  assert.match(
    source.writePanel,
    /\/api\/research-candidate-review\/manual-global-dogfood-canonical-perspective-update/,
    "write panel must call the same-origin manual canonical Perspective update route",
  );
  assert.match(
    source.writePanel,
    /\/api\/research-candidate-review\/manual-global-dogfood-perspective-relay/,
    "write panel must fetch source Perspective relay readback",
  );
  assert.match(
    source.writePanel,
    /source_perspective_relay_readback: sourceRelayReadback/,
    "write panel must submit source Perspective relay readback",
  );
  assert.match(
    source.writePanel,
    /Write canonical Perspective update record/,
    "write panel must expose explicit authorized canonical Perspective update write button",
  );
  assert.match(
    source.writePanel,
    /rollbackEnabled[\s\S]*rollbackConfirmationText ===[\s\S]*RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_ROLLBACK_CONFIRMATION/,
    "rollback button must require exact rollback confirmation text",
  );
  assert.doesNotMatch(
    source.writePanel,
    /<button[^>]*>\s*(Create work item|Promote Perspective|Write Perspective state|Write Perspective Memory|Update current working Perspective|Global metrics update)/i,
    "write panel must not expose current-working/Perspective-state/memory/work/metric controls",
  );
  assert.ok(
    source.contractPanel.includes(
      "ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWritePanel",
    ) &&
      source.contractPanel.includes(
        "ready_for_future_canonical_perspective_update_write_slice",
      ),
    "contract panel must gate write panel behind accepted canonical update review",
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
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_WRITE_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_ROLLBACK_CONFIRMATION
} from "./types/research-candidate-manual-global-dogfood-canonical-perspective-update-write";
import {
  writeResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdate,
  rollbackResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReceipt
} from "./lib/research-candidate-review/manual-global-dogfood-canonical-perspective-update-write";
import { readResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdate } from "./lib/research-candidate-review/read-manual-global-dogfood-canonical-perspective-update";

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
  "research_candidate_manual_global_dogfood_canonical_perspective_update_receipts",
  "research_candidate_manual_global_dogfood_canonical_perspective_update_records",
  "research_candidate_manual_global_dogfood_canonical_perspective_update_rollbacks",
  "dogfood_metric_snapshot_records",
  "dogfooding_records",
  "dogfooding_signals",
  "dogfooding_review_cues",
  "verification_evidence_records",
  "action_records",
  "work_items",
  "work_events",
  "perspective_states",
  "perspective_promotion_decisions",
  "perspective_formation_receipts",
  "perspective_memory_items",
  "delivery_ledger"
];
function readCounts() {
  return Object.fromEntries(countTables.map((table) => [table, count(table)]));
}
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
function insertRelaySource(tag, status = "committed") {
  const createdAt = "2026-07-07T00:00:00.000Z";
  const receipt = {
    receipt_id: "manual-global-dogfood-perspective-relay-receipt:" + tag,
    created_at: createdAt,
    scope: "project:augnes",
    source_perspective_relay_contract_fingerprint: "fnv1a32:relay-contract-" + tag,
    source_perspective_relay_review_fingerprint: "fnv1a32:relay-review-" + tag,
    source_next_work_signal_receipt_id: "signal-receipt-" + tag,
    source_next_work_signal_record_id: "signal-record-" + tag,
    source_next_work_signal_record_fingerprint: "fnv1a32:signal-record-" + tag,
    source_next_work_bias_receipt_id: "bias-receipt-" + tag,
    source_next_work_bias_record_id: "bias-record-" + tag,
    source_next_work_bias_record_fingerprint: "fnv1a32:bias-record-" + tag,
    source_projection_fingerprint: "fnv1a32:projection-" + tag,
    source_global_dogfood_ledger_receipt_id: "ledger-receipt-" + tag,
    source_global_dogfood_ledger_record_id: "ledger-record-" + tag,
    source_metric_snapshot_receipt_id: "metric-receipt-" + tag,
    source_metric_snapshot_record_id: "metric-record-" + tag,
    source_manual_receipt_id: "manual-receipt-" + tag,
    source_handoff_seed_fingerprint: "fnv1a32:handoff-" + tag,
    source_result_text_fingerprint: "fnv1a32:result-" + tag,
    source_expected_observed_delta_record_ref: "eod-record-" + tag,
    source_reuse_outcome_record_ref: "reuse-record-" + tag,
    idempotency_key: "relay-idempotency-" + tag,
    write_status: status,
    authority_profile: "manual_global_dogfood_perspective_relay_write_authority.v0.1",
    receipt_fingerprint: "fnv1a32:relay-receipt-" + tag,
    supersedes_receipt_id: null,
    rollback_of_receipt_id: status === "rolled_back" ? "manual-global-dogfood-perspective-relay-receipt:" + tag : null,
    rollback_reason: status === "rolled_back" ? "source relay rollback" : null
  };
  const record = {
    perspective_relay_record_id: "manual-global-dogfood-perspective-relay-record:" + tag,
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
    relay_update_label: "Canonical relay update " + tag,
    relay_update_rationale: "Relay rationale " + tag,
    recommended_next_work_label: "Review manual dogfood follow-up " + tag,
    outcome_label: "helpful",
    outcome_signal: "positive",
    expected_summary: "Expected relay " + tag,
    observed_summary: "Observed relay " + tag,
    mismatch_or_gap_summary: "Relay gap " + tag,
    selected_candidate_context_refs_json: JSON.stringify(["context:" + tag]),
    source_next_work_candidate_card_ids_json: JSON.stringify(["card:" + tag]),
    manual_only_context_refs_json: JSON.stringify(["manual-only:" + tag]),
    source_line: "Source line " + tag,
    blockers_json: JSON.stringify([]),
    warnings_json: JSON.stringify(["manual-source-warning:" + tag]),
    source_refs_json: JSON.stringify(["source:" + tag]),
    authority_profile: receipt.authority_profile,
    perspective_relay_record_fingerprint: "fnv1a32:relay-record-" + tag
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
    "source_manual_receipt_id, source_handoff_seed_fingerprint, source_result_text_fingerprint,",
    "source_expected_observed_delta_record_ref, source_reuse_outcome_record_ref,",
    "idempotency_key, write_status, authority_profile, receipt_fingerprint,",
    "supersedes_receipt_id, rollback_of_receipt_id, rollback_reason",
    ") VALUES (",
    "@receipt_id, @created_at, @scope, @source_perspective_relay_contract_fingerprint,",
    "@source_perspective_relay_review_fingerprint, @source_next_work_signal_receipt_id,",
    "@source_next_work_signal_record_id, @source_next_work_signal_record_fingerprint,",
    "@source_next_work_bias_receipt_id, @source_next_work_bias_record_id,",
    "@source_next_work_bias_record_fingerprint, @source_projection_fingerprint,",
    "@source_global_dogfood_ledger_receipt_id, @source_global_dogfood_ledger_record_id,",
    "@source_metric_snapshot_receipt_id, @source_metric_snapshot_record_id,",
    "@source_manual_receipt_id, @source_handoff_seed_fingerprint, @source_result_text_fingerprint,",
    "@source_expected_observed_delta_record_ref, @source_reuse_outcome_record_ref,",
    "@idempotency_key, @write_status, @authority_profile, @receipt_fingerprint,",
    "@supersedes_receipt_id, @rollback_of_receipt_id, @rollback_reason",
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
    "source_next_work_candidate_card_ids_json, manual_only_context_refs_json, source_line,",
    "blockers_json, warnings_json, source_refs_json, authority_profile, perspective_relay_record_fingerprint",
    ") VALUES (",
    "@perspective_relay_record_id, @receipt_id, @created_at, @scope,",
    "@source_next_work_signal_receipt_id, @source_next_work_signal_record_id,",
    "@source_next_work_bias_receipt_id, @source_next_work_bias_record_id,",
    "@source_projection_fingerprint, @source_global_dogfood_ledger_receipt_id,",
    "@source_global_dogfood_ledger_record_id, @source_metric_snapshot_receipt_id,",
    "@source_metric_snapshot_record_id, @relay_update_label, @relay_update_rationale,",
    "@recommended_next_work_label, @outcome_label, @outcome_signal, @expected_summary,",
    "@observed_summary, @mismatch_or_gap_summary, @selected_candidate_context_refs_json,",
    "@source_next_work_candidate_card_ids_json, @manual_only_context_refs_json, @source_line,",
    "@blockers_json, @warnings_json, @source_refs_json, @authority_profile, @perspective_relay_record_fingerprint",
    ")"
  ].join(" ")).run(record);
  return { receipt, record };
}
function updateRelayStatus(tag, status) {
  db.prepare(
    "UPDATE research_candidate_manual_global_dogfood_perspective_relay_receipts SET write_status = ?, rollback_of_receipt_id = CASE WHEN ? = 'rolled_back' THEN receipt_id ELSE rollback_of_receipt_id END WHERE receipt_id = ?"
  ).run(status, status, "manual-global-dogfood-perspective-relay-receipt:" + tag);
}
function relayReadback(tag) {
  return readResearchCandidateManualGlobalDogfoodPerspectiveRelay({
    db,
    receiptId: "manual-global-dogfood-perspective-relay-receipt:" + tag,
    limit: 1
  });
}
function buildContractAndReview(tag) {
  const sourceReadback = relayReadback(tag);
  const contract = buildResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateContract({
    readback: sourceReadback,
    operator_intent_label: "manual_canonical_perspective_update_write_smoke"
  });
  const review = buildResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReview({
    canonical_perspective_update_contract: contract,
    operator_decision: "accept_contract_for_future_canonical_perspective_update_write_slice",
    operator_note: "Local-only note " + tag
  });
  return { sourceReadback, contract, review };
}
function request(contract, review, sourceReadback, overrides = {}) {
  const { operator_authorization: operatorOverrides = {}, ...topLevelOverrides } = overrides;
  return {
    canonical_perspective_update_contract: contract,
    canonical_perspective_update_review: review,
    source_perspective_relay_readback: sourceReadback,
    operator_authorization: {
      authorization_kind: "manual_operator_authorized_canonical_perspective_update_write",
      operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_WRITE_CONFIRMATION,
      write_mode: "commit",
      ...operatorOverrides
    },
    ...topLevelOverrides
  };
}
function write(contract, review, sourceReadback, overrides = {}) {
  return writeResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdate(
    request(contract, review, sourceReadback, overrides),
    { db }
  );
}
function readySource(tag, status = "committed") {
  insertRelaySource(tag, status);
  const source = buildContractAndReview(tag);
  if (status === "committed") {
    assert.equal(source.contract.operator_authorization_mode, "ready_for_future_canonical_perspective_update_write_authorization");
    assert.equal(source.review.review_status, "ready_for_future_canonical_perspective_update_write_slice");
  }
  return source;
}

const countsInitial = readCounts();
const primary = readySource("primary");
const wrongConfirmation = write(primary.contract, primary.review, primary.sourceReadback, {
  operator_authorization: { operator_confirmation_text: "wrong confirmation" }
});
const revisionReview = buildResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReview({
  canonical_perspective_update_contract: primary.contract,
  operator_decision: "needs_canonical_perspective_mapping_revision"
});
const rejectReview = buildResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReview({
  canonical_perspective_update_contract: primary.contract,
  operator_decision: "reject_canonical_perspective_update_contract"
});
const deferReview = buildResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReview({
  canonical_perspective_update_contract: primary.contract,
  operator_decision: "defer_canonical_perspective_update_contract"
});
const nonAcceptedRevision = write(primary.contract, revisionReview, primary.sourceReadback);
const nonAcceptedReject = write(primary.contract, rejectReview, primary.sourceReadback);
const nonAcceptedDefer = write(primary.contract, deferReview, primary.sourceReadback);
const mismatch = readySource("mismatch");
const countsBeforeMismatchedReview = readCounts();
const mismatchedReviewWrite = write(primary.contract, mismatch.review, primary.sourceReadback);
const countsAfterMismatchedReview = readCounts();
const mutatedSourceReadbackWrite = write(primary.contract, primary.review, {
  ...clone(primary.sourceReadback),
  metric_snapshot_mutated: true
});
const rawTextWrite = write(primary.contract, primary.review, primary.sourceReadback, {
  raw_result_report_text: "raw result text must not persist"
});
const operatorNoteWrite = write(primary.contract, primary.review, primary.sourceReadback, {
  operator_note: "operator note must not persist"
});
const sideEffectWrite = write(primary.contract, primary.review, primary.sourceReadback, {
  requested_side_effects: {
    canonical_perspective_state_written: true,
    current_working_perspective_updated: true,
    perspective_promoted: true,
    perspective_memory_written: true,
    work_item_written: true,
    proof_or_evidence_written: true,
    dogfood_metrics_written: true,
    next_work_bias_mutated: true,
    product_write_executed: true
  }
});
const wrongAuthorityContract = {
  ...primary.contract,
  authority_boundary: {
    ...primary.contract.authority_boundary,
    can_mutate_work: true
  },
  validation: {
    ...primary.contract.validation,
    contract_fingerprint: primary.contract.validation.contract_fingerprint + ":authority"
  }
};
const wrongAuthorityReview = buildResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReview({
  canonical_perspective_update_contract: wrongAuthorityContract,
  operator_decision: "accept_contract_for_future_canonical_perspective_update_write_slice"
});
const wrongAuthorityWrite = write(wrongAuthorityContract, wrongAuthorityReview, primary.sourceReadback);
const currentWorkingScopeContract = {
  ...primary.contract,
  proposed_perspective_update_candidate: {
    ...primary.contract.proposed_perspective_update_candidate,
    update_scope_hint: "current_working_perspective"
  },
  validation: {
    ...primary.contract.validation,
    contract_fingerprint: primary.contract.validation.contract_fingerprint + ":scope"
  }
};
const currentWorkingScopeReview = buildResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReview({
  canonical_perspective_update_contract: currentWorkingScopeContract,
  operator_decision: "accept_contract_for_future_canonical_perspective_update_write_slice"
});
const currentWorkingScopeWrite = write(currentWorkingScopeContract, currentWorkingScopeReview, primary.sourceReadback);
const committed = write(primary.contract, primary.review, primary.sourceReadback);
const duplicate = write(primary.contract, primary.review, primary.sourceReadback);
const reviewWithNote = buildResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReview({
  canonical_perspective_update_contract: primary.contract,
  operator_decision: "accept_contract_for_future_canonical_perspective_update_write_slice",
  operator_note: "A different local-only note"
});
const duplicateWithLocalNoteReview = write(primary.contract, reviewWithNote, primary.sourceReadback);
const wrongRollback = rollbackResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReceipt({
  receipt_id: committed.receipt.receipt_id,
  rollback_authorization: {
    authorization_kind: "manual_operator_authorized_canonical_perspective_update_rollback",
    operator_confirmation_text: "wrong rollback confirmation",
    rollback_reason: "wrong confirmation"
  }
}, { db });
const rollback = rollbackResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReceipt({
  receipt_id: committed.receipt.receipt_id,
  rollback_authorization: {
    authorization_kind: "manual_operator_authorized_canonical_perspective_update_rollback",
    operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_ROLLBACK_CONFIRMATION,
    rollback_reason: "operator rollback"
  }
}, { db });
const duplicateRollback = rollbackResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReceipt({
  receipt_id: committed.receipt.receipt_id,
  rollback_authorization: {
    authorization_kind: "manual_operator_authorized_canonical_perspective_update_rollback",
    operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_ROLLBACK_CONFIRMATION,
    rollback_reason: "operator rollback again"
  }
}, { db });
const staleRelay = readySource("stale-relay");
updateRelayStatus("stale-relay", "rolled_back");
const staleRelayWrite = write(staleRelay.contract, staleRelay.review, staleRelay.sourceReadback);
const supersededRelay = readySource("superseded-relay");
updateRelayStatus("superseded-relay", "superseded");
const supersededRelayWrite = write(supersededRelay.contract, supersededRelay.review, supersededRelay.sourceReadback);
const supersedeTarget = readySource("supersede-target");
const supersedeTargetWrite = write(supersedeTarget.contract, supersedeTarget.review, supersedeTarget.sourceReadback);
const supersedeReplacement = readySource("supersede-replacement");
const supersedeWrite = write(supersedeReplacement.contract, supersedeReplacement.review, supersedeReplacement.sourceReadback, {
  operator_authorization: {
    write_mode: "supersede_previous",
    supersedes_receipt_id: supersedeTargetWrite.receipt.receipt_id
  }
});
const supersedeRolledBack = write(supersedeReplacement.contract, supersedeReplacement.review, supersedeReplacement.sourceReadback, {
  operator_authorization: {
    write_mode: "supersede_previous",
    supersedes_receipt_id: committed.receipt.receipt_id
  }
});
const readback = readResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdate({ db, limit: 50 });
const countsFinal = readCounts();
const rawTextColumns = db.prepare("SELECT name FROM pragma_table_info('research_candidate_manual_global_dogfood_canonical_perspective_update_records') WHERE name LIKE '%raw%' OR name LIKE '%note%'").all();

console.log(JSON.stringify({
  countsInitial,
  countsBeforeMismatchedReview,
  countsAfterMismatchedReview,
  countsFinal,
  primary,
  wrongConfirmation,
  nonAcceptedRevision,
  nonAcceptedReject,
  nonAcceptedDefer,
  mismatchedReviewWrite,
  mutatedSourceReadbackWrite,
  rawTextWrite,
  operatorNoteWrite,
  sideEffectWrite,
  wrongAuthorityWrite,
  currentWorkingScopeWrite,
  committed,
  duplicate,
  duplicateWithLocalNoteReview,
  wrongRollback,
  rollback,
  duplicateRollback,
  staleRelayWrite,
  supersededRelayWrite,
  supersedeTargetWrite,
  supersedeWrite,
  supersedeRolledBack,
  readback,
  rawTextColumns
}));
`;

  const output = execFileSync("node", ["--import", "tsx", "--eval", code], {
    encoding: "utf8",
  });
  return JSON.parse(output);
}

function assertRejections(sample) {
  for (const [label, result] of Object.entries({
    wrongConfirmation: sample.wrongConfirmation,
    nonAcceptedRevision: sample.nonAcceptedRevision,
    nonAcceptedReject: sample.nonAcceptedReject,
    nonAcceptedDefer: sample.nonAcceptedDefer,
    mismatchedReviewWrite: sample.mismatchedReviewWrite,
    mutatedSourceReadbackWrite: sample.mutatedSourceReadbackWrite,
    rawTextWrite: sample.rawTextWrite,
    operatorNoteWrite: sample.operatorNoteWrite,
    sideEffectWrite: sample.sideEffectWrite,
    wrongAuthorityWrite: sample.wrongAuthorityWrite,
    currentWorkingScopeWrite: sample.currentWorkingScopeWrite,
    staleRelayWrite: sample.staleRelayWrite,
    supersededRelayWrite: sample.supersededRelayWrite,
    supersedeRolledBack: sample.supersedeRolledBack,
  })) {
    assert.equal(result.ok, false, `${label} must be refused`);
    assert.equal(result.result_status, "refused", `${label} must be refused`);
  }
  assert.ok(
    sample.wrongConfirmation.refusal_reasons.includes(
      "canonical_perspective_update_wrong_confirmation",
    ),
  );
  assert.ok(
    sample.mismatchedReviewWrite.refusal_reasons.includes(
      "canonical_perspective_update_review_contract_mismatch",
    ) ||
      sample.mismatchedReviewWrite.refusal_reasons.includes(
        "canonical_perspective_update_review_source_mismatch",
      ),
  );
  assert.ok(
    sample.mutatedSourceReadbackWrite.refusal_reasons.includes(
      "canonical_perspective_update_source_readback_forbidden_mutation_flag",
    ),
  );
  assert.ok(
    sample.currentWorkingScopeWrite.refusal_reasons.includes(
      "canonical_perspective_update_scope_hint_must_be_canonical_state",
    ),
  );
  assert.ok(
    sample.staleRelayWrite.refusal_reasons.includes(
      "canonical_perspective_update_source_relay_receipt_not_active_committed",
    ),
  );
  assert.ok(
    sample.supersededRelayWrite.refusal_reasons.includes(
      "canonical_perspective_update_source_relay_receipt_not_active_committed",
    ),
  );
  assert.deepEqual(
    sample.countsBeforeMismatchedReview,
    sample.countsAfterMismatchedReview,
    "contract A + review B mismatch must not insert rows",
  );
}

function assertCommitDuplicateRollbackSupersede(sample) {
  assert.equal(sample.committed.ok, true);
  assert.equal(sample.committed.result_status, "committed");
  assert.ok(sample.committed.receipt.receipt_id);
  assert.ok(
    sample.committed.canonical_perspective_update_record
      .canonical_perspective_update_record_id,
  );
  assert.equal(
    sample.committed.receipt.source_perspective_relay_receipt_id,
    sample.primary.sourceReadback.latest_active_committed.receipt.receipt_id,
  );
  assert.equal(
    sample.committed.canonical_perspective_update_record.update_scope_hint,
    "canonical_perspective_state",
  );
  assert.equal(sample.duplicate.ok, true);
  assert.equal(sample.duplicate.result_status, "duplicate_replayed");
  assert.equal(sample.duplicate.duplicate_replayed, true);
  assert.equal(sample.duplicate.receipt.receipt_id, sample.committed.receipt.receipt_id);
  assert.equal(sample.duplicateWithLocalNoteReview.result_status, "duplicate_replayed");
  assert.equal(sample.wrongRollback.ok, false);
  assert.equal(sample.rollback.ok, true);
  assert.equal(sample.rollback.result_status, "rolled_back");
  assert.equal(sample.duplicateRollback.ok, true);
  assert.equal(sample.duplicateRollback.result_status, "rolled_back");
  assert.equal(sample.supersedeTargetWrite.ok, true);
  assert.equal(sample.supersedeWrite.ok, true);
  assert.equal(sample.supersedeWrite.result_status, "committed");
  const target = sample.readback.records_by_receipt.find(
    (item) => item.receipt.receipt_id === sample.supersedeTargetWrite.receipt.receipt_id,
  );
  assert.equal(target.receipt.write_status, "superseded");
}

function assertReadbackAndNonTargetTables(sample) {
  assert.equal(
    sample.countsFinal.research_candidate_manual_global_dogfood_canonical_perspective_update_receipts,
    3,
    "rolled-back primary, superseded target, and supersede replacement receipts should exist",
  );
  assert.equal(
    sample.countsFinal.research_candidate_manual_global_dogfood_canonical_perspective_update_records,
    3,
    "one canonical update record per committed/superseded/rolled-back receipt should remain",
  );
  assert.equal(
    sample.countsFinal.research_candidate_manual_global_dogfood_canonical_perspective_update_rollbacks,
    1,
    "rollback metadata should be inserted once",
  );
  for (const table of [
    "dogfood_metric_snapshot_records",
    "dogfooding_records",
    "dogfooding_signals",
    "dogfooding_review_cues",
    "verification_evidence_records",
    "work_items",
    "work_events",
    "perspective_states",
    "perspective_memory_items",
    "delivery_ledger",
  ]) {
    assert.equal(sample.countsFinal[table], 0, `${table} must remain empty`);
  }
  assert.deepEqual(sample.rawTextColumns, []);
  assert.equal(
    sample.readback.storage_path,
    "manual_specific_canonical_perspective_update_tables",
  );
  assert.ok(sample.readback.latest_active_committed);
  assert.equal(sample.readback.canonical_perspective_update_record_written, true);
  assert.equal(sample.readback.current_working_perspective_updated, false);
  assert.equal(sample.readback.canonical_perspective_state_written, false);
  assert.equal(sample.readback.perspective_promoted, false);
  assert.equal(sample.readback.perspective_memory_written, false);
  assert.equal(sample.readback.perspective_relay_mutated, false);
  assert.equal(sample.readback.next_work_bias_mutated, false);
  assert.equal(sample.readback.work_mutated, false);
  assert.equal(sample.readback.dogfood_metrics_written, false);
  assert.equal(sample.readback.global_dogfood_ledger_mutated, false);
  assert.equal(sample.readback.metric_snapshot_mutated, false);
  assert.equal(sample.readback.next_work_signal_decision_mutated, false);
  assert.equal(sample.readback.proof_or_evidence_rows_written, false);
  assert.equal(sample.readback.product_write_executed, false);
}

function assertDocsAndPackage() {
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-manual-global-dogfood-canonical-perspective-update-write-v0-1"
    ],
    "node scripts/smoke-research-candidate-manual-global-dogfood-canonical-perspective-update-write-v0-1.mjs",
  );
  for (const text of [
    "manual global dogfood canonical Perspective update",
    "manual-specific canonical Perspective update table family",
    "duplicate_replayed",
    "no current-working Perspective update",
    "no direct canonical Perspective state mutation",
    "no Perspective promotion",
    "no Perspective Memory",
    "no work mutation",
  ]) {
    assert.ok(source.docs.includes(text), `docs must include ${text}`);
  }
}
