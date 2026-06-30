export const LocalDataExportManifestCandidateVersionV01 =
  "local_data_export_manifest_candidate.v0.1" as const;
export const LocalDataExportManifestBuilderVersionV01 =
  "local_data_export_manifest_builder.v0.1" as const;
export const LocalDataExportManifestScopeV01 = "project:augnes" as const;
export const LocalDataExportManifestSliceV01 =
  "local_data_export_manifest_builder_v0_1" as const;
export const LocalDataExportManifestNextSliceV01 =
  "git_ledger_export_manifest_binding_v0_1" as const;

export const LocalDataExportManifestStatusesV01 = [
  "candidate_only",
  "redacted_with_warnings",
  "blocked_private_or_raw_payload",
  "blocked_forbidden_authority",
  "rejected",
] as const;
export type LocalDataExportManifestStatusV01 =
  (typeof LocalDataExportManifestStatusesV01)[number];

export const LocalDataExportManifestProfilesV01 = [
  "operator_review_bundle",
  "dogfooding_memory_bundle",
  "handoff_context_bundle",
  "review_proposal_bundle",
  "audit_readiness_bundle",
  "release_readiness_bundle",
  "minimal_public_safe_bundle",
] as const;
export type LocalDataExportManifestProfileV01 =
  (typeof LocalDataExportManifestProfilesV01)[number];

export const LocalDataExportManifestItemKindsV01 = [
  "source_summary_ref",
  "dogfooding_record_summary",
  "review_memory_summary",
  "review_memory_proposal",
  "source_ref",
  "candidate_bundle_ref",
  "promotion_decision_ref",
  "formation_receipt_ref",
  "durable_state_summary_ref",
  "trajectory_ref",
  "feedback_summary_ref",
  "runtime_audit_ref",
  "git_ledger_packet_ref",
  "handoff_packet_ref",
  "validation_ref",
  "skipped_check_ref",
  "known_warning_ref",
  "not_done_ref",
  "expected_observed_delta_ref",
] as const;
export type LocalDataExportManifestItemKindV01 =
  (typeof LocalDataExportManifestItemKindsV01)[number];

export interface LocalDataExportManifestAuthorityBoundaryV01 {
  local_data_export_manifest_builder_now: true;
  caller_provided_public_safe_summaries_only: true;
  candidate_only_manifest: true;
  export_file_written: false;
  import_apply_executed: false;
  local_file_write_now: false;
  local_file_read_now: false;
  db_read_now: false;
  db_write_now: false;
  route_now: false;
  ui_now: false;
  component_now: false;
  cockpit_change_now: false;
  public_surface_change_now: false;
  route_model_change_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  source_fetch_now: false;
  retrieval_execution_now: false;
  retrieval_index_write_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  review_memory_write_now: false;
  promotion_execution_now: false;
  promotion_decision_record_write_now: false;
  formation_receipt_write_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  product_write_now: false;
  product_id_allocation_now: false;
  codex_execution_from_augnes_runtime_now: false;
  github_api_call_now: false;
  git_write_now: false;
  github_git_actuation_now: false;
  release_deploy_publish_now: false;
  import_auto_apply_now: false;
  import_auto_promote_now: false;
  import_auto_product_write_now: false;
  local_data_export_manifest_is_export_file: false;
  local_data_export_manifest_is_file_write_approval: false;
  local_data_export_manifest_is_import_approval: false;
  local_data_export_manifest_is_truth: false;
  local_data_export_manifest_is_proof: false;
  local_data_export_manifest_is_accepted_evidence: false;
  export_item_summary_is_raw_data: false;
  export_item_summary_is_canonical_source_body: false;
  import_preview_is_import_apply: false;
  manifest_fingerprint_is_proof: false;
  manifest_fingerprint_is_approval: false;
  manifest_status_is_product_readiness: false;
  manifest_status_is_release_readiness: false;
  review_memory_summaries_are_reference_only: true;
  review_memory_proposals_are_candidate_only: true;
  promotion_decision_refs_are_reference_only: true;
  formation_receipt_refs_are_reference_only: true;
  durable_state_summaries_are_summaries_only: true;
  git_ledger_packet_refs_are_reference_only: true;
  git_ref_is_authority: false;
  github_pr_ref_is_authority: false;
  validation_pass_is_approval: false;
  validation_failure_is_rejection: false;
  smoke_pass_is_evidence: false;
  smoke_failure_is_rejection: false;
  ci_pass_is_authority: false;
  ci_failure_is_rejection: false;
  skipped_checks_are_automatic_failure: false;
  known_warnings_are_automatic_rejection: false;
  not_done_items_are_automatic_task_creation: false;
  expected_observed_delta_is_approval_or_rejection: false;
  next_recommended_slice_is_execution_approval: false;
}

export interface LocalDataExportManifestItemSummaryV01 {
  item_id: string;
  item_kind: LocalDataExportManifestItemKindV01;
  export_profile: LocalDataExportManifestProfileV01;
  source_ref: string;
  public_safe_summary: string;
  reference_only: true;
  candidate_only: true;
  raw_data_included: false;
  canonical_source_body_included: false;
  proof_or_evidence_created: false;
  reason_codes: string[];
}

export interface LocalDataExportManifestRedactionReportV01 {
  redaction_status: "passed" | "redacted_with_warnings";
  unsafe_raw_values_included: false;
  reference_only_paths: string[];
  redacted_paths: string[];
  blocked_paths: string[];
  reason_codes: string[];
  public_safe_summary: string;
}

export interface LocalDataExportManifestImportPreviewV01 {
  preview_kind: "local_data_import_preview_candidate_only";
  preview_only: true;
  import_apply_executed: false;
  import_approval_granted: false;
  auto_promote_executed: false;
  auto_product_write_executed: false;
  candidate_section_refs: string[];
  boundary_notes: string[];
}

export interface LocalDataExportManifestCandidateV01 {
  manifest_id: string;
  manifest_version: typeof LocalDataExportManifestCandidateVersionV01;
  builder_version: typeof LocalDataExportManifestBuilderVersionV01;
  scope: typeof LocalDataExportManifestScopeV01;
  created_at: string;
  manifest_status: LocalDataExportManifestStatusV01;
  export_profile: LocalDataExportManifestProfileV01;
  source_summary_refs: string[];
  dogfooding_record_summary_refs: string[];
  review_memory_summary_refs: string[];
  review_memory_proposal_refs: string[];
  source_refs: string[];
  candidate_bundle_refs: string[];
  promotion_decision_refs: string[];
  formation_receipt_refs: string[];
  durable_state_summary_refs: string[];
  trajectory_refs: string[];
  feedback_summary_refs: string[];
  runtime_audit_refs: string[];
  git_ledger_packet_refs: string[];
  handoff_packet_refs: string[];
  validation_refs: string[];
  skipped_check_refs: string[];
  known_warning_refs: string[];
  not_done_refs: string[];
  expected_observed_delta_refs: string[];
  export_item_summaries: LocalDataExportManifestItemSummaryV01[];
  redaction_report: LocalDataExportManifestRedactionReportV01;
  privacy_report: unknown;
  authority_boundary: LocalDataExportManifestAuthorityBoundaryV01;
  forbidden_capabilities: string[];
  import_preview: LocalDataExportManifestImportPreviewV01;
  export_file_written: false;
  import_apply_executed: false;
  manifest_fingerprint: string;
  reason_codes: string[];
}

export interface LocalDataExportManifestBuildResultV01 {
  ok: boolean;
  status: LocalDataExportManifestStatusV01;
  error_code: LocalDataExportManifestStatusV01 | null;
  manifest: LocalDataExportManifestCandidateV01 | null;
  export_profile: LocalDataExportManifestProfileV01;
  source_summary_refs: string[];
  reason_codes: string[];
  privacy_report: unknown;
  authority_boundary: LocalDataExportManifestAuthorityBoundaryV01;
  export_file_written: false;
  import_apply_executed: false;
  local_file_written: false;
  local_file_read: false;
  db_read_executed: false;
  db_write_executed: false;
  product_write_executed: false;
  review_memory_written: false;
  proof_or_evidence_created: false;
  claim_or_evidence_written: false;
  promotion_executed: false;
  formation_receipt_written: false;
  durable_state_applied: false;
  github_git_actuated: false;
  provider_called: false;
  retrieval_executed: false;
  source_fetched: false;
  release_deploy_publish_executed: false;
}
