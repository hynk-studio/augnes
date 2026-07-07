#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const files = {
  type:
    "types/research-candidate-manual-global-dogfood-perspective-relay-write.ts",
  writer:
    "lib/research-candidate-review/manual-global-dogfood-perspective-relay-write.ts",
  readback:
    "lib/research-candidate-review/read-manual-global-dogfood-perspective-relay.ts",
  route:
    "app/api/research-candidate-review/manual-global-dogfood-perspective-relay/route.ts",
  rollbackRoute:
    "app/api/research-candidate-review/manual-global-dogfood-perspective-relay/[receipt_id]/rollback/route.ts",
  writePanel:
    "components/research-candidate-manual-global-dogfood-perspective-relay-write-panel.tsx",
  readbackPanel:
    "components/research-candidate-manual-global-dogfood-perspective-relay-readback-panel.tsx",
  contractPanel:
    "components/research-candidate-manual-global-dogfood-perspective-relay-contract-panel.tsx",
  schema: "lib/db/schema.sql",
  db: "lib/db.ts",
  migrations: "scripts/db-migrations.mjs",
  dbMigrate: "scripts/db-migrate.mjs",
  smoke:
    "scripts/smoke-research-candidate-manual-global-dogfood-perspective-relay-write-v0-1.mjs",
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
        "research-candidate-manual-global-dogfood-perspective-relay-write-v0-1",
      pass: true,
      storage_path: "manual_specific_perspective_relay_tables",
      source_next_work_signal_revalidated: true,
      source_next_work_bias_revalidated: true,
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
    "I authorize writing this manual global dogfood signal to a Perspective relay update record",
    "I authorize rolling back this manual global dogfood Perspective relay receipt",
    "manual_operator_authorized_perspective_relay_write",
    "manual_operator_authorized_perspective_relay_rollback",
    "can_write_perspective_relay_record: true",
    "can_write_perspective_relay_receipt: true",
    "can_write_perspective_relay_rollback_metadata: true",
    "can_write_perspective_state: false",
    "can_promote_perspective: false",
    "can_write_perspective_memory: false",
    "can_write_next_work_bias: false",
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
    "research_candidate_manual_global_dogfood_perspective_relay_receipts",
    "research_candidate_manual_global_dogfood_perspective_relay_records",
    "research_candidate_manual_global_dogfood_perspective_relay_rollbacks",
    "source_perspective_relay_contract_fingerprint TEXT NOT NULL",
    "source_perspective_relay_review_fingerprint TEXT NOT NULL",
    "source_next_work_signal_receipt_id TEXT NOT NULL",
    "source_next_work_signal_record_id TEXT NOT NULL",
    "source_next_work_signal_record_fingerprint TEXT NOT NULL",
    "source_next_work_bias_receipt_id TEXT NOT NULL",
    "source_next_work_bias_record_id TEXT NOT NULL",
    "source_next_work_bias_record_fingerprint TEXT NOT NULL",
    "source_projection_fingerprint TEXT NOT NULL",
    "source_global_dogfood_ledger_receipt_id TEXT NOT NULL",
    "source_metric_snapshot_receipt_id TEXT NOT NULL",
    "idempotency_key TEXT NOT NULL UNIQUE",
    "relay_update_label TEXT NOT NULL",
    "relay_update_rationale TEXT NOT NULL",
    "manual_only_context_refs_json TEXT NOT NULL",
  ]) {
    assert.ok(source.schema.includes(requiredText), `schema must include ${requiredText}`);
  }

  assert.ok(
    source.db.includes(
      "migrateResearchCandidateManualGlobalDogfoodPerspectiveRelayTables",
    ),
    "lib/db.ts must migrate manual Perspective relay tables",
  );
  assert.ok(
    source.migrations.includes(
      "migrateResearchCandidateManualGlobalDogfoodPerspectiveRelay",
    ),
    "db-migrations must expose manual Perspective relay migration",
  );
  assert.ok(
    source.dbMigrate.includes(
      "researchCandidateManualGlobalDogfoodPerspectiveRelayResult",
    ),
    "db-migrate must run manual Perspective relay migration",
  );
  assert.match(source.writer, /BEGIN IMMEDIATE/, "writer must use transaction");
  const transactionSlice = source.writer.slice(
    source.writer.indexOf('db.prepare("BEGIN IMMEDIATE").run();'),
    source.writer.indexOf("insertReceipt(db, receipt);"),
  );
  assert.match(
    transactionSlice,
    /validateSourcesForRequest/,
    "writer must revalidate source signal and bias inside the transaction",
  );
  assert.match(
    source.writer,
    /perspective_relay_review_contract_mismatch/,
    "writer must reject contract/review mismatches",
  );
  assert.match(
    source.writer,
    /perspective_relay_review_source_mismatch/,
    "writer must reject review source mismatches",
  );
  const idempotencySlice = source.writer.slice(
    source.writer.indexOf("function computePerspectiveRelayIdempotencyKey"),
    source.writer.indexOf("function validationWithFailures"),
  );
  assert.doesNotMatch(
    idempotencySlice,
    /review_fingerprint|operator_note|warning_reasons/,
    "durable idempotency must exclude local-only review note material",
  );
  assert.doesNotMatch(
    `${source.writer}\n${source.readback}\n${source.route}\n${source.rollbackRoute}`,
    /writePerspectiveState|promotePerspective|writePerspectiveMemory|writeProof|writeEvidence|writeDogfoodMetric|writeResearchCandidateManualGlobalDogfoodMetricSnapshot\s*\(|writeResearchCandidateManualGlobalDogfoodLedger\s*\(|writeResearchCandidateManualGlobalDogfoodNextWorkSignal\s*\(|writeResearchCandidateManualGlobalDogfoodNextWorkBias\s*\(|executeCodex|runCodex|OPENAI_API_KEY|new\s+OpenAI|api\.openai\.com|api\.github\.com|retrieveSources\s*\(|runRetrieval\s*\(|ragIndex\s*\(|embedding\s*\(|vectorStore\s*\(|crawler\s*\(|crawlSources\s*\(/i,
    "manual Perspective relay writer/readback must not invoke forbidden writers or external behavior",
  );
  assert.doesNotMatch(
    `${source.writer}\n${source.readback}\n${source.route}\n${source.rollbackRoute}`,
    /INSERT\s+INTO\s+(dogfood_metric_snapshot_records|dogfooding_records|dogfooding_signals|dogfooding_review_cues|verification_evidence_records|work_items|work_events|perspective_states|perspective_memory_items|delivery_ledger)|UPDATE\s+(dogfood_metric_snapshot_records|dogfooding_records|dogfooding_signals|dogfooding_review_cues|verification_evidence_records|work_items|work_events|perspective_states|perspective_memory_items|delivery_ledger)|DELETE\s+FROM/i,
    "Perspective relay write path must not write non-target tables or delete rows",
  );
  assert.ok(source.route.includes("export async function GET"));
  assert.ok(source.route.includes("export async function POST"));
  assert.ok(source.rollbackRoute.includes("export async function POST"));
  assert.ok(source.route.includes("same_origin_required"));
  assert.ok(source.rollbackRoute.includes("same_origin_required"));
  assert.ok(source.route.includes("work_mutated: false"));
  assert.ok(source.route.includes("perspective_state_written: false"));
  assert.ok(source.rollbackRoute.includes("perspective_memory_written: false"));
  assert.match(
    source.writePanel,
    /\/api\/research-candidate-review\/manual-global-dogfood-perspective-relay/,
    "write panel must call the same-origin manual Perspective relay route",
  );
  assert.match(
    source.writePanel,
    /\/api\/research-candidate-review\/manual-global-dogfood-next-work-bias/,
    "write panel must fetch source next-work bias readback",
  );
  assert.match(
    source.writePanel,
    /source_next_work_bias_readback: sourceBiasReadback/,
    "write panel must submit source next-work bias readback",
  );
  assert.match(
    source.writePanel,
    /Write Perspective relay update record/,
    "write panel must expose explicit authorized Perspective relay write button",
  );
  assert.match(
    source.writePanel,
    /rollbackConfirmationText/,
    "write panel must keep rollback confirmation in local state",
  );
  assert.match(
    source.writePanel,
    /rollbackEnabled[\s\S]*rollbackConfirmationText ===[\s\S]*RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_ROLLBACK_CONFIRMATION/,
    "rollback button must require exact rollback confirmation text",
  );
  assert.match(
    source.writePanel,
    /operator_confirmation_text: rollbackConfirmationText/,
    "rollback request must send typed rollback confirmation text",
  );
  assert.doesNotMatch(
    source.writePanel,
    /<button[^>]*>\s*(Create work item|Promote Perspective|Write Perspective state|Write Perspective Memory|Global metrics update)/i,
    "write panel must not expose work/Perspective-state/memory/metric update controls",
  );
  assert.ok(
    source.contractPanel.includes(
      "ResearchCandidateManualGlobalDogfoodPerspectiveRelayWritePanel",
    ) &&
      source.contractPanel.includes(
        "ready_for_future_perspective_relay_write_slice",
      ),
    "contract panel must gate write panel behind accepted relay review",
  );
}

function buildSample() {
  const code = String.raw`
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { readResearchCandidateManualGlobalDogfoodNextWorkSignal } from "./lib/research-candidate-review/read-manual-global-dogfood-next-work-signal";
import { readResearchCandidateManualGlobalDogfoodNextWorkBias } from "./lib/research-candidate-review/read-manual-global-dogfood-next-work-bias";
import { buildResearchCandidateManualGlobalDogfoodPerspectiveRelayContract } from "./lib/research-candidate-review/manual-global-dogfood-perspective-relay-contract";
import { buildResearchCandidateManualGlobalDogfoodPerspectiveRelayReview } from "./lib/research-candidate-review/manual-global-dogfood-perspective-relay-review";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_WRITE_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_ROLLBACK_CONFIRMATION
} from "./types/research-candidate-manual-global-dogfood-perspective-relay-write";
import {
  writeResearchCandidateManualGlobalDogfoodPerspectiveRelay,
  rollbackResearchCandidateManualGlobalDogfoodPerspectiveRelayReceipt
} from "./lib/research-candidate-review/manual-global-dogfood-perspective-relay-write";
import { readResearchCandidateManualGlobalDogfoodPerspectiveRelay } from "./lib/research-candidate-review/read-manual-global-dogfood-perspective-relay";

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
  "research_candidate_manual_global_dogfood_next_work_signal_receipts",
  "research_candidate_manual_global_dogfood_next_work_signal_records",
  "research_candidate_manual_global_dogfood_next_work_bias_receipts",
  "research_candidate_manual_global_dogfood_next_work_bias_records",
  "research_candidate_manual_global_dogfood_perspective_relay_receipts",
  "research_candidate_manual_global_dogfood_perspective_relay_records",
  "research_candidate_manual_global_dogfood_perspective_relay_rollbacks",
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
function insertSignalSource({ tag }) {
  const createdAt = "2026-07-07T00:00:00.000Z";
  const receipt = {
    receipt_id: "manual-global-dogfood-next-work-signal-receipt:" + tag,
    created_at: createdAt,
    scope: "project:augnes",
    source_next_work_contract_fingerprint: "fnv1a32:signal-contract-" + tag,
    source_next_work_review_fingerprint: "fnv1a32:signal-review-" + tag,
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
    idempotency_key: "signal-idempotency-" + tag,
    write_status: "committed",
    authority_profile: "manual_global_dogfood_next_work_signal_write_authority.v0.1",
    receipt_fingerprint: "fnv1a32:signal-receipt-" + tag,
    supersedes_receipt_id: null,
    rollback_of_receipt_id: null,
    rollback_reason: null
  };
  const record = {
    next_work_signal_record_id: "manual-global-dogfood-next-work-signal-record:" + tag,
    receipt_id: receipt.receipt_id,
    created_at: createdAt,
    scope: receipt.scope,
    source_global_dogfood_ledger_receipt_id: receipt.source_global_dogfood_ledger_receipt_id,
    source_global_dogfood_ledger_record_id: receipt.source_global_dogfood_ledger_record_id,
    source_metric_snapshot_receipt_id: receipt.source_metric_snapshot_receipt_id,
    source_metric_snapshot_record_id: receipt.source_metric_snapshot_record_id,
    source_projection_fingerprint: receipt.source_projection_fingerprint,
    source_next_work_contract_fingerprint: receipt.source_next_work_contract_fingerprint,
    source_next_work_review_fingerprint: receipt.source_next_work_review_fingerprint,
    recommended_next_work_label: "Review manual dogfood follow-up " + tag,
    rationale: "Manual global dogfood source suggests a relay candidate " + tag,
    outcome_label: "helpful",
    outcome_signal: "positive",
    candidate_priority_hint: "high",
    decision_status: "ready_for_future_next_work_signal_write_authorization",
    mismatch_or_gap_summary: "Follow-up gap for " + tag,
    expected_summary: "Expected manual signal " + tag,
    observed_summary: "Observed manual signal " + tag,
    source_line: "Source line " + tag,
    selected_candidate_context_refs_json: JSON.stringify(["context:" + tag]),
    source_next_work_candidate_card_ids_json: JSON.stringify(["card:" + tag]),
    blockers_json: JSON.stringify([]),
    warnings_json: JSON.stringify(["manual-source-warning:" + tag]),
    manual_only_context_refs_json: JSON.stringify(["manual-only:" + tag]),
    source_refs_json: JSON.stringify(["source:" + tag]),
    authority_profile: receipt.authority_profile,
    next_work_signal_record_fingerprint: "fnv1a32:signal-record-" + tag
  };
  db.prepare([
    "INSERT INTO research_candidate_manual_global_dogfood_next_work_signal_receipts (",
    "receipt_id, created_at, scope, source_next_work_contract_fingerprint,",
    "source_next_work_review_fingerprint, source_projection_fingerprint,",
    "source_global_dogfood_ledger_receipt_id, source_global_dogfood_ledger_record_id,",
    "source_metric_snapshot_receipt_id, source_metric_snapshot_record_id,",
    "source_manual_receipt_id, source_handoff_seed_fingerprint,",
    "source_result_text_fingerprint, source_expected_observed_delta_record_ref,",
    "source_reuse_outcome_record_ref, idempotency_key, write_status,",
    "authority_profile, receipt_fingerprint, supersedes_receipt_id,",
    "rollback_of_receipt_id, rollback_reason",
    ") VALUES (",
    "@receipt_id, @created_at, @scope, @source_next_work_contract_fingerprint,",
    "@source_next_work_review_fingerprint, @source_projection_fingerprint,",
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
    "INSERT INTO research_candidate_manual_global_dogfood_next_work_signal_records (",
    "next_work_signal_record_id, receipt_id, created_at, scope,",
    "source_global_dogfood_ledger_receipt_id, source_global_dogfood_ledger_record_id,",
    "source_metric_snapshot_receipt_id, source_metric_snapshot_record_id,",
    "source_projection_fingerprint, source_next_work_contract_fingerprint,",
    "source_next_work_review_fingerprint, recommended_next_work_label,",
    "rationale, outcome_label, outcome_signal, candidate_priority_hint,",
    "decision_status, mismatch_or_gap_summary, expected_summary,",
    "observed_summary, source_line, selected_candidate_context_refs_json,",
    "source_next_work_candidate_card_ids_json, blockers_json, warnings_json,",
    "manual_only_context_refs_json, source_refs_json, authority_profile,",
    "next_work_signal_record_fingerprint",
    ") VALUES (",
    "@next_work_signal_record_id, @receipt_id, @created_at, @scope,",
    "@source_global_dogfood_ledger_receipt_id, @source_global_dogfood_ledger_record_id,",
    "@source_metric_snapshot_receipt_id, @source_metric_snapshot_record_id,",
    "@source_projection_fingerprint, @source_next_work_contract_fingerprint,",
    "@source_next_work_review_fingerprint, @recommended_next_work_label,",
    "@rationale, @outcome_label, @outcome_signal, @candidate_priority_hint,",
    "@decision_status, @mismatch_or_gap_summary, @expected_summary,",
    "@observed_summary, @source_line, @selected_candidate_context_refs_json,",
    "@source_next_work_candidate_card_ids_json, @blockers_json, @warnings_json,",
    "@manual_only_context_refs_json, @source_refs_json, @authority_profile,",
    "@next_work_signal_record_fingerprint",
    ")"
  ].join(" ")).run(record);
  return { receipt, record };
}
function updateSignalStatus(tag, status) {
  db.prepare(
    "UPDATE research_candidate_manual_global_dogfood_next_work_signal_receipts SET write_status = ?, rollback_of_receipt_id = CASE WHEN ? = 'rolled_back' THEN receipt_id ELSE rollback_of_receipt_id END WHERE receipt_id = ?"
  ).run(status, status, "manual-global-dogfood-next-work-signal-receipt:" + tag);
}
function buildRelayContractAndReview(tag) {
  const signalReadback = readResearchCandidateManualGlobalDogfoodNextWorkSignal({
    db,
    receiptId: "manual-global-dogfood-next-work-signal-receipt:" + tag,
    limit: 1
  });
  const contract = buildResearchCandidateManualGlobalDogfoodPerspectiveRelayContract({
    readback: signalReadback,
    operator_intent_label: "manual_perspective_relay_write_smoke"
  });
  const review = buildResearchCandidateManualGlobalDogfoodPerspectiveRelayReview({
    perspective_relay_contract: contract,
    operator_decision: "accept_contract_for_future_perspective_relay_write_slice",
    operator_note: "Local-only note " + tag
  });
  return { signalReadback, contract, review };
}
function insertBiasSourceForContract(tag, contract, status = "committed") {
  const createdAt = "2026-07-07T00:00:01.000Z";
  const mapping = contract.proposed_perspective_relay_mapping;
  const receipt = {
    receipt_id: "manual-global-dogfood-next-work-bias-receipt:" + tag,
    created_at: createdAt,
    scope: contract.scope,
    source_next_work_bias_contract_fingerprint: "fnv1a32:bias-contract-" + tag,
    source_next_work_bias_review_fingerprint: "fnv1a32:bias-review-" + tag,
    source_next_work_signal_receipt_id: contract.source_next_work_signal_receipt_id,
    source_next_work_signal_record_id: contract.source_next_work_signal_record_id,
    source_next_work_signal_record_fingerprint: contract.source_next_work_signal_record_fingerprint,
    source_projection_fingerprint: contract.source_projection_fingerprint,
    source_global_dogfood_ledger_receipt_id: contract.source_global_dogfood_ledger_receipt_id,
    source_global_dogfood_ledger_record_id: contract.source_global_dogfood_ledger_record_id,
    source_metric_snapshot_receipt_id: contract.source_metric_snapshot_receipt_id,
    source_metric_snapshot_record_id: contract.source_metric_snapshot_record_id,
    source_manual_receipt_id: contract.source_manual_receipt_id,
    source_handoff_seed_fingerprint: contract.source_handoff_seed_fingerprint,
    source_result_text_fingerprint: contract.source_result_text_fingerprint,
    source_expected_observed_delta_record_ref: contract.source_expected_observed_delta_record_ref,
    source_reuse_outcome_record_ref: contract.source_reuse_outcome_record_ref,
    idempotency_key: "bias-idempotency-" + tag,
    write_status: status,
    authority_profile: "manual_global_dogfood_next_work_bias_write_authority.v0.1",
    receipt_fingerprint: "fnv1a32:bias-receipt-" + tag,
    supersedes_receipt_id: null,
    rollback_of_receipt_id: status === "rolled_back" ? "manual-global-dogfood-next-work-bias-receipt:" + tag : null,
    rollback_reason: status === "rolled_back" ? "source bias rollback" : null
  };
  const record = {
    next_work_bias_record_id: "manual-global-dogfood-next-work-bias-record:" + tag,
    receipt_id: receipt.receipt_id,
    created_at: createdAt,
    scope: contract.scope,
    source_next_work_signal_receipt_id: contract.source_next_work_signal_receipt_id,
    source_next_work_signal_record_id: contract.source_next_work_signal_record_id,
    source_projection_fingerprint: contract.source_projection_fingerprint,
    source_global_dogfood_ledger_receipt_id: contract.source_global_dogfood_ledger_receipt_id,
    source_global_dogfood_ledger_record_id: contract.source_global_dogfood_ledger_record_id,
    source_metric_snapshot_receipt_id: contract.source_metric_snapshot_receipt_id,
    source_metric_snapshot_record_id: contract.source_metric_snapshot_record_id,
    recommended_next_work_label: mapping.recommended_next_work_label,
    rationale: "Committed source next-work bias for " + tag,
    outcome_label: mapping.outcome_label,
    outcome_signal: mapping.outcome_signal,
    bias_strength_hint: "high",
    selected_candidate_context_refs_json: JSON.stringify(mapping.selected_candidate_context_refs),
    source_next_work_candidate_card_ids_json: JSON.stringify(mapping.source_next_work_candidate_card_ids),
    expected_summary: mapping.expected_summary,
    observed_summary: mapping.observed_summary,
    mismatch_or_gap_summary: mapping.mismatch_or_gap_summary,
    source_line: mapping.source_line,
    blockers_json: JSON.stringify([]),
    warnings_json: JSON.stringify(mapping.warnings),
    manual_only_context_refs_json: JSON.stringify(mapping.manual_only_context_refs),
    source_refs_json: JSON.stringify(["bias-source:" + tag]),
    authority_profile: receipt.authority_profile,
    next_work_bias_record_fingerprint: "fnv1a32:bias-record-" + tag
  };
  db.prepare([
    "INSERT INTO research_candidate_manual_global_dogfood_next_work_bias_receipts (",
    "receipt_id, created_at, scope, source_next_work_bias_contract_fingerprint,",
    "source_next_work_bias_review_fingerprint, source_next_work_signal_receipt_id,",
    "source_next_work_signal_record_id, source_next_work_signal_record_fingerprint,",
    "source_projection_fingerprint, source_global_dogfood_ledger_receipt_id,",
    "source_global_dogfood_ledger_record_id, source_metric_snapshot_receipt_id,",
    "source_metric_snapshot_record_id, source_manual_receipt_id,",
    "source_handoff_seed_fingerprint, source_result_text_fingerprint,",
    "source_expected_observed_delta_record_ref, source_reuse_outcome_record_ref,",
    "idempotency_key, write_status, authority_profile, receipt_fingerprint,",
    "supersedes_receipt_id, rollback_of_receipt_id, rollback_reason",
    ") VALUES (",
    "@receipt_id, @created_at, @scope, @source_next_work_bias_contract_fingerprint,",
    "@source_next_work_bias_review_fingerprint, @source_next_work_signal_receipt_id,",
    "@source_next_work_signal_record_id, @source_next_work_signal_record_fingerprint,",
    "@source_projection_fingerprint, @source_global_dogfood_ledger_receipt_id,",
    "@source_global_dogfood_ledger_record_id, @source_metric_snapshot_receipt_id,",
    "@source_metric_snapshot_record_id, @source_manual_receipt_id,",
    "@source_handoff_seed_fingerprint, @source_result_text_fingerprint,",
    "@source_expected_observed_delta_record_ref, @source_reuse_outcome_record_ref,",
    "@idempotency_key, @write_status, @authority_profile, @receipt_fingerprint,",
    "@supersedes_receipt_id, @rollback_of_receipt_id, @rollback_reason",
    ")"
  ].join(" ")).run(receipt);
  db.prepare([
    "INSERT INTO research_candidate_manual_global_dogfood_next_work_bias_records (",
    "next_work_bias_record_id, receipt_id, created_at, scope,",
    "source_next_work_signal_receipt_id, source_next_work_signal_record_id,",
    "source_projection_fingerprint, source_global_dogfood_ledger_receipt_id,",
    "source_global_dogfood_ledger_record_id, source_metric_snapshot_receipt_id,",
    "source_metric_snapshot_record_id, recommended_next_work_label, rationale,",
    "outcome_label, outcome_signal, bias_strength_hint,",
    "selected_candidate_context_refs_json, source_next_work_candidate_card_ids_json,",
    "expected_summary, observed_summary, mismatch_or_gap_summary, source_line,",
    "blockers_json, warnings_json, manual_only_context_refs_json, source_refs_json,",
    "authority_profile, next_work_bias_record_fingerprint",
    ") VALUES (",
    "@next_work_bias_record_id, @receipt_id, @created_at, @scope,",
    "@source_next_work_signal_receipt_id, @source_next_work_signal_record_id,",
    "@source_projection_fingerprint, @source_global_dogfood_ledger_receipt_id,",
    "@source_global_dogfood_ledger_record_id, @source_metric_snapshot_receipt_id,",
    "@source_metric_snapshot_record_id, @recommended_next_work_label, @rationale,",
    "@outcome_label, @outcome_signal, @bias_strength_hint,",
    "@selected_candidate_context_refs_json, @source_next_work_candidate_card_ids_json,",
    "@expected_summary, @observed_summary, @mismatch_or_gap_summary, @source_line,",
    "@blockers_json, @warnings_json, @manual_only_context_refs_json, @source_refs_json,",
    "@authority_profile, @next_work_bias_record_fingerprint",
    ")"
  ].join(" ")).run(record);
  return { receipt, record };
}
function updateBiasStatus(tag, status) {
  db.prepare(
    "UPDATE research_candidate_manual_global_dogfood_next_work_bias_receipts SET write_status = ?, rollback_of_receipt_id = CASE WHEN ? = 'rolled_back' THEN receipt_id ELSE rollback_of_receipt_id END WHERE receipt_id = ?"
  ).run(status, status, "manual-global-dogfood-next-work-bias-receipt:" + tag);
}
function sourceBiasReadback(tag) {
  return readResearchCandidateManualGlobalDogfoodNextWorkBias({
    db,
    receiptId: "manual-global-dogfood-next-work-bias-receipt:" + tag,
    limit: 1
  });
}
function request(contract, review, sourceBias, overrides = {}) {
  const { operator_authorization: operatorOverrides = {}, ...topLevelOverrides } = overrides;
  return {
    perspective_relay_contract: contract,
    perspective_relay_review: review,
    source_next_work_bias_readback: sourceBias,
    operator_authorization: {
      authorization_kind: "manual_operator_authorized_perspective_relay_write",
      operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_WRITE_CONFIRMATION,
      write_mode: "commit",
      ...operatorOverrides
    },
    ...topLevelOverrides
  };
}
function write(contract, review, sourceBias, overrides = {}) {
  return writeResearchCandidateManualGlobalDogfoodPerspectiveRelay(
    request(contract, review, sourceBias, overrides),
    { db }
  );
}
function readySource(tag) {
  insertSignalSource({ tag });
  const source = buildRelayContractAndReview(tag);
  assert.equal(source.contract.operator_authorization_mode, "ready_for_future_perspective_relay_write_authorization");
  insertBiasSourceForContract(tag, source.contract);
  return { ...source, biasReadback: sourceBiasReadback(tag) };
}

const countsInitial = readCounts();
const primary = readySource("primary");
const wrongConfirmation = write(primary.contract, primary.review, primary.biasReadback, {
  operator_authorization: { operator_confirmation_text: "wrong confirmation" }
});
const revisionReview = buildResearchCandidateManualGlobalDogfoodPerspectiveRelayReview({
  perspective_relay_contract: primary.contract,
  operator_decision: "needs_perspective_relay_mapping_revision"
});
const rejectReview = buildResearchCandidateManualGlobalDogfoodPerspectiveRelayReview({
  perspective_relay_contract: primary.contract,
  operator_decision: "reject_perspective_relay_contract"
});
const deferReview = buildResearchCandidateManualGlobalDogfoodPerspectiveRelayReview({
  perspective_relay_contract: primary.contract,
  operator_decision: "defer_perspective_relay_contract"
});
const nonAcceptedRevision = write(primary.contract, revisionReview, primary.biasReadback);
const nonAcceptedReject = write(primary.contract, rejectReview, primary.biasReadback);
const nonAcceptedDefer = write(primary.contract, deferReview, primary.biasReadback);
const mismatch = readySource("mismatch");
const countsBeforeMismatchedReview = readCounts();
const mismatchedReviewWrite = write(primary.contract, mismatch.review, primary.biasReadback);
const countsAfterMismatchedReview = readCounts();
const mutatedSignalReadbackWrite = write(primary.contract, primary.review, primary.biasReadback, {
  source_next_work_signal_readback: {
    ...clone(primary.signalReadback),
    metric_snapshot_mutated: true
  }
});
const mutatedBiasReadbackWrite = write(primary.contract, primary.review, {
  ...clone(primary.biasReadback),
  perspective_relay_written: true
});
const rawTextWrite = write(primary.contract, primary.review, primary.biasReadback, {
  raw_result_report_text: "raw result text must not persist"
});
const operatorNoteWrite = write(primary.contract, primary.review, primary.biasReadback, {
  operator_note: "operator note must not persist"
});
const sideEffectWrite = write(primary.contract, primary.review, primary.biasReadback, {
  requested_side_effects: {
    perspective_state_written: true,
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
const wrongAuthorityReview = buildResearchCandidateManualGlobalDogfoodPerspectiveRelayReview({
  perspective_relay_contract: wrongAuthorityContract,
  operator_decision: "accept_contract_for_future_perspective_relay_write_slice"
});
const wrongAuthorityWrite = write(wrongAuthorityContract, wrongAuthorityReview, primary.biasReadback);
const committed = write(primary.contract, primary.review, primary.biasReadback);
const duplicate = write(primary.contract, primary.review, primary.biasReadback);
const reviewWithNote = buildResearchCandidateManualGlobalDogfoodPerspectiveRelayReview({
  perspective_relay_contract: primary.contract,
  operator_decision: "accept_contract_for_future_perspective_relay_write_slice",
  operator_note: "A different local-only note"
});
const duplicateWithLocalNoteReview = write(primary.contract, reviewWithNote, primary.biasReadback);
const wrongRollback = rollbackResearchCandidateManualGlobalDogfoodPerspectiveRelayReceipt({
  receipt_id: committed.receipt.receipt_id,
  rollback_authorization: {
    authorization_kind: "manual_operator_authorized_perspective_relay_rollback",
    operator_confirmation_text: "wrong rollback confirmation",
    rollback_reason: "wrong confirmation"
  }
}, { db });
const rollback = rollbackResearchCandidateManualGlobalDogfoodPerspectiveRelayReceipt({
  receipt_id: committed.receipt.receipt_id,
  rollback_authorization: {
    authorization_kind: "manual_operator_authorized_perspective_relay_rollback",
    operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_ROLLBACK_CONFIRMATION,
    rollback_reason: "operator rollback"
  }
}, { db });
const duplicateRollback = rollbackResearchCandidateManualGlobalDogfoodPerspectiveRelayReceipt({
  receipt_id: committed.receipt.receipt_id,
  rollback_authorization: {
    authorization_kind: "manual_operator_authorized_perspective_relay_rollback",
    operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_ROLLBACK_CONFIRMATION,
    rollback_reason: "operator rollback again"
  }
}, { db });
const staleSignal = readySource("stale-signal");
updateSignalStatus("stale-signal", "rolled_back");
const staleSignalWrite = write(staleSignal.contract, staleSignal.review, staleSignal.biasReadback);
const staleBias = readySource("stale-bias");
updateBiasStatus("stale-bias", "rolled_back");
const staleBiasWrite = write(staleBias.contract, staleBias.review, staleBias.biasReadback);
const supersededBias = readySource("superseded-bias");
updateBiasStatus("superseded-bias", "superseded");
const supersededBiasWrite = write(supersededBias.contract, supersededBias.review, supersededBias.biasReadback);
const supersedeTarget = readySource("supersede-target");
const supersedeTargetWrite = write(supersedeTarget.contract, supersedeTarget.review, supersedeTarget.biasReadback);
const supersedeReplacement = readySource("supersede-replacement");
const supersedeWrite = write(supersedeReplacement.contract, supersedeReplacement.review, supersedeReplacement.biasReadback, {
  operator_authorization: {
    write_mode: "supersede_previous",
    supersedes_receipt_id: supersedeTargetWrite.receipt.receipt_id
  }
});
const supersedeRolledBack = write(supersedeReplacement.contract, supersedeReplacement.review, supersedeReplacement.biasReadback, {
  operator_authorization: {
    write_mode: "supersede_previous",
    supersedes_receipt_id: committed.receipt.receipt_id
  }
});
const readback = readResearchCandidateManualGlobalDogfoodPerspectiveRelay({ db, limit: 50 });
const countsFinal = readCounts();
const rawTextColumns = db.prepare("SELECT name FROM pragma_table_info('research_candidate_manual_global_dogfood_perspective_relay_records') WHERE name LIKE '%raw%' OR name LIKE '%note%'").all();

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
  mutatedSignalReadbackWrite,
  mutatedBiasReadbackWrite,
  rawTextWrite,
  operatorNoteWrite,
  sideEffectWrite,
  wrongAuthorityWrite,
  committed,
  duplicate,
  duplicateWithLocalNoteReview,
  wrongRollback,
  rollback,
  duplicateRollback,
  staleSignalWrite,
  staleBiasWrite,
  supersededBiasWrite,
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
    mutatedSignalReadbackWrite: sample.mutatedSignalReadbackWrite,
    mutatedBiasReadbackWrite: sample.mutatedBiasReadbackWrite,
    rawTextWrite: sample.rawTextWrite,
    operatorNoteWrite: sample.operatorNoteWrite,
    sideEffectWrite: sample.sideEffectWrite,
    wrongAuthorityWrite: sample.wrongAuthorityWrite,
    staleSignalWrite: sample.staleSignalWrite,
    staleBiasWrite: sample.staleBiasWrite,
    supersededBiasWrite: sample.supersededBiasWrite,
    supersedeRolledBack: sample.supersedeRolledBack,
  })) {
    assert.equal(result.ok, false, `${label} must be refused`);
    assert.equal(result.result_status, "refused", `${label} must be refused`);
  }
  assert.ok(
    sample.wrongConfirmation.refusal_reasons.includes("perspective_relay_wrong_confirmation"),
  );
  assert.ok(
    sample.mismatchedReviewWrite.refusal_reasons.includes(
      "perspective_relay_review_contract_mismatch",
    ) ||
      sample.mismatchedReviewWrite.refusal_reasons.includes(
        "perspective_relay_review_source_mismatch",
      ),
  );
  assert.ok(
    sample.mutatedSignalReadbackWrite.refusal_reasons.includes(
      "perspective_relay_source_readback_forbidden_mutation_flag",
    ),
  );
  assert.ok(
    sample.mutatedBiasReadbackWrite.refusal_reasons.includes(
      "perspective_relay_source_readback_forbidden_mutation_flag",
    ),
  );
  assert.ok(
    sample.staleSignalWrite.refusal_reasons.includes(
      "perspective_relay_source_signal_receipt_not_active_committed",
    ),
  );
  assert.ok(
    sample.staleBiasWrite.refusal_reasons.includes(
      "perspective_relay_source_bias_receipt_not_active_committed",
    ),
  );
  assert.ok(
    sample.supersededBiasWrite.refusal_reasons.includes(
      "perspective_relay_source_bias_receipt_not_active_committed",
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
  assert.ok(sample.committed.perspective_relay_record.perspective_relay_record_id);
  assert.equal(
    sample.committed.receipt.source_next_work_bias_receipt_id,
    sample.primary.biasReadback.latest_active_committed.receipt.receipt_id,
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
    sample.countsFinal.research_candidate_manual_global_dogfood_perspective_relay_receipts,
    3,
    "rolled-back primary, superseded target, and supersede replacement receipts should exist",
  );
  assert.equal(
    sample.countsFinal.research_candidate_manual_global_dogfood_perspective_relay_records,
    3,
    "one relay record per committed/superseded/rolled-back receipt should remain",
  );
  assert.equal(
    sample.countsFinal.research_candidate_manual_global_dogfood_perspective_relay_rollbacks,
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
  assert.equal(sample.readback.storage_path, "manual_specific_perspective_relay_tables");
  assert.ok(sample.readback.latest_active_committed);
  assert.equal(sample.readback.perspective_relay_written, true);
  assert.equal(sample.readback.work_mutated, false);
  assert.equal(sample.readback.perspective_state_written, false);
  assert.equal(sample.readback.perspective_promoted, false);
  assert.equal(sample.readback.perspective_memory_written, false);
  assert.equal(sample.readback.next_work_bias_mutated, false);
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
      "smoke:research-candidate-manual-global-dogfood-perspective-relay-write-v0-1"
    ],
    "node scripts/smoke-research-candidate-manual-global-dogfood-perspective-relay-write-v0-1.mjs",
  );
  for (const text of [
    "manual global dogfood Perspective relay",
    "manual-specific Perspective relay tables",
    "duplicate_replayed",
    "no canonical Perspective state write",
    "no Perspective promotion",
    "no Perspective Memory",
    "no work mutation",
  ]) {
    assert.ok(source.docs.includes(text), `docs must include ${text}`);
  }
}
