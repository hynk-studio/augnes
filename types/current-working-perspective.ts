/**
 * Type-only Current Working Perspective v0.1 contract.
 *
 * This file defines a read-only derived perspective packet built from
 * PerspectiveSnapshot and AugnesDeltaProjectionReadModel inputs. It imports
 * only types, performs no DB reads or writes, calls no routes, calls no
 * providers, OpenAI, GitHub, or Codex runtime, and has no side effects.
 */

import type {
  AugnesDelta,
  AugnesDeltaAuthorityBoundary,
  DeltaBatch,
  ResearchDiagnosticRef,
  SnapshotRef,
} from "./augnes-delta";
import type {
  AugnesDeltaProjectionGap,
  AugnesDeltaProjectionReadModel,
  AugnesDeltaProjectionSourceCounts,
  AugnesDeltaProjectionSourceRefs,
} from "./augnes-delta-projection";

export const CURRENT_WORKING_PERSPECTIVE_VERSION =
  "current_working_perspective.v0.1" as const;

export const CURRENT_WORKING_PERSPECTIVE_GAP_SEVERITIES = [
  "low",
  "medium",
  "high",
] as const;

export const CURRENT_WORKING_PERSPECTIVE_STALENESS_STATUSES = [
  "fresh",
  "stale",
  "partial",
  "unknown",
] as const;

export type CurrentWorkingPerspectiveGapSeverity =
  (typeof CURRENT_WORKING_PERSPECTIVE_GAP_SEVERITIES)[number];

export type CurrentWorkingPerspectiveStalenessStatus =
  (typeof CURRENT_WORKING_PERSPECTIVE_STALENESS_STATUSES)[number];

export interface CurrentWorkingPerspective {
  runtime: "augnes";
  perspective_version: typeof CURRENT_WORKING_PERSPECTIVE_VERSION;
  projection_version: "augnes_delta_projection.v0.1";
  snapshot_version: "perspective_snapshot.v0.1";
  scope: string;
  as_of: string;
  current_frame: CurrentWorkingPerspectiveFrame;
  current_thesis: CurrentWorkingPerspectiveThesis;
  active_goals: CurrentWorkingPerspectiveGoal[];
  accepted_assumptions: CurrentWorkingPerspectiveAssumption[];
  rejected_assumptions: CurrentWorkingPerspectiveAssumption[];
  open_questions: CurrentWorkingPerspectiveOpenQuestion[];
  active_risks: CurrentWorkingPerspectiveRisk[];
  research_pressure: CurrentWorkingPerspectiveResearchPressure;
  next_candidates: CurrentWorkingPerspectiveNextCandidate[];
  last_major_delta_refs: CurrentWorkingPerspectiveDeltaRef[];
  review_queue_hints: CurrentWorkingPerspectiveReviewQueueHints;
  source_refs: CurrentWorkingPerspectiveSourceRefs;
  staleness: CurrentWorkingPerspectiveStaleness;
  gaps: CurrentWorkingPerspectiveGap[];
  authority_boundary: CurrentWorkingPerspectiveAuthorityBoundary;
  next_phase_notes: string[];
}

export interface CurrentWorkingPerspectiveInput {
  scope: string;
  as_of?: string;
  snapshot: CurrentWorkingPerspectiveSnapshotInput;
  delta_projection: AugnesDeltaProjectionReadModel;
  project_constellation_refs?: string[];
  next_phase_notes?: string[];
}

export interface CurrentWorkingPerspectiveResult {
  current_working_perspective: CurrentWorkingPerspective;
  active_goal_count: number;
  next_candidate_count: number;
  review_queue_count: number;
  gap_count: number;
}

export interface CurrentWorkingPerspectiveSnapshotInput {
  runtime: "augnes";
  snapshot_version: "perspective_snapshot.v0.1";
  scope: string;
  as_of: string;
  source_refs: CurrentWorkingPerspectiveSnapshotSourceRefs;
  committed_state_basis: {
    summary: string;
    active: CurrentWorkingPerspectiveSnapshotStateBasisItem[];
    future: CurrentWorkingPerspectiveSnapshotStateBasisItem[];
    completed: CurrentWorkingPerspectiveSnapshotStateBasisItem[];
    deprecated: CurrentWorkingPerspectiveSnapshotStateBasisItem[];
  };
  pending_proposal_pressure: {
    count: number;
    pressure_level: "none" | "low" | "medium" | "high";
    summary_reason: string;
  };
  evidence_basis: {
    count: number;
    summary_reason: string;
  };
  work_trace_basis: {
    count: number;
    active: CurrentWorkingPerspectiveSnapshotWorkTraceItem[];
    summary_reason: string;
  };
  action_trace_basis: {
    count: number;
    summary_reason: string;
  };
  open_tensions: {
    count: number;
    items: CurrentWorkingPerspectiveSnapshotTensionItem[];
  };
  current_frame: {
    summary: string;
    primary_state_keys: string[];
    active_work_ids: string[];
    pressure_level: "none" | "low" | "medium" | "high";
  };
  boundary_next: {
    title: string;
    rationale: string;
    suggested_actor: string;
    priority: string;
    related_state_keys: string[];
    allowed_next_steps: string[];
    forbidden_next_steps: string[];
  };
  missing_context: string[];
  research_diagnostics: CurrentWorkingPerspectiveSnapshotResearchDiagnostics;
}

export interface CurrentWorkingPerspectiveSnapshotSourceRefs {
  state_brief_as_of: string;
  state_entry_ids: string[];
  pending_proposal_ids: string[];
  evidence_ids: string[];
  work_ids: string[];
  work_event_ids: string[];
  action_record_ids: string[];
  tension_ids: string[];
  execution_lane_ids: string[];
}

export interface CurrentWorkingPerspectiveSnapshotStateBasisItem {
  id: string;
  state_key: string;
  temporal_scope: string;
  stability: string;
  change_type: string;
  source_agent_id: string | null;
  source_session_id: string | null;
  updated_at: string;
}

export interface CurrentWorkingPerspectiveSnapshotWorkTraceItem {
  work_id: string;
  title: string;
  status: string;
  priority: string;
  summary: string;
  next_action: string;
  user_attention_required: boolean;
  related_state_keys: string[];
  recent_events: Array<{
    id: string;
    actor: string;
    event_type: string;
    summary: string;
    result_status: string | null;
    result_kind: string | null;
    related_action_id: string | null;
    related_pr: string | null;
    related_state_keys: string[];
    created_at: string;
  }>;
  updated_at: string;
}

export interface CurrentWorkingPerspectiveSnapshotTensionItem {
  id: string;
  state_key: string | null;
  title: string;
  description: string;
  severity: string;
  source_agent_id: string | null;
  source_session_id: string | null;
  created_at: string;
}

export interface CurrentWorkingPerspectiveSnapshotResearchDiagnostics {
  mode: "log_only";
  loopness_hint: {
    version: string;
    mode: "log_only";
    score: number;
    level: "none" | "low" | "medium" | "high";
    source_refs: {
      action_record_ids: string[];
      work_event_ids: string[];
      pending_proposal_ids: string[];
      tension_ids: string[];
    };
    notes: string[];
  };
  notes: string[];
}

export interface CurrentWorkingPerspectiveFrame {
  summary: string;
  primary_state_keys: string[];
  active_work_ids: string[];
  pressure_level: "none" | "low" | "medium" | "high";
  source_refs: string[];
  non_authority_notes: string[];
}

export interface CurrentWorkingPerspectiveThesis {
  summary: string;
  supporting_points: string[];
  source_refs: string[];
  confidence: "bounded_read_model" | "partial" | "unknown";
  non_authority_notes: string[];
}

export interface CurrentWorkingPerspectiveGoal {
  goal_id: string;
  title: string;
  status: string;
  priority: string;
  summary: string;
  next_action: string;
  source_refs: string[];
  user_attention_required: boolean;
}

export interface CurrentWorkingPerspectiveAssumption {
  assumption_id: string;
  assumption_kind:
    | "committed_state_basis"
    | "delta_rejected"
    | "projection_boundary"
    | string;
  summary: string;
  source_refs: string[];
  durability: "committed_state_ref" | "projection_metadata" | "sample_only";
  non_authority_notes: string[];
}

export interface CurrentWorkingPerspectiveOpenQuestion {
  question_id: string;
  summary: string;
  severity: CurrentWorkingPerspectiveGapSeverity;
  source_refs: string[];
  suggested_review_path: string;
}

export interface CurrentWorkingPerspectiveRisk {
  risk_id: string;
  summary: string;
  severity: CurrentWorkingPerspectiveGapSeverity;
  source_refs: string[];
  blocked_authority_notes: string[];
}

export interface CurrentWorkingPerspectiveResearchPressure {
  pressure_level: "none" | "low" | "medium" | "high";
  pending_proposal_count: number;
  projection_gap_count: number;
  diagnostic_refs: ResearchDiagnosticRef[];
  notes: string[];
  non_authority_notes: string[];
}

export interface CurrentWorkingPerspectiveNextCandidate {
  candidate_id: string;
  title: string;
  rationale: string;
  priority: string;
  source_refs: string[];
  allowed_next_steps: string[];
  blocked_next_steps: string[];
  authority_required: "manual_review" | "future_contract" | "none";
}

export interface CurrentWorkingPerspectiveDeltaRef {
  delta_id: string;
  type: AugnesDelta["type"];
  status: AugnesDelta["status"];
  source: AugnesDelta["source"];
  title: string;
  created_at: string;
  source_refs: string[];
  review_reason: string;
}

export interface CurrentWorkingPerspectiveReviewQueueHints {
  needs_review_delta_ids: string[];
  blocked_delta_ids: string[];
  manual_review_delta_ids: string[];
  validation_required_delta_ids: string[];
  project_perspective_review_delta_ids: string[];
  durable_memory_review_delta_ids: string[];
  user_decision_delta_ids: string[];
  notes: string[];
}

export interface CurrentWorkingPerspectiveSourceRefs {
  perspective_snapshot: {
    snapshot_version: "perspective_snapshot.v0.1";
    as_of: string;
    source_refs: CurrentWorkingPerspectiveSnapshotSourceRefs;
  };
  delta_projection: {
    projection_version: "augnes_delta_projection.v0.1";
    as_of: string;
    source_refs: AugnesDeltaProjectionSourceRefs;
    source_counts: AugnesDeltaProjectionSourceCounts;
    delta_ids: string[];
    batch_ids: string[];
    gap_codes: string[];
  };
  snapshot_refs: SnapshotRef[];
  diagnostic_refs: ResearchDiagnosticRef[];
  project_constellation_refs: string[];
}

export interface CurrentWorkingPerspectiveStaleness {
  status: CurrentWorkingPerspectiveStalenessStatus;
  snapshot_as_of: string;
  projection_as_of: string;
  freshness_notes: string[];
  source_gap_codes: string[];
}

export interface CurrentWorkingPerspectiveGap {
  code: string;
  severity: CurrentWorkingPerspectiveGapSeverity;
  summary: string;
  source_refs: string[];
  inherited_projection_gap?: AugnesDeltaProjectionGap;
}

export interface CurrentWorkingPerspectiveAuthorityBoundary
  extends AugnesDeltaAuthorityBoundary {
  derived_view_only: true;
  can_write_db: false;
  can_add_route: false;
  can_add_ui: false;
}

export interface CurrentWorkingPerspectiveSourceBundle {
  snapshot: CurrentWorkingPerspectiveSnapshotInput;
  delta_projection: AugnesDeltaProjectionReadModel;
  deltas: AugnesDelta[];
  batches: DeltaBatch[];
}
