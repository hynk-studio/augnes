/**
 * Durable Autonomy Delegation Grant v0.1 contract.
 *
 * This record is permission evidence only. It does not start runners,
 * schedule background work, execute Codex, call providers/GitHub, mutate
 * Perspective/work/memory/proof/evidence/product state, or fetch sources.
 */

export const AUTONOMY_DELEGATION_GRANT_KIND =
  "autonomy_delegation_grant" as const;

export const AUTONOMY_DELEGATION_GRANT_VERSION =
  "autonomy_delegation_grant.v0.1" as const;

export const AUTONOMY_DELEGATION_GRANT_READBACK_KIND =
  "autonomy_delegation_grant_readback" as const;

export const AUTONOMY_DELEGATION_GRANT_READBACK_VERSION =
  "autonomy_delegation_grant_readback.v0.1" as const;

export const AUTONOMY_DELEGATION_GRANT_TABLE =
  "autonomy_delegation_grants" as const;

export const AUTONOMY_DELEGATION_GRANT_STATUSES = [
  "active",
  "paused",
  "revoked",
  "expired",
  "superseded",
  "refused",
] as const;

export const AUTONOMY_DELEGATION_GRANT_MODES = [
  "supervised_autohunt_planning",
  "supervised_codex_draft_pr_loop",
  "research_accumulation_loop",
  "work_queue_preflight_only",
] as const;

export const AUTONOMY_DELEGATION_GRANT_ALLOWED_WORK_CLASSES = [
  "small_refactor",
  "smoke_fix",
  "test_fix",
  "readmodel_panel_slice",
  "no_mutation_record_slice",
  "documentation_pointer_only_when_required",
  "codex_prompt_preparation",
  "research_candidate_triage",
] as const;

export const AUTONOMY_DELEGATION_GRANT_FORBIDDEN_WORK_CLASSES = [
  "broad_architecture_rewrite",
  "unbounded_refactor",
  "dependency_upgrade",
  "provider_runtime_change",
  "schema_migration_without_explicit_scope",
  "production_writer_change",
  "auth_or_secret_handling",
  "external_integration",
  "deployment",
] as const;

export const AUTONOMY_DELEGATION_GRANT_ALLOWED_ACTIONS = [
  "read_repo",
  "inspect_workplane_summary",
  "prepare_codex_prompt",
  "prepare_draft_pr_plan",
  "open_draft_pr_only_if_future_runner_authorized",
  "run_local_checks_if_future_runner_authorized",
  "report_result",
] as const;

export const AUTONOMY_DELEGATION_GRANT_FORBIDDEN_ACTIONS = [
  "execute_codex_now",
  "launch_autonomy_now",
  "start_runner",
  "start_daemon",
  "schedule_background_work",
  "call_github",
  "create_branch_or_pr_now",
  "merge",
  "deploy",
  "publish_external",
  "call_provider_or_openai",
  "fetch_sources",
  "run_retrieval",
  "write_memory",
  "promote_perspective",
  "mutate_cwp",
  "mutate_work",
  "write_proof",
  "write_evidence",
  "write_product_or_delivery_state",
  "auto_apply_delta",
] as const;

export const AUTONOMY_DELEGATION_GRANT_REQUIRED_FORBIDDEN_ACTIONS =
  AUTONOMY_DELEGATION_GRANT_FORBIDDEN_ACTIONS;

export const AUTONOMY_DELEGATION_GRANT_STOP_CONDITIONS = [
  "budget_exhausted",
  "stale_context",
  "source_gap_high",
  "user_judgment_required",
  "required_check_failed",
  "required_check_skipped",
  "forbidden_action_requested",
  "forbidden_file_scope",
  "authority_boundary_unclear",
  "runtime_unavailable",
  "repeated_failure_threshold",
  "manual_stop_requested",
] as const;

export const AUTONOMY_DELEGATION_GRANT_ALLOWED_OUTPUTS = [
  "draft_pr_plan",
  "codex_prompt",
  "review_packet",
  "result_report",
  "expected_observed_delta_candidate",
  "reuse_outcome_candidate",
  "residual_diagnostic_candidate",
] as const;

export const AUTONOMY_DELEGATION_GRANT_FORBIDDEN_OUTPUTS = [
  "merged_pr",
  "deployed_change",
  "external_post",
  "durable_perspective_promotion",
  "durable_memory_write",
  "proof_or_evidence_record",
  "product_delivery_record",
] as const;

export const AUTONOMY_DELEGATION_GRANT_AUTHORITY_FLAG_NAMES = [
  "can_start_runner",
  "can_schedule_runner",
  "can_start_daemon",
  "can_start_background_work",
  "can_execute_codex",
  "can_call_github",
  "can_create_branch_or_pr",
  "can_merge",
  "can_deploy",
  "can_publish_external",
  "can_call_provider_or_openai",
  "can_fetch_sources",
  "can_run_retrieval",
  "can_write_db_outside_grant_record",
  "can_write_memory",
  "can_promote_perspective",
  "can_mutate_cwp",
  "can_mutate_work",
  "can_write_proof_or_evidence",
  "can_auto_apply_delta",
] as const;

export type AutonomyDelegationGrantScope = "project:augnes";

export type AutonomyDelegationGrantStatus =
  (typeof AUTONOMY_DELEGATION_GRANT_STATUSES)[number];

export type AutonomyDelegationGrantMode =
  (typeof AUTONOMY_DELEGATION_GRANT_MODES)[number];

export type AutonomyDelegationGrantAllowedWorkClass =
  (typeof AUTONOMY_DELEGATION_GRANT_ALLOWED_WORK_CLASSES)[number];

export type AutonomyDelegationGrantForbiddenWorkClass =
  (typeof AUTONOMY_DELEGATION_GRANT_FORBIDDEN_WORK_CLASSES)[number];

export type AutonomyDelegationGrantAllowedAction =
  (typeof AUTONOMY_DELEGATION_GRANT_ALLOWED_ACTIONS)[number];

export type AutonomyDelegationGrantForbiddenAction =
  (typeof AUTONOMY_DELEGATION_GRANT_FORBIDDEN_ACTIONS)[number];

export type AutonomyDelegationGrantStopCondition =
  (typeof AUTONOMY_DELEGATION_GRANT_STOP_CONDITIONS)[number];

export type AutonomyDelegationGrantAllowedOutput =
  (typeof AUTONOMY_DELEGATION_GRANT_ALLOWED_OUTPUTS)[number];

export type AutonomyDelegationGrantForbiddenOutput =
  (typeof AUTONOMY_DELEGATION_GRANT_FORBIDDEN_OUTPUTS)[number];

export type AutonomyDelegationGrantAuthorityFlagName =
  (typeof AUTONOMY_DELEGATION_GRANT_AUTHORITY_FLAG_NAMES)[number];

export type AutonomyDelegationGrantAuthorityBoundary = Record<
  AutonomyDelegationGrantAuthorityFlagName,
  false
>;

export interface AutonomyDelegationGrantExplicitUserApproval {
  approval_ref: string;
  approved_by?: string | null;
  approved_at?: string | null;
  approval_basis?: string | null;
  approval_text_fingerprint: string;
  raw_approval_text_persisted: false;
}

export interface AutonomyDelegationGrantSourceAutonomyContract {
  contract_id?: string | null;
  contract_fingerprint?: string | null;
  contract_version?: string | null;
  autonomy_mode?: string | null;
  source_refs: string[];
}

export interface AutonomyDelegationGrantBudget {
  time_limit_minutes: number;
  max_iterations: number;
  max_tool_calls: number;
  max_codex_tasks: number;
  max_draft_prs: number;
  max_file_changes: number;
  max_changed_files_per_pr: number;
  allowed_file_globs: string[];
  forbidden_file_globs: string[];
  retry_limit: number;
  failure_threshold: number;
  requires_budget_refresh_after: string[];
}

export interface AutonomyDelegationGrantReportingCadence {
  mode: string;
  interval_description: string;
  minimum_report_fields: string[];
  report_target_surface: string;
}

export interface AutonomyDelegationGrantRevocation {
  revoked_by?: string | null;
  revoked_at?: string | null;
  revocation_reason?: string | null;
  supersedes_grant_id?: string | null;
  superseded_by_grant_id?: string | null;
}

export interface AutonomyDelegationGrantPersistedMaterialBoundary {
  persists_source_fingerprints: true;
  persists_budget: true;
  persists_policy: true;
  persists_raw_user_approval_text: false;
  persists_raw_prompt: false;
  persists_raw_operator_note: false;
  persists_secret_or_token: false;
  persists_url_or_env_value: false;
}

export interface AutonomyDelegationGrantValidation {
  passed: boolean;
  fingerprint_algorithm: string;
  explicit_approval_ref_present: boolean;
  approval_text_fingerprint_present: boolean;
  source_contract_binding_present: boolean;
  allowed_work_classes_non_empty: boolean;
  required_forbidden_actions_present: boolean;
  budget_limits_valid: boolean;
  required_stop_conditions_present: boolean;
  authority_boundary_all_false: boolean;
  persisted_material_boundary_safe: boolean;
  raw_material_absent: boolean;
  target_only_write_proven: boolean;
  grant_fingerprint?: string | null;
}

export interface AutonomyDelegationGrantRowCountObservation {
  table_name: string;
  before_count: number;
  after_count: number;
  delta: number;
  changed: boolean;
}

export interface AutonomyDelegationGrantRowCountWriteSummary {
  target_table_name: typeof AUTONOMY_DELEGATION_GRANT_TABLE;
  target_before_count: number;
  target_after_count: number;
  target_delta: number;
  target_table_changed: boolean;
  expected_target_delta: number;
  target_delta_matches_expected: boolean;
  non_target_table_count: number;
  non_target_changed_table_count: number;
  all_non_target_row_counts_unchanged: boolean;
  rows: AutonomyDelegationGrantRowCountObservation[];
}

export interface AutonomyDelegationGrant {
  grant_kind: typeof AUTONOMY_DELEGATION_GRANT_KIND;
  grant_version: typeof AUTONOMY_DELEGATION_GRANT_VERSION;
  grant_id: string;
  scope: AutonomyDelegationGrantScope;
  created_at: string;
  grant_status: AutonomyDelegationGrantStatus;
  grant_mode: AutonomyDelegationGrantMode;
  idempotency_key: string;
  explicit_user_approval: AutonomyDelegationGrantExplicitUserApproval;
  source_autonomy_contract: AutonomyDelegationGrantSourceAutonomyContract;
  allowed_work_classes: string[];
  forbidden_work_classes: string[];
  allowed_actions: string[];
  forbidden_actions: string[];
  budget: AutonomyDelegationGrantBudget;
  reporting_cadence: AutonomyDelegationGrantReportingCadence;
  stop_conditions: string[];
  allowed_outputs: string[];
  forbidden_outputs: string[];
  revocation: AutonomyDelegationGrantRevocation;
  authority_boundary: AutonomyDelegationGrantAuthorityBoundary;
  persisted_material_boundary: AutonomyDelegationGrantPersistedMaterialBoundary;
  validation: AutonomyDelegationGrantValidation;
  row_count_write_summary: AutonomyDelegationGrantRowCountWriteSummary;
  grant_fingerprint: string;
}

export type AutonomyDelegationGrantInput = Omit<
  AutonomyDelegationGrant,
  | "grant_kind"
  | "grant_version"
  | "grant_id"
  | "created_at"
  | "idempotency_key"
  | "validation"
  | "row_count_write_summary"
  | "grant_fingerprint"
> & {
  created_at?: string;
  validation?: Partial<AutonomyDelegationGrantValidation>;
  candidate_input?: unknown;
};

export type AutonomyDelegationGrantWriteStatus =
  | "written"
  | "duplicate_replayed"
  | "refused";

export interface AutonomyDelegationGrantWriteResult {
  ok: boolean;
  result_status: AutonomyDelegationGrantWriteStatus;
  refusal_reasons: string[];
  grant: AutonomyDelegationGrant | null;
  duplicate_replayed: boolean;
  grant_record_written: boolean;
  row_count_write_summary: AutonomyDelegationGrantRowCountWriteSummary | null;
  can_start_runner: false;
  can_schedule_runner: false;
  can_start_daemon: false;
  can_start_background_work: false;
  can_execute_codex: false;
  can_call_github: false;
  can_create_branch_or_pr: false;
  can_merge: false;
  can_deploy: false;
  can_publish_external: false;
  can_call_provider_or_openai: false;
  can_fetch_sources: false;
  can_run_retrieval: false;
  can_write_db_outside_grant_record: false;
  can_write_memory: false;
  can_promote_perspective: false;
  can_mutate_cwp: false;
  can_mutate_work: false;
  can_write_proof_or_evidence: false;
  can_auto_apply_delta: false;
  raw_material_persisted: false;
}

export type AutonomyDelegationGrantReadbackSelectionStatus =
  | "selected_latest_active_grant"
  | "selected_by_grant_id"
  | "grant_id_not_found"
  | "no_active_grant"
  | "no_grants";

export interface AutonomyDelegationGrantSelectedSummary {
  grant_id: string;
  grant_status: AutonomyDelegationGrantStatus;
  grant_mode: AutonomyDelegationGrantMode;
  approval_ref: string;
  approval_text_fingerprint: string;
  source_contract_fingerprint: string | null;
  budget_summary: string;
  stop_condition_count: number;
  forbidden_action_count: number;
  authority_boundary_all_false: boolean;
}

export interface AutonomyDelegationGrantReadback {
  readback_kind: typeof AUTONOMY_DELEGATION_GRANT_READBACK_KIND;
  readback_version: typeof AUTONOMY_DELEGATION_GRANT_READBACK_VERSION;
  scope: AutonomyDelegationGrantScope;
  grant_status_filter: AutonomyDelegationGrantStatus | null;
  grant_mode_filter: AutonomyDelegationGrantMode | null;
  grant_id_filter: string | null;
  selection_status: AutonomyDelegationGrantReadbackSelectionStatus;
  selected_grant: AutonomyDelegationGrant | null;
  selected_grant_summary: AutonomyDelegationGrantSelectedSummary | null;
  latest_active_grant: AutonomyDelegationGrant | null;
  grants: AutonomyDelegationGrant[];
  active_grants: AutonomyDelegationGrant[];
  paused_grants: AutonomyDelegationGrant[];
  revoked_grants: AutonomyDelegationGrant[];
  superseded_grants: AutonomyDelegationGrant[];
  expired_grants: AutonomyDelegationGrant[];
  invalid_record_count: number;
  no_run_no_execution_boundary: AutonomyDelegationGrantAuthorityBoundary;
  raw_material_persisted: false;
  runner_started: false;
  scheduler_started: false;
  daemon_started: false;
  background_work_started: false;
  codex_executed: false;
  github_called: false;
  provider_openai_called: false;
  sources_fetched: false;
  retrieval_run: false;
  memory_written: false;
  perspective_promoted: false;
  cwp_mutated: false;
  work_mutated: false;
  proof_or_evidence_written: false;
  product_or_delivery_state_written: false;
}
