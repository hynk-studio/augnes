import {
  isCandidateIngressPublicSafeRefV01,
  sanitizeCandidateIngressSummaryV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  EXPECTED_OBSERVED_DELTA_PREVIEW_VERSION,
  type ExpectedObservedDeltaPreview,
} from "@/types/expected-observed-delta-preview";
import {
  EXPECTED_OBSERVED_DELTA_RECORD_REVIEW_VERSION,
  type ExpectedObservedDeltaRecordReview,
} from "@/types/expected-observed-delta-record-review";
import {
  CODEX_RESULT_REPORT_INTAKE_RECORD_REVIEW_VERSION,
  type CodexResultReportIntakeRecordReview,
} from "@/types/codex-result-report-intake-record-review";
import {
  REUSE_OUTCOME_CANDIDATE_BRIDGE_PREVIEW_VERSION,
  type ReuseOutcomeCandidateBridgeAuthorityBoundary,
  type ReuseOutcomeCandidateBridgePreview,
  type ReuseOutcomeCandidateBridgePreviewInput,
  type ReuseOutcomeCandidateBridgePreviewStatus,
} from "@/types/reuse-outcome-candidate-bridge-preview";
import {
  WORK_EPISODE_RESIDUE_CANDIDATE_PREVIEW_VERSION,
  type WorkEpisodeResidueCandidatePreview,
} from "@/types/work-episode-residue-candidate-preview";

const DEFAULT_SCOPE = "project:augnes" as const;
const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;

export function buildReuseOutcomeCandidateBridgePreviewV01({
  expected_observed_delta_preview,
  expected_observed_delta_record_review,
  work_episode_residue_candidate_preview,
  codex_result_report_intake_record_review,
  scope,
  as_of,
  source_refs,
}: ReuseOutcomeCandidateBridgePreviewInput = {}): ReuseOutcomeCandidateBridgePreview {
  const deltaPreview = isExpectedObservedDeltaPreview(
    expected_observed_delta_preview,
  )
    ? expected_observed_delta_preview
    : null;
  const deltaRecordReview = isExpectedObservedDeltaRecordReview(
    expected_observed_delta_record_review,
  )
    ? expected_observed_delta_record_review
    : null;
  const residuePreview = isWorkEpisodeResidueCandidatePreview(
    work_episode_residue_candidate_preview,
  )
    ? work_episode_residue_candidate_preview
    : null;
  const codexRecordReview = isCodexResultReportIntakeRecordReview(
    codex_result_report_intake_record_review,
  )
    ? codex_result_report_intake_record_review
    : null;
  const sourceRefs = uniqueCandidateIngressStringsV01([
    REUSE_OUTCOME_CANDIDATE_BRIDGE_PREVIEW_VERSION,
    ...(source_refs ?? []),
    ...(deltaPreview?.source_refs ?? []),
    ...(deltaRecordReview?.source_refs ?? []),
    ...(residuePreview?.source_refs ?? []),
    ...(codexRecordReview?.source_refs ?? []),
  ]).filter(isCandidateIngressPublicSafeRefV01);
  const evidenceRefs = uniqueCandidateIngressStringsV01([
    ...(deltaPreview?.evidence_summary.evidence_refs ?? []),
    ...(deltaRecordReview?.evidence_summary.evidence_refs ?? []),
    ...(residuePreview?.evidence_summary.evidence_refs ?? []),
    ...(codexRecordReview?.evidence_summary.evidence_refs ?? []),
  ]).filter(isCandidateIngressPublicSafeRefV01);
  const classifications = buildClassifications({
    deltaPreview,
    deltaRecordReview,
    residuePreview,
    codexRecordReview,
  });
  const qualitySignals = buildQualitySignals({
    deltaPreview,
    deltaRecordReview,
    residuePreview,
    codexRecordReview,
  });
  const carryForward = {
    refs_to_preserve_next_time: classifications.helpful_refs,
    refs_to_warn_next_time: uniqueSafeSummaries([
      ...classifications.stale_refs,
      ...classifications.missing_refs,
      ...qualitySignals.skipped_or_unverified_checks,
      ...qualitySignals.not_done_items,
    ]),
    refs_to_drop_or_deprioritize: uniqueSafeSummaries([
      ...classifications.noisy_refs,
      ...classifications.misleading_refs,
    ]),
    unresolved_gaps: uniqueSafeSummaries([
      ...qualitySignals.expected_observed_mismatches,
      ...qualitySignals.requirement_progress_gaps,
      ...classifications.unknown_refs,
    ]),
    next_focus_candidates: uniqueSafeSummaries([
      ...qualitySignals.not_done_items,
      ...qualitySignals.requirement_progress_gaps,
      ...qualitySignals.context_feedback_signals,
    ]),
  };
  const deltaMaterialCount = countDeltaMaterial({ deltaPreview, deltaRecordReview });
  const bridgeCandidateCount =
    Object.values(classifications).reduce((sum, values) => sum + values.length, 0) +
    Object.values(qualitySignals).reduce((sum, values) => sum + values.length, 0);
  const blockedReasons = uniqueCandidateIngressStringsV01([
    ...(deltaPreview?.blocked_reasons ?? []),
    ...(deltaRecordReview?.blocked_reasons ?? []),
  ]);
  const insufficientDataReasons = uniqueCandidateIngressStringsV01([
    ...(deltaMaterialCount === 0 ? ["expected_observed_delta_material_missing"] : []),
    ...(bridgeCandidateCount === 0 ? ["reuse_outcome_bridge_candidate_material_missing"] : []),
    ...(bridgeCandidateCount > 0 && evidenceRefs.length === 0
      ? ["evidence_refs_missing_for_reuse_outcome_candidate_bridge"]
      : []),
  ]);
  const status = determineStatus({
    deltaMaterialCount,
    bridgeCandidateCount,
    blockedReasons,
    insufficientDataReasons,
  });

  return {
    preview_version: REUSE_OUTCOME_CANDIDATE_BRIDGE_PREVIEW_VERSION,
    scope:
      scope ??
      deltaPreview?.scope ??
      deltaRecordReview?.scope ??
      residuePreview?.scope ??
      codexRecordReview?.scope ??
      DEFAULT_SCOPE,
    as_of:
      as_of ??
      deltaPreview?.as_of ??
      deltaRecordReview?.as_of ??
      residuePreview?.as_of ??
      codexRecordReview?.as_of ??
      FALLBACK_AS_OF,
    source_refs: sourceRefs,
    bridge_preview_status: status,
    recommended_next_action:
      status === "ready_for_operator_review"
        ? "prepare_reuse_outcome_operator_decision"
        : status === "reuse_outcome_candidates_available"
          ? "review_reuse_outcome_candidates"
          : status === "no_delta_material"
            ? "review_expected_observed_delta"
            : status === "keep_preview_only"
              ? "keep_preview_only"
              : "supply_codex_result_report",
    input_summary: {
      has_expected_observed_delta_preview: Boolean(deltaPreview),
      has_expected_observed_delta_records:
        (deltaRecordReview?.input_summary.valid_record_count ?? 0) > 0,
      has_work_episode_residue_candidate_preview: Boolean(residuePreview),
      has_codex_result_report_intake_records:
        (codexRecordReview?.input_summary.valid_record_count ?? 0) > 0,
      delta_material_count: deltaMaterialCount,
      bridge_candidate_count: bridgeCandidateCount,
      blocker_count: blockedReasons.length,
      insufficient_data_count: insufficientDataReasons.length,
    },
    proposed_reuse_classifications: classifications,
    proposed_handoff_quality_signals: qualitySignals,
    carry_forward_candidates: carryForward,
    evidence_summary: {
      has_delta_material: deltaMaterialCount > 0,
      has_source_refs: sourceRefs.length > 0,
      has_evidence_refs: evidenceRefs.length > 0,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      missing_evidence:
        bridgeCandidateCount > 0 && evidenceRefs.length === 0
          ? ["evidence_refs_missing_for_reuse_outcome_candidate_bridge"]
          : [],
    },
    blocked_reasons: blockedReasons,
    insufficient_data_reasons: insufficientDataReasons,
    operator_review_checklist: [
      "review_reuse_outcome_candidates_as_candidate_material_only",
      "confirm_helpful_stale_missing_noisy_misleading_or_unknown_classifications",
      "confirm_skipped_checks_not_done_items_and_requirement_gaps_are_quality_signals",
      "confirm_bridge_does_not_write_handoff_reuse_outcome_ledger_or_dogfood_metrics",
      "confirm_bridge_does_not_mutate_memory_perspective_cwp_relay_or_handoff",
    ],
    would_not_write: [
      "does_not_write_handoff_reuse_outcome_ledger",
      "does_not_write_dogfood_metrics",
      "does_not_write_expected_observed_delta",
      "does_not_write_work_episode",
      "does_not_write_memory",
      "does_not_write_perspective_unit",
      "does_not_write_next_work_bias",
      "does_not_update_current_working_perspective",
      "does_not_update_continuity_relay",
      "does_not_mutate_handoff_context",
      "does_not_send_handoff",
      "does_not_call_provider_openai_github_or_codex",
    ],
    non_goals: [
      "handoff_reuse_outcome_ledger_write",
      "dogfood_metric_write",
      "expected_observed_delta_write",
      "work_episode_durable_write",
      "memory_write",
      "perspective_or_cwp_mutation",
      "continuity_relay_write",
      "handoff_context_apply_or_send",
      "provider_github_codex_call",
      "reuse_outcome_approval",
    ],
    authority_boundary:
      createReuseOutcomeCandidateBridgeAuthorityBoundaryV01(),
  };
}

export function createReuseOutcomeCandidateBridgeAuthorityBoundaryV01(): ReuseOutcomeCandidateBridgeAuthorityBoundary {
  return {
    read_only: true,
    candidate_material_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_write_reuse_outcome_ledger: false,
    can_write_dogfood_metrics: false,
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
    notes: [
      "Reuse outcome candidate bridge is read-only candidate material for a future HandoffReuseOutcomeLedger slice.",
      "It does not call writeOperatorApprovedHandoffReuseOutcomeLedger or write reuse ledger, dogfood metric, memory, Perspective, CWP, relay, handoff, provider, GitHub, or Codex state.",
    ],
  };
}

function buildClassifications({
  deltaPreview,
  deltaRecordReview,
  residuePreview,
  codexRecordReview,
}: {
  deltaPreview: ExpectedObservedDeltaPreview | null;
  deltaRecordReview: ExpectedObservedDeltaRecordReview | null;
  residuePreview: WorkEpisodeResidueCandidatePreview | null;
  codexRecordReview: CodexResultReportIntakeRecordReview | null;
}): ReuseOutcomeCandidateBridgePreview["proposed_reuse_classifications"] {
  return {
    helpful_refs: uniqueSafeSummaries([
      ...(deltaPreview?.delta_candidates.matched_expectation_candidates.map(
        (candidate) => candidate.summary,
      ) ?? []),
      ...(deltaPreview?.delta_candidates.context_reuse_signal_candidates.map(
        (candidate) => candidate.summary,
      ) ?? []),
      ...(residuePreview?.candidate_residue.context_reuse_signal_candidates.map(
        (candidate) => candidate.summary,
      ) ?? []),
      ...(codexRecordReview?.records.flatMap(
        (record) => record.context_reuse_signal_summary,
      ) ?? []),
    ]),
    stale_refs: uniqueSafeSummaries([
      ...(deltaPreview?.delta_candidates.missing_expectation_candidates.map(
        (candidate) => candidate.summary,
      ) ?? []),
      ...(deltaRecordReview?.records.flatMap(
        (record) => record.missing_expectations,
      ) ?? []),
    ]),
    missing_refs: uniqueSafeSummaries([
      ...(deltaPreview?.observed_summary.not_done_items ?? []),
      ...(deltaRecordReview?.records.flatMap((record) => record.not_done_items) ??
        []),
    ]),
    noisy_refs: uniqueSafeSummaries([
      ...(deltaPreview?.delta_candidates.unexpected_observation_candidates.map(
        (candidate) => candidate.summary,
      ) ?? []),
      ...(deltaRecordReview?.records.flatMap(
        (record) => record.unexpected_observations,
      ) ?? []),
    ]),
    misleading_refs: uniqueSafeSummaries([
      ...(deltaPreview?.delta_candidates.skipped_or_unverified_check_candidates.map(
        (candidate) => candidate.summary,
      ) ?? []),
      ...(deltaRecordReview?.records.flatMap(
        (record) => record.skipped_or_unverified_checks,
      ) ?? []),
    ]),
    unknown_refs: uniqueSafeSummaries([
      ...(deltaPreview?.delta_candidates.review_only_candidates.map(
        (candidate) => candidate.summary,
      ) ?? []),
    ]),
  };
}

function buildQualitySignals({
  deltaPreview,
  deltaRecordReview,
  residuePreview,
  codexRecordReview,
}: {
  deltaPreview: ExpectedObservedDeltaPreview | null;
  deltaRecordReview: ExpectedObservedDeltaRecordReview | null;
  residuePreview: WorkEpisodeResidueCandidatePreview | null;
  codexRecordReview: CodexResultReportIntakeRecordReview | null;
}): ReuseOutcomeCandidateBridgePreview["proposed_handoff_quality_signals"] {
  return {
    skipped_or_unverified_checks: uniqueSafeSummaries([
      ...(deltaPreview?.observed_summary.skipped_or_unverified_checks ?? []),
      ...(deltaRecordReview?.records.flatMap(
        (record) => record.skipped_or_unverified_checks,
      ) ?? []),
      ...(residuePreview?.candidate_residue.skipped_verification_candidates.map(
        (candidate) => candidate.summary,
      ) ?? []),
      ...(codexRecordReview?.records.flatMap(
        (record) => record.skipped_checks_summary,
      ) ?? []),
    ]),
    not_done_items: uniqueSafeSummaries([
      ...(deltaPreview?.observed_summary.not_done_items ?? []),
      ...(deltaRecordReview?.records.flatMap((record) => record.not_done_items) ??
        []),
      ...(residuePreview?.candidate_residue.not_done_candidates.map(
        (candidate) => candidate.summary,
      ) ?? []),
      ...(codexRecordReview?.records.flatMap((record) => record.not_done_summary) ??
        []),
    ]),
    expected_observed_mismatches: uniqueSafeSummaries([
      ...(deltaPreview?.delta_candidates.missing_expectation_candidates.map(
        (candidate) => candidate.summary,
      ) ?? []),
      ...(deltaPreview?.delta_candidates.unexpected_observation_candidates.map(
        (candidate) => candidate.summary,
      ) ?? []),
      ...(deltaRecordReview?.records.flatMap((record) => [
        ...record.missing_expectations,
        ...record.unexpected_observations,
      ]) ?? []),
    ]),
    requirement_progress_gaps: uniqueSafeSummaries([
      ...(deltaPreview?.delta_candidates.requirement_progress_delta_candidates.map(
        (candidate) => candidate.summary,
      ) ?? []),
      ...(deltaRecordReview?.records.flatMap(
        (record) => record.requirement_progress_deltas,
      ) ?? []),
      ...(codexRecordReview?.records.flatMap(
        (record) => record.requirement_progress_summary,
      ) ?? []),
    ]),
    context_feedback_signals: uniqueSafeSummaries([
      ...(deltaPreview?.delta_candidates.context_reuse_signal_candidates.map(
        (candidate) => candidate.summary,
      ) ?? []),
      ...(deltaRecordReview?.records.flatMap(
        (record) => record.context_reuse_signals,
      ) ?? []),
      ...(residuePreview?.candidate_residue.context_reuse_signal_candidates.map(
        (candidate) => candidate.summary,
      ) ?? []),
    ]),
  };
}

function countDeltaMaterial({
  deltaPreview,
  deltaRecordReview,
}: {
  deltaPreview: ExpectedObservedDeltaPreview | null;
  deltaRecordReview: ExpectedObservedDeltaRecordReview | null;
}): number {
  return (
    (deltaPreview?.input_summary.delta_candidate_count ?? 0) +
    (deltaRecordReview?.input_summary.valid_record_count ?? 0) +
    (deltaRecordReview?.input_summary.selected_delta_candidate_ref_count ?? 0)
  );
}

function determineStatus({
  deltaMaterialCount,
  bridgeCandidateCount,
  blockedReasons,
  insufficientDataReasons,
}: {
  deltaMaterialCount: number;
  bridgeCandidateCount: number;
  blockedReasons: string[];
  insufficientDataReasons: string[];
}): ReuseOutcomeCandidateBridgePreviewStatus {
  if (deltaMaterialCount === 0) return "no_delta_material";
  if (blockedReasons.length > 0) return "keep_preview_only";
  if (bridgeCandidateCount > 0 && insufficientDataReasons.length === 0) {
    return "ready_for_operator_review";
  }
  if (bridgeCandidateCount > 0) return "reuse_outcome_candidates_available";
  return "insufficient_data";
}

function uniqueSafeSummaries(values: unknown[]): string[] {
  return uniqueCandidateIngressStringsV01(
    values.map((value) => sanitizeCandidateIngressSummaryV01(value)),
  );
}

function isExpectedObservedDeltaPreview(
  value: unknown,
): value is ExpectedObservedDeltaPreview {
  return (
    isRecord(value) &&
    value.preview_version === EXPECTED_OBSERVED_DELTA_PREVIEW_VERSION &&
    isRecord(value.delta_candidates) &&
    isRecord(value.input_summary)
  );
}

function isExpectedObservedDeltaRecordReview(
  value: unknown,
): value is ExpectedObservedDeltaRecordReview {
  return (
    isRecord(value) &&
    value.review_version === EXPECTED_OBSERVED_DELTA_RECORD_REVIEW_VERSION &&
    Array.isArray(value.records) &&
    isRecord(value.input_summary)
  );
}

function isWorkEpisodeResidueCandidatePreview(
  value: unknown,
): value is WorkEpisodeResidueCandidatePreview {
  return (
    isRecord(value) &&
    value.preview_version === WORK_EPISODE_RESIDUE_CANDIDATE_PREVIEW_VERSION &&
    isRecord(value.candidate_residue) &&
    isRecord(value.input_summary)
  );
}

function isCodexResultReportIntakeRecordReview(
  value: unknown,
): value is CodexResultReportIntakeRecordReview {
  return (
    isRecord(value) &&
    value.review_version === CODEX_RESULT_REPORT_INTAKE_RECORD_REVIEW_VERSION &&
    Array.isArray(value.records) &&
    isRecord(value.input_summary)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
