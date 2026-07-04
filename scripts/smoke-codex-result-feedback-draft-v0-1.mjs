#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertPackageScript,
  collectUntrackedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const typeFile = "types/codex-result-feedback-draft.ts";
const helperFile = "lib/dogfooding/codex-result-feedback-draft.ts";
const panelFile = "components/codex-result-feedback-draft-panel.tsx";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-codex-result-feedback-draft-v0-1.mjs";
const workplanePanelsSmokeFile = "scripts/smoke-agent-workplane-panels-v0-1.mjs";
const dogfoodReuseProposalTypeFile =
  "types/dogfood-reuse-record-proposal.ts";
const dogfoodReuseProposalHelperFile =
  "lib/dogfooding/dogfood-reuse-record-proposal.ts";
const dogfoodReuseProposalPanelFile =
  "components/dogfood-reuse-record-proposal-panel.tsx";
const dogfoodReuseProposalSmokeFile =
  "scripts/smoke-dogfood-reuse-record-proposal-v0-1.mjs";
const dogfoodReuseDecisionTypeFile =
  "types/dogfood-reuse-operator-decision-preview.ts";
const dogfoodReuseDecisionHelperFile =
  "lib/dogfooding/dogfood-reuse-operator-decision-preview.ts";
const dogfoodReuseDecisionPanelFile =
  "components/dogfood-reuse-operator-decision-preview-panel.tsx";
const dogfoodReuseDecisionSmokeFile =
  "scripts/smoke-dogfood-reuse-operator-decision-preview-v0-1.mjs";
const normalizerFile = "lib/dogfooding/codex-result-report-normalizer.ts";
const handoffRationaleTypeFile = "types/handoff-context-relay-rationale.ts";
const handoffRationaleHelperFile = "lib/handoff/handoff-context-relay-rationale.ts";
const handoffRationaleSmokeFile =
  "scripts/smoke-handoff-context-relay-rationale-v0-1.mjs";
const continuityRelaySmokeFile =
  "scripts/smoke-workplane-continuity-relay-v0-1.mjs";
const fixtureFile = "fixtures/codex-result-report-ingestion.sample.v0.1.json";

const allowedChangedFiles = [
  typeFile,
  helperFile,
  panelFile,
  agentWorkplaneFile,
  packageJsonFile,
  smokeFile,
  workplanePanelsSmokeFile,
  handoffRationaleSmokeFile,
  continuityRelaySmokeFile,
  dogfoodReuseProposalTypeFile,
  dogfoodReuseProposalHelperFile,
  dogfoodReuseProposalPanelFile,
  dogfoodReuseProposalSmokeFile,
  dogfoodReuseDecisionTypeFile,
  dogfoodReuseDecisionHelperFile,
  dogfoodReuseDecisionPanelFile,
  dogfoodReuseDecisionSmokeFile,
];

const textByFile = loadTextByFile([
  ...allowedChangedFiles,
  normalizerFile,
  handoffRationaleTypeFile,
  handoffRationaleHelperFile,
  handoffRationaleSmokeFile,
  continuityRelaySmokeFile,
  fixtureFile,
]);

const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const panelText = textByFile.get(panelFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const packageJsonText = textByFile.get(packageJsonFile);
const workplanePanelsSmokeText = textByFile.get(workplanePanelsSmokeFile);
const normalizerText = textByFile.get(normalizerFile);
const handoffRationaleTypeText = textByFile.get(handoffRationaleTypeFile);
const handoffRationaleHelperText = textByFile.get(handoffRationaleHelperFile);
const fixture = JSON.parse(readFileSync(fixtureFile, "utf8"));

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:codex-result-feedback-draft-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-codex-result-feedback-draft-v0-1.mjs",
});

assertContainsAll(
  typeText,
  [
    "codex_result_feedback_draft.v0.1",
    "source_refs",
    "result_report_refs",
    "handoff_context_refs",
    "expected_return_signal",
    "observed_return_signal",
    "expected_observed_delta",
    "reuse_outcome_draft",
    "carry_forward_suggestions",
    "insufficient_data_reasons",
    "stale_or_gap_warnings",
    "authority_boundary",
    "candidate_status",
    "source_status",
    "read_only: true",
    "candidate_material_only: true",
    "source_of_truth: false",
    "can_write_db: false",
    "can_write_dogfood_ledger: false",
    "can_mutate_memory: false",
    "can_promote_memory: false",
    "can_apply_project_perspective: false",
    "can_call_provider_openai: false",
    "can_call_github: false",
    "can_execute_codex: false",
    "can_send_handoff: false",
    "can_create_pr: false",
    "can_merge_pr: false",
    "can_run_autonomous_action: false",
    "can_create_graph_or_vector_store: false",
    "can_create_rag_stack: false",
    "can_crawl_or_observe_browser: false",
  ],
  { label: typeFile },
);

assertContainsAll(
  helperText,
  [
    "buildCodexResultFeedbackDraft",
    "CodexResultReportIngestionRecordV01",
    "HandoffContextRelayRationale",
    "expected_return_signal",
    "observed_return_signal",
    "matched_expectations",
    "missing_expectations",
    "skipped_or_unverified_checks",
    "helpful_refs",
    "stale_refs",
    "missing_refs",
    "noisy_refs",
    "misleading_refs",
    "unknown_refs",
    "missing_handoff_context_rationale",
    "missing_codex_result_report",
    "missing_context_reuse_feedback_signal",
    "ask_next_result_for",
    "read_only: true",
    "candidate_material_only: true",
    "can_write_db: false",
    "can_write_dogfood_ledger: false",
    "can_mutate_memory: false",
    "can_execute_codex: false",
    "can_send_handoff: false",
  ],
  { label: helperFile },
);
assertNoForbiddenRuntimeCode(helperFile, helperText);

assertContainsAll(
  panelText,
  [
    "CodexResultFeedbackDraftPanel",
    "Feedback draft",
    "sample fixture preview",
    "source status",
    "result report",
    "report fingerprint",
    "expected vs observed",
    "skipped checks",
    "reuse outcome",
    "stale",
    "missing",
    "noisy",
    "misleading",
    "carry forward",
    "insufficient data",
    "Read-only candidate material",
    "can_write_db",
    "can_mutate_memory",
    "can_execute_codex",
    "can_send_handoff",
  ],
  { label: panelFile },
);
assertNoForbiddenRuntimeCode(panelFile, panelText);

assertContainsAll(
  agentWorkplaneText,
  [
    "CodexResultFeedbackDraftPanel",
    "DogfoodReuseRecordProposalPanel",
    "DogfoodReuseOperatorDecisionPreviewPanel",
    "buildCodexResultFeedbackDraft",
    "buildDogfoodReuseRecordProposal",
    "buildDogfoodReuseOperatorDecisionPreview",
    "handoff_context_rationale: handoffContextRationale",
    "result_report: null",
    "feedback_draft: codexResultFeedbackDraft",
    "proposal: dogfoodReuseRecordProposal",
    "draft={codexResultFeedbackDraft}",
  ],
  { label: agentWorkplaneFile },
);
assert(
  !agentWorkplaneText.includes("codex-result-report-ingestion.sample.v0.1.json"),
  "default AgentWorkplane render must not import the Codex result sample fixture",
);
assert(
  !agentWorkplaneText.includes("codexResultReportSample.safe_input_example"),
  "default AgentWorkplane render must not normalize sample fixture input",
);
assert(
  !agentWorkplaneText.includes("normalizeCodexResultReportV01("),
  "default AgentWorkplane render must not normalize a sample result report",
);
assert(
  !agentWorkplaneText.includes("result_report: codexResultReport"),
  "default AgentWorkplane render must not pass a fixture-backed report",
);

assertContainsAll(
  workplanePanelsSmokeText,
  [
    "followOnCodexResultFeedbackDraftFiles",
    "CodexResultFeedbackDraftPanel",
    "buildCodexResultFeedbackDraft",
    "codex-result-report-ingestion.sample.v0.1.json",
  ],
  { label: workplanePanelsSmokeFile },
);

assertContainsAll(
  normalizerText,
  [
    "normalizeCodexResultReportV01",
    "CodexResultReportIngestionRecordV01",
    "changed_file_refs",
    "observed_check_refs",
    "skipped_check_refs",
    "not_done_refs",
    "expected_observed_delta_refs",
  ],
  { label: normalizerFile },
);
assertContainsAll(
  handoffRationaleTypeText,
  ["HandoffContextRelayRationale", "expected_return_signal", "selected_refs"],
  { label: handoffRationaleTypeFile },
);
assertContainsAll(
  handoffRationaleHelperText,
  ["buildHandoffContextRelayRationale", "expected_return_signal"],
  { label: handoffRationaleHelperFile },
);

const { readGuideBriefForWeb } = await import(
  "../lib/guide/read-guide-brief-for-web.ts"
);
const { readWorkplaneContext } = await import(
  "../lib/workplane/read-workplane-context.ts"
);
const { readHandoffCapsulePreviewForWeb } = await import(
  "../lib/handoff/read-handoff-capsule-for-web.ts"
);
const { buildHandoffContextRelayRationale } = await import(
  "../lib/handoff/handoff-context-relay-rationale.ts"
);
const { normalizeCodexResultReportV01 } = await import(
  "../lib/dogfooding/codex-result-report-normalizer.ts"
);
const { buildCodexResultFeedbackDraft } = await import(
  "../lib/dogfooding/codex-result-feedback-draft.ts"
);
const { CODEX_RESULT_FEEDBACK_DRAFT_VERSION } = await import(
  "../types/codex-result-feedback-draft.ts"
);

const guideBrief = readGuideBriefForWeb();
const workplaneContext = await readWorkplaneContext({ guide_brief: guideBrief });
const handoffPreview = readHandoffCapsulePreviewForWeb();
const rationale = buildHandoffContextRelayRationale({
  continuity_relay: workplaneContext.continuity_relay,
  handoff_preview: handoffPreview,
});
const normalizedReport = normalizeCodexResultReportV01(fixture.safe_input_example);
const draft = buildCodexResultFeedbackDraft({
  handoff_context_rationale: rationale,
  result_report: normalizedReport,
});

assert.equal(draft.draft_version, CODEX_RESULT_FEEDBACK_DRAFT_VERSION);
assert.equal(draft.source_status.handoff_context_rationale, "supplied");
assert.equal(draft.source_status.codex_result_report, "supplied");
assert.equal(
  draft.result_report_refs.result_report_ref,
  fixture.safe_input_example.report_id,
);
assert(
  draft.result_report_refs.result_report_fingerprint,
  "fixture-backed draft must expose a result report fingerprint",
);
assert.equal(draft.authority_boundary.read_only, true);
assert.equal(draft.authority_boundary.candidate_material_only, true);
assert.equal(draft.authority_boundary.source_of_truth, false);
assert.equal(draft.authority_boundary.can_write_db, false);
assert.equal(draft.authority_boundary.can_write_dogfood_ledger, false);
assert.equal(draft.authority_boundary.can_mutate_memory, false);
assert.equal(draft.authority_boundary.can_promote_memory, false);
assert.equal(draft.authority_boundary.can_apply_project_perspective, false);
assert.equal(draft.authority_boundary.can_call_provider_openai, false);
assert.equal(draft.authority_boundary.can_call_github, false);
assert.equal(draft.authority_boundary.can_execute_codex, false);
assert.equal(draft.authority_boundary.can_send_handoff, false);
assert.equal(draft.authority_boundary.can_create_pr, false);
assert.equal(draft.authority_boundary.can_merge_pr, false);
assert.equal(draft.authority_boundary.can_run_autonomous_action, false);
assert.equal(draft.authority_boundary.can_create_graph_or_vector_store, false);
assert.equal(draft.authority_boundary.can_create_rag_stack, false);
assert.equal(draft.authority_boundary.can_crawl_or_observe_browser, false);

for (const field of [
  "changed_files",
  "checks_run",
  "skipped_checks",
  "requirement_progress",
]) {
  assert(
    draft.expected_observed_delta.matched_expectations.some(
      (item) => item.field === field,
    ),
    `${field} must be matched from the normalized report`,
  );
}
assert(
  draft.expected_observed_delta.missing_expectations.some(
    (item) => item.field === "context_helpful_or_stale_refs",
  ),
  "missing context feedback must be visible as missing expectation",
);
assert(
  draft.expected_observed_delta.missing_expectations.some(
    (item) => item.field === "next_relay_update_suggestions",
  ),
  "missing next relay suggestions must be visible as missing expectation",
);
assert(draft.expected_observed_delta.skipped_or_unverified_checks.length > 0);
for (const skippedCheck of draft.expected_observed_delta
  .skipped_or_unverified_checks) {
  assert(
    !draft.expected_observed_delta.checks_observed.includes(skippedCheck),
    "skipped checks must stay separate from checks_observed",
  );
}
assert(draft.expected_observed_delta.not_done_items.length > 0);
assert.equal(draft.reuse_outcome_draft.helpful_refs.length, 0);
assert(draft.reuse_outcome_draft.unknown_refs.length > 0);
assert(
  draft.insufficient_data_reasons.includes(
    "missing_context_reuse_feedback_signal",
  ),
);
assert(draft.carry_forward_suggestions.next_relay_update_suggestions.length > 0);
assert(draft.carry_forward_suggestions.next_handoff_adjustments.length > 0);

const defaultWorkbenchDraft = buildCodexResultFeedbackDraft({
  handoff_context_rationale: rationale,
  result_report: null,
});
assert.equal(defaultWorkbenchDraft.candidate_status, "insufficient_data");
assert.equal(defaultWorkbenchDraft.source_status.codex_result_report, "missing");
assert.equal(defaultWorkbenchDraft.result_report_refs.result_report_ref, null);
assert.equal(
  defaultWorkbenchDraft.result_report_refs.result_report_fingerprint,
  null,
);
assert(
  defaultWorkbenchDraft.insufficient_data_reasons.includes(
    "missing_codex_result_report",
  ),
  "default Workbench draft must surface missing Codex result report",
);

const reusableRefs = rationale.selected_refs
  .filter((ref) => !ref.ref_id.startsWith("missing:"))
  .slice(0, 5);
assert(reusableRefs.length >= 5, "fixture rationale must expose selected refs");
const explicitFeedbackReport = normalizeCodexResultReportV01({
  ...fixture.safe_input_example,
  report_id: "codex-result-report:feedback-draft-explicit-context",
  expected_observed_delta: [
    `context-helpful-ref:${reusableRefs[0].ref_id}`,
    `context-stale-ref:${reusableRefs[1].ref_id}`,
    `context-missing-ref:${reusableRefs[2].ref_id}`,
    `context-noisy-ref:${reusableRefs[3].ref_id}`,
    `context-misleading-ref:${reusableRefs[4].ref_id}`,
    "next-relay-update:ask for context classification in the next result",
  ],
});
const explicitFeedbackDraft = buildCodexResultFeedbackDraft({
  handoff_context_rationale: rationale,
  result_report: explicitFeedbackReport,
});
assert(
  explicitFeedbackDraft.reuse_outcome_draft.helpful_refs.some(
    (ref) => ref.ref_id === reusableRefs[0].ref_id,
  ),
  "explicit helpful context feedback must classify helpful_refs",
);
assert(
  explicitFeedbackDraft.reuse_outcome_draft.stale_refs.some(
    (ref) => ref.ref_id === reusableRefs[1].ref_id,
  ),
  "explicit stale context feedback must classify stale_refs",
);
assert(
  explicitFeedbackDraft.reuse_outcome_draft.missing_refs.some(
    (ref) => ref.ref_id === reusableRefs[2].ref_id,
  ),
  "explicit missing context feedback must classify missing_refs",
);
assert(
  explicitFeedbackDraft.reuse_outcome_draft.noisy_refs.some(
    (ref) => ref.ref_id === reusableRefs[3].ref_id,
  ),
  "explicit noisy context feedback must classify noisy_refs",
);
assert(
  explicitFeedbackDraft.reuse_outcome_draft.misleading_refs.some(
    (ref) => ref.ref_id === reusableRefs[4].ref_id,
  ),
  "explicit misleading context feedback must classify misleading_refs",
);
assert(
  explicitFeedbackDraft.observed_return_signal.next_relay_update_suggestions
    .length > 0,
  "explicit next relay update signal must be observed",
);

const missingRationaleDraft = buildCodexResultFeedbackDraft({
  handoff_context_rationale: null,
  result_report: normalizedReport,
});
assert.equal(missingRationaleDraft.candidate_status, "insufficient_data");
assert(
  missingRationaleDraft.insufficient_data_reasons.includes(
    "missing_handoff_context_rationale",
  ),
);
assert.equal(
  missingRationaleDraft.source_status.handoff_context_rationale,
  "missing",
);

const missingReportDraft = buildCodexResultFeedbackDraft({
  handoff_context_rationale: rationale,
  result_report: null,
});
assert.equal(missingReportDraft.candidate_status, "insufficient_data");
assert(
  missingReportDraft.insufficient_data_reasons.includes(
    "missing_codex_result_report",
  ),
);
assert.equal(missingReportDraft.source_status.codex_result_report, "missing");

const changedFilesBoundary = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "codex-result-feedback-draft-v0-1",
});
const untrackedFiles = collectUntrackedFiles();
const changedAndUntrackedFiles = uniqueSorted([
  ...changedFilesBoundary.files,
  ...untrackedFiles,
]);
for (const file of changedAndUntrackedFiles) {
  assert(
    allowedChangedFiles.includes(file),
    `Unexpected Codex result feedback draft file: ${file}`,
  );
}

console.log(
  JSON.stringify(
    {
      smoke: "codex-result-feedback-draft-v0-1",
      pass: true,
      matched_expectation_count:
        draft.expected_observed_delta.matched_expectations.length,
      missing_expectation_count:
        draft.expected_observed_delta.missing_expectations.length,
      skipped_checks_preserved:
        draft.expected_observed_delta.skipped_or_unverified_checks.length,
      unknown_ref_count: draft.reuse_outcome_draft.unknown_refs.length,
      explicit_context_feedback_checked: true,
      missing_partial_input_checked: true,
      carry_forward_suggestions_checked: true,
      authority_boundary_checked: true,
      consumed_handoff_context_rationale: true,
      consumed_codex_result_report: true,
      default_workbench_missing_result_checked: true,
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_observed: changedFilesBoundary.files,
      durable_write_added: false,
      dogfood_ledger_write_added: false,
      provider_call_added: false,
      github_call_added: false,
      codex_execution_added: false,
      handoff_send_added: false,
      memory_promotion_added: false,
      perspective_apply_added: false,
      graph_vector_rag_crawler_observer_added: false,
      autonomous_action_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:codex-result-feedback-draft-v0-1");

function assertNoForbiddenRuntimeCode(file, text) {
  const forbiddenPatterns = [
    /from\s+["']@\/app\//,
    /from\s+["']@\/apps\/augnes_apps/,
    /from\s+["']@\/lib\/db/,
    /from\s+["'][^"']*(openai|octokit|github|provider)[^"']*["']/i,
    /\bfetch\s*\(/,
    /\bchild_process\b/,
    /\bspawn\s*\(/,
    /\bexec\s*\(/,
    /\bwriteFile(?:Sync)?\s*\(/,
    /\bappendFile(?:Sync)?\s*\(/,
    /\bDate\.now\s*\(/,
    /\bnew\s+Date\s*\(/,
    /\bMath\.random\s*\(/,
    /\blaunchCodex\b/i,
    /\bsendHandoff\b/i,
    /\bcreatePullRequest\b/i,
    /\brecordProof\b/i,
    /\bcreateEvidenceRecord\b/i,
    /\bcreateGraph\b/i,
    /\bcreateVector\b/i,
    /\bcrawl\b/i,
  ];

  for (const pattern of forbiddenPatterns) {
    assert(!pattern.test(text), `${file} must not include ${pattern}`);
  }
}
