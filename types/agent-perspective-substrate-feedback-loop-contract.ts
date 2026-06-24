// Contract-only Agent Perspective Substrate Feedback Loop v0.1 shape.
// This file defines types only. It does not implement runtime feedback loop
// builds, feedback event writes or mutations, Agent Substrate mutation or
// execution, salience writes, Recent Rehearsal Buffer writes, durable memory
// writes, linkage writes, Formation Receipt writes, Codex/GitHub automation,
// agent routing/execution, provider/OpenAI calls, retrieval/RAG execution, DB
// access, Perspective promotion, proof/evidence writes, work mutation, routes,
// UI, schema changes, migrations, or product writes.

export type AgentPerspectiveSubstrateFeedbackLoopContractKind =
  "agent_perspective_substrate_feedback_loop_contract";

export type AgentPerspectiveSubstrateFeedbackLoopContractVersion =
  "agent_perspective_substrate_feedback_loop_contract.v0.1";

export type AgentPerspectiveSubstrateFeedbackKind =
  | "dismiss"
  | "pin"
  | "mark_wrong"
  | "mark_useful"
  | "needs_more_evidence"
  | "scope_overreach"
  | "not_relevant_now"
  | "correct";

export type AgentPerspectiveSubstrateFeedbackTargetKind =
  | "substrate_warning"
  | "digest_diagnostic"
  | "context_packet_section"
  | "codex_handoff_draft_section"
  | "packet_receipt_linkage_section"
  | "research_candidate"
  | "perspective_delta_candidate"
  | "unresolved_tension"
  | "knowledge_gap"
  | "source_reference"
  | "work_context";

export type AgentPerspectiveSubstrateFeedbackInputField =
  | "feedback_scope_ref"
  | "substrate_warning_ref"
  | "surfaced_item_ref"
  | "target_kind"
  | "target_ref"
  | "feedback_kind"
  | "operator_feedback_ref"
  | "source_refs"
  | "authority_boundary_ref"
  | "forbidden_actions_ref"
  | "stop_conditions_ref"
  | "operator_context_ref";

export type AgentPerspectiveSubstrateFeedbackOutputField =
  | "feedback_preview_id"
  | "feedback_version"
  | "target_kind"
  | "target_ref"
  | "feedback_kind"
  | "feedback_summary"
  | "future_surfacing_effect_preview"
  | "rule_failure_candidate_preview"
  | "follow_up_candidate_preview"
  | "source_refs"
  | "authority_boundary"
  | "forbidden_actions"
  | "stop_conditions"
  | "validation_policy"
  | "privacy_policy";

export type AgentPerspectiveSubstrateFeedbackSectionKind =
  | "feedback_target"
  | "operator_feedback"
  | "future_surfacing_effect_preview"
  | "rule_failure_candidate_preview"
  | "follow_up_candidate_preview"
  | "authority_boundary"
  | "forbidden_actions"
  | "stop_conditions";

export interface AgentPerspectiveSubstrateFeedbackLoopContractScope {
  agent_perspective_substrate_feedback_loop_contract_only: true;
  feedback_loop_runtime_build_now: false;
  feedback_event_write_now: false;
  feedback_event_mutation_now: false;
  feedback_event_store_write_now: false;
  agent_substrate_mutation_now: false;
  agent_substrate_execution_now: false;
  salience_write_now: false;
  durable_salience_write_now: false;
  recent_rehearsal_buffer_write_now: false;
  durable_memory_write_now: false;
  linkage_runtime_build_now: false;
  linkage_record_write_now: false;
  durable_audit_log_write_now: false;
  formation_receipt_write_now: false;
  formation_receipt_runtime_mutation_now: false;
  codex_execution_now: false;
  github_automation_now: false;
  github_pr_creation_now: false;
  git_branch_creation_now: false;
  git_commit_creation_now: false;
  external_handoff_sending_now: false;
  agent_routing_now: false;
  agent_execution_now: false;
  ai_context_packet_runtime_build_now: false;
  ai_context_packet_write_now: false;
  provider_openai_call_now: false;
  retrieval_rag_execution_now: false;
  source_fetch_now: false;
  crawler_now: false;
  runtime_geometry_digest_build_now: false;
  geometry_digest_write_now: false;
  runtime_layout_execution_now: false;
  graph_mutation_now: false;
  durable_perspective_state_read_now: false;
  durable_perspective_state_write_now: false;
  durable_perspective_delta_apply_now: false;
  perspective_snapshot_runtime_now: false;
  proof_evidence_write_now: false;
  accepted_evidence_write_now: false;
  work_mutation_now: false;
  runtime_db_query_now: false;
  runtime_db_write_now: false;
  schema_migration_now: false;
  route_ui_now: false;
  browser_request_now: false;
  product_write_now: false;
}

export interface AgentPerspectiveSubstrateFeedbackPrinciples {
  feedback_is_operator_signal_not_truth: true;
  feedback_is_advisory_input_not_execution_authority: true;
  feedback_not_proof_or_evidence: true;
  feedback_not_durable_perspective_state: true;
  feedback_not_work_status: true;
  feedback_not_product_write: true;
  feedback_does_not_automatically_promote_candidates: true;
  feedback_does_not_automatically_suppress_or_delete_candidates: true;
  dismiss_is_not_deletion: true;
  pin_is_not_promotion: true;
  mark_useful_is_not_truth: true;
  mark_wrong_is_not_proof_of_falsity: true;
  needs_more_evidence_is_review_cue_not_retrieval_execution: true;
  scope_overreach_is_constraint_signal_not_state_mutation: true;
  not_relevant_now_is_temporal_context_not_rejection: true;
  user_correction_can_mark_rule_failure_later: true;
  user_correction_does_not_mutate_core_state_now: true;
  source_refs_required_for_grounded_targets: true;
  feedback_target_refs_public_safe: true;
  target_kind_preserves_candidate_durable_distinction: true;
  unresolved_tensions_preserved: true;
  knowledge_gaps_preserved: true;
  agent_substrate_folded_derived_advisory_only: true;
  ai_context_packet_context_not_execution_authority: true;
  codex_handoff_draft_not_execution_approval: true;
  packet_receipt_linkage_provenance_not_completion_proof: true;
  product_write_lane_parked_by_686: true;
}

export interface AgentPerspectiveSubstrateFeedbackKindSpec {
  feedback_kind: AgentPerspectiveSubstrateFeedbackKind;
  dismiss_is_not_deletion?: true;
  pin_is_not_promotion?: true;
  mark_wrong_is_not_proof_of_falsity?: true;
  mark_useful_is_not_truth?: true;
  review_cue_not_retrieval_execution?: true;
  constraint_signal_not_state_mutation?: true;
  temporal_context_not_rejection?: true;
  correction_preview_only?: true;
  future_surfacing_priority_only?: true;
  rule_failure_candidate_allowed_later?: true;
  follow_up_candidate_allowed_later?: true;
  can_lower_confidence_later?: true;
  does_not_mutate_core_state_now?: true;
  runtime_write_now: false;
}

export interface AgentPerspectiveSubstrateFeedbackSectionFamily {
  section_kind: AgentPerspectiveSubstrateFeedbackSectionKind;
  target_ref_required?: true;
  target_kind_required?: true;
  target_ref_public_safe?: true;
  preserves_candidate_durable_distinction?: true;
  feedback_kind_required?: true;
  operator_feedback_ref_required?: true;
  public_safe_summary_required?: true;
  display_priority_effect_only?: true;
  not_truth?: true;
  not_promotion_authority?: true;
  candidate_only?: true;
  not_proof_or_evidence?: true;
  not_durable_state?: true;
  allowed_for_mark_wrong_or_scope_overreach_later?: true;
  not_work_item?: true;
  not_retrieval_execution?: true;
  allowed_for_needs_more_evidence_later?: true;
  authority_boundary_required?: true;
  execution_authority_false?: true;
  state_mutation_authority_false?: true;
  external_call_authority_false?: true;
  product_write_authority_false?: true;
  forbidden_actions_required?: true;
  must_include_feedback_write_ban?: true;
  must_include_state_mutation_bans?: true;
  must_include_provider_retrieval_bans?: true;
  must_include_product_write_ban?: true;
  stop_conditions_required?: true;
  stop_conditions_are_safety_constraints?: true;
  runtime_write_now: false;
}

export interface AgentPerspectiveSubstrateFeedbackForbiddenActionsPolicy {
  no_feedback_loop_runtime_build: true;
  no_feedback_event_write: true;
  no_feedback_event_mutation: true;
  no_feedback_event_store_write: true;
  no_agent_substrate_mutation: true;
  no_agent_substrate_execution: true;
  no_salience_write: true;
  no_durable_salience_write: true;
  no_recent_rehearsal_buffer_write: true;
  no_durable_memory_write: true;
  no_linkage_record_write: true;
  no_formation_receipt_write: true;
  no_codex_execution_from_feedback: true;
  no_github_automation_from_feedback: true;
  no_agent_routing_from_feedback: true;
  no_agent_execution_from_feedback: true;
  no_provider_openai_call_from_feedback: true;
  no_retrieval_rag_execution_from_feedback: true;
  no_source_fetch_from_feedback: true;
  no_crawler_from_feedback: true;
  no_db_write_or_query_from_feedback: true;
  no_perspective_promotion_from_feedback: true;
  no_durable_perspective_state_write_from_feedback: true;
  no_proof_or_evidence_write_from_feedback: true;
  no_accepted_evidence_write_from_feedback: true;
  no_work_mutation_from_feedback: true;
  no_product_write_from_feedback: true;
}

export interface AgentPerspectiveSubstrateFeedbackAuthorityBoundary {
  contract_added_now: true;
  implementation_added_now: false;
  browser_validation_added_now: false;
  feedback_loop_runtime_build_implemented_now: false;
  feedback_event_write_now: false;
  feedback_event_mutation_now: false;
  feedback_event_store_write_now: false;
  agent_substrate_mutation_now: false;
  agent_substrate_execution_now: false;
  salience_write_now: false;
  durable_salience_write_now: false;
  recent_rehearsal_buffer_write_now: false;
  linkage_runtime_build_implemented_now: false;
  linkage_record_write_now: false;
  durable_audit_log_write_now: false;
  formation_receipt_write_now: false;
  formation_receipt_runtime_mutation_now: false;
  codex_execution_now: false;
  github_automation_now: false;
  github_pr_creation_now: false;
  git_branch_creation_now: false;
  git_commit_creation_now: false;
  external_handoff_sending_now: false;
  agent_routing_now: false;
  agent_execution_now: false;
  ai_context_packet_runtime_build_implemented_now: false;
  ai_context_packet_write_now: false;
  provider_openai_call_now: false;
  provider_extraction_now: false;
  retrieval_rag_execution_now: false;
  source_fetch_now: false;
  crawler_now: false;
  runtime_geometry_digest_build_implemented_now: false;
  geometry_digest_write_now: false;
  geometry_calculation_runtime_now: false;
  raw_coordinate_authority: false;
  raw_coordinate_only_digest_now: false;
  runtime_layout_implemented_now: false;
  runtime_layout_execution_now: false;
  graph_db_implemented_now: false;
  graph_mutation_now: false;
  browser_request_now: false;
  browser_persistence_now: false;
  durable_perspective_state_read_now: false;
  durable_perspective_state_write_now: false;
  durable_perspective_delta_apply_now: false;
  perspective_snapshot_runtime_implemented_now: false;
  trajectory_runtime_build_implemented_now: false;
  proof_or_evidence_record_write_now: false;
  accepted_evidence_write_now: false;
  work_mutation_now: false;
  candidate_mutation_now: false;
  candidate_record_write_now: false;
  runtime_promotion_implemented_now: false;
  promotion_decision_record_implemented_now: false;
  promotion_decision_record_write_now: false;
  runtime_index_build_implemented_now: false;
  runtime_index_write_now: false;
  embedding_generation_implemented_now: false;
  vector_db_implemented_now: false;
  fts_implemented_now: false;
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
  recent_rehearsal_buffer_written_now: false;
  feedback_events_written_now: false;
  feedback_events_mutated_now: false;
  execution_authority: false;
  feedback_authority: false;
  feedback_truth_authority: false;
  feedback_promotion_authority: false;
  feedback_suppression_authority: false;
  feedback_deletion_authority: false;
  mark_useful_truth_authority: false;
  mark_wrong_falsity_authority: false;
  pin_promotion_authority: false;
  dismiss_deletion_authority: false;
  scope_overreach_state_mutation_authority: false;
  needs_more_evidence_retrieval_authority: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  github_pr_creation_authority: false;
  git_branch_creation_authority: false;
  git_commit_authority: false;
  external_handoff_authority: false;
  agent_routing_authority: false;
  agent_execution_authority: false;
  provider_openai_authority: false;
  retrieval_rag_authority: false;
  source_fetch_authority: false;
  salience_authority: false;
  layout_coordinate_authority: false;
  geometry_digest_authority: false;
  diagnostic_authority: false;
  recommendation_authority: false;
  ai_context_packet_authority: false;
  codex_handoff_draft_authority: false;
  linkage_authority: false;
  receipt_completion_authority: false;
  final_report_completion_authority: false;
  expected_files_write_authority: false;
  expected_checks_execution_authority: false;
  branch_name_git_authority: false;
  pr_title_body_github_authority: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
  product_write_lane_parked_by_686: true;
}

export interface AgentPerspectiveSubstrateFeedbackValidationPolicy {
  feedback_is_operator_signal_not_truth: true;
  feedback_is_advisory_input_not_execution_authority: true;
  feedback_not_proof_or_evidence: true;
  feedback_not_durable_perspective_state: true;
  feedback_not_work_status: true;
  feedback_not_product_write: true;
  feedback_does_not_automatically_promote_candidates: true;
  feedback_does_not_automatically_suppress_or_delete_candidates: true;
  dismiss_is_not_deletion: true;
  pin_is_not_promotion: true;
  mark_useful_is_not_truth: true;
  mark_wrong_is_not_proof_of_falsity: true;
  needs_more_evidence_is_review_cue_not_retrieval_execution: true;
  scope_overreach_is_constraint_signal_not_state_mutation: true;
  not_relevant_now_is_temporal_context_not_rejection: true;
  user_correction_does_not_mutate_core_state_now: true;
  source_refs_required_for_grounded_targets: true;
  feedback_target_refs_public_safe: true;
  target_kind_preserves_candidate_durable_distinction: true;
  unresolved_tensions_preserved: true;
  knowledge_gaps_preserved: true;
  future_surfacing_priority_only: true;
  rule_failure_candidate_preview_only: true;
  follow_up_candidate_preview_only: true;
  agent_substrate_folded_derived_advisory_only: true;
  ai_context_packet_context_not_execution_authority: true;
  codex_handoff_draft_not_execution_approval: true;
  packet_receipt_linkage_provenance_not_completion_proof: true;
  no_runtime_feedback_loop_build: true;
  no_feedback_event_write: true;
  no_feedback_event_mutation: true;
  no_agent_substrate_mutation: true;
  no_agent_substrate_execution: true;
  no_salience_write: true;
  no_durable_salience_write: true;
  no_recent_rehearsal_buffer_write: true;
  no_durable_memory_write: true;
  no_linkage_record_write: true;
  no_formation_receipt_write: true;
  no_codex_execution: true;
  no_github_automation: true;
  no_agent_routing_or_execution: true;
  no_provider_openai_call: true;
  no_retrieval_rag_execution: true;
  no_source_fetch_or_crawler: true;
  no_runtime_state_read_or_write: true;
  no_durable_perspective_delta_apply: true;
  no_perspective_snapshot_runtime: true;
  no_proof_or_evidence_write: true;
  no_accepted_evidence_write: true;
  no_work_mutation: true;
  no_runtime_db_write_or_query: true;
  no_schema_or_migration: true;
  no_route_or_ui: true;
  no_browser_request: true;
  no_product_write_or_ids: true;
}

export interface AgentPerspectiveSubstrateFeedbackPrivacyPolicy {
  no_secrets_in_fixture: true;
  no_private_urls: true;
  no_raw_provider_thread_run_session_ids: true;
  no_raw_source_body: true;
  no_access_tokens: true;
  no_ssh_keys: true;
  public_safe_feedback_refs_only: true;
  public_safe_target_refs_only: true;
  public_safe_substrate_warning_refs_only: true;
  public_safe_surfaced_item_refs_only: true;
  public_safe_source_refs_only: true;
  public_safe_stop_condition_refs_only: true;
}

export interface AgentPerspectiveSubstrateFeedbackLoopContractFixture {
  contract_kind: AgentPerspectiveSubstrateFeedbackLoopContractKind;
  contract_version: AgentPerspectiveSubstrateFeedbackLoopContractVersion;
  source_packet_receipt_linkage_validation_ref: string;
  source_packet_receipt_linkage_validation_fingerprint: string;
  contract_scope: AgentPerspectiveSubstrateFeedbackLoopContractScope;
  feedback_principles: AgentPerspectiveSubstrateFeedbackPrinciples;
  feedback_kinds: AgentPerspectiveSubstrateFeedbackKindSpec[];
  feedback_input_fields: AgentPerspectiveSubstrateFeedbackInputField[];
  feedback_output_fields: AgentPerspectiveSubstrateFeedbackOutputField[];
  feedback_target_kinds: AgentPerspectiveSubstrateFeedbackTargetKind[];
  feedback_section_families: AgentPerspectiveSubstrateFeedbackSectionFamily[];
  forbidden_actions_policy: AgentPerspectiveSubstrateFeedbackForbiddenActionsPolicy;
  sample_agent_perspective_substrate_feedback_loop_preview: unknown;
  authority_boundary: AgentPerspectiveSubstrateFeedbackAuthorityBoundary;
  validation_policy: AgentPerspectiveSubstrateFeedbackValidationPolicy;
  privacy_policy: AgentPerspectiveSubstrateFeedbackPrivacyPolicy;
  recommendation_status:
    "ready_for_agent_perspective_substrate_feedback_loop_implementation_v0_1";
  next_recommended_slice:
    "agent_perspective_substrate_feedback_loop_implementation_v0_1";
  contract_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
}
