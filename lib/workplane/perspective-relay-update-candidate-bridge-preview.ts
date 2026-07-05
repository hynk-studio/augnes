import {
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import { DOGFOOD_METRIC_SNAPSHOT_RECORD_REVIEW_VERSION } from "@/types/dogfood-metric-snapshot-record-review";
import { METRIC_INFORMED_CONTINUITY_RELAY_ADJUSTMENT_PREVIEW_VERSION } from "@/types/metric-informed-continuity-relay-adjustment-preview";
import { NEXT_WORK_SIGNAL_OPERATOR_DECISION_PREVIEW_VERSION } from "@/types/next-work-signal-decision";
import {
  NEXT_WORK_SIGNAL_DECISION_RECORD_REVIEW_VERSION,
  type NextWorkSignalDecisionRecordReview,
} from "@/types/next-work-signal-decision-record-review";
import { NEXT_WORK_SIGNAL_REFRESH_PREVIEW_VERSION } from "@/types/next-work-signal-refresh-preview";
import {
  PERSPECTIVE_RELAY_UPDATE_CANDIDATE_BRIDGE_PREVIEW_VERSION,
  type PerspectiveRelayUpdateCandidateBridgeAuthorityBoundary,
  type PerspectiveRelayUpdateCandidateBridgePreview,
  type PerspectiveRelayUpdateCandidateBridgePreviewInput,
  type PerspectiveRelayUpdateCandidateBridgeRecommendedNextAction,
  type PerspectiveRelayUpdateCandidateBridgeStatus,
} from "@/types/perspective-relay-update-candidate-bridge-preview";
import { PERSPECTIVE_NEXT_WORK_CANDIDATE_UPDATE_PREVIEW_VERSION } from "@/types/perspective-next-work-candidate-update-preview";

const DEFAULT_SCOPE = "project:augnes" as const;
const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;

export function buildPerspectiveRelayUpdateCandidateBridgePreviewV01({
  next_work_signal_decision_preview,
  next_work_signal_decision_record_review,
  next_work_signal_refresh_preview,
  dogfood_metric_snapshot_record_review,
  existing_perspective_next_work_candidate_update_preview,
  existing_metric_informed_continuity_relay_adjustment_preview,
  scope,
  as_of,
  source_refs,
}: PerspectiveRelayUpdateCandidateBridgePreviewInput = {}): PerspectiveRelayUpdateCandidateBridgePreview {
  const decisionPreview = isRecord(next_work_signal_decision_preview) &&
    next_work_signal_decision_preview.preview_version ===
      NEXT_WORK_SIGNAL_OPERATOR_DECISION_PREVIEW_VERSION
    ? next_work_signal_decision_preview
    : null;
  const recordReview = isNextWorkSignalDecisionRecordReview(
    next_work_signal_decision_record_review,
  )
    ? next_work_signal_decision_record_review
    : null;
  const refreshPreview = isRecord(next_work_signal_refresh_preview) &&
    next_work_signal_refresh_preview.preview_version ===
      NEXT_WORK_SIGNAL_REFRESH_PREVIEW_VERSION
    ? next_work_signal_refresh_preview
    : null;
  const metricReview = isRecord(dogfood_metric_snapshot_record_review) &&
    dogfood_metric_snapshot_record_review.review_version ===
      DOGFOOD_METRIC_SNAPSHOT_RECORD_REVIEW_VERSION
    ? dogfood_metric_snapshot_record_review
    : null;
  const perspectivePreview = isRecord(
    existing_perspective_next_work_candidate_update_preview,
  ) &&
    existing_perspective_next_work_candidate_update_preview.preview_version ===
      PERSPECTIVE_NEXT_WORK_CANDIDATE_UPDATE_PREVIEW_VERSION;
  const relayPreview = isRecord(
    existing_metric_informed_continuity_relay_adjustment_preview,
  ) &&
    existing_metric_informed_continuity_relay_adjustment_preview.preview_version ===
      METRIC_INFORMED_CONTINUITY_RELAY_ADJUSTMENT_PREVIEW_VERSION;
  const sourceRefs = uniqueCandidateIngressStringsV01([
    PERSPECTIVE_RELAY_UPDATE_CANDIDATE_BRIDGE_PREVIEW_VERSION,
    ...(source_refs ?? []),
    ...safeArray(decisionPreview?.source_refs),
    ...(recordReview?.source_refs ?? []),
    ...safeArray(refreshPreview?.source_refs),
    ...safeArray(metricReview?.source_refs),
    ...(perspectivePreview ? [PERSPECTIVE_NEXT_WORK_CANDIDATE_UPDATE_PREVIEW_VERSION] : []),
    ...(relayPreview ? [METRIC_INFORMED_CONTINUITY_RELAY_ADJUSTMENT_PREVIEW_VERSION] : []),
  ]).filter(isCandidateIngressPublicSafeRefV01);
  const decisionEvidenceSummary = isRecord(decisionPreview?.evidence_summary)
    ? decisionPreview.evidence_summary
    : null;
  const refreshEvidenceSummary = isRecord(refreshPreview?.evidence_summary)
    ? refreshPreview.evidence_summary
    : null;
  const metricEvidenceSummary = isRecord(metricReview?.evidence_summary)
    ? metricReview.evidence_summary
    : null;
  const evidenceRefs = uniqueCandidateIngressStringsV01([
    ...safeArray(decisionEvidenceSummary?.evidence_refs),
    ...(recordReview?.evidence_summary.evidence_refs ?? []),
    ...safeArray(refreshEvidenceSummary?.evidence_refs),
    ...safeArray(metricEvidenceSummary?.evidence_refs),
  ]).filter(isCandidateIngressPublicSafeRefV01);
  const decisionWriteReadiness = isRecord(decisionPreview?.write_readiness)
    ? decisionPreview.write_readiness
    : null;
  const material = collectSignalMaterial({
    decisionPreview,
    recordReview,
    refreshPreview,
  });
  const candidateMaterialCount = Object.values(material).reduce(
    (total, list) => total + list.length,
    0,
  );
  const blockedReasons = uniqueCandidateIngressStringsV01([
    ...safeArray(decisionPreview?.blocking_reasons),
    ...(recordReview?.blocked_reasons ?? []),
    ...safeArray(refreshPreview?.blocked_reasons),
  ]);
  const insufficientDataReasons = uniqueCandidateIngressStringsV01([
    ...(!decisionPreview && !recordReview
      ? ["next_work_signal_decision_material_missing"]
      : []),
    ...safeArray(decisionWriteReadiness?.current_insufficient_data),
    ...(recordReview?.insufficient_data_reasons ?? []),
    ...safeArray(refreshPreview?.insufficient_data_reasons),
    ...(candidateMaterialCount === 0 ? ["perspective_relay_update_candidates_missing"] : []),
  ]);
  const status = determineStatus({
    hasMaterial: Boolean(decisionPreview || recordReview),
    candidateMaterialCount,
    blockedReasons,
    insufficientDataReasons,
  });

  return {
    preview_version: PERSPECTIVE_RELAY_UPDATE_CANDIDATE_BRIDGE_PREVIEW_VERSION,
    scope: scope ?? recordReview?.scope ?? (decisionPreview?.scope as string | undefined) ?? DEFAULT_SCOPE,
    as_of: as_of ?? recordReview?.as_of ?? (decisionPreview?.as_of as string | undefined) ?? FALLBACK_AS_OF,
    source_refs: sourceRefs,
    bridge_preview_status: status,
    recommended_next_action: determineRecommendedNextAction(status),
    input_summary: {
      has_next_work_signal_decision_preview: Boolean(decisionPreview),
      has_next_work_signal_decision_records:
        (recordReview?.input_summary.valid_record_count ?? 0) > 0,
      has_next_work_signal_refresh_preview: Boolean(refreshPreview),
      candidate_material_count: candidateMaterialCount,
      blocker_count: blockedReasons.length,
      insufficient_data_count: insufficientDataReasons.length,
    },
    proposed_perspective_unit_candidates: {
      reinforce_candidates: material.preserve,
      weaken_or_warn_candidates: material.warn,
      retire_or_deprioritize_candidates: material.drop,
      split_or_review_candidates: [
        ...material.expectedObserved,
        ...material.reviewBurden,
      ],
    },
    proposed_next_work_bias_candidates: {
      preserve_next_time: material.preserve,
      warn_next_time: material.warn,
      drop_or_deprioritize: material.drop,
      verification_bias: material.verification,
      context_diet_bias: material.contextDiet,
      handoff_quality_bias: material.handoffQuality,
    },
    proposed_continuity_relay_candidates: {
      preserve_anchor_candidates: material.preserve,
      warn_anchor_candidates: material.warn,
      stop_if_missing_candidates: [
        ...material.drop,
        ...material.expectedObserved.filter((item) => /missing|gap/i.test(item)),
      ],
      next_focus_candidates: [
        ...material.verification,
        ...material.expectedObserved,
        ...material.handoffQuality,
      ],
      relay_update_suggestions: [
        ...material.contextDiet,
        ...material.reviewBurden,
      ],
    },
    evidence_summary: {
      has_next_work_signal_material: Boolean(decisionPreview || recordReview),
      has_source_refs: sourceRefs.length > 0,
      has_evidence_refs: evidenceRefs.length > 0,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      missing_evidence:
        evidenceRefs.length === 0 ? ["next_work_signal_evidence_refs_missing"] : [],
    },
    blocked_reasons: blockedReasons,
    insufficient_data_reasons: insufficientDataReasons,
    operator_review_checklist: [
      "review_next_work_signal_decision_before_perspective_or_relay_candidates",
      "confirm_stale_missing_misleading_context_is_warned_or_deprioritized",
      "confirm_skipped_checks_and_not_done_items_are_verification_pressure",
      "confirm_bridge_does_not_write_perspective_nextworkbias_cwp_relay_handoff_or_memory",
    ],
    would_not_write: [
      "does_not_write_perspective_unit",
      "does_not_write_next_work_bias",
      "does_not_mutate_current_working_perspective",
      "does_not_update_continuity_relay",
      "does_not_mutate_or_send_handoff",
      "does_not_write_memory_metrics_or_upstream_ledgers",
      "does_not_call_provider_github_or_codex",
    ],
    non_goals: [
      "perspective_unit_write",
      "next_work_bias_write",
      "cwp_mutation",
      "continuity_relay_write",
      "handoff_apply_or_send",
      "memory_write",
      "metrics_or_upstream_ledger_write",
      "external_action",
    ],
    authority_boundary: createPerspectiveRelayUpdateCandidateBridgeAuthorityBoundaryV01(),
  };
}

export function createPerspectiveRelayUpdateCandidateBridgeAuthorityBoundaryV01(): PerspectiveRelayUpdateCandidateBridgeAuthorityBoundary {
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
    can_write_expected_observed_delta: false,
    can_write_work_episode: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    notes: [
      "Bridge preview prepares future Perspective, NextWorkBias, and continuity relay candidate material only.",
      "It cannot write Perspective, CWP, relay, handoff, memory, metrics, upstream ledgers, or external action state.",
    ],
  };
}

function collectSignalMaterial({
  decisionPreview,
  recordReview,
  refreshPreview,
}: {
  decisionPreview: Record<string, unknown> | null;
  recordReview: NextWorkSignalDecisionRecordReview | null;
  refreshPreview: Record<string, unknown> | null;
}) {
  const wouldWrite = isRecord(
    decisionPreview?.would_write_next_work_signal_record_preview,
  )
    ? decisionPreview.would_write_next_work_signal_record_preview
    : null;
  const latestRecord = recordReview?.records[0] ?? null;
  const refreshSignals = isRecord(refreshPreview?.proposed_next_work_signals)
    ? refreshPreview.proposed_next_work_signals
    : null;
  return {
    preserve: uniqueCandidateIngressStringsV01([
      ...safeArray(wouldWrite?.preserve_context_refs),
      ...(latestRecord?.preserve_context_refs ?? []),
      ...safeArray(refreshSignals?.preserve_context_refs),
    ]),
    warn: uniqueCandidateIngressStringsV01([
      ...safeArray(wouldWrite?.warn_context_refs),
      ...(latestRecord?.warn_context_refs ?? []),
      ...safeArray(refreshSignals?.warn_context_refs),
    ]),
    drop: uniqueCandidateIngressStringsV01([
      ...safeArray(wouldWrite?.drop_or_deprioritize_context_refs),
      ...(latestRecord?.drop_or_deprioritize_context_refs ?? []),
      ...safeArray(refreshSignals?.drop_or_deprioritize_context_refs),
    ]),
    verification: uniqueCandidateIngressStringsV01([
      ...safeArray(wouldWrite?.verification_focus_candidates),
      ...(latestRecord?.verification_focus_candidates ?? []),
      ...safeArray(refreshSignals?.verification_focus_candidates),
    ]),
    expectedObserved: uniqueCandidateIngressStringsV01([
      ...safeArray(wouldWrite?.expected_observed_followup_candidates),
      ...(latestRecord?.expected_observed_followup_candidates ?? []),
      ...safeArray(refreshSignals?.expected_observed_followup_candidates),
    ]),
    handoffQuality: uniqueCandidateIngressStringsV01([
      ...safeArray(wouldWrite?.handoff_quality_focus_candidates),
      ...(latestRecord?.handoff_quality_focus_candidates ?? []),
      ...safeArray(refreshSignals?.handoff_quality_focus_candidates),
    ]),
    contextDiet: uniqueCandidateIngressStringsV01([
      ...safeArray(wouldWrite?.context_diet_candidates),
      ...(latestRecord?.context_diet_candidates ?? []),
      ...safeArray(refreshSignals?.context_diet_candidates),
    ]),
    reviewBurden: uniqueCandidateIngressStringsV01([
      ...safeArray(wouldWrite?.review_burden_reduction_candidates),
      ...(latestRecord?.review_burden_reduction_candidates ?? []),
      ...safeArray(refreshSignals?.review_burden_reduction_candidates),
    ]),
  };
}

function determineStatus({
  hasMaterial,
  candidateMaterialCount,
  blockedReasons,
  insufficientDataReasons,
}: {
  hasMaterial: boolean;
  candidateMaterialCount: number;
  blockedReasons: string[];
  insufficientDataReasons: string[];
}): PerspectiveRelayUpdateCandidateBridgeStatus {
  if (!hasMaterial) return "no_next_work_signal_material";
  if (blockedReasons.length > 0) return "insufficient_data";
  if (candidateMaterialCount > 0 && insufficientDataReasons.length === 0) {
    return "ready_for_operator_review";
  }
  if (candidateMaterialCount > 0) return "update_candidates_available";
  return "insufficient_data";
}

function determineRecommendedNextAction(
  status: PerspectiveRelayUpdateCandidateBridgeStatus,
): PerspectiveRelayUpdateCandidateBridgeRecommendedNextAction {
  if (status === "no_next_work_signal_material") {
    return "supply_next_work_signal_decision";
  }
  if (status === "ready_for_operator_review") {
    return "review_perspective_relay_update_candidates";
  }
  if (status === "update_candidates_available") {
    return "review_perspective_relay_update_candidates";
  }
  if (status === "keep_preview_only") return "keep_preview_only";
  return "supply_next_work_signal_decision";
}

function isNextWorkSignalDecisionRecordReview(
  value: unknown,
): value is NextWorkSignalDecisionRecordReview {
  return (
    isRecord(value) &&
    value.review_version === NEXT_WORK_SIGNAL_DECISION_RECORD_REVIEW_VERSION &&
    Array.isArray(value.records) &&
    isRecord(value.input_summary)
  );
}

function safeArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === "string" && isCandidateIngressPublicSafeRefV01(item),
      )
    : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
