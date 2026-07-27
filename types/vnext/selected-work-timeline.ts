export const SELECTED_WORK_TIMELINE_VERSION_V01 =
  "selected_work_timeline.v0.1" as const;

export const SELECTED_WORK_TIMELINE_MAX_ITEMS_V01 = 8 as const;

export type SelectedWorkTimelineStageV01 =
  | "source_observed"
  | "change_suggested"
  | "review_focused"
  | "decision_recorded"
  | "deferred_until_condition"
  | "awaiting_application"
  | "transition_blocked"
  | "project_updated"
  | "later_outcome_available"
  | "later_outcome_reviewed";

export type SelectedWorkTimelineBasisV01 =
  | "observed"
  | "bounded_interpretation"
  | "user_decision"
  | "authorized_change"
  | "later_outcome";

export type SelectedWorkTimelineItemStatusV01 =
  | "completed"
  | "current"
  | "pending"
  | "blocked"
  | "superseded";

export type SelectedWorkTimelinePrimaryActionOwnerV01 =
  | "decision"
  | "transition"
  | "candidate_selection"
  | "none";

export interface SelectedWorkTimelineSourceRefV01 {
  source_kind:
    | "source_result"
    | "proposal"
    | "candidate"
    | "decision"
    | "semantic_gate"
    | "project_update"
    | "later_result"
    | "later_feedback";
  record_id: string;
  record_fingerprint: string | null;
}

export interface SelectedWorkTimelineItemV01 {
  item_id: string;
  stage: SelectedWorkTimelineStageV01;
  basis: SelectedWorkTimelineBasisV01;
  status: SelectedWorkTimelineItemStatusV01;
  title: string;
  summary: string;
  meaning_change: string;
  occurred_at: string | null;
  time_status: "exact" | "not_established";
  order_basis: "source_lineage" | "semantic_sequence" | "partial_order";
  source_refs: SelectedWorkTimelineSourceRefV01[];
  destination: string | null;
  projection_only: true;
  grants_semantic_authority: false;
}

export interface SelectedWorkTimelineV01 {
  timeline_version: typeof SELECTED_WORK_TIMELINE_VERSION_V01;
  selected_work: {
    title: string;
    operation_label: string;
    current_meaning: string;
    selected_candidate_id: string;
    selected_candidate_fingerprint: string;
    selected_candidate_scope: true;
  };
  items: SelectedWorkTimelineItemV01[];
  bounded_item_count: number;
  omitted_item_count: number;
  current_item_id: string;
  current_position: {
    stage: SelectedWorkTimelineStageV01;
    title: string;
    summary: string;
    next_meaningful_step: string;
    primary_action_owner: SelectedWorkTimelinePrimaryActionOwnerV01;
    destination: string | null;
  };
  authority: {
    projection_only: true;
    rebuildable: true;
    writes_database: false;
    creates_timeline_record: false;
    creates_decision: false;
    authorizes_transition: false;
    applies_transition: false;
    establishes_truth: false;
    establishes_verified_success: false;
    changes_project_state: false;
    changes_later_context: false;
    calls_model_or_provider: false;
    performs_external_action: false;
  };
}
