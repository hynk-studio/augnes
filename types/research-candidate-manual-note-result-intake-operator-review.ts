import type {
  ResearchCandidateManualNoteExpectedObservedDeltaDraftStatus,
  ResearchCandidateManualNoteHandoffResultIntake,
  ResearchCandidateManualNoteReuseOutcomeLabel,
} from "@/types/research-candidate-manual-note-handoff-result-intake";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export type ResearchCandidateManualNoteResultIntakeOperatorReviewKind =
  "research_candidate_manual_note_result_intake_operator_review";

export type ResearchCandidateManualNoteResultIntakeOperatorReviewVersion =
  "research_candidate_manual_note_result_intake_operator_review.v0.1";

export type ResearchCandidateManualNoteResultIntakeOperatorDecision =
  | "prepare_record_contract_preview"
  | "needs_more_result_detail"
  | "reject_result_intake_preview"
  | "defer_result_intake_preview";

export type ResearchCandidateManualNoteResultIntakeOperatorReviewStatus =
  | "ready_for_record_contract_preview"
  | "blocked_missing_required_return_fields"
  | "blocked_missing_observed_outcome"
  | "blocked_missing_reuse_outcome"
  | "rejected_by_operator_preview"
  | "deferred_by_operator_preview";

export interface ResearchCandidateManualNoteResultIntakeOperatorReviewInput {
  result_intake: ResearchCandidateManualNoteHandoffResultIntake;
  operator_decision: ResearchCandidateManualNoteResultIntakeOperatorDecision;
  operator_notes?: string;
  reviewed_at?: string | null;
}

export interface ResearchCandidateManualNoteResultIntakeReviewFindings {
  result_intake_recommendation_status:
    ResearchCandidateManualNoteHandoffResultIntake["recommendation_status"];
  result_intake_validation_passed: boolean;
  changed_file_count: number;
  verification_item_count: number;
  skipped_check_count: number;
  remaining_friction_count: number;
  missing_required_return_field_count: number;
  warning_reason_count: number;
  stop_condition_count: number;
}

export interface ResearchCandidateManualNoteResultIntakeRequiredReturnFieldFinding {
  field: string;
  present: boolean;
  evidence_count: number;
  review_note: string;
}

export interface ResearchCandidateManualNoteExpectedObservedDeltaOperatorReview {
  draft_status: ResearchCandidateManualNoteExpectedObservedDeltaDraftStatus;
  expected_summary_present: boolean;
  observed_summary_present: boolean;
  mismatch_or_gap_summary: string;
  ready_for_record_candidate: boolean;
  draft_only: true;
  record_write_authorized: false;
}

export interface ResearchCandidateManualNoteReuseOutcomeOperatorReview {
  outcome_label: ResearchCandidateManualNoteReuseOutcomeLabel;
  selected_candidate_context_ref_count: number;
  source_line_present: boolean;
  warning_reasons: string[];
  ready_for_record_candidate: boolean;
  draft_only: true;
  writes_ledger: false;
  record_write_authorized: false;
}

export interface ResearchCandidateManualNoteResultIntakeAuthorityBoundaryReview {
  boundary_flags_safe: boolean;
  required_true_flags: string[];
  required_false_flags: string[];
  forbidden_enabled_flags: string[];
}

export interface ResearchCandidateManualNoteResultIntakeOperatorReviewAuthorityBoundary {
  candidate_only: true;
  preview_only: true;
  local_review_only: true;
  source_of_truth: false;
  writes_record: false;
  writes_ledger: false;
  updates_salience: false;
  promotes_perspective: false;
  mutates_state: false;
  can_write_db: false;
  can_record_proof: false;
  can_create_evidence: false;
  can_update_work: false;
  can_commit_or_reject_state: false;
  can_create_work_item: false;
  can_call_github: false;
  can_execute_codex: false;
  can_call_providers_or_openai: false;
  can_fetch_sources: false;
  can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false;
  can_send_external_handoff: false;
  can_allocate_product_ids: false;
  can_execute_product_write: false;
}

export interface ResearchCandidateManualNoteResultIntakeOperatorReviewValidation {
  passed: boolean;
  failure_codes: string[];
  deterministic_browser_safe: true;
  raw_result_text_retained: false;
  operator_notes_persisted: false;
  local_review_only: true;
  authority_boundary_safe: boolean;
  record_contract_preview_allowed: boolean;
}

export interface ResearchCandidateManualNoteResultIntakeOperatorReview {
  review_kind: ResearchCandidateManualNoteResultIntakeOperatorReviewKind;
  review_version: ResearchCandidateManualNoteResultIntakeOperatorReviewVersion;
  review_ref: string;
  review_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json_v0_1";
  scope: ResearchCandidateReviewScope;
  source_result_intake_ref: string;
  source_result_intake_fingerprint: string;
  source_handoff_seed_fingerprint: string;
  source_preview_session_id: string;
  review_mode: "local_operator_review_preview";
  selected_operator_decision: ResearchCandidateManualNoteResultIntakeOperatorDecision;
  review_status: ResearchCandidateManualNoteResultIntakeOperatorReviewStatus;
  review_findings: ResearchCandidateManualNoteResultIntakeReviewFindings;
  required_return_field_findings: ResearchCandidateManualNoteResultIntakeRequiredReturnFieldFinding[];
  expected_observed_delta_review: ResearchCandidateManualNoteExpectedObservedDeltaOperatorReview;
  reuse_outcome_review: ResearchCandidateManualNoteReuseOutcomeOperatorReview;
  authority_boundary_review: ResearchCandidateManualNoteResultIntakeAuthorityBoundaryReview;
  warning_reasons: string[];
  blocker_reasons: string[];
  operator_notes: string | null;
  reviewed_at: string | null;
  validation: ResearchCandidateManualNoteResultIntakeOperatorReviewValidation;
  authority_boundary: ResearchCandidateManualNoteResultIntakeOperatorReviewAuthorityBoundary;
  next_recommended_slice: "manual_research_candidate_result_record_contract_preview_v0_1";
}
