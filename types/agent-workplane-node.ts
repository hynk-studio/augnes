/**
 * Type-only Agent Workplane node/panel contract v0.1.
 *
 * This file defines stable read context metadata for existing Agent Workplane
 * panels. It imports nothing, performs no reads or writes, calls no routes,
 * providers, OpenAI, GitHub, or Codex runtime, and has no side effects.
 */

export const AGENT_WORKPLANE_NODE_CONTRACT_VERSION =
  "agent_workplane_node_contract.v0.1" as const;

export const AGENT_WORKPLANE_PANEL_IDS = [
  "work_queue",
  "current_perspective",
  "delta_projection",
  "review_queue",
  "review_memory_detail",
  "state_proposal_review",
  "evidence_handoff",
  "workplane_inspector",
  "projection_candidates",
  "projected_delta_batch",
  "delta_batch",
  "handoff_builder_preview",
  "run_postmortem",
  "trace_diagnostics",
  "legacy_cockpit_compatibility",
  "current_objective",
  "handoff_context",
  "perspective_delta",
  "source_ref_bridge",
  "trace_bridge",
  "authority_validation_debug",
  "runner_state",
  "runner_delta_batch",
] as const;

export const AGENT_WORKPLANE_NODE_KINDS = [
  "native_panel",
  "preview_panel",
  "compatibility_panel",
  "debug_context_source",
  "proposal_review_context",
  "handoff_context_source",
  "runner_context_source",
  "trace_context_source",
] as const;

export const AGENT_WORKPLANE_NODE_STATUSES = [
  "ready",
  "partial",
  "preview_only",
  "compatibility_only",
  "not_materialized",
  "empty",
  "needs_review",
  "blocked",
  "stale",
  "fallback",
] as const;

export type AgentWorkplanePanelId =
  (typeof AGENT_WORKPLANE_PANEL_IDS)[number];

export type AgentWorkplaneNodeKind =
  (typeof AGENT_WORKPLANE_NODE_KINDS)[number];

export type AgentWorkplaneNodeStatus =
  (typeof AGENT_WORKPLANE_NODE_STATUSES)[number];

export interface AgentWorkplaneAuthorityBoundary {
  surface: "agent_workplane";
  read_only_context: true;
  can_write_db: false;
  can_write_proof_evidence: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_actuate_github: false;
  can_execute_codex: false;
  can_execute_runner: false;
  can_schedule: false;
  can_apply_durable_memory: false;
  can_apply_perspective: false;
  can_auto_apply_delta: false;
  can_merge_publish_retry_replay_deploy: false;
  notes: string[];
}

export interface AgentWorkplaneValidationSummary {
  status: "not_run" | "passed" | "partial" | "skipped";
  smoke_refs: string[];
  notes: string[];
}

export interface AgentWorkplaneStaleness {
  status: "fresh" | "stale" | "partial" | "unknown";
  as_of: string | null;
  updated_at: string | null;
  notes: string[];
}

export interface AgentWorkplaneFallbackStatus {
  status: "runtime" | "fixture_fallback" | "empty_fallback" | "not_materialized";
  reason: string | null;
  source_status: string | null;
  notes: string[];
}

export interface AgentWorkplaneNodeContext {
  panel_id: AgentWorkplanePanelId;
  node_id: AgentWorkplanePanelId;
  kind: AgentWorkplaneNodeKind;
  title: string;
  summary: string;
  status: AgentWorkplaneNodeStatus;
  created_at: string;
  updated_at: string;
  source_refs: string[];
  related_run_ids: string[];
  related_step_ids: string[];
  related_event_ids: string[];
  related_batch_ids: string[];
  related_delta_ids: string[];
  related_handoff_refs: string[];
  authority_boundary: AgentWorkplaneAuthorityBoundary;
  validation_summary: AgentWorkplaneValidationSummary;
  staleness: AgentWorkplaneStaleness;
  fallback_status: AgentWorkplaneFallbackStatus;
  debug_notes: string[];
}

export interface AgentWorkplanePanelContext
  extends AgentWorkplaneNodeContext {}

export interface AgentWorkplaneNodeContextRead {
  contract_version: typeof AGENT_WORKPLANE_NODE_CONTRACT_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  authority_boundary: AgentWorkplaneAuthorityBoundary;
  validation_summary: AgentWorkplaneValidationSummary;
  staleness: AgentWorkplaneStaleness;
  fallback_status: AgentWorkplaneFallbackStatus;
  panels: AgentWorkplanePanelContext[];
  nodes: AgentWorkplaneNodeContext[];
  debug_notes: string[];
}
