import type {
  ExpectedObservedDeltaNoSideEffects,
  ExpectedObservedDeltaRecord,
  ExpectedObservedDeltaStoreResult,
} from "./expected-observed-delta-write";

export const EXPECTED_OBSERVED_DELTA_RECORD_REVIEW_VERSION =
  "expected_observed_delta_record_review.v0.1" as const;

export interface ExpectedObservedDeltaRecordReviewInput {
  records?: unknown[];
  store_result?: ExpectedObservedDeltaStoreResult | null;
  selected_record_id?: string | null;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export type ExpectedObservedDeltaRecordReviewStatus =
  | "no_records"
  | "schema_missing"
  | "records_available"
  | "selected_record_found"
  | "selected_record_missing"
  | "records_invalid";

export interface ExpectedObservedDeltaRecordSummary {
  record_id: string;
  idempotency_key: string;
  created_at: string;
  operator_ref: string | null;
  work_ref: string | null;
  result_ref: string | null;
  handoff_ref: string | null;
  matched_expectation_count: number;
  missing_expectation_count: number;
  unexpected_observation_count: number;
  skipped_or_unverified_check_count: number;
  not_done_count: number;
  changed_file_delta_count: number;
  requirement_progress_delta_count: number;
  non_goal_risk_count: number;
  followup_count: number;
  context_reuse_signal_count: number;
  evidence_ref_count: number;
  source_ref_count: number;
  review_status: string | null;
  record_fingerprint: string | null;
  receipt_no_side_effects_valid: boolean;
  problem_reasons: string[];
}

export interface ExpectedObservedDeltaNoSideEffectsSummary {
  expected_observed_delta_record_written_count: number;
  expected_observed_delta_receipt_written_count: number;
  expected_observed_delta_persisted_as_dogfood_signal_record_count: number;
  reuse_outcome_ledger_written_count: number;
  dogfood_metrics_written_count: number;
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

export interface ExpectedObservedDeltaRecordReviewAuthorityBoundary {
  read_only_record_review: true;
  source_of_truth: false;
  can_write_db: false;
  can_create_schema: false;
  can_write_expected_observed_delta: false;
  can_write_reuse_outcome_ledger: false;
  can_write_dogfood_metrics: false;
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

export interface ExpectedObservedDeltaRecordReview {
  review_version: typeof EXPECTED_OBSERVED_DELTA_RECORD_REVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  review_status: ExpectedObservedDeltaRecordReviewStatus;
  input_summary: {
    supplied_record_count: number;
    valid_record_count: number;
    invalid_record_count: number;
    selected_record_id: string | null;
    selected_record_found: boolean;
    latest_record_id: string | null;
    latest_record_created_at: string | null;
    selected_delta_candidate_ref_count: number;
    receipt_side_effect_problem_count: number;
  };
  record_summaries: ExpectedObservedDeltaRecordSummary[];
  selected_record_summary: ExpectedObservedDeltaRecordSummary | null;
  latest_record_summary: ExpectedObservedDeltaRecordSummary | null;
  records: ExpectedObservedDeltaRecord[];
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
    matched_expectation_count: number;
    missing_expectation_count: number;
    unexpected_observation_count: number;
    skipped_or_unverified_check_count: number;
    not_done_count: number;
    changed_file_delta_count: number;
    requirement_progress_delta_count: number;
    non_goal_risk_count: number;
    followup_count: number;
    context_reuse_signal_count: number;
  };
  receipt_no_side_effects_summary: ExpectedObservedDeltaNoSideEffectsSummary;
  blocked_reasons: string[];
  insufficient_data_reasons: string[];
  operator_review_checklist: string[];
  would_not_do: string[];
  non_goals: string[];
  authority_boundary: ExpectedObservedDeltaRecordReviewAuthorityBoundary;
}
