/**
 * Type-only Agent Workplane Run Postmortem Detail contract v0.1.
 *
 * This file defines a read-only detail shape for native Run Postmortem
 * visibility. It imports nothing, performs no reads or writes, calls no
 * routes, providers, OpenAI, GitHub, Codex, runner runtime, runner recovery,
 * memory apply, Perspective apply, or delta apply helpers, and has no side
 * effects.
 */

export const WORKPLANE_RUN_POSTMORTEM_DETAIL_VERSION =
  "workplane_run_postmortem_detail.v0.1" as const;

export type WorkplaneRunPostmortemStatus =
  | "ready"
  | "partial"
  | "empty"
  | "fallback"
  | "needs_review"
  | "insufficient_data";

export type WorkplaneRunPostmortemRunStatus =
  | "planned"
  | "running"
  | "paused"
  | "blocked"
  | "completed"
  | "needs_review"
  | "cancelled"
  | "scheduled"
  | "failed"
  | "stopped"
  | "unknown";

export type WorkplaneRunPostmortemEventKind =
  | "run_created"
  | "run_scheduled"
  | "run_started"
  | "run_completed"
  | "run_needs_review"
  | "run_blocked"
  | "run_cancelled"
  | "run_failed"
  | "run_paused"
  | "run_resumed"
  | "step_started"
  | "step_completed"
  | "step_blocked"
  | "step_failed"
  | "step_cancelled"
  | "delta_batch_recovered"
  | "tick_skipped"
  | "unknown";

export type WorkplaneRunPostmortemSignalStatus =
  | "healthy"
  | "watch"
  | "needs_review"
  | "blocked"
  | "insufficient_data"
  | "unknown";

export interface WorkplaneRunPostmortemRunSummary {
  run_id: string;
  run_title: string;
  run_status: WorkplaneRunPostmortemRunStatus;
  latest_batch_id: string | null;
  recovered_batch_count: number;
  recovered_delta_count: number;
  validation_status: WorkplaneRunPostmortemSignalStatus;
  source_refs: string[];
  related_step_ids: string[];
  related_event_ids: string[];
  related_delta_ids: string[];
  notes: string[];
}

export interface WorkplaneRunPostmortemStepSummary {
  step_id: string;
  run_id: string;
  status: WorkplaneRunPostmortemStatus;
  source_refs: string[];
  related_batch_ids: string[];
  related_delta_ids: string[];
  summary: string;
}

export interface WorkplaneRunPostmortemEventSummary {
  event_id: string;
  run_id: string;
  event_kind: WorkplaneRunPostmortemEventKind;
  status: WorkplaneRunPostmortemStatus;
  source_refs: string[];
  related_batch_ids: string[];
  related_delta_ids: string[];
  summary: string;
}

export interface WorkplaneRunPostmortemDeltaBatchSummary {
  batch_id: string;
  run_id: string;
  title: string;
  summary: string;
  batch_status: WorkplaneRunPostmortemStatus;
  created_at: string;
  delta_count: number;
  validation_status: WorkplaneRunPostmortemSignalStatus;
  source_refs: string[];
  related_step_ids: string[];
  related_event_ids: string[];
  related_delta_ids: string[];
  authority_notes: string[];
}

export interface WorkplaneRunPostmortemTimelineItem {
  timeline_id: string;
  occurred_at: string;
  item_kind:
    | "run"
    | "step"
    | "event"
    | "delta_batch"
    | "validation"
    | "source_ref";
  title: string;
  summary: string;
  status: WorkplaneRunPostmortemStatus;
  source_refs: string[];
}

export interface WorkplaneRunPostmortemSignal {
  signal_id:
    | "runner_readback_available"
    | "recovered_delta_batch_available"
    | "validation_status_visible"
    | "related_step_event_refs_visible"
    | "source_refs_visible"
    | "no_apply_boundary_visible"
    | "insufficient_runner_baseline_visible";
  status: WorkplaneRunPostmortemSignalStatus;
  summary: string;
  source_refs: string[];
}

export interface WorkplaneRunPostmortemGapDetail {
  gap_id:
    | "missing_direct_runner_ledger_event_payload_detail"
    | "missing_richer_postmortem_timeline"
    | "missing_repeated_dogfood_metrics_baseline"
    | "missing_legacy_local_ui_control_classification";
  status: WorkplaneRunPostmortemStatus;
  summary: string;
  required_next_step: string;
  source_refs: string[];
}

export interface WorkplaneRunPostmortemAuthorityBoundary {
  surface: "agent_workplane_run_postmortem_detail";
  read_only_run_postmortem_detail: true;
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
  can_tick_runner: false;
  can_schedule_runner: false;
  can_recover_delta_batch: false;
  can_create_branch_or_pr: false;
  can_send_handoff: false;
  can_merge_publish_retry_replay_deploy: false;
  can_delete_or_shrink_legacy_cockpit: false;
  can_hide_legacy_cockpit: false;
  notes: string[];
}

export interface WorkplaneRunPostmortemDetailRead {
  version: typeof WORKPLANE_RUN_POSTMORTEM_DETAIL_VERSION;
  status: WorkplaneRunPostmortemStatus;
  scope: string;
  as_of: string;
  run_summaries: WorkplaneRunPostmortemRunSummary[];
  step_summaries: WorkplaneRunPostmortemStepSummary[];
  event_summaries: WorkplaneRunPostmortemEventSummary[];
  delta_batch_summaries: WorkplaneRunPostmortemDeltaBatchSummary[];
  timeline_items: WorkplaneRunPostmortemTimelineItem[];
  postmortem_signals: WorkplaneRunPostmortemSignal[];
  gap_details: WorkplaneRunPostmortemGapDetail[];
  authority_boundary: WorkplaneRunPostmortemAuthorityBoundary;
  source_refs: string[];
  fallback_notes: string[];
  staleness_notes: string[];
  validation_summary: {
    status: WorkplaneRunPostmortemStatus;
    smoke_refs: string[];
    notes: string[];
  };
  notes: string[];
}
