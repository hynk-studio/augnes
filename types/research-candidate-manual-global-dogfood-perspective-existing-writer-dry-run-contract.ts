import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_CONTRACT_KIND =
  "research_candidate_manual_global_dogfood_perspective_existing_writer_dry_run_contract" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_CONTRACT_VERSION =
  "research_candidate_manual_global_dogfood_perspective_existing_writer_dry_run_contract.v0.1" as const;

export type ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunAuthorizationMode =
  | "preview_only"
  | "ready_for_future_existing_writer_dry_run_adapter_write_authorization"
  | "blocked_before_existing_writer_dry_run_adapter_authorization";

export type ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunTarget =
  | "manual_specific_existing_canonical_state_writer_dry_run_adapter"
  | "manual_specific_current_working_writer_dry_run_adapter"
  | "existing_current_working_perspective_writer_dry_run"
  | "existing_canonical_perspective_state_writer_dry_run"
  | "blocked";

export type ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunDefaultTarget =
  | "manual_specific_existing_canonical_state_writer_dry_run_adapter"
  | "manual_specific_current_working_writer_dry_run_adapter"
  | "blocked";

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContractInput {
  readback: unknown;
  operator_intent_label?: string;
  requested_future_write_mode?: string;
  intended_future_dry_run_target?: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunTarget;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunMapping {
  dry_run_label: string | null;
  dry_run_rationale: string | null;
  writer_compatibility_label: string | null;
  writer_compatibility_rationale: string | null;
  state_application_label: string | null;
  state_application_rationale: string | null;
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
  intended_future_dry_run_target: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunTarget;
  default_future_dry_run_target: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunDefaultTarget;
  can_feed_future_existing_writer_dry_run_write_candidate: boolean;
  can_call_existing_current_working_writer_now: false;
  can_call_existing_canonical_state_writer_now: false;
  can_run_existing_writer_dry_run_now: false;
  can_update_current_working_perspective_now: false;
  can_mutate_existing_canonical_perspective_state_now: false;
  can_promote_perspective_now: false;
  can_write_perspective_memory_now: false;
  can_mutate_work_now: false;
  can_write_proof_or_evidence_now: false;
  can_mutate_source_records_now: false;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunCandidate {
  candidate_kind: "manual_global_dogfood_perspective_existing_writer_dry_run_candidate";
  candidate_status:
    | "ready_for_future_existing_writer_dry_run_adapter_write_authorization"
    | "blocked_before_existing_writer_dry_run_adapter_authorization";
  dry_run_scope_hint:
    | "manual_specific_existing_canonical_state_writer_dry_run_adapter"
    | "manual_specific_current_working_writer_dry_run_adapter"
    | "blocked";
  dry_run_strength_hint: "low" | "medium" | "high" | "blocked";
  reason: string;
  writes_now: false;
  would_call_existing_current_working_writer: false;
  would_call_existing_canonical_state_writer: false;
  would_run_existing_writer_dry_run: false;
  would_update_current_working_perspective: false;
  would_mutate_existing_canonical_perspective_state: false;
  would_promote_perspective: false;
  would_write_perspective_memory: false;
  would_mutate_work: false;
  would_write_proof_or_evidence: false;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingCurrentWorkingWriterDryRunCompatibility {
  existing_current_working_perspective_update_contract_preview_compatible: boolean;
  existing_current_working_perspective_update_contract_write_compatible: boolean;
  existing_current_working_perspective_apply_preview_compatible: boolean;
  existing_current_working_perspective_apply_write_compatible: boolean;
  existing_route_integration_contract_compatible: boolean;
  dry_run_entrypoint_detected: boolean;
  existing_writer_entrypoints: string[];
  dry_run_entrypoints: string[];
  required_input_fields: string[];
  available_manual_source_fields: string[];
  dry_run_required_fields: string[];
  dry_run_missing_fields: string[];
  compatibility_notes: string[];
  field_gaps: string[];
  authority_gaps: string[];
  source_lineage_gaps: string[];
  dry_run_gaps: string[];
  missing_current_working_refs: string[];
  missing_patch_or_apply_material: string[];
  missing_proof_or_evidence_refs: string[];
  missing_work_refs: string[];
  missing_memory_refs: string[];
  manual_source_refs_preserved: true;
  recommended_future_mapping_path:
    | "manual_specific_current_working_writer_dry_run_adapter_contract"
    | "existing_current_working_writer_dry_run_after_mapping"
    | "blocked";
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingCanonicalStateWriterDryRunCompatibility {
  existing_canonical_perspective_state_writer_compatible: boolean;
  existing_canonical_perspective_state_read_model_compatible: boolean;
  existing_canonical_perspective_state_route_compatible: boolean;
  dry_run_entrypoint_detected: boolean;
  existing_writer_entrypoints: string[];
  dry_run_entrypoints: string[];
  existing_state_tables_detected: string[];
  required_input_fields: string[];
  available_manual_source_fields: string[];
  dry_run_required_fields: string[];
  dry_run_missing_fields: string[];
  compatibility_notes: string[];
  field_gaps: string[];
  authority_gaps: string[];
  source_lineage_gaps: string[];
  dry_run_gaps: string[];
  missing_canonical_state_refs: string[];
  missing_structured_state_material: string[];
  missing_claim_evidence_tension_gap_refs: string[];
  missing_proof_or_evidence_refs: string[];
  missing_work_refs: string[];
  missing_memory_refs: string[];
  manual_source_refs_preserved: true;
  recommended_future_mapping_path:
    | "manual_specific_existing_canonical_state_writer_dry_run_adapter_contract"
    | "existing_canonical_state_writer_dry_run_after_mapping"
    | "blocked";
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveManualExistingWriterAdapterPath {
  recommended_storage_path:
    | "manual_specific_perspective_existing_writer_dry_run_adapter_tables"
    | "existing_writer_dry_run_after_mapping"
    | "blocked";
  expected_future_write_scope:
    | "existing_writer_dry_run_adapter_record_only"
    | "existing_writer_dry_run_invocation"
    | "current_working_perspective_update"
    | "existing_canonical_perspective_state_write"
    | "blocked";
  requires_explicit_future_confirmation: true;
  requires_source_revalidation: true;
  requires_idempotency: true;
  requires_duplicate_replay: true;
  requires_rollback_supersede: true;
  requires_row_count_validation: true;
  requires_no_raw_text_or_operator_note_persistence: true;
  requires_no_proof_evidence_fabrication: true;
  requires_existing_state_writer_compatibility_review: true;
  requires_manual_source_chain_binding: true;
  requires_existing_writer_dry_run_contract: true;
  requires_existing_writer_dry_run_result_readback: true;
  requires_existing_writer_non_mutation_proof: true;
  requires_current_working_or_canonical_state_ref_mapping: true;
  requires_strict_dry_run_side_effect_boundary: true;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunInputContract {
  dry_run_input_contract_kind: "manual_global_dogfood_perspective_existing_writer_dry_run_input_contract";
  dry_run_input_contract_version: "manual_global_dogfood_perspective_existing_writer_dry_run_input_contract.v0.1";
  can_construct_existing_current_working_writer_input_now: boolean;
  can_construct_existing_canonical_state_writer_input_now: boolean;
  would_require_manual_adapter_record: true;
  would_require_existing_writer_dry_run_route: true;
  would_require_no_mutation_enforcement: true;
  would_require_row_count_before_after_snapshot: true;
  would_require_source_chain_binding: true;
  would_require_current_working_refs: string[];
  would_require_canonical_state_refs: string[];
  would_require_proof_or_evidence_refs: string[];
  would_require_work_refs: string[];
  would_require_memory_refs: string[];
  available_manual_fields: string[];
  missing_fields_for_existing_current_working_writer: string[];
  missing_fields_for_existing_canonical_state_writer: string[];
  proposed_adapter_field_mapping: string[];
  non_fabrication_rules: string[];
  dry_run_side_effect_forbidden_flags: string[];
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunIdempotencyPreview {
  proposed_idempotency_key: string;
  fingerprint_algorithm: "fnv1a32_canonical_json_v0_1";
  would_prevent_duplicate_existing_writer_dry_run_adapter_write: true;
  durable_id_allocated: false;
  writes_now: false;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunFinding {
  finding_code: string;
  severity: "ready" | "warning" | "blocker";
  applies_to:
    | "manual_global_dogfood_perspective_writer_compatibility"
    | "future_existing_writer_dry_run_adapter"
    | "existing_current_working_perspective_writer_dry_run"
    | "existing_canonical_perspective_state_writer_dry_run"
    | "manual_specific_perspective_existing_writer_dry_run_adapter_path";
  summary: string;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunNonWriteConfirmation {
  existing_writer_dry_run_executed: false;
  existing_current_working_writer_called: false;
  existing_canonical_state_writer_called: false;
  current_working_perspective_updated: false;
  existing_canonical_perspective_state_table_mutated: false;
  canonical_perspective_state_written: false;
  perspective_promoted: false;
  perspective_memory_written: false;
  perspective_writer_compatibility_record_mutated: false;
  perspective_state_application_record_mutated: false;
  perspective_adapter_record_mutated: false;
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
  dry_run_api_route_added: false;
  db_schema_or_migration_added: false;
  provider_openai_called: false;
  github_called: false;
  codex_executed: false;
  sources_fetched: false;
  retrieval_rag_embeddings_vector_fts_or_crawler_run: false;
  operator_note_persisted: false;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunValidation {
  passed: boolean;
  contract_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json_v0_1";
  active_committed_perspective_writer_compatibility_receipt_present: boolean;
  active_committed_perspective_writer_compatibility_record_present: boolean;
  source_fingerprints_present: boolean;
  writer_compatibility_label_present: boolean;
  writer_compatibility_rationale_present: boolean;
  writer_compatibility_storage_path_is_manual_specific: boolean;
  writer_compatibility_expected_future_write_scope_is_record_only: boolean;
  writer_compatibility_target_remains_manual_specific: boolean;
  explanatory_expected_observed_material_present: boolean;
  selected_candidate_context_refs_present: boolean;
  source_next_work_candidate_card_ids_present: boolean;
  source_handoff_seed_fingerprint_present: boolean;
  source_result_text_fingerprint_present: boolean;
  manual_context_not_proof_or_evidence: boolean;
  existing_current_working_writer_dry_run_compatible: boolean;
  existing_canonical_state_writer_dry_run_compatible: boolean;
  source_readback_preserves_no_existing_writer_dry_run_current_working_canonical_state_promotion_memory_work_proof_metric_writes: boolean;
  no_write_authority: boolean;
  no_dry_run_authority: boolean;
  blocker_count: number;
  warning_count: number;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunAuthorityBoundary {
  preview_only: true;
  read_only: true;
  source_of_truth: false;
  can_write_existing_writer_dry_run_adapter_record: false;
  can_run_existing_writer_dry_run: false;
  can_call_existing_current_working_writer: false;
  can_call_existing_canonical_state_writer: false;
  can_update_current_working_perspective: false;
  can_mutate_existing_canonical_perspective_state: false;
  can_write_existing_canonical_perspective_state: false;
  can_promote_perspective: false;
  can_write_perspective_memory: false;
  can_mutate_perspective_writer_compatibility_record: false;
  can_mutate_perspective_state_application_record: false;
  can_mutate_perspective_adapter_record: false;
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

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract {
  contract_kind: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_CONTRACT_KIND;
  contract_version: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_CONTRACT_VERSION;
  scope: ResearchCandidateReviewScope;
  operator_intent_label: string;
  requested_future_write_mode: string;
  source_perspective_writer_compatibility_readback_ref: string;
  source_perspective_writer_compatibility_receipt_id: string | null;
  source_perspective_writer_compatibility_record_id: string | null;
  source_perspective_writer_compatibility_record_fingerprint: string | null;
  source_perspective_state_application_receipt_id: string | null;
  source_perspective_state_application_record_id: string | null;
  source_perspective_state_application_record_fingerprint: string | null;
  source_perspective_adapter_receipt_id: string | null;
  source_perspective_adapter_record_id: string | null;
  source_perspective_adapter_record_fingerprint: string | null;
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
  operator_authorization_mode: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunAuthorizationMode;
  proposed_existing_writer_dry_run_mapping: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunMapping;
  proposed_existing_writer_dry_run_candidate: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunCandidate;
  existing_current_working_writer_dry_run_compatibility: ResearchCandidateManualGlobalDogfoodPerspectiveExistingCurrentWorkingWriterDryRunCompatibility;
  existing_canonical_state_writer_dry_run_compatibility: ResearchCandidateManualGlobalDogfoodPerspectiveExistingCanonicalStateWriterDryRunCompatibility;
  proposed_manual_existing_writer_adapter_path: ResearchCandidateManualGlobalDogfoodPerspectiveManualExistingWriterAdapterPath;
  proposed_dry_run_input_contract: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunInputContract;
  idempotency_contract_preview: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunIdempotencyPreview;
  compatibility_findings: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunFinding[];
  blocker_reasons: string[];
  warning_reasons: string[];
  required_future_authorization: string[];
  required_future_checks: string[];
  non_write_confirmation: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunNonWriteConfirmation;
  validation: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunValidation;
  authority_boundary: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunAuthorityBoundary;
  next_recommended_slice: string;
}
