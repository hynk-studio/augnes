#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const files = {
  metricContractType:
    "types/research-candidate-manual-global-dogfood-metric-snapshot-contract.ts",
  metricReviewType:
    "types/research-candidate-manual-global-dogfood-metric-snapshot-review.ts",
  nextWorkContractType:
    "types/research-candidate-manual-global-dogfood-next-work-signal-contract.ts",
  nextWorkReviewType:
    "types/research-candidate-manual-global-dogfood-next-work-signal-review.ts",
  metricContractHelper:
    "lib/research-candidate-review/manual-global-dogfood-metric-snapshot-contract.ts",
  metricReviewHelper:
    "lib/research-candidate-review/manual-global-dogfood-metric-snapshot-review.ts",
  nextWorkContractHelper:
    "lib/research-candidate-review/manual-global-dogfood-next-work-signal-contract.ts",
  nextWorkReviewHelper:
    "lib/research-candidate-review/manual-global-dogfood-next-work-signal-review.ts",
  metricPanel:
    "components/research-candidate-manual-global-dogfood-metric-snapshot-contract-panel.tsx",
  nextWorkPanel:
    "components/research-candidate-manual-global-dogfood-next-work-signal-contract-panel.tsx",
  projectionType:
    "types/research-candidate-manual-global-dogfood-ledger-workbench-projection.ts",
  projectionHelper:
    "lib/research-candidate-review/manual-global-dogfood-ledger-workbench-projection.ts",
  projectionPanel:
    "components/research-candidate-manual-global-dogfood-ledger-workbench-projection-panel.tsx",
  smoke: "scripts/smoke-research-candidate-manual-global-dogfood-loop-contracts-v0-1.mjs",
  docs: "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  packageJson: "package.json",
};

for (const filePath of Object.values(files)) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const sourceByFile = Object.fromEntries(
  Object.entries(files).map(([key, filePath]) => [
    key,
    readFileSync(filePath, "utf8"),
  ]),
);
const packageJson = JSON.parse(sourceByFile.packageJson);

assertStaticContracts();
const sample = buildSample();
assertMetricContract(sample);
assertNextWorkContract(sample);
assertReviews(sample);
assertBlockedStates(sample);
assertNonTargetTables(sample);
assertDocsAndPackage();
assertExistingSmokesPass();

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-manual-global-dogfood-loop-contracts-v0-1",
      pass: true,
      metric_contract_ready: true,
      next_work_contract_ready: true,
      review_acceptance_checked: true,
      blocked_states_checked: true,
      idempotency_deterministic: true,
      non_target_table_counts_checked: true,
      static_forbidden_behavior_checked: true,
      ui_preview_only_checked: true,
    },
    null,
    2,
  ),
);

function assertStaticContracts() {
  for (const [key, requiredText] of Object.entries({
    metricContractKind:
      "research_candidate_manual_global_dogfood_metric_snapshot_contract",
    metricContractReady: "ready_for_future_metric_snapshot_write_authorization",
    metricReviewReady: "ready_for_future_metric_snapshot_write_slice",
    nextWorkContractKind:
      "research_candidate_manual_global_dogfood_next_work_signal_contract",
    nextWorkContractReady:
      "ready_for_future_next_work_signal_write_authorization",
    nextWorkReviewReady: "ready_for_future_next_work_signal_write_slice",
  })) {
    assert.ok(
      Object.values(sourceByFile).some((source) => source.includes(requiredText)),
      `${key} must include ${requiredText}`,
    );
  }

  for (const source of [
    sourceByFile.metricContractType,
    sourceByFile.nextWorkContractType,
  ]) {
    for (const requiredText of [
      "preview_only: true",
      "read_only: true",
      "source_of_truth: false",
      "can_write_dogfood_metrics: false",
      "can_write_next_work_bias: false",
      "can_write_perspective_state: false",
      "can_write_perspective_memory: false",
      "can_write_proof_or_evidence: false",
      "can_mutate_work: false",
      "can_execute_codex: false",
      "can_call_github: false",
      "can_call_providers_or_openai: false",
      "can_fetch_sources: false",
      "can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false",
      "can_allocate_product_ids: false",
      "can_execute_product_write: false",
    ]) {
      assert.ok(source.includes(requiredText), `type must include ${requiredText}`);
    }
  }

  for (const source of [
    sourceByFile.metricContractHelper,
    sourceByFile.metricReviewHelper,
    sourceByFile.nextWorkContractHelper,
    sourceByFile.nextWorkReviewHelper,
  ]) {
    assert.ok(
      source.includes("fnv1a32_canonical_json_v0_1"),
      "builders must use stable deterministic fingerprinting",
    );
    assert.doesNotMatch(
      source,
      /openDatabase|NextResponse|fetch\s*\(|INSERT\s+INTO|UPDATE\s+\w+|DELETE\s+FROM|writeDogfoodMetric|writeNextWorkBias|writePerspective|writeProof|writeEvidence|executeCodex|runCodex|GITHUB_TOKEN|OPENAI_API_KEY|new\s+OpenAI|api\.openai\.com|api\.github\.com|retrieveSources\s*\(|runRetrieval\s*\(|ragIndex\s*\(|embedding\s*\(|vectorStore\s*\(|crawler\s*\(|crawlSources\s*\(/i,
      "new builders and reviews must stay pure and non-writing",
    );
  }

  for (const source of [sourceByFile.metricPanel, sourceByFile.nextWorkPanel]) {
    const normalizedPanelSource = source.replace(/\s+/g, " ");
    assert.doesNotMatch(
      source,
      /fetch\s*\(|localStorage|sessionStorage|navigator\.clipboard|api\/|dogfood\/metric-snapshots|next-work-signal-decisions|api\.openai\.com|github\.com/i,
      "new panels must not fetch, use storage/clipboard, or call forbidden routes",
    );
    assert.doesNotMatch(
      source,
      />\s*Write\s+/i,
      "new panels must not render write buttons",
    );
    assert.match(
      normalizedPanelSource,
      /does not write dogfood metrics|does not write\s+next-work bias/i,
      "new panels must include explicit no-write copy",
    );
  }

  assert.ok(
    sourceByFile.projectionPanel.includes(
      "ResearchCandidateManualGlobalDogfoodMetricSnapshotContractPanel",
    ) &&
      sourceByFile.projectionPanel.includes(
        "ResearchCandidateManualGlobalDogfoodNextWorkSignalContractPanel",
      ),
    "projection panel must render both contract panels",
  );
  assert.equal(
    existsSync(
      "app/api/research-candidate-review/manual-global-dogfood-loop-contracts/route.ts",
    ),
    false,
    "loop contracts must not add an API route",
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
import { buildResearchCandidateManualGlobalDogfoodNextWorkSignalContract } from "./lib/research-candidate-review/manual-global-dogfood-next-work-signal-contract";
import { buildResearchCandidateManualGlobalDogfoodMetricSnapshotReview } from "./lib/research-candidate-review/manual-global-dogfood-metric-snapshot-review";
import { buildResearchCandidateManualGlobalDogfoodNextWorkSignalReview } from "./lib/research-candidate-review/manual-global-dogfood-next-work-signal-review";

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

const note = [
  "Research Question: Can manual global dogfood projection feed metric and next-work contract previews?",
  "Operator Intent: Build preview-only authorization contracts from the read-only projection.",
  "Source Title: Manual global dogfood loop contracts note",
  "Source Origin: local operator note",
  "Source Identifier: local-manual-global-dogfood-loop-contracts-001",
  "Claim: Projection candidate material can feed preview-only contract mappings.",
  "Evidence: supports: The projection preserves manual ledger source refs and expected/observed summaries.",
  "Tension: Contracts are not metrics, next-work bias, Perspective, proof/evidence, or work state.",
  "Gap: Need local contract reviews before any future write. next: contract previews",
  "Perspective Delta: Keep future writes separately authorized.",
  "Next: Implement metric and next-work contract previews. files: lib/research-candidate-review/manual-global-dogfood-metric-snapshot-contract.ts checks: npm run smoke:research-candidate-manual-global-dogfood-loop-contracts-v0-1"
].join("\\n");

const parserResult = parseManualResearchNoteToPreview(note);
const seed = buildResearchCandidateManualNoteHandoffSeed({
  preview: parserResult.preview,
  warnings: parserResult.warnings,
  source_metadata: {
    result_source: "local_parse",
    parser_version: parserResult.parser_version,
    input_fingerprint: "fnv1a32:manual-global-dogfood-loop-contracts",
    persisted_preview_draft: false
  },
  target_label: "Manual global dogfood loop contracts smoke sample"
});

function makeReport({ outcome, suffix }) {
  return [
    "# Summary",
    "result_status: complete",
    "pr_url: https://github.com/hynk-studio/augnes/pull/1007",
    "pr_number: 1007",
    "live_host_observation: /research-candidate-review showed the manual global dogfood loop contract previews.",
    "proof_evidence_rows_written: false",
    "event_rows_created_or_mutated: false",
    "work_status_changed: false",
    "state_committed_or_rejected: false",
    "observed_outcome: " + suffix,
    "",
    "## Files changed",
    "- lib/research-candidate-review/manual-global-dogfood-metric-snapshot-contract.ts",
    "- lib/research-candidate-review/manual-global-dogfood-next-work-signal-contract.ts",
    "",
    "## Verification",
    "- npm run typecheck passed",
    "- npm run smoke:research-candidate-manual-global-dogfood-loop-contracts-v0-1 passed",
    "",
    "## Skipped checks",
    "- No skipped checks.",
    "",
    "## Remaining caveats",
    "- Metric and next-work writes remain out of scope.",
    "",
    "selected candidate context outcome: " + outcome,
    "expected vs observed delta summary: Manual global dogfood projection can feed preview-only metric and next-work contract reviews.",
    "",
    "## Authority boundary statement",
    "Preview-only contracts and local reviews only; no dogfood metrics, no next-work bias, no proof/evidence rows, no work status change, no Perspective promotion, no memory writes, no raw text persistence, no provider calls, no GitHub automation, no source fetching, no retrieval, and no Codex execution."
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
    operator_notes: "Local setup note that must not be stored by contracts."
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
    operator_view: "manual_global_dogfood_loop_contracts_smoke"
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

function writeRequest(source, overrides = {}) {
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
function writeGlobal(source, overrides = {}) {
  return writeResearchCandidateManualGlobalDogfoodLedger(
    writeRequest(source, overrides),
    { db }
  );
}

const sourceHelpful = createManualSource({
  outcome: "helpful",
  suffix: "Helpful source becomes rolled back context-only material."
});
const sourceStale = createManualSource({
  outcome: "stale",
  suffix: "Stale source becomes superseded context-only material."
});
const sourceNoisy = createManualSource({
  outcome: "noisy",
  suffix: "Noisy source replaces stale source as active committed material."
});

const committedHelpful = writeGlobal(sourceHelpful);
assert.equal(committedHelpful.ok, true);
const duplicateHelpful = writeGlobal(sourceHelpful);
assert.equal(duplicateHelpful.result_status, "duplicate_replayed");
const rollbackHelpful = rollbackResearchCandidateManualGlobalDogfoodLedgerReceipt(
  {
    receipt_id: committedHelpful.receipt.receipt_id,
    rollback_authorization: {
      authorization_kind: "manual_operator_authorized_global_dogfood_ledger_rollback",
      operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_ROLLBACK_CONFIRMATION,
      rollback_reason: "Smoke rollback for context-only loop contracts."
    }
  },
  { db }
);
assert.equal(rollbackHelpful.ok, true);

const committedStale = writeGlobal(sourceStale);
assert.equal(committedStale.ok, true);
const replacementNoisy = writeGlobal(sourceNoisy, {
  operator_authorization: {
    write_mode: "supersede_previous",
    supersedes_receipt_id: committedStale.receipt.receipt_id
  }
});
assert.equal(replacementNoisy.ok, true);

const readback = readResearchCandidateManualGlobalDogfoodLedger({ db, limit: 20 });
const projection = buildResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjection({
  readback,
  operator_view: "loop_contracts_smoke"
});
const metricContract = buildResearchCandidateManualGlobalDogfoodMetricSnapshotContract({
  projection
});
const metricContractAgain = buildResearchCandidateManualGlobalDogfoodMetricSnapshotContract({
  projection
});
const nextWorkContract = buildResearchCandidateManualGlobalDogfoodNextWorkSignalContract({
  projection
});
const nextWorkContractAgain = buildResearchCandidateManualGlobalDogfoodNextWorkSignalContract({
  projection
});

const metricAcceptReview = buildResearchCandidateManualGlobalDogfoodMetricSnapshotReview({
  metric_snapshot_contract: metricContract,
  operator_decision: "accept_contract_for_future_metric_snapshot_write_slice",
  operator_note: "Local-only metric review note."
});
const nextWorkAcceptReview = buildResearchCandidateManualGlobalDogfoodNextWorkSignalReview({
  next_work_signal_contract: nextWorkContract,
  operator_decision: "accept_contract_for_future_next_work_signal_write_slice",
  operator_note: "Local-only next-work review note."
});

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
const nextWorkRevisionReview = buildResearchCandidateManualGlobalDogfoodNextWorkSignalReview({
  next_work_signal_contract: nextWorkContract,
  operator_decision: "needs_next_work_mapping_revision"
});
const nextWorkRejectReview = buildResearchCandidateManualGlobalDogfoodNextWorkSignalReview({
  next_work_signal_contract: nextWorkContract,
  operator_decision: "reject_next_work_contract"
});
const nextWorkDeferReview = buildResearchCandidateManualGlobalDogfoodNextWorkSignalReview({
  next_work_signal_contract: nextWorkContract,
  operator_decision: "defer_next_work_contract"
});

const contextOnlyRecords = readback.records_by_receipt.filter(
  (recordSet) => recordSet.rolled_back || recordSet.superseded
);
const contextOnlyProjection = buildResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjection({
  readback: {
    ...readback,
    records_by_receipt: contextOnlyRecords,
    latest_receipts: contextOnlyRecords.map((recordSet) => recordSet.receipt),
    latest_active_committed: null,
    count: contextOnlyRecords.length
  },
  operator_view: "context_only_loop_contracts_smoke"
});
const blockedMetricContract = buildResearchCandidateManualGlobalDogfoodMetricSnapshotContract({
  projection: contextOnlyProjection
});
const blockedNextWorkContract = buildResearchCandidateManualGlobalDogfoodNextWorkSignalContract({
  projection: contextOnlyProjection
});

const missingFingerprintProjection = {
  ...projection,
  latest_ledger_record_summary: {
    ...projection.latest_ledger_record_summary,
    source_handoff_seed_fingerprint: null
  }
};
const missingFingerprintMetricContract = buildResearchCandidateManualGlobalDogfoodMetricSnapshotContract({
  projection: missingFingerprintProjection
});
const missingFingerprintNextWorkContract = buildResearchCandidateManualGlobalDogfoodNextWorkSignalContract({
  projection: missingFingerprintProjection
});

const missingCardsProjection = {
  ...projection,
  next_work_signal_candidates: []
};
const missingCardsNextWorkContract = buildResearchCandidateManualGlobalDogfoodNextWorkSignalContract({
  projection: missingCardsProjection
});

const counts = readCounts();
const nextWorkBiasCounts = readNextWorkBiasCounts();

console.log(JSON.stringify({
  replacementNoisy,
  readback,
  projection,
  metricContract,
  metricContractAgain,
  nextWorkContract,
  nextWorkContractAgain,
  metricAcceptReview,
  nextWorkAcceptReview,
  metricRevisionReview,
  metricRejectReview,
  metricDeferReview,
  nextWorkRevisionReview,
  nextWorkRejectReview,
  nextWorkDeferReview,
  contextOnlyProjection,
  blockedMetricContract,
  blockedNextWorkContract,
  missingFingerprintMetricContract,
  missingFingerprintNextWorkContract,
  missingCardsNextWorkContract,
  counts,
  nextWorkBiasCounts
}));
`;

  const output = execFileSync("node", ["--import", "tsx", "--eval", code], {
    encoding: "utf8",
  });
  return JSON.parse(output);
}

function assertMetricContract(sample) {
  const contract = sample.metricContract;
  assert.equal(
    contract.contract_kind,
    "research_candidate_manual_global_dogfood_metric_snapshot_contract",
  );
  assert.equal(
    contract.operator_authorization_mode,
    "ready_for_future_metric_snapshot_write_authorization",
  );
  assert.equal(contract.validation.passed, true);
  assert.equal(contract.blocker_reasons.length, 0);
  assert.equal(
    contract.source_projection_fingerprint,
    sample.projection.projection_fingerprint,
  );
  assert.equal(
    contract.source_latest_active_committed_receipt_id,
    sample.projection.latest_active_committed_receipt_id,
  );
  assert.equal(
    contract.source_manual_receipt_id,
    sample.projection.latest_ledger_record_summary.source_manual_receipt_id,
  );
  assert.equal(
    contract.source_contract_fingerprint,
    sample.projection.latest_ledger_record_summary.source_contract_fingerprint,
  );
  assert.equal(
    contract.source_authorization_review_fingerprint,
    sample.projection.latest_ledger_record_summary
      .source_authorization_review_fingerprint,
  );
  assert.equal(
    contract.source_handoff_seed_fingerprint,
    sample.projection.latest_ledger_record_summary
      .source_handoff_seed_fingerprint,
  );
  assert.equal(
    contract.source_result_text_fingerprint,
    sample.projection.latest_ledger_record_summary
      .source_result_text_fingerprint,
  );
  assert.equal(
    contract.source_expected_observed_delta_record_ref,
    sample.projection.latest_ledger_record_summary
      .source_expected_observed_delta_record_ref,
  );
  assert.equal(
    contract.source_reuse_outcome_record_ref,
    sample.projection.latest_ledger_record_summary
      .source_reuse_outcome_record_ref,
  );
  assert.deepEqual(
    contract.proposed_metric_dimensions.selected_candidate_context_refs,
    sample.projection.latest_ledger_record_summary.selected_candidate_context_refs,
  );
  assert.equal(
    contract.proposed_metric_snapshot_mapping.outcome_label,
    sample.projection.latest_ledger_record_summary.outcome_label,
  );
  assert.equal(
    contract.proposed_metric_snapshot_mapping.outcome_signal,
    sample.projection.outcome_signal_summary.latest_outcome_signal,
  );
  assert.equal(
    contract.proposed_metric_snapshot_mapping.can_write_metric_now,
    false,
  );
  assert.equal(contract.proposed_metric_counters.writes_now, false);
  assert.equal(
    contract.proposed_metric_counters
      .manual_global_dogfood_ledger_active_candidate_count,
    1,
  );
  assert.equal(
    contract.proposed_metric_counters
      .manual_global_dogfood_negative_signal_count,
    1,
  );
  assert.equal(
    contract.idempotency_contract_preview.proposed_idempotency_key,
    sample.metricContractAgain.idempotency_contract_preview
      .proposed_idempotency_key,
  );
  assert.equal(contract.idempotency_contract_preview.durable_id_allocated, false);
  assert.equal(contract.idempotency_contract_preview.writes_now, false);
  assert.equal(contract.authority_boundary.can_write_dogfood_metrics, false);
  assert.equal(contract.authority_boundary.can_write_metric_snapshot, false);
}

function assertNextWorkContract(sample) {
  const contract = sample.nextWorkContract;
  assert.equal(
    contract.contract_kind,
    "research_candidate_manual_global_dogfood_next_work_signal_contract",
  );
  assert.equal(
    contract.operator_authorization_mode,
    "ready_for_future_next_work_signal_write_authorization",
  );
  assert.equal(contract.validation.passed, true);
  assert.equal(contract.blocker_reasons.length, 0);
  assert.equal(
    contract.source_projection_fingerprint,
    sample.projection.projection_fingerprint,
  );
  assert.equal(
    contract.source_latest_active_committed_receipt_id,
    sample.projection.latest_active_committed_receipt_id,
  );
  assert.equal(
    contract.source_manual_receipt_id,
    sample.projection.latest_ledger_record_summary.source_manual_receipt_id,
  );
  assert.equal(
    contract.source_contract_fingerprint,
    sample.projection.latest_ledger_record_summary.source_contract_fingerprint,
  );
  assert.equal(
    contract.source_authorization_review_fingerprint,
    sample.projection.latest_ledger_record_summary
      .source_authorization_review_fingerprint,
  );
  assert.equal(
    contract.source_handoff_seed_fingerprint,
    sample.projection.latest_ledger_record_summary
      .source_handoff_seed_fingerprint,
  );
  assert.equal(
    contract.source_result_text_fingerprint,
    sample.projection.latest_ledger_record_summary
      .source_result_text_fingerprint,
  );
  assert.equal(
    contract.source_expected_observed_delta_record_ref,
    sample.projection.latest_ledger_record_summary
      .source_expected_observed_delta_record_ref,
  );
  assert.equal(
    contract.source_reuse_outcome_record_ref,
    sample.projection.latest_ledger_record_summary
      .source_reuse_outcome_record_ref,
  );
  assert.deepEqual(
    contract.proposed_next_work_signal_mapping.selected_candidate_context_refs,
    sample.projection.latest_ledger_record_summary.selected_candidate_context_refs,
  );
  assert.equal(
    contract.proposed_next_work_signal_mapping.outcome_label,
    sample.projection.latest_ledger_record_summary.outcome_label,
  );
  assert.equal(
    contract.proposed_next_work_signal_mapping.outcome_signal,
    sample.projection.outcome_signal_summary.latest_outcome_signal,
  );
  assert.ok(contract.source_next_work_candidate_card_ids.length > 0);
  assert.equal(
    contract.proposed_decision_inputs.selected_card_write_flags_all_false,
    true,
  );
  assert.equal(
    contract.proposed_next_work_signal_mapping.can_write_next_work_bias_now,
    false,
  );
  assert.equal(
    contract.proposed_next_work_signal_mapping.can_write_perspective_now,
    false,
  );
  assert.equal(contract.proposed_decision_candidate.writes_now, false);
  assert.equal(
    contract.idempotency_contract_preview.proposed_idempotency_key,
    sample.nextWorkContractAgain.idempotency_contract_preview
      .proposed_idempotency_key,
  );
  assert.equal(contract.idempotency_contract_preview.durable_id_allocated, false);
  assert.equal(contract.idempotency_contract_preview.writes_now, false);
  assert.equal(contract.authority_boundary.can_write_next_work_bias, false);
  assert.equal(contract.authority_boundary.can_write_perspective_state, false);
}

function assertReviews(sample) {
  assert.equal(
    sample.metricAcceptReview.review_status,
    "ready_for_future_metric_snapshot_write_slice",
  );
  assert.equal(
    sample.nextWorkAcceptReview.review_status,
    "ready_for_future_next_work_signal_write_slice",
  );
  assert.equal(
    sample.metricAcceptReview.validation.operator_note_persisted,
    false,
  );
  assert.equal(
    sample.nextWorkAcceptReview.validation.operator_note_persisted,
    false,
  );
  assert.equal(sample.metricAcceptReview.validation.no_write_authority, true);
  assert.equal(sample.nextWorkAcceptReview.validation.no_write_authority, true);
  assert.equal(
    sample.metricRevisionReview.review_status,
    "blocked_metric_mapping_revision_required",
  );
  assert.equal(sample.metricRejectReview.review_status, "rejected_by_operator");
  assert.equal(sample.metricDeferReview.review_status, "deferred_by_operator");
  assert.equal(
    sample.nextWorkRevisionReview.review_status,
    "blocked_next_work_mapping_revision_required",
  );
  assert.equal(
    sample.nextWorkRejectReview.review_status,
    "rejected_by_operator",
  );
  assert.equal(
    sample.nextWorkDeferReview.review_status,
    "deferred_by_operator",
  );
  for (const review of [
    sample.metricRevisionReview,
    sample.metricRejectReview,
    sample.metricDeferReview,
    sample.nextWorkRevisionReview,
    sample.nextWorkRejectReview,
    sample.nextWorkDeferReview,
  ]) {
    assert.equal(review.accepted_mapping_summary, null);
    assert.equal(review.validation.passed, false);
  }
}

function assertBlockedStates(sample) {
  assert.equal(
    sample.blockedMetricContract.operator_authorization_mode,
    "blocked_before_metric_snapshot_authorization",
  );
  assert.ok(
    sample.blockedMetricContract.blocker_reasons.some((reason) =>
      reason.includes("projection_not_ready"),
    ),
  );
  assert.equal(
    sample.blockedNextWorkContract.operator_authorization_mode,
    "blocked_before_next_work_signal_authorization",
  );
  assert.ok(
    sample.blockedNextWorkContract.blocker_reasons.some((reason) =>
      reason.includes("projection_not_ready"),
    ),
  );
  assert.ok(
    sample.missingFingerprintMetricContract.blocker_reasons.includes(
      "field_gap:source_handoff_seed_fingerprint",
    ),
  );
  assert.ok(
    sample.missingFingerprintNextWorkContract.blocker_reasons.includes(
      "field_gap:source_handoff_seed_fingerprint",
    ),
  );
  assert.ok(
    sample.missingCardsNextWorkContract.blocker_reasons.includes(
      "primary_next_work_candidate_cards_missing",
    ),
  );
}

function assertNonTargetTables(sample) {
  assert.equal(
    sample.counts.research_candidate_manual_global_dogfood_ledger_receipts,
    3,
  );
  assert.equal(
    sample.counts.research_candidate_manual_global_dogfood_ledger_records,
    3,
  );
  assert.equal(
    sample.counts.research_candidate_manual_global_dogfood_ledger_rollbacks,
    1,
  );
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
    assert.equal(sample.counts[table], 0, `${table} must remain zero`);
  }
  for (const [table, count] of Object.entries(sample.nextWorkBiasCounts)) {
    assert.equal(count, 0, `${table} must remain zero`);
  }
}

function assertDocsAndPackage() {
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-manual-global-dogfood-loop-contracts-v0-1"
    ],
    "node scripts/smoke-research-candidate-manual-global-dogfood-loop-contracts-v0-1.mjs",
  );
  const normalized = sourceByFile.docs.replace(/\s+/g, " ");
  for (const requiredText of [
    "Manual Global Dogfood Loop Contract Previews v0.1 Pointer",
    "dogfood metric snapshot refresh authorization contract preview",
    "next-work signal decision authorization contract preview",
    "Neither contract writes metrics",
    "next-work bias",
    "Perspective",
    "proof/evidence",
    "work",
    "memory",
    "product",
    "separate explicitly authorized idempotent write slice",
  ]) {
    assert.ok(normalized.includes(requiredText), `docs must include ${requiredText}`);
  }
}

function assertExistingSmokesPass() {
  for (const script of [
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
