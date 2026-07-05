import type {
  CodexResultReportIntakeRecord,
  CodexResultReportIntakeStoreResult,
} from "./codex-result-report-intake-write";

export const CODEX_RESULT_REPORT_INTAKE_RECORD_REVIEW_VERSION =
  "codex_result_report_intake_record_review.v0.1" as const;

export interface CodexResultReportIntakeRecordReviewInput {
  records?: unknown[];
  store_result?: CodexResultReportIntakeStoreResult | null;
  selected_record_id?: string | null;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export type CodexResultReportIntakeRecordReviewStatus =
  | "no_records"
  | "schema_missing"
  | "records_available"
  | "selected_record_found"
  | "selected_record_missing"
  | "records_invalid";

export interface CodexResultReportIntakeRecordSummary {
  record_id: string;
  idempotency_key: string;
  created_at: string;
  operator_ref: string | null;
  source_ref: string | null;
  work_ref: string | null;
  result_ref: string | null;
  pr_ref: string | null;
  commit_ref: string | null;
  selected_candidate_ref_count: number;
  sanitized_candidate_summary_count: number;
  changed_file_count: number;
  check_result_count: number;
  skipped_check_count: number;
  not_done_count: number;
  followup_count: number;
  evidence_ref_count: number;
  source_ref_count: number;
  privacy_review_confirmation_ref: string | null;
  review_status: string | null;
  record_fingerprint: string | null;
  receipt_no_side_effects_valid: boolean;
  problem_reasons: string[];
}

export interface CodexResultReportIntakeNoSideEffectsSummary {
  codex_result_report_intake_record_written_count: number;
  codex_result_report_intake_receipt_written_count: number;
  codex_result_report_persisted_as_candidate_record_count: number;
  work_episode_residue_written_count: number;
  expected_observed_delta_written_count: number;
  reuse_outcome_ledger_written_count: number;
  dogfood_metrics_written_count: number;
  memory_mutated_count: number;
  current_working_perspective_updated_count: number;
  perspective_unit_written_count: number;
  next_work_bias_written_count: number;
  continuity_relay_written_count: number;
  handoff_context_mutated_count: number;
  handoff_sent_count: number;
  provider_called_count: number;
  github_called_count: number;
  codex_executed_count: number;
}

export interface CodexResultReportIntakeRecordReviewEvidenceSummary {
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
}

export interface CodexResultReportIntakeRecordReviewAuthorityBoundary {
  read_only_record_review: true;
  source_of_truth: false;
  can_write_db: false;
  can_create_schema: false;
  can_create_ingest_record: false;
  can_create_ingest_receipt: false;
  can_write_work_episode: false;
  can_write_expected_observed_delta: false;
  can_write_reuse_outcome_ledger: false;
  can_write_dogfood_metrics: false;
  can_write_memory: false;
  can_mutate_memory: false;
  can_promote_memory: false;
  can_mutate_current_working_perspective: false;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
  can_update_continuity_relay: false;
  can_mutate_handoff_context: false;
  can_apply_handoff_context: false;
  can_write_selected_refs_to_live_handoff: false;
  can_send_handoff: false;
  can_write_reuse_ledger: false;
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

export interface CodexResultReportIntakeRecordReview {
  review_version: typeof CODEX_RESULT_REPORT_INTAKE_RECORD_REVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  review_status: CodexResultReportIntakeRecordReviewStatus;
  input_summary: {
    supplied_record_count: number;
    valid_record_count: number;
    invalid_record_count: number;
    selected_record_id: string | null;
    selected_record_found: boolean;
    latest_record_id: string | null;
    latest_record_created_at: string | null;
    selected_candidate_ref_count: number;
    sanitized_candidate_summary_count: number;
    receipt_side_effect_problem_count: number;
  };
  record_summaries: CodexResultReportIntakeRecordSummary[];
  selected_record_summary: CodexResultReportIntakeRecordSummary | null;
  latest_record_summary: CodexResultReportIntakeRecordSummary | null;
  records: CodexResultReportIntakeRecord[];
  evidence_summary: CodexResultReportIntakeRecordReviewEvidenceSummary;
  receipt_no_side_effects_summary: CodexResultReportIntakeNoSideEffectsSummary;
  blocked_reasons: string[];
  insufficient_data_reasons: string[];
  operator_review_checklist: string[];
  would_not_do: string[];
  non_goals: string[];
  authority_boundary: CodexResultReportIntakeRecordReviewAuthorityBoundary;
}
