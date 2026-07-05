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
import {
  NEXT_WORK_SIGNAL_OPERATOR_DECISION_PREVIEW_VERSION,
  type NextWorkSignalAvailableOperatorDecision,
  type NextWorkSignalCandidateBucket,
  type NextWorkSignalCandidateSummary,
  type NextWorkSignalDecisionAuthorityBoundary,
  type NextWorkSignalDecisionWriteReadiness,
  type NextWorkSignalOperatorDecisionPreview,
  type NextWorkSignalOperatorDecisionPreviewInput,
  type NextWorkSignalOperatorDecisionStatus,
  type NextWorkSignalRecommendedOperatorDecision,
  type NextWorkSignalWouldWriteRecordPreview,
} from "@/types/next-work-signal-decision";
import {
  NEXT_WORK_SIGNAL_DECISION_RECEIPT_VERSION,
  NEXT_WORK_SIGNAL_DECISION_RECORD_VERSION,
  NEXT_WORK_SIGNAL_DECISION_SCOPE,
  NEXT_WORK_SIGNAL_DECISION_STORE_VERSION,
} from "@/types/next-work-signal-decision-write";
import {
  NEXT_WORK_SIGNAL_REFRESH_PREVIEW_VERSION,
  type NextWorkSignalRefreshPreview,
} from "@/types/next-work-signal-refresh-preview";

const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;
const AVAILABLE_OPERATOR_DECISIONS: NextWorkSignalAvailableOperatorDecision[] =
  [
    "approve_for_next_work_signal_record",
    "defer",
    "reject",
    "keep_candidate",
    "request_more_evidence",
  ];

const signalBuckets: Array<{
  bucket: NextWorkSignalCandidateBucket;
  label: string;
  pressure: "low" | "medium" | "high";
}> = [
  { bucket: "preserve_context_refs", label: "Preserve context", pressure: "low" },
  { bucket: "warn_context_refs", label: "Warn context", pressure: "medium" },
  {
    bucket: "drop_or_deprioritize_context_refs",
    label: "Drop or deprioritize context",
    pressure: "high",
  },
  {
    bucket: "verification_focus_candidates",
    label: "Verification focus",
    pressure: "high",
  },
  {
    bucket: "expected_observed_followup_candidates",
    label: "Expected/observed follow-up",
    pressure: "high",
  },
  {
    bucket: "handoff_quality_focus_candidates",
    label: "Handoff quality focus",
    pressure: "medium",
  },
  { bucket: "context_diet_candidates", label: "Context diet", pressure: "medium" },
  {
    bucket: "review_burden_reduction_candidates",
    label: "Review burden reduction",
    pressure: "medium",
  },
];

export function buildNextWorkSignalOperatorDecisionPreviewV01({
  next_work_signal_refresh_preview,
  dogfood_metric_snapshot_record_review,
  dogfood_metric_snapshot_preview,
  selected_signal_refs,
  requested_operator_ref,
  requested_idempotency_key,
  review_confirmation_ref,
  as_of,
  scope,
  source_refs,
}: NextWorkSignalOperatorDecisionPreviewInput = {}): NextWorkSignalOperatorDecisionPreview {
  const refreshPreview = isNextWorkSignalRefreshPreview(
    next_work_signal_refresh_preview,
  )
    ? next_work_signal_refresh_preview
    : null;
  const metricRecordReview = isDogfoodMetricSnapshotRecordReview(
    dogfood_metric_snapshot_record_review,
  )
    ? dogfood_metric_snapshot_record_review
    : null;
  const metricSnapshotPreview = isDogfoodMetricSnapshotPreview(
    dogfood_metric_snapshot_preview,
  )
    ? dogfood_metric_snapshot_preview
    : null;
  const wrongVersion =
    isRecord(next_work_signal_refresh_preview) &&
    next_work_signal_refresh_preview.preview_version !==
      NEXT_WORK_SIGNAL_REFRESH_PREVIEW_VERSION;
  const sourceRefsRaw = uniqueCandidateIngressStringsV01([
    NEXT_WORK_SIGNAL_OPERATOR_DECISION_PREVIEW_VERSION,
    ...(source_refs ?? []),
    ...(refreshPreview?.source_refs ?? []),
    ...(metricRecordReview?.source_refs ?? []),
    ...(metricSnapshotPreview?.source_refs ?? []),
  ]);
  const sourceRefs = sourceRefsRaw.filter(isCandidateIngressPublicSafeRefV01);
  const evidenceRefs = uniqueCandidateIngressStringsV01([
    ...(refreshPreview?.evidence_summary.evidence_refs ?? []),
    ...(metricRecordReview?.evidence_summary.evidence_refs ?? []),
    ...(metricSnapshotPreview?.evidence_summary.evidence_refs ?? []),
  ]).filter(isCandidateIngressPublicSafeRefV01);
  const signalSummaries = buildSignalSummaries(refreshPreview, evidenceRefs);
  const selectableRefs = uniqueCandidateIngressStringsV01(
    signalSummaries.map((signal) => signal.signal_ref),
  );
  const selectedRefsRaw = selected_signal_refs ?? [];
  const selectedRefs = uniqueCandidateIngressStringsV01(selectedRefsRaw);
  const selectedSummaries = signalSummaries.filter((signal) =>
    selectedRefs.includes(signal.signal_ref),
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
    ...(wrongVersion ? ["next_work_signal_refresh_preview_version_invalid"] : []),
    ...(!refreshPreview ? ["next_work_signal_refresh_preview_missing"] : []),
    ...(refreshPreview && !hasReadOnlyRefreshAuthority(refreshPreview)
      ? ["next_work_signal_refresh_preview_authority_boundary_invalid"]
      : []),
    ...(refreshPreview?.blocked_reasons ?? []),
    ...(metricRecordReview?.blocked_reasons ?? []),
  ]);
  const missingEvidence = uniqueCandidateIngressStringsV01([
    ...(refreshPreview?.evidence_summary.missing_evidence ?? []),
    ...(metricRecordReview?.evidence_summary.missing_evidence ?? []),
    ...(evidenceRefs.length === 0 ? ["next_work_signal_evidence_refs_missing"] : []),
  ]);
  const refusalReasons = uniqueCandidateIngressStringsV01([
    ...(unsafeRefs.length > 0 ? ["next_work_signal_decision_refs_unsafe"] : []),
    ...selectedRefs
      .filter((ref) => !selectableRefs.includes(ref))
      .map(() => "selected_signal_refs_not_in_refresh_preview"),
  ]);
  const insufficientData = uniqueCandidateIngressStringsV01([
    ...(signalSummaries.length === 0 ? ["next_work_signal_candidate_material_missing"] : []),
    ...(selectedRefs.length === 0 ? ["selected_signal_refs_missing"] : []),
    ...(!requested_operator_ref ? ["operator_ref_missing"] : []),
    ...(!requested_idempotency_key ? ["idempotency_key_missing"] : []),
    ...(!review_confirmation_ref ? ["review_confirmation_ref_missing"] : []),
    ...(sourceRefs.length === 0 ? ["source_refs_missing"] : []),
    ...(refreshPreview?.insufficient_data_reasons ?? []),
    ...(refreshPreview?.refresh_preview_status === "no_metric_material"
      ? ["metric_snapshot_material_missing"]
      : []),
  ]);
  const writeReadiness = buildWriteReadiness({
    blockingReasons,
    missingEvidence,
    refusalReasons,
    insufficientData,
  });
  const status = determineStatus({
    refreshPreview,
    writeReadiness,
    wrongVersion,
    selectedRefs,
    signalSummaries,
  });
  const recommendedDecision = determineRecommendedDecision({
    status,
    blockingReasons,
    missingEvidence,
    refusalReasons,
    insufficientData,
  });
  const wouldWritePreview = buildWouldWriteRecordPreview({
    refreshPreview,
    metricRecordReview,
    selectedRefs,
    selectableRefs,
    selectedSummaries,
    signalSummaries,
    sourceRefs,
    evidenceRefs,
    requested_operator_ref,
    requested_idempotency_key,
    review_confirmation_ref,
  });

  return {
    runtime: "augnes",
    preview_version: NEXT_WORK_SIGNAL_OPERATOR_DECISION_PREVIEW_VERSION,
    scope: scope ?? refreshPreview?.scope ?? NEXT_WORK_SIGNAL_DECISION_SCOPE,
    as_of: as_of ?? refreshPreview?.as_of ?? FALLBACK_AS_OF,
    source_refs: sourceRefs,
    decision_preview_status: status,
    recommended_operator_decision: recommendedDecision,
    available_operator_decisions: AVAILABLE_OPERATOR_DECISIONS,
    input_summary: {
      has_next_work_signal_refresh_preview: Boolean(refreshPreview),
      signal_candidate_count: signalSummaries.length,
      selectable_signal_ref_count: selectableRefs.length,
      selected_signal_ref_count: selectedRefs.length,
      would_write_signal_count: selectedSummaries.length,
      blocker_count: blockingReasons.length,
      missing_evidence_count: missingEvidence.length,
      refusal_reason_count: refusalReasons.length,
      insufficient_data_reason_count: insufficientData.length,
      review_confirmation_supplied: Boolean(review_confirmation_ref),
      requested_idempotency_key_supplied: Boolean(requested_idempotency_key),
      requested_operator_ref_supplied: Boolean(requested_operator_ref),
    },
    refresh_preview_refs: {
      refresh_preview_version: refreshPreview?.preview_version ?? null,
      refresh_preview_source_refs: refreshPreview?.source_refs ?? [],
    },
    metric_snapshot_refs: {
      metric_snapshot_preview_source_refs: metricSnapshotPreview?.source_refs ?? [],
      metric_snapshot_record_refs: metricRecordReview?.records.map(
        (record) => record.record_id,
      ) ?? [],
    },
    source_status: {
      next_work_signal_refresh_preview: refreshPreview
        ? "supplied"
        : wrongVersion
          ? "wrong_version"
          : isRecord(next_work_signal_refresh_preview)
            ? "malformed"
            : "missing",
      refresh_authority_boundary: refreshPreview
        ? hasReadOnlyRefreshAuthority(refreshPreview)
          ? "valid_read_only"
          : "invalid"
        : "missing",
      selected_signal_refs:
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
      "review_next_work_signal_refresh_candidate_material",
      "confirm_selected_signals_are_candidate_material_only",
      "confirm_stale_missing_misleading_context_is_not_preserved_without_review",
      "confirm_skipped_checks_and_not_done_items_are_review_pressure_not_success",
      "confirm_no_perspective_nextworkbias_cwp_relay_handoff_memory_or_metric_write",
    ],
    blocking_reasons: blockingReasons,
    missing_evidence: missingEvidence,
    refusal_reasons: refusalReasons,
    evidence_summary: {
      has_valid_next_work_signal_refresh_preview: Boolean(refreshPreview),
      has_signal_candidate_material: signalSummaries.length > 0,
      has_selected_signal_refs: selectedRefs.length > 0,
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
    would_write_next_work_signal_record_preview: wouldWritePreview,
    selected_signal_candidates: selectedSummaries,
    candidate_carry_forward: {
      verification_pressure_signals: signalSummaries.filter(
        (signal) => signal.bucket === "verification_focus_candidates",
      ),
      context_diet_signals: signalSummaries.filter(
        (signal) => signal.bucket === "context_diet_candidates",
      ),
      warning_signals: signalSummaries.filter(
        (signal) =>
          signal.bucket === "warn_context_refs" ||
          signal.bucket === "drop_or_deprioritize_context_refs",
      ),
    },
    review_checklist: [
      "review_selected_next_work_signal_refs",
      "confirm_metric_snapshot_and_reuse_outcome_sources",
      "confirm_no_perspective_or_relay_state_mutation_is_implied",
      "confirm_operator_approval_is_for_local_next_work_signal_record_only",
    ],
    would_not_write: [
      "does_not_write_db",
      "does_not_write_perspective_unit_or_next_work_bias",
      "does_not_mutate_current_working_perspective",
      "does_not_update_continuity_relay",
      "does_not_mutate_or_send_handoff",
      "does_not_write_memory_metrics_reuse_ledger_expected_observed_delta_or_work_episode",
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
    authority_boundary: createNextWorkSignalDecisionAuthorityBoundaryV01(),
    fallback_reason: !refreshPreview
      ? "next_work_signal_refresh_preview_missing"
      : null,
    notes: [
      "Decision preview is advisory and read-only.",
      "Future write readiness only applies to a scoped local next-work signal decision record.",
    ],
  };
}

export function createNextWorkSignalDecisionAuthorityBoundaryV01(): NextWorkSignalDecisionAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_persist_decision: false,
    can_write_db: false,
    can_create_next_work_signal_record: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_update_current_working_perspective: false,
    can_mutate_current_working_perspective: false,
    can_update_continuity_relay: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context: false,
    can_send_handoff: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_write_dogfood_metrics: false,
    can_update_metrics: false,
    can_write_reuse_outcome_ledger: false,
    can_write_expected_observed_delta: false,
    can_write_work_episode: false,
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
      "It prepares scoped next-work signal decision write material only.",
    ],
  };
}

function buildSignalSummaries(
  refreshPreview: NextWorkSignalRefreshPreview | null,
  evidenceRefs: string[],
): NextWorkSignalCandidateSummary[] {
  if (!refreshPreview) return [];
  return signalBuckets.flatMap(({ bucket, label, pressure }) =>
    refreshPreview.proposed_next_work_signals[bucket].map((signalRef) => ({
      signal_ref: signalRef,
      bucket,
      label,
      summary: `${label}: ${signalRef}`,
      evidence_refs: evidenceRefs,
      review_pressure: pressure,
    })),
  );
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
}): NextWorkSignalDecisionWriteReadiness {
  const writeReady =
    blockingReasons.length === 0 &&
    missingEvidence.length === 0 &&
    refusalReasons.length === 0 &&
    insufficientData.length === 0;
  return {
    write_ready: writeReady,
    readiness_label: writeReady
      ? "ready_for_future_next_work_signal_record_write"
      : "not_ready_for_future_next_work_signal_record_write",
    requires_next_work_signal_refresh_preview: true,
    requires_selected_signal_refs: true,
    requires_review_confirmation: true,
    requires_idempotency_key: true,
    requires_operator_ref: true,
    requires_source_refs: true,
    requires_evidence_refs: true,
    requires_no_blockers: true,
    current_blockers: blockingReasons,
    current_missing_evidence: missingEvidence,
    current_refusal_reasons: refusalReasons,
    current_insufficient_data: insufficientData,
  };
}

function determineStatus({
  refreshPreview,
  writeReadiness,
  wrongVersion,
  selectedRefs,
  signalSummaries,
}: {
  refreshPreview: NextWorkSignalRefreshPreview | null;
  writeReadiness: NextWorkSignalDecisionWriteReadiness;
  wrongVersion: boolean;
  selectedRefs: string[];
  signalSummaries: NextWorkSignalCandidateSummary[];
}): NextWorkSignalOperatorDecisionStatus {
  if (!refreshPreview && !wrongVersion) {
    return "no_next_work_signal_refresh_preview";
  }
  if (writeReadiness.write_ready) {
    return "ready_for_future_next_work_signal_record_write";
  }
  if (
    writeReadiness.current_blockers.length > 0 ||
    writeReadiness.current_refusal_reasons.length > 0
  ) {
    return "blocked";
  }
  if (writeReadiness.current_missing_evidence.length > 0) {
    return "needs_more_evidence";
  }
  if (signalSummaries.length === 0) return "insufficient_data";
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
  status: NextWorkSignalOperatorDecisionStatus;
  blockingReasons: string[];
  missingEvidence: string[];
  refusalReasons: string[];
  insufficientData: string[];
}): NextWorkSignalRecommendedOperatorDecision {
  if (status === "ready_for_future_next_work_signal_record_write") {
    return "approve_for_next_work_signal_record";
  }
  if (blockingReasons.length > 0 || refusalReasons.length > 0) {
    return "resolve_blockers";
  }
  if (missingEvidence.length > 0) return "defer_until_evidence_supplied";
  if (insufficientData.some((reason) => /metric_snapshot|metric_material/i.test(reason))) {
    return "defer_until_metric_snapshot_supplied";
  }
  if (insufficientData.some((reason) => /selected_signal_refs/i.test(reason))) {
    return "defer_until_selected_signal_refs_supplied";
  }
  if (insufficientData.some((reason) => /idempotency/i.test(reason))) {
    return "defer_until_idempotency_supplied";
  }
  if (status === "keep_preview_only") return "keep_as_candidate_only";
  return "request_more_evidence";
}

function buildWouldWriteRecordPreview({
  refreshPreview,
  metricRecordReview,
  selectedRefs,
  selectableRefs,
  selectedSummaries,
  signalSummaries,
  sourceRefs,
  evidenceRefs,
  requested_operator_ref,
  requested_idempotency_key,
  review_confirmation_ref,
}: {
  refreshPreview: NextWorkSignalRefreshPreview | null;
  metricRecordReview: DogfoodMetricSnapshotRecordReview | null;
  selectedRefs: string[];
  selectableRefs: string[];
  selectedSummaries: NextWorkSignalCandidateSummary[];
  signalSummaries: NextWorkSignalCandidateSummary[];
  sourceRefs: string[];
  evidenceRefs: string[];
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  review_confirmation_ref?: string;
}): NextWorkSignalWouldWriteRecordPreview {
  const signals = refreshPreview?.proposed_next_work_signals;
  const warnRefs = signals?.warn_context_refs ?? [];
  const dropRefs = signals?.drop_or_deprioritize_context_refs ?? [];
  const insufficient = refreshPreview?.insufficient_data_reasons ?? [];
  return {
    proposed_record_kind: refreshPreview
      ? NEXT_WORK_SIGNAL_DECISION_RECORD_VERSION
      : null,
    proposed_receipt_kind: refreshPreview
      ? NEXT_WORK_SIGNAL_DECISION_RECEIPT_VERSION
      : null,
    proposed_store_kind: refreshPreview
      ? NEXT_WORK_SIGNAL_DECISION_STORE_VERSION
      : null,
    selected_signal_refs: selectedRefs,
    selectable_signal_refs: selectableRefs,
    selected_signal_summaries: selectedSummaries,
    signal_summaries: signalSummaries,
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    source_metric_snapshot_record_refs:
      metricRecordReview?.records.map((record) => record.record_id) ?? [],
    source_reuse_ledger_record_refs: [],
    source_expected_observed_delta_record_refs: [],
    source_next_work_signal_refresh_preview_ref:
      refreshPreview?.preview_version ?? null,
    preserve_context_refs: signals?.preserve_context_refs ?? [],
    warn_context_refs: warnRefs,
    drop_or_deprioritize_context_refs: dropRefs,
    verification_focus_candidates: signals?.verification_focus_candidates ?? [],
    expected_observed_followup_candidates:
      signals?.expected_observed_followup_candidates ?? [],
    handoff_quality_focus_candidates:
      signals?.handoff_quality_focus_candidates ?? [],
    context_diet_candidates: signals?.context_diet_candidates ?? [],
    review_burden_reduction_candidates:
      signals?.review_burden_reduction_candidates ?? [],
    unresolved_gap_candidates: insufficient,
    stale_or_misleading_context_warnings: [...warnRefs, ...dropRefs].filter((ref) =>
      /stale|misleading|unknown|missing|noisy/i.test(ref),
    ),
    requested_operator_ref: requested_operator_ref ?? null,
    requested_idempotency_key: requested_idempotency_key ?? null,
    review_confirmation_ref: review_confirmation_ref ?? null,
    review_summary: refreshPreview
      ? `Next-work signal decision from ${refreshPreview.input_summary.next_work_signal_count} refresh signal(s).`
      : "No next-work signal refresh preview supplied.",
  };
}

function isNextWorkSignalRefreshPreview(
  value: unknown,
): value is NextWorkSignalRefreshPreview {
  return (
    isRecord(value) &&
    value.preview_version === NEXT_WORK_SIGNAL_REFRESH_PREVIEW_VERSION &&
    isRecord(value.authority_boundary) &&
    isRecord(value.proposed_next_work_signals) &&
    isRecord(value.evidence_summary)
  );
}

function isDogfoodMetricSnapshotRecordReview(
  value: unknown,
): value is DogfoodMetricSnapshotRecordReview {
  return (
    isRecord(value) &&
    value.review_version === DOGFOOD_METRIC_SNAPSHOT_RECORD_REVIEW_VERSION &&
    Array.isArray(value.records) &&
    isRecord(value.evidence_summary)
  );
}

function isDogfoodMetricSnapshotPreview(
  value: unknown,
): value is DogfoodMetricSnapshotPreview {
  return (
    isRecord(value) &&
    value.preview_version === DOGFOOD_METRIC_SNAPSHOT_PREVIEW_VERSION &&
    isRecord(value.evidence_summary)
  );
}

function hasReadOnlyRefreshAuthority(
  preview: NextWorkSignalRefreshPreview,
): boolean {
  const boundary = preview.authority_boundary;
  return (
    boundary.read_only === true &&
    boundary.candidate_material_only === true &&
    boundary.source_of_truth === false &&
    boundary.derived_read_model === true &&
    boundary.can_write_perspective_unit === false &&
    boundary.can_write_next_work_bias === false &&
    boundary.can_update_current_working_perspective === false &&
    boundary.can_update_continuity_relay === false &&
    boundary.can_mutate_handoff_context === false &&
    boundary.can_send_handoff === false &&
    boundary.can_write_memory === false &&
    boundary.can_write_dogfood_metrics === false &&
    boundary.can_write_reuse_outcome_ledger === false &&
    boundary.can_call_provider_openai === false &&
    boundary.can_call_github === false &&
    boundary.can_execute_codex === false &&
    boundary.can_create_pr === false &&
    boundary.can_merge_pr === false &&
    boundary.can_run_autonomous_action === false &&
    boundary.can_create_graph_or_vector_store === false &&
    boundary.can_create_rag_stack === false &&
    boundary.can_crawl_or_observe_browser === false
  );
}

function safeRef(value: unknown): string | null {
  return isCandidateIngressPublicSafeRefV01(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
