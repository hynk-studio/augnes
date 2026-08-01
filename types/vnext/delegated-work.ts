import type {
  NativeHostApprovalDecisionKindV01,
  NativeHostApprovalOperationV01,
  NativeHostRunModeV01,
} from "./native-host-adapter";

export const DELEGATED_WORK_PROJECTION_VERSION_V01 =
  "delegated_work_projection.v0.1" as const;

export const DELEGATED_WORK_LIMITS_V01 = {
  timeline_items: 12,
  checkpoint_items: 6,
  text_characters: 320,
  goal_characters: 2_000,
  source_refs: 16,
  serialized_bytes: 48 * 1_024,
} as const;

export type DelegatedWorkSourceStatusV01 =
  | "available"
  | "partial"
  | "unavailable";

export type DelegatedWorkStageV01 =
  | "not_started"
  | "preparing"
  | "working"
  | "waiting_for_approval"
  | "cancelling"
  | "resume_required"
  | "result_ready"
  | "blocked"
  | "failed"
  | "cancelled"
  | "timed_out"
  | "unavailable";

export type DelegatedWorkTimelineKindV01 =
  | "delegated"
  | "preparing"
  | "codex_started"
  | "checkpoint_started"
  | "checkpoint_completed"
  | "approval_requested"
  | "approval_approved"
  | "approval_declined"
  | "cancellation_requested"
  | "connection_interrupted"
  | "resumed"
  | "result_saved"
  | "blocked"
  | "failed"
  | "cancelled"
  | "timed_out";

export type DelegatedWorkTimelineBasisV01 =
  | "observed"
  | "host_attested"
  | "enforced"
  | "derived_from_persisted_state";

export type DelegatedWorkTimelineToneV01 =
  | "neutral"
  | "active"
  | "attention"
  | "success"
  | "danger";

export type DelegatedWorkNextActionKindV01 =
  | "open_ai_workplane"
  | "start_codex_work"
  | "review_requested_access"
  | "resume_codex_work"
  | "view_progress"
  | "review_result"
  | "return_to_blank_state"
  | "none";

export interface DelegatedWorkTimelineItemV01 {
  item_id: string;
  kind: DelegatedWorkTimelineKindV01;
  title: string;
  summary: string;
  occurred_at: string;
  basis: DelegatedWorkTimelineBasisV01;
  tone: DelegatedWorkTimelineToneV01;
  current: boolean;
  /** Internal bounded event reference. It is not default display material. */
  source_event_ref: string | null;
}

export interface DelegatedWorkNextActionV01 {
  kind: DelegatedWorkNextActionKindV01;
  label: string | null;
  href: string | null;
  executes: false;
}

export interface DelegatedWorkPendingApprovalV01 {
  /** Exact internal control binding; never rendered as human copy. */
  approval_ref: string;
  operation_class: NativeHostApprovalOperationV01;
  title: string;
  reason: string;
  risk: string;
  resource_summary: string;
  repository_relative_paths: string[];
  network_resources: string[];
  command_summary: string | null;
  available_decisions: NativeHostApprovalDecisionKindV01[];
  expires_at: string | null;
  decision_submitted: boolean;
}

export interface DelegatedWorkAuthorityBoundaryV01 {
  writes_database: false;
  creates_run: false;
  starts_codex: false;
  approves_host_action: false;
  cancels_run: false;
  resumes_run: false;
  creates_result: false;
  establishes_task_success: false;
  creates_evidence: false;
  changes_project_state: false;
  calls_provider: false;
  calls_github: false;
  retries: false;
}

export interface DelegatedWorkProjectionV01 {
  projection_version: typeof DELEGATED_WORK_PROJECTION_VERSION_V01;
  workspace_id: string;
  project_id: string;
  /** Exact internal control binding; never rendered as human copy. */
  run_ref: string | null;
  mode: NativeHostRunModeV01 | null;
  source_status: DelegatedWorkSourceStatusV01;
  stage: DelegatedWorkStageV01;
  started_at: string | null;
  updated_at: string | null;
  finished_at: string | null;
  current: {
    goal: string | null;
    stage_label: string;
    situation: string;
    latest_checkpoint: string | null;
    material_blocker_or_request: string | null;
    reconciliation_required: boolean;
    last_observed_at: string | null;
    trusted_result_available: boolean;
    needs_user: boolean;
  };
  timeline: DelegatedWorkTimelineItemV01[];
  compacted_item_count: number;
  gap_notes: string[];
  next_action: DelegatedWorkNextActionV01;
  pending_approval: DelegatedWorkPendingApprovalV01 | null;
  result: null | {
    receipt_ref: string;
    outcome: string | null;
    review_href: string;
  };
  exact_detail_href: string | null;
  start_eligible: boolean;
  start_blocker: string | null;
  control_revision: number;
  can_cancel: boolean;
  authority: DelegatedWorkAuthorityBoundaryV01;
}
