import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const typePath =
  "types/research-candidate-manual-result-dogfood-bridge-preview.ts";
const builderPath =
  "lib/research-candidate-review/manual-result-dogfood-bridge-preview.ts";
const panelPath =
  "components/research-candidate-manual-result-dogfood-bridge-preview-panel.tsx";
const readbackPanelPath =
  "components/research-candidate-manual-note-record-readback-panel.tsx";
const manualRecordTypePath =
  "types/research-candidate-manual-result-authorized-record-write.ts";
const manualRecordWriterPath =
  "lib/research-candidate-review/manual-result-authorized-record-write.ts";
const manualRecordReadbackPath =
  "lib/research-candidate-review/read-manual-result-records.ts";
const manualRecordRoutePath =
  "app/api/research-candidate-review/manual-result-records/route.ts";
const bridgeRoutePath =
  "app/api/research-candidate-review/manual-result-dogfood-bridge-preview/route.ts";
const docsPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const packagePath = "package.json";
const smokePath =
  "scripts/smoke-research-candidate-manual-result-dogfood-bridge-preview-v0-1.mjs";

for (const filePath of [
  typePath,
  builderPath,
  panelPath,
  readbackPanelPath,
  manualRecordTypePath,
  manualRecordWriterPath,
  manualRecordReadbackPath,
  manualRecordRoutePath,
  docsPath,
  packagePath,
  smokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const typeSource = readFileSync(typePath, "utf8");
const builderSource = readFileSync(builderPath, "utf8");
const panelSource = readFileSync(panelPath, "utf8");
const readbackPanelSource = readFileSync(readbackPanelPath, "utf8");
const routeSource = readFileSync(manualRecordRoutePath, "utf8");
const docsSource = readFileSync(docsPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assertTypeContract();
assertBuilderAndUiBoundaries();
const sample = buildSamplePreview();
assertReadyPreview(sample);
assertBlockedPreviews(sample);
assertNonWriteCounts(sample);
assertNoBridgePostRoute();
assertDocsAndPackageScript();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-manual-result-dogfood-bridge-preview-v0-1",
      pass: true,
      latest_committed_receipt_selected: true,
      rolled_back_and_superseded_context_only: true,
      expected_observed_delta_alignment_checked: true,
      reuse_outcome_alignment_checked: true,
      readiness_blocks_checked: true,
      global_dogfood_non_write_checked: true,
      proof_work_perspective_memory_product_non_write_checked: true,
      no_bridge_post_route_added: true,
      component_read_only_checked: true,
      existing_manual_note_smokes_run_separately: true,
    },
    null,
    2,
  ),
);

function assertTypeContract() {
  for (const requiredText of [
    "research_candidate_manual_result_dogfood_bridge_preview",
    "research_candidate_manual_result_dogfood_bridge_preview.v0.1",
    "ready_for_operator_bridge_review",
    "blocked_no_manual_result_records",
    "blocked_no_committed_receipt",
    "blocked_missing_expected_observed_delta",
    "blocked_missing_reuse_outcome",
    "blocked_only_rolled_back_or_superseded_records",
    "blocked_shape_mismatch",
    "expected_observed_delta_alignment",
    "reuse_outcome_alignment",
    "dogfood_bridge_readiness",
    "candidate_bridge_cards",
    "required_future_authorization",
    "read_only: true",
    "preview_only: true",
    "source_of_truth: false",
    "writes_global_dogfood_ledger: false",
    "writes_dogfood_metrics: false",
    "writes_expected_observed_delta_global_record: false",
    "writes_reuse_outcome_global_record: false",
    "writes_perspective: false",
    "writes_perspective_memory: false",
    "writes_proof_or_evidence: false",
    "mutates_work: false",
    "can_call_provider_or_openai: false",
    "can_call_github: false",
    "can_execute_codex: false",
    "can_fetch_sources: false",
    "can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false",
  ]) {
    assert.ok(typeSource.includes(requiredText), `type must include ${requiredText}`);
  }
}

function assertBuilderAndUiBoundaries() {
  assert.doesNotMatch(
    builderSource,
    /openDatabase|better-sqlite3|NextResponse|fetch\s*\(|POST\s*\(|INSERT\s+INTO|UPDATE\s+|DELETE\s+FROM|BEGIN\s+IMMEDIATE/i,
    "bridge builder must stay read-only and avoid server-only DB or route behavior",
  );
  assert.doesNotMatch(
    `${builderSource}\n${panelSource}`,
    /\bnew\s+OpenAI\b|api\.openai\.com|OPENAI_API_KEY|GITHUB_TOKEN|octokit|createPullRequest|mergePullRequest|executeCodex|runCodex|launchCodex|retrieveSources\s*\(|ragIndex\s*\(|vectorStore\s*\(|scrapeSource\s*\(|crawlSources\s*\(/i,
    "bridge preview must not add provider/OpenAI, GitHub, Codex, retrieval, or source-fetch behavior",
  );
  assert.doesNotMatch(
    panelSource,
    /<button\b|method:\s*["']POST["']|fetch\s*\(/,
    "bridge preview panel must not expose write buttons, POSTs, or fetch behavior",
  );
  assert.ok(
    panelSource.includes(
      "This preview does not write global dogfood ledger records, dogfood",
    ),
    "panel must display explicit no-write statement",
  );
  assert.ok(
    readbackPanelSource.includes(
      "ResearchCandidateManualResultDogfoodBridgePreviewPanel",
    ),
    "manual readback panel must render the bridge preview panel",
  );
  assert.ok(
    routeSource.includes("export async function GET") &&
      routeSource.includes("export async function POST"),
    "existing manual result record route remains the authorized write/readback route",
  );
}

function buildSamplePreview() {
  const code = `
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { parseManualResearchNoteToPreview } from "./lib/research-candidate-review/manual-note-parser";
import { buildResearchCandidateManualNoteHandoffSeed } from "./lib/research-candidate-review/manual-note-handoff-seed";
import { buildResearchCandidateManualNoteHandoffResultIntake } from "./lib/research-candidate-review/manual-note-handoff-result-intake";
import { buildResearchCandidateManualNoteResultIntakeOperatorReview } from "./lib/research-candidate-review/manual-note-result-intake-operator-review";
import { buildResearchCandidateManualNoteResultRecordContractPreview } from "./lib/research-candidate-review/manual-note-result-record-contract-preview";
import {
  RESEARCH_CANDIDATE_MANUAL_RESULT_AUTHORIZED_WRITE_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_RESULT_ROLLBACK_CONFIRMATION
} from "./types/research-candidate-manual-result-authorized-record-write";
import {
  writeResearchCandidateManualResultAuthorizedRecords,
  rollbackResearchCandidateManualResultWriteReceipt
} from "./lib/research-candidate-review/manual-result-authorized-record-write";
import { readResearchCandidateManualResultRecords } from "./lib/research-candidate-review/read-manual-result-records";
import { buildResearchCandidateManualResultDogfoodBridgePreview } from "./lib/research-candidate-review/manual-result-dogfood-bridge-preview";

const db = new Database(":memory:");
db.pragma("foreign_keys = ON");
db.exec(readFileSync("lib/db/schema.sql", "utf8"));

function readCounts() {
  return Object.fromEntries([
    "research_candidate_manual_result_write_receipts",
    "research_candidate_manual_expected_observed_delta_records",
    "research_candidate_manual_reuse_outcome_records",
    "research_candidate_manual_result_write_rollbacks",
    "verification_evidence_records",
    "action_records",
    "work_items",
    "work_events",
    "perspective_states",
    "perspective_promotion_decisions",
    "perspective_formation_receipts",
    "perspective_memory_product_persistence_boundary_records",
    "perspective_memory_items",
    "dogfooding_records",
    "dogfooding_signals",
    "dogfooding_review_cues"
  ].map((table) => [
    table,
    db.prepare("SELECT COUNT(*) AS count FROM " + table).get().count
  ]));
}

const note = [
  "Research Question: Can manual result records align with dogfood bridge concepts without writing a ledger?",
  "Operator Intent: Preview only the manual ExpectedObservedDelta and Reuse Outcome bridge shape.",
  "Source Title: Manual result dogfood bridge alignment note",
  "Source Origin: local operator note",
  "Source Identifier: local-manual-result-dogfood-bridge-001",
  "Claim: Manual result records can be summarized into bridge candidates without writing global dogfood ledgers.",
  "Evidence: supports: The authorized record write stores receipt, EOD, and reuse outcome rows only.",
  "Tension: A bridge preview could be mistaken for a global dogfood ledger write.",
  "Gap: Need readiness blockers for rolled back, superseded, and missing records. next: bridge preview validation",
  "Perspective Delta: Keep manual bridge candidates separate from Perspective promotion.",
  "Next: Implement read-only dogfood bridge preview. files: lib/research-candidate-review/manual-result-dogfood-bridge-preview.ts checks: npm run smoke:research-candidate-manual-result-dogfood-bridge-preview-v0-1"
].join("\\n");

const parserResult = parseManualResearchNoteToPreview(note);
const seed = buildResearchCandidateManualNoteHandoffSeed({
  preview: parserResult.preview,
  warnings: parserResult.warnings,
  source_metadata: {
    result_source: "local_parse",
    parser_version: parserResult.parser_version,
    input_fingerprint: "fnv1a32:manual-result-dogfood-bridge",
    persisted_preview_draft: false
  },
  target_label: "Manual result dogfood bridge smoke sample"
});

function makeReport({ outcome, observed }) {
  return [
    "# Summary",
    "result_status: complete",
    "pr_url: https://github.com/hynk-studio/augnes/pull/1003",
    "pr_number: 1003",
    "live_host_observation: /research-candidate-review showed manual result readback.",
    "proof_evidence_rows_written: false",
    "event_rows_created_or_mutated: false",
    "work_status_changed: false",
    "state_committed_or_rejected: false",
    "observed_outcome: " + observed,
    "",
    "## Files changed",
    "- types/research-candidate-manual-result-dogfood-bridge-preview.ts",
    "- lib/research-candidate-review/manual-result-dogfood-bridge-preview.ts",
    "",
    "## Verification",
    "- npm run typecheck passed",
    "- npm run smoke:research-candidate-manual-result-dogfood-bridge-preview-v0-1 passed",
    "",
    "## Skipped checks",
    "- No skipped checks.",
    "",
    "## Remaining caveats",
    "- Broader dogfood ledger integration remains future work.",
    "",
    "selected candidate context outcome: " + outcome,
    "expected vs observed delta summary: Manual result records align as read-only bridge candidates without dogfood ledger writes.",
    "",
    "## Authority boundary statement",
    "Read-only bridge preview only; no global dogfood ledger writes, no dogfood metrics, no proof/evidence rows, no work status change, no Perspective promotion, no memory writes, no provider calls, no GitHub automation, no source fetching, no retrieval, and no Codex execution."
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
    operator_notes: "Local review note that must not be stored."
  });
  const contract = buildResearchCandidateManualNoteResultRecordContractPreview({
    result_intake: intake,
    operator_review: review
  });
  return { intake, review, contract };
}

function requestFor(flow, authorization = {}) {
  return {
    result_intake: flow.intake,
    operator_review: flow.review,
    record_contract_preview: flow.contract,
    operator_authorization: {
      authorization_kind: "manual_operator_authorized_record_write",
      operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_RESULT_AUTHORIZED_WRITE_CONFIRMATION,
      write_mode: "commit",
      ...authorization
    }
  };
}

const countsBefore = readCounts();
const helpful = makeFlow(makeReport({
  outcome: "helpful",
  observed: "The manual bridge preview selected a complete committed receipt."
}));
const missing = makeFlow(makeReport({
  outcome: "missing",
  observed: "A superseded manual record remains visible as context only."
}));
const staleReplacement = makeFlow(makeReport({
  outcome: "stale",
  observed: "The replacement committed receipt keeps revised bridge candidate material."
}));
const noisy = makeFlow(makeReport({
  outcome: "noisy",
  observed: "A noisy reuse outcome is counted without becoming a ledger write."
}));
const misleading = makeFlow(makeReport({
  outcome: "misleading",
  observed: "A misleading reuse outcome is counted without becoming a ledger write."
}));

const committedHelpful = writeResearchCandidateManualResultAuthorizedRecords(
  requestFor(helpful),
  { db }
);
const duplicateHelpful = writeResearchCandidateManualResultAuthorizedRecords(
  requestFor(helpful),
  { db }
);
const rollbackHelpful = rollbackResearchCandidateManualResultWriteReceipt(
  {
    receipt_id: committedHelpful.receipt.receipt_id,
    rollback_authorization: {
      authorization_kind: "manual_operator_authorized_record_rollback",
      operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_RESULT_ROLLBACK_CONFIRMATION,
      rollback_reason: "Smoke test rolled back context-only bridge preview receipt."
    }
  },
  { db }
);
const committedMissing = writeResearchCandidateManualResultAuthorizedRecords(
  requestFor(missing),
  { db }
);
const supersedingStale = writeResearchCandidateManualResultAuthorizedRecords(
  requestFor(staleReplacement, {
    write_mode: "supersede_previous",
    supersedes_receipt_id: committedMissing.receipt.receipt_id
  }),
  { db }
);
const committedNoisy = writeResearchCandidateManualResultAuthorizedRecords(
  requestFor(noisy),
  { db }
);
const committedMisleading = writeResearchCandidateManualResultAuthorizedRecords(
  requestFor(misleading),
  { db }
);

for (const result of [
  committedHelpful,
  duplicateHelpful,
  rollbackHelpful,
  committedMissing,
  supersedingStale,
  committedNoisy,
  committedMisleading
]) {
  assert.equal(result.ok, true);
}
assert.equal(duplicateHelpful.result_status, "duplicate_replayed");
assert.equal(rollbackHelpful.result_status, "rolled_back");
assert.equal(supersedingStale.result_status, "committed");

const readback = readResearchCandidateManualResultRecords({ db, limit: 20 });
const preview = buildResearchCandidateManualResultDogfoodBridgePreview({
  readback,
  operator_view: "smoke_test"
});
const emptyDb = new Database(":memory:");
emptyDb.pragma("foreign_keys = ON");
emptyDb.exec(readFileSync("lib/db/schema.sql", "utf8"));
const emptyReadback = readResearchCandidateManualResultRecords({
  db: emptyDb,
  limit: 20
});
const emptyPreview = buildResearchCandidateManualResultDogfoodBridgePreview({
  readback: emptyReadback
});
const contextOnlyReadback = {
  ...readback,
  records_by_receipt: readback.records_by_receipt.filter(
    (recordSet) => recordSet.rolled_back || recordSet.superseded
  ),
  latest_receipts: readback.latest_receipts.filter(
    (receipt) => receipt.write_status === "rolled_back" || receipt.write_status === "superseded"
  ),
  count: readback.records_by_receipt.filter(
    (recordSet) => recordSet.rolled_back || recordSet.superseded
  ).length
};
const contextOnlyPreview = buildResearchCandidateManualResultDogfoodBridgePreview({
  readback: contextOnlyReadback
});
const countsAfter = readCounts();

console.log(JSON.stringify({
  countsBefore,
  countsAfter,
  readback,
  preview,
  emptyPreview,
  contextOnlyPreview,
  committedHelpful,
  duplicateHelpful,
  rollbackHelpful,
  committedMissing,
  supersedingStale,
  committedNoisy,
  committedMisleading
}));
`;

  const output = execFileSync("node", ["--import", "tsx", "--eval", code], {
    encoding: "utf8",
  });
  return JSON.parse(output);
}

function assertReadyPreview(sample) {
  const { preview, readback } = sample;
  assert.equal(
    preview.preview_kind,
    "research_candidate_manual_result_dogfood_bridge_preview",
  );
  assert.equal(
    preview.preview_version,
    "research_candidate_manual_result_dogfood_bridge_preview.v0.1",
  );
  assert.equal(
    preview.dogfood_bridge_readiness,
    "ready_for_operator_bridge_review",
  );
  const expectedLatestCommitted = readback.records_by_receipt.find(
    (recordSet) => recordSet.receipt.write_status === "committed",
  ).receipt.receipt_id;
  assert.equal(preview.latest_committed_receipt_id, expectedLatestCommitted);
  assert.equal(preview.blocked_reasons.length, 0);
  assert.equal(preview.validation.latest_committed_receipt_selected, true);
  assert.equal(
    preview.expected_observed_delta_alignment.observed_summary_present,
    true,
  );
  assert.equal(
    preview.expected_observed_delta_alignment
      .source_handoff_seed_fingerprint_present,
    true,
  );
  assert.equal(
    preview.expected_observed_delta_alignment
      .source_result_text_fingerprint_present,
    true,
  );
  assert.ok(
    preview.expected_observed_delta_alignment.latest_expected_summary.length > 0,
  );
  assert.ok(
    preview.expected_observed_delta_alignment.latest_observed_summary.length > 0,
  );
  assert.ok(
    preview.expected_observed_delta_alignment.latest_mismatch_or_gap_summary
      .length > 0,
  );
  assert.equal(
    preview.expected_observed_delta_alignment
      .can_become_broader_expected_observed_delta_bridge_candidate,
    true,
  );
  assert.equal(
    preview.reuse_outcome_alignment
      .can_become_broader_reuse_outcome_bridge_candidate,
    true,
  );
  assert.equal(preview.reuse_outcome_alignment.outcome_label_counts.helpful, 1);
  assert.equal(preview.reuse_outcome_alignment.outcome_label_counts.stale, 1);
  assert.equal(preview.reuse_outcome_alignment.outcome_label_counts.missing, 1);
  assert.equal(preview.reuse_outcome_alignment.outcome_label_counts.noisy, 1);
  assert.equal(
    preview.reuse_outcome_alignment.outcome_label_counts.misleading,
    1,
  );
  assert.equal(
    preview.reuse_outcome_alignment.outcome_label_counts.not_reported,
    0,
  );
  assert.ok(
    preview.reuse_outcome_alignment.selected_candidate_context_ref_count > 0,
  );
  assert.equal(preview.reuse_outcome_alignment.source_line_present, true);
  assert.ok(preview.candidate_bridge_cards.length >= 4);
  assert.ok(
    preview.candidate_bridge_cards.some(
      (card) =>
        card.card_kind === "latest_committed_expected_observed_delta" &&
        card.card_status === "primary_candidate",
    ),
  );
  assert.ok(
    preview.candidate_bridge_cards.some(
      (card) =>
        card.card_kind === "latest_committed_reuse_outcome" &&
        card.card_status === "primary_candidate",
    ),
  );
  assert.ok(
    preview.candidate_bridge_cards
      .filter((card) => card.card_status === "primary_candidate")
      .every((card) => card.receipt_id === preview.latest_committed_receipt_id),
  );
  assert.ok(
    preview.candidate_bridge_cards
      .filter((card) => card.receipt_status === "rolled_back")
      .every((card) => card.card_status === "context_only"),
  );
  assert.ok(
    preview.candidate_bridge_cards
      .filter((card) => card.receipt_status === "superseded")
      .every((card) => card.card_status === "context_only"),
  );
  assert.match(
    preview.validation.preview_fingerprint,
    /^fnv1a32:[0-9a-f]{8}$/,
  );
}

function assertBlockedPreviews(sample) {
  assert.equal(
    sample.emptyPreview.dogfood_bridge_readiness,
    "blocked_no_manual_result_records",
  );
  assert.ok(
    sample.emptyPreview.blocked_reasons.includes(
      "blocked_no_manual_result_records",
    ),
  );
  assert.equal(
    sample.contextOnlyPreview.dogfood_bridge_readiness,
    "blocked_only_rolled_back_or_superseded_records",
  );
  assert.ok(
    sample.contextOnlyPreview.blocked_reasons.includes(
      "blocked_only_rolled_back_or_superseded_records",
    ),
  );
  assert.equal(
    sample.contextOnlyPreview.candidate_bridge_cards.every(
      (card) => card.card_status === "context_only",
    ),
    true,
  );
}

function assertNonWriteCounts(sample) {
  const before = sample.countsBefore;
  const after = sample.countsAfter;
  assert.equal(after.research_candidate_manual_result_write_receipts, 5);
  assert.equal(
    after.research_candidate_manual_expected_observed_delta_records,
    5,
  );
  assert.equal(after.research_candidate_manual_reuse_outcome_records, 5);
  assert.equal(after.research_candidate_manual_result_write_rollbacks, 1);
  for (const table of [
    "verification_evidence_records",
    "action_records",
    "work_items",
    "work_events",
    "perspective_states",
    "perspective_promotion_decisions",
    "perspective_formation_receipts",
    "perspective_memory_product_persistence_boundary_records",
    "perspective_memory_items",
    "dogfooding_records",
    "dogfooding_signals",
    "dogfooding_review_cues",
  ]) {
    assert.equal(before[table], 0, `${table} should start empty in temp DB`);
    assert.equal(after[table], 0, `${table} must remain empty`);
  }
  assert.equal(
    sample.preview.authority_boundary.writes_global_dogfood_ledger,
    false,
  );
  assert.equal(sample.preview.authority_boundary.writes_dogfood_metrics, false);
  assert.equal(sample.preview.authority_boundary.writes_perspective, false);
  assert.equal(
    sample.preview.authority_boundary.writes_perspective_memory,
    false,
  );
  assert.equal(
    sample.preview.authority_boundary.writes_proof_or_evidence,
    false,
  );
  assert.equal(sample.preview.authority_boundary.mutates_work, false);
  assert.equal(
    sample.preview.authority_boundary.can_call_provider_or_openai,
    false,
  );
  assert.equal(sample.preview.authority_boundary.can_call_github, false);
  assert.equal(sample.preview.authority_boundary.can_execute_codex, false);
  assert.equal(sample.preview.authority_boundary.can_fetch_sources, false);
  assert.equal(
    sample.preview.authority_boundary
      .can_run_retrieval_rag_embeddings_vector_fts_or_crawler,
    false,
  );
}

function assertNoBridgePostRoute() {
  assert.equal(
    existsSync(bridgeRoutePath),
    false,
    "no manual-result dogfood bridge API route should be added for this read-only UI slice",
  );
}

function assertDocsAndPackageScript() {
  for (const requiredText of [
    "Manual Result Dogfood Bridge Alignment Preview v0.1 Pointer",
    "read-only and preview-only",
    "does not write global dogfood ledgers",
    "does not call providers/OpenAI, GitHub, Codex, source fetching, retrieval/RAG",
  ]) {
    assert.ok(docsSource.includes(requiredText), `docs must include ${requiredText}`);
  }
  assert.equal(
    packageJson.scripts?.[
      "smoke:research-candidate-manual-result-dogfood-bridge-preview-v0-1"
    ],
    `node ${smokePath}`,
    "package.json must include bridge preview smoke script",
  );
}
