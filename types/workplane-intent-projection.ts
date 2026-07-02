/**
 * Type-only GuideBrief Intent Projection v0.1 contract.
 *
 * This file imports only types, performs no reads or writes, calls no routes,
 * providers, OpenAI, GitHub, Codex runtime, runner runtime, or browser storage,
 * and has no side effects.
 */

import type { AgentWorkplanePanelId } from "./agent-workplane-node";

export const WORKPLANE_INTENT_PROJECTION_VERSION =
  "workplane_intent_projection.v0.1" as const;

export const WORKPLANE_INTENT_CLASSES = [
  "debug",
  "navigate",
  "review",
  "handoff",
  "run_planning",
  "dogfood",
  "research",
  "implementation",
  "cleanup",
  "metric_review",
  "perspective_alignment",
  "unknown",
] as const;

export const WORKPLANE_INTENT_PROJECTION_LEVELS = [
  "view_projection",
  "draft_projection",
  "executable_projection_deferred",
] as const;

export const WORKPLANE_INTENT_PROJECTION_STATUSES = [
  "projected",
  "partial",
  "needs_user_judgment",
  "unsupported",
  "empty_intent",
] as const;

export const WORKPLANE_INTENT_PANEL_MODES = [
  "focus",
  "inspect",
  "review",
  "handoff_prepare",
  "runner_review",
  "stale_check",
  "compact",
] as const;

export type WorkplaneIntentClass = (typeof WORKPLANE_INTENT_CLASSES)[number];

export type WorkplaneIntentProjectionLevel =
  (typeof WORKPLANE_INTENT_PROJECTION_LEVELS)[number];

export type WorkplaneIntentProjectionStatus =
  (typeof WORKPLANE_INTENT_PROJECTION_STATUSES)[number];

export type WorkplaneIntentPanelModeName =
  (typeof WORKPLANE_INTENT_PANEL_MODES)[number];

export interface WorkplaneIntentProjectionInput {
  original_user_intent?: string;
  scope?: string;
  selected_panel_id?: AgentWorkplanePanelId | string;
  selected_node_id?: AgentWorkplanePanelId | string;
  selected_run_id?: string;
  selected_step_id?: string;
  selected_event_id?: string;
  selected_batch_id?: string;
  selected_delta_id?: string;
  selected_handoff_ref?: string;
  debug_question?: string;
  now?: string;
  max_focus_refs?: number;
  max_candidate_actions?: number;
}

export interface WorkplaneInterpretedIntent {
  summary: string;
  matched_terms: string[];
  confidence: "low" | "medium" | "high";
  executable_language_detected: boolean;
  ambiguity_notes: string[];
}

export interface WorkplaneIntentPanelMode {
  panel_id: AgentWorkplanePanelId | string;
  mode: WorkplaneIntentPanelModeName;
  reason: string;
  source_refs: string[];
}

export interface WorkplaneIntentDisplayFilter {
  filter_id: string;
  label: string;
  include_panel_ids: Array<AgentWorkplanePanelId | string>;
  suppress_ref_patterns: string[];
  reason: string;
  pure_view_only: true;
}

export interface WorkplaneIntentCandidateAction {
  action_id: string;
  title: string;
  summary: string;
  status: "preview_only" | "requires_user_judgment" | "unsupported";
  intent_class: WorkplaneIntentClass;
  related_panel_ids: Array<AgentWorkplanePanelId | string>;
  source_refs: string[];
  validation_refs: string[];
  blocked_by: string[];
  non_executable_reason: string;
}

export interface WorkplaneIntentCandidateHandoff {
  handoff_candidate_id: string;
  title: string;
  summary: string;
  target_surface: "codex_handoff" | "operator_review" | "guidebrief_preview";
  status: "draft_only" | "blocked";
  source_refs: string[];
  required_context: string[];
  blocked_by: string[];
}

export interface WorkplaneIntentCandidateRunnerConfig {
  runner_config_candidate_id: string;
  title: string;
  summary: string;
  status: "draft_only" | "requires_user_judgment";
  related_run_ids: string[];
  related_batch_ids: string[];
  related_delta_ids: string[];
  source_refs: string[];
  blocked_by: string[];
  authority_boundary_summary: string;
}

export interface WorkplaneIntentCandidatePerspectiveUpdate {
  perspective_update_candidate_id: string;
  title: string;
  summary: string;
  status: "draft_only" | "requires_user_judgment";
  proposed_lens: string;
  source_refs: string[];
  related_delta_ids: string[];
  blocked_by: string[];
  non_apply_reason: string;
}

export interface WorkplaneIntentAuthorityBoundary {
  surface: "guidebrief_intent_projection";
  can_change_ui_view: true;
  can_create_draft_projection: true;
  can_create_handoff_candidate: true;
  can_create_runner_config_candidate: true;
  can_create_perspective_candidate: true;
  can_apply_perspective: false;
  can_mutate_memory: false;
  can_execute_runner: false;
  can_schedule_runner: false;
  can_recover_delta_batch: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_actuate_github: false;
  can_execute_codex: false;
  can_create_branch_or_pr: false;
  can_auto_apply_delta: false;
  can_write_db: false;
  can_write_runner_ledger: false;
  can_record_proof: false;
  can_create_evidence: false;
  can_merge_publish_retry_replay_deploy: false;
  can_send_handoff: false;
  notes: string[];
}

export interface WorkplaneIntentNeedsUserJudgmentItem {
  judgment_id: string;
  question: string;
  why_it_matters: string;
  options: string[];
  urgency: "low" | "medium" | "high" | "blocking";
  source_refs: string[];
  blocked_until_decided: string[];
}

export interface WorkplaneIntentReversibility {
  reversible: true;
  durable_state_changed: false;
  dismissible: true;
  reset_behavior: string;
  notes: string[];
}

export interface WorkplaneIntentValidationSummary {
  status: "not_run" | "passed" | "partial" | "skipped";
  smoke_refs: string[];
  docs_refs: string[];
  notes: string[];
}

export interface WorkplaneIntentProjection {
  projection_id: string;
  projection_version: typeof WORKPLANE_INTENT_PROJECTION_VERSION;
  created_at: string;
  scope: string;
  original_user_intent: string;
  interpreted_intent: WorkplaneInterpretedIntent;
  intent_class: WorkplaneIntentClass;
  projection_level: WorkplaneIntentProjectionLevel;
  projection_status: WorkplaneIntentProjectionStatus;
  target_surface: "agent_workplane";
  focus_refs: string[];
  suppressed_refs: string[];
  prioritized_panels: Array<AgentWorkplanePanelId | string>;
  suggested_panel_modes: WorkplaneIntentPanelMode[];
  candidate_actions: WorkplaneIntentCandidateAction[];
  candidate_handoffs: WorkplaneIntentCandidateHandoff[];
  candidate_runner_configs: WorkplaneIntentCandidateRunnerConfig[];
  candidate_perspective_updates: WorkplaneIntentCandidatePerspectiveUpdate[];
  display_filters: WorkplaneIntentDisplayFilter[];
  source_refs: string[];
  stale_warnings: string[];
  authority_boundary: WorkplaneIntentAuthorityBoundary;
  needs_user_judgment: WorkplaneIntentNeedsUserJudgmentItem[];
  reversibility: WorkplaneIntentReversibility;
  validation_summary: WorkplaneIntentValidationSummary;
  debug_context_refs: string[];
  notes: string[];
}

export interface WorkplaneIntentProjectionRead {
  projection_version: typeof WORKPLANE_INTENT_PROJECTION_VERSION;
  scope: string;
  as_of: string;
  projection: WorkplaneIntentProjection;
  source_refs: string[];
  authority_boundary: WorkplaneIntentAuthorityBoundary;
  notes: string[];
}
