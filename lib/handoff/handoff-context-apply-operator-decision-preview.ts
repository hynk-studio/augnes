import {
  HANDOFF_CONTEXT_APPLY_PREVIEW_VERSION,
  type HandoffContextApplyPreview,
  type HandoffContextApplyPreviewAuthorityBoundary,
  type HandoffContextApplyPreviewCandidate,
  type HandoffContextApplyPreviewConflictSummary,
} from "@/types/handoff-context-apply-preview";
import {
  HANDOFF_CONTEXT_APPLY_OPERATOR_DECISION_PREVIEW_VERSION,
  type HandoffContextApplyAvailableOperatorDecision,
  type HandoffContextApplyOperatorDecisionAuthorityBoundary,
  type HandoffContextApplyOperatorDecisionCarryForward,
  type HandoffContextApplyOperatorDecisionEvidenceSummary,
  type HandoffContextApplyOperatorDecisionPreview,
  type HandoffContextApplyOperatorDecisionPreviewInput,
  type HandoffContextApplyOperatorDecisionPreviewStatus,
  type HandoffContextApplyOperatorDecisionReadiness,
  type HandoffContextApplyOperatorDecisionSourceStatus,
  type HandoffContextApplyOperatorDecisionWouldApplyPreview,
  type HandoffContextApplyRecommendedOperatorDecision,
} from "@/types/handoff-context-apply-operator-decision-preview";

const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;
const DEFAULT_SCOPE = "project:augnes" as const;

const AVAILABLE_OPERATOR_DECISIONS: HandoffContextApplyAvailableOperatorDecision[] =
  [
    "defer_until_record_material_supplied",
    "defer_until_blockers_resolved",
    "review_for_future_apply_write",
    "approve_for_future_apply_write",
    "keep_preview_only",
    "reject_apply_candidate",
  ];

export function buildHandoffContextApplyOperatorDecisionPreviewV01({
  apply_preview,
  as_of,
  scope,
  source_refs,
}: HandoffContextApplyOperatorDecisionPreviewInput = {}): HandoffContextApplyOperatorDecisionPreview {
  const sourcePreviewStatus = getApplyPreviewSourceStatus(apply_preview);
  const applyPreviewShapeProblems =
    buildApplyPreviewShapeProblems(apply_preview);
  const preview = isCompleteHandoffContextApplyPreviewShape(apply_preview)
    ? apply_preview
    : null;
  const liveMaterial = collectLiveApplyMaterial(preview);
  const carryForward = buildCandidateCarryForward(preview);
  const sourceStatus = buildSourceStatus({ preview, sourcePreviewStatus });
  const missingEvidence = buildMissingEvidence({ preview, sourcePreviewStatus });
  const insufficientDataReasons = buildInsufficientDataReasons({
    preview,
    sourcePreviewStatus,
    applyPreviewShapeProblems,
    liveMaterial,
    missingEvidence,
  });
  const blockingReasons = buildBlockingReasons({
    preview,
    sourcePreviewStatus,
    sourceStatus,
    missingEvidence,
  });
  const readiness = buildReadiness({
    preview,
    liveMaterial,
    carryForward,
    blockingReasons,
    insufficientDataReasons,
    missingEvidence,
    sourceStatus,
  });
  const decisionPreviewStatus = determineDecisionPreviewStatus({
    preview,
    sourcePreviewStatus,
    readiness,
    blockingReasons,
    insufficientDataReasons,
  });
  const recommendedOperatorDecision = determineRecommendedOperatorDecision({
    preview,
    decisionPreviewStatus,
    readiness,
    blockingReasons,
    insufficientDataReasons,
    missingEvidence,
  });
  const evidenceSummary = buildEvidenceSummary({
    preview,
    sourcePreviewStatus,
    liveMaterial,
    missingEvidence,
  });

  return {
    preview_version: HANDOFF_CONTEXT_APPLY_OPERATOR_DECISION_PREVIEW_VERSION,
    scope: scope ?? preview?.scope ?? DEFAULT_SCOPE,
    as_of: as_of ?? preview?.as_of ?? FALLBACK_AS_OF,
    source_refs: buildSourceRefs({ preview, source_refs }),
    decision_preview_status: decisionPreviewStatus,
    recommended_operator_decision: recommendedOperatorDecision,
    available_operator_decisions: AVAILABLE_OPERATOR_DECISIONS,
    input_summary: {
      has_apply_preview: Boolean(preview),
      apply_preview_status: preview?.preview_status ?? null,
      selected_record_ref: preview?.selected_record_ref ?? null,
      selected_full_record_supplied:
        preview?.input_summary.selected_full_record_supplied ?? false,
      apply_candidate_count: countLiveApplyMaterial(liveMaterial),
      selected_ref_add_count: liveMaterial.selected_refs_to_add.length,
      selected_ref_reinforce_count:
        liveMaterial.selected_refs_to_reinforce.length,
      warning_update_count:
        liveMaterial.warnings_to_add_or_strengthen.length,
      context_deprioritize_count:
        liveMaterial.context_refs_to_deprioritize.length,
      context_exclude_count: liveMaterial.context_refs_to_exclude.length,
      keep_unknown_count:
        preview?.proposed_apply_delta.keep_unknown_as_review_only.length ?? 0,
      expected_return_update_count:
        liveMaterial.expected_return_signal_updates.length,
      carry_forward_stop_count:
        preview?.proposed_apply_delta.carry_forward_stop_if_missing.length ?? 0,
      rejected_or_excluded_note_count:
        preview?.proposed_apply_delta.rejected_or_excluded_review_notes.length ??
        0,
      blocker_count: blockingReasons.length,
      insufficient_data_count: insufficientDataReasons.length,
      conflict_count: countConflicts(preview?.conflict_summary ?? null),
      missing_evidence_count: missingEvidence.length,
    },
    source_status: sourceStatus,
    readiness,
    approval_requirements: buildApprovalRequirements(),
    blocking_reasons: blockingReasons,
    insufficient_data_reasons: insufficientDataReasons,
    missing_evidence: missingEvidence,
    conflict_summary: preview?.conflict_summary ?? emptyConflictSummary(),
    evidence_summary: evidenceSummary,
    would_apply_preview: buildWouldApplyPreview({
      preview,
      liveMaterial,
    }),
    would_not_apply: buildWouldNotApply(),
    candidate_carry_forward: carryForward,
    review_checklist: buildReviewChecklist(),
    non_goals: uniqueSortedStrings([
      "no_persisted_operator_decision",
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
      createHandoffContextApplyOperatorDecisionAuthorityBoundaryV01(),
  };
}

export function createHandoffContextApplyOperatorDecisionAuthorityBoundaryV01(): HandoffContextApplyOperatorDecisionAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_persist_decision: false,
    can_write_db: false,
    can_create_schema: false,
    can_write_handoff_context_update_record: false,
    can_write_operator_approved_handoff_context_update_record: false,
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
      "Apply operator decision preview is read-only and advisory.",
      "It consumes an already-built Handoff Context Apply Preview and does not rebuild upstream record review, records, relay rationale, continuity relay, dogfood, or metric objects.",
      "Even when ready_for_future_apply_write is true, this preview cannot persist a decision or apply material to live handoff context.",
    ],
  };
}

type ApplyPreviewSourceStatus = "supplied" | "missing" | "wrong_version";

interface LiveApplyMaterial {
  selected_refs_to_add: HandoffContextApplyPreviewCandidate[];
  selected_refs_to_reinforce: HandoffContextApplyPreviewCandidate[];
  warnings_to_add_or_strengthen: HandoffContextApplyPreviewCandidate[];
  context_refs_to_deprioritize: HandoffContextApplyPreviewCandidate[];
  context_refs_to_exclude: HandoffContextApplyPreviewCandidate[];
  expected_return_signal_updates: HandoffContextApplyPreviewCandidate[];
}

function getApplyPreviewSourceStatus(value: unknown): ApplyPreviewSourceStatus {
  if (!value) return "missing";
  return hasApplyPreviewVersion(value) ? "supplied" : "wrong_version";
}

function hasApplyPreviewVersion(value: unknown): boolean {
  return (
    isRecord(value) &&
    value.preview_version === HANDOFF_CONTEXT_APPLY_PREVIEW_VERSION
  );
}

function isCompleteHandoffContextApplyPreviewShape(
  value: unknown,
): value is HandoffContextApplyPreview {
  return (
    hasApplyPreviewVersion(value) &&
    buildApplyPreviewShapeProblems(value).length === 0
  );
}

function buildApplyPreviewShapeProblems(value: unknown): string[] {
  if (!hasApplyPreviewVersion(value)) return [];
  if (!isRecord(value)) return ["apply_preview_malformed"];

  const problems: string[] = [];
  const proposedApplyDelta = recordField(value, "proposed_apply_delta");
  if (
    !hasArrayFields(proposedApplyDelta, [
      "selected_refs_to_add",
      "selected_refs_to_reinforce",
      "warnings_to_add_or_strengthen",
      "context_refs_to_deprioritize",
      "context_refs_to_exclude",
      "keep_unknown_as_review_only",
      "expected_return_signal_updates",
      "carry_forward_stop_if_missing",
      "rejected_or_excluded_review_notes",
    ])
  ) {
    problems.push("apply_preview_delta_missing_or_invalid");
  }

  const inputSummary = recordField(value, "input_summary");
  if (
    !inputSummary ||
    typeof inputSummary.selected_full_record_supplied !== "boolean" ||
    typeof inputSummary.apply_candidate_count !== "number"
  ) {
    problems.push("apply_preview_input_summary_missing_or_invalid");
  }

  const conflictSummary = recordField(value, "conflict_summary");
  if (
    !hasArrayFields(conflictSummary, [
      "duplicate_selected_refs",
      "unknown_selected_ref_attempts",
      "missing_evidence_candidates",
      "stale_or_noisy_candidates",
      "conflicting_candidate_ids",
      "blocked_apply_reasons",
    ])
  ) {
    problems.push("apply_preview_conflict_summary_missing_or_invalid");
  }

  const evidenceSummary = recordField(value, "evidence_summary");
  if (
    !hasArrayFields(evidenceSummary, [
      "source_refs",
      "evidence_refs",
      "missing_evidence",
      "problem_record_ids",
    ]) ||
    !hasBooleanFields(evidenceSummary, [
      "all_apply_candidates_evidence_backed",
      "no_live_handoff_mutation_confirmed",
      "no_handoff_send_confirmed",
      "no_provider_github_codex_confirmed",
    ])
  ) {
    problems.push("apply_preview_evidence_summary_missing_or_invalid");
  }

  const authorityBoundary = recordField(value, "authority_boundary");
  if (
    !hasBooleanFields(authorityBoundary, [
      "read_only_apply_preview",
      "advisory_only",
      "source_of_truth",
      ...applyPreviewFalseAuthorityFields,
    ])
  ) {
    problems.push("apply_preview_authority_boundary_missing_or_invalid");
  }

  return problems.length
    ? uniqueSortedStrings(["apply_preview_malformed", ...problems])
    : [];
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

function collectLiveApplyMaterial(
  preview: HandoffContextApplyPreview | null,
): LiveApplyMaterial {
  return {
    selected_refs_to_add: uniqueCandidates(
      preview?.proposed_apply_delta.selected_refs_to_add ?? [],
    ),
    selected_refs_to_reinforce: uniqueCandidates(
      preview?.proposed_apply_delta.selected_refs_to_reinforce ?? [],
    ),
    warnings_to_add_or_strengthen: uniqueCandidates(
      preview?.proposed_apply_delta.warnings_to_add_or_strengthen ?? [],
    ),
    context_refs_to_deprioritize: uniqueCandidates(
      preview?.proposed_apply_delta.context_refs_to_deprioritize ?? [],
    ),
    context_refs_to_exclude: uniqueCandidates(
      preview?.proposed_apply_delta.context_refs_to_exclude ?? [],
    ),
    expected_return_signal_updates: uniqueCandidates(
      preview?.proposed_apply_delta.expected_return_signal_updates ?? [],
    ),
  };
}

function buildSourceStatus({
  preview,
  sourcePreviewStatus,
}: {
  preview: HandoffContextApplyPreview | null;
  sourcePreviewStatus: ApplyPreviewSourceStatus;
}): HandoffContextApplyOperatorDecisionSourceStatus {
  return {
    apply_preview: sourcePreviewStatus,
    apply_preview_status: preview?.preview_status ?? null,
    authority_boundary: preview
      ? applyPreviewAuthorityBoundaryValid(preview)
        ? "valid_read_only"
        : "invalid"
      : "missing",
    apply_preview_write_authority: applyPreviewWriteAuthorityAllFalse(preview)
      ? "all_false"
      : "invalid",
  };
}

function buildMissingEvidence({
  preview,
  sourcePreviewStatus,
}: {
  preview: HandoffContextApplyPreview | null;
  sourcePreviewStatus: ApplyPreviewSourceStatus;
}): string[] {
  return uniqueSortedStrings([
    ...(sourcePreviewStatus === "missing" ? ["apply_preview_missing"] : []),
    ...(sourcePreviewStatus === "wrong_version"
      ? ["apply_preview_wrong_version"]
      : []),
    ...(preview?.evidence_summary.missing_evidence ?? []),
  ]);
}

function buildInsufficientDataReasons({
  preview,
  sourcePreviewStatus,
  applyPreviewShapeProblems,
  liveMaterial,
  missingEvidence,
}: {
  preview: HandoffContextApplyPreview | null;
  sourcePreviewStatus: ApplyPreviewSourceStatus;
  applyPreviewShapeProblems: string[];
  liveMaterial: LiveApplyMaterial;
  missingEvidence: string[];
}): string[] {
  return uniqueSortedStrings([
    ...(sourcePreviewStatus === "missing" ? ["apply_preview_missing"] : []),
    ...(sourcePreviewStatus === "wrong_version"
      ? ["apply_preview_wrong_version"]
      : []),
    ...(preview?.preview_status === "no_records"
      ? ["apply_preview_no_records"]
      : []),
    ...(preview?.preview_status === "insufficient_data"
      ? ["apply_preview_insufficient_data"]
      : []),
    ...(preview?.preview_status === "no_selected_record"
      ? ["apply_preview_no_selected_record"]
      : []),
    ...(preview && !preview.input_summary.selected_full_record_supplied
      ? ["selected_full_record_material_missing"]
      : []),
    ...(preview && countLiveApplyMaterial(liveMaterial) === 0
      ? ["apply_candidate_material_missing"]
      : []),
    ...applyPreviewShapeProblems,
    ...(preview?.insufficient_data_reasons ?? []),
    ...missingEvidence,
  ]);
}

function buildBlockingReasons({
  preview,
  sourcePreviewStatus,
  sourceStatus,
  missingEvidence,
}: {
  preview: HandoffContextApplyPreview | null;
  sourcePreviewStatus: ApplyPreviewSourceStatus;
  sourceStatus: HandoffContextApplyOperatorDecisionSourceStatus;
  missingEvidence: string[];
}): string[] {
  const conflictSummary = preview?.conflict_summary ?? emptyConflictSummary();
  return uniqueSortedStrings([
    ...(sourcePreviewStatus === "wrong_version"
      ? ["blocked_wrong_apply_preview_version"]
      : []),
    ...(preview?.preview_status === "blocked"
      ? ["blocked_apply_preview_status"]
      : []),
    ...(preview?.blocked_reasons ?? []),
    ...(conflictSummary.unknown_selected_ref_attempts.length > 0
      ? ["blocked_unknown_selected_ref_attempts"]
      : []),
    ...(conflictSummary.duplicate_selected_refs.length > 0
      ? ["blocked_duplicate_selected_ref_adds"]
      : []),
    ...(conflictSummary.missing_evidence_candidates.length > 0
      ? ["blocked_selected_ref_candidate_missing_evidence"]
      : []),
    ...(conflictSummary.conflicting_candidate_ids.length > 0
      ? ["blocked_conflicting_apply_candidate_ids"]
      : []),
    ...(preview?.evidence_summary.problem_record_ids.length
      ? ["blocked_problem_records_present"]
      : []),
    ...(preview?.evidence_summary.all_apply_candidates_evidence_backed === false
      ? ["blocked_apply_candidates_not_evidence_backed"]
      : []),
    ...(preview?.evidence_summary.no_live_handoff_mutation_confirmed === false
      ? ["blocked_live_handoff_mutation_not_confirmed_false"]
      : []),
    ...(preview?.evidence_summary.no_handoff_send_confirmed === false
      ? ["blocked_handoff_send_not_confirmed_false"]
      : []),
    ...(preview?.evidence_summary.no_provider_github_codex_confirmed === false
      ? ["blocked_provider_github_codex_not_confirmed_false"]
      : []),
    ...(sourceStatus.authority_boundary !== "valid_read_only"
      ? ["blocked_apply_preview_authority_boundary_invalid"]
      : []),
    ...(sourceStatus.apply_preview_write_authority !== "all_false"
      ? ["blocked_apply_preview_write_authority_invalid"]
      : []),
    ...missingEvidence
      .filter((reason) => reason.includes("candidate_missing_evidence"))
      .map((reason) => `blocked_${reason}`),
  ]);
}

function buildReadiness({
  preview,
  liveMaterial,
  carryForward,
  blockingReasons,
  insufficientDataReasons,
  missingEvidence,
  sourceStatus,
}: {
  preview: HandoffContextApplyPreview | null;
  liveMaterial: LiveApplyMaterial;
  carryForward: HandoffContextApplyOperatorDecisionCarryForward;
  blockingReasons: string[];
  insufficientDataReasons: string[];
  missingEvidence: string[];
  sourceStatus: HandoffContextApplyOperatorDecisionSourceStatus;
}): HandoffContextApplyOperatorDecisionReadiness {
  const liveMaterialCount = countLiveApplyMaterial(liveMaterial);
  const reviewOnlyCarryForwardCount =
    carryForward.keep_unknown_as_review_only.length +
    carryForward.carry_forward_stop_if_missing.length +
    carryForward.rejected_or_excluded_review_notes.length;
  const readyForFutureApplyWrite = preview
    ? preview.preview_status === "apply_candidates_available" &&
      preview.input_summary.selected_full_record_supplied &&
      liveMaterialCount > 0 &&
      blockingReasons.length === 0 &&
      insufficientDataReasons.length === 0 &&
      missingEvidence.length === 0 &&
      countConflicts(preview.conflict_summary) === 0 &&
      preview.evidence_summary.problem_record_ids.length === 0 &&
      preview.evidence_summary.all_apply_candidates_evidence_backed &&
      preview.evidence_summary.no_live_handoff_mutation_confirmed &&
      preview.evidence_summary.no_handoff_send_confirmed &&
      preview.evidence_summary.no_provider_github_codex_confirmed &&
      sourceStatus.authority_boundary === "valid_read_only" &&
      sourceStatus.apply_preview_write_authority === "all_false" &&
      reviewOnlyCarryForwardCount === 0
    : false;
  const readyForOperatorReview = preview
    ? liveMaterialCount > 0 &&
      blockingReasons.length === 0 &&
      missingEvidence.length === 0 &&
      sourceStatus.authority_boundary === "valid_read_only" &&
      sourceStatus.apply_preview_write_authority === "all_false" &&
      (preview.preview_status === "needs_operator_review" ||
        reviewOnlyCarryForwardCount > 0 ||
        readyForFutureApplyWrite)
    : false;

  return {
    ready_for_operator_review: readyForOperatorReview,
    ready_for_future_apply_write: readyForFutureApplyWrite,
    requires_apply_preview: true,
    requires_full_record_material: true,
    requires_apply_candidates: true,
    requires_no_blockers: true,
    requires_no_missing_evidence: true,
    requires_no_unknown_selected_refs: true,
    requires_no_duplicate_selected_ref_adds: true,
    requires_no_selected_ref_missing_evidence: true,
    requires_no_problem_records: true,
    requires_read_only_apply_preview: true,
    requires_operator_confirmation: true,
    current_blockers: blockingReasons,
    current_missing_evidence: missingEvidence,
  };
}

function determineDecisionPreviewStatus({
  preview,
  sourcePreviewStatus,
  readiness,
  blockingReasons,
  insufficientDataReasons,
}: {
  preview: HandoffContextApplyPreview | null;
  sourcePreviewStatus: ApplyPreviewSourceStatus;
  readiness: HandoffContextApplyOperatorDecisionReadiness;
  blockingReasons: string[];
  insufficientDataReasons: string[];
}): HandoffContextApplyOperatorDecisionPreviewStatus {
  if (!preview || sourcePreviewStatus !== "supplied") return "insufficient_data";
  if (blockingReasons.length > 0 || preview.preview_status === "blocked") {
    return "blocked";
  }
  if (readiness.ready_for_future_apply_write) {
    return "ready_for_future_apply_write";
  }
  if (readiness.ready_for_operator_review) return "ready_for_operator_review";
  if (insufficientDataReasons.length > 0) return "insufficient_data";
  return "keep_preview_only";
}

function determineRecommendedOperatorDecision({
  preview,
  decisionPreviewStatus,
  readiness,
  blockingReasons,
  insufficientDataReasons,
  missingEvidence,
}: {
  preview: HandoffContextApplyPreview | null;
  decisionPreviewStatus: HandoffContextApplyOperatorDecisionPreviewStatus;
  readiness: HandoffContextApplyOperatorDecisionReadiness;
  blockingReasons: string[];
  insufficientDataReasons: string[];
  missingEvidence: string[];
}): HandoffContextApplyRecommendedOperatorDecision {
  if (readiness.ready_for_future_apply_write) {
    return "approve_for_future_apply_write";
  }
  if (decisionPreviewStatus === "ready_for_operator_review") {
    return "review_for_future_apply_write";
  }
  if (decisionPreviewStatus === "blocked" || blockingReasons.length > 0) {
    return "defer_until_blockers_resolved";
  }
  if (
    !preview ||
    insufficientDataReasons.includes("selected_full_record_material_missing") ||
    insufficientDataReasons.includes("apply_preview_no_selected_record") ||
    insufficientDataReasons.includes("apply_preview_missing") ||
    missingEvidence.length > 0
  ) {
    return "defer_until_record_material_supplied";
  }
  return "keep_preview_only";
}

function buildEvidenceSummary({
  preview,
  sourcePreviewStatus,
  liveMaterial,
  missingEvidence,
}: {
  preview: HandoffContextApplyPreview | null;
  sourcePreviewStatus: ApplyPreviewSourceStatus;
  liveMaterial: LiveApplyMaterial;
  missingEvidence: string[];
}): HandoffContextApplyOperatorDecisionEvidenceSummary {
  const sourceRefs = uniqueSortedStrings([
    ...(preview?.source_refs ?? []),
    ...(preview?.evidence_summary.source_refs ?? []),
  ]);
  const evidenceRefs = uniqueSortedStrings(
    preview?.evidence_summary.evidence_refs ?? [],
  );
  return {
    has_apply_preview: Boolean(preview),
    apply_preview_version_valid: sourcePreviewStatus === "supplied",
    has_selected_record: preview?.input_summary.selected_record_found ?? false,
    has_full_record_material:
      preview?.input_summary.selected_full_record_supplied ?? false,
    has_apply_candidates: countLiveApplyMaterial(liveMaterial) > 0,
    has_source_refs: sourceRefs.length > 0,
    has_evidence_refs: evidenceRefs.length > 0,
    has_missing_evidence: missingEvidence.length > 0,
    has_conflicts: countConflicts(preview?.conflict_summary ?? null) > 0,
    has_problem_records:
      (preview?.evidence_summary.problem_record_ids.length ?? 0) > 0,
    all_apply_candidates_evidence_backed:
      preview?.evidence_summary.all_apply_candidates_evidence_backed ?? false,
    no_live_handoff_mutation_confirmed:
      preview?.evidence_summary.no_live_handoff_mutation_confirmed ?? false,
    no_handoff_send_confirmed:
      preview?.evidence_summary.no_handoff_send_confirmed ?? false,
    no_provider_github_codex_confirmed:
      preview?.evidence_summary.no_provider_github_codex_confirmed ?? false,
    authority_boundary_valid: applyPreviewAuthorityBoundaryValid(preview),
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    missing_evidence: missingEvidence,
    problem_record_ids: preview?.evidence_summary.problem_record_ids ?? [],
  };
}

function buildWouldApplyPreview({
  preview,
  liveMaterial,
}: {
  preview: HandoffContextApplyPreview | null;
  liveMaterial: LiveApplyMaterial;
}): HandoffContextApplyOperatorDecisionWouldApplyPreview {
  const liveMaterialCount = countLiveApplyMaterial(liveMaterial);
  const sourceRefs = uniqueSortedStrings([
    ...(preview?.source_refs ?? []),
    ...(preview?.evidence_summary.source_refs ?? []),
  ]);
  const evidenceRefs = uniqueSortedStrings(
    preview?.evidence_summary.evidence_refs ?? [],
  );
  return {
    proposed_record_kind:
      preview && liveMaterialCount > 0
        ? "handoff_context_apply_write_candidate.v0.1"
        : null,
    ...liveMaterial,
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    selected_record_ref: preview?.selected_record_ref ?? null,
    review_summary: buildReviewSummary({ preview, liveMaterialCount }),
  };
}

function buildCandidateCarryForward(
  preview: HandoffContextApplyPreview | null,
): HandoffContextApplyOperatorDecisionCarryForward {
  const conflictSummary = preview?.conflict_summary ?? emptyConflictSummary();
  return {
    keep_unknown_as_review_only: uniqueCandidates(
      preview?.proposed_apply_delta.keep_unknown_as_review_only ?? [],
    ),
    carry_forward_stop_if_missing: uniqueCandidates(
      preview?.proposed_apply_delta.carry_forward_stop_if_missing ?? [],
    ),
    rejected_or_excluded_review_notes: uniqueCandidates(
      preview?.proposed_apply_delta.rejected_or_excluded_review_notes ?? [],
    ),
    duplicate_selected_refs: conflictSummary.duplicate_selected_refs,
    unknown_selected_ref_attempts:
      conflictSummary.unknown_selected_ref_attempts,
    stale_or_noisy_candidates: conflictSummary.stale_or_noisy_candidates,
    missing_evidence_candidates: conflictSummary.missing_evidence_candidates,
    unresolved_blockers: uniqueSortedStrings(preview?.blocked_reasons ?? []),
  };
}

function buildApprovalRequirements(): string[] {
  return [
    "operator confirms this is only a read-only decision preview",
    "operator confirms the selected record ref and full record material",
    "operator confirms no unknown selected refs or duplicate selected-ref add conflicts remain",
    "operator confirms selected-ref apply candidates are evidence backed",
    "operator confirms keep_unknown, stop_if_missing, and rejected material remain review-only carry-forward",
    "operator confirms a later apply write would require a separate scoped approval path",
  ];
}

function buildReviewChecklist(): string[] {
  return [
    "Review selected record ref and full record material before any later apply write scope.",
    "Confirm selected refs to add are not already present in current selected refs.",
    "Confirm selected-ref reinforce candidates are evidence backed.",
    "Keep unknown, stop-if-missing, and rejected/excluded material out of live apply material.",
    "Confirm this decision preview did not mutate live handoff context, send handoffs, write DB rows, or call providers/GitHub/Codex.",
  ];
}

function buildWouldNotApply(): string[] {
  return [
    "does_not_persist_operator_decision",
    "does_not_write_db_rows",
    "does_not_create_schema",
    "does_not_create_records",
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

function buildReviewSummary({
  preview,
  liveMaterialCount,
}: {
  preview: HandoffContextApplyPreview | null;
  liveMaterialCount: number;
}): string {
  if (!preview) return "No Handoff Context Apply Preview was supplied.";
  if (liveMaterialCount === 0) {
    return "No future apply-write candidate material is available.";
  }
  return [
    `${preview.proposed_apply_delta.selected_refs_to_add.length} selected refs to add`,
    `${preview.proposed_apply_delta.selected_refs_to_reinforce.length} selected refs to reinforce`,
    `${preview.proposed_apply_delta.warnings_to_add_or_strengthen.length} warning updates`,
    `${preview.proposed_apply_delta.context_refs_to_deprioritize.length} context refs to deprioritize`,
    `${preview.proposed_apply_delta.context_refs_to_exclude.length} context refs to exclude`,
    `${preview.proposed_apply_delta.expected_return_signal_updates.length} expected-return updates`,
  ].join("; ");
}

function buildSourceRefs({
  preview,
  source_refs,
}: {
  preview: HandoffContextApplyPreview | null;
  source_refs?: string[];
}): string[] {
  return uniqueSortedStrings([
    ...(source_refs ?? []),
    ...(preview?.source_refs ?? []),
    HANDOFF_CONTEXT_APPLY_OPERATOR_DECISION_PREVIEW_VERSION,
  ]);
}

function countLiveApplyMaterial(material: LiveApplyMaterial): number {
  return (
    material.selected_refs_to_add.length +
    material.selected_refs_to_reinforce.length +
    material.warnings_to_add_or_strengthen.length +
    material.context_refs_to_deprioritize.length +
    material.context_refs_to_exclude.length +
    material.expected_return_signal_updates.length
  );
}

function countConflicts(
  conflictSummary: HandoffContextApplyPreviewConflictSummary | null,
): number {
  if (!conflictSummary) return 0;
  return uniqueSortedStrings([
    ...conflictSummary.duplicate_selected_refs,
    ...conflictSummary.unknown_selected_ref_attempts,
    ...conflictSummary.missing_evidence_candidates,
    ...conflictSummary.stale_or_noisy_candidates,
    ...conflictSummary.conflicting_candidate_ids,
  ]).length;
}

function applyPreviewAuthorityBoundaryValid(
  preview: HandoffContextApplyPreview | null,
): boolean {
  if (!preview) return false;
  const boundary = preview.authority_boundary;
  return (
    boundary.read_only_apply_preview === true &&
    boundary.advisory_only === true &&
    boundary.source_of_truth === false &&
    applyPreviewWriteAuthorityAllFalse(preview)
  );
}

function applyPreviewWriteAuthorityAllFalse(
  preview: HandoffContextApplyPreview | null,
): boolean {
  if (!preview) return false;
  const boundary = preview.authority_boundary;
  return applyPreviewFalseAuthorityFields.every(
    (field) => boundary[field] === false,
  );
}

const applyPreviewFalseAuthorityFields = [
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
] satisfies Array<keyof HandoffContextApplyPreviewAuthorityBoundary>;

function emptyConflictSummary(): HandoffContextApplyPreviewConflictSummary {
  return {
    duplicate_selected_refs: [],
    unknown_selected_ref_attempts: [],
    missing_evidence_candidates: [],
    stale_or_noisy_candidates: [],
    conflicting_candidate_ids: [],
    blocked_apply_reasons: [],
  };
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
