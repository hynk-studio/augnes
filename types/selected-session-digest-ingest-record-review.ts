import type {
  SelectedSessionDigestIngestRecord,
  SelectedSessionDigestIngestStoreResult,
} from "./selected-session-digest-ingest-write";

export const SELECTED_SESSION_DIGEST_INGEST_RECORD_REVIEW_VERSION =
  "selected_session_digest_ingest_record_review.v0.1" as const;

export type SelectedSessionDigestIngestRecordReviewStatus =
  | "no_records"
  | "schema_missing"
  | "records_available"
  | "selected_record_available"
  | "invalid_records"
  | "blocked";

export interface SelectedSessionDigestIngestRecordReviewInput {
  records?: unknown[];
  selected_record_id?: string | null;
  store_result?: SelectedSessionDigestIngestStoreResult | null;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export interface SelectedSessionDigestIngestRecordReview {
  review_version: typeof SELECTED_SESSION_DIGEST_INGEST_RECORD_REVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  review_status: SelectedSessionDigestIngestRecordReviewStatus;
  input_summary: SelectedSessionDigestIngestRecordReviewInputSummary;
  record_summaries: SelectedSessionDigestIngestRecordSummary[];
  selected_record_summary: SelectedSessionDigestIngestRecordSummary | null;
  latest_record_summary: SelectedSessionDigestIngestRecordSummary | null;
  evidence_summary: SelectedSessionDigestIngestRecordReviewEvidenceSummary;
  receipt_no_side_effects_summary: SelectedSessionDigestIngestRecordReviewNoSideEffectsSummary;
  blocked_reasons: string[];
  insufficient_data_reasons: string[];
  operator_review_checklist: string[];
  would_not_do: string[];
  non_goals: string[];
  authority_boundary: SelectedSessionDigestIngestRecordReviewAuthorityBoundary;
}

export interface SelectedSessionDigestIngestRecordReviewInputSummary {
  supplied_record_count: number;
  valid_record_count: number;
  invalid_record_count: number;
  selected_record_id: string | null;
  selected_record_found: boolean;
  latest_record_id: string | null;
  latest_record_created_at: string | null;
  selected_digest_candidate_ref_count: number;
  sanitized_candidate_summary_count: number;
  receipt_side_effect_problem_count: number;
}

export interface SelectedSessionDigestIngestRecordSummary {
  record_id: string;
  idempotency_key: string;
  created_at: string;
  operator_ref: string | null;
  source_kind: string | null;
  source_ref: string | null;
  session_ref: string | null;
  project_ref: string | null;
  selected_digest_candidate_ref_count: number;
  sanitized_candidate_summary_count: number;
  evidence_ref_count: number;
  source_ref_count: number;
  privacy_review_confirmation_ref: string | null;
  review_status: string | null;
  record_fingerprint: string | null;
  receipt_no_side_effects_valid: boolean;
  authority_summary: SelectedSessionDigestIngestRecordAuthoritySummary;
  problem_reasons: string[];
}

export interface SelectedSessionDigestIngestRecordAuthoritySummary {
  durable_local_candidate_ingest_record: boolean;
  candidate_record_only: boolean;
  source_of_truth: boolean | null;
  can_write_memory: boolean | null;
  can_mutate_current_working_perspective: boolean | null;
  can_write_perspective_unit: boolean | null;
  can_write_next_work_bias: boolean | null;
  can_update_continuity_relay: boolean | null;
  can_mutate_handoff_context: boolean | null;
  can_write_selected_refs_to_live_handoff: boolean | null;
  can_send_handoff: boolean | null;
  can_call_provider_openai: boolean | null;
  can_call_github: boolean | null;
  can_execute_codex: boolean | null;
}

export interface SelectedSessionDigestIngestRecordReviewEvidenceSummary {
  has_records: boolean;
  has_valid_records: boolean;
  has_selected_record: boolean;
  has_source_refs: boolean;
  has_evidence_refs: boolean;
  has_privacy_review_confirmation: boolean;
  has_no_side_effects_receipts: boolean;
  has_problem_records: boolean;
  source_refs: string[];
  evidence_refs: string[];
  missing_evidence: string[];
  problem_record_ids: string[];
}

export interface SelectedSessionDigestIngestRecordReviewNoSideEffectsSummary {
  selected_session_digest_ingest_record_written_count: number;
  selected_session_digest_ingest_receipt_written_count: number;
  selected_session_digest_persisted_as_candidate_record_count: number;
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
}

export interface SelectedSessionDigestIngestRecordReviewAuthorityBoundary {
  read_only_record_review: true;
  source_of_truth: false;
  can_write_db: false;
  can_create_schema: false;
  can_create_ingest_record: false;
  can_create_ingest_receipt: false;
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
  can_write_dogfood_metrics: false;
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

export type SelectedSessionDigestIngestRecordReviewRecord =
  SelectedSessionDigestIngestRecord;
