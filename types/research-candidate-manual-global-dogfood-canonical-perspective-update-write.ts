import type {
  ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateContract,
} from "@/types/research-candidate-manual-global-dogfood-canonical-perspective-update-contract";
import type {
  ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReview,
} from "@/types/research-candidate-manual-global-dogfood-canonical-perspective-update-review";
import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveRelayReadback,
} from "@/types/research-candidate-manual-global-dogfood-perspective-relay-write";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_WRITE_CONFIRMATION =
  "I authorize writing this manual global dogfood relay to a canonical Perspective update record" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_ROLLBACK_CONFIRMATION =
  "I authorize rolling back this manual global dogfood canonical Perspective update receipt" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_WRITE_KIND =
  "research_candidate_manual_global_dogfood_canonical_perspective_update_write" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_WRITE_VERSION =
  "research_candidate_manual_global_dogfood_canonical_perspective_update_write.v0.1" as const;

export type ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateAuthorizationKind =
  "manual_operator_authorized_canonical_perspective_update_write";

export type ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteMode =
  | "commit"
  | "replay_if_duplicate"
  | "supersede_previous";

export type ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteStatus =
  | "committed"
  | "duplicate_replayed"
  | "superseded"
  | "rolled_back";

export type ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteResultStatus =
  | "committed"
  | "duplicate_replayed"
  | "superseded"
  | "rolled_back"
  | "refused"
  | "schema_missing"
  | "not_found";

export interface ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateOperatorAuthorization {
  authorization_kind: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateAuthorizationKind;
  operator_confirmation_text: string;
  write_mode: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteMode;
  supersedes_receipt_id?: string | null;
}

export interface ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteRequest {
  canonical_perspective_update_contract: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateContract;
  canonical_perspective_update_review: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReview;
  source_perspective_relay_readback?: ResearchCandidateManualGlobalDogfoodPerspectiveRelayReadback | null;
  operator_authorization: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateOperatorAuthorization;
  requested_side_effects?: Record<string, unknown>;
}

export interface ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateRollbackAuthorization {
  authorization_kind: "manual_operator_authorized_canonical_perspective_update_rollback";
  operator_confirmation_text: string;
  rollback_reason: string;
}

export interface ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateRollbackRequest {
  receipt_id: string;
  rollback_authorization: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateRollbackAuthorization;
}

export interface ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteAuthorityBoundary {
  can_write_canonical_perspective_update_record: true;
  can_write_canonical_perspective_update_receipt: true;
  can_write_canonical_perspective_update_rollback_metadata: true;
  source_of_truth: false;
  can_write_canonical_perspective_state: false;
  can_update_current_working_perspective: false;
  can_promote_perspective: false;
  can_write_perspective_memory: false;
  can_write_perspective_relay: false;
  can_mutate_perspective_relay: false;
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

export interface ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteValidation {
  passed: boolean;
  failure_codes: string[];
  idempotency_key: string | null;
  exact_operator_confirmation_present: boolean;
  ready_canonical_perspective_update_contract_present: boolean;
  accepted_canonical_perspective_update_review_present: boolean;
  preview_contract_remained_non_writing: boolean;
  preview_authority_boundary_was_read_only: boolean;
  writer_authority_boundary_is_narrow: boolean;
  raw_text_fields_absent: boolean;
  operator_note_absent: boolean;
  source_refs_present: boolean;
  source_perspective_relay_receipt_active_committed: boolean;
  source_perspective_relay_record_matches_contract: boolean;
  source_readback_flags_preserve_no_forbidden_mutation: boolean;
  canonical_update_label_present: boolean;
  canonical_update_rationale_present: boolean;
  relay_update_label_present: boolean;
  relay_update_rationale_present: boolean;
  selected_candidate_context_refs_present: boolean;
  source_next_work_candidate_card_ids_present: boolean;
  update_scope_hint_is_canonical_perspective_state: boolean;
  proposed_canonical_update_candidate_ready: boolean;
}

export interface ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteReceipt {
  receipt_id: string;
  created_at: string;
  scope: ResearchCandidateReviewScope;
  source_canonical_perspective_update_contract_fingerprint: string;
  source_canonical_perspective_update_review_fingerprint: string;
  source_perspective_relay_receipt_id: string;
  source_perspective_relay_record_id: string;
  source_perspective_relay_record_fingerprint: string;
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
    ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteStatus,
    "duplicate_replayed"
  >;
  authority_profile: string;
  receipt_fingerprint: string;
  supersedes_receipt_id: string | null;
  rollback_of_receipt_id: string | null;
  rollback_reason: string | null;
}

export interface ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateRecord {
  canonical_perspective_update_record_id: string;
  receipt_id: string;
  created_at: string;
  scope: ResearchCandidateReviewScope;
  source_perspective_relay_receipt_id: string;
  source_perspective_relay_record_id: string;
  source_next_work_signal_receipt_id: string;
  source_next_work_signal_record_id: string;
  source_next_work_bias_receipt_id: string;
  source_next_work_bias_record_id: string;
  source_projection_fingerprint: string;
  source_global_dogfood_ledger_receipt_id: string;
  source_global_dogfood_ledger_record_id: string;
  source_metric_snapshot_receipt_id: string;
  source_metric_snapshot_record_id: string;
  canonical_update_label: string;
  canonical_update_rationale: string;
  relay_update_label: string;
  relay_update_rationale: string;
  recommended_next_work_label: string;
  outcome_label: string;
  outcome_signal: "positive" | "negative" | "ambiguous";
  update_scope_hint: "canonical_perspective_state";
  update_strength_hint: "low" | "medium" | "high";
  expected_summary: string | null;
  observed_summary: string | null;
  mismatch_or_gap_summary: string | null;
  selected_candidate_context_refs: string[];
  source_next_work_candidate_card_ids: string[];
  manual_only_context_refs: string[];
  source_line: string | null;
  blockers: string[];
  warnings: string[];
  compatibility_findings: string[];
  existing_perspective_update_compatibility: Record<string, unknown>;
  source_refs: string[];
  authority_profile: string;
  canonical_perspective_update_record_fingerprint: string;
}

export interface ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateRollbackRecord {
  rollback_id: string;
  created_at: string;
  receipt_id: string;
  rollback_reason: string;
  authority_profile: string;
  rollback_fingerprint: string;
}

export interface ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateRecordsByReceipt {
  receipt: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteReceipt;
  canonical_perspective_update_record: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateRecord | null;
  rollback: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateRollbackRecord | null;
  superseded: boolean;
  rolled_back: boolean;
}

export interface ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReadback {
  readback_kind: "research_candidate_manual_global_dogfood_canonical_perspective_update_readback";
  readback_version: "research_candidate_manual_global_dogfood_canonical_perspective_update_readback.v0.1";
  scope: ResearchCandidateReviewScope;
  storage_path: "manual_specific_canonical_perspective_update_tables";
  records_by_receipt: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateRecordsByReceipt[];
  latest_receipts: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteReceipt[];
  latest_active_committed: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateRecordsByReceipt | null;
  count: number;
  authority_boundary: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteAuthorityBoundary;
  raw_manual_note_text_present: false;
  raw_result_report_text_present: false;
  operator_notes_persisted: false;
  canonical_perspective_update_record_written: boolean;
  canonical_perspective_state_written: false;
  current_working_perspective_updated: false;
  perspective_promoted: false;
  perspective_memory_written: false;
  perspective_relay_mutated: false;
  next_work_bias_mutated: false;
  work_mutated: false;
  dogfood_metrics_written: false;
  global_dogfood_ledger_mutated: false;
  metric_snapshot_mutated: false;
  next_work_signal_decision_mutated: false;
  proof_or_evidence_rows_written: false;
  product_write_executed: false;
}

export interface ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteResult {
  ok: boolean;
  result_status: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteResultStatus;
  validation: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteValidation;
  receipt: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteReceipt | null;
  canonical_perspective_update_record: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateRecord | null;
  readback: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReadback | null;
  refusal_reasons: string[];
  duplicate_replayed: boolean;
  idempotency_key: string | null;
  authority_boundary: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteAuthorityBoundary;
  canonical_perspective_update_record_written: boolean;
  canonical_perspective_state_written: false;
  current_working_perspective_updated: false;
  perspective_promoted: false;
  perspective_memory_written: false;
  perspective_relay_mutated: false;
  next_work_bias_mutated: false;
  work_mutated: false;
  dogfood_metrics_written: false;
  global_dogfood_ledger_mutated: false;
  metric_snapshot_mutated: false;
  next_work_signal_decision_mutated: false;
  proof_or_evidence_rows_written: false;
  product_write_executed: false;
}

export interface ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateRollbackResult {
  ok: boolean;
  result_status: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteResultStatus;
  rollback: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateRollbackRecord | null;
  receipt: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteReceipt | null;
  readback: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReadback | null;
  refusal_reasons: string[];
  authority_boundary: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteAuthorityBoundary;
  canonical_perspective_update_record_written: boolean;
  canonical_perspective_state_written: false;
  current_working_perspective_updated: false;
  perspective_promoted: false;
  perspective_memory_written: false;
  perspective_relay_mutated: false;
  next_work_bias_mutated: false;
  work_mutated: false;
  dogfood_metrics_written: false;
  global_dogfood_ledger_mutated: false;
  metric_snapshot_mutated: false;
  next_work_signal_decision_mutated: false;
  proof_or_evidence_rows_written: false;
  product_write_executed: false;
}
