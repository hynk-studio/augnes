// Contract-only Recent Rehearsal Buffer v0.1 shape.
// This file defines types only. It does not implement runtime persistence,
// durable memory writes, DB schema, routes, UI, browser behavior, provider
// calls, retrieval, salience authority, Perspective promotion, work mutation,
// proof/evidence creation, formation receipt writes, feedback writes, or
// product writes.

export type RecentRehearsalBufferContractKind =
  "recent_rehearsal_buffer_contract";

export type RecentRehearsalBufferContractVersion =
  "recent_rehearsal_buffer_contract.v0.1";

export type RecentRehearsalBufferVersion =
  "recent_rehearsal_buffer.v0.1";

export type RecentRehearsalDecayState =
  | "fresh"
  | "warm"
  | "cool"
  | "archive";

export type RecentRehearsalRefKind =
  | "formation_receipt_validation_ref"
  | "formation_receipt_ref"
  | "research_question_ref"
  | "perspective_key_ref"
  | "candidate_review_surface_ref"
  | "open_tension_ref"
  | "failed_check_ref"
  | "codex_result_status_ref"
  | "user_decision_ref"
  | "follow_up_work_candidate_ref"
  | "recent_context_ref"
  | "excluded_context_ref"
  | "reason_for_exclusion_ref";

export interface RecentRehearsalBufferScope {
  recent_work_resume_adapter: true;
  compact_context_only: true;
  non_durable_now: true;
  contract_only_now: true;
  runtime_buffer_implemented_now: false;
  durable_memory_write_implemented_now: false;
  db_schema_implemented_now: false;
  route_implemented_now: false;
  ui_implemented_now: false;
}

export interface RecentRehearsalSourceRef {
  ref_id: string;
  ref_kind: RecentRehearsalRefKind;
  ref: string;
  public_safe: true;
}

export interface RecentRehearsalContextRef {
  context_ref_id: string;
  context_kind: string;
  source_refs: string[];
  reason?: string;
}

export interface RecentRehearsalFailedCheck {
  check_id: string;
  check_kind: string;
  check_status: "failed" | "blocked" | "warning";
  summary: string;
  source_refs: string[];
}

export interface RecentRehearsalUserDecision {
  decision_id: string;
  decision_kind: string;
  summary: string;
  source_refs: string[];
}

export interface RecentRehearsalBufferInputs {
  source_formation_receipt_ref: RecentRehearsalSourceRef;
  last_active_research_question: string;
  last_active_perspective_key?: string;
  last_candidate_review_surface_id?: string;
  last_formation_receipt_ref?: RecentRehearsalSourceRef;
  last_open_tension_ids: string[];
  last_failed_check?: RecentRehearsalFailedCheck;
  last_codex_result_status?: string;
  last_user_decision?: RecentRehearsalUserDecision;
  last_follow_up_work_candidate_id?: string;
  recent_context_refs: RecentRehearsalContextRef[];
  excluded_context_refs: RecentRehearsalContextRef[];
  reason_for_exclusion_refs: RecentRehearsalSourceRef[];
}

export interface RecentRehearsalBufferFieldContract {
  recent_rehearsal_buffer_id: "required_public_safe_id";
  buffer_version: RecentRehearsalBufferVersion;
  generated_at: "required_iso8601_timestamp";
  scope: "required_scope";
  source_refs: "required_reference_array";
  last_active_research_question: "required_public_safe_summary";
  last_active_perspective_key: "optional_public_safe_key";
  last_candidate_review_surface_id: "optional_public_safe_id";
  last_formation_receipt_ref: "optional_reference";
  last_open_tension_ids: "required_reference_array";
  last_failed_check: "optional_failed_check_summary";
  last_codex_result_status: "optional_status_summary";
  last_user_decision: "optional_user_decision_summary";
  last_follow_up_work_candidate_id: "optional_public_safe_id";
  recent_context_refs: "required_reference_array";
  excluded_context_refs: "required_reference_array";
  decay_state: "required_decay_state";
  decay_policy_ref: "required_decay_policy_ref";
  authority_boundary: "required_authority_boundary";
  validation: "required_validation_summary";
}

export interface RecentRehearsalDecayPolicy {
  allowed_decay_states: RecentRehearsalDecayState[];
  fresh_window: "0-24h";
  warm_window: "1-7d";
  cool_window: "7-30d";
  archive_window: "30d+";
  decay_is_display_context_only: true;
  decay_does_not_delete_records: true;
  decay_does_not_mutate_work: true;
  decay_does_not_decide_promotion: true;
  pin_or_watch_may_delay_decay_later: true;
  pin_or_watch_not_implemented_now: true;
}

export interface RecentRehearsalNonDurablePolicy {
  non_durable: true;
  not_promotion_basis: true;
  not_source_of_truth: true;
  not_proof_or_evidence: true;
  not_perspective_state: true;
  not_work_status: true;
  not_salience_authority: true;
  not_retrieval_rag_result: true;
  not_product_write: true;
  may_help_resume_work: true;
  may_prepare_agent_brief_later: true;
  durable_write_requires_later_contract: true;
}

export interface RecentRehearsalAuthorityBoundary {
  contract_only: true;
  recent_rehearsal_buffer_contract_defined_now: true;
  runtime_buffer_implemented_now: false;
  durable_memory_write_implemented_now: false;
  db_schema_implemented_now: false;
  route_changed_now: false;
  component_changed_now: false;
  browser_request_now: false;
  runtime_db_query_now: false;
  runtime_db_write_now: false;
  production_db_used_now: false;
  formation_receipt_written_now: false;
  feedback_events_written_now: false;
  feedback_events_mutated_now: false;
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
  salience_authority: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
  product_write_lane_parked_by_686: true;
}

export interface RecentRehearsalValidationPolicy {
  static_source_validation_only: true;
  fixture_backed_only: true;
  app_server_started_now: false;
  production_db_used_now: false;
  runtime_browser_request_now: false;
  runtime_db_query_now: false;
  runtime_db_write_now: false;
}

export interface RecentRehearsalBufferShape {
  recent_rehearsal_buffer_id: string;
  buffer_version: RecentRehearsalBufferVersion;
  generated_at: string;
  scope: string;
  source_refs: RecentRehearsalSourceRef[];
  last_active_research_question: string;
  last_active_perspective_key?: string;
  last_candidate_review_surface_id?: string;
  last_formation_receipt_ref?: RecentRehearsalSourceRef;
  last_open_tension_ids: string[];
  last_failed_check?: RecentRehearsalFailedCheck;
  last_codex_result_status?: string;
  last_user_decision?: RecentRehearsalUserDecision;
  last_follow_up_work_candidate_id?: string;
  recent_context_refs: RecentRehearsalContextRef[];
  excluded_context_refs: RecentRehearsalContextRef[];
  decay_state: RecentRehearsalDecayState;
  decay_policy_ref: string;
  authority_boundary: RecentRehearsalAuthorityBoundary;
  validation: RecentRehearsalValidationPolicy;
}

export interface RecentRehearsalBufferContract {
  contract_kind: RecentRehearsalBufferContractKind;
  contract_version: RecentRehearsalBufferContractVersion;
  source_formation_receipt_validation_ref: string;
  buffer_scope: RecentRehearsalBufferScope;
  buffer_inputs: RecentRehearsalBufferInputs;
  buffer_fields: RecentRehearsalBufferFieldContract;
  decay_policy: RecentRehearsalDecayPolicy;
  non_durable_policy: RecentRehearsalNonDurablePolicy;
  sample_recent_rehearsal_buffer: RecentRehearsalBufferShape;
  authority_boundary: RecentRehearsalAuthorityBoundary;
  validation_policy: RecentRehearsalValidationPolicy;
  recommendation_status:
    "ready_for_recent_rehearsal_buffer_implementation_v0_1";
  next_recommended_slice:
    "recent_rehearsal_buffer_implementation_v0_1";
  contract_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
}
