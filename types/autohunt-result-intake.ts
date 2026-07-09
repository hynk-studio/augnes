import type {
  AutohuntSupervisedExecutionContract,
  AutohuntSupervisedExecutionContractAuthorityBoundary,
  AutohuntSupervisedExecutionContractScope,
  AutohuntSupervisedExecutionContractStatus,
  AutohuntSupervisedExecutionLaunchMode,
} from "@/types/autohunt-supervised-execution-contract";

export const AUTOHUNT_RESULT_INTAKE_KIND = "autohunt_result_intake" as const;

export const AUTOHUNT_RESULT_INTAKE_VERSION =
  "autohunt_result_intake.v0.1" as const;

export const AUTOHUNT_RESULT_INTAKE_READBACK_KIND =
  "autohunt_result_intake_readback" as const;

export const AUTOHUNT_RESULT_INTAKE_READBACK_VERSION =
  "autohunt_result_intake_readback.v0.1" as const;

export const AUTOHUNT_RESULT_INTAKE_TABLE =
  "autohunt_result_intakes" as const;

export const AUTOHUNT_RESULT_INTAKE_STATUSES = [
  "result_intake_recorded",
  "blocked",
  "insufficient_data",
  "source_execution_contract_missing",
  "source_execution_contract_not_ready",
  "source_execution_contract_fingerprint_mismatch",
  "result_report_missing",
  "result_report_invalid",
  "checks_failed_or_missing",
  "unsafe_material_refused",
] as const;

export const AUTOHUNT_RESULT_REPORT_SOURCES = [
  "manual_operator_report",
  "future_launcher_report",
  "dry_run_fixture_report",
] as const;

export const AUTOHUNT_RESULT_REPORT_STATUSES = [
  "completed",
  "completed_with_warnings",
  "blocked",
  "failed",
  "skipped",
] as const;

export const AUTOHUNT_EXPECTED_OBSERVED_DELTA_STATUSES = [
  "aligned",
  "minor_delta",
  "major_delta",
  "blocked_or_failed",
] as const;

export const AUTOHUNT_REUSE_OUTCOME_HELPFULNESS = [
  "helpful",
  "partially_helpful",
  "stale",
  "noisy",
  "missing",
  "not_evaluated",
] as const;

export const AUTOHUNT_RESIDUAL_DIAGNOSTIC_SEVERITIES = [
  "none",
  "low",
  "medium",
  "high",
] as const;

export const AUTOHUNT_RESIDUAL_DIAGNOSTIC_CATEGORIES = [
  "no_residual",
  "check_failure",
  "skipped_required_check",
  "file_scope_drift",
  "budget_drift",
  "authority_boundary_attention",
  "source_chain_gap",
  "result_report_gap",
  "unexpected_blocker",
] as const;

export type AutohuntResultIntakeStatus =
  (typeof AUTOHUNT_RESULT_INTAKE_STATUSES)[number];

export type AutohuntResultIntakeScope =
  AutohuntSupervisedExecutionContractScope;

export type AutohuntResultReportSource =
  (typeof AUTOHUNT_RESULT_REPORT_SOURCES)[number];

export type AutohuntResultReportStatus =
  (typeof AUTOHUNT_RESULT_REPORT_STATUSES)[number];

export type AutohuntExpectedObservedDeltaStatus =
  (typeof AUTOHUNT_EXPECTED_OBSERVED_DELTA_STATUSES)[number];

export type AutohuntReuseOutcomeHelpfulness =
  (typeof AUTOHUNT_REUSE_OUTCOME_HELPFULNESS)[number];

export type AutohuntResidualDiagnosticSeverity =
  (typeof AUTOHUNT_RESIDUAL_DIAGNOSTIC_SEVERITIES)[number];

export type AutohuntResidualDiagnosticCategory =
  (typeof AUTOHUNT_RESIDUAL_DIAGNOSTIC_CATEGORIES)[number];

export type AutohuntResultIntakeAuthorityBoundary =
  AutohuntSupervisedExecutionContractAuthorityBoundary;

export interface AutohuntResultIntakeSourceExecutionContract {
  contract_id: string;
  contract_fingerprint: string;
  contract_status: AutohuntSupervisedExecutionContractStatus;
  launch_mode: AutohuntSupervisedExecutionLaunchMode;
  source_readiness_gate_fingerprint: string;
  active_grant_id: string;
  active_grant_fingerprint: string;
  ready_preflight_packet_id: string;
  ready_preflight_packet_fingerprint: string;
  operator_decision_id: string;
  operator_decision_fingerprint: string;
  copy_export_preview_fingerprint: string;
}

export interface AutohuntResultIntakeBudgetUsed {
  iterations: number;
  tool_calls: number;
  codex_tasks: number;
  draft_prs: number;
  changed_files: number;
}

export interface AutohuntStructuredResultReport {
  result_report_id: string;
  result_report_fingerprint: string;
  result_source: AutohuntResultReportSource;
  result_status: AutohuntResultReportStatus;
  source_contract_launch_mode: AutohuntSupervisedExecutionLaunchMode;
  branch_created: false;
  pr_created: false;
  github_called: false;
  codex_executed: false;
  checks_run: string[];
  checks_passed: string[];
  checks_failed: string[];
  checks_skipped: string[];
  changed_files: string[];
  changed_file_count: number;
  expected_changed_file_globs: string[];
  max_changed_files: number;
  budget_used: AutohuntResultIntakeBudgetUsed;
  blocker_reasons: string[];
  warning_reasons: string[];
  useful_refs: string[];
  stale_refs: string[];
  missing_refs: string[];
  noisy_refs: string[];
  raw_result_text_persisted: false;
}

export interface AutohuntExpectedObservedDeltaCandidate {
  delta_kind: "autohunt_expected_observed_delta_candidate";
  expected_summary: string;
  observed_summary: string;
  matched_expectations: string[];
  missed_expectations: string[];
  unexpected_observations: string[];
  checks_delta: {
    required_checks: string[];
    checks_run: string[];
    checks_passed: string[];
    checks_failed: string[];
    checks_skipped: string[];
    missing_required_checks: string[];
  };
  files_delta: {
    expected_changed_file_globs: string[];
    changed_files: string[];
    changed_file_count: number;
    max_changed_files: number;
    file_count_within_limit: boolean;
  };
  budget_delta: {
    budget_used: AutohuntResultIntakeBudgetUsed;
    max_iterations: number;
    max_tool_calls: number;
    max_codex_tasks: number;
    max_draft_prs: number;
    max_changed_files: number;
    budget_within_contract: boolean;
  };
  delta_status: AutohuntExpectedObservedDeltaStatus;
  delta_fingerprint: string;
}

export interface AutohuntReuseOutcomeCandidate {
  reuse_outcome_kind: "autohunt_reuse_outcome_candidate";
  source_chain_helpfulness: AutohuntReuseOutcomeHelpfulness;
  useful_refs: string[];
  stale_refs: string[];
  missing_refs: string[];
  noisy_refs: string[];
  reused_context_fingerprint: string;
  outcome_fingerprint: string;
}

export interface AutohuntResidualDiagnosticCandidate {
  residual_kind: "autohunt_residual_diagnostic_candidate";
  severity: AutohuntResidualDiagnosticSeverity;
  residual_category: AutohuntResidualDiagnosticCategory;
  residual_summary: string;
  recommended_next_work_class: string;
  residual_fingerprint: string;
}

export interface AutohuntLearningLoopSummary {
  result_intake_required_satisfied: true;
  expected_observed_delta_required_satisfied: true;
  reuse_outcome_required_satisfied: true;
  residual_diagnostic_required_satisfied: true;
  ready_for_next_daily_autohunt_cycle: boolean;
}

export interface AutohuntResultIntakePersistedMaterialBoundary {
  persists_source_fingerprints: true;
  persists_result_summary: true;
  persists_raw_result_text: false;
  persists_raw_prompt_text: false;
  persists_raw_pr_body: false;
  persists_raw_operator_note: false;
  persists_raw_source_payload: false;
  persists_secret_or_token: false;
  persists_url_or_env_value: false;
}

export interface AutohuntResultIntakeValidation {
  passed: boolean;
  fingerprint_algorithm: string;
  source_execution_contract_ready: boolean;
  source_execution_contract_fingerprint_verified: boolean;
  launch_guard_no_execution: boolean;
  required_learning_hooks_present: boolean;
  result_report_present: boolean;
  result_report_valid: boolean;
  result_report_external_authority_absent: boolean;
  changed_file_count_within_contract: boolean;
  budget_within_contract: boolean;
  required_checks_accounted_for: boolean;
  authority_boundary_all_false: boolean;
  persisted_material_boundary_safe: boolean;
  raw_material_absent: boolean;
  target_only_write_proven: boolean;
}

export interface AutohuntResultIntakeRowCountObservation {
  table_name: string;
  before_count: number;
  after_count: number;
  delta: number;
  changed: boolean;
}

export interface AutohuntResultIntakeRowCountWriteSummary {
  target_table_name: typeof AUTOHUNT_RESULT_INTAKE_TABLE;
  target_before_count: number;
  target_after_count: number;
  target_delta: number;
  target_table_changed: boolean;
  expected_target_delta: number;
  target_delta_matches_expected: boolean;
  non_target_table_count: number;
  non_target_changed_table_count: number;
  all_non_target_row_counts_unchanged: boolean;
  rows: AutohuntResultIntakeRowCountObservation[];
}

export interface AutohuntResultIntake {
  result_intake_kind: typeof AUTOHUNT_RESULT_INTAKE_KIND;
  result_intake_version: typeof AUTOHUNT_RESULT_INTAKE_VERSION;
  result_intake_id: string;
  scope: AutohuntResultIntakeScope;
  created_at: string;
  result_intake_status: AutohuntResultIntakeStatus;
  source_execution_contract: AutohuntResultIntakeSourceExecutionContract;
  structured_result_report: AutohuntStructuredResultReport;
  expected_observed_delta_candidate: AutohuntExpectedObservedDeltaCandidate;
  reuse_outcome_candidate: AutohuntReuseOutcomeCandidate;
  residual_diagnostic_candidate: AutohuntResidualDiagnosticCandidate;
  learning_loop_summary: AutohuntLearningLoopSummary;
  authority_boundary: AutohuntResultIntakeAuthorityBoundary;
  persisted_material_boundary: AutohuntResultIntakePersistedMaterialBoundary;
  validation: AutohuntResultIntakeValidation;
  row_count_write_summary: AutohuntResultIntakeRowCountWriteSummary;
  idempotency_key: string;
  result_intake_fingerprint: string;
}

export interface AutohuntStructuredResultReportInput {
  result_report_id?: string | null;
  result_report_fingerprint?: string | null;
  result_source?: AutohuntResultReportSource | string | null;
  result_status?: AutohuntResultReportStatus | string | null;
  branch_created?: boolean | null;
  pr_created?: boolean | null;
  github_called?: boolean | null;
  codex_executed?: boolean | null;
  checks_run?: string[] | null;
  checks_passed?: string[] | null;
  checks_failed?: string[] | null;
  checks_skipped?: string[] | null;
  changed_files?: string[] | null;
  changed_file_count?: number | null;
  expected_changed_file_globs?: string[] | null;
  max_changed_files?: number | null;
  budget_used?: Partial<AutohuntResultIntakeBudgetUsed> | null;
  blocker_reasons?: string[] | null;
  warning_reasons?: string[] | null;
  useful_refs?: string[] | null;
  stale_refs?: string[] | null;
  missing_refs?: string[] | null;
  noisy_refs?: string[] | null;
  raw_result_text_persisted?: false;
}

export interface AutohuntResultIntakeInput {
  scope: AutohuntResultIntakeScope;
  source_execution_contract?: AutohuntSupervisedExecutionContract | null;
  structured_result_report?: AutohuntStructuredResultReportInput | null;
  dry_run_fixture_report?: AutohuntStructuredResultReportInput | null;
  raw_material_probe?: unknown;
}

export type AutohuntResultIntakeWriteStatus =
  | "written"
  | "duplicate_replayed"
  | "refused";

export interface AutohuntResultIntakeWriteResult {
  ok: boolean;
  result_status: AutohuntResultIntakeWriteStatus;
  refusal_reasons: string[];
  result_intake: AutohuntResultIntake | null;
  duplicate_replayed: boolean;
  result_intake_record_written: boolean;
  row_count_write_summary: AutohuntResultIntakeRowCountWriteSummary | null;
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

export type AutohuntResultIntakeSelectionStatus =
  | "selected_latest_result_intake"
  | "selected_by_result_intake_id"
  | "result_intake_id_not_found"
  | "no_recorded_result_intake"
  | "no_result_intakes";

export interface AutohuntResultIntakeSelectedSummary {
  result_intake_id: string;
  result_intake_status: AutohuntResultIntakeStatus;
  source_execution_contract_id: string;
  result_report_id: string;
  result_status: AutohuntResultReportStatus;
  delta_status: AutohuntExpectedObservedDeltaStatus;
  reuse_outcome_helpfulness: AutohuntReuseOutcomeHelpfulness;
  residual_category: AutohuntResidualDiagnosticCategory;
  ready_for_next_daily_autohunt_cycle: boolean;
  authority_boundary_all_false: boolean;
}

export interface AutohuntResultIntakeReadback {
  readback_kind: typeof AUTOHUNT_RESULT_INTAKE_READBACK_KIND;
  readback_version: typeof AUTOHUNT_RESULT_INTAKE_READBACK_VERSION;
  scope: AutohuntResultIntakeScope;
  source_execution_contract_id_filter: string | null;
  result_intake_status_filter: AutohuntResultIntakeStatus | null;
  result_intake_id_filter: string | null;
  selection_status: AutohuntResultIntakeSelectionStatus;
  selected_result_intake: AutohuntResultIntake | null;
  selected_result_intake_summary: AutohuntResultIntakeSelectedSummary | null;
  latest_recorded_result_intake: AutohuntResultIntake | null;
  result_intakes: AutohuntResultIntake[];
  all_result_intakes: AutohuntResultIntake[];
  recorded_result_intakes: AutohuntResultIntake[];
  blocked_result_intakes: AutohuntResultIntake[];
  invalid_record_count: number;
  latest_expected_observed_delta_candidate:
    | AutohuntExpectedObservedDeltaCandidate
    | null;
  latest_reuse_outcome_candidate: AutohuntReuseOutcomeCandidate | null;
  latest_residual_diagnostic_candidate:
    | AutohuntResidualDiagnosticCandidate
    | null;
  learning_loop_summary: AutohuntLearningLoopSummary | null;
  no_run_no_execution_boundary: AutohuntResultIntakeAuthorityBoundary;
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
