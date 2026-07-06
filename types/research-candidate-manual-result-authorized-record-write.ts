import type { ResearchCandidateManualNoteHandoffResultIntake } from "@/types/research-candidate-manual-note-handoff-result-intake";
import type { ResearchCandidateManualNoteResultIntakeOperatorReview } from "@/types/research-candidate-manual-note-result-intake-operator-review";
import type { ResearchCandidateManualNoteResultRecordContractPreview } from "@/types/research-candidate-manual-note-result-record-contract-preview";
import type {
  ResearchCandidateReviewScope,
} from "@/types/research-candidate-review";

export const RESEARCH_CANDIDATE_MANUAL_RESULT_AUTHORIZED_WRITE_CONFIRMATION =
  "I authorize writing these manual research candidate result records" as const;

export const RESEARCH_CANDIDATE_MANUAL_RESULT_ROLLBACK_CONFIRMATION =
  "I authorize rolling back this manual research candidate result receipt" as const;

export type ResearchCandidateManualResultAuthorizedWriteAuthorityKind =
  "manual_operator_authorized_record_write";

export type ResearchCandidateManualResultAuthorizedWriteMode =
  | "commit"
  | "replay_if_duplicate"
  | "supersede_previous";

export type ResearchCandidateManualResultWriteStatus =
  | "committed"
  | "duplicate_replayed"
  | "superseded"
  | "rolled_back";

export type ResearchCandidateManualResultWriteResultStatus =
  | "committed"
  | "duplicate_replayed"
  | "rolled_back"
  | "refused"
  | "schema_missing"
  | "not_found";

export interface ResearchCandidateManualResultAuthorizedWriteAuthority {
  authorization_kind: ResearchCandidateManualResultAuthorizedWriteAuthorityKind;
  operator_confirmation_text: string;
  write_mode: ResearchCandidateManualResultAuthorizedWriteMode;
  supersedes_receipt_id?: string | null;
}

export interface ResearchCandidateManualResultAuthorizedWriteRequest {
  result_intake: ResearchCandidateManualNoteHandoffResultIntake;
  operator_review: ResearchCandidateManualNoteResultIntakeOperatorReview;
  record_contract_preview: ResearchCandidateManualNoteResultRecordContractPreview;
  operator_authorization: ResearchCandidateManualResultAuthorizedWriteAuthority;
}

export interface ResearchCandidateManualResultRollbackAuthorization {
  authorization_kind: "manual_operator_authorized_record_rollback";
  operator_confirmation_text: string;
  rollback_reason: string;
}

export interface ResearchCandidateManualResultRollbackRequest {
  receipt_id: string;
  rollback_authorization: ResearchCandidateManualResultRollbackAuthorization;
}

export interface ResearchCandidateManualResultWriteAuthorityBoundary {
  can_write_manual_expected_observed_delta_record: true;
  can_write_manual_reuse_outcome_record: true;
  can_write_manual_result_write_receipt: true;
  can_write_manual_result_rollback_metadata: true;
  source_of_truth: false;
  can_write_proof_or_evidence: false;
  can_create_evidence: false;
  can_record_proof: false;
  can_create_or_update_work_item: false;
  can_mutate_work_status: false;
  can_write_work_event: false;
  can_commit_or_reject_state: false;
  can_promote_perspective: false;
  can_mutate_perspective_state: false;
  can_write_perspective_memory: false;
  can_update_global_dogfood_metrics: false;
  can_execute_codex: false;
  can_call_github: false;
  can_call_providers_or_openai: false;
  can_fetch_sources: false;
  can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false;
  can_send_external_handoff: false;
  can_allocate_product_ids: false;
  can_execute_product_write: false;
  persists_raw_manual_note_text: false;
  persists_raw_result_report_text: false;
  persists_operator_notes: false;
}

export interface ResearchCandidateManualResultWriteValidation {
  passed: boolean;
  failure_codes: string[];
  idempotency_key: string | null;
  exact_operator_confirmation_present: boolean;
  storage_authority_present: boolean;
  ready_operator_review_present: boolean;
  ready_contract_preview_present: boolean;
  preview_contract_remained_non_writing: boolean;
  raw_text_fields_absent: boolean;
  authority_boundary_safe: boolean;
}

export interface ResearchCandidateManualResultWriteReceipt {
  receipt_id: string;
  created_at: string;
  scope: ResearchCandidateReviewScope;
  source_preview_session_id: string;
  source_handoff_seed_fingerprint: string;
  source_result_intake_ref: string;
  source_result_intake_fingerprint: string;
  source_operator_review_ref: string;
  source_operator_review_fingerprint: string;
  source_record_contract_ref: string;
  source_record_contract_fingerprint: string;
  idempotency_key: string;
  write_status: Exclude<ResearchCandidateManualResultWriteStatus, "duplicate_replayed">;
  operator_decision: string;
  authority_profile: string;
  receipt_fingerprint: string;
  supersedes_receipt_id: string | null;
  rollback_of_receipt_id: string | null;
  rollback_reason: string | null;
}

export interface ResearchCandidateManualExpectedObservedDeltaRecord {
  record_id: string;
  receipt_id: string;
  created_at: string;
  scope: ResearchCandidateReviewScope;
  expected_summary: string;
  observed_summary: string | null;
  mismatch_or_gap_summary: string;
  source_handoff_seed_fingerprint: string;
  source_result_text_fingerprint: string;
  source_preview_session_id: string;
  source_refs: string[];
  authority_profile: string;
  record_fingerprint: string;
}

export interface ResearchCandidateManualReuseOutcomeRecord {
  record_id: string;
  receipt_id: string;
  created_at: string;
  scope: ResearchCandidateReviewScope;
  outcome_label: string;
  selected_candidate_context_refs: string[];
  source_line: string | null;
  warning_reasons: string[];
  source_handoff_seed_fingerprint: string;
  source_result_text_fingerprint: string;
  source_preview_session_id: string;
  authority_profile: string;
  record_fingerprint: string;
  writes_ledger: false;
}

export interface ResearchCandidateManualResultRollbackRecord {
  rollback_id: string;
  created_at: string;
  receipt_id: string;
  rollback_reason: string;
  authority_profile: string;
  rollback_fingerprint: string;
}

export interface ResearchCandidateManualResultRecordsByReceipt {
  receipt: ResearchCandidateManualResultWriteReceipt;
  expected_observed_delta_record: ResearchCandidateManualExpectedObservedDeltaRecord | null;
  reuse_outcome_record: ResearchCandidateManualReuseOutcomeRecord | null;
  rollback: ResearchCandidateManualResultRollbackRecord | null;
  superseded: boolean;
  rolled_back: boolean;
}

export interface ResearchCandidateManualResultReadback {
  readback_kind: "research_candidate_manual_result_records_readback";
  readback_version: "research_candidate_manual_result_records_readback.v0.1";
  scope: ResearchCandidateReviewScope;
  records_by_receipt: ResearchCandidateManualResultRecordsByReceipt[];
  latest_receipts: ResearchCandidateManualResultWriteReceipt[];
  count: number;
  authority_boundary: ResearchCandidateManualResultWriteAuthorityBoundary;
  raw_manual_note_text_present: false;
  raw_result_report_text_present: false;
  proof_or_evidence_rows_written: false;
  work_or_perspective_rows_written: false;
}

export interface ResearchCandidateManualResultAuthorizedWriteResult {
  ok: boolean;
  result_status: ResearchCandidateManualResultWriteResultStatus;
  validation: ResearchCandidateManualResultWriteValidation;
  receipt: ResearchCandidateManualResultWriteReceipt | null;
  expected_observed_delta_record: ResearchCandidateManualExpectedObservedDeltaRecord | null;
  reuse_outcome_record: ResearchCandidateManualReuseOutcomeRecord | null;
  readback: ResearchCandidateManualResultReadback | null;
  refusal_reasons: string[];
  duplicate_replayed: boolean;
  idempotency_key: string | null;
  authority_boundary: ResearchCandidateManualResultWriteAuthorityBoundary;
}

export interface ResearchCandidateManualResultRollbackResult {
  ok: boolean;
  result_status: ResearchCandidateManualResultWriteResultStatus;
  rollback: ResearchCandidateManualResultRollbackRecord | null;
  receipt: ResearchCandidateManualResultWriteReceipt | null;
  readback: ResearchCandidateManualResultReadback | null;
  refusal_reasons: string[];
  authority_boundary: ResearchCandidateManualResultWriteAuthorityBoundary;
}
