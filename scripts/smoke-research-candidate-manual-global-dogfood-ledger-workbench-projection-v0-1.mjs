#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const typePath =
  "types/research-candidate-manual-global-dogfood-ledger-workbench-projection.ts";
const builderPath =
  "lib/research-candidate-review/manual-global-dogfood-ledger-workbench-projection.ts";
const panelPath =
  "components/research-candidate-manual-global-dogfood-ledger-workbench-projection-panel.tsx";
const readbackPanelPath =
  "components/research-candidate-manual-global-dogfood-ledger-readback-panel.tsx";
const packagePath = "package.json";
const docsPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";

for (const filePath of [
  typePath,
  builderPath,
  panelPath,
  readbackPanelPath,
  packagePath,
  docsPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const typeSource = readFileSync(typePath, "utf8");
const builderSource = readFileSync(builderPath, "utf8");
const panelSource = readFileSync(panelPath, "utf8");
const readbackPanelSource = readFileSync(readbackPanelPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const docsSource = readFileSync(docsPath, "utf8");

assertTypeAndStaticBoundaries();
const sample = buildSample();
assertProjection(sample);
assertBlockedStates(sample);
assertNonTargetTables(sample);
assertDocsAndPackage();

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-manual-global-dogfood-ledger-workbench-projection-v0-1",
      pass: true,
      latest_active_committed_selected: true,
      context_only_rolled_back_and_superseded_checked: true,
      source_refs_and_fingerprints_preserved: true,
      next_work_candidates_read_only: true,
      loop_spine_alignment_read_only: true,
      blocked_states_checked: true,
      non_target_table_counts_checked: true,
      static_forbidden_behavior_checked: true,
      existing_smokes_run_separately: true,
    },
    null,
    2,
  ),
);

function assertTypeAndStaticBoundaries() {
  for (const requiredText of [
    "research_candidate_manual_global_dogfood_ledger_workbench_projection",
    "research_candidate_manual_global_dogfood_ledger_workbench_projection.v0.1",
    "ready_for_workbench_loop_spine_preview",
    "blocked_no_global_dogfood_ledger_records",
    "blocked_no_active_committed_ledger_receipt",
    "manual_global_dogfood_latest_outcome",
    "manual_global_dogfood_expected_observed_delta",
    "manual_global_dogfood_context_only_rolled_back",
    "manual_global_dogfood_context_only_superseded",
    "would_write_next_work_bias: false",
    "would_write_perspective: false",
    "would_write_metrics: false",
    "can_write_dogfood_metrics: false",
    "can_write_dogfood_ledger: false",
    "can_mutate_manual_global_dogfood_ledger: false",
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
  ]) {
    assert.ok(typeSource.includes(requiredText), `type must include ${requiredText}`);
  }

  assert.ok(
    builderSource.includes("fnv1a32_canonical_json_v0_1"),
    "builder must use deterministic browser-safe fingerprinting",
  );
  assert.doesNotMatch(
    builderSource,
    /openDatabase|NextResponse|fetch\s*\(|INSERT\s+INTO|UPDATE\s+\w+|DELETE\s+FROM|writeDogfood|writePerspective|writeNextWork|writeProof|writeEvidence|executeCodex|runCodex|GITHUB_TOKEN|OPENAI_API_KEY|new\s+OpenAI|api\.openai\.com|retrieveSources\s*\(|runRetrieval\s*\(|ragIndex\s*\(|vectorStore\s*\(|crawler\s*\(|crawlSources\s*\(/i,
    "projection builder must stay pure and non-writing",
  );
  assert.doesNotMatch(
    panelSource,
    /fetch\s*\(|<button|onClick|localStorage|sessionStorage|navigator\.clipboard|api\/dogfooding|api\/workplane|api\/perspective|api\.openai\.com|github\.com/i,
    "projection panel must not add fetch, write buttons, storage, clipboard, or forbidden network behavior",
  );
  assert.ok(
    panelSource
      .replace(/\s+/g, " ")
      .includes(
        "This projection does not write dogfood metrics, next-work bias, Perspective, proof/evidence, work status, memory, or product state.",
      ),
    "panel must include explicit no-write statement",
  );
  assert.ok(
    readbackPanelSource.includes(
      "ResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjectionPanel",
    ) &&
      readbackPanelSource.includes(
        "buildResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjection",
      ),
    "readback panel must render the projection panel",
  );
  assert.equal(
    existsSync(
      "app/api/research-candidate-review/manual-global-dogfood-ledger-workbench-projection/route.ts",
    ),
    false,
    "projection must not add an API route",
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
  "Research Question: Can manual global dogfood ledger readback project into a Workbench loop-spine read model?",
  "Operator Intent: Project only readback material into candidate loop-spine signals.",
  "Source Title: Manual global dogfood ledger workbench projection note",
  "Source Origin: local operator note",
  "Source Identifier: local-manual-global-dogfood-workbench-projection-001",
  "Claim: Manual global dogfood ledger rows can inform read-only next-work candidate material.",
  "Evidence: supports: The ledger record preserves manual EOD and Reuse Outcome source refs.",
  "Tension: The projection is not a metric write, Perspective promotion, proof/evidence row, or next-work-bias update.",
  "Gap: Need visible loop-spine projection without writes. next: workbench projection",
  "Perspective Delta: Keep signal candidates read-only until separately authorized.",
  "Next: Implement Workbench loop-spine projection. files: lib/research-candidate-review/manual-global-dogfood-ledger-workbench-projection.ts checks: npm run smoke:research-candidate-manual-global-dogfood-ledger-workbench-projection-v0-1"
].join("\\n");

const parserResult = parseManualResearchNoteToPreview(note);
const seed = buildResearchCandidateManualNoteHandoffSeed({
  preview: parserResult.preview,
  warnings: parserResult.warnings,
  source_metadata: {
    result_source: "local_parse",
    parser_version: parserResult.parser_version,
    input_fingerprint: "fnv1a32:manual-global-dogfood-workbench-projection",
    persisted_preview_draft: false
  },
  target_label: "Manual global dogfood workbench projection smoke sample"
});

function makeReport({ outcome, suffix }) {
  return [
    "# Summary",
    "result_status: complete",
    "pr_url: https://github.com/hynk-studio/augnes/pull/1006",
    "pr_number: 1006",
    "live_host_observation: /research-candidate-review showed the manual global dogfood workbench projection.",
    "proof_evidence_rows_written: false",
    "event_rows_created_or_mutated: false",
    "work_status_changed: false",
    "state_committed_or_rejected: false",
    "observed_outcome: " + suffix,
    "",
    "## Files changed",
    "- lib/research-candidate-review/manual-global-dogfood-ledger-workbench-projection.ts",
    "- components/research-candidate-manual-global-dogfood-ledger-workbench-projection-panel.tsx",
    "",
    "## Verification",
    "- npm run typecheck passed",
    "- npm run smoke:research-candidate-manual-global-dogfood-ledger-workbench-projection-v0-1 passed",
    "",
    "## Skipped checks",
    "- No skipped checks.",
    "",
    "## Remaining caveats",
    "- Dogfood metrics and next-work-bias writes remain out of scope.",
    "",
    "selected candidate context outcome: " + outcome,
    "expected vs observed delta summary: Manual global dogfood ledger readback projects into read-only loop-spine candidate material.",
    "",
    "## Authority boundary statement",
    "Read-only Workbench loop-spine projection only; no dogfood metrics, no next-work bias, no proof/evidence rows, no work status change, no Perspective promotion, no memory writes, no raw text persistence, no provider calls, no GitHub automation, no source fetching, no retrieval, and no Codex execution."
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
    operator_notes: "Local setup note that must not be stored by the projection."
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
    operator_view: "manual_global_dogfood_workbench_projection_smoke"
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
  suffix: "Noisy source replaces the stale source as active committed material."
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
      rollback_reason: "Smoke rollback for context-only projection."
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
  operator_view: "smoke"
});

const contextOnlyRecords = readback.records_by_receipt.filter(
  (recordSet) => recordSet.rolled_back || recordSet.superseded
);
const contextOnlyReadback = {
  ...readback,
  records_by_receipt: contextOnlyRecords,
  latest_receipts: contextOnlyRecords.map((recordSet) => recordSet.receipt),
  latest_active_committed: null,
  count: contextOnlyRecords.length
};
const contextOnlyProjection = buildResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjection({
  readback: contextOnlyReadback,
  operator_view: "context_only_smoke"
});

const emptyDb = new Database(":memory:");
emptyDb.pragma("foreign_keys = ON");
emptyDb.exec(readFileSync("lib/db/schema.sql", "utf8"));
const emptyReadback = readResearchCandidateManualGlobalDogfoodLedger({
  db: emptyDb,
  limit: 20
});
const emptyProjection = buildResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjection({
  readback: emptyReadback,
  operator_view: "empty_smoke"
});

const counts = readCounts();
const nextWorkBiasCounts = readNextWorkBiasCounts();

console.log(JSON.stringify({
  committedHelpful,
  duplicateHelpful,
  rollbackHelpful,
  committedStale,
  replacementNoisy,
  readback,
  projection,
  contextOnlyProjection,
  emptyProjection,
  sourceNoisyContract: sourceNoisy.contract,
  sourceNoisyReview: sourceNoisy.review,
  counts,
  nextWorkBiasCounts
}));
`;

  const output = execFileSync("node", ["--import", "tsx", "--eval", code], {
    encoding: "utf8",
  });
  return JSON.parse(output);
}

function assertProjection(sample) {
  const projection = sample.projection;
  assert.equal(
    projection.projection_kind,
    "research_candidate_manual_global_dogfood_ledger_workbench_projection",
  );
  assert.equal(
    projection.projection_version,
    "research_candidate_manual_global_dogfood_ledger_workbench_projection.v0.1",
  );
  assert.equal(
    projection.projection_readiness,
    "ready_for_workbench_loop_spine_preview",
  );
  assert.equal(
    projection.latest_active_committed_receipt_id,
    sample.replacementNoisy.receipt.receipt_id,
  );
  assert.equal(projection.ledger_status_summary.total_receipts, 3);
  assert.equal(projection.ledger_status_summary.active_committed_count, 1);
  assert.equal(projection.ledger_status_summary.rolled_back_count, 1);
  assert.equal(projection.ledger_status_summary.superseded_count, 1);
  assert.equal(projection.ledger_status_summary.context_only_count, 2);

  const latest = projection.latest_ledger_record_summary;
  const expectedMapping =
    sample.sourceNoisyContract.proposed_global_dogfood_mapping;
  assert.equal(latest.source_manual_receipt_id, expectedMapping.source_manual_receipt_id);
  assert.equal(
    latest.source_contract_fingerprint,
    sample.sourceNoisyContract.validation.contract_fingerprint,
  );
  assert.equal(
    latest.source_authorization_review_fingerprint,
    sample.sourceNoisyReview.validation.review_fingerprint,
  );
  assert.equal(
    latest.source_handoff_seed_fingerprint,
    expectedMapping.source_handoff_seed_fingerprint,
  );
  assert.equal(
    latest.source_result_text_fingerprint,
    expectedMapping.source_result_text_fingerprint,
  );
  assert.equal(
    latest.source_expected_observed_delta_record_ref,
    expectedMapping.source_expected_observed_delta_record_ref,
  );
  assert.equal(
    latest.source_reuse_outcome_record_ref,
    expectedMapping.source_reuse_outcome_record_ref,
  );
  assert.equal(latest.outcome_label, "noisy");
  assert.ok(latest.selected_candidate_context_ref_count > 0);
  assert.ok(latest.expected_summary);
  assert.ok(latest.observed_summary);
  assert.ok(latest.mismatch_or_gap_summary);

  assert.equal(projection.outcome_signal_summary.outcome_label_counts.helpful, 1);
  assert.equal(projection.outcome_signal_summary.outcome_label_counts.stale, 1);
  assert.equal(projection.outcome_signal_summary.outcome_label_counts.noisy, 1);
  assert.equal(projection.outcome_signal_summary.latest_active_outcome_is_noisy, true);
  assert.equal(projection.outcome_signal_summary.latest_outcome_signal, "negative");
  assert.equal(projection.outcome_signal_summary.no_salience_update, true);
  assert.equal(projection.outcome_signal_summary.no_metric_write, true);

  assert.equal(
    projection.expected_observed_signal_summary.observed_summary_present,
    true,
  );
  assert.equal(
    projection.expected_observed_signal_summary.no_perspective_promotion,
    true,
  );
  assert.equal(
    projection.expected_observed_signal_summary.no_proof_or_evidence,
    true,
  );

  assert.ok(projection.next_work_signal_candidates.length >= 4);
  assert.ok(
    projection.next_work_signal_candidates.some(
      (card) =>
        card.card_kind === "manual_global_dogfood_latest_outcome" &&
        card.card_status === "primary_next_work_candidate",
    ),
  );
  assert.ok(
    projection.next_work_signal_candidates.some(
      (card) =>
        card.card_kind === "manual_global_dogfood_expected_observed_delta" &&
        card.card_status === "primary_next_work_candidate",
    ),
  );
  assert.ok(
    projection.next_work_signal_candidates.some(
      (card) =>
        card.card_kind === "manual_global_dogfood_context_only_rolled_back" &&
        card.card_status === "context_only",
    ),
  );
  assert.ok(
    projection.next_work_signal_candidates.some(
      (card) =>
        card.card_kind === "manual_global_dogfood_context_only_superseded" &&
        card.card_status === "context_only",
    ),
  );
  for (const card of projection.next_work_signal_candidates) {
    assert.equal(card.would_write_next_work_bias, false);
    assert.equal(card.would_write_perspective, false);
    assert.equal(card.would_write_metrics, false);
  }

  assert.equal(
    projection.dogfood_loop_spine_alignment
      .can_feed_workbench_dogfood_loop_spine_overview_read_model,
    true,
  );
  assert.equal(
    projection.dogfood_loop_spine_alignment
      .can_feed_dogfood_metric_snapshot_preview_read_model,
    true,
  );
  assert.equal(
    projection.dogfood_loop_spine_alignment
      .can_feed_next_work_signal_decision_preview_read_model,
    true,
  );
  assert.match(
    projection.dogfood_loop_spine_alignment.read_only_alignment_note,
    /does not write metrics/,
  );
  assert.equal(projection.authority_boundary.read_only, true);
  assert.equal(projection.authority_boundary.can_write_dogfood_metrics, false);
  assert.equal(projection.authority_boundary.can_write_dogfood_ledger, false);
  assert.equal(projection.authority_boundary.can_write_next_work_bias, false);
  assert.equal(projection.authority_boundary.can_write_perspective_state, false);
  assert.equal(projection.authority_boundary.can_write_perspective_memory, false);
  assert.equal(projection.authority_boundary.can_write_proof_or_evidence, false);
  assert.equal(projection.authority_boundary.can_mutate_work, false);
  assert.equal(projection.authority_boundary.can_execute_product_write, false);
  assert.equal(projection.validation.passed, true);
}

function assertBlockedStates(sample) {
  assert.equal(
    sample.emptyProjection.projection_readiness,
    "blocked_no_global_dogfood_ledger_records",
  );
  assert.ok(
    sample.emptyProjection.blocked_reasons.includes(
      "blocked_no_global_dogfood_ledger_records",
    ),
  );
  assert.equal(
    sample.contextOnlyProjection.projection_readiness,
    "blocked_no_active_committed_ledger_receipt",
  );
  assert.ok(
    sample.contextOnlyProjection.blocked_reasons.includes(
      "blocked_no_active_committed_ledger_receipt",
    ),
  );
  assert.ok(
    sample.contextOnlyProjection.next_work_signal_candidates.every(
      (card) =>
        card.card_status === "blocked" || card.card_status === "context_only",
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
      "smoke:research-candidate-manual-global-dogfood-ledger-workbench-projection-v0-1"
    ],
    "node scripts/smoke-research-candidate-manual-global-dogfood-ledger-workbench-projection-v0-1.mjs",
  );
  const normalized = docsSource.replace(/\s+/g, " ");
  for (const requiredText of [
    "Manual Global Dogfood Ledger Workbench Projection v0.1 Pointer",
    "Manual global dogfood ledger readback can now be projected into a Workbench/dogfood loop spine read model",
    "read-only",
    "does not write metrics",
    "next-work bias",
    "Perspective",
    "proof/evidence",
    "work",
    "memory",
    "product",
    "separate operator-reviewed write contract",
  ]) {
    assert.ok(normalized.includes(requiredText), `docs must include ${requiredText}`);
  }
}
