import type { DogfoodMetricSnapshotRecordReview } from "./dogfood-metric-snapshot-record-review";
import type { MetricInformedContinuityRelayAdjustmentPreview } from "./metric-informed-continuity-relay-adjustment-preview";
import type { NextWorkSignalOperatorDecisionPreview } from "./next-work-signal-decision";
import type { NextWorkSignalDecisionRecordReview } from "./next-work-signal-decision-record-review";
import type { NextWorkSignalRefreshPreview } from "./next-work-signal-refresh-preview";
import type { PerspectiveNextWorkCandidateUpdatePreview } from "./perspective-next-work-candidate-update-preview";

export const PERSPECTIVE_RELAY_UPDATE_CANDIDATE_BRIDGE_PREVIEW_VERSION =
  "perspective_relay_update_candidate_bridge_preview.v0.1" as const;

export interface PerspectiveRelayUpdateCandidateBridgePreviewInput {
  next_work_signal_decision_preview?: unknown;
  next_work_signal_decision_record_review?: unknown;
  next_work_signal_refresh_preview?: unknown;
  dogfood_metric_snapshot_record_review?: unknown;
  existing_perspective_next_work_candidate_update_preview?: unknown;
  existing_metric_informed_continuity_relay_adjustment_preview?: unknown;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export type PerspectiveRelayUpdateCandidateBridgeStatus =
  | "no_next_work_signal_material"
  | "insufficient_data"
  | "update_candidates_available"
  | "ready_for_operator_review"
  | "keep_preview_only";

export type PerspectiveRelayUpdateCandidateBridgeRecommendedNextAction =
  | "supply_next_work_signal_decision"
  | "review_perspective_relay_update_candidates"
  | "prepare_perspective_next_work_update_decision"
  | "prepare_continuity_relay_update_contract"
  | "keep_preview_only";

export interface PerspectiveRelayUpdateCandidateBridgeAuthorityBoundary {
  read_only: true;
  candidate_material_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
  can_update_current_working_perspective: false;
  can_update_continuity_relay: false;
  can_mutate_handoff_context: false;
  can_send_handoff: false;
  can_write_memory: false;
  can_write_dogfood_metrics: false;
  can_write_reuse_outcome_ledger: false;
  can_write_expected_observed_delta: false;
  can_write_work_episode: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_execute_codex: false;
  notes: string[];
}

export interface PerspectiveRelayUpdateCandidateBridgePreview {
  preview_version: typeof PERSPECTIVE_RELAY_UPDATE_CANDIDATE_BRIDGE_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  bridge_preview_status: PerspectiveRelayUpdateCandidateBridgeStatus;
  recommended_next_action: PerspectiveRelayUpdateCandidateBridgeRecommendedNextAction;
  input_summary: {
    has_next_work_signal_decision_preview: boolean;
    has_next_work_signal_decision_records: boolean;
    has_next_work_signal_refresh_preview: boolean;
    candidate_material_count: number;
    blocker_count: number;
    insufficient_data_count: number;
  };
  proposed_perspective_unit_candidates: {
    reinforce_candidates: string[];
    weaken_or_warn_candidates: string[];
    retire_or_deprioritize_candidates: string[];
    split_or_review_candidates: string[];
  };
  proposed_next_work_bias_candidates: {
    preserve_next_time: string[];
    warn_next_time: string[];
    drop_or_deprioritize: string[];
    verification_bias: string[];
    context_diet_bias: string[];
    handoff_quality_bias: string[];
  };
  proposed_continuity_relay_candidates: {
    preserve_anchor_candidates: string[];
    warn_anchor_candidates: string[];
    stop_if_missing_candidates: string[];
    next_focus_candidates: string[];
    relay_update_suggestions: string[];
  };
  evidence_summary: {
    has_next_work_signal_material: boolean;
    has_source_refs: boolean;
    has_evidence_refs: boolean;
    source_refs: string[];
    evidence_refs: string[];
    missing_evidence: string[];
  };
  blocked_reasons: string[];
  insufficient_data_reasons: string[];
  operator_review_checklist: string[];
  would_not_write: string[];
  non_goals: string[];
  authority_boundary: PerspectiveRelayUpdateCandidateBridgeAuthorityBoundary;
}

export type PerspectiveRelayUpdateCandidateBridgeDecisionPreview =
  NextWorkSignalOperatorDecisionPreview;
export type PerspectiveRelayUpdateCandidateBridgeRecordReview =
  NextWorkSignalDecisionRecordReview;
export type PerspectiveRelayUpdateCandidateBridgeRefreshPreview =
  NextWorkSignalRefreshPreview;
export type PerspectiveRelayUpdateCandidateBridgeMetricReview =
  DogfoodMetricSnapshotRecordReview;
export type PerspectiveRelayUpdateCandidateBridgePerspectivePreview =
  PerspectiveNextWorkCandidateUpdatePreview;
export type PerspectiveRelayUpdateCandidateBridgeRelayPreview =
  MetricInformedContinuityRelayAdjustmentPreview;
