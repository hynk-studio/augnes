// Contract-only Local Data Export/Import Policy v0.1 shape.
// This file defines public-safe future export/import policy contracts only. It
// does not implement export/import runtime, file reads/writes, DB access,
// routes, UI, provider calls, retrieval/RAG execution, source fetch,
// Perspective state mutation, proof/evidence writes, Formation Receipt writes,
// Git Ledger export runtime, Git/GitHub execution, Codex execution, or product
// writes.

export const LocalDataExportContractVersion =
  "local_data_export_contract.v0.1" as const;
export const LocalDataExportBundleVersion =
  "local_data_export_bundle.v0.1" as const;
export const LocalDataExportManifestVersion =
  "local_data_export_manifest.v0.1" as const;
export const LocalDataExportSectionVersion =
  "local_data_export_section.v0.1" as const;
export const LocalDataImportPreviewVersion =
  "local_data_import_preview.v0.1" as const;
export const LocalDataImportValidationFindingVersion =
  "local_data_import_validation_finding.v0.1" as const;
export const LocalDataExportImportPolicyScope = "project:augnes" as const;

export const LocalDataExportImportStatuses = [
  "contract_only",
  "policy_only",
  "candidate_export_manifest_only",
  "ready_for_future_operator_export",
  "blocked_private_or_raw_payload",
  "blocked_forbidden_import_action",
  "blocked_product_write",
  "rejected",
] as const;
export type LocalDataExportImportStatus =
  (typeof LocalDataExportImportStatuses)[number];

export const LocalDataExportDataClasses = [
  "review_records",
  "source_refs",
  "candidate_bundles",
  "promotion_decisions",
  "formation_receipts",
  "durable_perspective_state",
  "trajectory_events",
  "feedback_events",
  "layout_preferences",
  "dogfooding_records",
  "runtime_audit_events",
  "retrieval_index_metadata",
  "provider_extraction_candidates",
  "git_ledger_export_refs",
  "product_write_parked_refs",
] as const;
export type LocalDataExportDataClass =
  (typeof LocalDataExportDataClasses)[number];

export const LocalDataImportActions = [
  "preview_only",
  "validate_only",
  "restore_review_memory_candidate",
  "restore_source_ref_metadata",
  "restore_candidate_bundle_candidate",
  "restore_feedback_candidate",
  "restore_layout_preference_candidate",
  "restore_dogfooding_candidate",
  "restore_runtime_audit_reference",
  "blocked_auto_promote",
  "blocked_auto_product_write",
  "blocked_auto_proof_evidence_write",
  "blocked_auto_durable_state_apply",
  "blocked_auto_provider_call",
  "blocked_auto_retrieval_execution",
  "blocked_auto_git_github_execution",
] as const;
export type LocalDataImportAction = (typeof LocalDataImportActions)[number];

export const LocalDataPrivacyRedactionPolicies = [
  "public_safe_summary_only",
  "symbolic_refs_only",
  "reference_only",
  "redacted",
  "blocked_raw_private_payload",
  "blocked_raw_source_body",
  "blocked_provider_thread_run_session_id",
  "blocked_private_url",
  "blocked_local_private_path",
  "blocked_secret_like_pattern",
] as const;
export type LocalDataPrivacyRedactionPolicy =
  (typeof LocalDataPrivacyRedactionPolicies)[number];

export const LocalDataExportImportReasonCodes = [
  "roadmap_file_present",
  "privacy_guard_required",
  "export_policy_only",
  "import_policy_only",
  "export_manifest_contract_defined",
  "import_preview_contract_defined",
  "public_safe_summary_only",
  "source_refs_are_lineage_not_proof",
  "candidate_is_not_fact",
  "review_record_is_not_durable_state",
  "promotion_decision_required_before_state_apply",
  "formation_receipt_required_before_state_apply",
  "durable_state_import_is_preview_only",
  "feedback_is_not_truth",
  "retrieval_index_is_derived",
  "provider_output_is_candidate_only",
  "git_ledger_is_export_not_authority",
  "product_write_parked",
  "product_write_denied",
  "raw_private_payload_blocked",
  "raw_source_body_blocked",
  "provider_thread_run_session_id_blocked",
  "private_url_blocked",
  "local_private_path_blocked",
  "secret_like_pattern_blocked",
  "auto_promote_blocked",
  "auto_product_write_blocked",
  "auto_proof_evidence_write_blocked",
  "auto_durable_state_apply_blocked",
  "provider_call_not_executed",
  "retrieval_not_executed",
  "git_github_not_executed",
  "file_io_not_implemented",
  "db_write_not_executed",
] as const;
export type LocalDataExportImportReasonCode =
  (typeof LocalDataExportImportReasonCodes)[number];

export interface LocalDataExportImportAuthorityBoundary {
  local_data_export_import_policy_now: true;
  contract_only: true;
  caller_provided_policy_only: true;
  privacy_guard_required_for_future_runtime: true;
  local_export_runtime_now: false;
  local_import_runtime_now: false;
  file_write_now: false;
  file_read_now: false;
  db_query_or_write_now: false;
  route_now: false;
  ui_now: false;
  source_fetch_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  retrieval_execution_now: false;
  rag_answer_generation_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  promotion_execution_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  git_ledger_export_runtime_now: false;
  git_write_now: false;
  github_api_call_now: false;
  repository_file_write_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
  import_auto_promote_now: false;
  import_auto_product_write_now: false;
  import_auto_proof_evidence_write_now: false;
  import_auto_durable_state_apply_now: false;
  export_contains_raw_private_payload: false;
  export_contains_raw_source_body: false;
  export_contains_provider_thread_run_session_id: false;
  export_contains_private_url: false;
  export_contains_local_private_path: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
}

export interface LocalDataExportSection {
  section_version: typeof LocalDataExportSectionVersion;
  scope: typeof LocalDataExportImportPolicyScope;
  section_ref: string;
  data_class: LocalDataExportDataClass;
  status: LocalDataExportImportStatus;
  privacy_redaction_policy: LocalDataPrivacyRedactionPolicy;
  record_count: number;
  public_safe: boolean;
  exported_refs: string[];
  deferred_refs: string[];
  boundary_notes: string[];
  reason_codes: LocalDataExportImportReasonCode[];
  authority_boundary: LocalDataExportImportAuthorityBoundary;
}

export interface LocalDataExportManifest {
  manifest_version: typeof LocalDataExportManifestVersion;
  contract_version: typeof LocalDataExportContractVersion;
  scope: typeof LocalDataExportImportPolicyScope;
  status: LocalDataExportImportStatus;
  manifest_ref: string;
  as_of: string;
  sections: LocalDataExportSection[];
  boundary_notes: string[];
  reason_codes: LocalDataExportImportReasonCode[];
  authority_boundary: LocalDataExportImportAuthorityBoundary;
  manifest_fingerprint: string;
}

export interface LocalDataExportBundle {
  bundle_version: typeof LocalDataExportBundleVersion;
  contract_version: typeof LocalDataExportContractVersion;
  scope: typeof LocalDataExportImportPolicyScope;
  status: LocalDataExportImportStatus;
  as_of: string;
  roadmap_ref: "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
  privacy_guard_ref: "privacy_redaction_runtime_guard_v0_1";
  export_manifest: LocalDataExportManifest;
  import_preview: LocalDataImportPreview;
  boundary_notes: string[];
  reason_codes: LocalDataExportImportReasonCode[];
  authority_boundary: LocalDataExportImportAuthorityBoundary;
  bundle_fingerprint: string;
}

export interface LocalDataImportPreview {
  import_preview_version: typeof LocalDataImportPreviewVersion;
  contract_version: typeof LocalDataExportContractVersion;
  scope: typeof LocalDataExportImportPolicyScope;
  status: LocalDataExportImportStatus;
  preview_ref: string;
  requested_actions: LocalDataImportAction[];
  blocked_actions: LocalDataImportAction[];
  candidate_sections: string[];
  validation_findings: LocalDataImportValidationFinding[];
  boundary_notes: string[];
  reason_codes: LocalDataExportImportReasonCode[];
  authority_boundary: LocalDataExportImportAuthorityBoundary;
  preview_fingerprint: string;
}

export interface LocalDataImportValidationFinding {
  finding_version: typeof LocalDataImportValidationFindingVersion;
  scope: typeof LocalDataExportImportPolicyScope;
  finding_id: string;
  path: string;
  data_class: LocalDataExportDataClass;
  import_action: LocalDataImportAction;
  status: LocalDataExportImportStatus;
  severity: "info" | "warning" | "error";
  reason_codes: LocalDataExportImportReasonCode[];
  public_safe_summary: string;
  original_value_included: false;
}
