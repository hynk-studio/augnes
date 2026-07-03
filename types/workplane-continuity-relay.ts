/**
 * Type-only Workplane Continuity Relay v0.1 contract.
 *
 * This contract describes a derived read model for the Agent Workplane. It is
 * built from CurrentWorkingPerspective, GuideBrief, and Workplane context
 * inputs, and it adds no route, store, provider call, Codex execution, durable
 * memory write, Perspective apply, or external side effect.
 */

export const WORKPLANE_CONTINUITY_RELAY_VERSION =
  "workplane_continuity_relay.v0.1" as const;

export type WorkplaneContinuityRelayAnchorSource =
  | "current_working_perspective"
  | "guide_brief"
  | "workplane_context";

export type WorkplaneContinuityRelayAnchorKind =
  | "thesis"
  | "frame"
  | "active_goal"
  | "assumption"
  | "open_question"
  | "risk"
  | "gap"
  | "staleness"
  | "source_fallback"
  | "missing_source"
  | "next_candidate"
  | "guide_suggestion"
  | "user_judgment"
  | "authority_boundary";

export type WorkplaneContinuityRelaySeverity =
  | "info"
  | "low"
  | "medium"
  | "high"
  | "blocking";

export interface WorkplaneContinuityRelay {
  runtime: "augnes";
  relay_version: typeof WORKPLANE_CONTINUITY_RELAY_VERSION;
  scope: string;
  as_of: string;
  source_refs: WorkplaneContinuityRelaySourceRefs;
  preserve_anchors: WorkplaneContinuityRelayAnchor[];
  warn_anchors: WorkplaneContinuityRelayAnchor[];
  stop_if_missing: WorkplaneContinuityRelayAnchor[];
  next_focus: WorkplaneContinuityRelayAnchor[];
  stale_or_gap_warnings: WorkplaneContinuityRelayAnchor[];
  non_goals: string[];
  source_status: WorkplaneContinuityRelaySourceStatus;
  fallback_reason: WorkplaneContinuityRelayFallbackReason;
  authority_boundary: WorkplaneContinuityRelayAuthorityBoundary;
  notes: string[];
}

export interface WorkplaneContinuityRelaySourceRefs {
  current_working_perspective_ref: string | null;
  guide_brief_ref: string | null;
  delta_projection_ref: string | null;
  workplane_ref: "/workbench";
  perspective_snapshot_refs: string[];
  delta_ids: string[];
  batch_ids: string[];
  evidence_refs: string[];
  artifact_refs: string[];
  handoff_refs: string[];
  diagnostic_refs: string[];
  route_refs: string[];
  source_refs: string[];
}

export interface WorkplaneContinuityRelayAnchor {
  anchor_id: string;
  kind: WorkplaneContinuityRelayAnchorKind;
  label: string;
  summary: string;
  source: WorkplaneContinuityRelayAnchorSource;
  source_refs: string[];
  severity: WorkplaneContinuityRelaySeverity;
  blocks_handoff: boolean;
  notes: string[];
}

export interface WorkplaneContinuityRelaySourceStatus {
  current_perspective: string;
  delta_projection: string;
  guide_brief: string;
  runner_delta_batch: string;
}

export interface WorkplaneContinuityRelayFallbackReason {
  current_perspective: string | null;
  delta_projection: string | null;
  guide_brief: string | null;
  runner_delta_batch: string | null;
}

export interface WorkplaneContinuityRelayAuthorityBoundary {
  source_of_truth: false;
  derived_read_model: true;
  read_only_operator_view: true;
  candidate_material_only: true;
  can_write_db: false;
  can_record_proof: false;
  can_create_evidence: false;
  can_update_work: false;
  can_mutate_memory: false;
  can_promote_memory: false;
  can_apply_project_perspective: false;
  can_create_promotion_decision: false;
  can_create_formation_receipt: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_execute_codex: false;
  can_execute_runner: false;
  can_create_branch_or_pr: false;
  can_send_handoff: false;
  can_create_graph_or_vector_store: false;
  can_crawl_or_observe_browser: false;
  can_merge_publish_retry_replay_deploy: false;
  notes: string[];
}
