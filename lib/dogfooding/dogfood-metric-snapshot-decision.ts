import {
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  DOGFOOD_METRIC_SNAPSHOT_OPERATOR_DECISION_PREVIEW_VERSION,
  type DogfoodMetricSnapshotAvailableOperatorDecision,
  type DogfoodMetricSnapshotDecisionAuthorityBoundary,
  type DogfoodMetricSnapshotDecisionWriteReadiness,
  type DogfoodMetricSnapshotOperatorDecisionPreview,
  type DogfoodMetricSnapshotOperatorDecisionPreviewInput,
  type DogfoodMetricSnapshotOperatorDecisionStatus,
  type DogfoodMetricSnapshotRecommendedOperatorDecision,
  type DogfoodMetricSnapshotWouldWriteRecordPreview,
} from "@/types/dogfood-metric-snapshot-decision";
import {
  DOGFOOD_METRIC_SNAPSHOT_PREVIEW_VERSION,
  type DogfoodMetricSnapshotCandidateSummary,
  type DogfoodMetricSnapshotPreview,
} from "@/types/dogfood-metric-snapshot-preview";
import {
  DOGFOOD_METRIC_SNAPSHOT_RECEIPT_VERSION,
  DOGFOOD_METRIC_SNAPSHOT_RECORD_VERSION,
  DOGFOOD_METRIC_SNAPSHOT_STORE_VERSION,
  DOGFOOD_METRIC_SNAPSHOT_SCOPE,
} from "@/types/dogfood-metric-snapshot-write";

const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;
const AVAILABLE_OPERATOR_DECISIONS: DogfoodMetricSnapshotAvailableOperatorDecision[] =
  [
    "approve_for_dogfood_metric_snapshot_write",
    "defer",
    "reject",
    "keep_candidate",
    "request_more_evidence",
  ];

export function buildDogfoodMetricSnapshotOperatorDecisionPreviewV01({
  dogfood_metric_snapshot_preview,
  selected_metric_candidate_refs,
  requested_operator_ref,
  requested_idempotency_key,
  review_confirmation_ref,
  as_of,
  scope,
  source_refs,
}: DogfoodMetricSnapshotOperatorDecisionPreviewInput = {}): DogfoodMetricSnapshotOperatorDecisionPreview {
  const snapshotPreview = isDogfoodMetricSnapshotPreview(
    dogfood_metric_snapshot_preview,
  )
    ? dogfood_metric_snapshot_preview
    : null;
  const wrongVersion =
    isRecord(dogfood_metric_snapshot_preview) &&
    dogfood_metric_snapshot_preview.preview_version !==
      DOGFOOD_METRIC_SNAPSHOT_PREVIEW_VERSION;
  const sourceRefsRaw = uniqueCandidateIngressStringsV01([
    DOGFOOD_METRIC_SNAPSHOT_OPERATOR_DECISION_PREVIEW_VERSION,
    ...(source_refs ?? []),
    ...(snapshotPreview?.source_refs ?? []),
  ]);
  const sourceRefs = sourceRefsRaw.filter(isCandidateIngressPublicSafeRefV01);
  const evidenceRefs = uniqueCandidateIngressStringsV01(
    snapshotPreview?.evidence_summary.evidence_refs ?? [],
  ).filter(isCandidateIngressPublicSafeRefV01);
  const candidateSummaries = snapshotPreview?.metric_candidate_summaries ?? [];
  const selectableRefs = uniqueCandidateIngressStringsV01(
    candidateSummaries.map((candidate) => candidate.candidate_ref),
  );
  const selectedRefsRaw = selected_metric_candidate_refs ?? [];
  const selectedRefs = uniqueCandidateIngressStringsV01(selectedRefsRaw);
  const selectedSummaries = candidateSummaries.filter((candidate) =>
    selectedRefs.includes(candidate.candidate_ref),
  );
  const unsafeRefs = uniqueCandidateIngressStringsV01([
    ...sourceRefsRaw.filter((ref) => !isCandidateIngressPublicSafeRefV01(ref)),
    ...selectedRefsRaw.filter((ref) => !isCandidateIngressPublicSafeRefV01(ref)),
    ...(requested_operator_ref && !safeRef(requested_operator_ref)
      ? [requested_operator_ref]
      : []),
    ...(requested_idempotency_key && !safeRef(requested_idempotency_key)
      ? [requested_idempotency_key]
      : []),
    ...(review_confirmation_ref && !safeRef(review_confirmation_ref)
      ? [review_confirmation_ref]
      : []),
  ]);
  const blockingReasons = uniqueCandidateIngressStringsV01([
    ...(wrongVersion ? ["dogfood_metric_snapshot_preview_version_invalid"] : []),
    ...(!snapshotPreview ? ["dogfood_metric_snapshot_preview_missing"] : []),
    ...(snapshotPreview && !hasReadOnlySnapshotAuthority(snapshotPreview)
      ? ["dogfood_metric_snapshot_preview_authority_boundary_invalid"]
      : []),
    ...(snapshotPreview?.blocked_reasons ?? []),
  ]);
  const missingEvidence = uniqueCandidateIngressStringsV01([
    ...(snapshotPreview?.evidence_summary.missing_evidence ?? []),
    ...(evidenceRefs.length === 0 ? ["metric_snapshot_evidence_refs_missing"] : []),
  ]);
  const refusalReasons = uniqueCandidateIngressStringsV01([
    ...(unsafeRefs.length > 0 ? ["metric_snapshot_decision_refs_unsafe"] : []),
    ...selectedRefs
      .filter((ref) => !selectableRefs.includes(ref))
      .map(() => "selected_metric_candidate_refs_not_in_snapshot_preview"),
  ]);
  const insufficientData = uniqueCandidateIngressStringsV01([
    ...(candidateSummaries.length === 0 ? ["metric_candidate_material_missing"] : []),
    ...(selectedRefs.length === 0 ? ["selected_metric_candidate_refs_missing"] : []),
    ...(!requested_operator_ref ? ["operator_ref_missing"] : []),
    ...(!requested_idempotency_key ? ["idempotency_key_missing"] : []),
    ...(!review_confirmation_ref ? ["review_confirmation_ref_missing"] : []),
    ...(sourceRefs.length === 0 ? ["source_refs_missing"] : []),
    ...(snapshotPreview?.insufficient_data_reasons ?? []),
    ...(snapshotPreview?.snapshot_preview_status === "no_reuse_outcome_records"
      ? ["reuse_outcome_records_missing"]
      : []),
  ]);
  const writeReadiness = buildWriteReadiness({
    blockingReasons,
    missingEvidence,
    refusalReasons,
    insufficientData,
  });
  const status = determineStatus({
    snapshotPreview,
    writeReadiness,
    wrongVersion,
    selectedRefs,
    candidateSummaries,
  });
  const recommendedDecision = determineRecommendedDecision({
    status,
    blockingReasons,
    missingEvidence,
    refusalReasons,
    insufficientData,
  });
  const wouldWritePreview = buildWouldWriteRecordPreview({
    snapshotPreview,
    selectedRefs,
    selectableRefs,
    selectedSummaries,
    sourceRefs,
    evidenceRefs,
    requested_operator_ref,
    requested_idempotency_key,
    review_confirmation_ref,
  });

  return {
    runtime: "augnes",
    preview_version: DOGFOOD_METRIC_SNAPSHOT_OPERATOR_DECISION_PREVIEW_VERSION,
    scope: scope ?? snapshotPreview?.scope ?? DOGFOOD_METRIC_SNAPSHOT_SCOPE,
    as_of: as_of ?? snapshotPreview?.as_of ?? FALLBACK_AS_OF,
    source_refs: sourceRefs,
    decision_preview_status: status,
    recommended_operator_decision: recommendedDecision,
    available_operator_decisions: AVAILABLE_OPERATOR_DECISIONS,
    input_summary: {
      has_metric_snapshot_preview: Boolean(snapshotPreview),
      metric_candidate_count: candidateSummaries.length,
      selectable_metric_candidate_ref_count: selectableRefs.length,
      selected_metric_candidate_ref_count: selectedRefs.length,
      would_write_metric_candidate_count: selectedSummaries.length,
      blocker_count: blockingReasons.length,
      missing_evidence_count: missingEvidence.length,
      refusal_reason_count: refusalReasons.length,
      insufficient_data_reason_count: insufficientData.length,
      review_confirmation_supplied: Boolean(review_confirmation_ref),
      requested_idempotency_key_supplied: Boolean(requested_idempotency_key),
      requested_operator_ref_supplied: Boolean(requested_operator_ref),
    },
    source_status: {
      dogfood_metric_snapshot_preview: snapshotPreview
        ? "supplied"
        : wrongVersion
          ? "wrong_version"
          : isRecord(dogfood_metric_snapshot_preview)
            ? "malformed"
            : "missing",
      metric_snapshot_authority_boundary: snapshotPreview
        ? hasReadOnlySnapshotAuthority(snapshotPreview)
          ? "valid_read_only"
          : "invalid"
        : "missing",
      selected_metric_candidate_refs:
        selectedRefsRaw.length === 0
          ? "missing"
          : selectedRefsRaw.some((ref) => !isCandidateIngressPublicSafeRefV01(ref))
            ? "unsafe"
            : selectedRefs.some((ref) => !selectableRefs.includes(ref))
              ? "unknown_ref"
              : "supplied",
      review_confirmation_ref: review_confirmation_ref
        ? safeRef(review_confirmation_ref)
          ? "supplied"
          : "unsafe"
        : "missing",
      requested_idempotency_key: requested_idempotency_key
        ? safeRef(requested_idempotency_key)
          ? "supplied"
          : "unsafe"
        : "missing",
      requested_operator_ref: requested_operator_ref
        ? safeRef(requested_operator_ref)
          ? "supplied"
          : "unsafe"
        : "missing",
    },
    write_readiness: writeReadiness,
    approval_requirements: [
      "review_metric_snapshot_candidate_material",
      "confirm_reuse_outcome_records_are_approved_local_ledger_records",
      "confirm_skipped_checks_are_burden_not_success",
      "confirm_stale_missing_misleading_context_not_counted_as_helpful",
      "confirm_metric_snapshot_is_not_global_metric_or_perspective_update",
    ],
    blocking_reasons: blockingReasons,
    missing_evidence: missingEvidence,
    refusal_reasons: refusalReasons,
    evidence_summary: {
      has_valid_metric_snapshot_preview: Boolean(snapshotPreview),
      has_metric_candidate_material: candidateSummaries.length > 0,
      has_selected_metric_candidate_refs: selectedRefs.length > 0,
      has_source_refs: sourceRefs.length > 0,
      has_evidence_refs: evidenceRefs.length > 0,
      has_review_confirmation: Boolean(review_confirmation_ref),
      has_idempotency_key: Boolean(requested_idempotency_key),
      has_operator_ref: Boolean(requested_operator_ref),
      has_missing_evidence: missingEvidence.length > 0,
      has_refusal_reasons: refusalReasons.length > 0,
      has_unsafe_refs: unsafeRefs.length > 0,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      missing_evidence: missingEvidence,
      unsafe_refs: unsafeRefs,
    },
    would_write_metric_snapshot_record_preview: wouldWritePreview,
    selected_metric_candidates: selectedSummaries,
    candidate_carry_forward: {
      single_sample_candidates: candidateSummaries.filter(
        (candidate) => candidate.single_sample,
      ),
      insufficient_data_candidates: candidateSummaries.filter(
        (candidate) => candidate.bucket === "insufficient_data_record_count",
      ),
    },
    review_checklist: [
      "review_selected_metric_candidate_refs",
      "confirm_metric_snapshot_source_records_and_evidence_refs",
      "confirm_no_metric_global_state_or_perspective_write_is_implied",
      "confirm_operator_approval_is_for_local_snapshot_record_only",
    ],
    would_not_write: [
      "does_not_write_db",
      "does_not_update_global_dogfood_metrics",
      "does_not_write_reuse_ledger_expected_observed_delta_or_work_episode",
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
    authority_boundary: createDogfoodMetricSnapshotDecisionAuthorityBoundaryV01(),
    fallback_reason: !snapshotPreview
      ? "dogfood_metric_snapshot_preview_missing"
      : null,
    notes: [
      "Decision preview is advisory and read-only.",
      "Future write readiness only applies to a scoped local dogfood metric snapshot record.",
    ],
  };
}

export function createDogfoodMetricSnapshotDecisionAuthorityBoundaryV01(): DogfoodMetricSnapshotDecisionAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_persist_decision: false,
    can_write_db: false,
    can_create_schema: false,
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
      "Operator decision preview cannot persist decisions or write records.",
      "It prepares scoped dogfood metric snapshot write material only.",
    ],
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
}): DogfoodMetricSnapshotDecisionWriteReadiness {
  const writeReady =
    blockingReasons.length === 0 &&
    missingEvidence.length === 0 &&
    refusalReasons.length === 0 &&
    insufficientData.length === 0;
  return {
    write_ready: writeReady,
    readiness_label: writeReady
      ? "ready_for_future_metric_snapshot_write"
      : "not_ready_for_future_metric_snapshot_write",
    requires_metric_snapshot_preview: true,
    requires_selected_metric_refs: true,
    requires_review_confirmation: true,
    requires_idempotency_key: true,
    requires_operator_ref: true,
    requires_source_refs: true,
    requires_evidence_refs: true,
    requires_no_blockers: true,
    requires_sufficient_metric_data: true,
    requires_read_only_metric_snapshot_preview: true,
    current_blockers: blockingReasons,
    current_missing_evidence: missingEvidence,
    current_refusal_reasons: refusalReasons,
    current_insufficient_data: insufficientData,
  };
}

function determineStatus({
  snapshotPreview,
  writeReadiness,
  wrongVersion,
  selectedRefs,
  candidateSummaries,
}: {
  snapshotPreview: DogfoodMetricSnapshotPreview | null;
  writeReadiness: DogfoodMetricSnapshotDecisionWriteReadiness;
  wrongVersion: boolean;
  selectedRefs: string[];
  candidateSummaries: DogfoodMetricSnapshotCandidateSummary[];
}): DogfoodMetricSnapshotOperatorDecisionStatus {
  if (!snapshotPreview && !wrongVersion) return "no_metric_snapshot_preview";
  if (writeReadiness.write_ready) return "ready_for_future_metric_snapshot_write";
  if (
    writeReadiness.current_blockers.length > 0 ||
    writeReadiness.current_refusal_reasons.length > 0
  ) {
    return "blocked";
  }
  if (writeReadiness.current_missing_evidence.length > 0) {
    return "needs_more_evidence";
  }
  if (candidateSummaries.length === 0) return "insufficient_data";
  if (selectedRefs.length === 0) return "needs_operator_judgment";
  return "ready_for_operator_decision";
}

function determineRecommendedDecision({
  status,
  blockingReasons,
  missingEvidence,
  refusalReasons,
  insufficientData,
}: {
  status: DogfoodMetricSnapshotOperatorDecisionStatus;
  blockingReasons: string[];
  missingEvidence: string[];
  refusalReasons: string[];
  insufficientData: string[];
}): DogfoodMetricSnapshotRecommendedOperatorDecision {
  if (status === "ready_for_future_metric_snapshot_write") {
    return "approve_for_dogfood_metric_snapshot_write";
  }
  if (blockingReasons.length > 0 || refusalReasons.length > 0) {
    return "resolve_blockers";
  }
  if (missingEvidence.length > 0) return "defer_until_evidence_supplied";
  if (
    insufficientData.some((reason) => /reuse_outcome_records|ledger_records/i.test(reason))
  ) {
    return "defer_until_reuse_outcome_records_supplied";
  }
  if (insufficientData.some((reason) => /single_sample|more_records/i.test(reason))) {
    return "defer_until_more_records_available";
  }
  if (insufficientData.some((reason) => /selected_metric_candidate_refs/i.test(reason))) {
    return "defer_until_selected_metric_refs_supplied";
  }
  if (insufficientData.some((reason) => /idempotency/i.test(reason))) {
    return "defer_until_idempotency_supplied";
  }
  if (status === "keep_preview_only") return "keep_as_candidate_only";
  return "request_more_evidence";
}

function buildWouldWriteRecordPreview({
  snapshotPreview,
  selectedRefs,
  selectableRefs,
  selectedSummaries,
  sourceRefs,
  evidenceRefs,
  requested_operator_ref,
  requested_idempotency_key,
  review_confirmation_ref,
}: {
  snapshotPreview: DogfoodMetricSnapshotPreview | null;
  selectedRefs: string[];
  selectableRefs: string[];
  selectedSummaries: DogfoodMetricSnapshotCandidateSummary[];
  sourceRefs: string[];
  evidenceRefs: string[];
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  review_confirmation_ref?: string;
}): DogfoodMetricSnapshotWouldWriteRecordPreview {
  return {
    proposed_record_kind: snapshotPreview
      ? DOGFOOD_METRIC_SNAPSHOT_RECORD_VERSION
      : null,
    proposed_receipt_kind: snapshotPreview
      ? DOGFOOD_METRIC_SNAPSHOT_RECEIPT_VERSION
      : null,
    proposed_store_kind: snapshotPreview ? DOGFOOD_METRIC_SNAPSHOT_STORE_VERSION : null,
    selected_metric_candidate_refs: selectedRefs,
    selectable_metric_candidate_refs: selectableRefs,
    selected_metric_candidate_summaries: selectedSummaries,
    metric_candidate_summaries: snapshotPreview?.metric_candidate_summaries ?? [],
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    source_reuse_ledger_record_refs:
      snapshotPreview?.source_record_summary.reuse_ledger_record_refs ?? [],
    source_expected_observed_delta_record_refs:
      snapshotPreview?.source_record_summary
        .expected_observed_delta_record_refs ?? [],
    metric_window: snapshotPreview?.metric_window ?? {
      since: null,
      until: null,
      limit: null,
      filtered_by_operator_ref: null,
      filtered_by_result_ref: null,
      filtered_by_work_ref: null,
    },
    aggregate_counts: snapshotPreview?.aggregate_counts ?? {
      approved_reuse_ledger_record_count: 0,
      raw_reuse_ledger_record_count: 0,
      expected_observed_delta_record_count: 0,
      helpful_context_signal_count: 0,
      stale_context_signal_count: 0,
      missing_context_signal_count: 0,
      noisy_context_signal_count: 0,
      misleading_context_signal_count: 0,
      unknown_context_signal_count: 0,
      skipped_or_unverified_check_count: 0,
      not_done_item_count: 0,
      expected_observed_mismatch_count: 0,
      requirement_progress_gap_count: 0,
      carry_forward_candidate_count: 0,
      review_burden_signal_count: 0,
      handoff_loss_signal_count: 0,
      insufficient_data_record_count: 0,
    },
    reuse_quality_metrics: snapshotPreview?.reuse_quality_metrics ?? {
      helpful_context_signal_count: 0,
      stale_context_signal_count: 0,
      missing_context_signal_count: 0,
      noisy_context_signal_count: 0,
      misleading_context_signal_count: 0,
      unknown_context_signal_count: 0,
      helpful_ratio: null,
      problem_signal_count: 0,
    },
    handoff_quality_metrics: snapshotPreview?.handoff_quality_metrics ?? {
      skipped_or_unverified_check_count: 0,
      not_done_item_count: 0,
      handoff_loss_signal_count: 0,
      carry_forward_candidate_count: 0,
    },
    expected_observed_quality_metrics:
      snapshotPreview?.expected_observed_quality_metrics ?? {
        expected_observed_mismatch_count: 0,
        requirement_progress_gap_count: 0,
        expected_observed_delta_record_count: 0,
      },
    verification_quality_metrics:
      snapshotPreview?.verification_quality_metrics ?? {
        skipped_or_unverified_check_count: 0,
        verified_success_count: 0,
        verification_burden_count: 0,
      },
    context_diet_metrics: snapshotPreview?.context_diet_metrics ?? {
      preserve_candidate_count: 0,
      warn_candidate_count: 0,
      drop_or_deprioritize_candidate_count: 0,
      unknown_context_signal_count: 0,
    },
    metric_trend_candidates: snapshotPreview?.metric_trend_candidates ?? [],
    insufficient_data_notes: snapshotPreview?.insufficient_data_reasons ?? [],
    requested_operator_ref: requested_operator_ref ?? null,
    requested_idempotency_key: requested_idempotency_key ?? null,
    review_confirmation_ref: review_confirmation_ref ?? null,
    review_summary: snapshotPreview
      ? `Dogfood metric snapshot from ${snapshotPreview.input_summary.approved_reuse_ledger_record_count} approved reuse outcome ledger record(s).`
      : "No dogfood metric snapshot preview supplied.",
  };
}

function isDogfoodMetricSnapshotPreview(
  value: unknown,
): value is DogfoodMetricSnapshotPreview {
  return (
    isRecord(value) &&
    value.preview_version === DOGFOOD_METRIC_SNAPSHOT_PREVIEW_VERSION &&
    isRecord(value.authority_boundary) &&
    Array.isArray(value.metric_candidate_summaries) &&
    isRecord(value.evidence_summary)
  );
}

function hasReadOnlySnapshotAuthority(
  preview: DogfoodMetricSnapshotPreview,
): boolean {
  const boundary = preview.authority_boundary;
  return (
    boundary.read_only === true &&
    boundary.candidate_material_only === true &&
    boundary.source_of_truth === false &&
    boundary.can_write_dogfood_metric_snapshot === false &&
    boundary.can_write_dogfood_metrics === false &&
    boundary.can_update_metrics === false &&
    boundary.can_write_reuse_outcome_ledger === false &&
    boundary.can_write_expected_observed_delta === false &&
    boundary.can_write_work_episode === false &&
    boundary.can_write_memory === false &&
    boundary.can_write_perspective_unit === false &&
    boundary.can_write_next_work_bias === false &&
    boundary.can_update_current_working_perspective === false &&
    boundary.can_update_continuity_relay === false &&
    boundary.can_mutate_handoff_context === false &&
    boundary.can_send_handoff === false &&
    boundary.can_call_provider_openai === false &&
    boundary.can_call_github === false &&
    boundary.can_execute_codex === false
  );
}

function safeRef(value: unknown): string | null {
  return isCandidateIngressPublicSafeRefV01(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
