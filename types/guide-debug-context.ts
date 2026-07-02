/**
 * Type-only GuideBrief Workplane Debug Context v0.1 contract.
 *
 * This file imports only types, performs no reads or writes, calls no routes,
 * providers, OpenAI, GitHub, or Codex runtime, and has no side effects.
 */

import type {
  AgentWorkplaneFallbackStatus,
  AgentWorkplaneNodeKind,
  AgentWorkplaneNodeStatus,
  AgentWorkplanePanelId,
  AgentWorkplaneStaleness,
} from "./agent-workplane-node";

export const GUIDE_WORKPLANE_DEBUG_CONTEXT_VERSION =
  "guide_workplane_debug_context.v0.1" as const;

export const GUIDE_WORKPLANE_DEBUG_SELECTION_STATUSES = [
  "matched",
  "partial_match",
  "not_found",
  "ambiguous",
] as const;

export type GuideWorkplaneDebugSelectionStatus =
  (typeof GUIDE_WORKPLANE_DEBUG_SELECTION_STATUSES)[number];

export type GuideWorkplaneDebugItemConfidence = "observed" | "low" | "medium" | "high";

export type GuideWorkplaneDebugSuggestionPriority =
  | "low"
  | "medium"
  | "high"
  | "now";

export type GuideWorkplaneDebugJudgmentUrgency =
  | "low"
  | "medium"
  | "high"
  | "blocking";

export type GuideWorkplaneDebugTraceStepStatus =
  | "observed"
  | "matched"
  | "partial_match"
  | "not_found"
  | "ambiguous"
  | "skipped";

export type GuideWorkplaneDebugWarningSeverity = "low" | "medium" | "high";

export type GuideWorkplaneDebugHandoffCandidateStatus =
  | "preview_only"
  | "blocked";

export interface GuideWorkplaneDebugSelectionInput {
  selected_panel_id?: AgentWorkplanePanelId | string;
  selected_node_id?: AgentWorkplanePanelId | string;
  run_id?: string;
  step_id?: string;
  event_id?: string;
  batch_id?: string;
  delta_id?: string;
  handoff_ref?: string;
  debug_question?: string;
}

export interface GuideWorkplaneDebugSelectedContext {
  selection_status: GuideWorkplaneDebugSelectionStatus;
  selected_panel_id: AgentWorkplanePanelId | string | null;
  selected_node_id: AgentWorkplanePanelId | string | null;
  matched_panel_id: AgentWorkplanePanelId | null;
  matched_node_id: AgentWorkplanePanelId | null;
  matched_kind: AgentWorkplaneNodeKind | null;
  matched_status: AgentWorkplaneNodeStatus | null;
  title: string;
  summary: string;
  related_run_ids: string[];
  related_step_ids: string[];
  related_event_ids: string[];
  related_batch_ids: string[];
  related_delta_ids: string[];
  related_handoff_refs: string[];
  source_refs: string[];
  fallback_status: AgentWorkplaneFallbackStatus;
  staleness: AgentWorkplaneStaleness;
  validation_summary: GuideWorkplaneDebugValidationSummary;
  debug_notes: string[];
}

export interface GuideWorkplaneDebugObservedItem {
  observed_id: string;
  kind: string;
  summary: string;
  source_refs: string[];
  related_run_ids: string[];
  related_step_ids: string[];
  related_event_ids: string[];
  related_batch_ids: string[];
  related_delta_ids: string[];
  related_handoff_refs: string[];
  confidence: "observed";
  notes: string[];
}

export interface GuideWorkplaneDebugInferredItem {
  inference_id: string;
  summary: string;
  basis_observed_ids: string[];
  source_refs: string[];
  confidence: Exclude<GuideWorkplaneDebugItemConfidence, "observed">;
  caveats: string[];
  non_authority_notes: string[];
}

export interface GuideWorkplaneDebugSuggestion {
  suggestion_id: string;
  title: string;
  summary: string;
  priority: GuideWorkplaneDebugSuggestionPriority;
  suggested_check: string;
  required_checks: string[];
  blocked_by: string[];
  source_refs: string[];
  related_delta_ids: string[];
  authority_boundary_summary: string;
}

export interface GuideWorkplaneDebugNeedsUserJudgmentItem {
  judgment_id: string;
  question: string;
  why_it_matters: string;
  options: string[];
  source_refs: string[];
  related_delta_ids: string[];
  urgency: GuideWorkplaneDebugJudgmentUrgency;
  blocked_until_decided: string[];
}

export interface GuideWorkplaneDebugTraceStep {
  trace_step_id: string;
  status: GuideWorkplaneDebugTraceStepStatus;
  summary: string;
  source_refs: string[];
  notes: string[];
}

export interface GuideWorkplaneDebugValidationSummary {
  status: "not_run" | "passed" | "partial" | "skipped";
  smoke_refs: string[];
  docs_refs: string[];
  notes: string[];
}

export interface GuideWorkplaneDebugStaleWarning {
  warning_id: string;
  severity: GuideWorkplaneDebugWarningSeverity;
  summary: string;
  source_refs: string[];
  refresh_suggestion: string;
  blocks_debug_handoff: boolean;
}

export interface GuideWorkplaneDebugAuthorityBoundary {
  surface: "guide_workplane_debug_context";
  read_only_debug_context: true;
  can_write_db: false;
  can_write_runner_ledger: false;
  can_record_proof: false;
  can_create_evidence: false;
  can_update_work: false;
  can_mutate_memory: false;
  can_apply_project_perspective: false;
  can_apply_durable_memory: false;
  can_auto_apply_delta: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_actuate_github: false;
  can_execute_codex: false;
  can_execute_runner: false;
  can_schedule_runner: false;
  can_create_branch_or_pr: false;
  can_send_handoff: false;
  can_merge_publish_retry_replay_deploy: false;
  can_create_ui_action: false;
  can_project_intent: false;
  notes: string[];
}

export interface GuideWorkplaneDebugCodexHandoffCandidate {
  candidate_id: string;
  status: GuideWorkplaneDebugHandoffCandidateStatus;
  preview_only: true;
  title: string;
  summary: string;
  selected_panel_id: AgentWorkplanePanelId | string | null;
  selected_node_id: AgentWorkplanePanelId | string | null;
  source_refs: string[];
  required_context: string[];
  blocked_by: string[];
  authority_boundary_summary: string;
}

export interface GuideWorkplaneDebugContext {
  debug_context_id: string;
  debug_version: typeof GUIDE_WORKPLANE_DEBUG_CONTEXT_VERSION;
  scope: string;
  as_of: string;
  selected_context: GuideWorkplaneDebugSelectedContext;
  observed: GuideWorkplaneDebugObservedItem[];
  inferred: GuideWorkplaneDebugInferredItem[];
  suggested: GuideWorkplaneDebugSuggestion[];
  needs_user_judgment: GuideWorkplaneDebugNeedsUserJudgmentItem[];
  source_refs: string[];
  debug_trace: GuideWorkplaneDebugTraceStep[];
  validation_summary: GuideWorkplaneDebugValidationSummary;
  stale_warnings: GuideWorkplaneDebugStaleWarning[];
  authority_boundary: GuideWorkplaneDebugAuthorityBoundary;
  codex_debug_handoff_candidate: GuideWorkplaneDebugCodexHandoffCandidate;
}

export interface GuideWorkplaneDebugContextInput {
  scope?: string;
  as_of?: string;
  selection?: GuideWorkplaneDebugSelectionInput;
  node_context_read?: import("./agent-workplane-node").AgentWorkplaneNodeContextRead;
}
