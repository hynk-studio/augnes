#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const files = {
  type:
    "types/research-candidate-manual-global-dogfood-next-work-signal-write.ts",
  writer:
    "lib/research-candidate-review/manual-global-dogfood-next-work-signal-write.ts",
  readback:
    "lib/research-candidate-review/read-manual-global-dogfood-next-work-signal.ts",
  route:
    "app/api/research-candidate-review/manual-global-dogfood-next-work-signal/route.ts",
  rollbackRoute:
    "app/api/research-candidate-review/manual-global-dogfood-next-work-signal/[receipt_id]/rollback/route.ts",
  writePanel:
    "components/research-candidate-manual-global-dogfood-next-work-signal-write-panel.tsx",
  readbackPanel:
    "components/research-candidate-manual-global-dogfood-next-work-signal-readback-panel.tsx",
  contractPanel:
    "components/research-candidate-manual-global-dogfood-next-work-signal-contract-panel.tsx",
  schema: "lib/db/schema.sql",
  db: "lib/db.ts",
  migrations: "scripts/db-migrations.mjs",
  dbMigrate: "scripts/db-migrate.mjs",
  smoke:
    "scripts/smoke-research-candidate-manual-global-dogfood-next-work-signal-write-v0-1.mjs",
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
        "research-candidate-manual-global-dogfood-next-work-signal-write-v0-1",
      pass: true,
      storage_path: "manual_specific_next_work_signal_tables",
      source_metric_snapshot_required: true,
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
    "I authorize writing this manual global dogfood projection to a next-work signal decision record",
    "I authorize rolling back this manual global dogfood next-work signal receipt",
    "manual_operator_authorized_next_work_signal_decision_write",
    "manual_operator_authorized_next_work_signal_decision_rollback",
    "can_write_next_work_signal_decision_record: true",
    "can_write_next_work_signal_decision_receipt: true",
    "can_write_next_work_signal_rollback_metadata: true",
    "can_write_next_work_bias: false",
    "can_write_work_item: false",
    "can_mutate_work: false",
    "can_write_perspective_state: false",
    "can_write_perspective_memory: false",
    "can_write_dogfood_metrics: false",
    "can_write_global_dogfood_ledger: false",
    "can_write_metric_snapshot: false",
    "can_mutate_metric_snapshot: false",
    "can_write_proof_or_evidence: false",
    "can_execute_codex: false",
    "can_call_github: false",
    "can_call_providers_or_openai: false",
    "can_fetch_sources: false",
    "can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false",
    "persists_raw_manual_note_text: false",
    "persists_raw_result_report_text: false",
    "persists_operator_notes: false",
  ]) {
    assert.ok(source.type.includes(requiredText), `type must include ${requiredText}`);
  }

  for (const requiredText of [
    "research_candidate_manual_global_dogfood_next_work_signal_receipts",
    "research_candidate_manual_global_dogfood_next_work_signal_records",
    "research_candidate_manual_global_dogfood_next_work_signal_rollbacks",
    "source_next_work_contract_fingerprint TEXT NOT NULL",
    "source_next_work_review_fingerprint TEXT NOT NULL",
    "source_projection_fingerprint TEXT NOT NULL",
    "source_global_dogfood_ledger_receipt_id TEXT NOT NULL",
    "source_global_dogfood_ledger_record_id TEXT NOT NULL",
    "source_metric_snapshot_receipt_id TEXT NOT NULL",
    "source_metric_snapshot_record_id TEXT NOT NULL",
    "source_manual_receipt_id TEXT NOT NULL",
    "source_handoff_seed_fingerprint TEXT NOT NULL",
    "source_result_text_fingerprint TEXT NOT NULL",
    "source_expected_observed_delta_record_ref TEXT NOT NULL",
    "source_reuse_outcome_record_ref TEXT NOT NULL",
    "idempotency_key TEXT NOT NULL UNIQUE",
    "write_status TEXT NOT NULL CHECK",
    "recommended_next_work_label TEXT NOT NULL",
    "source_next_work_candidate_card_ids_json TEXT NOT NULL",
    "manual_only_context_refs_json TEXT NOT NULL",
  ]) {
    assert.ok(source.schema.includes(requiredText), `schema must include ${requiredText}`);
  }

  assert.ok(
    source.db.includes(
      "migrateResearchCandidateManualGlobalDogfoodNextWorkSignalTables",
    ),
    "lib/db.ts must migrate manual next-work signal tables",
  );
  assert.ok(
    source.migrations.includes(
      "migrateResearchCandidateManualGlobalDogfoodNextWorkSignal",
    ),
    "db-migrations must expose manual next-work signal migration",
  );
  assert.ok(
    source.dbMigrate.includes(
      "researchCandidateManualGlobalDogfoodNextWorkSignalResult",
    ),
    "db-migrate must run manual next-work signal migration",
  );
  assert.match(source.writer, /BEGIN IMMEDIATE/, "writer must use transaction");
  const transactionSlice = source.writer.slice(
    source.writer.indexOf('db.prepare("BEGIN IMMEDIATE").run();'),
    source.writer.indexOf("insertReceipt(db, receipt);"),
  );
  assert.match(
    transactionSlice,
    /readResearchCandidateManualGlobalDogfoodLedgerByReceiptId/,
    "writer must re-read source ledger receipt inside the transaction",
  );
  assert.match(
    transactionSlice,
    /readResearchCandidateManualGlobalDogfoodMetricSnapshotByReceiptId/,
    "writer must re-read source metric snapshot receipt inside the transaction",
  );
  assert.match(
    transactionSlice,
    /validateSourceManualGlobalDogfoodLedger/,
    "writer must revalidate source ledger receipt inside the transaction",
  );
  assert.match(
    transactionSlice,
    /validateSourceManualGlobalDogfoodMetricSnapshot/,
    "writer must revalidate source metric snapshot receipt inside the transaction",
  );
  assert.match(
    source.writer,
    /source_global_dogfood_ledger_receipt_not_active_committed/,
    "writer must reject stale source ledger receipts",
  );
  assert.match(
    source.writer,
    /source_metric_snapshot_receipt_not_active_committed/,
    "writer must reject stale source metric snapshot receipts",
  );
  assert.match(
    source.writer,
    /next_work_signal_review_contract_mismatch/,
    "writer must reject accepted reviews from a different next-work contract",
  );
  assert.match(
    source.writer,
    /next_work_signal_review_source_mismatch/,
    "writer must reject accepted reviews with mismatched source summaries",
  );
  for (const shapeFailureCode of [
    "next_work_signal_contract_shape_invalid",
    "next_work_signal_contract_validation_shape_invalid",
    "next_work_signal_review_shape_invalid",
    "next_work_signal_review_validation_shape_invalid",
    "next_work_signal_operator_authorization_shape_invalid",
    "next_work_signal_mapping_shape_invalid",
  ]) {
    assert.ok(
      source.writer.includes(shapeFailureCode),
      `writer must include ${shapeFailureCode}`,
    );
  }
  const idempotencySlice = source.writer.slice(
    source.writer.indexOf("function computeNextWorkSignalIdempotencyKey"),
    source.writer.indexOf("function validationWithFailures"),
  );
  assert.doesNotMatch(
    idempotencySlice,
    /review_fingerprint|operator_note|warning_reasons/,
    "durable idempotency must exclude local-only review note fingerprint material",
  );
  assert.doesNotMatch(
    `${source.writer}\n${source.readback}`,
    /writeNextWorkBias|nextWorkBiasWrite|writePerspective|promotePerspective|writeProof|writeEvidence|writeDogfoodMetric|writeResearchCandidateManualGlobalDogfoodMetricSnapshot\s*\(|writeResearchCandidateManualGlobalDogfoodLedger\s*\(|executeCodex|runCodex|OPENAI_API_KEY|new\s+OpenAI|api\.openai\.com|api\.github\.com|retrieveSources\s*\(|runRetrieval\s*\(|ragIndex\s*\(|embedding\s*\(|vectorStore\s*\(|crawler\s*\(|crawlSources\s*\(/i,
    "manual next-work signal writer/readback must not invoke forbidden writers or external behavior",
  );
  assert.doesNotMatch(
    `${source.writer}\n${source.readback}\n${source.route}\n${source.rollbackRoute}`,
    /INSERT\s+INTO\s+(dogfood_metric_snapshot_records|dogfooding_records|dogfooding_signals|dogfooding_review_cues|verification_evidence_records|work_items|work_events|perspective_states|perspective_memory_items|delivery_ledger)|UPDATE\s+(dogfood_metric_snapshot_records|dogfooding_records|dogfooding_signals|dogfooding_review_cues|verification_evidence_records|work_items|work_events|perspective_states|perspective_memory_items|delivery_ledger)|DELETE\s+FROM/i,
    "next-work signal write path must not write non-target tables or delete rows",
  );
  assert.ok(source.route.includes("export async function GET"));
  assert.ok(source.route.includes("export async function POST"));
  assert.ok(source.rollbackRoute.includes("export async function POST"));
  assert.ok(source.route.includes("same_origin_required"));
  assert.ok(source.rollbackRoute.includes("same_origin_required"));
  assert.ok(source.route.includes("next_work_bias_written: false"));
  assert.ok(source.rollbackRoute.includes("dogfood_metrics_written: false"));
  assert.match(
    source.writePanel,
    /\/api\/research-candidate-review\/manual-global-dogfood-next-work-signal/,
    "write panel must call the same-origin manual next-work signal route",
  );
  assert.match(
    source.writePanel,
    /\/api\/research-candidate-review\/manual-global-dogfood-metric-snapshot/,
    "write panel must read same-origin metric snapshot source readback",
  );
  assert.doesNotMatch(
    source.writePanel,
    /api\.openai\.com|github\.com|localStorage|sessionStorage|navigator\.clipboard/i,
    "write panel must not call external routes/storage/clipboard",
  );
  assert.match(
    source.writePanel,
    /Write next-work signal decision record/,
    "write panel must expose explicit authorized next-work signal write button",
  );
  assert.match(
    source.writePanel,
    /rollbackConfirmationText/,
    "write panel must keep rollback confirmation in local state",
  );
  assert.match(
    source.writePanel,
    /rollbackEnabled[\s\S]*rollbackConfirmationText ===[\s\S]*RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_ROLLBACK_CONFIRMATION/,
    "rollback button must require exact rollback confirmation text",
  );
  assert.match(
    source.writePanel,
    /operator_confirmation_text: rollbackConfirmationText/,
    "rollback request must send typed rollback confirmation text",
  );
  assert.match(
    source.writePanel,
    /Exact rollback authorization text/,
    "write panel must render exact rollback authorization text input",
  );
  assert.doesNotMatch(
    source.writePanel,
    /create work item|promote perspective|global metrics update/i,
    "write panel must not expose work/Perspective/metric update controls",
  );
  assert.ok(
    source.contractPanel.includes(
      "ResearchCandidateManualGlobalDogfoodNextWorkSignalWritePanel",
    ) &&
      source.contractPanel.includes(
        "ready_for_future_next_work_signal_write_slice",
      ),
    "contract panel must gate write panel behind accepted next-work review",
  );
}

function buildSample() {
  const code = `
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { parseManualResearchNoteToPreview } from "./lib/research-candidate-review/manual-note-parser";
import { buildResearchCandidateManualNoteHandoffSeed } from "./lib/research-candidate-review/manual-note-handoff-seed";
import { buildResearchCandidateManualNoteHandoffResultIntake } from "./lib/research-candidate-review/manual-note-handoff-result-intake";
import { buildResearchCandidateManualNoteResultIntakeOperatorReview } from "./lib/research-candidate-review/manual-note-result-intake-operator-review";
import { buildResearchCandidateManualNoteResultRecordContractPreview } from "./lib/research-candidate-review/manual-note-result-record-contract-preview";
import { RESEARCH_CANDIDATE_MANUAL_RESULT_AUTHORIZED_WRITE_CONFIRMATION } from "./types/research-candidate-manual-result-authorized-record-write";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_WRITE_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_ROLLBACK_CONFIRMATION
} from "./types/research-candidate-manual-global-dogfood-ledger-write";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_WRITE_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_ROLLBACK_CONFIRMATION
} from "./types/research-candidate-manual-global-dogfood-metric-snapshot-write";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_WRITE_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_ROLLBACK_CONFIRMATION
} from "./types/research-candidate-manual-global-dogfood-next-work-signal-write";
import { writeResearchCandidateManualResultAuthorizedRecords } from "./lib/research-candidate-review/manual-result-authorized-record-write";
import { readResearchCandidateManualResultRecords } from "./lib/research-candidate-review/read-manual-result-records";
import { buildResearchCandidateManualResultDogfoodBridgePreview } from "./lib/research-candidate-review/manual-result-dogfood-bridge-preview";
import { buildResearchCandidateManualResultDogfoodLedgerAuthorizationContract } from "./lib/research-candidate-review/manual-result-dogfood-ledger-authorization-contract";
import { buildResearchCandidateManualResultDogfoodLedgerAuthorizationReview } from "./lib/research-candidate-review/manual-result-dogfood-ledger-authorization-review";
import {
  writeResearchCandidateManualGlobalDogfoodLedger,
  rollbackResearchCandidateManualGlobalDogfoodLedgerReceipt
} from "./lib/research-candidate-review/manual-global-dogfood-ledger-write";
import { readResearchCandidateManualGlobalDogfoodLedger } from "./lib/research-candidate-review/read-manual-global-dogfood-ledger";
import { buildResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjection } from "./lib/research-candidate-review/manual-global-dogfood-ledger-workbench-projection";
import { buildResearchCandidateManualGlobalDogfoodMetricSnapshotContract } from "./lib/research-candidate-review/manual-global-dogfood-metric-snapshot-contract";
import { buildResearchCandidateManualGlobalDogfoodMetricSnapshotReview } from "./lib/research-candidate-review/manual-global-dogfood-metric-snapshot-review";
import {
  writeResearchCandidateManualGlobalDogfoodMetricSnapshot,
  rollbackResearchCandidateManualGlobalDogfoodMetricSnapshotReceipt
} from "./lib/research-candidate-review/manual-global-dogfood-metric-snapshot-write";
import { readResearchCandidateManualGlobalDogfoodMetricSnapshot } from "./lib/research-candidate-review/read-manual-global-dogfood-metric-snapshot";
import { buildResearchCandidateManualGlobalDogfoodNextWorkSignalContract } from "./lib/research-candidate-review/manual-global-dogfood-next-work-signal-contract";
import { buildResearchCandidateManualGlobalDogfoodNextWorkSignalReview } from "./lib/research-candidate-review/manual-global-dogfood-next-work-signal-review";
import {
  writeResearchCandidateManualGlobalDogfoodNextWorkSignal,
  rollbackResearchCandidateManualGlobalDogfoodNextWorkSignalReceipt
} from "./lib/research-candidate-review/manual-global-dogfood-next-work-signal-write";
import { readResearchCandidateManualGlobalDogfoodNextWorkSignal } from "./lib/research-candidate-review/read-manual-global-dogfood-next-work-signal";

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
  "research_candidate_manual_result_write_receipts",
  "research_candidate_manual_expected_observed_delta_records",
  "research_candidate_manual_reuse_outcome_records",
  "research_candidate_manual_result_write_rollbacks",
  "research_candidate_manual_global_dogfood_ledger_receipts",
  "research_candidate_manual_global_dogfood_ledger_records",
  "research_candidate_manual_global_dogfood_ledger_rollbacks",
  "research_candidate_manual_global_dogfood_metric_snapshot_receipts",
  "research_candidate_manual_global_dogfood_metric_snapshot_records",
  "research_candidate_manual_global_dogfood_metric_snapshot_rollbacks",
  "research_candidate_manual_global_dogfood_next_work_signal_receipts",
  "research_candidate_manual_global_dogfood_next_work_signal_records",
  "research_candidate_manual_global_dogfood_next_work_signal_rollbacks",
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
  "perspective_memory_product_persistence_boundary_records",
  "perspective_memory_items",
  "delivery_ledger"
];
function readCounts() {
  return Object.fromEntries(countTables.map((table) => [table, count(table)]));
}
function readNextWorkBiasCounts() {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND (name LIKE '%next_work%' OR name LIKE '%bias%') ORDER BY name").all();
  return Object.fromEntries(tables.map((row) => [row.name, count(row.name)]));
}
function columns(table) {
  return tableExists(table) ? db.prepare("PRAGMA table_info(" + table + ")").all().map((row) => row.name) : [];
}

const note = [
  "Research Question: Can accepted manual next-work signal contracts write a scoped decision record?",
  "Operator Intent: Write only an explicitly authorized manual dogfood next-work signal decision receipt and record.",
  "Source Title: Manual dogfood next-work signal write note",
  "Source Origin: local operator note",
  "Source Identifier: local-manual-dogfood-next-work-signal-write-001",
  "Claim: Accepted manual next-work contracts can write scoped decision metadata.",
  "Evidence: supports: The manual metric snapshot record preserves source refs and fingerprints.",
  "Tension: The next-work signal write is not next-work bias, work mutation, or Perspective promotion.",
  "Gap: Need idempotent next-work signal decision write and rollback metadata. next: write adapter",
  "Perspective Delta: Keep next-work bias and Perspective writes separately authorized.",
  "Next: Implement manual next-work signal decision write. files: lib/research-candidate-review/manual-global-dogfood-next-work-signal-write.ts checks: npm run smoke:research-candidate-manual-global-dogfood-next-work-signal-write-v0-1"
].join("\\n");

const parserResult = parseManualResearchNoteToPreview(note);
const seed = buildResearchCandidateManualNoteHandoffSeed({
  preview: parserResult.preview,
  warnings: parserResult.warnings,
  source_metadata: {
    result_source: "local_parse",
    parser_version: parserResult.parser_version,
    input_fingerprint: "fnv1a32:manual-global-dogfood-next-work-signal-write",
    persisted_preview_draft: false
  },
  target_label: "Manual global dogfood next-work signal write smoke sample"
});

function makeReport({ outcome, suffix }) {
  return [
    "# Summary",
    "result_status: complete",
    "pr_url: https://github.com/hynk-studio/augnes/pull/1009",
    "pr_number: 1009",
    "live_host_observation: /research-candidate-review showed the manual next-work signal write panel.",
    "proof_evidence_rows_written: false",
    "event_rows_created_or_mutated: false",
    "work_status_changed: false",
    "state_committed_or_rejected: false",
    "observed_outcome: " + suffix,
    "",
    "## Files changed",
    "- lib/research-candidate-review/manual-global-dogfood-next-work-signal-write.ts",
    "",
    "## Verification",
    "- npm run typecheck passed",
    "- npm run smoke:research-candidate-manual-global-dogfood-next-work-signal-write-v0-1 passed",
    "",
    "## Skipped checks",
    "- No skipped checks.",
    "",
    "## Remaining caveats",
    "- Next-work bias writes remain out of scope.",
    "",
    "selected candidate context outcome: " + outcome,
    "expected vs observed delta summary: Accepted manual next-work contracts can write scoped next-work signal decision metadata.",
    "",
    "## Authority boundary statement",
    "Authorized next-work signal decision write only; no next-work bias, no work mutation, no global dogfood metrics, no proof/evidence rows, no Perspective promotion, no memory writes, no raw text persistence, no provider calls, no GitHub automation, no source fetching, no retrieval, and no Codex execution."
  ].join("\\n");
}

function makeFlow(report) {
  const intake = buildResearchCandidateManualNoteHandoffResultIntake({
    handoff_seed: seed,
    codex_result_report_text: report,
    source_metadata: { result_source: "sample_smoke" }
  });
  const review = buildResearchCandidateManualNoteResultIntakeOperatorReview({
    result_intake: intake,
    operator_decision: "prepare_record_contract_preview",
    operator_notes: "Local setup note that must not be stored by next-work signal write."
  });
  const contract = buildResearchCandidateManualNoteResultRecordContractPreview({
    result_intake: intake,
    operator_review: review
  });
  return { intake, review, contract };
}
function manualWriteRequest(flow) {
  return {
    result_intake: flow.intake,
    operator_review: flow.review,
    record_contract_preview: flow.contract,
    operator_authorization: {
      authorization_kind: "manual_operator_authorized_record_write",
      operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_RESULT_AUTHORIZED_WRITE_CONFIRMATION,
      write_mode: "commit"
    }
  };
}
function createManualSource({ outcome, suffix }) {
  const flow = makeFlow(makeReport({ outcome, suffix }));
  const write = writeResearchCandidateManualResultAuthorizedRecords(
    manualWriteRequest(flow),
    { db }
  );
  assert.equal(write.ok, true);
  const readback = readResearchCandidateManualResultRecords({
    db,
    receiptId: write.receipt.receipt_id,
    limit: 1
  });
  const bridgePreview = buildResearchCandidateManualResultDogfoodBridgePreview({
    readback,
    operator_view: "manual_next_work_signal_write_smoke"
  });
  const contract = buildResearchCandidateManualResultDogfoodLedgerAuthorizationContract({
    bridge_preview: bridgePreview
  });
  const review = buildResearchCandidateManualResultDogfoodLedgerAuthorizationReview({
    authorization_contract: contract,
    operator_decision: "accept_contract_for_future_write_slice",
    operator_note: "Local accept note that must not persist."
  });
  return { write, contract, review };
}
function ledgerWriteRequest(source, overrides = {}) {
  const { operator_authorization: operatorOverrides = {}, ...topLevelOverrides } = overrides;
  return {
    authorization_contract: source.contract,
    authorization_review: source.review,
    operator_authorization: {
      authorization_kind: "manual_operator_authorized_global_dogfood_ledger_write",
      operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_WRITE_CONFIRMATION,
      write_mode: "commit",
      ...operatorOverrides
    },
    ...topLevelOverrides
  };
}
function writeLedger(source, overrides = {}) {
  return writeResearchCandidateManualGlobalDogfoodLedger(
    ledgerWriteRequest(source, overrides),
    { db }
  );
}
function projectionFromReadback(operatorView = "next_work_signal_write_smoke") {
  return buildResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjection({
    readback: readResearchCandidateManualGlobalDogfoodLedger({ db, limit: 50 }),
    operator_view: operatorView
  });
}
function metricContractFromCurrentProjection(operatorView) {
  return buildResearchCandidateManualGlobalDogfoodMetricSnapshotContract({
    projection: projectionFromReadback(operatorView)
  });
}
function acceptedMetricReview(contract, operatorNote) {
  return buildResearchCandidateManualGlobalDogfoodMetricSnapshotReview({
    metric_snapshot_contract: contract,
    operator_decision: "accept_contract_for_future_metric_snapshot_write_slice",
    operator_note: operatorNote
  });
}
function metricWriteRequest(contract, review, overrides = {}) {
  const { operator_authorization: operatorOverrides = {}, ...topLevelOverrides } = overrides;
  return {
    metric_snapshot_contract: contract,
    metric_snapshot_review: review,
    operator_authorization: {
      authorization_kind: "manual_operator_authorized_dogfood_metric_snapshot_write",
      operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_WRITE_CONFIRMATION,
      write_mode: "commit",
      ...operatorOverrides
    },
    ...topLevelOverrides
  };
}
function writeMetric(contract, review, overrides = {}) {
  return writeResearchCandidateManualGlobalDogfoodMetricSnapshot(
    metricWriteRequest(contract, review, overrides),
    { db }
  );
}
function nextWorkContractFromCurrentProjection(operatorView) {
  return buildResearchCandidateManualGlobalDogfoodNextWorkSignalContract({
    projection: projectionFromReadback(operatorView)
  });
}
function acceptedNextWorkReview(contract, operatorNote) {
  return buildResearchCandidateManualGlobalDogfoodNextWorkSignalReview({
    next_work_signal_contract: contract,
    operator_decision: "accept_contract_for_future_next_work_signal_write_slice",
    operator_note: operatorNote
  });
}
function nextWorkWriteRequest(contract, review, metricWrite, overrides = {}) {
  const { operator_authorization: operatorOverrides = {}, ...topLevelOverrides } = overrides;
  return {
    next_work_signal_contract: contract,
    next_work_signal_review: review,
    source_metric_snapshot_receipt_id: metricWrite?.receipt?.receipt_id,
    source_metric_snapshot_record_id: metricWrite?.metric_snapshot_record?.metric_snapshot_record_id,
    operator_authorization: {
      authorization_kind: "manual_operator_authorized_next_work_signal_decision_write",
      operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_WRITE_CONFIRMATION,
      write_mode: "commit",
      ...operatorOverrides
    },
    ...topLevelOverrides
  };
}
function writeNextWork(contract, review, metricWrite, overrides = {}) {
  return writeResearchCandidateManualGlobalDogfoodNextWorkSignal(
    nextWorkWriteRequest(contract, review, metricWrite, overrides),
    { db }
  );
}
function prepareActiveSource({ outcome, suffix, operatorView }) {
  const source = createManualSource({ outcome, suffix });
  const ledger = writeLedger(source);
  assert.equal(ledger.ok, true);
  const metricContract = metricContractFromCurrentProjection(operatorView + "_metric");
  const metricReview = acceptedMetricReview(metricContract, operatorView + " metric note");
  const metric = writeMetric(metricContract, metricReview);
  assert.equal(metric.ok, true);
  const nextContract = nextWorkContractFromCurrentProjection(operatorView + "_next_work");
  const nextReview = acceptedNextWorkReview(nextContract, operatorView + " next-work note");
  return { source, ledger, metricContract, metricReview, metric, nextContract, nextReview };
}

const initialCounts = readCounts();
const primary = prepareActiveSource({
  outcome: "helpful",
  suffix: "Helpful active source for next-work signal write.",
  operatorView: "primary"
});
const nextReviewNoNote = acceptedNextWorkReview(primary.nextContract);
const nextReviewWithLocalNote = acceptedNextWorkReview(primary.nextContract, "same accepted next-work review local-only note");
assert.notEqual(
  nextReviewNoNote.validation.review_fingerprint,
  nextReviewWithLocalNote.validation.review_fingerprint
);
const mismatchedReviewSource = prepareActiveSource({
  outcome: "stale",
  suffix: "Different source for mismatched accepted next-work review.",
  operatorView: "mismatched_review"
});
const revisionReview = buildResearchCandidateManualGlobalDogfoodNextWorkSignalReview({
  next_work_signal_contract: primary.nextContract,
  operator_decision: "needs_next_work_mapping_revision"
});
const rejectReview = buildResearchCandidateManualGlobalDogfoodNextWorkSignalReview({
  next_work_signal_contract: primary.nextContract,
  operator_decision: "reject_next_work_contract"
});
const deferReview = buildResearchCandidateManualGlobalDogfoodNextWorkSignalReview({
  next_work_signal_contract: primary.nextContract,
  operator_decision: "defer_next_work_contract"
});
const wrongConfirmation = writeNextWork(primary.nextContract, primary.nextReview, primary.metric, {
  operator_authorization: { operator_confirmation_text: "wrong confirmation" }
});
const nonAcceptedRevision = writeNextWork(primary.nextContract, revisionReview, primary.metric);
const nonAcceptedReject = writeNextWork(primary.nextContract, rejectReview, primary.metric);
const nonAcceptedDefer = writeNextWork(primary.nextContract, deferReview, primary.metric);
const blockedContract = buildResearchCandidateManualGlobalDogfoodNextWorkSignalContract({
  projection: {
    ...projectionFromReadback("blocked_next_work_signal_write"),
    projection_readiness: "blocked_no_active_committed_ledger_receipt",
    latest_active_committed_receipt_id: null,
    validation: {
      ...projectionFromReadback("blocked_next_work_signal_write").validation,
      passed: false
    },
    blocked_reasons: ["blocked_no_active_committed_ledger_receipt"],
    next_work_signal_candidates: []
  }
});
const blockedReview = acceptedNextWorkReview(blockedContract, "blocked note");
const blockedWrite = writeNextWork(blockedContract, blockedReview, primary.metric);
const missingRefsContract = {
  ...primary.nextContract,
  source_handoff_seed_fingerprint: null,
  validation: {
    ...primary.nextContract.validation,
    contract_fingerprint: primary.nextContract.validation.contract_fingerprint + ":missing"
  }
};
const missingRefsReview = acceptedNextWorkReview(missingRefsContract, "missing refs note");
const missingRefsWrite = writeNextWork(missingRefsContract, missingRefsReview, primary.metric);
const missingCardContract = {
  ...primary.nextContract,
  source_next_work_candidate_card_ids: [],
  validation: {
    ...primary.nextContract.validation,
    contract_fingerprint: primary.nextContract.validation.contract_fingerprint + ":cards"
  }
};
const missingCardReview = acceptedNextWorkReview(missingCardContract, "missing card note");
const missingCardWrite = writeNextWork(missingCardContract, missingCardReview, primary.metric);
const writeFlagContract = {
  ...primary.nextContract,
  proposed_decision_inputs: {
    ...primary.nextContract.proposed_decision_inputs,
    selected_card_write_flags_all_false: false
  },
  validation: {
    ...primary.nextContract.validation,
    contract_fingerprint: primary.nextContract.validation.contract_fingerprint + ":flags"
  }
};
const writeFlagReview = acceptedNextWorkReview(writeFlagContract, "write flag note");
const writeFlagWrite = writeNextWork(writeFlagContract, writeFlagReview, primary.metric);
const rawTextWrite = writeNextWork(primary.nextContract, primary.nextReview, primary.metric, {
  raw_result_report_text: "raw result text must not persist"
});
const operatorNoteWrite = writeNextWork(primary.nextContract, primary.nextReview, primary.metric, {
  operator_note: "operator note must not persist"
});
const wrongAuthorityContract = {
  ...primary.nextContract,
  authority_boundary: {
    ...primary.nextContract.authority_boundary,
    can_write_next_work_bias: true
  },
  validation: {
    ...primary.nextContract.validation,
    contract_fingerprint: primary.nextContract.validation.contract_fingerprint + ":authority"
  }
};
const wrongAuthorityReview = acceptedNextWorkReview(wrongAuthorityContract, "wrong authority note");
const wrongAuthorityWrite = writeNextWork(wrongAuthorityContract, wrongAuthorityReview, primary.metric);
const sideEffectWrite = writeNextWork(primary.nextContract, primary.nextReview, primary.metric, {
  requested_side_effects: {
    next_work_bias_written: true,
    perspective_state_written: true,
    work_item_written: true,
    dogfood_metrics_written: true,
    proof_or_evidence_written: true,
    product_write_executed: true
  }
});
const countsBeforeMismatchedReviewWrite = readCounts();
const mismatchedReviewWrite = writeNextWork(
  primary.nextContract,
  mismatchedReviewSource.nextReview,
  primary.metric
);
const countsAfterMismatchedReviewWrite = readCounts();
const malformedRequests = [
  {},
  {
    next_work_signal_contract: {},
    next_work_signal_review: {},
    operator_authorization: {}
  },
  {
    ...nextWorkWriteRequest(primary.nextContract, primary.nextReview, primary.metric),
    next_work_signal_contract: {
      ...primary.nextContract,
      validation: undefined
    }
  },
  {
    ...nextWorkWriteRequest(primary.nextContract, primary.nextReview, primary.metric),
    next_work_signal_contract: {
      ...primary.nextContract,
      proposed_next_work_signal_mapping: undefined
    }
  },
  {
    ...nextWorkWriteRequest(primary.nextContract, primary.nextReview, primary.metric),
    next_work_signal_contract: {
      ...primary.nextContract,
      source_next_work_candidate_card_ids: "not an array"
    }
  }
];
const countsBeforeMalformedRequests = readCounts();
const malformedResults = malformedRequests.map((malformedRequest) =>
  writeResearchCandidateManualGlobalDogfoodNextWorkSignal(malformedRequest, {
    db
  })
);
const countsAfterMalformedRequests = readCounts();
const countsBeforeCommit = readCounts();
const committedNextWork = writeNextWork(primary.nextContract, nextReviewNoNote, primary.metric);
assert.equal(committedNextWork.ok, true);
const duplicateNextWork = writeNextWork(primary.nextContract, nextReviewWithLocalNote, primary.metric);
assert.equal(duplicateNextWork.ok, true);

const staleLedger = prepareActiveSource({
  outcome: "stale",
  suffix: "Stale source ledger for rejection test.",
  operatorView: "stale_ledger"
});
rollbackResearchCandidateManualGlobalDogfoodLedgerReceipt(
  {
    receipt_id: staleLedger.ledger.receipt.receipt_id,
    rollback_authorization: {
      authorization_kind: "manual_operator_authorized_global_dogfood_ledger_rollback",
      operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_ROLLBACK_CONFIRMATION,
      rollback_reason: "Rollback source ledger before next-work signal write."
    }
  },
  { db }
);
const countsBeforeRolledBackLedgerWrite = readCounts();
const rolledBackLedgerWrite = writeNextWork(staleLedger.nextContract, staleLedger.nextReview, staleLedger.metric);
const countsAfterRolledBackLedgerWrite = readCounts();

const staleMetric = prepareActiveSource({
  outcome: "missing",
  suffix: "Missing source metric for rejection test.",
  operatorView: "stale_metric"
});
rollbackResearchCandidateManualGlobalDogfoodMetricSnapshotReceipt(
  {
    receipt_id: staleMetric.metric.receipt.receipt_id,
    rollback_authorization: {
      authorization_kind: "manual_operator_authorized_dogfood_metric_snapshot_rollback",
      operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_ROLLBACK_CONFIRMATION,
      rollback_reason: "Rollback source metric before next-work signal write."
    }
  },
  { db }
);
const countsBeforeRolledBackMetricWrite = readCounts();
const rolledBackMetricWrite = writeNextWork(staleMetric.nextContract, staleMetric.nextReview, staleMetric.metric);
const countsAfterRolledBackMetricWrite = readCounts();

const supersededLedger = prepareActiveSource({
  outcome: "noisy",
  suffix: "Noisy source ledger for superseded source rejection.",
  operatorView: "superseded_ledger"
});
const replacementLedgerSource = createManualSource({
  outcome: "misleading",
  suffix: "Replacement ledger source to supersede stale ledger."
});
const replacementLedger = writeLedger(replacementLedgerSource, {
  operator_authorization: {
    write_mode: "supersede_previous",
    supersedes_receipt_id: supersededLedger.ledger.receipt.receipt_id
  }
});
assert.equal(replacementLedger.ok, true);
const countsBeforeSupersededLedgerWrite = readCounts();
const supersededLedgerWrite = writeNextWork(supersededLedger.nextContract, supersededLedger.nextReview, supersededLedger.metric);
const countsAfterSupersededLedgerWrite = readCounts();

const supersededMetric = prepareActiveSource({
  outcome: "helpful",
  suffix: "Helpful source metric for superseded source rejection.",
  operatorView: "superseded_metric"
});
const replacementMetricSource = createManualSource({
  outcome: "stale",
  suffix: "Replacement metric source to supersede stale metric."
});
const replacementMetricLedger = writeLedger(replacementMetricSource);
assert.equal(replacementMetricLedger.ok, true);
const replacementMetricContract = metricContractFromCurrentProjection("replacement_metric_for_supersede");
const replacementMetricReview = acceptedMetricReview(replacementMetricContract, "replacement metric note");
const replacementMetric = writeMetric(replacementMetricContract, replacementMetricReview, {
  operator_authorization: {
    write_mode: "supersede_previous",
    supersedes_receipt_id: supersededMetric.metric.receipt.receipt_id
  }
});
assert.equal(replacementMetric.ok, true);
const countsBeforeSupersededMetricWrite = readCounts();
const supersededMetricWrite = writeNextWork(supersededMetric.nextContract, supersededMetric.nextReview, supersededMetric.metric);
const countsAfterSupersededMetricWrite = readCounts();

const replacementNextWorkContract = nextWorkContractFromCurrentProjection("replacement_next_work_signal");
const replacementNextWorkReview = acceptedNextWorkReview(replacementNextWorkContract, "replacement next-work note");
const supersedeNextWork = writeNextWork(replacementNextWorkContract, replacementNextWorkReview, replacementMetric, {
  operator_authorization: {
    write_mode: "supersede_previous",
    supersedes_receipt_id: committedNextWork.receipt.receipt_id
  }
});
assert.equal(supersedeNextWork.ok, true);
const rollbackNextWork = rollbackResearchCandidateManualGlobalDogfoodNextWorkSignalReceipt(
  {
    receipt_id: supersedeNextWork.receipt.receipt_id,
    rollback_authorization: {
      authorization_kind: "manual_operator_authorized_next_work_signal_decision_rollback",
      operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_ROLLBACK_CONFIRMATION,
      rollback_reason: "Smoke rollback of manual next-work signal receipt."
    }
  },
  { db }
);
assert.equal(rollbackNextWork.ok, true);
const duplicateRollbackNextWork = rollbackResearchCandidateManualGlobalDogfoodNextWorkSignalReceipt(
  {
    receipt_id: supersedeNextWork.receipt.receipt_id,
    rollback_authorization: {
      authorization_kind: "manual_operator_authorized_next_work_signal_decision_rollback",
      operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_ROLLBACK_CONFIRMATION,
      rollback_reason: "Smoke rollback of manual next-work signal receipt."
    }
  },
  { db }
);
const supersedeRolledBackNextWork = writeNextWork(replacementNextWorkContract, replacementNextWorkReview, replacementMetric, {
  operator_authorization: {
    write_mode: "supersede_previous",
    supersedes_receipt_id: supersedeNextWork.receipt.receipt_id
  }
});

const readback = readResearchCandidateManualGlobalDogfoodNextWorkSignal({ db, limit: 20 });
const counts = readCounts();
const nextWorkBiasCounts = readNextWorkBiasCounts();
const rawTextColumns = [
  "research_candidate_manual_global_dogfood_next_work_signal_receipts",
  "research_candidate_manual_global_dogfood_next_work_signal_records",
  "research_candidate_manual_global_dogfood_next_work_signal_rollbacks"
].flatMap((table) => columns(table).map((column) => table + "." + column)).filter((column) => /raw|operator_note|manual_note_text|result_report_text/i.test(column));

console.log(JSON.stringify({
  initialCounts,
  countsBeforeCommit,
  counts,
  nextWorkBiasCounts,
  rawTextColumns,
  nextContract: primary.nextContract,
  nextReview: primary.nextReview,
  primaryMetric: primary.metric,
  nextReviewNoNote,
  nextReviewWithLocalNote,
  wrongConfirmation,
  nonAcceptedRevision,
  nonAcceptedReject,
  nonAcceptedDefer,
  blockedWrite,
  missingRefsWrite,
  missingCardWrite,
  writeFlagWrite,
  rawTextWrite,
  operatorNoteWrite,
  wrongAuthorityWrite,
  sideEffectWrite,
  mismatchedReviewWrite,
  countsBeforeMismatchedReviewWrite,
  countsAfterMismatchedReviewWrite,
  malformedResults,
  countsBeforeMalformedRequests,
  countsAfterMalformedRequests,
  committedNextWork,
  duplicateNextWork,
  countsBeforeRolledBackLedgerWrite,
  rolledBackLedgerWrite,
  countsAfterRolledBackLedgerWrite,
  countsBeforeRolledBackMetricWrite,
  rolledBackMetricWrite,
  countsAfterRolledBackMetricWrite,
  countsBeforeSupersededLedgerWrite,
  supersededLedgerWrite,
  countsAfterSupersededLedgerWrite,
  countsBeforeSupersededMetricWrite,
  supersededMetricWrite,
  countsAfterSupersededMetricWrite,
  supersedeNextWork,
  rollbackNextWork,
  duplicateRollbackNextWork,
  supersedeRolledBackNextWork,
  readback
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
    blockedWrite: sample.blockedWrite,
    missingRefsWrite: sample.missingRefsWrite,
    missingCardWrite: sample.missingCardWrite,
    writeFlagWrite: sample.writeFlagWrite,
    rawTextWrite: sample.rawTextWrite,
    operatorNoteWrite: sample.operatorNoteWrite,
    wrongAuthorityWrite: sample.wrongAuthorityWrite,
    sideEffectWrite: sample.sideEffectWrite,
    mismatchedReviewWrite: sample.mismatchedReviewWrite,
    rolledBackLedgerWrite: sample.rolledBackLedgerWrite,
    rolledBackMetricWrite: sample.rolledBackMetricWrite,
    supersededLedgerWrite: sample.supersededLedgerWrite,
    supersededMetricWrite: sample.supersededMetricWrite,
    supersedeRolledBackNextWork: sample.supersedeRolledBackNextWork,
  })) {
    assert.equal(result.ok, false, `${label} must be refused`);
    assert.equal(result.result_status, "refused", `${label} status`);
    assert.ok(result.refusal_reasons.length > 0, `${label} refusal reasons`);
  }
  assert.ok(
    sample.rolledBackLedgerWrite.refusal_reasons.includes(
      "source_global_dogfood_ledger_receipt_not_active_committed",
    ),
    "rolled_back source ledger receipt must be rejected",
  );
  assert.ok(
    sample.supersededLedgerWrite.refusal_reasons.includes(
      "source_global_dogfood_ledger_receipt_not_active_committed",
    ),
    "superseded source ledger receipt must be rejected",
  );
  assert.ok(
    sample.rolledBackMetricWrite.refusal_reasons.includes(
      "source_metric_snapshot_receipt_not_active_committed",
    ),
    "rolled_back source metric snapshot receipt must be rejected",
  );
  assert.ok(
    sample.supersededMetricWrite.refusal_reasons.includes(
      "source_metric_snapshot_receipt_not_active_committed",
    ),
    "superseded source metric snapshot receipt must be rejected",
  );
  for (const table of [
    "research_candidate_manual_global_dogfood_next_work_signal_receipts",
    "research_candidate_manual_global_dogfood_next_work_signal_records",
  ]) {
    assert.equal(
      sample.countsAfterRolledBackLedgerWrite[table],
      sample.countsBeforeRolledBackLedgerWrite[table],
      `rolled_back source ledger write must not create ${table} rows`,
    );
    assert.equal(
      sample.countsAfterRolledBackMetricWrite[table],
      sample.countsBeforeRolledBackMetricWrite[table],
      `rolled_back source metric write must not create ${table} rows`,
    );
    assert.equal(
      sample.countsAfterSupersededLedgerWrite[table],
      sample.countsBeforeSupersededLedgerWrite[table],
      `superseded source ledger write must not create ${table} rows`,
    );
    assert.equal(
      sample.countsAfterSupersededMetricWrite[table],
      sample.countsBeforeSupersededMetricWrite[table],
      `superseded source metric write must not create ${table} rows`,
    );
  }
  assert.ok(
    sample.rawTextWrite.refusal_reasons.includes(
      "raw_text_or_operator_note_field_refused",
    ),
    "raw text fields must be rejected",
  );
  assert.ok(
    sample.operatorNoteWrite.refusal_reasons.includes(
      "raw_text_or_operator_note_field_refused",
    ),
    "operator note persistence attempts must be rejected",
  );
  assert.ok(
    sample.sideEffectWrite.refusal_reasons.some((reason) =>
      reason.startsWith("requested_side_effect_forbidden:"),
    ),
    "requested forbidden side effects must be rejected",
  );
  assert.ok(
    sample.mismatchedReviewWrite.refusal_reasons.includes(
      "next_work_signal_review_contract_mismatch",
    ),
    "contract A paired with accepted review B must be rejected",
  );
  for (const table of [
    "research_candidate_manual_global_dogfood_next_work_signal_receipts",
    "research_candidate_manual_global_dogfood_next_work_signal_records",
  ]) {
    assert.equal(
      sample.countsAfterMismatchedReviewWrite[table],
      sample.countsBeforeMismatchedReviewWrite[table],
      `mismatched review write must not create ${table} rows`,
    );
    assert.equal(
      sample.countsAfterMalformedRequests[table],
      sample.countsBeforeMalformedRequests[table],
      `malformed request writes must not create ${table} rows`,
    );
  }
  assert.equal(sample.malformedResults.length, 5);
  for (const malformedResult of sample.malformedResults) {
    assert.equal(malformedResult.ok, false);
    assert.equal(malformedResult.result_status, "refused");
    assert.ok(malformedResult.refusal_reasons.length > 0);
  }
  assert.ok(
    sample.malformedResults[0].refusal_reasons.includes(
      "next_work_signal_contract_shape_invalid",
    ),
    "empty request must fail with stable contract shape code",
  );
  assert.ok(
    sample.malformedResults[1].refusal_reasons.includes(
      "next_work_signal_contract_validation_shape_invalid",
    ),
    "empty nested contract must fail with stable validation shape code",
  );
  assert.ok(
    sample.malformedResults[1].refusal_reasons.includes(
      "next_work_signal_review_validation_shape_invalid",
    ),
    "empty nested review must fail with stable review validation shape code",
  );
  assert.ok(
    sample.malformedResults[1].refusal_reasons.includes(
      "next_work_signal_operator_authorization_shape_invalid",
    ),
    "empty nested authorization must fail with stable authorization shape code",
  );
  assert.ok(
    sample.malformedResults
      .slice(2)
      .some((result) =>
        result.refusal_reasons.includes("next_work_signal_mapping_shape_invalid"),
      ),
    "malformed candidate/mapping shapes must fail closed",
  );
}

function assertCommitDuplicateRollbackSupersede(sample) {
  const committed = sample.committedNextWork;
  assert.equal(committed.ok, true);
  assert.equal(committed.result_status, "committed");
  assert.equal(committed.duplicate_replayed, false);
  assert.ok(committed.receipt.receipt_id);
  assert.ok(committed.next_work_signal_record.next_work_signal_record_id);
  assert.equal(
    committed.receipt.source_projection_fingerprint,
    sample.nextContract.source_projection_fingerprint,
  );
  assert.equal(
    committed.receipt.source_global_dogfood_ledger_receipt_id,
    sample.nextContract.source_latest_active_committed_receipt_id,
  );
  assert.equal(
    committed.receipt.source_global_dogfood_ledger_record_id,
    sample.nextContract.source_ledger_record_ref,
  );
  assert.equal(
    committed.receipt.source_metric_snapshot_receipt_id,
    sample.primaryMetric.receipt.receipt_id,
  );
  assert.equal(
    committed.receipt.source_metric_snapshot_record_id,
    sample.primaryMetric.metric_snapshot_record.metric_snapshot_record_id,
  );
  assert.equal(
    committed.receipt.source_manual_receipt_id,
    sample.nextContract.source_manual_receipt_id,
  );
  assert.equal(
    committed.receipt.source_expected_observed_delta_record_ref,
    sample.nextContract.source_expected_observed_delta_record_ref,
  );
  assert.equal(
    committed.receipt.source_reuse_outcome_record_ref,
    sample.nextContract.source_reuse_outcome_record_ref,
  );
  assert.equal(
    committed.next_work_signal_record.recommended_next_work_label,
    sample.nextContract.proposed_next_work_signal_mapping.recommended_next_work_label,
  );
  assert.equal(
    committed.next_work_signal_record.rationale,
    sample.nextContract.proposed_next_work_signal_mapping.rationale,
  );
  assert.equal(
    committed.next_work_signal_record.outcome_label,
    sample.nextContract.proposed_next_work_signal_mapping.outcome_label,
  );
  assert.equal(
    committed.next_work_signal_record.outcome_signal,
    sample.nextContract.proposed_next_work_signal_mapping.outcome_signal,
  );
  assert.deepEqual(
    committed.next_work_signal_record.selected_candidate_context_refs,
    sample.nextContract.proposed_next_work_signal_mapping.selected_candidate_context_refs,
  );
  assert.deepEqual(
    committed.next_work_signal_record.source_next_work_candidate_card_ids,
    sample.nextContract.source_next_work_candidate_card_ids,
  );

  assert.equal(sample.duplicateNextWork.ok, true);
  assert.equal(sample.duplicateNextWork.result_status, "duplicate_replayed");
  assert.equal(sample.duplicateNextWork.duplicate_replayed, true);
  assert.notEqual(
    sample.nextReviewNoNote.validation.review_fingerprint,
    sample.nextReviewWithLocalNote.validation.review_fingerprint,
    "local-only operator note must change review fingerprint for this regression check",
  );
  assert.equal(
    sample.duplicateNextWork.receipt.receipt_id,
    committed.receipt.receipt_id,
  );
  assert.equal(sample.supersedeNextWork.ok, true);
  assert.equal(sample.supersedeNextWork.result_status, "committed");
  assert.equal(
    sample.supersedeNextWork.receipt.supersedes_receipt_id,
    committed.receipt.receipt_id,
  );
  assert.equal(sample.rollbackNextWork.ok, true);
  assert.equal(sample.rollbackNextWork.result_status, "rolled_back");
  assert.equal(sample.duplicateRollbackNextWork.ok, true);
  assert.equal(sample.duplicateRollbackNextWork.result_status, "rolled_back");
}

function assertReadbackAndNonTargetTables(sample) {
  assert.equal(
    sample.counts.research_candidate_manual_global_dogfood_next_work_signal_receipts,
    2,
    "one committed plus one replacement next-work signal receipt expected",
  );
  assert.equal(
    sample.counts.research_candidate_manual_global_dogfood_next_work_signal_records,
    2,
    "duplicate replay must not create duplicate next-work signal records",
  );
  assert.equal(
    sample.counts.research_candidate_manual_global_dogfood_next_work_signal_rollbacks,
    1,
    "duplicate rollback must not create duplicate rollback rows",
  );
  for (const table of [
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
    "perspective_memory_product_persistence_boundary_records",
    "perspective_memory_items",
    "delivery_ledger",
  ]) {
    assert.equal(sample.counts[table], 0, `${table} must remain unchanged/zero`);
  }
  for (const [table, value] of Object.entries(sample.nextWorkBiasCounts)) {
    if (
      [
        "research_candidate_manual_global_dogfood_next_work_signal_receipts",
        "research_candidate_manual_global_dogfood_next_work_signal_records",
        "research_candidate_manual_global_dogfood_next_work_signal_rollbacks",
      ].includes(table)
    ) {
      continue;
    }
    assert.equal(value, 0, `${table} must remain unchanged/zero`);
  }
  assert.deepEqual(sample.rawTextColumns, []);
  assert.equal(sample.readback.count, 2);
  assert.equal(sample.readback.latest_active_committed, null);
  const statuses = sample.readback.records_by_receipt.map(
    (item) => item.receipt.write_status,
  );
  assert.ok(statuses.includes("superseded"));
  assert.ok(statuses.includes("rolled_back"));
  assert.equal(sample.readback.next_work_bias_written, false);
  assert.equal(sample.readback.work_or_perspective_rows_written, false);
  assert.equal(sample.readback.dogfood_metrics_written, false);
  assert.equal(sample.readback.metric_snapshot_mutated, false);
  assert.equal(sample.readback.global_dogfood_ledger_mutated, false);
  assert.equal(sample.readback.proof_or_evidence_rows_written, false);
  assert.equal(sample.readback.perspective_memory_written, false);
  assert.equal(sample.readback.product_write_executed, false);
}

function assertDocsAndPackage() {
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-manual-global-dogfood-next-work-signal-write-v0-1"
    ],
    "node scripts/smoke-research-candidate-manual-global-dogfood-next-work-signal-write-v0-1.mjs",
  );
  for (const text of [
    "manual global dogfood next-work signal",
    "manual-specific next-work signal tables",
    "active committed metric snapshot",
    "duplicate_replayed",
    "no next-work bias write",
  ]) {
    assert.ok(source.docs.includes(text), `docs must include ${text}`);
  }
}
