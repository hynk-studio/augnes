import type {
  ResearchCandidateManualGlobalDogfoodNextWorkSignalContract,
} from "@/types/research-candidate-manual-global-dogfood-next-work-signal-contract";
import type {
  ResearchCandidateManualGlobalDogfoodNextWorkSignalReview,
} from "@/types/research-candidate-manual-global-dogfood-next-work-signal-review";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_WRITE_CONFIRMATION =
  "I authorize writing this manual global dogfood projection to a next-work signal decision record" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_ROLLBACK_CONFIRMATION =
  "I authorize rolling back this manual global dogfood next-work signal receipt" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_WRITE_KIND =
  "research_candidate_manual_global_dogfood_next_work_signal_write" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_WRITE_VERSION =
  "research_candidate_manual_global_dogfood_next_work_signal_write.v0.1" as const;

export type ResearchCandidateManualGlobalDogfoodNextWorkSignalAuthorizationKind =
  "manual_operator_authorized_next_work_signal_decision_write";

export type ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteMode =
  | "commit"
  | "replay_if_duplicate"
  | "supersede_previous";

export type ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteStatus =
  | "committed"
  | "duplicate_replayed"
  | "superseded"
  | "rolled_back";

export type ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteResultStatus =
  | "committed"
  | "duplicate_replayed"
  | "superseded"
  | "rolled_back"
  | "refused"
  | "schema_missing"
  | "not_found";

export interface ResearchCandidateManualGlobalDogfoodNextWorkSignalOperatorAuthorization {
  authorization_kind: ResearchCandidateManualGlobalDogfoodNextWorkSignalAuthorizationKind;
  operator_confirmation_text: string;
  write_mode: ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteMode;
  supersedes_receipt_id?: string | null;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteRequest {
  next_work_signal_contract: ResearchCandidateManualGlobalDogfoodNextWorkSignalContract;
  next_work_signal_review: ResearchCandidateManualGlobalDogfoodNextWorkSignalReview;
  source_metric_snapshot_receipt_id?: string | null;
  source_metric_snapshot_record_id?: string | null;
  operator_authorization: ResearchCandidateManualGlobalDogfoodNextWorkSignalOperatorAuthorization;
  requested_side_effects?: Record<string, unknown>;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkSignalRollbackAuthorization {
  authorization_kind: "manual_operator_authorized_next_work_signal_decision_rollback";
  operator_confirmation_text: string;
  rollback_reason: string;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkSignalRollbackRequest {
  receipt_id: string;
  rollback_authorization: ResearchCandidateManualGlobalDogfoodNextWorkSignalRollbackAuthorization;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteAuthorityBoundary {
  can_write_next_work_signal_decision_record: true;
  can_write_next_work_signal_decision_receipt: true;
  can_write_next_work_signal_rollback_metadata: true;
  source_of_truth: false;
  can_write_next_work_bias: false;
  can_write_work_item: false;
  can_mutate_work: false;
  can_write_perspective_state: false;
  can_promote_perspective: false;
  can_write_perspective_memory: false;
  can_write_dogfood_metrics: false;
  can_write_global_dogfood_ledger: false;
  can_mutate_manual_global_dogfood_ledger: false;
  can_write_metric_snapshot: false;
  can_mutate_metric_snapshot: false;
  can_write_proof_or_evidence: false;
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

export interface ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteValidation {
  passed: boolean;
  failure_codes: string[];
  idempotency_key: string | null;
  exact_operator_confirmation_present: boolean;
  ready_next_work_signal_contract_present: boolean;
  accepted_next_work_signal_review_present: boolean;
  preview_contract_remained_non_writing: boolean;
  preview_authority_boundary_was_read_only: boolean;
  writer_authority_boundary_is_narrow: boolean;
  raw_text_fields_absent: boolean;
  operator_note_absent: boolean;
  source_refs_present: boolean;
  source_metric_snapshot_refs_present: boolean;
  source_global_dogfood_ledger_receipt_active_committed: boolean;
  source_global_dogfood_ledger_record_matches_contract: boolean;
  source_metric_snapshot_receipt_active_committed: boolean;
  source_metric_snapshot_record_matches_contract: boolean;
  selected_next_work_candidate_card_ids_present: boolean;
  proposed_decision_candidate_ready: boolean;
  selected_candidate_write_flags_false: boolean;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteReceipt {
  receipt_id: string;
  created_at: string;
  scope: ResearchCandidateReviewScope;
  source_next_work_contract_fingerprint: string;
  source_next_work_review_fingerprint: string;
  source_projection_fingerprint: string;
  source_global_dogfood_ledger_receipt_id: string;
  source_global_dogfood_ledger_record_id: string;
  source_metric_snapshot_receipt_id: string;
  source_metric_snapshot_record_id: string;
  source_manual_receipt_id: string;
  source_handoff_seed_fingerprint: string;
  source_result_text_fingerprint: string;
  source_expected_observed_delta_record_ref: string;
  source_reuse_outcome_record_ref: string;
  idempotency_key: string;
  write_status: Exclude<
    ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteStatus,
    "duplicate_replayed"
  >;
  authority_profile: string;
  receipt_fingerprint: string;
  supersedes_receipt_id: string | null;
  rollback_of_receipt_id: string | null;
  rollback_reason: string | null;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkSignalRecord {
  next_work_signal_record_id: string;
  receipt_id: string;
  created_at: string;
  scope: ResearchCandidateReviewScope;
  source_global_dogfood_ledger_receipt_id: string;
  source_global_dogfood_ledger_record_id: string;
  source_metric_snapshot_receipt_id: string;
  source_metric_snapshot_record_id: string;
  source_projection_fingerprint: string;
  source_next_work_contract_fingerprint: string;
  source_next_work_review_fingerprint: string;
  recommended_next_work_label: string;
  rationale: string;
  outcome_label: string;
  outcome_signal: "positive" | "negative" | "ambiguous";
  candidate_priority_hint: "high" | "medium" | "low" | "blocked";
  decision_status: string;
  mismatch_or_gap_summary: string | null;
  expected_summary: string | null;
  observed_summary: string | null;
  source_line: string | null;
  selected_candidate_context_refs: string[];
  source_next_work_candidate_card_ids: string[];
  blockers: string[];
  warnings: string[];
  manual_only_context_refs: string[];
  source_refs: string[];
  authority_profile: string;
  next_work_signal_record_fingerprint: string;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkSignalRollbackRecord {
  rollback_id: string;
  created_at: string;
  receipt_id: string;
  rollback_reason: string;
  authority_profile: string;
  rollback_fingerprint: string;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkSignalRecordsByReceipt {
  receipt: ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteReceipt;
  next_work_signal_record: ResearchCandidateManualGlobalDogfoodNextWorkSignalRecord | null;
  rollback: ResearchCandidateManualGlobalDogfoodNextWorkSignalRollbackRecord | null;
  superseded: boolean;
  rolled_back: boolean;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkSignalReadback {
  readback_kind: "research_candidate_manual_global_dogfood_next_work_signal_readback";
  readback_version: "research_candidate_manual_global_dogfood_next_work_signal_readback.v0.1";
  scope: ResearchCandidateReviewScope;
  records_by_receipt: ResearchCandidateManualGlobalDogfoodNextWorkSignalRecordsByReceipt[];
  latest_receipts: ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteReceipt[];
  latest_active_committed: ResearchCandidateManualGlobalDogfoodNextWorkSignalRecordsByReceipt | null;
  count: number;
  authority_boundary: ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteAuthorityBoundary;
  raw_manual_note_text_present: false;
  raw_result_report_text_present: false;
  operator_notes_persisted: false;
  next_work_bias_written: false;
  work_or_perspective_rows_written: false;
  dogfood_metrics_written: false;
  metric_snapshot_mutated: false;
  global_dogfood_ledger_mutated: false;
  proof_or_evidence_rows_written: false;
  perspective_memory_written: false;
  product_write_executed: false;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteResult {
  ok: boolean;
  result_status: ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteResultStatus;
  validation: ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteValidation;
  receipt: ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteReceipt | null;
  next_work_signal_record: ResearchCandidateManualGlobalDogfoodNextWorkSignalRecord | null;
  readback: ResearchCandidateManualGlobalDogfoodNextWorkSignalReadback | null;
  refusal_reasons: string[];
  duplicate_replayed: boolean;
  idempotency_key: string | null;
  authority_boundary: ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteAuthorityBoundary;
  next_work_bias_written: false;
  work_or_perspective_rows_written: false;
  dogfood_metrics_written: false;
  metric_snapshot_mutated: false;
  global_dogfood_ledger_mutated: false;
  proof_or_evidence_rows_written: false;
  perspective_memory_written: false;
  product_write_executed: false;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkSignalRollbackResult {
  ok: boolean;
  result_status: ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteResultStatus;
  rollback: ResearchCandidateManualGlobalDogfoodNextWorkSignalRollbackRecord | null;
  receipt: ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteReceipt | null;
  readback: ResearchCandidateManualGlobalDogfoodNextWorkSignalReadback | null;
  refusal_reasons: string[];
  authority_boundary: ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteAuthorityBoundary;
  next_work_bias_written: false;
  work_or_perspective_rows_written: false;
  dogfood_metrics_written: false;
  metric_snapshot_mutated: false;
  global_dogfood_ledger_mutated: false;
  proof_or_evidence_rows_written: false;
  perspective_memory_written: false;
  product_write_executed: false;
}
