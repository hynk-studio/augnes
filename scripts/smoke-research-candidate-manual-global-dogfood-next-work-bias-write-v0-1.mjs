#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const files = {
  type:
    "types/research-candidate-manual-global-dogfood-next-work-bias-write.ts",
  writer:
    "lib/research-candidate-review/manual-global-dogfood-next-work-bias-write.ts",
  readback:
    "lib/research-candidate-review/read-manual-global-dogfood-next-work-bias.ts",
  route:
    "app/api/research-candidate-review/manual-global-dogfood-next-work-bias/route.ts",
  rollbackRoute:
    "app/api/research-candidate-review/manual-global-dogfood-next-work-bias/[receipt_id]/rollback/route.ts",
  writePanel:
    "components/research-candidate-manual-global-dogfood-next-work-bias-write-panel.tsx",
  readbackPanel:
    "components/research-candidate-manual-global-dogfood-next-work-bias-readback-panel.tsx",
  contractPanel:
    "components/research-candidate-manual-global-dogfood-next-work-bias-contract-panel.tsx",
  schema: "lib/db/schema.sql",
  db: "lib/db.ts",
  migrations: "scripts/db-migrations.mjs",
  dbMigrate: "scripts/db-migrate.mjs",
  smoke:
    "scripts/smoke-research-candidate-manual-global-dogfood-next-work-bias-write-v0-1.mjs",
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
        "research-candidate-manual-global-dogfood-next-work-bias-write-v0-1",
      pass: true,
      storage_path: "manual_specific_next_work_bias_tables",
      source_next_work_signal_revalidated: true,
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
    "I authorize writing this manual global dogfood next-work signal to a next-work bias record",
    "I authorize rolling back this manual global dogfood next-work bias receipt",
    "manual_operator_authorized_next_work_bias_write",
    "manual_operator_authorized_next_work_bias_rollback",
    "can_write_next_work_bias_record: true",
    "can_write_next_work_bias_receipt: true",
    "can_write_next_work_bias_rollback_metadata: true",
    "can_write_work_item: false",
    "can_mutate_work: false",
    "can_write_perspective_relay: false",
    "can_write_perspective_state: false",
    "can_promote_perspective: false",
    "can_write_perspective_memory: false",
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
    "research_candidate_manual_global_dogfood_next_work_bias_receipts",
    "research_candidate_manual_global_dogfood_next_work_bias_records",
    "research_candidate_manual_global_dogfood_next_work_bias_rollbacks",
    "source_next_work_bias_contract_fingerprint TEXT NOT NULL",
    "source_next_work_bias_review_fingerprint TEXT NOT NULL",
    "source_next_work_signal_receipt_id TEXT NOT NULL",
    "source_next_work_signal_record_id TEXT NOT NULL",
    "source_next_work_signal_record_fingerprint TEXT NOT NULL",
    "source_projection_fingerprint TEXT NOT NULL",
    "source_global_dogfood_ledger_receipt_id TEXT NOT NULL",
    "source_metric_snapshot_receipt_id TEXT NOT NULL",
    "idempotency_key TEXT NOT NULL UNIQUE",
    "recommended_next_work_label TEXT NOT NULL",
    "selected_candidate_context_refs_json TEXT NOT NULL",
    "manual_only_context_refs_json TEXT NOT NULL",
  ]) {
    assert.ok(source.schema.includes(requiredText), `schema must include ${requiredText}`);
  }

  assert.ok(
    source.db.includes(
      "migrateResearchCandidateManualGlobalDogfoodNextWorkBiasTables",
    ),
    "lib/db.ts must migrate manual next-work bias tables",
  );
  assert.ok(
    source.migrations.includes(
      "migrateResearchCandidateManualGlobalDogfoodNextWorkBias",
    ),
    "db-migrations must expose manual next-work bias migration",
  );
  assert.ok(
    source.dbMigrate.includes(
      "researchCandidateManualGlobalDogfoodNextWorkBiasResult",
    ),
    "db-migrate must run manual next-work bias migration",
  );
  assert.match(source.writer, /BEGIN IMMEDIATE/, "writer must use transaction");
  const transactionSlice = source.writer.slice(
    source.writer.indexOf('db.prepare("BEGIN IMMEDIATE").run();'),
    source.writer.indexOf("insertReceipt(db, receipt);"),
  );
  assert.match(
    transactionSlice,
    /validateSourceNextWorkSignalForRequest/,
    "writer must revalidate source next-work signal inside transaction",
  );
  assert.match(
    source.writer,
    /next_work_bias_review_contract_mismatch/,
    "writer must reject contract/review mismatches",
  );
  assert.match(
    source.writer,
    /next_work_bias_review_source_mismatch/,
    "writer must reject review source mismatches",
  );
  const idempotencySlice = source.writer.slice(
    source.writer.indexOf("function computeNextWorkBiasIdempotencyKey"),
    source.writer.indexOf("function validationWithFailures"),
  );
  assert.doesNotMatch(
    idempotencySlice,
    /review_fingerprint|operator_note|warning_reasons/,
    "durable idempotency must exclude local-only review note fingerprint material",
  );
  assert.doesNotMatch(
    `${source.writer}\n${source.readback}\n${source.route}\n${source.rollbackRoute}`,
    /writePerspective|promotePerspective|writeProof|writeEvidence|writeDogfoodMetric|writeResearchCandidateManualGlobalDogfoodMetricSnapshot\s*\(|writeResearchCandidateManualGlobalDogfoodLedger\s*\(|writeResearchCandidateManualGlobalDogfoodNextWorkSignal\s*\(|executeCodex|runCodex|OPENAI_API_KEY|new\s+OpenAI|api\.openai\.com|api\.github\.com|retrieveSources\s*\(|runRetrieval\s*\(|ragIndex\s*\(|embedding\s*\(|vectorStore\s*\(|crawler\s*\(|crawlSources\s*\(/i,
    "manual next-work bias writer/readback must not invoke forbidden writers or external behavior",
  );
  assert.doesNotMatch(
    `${source.writer}\n${source.readback}\n${source.route}\n${source.rollbackRoute}`,
    /INSERT\s+INTO\s+(dogfood_metric_snapshot_records|dogfooding_records|dogfooding_signals|dogfooding_review_cues|verification_evidence_records|work_items|work_events|perspective_states|perspective_memory_items|delivery_ledger)|UPDATE\s+(dogfood_metric_snapshot_records|dogfooding_records|dogfooding_signals|dogfooding_review_cues|verification_evidence_records|work_items|work_events|perspective_states|perspective_memory_items|delivery_ledger)|DELETE\s+FROM/i,
    "next-work bias write path must not write non-target tables or delete rows",
  );
  assert.ok(source.route.includes("export async function GET"));
  assert.ok(source.route.includes("export async function POST"));
  assert.ok(source.rollbackRoute.includes("export async function POST"));
  assert.ok(source.route.includes("same_origin_required"));
  assert.ok(source.rollbackRoute.includes("same_origin_required"));
  assert.ok(source.route.includes("work_mutated: false"));
  assert.ok(source.rollbackRoute.includes("perspective_relay_written: false"));
  assert.match(
    source.writePanel,
    /\/api\/research-candidate-review\/manual-global-dogfood-next-work-bias/,
    "write panel must call the same-origin manual next-work bias route",
  );
  assert.match(
    source.writePanel,
    /Write next-work bias record/,
    "write panel must expose explicit authorized next-work bias write button",
  );
  assert.match(
    source.writePanel,
    /rollbackConfirmationText/,
    "write panel must keep rollback confirmation in local state",
  );
  assert.match(
    source.writePanel,
    /rollbackEnabled[\s\S]*rollbackConfirmationText ===[\s\S]*RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_BIAS_ROLLBACK_CONFIRMATION/,
    "rollback button must require exact rollback confirmation text",
  );
  assert.match(
    source.writePanel,
    /operator_confirmation_text: rollbackConfirmationText/,
    "rollback request must send typed rollback confirmation text",
  );
  assert.doesNotMatch(
    source.writePanel,
    /<button[^>]*>\s*(Create work item|Promote Perspective|Write Perspective relay|Global metrics update)/i,
    "write panel must not expose work/Perspective/metric update controls",
  );
  assert.ok(
    source.contractPanel.includes(
      "ResearchCandidateManualGlobalDogfoodNextWorkBiasWritePanel",
    ) &&
      source.contractPanel.includes(
        "ready_for_future_next_work_bias_write_slice",
      ),
    "contract panel must gate write panel behind accepted bias review",
  );
}

function buildSample() {
  const code = String.raw`
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { readResearchCandidateManualGlobalDogfoodNextWorkSignal } from "./lib/research-candidate-review/read-manual-global-dogfood-next-work-signal";
import { buildResearchCandidateManualGlobalDogfoodNextWorkBiasContract } from "./lib/research-candidate-review/manual-global-dogfood-next-work-bias-contract";
import { buildResearchCandidateManualGlobalDogfoodNextWorkBiasReview } from "./lib/research-candidate-review/manual-global-dogfood-next-work-bias-review";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_BIAS_WRITE_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_BIAS_ROLLBACK_CONFIRMATION
} from "./types/research-candidate-manual-global-dogfood-next-work-bias-write";
import {
  writeResearchCandidateManualGlobalDogfoodNextWorkBias,
  rollbackResearchCandidateManualGlobalDogfoodNextWorkBiasReceipt
} from "./lib/research-candidate-review/manual-global-dogfood-next-work-bias-write";
import { readResearchCandidateManualGlobalDogfoodNextWorkBias } from "./lib/research-candidate-review/read-manual-global-dogfood-next-work-bias";

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
  "research_candidate_manual_global_dogfood_next_work_bias_rollbacks",
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
function insertSignalSource({
  tag,
  status = "committed",
  outcomeSignal = "positive",
  priority = "high"
}) {
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
    write_status: status,
    authority_profile: "manual_global_dogfood_next_work_signal_write_authority.v0.1",
    receipt_fingerprint: "fnv1a32:signal-receipt-" + tag,
    supersedes_receipt_id: null,
    rollback_of_receipt_id: status === "rolled_back" ? "manual-global-dogfood-next-work-signal-receipt:" + tag : null,
    rollback_reason: status === "rolled_back" ? "source rollback" : null
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
    rationale: "Manual global dogfood source suggests a next-work bias candidate " + tag,
    outcome_label: "helpful",
    outcome_signal: outcomeSignal,
    candidate_priority_hint: priority,
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
function contractAndReview(tag) {
  const readback = readResearchCandidateManualGlobalDogfoodNextWorkSignal({
    db,
    receiptId: "manual-global-dogfood-next-work-signal-receipt:" + tag,
    limit: 1
  });
  const contract = buildResearchCandidateManualGlobalDogfoodNextWorkBiasContract({
    readback,
    operator_intent_label: "manual_next_work_bias_write_smoke"
  });
  const review = buildResearchCandidateManualGlobalDogfoodNextWorkBiasReview({
    next_work_bias_contract: contract,
    operator_decision: "accept_contract_for_future_next_work_bias_write_slice",
    operator_note: "Local-only note " + tag
  });
  return { readback, contract, review };
}
function request(contract, review, overrides = {}) {
  const { operator_authorization: operatorOverrides = {}, ...topLevelOverrides } = overrides;
  return {
    next_work_bias_contract: contract,
    next_work_bias_review: review,
    operator_authorization: {
      authorization_kind: "manual_operator_authorized_next_work_bias_write",
      operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_BIAS_WRITE_CONFIRMATION,
      write_mode: "commit",
      ...operatorOverrides
    },
    ...topLevelOverrides
  };
}
function write(contract, review, overrides = {}) {
  return writeResearchCandidateManualGlobalDogfoodNextWorkBias(
    request(contract, review, overrides),
    { db }
  );
}

const countsInitial = readCounts();
insertSignalSource({ tag: "primary" });
const primary = contractAndReview("primary");
assert.equal(primary.contract.operator_authorization_mode, "ready_for_future_next_work_bias_write_authorization");
const wrongConfirmation = write(primary.contract, primary.review, {
  operator_authorization: { operator_confirmation_text: "wrong confirmation" }
});
const revisionReview = buildResearchCandidateManualGlobalDogfoodNextWorkBiasReview({
  next_work_bias_contract: primary.contract,
  operator_decision: "needs_next_work_bias_mapping_revision"
});
const rejectReview = buildResearchCandidateManualGlobalDogfoodNextWorkBiasReview({
  next_work_bias_contract: primary.contract,
  operator_decision: "reject_next_work_bias_contract"
});
const deferReview = buildResearchCandidateManualGlobalDogfoodNextWorkBiasReview({
  next_work_bias_contract: primary.contract,
  operator_decision: "defer_next_work_bias_contract"
});
const nonAcceptedRevision = write(primary.contract, revisionReview);
const nonAcceptedReject = write(primary.contract, rejectReview);
const nonAcceptedDefer = write(primary.contract, deferReview);
insertSignalSource({ tag: "mismatch" });
const mismatch = contractAndReview("mismatch");
const countsBeforeMismatchedReview = readCounts();
const mismatchedReviewWrite = write(primary.contract, mismatch.review);
const countsAfterMismatchedReview = readCounts();
const mutatedReadbackWrite = write(primary.contract, primary.review, {
  source_next_work_signal_readback: {
    ...clone(primary.readback),
    metric_snapshot_mutated: true
  }
});
const rawTextWrite = write(primary.contract, primary.review, {
  raw_result_report_text: "raw result text must not persist"
});
const operatorNoteWrite = write(primary.contract, primary.review, {
  operator_note: "operator note must not persist"
});
const sideEffectWrite = write(primary.contract, primary.review, {
  requested_side_effects: {
    work_item_written: true,
    perspective_relay_written: true,
    proof_or_evidence_written: true,
    dogfood_metrics_written: true,
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
const wrongAuthorityReview = buildResearchCandidateManualGlobalDogfoodNextWorkBiasReview({
  next_work_bias_contract: wrongAuthorityContract,
  operator_decision: "accept_contract_for_future_next_work_bias_write_slice"
});
const wrongAuthorityWrite = write(wrongAuthorityContract, wrongAuthorityReview);
const committed = write(primary.contract, primary.review);
const duplicate = write(primary.contract, primary.review);
const reviewWithNote = buildResearchCandidateManualGlobalDogfoodNextWorkBiasReview({
  next_work_bias_contract: primary.contract,
  operator_decision: "accept_contract_for_future_next_work_bias_write_slice",
  operator_note: "A different local-only note"
});
const duplicateWithLocalNoteReview = write(primary.contract, reviewWithNote);
const wrongRollback = rollbackResearchCandidateManualGlobalDogfoodNextWorkBiasReceipt({
  receipt_id: committed.receipt.receipt_id,
  rollback_authorization: {
    authorization_kind: "manual_operator_authorized_next_work_bias_rollback",
    operator_confirmation_text: "wrong rollback confirmation",
    rollback_reason: "wrong confirmation"
  }
}, { db });
const rollback = rollbackResearchCandidateManualGlobalDogfoodNextWorkBiasReceipt({
  receipt_id: committed.receipt.receipt_id,
  rollback_authorization: {
    authorization_kind: "manual_operator_authorized_next_work_bias_rollback",
    operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_BIAS_ROLLBACK_CONFIRMATION,
    rollback_reason: "operator rollback"
  }
}, { db });
const duplicateRollback = rollbackResearchCandidateManualGlobalDogfoodNextWorkBiasReceipt({
  receipt_id: committed.receipt.receipt_id,
  rollback_authorization: {
    authorization_kind: "manual_operator_authorized_next_work_bias_rollback",
    operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_BIAS_ROLLBACK_CONFIRMATION,
    rollback_reason: "operator rollback again"
  }
}, { db });
insertSignalSource({ tag: "rolledback-source", status: "rolled_back" });
const rolledBackSource = contractAndReview("rolledback-source");
const rolledBackSourceWrite = write(rolledBackSource.contract, rolledBackSource.review);
insertSignalSource({ tag: "superseded-source", status: "superseded" });
const supersededSource = contractAndReview("superseded-source");
const supersededSourceWrite = write(supersededSource.contract, supersededSource.review);
insertSignalSource({ tag: "supersede-target" });
const supersedeTarget = contractAndReview("supersede-target");
const supersedeTargetWrite = write(supersedeTarget.contract, supersedeTarget.review);
insertSignalSource({ tag: "supersede-replacement" });
const supersedeReplacement = contractAndReview("supersede-replacement");
const supersedeWrite = write(supersedeReplacement.contract, supersedeReplacement.review, {
  operator_authorization: {
    write_mode: "supersede_previous",
    supersedes_receipt_id: supersedeTargetWrite.receipt.receipt_id
  }
});
const supersedeRolledBack = write(supersedeReplacement.contract, supersedeReplacement.review, {
  operator_authorization: {
    write_mode: "supersede_previous",
    supersedes_receipt_id: committed.receipt.receipt_id
  }
});
const readback = readResearchCandidateManualGlobalDogfoodNextWorkBias({ db, limit: 50 });
const countsFinal = readCounts();
const rawTextColumns = db.prepare("SELECT name FROM pragma_table_info('research_candidate_manual_global_dogfood_next_work_bias_records') WHERE name LIKE '%raw%' OR name LIKE '%note%'").all();

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
  mutatedReadbackWrite,
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
  rolledBackSourceWrite,
  supersededSourceWrite,
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
    mutatedReadbackWrite: sample.mutatedReadbackWrite,
    rawTextWrite: sample.rawTextWrite,
    operatorNoteWrite: sample.operatorNoteWrite,
    sideEffectWrite: sample.sideEffectWrite,
    wrongAuthorityWrite: sample.wrongAuthorityWrite,
    rolledBackSourceWrite: sample.rolledBackSourceWrite,
    supersededSourceWrite: sample.supersededSourceWrite,
    supersedeRolledBack: sample.supersedeRolledBack,
  })) {
    assert.equal(result.ok, false, `${label} must be refused`);
    assert.equal(result.result_status, "refused", `${label} must be refused`);
  }
  assert.ok(
    sample.wrongConfirmation.refusal_reasons.includes("next_work_bias_wrong_confirmation"),
  );
  assert.ok(
    sample.mismatchedReviewWrite.refusal_reasons.includes(
      "next_work_bias_review_contract_mismatch",
    ) ||
      sample.mismatchedReviewWrite.refusal_reasons.includes(
        "next_work_bias_review_source_mismatch",
      ),
  );
  assert.ok(
    sample.mutatedReadbackWrite.refusal_reasons.includes(
      "next_work_bias_source_readback_forbidden_mutation_flag",
    ),
  );
  assert.ok(
    sample.rolledBackSourceWrite.refusal_reasons.some((reason) =>
      [
        "next_work_bias_contract_not_ready",
        "next_work_bias_source_signal_receipt_not_active_committed",
        "next_work_bias_mapping_shape_invalid",
        "next_work_bias_review_not_ready_for_future_write_slice",
        "next_work_bias_review_validation_not_passed",
        "source_refs_missing",
      ].includes(reason),
    ),
  );
  assert.ok(
    sample.supersededSourceWrite.refusal_reasons.some((reason) =>
      [
        "next_work_bias_contract_not_ready",
        "next_work_bias_source_signal_receipt_not_active_committed",
        "next_work_bias_mapping_shape_invalid",
        "next_work_bias_review_not_ready_for_future_write_slice",
        "next_work_bias_review_validation_not_passed",
        "source_refs_missing",
      ].includes(reason),
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
  assert.ok(sample.committed.next_work_bias_record.next_work_bias_record_id);
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
    sample.countsFinal.research_candidate_manual_global_dogfood_next_work_bias_receipts,
    3,
    "commit, superseded target, and supersede replacement receipts should exist",
  );
  assert.equal(
    sample.countsFinal.research_candidate_manual_global_dogfood_next_work_bias_records,
    3,
    "one record per committed/superseded/rolled-back bias receipt should remain",
  );
  assert.equal(
    sample.countsFinal.research_candidate_manual_global_dogfood_next_work_bias_rollbacks,
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
  assert.equal(sample.readback.storage_path, "manual_specific_next_work_bias_tables");
  assert.ok(sample.readback.latest_active_committed);
  assert.equal(sample.readback.work_mutated, false);
  assert.equal(sample.readback.perspective_relay_written, false);
  assert.equal(sample.readback.perspective_state_written, false);
  assert.equal(sample.readback.perspective_promoted, false);
  assert.equal(sample.readback.perspective_memory_written, false);
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
      "smoke:research-candidate-manual-global-dogfood-next-work-bias-write-v0-1"
    ],
    "node scripts/smoke-research-candidate-manual-global-dogfood-next-work-bias-write-v0-1.mjs",
  );
  for (const text of [
    "manual global dogfood next-work bias",
    "manual-specific next-work bias tables",
    "duplicate_replayed",
    "no work mutation",
    "no Perspective relay",
  ]) {
    assert.ok(source.docs.includes(text), `docs must include ${text}`);
  }
}
