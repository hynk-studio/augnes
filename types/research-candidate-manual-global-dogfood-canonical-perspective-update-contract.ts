import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_CONTRACT_KIND =
  "research_candidate_manual_global_dogfood_canonical_perspective_update_contract" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_CONTRACT_VERSION =
  "research_candidate_manual_global_dogfood_canonical_perspective_update_contract.v0.1" as const;

export type ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateAuthorizationMode =
  | "preview_only"
  | "ready_for_future_canonical_perspective_update_write_authorization"
  | "blocked_before_canonical_perspective_update_authorization";

export interface ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateContractInput {
  readback: unknown;
  operator_intent_label?: string;
  requested_future_write_mode?: string;
}

export interface ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateMapping {
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
  blockers: string[];
  warnings: string[];
  can_feed_canonical_perspective_update_write_candidate: boolean;
  can_write_canonical_perspective_now: false;
  can_promote_perspective_now: false;
  can_write_perspective_memory_now: false;
  can_mutate_work_now: false;
  can_write_proof_or_evidence_now: false;
  can_write_next_work_bias_now: false;
  can_write_relay_now: false;
}

export interface ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateCandidate {
  candidate_kind: "manual_global_dogfood_canonical_perspective_update_candidate";
  candidate_status:
    | "ready_for_future_canonical_perspective_update_write_authorization"
    | "blocked_before_canonical_perspective_update_authorization";
  update_scope_hint:
    | "current_working_perspective"
    | "canonical_perspective_state"
    | "workbench_loop_spine"
    | "blocked";
  update_strength_hint: "low" | "medium" | "high" | "blocked";
  reason: string;
  writes_now: false;
  would_write_canonical_perspective_state: false;
  would_promote_perspective: false;
  would_write_perspective_memory: false;
  would_mutate_work: false;
  would_write_proof_or_evidence: false;
}

export interface ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateExistingCompatibility {
  existing_current_working_perspective_update_contract_compatible: boolean;
  existing_current_working_perspective_apply_write_compatible: boolean;
  existing_route_integration_contract_compatible: boolean;
  compatibility_notes: string[];
  field_gaps: string[];
  authority_gaps: string[];
  manual_source_refs_preserved: true;
}

export interface ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateIdempotencyPreview {
  proposed_idempotency_key: string;
  fingerprint_algorithm: "fnv1a32_canonical_json_v0_1";
  would_prevent_duplicate_canonical_perspective_update_write: true;
  durable_id_allocated: false;
  writes_now: false;
}

export interface ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateCompatibilityFinding {
  finding_code: string;
  severity: "ready" | "warning" | "blocker";
  applies_to:
    | "manual_global_dogfood_perspective_relay"
    | "future_canonical_perspective_update"
    | "existing_current_working_perspective_update_path";
  summary: string;
}

export interface ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateNonWriteConfirmation {
  canonical_perspective_state_written: false;
  current_working_perspective_updated: false;
  perspective_promoted: false;
  perspective_memory_written: false;
  perspective_relay_written: false;
  perspective_relay_mutated: false;
  next_work_bias_written: false;
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

export interface ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateValidation {
  passed: boolean;
  contract_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json_v0_1";
  active_committed_perspective_relay_receipt_present: boolean;
  active_committed_perspective_relay_record_present: boolean;
  source_fingerprints_present: boolean;
  relay_update_label_present: boolean;
  relay_update_rationale_present: boolean;
  explanatory_expected_observed_material_present: boolean;
  selected_candidate_context_refs_present: boolean;
  source_next_work_candidate_card_ids_present: boolean;
  manual_context_not_proof_or_evidence: boolean;
  source_readback_preserves_no_canonical_perspective_work_memory_proof_metric_writes: boolean;
  no_write_authority: boolean;
  blocker_count: number;
  warning_count: number;
}

export interface ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateAuthorityBoundary {
  preview_only: true;
  read_only: true;
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
}

export interface ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateContract {
  contract_kind: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_CONTRACT_KIND;
  contract_version: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_CONTRACT_VERSION;
  scope: ResearchCandidateReviewScope;
  operator_intent_label: string;
  requested_future_write_mode: string;
  source_perspective_relay_readback_ref: string;
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
  operator_authorization_mode: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateAuthorizationMode;
  proposed_canonical_perspective_update_mapping: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateMapping;
  proposed_perspective_update_candidate: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateCandidate;
  proposed_existing_perspective_update_compatibility: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateExistingCompatibility;
  idempotency_contract_preview: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateIdempotencyPreview;
  compatibility_findings: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateCompatibilityFinding[];
  blocker_reasons: string[];
  warning_reasons: string[];
  required_future_authorization: string[];
  required_future_checks: string[];
  non_write_confirmation: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateNonWriteConfirmation;
  validation: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateValidation;
  authority_boundary: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateAuthorityBoundary;
  next_recommended_slice: string;
}
