// Contract-only Human-reviewed Durable Perspective Promotion v0.1 shape.
// This file defines types only. It does not implement runtime promotion,
// durable Perspective state writes, promotion decision record writes,
// proof/evidence writes, Formation Receipt writes, work mutation, DB
// reads/writes, provider/OpenAI calls, retrieval/RAG execution, source fetching,
// crawling, routes, UI, schema changes, migrations, or product writes.

export type HumanReviewedDurablePerspectivePromotionContractKind =
  "human_reviewed_durable_perspective_promotion_contract";

export type HumanReviewedDurablePerspectivePromotionContractVersion =
  "human_reviewed_durable_perspective_promotion_contract.v0.1";

export type HumanReviewedDurablePerspectivePromotionInput =
  | "perspective_delta_candidate_ref"
  | "claim_candidate_refs"
  | "evidence_candidate_refs"
  | "accepted_evidence_refs"
  | "unresolved_tension_candidate_refs"
  | "knowledge_gap_candidate_refs"
  | "source_refs"
  | "human_review_decision"
  | "reviewer_note_ref"
  | "promotion_gate_context_ref";

export type HumanReviewedPromotionDecisionKind =
  | "promote"
  | "reject"
  | "defer"
  | "supersede"
  | "request_more_evidence"
  | "split_delta"
  | "merge_with_existing"
  | "retire_candidate";

export interface HumanReviewedDurablePerspectivePromotionContractScope {
  promotion_contract_only: true;
  runtime_promotion_now: false;
  durable_perspective_state_write_now: false;
  promotion_decision_record_write_now: false;
  proof_evidence_write_now: false;
  formation_receipt_write_now: false;
  work_mutation_now: false;
  runtime_db_query_now: false;
  runtime_db_write_now: false;
  provider_openai_call_now: false;
  retrieval_rag_execution_now: false;
  source_fetch_now: false;
  crawler_now: false;
  product_write_now: false;
}

export interface HumanReviewedDurablePerspectivePromotionInputPolicy {
  explicit_human_review_required: true;
  source_refs_required: true;
  basis_claim_candidates_allowed: true;
  basis_evidence_candidates_allowed: true;
  accepted_evidence_refs_allowed: true;
  unresolved_tensions_required_or_explicitly_resolved: true;
  knowledge_gaps_required_or_explicitly_deferred: true;
  reviewer_note_ref_required: true;
  retrieval_results_allowed_as_recall_context_only: true;
  rag_context_preview_allowed_as_context_only: true;
  salience_signals_allowed_as_display_context_only: true;
  feedback_events_allowed_as_operator_context_only: true;
  raw_private_source_body_allowed: false;
  raw_provider_ids_allowed: false;
  raw_thread_run_session_ids_allowed: false;
  private_or_unstable_urls_allowed: false;
  secrets_allowed: false;
}

export interface HumanReviewedPromotionDecisionFamily {
  decision_kind: HumanReviewedPromotionDecisionKind;
  explicit_human_review_required: true;
  source_refs_required?: true;
  basis_required?: true;
  unresolved_tension_handling_required?: true;
  knowledge_gap_handling_required?: true;
  rejection_reason_required?: true;
  defer_reason_required?: true;
  follow_up_gap_or_work_candidate_allowed?: true;
  superseded_candidate_refs_required?: true;
  superseding_candidate_ref_required?: true;
  knowledge_gap_candidate_refs_required?: true;
  split_reason_required?: true;
  resulting_delta_candidate_refs_required?: true;
  existing_perspective_ref_required?: true;
  merge_reason_required?: true;
  retire_reason_required?: true;
  future_promotion_decision_record_required: true;
  future_formation_receipt_required?: true;
  runtime_write_now: false;
}

export interface HumanReviewedDurablePerspectivePromotionGatePolicy {
  explicit_human_review_required: true;
  provider_initiated_promotion_forbidden: true;
  retrieval_initiated_promotion_forbidden: true;
  rag_initiated_promotion_forbidden: true;
  agent_substrate_initiated_promotion_forbidden: true;
  codex_initiated_promotion_forbidden: true;
  github_automation_initiated_promotion_forbidden: true;
  salience_initiated_promotion_forbidden: true;
  feedback_event_initiated_promotion_forbidden: true;
  product_write_initiated_promotion_forbidden: true;
  claim_candidate_is_not_fact: true;
  evidence_candidate_is_not_accepted_evidence: true;
  accepted_evidence_ref_required_for_evidence_record_claims: true;
  unresolved_tensions_must_be_preserved_or_explicitly_resolved: true;
  knowledge_gaps_must_be_preserved_or_explicitly_deferred: true;
  retrieval_score_is_not_promotion_score: true;
  retrieval_result_is_not_evidence: true;
  rag_answer_is_not_proof_or_evidence: true;
  embedding_similarity_is_not_promotion_readiness: true;
  salience_score_is_not_promotion_authority: true;
  formation_receipt_required_later: true;
  promotion_decision_record_required_later: true;
  durable_perspective_delta_apply_required_later: true;
  no_runtime_write_in_contract_slice: true;
}

export interface HumanReviewedDurablePerspectivePromotionAuthorityBoundary {
  contract_added_now: true;
  implementation_added_now: false;
  runtime_promotion_implemented_now: false;
  durable_perspective_state_write_now: false;
  durable_perspective_delta_apply_now: false;
  promotion_decision_record_implemented_now: false;
  promotion_decision_record_write_now: false;
  proof_or_evidence_record_write_now: false;
  formation_receipt_write_now: false;
  work_mutation_now: false;
  candidate_mutation_now: false;
  candidate_record_write_now: false;
  runtime_retrieval_rag_implemented_now: false;
  runtime_index_build_implemented_now: false;
  runtime_index_write_now: false;
  embedding_generation_implemented_now: false;
  vector_db_implemented_now: false;
  fts_implemented_now: false;
  provider_openai_call_now: false;
  provider_extraction_now: false;
  source_fetch_now: false;
  crawler_now: false;
  source_index_write_now: false;
  durable_source_record_write_now: false;
  runtime_persistence_implemented_now: false;
  durable_memory_write_now: false;
  runtime_db_write_now: false;
  runtime_db_query_now: false;
  production_db_used_now: false;
  db_schema_implemented_now: false;
  route_changed_now: false;
  component_changed_now: false;
  browser_request_now: false;
  durable_salience_write_now: false;
  recent_rehearsal_buffer_written_now: false;
  feedback_events_written_now: false;
  feedback_events_mutated_now: false;
  execution_authority: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  external_handoff_authority: false;
  provider_openai_authority: false;
  retrieval_rag_authority: false;
  source_fetch_authority: false;
  salience_authority: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
  product_write_lane_parked_by_686: true;
}

export type HumanReviewedDurablePerspectivePromotionPreviewAuthorityBoundary =
  Omit<HumanReviewedDurablePerspectivePromotionAuthorityBoundary, "implementation_added_now">;

export interface HumanReviewedDurablePerspectivePromotionValidationPolicy {
  explicit_human_review_required: true;
  source_refs_required: true;
  basis_required_for_promotion: true;
  accepted_evidence_distinction_required: true;
  claim_candidate_not_fact: true;
  evidence_candidate_not_accepted_evidence: true;
  unresolved_tensions_preserved_or_resolved: true;
  knowledge_gaps_preserved_or_deferred: true;
  retrieval_result_not_authority: true;
  rag_answer_not_proof_or_evidence: true;
  retrieval_score_not_promotion_score: true;
  embedding_similarity_not_promotion_readiness: true;
  salience_score_not_promotion_authority: true;
  provider_output_not_promotion_authority: true;
  codex_github_automation_not_promotion_authority: true;
  agent_substrate_not_promotion_authority: true;
  formation_receipt_required_later: true;
  promotion_decision_record_required_later: true;
  durable_perspective_delta_apply_required_later: true;
  no_runtime_promotion_execution: true;
  no_runtime_db_write_or_query: true;
  no_schema_or_migration: true;
  no_route_or_ui: true;
  no_browser_request: true;
  no_product_write_or_ids: true;
}

export interface HumanReviewedDurablePerspectivePromotionPrivacyPolicy {
  no_secrets_in_fixture: true;
  no_private_urls: true;
  no_raw_provider_thread_run_session_ids: true;
  no_raw_source_body: true;
  public_safe_source_refs_only: true;
  public_safe_candidate_refs_only: true;
  public_safe_reviewer_note_refs_only: true;
}

export interface HumanReviewedPerspectiveDeltaCandidatePreview {
  candidate_ref: string;
  delta_type: string;
  proposed_change_summary: string;
  basis_claim_candidate_refs: string[];
  basis_evidence_candidate_refs: string[];
  accepted_evidence_refs: string[];
  unresolved_tension_candidate_refs: string[];
  knowledge_gap_candidate_refs: string[];
  source_refs: string[];
  candidate_only: true;
  not_durable_state: true;
  not_proof: true;
  not_evidence_record: true;
}

export interface HumanReviewedPromotionGateCheckPreview {
  explicit_human_review_required: true;
  source_refs_present: true;
  basis_present: true;
  accepted_evidence_distinction_preserved: true;
  unresolved_tensions_preserved_or_explicitly_resolved: true;
  knowledge_gaps_preserved_or_explicitly_deferred: true;
  retrieval_rag_context_non_authoritative: true;
  salience_context_non_authoritative: true;
  provider_context_non_authoritative: true;
  product_write_forbidden: true;
  runtime_write_now: false;
}

export interface HumanReviewedPromotionDecisionPreview {
  decision_kind: "defer";
  human_review_decision_required_later: true;
  reviewer_note_ref: string;
  decision_reason_summary: string;
  future_promotion_decision_record_required: true;
  future_formation_receipt_required: true;
  future_durable_perspective_delta_apply_required: true;
  runtime_write_now: false;
  not_durable_perspective_state: true;
  not_proof_or_evidence: true;
  not_work_status: true;
  not_product_write: true;
}

export interface HumanReviewedDurablePerspectivePromotionPreview {
  preview_version: "human_reviewed_durable_perspective_promotion_preview.v0.1";
  operator_context_ref: string;
  candidate_refs: string[];
  source_refs: string[];
  selected_perspective_delta_candidate: HumanReviewedPerspectiveDeltaCandidatePreview;
  promotion_gate_check_preview: HumanReviewedPromotionGateCheckPreview;
  promotion_decision_preview: HumanReviewedPromotionDecisionPreview;
  authority_boundary: HumanReviewedDurablePerspectivePromotionPreviewAuthorityBoundary;
  validation_policy: HumanReviewedDurablePerspectivePromotionValidationPolicy;
}

export interface HumanReviewedDurablePerspectivePromotionContract {
  contract_kind: HumanReviewedDurablePerspectivePromotionContractKind;
  contract_version: HumanReviewedDurablePerspectivePromotionContractVersion;
  source_retrieval_rag_validation_ref: string;
  source_retrieval_rag_validation_fingerprint: string;
  contract_scope: HumanReviewedDurablePerspectivePromotionContractScope;
  promotion_inputs: HumanReviewedDurablePerspectivePromotionInput[];
  input_policy: HumanReviewedDurablePerspectivePromotionInputPolicy;
  promotion_decision_families: HumanReviewedPromotionDecisionFamily[];
  promotion_gate_policy: HumanReviewedDurablePerspectivePromotionGatePolicy;
  sample_promotion_contract_preview: HumanReviewedDurablePerspectivePromotionPreview;
  authority_boundary: HumanReviewedDurablePerspectivePromotionAuthorityBoundary;
  validation_policy: HumanReviewedDurablePerspectivePromotionValidationPolicy;
  privacy_policy: HumanReviewedDurablePerspectivePromotionPrivacyPolicy;
  recommendation_status: "ready_for_human_reviewed_durable_perspective_promotion_implementation_v0_1";
  next_recommended_slice: "human_reviewed_durable_perspective_promotion_implementation_v0_1";
  contract_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
}
