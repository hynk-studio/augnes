import type {
  ResearchCandidateManualNoteHandoffResultIntake,
  ResearchCandidateManualNoteReuseOutcomeLabel,
} from "@/types/research-candidate-manual-note-handoff-result-intake";
import type { ResearchCandidateManualNoteResultIntakeOperatorReview } from "@/types/research-candidate-manual-note-result-intake-operator-review";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export type ResearchCandidateManualNoteResultRecordContractPreviewKind =
  "research_candidate_manual_note_result_record_contract_preview";

export type ResearchCandidateManualNoteResultRecordContractPreviewVersion =
  "research_candidate_manual_note_result_record_contract_preview.v0.1";

export type ResearchCandidateManualNoteResultRecordContractPreviewStatus =
  | "ready_for_future_authorization"
  | "blocked_before_record_contract_preview";

export interface ResearchCandidateManualNoteResultRecordContractPreviewInput {
  result_intake: ResearchCandidateManualNoteHandoffResultIntake;
  operator_review: ResearchCandidateManualNoteResultIntakeOperatorReview;
}

export interface ResearchCandidateManualNoteExpectedObservedDeltaRecordCandidate {
  candidate_kind: "research_candidate_manual_note_expected_observed_delta_record_candidate";
  expected_summary: string;
  observed_summary: string | null;
  mismatch_or_gap_summary: string;
  source_handoff_seed_fingerprint: string;
  source_result_text_fingerprint: string;
  source_preview_session_id: string;
  source_refs: string[];
  draft_only: true;
  record_write_authorized: false;
}

export interface ResearchCandidateManualNoteReuseOutcomeRecordCandidate {
  candidate_kind: "research_candidate_manual_note_reuse_outcome_record_candidate";
  selected_candidate_context_refs: string[];
  outcome_label: ResearchCandidateManualNoteReuseOutcomeLabel;
  source_line: string | null;
  warning_reasons: string[];
  source_handoff_seed_fingerprint: string;
  source_result_text_fingerprint: string;
  draft_only: true;
  record_write_authorized: false;
  writes_ledger: false;
}

export interface ResearchCandidateManualNoteResultRecordContractIdempotencyPreview {
  idempotency_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json_v0_1";
  durable_id_allocated: false;
  preview_only: true;
}

export interface ResearchCandidateManualNoteResultRecordContractPreviewAuthorityBoundary {
  candidate_only: true;
  preview_only: true;
  contract_preview_only: true;
  source_of_truth: false;
  would_write: false;
  storage_authority_present: false;
  record_write_authorized: false;
  writes_ledger: false;
  can_write_db: false;
  can_record_proof: false;
  can_create_evidence: false;
  can_update_work: false;
  can_commit_or_reject_state: false;
  can_promote_perspective: false;
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

export interface ResearchCandidateManualNoteResultRecordContractPreviewValidation {
  passed: boolean;
  failure_codes: string[];
  deterministic_browser_safe: true;
  no_durable_ids_allocated: true;
  raw_result_text_retained: false;
  operator_notes_retained: false;
  would_write: false;
  authority_boundary_safe: boolean;
}

export interface ResearchCandidateManualNoteResultRecordContractPreview {
  contract_kind: ResearchCandidateManualNoteResultRecordContractPreviewKind;
  contract_version: ResearchCandidateManualNoteResultRecordContractPreviewVersion;
  contract_status: ResearchCandidateManualNoteResultRecordContractPreviewStatus;
  contract_ref: string;
  contract_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json_v0_1";
  scope: ResearchCandidateReviewScope;
  source_operator_review_ref: string;
  source_operator_review_fingerprint: string;
  source_result_intake_ref: string;
  source_result_intake_fingerprint: string;
  source_handoff_seed_fingerprint: string;
  source_preview_session_id: string;
  expected_observed_delta_record_candidate: ResearchCandidateManualNoteExpectedObservedDeltaRecordCandidate;
  reuse_outcome_record_candidate: ResearchCandidateManualNoteReuseOutcomeRecordCandidate;
  idempotency_preview: ResearchCandidateManualNoteResultRecordContractIdempotencyPreview;
  source_refs: string[];
  evidence_refs: [];
  proof_refs: [];
  would_write: false;
  storage_authority_present: false;
  record_write_authorized: false;
  writes_ledger: false;
  required_future_authorization: string[];
  validation: ResearchCandidateManualNoteResultRecordContractPreviewValidation;
  blocker_reasons: string[];
  authority_boundary: ResearchCandidateManualNoteResultRecordContractPreviewAuthorityBoundary;
  next_recommended_slice: "manual_research_candidate_expected_observed_delta_reuse_outcome_authorized_record_write_v0_1";
}
