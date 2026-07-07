#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const files = {
  biasContractType:
    "types/research-candidate-manual-global-dogfood-next-work-bias-contract.ts",
  biasReviewType:
    "types/research-candidate-manual-global-dogfood-next-work-bias-review.ts",
  relayContractType:
    "types/research-candidate-manual-global-dogfood-perspective-relay-contract.ts",
  relayReviewType:
    "types/research-candidate-manual-global-dogfood-perspective-relay-review.ts",
  biasContractBuilder:
    "lib/research-candidate-review/manual-global-dogfood-next-work-bias-contract.ts",
  biasReviewBuilder:
    "lib/research-candidate-review/manual-global-dogfood-next-work-bias-review.ts",
  relayContractBuilder:
    "lib/research-candidate-review/manual-global-dogfood-perspective-relay-contract.ts",
  relayReviewBuilder:
    "lib/research-candidate-review/manual-global-dogfood-perspective-relay-review.ts",
  biasPanel:
    "components/research-candidate-manual-global-dogfood-next-work-bias-contract-panel.tsx",
  relayPanel:
    "components/research-candidate-manual-global-dogfood-perspective-relay-contract-panel.tsx",
  readbackPanel:
    "components/research-candidate-manual-global-dogfood-next-work-signal-readback-panel.tsx",
  nextWorkSignalSmoke:
    "scripts/smoke-research-candidate-manual-global-dogfood-next-work-signal-write-v0-1.mjs",
  smoke:
    "scripts/smoke-research-candidate-manual-global-dogfood-action-contracts-v0-1.mjs",
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
assertContractReadiness(sample);
assertReviews(sample);
assertBlockedReadbacks(sample);
assertNoWrites(sample);
assertDocsAndPackage();

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-manual-global-dogfood-action-contracts-v0-1",
      pass: true,
      next_work_bias_contract_checked: true,
      perspective_relay_contract_checked: true,
      review_bindings_checked: true,
      no_write_contracts_checked: true,
      non_target_table_counts_unchanged: true,
      static_forbidden_behavior_checked: true,
    },
    null,
    2,
  ),
);

function assertStaticContracts() {
  for (const requiredText of [
    "research_candidate_manual_global_dogfood_next_work_bias_contract",
    "research_candidate_manual_global_dogfood_next_work_bias_contract.v0.1",
    "ready_for_future_next_work_bias_write_authorization",
    "blocked_before_next_work_bias_authorization",
    "can_write_next_work_bias: false",
    "can_mutate_work: false",
    "can_write_perspective_state: false",
    "can_promote_perspective: false",
    "can_write_perspective_memory: false",
    "can_write_dogfood_metrics: false",
    "can_write_metric_snapshot: false",
    "can_write_next_work_signal_decision: false",
    "can_write_proof_or_evidence: false",
    "can_call_providers_or_openai: false",
    "can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false",
  ]) {
    assert.ok(
      source.biasContractType.includes(requiredText),
      `bias contract type must include ${requiredText}`,
    );
  }

  for (const requiredText of [
    "research_candidate_manual_global_dogfood_perspective_relay_contract",
    "research_candidate_manual_global_dogfood_perspective_relay_contract.v0.1",
    "ready_for_future_perspective_relay_write_authorization",
    "blocked_before_perspective_relay_authorization",
    "can_write_perspective_relay: false",
    "can_write_perspective_state: false",
    "can_promote_perspective: false",
    "can_write_perspective_memory: false",
    "can_write_next_work_bias: false",
    "can_mutate_work: false",
    "can_write_dogfood_metrics: false",
    "can_write_next_work_signal_decision: false",
    "can_write_proof_or_evidence: false",
    "can_call_providers_or_openai: false",
    "can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false",
  ]) {
    assert.ok(
      source.relayContractType.includes(requiredText),
      `relay contract type must include ${requiredText}`,
    );
  }

  for (const requiredText of [
    "accept_contract_for_future_next_work_bias_write_slice",
    "needs_next_work_bias_mapping_revision",
    "reject_next_work_bias_contract",
    "defer_next_work_bias_contract",
    "ready_for_future_next_work_bias_write_slice",
    "operator_note_persisted: false",
    "no_write_authority: true",
  ]) {
    assert.ok(
      source.biasReviewType.includes(requiredText),
      `bias review type must include ${requiredText}`,
    );
  }

  for (const requiredText of [
    "accept_contract_for_future_perspective_relay_write_slice",
    "needs_perspective_relay_mapping_revision",
    "reject_perspective_relay_contract",
    "defer_perspective_relay_contract",
    "ready_for_future_perspective_relay_write_slice",
    "operator_note_persisted: false",
    "no_write_authority: true",
  ]) {
    assert.ok(
      source.relayReviewType.includes(requiredText),
      `relay review type must include ${requiredText}`,
    );
  }

  const builderSource = [
    source.biasContractBuilder,
    source.biasReviewBuilder,
    source.relayContractBuilder,
    source.relayReviewBuilder,
  ].join("\n");
  assert.doesNotMatch(
    builderSource,
    /openDatabase|NextResponse|fetch\s*\(|INSERT\s+INTO|UPDATE\s+(?:research_|dogfood_|work_|perspective_|verification_|delivery_)[a-z_]+|DELETE\s+FROM|writeNextWorkBias|nextWorkBiasScopedWrite|writePerspective|promotePerspective|writeProof|writeEvidence|writeDogfoodMetric|writeResearchCandidateManualGlobalDogfoodNextWorkSignal\s*\(|writeResearchCandidateManualGlobalDogfoodMetricSnapshot\s*\(|writeResearchCandidateManualGlobalDogfoodLedger\s*\(|OPENAI_API_KEY|new\s+OpenAI|api\.openai\.com|api\.github\.com|retrieveSources\s*\(|runRetrieval\s*\(|ragIndex\s*\(|embedding\s*\(|vectorStore\s*\(|crawler\s*\(|crawlSources\s*\(/i,
    "new contract/review builders must stay pure and avoid writes, DB, network, provider, retrieval, and writer helpers",
  );

  for (const componentSource of [source.biasPanel, source.relayPanel]) {
    assert.doesNotMatch(
      componentSource,
      /fetch\s*\(|localStorage|sessionStorage|navigator\.clipboard|api\.openai\.com|github\.com/i,
      "new panels must not fetch, use browser storage/clipboard, or call external services",
    );
    assert.doesNotMatch(
      componentSource,
      /<button[^>]*>\s*(Write next-work bias|Write Perspective relay|Promote Perspective|Create work item)/i,
      "new panels must not expose write-bias, relay, promotion, or work-item buttons",
    );
  }
  assert.ok(source.biasPanel.includes("Preview bias review"));
  assert.ok(source.relayPanel.includes("Preview relay review"));
  assert.ok(
    source.readbackPanel.includes(
      "ResearchCandidateManualGlobalDogfoodNextWorkBiasContractPanel",
    ),
    "readback panel must render next-work bias contract panel",
  );
  assert.ok(
    source.readbackPanel.includes(
      "ResearchCandidateManualGlobalDogfoodPerspectiveRelayContractPanel",
    ),
    "readback panel must render Perspective relay contract panel",
  );
  assert.equal(
    existsSync(
      "app/api/research-candidate-review/manual-global-dogfood-next-work-bias",
    ),
    false,
    "no next-work bias API route should be added in preview-only PR",
  );
  assert.equal(
    existsSync(
      "app/api/research-candidate-review/manual-global-dogfood-perspective-relay",
    ),
    false,
    "no Perspective relay API route should be added in preview-only PR",
  );
}

function buildSample() {
  const code = String.raw`
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { parseManualResearchNoteToPreview } from "./lib/research-candidate-review/manual-note-parser";
import { buildResearchCandidateManualNoteHandoffSeed } from "./lib/research-candidate-review/manual-note-handoff-seed";
import { buildResearchCandidateManualNoteHandoffResultIntake } from "./lib/research-candidate-review/manual-note-handoff-result-intake";
import { buildResearchCandidateManualNoteResultIntakeOperatorReview } from "./lib/research-candidate-review/manual-note-result-intake-operator-review";
import { buildResearchCandidateManualNoteResultRecordContractPreview } from "./lib/research-candidate-review/manual-note-result-record-contract-preview";
import { RESEARCH_CANDIDATE_MANUAL_RESULT_AUTHORIZED_WRITE_CONFIRMATION } from "./types/research-candidate-manual-result-authorized-record-write";
import { RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_WRITE_CONFIRMATION } from "./types/research-candidate-manual-global-dogfood-ledger-write";
import { RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_WRITE_CONFIRMATION } from "./types/research-candidate-manual-global-dogfood-metric-snapshot-write";
import { RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_WRITE_CONFIRMATION } from "./types/research-candidate-manual-global-dogfood-next-work-signal-write";
import { writeResearchCandidateManualResultAuthorizedRecords } from "./lib/research-candidate-review/manual-result-authorized-record-write";
import { readResearchCandidateManualResultRecords } from "./lib/research-candidate-review/read-manual-result-records";
import { buildResearchCandidateManualResultDogfoodBridgePreview } from "./lib/research-candidate-review/manual-result-dogfood-bridge-preview";
import { buildResearchCandidateManualResultDogfoodLedgerAuthorizationContract } from "./lib/research-candidate-review/manual-result-dogfood-ledger-authorization-contract";
import { buildResearchCandidateManualResultDogfoodLedgerAuthorizationReview } from "./lib/research-candidate-review/manual-result-dogfood-ledger-authorization-review";
import { writeResearchCandidateManualGlobalDogfoodLedger } from "./lib/research-candidate-review/manual-global-dogfood-ledger-write";
import { readResearchCandidateManualGlobalDogfoodLedger } from "./lib/research-candidate-review/read-manual-global-dogfood-ledger";
import { buildResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjection } from "./lib/research-candidate-review/manual-global-dogfood-ledger-workbench-projection";
import { buildResearchCandidateManualGlobalDogfoodMetricSnapshotContract } from "./lib/research-candidate-review/manual-global-dogfood-metric-snapshot-contract";
import { buildResearchCandidateManualGlobalDogfoodMetricSnapshotReview } from "./lib/research-candidate-review/manual-global-dogfood-metric-snapshot-review";
import { writeResearchCandidateManualGlobalDogfoodMetricSnapshot } from "./lib/research-candidate-review/manual-global-dogfood-metric-snapshot-write";
import { buildResearchCandidateManualGlobalDogfoodNextWorkSignalContract } from "./lib/research-candidate-review/manual-global-dogfood-next-work-signal-contract";
import { buildResearchCandidateManualGlobalDogfoodNextWorkSignalReview } from "./lib/research-candidate-review/manual-global-dogfood-next-work-signal-review";
import { writeResearchCandidateManualGlobalDogfoodNextWorkSignal } from "./lib/research-candidate-review/manual-global-dogfood-next-work-signal-write";
import { readResearchCandidateManualGlobalDogfoodNextWorkSignal } from "./lib/research-candidate-review/read-manual-global-dogfood-next-work-signal";
import { buildResearchCandidateManualGlobalDogfoodNextWorkBiasContract } from "./lib/research-candidate-review/manual-global-dogfood-next-work-bias-contract";
import { buildResearchCandidateManualGlobalDogfoodNextWorkBiasReview } from "./lib/research-candidate-review/manual-global-dogfood-next-work-bias-review";
import { buildResearchCandidateManualGlobalDogfoodPerspectiveRelayContract } from "./lib/research-candidate-review/manual-global-dogfood-perspective-relay-contract";
import { buildResearchCandidateManualGlobalDogfoodPerspectiveRelayReview } from "./lib/research-candidate-review/manual-global-dogfood-perspective-relay-review";

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
  "research_candidate_manual_global_dogfood_ledger_receipts",
  "research_candidate_manual_global_dogfood_ledger_records",
  "research_candidate_manual_global_dogfood_metric_snapshot_receipts",
  "research_candidate_manual_global_dogfood_metric_snapshot_records",
  "research_candidate_manual_global_dogfood_next_work_signal_receipts",
  "research_candidate_manual_global_dogfood_next_work_signal_records",
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
function readBiasCounts() {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE '%bias%' ORDER BY name").all();
  return Object.fromEntries(tables.map((row) => [row.name, count(row.name)]));
}
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const note = [
  "Research Question: Can accepted manual next-work signal decisions feed future action contract previews?",
  "Operator Intent: Preview future next-work bias and Perspective relay contracts without writing them.",
  "Source Title: Manual dogfood action contract preview note",
  "Source Origin: local operator note",
  "Source Identifier: local-manual-dogfood-action-contracts-001",
  "Claim: Active manual next-work signal decisions can feed preview-only action contracts.",
  "Evidence: supports: The manual next-work signal decision record preserves metric, ledger, and result source refs.",
  "Tension: Bias and Perspective relay writes must stay separately authorized.",
  "Gap: Need preview-only contracts before action writes. next: contract previews",
  "Perspective Delta: Keep future Perspective relay separate from promotion and memory.",
  "Next: Implement manual action contract previews. files: lib/research-candidate-review/manual-global-dogfood-next-work-bias-contract.ts checks: npm run smoke:research-candidate-manual-global-dogfood-action-contracts-v0-1"
].join("\n");

const parserResult = parseManualResearchNoteToPreview(note);
const seed = buildResearchCandidateManualNoteHandoffSeed({
  preview: parserResult.preview,
  warnings: parserResult.warnings,
  source_metadata: {
    result_source: "local_parse",
    parser_version: parserResult.parser_version,
    input_fingerprint: "fnv1a32:manual-global-dogfood-action-contracts",
    persisted_preview_draft: false
  },
  target_label: "Manual global dogfood action contract smoke sample"
});

function makeReport() {
  return [
    "# Summary",
    "result_status: complete",
    "pr_url: https://github.com/hynk-studio/augnes/pull/1010",
    "pr_number: 1010",
    "live_host_observation: /research-candidate-review showed manual dogfood source readback.",
    "proof_evidence_rows_written: false",
    "event_rows_created_or_mutated: false",
    "work_status_changed: false",
    "state_committed_or_rejected: false",
    "observed_outcome: Helpful active source for action contract preview.",
    "",
    "## Files changed",
    "- lib/research-candidate-review/manual-global-dogfood-next-work-bias-contract.ts",
    "- lib/research-candidate-review/manual-global-dogfood-perspective-relay-contract.ts",
    "",
    "## Verification",
    "- npm run typecheck passed",
    "- npm run smoke:research-candidate-manual-global-dogfood-action-contracts-v0-1 passed",
    "",
    "## Skipped checks",
    "- No skipped checks.",
    "",
    "## Remaining caveats",
    "- Next-work bias and Perspective relay writes remain out of scope.",
    "",
    "selected candidate context outcome: helpful",
    "expected vs observed delta summary: Expected preview-only action contracts; observed source refs preserved with no next-work bias or Perspective writes.",
    "",
    "## Authority boundary statement",
    "No next-work bias, no Perspective relay, no Perspective promotion, no memory writes, no proof/evidence rows, no dogfood metrics, no work mutation, no provider calls, no GitHub automation, no source fetching, no retrieval, and no Codex execution."
  ].join("\n");
}

function makeFlow() {
  const intake = buildResearchCandidateManualNoteHandoffResultIntake({
    handoff_seed: seed,
    codex_result_report_text: makeReport(),
    source_metadata: { result_source: "sample_smoke" }
  });
  const review = buildResearchCandidateManualNoteResultIntakeOperatorReview({
    result_intake: intake,
    operator_decision: "prepare_record_contract_preview",
    operator_notes: "Local setup note that must not be stored by action contracts."
  });
  const contract = buildResearchCandidateManualNoteResultRecordContractPreview({
    result_intake: intake,
    operator_review: review
  });
  return { intake, review, contract };
}
function createManualSource() {
  const flow = makeFlow();
  const write = writeResearchCandidateManualResultAuthorizedRecords(
    {
      result_intake: flow.intake,
      operator_review: flow.review,
      record_contract_preview: flow.contract,
      operator_authorization: {
        authorization_kind: "manual_operator_authorized_record_write",
        operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_RESULT_AUTHORIZED_WRITE_CONFIRMATION,
        write_mode: "commit"
      }
    },
    { db }
  );
  if (!write.ok) {
    throw new Error("manual source write failed: " + JSON.stringify({
      intake_status: flow.intake.recommendation_status,
      intake_missing_required_return_fields: flow.intake.missing_required_return_fields,
      intake_validation: flow.intake.validation,
      review_status: flow.review.review_status,
      review_blockers: flow.review.blocker_reasons,
      contract_status: flow.contract.contract_status,
      contract_blockers: flow.contract.blocker_reasons,
      write
    }, null, 2));
  }
  const readback = readResearchCandidateManualResultRecords({
    db,
    receiptId: write.receipt.receipt_id,
    limit: 1
  });
  const bridgePreview = buildResearchCandidateManualResultDogfoodBridgePreview({
    readback,
    operator_view: "manual_action_contracts_smoke"
  });
  const contract = buildResearchCandidateManualResultDogfoodLedgerAuthorizationContract({
    bridge_preview: bridgePreview
  });
  const review = buildResearchCandidateManualResultDogfoodLedgerAuthorizationReview({
    authorization_contract: contract,
    operator_decision: "accept_contract_for_future_write_slice",
    operator_note: "Local accept note that must not persist."
  });
  return { contract, review };
}
function writeLedger(source) {
  return writeResearchCandidateManualGlobalDogfoodLedger(
    {
      authorization_contract: source.contract,
      authorization_review: source.review,
      operator_authorization: {
        authorization_kind: "manual_operator_authorized_global_dogfood_ledger_write",
        operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_WRITE_CONFIRMATION,
        write_mode: "commit"
      }
    },
    { db }
  );
}
function projectionFromReadback() {
  return buildResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjection({
    readback: readResearchCandidateManualGlobalDogfoodLedger({ db, limit: 25 }),
    operator_view: "manual_action_contracts_smoke"
  });
}
function metricContractFromProjection() {
  return buildResearchCandidateManualGlobalDogfoodMetricSnapshotContract({
    projection: projectionFromReadback()
  });
}
function acceptedMetricReview(contract) {
  return buildResearchCandidateManualGlobalDogfoodMetricSnapshotReview({
    metric_snapshot_contract: contract,
    operator_decision: "accept_contract_for_future_metric_snapshot_write_slice",
    operator_note: "Local metric note"
  });
}
function writeMetric(contract, review) {
  return writeResearchCandidateManualGlobalDogfoodMetricSnapshot(
    {
      metric_snapshot_contract: contract,
      metric_snapshot_review: review,
      operator_authorization: {
        authorization_kind: "manual_operator_authorized_dogfood_metric_snapshot_write",
        operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_WRITE_CONFIRMATION,
        write_mode: "commit"
      }
    },
    { db }
  );
}
function nextWorkContractFromProjection() {
  return buildResearchCandidateManualGlobalDogfoodNextWorkSignalContract({
    projection: projectionFromReadback()
  });
}
function acceptedNextWorkReview(contract) {
  return buildResearchCandidateManualGlobalDogfoodNextWorkSignalReview({
    next_work_signal_contract: contract,
    operator_decision: "accept_contract_for_future_next_work_signal_write_slice",
    operator_note: "Local next-work note"
  });
}
function writeNextWork(contract, review, metric) {
  return writeResearchCandidateManualGlobalDogfoodNextWorkSignal(
    {
      next_work_signal_contract: contract,
      next_work_signal_review: review,
      source_metric_snapshot_receipt_id: metric.receipt.receipt_id,
      source_metric_snapshot_record_id: metric.metric_snapshot_record.metric_snapshot_record_id,
      operator_authorization: {
        authorization_kind: "manual_operator_authorized_next_work_signal_decision_write",
        operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_WRITE_CONFIRMATION,
        write_mode: "commit"
      }
    },
    { db }
  );
}

const source = createManualSource();
const ledger = writeLedger(source);
assert.equal(ledger.ok, true);
const metricContract = metricContractFromProjection();
const metricReview = acceptedMetricReview(metricContract);
const metric = writeMetric(metricContract, metricReview);
assert.equal(metric.ok, true);
const nextWorkContract = nextWorkContractFromProjection();
const nextWorkReview = acceptedNextWorkReview(nextWorkContract);
const nextWork = writeNextWork(nextWorkContract, nextWorkReview, metric);
assert.equal(nextWork.ok, true);

const activeReadback = readResearchCandidateManualGlobalDogfoodNextWorkSignal({ db, limit: 20 });
assert.ok(activeReadback.latest_active_committed);
const countsBeforeContracts = readCounts();
const biasContract = buildResearchCandidateManualGlobalDogfoodNextWorkBiasContract({ readback: activeReadback });
const biasContractRepeat = buildResearchCandidateManualGlobalDogfoodNextWorkBiasContract({ readback: activeReadback });
const relayContract = buildResearchCandidateManualGlobalDogfoodPerspectiveRelayContract({ readback: activeReadback });
const relayContractRepeat = buildResearchCandidateManualGlobalDogfoodPerspectiveRelayContract({ readback: activeReadback });
const biasReview = buildResearchCandidateManualGlobalDogfoodNextWorkBiasReview({
  next_work_bias_contract: biasContract,
  operator_decision: "accept_contract_for_future_next_work_bias_write_slice",
  operator_note: "Local-only bias review note"
});
const relayReview = buildResearchCandidateManualGlobalDogfoodPerspectiveRelayReview({
  perspective_relay_contract: relayContract,
  operator_decision: "accept_contract_for_future_perspective_relay_write_slice",
  operator_note: "Local-only relay review note"
});
const biasRevision = buildResearchCandidateManualGlobalDogfoodNextWorkBiasReview({
  next_work_bias_contract: biasContract,
  operator_decision: "needs_next_work_bias_mapping_revision"
});
const biasReject = buildResearchCandidateManualGlobalDogfoodNextWorkBiasReview({
  next_work_bias_contract: biasContract,
  operator_decision: "reject_next_work_bias_contract"
});
const biasDefer = buildResearchCandidateManualGlobalDogfoodNextWorkBiasReview({
  next_work_bias_contract: biasContract,
  operator_decision: "defer_next_work_bias_contract"
});
const relayRevision = buildResearchCandidateManualGlobalDogfoodPerspectiveRelayReview({
  perspective_relay_contract: relayContract,
  operator_decision: "needs_perspective_relay_mapping_revision"
});
const relayReject = buildResearchCandidateManualGlobalDogfoodPerspectiveRelayReview({
  perspective_relay_contract: relayContract,
  operator_decision: "reject_perspective_relay_contract"
});
const relayDefer = buildResearchCandidateManualGlobalDogfoodPerspectiveRelayReview({
  perspective_relay_contract: relayContract,
  operator_decision: "defer_perspective_relay_contract"
});

function noActiveReadback(status) {
  const copy = clone(activeReadback);
  copy.latest_active_committed = null;
  copy.records_by_receipt = copy.records_by_receipt.map((recordSet) => ({
    ...recordSet,
    receipt: { ...recordSet.receipt, write_status: status },
    rolled_back: status === "rolled_back",
    superseded: status === "superseded"
  }));
  copy.latest_receipts = copy.latest_receipts.map((receipt) => ({
    ...receipt,
    write_status: status
  }));
  return copy;
}
function withRecordMutation(mutator) {
  const copy = clone(activeReadback);
  mutator(copy.latest_active_committed.next_work_signal_record);
  return copy;
}
const noSourceReadback = { ...clone(activeReadback), latest_active_committed: null, records_by_receipt: [], latest_receipts: [], count: 0 };
const rolledBackReadback = noActiveReadback("rolled_back");
const supersededReadback = noActiveReadback("superseded");
const missingLabelReadback = withRecordMutation((record) => {
  record.recommended_next_work_label = "";
});
const missingContextReadback = withRecordMutation((record) => {
  record.selected_candidate_context_refs = [];
});
const missingCardsReadback = withRecordMutation((record) => {
  record.source_next_work_candidate_card_ids = [];
});
const missingExplanationReadback = withRecordMutation((record) => {
  record.expected_summary = null;
  record.observed_summary = null;
  record.mismatch_or_gap_summary = null;
});

const blockedBiasNoSource = buildResearchCandidateManualGlobalDogfoodNextWorkBiasContract({ readback: noSourceReadback });
const blockedBiasRolledBack = buildResearchCandidateManualGlobalDogfoodNextWorkBiasContract({ readback: rolledBackReadback });
const blockedBiasSuperseded = buildResearchCandidateManualGlobalDogfoodNextWorkBiasContract({ readback: supersededReadback });
const blockedBiasMissingLabel = buildResearchCandidateManualGlobalDogfoodNextWorkBiasContract({ readback: missingLabelReadback });
const blockedBiasMissingContext = buildResearchCandidateManualGlobalDogfoodNextWorkBiasContract({ readback: missingContextReadback });
const blockedBiasMissingCards = buildResearchCandidateManualGlobalDogfoodNextWorkBiasContract({ readback: missingCardsReadback });
const blockedRelayNoSource = buildResearchCandidateManualGlobalDogfoodPerspectiveRelayContract({ readback: noSourceReadback });
const blockedRelayRolledBack = buildResearchCandidateManualGlobalDogfoodPerspectiveRelayContract({ readback: rolledBackReadback });
const blockedRelaySuperseded = buildResearchCandidateManualGlobalDogfoodPerspectiveRelayContract({ readback: supersededReadback });
const blockedRelayMissingExplanation = buildResearchCandidateManualGlobalDogfoodPerspectiveRelayContract({ readback: missingExplanationReadback });
const countsAfterContracts = readCounts();
const biasCounts = readBiasCounts();

console.log(JSON.stringify({
  countsBeforeContracts,
  countsAfterContracts,
  biasCounts,
  activeReadback,
  biasContract,
  biasContractRepeat,
  relayContract,
  relayContractRepeat,
  biasReview,
  relayReview,
  biasRevision,
  biasReject,
  biasDefer,
  relayRevision,
  relayReject,
  relayDefer,
  blockedBiasNoSource,
  blockedBiasRolledBack,
  blockedBiasSuperseded,
  blockedBiasMissingLabel,
  blockedBiasMissingContext,
  blockedBiasMissingCards,
  blockedRelayNoSource,
  blockedRelayRolledBack,
  blockedRelaySuperseded,
  blockedRelayMissingExplanation
}));
`;

  const output = execFileSync("node", ["--import", "tsx", "--eval", code], {
    encoding: "utf8",
  });
  return JSON.parse(output);
}

function assertContractReadiness(sample) {
  assert.equal(
    sample.biasContract.operator_authorization_mode,
    "ready_for_future_next_work_bias_write_authorization",
  );
  assert.equal(sample.biasContract.validation.passed, true);
  assert.equal(
    sample.biasContract.proposed_bias_candidate.candidate_status,
    "ready_for_future_next_work_bias_write_authorization",
  );
  assert.equal(sample.biasContract.proposed_bias_candidate.writes_now, false);
  assert.equal(
    sample.biasContract.proposed_bias_candidate.would_mutate_work,
    false,
  );
  assert.equal(
    sample.biasContract.proposed_bias_candidate.would_promote_perspective,
    false,
  );
  assert.equal(
    sample.biasContract.idempotency_contract_preview.proposed_idempotency_key,
    sample.biasContractRepeat.idempotency_contract_preview
      .proposed_idempotency_key,
  );
  assert.ok(sample.biasContract.source_next_work_signal_receipt_id);
  assert.ok(sample.biasContract.source_next_work_signal_record_id);
  assert.ok(sample.biasContract.source_projection_fingerprint);
  assert.ok(sample.biasContract.source_global_dogfood_ledger_receipt_id);
  assert.ok(sample.biasContract.source_metric_snapshot_receipt_id);
  assert.ok(sample.biasContract.source_manual_receipt_id);
  assert.ok(sample.biasContract.source_expected_observed_delta_record_ref);
  assert.ok(sample.biasContract.source_reuse_outcome_record_ref);

  assert.equal(
    sample.relayContract.operator_authorization_mode,
    "ready_for_future_perspective_relay_write_authorization",
  );
  assert.equal(sample.relayContract.validation.passed, true);
  assert.equal(
    sample.relayContract.proposed_relay_update_candidate.candidate_status,
    "ready_for_future_perspective_relay_write_authorization",
  );
  assert.equal(sample.relayContract.proposed_relay_update_candidate.writes_now, false);
  assert.equal(
    sample.relayContract.proposed_relay_update_candidate
      .would_promote_perspective,
    false,
  );
  assert.equal(
    sample.relayContract.proposed_relay_update_candidate.would_write_memory,
    false,
  );
  assert.equal(
    sample.relayContract.proposed_relay_update_candidate
      .would_write_next_work_bias,
    false,
  );
  assert.equal(
    sample.relayContract.idempotency_contract_preview.proposed_idempotency_key,
    sample.relayContractRepeat.idempotency_contract_preview
      .proposed_idempotency_key,
  );
  assert.equal(
    sample.relayContract.source_next_work_signal_receipt_id,
    sample.biasContract.source_next_work_signal_receipt_id,
  );
  assert.equal(
    sample.relayContract.source_next_work_signal_record_id,
    sample.biasContract.source_next_work_signal_record_id,
  );
}

function assertReviews(sample) {
  assert.equal(
    sample.biasReview.review_status,
    "ready_for_future_next_work_bias_write_slice",
  );
  assert.equal(sample.biasReview.validation.operator_note_persisted, false);
  assert.equal(sample.biasReview.validation.no_write_authority, true);
  assert.equal(
    sample.biasReview.accepted_mapping_summary.source_contract_fingerprint,
    sample.biasContract.validation.contract_fingerprint,
  );
  for (const review of [sample.biasRevision, sample.biasReject, sample.biasDefer]) {
    assert.notEqual(
      review.review_status,
      "ready_for_future_next_work_bias_write_slice",
    );
  }

  assert.equal(
    sample.relayReview.review_status,
    "ready_for_future_perspective_relay_write_slice",
  );
  assert.equal(sample.relayReview.validation.operator_note_persisted, false);
  assert.equal(sample.relayReview.validation.no_write_authority, true);
  assert.equal(
    sample.relayReview.accepted_mapping_summary.source_contract_fingerprint,
    sample.relayContract.validation.contract_fingerprint,
  );
  for (const review of [
    sample.relayRevision,
    sample.relayReject,
    sample.relayDefer,
  ]) {
    assert.notEqual(
      review.review_status,
      "ready_for_future_perspective_relay_write_slice",
    );
  }
}

function assertBlockedReadbacks(sample) {
  for (const [label, contract] of Object.entries({
    blockedBiasNoSource: sample.blockedBiasNoSource,
    blockedBiasRolledBack: sample.blockedBiasRolledBack,
    blockedBiasSuperseded: sample.blockedBiasSuperseded,
    blockedBiasMissingLabel: sample.blockedBiasMissingLabel,
    blockedBiasMissingContext: sample.blockedBiasMissingContext,
    blockedBiasMissingCards: sample.blockedBiasMissingCards,
  })) {
    assert.equal(
      contract.operator_authorization_mode,
      "blocked_before_next_work_bias_authorization",
      `${label} must block bias authorization`,
    );
    assert.equal(contract.validation.passed, false, `${label} must fail`);
  }
  assert.ok(
    sample.blockedBiasMissingLabel.blocker_reasons.includes(
      "recommended_next_work_label_missing",
    ),
  );
  assert.ok(
    sample.blockedBiasMissingContext.blocker_reasons.includes(
      "selected_candidate_context_refs_missing",
    ),
  );
  assert.ok(
    sample.blockedBiasMissingCards.blocker_reasons.includes(
      "source_next_work_candidate_card_ids_missing",
    ),
  );

  for (const [label, contract] of Object.entries({
    blockedRelayNoSource: sample.blockedRelayNoSource,
    blockedRelayRolledBack: sample.blockedRelayRolledBack,
    blockedRelaySuperseded: sample.blockedRelaySuperseded,
    blockedRelayMissingExplanation: sample.blockedRelayMissingExplanation,
  })) {
    assert.equal(
      contract.operator_authorization_mode,
      "blocked_before_perspective_relay_authorization",
      `${label} must block relay authorization`,
    );
    assert.equal(contract.validation.passed, false, `${label} must fail`);
  }
  assert.ok(
    sample.blockedRelayMissingExplanation.blocker_reasons.includes(
      "expected_observed_mismatch_explanatory_material_missing",
    ),
  );
}

function assertNoWrites(sample) {
  assert.deepEqual(
    sample.countsAfterContracts,
    sample.countsBeforeContracts,
    "contract/review builders must not mutate any tables",
  );
  for (const [table, value] of Object.entries(sample.biasCounts)) {
    assert.equal(value, 0, `${table} must remain empty`);
  }
  assert.equal(sample.biasContract.non_write_confirmation.next_work_bias_written, false);
  assert.equal(sample.biasContract.non_write_confirmation.work_mutated, false);
  assert.equal(sample.biasContract.non_write_confirmation.perspective_state_written, false);
  assert.equal(sample.relayContract.non_write_confirmation.perspective_relay_written, false);
  assert.equal(sample.relayContract.non_write_confirmation.perspective_promoted, false);
  assert.equal(sample.relayContract.non_write_confirmation.perspective_memory_written, false);
  assert.equal(sample.relayContract.non_write_confirmation.next_work_bias_written, false);
}

function assertDocsAndPackage() {
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-manual-global-dogfood-action-contracts-v0-1"
    ],
    "node scripts/smoke-research-candidate-manual-global-dogfood-action-contracts-v0-1.mjs",
  );
  for (const requiredText of [
    "next-work bias write authorization contract preview",
    "Perspective relay update write authorization contract preview",
    "does not write next-work bias, Perspective, work, proof/evidence, metrics, memory, product, or canonical state",
  ]) {
    assert.ok(
      source.docs.includes(requiredText),
      `docs must mention ${requiredText}`,
    );
  }
}
