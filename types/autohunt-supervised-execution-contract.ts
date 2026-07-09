import type {
  AutohuntExecutionReadinessAuthorityBoundary,
  AutohuntExecutionReadinessFutureDesignRequirement,
  AutohuntExecutionReadinessGate,
  AutohuntExecutionReadinessGateScope,
  AutohuntExecutionReadinessGateStatus,
} from "@/types/autohunt-execution-readiness-gate";

export const AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_KIND =
  "autohunt_supervised_execution_contract" as const;

export const AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_VERSION =
  "autohunt_supervised_execution_contract.v0.1" as const;

export const AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_READBACK_KIND =
  "autohunt_supervised_execution_contract_readback" as const;

export const AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_READBACK_VERSION =
  "autohunt_supervised_execution_contract_readback.v0.1" as const;

export const AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_TABLE =
  "autohunt_supervised_execution_contracts" as const;

export const AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_STATUSES = [
  "ready_for_future_limited_launcher",
  "blocked",
  "insufficient_data",
  "source_readiness_gate_missing",
  "source_readiness_gate_not_ready",
  "source_chain_stale",
  "freshness_required",
  "operator_reconfirmation_required",
  "budget_invalid",
  "stop_condition_missing",
  "authority_boundary_not_clear",
  "unsafe_material_refused",
] as const;

export const AUTOHUNT_SUPERVISED_EXECUTION_LAUNCH_MODES = [
  "supervised_codex_handoff_only",
  "supervised_local_runner_dry_run_only",
] as const;

export const AUTOHUNT_SUPERVISED_EXECUTION_FRESHNESS_STATUSES = [
  "fresh",
  "stale",
  "unknown",
] as const;

export const AUTOHUNT_SUPERVISED_EXECUTION_LAUNCHER_MAY = [
  "read_selected_candidate_refs",
  "prepare_single_codex_handoff",
  "prepare_branch_plan_preview",
  "run_local_checks_only_if_future_launcher_authorized",
  "produce_result_report",
] as const;

export const AUTOHUNT_SUPERVISED_EXECUTION_LAUNCHER_MUST_NOT = [
  "execute_without_fresh_operator_confirmation",
  "run_without_manual_stop_condition",
  "exceed_budget",
  "call_github_without_separate_authority",
  "create_branch_without_separate_authority",
  "open_pr_without_separate_authority",
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
  "write_proof_or_evidence",
  "write_product_or_delivery_state",
  "auto_apply_delta",
] as const;

export const AUTOHUNT_SUPERVISED_EXECUTION_LAUNCH_GUARD_STATUSES = [
  "launch_contract_ready",
  "launch_blocked",
  "launch_requires_fresh_operator_confirmation",
  "launch_requires_fresh_preflight",
  "launch_requires_result_intake",
  "launch_authority_not_clear",
] as const;

export type AutohuntSupervisedExecutionContractStatus =
  (typeof AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_STATUSES)[number];

export type AutohuntSupervisedExecutionContractScope =
  AutohuntExecutionReadinessGateScope;

export type AutohuntSupervisedExecutionLaunchMode =
  (typeof AUTOHUNT_SUPERVISED_EXECUTION_LAUNCH_MODES)[number];

export type AutohuntSupervisedExecutionFreshnessStatus =
  (typeof AUTOHUNT_SUPERVISED_EXECUTION_FRESHNESS_STATUSES)[number];

export type AutohuntSupervisedExecutionLauncherMay =
  (typeof AUTOHUNT_SUPERVISED_EXECUTION_LAUNCHER_MAY)[number];

export type AutohuntSupervisedExecutionLauncherMustNot =
  (typeof AUTOHUNT_SUPERVISED_EXECUTION_LAUNCHER_MUST_NOT)[number];

export type AutohuntSupervisedExecutionLaunchGuardStatus =
  (typeof AUTOHUNT_SUPERVISED_EXECUTION_LAUNCH_GUARD_STATUSES)[number];

export type AutohuntSupervisedExecutionContractAuthorityBoundary =
  AutohuntExecutionReadinessAuthorityBoundary;

export interface AutohuntSupervisedExecutionContractSourceReadinessGate {
  gate_fingerprint: string;
  readiness_status: AutohuntExecutionReadinessGateStatus;
  active_grant_id: string;
  active_grant_fingerprint: string;
  latest_queued_candidate_id: string;
  latest_queued_candidate_fingerprint: string;
  ready_preflight_packet_id: string;
  ready_preflight_packet_fingerprint: string;
  handoff_plan_id: string;
  handoff_plan_fingerprint: string;
  operator_decision_id: string;
  operator_decision_fingerprint: string;
  copy_export_preview_fingerprint: string;
}

export interface AutohuntSupervisedExecutionFreshnessContract {
  grant_must_be_refreshed_before_launch: true;
  preflight_must_be_refreshed_before_launch: true;
  operator_approval_must_be_refreshed_before_launch: true;
  max_contract_age_minutes: number;
  current_contract_age_minutes: number;
  freshness_status: AutohuntSupervisedExecutionFreshnessStatus;
}

export interface AutohuntSupervisedExecutionLaunchEnvelope {
  launch_mode: AutohuntSupervisedExecutionLaunchMode;
  max_candidates: number;
  max_iterations: number;
  max_tool_calls: number;
  max_codex_tasks: number;
  max_draft_prs: number;
  max_changed_files: number;
  allowed_file_globs: string[];
  forbidden_file_globs: string[];
  required_checks: string[];
  required_stop_conditions: string[];
  required_result_intake: true;
  required_expected_observed_delta: true;
  required_reuse_outcome: true;
  required_residual_diagnostic: true;
}

export interface AutohuntSupervisedExecutionLaunchGuardChecks {
  readiness_gate_ready: boolean;
  source_chain_fingerprints_present: boolean;
  freshness_policy_present: boolean;
  operator_reconfirmation_required: boolean;
  budget_present: boolean;
  budget_within_bounds: boolean;
  stop_conditions_present: boolean;
  result_intake_required: boolean;
  expected_observed_delta_required: boolean;
  reuse_outcome_required: boolean;
  residual_diagnostic_required: boolean;
  authority_boundaries_all_false: boolean;
  raw_material_absent: boolean;
  passed: boolean;
  blocker_reasons: string[];
  warning_reasons: string[];
}

export interface AutohuntSupervisedExecutionLaunchGuardResult {
  launch_guard_status: AutohuntSupervisedExecutionLaunchGuardStatus;
  launch_now_allowed: false;
  launcher_design_allowed: boolean;
  execution_started: false;
  codex_executed: false;
  github_called: false;
  branch_or_pr_created: false;
}

export interface AutohuntSupervisedExecutionPersistedMaterialBoundary {
  persists_source_fingerprints: true;
  persists_launch_policy: true;
  persists_raw_prompt_text: false;
  persists_raw_copy_text: false;
  persists_raw_pr_body: false;
  persists_raw_operator_note: false;
  persists_raw_source_payload: false;
  persists_secret_or_token: false;
  persists_url_or_env_value: false;
}

export interface AutohuntSupervisedExecutionValidation {
  passed: boolean;
  fingerprint_algorithm: string;
  readiness_gate_ready: boolean;
  source_chain_fingerprints_present: boolean;
  future_execution_requirements_present: boolean;
  freshness_policy_present: boolean;
  budget_present: boolean;
  budget_within_bounds: boolean;
  stop_conditions_present: boolean;
  required_result_intake_present: boolean;
  required_expected_observed_delta_present: boolean;
  required_reuse_outcome_present: boolean;
  required_residual_diagnostic_present: boolean;
  authority_boundary_all_false: boolean;
  persisted_material_boundary_safe: boolean;
  raw_material_absent: boolean;
  target_only_write_proven: boolean;
}

export interface AutohuntSupervisedExecutionRowCountObservation {
  table_name: string;
  before_count: number;
  after_count: number;
  delta: number;
  changed: boolean;
}

export interface AutohuntSupervisedExecutionRowCountWriteSummary {
  target_table_name: typeof AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_TABLE;
  target_before_count: number;
  target_after_count: number;
  target_delta: number;
  target_table_changed: boolean;
  expected_target_delta: number;
  target_delta_matches_expected: boolean;
  non_target_table_count: number;
  non_target_changed_table_count: number;
  all_non_target_row_counts_unchanged: boolean;
  rows: AutohuntSupervisedExecutionRowCountObservation[];
}

export interface AutohuntSupervisedExecutionContract {
  execution_contract_kind: typeof AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_KIND;
  execution_contract_version: typeof AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_VERSION;
  contract_id: string;
  scope: AutohuntSupervisedExecutionContractScope;
  created_at: string;
  contract_status: AutohuntSupervisedExecutionContractStatus;
  source_readiness_gate: AutohuntSupervisedExecutionContractSourceReadinessGate;
  freshness_contract: AutohuntSupervisedExecutionFreshnessContract;
  launch_envelope: AutohuntSupervisedExecutionLaunchEnvelope;
  launcher_may: AutohuntSupervisedExecutionLauncherMay[];
  launcher_must_not: AutohuntSupervisedExecutionLauncherMustNot[];
  launch_guard_checks: AutohuntSupervisedExecutionLaunchGuardChecks;
  launch_guard_result: AutohuntSupervisedExecutionLaunchGuardResult;
  authority_boundary: AutohuntSupervisedExecutionContractAuthorityBoundary;
  persisted_material_boundary: AutohuntSupervisedExecutionPersistedMaterialBoundary;
  validation: AutohuntSupervisedExecutionValidation;
  row_count_write_summary: AutohuntSupervisedExecutionRowCountWriteSummary;
  idempotency_key: string;
  contract_fingerprint: string;
}

export interface AutohuntSupervisedExecutionContractInput {
  scope: AutohuntSupervisedExecutionContractScope;
  source_readiness_gate?: AutohuntExecutionReadinessGate | null;
  launch_mode?: AutohuntSupervisedExecutionLaunchMode | string | null;
  freshness_contract?: Partial<AutohuntSupervisedExecutionFreshnessContract> | null;
  launch_envelope?: Partial<AutohuntSupervisedExecutionLaunchEnvelope> | null;
  raw_material_probe?: unknown;
}

export type AutohuntSupervisedExecutionContractWriteStatus =
  | "written"
  | "duplicate_replayed"
  | "refused";

export interface AutohuntSupervisedExecutionContractWriteResult {
  ok: boolean;
  result_status: AutohuntSupervisedExecutionContractWriteStatus;
  refusal_reasons: string[];
  contract: AutohuntSupervisedExecutionContract | null;
  duplicate_replayed: boolean;
  contract_record_written: boolean;
  row_count_write_summary:
    | AutohuntSupervisedExecutionRowCountWriteSummary
    | null;
  launch_now_allowed: false;
  execution_started: false;
  codex_executed: false;
  github_called: false;
  branch_or_pr_created: false;
  can_start_runner: false;
  can_schedule_runner: false;
  can_execute_codex: false;
  can_call_github: false;
  can_create_branch_or_pr: false;
  can_merge: false;
  can_deploy: false;
  can_publish_external: false;
  can_call_provider_or_openai: false;
  can_fetch_sources: false;
  can_run_retrieval: false;
  can_write_memory: false;
  can_promote_perspective: false;
  can_mutate_cwp: false;
  can_mutate_work: false;
  can_write_proof_or_evidence: false;
  can_auto_apply_delta: false;
  raw_material_persisted: false;
}

export type AutohuntSupervisedExecutionContractSelectionStatus =
  | "selected_latest_ready_contract"
  | "selected_by_contract_id"
  | "contract_id_not_found"
  | "no_ready_contract"
  | "no_contracts";

export interface AutohuntSupervisedExecutionContractSelectedSummary {
  contract_id: string;
  contract_status: AutohuntSupervisedExecutionContractStatus;
  launch_mode: AutohuntSupervisedExecutionLaunchMode;
  source_readiness_gate_fingerprint: string;
  launcher_design_allowed: boolean;
  launch_now_allowed: false;
  execution_started: false;
  authority_boundary_all_false: boolean;
}

export interface AutohuntSupervisedExecutionContractReadback {
  readback_kind: typeof AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_READBACK_KIND;
  readback_version: typeof AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_READBACK_VERSION;
  scope: AutohuntSupervisedExecutionContractScope;
  contract_status_filter: AutohuntSupervisedExecutionContractStatus | null;
  source_readiness_gate_fingerprint_filter: string | null;
  contract_id_filter: string | null;
  selection_status: AutohuntSupervisedExecutionContractSelectionStatus;
  selected_contract: AutohuntSupervisedExecutionContract | null;
  selected_contract_summary: AutohuntSupervisedExecutionContractSelectedSummary | null;
  latest_ready_contract: AutohuntSupervisedExecutionContract | null;
  contracts: AutohuntSupervisedExecutionContract[];
  all_contracts: AutohuntSupervisedExecutionContract[];
  ready_contracts: AutohuntSupervisedExecutionContract[];
  blocked_contracts: AutohuntSupervisedExecutionContract[];
  invalid_record_count: number;
  launch_guard_result: AutohuntSupervisedExecutionLaunchGuardResult | null;
  no_run_no_execution_boundary: AutohuntSupervisedExecutionContractAuthorityBoundary;
  raw_material_persisted: false;
  runner_started: false;
  scheduler_started: false;
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

export type RequiredFutureExecutionRequirement =
  Extract<
    AutohuntExecutionReadinessFutureDesignRequirement,
    | "explicit_user_reconfirmation_required"
    | "fresh_grant_required"
    | "fresh_preflight_required"
    | "fresh_operator_approval_required"
    | "result_intake_required"
    | "expected_observed_delta_required"
    | "reuse_outcome_required"
    | "residual_diagnostic_required"
  >;
