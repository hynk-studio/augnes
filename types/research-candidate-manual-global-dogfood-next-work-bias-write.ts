import type {
  ResearchCandidateManualGlobalDogfoodNextWorkBiasContract,
} from "@/types/research-candidate-manual-global-dogfood-next-work-bias-contract";
import type {
  ResearchCandidateManualGlobalDogfoodNextWorkBiasReview,
} from "@/types/research-candidate-manual-global-dogfood-next-work-bias-review";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";
import type { ResearchCandidateManualGlobalDogfoodNextWorkSignalReadback } from "@/types/research-candidate-manual-global-dogfood-next-work-signal-write";

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_BIAS_WRITE_CONFIRMATION =
  "I authorize writing this manual global dogfood next-work signal to a next-work bias record" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_BIAS_ROLLBACK_CONFIRMATION =
  "I authorize rolling back this manual global dogfood next-work bias receipt" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_BIAS_WRITE_KIND =
  "research_candidate_manual_global_dogfood_next_work_bias_write" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_BIAS_WRITE_VERSION =
  "research_candidate_manual_global_dogfood_next_work_bias_write.v0.1" as const;

export type ResearchCandidateManualGlobalDogfoodNextWorkBiasAuthorizationKind =
  "manual_operator_authorized_next_work_bias_write";

export type ResearchCandidateManualGlobalDogfoodNextWorkBiasWriteMode =
  | "commit"
  | "replay_if_duplicate"
  | "supersede_previous";

export type ResearchCandidateManualGlobalDogfoodNextWorkBiasWriteStatus =
  | "committed"
  | "duplicate_replayed"
  | "superseded"
  | "rolled_back";

export type ResearchCandidateManualGlobalDogfoodNextWorkBiasWriteResultStatus =
  | "committed"
  | "duplicate_replayed"
  | "superseded"
  | "rolled_back"
  | "refused"
  | "schema_missing"
  | "not_found";

export interface ResearchCandidateManualGlobalDogfoodNextWorkBiasOperatorAuthorization {
  authorization_kind: ResearchCandidateManualGlobalDogfoodNextWorkBiasAuthorizationKind;
  operator_confirmation_text: string;
  write_mode: ResearchCandidateManualGlobalDogfoodNextWorkBiasWriteMode;
  supersedes_receipt_id?: string | null;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkBiasWriteRequest {
  next_work_bias_contract: ResearchCandidateManualGlobalDogfoodNextWorkBiasContract;
  next_work_bias_review: ResearchCandidateManualGlobalDogfoodNextWorkBiasReview;
  source_next_work_signal_readback?: ResearchCandidateManualGlobalDogfoodNextWorkSignalReadback | null;
  operator_authorization: ResearchCandidateManualGlobalDogfoodNextWorkBiasOperatorAuthorization;
  requested_side_effects?: Record<string, unknown>;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkBiasRollbackAuthorization {
  authorization_kind: "manual_operator_authorized_next_work_bias_rollback";
  operator_confirmation_text: string;
  rollback_reason: string;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkBiasRollbackRequest {
  receipt_id: string;
  rollback_authorization: ResearchCandidateManualGlobalDogfoodNextWorkBiasRollbackAuthorization;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkBiasWriteAuthorityBoundary {
  can_write_next_work_bias_record: true;
  can_write_next_work_bias_receipt: true;
  can_write_next_work_bias_rollback_metadata: true;
  source_of_truth: false;
  can_write_work_item: false;
  can_mutate_work: false;
  can_write_perspective_relay: false;
  can_write_perspective_state: false;
  can_promote_perspective: false;
  can_write_perspective_memory: false;
  can_write_dogfood_metrics: false;
  can_write_global_dogfood_ledger: false;
  can_write_metric_snapshot: false;
  can_write_next_work_signal_decision: false;
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

export interface ResearchCandidateManualGlobalDogfoodNextWorkBiasWriteValidation {
  passed: boolean;
  failure_codes: string[];
  idempotency_key: string | null;
  exact_operator_confirmation_present: boolean;
  ready_next_work_bias_contract_present: boolean;
  accepted_next_work_bias_review_present: boolean;
  preview_contract_remained_non_writing: boolean;
  preview_authority_boundary_was_read_only: boolean;
  writer_authority_boundary_is_narrow: boolean;
  raw_text_fields_absent: boolean;
  operator_note_absent: boolean;
  source_refs_present: boolean;
  source_next_work_signal_receipt_active_committed: boolean;
  source_next_work_signal_record_matches_contract: boolean;
  source_readback_flags_preserve_no_forbidden_mutation: boolean;
  recommended_next_work_label_present: boolean;
  selected_candidate_context_refs_present: boolean;
  source_next_work_candidate_card_ids_present: boolean;
  proposed_bias_candidate_ready: boolean;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkBiasWriteReceipt {
  receipt_id: string;
  created_at: string;
  scope: ResearchCandidateReviewScope;
  source_next_work_bias_contract_fingerprint: string;
  source_next_work_bias_review_fingerprint: string;
  source_next_work_signal_receipt_id: string;
  source_next_work_signal_record_id: string;
  source_next_work_signal_record_fingerprint: string;
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
    ResearchCandidateManualGlobalDogfoodNextWorkBiasWriteStatus,
    "duplicate_replayed"
  >;
  authority_profile: string;
  receipt_fingerprint: string;
  supersedes_receipt_id: string | null;
  rollback_of_receipt_id: string | null;
  rollback_reason: string | null;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkBiasRecord {
  next_work_bias_record_id: string;
  receipt_id: string;
  created_at: string;
  scope: ResearchCandidateReviewScope;
  source_next_work_signal_receipt_id: string;
  source_next_work_signal_record_id: string;
  source_projection_fingerprint: string;
  source_global_dogfood_ledger_receipt_id: string;
  source_global_dogfood_ledger_record_id: string;
  source_metric_snapshot_receipt_id: string;
  source_metric_snapshot_record_id: string;
  recommended_next_work_label: string;
  rationale: string;
  outcome_label: string;
  outcome_signal: "positive" | "negative" | "ambiguous";
  bias_strength_hint: "low" | "medium" | "high" | "blocked";
  selected_candidate_context_refs: string[];
  source_next_work_candidate_card_ids: string[];
  expected_summary: string | null;
  observed_summary: string | null;
  mismatch_or_gap_summary: string | null;
  source_line: string | null;
  blockers: string[];
  warnings: string[];
  manual_only_context_refs: string[];
  source_refs: string[];
  authority_profile: string;
  next_work_bias_record_fingerprint: string;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkBiasRollbackRecord {
  rollback_id: string;
  created_at: string;
  receipt_id: string;
  rollback_reason: string;
  authority_profile: string;
  rollback_fingerprint: string;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkBiasRecordsByReceipt {
  receipt: ResearchCandidateManualGlobalDogfoodNextWorkBiasWriteReceipt;
  next_work_bias_record: ResearchCandidateManualGlobalDogfoodNextWorkBiasRecord | null;
  rollback: ResearchCandidateManualGlobalDogfoodNextWorkBiasRollbackRecord | null;
  superseded: boolean;
  rolled_back: boolean;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkBiasReadback {
  readback_kind: "research_candidate_manual_global_dogfood_next_work_bias_readback";
  readback_version: "research_candidate_manual_global_dogfood_next_work_bias_readback.v0.1";
  scope: ResearchCandidateReviewScope;
  storage_path: "manual_specific_next_work_bias_tables";
  records_by_receipt: ResearchCandidateManualGlobalDogfoodNextWorkBiasRecordsByReceipt[];
  latest_receipts: ResearchCandidateManualGlobalDogfoodNextWorkBiasWriteReceipt[];
  latest_active_committed: ResearchCandidateManualGlobalDogfoodNextWorkBiasRecordsByReceipt | null;
  count: number;
  authority_boundary: ResearchCandidateManualGlobalDogfoodNextWorkBiasWriteAuthorityBoundary;
  raw_manual_note_text_present: false;
  raw_result_report_text_present: false;
  operator_notes_persisted: false;
  work_mutated: false;
  perspective_relay_written: false;
  perspective_state_written: false;
  perspective_promoted: false;
  perspective_memory_written: false;
  dogfood_metrics_written: false;
  global_dogfood_ledger_mutated: false;
  metric_snapshot_mutated: false;
  next_work_signal_decision_mutated: false;
  proof_or_evidence_rows_written: false;
  product_write_executed: false;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkBiasWriteResult {
  ok: boolean;
  result_status: ResearchCandidateManualGlobalDogfoodNextWorkBiasWriteResultStatus;
  validation: ResearchCandidateManualGlobalDogfoodNextWorkBiasWriteValidation;
  receipt: ResearchCandidateManualGlobalDogfoodNextWorkBiasWriteReceipt | null;
  next_work_bias_record: ResearchCandidateManualGlobalDogfoodNextWorkBiasRecord | null;
  readback: ResearchCandidateManualGlobalDogfoodNextWorkBiasReadback | null;
  refusal_reasons: string[];
  duplicate_replayed: boolean;
  idempotency_key: string | null;
  authority_boundary: ResearchCandidateManualGlobalDogfoodNextWorkBiasWriteAuthorityBoundary;
  work_mutated: false;
  perspective_relay_written: false;
  perspective_state_written: false;
  perspective_promoted: false;
  perspective_memory_written: false;
  dogfood_metrics_written: false;
  global_dogfood_ledger_mutated: false;
  metric_snapshot_mutated: false;
  next_work_signal_decision_mutated: false;
  proof_or_evidence_rows_written: false;
  product_write_executed: false;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkBiasRollbackResult {
  ok: boolean;
  result_status: ResearchCandidateManualGlobalDogfoodNextWorkBiasWriteResultStatus;
  rollback: ResearchCandidateManualGlobalDogfoodNextWorkBiasRollbackRecord | null;
  receipt: ResearchCandidateManualGlobalDogfoodNextWorkBiasWriteReceipt | null;
  readback: ResearchCandidateManualGlobalDogfoodNextWorkBiasReadback | null;
  refusal_reasons: string[];
  authority_boundary: ResearchCandidateManualGlobalDogfoodNextWorkBiasWriteAuthorityBoundary;
  work_mutated: false;
  perspective_relay_written: false;
  perspective_state_written: false;
  perspective_promoted: false;
  perspective_memory_written: false;
  dogfood_metrics_written: false;
  global_dogfood_ledger_mutated: false;
  metric_snapshot_mutated: false;
  next_work_signal_decision_mutated: false;
  proof_or_evidence_rows_written: false;
  product_write_executed: false;
}
