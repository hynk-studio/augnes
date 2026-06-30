export const SelectedRuntimeAuditEventVersionV01 =
  "selected_runtime_audit_event.v0.1" as const;
export const SelectedRuntimeAuditEventStoreVersionV01 =
  "selected_runtime_audit_event_store.v0.1" as const;
export const SelectedRuntimeAuditEventScopeV01 = "project:augnes" as const;
export const SelectedRuntimeAuditEventSliceV01 =
  "selected_runtime_audit_event_store_v0_1" as const;
export const SelectedRuntimeAuditEventNextSliceV01 =
  "release_readiness_matrix_post_868_non_ui_v0_1" as const;

export const SelectedRuntimeAuditEventKindsV01 = [
  "dogfooding_record_created",
  "review_memory_record_created",
  "review_memory_proposal_candidate_created",
  "promotion_decision_created",
  "formation_receipt_created",
  "durable_state_apply_executed",
  "local_export_manifest_candidate_created",
  "git_ledger_packet_candidate_created",
  "product_write_attempt_blocked",
  "forbidden_authority_claim_blocked",
  "private_raw_payload_blocked",
  "codex_result_bound_to_dogfooding_record",
  "handoff_packet_candidate_created",
  "local_export_manifest_blocked",
  "git_ledger_packet_blocked",
] as const;
export type SelectedRuntimeAuditEventKindV01 =
  (typeof SelectedRuntimeAuditEventKindsV01)[number];

export const SelectedRuntimeAuditEventStatusesV01 = [
  "recorded",
  "duplicate_event",
  "conflicting_event",
  "blocked_private_or_raw_payload",
  "blocked_forbidden_authority",
  "rejected",
  "schema_missing",
  "not_found",
  "listed",
  "read",
] as const;
export type SelectedRuntimeAuditEventStatusV01 =
  (typeof SelectedRuntimeAuditEventStatusesV01)[number];

export const SelectedRuntimeAuditEventLifecycleStatesV01 = [
  "candidate_only",
  "blocked",
  "archived",
] as const;
export type SelectedRuntimeAuditEventLifecycleStateV01 =
  (typeof SelectedRuntimeAuditEventLifecycleStatesV01)[number];

export interface SelectedRuntimeAuditEventAuthorityBoundaryV01 {
  selected_runtime_audit_event_store_now: true;
  caller_injected_local_test_db_only: true;
  schema_sql_only: true;
  selected_surface_only: true;
  caller_provided_public_safe_summary_only: true;
  audit_event_core_only: true;
  route_now: false;
  ui_now: false;
  component_now: false;
  cockpit_change_now: false;
  public_surface_change_now: false;
  route_model_change_now: false;
  broad_all_route_instrumentation_now: false;
  global_db_config_now: false;
  db_migration_now: false;
  local_file_write_now: false;
  local_file_read_now: false;
  import_apply_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  source_fetch_now: false;
  retrieval_execution_now: false;
  retrieval_index_write_now: false;
  raw_request_body_stored_now: false;
  raw_response_body_stored_now: false;
  raw_terminal_log_stored_now: false;
  raw_source_body_stored_now: false;
  raw_provider_output_stored_now: false;
  raw_retrieval_output_stored_now: false;
  raw_db_row_stored_now: false;
  raw_conversation_stored_now: false;
  hidden_reasoning_stored_now: false;
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
  branch_create_now: false;
  commit_create_now: false;
  pr_create_now: false;
  merge_execute_now: false;
  tag_create_now: false;
  release_deploy_publish_now: false;
  audit_event_is_truth: false;
  audit_event_is_proof: false;
  audit_event_is_accepted_evidence: false;
  audit_event_is_approval: false;
  audit_event_is_authority: false;
  audit_event_is_product_readiness: false;
  audit_event_is_release_readiness: false;
  audit_event_is_review_memory_write: false;
  audit_event_is_promotion: false;
  audit_event_is_formation_receipt: false;
  audit_event_is_durable_perspective_state: false;
  audit_event_is_product_write: false;
  audit_event_is_git_github_actuation: false;
  audit_event_is_source_fetch: false;
  audit_event_is_provider_call: false;
  audit_event_is_retrieval_execution: false;
  audit_event_is_raw_log_storage: false;
  audit_event_fingerprint_is_proof: false;
  audit_event_fingerprint_is_approval: false;
  linked_refs_are_reference_only: true;
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
}

export interface SelectedRuntimeAuditEventPrivacyReportV01 {
  status: string;
  findings: unknown[];
  blocked_paths: string[];
  redacted_paths: string[];
  reason_codes: string[];
  boundary_notes: string[];
}

export interface SelectedRuntimeAuditEventInputV01 {
  audit_event_id?: unknown;
  scope?: unknown;
  event_kind?: unknown;
  event_status?: unknown;
  created_at?: unknown;
  operator_actor_ref?: unknown;
  selected_surface_ref?: unknown;
  linked_record_refs?: unknown;
  linked_candidate_refs?: unknown;
  linked_git_refs?: unknown;
  linked_github_refs?: unknown;
  linked_validation_refs?: unknown;
  public_safe_summary?: unknown;
  expected_observed_delta_refs?: unknown;
  skipped_check_refs?: unknown;
  known_warning_refs?: unknown;
  not_done_refs?: unknown;
  privacy_report?: unknown;
  authority_boundary_snapshot?: unknown;
  reason_codes?: unknown;
  lifecycle_state?: unknown;
}

export interface SelectedRuntimeAuditEventV01 {
  audit_event_id: string;
  audit_event_version: typeof SelectedRuntimeAuditEventVersionV01;
  store_version: typeof SelectedRuntimeAuditEventStoreVersionV01;
  scope: typeof SelectedRuntimeAuditEventScopeV01;
  event_kind: SelectedRuntimeAuditEventKindV01;
  event_status: "recorded";
  created_at: string;
  operator_actor_ref: string;
  selected_surface_ref: string;
  linked_record_refs: string[];
  linked_candidate_refs: string[];
  linked_git_refs: string[];
  linked_github_refs: string[];
  linked_validation_refs: string[];
  public_safe_summary: string;
  expected_observed_delta_refs: string[];
  skipped_check_refs: string[];
  known_warning_refs: string[];
  not_done_refs: string[];
  privacy_report: SelectedRuntimeAuditEventPrivacyReportV01;
  authority_boundary_snapshot: SelectedRuntimeAuditEventAuthorityBoundaryV01;
  reason_codes: string[];
  event_fingerprint: string;
  lifecycle_state: "candidate_only";
}

export interface SelectedRuntimeAuditEventListFiltersV01 {
  event_kind?: unknown;
  event_status?: unknown;
  operator_actor_ref?: unknown;
  selected_surface_ref?: unknown;
  limit?: unknown;
}

export interface SelectedRuntimeAuditEventStoreResultV01 {
  ok: boolean;
  status: SelectedRuntimeAuditEventStatusV01;
  error_code: SelectedRuntimeAuditEventStatusV01 | null;
  event: SelectedRuntimeAuditEventV01 | null;
  events: SelectedRuntimeAuditEventV01[];
  audit_event_id: string | null;
  event_fingerprint: string | null;
  reason_codes: string[];
  privacy_report: SelectedRuntimeAuditEventPrivacyReportV01 | null;
  authority_boundary: SelectedRuntimeAuditEventAuthorityBoundaryV01;
  product_write_executed: false;
  proof_or_evidence_created: false;
  accepted_evidence_created: false;
  claim_or_evidence_written: false;
  review_memory_written: false;
  promotion_executed: false;
  formation_receipt_written: false;
  durable_state_applied: false;
  github_api_called: false;
  git_write_executed: false;
  github_git_actuated: false;
  provider_called: false;
  retrieval_executed: false;
  source_fetched: false;
  local_file_written: false;
  local_file_read: false;
  import_apply_executed: false;
  release_deploy_publish_executed: false;
  raw_request_body_stored: false;
  raw_response_body_stored: false;
  raw_terminal_log_stored: false;
}
