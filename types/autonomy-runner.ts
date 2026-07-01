/**
 * Type-only Autonomy Runner Preflight / Dry-Run v0.1 contract.
 *
 * Phase 9A describes whether a future supervised runner could be considered
 * and builds a dry-run plan.
 *
 * It imports only types. It performs no DB reads or writes. It calls no routes,
 * providers, OpenAI, GitHub, or Codex runtime.
 * It starts no scheduler, daemon, runner, or background work, and has no side effects.
 */

import type {
  AutonomyBudget,
  AutonomyContract,
  AutonomyContractStatus,
  AutonomyDeltaMergePolicy,
  AutonomyMode,
  AutonomyPublicSafetyBlock,
  AutonomyReviewEscalationPolicy,
  AutonomyRunPreview,
  AutonomySourceRefs,
  AutonomyStopCondition,
} from "./autonomy-contract";

export const AUTONOMY_RUNNER_PREFLIGHT_VERSION =
  "autonomy_runner_preflight.v0.1" as const;

export const AUTONOMY_DRY_RUN_PLAN_VERSION =
  "autonomy_dry_run_plan.v0.1" as const;

export const AUTONOMY_RUN_READINESS_VALUES = [
  "blocked",
  "needs_review",
  "ready_for_future_supervised_runner",
  "not_supported",
] as const;

export const AUTONOMY_RUNNER_PREFLIGHT_ACTION_KINDS = [
  "read_contract",
  "read_preview_inputs",
  "evaluate_budget",
  "evaluate_stop_conditions",
  "evaluate_review_escalation",
  "rank_candidate_steps",
  "build_dry_run_plan",
  "draft_report_preview",
] as const;

export const AUTONOMY_RUNNER_FORBIDDEN_ACTIONS = [
  "execute_codex",
  "run_codex",
  "call_github",
  "call_openai_or_provider",
  "create_branch_or_pr",
  "send_handoff",
  "write_db",
  "record_proof",
  "create_evidence",
  "mutate_memory",
  "apply_project_perspective",
  "publish_external",
  "merge",
  "retry_replay_deploy",
  "start_background_work",
  "schedule_background_work",
  "schedule_run",
  "spend_budget",
  "auto_apply_delta",
] as const;

export type AutonomyRunReadiness =
  (typeof AUTONOMY_RUN_READINESS_VALUES)[number];

export type AutonomyRunStepActionKind =
  (typeof AUTONOMY_RUNNER_PREFLIGHT_ACTION_KINDS)[number];

export type AutonomyRunnerForbiddenAction =
  (typeof AUTONOMY_RUNNER_FORBIDDEN_ACTIONS)[number];

export type AutonomyAssessmentStatus =
  | "pass"
  | "needs_review"
  | "blocked"
  | "not_supported";

export type AutonomyRunSeverity = "low" | "medium" | "high" | "blocking";

export interface AutonomyRunnerPreflightInput {
  scope?: string;
  contract?: Partial<AutonomyContract> | null;
  preflight_id?: string;
  dry_run_id?: string;
  created_at?: string;
  budget_approved?: boolean;
  budget_usage?: AutonomyBudgetUsageSnapshot;
  triggered_stop_condition_ids?: string[];
  required_user_judgment?: string[];
  blocking_user_judgment?: string[];
  required_operator_review?: string[];
  source_refs?: Partial<AutonomySourceRefs>;
  public_safety?: AutonomyPublicSafetyBlock;
  next_phase_notes?: string[];
}

export interface AutonomyBudgetUsageSnapshot {
  elapsed_minutes?: number;
  iterations_used?: number;
  tool_calls_used?: number;
  codex_tasks_used?: number;
  prs_used?: number;
  file_changes_used?: number;
  cost_used?: number;
}

export interface AutonomyRunnerAssessmentSet {
  budget_assessment: AutonomyBudgetAssessment;
  action_scope_assessment: AutonomyActionScopeAssessment;
  delta_merge_assessment: AutonomyDeltaMergeAssessment;
  review_escalation_assessment: AutonomyReviewEscalationAssessment;
  stop_condition_assessment: AutonomyStopConditionAssessment;
  staleness_assessment: AutonomyStalenessAssessment;
  authority_assessment: AutonomyAuthorityAssessment;
}

export interface AutonomyBudgetAssessment {
  status: AutonomyAssessmentStatus;
  budget_id: string;
  budget_present: boolean;
  budget_complete: boolean;
  budget_approved: boolean;
  budget_exceeded: boolean;
  would_spend_budget: false;
  requires_budget_refresh: boolean;
  blocks_run: boolean;
  requires_review: boolean;
  summary: string;
  source_refs: string[];
}

export interface AutonomyActionScopeAssessment {
  status: AutonomyAssessmentStatus;
  allowed_dry_run_action_kinds: AutonomyRunStepActionKind[];
  contract_allowed_actions: string[];
  contract_forbidden_actions: string[];
  requested_forbidden_actions: string[];
  forbidden_execution_terms: string[];
  codex_or_handoff_preview_requires_future_approval: boolean;
  run_preview_status: string;
  blocks_run: boolean;
  requires_review: boolean;
  summary: string;
  source_refs: string[];
}

export interface AutonomyDeltaMergeAssessment {
  status: AutonomyAssessmentStatus;
  policy_id: string;
  default_delta_status: AutonomyDeltaMergePolicy["default_delta_status"] | "missing";
  auto_apply_allowed: boolean;
  auto_apply_targets: string[];
  review_required_targets: string[];
  blocked_targets: string[];
  proposed_outputs_are_review_only: boolean;
  blocks_run: boolean;
  requires_review: boolean;
  summary: string;
  source_refs: string[];
}

export interface AutonomyReviewEscalationAssessment {
  status: AutonomyAssessmentStatus;
  escalation_id: string;
  required_user_judgment: string[];
  blocking_user_judgment: string[];
  required_operator_review: string[];
  blocks_run: boolean;
  requires_review: boolean;
  summary: string;
  source_refs: string[];
}

export interface AutonomyStopConditionAssessment {
  status: AutonomyAssessmentStatus;
  triggered_stop_condition_ids: string[];
  blocking_triggered_stop_condition_ids: string[];
  review_triggered_stop_condition_ids: string[];
  stop_condition_count: number;
  blocks_run: boolean;
  requires_review: boolean;
  summary: string;
  source_refs: string[];
}

export interface AutonomyStalenessAssessment {
  status: AutonomyAssessmentStatus;
  freshness: "fresh" | "partial" | "stale" | "unknown" | "missing";
  fresh_snapshot_required: boolean;
  stale_context_blocks_run: boolean;
  refresh_required_sources: string[];
  blocks_run: boolean;
  requires_review: boolean;
  summary: string;
  source_refs: string[];
}

export interface AutonomyAuthorityAssessment {
  status: AutonomyAssessmentStatus;
  source_contract_boundary_present: boolean;
  source_contract_boundary_clear: boolean;
  preflight_boundary_all_false: boolean;
  missing_core_fields: string[];
  unsupported_reasons: string[];
  unexpected_authority_grants: string[];
  denied_authority_flags: string[];
  blocks_run: boolean;
  requires_review: boolean;
  summary: string;
  source_refs: string[];
}

export interface AutonomyRunBlocker {
  blocker_id: string;
  kind:
    | "budget"
    | "action_scope"
    | "delta_merge_policy"
    | "review_escalation"
    | "stop_condition"
    | "staleness"
    | "authority"
    | "not_supported";
  severity: "blocking";
  summary: string;
  source_refs: string[];
  recovery_hint: string;
}

export interface AutonomyRunWarning {
  warning_id: string;
  kind:
    | "budget"
    | "action_scope"
    | "delta_merge_policy"
    | "review_escalation"
    | "stop_condition"
    | "staleness"
    | "authority"
    | "phase_boundary";
  severity: Exclude<AutonomyRunSeverity, "blocking">;
  summary: string;
  source_refs: string[];
  review_hint: string;
}

export interface AutonomyRunStepPreview {
  step_id: string;
  title: string;
  summary: string;
  action_kind: AutonomyRunStepActionKind;
  allowed_by_contract: boolean;
  blocked_by: string[];
  source_refs: string[];
  expected_output: string;
  would_require_review: boolean;
  would_execute: false;
}

export interface AutonomyDryRunPlan {
  runtime: "augnes";
  dry_run_version: typeof AUTONOMY_DRY_RUN_PLAN_VERSION;
  dry_run_id: string;
  source_contract_id: string;
  status: "dry_run_only";
  planned_steps: AutonomyRunStepPreview[];
  planned_read_sources: string[];
  proposed_delta_outputs: string[];
  proposed_delta_batches: string[];
  proposed_reports: string[];
  proposed_review_queue_items: string[];
  blocked_steps: string[];
  required_preconditions: string[];
  required_checks: string[];
  stop_conditions: string[];
  budget_projection: AutonomyBudgetProjection;
  no_run_boundary: AutonomyRunnerAuthorityBoundary;
  next_phase_notes: string[];
}

export interface AutonomyBudgetProjection {
  budget_id: string;
  time_limit_minutes: number | null;
  max_iterations: number | null;
  max_tool_calls: number | null;
  max_codex_tasks: number | null;
  max_prs: number | null;
  max_file_changes: number | null;
  would_spend_budget: false;
  budget_boundary_notes: string[];
}

export interface AutonomyRunnerPreflight {
  runtime: "augnes";
  preflight_version: typeof AUTONOMY_RUNNER_PREFLIGHT_VERSION;
  scope: string;
  preflight_id: string;
  created_at: string;
  source_contract_id: string;
  source_contract_version: string;
  readiness: AutonomyRunReadiness;
  readiness_summary: string;
  contract_status: AutonomyContractStatus | "missing" | string;
  autonomy_mode: AutonomyMode | "unknown" | string;
  budget_assessment: AutonomyBudgetAssessment;
  action_scope_assessment: AutonomyActionScopeAssessment;
  delta_merge_assessment: AutonomyDeltaMergeAssessment;
  review_escalation_assessment: AutonomyReviewEscalationAssessment;
  stop_condition_assessment: AutonomyStopConditionAssessment;
  staleness_assessment: AutonomyStalenessAssessment;
  authority_assessment: AutonomyAuthorityAssessment;
  blockers: AutonomyRunBlocker[];
  warnings: AutonomyRunWarning[];
  required_user_judgment: string[];
  required_operator_review: string[];
  dry_run_plan: AutonomyDryRunPlan;
  source_refs: AutonomySourceRefs;
  authority_boundary: AutonomyRunnerAuthorityBoundary;
  public_safety: AutonomyPublicSafetyBlock;
  next_phase_notes: string[];
}

export interface AutonomyRunnerAuthorityBoundary {
  source_of_truth: false;
  can_start_runner: false;
  can_schedule_runner: false;
  can_start_daemon: false;
  can_start_background_work: false;
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
  can_spend_budget: false;
  can_auto_apply_delta: false;
  notes: string[];
}

export type AutonomyRunnerContractInput = Partial<AutonomyContract> | null;

export type AutonomyRunnerContractBudgetInput = Partial<AutonomyBudget> | null;

export type AutonomyRunnerContractRunPreviewInput =
  | Partial<AutonomyRunPreview>
  | null;

export type AutonomyRunnerContractReviewEscalationInput =
  | Partial<AutonomyReviewEscalationPolicy>
  | null;

export type AutonomyRunnerContractStopConditionInput =
  | Partial<AutonomyStopCondition>
  | null;
