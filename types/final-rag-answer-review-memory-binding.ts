import type {
  ResearchCandidateReviewMemoryDbCreateInputV01,
  ResearchCandidateReviewMemoryDbStoreResultV01,
} from "./../lib/research-candidate-review/review-memory-db-store";
import type { FinalRagAnswerCandidateReviewResultV01 } from "./final-rag-answer-candidate-review";

export const FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_RUNTIME_VERSION_V01 =
  "final_rag_answer_review_memory_binding.v0.1" as const;
export const FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_REQUEST_VERSION_V01 =
  "final_rag_answer_review_memory_binding_request.v0.1" as const;
export const FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_RESULT_VERSION_V01 =
  "final_rag_answer_review_memory_binding_result.v0.1" as const;
export const FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_ROUTE_VERSION_V01 =
  "final_rag_answer_review_memory_binding_route.v0.1" as const;
export const FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_SCOPE_V01 = "project:augnes" as const;

export type FinalRagAnswerReviewMemoryBindingReviewDecisionV01 =
  | "keep_for_review"
  | "needs_more_evidence"
  | "discard"
  | "needs_operator_review";

export type FinalRagAnswerReviewMemoryBindingReviewActionV01 =
  | "save_review_note"
  | "request_more_evidence"
  | "reject_candidate"
  | "defer_candidate";

export type FinalRagAnswerReviewMemoryBindingStatusV01 =
  | "created"
  | "idempotent_existing"
  | "conflict_existing_record"
  | "blocked_invalid_input"
  | "blocked_forbidden_authority"
  | "blocked_private_or_raw_payload"
  | "invalid_db_path"
  | "rejected";

export interface FinalRagAnswerReviewMemoryBindingOperatorReviewPayloadV01 {
  payload_version: "final_rag_answer_review_memory_binding_operator_review.v0.1";
  operator_actor_ref: string;
  review_decision: FinalRagAnswerReviewMemoryBindingReviewDecisionV01;
  review_action: FinalRagAnswerReviewMemoryBindingReviewActionV01;
  reviewer_note_summary: string;
  authority_boundary_acknowledged: true;
}

export interface FinalRagAnswerReviewMemoryBindingRequestV01 {
  request_version: typeof FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_REQUEST_VERSION_V01;
  runtime_version: typeof FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_RUNTIME_VERSION_V01;
  scope: typeof FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_SCOPE_V01;
  binding_request_id: string;
  requested_by: string;
  requested_at: string;
  review_memory_db_path: string;
  final_answer_candidate_result: FinalRagAnswerCandidateReviewResultV01;
  operator_review_payload: FinalRagAnswerReviewMemoryBindingOperatorReviewPayloadV01;
  idempotency_key: string;
  authority_boundary?: Record<string, unknown>;
  reason_codes: string[];
}

export interface FinalRagAnswerReviewMemoryBindingAuthorityBoundaryV01 {
  final_rag_answer_review_memory_binding_now: true;
  explicit_operator_review_memory_binding_only: true;
  same_origin_post_route_now: true;
  caller_injected_review_memory_db_only: true;
  db_query_or_write_now: boolean;
  review_memory_db_store_now: true;
  review_record_persistence_now: boolean;
  review_record_activity_persistence_now: boolean;
  final_answer_candidate_input_required: true;
  answer_review_state_candidate_only_required: true;
  bounded_review_memory_snapshot_now: boolean;
  source_refs_lineage_only: true;
  no_truth_language_required: true;
  no_proof_language_required: true;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  raw_prompt_stored_now: false;
  raw_provider_output_stored_now: false;
  raw_retrieval_output_stored_now: false;
  raw_source_body_stored_now: false;
  hidden_reasoning_stored_now: false;
  chain_of_thought_stored_now: false;
  source_fetch_now: false;
  retrieval_execution_now: false;
  rag_answer_generation_now: false;
  final_rag_answer_generation_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  promotion_execution_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  product_write_now: false;
  accepted_evidence_ref_write_now: false;
  product_write_runtime_now: false;
  product_write_adapter_enabled_now: false;
  product_id_allocation_now: false;
  broad_product_persistence_now: false;
  product_persistence_now: false;
  git_write_now: false;
  github_api_call_now: false;
  repository_file_write_now: false;
  release_execution_now: false;
  codex_execution_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  product_write_authority: false;
  review_memory_is_truth: false;
  review_memory_is_proof: false;
  review_memory_is_accepted_evidence: false;
  review_memory_is_durable_perspective_state: false;
  final_answer_candidate_is_truth: false;
  final_answer_candidate_is_proof: false;
  final_answer_candidate_is_accepted_evidence: false;
  final_answer_candidate_is_promotion: false;
  final_answer_candidate_is_product: false;
  source_ref_is_proof: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
}

export interface FinalRagAnswerReviewMemoryBindingResultV01 {
  result_version: typeof FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_RESULT_VERSION_V01;
  runtime_version: typeof FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_RUNTIME_VERSION_V01;
  scope: typeof FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_SCOPE_V01;
  status: FinalRagAnswerReviewMemoryBindingStatusV01;
  binding_request_id: string | null;
  answer_request_id: string | null;
  answer_candidate_ref: string | null;
  review_record_id: string | null;
  store_status: string | null;
  store_result: ResearchCandidateReviewMemoryDbStoreResultV01 | null;
  create_input: ResearchCandidateReviewMemoryDbCreateInputV01 | null;
  review_memory_written: boolean;
  db_query_or_write_executed: boolean;
  db_write_executed: boolean;
  provider_call_executed: false;
  prompt_sent: false;
  retrieval_executed: false;
  rag_answer_generated: false;
  final_answer_generated: false;
  source_fetch_executed: false;
  retrieval_index_write_executed: false;
  proof_or_evidence_created: false;
  claim_or_evidence_written: false;
  promotion_executed: false;
  durable_state_written: false;
  durable_state_applied: false;
  formation_receipt_written: false;
  product_write_executed: false;
  accepted_evidence_ref_write_executed: false;
  product_id_allocated: false;
  github_api_called: false;
  git_write_executed: false;
  release_executed: false;
  authority_boundary: FinalRagAnswerReviewMemoryBindingAuthorityBoundaryV01;
  reason_codes: string[];
  failure_codes: string[];
}
