import type {
  ResearchCandidateManualNoteHandoffResultIntake,
} from "@/types/research-candidate-manual-note-handoff-result-intake";
import type {
  ResearchCandidateManualNoteResultIntakeOperatorDecision,
  ResearchCandidateManualNoteResultIntakeOperatorReview,
  ResearchCandidateManualNoteResultIntakeOperatorReviewAuthorityBoundary,
  ResearchCandidateManualNoteResultIntakeOperatorReviewInput,
  ResearchCandidateManualNoteResultIntakeOperatorReviewStatus,
  ResearchCandidateManualNoteResultIntakeOperatorReviewValidation,
} from "@/types/research-candidate-manual-note-result-intake-operator-review";

type JsonRecord = Record<string, unknown>;

const reviewKind =
  "research_candidate_manual_note_result_intake_operator_review" as const;
const reviewVersion =
  "research_candidate_manual_note_result_intake_operator_review.v0.1" as const;
const nextRecommendedSlice =
  "manual_research_candidate_result_record_contract_preview_v0_1" as const;

export function buildResearchCandidateManualNoteResultIntakeOperatorReview(
  input: ResearchCandidateManualNoteResultIntakeOperatorReviewInput,
): ResearchCandidateManualNoteResultIntakeOperatorReview {
  const intake = input.result_intake;
  const sourceResultIntakeFingerprint =
    createResearchCandidateManualNoteResultIntakeFingerprint(intake);
  const sourceResultIntakeRef = `${intake.intake_version}:${sourceResultIntakeFingerprint}`;
  const expectedObservedDeltaReview = {
    draft_status: intake.expected_observed_delta_draft.status,
    expected_summary_present:
      intake.expected_observed_delta_draft.expected_summary.trim().length > 0,
    observed_summary_present:
      (intake.expected_observed_delta_draft.observed_summary ?? "").trim().length >
      0,
    mismatch_or_gap_summary:
      intake.expected_observed_delta_draft.mismatch_or_gap_summary,
    ready_for_record_candidate:
      intake.expected_observed_delta_draft.status ===
      "ready_for_operator_review",
    draft_only: true as const,
    record_write_authorized: false as const,
  };
  const reuseOutcomeReview = {
    outcome_label: intake.reuse_outcome_draft.outcome_label,
    selected_candidate_context_ref_count:
      intake.reuse_outcome_draft.selected_candidate_context_refs.length,
    source_line_present:
      (intake.reuse_outcome_draft.source_line ?? "").trim().length > 0,
    warning_reasons: intake.reuse_outcome_draft.warning_reasons,
    ready_for_record_candidate:
      intake.reuse_outcome_draft.outcome_label !== "not_reported" &&
      !intake.reuse_outcome_draft.warning_reasons.some((reason) =>
        [
          "missing_reuse_outcome",
          "unsupported_reuse_outcome",
          "ambiguous_reuse_outcome",
        ].includes(reason),
      ),
    draft_only: true as const,
    writes_ledger: false as const,
    record_write_authorized: false as const,
  };
  const authorityBoundary =
    getResearchCandidateManualNoteResultIntakeOperatorReviewAuthorityBoundary();
  const authorityBoundaryReview = buildAuthorityBoundaryReview(authorityBoundary);
  const readinessBlockers = buildReadinessBlockers({
    intake,
    expectedObservedDeltaReady:
      expectedObservedDeltaReview.ready_for_record_candidate,
    reuseOutcomeReady: reuseOutcomeReview.ready_for_record_candidate,
  });
  const reviewStatus = determineReviewStatus({
    decision: input.operator_decision,
    intake,
    readinessBlockers,
    expectedObservedDeltaReady:
      expectedObservedDeltaReview.ready_for_record_candidate,
    reuseOutcomeReady: reuseOutcomeReview.ready_for_record_candidate,
  });
  const blockerReasons = uniqueSorted([
    ...readinessBlockers,
    ...(input.operator_decision === "needs_more_result_detail"
      ? ["operator_requested_more_result_detail"]
      : []),
    ...(input.operator_decision === "reject_result_intake_preview"
      ? ["operator_rejected_result_intake_preview"]
      : []),
    ...(input.operator_decision === "defer_result_intake_preview"
      ? ["operator_deferred_result_intake_preview"]
      : []),
  ]);
  const warningReasons = uniqueSorted([
    ...intake.warning_reasons,
    ...intake.stop_conditions.filter(
      (condition) =>
        condition === "operator_review_required_before_any_record_write" ||
        condition === "result_intake_preview_must_remain_local_only",
    ),
    ...(authorityBoundaryReview.forbidden_enabled_flags.length > 0
      ? ["authority_boundary_forbidden_capability_enabled"]
      : []),
  ]);
  const validation = validateResearchCandidateManualNoteResultIntakeOperatorReview({
    reviewStatus,
    blockerReasons,
    authorityBoundary,
  });
  const reviewBase: Omit<
    ResearchCandidateManualNoteResultIntakeOperatorReview,
    "review_ref" | "review_fingerprint"
  > = {
    review_kind: reviewKind,
    review_version: reviewVersion,
    fingerprint_algorithm: "fnv1a32_canonical_json_v0_1",
    scope: intake.scope,
    source_result_intake_ref: sourceResultIntakeRef,
    source_result_intake_fingerprint: sourceResultIntakeFingerprint,
    source_handoff_seed_fingerprint: intake.source_handoff_seed_fingerprint,
    source_preview_session_id: intake.source_preview_session_id,
    review_mode: "local_operator_review_preview",
    selected_operator_decision: input.operator_decision,
    review_status: reviewStatus,
    review_findings: {
      result_intake_recommendation_status: intake.recommendation_status,
      result_intake_validation_passed: intake.validation.passed,
      changed_file_count: intake.changed_files.length,
      verification_item_count: intake.verification_items.length,
      skipped_check_count: intake.skipped_checks.length,
      remaining_friction_count: intake.remaining_friction.length,
      missing_required_return_field_count:
        intake.missing_required_return_fields.length,
      warning_reason_count: intake.warning_reasons.length,
      stop_condition_count: intake.stop_conditions.length,
    },
    required_return_field_findings: intake.expected_return_field_coverage.map(
      (field) => ({
        field: field.field,
        present: field.present,
        evidence_count: field.evidence.length,
        review_note: field.present
          ? "return_field_present_for_operator_review"
          : "return_field_missing_from_pasted_report",
      }),
    ),
    expected_observed_delta_review: expectedObservedDeltaReview,
    reuse_outcome_review: reuseOutcomeReview,
    authority_boundary_review: authorityBoundaryReview,
    warning_reasons: warningReasons,
    blocker_reasons: blockerReasons,
    operator_notes: sanitizeOperatorNotes(input.operator_notes),
    reviewed_at: input.reviewed_at ?? null,
    validation,
    authority_boundary: authorityBoundary,
    next_recommended_slice: nextRecommendedSlice,
  };
  const reviewFingerprint =
    createResearchCandidateManualNoteResultIntakeOperatorReviewFingerprint(
      reviewBase,
    );

  return {
    ...reviewBase,
    review_ref: `${reviewVersion}:${reviewFingerprint}`,
    review_fingerprint: reviewFingerprint,
  };
}

export function createResearchCandidateManualNoteResultIntakeFingerprint(
  intake: ResearchCandidateManualNoteHandoffResultIntake,
): string {
  return `fnv1a32:${fnv1a32(
    stableJson({
      intake_kind: intake.intake_kind,
      intake_version: intake.intake_version,
      scope: intake.scope,
      source_handoff_seed_fingerprint: intake.source_handoff_seed_fingerprint,
      source_preview_session_id: intake.source_preview_session_id,
      source_refs: intake.source_refs,
      result_text_fingerprint: intake.result_text_fingerprint,
      changed_files: intake.changed_files,
      verification_items: intake.verification_items,
      skipped_checks: intake.skipped_checks,
      remaining_friction: intake.remaining_friction,
      expected_observed_delta_draft: intake.expected_observed_delta_draft,
      reuse_outcome_draft: intake.reuse_outcome_draft,
      missing_required_return_fields: intake.missing_required_return_fields,
      warning_reasons: intake.warning_reasons,
      recommendation_status: intake.recommendation_status,
    }),
  )}`;
}

export function createResearchCandidateManualNoteResultIntakeOperatorReviewFingerprint(
  value: Omit<
    ResearchCandidateManualNoteResultIntakeOperatorReview,
    "review_ref" | "review_fingerprint"
  >,
): string {
  return `fnv1a32:${fnv1a32(stableJson(value))}`;
}

export function getResearchCandidateManualNoteResultIntakeOperatorReviewAuthorityBoundary(): ResearchCandidateManualNoteResultIntakeOperatorReviewAuthorityBoundary {
  return {
    candidate_only: true,
    preview_only: true,
    local_review_only: true,
    source_of_truth: false,
    writes_record: false,
    writes_ledger: false,
    updates_salience: false,
    promotes_perspective: false,
    mutates_state: false,
    can_write_db: false,
    can_record_proof: false,
    can_create_evidence: false,
    can_update_work: false,
    can_commit_or_reject_state: false,
    can_create_work_item: false,
    can_call_github: false,
    can_execute_codex: false,
    can_call_providers_or_openai: false,
    can_fetch_sources: false,
    can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false,
    can_send_external_handoff: false,
    can_allocate_product_ids: false,
    can_execute_product_write: false,
  };
}

function buildReadinessBlockers({
  intake,
  expectedObservedDeltaReady,
  reuseOutcomeReady,
}: {
  intake: ResearchCandidateManualNoteHandoffResultIntake;
  expectedObservedDeltaReady: boolean;
  reuseOutcomeReady: boolean;
}) {
  return uniqueSorted([
    ...(!intake.validation.passed ? ["result_intake_validation_not_passed"] : []),
    ...intake.missing_required_return_fields.map(
      (field) => `missing_required_return_field:${field}`,
    ),
    ...(!expectedObservedDeltaReady
      ? [
          `expected_observed_delta_draft_status:${intake.expected_observed_delta_draft.status}`,
        ]
      : []),
    ...(!reuseOutcomeReady
      ? [`reuse_outcome_draft_status:${intake.reuse_outcome_draft.outcome_label}`]
      : []),
    ...intake.stop_conditions.filter((condition) =>
      [
        "pasted_result_report_text_missing",
        "required_return_fields_missing",
        "pasted_result_report_claims_forbidden_side_effects",
      ].includes(condition),
    ),
  ]);
}

function determineReviewStatus({
  decision,
  intake,
  readinessBlockers,
  expectedObservedDeltaReady,
  reuseOutcomeReady,
}: {
  decision: ResearchCandidateManualNoteResultIntakeOperatorDecision;
  intake: ResearchCandidateManualNoteHandoffResultIntake;
  readinessBlockers: string[];
  expectedObservedDeltaReady: boolean;
  reuseOutcomeReady: boolean;
}): ResearchCandidateManualNoteResultIntakeOperatorReviewStatus {
  if (decision === "reject_result_intake_preview") {
    return "rejected_by_operator_preview";
  }
  if (decision === "defer_result_intake_preview") {
    return "deferred_by_operator_preview";
  }
  if (decision === "needs_more_result_detail") {
    return firstBlockingStatus({
      intake,
      expectedObservedDeltaReady,
      reuseOutcomeReady,
    }) ?? "deferred_by_operator_preview";
  }
  if (readinessBlockers.length === 0) {
    return "ready_for_record_contract_preview";
  }
  return (
    firstBlockingStatus({
      intake,
      expectedObservedDeltaReady,
      reuseOutcomeReady,
    }) ?? "blocked_missing_required_return_fields"
  );
}

function firstBlockingStatus({
  intake,
  expectedObservedDeltaReady,
  reuseOutcomeReady,
}: {
  intake: ResearchCandidateManualNoteHandoffResultIntake;
  expectedObservedDeltaReady: boolean;
  reuseOutcomeReady: boolean;
}): ResearchCandidateManualNoteResultIntakeOperatorReviewStatus | null {
  if (intake.missing_required_return_fields.length > 0) {
    return "blocked_missing_required_return_fields";
  }
  if (!expectedObservedDeltaReady) {
    return "blocked_missing_observed_outcome";
  }
  if (!reuseOutcomeReady) {
    return "blocked_missing_reuse_outcome";
  }
  return null;
}

function validateResearchCandidateManualNoteResultIntakeOperatorReview({
  reviewStatus,
  blockerReasons,
  authorityBoundary,
}: {
  reviewStatus: ResearchCandidateManualNoteResultIntakeOperatorReviewStatus;
  blockerReasons: string[];
  authorityBoundary: ResearchCandidateManualNoteResultIntakeOperatorReviewAuthorityBoundary;
}): ResearchCandidateManualNoteResultIntakeOperatorReviewValidation {
  const authorityBoundarySafe = authorityBoundaryIsSafe(authorityBoundary);
  const recordContractPreviewAllowed =
    reviewStatus === "ready_for_record_contract_preview" &&
    blockerReasons.length === 0;
  const failureCodes = uniqueSorted([
    ...blockerReasons,
    ...(!authorityBoundarySafe
      ? ["authority_boundary_forbidden_capability_enabled"]
      : []),
  ]);

  return {
    passed: authorityBoundarySafe && failureCodes.length === 0,
    failure_codes: failureCodes,
    deterministic_browser_safe: true,
    raw_result_text_retained: false,
    operator_notes_persisted: false,
    local_review_only: true,
    authority_boundary_safe: authorityBoundarySafe,
    record_contract_preview_allowed: recordContractPreviewAllowed,
  };
}

function buildAuthorityBoundaryReview(
  boundary: ResearchCandidateManualNoteResultIntakeOperatorReviewAuthorityBoundary,
) {
  const requiredTrueFlags = [
    "candidate_only",
    "preview_only",
    "local_review_only",
  ];
  const requiredFalseFlags = Object.keys(boundary).filter(
    (key) => !requiredTrueFlags.includes(key),
  );
  const forbiddenEnabledFlags = requiredFalseFlags.filter(
    (key) =>
      boundary[
        key as keyof ResearchCandidateManualNoteResultIntakeOperatorReviewAuthorityBoundary
      ] !== false,
  );

  return {
    boundary_flags_safe:
      requiredTrueFlags.every(
        (key) =>
          boundary[
            key as keyof ResearchCandidateManualNoteResultIntakeOperatorReviewAuthorityBoundary
          ] === true,
      ) && forbiddenEnabledFlags.length === 0,
    required_true_flags: requiredTrueFlags,
    required_false_flags: requiredFalseFlags,
    forbidden_enabled_flags: forbiddenEnabledFlags,
  };
}

function authorityBoundaryIsSafe(
  boundary: ResearchCandidateManualNoteResultIntakeOperatorReviewAuthorityBoundary,
) {
  return buildAuthorityBoundaryReview(boundary).boundary_flags_safe;
}

function sanitizeOperatorNotes(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 2000);
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(",")}]`;
  }

  const record = value as JsonRecord;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(",")}}`;
}

function uniqueSorted(values: readonly string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function fnv1a32(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
