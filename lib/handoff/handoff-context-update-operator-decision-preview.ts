import {
  HANDOFF_CONTEXT_UPDATE_PREVIEW_VERSION,
  type HandoffContextUpdateCandidate,
  type HandoffContextUpdatePreview,
} from "@/types/handoff-context-update-preview";
import {
  HANDOFF_CONTEXT_UPDATE_OPERATOR_DECISION_PREVIEW_VERSION,
  type HandoffContextUpdateAvailableOperatorDecision,
  type HandoffContextUpdateOperatorDecisionAuthorityBoundary,
  type HandoffContextUpdateOperatorDecisionCarryForward,
  type HandoffContextUpdateOperatorDecisionEvidenceSummary,
  type HandoffContextUpdateOperatorDecisionPreview,
  type HandoffContextUpdateOperatorDecisionPreviewStatus,
  type HandoffContextUpdateOperatorDecisionSourceStatus,
  type HandoffContextUpdateOperatorDecisionUpdatePreviewRefs,
  type HandoffContextUpdateOperatorDecisionWouldWritePreview,
  type HandoffContextUpdateOperatorDecisionWriteReadiness,
  type HandoffContextUpdateRecommendedOperatorDecision,
} from "@/types/handoff-context-update-operator-decision-preview";

const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;
const DEFAULT_SCOPE = "project:augnes" as const;

const AVAILABLE_OPERATOR_DECISIONS: HandoffContextUpdateAvailableOperatorDecision[] =
  [
    "defer_until_evidence_supplied",
    "defer_until_blockers_resolved",
    "review_for_future_write",
    "approve_for_future_write",
    "keep_preview_only",
    "reject_update_candidate",
  ];

export interface HandoffContextUpdateOperatorDecisionPreviewInput {
  handoff_context_update_preview?: unknown;
  as_of?: string;
  scope?: string;
  source_refs?: string[];
}

export function buildHandoffContextUpdateOperatorDecisionPreviewV01({
  handoff_context_update_preview,
  as_of,
  scope,
  source_refs,
}: HandoffContextUpdateOperatorDecisionPreviewInput): HandoffContextUpdateOperatorDecisionPreview {
  const sourceStatus = getUpdatePreviewSourceStatus(
    handoff_context_update_preview,
  );
  const preview = isHandoffContextUpdatePreview(
    handoff_context_update_preview,
  )
    ? handoff_context_update_preview
    : null;
  const candidateSets = collectCandidateSets(preview);
  const candidateCounts = countCandidateSets(candidateSets);
  const missingEvidence = buildMissingEvidence({
    preview,
    sourceStatus,
    candidateCounts,
    candidateSets,
  });
  const blockingReasons = buildBlockingReasons({
    preview,
    sourceStatus,
    candidateCounts,
    candidateSets,
    missingEvidence,
  });
  const writeReadiness = buildWriteReadiness({
    preview,
    sourceStatus,
    candidateCounts,
    candidateSets,
    blockingReasons,
    missingEvidence,
  });
  const decisionPreviewStatus = determineDecisionPreviewStatus({
    preview,
    sourceStatus,
    writeReadiness,
    blockingReasons,
    missingEvidence,
    candidateCounts,
  });
  const recommendedOperatorDecision = determineRecommendedOperatorDecision({
    decisionPreviewStatus,
    writeReadiness,
    missingEvidence,
    candidateCounts,
  });
  const evidenceSummary = buildEvidenceSummary({
    preview,
    sourceStatus,
    candidateCounts,
    missingEvidence,
  });
  const updatePreviewRefs = buildUpdatePreviewRefs(preview);

  return {
    preview_version: HANDOFF_CONTEXT_UPDATE_OPERATOR_DECISION_PREVIEW_VERSION,
    scope: scope ?? preview?.scope ?? DEFAULT_SCOPE,
    as_of: as_of ?? preview?.as_of ?? FALLBACK_AS_OF,
    source_refs: buildSourceRefs({
      preview,
      source_refs,
    }),
    decision_preview_status: decisionPreviewStatus,
    recommended_operator_decision: recommendedOperatorDecision,
    available_operator_decisions: AVAILABLE_OPERATOR_DECISIONS,
    input_summary: {
      update_preview_ref: preview?.preview_version ?? null,
      update_preview_source_status: sourceStatus,
      update_preview_candidate_status: preview?.candidate_status ?? null,
      selected_ref_add_candidate_count:
        candidateCounts.selectedRefAddCandidateCount,
      selected_ref_reinforcement_candidate_count:
        candidateCounts.selectedRefReinforcementCandidateCount,
      warning_candidate_count: candidateCounts.warningCandidateCount,
      context_diet_candidate_count: candidateCounts.contextDietCandidateCount,
      stop_if_missing_candidate_count:
        candidateCounts.stopIfMissingCandidateCount,
      verification_required_candidate_count:
        candidateCounts.verificationRequiredCandidateCount,
      expected_return_signal_candidate_count:
        candidateCounts.expectedReturnSignalCandidateCount,
      unknown_candidate_count: candidateCounts.unknownCandidateCount,
      total_candidate_count: candidateCounts.totalCandidateCount,
      candidate_material_present: candidateCounts.totalCandidateCount > 0,
      blocking_reason_count: blockingReasons.length,
      missing_evidence_count: missingEvidence.length,
      source_preview_write_flags_all_false:
        sourcePreviewWriteFlagsAllFalse(preview),
    },
    update_preview_refs: updatePreviewRefs,
    source_status: buildSourceStatus({
      preview,
      sourceStatus,
    }),
    write_readiness: writeReadiness,
    approval_requirements: buildApprovalRequirements(),
    blocking_reasons: blockingReasons,
    missing_evidence: missingEvidence,
    evidence_summary: evidenceSummary,
    would_write_preview: buildWouldWritePreview({
      preview,
      candidateSets,
      candidateCounts,
      updatePreviewRefs,
    }),
    would_not_write: buildWouldNotWrite(),
    candidate_carry_forward: buildCandidateCarryForward({
      candidateSets,
      blockingReasons,
      missingEvidence,
    }),
    review_checklist: buildReviewChecklist(preview),
    non_goals: uniqueSortedStrings([
      "no_persisted_operator_decision",
      "no_handoff_context_write",
      "no_selected_ref_write",
      "no_handoff_send",
      "no_upstream_preview_rebuild",
      "no_reuse_ledger_read_or_write",
      "no_memory_or_perspective_mutation",
      "no_provider_github_codex_or_autonomous_action",
      ...(preview?.non_goals ?? []),
    ]),
    authority_boundary:
      createHandoffContextUpdateOperatorDecisionAuthorityBoundaryV01(),
  };
}

export function createHandoffContextUpdateOperatorDecisionAuthorityBoundaryV01(): HandoffContextUpdateOperatorDecisionAuthorityBoundary {
  return {
    read_only: true,
    candidate_material_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_persist_decision: false,
    can_write_db: false,
    can_write_handoff_context: false,
    can_write_selected_refs: false,
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
      "Operator decision preview is read-only candidate material.",
      "It consumes an already-built Handoff Context Update Preview and does not rebuild upstream relay, rationale, metric, dogfood, or ledger objects.",
      "Even when write_readiness.write_ready is true, this preview cannot persist an operator decision or perform a handoff context update.",
    ],
  };
}

type UpdatePreviewSourceStatus = "supplied" | "missing" | "wrong_version";

interface CandidateSets {
  selectedRefAddCandidates: HandoffContextUpdateCandidate[];
  selectedRefReinforcementCandidates: HandoffContextUpdateCandidate[];
  selectedRefReviewCandidates: HandoffContextUpdateCandidate[];
  warningUpdateCandidates: HandoffContextUpdateCandidate[];
  contextDietCandidates: HandoffContextUpdateCandidate[];
  keepUnknownCandidates: HandoffContextUpdateCandidate[];
  stopIfMissingCandidates: HandoffContextUpdateCandidate[];
  verificationRequiredCandidates: HandoffContextUpdateCandidate[];
  missingSourceOrEvidenceBlockers: HandoffContextUpdateCandidate[];
  expectedReturnSignalCandidates: HandoffContextUpdateCandidate[];
}

interface CandidateCounts {
  selectedRefAddCandidateCount: number;
  selectedRefReinforcementCandidateCount: number;
  selectedRefCandidateCount: number;
  warningCandidateCount: number;
  contextDietCandidateCount: number;
  stopIfMissingCandidateCount: number;
  verificationRequiredCandidateCount: number;
  missingSourceOrEvidenceBlockerCount: number;
  expectedReturnSignalCandidateCount: number;
  unknownCandidateCount: number;
  totalCandidateCount: number;
  futureWriteCandidateCount: number;
}

function collectCandidateSets(
  preview: HandoffContextUpdatePreview | null,
): CandidateSets {
  if (!preview) {
    return {
      selectedRefAddCandidates: [],
      selectedRefReinforcementCandidates: [],
      selectedRefReviewCandidates: [],
      warningUpdateCandidates: [],
      contextDietCandidates: [],
      keepUnknownCandidates: [],
      stopIfMissingCandidates: [],
      verificationRequiredCandidates: [],
      missingSourceOrEvidenceBlockers: [],
      expectedReturnSignalCandidates: [],
    };
  }

  return {
    selectedRefAddCandidates: uniqueCandidates(
      preview.proposed_selected_ref_updates.add_selected_ref_candidates,
    ),
    selectedRefReinforcementCandidates: uniqueCandidates(
      preview.proposed_selected_ref_updates.reinforce_selected_ref_candidates,
    ),
    selectedRefReviewCandidates: uniqueCandidates(
      preview.proposed_selected_ref_updates.selected_with_review_only,
    ),
    warningUpdateCandidates: uniqueCandidates([
      ...preview.proposed_warning_updates.add_warning_candidates,
      ...preview.proposed_warning_updates.strengthen_warning_candidates,
      ...preview.proposed_warning_updates.stale_warning_candidates,
      ...preview.proposed_warning_updates.noisy_warning_candidates,
      ...preview.proposed_warning_updates.misleading_warning_candidates,
      ...preview.proposed_warning_updates.unknown_warning_candidates,
    ]),
    contextDietCandidates: uniqueCandidates([
      ...preview.proposed_context_diet_updates.refs_to_deprioritize,
      ...preview.proposed_context_diet_updates.refs_to_exclude_from_handoff,
      ...preview.proposed_context_diet_updates.refs_to_keep_unknown,
    ]),
    keepUnknownCandidates: uniqueCandidates(
      preview.proposed_context_diet_updates.refs_to_keep_unknown,
    ),
    stopIfMissingCandidates: uniqueCandidates([
      ...preview.proposed_stop_if_missing_updates.stop_if_missing_candidates,
      ...preview.proposed_stop_if_missing_updates
        .verification_required_before_handoff,
      ...preview.proposed_stop_if_missing_updates
        .missing_source_or_evidence_blockers,
    ]),
    verificationRequiredCandidates: uniqueCandidates(
      preview.proposed_stop_if_missing_updates
        .verification_required_before_handoff,
    ),
    missingSourceOrEvidenceBlockers: uniqueCandidates(
      preview.proposed_stop_if_missing_updates.missing_source_or_evidence_blockers,
    ),
    expectedReturnSignalCandidates: uniqueCandidates([
      ...preview.proposed_expected_return_signal_updates
        .expected_return_emphasis_candidates,
      ...preview.proposed_expected_return_signal_updates
        .next_handoff_focus_candidates,
      ...preview.proposed_expected_return_signal_updates
        .mismatch_return_signal_candidates,
    ]),
  };
}

function countCandidateSets(candidateSets: CandidateSets): CandidateCounts {
  const selectedRefCandidates = uniqueCandidates([
    ...candidateSets.selectedRefAddCandidates,
    ...candidateSets.selectedRefReinforcementCandidates,
    ...candidateSets.selectedRefReviewCandidates,
  ]);
  const allCandidates = uniqueCandidates([
    ...selectedRefCandidates,
    ...candidateSets.warningUpdateCandidates,
    ...candidateSets.contextDietCandidates,
    ...candidateSets.stopIfMissingCandidates,
    ...candidateSets.expectedReturnSignalCandidates,
  ]);
  const futureWriteCandidates = uniqueCandidates([
    ...candidateSets.selectedRefAddCandidates.filter(
      (candidate) => !isUnknownCandidate(candidate),
    ),
    ...candidateSets.selectedRefReinforcementCandidates.filter(
      (candidate) => !isUnknownCandidate(candidate),
    ),
    ...candidateSets.warningUpdateCandidates,
    ...candidateSets.contextDietCandidates.filter(
      (candidate) => !isUnknownCandidate(candidate),
    ),
  ]);

  return {
    selectedRefAddCandidateCount:
      candidateSets.selectedRefAddCandidates.length,
    selectedRefReinforcementCandidateCount:
      candidateSets.selectedRefReinforcementCandidates.length,
    selectedRefCandidateCount: selectedRefCandidates.length,
    warningCandidateCount: candidateSets.warningUpdateCandidates.length,
    contextDietCandidateCount: candidateSets.contextDietCandidates.length,
    stopIfMissingCandidateCount: candidateSets.stopIfMissingCandidates.length,
    verificationRequiredCandidateCount:
      candidateSets.verificationRequiredCandidates.length,
    missingSourceOrEvidenceBlockerCount:
      candidateSets.missingSourceOrEvidenceBlockers.length,
    expectedReturnSignalCandidateCount:
      candidateSets.expectedReturnSignalCandidates.length,
    unknownCandidateCount: uniqueCandidates([
      ...allCandidates.filter(isUnknownCandidate),
      ...candidateSets.keepUnknownCandidates,
    ]).length,
    totalCandidateCount: allCandidates.length,
    futureWriteCandidateCount: futureWriteCandidates.length,
  };
}

function buildMissingEvidence({
  preview,
  sourceStatus,
  candidateCounts,
  candidateSets,
}: {
  preview: HandoffContextUpdatePreview | null;
  sourceStatus: UpdatePreviewSourceStatus;
  candidateCounts: CandidateCounts;
  candidateSets: CandidateSets;
}): string[] {
  return uniqueSortedStrings([
    ...(sourceStatus === "missing"
      ? ["handoff_context_update_preview_missing"]
      : []),
    ...(sourceStatus === "wrong_version"
      ? ["handoff_context_update_preview_wrong_version"]
      : []),
    ...(preview?.evidence_summary.missing_evidence ?? []),
    ...(preview?.insufficient_data_reasons ?? []),
    ...(candidateCounts.totalCandidateCount === 0 && preview
      ? ["handoff_context_update_candidate_material_missing"]
      : []),
    ...uniqueCandidates([
      ...candidateSets.selectedRefAddCandidates,
      ...candidateSets.selectedRefReinforcementCandidates,
      ...candidateSets.selectedRefReviewCandidates,
    ])
      .filter((candidate) => candidate.evidence_refs.length === 0)
      .map(
        (candidate) =>
          `selected_ref_candidate_missing_evidence:${candidate.candidate_id}`,
      ),
  ]);
}

function buildBlockingReasons({
  preview,
  sourceStatus,
  candidateCounts,
  candidateSets,
  missingEvidence,
}: {
  preview: HandoffContextUpdatePreview | null;
  sourceStatus: UpdatePreviewSourceStatus;
  candidateCounts: CandidateCounts;
  candidateSets: CandidateSets;
  missingEvidence: string[];
}): string[] {
  const selectedRefCandidates = uniqueCandidates([
    ...candidateSets.selectedRefAddCandidates,
    ...candidateSets.selectedRefReinforcementCandidates,
    ...candidateSets.selectedRefReviewCandidates,
  ]);

  return uniqueSortedStrings([
    ...(sourceStatus === "missing"
      ? ["blocked_missing_handoff_context_update_preview"]
      : []),
    ...(sourceStatus === "wrong_version"
      ? ["blocked_wrong_handoff_context_update_preview_version"]
      : []),
    ...(preview?.candidate_status === "insufficient_data"
      ? ["blocked_update_preview_insufficient_data"]
      : []),
    ...(candidateCounts.totalCandidateCount === 0 && preview
      ? ["blocked_handoff_context_update_candidate_material_missing"]
      : []),
    ...(candidateSets.stopIfMissingCandidates.length > 0
      ? ["blocked_unresolved_stop_if_missing_candidates"]
      : []),
    ...(candidateSets.verificationRequiredCandidates.length > 0
      ? ["blocked_verification_required_before_handoff"]
      : []),
    ...(candidateSets.missingSourceOrEvidenceBlockers.length > 0
      ? ["blocked_missing_source_or_evidence_candidates"]
      : []),
    ...(selectedRefCandidates.some((candidate) => candidate.evidence_refs.length === 0)
      ? ["blocked_selected_ref_candidate_missing_evidence"]
      : []),
    ...(selectedRefCandidates.some(isUnknownCandidate)
      ? ["blocked_selected_ref_candidate_unknown_context"]
      : []),
    ...(candidateCounts.unknownCandidateCount > 0
      ? ["blocked_unknown_context_requires_operator_review"]
      : []),
    ...(!sourceAuthorityBoundaryIsValid(preview)
      ? ["blocked_source_preview_authority_boundary_invalid"]
      : []),
    ...(!sourcePreviewWriteFlagsAllFalse(preview)
      ? ["blocked_source_preview_write_readiness_not_false"]
      : []),
    ...missingEvidence.filter((reason) =>
      reason.includes("candidate_material_missing"),
    ),
    ...(preview?.blocked_reasons ?? []),
  ]);
}

function buildWriteReadiness({
  preview,
  sourceStatus,
  candidateCounts,
  candidateSets,
  blockingReasons,
  missingEvidence,
}: {
  preview: HandoffContextUpdatePreview | null;
  sourceStatus: UpdatePreviewSourceStatus;
  candidateCounts: CandidateCounts;
  candidateSets: CandidateSets;
  blockingReasons: string[];
  missingEvidence: string[];
}): HandoffContextUpdateOperatorDecisionWriteReadiness {
  const writeReady =
    Boolean(preview) &&
    sourceStatus === "supplied" &&
    preview?.candidate_status !== "insufficient_data" &&
    candidateCounts.totalCandidateCount > 0 &&
    candidateCounts.futureWriteCandidateCount > 0 &&
    blockingReasons.length === 0 &&
    missingEvidence.length === 0 &&
    candidateSets.stopIfMissingCandidates.length === 0 &&
    candidateSets.verificationRequiredCandidates.length === 0 &&
    candidateSets.missingSourceOrEvidenceBlockers.length === 0 &&
    sourceAuthorityBoundaryIsValid(preview) &&
    sourcePreviewWriteFlagsAllFalse(preview);

  return {
    write_ready: writeReady,
    readiness_label: buildReadinessLabel({
      preview,
      sourceStatus,
      writeReady,
      candidateCounts,
      blockingReasons,
      missingEvidence,
    }),
    requires_valid_update_preview: true,
    requires_candidate_material: true,
    requires_no_blockers: true,
    requires_no_missing_evidence: true,
    requires_no_unresolved_stop_or_verification: true,
    requires_selected_refs_evidence_backed: true,
    requires_selected_refs_not_unknown: true,
    requires_read_only_source_preview: true,
    requires_source_preview_no_write_performed: true,
    requires_operator_confirmation: true,
    current_blockers: blockingReasons,
    current_missing_evidence: missingEvidence,
  };
}

function buildReadinessLabel({
  preview,
  sourceStatus,
  writeReady,
  candidateCounts,
  blockingReasons,
  missingEvidence,
}: {
  preview: HandoffContextUpdatePreview | null;
  sourceStatus: UpdatePreviewSourceStatus;
  writeReady: boolean;
  candidateCounts: CandidateCounts;
  blockingReasons: string[];
  missingEvidence: string[];
}): string {
  if (!preview) return "blocked: handoff context update preview missing";
  if (sourceStatus === "wrong_version") {
    return "blocked: handoff context update preview version is not supported";
  }
  if (preview.candidate_status === "insufficient_data") {
    return "insufficient data: source update preview is insufficient";
  }
  if (candidateCounts.totalCandidateCount === 0) {
    return "insufficient data: no update candidate material is present";
  }
  if (missingEvidence.length > 0) {
    return "blocked: missing evidence or insufficient-data reasons remain";
  }
  if (blockingReasons.length > 0) {
    return "blocked: unresolved update preview blockers remain";
  }
  if (candidateCounts.futureWriteCandidateCount === 0) {
    return "ready for operator review; material is not future-write-ready yet";
  }
  if (writeReady) {
    return "ready for future write preparation; this preview still cannot write";
  }
  return "ready for operator review before any future write";
}

function determineDecisionPreviewStatus({
  preview,
  sourceStatus,
  writeReadiness,
  blockingReasons,
  missingEvidence,
  candidateCounts,
}: {
  preview: HandoffContextUpdatePreview | null;
  sourceStatus: UpdatePreviewSourceStatus;
  writeReadiness: HandoffContextUpdateOperatorDecisionWriteReadiness;
  blockingReasons: string[];
  missingEvidence: string[];
  candidateCounts: CandidateCounts;
}): HandoffContextUpdateOperatorDecisionPreviewStatus {
  if (!preview || sourceStatus !== "supplied") return "insufficient_data";
  if (preview.candidate_status === "insufficient_data") {
    return "insufficient_data";
  }
  if (candidateCounts.totalCandidateCount === 0) return "insufficient_data";
  if (blockingReasons.length > 0 || missingEvidence.length > 0) {
    return "blocked";
  }
  if (writeReadiness.write_ready) return "ready_for_future_write";
  return "ready_for_operator_review";
}

function determineRecommendedOperatorDecision({
  decisionPreviewStatus,
  writeReadiness,
  missingEvidence,
  candidateCounts,
}: {
  decisionPreviewStatus: HandoffContextUpdateOperatorDecisionPreviewStatus;
  writeReadiness: HandoffContextUpdateOperatorDecisionWriteReadiness;
  missingEvidence: string[];
  candidateCounts: CandidateCounts;
}): HandoffContextUpdateRecommendedOperatorDecision {
  if (writeReadiness.write_ready) return "approve_for_future_write";
  if (decisionPreviewStatus === "insufficient_data") {
    return missingEvidence.length > 0
      ? "defer_until_evidence_supplied"
      : "keep_preview_only";
  }
  if (decisionPreviewStatus === "blocked") {
    return "defer_until_blockers_resolved";
  }
  if (
    decisionPreviewStatus === "ready_for_operator_review" &&
    candidateCounts.totalCandidateCount > 0
  ) {
    return "review_for_future_write";
  }
  return "keep_preview_only";
}

function buildEvidenceSummary({
  preview,
  sourceStatus,
  candidateCounts,
  missingEvidence,
}: {
  preview: HandoffContextUpdatePreview | null;
  sourceStatus: UpdatePreviewSourceStatus;
  candidateCounts: CandidateCounts;
  missingEvidence: string[];
}): HandoffContextUpdateOperatorDecisionEvidenceSummary {
  return {
    has_update_preview: Boolean(preview),
    update_preview_version_valid: sourceStatus === "supplied",
    has_candidate_material: candidateCounts.totalCandidateCount > 0,
    has_selected_ref_signal: candidateCounts.selectedRefCandidateCount > 0,
    has_warning_signal: candidateCounts.warningCandidateCount > 0,
    has_context_diet_signal: candidateCounts.contextDietCandidateCount > 0,
    has_stop_if_missing_signal: candidateCounts.stopIfMissingCandidateCount > 0,
    has_expected_return_signal:
      candidateCounts.expectedReturnSignalCandidateCount > 0,
    has_unknown_signal: candidateCounts.unknownCandidateCount > 0,
    has_missing_evidence: missingEvidence.length > 0,
    has_insufficient_data:
      !preview ||
      sourceStatus !== "supplied" ||
      preview.candidate_status === "insufficient_data" ||
      preview.evidence_summary.has_insufficient_data ||
      missingEvidence.length > 0,
    source_authority_boundary_valid: sourceAuthorityBoundaryIsValid(preview),
    source_write_readiness_false: sourcePreviewWriteFlagsAllFalse(preview),
    evidence_refs: uniqueSortedStrings(preview?.evidence_summary.evidence_refs ?? []),
    missing_evidence: missingEvidence,
  };
}

function buildWouldWritePreview({
  preview,
  candidateSets,
  candidateCounts,
  updatePreviewRefs,
}: {
  preview: HandoffContextUpdatePreview | null;
  candidateSets: CandidateSets;
  candidateCounts: CandidateCounts;
  updatePreviewRefs: HandoffContextUpdateOperatorDecisionUpdatePreviewRefs;
}): HandoffContextUpdateOperatorDecisionWouldWritePreview {
  const hasMaterial = candidateCounts.totalCandidateCount > 0;
  const selectedRefAddCandidates = candidateSets.selectedRefAddCandidates.filter(
    (candidate) => !isUnknownCandidate(candidate),
  );
  const selectedRefReinforcementCandidates =
    candidateSets.selectedRefReinforcementCandidates.filter(
      (candidate) => !isUnknownCandidate(candidate),
    );
  const keepUnknownCandidates = uniqueCandidates([
    ...candidateSets.keepUnknownCandidates,
    ...unknownSelectedRefCandidates(candidateSets),
  ]);

  return {
    proposed_record_kind:
      preview && hasMaterial
        ? "handoff_context_update_write_candidate.v0.1"
        : null,
    selected_ref_add_candidates: selectedRefAddCandidates,
    selected_ref_reinforcement_candidates:
      selectedRefReinforcementCandidates,
    warning_update_candidates: candidateSets.warningUpdateCandidates,
    context_diet_candidates: candidateSets.contextDietCandidates,
    keep_unknown_candidates: keepUnknownCandidates,
    stop_if_missing_candidates: candidateSets.stopIfMissingCandidates,
    expected_return_signal_candidates:
      candidateSets.expectedReturnSignalCandidates,
    source_refs: updatePreviewRefs.source_refs,
    evidence_refs: updatePreviewRefs.evidence_refs,
    update_preview_ref: updatePreviewRefs.update_preview_ref,
    review_summary: buildReviewSummary({ preview, candidateCounts }),
  };
}

function buildReviewSummary({
  preview,
  candidateCounts,
}: {
  preview: HandoffContextUpdatePreview | null;
  candidateCounts: CandidateCounts;
}): string {
  if (!preview) {
    return "No handoff context update preview was supplied.";
  }
  if (candidateCounts.totalCandidateCount === 0) {
    return "No handoff context update candidate material was supplied.";
  }
  return [
    `${candidateCounts.selectedRefCandidateCount} selected-ref candidates`,
    `${candidateCounts.warningCandidateCount} warning candidates`,
    `${candidateCounts.contextDietCandidateCount} context-diet candidates`,
    `${candidateCounts.stopIfMissingCandidateCount} stop-if-missing candidates`,
    `${candidateCounts.expectedReturnSignalCandidateCount} expected-return candidates`,
    `${candidateCounts.unknownCandidateCount} unknown-context candidates`,
  ].join("; ");
}

function buildCandidateCarryForward({
  candidateSets,
  blockingReasons,
  missingEvidence,
}: {
  candidateSets: CandidateSets;
  blockingReasons: string[];
  missingEvidence: string[];
}): HandoffContextUpdateOperatorDecisionCarryForward {
  return {
    selected_ref_update_candidates: uniqueCandidates([
      ...candidateSets.selectedRefAddCandidates.filter(
        (candidate) => !isUnknownCandidate(candidate),
      ),
      ...candidateSets.selectedRefReinforcementCandidates.filter(
        (candidate) => !isUnknownCandidate(candidate),
      ),
      ...candidateSets.selectedRefReviewCandidates.filter(
        (candidate) => !isUnknownCandidate(candidate),
      ),
    ]),
    warning_update_candidates: candidateSets.warningUpdateCandidates,
    context_diet_candidates: candidateSets.contextDietCandidates,
    keep_unknown_candidates: uniqueCandidates([
      ...candidateSets.keepUnknownCandidates,
      ...unknownSelectedRefCandidates(candidateSets),
    ]),
    stop_if_missing_candidates: candidateSets.stopIfMissingCandidates,
    expected_return_signal_candidates:
      candidateSets.expectedReturnSignalCandidates,
    unresolved_blockers: blockingReasons,
    missing_evidence: missingEvidence,
  };
}

function unknownSelectedRefCandidates(
  candidateSets: CandidateSets,
): HandoffContextUpdateCandidate[] {
  return uniqueCandidates([
    ...candidateSets.selectedRefAddCandidates,
    ...candidateSets.selectedRefReinforcementCandidates,
    ...candidateSets.selectedRefReviewCandidates,
  ].filter(isUnknownCandidate));
}

function buildUpdatePreviewRefs(
  preview: HandoffContextUpdatePreview | null,
): HandoffContextUpdateOperatorDecisionUpdatePreviewRefs {
  return {
    update_preview_ref: preview
      ? `handoff_context_update_preview:${preview.preview_version}:${preview.as_of}`
      : null,
    update_preview_version: preview?.preview_version ?? null,
    update_preview_candidate_status: preview?.candidate_status ?? null,
    source_refs: uniqueSortedStrings(preview?.source_refs ?? []),
    evidence_refs: uniqueSortedStrings(preview?.evidence_summary.evidence_refs ?? []),
  };
}

function buildSourceStatus({
  preview,
  sourceStatus,
}: {
  preview: HandoffContextUpdatePreview | null;
  sourceStatus: UpdatePreviewSourceStatus;
}): HandoffContextUpdateOperatorDecisionSourceStatus {
  return {
    handoff_context_update_preview: sourceStatus,
    candidate_status: preview?.candidate_status ?? null,
    authority_boundary: sourceAuthorityBoundaryIsValid(preview)
      ? "valid_read_only"
      : preview
        ? "invalid"
        : "missing",
    source_write_readiness: sourcePreviewWriteFlagsAllFalse(preview)
      ? "all_false"
      : preview
        ? "unexpected_write_ready"
        : "missing",
  };
}

function buildApprovalRequirements(): string[] {
  return [
    "Handoff Context Update Preview is supplied and version-valid.",
    "Candidate material exists and is evidence-backed where selected refs are proposed.",
    "Unknown refs remain unknown and are not selected into handoff context.",
    "Stop-if-missing and verification-required candidates are resolved before any future write.",
    "Missing evidence and insufficient-data reasons are resolved before any future write.",
    "Source preview remains read-only, candidate-only, and not source of truth.",
    "Source preview write-readiness flags remain false, proving it did not write.",
    "Operator explicitly approves a separately scoped future write path.",
  ];
}

function buildReviewChecklist(
  preview: HandoffContextUpdatePreview | null,
): string[] {
  return uniqueSortedStrings([
    "Confirm this preview is not a persisted operator decision.",
    "Confirm would_write_preview candidate material matches the Handoff Context Update Preview under review.",
    "Confirm selected-ref candidates are evidence-backed and not unknown.",
    "Confirm context-diet-only, warning-only, and expected-return-only material is treated as review material rather than missing data.",
    "Confirm blockers and missing evidence are resolved before any later write path.",
    "Confirm no handoff context write or handoff send is performed by this preview.",
    ...buildApprovalRequirements(),
    ...(preview?.operator_review_checklist ?? []),
  ]);
}

function buildWouldNotWrite(): string[] {
  return [
    "persist an operator decision",
    "write DB rows",
    "mutate handoff context",
    "update selected refs",
    "send handoffs",
    "write continuity relay",
    "mutate CWP, PerspectiveUnit, NextWorkBias, memory, metrics, ledger, promotion decisions, or Formation Receipts",
    "call provider/OpenAI, GitHub, or Codex",
    "create PRs or merge",
    "run autonomous action",
    "create graph/vector/RAG/crawler/browser observer",
  ];
}

function buildSourceRefs({
  preview,
  source_refs,
}: {
  preview: HandoffContextUpdatePreview | null;
  source_refs?: string[];
}): string[] {
  return uniqueSortedStrings([
    HANDOFF_CONTEXT_UPDATE_OPERATOR_DECISION_PREVIEW_VERSION,
    HANDOFF_CONTEXT_UPDATE_PREVIEW_VERSION,
    ...(source_refs ?? []),
    ...(preview?.source_refs ?? []),
    ...(preview
      ? [`handoff_context_update_preview:${preview.preview_version}:${preview.as_of}`]
      : ["missing_handoff_context_update_preview"]),
  ]);
}

function sourceAuthorityBoundaryIsValid(
  preview: HandoffContextUpdatePreview | null,
): boolean {
  if (!preview) return false;
  const boundary = preview.authority_boundary;
  return (
    boundary.read_only === true &&
    boundary.candidate_material_only === true &&
    boundary.source_of_truth === false &&
    boundary.derived_read_model === true &&
    boundary.can_write_db === false &&
    boundary.can_write_handoff_context === false &&
    boundary.can_send_handoff === false &&
    boundary.can_write_selected_refs === false
  );
}

function sourcePreviewWriteFlagsAllFalse(
  preview: HandoffContextUpdatePreview | null,
): boolean {
  if (!preview) return false;
  return (
    preview.write_readiness.ready_for_handoff_context_write === false &&
    preview.write_readiness.ready_for_handoff_send === false &&
    preview.write_readiness.ready_for_selected_ref_update_write === false
  );
}

function getUpdatePreviewSourceStatus(
  value: unknown,
): UpdatePreviewSourceStatus {
  if (!value) return "missing";
  return isHandoffContextUpdatePreview(value) ? "supplied" : "wrong_version";
}

function isHandoffContextUpdatePreview(
  value: unknown,
): value is HandoffContextUpdatePreview {
  return (
    isRecord(value) &&
    value.preview_version === HANDOFF_CONTEXT_UPDATE_PREVIEW_VERSION
  );
}

function isUnknownCandidate(candidate: HandoffContextUpdateCandidate): boolean {
  return (
    candidate.source_bucket === "unknown" ||
    candidate.candidate_kind === "unknown_context" ||
    /\bunknown\b|unknown[-_:]/i.test(candidate.ref_id) ||
    /\bunknown\b|unknown[-_:]/i.test(candidate.label)
  );
}

function uniqueCandidates(
  candidates: readonly HandoffContextUpdateCandidate[],
): HandoffContextUpdateCandidate[] {
  const seen = new Set<string>();
  const unique: HandoffContextUpdateCandidate[] = [];
  for (const candidate of candidates) {
    const key = `${candidate.candidate_id}:${candidate.ref_id}:${candidate.candidate_kind}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({
      ...candidate,
      source_refs: uniqueSortedStrings(candidate.source_refs),
      evidence_refs: uniqueSortedStrings(candidate.evidence_refs),
      source_record_refs: uniqueSortedStrings(candidate.source_record_refs),
      existing_handoff_ref_ids: uniqueSortedStrings(
        candidate.existing_handoff_ref_ids,
      ),
    });
  }
  return unique;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function uniqueSortedStrings(values: readonly string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  ).sort();
}
