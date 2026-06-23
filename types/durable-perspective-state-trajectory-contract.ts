// Contract-only Durable Perspective State / Trajectory v0.1 shape.
// This file defines types only. It does not implement runtime state reads or
// writes, Perspective delta apply, PerspectiveSnapshot runtime, trajectory
// runtime build, proof/evidence writes, accepted evidence writes, Formation
// Receipt writes, work mutation, DB reads/writes, provider/OpenAI calls,
// retrieval/RAG execution, source fetching, crawling, routes, UI, schema
// changes, migrations, or product writes.

export type DurablePerspectiveStateTrajectoryContractKind =
  "durable_perspective_state_trajectory_contract";

export type DurablePerspectiveStateTrajectoryContractVersion =
  "durable_perspective_state_trajectory_contract.v0.1";

export type DurablePerspectiveStateField =
  | "perspective_id"
  | "current_thesis"
  | "prior_theses"
  | "active_claims"
  | "supporting_evidence_refs"
  | "contradicting_evidence_refs"
  | "open_tensions"
  | "knowledge_gaps"
  | "salience_state"
  | "promotion_history"
  | "retirement_history"
  | "reuse_conditions";

export type DurablePerspectiveTrajectoryEventKind =
  | "initial_perspective_state"
  | "thesis_refined"
  | "claim_added"
  | "claim_retired"
  | "tension_preserved"
  | "tension_resolved"
  | "knowledge_gap_deferred"
  | "knowledge_gap_closed"
  | "salience_reweighted"
  | "reuse_condition_updated";

export interface DurablePerspectiveStateTrajectoryContractScope {
  durable_perspective_state_contract_only: true;
  runtime_state_write_now: false;
  runtime_state_read_now: false;
  durable_perspective_delta_apply_now: false;
  perspective_snapshot_runtime_now: false;
  trajectory_runtime_build_now: false;
  promotion_history_write_now: false;
  retirement_history_write_now: false;
  proof_evidence_write_now: false;
  accepted_evidence_write_now: false;
  formation_receipt_write_now: false;
  work_mutation_now: false;
  runtime_db_query_now: false;
  runtime_db_write_now: false;
  schema_migration_now: false;
  route_ui_now: false;
  provider_openai_call_now: false;
  retrieval_rag_execution_now: false;
  source_fetch_now: false;
  crawler_now: false;
  product_write_now: false;
}

export interface DurablePerspectiveTrajectoryEventFamily {
  event_kind: DurablePerspectiveTrajectoryEventKind;
  lineage_required?: true;
  source_refs_required?: true;
  promotion_record_ref_required?: true;
  prior_thesis_ref_required?: true;
  next_thesis_ref_required?: true;
  retired_claim_refs_allowed?: true;
  contradicted_evidence_refs_preserved?: true;
  active_claim_ref_required?: true;
  supporting_or_contradicting_evidence_refs_required?: true;
  retired_claim_ref_required?: true;
  retirement_reason_required?: true;
  retirement_history_required?: true;
  prior_claim_remains_auditable?: true;
  open_tension_ref_required?: true;
  tension_reason_required?: true;
  prior_tension_ref_required?: true;
  resolution_reason_required?: true;
  knowledge_gap_ref_required?: true;
  defer_reason_required?: true;
  accepted_evidence_ref_required?: true;
  salience_state_ref_required?: true;
  salience_is_display_context_only?: true;
  salience_not_authority?: true;
  reuse_condition_ref_required?: true;
  prior_condition_ref_required?: true;
  runtime_write_now: false;
}

export interface DurablePerspectiveLineagePolicy {
  current_thesis_has_lineage: true;
  prior_thesis_not_overwritten_silently: true;
  prior_theses_preserved: true;
  retired_claims_remain_auditable: true;
  contradicted_evidence_not_deleted: true;
  open_tensions_preserved_or_explicitly_resolved: true;
  knowledge_gaps_preserved_or_explicitly_deferred_or_closed: true;
  promotion_history_append_only_later: true;
  retirement_history_append_only_later: true;
  trajectory_events_source_ref_backed: true;
  trajectory_events_promotion_record_ref_backed_later: true;
}

export interface DurablePerspectiveEvidencePolicy {
  supporting_evidence_refs_required_for_supported_claims: true;
  contradicting_evidence_refs_preserved: true;
  candidate_evidence_is_not_accepted_evidence: true;
  accepted_evidence_refs_required_for_accepted_evidence_claims: true;
  evidence_refs_are_refs_not_raw_body: true;
  proof_evidence_write_not_implemented_now: true;
  accepted_evidence_write_not_implemented_now: true;
}

export interface DurablePerspectiveSnapshotPolicy {
  perspective_snapshot_shape_defined: true;
  perspective_snapshot_runtime_now: false;
  snapshot_is_derived_view: true;
  snapshot_not_source_of_truth_independent_of_state: true;
  snapshot_must_include_lineage_refs: true;
  snapshot_must_include_open_tensions_and_knowledge_gaps: true;
  snapshot_must_include_authority_boundary: true;
}

export interface DurablePerspectiveSaliencePolicy {
  salience_state_allowed_as_display_context: true;
  salience_state_not_truth: true;
  salience_state_not_promotion_authority: true;
  salience_state_not_evidence_strength: true;
  durable_salience_write_now: false;
}

export interface DurablePerspectiveStateTrajectoryAuthorityBoundary {
  contract_added_now: true;
  implementation_added_now: false;
  runtime_state_write_implemented_now: false;
  runtime_state_read_implemented_now: false;
  durable_perspective_state_write_now: false;
  durable_perspective_delta_apply_now: false;
  perspective_snapshot_runtime_implemented_now: false;
  trajectory_runtime_build_implemented_now: false;
  promotion_history_write_now: false;
  retirement_history_write_now: false;
  proof_or_evidence_record_write_now: false;
  accepted_evidence_write_now: false;
  formation_receipt_write_now: false;
  work_mutation_now: false;
  candidate_mutation_now: false;
  candidate_record_write_now: false;
  runtime_promotion_implemented_now: false;
  promotion_decision_record_implemented_now: false;
  promotion_decision_record_write_now: false;
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

export type DurablePerspectiveStateTrajectoryPreviewAuthorityBoundary = Omit<
  DurablePerspectiveStateTrajectoryAuthorityBoundary,
  "implementation_added_now"
>;

export interface DurablePerspectiveStateTrajectoryValidationPolicy {
  current_thesis_has_lineage: true;
  prior_thesis_not_overwritten_silently: true;
  prior_theses_preserved: true;
  retired_claims_remain_auditable: true;
  contradicted_evidence_not_deleted: true;
  open_tensions_preserved_or_explicitly_resolved: true;
  knowledge_gaps_preserved_or_explicitly_deferred_or_closed: true;
  supporting_and_contradicting_evidence_refs_distinct: true;
  candidate_evidence_not_accepted_evidence: true;
  accepted_evidence_refs_required_for_accepted_evidence_claims: true;
  trajectory_events_source_ref_backed: true;
  trajectory_events_promotion_record_ref_backed_later: true;
  trajectory_events_runtime_write_now_false: true;
  promotion_history_append_only_later: true;
  retirement_history_append_only_later: true;
  perspective_snapshot_shape_defined: true;
  perspective_snapshot_runtime_now_false: true;
  snapshot_is_derived_view: true;
  snapshot_not_independent_source_of_truth: true;
  snapshot_includes_lineage_refs: true;
  snapshot_includes_open_tensions_and_knowledge_gaps: true;
  salience_state_not_authority: true;
  no_runtime_state_read_or_write: true;
  no_durable_perspective_delta_apply: true;
  no_proof_or_evidence_write: true;
  no_accepted_evidence_write: true;
  no_formation_receipt_write: true;
  no_work_mutation: true;
  no_runtime_db_write_or_query: true;
  no_schema_or_migration: true;
  no_route_or_ui: true;
  no_browser_request: true;
  no_provider_openai_call: true;
  no_retrieval_rag_execution: true;
  no_product_write_or_ids: true;
}

export interface DurablePerspectiveStateTrajectoryPrivacyPolicy {
  no_secrets_in_fixture: true;
  no_private_urls: true;
  no_raw_provider_thread_run_session_ids: true;
  no_raw_source_body: true;
  public_safe_perspective_refs_only: true;
  public_safe_thesis_refs_only: true;
  public_safe_claim_refs_only: true;
  public_safe_evidence_refs_only: true;
  public_safe_tension_refs_only: true;
  public_safe_knowledge_gap_refs_only: true;
  public_safe_promotion_record_refs_only: true;
  public_safe_retirement_record_refs_only: true;
  public_safe_reuse_condition_refs_only: true;
}

export interface DurablePerspectiveThesisPreview {
  thesis_ref: string;
  summary: string;
  lineage_refs: string[];
  promotion_record_refs?: string[];
  source_refs?: string[];
  not_written_now?: true;
  retired_or_superseded_by_ref?: string;
  preserved_for_audit?: true;
  not_deleted?: true;
}

export interface DurablePerspectiveClaimPreview {
  claim_ref: string;
  summary: string;
  supporting_evidence_refs: string[];
  contradicting_evidence_refs: string[];
  source_refs: string[];
  claim_is_durable_state_preview_only: true;
  not_written_now: true;
}

export interface DurablePerspectiveTensionPreview {
  tension_ref: string;
  summary: string;
  source_refs: string[];
  preserved: true;
}

export interface DurablePerspectiveKnowledgeGapPreview {
  knowledge_gap_ref: string;
  summary: string;
  source_refs: string[];
  deferred_or_open: true;
}

export interface DurablePerspectiveSalienceStatePreview {
  salience_state_ref: string;
  display_context_only: true;
  not_authority: true;
  not_written_now: true;
}

export interface DurablePerspectivePromotionHistoryPreview {
  promotion_record_ref: string;
  decision_kind: string;
  source_refs: string[];
  append_only_later: true;
  not_written_now: true;
}

export interface DurablePerspectiveRetirementHistoryPreview {
  retirement_record_ref: string;
  retired_claim_ref: string;
  reason_summary: string;
  append_only_later: true;
  not_written_now: true;
}

export interface DurablePerspectiveReuseConditionPreview {
  reuse_condition_ref: string;
  condition_summary: string;
  lineage_refs: string[];
  not_written_now: true;
}

export interface DurablePerspectiveStatePreview {
  perspective_id: string;
  current_thesis: DurablePerspectiveThesisPreview;
  prior_theses: DurablePerspectiveThesisPreview[];
  active_claims: DurablePerspectiveClaimPreview[];
  supporting_evidence_refs: string[];
  contradicting_evidence_refs: string[];
  open_tensions: DurablePerspectiveTensionPreview[];
  knowledge_gaps: DurablePerspectiveKnowledgeGapPreview[];
  salience_state: DurablePerspectiveSalienceStatePreview;
  promotion_history: DurablePerspectivePromotionHistoryPreview[];
  retirement_history: DurablePerspectiveRetirementHistoryPreview[];
  reuse_conditions: DurablePerspectiveReuseConditionPreview[];
}

export interface DurablePerspectiveTrajectoryEventPreview {
  event_kind: DurablePerspectiveTrajectoryEventKind;
  event_ref: string;
  source_refs: string[];
  promotion_record_refs?: string[];
  lineage_refs: string[];
  runtime_write_now: false;
  public_safe: true;
}

export interface DurablePerspectiveTrajectoryPreview {
  trajectory_version: "durable_perspective_trajectory_preview.v0.1";
  trajectory_events: DurablePerspectiveTrajectoryEventPreview[];
  all_events_public_safe: true;
  all_events_runtime_write_now_false: true;
  all_events_source_ref_backed: true;
  all_events_preserve_lineage: true;
}

export interface PerspectiveSnapshotPreview {
  snapshot_version: "perspective_snapshot_preview.v0.1";
  snapshot_is_derived_view: true;
  snapshot_runtime_now: false;
  includes_lineage_refs: true;
  includes_current_thesis: true;
  includes_prior_theses: true;
  includes_active_claims: true;
  includes_supporting_and_contradicting_evidence_refs: true;
  includes_open_tensions: true;
  includes_knowledge_gaps: true;
  includes_authority_boundary: true;
}

export interface DurablePerspectiveStateTrajectoryPreview {
  preview_version: "durable_perspective_state_trajectory_preview.v0.1";
  operator_context_ref: string;
  perspective_state_preview: DurablePerspectiveStatePreview;
  trajectory_preview: DurablePerspectiveTrajectoryPreview;
  perspective_snapshot_preview: PerspectiveSnapshotPreview;
  authority_boundary: DurablePerspectiveStateTrajectoryPreviewAuthorityBoundary;
  validation_policy: DurablePerspectiveStateTrajectoryValidationPolicy;
}

export interface DurablePerspectiveStateTrajectoryContract {
  contract_kind: DurablePerspectiveStateTrajectoryContractKind;
  contract_version: DurablePerspectiveStateTrajectoryContractVersion;
  source_promotion_validation_ref: string;
  source_promotion_validation_fingerprint: string;
  contract_scope: DurablePerspectiveStateTrajectoryContractScope;
  state_fields: DurablePerspectiveStateField[];
  trajectory_event_families: DurablePerspectiveTrajectoryEventFamily[];
  lineage_policy: DurablePerspectiveLineagePolicy;
  evidence_policy: DurablePerspectiveEvidencePolicy;
  snapshot_policy: DurablePerspectiveSnapshotPolicy;
  salience_policy: DurablePerspectiveSaliencePolicy;
  sample_durable_perspective_state_preview: DurablePerspectiveStateTrajectoryPreview;
  authority_boundary: DurablePerspectiveStateTrajectoryAuthorityBoundary;
  validation_policy: DurablePerspectiveStateTrajectoryValidationPolicy;
  privacy_policy: DurablePerspectiveStateTrajectoryPrivacyPolicy;
  recommendation_status: "ready_for_durable_perspective_state_trajectory_implementation_v0_1";
  next_recommended_slice: "durable_perspective_state_trajectory_implementation_v0_1";
  contract_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
}
