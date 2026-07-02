/**
 * Type-only Agent Workplane Source Ref / Trace Bridge Detail contract v0.1.
 *
 * This file defines a read-only detail shape for native Source Ref Bridge and
 * Trace Bridge absorption. It imports nothing, performs no reads or writes,
 * calls no routes, providers, OpenAI, GitHub, Codex, or runner runtime, and
 * has no side effects.
 */

export const WORKPLANE_BRIDGE_TRACE_DETAIL_VERSION =
  "workplane_bridge_trace_detail.v0.1" as const;

export type WorkplaneBridgeTraceStatus =
  | "ready"
  | "partial"
  | "empty"
  | "fallback"
  | "needs_review"
  | "insufficient_data";

export type WorkplaneBridgeTraceRefKind =
  | "current_perspective"
  | "delta_projection"
  | "projected_delta_batch"
  | "runner_delta_batch"
  | "work_event"
  | "coordination_event"
  | "action_record"
  | "evidence"
  | "artifact"
  | "handoff"
  | "diagnostic"
  | "snapshot"
  | "smoke"
  | "docs"
  | "repo"
  | "legacy_cockpit_compatibility";

export interface WorkplaneBridgeTraceDetailRef {
  ref_id: string;
  ref_kind: WorkplaneBridgeTraceRefKind;
  label: string;
  summary: string;
  source_panel_id: string;
  source_node_id: string;
  source_refs: string[];
  status: WorkplaneBridgeTraceStatus;
}

export interface WorkplaneBridgeTraceBridgeRow {
  row_id: string;
  title: string;
  source_panel_id: string;
  source_node_id: string;
  trace_role: string;
  ref_kinds: WorkplaneBridgeTraceRefKind[];
  ref_count: number;
  sample_refs: string[];
  validation_status: WorkplaneBridgeTraceStatus;
  authority_summary: string;
  status: WorkplaneBridgeTraceStatus;
}

export interface WorkplaneBridgeTraceValidationDetail {
  validation_id: string;
  source_panel_id: string;
  source_node_id: string;
  status: WorkplaneBridgeTraceStatus;
  smoke_refs: string[];
  required_checks: string[];
  completed_checks: string[];
  failed_checks: string[];
  skipped_checks: Array<{
    check: string;
    reason: string;
  }>;
  notes: string[];
  source_refs: string[];
}

export interface WorkplaneBridgeTraceEvidenceDetail {
  detail_id: string;
  ref_kind: "evidence" | "artifact" | "handoff";
  source_delta_id: string | null;
  ref_id: string;
  summary: string;
  pointer_semantics: "pointer_only" | string;
  status: string;
  authority_notes: string[];
  source_refs: string[];
}

export interface WorkplaneBridgeTraceDiagnosticDetail {
  detail_id: string;
  ref_kind: "diagnostic" | "snapshot" | "smoke" | "docs" | "repo";
  source_panel_id: string;
  ref_id: string;
  summary: string;
  status: string;
  notes: string[];
  source_refs: string[];
}

export interface WorkplaneBridgeTraceGapDetail {
  gap_id: string;
  capability_id:
    | "bridge"
    | "source_ref_visibility"
    | "validation_smoke_visibility"
    | "work_run_visibility"
    | "review_memory_proposal_visibility";
  status: WorkplaneBridgeTraceStatus;
  summary: string;
  required_next_step: string;
  source_refs: string[];
}

export interface WorkplaneBridgeTraceAuthorityBoundary {
  surface: "agent_workplane_bridge_trace_detail";
  read_only_bridge_trace_detail: true;
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
  can_recover_delta_batch: false;
  can_create_branch_or_pr: false;
  can_send_handoff: false;
  can_merge_publish_retry_replay_deploy: false;
  can_delete_or_shrink_legacy_cockpit: false;
  can_hide_legacy_cockpit: false;
  notes: string[];
}

export interface WorkplaneBridgeTraceDetailRead {
  version: typeof WORKPLANE_BRIDGE_TRACE_DETAIL_VERSION;
  status: WorkplaneBridgeTraceStatus;
  scope: string;
  as_of: string;
  bridge_rows: WorkplaneBridgeTraceBridgeRow[];
  source_ref_kinds: Array<{
    ref_kind: WorkplaneBridgeTraceRefKind;
    ref_count: number;
    sample_refs: string[];
    status: WorkplaneBridgeTraceStatus;
  }>;
  refs: WorkplaneBridgeTraceDetailRef[];
  validation_details: WorkplaneBridgeTraceValidationDetail[];
  evidence_details: WorkplaneBridgeTraceEvidenceDetail[];
  diagnostic_details: WorkplaneBridgeTraceDiagnosticDetail[];
  gap_details: WorkplaneBridgeTraceGapDetail[];
  authority_boundary: WorkplaneBridgeTraceAuthorityBoundary;
  source_refs: string[];
  fallback_notes: string[];
  staleness_notes: string[];
  validation_summary: {
    status: WorkplaneBridgeTraceStatus;
    smoke_refs: string[];
    notes: string[];
  };
  notes: string[];
}
