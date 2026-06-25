// Type-only contract for future Bounded Source Intake Runtime v0.1.
// This contract is contract-only: not source intake runtime, not source fetch,
// not local file read, not raw source body storage, not provider/OpenAI, not
// retrieval/RAG, not DB query/write, not proof/evidence, not Perspective
// promotion, not durable Perspective state, not work mutation, not Git Ledger
// export, and not product write.

export type BoundedSourceIntakeRuntimeContractVersion =
  "bounded_source_intake_runtime_contract.v0.1";

export type BoundedSourceIntakeRuntimeScope = "project:augnes";

export type BoundedSourceIntakeRuntimeContractStatus = "contract_only";

export type BoundedSourceIntakeRequestVersion =
  "bounded_source_intake_request.v0.1";

export type BoundedSourceIntakeSourceDescriptorVersion =
  "bounded_source_intake_source_descriptor.v0.1";

export type BoundedSourceIntakeResultEnvelopeVersion =
  "bounded_source_intake_result_envelope.v0.1";

export type BoundedSourceIntakeContractBundleVersion =
  "bounded_source_intake_contract_bundle.v0.1";

export type BoundedSourceIntakeSourceKind =
  | "manual_text_summary"
  | "public_url_ref"
  | "repository_file_ref"
  | "uploaded_file_ref"
  | "operator_note_ref"
  | "review_memory_ref"
  | "unknown";

export type BoundedSourceIntakeRequestStatus =
  | "candidate_only"
  | "needs_operator_review"
  | "blocked_private_or_raw_payload"
  | "blocked_unsupported_source_kind"
  | "accepted_for_future_runtime";

export type BoundedSourceIntakeSourcePrivacyClass =
  | "public_safe_ref"
  | "private_ref_only"
  | "blocked_raw_private_payload"
  | "blocked_secret_like_payload";

export type BoundedSourceIntakeRedactionStatus =
  | "not_needed"
  | "redacted"
  | "blocked_secret_like_pattern"
  | "blocked_raw_payload"
  | "blocked_private_location";

export type BoundedSourceIntakeLocatorKind =
  | "symbolic_ref"
  | "public_url_locator"
  | "repo_path_locator"
  | "uploaded_file_locator"
  | "manual_ref_locator"
  | "unknown";

export type BoundedSourceIntakeReasonCode =
  | "source_kind_supported"
  | "source_kind_unknown"
  | "source_locator_present"
  | "source_locator_missing"
  | "source_ref_public_safe"
  | "source_ref_private_ref_only"
  | "raw_source_body_blocked"
  | "private_url_blocked"
  | "local_private_path_blocked"
  | "secret_like_pattern_blocked"
  | "operator_review_required"
  | "runtime_not_implemented"
  | "source_fetch_not_executed"
  | "local_file_read_not_executed"
  | "provider_call_not_executed"
  | "retrieval_not_executed"
  | "source_ref_not_proof"
  | "product_write_denied";

export interface BoundedSourceIntakeAuthorityBoundary {
  contract_only: true;
  source_intake_runtime_now: false;
  source_fetch_now: false;
  local_file_read_now: false;
  raw_source_body_storage_now: false;
  provider_openai_call_now: false;
  retrieval_rag_execution_now: false;
  db_query_or_write_now: false;
  source_of_truth: false;
  proof_or_evidence_record: false;
  perspective_promotion: false;
  durable_perspective_state: false;
  work_mutation: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  git_ledger_export_authority: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
}

export interface BoundedSourceIntakeSourceDescriptor {
  source_descriptor_version: BoundedSourceIntakeSourceDescriptorVersion;
  scope: BoundedSourceIntakeRuntimeScope;
  source_id: string;
  source_kind: BoundedSourceIntakeSourceKind;
  locator_kind: BoundedSourceIntakeLocatorKind;
  source_locator: string;
  symbolic_source_ref: string;
  title_summary?: string;
  operator_supplied_summary?: string;
  privacy_class: BoundedSourceIntakeSourcePrivacyClass;
  redaction_status: BoundedSourceIntakeRedactionStatus;
  redaction_notes: string[];
  public_safe: boolean;
  reason_codes: BoundedSourceIntakeReasonCode[];
}

export interface BoundedSourceIntakeRequest {
  request_version: BoundedSourceIntakeRequestVersion;
  contract_version: BoundedSourceIntakeRuntimeContractVersion;
  scope: BoundedSourceIntakeRuntimeScope;
  request_id: string;
  request_status: BoundedSourceIntakeRequestStatus;
  source_descriptor: BoundedSourceIntakeSourceDescriptor;
  requested_by_surface:
    | "operator"
    | "review_memory_ui"
    | "foundation_lifecycle_review_memory_readonly_ui"
    | "target_agent_packet_profile"
    | "unknown";
  requested_at: string;
  bounded_intake_purpose: string;
  boundary_notes: string[];
  authority_boundary: BoundedSourceIntakeAuthorityBoundary;
}

export interface BoundedSourceIntakeResultEnvelope {
  result_version: BoundedSourceIntakeResultEnvelopeVersion;
  contract_version: BoundedSourceIntakeRuntimeContractVersion;
  scope: BoundedSourceIntakeRuntimeScope;
  status: BoundedSourceIntakeRuntimeContractStatus;
  request_id: string;
  accepted_for_future_runtime: boolean;
  source_refs: string[];
  bounded_summary_ref?: string;
  raw_source_body_included: false;
  source_fetch_executed: false;
  local_file_read_executed: false;
  provider_call_executed: false;
  retrieval_executed: false;
  proof_or_evidence_created: false;
  product_write_executed: false;
  reason_codes: BoundedSourceIntakeReasonCode[];
  authority_boundary: BoundedSourceIntakeAuthorityBoundary;
}

export interface BoundedSourceIntakeContractBundle {
  bundle_version: BoundedSourceIntakeContractBundleVersion;
  contract_version: BoundedSourceIntakeRuntimeContractVersion;
  scope: BoundedSourceIntakeRuntimeScope;
  status: BoundedSourceIntakeRuntimeContractStatus;
  as_of: string;
  source_fixture_refs: string[];
  requests: BoundedSourceIntakeRequest[];
  result_envelopes: BoundedSourceIntakeResultEnvelope[];
  source_kind_counts: Record<BoundedSourceIntakeSourceKind, number>;
  request_status_counts: Record<BoundedSourceIntakeRequestStatus, number>;
  privacy_class_counts: Record<BoundedSourceIntakeSourcePrivacyClass, number>;
  redaction_status_counts: Record<BoundedSourceIntakeRedactionStatus, number>;
  boundary_notes: string[];
  authority_boundary: BoundedSourceIntakeAuthorityBoundary;
  bundle_fingerprint: string;
}

export interface BoundedSourceIntakeValidationResult {
  passed: boolean;
  failure_codes: string[];
}
