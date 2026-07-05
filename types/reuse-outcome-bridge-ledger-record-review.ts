import type {
  HandoffReuseOutcomeLedgerRecord,
  HandoffReuseOutcomeLedgerStoreResult,
} from "./handoff-reuse-outcome-ledger";
import type {
  ReuseOutcomeBridgeLedgerNoSideEffects,
  ReuseOutcomeBridgeLedgerStoreResult,
} from "./reuse-outcome-bridge-ledger-write";

export const REUSE_OUTCOME_BRIDGE_LEDGER_RECORD_REVIEW_VERSION =
  "reuse_outcome_bridge_ledger_record_review.v0.1" as const;

export interface ReuseOutcomeBridgeLedgerRecordReviewInput {
  records?: unknown[];
  store_result?:
    | HandoffReuseOutcomeLedgerStoreResult
    | ReuseOutcomeBridgeLedgerStoreResult
    | null;
  selected_record_id?: string | null;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export type ReuseOutcomeBridgeLedgerRecordReviewStatus =
  | "no_records"
  | "schema_missing"
  | "records_available"
  | "selected_record_found"
  | "selected_record_missing"
  | "records_invalid";

export interface ReuseOutcomeBridgeLedgerRecordSummary {
  record_id: string;
  idempotency_key: string;
  created_at: string;
  operator_ref: string | null;
  result_ref: string | null;
  work_ref: string | null;
  handoff_ref: string | null;
  delta_ref_count: number;
  helpful_ref_count: number;
  stale_ref_count: number;
  missing_ref_count: number;
  noisy_ref_count: number;
  misleading_ref_count: number;
  unknown_ref_count: number;
  skipped_or_unverified_check_count: number;
  not_done_count: number;
  expected_observed_mismatch_count: number;
  carry_forward_count: number;
  receipt_no_side_effects_valid: boolean;
  problem_reasons: string[];
}

export interface ReuseOutcomeBridgeLedgerRecordReviewAuthorityBoundary {
  read_only_record_review: true;
  source_of_truth: false;
  can_write_db: false;
  can_create_schema: false;
  can_write_handoff_reuse_ledger: false;
  can_write_dogfood_metrics: false;
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

export interface ReuseOutcomeBridgeLedgerRecordReview {
  review_version: typeof REUSE_OUTCOME_BRIDGE_LEDGER_RECORD_REVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  review_status: ReuseOutcomeBridgeLedgerRecordReviewStatus;
  input_summary: {
    supplied_record_count: number;
    valid_record_count: number;
    invalid_record_count: number;
    selected_record_id: string | null;
    selected_record_found: boolean;
    latest_record_id: string | null;
    latest_record_created_at: string | null;
    bridge_written_record_count: number;
    receipt_side_effect_problem_count: number;
  };
  record_summaries: ReuseOutcomeBridgeLedgerRecordSummary[];
  selected_record_summary: ReuseOutcomeBridgeLedgerRecordSummary | null;
  latest_record_summary: ReuseOutcomeBridgeLedgerRecordSummary | null;
  records: HandoffReuseOutcomeLedgerRecord[];
  evidence_summary: {
    supplied_record_count: number;
    valid_record_count: number;
    has_records: boolean;
    has_selected_record: boolean;
    has_source_refs: boolean;
    has_receipt_side_effect_problem: boolean;
    source_refs: string[];
    problem_record_ids: string[];
  };
  aggregate_counts: {
    helpful_ref_count: number;
    stale_ref_count: number;
    missing_ref_count: number;
    noisy_ref_count: number;
    misleading_ref_count: number;
    unknown_ref_count: number;
    skipped_or_unverified_check_count: number;
    not_done_count: number;
    expected_observed_mismatch_count: number;
    carry_forward_count: number;
  };
  receipt_no_side_effects_summary: ReuseOutcomeBridgeLedgerNoSideEffects;
  blocked_reasons: string[];
  insufficient_data_reasons: string[];
  operator_review_checklist: string[];
  would_not_do: string[];
  non_goals: string[];
  authority_boundary: ReuseOutcomeBridgeLedgerRecordReviewAuthorityBoundary;
}
