import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveRelayContract,
} from "@/types/research-candidate-manual-global-dogfood-perspective-relay-contract";
import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveRelayReview,
} from "@/types/research-candidate-manual-global-dogfood-perspective-relay-review";
import type {
  ResearchCandidateManualGlobalDogfoodNextWorkBiasReadback,
} from "@/types/research-candidate-manual-global-dogfood-next-work-bias-write";
import type { ResearchCandidateManualGlobalDogfoodNextWorkSignalReadback } from "@/types/research-candidate-manual-global-dogfood-next-work-signal-write";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_WRITE_CONFIRMATION =
  "I authorize writing this manual global dogfood signal to a Perspective relay update record" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_ROLLBACK_CONFIRMATION =
  "I authorize rolling back this manual global dogfood Perspective relay receipt" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_WRITE_KIND =
  "research_candidate_manual_global_dogfood_perspective_relay_write" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_WRITE_VERSION =
  "research_candidate_manual_global_dogfood_perspective_relay_write.v0.1" as const;

export type ResearchCandidateManualGlobalDogfoodPerspectiveRelayAuthorizationKind =
  "manual_operator_authorized_perspective_relay_write";

export type ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteMode =
  | "commit"
  | "replay_if_duplicate"
  | "supersede_previous";

export type ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteStatus =
  | "committed"
  | "duplicate_replayed"
  | "superseded"
  | "rolled_back";

export type ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteResultStatus =
  | "committed"
  | "duplicate_replayed"
  | "superseded"
  | "rolled_back"
  | "refused"
  | "schema_missing"
  | "not_found";

export interface ResearchCandidateManualGlobalDogfoodPerspectiveRelayOperatorAuthorization {
  authorization_kind: ResearchCandidateManualGlobalDogfoodPerspectiveRelayAuthorizationKind;
  operator_confirmation_text: string;
  write_mode: ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteMode;
  supersedes_receipt_id?: string | null;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteRequest {
  perspective_relay_contract: ResearchCandidateManualGlobalDogfoodPerspectiveRelayContract;
  perspective_relay_review: ResearchCandidateManualGlobalDogfoodPerspectiveRelayReview;
  source_next_work_signal_readback?: ResearchCandidateManualGlobalDogfoodNextWorkSignalReadback | null;
  source_next_work_bias_readback?: ResearchCandidateManualGlobalDogfoodNextWorkBiasReadback | null;
  operator_authorization: ResearchCandidateManualGlobalDogfoodPerspectiveRelayOperatorAuthorization;
  requested_side_effects?: Record<string, unknown>;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveRelayRollbackAuthorization {
  authorization_kind: "manual_operator_authorized_perspective_relay_rollback";
  operator_confirmation_text: string;
  rollback_reason: string;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveRelayRollbackRequest {
  receipt_id: string;
  rollback_authorization: ResearchCandidateManualGlobalDogfoodPerspectiveRelayRollbackAuthorization;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteAuthorityBoundary {
  can_write_perspective_relay_record: true;
  can_write_perspective_relay_receipt: true;
  can_write_perspective_relay_rollback_metadata: true;
  source_of_truth: false;
  can_write_perspective_state: false;
  can_promote_perspective: false;
  can_write_perspective_memory: false;
  can_write_next_work_bias: false;
  can_mutate_next_work_bias: false;
  can_write_work_item: false;
  can_mutate_work: false;
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

export interface ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteValidation {
  passed: boolean;
  failure_codes: string[];
  idempotency_key: string | null;
  exact_operator_confirmation_present: boolean;
  ready_perspective_relay_contract_present: boolean;
  accepted_perspective_relay_review_present: boolean;
  preview_contract_remained_non_writing: boolean;
  preview_authority_boundary_was_read_only: boolean;
  writer_authority_boundary_is_narrow: boolean;
  raw_text_fields_absent: boolean;
  operator_note_absent: boolean;
  source_refs_present: boolean;
  source_next_work_signal_receipt_active_committed: boolean;
  source_next_work_signal_record_matches_contract: boolean;
  source_next_work_bias_receipt_active_committed: boolean;
  source_next_work_bias_record_matches_contract: boolean;
  source_readback_flags_preserve_no_forbidden_mutation: boolean;
  relay_update_label_present: boolean;
  selected_candidate_context_refs_present: boolean;
  source_next_work_candidate_card_ids_present: boolean;
  proposed_relay_candidate_ready: boolean;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteReceipt {
  receipt_id: string;
  created_at: string;
  scope: ResearchCandidateReviewScope;
  source_perspective_relay_contract_fingerprint: string;
  source_perspective_relay_review_fingerprint: string;
  source_next_work_signal_receipt_id: string;
  source_next_work_signal_record_id: string;
  source_next_work_signal_record_fingerprint: string;
  source_next_work_bias_receipt_id: string;
  source_next_work_bias_record_id: string;
  source_next_work_bias_record_fingerprint: string;
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
    ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteStatus,
    "duplicate_replayed"
  >;
  authority_profile: string;
  receipt_fingerprint: string;
  supersedes_receipt_id: string | null;
  rollback_of_receipt_id: string | null;
  rollback_reason: string | null;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveRelayRecord {
  perspective_relay_record_id: string;
  receipt_id: string;
  created_at: string;
  scope: ResearchCandidateReviewScope;
  source_next_work_signal_receipt_id: string;
  source_next_work_signal_record_id: string;
  source_next_work_bias_receipt_id: string;
  source_next_work_bias_record_id: string;
  source_projection_fingerprint: string;
  source_global_dogfood_ledger_receipt_id: string;
  source_global_dogfood_ledger_record_id: string;
  source_metric_snapshot_receipt_id: string;
  source_metric_snapshot_record_id: string;
  relay_update_label: string;
  relay_update_rationale: string;
  recommended_next_work_label: string;
  outcome_label: string;
  outcome_signal: "positive" | "negative" | "ambiguous";
  expected_summary: string | null;
  observed_summary: string | null;
  mismatch_or_gap_summary: string | null;
  selected_candidate_context_refs: string[];
  source_next_work_candidate_card_ids: string[];
  manual_only_context_refs: string[];
  source_line: string | null;
  blockers: string[];
  warnings: string[];
  source_refs: string[];
  authority_profile: string;
  perspective_relay_record_fingerprint: string;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveRelayRollbackRecord {
  rollback_id: string;
  created_at: string;
  receipt_id: string;
  rollback_reason: string;
  authority_profile: string;
  rollback_fingerprint: string;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveRelayRecordsByReceipt {
  receipt: ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteReceipt;
  perspective_relay_record: ResearchCandidateManualGlobalDogfoodPerspectiveRelayRecord | null;
  rollback: ResearchCandidateManualGlobalDogfoodPerspectiveRelayRollbackRecord | null;
  superseded: boolean;
  rolled_back: boolean;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveRelayReadback {
  readback_kind: "research_candidate_manual_global_dogfood_perspective_relay_readback";
  readback_version: "research_candidate_manual_global_dogfood_perspective_relay_readback.v0.1";
  scope: ResearchCandidateReviewScope;
  storage_path: "manual_specific_perspective_relay_tables";
  records_by_receipt: ResearchCandidateManualGlobalDogfoodPerspectiveRelayRecordsByReceipt[];
  latest_receipts: ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteReceipt[];
  latest_active_committed: ResearchCandidateManualGlobalDogfoodPerspectiveRelayRecordsByReceipt | null;
  count: number;
  authority_boundary: ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteAuthorityBoundary;
  raw_manual_note_text_present: false;
  raw_result_report_text_present: false;
  operator_notes_persisted: false;
  perspective_relay_written: boolean;
  perspective_state_written: false;
  perspective_promoted: false;
  perspective_memory_written: false;
  next_work_bias_mutated: false;
  work_mutated: false;
  dogfood_metrics_written: false;
  global_dogfood_ledger_mutated: false;
  metric_snapshot_mutated: false;
  next_work_signal_decision_mutated: false;
  proof_or_evidence_rows_written: false;
  product_write_executed: false;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteResult {
  ok: boolean;
  result_status: ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteResultStatus;
  validation: ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteValidation;
  receipt: ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteReceipt | null;
  perspective_relay_record: ResearchCandidateManualGlobalDogfoodPerspectiveRelayRecord | null;
  readback: ResearchCandidateManualGlobalDogfoodPerspectiveRelayReadback | null;
  refusal_reasons: string[];
  duplicate_replayed: boolean;
  idempotency_key: string | null;
  authority_boundary: ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteAuthorityBoundary;
  perspective_relay_written: boolean;
  perspective_state_written: false;
  perspective_promoted: false;
  perspective_memory_written: false;
  next_work_bias_mutated: false;
  work_mutated: false;
  dogfood_metrics_written: false;
  global_dogfood_ledger_mutated: false;
  metric_snapshot_mutated: false;
  next_work_signal_decision_mutated: false;
  proof_or_evidence_rows_written: false;
  product_write_executed: false;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveRelayRollbackResult {
  ok: boolean;
  result_status: ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteResultStatus;
  rollback: ResearchCandidateManualGlobalDogfoodPerspectiveRelayRollbackRecord | null;
  receipt: ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteReceipt | null;
  readback: ResearchCandidateManualGlobalDogfoodPerspectiveRelayReadback | null;
  refusal_reasons: string[];
  authority_boundary: ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteAuthorityBoundary;
  perspective_relay_written: boolean;
  perspective_state_written: false;
  perspective_promoted: false;
  perspective_memory_written: false;
  next_work_bias_mutated: false;
  work_mutated: false;
  dogfood_metrics_written: false;
  global_dogfood_ledger_mutated: false;
  metric_snapshot_mutated: false;
  next_work_signal_decision_mutated: false;
  proof_or_evidence_rows_written: false;
  product_write_executed: false;
}
