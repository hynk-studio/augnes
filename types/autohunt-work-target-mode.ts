export const AUTOHUNT_WORK_TARGET_MODES = [
  "extend_current_perspective_work",
  "create_new_perspective_work_from_autohunt_conditions",
] as const;

export type AutohuntWorkTargetMode =
  (typeof AUTOHUNT_WORK_TARGET_MODES)[number];

export type AutohuntWorkTargetModePriority = "low" | "medium" | "high";

export interface AutohuntWorkTargetModeOption {
  mode: AutohuntWorkTargetMode;
  title: string;
  short_label: string;
  summary: string;
  lifecycle_interpretation: string;
  result_attachment_policy: string;
  branch_policy: string;
  default_selected: boolean;
  requires_explicit_user_choice: boolean;
  durable_creation_allowed_now: false;
  perspective_mutation_allowed_now: false;
  cwp_mutation_allowed_now: false;
  memory_write_allowed_now: false;
  codex_execution_allowed_now: false;
  github_or_pr_allowed_now: false;
}

export interface AutohuntWorkTargetModeSummaryOption
  extends AutohuntWorkTargetModeOption {
  selected: boolean;
  recommended: boolean;
  available: true;
  recommendation_reason: string;
}

export interface AutohuntWorkTargetModeLatestLauncherRunSummary {
  launcher_run_id: string;
  launcher_run_status: string;
  handoff_packet_id: string;
  linked_result_intake_id: string | null;
  work_target_mode: AutohuntWorkTargetMode;
  work_target_mode_label: string;
}

export interface AutohuntWorkTargetModeLatestResultIntakeSummary {
  result_intake_id: string;
  result_intake_status: string;
  expected_observed_delta_status: string;
  reuse_outcome_helpfulness: string;
  residual_category: string;
  residual_severity: string;
  ready_for_next_daily_autohunt_cycle: boolean;
}

export interface AutohuntWorkTargetModeBranchSuggestion {
  suggestion_id: string;
  suggested_mode: "create_new_perspective_work_from_autohunt_conditions";
  priority: AutohuntWorkTargetModePriority;
  reason: string;
  lifecycle_interpretation: string;
  branch_policy: string;
  auto_promoted: false;
  durable_creation_allowed_now: false;
  perspective_mutation_allowed_now: false;
  cwp_mutation_allowed_now: false;
  memory_write_allowed_now: false;
}

export interface AutohuntWorkTargetModeSummary {
  summary_kind: "autohunt_work_target_mode_options";
  summary_version: "autohunt_work_target_mode_options.v0.1";
  as_of: string;
  selected_mode: AutohuntWorkTargetMode;
  recommended_mode: AutohuntWorkTargetMode;
  options: AutohuntWorkTargetModeSummaryOption[];
  latest_launcher_run_summary: AutohuntWorkTargetModeLatestLauncherRunSummary | null;
  latest_result_intake_summary: AutohuntWorkTargetModeLatestResultIntakeSummary | null;
  branch_suggestion: AutohuntWorkTargetModeBranchSuggestion | null;
  authority_boundary_all_false: true;
  raw_material_persisted: false;
  summary_fingerprint: string;
}
