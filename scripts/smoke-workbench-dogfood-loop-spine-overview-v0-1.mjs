#!/usr/bin/env node
import assert from "node:assert/strict";

import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertPackageScript,
  collectUntrackedFiles,
  loadTextByFile,
} from "./smoke-boundary-common.mjs";

const typeFile = "types/workbench-dogfood-loop-spine-overview.ts";
const helperFile = "lib/workplane/workbench-dogfood-loop-spine-overview.ts";
const panelFile =
  "components/workplane/workbench-dogfood-loop-spine-overview-panel.tsx";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const agentWorkplaneSmokeFile = "scripts/smoke-agent-workplane-panels-v0-1.mjs";
const selectedSessionDigestIngestContractTypeFile =
  "types/selected-session-digest-ingest-contract-preview.ts";
const selectedSessionDigestIngestContractHelperFile =
  "lib/intake/selected-session-digest-ingest-contract-preview.ts";
const selectedSessionDigestIngestContractPanelFile =
  "components/intake/selected-session-digest-ingest-contract-preview-panel.tsx";
const selectedSessionDigestIngestContractSmokeFile =
  "scripts/smoke-selected-session-digest-ingest-contract-preview-v0-1.mjs";
const selectedSessionDigestIngestOperatorDecisionTypeFile =
  "types/selected-session-digest-ingest-operator-decision.ts";
const selectedSessionDigestIngestOperatorDecisionHelperFile =
  "lib/intake/selected-session-digest-ingest-operator-decision.ts";
const selectedSessionDigestIngestOperatorDecisionPanelFile =
  "components/intake/selected-session-digest-ingest-operator-decision-panel.tsx";
const selectedSessionDigestIngestDecisionWriteTypeFile =
  "types/selected-session-digest-ingest-decision-write.ts";
const selectedSessionDigestIngestDecisionWriteHelperFile =
  "lib/intake/selected-session-digest-ingest-decision-write.ts";
const selectedSessionDigestIngestDecisionWriteRouteFile =
  "app/api/intake/selected-session-digest/ingest-decisions/route.ts";
const selectedSessionDigestIngestOperatorDecisionSmokeFile =
  "scripts/smoke-selected-session-digest-ingest-operator-decision-v0-1.mjs";
const selectedSessionDigestIngestWriteTypeFile =
  "types/selected-session-digest-ingest-write.ts";
const selectedSessionDigestIngestWriteHelperFile =
  "lib/intake/selected-session-digest-ingest-write.ts";
const selectedSessionDigestIngestWriteRouteFile =
  "app/api/intake/selected-session-digest/ingest-records/route.ts";
const selectedSessionDigestIngestRecordReviewTypeFile =
  "types/selected-session-digest-ingest-record-review.ts";
const selectedSessionDigestIngestRecordReviewHelperFile =
  "lib/intake/selected-session-digest-ingest-record-review.ts";
const selectedSessionDigestIngestRecordReviewForWebFile =
  "lib/intake/read-selected-session-digest-ingest-record-review-for-web.ts";
const selectedSessionDigestIngestRecordReviewPanelFile =
  "components/intake/selected-session-digest-ingest-record-review-panel.tsx";
const selectedSessionDigestDurableIngestRecordSmokeFile =
  "scripts/smoke-selected-session-digest-durable-ingest-record-v0-1.mjs";
const candidateIngressNormalizerTypeFile =
  "types/candidate-ingress-normalizer.ts";
const candidateIngressNormalizerHelperFile =
  "lib/intake/candidate-ingress-normalizer.ts";
const projectHistoryIntakePreviewTypeFile =
  "types/project-history-intake-preview.ts";
const projectHistoryIntakePreviewHelperFile =
  "lib/intake/project-history-intake-preview.ts";
const projectHistoryIntakePreviewPanelFile =
  "components/intake/project-history-intake-preview-panel.tsx";
const projectHistoryIntakeDecisionTypeFile =
  "types/project-history-intake-decision.ts";
const projectHistoryIntakeDecisionHelperFile =
  "lib/intake/project-history-intake-decision.ts";
const projectHistoryIntakeDecisionPanelFile =
  "components/intake/project-history-intake-decision-panel.tsx";
const projectHistoryIntakeWriteTypeFile =
  "types/project-history-intake-write.ts";
const projectHistoryIntakeWriteHelperFile =
  "lib/intake/project-history-intake-write.ts";
const projectHistoryIntakeWriteRouteFile =
  "app/api/intake/project-history/records/route.ts";
const projectHistoryIntakeRecordReviewTypeFile =
  "types/project-history-intake-record-review.ts";
const projectHistoryIntakeRecordReviewHelperFile =
  "lib/intake/project-history-intake-record-review.ts";
const projectHistoryIntakeRecordReviewForWebFile =
  "lib/intake/read-project-history-intake-record-review-for-web.ts";
const projectHistoryIntakeRecordReviewPanelFile =
  "components/intake/project-history-intake-record-review-panel.tsx";
const projectHistoryIntakeSmokeFile =
  "scripts/smoke-project-history-intake-candidate-ledger-v0-1.mjs";
const selectedSessionDigestIntakeSmokeFile =
  "scripts/smoke-selected-session-digest-intake-preview-v0-1.mjs";
const applyWriteContractSmokeFile =
  "scripts/smoke-handoff-context-apply-write-contract-preview-v0-1.mjs";
const smokeFile =
  "scripts/smoke-workbench-dogfood-loop-spine-overview-v0-1.mjs";
const packageJsonFile = "package.json";

const allowedChangedFiles = [
  typeFile,
  helperFile,
  panelFile,
  agentWorkplaneFile,
  smokeFile,
  agentWorkplaneSmokeFile,
  selectedSessionDigestIngestContractTypeFile,
  selectedSessionDigestIngestContractHelperFile,
  selectedSessionDigestIngestContractPanelFile,
  selectedSessionDigestIngestContractSmokeFile,
  selectedSessionDigestIngestOperatorDecisionTypeFile,
  selectedSessionDigestIngestOperatorDecisionHelperFile,
  selectedSessionDigestIngestOperatorDecisionPanelFile,
  selectedSessionDigestIngestDecisionWriteTypeFile,
  selectedSessionDigestIngestDecisionWriteHelperFile,
  selectedSessionDigestIngestDecisionWriteRouteFile,
  selectedSessionDigestIngestOperatorDecisionSmokeFile,
  selectedSessionDigestIngestWriteTypeFile,
  selectedSessionDigestIngestWriteHelperFile,
  selectedSessionDigestIngestWriteRouteFile,
  selectedSessionDigestIngestRecordReviewTypeFile,
  selectedSessionDigestIngestRecordReviewHelperFile,
  selectedSessionDigestIngestRecordReviewForWebFile,
  selectedSessionDigestIngestRecordReviewPanelFile,
  selectedSessionDigestDurableIngestRecordSmokeFile,
  candidateIngressNormalizerTypeFile,
  candidateIngressNormalizerHelperFile,
  projectHistoryIntakePreviewTypeFile,
  projectHistoryIntakePreviewHelperFile,
  projectHistoryIntakePreviewPanelFile,
  projectHistoryIntakeDecisionTypeFile,
  projectHistoryIntakeDecisionHelperFile,
  projectHistoryIntakeDecisionPanelFile,
  projectHistoryIntakeWriteTypeFile,
  projectHistoryIntakeWriteHelperFile,
  projectHistoryIntakeWriteRouteFile,
  projectHistoryIntakeRecordReviewTypeFile,
  projectHistoryIntakeRecordReviewHelperFile,
  projectHistoryIntakeRecordReviewForWebFile,
  projectHistoryIntakeRecordReviewPanelFile,
  projectHistoryIntakeSmokeFile,
  selectedSessionDigestIntakeSmokeFile,
  applyWriteContractSmokeFile,
  packageJsonFile,
];

const textByFile = loadTextByFile([
  typeFile,
  helperFile,
  panelFile,
  agentWorkplaneFile,
  agentWorkplaneSmokeFile,
  packageJsonFile,
]);
const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const panelText = textByFile.get(panelFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const agentWorkplaneSmokeText = textByFile.get(agentWorkplaneSmokeFile);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:workbench-dogfood-loop-spine-overview-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-workbench-dogfood-loop-spine-overview-v0-1.mjs",
});

assertContainsAll(
  typeText,
  [
    "workbench_dogfood_loop_spine_overview.v0.1",
    "selected_session_intake",
    "selected_session_digest_ingest_contract",
    "selected_session_digest_ingest_operator_decision",
    "selected_session_digest_durable_ingest_record",
    "project_history_intake",
    "project_history_candidate_ingest_record",
    "codex_result_feedback",
    "dogfood_reuse_proposal",
    "dogfood_reuse_operator_decision",
    "dogfood_metric_candidate",
    "perspective_next_work_candidate",
    "continuity_relay_adjustment",
    "handoff_context_update",
    "handoff_context_update_decision",
    "approved_handoff_context_update_record_review",
    "handoff_context_apply_preview",
    "handoff_context_apply_decision",
    "handoff_context_apply_write_contract",
    "can_apply_handoff_context: false",
    "can_create_ingest_decision_record: false",
    "can_create_ingest_receipt: false",
    "can_render_workbench_action_button: false",
  ],
  { label: typeFile },
);

assertContainsAll(
  helperText,
  [
    "buildWorkbenchDogfoodLoopSpineOverviewV01",
    "createWorkbenchDogfoodLoopSpineOverviewAuthorityBoundaryV01",
    "selected_session_digest_intake_preview",
    "selected_session_digest_ingest_contract_preview",
    "selected_session_digest_ingest_operator_decision_preview",
    "selected_session_digest_ingest_record_review",
    "project_history_intake_preview",
    "project_history_intake_operator_decision_preview",
    "project_history_intake_record_review",
    "selectedSessionDigestIngestContractStep",
    "selectedSessionDigestIngestOperatorDecisionStep",
    "selectedSessionDigestDurableIngestRecordStep",
    "projectHistoryIntakeStep",
    "projectHistoryCandidateIngestRecordStep",
    "codex_result_feedback_draft",
    "dogfood_reuse_record_proposal",
    "handoff_context_apply_write_contract_preview",
    "missing_codex_result_report",
    "current_handoff_packet_fingerprint_missing",
    "prepare_operator_approved_selected_session_digest_ingest_decision_record",
    "write_selected_session_digest_candidate_ingest_record",
    "review_selected_session_digest_ingest_record",
    "supply_project_history_digest",
    "write_project_history_candidate_ingest_record",
    "review_project_history_intake_record",
    "does_not_write_memory",
    "does_not_promote_selected_digest_ingest_records_to_memory_or_perspective",
    "does_not_apply_live_handoff_context",
    "can_call_provider_openai: false",
    "can_execute_codex: false",
  ],
  { label: helperFile },
);

assertContainsAll(
  panelText,
  [
    "Workbench Dogfood Loop Spine Overview",
    "recommended next operator action",
    "spine steps",
    "would not",
    "authority boundary",
    "Read-only derived read model",
    "can_write_db",
    "can_apply_handoff_context",
    "can_execute_codex",
  ],
  { label: panelFile },
);

assertContainsAll(
  agentWorkplaneText,
  [
    "WorkbenchDogfoodLoopSpineOverviewPanel",
    "buildWorkbenchDogfoodLoopSpineOverviewV01",
    "workbenchDogfoodLoopSpineOverview",
    "preview={workbenchDogfoodLoopSpineOverview}",
    "selected_session_digest_ingest_contract_preview: selectedSessionDigestIngestContractPreview",
    "selected_session_digest_ingest_operator_decision_preview: selectedSessionDigestIngestOperatorDecisionPreview",
    "selected_session_digest_ingest_record_review:\n        selectedSessionDigestIngestRecordReview",
    "project_history_intake_preview: projectHistoryIntakePreview",
    "project_history_intake_operator_decision_preview:\n        projectHistoryIntakeOperatorDecisionPreview",
    "project_history_intake_record_review: projectHistoryIntakeRecordReview",
    "workbench:dogfood_loop_spine_overview",
    "handoff_context_apply_write_contract_preview",
  ],
  { label: agentWorkplaneFile },
);

assertContainsAll(
  agentWorkplaneSmokeText,
  [
    "followOnWorkbenchDogfoodLoopSpineOverviewFiles",
    "WorkbenchDogfoodLoopSpineOverviewPanel",
    "buildWorkbenchDogfoodLoopSpineOverviewV01",
    "workbenchDogfoodLoopSpineOverview",
    "preview={workbenchDogfoodLoopSpineOverview}",
  ],
  { label: agentWorkplaneSmokeFile },
);

assertNoForbiddenRuntimeCall(helperFile, helperText);
assertNoForbiddenRuntimeCall(panelFile, panelText);
assertNoForbiddenRuntimeCall(agentWorkplaneFile, agentWorkplaneText);
assertNoWorkbenchActionButtons(panelFile, panelText);
assertNoWorkbenchActionButtons(agentWorkplaneFile, agentWorkplaneText);
assertNoForbiddenChangedPaths();
assertAgentWorkbenchOverviewDoesNotRebuildInputs(agentWorkplaneText);

const overviewModule = await import(
  "../lib/workplane/workbench-dogfood-loop-spine-overview.ts"
);
const intakeModule = await import(
  "../lib/intake/selected-session-digest-intake-preview.ts"
);
const ingestContractModule = await import(
  "../lib/intake/selected-session-digest-ingest-contract-preview.ts"
);
const ingestOperatorDecisionModule = await import(
  "../lib/intake/selected-session-digest-ingest-operator-decision.ts"
);
const ingestRecordReviewModule = await import(
  "../lib/intake/selected-session-digest-ingest-record-review.ts"
);
const projectHistoryIntakeModule = await import(
  "../lib/intake/project-history-intake-preview.ts"
);
const projectHistoryDecisionModule = await import(
  "../lib/intake/project-history-intake-decision.ts"
);
const projectHistoryRecordReviewModule = await import(
  "../lib/intake/project-history-intake-record-review.ts"
);

const {
  buildWorkbenchDogfoodLoopSpineOverviewV01,
  createWorkbenchDogfoodLoopSpineOverviewAuthorityBoundaryV01,
} = overviewModule;
const { buildSelectedSessionDigestIntakePreviewV01 } = intakeModule;
const { buildSelectedSessionDigestIngestContractPreviewV01 } =
  ingestContractModule;
const { buildSelectedSessionDigestIngestOperatorDecisionPreviewV01 } =
  ingestOperatorDecisionModule;
const { buildSelectedSessionDigestIngestRecordReviewV01 } =
  ingestRecordReviewModule;
const { buildProjectHistoryIntakePreviewV01 } = projectHistoryIntakeModule;
const { buildProjectHistoryIntakeOperatorDecisionPreviewV01 } =
  projectHistoryDecisionModule;
const { buildProjectHistoryIntakeRecordReviewV01 } =
  projectHistoryRecordReviewModule;

const emptyOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  scope: "project:augnes",
  as_of: "2026-07-04T14:30:00.000Z",
});
assert(
  ["no_current_material", "insufficient_data"].includes(
    emptyOverview.overview_status,
  ),
  "empty overview must not fake completion",
);
assert.equal(
  emptyOverview.recommended_next_operator_action,
  "supply_selected_session_digest",
);
assert.equal(emptyOverview.spine_steps.length, 18);
assert(
  emptyOverview.spine_steps.some(
    (step) => step.step_id === "project_history_intake",
  ),
  "overview should include project history intake step",
);
assert(
  emptyOverview.spine_steps.some(
    (step) => step.step_id === "project_history_candidate_ingest_record",
  ),
  "overview should include project history candidate ingest record step",
);
assertAuthorityFalse(emptyOverview.authority_boundary);

const cleanSelectedIntake = buildSelectedSessionDigestIntakePreviewV01({
  digest: {
    summary: "Operator selected a bounded digest for spine review.",
    goals: ["Review current dogfood spine restart material."],
    decisions: ["Keep this overview preview-only."],
    evidence_refs: ["evidence:spine-overview-clean"],
    session_ref: "session:spine-overview-clean",
  },
  source_kind: "chatgpt_session_digest",
  source_ref: "source:spine-overview-clean",
  operator_ref: "operator:reviewer",
  scope: "project:augnes",
  as_of: "2026-07-04T14:30:00.000Z",
});
const selectedReadyOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanSelectedIntake,
  scope: "project:augnes",
  as_of: "2026-07-04T14:30:00.000Z",
});
const selectedStep = stepById(selectedReadyOverview, "selected_session_intake");
assert.equal(selectedStep.status, "ready_for_operator_review");
assert.equal(selectedStep.material_count > 0, true);
assert.equal(selectedReadyOverview.authority_boundary.can_write_memory, false);
assert.equal(
  selectedReadyOverview.authority_boundary
    .can_mutate_current_working_perspective,
  false,
);

const selectedIngestContractMissingMaterial =
  buildSelectedSessionDigestIngestContractPreviewV01({
    selected_session_digest_intake_preview: cleanSelectedIntake,
  });
const selectedContractOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanSelectedIntake,
  selected_session_digest_ingest_contract_preview:
    selectedIngestContractMissingMaterial,
  scope: "project:augnes",
  as_of: "2026-07-04T14:30:00.000Z",
});
const selectedContractStep = stepById(
  selectedContractOverview,
  "selected_session_digest_ingest_contract",
);
assert.equal(selectedContractStep.status, "candidate_material_available");
assert.equal(
  selectedContractOverview.recommended_next_operator_action,
  "supply_privacy_review_confirmation",
);
assert(
  selectedContractOverview.current_material_gaps.some((gap) =>
    gap.includes("privacy_review_confirmation_ref_missing"),
  ),
  "overview should surface selected digest ingest contract material gaps",
);

const selectedCandidateRef =
  selectedIngestContractMissingMaterial.would_ingest_material_preview
    .selectable_digest_candidate_refs[0];
assert(selectedCandidateRef, "selected digest contract should expose selectable refs");
const selectedReadyIngestContract =
  buildSelectedSessionDigestIngestContractPreviewV01({
    selected_session_digest_intake_preview: cleanSelectedIntake,
    selected_candidate_refs: [selectedCandidateRef],
    privacy_review_confirmation_ref: "privacy:spine-overview-clean",
    requested_idempotency_key: "idempotency:spine-overview-clean",
    requested_ingest_scope_ref: "scope:spine-overview-clean",
  });
const selectedReadyIngestDecision =
  buildSelectedSessionDigestIngestOperatorDecisionPreviewV01({
    selected_session_digest_ingest_contract_preview:
      selectedReadyIngestContract,
  });
const selectedDecisionOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanSelectedIntake,
  selected_session_digest_ingest_contract_preview: selectedReadyIngestContract,
  selected_session_digest_ingest_operator_decision_preview:
    selectedReadyIngestDecision,
  scope: "project:augnes",
  as_of: "2026-07-04T14:30:00.000Z",
});
assert(
  selectedDecisionOverview.spine_steps.some(
    (step) =>
      step.step_id === "selected_session_digest_ingest_operator_decision",
  ),
  "overview should include selected digest ingest operator decision step",
);
assert.equal(
  selectedDecisionOverview.recommended_next_operator_action,
  "prepare_operator_approved_selected_session_digest_ingest_decision_record",
);
assert.notEqual(
  selectedDecisionOverview.recommended_next_operator_action,
  "prepare_separate_ingest_write_slice",
);

const selectedNoRecordReview = buildSelectedSessionDigestIngestRecordReviewV01({
  records: [],
  as_of: "2026-07-04T14:30:00.000Z",
});
const selectedDurableWriteOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanSelectedIntake,
  selected_session_digest_ingest_contract_preview: selectedReadyIngestContract,
  selected_session_digest_ingest_operator_decision_preview:
    selectedReadyIngestDecision,
  selected_session_digest_ingest_record_review: selectedNoRecordReview,
  scope: "project:augnes",
  as_of: "2026-07-04T14:30:00.000Z",
});
assert.equal(
  stepById(
    selectedDurableWriteOverview,
    "selected_session_digest_durable_ingest_record",
  ).recommended_next_action,
  "write_selected_session_digest_candidate_ingest_record",
);
assert.equal(
  selectedDurableWriteOverview.recommended_next_operator_action,
  "write_selected_session_digest_candidate_ingest_record",
);
assertNoMemoryPromotionActions(selectedDurableWriteOverview);

const selectedRecordReview = buildSelectedSessionDigestIngestRecordReviewV01({
  records: [fakeSelectedDigestIngestRecord()],
  as_of: "2026-07-04T14:30:00.000Z",
});
const selectedRecordReviewOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanSelectedIntake,
  selected_session_digest_ingest_contract_preview: selectedReadyIngestContract,
  selected_session_digest_ingest_operator_decision_preview:
    selectedReadyIngestDecision,
  selected_session_digest_ingest_record_review: selectedRecordReview,
  scope: "project:augnes",
  as_of: "2026-07-04T14:30:00.000Z",
});
assert.equal(
  stepById(
    selectedRecordReviewOverview,
    "selected_session_digest_durable_ingest_record",
  ).recommended_next_action,
  "review_selected_session_digest_ingest_record",
);
assertNoMemoryPromotionActions(selectedRecordReviewOverview);

const emptyProjectHistoryPreview = buildProjectHistoryIntakePreviewV01({
  scope: "project:augnes",
  as_of: "2026-07-04T14:30:00.000Z",
});
const emptyProjectHistoryDecision =
  buildProjectHistoryIntakeOperatorDecisionPreviewV01({
    project_history_intake_preview: emptyProjectHistoryPreview,
  });
const emptyProjectHistoryRecordReview =
  buildProjectHistoryIntakeRecordReviewV01({
    records: [],
    as_of: "2026-07-04T14:30:00.000Z",
  });
const projectHistoryMissingOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanSelectedIntake,
  selected_session_digest_ingest_contract_preview: selectedReadyIngestContract,
  selected_session_digest_ingest_operator_decision_preview:
    selectedReadyIngestDecision,
  selected_session_digest_ingest_record_review: selectedRecordReview,
  project_history_intake_preview: emptyProjectHistoryPreview,
  project_history_intake_operator_decision_preview: emptyProjectHistoryDecision,
  project_history_intake_record_review: emptyProjectHistoryRecordReview,
});
assert.equal(
  stepById(projectHistoryMissingOverview, "project_history_intake").status,
  "no_current_material",
);
assert.equal(
  projectHistoryMissingOverview.recommended_next_operator_action,
  "supply_project_history_digest",
);

const cleanProjectHistoryIntake = buildProjectHistoryIntakePreviewV01({
  digest: {
    title: "Project history spine digest",
    summary: "Project history candidate intake is ready for bounded review.",
    timeline_events: ["Selected digest candidate ledger reached durable record"],
    decisions: ["Keep project history candidate records separate from memory"],
    requirements: ["Require source, project, operator, evidence, privacy, and idempotency refs"],
    evidence_refs: ["evidence:project-history-overview-clean"],
    source_refs: ["source:project-history-overview-clean"],
    project_ref: "project:augnes",
    created_at: "2026-07-04T14:30:00.000Z",
  },
  source_ref: "source:project-history-overview-clean",
  operator_ref: "operator:project-history-overview",
});
const projectHistoryCandidateRef =
  cleanProjectHistoryIntake.candidate_material.timeline_event_candidates[0]
    .candidate_id;
const readyProjectHistoryDecision =
  buildProjectHistoryIntakeOperatorDecisionPreviewV01({
    project_history_intake_preview: cleanProjectHistoryIntake,
    selected_candidate_refs: [projectHistoryCandidateRef],
    privacy_review_confirmation_ref: "privacy:project-history-overview-clean",
    requested_idempotency_key: "idempotency:project-history-overview-clean",
  });
const projectHistoryWriteOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanSelectedIntake,
  selected_session_digest_ingest_contract_preview: selectedReadyIngestContract,
  selected_session_digest_ingest_operator_decision_preview:
    selectedReadyIngestDecision,
  selected_session_digest_ingest_record_review: selectedRecordReview,
  project_history_intake_preview: cleanProjectHistoryIntake,
  project_history_intake_operator_decision_preview:
    readyProjectHistoryDecision,
  project_history_intake_record_review: emptyProjectHistoryRecordReview,
});
assert.equal(
  projectHistoryWriteOverview.recommended_next_operator_action,
  "write_project_history_candidate_ingest_record",
);
assertNoMemoryPromotionActions(projectHistoryWriteOverview);

const projectHistoryRecordReview = buildProjectHistoryIntakeRecordReviewV01({
  records: [fakeProjectHistoryIntakeRecord()],
});
const projectHistoryRecordOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanSelectedIntake,
  selected_session_digest_ingest_contract_preview: selectedReadyIngestContract,
  selected_session_digest_ingest_operator_decision_preview:
    selectedReadyIngestDecision,
  selected_session_digest_ingest_record_review: selectedRecordReview,
  project_history_intake_preview: cleanProjectHistoryIntake,
  project_history_intake_operator_decision_preview:
    readyProjectHistoryDecision,
  project_history_intake_record_review: projectHistoryRecordReview,
});
assert.equal(
  projectHistoryRecordOverview.recommended_next_operator_action,
  "review_project_history_intake_record",
);
assertNoMemoryPromotionActions(projectHistoryRecordOverview);

const missingCodexOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanSelectedIntake,
  codex_result_feedback_draft: codexFeedbackDraft({ resultReport: "missing" }),
  dogfood_reuse_record_proposal: reuseProposal({
    status: "blocked_insufficient_data",
    blockedReasons: ["blocked_missing_codex_result_report"],
    insufficientReasons: ["missing_codex_result_report"],
    hasResultReport: false,
  }),
  dogfood_metric_candidate_preview: metricPreviewWithoutRecords(),
  scope: "project:augnes",
  as_of: "2026-07-04T14:30:00.000Z",
});
assert.equal(
  missingCodexOverview.recommended_next_operator_action,
  "supply_codex_result_report",
);
assert(
  missingCodexOverview.current_material_gaps.some((gap) =>
    gap.includes("missing_codex_result_report"),
  ),
  "missing Codex result report should remain a material gap",
);
assert.equal(
  stepById(missingCodexOverview, "dogfood_metric_candidate").status,
  "insufficient_data",
);
assert(
  missingCodexOverview.current_material_gaps.some((gap) =>
    gap.includes("approved_reuse_records_missing_for_metric_preview"),
  ),
  "metric preview without approved reuse records must be a gap",
);

const blockerOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanSelectedIntake,
  codex_result_feedback_draft: codexFeedbackDraft({ resultReport: "supplied" }),
  dogfood_reuse_record_proposal: reuseProposal({
    status: "blocked_insufficient_data",
    blockedReasons: ["unsafe_source_ref"],
    insufficientReasons: ["missing_codex_result_report"],
    hasResultReport: true,
  }),
  scope: "project:augnes",
  as_of: "2026-07-04T14:30:00.000Z",
});
assert.equal(blockerOverview.overview_status, "blocked");
assert.equal(
  blockerOverview.recommended_next_operator_action,
  "resolve_blockers_or_missing_evidence",
);
assert(
  blockerOverview.top_blockers.some((blocker) =>
    blocker.includes("unsafe_source_ref"),
  ),
);
assert(
  blockerOverview.current_material_gaps.some((gap) =>
    gap.includes("missing_codex_result_report"),
  ),
);

const missingEvidenceOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanSelectedIntake,
  handoff_context_apply_preview: applyPreviewWithMissingEvidence(),
  scope: "project:augnes",
  as_of: "2026-07-04T14:30:00.000Z",
});
assert(
  missingEvidenceOverview.top_missing_evidence.some((item) =>
    item.includes("evidence:missing-apply"),
  ),
);

const missingFingerprintOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanSelectedIntake,
  codex_result_feedback_draft: codexFeedbackDraft({ resultReport: "supplied" }),
  handoff_context_apply_write_contract_preview:
    applyWriteContractMissingCurrentMaterial(),
  scope: "project:augnes",
  as_of: "2026-07-04T14:30:00.000Z",
});
assert.equal(
  missingFingerprintOverview.recommended_next_operator_action,
  "supply_current_handoff_packet_fingerprint",
);
assert(
  missingFingerprintOverview.current_material_gaps.some((gap) =>
    gap.includes("current_handoff_packet_fingerprint_missing"),
  ),
);
assert.equal(
  stepById(
    missingFingerprintOverview,
    "handoff_context_apply_write_contract",
  ).recommended_next_action,
  "supply_current_handoff_packet_fingerprint",
);
assert.equal(
  missingFingerprintOverview.authority_boundary.can_apply_handoff_context,
  false,
);

assertAuthorityFalse(createWorkbenchDogfoodLoopSpineOverviewAuthorityBoundaryV01());

const changedFileBoundary = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "workbench-dogfood-loop-spine-overview-v0-1",
});

console.log(
  JSON.stringify(
    {
      smoke: "workbench-dogfood-loop-spine-overview-v0-1",
      pass: true,
      package_script_checked: true,
      default_empty_checked: true,
      selected_intake_ready_checked: true,
      missing_codex_result_report_checked: true,
      blocker_and_missing_evidence_carry_forward_checked: true,
      apply_contract_missing_current_material_checked: true,
      authority_boundary_checked: true,
      workbench_static_boundary_checked: true,
      changed_files_checked: changedFileBoundary.checked,
      changed_files_skipped: changedFileBoundary.skipped,
      changed_files_skip_reason: changedFileBoundary.skip_reason,
      changed_files_observed: changedFileBoundary.files,
      no_unscoped_api_route_added: true,
      no_db_helper_added: true,
      no_provider_github_codex_runtime_path_added: true,
      no_mcp_plugin_tool_path_added: true,
      no_workbench_action_button_added: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:workbench-dogfood-loop-spine-overview-v0-1");

function assertAuthorityFalse(authority) {
  for (const [field, value] of Object.entries(authority)) {
    if (["read_only", "advisory_only", "derived_read_model"].includes(field)) {
      assert.equal(value, true, `${field} should be true`);
      continue;
    }
    if (field === "notes") continue;
    assert.equal(value, false, `${field} should be false`);
  }
}

function assertNoForbiddenRuntimeCall(label, text) {
  for (const forbidden of [
    "fetch(",
    "method: \"POST\"",
    "method: 'POST'",
    "better-sqlite3",
    "new Database",
    "@/lib/db",
    "INSERT INTO",
    "UPDATE ",
    "DELETE FROM",
    "CREATE TABLE",
    "ALTER TABLE",
    "DROP TABLE",
    "@openai",
    "OpenAI",
    "Octokit",
    "@octokit",
    "createPullRequest",
    "mergePullRequest",
    "executeCodex",
    "setInterval(",
    "setTimeout(",
  ]) {
    assert(!text.includes(forbidden), `${label} must not include ${forbidden}`);
  }
}

function assertNoWorkbenchActionButtons(label, text) {
  assert(!text.includes("<button"), `${label} must not render buttons`);
  assert(
    !/<button[^>]*>[^<]*(Import|Write|Apply|Approve|Send|Launch|Run|Merge|Retry|Execute)/i.test(
      text,
    ),
    `${label} must not render action buttons`,
  );
  assert(!text.includes("ActionButton"), `${label} must not use action buttons`);
  assert(!text.includes("action-button"), `${label} must not use action buttons`);
}

function assertNoForbiddenChangedPaths() {
  const untrackedFiles = collectUntrackedFiles();
  for (const file of untrackedFiles) {
    assert(
      allowedChangedFiles.includes(file),
      `Unexpected untracked file for workbench dogfood loop spine overview: ${file}`,
    );
  }
  for (const file of allowedChangedFiles) {
    assert(
      !/^app\/api\//.test(file) ||
        file === selectedSessionDigestIngestDecisionWriteRouteFile ||
        file === selectedSessionDigestIngestWriteRouteFile ||
        file === projectHistoryIntakeWriteRouteFile,
      `No app/api route may be added outside selected digest or project history follow-on routes: ${file}`,
    );
    assert(!/^db\//.test(file), `No DB helper/schema file may be added: ${file}`);
    assert(
      !/(^|\/)(provider|providers|openai|github)(\/|$)/i.test(file),
      `No provider/OpenAI/GitHub runtime path may be changed: ${file}`,
    );
    assert(
      !/(^|\/)(mcp|plugin|plugins|tool|tools)(\/|$)/i.test(file),
      `No App/MCP tool path may be changed: ${file}`,
    );
  }
}

function assertAgentWorkbenchOverviewDoesNotRebuildInputs(text) {
  const start = text.indexOf("const workbenchDogfoodLoopSpineOverview");
  const end = text.indexOf("return (");
  assert(start !== -1, "Agent Workplane must build dogfood loop spine overview");
  assert(end > start, "Dogfood loop spine overview block must be bounded");
  const snippet = text.slice(start, end);
  assert(!snippet.includes("sample"), "Overview must not pass sample material");
  assert(!snippet.includes("fixture"), "Overview must not pass fixture material");
  assert(!snippet.includes("raw_text:"), "Overview must not pass raw digest text");
  assert(!snippet.includes("digest:"), "Overview must not pass digest material");
  assert(
    !snippet.includes("result_report:"),
    "Overview must not pass raw result report material",
  );
  assert(
    !snippet.includes("buildSelectedSessionDigestIntakePreviewV01("),
    "Overview block must not rebuild selected session intake",
  );
  assert(
    !snippet.includes("buildCodexResultFeedbackDraft("),
    "Overview block must not rebuild Codex feedback draft",
  );
}

function stepById(overview, stepId) {
  const step = overview.spine_steps.find((candidate) => candidate.step_id === stepId);
  assert(step, `Expected step ${stepId}`);
  return step;
}

function assertNoMemoryPromotionActions(overview) {
  const serialized = JSON.stringify(overview);
  for (const forbidden of [
    "promote_memory",
    "write_memory",
    "write_perspective_unit",
    "write_next_work_bias",
    "mutate_current_working_perspective",
    "apply_handoff_context",
    "send_handoff",
  ]) {
    assert(!serialized.includes(`"recommended_next_action":"${forbidden}"`));
    assert(
      !serialized.includes(
        `"recommended_next_operator_action":"${forbidden}"`,
      ),
    );
  }
}

function fakeSelectedDigestIngestRecord() {
  return {
    record_version: "selected_session_digest_ingest_record.v0.1",
    record_id: "selected_session_digest_ingest:spine-overview-clean",
    idempotency_key: "idempotency:spine-overview-clean",
    created_at: "2026-07-04T14:30:00.000Z",
    scope: "project:augnes",
    source_refs: ["source:spine-overview-clean"],
    evidence_refs: ["evidence:spine-overview-clean"],
    decision_record_refs: {
      decision_record_version:
        "operator_approved_selected_session_digest_ingest_decision_record.v0.1",
      decision_record_id:
        "operator_approved_selected_session_digest_ingest_decision:spine-overview-clean",
      decision_record_fingerprint: "sha256:spineoverviewclean",
      decision_idempotency_key: "idempotency:spine-overview-clean",
      decision_created_at: "2026-07-04T14:30:00.000Z",
      operator_decision: "approve_for_future_ingest_write",
    },
    ingest_contract_preview_refs: [
      "selected_session_digest_ingest_contract_preview:project:augnes:idempotency:spine-overview-clean",
    ],
    intake_preview_refs: [
      "selected_session_digest_intake_preview:project:augnes:source:spine-overview-clean",
    ],
    source_kind: "chatgpt_session_digest",
    source_ref: "source:spine-overview-clean",
    operator_ref: "operator:reviewer",
    session_ref: "session:spine-overview-clean",
    project_ref: null,
    selected_digest_candidate_refs: ["candidate:spine-overview-clean"],
    candidate_counts_by_kind: {
      session_summary: 1,
      user_goal: 0,
      decision: 0,
      open_question: 0,
      next_action: 0,
      evidence_ref: 0,
      source_ref: 0,
      risk_or_blocker: 0,
      reusable_context: 0,
    },
    sanitized_candidate_summaries: [
      {
        candidate_ref: "candidate:spine-overview-clean",
        candidate_kind: "session_summary",
        label: "Spine overview clean candidate",
        summary: "Bounded candidate ingest record for overview smoke.",
        source_refs: ["source:spine-overview-clean"],
        evidence_refs: ["evidence:spine-overview-clean"],
      },
    ],
    privacy_review_confirmation_ref: "privacy:spine-overview-clean",
    requested_ingest_scope_ref: "scope:spine-overview-clean",
    authority_profile: {
      durable_local_candidate_ingest_record: true,
      source_of_truth: false,
      candidate_record_only: true,
      persistence_horizon: "local_project_candidate_record",
      memory_promotion_performed: false,
      perspective_promotion_performed: false,
    },
    review_status: "ingested_as_candidate_record",
    persistence_horizon: "local_project_candidate_record",
    raw_material_policy: {
      digest_material_stored: false,
      pasted_text_material_stored: false,
      excerpt_material_stored: false,
      sanitized_candidate_summaries_only: true,
      private_or_secret_markers_allowed: false,
    },
    carry_forward_review_only_material: {
      review_only_candidate_refs: [],
      review_only_candidate_count: 0,
      review_only_candidate_summaries: [],
      unresolved_contract_blockers: [],
      contract_missing_evidence: [],
    },
    no_promotion_performed: {
      memory_promoted: false,
      current_working_perspective_updated: false,
      perspective_unit_written: false,
      next_work_bias_written: false,
      continuity_relay_written: false,
      handoff_context_mutated: false,
      selected_refs_written_to_live_handoff: false,
      handoff_sent: false,
    },
    write_validation: {
      validation_version: "selected_session_digest_ingest_write_validation.v0.1",
      decision_record_revalidated: true,
      selected_candidate_refs_revalidated: true,
      refused_sample_fixture_default_or_smoke_material: false,
      refused_unrequested_side_effects: false,
      refused_memory_perspective_handoff_promotion: false,
      validation_hash: "sha256:spineoverviewcleanvalidation",
    },
    authority_boundary: {
      durable_local_candidate_ingest_record: true,
      source_of_truth: false,
      candidate_record_only: true,
      can_write_db: true,
      can_create_ingest_record: true,
      can_create_ingest_receipt: true,
      can_write_selected_session_digest_candidate_record: true,
      can_write_memory: false,
      can_mutate_memory: false,
      can_promote_memory: false,
      can_mutate_current_working_perspective: false,
      can_write_perspective_unit: false,
      can_write_next_work_bias: false,
      can_update_continuity_relay: false,
      can_mutate_handoff_context: false,
      can_apply_handoff_context: false,
      can_write_selected_refs_to_live_handoff: false,
      can_send_handoff: false,
      can_write_dogfood_metrics: false,
      can_write_reuse_ledger: false,
      can_call_provider_openai: false,
      can_call_github: false,
      can_execute_codex: false,
      can_create_pr: false,
      can_merge_pr: false,
      can_run_autonomous_action: false,
      can_create_graph_or_vector_store: false,
      can_create_rag_stack: false,
      can_crawl_or_observe_browser: false,
      notes: [],
    },
    notes: [],
    record_fingerprint: "sha256:spineoverviewcleanrecord",
  };
}

function fakeProjectHistoryIntakeRecord() {
  return {
    record_version: "project_history_intake_record.v0.1",
    record_id: "project_history_intake_record:spine-overview-clean",
    idempotency_key: "idempotency:project-history-overview-clean",
    created_at: "2026-07-04T14:30:00.000Z",
    scope: "project:augnes",
    source_refs: ["source:project-history-overview-clean"],
    evidence_refs: ["evidence:project-history-overview-clean"],
    decision_preview_refs: {
      decision_preview_version:
        "project_history_intake_operator_decision_preview.v0.1",
      decision_preview_status: "ready_for_future_candidate_record_write",
      recommended_operator_decision:
        "approve_for_project_history_candidate_ingest",
    },
    intake_preview_refs: ["project_history_intake_preview.v0.1"],
    source_kind: "project_history_digest",
    source_ref: "source:project-history-overview-clean",
    operator_ref: "operator:project-history-overview",
    project_ref: "project:augnes",
    work_ref: null,
    selected_candidate_refs: ["candidate:timeline_event:overviewclean"],
    candidate_counts_by_kind: { timeline_event: 1 },
    sanitized_candidate_summaries: [
      {
        candidate_ref: "candidate:timeline_event:overviewclean",
        candidate_kind: "timeline_event",
        label: "Selected digest candidate ledger reached durable record",
        summary: "Selected digest candidate ledger reached durable record",
      },
    ],
    privacy_review_confirmation_ref: "privacy:project-history-overview-clean",
    authority_profile: {
      durable_local_project_history_candidate_record: true,
      source_of_truth: false,
      candidate_record_only: true,
      persistence_horizon: "local_project_candidate_record",
      memory_promotion_performed: false,
      perspective_promotion_performed: false,
    },
    review_status: "ingested_as_project_history_candidate_record",
    persistence_horizon: "local_project_candidate_record",
    raw_material_policy: {
      raw_history_material_stored: false,
      raw_text_material_stored: false,
      raw_excerpt_material_stored: false,
      sanitized_candidate_summaries_only: true,
      private_or_secret_markers_allowed: false,
    },
    carry_forward_review_only_material: { review_only_candidates: [] },
    no_promotion_performed: {
      memory_promoted: false,
      current_working_perspective_updated: false,
      perspective_unit_written: false,
      next_work_bias_written: false,
      continuity_relay_written: false,
      handoff_context_mutated: false,
      selected_refs_written_to_live_handoff: false,
      handoff_sent: false,
    },
    write_validation: {
      validation_version: "project_history_intake_write_validation.v0.1",
      decision_preview_revalidated: true,
      selected_candidate_refs_revalidated: true,
      refused_sample_fixture_default_or_smoke_material: false,
      refused_unrequested_side_effects: false,
      refused_memory_perspective_handoff_promotion: false,
      validation_hash: "validation:projecthistoryoverviewclean",
    },
    authority_boundary: {
      durable_local_project_history_candidate_record: true,
      source_of_truth: false,
      candidate_record_only: true,
      can_write_db: true,
      can_create_ingest_record: true,
      can_create_ingest_receipt: true,
      can_write_project_history_candidate_record: true,
      can_write_memory: false,
      can_mutate_memory: false,
      can_promote_memory: false,
      can_mutate_current_working_perspective: false,
      can_write_perspective_unit: false,
      can_write_next_work_bias: false,
      can_update_continuity_relay: false,
      can_mutate_handoff_context: false,
      can_apply_handoff_context: false,
      can_write_selected_refs_to_live_handoff: false,
      can_send_handoff: false,
      can_write_dogfood_metrics: false,
      can_write_reuse_ledger: false,
      can_call_provider_openai: false,
      can_call_github: false,
      can_execute_codex: false,
      can_create_pr: false,
      can_merge_pr: false,
      can_run_autonomous_action: false,
      can_create_graph_or_vector_store: false,
      can_create_rag_stack: false,
      can_crawl_or_observe_browser: false,
      notes: [],
    },
    notes: [],
    record_fingerprint: "fingerprint:projecthistoryoverviewclean",
  };
}

function codexFeedbackDraft({ resultReport }) {
  return {
    draft_version: "codex_result_feedback_draft.v0.1",
    candidate_status:
      resultReport === "supplied"
        ? "candidate_ready_for_review"
        : "insufficient_data",
    source_status: {
      handoff_context_rationale: "supplied",
      codex_result_report: resultReport,
      codex_result_report_status: resultReport,
    },
    insufficient_data_reasons:
      resultReport === "supplied" ? [] : ["missing_codex_result_report"],
    stale_or_gap_warnings: [],
    expected_observed_delta: {
      matched_expectations:
        resultReport === "supplied" ? [{ field: "check", summary: "ok" }] : [],
      missing_expectations: [],
      unexpected_observations: [],
      skipped_or_unverified_checks: [],
      changed_files_observed: resultReport === "supplied" ? ["file:a"] : [],
      checks_observed: resultReport === "supplied" ? ["check:a"] : [],
      requirement_progress_observed: [],
      not_done_items: [],
      mismatch_summary: "",
      confidence: resultReport === "supplied" ? "medium" : "insufficient_data",
      insufficient_data_reasons: [],
    },
    reuse_outcome_draft: {
      helpful_refs: [],
      stale_refs: [],
      missing_refs: [],
      noisy_refs: [],
      misleading_refs: [],
      unused_or_unmentioned_refs: [],
      unknown_refs: [],
      context_helpfulness_summary: "",
      context_corrections_needed: [],
      confidence: resultReport === "supplied" ? "medium" : "insufficient_data",
      review_needed: true,
    },
    carry_forward_suggestions: {
      next_relay_update_suggestions: [],
      next_handoff_adjustments: [],
      refs_to_preserve_next_time: [],
      refs_to_warn_next_time: [],
      refs_to_drop_or_deprioritize: [],
      unresolved_gaps: [],
      next_focus_candidate: "",
    },
  };
}

function reuseProposal({
  status,
  blockedReasons,
  insufficientReasons,
  hasResultReport,
}) {
  return {
    proposal_version: "dogfood_reuse_record_proposal.v0.1",
    proposal_status: status,
    blocked_reasons: blockedReasons,
    insufficient_data_reasons: insufficientReasons,
    source_status: {
      feedback_draft: "supplied",
      codex_result_report: hasResultReport ? "supplied" : "missing",
      handoff_context_rationale: "supplied",
      codex_result_report_status: hasResultReport ? "supplied" : "missing",
    },
    proposed_expected_observed_summary: {
      matched_expectation_count: hasResultReport ? 1 : 0,
      missing_expectation_count: 0,
      unexpected_observation_count: 0,
    },
    proposed_reuse_classifications: {
      helpful_refs: [],
      stale_refs: [],
      missing_refs: [],
      noisy_refs: [],
      misleading_refs: [],
      unknown_refs: [],
    },
    carry_forward_candidates: {
      next_relay_update_suggestions: [],
      next_handoff_adjustments: [],
    },
    evidence_summary: {
      has_result_report: hasResultReport,
      evidence_refs: hasResultReport ? ["evidence:reuse"] : [],
      missing_evidence: ["evidence:missing-reuse"],
    },
  };
}

function metricPreviewWithoutRecords() {
  return {
    preview_version: "dogfood_metric_candidate_preview.v0.1",
    candidate_status: "insufficient_data",
    aggregate_counts: {
      approved_record_count: 0,
    },
    source_record_summaries: [],
    insufficient_data_reasons: ["approved_reuse_records_missing"],
    metric_write_readiness: {
      required_followup: ["review_approved_reuse_records"],
      refusal_reasons: [],
    },
  };
}

function applyPreviewWithMissingEvidence() {
  return {
    preview_version: "handoff_context_apply_preview.v0.1",
    preview_status: "apply_candidates_available",
    input_summary: {
      apply_candidate_count: 1,
    },
    blocked_reasons: [],
    insufficient_data_reasons: [],
    conflict_summary: {
      blocked_apply_reasons: [],
    },
    evidence_summary: {
      has_record_review: true,
      missing_evidence: ["evidence:missing-apply"],
    },
  };
}

function applyWriteContractMissingCurrentMaterial() {
  return {
    preview_version: "handoff_context_apply_write_contract_preview.v0.1",
    contract_preview_status: "insufficient_data",
    recommended_next_action: "supply_current_handoff_packet_fingerprint",
    input_summary: {
      current_handoff_packet_fingerprint_supplied: false,
      current_handoff_context_ref_supplied: false,
      requested_operator_ref_supplied: false,
      would_apply_candidate_count: 1,
    },
    blocked_reasons: [],
    refusal_reasons: ["requires_current_handoff_packet_fingerprint"],
    insufficient_data_reasons: ["current_handoff_packet_fingerprint_missing"],
    missing_evidence: [],
    readiness: {
      ready_for_future_write_scope: false,
      current_blockers: [],
      current_refusal_reasons: ["requires_current_handoff_packet_fingerprint"],
      current_insufficient_data: [
        "current_handoff_packet_fingerprint_missing",
      ],
      current_missing_evidence: [],
    },
    evidence_summary: {
      has_apply_operator_decision_preview: true,
      missing_evidence: [],
    },
  };
}
