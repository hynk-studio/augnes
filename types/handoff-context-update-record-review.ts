import type { HandoffContextUpdateCandidate } from "./handoff-context-update-preview";
import type {
  OperatorApprovedHandoffContextUpdateRecord,
  OperatorApprovedHandoffContextUpdateStoreResult,
} from "./handoff-context-update-write";

export const APPROVED_HANDOFF_CONTEXT_UPDATE_RECORD_REVIEW_VERSION =
  "approved_handoff_context_update_record_review.v0.1" as const;

export type ApprovedHandoffContextUpdateRecordReviewStatus =
  | "no_records"
  | "records_available"
  | "selected_record_available"
  | "invalid_records"
  | "insufficient_data";

export interface ApprovedHandoffContextUpdateRecordReviewInput {
  records: unknown[];
  store_result?: OperatorApprovedHandoffContextUpdateStoreResult | null;
  selected_record_id?: string | null;
  as_of?: string;
  scope?: string;
  source_refs?: string[];
}

export interface ApprovedHandoffContextUpdateRecordReview {
  review_version: typeof APPROVED_HANDOFF_CONTEXT_UPDATE_RECORD_REVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  review_status: ApprovedHandoffContextUpdateRecordReviewStatus;
  input_summary: ApprovedHandoffContextUpdateRecordReviewInputSummary;
  record_summaries: ApprovedHandoffContextUpdateRecordSummary[];
  selected_record_summary: ApprovedHandoffContextUpdateRecordSummary | null;
  approved_material_summary: ApprovedHandoffContextUpdateApprovedMaterialSummary;
  evidence_summary: ApprovedHandoffContextUpdateRecordReviewEvidenceSummary;
  live_state_boundary: ApprovedHandoffContextUpdateLiveStateBoundary;
  operator_review_checklist: string[];
  blocked_reasons: string[];
  insufficient_data_reasons: string[];
  non_goals: string[];
  authority_boundary: ApprovedHandoffContextUpdateRecordReviewAuthorityBoundary;
}

export interface ApprovedHandoffContextUpdateRecordReviewInputSummary {
  supplied_record_count: number;
  valid_record_count: number;
  invalid_record_count: number;
  selected_record_id: string | null;
  selected_record_found: boolean;
  latest_record_id: string | null;
  latest_record_created_at: string | null;
  live_handoff_context_mutated_count: number;
  selected_refs_written_to_live_handoff_count: number;
  handoff_sent_count: number;
}

export interface ApprovedHandoffContextUpdateRecordSummary {
  record_id: string;
  idempotency_key: string;
  created_at: string;
  operator_ref: string | null;
  approved_by: string | null;
  operator_decision: string | null;
  candidate_counts: ApprovedHandoffContextUpdateRecordCandidateCounts;
  evidence_ref_count: number;
  source_ref_count: number;
  record_fingerprint: string | null;
  validation_hash: string | null;
  authority_summary: ApprovedHandoffContextUpdateRecordAuthoritySummary;
  no_side_effects_summary: ApprovedHandoffContextUpdateNoSideEffectsSummary;
  problem_reasons: string[];
}

export interface ApprovedHandoffContextUpdateRecordCandidateCounts {
  selected_ref_add_count: number;
  selected_ref_reinforcement_count: number;
  warning_update_count: number;
  context_diet_count: number;
  keep_unknown_count: number;
  expected_return_signal_count: number;
  stop_if_missing_count: number;
  rejected_or_excluded_count: number;
}

export interface ApprovedHandoffContextUpdateApprovedMaterialSummary
  extends ApprovedHandoffContextUpdateRecordCandidateCounts {}

export interface ApprovedHandoffContextUpdateRecordAuthoritySummary {
  can_write_db: boolean;
  can_write_handoff_context_update_record: boolean;
  can_write_operator_approved_handoff_context_update_record: boolean;
  can_mutate_live_handoff_context: boolean;
  can_write_selected_refs_to_live_handoff: boolean;
  can_send_handoff: boolean;
  can_write_continuity_relay: boolean;
  can_update_current_working_perspective: boolean;
  can_write_perspective_unit: boolean;
  can_write_next_work_bias: boolean;
  can_write_memory: boolean;
  can_mutate_memory: boolean;
  can_write_dogfood_metrics: boolean;
  can_update_metrics: boolean;
  can_write_dogfood_ledger: boolean;
  can_call_provider_openai: boolean;
  can_call_github: boolean;
  can_execute_codex: boolean;
  can_create_pr: boolean;
  can_merge_pr: boolean;
  can_run_autonomous_action: boolean;
  can_create_graph_or_vector_store: boolean;
  can_create_rag_stack: boolean;
  can_crawl_or_observe_browser: boolean;
}

export interface ApprovedHandoffContextUpdateNoSideEffectsSummary {
  handoff_context_mutated: boolean;
  selected_refs_written_to_live_handoff: boolean;
  handoff_sent: boolean;
  continuity_relay_written: boolean;
  current_working_perspective_updated: boolean;
  perspective_unit_written: boolean;
  next_work_bias_written: boolean;
  memory_mutated: boolean;
  dogfood_metrics_written: boolean;
  reuse_ledger_written: boolean;
  provider_called: boolean;
  github_called: boolean;
  codex_executed: boolean;
  pr_created: boolean;
  pr_merged: boolean;
  autonomous_action_run: boolean;
  graph_or_vector_store_created: boolean;
  rag_stack_created: boolean;
  crawler_or_browser_observer_created: boolean;
}

export interface ApprovedHandoffContextUpdateRecordReviewEvidenceSummary {
  has_records: boolean;
  has_selected_record: boolean;
  has_source_refs: boolean;
  has_evidence_refs: boolean;
  all_records_have_fingerprints: boolean;
  all_records_have_validation_hashes: boolean;
  all_records_confirm_no_live_handoff_mutation: boolean;
  all_records_confirm_no_handoff_send: boolean;
  all_records_confirm_no_provider_github_codex: boolean;
  problem_record_ids: string[];
  evidence_refs: string[];
  source_refs: string[];
  missing_evidence: string[];
}

export interface ApprovedHandoffContextUpdateLiveStateBoundary {
  live_handoff_context_mutated: false;
  selected_refs_written_to_live_handoff: false;
  handoff_sent: false;
  review_note: string;
}

export interface ApprovedHandoffContextUpdateRecordReviewAuthorityBoundary {
  read_only_record_review: true;
  source_of_truth: false;
  can_write_db: false;
  can_create_schema: false;
  can_write_handoff_context_update_record: false;
  can_write_operator_approved_handoff_context_update_record: false;
  can_mutate_live_handoff_context: false;
  can_write_selected_refs_to_live_handoff: false;
  can_send_handoff: false;
  can_write_continuity_relay: false;
  can_update_current_working_perspective: false;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
  can_write_memory: false;
  can_mutate_memory: false;
  can_promote_memory: false;
  can_apply_project_perspective: false;
  can_create_promotion_decision: false;
  can_create_formation_receipt: false;
  can_write_dogfood_metrics: false;
  can_update_metrics: false;
  can_write_dogfood_ledger: false;
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

export type ApprovedHandoffContextUpdateRecordReviewCandidate =
  HandoffContextUpdateCandidate;

export type ApprovedHandoffContextUpdateRecordReviewRecord =
  OperatorApprovedHandoffContextUpdateRecord;
