import {
  HANDOFF_CONTEXT_APPLY_OPERATOR_DECISION_PREVIEW_VERSION,
  type HandoffContextApplyOperatorDecisionAuthorityBoundary,
  type HandoffContextApplyOperatorDecisionPreview,
} from "@/types/handoff-context-apply-operator-decision-preview";
import type { HandoffContextApplyPreviewCandidate } from "@/types/handoff-context-apply-preview";
import {
  HANDOFF_CONTEXT_APPLY_WRITE_CONTRACT_PREVIEW_VERSION,
  type HandoffContextApplyFutureWriteContract,
  type HandoffContextApplyWouldWriteMaterialPreview,
  type HandoffContextApplyWriteContractAuthorityBoundary,
  type HandoffContextApplyWriteContractCarryForward,
  type HandoffContextApplyWriteContractEvidenceSummary,
  type HandoffContextApplyWriteContractPreview,
  type HandoffContextApplyWriteContractPreviewInput,
  type HandoffContextApplyWriteContractPreviewStatus,
  type HandoffContextApplyWriteContractReadiness,
  type HandoffContextApplyWriteContractRecommendedNextAction,
  type HandoffContextApplyWriteContractSourceStatus,
} from "@/types/handoff-context-apply-write-contract-preview";

const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;
const DEFAULT_SCOPE = "project:augnes" as const;

export function buildHandoffContextApplyWriteContractPreviewV01({
  apply_operator_decision_preview,
  current_handoff_packet_fingerprint,
  current_handoff_context_ref,
  requested_operator_ref,
  requested_idempotency_key,
  as_of,
  scope,
  source_refs,
}: HandoffContextApplyWriteContractPreviewInput = {}): HandoffContextApplyWriteContractPreview {
  const sourcePreviewStatus = getDecisionPreviewSourceStatus(
    apply_operator_decision_preview,
  );
  const decisionPreviewShapeProblems = buildDecisionPreviewShapeProblems(
    apply_operator_decision_preview,
  );
  const preview = isCompleteDecisionPreviewShape(
    apply_operator_decision_preview,
  )
    ? apply_operator_decision_preview
    : null;
  const applyDecisionPreviewRef = preview
    ? buildApplyDecisionPreviewInstanceRef(preview)
    : null;
  const sourceStatus = buildSourceStatus({ preview, sourcePreviewStatus });
  const wouldWriteMaterial = buildWouldWriteMaterialPreview({
    preview,
    applyDecisionPreviewRef,
    current_handoff_context_ref,
    current_handoff_packet_fingerprint,
  });
  const carryForward = buildCarryForward(preview);
  const missingEvidence = uniqueSortedStrings([
    ...(preview?.missing_evidence ?? []),
    ...(preview?.evidence_summary.missing_evidence ?? []),
    ...(preview?.readiness.current_missing_evidence ?? []),
  ]);
  const refusalReasons = buildRefusalReasons({
    current_handoff_packet_fingerprint,
    current_handoff_context_ref,
    requested_operator_ref,
    requested_idempotency_key,
  });
  const insufficientDataReasons = buildInsufficientDataReasons({
    preview,
    sourcePreviewStatus,
    decisionPreviewShapeProblems,
    current_handoff_packet_fingerprint,
    current_handoff_context_ref,
    requested_operator_ref,
    requested_idempotency_key,
    wouldWriteMaterial,
    missingEvidence,
  });
  const blockedReasons = buildBlockedReasons({
    preview,
    sourcePreviewStatus,
    sourceStatus,
    refusalReasons,
  });
  const readiness = buildReadiness({
    preview,
    sourceStatus,
    wouldWriteMaterial,
    carryForward,
    blockedReasons,
    insufficientDataReasons,
    missingEvidence,
    refusalReasons,
  });
  const contractPreviewStatus = determineContractPreviewStatus({
    preview,
    sourcePreviewStatus,
    readiness,
    blockedReasons,
    insufficientDataReasons,
  });
  const recommendedNextAction = determineRecommendedNextAction({
    sourcePreviewStatus,
    preview,
    readiness,
    refusalReasons,
    insufficientDataReasons,
    blockedReasons,
    current_handoff_packet_fingerprint,
    current_handoff_context_ref,
    requested_operator_ref,
    requested_idempotency_key,
  });
  const evidenceSummary = buildEvidenceSummary({
    preview,
    sourcePreviewStatus,
    sourceStatus,
    wouldWriteMaterial,
    missingEvidence,
    blockedReasons,
    insufficientDataReasons,
    current_handoff_packet_fingerprint,
    current_handoff_context_ref,
    requested_operator_ref,
    requested_idempotency_key,
  });

  return {
    preview_version: HANDOFF_CONTEXT_APPLY_WRITE_CONTRACT_PREVIEW_VERSION,
    scope: scope ?? preview?.scope ?? DEFAULT_SCOPE,
    as_of: as_of ?? preview?.as_of ?? FALLBACK_AS_OF,
    source_refs: buildSourceRefs({
      preview,
      source_refs,
      applyDecisionPreviewRef,
    }),
    contract_preview_status: contractPreviewStatus,
    recommended_next_action: recommendedNextAction,
    input_summary: {
      has_apply_operator_decision_preview: Boolean(preview),
      decision_preview_status: preview?.decision_preview_status ?? null,
      recommended_operator_decision:
        preview?.recommended_operator_decision ?? null,
      ready_for_future_apply_write:
        preview?.readiness.ready_for_future_apply_write ?? false,
      selected_record_ref:
        preview?.would_apply_preview.selected_record_ref ?? null,
      current_handoff_packet_fingerprint_supplied:
        hasPublicSafeValue(current_handoff_packet_fingerprint),
      current_handoff_context_ref_supplied:
        hasPublicSafeValue(current_handoff_context_ref),
      requested_operator_ref_supplied: hasPublicSafeValue(requested_operator_ref),
      requested_idempotency_key_supplied:
        hasPublicSafeValue(requested_idempotency_key),
      would_apply_candidate_count: countWouldWriteMaterial(wouldWriteMaterial),
      selected_ref_add_count: wouldWriteMaterial.selected_refs_to_add.length,
      selected_ref_reinforce_count:
        wouldWriteMaterial.selected_refs_to_reinforce.length,
      warning_update_count:
        wouldWriteMaterial.warnings_to_add_or_strengthen.length,
      context_deprioritize_count:
        wouldWriteMaterial.context_refs_to_deprioritize.length,
      context_exclude_count: wouldWriteMaterial.context_refs_to_exclude.length,
      expected_return_update_count:
        wouldWriteMaterial.expected_return_signal_updates.length,
      carry_forward_review_only_count: countCarryForward(carryForward),
      blocking_reason_count: blockedReasons.length,
      insufficient_data_reason_count: insufficientDataReasons.length,
      refusal_reason_count: refusalReasons.length,
    },
    source_status: sourceStatus,
    future_write_contract: buildFutureWriteContract(applyDecisionPreviewRef),
    would_write_material_preview: wouldWriteMaterial,
    carry_forward_review_only_material: carryForward,
    readiness,
    refusal_reasons: refusalReasons,
    blocked_reasons: blockedReasons,
    insufficient_data_reasons: insufficientDataReasons,
    missing_evidence: missingEvidence,
    evidence_summary: evidenceSummary,
    operator_review_checklist: buildOperatorReviewChecklist(),
    would_not_write: buildWouldNotWrite(),
    non_goals: uniqueSortedStrings([
      "no_persisted_operator_decision",
      "no_apply_write_contract_record_creation",
      "no_live_handoff_context_mutation",
      "no_selected_ref_live_write",
      "no_handoff_send",
      "no_db_write_or_schema_creation",
      "no_upstream_preview_rebuild",
      "no_memory_perspective_metric_or_reuse_ledger_mutation",
      "no_provider_github_codex_or_autonomous_action",
      ...(preview?.non_goals ?? []),
    ]),
    authority_boundary:
      createHandoffContextApplyWriteContractAuthorityBoundaryV01(),
  };
}

export function createHandoffContextApplyWriteContractAuthorityBoundaryV01(): HandoffContextApplyWriteContractAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_persist_decision: false,
    can_write_db: false,
    can_create_schema: false,
    can_create_apply_write_contract_record: false,
    can_create_apply_write_receipt: false,
    can_mutate_live_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_send_handoff: false,
    can_write_continuity_relay: false,
    can_update_current_working_perspective: false,
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
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    notes: [
      "Apply write contract preview is read-only and advisory.",
      "It consumes an already-built apply operator decision preview and does not rebuild upstream apply or record-review objects.",
      "Even when ready_for_future_write_scope is true, this preview cannot persist decisions or apply material to live handoff context.",
    ],
  };
}

type DecisionPreviewSourceStatus =
  HandoffContextApplyWriteContractSourceStatus["apply_operator_decision_preview"];

function getDecisionPreviewSourceStatus(
  value: unknown,
): DecisionPreviewSourceStatus {
  if (!value) return "missing";
  if (!hasDecisionPreviewVersion(value)) return "wrong_version";
  return buildDecisionPreviewShapeProblems(value).length > 0
    ? "malformed"
    : "supplied";
}

function hasDecisionPreviewVersion(value: unknown): boolean {
  return (
    isRecord(value) &&
    value.preview_version === HANDOFF_CONTEXT_APPLY_OPERATOR_DECISION_PREVIEW_VERSION
  );
}

function isCompleteDecisionPreviewShape(
  value: unknown,
): value is HandoffContextApplyOperatorDecisionPreview {
  return (
    hasDecisionPreviewVersion(value) &&
    buildDecisionPreviewShapeProblems(value).length === 0
  );
}

function buildDecisionPreviewShapeProblems(value: unknown): string[] {
  if (!hasDecisionPreviewVersion(value)) return [];
  if (!isRecord(value)) return ["apply_operator_decision_preview_malformed"];

  const problems: string[] = [];
  const sourceStatus = recordField(value, "source_status");
  if (
    !sourceStatus ||
    typeof sourceStatus.authority_boundary !== "string" ||
    typeof sourceStatus.apply_preview_write_authority !== "string"
  ) {
    problems.push("decision_preview_source_status_missing_or_invalid");
  }

  const readiness = recordField(value, "readiness");
  if (
    !readiness ||
    typeof readiness.ready_for_future_apply_write !== "boolean" ||
    !Array.isArray(readiness.current_blockers) ||
    !Array.isArray(readiness.current_missing_evidence)
  ) {
    problems.push("decision_preview_readiness_missing_or_invalid");
  }

  const wouldApplyPreview = recordField(value, "would_apply_preview");
  if (
    !wouldApplyPreview ||
    typeof wouldApplyPreview.proposed_record_kind !== "string" ||
    !hasArrayFields(wouldApplyPreview, [
      "selected_refs_to_add",
      "selected_refs_to_reinforce",
      "warnings_to_add_or_strengthen",
      "context_refs_to_deprioritize",
      "context_refs_to_exclude",
      "expected_return_signal_updates",
      "source_refs",
      "evidence_refs",
    ])
  ) {
    problems.push("decision_preview_would_apply_missing_or_invalid");
  }

  const carryForward = recordField(value, "candidate_carry_forward");
  if (
    !hasArrayFields(carryForward, [
      "keep_unknown_as_review_only",
      "carry_forward_stop_if_missing",
      "rejected_or_excluded_review_notes",
      "duplicate_selected_refs",
      "unknown_selected_ref_attempts",
      "stale_or_noisy_candidates",
      "missing_evidence_candidates",
      "unresolved_blockers",
    ])
  ) {
    problems.push("decision_preview_carry_forward_missing_or_invalid");
  }

  const evidenceSummary = recordField(value, "evidence_summary");
  if (
    !hasArrayFields(evidenceSummary, [
      "source_refs",
      "evidence_refs",
      "missing_evidence",
    ]) ||
    !hasBooleanFields(evidenceSummary, [
      "no_live_handoff_mutation_confirmed",
      "no_handoff_send_confirmed",
      "no_provider_github_codex_confirmed",
      "authority_boundary_valid",
    ])
  ) {
    problems.push("decision_preview_evidence_summary_missing_or_invalid");
  }

  const authorityBoundary = recordField(value, "authority_boundary");
  if (
    !hasBooleanFields(authorityBoundary, [
      "read_only",
      "advisory_only",
      "source_of_truth",
      ...decisionPreviewFalseAuthorityFields,
    ])
  ) {
    problems.push("decision_preview_authority_boundary_missing_or_invalid");
  }

  if (
    !Array.isArray(value.blocking_reasons) ||
    !Array.isArray(value.insufficient_data_reasons) ||
    !Array.isArray(value.missing_evidence)
  ) {
    problems.push("decision_preview_reason_arrays_missing_or_invalid");
  }

  return problems.length
    ? uniqueSortedStrings([
        "apply_operator_decision_preview_malformed",
        ...problems,
      ])
    : [];
}

function buildSourceStatus({
  preview,
  sourcePreviewStatus,
}: {
  preview: HandoffContextApplyOperatorDecisionPreview | null;
  sourcePreviewStatus: DecisionPreviewSourceStatus;
}): HandoffContextApplyWriteContractSourceStatus {
  return {
    apply_operator_decision_preview: sourcePreviewStatus,
    decision_preview_status: preview?.decision_preview_status ?? null,
    authority_boundary: preview
      ? decisionPreviewAuthorityBoundaryValid(preview)
        ? "valid_read_only"
        : "invalid"
      : "missing",
    decision_preview_write_authority: decisionPreviewWriteAuthorityAllFalse(
      preview,
    )
      ? "all_false"
      : "invalid",
  };
}

function buildWouldWriteMaterialPreview({
  preview,
  applyDecisionPreviewRef,
  current_handoff_context_ref,
  current_handoff_packet_fingerprint,
}: {
  preview: HandoffContextApplyOperatorDecisionPreview | null;
  applyDecisionPreviewRef: string | null;
  current_handoff_context_ref?: string;
  current_handoff_packet_fingerprint?: string;
}): HandoffContextApplyWouldWriteMaterialPreview {
  const wouldApply = preview?.would_apply_preview ?? null;
  return {
    selected_refs_to_add: uniqueCandidates(
      wouldApply?.selected_refs_to_add ?? [],
    ),
    selected_refs_to_reinforce: uniqueCandidates(
      wouldApply?.selected_refs_to_reinforce ?? [],
    ),
    warnings_to_add_or_strengthen: uniqueCandidates(
      wouldApply?.warnings_to_add_or_strengthen ?? [],
    ),
    context_refs_to_deprioritize: uniqueCandidates(
      wouldApply?.context_refs_to_deprioritize ?? [],
    ),
    context_refs_to_exclude: uniqueCandidates(
      wouldApply?.context_refs_to_exclude ?? [],
    ),
    expected_return_signal_updates: uniqueCandidates(
      wouldApply?.expected_return_signal_updates ?? [],
    ),
    source_refs: uniqueSortedStrings(wouldApply?.source_refs ?? []),
    evidence_refs: uniqueSortedStrings(wouldApply?.evidence_refs ?? []),
    selected_record_ref: wouldApply?.selected_record_ref ?? null,
    apply_decision_preview_ref: applyDecisionPreviewRef,
    current_handoff_context_ref:
      hasPublicSafeValue(current_handoff_context_ref)
        ? current_handoff_context_ref
        : null,
    current_handoff_packet_fingerprint:
      hasPublicSafeValue(current_handoff_packet_fingerprint)
        ? current_handoff_packet_fingerprint
        : null,
  };
}

function buildCarryForward(
  preview: HandoffContextApplyOperatorDecisionPreview | null,
): HandoffContextApplyWriteContractCarryForward {
  const carryForward = preview?.candidate_carry_forward;
  return {
    keep_unknown_as_review_only: uniqueCandidates(
      carryForward?.keep_unknown_as_review_only ?? [],
    ),
    carry_forward_stop_if_missing: uniqueCandidates(
      carryForward?.carry_forward_stop_if_missing ?? [],
    ),
    rejected_or_excluded_review_notes: uniqueCandidates(
      carryForward?.rejected_or_excluded_review_notes ?? [],
    ),
    duplicate_selected_refs: uniqueSortedStrings(
      carryForward?.duplicate_selected_refs ?? [],
    ),
    unknown_selected_ref_attempts: uniqueSortedStrings(
      carryForward?.unknown_selected_ref_attempts ?? [],
    ),
    stale_or_noisy_candidates: uniqueSortedStrings(
      carryForward?.stale_or_noisy_candidates ?? [],
    ),
    missing_evidence_candidates: uniqueSortedStrings(
      carryForward?.missing_evidence_candidates ?? [],
    ),
    unresolved_blockers: uniqueSortedStrings(
      carryForward?.unresolved_blockers ?? [],
    ),
  };
}

function buildRefusalReasons({
  current_handoff_packet_fingerprint,
  current_handoff_context_ref,
  requested_operator_ref,
  requested_idempotency_key,
}: {
  current_handoff_packet_fingerprint?: string;
  current_handoff_context_ref?: string;
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
}): string[] {
  return uniqueSortedStrings([
    ...unsafeReason(
      "current_handoff_packet_fingerprint_unsafe",
      current_handoff_packet_fingerprint,
    ),
    ...unsafeReason(
      "current_handoff_context_ref_unsafe",
      current_handoff_context_ref,
    ),
    ...unsafeReason("requested_operator_ref_unsafe", requested_operator_ref),
    ...unsafeReason(
      "requested_idempotency_key_unsafe",
      requested_idempotency_key,
    ),
  ]);
}

function unsafeReason(reason: string, value?: string): string[] {
  if (value === undefined || value === null) return [];
  return isPublicSafeRef(value) ? [] : [reason];
}

function buildInsufficientDataReasons({
  preview,
  sourcePreviewStatus,
  decisionPreviewShapeProblems,
  current_handoff_packet_fingerprint,
  current_handoff_context_ref,
  requested_operator_ref,
  requested_idempotency_key,
  wouldWriteMaterial,
  missingEvidence,
}: {
  preview: HandoffContextApplyOperatorDecisionPreview | null;
  sourcePreviewStatus: DecisionPreviewSourceStatus;
  decisionPreviewShapeProblems: string[];
  current_handoff_packet_fingerprint?: string;
  current_handoff_context_ref?: string;
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  wouldWriteMaterial: HandoffContextApplyWouldWriteMaterialPreview;
  missingEvidence: string[];
}): string[] {
  return uniqueSortedStrings([
    ...(sourcePreviewStatus === "missing"
      ? ["apply_operator_decision_preview_missing"]
      : []),
    ...(sourcePreviewStatus === "wrong_version"
      ? ["apply_operator_decision_preview_wrong_version"]
      : []),
    ...decisionPreviewShapeProblems,
    ...(preview &&
    preview.decision_preview_status !== "ready_for_future_apply_write"
      ? [`decision_preview_status_${preview.decision_preview_status}`]
      : []),
    ...(preview &&
    preview.recommended_operator_decision !== "approve_for_future_apply_write"
      ? [
          `recommended_operator_decision_${preview.recommended_operator_decision}`,
        ]
      : []),
    ...(preview && !preview.readiness.ready_for_future_apply_write
      ? ["decision_preview_not_ready_for_future_apply_write"]
      : []),
    ...(preview?.readiness.current_missing_evidence.length
      ? ["source_decision_current_missing_evidence_present"]
      : []),
    ...(preview?.would_apply_preview.proposed_record_kind !==
    "handoff_context_apply_write_candidate.v0.1"
      ? ["apply_write_candidate_kind_missing_or_invalid"]
      : []),
    ...(countWouldWriteMaterial(wouldWriteMaterial) === 0
      ? ["would_write_material_missing"]
      : []),
    ...missingPublicSafeReason(
      "current_handoff_packet_fingerprint_missing",
      current_handoff_packet_fingerprint,
    ),
    ...missingPublicSafeReason(
      "current_handoff_context_ref_missing",
      current_handoff_context_ref,
    ),
    ...missingPublicSafeReason(
      "requested_operator_ref_missing",
      requested_operator_ref,
    ),
    ...missingPublicSafeReason(
      "requested_idempotency_key_missing",
      requested_idempotency_key,
    ),
    ...(preview?.insufficient_data_reasons ?? []),
    ...missingEvidence,
  ]);
}

function buildBlockedReasons({
  preview,
  sourcePreviewStatus,
  sourceStatus,
  refusalReasons,
}: {
  preview: HandoffContextApplyOperatorDecisionPreview | null;
  sourcePreviewStatus: DecisionPreviewSourceStatus;
  sourceStatus: HandoffContextApplyWriteContractSourceStatus;
  refusalReasons: string[];
}): string[] {
  return uniqueSortedStrings([
    ...(sourcePreviewStatus === "wrong_version"
      ? ["blocked_wrong_apply_operator_decision_preview_version"]
      : []),
    ...(sourcePreviewStatus === "malformed"
      ? ["blocked_malformed_apply_operator_decision_preview"]
      : []),
    ...(preview?.decision_preview_status === "blocked"
      ? ["blocked_apply_operator_decision_preview_status"]
      : []),
    ...(preview?.blocking_reasons ?? []),
    ...(preview?.readiness.current_blockers.length
      ? [
          "source_decision_current_blockers_present",
          ...preview.readiness.current_blockers,
        ]
      : []),
    ...(sourceStatus.authority_boundary !== "valid_read_only"
      ? ["blocked_decision_preview_authority_boundary_invalid"]
      : []),
    ...(sourceStatus.decision_preview_write_authority !== "all_false"
      ? ["blocked_decision_preview_write_authority_invalid"]
      : []),
    ...refusalReasons,
  ]);
}

function buildReadiness({
  preview,
  sourceStatus,
  wouldWriteMaterial,
  carryForward,
  blockedReasons,
  insufficientDataReasons,
  missingEvidence,
  refusalReasons,
}: {
  preview: HandoffContextApplyOperatorDecisionPreview | null;
  sourceStatus: HandoffContextApplyWriteContractSourceStatus;
  wouldWriteMaterial: HandoffContextApplyWouldWriteMaterialPreview;
  carryForward: HandoffContextApplyWriteContractCarryForward;
  blockedReasons: string[];
  insufficientDataReasons: string[];
  missingEvidence: string[];
  refusalReasons: string[];
}): HandoffContextApplyWriteContractReadiness {
  const hasSourceReady =
    preview?.decision_preview_status === "ready_for_future_apply_write" &&
    preview.recommended_operator_decision === "approve_for_future_apply_write" &&
    preview.readiness.ready_for_future_apply_write === true;
  const hasContractMaterial = countWouldWriteMaterial(wouldWriteMaterial) > 0;
  const readOnlyDecisionPreview =
    sourceStatus.authority_boundary === "valid_read_only" &&
    sourceStatus.decision_preview_write_authority === "all_false";
  const readyForFutureWriteScope =
    Boolean(preview) &&
    hasSourceReady &&
    hasContractMaterial &&
    readOnlyDecisionPreview &&
    blockedReasons.length === 0 &&
    insufficientDataReasons.length === 0 &&
    missingEvidence.length === 0 &&
    refusalReasons.length === 0 &&
    carryForward.duplicate_selected_refs.length === 0 &&
    carryForward.unknown_selected_ref_attempts.length === 0 &&
    carryForward.missing_evidence_candidates.length === 0 &&
    carryForward.unresolved_blockers.length === 0;
  const readyForOperatorReview =
    Boolean(preview) &&
    hasContractMaterial &&
    readOnlyDecisionPreview &&
    refusalReasons.length === 0 &&
    (readyForFutureWriteScope ||
      preview?.decision_preview_status === "ready_for_operator_review" ||
      countCarryForward(carryForward) > 0);

  return {
    ready_for_operator_review: readyForOperatorReview,
    ready_for_future_write_scope: readyForFutureWriteScope,
    requires_apply_operator_decision_preview: true,
    requires_ready_for_future_apply_write: true,
    requires_current_handoff_packet_fingerprint: true,
    requires_current_handoff_context_ref: true,
    requires_operator_approval_payload: true,
    requires_public_safe_operator_ref: true,
    requires_public_safe_idempotency_key: true,
    requires_no_blockers: true,
    requires_no_insufficient_data: true,
    requires_no_missing_evidence: true,
    requires_no_review_only_material_in_live_write: true,
    requires_read_only_decision_preview: true,
    current_blockers: blockedReasons,
    current_insufficient_data: insufficientDataReasons,
    current_missing_evidence: missingEvidence,
    current_refusal_reasons: refusalReasons,
  };
}

function determineContractPreviewStatus({
  preview,
  sourcePreviewStatus,
  readiness,
  blockedReasons,
  insufficientDataReasons,
}: {
  preview: HandoffContextApplyOperatorDecisionPreview | null;
  sourcePreviewStatus: DecisionPreviewSourceStatus;
  readiness: HandoffContextApplyWriteContractReadiness;
  blockedReasons: string[];
  insufficientDataReasons: string[];
}): HandoffContextApplyWriteContractPreviewStatus {
  if (!preview || sourcePreviewStatus !== "supplied") return "insufficient_data";
  if (blockedReasons.length > 0) return "blocked";
  if (readiness.ready_for_future_write_scope) return "ready_for_future_write_scope";
  if (readiness.ready_for_operator_review) return "ready_for_operator_review";
  if (insufficientDataReasons.length > 0) return "insufficient_data";
  if (preview.decision_preview_status === "ready_for_future_apply_write") {
    return "contract_candidates_available";
  }
  return "keep_preview_only";
}

function determineRecommendedNextAction({
  sourcePreviewStatus,
  preview,
  readiness,
  refusalReasons,
  insufficientDataReasons,
  blockedReasons,
  current_handoff_packet_fingerprint,
  current_handoff_context_ref,
  requested_operator_ref,
  requested_idempotency_key,
}: {
  sourcePreviewStatus: DecisionPreviewSourceStatus;
  preview: HandoffContextApplyOperatorDecisionPreview | null;
  readiness: HandoffContextApplyWriteContractReadiness;
  refusalReasons: string[];
  insufficientDataReasons: string[];
  blockedReasons: string[];
  current_handoff_packet_fingerprint?: string;
  current_handoff_context_ref?: string;
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
}): HandoffContextApplyWriteContractRecommendedNextAction {
  if (refusalReasons.length > 0) return "reject_apply_write_candidate";
  if (sourcePreviewStatus !== "supplied" || !preview) {
    return "supply_apply_decision_preview";
  }
  if (
    preview.decision_preview_status === "blocked" ||
    blockedReasons.some((reason) => reason.startsWith("blocked_apply_"))
  ) {
    return "resolve_apply_decision_blockers";
  }
  if (readiness.ready_for_future_write_scope) {
    return "prepare_separate_apply_write_slice";
  }
  if (!hasPublicSafeValue(current_handoff_packet_fingerprint)) {
    return "supply_current_handoff_packet_fingerprint";
  }
  if (
    !hasPublicSafeValue(current_handoff_context_ref) ||
    !hasPublicSafeValue(requested_operator_ref) ||
    !hasPublicSafeValue(requested_idempotency_key)
  ) {
    return "supply_operator_approval_material";
  }
  if (readiness.ready_for_operator_review) return "review_future_write_contract";
  if (insufficientDataReasons.length > 0) return "supply_apply_decision_preview";
  return "keep_preview_only";
}

function buildEvidenceSummary({
  preview,
  sourcePreviewStatus,
  sourceStatus,
  wouldWriteMaterial,
  missingEvidence,
  blockedReasons,
  insufficientDataReasons,
  current_handoff_packet_fingerprint,
  current_handoff_context_ref,
  requested_operator_ref,
  requested_idempotency_key,
}: {
  preview: HandoffContextApplyOperatorDecisionPreview | null;
  sourcePreviewStatus: DecisionPreviewSourceStatus;
  sourceStatus: HandoffContextApplyWriteContractSourceStatus;
  wouldWriteMaterial: HandoffContextApplyWouldWriteMaterialPreview;
  missingEvidence: string[];
  blockedReasons: string[];
  insufficientDataReasons: string[];
  current_handoff_packet_fingerprint?: string;
  current_handoff_context_ref?: string;
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
}): HandoffContextApplyWriteContractEvidenceSummary {
  const sourceRefs = uniqueSortedStrings([
    ...(preview?.source_refs ?? []),
    ...(preview?.evidence_summary.source_refs ?? []),
    ...wouldWriteMaterial.source_refs,
  ]);
  const evidenceRefs = uniqueSortedStrings([
    ...(preview?.evidence_summary.evidence_refs ?? []),
    ...wouldWriteMaterial.evidence_refs,
  ]);
  return {
    has_apply_operator_decision_preview: Boolean(preview),
    decision_preview_version_valid: sourcePreviewStatus === "supplied",
    decision_preview_ready_for_future_apply_write:
      preview?.readiness.ready_for_future_apply_write ?? false,
    has_would_write_material: countWouldWriteMaterial(wouldWriteMaterial) > 0,
    has_selected_record_ref: Boolean(wouldWriteMaterial.selected_record_ref),
    has_source_refs: sourceRefs.length > 0,
    has_evidence_refs: evidenceRefs.length > 0,
    has_current_handoff_packet_fingerprint: hasPublicSafeValue(
      current_handoff_packet_fingerprint,
    ),
    has_current_handoff_context_ref: hasPublicSafeValue(
      current_handoff_context_ref,
    ),
    has_operator_ref: hasPublicSafeValue(requested_operator_ref),
    has_idempotency_key: hasPublicSafeValue(requested_idempotency_key),
    has_missing_evidence: missingEvidence.length > 0,
    has_blockers: blockedReasons.length > 0,
    has_insufficient_data: insufficientDataReasons.length > 0,
    authority_boundary_valid:
      sourceStatus.authority_boundary === "valid_read_only",
    decision_preview_write_authority_false:
      sourceStatus.decision_preview_write_authority === "all_false",
    no_live_handoff_mutation_confirmed:
      preview?.evidence_summary.no_live_handoff_mutation_confirmed ?? false,
    no_handoff_send_confirmed:
      preview?.evidence_summary.no_handoff_send_confirmed ?? false,
    no_provider_github_codex_confirmed:
      preview?.evidence_summary.no_provider_github_codex_confirmed ?? false,
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    missing_evidence: missingEvidence,
  };
}

function buildFutureWriteContract(
  applyDecisionPreviewRef: string | null,
): HandoffContextApplyFutureWriteContract {
  return {
    proposed_record_kind: "handoff_context_apply_write_contract.v0.1",
    proposed_receipt_kind: "handoff_context_apply_write_contract_receipt.v0.1",
    required_operator_approval_payload: [
      "operator_decision: approve_for_future_apply_write",
      "approved_by public-safe operator identity",
      "operator_ref public-safe review reference",
      "approved_at timestamp",
      "approval_statement",
      "checklist_confirmations for every contract requirement",
    ],
    required_idempotency: [
      "public-safe idempotency key",
      "same key and same fingerprint must replay without duplicate writes",
      "same key and different material must refuse as conflict",
    ],
    required_current_handoff_context_guard: [
      "current handoff context ref",
      "current handoff packet fingerprint",
      "refuse if current packet fingerprint changed before write",
    ],
    required_current_handoff_packet_fingerprint: [
      "public-safe fingerprint for the packet that would be guarded",
    ],
    required_selected_record_ref: [
      "selected operator-approved handoff context update record ref",
    ],
    required_apply_decision_preview_ref: [
      applyDecisionPreviewRef ?? "concrete apply decision preview instance ref",
      HANDOFF_CONTEXT_APPLY_OPERATOR_DECISION_PREVIEW_VERSION,
    ],
    required_source_refs: ["source refs from the apply decision preview"],
    required_evidence_refs: ["evidence refs for every live apply candidate"],
    required_no_side_effects_receipt: [
      "handoff_context_mutated: false",
      "selected_refs_written_to_live_handoff: false",
      "handoff_sent: false",
      "provider_called: false",
      "github_called: false",
      "codex_executed: false",
    ],
    required_refusal_checks: [
      "missing or malformed decision preview",
      "decision preview not ready_for_future_apply_write",
      "unsafe operator ref or idempotency key",
      "unsafe current packet fingerprint or context ref",
      "missing evidence or blockers",
      "review-only material in live write payload",
    ],
  };
}

function buildOperatorReviewChecklist(): string[] {
  return [
    "Confirm the source apply decision preview is ready_for_future_apply_write.",
    "Confirm current handoff packet fingerprint and context ref are public-safe and current.",
    "Confirm requested operator ref and idempotency key are public-safe.",
    "Confirm live would-write material excludes keep_unknown, stop-if-missing, and rejected/excluded material.",
    "Confirm a later apply write would require a separate scoped implementation and approval.",
  ];
}

function buildWouldNotWrite(): string[] {
  return [
    "does_not_persist_operator_decision",
    "does_not_create_apply_write_contract_record",
    "does_not_write_db_rows",
    "does_not_create_schema",
    "does_not_mutate_live_handoff_context",
    "does_not_write_selected_refs_to_active_handoff_packet",
    "does_not_send_handoffs",
    "does_not_update_continuity_relay",
    "does_not_update_current_working_perspective",
    "does_not_mutate_memory",
    "does_not_mutate_perspective_unit",
    "does_not_write_next_work_bias",
    "does_not_write_dogfood_metrics",
    "does_not_write_reuse_ledger",
    "does_not_create_promotion_decisions",
    "does_not_create_formation_receipts",
    "does_not_call_provider_openai",
    "does_not_call_github",
    "does_not_execute_codex",
    "does_not_create_prs",
    "does_not_merge_prs",
    "does_not_run_autonomous_actions",
    "does_not_create_graph_vector_rag_crawler_browser_observer",
  ];
}

function buildSourceRefs({
  preview,
  source_refs,
  applyDecisionPreviewRef,
}: {
  preview: HandoffContextApplyOperatorDecisionPreview | null;
  source_refs?: string[];
  applyDecisionPreviewRef: string | null;
}): string[] {
  return uniqueSortedStrings([
    ...(source_refs ?? []),
    ...(preview?.source_refs ?? []),
    ...(preview ? [HANDOFF_CONTEXT_APPLY_OPERATOR_DECISION_PREVIEW_VERSION] : []),
    ...(applyDecisionPreviewRef ? [applyDecisionPreviewRef] : []),
    HANDOFF_CONTEXT_APPLY_WRITE_CONTRACT_PREVIEW_VERSION,
  ]);
}

function buildApplyDecisionPreviewInstanceRef(
  preview: HandoffContextApplyOperatorDecisionPreview,
): string {
  return [
    "apply-decision-preview",
    `v=${safeRefComponent(preview.preview_version)}`,
    `t=${safeRefComponent(preview.as_of)}`,
    `r=${safeRefComponent(preview.would_apply_preview.selected_record_ref ?? "none")}`,
    `s=${safeRefComponent(preview.decision_preview_status)}`,
  ].join("|");
}

function safeRefComponent(value: string): string {
  return value.replace(/[\s\x00-\x1f\x7f|]/g, "_").slice(0, 120);
}

function missingPublicSafeReason(reason: string, value?: string): string[] {
  return hasPublicSafeValue(value) ? [] : [reason];
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
  if (/^(sk-|ghp_|github_pat_|xoxb-)/i.test(value)) return false;
  if (/^[a-z][a-z0-9+.-]*:\/\/[^/\s]+@/i.test(value)) return false;
  if (/(^|[/:])(\.env)([/:]|$)/i.test(value)) return false;
  if (/(\/Users\/|\/home\/|password:|secret:)/i.test(value)) return false;
  return true;
}

function decisionPreviewAuthorityBoundaryValid(
  preview: HandoffContextApplyOperatorDecisionPreview | null,
): boolean {
  if (!preview) return false;
  const boundary = preview.authority_boundary;
  return (
    boundary.read_only === true &&
    boundary.advisory_only === true &&
    boundary.source_of_truth === false &&
    decisionPreviewWriteAuthorityAllFalse(preview)
  );
}

function decisionPreviewWriteAuthorityAllFalse(
  preview: HandoffContextApplyOperatorDecisionPreview | null,
): boolean {
  if (!preview) return false;
  const boundary = preview.authority_boundary;
  return decisionPreviewFalseAuthorityFields.every(
    (field) => boundary[field] === false,
  );
}

const decisionPreviewFalseAuthorityFields = [
  "can_persist_decision",
  "can_write_db",
  "can_create_schema",
  "can_write_handoff_context_update_record",
  "can_write_operator_approved_handoff_context_update_record",
  "can_mutate_live_handoff_context",
  "can_write_selected_refs_to_live_handoff",
  "can_send_handoff",
  "can_write_continuity_relay",
  "can_update_current_working_perspective",
  "can_write_perspective_unit",
  "can_write_next_work_bias",
  "can_write_memory",
  "can_mutate_memory",
  "can_promote_memory",
  "can_apply_project_perspective",
  "can_create_promotion_decision",
  "can_create_formation_receipt",
  "can_write_dogfood_metrics",
  "can_update_metrics",
  "can_write_dogfood_ledger",
  "can_call_provider_openai",
  "can_call_github",
  "can_execute_codex",
  "can_create_pr",
  "can_merge_pr",
  "can_run_autonomous_action",
  "can_create_graph_or_vector_store",
  "can_create_rag_stack",
  "can_crawl_or_observe_browser",
] satisfies Array<keyof HandoffContextApplyOperatorDecisionAuthorityBoundary>;

function countWouldWriteMaterial(
  material: HandoffContextApplyWouldWriteMaterialPreview,
): number {
  return (
    material.selected_refs_to_add.length +
    material.selected_refs_to_reinforce.length +
    material.warnings_to_add_or_strengthen.length +
    material.context_refs_to_deprioritize.length +
    material.context_refs_to_exclude.length +
    material.expected_return_signal_updates.length
  );
}

function countCarryForward(
  carryForward: HandoffContextApplyWriteContractCarryForward,
): number {
  return (
    carryForward.keep_unknown_as_review_only.length +
    carryForward.carry_forward_stop_if_missing.length +
    carryForward.rejected_or_excluded_review_notes.length +
    carryForward.duplicate_selected_refs.length +
    carryForward.unknown_selected_ref_attempts.length +
    carryForward.stale_or_noisy_candidates.length +
    carryForward.missing_evidence_candidates.length +
    carryForward.unresolved_blockers.length
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function recordField(
  value: Record<string, unknown>,
  field: string,
): Record<string, unknown> | null {
  const nested = value[field];
  return isRecord(nested) ? nested : null;
}

function hasArrayFields(
  value: Record<string, unknown> | null,
  fields: string[],
): boolean {
  return Boolean(value && fields.every((field) => Array.isArray(value[field])));
}

function hasBooleanFields(
  value: Record<string, unknown> | null,
  fields: string[],
): boolean {
  return Boolean(
    value && fields.every((field) => typeof value[field] === "boolean"),
  );
}

function uniqueCandidates(
  candidates: HandoffContextApplyPreviewCandidate[],
): HandoffContextApplyPreviewCandidate[] {
  const seen = new Set<string>();
  const unique: HandoffContextApplyPreviewCandidate[] = [];
  for (const candidate of candidates) {
    const key = candidate.candidate_id || candidate.ref_id;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(candidate);
  }
  return unique;
}

function uniqueSortedStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}
