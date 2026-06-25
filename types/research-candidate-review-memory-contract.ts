// Type-only contract for Research Candidate Review Memory v0.1.
// This contract is contract-only: not runtime memory storage, not DB
// query/write, not proof/evidence, not Perspective promotion, not durable
// Perspective state, not work mutation, not Git Ledger export, and not product
// write.

export type ResearchCandidateReviewMemoryContractVersion =
  "research_candidate_review_memory_contract.v0.1";

export type ResearchCandidateReviewMemoryRecordVersion =
  "research_candidate_review_memory_record.v0.1";

export type ResearchCandidateReviewMemoryBundleVersion =
  "research_candidate_review_memory_contract_bundle.v0.1";

export type ResearchCandidateReviewMemoryScope = "project:augnes";

export type ResearchCandidateReviewMemoryStatus = "contract_only";

export type ResearchCandidateReviewMemoryRecordKind =
  | "candidate_review_snapshot"
  | "operator_review_note"
  | "discard_record"
  | "feedback_summary"
  | "handoff_summary"
  | "diagnostic_summary"
  | "profile_summary";

export type ResearchCandidateReviewMemoryLifecycleState =
  | "draft"
  | "active"
  | "discarded"
  | "superseded"
  | "archived";

export type ResearchCandidateReviewMemoryReviewDecision =
  | "none"
  | "keep_for_review"
  | "discard"
  | "supersede"
  | "needs_more_evidence"
  | "needs_operator_review";

export type ResearchCandidateReviewMemorySourceSurface =
  | "research_candidate_lifecycle_read_model"
  | "research_candidate_calibration_diagnostic"
  | "logical_claim_shape_preview"
  | "feedback_to_rule_candidate"
  | "temporal_handoff_diagnostic_sections"
  | "target_agent_ai_context_packet_profiles"
  | "operator_note"
  | "manual_source_ref"
  | "unknown";

export type ResearchCandidateReviewMemoryPrivacyClass =
  | "public_safe"
  | "private_ref_only"
  | "blocked_raw_private_payload";

export type ResearchCandidateReviewMemoryReasonCode =
  | "candidate_ref_present"
  | "candidate_ref_missing"
  | "source_ref_present"
  | "source_ref_missing"
  | "operator_review_required"
  | "discard_is_not_deletion"
  | "supersede_preserves_lineage"
  | "privacy_boundary_preserved"
  | "raw_payload_blocked"
  | "contract_only_not_runtime_memory"
  | "candidate_memory_not_truth"
  | "review_memory_not_promotion"
  | "product_write_denied";

export interface ResearchCandidateReviewMemoryAuthorityBoundary {
  contract_only: true;
  runtime_memory_write_now: false;
  db_query_or_write_now: false;
  source_of_truth: false;
  proof_or_evidence_record: false;
  perspective_promotion: false;
  durable_perspective_state: false;
  work_mutation: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  provider_openai_authority: false;
  source_fetch_authority: false;
  retrieval_rag_authority: false;
  git_ledger_export_authority: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
}

export interface ResearchCandidateReviewMemorySourceRef {
  source_surface: ResearchCandidateReviewMemorySourceSurface;
  source_ref: string;
  source_version?: string;
  public_safe: boolean;
}

export interface ResearchCandidateReviewMemoryPrivacyReport {
  privacy_class: ResearchCandidateReviewMemoryPrivacyClass;
  public_safe: boolean;
  raw_conversation_included: false;
  hidden_reasoning_included: false;
  raw_source_body_included: false;
  raw_candidate_payload_included: false;
  raw_provider_output_included: false;
  provider_thread_run_session_ids_included: false;
  private_urls_included: false;
  local_private_paths_included: false;
  secrets_included: false;
  raw_db_rows_included: false;
  raw_browser_dump_included: false;
  blocked_reason_codes: string[];
}

export interface ResearchCandidateReviewMemoryRecord {
  record_version: ResearchCandidateReviewMemoryRecordVersion;
  scope: ResearchCandidateReviewMemoryScope;
  status: ResearchCandidateReviewMemoryStatus;
  record_id: string;
  record_kind: ResearchCandidateReviewMemoryRecordKind;
  lifecycle_state: ResearchCandidateReviewMemoryLifecycleState;
  candidate_ref: string;
  candidate_family?: string;
  source_refs: ResearchCandidateReviewMemorySourceRef[];
  related_record_refs: string[];
  review_decision: ResearchCandidateReviewMemoryReviewDecision;
  bounded_summary: string;
  operator_note_summary?: string;
  created_at: string;
  updated_at: string;
  supersedes_record_ref?: string;
  discard_reason?: string;
  privacy_report: ResearchCandidateReviewMemoryPrivacyReport;
  reason_codes: ResearchCandidateReviewMemoryReasonCode[];
  authority_boundary: ResearchCandidateReviewMemoryAuthorityBoundary;
}

export interface ResearchCandidateReviewMemoryContractBundle {
  bundle_version: ResearchCandidateReviewMemoryBundleVersion;
  contract_version: ResearchCandidateReviewMemoryContractVersion;
  scope: ResearchCandidateReviewMemoryScope;
  status: ResearchCandidateReviewMemoryStatus;
  as_of: string;
  source_fixture_refs: string[];
  records: ResearchCandidateReviewMemoryRecord[];
  record_kind_counts: Record<ResearchCandidateReviewMemoryRecordKind, number>;
  lifecycle_state_counts: Record<ResearchCandidateReviewMemoryLifecycleState, number>;
  review_decision_counts: Record<ResearchCandidateReviewMemoryReviewDecision, number>;
  privacy_class_counts: Record<ResearchCandidateReviewMemoryPrivacyClass, number>;
  boundary_notes: string[];
  authority_boundary: ResearchCandidateReviewMemoryAuthorityBoundary;
  bundle_fingerprint: string;
}

export interface ResearchCandidateReviewMemoryValidationResult {
  passed: boolean;
  failure_codes: string[];
}

export type ResearchCandidateReviewMemoryStoreVersion =
  "research_candidate_review_memory_store.v0.1";

export type ResearchCandidateReviewMemoryStoreStatus = "local_store_snapshot";

export interface ResearchCandidateReviewMemoryStoreAuthorityBoundary {
  local_store_only: true;
  explicit_file_write_only: true;
  runtime_route_added_now: false;
  ui_added_now: false;
  db_migration_added_now: false;
  db_query_or_write_now: false;
  provider_openai_call_now: false;
  source_fetch_now: false;
  retrieval_rag_execution_now: false;
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

export interface ResearchCandidateReviewMemoryStoreSnapshot {
  store_version: ResearchCandidateReviewMemoryStoreVersion;
  contract_version: ResearchCandidateReviewMemoryContractVersion;
  scope: ResearchCandidateReviewMemoryScope;
  status: ResearchCandidateReviewMemoryStoreStatus;
  as_of: string;
  records: ResearchCandidateReviewMemoryRecord[];
  record_order: string[];
  record_count: number;
  discarded_record_refs: string[];
  superseded_record_refs: string[];
  active_record_refs: string[];
  boundary_notes: string[];
  authority_boundary: ResearchCandidateReviewMemoryStoreAuthorityBoundary;
  store_fingerprint: string;
}

export interface ResearchCandidateReviewMemoryStoreInput {
  scope: ResearchCandidateReviewMemoryScope;
  as_of: string;
  records?: ResearchCandidateReviewMemoryRecord[];
}

export interface ResearchCandidateReviewMemoryDiscardInput {
  record_id: string;
  discard_reason: string;
  updated_at: string;
}

export interface ResearchCandidateReviewMemorySupersedeInput {
  record_id: string;
  superseding_record: ResearchCandidateReviewMemoryRecord;
}
