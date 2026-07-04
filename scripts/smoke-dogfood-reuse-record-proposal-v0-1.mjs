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

const typeFile = "types/dogfood-reuse-record-proposal.ts";
const helperFile = "lib/dogfooding/dogfood-reuse-record-proposal.ts";
const panelFile = "components/dogfood-reuse-record-proposal-panel.tsx";
const decisionTypeFile = "types/dogfood-reuse-operator-decision-preview.ts";
const decisionHelperFile =
  "lib/dogfooding/dogfood-reuse-operator-decision-preview.ts";
const decisionPanelFile =
  "components/dogfood-reuse-operator-decision-preview-panel.tsx";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-dogfood-reuse-record-proposal-v0-1.mjs";
const decisionSmokeFile =
  "scripts/smoke-dogfood-reuse-operator-decision-preview-v0-1.mjs";
const feedbackTypeFile = "types/codex-result-feedback-draft.ts";
const feedbackHelperFile = "lib/dogfooding/codex-result-feedback-draft.ts";
const feedbackPanelFile = "components/codex-result-feedback-draft-panel.tsx";
const feedbackSmokeFile = "scripts/smoke-codex-result-feedback-draft-v0-1.mjs";
const workplanePanelsSmokeFile = "scripts/smoke-agent-workplane-panels-v0-1.mjs";
const handoffRationaleSmokeFile =
  "scripts/smoke-handoff-context-relay-rationale-v0-1.mjs";
const continuityRelaySmokeFile =
  "scripts/smoke-workplane-continuity-relay-v0-1.mjs";
const ledgerTypeFile = "types/handoff-reuse-outcome-ledger.ts";
const ledgerHelperFile = "lib/dogfooding/handoff-reuse-outcome-ledger.ts";
const ledgerRouteFile = "app/api/dogfooding/reuse-ledger/route.ts";
const ledgerSmokeFile =
  "scripts/smoke-handoff-reuse-outcome-ledger-write-v0-1.mjs";
const fixtureFile = "fixtures/codex-result-report-ingestion.sample.v0.1.json";
const dogfoodMetricCandidateTypeFile =
  "types/dogfood-metric-candidate-preview.ts";
const dogfoodMetricCandidateHelperFile =
  "lib/dogfooding/dogfood-metric-candidate-preview.ts";
const dogfoodMetricCandidatePanelFile =
  "components/dogfood-metric-candidate-preview-panel.tsx";
const dogfoodMetricCandidateRouteFile =
  "app/api/dogfooding/reuse-ledger/metric-preview/route.ts";
const dogfoodMetricCandidateSmokeFile =
  "scripts/smoke-dogfood-metric-candidate-preview-v0-1.mjs";

const allowedChangedFiles = [
  typeFile,
  helperFile,
  panelFile,
  decisionTypeFile,
  decisionHelperFile,
  decisionPanelFile,
  agentWorkplaneFile,
  packageJsonFile,
  smokeFile,
  decisionSmokeFile,
  feedbackSmokeFile,
  workplanePanelsSmokeFile,
  handoffRationaleSmokeFile,
  continuityRelaySmokeFile,
  ledgerTypeFile,
  ledgerHelperFile,
  ledgerRouteFile,
  ledgerSmokeFile,
  dogfoodMetricCandidateTypeFile,
  dogfoodMetricCandidateHelperFile,
  dogfoodMetricCandidatePanelFile,
  dogfoodMetricCandidateRouteFile,
  dogfoodMetricCandidateSmokeFile,
];

const textByFile = loadTextByFile([
  ...allowedChangedFiles,
  feedbackTypeFile,
  feedbackHelperFile,
  feedbackPanelFile,
  fixtureFile,
]);

const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const panelText = textByFile.get(panelFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const packageJsonText = textByFile.get(packageJsonFile);
const feedbackHelperText = textByFile.get(feedbackHelperFile);
const fixture = JSON.parse(readFileSync(fixtureFile, "utf8"));

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:dogfood-reuse-record-proposal-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-dogfood-reuse-record-proposal-v0-1.mjs",
});

assertContainsAll(
  typeText,
  [
    "dogfood_reuse_record_proposal.v0.1",
    "source_refs",
    "feedback_draft_refs",
    "proposed_record_kind",
    "proposal_status",
    "proposed_dogfood_signal",
    "proposed_reuse_classifications",
    "proposed_expected_observed_summary",
    "evidence_summary",
    "review_required",
    "operator_review_checklist",
    "blocked_reasons",
    "insufficient_data_reasons",
    "carry_forward_candidates",
    "non_goals",
    "authority_boundary",
    "source_status",
    "proposal_ready_for_operator_review",
    "needs_more_result_signal",
    "blocked_insufficient_data",
    "blocked_missing_feedback_draft",
    "handoff_reuse_outcome_candidate",
    "read_only: true",
    "candidate_material_only: true",
    "source_of_truth: false",
    "derived_read_model: true",
    "can_write_db: false",
    "can_write_dogfood_ledger: false",
    "can_update_metrics: false",
    "can_mutate_memory: false",
    "can_promote_memory: false",
    "can_apply_project_perspective: false",
    "can_create_promotion_decision: false",
    "can_create_formation_receipt: false",
    "can_call_provider_openai: false",
    "can_call_github: false",
    "can_execute_codex: false",
    "can_send_handoff: false",
    "can_create_pr: false",
    "can_merge_pr: false",
    "can_run_autonomous_action: false",
  ],
  { label: typeFile },
);

assertContainsAll(
  helperText,
  [
    "buildDogfoodReuseRecordProposal",
    "CodexResultFeedbackDraft",
    "buildEvidenceSummary",
    "buildOperatorReviewChecklist",
    "blocked_missing_feedback_draft",
    "blocked_missing_codex_result_report",
    "missing_codex_result_report",
    "missing_explicit_context_feedback",
    "proposal_ready_for_operator_review",
    "needs_more_result_signal",
    "can_write_dogfood_ledger: false",
    "can_update_metrics: false",
    "can_mutate_memory: false",
    "can_apply_project_perspective: false",
    "can_call_provider_openai: false",
    "can_call_github: false",
    "can_execute_codex: false",
    "can_send_handoff: false",
  ],
  { label: helperFile },
);
assertNoForbiddenRuntimeCode(helperFile, helperText);

assertContainsAll(
  panelText,
  [
    "DogfoodReuseRecordProposalPanel",
    "Reuse record proposal",
    "source status",
    "expected vs observed",
    "reuse classifications",
    "helpful",
    "stale",
    "missing",
    "noisy",
    "misleading",
    "unknown",
    "operator review",
    "Read-only candidate proposal",
    "can_write_dogfood_ledger",
    "can_update_metrics",
    "can_mutate_memory",
    "can_apply_project_perspective",
  ],
  { label: panelFile },
);
assertNoForbiddenRuntimeCode(panelFile, panelText);

assertContainsAll(
  agentWorkplaneText,
  [
    "DogfoodReuseRecordProposalPanel",
    "buildDogfoodReuseRecordProposal",
    "DogfoodReuseOperatorDecisionPreviewPanel",
    "buildDogfoodReuseOperatorDecisionPreview",
    "feedback_draft: codexResultFeedbackDraft",
    "proposal: dogfoodReuseRecordProposal",
    "proposal={dogfoodReuseRecordProposal}",
    "result_report: null",
  ],
  { label: agentWorkplaneFile },
);
assert(
  !agentWorkplaneText.includes("codex-result-report-ingestion.sample.v0.1.json"),
  "default AgentWorkplane render must not import the Codex result sample fixture",
);
assert(
  !agentWorkplaneText.includes("normalizeCodexResultReportV01("),
  "default AgentWorkplane render must not normalize a sample Codex result report",
);
assertContainsAll(
  feedbackHelperText,
  [
    "buildCodexResultFeedbackDraft",
    "reuse_outcome_draft",
    "expected_observed_delta",
    "missing_codex_result_report",
  ],
  { label: feedbackHelperFile },
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
const { buildDogfoodReuseRecordProposal } = await import(
  "../lib/dogfooding/dogfood-reuse-record-proposal.ts"
);
const { DOGFOOD_REUSE_RECORD_PROPOSAL_VERSION } = await import(
  "../types/dogfood-reuse-record-proposal.ts"
);

const guideBrief = readGuideBriefForWeb();
const workplaneContext = await readWorkplaneContext({ guide_brief: guideBrief });
const handoffPreview = readHandoffCapsulePreviewForWeb();
const rationale = buildHandoffContextRelayRationale({
  continuity_relay: workplaneContext.continuity_relay,
  handoff_preview: handoffPreview,
});

const defaultWorkbenchFeedbackDraft = buildCodexResultFeedbackDraft({
  handoff_context_rationale: rationale,
  result_report: null,
});
const defaultWorkbenchProposal = buildDogfoodReuseRecordProposal({
  feedback_draft: defaultWorkbenchFeedbackDraft,
});
assert.equal(
  defaultWorkbenchProposal.proposal_version,
  DOGFOOD_REUSE_RECORD_PROPOSAL_VERSION,
);
assert.equal(defaultWorkbenchProposal.proposal_status, "blocked_insufficient_data");
assert.equal(defaultWorkbenchProposal.source_status.feedback_draft, "supplied");
assert.equal(defaultWorkbenchProposal.source_status.codex_result_report, "missing");
assert.equal(defaultWorkbenchProposal.evidence_summary.has_result_report, false);
assert.equal(
  defaultWorkbenchProposal.feedback_draft_refs.result_report_ref,
  null,
);
assert(
  defaultWorkbenchProposal.blocked_reasons.includes(
    "blocked_missing_codex_result_report",
  ),
);
assert(
  defaultWorkbenchProposal.insufficient_data_reasons.includes(
    "missing_codex_result_report",
  ),
);

const missingFeedbackProposal = buildDogfoodReuseRecordProposal({
  feedback_draft: null,
});
assert.equal(
  missingFeedbackProposal.proposal_status,
  "blocked_missing_feedback_draft",
);
assert.equal(missingFeedbackProposal.source_status.feedback_draft, "missing");
assert.equal(missingFeedbackProposal.evidence_summary.has_feedback_draft, false);
assert(
  missingFeedbackProposal.blocked_reasons.includes(
    "blocked_missing_feedback_draft",
  ),
);

const normalizedReport = normalizeCodexResultReportV01(fixture.safe_input_example);
const fixtureFeedbackDraft = buildCodexResultFeedbackDraft({
  handoff_context_rationale: rationale,
  result_report: normalizedReport,
});
const fixtureProposal = buildDogfoodReuseRecordProposal({
  feedback_draft: fixtureFeedbackDraft,
});
assert.equal(fixtureProposal.source_status.codex_result_report, "supplied");
assert.equal(fixtureProposal.evidence_summary.has_result_report, true);
assert.equal(
  fixtureProposal.feedback_draft_refs.result_report_ref,
  fixture.safe_input_example.report_id,
);
assert(fixtureProposal.feedback_draft_refs.result_report_fingerprint);
assert.equal(fixtureProposal.proposal_status, "needs_more_result_signal");
assert.equal(
  fixtureProposal.evidence_summary.has_explicit_context_feedback,
  false,
);
assert(
  fixtureProposal.insufficient_data_reasons.includes(
    "missing_context_reuse_feedback_signal",
  ),
);
assert(
  fixtureProposal.proposed_expected_observed_summary
    .skipped_or_unverified_check_count > 0,
);
for (const skippedCheck of fixtureProposal.proposed_dogfood_signal
  .skipped_or_unverified_checks) {
  assert(
    !fixtureProposal.proposed_dogfood_signal.checks_observed.includes(
      skippedCheck,
    ),
    "skipped checks must stay separate from checks observed",
  );
}

const reusableRefs = rationale.selected_refs
  .filter((ref) => !ref.ref_id.startsWith("missing:"))
  .slice(0, 5);
assert(reusableRefs.length >= 5, "fixture rationale must expose selected refs");
const explicitFeedbackReport = normalizeCodexResultReportV01({
  ...fixture.safe_input_example,
  report_id: "codex-result-report:dogfood-reuse-proposal-explicit-context",
  expected_observed_delta: [
    `context-helpful-ref:${reusableRefs[0].ref_id}`,
    `context-stale-ref:${reusableRefs[1].ref_id}`,
    `context-missing-ref:${reusableRefs[2].ref_id}`,
    `context-noisy-ref:${reusableRefs[3].ref_id}`,
    `context-misleading-ref:${reusableRefs[4].ref_id}`,
    "next-relay-update:preserve explicit reuse classifications for review",
  ],
});
const explicitFeedbackDraft = buildCodexResultFeedbackDraft({
  handoff_context_rationale: rationale,
  result_report: explicitFeedbackReport,
});
const explicitProposal = buildDogfoodReuseRecordProposal({
  feedback_draft: explicitFeedbackDraft,
});
assert.equal(
  explicitProposal.proposal_status,
  "proposal_ready_for_operator_review",
);
assert.equal(
  explicitProposal.evidence_summary.has_explicit_context_feedback,
  true,
);
assert.equal(explicitProposal.evidence_summary.has_insufficient_data, false);
assert(
  explicitProposal.proposed_reuse_classifications.helpful_refs.some(
    (ref) => ref.ref_id === reusableRefs[0].ref_id,
  ),
);
assert(
  explicitProposal.proposed_reuse_classifications.stale_refs.some(
    (ref) => ref.ref_id === reusableRefs[1].ref_id,
  ),
);
assert(
  explicitProposal.proposed_reuse_classifications.missing_refs.some(
    (ref) => ref.ref_id === reusableRefs[2].ref_id,
  ),
);
assert(
  explicitProposal.proposed_reuse_classifications.noisy_refs.some(
    (ref) => ref.ref_id === reusableRefs[3].ref_id,
  ),
);
assert(
  explicitProposal.proposed_reuse_classifications.misleading_refs.some(
    (ref) => ref.ref_id === reusableRefs[4].ref_id,
  ),
);
for (const classifiedRef of reusableRefs) {
  assert(
    !explicitProposal.proposed_reuse_classifications.unknown_refs.some(
      (ref) => ref.ref_id === classifiedRef.ref_id,
    ),
    "explicitly classified refs must not remain unknown",
  );
}
assert(
  explicitProposal.proposed_reuse_classifications.unknown_refs.length > 0,
  "unclassified selected refs must remain unknown",
);
assert(explicitProposal.operator_review_checklist.length >= 7);
assert(
  explicitProposal.operator_review_checklist.some((item) =>
    item.includes("skipped checks are not counted as success"),
  ),
);
assert.equal(explicitProposal.authority_boundary.read_only, true);
assert.equal(explicitProposal.authority_boundary.candidate_material_only, true);
assert.equal(explicitProposal.authority_boundary.source_of_truth, false);
assert.equal(explicitProposal.authority_boundary.derived_read_model, true);
for (const field of [
  "can_write_db",
  "can_write_dogfood_ledger",
  "can_update_metrics",
  "can_mutate_memory",
  "can_promote_memory",
  "can_apply_project_perspective",
  "can_create_promotion_decision",
  "can_create_formation_receipt",
  "can_call_provider_openai",
  "can_call_github",
  "can_execute_codex",
  "can_send_handoff",
  "can_create_pr",
  "can_merge_pr",
  "can_run_autonomous_action",
  "can_create_graph_or_vector_store",
  "can_create_rag_stack",
  "can_crawl_or_observe_browser",
]) {
  assert.equal(
    explicitProposal.authority_boundary[field],
    false,
    `authority_boundary.${field}`,
  );
}

const changedFilesBoundary = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "dogfood-reuse-record-proposal-v0-1",
});
const untrackedFiles = collectUntrackedFiles();
const changedAndUntrackedFiles = uniqueSorted([
  ...changedFilesBoundary.files,
  ...untrackedFiles,
]);
for (const file of changedAndUntrackedFiles) {
  assert(
    allowedChangedFiles.includes(file),
    `Unexpected dogfood reuse proposal file: ${file}`,
  );
}

console.log(
  JSON.stringify(
    {
      smoke: "dogfood-reuse-record-proposal-v0-1",
      pass: true,
      default_workbench_status: defaultWorkbenchProposal.proposal_status,
      fixture_helper_status: fixtureProposal.proposal_status,
      explicit_helper_status: explicitProposal.proposal_status,
      operator_review_checklist_count:
        explicitProposal.operator_review_checklist.length,
      skipped_checks_preserved:
        fixtureProposal.proposed_expected_observed_summary
          .skipped_or_unverified_check_count,
      unknown_refs_preserved:
        explicitProposal.proposed_reuse_classifications.unknown_refs.length,
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_observed: changedFilesBoundary.files,
      durable_dogfood_ledger_write_added: false,
      metrics_update_added: false,
      provider_call_added: false,
      github_call_added: false,
      codex_execution_added: false,
      handoff_send_added: false,
      memory_mutation_added: false,
      perspective_apply_added: false,
      graph_vector_rag_crawler_observer_added: false,
      autonomous_action_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:dogfood-reuse-record-proposal-v0-1");

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
    /\bcreateDogfood(?:ing)?Record\b/i,
    /\bwriteDogfood(?:ing)?Record\b/i,
    /\bupdateDogfood(?:ing)?Metric\b/i,
    /\bcreateGraph\b/i,
    /\bcreateVector\b/i,
    /\bcrawl\b/i,
  ];

  for (const pattern of forbiddenPatterns) {
    assert(!pattern.test(text), `${file} must not include ${pattern}`);
  }
}
