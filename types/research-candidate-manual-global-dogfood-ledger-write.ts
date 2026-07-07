import type {
  ResearchCandidateManualResultDogfoodLedgerAuthorizationContract,
} from "@/types/research-candidate-manual-result-dogfood-ledger-authorization-contract";
import type {
  ResearchCandidateManualResultDogfoodLedgerAuthorizationReview,
} from "@/types/research-candidate-manual-result-dogfood-ledger-authorization-review";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_WRITE_CONFIRMATION =
  "I authorize writing this manual research candidate bridge to the global dogfood ledger" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_ROLLBACK_CONFIRMATION =
  "I authorize rolling back this manual research candidate global dogfood ledger receipt" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_WRITE_KIND =
  "research_candidate_manual_global_dogfood_ledger_write" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_WRITE_VERSION =
  "research_candidate_manual_global_dogfood_ledger_write.v0.1" as const;

export type ResearchCandidateManualGlobalDogfoodLedgerAuthorizationKind =
  "manual_operator_authorized_global_dogfood_ledger_write";

export type ResearchCandidateManualGlobalDogfoodLedgerWriteMode =
  | "commit"
  | "replay_if_duplicate"
  | "supersede_previous";

export type ResearchCandidateManualGlobalDogfoodLedgerWriteStatus =
  | "committed"
  | "duplicate_replayed"
  | "superseded"
  | "rolled_back";

export type ResearchCandidateManualGlobalDogfoodLedgerWriteResultStatus =
  | "committed"
  | "duplicate_replayed"
  | "superseded"
  | "rolled_back"
  | "refused"
  | "schema_missing"
  | "not_found";

export interface ResearchCandidateManualGlobalDogfoodLedgerOperatorAuthorization {
  authorization_kind: ResearchCandidateManualGlobalDogfoodLedgerAuthorizationKind;
  operator_confirmation_text: string;
  write_mode: ResearchCandidateManualGlobalDogfoodLedgerWriteMode;
  supersedes_receipt_id?: string | null;
}

export interface ResearchCandidateManualGlobalDogfoodLedgerWriteRequest {
  authorization_contract: ResearchCandidateManualResultDogfoodLedgerAuthorizationContract;
  authorization_review: ResearchCandidateManualResultDogfoodLedgerAuthorizationReview;
  operator_authorization: ResearchCandidateManualGlobalDogfoodLedgerOperatorAuthorization;
}

export interface ResearchCandidateManualGlobalDogfoodLedgerRollbackAuthorization {
  authorization_kind: "manual_operator_authorized_global_dogfood_ledger_rollback";
  operator_confirmation_text: string;
  rollback_reason: string;
}

export interface ResearchCandidateManualGlobalDogfoodLedgerRollbackRequest {
  receipt_id: string;
  rollback_authorization: ResearchCandidateManualGlobalDogfoodLedgerRollbackAuthorization;
}

export interface ResearchCandidateManualGlobalDogfoodLedgerWriteAuthorityBoundary {
  can_write_manual_global_dogfood_ledger_receipt: true;
  can_write_manual_global_dogfood_ledger_record: true;
  can_write_manual_global_dogfood_rollback_metadata: true;
  source_of_truth: false;
  can_write_dogfood_metrics: false;
  can_write_expected_observed_delta_global_record: false;
  can_write_reuse_outcome_global_record: false;
  can_write_proof_or_evidence: false;
  can_mutate_work: false;
  can_promote_perspective: false;
  can_write_perspective_state: false;
  can_write_perspective_memory: false;
  can_mutate_manual_result_records: false;
  can_execute_codex: false;
  can_call_github: false;
  can_call_providers_or_openai: false;
  can_fetch_sources: false;
  can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false;
  can_allocate_product_ids: false;
  can_execute_product_write: false;
  persists_raw_manual_note_text: false;
  persists_raw_result_report_text: false;
  persists_operator_notes: false;
}

export interface ResearchCandidateManualGlobalDogfoodLedgerWriteValidation {
  passed: boolean;
  failure_codes: string[];
  idempotency_key: string | null;
  exact_operator_confirmation_present: boolean;
  ready_authorization_contract_present: boolean;
  accepted_authorization_review_present: boolean;
  preview_contract_remained_non_writing: boolean;
  preview_authority_boundary_was_read_only: boolean;
  writer_authority_boundary_is_narrow: boolean;
  raw_text_fields_absent: boolean;
  operator_note_absent: boolean;
  source_refs_present: boolean;
  supported_outcome_label: boolean;
}

export interface ResearchCandidateManualGlobalDogfoodLedgerWriteReceipt {
  receipt_id: string;
  created_at: string;
  scope: ResearchCandidateReviewScope;
  source_contract_fingerprint: string;
  source_contract_ref: string;
  source_authorization_review_fingerprint: string;
  source_manual_receipt_id: string;
  source_bridge_preview_fingerprint: string;
  source_handoff_seed_fingerprint: string;
  source_result_text_fingerprint: string;
  source_expected_observed_delta_record_ref: string;
  source_reuse_outcome_record_ref: string;
  idempotency_key: string;
  ledger_write_status: Exclude<
    ResearchCandidateManualGlobalDogfoodLedgerWriteStatus,
    "duplicate_replayed"
  >;
  authority_profile: string;
  receipt_fingerprint: string;
  supersedes_receipt_id: string | null;
  rollback_of_receipt_id: string | null;
  rollback_reason: string | null;
}

export interface ResearchCandidateManualGlobalDogfoodLedgerRecord {
  ledger_record_id: string;
  receipt_id: string;
  created_at: string;
  scope: ResearchCandidateReviewScope;
  source_manual_receipt_id: string;
  source_handoff_seed_fingerprint: string;
  source_result_text_fingerprint: string;
  source_expected_observed_delta_record_ref: string;
  source_reuse_outcome_record_ref: string;
  outcome_label: string;
  selected_candidate_context_refs: string[];
  expected_summary: string;
  observed_summary: string | null;
  mismatch_or_gap_summary: string;
  source_line: string | null;
  manual_only_context_refs: string[];
  warning_reasons: string[];
  compatibility_findings: unknown[];
  authority_profile: string;
  ledger_record_fingerprint: string;
}

export interface ResearchCandidateManualGlobalDogfoodLedgerRollbackRecord {
  rollback_id: string;
  created_at: string;
  receipt_id: string;
  rollback_reason: string;
  authority_profile: string;
  rollback_fingerprint: string;
}

export interface ResearchCandidateManualGlobalDogfoodLedgerRecordsByReceipt {
  receipt: ResearchCandidateManualGlobalDogfoodLedgerWriteReceipt;
  ledger_record: ResearchCandidateManualGlobalDogfoodLedgerRecord | null;
  rollback: ResearchCandidateManualGlobalDogfoodLedgerRollbackRecord | null;
  superseded: boolean;
  rolled_back: boolean;
}

export interface ResearchCandidateManualGlobalDogfoodLedgerReadback {
  readback_kind: "research_candidate_manual_global_dogfood_ledger_readback";
  readback_version: "research_candidate_manual_global_dogfood_ledger_readback.v0.1";
  scope: ResearchCandidateReviewScope;
  records_by_receipt: ResearchCandidateManualGlobalDogfoodLedgerRecordsByReceipt[];
  latest_receipts: ResearchCandidateManualGlobalDogfoodLedgerWriteReceipt[];
  latest_active_committed: ResearchCandidateManualGlobalDogfoodLedgerRecordsByReceipt | null;
  count: number;
  authority_boundary: ResearchCandidateManualGlobalDogfoodLedgerWriteAuthorityBoundary;
  raw_manual_note_text_present: false;
  raw_result_report_text_present: false;
  operator_notes_persisted: false;
  dogfood_metrics_written: false;
  expected_observed_delta_global_record_written: false;
  reuse_outcome_global_record_written: false;
  proof_or_evidence_rows_written: false;
  work_or_perspective_rows_written: false;
  perspective_memory_written: false;
  product_write_executed: false;
}

export interface ResearchCandidateManualGlobalDogfoodLedgerWriteResult {
  ok: boolean;
  result_status: ResearchCandidateManualGlobalDogfoodLedgerWriteResultStatus;
  validation: ResearchCandidateManualGlobalDogfoodLedgerWriteValidation;
  receipt: ResearchCandidateManualGlobalDogfoodLedgerWriteReceipt | null;
  ledger_record: ResearchCandidateManualGlobalDogfoodLedgerRecord | null;
  readback: ResearchCandidateManualGlobalDogfoodLedgerReadback | null;
  refusal_reasons: string[];
  duplicate_replayed: boolean;
  idempotency_key: string | null;
  authority_boundary: ResearchCandidateManualGlobalDogfoodLedgerWriteAuthorityBoundary;
  dogfood_metrics_written: false;
  proof_or_evidence_rows_written: false;
  work_or_perspective_rows_written: false;
  perspective_memory_written: false;
  product_write_executed: false;
}

export interface ResearchCandidateManualGlobalDogfoodLedgerRollbackResult {
  ok: boolean;
  result_status: ResearchCandidateManualGlobalDogfoodLedgerWriteResultStatus;
  rollback: ResearchCandidateManualGlobalDogfoodLedgerRollbackRecord | null;
  receipt: ResearchCandidateManualGlobalDogfoodLedgerWriteReceipt | null;
  readback: ResearchCandidateManualGlobalDogfoodLedgerReadback | null;
  refusal_reasons: string[];
  authority_boundary: ResearchCandidateManualGlobalDogfoodLedgerWriteAuthorityBoundary;
  dogfood_metrics_written: false;
  proof_or_evidence_rows_written: false;
  work_or_perspective_rows_written: false;
  perspective_memory_written: false;
  product_write_executed: false;
}
