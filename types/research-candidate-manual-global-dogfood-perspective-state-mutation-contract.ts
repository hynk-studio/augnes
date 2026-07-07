import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_STATE_MUTATION_CONTRACT_KIND =
  "research_candidate_manual_global_dogfood_perspective_state_mutation_contract" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_STATE_MUTATION_CONTRACT_VERSION =
  "research_candidate_manual_global_dogfood_perspective_state_mutation_contract.v0.1" as const;

export type ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationAuthorizationMode =
  | "preview_only"
  | "ready_for_future_perspective_state_mutation_write_authorization"
  | "blocked_before_perspective_state_mutation_authorization";

export type ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationTarget =
  | "canonical_perspective_state"
  | "current_working_perspective"
  | "blocked";

export interface ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationContractInput {
  readback: unknown;
  operator_intent_label?: string;
  requested_future_write_mode?: string;
  intended_future_mutation_target?: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationTarget;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationMapping {
  mutation_label: string | null;
  mutation_rationale: string | null;
  apply_label: string | null;
  apply_rationale: string | null;
  canonical_update_label: string | null;
  canonical_update_rationale: string | null;
  relay_update_label: string | null;
  relay_update_rationale: string | null;
  recommended_next_work_label: string | null;
  outcome_label: string | null;
  outcome_signal: "positive" | "negative" | "ambiguous" | null;
  expected_summary: string | null;
  observed_summary: string | null;
  mismatch_or_gap_summary: string | null;
  selected_candidate_context_refs: string[];
  source_next_work_candidate_card_ids: string[];
  manual_only_context_refs: string[];
  source_line: string | null;
  compatibility_findings_summary: string[];
  blockers: string[];
  warnings: string[];
  intended_future_mutation_target: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationTarget;
  can_feed_future_state_mutation_write_candidate: boolean;
  can_update_current_working_perspective_now: false;
  can_write_canonical_perspective_state_now: false;
  can_promote_perspective_now: false;
  can_write_perspective_memory_now: false;
  can_mutate_work_now: false;
  can_write_proof_or_evidence_now: false;
  can_mutate_source_records_now: false;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationCandidate {
  candidate_kind: "manual_global_dogfood_perspective_state_mutation_candidate";
  candidate_status:
    | "ready_for_future_perspective_state_mutation_write_authorization"
    | "blocked_before_perspective_state_mutation_authorization";
  mutation_scope_hint:
    | "canonical_perspective_state"
    | "current_working_perspective"
    | "blocked";
  mutation_strength_hint: "low" | "medium" | "high" | "blocked";
  reason: string;
  writes_now: false;
  would_update_current_working_perspective: false;
  would_write_canonical_perspective_state: false;
  would_promote_perspective: false;
  would_write_perspective_memory: false;
  would_mutate_work: false;
  would_write_proof_or_evidence: false;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveStateApplyCompatibility {
  existing_current_working_perspective_update_contract_preview_compatible: boolean;
  existing_current_working_perspective_update_contract_write_compatible: boolean;
  existing_current_working_perspective_apply_preview_compatible: boolean;
  existing_current_working_perspective_apply_write_compatible: boolean;
  existing_route_integration_contract_compatible: boolean;
  compatibility_notes: string[];
  field_gaps: string[];
  authority_gaps: string[];
  source_lineage_gaps: string[];
  manual_source_refs_preserved: true;
  recommended_future_mapping_path:
    | "manual_specific_state_mutation_write_contract"
    | "existing_current_working_apply_adapter_after_mapping"
    | "blocked";
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationIdempotencyPreview {
  proposed_idempotency_key: string;
  fingerprint_algorithm: "fnv1a32_canonical_json_v0_1";
  would_prevent_duplicate_perspective_state_mutation_write: true;
  durable_id_allocated: false;
  writes_now: false;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationCompatibilityFinding {
  finding_code: string;
  severity: "ready" | "warning" | "blocker";
  applies_to:
    | "manual_global_dogfood_perspective_apply"
    | "future_perspective_state_mutation"
    | "existing_current_working_perspective_apply_path";
  summary: string;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationNonWriteConfirmation {
  current_working_perspective_updated: false;
  canonical_perspective_state_written: false;
  perspective_promoted: false;
  perspective_memory_written: false;
  perspective_apply_record_mutated: false;
  canonical_perspective_update_record_mutated: false;
  perspective_relay_mutated: false;
  next_work_bias_mutated: false;
  work_item_written: false;
  work_mutated: false;
  dogfood_metrics_written: false;
  global_dogfood_ledger_written: false;
  metric_snapshot_written: false;
  next_work_signal_decision_written: false;
  proof_or_evidence_written: false;
  manual_result_records_written: false;
  manual_result_records_mutated: false;
  product_write_executed: false;
  api_write_route_added: false;
  db_schema_or_migration_added: false;
  provider_openai_called: false;
  github_called: false;
  codex_executed: false;
  sources_fetched: false;
  retrieval_rag_embeddings_vector_fts_or_crawler_run: false;
  operator_note_persisted: false;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationValidation {
  passed: boolean;
  contract_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json_v0_1";
  active_committed_perspective_apply_receipt_present: boolean;
  active_committed_perspective_apply_record_present: boolean;
  source_fingerprints_present: boolean;
  apply_label_present: boolean;
  apply_rationale_present: boolean;
  intended_future_apply_target_is_canonical_perspective_state: boolean;
  apply_scope_hint_is_canonical_perspective_state: boolean;
  explanatory_expected_observed_material_present: boolean;
  selected_candidate_context_refs_present: boolean;
  source_next_work_candidate_card_ids_present: boolean;
  manual_context_not_proof_or_evidence: boolean;
  source_readback_preserves_no_state_promotion_memory_work_proof_metric_writes: boolean;
  no_write_authority: boolean;
  blocker_count: number;
  warning_count: number;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationAuthorityBoundary {
  preview_only: true;
  read_only: true;
  source_of_truth: false;
  can_update_current_working_perspective: false;
  can_write_canonical_perspective_state: false;
  can_promote_perspective: false;
  can_write_perspective_memory: false;
  can_mutate_perspective_apply_record: false;
  can_mutate_canonical_perspective_update_record: false;
  can_mutate_perspective_relay: false;
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
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationContract {
  contract_kind: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_STATE_MUTATION_CONTRACT_KIND;
  contract_version: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_STATE_MUTATION_CONTRACT_VERSION;
  scope: ResearchCandidateReviewScope;
  operator_intent_label: string;
  requested_future_write_mode: string;
  source_perspective_apply_readback_ref: string;
  source_perspective_apply_receipt_id: string | null;
  source_perspective_apply_record_id: string | null;
  source_perspective_apply_record_fingerprint: string | null;
  source_canonical_perspective_update_receipt_id: string | null;
  source_canonical_perspective_update_record_id: string | null;
  source_canonical_perspective_update_record_fingerprint: string | null;
  source_perspective_relay_receipt_id: string | null;
  source_perspective_relay_record_id: string | null;
  source_perspective_relay_record_fingerprint: string | null;
  source_next_work_signal_receipt_id: string | null;
  source_next_work_signal_record_id: string | null;
  source_next_work_signal_record_fingerprint: string | null;
  source_next_work_bias_receipt_id: string | null;
  source_next_work_bias_record_id: string | null;
  source_next_work_bias_record_fingerprint: string | null;
  source_projection_fingerprint: string | null;
  source_global_dogfood_ledger_receipt_id: string | null;
  source_global_dogfood_ledger_record_id: string | null;
  source_metric_snapshot_receipt_id: string | null;
  source_metric_snapshot_record_id: string | null;
  source_manual_receipt_id: string | null;
  source_handoff_seed_fingerprint: string | null;
  source_result_text_fingerprint: string | null;
  source_expected_observed_delta_record_ref: string | null;
  source_reuse_outcome_record_ref: string | null;
  operator_authorization_mode: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationAuthorizationMode;
  proposed_state_mutation_mapping: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationMapping;
  proposed_state_mutation_candidate: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationCandidate;
  proposed_existing_state_apply_compatibility: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplyCompatibility;
  idempotency_contract_preview: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationIdempotencyPreview;
  compatibility_findings: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationCompatibilityFinding[];
  blocker_reasons: string[];
  warning_reasons: string[];
  required_future_authorization: string[];
  required_future_checks: string[];
  non_write_confirmation: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationNonWriteConfirmation;
  validation: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationValidation;
  authority_boundary: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationAuthorityBoundary;
  next_recommended_slice: string;
}
