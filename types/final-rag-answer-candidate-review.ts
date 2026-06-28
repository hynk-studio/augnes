export const FINAL_RAG_ANSWER_CANDIDATE_REVIEW_RUNTIME_VERSION_V01 =
  "final_rag_answer_generation_candidate_review.v0.1" as const;
export const FINAL_RAG_ANSWER_CANDIDATE_REVIEW_REQUEST_VERSION_V01 =
  "final_rag_answer_generation_candidate_review_request.v0.1" as const;
export const FINAL_RAG_ANSWER_CANDIDATE_REVIEW_RESULT_VERSION_V01 =
  "final_rag_answer_generation_candidate_review_result.v0.1" as const;
export const FINAL_RAG_ANSWER_CANDIDATE_REVIEW_ROUTE_VERSION_V01 =
  "final_rag_answer_generation_candidate_review_route.v0.1" as const;
export const FINAL_RAG_ANSWER_CANDIDATE_REVIEW_SCOPE_V01 = "project:augnes" as const;

export type FinalRagAnswerProviderModeV01 = "mock_provider" | "configured_provider";
export type FinalRagAnswerCandidateReviewStateV01 = "candidate_only";
export type FinalRagAnswerCandidateReviewStatusV01 =
  | "final_answer_candidate_created"
  | "provider_missing_key"
  | "provider_unavailable"
  | "context_preview_empty"
  | "blocked_invalid_input"
  | "blocked_forbidden_authority"
  | "blocked_private_or_raw_payload"
  | "db_missing"
  | "schema_missing"
  | "rejected";

export type FinalRagAnswerProviderStatusV01 =
  | "mock_provider_completed"
  | "configured_provider_completed"
  | "provider_missing_key"
  | "provider_unavailable"
  | "not_invoked";

export interface FinalRagAnswerCandidateReviewRequestV01 {
  request_version: typeof FINAL_RAG_ANSWER_CANDIDATE_REVIEW_REQUEST_VERSION_V01;
  runtime_version: typeof FINAL_RAG_ANSWER_CANDIDATE_REVIEW_RUNTIME_VERSION_V01;
  scope: typeof FINAL_RAG_ANSWER_CANDIDATE_REVIEW_SCOPE_V01;
  answer_request_id: string;
  requested_by: string;
  requested_at: string;
  provider_mode: FinalRagAnswerProviderModeV01;
  provider_ref: string;
  model_or_tool_ref: string;
  rag_context_preview_request: Record<string, unknown>;
  max_answer_chars: number;
  max_context_items: number;
  citation_policy: "source_ref_lineage_citations_only";
  no_truth_language_required: true;
  no_proof_language_required: true;
  raw_prompt_storage_policy: "non_persistent";
  raw_provider_output_storage_policy: "non_persistent";
  no_chain_of_thought_storage: true;
  authority_boundary?: Record<string, unknown>;
  reason_codes: string[];
}

export interface FinalRagAnswerCandidateAuthorityBoundaryV01 {
  final_rag_answer_generation_candidate_review_now: true;
  explicit_operator_answer_generation_only: true;
  same_origin_post_route_now: true;
  db_backed_rag_context_preview_now: true;
  retrieval_execution_via_context_preview_now: boolean;
  bounded_prompt_descriptor_now: true;
  answer_provider_adapter_boundary_now: true;
  mock_answer_provider_now: boolean;
  configured_provider_missing_key_refusal_now: boolean;
  final_answer_candidate_generated_now: boolean;
  answer_review_state_candidate_only: true;
  citation_source_refs_visible: true;
  no_truth_language_required: true;
  no_proof_language_required: true;
  raw_prompt_non_persistent: true;
  raw_provider_output_non_persistent: true;
  provider_call_on_load_now: false;
  background_provider_call_now: false;
  hidden_provider_call_now: false;
  raw_prompt_stored_now: false;
  raw_provider_output_stored_now: false;
  raw_retrieval_output_stored_now: false;
  raw_source_body_stored_now: false;
  hidden_reasoning_stored_now: false;
  chain_of_thought_stored_now: false;
  provider_thread_run_session_id_canonicalized_now: false;
  source_fetch_now: false;
  automatic_crawling_now: false;
  retrieval_index_write_now: false;
  embedding_created_now: false;
  vector_search_now: false;
  final_answer_is_truth: false;
  final_answer_is_proof: false;
  final_answer_is_accepted_evidence: false;
  final_answer_is_promotion_readiness: false;
  final_answer_is_product: false;
  retrieval_result_is_evidence: false;
  retrieval_score_is_truth_score: false;
  retrieval_score_is_promotion_readiness: false;
  source_ref_is_proof: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  review_memory_write_now: false;
  promotion_execution_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  product_write_now: false;
  product_write_runtime_now: false;
  product_write_accepted_evidence_ref_write_now: false;
  product_write_adapter_enabled_now: false;
  product_id_allocation_now: false;
  broad_product_persistence_now: false;
  product_persistence_now: false;
  github_api_call_now: false;
  git_write_now: false;
  repository_file_write_now: false;
  release_execution_now: false;
  codex_execution_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  product_write_authority: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
}

export interface FinalRagAnswerCitationNoteV01 {
  source_ref: string;
  context_refs: string[];
  bounded_note: string;
}

export interface FinalRagAnswerOmittedContextReasonV01 {
  source_result_ref: string;
  context_ref: string | null;
  reason: string;
  bounded_title: string;
}

export interface FinalRagAnswerCandidateReviewResultV01 {
  result_version: typeof FINAL_RAG_ANSWER_CANDIDATE_REVIEW_RESULT_VERSION_V01;
  runtime_version: typeof FINAL_RAG_ANSWER_CANDIDATE_REVIEW_RUNTIME_VERSION_V01;
  scope: typeof FINAL_RAG_ANSWER_CANDIDATE_REVIEW_SCOPE_V01;
  status: FinalRagAnswerCandidateReviewStatusV01;
  answer_request_id: string | null;
  provider_mode: FinalRagAnswerProviderModeV01 | null;
  provider_status: FinalRagAnswerProviderStatusV01;
  rag_context_preview_ref: string | null;
  retrieved_refs: string[];
  cited_source_refs: string[];
  answer_candidate_ref: string | null;
  bounded_answer: string | null;
  bounded_citation_notes: FinalRagAnswerCitationNoteV01[];
  omitted_context_reasons: FinalRagAnswerOmittedContextReasonV01[];
  answer_review_state: FinalRagAnswerCandidateReviewStateV01;
  no_truth_claim: true;
  no_proof_claim: true;
  no_accepted_evidence_claim: true;
  no_promotion_claim: true;
  no_product_write_claim: true;
  provider_call_executed: boolean;
  prompt_sent: boolean;
  retrieval_executed: boolean;
  rag_answer_generated: boolean;
  final_answer_candidate_generated: boolean;
  db_write_executed: false;
  retrieval_index_write_executed: false;
  source_fetch_executed: false;
  proof_or_evidence_created: false;
  claim_or_evidence_written: false;
  review_memory_written: false;
  promotion_executed: false;
  durable_state_written: false;
  durable_state_applied: false;
  formation_receipt_written: false;
  product_write_executed: false;
  product_id_allocated: false;
  github_api_called: false;
  git_write_executed: false;
  release_executed: false;
  authority_boundary: FinalRagAnswerCandidateAuthorityBoundaryV01;
  reason_codes: string[];
  failure_codes?: string[];
}
