import type {
  ApprovedHandoffContextUpdateRecordReview,
  ApprovedHandoffContextUpdateRecordSummary,
} from "@/types/handoff-context-update-record-review";
import type {
  OperatorApprovedHandoffContextUpdateRecord,
} from "@/types/handoff-context-update-write";
import {
  OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_SCOPE,
  OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_RECORD_VERSION,
} from "@/types/handoff-context-update-write";
import type { HandoffContextUpdateCandidate } from "@/types/handoff-context-update-preview";
import type { HandoffContextRelayRationale } from "@/types/handoff-context-relay-rationale";
import {
  HANDOFF_CONTEXT_APPLY_PREVIEW_VERSION,
  type HandoffContextApplyPreview,
  type HandoffContextApplyPreviewAuthorityBoundary,
  type HandoffContextApplyPreviewCandidate,
  type HandoffContextApplyPreviewCandidateKind,
  type HandoffContextApplyPreviewConflictSummary,
  type HandoffContextApplyPreviewDelta,
  type HandoffContextApplyPreviewEvidenceSummary,
  type HandoffContextApplyPreviewInput,
  type HandoffContextApplyPreviewStatus,
} from "@/types/handoff-context-apply-preview";

const applyPreviewNonGoals = [
  "Do not mutate live handoff context.",
  "Do not write selected refs to an active handoff packet.",
  "Do not send handoffs.",
  "Do not create records, schema, DB rows, routes, or write helpers.",
  "Do not call providers, GitHub, Codex, or autonomous product actions.",
] as const;

export function buildHandoffContextApplyPreviewV01(
  input: HandoffContextApplyPreviewInput = {},
): HandoffContextApplyPreview {
  const recordReview = input.record_review ?? null;
  const selectedRecordLike = input.selected_record ?? null;
  const selectedRecordInputRef = operatorApprovedRecordRef(selectedRecordLike);
  const selectedRecordCandidate = isFullOperatorApprovedRecordMaterial(selectedRecordLike)
    ? selectedRecordLike
    : null;
  const selectedRecordMaterialProblems = selectedRecordLike
    ? fullRecordMaterialProblems(selectedRecordLike)
    : [];
  const selectedRecordCompatibilityProblems = selectedRecordInputRef
    ? selectedRecordReviewCompatibilityProblems(
        recordReview,
        selectedRecordInputRef,
      )
    : [];
  const selectedRecord =
    selectedRecordCandidate &&
    recordReview &&
    selectedRecordCompatibilityProblems.length === 0
      ? selectedRecordCandidate
      : null;
  const scope =
    input.scope ?? recordReview?.scope ?? OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_SCOPE;
  const asOf = input.as_of ?? recordReview?.as_of ?? new Date(0).toISOString();
  const currentContext = input.current_handoff_context_rationale ?? null;
  const currentSelectedRefs = currentSelectedRefsFromInput({
    inputRefs: input.current_selected_refs,
    currentContext,
  });
  const currentSelectedRefSet = new Set(currentSelectedRefs);
  const selectedSummary = selectRecordSummary(recordReview, selectedRecordLike);
  const selectedRecordRef =
    selectedSummary?.record_id ??
    recordReview?.input_summary.selected_record_id ??
    selectedRecordInputRef ??
    null;
  const selectedRecordFound =
    Boolean(selectedRecord) ||
    Boolean(selectedSummary);
  const selectedFullRecordSupplied = Boolean(selectedRecord);
  const reviewProblemRecordIds =
    recordReview?.evidence_summary.problem_record_ids ?? [];
  const sourceRefs = uniqueSortedStrings([
    ...(input.source_refs ?? []),
    ...(recordReview?.source_refs ?? []),
    ...(selectedRecord?.source_refs ?? []),
    ...(selectedRecord?.decision_preview_refs.source_refs ?? []),
    ...(selectedRecord?.update_preview_refs.source_refs ?? []),
    ...currentContextSourceRefs(currentContext),
    HANDOFF_CONTEXT_APPLY_PREVIEW_VERSION,
  ]);

  const blockedReasons = uniqueSortedStrings([
    ...reviewProblemRecordIds.map(
      (recordId) => `record_review_problem_record:${recordId}`,
    ),
    ...selectedRecordCompatibilityProblems,
    ...(selectedRecord?.carry_forward_material.unresolved_blockers ?? []),
  ]);
  const insufficientDataReasons: string[] = [];

  if (!recordReview) {
    insufficientDataReasons.push("record_review_missing");
  }
  if (recordReview?.review_status === "no_records") {
    insufficientDataReasons.push("no_operator_approved_records_available");
  }
  if (
    recordReview?.input_summary.selected_record_id &&
    !recordReview.input_summary.selected_record_found &&
    !selectedRecord
  ) {
    insufficientDataReasons.push("selected_record_not_found");
  }
  if (recordReview && !selectedRecordFound) {
    insufficientDataReasons.push("selected_record_summary_missing");
  }
  if (selectedRecordFound && !selectedFullRecordSupplied) {
    insufficientDataReasons.push("no_apply_material");
    insufficientDataReasons.push("selected_full_record_material_missing");
    insufficientDataReasons.push(...selectedRecordMaterialProblems);
  }

  const delta = emptyDelta();
  const conflictSummary: HandoffContextApplyPreviewConflictSummary = {
    duplicate_selected_refs: [],
    unknown_selected_ref_attempts: [],
    missing_evidence_candidates: [],
    stale_or_noisy_candidates: [],
    conflicting_candidate_ids: [],
    blocked_apply_reasons: [],
  };
  const missingEvidence = [...(recordReview?.evidence_summary.missing_evidence ?? [])];

  if (selectedRecord) {
    mapSelectedCandidates({
      candidates: selectedRecord.approved_candidate_material
        .selected_ref_add_candidates,
      kind: "selected_ref_add",
      target: delta.selected_refs_to_add,
      selectedRecord,
      currentSelectedRefSet,
      conflictSummary,
      blockedReasons,
      missingEvidence,
    });
    mapSelectedCandidates({
      candidates: selectedRecord.approved_candidate_material
        .selected_ref_reinforcement_candidates,
      kind: "selected_ref_reinforce",
      target: delta.selected_refs_to_reinforce,
      selectedRecord,
      currentSelectedRefSet,
      conflictSummary,
      blockedReasons,
      missingEvidence,
    });
    delta.warnings_to_add_or_strengthen.push(
      ...selectedRecord.approved_candidate_material.warning_update_candidates.map(
        (candidate) =>
          toApplyCandidate({
            candidate,
            kind: warningKind(candidate),
            selectedRecord,
            reviewNote:
              "Warning material is previewed only and is not applied to live handoff context.",
          }),
      ),
    );
    for (const candidate of selectedRecord.approved_candidate_material
      .context_diet_candidates) {
      const mapped = toApplyCandidate({
        candidate,
        kind: contextDietKind(candidate),
        selectedRecord,
        reviewNote:
          "Context diet material is previewed only and is not removed from a live packet.",
      });
      staleOrNoisyCandidateIds(candidate).forEach((id) =>
        conflictSummary.stale_or_noisy_candidates.push(id),
      );
      if (mapped.candidate_kind === "context_exclude") {
        delta.context_refs_to_exclude.push(mapped);
      } else {
        delta.context_refs_to_deprioritize.push(mapped);
      }
    }
    delta.keep_unknown_as_review_only.push(
      ...selectedRecord.approved_candidate_material.keep_unknown_candidates.map(
        (candidate) =>
          toApplyCandidate({
            candidate,
            kind: "keep_unknown",
            selectedRecord,
            reviewNote:
              "Unknown refs remain review-only and are not selected into a handoff packet.",
          }),
      ),
    );
    delta.expected_return_signal_updates.push(
      ...selectedRecord.approved_candidate_material
        .expected_return_signal_candidates.map((candidate) =>
          toApplyCandidate({
            candidate,
            kind: "expected_return_update",
            selectedRecord,
            reviewNote:
              "Expected return signal material is previewed only and does not mutate live context.",
          }),
        ),
    );
    delta.carry_forward_stop_if_missing.push(
      ...selectedRecord.carry_forward_material.stop_if_missing_candidates.map(
        (candidate) =>
          toApplyCandidate({
            candidate,
            kind: "stop_if_missing_carry_forward",
            selectedRecord,
            reviewNote:
              "Stop-if-missing material stays carry-forward review material.",
          }),
      ),
    );
    delta.rejected_or_excluded_review_notes.push(
      ...selectedRecord.carry_forward_material.rejected_or_excluded_candidates.map(
        (candidate) =>
          toApplyCandidate({
            candidate,
            kind: "rejected_or_excluded_review_note",
            selectedRecord,
            reviewNote:
              "Rejected or excluded material is review-only and is not applied.",
          }),
      ),
    );
    missingEvidence.push(...selectedRecord.carry_forward_material.missing_evidence);
    if (
      selectedApplyCandidateCount(delta) > 0 &&
      !currentContext &&
      currentSelectedRefs.length === 0
    ) {
      insufficientDataReasons.push("current_handoff_context_missing");
    }
  }

  conflictSummary.duplicate_selected_refs = uniqueSortedStrings(
    conflictSummary.duplicate_selected_refs,
  );
  conflictSummary.unknown_selected_ref_attempts = uniqueSortedStrings(
    conflictSummary.unknown_selected_ref_attempts,
  );
  conflictSummary.missing_evidence_candidates = uniqueSortedStrings(
    conflictSummary.missing_evidence_candidates,
  );
  conflictSummary.stale_or_noisy_candidates = uniqueSortedStrings(
    conflictSummary.stale_or_noisy_candidates,
  );
  conflictSummary.conflicting_candidate_ids = uniqueSortedStrings([
    ...conflictSummary.conflicting_candidate_ids,
    ...conflictSummary.duplicate_selected_refs,
    ...conflictSummary.unknown_selected_ref_attempts,
    ...conflictSummary.missing_evidence_candidates,
  ]);
  conflictSummary.blocked_apply_reasons = uniqueSortedStrings(blockedReasons);

  const applyCandidateCount = allDeltaCandidates(delta).length;
  if (selectedFullRecordSupplied && applyCandidateCount === 0) {
    insufficientDataReasons.push("no_apply_candidates");
  }
  const evidenceSummary = buildEvidenceSummary({
    recordReview,
    selectedRecord,
    delta,
    sourceRefs,
    missingEvidence,
    missingEvidenceCandidateIds: conflictSummary.missing_evidence_candidates,
  });
  const finalBlockedReasons = uniqueSortedStrings([
    ...blockedReasons,
    ...conflictSummary.blocked_apply_reasons,
  ]);
  const finalInsufficientDataReasons = uniqueSortedStrings(insufficientDataReasons);
  const previewStatus = determinePreviewStatus({
    recordReview,
    selectedRecordFound,
    selectedFullRecordSupplied,
    applyCandidateCount,
    blockedReasons: finalBlockedReasons,
    insufficientDataReasons: finalInsufficientDataReasons,
    hasNeedsReviewMaterial:
      delta.keep_unknown_as_review_only.length > 0 ||
      delta.carry_forward_stop_if_missing.length > 0 ||
      delta.rejected_or_excluded_review_notes.length > 0,
  });

  return {
    preview_version: HANDOFF_CONTEXT_APPLY_PREVIEW_VERSION,
    scope,
    as_of: asOf,
    source_refs: evidenceSummary.source_refs,
    preview_status: previewStatus,
    input_summary: {
      has_record_review: Boolean(recordReview),
      review_status: recordReview?.review_status ?? null,
      selected_record_id: selectedRecordRef,
      selected_record_found: selectedRecordFound,
      selected_full_record_supplied: selectedFullRecordSupplied,
      current_handoff_context_supplied: Boolean(currentContext),
      current_selected_ref_count: currentSelectedRefs.length,
      approved_record_count: recordReview?.input_summary.valid_record_count ?? 0,
      apply_candidate_count: applyCandidateCount,
      blocked_reason_count: finalBlockedReasons.length,
      insufficient_data_reason_count: finalInsufficientDataReasons.length,
    },
    selected_record_ref: selectedRecordRef,
    current_context_summary: {
      current_selected_ref_count: currentSelectedRefs.length,
      current_warning_count: currentContext?.stale_or_gap_warnings.length ?? 0,
      current_stop_if_missing_count: currentContext?.stop_if_missing.length ?? 0,
      current_expected_return_signal_count: currentExpectedReturnSignalCount(
        currentContext,
      ),
      source_refs: currentContextSourceRefs(currentContext),
    },
    proposed_apply_delta: delta,
    conflict_summary: conflictSummary,
    evidence_summary: evidenceSummary,
    operator_review_checklist: [
      "Confirm the selected record id and full record material before any later apply slice.",
      "Review selected-ref add and reinforce candidates for duplicate refs and evidence.",
      "Keep unknown refs, context diet, stop-if-missing, and rejected material review-only.",
      "Confirm this preview did not mutate live handoff context, write selected refs, or send a handoff.",
    ],
    blocked_reasons: finalBlockedReasons,
    insufficient_data_reasons: finalInsufficientDataReasons,
    non_goals: [...applyPreviewNonGoals],
    authority_boundary: createHandoffContextApplyPreviewAuthorityBoundaryV01(),
  };
}

export function createHandoffContextApplyPreviewAuthorityBoundaryV01(): HandoffContextApplyPreviewAuthorityBoundary {
  return {
    read_only_apply_preview: true,
    advisory_only: true,
    source_of_truth: false,
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
      "Apply preview is advisory and cannot write or mutate live handoff state.",
      "The builder consumes supplied objects only; it does not open DB handles, fetch, call routes, or call providers.",
    ],
  };
}

function selectRecordSummary(
  recordReview: ApprovedHandoffContextUpdateRecordReview | null,
  selectedRecord: unknown,
): ApprovedHandoffContextUpdateRecordSummary | null {
  if (!recordReview) return null;
  if (recordReview.selected_record_summary) return recordReview.selected_record_summary;
  if (recordReview.input_summary.selected_record_id) {
    if (!recordReview.input_summary.selected_record_found) return null;
    return (
      recordReview.record_summaries.find(
        (summary) =>
          summary.record_id === recordReview.input_summary.selected_record_id &&
          summary.problem_reasons.length === 0,
      ) ?? null
    );
  }
  const selectedRecordId = operatorApprovedRecordRef(selectedRecord);
  if (selectedRecordId) {
    return (
      recordReview.record_summaries.find(
        (summary) =>
          summary.record_id === selectedRecordId &&
          summary.problem_reasons.length === 0,
      ) ?? null
    );
  }
  return (
    recordReview.record_summaries.find(
      (summary) => summary.problem_reasons.length === 0,
    ) ?? null
  );
}

function selectedRecordReviewCompatibilityProblems(
  recordReview: ApprovedHandoffContextUpdateRecordReview | null,
  selectedRecordId: string,
): string[] {
  if (!recordReview) return [];
  const reasons: string[] = [];
  const reviewSelectedId = recordReview.input_summary.selected_record_id;
  if (reviewSelectedId) {
    if (selectedRecordId !== reviewSelectedId) {
      reasons.push("selected_record_mismatch_with_review_selection");
    }
    if (!recordReview.input_summary.selected_record_found) {
      reasons.push("selected_record_not_in_review");
    }
  }
  const selectedSummaryId = recordReview.selected_record_summary?.record_id ?? null;
  if (selectedSummaryId && selectedRecordId !== selectedSummaryId) {
    reasons.push("selected_record_mismatch_with_review_selection");
  }
  if (
    !reviewSelectedId &&
    !selectedSummaryId &&
    !recordReview.record_summaries.some(
      (summary) =>
        summary.record_id === selectedRecordId &&
        summary.problem_reasons.length === 0,
    )
  ) {
    reasons.push("selected_record_not_in_review");
  }
  return uniqueSortedStrings(reasons);
}

function determinePreviewStatus({
  recordReview,
  selectedRecordFound,
  selectedFullRecordSupplied,
  applyCandidateCount,
  blockedReasons,
  insufficientDataReasons,
  hasNeedsReviewMaterial,
}: {
  recordReview: ApprovedHandoffContextUpdateRecordReview | null;
  selectedRecordFound: boolean;
  selectedFullRecordSupplied: boolean;
  applyCandidateCount: number;
  blockedReasons: string[];
  insufficientDataReasons: string[];
  hasNeedsReviewMaterial: boolean;
}): HandoffContextApplyPreviewStatus {
  if (!recordReview) return "insufficient_data";
  if (recordReview.review_status === "no_records") return "no_records";
  if (blockedReasons.length > 0) return "blocked";
  if (!selectedRecordFound) return "no_selected_record";
  if (!selectedFullRecordSupplied || applyCandidateCount === 0) {
    return "insufficient_data";
  }
  if (insufficientDataReasons.length > 0 || hasNeedsReviewMaterial) {
    return "needs_operator_review";
  }
  return "apply_candidates_available";
}

function mapSelectedCandidates({
  candidates,
  kind,
  target,
  selectedRecord,
  currentSelectedRefSet,
  conflictSummary,
  blockedReasons,
  missingEvidence,
}: {
  candidates: HandoffContextUpdateCandidate[];
  kind: "selected_ref_add" | "selected_ref_reinforce";
  target: HandoffContextApplyPreviewCandidate[];
  selectedRecord: OperatorApprovedHandoffContextUpdateRecord;
  currentSelectedRefSet: Set<string>;
  conflictSummary: HandoffContextApplyPreviewConflictSummary;
  blockedReasons: string[];
  missingEvidence: string[];
}): void {
  for (const candidate of candidates) {
    if (isUnknownCandidate(candidate)) {
      conflictSummary.unknown_selected_ref_attempts.push(candidate.candidate_id);
      blockedReasons.push(`unknown_selected_ref_candidate:${candidate.candidate_id}`);
      targetUnknownCandidate({
        candidate,
        selectedRecord,
        target: conflictSummary,
      });
      continue;
    }
    if (candidate.evidence_refs.length === 0) {
      conflictSummary.missing_evidence_candidates.push(candidate.candidate_id);
      blockedReasons.push(
        `selected_ref_candidate_missing_evidence:${candidate.candidate_id}`,
      );
      missingEvidence.push(`missing_evidence:${candidate.candidate_id}`);
      continue;
    }
    if (currentSelectedRefSet.has(candidate.ref_id)) {
      conflictSummary.duplicate_selected_refs.push(candidate.ref_id);
      if (kind === "selected_ref_add") {
        conflictSummary.conflicting_candidate_ids.push(candidate.candidate_id);
        blockedReasons.push(
          `duplicate_selected_ref_add_candidate:${candidate.candidate_id}`,
        );
        continue;
      }
    }
    target.push(
      toApplyCandidate({
        candidate,
        kind,
        selectedRecord,
        reviewNote:
          "Selected-ref material is previewed only and is not written to a live handoff packet.",
      }),
    );
  }
}

function targetUnknownCandidate({
  candidate,
  selectedRecord,
  target,
}: {
  candidate: HandoffContextUpdateCandidate;
  selectedRecord: OperatorApprovedHandoffContextUpdateRecord;
  target: HandoffContextApplyPreviewConflictSummary;
}): void {
  target.conflicting_candidate_ids.push(candidate.candidate_id);
  target.stale_or_noisy_candidates.push(
    ...staleOrNoisyCandidateIds(candidate),
  );
  void selectedRecord;
}

function toApplyCandidate({
  candidate,
  kind,
  selectedRecord,
  reviewNote,
}: {
  candidate: HandoffContextUpdateCandidate;
  kind: HandoffContextApplyPreviewCandidateKind;
  selectedRecord: OperatorApprovedHandoffContextUpdateRecord;
  reviewNote: string;
}): HandoffContextApplyPreviewCandidate {
  return {
    candidate_id: `${kind}:${selectedRecord.record_id}:${candidate.candidate_id}`,
    candidate_kind: kind,
    ref_id: candidate.ref_id,
    label: candidate.label,
    summary: candidate.summary,
    source_record_id: selectedRecord.record_id,
    source_candidate_id: candidate.source_candidate_id,
    source_bucket: String(candidate.source_bucket),
    evidence_refs: uniqueSortedStrings(candidate.evidence_refs),
    source_refs: uniqueSortedStrings([
      ...candidate.source_refs,
      ...candidate.source_record_refs,
      selectedRecord.record_id,
    ]),
    existing_handoff_ref_ids: uniqueSortedStrings(
      candidate.existing_handoff_ref_ids,
    ),
    apply_preview_only: true,
    would_mutate_live_handoff: false,
    review_note: reviewNote,
  };
}

function warningKind(
  candidate: HandoffContextUpdateCandidate,
): "warning_add" | "warning_strengthen" {
  return candidate.existing_handoff_ref_ids.length > 0
    ? "warning_strengthen"
    : "warning_add";
}

function contextDietKind(
  candidate: HandoffContextUpdateCandidate,
): "context_deprioritize" | "context_exclude" {
  const bucket = String(candidate.source_bucket);
  return bucket === "misleading" || bucket === "missing"
    ? "context_exclude"
    : "context_deprioritize";
}

function isUnknownCandidate(candidate: HandoffContextUpdateCandidate): boolean {
  return (
    candidate.candidate_kind === "unknown_context" ||
    String(candidate.source_bucket) === "unknown" ||
    candidate.ref_id.toLowerCase().includes("unknown")
  );
}

function staleOrNoisyCandidateIds(
  candidate: HandoffContextUpdateCandidate,
): string[] {
  const bucket = String(candidate.source_bucket);
  return ["stale", "noisy", "misleading", "missing"].includes(bucket)
    ? [candidate.candidate_id]
    : [];
}

function buildEvidenceSummary({
  recordReview,
  selectedRecord,
  delta,
  sourceRefs,
  missingEvidence,
  missingEvidenceCandidateIds,
}: {
  recordReview: ApprovedHandoffContextUpdateRecordReview | null;
  selectedRecord: OperatorApprovedHandoffContextUpdateRecord | null;
  delta: HandoffContextApplyPreviewDelta;
  sourceRefs: string[];
  missingEvidence: string[];
  missingEvidenceCandidateIds: string[];
}): HandoffContextApplyPreviewEvidenceSummary {
  const evidenceRefs = uniqueSortedStrings([
    ...(recordReview?.evidence_summary.evidence_refs ?? []),
    ...(selectedRecord?.update_preview_refs.evidence_refs ?? []),
    ...(selectedRecord?.evidence_summary.evidence_refs ?? []),
    ...allDeltaCandidates(delta).flatMap((candidate) => candidate.evidence_refs),
  ]);
  const applyCandidates = allDeltaCandidates(delta);
  const allApplyCandidatesEvidenceBacked =
    missingEvidenceCandidateIds.length === 0 &&
    applyCandidates.every((candidate) => candidate.evidence_refs.length > 0);
  return {
    has_record_review: Boolean(recordReview),
    has_selected_record:
      Boolean(selectedRecord) || Boolean(recordReview?.selected_record_summary),
    has_full_record_material: Boolean(selectedRecord),
    has_source_refs: sourceRefs.length > 0,
    has_evidence_refs: evidenceRefs.length > 0,
    all_apply_candidates_evidence_backed: allApplyCandidatesEvidenceBacked,
    no_live_handoff_mutation_confirmed:
      recordReview?.evidence_summary
        .all_records_confirm_no_live_handoff_mutation ?? false,
    no_handoff_send_confirmed:
      recordReview?.evidence_summary.all_records_confirm_no_handoff_send ??
      false,
    no_provider_github_codex_confirmed:
      recordReview?.evidence_summary
        .all_records_confirm_no_provider_github_codex ?? false,
    source_refs: uniqueSortedStrings(sourceRefs),
    evidence_refs: evidenceRefs,
    missing_evidence: uniqueSortedStrings(missingEvidence),
    problem_record_ids:
      recordReview?.evidence_summary.problem_record_ids ?? [],
  };
}

function currentSelectedRefsFromInput({
  inputRefs,
  currentContext,
}: {
  inputRefs?: string[];
  currentContext: HandoffContextRelayRationale | null;
}): string[] {
  return uniqueSortedStrings([
    ...(inputRefs ?? []),
    ...(currentContext?.selected_refs.map((ref) => ref.ref_id) ?? []),
  ]);
}

function currentExpectedReturnSignalCount(
  currentContext: HandoffContextRelayRationale | null,
): number {
  if (!currentContext) return 0;
  return (
    currentContext.expected_return_signal.required_fields.length +
    currentContext.expected_return_signal.context_feedback_fields.length
  );
}

function currentContextSourceRefs(
  currentContext: HandoffContextRelayRationale | null,
): string[] {
  if (!currentContext) return [];
  return uniqueSortedStrings([
    currentContext.rationale_version,
    ...currentContext.source_refs.source_refs,
    ...currentContext.source_refs.selected_source_refs,
    ...currentContext.source_refs.evidence_refs,
    ...currentContext.selected_refs.flatMap((ref) => ref.source_refs),
    ...currentContext.stale_or_gap_warnings.flatMap((warning) => warning.source_refs),
    ...currentContext.stop_if_missing.flatMap((item) => item.source_refs),
  ]);
}

function selectedApplyCandidateCount(delta: HandoffContextApplyPreviewDelta): number {
  return (
    delta.selected_refs_to_add.length +
    delta.selected_refs_to_reinforce.length
  );
}

function allDeltaCandidates(
  delta: HandoffContextApplyPreviewDelta,
): HandoffContextApplyPreviewCandidate[] {
  return [
    ...delta.selected_refs_to_add,
    ...delta.selected_refs_to_reinforce,
    ...delta.warnings_to_add_or_strengthen,
    ...delta.context_refs_to_deprioritize,
    ...delta.context_refs_to_exclude,
    ...delta.keep_unknown_as_review_only,
    ...delta.expected_return_signal_updates,
    ...delta.carry_forward_stop_if_missing,
    ...delta.rejected_or_excluded_review_notes,
  ];
}

function emptyDelta(): HandoffContextApplyPreviewDelta {
  return {
    selected_refs_to_add: [],
    selected_refs_to_reinforce: [],
    warnings_to_add_or_strengthen: [],
    context_refs_to_deprioritize: [],
    context_refs_to_exclude: [],
    keep_unknown_as_review_only: [],
    expected_return_signal_updates: [],
    carry_forward_stop_if_missing: [],
    rejected_or_excluded_review_notes: [],
  };
}

function isFullOperatorApprovedRecordMaterial(
  record: unknown,
): record is OperatorApprovedHandoffContextUpdateRecord {
  return fullRecordMaterialProblems(record).length === 0;
}

function fullRecordMaterialProblems(record: unknown): string[] {
  const reasons: string[] = [];
  if (!operatorApprovedRecordRef(record)) {
    return ["selected_record_full_material_invalid"];
  }
  const recordValue = isRecord(record) ? record : null;
  const approvedMaterial = getRecord(recordValue, "approved_candidate_material");
  const carryForwardMaterial = getRecord(recordValue, "carry_forward_material");
  const decisionPreviewRefs = getRecord(recordValue, "decision_preview_refs");
  const updatePreviewRefs = getRecord(recordValue, "update_preview_refs");
  const evidenceSummary = getRecord(recordValue, "evidence_summary");

  if (
    !hasArrayFields(approvedMaterial, [
      "selected_ref_add_candidates",
      "selected_ref_reinforcement_candidates",
      "warning_update_candidates",
      "context_diet_candidates",
      "keep_unknown_candidates",
      "expected_return_signal_candidates",
    ])
  ) {
    reasons.push("selected_record_approved_candidate_material_invalid");
  }
  if (
    !hasArrayFields(carryForwardMaterial, [
      "unresolved_blockers",
      "missing_evidence",
      "stop_if_missing_candidates",
      "rejected_or_excluded_candidates",
    ])
  ) {
    reasons.push("selected_record_carry_forward_material_invalid");
  }
  if (
    !isStringArray(recordValue?.source_refs) ||
    !isStringArray(decisionPreviewRefs?.source_refs) ||
    !isStringArray(updatePreviewRefs?.source_refs) ||
    !isStringArray(updatePreviewRefs?.evidence_refs) ||
    !isStringArray(evidenceSummary?.evidence_refs)
  ) {
    reasons.push("selected_record_source_or_evidence_refs_invalid");
  }
  return reasons.length > 0
    ? uniqueSortedStrings(["selected_record_full_material_invalid", ...reasons])
    : [];
}

function operatorApprovedRecordRef(record: unknown): string | null {
  if (!isRecord(record)) return null;
  if (
    record.record_version !==
    OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_RECORD_VERSION
  ) {
    return null;
  }
  return typeof record.record_id === "string" && record.record_id.length > 0
    ? record.record_id
    : null;
}

function hasArrayFields(
  value: Record<string, unknown> | null,
  fields: string[],
): boolean {
  if (!value) return false;
  return fields.every((field) => Array.isArray(value[field]));
}

function getRecord(
  value: Record<string, unknown> | null,
  field: string,
): Record<string, unknown> | null {
  const nested = value?.[field];
  return isRecord(nested) ? nested : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function uniqueSortedStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}
