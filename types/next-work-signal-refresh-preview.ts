import type { DogfoodMetricSnapshotPreview } from "./dogfood-metric-snapshot-preview";
import type { DogfoodMetricSnapshotRecordReview } from "./dogfood-metric-snapshot-record-review";
import type { MetricInformedContinuityRelayAdjustmentPreview } from "./metric-informed-continuity-relay-adjustment-preview";
import type { PerspectiveNextWorkCandidateUpdatePreview } from "./perspective-next-work-candidate-update-preview";
import type { ReuseOutcomeBridgeLedgerRecordReview } from "./reuse-outcome-bridge-ledger-record-review";

export const NEXT_WORK_SIGNAL_REFRESH_PREVIEW_VERSION =
  "next_work_signal_refresh_preview.v0.1" as const;

export interface NextWorkSignalRefreshPreviewInput {
  dogfood_metric_snapshot_preview?: unknown;
  dogfood_metric_snapshot_record_review?: unknown;
  reuse_outcome_bridge_ledger_record_review?: unknown;
  existing_perspective_next_work_candidate_update_preview?: unknown;
  existing_metric_informed_continuity_relay_adjustment_preview?: unknown;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export type NextWorkSignalRefreshPreviewStatus =
  | "no_metric_material"
  | "insufficient_data"
  | "next_work_signals_available"
  | "ready_for_operator_review"
  | "keep_preview_only";

export type NextWorkSignalRefreshRecommendedNextAction =
  | "supply_metric_snapshot"
  | "review_next_work_signal_candidates"
  | "prepare_perspective_next_work_candidate_preview"
  | "prepare_metric_informed_relay_adjustment_preview"
  | "keep_preview_only";

export interface NextWorkSignalRefreshAuthorityBoundary {
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
  can_call_provider_openai: false;
  can_call_github: false;
  can_execute_codex: false;
  can_create_pr: false;
  can_merge_pr: false;
  can_run_autonomous_action: false;
  can_create_graph_or_vector_store: false;
  can_create_rag_stack: false;
  can_crawl_or_observe_browser: false;
  notes: string[];
}

export interface NextWorkSignalRefreshPreview {
  preview_version: typeof NEXT_WORK_SIGNAL_REFRESH_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  refresh_preview_status: NextWorkSignalRefreshPreviewStatus;
  recommended_next_action: NextWorkSignalRefreshRecommendedNextAction;
  input_summary: {
    has_metric_snapshot_preview: boolean;
    has_metric_snapshot_records: boolean;
    has_reuse_ledger_records: boolean;
    metric_material_count: number;
    next_work_signal_count: number;
    blocker_count: number;
    insufficient_data_count: number;
  };
  proposed_next_work_signals: {
    preserve_context_refs: string[];
    warn_context_refs: string[];
    drop_or_deprioritize_context_refs: string[];
    verification_focus_candidates: string[];
    expected_observed_followup_candidates: string[];
    handoff_quality_focus_candidates: string[];
    context_diet_candidates: string[];
    review_burden_reduction_candidates: string[];
  };
  evidence_summary: {
    has_metric_material: boolean;
    has_source_refs: boolean;
    has_evidence_refs: boolean;
    evidence_refs: string[];
    source_refs: string[];
    missing_evidence: string[];
  };
  blocked_reasons: string[];
  insufficient_data_reasons: string[];
  operator_review_checklist: string[];
  would_not_write: string[];
  non_goals: string[];
  authority_boundary: NextWorkSignalRefreshAuthorityBoundary;
}

export type NextWorkSignalRefreshMetricPreview = DogfoodMetricSnapshotPreview;
export type NextWorkSignalRefreshMetricRecordReview =
  DogfoodMetricSnapshotRecordReview;
export type NextWorkSignalRefreshReuseLedgerReview =
  ReuseOutcomeBridgeLedgerRecordReview;
export type NextWorkSignalRefreshPerspectivePreview =
  PerspectiveNextWorkCandidateUpdatePreview;
export type NextWorkSignalRefreshRelayPreview =
  MetricInformedContinuityRelayAdjustmentPreview;
