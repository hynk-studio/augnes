import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const operatorReviewTypePath =
  "types/research-candidate-manual-note-result-intake-operator-review.ts";
const contractPreviewTypePath =
  "types/research-candidate-manual-note-result-record-contract-preview.ts";
const operatorReviewBuilderPath =
  "lib/research-candidate-review/manual-note-result-intake-operator-review.ts";
const contractPreviewBuilderPath =
  "lib/research-candidate-review/manual-note-result-record-contract-preview.ts";
const operatorReviewComponentPath =
  "components/research-candidate-manual-note-result-intake-operator-review-panel.tsx";
const resultIntakePanelPath =
  "components/research-candidate-manual-note-handoff-result-intake-panel.tsx";
const parserPath = "lib/research-candidate-review/manual-note-parser.ts";
const seedBuilderPath =
  "lib/research-candidate-review/manual-note-handoff-seed.ts";
const resultIntakeBuilderPath =
  "lib/research-candidate-review/manual-note-handoff-result-intake.ts";
const resultIntakeSmokePath =
  "scripts/smoke-research-candidate-manual-note-handoff-result-intake-v0-1.mjs";
const seedSmokePath =
  "scripts/smoke-research-candidate-manual-note-handoff-seed-v0-1.mjs";
const previewUiSmokePath =
  "scripts/smoke-research-candidate-manual-note-preview-ui-v0-1.mjs";
const smokePath =
  "scripts/smoke-research-candidate-manual-note-result-intake-operator-review-v0-1.mjs";
const packagePath = "package.json";

for (const filePath of [
  operatorReviewTypePath,
  contractPreviewTypePath,
  operatorReviewBuilderPath,
  contractPreviewBuilderPath,
  operatorReviewComponentPath,
  resultIntakePanelPath,
  parserPath,
  seedBuilderPath,
  resultIntakeBuilderPath,
  resultIntakeSmokePath,
  seedSmokePath,
  previewUiSmokePath,
  smokePath,
  packagePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const operatorReviewTypeSource = readFileSync(operatorReviewTypePath, "utf8");
const contractPreviewTypeSource = readFileSync(contractPreviewTypePath, "utf8");
const operatorReviewBuilderSource = readFileSync(
  operatorReviewBuilderPath,
  "utf8",
);
const contractPreviewBuilderSource = readFileSync(
  contractPreviewBuilderPath,
  "utf8",
);
const operatorReviewComponentSource = readFileSync(
  operatorReviewComponentPath,
  "utf8",
);
const resultIntakePanelSource = readFileSync(resultIntakePanelPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assertTypeContracts();
assertBuilderStaticBoundaries();
assertComponentStaticBoundaries();
const sample = buildSampleOperatorReviewFlow();
assertReadyOperatorReview(sample.readyReview);
assertReadyRecordContractPreview(sample.readyContract);
assertIncompleteIntakeBlocksContract(sample.incompleteReview, sample.incompleteContract);
assertRejectAndDeferBlockContracts({
  rejectedReview: sample.rejectedReview,
  rejectedContract: sample.rejectedContract,
  deferredReview: sample.deferredReview,
  deferredContract: sample.deferredContract,
});
assertReuseOutcomeLabels(sample.allowedOutcomeReviews);
assertDeterministicFingerprints(sample);
assertExistingManualNoteSmokesPass();
assertPackageScript();

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-manual-note-result-intake-operator-review-v0-1",
      pass: true,
      type_contracts_checked: true,
      builder_chain_executed:
        "manual parser -> handoff seed -> result intake -> operator review -> record contract preview",
      ready_contract_preview_checked: true,
      incomplete_contract_block_checked: true,
      rejected_deferred_contract_block_checked: true,
      reuse_outcome_labels_checked: true,
      deterministic_browser_safe_checked: true,
      component_local_controls_checked: true,
      existing_manual_note_smokes_passed: true,
      package_script_checked: true,
    },
    null,
    2,
  ),
);

function assertTypeContracts() {
  for (const requiredText of [
    "ResearchCandidateManualNoteResultIntakeOperatorReviewInput",
    "ResearchCandidateManualNoteHandoffResultIntake",
    'review_kind: ResearchCandidateManualNoteResultIntakeOperatorReviewKind',
    'review_version: ResearchCandidateManualNoteResultIntakeOperatorReviewVersion',
    "source_result_intake_ref",
    "source_result_intake_fingerprint",
    "source_handoff_seed_fingerprint",
    "selected_operator_decision",
    "review_status",
    "expected_observed_delta_review",
    "reuse_outcome_review",
    "authority_boundary_review",
    "warning_reasons",
    "blocker_reasons",
    "operator_notes",
    "local_review_only: true",
    "writes_record: false",
    "writes_ledger: false",
    "updates_salience: false",
    "promotes_perspective: false",
    "mutates_state: false",
  ]) {
    assert.ok(
      operatorReviewTypeSource.includes(requiredText),
      `operator review type must include ${requiredText}`,
    );
  }

  for (const requiredText of [
    "ResearchCandidateManualNoteResultRecordContractPreviewInput",
    "expected_observed_delta_record_candidate",
    "reuse_outcome_record_candidate",
    "idempotency_preview",
    "evidence_refs: []",
    "proof_refs: []",
    "would_write: false",
    "storage_authority_present: false",
    "record_write_authorized: false",
    "writes_ledger: false",
    "required_future_authorization",
    "no_durable_ids_allocated: true",
    "operator_notes_retained: false",
  ]) {
    assert.ok(
      contractPreviewTypeSource.includes(requiredText),
      `record contract type must include ${requiredText}`,
    );
  }
}

function assertBuilderStaticBoundaries() {
  const builderSource = `${operatorReviewBuilderSource}\n${contractPreviewBuilderSource}`;
  assert.match(
    operatorReviewBuilderSource,
    /export function buildResearchCandidateManualNoteResultIntakeOperatorReview/,
    "operator review builder must be exported",
  );
  assert.match(
    contractPreviewBuilderSource,
    /export function buildResearchCandidateManualNoteResultRecordContractPreview/,
    "record contract preview builder must be exported",
  );
  assert.match(
    builderSource,
    /fnv1a32/,
    "builders must use deterministic browser-safe fingerprinting",
  );
  assert.doesNotMatch(
    builderSource,
    /node:crypto|createHash|crypto\.subtle/,
    "client-used builders must not use crypto APIs",
  );
  assert.doesNotMatch(
    builderSource,
    /\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|NextResponse|Request\(|Response\(|CREATE\s+TABLE|ALTER\s+TABLE|INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM/i,
    "builders must not add network, route, DB, or SQL behavior",
  );
  assert.doesNotMatch(
    builderSource,
    /\bnew\s+OpenAI\b|api\.openai\.com|OPENAI_API_KEY|GITHUB_TOKEN|octokit|createPullRequest|mergePullRequest|executeCodex|runCodex|launchCodex|retrieveSources|ragIndex|vectorStore|scrapeSource|navigator\.sendBeacon/i,
    "builders must not add provider/OpenAI, GitHub automation, Codex execution, retrieval, source-fetch, or external send behavior",
  );
  assert.doesNotMatch(
    builderSource,
    /writeExpectedObservedDelta|writeReuseOutcome|writeProof|createProof|recordProof|writeEvidence|createEvidence|recordEvidence|createWorkItem|promotePerspective|commitState|rejectState|allocateProductId/i,
    "builders must not introduce proof, evidence, work, Perspective, state, or product-write behavior",
  );
}

function assertComponentStaticBoundaries() {
  assert.match(
    operatorReviewComponentSource,
    /export function ResearchCandidateManualNoteResultIntakeOperatorReviewPanel/,
    "operator review component must be exported",
  );
  assert.match(
    operatorReviewComponentSource,
    /buildResearchCandidateManualNoteResultIntakeOperatorReview/,
    "component must call the local operator review builder",
  );
  assert.match(
    operatorReviewComponentSource,
    /buildResearchCandidateManualNoteResultRecordContractPreview/,
    "component must call the local record contract preview builder",
  );
  assert.match(
    operatorReviewComponentSource,
    /<select\b/,
    "component must expose local operator decision controls",
  );
  assert.match(
    operatorReviewComponentSource,
    /<textarea\b/,
    "component must expose local operator note textarea",
  );
  assert.match(
    operatorReviewComponentSource,
    /Preview operator review/,
    "component must expose a local preview action",
  );
  assert.match(
    operatorReviewComponentSource,
    /Clear review/,
    "component must expose a local clear action",
  );
  assert.match(
    operatorReviewComponentSource,
    /Future record contract preview/,
    "component must render a future record contract preview when ready",
  );
  assert.doesNotMatch(
    operatorReviewComponentSource,
    /\bfetch\s*\(|navigator\.clipboard|writeText|localStorage|sessionStorage|indexedDB|document\.cookie|NextResponse|Request\(|Response\(|OPENAI_API_KEY|api\.openai\.com|new\s+OpenAI|GITHUB_TOKEN|octokit|executeCodex|runCodex|launchCodex/i,
    "component must not add network, storage, clipboard, provider, GitHub, or Codex behavior",
  );
  assert.doesNotMatch(
    operatorReviewComponentSource,
    /writeExpectedObservedDelta|writeReuseOutcome|writeProof|createProof|recordProof|writeEvidence|createEvidence|recordEvidence|createWorkItem|promotePerspective|commitState|rejectState|allocateProductId/i,
    "component must not add durable write or approval behavior",
  );
  assert.match(
    resultIntakePanelSource,
    /ResearchCandidateManualNoteResultIntakeOperatorReviewPanel/,
    "result intake panel must render the operator review panel after intake preview exists",
  );
  assert.match(
    resultIntakePanelSource,
    /key=\{intakePreview\.result_text_fingerprint\}/,
    "operator review panel must reset local state when a different result report is previewed",
  );
}

function buildSampleOperatorReviewFlow() {
  const code = `
import { parseManualResearchNoteToPreview } from "./lib/research-candidate-review/manual-note-parser";
import { buildResearchCandidateManualNoteHandoffSeed } from "./lib/research-candidate-review/manual-note-handoff-seed";
import { buildResearchCandidateManualNoteHandoffResultIntake } from "./lib/research-candidate-review/manual-note-handoff-result-intake";
import { buildResearchCandidateManualNoteResultIntakeOperatorReview } from "./lib/research-candidate-review/manual-note-result-intake-operator-review";
import { buildResearchCandidateManualNoteResultRecordContractPreview } from "./lib/research-candidate-review/manual-note-result-record-contract-preview";

const note = [
  "Research Question: Can manual Research Candidate result intake prepare an operator review contract preview?",
  "Operator Intent: Review candidate-only result intake before any future authorized records.",
  "Source Title: Manual operator review note",
  "Source Origin: local operator note",
  "Source Identifier: local-manual-operator-review-001",
  "Claim: A complete pasted Codex result report can be reviewed locally before any record contract is considered.",
  "Evidence: supports: The result-intake draft exposes changed files, verification, skipped checks, observed outcome, reuse outcome, and expected vs observed delta.",
  "Tension: An operator review preview could be mistaken for storage authority.",
  "Gap: Need blocked preview behavior for reports missing reuse outcome. next: local review validation",
  "Perspective Delta: Keep ExpectedObservedDelta and Reuse Outcome outputs as drafts until a later authorized writer exists.",
  "Next: Implement local operator review preview. files: types/research-candidate-manual-note-result-intake-operator-review.ts, lib/research-candidate-review/manual-note-result-intake-operator-review.ts, components/research-candidate-manual-note-result-intake-operator-review-panel.tsx",
  "Next: Validate local operator review preview. checks: npm run smoke:research-candidate-manual-note-result-intake-operator-review-v0-1"
].join("\\n");

const parserResult = parseManualResearchNoteToPreview(note);
const seed = buildResearchCandidateManualNoteHandoffSeed({
  preview: parserResult.preview,
  warnings: parserResult.warnings,
  source_metadata: {
    result_source: "local_parse",
    parser_version: parserResult.parser_version,
    input_fingerprint: "fnv1a32:sample-operator-review",
    persisted_preview_draft: false
  },
  target_label: "Manual result intake operator review smoke sample"
});

const completeReport = [
  "# Summary",
  "result_status: complete",
  "pr_url: https://github.com/hynk-studio/augnes/pull/1001",
  "pr_number: 1001",
  "live_host_observation: /research-candidate-review rendered the local operator review panel.",
  "proof_evidence_rows_written: false",
  "event_rows_created_or_mutated: false",
  "work_status_changed: false",
  "state_committed_or_rejected: false",
  "observed_outcome: The local operator review preview prepared a non-writing contract preview.",
  "",
  "## Files changed",
  "- types/research-candidate-manual-note-result-intake-operator-review.ts",
  "- types/research-candidate-manual-note-result-record-contract-preview.ts",
  "- lib/research-candidate-review/manual-note-result-intake-operator-review.ts",
  "- lib/research-candidate-review/manual-note-result-record-contract-preview.ts",
  "- components/research-candidate-manual-note-result-intake-operator-review-panel.tsx",
  "",
  "## Verification",
  "- npm run typecheck passed",
  "- npm run smoke:research-candidate-manual-note-result-intake-operator-review-v0-1 passed",
  "",
  "## Skipped checks",
  "- node scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs skipped: repo-local Playwright unavailable",
  "",
  "## Remaining caveats",
  "- Browser fallback tooling remains outside this product slice.",
  "",
  "selected candidate context outcome: helpful",
  "expected vs observed delta summary: Candidate context helped keep the operator review and record contract preview non-writing.",
  "",
  "## Authority boundary statement",
  "Candidate-only local preview; no proof/evidence rows, no work status change, no ledger write, and no state commit."
].join("\\n");

const incompleteReport = completeReport
  .replace("selected candidate context outcome: helpful\\n", "");

const intake = buildResearchCandidateManualNoteHandoffResultIntake({
  handoff_seed: seed,
  codex_result_report_text: completeReport,
  source_metadata: { result_source: "sample_smoke" }
});
const incompleteIntake = buildResearchCandidateManualNoteHandoffResultIntake({
  handoff_seed: seed,
  codex_result_report_text: incompleteReport,
  source_metadata: { result_source: "sample_smoke" }
});

const readyReview = buildResearchCandidateManualNoteResultIntakeOperatorReview({
  result_intake: intake,
  operator_decision: "prepare_record_contract_preview",
  operator_notes: "Operator checked required return fields locally."
});
const readyReviewRepeat = buildResearchCandidateManualNoteResultIntakeOperatorReview({
  result_intake: intake,
  operator_decision: "prepare_record_contract_preview",
  operator_notes: "Operator checked required return fields locally."
});
const readyContract = buildResearchCandidateManualNoteResultRecordContractPreview({
  result_intake: intake,
  operator_review: readyReview
});
const readyContractRepeat = buildResearchCandidateManualNoteResultRecordContractPreview({
  result_intake: intake,
  operator_review: readyReview
});
const incompleteReview = buildResearchCandidateManualNoteResultIntakeOperatorReview({
  result_intake: incompleteIntake,
  operator_decision: "prepare_record_contract_preview"
});
const incompleteContract = buildResearchCandidateManualNoteResultRecordContractPreview({
  result_intake: incompleteIntake,
  operator_review: incompleteReview
});
const rejectedReview = buildResearchCandidateManualNoteResultIntakeOperatorReview({
  result_intake: intake,
  operator_decision: "reject_result_intake_preview"
});
const rejectedContract = buildResearchCandidateManualNoteResultRecordContractPreview({
  result_intake: intake,
  operator_review: rejectedReview
});
const deferredReview = buildResearchCandidateManualNoteResultIntakeOperatorReview({
  result_intake: intake,
  operator_decision: "defer_result_intake_preview"
});
const deferredContract = buildResearchCandidateManualNoteResultRecordContractPreview({
  result_intake: intake,
  operator_review: deferredReview
});
const allowedOutcomeReviews = ["helpful", "stale", "missing", "noisy", "misleading"].map((label) => {
  const outcomeIntake = buildResearchCandidateManualNoteHandoffResultIntake({
    handoff_seed: seed,
    codex_result_report_text: completeReport.replace("selected candidate context outcome: helpful", "selected candidate context outcome: " + label),
    source_metadata: { result_source: "sample_smoke" }
  });
  return buildResearchCandidateManualNoteResultIntakeOperatorReview({
    result_intake: outcomeIntake,
    operator_decision: "prepare_record_contract_preview"
  });
});

console.log(JSON.stringify({
  seed,
  intake,
  incompleteIntake,
  readyReview,
  readyReviewRepeat,
  readyContract,
  readyContractRepeat,
  incompleteReview,
  incompleteContract,
  rejectedReview,
  rejectedContract,
  deferredReview,
  deferredContract,
  allowedOutcomeReviews
}));
`;
  const output = execFileSync("node", ["--import", "tsx", "--eval", code], {
    encoding: "utf8",
  });
  return JSON.parse(output);
}

function assertReadyOperatorReview(review) {
  assert.equal(
    review.review_kind,
    "research_candidate_manual_note_result_intake_operator_review",
  );
  assert.equal(
    review.review_version,
    "research_candidate_manual_note_result_intake_operator_review.v0.1",
  );
  assert.match(review.review_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(review.review_status, "ready_for_record_contract_preview");
  assert.equal(
    review.selected_operator_decision,
    "prepare_record_contract_preview",
  );
  assert.equal(review.validation.passed, true);
  assert.equal(review.validation.record_contract_preview_allowed, true);
  assert.equal(review.validation.raw_result_text_retained, false);
  assert.equal(review.validation.operator_notes_persisted, false);
  assert.equal(review.expected_observed_delta_review.ready_for_record_candidate, true);
  assert.equal(review.reuse_outcome_review.ready_for_record_candidate, true);
  assert.equal(review.reuse_outcome_review.outcome_label, "helpful");
  assert.equal(review.blocker_reasons.length, 0);
  assert.equal(Object.hasOwn(review, "codex_result_report_text"), false);
  assert.equal(Object.hasOwn(review, "raw_result_text"), false);

  for (const [key, value] of Object.entries(review.authority_boundary)) {
    if (["candidate_only", "preview_only", "local_review_only"].includes(key)) {
      assert.equal(value, true, `operator review boundary ${key} must be true`);
    } else {
      assert.equal(value, false, `operator review boundary ${key} must be false`);
    }
  }
}

function assertReadyRecordContractPreview(contract) {
  assert.equal(
    contract.contract_kind,
    "research_candidate_manual_note_result_record_contract_preview",
  );
  assert.equal(
    contract.contract_version,
    "research_candidate_manual_note_result_record_contract_preview.v0.1",
  );
  assert.equal(contract.contract_status, "ready_for_future_authorization");
  assert.match(contract.contract_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(contract.validation.passed, true);
  assert.equal(contract.validation.no_durable_ids_allocated, true);
  assert.equal(contract.validation.raw_result_text_retained, false);
  assert.equal(contract.validation.operator_notes_retained, false);
  assert.equal(contract.would_write, false);
  assert.equal(contract.storage_authority_present, false);
  assert.equal(contract.record_write_authorized, false);
  assert.equal(contract.writes_ledger, false);
  assert.deepEqual(contract.evidence_refs, []);
  assert.deepEqual(contract.proof_refs, []);
  assert.equal(
    contract.idempotency_preview.durable_id_allocated,
    false,
    "idempotency preview must not allocate durable IDs",
  );
  assert.equal(
    contract.expected_observed_delta_record_candidate.draft_only,
    true,
  );
  assert.equal(
    contract.expected_observed_delta_record_candidate.record_write_authorized,
    false,
  );
  assert.equal(contract.reuse_outcome_record_candidate.draft_only, true);
  assert.equal(
    contract.reuse_outcome_record_candidate.record_write_authorized,
    false,
  );
  assert.equal(contract.reuse_outcome_record_candidate.writes_ledger, false);
  assert.equal(contract.reuse_outcome_record_candidate.outcome_label, "helpful");
  assert.equal(
    JSON.stringify(contract).includes('"record_id"'),
    false,
    "contract preview must not allocate a durable record_id",
  );
  assert.equal(
    JSON.stringify(contract).includes('"ledger_id"'),
    false,
    "contract preview must not allocate a durable ledger_id",
  );

  for (const [key, value] of Object.entries(contract.authority_boundary)) {
    if (["candidate_only", "preview_only", "contract_preview_only"].includes(key)) {
      assert.equal(value, true, `record contract boundary ${key} must be true`);
    } else {
      assert.equal(value, false, `record contract boundary ${key} must be false`);
    }
  }
}

function assertIncompleteIntakeBlocksContract(review, contract) {
  assert.notEqual(
    review.review_status,
    "ready_for_record_contract_preview",
    "incomplete result intake must not become a ready operator review",
  );
  assert.ok(
    [
      "blocked_missing_required_return_fields",
      "blocked_missing_reuse_outcome",
    ].includes(review.review_status),
    "missing reuse outcome must block or warn through a specific review status",
  );
  assert.equal(review.validation.record_contract_preview_allowed, false);
  assert.ok(
    review.reuse_outcome_review.outcome_label === "not_reported" ||
      review.reuse_outcome_review.warning_reasons.includes("missing_reuse_outcome"),
    "missing reuse outcome must remain visible",
  );
  assert.equal(
    contract.contract_status,
    "blocked_before_record_contract_preview",
  );
  assert.equal(contract.validation.passed, false);
  assert.equal(contract.would_write, false);
}

function assertRejectAndDeferBlockContracts({
  rejectedReview,
  rejectedContract,
  deferredReview,
  deferredContract,
}) {
  assert.equal(rejectedReview.review_status, "rejected_by_operator_preview");
  assert.equal(
    rejectedContract.contract_status,
    "blocked_before_record_contract_preview",
  );
  assert.equal(rejectedContract.would_write, false);
  assert.equal(deferredReview.review_status, "deferred_by_operator_preview");
  assert.equal(
    deferredContract.contract_status,
    "blocked_before_record_contract_preview",
  );
  assert.equal(deferredContract.would_write, false);
}

function assertReuseOutcomeLabels(allowedOutcomeReviews) {
  assert.deepEqual(
    allowedOutcomeReviews.map((review) => review.reuse_outcome_review.outcome_label),
    ["helpful", "stale", "missing", "noisy", "misleading"],
  );
  for (const review of allowedOutcomeReviews) {
    assert.equal(
      review.reuse_outcome_review.ready_for_record_candidate,
      true,
      `${review.reuse_outcome_review.outcome_label} must be a supported reported reuse outcome`,
    );
  }
}

function assertDeterministicFingerprints(sample) {
  assert.equal(
    sample.readyReview.review_fingerprint,
    sample.readyReviewRepeat.review_fingerprint,
    "operator review fingerprint must be deterministic",
  );
  assert.equal(
    sample.readyContract.contract_fingerprint,
    sample.readyContractRepeat.contract_fingerprint,
    "record contract preview fingerprint must be deterministic",
  );
}

function assertExistingManualNoteSmokesPass() {
  execFileSync("node", [resultIntakeSmokePath], {
    encoding: "utf8",
    stdio: "pipe",
  });
  execFileSync("node", [seedSmokePath], { encoding: "utf8", stdio: "pipe" });
  execFileSync("node", [previewUiSmokePath], {
    encoding: "utf8",
    stdio: "pipe",
  });
}

function assertPackageScript() {
  assert.equal(
    packageJson.scripts?.[
      "smoke:research-candidate-manual-note-result-intake-operator-review-v0-1"
    ],
    `node ${smokePath}`,
    "package.json must include the operator review smoke script",
  );
}
