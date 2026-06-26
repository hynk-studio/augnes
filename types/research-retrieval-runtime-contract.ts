// Type-only contract for future Research Retrieval/RAG Runtime v0.1.
// This file defines public-safe, rebuildable, non-authoritative contract shapes.
// It does not implement retrieval, RAG, query execution, embeddings, vector
// search, index reads/writes, corpus scans, reranking, provider calls, source
// fetch, file reads, DB reads/writes, routes, UI, proof/evidence writes,
// Perspective promotion, Git Ledger export, product writes, or product IDs.

export type ResearchRetrievalRuntimeContractVersion =
  "research_retrieval_runtime_contract.v0.1";

export type ResearchRetrievalScope = "project:augnes";

export type ResearchRetrievalContractStatus = "contract_only";

export type ResearchRetrievalRequestVersion =
  "research_retrieval_request.v0.1";

export type ResearchRetrievalCorpusDescriptorVersion =
  "research_retrieval_corpus_descriptor.v0.1";

export type ResearchRetrievalQueryDescriptorVersion =
  "research_retrieval_query_descriptor.v0.1";

export type ResearchRetrievalCandidateVersion =
  "research_retrieval_candidate.v0.1";

export type ResearchRetrievalResultEnvelopeVersion =
  "research_retrieval_result_envelope.v0.1";

export type ResearchRetrievalContractBundleVersion =
  "research_retrieval_contract_bundle.v0.1";

export type ResearchRetrievalInputKind =
  | "bounded_source_intake_result_envelope"
  | "bounded_source_intake_runtime_report"
  | "provider_assisted_extraction_candidate_output"
  | "review_memory_ref"
  | "candidate_summary_ref"
  | "perspective_delta_summary_ref"
  | "formation_receipt_summary_ref"
  | "feedback_summary_ref"
  | "source_ref"
  | "manual_bounded_context"
  | "unknown";

export type ResearchRetrievalCorpusKind =
  | "source_ref_metadata_set"
  | "candidate_summary_set"
  | "review_note_set"
  | "perspective_delta_summary_set"
  | "formation_receipt_summary_set"
  | "feedback_summary_set"
  | "manual_bounded_context_set"
  | "unknown";

export type ResearchRetrievalMode =
  | "metadata_lookup"
  | "lexical_candidate_retrieval"
  | "semantic_candidate_retrieval"
  | "hybrid_candidate_retrieval"
  | "rerank_candidate_preview"
  | "rag_context_preview"
  | "citation_context_preview"
  | "no_retrieval"
  | "unknown";

export type ResearchRetrievalRequestStatus =
  | "candidate_only"
  | "needs_operator_review"
  | "blocked_private_or_raw_payload"
  | "blocked_missing_corpus"
  | "blocked_unsupported_mode"
  | "accepted_for_future_runtime"
  | "rejected";

export type ResearchRetrievalCandidateKind =
  | "source_ref_candidate"
  | "candidate_summary_candidate"
  | "review_note_candidate"
  | "provider_candidate_output_ref"
  | "perspective_delta_summary_candidate"
  | "formation_receipt_summary_candidate"
  | "feedback_summary_candidate"
  | "gap_context_candidate"
  | "contradiction_context_candidate"
  | "citation_context_candidate"
  | "rag_context_candidate"
  | "unknown";

export type ResearchRetrievalPrivacyClass =
  | "public_safe_refs_only"
  | "private_ref_only"
  | "blocked_raw_private_payload"
  | "blocked_secret_like_payload";

export type ResearchRetrievalRedactionStatus =
  | "not_needed"
  | "redacted"
  | "blocked_secret_like_pattern"
  | "blocked_raw_payload"
  | "blocked_private_location";

export type ResearchRetrievalScoreBand = "none" | "low" | "medium" | "high";

export type ResearchRetrievalReviewStatus =
  | "candidate_only"
  | "needs_review"
  | "rejected"
  | "accepted_for_future_runtime"
  | "superseded";

export type ResearchRetrievalReasonCode =
  | "roadmap_file_present"
  | "roadmap_file_missing"
  | "corpus_ref_present"
  | "corpus_ref_missing"
  | "query_ref_present"
  | "query_ref_missing"
  | "source_ref_present"
  | "source_ref_missing"
  | "candidate_summary_ref_present"
  | "candidate_summary_ref_missing"
  | "review_memory_ref_present"
  | "review_memory_ref_missing"
  | "durable_summary_ref_present"
  | "durable_summary_ref_missing"
  | "input_kind_supported"
  | "input_kind_unknown"
  | "corpus_kind_supported"
  | "corpus_kind_unknown"
  | "retrieval_mode_supported"
  | "retrieval_mode_unknown"
  | "candidate_kind_supported"
  | "candidate_kind_unknown"
  | "raw_payload_blocked"
  | "secret_like_pattern_blocked"
  | "private_location_blocked"
  | "operator_review_required"
  | "retrieval_not_executed"
  | "rag_not_executed"
  | "embedding_not_created"
  | "vector_search_not_executed"
  | "index_read_not_executed"
  | "index_write_not_executed"
  | "corpus_scan_not_executed"
  | "rerank_not_executed"
  | "provider_call_not_executed"
  | "prompt_not_sent"
  | "provider_output_not_stored"
  | "retrieval_output_not_stored"
  | "source_fetch_not_executed"
  | "local_file_read_not_executed"
  | "repository_file_read_not_executed"
  | "uploaded_file_read_not_executed"
  | "db_query_not_executed"
  | "db_write_not_executed"
  | "candidate_context_not_truth"
  | "retrieval_result_not_evidence"
  | "retrieval_score_not_truth_score"
  | "retrieval_score_not_promotion_readiness"
  | "rag_answer_context_preview_only"
  | "source_ref_not_proof"
  | "accepted_for_future_runtime_not_execution"
  | "product_write_denied";

export interface ResearchRetrievalAuthorityBoundary {
  contract_only: true;
  retrieval_runtime_now: false;
  rag_execution_now: false;
  query_execution_now: false;
  embedding_created_now: false;
  vector_search_now: false;
  rerank_now: false;
  index_read_now: false;
  index_write_now: false;
  corpus_scan_now: false;
  source_fetch_now: false;
  local_file_read_now: false;
  repository_file_read_now: false;
  uploaded_file_read_now: false;
  raw_source_body_storage_now: false;
  raw_retrieval_output_storage_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  provider_output_stored_now: false;
  db_query_or_write_now: false;
  source_of_truth: false;
  proof_or_evidence_record: false;
  claim_or_evidence_write_now: false;
  perspective_promotion: false;
  durable_perspective_state: false;
  work_mutation: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  git_ledger_export_authority: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
}

export interface ResearchRetrievalInputRef {
  input_kind: ResearchRetrievalInputKind;
  input_ref: string;
  source_refs: string[];
  candidate_refs: string[];
  review_memory_refs: string[];
  durable_summary_refs: string[];
  feedback_refs: string[];
  public_safe: boolean;
  privacy_class: ResearchRetrievalPrivacyClass;
  redaction_status: ResearchRetrievalRedactionStatus;
  reason_codes: ResearchRetrievalReasonCode[];
}

export interface ResearchRetrievalCorpusDescriptor {
  corpus_descriptor_version: ResearchRetrievalCorpusDescriptorVersion;
  scope: ResearchRetrievalScope;
  corpus_id: string;
  corpus_kind: ResearchRetrievalCorpusKind;
  corpus_ref: string;
  input_refs: ResearchRetrievalInputRef[];
  allowed_candidate_kinds: ResearchRetrievalCandidateKind[];
  rebuildable: true;
  derived_non_authoritative: true;
  stale_index_cannot_override_current_state: true;
  privacy_class: ResearchRetrievalPrivacyClass;
  redaction_status: ResearchRetrievalRedactionStatus;
  public_safe: boolean;
  reason_codes: ResearchRetrievalReasonCode[];
  authority_boundary: ResearchRetrievalAuthorityBoundary;
}

export interface ResearchRetrievalQueryDescriptor {
  query_descriptor_version: ResearchRetrievalQueryDescriptorVersion;
  scope: ResearchRetrievalScope;
  query_id: string;
  retrieval_mode: ResearchRetrievalMode;
  bounded_query_summary: string;
  requested_candidate_kinds: ResearchRetrievalCandidateKind[];
  source_refs: string[];
  candidate_refs: string[];
  durable_summary_refs: string[];
  public_safe: boolean;
  redaction_status: ResearchRetrievalRedactionStatus;
  reason_codes: ResearchRetrievalReasonCode[];
  authority_boundary: ResearchRetrievalAuthorityBoundary;
}

export type ResearchRetrievalRequestedBySurface =
  | "operator"
  | "bounded_source_intake_runtime"
  | "provider_assisted_extraction_runtime"
  | "review_memory_ui"
  | "foundation_lifecycle_review_memory_readonly_ui"
  | "target_agent_packet_profile"
  | "roadmap_guided_codex_slice"
  | "unknown";

export interface ResearchRetrievalRequest {
  request_version: ResearchRetrievalRequestVersion;
  contract_version: ResearchRetrievalRuntimeContractVersion;
  scope: ResearchRetrievalScope;
  request_id: string;
  request_status: ResearchRetrievalRequestStatus;
  requested_at: string;
  requested_by_surface: ResearchRetrievalRequestedBySurface;
  corpus_descriptor: ResearchRetrievalCorpusDescriptor;
  query_descriptor: ResearchRetrievalQueryDescriptor;
  bounded_purpose: string;
  expected_candidate_refs: string[];
  boundary_notes: string[];
  reason_codes: ResearchRetrievalReasonCode[];
  authority_boundary: ResearchRetrievalAuthorityBoundary;
}

export interface ResearchRetrievalCandidate {
  candidate_version: ResearchRetrievalCandidateVersion;
  contract_version: ResearchRetrievalRuntimeContractVersion;
  scope: ResearchRetrievalScope;
  request_id: string;
  candidate_id: string;
  candidate_kind: ResearchRetrievalCandidateKind;
  candidate_ref: string;
  bounded_context_summary: string;
  source_refs: string[];
  candidate_refs: string[];
  review_memory_refs: string[];
  durable_summary_refs: string[];
  feedback_refs: string[];
  score_band: ResearchRetrievalScoreBand;
  review_status: ResearchRetrievalReviewStatus;
  retrieval_executed: false;
  rag_executed: false;
  embedding_created: false;
  vector_search_executed: false;
  index_read_executed: false;
  index_write_executed: false;
  corpus_scan_executed: false;
  rerank_executed: false;
  provider_call_executed: false;
  prompt_sent: false;
  provider_output_stored: false;
  retrieval_output_stored: false;
  proof_or_evidence_created: false;
  claim_or_evidence_written: false;
  perspective_promoted: false;
  product_write_executed: false;
  reason_codes: ResearchRetrievalReasonCode[];
  authority_boundary: ResearchRetrievalAuthorityBoundary;
}

export interface ResearchRetrievalResultEnvelope {
  result_version: ResearchRetrievalResultEnvelopeVersion;
  contract_version: ResearchRetrievalRuntimeContractVersion;
  scope: ResearchRetrievalScope;
  status: ResearchRetrievalContractStatus;
  request_id: string;
  accepted_for_future_runtime: boolean;
  candidate_refs: string[];
  source_refs: string[];
  review_memory_refs: string[];
  durable_summary_refs: string[];
  feedback_refs: string[];
  retrieval_executed: false;
  rag_executed: false;
  embedding_created: false;
  vector_search_executed: false;
  index_read_executed: false;
  index_write_executed: false;
  corpus_scan_executed: false;
  rerank_executed: false;
  provider_call_executed: false;
  prompt_sent: false;
  provider_output_stored: false;
  retrieval_output_stored: false;
  proof_or_evidence_created: false;
  claim_or_evidence_written: false;
  product_write_executed: false;
  reason_codes: ResearchRetrievalReasonCode[];
  authority_boundary: ResearchRetrievalAuthorityBoundary;
}

export interface ResearchRetrievalContractBundle {
  bundle_version: ResearchRetrievalContractBundleVersion;
  contract_version: ResearchRetrievalRuntimeContractVersion;
  scope: ResearchRetrievalScope;
  status: ResearchRetrievalContractStatus;
  as_of: string;
  roadmap_ref: "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
  source_fixture_refs: string[];
  requests: ResearchRetrievalRequest[];
  candidates: ResearchRetrievalCandidate[];
  result_envelopes: ResearchRetrievalResultEnvelope[];
  input_kind_counts: Record<ResearchRetrievalInputKind, number>;
  corpus_kind_counts: Record<ResearchRetrievalCorpusKind, number>;
  retrieval_mode_counts: Record<ResearchRetrievalMode, number>;
  request_status_counts: Record<ResearchRetrievalRequestStatus, number>;
  candidate_kind_counts: Record<ResearchRetrievalCandidateKind, number>;
  review_status_counts: Record<ResearchRetrievalReviewStatus, number>;
  privacy_class_counts: Record<ResearchRetrievalPrivacyClass, number>;
  redaction_status_counts: Record<ResearchRetrievalRedactionStatus, number>;
  boundary_notes: string[];
  authority_boundary: ResearchRetrievalAuthorityBoundary;
  bundle_fingerprint: string;
}

export interface ResearchRetrievalValidationResult {
  passed: boolean;
  failure_codes: string[];
}
