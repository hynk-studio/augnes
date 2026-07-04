import type { CodexContextReuseRef } from "@/types/codex-result-feedback-draft";
import {
  DOGFOOD_METRIC_CANDIDATE_PREVIEW_VERSION,
  type DogfoodMetricCandidateAggregateCounts,
  type DogfoodMetricCandidatePreview,
} from "@/types/dogfood-metric-candidate-preview";
import {
  HANDOFF_REUSE_OUTCOME_LEDGER_RECORD_VERSION,
  HANDOFF_REUSE_OUTCOME_LEDGER_SCOPE,
  HANDOFF_REUSE_OUTCOME_LEDGER_STORE_VERSION,
  type HandoffReuseOutcomeLedgerRecord,
} from "@/types/handoff-reuse-outcome-ledger";
import {
  PERSPECTIVE_NEXT_WORK_CANDIDATE_UPDATE_PREVIEW_VERSION,
  type PerspectiveNextWorkAuthorityBoundary,
  type PerspectiveNextWorkCandidateBucket,
  type PerspectiveNextWorkCandidateItem,
  type PerspectiveNextWorkCandidateStrength,
  type PerspectiveNextWorkCandidateUpdatePreview,
  type ProposedCarryForwardMemoryCandidates,
  type ProposedNextWorkBiasUpdates,
  type ProposedPerspectiveUnitUpdates,
} from "@/types/perspective-next-work-candidate-update-preview";

export interface PerspectiveNextWorkCandidateUpdatePreviewInput {
  metric_preview: DogfoodMetricCandidatePreview | null;
  ledger_records?: HandoffReuseOutcomeLedgerRecord[];
  as_of?: string;
  scope?: string;
  source_refs?: string[];
}

const zeroCounts: DogfoodMetricCandidateAggregateCounts = {
  approved_record_count: 0,
  helpful_ref_count: 0,
  stale_ref_count: 0,
  missing_ref_count: 0,
  noisy_ref_count: 0,
  misleading_ref_count: 0,
  unknown_ref_count: 0,
  skipped_or_unverified_check_count: 0,
  not_done_item_count: 0,
  expected_observed_mismatch_count: 0,
  insufficient_data_record_count: 0,
};

export function buildPerspectiveNextWorkCandidateUpdatePreviewV01(
  input: PerspectiveNextWorkCandidateUpdatePreviewInput,
): PerspectiveNextWorkCandidateUpdatePreview {
  const metricPreview = isMetricPreview(input.metric_preview)
    ? input.metric_preview
    : null;
  const counts = metricPreview?.aggregate_counts ?? zeroCounts;
  const asOf = input.as_of ?? metricPreview?.as_of ?? new Date(0).toISOString();
  const scope =
    input.scope ?? metricPreview?.scope ?? HANDOFF_REUSE_OUTCOME_LEDGER_SCOPE;
  const expectedRecordRefs = metricPreviewRecordRefs(metricPreview);
  const records = selectApprovedSourceRecords(
    input.ledger_records ?? [],
    metricPreview,
  );
  const missingRecordRefs = missingMetricRecordRefs({
    expectedRecordRefs,
    selectedRecords: records,
  });
  const problemRefCount =
    counts.stale_ref_count +
    counts.missing_ref_count +
    counts.noisy_ref_count +
    counts.misleading_ref_count;
  const repeatedProblemRefs = repeatedProblemRefCounts(records);
  const proposedPerspectiveUnitUpdates =
    createProposedPerspectiveUnitUpdates();
  const proposedNextWorkBiasUpdates = createProposedNextWorkBiasUpdates();
  const proposedCarryForwardMemoryCandidates =
    createProposedCarryForwardMemoryCandidates();

  for (const record of records) {
    mapReuseRefs({
      record,
      repeatedProblemRefs,
      perspective: proposedPerspectiveUnitUpdates,
      nextWorkBias: proposedNextWorkBiasUpdates,
      carryForward: proposedCarryForwardMemoryCandidates,
      approvedRecordCount: counts.approved_record_count,
    });
    mapHandoffSignals({
      record,
      perspective: proposedPerspectiveUnitUpdates,
      nextWorkBias: proposedNextWorkBiasUpdates,
      carryForward: proposedCarryForwardMemoryCandidates,
    });
  }

  const insufficientDataReasons = insufficientReasons({
    metricPreview,
    counts,
    records,
    expectedRecordRefs,
    missingRecordRefs,
  });
  const missingEvidence = missingEvidenceReasons({
    metricPreview,
    counts,
    records,
    expectedRecordRefs,
    missingRecordRefs,
  });
  const hasInsufficientData =
    insufficientDataReasons.length > 0 ||
    counts.insufficient_data_record_count > 0 ||
    missingEvidence.length > 0;
  const hasReviewSignals =
    problemRefCount +
      counts.unknown_ref_count +
      counts.skipped_or_unverified_check_count +
      counts.not_done_item_count +
      counts.expected_observed_mismatch_count >
    0;
  const candidateStatus =
    counts.approved_record_count === 0 ||
    !metricPreview ||
    expectedRecordRefs.length === 0
      ? "insufficient_data"
      : hasInsufficientData || hasReviewSignals
        ? "needs_operator_review"
        : "candidate_update_available";
  const sourceRefs = uniqueSortedStrings([
    PERSPECTIVE_NEXT_WORK_CANDIDATE_UPDATE_PREVIEW_VERSION,
    DOGFOOD_METRIC_CANDIDATE_PREVIEW_VERSION,
    HANDOFF_REUSE_OUTCOME_LEDGER_RECORD_VERSION,
    HANDOFF_REUSE_OUTCOME_LEDGER_STORE_VERSION,
    ...(input.source_refs ?? []),
    ...(metricPreview?.source_refs ?? []),
    ...records.map((record) => `ledger-record:${record.record_id}`),
    ...records.map((record) => `result-report:${record.result_report_ref}`),
  ]);

  return {
    preview_version: PERSPECTIVE_NEXT_WORK_CANDIDATE_UPDATE_PREVIEW_VERSION,
    scope,
    as_of: asOf,
    source_refs: sourceRefs,
    candidate_status: candidateStatus,
    summary: previewSummary({
      candidateStatus,
      approvedRecordCount: counts.approved_record_count,
      helpfulRefCount: counts.helpful_ref_count,
      problemRefCount,
      unknownRefCount: counts.unknown_ref_count,
    }),
    input_summary: {
      metric_preview_ref: metricPreview
        ? `dogfood_metric_candidate_preview:${metricPreview.as_of}`
        : "dogfood_metric_candidate_preview:missing",
      metric_preview_version: metricPreview?.preview_version ?? null,
      metric_candidate_status: metricPreview?.candidate_status ?? null,
      ledger_record_count: counts.approved_record_count,
      source_record_refs: expectedRecordRefs,
      helpful_ref_count: counts.helpful_ref_count,
      stale_ref_count: counts.stale_ref_count,
      missing_ref_count: counts.missing_ref_count,
      noisy_ref_count: counts.noisy_ref_count,
      misleading_ref_count: counts.misleading_ref_count,
      unknown_ref_count: counts.unknown_ref_count,
      skipped_or_unverified_check_count:
        counts.skipped_or_unverified_check_count,
      not_done_item_count: counts.not_done_item_count,
      mismatch_count: counts.expected_observed_mismatch_count,
    },
    proposed_perspective_unit_updates: proposedPerspectiveUnitUpdates,
    proposed_next_work_bias_updates: proposedNextWorkBiasUpdates,
    proposed_carry_forward_memory_candidates:
      proposedCarryForwardMemoryCandidates,
    evidence_summary: {
      has_metric_candidate_preview: Boolean(metricPreview),
      has_approved_ledger_records:
        counts.approved_record_count > 0 && records.length > 0,
      has_helpful_signal: counts.helpful_ref_count > 0,
      has_problem_signal: problemRefCount > 0,
      has_unknown_signal: counts.unknown_ref_count > 0,
      has_skipped_or_unverified_checks:
        counts.skipped_or_unverified_check_count > 0,
      has_not_done_items: counts.not_done_item_count > 0,
      has_expected_observed_mismatches:
        counts.expected_observed_mismatch_count > 0,
      has_insufficient_data: hasInsufficientData,
      evidence_refs: evidenceRefs({ metricPreview, records }),
      missing_evidence: missingEvidence,
    },
    review_required: true,
    operator_review_checklist: [
      "confirm helpful refs are evidence-backed before reinforcement",
      "confirm stale, noisy, and misleading refs remain warning or deprioritization candidates",
      "confirm unknown refs remain unknown and are not preserved as helpful",
      "confirm skipped checks and not-done items are next-work signals, not success",
      "confirm no PerspectiveUnit or NextWorkBias durable write is performed",
    ],
    blocked_reasons:
      candidateStatus === "insufficient_data" ? insufficientDataReasons : [],
    insufficient_data_reasons: insufficientDataReasons,
    write_readiness: {
      ready_for_perspective_update_write: false,
      ready_for_next_work_bias_write: false,
      required_followup: [
        "operator_reviewed_perspective_unit_update_write_contract",
        "operator_reviewed_next_work_bias_update_write_contract",
        "metric_informed_continuity_relay_adjustment_policy",
      ],
      refusal_reasons: [
        "perspective_unit_write_not_in_scope_for_v0_1",
        "next_work_bias_write_not_in_scope_for_v0_1",
        "candidate_preview_only",
        "operator_review_required_before_durable_update",
      ],
    },
    non_goals: [
      "no_perspective_unit_write",
      "no_next_work_bias_write",
      "no_memory_mutation",
      "no_perspective_apply",
      "no_dogfood_metric_write",
      "no_provider_github_codex_or_handoff_action",
    ],
    authority_boundary: createPerspectiveNextWorkAuthorityBoundaryV01(),
  };
}

export function createPerspectiveNextWorkAuthorityBoundaryV01(): PerspectiveNextWorkAuthorityBoundary {
  return {
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
    notes: [
      "Perspective Next-Work Candidate Update Preview is a read-only derived read model.",
      "Candidate updates are review material only and do not alter PerspectiveUnit or NextWorkBias state.",
      "Unknown refs remain unknown; problem buckets remain visible for operator review.",
    ],
  };
}

function mapReuseRefs({
  record,
  repeatedProblemRefs,
  perspective,
  nextWorkBias,
  carryForward,
  approvedRecordCount,
}: {
  record: HandoffReuseOutcomeLedgerRecord;
  repeatedProblemRefs: Map<string, number>;
  perspective: ProposedPerspectiveUnitUpdates;
  nextWorkBias: ProposedNextWorkBiasUpdates;
  carryForward: ProposedCarryForwardMemoryCandidates;
  approvedRecordCount: number;
}) {
  for (const ref of record.reuse_classifications.helpful_refs) {
    const item = itemFromRef({
      prefix: "reinforce",
      bucket: "helpful",
      ref,
      record,
      strength: approvedRecordCount > 1 ? "moderate" : "weak",
      reviewNote: "Helpful refs may be reinforced only after operator review.",
    });
    pushItem(perspective.reinforce_candidates, item);
    pushItem(nextWorkBias.refs_to_preserve_next_time, {
      ...item,
      candidate_id: item.candidate_id.replace("reinforce:", "preserve:"),
    });
    pushItem(carryForward.reusable_context_candidates, item);
  }
  for (const ref of record.reuse_classifications.stale_refs) {
    const strength = strengthForProblemRef(ref.ref_id, repeatedProblemRefs);
    const item = itemFromRef({
      prefix: "warn",
      bucket: "stale",
      ref,
      record,
      strength,
      reviewNote: "Stale refs should warn the next handoff before reuse.",
    });
    pushItem(perspective.warn_candidates, item);
    pushItem(nextWorkBias.refs_to_warn_next_time, item);
    pushItem(carryForward.stale_context_warnings, item);
    if (strength === "strong") {
      pushItem(perspective.weaken_candidates, {
        ...item,
        candidate_id: item.candidate_id.replace("warn:", "weaken:"),
        review_note: "Repeated stale signal may weaken this candidate after review.",
      });
    }
  }
  for (const ref of record.reuse_classifications.missing_refs) {
    const item = itemFromRef({
      prefix: "gap",
      bucket: "missing",
      ref,
      record,
      strength: strengthForProblemRef(ref.ref_id, repeatedProblemRefs),
      reviewNote: "Missing refs become verification or unresolved-gap candidates.",
    });
    pushItem(perspective.warn_candidates, item);
    pushItem(carryForward.unresolved_gap_candidates, item);
    pushItem(carryForward.verification_bias_candidates, item);
    pushString(
      nextWorkBias.next_handoff_adjustments,
      `Verify missing context before relying on ${ref.ref_id}.`,
    );
  }
  for (const ref of record.reuse_classifications.noisy_refs) {
    const item = itemFromRef({
      prefix: "drop",
      bucket: "noisy",
      ref,
      record,
      strength: strengthForProblemRef(ref.ref_id, repeatedProblemRefs),
      reviewNote: "Noisy refs should be deprioritized unless later evidence changes.",
    });
    pushItem(perspective.retire_or_deprioritize_candidates, item);
    pushItem(nextWorkBias.refs_to_drop_or_deprioritize, item);
  }
  for (const ref of record.reuse_classifications.misleading_refs) {
    const item = itemFromRef({
      prefix: "misleading",
      bucket: "misleading",
      ref,
      record,
      strength: "strong",
      reviewNote: "Misleading refs require explicit review before future reuse.",
    });
    pushItem(perspective.warn_candidates, item);
    pushItem(perspective.retire_or_deprioritize_candidates, item);
    pushItem(perspective.split_or_review_candidates, item);
    pushItem(nextWorkBias.refs_to_warn_next_time, item);
    pushItem(nextWorkBias.refs_to_drop_or_deprioritize, item);
  }
  for (const ref of record.reuse_classifications.unknown_refs) {
    pushItem(
      perspective.insufficient_data_candidates,
      itemFromRef({
        prefix: "unknown",
        bucket: "unknown",
        ref,
        record,
        strength: "insufficient_data",
        reviewNote: "Unknown refs remain unknown and are not promoted to helpful.",
      }),
    );
  }
  for (const ref of record.carry_forward_candidates.refs_to_preserve_next_time) {
    pushItem(
      nextWorkBias.refs_to_preserve_next_time,
      itemFromText("carry_forward", ref, record, "carry-preserve"),
    );
  }
  for (const ref of record.carry_forward_candidates.refs_to_warn_next_time) {
    pushItem(
      nextWorkBias.refs_to_warn_next_time,
      itemFromText("carry_forward", ref, record, "carry-warn"),
    );
  }
  for (const ref of record.carry_forward_candidates.refs_to_drop_or_deprioritize) {
    pushItem(
      nextWorkBias.refs_to_drop_or_deprioritize,
      itemFromText("carry_forward", ref, record, "carry-drop"),
    );
  }
  for (const suggestion of record.carry_forward_candidates
    .next_relay_update_suggestions) {
    pushString(nextWorkBias.next_relay_update_suggestions, suggestion);
  }
  for (const adjustment of record.carry_forward_candidates
    .next_handoff_adjustments) {
    pushString(nextWorkBias.next_handoff_adjustments, adjustment);
  }
  if (record.carry_forward_candidates.next_focus_candidate) {
    pushString(
      nextWorkBias.next_focus_candidates,
      record.carry_forward_candidates.next_focus_candidate,
    );
  }
  for (const gap of record.carry_forward_candidates.unresolved_gaps) {
    pushItem(
      carryForward.unresolved_gap_candidates,
      itemFromText("carry_forward", gap, record, "carry-gap"),
    );
  }
}

function mapHandoffSignals({
  record,
  perspective,
  nextWorkBias,
  carryForward,
}: {
  record: HandoffReuseOutcomeLedgerRecord;
  perspective: ProposedPerspectiveUnitUpdates;
  nextWorkBias: ProposedNextWorkBiasUpdates;
  carryForward: ProposedCarryForwardMemoryCandidates;
}) {
  for (const check of record.skipped_or_unverified_checks) {
    const item = itemFromText(
      "skipped_or_unverified_check",
      check,
      record,
      "verify-check",
    );
    pushItem(carryForward.verification_bias_candidates, item);
    pushItem(perspective.warn_candidates, item);
  }
  for (const itemText of record.not_done_items) {
    const item = itemFromText("not_done_item", itemText, record, "next-focus");
    pushItem(carryForward.unresolved_gap_candidates, item);
    pushString(nextWorkBias.next_focus_candidates, itemText);
  }
  if (
    record.expected_observed_summary.missing_expectation_count > 0 ||
    record.expected_observed_summary.unexpected_observation_count > 0 ||
    record.expected_observed_summary.not_done_items.length > 0
  ) {
    pushString(
      nextWorkBias.next_handoff_adjustments,
      `Account for expected/observed mismatch from ${record.result_report_ref}: ${record.expected_observed_summary.mismatch_summary}`,
    );
    pushString(
      nextWorkBias.next_relay_update_suggestions,
      `Carry forward mismatch review for ${record.result_report_ref}.`,
    );
    pushItem(
      perspective.split_or_review_candidates,
      itemFromText(
        "expected_observed_mismatch",
        record.expected_observed_summary.mismatch_summary,
        record,
        "mismatch-review",
      ),
    );
  }
  for (const nonGoal of record.notes.filter((note) =>
    /no_|not in scope|candidate/i.test(note),
  )) {
    pushString(carryForward.non_goal_reminders, nonGoal);
  }
}

function itemFromRef({
  prefix,
  bucket,
  ref,
  record,
  strength,
  reviewNote,
}: {
  prefix: string;
  bucket: PerspectiveNextWorkCandidateBucket;
  ref: CodexContextReuseRef;
  record: HandoffReuseOutcomeLedgerRecord;
  strength: PerspectiveNextWorkCandidateStrength;
  reviewNote: string;
}): PerspectiveNextWorkCandidateItem {
  return {
    candidate_id: `${prefix}:${bucket}:${safeId(ref.ref_id)}`,
    ref_id: ref.ref_id,
    label: ref.label,
    summary: ref.summary,
    source_bucket: bucket,
    evidence_refs: ref.evidence_refs,
    source_record_refs: [record.record_id],
    strength,
    candidate_only: true,
    review_note: reviewNote,
  };
}

function itemFromText(
  bucket: PerspectiveNextWorkCandidateBucket,
  value: string,
  record: HandoffReuseOutcomeLedgerRecord,
  prefix: string,
): PerspectiveNextWorkCandidateItem {
  return {
    candidate_id: `${prefix}:${bucket}:${safeId(value)}`,
    ref_id: value,
    label: value,
    summary: value,
    source_bucket: bucket,
    evidence_refs: record.evidence_summary.evidence_refs,
    source_record_refs: [record.record_id],
    strength: bucket === "carry_forward" ? "weak" : "moderate",
    candidate_only: true,
    review_note: "Text-derived candidate remains review material only.",
  };
}

function selectApprovedSourceRecords(
  records: HandoffReuseOutcomeLedgerRecord[],
  metricPreview: DogfoodMetricCandidatePreview | null,
): HandoffReuseOutcomeLedgerRecord[] {
  const allowedRecordRefs = new Set(metricPreviewRecordRefs(metricPreview));
  if (!metricPreview || allowedRecordRefs.size === 0) return [];
  return records
    .filter(
      (record) =>
        record.record_version === HANDOFF_REUSE_OUTCOME_LEDGER_RECORD_VERSION &&
        record.store_version === HANDOFF_REUSE_OUTCOME_LEDGER_STORE_VERSION &&
        record.operator_decision === "approve_for_future_write" &&
        record.authority_boundary.operator_approved_durable_local_record ===
          true &&
        allowedRecordRefs.has(record.record_id),
    )
    .sort((left, right) =>
      left.created_at === right.created_at
        ? left.record_id.localeCompare(right.record_id)
        : left.created_at.localeCompare(right.created_at),
    );
}

function metricPreviewRecordRefs(
  metricPreview: DogfoodMetricCandidatePreview | null,
): string[] {
  return uniqueSortedStrings(metricPreview?.ledger_source.record_refs ?? []);
}

function missingMetricRecordRefs({
  expectedRecordRefs,
  selectedRecords,
}: {
  expectedRecordRefs: string[];
  selectedRecords: HandoffReuseOutcomeLedgerRecord[];
}): string[] {
  const suppliedRecordIds = new Set(
    selectedRecords.map((record) => record.record_id),
  );
  return expectedRecordRefs.filter(
    (recordRef) => !suppliedRecordIds.has(recordRef),
  );
}

function repeatedProblemRefCounts(
  records: HandoffReuseOutcomeLedgerRecord[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const record of records) {
    for (const ref of [
      ...record.reuse_classifications.stale_refs,
      ...record.reuse_classifications.missing_refs,
      ...record.reuse_classifications.noisy_refs,
      ...record.reuse_classifications.misleading_refs,
    ]) {
      counts.set(ref.ref_id, (counts.get(ref.ref_id) ?? 0) + 1);
    }
  }
  return counts;
}

function strengthForProblemRef(
  refId: string,
  repeatedProblemRefs: Map<string, number>,
): PerspectiveNextWorkCandidateStrength {
  return (repeatedProblemRefs.get(refId) ?? 0) > 1 ? "strong" : "moderate";
}

function insufficientReasons({
  metricPreview,
  counts,
  records,
  expectedRecordRefs,
  missingRecordRefs,
}: {
  metricPreview: DogfoodMetricCandidatePreview | null;
  counts: DogfoodMetricCandidateAggregateCounts;
  records: HandoffReuseOutcomeLedgerRecord[];
  expectedRecordRefs: string[];
  missingRecordRefs: string[];
}): string[] {
  const reasons = [...(metricPreview?.insufficient_data_reasons ?? [])];
  if (!metricPreview) reasons.push("dogfood_metric_candidate_preview_missing");
  if (metricPreview?.candidate_status === "insufficient_data") {
    reasons.push("metric_candidate_preview_insufficient_data");
  }
  if (counts.approved_record_count === 0) {
    reasons.push("approved_reuse_ledger_records_missing");
  }
  if (metricPreview && expectedRecordRefs.length === 0) {
    reasons.push("approved_ledger_record_refs_missing");
  }
  if (counts.approved_record_count > 0 && records.length === 0) {
    reasons.push("approved_ledger_record_details_missing");
  }
  if (missingRecordRefs.length > 0) {
    reasons.push("approved_ledger_record_details_missing");
    reasons.push(
      ...missingRecordRefs.map(
        (recordRef) => `missing_approved_ledger_record:${recordRef}`,
      ),
    );
  }
  return uniqueSortedStrings(reasons);
}

function missingEvidenceReasons({
  metricPreview,
  counts,
  records,
  expectedRecordRefs,
  missingRecordRefs,
}: {
  metricPreview: DogfoodMetricCandidatePreview | null;
  counts: DogfoodMetricCandidateAggregateCounts;
  records: HandoffReuseOutcomeLedgerRecord[];
  expectedRecordRefs: string[];
  missingRecordRefs: string[];
}): string[] {
  const reasons: string[] = [];
  if (!metricPreview) reasons.push("dogfood_metric_candidate_preview_missing");
  if (metricPreview && expectedRecordRefs.length === 0) {
    reasons.push("approved_ledger_record_refs_missing");
  }
  if (counts.approved_record_count > 0 && records.length === 0) {
    reasons.push("approved_ledger_record_details_missing");
  }
  if (missingRecordRefs.length > 0) {
    reasons.push("approved_ledger_record_details_missing");
    reasons.push(
      ...missingRecordRefs.map(
        (recordRef) => `missing_approved_ledger_record:${recordRef}`,
      ),
    );
  }
  return uniqueSortedStrings(reasons);
}

function evidenceRefs({
  metricPreview,
  records,
}: {
  metricPreview: DogfoodMetricCandidatePreview | null;
  records: HandoffReuseOutcomeLedgerRecord[];
}): string[] {
  return uniqueSortedStrings([
    ...(metricPreview?.source_refs ?? []),
    ...records.flatMap((record) => record.evidence_summary.evidence_refs),
    ...records.flatMap((record) => record.source_refs),
    ...records.map((record) => record.record_fingerprint),
  ]);
}

function previewSummary({
  candidateStatus,
  approvedRecordCount,
  helpfulRefCount,
  problemRefCount,
  unknownRefCount,
}: {
  candidateStatus: PerspectiveNextWorkCandidateUpdatePreview["candidate_status"];
  approvedRecordCount: number;
  helpfulRefCount: number;
  problemRefCount: number;
  unknownRefCount: number;
}): string {
  if (candidateStatus === "insufficient_data") {
    return "No durable PerspectiveUnit or NextWorkBias update can be proposed because dogfood metric candidate input is insufficient.";
  }
  return [
    `${approvedRecordCount} approved reuse ledger record(s) produced review-only next-work candidate material.`,
    `${helpfulRefCount} helpful refs may reinforce or preserve context after review.`,
    `${problemRefCount} stale/missing/noisy/misleading refs and ${unknownRefCount} unknown refs remain visible as warnings or insufficient-data candidates.`,
    "This is not a PerspectiveUnit, NextWorkBias, memory, or metric write.",
  ].join(" ");
}

function createProposedPerspectiveUnitUpdates(): ProposedPerspectiveUnitUpdates {
  return {
    reinforce_candidates: [],
    weaken_candidates: [],
    warn_candidates: [],
    retire_or_deprioritize_candidates: [],
    split_or_review_candidates: [],
    insufficient_data_candidates: [],
  };
}

function createProposedNextWorkBiasUpdates(): ProposedNextWorkBiasUpdates {
  return {
    refs_to_preserve_next_time: [],
    refs_to_warn_next_time: [],
    refs_to_drop_or_deprioritize: [],
    next_handoff_adjustments: [],
    next_relay_update_suggestions: [],
    next_focus_candidates: [],
  };
}

function createProposedCarryForwardMemoryCandidates(): ProposedCarryForwardMemoryCandidates {
  return {
    reusable_context_candidates: [],
    stale_context_warnings: [],
    unresolved_gap_candidates: [],
    verification_bias_candidates: [],
    non_goal_reminders: [
      "candidate material only; no durable memory or Perspective apply",
    ],
  };
}

function isMetricPreview(
  value: DogfoodMetricCandidatePreview | null,
): value is DogfoodMetricCandidatePreview {
  return value?.preview_version === DOGFOOD_METRIC_CANDIDATE_PREVIEW_VERSION;
}

function pushItem(
  list: PerspectiveNextWorkCandidateItem[],
  item: PerspectiveNextWorkCandidateItem,
) {
  const existing = list.find(
    (candidate) => candidate.candidate_id === item.candidate_id,
  );
  if (!existing) {
    list.push({
      ...item,
      evidence_refs: uniqueSortedStrings(item.evidence_refs),
      source_record_refs: uniqueSortedStrings(item.source_record_refs),
    });
    return;
  }
  existing.evidence_refs = uniqueSortedStrings([
    ...existing.evidence_refs,
    ...item.evidence_refs,
  ]);
  existing.source_record_refs = uniqueSortedStrings([
    ...existing.source_record_refs,
    ...item.source_record_refs,
  ]);
  existing.strength = strongerStrength(existing.strength, item.strength);
}

function pushString(list: string[], value: string) {
  const trimmed = value.trim();
  if (trimmed && !list.includes(trimmed)) list.push(trimmed);
}

function strongerStrength(
  left: PerspectiveNextWorkCandidateStrength,
  right: PerspectiveNextWorkCandidateStrength,
): PerspectiveNextWorkCandidateStrength {
  const rank: Record<PerspectiveNextWorkCandidateStrength, number> = {
    insufficient_data: 0,
    weak: 1,
    moderate: 2,
    strong: 3,
  };
  return rank[right] > rank[left] ? right : left;
}

function safeId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function uniqueSortedStrings(values: readonly string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  ).sort();
}
