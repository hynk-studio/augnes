#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const files = {
  type:
    "types/research-candidate-manual-global-dogfood-metric-snapshot-write.ts",
  writer:
    "lib/research-candidate-review/manual-global-dogfood-metric-snapshot-write.ts",
  readback:
    "lib/research-candidate-review/read-manual-global-dogfood-metric-snapshot.ts",
  route:
    "app/api/research-candidate-review/manual-global-dogfood-metric-snapshot/route.ts",
  rollbackRoute:
    "app/api/research-candidate-review/manual-global-dogfood-metric-snapshot/[receipt_id]/rollback/route.ts",
  writePanel:
    "components/research-candidate-manual-global-dogfood-metric-snapshot-write-panel.tsx",
  readbackPanel:
    "components/research-candidate-manual-global-dogfood-metric-snapshot-readback-panel.tsx",
  contractPanel:
    "components/research-candidate-manual-global-dogfood-metric-snapshot-contract-panel.tsx",
  schema: "lib/db/schema.sql",
  db: "lib/db.ts",
  migrations: "scripts/db-migrations.mjs",
  dbMigrate: "scripts/db-migrate.mjs",
  smoke:
    "scripts/smoke-research-candidate-manual-global-dogfood-metric-snapshot-write-v0-1.mjs",
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
assertExistingSmokesPass();

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-manual-global-dogfood-metric-snapshot-write-v0-1",
      pass: true,
      storage_path: "manual_specific_metric_snapshot_tables",
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
    "I authorize writing this manual global dogfood projection to a dogfood metric snapshot record",
    "I authorize rolling back this manual global dogfood metric snapshot receipt",
    "manual_operator_authorized_dogfood_metric_snapshot_write",
    "manual_operator_authorized_dogfood_metric_snapshot_rollback",
    "can_write_dogfood_metric_snapshot_record: true",
    "can_write_dogfood_metric_snapshot_receipt: true",
    "can_write_metric_snapshot_rollback_metadata: true",
    "can_write_global_dogfood_metrics: false",
    "can_write_next_work_bias: false",
    "can_write_global_dogfood_ledger: false",
    "can_mutate_manual_global_dogfood_ledger: false",
    "can_write_perspective_state: false",
    "can_write_perspective_memory: false",
    "can_write_proof_or_evidence: false",
    "can_mutate_work: false",
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
    "research_candidate_manual_global_dogfood_metric_snapshot_receipts",
    "research_candidate_manual_global_dogfood_metric_snapshot_records",
    "research_candidate_manual_global_dogfood_metric_snapshot_rollbacks",
    "source_metric_contract_fingerprint TEXT NOT NULL",
    "source_metric_review_fingerprint TEXT NOT NULL",
    "source_projection_fingerprint TEXT NOT NULL",
    "source_global_dogfood_ledger_receipt_id TEXT NOT NULL",
    "source_global_dogfood_ledger_record_id TEXT NOT NULL",
    "source_manual_receipt_id TEXT NOT NULL",
    "source_handoff_seed_fingerprint TEXT NOT NULL",
    "source_result_text_fingerprint TEXT NOT NULL",
    "source_expected_observed_delta_record_ref TEXT NOT NULL",
    "source_reuse_outcome_record_ref TEXT NOT NULL",
    "idempotency_key TEXT NOT NULL UNIQUE",
    "write_status TEXT NOT NULL CHECK",
    "proposed_metric_counters_json TEXT NOT NULL",
    "manual_only_context_refs_json TEXT NOT NULL",
    "compatibility_findings_json TEXT NOT NULL",
  ]) {
    assert.ok(source.schema.includes(requiredText), `schema must include ${requiredText}`);
  }

  assert.ok(
    source.db.includes(
      "migrateResearchCandidateManualGlobalDogfoodMetricSnapshotTables",
    ),
    "lib/db.ts must migrate manual metric snapshot tables",
  );
  assert.ok(
    source.migrations.includes(
      "migrateResearchCandidateManualGlobalDogfoodMetricSnapshot",
    ),
    "db-migrations must expose manual metric snapshot migration",
  );
  assert.ok(
    source.dbMigrate.includes(
      "researchCandidateManualGlobalDogfoodMetricSnapshotResult",
    ),
    "db-migrate must run manual metric snapshot migration",
  );
  assert.match(source.writer, /BEGIN IMMEDIATE/, "writer must use transaction");
  assert.match(
    source.writer.slice(source.writer.indexOf("BEGIN IMMEDIATE")),
    /readResearchCandidateManualGlobalDogfoodMetricSnapshot/,
    "writer must check idempotency inside the transaction",
  );
  const transactionSlice = source.writer.slice(
    source.writer.indexOf('db.prepare("BEGIN IMMEDIATE").run();'),
    source.writer.indexOf("insertReceipt(db, receipt);"),
  );
  assert.match(
    transactionSlice,
    /readResearchCandidateManualGlobalDogfoodLedgerByReceiptId/,
    "writer must re-read source global dogfood ledger receipt inside the transaction",
  );
  assert.match(
    transactionSlice,
    /validateSourceManualGlobalDogfoodLedger/,
    "writer must revalidate source global dogfood ledger receipt inside the transaction",
  );
  assert.match(
    source.writer,
    /source_global_dogfood_ledger_receipt_not_active_committed/,
    "writer must reject stale source ledger receipts",
  );
  assert.match(
    source.writer,
    /supersedes_receipt_not_committed/,
    "writer must refuse non-committed supersede targets",
  );
  assert.doesNotMatch(
    `${source.writer}\n${source.readback}`,
    /writeDogfoodMetricSnapshotRecordV01|@\/lib\/dogfooding\/dogfood-metric-snapshot-write|writeNextWorkBias|writePerspective|writeProof|writeEvidence|executeCodex|runCodex|OPENAI_API_KEY|new\s+OpenAI|api\.openai\.com|api\.github\.com|retrieveSources\s*\(|runRetrieval\s*\(|ragIndex\s*\(|embedding\s*\(|vectorStore\s*\(|crawler\s*\(|crawlSources\s*\(/i,
    "manual metric writer/readback must not invoke incompatible writer or forbidden behavior",
  );
  assert.doesNotMatch(
    `${source.writer}\n${source.readback}\n${source.route}\n${source.rollbackRoute}`,
    /INSERT\s+INTO\s+(dogfooding_records|dogfooding_signals|dogfooding_review_cues|verification_evidence_records|work_items|work_events|perspective_states|perspective_memory_items|delivery_ledger)|UPDATE\s+(dogfooding_records|dogfooding_signals|dogfooding_review_cues|verification_evidence_records|work_items|work_events|perspective_states|perspective_memory_items|delivery_ledger)|DELETE\s+FROM/i,
    "metric write path must not write non-target tables or delete rows",
  );
  assert.ok(source.route.includes("export async function GET"));
  assert.ok(source.route.includes("export async function POST"));
  assert.ok(source.rollbackRoute.includes("export async function POST"));
  assert.ok(source.route.includes("same_origin_required"));
  assert.ok(source.rollbackRoute.includes("same_origin_required"));
  assert.ok(source.route.includes("next_work_bias_written: false"));
  assert.ok(source.rollbackRoute.includes("global_dogfood_metrics_written: false"));
  assert.match(
    source.writePanel,
    /\/api\/research-candidate-review\/manual-global-dogfood-metric-snapshot/,
    "write panel may call only the same-origin manual metric snapshot route",
  );
  assert.doesNotMatch(
    source.writePanel,
    /api\/dogfooding\/metric-snapshots|api\/.*next-work|api\.openai\.com|github\.com|localStorage|sessionStorage|navigator\.clipboard/i,
    "write panel must not call forbidden routes/storage/clipboard",
  );
  assert.match(
    source.writePanel,
    /Write dogfood metric snapshot record/,
    "write panel must expose explicit authorized metric snapshot write button",
  );
  assert.match(
    source.writePanel,
    /rollbackConfirmationText/,
    "write panel must keep rollback confirmation in local state",
  );
  assert.match(
    source.writePanel,
    /rollbackEnabled[\s\S]*rollbackConfirmationText ===[\s\S]*RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_ROLLBACK_CONFIRMATION/,
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
    /operator_confirmation_text:\s*\n\s*RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_ROLLBACK_CONFIRMATION/,
    "rollback request must not auto-supply rollback confirmation constant",
  );
  assert.doesNotMatch(
    source.writePanel,
    /Write next-work|Write next work|next-work signal write panel/i,
    "write panel must not add next-work write controls",
  );
  assert.ok(
    source.contractPanel.includes(
      "ResearchCandidateManualGlobalDogfoodMetricSnapshotWritePanel",
    ) &&
      source.contractPanel.includes(
        "ready_for_future_metric_snapshot_write_slice",
      ),
    "contract panel must gate write panel behind accepted metric review",
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
  "Research Question: Can accepted manual metric snapshot contracts write a scoped metric snapshot record?",
  "Operator Intent: Write only an explicitly authorized manual dogfood metric snapshot receipt and record.",
  "Source Title: Manual dogfood metric snapshot write note",
  "Source Origin: local operator note",
  "Source Identifier: local-manual-dogfood-metric-snapshot-write-001",
  "Claim: Accepted manual metric contracts can write scoped snapshot metadata.",
  "Evidence: supports: The manual global dogfood ledger record preserves source refs and fingerprints.",
  "Tension: The metric snapshot write is not a global metrics update or next-work write.",
  "Gap: Need idempotent metric snapshot write and rollback metadata. next: write adapter",
  "Perspective Delta: Keep next-work and Perspective writes separately authorized.",
  "Next: Implement manual metric snapshot write. files: lib/research-candidate-review/manual-global-dogfood-metric-snapshot-write.ts checks: npm run smoke:research-candidate-manual-global-dogfood-metric-snapshot-write-v0-1"
].join("\\n");

const parserResult = parseManualResearchNoteToPreview(note);
const seed = buildResearchCandidateManualNoteHandoffSeed({
  preview: parserResult.preview,
  warnings: parserResult.warnings,
  source_metadata: {
    result_source: "local_parse",
    parser_version: parserResult.parser_version,
    input_fingerprint: "fnv1a32:manual-global-dogfood-metric-snapshot-write",
    persisted_preview_draft: false
  },
  target_label: "Manual global dogfood metric snapshot write smoke sample"
});

function makeReport({ outcome, suffix }) {
  return [
    "# Summary",
    "result_status: complete",
    "pr_url: https://github.com/hynk-studio/augnes/pull/1008",
    "pr_number: 1008",
    "live_host_observation: /research-candidate-review showed the manual metric snapshot write panel.",
    "proof_evidence_rows_written: false",
    "event_rows_created_or_mutated: false",
    "work_status_changed: false",
    "state_committed_or_rejected: false",
    "observed_outcome: " + suffix,
    "",
    "## Files changed",
    "- lib/research-candidate-review/manual-global-dogfood-metric-snapshot-write.ts",
    "",
    "## Verification",
    "- npm run typecheck passed",
    "- npm run smoke:research-candidate-manual-global-dogfood-metric-snapshot-write-v0-1 passed",
    "",
    "## Skipped checks",
    "- No skipped checks.",
    "",
    "## Remaining caveats",
    "- Next-work writes remain out of scope.",
    "",
    "selected candidate context outcome: " + outcome,
    "expected vs observed delta summary: Accepted manual metric contracts can write scoped dogfood metric snapshot metadata.",
    "",
    "## Authority boundary statement",
    "Authorized metric snapshot write only; no global dogfood metrics, no next-work bias, no proof/evidence rows, no work status change, no Perspective promotion, no memory writes, no raw text persistence, no provider calls, no GitHub automation, no source fetching, no retrieval, and no Codex execution."
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
    operator_notes: "Local setup note that must not be stored by metric snapshot write."
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
    operator_view: "manual_metric_snapshot_write_smoke"
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
function projectionFromReadback(operatorView = "metric_snapshot_write_smoke") {
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

const initialCounts = readCounts();

const sourceHelpful = createManualSource({
  outcome: "helpful",
  suffix: "Helpful active source for metric snapshot write."
});
const sourceStale = createManualSource({
  outcome: "stale",
  suffix: "Stale source for supersede test."
});
const sourceMissing = createManualSource({
  outcome: "missing",
  suffix: "Missing source for stale source rejection test."
});
const sourceNoisy = createManualSource({
  outcome: "noisy",
  suffix: "Noisy source for active replacement test."
});

const helpfulLedger = writeLedger(sourceHelpful);
assert.equal(helpfulLedger.ok, true);
const metricContract = metricContractFromCurrentProjection("metric_snapshot_write_primary");
const metricReview = acceptedMetricReview(metricContract, "Local-only metric write acceptance note.");
const metricReviewAgain = acceptedMetricReview(metricContract, "Local-only metric write acceptance note.");
const metricRevisionReview = buildResearchCandidateManualGlobalDogfoodMetricSnapshotReview({
  metric_snapshot_contract: metricContract,
  operator_decision: "needs_metric_mapping_revision"
});
const metricRejectReview = buildResearchCandidateManualGlobalDogfoodMetricSnapshotReview({
  metric_snapshot_contract: metricContract,
  operator_decision: "reject_metric_contract"
});
const metricDeferReview = buildResearchCandidateManualGlobalDogfoodMetricSnapshotReview({
  metric_snapshot_contract: metricContract,
  operator_decision: "defer_metric_contract"
});

const wrongConfirmation = writeMetric(metricContract, metricReview, {
  operator_authorization: { operator_confirmation_text: "wrong confirmation" }
});
const nonAcceptedRevision = writeMetric(metricContract, metricRevisionReview);
const nonAcceptedReject = writeMetric(metricContract, metricRejectReview);
const nonAcceptedDefer = writeMetric(metricContract, metricDeferReview);
const blockedContract = buildResearchCandidateManualGlobalDogfoodMetricSnapshotContract({
  projection: {
    ...projectionFromReadback("blocked_metric_snapshot_write"),
    projection_readiness: "blocked_no_active_committed_ledger_receipt",
    latest_active_committed_receipt_id: null,
    validation: {
      ...projectionFromReadback("blocked_metric_snapshot_write").validation,
      passed: false
    },
    blocked_reasons: ["blocked_no_active_committed_ledger_receipt"]
  }
});
const blockedReview = acceptedMetricReview(blockedContract, "blocked note");
const blockedWrite = writeMetric(blockedContract, blockedReview);
const missingRefsContract = {
  ...metricContract,
  source_handoff_seed_fingerprint: null,
  validation: {
    ...metricContract.validation,
    contract_fingerprint: metricContract.validation.contract_fingerprint + ":missing"
  }
};
const missingRefsReview = acceptedMetricReview(missingRefsContract, "missing refs note");
const missingRefsWrite = writeMetric(missingRefsContract, missingRefsReview);
const rawTextWrite = writeMetric(metricContract, metricReview, {
  raw_result_report_text: "raw result text must not persist"
});
const operatorNoteWrite = writeMetric(metricContract, metricReview, {
  operator_note: "operator note must not persist"
});
const wrongAuthorityContract = {
  ...metricContract,
  authority_boundary: {
    ...metricContract.authority_boundary,
    can_write_metric_snapshot: true
  },
  validation: {
    ...metricContract.validation,
    contract_fingerprint: metricContract.validation.contract_fingerprint + ":authority"
  }
};
const wrongAuthorityReview = acceptedMetricReview(wrongAuthorityContract, "wrong authority note");
const wrongAuthorityWrite = writeMetric(wrongAuthorityContract, wrongAuthorityReview);
const sideEffectWrite = writeMetric(metricContract, metricReview, {
  requested_side_effects: {
    global_dogfood_metrics_written: true,
    next_work_bias_written: true
  }
});
const unsupportedSignalContract = {
  ...metricContract,
  proposed_metric_snapshot_mapping: {
    ...metricContract.proposed_metric_snapshot_mapping,
    outcome_signal: "unknown"
  },
  validation: {
    ...metricContract.validation,
    contract_fingerprint: metricContract.validation.contract_fingerprint + ":signal"
  }
};
const unsupportedSignalReview = acceptedMetricReview(unsupportedSignalContract, "unsupported signal note");
const unsupportedSignalWrite = writeMetric(unsupportedSignalContract, unsupportedSignalReview);

const countsBeforeMetricCommit = readCounts();
const committedMetric = writeMetric(metricContract, metricReview);
assert.equal(committedMetric.ok, true);
const duplicateMetric = writeMetric(metricContract, metricReviewAgain);
assert.equal(duplicateMetric.ok, true);

const staleSourceLedger = writeLedger(sourceStale);
assert.equal(staleSourceLedger.ok, true);
const staleContract = metricContractFromCurrentProjection("metric_snapshot_write_stale_source");
const staleReview = acceptedMetricReview(staleContract, "stale source note");
const rollbackSource = rollbackResearchCandidateManualGlobalDogfoodLedgerReceipt(
  {
    receipt_id: staleSourceLedger.receipt.receipt_id,
    rollback_authorization: {
      authorization_kind: "manual_operator_authorized_global_dogfood_ledger_rollback",
      operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_ROLLBACK_CONFIRMATION,
      rollback_reason: "Rollback source ledger receipt before metric snapshot write."
    }
  },
  { db }
);
assert.equal(rollbackSource.ok, true);
const countsBeforeRolledBackSourceWrite = readCounts();
const rolledBackSourceWrite = writeMetric(staleContract, staleReview);
const countsAfterRolledBackSourceWrite = readCounts();

const supersededSourceLedger = writeLedger(sourceMissing);
assert.equal(supersededSourceLedger.ok, true);
const supersededSourceContract = metricContractFromCurrentProjection("metric_snapshot_write_superseded_source");
const supersededSourceReview = acceptedMetricReview(supersededSourceContract, "superseded source note");
const replacementLedger = writeLedger(sourceNoisy, {
  operator_authorization: {
    write_mode: "supersede_previous",
    supersedes_receipt_id: supersededSourceLedger.receipt.receipt_id
  }
});
assert.equal(replacementLedger.ok, true);
const countsBeforeSupersededSourceWrite = readCounts();
const supersededSourceWrite = writeMetric(supersededSourceContract, supersededSourceReview);
const countsAfterSupersededSourceWrite = readCounts();

const replacementMetricContract = metricContractFromCurrentProjection("metric_snapshot_write_replacement");
const replacementMetricReview = acceptedMetricReview(replacementMetricContract, "replacement metric note");
const supersedeMetric = writeMetric(replacementMetricContract, replacementMetricReview, {
  operator_authorization: {
    write_mode: "supersede_previous",
    supersedes_receipt_id: committedMetric.receipt.receipt_id
  }
});
assert.equal(supersedeMetric.ok, true);
const rollbackMetric = rollbackResearchCandidateManualGlobalDogfoodMetricSnapshotReceipt(
  {
    receipt_id: supersedeMetric.receipt.receipt_id,
    rollback_authorization: {
      authorization_kind: "manual_operator_authorized_dogfood_metric_snapshot_rollback",
      operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_ROLLBACK_CONFIRMATION,
      rollback_reason: "Smoke rollback of manual metric snapshot receipt."
    }
  },
  { db }
);
assert.equal(rollbackMetric.ok, true);
const duplicateRollbackMetric = rollbackResearchCandidateManualGlobalDogfoodMetricSnapshotReceipt(
  {
    receipt_id: supersedeMetric.receipt.receipt_id,
    rollback_authorization: {
      authorization_kind: "manual_operator_authorized_dogfood_metric_snapshot_rollback",
      operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_ROLLBACK_CONFIRMATION,
      rollback_reason: "Smoke rollback of manual metric snapshot receipt."
    }
  },
  { db }
);
const supersedeRolledBackMetric = writeMetric(replacementMetricContract, replacementMetricReview, {
  operator_authorization: {
    write_mode: "supersede_previous",
    supersedes_receipt_id: supersedeMetric.receipt.receipt_id
  }
});

const readback = readResearchCandidateManualGlobalDogfoodMetricSnapshot({ db, limit: 20 });
const counts = readCounts();
const nextWorkBiasCounts = readNextWorkBiasCounts();
const rawTextColumns = [
  "research_candidate_manual_global_dogfood_metric_snapshot_receipts",
  "research_candidate_manual_global_dogfood_metric_snapshot_records",
  "research_candidate_manual_global_dogfood_metric_snapshot_rollbacks"
].flatMap((table) => columns(table).map((column) => table + "." + column)).filter((column) => /raw|operator_note|manual_note_text|result_report_text/i.test(column));

console.log(JSON.stringify({
  initialCounts,
  countsBeforeMetricCommit,
  counts,
  nextWorkBiasCounts,
  rawTextColumns,
  metricContract,
  metricReview,
  wrongConfirmation,
  nonAcceptedRevision,
  nonAcceptedReject,
  nonAcceptedDefer,
  blockedWrite,
  missingRefsWrite,
  rawTextWrite,
  operatorNoteWrite,
  wrongAuthorityWrite,
  sideEffectWrite,
  unsupportedSignalWrite,
  committedMetric,
  duplicateMetric,
  countsBeforeRolledBackSourceWrite,
  rolledBackSourceWrite,
  countsAfterRolledBackSourceWrite,
  countsBeforeSupersededSourceWrite,
  supersededSourceWrite,
  countsAfterSupersededSourceWrite,
  supersedeMetric,
  rollbackMetric,
  duplicateRollbackMetric,
  supersedeRolledBackMetric,
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
    rawTextWrite: sample.rawTextWrite,
    operatorNoteWrite: sample.operatorNoteWrite,
    wrongAuthorityWrite: sample.wrongAuthorityWrite,
    sideEffectWrite: sample.sideEffectWrite,
    unsupportedSignalWrite: sample.unsupportedSignalWrite,
    rolledBackSourceWrite: sample.rolledBackSourceWrite,
    supersededSourceWrite: sample.supersededSourceWrite,
    supersedeRolledBackMetric: sample.supersedeRolledBackMetric,
  })) {
    assert.equal(result.ok, false, `${label} must be refused`);
    assert.equal(result.result_status, "refused", `${label} status`);
    assert.ok(result.refusal_reasons.length > 0, `${label} refusal reasons`);
  }
  assert.ok(
    sample.rolledBackSourceWrite.refusal_reasons.includes(
      "source_global_dogfood_ledger_receipt_not_active_committed",
    ),
    "rolled_back source ledger receipt must be rejected",
  );
  assert.ok(
    sample.supersededSourceWrite.refusal_reasons.includes(
      "source_global_dogfood_ledger_receipt_not_active_committed",
    ),
    "superseded source ledger receipt must be rejected",
  );
  for (const table of [
    "research_candidate_manual_global_dogfood_metric_snapshot_receipts",
    "research_candidate_manual_global_dogfood_metric_snapshot_records",
  ]) {
    assert.equal(
      sample.countsAfterRolledBackSourceWrite[table],
      sample.countsBeforeRolledBackSourceWrite[table],
      `rolled_back source write must not create ${table} rows`,
    );
    assert.equal(
      sample.countsAfterSupersededSourceWrite[table],
      sample.countsBeforeSupersededSourceWrite[table],
      `superseded source write must not create ${table} rows`,
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
}

function assertCommitDuplicateRollbackSupersede(sample) {
  const committed = sample.committedMetric;
  assert.equal(committed.ok, true);
  assert.equal(committed.result_status, "committed");
  assert.equal(committed.duplicate_replayed, false);
  assert.ok(committed.receipt.receipt_id);
  assert.ok(committed.metric_snapshot_record.metric_snapshot_record_id);
  assert.equal(
    committed.receipt.source_projection_fingerprint,
    sample.metricContract.source_projection_fingerprint,
  );
  assert.equal(
    committed.receipt.source_global_dogfood_ledger_receipt_id,
    sample.metricContract.source_latest_active_committed_receipt_id,
  );
  assert.equal(
    committed.receipt.source_global_dogfood_ledger_record_id,
    sample.metricContract.source_ledger_record_ref,
  );
  assert.equal(
    committed.receipt.source_manual_receipt_id,
    sample.metricContract.source_manual_receipt_id,
  );
  assert.equal(
    committed.receipt.source_expected_observed_delta_record_ref,
    sample.metricContract.source_expected_observed_delta_record_ref,
  );
  assert.equal(
    committed.receipt.source_reuse_outcome_record_ref,
    sample.metricContract.source_reuse_outcome_record_ref,
  );
  assert.equal(
    committed.metric_snapshot_record.outcome_label,
    sample.metricContract.proposed_metric_snapshot_mapping.outcome_label,
  );
  assert.equal(
    committed.metric_snapshot_record.outcome_signal,
    sample.metricContract.proposed_metric_snapshot_mapping.outcome_signal,
  );
  assert.deepEqual(
    committed.metric_snapshot_record.proposed_metric_counters,
    sample.metricContract.proposed_metric_counters,
  );
  assert.deepEqual(
    committed.metric_snapshot_record.proposed_metric_labels,
    sample.metricContract.proposed_metric_labels,
  );
  assert.deepEqual(
    committed.metric_snapshot_record.selected_candidate_context_refs,
    sample.metricContract.proposed_metric_dimensions.selected_candidate_context_refs,
  );

  assert.equal(sample.duplicateMetric.ok, true);
  assert.equal(sample.duplicateMetric.result_status, "duplicate_replayed");
  assert.equal(sample.duplicateMetric.duplicate_replayed, true);
  assert.equal(
    sample.duplicateMetric.receipt.receipt_id,
    committed.receipt.receipt_id,
  );
  assert.equal(sample.supersedeMetric.ok, true);
  assert.equal(sample.supersedeMetric.result_status, "committed");
  assert.equal(
    sample.supersedeMetric.receipt.supersedes_receipt_id,
    committed.receipt.receipt_id,
  );
  assert.equal(sample.rollbackMetric.ok, true);
  assert.equal(sample.rollbackMetric.result_status, "rolled_back");
  assert.equal(sample.duplicateRollbackMetric.ok, true);
  assert.equal(sample.duplicateRollbackMetric.result_status, "rolled_back");
}

function assertReadbackAndNonTargetTables(sample) {
  assert.equal(
    sample.counts.research_candidate_manual_global_dogfood_metric_snapshot_receipts,
    2,
    "one committed plus one replacement metric receipt expected",
  );
  assert.equal(
    sample.counts.research_candidate_manual_global_dogfood_metric_snapshot_records,
    2,
    "duplicate replay must not create duplicate metric records",
  );
  assert.equal(
    sample.counts.research_candidate_manual_global_dogfood_metric_snapshot_rollbacks,
    1,
    "duplicate rollback must not create duplicate rollback rows",
  );
  assert.equal(sample.counts.dogfood_metric_snapshot_records, 0);
  for (const table of [
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
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(sample.nextWorkBiasCounts).filter(
        ([table]) =>
          ![
            "research_candidate_manual_global_dogfood_next_work_signal_receipts",
            "research_candidate_manual_global_dogfood_next_work_signal_records",
            "research_candidate_manual_global_dogfood_next_work_signal_rollbacks",
          ].includes(table),
      ),
    ),
    {},
  );
  assert.deepEqual(sample.rawTextColumns, []);
  assert.equal(sample.readback.count, 2);
  assert.equal(sample.readback.latest_active_committed, null);
  const statuses = sample.readback.records_by_receipt.map(
    (item) => item.receipt.write_status,
  );
  assert.ok(statuses.includes("superseded"));
  assert.ok(statuses.includes("rolled_back"));
  assert.equal(sample.readback.global_dogfood_metrics_written, false);
  assert.equal(sample.readback.next_work_bias_written, false);
  assert.equal(sample.readback.proof_or_evidence_rows_written, false);
  assert.equal(sample.readback.work_or_perspective_rows_written, false);
  assert.equal(sample.readback.perspective_memory_written, false);
  assert.equal(sample.readback.product_write_executed, false);
}

function assertDocsAndPackage() {
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-manual-global-dogfood-metric-snapshot-write-v0-1"
    ],
    "node scripts/smoke-research-candidate-manual-global-dogfood-metric-snapshot-write-v0-1.mjs",
  );
  for (const text of [
    "manual global dogfood metric snapshot",
    "manual-specific metric snapshot tables",
    "duplicate_replayed",
    "no global dogfood metrics update",
    "no next-work bias",
  ]) {
    assert.ok(source.docs.includes(text), `docs must include ${text}`);
  }
}

function assertExistingSmokesPass() {
  for (const script of [
    "scripts/smoke-research-candidate-manual-global-dogfood-loop-contracts-v0-1.mjs",
    "scripts/smoke-research-candidate-manual-global-dogfood-ledger-workbench-projection-v0-1.mjs",
    "scripts/smoke-research-candidate-manual-global-dogfood-ledger-write-v0-1.mjs",
    "scripts/smoke-research-candidate-manual-result-dogfood-ledger-authorization-contract-v0-1.mjs",
    "scripts/smoke-research-candidate-manual-result-dogfood-bridge-preview-v0-1.mjs",
    "scripts/smoke-research-candidate-manual-result-authorized-record-write-v0-1.mjs",
    "scripts/smoke-research-candidate-manual-note-result-intake-operator-review-v0-1.mjs",
    "scripts/smoke-research-candidate-manual-note-handoff-result-intake-v0-1.mjs",
    "scripts/smoke-research-candidate-manual-note-handoff-seed-v0-1.mjs",
    "scripts/smoke-research-candidate-manual-note-preview-ui-v0-1.mjs",
  ]) {
    execFileSync("node", [script], { encoding: "utf8", stdio: "pipe" });
  }
}
