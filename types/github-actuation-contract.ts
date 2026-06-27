// Contract-only GitHub Actuation v0.1 shape.
// This file defines dry-run-only future GitHub actuation contracts only. It
// does not call GitHub, execute Git, create branches, commits, tags, PRs,
// reviews, labels, checks, releases, or merges, write repository files, grant
// write permissions, access secrets, query/write DB, add routes/UI, call
// providers, execute retrieval/RAG, execute Codex, mutate Perspective state,
// create proof/evidence, write Formation Receipts, product-write, or allocate
// product IDs.

export const GitHubActuationContractVersion =
  "github_actuation_contract.v0.1" as const;
export const GitHubActuationPlanVersion =
  "github_actuation_plan.v0.1" as const;
export const GitHubActuationApprovalPayloadVersion =
  "github_actuation_approval_payload.v0.1" as const;
export const GitHubActuationDryRunResultVersion =
  "github_actuation_dry_run_result.v0.1" as const;
export const GitHubActuationTargetFileRefVersion =
  "github_actuation_target_file_ref.v0.1" as const;
export const GitHubActuationValidationFindingVersion =
  "github_actuation_validation_finding.v0.1" as const;
export const GitHubActuationScope = "project:augnes" as const;

export const GitHubActuationStatuses = [
  "contract_only",
  "dry_run_plan_only",
  "ready_for_future_operator_review",
  "blocked_missing_explicit_approval",
  "blocked_forbidden_target",
  "blocked_forbidden_authority",
  "blocked_private_or_raw_payload",
  "rejected",
] as const;
export type GitHubActuationStatus =
  (typeof GitHubActuationStatuses)[number];

export const GitHubActuationActionKinds = [
  "dry_run_branch_plan",
  "dry_run_commit_plan",
  "dry_run_pull_request_plan",
  "dry_run_review_comment_plan",
  "dry_run_label_plan",
  "dry_run_check_summary_plan",
  "blocked_branch_create",
  "blocked_commit_create",
  "blocked_pull_request_create",
  "blocked_merge",
  "blocked_release_create",
  "blocked_repository_file_write",
  "blocked_product_write",
] as const;
export type GitHubActuationActionKind =
  (typeof GitHubActuationActionKinds)[number];

export const GitHubActuationPermissionProfiles = [
  "read_only_metadata",
  "contents_read_only",
  "pull_request_read_only",
  "dry_run_planning_only",
  "future_contents_write_requires_explicit_approval",
  "future_pull_request_write_requires_explicit_approval",
  "forbidden_unbounded_write",
  "forbidden_admin",
  "forbidden_secrets",
  "forbidden_actions_write",
  "forbidden_packages_write",
  "forbidden_deployments_write",
] as const;
export type GitHubActuationPermissionProfile =
  (typeof GitHubActuationPermissionProfiles)[number];

export const GitHubActuationTargetFilePolicies = [
  "allowlisted_public_safe_doc_ref",
  "allowlisted_public_safe_type_ref",
  "allowlisted_public_safe_fixture_ref",
  "allowlisted_public_safe_script_ref",
  "allowlisted_public_safe_lib_ref",
  "forbidden_secret_path",
  "forbidden_credential_path",
  "forbidden_private_key_path",
  "forbidden_unapproved_lockfile_path",
  "forbidden_unapproved_workflow_path",
  "forbidden_unapproved_index_pointer_path",
  "forbidden_product_write_path",
  "forbidden_db_migration_path",
  "forbidden_state_mutating_route_path",
  "forbidden_provider_secret_config_path",
] as const;
export type GitHubActuationTargetFilePolicy =
  (typeof GitHubActuationTargetFilePolicies)[number];

export const GitHubActuationReasonCodes = [
  "roadmap_file_present",
  "git_ledger_contract_ref_present",
  "git_ledger_builder_ref_present",
  "readonly_preview_ref_present",
  "local_export_ref_present",
  "privacy_guard_required",
  "local_data_export_policy_required",
  "authority_boundary_regression_required",
  "github_actuation_contract_only",
  "dry_run_plan_only",
  "explicit_operator_approval_required",
  "target_repo_ref_required",
  "target_branch_ref_required",
  "target_file_allowlist_required",
  "forbidden_target_blocked",
  "forbidden_file_path_blocked",
  "raw_private_payload_blocked",
  "private_url_blocked",
  "local_private_path_blocked",
  "secret_like_pattern_blocked",
  "github_token_blocked",
  "provider_thread_run_session_id_blocked",
  "github_api_not_called",
  "git_write_not_executed",
  "commit_not_created",
  "branch_not_created",
  "tag_not_created",
  "pull_request_not_created",
  "pull_request_not_merged",
  "review_not_submitted",
  "label_not_written",
  "check_not_written",
  "release_not_created",
  "repository_file_not_written",
  "contents_write_not_granted",
  "actions_write_not_granted",
  "admin_permission_not_granted",
  "proof_not_created",
  "evidence_not_created",
  "promotion_not_executed",
  "durable_state_not_mutated",
  "formation_receipt_not_written",
  "codex_not_executed",
  "product_write_denied",
  "product_id_allocation_not_executed",
  "approval_not_merge_authority",
  "approval_not_product_write",
  "approval_not_proof",
  "approval_not_durable_state",
  "git_ref_not_authority",
  "github_pr_not_core_decision",
  "smoke_pass_not_truth",
  "ci_pass_not_truth",
] as const;
export type GitHubActuationReasonCode =
  (typeof GitHubActuationReasonCodes)[number];

export interface GitHubActuationAuthorityBoundary {
  github_actuation_contract_now: true;
  dry_run_contract_only: true;
  future_operator_approval_required: true;
  caller_provided_refs_only: true;
  github_api_call_now: false;
  git_write_now: false;
  git_commit_now: false;
  git_branch_now: false;
  git_tag_now: false;
  github_pr_create_now: false;
  github_pr_merge_now: false;
  github_review_submit_now: false;
  github_label_write_now: false;
  github_check_write_now: false;
  github_release_create_now: false;
  repository_file_write_now: false;
  contents_write_now: false;
  actions_write_now: false;
  packages_write_now: false;
  deployments_write_now: false;
  secrets_read_or_write_now: false;
  admin_permission_now: false;
  local_file_export_now: false;
  local_file_import_now: false;
  db_query_or_write_now: false;
  route_now: false;
  ui_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  source_fetch_now: false;
  retrieval_execution_now: false;
  rag_answer_generation_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  promotion_execution_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  codex_execution_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  product_write_now: false;
  product_id_allocation_now: false;
  product_write_authority: false;
  approval_is_merge_authority: false;
  approval_is_product_write: false;
  approval_is_proof: false;
  approval_is_durable_state: false;
  git_ref_is_authority: false;
  github_pr_is_core_decision: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
}

export interface GitHubActuationTargetFileRef {
  target_file_ref_version: typeof GitHubActuationTargetFileRefVersion;
  scope: typeof GitHubActuationScope;
  file_ref: string;
  target_path_ref: string;
  target_file_policy: GitHubActuationTargetFilePolicy;
  public_safe_summary: string;
  public_safe: boolean;
  reason_codes: GitHubActuationReasonCode[];
}

export interface GitHubActuationPlan {
  plan_version: typeof GitHubActuationPlanVersion;
  contract_version: typeof GitHubActuationContractVersion;
  scope: typeof GitHubActuationScope;
  status: GitHubActuationStatus;
  plan_id: string;
  planned_at: string;
  requested_by: string;
  target_repo_ref: string;
  base_branch_ref: string;
  head_branch_ref: string;
  action_kinds: GitHubActuationActionKind[];
  permission_profiles: GitHubActuationPermissionProfile[];
  target_file_refs: GitHubActuationTargetFileRef[];
  forbidden_target_refs: string[];
  git_ledger_packet_refs: string[];
  local_export_manifest_refs: string[];
  audit_packet_refs: string[];
  preview_to_action_diff_ref: string;
  rollback_or_abort_plan_ref: string;
  idempotency_key_ref: string;
  boundary_notes: string[];
  reason_codes: GitHubActuationReasonCode[];
  authority_boundary: GitHubActuationAuthorityBoundary;
}

export interface GitHubActuationExplicitApprovalPayload {
  approval_payload_version: typeof GitHubActuationApprovalPayloadVersion;
  scope: typeof GitHubActuationScope;
  approval_id: string;
  operator_actor_ref: string;
  approved_at: string;
  approved_action_kinds: GitHubActuationActionKind[];
  approved_target_repo_ref: string;
  approved_base_branch_ref: string;
  approved_head_branch_ref: string;
  approved_file_refs: string[];
  approved_git_ledger_packet_refs: string[];
  approved_local_export_manifest_refs: string[];
  preview_to_action_diff_ref: string;
  rollback_or_abort_plan_ref: string;
  authority_boundary_acknowledgements: GitHubActuationReasonCode[];
  product_write_acknowledgement: false | "blocked";
  approval_is_not_product_write: true;
  approval_is_not_proof: true;
  approval_is_not_durable_state: true;
  authority_boundary: GitHubActuationAuthorityBoundary;
}

export interface GitHubActuationDryRunResult {
  dry_run_result_version: typeof GitHubActuationDryRunResultVersion;
  contract_version: typeof GitHubActuationContractVersion;
  plan_version: typeof GitHubActuationPlanVersion;
  scope: typeof GitHubActuationScope;
  status: GitHubActuationStatus;
  plan_ref: string;
  approval_payload_ref: string;
  would_request_permissions: GitHubActuationPermissionProfile[];
  would_plan_action_kinds: GitHubActuationActionKind[];
  would_target_file_refs: string[];
  blocked_action_kinds: GitHubActuationActionKind[];
  preview_to_action_diff_ref: string;
  rollback_or_abort_plan_ref: string;
  boundary_notes: string[];
  reason_codes: GitHubActuationReasonCode[];
  authority_boundary: GitHubActuationAuthorityBoundary;
}

export interface GitHubActuationValidationFinding {
  finding_version: typeof GitHubActuationValidationFindingVersion;
  scope: typeof GitHubActuationScope;
  finding_id: string;
  path: string;
  finding_kind:
    | "missing_explicit_approval"
    | "forbidden_target"
    | "forbidden_authority"
    | "private_or_raw_payload"
    | "invalid_contract";
  severity: "info" | "warning" | "critical";
  action: "blocked" | "reference_only" | "allowed";
  reason_codes: GitHubActuationReasonCode[];
  public_safe_summary: string;
  original_value_included: false;
}
