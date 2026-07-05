import type {
  DogfoodMetricSnapshotNoSideEffects,
  DogfoodMetricSnapshotRecord,
  DogfoodMetricSnapshotStoreResult,
} from "./dogfood-metric-snapshot-write";

export const DOGFOOD_METRIC_SNAPSHOT_RECORD_REVIEW_VERSION =
  "dogfood_metric_snapshot_record_review.v0.1" as const;

export interface DogfoodMetricSnapshotRecordReviewInput {
  records?: unknown[];
  store_result?: DogfoodMetricSnapshotStoreResult | null;
  selected_record_id?: string | null;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export type DogfoodMetricSnapshotRecordReviewStatus =
  | "no_records"
  | "schema_missing"
  | "records_available"
  | "selected_record_found"
  | "selected_record_missing"
  | "records_invalid";

export interface DogfoodMetricSnapshotRecordSummary {
  record_id: string;
  idempotency_key: string;
  created_at: string;
  operator_ref: string | null;
  metric_window_start: string | null;
  metric_window_end: string | null;
  reuse_ledger_source_count: number;
  expected_observed_source_count: number;
  helpful_context_signal_count: number;
  stale_context_signal_count: number;
  missing_context_signal_count: number;
  noisy_context_signal_count: number;
  misleading_context_signal_count: number;
  unknown_context_signal_count: number;
  skipped_or_unverified_check_count: number;
  not_done_item_count: number;
  expected_observed_mismatch_count: number;
  review_burden_signal_count: number;
  carry_forward_candidate_count: number;
  record_fingerprint: string | null;
  receipt_no_side_effects_valid: boolean;
  problem_reasons: string[];
}

export interface DogfoodMetricSnapshotNoSideEffectsSummary {
  dogfood_metric_snapshot_record_written_count: number;
  dogfood_metric_snapshot_receipt_written_count: number;
  dogfood_metric_snapshot_persisted_count: number;
  dogfood_metrics_global_state_updated_count: number;
  reuse_outcome_ledger_written_count: number;
  expected_observed_delta_written_count: number;
  work_episode_written_count: number;
  memory_mutated_count: number;
  current_working_perspective_updated_count: number;
  perspective_unit_written_count: number;
  next_work_bias_written_count: number;
  continuity_relay_written_count: number;
  handoff_context_mutated_count: number;
  selected_refs_written_to_live_handoff_count: number;
  handoff_sent_count: number;
  provider_called_count: number;
  github_called_count: number;
  codex_executed_count: number;
  pr_created_count: number;
  pr_merged_count: number;
  autonomous_action_run_count: number;
  graph_or_vector_store_created_count: number;
  rag_stack_created_count: number;
  crawler_or_browser_observer_created_count: number;
}

export interface DogfoodMetricSnapshotRecordReviewAuthorityBoundary {
  read_only_record_review: true;
  source_of_truth: false;
  can_write_db: false;
  can_create_schema: false;
  can_write_dogfood_metric_snapshot: false;
  can_write_dogfood_metrics: false;
  can_update_metrics: false;
  can_write_reuse_outcome_ledger: false;
  can_write_expected_observed_delta: false;
  can_write_work_episode: false;
  can_write_memory: false;
  can_mutate_current_working_perspective: false;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
  can_update_continuity_relay: false;
  can_mutate_handoff_context: false;
  can_apply_handoff_context: false;
  can_write_selected_refs_to_live_handoff: false;
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

export interface DogfoodMetricSnapshotRecordReview {
  review_version: typeof DOGFOOD_METRIC_SNAPSHOT_RECORD_REVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  review_status: DogfoodMetricSnapshotRecordReviewStatus;
  input_summary: {
    supplied_record_count: number;
    valid_record_count: number;
    invalid_record_count: number;
    selected_record_id: string | null;
    selected_record_found: boolean;
    latest_record_id: string | null;
    latest_record_created_at: string | null;
    selected_metric_candidate_ref_count: number;
    receipt_side_effect_problem_count: number;
  };
  record_summaries: DogfoodMetricSnapshotRecordSummary[];
  selected_record_summary: DogfoodMetricSnapshotRecordSummary | null;
  latest_record_summary: DogfoodMetricSnapshotRecordSummary | null;
  records: DogfoodMetricSnapshotRecord[];
  evidence_summary: {
    supplied_record_count: number;
    valid_record_count: number;
    has_records: boolean;
    has_selected_record: boolean;
    has_source_refs: boolean;
    has_evidence_refs: boolean;
    has_receipt_side_effect_problem: boolean;
    source_refs: string[];
    evidence_refs: string[];
    missing_evidence: string[];
    problem_record_ids: string[];
  };
  record_material_summary: {
    helpful_context_signal_count: number;
    stale_context_signal_count: number;
    missing_context_signal_count: number;
    noisy_context_signal_count: number;
    misleading_context_signal_count: number;
    unknown_context_signal_count: number;
    skipped_or_unverified_check_count: number;
    not_done_item_count: number;
    expected_observed_mismatch_count: number;
    review_burden_signal_count: number;
    carry_forward_candidate_count: number;
  };
  receipt_no_side_effects_summary: DogfoodMetricSnapshotNoSideEffectsSummary;
  blocked_reasons: string[];
  insufficient_data_reasons: string[];
  operator_review_checklist: string[];
  would_not_do: string[];
  non_goals: string[];
  authority_boundary: DogfoodMetricSnapshotRecordReviewAuthorityBoundary;
}

export type DogfoodMetricSnapshotRecordReviewNoSideEffects =
  DogfoodMetricSnapshotNoSideEffects;
