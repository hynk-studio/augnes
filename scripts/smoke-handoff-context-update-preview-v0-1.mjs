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

const typeFile = "types/handoff-context-update-preview.ts";
const helperFile = "lib/handoff/handoff-context-update-preview.ts";
const panelFile = "components/handoff/handoff-context-update-preview-panel.tsx";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const smokeFile = "scripts/smoke-handoff-context-update-preview-v0-1.mjs";
const packageJsonFile = "package.json";
const metricAdjustmentTypeFile =
  "types/metric-informed-continuity-relay-adjustment-preview.ts";
const metricAdjustmentHelperFile =
  "lib/workplane/metric-informed-continuity-relay-adjustment-preview.ts";
const metricAdjustmentPanelFile =
  "components/workplane/metric-informed-continuity-relay-adjustment-preview-panel.tsx";
const metricAdjustmentSmokeFile =
  "scripts/smoke-metric-informed-continuity-relay-adjustment-preview-v0-1.mjs";
const handoffRationaleTypeFile = "types/handoff-context-relay-rationale.ts";
const handoffRationaleHelperFile =
  "lib/handoff/handoff-context-relay-rationale.ts";
const handoffRationaleSmokeFile =
  "scripts/smoke-handoff-context-relay-rationale-v0-1.mjs";
const agentWorkplaneSmokeFile = "scripts/smoke-agent-workplane-panels-v0-1.mjs";

const allowedChangedFiles = [
  typeFile,
  helperFile,
  panelFile,
  agentWorkplaneFile,
  smokeFile,
  packageJsonFile,
  metricAdjustmentSmokeFile,
  handoffRationaleSmokeFile,
  agentWorkplaneSmokeFile,
];

const textByFile = loadTextByFile([
  ...allowedChangedFiles,
  metricAdjustmentTypeFile,
  metricAdjustmentHelperFile,
  metricAdjustmentPanelFile,
  handoffRationaleTypeFile,
  handoffRationaleHelperFile,
]);
const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const panelText = textByFile.get(panelFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:handoff-context-update-preview-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-handoff-context-update-preview-v0-1.mjs",
});

assertContainsAll(
  typeText,
  [
    "handoff_context_update_preview.v0.1",
    "proposed_selected_ref_updates",
    "proposed_warning_updates",
    "proposed_context_diet_updates",
    "proposed_stop_if_missing_updates",
    "proposed_expected_return_signal_updates",
    "ready_for_handoff_context_write: false",
    "ready_for_handoff_send: false",
    "ready_for_selected_ref_update_write: false",
    "can_write_db: false",
    "can_write_handoff_context: false",
    "can_send_handoff: false",
    "can_call_provider_openai: false",
    "can_call_github: false",
    "can_execute_codex: false",
    "can_create_graph_or_vector_store: false",
    "can_create_rag_stack: false",
    "can_crawl_or_observe_browser: false",
  ],
  { label: typeFile },
);

assertContainsAll(
  helperText,
  [
    "buildHandoffContextUpdatePreviewV01",
    "createHandoffContextUpdateAuthorityBoundaryV01",
    "handoff_context_relay_rationale_missing",
    "metric_informed_relay_adjustment_preview_missing",
    "metric_informed_relay_adjustment_preview_insufficient_data",
    "Unknown refs remain unknown and cannot become selected handoff refs",
    "handoff_context_write_not_in_scope_for_v0_1",
    "handoff_send_not_in_scope_for_v0_1",
    "selected_ref_update_write_not_in_scope_for_v0_1",
    "can_write_handoff_context: false",
    "can_send_handoff: false",
    "can_write_db: false",
  ],
  { label: helperFile },
);

assertContainsAll(
  panelText,
  [
    "HandoffContextUpdatePreviewPanel",
    "Handoff Context Update Preview",
    "ready_for_handoff_context_write",
    "ready_for_handoff_send",
    "can_write_handoff_context",
    "can_send_handoff",
    "can_execute_codex",
  ],
  { label: panelFile },
);
assert(!panelText.includes("<button"), "handoff context update panel must not add buttons");
assert(!panelText.includes(">Apply<"), "handoff context update panel must not add apply UI");

assertContainsAll(
  agentWorkplaneText,
  [
    "HandoffContextUpdatePreviewPanel",
    "buildHandoffContextUpdatePreviewV01",
    "handoff_context_relay_rationale: handoffContextRationale",
    "metric_informed_relay_adjustment_preview:",
    "workbench:default_handoff_context_update_preview",
  ],
  { label: agentWorkplaneFile },
);
assert(
  !agentWorkplaneText.includes("writeHandoffReuseOutcomeLedgerRecordV01"),
  "Workbench must not call the reuse ledger write helper",
);
assert(
  !agentWorkplaneText.includes("reuse-ledger/metric-preview"),
  "Workbench must not fetch the metric preview route during render",
);

for (const [label, text] of [
  [helperFile, helperText],
  [panelFile, panelText],
  [agentWorkplaneFile, agentWorkplaneText],
]) {
  assertNoForbiddenExpansion(label, text);
}

const previewModule = await import(
  "../lib/handoff/handoff-context-update-preview.ts"
);
const rationale = handoffRationale();

const selectedOnlyPreview = adjustmentPreview({
  candidateStatus: "adjustment_candidates_available",
  preserveCandidates: [
    relayCandidate("preserve:existing", "context-ref:selected-existing", "helpful", {
      adjustmentKind: "preserve_anchor",
      evidenceRefs: ["evidence-ref:selected-existing"],
    }),
    relayCandidate("preserve:new", "context-ref:selected-new", "helpful", {
      adjustmentKind: "preserve_anchor",
      evidenceRefs: ["evidence-ref:selected-new"],
    }),
  ],
});
const selectedUpdatePreview =
  previewModule.buildHandoffContextUpdatePreviewV01({
    handoff_context_relay_rationale: rationale,
    metric_informed_relay_adjustment_preview: selectedOnlyPreview,
    as_of: "2026-07-04T10:00:00.000Z",
  });
assert.equal(
  selectedUpdatePreview.candidate_status,
  "update_candidates_available",
);
assert.equal(
  selectedUpdatePreview.proposed_selected_ref_updates
    .reinforce_selected_ref_candidates.length,
  1,
);
assert.equal(
  selectedUpdatePreview.proposed_selected_ref_updates.add_selected_ref_candidates
    .length,
  1,
);
assert.equal(
  selectedUpdatePreview.proposed_selected_ref_updates
    .reinforce_selected_ref_candidates[0].existing_handoff_ref_ids[0],
  "context-ref:selected-existing",
);
assertWriteReadiness(selectedUpdatePreview.write_readiness);
assertAuthorityBoundary(selectedUpdatePreview.authority_boundary);

const missingRationalePreview =
  previewModule.buildHandoffContextUpdatePreviewV01({
    handoff_context_relay_rationale: null,
    metric_informed_relay_adjustment_preview: selectedOnlyPreview,
  });
assert.equal(missingRationalePreview.candidate_status, "insufficient_data");
assert(
  missingRationalePreview.evidence_summary.missing_evidence.includes(
    "handoff_context_relay_rationale_missing",
  ),
);
assertWriteReadiness(missingRationalePreview.write_readiness);

const missingAdjustmentPreview =
  previewModule.buildHandoffContextUpdatePreviewV01({
    handoff_context_relay_rationale: rationale,
    metric_informed_relay_adjustment_preview: null,
  });
assert.equal(missingAdjustmentPreview.candidate_status, "insufficient_data");
assert(
  missingAdjustmentPreview.evidence_summary.missing_evidence.includes(
    "metric_informed_relay_adjustment_preview_missing",
  ),
);
assertWriteReadiness(missingAdjustmentPreview.write_readiness);

const defaultWorkbenchPreview =
  previewModule.buildHandoffContextUpdatePreviewV01({
    handoff_context_relay_rationale: rationale,
    metric_informed_relay_adjustment_preview: adjustmentPreview({
      candidateStatus: "insufficient_data",
      insufficientDataReasons: [
        "continuity_relay_adjustment_candidate_material_missing",
      ],
    }),
    source_refs: ["workbench:default_handoff_context_update_preview"],
  });
assert.equal(defaultWorkbenchPreview.candidate_status, "insufficient_data");
assert(
  defaultWorkbenchPreview.insufficient_data_reasons.includes(
    "metric_informed_relay_adjustment_preview_insufficient_data",
  ),
);
assertWriteReadiness(defaultWorkbenchPreview.write_readiness);

const contextDietOnlyPreview =
  previewModule.buildHandoffContextUpdatePreviewV01({
    handoff_context_relay_rationale: rationale,
    metric_informed_relay_adjustment_preview: adjustmentPreview({
      candidateStatus: "needs_operator_review",
      contextDietCandidates: [
        relayCandidate("diet:only-noisy", "context-ref:noisy-only", "noisy", {
          adjustmentKind: "context_diet",
          evidenceRefs: ["evidence-ref:noisy-only"],
        }),
      ],
    }),
  });
assert.equal(contextDietOnlyPreview.candidate_status, "needs_operator_review");
assert(
  contextDietOnlyPreview.proposed_context_diet_updates.refs_to_deprioritize
    .some((candidate) => candidate.ref_id === "context-ref:noisy-only"),
);
assert(
  !contextDietOnlyPreview.evidence_summary.missing_evidence.includes(
    "handoff_context_update_candidate_material_missing",
  ),
);
assert(
  !contextDietOnlyPreview.insufficient_data_reasons.includes(
    "handoff_context_update_candidate_material_missing",
  ),
);

const unknownOnlyPreview = previewModule.buildHandoffContextUpdatePreviewV01({
  handoff_context_relay_rationale: rationale,
  metric_informed_relay_adjustment_preview: adjustmentPreview({
    candidateStatus: "needs_operator_review",
    preserveCandidates: [
      relayCandidate("preserve:unknown-only", "context-ref:unknown-only", "unknown", {
        adjustmentKind: "unknown_context",
        evidenceRefs: ["evidence-ref:unknown-only"],
      }),
    ],
  }),
});
assert.equal(unknownOnlyPreview.candidate_status, "needs_operator_review");
assert.equal(
  unknownOnlyPreview.proposed_selected_ref_updates.add_selected_ref_candidates
    .length,
  0,
  "unknown-only refs must not become selected refs",
);
assert(
  unknownOnlyPreview.proposed_context_diet_updates.refs_to_keep_unknown.some(
    (candidate) => candidate.ref_id === "context-ref:unknown-only",
  ),
);
assert(
  !unknownOnlyPreview.evidence_summary.missing_evidence.includes(
    "handoff_context_update_candidate_material_missing",
  ),
);
assert(
  !unknownOnlyPreview.insufficient_data_reasons.includes(
    "handoff_context_update_candidate_material_missing",
  ),
);

const problemPreview = previewModule.buildHandoffContextUpdatePreviewV01({
  handoff_context_relay_rationale: rationale,
  metric_informed_relay_adjustment_preview: adjustmentPreview({
    candidateStatus: "needs_operator_review",
    preserveCandidates: [
      relayCandidate("preserve:unknown", "context-ref:unknown-alpha", "unknown", {
        adjustmentKind: "unknown_context",
        evidenceRefs: ["evidence-ref:unknown-alpha"],
      }),
    ],
    warningCandidates: [
      relayCandidate("warn:stale", "context-ref:stale-repeat", "stale", {
        adjustmentKind: "warn_anchor",
        evidenceRefs: ["evidence-ref:stale"],
        strength: "strong",
      }),
      relayCandidate("warn:missing", "context-ref:missing-gap", "missing", {
        adjustmentKind: "warn_anchor",
        evidenceRefs: ["evidence-ref:missing"],
      }),
      relayCandidate("warn:misleading", "context-ref:misleading-repeat", "misleading", {
        adjustmentKind: "warn_anchor",
        evidenceRefs: ["evidence-ref:misleading"],
        strength: "strong",
      }),
    ],
    contextDietCandidates: [
      relayCandidate("diet:noisy", "context-ref:noisy-alpha", "noisy", {
        adjustmentKind: "context_diet",
        evidenceRefs: ["evidence-ref:noisy"],
      }),
    ],
    stopCandidates: [
      relayCandidate(
        "verify:browser",
        "browser validation was not run",
        "skipped_or_unverified_check",
        {
          adjustmentKind: "stop_if_missing",
          evidenceRefs: ["evidence-ref:skipped"],
        },
      ),
    ],
    nextFocusCandidates: [
      relayCandidate("next:not-done", "operator-reviewed handoff write remains follow-up", "not_done_item", {
        adjustmentKind: "next_focus",
        evidenceRefs: ["evidence-ref:not-done"],
      }),
    ],
    mismatchCandidates: [
      relayCandidate("mismatch:return", "Expected/observed mismatch remains unresolved", "expected_observed_mismatch", {
        adjustmentKind: "handoff_adjustment",
        evidenceRefs: ["evidence-ref:mismatch"],
      }),
    ],
  }),
});
assert.equal(problemPreview.candidate_status, "needs_operator_review");
assert.equal(
  problemPreview.proposed_selected_ref_updates.add_selected_ref_candidates
    .length,
  0,
  "unknown refs must not become selected refs",
);
assert(
  problemPreview.proposed_context_diet_updates.refs_to_keep_unknown.some(
    (candidate) => candidate.ref_id === "context-ref:unknown-alpha",
  ),
);
assert(
  problemPreview.proposed_warning_updates.stale_warning_candidates.some(
    (candidate) => candidate.ref_id === "context-ref:stale-repeat",
  ),
);
assert(
  problemPreview.proposed_context_diet_updates.refs_to_deprioritize.some(
    (candidate) => candidate.ref_id === "context-ref:noisy-alpha",
  ),
);
assert(
  problemPreview.proposed_context_diet_updates.refs_to_exclude_from_handoff.some(
    (candidate) => candidate.ref_id === "context-ref:misleading-repeat",
  ),
);
assert(
  problemPreview.proposed_stop_if_missing_updates
    .verification_required_before_handoff.some(
      (candidate) => candidate.source_bucket === "skipped_or_unverified_check",
    ),
);
assert(
  problemPreview.proposed_stop_if_missing_updates.stop_if_missing_candidates.some(
    (candidate) => candidate.source_bucket === "not_done_item",
  ),
);
assert(
  problemPreview.proposed_expected_return_signal_updates
    .expected_return_emphasis_candidates.some(
      (candidate) => candidate.source_bucket === "skipped_or_unverified_check",
    ),
);
assert(
  problemPreview.proposed_expected_return_signal_updates
    .next_handoff_focus_candidates.some(
      (candidate) => candidate.source_bucket === "not_done_item",
    ),
);
assert(
  problemPreview.proposed_expected_return_signal_updates
    .mismatch_return_signal_candidates.some(
      (candidate) => candidate.source_bucket === "expected_observed_mismatch",
    ),
);
assertWriteReadiness(problemPreview.write_readiness);
assertAuthorityBoundary(problemPreview.authority_boundary);

const changedFilesBoundary = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "handoff-context-update-preview-v0-1",
});
const untrackedFiles = collectUntrackedFiles();
const unexpectedUntracked = untrackedFiles.filter(
  (file) => !allowedChangedFiles.includes(file),
);
assert.deepEqual(
  unexpectedUntracked,
  [],
  `Unexpected untracked files for handoff context update preview v0.1: ${unexpectedUntracked.join(
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
      smoke: "handoff-context-update-preview-v0-1",
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_mode: changedFilesBoundary.mode,
      changed_files: uniqueSorted(changedFilesBoundary.files),
      untracked_files: untrackedFiles,
      assertions: {
        missing_rationale_insufficient_data: true,
        missing_relay_adjustment_preview_insufficient_data: true,
        unknown_context_not_selected: true,
        context_diet_only_not_material_missing: true,
        unknown_only_not_material_missing: true,
        stale_noisy_misleading_context_routed: true,
        skipped_checks_not_done_expected_return_checked: true,
        write_readiness_false: true,
        authority_boundary_false_writes: true,
        workbench_panel_marker_checked: true,
        no_new_route_or_post: true,
      },
    },
    null,
    2,
  ),
);

function handoffRationale() {
  return {
    runtime: "augnes",
    rationale_version: "handoff_context_relay_rationale.v0.1",
    scope: "project:augnes",
    as_of: "2026-07-04T09:00:00.000Z",
    source_refs: {
      continuity_relay_ref: "workplane_continuity_relay.v0.1",
      handoff_capsule_ref: "handoff-capsule:smoke",
      codex_launch_card_ref: "codex-launch-card:smoke",
      current_working_perspective_ref: "cwp:smoke",
      guide_brief_ref: "guide:smoke",
      delta_projection_ref: null,
      workplane_ref: "/workbench",
      source_refs: ["context-ref:selected-existing"],
      selected_source_refs: ["context-ref:selected-existing"],
      evidence_refs: ["evidence-ref:selected-existing"],
      artifact_refs: [],
      handoff_refs: [],
      diagnostic_refs: [],
      route_refs: ["/workbench"],
      docs_refs: [],
    },
    selected_refs: [
      {
        ref_id: "context-ref:selected-existing",
        ref_kind: "continuity_source_ref",
        label: "selected existing",
        summary: "existing selected context",
        source_refs: ["context-ref:selected-existing"],
        reason_category: "preserve_current_work",
        origin: "continuity_relay",
        priority: 10,
        blocks_handoff: false,
      },
    ],
    why_included: [],
    stale_or_gap_warnings: [
      {
        warning_id: "warning:stale-repeat",
        summary: "stale repeated context",
        source_refs: ["context-ref:stale-repeat"],
        severity: "medium",
        blocks_handoff: false,
      },
    ],
    excluded_or_deferred_refs: [],
    stop_if_missing: [],
    non_goals: ["no handoff context write"],
    expected_return_signal: {
      signal_version: "expected_return_signal.v0.1",
      required_fields: ["changed_files", "checks_run"],
      context_feedback_fields: ["context_helpful_or_stale_refs"],
      instructions: ["return skipped checks explicitly"],
    },
    authority_boundary: {
      source_of_truth: false,
      derived_read_model: true,
      read_only_context_compilation: true,
      advisory_only: true,
      can_write_db: false,
      can_record_proof: false,
      can_create_evidence: false,
      can_update_work: false,
      can_mutate_memory: false,
      can_promote_memory: false,
      can_apply_project_perspective: false,
      can_create_promotion_decision: false,
      can_create_formation_receipt: false,
      can_call_provider_openai: false,
      can_call_github: false,
      can_execute_codex: false,
      can_execute_runner: false,
      can_create_branch_or_pr: false,
      can_send_handoff: false,
      can_create_graph_or_vector_store: false,
      can_create_rag_stack: false,
      can_crawl_or_observe_browser: false,
      can_launch_autonomous_action: false,
      can_merge_publish_retry_replay_deploy: false,
      notes: ["smoke rationale is read-only"],
    },
    source_status: {
      continuity_relay: "supplied",
      current_perspective: "supplied",
      delta_projection: "missing",
      guide_brief: "supplied",
      handoff_preview_source: "fixture",
      handoff_capsule: "supplied",
      codex_launch_card: "supplied",
    },
    fallback_reason: {
      continuity_relay: null,
      current_perspective: null,
      delta_projection: null,
      guide_brief: null,
      handoff_preview: [],
    },
    notes: ["smoke rationale"],
  };
}

function adjustmentPreview(options = {}) {
  const allCandidates = [
    ...(options.preserveCandidates ?? []),
    ...(options.warningCandidates ?? []),
    ...(options.contextDietCandidates ?? []),
    ...(options.stopCandidates ?? []),
    ...(options.nextFocusCandidates ?? []),
    ...(options.mismatchCandidates ?? []),
  ];
  return {
    preview_version: "metric_informed_continuity_relay_adjustment_preview.v0.1",
    scope: "project:augnes",
    as_of: "2026-07-04T09:30:00.000Z",
    source_refs: ["metric-informed-relay-adjustment:smoke"],
    candidate_status: options.candidateStatus ?? "insufficient_data",
    input_summary: {
      continuity_relay_ref: "workplane_continuity_relay.v0.1",
      continuity_relay_source_status: "supplied",
      perspective_next_work_preview_ref:
        "perspective_next_work_candidate_update_preview.v0.1",
      perspective_next_work_candidate_status: "candidate_update_available",
      preserve_candidate_count: (options.preserveCandidates ?? []).length,
      warn_candidate_count: (options.warningCandidates ?? []).length,
      drop_or_deprioritize_candidate_count:
        (options.contextDietCandidates ?? []).length,
      verification_candidate_count: (options.stopCandidates ?? []).length,
      next_focus_candidate_count: (options.nextFocusCandidates ?? []).length,
      unknown_candidate_count: allCandidates.filter(
        (candidate) => candidate.source_bucket === "unknown",
      ).length,
      missing_evidence_count: 0,
    },
    proposed_relay_preserve_adjustments: {
      reinforce_existing_preserve_anchors: [],
      add_preserve_anchor_candidates: options.preserveCandidates ?? [],
      preserve_with_review_only: options.preserveCandidates ?? [],
    },
    proposed_relay_warning_adjustments: {
      add_warn_anchor_candidates: options.warningCandidates ?? [],
      strengthen_warn_anchor_candidates: [],
      stale_context_warning_candidates: (options.warningCandidates ?? []).filter(
        (candidate) => ["stale", "missing"].includes(candidate.source_bucket),
      ),
      noisy_context_warning_candidates: (options.warningCandidates ?? []).filter(
        (candidate) => candidate.source_bucket === "noisy",
      ),
      misleading_context_warning_candidates: (
        options.warningCandidates ?? []
      ).filter((candidate) => candidate.source_bucket === "misleading"),
      unknown_context_warning_candidates: (options.warningCandidates ?? []).filter(
        (candidate) => candidate.source_bucket === "unknown",
      ),
    },
    proposed_stop_if_missing_adjustments: {
      add_stop_if_missing_candidates: options.stopCandidates ?? [],
      verification_required_before_handoff: (options.stopCandidates ?? []).filter(
        (candidate) =>
          candidate.source_bucket === "skipped_or_unverified_check",
      ),
      missing_source_or_evidence_blockers: [],
    },
    proposed_next_focus_adjustments: {
      next_focus_candidates: options.nextFocusCandidates ?? [],
      next_relay_update_suggestions: [],
      next_handoff_adjustments: options.mismatchCandidates ?? [],
    },
    proposed_context_diet_adjustments: {
      refs_to_drop_or_deprioritize: options.contextDietCandidates ?? [],
      refs_to_exclude_from_next_handoff: (options.contextDietCandidates ?? []).filter(
        (candidate) => ["noisy", "misleading"].includes(candidate.source_bucket),
      ),
      refs_to_keep_unknown: allCandidates.filter(
        (candidate) => candidate.source_bucket === "unknown",
      ),
      stale_or_gap_warnings: (options.warningCandidates ?? []).filter(
        (candidate) => ["stale", "missing"].includes(candidate.source_bucket),
      ),
    },
    evidence_summary: {
      has_continuity_relay: true,
      has_perspective_next_work_preview: true,
      has_preserve_signal: (options.preserveCandidates ?? []).length > 0,
      has_warning_signal: (options.warningCandidates ?? []).length > 0,
      has_stop_if_missing_signal: (options.stopCandidates ?? []).length > 0,
      has_next_focus_signal: (options.nextFocusCandidates ?? []).length > 0,
      has_problem_signal:
        (options.warningCandidates ?? []).length +
          (options.contextDietCandidates ?? []).length >
        0,
      has_unknown_signal:
        allCandidates.filter((candidate) => candidate.source_bucket === "unknown")
          .length > 0,
      has_insufficient_data: (options.insufficientDataReasons ?? []).length > 0,
      evidence_refs: allCandidates.flatMap((candidate) => candidate.evidence_refs),
      missing_evidence: options.missingEvidence ?? [],
    },
    operator_review_checklist: ["review relay adjustment candidates"],
    blocked_reasons: options.insufficientDataReasons ?? [],
    insufficient_data_reasons: options.insufficientDataReasons ?? [],
    write_readiness: {
      ready_for_continuity_relay_write: false,
      ready_for_cwp_update_write: false,
      ready_for_handoff_context_update_write: false,
      required_followup: ["operator review"],
      refusal_reasons: ["candidate preview only"],
    },
    non_goals: ["no handoff context write"],
    authority_boundary: {
      read_only: true,
      candidate_material_only: true,
      source_of_truth: false,
      derived_read_model: true,
      can_write_db: false,
      can_write_continuity_relay: false,
      can_update_current_working_perspective: false,
      can_write_handoff_context: false,
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
      can_send_handoff: false,
      can_create_pr: false,
      can_merge_pr: false,
      can_run_autonomous_action: false,
      can_create_graph_or_vector_store: false,
      can_create_rag_stack: false,
      can_crawl_or_observe_browser: false,
      notes: ["smoke relay adjustment preview"],
    },
  };
}

function relayCandidate(candidateId, refId, bucket, options = {}) {
  return {
    candidate_id: candidateId,
    ref_id: refId,
    label: refId,
    summary: `${bucket} relay adjustment candidate ${refId}`,
    source_bucket: bucket,
    adjustment_kind: options.adjustmentKind ?? "warn_anchor",
    source_refs: [refId, ...(options.sourceRefs ?? [])],
    evidence_refs: options.evidenceRefs ?? [],
    source_record_refs: options.sourceRecordRefs ?? ["record-alpha"],
    existing_relay_anchor_ids: options.existingRelayAnchorIds ?? [],
    strength: options.strength ?? "moderate",
    candidate_only: true,
    review_note: "smoke candidate remains review-only",
  };
}

function assertWriteReadiness(readiness) {
  assert.equal(readiness.ready_for_handoff_context_write, false);
  assert.equal(readiness.ready_for_handoff_send, false);
  assert.equal(readiness.ready_for_selected_ref_update_write, false);
  assert(
    readiness.refusal_reasons.includes(
      "handoff_context_write_not_in_scope_for_v0_1",
    ),
  );
}

function assertAuthorityBoundary(boundary) {
  assert.equal(boundary.read_only, true);
  assert.equal(boundary.candidate_material_only, true);
  assert.equal(boundary.source_of_truth, false);
  assert.equal(boundary.derived_read_model, true);
  assert.equal(boundary.can_write_db, false);
  assert.equal(boundary.can_write_handoff_context, false);
  assert.equal(boundary.can_send_handoff, false);
  assert.equal(boundary.can_write_selected_refs, false);
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
    "can_write_db: true",
    "can_write_handoff_context: true",
    "can_send_handoff: true",
    "can_write_selected_refs: true",
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
  ]) {
    assert(
      !text.includes(forbidden),
      `${label} must not include forbidden expansion ${forbidden}`,
    );
  }
}
