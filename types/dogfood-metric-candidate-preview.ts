/**
 * Dogfood Metric Candidate Preview v0.1.
 *
 * This contract describes a read-only metric candidate read model derived from
 * operator-approved Handoff Reuse Outcome Ledger records. It does not write
 * dogfood metrics, update baselines, mutate memory, apply Perspective state,
 * create promotion decisions or Formation Receipts, call providers/GitHub/Codex,
 * send handoffs, create graph/vector/RAG/crawler/browser observers, or run
 * autonomous actions.
 */

import type { CodexResultFeedbackDraftConfidence } from "./codex-result-feedback-draft";
import type {
  HANDOFF_REUSE_OUTCOME_LEDGER_STORE_VERSION,
  HandoffReuseOutcomeLedgerRecord,
} from "./handoff-reuse-outcome-ledger";

export const DOGFOOD_METRIC_CANDIDATE_PREVIEW_VERSION =
  "dogfood_metric_candidate_preview.v0.1" as const;

export type DogfoodMetricCandidateStatus =
  | "insufficient_data"
  | "candidate_signal"
  | "needs_review";

export interface DogfoodMetricCandidatePreview {
  preview_version: typeof DOGFOOD_METRIC_CANDIDATE_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  candidate_status: DogfoodMetricCandidateStatus;
  summary: string;
  source_refs: string[];
  ledger_source: DogfoodMetricCandidateLedgerSource;
  metric_window: DogfoodMetricCandidateWindow;
  aggregate_counts: DogfoodMetricCandidateAggregateCounts;
  reuse_quality_candidate: DogfoodReuseQualityCandidate;
  handoff_quality_candidate: DogfoodHandoffQualityCandidate;
  source_record_summaries: DogfoodMetricSourceRecordSummary[];
  insufficient_data_reasons: string[];
  metric_write_readiness: DogfoodMetricWriteReadiness;
  non_goals: string[];
  authority_boundary: DogfoodMetricCandidateAuthorityBoundary;
}

export interface DogfoodMetricCandidateLedgerSource {
  store_version: typeof HANDOFF_REUSE_OUTCOME_LEDGER_STORE_VERSION;
  record_count: number;
  raw_record_count: number;
  excluded_record_count: number;
  record_refs: string[];
  result_report_refs: string[];
  ledger_store_ref: string | null;
}

export interface DogfoodMetricCandidateWindow {
  since: string | null;
  until: string | null;
  limit: number | null;
  filtered_by_result_report_ref: string | null;
  filtered_by_operator_ref: string | null;
}

export interface DogfoodMetricCandidateAggregateCounts {
  approved_record_count: number;
  helpful_ref_count: number;
  stale_ref_count: number;
  missing_ref_count: number;
  noisy_ref_count: number;
  misleading_ref_count: number;
  unknown_ref_count: number;
  skipped_or_unverified_check_count: number;
  not_done_item_count: number;
  expected_observed_mismatch_count: number;
  insufficient_data_record_count: number;
}

export interface DogfoodReuseQualityCandidate {
  helpful_records: number;
  problem_records: number;
  unknown_heavy_records: number;
  stale_or_gap_records: number;
  context_feedback_signal_records: number;
  confidence: CodexResultFeedbackDraftConfidence;
  summary: string;
}

export interface DogfoodHandoffQualityCandidate {
  records_with_skipped_checks: number;
  records_with_not_done_items: number;
  records_with_mismatches: number;
  records_with_carry_forward_candidates: number;
  confidence: CodexResultFeedbackDraftConfidence;
  summary: string;
}

export interface DogfoodMetricSourceRecordSummary {
  record_id: string;
  result_report_ref: string;
  operator_ref: string;
  approved_by: string;
  created_at: string;
  proposed_record_kind: HandoffReuseOutcomeLedgerRecord["proposed_record_kind"];
  helpful_ref_count: number;
  stale_ref_count: number;
  missing_ref_count: number;
  noisy_ref_count: number;
  misleading_ref_count: number;
  unknown_ref_count: number;
  skipped_check_count: number;
  not_done_item_count: number;
  expected_observed_mismatch: boolean;
  mismatch_summary: string;
  confidence: CodexResultFeedbackDraftConfidence;
  source_refs: string[];
}

export interface DogfoodMetricWriteReadiness {
  ready_for_metric_write: false;
  required_followup: string[];
  refusal_reasons: string[];
}

export interface DogfoodMetricCandidateAuthorityBoundary {
  read_only: true;
  candidate_material_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_write_db: false;
  can_write_dogfood_metrics: false;
  can_update_metrics: false;
  can_write_dogfood_ledger: false;
  can_mutate_memory: false;
  can_promote_memory: false;
  can_apply_project_perspective: false;
  can_create_promotion_decision: false;
  can_create_formation_receipt: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_execute_codex: false;
  can_send_handoff: false;
  can_create_pr: false;
  can_merge_pr: false;
  can_run_autonomous_action: false;
  can_create_graph_or_vector_store: false;
  can_create_rag_stack: false;
  can_crawl_or_observe_browser: false;
  notes: string[];
}
