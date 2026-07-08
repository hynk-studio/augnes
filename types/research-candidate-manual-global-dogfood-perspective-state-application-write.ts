import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationContract,
} from "@/types/research-candidate-manual-global-dogfood-perspective-state-application-contract";
import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReview,
} from "@/types/research-candidate-manual-global-dogfood-perspective-state-application-review";
import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReadback,
} from "@/types/research-candidate-manual-global-dogfood-perspective-adapter-write";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_STATE_APPLICATION_WRITE_CONFIRMATION =
  "I authorize writing this manual global dogfood Perspective state application candidate to a Perspective state application record" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_STATE_APPLICATION_ROLLBACK_CONFIRMATION =
  "I authorize rolling back this manual global dogfood Perspective state application receipt" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_STATE_APPLICATION_WRITE_KIND =
  "research_candidate_manual_global_dogfood_perspective_state_application_write" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_STATE_APPLICATION_WRITE_VERSION =
  "research_candidate_manual_global_dogfood_perspective_state_application_write.v0.1" as const;

export type ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationAuthorizationKind =
  "manual_operator_authorized_perspective_state_application_write";

export type ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteMode =
  | "commit"
  | "replay_if_duplicate"
  | "supersede_previous";

export type ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteStatus =
  | "committed"
  | "duplicate_replayed"
  | "superseded"
  | "rolled_back";

export type ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteResultStatus =
  | "committed"
  | "duplicate_replayed"
  | "superseded"
  | "rolled_back"
  | "refused"
  | "schema_missing"
  | "not_found";

export type ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationFailureCode =
  | "perspective_state_application_review_contract_mismatch"
  | "perspective_state_application_review_source_mismatch"
  | "perspective_state_application_contract_not_ready"
  | "perspective_state_application_source_adapter_receipt_not_active_committed"
  | "perspective_state_application_source_adapter_record_mismatch"
  | "perspective_state_application_source_readback_forbidden_mutation_flag"
  | "perspective_state_application_target_must_be_manual_specific"
  | "perspective_state_application_storage_path_must_be_manual_specific"
  | "perspective_state_application_future_write_scope_must_be_record_only"
  | "perspective_state_application_wrong_confirmation"
  | "perspective_state_application_requested_side_effects_refused"
  | "perspective_state_application_contract_shape_invalid"
  | "perspective_state_application_review_shape_invalid"
  | "perspective_state_application_operator_authorization_shape_invalid";

export interface ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationOperatorAuthorization {
  authorization_kind: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationAuthorizationKind;
  operator_confirmation_text: string;
  write_mode: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteMode;
  supersedes_receipt_id?: string | null;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteRequest {
  perspective_state_application_contract: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationContract;
  perspective_state_application_review: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReview;
  source_perspective_adapter_readback?: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReadback | null;
  operator_authorization: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationOperatorAuthorization;
  requested_side_effects?: Record<string, unknown>;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationRollbackAuthorization {
  authorization_kind: "manual_operator_authorized_perspective_state_application_rollback";
  operator_confirmation_text: string;
  rollback_reason: string;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationRollbackRequest {
  receipt_id: string;
  rollback_authorization: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationRollbackAuthorization;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteAuthorityBoundary {
  can_write_perspective_state_application_record: true;
  can_write_perspective_state_application_receipt: true;
  can_write_perspective_state_application_rollback_metadata: true;
  source_of_truth: false;
  can_update_current_working_perspective: false;
  can_mutate_existing_canonical_perspective_state: false;
  can_write_existing_canonical_perspective_state: false;
  can_write_canonical_perspective_state: false;
  can_promote_perspective: false;
  can_write_perspective_memory: false;
  can_mutate_perspective_adapter_record: false;
  can_mutate_perspective_state_mutation_record: false;
  can_mutate_perspective_apply_record: false;
  can_mutate_canonical_perspective_update_record: false;
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

export interface ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteValidation {
  passed: boolean;
  failure_codes: string[];
  idempotency_key: string | null;
  exact_operator_confirmation_present: boolean;
  ready_perspective_state_application_contract_present: boolean;
  accepted_perspective_state_application_review_present: boolean;
  preview_contract_remained_non_writing: boolean;
  preview_authority_boundary_was_read_only: boolean;
  writer_authority_boundary_is_narrow: boolean;
  raw_text_fields_absent: boolean;
  operator_note_absent: boolean;
  source_refs_present: boolean;
  source_perspective_adapter_receipt_active_committed: boolean;
  source_perspective_adapter_record_matches_contract: boolean;
  source_readback_flags_preserve_no_forbidden_mutation: boolean;
  handoff_seed_fingerprint_present: boolean;
  result_text_fingerprint_present: boolean;
  state_application_label_present: boolean;
  state_application_rationale_present: boolean;
  adapter_label_present: boolean;
  adapter_rationale_present: boolean;
  mutation_label_present: boolean;
  mutation_rationale_present: boolean;
  apply_label_present: boolean;
  apply_rationale_present: boolean;
  canonical_update_label_present: boolean;
  canonical_update_rationale_present: boolean;
  relay_update_label_present: boolean;
  relay_update_rationale_present: boolean;
  selected_candidate_context_refs_present: boolean;
  source_next_work_candidate_card_ids_present: boolean;
  state_application_target_is_manual_specific: boolean;
  default_state_application_target_is_manual_specific: boolean;
  state_application_scope_hint_is_manual_specific: boolean;
  storage_path_is_manual_specific: boolean;
  future_write_scope_is_state_application_record_only: boolean;
  proposed_perspective_state_application_candidate_ready: boolean;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteReceipt {
  receipt_id: string;
  created_at: string;
  scope: ResearchCandidateReviewScope;
  source_perspective_state_application_contract_fingerprint: string;
  source_perspective_state_application_review_fingerprint: string;
  source_perspective_adapter_receipt_id: string;
  source_perspective_adapter_record_id: string;
  source_perspective_adapter_record_fingerprint: string;
  source_perspective_state_mutation_receipt_id: string;
  source_perspective_state_mutation_record_id: string;
  source_perspective_state_mutation_record_fingerprint: string;
  source_perspective_apply_receipt_id: string;
  source_perspective_apply_record_id: string;
  source_perspective_apply_record_fingerprint: string;
  source_canonical_perspective_update_receipt_id: string;
  source_canonical_perspective_update_record_id: string;
  source_canonical_perspective_update_record_fingerprint: string;
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
    ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteStatus,
    "duplicate_replayed"
  >;
  authority_profile: string;
  receipt_fingerprint: string;
  supersedes_receipt_id: string | null;
  rollback_of_receipt_id: string | null;
  rollback_reason: string | null;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationRecord {
  perspective_state_application_record_id: string;
  receipt_id: string;
  created_at: string;
  scope: ResearchCandidateReviewScope;
  source_perspective_adapter_receipt_id: string;
  source_perspective_adapter_record_id: string;
  source_perspective_state_mutation_receipt_id: string;
  source_perspective_state_mutation_record_id: string;
  source_perspective_apply_receipt_id: string;
  source_perspective_apply_record_id: string;
  source_canonical_perspective_update_receipt_id: string;
  source_canonical_perspective_update_record_id: string;
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
  state_application_label: string;
  state_application_rationale: string;
  adapter_label: string;
  adapter_rationale: string;
  mutation_label: string;
  mutation_rationale: string;
  apply_label: string;
  apply_rationale: string;
  canonical_update_label: string;
  canonical_update_rationale: string;
  relay_update_label: string;
  relay_update_rationale: string;
  recommended_next_work_label: string;
  outcome_label: string;
  outcome_signal: "positive" | "negative" | "ambiguous";
  intended_future_state_application_target:
    | "manual_specific_existing_canonical_state_application_adapter"
    | "manual_specific_current_working_application_adapter";
  default_future_state_application_target:
    | "manual_specific_existing_canonical_state_application_adapter"
    | "manual_specific_current_working_application_adapter";
  state_application_scope_hint:
    | "manual_specific_existing_canonical_state_application_adapter"
    | "manual_specific_current_working_application_adapter";
  state_application_strength_hint: "low" | "medium" | "high";
  expected_future_write_scope: "state_application_record_only";
  recommended_storage_path: "manual_specific_perspective_state_application_tables";
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
  existing_current_working_application_compatibility: Record<string, unknown>;
  existing_canonical_state_application_compatibility: Record<string, unknown>;
  manual_state_application_write_path: Record<string, unknown>;
  source_refs: string[];
  authority_profile: string;
  perspective_state_application_record_fingerprint: string;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationRollbackRecord {
  rollback_id: string;
  created_at: string;
  receipt_id: string;
  rollback_reason: string;
  authority_profile: string;
  rollback_fingerprint: string;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationRecordsByReceipt {
  receipt: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteReceipt;
  perspective_state_application_record: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationRecord | null;
  rollback: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationRollbackRecord | null;
  superseded: boolean;
  rolled_back: boolean;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReadback {
  readback_kind: "research_candidate_manual_global_dogfood_perspective_state_application_readback";
  readback_version: "research_candidate_manual_global_dogfood_perspective_state_application_readback.v0.1";
  scope: ResearchCandidateReviewScope;
  storage_path: "manual_specific_perspective_state_application_tables";
  records_by_receipt: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationRecordsByReceipt[];
  latest_receipts: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteReceipt[];
  latest_active_committed: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationRecordsByReceipt | null;
  count: number;
  authority_boundary: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteAuthorityBoundary;
  raw_manual_note_text_present: false;
  raw_result_report_text_present: false;
  operator_notes_persisted: false;
  perspective_state_application_record_written: boolean;
  current_working_perspective_updated: false;
  existing_canonical_perspective_state_table_mutated: false;
  canonical_perspective_state_written: false;
  perspective_promoted: false;
  perspective_memory_written: false;
  perspective_adapter_record_mutated: false;
  perspective_state_mutation_record_mutated: false;
  perspective_apply_record_mutated: false;
  canonical_perspective_update_record_mutated: false;
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

export interface ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteResult {
  ok: boolean;
  result_status: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteResultStatus;
  validation: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteValidation;
  receipt: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteReceipt | null;
  perspective_state_application_record: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationRecord | null;
  readback: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReadback | null;
  refusal_reasons: string[];
  duplicate_replayed: boolean;
  idempotency_key: string | null;
  authority_boundary: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteAuthorityBoundary;
  perspective_state_application_record_written: boolean;
  current_working_perspective_updated: false;
  existing_canonical_perspective_state_table_mutated: false;
  canonical_perspective_state_written: false;
  perspective_promoted: false;
  perspective_memory_written: false;
  perspective_adapter_record_mutated: false;
  perspective_state_mutation_record_mutated: false;
  perspective_apply_record_mutated: false;
  canonical_perspective_update_record_mutated: false;
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

export interface ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationRollbackResult {
  ok: boolean;
  result_status: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteResultStatus;
  rollback: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationRollbackRecord | null;
  receipt: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteReceipt | null;
  readback: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReadback | null;
  refusal_reasons: string[];
  authority_boundary: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteAuthorityBoundary;
  perspective_state_application_record_written: boolean;
  current_working_perspective_updated: false;
  existing_canonical_perspective_state_table_mutated: false;
  canonical_perspective_state_written: false;
  perspective_promoted: false;
  perspective_memory_written: false;
  perspective_adapter_record_mutated: false;
  perspective_state_mutation_record_mutated: false;
  perspective_apply_record_mutated: false;
  canonical_perspective_update_record_mutated: false;
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
