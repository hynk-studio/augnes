/**
 * Type-only Autonomy Contract / Budget / Delta Merge Policy v0.1 contract.
 *
 * This file defines preview-only delegation contract shapes for future
 * autonomous or scheduled work. It performs no DB reads or writes.
 * It imports nothing and calls no routes, providers, OpenAI, GitHub, or Codex runtime,
 * starts no scheduler or daemon, and has no side effects.
 */

export const AUTONOMY_CONTRACT_VERSION = "autonomy_contract.v0.1" as const;

export const AUTONOMY_CONTRACT_STATUSES = [
  "draft",
  "preview_only",
  "needs_review",
  "blocked",
  "ready_for_future_review",
  "archived",
] as const;

export const AUTONOMY_MODES = [
  "manual_supervised",
  "scheduled_hunt_preview",
  "full_access_preview",
  "chatgpt_only_preview",
  "codex_only_preview",
  "chatgpt_codex_loop_preview",
  "research_accumulation_preview",
  "office_workflow_preview",
  "world_model_preview",
] as const;

export const AUTONOMY_ALLOWED_ACTIONS = [
  "read_current_perspective",
  "read_delta_projection",
  "read_guide_brief",
  "read_handoff_capsule_preview",
  "read_codex_launch_card_preview",
  "summarize_context",
  "rank_candidate_deltas",
  "prepare_review_packet",
  "prepare_codex_handoff_preview",
  "draft_report_preview",
] as const;

export const AUTONOMY_FORBIDDEN_ACTIONS = [
  "execute_codex",
  "run_codex",
  "call_github",
  "open_pr",
  "call_openai_or_provider",
  "create_branch_or_pr",
  "send_handoff",
  "write_db",
  "record_proof",
  "create_evidence",
  "mutate_memory",
  "write_memory",
  "apply_project_perspective",
  "publish_external",
  "merge",
  "retry_replay_deploy",
  "start_background_work",
  "schedule_background_work",
  "schedule_run",
] as const;

export const AUTONOMY_STOP_CONDITION_KINDS = [
  "budget_exhausted",
  "stale_context",
  "user_judgment_required",
  "required_check_failed",
  "required_check_skipped",
  "forbidden_action_requested",
  "forbidden_file_scope",
  "source_gap_high",
  "authority_boundary_unclear",
  "runtime_unavailable",
  "manual_stop_requested",
] as const;

export const AUTONOMY_REPORTING_CADENCE_MODES = [
  "manual",
  "scheduled_preview",
  "after_each_delta",
  "after_batch",
  "on_blocker",
  "on_budget_threshold",
] as const;

export type AutonomyContractStatus =
  (typeof AUTONOMY_CONTRACT_STATUSES)[number];

export type AutonomyMode = (typeof AUTONOMY_MODES)[number];

export type AutonomyAllowedAction =
  (typeof AUTONOMY_ALLOWED_ACTIONS)[number];

export type AutonomyForbiddenAction =
  (typeof AUTONOMY_FORBIDDEN_ACTIONS)[number];

export type AutonomyStopConditionKind =
  (typeof AUTONOMY_STOP_CONDITION_KINDS)[number];

export type ReportingCadenceMode =
  (typeof AUTONOMY_REPORTING_CADENCE_MODES)[number];

export type AutonomySeverity = "low" | "medium" | "high" | "blocking";

export interface AutonomyContract {
  runtime: "augnes";
  contract_version: typeof AUTONOMY_CONTRACT_VERSION;
  scope: string;
  contract_id: string;
  created_at: string;
  status: AutonomyContractStatus;
  autonomy_mode: AutonomyMode;
  title: string;
  goal: string;
  bounded_context_summary: string;
  source_refs: AutonomySourceRefs;
  guide_brief_ref: string;
  handoff_capsule_refs: string[];
  codex_launch_card_refs: string[];
  current_working_perspective_ref: string;
  delta_projection_ref: string;
  context_scope: AutonomyContextScope;
  allowed_agents: string[];
  allowed_surfaces: string[];
  allowed_actions: string[];
  forbidden_actions: string[];
  budget: AutonomyBudget;
  reporting_cadence: ReportingCadence;
  stop_conditions: AutonomyStopCondition[];
  delta_merge_policy: AutonomyDeltaMergePolicy;
  review_escalation_policy: AutonomyReviewEscalationPolicy;
  output_policy: AutonomyOutputPolicy;
  staleness_policy: AutonomyStalenessPolicy;
  validation_policy: AutonomyValidationPolicy;
  run_preview: AutonomyRunPreview;
  authority_boundary: AutonomyContractAuthorityBoundary;
  gaps: AutonomyGap[];
  public_safety: AutonomyPublicSafetyBlock;
  next_phase_notes: string[];
}

export interface AutonomyContractBuilderInput {
  scope: string;
  contract_id?: string;
  created_at?: string;
  status?: AutonomyContractStatus;
  title: string;
  goal: string;
  autonomy_mode: AutonomyMode;
  bounded_context_summary?: string;
  guide_brief?: AutonomyRefInput;
  handoff_capsules?: AutonomyRefInput[];
  codex_launch_cards?: AutonomyRefInput[];
  current_working_perspective_ref?: string;
  delta_projection_ref?: string;
  context_scope?: AutonomyContextScope;
  allowed_agents?: string[];
  allowed_surfaces?: string[];
  allowed_actions?: string[];
  forbidden_actions?: string[];
  budget?: Partial<AutonomyBudget>;
  reporting_cadence?: Partial<ReportingCadence>;
  stop_conditions?: AutonomyStopCondition[];
  delta_merge_policy?: Partial<AutonomyDeltaMergePolicy>;
  review_escalation_policy?: Partial<AutonomyReviewEscalationPolicy>;
  output_policy?: Partial<AutonomyOutputPolicy>;
  staleness_policy?: Partial<AutonomyStalenessPolicy>;
  validation_policy?: Partial<AutonomyValidationPolicy>;
  run_preview?: Partial<AutonomyRunPreview>;
  operator_constraints?: string[];
  docs_refs?: string[];
  source_refs?: Partial<AutonomySourceRefs>;
  gaps?: AutonomyGap[];
  public_safety?: AutonomyPublicSafetyBlock;
  next_phase_notes?: string[];
}

export type AutonomyRefInput =
  | string
  | {
      ref?: string;
      id?: string;
      source_ref?: string;
      guide_brief_ref?: string;
      capsule_id?: string;
      launch_card_id?: string;
    };

export interface AutonomyContextScope {
  scope_summary: string;
  included_refs: string[];
  excluded_refs: string[];
  freshness: "fresh" | "partial" | "stale" | "unknown";
  notes: string[];
}

export interface AutonomySourceRefs {
  guide_brief_refs: string[];
  handoff_capsule_refs: string[];
  codex_launch_card_refs: string[];
  current_working_perspective_refs: string[];
  delta_projection_refs: string[];
  workplane_refs: string[];
  delta_ids: string[];
  batch_ids: string[];
  evidence_refs: string[];
  artifact_refs: string[];
  handoff_refs: string[];
  diagnostic_refs: string[];
  route_refs: string[];
  docs_refs: string[];
  repo_refs: string[];
}

export interface AutonomyBudget {
  budget_id: string;
  time_limit_minutes: number;
  wall_clock_window: AutonomyBudgetWallClockWindow;
  max_iterations: number;
  max_tool_calls: number;
  max_codex_tasks: number;
  max_prs: number;
  max_file_changes: number;
  allowed_file_globs: string[];
  forbidden_file_globs: string[];
  token_or_compute_budget: AutonomyTokenOrComputeBudget;
  cost_budget: AutonomyCostBudget;
  retry_limit: number;
  failure_threshold: number;
  reporting_interval: string;
  requires_budget_refresh_after: string[];
  budget_boundary_notes: string[];
}

export interface AutonomyBudgetWallClockWindow {
  starts_at: string | null;
  ends_at: string | null;
  timezone: string;
  notes: string[];
}

export interface AutonomyTokenOrComputeBudget {
  max_tokens: number | null;
  max_compute_units: number | null;
  notes: string[];
}

export interface AutonomyCostBudget {
  currency: string;
  amount: number | null;
  notes: string[];
}

export interface AutonomyDeltaMergePolicy {
  policy_id: string;
  default_delta_status: "needs_review" | "blocked" | "draft";
  auto_apply_allowed: boolean;
  auto_apply_targets: string[];
  review_required_targets: string[];
  blocked_targets: string[];
  durable_memory_policy: string;
  project_perspective_policy: string;
  external_side_effect_policy: string;
  codex_launch_policy: string;
  proof_evidence_policy: string;
  stale_context_policy: string;
  user_judgment_policy: string;
  policy_notes: string[];
}

export interface AutonomyReviewEscalationPolicy {
  escalation_id: string;
  requires_user_judgment_when: string[];
  requires_operator_review_when: string[];
  requires_fresh_snapshot_when: string[];
  requires_new_budget_when: string[];
  blocks_run_when: string[];
  review_queue_target: string;
  escalation_summary_template: string;
  notes: string[];
}

export interface AutonomyStopCondition {
  stop_condition_id: string;
  kind: AutonomyStopConditionKind;
  summary: string;
  severity: AutonomySeverity;
  source_refs: string[];
  blocks_future_run: boolean;
  recovery_hint: string;
}

export interface ReportingCadence {
  mode: ReportingCadenceMode;
  interval_description: string;
  minimum_report_fields: string[];
  report_target_surface: string;
}

export interface AutonomyOutputPolicy {
  output_surfaces: string[];
  required_report_sections: string[];
  delta_batch_required: boolean;
  skipped_check_reporting_required: boolean;
  proof_evidence_status_required: boolean;
  no_background_work_statement_required: boolean;
  no_merge_statement_required: boolean;
  next_phase_readiness_required: boolean;
}

export interface AutonomyStalenessPolicy {
  policy_id: string;
  fresh_snapshot_required: boolean;
  stale_context_blocks_future_run: boolean;
  stale_guide_brief_requires_review: boolean;
  stale_handoff_capsule_requires_review: boolean;
  refresh_required_sources: string[];
  notes: string[];
}

export interface AutonomyValidationPolicy {
  policy_id: string;
  required_checks: string[];
  optional_checks: string[];
  skipped_check_policy: string[];
  failed_check_policy: string[];
  validation_notes: string[];
}

export interface AutonomyRunPreview {
  preview_id: string;
  title: string;
  planned_steps: string[];
  allowed_read_sources: string[];
  proposed_delta_outputs: string[];
  proposed_reports: string[];
  blocked_steps: string[];
  required_preconditions: string[];
  not_implemented_notes: string[];
  status: "preview_only";
}

export interface AutonomyContractAuthorityBoundary {
  source_of_truth: false;
  can_commit_or_reject_state: false;
  can_record_proof: false;
  can_create_evidence: false;
  can_update_work: false;
  can_mutate_memory: false;
  can_apply_project_perspective: false;
  can_publish_external: false;
  can_merge: false;
  can_retry_replay_deploy: false;
  can_call_github: false;
  can_call_openai_or_provider: false;
  can_execute_codex: false;
  can_create_branch_or_pr: false;
  can_send_handoff: false;
  can_launch_codex: false;
  can_launch_autonomy: false;
  can_schedule_background_work: false;
  can_create_mcp_tool: false;
  can_create_ui_action: false;
  can_post_external_comment: false;
  can_write_db: false;
  can_start_daemon: false;
  notes: string[];
}

export interface AutonomyGap {
  code: string;
  severity: "low" | "medium" | "high";
  summary: string;
  source_refs: string[];
  blocks_future_runner: boolean;
}

export interface AutonomyPublicSafetyBlock {
  fixture_kind?: "synthetic_sample" | "operator_supplied" | "runtime_preview";
  contains_private_conversation: false;
  contains_hidden_reasoning: false;
  contains_local_private_paths: false;
  contains_secrets_or_tokens: false;
  contains_raw_provider_output: false;
  contains_raw_retrieval_output: false;
  contains_real_account_artifacts: false;
  notes: string[];
}
