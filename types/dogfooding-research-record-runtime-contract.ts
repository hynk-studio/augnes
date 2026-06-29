export const DogfoodingResearchRecordRuntimeVersion =
  "dogfooding_research_record_runtime.v0.1" as const;
export const DogfoodingResearchRecordInputVersion =
  "dogfooding_research_record_input.v0.1" as const;
export const DogfoodingResearchRecordVersion =
  "dogfooding_research_record.v0.1" as const;
export const DogfoodingResearchRecordStoreVersion =
  "dogfooding_research_record_store.v0.1" as const;
export const DogfoodingResearchRecordRouteVersion =
  "dogfooding_research_records_route.v0.1" as const;
export const DogfoodingResearchRecordScope = "project:augnes" as const;
export const DogfoodingResearchRecordPrivacyGuardRef =
  "privacy_redaction_runtime_guard_v0_1" as const;

export const DogfoodingResearchRecordKinds = [
  "pr_body_summary",
  "codex_result_report",
  "changed_files_summary",
  "validation_command_report",
  "smoke_failure_report",
  "skipped_check_report",
  "known_warning_report",
  "not_done_report",
  "expected_observed_delta_report",
  "operator_review_note",
  "merge_closeout_summary",
] as const;
export type DogfoodingResearchRecordKind =
  (typeof DogfoodingResearchRecordKinds)[number];

export const DogfoodingResearchRecordLifecycleStates = [
  "candidate_only",
  "blocked_private_or_raw_payload",
  "blocked_forbidden_authority",
  "rejected",
] as const;
export type DogfoodingResearchRecordLifecycleState =
  (typeof DogfoodingResearchRecordLifecycleStates)[number];

export const DogfoodingResearchRecordStoreStatuses = [
  "created",
  "read",
  "listed",
  "duplicate_record",
  "conflicting_record",
  "not_found",
  "schema_missing",
  "rejected",
  "blocked_private_or_raw_payload",
  "blocked_forbidden_authority",
] as const;
export type DogfoodingResearchRecordStoreStatus =
  (typeof DogfoodingResearchRecordStoreStatuses)[number];

export const DogfoodingResearchRecordReviewCueKinds = [
  "inspect_pr_body",
  "inspect_changed_files",
  "verify_validation_command",
  "inspect_smoke_failure",
  "inspect_skipped_check",
  "review_known_warning",
  "preserve_not_done_item",
  "resolve_expected_observed_delta",
  "review_operator_note",
  "review_merge_closeout",
  "check_authority_boundary",
  "no_action",
] as const;
export type DogfoodingResearchRecordReviewCueKind =
  (typeof DogfoodingResearchRecordReviewCueKinds)[number];

export const DogfoodingResearchRecordReasonCodes = [
  "dogfooding_research_record_runtime_present",
  "operator_supplied_payload_only",
  "same_origin_post_required",
  "caller_injected_local_db_only",
  "candidate_only_review_material",
  "public_safe_refs_only",
  "privacy_guard_applied",
  "raw_private_payload_blocked",
  "forbidden_authority_blocked",
  "pr_body_not_truth",
  "changed_files_not_proof",
  "validation_commands_diagnostic_only",
  "validation_pass_not_approval",
  "validation_failure_not_rejection",
  "smoke_pass_not_evidence",
  "smoke_failure_not_rejection",
  "ci_pass_not_authority",
  "ci_failure_diagnostic_only",
  "codex_result_not_execution_approval",
  "git_ref_reference_only",
  "github_pr_ref_reference_only",
  "skipped_checks_preserved",
  "known_warnings_preserved",
  "not_done_preserved",
  "expected_observed_delta_preserved",
  "product_write_denied",
  "promotion_not_executed",
  "proof_not_created",
  "evidence_not_created",
  "durable_state_not_applied",
  "formation_receipt_not_written",
  "review_memory_not_written",
  "provider_call_not_executed",
  "retrieval_not_executed",
  "source_fetch_not_executed",
  "git_github_not_executed",
  "release_not_executed",
] as const;
export type DogfoodingResearchRecordReasonCode =
  (typeof DogfoodingResearchRecordReasonCodes)[number];

export interface DogfoodingResearchRecordAuthorityBoundary {
  dogfooding_research_record_runtime_now: true;
  same_origin_route_now: true;
  local_test_db_query_or_write_now: true;
  operator_supplied_payload_only: true;
  caller_injected_local_db_only: true;
  candidate_only: true;
  public_safe_summary_only: true;
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
  promotion_execution_now: false;
  promotion_decision_record_write_now: false;
  formation_receipt_write_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  review_memory_write_now: false;
  product_write_now: false;
  product_id_allocation_now: false;
  codex_execution_from_augnes_runtime_now: false;
  github_api_call_now: false;
  git_write_now: false;
  github_git_actuation_now: false;
  release_deploy_publish_now: false;
  record_is_truth: false;
  record_is_proof: false;
  record_is_approval: false;
  pr_body_is_truth: false;
  changed_files_are_proof: false;
  validation_pass_is_approval: false;
  validation_failure_is_rejection: false;
  smoke_pass_is_evidence: false;
  smoke_failure_is_rejection: false;
  ci_pass_is_authority: false;
  ci_failure_is_rejection: false;
  codex_result_is_execution_approval: false;
  git_ref_is_authority: false;
  github_pr_ref_is_authority: false;
  dogfooding_record_is_review_memory_write: false;
  dogfooding_record_is_promotion: false;
  dogfooding_record_is_formation_receipt: false;
  dogfooding_record_is_durable_perspective_state: false;
  dogfooding_record_is_product_write: false;
}

export interface DogfoodingResearchRecordPrivacyFinding {
  finding_id: string;
  path: string;
  finding_kind: string;
  action: "blocked" | "redacted" | "reference_only" | "allowed";
  reason_codes: string[];
  public_safe_summary: string;
  original_value_included: false;
}

export interface DogfoodingResearchRecordPrivacyReport {
  guard_ref: typeof DogfoodingResearchRecordPrivacyGuardRef;
  status:
    | "passed"
    | "blocked_private_or_raw_payload"
    | "blocked_forbidden_authority"
    | "rejected";
  findings: DogfoodingResearchRecordPrivacyFinding[];
  blocked_paths: string[];
  redacted_paths: string[];
  reason_codes: string[];
  boundary_notes: string[];
}

export interface DogfoodingResearchRecordReviewCue {
  cue_id: string;
  cue_kind: DogfoodingResearchRecordReviewCueKind;
  public_safe_summary: string;
  source_refs: string[];
  reason_codes: DogfoodingResearchRecordReasonCode[];
  candidate_only: true;
}

export interface DogfoodingResearchRecordInput {
  input_version: typeof DogfoodingResearchRecordInputVersion;
  scope: typeof DogfoodingResearchRecordScope;
  record_id: string;
  record_kind: DogfoodingResearchRecordKind;
  created_at: string;
  updated_at?: string;
  operator_actor_ref: string;
  source_refs?: unknown[];
  pr_refs?: unknown[];
  branch_refs?: unknown[];
  commit_refs?: unknown[];
  changed_file_refs?: unknown[];
  validation_refs?: unknown[];
  skipped_check_refs?: unknown[];
  known_warning_refs?: unknown[];
  not_done_refs?: unknown[];
  expected_observed_delta_refs?: unknown[];
  normalized_summary: unknown;
  review_cues?: unknown[];
  boundary_notes?: unknown[];
  authority_boundary?: Record<string, unknown>;
  codex_result_report_input?: unknown;
}

export interface DogfoodingResearchRecord {
  record_version: typeof DogfoodingResearchRecordVersion;
  runtime_version: typeof DogfoodingResearchRecordRuntimeVersion;
  store_version: typeof DogfoodingResearchRecordStoreVersion;
  scope: typeof DogfoodingResearchRecordScope;
  record_id: string;
  record_kind: DogfoodingResearchRecordKind;
  created_at: string;
  updated_at: string;
  operator_actor_ref: string;
  source_refs: string[];
  pr_refs: string[];
  branch_refs: string[];
  commit_refs: string[];
  changed_file_refs: string[];
  validation_refs: string[];
  skipped_check_refs: string[];
  known_warning_refs: string[];
  not_done_refs: string[];
  expected_observed_delta_refs: string[];
  normalized_summary: string;
  review_cues: DogfoodingResearchRecordReviewCue[];
  privacy_report: DogfoodingResearchRecordPrivacyReport;
  authority_boundary: DogfoodingResearchRecordAuthorityBoundary;
  reason_codes: DogfoodingResearchRecordReasonCode[];
  lifecycle_state: "candidate_only";
  record_fingerprint: string;
}

export interface DogfoodingResearchRecordStoreResult {
  ok: boolean;
  status: DogfoodingResearchRecordStoreStatus;
  record: DogfoodingResearchRecord | null;
  records: DogfoodingResearchRecord[];
  error_code: string | null;
  idempotent_replay: boolean;
  privacy_report: DogfoodingResearchRecordPrivacyReport | null;
  durable_state_mutated: false;
  review_memory_written: false;
  proof_or_evidence_created: false;
  claim_or_evidence_written: false;
  promotion_executed: false;
  formation_receipt_written: false;
  product_write_executed: false;
  github_git_actuated: false;
  provider_called: false;
  retrieval_executed: false;
  source_fetched: false;
  release_deploy_publish_executed: false;
  authority_boundary: DogfoodingResearchRecordAuthorityBoundary;
}

export interface DogfoodingResearchRecordListFilters {
  record_kind?: string;
  operator_actor_ref?: string;
  limit?: number;
}
