// Contract-only Operator Source Candidate Generation v0.1 shape.
// This file defines types only. It does not implement candidate generation,
// source fetching, crawling, provider extraction, retrieval/RAG, durable writes,
// DB schema, routes, UI, browser behavior, candidate/work mutation, Perspective
// promotion, proof/evidence creation, salience writes, feedback writes, or
// product writes.

export type OperatorSourceCandidateGenerationContractKind =
  "operator_source_candidate_generation_contract";

export type OperatorSourceCandidateGenerationContractVersion =
  "operator_source_candidate_generation_contract.v0.1";

export type OperatorSourceCandidatePreviewFamilyKind =
  | "claim_candidate_preview"
  | "evidence_candidate_preview"
  | "tension_candidate_preview"
  | "knowledge_gap_candidate_preview"
  | "perspective_delta_candidate_preview"
  | "follow_up_work_candidate_preview";

export interface OperatorSourceCandidateGenerationScope {
  operator_source_candidate_generation_contract: true;
  candidate_preview_only: true;
  contract_only_now: true;
  runtime_candidate_generation_implemented_now: false;
  runtime_source_fetch_implemented_now: false;
  crawler_implemented_now: false;
  provider_extraction_implemented_now: false;
  retrieval_rag_implemented_now: false;
  db_schema_implemented_now: false;
  route_implemented_now: false;
  ui_implemented_now: false;
}

export interface OperatorSourceInputRequirements {
  source_intake_bundle_ref_required: true;
  source_refs_required: true;
  operator_context_required: true;
  reference_only_sources_required: true;
  source_fetch_now: false;
  provider_extraction_now: false;
  retrieval_rag_now: false;
  public_safe_fixture_only_now: true;
  invalid_source_refs_must_be_rejected: true;
}

export interface OperatorSourceCandidatePreviewFamilyPolicy {
  family_kind: OperatorSourceCandidatePreviewFamilyKind;
  candidate_only: true;
  preview_only: true;
  source_refs_required: true;
  operator_context_required: true;
  review_required_later: true;
  durable_write_now: false;
  not_proof_or_evidence: true;
  not_source_of_truth: true;
  not_perspective_state: true;
  not_work_status: true;
  not_product_write: true;
}

export interface OperatorSourceGeneratedCandidatePolicy {
  generated_candidates_preview_only: true;
  generated_candidates_are_not_proof: true;
  generated_candidates_are_not_evidence_records: true;
  generated_candidates_are_not_source_of_truth: true;
  generated_candidates_do_not_promote_perspective: true;
  generated_candidates_do_not_mutate_work: true;
  generated_candidates_do_not_write_product: true;
  generated_candidates_require_human_review_later: true;
  generated_candidates_must_keep_source_refs: true;
  generated_candidates_must_keep_operator_context: true;
}

export interface OperatorSourceCandidateProvenancePolicy {
  source_refs_required: true;
  source_intake_bundle_ref_required: true;
  operator_context_required: true;
  provenance_visible_to_review_surface_later: true;
  unresolved_source_status_allowed: true;
  invalid_source_refs_rejected_upstream: true;
  source_fetch_not_required_now: true;
}

export interface OperatorSourceCandidateReviewPolicy {
  review_surface_later_only: true;
  human_review_required_later: true;
  promotion_requires_later_contract: true;
  proof_evidence_requires_later_gate: true;
  work_creation_requires_later_contract: true;
  product_write_requires_later_contract: true;
}

export interface OperatorSourceCandidatePrivacyPolicy {
  public_safe_fixture_only_now: true;
  no_secrets_in_fixture: true;
  no_raw_oauth_tokens: true;
  no_private_urls_in_fixture: true;
  no_provider_ids_as_canonical_labels: true;
  no_thread_run_session_ids_as_canonical_labels: true;
}

export interface OperatorSourceCandidateNonAuthorityPolicy {
  not_source_of_truth: true;
  not_proof_or_evidence: true;
  not_perspective_state: true;
  not_work_status: true;
  not_promotion_basis: true;
  not_retrieval_rag_result: true;
  not_salience_authority: true;
  not_product_write: true;
  generated_candidate_not_authority: true;
  provider_summary_not_evidence_record: true;
  retrieval_result_not_authority: true;
}

export interface OperatorSourceCandidateGenerationAuthorityBoundary {
  contract_only: true;
  operator_source_candidate_generation_contract_defined_now: true;
  runtime_candidate_generation_implemented_now: false;
  runtime_source_fetch_implemented_now: false;
  crawler_implemented_now: false;
  provider_extraction_implemented_now: false;
  retrieval_rag_implemented_now: false;
  source_index_write_now: false;
  durable_source_record_write_now: false;
  candidate_record_write_now: false;
  candidate_mutation_now: false;
  db_schema_implemented_now: false;
  route_changed_now: false;
  component_changed_now: false;
  browser_request_now: false;
  runtime_db_query_now: false;
  runtime_db_write_now: false;
  production_db_used_now: false;
  durable_memory_write_now: false;
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

export interface OperatorSourceCandidateValidationPolicy {
  static_source_validation_only: true;
  fixture_backed_only: true;
  app_server_started_now: false;
  production_db_used_now: false;
  runtime_browser_request_now: false;
  runtime_db_query_now: false;
  runtime_db_write_now: false;
  runtime_source_fetch_now: false;
  runtime_provider_call_now: false;
  runtime_retrieval_rag_now: false;
  runtime_candidate_generation_now: false;
}

export interface OperatorSourceCandidateSourceRef {
  source_ref_id: string;
  source_input_kind: string;
  source_status: string;
  public_safe_ref: string;
  operator_context_ref: string;
  source_refs: string[];
  reference_only: true;
  public_safe: true;
}

export interface OperatorSourceGeneratedCandidatePreview {
  candidate_preview_id: string;
  family_kind: OperatorSourceCandidatePreviewFamilyKind;
  preview_title: string;
  preview_summary: string;
  source_refs: string[];
  operator_context_ref: string;
  source_intake_bundle_ref: string;
  candidate_only: true;
  preview_only: true;
  review_required_later: true;
  durable_write_now: false;
  not_proof_or_evidence: true;
  not_source_of_truth: true;
  not_perspective_state: true;
  not_work_status: true;
  not_product_write: true;
}

export interface OperatorSourceCandidateGenerationPreviewBundle {
  candidate_generation_preview_bundle_id: string;
  preview_version: "operator_source_candidate_generation_preview.v0.1";
  generated_at: string;
  scope: string;
  source_intake_bundle_ref: string;
  source_refs: OperatorSourceCandidateSourceRef[];
  operator_context_ref: string;
  candidate_preview_families: OperatorSourceCandidatePreviewFamilyPolicy[];
  generated_candidate_previews: OperatorSourceGeneratedCandidatePreview[];
  generated_candidate_policy_ref: string;
  provenance_policy_ref: string;
  review_policy_ref: string;
  privacy_policy_ref: string;
  non_authority_policy_ref: string;
  authority_boundary: OperatorSourceCandidateGenerationAuthorityBoundary;
  validation: OperatorSourceCandidateValidationPolicy;
}

export interface OperatorSourceCandidateGenerationContract {
  contract_kind: OperatorSourceCandidateGenerationContractKind;
  contract_version: OperatorSourceCandidateGenerationContractVersion;
  source_bounded_external_source_intake_validation_ref: string;
  generation_scope: OperatorSourceCandidateGenerationScope;
  source_input_requirements: OperatorSourceInputRequirements;
  candidate_preview_families: OperatorSourceCandidatePreviewFamilyPolicy[];
  generated_candidate_policy: OperatorSourceGeneratedCandidatePolicy;
  provenance_policy: OperatorSourceCandidateProvenancePolicy;
  review_policy: OperatorSourceCandidateReviewPolicy;
  non_authority_policy: OperatorSourceCandidateNonAuthorityPolicy;
  privacy_policy: OperatorSourceCandidatePrivacyPolicy;
  sample_candidate_generation_preview_bundle: OperatorSourceCandidateGenerationPreviewBundle;
  authority_boundary: OperatorSourceCandidateGenerationAuthorityBoundary;
  validation_policy: OperatorSourceCandidateValidationPolicy;
  recommendation_status: "ready_for_operator_source_candidate_generation_implementation_v0_1";
  next_recommended_slice: "operator_source_candidate_generation_implementation_v0_1";
  contract_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
}
