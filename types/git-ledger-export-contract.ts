// Contract-only Git Ledger Export v0.1 shape.
// This file defines future public-safe ledger packet contracts only. It does
// not implement Git Ledger export runtime, Git writes, commits, branches, tags,
// GitHub API calls, pull request creation, repository file writes, DB access,
// routes, UI, provider calls, retrieval/RAG execution, source fetch,
// Perspective state mutation, proof/evidence writes, Codex/GitHub automation,
// or product writes.

export const GitLedgerExportContractVersion =
  "git_ledger_export_contract.v0.1" as const;
export const GitLedgerLineageRefVersion =
  "git_ledger_lineage_ref.v0.1" as const;
export const GitLedgerPacketVersion = "git_ledger_packet.v0.1" as const;
export const GitLedgerEntryVersion = "git_ledger_entry.v0.1" as const;
export const GitLedgerExportBundleVersion =
  "git_ledger_export_bundle.v0.1" as const;
export const GitLedgerExportRuntimeScope = "project:augnes" as const;
export const GitLedgerExportRuntimeStatus = "contract_only" as const;

export const GitLedgerEntryKinds = [
  "perspective_state_apply",
  "formation_receipt",
  "promotion_decision",
  "dogfooding_record",
  "feedback_aggregate",
  "runtime_audit",
  "manual_anchor",
  "surfacing_preview",
  "trajectory",
  "source_intake",
  "provider_extraction",
  "retrieval_index",
  "unknown",
] as const;
export type GitLedgerEntryKind = (typeof GitLedgerEntryKinds)[number];

export const GitLedgerExportStatuses = [
  "contract_only",
  "candidate_only",
  "ready_for_future_operator_export",
  "blocked_private_or_raw_payload",
  "blocked_missing_lineage",
  "blocked_forbidden_authority",
  "rejected",
] as const;
export type GitLedgerExportStatus = (typeof GitLedgerExportStatuses)[number];

export const GitLedgerLineageRefKinds = [
  "durable_state_apply",
  "formation_receipt",
  "promotion_decision",
  "dogfooding_record",
  "dogfooding_review_cue",
  "feedback_aggregate",
  "surfacing_preview",
  "runtime_audit",
  "manual_anchor",
  "perspective_trajectory",
  "source_ref",
  "review_record",
  "provider_extraction",
  "retrieval_index",
  "unknown",
] as const;
export type GitLedgerLineageRefKind =
  (typeof GitLedgerLineageRefKinds)[number];

export const GitLedgerPrivacyClasses = [
  "public_safe_summary",
  "private_ref_only",
  "blocked_raw_private_payload",
  "blocked_secret_like_payload",
] as const;
export type GitLedgerPrivacyClass = (typeof GitLedgerPrivacyClasses)[number];

export const GitLedgerRedactionStatuses = [
  "not_needed",
  "redacted",
  "blocked_raw_payload",
  "blocked_secret_like_pattern",
  "blocked_private_location",
] as const;
export type GitLedgerRedactionStatus =
  (typeof GitLedgerRedactionStatuses)[number];

export const GitLedgerExportReasonCodes = [
  "roadmap_file_present",
  "runtime_audit_ref_present",
  "runtime_audit_ref_missing",
  "ledger_packet_present",
  "ledger_packet_missing",
  "ledger_entry_present",
  "ledger_entry_missing",
  "lineage_ref_present",
  "lineage_ref_missing",
  "bounded_summary_present",
  "bounded_summary_missing",
  "explicit_operator_export_required",
  "git_export_runtime_not_implemented",
  "git_write_not_executed",
  "git_commit_not_created",
  "git_branch_not_created",
  "git_tag_not_created",
  "github_api_not_called",
  "pull_request_not_created",
  "repository_file_not_written",
  "db_write_not_executed",
  "product_write_denied",
  "product_write_not_executed",
  "ledger_packet_is_not_commit",
  "ledger_packet_is_not_truth",
  "ledger_packet_is_not_proof",
  "ledger_packet_is_not_accepted_evidence",
  "ledger_packet_is_not_product_write",
  "durable_state_not_mutated",
  "formation_receipt_not_written",
  "promotion_not_executed",
  "proof_not_created",
  "evidence_not_created",
  "claim_evidence_not_written",
  "provider_call_not_executed",
  "prompt_not_sent",
  "retrieval_not_executed",
  "rag_answer_not_generated",
  "source_fetch_not_executed",
  "file_read_not_executed",
  "raw_conversation_blocked",
  "hidden_reasoning_blocked",
  "telemetry_dump_blocked",
  "private_or_raw_payload_blocked",
  "secret_like_pattern_blocked",
  "local_path_blocked",
  "private_url_blocked",
] as const;
export type GitLedgerExportReasonCode =
  (typeof GitLedgerExportReasonCodes)[number];

export interface GitLedgerExportAuthorityBoundary {
  contract_only: true;
  git_ledger_export_runtime_now: false;
  git_write_now: false;
  git_commit_now: false;
  git_branch_now: false;
  git_tag_now: false;
  github_api_call_now: false;
  pull_request_creation_now: false;
  repository_file_write_now: false;
  db_query_or_write_now: false;
  route_now: false;
  ui_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  retrieval_execution_now: false;
  rag_answer_generation_now: false;
  source_fetch_now: false;
  local_file_read_now: false;
  repository_file_read_now: false;
  uploaded_file_read_now: false;
  browser_log_ingestion_now: false;
  session_log_ingestion_now: false;
  raw_conversation_ingestion_now: false;
  telemetry_ingestion_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  promotion_execution_now: false;
  promotion_decision_record_write_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  product_write_now: false;
  product_id_allocation_now: false;
  candidate_mutation_now: false;
  rule_mutation_now: false;
  parser_mutation_now: false;
  work_mutation_now: false;
  embedding_created_now: false;
  vector_search_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  ledger_packet_is_commit: false;
  ledger_packet_is_truth: false;
  ledger_packet_is_proof: false;
  ledger_packet_is_accepted_evidence: false;
  ledger_packet_is_product_write: false;
  product_write_authority: false;
}

export interface GitLedgerLineageRef {
  lineage_ref_version: typeof GitLedgerLineageRefVersion;
  scope: typeof GitLedgerExportRuntimeScope;
  lineage_ref_id: string;
  lineage_ref_kind: GitLedgerLineageRefKind;
  bounded_summary: string;
  source_refs: string[];
  privacy_class: GitLedgerPrivacyClass;
  redaction_status: GitLedgerRedactionStatus;
  public_safe: boolean;
  reason_codes: GitLedgerExportReasonCode[];
  authority_boundary: GitLedgerExportAuthorityBoundary;
}

export interface GitLedgerEntry {
  entry_version: typeof GitLedgerEntryVersion;
  scope: typeof GitLedgerExportRuntimeScope;
  entry_id: string;
  entry_kind: GitLedgerEntryKind;
  bounded_title: string;
  bounded_summary: string;
  lineage_refs: GitLedgerLineageRef[];
  public_safe: boolean;
  privacy_class: GitLedgerPrivacyClass;
  redaction_status: GitLedgerRedactionStatus;
  reason_codes: GitLedgerExportReasonCode[];
  authority_boundary: GitLedgerExportAuthorityBoundary;
}

export interface GitLedgerPacket {
  packet_version: typeof GitLedgerPacketVersion;
  contract_version: typeof GitLedgerExportContractVersion;
  scope: typeof GitLedgerExportRuntimeScope;
  status: GitLedgerExportStatus;
  packet_id: string;
  runtime_audit_refs: string[];
  entries: GitLedgerEntry[];
  boundary_notes: string[];
  privacy_class: GitLedgerPrivacyClass;
  redaction_status: GitLedgerRedactionStatus;
  public_safe: boolean;
  reason_codes: GitLedgerExportReasonCode[];
  authority_boundary: GitLedgerExportAuthorityBoundary;
  packet_fingerprint: string;
}

export interface GitLedgerExportBundle {
  bundle_version: typeof GitLedgerExportBundleVersion;
  contract_version: typeof GitLedgerExportContractVersion;
  scope: typeof GitLedgerExportRuntimeScope;
  status: typeof GitLedgerExportRuntimeStatus;
  as_of: string;
  roadmap_ref: "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
  source_fixture_refs: string[];
  packets: GitLedgerPacket[];
  entry_kind_counts: Record<GitLedgerEntryKind, number>;
  lineage_ref_kind_counts: Record<GitLedgerLineageRefKind, number>;
  export_status_counts: Record<GitLedgerExportStatus, number>;
  privacy_class_counts: Record<GitLedgerPrivacyClass, number>;
  redaction_status_counts: Record<GitLedgerRedactionStatus, number>;
  boundary_notes: string[];
  reason_codes: GitLedgerExportReasonCode[];
  authority_boundary: GitLedgerExportAuthorityBoundary;
  bundle_fingerprint: string;
}

export interface GitLedgerExportValidationResult {
  passed: boolean;
  failure_codes: string[];
}
