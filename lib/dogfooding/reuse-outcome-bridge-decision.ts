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
  HANDOFF_REUSE_OUTCOME_LEDGER_RECORD_VERSION,
  HANDOFF_REUSE_OUTCOME_LEDGER_STORE_VERSION,
  HANDOFF_REUSE_OUTCOME_LEDGER_WRITE_RECEIPT_VERSION,
} from "@/types/handoff-reuse-outcome-ledger";
import {
  REUSE_OUTCOME_BRIDGE_OPERATOR_DECISION_PREVIEW_VERSION,
  type ReuseOutcomeBridgeAvailableOperatorDecision,
  type ReuseOutcomeBridgeCandidateSummary,
  type ReuseOutcomeBridgeOperatorDecisionAuthorityBoundary,
  type ReuseOutcomeBridgeOperatorDecisionPreview,
  type ReuseOutcomeBridgeOperatorDecisionPreviewInput,
  type ReuseOutcomeBridgeOperatorDecisionPreviewStatus,
  type ReuseOutcomeBridgeRecommendedOperatorDecision,
  type ReuseOutcomeBridgeSourceStatus,
  type ReuseOutcomeBridgeWouldWriteLedgerRecordPreview,
  type ReuseOutcomeBridgeWriteReadiness,
} from "@/types/reuse-outcome-bridge-decision";
import {
  REUSE_OUTCOME_CANDIDATE_BRIDGE_PREVIEW_VERSION,
  type ReuseOutcomeCandidateBridgePreview,
} from "@/types/reuse-outcome-candidate-bridge-preview";

const DEFAULT_SCOPE = "project:augnes" as const;
const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;
const AVAILABLE_OPERATOR_DECISIONS: ReuseOutcomeBridgeAvailableOperatorDecision[] =
  [
    "approve_for_reuse_outcome_ledger_write",
    "defer",
    "reject",
    "keep_candidate",
    "request_more_evidence",
  ];

export function buildReuseOutcomeBridgeOperatorDecisionPreviewV01({
  reuse_outcome_candidate_bridge_preview,
  expected_observed_delta_record_review,
  expected_observed_delta_preview,
  selected_reuse_candidate_refs,
  requested_operator_ref,
  requested_idempotency_key,
  review_confirmation_ref,
  as_of,
  scope,
  source_refs,
}: ReuseOutcomeBridgeOperatorDecisionPreviewInput = {}): ReuseOutcomeBridgeOperatorDecisionPreview {
  const bridgePreview = isReuseOutcomeCandidateBridgePreview(
    reuse_outcome_candidate_bridge_preview,
  )
    ? reuse_outcome_candidate_bridge_preview
    : null;
  const bridgeWrongVersion =
    isRecord(reuse_outcome_candidate_bridge_preview) &&
    reuse_outcome_candidate_bridge_preview.preview_version !==
      REUSE_OUTCOME_CANDIDATE_BRIDGE_PREVIEW_VERSION;
  const deltaRecordReview = isExpectedObservedDeltaRecordReview(
    expected_observed_delta_record_review,
  )
    ? expected_observed_delta_record_review
    : null;
  const deltaRecordReviewWrongVersion =
    isRecord(expected_observed_delta_record_review) &&
    expected_observed_delta_record_review.review_version !==
      EXPECTED_OBSERVED_DELTA_RECORD_REVIEW_VERSION;
  const deltaPreview = isExpectedObservedDeltaPreview(
    expected_observed_delta_preview,
  )
    ? expected_observed_delta_preview
    : null;
  const deltaPreviewWrongVersion =
    isRecord(expected_observed_delta_preview) &&
    expected_observed_delta_preview.preview_version !==
      EXPECTED_OBSERVED_DELTA_PREVIEW_VERSION;
  const sourceRefs = uniqueCandidateIngressStringsV01([
    REUSE_OUTCOME_BRIDGE_OPERATOR_DECISION_PREVIEW_VERSION,
    ...(source_refs ?? []),
    ...(bridgePreview?.source_refs ?? []),
    ...(deltaRecordReview?.source_refs ?? []),
    ...(deltaPreview?.source_refs ?? []),
  ]).filter(isCandidateIngressPublicSafeRefV01);
  const evidenceRefs = uniqueCandidateIngressStringsV01([
    ...(bridgePreview?.evidence_summary.evidence_refs ?? []),
    ...(deltaRecordReview?.evidence_summary.evidence_refs ?? []),
    ...(deltaPreview?.evidence_summary.evidence_refs ?? []),
  ]).filter(isCandidateIngressPublicSafeRefV01);
  const candidateSummaries = buildCandidateSummaries(bridgePreview, evidenceRefs);
  const selectableRefs = candidateSummaries.map((candidate) => candidate.candidate_ref);
  const selectedRefsRaw = selected_reuse_candidate_refs ?? [];
  const selectedRefs = uniqueCandidateIngressStringsV01(selectedRefsRaw);
  const selectedSummaries = candidateSummaries.filter((candidate) =>
    selectedRefs.includes(candidate.candidate_ref),
  );
  const deltaRefs = buildDeltaRefs({ deltaPreview, deltaRecordReview });
  const blockingReasons = uniqueCandidateIngressStringsV01([
    ...(bridgeWrongVersion ? ["reuse_outcome_bridge_preview_version_invalid"] : []),
    ...(deltaRecordReviewWrongVersion
      ? ["expected_observed_delta_record_review_version_invalid"]
      : []),
    ...(deltaPreviewWrongVersion
      ? ["expected_observed_delta_preview_version_invalid"]
      : []),
    ...(bridgePreview?.blocked_reasons ?? []),
    ...(!bridgePreview ? ["reuse_outcome_bridge_preview_missing"] : []),
    ...(bridgePreview && !hasReadOnlyBridgeAuthority(bridgePreview)
      ? ["reuse_outcome_bridge_authority_boundary_invalid"]
      : []),
  ]);
  const refusalReasons = uniqueCandidateIngressStringsV01([
    ...selectedRefsRaw
      .filter((ref) => !isCandidateIngressPublicSafeRefV01(ref))
      .map(() => "selected_reuse_candidate_refs_unsafe"),
    ...selectedRefs
      .filter((ref) => !selectableRefs.includes(ref))
      .map(() => "selected_reuse_candidate_refs_not_in_bridge_preview"),
    ...(requested_operator_ref && !safeRef(requested_operator_ref)
      ? ["requested_operator_ref_unsafe"]
      : []),
    ...(requested_idempotency_key && !safeRef(requested_idempotency_key)
      ? ["requested_idempotency_key_unsafe"]
      : []),
    ...(review_confirmation_ref && !safeRef(review_confirmation_ref)
      ? ["review_confirmation_ref_unsafe"]
      : []),
  ]);
  const missingEvidence = uniqueCandidateIngressStringsV01([
    ...(bridgePreview?.evidence_summary.missing_evidence ?? []),
    ...(deltaRecordReview?.evidence_summary.missing_evidence ?? []),
    ...(bridgePreview && candidateSummaries.length > 0 && evidenceRefs.length === 0
      ? ["reuse_outcome_bridge_evidence_refs_missing"]
      : []),
    ...(deltaRefs.delta_material_count === 0
      ? ["expected_observed_delta_material_missing"]
      : []),
    ...(!deltaRefs.result_ref ? ["result_ref_missing"] : []),
    ...(!deltaRefs.work_ref ? ["work_ref_missing"] : []),
    ...(!deltaRefs.handoff_ref ? ["handoff_ref_missing"] : []),
  ]);
  const insufficientData = uniqueCandidateIngressStringsV01([
    ...(candidateSummaries.length === 0 ? ["reuse_candidate_material_missing"] : []),
    ...(bridgePreview &&
    bridgePreview.bridge_preview_status !== "ready_for_operator_review" &&
    bridgePreview.bridge_preview_status !== "reuse_outcome_candidates_available"
      ? [`bridge_preview_status:${bridgePreview.bridge_preview_status}`]
      : []),
    ...(selectedRefs.length === 0 ? ["selected_reuse_candidate_refs_missing"] : []),
    ...(!requested_operator_ref ? ["operator_ref_missing"] : []),
    ...(!requested_idempotency_key ? ["idempotency_key_missing"] : []),
    ...(!review_confirmation_ref ? ["review_confirmation_ref_missing"] : []),
    ...(sourceRefs.length === 0 ? ["source_refs_missing"] : []),
    ...(evidenceRefs.length === 0 ? ["evidence_refs_missing"] : []),
  ]);
  const writeReadiness = buildWriteReadiness({
    blockingReasons,
    missingEvidence,
    refusalReasons,
    insufficientData,
  });
  const status = determineStatus({
    bridgePreview,
    bridgeWrongVersion,
    writeReadiness,
    candidateSummaries,
    selectedRefs,
  });
  const recommendedDecision = determineRecommendedDecision({
    status,
    missingEvidence,
    insufficientData,
    refusalReasons,
    blockingReasons,
  });
  const wouldWritePreview = buildWouldWritePreview({
    bridgePreview,
    candidateSummaries,
    selectedSummaries,
    selectableRefs,
    selectedRefs,
    sourceRefs,
    evidenceRefs,
    deltaRefs,
    requested_operator_ref,
    requested_idempotency_key,
    review_confirmation_ref,
  });

  return {
    runtime: "augnes",
    preview_version: REUSE_OUTCOME_BRIDGE_OPERATOR_DECISION_PREVIEW_VERSION,
    scope:
      scope ??
      bridgePreview?.scope ??
      deltaRecordReview?.scope ??
      deltaPreview?.scope ??
      DEFAULT_SCOPE,
    as_of:
      as_of ??
      bridgePreview?.as_of ??
      deltaRecordReview?.as_of ??
      deltaPreview?.as_of ??
      FALLBACK_AS_OF,
    source_refs: sourceRefs,
    decision_preview_status: status,
    recommended_operator_decision: recommendedDecision,
    available_operator_decisions: AVAILABLE_OPERATOR_DECISIONS,
    input_summary: {
      has_bridge_preview: Boolean(bridgePreview),
      bridge_candidate_count: candidateSummaries.length,
      selectable_reuse_candidate_ref_count: selectableRefs.length,
      selected_reuse_candidate_ref_count: selectedRefs.length,
      would_write_reuse_candidate_count: selectedSummaries.length,
      delta_material_count: deltaRefs.delta_material_count,
      blocker_count: blockingReasons.length,
      missing_evidence_count: missingEvidence.length,
      refusal_reason_count: refusalReasons.length,
    },
    bridge_preview_refs: {
      preview_version: bridgePreview?.preview_version ?? null,
      bridge_preview_status: bridgePreview?.bridge_preview_status ?? null,
      source_refs: bridgePreview?.source_refs ?? [],
    },
    delta_refs: {
      expected_observed_delta_preview_ref: deltaPreview
        ? EXPECTED_OBSERVED_DELTA_PREVIEW_VERSION
        : null,
      expected_observed_delta_record_refs: deltaRefs.record_refs,
      selected_expected_observed_delta_record_id:
        deltaRecordReview?.selected_record_summary?.record_id ?? null,
      latest_expected_observed_delta_record_id:
        deltaRecordReview?.latest_record_summary?.record_id ?? null,
      work_ref: deltaRefs.work_ref,
      result_ref: deltaRefs.result_ref,
      handoff_ref: deltaRefs.handoff_ref,
    },
    source_status: {
      bridge_preview: bridgePreview
        ? "supplied"
        : bridgeWrongVersion
          ? "wrong_version"
          : "missing",
      expected_observed_delta_preview: deltaPreview
        ? "supplied"
        : deltaPreviewWrongVersion
          ? "wrong_version"
          : "missing",
      expected_observed_delta_record_review: deltaRecordReview
        ? "supplied"
        : deltaRecordReviewWrongVersion
          ? "wrong_version"
          : "missing",
      delta_material: deltaRefs.delta_material_count > 0 ? "supplied" : "missing",
      reuse_candidates: candidateSummaries.length > 0 ? "supplied" : "missing",
    },
    write_readiness: writeReadiness,
    approval_requirements: buildApprovalRequirements(),
    blocking_reasons: blockingReasons,
    missing_evidence: missingEvidence,
    refusal_reasons: refusalReasons,
    evidence_summary: {
      has_bridge_preview: Boolean(bridgePreview),
      has_candidate_material: candidateSummaries.length > 0,
      has_delta_material: deltaRefs.delta_material_count > 0,
      has_expected_observed_delta_records:
        (deltaRecordReview?.input_summary.valid_record_count ?? 0) > 0,
      has_selected_reuse_refs: selectedRefs.length > 0,
      has_source_refs: sourceRefs.length > 0,
      has_evidence_refs: evidenceRefs.length > 0,
      has_skipped_or_unverified_checks:
        (bridgePreview?.proposed_handoff_quality_signals
          .skipped_or_unverified_checks.length ?? 0) > 0,
      has_not_done_items:
        (bridgePreview?.proposed_handoff_quality_signals.not_done_items.length ??
          0) > 0,
      has_expected_observed_mismatches:
        (bridgePreview?.proposed_handoff_quality_signals
          .expected_observed_mismatches.length ?? 0) > 0,
      has_requirement_progress_gaps:
        (bridgePreview?.proposed_handoff_quality_signals
          .requirement_progress_gaps.length ?? 0) > 0,
      evidence_refs: evidenceRefs,
      source_refs: sourceRefs,
      missing_evidence: missingEvidence,
    },
    would_write_reuse_ledger_record_preview: wouldWritePreview,
    candidate_carry_forward: wouldWritePreview.carry_forward_candidates,
    review_checklist: [
      "confirm_reuse_outcome_bridge_candidates_are_operator_reviewed",
      "confirm_selected_reuse_refs_are_from_canonical_selectable_refs",
      "confirm_expected_observed_delta_record_material_is_present",
      "confirm_skipped_checks_not_done_items_and_mismatches_are_not_success",
      "confirm_write_targets_existing_handoff_reuse_outcome_ledger_store_only",
      "confirm_no_dogfood_metric_memory_perspective_cwp_relay_or_handoff_write",
    ],
    would_not_write: [
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
      "dogfood_metric_write",
      "expected_observed_delta_write",
      "work_episode_durable_write",
      "memory_write",
      "perspective_or_cwp_mutation",
      "continuity_relay_write",
      "handoff_context_apply_or_send",
      "provider_github_codex_call",
      "automatic_reuse_outcome_promotion",
    ],
    authority_boundary: createReuseOutcomeBridgeOperatorDecisionAuthorityBoundaryV01(),
    fallback_reason: buildFallbackReason({
      status,
      blockingReasons,
      missingEvidence,
      insufficientData,
      refusalReasons,
    }),
    notes: [
      "This decision preview consumes the already-built Reuse Outcome Candidate Bridge and ExpectedObservedDelta review material.",
      "It does not write the reuse ledger; only a separate operator-approved bridge ledger adapter may write the existing HandoffReuseOutcomeLedger record kind.",
    ],
  };
}

export function createReuseOutcomeBridgeOperatorDecisionAuthorityBoundaryV01(): ReuseOutcomeBridgeOperatorDecisionAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_persist_decision: false,
    can_write_db: false,
    can_write_handoff_reuse_ledger: false,
    can_write_dogfood_ledger: false,
    can_write_dogfood_metrics: false,
    can_write_expected_observed_delta: false,
    can_write_work_episode: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_apply_project_perspective: false,
    can_create_promotion_decision: false,
    can_create_formation_receipt: false,
    can_update_current_working_perspective: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_update_continuity_relay: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context: false,
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
      "Read-only operator decision preview for bridge-derived reuse outcome candidates.",
      "No durable ledger, metric, memory, Perspective, CWP, relay, handoff, provider, GitHub, Codex, PR, autonomous, graph/vector/RAG, crawler, or browser observer authority is present.",
    ],
  };
}

function buildCandidateSummaries(
  preview: ReuseOutcomeCandidateBridgePreview | null,
  evidenceRefs: string[],
): ReuseOutcomeBridgeCandidateSummary[] {
  if (!preview) return [];
  const candidates: ReuseOutcomeBridgeCandidateSummary[] = [];
  const pushMany = (
    bucket: ReuseOutcomeBridgeCandidateSummary["bucket"],
    candidateKind: ReuseOutcomeBridgeCandidateSummary["candidate_kind"],
    values: string[],
  ) => {
    values.forEach((value, index) => {
      const summary = sanitizeCandidateIngressSummaryV01(value);
      if (!summary) return;
      candidates.push({
        candidate_ref: `reuse-outcome-bridge:${bucket}:${index + 1}`,
        candidate_kind: candidateKind,
        bucket,
        label: `${bucket}:${index + 1}`,
        summary,
        evidence_refs: evidenceRefs,
      });
    });
  };
  pushMany("helpful_refs", "helpful_ref", preview.proposed_reuse_classifications.helpful_refs);
  pushMany("stale_refs", "stale_ref", preview.proposed_reuse_classifications.stale_refs);
  pushMany("missing_refs", "missing_ref", preview.proposed_reuse_classifications.missing_refs);
  pushMany("noisy_refs", "noisy_ref", preview.proposed_reuse_classifications.noisy_refs);
  pushMany(
    "misleading_refs",
    "misleading_ref",
    preview.proposed_reuse_classifications.misleading_refs,
  );
  pushMany("unknown_refs", "unknown_ref", preview.proposed_reuse_classifications.unknown_refs);
  pushMany(
    "skipped_or_unverified_check_signals",
    "skipped_or_unverified_check_signal",
    preview.proposed_handoff_quality_signals.skipped_or_unverified_checks,
  );
  pushMany(
    "not_done_signals",
    "not_done_signal",
    preview.proposed_handoff_quality_signals.not_done_items,
  );
  pushMany(
    "expected_observed_mismatch_signals",
    "expected_observed_mismatch_signal",
    preview.proposed_handoff_quality_signals.expected_observed_mismatches,
  );
  pushMany(
    "requirement_progress_gaps",
    "requirement_progress_gap",
    preview.proposed_handoff_quality_signals.requirement_progress_gaps,
  );
  pushMany(
    "context_feedback_signals",
    "context_feedback_signal",
    preview.proposed_handoff_quality_signals.context_feedback_signals,
  );
  pushMany("carry_forward_refs", "carry_forward_ref", [
    ...preview.carry_forward_candidates.refs_to_preserve_next_time,
    ...preview.carry_forward_candidates.refs_to_warn_next_time,
    ...preview.carry_forward_candidates.refs_to_drop_or_deprioritize,
    ...preview.carry_forward_candidates.unresolved_gaps,
    ...preview.carry_forward_candidates.next_focus_candidates,
  ]);
  return candidates.filter((candidate) =>
    isCandidateIngressPublicSafeRefV01(candidate.candidate_ref),
  );
}

function buildDeltaRefs({
  deltaPreview,
  deltaRecordReview,
}: {
  deltaPreview: ExpectedObservedDeltaPreview | null;
  deltaRecordReview: ExpectedObservedDeltaRecordReview | null;
}) {
  const selected = deltaRecordReview?.selected_record_summary;
  const latest = deltaRecordReview?.latest_record_summary;
  const recordRefs = uniqueCandidateIngressStringsV01(
    deltaRecordReview?.records.map((record) => record.record_id) ?? [],
  ).filter(isCandidateIngressPublicSafeRefV01);
  return {
    record_refs: recordRefs,
    work_ref: selected?.work_ref ?? latest?.work_ref ?? null,
    result_ref: selected?.result_ref ?? latest?.result_ref ?? null,
    handoff_ref: selected?.handoff_ref ?? latest?.handoff_ref ?? null,
    delta_material_count:
      (deltaPreview?.input_summary.delta_candidate_count ?? 0) +
      (deltaRecordReview?.input_summary.valid_record_count ?? 0) +
      recordRefs.length,
  };
}

function buildWouldWritePreview({
  bridgePreview,
  candidateSummaries,
  selectedSummaries,
  selectableRefs,
  selectedRefs,
  sourceRefs,
  evidenceRefs,
  deltaRefs,
  requested_operator_ref,
  requested_idempotency_key,
  review_confirmation_ref,
}: {
  bridgePreview: ReuseOutcomeCandidateBridgePreview | null;
  candidateSummaries: ReuseOutcomeBridgeCandidateSummary[];
  selectedSummaries: ReuseOutcomeBridgeCandidateSummary[];
  selectableRefs: string[];
  selectedRefs: string[];
  sourceRefs: string[];
  evidenceRefs: string[];
  deltaRefs: ReturnType<typeof buildDeltaRefs>;
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  review_confirmation_ref?: string;
}): ReuseOutcomeBridgeWouldWriteLedgerRecordPreview {
  const classifications = bridgePreview?.proposed_reuse_classifications ?? {
    helpful_refs: [],
    stale_refs: [],
    missing_refs: [],
    noisy_refs: [],
    misleading_refs: [],
    unknown_refs: [],
  };
  const qualitySignals = bridgePreview?.proposed_handoff_quality_signals ?? {
    skipped_or_unverified_checks: [],
    not_done_items: [],
    expected_observed_mismatches: [],
    requirement_progress_gaps: [],
    context_feedback_signals: [],
  };
  const carryForward = bridgePreview?.carry_forward_candidates ?? {
    refs_to_preserve_next_time: [],
    refs_to_warn_next_time: [],
    refs_to_drop_or_deprioritize: [],
    unresolved_gaps: [],
    next_focus_candidates: [],
  };
  return {
    proposed_record_kind: HANDOFF_REUSE_OUTCOME_LEDGER_RECORD_VERSION,
    proposed_receipt_kind: HANDOFF_REUSE_OUTCOME_LEDGER_WRITE_RECEIPT_VERSION,
    proposed_store_kind: HANDOFF_REUSE_OUTCOME_LEDGER_STORE_VERSION,
    selected_reuse_candidate_refs: selectedRefs,
    selectable_reuse_candidate_refs: selectableRefs,
    selected_reuse_candidate_summaries: selectedSummaries,
    all_reuse_candidate_summaries: candidateSummaries,
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    delta_refs: deltaRefs.record_refs,
    result_ref: deltaRefs.result_ref,
    result_report_fingerprint: deltaRefs.result_ref
      ? `reuse-bridge-fingerprint:${deltaRefs.result_ref}`
      : null,
    work_ref: deltaRefs.work_ref,
    handoff_ref: deltaRefs.handoff_ref,
    feedback_draft_ref: deltaRefs.result_ref
      ? `reuse-bridge-feedback:${deltaRefs.result_ref}`
      : null,
    context_relay_rationale_ref: deltaRefs.handoff_ref,
    continuity_relay_ref: deltaRefs.handoff_ref
      ? `reuse-bridge-continuity:${deltaRefs.handoff_ref}`
      : null,
    requested_operator_ref: requested_operator_ref ?? null,
    requested_idempotency_key: requested_idempotency_key ?? null,
    review_confirmation_ref: review_confirmation_ref ?? null,
    proposed_reuse_classifications: classifications,
    proposed_handoff_quality_signals: qualitySignals,
    proposed_expected_observed_summary: {
      matched_expectation_count: classifications.helpful_refs.length,
      missing_expectation_count: classifications.stale_refs.length + classifications.missing_refs.length,
      unexpected_observation_count:
        classifications.noisy_refs.length + classifications.misleading_refs.length,
      skipped_or_unverified_check_count:
        qualitySignals.skipped_or_unverified_checks.length,
      requirement_progress_gap_count:
        qualitySignals.requirement_progress_gaps.length,
      not_done_count: qualitySignals.not_done_items.length,
      mismatch_summary:
        qualitySignals.expected_observed_mismatches[0] ??
        "reuse outcome bridge mismatch summary pending operator review",
      confidence: "medium",
    },
    carry_forward_candidates: {
      next_relay_update_suggestions: [],
      next_handoff_adjustments: [],
      refs_to_preserve_next_time: carryForward.refs_to_preserve_next_time,
      refs_to_warn_next_time: carryForward.refs_to_warn_next_time,
      refs_to_drop_or_deprioritize:
        carryForward.refs_to_drop_or_deprioritize,
      unresolved_gaps: carryForward.unresolved_gaps,
      next_focus_candidate:
        carryForward.next_focus_candidates[0] ??
        "Review bridge-written reuse outcome ledger records before metric candidate preview.",
    },
  };
}

function buildWriteReadiness({
  blockingReasons,
  missingEvidence,
  refusalReasons,
  insufficientData,
}: {
  blockingReasons: string[];
  missingEvidence: string[];
  refusalReasons: string[];
  insufficientData: string[];
}): ReuseOutcomeBridgeWriteReadiness {
  const writeReady =
    blockingReasons.length === 0 &&
    missingEvidence.length === 0 &&
    refusalReasons.length === 0 &&
    insufficientData.length === 0;
  return {
    write_ready: writeReady,
    readiness_label: writeReady
      ? "ready for future scoped HandoffReuseOutcomeLedger write"
      : "not ready for reuse ledger write",
    requires_bridge_preview: true,
    requires_delta_material: true,
    requires_operator_confirmation: true,
    requires_selected_reuse_refs: true,
    requires_idempotency_key: true,
    requires_source_refs: true,
    requires_evidence_refs: true,
    requires_no_blockers: true,
    current_blockers: blockingReasons,
    current_missing_evidence: missingEvidence,
    current_refusal_reasons: refusalReasons,
    current_insufficient_data: insufficientData,
    confidence: writeReady ? "medium" : "insufficient_data",
  };
}

function determineStatus({
  bridgePreview,
  bridgeWrongVersion,
  writeReadiness,
  candidateSummaries,
  selectedRefs,
}: {
  bridgePreview: ReuseOutcomeCandidateBridgePreview | null;
  bridgeWrongVersion: boolean;
  writeReadiness: ReuseOutcomeBridgeWriteReadiness;
  candidateSummaries: ReuseOutcomeBridgeCandidateSummary[];
  selectedRefs: string[];
}): ReuseOutcomeBridgeOperatorDecisionPreviewStatus {
  if (!bridgePreview && !bridgeWrongVersion) return "no_reuse_outcome_bridge_preview";
  if (bridgeWrongVersion || writeReadiness.current_blockers.length > 0) return "blocked";
  if (bridgePreview?.bridge_preview_status === "keep_preview_only") {
    return "keep_preview_only";
  }
  if (writeReadiness.write_ready) return "ready_for_future_reuse_ledger_write";
  if (writeReadiness.current_missing_evidence.length > 0) return "needs_more_evidence";
  if (candidateSummaries.length > 0 && selectedRefs.length === 0) {
    return "needs_operator_judgment";
  }
  if (candidateSummaries.length > 0) return "ready_for_operator_decision";
  return "insufficient_data";
}

function determineRecommendedDecision({
  status,
  missingEvidence,
  insufficientData,
  refusalReasons,
  blockingReasons,
}: {
  status: ReuseOutcomeBridgeOperatorDecisionPreviewStatus;
  missingEvidence: string[];
  insufficientData: string[];
  refusalReasons: string[];
  blockingReasons: string[];
}): ReuseOutcomeBridgeRecommendedOperatorDecision {
  if (status === "ready_for_future_reuse_ledger_write") {
    return "approve_for_reuse_outcome_ledger_write";
  }
  if (blockingReasons.length > 0 || refusalReasons.length > 0) {
    return "resolve_blockers";
  }
  if (
    missingEvidence.some((reason) =>
      /expected_observed_delta|delta_material/i.test(reason),
    )
  ) {
    return "defer_until_delta_material_supplied";
  }
  if (missingEvidence.length > 0 || insufficientData.includes("evidence_refs_missing")) {
    return "defer_until_evidence_supplied";
  }
  if (insufficientData.includes("selected_reuse_candidate_refs_missing")) {
    return "defer_until_selected_reuse_refs_supplied";
  }
  if (insufficientData.includes("idempotency_key_missing")) {
    return "defer_until_idempotency_supplied";
  }
  if (status === "keep_preview_only") return "keep_as_candidate_only";
  if (status === "no_reuse_outcome_bridge_preview") {
    return "defer_until_delta_material_supplied";
  }
  return "request_more_evidence";
}

function buildApprovalRequirements(): string[] {
  return [
    "operator_reviewed_reuse_outcome_bridge_candidates",
    "operator_confirmed_selected_reuse_refs",
    "operator_confirmed_expected_observed_delta_record_material",
    "operator_confirmed_skipped_checks_not_counted_as_success",
    "operator_confirmed_not_done_items_not_counted_as_completion",
    "operator_confirmed_existing_handoff_reuse_outcome_ledger_write_only",
    "operator_confirmed_no_metric_memory_perspective_cwp_relay_or_handoff_write",
  ];
}

function buildFallbackReason({
  status,
  blockingReasons,
  missingEvidence,
  insufficientData,
  refusalReasons,
}: {
  status: string;
  blockingReasons: string[];
  missingEvidence: string[];
  insufficientData: string[];
  refusalReasons: string[];
}): string | null {
  if (status === "ready_for_future_reuse_ledger_write") return null;
  return (
    blockingReasons[0] ??
    refusalReasons[0] ??
    missingEvidence[0] ??
    insufficientData[0] ??
    status
  );
}

function hasReadOnlyBridgeAuthority(
  preview: ReuseOutcomeCandidateBridgePreview,
): boolean {
  const authority = preview.authority_boundary;
  return (
    authority.read_only === true &&
    authority.candidate_material_only === true &&
    authority.source_of_truth === false &&
    authority.can_write_reuse_outcome_ledger === false &&
    authority.can_write_dogfood_metrics === false &&
    authority.can_write_expected_observed_delta === false &&
    authority.can_write_work_episode === false &&
    authority.can_write_memory === false &&
    authority.can_update_current_working_perspective === false &&
    authority.can_update_continuity_relay === false &&
    authority.can_mutate_handoff_context === false &&
    authority.can_send_handoff === false &&
    authority.can_call_provider_openai === false &&
    authority.can_call_github === false &&
    authority.can_execute_codex === false
  );
}

function safeRef(value: string): boolean {
  return isCandidateIngressPublicSafeRefV01(value);
}

function isReuseOutcomeCandidateBridgePreview(
  value: unknown,
): value is ReuseOutcomeCandidateBridgePreview {
  return (
    isRecord(value) &&
    value.preview_version === REUSE_OUTCOME_CANDIDATE_BRIDGE_PREVIEW_VERSION &&
    isRecord(value.input_summary) &&
    isRecord(value.proposed_reuse_classifications) &&
    isRecord(value.proposed_handoff_quality_signals) &&
    isRecord(value.carry_forward_candidates)
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

function isExpectedObservedDeltaPreview(
  value: unknown,
): value is ExpectedObservedDeltaPreview {
  return (
    isRecord(value) &&
    value.preview_version === EXPECTED_OBSERVED_DELTA_PREVIEW_VERSION &&
    isRecord(value.input_summary) &&
    isRecord(value.delta_candidates)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
