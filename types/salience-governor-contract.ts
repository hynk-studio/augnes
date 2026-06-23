// Contract-only Salience Governor v0.1 shape.
// This file defines types only. It does not implement runtime salience scoring,
// durable writes, DB schema, routes, UI, browser behavior, provider calls,
// retrieval, candidate/work mutation, Perspective promotion, proof/evidence
// creation, formation receipt writes, recent rehearsal buffer writes, feedback
// writes, or product writes.

export type SalienceGovernorContractKind = "salience_governor_contract";

export type SalienceGovernorContractVersion =
  "salience_governor_contract.v0.1";

export type SalienceActionHintKind =
  | "pin"
  | "watch"
  | "defer"
  | "boost"
  | "suppress"
  | "reactivate"
  | "inspect"
  | "keep_visible"
  | "cool_down";

export type SalienceComponentKind =
  | "source_recency"
  | "user_mark"
  | "open_tension_count"
  | "evidence_strength"
  | "reuse_frequency"
  | "conflict_severity"
  | "work_relevance"
  | "promotion_readiness"
  | "manual_gravity";

export type SalienceInhibitionKind =
  | "low_provenance"
  | "repeated_unresolved_noise"
  | "superseded_by_newer_candidate"
  | "user_deferred"
  | "insufficient_evidence"
  | "scope_mismatch"
  | "stale_without_reactivation";

export type SalienceRefKind =
  | "recent_rehearsal_buffer_validation_ref"
  | "recent_rehearsal_buffer_ref"
  | "candidate_ref"
  | "open_tension_ref"
  | "failed_check_ref"
  | "user_decision_ref"
  | "feedback_event_summary_ref"
  | "formation_receipt_ref"
  | "recent_context_ref"
  | "manual_pin_ref"
  | "manual_watch_ref"
  | "manual_defer_ref"
  | "suppressed_context_ref";

export interface SalienceGovernorScope {
  working_set_priority_adapter: true;
  candidate_overload_reduction: true;
  display_priority_only: true;
  reuse_priority_only: true;
  contract_only_now: true;
  runtime_salience_scoring_implemented_now: false;
  durable_salience_write_implemented_now: false;
  db_schema_implemented_now: false;
  route_implemented_now: false;
  ui_implemented_now: false;
}

export interface SalienceReference {
  ref_id: string;
  ref_kind: SalienceRefKind;
  ref: string;
  public_safe: true;
}

export interface SalienceGovernorInputs {
  source_recent_rehearsal_buffer_ref: SalienceReference;
  candidate_refs: SalienceReference[];
  open_tension_refs: SalienceReference[];
  failed_check_refs: SalienceReference[];
  user_decision_refs: SalienceReference[];
  feedback_event_summary_refs: SalienceReference[];
  formation_receipt_refs: SalienceReference[];
  recent_context_refs: SalienceReference[];
  manual_pin_refs: SalienceReference[];
  manual_watch_refs: SalienceReference[];
  manual_defer_refs: SalienceReference[];
  suppressed_context_refs: SalienceReference[];
}

export interface SalienceComponentPreview {
  component_kind: SalienceComponentKind;
  preview_label: string;
  preview_weight: number;
  display_only: true;
  not_authority: true;
}

export interface SalienceInhibitionPreview {
  inhibition_kind: SalienceInhibitionKind;
  preview_label: string;
  preview_weight: number;
  display_only: true;
  not_authority: true;
}

export interface SalienceActionHintPolicyEntry {
  hint_kind: SalienceActionHintKind;
  hint_only: true;
  no_mutation_now: true;
  requires_later_user_action: true;
  not_execution_authority: true;
  not_promotion_authority: true;
  not_product_write: true;
}

export interface SalienceActionHintPolicy {
  allowed_hint_kinds: SalienceActionHintKind[];
  hint_policy_by_kind: Record<
    SalienceActionHintKind,
    SalienceActionHintPolicyEntry
  >;
}

export interface SaliencePriorityViewContract {
  salience_score_preview_allowed: true;
  score_range: "0_to_1";
  deterministic_fixture_only_now: true;
  runtime_score_computation_now: false;
  top_k_preview_allowed: true;
  default_top_k: 10;
  priority_view_is_display_only: true;
  priority_view_does_not_delete_or_hide_records: true;
  suppression_is_display_hint_only: true;
  reactivation_is_display_hint_only: true;
}

export interface SalienceNonAuthorityPolicy {
  not_promotion_basis: true;
  not_source_of_truth: true;
  not_proof_or_evidence: true;
  not_perspective_state: true;
  not_work_status: true;
  not_retrieval_rag_result: true;
  not_product_write: true;
  salience_score_not_authority: true;
  salience_score_not_promotion_readiness: true;
  salience_score_not_durable_approval: true;
  salience_score_not_evidence_strength: true;
  may_help_resume_work: true;
  may_help_display_priority: true;
  may_help_agent_brief_later: true;
  durable_write_requires_later_contract: true;
}

export interface SalienceAuthorityBoundary {
  contract_only: true;
  salience_governor_contract_defined_now: true;
  runtime_salience_scoring_implemented_now: false;
  durable_salience_write_implemented_now: false;
  salience_score_used_as_authority_now: false;
  db_schema_implemented_now: false;
  route_changed_now: false;
  component_changed_now: false;
  browser_request_now: false;
  runtime_db_query_now: false;
  runtime_db_write_now: false;
  production_db_used_now: false;
  durable_memory_write_now: false;
  recent_rehearsal_buffer_written_now: false;
  formation_receipt_written_now: false;
  feedback_events_written_now: false;
  feedback_events_mutated_now: false;
  candidate_mutation_now: false;
  proof_or_evidence_record: false;
  perspective_promotion: false;
  durable_perspective_state_write: false;
  promotion_decision_record: false;
  work_mutation: false;
  execution_authority: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  external_handoff_authority: false;
  provider_openai_authority: false;
  retrieval_rag_authority: false;
  source_fetch_authority: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
  product_write_lane_parked_by_686: true;
}

export interface SalienceValidationPolicy {
  static_source_validation_only: true;
  fixture_backed_only: true;
  app_server_started_now: false;
  production_db_used_now: false;
  runtime_browser_request_now: false;
  runtime_db_query_now: false;
  runtime_db_write_now: false;
  runtime_salience_scoring_now: false;
}

export interface SaliencePriorityViewCandidate {
  candidate_ref_id: string;
  salience_score_preview: number;
  action_hint_kinds: SalienceActionHintKind[];
  why_now: string;
  component_refs: SalienceComponentKind[];
  inhibition_refs: SalienceInhibitionKind[];
  display_only: true;
  not_authority: true;
}

export interface SaliencePriorityViewShape {
  priority_view_id: string;
  priority_view_version: "salience_governor_priority_view.v0.1";
  generated_at: string;
  scope: string;
  source_refs: SalienceReference[];
  top_k: 10;
  candidate_priority_preview: SaliencePriorityViewCandidate[];
  action_hint_policy_ref: string;
  priority_view_contract_ref: string;
  non_authority_policy_ref: string;
  authority_boundary: SalienceAuthorityBoundary;
  validation: SalienceValidationPolicy;
}

export interface SalienceGovernorContract {
  contract_kind: SalienceGovernorContractKind;
  contract_version: SalienceGovernorContractVersion;
  source_recent_rehearsal_buffer_validation_ref: string;
  salience_scope: SalienceGovernorScope;
  salience_inputs: SalienceGovernorInputs;
  salience_components: SalienceComponentPreview[];
  inhibition_components: SalienceInhibitionPreview[];
  action_hint_policy: SalienceActionHintPolicy;
  priority_view_contract: SaliencePriorityViewContract;
  non_authority_policy: SalienceNonAuthorityPolicy;
  sample_salience_priority_view: SaliencePriorityViewShape;
  authority_boundary: SalienceAuthorityBoundary;
  validation_policy: SalienceValidationPolicy;
  recommendation_status: "ready_for_salience_governor_implementation_v0_1";
  next_recommended_slice: "salience_governor_implementation_v0_1";
  contract_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
}
