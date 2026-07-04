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
  "types/metric-informed-continuity-relay-adjustment-preview.ts";
const helperFile =
  "lib/workplane/metric-informed-continuity-relay-adjustment-preview.ts";
const panelFile =
  "components/workplane/metric-informed-continuity-relay-adjustment-preview-panel.tsx";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const smokeFile =
  "scripts/smoke-metric-informed-continuity-relay-adjustment-preview-v0-1.mjs";
const packageJsonFile = "package.json";
const perspectiveTypeFile =
  "types/perspective-next-work-candidate-update-preview.ts";
const perspectiveHelperFile =
  "lib/perspective/perspective-next-work-candidate-update-preview.ts";
const continuityRelayTypeFile = "types/workplane-continuity-relay.ts";
const continuityRelayHelperFile = "lib/workplane/workplane-continuity-relay.ts";
const agentWorkplaneSmokeFile = "scripts/smoke-agent-workplane-panels-v0-1.mjs";
const perspectiveSmokeFile =
  "scripts/smoke-perspective-next-work-candidate-update-preview-v0-1.mjs";
const dogfoodMetricSmokeFile =
  "scripts/smoke-dogfood-metric-candidate-preview-v0-1.mjs";
const workplaneContinuitySmokeFile =
  "scripts/smoke-workplane-continuity-relay-v0-1.mjs";
const handoffContextSmokeFile =
  "scripts/smoke-handoff-context-relay-rationale-v0-1.mjs";
const ledgerSmokeFile =
  "scripts/smoke-handoff-reuse-outcome-ledger-write-v0-1.mjs";

const allowedChangedFiles = [
  typeFile,
  helperFile,
  panelFile,
  agentWorkplaneFile,
  smokeFile,
  packageJsonFile,
  agentWorkplaneSmokeFile,
  perspectiveSmokeFile,
  dogfoodMetricSmokeFile,
  workplaneContinuitySmokeFile,
  handoffContextSmokeFile,
  ledgerSmokeFile,
];

const textByFile = loadTextByFile([
  ...allowedChangedFiles,
  perspectiveTypeFile,
  perspectiveHelperFile,
  continuityRelayTypeFile,
  continuityRelayHelperFile,
]);
const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const panelText = textByFile.get(panelFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageScript({
  packageJsonText,
  scriptName:
    "smoke:metric-informed-continuity-relay-adjustment-preview-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-metric-informed-continuity-relay-adjustment-preview-v0-1.mjs",
});

assertContainsAll(
  typeText,
  [
    "metric_informed_continuity_relay_adjustment_preview.v0.1",
    "proposed_relay_preserve_adjustments",
    "proposed_relay_warning_adjustments",
    "proposed_stop_if_missing_adjustments",
    "proposed_next_focus_adjustments",
    "proposed_context_diet_adjustments",
    "refs_to_keep_unknown",
    "ready_for_continuity_relay_write: false",
    "ready_for_cwp_update_write: false",
    "ready_for_handoff_context_update_write: false",
    "can_write_continuity_relay: false",
    "can_update_current_working_perspective: false",
    "can_write_handoff_context: false",
    "can_write_perspective_unit: false",
    "can_write_next_work_bias: false",
    "can_write_memory: false",
    "can_write_dogfood_metrics: false",
    "can_write_dogfood_ledger: false",
  ],
  { label: typeFile },
);

assertContainsAll(
  helperText,
  [
    "buildMetricInformedContinuityRelayAdjustmentPreviewV01",
    "createMetricInformedContinuityRelayAdjustmentAuthorityBoundaryV01",
    "workplane_continuity_relay_missing",
    "perspective_next_work_candidate_update_preview_missing",
    "perspective_next_work_candidate_update_preview_insufficient_data",
    "Unknown refs stay unknown and must not become preserve anchors",
    "continuity_relay_write_not_in_scope_for_v0_1",
    "current_working_perspective_update_not_in_scope_for_v0_1",
    "handoff_context_update_not_in_scope_for_v0_1",
    "can_write_continuity_relay: false",
    "can_update_current_working_perspective: false",
    "can_write_handoff_context: false",
    "can_write_dogfood_metrics: false",
    "can_write_dogfood_ledger: false",
  ],
  { label: helperFile },
);

assertContainsAll(
  panelText,
  [
    "MetricInformedContinuityRelayAdjustmentPreviewPanel",
    "Relay adjustment candidates",
    "ready_for_continuity_relay_write",
    "ready_for_cwp_update_write",
    "ready_for_handoff_context_update_write",
    "can_write_continuity_relay",
    "can_update_current_working_perspective",
    "can_write_handoff_context",
    "context diet",
  ],
  { label: panelFile },
);
assert(!panelText.includes("<button"), "adjustment preview panel must not add buttons");
assert(!panelText.includes(">Apply<"), "adjustment preview panel must not add apply UI");

assertContainsAll(
  agentWorkplaneText,
  [
    "MetricInformedContinuityRelayAdjustmentPreviewPanel",
    "buildMetricInformedContinuityRelayAdjustmentPreviewV01",
    "continuity_relay: context.continuity_relay",
    "perspective_next_work_candidate_update_preview:",
    "workbench:default_metric_informed_continuity_relay_adjustment_preview",
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
  "../lib/workplane/metric-informed-continuity-relay-adjustment-preview.ts"
);

const relay = continuityRelay();
const perspective = perspectivePreview({
  candidateStatus: "candidate_update_available",
  reinforceCandidates: [
    candidate("reinforce:shared", "context-ref:shared", "helpful", {
      evidenceRefs: ["evidence-ref:shared"],
      sourceRecordRefs: ["record-alpha"],
      strength: "moderate",
    }),
    candidate("reinforce:new", "context-ref:new-helpful", "helpful", {
      evidenceRefs: ["evidence-ref:new-helpful"],
      sourceRecordRefs: ["record-alpha"],
      strength: "weak",
    }),
  ],
});
const relayBefore = JSON.stringify(relay);
const preservePreview =
  previewModule.buildMetricInformedContinuityRelayAdjustmentPreviewV01({
    continuity_relay: relay,
    perspective_next_work_candidate_update_preview: perspective,
    as_of: "2026-07-04T09:00:00.000Z",
  });
assert.equal(JSON.stringify(relay), relayBefore, "builder must not mutate relay input");
assert.equal(preservePreview.candidate_status, "adjustment_candidates_available");
assert.equal(
  preservePreview.proposed_relay_preserve_adjustments
    .reinforce_existing_preserve_anchors.length,
  1,
);
assert.equal(
  preservePreview.proposed_relay_preserve_adjustments
    .add_preserve_anchor_candidates.length,
  1,
);
assert.equal(
  preservePreview.proposed_relay_preserve_adjustments
    .reinforce_existing_preserve_anchors[0].existing_relay_anchor_ids[0],
  "preserve.shared",
);
assertAuthorityBoundary(preservePreview.authority_boundary);
assertWriteReadiness(preservePreview.write_readiness);

const missingRelayPreview =
  previewModule.buildMetricInformedContinuityRelayAdjustmentPreviewV01({
    continuity_relay: null,
    perspective_next_work_candidate_update_preview: perspective,
    as_of: "2026-07-04T09:01:00.000Z",
  });
assert.equal(missingRelayPreview.candidate_status, "insufficient_data");
assert(
  missingRelayPreview.evidence_summary.missing_evidence.includes(
    "workplane_continuity_relay_missing",
  ),
);
assertWriteReadiness(missingRelayPreview.write_readiness);
assert.equal(
  missingRelayPreview.proposed_relay_preserve_adjustments
    .reinforce_existing_preserve_anchors.length,
  0,
  "missing relay must not emit existing-anchor reinforcement",
);

const missingPerspectivePreview =
  previewModule.buildMetricInformedContinuityRelayAdjustmentPreviewV01({
    continuity_relay: relay,
    perspective_next_work_candidate_update_preview: null,
    as_of: "2026-07-04T09:02:00.000Z",
  });
assert.equal(missingPerspectivePreview.candidate_status, "insufficient_data");
assert(
  missingPerspectivePreview.evidence_summary.missing_evidence.includes(
    "perspective_next_work_candidate_update_preview_missing",
  ),
);
assertWriteReadiness(missingPerspectivePreview.write_readiness);

const defaultWorkbenchPreview =
  previewModule.buildMetricInformedContinuityRelayAdjustmentPreviewV01({
    continuity_relay: relay,
    perspective_next_work_candidate_update_preview: perspectivePreview({
      candidateStatus: "insufficient_data",
      insufficientDataReasons: ["approved_reuse_ledger_records_missing"],
    }),
    source_refs: [
      "workbench:default_metric_informed_continuity_relay_adjustment_preview",
    ],
  });
assert.equal(defaultWorkbenchPreview.candidate_status, "insufficient_data");
assert(
  defaultWorkbenchPreview.insufficient_data_reasons.includes(
    "approved_reuse_ledger_records_missing",
  ),
);
assertWriteReadiness(defaultWorkbenchPreview.write_readiness);

const problemPerspective = perspectivePreview({
  candidateStatus: "needs_operator_review",
  warnCandidates: [
    candidate("warn:stale", "context-ref:stale-repeat", "stale", {
      evidenceRefs: ["evidence-ref:stale"],
      sourceRecordRefs: ["record-alpha"],
      strength: "strong",
    }),
    candidate("warn:missing", "context-ref:missing-gap", "missing", {
      evidenceRefs: ["evidence-ref:missing"],
      sourceRecordRefs: ["record-alpha"],
      strength: "moderate",
    }),
    candidate("warn:misleading", "context-ref:misleading-repeat", "misleading", {
      evidenceRefs: ["evidence-ref:misleading"],
      sourceRecordRefs: ["record-alpha"],
      strength: "strong",
    }),
  ],
  preserveNextTime: [
    candidate("preserve:unknown", "context-ref:unknown-alpha", "unknown", {
      evidenceRefs: ["evidence-ref:unknown"],
      sourceRecordRefs: ["record-alpha"],
      strength: "insufficient_data",
    }),
  ],
  dropCandidates: [
    candidate("drop:noisy", "context-ref:noisy-alpha", "noisy", {
      evidenceRefs: ["evidence-ref:noisy"],
      sourceRecordRefs: ["record-alpha"],
      strength: "moderate",
    }),
  ],
  insufficientCandidates: [
    candidate("unknown:alpha", "context-ref:unknown-alpha", "unknown", {
      evidenceRefs: ["evidence-ref:unknown"],
      sourceRecordRefs: ["record-alpha"],
      strength: "insufficient_data",
    }),
  ],
  unresolvedGapCandidates: [
    candidate("gap:missing", "context-ref:missing-gap", "missing", {
      evidenceRefs: ["evidence-ref:missing"],
      sourceRecordRefs: ["record-alpha"],
      strength: "moderate",
    }),
  ],
  verificationCandidates: [
    candidate(
      "verify:browser",
      "browser validation was not run",
      "skipped_or_unverified_check",
      {
        evidenceRefs: ["evidence-ref:skipped"],
        sourceRecordRefs: ["record-alpha"],
        strength: "moderate",
      },
    ),
  ],
  nextFocusCandidates: ["operator-reviewed relay write remains follow-up"],
  nextRelayUpdateSuggestions: [
    "Carry forward mismatch review before updating relay anchors.",
  ],
  nextHandoffAdjustments: [
    "Warn that expected browser proof was skipped before handoff.",
  ],
  missingEvidence: ["missing_approved_ledger_record:record-beta"],
});
const problemPreview =
  previewModule.buildMetricInformedContinuityRelayAdjustmentPreviewV01({
    continuity_relay: relay,
    perspective_next_work_candidate_update_preview: problemPerspective,
  });
assert.equal(problemPreview.candidate_status, "needs_operator_review");
assert.equal(
  problemPreview.proposed_relay_preserve_adjustments
    .add_preserve_anchor_candidates.length,
  0,
  "unknown refs must never become preserve adjustments",
);
assert(
  problemPreview.proposed_context_diet_adjustments.refs_to_keep_unknown.some(
    (item) => item.ref_id === "context-ref:unknown-alpha",
  ),
);
assert(
  problemPreview.proposed_relay_warning_adjustments
    .stale_context_warning_candidates.some(
      (item) => item.ref_id === "context-ref:stale-repeat",
    ),
);
assert(
  problemPreview.proposed_relay_warning_adjustments
    .noisy_context_warning_candidates.some(
      (item) => item.ref_id === "context-ref:noisy-alpha",
    ),
);
assert(
  problemPreview.proposed_relay_warning_adjustments
    .misleading_context_warning_candidates.some(
      (item) => item.ref_id === "context-ref:misleading-repeat",
    ),
);
assert(
  problemPreview.proposed_stop_if_missing_adjustments
    .verification_required_before_handoff.some(
      (item) => item.source_bucket === "skipped_or_unverified_check",
    ),
);
assert(
  problemPreview.proposed_stop_if_missing_adjustments
    .add_stop_if_missing_candidates.some(
      (item) => item.ref_id === "operator-reviewed relay write remains follow-up",
    ),
);
assert(
  problemPreview.proposed_next_focus_adjustments.next_focus_candidates.some(
    (item) => item.ref_id === "operator-reviewed relay write remains follow-up",
  ),
);
assert(
  problemPreview.proposed_next_focus_adjustments
    .next_relay_update_suggestions.some((item) =>
      item.ref_id.includes("mismatch review"),
    ),
);
assert(
  problemPreview.proposed_next_focus_adjustments.next_handoff_adjustments.some(
    (item) => item.ref_id.includes("expected browser proof was skipped"),
  ),
);
assert(
  problemPreview.proposed_stop_if_missing_adjustments
    .missing_source_or_evidence_blockers.some((item) =>
      item.ref_id.includes("missing_approved_ledger_record"),
    ),
);
assertWriteReadiness(problemPreview.write_readiness);
assertAuthorityBoundary(problemPreview.authority_boundary);

const changedFilesBoundary = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "metric-informed continuity relay adjustment preview v0.1",
});
const untrackedFiles = collectUntrackedFiles();
const unexpectedUntracked = untrackedFiles.filter(
  (file) => !allowedChangedFiles.includes(file),
);
assert.deepEqual(
  unexpectedUntracked,
  [],
  `Unexpected untracked files for metric-informed continuity relay adjustment preview v0.1: ${unexpectedUntracked.join(
    ", ",
  )}`,
);
for (const file of changedFilesBoundary.files) {
  assert(!/^app\/.*route\.(ts|tsx|js|jsx)$/.test(file), "no new route file is allowed");
}

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke:
        "metric-informed-continuity-relay-adjustment-preview-v0-1",
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_mode: changedFilesBoundary.mode,
      changed_files: uniqueSorted(changedFilesBoundary.files),
      untracked_files: untrackedFiles,
      assertions: {
        missing_continuity_relay_insufficient_data: true,
        missing_perspective_preview_insufficient_data: true,
        default_workbench_insufficient_data: true,
        helpful_preserve_mapping_review_only: true,
        unknown_refs_not_preserved: true,
        stale_missing_noisy_misleading_visible: true,
        skipped_checks_require_verification: true,
        not_done_next_focus_or_stop: true,
        mismatch_adjustments_visible: true,
        relay_input_not_mutated: true,
        authority_boundary_false_writes: true,
        no_new_post_route: true,
      },
    },
    null,
    2,
  ),
);

function continuityRelay() {
  return {
    runtime: "augnes",
    relay_version: "workplane_continuity_relay.v0.1",
    scope: "project:augnes",
    as_of: "2026-07-04T08:00:00.000Z",
    source_refs: {
      current_working_perspective_ref: "current_working_perspective:test",
      guide_brief_ref: "guide_brief:test",
      delta_projection_ref: null,
      workplane_ref: "/workbench",
      perspective_snapshot_refs: [],
      delta_ids: [],
      batch_ids: [],
      evidence_refs: ["relay-evidence:shared"],
      artifact_refs: [],
      handoff_refs: [],
      diagnostic_refs: [],
      route_refs: ["/workbench"],
      source_refs: ["context-ref:shared", "context-ref:stale-repeat"],
    },
    preserve_anchors: [
      {
        anchor_id: "preserve.shared",
        kind: "active_goal",
        label: "Shared helpful context",
        summary: "Keep the shared context visible.",
        source: "current_working_perspective",
        source_refs: ["context-ref:shared", "evidence-ref:shared"],
        severity: "info",
        blocks_handoff: false,
        notes: [],
      },
    ],
    warn_anchors: [
      {
        anchor_id: "warn.stale-repeat",
        kind: "staleness",
        label: "Stale repeat",
        summary: "Repeated stale context should warn.",
        source: "workplane_context",
        source_refs: ["context-ref:stale-repeat"],
        severity: "medium",
        blocks_handoff: false,
        notes: [],
      },
    ],
    stop_if_missing: [],
    next_focus: [],
    stale_or_gap_warnings: [],
    non_goals: ["no durable relay write"],
    source_status: {
      current_perspective: "supplied",
      delta_projection: "missing",
      guide_brief: "supplied",
      runner_delta_batch: "missing",
    },
    fallback_reason: {
      current_perspective: null,
      delta_projection: null,
      guide_brief: null,
      runner_delta_batch: null,
    },
    authority_boundary: {
      source_of_truth: false,
      derived_read_model: true,
      read_only_operator_view: true,
      candidate_material_only: true,
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
      can_crawl_or_observe_browser: false,
      can_merge_publish_retry_replay_deploy: false,
      notes: ["smoke relay is read-only"],
    },
    notes: ["smoke relay"],
  };
}

function perspectivePreview(options = {}) {
  const allCandidates = [
    ...(options.reinforceCandidates ?? []),
    ...(options.warnCandidates ?? []),
    ...(options.dropCandidates ?? []),
    ...(options.insufficientCandidates ?? []),
    ...(options.preserveNextTime ?? []),
    ...(options.unresolvedGapCandidates ?? []),
    ...(options.verificationCandidates ?? []),
  ];
  const countByBucket = (bucket) =>
    allCandidates.filter((item) => item.source_bucket === bucket).length;
  return {
    preview_version: "perspective_next_work_candidate_update_preview.v0.1",
    scope: "project:augnes",
    as_of: "2026-07-04T08:30:00.000Z",
    source_refs: [
      "perspective-next-work:smoke",
      ...(options.sourceRefs ?? []),
    ],
    candidate_status: options.candidateStatus ?? "insufficient_data",
    summary: "smoke perspective next-work preview",
    input_summary: {
      metric_preview_ref: "dogfood_metric_candidate_preview:smoke",
      metric_preview_version: "dogfood_metric_candidate_preview.v0.1",
      metric_candidate_status: "candidate_signal",
      ledger_record_count: 1,
      source_record_refs: ["record-alpha"],
      helpful_ref_count: countByBucket("helpful"),
      stale_ref_count: countByBucket("stale"),
      missing_ref_count: countByBucket("missing"),
      noisy_ref_count: countByBucket("noisy"),
      misleading_ref_count: countByBucket("misleading"),
      unknown_ref_count: countByBucket("unknown"),
      skipped_or_unverified_check_count: countByBucket(
        "skipped_or_unverified_check",
      ),
      not_done_item_count: (options.nextFocusCandidates ?? []).length,
      mismatch_count: (options.nextRelayUpdateSuggestions ?? []).length,
    },
    proposed_perspective_unit_updates: {
      reinforce_candidates: options.reinforceCandidates ?? [],
      weaken_candidates: [],
      warn_candidates: options.warnCandidates ?? [],
      retire_or_deprioritize_candidates: options.dropCandidates ?? [],
      split_or_review_candidates: [],
      insufficient_data_candidates: options.insufficientCandidates ?? [],
    },
    proposed_next_work_bias_updates: {
      refs_to_preserve_next_time: options.preserveNextTime ?? [],
      refs_to_warn_next_time: options.warnNextTime ?? [],
      refs_to_drop_or_deprioritize: options.dropCandidates ?? [],
      next_handoff_adjustments: options.nextHandoffAdjustments ?? [],
      next_relay_update_suggestions:
        options.nextRelayUpdateSuggestions ?? [],
      next_focus_candidates: options.nextFocusCandidates ?? [],
    },
    proposed_carry_forward_memory_candidates: {
      reusable_context_candidates: options.reusableCandidates ?? [],
      stale_context_warnings: options.staleContextWarnings ?? [],
      unresolved_gap_candidates: options.unresolvedGapCandidates ?? [],
      verification_bias_candidates: options.verificationCandidates ?? [],
      non_goal_reminders: ["candidate material only; no relay write"],
    },
    evidence_summary: {
      has_metric_candidate_preview: true,
      has_approved_ledger_records: true,
      has_helpful_signal: countByBucket("helpful") > 0,
      has_problem_signal:
        countByBucket("stale") +
          countByBucket("missing") +
          countByBucket("noisy") +
          countByBucket("misleading") >
        0,
      has_unknown_signal: countByBucket("unknown") > 0,
      has_skipped_or_unverified_checks:
        countByBucket("skipped_or_unverified_check") > 0,
      has_not_done_items: (options.nextFocusCandidates ?? []).length > 0,
      has_expected_observed_mismatches:
        (options.nextRelayUpdateSuggestions ?? []).length > 0,
      has_insufficient_data:
        (options.insufficientDataReasons ?? []).length > 0 ||
        (options.missingEvidence ?? []).length > 0,
      evidence_refs: [
        "evidence-ref:perspective-smoke",
        ...allCandidates.flatMap((item) => item.evidence_refs),
      ],
      missing_evidence: options.missingEvidence ?? [],
    },
    review_required: true,
    operator_review_checklist: ["review candidate material"],
    blocked_reasons: options.insufficientDataReasons ?? [],
    insufficient_data_reasons: options.insufficientDataReasons ?? [],
    write_readiness: {
      ready_for_perspective_update_write: false,
      ready_for_next_work_bias_write: false,
      required_followup: ["operator review"],
      refusal_reasons: ["candidate preview only"],
    },
    non_goals: ["no PerspectiveUnit or NextWorkBias write"],
    authority_boundary: {
      read_only: true,
      candidate_material_only: true,
      source_of_truth: false,
      derived_read_model: true,
      can_write_db: false,
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
      notes: ["smoke perspective preview"],
    },
  };
}

function candidate(candidateId, refId, bucket, options = {}) {
  return {
    candidate_id: candidateId,
    ref_id: refId,
    label: refId,
    summary: `${bucket} smoke candidate ${refId}`,
    source_bucket: bucket,
    evidence_refs: options.evidenceRefs ?? [],
    source_record_refs: options.sourceRecordRefs ?? ["record-alpha"],
    strength: options.strength ?? "moderate",
    candidate_only: true,
    review_note: "smoke candidate remains review-only",
  };
}

function assertWriteReadiness(readiness) {
  assert.equal(readiness.ready_for_continuity_relay_write, false);
  assert.equal(readiness.ready_for_cwp_update_write, false);
  assert.equal(readiness.ready_for_handoff_context_update_write, false);
  assert(
    readiness.refusal_reasons.includes(
      "continuity_relay_write_not_in_scope_for_v0_1",
    ),
  );
}

function assertAuthorityBoundary(boundary) {
  assert.equal(boundary.read_only, true);
  assert.equal(boundary.candidate_material_only, true);
  assert.equal(boundary.source_of_truth, false);
  assert.equal(boundary.derived_read_model, true);
  assert.equal(boundary.can_write_db, false);
  assert.equal(boundary.can_write_continuity_relay, false);
  assert.equal(boundary.can_update_current_working_perspective, false);
  assert.equal(boundary.can_write_handoff_context, false);
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
  assert.equal(boundary.can_send_handoff, false);
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
    "can_write_continuity_relay: true",
    "can_update_current_working_perspective: true",
    "can_write_handoff_context: true",
    "can_write_perspective_unit: true",
    "can_write_next_work_bias: true",
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
    "can_send_handoff: true",
    "can_run_autonomous_action: true",
    "writePerspectiveUnit",
    "writeNextWorkBias",
    "updateNextWorkBias",
    "writeContinuityRelay",
    "applyPerspective(",
    "writeDogfoodMetric",
    "writeHandoffReuseOutcomeLedgerRecordV01",
    "export async function POST",
    "fetch(",
  ]) {
    assert(
      !text.includes(forbidden),
      `${label} must not include forbidden expansion ${forbidden}`,
    );
  }
}
