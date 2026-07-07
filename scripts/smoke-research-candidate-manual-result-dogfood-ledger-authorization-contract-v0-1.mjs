import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const contractTypePath =
  "types/research-candidate-manual-result-dogfood-ledger-authorization-contract.ts";
const reviewTypePath =
  "types/research-candidate-manual-result-dogfood-ledger-authorization-review.ts";
const contractBuilderPath =
  "lib/research-candidate-review/manual-result-dogfood-ledger-authorization-contract.ts";
const reviewBuilderPath =
  "lib/research-candidate-review/manual-result-dogfood-ledger-authorization-review.ts";
const contractPanelPath =
  "components/research-candidate-manual-result-dogfood-ledger-authorization-contract-panel.tsx";
const bridgePanelPath =
  "components/research-candidate-manual-result-dogfood-bridge-preview-panel.tsx";
const bridgeRoutePath =
  "app/api/research-candidate-review/manual-result-dogfood-ledger-authorization-contract/route.ts";
const packagePath = "package.json";
const docsPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";

for (const filePath of [
  contractTypePath,
  reviewTypePath,
  contractBuilderPath,
  reviewBuilderPath,
  contractPanelPath,
  bridgePanelPath,
  packagePath,
  docsPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const contractTypeSource = readFileSync(contractTypePath, "utf8");
const reviewTypeSource = readFileSync(reviewTypePath, "utf8");
const contractBuilderSource = readFileSync(contractBuilderPath, "utf8");
const reviewBuilderSource = readFileSync(reviewBuilderPath, "utf8");
const panelSource = readFileSync(contractPanelPath, "utf8");
const bridgePanelSource = readFileSync(bridgePanelPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const docsSource = readFileSync(docsPath, "utf8");

assertTypeContracts();
assertStaticBoundaries();
const sample = buildSample();
assertReadyContract(sample);
assertBlockedContracts(sample);
assertReviews(sample);
assertNoWrites(sample);
assertDocsAndPackage();
assertExistingSmokesPass();

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-manual-result-dogfood-ledger-authorization-contract-v0-1",
      pass: true,
      ready_contract_checked: true,
      blocked_contracts_checked: true,
      operator_review_checked: true,
      deterministic_idempotency_checked: true,
      no_global_dogfood_write_checked: true,
      no_forbidden_state_writes_checked: true,
      no_api_post_route_added: true,
      static_no_fetch_provider_github_codex_retrieval_checked: true,
      existing_manual_result_smokes_checked: true,
    },
    null,
    2,
  ),
);

function assertTypeContracts() {
  for (const requiredText of [
    "research_candidate_manual_result_dogfood_ledger_authorization_contract",
    "research_candidate_manual_result_dogfood_ledger_authorization_contract.v0.1",
    "ready_for_future_ledger_write_authorization",
    "blocked_before_ledger_authorization",
    "proposed_global_dogfood_mapping",
    "proposed_reuse_outcome_ledger_mapping",
    "proposed_expected_observed_delta_mapping",
    "idempotency_contract_preview",
    "would_prevent_duplicate_ledger_write: true",
    "durable_id_allocated: false",
    "writes_now: false",
    "can_write_global_dogfood_ledger: false",
    "can_write_dogfood_metrics: false",
    "can_write_expected_observed_delta_global_record: false",
    "can_write_reuse_outcome_global_record: false",
    "can_write_manual_result_records: false",
    "can_mutate_manual_result_records: false",
    "can_write_proof_or_evidence: false",
    "can_mutate_work: false",
    "can_promote_perspective: false",
    "can_write_perspective_state: false",
    "can_write_perspective_memory: false",
    "can_execute_codex: false",
    "can_call_github: false",
    "can_call_providers_or_openai: false",
    "can_fetch_sources: false",
    "can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false",
    "can_allocate_product_ids: false",
    "can_execute_product_write: false",
  ]) {
    assert.ok(
      contractTypeSource.includes(requiredText),
      `contract type must include ${requiredText}`,
    );
  }
  for (const requiredText of [
    "research_candidate_manual_result_dogfood_ledger_authorization_review",
    "ready_for_future_ledger_write_slice",
    "blocked_contract_not_ready",
    "blocked_mapping_revision_required",
    "rejected_by_operator",
    "deferred_by_operator",
    "operator_note_persisted: false",
  ]) {
    assert.ok(
      reviewTypeSource.includes(requiredText),
      `review type must include ${requiredText}`,
    );
  }
}

function assertStaticBoundaries() {
  assert.doesNotMatch(
    `${contractBuilderSource}\n${reviewBuilderSource}`,
    /openDatabase|better-sqlite3|NextResponse|fetch\s*\(|POST\s*\(|INSERT\s+INTO|UPDATE\s+|DELETE\s+FROM|BEGIN\s+IMMEDIATE|writeReuseOutcomeBridgeLedgerRecord|reuse-outcome-bridge-ledger-write|handoff-reuse-outcome-ledger/i,
    "contract and review builders must not import DB, routes, fetch, SQL writes, or ledger write helpers",
  );
  assert.doesNotMatch(
    `${contractBuilderSource}\n${reviewBuilderSource}\n${panelSource}`,
    /\bnew\s+OpenAI\b|api\.openai\.com|OPENAI_API_KEY|GITHUB_TOKEN|octokit|createPullRequest|mergePullRequest|executeCodex|runCodex|launchCodex|retrieveSources\s*\(|ragIndex\s*\(|vectorStore\s*\(|scrapeSource\s*\(|crawlSources\s*\(|localStorage|sessionStorage|navigator\.clipboard/i,
    "contract preview must not add provider/OpenAI, GitHub, Codex, retrieval, source-fetch, browser storage, or clipboard behavior",
  );
  assert.doesNotMatch(
    panelSource,
    /fetch\s*\(|method:\s*["']POST["']|api\/dogfooding|global dogfood ledger write/i,
    "contract panel must not expose fetch/POST/API/global ledger write behavior",
  );
  assert.doesNotMatch(
    panelSource,
    /Write authorized|Write ledger|Record ledger|Create ledger/i,
    "contract panel must not include a write action button",
  );
  assert.ok(
    panelSource.includes("Preview authorization review") &&
      panelSource.includes("Clear review"),
    "contract panel must expose local preview and clear controls",
  );
  assert.ok(
    bridgePanelSource.includes(
      "ResearchCandidateManualResultDogfoodLedgerAuthorizationContractPanel",
    ),
    "bridge preview panel must render the authorization contract panel",
  );
  assert.equal(
    existsSync(bridgeRoutePath),
    false,
    "no manual-result dogfood ledger authorization API route should be added",
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
import { buildResearchCandidateManualResultDogfoodLedgerAuthorizationContract } from "./lib/research-candidate-review/manual-result-dogfood-ledger-authorization-contract";
import { buildResearchCandidateManualResultDogfoodLedgerAuthorizationReview } from "./lib/research-candidate-review/manual-result-dogfood-ledger-authorization-review";

const db = new Database(":memory:");
db.pragma("foreign_keys = ON");
db.exec(readFileSync("lib/db/schema.sql", "utf8"));

function count(table) {
  return db.prepare("SELECT COUNT(*) AS count FROM " + table).get().count;
}

function readCounts() {
  return Object.fromEntries([
    "research_candidate_manual_result_write_receipts",
    "research_candidate_manual_expected_observed_delta_records",
    "research_candidate_manual_reuse_outcome_records",
    "research_candidate_manual_result_write_rollbacks",
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
  ].map((table) => [table, count(table)]));
}

const note = [
  "Research Question: Can manual result dogfood bridge candidates prepare a future ledger authorization contract?",
  "Operator Intent: Preview only the future dogfood ledger authorization contract.",
  "Source Title: Manual result dogfood ledger authorization note",
  "Source Origin: local operator note",
  "Source Identifier: local-manual-result-dogfood-ledger-auth-001",
  "Claim: Manual result records can prepare a future ledger authorization contract without writing the ledger.",
  "Evidence: supports: The bridge preview exposes manual EOD and reuse outcome cards.",
  "Tension: Existing handoff reuse outcome ledger writer expects fields manual bridge candidates do not provide.",
  "Gap: Need explicit future authorization and idempotency before any ledger write. next: contract validation",
  "Perspective Delta: Keep manual dogfood ledger authorization preview separate from Perspective promotion.",
  "Next: Implement contract preview. files: lib/research-candidate-review/manual-result-dogfood-ledger-authorization-contract.ts checks: npm run smoke:research-candidate-manual-result-dogfood-ledger-authorization-contract-v0-1"
].join("\\n");

const parserResult = parseManualResearchNoteToPreview(note);
const seed = buildResearchCandidateManualNoteHandoffSeed({
  preview: parserResult.preview,
  warnings: parserResult.warnings,
  source_metadata: {
    result_source: "local_parse",
    parser_version: parserResult.parser_version,
    input_fingerprint: "fnv1a32:manual-result-dogfood-ledger-auth",
    persisted_preview_draft: false
  },
  target_label: "Manual result dogfood ledger authorization smoke sample"
});

function makeReport({ outcome, observed }) {
  return [
    "# Summary",
    "result_status: complete",
    "pr_url: https://github.com/hynk-studio/augnes/pull/1004",
    "pr_number: 1004",
    "live_host_observation: /research-candidate-review showed manual result dogfood ledger authorization contract preview.",
    "proof_evidence_rows_written: false",
    "event_rows_created_or_mutated: false",
    "work_status_changed: false",
    "state_committed_or_rejected: false",
    "observed_outcome: " + observed,
    "",
    "## Files changed",
    "- types/research-candidate-manual-result-dogfood-ledger-authorization-contract.ts",
    "- lib/research-candidate-review/manual-result-dogfood-ledger-authorization-contract.ts",
    "",
    "## Verification",
    "- npm run typecheck passed",
    "- npm run smoke:research-candidate-manual-result-dogfood-ledger-authorization-contract-v0-1 passed",
    "",
    "## Skipped checks",
    "- No skipped checks.",
    "",
    "## Remaining caveats",
    "- Ledger write remains future work.",
    "",
    "selected candidate context outcome: " + outcome,
    "expected vs observed delta summary: Manual result records produce a contract preview without dogfood ledger writes.",
    "",
    "## Authority boundary statement",
    "Preview-only authorization contract; no global dogfood ledger writes, no dogfood metrics, no proof/evidence rows, no work status change, no Perspective promotion, no memory writes, no provider calls, no GitHub automation, no source fetching, no retrieval, and no Codex execution."
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
const rolledBackFlow = makeFlow(makeReport({
  outcome: "helpful",
  observed: "A rolled back record remains context-only for authorization."
}));
const supersededFlow = makeFlow(makeReport({
  outcome: "missing",
  observed: "A superseded record remains context-only for authorization."
}));
const replacementFlow = makeFlow(makeReport({
  outcome: "stale",
  observed: "A replacement committed record can become a bridge candidate."
}));
const readyFlow = makeFlow(makeReport({
  outcome: "helpful",
  observed: "A complete committed record can produce a future ledger authorization contract."
}));

const rolledBackWrite = writeResearchCandidateManualResultAuthorizedRecords(
  requestFor(rolledBackFlow),
  { db }
);
const rollback = rollbackResearchCandidateManualResultWriteReceipt(
  {
    receipt_id: rolledBackWrite.receipt.receipt_id,
    rollback_authorization: {
      authorization_kind: "manual_operator_authorized_record_rollback",
      operator_confirmation_text: RESEARCH_CANDIDATE_MANUAL_RESULT_ROLLBACK_CONFIRMATION,
      rollback_reason: "Smoke rolled back context-only authorization candidate."
    }
  },
  { db }
);
const supersededWrite = writeResearchCandidateManualResultAuthorizedRecords(
  requestFor(supersededFlow),
  { db }
);
const replacementWrite = writeResearchCandidateManualResultAuthorizedRecords(
  requestFor(replacementFlow, {
    write_mode: "supersede_previous",
    supersedes_receipt_id: supersededWrite.receipt.receipt_id
  }),
  { db }
);
const readyWrite = writeResearchCandidateManualResultAuthorizedRecords(
  requestFor(readyFlow),
  { db }
);

for (const result of [
  rolledBackWrite,
  rollback,
  supersededWrite,
  replacementWrite,
  readyWrite
]) {
  assert.equal(result.ok, true);
}

const readback = readResearchCandidateManualResultRecords({ db, limit: 20 });
const bridgePreview = buildResearchCandidateManualResultDogfoodBridgePreview({
  readback,
  operator_view: "ledger_authorization_smoke"
});
const readyContract = buildResearchCandidateManualResultDogfoodLedgerAuthorizationContract({
  bridge_preview: bridgePreview
});
const readyContractAgain = buildResearchCandidateManualResultDogfoodLedgerAuthorizationContract({
  bridge_preview: bridgePreview
});
const acceptReview = buildResearchCandidateManualResultDogfoodLedgerAuthorizationReview({
  authorization_contract: readyContract,
  operator_decision: "accept_contract_for_future_write_slice",
  operator_note: "Local smoke note that must not persist."
});
const revisionReview = buildResearchCandidateManualResultDogfoodLedgerAuthorizationReview({
  authorization_contract: readyContract,
  operator_decision: "needs_mapping_revision"
});
const rejectReview = buildResearchCandidateManualResultDogfoodLedgerAuthorizationReview({
  authorization_contract: readyContract,
  operator_decision: "reject_contract"
});
const deferReview = buildResearchCandidateManualResultDogfoodLedgerAuthorizationReview({
  authorization_contract: readyContract,
  operator_decision: "defer_contract"
});

const rolledBackReadback = {
  ...readback,
  records_by_receipt: readback.records_by_receipt.filter((recordSet) => recordSet.rolled_back),
  latest_receipts: readback.latest_receipts.filter((receipt) => receipt.write_status === "rolled_back"),
  count: readback.records_by_receipt.filter((recordSet) => recordSet.rolled_back).length
};
const rolledBackContract = buildResearchCandidateManualResultDogfoodLedgerAuthorizationContract({
  bridge_preview: buildResearchCandidateManualResultDogfoodBridgePreview({ readback: rolledBackReadback })
});

const supersededReadback = {
  ...readback,
  records_by_receipt: readback.records_by_receipt.filter((recordSet) => recordSet.superseded),
  latest_receipts: readback.latest_receipts.filter((receipt) => receipt.write_status === "superseded"),
  count: readback.records_by_receipt.filter((recordSet) => recordSet.superseded).length
};
const supersededContract = buildResearchCandidateManualResultDogfoodLedgerAuthorizationContract({
  bridge_preview: buildResearchCandidateManualResultDogfoodBridgePreview({ readback: supersededReadback })
});

const missingEodPreview = {
  ...bridgePreview,
  candidate_bridge_cards: bridgePreview.candidate_bridge_cards.filter(
    (card) => card.card_kind !== "latest_committed_expected_observed_delta"
  ),
  expected_observed_delta_alignment: {
    ...bridgePreview.expected_observed_delta_alignment,
    can_become_broader_expected_observed_delta_bridge_candidate: false,
    blockers: ["latest_committed_expected_observed_delta_record_missing"]
  }
};
const missingEodContract = buildResearchCandidateManualResultDogfoodLedgerAuthorizationContract({
  bridge_preview: missingEodPreview
});

const missingReusePreview = {
  ...bridgePreview,
  candidate_bridge_cards: bridgePreview.candidate_bridge_cards.filter(
    (card) => card.card_kind !== "latest_committed_reuse_outcome"
  ),
  reuse_outcome_alignment: {
    ...bridgePreview.reuse_outcome_alignment,
    can_become_broader_reuse_outcome_bridge_candidate: false,
    blockers: ["latest_committed_reuse_outcome_record_missing"]
  }
};
const missingReuseContract = buildResearchCandidateManualResultDogfoodLedgerAuthorizationContract({
  bridge_preview: missingReusePreview
});

const unsupportedOutcomePreview = {
  ...bridgePreview,
  reuse_outcome_alignment: {
    ...bridgePreview.reuse_outcome_alignment,
    latest_outcome_label: "not_reported",
    can_become_broader_reuse_outcome_bridge_candidate: false,
    blockers: ["reuse_outcome_label_not_reported"]
  },
  candidate_bridge_cards: bridgePreview.candidate_bridge_cards.map((card) =>
    card.card_kind === "latest_committed_reuse_outcome"
      ? { ...card, outcome_label: "not_reported", blockers: ["reuse_outcome_label_not_reported"] }
      : card
  )
};
const unsupportedOutcomeContract = buildResearchCandidateManualResultDogfoodLedgerAuthorizationContract({
  bridge_preview: unsupportedOutcomePreview
});

const writeAuthorityPreview = {
  ...bridgePreview,
  authority_boundary: {
    ...bridgePreview.authority_boundary,
    writes_global_dogfood_ledger: true
  }
};
const writeAuthorityContract = buildResearchCandidateManualResultDogfoodLedgerAuthorizationContract({
  bridge_preview: writeAuthorityPreview
});

const countsAfter = readCounts();

console.log(JSON.stringify({
  countsBefore,
  countsAfter,
  readback,
  bridgePreview,
  readyContract,
  readyContractAgain,
  acceptReview,
  revisionReview,
  rejectReview,
  deferReview,
  rolledBackContract,
  supersededContract,
  missingEodContract,
  missingReuseContract,
  unsupportedOutcomeContract,
  writeAuthorityContract
}));
`;

  const output = execFileSync("node", ["--import", "tsx", "--eval", code], {
    encoding: "utf8",
  });
  return JSON.parse(output);
}

function assertReadyContract(sample) {
  const { readyContract, readyContractAgain } = sample;
  assert.equal(
    readyContract.contract_kind,
    "research_candidate_manual_result_dogfood_ledger_authorization_contract",
  );
  assert.equal(
    readyContract.contract_version,
    "research_candidate_manual_result_dogfood_ledger_authorization_contract.v0.1",
  );
  assert.equal(
    readyContract.operator_authorization_mode,
    "ready_for_future_ledger_write_authorization",
  );
  assert.equal(readyContract.blocker_reasons.length, 0);
  assert.equal(
    readyContract.proposed_global_dogfood_mapping.global_ledger_candidate_allowed,
    true,
  );
  assert.equal(
    readyContract.proposed_global_dogfood_mapping.global_metric_candidate_allowed,
    false,
  );
  assert.ok(readyContract.proposed_global_dogfood_mapping.source_manual_receipt_id);
  assert.ok(
    readyContract.proposed_global_dogfood_mapping
      .source_handoff_seed_fingerprint,
  );
  assert.ok(
    readyContract.proposed_global_dogfood_mapping
      .source_result_text_fingerprint,
  );
  assert.ok(
    readyContract.proposed_global_dogfood_mapping
      .source_expected_observed_delta_record_ref,
  );
  assert.ok(
    readyContract.proposed_global_dogfood_mapping
      .source_reuse_outcome_record_ref,
  );
  assert.ok(readyContract.proposed_global_dogfood_mapping.expected_summary);
  assert.ok(readyContract.proposed_global_dogfood_mapping.observed_summary);
  assert.ok(
    readyContract.proposed_global_dogfood_mapping.mismatch_or_gap_summary,
  );
  assert.ok(readyContract.proposed_global_dogfood_mapping.source_line);
  assert.ok(
    readyContract.proposed_global_dogfood_mapping
      .selected_candidate_context_refs.length > 0,
  );
  assert.equal(
    readyContract.idempotency_contract_preview.proposed_idempotency_key,
    readyContractAgain.idempotency_contract_preview.proposed_idempotency_key,
  );
  assert.match(
    readyContract.idempotency_contract_preview.proposed_idempotency_key,
    /^manual-result-dogfood-ledger-auth:fnv1a32:[0-9a-f]{8}$/,
  );
  assert.equal(
    readyContract.idempotency_contract_preview
      .would_prevent_duplicate_ledger_write,
    true,
  );
  assert.equal(
    readyContract.idempotency_contract_preview.durable_id_allocated,
    false,
  );
  assert.equal(readyContract.idempotency_contract_preview.writes_now, false);
  assert.equal(
    readyContract.proposed_reuse_outcome_ledger_mapping
      .existing_handoff_reuse_outcome_ledger_writer_compatible,
    false,
  );
  assert.ok(
    readyContract.compatibility_findings.some(
      (finding) =>
        finding.finding_code ===
          "existing_handoff_reuse_outcome_ledger_writer_shape_mismatch" &&
        finding.severity === "blocker" &&
        finding.applies_to === "existing_handoff_reuse_outcome_ledger_writer",
    ),
  );
  assert.equal(readyContract.validation.passed, true);
  assert.equal(readyContract.validation.no_write_authority, true);
}

function assertBlockedPreviewsContract(contract, reason) {
  assert.equal(
    contract.operator_authorization_mode,
    "blocked_before_ledger_authorization",
    `${reason} must block authorization`,
  );
  assert.ok(contract.blocker_reasons.length > 0, `${reason} blockers missing`);
  assert.equal(contract.validation.passed, false, `${reason} validation must fail`);
}

function assertBlockedContracts(sample) {
  assertBlockedPreviewsContract(sample.rolledBackContract, "rolled_back-only bridge");
  assert.ok(
    sample.rolledBackContract.blocker_reasons.some((reason) =>
      reason.includes("blocked_only_rolled_back_or_superseded_records"),
    ),
  );
  assertBlockedPreviewsContract(sample.supersededContract, "superseded-only bridge");
  assert.ok(
    sample.supersededContract.blocker_reasons.some((reason) =>
      reason.includes("blocked_only_rolled_back_or_superseded_records"),
    ),
  );
  assertBlockedPreviewsContract(sample.missingEodContract, "missing EOD");
  assert.ok(
    sample.missingEodContract.blocker_reasons.includes(
      "expected_observed_delta_alignment_not_ready",
    ),
  );
  assertBlockedPreviewsContract(sample.missingReuseContract, "missing Reuse Outcome");
  assert.ok(
    sample.missingReuseContract.blocker_reasons.includes(
      "reuse_outcome_alignment_not_ready",
    ),
  );
  assertBlockedPreviewsContract(
    sample.unsupportedOutcomeContract,
    "unsupported outcome label",
  );
  assert.ok(
    sample.unsupportedOutcomeContract.blocker_reasons.includes(
      "reuse_outcome_label_not_supported",
    ),
  );
  assertBlockedPreviewsContract(
    sample.writeAuthorityContract,
    "bridge preview write authority",
  );
  assert.ok(
    sample.writeAuthorityContract.blocker_reasons.includes(
      "bridge_preview_authority_boundary_has_write_authority",
    ),
  );
}

function assertReviews(sample) {
  assert.equal(
    sample.acceptReview.review_status,
    "ready_for_future_ledger_write_slice",
  );
  assert.ok(sample.acceptReview.accepted_mapping_summary);
  assert.equal(sample.acceptReview.validation.operator_note_persisted, false);
  assert.equal(sample.acceptReview.validation.no_write_authority, true);
  assert.equal(
    sample.revisionReview.review_status,
    "blocked_mapping_revision_required",
  );
  assert.equal(sample.revisionReview.accepted_mapping_summary, null);
  assert.equal(sample.rejectReview.review_status, "rejected_by_operator");
  assert.equal(sample.rejectReview.accepted_mapping_summary, null);
  assert.equal(sample.deferReview.review_status, "deferred_by_operator");
  assert.equal(sample.deferReview.accepted_mapping_summary, null);
}

function assertNoWrites(sample) {
  const before = sample.countsBefore;
  const after = sample.countsAfter;
  assert.ok(after.research_candidate_manual_result_write_receipts > before.research_candidate_manual_result_write_receipts);
  assert.ok(after.research_candidate_manual_expected_observed_delta_records > before.research_candidate_manual_expected_observed_delta_records);
  assert.ok(after.research_candidate_manual_reuse_outcome_records > before.research_candidate_manual_reuse_outcome_records);
  assert.equal(after.dogfooding_records, 0);
  assert.equal(after.dogfooding_signals, 0);
  assert.equal(after.dogfooding_review_cues, 0);
  assert.equal(after.verification_evidence_records, 0);
  assert.equal(after.action_records, 0);
  assert.equal(after.work_items, 0);
  assert.equal(after.work_events, 0);
  assert.equal(after.perspective_states, 0);
  assert.equal(after.perspective_promotion_decisions, 0);
  assert.equal(after.perspective_formation_receipts, 0);
  assert.equal(after.perspective_memory_product_persistence_boundary_records, 0);
  assert.equal(after.perspective_memory_items, 0);
  assert.equal(after.delivery_ledger, 0);
  for (const contract of [
    sample.readyContract,
    sample.rolledBackContract,
    sample.supersededContract,
    sample.missingEodContract,
    sample.missingReuseContract,
    sample.unsupportedOutcomeContract,
  ]) {
    assert.equal(contract.non_write_confirmation.global_dogfood_ledger_written, false);
    assert.equal(contract.non_write_confirmation.dogfood_metrics_written, false);
    assert.equal(contract.non_write_confirmation.proof_or_evidence_written, false);
    assert.equal(contract.non_write_confirmation.work_mutated, false);
    assert.equal(contract.non_write_confirmation.perspective_state_written, false);
    assert.equal(contract.non_write_confirmation.perspective_memory_written, false);
    assert.equal(contract.non_write_confirmation.product_write_executed, false);
    assert.equal(contract.non_write_confirmation.api_write_route_added, false);
    assert.equal(contract.non_write_confirmation.db_schema_or_migration_added, false);
  }
}

function assertDocsAndPackage() {
  const normalizedDocsSource = docsSource.replace(/\s+/g, " ");
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-manual-result-dogfood-ledger-authorization-contract-v0-1"
    ],
    "node scripts/smoke-research-candidate-manual-result-dogfood-ledger-authorization-contract-v0-1.mjs",
  );
  for (const requiredText of [
    "Manual Result Dogfood Ledger Authorization Contract Preview v0.1 Pointer",
    "not a ledger write",
    "no global dogfood ledger write",
    "no dogfood metrics",
    "no Perspective promotion",
    "no proof/evidence",
    "no work mutation",
    "no provider/GitHub/Codex",
    "no source fetching/retrieval",
  ]) {
    assert.ok(
      normalizedDocsSource.includes(requiredText),
      `docs must include ${requiredText}`,
    );
  }
  assert.ok(
    normalizedDocsSource.includes(
      "separately authorized idempotent global dogfood ledger write",
    ),
    "docs must include separately authorized idempotent global dogfood ledger write",
  );
}

function assertExistingSmokesPass() {
  for (const command of [
    [
      "node",
      ["scripts/smoke-research-candidate-manual-result-dogfood-bridge-preview-v0-1.mjs"],
    ],
    [
      "node",
      ["scripts/smoke-research-candidate-manual-result-authorized-record-write-v0-1.mjs"],
    ],
    [
      "node",
      ["scripts/smoke-research-candidate-manual-note-preview-ui-v0-1.mjs"],
    ],
  ]) {
    execFileSync(command[0], command[1], { stdio: "pipe" });
  }
}
