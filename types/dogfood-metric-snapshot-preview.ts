import type { DogfoodMetricCandidatePreview } from "./dogfood-metric-candidate-preview";
import type { ExpectedObservedDeltaRecordReview } from "./expected-observed-delta-record-review";
import type { HandoffReuseOutcomeLedgerRecord } from "./handoff-reuse-outcome-ledger";
import type { ReuseOutcomeBridgeLedgerRecordReview } from "./reuse-outcome-bridge-ledger-record-review";

export const DOGFOOD_METRIC_SNAPSHOT_PREVIEW_VERSION =
  "dogfood_metric_snapshot_preview.v0.1" as const;

export type DogfoodMetricSnapshotPreviewStatus =
  | "no_reuse_outcome_records"
  | "insufficient_data"
  | "metric_candidates_available"
  | "ready_for_operator_review"
  | "keep_preview_only";

export type DogfoodMetricSnapshotRecommendedNextAction =
  | "supply_reuse_outcome_records"
  | "review_dogfood_metric_snapshot_candidates"
  | "prepare_dogfood_metric_snapshot_decision"
  | "keep_preview_only"
  | "reject_metric_snapshot_candidate";

export interface DogfoodMetricSnapshotPreviewInput {
  reuse_outcome_bridge_ledger_record_review?: unknown;
  approved_reuse_ledger_records?: unknown[];
  expected_observed_delta_record_review?: unknown;
  work_episode_residue_candidate_preview?: unknown;
  metric_window?: Partial<DogfoodMetricSnapshotWindow>;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export interface DogfoodMetricSnapshotWindow {
  since: string | null;
  until: string | null;
  limit: number | null;
  filtered_by_operator_ref: string | null;
  filtered_by_result_ref: string | null;
  filtered_by_work_ref: string | null;
}

export type DogfoodMetricSnapshotCandidateBucket =
  | "helpful_context_signal_count"
  | "stale_context_signal_count"
  | "missing_context_signal_count"
  | "noisy_context_signal_count"
  | "misleading_context_signal_count"
  | "unknown_context_signal_count"
  | "skipped_or_unverified_check_count"
  | "not_done_item_count"
  | "expected_observed_mismatch_count"
  | "requirement_progress_gap_count"
  | "carry_forward_candidate_count"
  | "review_burden_signal_count"
  | "handoff_loss_signal_count"
  | "insufficient_data_record_count";

export interface DogfoodMetricSnapshotCandidateSummary {
  candidate_ref: string;
  bucket: DogfoodMetricSnapshotCandidateBucket;
  candidate_kind:
    | "reuse_quality_signal"
    | "handoff_quality_signal"
    | "expected_observed_quality_signal"
    | "verification_quality_signal"
    | "context_diet_signal"
    | "trend_quality_signal"
    | "insufficient_data_signal";
  label: string;
  summary: string;
  value: number;
  evidence_refs: string[];
  single_sample: boolean;
}

export type DogfoodMetricSnapshotAggregateCounts = Record<
  DogfoodMetricSnapshotCandidateBucket,
  number
> & {
  approved_reuse_ledger_record_count: number;
  raw_reuse_ledger_record_count: number;
  expected_observed_delta_record_count: number;
};

export interface DogfoodMetricSnapshotPreviewAuthorityBoundary {
  read_only: true;
  candidate_material_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_write_dogfood_metric_snapshot: false;
  can_write_dogfood_metrics: false;
  can_update_metrics: false;
  can_write_reuse_outcome_ledger: false;
  can_write_expected_observed_delta: false;
  can_write_work_episode: false;
  can_write_memory: false;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
  can_update_current_working_perspective: false;
  can_update_continuity_relay: false;
  can_mutate_handoff_context: false;
  can_send_handoff: false;
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

export interface DogfoodMetricSnapshotPreview {
  preview_version: typeof DOGFOOD_METRIC_SNAPSHOT_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  snapshot_preview_status: DogfoodMetricSnapshotPreviewStatus;
  recommended_next_action: DogfoodMetricSnapshotRecommendedNextAction;
  input_summary: {
    has_reuse_outcome_bridge_ledger_record_review: boolean;
    reuse_ledger_record_review_status: string | null;
    approved_reuse_ledger_record_count: number;
    raw_reuse_ledger_record_count: number;
    expected_observed_delta_record_count: number;
    metric_candidate_ref_count: number;
    blocker_count: number;
    insufficient_data_count: number;
    single_sample: boolean;
  };
  metric_window: DogfoodMetricSnapshotWindow;
  source_record_summary: {
    reuse_ledger_record_refs: string[];
    result_refs: string[];
    work_refs: string[];
    handoff_refs: string[];
    operator_refs: string[];
    expected_observed_delta_record_refs: string[];
  };
  aggregate_counts: DogfoodMetricSnapshotAggregateCounts;
  reuse_quality_metrics: {
    helpful_context_signal_count: number;
    stale_context_signal_count: number;
    missing_context_signal_count: number;
    noisy_context_signal_count: number;
    misleading_context_signal_count: number;
    unknown_context_signal_count: number;
    helpful_ratio: number | null;
    problem_signal_count: number;
  };
  handoff_quality_metrics: {
    skipped_or_unverified_check_count: number;
    not_done_item_count: number;
    handoff_loss_signal_count: number;
    carry_forward_candidate_count: number;
  };
  expected_observed_quality_metrics: {
    expected_observed_mismatch_count: number;
    requirement_progress_gap_count: number;
    expected_observed_delta_record_count: number;
  };
  verification_quality_metrics: {
    skipped_or_unverified_check_count: number;
    verified_success_count: 0;
    verification_burden_count: number;
  };
  context_diet_metrics: {
    preserve_candidate_count: number;
    warn_candidate_count: number;
    drop_or_deprioritize_candidate_count: number;
    unknown_context_signal_count: number;
  };
  metric_trend_candidates: DogfoodMetricSnapshotCandidateSummary[];
  metric_candidate_summaries: DogfoodMetricSnapshotCandidateSummary[];
  dogfood_metric_candidate_preview: DogfoodMetricCandidatePreview | null;
  evidence_summary: {
    has_reuse_outcome_records: boolean;
    has_expected_observed_material: boolean;
    has_source_refs: boolean;
    has_evidence_refs: boolean;
    evidence_refs: string[];
    source_refs: string[];
    missing_evidence: string[];
    single_sample_not_trend: boolean;
  };
  blocked_reasons: string[];
  insufficient_data_reasons: string[];
  operator_review_checklist: string[];
  would_not_write: string[];
  non_goals: string[];
  authority_boundary: DogfoodMetricSnapshotPreviewAuthorityBoundary;
}

export type DogfoodMetricSnapshotPreviewReuseRecord =
  HandoffReuseOutcomeLedgerRecord;
export type DogfoodMetricSnapshotPreviewReuseLedgerReview =
  ReuseOutcomeBridgeLedgerRecordReview;
export type DogfoodMetricSnapshotPreviewExpectedObservedReview =
  ExpectedObservedDeltaRecordReview;
