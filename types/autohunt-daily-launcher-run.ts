import type {
  AutohuntResultIntake,
  AutohuntStructuredResultReport,
  AutohuntStructuredResultReportInput,
} from "@/types/autohunt-result-intake";
import type {
  AutohuntSupervisedExecutionContract,
  AutohuntSupervisedExecutionContractScope,
  AutohuntSupervisedExecutionContractStatus,
  AutohuntSupervisedExecutionLaunchMode,
} from "@/types/autohunt-supervised-execution-contract";
import type { AutohuntWorkTargetMode } from "@/types/autohunt-work-target-mode";

export const AUTOHUNT_DAILY_LAUNCHER_RUN_KIND =
  "autohunt_daily_launcher_run" as const;

export const AUTOHUNT_DAILY_LAUNCHER_RUN_VERSION =
  "autohunt_daily_launcher_run.v0.1" as const;

export const AUTOHUNT_DAILY_LAUNCHER_RUN_READBACK_KIND =
  "autohunt_daily_launcher_run_readback" as const;

export const AUTOHUNT_DAILY_LAUNCHER_RUN_READBACK_VERSION =
  "autohunt_daily_launcher_run_readback.v0.1" as const;

export const AUTOHUNT_DAILY_LAUNCHER_RUN_TABLE =
  "autohunt_daily_launcher_runs" as const;

export const AUTOHUNT_DAILY_LAUNCHER_RUN_STATUSES = [
  "handoff_packet_prepared",
  "result_fixture_recorded",
  "result_intake_recorded",
  "blocked",
  "insufficient_data",
  "source_execution_contract_missing",
  "source_execution_contract_not_ready",
  "source_execution_contract_fingerprint_mismatch",
  "daily_confirmation_missing",
  "daily_confirmation_invalid",
  "launch_guard_not_passive",
  "unsafe_material_refused",
] as const;

export const AUTOHUNT_DAILY_LAUNCHER_RUN_MODES = [
  "prepare_handoff_only",
  "prepare_handoff_and_record_fixture_result",
] as const;

export const AUTOHUNT_DAILY_LAUNCHER_HANDOFF_PACKET_STATUSES = [
  "prepared_for_manual_codex_handoff",
  "blocked",
] as const;

export type AutohuntDailyLauncherRunStatus =
  (typeof AUTOHUNT_DAILY_LAUNCHER_RUN_STATUSES)[number];

export type AutohuntDailyLauncherRunScope =
  AutohuntSupervisedExecutionContractScope;

export type AutohuntDailyLauncherRunMode =
  (typeof AUTOHUNT_DAILY_LAUNCHER_RUN_MODES)[number];

export type AutohuntDailyLauncherHandoffPacketStatus =
  (typeof AUTOHUNT_DAILY_LAUNCHER_HANDOFF_PACKET_STATUSES)[number];

export interface AutohuntDailyLauncherRunSourceExecutionContract {
  contract_id: string;
  contract_fingerprint: string;
  contract_status: AutohuntSupervisedExecutionContractStatus;
  launch_mode: AutohuntSupervisedExecutionLaunchMode;
  active_grant_id: string;
  active_grant_fingerprint: string;
  ready_preflight_packet_id: string;
  ready_preflight_packet_fingerprint: string;
  operator_decision_id: string;
  operator_decision_fingerprint: string;
  copy_export_preview_fingerprint: string;
}

export interface AutohuntDailyLauncherRunConfirmation {
  confirmation_ref: string;
  confirmed_by?: string | null;
  confirmed_at?: string | null;
  confirmation_fingerprint: string;
  raw_confirmation_text_persisted: false;
}

export interface AutohuntDailyLauncherHandoffPacket {
  handoff_packet_id: string;
  handoff_packet_fingerprint: string;
  handoff_packet_status: AutohuntDailyLauncherHandoffPacketStatus;
  title: string;
  goal_summary: string;
  work_target_mode?: AutohuntWorkTargetMode;
  work_target_mode_label?: string;
  lifecycle_interpretation?: string;
  result_attachment_policy?: string;
  branch_policy?: string;
  durable_new_work_created?: false;
  perspective_mutated?: false;
  cwp_mutated?: false;
  memory_written?: false;
  source_refs: string[];
  source_fingerprints: string[];
  selected_candidate_refs: string[];
  constraints: string[];
  required_checks: string[];
  expected_result_report_sections: string[];
  max_changed_files: number;
  budget_limits: {
    max_candidates: number;
    max_iterations: number;
    max_tool_calls: number;
    max_codex_tasks: number;
    max_draft_prs: number;
    max_changed_files: number;
  };
  blocked_actions: string[];
  no_raw_prompt_text_persisted: true;
  raw_prompt_text_persisted: false;
}

export interface AutohuntDailyLauncherRunBoundary {
  launcher_started: true;
  handoff_packet_prepared: true;
  codex_executed: false;
  github_called: false;
  branch_or_pr_created: false;
  merge_or_deploy_performed: false;
  provider_openai_called: false;
  sources_fetched: false;
  retrieval_run: false;
  state_mutated_outside_launcher_run: false;
}

export interface AutohuntDailyLauncherLinkedResultIntake {
  result_intake_id: string;
  result_intake_fingerprint: string;
  result_intake_status: string;
  expected_observed_delta_fingerprint: string;
  reuse_outcome_fingerprint: string;
  residual_diagnostic_fingerprint: string;
}

export interface AutohuntDailyLauncherRunAuthorityBoundary {
  can_start_daemon: false;
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
}

export interface AutohuntDailyLauncherRunPersistedMaterialBoundary {
  persists_source_fingerprints: true;
  persists_handoff_packet_summary: true;
  persists_result_report_summary: true;
  persists_raw_confirmation_text: false;
  persists_raw_prompt_text: false;
  persists_raw_result_text: false;
  persists_raw_pr_body: false;
  persists_raw_operator_note: false;
  persists_raw_source_payload: false;
  persists_secret_or_token: false;
  persists_url_or_env_value: false;
}

export interface AutohuntDailyLauncherRunValidation {
  passed: boolean;
  fingerprint_algorithm: string;
  source_execution_contract_ready: boolean;
  source_execution_contract_fingerprint_verified: boolean;
  launch_guard_passive: boolean;
  daily_confirmation_present: boolean;
  daily_confirmation_valid: boolean;
  handoff_packet_prepared: boolean;
  result_fixture_valid: boolean;
  linked_result_intake_valid: boolean;
  authority_boundary_all_false: boolean;
  persisted_material_boundary_safe: boolean;
  raw_material_absent: boolean;
  target_write_boundary_proven: boolean;
}

export interface AutohuntDailyLauncherRunRowCountObservation {
  table_name: string;
  before_count: number;
  after_count: number;
  delta: number;
  changed: boolean;
  allowed_target: boolean;
}

export interface AutohuntDailyLauncherRunRowCountWriteSummary {
  target_table_name: typeof AUTOHUNT_DAILY_LAUNCHER_RUN_TABLE;
  target_before_count: number;
  target_after_count: number;
  target_delta: number;
  target_table_changed: boolean;
  expected_target_delta: number;
  target_delta_matches_expected: boolean;
  allowed_linked_target_table_name: "autohunt_result_intakes" | null;
  allowed_linked_target_delta: number;
  expected_allowed_linked_target_delta: number;
  allowed_linked_target_delta_matches_expected: boolean;
  non_target_table_count: number;
  non_target_changed_table_count: number;
  all_non_target_row_counts_unchanged: boolean;
  rows: AutohuntDailyLauncherRunRowCountObservation[];
}

export interface AutohuntDailyLauncherRun {
  launcher_run_kind: typeof AUTOHUNT_DAILY_LAUNCHER_RUN_KIND;
  launcher_run_version: typeof AUTOHUNT_DAILY_LAUNCHER_RUN_VERSION;
  launcher_run_id: string;
  scope: AutohuntDailyLauncherRunScope;
  created_at: string;
  launcher_run_status: AutohuntDailyLauncherRunStatus;
  source_execution_contract: AutohuntDailyLauncherRunSourceExecutionContract;
  daily_confirmation: AutohuntDailyLauncherRunConfirmation;
  handoff_packet: AutohuntDailyLauncherHandoffPacket;
  launcher_run_boundary: AutohuntDailyLauncherRunBoundary;
  structured_result_report_fixture: AutohuntStructuredResultReport | null;
  linked_result_intake: AutohuntDailyLauncherLinkedResultIntake | null;
  authority_boundary: AutohuntDailyLauncherRunAuthorityBoundary;
  persisted_material_boundary: AutohuntDailyLauncherRunPersistedMaterialBoundary;
  validation: AutohuntDailyLauncherRunValidation;
  row_count_write_summary: AutohuntDailyLauncherRunRowCountWriteSummary;
  idempotency_key: string;
  launcher_run_fingerprint: string;
}

export interface AutohuntDailyLauncherRunInput {
  scope: AutohuntDailyLauncherRunScope;
  source_execution_contract?: AutohuntSupervisedExecutionContract | null;
  daily_confirmation?: Partial<AutohuntDailyLauncherRunConfirmation> | null;
  mode?: AutohuntDailyLauncherRunMode | string | null;
  work_target_mode?: AutohuntWorkTargetMode | string | null;
  structured_result_report_fixture?: AutohuntStructuredResultReportInput | null;
  raw_material_probe?: unknown;
}

export type AutohuntDailyLauncherRunWriteStatus =
  | "written"
  | "duplicate_replayed"
  | "refused";

export interface AutohuntDailyLauncherRunWriteResult {
  ok: boolean;
  result_status: AutohuntDailyLauncherRunWriteStatus;
  refusal_reasons: string[];
  launcher_run: AutohuntDailyLauncherRun | null;
  linked_result_intake: AutohuntResultIntake | null;
  duplicate_replayed: boolean;
  launcher_run_record_written: boolean;
  result_intake_record_written: boolean;
  row_count_write_summary: AutohuntDailyLauncherRunRowCountWriteSummary | null;
  launcher_started: boolean;
  codex_executed: false;
  github_called: false;
  branch_or_pr_created: false;
  merge_or_deploy_performed: false;
  provider_openai_called: false;
  sources_fetched: false;
  retrieval_run: false;
  can_start_daemon: false;
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

export type AutohuntDailyLauncherRunSelectionStatus =
  | "selected_latest_launcher_run"
  | "selected_by_launcher_run_id"
  | "launcher_run_id_not_found"
  | "no_launcher_runs";

export interface AutohuntDailyLauncherRunSelectedSummary {
  launcher_run_id: string;
  launcher_run_status: AutohuntDailyLauncherRunStatus;
  source_execution_contract_id: string;
  handoff_packet_id: string;
  handoff_packet_fingerprint: string;
  work_target_mode: AutohuntWorkTargetMode;
  work_target_mode_label: string;
  linked_result_intake_id: string | null;
  codex_executed: false;
  github_called: false;
  branch_or_pr_created: false;
  authority_boundary_all_false: boolean;
}

export interface AutohuntDailyLauncherRunReadback {
  readback_kind: typeof AUTOHUNT_DAILY_LAUNCHER_RUN_READBACK_KIND;
  readback_version: typeof AUTOHUNT_DAILY_LAUNCHER_RUN_READBACK_VERSION;
  scope: AutohuntDailyLauncherRunScope;
  source_execution_contract_id_filter: string | null;
  launcher_run_status_filter: AutohuntDailyLauncherRunStatus | null;
  launcher_run_id_filter: string | null;
  selection_status: AutohuntDailyLauncherRunSelectionStatus;
  selected_launcher_run: AutohuntDailyLauncherRun | null;
  selected_launcher_run_summary: AutohuntDailyLauncherRunSelectedSummary | null;
  latest_launcher_run: AutohuntDailyLauncherRun | null;
  launcher_runs: AutohuntDailyLauncherRun[];
  all_launcher_runs: AutohuntDailyLauncherRun[];
  invalid_record_count: number;
  linked_result_intake_summary: AutohuntDailyLauncherLinkedResultIntake | null;
  no_external_no_execution_boundary: AutohuntDailyLauncherRunAuthorityBoundary;
  raw_material_persisted: false;
  codex_executed: false;
  github_called: false;
  provider_openai_called: false;
  sources_fetched: false;
  retrieval_run: false;
  branch_or_pr_created: false;
}
