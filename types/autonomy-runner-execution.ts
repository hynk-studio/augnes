import type { AugnesDelta } from "./augnes-delta";

export const AUTONOMY_RUNNER_EXECUTION_VERSION =
  "autonomy_runner_execution.v0.1" as const;

export const AUTONOMY_RUNNER_DELTA_BATCH_VERSION =
  "autonomy_runner_delta_batch.v0.1" as const;

export const AUTONOMY_RUNNER_PUBLIC_STATUSES = [
  "planned",
  "running",
  "paused",
  "blocked",
  "completed",
  "needs_review",
  "cancelled",
] as const;

export const AUTONOMY_RUNNER_INTERNAL_STATUSES = [
  "created",
  "scheduled",
  "failed",
  "stopped",
  "cancel_requested",
] as const;

export const AUTONOMY_RUNNER_STEP_ACTIONS = [
  "summarize_current_autonomy_context",
  "recover_preflight_delta_batch",
  "generate_runner_status_delta_batch",
  "invoke_project_scoped_model_gateway",
] as const;

export const AUTONOMY_RUNNER_STEP_STATUSES = [
  "planned",
  "running",
  "completed",
  "blocked",
  "failed",
  "skipped",
  "cancelled",
] as const;

export const AUTONOMY_RUNNER_EVENT_TYPES = [
  "run_created",
  "run_scheduled",
  "run_started",
  "run_paused",
  "run_resumed",
  "run_cancelled",
  "run_completed",
  "run_blocked",
  "run_needs_review",
  "run_failed",
  "tick_skipped",
  "step_started",
  "step_completed",
  "step_blocked",
  "step_failed",
  "step_cancelled",
  "delta_batch_recovered",
] as const;

export type AutonomyRunnerPublicStatus =
  (typeof AUTONOMY_RUNNER_PUBLIC_STATUSES)[number];

export type AutonomyRunnerInternalStatus =
  (typeof AUTONOMY_RUNNER_INTERNAL_STATUSES)[number];

export type AutonomyRunnerStatus =
  | AutonomyRunnerPublicStatus
  | AutonomyRunnerInternalStatus;

export type AutonomyRunnerStepAction =
  (typeof AUTONOMY_RUNNER_STEP_ACTIONS)[number];

export type AutonomyRunnerStepStatus =
  (typeof AUTONOMY_RUNNER_STEP_STATUSES)[number];

export type AutonomyRunnerEventType =
  (typeof AUTONOMY_RUNNER_EVENT_TYPES)[number];

export type JsonObject = Record<string, unknown>;

export interface AutonomyRunnerLedgerOptions {
  dbPath?: string;
}

export interface AutonomyRunnerSourceRefs {
  autonomy_contract_refs: string[];
  guide_brief_refs: string[];
  handoff_refs: string[];
  codex_launch_card_refs: string[];
  current_working_perspective_refs: string[];
  delta_projection_refs: string[];
  preflight_refs: string[];
  runner_refs: string[];
  docs_refs: string[];
  repo_refs: string[];
}

export interface AutonomyRunnerBudgetSnapshot {
  budget_id: string;
  max_iterations: number;
  max_tool_calls: number;
  max_codex_tasks: number;
  max_external_calls: 0;
  max_provider_calls: 0;
  max_github_calls: 0;
  max_memory_mutations: 0;
  max_perspective_applies: 0;
  notes: string[];
}

export interface AutonomyRunnerAuthorityBoundary {
  source_of_truth: "autonomy_runner_ledger";
  autonomy_run_is_approval_record: false;
  runner_ledger_is_proof_or_evidence_ledger: false;
  scheduled_run_requires_explicit_local_runner_invocation: true;
  watch_mode_starts_on_import: false;
  can_write_runner_ledger: true;
  can_recover_delta_batch: true;
  can_call_github: false;
  can_call_openai_or_provider: false;
  can_execute_codex: false;
  can_create_branch_or_pr: false;
  can_publish_external: false;
  can_merge: false;
  can_retry_replay_deploy: false;
  can_record_proof: false;
  can_create_evidence: false;
  can_mutate_memory: false;
  can_apply_project_perspective: false;
  can_auto_apply_delta: false;
  notes: string[];
}

export interface AutonomyRunStepPlanInput {
  step_id?: string;
  action_kind: AutonomyRunnerStepAction;
  title?: string;
  summary?: string;
}

export interface CreateAutonomyRunInput extends AutonomyRunnerLedgerOptions {
  run_id?: string;
  scope?: string;
  autonomy_contract_ref?: string | null;
  title?: string;
  status?: "planned" | "scheduled";
  scheduled_for?: string | null;
  created_at?: string;
  source_refs?: Partial<AutonomyRunnerSourceRefs>;
  authority_boundary?: Partial<AutonomyRunnerAuthorityBoundary>;
  budget_snapshot?: Partial<AutonomyRunnerBudgetSnapshot>;
  planned_steps?: AutonomyRunStepPlanInput[];
  metadata?: JsonObject;
}

export interface AutonomyRunRecord {
  run_id: string;
  scope: string;
  autonomy_contract_ref: string | null;
  title: string;
  status: AutonomyRunnerStatus;
  scheduled_for: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
  stop_reason: string | null;
  source_refs: AutonomyRunnerSourceRefs;
  authority_boundary: AutonomyRunnerAuthorityBoundary;
  budget_snapshot: AutonomyRunnerBudgetSnapshot;
  metadata: JsonObject;
  steps: AutonomyRunStepRecord[];
  events: AutonomyRunEventRecord[];
  delta_batches: RecoveredAutonomyDeltaBatch[];
}

export interface AutonomyRunSummary {
  run_id: string;
  scope: string;
  autonomy_contract_ref: string | null;
  title: string;
  status: AutonomyRunnerStatus;
  scheduled_for: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
  stop_reason: string | null;
  source_refs: AutonomyRunnerSourceRefs;
  authority_boundary: AutonomyRunnerAuthorityBoundary;
  budget_snapshot: AutonomyRunnerBudgetSnapshot;
  metadata: JsonObject;
}

export interface AutonomyRunStepRecord {
  step_id: string;
  run_id: string;
  step_index: number;
  action_kind: AutonomyRunnerStepAction;
  status: AutonomyRunnerStepStatus;
  title: string;
  summary: string;
  started_at: string | null;
  finished_at: string | null;
  output: JsonObject;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface AutonomyRunEventRecord {
  event_id: string;
  run_id: string;
  step_id: string | null;
  event_type: AutonomyRunnerEventType;
  status: AutonomyRunnerStatus | AutonomyRunnerStepStatus | "ok" | "skipped";
  message: string;
  payload: JsonObject;
  created_at: string;
}

export interface RecoveredAutonomyDeltaBatch {
  batch_id: string;
  run_id: string;
  batch_version: typeof AUTONOMY_RUNNER_DELTA_BATCH_VERSION;
  status: "needs_review" | "completed" | "blocked";
  title: string;
  summary: string;
  created_at: string;
  delta_count: number;
  deltas: AugnesDelta[];
  source_refs: AutonomyRunnerSourceRefs;
  validation: {
    validation_status: "passed" | "needs_review" | "blocked";
    completed_checks: string[];
    skipped_checks: Array<{ check: string; reason: string }>;
    notes: string[];
  };
  authority_boundary: AutonomyRunnerAuthorityBoundary;
}

export interface AutonomyRunListOptions extends AutonomyRunnerLedgerOptions {
  scope?: string;
  status?: AutonomyRunnerStatus;
  limit?: number;
}

export interface TickAutonomyRunInput extends AutonomyRunnerLedgerOptions {
  run_id: string;
  now?: string;
}

export interface RunLifecycleInput extends AutonomyRunnerLedgerOptions {
  run_id: string;
  now?: string;
  reason?: string;
}
