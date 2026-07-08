import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_CONTRACT_KIND =
  "research_candidate_manual_global_dogfood_perspective_adapter_contract" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_CONTRACT_VERSION =
  "research_candidate_manual_global_dogfood_perspective_adapter_contract.v0.1" as const;

export type ResearchCandidateManualGlobalDogfoodPerspectiveAdapterAuthorizationMode =
  | "preview_only"
  | "ready_for_future_perspective_adapter_write_authorization"
  | "blocked_before_perspective_adapter_authorization";

export type ResearchCandidateManualGlobalDogfoodPerspectiveAdapterTarget =
  | "manual_specific_current_working_adapter"
  | "manual_specific_canonical_state_adapter"
  | "existing_current_working_perspective_adapter"
  | "existing_canonical_perspective_state_adapter"
  | "blocked";

export type ResearchCandidateManualGlobalDogfoodPerspectiveAdapterDefaultTarget =
  | "manual_specific_canonical_state_adapter"
  | "manual_specific_current_working_adapter"
  | "blocked";

export interface ResearchCandidateManualGlobalDogfoodPerspectiveAdapterContractInput {
  readback: unknown;
  operator_intent_label?: string;
  requested_future_write_mode?: string;
  intended_future_adapter_target?: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterTarget;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveAdapterMapping {
  adapter_label: string | null;
  adapter_rationale: string | null;
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
  intended_future_adapter_target: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterTarget;
  default_future_adapter_target: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterDefaultTarget;
  can_feed_future_adapter_write_candidate: boolean;
  can_update_current_working_perspective_now: false;
  can_write_existing_canonical_perspective_state_now: false;
  can_promote_perspective_now: false;
  can_write_perspective_memory_now: false;
  can_mutate_work_now: false;
  can_write_proof_or_evidence_now: false;
  can_mutate_source_records_now: false;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveAdapterCandidate {
  candidate_kind: "manual_global_dogfood_perspective_adapter_candidate";
  candidate_status:
    | "ready_for_future_perspective_adapter_write_authorization"
    | "blocked_before_perspective_adapter_authorization";
  adapter_scope_hint:
    | "manual_specific_canonical_state_adapter"
    | "manual_specific_current_working_adapter"
    | "blocked";
  adapter_strength_hint: "low" | "medium" | "high" | "blocked";
  reason: string;
  writes_now: false;
  would_update_current_working_perspective: false;
  would_write_existing_canonical_perspective_state: false;
  would_promote_perspective: false;
  would_write_perspective_memory: false;
  would_mutate_work: false;
  would_write_proof_or_evidence: false;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingCurrentWorkingAdapterCompatibility {
  existing_current_working_perspective_update_contract_preview_compatible: boolean;
  existing_current_working_perspective_update_contract_write_compatible: boolean;
  existing_current_working_perspective_apply_preview_compatible: boolean;
  existing_current_working_perspective_apply_write_compatible: boolean;
  existing_route_integration_contract_compatible: boolean;
  compatibility_notes: string[];
  field_gaps: string[];
  authority_gaps: string[];
  source_lineage_gaps: string[];
  missing_current_working_refs: string[];
  manual_source_refs_preserved: true;
  recommended_future_mapping_path:
    | "manual_specific_current_working_adapter_contract"
    | "existing_current_working_adapter_after_mapping"
    | "blocked";
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingCanonicalStateAdapterCompatibility {
  existing_canonical_perspective_state_writer_compatible: boolean;
  existing_canonical_perspective_state_read_model_compatible: boolean;
  existing_canonical_perspective_state_route_compatible: boolean;
  compatibility_notes: string[];
  field_gaps: string[];
  authority_gaps: string[];
  source_lineage_gaps: string[];
  missing_canonical_state_refs: string[];
  manual_source_refs_preserved: true;
  recommended_future_mapping_path:
    | "manual_specific_canonical_state_adapter_contract"
    | "existing_canonical_state_adapter_after_mapping"
    | "blocked";
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveManualAdapterWritePath {
  recommended_storage_path:
    | "manual_specific_perspective_adapter_tables"
    | "existing_writer_adapter_after_mapping"
    | "blocked";
  expected_future_write_scope:
    | "adapter_record_only"
    | "current_working_perspective_update"
    | "canonical_perspective_state_write"
    | "blocked";
  requires_explicit_future_confirmation: true;
  requires_source_revalidation: true;
  requires_idempotency: true;
  requires_duplicate_replay: true;
  requires_rollback_supersede: true;
  requires_row_count_validation: true;
  requires_no_raw_text_or_operator_note_persistence: true;
  requires_no_proof_evidence_fabrication: true;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveAdapterIdempotencyPreview {
  proposed_idempotency_key: string;
  fingerprint_algorithm: "fnv1a32_canonical_json_v0_1";
  would_prevent_duplicate_perspective_adapter_write: true;
  durable_id_allocated: false;
  writes_now: false;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveAdapterCompatibilityFinding {
  finding_code: string;
  severity: "ready" | "warning" | "blocker";
  applies_to:
    | "manual_global_dogfood_perspective_state_mutation"
    | "future_perspective_adapter"
    | "existing_current_working_perspective_adapter"
    | "existing_canonical_perspective_state_adapter"
    | "manual_specific_perspective_adapter_write_path";
  summary: string;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveAdapterNonWriteConfirmation {
  current_working_perspective_updated: false;
  existing_canonical_perspective_state_table_mutated: false;
  canonical_perspective_state_written: false;
  perspective_promoted: false;
  perspective_memory_written: false;
  perspective_state_mutation_record_mutated: false;
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

export interface ResearchCandidateManualGlobalDogfoodPerspectiveAdapterValidation {
  passed: boolean;
  contract_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json_v0_1";
  active_committed_perspective_state_mutation_receipt_present: boolean;
  active_committed_perspective_state_mutation_record_present: boolean;
  source_fingerprints_present: boolean;
  mutation_label_present: boolean;
  mutation_rationale_present: boolean;
  intended_future_mutation_target_is_canonical_perspective_state: boolean;
  mutation_scope_hint_is_canonical_perspective_state: boolean;
  explanatory_expected_observed_material_present: boolean;
  selected_candidate_context_refs_present: boolean;
  source_next_work_candidate_card_ids_present: boolean;
  manual_context_not_proof_or_evidence: boolean;
  source_readback_preserves_no_current_working_canonical_state_promotion_memory_work_proof_metric_writes: boolean;
  no_write_authority: boolean;
  blocker_count: number;
  warning_count: number;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveAdapterAuthorityBoundary {
  preview_only: true;
  read_only: true;
  source_of_truth: false;
  can_write_perspective_adapter_record: false;
  can_update_current_working_perspective: false;
  can_write_existing_canonical_perspective_state: false;
  can_promote_perspective: false;
  can_write_perspective_memory: false;
  can_mutate_perspective_state_mutation_record: false;
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

export interface ResearchCandidateManualGlobalDogfoodPerspectiveAdapterContract {
  contract_kind: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_CONTRACT_KIND;
  contract_version: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_CONTRACT_VERSION;
  scope: ResearchCandidateReviewScope;
  operator_intent_label: string;
  requested_future_write_mode: string;
  source_perspective_state_mutation_readback_ref: string;
  source_perspective_state_mutation_receipt_id: string | null;
  source_perspective_state_mutation_record_id: string | null;
  source_perspective_state_mutation_record_fingerprint: string | null;
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
  operator_authorization_mode: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterAuthorizationMode;
  proposed_adapter_mapping: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterMapping;
  proposed_adapter_candidate: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterCandidate;
  proposed_existing_current_working_adapter_compatibility: ResearchCandidateManualGlobalDogfoodPerspectiveExistingCurrentWorkingAdapterCompatibility;
  proposed_existing_canonical_state_adapter_compatibility: ResearchCandidateManualGlobalDogfoodPerspectiveExistingCanonicalStateAdapterCompatibility;
  proposed_manual_adapter_write_path: ResearchCandidateManualGlobalDogfoodPerspectiveManualAdapterWritePath;
  idempotency_contract_preview: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterIdempotencyPreview;
  compatibility_findings: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterCompatibilityFinding[];
  blocker_reasons: string[];
  warning_reasons: string[];
  required_future_authorization: string[];
  required_future_checks: string[];
  non_write_confirmation: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterNonWriteConfirmation;
  validation: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterValidation;
  authority_boundary: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterAuthorityBoundary;
  next_recommended_slice: string;
}
