import {
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  DOGFOOD_METRIC_SNAPSHOT_PREVIEW_VERSION,
  type DogfoodMetricSnapshotPreview,
} from "@/types/dogfood-metric-snapshot-preview";
import {
  DOGFOOD_METRIC_SNAPSHOT_RECORD_REVIEW_VERSION,
  type DogfoodMetricSnapshotRecordReview,
} from "@/types/dogfood-metric-snapshot-record-review";
import { METRIC_INFORMED_CONTINUITY_RELAY_ADJUSTMENT_PREVIEW_VERSION } from "@/types/metric-informed-continuity-relay-adjustment-preview";
import {
  NEXT_WORK_SIGNAL_REFRESH_PREVIEW_VERSION,
  type NextWorkSignalRefreshAuthorityBoundary,
  type NextWorkSignalRefreshPreview,
  type NextWorkSignalRefreshPreviewInput,
  type NextWorkSignalRefreshPreviewStatus,
  type NextWorkSignalRefreshRecommendedNextAction,
} from "@/types/next-work-signal-refresh-preview";
import { PERSPECTIVE_NEXT_WORK_CANDIDATE_UPDATE_PREVIEW_VERSION } from "@/types/perspective-next-work-candidate-update-preview";
import {
  REUSE_OUTCOME_BRIDGE_LEDGER_RECORD_REVIEW_VERSION,
  type ReuseOutcomeBridgeLedgerRecordReview,
} from "@/types/reuse-outcome-bridge-ledger-record-review";

const DEFAULT_SCOPE = "project:augnes" as const;
const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;

export function buildNextWorkSignalRefreshPreviewV01({
  dogfood_metric_snapshot_preview,
  dogfood_metric_snapshot_record_review,
  reuse_outcome_bridge_ledger_record_review,
  existing_perspective_next_work_candidate_update_preview,
  existing_metric_informed_continuity_relay_adjustment_preview,
  scope,
  as_of,
  source_refs,
}: NextWorkSignalRefreshPreviewInput = {}): NextWorkSignalRefreshPreview {
  const metricPreview = isDogfoodMetricSnapshotPreview(
    dogfood_metric_snapshot_preview,
  )
    ? dogfood_metric_snapshot_preview
    : null;
  const metricRecordReview = isDogfoodMetricSnapshotRecordReview(
    dogfood_metric_snapshot_record_review,
  )
    ? dogfood_metric_snapshot_record_review
    : null;
  const reuseLedgerReview = isReuseLedgerReview(
    reuse_outcome_bridge_ledger_record_review,
  )
    ? reuse_outcome_bridge_ledger_record_review
    : null;
  const sourceRefs = uniqueCandidateIngressStringsV01([
    NEXT_WORK_SIGNAL_REFRESH_PREVIEW_VERSION,
    ...(source_refs ?? []),
    ...(metricPreview?.source_refs ?? []),
    ...(metricRecordReview?.source_refs ?? []),
    ...(reuseLedgerReview?.source_refs ?? []),
    ...(isPerspectivePreview(existing_perspective_next_work_candidate_update_preview)
      ? [PERSPECTIVE_NEXT_WORK_CANDIDATE_UPDATE_PREVIEW_VERSION]
      : []),
    ...(isRelayPreview(existing_metric_informed_continuity_relay_adjustment_preview)
      ? [METRIC_INFORMED_CONTINUITY_RELAY_ADJUSTMENT_PREVIEW_VERSION]
      : []),
  ]).filter(isCandidateIngressPublicSafeRefV01);
  const evidenceRefs = uniqueCandidateIngressStringsV01([
    ...(metricPreview?.evidence_summary.evidence_refs ?? []),
    ...(metricRecordReview?.evidence_summary.evidence_refs ?? []),
    ...(reuseLedgerReview?.source_refs ?? []),
  ]).filter(isCandidateIngressPublicSafeRefV01);
  const counts = metricPreview?.aggregate_counts;
  const recordSummary = metricRecordReview?.record_material_summary;
  const helpfulCount =
    counts?.helpful_context_signal_count ??
    recordSummary?.helpful_context_signal_count ??
    0;
  const staleCount =
    counts?.stale_context_signal_count ??
    recordSummary?.stale_context_signal_count ??
    0;
  const missingCount =
    counts?.missing_context_signal_count ??
    recordSummary?.missing_context_signal_count ??
    0;
  const noisyCount =
    counts?.noisy_context_signal_count ??
    recordSummary?.noisy_context_signal_count ??
    0;
  const misleadingCount =
    counts?.misleading_context_signal_count ??
    recordSummary?.misleading_context_signal_count ??
    0;
  const unknownCount =
    counts?.unknown_context_signal_count ??
    recordSummary?.unknown_context_signal_count ??
    0;
  const skippedCount =
    counts?.skipped_or_unverified_check_count ??
    recordSummary?.skipped_or_unverified_check_count ??
    0;
  const notDoneCount =
    counts?.not_done_item_count ?? recordSummary?.not_done_item_count ?? 0;
  const mismatchCount =
    counts?.expected_observed_mismatch_count ??
    recordSummary?.expected_observed_mismatch_count ??
    0;
  const carryForwardCount =
    counts?.carry_forward_candidate_count ??
    recordSummary?.carry_forward_candidate_count ??
    reuseLedgerReview?.aggregate_counts.carry_forward_count ??
    0;
  const signals = {
    preserve_context_refs:
      helpfulCount > 0 ? [`preserve:helpful-context:${helpfulCount}`] : [],
    warn_context_refs: [
      ...(staleCount > 0 ? [`warn:stale-context:${staleCount}`] : []),
      ...(missingCount > 0 ? [`warn:missing-context:${missingCount}`] : []),
      ...(misleadingCount > 0
        ? [`warn:misleading-context:${misleadingCount}`]
        : []),
      ...(unknownCount > 0 ? [`warn:unknown-context:${unknownCount}`] : []),
    ],
    drop_or_deprioritize_context_refs: [
      ...(noisyCount > 0 ? [`drop-or-deprioritize:noisy-context:${noisyCount}`] : []),
      ...(misleadingCount > 0
        ? [`drop-or-deprioritize:misleading-context:${misleadingCount}`]
        : []),
    ],
    verification_focus_candidates:
      skippedCount > 0 ? [`verify-skipped-or-unverified-checks:${skippedCount}`] : [],
    expected_observed_followup_candidates:
      mismatchCount > 0 ? [`review-expected-observed-mismatches:${mismatchCount}`] : [],
    handoff_quality_focus_candidates: [
      ...(missingCount > 0 ? [`close-handoff-missing-context:${missingCount}`] : []),
      ...(carryForwardCount > 0 ? [`review-carry-forward-candidates:${carryForwardCount}`] : []),
    ],
    context_diet_candidates: [
      ...(noisyCount > 0 ? [`diet-noisy-context:${noisyCount}`] : []),
      ...(staleCount > 0 ? [`diet-stale-context:${staleCount}`] : []),
      ...(misleadingCount > 0 ? [`diet-misleading-context:${misleadingCount}`] : []),
    ],
    review_burden_reduction_candidates: [
      ...(skippedCount > 0 ? [`reduce-skipped-check-burden:${skippedCount}`] : []),
      ...(notDoneCount > 0 ? [`reduce-not-done-burden:${notDoneCount}`] : []),
      ...(mismatchCount > 0 ? [`reduce-mismatch-review-burden:${mismatchCount}`] : []),
    ],
  };
  const nextWorkSignalCount = Object.values(signals).reduce(
    (total, list) => total + list.length,
    0,
  );
  const blockedReasons = uniqueCandidateIngressStringsV01([
    ...(metricPreview?.blocked_reasons ?? []),
    ...(metricRecordReview?.blocked_reasons ?? []),
  ]);
  const insufficientDataReasons = uniqueCandidateIngressStringsV01([
    ...(!metricPreview && !metricRecordReview ? ["metric_snapshot_material_missing"] : []),
    ...(metricPreview?.insufficient_data_reasons ?? []),
    ...(metricRecordReview?.insufficient_data_reasons ?? []),
    ...(nextWorkSignalCount === 0 ? ["next_work_signal_candidates_missing"] : []),
  ]);
  const status = determineStatus({
    hasMetricMaterial: Boolean(metricPreview || metricRecordReview?.records.length),
    nextWorkSignalCount,
    blockedReasons,
    insufficientDataReasons,
  });

  return {
    preview_version: NEXT_WORK_SIGNAL_REFRESH_PREVIEW_VERSION,
    scope:
      scope ??
      metricPreview?.scope ??
      metricRecordReview?.scope ??
      reuseLedgerReview?.scope ??
      DEFAULT_SCOPE,
    as_of:
      as_of ??
      metricPreview?.as_of ??
      metricRecordReview?.as_of ??
      reuseLedgerReview?.as_of ??
      FALLBACK_AS_OF,
    source_refs: sourceRefs,
    refresh_preview_status: status,
    recommended_next_action: determineRecommendedNextAction(status),
    input_summary: {
      has_metric_snapshot_preview: Boolean(metricPreview),
      has_metric_snapshot_records:
        (metricRecordReview?.input_summary.valid_record_count ?? 0) > 0,
      has_reuse_ledger_records:
        (reuseLedgerReview?.input_summary.valid_record_count ?? 0) > 0,
      metric_material_count:
        (metricPreview?.input_summary.metric_candidate_ref_count ?? 0) +
        (metricRecordReview?.input_summary.valid_record_count ?? 0),
      next_work_signal_count: nextWorkSignalCount,
      blocker_count: blockedReasons.length,
      insufficient_data_count: insufficientDataReasons.length,
    },
    proposed_next_work_signals: signals,
    evidence_summary: {
      has_metric_material: Boolean(metricPreview || metricRecordReview?.records.length),
      has_source_refs: sourceRefs.length > 0,
      has_evidence_refs: evidenceRefs.length > 0,
      evidence_refs: evidenceRefs,
      source_refs: sourceRefs,
      missing_evidence:
        evidenceRefs.length === 0 ? ["metric_snapshot_evidence_refs_missing"] : [],
    },
    blocked_reasons: blockedReasons,
    insufficient_data_reasons: insufficientDataReasons,
    operator_review_checklist: [
      "review_metric_snapshot_before_next_work_signal_refresh",
      "confirm_next_work_signals_are_candidate_material_only",
      "confirm_no_perspective_nextworkbias_cwp_relay_handoff_or_memory_write",
    ],
    would_not_write: [
      "does_not_write_perspective_unit",
      "does_not_write_next_work_bias",
      "does_not_mutate_current_working_perspective",
      "does_not_update_continuity_relay",
      "does_not_mutate_or_send_handoff",
      "does_not_write_memory_or_metrics",
      "does_not_call_provider_github_or_codex",
    ],
    non_goals: [
      "perspective_unit_write",
      "next_work_bias_write",
      "current_working_perspective_mutation",
      "continuity_relay_write",
      "handoff_context_apply_or_send",
      "memory_write",
      "global_dogfood_metric_update",
      "external_action",
    ],
    authority_boundary: createNextWorkSignalRefreshAuthorityBoundaryV01(),
  };
}

export function createNextWorkSignalRefreshAuthorityBoundaryV01(): NextWorkSignalRefreshAuthorityBoundary {
  return {
    read_only: true,
    candidate_material_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_update_current_working_perspective: false,
    can_update_continuity_relay: false,
    can_mutate_handoff_context: false,
    can_send_handoff: false,
    can_write_memory: false,
    can_write_dogfood_metrics: false,
    can_write_reuse_outcome_ledger: false,
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
      "Next-work signal refresh is a candidate read model only.",
      "It prepares future Perspective, NextWorkBias, and relay review inputs without writing them.",
    ],
  };
}

function determineStatus({
  hasMetricMaterial,
  nextWorkSignalCount,
  blockedReasons,
  insufficientDataReasons,
}: {
  hasMetricMaterial: boolean;
  nextWorkSignalCount: number;
  blockedReasons: string[];
  insufficientDataReasons: string[];
}): NextWorkSignalRefreshPreviewStatus {
  if (!hasMetricMaterial) return "no_metric_material";
  if (blockedReasons.length > 0) return "insufficient_data";
  if (nextWorkSignalCount > 0 && insufficientDataReasons.length === 0) {
    return "ready_for_operator_review";
  }
  if (nextWorkSignalCount > 0) return "next_work_signals_available";
  return "insufficient_data";
}

function determineRecommendedNextAction(
  status: NextWorkSignalRefreshPreviewStatus,
): NextWorkSignalRefreshRecommendedNextAction {
  if (status === "no_metric_material") return "supply_metric_snapshot";
  if (status === "ready_for_operator_review") {
    return "prepare_perspective_next_work_candidate_preview";
  }
  if (status === "next_work_signals_available") {
    return "review_next_work_signal_candidates";
  }
  if (status === "keep_preview_only") return "keep_preview_only";
  return "review_next_work_signal_candidates";
}

function isDogfoodMetricSnapshotPreview(
  value: unknown,
): value is DogfoodMetricSnapshotPreview {
  return (
    isRecord(value) &&
    value.preview_version === DOGFOOD_METRIC_SNAPSHOT_PREVIEW_VERSION &&
    isRecord(value.aggregate_counts) &&
    isRecord(value.evidence_summary)
  );
}

function isDogfoodMetricSnapshotRecordReview(
  value: unknown,
): value is DogfoodMetricSnapshotRecordReview {
  return (
    isRecord(value) &&
    value.review_version === DOGFOOD_METRIC_SNAPSHOT_RECORD_REVIEW_VERSION &&
    isRecord(value.input_summary) &&
    isRecord(value.record_material_summary)
  );
}

function isReuseLedgerReview(
  value: unknown,
): value is ReuseOutcomeBridgeLedgerRecordReview {
  return (
    isRecord(value) &&
    value.review_version === REUSE_OUTCOME_BRIDGE_LEDGER_RECORD_REVIEW_VERSION &&
    isRecord(value.input_summary) &&
    isRecord(value.aggregate_counts)
  );
}

function isPerspectivePreview(value: unknown): boolean {
  return (
    isRecord(value) &&
    value.preview_version ===
      PERSPECTIVE_NEXT_WORK_CANDIDATE_UPDATE_PREVIEW_VERSION
  );
}

function isRelayPreview(value: unknown): boolean {
  return (
    isRecord(value) &&
    value.preview_version ===
      METRIC_INFORMED_CONTINUITY_RELAY_ADJUSTMENT_PREVIEW_VERSION
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
