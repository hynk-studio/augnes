#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const typePath = "types/dogfooding-to-review-memory-proposal.ts";
const helperPath = "lib/dogfooding/build-review-memory-proposal.ts";
const dogfoodingTypePath = "types/dogfooding-research-record-runtime-contract.ts";
const dogfoodingStorePath = "lib/dogfooding/dogfooding-record-store.ts";
const handoffHelperPath = "lib/handoff/build-handoff-from-dogfooding-record.ts";
const fixturePath = "fixtures/dogfooding-to-review-memory-proposal.sample.v0.1.json";
const handoffFixturePath =
  "fixtures/conversation-handoff-from-dogfooding-record.sample.v0.1.json";
const smokePath = "scripts/smoke-dogfooding-to-review-memory-proposal-v0-1.mjs";
const handoffSmokePath =
  "scripts/smoke-conversation-handoff-from-dogfooding-record-v0-1.mjs";
const packetSmokePath = "scripts/smoke-conversation-handoff-packet-v0-2.mjs";
const codexBindingSmokePath =
  "scripts/smoke-codex-result-to-dogfooding-record-v0-1.mjs";
const dogfoodingSmokePath =
  "scripts/smoke-dogfooding-research-record-runtime-v0-1.mjs";
const docsPath = "docs/DOGFOODING_TO_REVIEW_MEMORY_PROPOSAL_V0_1.md";
const handoffDocsPath = "docs/CONVERSATION_HANDOFF_FROM_DOGFOODING_RECORD_V0_1.md";
const dogfoodingDocsPath = "docs/DOGFOODING_RESEARCH_RECORD_RUNTIME_V0_1.md";
const reconciliationDocsPath =
  "docs/DOGFOODING_RESEARCH_RECORD_RUNTIME_V0_1.md";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const fixtureVersion = "dogfooding_to_review_memory_proposal.sample.v0.1";
const proposalVersion = "dogfooding_to_review_memory_proposal.v0.1";
const builderVersion = "dogfooding_to_review_memory_proposal_builder.v0.1";
const selectedSlice = "dogfooding_record_to_review_memory_proposal_v0_1";
const nextSlice = "local_data_export_manifest_builder_v0_1";
const scope = "project:augnes";
const packageScriptName = "smoke:dogfooding-to-review-memory-proposal-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-dogfooding-to-review-memory-proposal-v0-1.mjs";

const expectedChangedFiles = new Set([
  typePath,
  helperPath,
  fixturePath,
  smokePath,
  docsPath,
  packagePath,
  indexPath,
  "docs/CONVERSATION_HANDOFF_FROM_DOGFOODING_RECORD_V0_1.md",
  "fixtures/codex-result-report-ingestion.sample.v0.1.json",
  "fixtures/codex-result-to-dogfooding-record.sample.v0.1.json",
  "fixtures/conversation-handoff-from-dogfooding-record.sample.v0.1.json",
  "lib/dogfooding/codex-result-report-normalizer.ts",
  "lib/handoff/build-handoff-from-dogfooding-record.ts",
  "scripts/smoke-codex-result-report-ingestion-v0-1.mjs",
  handoffSmokePath,
  packetSmokePath,
  codexBindingSmokePath,
  dogfoodingSmokePath,
  "types/local-data-export-manifest.ts",
  "lib/local-export/build-local-data-export-manifest.ts",
  "fixtures/local-data-export-manifest.sample.v0.1.json",
  "scripts/smoke-local-data-export-manifest-builder-v0-1.mjs",
  "docs/LOCAL_DATA_EXPORT_MANIFEST_BUILDER_V0_1.md",
  "scripts/smoke-local-data-export-policy-v0-1.mjs",
  "lib/git-ledger/build-export-packet-from-local-manifest.ts",
  "lib/git-ledger/build-export-packet.ts",
  "fixtures/git-ledger-export-from-local-manifest.sample.v0.1.json",
  "scripts/smoke-git-ledger-export-from-local-manifest-v0-1.mjs",
  "docs/GIT_LEDGER_EXPORT_FROM_LOCAL_MANIFEST_V0_1.md",
  "types/runtime-audit-event.ts",
  "lib/runtime-audit/audit-event-store.ts",
  "fixtures/selected-runtime-audit-event-store.sample.v0.1.json",
  "scripts/smoke-selected-runtime-audit-event-store-v0-1.mjs",
  "docs/SELECTED_RUNTIME_AUDIT_EVENT_STORE_V0_1.md",
  "docs/RELEASE_READINESS_MATRIX_POST_868_NON_UI_V0_1.md",
  "fixtures/release-readiness-matrix-post-868-non-ui.sample.v0.1.json",
  "scripts/smoke-release-readiness-matrix-post-868-non-ui-v0-1.mjs",
]);

const newSliceFiles = [
  "docs/RELEASE_READINESS_MATRIX_POST_868_NON_UI_V0_1.md",
  "fixtures/release-readiness-matrix-post-868-non-ui.sample.v0.1.json",
  "scripts/smoke-release-readiness-matrix-post-868-non-ui-v0-1.mjs",
];

const requiredHelperExports = [
  "buildReviewMemoryProposalFromDogfoodingRecordV01",
  "buildDogfoodingRecordToReviewMemoryProposalV01",
  "buildDogfoodingToReviewMemoryProposalV01",
  "createDogfoodingToReviewMemoryProposalAuthorityBoundaryV01",
  "createProposalFingerprintV01",
];

const requiredDocsPhrases = [
  "PR #868 is treated as the frozen web baseline.",
  "PR #874 provides dogfooding record to handoff packet binding context.",
  "This slice adds no UI, components, route model changes, or API routes.",
  "Dogfooding record to Review Memory proposal is not Review Memory write.",
  "Dogfooding record to Review Memory proposal is not execution approval.",
  "Dogfooding record to Review Memory proposal is not truth.",
  "Dogfooding record to Review Memory proposal is not proof.",
  "Dogfooding record to Review Memory proposal is not accepted evidence.",
  "Review Memory proposal is candidate-only.",
  "Review Memory proposal is not saved Review Memory.",
  "Operator confirmation is required before any Review Memory write.",
  "Proposed save_review_note is not Review Memory write.",
  "Proposed request_more_evidence is not source fetch.",
  "Proposed mark_needs_followup is not automatic task creation.",
  "Proposed mark_superseded is not deletion.",
  "Proposed mark_duplicate is not deletion.",
  "Changed files are not proof.",
  "Validation pass is not approval.",
  "Validation failure is not automatic rejection.",
  "CI pass is not authority.",
  "Skipped checks are review context, not failure by themselves.",
  "Known warnings are review context, not automatic rejection.",
  "Not-done items are next-task cues, not automatic task creation.",
  "Expected/observed delta is reconciliation context, not approval or rejection.",
  "`local_data_export_manifest_builder_v0_1`",
];

const forbiddenHelperSnippets = [
  "from \"openai\"",
  "from 'openai'",
  "fetch(",
  "NextResponse",
  "Database(",
  "PrismaClient",
  "execFile",
  "spawn",
  "github_api_call_now: true",
  "provider_openai_call_now: true",
  "retrieval_execution_now: true",
  "source_fetch_now: true",
  "review_memory_write_now: true",
  "review_memory_write_executed: true",
  "proof_or_evidence_record_now: true",
  "promotion_execution_now: true",
  "formation_receipt_write_now: true",
  "durable_state_apply_now: true",
  "product_write_now: true",
  "release_deploy_publish_now: true",
];

for (const requiredPath of [
  typePath,
  helperPath,
  dogfoodingTypePath,
  dogfoodingStorePath,
  handoffHelperPath,
  fixturePath,
  handoffFixturePath,
  smokePath,
  handoffSmokePath,
  packetSmokePath,
  codexBindingSmokePath,
  dogfoodingSmokePath,
  docsPath,
  handoffDocsPath,
  dogfoodingDocsPath,
  reconciliationDocsPath,
  packagePath,
  indexPath,
]) {
  assert.ok(existsSync(requiredPath), `required path must exist: ${requiredPath}`);
}

const typeText = read(typePath);
const helperText = read(helperPath);
const fixtureText = read(fixturePath);
const fixture = JSON.parse(fixtureText);
const docsText = read(docsPath);
const indexText = read(indexPath);
const packageJson = JSON.parse(read(packagePath));
const handoffSmokeText = read(handoffSmokePath);
const packetSmokeText = read(packetSmokePath);
const codexBindingSmokeText = read(codexBindingSmokePath);
const dogfoodingSmokeText = read(dogfoodingSmokePath);
const helper = await import(pathToFileURL(`${process.cwd()}/${helperPath}`).href);

assertFixtureVersions();
assertStaticCoverage();
assertSingleRecordBehavior();
assertMultipleRecordBehavior();
assertSummaryOnlyBehavior();
assertAllowedNegatedAuthorityText();
assertBlockedInputBehavior();
const changedFileScopeReasonCode = assertChangedFileScope();

console.log(
  JSON.stringify(
    {
      smoke: "dogfooding-to-review-memory-proposal-v0-1",
      final_status: "pass",
      selected_slice: selectedSlice,
      next_recommended_slice: nextSlice,
      action_candidates_checked: fixture.allowed_action_candidates.length,
      changed_file_scope_checked: true,
      changed_file_scope_reason_code: changedFileScopeReasonCode,
    },
    null,
    2,
  ),
);

function assertFixtureVersions() {
  assert.equal(fixture.fixture_version, fixtureVersion);
  assert.equal(fixture.proposal_version, proposalVersion);
  assert.equal(fixture.builder_version, builderVersion);
  assert.equal(fixture.selected_slice, selectedSlice);
  assert.equal(fixture.next_recommended_slice, nextSlice);
  assert.equal(fixture.scope, scope);
  assert.deepEqual(
    fixture.allowed_action_candidates,
    [
      "save_review_note",
      "request_more_evidence",
      "mark_needs_followup",
      "mark_validation_incomplete",
      "mark_superseded",
      "mark_duplicate",
      "prepare_handoff_later",
    ],
  );
  assert.equal(fixture.post_868_boundary.pr_868_is_frozen_web_baseline, true);
  assert.equal(fixture.post_868_boundary.ui_in_scope, false);
  assert.equal(fixture.post_868_boundary.review_memory_write_in_scope, false);
}

function assertStaticCoverage() {
  assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
  for (const pointer of [docsPath, fixturePath, smokePath]) {
    assert.ok(indexText.includes(pointer), `latest index must include ${pointer}`);
  }
  for (const phrase of requiredDocsPhrases) {
    assert.ok(
      includesNormalized(docsText, phrase),
      `docs must include required phrase: ${phrase}`,
    );
  }
  for (const exportName of requiredHelperExports) {
    assert.ok(helperText.includes(exportName), `helper must export ${exportName}`);
  }
  for (const action of fixture.allowed_action_candidates) {
    assert.ok(typeText.includes(`"${action}"`), `type contract must include ${action}`);
  }
  for (const snippet of forbiddenHelperSnippets) {
    assert.ok(!helperText.includes(snippet), `helper must not include ${snippet}`);
  }
  assert.ok(
    !helperText.includes("review-memory-store"),
    "helper must not import Review Memory store",
  );
  assert.ok(
    !helperText.includes("app/api"),
    "helper must not import or add API route behavior",
  );
  for (const pointer of newSliceFiles) {
    assert.ok(
      handoffSmokeText.includes(pointer),
      `handoff smoke changed-file guard must include ${pointer}`,
    );
    assert.ok(
      packetSmokeText.includes(pointer),
      `packet smoke changed-file guard must include ${pointer}`,
    );
    assert.ok(
      codexBindingSmokeText.includes(pointer),
      `codex binding smoke changed-file guard must include ${pointer}`,
    );
    assert.ok(
      dogfoodingSmokeText.includes(pointer),
      `dogfooding research smoke changed-file guard must include ${pointer}`,
    );
  }
  for (const oldSmoke of [
    handoffSmokeText,
    packetSmokeText,
    codexBindingSmokeText,
    dogfoodingSmokeText,
  ]) {
    assert.doesNotMatch(
      oldSmoke,
      /dogfooding-to-review-memory-proposal.*\*\*/i,
      "compatibility guards must not become broad future-slice allowlists",
    );
  }
}

function assertSingleRecordBehavior() {
  const result = helper.buildReviewMemoryProposalFromDogfoodingRecordV01(
    fixture.safe_single_record_input,
  );
  assert.equal(result.ok, true);
  assert.equal(result.status, "proposed");
  assert.equal(result.error_code, null);
  assert.equal(result.proposal.proposal_version, proposalVersion);
  assert.equal(result.proposal.builder_version, builderVersion);
  assert.equal(result.proposal.scope, scope);
  assert.equal(result.proposal.operator_confirmation_required, true);
  assert.equal(result.proposal.review_memory_write_executed, false);
  assert.equal(result.proposal.review_memory_write_preview.preview_only, true);
  assert.equal(result.proposal.review_memory_write_preview.write_executed, false);
  assert.ok(
    result.proposal.source_dogfooding_record_refs.includes(
      fixture.safe_single_record_input.record_id,
    ),
  );
  assert.ok(
    result.proposal.changed_file_refs.includes(
      "lib/handoff/build-handoff-from-dogfooding-record.ts",
    ),
    "changed_file_refs must be preserved as context",
  );
  assert.ok(
    result.proposal.validation_refs.includes(
      "npm run smoke:conversation-handoff-from-dogfooding-record-v0-1",
    ),
    "validation_refs must be preserved as diagnostic context",
  );
  assert.ok(
    result.proposal.skipped_check_refs.includes("skipped:none"),
    "skipped checks must be preserved",
  );
  assert.ok(
    result.proposal.known_warning_refs.includes(
      "warning:privacy-smoke-node-experimental-strip-types",
    ),
    "known warnings must be preserved",
  );
  assert.ok(
    result.proposal.not_done_refs.includes(
      "not-done:review-memory-proposal-remained-next-slice",
    ),
    "not-done items must be preserved",
  );
  assert.ok(
    result.proposal.expected_observed_delta_refs.includes(
      "delta:review-memory-proposal-was-not-yet-built",
    ),
    "expected/observed delta must be preserved",
  );
  assert.ok(
    result.proposal.proposed_review_actions.some(
      (action) => action.action === "save_review_note",
    ),
    "single record should propose save_review_note as candidate only",
  );
  assertNoExecutionFlags(result);
  assertProposalAuthorityBoundary(result.proposal);
}

function assertMultipleRecordBehavior() {
  const first = helper.buildReviewMemoryProposalFromDogfoodingRecordV01(
    fixture.safe_multiple_records_input,
  );
  const second = helper.buildReviewMemoryProposalFromDogfoodingRecordV01(
    fixture.safe_multiple_records_input,
  );
  assert.deepEqual(first, second, "same input must produce deterministic output");
  assert.equal(first.ok, true);
  assert.equal(first.proposal.proposal_id, "review-memory-proposal:dogfooding:fixture-multi");
  assert.equal(first.proposal.review_memory_write_executed, false);
  assert.equal(first.proposal.operator_confirmation_required, true);
  assert.equal(first.proposal.proposal_fingerprint, second.proposal.proposal_fingerprint);
  assert.equal(
    first.proposal.candidate_review_summary,
    second.proposal.candidate_review_summary,
  );
  const actions = first.proposal.proposed_review_actions.map((action) => action.action);
  for (const action of fixture.allowed_action_candidates) {
    assert.ok(actions.includes(action), `multi input must generate ${action}`);
  }
  for (const action of first.proposal.proposed_review_actions) {
    assert.equal(action.candidate_only, true);
    assert.equal(action.executed, false);
    assert.equal(action.authority_boundary.proposed_action_is_executed_action, false);
    assert.equal(action.authority_boundary.proposed_save_review_note_is_review_memory_write, false);
    assert.equal(action.authority_boundary.proposed_request_more_evidence_is_source_fetch, false);
    assert.equal(
      action.authority_boundary.proposed_mark_needs_followup_is_automatic_task_creation,
      false,
    );
    assert.equal(action.authority_boundary.proposed_mark_superseded_is_deletion, false);
    assert.equal(action.authority_boundary.proposed_mark_duplicate_is_deletion, false);
  }
  assert.ok(
    first.proposal.reason_codes.includes(
      "changed_file_refs_preserved_as_context_not_proof",
    ),
  );
  assert.ok(
    first.proposal.reason_codes.includes(
      "expected_observed_delta_refs_preserved_as_reconciliation_context",
    ),
  );
  assertNoExecutionFlags(first);
  assertProposalAuthorityBoundary(first.proposal);
}

function assertSummaryOnlyBehavior() {
  const result = helper.buildDogfoodingRecordToReviewMemoryProposalV01(
    fixture.safe_summary_input,
  );
  assert.equal(result.ok, true);
  assert.equal(result.status, "proposed");
  assert.deepEqual(
    result.proposal.source_dogfooding_record_refs,
    fixture.safe_summary_input.source_dogfooding_record_refs,
  );
  assert.ok(
    result.proposal.changed_file_refs.includes(
      "lib/dogfooding/build-review-memory-proposal.ts",
    ),
  );
  assert.ok(
    result.proposal.validation_refs.includes(
      "npm run smoke:dogfooding-to-review-memory-proposal-v0-1",
    ),
  );
  assert.ok(
    result.proposal.candidate_review_summary.includes(
      "Build a proposal candidate",
    ),
  );
}

function assertAllowedNegatedAuthorityText() {
  for (const text of fixture.allowed_negated_authority_examples) {
    const result = helper.buildReviewMemoryProposalFromDogfoodingRecordV01({
      record_id: `dogfooding-research-record:allowed-negated:${slug(text)}`,
      normalized_summary: text,
      changed_file_refs: ["lib/dogfooding/build-review-memory-proposal.ts"],
      validation_refs: ["npm run smoke:dogfooding-to-review-memory-proposal-v0-1"],
    });
    assert.equal(result.ok, true, `negated boundary text must be accepted: ${text}`);
  }
}

function assertBlockedInputBehavior() {
  const privateResult = helper.buildReviewMemoryProposalFromDogfoodingRecordV01(
    fixture.blocked_private_or_raw_payload_example,
  );
  assert.equal(privateResult.ok, false);
  assert.equal(privateResult.status, "blocked_private_or_raw_payload");
  assert.equal(privateResult.proposal, null);
  assert.doesNotMatch(JSON.stringify(privateResult), /SAFE_MARKER_HIDDEN_REASONING/);

  const structuredAuthority =
    helper.buildReviewMemoryProposalFromDogfoodingRecordV01(
      fixture.blocked_structured_authority_example,
    );
  assert.equal(structuredAuthority.ok, false);
  assert.equal(structuredAuthority.status, "blocked_forbidden_authority");
  assert.equal(structuredAuthority.proposal, null);

  for (const testCase of fixture.blocked_forbidden_authority_string_claim_cases) {
    const phrase = testCase.phrase_parts.join(" ");
    const input = {
      record_id: `dogfooding-research-record:blocked-phrase:${testCase.case_id}`,
      normalized_summary: "Candidate summary remains public-safe.",
      changed_file_refs: ["lib/dogfooding/build-review-memory-proposal.ts"],
      validation_refs: ["npm run smoke:dogfooding-to-review-memory-proposal-v0-1"],
    };
    if (testCase.target === "review_cues") {
      input.review_cues = [phrase];
    } else {
      input.normalized_summary = phrase;
    }
    const result = helper.buildReviewMemoryProposalFromDogfoodingRecordV01(input);
    assert.equal(result.ok, false, `${testCase.case_id} must be blocked`);
    assert.equal(result.status, "blocked_forbidden_authority");
    assert.equal(result.proposal, null);
    assert.doesNotMatch(JSON.stringify(result), new RegExp(escapeRegExp(phrase), "i"));
    assert.ok(
      result.reason_codes.includes("forbidden_authority_blocked"),
      `${testCase.case_id} must include forbidden authority reason`,
    );
  }
}

function assertProposalAuthorityBoundary(proposal) {
  assert.equal(proposal.authority_boundary.candidate_only_review_memory_proposal, true);
  assert.equal(proposal.authority_boundary.operator_confirmation_required, true);
  assert.equal(proposal.authority_boundary.review_memory_write_preview_only, true);
  for (const field of fixture.required_authority_boundary_false_fields) {
    assert.equal(
      proposal.authority_boundary[field],
      false,
      `authority boundary field ${field} must remain false`,
    );
  }
  assert.equal(
    proposal.authority_boundary.dogfooding_record_to_review_memory_proposal_is_review_memory_write,
    false,
  );
  assert.equal(proposal.authority_boundary.review_memory_proposal_is_saved_review_memory, false);
  assert.equal(proposal.authority_boundary.proposed_review_action_is_executed_action, false);
  assert.equal(proposal.authority_boundary.proposed_save_review_note_is_review_memory_write, false);
  assert.equal(proposal.authority_boundary.proposed_request_more_evidence_is_source_fetch, false);
  assert.equal(
    proposal.authority_boundary.proposed_mark_needs_followup_is_automatic_task_creation,
    false,
  );
  assert.equal(proposal.authority_boundary.proposed_mark_superseded_is_deletion, false);
  assert.equal(proposal.authority_boundary.proposed_mark_duplicate_is_deletion, false);
  assert.equal(proposal.authority_boundary.validation_pass_is_approval, false);
  assert.equal(proposal.authority_boundary.validation_failure_is_rejection, false);
  assert.equal(proposal.authority_boundary.ci_pass_is_authority, false);
  assert.equal(proposal.authority_boundary.skipped_checks_are_automatic_failure, false);
  assert.equal(proposal.authority_boundary.known_warnings_are_automatic_rejection, false);
  assert.equal(proposal.authority_boundary.not_done_items_are_automatic_task_creation, false);
  assert.equal(
    proposal.authority_boundary.expected_observed_delta_is_approval_or_rejection,
    false,
  );
}

function assertNoExecutionFlags(result) {
  for (const flag of fixture.required_false_execution_flags) {
    assert.equal(result[flag], false, `result flag ${flag} must be false`);
  }
}

function assertChangedFileScope() {
  const changedFiles = getChangedFiles();
  if (changedFiles.length === 0) {
    assert.ok(
      isCleanMergedMainTree(),
      "changed-file scope must inspect a non-empty delta unless clean merged-main mode applies",
    );
    return "post_merge_clean_tree_no_changed_file_delta";
  }
  if (getBoundarySmokeMode() === "content-only") {
    return "changed_file_scope_skipped_content_only";
  }
  for (const filePath of changedFiles) {
    assert.ok(expectedChangedFiles.has(filePath), `Unexpected changed file: ${filePath}`);
    assert.ok(!filePath.startsWith("components/"), `No component files allowed: ${filePath}`);
    assert.ok(!filePath.startsWith("app/"), `No app/route files allowed: ${filePath}`);
    assert.ok(!filePath.includes("/migrations/"), `No DB migration files allowed: ${filePath}`);
  }
  for (const requiredPath of newSliceFiles) {
    assert.ok(changedFiles.includes(requiredPath), `changed files must include ${requiredPath}`);
  }
  return "changed_file_scope_checked";
}

function getBoundarySmokeMode() {
  const mode = process.env.AUGNES_BOUNDARY_SMOKE_MODE || "scoped";
  assert.ok(
    ["scoped", "content-only"].includes(mode),
    `AUGNES_BOUNDARY_SMOKE_MODE must be unset, scoped, or content-only; received ${JSON.stringify(mode)}`,
  );
  return mode;
}

function getChangedFiles() {
  const candidates = new Set();
  for (const args of [
    ["diff", "--name-only", "origin/main...HEAD"],
    ["diff", "--name-only"],
    ["diff", "--cached", "--name-only"],
    ["ls-files", "--others", "--exclude-standard"],
  ]) {
    const output = execFileSync("git", args, { encoding: "utf8" }).trim();
    for (const filePath of output.split("\n").filter(Boolean)) {
      candidates.add(filePath);
    }
  }
  return Array.from(candidates).sort();
}

function isCleanMergedMainTree() {
  return (
    gitOutput(["status", "--short"]) === "" &&
    gitOutput(["diff", "--name-only"]) === "" &&
    gitOutput(["diff", "--cached", "--name-only"]) === "" &&
    gitOutput(["ls-files", "--others", "--exclude-standard"]) === "" &&
    isHeadOnMainOrCurrentMain()
  );
}

function isHeadOnMainOrCurrentMain() {
  const head = gitOutput(["rev-parse", "HEAD"]);
  const branch = gitOutput(["branch", "--show-current"]);
  if (branch === "main") return true;
  for (const ref of ["main", "refs/heads/main", "origin/main", "refs/remotes/origin/main"]) {
    if (gitOutputOrNull(["rev-parse", "--verify", ref]) === head) return true;
  }
  return false;
}

function gitOutput(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function gitOutputOrNull(args) {
  try {
    return gitOutput(args);
  } catch {
    return null;
  }
}

function read(filePath) {
  return readFileSync(filePath, "utf8");
}

function includesNormalized(source, phrase) {
  return source.replace(/\s+/g, " ").includes(phrase.replace(/\s+/g, " "));
}

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
