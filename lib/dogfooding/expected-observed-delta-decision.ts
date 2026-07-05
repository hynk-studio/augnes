import {
  asCandidateIngressPublicSafeRefV01,
  detectCandidateIngressUnsafeMarkersV01,
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import type { CandidateIngressNormalizedCandidate } from "@/types/candidate-ingress-normalizer";
import {
  EXPECTED_OBSERVED_DELTA_OPERATOR_DECISION_PREVIEW_VERSION,
  type ExpectedObservedDeltaAvailableOperatorDecision,
  type ExpectedObservedDeltaDecisionAuthorityBoundary,
  type ExpectedObservedDeltaOperatorDecisionPreview,
  type ExpectedObservedDeltaOperatorDecisionPreviewInput,
  type ExpectedObservedDeltaOperatorDecisionStatus,
  type ExpectedObservedDeltaRecommendedOperatorDecision,
  type ExpectedObservedDeltaWouldWriteRecordPreview,
} from "@/types/expected-observed-delta-decision";
import {
  EXPECTED_OBSERVED_DELTA_PREVIEW_VERSION,
  type ExpectedObservedDeltaCandidateBuckets,
  type ExpectedObservedDeltaPreview,
  type ExpectedObservedDeltaPreviewAuthorityBoundary,
} from "@/types/expected-observed-delta-preview";

const DEFAULT_SCOPE = "project:augnes" as const;
const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;

const availableOperatorDecisions: ExpectedObservedDeltaAvailableOperatorDecision[] = [
  "approve_for_expected_observed_delta_record",
  "defer",
  "reject",
  "keep_candidate",
  "request_more_evidence",
];

const previewFalseAuthorityFields = [
  "can_write_expected_observed_delta",
  "can_write_reuse_outcome_ledger",
  "can_write_dogfood_metrics",
  "can_write_work_episode",
  "can_write_memory",
  "can_write_perspective_unit",
  "can_write_next_work_bias",
  "can_update_current_working_perspective",
  "can_update_continuity_relay",
  "can_mutate_handoff_context",
  "can_send_handoff",
  "can_call_provider_openai",
  "can_call_github",
  "can_execute_codex",
  "can_create_pr",
  "can_merge_pr",
  "can_run_autonomous_action",
  "can_create_graph_or_vector_store",
  "can_create_rag_stack",
  "can_crawl_or_observe_browser",
] as const satisfies readonly (keyof ExpectedObservedDeltaPreviewAuthorityBoundary)[];

export function buildExpectedObservedDeltaOperatorDecisionPreviewV01({
  expected_observed_delta_preview,
  selected_delta_candidate_refs,
  requested_operator_ref,
  requested_idempotency_key,
  review_confirmation_ref,
  as_of,
  scope,
  source_refs,
}: ExpectedObservedDeltaOperatorDecisionPreviewInput = {}): ExpectedObservedDeltaOperatorDecisionPreview {
  const previewStatus = getPreviewSourceStatus(expected_observed_delta_preview);
  const deltaPreview = isExpectedObservedDeltaPreview(
    expected_observed_delta_preview,
  )
    ? expected_observed_delta_preview
    : null;
  const selectableCandidates = deltaPreview
    ? selectableDeltaCandidates(deltaPreview.delta_candidates)
    : [];
  const reviewOnlyCandidates =
    deltaPreview?.delta_candidates.review_only_candidates ?? [];
  const selectableRefs = uniqueCandidateIngressStringsV01(
    selectableCandidates.map((candidate) => candidate.candidate_id),
  );
  const selectedRefs = uniqueCandidateIngressStringsV01(
    selected_delta_candidate_refs ?? [],
  );
  const unsafeSelectedRefs = selectedRefs.filter(
    (ref) => !isCandidateIngressPublicSafeRefV01(ref),
  );
  const unknownSelectedRefs = selectedRefs.filter(
    (ref) => isCandidateIngressPublicSafeRefV01(ref) && !selectableRefs.includes(ref),
  );
  const selectedCandidates = selectableCandidates.filter((candidate) =>
    selectedRefs.includes(candidate.candidate_id),
  );
  const reviewConfirmationRef = asCandidateIngressPublicSafeRefV01(
    review_confirmation_ref,
  );
  const idempotencyKey = asCandidateIngressPublicSafeRefV01(
    requested_idempotency_key,
  );
  const operatorRef = asCandidateIngressPublicSafeRefV01(requested_operator_ref);
  const evidenceRefs = uniqueCandidateIngressStringsV01([
    ...(deltaPreview?.evidence_summary.evidence_refs ?? []),
    ...selectedCandidates.flatMap((candidate) => candidate.evidence_refs),
  ]).filter(isCandidateIngressPublicSafeRefV01);
  const sourceRefs = uniqueCandidateIngressStringsV01([
    ...(source_refs ?? []),
    ...(deltaPreview?.source_refs ?? []),
    ...selectedCandidates.flatMap((candidate) => candidate.source_refs),
  ]).filter(isCandidateIngressPublicSafeRefV01);
  const refusalReasons = uniqueCandidateIngressStringsV01([
    ...(previewStatus === "wrong_version" ? ["expected_observed_delta_preview_wrong_version"] : []),
    ...(previewStatus === "malformed" ? ["expected_observed_delta_preview_malformed"] : []),
    ...(unsafeSelectedRefs.length > 0 ? ["selected_delta_candidate_refs_unsafe"] : []),
    ...(unknownSelectedRefs.length > 0 ? ["selected_delta_candidate_refs_not_in_delta_preview"] : []),
    ...detectCandidateIngressUnsafeMarkersV01(
      JSON.stringify({
        requested_operator_ref,
        requested_idempotency_key,
        review_confirmation_ref,
      }),
    ).map((reason) => `decision_input_${reason}`),
    ...(deltaPreview && !previewAuthorityIsReadOnly(deltaPreview.authority_boundary)
      ? ["expected_observed_delta_preview_authority_boundary_invalid"]
      : []),
  ]);
  const missingEvidence = uniqueCandidateIngressStringsV01([
    ...(deltaPreview?.evidence_summary.missing_evidence ?? []),
    ...(evidenceRefs.length === 0 ? ["evidence_refs_missing"] : []),
  ]);
  const insufficientDataReasons = uniqueCandidateIngressStringsV01([
    ...(previewStatus === "missing" ? ["expected_observed_delta_preview_missing"] : []),
    ...(deltaPreview?.insufficient_data_reasons ?? []),
    ...(selectableRefs.length === 0 ? ["selectable_delta_candidate_refs_missing"] : []),
    ...(selectedRefs.length === 0 ? ["selected_delta_candidate_refs_missing"] : []),
    ...(sourceRefs.length === 0 ? ["source_refs_missing"] : []),
    ...(evidenceRefs.length === 0 ? ["evidence_refs_missing"] : []),
    ...(!reviewConfirmationRef ? ["review_confirmation_ref_missing"] : []),
    ...(!idempotencyKey ? ["requested_idempotency_key_missing"] : []),
    ...(!operatorRef ? ["requested_operator_ref_missing"] : []),
  ]);
  const blockingReasons = uniqueCandidateIngressStringsV01([
    ...(deltaPreview?.blocked_reasons ?? []),
    ...refusalReasons,
  ]);
  const writeReady =
    previewStatus === "supplied" &&
    deltaPreview?.delta_preview_status === "ready_for_operator_review" &&
    selectedRefs.length > 0 &&
    unknownSelectedRefs.length === 0 &&
    unsafeSelectedRefs.length === 0 &&
    Boolean(reviewConfirmationRef) &&
    Boolean(idempotencyKey) &&
    Boolean(operatorRef) &&
    sourceRefs.length > 0 &&
    evidenceRefs.length > 0 &&
    blockingReasons.length === 0 &&
    missingEvidence.length === 0 &&
    insufficientDataReasons.length === 0;
  const decisionStatus = determineStatus({
    previewStatus,
    writeReady,
    blockingReasons,
    missingEvidence,
    insufficientDataReasons,
    selectableRefs,
    deltaPreview,
  });
  const recommendedDecision = determineRecommendedDecision({
    decisionStatus,
    insufficientDataReasons,
    missingEvidence,
    blockingReasons,
  });

  return {
    runtime: "augnes",
    preview_version: EXPECTED_OBSERVED_DELTA_OPERATOR_DECISION_PREVIEW_VERSION,
    scope: scope ?? deltaPreview?.scope ?? DEFAULT_SCOPE,
    as_of: as_of ?? deltaPreview?.as_of ?? FALLBACK_AS_OF,
    source_refs: sourceRefs,
    decision_preview_status: decisionStatus,
    recommended_operator_decision: recommendedDecision,
    available_operator_decisions: availableOperatorDecisions,
    input_summary: {
      has_valid_expected_observed_delta_preview: previewStatus === "supplied",
      selected_delta_candidate_ref_count: selectedRefs.length,
      selectable_delta_candidate_ref_count: selectableRefs.length,
      would_write_delta_candidate_count: selectedCandidates.length,
      review_only_candidate_count: reviewOnlyCandidates.length,
      blocker_count: blockingReasons.length,
      missing_evidence_count: missingEvidence.length,
      refusal_reason_count: refusalReasons.length,
      insufficient_data_reason_count: insufficientDataReasons.length,
      review_confirmation_supplied: Boolean(reviewConfirmationRef),
      requested_idempotency_key_supplied: Boolean(idempotencyKey),
      requested_operator_ref_supplied: Boolean(operatorRef),
    },
    source_status: {
      expected_observed_delta_preview: previewStatus,
      delta_preview_authority_boundary: deltaPreview
        ? previewAuthorityIsReadOnly(deltaPreview.authority_boundary)
          ? "valid_read_only"
          : "invalid"
        : "missing",
      selected_delta_candidate_refs: unsafeSelectedRefs.length > 0
        ? "unsafe"
        : unknownSelectedRefs.length > 0
          ? "unknown_ref"
          : selectedRefs.length > 0
            ? "supplied"
            : "missing",
      review_confirmation_ref: refStatus(review_confirmation_ref),
      requested_idempotency_key: refStatus(requested_idempotency_key),
      requested_operator_ref: refStatus(requested_operator_ref),
    },
    write_readiness: {
      write_ready: writeReady,
      readiness_label: writeReady
        ? "ready_for_future_delta_record_write"
        : "not_ready_for_expected_observed_delta_record_write",
      requires_valid_expected_observed_delta_preview: true,
      requires_delta_preview_ready_for_operator_review: true,
      requires_selected_delta_candidate_refs: true,
      requires_review_confirmation: true,
      requires_idempotency_key: true,
      requires_operator_ref: true,
      requires_source_refs: true,
      requires_evidence_refs: true,
      requires_no_blockers: true,
      requires_no_missing_evidence: true,
      requires_no_refusal_reasons: true,
      requires_read_only_delta_preview: true,
      current_blockers: blockingReasons,
      current_missing_evidence: missingEvidence,
      current_refusal_reasons: refusalReasons,
      current_insufficient_data: insufficientDataReasons,
    },
    approval_requirements: [
      "valid_expected_observed_delta_preview",
      "selected_delta_candidate_refs_from_preview",
      "operator_review_confirmation",
      "idempotency_key",
      "operator_ref_source_refs_and_evidence_refs",
      "operator_confirmation_for_expected_observed_delta_record_only",
    ],
    blocking_reasons: blockingReasons,
    missing_evidence: missingEvidence,
    refusal_reasons: refusalReasons,
    evidence_summary: {
      has_valid_expected_observed_delta_preview: previewStatus === "supplied",
      has_delta_candidate_material: selectableRefs.length > 0,
      has_selected_delta_candidate_refs: selectedRefs.length > 0,
      has_source_refs: sourceRefs.length > 0,
      has_evidence_refs: evidenceRefs.length > 0,
      has_review_confirmation: Boolean(reviewConfirmationRef),
      has_idempotency_key: Boolean(idempotencyKey),
      has_operator_ref: Boolean(operatorRef),
      has_missing_evidence: missingEvidence.length > 0,
      has_refusal_reasons: refusalReasons.length > 0,
      has_unsafe_refs: unsafeSelectedRefs.length > 0,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      missing_evidence: missingEvidence,
      unsafe_refs: unsafeSelectedRefs.map(() => "selected_delta_candidate_ref_unsafe"),
    },
    would_write_delta_record_preview: buildWouldWritePreview({
      deltaPreview,
      selectedCandidates,
      selectedRefs,
      selectableRefs,
      reviewOnlyCandidates,
      reviewConfirmationRef,
      operatorRef,
      idempotencyKey,
      sourceRefs,
      evidenceRefs,
    }),
    selected_delta_candidates: selectedCandidates,
    candidate_carry_forward: {
      review_only_candidates: reviewOnlyCandidates,
    },
    would_not_write: [
      "does_not_write_db",
      "does_not_write_expected_observed_delta_record",
      "does_not_write_reuse_outcome_ledger",
      "does_not_write_dogfood_metrics",
      "does_not_write_work_episode",
      "does_not_write_memory",
      "does_not_update_current_working_perspective",
      "does_not_write_perspective_unit",
      "does_not_write_next_work_bias",
      "does_not_update_continuity_relay",
      "does_not_mutate_handoff_context",
      "does_not_send_handoff",
      "does_not_call_provider_openai_github_or_codex",
    ],
    review_checklist: [
      "review_selected_expected_observed_delta_candidates",
      "confirm_review_only_candidates_are_excluded_from_would_write_material",
      "confirm_skipped_checks_and_not_done_items_are_preserved_as_gaps",
      "confirm_expected_observed_delta_record_is_learning_signal_not_approval",
      "confirm_no_reuse_ledger_metric_memory_perspective_cwp_relay_or_handoff_write",
    ],
    non_goals: [
      "reuse_outcome_ledger_write",
      "dogfood_metric_write",
      "work_episode_durable_write",
      "memory_write",
      "perspective_unit_durable_mutation",
      "next_work_bias_durable_mutation",
      "cwp_mutation",
      "continuity_relay_write",
      "handoff_context_mutation_or_send",
      "provider_github_codex_call",
    ],
    authority_boundary:
      createExpectedObservedDeltaOperatorDecisionAuthorityBoundaryV01(),
    fallback_reason: buildFallbackReason({
      previewStatus,
      blockingReasons,
      missingEvidence,
      insufficientDataReasons,
      refusalReasons,
    }),
    notes: [
      "ExpectedObservedDelta operator decision preview consumes only the already-built ExpectedObservedDelta preview.",
      "The preview canonicalizes selectable delta refs and excludes review-only candidates from future write material.",
    ],
  };
}

export function createExpectedObservedDeltaOperatorDecisionAuthorityBoundaryV01(): ExpectedObservedDeltaDecisionAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_persist_decision: false,
    can_write_db: false,
    can_create_schema: false,
    can_write_expected_observed_delta: false,
    can_write_expected_observed_delta_receipt: false,
    can_write_reuse_outcome_ledger: false,
    can_write_dogfood_metrics: false,
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
      "ExpectedObservedDelta operator decision preview is read-only and advisory.",
      "It cannot write the delta record, reuse ledger, dogfood metrics, WorkEpisode, memory, Perspective, CWP, relay, handoff, provider, GitHub, Codex, PR, or autonomous state.",
    ],
  };
}

export function getExpectedObservedDeltaSelectableCandidateRefsV01(
  preview: ExpectedObservedDeltaOperatorDecisionPreview,
): string[] {
  return preview.would_write_delta_record_preview.selectable_delta_candidate_refs;
}

function buildWouldWritePreview({
  deltaPreview,
  selectedCandidates,
  selectedRefs,
  selectableRefs,
  reviewOnlyCandidates,
  reviewConfirmationRef,
  operatorRef,
  idempotencyKey,
  sourceRefs,
  evidenceRefs,
}: {
  deltaPreview: ExpectedObservedDeltaPreview | null;
  selectedCandidates: CandidateIngressNormalizedCandidate[];
  selectedRefs: string[];
  selectableRefs: string[];
  reviewOnlyCandidates: CandidateIngressNormalizedCandidate[];
  reviewConfirmationRef: string | null;
  operatorRef: string | null;
  idempotencyKey: string | null;
  sourceRefs: string[];
  evidenceRefs: string[];
}): ExpectedObservedDeltaWouldWriteRecordPreview {
  const firstCandidate = selectedCandidates[0] ?? null;
  return {
    proposed_record_kind: "expected_observed_delta_record.v0.1",
    proposed_receipt_kind: "expected_observed_delta_receipt.v0.1",
    selected_delta_candidate_refs: selectedRefs.filter((ref) =>
      selectableRefs.includes(ref),
    ),
    selectable_delta_candidate_refs: selectableRefs,
    excluded_review_only_candidate_refs: uniqueCandidateIngressStringsV01(
      reviewOnlyCandidates.map((candidate) => candidate.candidate_id),
    ),
    delta_candidate_summaries: selectedCandidates.map((candidate) => ({
      candidate_ref: candidate.candidate_id,
      bucket: bucketForCandidate(deltaPreview, candidate.candidate_id),
      candidate_kind: candidate.candidate_kind,
      label: candidate.label,
      summary: candidate.summary,
    })),
    expected_summary: deltaPreview?.expected_summary ?? emptyExpectedSummary(),
    observed_summary: deltaPreview?.observed_summary ?? emptyObservedSummary(),
    mismatch_summary:
      deltaPreview?.mismatch_summary ?? {
        matched_expectation_count: 0,
        missing_expectation_count: 0,
        unexpected_observation_count: 0,
        skipped_or_unverified_check_count: 0,
        not_done_count: 0,
        changed_file_delta_count: 0,
        requirement_progress_delta_count: 0,
        non_goal_risk_count: 0,
        followup_delta_count: 0,
        context_reuse_signal_count: 0,
        summary: "no_expected_observed_delta_preview",
      },
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    work_ref: firstCandidate?.work_ref ?? null,
    result_ref: firstCandidate?.result_ref ?? null,
    handoff_ref: null,
    codex_result_report_intake_record_refs: sourceRefs.filter((ref) =>
      ref.startsWith("record:"),
    ),
    work_episode_residue_preview_ref: deltaPreview?.source_refs.find((ref) =>
      ref.includes("work_episode_residue_candidate_preview.v0.1"),
    ) ?? null,
    review_confirmation_ref: reviewConfirmationRef,
    requested_operator_ref: operatorRef,
    requested_idempotency_key: idempotencyKey,
    review_summary: `Selected ${selectedCandidates.length} ExpectedObservedDelta candidates for future scoped record write review.`,
  };
}

function selectableDeltaCandidates(
  buckets: ExpectedObservedDeltaCandidateBuckets,
): CandidateIngressNormalizedCandidate[] {
  return (Object.entries(buckets) as Array<
    [keyof ExpectedObservedDeltaCandidateBuckets, CandidateIngressNormalizedCandidate[]]
  >)
    .filter(([bucket]) => bucket !== "review_only_candidates")
    .flatMap(([, candidates]) => candidates);
}

function bucketForCandidate(
  preview: ExpectedObservedDeltaPreview | null,
  candidateId: string,
): keyof ExpectedObservedDeltaCandidateBuckets {
  if (!preview) return "review_only_candidates";
  for (const [bucket, candidates] of Object.entries(
    preview.delta_candidates,
  ) as Array<[keyof ExpectedObservedDeltaCandidateBuckets, CandidateIngressNormalizedCandidate[]]>) {
    if (candidates.some((candidate) => candidate.candidate_id === candidateId)) {
      return bucket;
    }
  }
  return "review_only_candidates";
}

function determineStatus({
  previewStatus,
  writeReady,
  blockingReasons,
  missingEvidence,
  insufficientDataReasons,
  selectableRefs,
  deltaPreview,
}: {
  previewStatus: ExpectedObservedDeltaOperatorDecisionPreview["source_status"]["expected_observed_delta_preview"];
  writeReady: boolean;
  blockingReasons: string[];
  missingEvidence: string[];
  insufficientDataReasons: string[];
  selectableRefs: string[];
  deltaPreview: ExpectedObservedDeltaPreview | null;
}): ExpectedObservedDeltaOperatorDecisionStatus {
  if (previewStatus === "missing") return "no_expected_observed_delta_preview";
  if (blockingReasons.length > 0) return "blocked";
  if (missingEvidence.length > 0) return "needs_more_evidence";
  if (writeReady) return "ready_for_future_delta_record_write";
  if (deltaPreview?.delta_preview_status === "keep_preview_only") return "keep_preview_only";
  if (selectableRefs.length > 0 && insufficientDataReasons.length === 0) {
    return "ready_for_operator_decision";
  }
  if (selectableRefs.length > 0) return "needs_operator_judgment";
  return "insufficient_data";
}

function determineRecommendedDecision({
  decisionStatus,
  insufficientDataReasons,
  missingEvidence,
  blockingReasons,
}: {
  decisionStatus: ExpectedObservedDeltaOperatorDecisionStatus;
  insufficientDataReasons: string[];
  missingEvidence: string[];
  blockingReasons: string[];
}): ExpectedObservedDeltaRecommendedOperatorDecision {
  if (decisionStatus === "ready_for_future_delta_record_write") {
    return "approve_for_expected_observed_delta_record";
  }
  if (blockingReasons.length > 0) return "resolve_blockers";
  if (missingEvidence.length > 0) return "defer_until_evidence_supplied";
  if (insufficientDataReasons.includes("expected_material_missing")) {
    return "defer_until_expected_material_supplied";
  }
  if (insufficientDataReasons.includes("observed_material_missing")) {
    return "defer_until_observed_material_supplied";
  }
  if (insufficientDataReasons.includes("selected_delta_candidate_refs_missing")) {
    return "defer_until_selected_delta_refs_supplied";
  }
  if (insufficientDataReasons.includes("requested_idempotency_key_missing")) {
    return "defer_until_idempotency_supplied";
  }
  if (decisionStatus === "keep_preview_only") return "keep_as_candidate_only";
  return "request_more_evidence";
}

function getPreviewSourceStatus(
  value: unknown,
): ExpectedObservedDeltaOperatorDecisionPreview["source_status"]["expected_observed_delta_preview"] {
  if (!value) return "missing";
  if (!isRecord(value) || value.preview_version !== EXPECTED_OBSERVED_DELTA_PREVIEW_VERSION) {
    return "wrong_version";
  }
  return isExpectedObservedDeltaPreview(value) ? "supplied" : "malformed";
}

function isExpectedObservedDeltaPreview(
  value: unknown,
): value is ExpectedObservedDeltaPreview {
  return (
    isRecord(value) &&
    value.preview_version === EXPECTED_OBSERVED_DELTA_PREVIEW_VERSION &&
    isRecord(value.delta_candidates) &&
    isRecord(value.authority_boundary) &&
    isRecord(value.evidence_summary)
  );
}

function previewAuthorityIsReadOnly(
  authority: ExpectedObservedDeltaPreviewAuthorityBoundary,
): boolean {
  return (
    authority.read_only === true &&
    authority.candidate_material_only === true &&
    authority.source_of_truth === false &&
    authority.derived_read_model === true &&
    previewFalseAuthorityFields.every((field) => authority[field] === false)
  );
}

function refStatus(value: unknown): "supplied" | "missing" | "unsafe" {
  if (value === undefined || value === null || value === "") return "missing";
  return isCandidateIngressPublicSafeRefV01(value) ? "supplied" : "unsafe";
}

function buildFallbackReason({
  previewStatus,
  blockingReasons,
  missingEvidence,
  insufficientDataReasons,
  refusalReasons,
}: {
  previewStatus: string;
  blockingReasons: string[];
  missingEvidence: string[];
  insufficientDataReasons: string[];
  refusalReasons: string[];
}): string | null {
  if (previewStatus !== "supplied") return `expected_observed_delta_preview_${previewStatus}`;
  if (blockingReasons.length > 0) return blockingReasons[0] ?? null;
  if (refusalReasons.length > 0) return refusalReasons[0] ?? null;
  if (missingEvidence.length > 0) return missingEvidence[0] ?? null;
  if (insufficientDataReasons.length > 0) return insufficientDataReasons[0] ?? null;
  return null;
}

function emptyExpectedSummary(): ExpectedObservedDeltaPreview["expected_summary"] {
  return {
    expected_file_refs: [],
    expected_check_refs: [],
    expected_requirement_progress: [],
    expected_non_goals: [],
    expected_risks: [],
    expected_followups: [],
    expected_signal_refs: [],
    has_explicit_expected_material: false,
    derived_expected_signal_count: 0,
  };
}

function emptyObservedSummary(): ExpectedObservedDeltaPreview["observed_summary"] {
  return {
    changed_files: [],
    passed_or_completed_checks: [],
    skipped_or_unverified_checks: [],
    not_done_items: [],
    requirement_progress: [],
    risks: [],
    followups: [],
    context_reuse_signals: [],
    observed_signal_refs: [],
    has_observed_material: false,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
