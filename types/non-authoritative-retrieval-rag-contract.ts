// Contract-only Non-authoritative Retrieval/RAG v0.1 shape.
// This file defines types only. It does not implement retrieval/RAG execution,
// index build/write, embedding generation, vector DB, FTS, provider calls,
// source fetching, crawling, DB reads/writes, routes, UI, durable writes,
// proof/evidence creation, Perspective promotion, work mutation, or product
// writes.

export type NonAuthoritativeRetrievalRagContractKind =
  "non_authoritative_retrieval_rag_contract";

export type NonAuthoritativeRetrievalRagContractVersion =
  "non_authoritative_retrieval_rag_contract.v0.1";

export type NonAuthoritativeRetrievalInput =
  | "source_ref_metadata"
  | "candidate_summaries"
  | "review_notes"
  | "perspective_delta_summaries"
  | "formation_receipt_summaries";

export type NonAuthoritativeRetrievalResultFamilyKind =
  | "source_ref_recall_result"
  | "candidate_recall_result"
  | "review_note_recall_result"
  | "perspective_delta_recall_result"
  | "formation_receipt_recall_result"
  | "rag_context_preview"
  | "retrieval_gap_or_tension_candidate";

export interface NonAuthoritativeRetrievalRagContractScope {
  retrieval_rag_contract_only: true;
  runtime_retrieval_rag_now: false;
  runtime_index_build_now: false;
  runtime_index_write_now: false;
  embedding_generation_now: false;
  vector_db_now: false;
  fts_now: false;
  provider_openai_call_now: false;
  source_fetch_now: false;
  crawler_now: false;
}

export interface NonAuthoritativeRetrievalInputPolicy {
  source_ref_metadata_allowed: true;
  candidate_summaries_allowed: true;
  review_notes_allowed: true;
  perspective_delta_summaries_allowed: true;
  formation_receipt_summaries_allowed: true;
  raw_private_source_body_allowed: false;
  raw_provider_ids_allowed: false;
  raw_thread_run_session_ids_allowed: false;
  private_or_unstable_urls_allowed: false;
  secrets_allowed: false;
}

export interface NonAuthoritativeRetrievalResultFamily {
  family_kind: NonAuthoritativeRetrievalResultFamilyKind;
  source_refs_required?: true;
  source_refs_or_review_record_ref_required?: true;
  formation_receipt_ref_required?: true;
  selected_source_refs_visible?: true;
  source_refs_or_gap_reason_required?: true;
  candidate_durable_distinction_required?: true;
  recall_only?: true;
  authority?: false;
  generated_answer_authority?: false;
  answer_is_context_preview_only?: true;
  candidate_only?: true;
  preview_only?: true;
  not_evidence: true;
  not_proof: true;
  not_source_of_truth: true;
  not_promotion_basis?: true;
  not_perspective_state?: true;
  not_work_status?: true;
  not_product_write?: true;
  human_review_required_later?: true;
}

export interface NonAuthoritativeRetrievalNonAuthorityPolicy {
  retrieval_result_is_recall_not_authority: true;
  rag_answer_is_context_preview_not_evidence_or_proof: true;
  embedding_similarity_is_not_truth_score: true;
  embedding_similarity_is_not_salience_authority: true;
  embedding_similarity_is_not_promotion_readiness: true;
  retrieval_score_is_not_truth_score: true;
  retrieval_score_is_not_promotion_score: true;
  retrieval_score_is_not_evidence_strength: true;
  index_is_rebuildable: true;
  index_is_derived: true;
  index_is_non_authoritative: true;
  stale_index_cannot_override_current_state: true;
  vector_db_is_not_source_of_truth: true;
  hidden_permanent_memory_not_allowed: true;
}

export interface NonAuthoritativeRetrievalAuthorityBoundary {
  contract_added_now: true;
  implementation_added_now: false;
  runtime_retrieval_rag_implemented_now: false;
  runtime_index_build_implemented_now: false;
  runtime_index_write_now: false;
  embedding_generation_implemented_now: false;
  vector_db_implemented_now: false;
  fts_implemented_now: false;
  provider_openai_call_now: false;
  provider_extraction_now: false;
  source_fetch_now: false;
  crawler_now: false;
  source_index_write_now: false;
  durable_source_record_write_now: false;
  candidate_record_write_now: false;
  candidate_mutation_now: false;
  runtime_persistence_implemented_now: false;
  durable_memory_write_now: false;
  runtime_db_write_now: false;
  runtime_db_query_now: false;
  production_db_used_now: false;
  db_schema_implemented_now: false;
  route_changed_now: false;
  component_changed_now: false;
  browser_request_now: false;
  durable_salience_write_now: false;
  recent_rehearsal_buffer_written_now: false;
  formation_receipt_written_now: false;
  feedback_events_written_now: false;
  feedback_events_mutated_now: false;
  proof_or_evidence_record: false;
  perspective_promotion: false;
  durable_perspective_state_write: false;
  promotion_decision_record: false;
  work_mutation: false;
  execution_authority: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  external_handoff_authority: false;
  provider_openai_authority: false;
  retrieval_rag_authority: false;
  source_fetch_authority: false;
  salience_authority: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
  product_write_lane_parked_by_686: true;
}

export type NonAuthoritativeRetrievalPreviewAuthorityBoundary = Omit<
  NonAuthoritativeRetrievalAuthorityBoundary,
  "implementation_added_now"
>;

export interface NonAuthoritativeRetrievalValidationPolicy {
  all_results_source_ref_backed_or_explicit_gap: true;
  all_results_preserve_candidate_durable_distinction: true;
  all_results_recall_only: true;
  no_result_is_evidence: true;
  no_result_is_proof: true;
  no_result_is_source_of_truth: true;
  no_result_is_promotion_basis: true;
  rag_context_preview_not_evidence_or_proof: true;
  retrieval_scores_not_truth_or_promotion_scores: true;
  stale_index_cannot_override_current_state: true;
  no_runtime_retrieval_rag_execution: true;
  no_runtime_index_build: true;
  no_index_write: true;
  no_embedding_generation: true;
  no_vector_db: true;
  no_provider_openai_call: true;
  no_source_fetch: true;
  no_crawler: true;
  no_db_write_or_query: true;
  no_schema_or_migration: true;
  no_route_or_ui: true;
  no_browser_request: true;
  no_product_write_or_ids: true;
}

export interface NonAuthoritativeRetrievalPrivacyPolicy {
  no_secrets_in_fixture: true;
  no_private_urls: true;
  no_raw_provider_thread_run_session_ids: true;
  no_raw_source_body: true;
  public_safe_source_refs_only: true;
}

export interface NonAuthoritativeRetrievalSourceRef {
  source_ref_id: string;
  public_safe_ref: string;
  source_refs: string[];
  operator_context_ref: string;
  public_safe: true;
}

export interface NonAuthoritativeRetrievalResultPreview {
  retrieval_result_id: string;
  family_kind: NonAuthoritativeRetrievalResultFamilyKind;
  title: string;
  summary: string;
  source_refs?: string[];
  review_record_ref?: string;
  formation_receipt_ref?: string;
  selected_source_refs?: string[];
  gap_reason?: string;
  retrieval_score_label: string;
  candidate_durable_distinction_preserved?: true;
  recall_only: true;
  authority: false;
  not_evidence: true;
  not_proof: true;
  not_source_of_truth: true;
  not_promotion_basis: true;
}

export interface NonAuthoritativeRagContextPreview {
  answer_summary: string;
  source_refs: string[];
  recall_only: true;
  authority: false;
  not_evidence: true;
  not_proof: true;
  not_source_of_truth: true;
  not_perspective_state: true;
  not_work_status: true;
  not_product_write: true;
  human_review_required_later: true;
}

export interface NonAuthoritativeRetrievalRagContractPreview {
  preview_version: "non_authoritative_retrieval_rag_preview.v0.1";
  operator_context_ref: string;
  source_refs: NonAuthoritativeRetrievalSourceRef[];
  retrieval_results: NonAuthoritativeRetrievalResultPreview[];
  rag_context_preview: NonAuthoritativeRagContextPreview;
  authority_boundary: NonAuthoritativeRetrievalPreviewAuthorityBoundary;
  validation_policy: NonAuthoritativeRetrievalValidationPolicy;
}

export interface NonAuthoritativeRetrievalRagContract {
  contract_kind: NonAuthoritativeRetrievalRagContractKind;
  contract_version: NonAuthoritativeRetrievalRagContractVersion;
  source_operator_source_candidate_generation_validation_ref: string;
  contract_scope: NonAuthoritativeRetrievalRagContractScope;
  retrieval_inputs: NonAuthoritativeRetrievalInput[];
  input_policy: NonAuthoritativeRetrievalInputPolicy;
  retrieval_result_families: NonAuthoritativeRetrievalResultFamily[];
  non_authority_policy: NonAuthoritativeRetrievalNonAuthorityPolicy;
  authority_boundary: NonAuthoritativeRetrievalAuthorityBoundary;
  sample_retrieval_rag_contract_preview: NonAuthoritativeRetrievalRagContractPreview;
  validation_policy: NonAuthoritativeRetrievalValidationPolicy;
  privacy_policy: NonAuthoritativeRetrievalPrivacyPolicy;
  recommendation_status: "ready_for_non_authoritative_retrieval_rag_implementation_v0_1";
  next_recommended_slice: "non_authoritative_retrieval_rag_implementation_v0_1";
  contract_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
}
