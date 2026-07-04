#!/usr/bin/env node
import assert from "node:assert/strict";

import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertPackageScript,
  collectUntrackedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const typeFile =
  "types/handoff-context-update-operator-decision-preview.ts";
const helperFile =
  "lib/handoff/handoff-context-update-operator-decision-preview.ts";
const panelFile =
  "components/handoff/handoff-context-update-operator-decision-preview-panel.tsx";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const smokeFile =
  "scripts/smoke-handoff-context-update-operator-decision-preview-v0-1.mjs";
const packageJsonFile = "package.json";
const handoffContextUpdateTypeFile =
  "types/handoff-context-update-preview.ts";
const handoffContextUpdateHelperFile =
  "lib/handoff/handoff-context-update-preview.ts";
const handoffContextUpdatePanelFile =
  "components/handoff/handoff-context-update-preview-panel.tsx";
const handoffContextUpdateSmokeFile =
  "scripts/smoke-handoff-context-update-preview-v0-1.mjs";
const metricInformedContinuityRelayAdjustmentSmokeFile =
  "scripts/smoke-metric-informed-continuity-relay-adjustment-preview-v0-1.mjs";
const handoffContextRelayRationaleSmokeFile =
  "scripts/smoke-handoff-context-relay-rationale-v0-1.mjs";
const agentWorkplaneSmokeFile = "scripts/smoke-agent-workplane-panels-v0-1.mjs";

const allowedChangedFiles = [
  typeFile,
  helperFile,
  panelFile,
  agentWorkplaneFile,
  smokeFile,
  packageJsonFile,
  handoffContextUpdateSmokeFile,
  metricInformedContinuityRelayAdjustmentSmokeFile,
  handoffContextRelayRationaleSmokeFile,
  agentWorkplaneSmokeFile,
];

const textByFile = loadTextByFile([
  ...allowedChangedFiles,
  handoffContextUpdateTypeFile,
  handoffContextUpdateHelperFile,
  handoffContextUpdatePanelFile,
]);
const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const panelText = textByFile.get(panelFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageScript({
  packageJsonText,
  scriptName:
    "smoke:handoff-context-update-operator-decision-preview-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-handoff-context-update-operator-decision-preview-v0-1.mjs",
});

assertContainsAll(
  typeText,
  [
    "handoff_context_update_operator_decision_preview.v0.1",
    "decision_preview_status",
    "recommended_operator_decision",
    "available_operator_decisions",
    "write_readiness",
    "approval_requirements",
    "would_write_preview",
    "would_not_write",
    "candidate_carry_forward",
    "can_persist_decision: false",
    "can_write_db: false",
    "can_write_handoff_context: false",
    "can_write_selected_refs: false",
    "can_send_handoff: false",
    "can_call_provider_openai: false",
    "can_call_github: false",
    "can_execute_codex: false",
  ],
  { label: typeFile },
);

assertContainsAll(
  helperText,
  [
    "buildHandoffContextUpdateOperatorDecisionPreviewV01",
    "createHandoffContextUpdateOperatorDecisionAuthorityBoundaryV01",
    "handoff_context_update_preview_missing",
    "handoff_context_update_preview_wrong_version",
    "handoff_context_update_candidate_material_missing",
    "blocked_unresolved_stop_if_missing_candidates",
    "blocked_verification_required_before_handoff",
    "blocked_selected_ref_candidate_missing_evidence",
    "blocked_selected_ref_candidate_unknown_context",
    "blocked_unknown_context_requires_operator_review",
    "handoff_context_update_write_candidate.v0.1",
    "can_persist_decision: false",
    "can_write_handoff_context: false",
    "can_send_handoff: false",
  ],
  { label: helperFile },
);

assertContainsAll(
  panelText,
  [
    "HandoffContextUpdateOperatorDecisionPreviewPanel",
    "Operator-reviewed Handoff Context Update Decision Preview",
    "decision_preview_status",
    "recommended_operator_decision",
    "write_ready",
    "can_persist_decision",
    "can_write_handoff_context",
    "can_send_handoff",
    "can_execute_codex",
  ],
  { label: panelFile },
);
assert(!panelText.includes("<button"), "decision panel must not add buttons");
assert(!panelText.includes("onClick"), "decision panel must not add action handlers");
assert(!panelText.includes(">Apply<"), "decision panel must not add apply UI");
assert(!panelText.includes(">Send<"), "decision panel must not add send UI");

assertContainsAll(
  agentWorkplaneText,
  [
    "HandoffContextUpdateOperatorDecisionPreviewPanel",
    "buildHandoffContextUpdateOperatorDecisionPreviewV01",
    "handoff_context_update_preview: handoffContextUpdatePreview",
    "workbench:default_handoff_context_update_operator_decision_preview",
  ],
  { label: agentWorkplaneFile },
);

for (const [label, text] of [
  [helperFile, helperText],
  [panelFile, panelText],
  [agentWorkplaneFile, agentWorkplaneText],
]) {
  assertNoForbiddenExpansion(label, text);
}

const previewModule = await import(
  "../lib/handoff/handoff-context-update-operator-decision-preview.ts"
);

const missingInputPreview =
  previewModule.buildHandoffContextUpdateOperatorDecisionPreviewV01({
    handoff_context_update_preview: null,
  });
assert.equal(missingInputPreview.decision_preview_status, "insufficient_data");
assert.equal(missingInputPreview.write_readiness.write_ready, false);
assert(
  missingInputPreview.missing_evidence.includes(
    "handoff_context_update_preview_missing",
  ),
);
assertAuthorityBoundary(missingInputPreview.authority_boundary);

const wrongVersionPreview =
  previewModule.buildHandoffContextUpdateOperatorDecisionPreviewV01({
    handoff_context_update_preview: {
      preview_version: "handoff_context_update_preview.v9",
      scope: "project:augnes",
    },
  });
assert.equal(wrongVersionPreview.decision_preview_status, "insufficient_data");
assert.equal(wrongVersionPreview.source_status.handoff_context_update_preview, "wrong_version");
assert.equal(wrongVersionPreview.write_readiness.write_ready, false);

const insufficientInputPreview =
  previewModule.buildHandoffContextUpdateOperatorDecisionPreviewV01({
    handoff_context_update_preview: handoffUpdatePreview({
      candidateStatus: "insufficient_data",
      insufficientDataReasons: [
        "workbench_default_does_not_read_or_write_reuse_ledger_store",
      ],
    }),
  });
assert.equal(
  insufficientInputPreview.decision_preview_status,
  "insufficient_data",
);
assert.equal(insufficientInputPreview.write_readiness.write_ready, false);

const defaultWorkbenchStylePreview =
  previewModule.buildHandoffContextUpdateOperatorDecisionPreviewV01({
    handoff_context_update_preview: handoffUpdatePreview({
      candidateStatus: "insufficient_data",
      insufficientDataReasons: [
        "metric_informed_relay_adjustment_preview_insufficient_data",
      ],
      missingEvidence: ["handoff_context_update_candidate_material_missing"],
    }),
  });
assert.equal(
  defaultWorkbenchStylePreview.decision_preview_status,
  "insufficient_data",
);
assert.equal(defaultWorkbenchStylePreview.write_readiness.write_ready, false);

const contextDietOnlyPreview =
  previewModule.buildHandoffContextUpdateOperatorDecisionPreviewV01({
    handoff_context_update_preview: handoffUpdatePreview({
      contextDietCandidates: [
        candidate("diet:only", "context-ref:noisy-only", "context_diet", "noisy", {
          evidenceRefs: ["evidence-ref:noisy-only"],
        }),
      ],
    }),
  });
assert.equal(
  contextDietOnlyPreview.evidence_summary.has_context_diet_signal,
  true,
);
assert.equal(contextDietOnlyPreview.write_readiness.write_ready, true);
assert(
  !contextDietOnlyPreview.missing_evidence.includes(
    "handoff_context_update_candidate_material_missing",
  ),
);

const unknownOnlyPreview =
  previewModule.buildHandoffContextUpdateOperatorDecisionPreviewV01({
    handoff_context_update_preview: handoffUpdatePreview({
      keepUnknownCandidates: [
        candidate(
          "unknown:only",
          "context-ref:unknown-only",
          "unknown_context",
          "unknown",
          {
            evidenceRefs: ["evidence-ref:unknown-only"],
          },
        ),
      ],
    }),
  });
assert.equal(unknownOnlyPreview.evidence_summary.has_unknown_signal, true);
assert.equal(
  unknownOnlyPreview.would_write_preview.selected_ref_add_candidates.length,
  0,
);
assert.equal(unknownOnlyPreview.write_readiness.write_ready, false);
assert(
  unknownOnlyPreview.blocking_reasons.includes(
    "blocked_unknown_context_requires_operator_review",
  ),
);
assert(
  !unknownOnlyPreview.missing_evidence.includes(
    "handoff_context_update_candidate_material_missing",
  ),
);

const selectedNoEvidencePreview =
  previewModule.buildHandoffContextUpdateOperatorDecisionPreviewV01({
    handoff_context_update_preview: handoffUpdatePreview({
      selectedAddCandidates: [
        candidate("selected:no-evidence", "context-ref:selected-no-evidence", "selected_ref", "helpful"),
      ],
    }),
  });
assert.equal(selectedNoEvidencePreview.write_readiness.write_ready, false);
assert(
  selectedNoEvidencePreview.blocking_reasons.includes(
    "blocked_selected_ref_candidate_missing_evidence",
  ),
);

const selectedUnknownPreview =
  previewModule.buildHandoffContextUpdateOperatorDecisionPreviewV01({
    handoff_context_update_preview: handoffUpdatePreview({
      selectedAddCandidates: [
        candidate(
          "selected:unknown",
          "context-ref:unknown-selected",
          "selected_ref",
          "unknown",
          {
            evidenceRefs: ["evidence-ref:unknown-selected"],
          },
        ),
      ],
    }),
  });
assert.equal(selectedUnknownPreview.write_readiness.write_ready, false);
assert(
  selectedUnknownPreview.blocking_reasons.includes(
    "blocked_selected_ref_candidate_unknown_context",
  ),
);
assert.equal(
  selectedUnknownPreview.would_write_preview.selected_ref_add_candidates.length,
  0,
  "unknown selected refs must not remain selected in would-write material",
);
assert(
  selectedUnknownPreview.would_write_preview.keep_unknown_candidates.some(
    (item) => item.ref_id === "context-ref:unknown-selected",
  ),
);

const warningOnlyPreview =
  previewModule.buildHandoffContextUpdateOperatorDecisionPreviewV01({
    handoff_context_update_preview: handoffUpdatePreview({
      warningCandidates: [
        candidate("warning:only", "context-ref:warning-only", "warning", "stale", {
          evidenceRefs: ["evidence-ref:warning-only"],
        }),
      ],
    }),
  });
assert.equal(warningOnlyPreview.evidence_summary.has_warning_signal, true);
assert.equal(warningOnlyPreview.write_readiness.write_ready, true);
assert(
  !warningOnlyPreview.missing_evidence.includes(
    "handoff_context_update_candidate_material_missing",
  ),
);

const expectedReturnOnlyPreview =
  previewModule.buildHandoffContextUpdateOperatorDecisionPreviewV01({
    handoff_context_update_preview: handoffUpdatePreview({
      expectedReturnCandidates: [
        candidate(
          "expected:only",
          "expected-return:needs-attention",
          "expected_return_signal",
          "expected_observed_mismatch",
          {
            evidenceRefs: ["evidence-ref:expected-only"],
          },
        ),
      ],
    }),
  });
assert.equal(
  expectedReturnOnlyPreview.decision_preview_status,
  "ready_for_operator_review",
);
assert.equal(expectedReturnOnlyPreview.write_readiness.write_ready, false);
assert(
  !expectedReturnOnlyPreview.missing_evidence.includes(
    "handoff_context_update_candidate_material_missing",
  ),
);

const stopOrVerificationPreview =
  previewModule.buildHandoffContextUpdateOperatorDecisionPreviewV01({
    handoff_context_update_preview: handoffUpdatePreview({
      stopCandidates: [
        candidate("stop:only", "context-ref:missing-stop", "stop_if_missing", "missing", {
          evidenceRefs: ["evidence-ref:stop-only"],
        }),
      ],
      verificationCandidates: [
        candidate(
          "verify:only",
          "verification:browser-not-run",
          "stop_if_missing",
          "skipped_or_unverified_check",
          {
            evidenceRefs: ["evidence-ref:verify-only"],
          },
        ),
      ],
    }),
  });
assert.equal(stopOrVerificationPreview.write_readiness.write_ready, false);
assert(
  stopOrVerificationPreview.blocking_reasons.includes(
    "blocked_unresolved_stop_if_missing_candidates",
  ),
);
assert(
  stopOrVerificationPreview.blocking_reasons.includes(
    "blocked_verification_required_before_handoff",
  ),
);

const cleanEvidenceBackedPreview =
  previewModule.buildHandoffContextUpdateOperatorDecisionPreviewV01({
    handoff_context_update_preview: handoffUpdatePreview({
      candidateStatus: "update_candidates_available",
      selectedAddCandidates: [
        candidate("selected:clean", "context-ref:selected-clean", "selected_ref", "helpful", {
          evidenceRefs: ["evidence-ref:selected-clean"],
        }),
      ],
      warningCandidates: [
        candidate("warning:clean", "context-ref:warning-clean", "warning", "stale", {
          evidenceRefs: ["evidence-ref:warning-clean"],
        }),
      ],
    }),
  });
assert.equal(
  cleanEvidenceBackedPreview.decision_preview_status,
  "ready_for_future_write",
);
assert.equal(
  cleanEvidenceBackedPreview.recommended_operator_decision,
  "approve_for_future_write",
);
assert.equal(cleanEvidenceBackedPreview.write_readiness.write_ready, true);
assertAuthorityBoundary(cleanEvidenceBackedPreview.authority_boundary);

const changedFilesBoundary = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "handoff-context-update-operator-decision-preview-v0-1",
});
const untrackedFiles = collectUntrackedFiles();
const unexpectedUntracked = untrackedFiles.filter(
  (file) => !allowedChangedFiles.includes(file),
);
assert.deepEqual(
  unexpectedUntracked,
  [],
  `Unexpected untracked files for handoff context update operator decision preview v0.1: ${unexpectedUntracked.join(
    ", ",
  )}`,
);
for (const file of changedFilesBoundary.files) {
  assert(!/^app\/.*route\.(ts|tsx|js|jsx)$/.test(file), "no route file is allowed");
}

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke: "handoff-context-update-operator-decision-preview-v0-1",
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_mode: changedFilesBoundary.mode,
      changed_files: uniqueSorted(changedFilesBoundary.files),
      untracked_files: untrackedFiles,
      assertions: {
        missing_input_insufficient_data: true,
        wrong_version_not_write_ready: true,
        insufficient_input_not_write_ready: true,
        default_workbench_insufficient_not_write_ready: true,
        context_diet_only_not_material_missing: true,
        unknown_only_not_selected_not_write_ready: true,
        selected_without_evidence_blocked: true,
        selected_unknown_not_write_ready: true,
        warning_only_reviewable_not_material_missing: true,
        expected_return_only_requires_review: true,
        stop_and_verification_block_write_ready: true,
        clean_evidence_backed_ready: true,
        authority_boundary_false_writes: true,
        workbench_panel_marker_checked: true,
        no_new_route_or_post: true,
      },
    },
    null,
    2,
  ),
);

function handoffUpdatePreview(options = {}) {
  const selectedAddCandidates = options.selectedAddCandidates ?? [];
  const selectedReinforcementCandidates =
    options.selectedReinforcementCandidates ?? [];
  const warningCandidates = options.warningCandidates ?? [];
  const contextDietCandidates = options.contextDietCandidates ?? [];
  const keepUnknownCandidates = options.keepUnknownCandidates ?? [];
  const stopCandidates = options.stopCandidates ?? [];
  const verificationCandidates = options.verificationCandidates ?? [];
  const missingBlockers = options.missingBlockers ?? [];
  const expectedReturnCandidates = options.expectedReturnCandidates ?? [];
  const allCandidates = [
    ...selectedAddCandidates,
    ...selectedReinforcementCandidates,
    ...warningCandidates,
    ...contextDietCandidates,
    ...keepUnknownCandidates,
    ...stopCandidates,
    ...verificationCandidates,
    ...missingBlockers,
    ...expectedReturnCandidates,
  ];
  const missingEvidence = options.missingEvidence ?? [];
  const insufficientDataReasons = options.insufficientDataReasons ?? [];

  return {
    preview_version: options.previewVersion ?? "handoff_context_update_preview.v0.1",
    scope: "project:augnes",
    as_of: "2026-07-04T12:00:00.000Z",
    source_refs: ["handoff-context-update-preview:smoke"],
    candidate_status: options.candidateStatus ?? "needs_operator_review",
    input_summary: {
      handoff_context_relay_rationale_ref:
        "handoff_context_relay_rationale.v0.1",
      handoff_context_relay_rationale_source_status: "supplied",
      metric_informed_relay_adjustment_preview_ref:
        "metric_informed_continuity_relay_adjustment_preview.v0.1",
      metric_informed_relay_adjustment_candidate_status:
        "needs_operator_review",
      selected_ref_candidate_count:
        selectedAddCandidates.length + selectedReinforcementCandidates.length,
      warning_candidate_count: warningCandidates.length,
      context_diet_candidate_count:
        contextDietCandidates.length + keepUnknownCandidates.length,
      stop_if_missing_candidate_count:
        stopCandidates.length + verificationCandidates.length + missingBlockers.length,
      expected_return_signal_candidate_count: expectedReturnCandidates.length,
      unknown_candidate_count: keepUnknownCandidates.length,
      missing_evidence_count: missingEvidence.length,
    },
    proposed_selected_ref_updates: {
      add_selected_ref_candidates: selectedAddCandidates,
      reinforce_selected_ref_candidates: selectedReinforcementCandidates,
      selected_with_review_only: [
        ...selectedAddCandidates,
        ...selectedReinforcementCandidates,
      ],
    },
    proposed_warning_updates: {
      add_warning_candidates: warningCandidates,
      strengthen_warning_candidates: [],
      stale_warning_candidates: warningCandidates.filter(
        (item) => item.source_bucket === "stale",
      ),
      noisy_warning_candidates: warningCandidates.filter(
        (item) => item.source_bucket === "noisy",
      ),
      misleading_warning_candidates: warningCandidates.filter(
        (item) => item.source_bucket === "misleading",
      ),
      unknown_warning_candidates: keepUnknownCandidates,
    },
    proposed_context_diet_updates: {
      refs_to_deprioritize: contextDietCandidates,
      refs_to_exclude_from_handoff: contextDietCandidates.filter((item) =>
        ["noisy", "misleading"].includes(item.source_bucket),
      ),
      refs_to_keep_unknown: keepUnknownCandidates,
    },
    proposed_stop_if_missing_updates: {
      stop_if_missing_candidates: stopCandidates,
      verification_required_before_handoff: verificationCandidates,
      missing_source_or_evidence_blockers: missingBlockers,
    },
    proposed_expected_return_signal_updates: {
      expected_return_emphasis_candidates: expectedReturnCandidates,
      next_handoff_focus_candidates: [],
      mismatch_return_signal_candidates: expectedReturnCandidates.filter(
        (item) => item.source_bucket === "expected_observed_mismatch",
      ),
    },
    evidence_summary: {
      has_handoff_context_relay_rationale: true,
      has_metric_informed_relay_adjustment_preview: true,
      has_selected_ref_signal:
        selectedAddCandidates.length + selectedReinforcementCandidates.length >
        0,
      has_warning_signal: warningCandidates.length > 0,
      has_context_diet_signal:
        contextDietCandidates.length + keepUnknownCandidates.length > 0,
      has_stop_if_missing_signal:
        stopCandidates.length + verificationCandidates.length + missingBlockers.length >
        0,
      has_expected_return_signal: expectedReturnCandidates.length > 0,
      has_unknown_signal: keepUnknownCandidates.length > 0,
      has_insufficient_data: insufficientDataReasons.length > 0,
      evidence_refs: allCandidates.flatMap((item) => item.evidence_refs),
      missing_evidence: missingEvidence,
    },
    operator_review_checklist: ["review handoff context update candidates"],
    blocked_reasons: options.blockedReasons ?? [],
    insufficient_data_reasons: insufficientDataReasons,
    write_readiness: {
      ready_for_handoff_context_write: false,
      ready_for_handoff_send: false,
      ready_for_selected_ref_update_write: false,
      required_followup: ["operator reviewed future write"],
      refusal_reasons: ["candidate preview only"],
    },
    non_goals: ["no handoff context write"],
    authority_boundary: {
      read_only: true,
      candidate_material_only: true,
      source_of_truth: false,
      derived_read_model: true,
      can_write_db: false,
      can_write_handoff_context: false,
      can_send_handoff: false,
      can_write_selected_refs: false,
      can_write_continuity_relay: false,
      can_update_current_working_perspective: false,
      can_write_perspective_unit: false,
      can_write_next_work_bias: false,
      can_write_memory: false,
      can_mutate_memory: false,
      can_promote_memory: false,
      can_apply_project_perspective: false,
      can_create_promotion_decision: false,
      can_create_formation_receipt: false,
      can_write_dogfood_metrics: false,
      can_update_metrics: false,
      can_write_dogfood_ledger: false,
      can_call_provider_openai: false,
      can_call_github: false,
      can_execute_codex: false,
      can_create_pr: false,
      can_merge_pr: false,
      can_run_autonomous_action: false,
      can_create_graph_or_vector_store: false,
      can_create_rag_stack: false,
      can_crawl_or_observe_browser: false,
      notes: ["smoke handoff update preview"],
    },
  };
}

function candidate(candidateId, refId, kind, bucket, options = {}) {
  return {
    candidate_id: candidateId,
    ref_id: refId,
    label: refId,
    summary: `${kind} ${bucket} candidate ${refId}`,
    candidate_kind: kind,
    source_bucket: bucket,
    source_adjustment_kind: options.adjustmentKind ?? "warn_anchor",
    source_candidate_id: options.sourceCandidateId ?? candidateId,
    source_refs: [refId, ...(options.sourceRefs ?? [])],
    evidence_refs: options.evidenceRefs ?? [],
    source_record_refs: options.sourceRecordRefs ?? ["source-record:smoke"],
    existing_handoff_ref_ids: options.existingHandoffRefIds ?? [],
    candidate_only: true,
    review_note: "smoke candidate remains review-only",
  };
}

function assertAuthorityBoundary(boundary) {
  assert.equal(boundary.read_only, true);
  assert.equal(boundary.candidate_material_only, true);
  assert.equal(boundary.source_of_truth, false);
  assert.equal(boundary.derived_read_model, true);
  assert.equal(boundary.can_persist_decision, false);
  assert.equal(boundary.can_write_db, false);
  assert.equal(boundary.can_write_handoff_context, false);
  assert.equal(boundary.can_write_selected_refs, false);
  assert.equal(boundary.can_send_handoff, false);
  assert.equal(boundary.can_write_continuity_relay, false);
  assert.equal(boundary.can_update_current_working_perspective, false);
  assert.equal(boundary.can_write_perspective_unit, false);
  assert.equal(boundary.can_write_next_work_bias, false);
  assert.equal(boundary.can_write_memory, false);
  assert.equal(boundary.can_mutate_memory, false);
  assert.equal(boundary.can_promote_memory, false);
  assert.equal(boundary.can_apply_project_perspective, false);
  assert.equal(boundary.can_create_promotion_decision, false);
  assert.equal(boundary.can_create_formation_receipt, false);
  assert.equal(boundary.can_write_dogfood_metrics, false);
  assert.equal(boundary.can_update_metrics, false);
  assert.equal(boundary.can_write_dogfood_ledger, false);
  assert.equal(boundary.can_call_provider_openai, false);
  assert.equal(boundary.can_call_github, false);
  assert.equal(boundary.can_execute_codex, false);
  assert.equal(boundary.can_create_pr, false);
  assert.equal(boundary.can_merge_pr, false);
  assert.equal(boundary.can_run_autonomous_action, false);
  assert.equal(boundary.can_create_graph_or_vector_store, false);
  assert.equal(boundary.can_create_rag_stack, false);
  assert.equal(boundary.can_crawl_or_observe_browser, false);
}

function assertNoForbiddenExpansion(label, text) {
  for (const forbidden of [
    "can_persist_decision: true",
    "can_write_db: true",
    "can_write_handoff_context: true",
    "can_write_selected_refs: true",
    "can_send_handoff: true",
    "can_write_continuity_relay: true",
    "can_update_current_working_perspective: true",
    "can_write_memory: true",
    "can_mutate_memory: true",
    "can_apply_project_perspective: true",
    "can_create_promotion_decision: true",
    "can_create_formation_receipt: true",
    "can_write_dogfood_metrics: true",
    "can_update_metrics: true",
    "can_write_dogfood_ledger: true",
    "can_call_provider_openai: true",
    "can_call_github: true",
    "can_execute_codex: true",
    "can_create_pr: true",
    "can_merge_pr: true",
    "can_run_autonomous_action: true",
    "writeHandoffContext",
    "sendHandoff",
    "writeSelectedRef",
    "writeHandoffReuseOutcomeLedgerRecordV01",
    "applyPerspective(",
    "export async function POST",
    "fetch(",
    "new Database",
  ]) {
    assert(
      !text.includes(forbidden),
      `${label} must not include forbidden expansion ${forbidden}`,
    );
  }
}
