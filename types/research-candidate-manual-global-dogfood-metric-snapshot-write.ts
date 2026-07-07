import type {
  ResearchCandidateManualGlobalDogfoodMetricSnapshotContract,
  ResearchCandidateManualGlobalDogfoodMetricCountersPreview,
  ResearchCandidateManualGlobalDogfoodMetricDimensions,
  ResearchCandidateManualGlobalDogfoodMetricLabelsPreview,
} from "@/types/research-candidate-manual-global-dogfood-metric-snapshot-contract";
import type {
  ResearchCandidateManualGlobalDogfoodMetricSnapshotReview,
} from "@/types/research-candidate-manual-global-dogfood-metric-snapshot-review";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_WRITE_CONFIRMATION =
  "I authorize writing this manual global dogfood projection to a dogfood metric snapshot record" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_ROLLBACK_CONFIRMATION =
  "I authorize rolling back this manual global dogfood metric snapshot receipt" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_WRITE_KIND =
  "research_candidate_manual_global_dogfood_metric_snapshot_write" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_WRITE_VERSION =
  "research_candidate_manual_global_dogfood_metric_snapshot_write.v0.1" as const;

export type ResearchCandidateManualGlobalDogfoodMetricSnapshotAuthorizationKind =
  "manual_operator_authorized_dogfood_metric_snapshot_write";

export type ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteMode =
  | "commit"
  | "replay_if_duplicate"
  | "supersede_previous";

export type ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteStatus =
  | "committed"
  | "duplicate_replayed"
  | "superseded"
  | "rolled_back";

export type ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteResultStatus =
  | "committed"
  | "duplicate_replayed"
  | "superseded"
  | "rolled_back"
  | "refused"
  | "schema_missing"
  | "not_found";

export interface ResearchCandidateManualGlobalDogfoodMetricSnapshotOperatorAuthorization {
  authorization_kind: ResearchCandidateManualGlobalDogfoodMetricSnapshotAuthorizationKind;
  operator_confirmation_text: string;
  write_mode: ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteMode;
  supersedes_receipt_id?: string | null;
}

export interface ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteRequest {
  metric_snapshot_contract: ResearchCandidateManualGlobalDogfoodMetricSnapshotContract;
  metric_snapshot_review: ResearchCandidateManualGlobalDogfoodMetricSnapshotReview;
  operator_authorization: ResearchCandidateManualGlobalDogfoodMetricSnapshotOperatorAuthorization;
  requested_side_effects?: Record<string, unknown>;
}

export interface ResearchCandidateManualGlobalDogfoodMetricSnapshotRollbackAuthorization {
  authorization_kind: "manual_operator_authorized_dogfood_metric_snapshot_rollback";
  operator_confirmation_text: string;
  rollback_reason: string;
}

export interface ResearchCandidateManualGlobalDogfoodMetricSnapshotRollbackRequest {
  receipt_id: string;
  rollback_authorization: ResearchCandidateManualGlobalDogfoodMetricSnapshotRollbackAuthorization;
}

export interface ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteAuthorityBoundary {
  can_write_dogfood_metric_snapshot_record: true;
  can_write_dogfood_metric_snapshot_receipt: true;
  can_write_metric_snapshot_rollback_metadata: true;
  source_of_truth: false;
  can_write_global_dogfood_metrics: false;
  can_write_next_work_bias: false;
  can_write_global_dogfood_ledger: false;
  can_mutate_manual_global_dogfood_ledger: false;
  can_write_perspective_state: false;
  can_promote_perspective: false;
  can_write_perspective_memory: false;
  can_write_proof_or_evidence: false;
  can_mutate_work: false;
  can_execute_codex: false;
  can_call_github: false;
  can_call_providers_or_openai: false;
  can_fetch_sources: false;
  can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false;
  can_allocate_product_ids: false;
  can_execute_product_write: false;
  persists_raw_manual_note_text: false;
  persists_raw_result_report_text: false;
  persists_operator_notes: false;
}

export interface ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteValidation {
  passed: boolean;
  failure_codes: string[];
  idempotency_key: string | null;
  exact_operator_confirmation_present: boolean;
  ready_metric_contract_present: boolean;
  accepted_metric_review_present: boolean;
  preview_contract_remained_non_writing: boolean;
  preview_authority_boundary_was_read_only: boolean;
  writer_authority_boundary_is_narrow: boolean;
  raw_text_fields_absent: boolean;
  operator_note_absent: boolean;
  source_refs_present: boolean;
  source_global_dogfood_ledger_receipt_active_committed: boolean;
  source_global_dogfood_ledger_record_matches_contract: boolean;
  supported_outcome_signal: boolean;
}

export interface ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteReceipt {
  receipt_id: string;
  created_at: string;
  scope: ResearchCandidateReviewScope;
  source_metric_contract_fingerprint: string;
  source_metric_review_fingerprint: string;
  source_projection_fingerprint: string;
  source_global_dogfood_ledger_receipt_id: string;
  source_global_dogfood_ledger_record_id: string;
  source_manual_receipt_id: string;
  source_handoff_seed_fingerprint: string;
  source_result_text_fingerprint: string;
  source_expected_observed_delta_record_ref: string;
  source_reuse_outcome_record_ref: string;
  idempotency_key: string;
  write_status: Exclude<
    ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteStatus,
    "duplicate_replayed"
  >;
  authority_profile: string;
  receipt_fingerprint: string;
  supersedes_receipt_id: string | null;
  rollback_of_receipt_id: string | null;
  rollback_reason: string | null;
}

export interface ResearchCandidateManualGlobalDogfoodMetricSnapshotRecord {
  metric_snapshot_record_id: string;
  receipt_id: string;
  created_at: string;
  scope: ResearchCandidateReviewScope;
  source_global_dogfood_ledger_receipt_id: string;
  source_global_dogfood_ledger_record_id: string;
  source_projection_fingerprint: string;
  source_metric_contract_fingerprint: string;
  source_metric_review_fingerprint: string;
  outcome_label: string;
  outcome_signal: "positive" | "negative" | "ambiguous";
  proposed_metric_dimensions: ResearchCandidateManualGlobalDogfoodMetricDimensions;
  proposed_metric_counters: ResearchCandidateManualGlobalDogfoodMetricCountersPreview;
  proposed_metric_labels: ResearchCandidateManualGlobalDogfoodMetricLabelsPreview;
  selected_candidate_context_refs: string[];
  expected_summary_present: boolean;
  observed_summary_present: boolean;
  mismatch_or_gap_present: boolean;
  source_refs: string[];
  manual_only_context_refs: string[];
  warning_reasons: string[];
  compatibility_findings: unknown[];
  authority_profile: string;
  metric_snapshot_record_fingerprint: string;
}

export interface ResearchCandidateManualGlobalDogfoodMetricSnapshotRollbackRecord {
  rollback_id: string;
  created_at: string;
  receipt_id: string;
  rollback_reason: string;
  authority_profile: string;
  rollback_fingerprint: string;
}

export interface ResearchCandidateManualGlobalDogfoodMetricSnapshotRecordsByReceipt {
  receipt: ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteReceipt;
  metric_snapshot_record: ResearchCandidateManualGlobalDogfoodMetricSnapshotRecord | null;
  rollback: ResearchCandidateManualGlobalDogfoodMetricSnapshotRollbackRecord | null;
  superseded: boolean;
  rolled_back: boolean;
}

export interface ResearchCandidateManualGlobalDogfoodMetricSnapshotReadback {
  readback_kind: "research_candidate_manual_global_dogfood_metric_snapshot_readback";
  readback_version: "research_candidate_manual_global_dogfood_metric_snapshot_readback.v0.1";
  scope: ResearchCandidateReviewScope;
  records_by_receipt: ResearchCandidateManualGlobalDogfoodMetricSnapshotRecordsByReceipt[];
  latest_receipts: ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteReceipt[];
  latest_active_committed: ResearchCandidateManualGlobalDogfoodMetricSnapshotRecordsByReceipt | null;
  count: number;
  authority_boundary: ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteAuthorityBoundary;
  raw_manual_note_text_present: false;
  raw_result_report_text_present: false;
  operator_notes_persisted: false;
  global_dogfood_metrics_written: false;
  next_work_bias_written: false;
  proof_or_evidence_rows_written: false;
  work_or_perspective_rows_written: false;
  perspective_memory_written: false;
  product_write_executed: false;
}

export interface ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteResult {
  ok: boolean;
  result_status: ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteResultStatus;
  validation: ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteValidation;
  receipt: ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteReceipt | null;
  metric_snapshot_record: ResearchCandidateManualGlobalDogfoodMetricSnapshotRecord | null;
  readback: ResearchCandidateManualGlobalDogfoodMetricSnapshotReadback | null;
  refusal_reasons: string[];
  duplicate_replayed: boolean;
  idempotency_key: string | null;
  authority_boundary: ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteAuthorityBoundary;
  global_dogfood_metrics_written: false;
  next_work_bias_written: false;
  proof_or_evidence_rows_written: false;
  work_or_perspective_rows_written: false;
  perspective_memory_written: false;
  product_write_executed: false;
}

export interface ResearchCandidateManualGlobalDogfoodMetricSnapshotRollbackResult {
  ok: boolean;
  result_status: ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteResultStatus;
  rollback: ResearchCandidateManualGlobalDogfoodMetricSnapshotRollbackRecord | null;
  receipt: ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteReceipt | null;
  readback: ResearchCandidateManualGlobalDogfoodMetricSnapshotReadback | null;
  refusal_reasons: string[];
  authority_boundary: ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteAuthorityBoundary;
  global_dogfood_metrics_written: false;
  next_work_bias_written: false;
  proof_or_evidence_rows_written: false;
  work_or_perspective_rows_written: false;
  perspective_memory_written: false;
  product_write_executed: false;
}
