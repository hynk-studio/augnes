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

const typeFile = "types/perspective-next-work-candidate-update-preview.ts";
const helperFile =
  "lib/perspective/perspective-next-work-candidate-update-preview.ts";
const panelFile =
  "components/perspective-next-work-candidate-update-preview-panel.tsx";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const agentWorkplaneSmokeFile = "scripts/smoke-agent-workplane-panels-v0-1.mjs";
const smokeFile =
  "scripts/smoke-perspective-next-work-candidate-update-preview-v0-1.mjs";
const packageJsonFile = "package.json";
const dogfoodMetricTypeFile = "types/dogfood-metric-candidate-preview.ts";
const dogfoodMetricHelperFile =
  "lib/dogfooding/dogfood-metric-candidate-preview.ts";
const dogfoodMetricSmokeFile =
  "scripts/smoke-dogfood-metric-candidate-preview-v0-1.mjs";
const ledgerTypeFile = "types/handoff-reuse-outcome-ledger.ts";
const ledgerSmokeFile =
  "scripts/smoke-handoff-reuse-outcome-ledger-write-v0-1.mjs";
const handoffContextSmokeFile =
  "scripts/smoke-handoff-context-relay-rationale-v0-1.mjs";
const workplaneContinuitySmokeFile =
  "scripts/smoke-workplane-continuity-relay-v0-1.mjs";
const decisionSmokeFile =
  "scripts/smoke-dogfood-reuse-operator-decision-preview-v0-1.mjs";
const proposalSmokeFile =
  "scripts/smoke-dogfood-reuse-record-proposal-v0-1.mjs";
const feedbackSmokeFile = "scripts/smoke-codex-result-feedback-draft-v0-1.mjs";
const metricInformedContinuityRelayAdjustmentTypeFile =
  "types/metric-informed-continuity-relay-adjustment-preview.ts";
const metricInformedContinuityRelayAdjustmentHelperFile =
  "lib/workplane/metric-informed-continuity-relay-adjustment-preview.ts";
const metricInformedContinuityRelayAdjustmentPanelFile =
  "components/workplane/metric-informed-continuity-relay-adjustment-preview-panel.tsx";
const metricInformedContinuityRelayAdjustmentSmokeFile =
  "scripts/smoke-metric-informed-continuity-relay-adjustment-preview-v0-1.mjs";

const allowedChangedFiles = [
  typeFile,
  helperFile,
  panelFile,
  agentWorkplaneFile,
  agentWorkplaneSmokeFile,
  smokeFile,
  packageJsonFile,
  dogfoodMetricSmokeFile,
  ledgerSmokeFile,
  handoffContextSmokeFile,
  workplaneContinuitySmokeFile,
  decisionSmokeFile,
  proposalSmokeFile,
  feedbackSmokeFile,
  metricInformedContinuityRelayAdjustmentTypeFile,
  metricInformedContinuityRelayAdjustmentHelperFile,
  metricInformedContinuityRelayAdjustmentPanelFile,
  metricInformedContinuityRelayAdjustmentSmokeFile,
];

const textByFile = loadTextByFile([
  ...allowedChangedFiles,
  dogfoodMetricTypeFile,
  dogfoodMetricHelperFile,
  ledgerTypeFile,
]);
const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const panelText = textByFile.get(panelFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:perspective-next-work-candidate-update-preview-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-perspective-next-work-candidate-update-preview-v0-1.mjs",
});

assertContainsAll(
  typeText,
  [
    "perspective_next_work_candidate_update_preview.v0.1",
    "proposed_perspective_unit_updates",
    "proposed_next_work_bias_updates",
    "proposed_carry_forward_memory_candidates",
    "ready_for_perspective_update_write: false",
    "ready_for_next_work_bias_write: false",
    "can_write_perspective_unit: false",
    "can_write_next_work_bias: false",
    "can_write_memory: false",
    "can_write_dogfood_metrics: false",
    "can_write_dogfood_ledger: false",
    "can_apply_project_perspective: false",
    "can_create_formation_receipt: false",
  ],
  { label: typeFile },
);

assertContainsAll(
  helperText,
  [
    "buildPerspectiveNextWorkCandidateUpdatePreviewV01",
    "createPerspectiveNextWorkAuthorityBoundaryV01",
    "dogfood_metric_candidate_preview_missing",
    "approved_reuse_ledger_records_missing",
    "approved_ledger_record_refs_missing",
    "approved_ledger_record_details_missing",
    "missing_approved_ledger_record",
    "unknown refs remain unknown",
    "no_perspective_unit_write",
    "no_next_work_bias_write",
    "can_write_db: false",
    "can_write_perspective_unit: false",
    "can_write_next_work_bias: false",
    "can_write_dogfood_metrics: false",
  ],
  { label: helperFile },
);

assertContainsAll(
  panelText,
  [
    "PerspectiveNextWorkCandidateUpdatePreviewPanel",
    "Next-work update candidates",
    "ready_for_perspective_update_write",
    "ready_for_next_work_bias_write",
    "can_write_perspective_unit",
    "can_write_next_work_bias",
    "can_write_dogfood_metrics",
  ],
  { label: panelFile },
);

assertContainsAll(
  agentWorkplaneText,
  [
    "PerspectiveNextWorkCandidateUpdatePreviewPanel",
    "buildPerspectiveNextWorkCandidateUpdatePreviewV01",
    "metric_preview: dogfoodMetricCandidatePreview",
    "ledger_records: []",
    "workbench:default_empty_perspective_next_work_candidate_update_preview",
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
assert(!helperText.includes("export async function POST"), "helper must not add POST");
for (const [label, text] of [
  [helperFile, helperText],
  [panelFile, panelText],
  [agentWorkplaneFile, agentWorkplaneText],
]) {
  assertNoForbiddenExpansion(label, text);
}

const metricModule = await import(
  "../lib/dogfooding/dogfood-metric-candidate-preview.ts"
);
const previewModule = await import(
  "../lib/perspective/perspective-next-work-candidate-update-preview.ts"
);

const emptyMetricPreview =
  metricModule.buildDogfoodMetricCandidatePreviewFromReuseLedgerRecordsV01({
    records: [],
    as_of: "2026-07-04T08:00:00.000Z",
  });
const emptyPerspectivePreview =
  previewModule.buildPerspectiveNextWorkCandidateUpdatePreviewV01({
    metric_preview: emptyMetricPreview,
    ledger_records: [],
    as_of: "2026-07-04T08:01:00.000Z",
  });
assert.equal(emptyPerspectivePreview.candidate_status, "insufficient_data");
assert.equal(
  emptyPerspectivePreview.write_readiness.ready_for_perspective_update_write,
  false,
);
assert.equal(
  emptyPerspectivePreview.write_readiness.ready_for_next_work_bias_write,
  false,
);
assert(
  emptyPerspectivePreview.insufficient_data_reasons.includes(
    "approved_reuse_ledger_records_missing",
  ),
);
assertAuthorityBoundary(emptyPerspectivePreview.authority_boundary);

const recordOne = approvedLedgerRecord("alpha", {
  helpfulRefs: [reuseRef("helpful", "shared"), reuseRef("helpful", "alpha")],
  staleRefs: [reuseRef("stale", "repeat")],
  missingRefs: [reuseRef("missing", "gap")],
  noisyRefs: [reuseRef("noisy", "alpha")],
  misleadingRefs: [reuseRef("misleading", "repeat")],
  unknownRefs: [reuseRef("unknown", "alpha")],
  skippedChecks: ["browser validation was not run"],
  notDoneItems: ["operator-reviewed NextWorkBias write remains follow-up"],
  mismatchSummary: "Missing follow-up write contract remains unresolved.",
  missingExpectationCount: 1,
  carryForward: {
    next_relay_update_suggestions: [
      "preserve explicit metric-to-perspective candidate review",
    ],
    next_handoff_adjustments: [
      "warn that metric signal is candidate-only before handoff",
    ],
    refs_to_preserve_next_time: ["context-ref:helpful-shared"],
    refs_to_warn_next_time: ["context-ref:stale-repeat"],
    refs_to_drop_or_deprioritize: ["context-ref:noisy-alpha"],
    unresolved_gaps: ["operator-reviewed update contract missing"],
    next_focus_candidate: "define operator-reviewed update contract",
  },
});
const recordTwo = approvedLedgerRecord("beta", {
  helpfulRefs: [reuseRef("helpful", "shared")],
  staleRefs: [reuseRef("stale", "repeat")],
  missingRefs: [],
  noisyRefs: [],
  misleadingRefs: [reuseRef("misleading", "repeat")],
  unknownRefs: [reuseRef("unknown", "beta")],
  skippedChecks: [],
  notDoneItems: [],
  mismatchSummary: "No expected/observed mismatch detected.",
  missingExpectationCount: 0,
  carryForward: {
    next_relay_update_suggestions: [],
    next_handoff_adjustments: [],
    refs_to_preserve_next_time: ["context-ref:helpful-shared"],
    refs_to_warn_next_time: ["context-ref:misleading-repeat"],
    refs_to_drop_or_deprioritize: ["context-ref:misleading-repeat"],
    unresolved_gaps: [],
    next_focus_candidate: "keep unknown refs out of preserve list",
  },
});
const metricPreview =
  metricModule.buildDogfoodMetricCandidatePreviewFromReuseLedgerRecordsV01({
    records: [recordOne, recordTwo],
    as_of: "2026-07-04T08:10:00.000Z",
    ledger_store_ref: "handoff_reuse_outcome_ledger_store:synthetic-smoke",
  });
assert.equal(metricPreview.aggregate_counts.approved_record_count, 2);
assert.equal(metricPreview.aggregate_counts.helpful_ref_count, 3);
assert.equal(metricPreview.aggregate_counts.stale_ref_count, 2);
assert.equal(metricPreview.aggregate_counts.missing_ref_count, 1);
assert.equal(metricPreview.aggregate_counts.noisy_ref_count, 1);
assert.equal(metricPreview.aggregate_counts.misleading_ref_count, 2);
assert.equal(metricPreview.aggregate_counts.unknown_ref_count, 2);
assert.equal(metricPreview.aggregate_counts.skipped_or_unverified_check_count, 1);
assert.equal(metricPreview.aggregate_counts.not_done_item_count, 1);
assert.equal(metricPreview.aggregate_counts.expected_observed_mismatch_count, 1);

const missingMetricPreview =
  previewModule.buildPerspectiveNextWorkCandidateUpdatePreviewV01({
    metric_preview: null,
    ledger_records: [recordOne, recordTwo],
    as_of: "2026-07-04T08:10:20.000Z",
  });
assert.equal(missingMetricPreview.candidate_status, "insufficient_data");
assert.equal(missingMetricPreview.input_summary.ledger_record_count, 0);
assert.equal(
  missingMetricPreview.proposed_perspective_unit_updates.reinforce_candidates
    .length,
  0,
);
assert(
  missingMetricPreview.evidence_summary.missing_evidence.includes(
    "dogfood_metric_candidate_preview_missing",
  ),
  "missing metric preview must not accept supplied ledger records",
);

const metricWithEmptyRecordRefs = {
  ...metricPreview,
  ledger_source: {
    ...metricPreview.ledger_source,
    record_refs: [],
  },
};
const emptyRecordRefsPreview =
  previewModule.buildPerspectiveNextWorkCandidateUpdatePreviewV01({
    metric_preview: metricWithEmptyRecordRefs,
    ledger_records: [recordOne, recordTwo],
    as_of: "2026-07-04T08:10:30.000Z",
  });
assert.equal(emptyRecordRefsPreview.candidate_status, "insufficient_data");
assert.equal(
  emptyRecordRefsPreview.proposed_perspective_unit_updates
    .reinforce_candidates.length,
  0,
);
assert(
  emptyRecordRefsPreview.evidence_summary.missing_evidence.includes(
    "approved_ledger_record_refs_missing",
  ),
  "empty metric ledger record refs must not act as wildcard",
);

const partialDetailPreview =
  previewModule.buildPerspectiveNextWorkCandidateUpdatePreviewV01({
    metric_preview: metricPreview,
    ledger_records: [recordOne],
    as_of: "2026-07-04T08:10:40.000Z",
  });
assert.notEqual(
  partialDetailPreview.candidate_status,
  "candidate_update_available",
);
assert(
  partialDetailPreview.evidence_summary.missing_evidence.includes(
    "approved_ledger_record_details_missing",
  ),
);
assert(
  partialDetailPreview.evidence_summary.missing_evidence.includes(
    `missing_approved_ledger_record:${recordTwo.record_id}`,
  ),
  "partial detail supply must mark missing referenced ledger record",
);
assert(
  partialDetailPreview.insufficient_data_reasons.includes(
    `missing_approved_ledger_record:${recordTwo.record_id}`,
  ),
);

const perspectivePreview =
  previewModule.buildPerspectiveNextWorkCandidateUpdatePreviewV01({
    metric_preview: metricPreview,
    ledger_records: [recordOne, recordTwo],
    as_of: "2026-07-04T08:11:00.000Z",
  });
assert.equal(perspectivePreview.candidate_status, "needs_operator_review");
assert.equal(perspectivePreview.input_summary.ledger_record_count, 2);
assert.equal(
  perspectivePreview.proposed_perspective_unit_updates.reinforce_candidates
    .length,
  2,
);
assert(
  perspectivePreview.proposed_perspective_unit_updates.reinforce_candidates.some(
    (candidate) => candidate.ref_id === "context-ref:helpful-shared",
  ),
  "helpful ref must become reinforce candidate",
);
assert(
  perspectivePreview.proposed_next_work_bias_updates.refs_to_preserve_next_time.some(
    (candidate) => candidate.ref_id === "context-ref:helpful-shared",
  ),
  "helpful ref must become preserve candidate",
);
assert(
  perspectivePreview.proposed_perspective_unit_updates.warn_candidates.some(
    (candidate) => candidate.source_bucket === "stale",
  ),
  "stale ref must become warn candidate",
);
assert(
  perspectivePreview.proposed_perspective_unit_updates.weaken_candidates.some(
    (candidate) =>
      candidate.ref_id === "context-ref:stale-repeat" &&
      candidate.strength === "strong",
  ),
  "repeated stale ref must be surfaced as strong weaken candidate",
);
assert(
  perspectivePreview.proposed_carry_forward_memory_candidates
    .verification_bias_candidates.some(
      (candidate) => candidate.source_bucket === "missing",
    ),
  "missing refs must produce verification candidates",
);
assert(
  perspectivePreview.proposed_next_work_bias_updates.refs_to_drop_or_deprioritize.some(
    (candidate) => candidate.source_bucket === "noisy",
  ),
  "noisy refs must produce drop or deprioritize candidates",
);
assert(
  perspectivePreview.proposed_perspective_unit_updates
    .split_or_review_candidates.some(
      (candidate) => candidate.source_bucket === "misleading",
    ),
  "misleading refs must require split or review",
);
assert(
  perspectivePreview.proposed_perspective_unit_updates
    .insufficient_data_candidates.every(
      (candidate) => candidate.source_bucket === "unknown",
    ),
  "unknown refs must remain insufficient-data candidates",
);
assert.equal(
  perspectivePreview.proposed_perspective_unit_updates.insufficient_data_candidates.some(
    (candidate) => candidate.ref_id === "context-ref:unknown-alpha",
  ),
  true,
);
assert.equal(
  perspectivePreview.proposed_perspective_unit_updates.reinforce_candidates.some(
    (candidate) => candidate.source_bucket === "unknown",
  ),
  false,
  "unknown refs must not become reinforce candidates",
);
assert(
  perspectivePreview.proposed_carry_forward_memory_candidates
    .verification_bias_candidates.some(
      (candidate) => candidate.source_bucket === "skipped_or_unverified_check",
    ),
  "skipped checks must become verification bias candidates",
);
assert(
  perspectivePreview.proposed_next_work_bias_updates.next_focus_candidates.includes(
    "operator-reviewed NextWorkBias write remains follow-up",
  ),
  "not-done item must become next-focus candidate",
);
assert(
  perspectivePreview.proposed_next_work_bias_updates.next_handoff_adjustments.some(
    (candidate) => candidate.includes("expected/observed mismatch"),
  ),
  "mismatch must produce next handoff adjustment",
);
assert.equal(
  perspectivePreview.write_readiness.ready_for_perspective_update_write,
  false,
);
assert.equal(
  perspectivePreview.write_readiness.ready_for_next_work_bias_write,
  false,
);
assertAuthorityBoundary(perspectivePreview.authority_boundary);

const metricWithoutLedgerDetails = {
  ...metricPreview,
  ledger_source: {
    ...metricPreview.ledger_source,
    record_refs: ["ledger-record:missing-detail"],
  },
};
const missingDetailPreview =
  previewModule.buildPerspectiveNextWorkCandidateUpdatePreviewV01({
    metric_preview: metricWithoutLedgerDetails,
    ledger_records: [],
    as_of: "2026-07-04T08:12:00.000Z",
  });
assert.equal(missingDetailPreview.candidate_status, "needs_operator_review");
assert(
  missingDetailPreview.evidence_summary.missing_evidence.includes(
    "approved_ledger_record_details_missing",
  ),
);
assert(
  missingDetailPreview.evidence_summary.missing_evidence.includes(
    "missing_approved_ledger_record:ledger-record:missing-detail",
  ),
);

const changedFilesBoundary = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "perspective-next-work-candidate-update-preview-v0-1",
});
const untrackedFiles = collectUntrackedFiles();
const changedAndUntrackedFiles = uniqueSorted([
  ...changedFilesBoundary.files,
  ...untrackedFiles,
]);
for (const file of changedAndUntrackedFiles) {
  assert(
    allowedChangedFiles.includes(file),
    `Unexpected perspective next-work candidate preview file: ${file}`,
  );
}

console.log(
  JSON.stringify(
    {
      smoke: "perspective-next-work-candidate-update-preview-v0-1",
      pass: true,
      empty_preview_insufficient_data: true,
      missing_metric_preview_selects_no_records: true,
      empty_metric_record_refs_not_wildcard: true,
      partial_ledger_details_marked_missing: true,
      helpful_refs_reinforce_and_preserve_checked: true,
      problem_buckets_warn_drop_verify_checked: true,
      unknown_refs_remain_unknown_checked: true,
      skipped_checks_and_not_done_items_checked: true,
      mismatch_adjustment_checked: true,
      repeated_problem_ref_strength_checked: true,
      write_readiness_false: true,
      workbench_default_empty_preview_checked: true,
      no_perspective_unit_write: true,
      no_next_work_bias_write: true,
      no_memory_mutation: true,
      no_metric_write: true,
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_observed: changedFilesBoundary.files,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:perspective-next-work-candidate-update-preview-v0-1");

function approvedLedgerRecord(suffix, options) {
  const createdAt =
    suffix === "alpha"
      ? "2026-07-04T08:05:00.000Z"
      : "2026-07-04T08:06:00.000Z";
  return {
    record_version: "handoff_reuse_outcome_ledger_record.v0.1",
    store_version: "handoff_reuse_outcome_ledger_store.v0.1",
    record_id: `handoff-reuse-outcome-ledger-record:task8-${suffix}`,
    idempotency_key: `handoff-reuse-outcome-ledger:task8:${suffix}`,
    created_at: createdAt,
    scope: "project:augnes",
    operator_decision: "approve_for_future_write",
    operator_approval: {
      approved_by: `operator-ref:task8-${suffix}`,
      operator_ref: `operator-ref:task8-${suffix}`,
      approved_at: createdAt,
      checklist_confirmations: {
        actual_result_report_confirmed: true,
        result_matches_intended_codex_run: true,
        changed_files_and_checks_confirmed: true,
        skipped_checks_reviewed_not_counted_as_success: true,
        reuse_classifications_evidence_backed: true,
        unknown_refs_remain_unknown: true,
        carry_forward_candidates_are_candidate_only: true,
        no_durable_memory_or_perspective_apply: true,
        no_metric_update_expected: true,
      },
      review_note: "Synthetic approved record for Task 8 smoke.",
    },
    source_refs: [
      `operator-provided-result:task8-${suffix}`,
      "task-ref:augnes-codex-task-8",
    ],
    decision_preview_refs: {
      preview_version: "dogfood_reuse_operator_decision_preview.v0.1",
      preview_status: "ready_for_operator_decision",
      recommended_operator_decision: "approve_for_future_write",
      write_ready: true,
      preview_as_of: createdAt,
      source_refs: [`operator-provided-result:task8-${suffix}`],
    },
    proposal_refs: {
      proposal_ref: `dogfood-reuse-proposal:task8-${suffix}`,
      proposal_version: "dogfood_reuse_record_proposal.v0.1",
      proposal_status: "proposal_ready_for_operator_review",
      feedback_draft_ref: `codex-result-feedback-draft:task8-${suffix}`,
      result_report_ref: `codex-result-report:operator-task8-${suffix}`,
      result_report_fingerprint: `sha256:operator-task8-${suffix}`,
      context_relay_rationale_ref: `handoff-context-relay-rationale:${suffix}`,
      continuity_relay_ref: `workplane-continuity-relay:${suffix}`,
      source_refs: [`operator-provided-result:task8-${suffix}`],
    },
    feedback_draft_refs: {
      feedback_draft_ref: `codex-result-feedback-draft:task8-${suffix}`,
      result_report_ref: `codex-result-report:operator-task8-${suffix}`,
      result_report_fingerprint: `sha256:operator-task8-${suffix}`,
      context_relay_rationale_ref: `handoff-context-relay-rationale:${suffix}`,
      continuity_relay_ref: `workplane-continuity-relay:${suffix}`,
      source_refs: [`operator-provided-result:task8-${suffix}`],
    },
    result_report_ref: `codex-result-report:operator-task8-${suffix}`,
    result_report_fingerprint: `sha256:operator-task8-${suffix}`,
    context_relay_rationale_ref: `handoff-context-relay-rationale:${suffix}`,
    continuity_relay_ref: `workplane-continuity-relay:${suffix}`,
    proposed_record_kind: "handoff_reuse_outcome_candidate",
    dogfood_signal: {
      requirement_progress_observed: [
        "perspective next-work candidate update preview derived",
      ],
      checks_observed: [
        "npm run smoke:perspective-next-work-candidate-update-preview-v0-1",
      ],
      skipped_or_unverified_checks: options.skippedChecks,
      not_done_items: options.notDoneItems,
      mismatch_summary: options.mismatchSummary,
      context_feedback_signal_present: true,
      review_burden_hint: "operator review remains required",
      handoff_quality_hint: "candidate-only feedback should shape next handoff",
      confidence: "medium",
    },
    reuse_classifications: {
      helpful_refs: options.helpfulRefs,
      stale_refs: options.staleRefs,
      missing_refs: options.missingRefs,
      noisy_refs: options.noisyRefs,
      misleading_refs: options.misleadingRefs,
      unknown_refs: options.unknownRefs,
      corrections_needed: ["keep all problem buckets visible"],
      refs_to_preserve_next_time: options.carryForward.refs_to_preserve_next_time,
      refs_to_warn_next_time: options.carryForward.refs_to_warn_next_time,
      refs_to_drop_or_deprioritize:
        options.carryForward.refs_to_drop_or_deprioritize,
      confidence: "medium",
      review_needed: true,
    },
    expected_observed_summary: {
      matched_expectation_count: 3,
      missing_expectation_count: options.missingExpectationCount,
      unexpected_observation_count: 0,
      skipped_or_unverified_check_count: options.skippedChecks.length,
      changed_files_observed: [
        "lib/perspective/perspective-next-work-candidate-update-preview.ts",
      ],
      checks_observed: [
        "npm run smoke:perspective-next-work-candidate-update-preview-v0-1",
      ],
      requirement_progress_observed: [
        "perspective next-work candidate update preview derived",
      ],
      missing_expectations:
        options.missingExpectationCount > 0
          ? ["durable update write remains out of scope"]
          : [],
      unexpected_observations: [],
      not_done_items: options.notDoneItems,
      mismatch_summary: options.mismatchSummary,
      confidence: "medium",
    },
    skipped_or_unverified_checks: options.skippedChecks,
    not_done_items: options.notDoneItems,
    carry_forward_candidates: options.carryForward,
    evidence_summary: {
      has_proposal: true,
      proposal_status: "proposal_ready_for_operator_review",
      has_feedback_draft: true,
      has_result_report: true,
      has_context_rationale: true,
      has_expected_return_signal: true,
      has_observed_return_signal: true,
      has_explicit_context_feedback: true,
      has_skipped_or_unverified_checks: options.skippedChecks.length > 0,
      has_insufficient_data: false,
      has_blocking_reasons: false,
      has_missing_evidence: false,
      evidence_refs: [`evidence-ref:task8-${suffix}`],
      missing_evidence: [],
    },
    write_validation: {
      validation_version: "handoff_reuse_outcome_ledger_write_validation.v0.1",
      write_ready_revalidated: true,
      required_checklist_confirmations: [
        "actual_result_report_confirmed",
        "result_matches_intended_codex_run",
      ],
      refused_sample_fixture_material: false,
      default_workbench_missing_result_refused: false,
      validation_hash: `sha256:task8-validation-${suffix}`,
    },
    authority_boundary: {
      ledger_record_only: true,
      source_of_truth: false,
      operator_approved_durable_local_record: true,
      can_write_handoff_reuse_ledger: false,
      can_write_db: false,
      can_write_dogfood_ledger: false,
      can_update_metrics: false,
      can_mutate_memory: false,
      can_promote_memory: false,
      can_apply_project_perspective: false,
      can_create_promotion_decision: false,
      can_create_formation_receipt: false,
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
      notes: ["synthetic approved ledger record for smoke"],
    },
    notes: ["candidate material only; no durable write"],
    record_fingerprint: `sha256:task8-record-${suffix}`,
  };
}

function reuseRef(bucket, suffix) {
  return {
    ref_id: `context-ref:${bucket}-${suffix}`,
    label: `${bucket} ref ${suffix}`,
    reason_category: bucket,
    evidence_refs: [`evidence-ref:${bucket}-${suffix}`],
    summary: `${bucket} context reuse signal ${suffix}`,
  };
}

function assertAuthorityBoundary(boundary) {
  assert.equal(boundary.read_only, true);
  assert.equal(boundary.candidate_material_only, true);
  assert.equal(boundary.source_of_truth, false);
  assert.equal(boundary.derived_read_model, true);
  assert.equal(boundary.can_write_db, false);
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
