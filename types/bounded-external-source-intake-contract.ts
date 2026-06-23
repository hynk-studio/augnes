// Contract-only Bounded External Source Intake v0.1 shape.
// This file defines types only. It does not implement source fetching,
// crawling, provider extraction, retrieval/RAG, durable writes, DB schema,
// routes, UI, browser behavior, candidate/work mutation, Perspective
// promotion, proof/evidence creation, salience writes, feedback writes, or
// product writes.

export type BoundedExternalSourceIntakeContractKind =
  "bounded_external_source_intake_contract";

export type BoundedExternalSourceIntakeContractVersion =
  "bounded_external_source_intake_contract.v0.1";

export type BoundedExternalAllowedSourceInputKind =
  | "operator_provided_url_reference"
  | "uploaded_pdf_metadata"
  | "uploaded_notes_reference"
  | "browser_capture_reference"
  | "oauth_document_pointer"
  | "repo_backed_doc_ref"
  | "manual_bibliographic_reference";

export type BoundedExternalDisallowedSourceInputKind =
  | "crawler_seed"
  | "unbounded_domain_crawl"
  | "automatic_web_search"
  | "provider_generated_source_without_operator_ref"
  | "raw_private_url_as_canonical_id"
  | "raw_oauth_token"
  | "raw_thread_or_run_id"
  | "arbitrary_user_string_as_stable_id";

export type BoundedExternalSourceStatusValue =
  | "reference_only"
  | "operator_supplied"
  | "repo_backed"
  | "uploaded_metadata_only"
  | "oauth_pointer_only"
  | "unresolved"
  | "rejected_for_now";

export interface BoundedExternalSourceIntakeScope {
  operator_provided_source_intake_contract: true;
  candidate_generation_input_only: true;
  contract_only_now: true;
  runtime_source_fetch_implemented_now: false;
  crawler_implemented_now: false;
  provider_extraction_implemented_now: false;
  retrieval_rag_implemented_now: false;
  db_schema_implemented_now: false;
  route_implemented_now: false;
  ui_implemented_now: false;
}

export interface BoundedExternalAllowedSourceInputPolicy {
  input_kind: BoundedExternalAllowedSourceInputKind;
  accepted_as_reference_only_now: true;
  source_fetch_now: false;
  provider_extraction_now: false;
  candidate_generation_later_only: true;
  requires_source_refs: true;
  requires_operator_context: true;
  public_safe_fixture_only_now: true;
}

export interface BoundedExternalDisallowedSourceInputPolicy {
  input_kind: BoundedExternalDisallowedSourceInputKind;
  disallowed_now: true;
  reason: string;
}

export interface BoundedExternalSourceReferencePolicy {
  references_only_now: true;
  no_fetch_now: true;
  no_crawl_now: true;
  no_provider_call_now: true;
  no_retrieval_rag_now: true;
  no_embedding_now: true;
  no_index_write_now: true;
  source_ref_required: true;
  source_ref_must_be_public_safe: true;
  raw_url_not_canonical_id: true;
  raw_provider_id_not_canonical_id: true;
  private_identifier_not_canonical_id: true;
}

export interface BoundedExternalCandidateGenerationPolicy {
  source_intake_may_prepare_candidates_later: true;
  candidate_generation_not_implemented_now: true;
  generated_candidate_is_not_proof_or_evidence: true;
  generated_candidate_is_not_source_of_truth: true;
  generated_candidate_does_not_promote_perspective: true;
  generated_candidate_does_not_mutate_work: true;
  generated_candidate_does_not_write_product: true;
  human_review_required_later: true;
}

export interface BoundedExternalProvenancePolicy {
  source_refs_required: true;
  operator_context_required: true;
  provenance_visible_to_review_surface_later: true;
  unresolved_source_status_allowed: true;
  source_status_values: BoundedExternalSourceStatusValue[];
}

export interface BoundedExternalPrivacyPolicy {
  public_safe_fixture_only_now: true;
  no_secrets_in_fixture: true;
  no_raw_oauth_tokens: true;
  no_private_urls_in_fixture: true;
  no_provider_ids_as_canonical_labels: true;
  no_thread_run_session_ids_as_canonical_labels: true;
}

export interface BoundedExternalNonAuthorityPolicy {
  not_source_of_truth: true;
  not_proof_or_evidence: true;
  not_perspective_state: true;
  not_work_status: true;
  not_promotion_basis: true;
  not_retrieval_rag_result: true;
  not_salience_authority: true;
  not_product_write: true;
  source_reference_not_evidence_record: true;
  provider_summary_not_evidence_record: true;
  retrieval_result_not_authority: true;
}

export interface BoundedExternalAuthorityBoundary {
  contract_only: true;
  bounded_external_source_intake_contract_defined_now: true;
  runtime_source_fetch_implemented_now: false;
  crawler_implemented_now: false;
  provider_extraction_implemented_now: false;
  retrieval_rag_implemented_now: false;
  source_index_write_now: false;
  durable_source_record_write_now: false;
  candidate_generation_now: false;
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

export interface BoundedExternalValidationPolicy {
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
}

export interface BoundedExternalSourceReference {
  source_ref_id: string;
  source_input_kind: BoundedExternalAllowedSourceInputKind;
  source_status: BoundedExternalSourceStatusValue;
  reference_label: string;
  public_safe_ref: string;
  source_refs: string[];
  operator_context_ref: string;
  public_safe: true;
  accepted_as_reference_only_now: true;
  source_fetch_now: false;
  provider_extraction_now: false;
  candidate_generation_later_only: true;
}

export interface BoundedExternalSourceIntakeReferenceBundle {
  source_intake_bundle_id: string;
  intake_version: "bounded_external_source_intake.v0.1";
  generated_at: string;
  scope: string;
  source_refs: BoundedExternalSourceReference[];
  disallowed_source_inputs: BoundedExternalDisallowedSourceInputPolicy[];
  source_reference_policy_ref: string;
  candidate_generation_policy_ref: string;
  provenance_policy_ref: string;
  privacy_policy_ref: string;
  non_authority_policy_ref: string;
  authority_boundary: BoundedExternalAuthorityBoundary;
  validation: BoundedExternalValidationPolicy;
}

export interface BoundedExternalSourceIntakeContract {
  contract_kind: BoundedExternalSourceIntakeContractKind;
  contract_version: BoundedExternalSourceIntakeContractVersion;
  source_salience_governor_validation_ref: string;
  intake_scope: BoundedExternalSourceIntakeScope;
  allowed_source_inputs: BoundedExternalAllowedSourceInputPolicy[];
  disallowed_source_inputs: BoundedExternalDisallowedSourceInputPolicy[];
  source_reference_policy: BoundedExternalSourceReferencePolicy;
  candidate_generation_policy: BoundedExternalCandidateGenerationPolicy;
  provenance_policy: BoundedExternalProvenancePolicy;
  privacy_policy: BoundedExternalPrivacyPolicy;
  non_authority_policy: BoundedExternalNonAuthorityPolicy;
  sample_source_intake_reference_bundle: BoundedExternalSourceIntakeReferenceBundle;
  authority_boundary: BoundedExternalAuthorityBoundary;
  validation_policy: BoundedExternalValidationPolicy;
  recommendation_status: "ready_for_bounded_external_source_intake_implementation_v0_1";
  next_recommended_slice: "bounded_external_source_intake_implementation_v0_1";
  contract_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
}
