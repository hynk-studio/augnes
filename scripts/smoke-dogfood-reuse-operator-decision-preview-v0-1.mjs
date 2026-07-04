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

const typeFile = "types/dogfood-reuse-operator-decision-preview.ts";
const helperFile = "lib/dogfooding/dogfood-reuse-operator-decision-preview.ts";
const panelFile =
  "components/dogfood-reuse-operator-decision-preview-panel.tsx";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const packageJsonFile = "package.json";
const smokeFile =
  "scripts/smoke-dogfood-reuse-operator-decision-preview-v0-1.mjs";
const proposalTypeFile = "types/dogfood-reuse-record-proposal.ts";
const proposalHelperFile = "lib/dogfooding/dogfood-reuse-record-proposal.ts";
const proposalPanelFile = "components/dogfood-reuse-record-proposal-panel.tsx";
const proposalSmokeFile =
  "scripts/smoke-dogfood-reuse-record-proposal-v0-1.mjs";
const feedbackSmokeFile =
  "scripts/smoke-codex-result-feedback-draft-v0-1.mjs";
const workplanePanelsSmokeFile =
  "scripts/smoke-agent-workplane-panels-v0-1.mjs";
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

const allowedChangedFiles = [
  typeFile,
  helperFile,
  panelFile,
  agentWorkplaneFile,
  packageJsonFile,
  smokeFile,
  proposalSmokeFile,
  feedbackSmokeFile,
  workplanePanelsSmokeFile,
  handoffRationaleSmokeFile,
  continuityRelaySmokeFile,
  ledgerTypeFile,
  ledgerHelperFile,
  ledgerRouteFile,
  ledgerSmokeFile,
];

const textByFile = loadTextByFile([
  ...allowedChangedFiles,
  proposalTypeFile,
  proposalHelperFile,
  proposalPanelFile,
  fixtureFile,
]);

const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const panelText = textByFile.get(panelFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const packageJsonText = textByFile.get(packageJsonFile);
const proposalHelperText = textByFile.get(proposalHelperFile);
const fixture = JSON.parse(readFileSync(fixtureFile, "utf8"));

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:dogfood-reuse-operator-decision-preview-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-dogfood-reuse-operator-decision-preview-v0-1.mjs",
});

assertContainsAll(
  typeText,
  [
    "dogfood_reuse_operator_decision_preview.v0.1",
    "proposal_refs",
    "decision_preview_status",
    "recommended_operator_decision",
    "available_operator_decisions",
    "write_readiness",
    "approval_requirements",
    "blocking_reasons",
    "missing_evidence",
    "would_write_preview",
    "would_not_write",
    "candidate_carry_forward",
    "review_checklist",
    "authority_boundary",
    "ready_for_operator_decision",
    "blocked_insufficient_data",
    "blocked_missing_proposal",
    "needs_more_evidence",
    "approve_for_future_write",
    "defer_until_result_report_supplied",
    "reject_as_insufficient_data",
    "keep_as_candidate_only",
    "request_more_evidence",
    "write_ready",
    "requires_actual_result_report",
    "requires_explicit_context_feedback",
    "requires_operator_confirmation",
    "read_only: true",
    "candidate_material_only: true",
    "source_of_truth: false",
    "derived_read_model: true",
    "can_persist_decision: false",
    "can_write_db: false",
    "can_write_dogfood_ledger: false",
    "can_update_metrics: false",
    "can_mutate_memory: false",
    "can_apply_project_perspective: false",
    "can_create_promotion_decision: false",
    "can_create_formation_receipt: false",
    "can_call_provider_openai: false",
    "can_call_github: false",
    "can_execute_codex: false",
    "can_send_handoff: false",
  ],
  { label: typeFile },
);

assertContainsAll(
  helperText,
  [
    "buildDogfoodReuseOperatorDecisionPreview",
    "DogfoodReuseRecordProposal",
    "finalizeEvidenceSummary",
    "blocked_missing_proposal",
    "blocked_missing_actual_result_report",
    "blocked_missing_explicit_context_feedback",
    "proposal_ready_for_operator_review",
    "ready_for_operator_decision",
    "approve_for_future_write",
    "defer_until_result_report_supplied",
    "durable dogfood ledger row",
    "dogfood metric update",
    "Perspective state",
    "memory item",
    "promotion decision",
    "Formation Receipt",
    "GitHub/Codex action",
    "handoff send",
    "can_persist_decision: false",
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
    "DogfoodReuseOperatorDecisionPreviewPanel",
    "Operator decision preview",
    "write readiness",
    "approval requirements",
    "would write preview",
    "would not write",
    "Read-only decision preview",
    "can_persist_decision",
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
    "DogfoodReuseOperatorDecisionPreviewPanel",
    "buildDogfoodReuseOperatorDecisionPreview",
    "proposal: dogfoodReuseRecordProposal",
    "preview={dogfoodReuseOperatorDecisionPreview}",
    "result_report: null",
  ],
  { label: agentWorkplaneFile },
);
assert(
  !agentWorkplaneText.includes("codex-result-report-ingestion.sample.v0.1.json"),
  "default AgentWorkplane render must not import the Codex result sample fixture",
);
assert(
  !agentWorkplaneText.includes("codexResultReportSample.safe_input_example"),
  "default AgentWorkplane render must not pass sample input as current work result",
);
assert(
  !agentWorkplaneText.includes("normalizeCodexResultReportV01("),
  "default AgentWorkplane render must not normalize a sample Codex result report",
);

assertContainsAll(
  proposalHelperText,
  [
    "buildDogfoodReuseRecordProposal",
    "proposal_ready_for_operator_review",
    "needs_more_result_signal",
    "blocked_insufficient_data",
    "missing_explicit_context_feedback",
    "blocked_missing_codex_result_report",
  ],
  { label: proposalHelperFile },
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
const { buildDogfoodReuseOperatorDecisionPreview } = await import(
  "../lib/dogfooding/dogfood-reuse-operator-decision-preview.ts"
);
const { DOGFOOD_REUSE_OPERATOR_DECISION_PREVIEW_VERSION } = await import(
  "../types/dogfood-reuse-operator-decision-preview.ts"
);

const guideBrief = readGuideBriefForWeb();
const workplaneContext = await readWorkplaneContext({ guide_brief: guideBrief });
const handoffPreview = readHandoffCapsulePreviewForWeb();
const rationale = buildHandoffContextRelayRationale({
  continuity_relay: workplaneContext.continuity_relay,
  handoff_preview: handoffPreview,
});

const missingProposalDecision = buildDogfoodReuseOperatorDecisionPreview({
  proposal: null,
});
assert.equal(
  missingProposalDecision.preview_version,
  DOGFOOD_REUSE_OPERATOR_DECISION_PREVIEW_VERSION,
);
assert.equal(
  missingProposalDecision.decision_preview_status,
  "blocked_missing_proposal",
);
assert.equal(missingProposalDecision.write_readiness.write_ready, false);
assert(
  missingProposalDecision.blocking_reasons.includes("blocked_missing_proposal"),
);
assert(
  missingProposalDecision.missing_evidence.includes(
    "missing_dogfood_reuse_record_proposal",
  ),
);
assert.equal(
  missingProposalDecision.evidence_summary.has_blocking_reasons,
  missingProposalDecision.blocking_reasons.length > 0,
);
assert.equal(
  missingProposalDecision.evidence_summary.has_missing_evidence,
  missingProposalDecision.missing_evidence.length > 0,
);

const defaultWorkbenchFeedbackDraft = buildCodexResultFeedbackDraft({
  handoff_context_rationale: rationale,
  result_report: null,
});
const defaultWorkbenchProposal = buildDogfoodReuseRecordProposal({
  feedback_draft: defaultWorkbenchFeedbackDraft,
});
const defaultWorkbenchDecision = buildDogfoodReuseOperatorDecisionPreview({
  proposal: defaultWorkbenchProposal,
});
assert.equal(
  defaultWorkbenchProposal.proposal_status,
  "blocked_insufficient_data",
);
assert.equal(
  defaultWorkbenchDecision.decision_preview_status,
  "blocked_insufficient_data",
);
assert.equal(
  defaultWorkbenchDecision.recommended_operator_decision,
  "defer_until_result_report_supplied",
);
assert.equal(defaultWorkbenchDecision.write_readiness.write_ready, false);
assert.equal(defaultWorkbenchDecision.source_status.codex_result_report, "missing");
assert.equal(
  defaultWorkbenchDecision.evidence_summary.has_result_report,
  false,
);
assert(
  defaultWorkbenchDecision.blocking_reasons.includes(
    "blocked_missing_actual_result_report",
  ),
);
assert(
  defaultWorkbenchDecision.missing_evidence.includes(
    "missing_codex_result_report",
  ),
);
assert.equal(
  defaultWorkbenchDecision.evidence_summary.has_blocking_reasons,
  defaultWorkbenchDecision.blocking_reasons.length > 0,
);
assert.equal(
  defaultWorkbenchDecision.evidence_summary.has_missing_evidence,
  defaultWorkbenchDecision.missing_evidence.length > 0,
);
assert.equal(
  defaultWorkbenchDecision.evidence_summary.has_insufficient_data,
  true,
);

const normalizedReport = normalizeCodexResultReportV01(fixture.safe_input_example);
const fixtureFeedbackDraft = buildCodexResultFeedbackDraft({
  handoff_context_rationale: rationale,
  result_report: normalizedReport,
});
const fixtureProposal = buildDogfoodReuseRecordProposal({
  feedback_draft: fixtureFeedbackDraft,
});
const fixtureDecision = buildDogfoodReuseOperatorDecisionPreview({
  proposal: fixtureProposal,
});
assert.equal(fixtureProposal.proposal_status, "needs_more_result_signal");
assert.equal(fixtureDecision.decision_preview_status, "needs_more_evidence");
assert.equal(fixtureDecision.write_readiness.write_ready, false);
assert.equal(fixtureDecision.source_status.codex_result_report, "supplied");
assert(
  fixtureDecision.blocking_reasons.includes(
    "blocked_missing_explicit_context_feedback",
  ),
);
assert(fixtureDecision.blocking_reasons.length > 0);
assert.equal(fixtureDecision.evidence_summary.has_blocking_reasons, true);
if (fixtureDecision.missing_evidence.length > 0) {
  assert.equal(fixtureDecision.evidence_summary.has_missing_evidence, true);
}
assert.equal(
  fixtureDecision.evidence_summary.has_missing_evidence,
  fixtureDecision.missing_evidence.length > 0,
);
assert.equal(fixtureDecision.evidence_summary.has_insufficient_data, true);
assert.equal(
  fixtureDecision.write_readiness.requires_skipped_checks_review,
  true,
);

const reusableRefs = rationale.selected_refs
  .filter((ref) => !ref.ref_id.startsWith("missing:"))
  .slice(0, 5);
assert(reusableRefs.length >= 5, "fixture rationale must expose selected refs");
const explicitFeedbackReport = normalizeCodexResultReportV01({
  ...fixture.safe_input_example,
  report_id: "codex-result-report:operator-decision-explicit-context",
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
const explicitDecision = buildDogfoodReuseOperatorDecisionPreview({
  proposal: explicitProposal,
});
assert.equal(
  explicitProposal.proposal_status,
  "proposal_ready_for_operator_review",
);
assert.equal(
  explicitDecision.decision_preview_status,
  "ready_for_operator_decision",
);
assert.equal(
  explicitDecision.recommended_operator_decision,
  "approve_for_future_write",
);
assert.equal(explicitDecision.write_readiness.write_ready, true);
assert.equal(explicitDecision.blocking_reasons.length, 0);
assert.equal(explicitDecision.missing_evidence.length, 0);
assert.equal(explicitDecision.evidence_summary.has_blocking_reasons, false);
assert.equal(explicitDecision.evidence_summary.has_missing_evidence, false);
assert.equal(explicitDecision.evidence_summary.has_insufficient_data, false);
assert.equal(
  explicitDecision.would_write_preview.proposed_record_kind,
  "handoff_reuse_outcome_candidate",
);
assert(
  explicitDecision.would_write_preview.proposed_reuse_bucket_counts
    .helpful_refs > 0,
);
assert(
  explicitDecision.would_write_preview.proposed_reuse_bucket_counts.stale_refs >
    0,
);
assert(
  explicitDecision.would_write_preview.proposed_reuse_bucket_counts
    .missing_refs > 0,
);
assert(
  explicitDecision.would_write_preview.proposed_reuse_bucket_counts.noisy_refs >
    0,
);
assert(
  explicitDecision.would_write_preview.proposed_reuse_bucket_counts
    .misleading_refs > 0,
);
assert(
  explicitDecision.would_write_preview.proposed_reuse_bucket_counts
    .unknown_refs > 0,
  "unclassified selected refs must remain unknown",
);
assert(
  explicitDecision.would_write_preview.proposed_dogfood_signal_summary
    .skipped_or_unverified_checks.length > 0,
);
for (const skippedCheck of explicitDecision.would_write_preview
  .proposed_dogfood_signal_summary.skipped_or_unverified_checks) {
  assert(
    !explicitDecision.would_write_preview.proposed_dogfood_signal_summary
      .checks_observed.includes(skippedCheck),
    "skipped checks must stay separate from checks observed",
  );
}
for (const item of [
  "durable dogfood ledger row",
  "dogfood metric update",
  "Perspective state",
  "memory item",
  "promotion decision",
  "Formation Receipt",
  "GitHub/Codex action",
  "handoff send",
]) {
  assert(
    explicitDecision.would_not_write.includes(item),
    `would_not_write must include ${item}`,
  );
}
assert(
  explicitDecision.approval_requirements.some((item) =>
    item.includes("Operator explicitly approves a future write action"),
  ),
);
assert(
  explicitDecision.review_checklist.some((item) =>
    item.includes("not a persisted approve/defer/reject decision"),
  ),
);
assert.equal(explicitDecision.authority_boundary.read_only, true);
assert.equal(
  explicitDecision.authority_boundary.candidate_material_only,
  true,
);
assert.equal(explicitDecision.authority_boundary.source_of_truth, false);
assert.equal(explicitDecision.authority_boundary.derived_read_model, true);
for (const field of [
  "can_persist_decision",
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
    explicitDecision.authority_boundary[field],
    false,
    `authority_boundary.${field}`,
  );
}

const changedFilesBoundary = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "dogfood-reuse-operator-decision-preview-v0-1",
});
const untrackedFiles = collectUntrackedFiles();
const changedAndUntrackedFiles = uniqueSorted([
  ...changedFilesBoundary.files,
  ...untrackedFiles,
]);
for (const file of changedAndUntrackedFiles) {
  assert(
    allowedChangedFiles.includes(file),
    `Unexpected dogfood reuse operator decision preview file: ${file}`,
  );
}

console.log(
  JSON.stringify(
    {
      smoke: "dogfood-reuse-operator-decision-preview-v0-1",
      pass: true,
      missing_proposal_status:
        missingProposalDecision.decision_preview_status,
      default_workbench_status:
        defaultWorkbenchDecision.decision_preview_status,
      fixture_helper_status: fixtureDecision.decision_preview_status,
      explicit_helper_status: explicitDecision.decision_preview_status,
      default_workbench_write_ready:
        defaultWorkbenchDecision.write_readiness.write_ready,
      fixture_has_blocking_reasons:
        fixtureDecision.evidence_summary.has_blocking_reasons,
      fixture_has_missing_evidence:
        fixtureDecision.evidence_summary.has_missing_evidence,
      explicit_has_blocking_reasons:
        explicitDecision.evidence_summary.has_blocking_reasons,
      explicit_has_missing_evidence:
        explicitDecision.evidence_summary.has_missing_evidence,
      explicit_helper_write_ready:
        explicitDecision.write_readiness.write_ready,
      skipped_checks_preserved:
        explicitDecision.would_write_preview.proposed_dogfood_signal_summary
          .skipped_or_unverified_checks.length,
      unknown_refs_preserved:
        explicitDecision.would_write_preview.proposed_reuse_bucket_counts
          .unknown_refs,
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_observed: changedFilesBoundary.files,
      durable_decision_persistence_added: false,
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
console.log("PASS smoke:dogfood-reuse-operator-decision-preview-v0-1");

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
    /\bpersistOperatorDecision\b/i,
    /\bcreateOperatorDecision\b/i,
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
