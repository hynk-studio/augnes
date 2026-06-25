// Type-only contract for future Provider-Assisted Extraction Candidate-Only v0.1.
// This contract is candidate-contract-only: not provider/OpenAI calls, not prompt
// sending, not provider output storage, not source fetch, not file reads, not
// retrieval/RAG, not DB query/write, not proof/evidence, not Perspective
// promotion, not durable Perspective state, not work mutation, not Git Ledger
// export, and not product write.

export type ProviderAssistedExtractionCandidateOnlyContractVersion =
  "provider_assisted_extraction_candidate_only_contract.v0.1";

export type ProviderAssistedExtractionScope = "project:augnes";

export type ProviderAssistedExtractionContractStatus =
  "candidate_contract_only";

export type ProviderAssistedExtractionRequestVersion =
  "provider_assisted_extraction_candidate_request.v0.1";

export type ProviderAssistedExtractionPromptDescriptorVersion =
  "provider_assisted_extraction_prompt_descriptor.v0.1";

export type ProviderAssistedExtractionCandidateOutputVersion =
  "provider_assisted_extraction_candidate_output.v0.1";

export type ProviderAssistedExtractionContractBundleVersion =
  "provider_assisted_extraction_candidate_contract_bundle.v0.1";

export type ProviderAssistedExtractionInputKind =
  | "bounded_source_intake_result_envelope"
  | "bounded_source_intake_runtime_report"
  | "bounded_summary_ref"
  | "source_ref"
  | "review_memory_ref"
  | "manual_bounded_context"
  | "unknown";

export type ProviderAssistedExtractionTargetKind =
  | "claim_candidate"
  | "evidence_candidate"
  | "source_summary_candidate"
  | "knowledge_gap_signal"
  | "contradiction_signal"
  | "calibration_signal"
  | "logical_shape_hint"
  | "handoff_hint"
  | "unknown";

export type ProviderAssistedExtractionMode =
  | "summarize_only"
  | "candidate_claim_extraction"
  | "candidate_evidence_mapping"
  | "gap_signal_detection"
  | "contradiction_signal_detection"
  | "calibration_signal_detection"
  | "logical_shape_hinting"
  | "metadata_only"
  | "unknown";

export type ProviderAssistedExtractionRequestStatus =
  | "candidate_only"
  | "needs_operator_review"
  | "blocked_private_or_raw_payload"
  | "blocked_missing_bounded_source"
  | "blocked_unsupported_target"
  | "accepted_for_future_provider_run"
  | "rejected";

export type ProviderAssistedExtractionCandidateReviewStatus =
  | "candidate_only"
  | "needs_review"
  | "rejected"
  | "accepted_for_future_runtime"
  | "superseded";

export type ProviderAssistedExtractionPrivacyClass =
  | "public_safe_bounded_input"
  | "private_ref_only"
  | "blocked_raw_private_payload"
  | "blocked_secret_like_payload";

export type ProviderAssistedExtractionRedactionStatus =
  | "not_needed"
  | "redacted"
  | "blocked_secret_like_pattern"
  | "blocked_raw_payload"
  | "blocked_private_location";

export type ProviderAssistedExtractionConfidencePreview =
  | "low"
  | "medium"
  | "high";

export type ProviderAssistedExtractionReasonCode =
  | "bounded_source_ref_present"
  | "bounded_source_ref_missing"
  | "bounded_summary_ref_present"
  | "bounded_summary_ref_missing"
  | "source_ref_present"
  | "source_ref_missing"
  | "input_kind_supported"
  | "input_kind_unknown"
  | "target_kind_supported"
  | "target_kind_unknown"
  | "prompt_descriptor_present"
  | "prompt_descriptor_missing"
  | "prompt_not_sent"
  | "provider_call_not_executed"
  | "provider_output_not_stored"
  | "source_fetch_not_executed"
  | "local_file_read_not_executed"
  | "retrieval_not_executed"
  | "raw_payload_blocked"
  | "secret_like_pattern_blocked"
  | "operator_review_required"
  | "candidate_output_shape_defined"
  | "candidate_only_not_truth"
  | "source_ref_not_proof"
  | "accepted_for_future_provider_run_not_execution"
  | "product_write_denied";

export interface ProviderAssistedExtractionAuthorityBoundary {
  candidate_contract_only: true;
  provider_call_now: false;
  prompt_sent_now: false;
  provider_output_stored_now: false;
  source_fetch_now: false;
  local_file_read_now: false;
  repository_file_read_now: false;
  uploaded_file_read_now: false;
  raw_source_body_storage_now: false;
  retrieval_rag_execution_now: false;
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

export interface ProviderAssistedExtractionInputRef {
  input_kind: ProviderAssistedExtractionInputKind;
  input_ref: string;
  source_refs: string[];
  bounded_summary_refs: string[];
  public_safe: boolean;
  privacy_class: ProviderAssistedExtractionPrivacyClass;
  redaction_status: ProviderAssistedExtractionRedactionStatus;
  reason_codes: ProviderAssistedExtractionReasonCode[];
}

export interface ProviderAssistedExtractionPromptDescriptor {
  prompt_descriptor_version: ProviderAssistedExtractionPromptDescriptorVersion;
  scope: ProviderAssistedExtractionScope;
  prompt_descriptor_id: string;
  mode: ProviderAssistedExtractionMode;
  bounded_prompt_summary: string;
  allowed_input_refs: string[];
  forbidden_input_classes: string[];
  redaction_status: ProviderAssistedExtractionRedactionStatus;
  public_safe: boolean;
  reason_codes: ProviderAssistedExtractionReasonCode[];
  authority_boundary: ProviderAssistedExtractionAuthorityBoundary;
}

export interface ProviderAssistedExtractionCandidateRequest {
  request_version: ProviderAssistedExtractionRequestVersion;
  contract_version: ProviderAssistedExtractionCandidateOnlyContractVersion;
  scope: ProviderAssistedExtractionScope;
  request_id: string;
  request_status: ProviderAssistedExtractionRequestStatus;
  requested_at: string;
  requested_by_surface:
    | "operator"
    | "bounded_source_intake_runtime"
    | "review_memory_ui"
    | "foundation_lifecycle_review_memory_readonly_ui"
    | "target_agent_packet_profile"
    | "unknown";
  input_refs: ProviderAssistedExtractionInputRef[];
  target_kinds: ProviderAssistedExtractionTargetKind[];
  extraction_mode: ProviderAssistedExtractionMode;
  prompt_descriptor: ProviderAssistedExtractionPromptDescriptor;
  bounded_purpose: string;
  expected_candidate_output_refs: string[];
  boundary_notes: string[];
  reason_codes: ProviderAssistedExtractionReasonCode[];
  authority_boundary: ProviderAssistedExtractionAuthorityBoundary;
}

export interface ProviderAssistedExtractionCandidateOutput {
  output_version: ProviderAssistedExtractionCandidateOutputVersion;
  contract_version: ProviderAssistedExtractionCandidateOnlyContractVersion;
  scope: ProviderAssistedExtractionScope;
  request_id: string;
  output_id: string;
  output_kind: ProviderAssistedExtractionTargetKind;
  candidate_ref: string;
  bounded_output_summary: string;
  source_refs: string[];
  bounded_summary_refs: string[];
  confidence_preview: ProviderAssistedExtractionConfidencePreview;
  review_status: ProviderAssistedExtractionCandidateReviewStatus;
  provider_output_included: false;
  prompt_sent: false;
  provider_call_executed: false;
  claim_or_evidence_written: false;
  proof_or_evidence_created: false;
  perspective_promoted: false;
  product_write_executed: false;
  reason_codes: ProviderAssistedExtractionReasonCode[];
  authority_boundary: ProviderAssistedExtractionAuthorityBoundary;
}

export interface ProviderAssistedExtractionContractBundle {
  bundle_version: ProviderAssistedExtractionContractBundleVersion;
  contract_version: ProviderAssistedExtractionCandidateOnlyContractVersion;
  scope: ProviderAssistedExtractionScope;
  status: ProviderAssistedExtractionContractStatus;
  as_of: string;
  source_fixture_refs: string[];
  requests: ProviderAssistedExtractionCandidateRequest[];
  candidate_outputs: ProviderAssistedExtractionCandidateOutput[];
  input_kind_counts: Record<ProviderAssistedExtractionInputKind, number>;
  target_kind_counts: Record<ProviderAssistedExtractionTargetKind, number>;
  request_status_counts: Record<ProviderAssistedExtractionRequestStatus, number>;
  review_status_counts: Record<
    ProviderAssistedExtractionCandidateReviewStatus,
    number
  >;
  privacy_class_counts: Record<ProviderAssistedExtractionPrivacyClass, number>;
  redaction_status_counts: Record<
    ProviderAssistedExtractionRedactionStatus,
    number
  >;
  boundary_notes: string[];
  authority_boundary: ProviderAssistedExtractionAuthorityBoundary;
  bundle_fingerprint: string;
}

export interface ProviderAssistedExtractionValidationResult {
  passed: boolean;
  failure_codes: string[];
}

export type ProviderAssistedExtractionRuntimeVersion =
  "provider_assisted_extraction_runtime.v0.1";

export type ProviderAssistedExtractionRuntimeStatus =
  "bounded_runtime_only";

export type ProviderAssistedExtractionRuntimeDecision =
  | "candidate_output_created"
  | "blocked_private_or_raw_payload"
  | "blocked_secret_like_payload"
  | "blocked_missing_bounded_source"
  | "blocked_unsupported_target"
  | "needs_operator_review"
  | "candidate_only"
  | "rejected";

export type ProviderAssistedExtractionRuntimeReasonCode =
  | ProviderAssistedExtractionReasonCode
  | "bounded_runtime_executed"
  | "provider_call_still_not_executed"
  | "prompt_still_not_sent"
  | "provider_output_still_not_stored"
  | "candidate_preview_present"
  | "candidate_preview_missing"
  | "candidate_preview_public_safe"
  | "candidate_preview_blocked"
  | "runtime_candidate_output_created"
  | "runtime_request_validation_passed"
  | "runtime_request_validation_failed"
  | "blocked_request_not_executed"
  | "accepted_output_not_truth"
  | "accepted_output_not_proof";

export interface ProviderAssistedExtractionRuntimeAuthorityBoundary {
  bounded_runtime_only: true;
  caller_provided_input_only: true;
  provider_call_now: false;
  prompt_sent_now: false;
  provider_output_stored_now: false;
  source_fetch_now: false;
  local_file_read_now: false;
  repository_file_read_now: false;
  uploaded_file_read_now: false;
  raw_source_body_storage_now: false;
  retrieval_rag_execution_now: false;
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

export interface ProviderAssistedExtractionRuntimeCandidatePreview {
  request_id: string;
  output_kind: ProviderAssistedExtractionTargetKind;
  candidate_ref?: string;
  bounded_output_summary: string;
  source_refs?: string[];
  bounded_summary_refs?: string[];
  confidence_preview?: ProviderAssistedExtractionConfidencePreview;
  review_status?: ProviderAssistedExtractionCandidateReviewStatus;
  public_safe: boolean;
}

export interface ProviderAssistedExtractionRuntimeInput {
  runtime_version: ProviderAssistedExtractionRuntimeVersion;
  contract_version: ProviderAssistedExtractionCandidateOnlyContractVersion;
  scope: ProviderAssistedExtractionScope;
  as_of: string;
  source_fixture_refs: string[];
  requests: ProviderAssistedExtractionCandidateRequest[];
  candidate_previews?: ProviderAssistedExtractionRuntimeCandidatePreview[];
}

export interface ProviderAssistedExtractionRuntimeDecisionRecord {
  request_id: string;
  decision: ProviderAssistedExtractionRuntimeDecision;
  requested_target_kinds?: ProviderAssistedExtractionTargetKind[];
  output_refs: string[];
  reason_codes: ProviderAssistedExtractionRuntimeReasonCode[];
}

export interface ProviderAssistedExtractionRuntimeReport {
  runtime_version: ProviderAssistedExtractionRuntimeVersion;
  contract_version: ProviderAssistedExtractionCandidateOnlyContractVersion;
  scope: ProviderAssistedExtractionScope;
  status: ProviderAssistedExtractionRuntimeStatus;
  as_of: string;
  source_fixture_refs: string[];
  candidate_outputs: ProviderAssistedExtractionCandidateOutput[];
  runtime_decisions: ProviderAssistedExtractionRuntimeDecisionRecord[];
  decision_counts: Record<ProviderAssistedExtractionRuntimeDecision, number>;
  output_kind_counts: Record<ProviderAssistedExtractionTargetKind, number>;
  review_status_counts: Record<
    ProviderAssistedExtractionCandidateReviewStatus,
    number
  >;
  boundary_notes: string[];
  authority_boundary: ProviderAssistedExtractionRuntimeAuthorityBoundary;
  runtime_report_fingerprint: string;
}

export interface ProviderAssistedExtractionRuntimeValidationResult {
  passed: boolean;
  failure_codes: string[];
}
