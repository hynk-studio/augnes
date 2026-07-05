import { buildDogfoodMetricCandidatePreviewFromReuseLedgerRecordsV01 } from "@/lib/dogfooding/dogfood-metric-candidate-preview";
import {
  isCandidateIngressPublicSafeRefV01,
  sanitizeCandidateIngressSummaryV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  DOGFOOD_METRIC_SNAPSHOT_PREVIEW_VERSION,
  type DogfoodMetricSnapshotAggregateCounts,
  type DogfoodMetricSnapshotCandidateBucket,
  type DogfoodMetricSnapshotCandidateSummary,
  type DogfoodMetricSnapshotPreview,
  type DogfoodMetricSnapshotPreviewAuthorityBoundary,
  type DogfoodMetricSnapshotPreviewInput,
  type DogfoodMetricSnapshotPreviewStatus,
  type DogfoodMetricSnapshotRecommendedNextAction,
  type DogfoodMetricSnapshotWindow,
} from "@/types/dogfood-metric-snapshot-preview";
import { EXPECTED_OBSERVED_DELTA_RECORD_REVIEW_VERSION } from "@/types/expected-observed-delta-record-review";
import {
  HANDOFF_REUSE_OUTCOME_LEDGER_RECORD_VERSION,
  HANDOFF_REUSE_OUTCOME_LEDGER_SCOPE,
  HANDOFF_REUSE_OUTCOME_LEDGER_STORE_VERSION,
  type HandoffReuseOutcomeLedgerRecord,
} from "@/types/handoff-reuse-outcome-ledger";
import { REUSE_OUTCOME_BRIDGE_LEDGER_RECORD_REVIEW_VERSION } from "@/types/reuse-outcome-bridge-ledger-record-review";

const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;

export function buildDogfoodMetricSnapshotPreviewV01({
  reuse_outcome_bridge_ledger_record_review,
  approved_reuse_ledger_records,
  expected_observed_delta_record_review,
  work_episode_residue_candidate_preview,
  metric_window,
  scope,
  as_of,
  source_refs,
}: DogfoodMetricSnapshotPreviewInput = {}): DogfoodMetricSnapshotPreview {
  const window = normalizeWindow(metric_window);
  const ledgerReview = isReuseLedgerRecordReview(
    reuse_outcome_bridge_ledger_record_review,
  )
    ? reuse_outcome_bridge_ledger_record_review
    : null;
  const expectedObservedReview = isExpectedObservedDeltaRecordReview(
    expected_observed_delta_record_review,
  )
    ? expected_observed_delta_record_review
    : null;
  const explicitRecords = Array.isArray(approved_reuse_ledger_records)
    ? approved_reuse_ledger_records.filter(isHandoffReuseOutcomeLedgerRecord)
    : [];
  const reuseRecords = filterRecordsByWindow(
    uniqueRecords([...(ledgerReview?.records ?? []), ...explicitRecords]),
    window,
  );
  const metricCandidatePreview =
    buildDogfoodMetricCandidatePreviewFromReuseLedgerRecordsV01({
      records: reuseRecords,
      scope: scope ?? ledgerReview?.scope ?? HANDOFF_REUSE_OUTCOME_LEDGER_SCOPE,
      as_of: as_of ?? ledgerReview?.as_of ?? FALLBACK_AS_OF,
      metric_window: {
        since: window.since,
        until: window.until,
        limit: window.limit,
        filtered_by_operator_ref: window.filtered_by_operator_ref,
        filtered_by_result_report_ref: window.filtered_by_result_ref,
      },
      source_refs: [
        DOGFOOD_METRIC_SNAPSHOT_PREVIEW_VERSION,
        ...(source_refs ?? []),
        ...(ledgerReview?.source_refs ?? []),
      ],
      insufficient_data_reasons: [
        ...(ledgerReview?.insufficient_data_reasons ?? []),
        ...(ledgerReview?.blocked_reasons ?? []),
      ],
    });
  const sourceRecordSummaries =
    metricCandidatePreview.source_record_summaries;
  const aggregateCounts = buildAggregateCounts({
    metricCandidatePreview,
    expectedObservedReview,
    reuseRecords,
  });
  const evidenceRefs = uniqueCandidateIngressStringsV01([
    ...(ledgerReview?.source_refs ?? []),
    ...(expectedObservedReview?.evidence_summary.evidence_refs ?? []),
    ...reuseRecords.flatMap((record) => record.source_refs),
    ...reuseRecords.map((record) => `reuse-ledger-record:${record.record_id}`),
  ]).filter(isCandidateIngressPublicSafeRefV01);
  const sourceRefs = uniqueCandidateIngressStringsV01([
    DOGFOOD_METRIC_SNAPSHOT_PREVIEW_VERSION,
    HANDOFF_REUSE_OUTCOME_LEDGER_RECORD_VERSION,
    HANDOFF_REUSE_OUTCOME_LEDGER_STORE_VERSION,
    ...(source_refs ?? []),
    ...(ledgerReview?.source_refs ?? []),
    ...(expectedObservedReview?.source_refs ?? []),
    ...(isRecord(work_episode_residue_candidate_preview) &&
    typeof work_episode_residue_candidate_preview.preview_version === "string"
      ? [work_episode_residue_candidate_preview.preview_version]
      : []),
    ...reuseRecords.map((record) => `reuse-ledger-record:${record.record_id}`),
    ...metricCandidatePreview.source_refs,
  ]).filter(isCandidateIngressPublicSafeRefV01);
  const candidateSummaries = buildMetricCandidateSummaries({
    counts: aggregateCounts,
    evidenceRefs,
    singleSample: aggregateCounts.approved_reuse_ledger_record_count === 1,
  });
  const blockedReasons = uniqueCandidateIngressStringsV01([
    ...(isRecord(reuse_outcome_bridge_ledger_record_review) && !ledgerReview
      ? ["reuse_outcome_bridge_ledger_record_review_version_invalid"]
      : []),
    ...(isRecord(expected_observed_delta_record_review) &&
    !expectedObservedReview
      ? ["expected_observed_delta_record_review_version_invalid"]
      : []),
    ...(ledgerReview?.blocked_reasons ?? []),
    ...(ledgerReview?.evidence_summary.has_receipt_side_effect_problem
      ? ["reuse_ledger_receipt_side_effect_problem"]
      : []),
  ]);
  const insufficientDataReasons = uniqueCandidateIngressStringsV01([
    ...(reuseRecords.length === 0 ? ["approved_reuse_outcome_records_missing"] : []),
    ...(aggregateCounts.approved_reuse_ledger_record_count === 0
      ? ["approved_reuse_ledger_records_missing_for_metric_snapshot"]
      : []),
    ...(aggregateCounts.approved_reuse_ledger_record_count === 1
      ? ["single_sample_not_metric_trend"]
      : []),
    ...(evidenceRefs.length === 0 ? ["metric_snapshot_evidence_refs_missing"] : []),
    ...(metricCandidatePreview.insufficient_data_reasons ?? []),
  ]);
  const status = determineStatus({
    approvedRecordCount: aggregateCounts.approved_reuse_ledger_record_count,
    candidateCount: candidateSummaries.length,
    blockedReasons,
    insufficientDataReasons,
  });
  const recommendedNextAction = determineRecommendedNextAction(status);
  const problemSignalCount =
    aggregateCounts.stale_context_signal_count +
    aggregateCounts.missing_context_signal_count +
    aggregateCounts.noisy_context_signal_count +
    aggregateCounts.misleading_context_signal_count +
    aggregateCounts.unknown_context_signal_count;
  const carryForwardCount =
    ledgerReview?.aggregate_counts.carry_forward_count ??
    reuseRecords.reduce((total, record) => total + carryForwardCountForRecord(record), 0);

  return {
    preview_version: DOGFOOD_METRIC_SNAPSHOT_PREVIEW_VERSION,
    scope:
      scope ??
      ledgerReview?.scope ??
      expectedObservedReview?.scope ??
      HANDOFF_REUSE_OUTCOME_LEDGER_SCOPE,
    as_of:
      as_of ??
      ledgerReview?.as_of ??
      expectedObservedReview?.as_of ??
      FALLBACK_AS_OF,
    source_refs: sourceRefs,
    snapshot_preview_status: status,
    recommended_next_action: recommendedNextAction,
    input_summary: {
      has_reuse_outcome_bridge_ledger_record_review: Boolean(ledgerReview),
      reuse_ledger_record_review_status: ledgerReview?.review_status ?? null,
      approved_reuse_ledger_record_count:
        aggregateCounts.approved_reuse_ledger_record_count,
      raw_reuse_ledger_record_count: reuseRecords.length,
      expected_observed_delta_record_count:
        aggregateCounts.expected_observed_delta_record_count,
      metric_candidate_ref_count: candidateSummaries.length,
      blocker_count: blockedReasons.length,
      insufficient_data_count: insufficientDataReasons.length,
      single_sample: aggregateCounts.approved_reuse_ledger_record_count === 1,
    },
    metric_window: window,
    source_record_summary: {
      reuse_ledger_record_refs: sourceRecordSummaries.map(
        (summary) => summary.record_id,
      ),
      result_refs: uniqueCandidateIngressStringsV01(
        sourceRecordSummaries.map((summary) => summary.result_report_ref),
      ),
      work_refs: uniqueCandidateIngressStringsV01(
        reuseRecords
          .map((record) => record.feedback_draft_refs.feedback_draft_ref)
          .filter((ref): ref is string => Boolean(ref)),
      ),
      handoff_refs: uniqueCandidateIngressStringsV01(
        reuseRecords.map((record) => record.context_relay_rationale_ref),
      ),
      operator_refs: uniqueCandidateIngressStringsV01(
        sourceRecordSummaries.map((summary) => summary.operator_ref),
      ),
      expected_observed_delta_record_refs:
        expectedObservedReview?.records.map((record) => record.record_id) ?? [],
    },
    aggregate_counts: aggregateCounts,
    reuse_quality_metrics: {
      helpful_context_signal_count:
        aggregateCounts.helpful_context_signal_count,
      stale_context_signal_count: aggregateCounts.stale_context_signal_count,
      missing_context_signal_count:
        aggregateCounts.missing_context_signal_count,
      noisy_context_signal_count: aggregateCounts.noisy_context_signal_count,
      misleading_context_signal_count:
        aggregateCounts.misleading_context_signal_count,
      unknown_context_signal_count:
        aggregateCounts.unknown_context_signal_count,
      helpful_ratio:
        aggregateCounts.helpful_context_signal_count + problemSignalCount > 0
          ? aggregateCounts.helpful_context_signal_count /
            (aggregateCounts.helpful_context_signal_count + problemSignalCount)
          : null,
      problem_signal_count: problemSignalCount,
    },
    handoff_quality_metrics: {
      skipped_or_unverified_check_count:
        aggregateCounts.skipped_or_unverified_check_count,
      not_done_item_count: aggregateCounts.not_done_item_count,
      handoff_loss_signal_count: aggregateCounts.handoff_loss_signal_count,
      carry_forward_candidate_count: carryForwardCount,
    },
    expected_observed_quality_metrics: {
      expected_observed_mismatch_count:
        aggregateCounts.expected_observed_mismatch_count,
      requirement_progress_gap_count:
        aggregateCounts.requirement_progress_gap_count,
      expected_observed_delta_record_count:
        aggregateCounts.expected_observed_delta_record_count,
    },
    verification_quality_metrics: {
      skipped_or_unverified_check_count:
        aggregateCounts.skipped_or_unverified_check_count,
      verified_success_count: 0,
      verification_burden_count:
        aggregateCounts.skipped_or_unverified_check_count +
        aggregateCounts.not_done_item_count,
    },
    context_diet_metrics: {
      preserve_candidate_count:
        ledgerReview?.aggregate_counts.helpful_ref_count ??
        aggregateCounts.helpful_context_signal_count,
      warn_candidate_count:
        aggregateCounts.stale_context_signal_count +
        aggregateCounts.missing_context_signal_count +
        aggregateCounts.misleading_context_signal_count,
      drop_or_deprioritize_candidate_count:
        aggregateCounts.noisy_context_signal_count +
        aggregateCounts.misleading_context_signal_count,
      unknown_context_signal_count:
        aggregateCounts.unknown_context_signal_count,
    },
    metric_trend_candidates: candidateSummaries.filter(
      (candidate) =>
        candidate.bucket === "insufficient_data_record_count" ||
        candidate.bucket === "review_burden_signal_count",
    ),
    metric_candidate_summaries: candidateSummaries,
    dogfood_metric_candidate_preview: metricCandidatePreview,
    evidence_summary: {
      has_reuse_outcome_records:
        aggregateCounts.approved_reuse_ledger_record_count > 0,
      has_expected_observed_material:
        aggregateCounts.expected_observed_delta_record_count > 0 ||
        aggregateCounts.expected_observed_mismatch_count > 0,
      has_source_refs: sourceRefs.length > 0,
      has_evidence_refs: evidenceRefs.length > 0,
      evidence_refs: evidenceRefs,
      source_refs: sourceRefs,
      missing_evidence:
        evidenceRefs.length === 0 ? ["metric_snapshot_evidence_refs_missing"] : [],
      single_sample_not_trend:
        aggregateCounts.approved_reuse_ledger_record_count === 1,
    },
    blocked_reasons: blockedReasons,
    insufficient_data_reasons: insufficientDataReasons,
    operator_review_checklist: [
      "confirm_approved_reuse_outcome_ledger_records_are_real_current_material",
      "confirm_skipped_checks_increase_verification_burden_not_success",
      "confirm_missing_stale_misleading_context_is_not_counted_as_helpful",
      "confirm_single_record_snapshots_are_not_treated_as_trends",
      "confirm_metric_snapshot_is_not_perspective_cwp_relay_or_handoff_mutation",
    ],
    would_not_write: [
      "does_not_open_db_or_call_route",
      "does_not_write_dogfood_metric_snapshot",
      "does_not_update_global_dogfood_metrics",
      "does_not_write_reuse_ledger_or_expected_observed_delta",
      "does_not_write_memory_perspective_cwp_relay_or_handoff",
      "does_not_call_provider_github_or_codex",
    ],
    non_goals: [
      "global_dogfood_metric_update",
      "reuse_outcome_ledger_write",
      "expected_observed_delta_write",
      "work_episode_write",
      "memory_or_perspective_promotion",
      "continuity_relay_or_handoff_mutation",
      "external_action",
    ],
    authority_boundary: createDogfoodMetricSnapshotAuthorityBoundaryV01(),
  };
}

export function createDogfoodMetricSnapshotAuthorityBoundaryV01(): DogfoodMetricSnapshotPreviewAuthorityBoundary {
  return {
    read_only: true,
    candidate_material_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_write_dogfood_metric_snapshot: false,
    can_write_dogfood_metrics: false,
    can_update_metrics: false,
    can_write_reuse_outcome_ledger: false,
    can_write_expected_observed_delta: false,
    can_write_work_episode: false,
    can_write_memory: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_update_current_working_perspective: false,
    can_update_continuity_relay: false,
    can_mutate_handoff_context: false,
    can_send_handoff: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    notes: [
      "Dogfood metric snapshot preview is a read-only candidate read model.",
      "Approved reuse outcome ledger records are metric material, not proof of improvement.",
      "Skipped checks, not-done work, stale refs, missing refs, misleading refs, and unknown refs remain burden signals.",
    ],
  };
}

function normalizeWindow(
  window: Partial<DogfoodMetricSnapshotWindow> | undefined,
): DogfoodMetricSnapshotWindow {
  return {
    since: window?.since ?? null,
    until: window?.until ?? null,
    limit: window?.limit ?? null,
    filtered_by_operator_ref: window?.filtered_by_operator_ref ?? null,
    filtered_by_result_ref: window?.filtered_by_result_ref ?? null,
    filtered_by_work_ref: window?.filtered_by_work_ref ?? null,
  };
}

function filterRecordsByWindow(
  records: HandoffReuseOutcomeLedgerRecord[],
  window: DogfoodMetricSnapshotWindow,
): HandoffReuseOutcomeLedgerRecord[] {
  const sinceMs = window.since ? Date.parse(window.since) : Number.NaN;
  const untilMs = window.until ? Date.parse(window.until) : Number.NaN;
  const filtered = records
    .filter((record) => {
      if (
        window.filtered_by_operator_ref &&
        record.operator_approval.operator_ref !== window.filtered_by_operator_ref &&
        record.operator_approval.approved_by !== window.filtered_by_operator_ref
      ) {
        return false;
      }
      if (
        window.filtered_by_result_ref &&
        record.result_report_ref !== window.filtered_by_result_ref
      ) {
        return false;
      }
      if (
        window.filtered_by_work_ref &&
        record.feedback_draft_refs.feedback_draft_ref !==
          window.filtered_by_work_ref
      ) {
        return false;
      }
      const createdAtMs = Date.parse(record.created_at);
      if (Number.isFinite(sinceMs) && createdAtMs < sinceMs) return false;
      if (Number.isFinite(untilMs) && createdAtMs > untilMs) return false;
      return true;
    })
    .sort((left, right) =>
      left.created_at === right.created_at
        ? left.record_id.localeCompare(right.record_id)
        : left.created_at.localeCompare(right.created_at),
    );
  return window.limit && window.limit > 0
    ? filtered.slice(0, window.limit)
    : filtered;
}

function buildAggregateCounts({
  metricCandidatePreview,
  expectedObservedReview,
  reuseRecords,
}: {
  metricCandidatePreview: NonNullable<DogfoodMetricSnapshotPreview["dogfood_metric_candidate_preview"]>;
  expectedObservedReview: Record<string, unknown> | null;
  reuseRecords: HandoffReuseOutcomeLedgerRecord[];
}): DogfoodMetricSnapshotAggregateCounts {
  const counts = metricCandidatePreview.aggregate_counts;
  const expectedObservedCount =
    isRecord(expectedObservedReview?.input_summary) &&
    typeof expectedObservedReview.input_summary.valid_record_count === "number"
      ? expectedObservedReview.input_summary.valid_record_count
      : 0;
  const requirementProgressGapCount =
    isRecord(expectedObservedReview?.record_material_summary) &&
    typeof expectedObservedReview.record_material_summary
      .requirement_progress_delta_count === "number"
      ? expectedObservedReview.record_material_summary
          .requirement_progress_delta_count
      : reuseRecords.reduce(
          (total, record) =>
            total +
            record.expected_observed_summary.missing_expectation_count +
            record.expected_observed_summary.unexpected_observation_count,
          0,
        );
  const carryForwardCandidateCount = reuseRecords.reduce(
    (total, record) => total + carryForwardCountForRecord(record),
    0,
  );
  return {
    approved_reuse_ledger_record_count: counts.approved_record_count,
    raw_reuse_ledger_record_count: reuseRecords.length,
    expected_observed_delta_record_count: expectedObservedCount,
    helpful_context_signal_count: counts.helpful_ref_count,
    stale_context_signal_count: counts.stale_ref_count,
    missing_context_signal_count: counts.missing_ref_count,
    noisy_context_signal_count: counts.noisy_ref_count,
    misleading_context_signal_count: counts.misleading_ref_count,
    unknown_context_signal_count: counts.unknown_ref_count,
    skipped_or_unverified_check_count:
      counts.skipped_or_unverified_check_count,
    not_done_item_count: counts.not_done_item_count,
    expected_observed_mismatch_count:
      counts.expected_observed_mismatch_count,
    requirement_progress_gap_count: requirementProgressGapCount,
    carry_forward_candidate_count: carryForwardCandidateCount,
    review_burden_signal_count:
      counts.skipped_or_unverified_check_count +
      counts.not_done_item_count +
      counts.expected_observed_mismatch_count,
    handoff_loss_signal_count:
      counts.missing_ref_count +
      counts.stale_ref_count +
      counts.misleading_ref_count,
    insufficient_data_record_count: counts.insufficient_data_record_count,
  };
}

function buildMetricCandidateSummaries({
  counts,
  evidenceRefs,
  singleSample,
}: {
  counts: DogfoodMetricSnapshotAggregateCounts;
  evidenceRefs: string[];
  singleSample: boolean;
}): DogfoodMetricSnapshotCandidateSummary[] {
  const definitions: Array<{
    bucket: DogfoodMetricSnapshotCandidateBucket;
    kind: DogfoodMetricSnapshotCandidateSummary["candidate_kind"];
    label: string;
    summary: string;
  }> = [
    {
      bucket: "helpful_context_signal_count",
      kind: "reuse_quality_signal",
      label: "Helpful context",
      summary: "Helpful context signals from approved reuse outcomes.",
    },
    {
      bucket: "stale_context_signal_count",
      kind: "reuse_quality_signal",
      label: "Stale context",
      summary: "Stale context remains a problem signal, not helpful context.",
    },
    {
      bucket: "missing_context_signal_count",
      kind: "reuse_quality_signal",
      label: "Missing context",
      summary: "Missing context remains a handoff gap signal.",
    },
    {
      bucket: "noisy_context_signal_count",
      kind: "context_diet_signal",
      label: "Noisy context",
      summary: "Noisy context should be dieted or deprioritized.",
    },
    {
      bucket: "misleading_context_signal_count",
      kind: "context_diet_signal",
      label: "Misleading context",
      summary: "Misleading context is a warning signal, not a success.",
    },
    {
      bucket: "unknown_context_signal_count",
      kind: "context_diet_signal",
      label: "Unknown context",
      summary: "Unknown refs remain unknown until reviewed.",
    },
    {
      bucket: "skipped_or_unverified_check_count",
      kind: "verification_quality_signal",
      label: "Skipped checks",
      summary: "Skipped or unverified checks increase verification burden.",
    },
    {
      bucket: "not_done_item_count",
      kind: "handoff_quality_signal",
      label: "Not done",
      summary: "Not-done items remain unfinished work, not completion.",
    },
    {
      bucket: "expected_observed_mismatch_count",
      kind: "expected_observed_quality_signal",
      label: "Expected/observed mismatches",
      summary: "Expected/observed mismatches need operator review.",
    },
    {
      bucket: "requirement_progress_gap_count",
      kind: "expected_observed_quality_signal",
      label: "Requirement gaps",
      summary: "Requirement progress gaps are not completion proof.",
    },
    {
      bucket: "carry_forward_candidate_count",
      kind: "handoff_quality_signal",
      label: "Carry-forward candidates",
      summary: "Carry-forward candidates prepare future work only.",
    },
    {
      bucket: "review_burden_signal_count",
      kind: "trend_quality_signal",
      label: "Review burden",
      summary: singleSample
        ? "Single-sample review burden is not a trend."
        : "Review burden can be compared across multiple records.",
    },
    {
      bucket: "handoff_loss_signal_count",
      kind: "handoff_quality_signal",
      label: "Handoff loss",
      summary: "Handoff loss combines stale, missing, and misleading context.",
    },
    {
      bucket: "insufficient_data_record_count",
      kind: "insufficient_data_signal",
      label: "Insufficient data",
      summary: "Insufficient-data records limit metric confidence.",
    },
  ];
  return definitions
    .map(({ bucket, kind, label, summary }) => {
      const value = counts[bucket];
      if (value <= 0 && bucket !== "insufficient_data_record_count") {
        return null;
      }
      if (bucket === "insufficient_data_record_count" && value <= 0 && !singleSample) {
        return null;
      }
      return {
        candidate_ref: `metric-snapshot:${bucket}`,
        bucket,
        candidate_kind: kind,
        label,
        summary: sanitizeCandidateIngressSummaryV01(
          `${summary} Count: ${String(value)}.`,
        ),
        value,
        evidence_refs: evidenceRefs,
        single_sample: singleSample,
      } satisfies DogfoodMetricSnapshotCandidateSummary;
    })
    .filter((candidate): candidate is DogfoodMetricSnapshotCandidateSummary =>
      Boolean(candidate),
    );
}

function determineStatus({
  approvedRecordCount,
  candidateCount,
  blockedReasons,
  insufficientDataReasons,
}: {
  approvedRecordCount: number;
  candidateCount: number;
  blockedReasons: string[];
  insufficientDataReasons: string[];
}): DogfoodMetricSnapshotPreviewStatus {
  if (approvedRecordCount === 0) return "no_reuse_outcome_records";
  if (blockedReasons.length > 0) return "insufficient_data";
  if (
    insufficientDataReasons.some((reason) =>
      /single_sample|evidence_refs_missing|missing/i.test(reason),
    )
  ) {
    return "metric_candidates_available";
  }
  if (candidateCount > 0) return "ready_for_operator_review";
  return "insufficient_data";
}

function determineRecommendedNextAction(
  status: DogfoodMetricSnapshotPreviewStatus,
): DogfoodMetricSnapshotRecommendedNextAction {
  if (status === "no_reuse_outcome_records") return "supply_reuse_outcome_records";
  if (status === "ready_for_operator_review") {
    return "prepare_dogfood_metric_snapshot_decision";
  }
  if (status === "metric_candidates_available") {
    return "review_dogfood_metric_snapshot_candidates";
  }
  if (status === "keep_preview_only") return "keep_preview_only";
  return "review_dogfood_metric_snapshot_candidates";
}

function isReuseLedgerRecordReview(value: unknown): value is {
  review_version: typeof REUSE_OUTCOME_BRIDGE_LEDGER_RECORD_REVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  review_status: string;
  records: HandoffReuseOutcomeLedgerRecord[];
  aggregate_counts: {
    carry_forward_count: number;
    helpful_ref_count: number;
  };
  blocked_reasons: string[];
  insufficient_data_reasons: string[];
  evidence_summary: {
    has_receipt_side_effect_problem: boolean;
  };
} {
  return (
    isRecord(value) &&
    value.review_version === REUSE_OUTCOME_BRIDGE_LEDGER_RECORD_REVIEW_VERSION &&
    Array.isArray(value.records) &&
    isRecord(value.aggregate_counts) &&
    Array.isArray(value.blocked_reasons) &&
    Array.isArray(value.insufficient_data_reasons) &&
    isRecord(value.evidence_summary)
  );
}

function isExpectedObservedDeltaRecordReview(value: unknown): value is {
  review_version: typeof EXPECTED_OBSERVED_DELTA_RECORD_REVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  records: Array<{ record_id: string }>;
  input_summary: { valid_record_count: number };
  evidence_summary: { evidence_refs: string[] };
  record_material_summary: { requirement_progress_delta_count: number };
} {
  return (
    isRecord(value) &&
    value.review_version === EXPECTED_OBSERVED_DELTA_RECORD_REVIEW_VERSION &&
    Array.isArray(value.records) &&
    isRecord(value.input_summary) &&
    isRecord(value.evidence_summary) &&
    isRecord(value.record_material_summary)
  );
}

function isHandoffReuseOutcomeLedgerRecord(
  value: unknown,
): value is HandoffReuseOutcomeLedgerRecord {
  return (
    isRecord(value) &&
    value.record_version === HANDOFF_REUSE_OUTCOME_LEDGER_RECORD_VERSION &&
    value.store_version === HANDOFF_REUSE_OUTCOME_LEDGER_STORE_VERSION &&
    isRecord(value.operator_approval) &&
    isRecord(value.feedback_draft_refs) &&
    isRecord(value.reuse_classifications) &&
    isRecord(value.expected_observed_summary) &&
    isRecord(value.carry_forward_candidates)
  );
}

function uniqueRecords(
  records: HandoffReuseOutcomeLedgerRecord[],
): HandoffReuseOutcomeLedgerRecord[] {
  const seen = new Set<string>();
  const output: HandoffReuseOutcomeLedgerRecord[] = [];
  for (const record of records) {
    if (seen.has(record.record_id)) continue;
    seen.add(record.record_id);
    output.push(record);
  }
  return output;
}

function carryForwardCountForRecord(
  record: HandoffReuseOutcomeLedgerRecord,
): number {
  const candidates = record.carry_forward_candidates;
  return (
    candidates.next_relay_update_suggestions.length +
    candidates.next_handoff_adjustments.length +
    candidates.refs_to_preserve_next_time.length +
    candidates.refs_to_warn_next_time.length +
    candidates.refs_to_drop_or_deprioritize.length +
    candidates.unresolved_gaps.length +
    (candidates.next_focus_candidate ? 1 : 0)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
