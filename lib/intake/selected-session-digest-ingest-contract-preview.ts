import {
  SELECTED_SESSION_DIGEST_INTAKE_PREVIEW_VERSION,
  type SelectedSessionDigestIntakeAuthorityBoundary,
  type SelectedSessionDigestIntakeCandidate,
  type SelectedSessionDigestIntakeCandidateKind,
  type SelectedSessionDigestIntakeCandidateMaterial,
  type SelectedSessionDigestIntakePreview,
  type SelectedSessionDigestSourceKind,
} from "@/types/selected-session-digest-intake-preview";
import {
  SELECTED_SESSION_DIGEST_INGEST_CONTRACT_PREVIEW_VERSION,
  type SelectedSessionDigestFutureIngestWriteContract,
  type SelectedSessionDigestIngestCandidateSummary,
  type SelectedSessionDigestIngestContractAuthorityBoundary,
  type SelectedSessionDigestIngestContractCarryForward,
  type SelectedSessionDigestIngestContractEvidenceSummary,
  type SelectedSessionDigestIngestContractInputSummary,
  type SelectedSessionDigestIngestContractPreview,
  type SelectedSessionDigestIngestContractPreviewInput,
  type SelectedSessionDigestIngestContractPreviewStatus,
  type SelectedSessionDigestIngestContractReadiness,
  type SelectedSessionDigestIngestContractRecommendedNextAction,
  type SelectedSessionDigestIngestContractSourceStatus,
  type SelectedSessionDigestIngestPrivacyReviewSummary,
  type SelectedSessionDigestWouldIngestMaterialPreview,
} from "@/types/selected-session-digest-ingest-contract-preview";

const DEFAULT_SCOPE = "project:augnes" as const;
const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;

const ingestableCandidateBuckets = [
  "session_summary_candidates",
  "user_goal_candidates",
  "decision_candidates",
  "open_question_candidates",
  "next_action_candidates",
  "evidence_ref_candidates",
  "source_ref_candidates",
  "risk_or_blocker_candidates",
  "reusable_context_candidates",
] as const;

const intakeFalseAuthorityFields = [
  "can_write_db",
  "can_create_schema",
  "can_create_ingest_record",
  "can_write_memory",
  "can_mutate_memory",
  "can_promote_memory",
  "can_mutate_current_working_perspective",
  "can_write_perspective_unit",
  "can_write_next_work_bias",
  "can_update_continuity_relay",
  "can_mutate_handoff_context",
  "can_write_selected_refs_to_live_handoff",
  "can_send_handoff",
  "can_write_dogfood_metrics",
  "can_write_reuse_ledger",
  "can_call_provider_openai",
  "can_call_github",
  "can_execute_codex",
  "can_create_pr",
  "can_merge_pr",
  "can_run_autonomous_action",
  "can_create_graph_or_vector_store",
  "can_create_rag_stack",
  "can_crawl_or_observe_browser",
] as const satisfies readonly (keyof SelectedSessionDigestIntakeAuthorityBoundary)[];

type IntakePreviewSourceStatus =
  SelectedSessionDigestIngestContractSourceStatus["selected_session_digest_intake_preview"];
type IngestableCandidateKind = Exclude<
  SelectedSessionDigestIntakeCandidateKind,
  "rejected_or_review_only"
>;
type SelectedCandidateRefValidation = {
  canonical_candidate_refs: Set<string>;
  unknown_public_safe_refs: string[];
  refusal_reasons: string[];
};

export function buildSelectedSessionDigestIngestContractPreviewV01({
  selected_session_digest_intake_preview,
  selected_candidate_refs,
  requested_operator_ref,
  requested_idempotency_key,
  privacy_review_confirmation_ref,
  requested_ingest_scope_ref,
  as_of,
  scope,
  source_refs,
}: SelectedSessionDigestIngestContractPreviewInput = {}): SelectedSessionDigestIngestContractPreview {
  const sourcePreviewStatus = getIntakePreviewSourceStatus(
    selected_session_digest_intake_preview,
  );
  const shapeProblems = buildIntakePreviewShapeProblems(
    selected_session_digest_intake_preview,
  );
  const intakePreview = isCompleteIntakePreviewShape(
    selected_session_digest_intake_preview,
  )
    ? selected_session_digest_intake_preview
    : null;
  const intakePreviewRef = intakePreview
    ? buildIntakePreviewInstanceRef(intakePreview)
    : null;
  const sourceStatus = buildSourceStatus({
    intakePreview,
    sourcePreviewStatus,
  });
  const selectedCandidateRefValidation = buildSelectedCandidateRefValidation({
    intakePreview,
    selected_candidate_refs,
  });
  const candidateSummaryUnsafeReasons =
    buildCandidateSummaryUnsafeReasons(intakePreview);
  const contractRefusalReasons = buildRefusalReasons({
    selected_candidate_refs,
    selectedCandidateRefValidation,
    requested_operator_ref,
    requested_idempotency_key,
    privacy_review_confirmation_ref,
    requested_ingest_scope_ref,
  });
  const wouldIngestMaterial = buildWouldIngestMaterialPreview({
    intakePreview,
    intakePreviewRef,
    selected_candidate_refs,
    selectedCandidateRefValidation,
    requested_operator_ref,
    requested_idempotency_key,
    privacy_review_confirmation_ref,
    requested_ingest_scope_ref,
  });
  const carryForward = buildCarryForward(intakePreview);
  const missingEvidence = buildMissingEvidence({
    intakePreview,
    wouldIngestMaterial,
  });
  const refusalReasons = uniqueSortedStrings([
    ...contractRefusalReasons,
    ...candidateSummaryUnsafeReasons,
  ]);
  const insufficientDataReasons = buildInsufficientDataReasons({
    intakePreview,
    sourcePreviewStatus,
    shapeProblems,
    requested_operator_ref,
    requested_idempotency_key,
    privacy_review_confirmation_ref,
    wouldIngestMaterial,
    missingEvidence,
  });
  const blockedReasons = buildBlockedReasons({
    intakePreview,
    sourcePreviewStatus,
    sourceStatus,
    refusalReasons,
  });
  const readiness = buildReadiness({
    intakePreview,
    sourceStatus,
    wouldIngestMaterial,
    blockedReasons,
    insufficientDataReasons,
    missingEvidence,
    refusalReasons,
  });
  const contractPreviewStatus = determineContractPreviewStatus({
    intakePreview,
    sourcePreviewStatus,
    readiness,
    wouldIngestMaterial,
    blockedReasons,
  });
  const recommendedNextAction = determineRecommendedNextAction({
    intakePreview,
    sourcePreviewStatus,
    readiness,
    wouldIngestMaterial,
    blockedReasons,
    refusalReasons,
  });
  const evidenceSummary = buildEvidenceSummary({
    intakePreview,
    sourcePreviewStatus,
    sourceStatus,
    wouldIngestMaterial,
    missingEvidence,
    blockedReasons,
    insufficientDataReasons,
    refusalReasons,
  });
  const privacyReviewSummary = buildPrivacyReviewSummary({
    intakePreview,
    privacy_review_confirmation_ref,
    refusalReasons,
  });

  return {
    preview_version: SELECTED_SESSION_DIGEST_INGEST_CONTRACT_PREVIEW_VERSION,
    scope: scope ?? intakePreview?.scope ?? DEFAULT_SCOPE,
    as_of: as_of ?? intakePreview?.as_of ?? FALLBACK_AS_OF,
    source_refs: buildSourceRefs({
      intakePreview,
      source_refs,
      intakePreviewRef,
    }),
    contract_preview_status: contractPreviewStatus,
    recommended_next_action: recommendedNextAction,
    input_summary: buildInputSummary({
      intakePreview,
      wouldIngestMaterial,
      carryForward,
      selected_candidate_refs,
      requested_operator_ref,
      requested_idempotency_key,
      privacy_review_confirmation_ref,
      requested_ingest_scope_ref,
      blockedReasons,
      insufficientDataReasons,
      refusalReasons,
    }),
    source_status: sourceStatus,
    future_ingest_write_contract: buildFutureIngestWriteContract(
      intakePreviewRef,
    ),
    would_ingest_material_preview: wouldIngestMaterial,
    carry_forward_review_only_material: carryForward,
    readiness,
    refusal_reasons: refusalReasons,
    blocked_reasons: blockedReasons,
    insufficient_data_reasons: insufficientDataReasons,
    missing_evidence: missingEvidence,
    privacy_review_summary: privacyReviewSummary,
    evidence_summary: evidenceSummary,
    operator_review_checklist: buildOperatorReviewChecklist(),
    would_not_write: buildWouldNotWrite(),
    non_goals: buildNonGoals(),
    authority_boundary:
      createSelectedSessionDigestIngestContractAuthorityBoundaryV01(),
  };
}

export function createSelectedSessionDigestIngestContractAuthorityBoundaryV01(): SelectedSessionDigestIngestContractAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_persist_decision: false,
    can_write_db: false,
    can_create_schema: false,
    can_create_ingest_record: false,
    can_create_ingest_receipt: false,
    can_write_selected_session_digest: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_mutate_current_working_perspective: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_update_continuity_relay: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_send_handoff: false,
    can_write_dogfood_metrics: false,
    can_write_reuse_ledger: false,
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
      "Selected session digest ingest contract preview is read-only and advisory.",
      "It consumes an already-built selected session digest intake preview and does not rebuild or parse raw digest material.",
      "Even when ready_for_future_ingest_write_scope is true, this preview cannot create ingest records, receipts, DB rows, memory, Perspective, CWP, relay, or handoff state.",
    ],
  };
}

function getIntakePreviewSourceStatus(
  value: unknown,
): IntakePreviewSourceStatus {
  if (!value) return "missing";
  if (!hasIntakePreviewVersion(value)) return "wrong_version";
  return buildIntakePreviewShapeProblems(value).length > 0
    ? "malformed"
    : "supplied";
}

function hasIntakePreviewVersion(value: unknown): boolean {
  return (
    isRecord(value) &&
    value.preview_version === SELECTED_SESSION_DIGEST_INTAKE_PREVIEW_VERSION
  );
}

function isCompleteIntakePreviewShape(
  value: unknown,
): value is SelectedSessionDigestIntakePreview {
  return (
    hasIntakePreviewVersion(value) &&
    buildIntakePreviewShapeProblems(value).length === 0
  );
}

function buildIntakePreviewShapeProblems(value: unknown): string[] {
  if (!hasIntakePreviewVersion(value)) return [];
  if (!isRecord(value)) return ["selected_session_intake_preview_malformed"];

  const problems: string[] = [];
  const inputSummary = recordField(value, "input_summary");
  if (
    !inputSummary ||
    typeof inputSummary.candidate_count !== "number" ||
    typeof inputSummary.source_kind !== "string" ||
    typeof inputSummary.source_ref_supplied !== "boolean" ||
    typeof inputSummary.operator_ref_supplied !== "boolean"
  ) {
    problems.push("intake_preview_input_summary_missing_or_invalid");
  }

  const sourceStatus = recordField(value, "source_status");
  if (
    !sourceStatus ||
    typeof sourceStatus.source_kind !== "string" ||
    typeof sourceStatus.source_ref !== "string" ||
    typeof sourceStatus.operator_ref !== "string" ||
    typeof sourceStatus.authority_boundary !== "string"
  ) {
    problems.push("intake_preview_source_status_missing_or_invalid");
  }

  const candidateMaterial = recordField(value, "candidate_material");
  if (
    !candidateMaterial ||
    !hasArrayFields(candidateMaterial, [
      ...ingestableCandidateBuckets,
      "rejected_or_review_only_candidates",
    ])
  ) {
    problems.push("intake_preview_candidate_material_missing_or_invalid");
  }

  const readiness = recordField(value, "readiness");
  if (
    !readiness ||
    typeof readiness.ready_for_operator_review !== "boolean" ||
    typeof readiness.ready_for_future_ingest_contract_preview !== "boolean" ||
    !Array.isArray(readiness.current_blockers) ||
    !Array.isArray(readiness.current_insufficient_data) ||
    !Array.isArray(readiness.current_unsafe_refs)
  ) {
    problems.push("intake_preview_readiness_missing_or_invalid");
  }

  const evidenceSummary = recordField(value, "evidence_summary");
  if (
    !hasArrayFields(evidenceSummary, [
      "source_refs",
      "evidence_refs",
      "missing_evidence",
      "unsafe_refs",
    ]) ||
    !hasBooleanFields(evidenceSummary, [
      "has_candidate_material",
      "has_evidence_refs",
      "has_operator_ref",
      "has_session_or_project_ref",
      "has_unsafe_refs",
    ])
  ) {
    problems.push("intake_preview_evidence_summary_missing_or_invalid");
  }

  const authorityBoundary = recordField(value, "authority_boundary");
  if (
    !authorityBoundary ||
    !hasBooleanFields(authorityBoundary, [
      "read_only",
      "advisory_only",
      "source_of_truth",
      "derived_read_model",
      ...intakeFalseAuthorityFields,
    ])
  ) {
    problems.push("intake_preview_authority_boundary_missing_or_invalid");
  }

  if (
    !Array.isArray(value.blocked_reasons) ||
    !Array.isArray(value.insufficient_data_reasons) ||
    !Array.isArray(value.unsafe_ref_reasons) ||
    !Array.isArray(value.privacy_review_notes)
  ) {
    problems.push("intake_preview_reason_arrays_missing_or_invalid");
  }

  return problems.length
    ? uniqueSortedStrings([
        "selected_session_intake_preview_malformed",
        ...problems,
      ])
    : [];
}

function buildSourceStatus({
  intakePreview,
  sourcePreviewStatus,
}: {
  intakePreview: SelectedSessionDigestIntakePreview | null;
  sourcePreviewStatus: IntakePreviewSourceStatus;
}): SelectedSessionDigestIngestContractSourceStatus {
  return {
    selected_session_digest_intake_preview: sourcePreviewStatus,
    intake_preview_status: intakePreview?.intake_preview_status ?? null,
    authority_boundary: intakePreview
      ? intakeAuthorityBoundaryValid(intakePreview)
        ? "valid_read_only"
        : "invalid"
      : "missing",
    intake_preview_write_authority: intakeWriteAuthorityAllFalse(intakePreview)
      ? "all_false"
      : "invalid",
  };
}

function buildWouldIngestMaterialPreview({
  intakePreview,
  intakePreviewRef,
  selected_candidate_refs,
  selectedCandidateRefValidation,
  requested_operator_ref,
  requested_idempotency_key,
  privacy_review_confirmation_ref,
  requested_ingest_scope_ref,
}: {
  intakePreview: SelectedSessionDigestIntakePreview | null;
  intakePreviewRef: string | null;
  selected_candidate_refs?: string[];
  selectedCandidateRefValidation: SelectedCandidateRefValidation;
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  privacy_review_confirmation_ref?: string;
  requested_ingest_scope_ref?: string;
}): SelectedSessionDigestWouldIngestMaterialPreview {
  const candidates = ingestableCandidates(intakePreview);
  const candidateRefs = canonicalIngestableCandidateRefs(intakePreview);
  const selectedRefs = uniqueSortedStrings(
    (selected_candidate_refs ?? []).filter((ref) =>
      selectedCandidateRefValidation.canonical_candidate_refs.has(ref),
    ),
  );
  const candidateSummaries = candidates.map(toCandidateSummary);

  return {
    selected_digest_candidate_refs: selectedRefs,
    selectable_digest_candidate_refs: candidateRefs,
    candidate_counts_by_kind: countCandidatesByKind(candidates),
    source_kind: intakePreview?.input_summary.source_kind ?? null,
    source_ref: firstPublicSafeString(
      candidates.map((candidate) => candidate.source_ref),
      "source_ref_missing_review_required",
    ),
    operator_ref:
      hasPublicSafeValue(requested_operator_ref)
        ? requested_operator_ref
        : firstPublicSafeString(
            candidates
              .map((candidate) => candidate.operator_ref)
              .filter((value): value is string => typeof value === "string"),
          ),
    session_ref: firstPublicSafeString(
      candidates
        .map((candidate) => candidate.session_ref)
        .filter((value): value is string => typeof value === "string"),
    ),
    project_ref: firstPublicSafeString(
      candidates
        .map((candidate) => candidate.project_ref)
        .filter((value): value is string => typeof value === "string"),
    ),
    source_refs: uniqueSortedStrings(
      (intakePreview?.evidence_summary.source_refs ?? []).filter(
        hasPublicSafeValue,
      ),
    ),
    evidence_refs: uniqueSortedStrings(
      (intakePreview?.evidence_summary.evidence_refs ?? []).filter(
        hasPublicSafeValue,
      ),
    ),
    intake_preview_ref: intakePreviewRef,
    privacy_review_confirmation_ref: hasPublicSafeValue(
      privacy_review_confirmation_ref,
    )
      ? privacy_review_confirmation_ref
      : null,
    requested_idempotency_key: hasPublicSafeValue(requested_idempotency_key)
      ? requested_idempotency_key
      : null,
    requested_ingest_scope_ref: hasPublicSafeValue(requested_ingest_scope_ref)
      ? requested_ingest_scope_ref
      : null,
    candidate_summaries: candidateSummaries,
  };
}

function buildCarryForward(
  intakePreview: SelectedSessionDigestIntakePreview | null,
): SelectedSessionDigestIngestContractCarryForward {
  const reviewOnlyCandidates =
    intakePreview?.candidate_material.rejected_or_review_only_candidates ?? [];
  return {
    rejected_or_review_only_candidate_refs: reviewOnlyCandidates.map(
      (candidate, index) =>
        safeOutputRef(candidate.candidate_id, `redacted_review_only_ref_${index}`),
    ),
    rejected_or_review_only_count: reviewOnlyCandidates.length,
    review_only_candidate_summaries: reviewOnlyCandidates.map(
      (candidate, index) => ({
        candidate_ref: safeOutputRef(
          candidate.candidate_id,
          `redacted_review_only_ref_${index}`,
        ),
        label: safeText(candidate.label),
        summary: safeText(candidate.summary),
        ingest_preview_only: true,
      }),
    ),
    intake_privacy_review_notes: uniqueSortedStrings(
      intakePreview?.privacy_review_notes ?? [],
    ),
    unresolved_blockers: uniqueSortedStrings([
      ...(intakePreview?.blocked_reasons ?? []),
      ...(intakePreview?.readiness.current_blockers ?? []),
    ]),
    missing_evidence_candidates: uniqueSortedStrings(
      intakePreview?.evidence_summary.missing_evidence ?? [],
    ),
  };
}

function buildRefusalReasons({
  selected_candidate_refs,
  selectedCandidateRefValidation,
  requested_operator_ref,
  requested_idempotency_key,
  privacy_review_confirmation_ref,
  requested_ingest_scope_ref,
}: {
  selected_candidate_refs?: string[];
  selectedCandidateRefValidation: SelectedCandidateRefValidation;
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  privacy_review_confirmation_ref?: string;
  requested_ingest_scope_ref?: string;
}): string[] {
  return uniqueSortedStrings([
    ...unsafeReason("selected_candidate_refs_unsafe", selected_candidate_refs),
    ...selectedCandidateRefValidation.refusal_reasons,
    ...unsafeReason("requested_operator_ref_unsafe", requested_operator_ref),
    ...unsafeReason(
      "requested_idempotency_key_unsafe",
      requested_idempotency_key,
    ),
    ...unsafeReason(
      "privacy_review_confirmation_ref_unsafe",
      privacy_review_confirmation_ref,
    ),
    ...unsafeReason(
      "requested_ingest_scope_ref_unsafe",
      requested_ingest_scope_ref,
    ),
  ]);
}

function buildCandidateSummaryUnsafeReasons(
  intakePreview: SelectedSessionDigestIntakePreview | null,
): string[] {
  if (!intakePreview) return [];
  return ingestableCandidates(intakePreview).some((candidate) =>
    [
      candidate.candidate_id,
      candidate.label,
      candidate.summary,
      candidate.raw_excerpt,
    ].some((value) => typeof value === "string" && hasUnsafeTextMarker(value)),
  )
    ? ["candidate_material_contains_secret_or_private_marker"]
    : [];
}

function buildMissingEvidence({
  intakePreview,
  wouldIngestMaterial,
}: {
  intakePreview: SelectedSessionDigestIntakePreview | null;
  wouldIngestMaterial: SelectedSessionDigestWouldIngestMaterialPreview;
}): string[] {
  return uniqueSortedStrings([
    ...(intakePreview?.evidence_summary.missing_evidence ?? []),
    ...(wouldIngestMaterial.evidence_refs.length === 0 &&
    countWouldIngestMaterial(wouldIngestMaterial) > 0
      ? ["evidence_refs_missing_for_future_ingest_write_contract"]
      : []),
  ]);
}

function buildInsufficientDataReasons({
  intakePreview,
  sourcePreviewStatus,
  shapeProblems,
  requested_operator_ref,
  requested_idempotency_key,
  privacy_review_confirmation_ref,
  wouldIngestMaterial,
  missingEvidence,
}: {
  intakePreview: SelectedSessionDigestIntakePreview | null;
  sourcePreviewStatus: IntakePreviewSourceStatus;
  shapeProblems: string[];
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  privacy_review_confirmation_ref?: string;
  wouldIngestMaterial: SelectedSessionDigestWouldIngestMaterialPreview;
  missingEvidence: string[];
}): string[] {
  return uniqueSortedStrings([
    ...(sourcePreviewStatus === "missing"
      ? ["selected_session_intake_preview_missing"]
      : []),
    ...(sourcePreviewStatus === "wrong_version"
      ? ["selected_session_intake_preview_wrong_version"]
      : []),
    ...shapeProblems,
    ...(intakePreview?.intake_preview_status === "no_digest"
      ? ["selected_session_digest_or_raw_text_missing"]
      : []),
    ...(intakePreview &&
    !intakePreview.readiness.ready_for_future_ingest_contract_preview
      ? ["intake_preview_not_ready_for_future_ingest_contract_preview"]
      : []),
    ...(intakePreview?.readiness.current_insufficient_data ?? []),
    ...(intakePreview?.insufficient_data_reasons ?? []),
    ...(countWouldIngestMaterial(wouldIngestMaterial) === 0
      ? ["selected_digest_ingestable_candidate_material_missing"]
      : []),
    ...(wouldIngestMaterial.source_kind === "missing" ||
    wouldIngestMaterial.source_kind === "unknown" ||
    wouldIngestMaterial.source_kind === null
      ? ["source_kind_missing_or_unknown"]
      : []),
    ...(wouldIngestMaterial.source_ref
      ? []
      : ["source_ref_missing_for_future_ingest_write_contract"]),
    ...(wouldIngestMaterial.operator_ref || hasPublicSafeValue(requested_operator_ref)
      ? []
      : ["operator_ref_missing_for_future_ingest_write_contract"]),
    ...(wouldIngestMaterial.session_ref || wouldIngestMaterial.project_ref
      ? []
      : ["session_or_project_ref_missing_for_future_ingest_write_contract"]),
    ...missingEvidence,
    ...missingPublicSafeReason(
      "privacy_review_confirmation_ref_missing",
      privacy_review_confirmation_ref,
    ),
    ...(wouldIngestMaterial.selected_digest_candidate_refs.length > 0
      ? []
      : ["selected_digest_candidate_refs_missing"]),
    ...missingPublicSafeReason(
      "requested_idempotency_key_missing",
      requested_idempotency_key,
    ),
  ]);
}

function buildBlockedReasons({
  intakePreview,
  sourcePreviewStatus,
  sourceStatus,
  refusalReasons,
}: {
  intakePreview: SelectedSessionDigestIntakePreview | null;
  sourcePreviewStatus: IntakePreviewSourceStatus;
  sourceStatus: SelectedSessionDigestIngestContractSourceStatus;
  refusalReasons: string[];
}): string[] {
  return uniqueSortedStrings([
    ...(sourcePreviewStatus === "wrong_version"
      ? ["blocked_wrong_selected_session_intake_preview_version"]
      : []),
    ...(sourcePreviewStatus === "malformed"
      ? ["blocked_malformed_selected_session_intake_preview"]
      : []),
    ...(intakePreview?.intake_preview_status === "unsafe" ||
    intakePreview?.intake_preview_status === "malformed"
      ? [`blocked_intake_preview_status_${intakePreview.intake_preview_status}`]
      : []),
    ...(intakePreview?.blocked_reasons ?? []),
    ...(intakePreview?.unsafe_ref_reasons ?? []),
    ...(intakePreview?.evidence_summary.unsafe_refs ?? []),
    ...(intakePreview?.readiness.current_blockers ?? []),
    ...(intakePreview?.readiness.current_unsafe_refs ?? []),
    ...(sourceStatus.authority_boundary !== "valid_read_only"
      ? ["blocked_intake_preview_authority_boundary_invalid"]
      : []),
    ...(sourceStatus.intake_preview_write_authority !== "all_false"
      ? ["blocked_intake_preview_write_authority_invalid"]
      : []),
    ...refusalReasons,
  ]);
}

function buildReadiness({
  intakePreview,
  sourceStatus,
  wouldIngestMaterial,
  blockedReasons,
  insufficientDataReasons,
  missingEvidence,
  refusalReasons,
}: {
  intakePreview: SelectedSessionDigestIntakePreview | null;
  sourceStatus: SelectedSessionDigestIngestContractSourceStatus;
  wouldIngestMaterial: SelectedSessionDigestWouldIngestMaterialPreview;
  blockedReasons: string[];
  insufficientDataReasons: string[];
  missingEvidence: string[];
  refusalReasons: string[];
}): SelectedSessionDigestIngestContractReadiness {
  const validIntakePreview = Boolean(intakePreview);
  const intakeReady =
    intakePreview?.readiness.ready_for_future_ingest_contract_preview === true;
  const hasSelectedCandidateRefs =
    wouldIngestMaterial.selected_digest_candidate_refs.length > 0 &&
    !insufficientDataReasons.includes("selected_digest_candidate_refs_missing");
  const hasKnownSourceKind =
    wouldIngestMaterial.source_kind !== null &&
    wouldIngestMaterial.source_kind !== "missing" &&
    wouldIngestMaterial.source_kind !== "unknown";
  const hasSourceRef = Boolean(wouldIngestMaterial.source_ref);
  const hasOperatorRef = Boolean(wouldIngestMaterial.operator_ref);
  const hasSessionOrProjectRef = Boolean(
    wouldIngestMaterial.session_ref || wouldIngestMaterial.project_ref,
  );
  const hasEvidenceRefs = wouldIngestMaterial.evidence_refs.length > 0;
  const hasPrivacyReviewConfirmation = Boolean(
    wouldIngestMaterial.privacy_review_confirmation_ref,
  );
  const hasIdempotencyKey = Boolean(wouldIngestMaterial.requested_idempotency_key);
  const readOnlyIntakePreview =
    sourceStatus.authority_boundary === "valid_read_only" &&
    sourceStatus.intake_preview_write_authority === "all_false";
  const hasWouldIngestMaterial =
    countWouldIngestMaterial(wouldIngestMaterial) > 0;
  const readyForOperatorReview =
    validIntakePreview &&
    hasWouldIngestMaterial &&
    readOnlyIntakePreview &&
    blockedReasons.length === 0 &&
    refusalReasons.length === 0;
  const readyForFutureIngestWriteScope =
    readyForOperatorReview &&
    intakeReady &&
    hasSelectedCandidateRefs &&
    hasKnownSourceKind &&
    hasSourceRef &&
    hasOperatorRef &&
    hasSessionOrProjectRef &&
    hasEvidenceRefs &&
    hasPrivacyReviewConfirmation &&
    hasIdempotencyKey &&
    insufficientDataReasons.length === 0 &&
    missingEvidence.length === 0;

  return {
    ready_for_operator_review: readyForOperatorReview,
    ready_for_future_ingest_write_scope: readyForFutureIngestWriteScope,
    requires_valid_intake_preview: !validIntakePreview,
    requires_intake_ready_for_future_ingest_contract_preview: !intakeReady,
    requires_selected_digest_candidate_refs: !hasSelectedCandidateRefs,
    requires_known_source_kind: !hasKnownSourceKind,
    requires_source_ref: !hasSourceRef,
    requires_operator_ref: !hasOperatorRef,
    requires_session_or_project_ref: !hasSessionOrProjectRef,
    requires_evidence_refs: !hasEvidenceRefs,
    requires_privacy_review_confirmation: !hasPrivacyReviewConfirmation,
    requires_idempotency_key: !hasIdempotencyKey,
    requires_public_safe_refs: refusalReasons.length > 0,
    requires_no_blockers: blockedReasons.length > 0,
    requires_no_insufficient_data: insufficientDataReasons.length > 0,
    requires_no_missing_evidence: missingEvidence.length > 0,
    requires_read_only_intake_preview: !readOnlyIntakePreview,
    current_blockers: blockedReasons,
    current_insufficient_data: insufficientDataReasons,
    current_missing_evidence: missingEvidence,
    current_unsafe_refs: uniqueSortedStrings([
      ...(intakePreview?.unsafe_ref_reasons ?? []),
      ...(intakePreview?.evidence_summary.unsafe_refs ?? []),
    ]),
    current_refusal_reasons: refusalReasons,
  };
}

function determineContractPreviewStatus({
  intakePreview,
  sourcePreviewStatus,
  readiness,
  wouldIngestMaterial,
  blockedReasons,
}: {
  intakePreview: SelectedSessionDigestIntakePreview | null;
  sourcePreviewStatus: IntakePreviewSourceStatus;
  readiness: SelectedSessionDigestIngestContractReadiness;
  wouldIngestMaterial: SelectedSessionDigestWouldIngestMaterialPreview;
  blockedReasons: string[];
}): SelectedSessionDigestIngestContractPreviewStatus {
  if (!intakePreview && sourcePreviewStatus === "missing") return "no_intake_preview";
  if (blockedReasons.length > 0) return "blocked";
  if (!intakePreview || sourcePreviewStatus !== "supplied") {
    return "insufficient_data";
  }
  if (readiness.ready_for_future_ingest_write_scope) {
    return "ready_for_future_ingest_write_scope";
  }
  if (countWouldIngestMaterial(wouldIngestMaterial) === 0) {
    return "insufficient_data";
  }
  if (readiness.ready_for_operator_review) {
    return "contract_candidates_available";
  }
  if (intakePreview.intake_preview_status === "keep_preview_only") {
    return "keep_preview_only";
  }
  return "insufficient_data";
}

function determineRecommendedNextAction({
  intakePreview,
  sourcePreviewStatus,
  readiness,
  wouldIngestMaterial,
  blockedReasons,
  refusalReasons,
}: {
  intakePreview: SelectedSessionDigestIntakePreview | null;
  sourcePreviewStatus: IntakePreviewSourceStatus;
  readiness: SelectedSessionDigestIngestContractReadiness;
  wouldIngestMaterial: SelectedSessionDigestWouldIngestMaterialPreview;
  blockedReasons: string[];
  refusalReasons: string[];
}): SelectedSessionDigestIngestContractRecommendedNextAction {
  if (sourcePreviewStatus !== "supplied" || !intakePreview) {
    return "supply_selected_session_intake_preview";
  }
  if (blockedReasons.length > 0 || refusalReasons.length > 0) {
    return "resolve_intake_blockers_or_unsafe_refs";
  }
  if (
    intakePreview.intake_preview_status === "no_digest" ||
    countWouldIngestMaterial(wouldIngestMaterial) === 0
  ) {
    return "supply_selected_session_digest";
  }
  if (readiness.requires_known_source_kind) return "supply_source_ref";
  if (readiness.requires_source_ref) return "supply_source_ref";
  if (readiness.requires_operator_ref) return "supply_operator_ref";
  if (readiness.requires_session_or_project_ref) {
    return "supply_session_or_project_ref";
  }
  if (readiness.requires_evidence_refs) return "supply_evidence_refs";
  if (readiness.requires_privacy_review_confirmation) {
    return "supply_privacy_review_confirmation";
  }
  if (readiness.requires_selected_digest_candidate_refs) {
    return "supply_selected_digest_candidate_refs";
  }
  if (readiness.requires_idempotency_key) return "supply_idempotency_key";
  if (readiness.ready_for_future_ingest_write_scope) {
    return "prepare_separate_ingest_write_slice";
  }
  if (readiness.ready_for_operator_review) return "review_future_ingest_contract";
  if (intakePreview.intake_preview_status === "keep_preview_only") {
    return "keep_preview_only";
  }
  return "reject_digest_ingest_candidate";
}

function buildInputSummary({
  intakePreview,
  wouldIngestMaterial,
  carryForward,
  selected_candidate_refs,
  requested_operator_ref,
  requested_idempotency_key,
  privacy_review_confirmation_ref,
  requested_ingest_scope_ref,
  blockedReasons,
  insufficientDataReasons,
  refusalReasons,
}: {
  intakePreview: SelectedSessionDigestIntakePreview | null;
  wouldIngestMaterial: SelectedSessionDigestWouldIngestMaterialPreview;
  carryForward: SelectedSessionDigestIngestContractCarryForward;
  selected_candidate_refs?: string[];
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  privacy_review_confirmation_ref?: string;
  requested_ingest_scope_ref?: string;
  blockedReasons: string[];
  insufficientDataReasons: string[];
  refusalReasons: string[];
}): SelectedSessionDigestIngestContractInputSummary {
  return {
    has_selected_session_digest_intake_preview: Boolean(intakePreview),
    intake_preview_status: intakePreview?.intake_preview_status ?? null,
    ready_for_intake_operator_review:
      intakePreview?.readiness.ready_for_operator_review ?? false,
    ready_for_future_ingest_contract_preview:
      intakePreview?.readiness.ready_for_future_ingest_contract_preview ??
      false,
    source_kind: intakePreview?.input_summary.source_kind ?? null,
    source_ref_supplied: Boolean(wouldIngestMaterial.source_ref),
    operator_ref_supplied: Boolean(wouldIngestMaterial.operator_ref),
    session_ref_supplied: Boolean(wouldIngestMaterial.session_ref),
    project_ref_supplied: Boolean(wouldIngestMaterial.project_ref),
    evidence_ref_count: wouldIngestMaterial.evidence_refs.length,
    source_ref_count: wouldIngestMaterial.source_refs.length,
    ingestable_candidate_count: countWouldIngestMaterial(wouldIngestMaterial),
    selected_candidate_ref_count:
      wouldIngestMaterial.selected_digest_candidate_refs.length,
    selected_candidate_refs_supplied:
      Boolean(selected_candidate_refs && selected_candidate_refs.length > 0),
    requested_operator_ref_supplied: hasPublicSafeValue(requested_operator_ref),
    requested_idempotency_key_supplied:
      hasPublicSafeValue(requested_idempotency_key),
    privacy_review_confirmation_ref_supplied: hasPublicSafeValue(
      privacy_review_confirmation_ref,
    ),
    requested_ingest_scope_ref_supplied:
      hasPublicSafeValue(requested_ingest_scope_ref),
    carry_forward_review_only_count:
      carryForward.rejected_or_review_only_count,
    blocking_reason_count: blockedReasons.length,
    insufficient_data_reason_count: insufficientDataReasons.length,
    refusal_reason_count: refusalReasons.length,
  };
}

function buildEvidenceSummary({
  intakePreview,
  sourcePreviewStatus,
  sourceStatus,
  wouldIngestMaterial,
  missingEvidence,
  blockedReasons,
  insufficientDataReasons,
  refusalReasons,
}: {
  intakePreview: SelectedSessionDigestIntakePreview | null;
  sourcePreviewStatus: IntakePreviewSourceStatus;
  sourceStatus: SelectedSessionDigestIngestContractSourceStatus;
  wouldIngestMaterial: SelectedSessionDigestWouldIngestMaterialPreview;
  missingEvidence: string[];
  blockedReasons: string[];
  insufficientDataReasons: string[];
  refusalReasons: string[];
}): SelectedSessionDigestIngestContractEvidenceSummary {
  return {
    has_valid_intake_preview: Boolean(intakePreview),
    intake_preview_version_valid: sourcePreviewStatus === "supplied",
    intake_ready_for_future_ingest_contract_preview:
      intakePreview?.readiness.ready_for_future_ingest_contract_preview ??
      false,
    has_ingestable_candidate_material:
      countWouldIngestMaterial(wouldIngestMaterial) > 0,
    has_selected_candidate_refs:
      wouldIngestMaterial.selected_digest_candidate_refs.length > 0 &&
      !insufficientDataReasons.includes("selected_digest_candidate_refs_missing"),
    has_source_refs: wouldIngestMaterial.source_refs.length > 0,
    has_evidence_refs: wouldIngestMaterial.evidence_refs.length > 0,
    has_operator_ref: Boolean(wouldIngestMaterial.operator_ref),
    has_session_or_project_ref: Boolean(
      wouldIngestMaterial.session_ref || wouldIngestMaterial.project_ref,
    ),
    has_privacy_review_confirmation_ref: Boolean(
      wouldIngestMaterial.privacy_review_confirmation_ref,
    ),
    has_idempotency_key: Boolean(wouldIngestMaterial.requested_idempotency_key),
    has_missing_evidence: missingEvidence.length > 0,
    has_blockers: blockedReasons.length > 0,
    has_insufficient_data: insufficientDataReasons.length > 0,
    has_unsafe_refs:
      refusalReasons.length > 0 ||
      Boolean(intakePreview?.evidence_summary.has_unsafe_refs),
    authority_boundary_valid:
      sourceStatus.authority_boundary === "valid_read_only",
    intake_preview_write_authority_false:
      sourceStatus.intake_preview_write_authority === "all_false",
    no_ingest_record_write_confirmed: true,
    no_ingest_receipt_write_confirmed: true,
    no_memory_perspective_handoff_mutation_confirmed: true,
    no_provider_github_codex_confirmed: true,
    source_refs: wouldIngestMaterial.source_refs,
    evidence_refs: wouldIngestMaterial.evidence_refs,
    missing_evidence: missingEvidence,
    unsafe_refs: uniqueSortedStrings([
      ...(intakePreview?.evidence_summary.unsafe_refs ?? []),
      ...(intakePreview?.unsafe_ref_reasons ?? []),
      ...refusalReasons,
    ]),
  };
}

function buildPrivacyReviewSummary({
  intakePreview,
  privacy_review_confirmation_ref,
  refusalReasons,
}: {
  intakePreview: SelectedSessionDigestIntakePreview | null;
  privacy_review_confirmation_ref?: string;
  refusalReasons: string[];
}): SelectedSessionDigestIngestPrivacyReviewSummary {
  return {
    has_privacy_review_confirmation_ref: hasPublicSafeValue(
      privacy_review_confirmation_ref,
    ),
    privacy_review_confirmation_ref: hasPublicSafeValue(
      privacy_review_confirmation_ref,
    )
      ? privacy_review_confirmation_ref
      : null,
    intake_privacy_review_note_count:
      intakePreview?.privacy_review_notes.length ?? 0,
    privacy_review_notes: uniqueSortedStrings(
      intakePreview?.privacy_review_notes ?? [],
    ),
    unsafe_or_private_markers_present:
      Boolean(intakePreview?.evidence_summary.has_unsafe_refs) ||
      refusalReasons.length > 0,
  };
}

function buildFutureIngestWriteContract(
  intakePreviewRef: string | null,
): SelectedSessionDigestFutureIngestWriteContract {
  return {
    proposed_record_kind: "selected_session_digest_ingest_record.v0.1",
    proposed_receipt_kind: "selected_session_digest_ingest_receipt.v0.1",
    required_selected_intake_preview_ref: [
      intakePreviewRef ?? "selected_intake_preview_ref_required",
    ],
    required_selected_digest_candidate_refs: [
      "operator_selected_candidate_refs_from_intake_preview",
    ],
    required_source_kind: ["known_supported_source_kind"],
    required_source_ref: ["public_safe_source_ref"],
    required_operator_ref: ["public_safe_operator_ref"],
    required_session_or_project_ref: [
      "public_safe_session_ref_or_project_ref",
    ],
    required_evidence_refs: ["public_safe_evidence_refs"],
    required_privacy_review_confirmation: [
      "operator_privacy_review_confirmation_ref",
    ],
    required_idempotency: ["stable_public_safe_idempotency_key"],
    required_no_side_effects_receipt: [
      "no_db_write_before_separate_write_slice",
      "no_memory_write_before_separate_write_slice",
      "no_perspective_cwp_or_handoff_mutation_before_separate_write_slice",
    ],
    required_refusal_checks: [
      "reject_unsafe_refs",
      "reject_private_or_secret_markers",
      "reject_missing_operator_review",
      "reject_review_only_material_in_write_payload",
    ],
    required_public_safe_refs: [
      "source_operator_session_project_evidence_candidate_and_idempotency_refs_are_public_safe",
    ],
    required_operator_approval_payload: [
      "operator_confirms_selected_candidates",
      "operator_confirms_future_write_scope",
      "operator_confirms_no_side_effects_receipt_requirement",
    ],
  };
}

function buildOperatorReviewChecklist(): string[] {
  return [
    "confirm_intake_preview_is_the_selected_session_digest_intake_preview_v0_1",
    "confirm_intake_candidate_material_is_ready_for_future_contract_review",
    "confirm_rejected_or_review_only_candidates_are_excluded_from_write_material",
    "confirm_source_operator_session_or_project_and_evidence_refs_are_public_safe",
    "confirm_privacy_review_confirmation_ref_is_present",
    "confirm_selected_candidate_refs_are_operator_selected",
    "confirm_idempotency_key_is_stable_and_public_safe",
    "confirm_future_ingest_write_is_a_separate_operator_approved_slice",
  ];
}

function buildWouldNotWrite(): string[] {
  return [
    "does_not_selected_digest_durable_ingest",
    "does_not_create_ingest_record",
    "does_not_create_ingest_receipt",
    "does_not_write_db_rows",
    "does_not_create_schema",
    "does_not_write_memory",
    "does_not_mutate_memory",
    "does_not_mutate_current_working_perspective",
    "does_not_write_perspective_unit",
    "does_not_write_next_work_bias",
    "does_not_update_continuity_relay",
    "does_not_mutate_handoff_context",
    "does_not_apply_handoff_context",
    "does_not_write_selected_refs_to_live_handoff",
    "does_not_send_handoff",
    "does_not_write_dogfood_metrics",
    "does_not_write_reuse_ledger",
    "does_not_call_provider_openai",
    "does_not_call_github",
    "does_not_execute_codex",
    "does_not_run_autonomous_actions",
    "does_not_create_graph_vector_rag_crawler_or_browser_observer",
    "does_not_render_workbench_action_buttons",
  ];
}

function buildNonGoals(): string[] {
  return [
    "selected_digest_durable_ingest",
    "ingest_record_write",
    "ingest_receipt_write",
    "db_schema_route_provider_github_codex_call",
    "memory_write",
    "perspective_unit_durable_mutation",
    "next_work_bias_durable_mutation",
    "cwp_mutation",
    "continuity_relay_write",
    "live_handoff_context_apply",
    "selected_refs_live_packet_write",
    "handoff_send",
    "graph_vector_rag_crawler_browser_observer",
    "workbench_action_buttons",
  ];
}

function buildSourceRefs({
  intakePreview,
  source_refs,
  intakePreviewRef,
}: {
  intakePreview: SelectedSessionDigestIntakePreview | null;
  source_refs?: string[];
  intakePreviewRef: string | null;
}): string[] {
  return uniqueSortedStrings([
    ...(source_refs ?? []),
    ...(intakePreview?.source_refs ?? []),
    ...(intakePreviewRef ? [intakePreviewRef] : []),
    SELECTED_SESSION_DIGEST_INGEST_CONTRACT_PREVIEW_VERSION,
  ]).filter(hasPublicSafeValue);
}

function ingestableCandidates(
  intakePreview: SelectedSessionDigestIntakePreview | null,
): SelectedSessionDigestIntakeCandidate[] {
  if (!intakePreview) return [];
  return ingestableCandidateBuckets.flatMap(
    (bucket) => intakePreview.candidate_material[bucket],
  );
}

function canonicalIngestableCandidateRefs(
  intakePreview: SelectedSessionDigestIntakePreview | null,
): string[] {
  return ingestableCandidates(intakePreview).map((candidate, index) =>
    safeOutputRef(candidate.candidate_id, `redacted_candidate_ref_${index}`),
  );
}

function buildSelectedCandidateRefValidation({
  intakePreview,
  selected_candidate_refs,
}: {
  intakePreview: SelectedSessionDigestIntakePreview | null;
  selected_candidate_refs?: string[];
}): SelectedCandidateRefValidation {
  const canonicalRefs = new Set(canonicalIngestableCandidateRefs(intakePreview));
  const suppliedPublicSafeRefs = uniqueSortedStrings(
    (selected_candidate_refs ?? []).filter(hasPublicSafeValue),
  );
  const unknownPublicSafeRefs = suppliedPublicSafeRefs.filter(
    (ref) => !canonicalRefs.has(ref),
  );

  return {
    canonical_candidate_refs: canonicalRefs,
    unknown_public_safe_refs: unknownPublicSafeRefs,
    refusal_reasons:
      unknownPublicSafeRefs.length > 0
        ? [
            "selected_candidate_refs_not_in_intake_preview",
            "unknown_selected_digest_candidate_ref",
          ]
        : [],
  };
}

function countCandidatesByKind(
  candidates: SelectedSessionDigestIntakeCandidate[],
): SelectedSessionDigestWouldIngestMaterialPreview["candidate_counts_by_kind"] {
  return {
    session_summary: candidates.filter(
      (candidate) => candidate.candidate_kind === "session_summary",
    ).length,
    user_goal: candidates.filter(
      (candidate) => candidate.candidate_kind === "user_goal",
    ).length,
    decision: candidates.filter(
      (candidate) => candidate.candidate_kind === "decision",
    ).length,
    open_question: candidates.filter(
      (candidate) => candidate.candidate_kind === "open_question",
    ).length,
    next_action: candidates.filter(
      (candidate) => candidate.candidate_kind === "next_action",
    ).length,
    evidence_ref: candidates.filter(
      (candidate) => candidate.candidate_kind === "evidence_ref",
    ).length,
    source_ref: candidates.filter(
      (candidate) => candidate.candidate_kind === "source_ref",
    ).length,
    risk_or_blocker: candidates.filter(
      (candidate) => candidate.candidate_kind === "risk_or_blocker",
    ).length,
    reusable_context: candidates.filter(
      (candidate) => candidate.candidate_kind === "reusable_context",
    ).length,
  };
}

function toCandidateSummary(
  candidate: SelectedSessionDigestIntakeCandidate,
  index: number,
): SelectedSessionDigestIngestCandidateSummary {
  return {
    candidate_ref: safeOutputRef(
      candidate.candidate_id,
      `redacted_candidate_ref_${index}`,
    ),
    candidate_kind: candidate.candidate_kind as IngestableCandidateKind,
    label: safeText(candidate.label),
    summary: safeText(candidate.summary),
    source_refs: uniqueSortedStrings(candidate.source_refs).filter(
      hasPublicSafeValue,
    ),
    evidence_refs: uniqueSortedStrings(candidate.evidence_refs).filter(
      hasPublicSafeValue,
    ),
    review_required: true,
    ingest_preview_only: true,
  };
}

function countWouldIngestMaterial(
  material: SelectedSessionDigestWouldIngestMaterialPreview,
): number {
  return Object.values(material.candidate_counts_by_kind).reduce(
    (total, count) => total + count,
    0,
  );
}

function buildIntakePreviewInstanceRef(
  intakePreview: SelectedSessionDigestIntakePreview,
): string {
  return [
    "selected_session_digest_intake_preview",
    intakePreview.preview_version,
    intakePreview.as_of,
  ].join(":");
}

function intakeAuthorityBoundaryValid(
  intakePreview: SelectedSessionDigestIntakePreview,
): boolean {
  const boundary = intakePreview.authority_boundary;
  return (
    boundary.read_only === true &&
    boundary.advisory_only === true &&
    boundary.source_of_truth === false &&
    boundary.derived_read_model === true
  );
}

function intakeWriteAuthorityAllFalse(
  intakePreview: SelectedSessionDigestIntakePreview | null,
): boolean {
  if (!intakePreview) return false;
  return intakeFalseAuthorityFields.every(
    (field) => intakePreview.authority_boundary[field] === false,
  );
}

function unsafeReason(reason: string, values?: string | string[]): string[] {
  if (values === undefined || values === null) return [];
  const refValues = Array.isArray(values) ? values : [values];
  return refValues.some((value) => value.trim() && !hasPublicSafeValue(value))
    ? [reason]
    : [];
}

function missingPublicSafeReason(reason: string, value?: string): string[] {
  return hasPublicSafeValue(value) ? [] : [reason];
}

function firstPublicSafeString(
  values: string[],
  excludedValue?: string,
): string | null {
  return (
    values.find(
      (value) =>
        hasPublicSafeValue(value) &&
        (!excludedValue || value !== excludedValue),
    ) ?? null
  );
}

function safeOutputRef(value: string, fallback: string): string {
  return hasPublicSafeValue(value) && !hasUnsafeTextMarker(value)
    ? value
    : fallback;
}

function safeText(value: string): string {
  if (hasUnsafeTextMarker(value)) return "redacted_review_required";
  return truncateSnippet(value);
}

function hasPublicSafeValue(value?: string): value is string {
  return typeof value === "string" && isPublicSafeRef(value);
}

function isPublicSafeRef(value: string): boolean {
  if (!value.trim()) return false;
  if (value.length > 180) return false;
  if (/[\s\x00-\x1f\x7f]/.test(value)) return false;
  if (value.startsWith("/") || /^[a-zA-Z]:[\\/]/.test(value)) return false;
  if (value.includes("\\") || value.includes("../") || value.includes("..\\")) {
    return false;
  }
  if (tokenLikeSecretRefPattern.test(value)) return false;
  if (embeddedCredentialUrlRefPattern.test(value)) return false;
  if (/(^|[/:])(\.env)([/:]|$)/i.test(value)) return false;
  if (/(\/Users\/|\/home\/|password:|secret:)/i.test(value)) return false;
  return true;
}

function hasUnsafeTextMarker(value: string): boolean {
  return (
    tokenLikeSecretTextPattern.test(value) ||
    embeddedCredentialUrlTextPattern.test(value) ||
    privatePathOrEnvTextPattern.test(value) ||
    secretLabelTextPattern.test(value)
  );
}

function hasArrayFields(
  value: unknown,
  fields: readonly string[],
): value is Record<string, unknown[]> {
  return (
    isRecord(value) &&
    fields.every((field) => Array.isArray(value[field]))
  );
}

function hasBooleanFields(
  value: unknown,
  fields: readonly string[],
): value is Record<string, boolean> {
  return (
    isRecord(value) &&
    fields.every((field) => typeof value[field] === "boolean")
  );
}

function recordField(
  value: Record<string, unknown>,
  field: string,
): Record<string, unknown> | null {
  const fieldValue = value[field];
  return isRecord(fieldValue) ? fieldValue : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function truncateSnippet(value: string): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.length > 180 ? `${trimmed.slice(0, 177)}...` : trimmed;
}

function uniqueSortedStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b));
}

const tokenLikeSecretRefPattern = /(^|[:/@|=])(sk-|ghp_|github_pat_|xoxb-)/i;
const embeddedCredentialUrlRefPattern =
  /(^|[:|=])[a-z][a-z0-9+.-]*:\/\/[^/\s]+@/i;
const tokenLikeSecretTextPattern =
  /(^|[\s:/@|=])(sk-|ghp_|github_pat_|xoxb-)/i;
const embeddedCredentialUrlTextPattern =
  /(^|[\s:|=])[a-z][a-z0-9+.-]*:\/\/[^/\s]+@/i;
const privatePathOrEnvTextPattern = /\/Users\/|\/home\/|(^|[\s:/@|=])\.env\b/i;
const secretLabelTextPattern = /\b(password:|secret:)/i;
