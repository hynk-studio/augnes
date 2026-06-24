// Contract-only AI Context Packet v0.1 shape.
// This file defines types only. It does not implement packet runtime build,
// AI Context Packet writes, Codex handoff, Codex execution, GitHub automation,
// external handoff sending, agent routing/execution, provider/OpenAI calls,
// retrieval/RAG execution, source fetching, crawling, DB access, durable memory
// writes, Perspective promotion, proof/evidence writes, Formation Receipt
// writes, work mutation, routes, UI, schema changes, migrations, or product
// writes.

export type AIContextPacketContractKind = "ai_context_packet_contract";

export type AIContextPacketContractVersion = "ai_context_packet_contract.v0.1";

export type AIContextPacketTargetAgentMode =
  | "chatgpt_design"
  | "codex_implementation"
  | "codex_review"
  | "mcp_runtime"
  | "cockpit_ui";

export type AIContextPacketInputField =
  | "packet_scope_ref"
  | "mission_brief_ref"
  | "current_state_ref"
  | "perspective_geometry_digest_ref"
  | "selected_research_candidate_refs"
  | "selected_perspective_delta_candidate_refs"
  | "unresolved_tension_refs"
  | "knowledge_gap_refs"
  | "source_refs"
  | "authority_boundary_ref"
  | "forbidden_actions_ref"
  | "target_agent_mode"
  | "operator_context_ref";

export type AIContextPacketOutputField =
  | "packet_id"
  | "packet_version"
  | "target_agent_mode"
  | "mission_brief"
  | "current_state_summary"
  | "selected_research_candidates"
  | "selected_perspective_delta_candidates"
  | "unresolved_tensions"
  | "knowledge_gaps"
  | "perspective_geometry_digest_summary"
  | "source_refs"
  | "authority_boundary"
  | "forbidden_actions"
  | "expected_files"
  | "expected_checks"
  | "stop_conditions"
  | "final_critical_facts"
  | "privacy_policy"
  | "validation_policy";

export type AIContextPacketSectionKind =
  | "mission_brief"
  | "current_state_summary"
  | "selected_research_candidates"
  | "selected_perspective_delta_candidates"
  | "unresolved_tensions"
  | "knowledge_gaps"
  | "perspective_geometry_digest_summary"
  | "authority_boundary"
  | "forbidden_actions"
  | "expected_files"
  | "expected_checks"
  | "stop_conditions"
  | "final_critical_facts";

export interface AIContextPacketContractScope {
  ai_context_packet_contract_only: true;
  ai_context_packet_runtime_build_now: false;
  ai_context_packet_write_now: false;
  codex_handoff_implementation_now: false;
  codex_execution_now: false;
  github_automation_now: false;
  external_handoff_sending_now: false;
  agent_routing_now: false;
  agent_execution_now: false;
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
  formation_receipt_write_now: false;
  work_mutation_now: false;
  runtime_db_query_now: false;
  runtime_db_write_now: false;
  schema_migration_now: false;
  route_ui_now: false;
  browser_request_now: false;
  product_write_now: false;
}

export interface AIContextPacketPrinciples {
  ai_context_packet_is_context_not_execution_authority: true;
  packet_is_folded_derived_advisory_only: true;
  packet_not_source_of_truth: true;
  packet_not_proof_or_evidence: true;
  packet_not_durable_perspective_state: true;
  packet_not_work_status: true;
  packet_not_product_write: true;
  source_refs_required: true;
  unresolved_tensions_preserved: true;
  knowledge_gaps_preserved: true;
  candidate_durable_distinction_preserved: true;
  authority_boundary_required: true;
  forbidden_actions_required: true;
  stop_conditions_required: true;
  final_critical_facts_are_review_cues_not_authority: true;
  target_agent_mode_is_scope_not_authority: true;
  codex_handoff_draft_not_execution_approval: true;
  github_codex_automation_not_authority: true;
  provider_output_not_execution_authority: true;
  retrieval_rag_context_recall_not_authority: true;
  perspective_geometry_digest_interpretation_not_truth: true;
  agent_substrate_advisory_only: true;
}

export interface AIContextPacketTargetAgentModeContract {
  mode: AIContextPacketTargetAgentMode;
  presentation_scope_only: true;
  execution_authority: false;
  external_call_authority?: false;
  state_mutation_authority?: false;
  codex_execution_authority_now?: false;
  github_automation_authority_now?: false;
  review_authority_only?: true;
  tool_widening_now?: false;
  ui_rendering_now?: false;
}

export interface AIContextPacketSectionFamily {
  section_kind: AIContextPacketSectionKind;
  public_safe_summary_required?: true;
  source_refs_required?: true;
  not_instruction_to_execute?: true;
  derived_summary_only?: true;
  not_source_of_truth?: true;
  runtime_state_read_now?: false;
  candidate_refs_required?: true;
  candidate_only?: true;
  not_evidence?: true;
  not_proof?: true;
  not_durable_state?: true;
  delta_candidate_only?: true;
  not_durable_perspective_delta?: true;
  tension_refs_required?: true;
  must_remain_visible?: true;
  resolution_not_implied?: true;
  knowledge_gap_refs_required?: true;
  closure_not_implied?: true;
  source_refs_or_gap_reason_required?: true;
  digest_ref_required?: true;
  interpretation_not_truth?: true;
  raw_coordinates_not_source_of_truth?: true;
  diagnostics_advisory_only?: true;
  runtime_digest_build_now?: false;
  authority_boundary_required?: true;
  execution_authority_false?: true;
  state_mutation_authority_false?: true;
  external_call_authority_false?: true;
  product_write_authority_false?: true;
  forbidden_actions_required?: true;
  must_include_runtime_execution_bans?: true;
  must_include_state_mutation_bans?: true;
  must_include_provider_retrieval_bans?: true;
  must_include_product_write_ban?: true;
  expected_files_are_handoff_hints_only?: true;
  not_file_write_authority?: true;
  expected_checks_are_validation_hints_only?: true;
  not_execution_authority?: true;
  stop_conditions_required?: true;
  stop_conditions_are_safety_constraints?: true;
  review_cues_only?: true;
  not_truth_source?: true;
  runtime_write_now: false;
}

export interface AIContextPacketForbiddenActionsPolicy {
  no_runtime_execution_from_packet: true;
  no_codex_execution_from_packet: true;
  no_github_automation_from_packet: true;
  no_external_handoff_sending_from_packet: true;
  no_agent_routing_from_packet: true;
  no_agent_execution_from_packet: true;
  no_provider_openai_call_from_packet: true;
  no_retrieval_rag_execution_from_packet: true;
  no_source_fetch_from_packet: true;
  no_crawler_from_packet: true;
  no_db_write_or_query_from_packet: true;
  no_durable_memory_write_from_packet: true;
  no_perspective_promotion_from_packet: true;
  no_durable_perspective_state_write_from_packet: true;
  no_proof_or_evidence_write_from_packet: true;
  no_accepted_evidence_write_from_packet: true;
  no_formation_receipt_write_from_packet: true;
  no_work_mutation_from_packet: true;
  no_product_write_from_packet: true;
}

export interface AIContextPacketAuthorityBoundary {
  contract_added_now: true;
  implementation_added_now: false;
  browser_validation_added_now: false;
  ai_context_packet_runtime_build_implemented_now: false;
  ai_context_packet_write_now: false;
  codex_handoff_implemented_now: false;
  codex_execution_now: false;
  github_automation_now: false;
  external_handoff_sending_now: false;
  agent_routing_now: false;
  agent_execution_now: false;
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
  formation_receipt_write_now: false;
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
  durable_salience_write_now: false;
  recent_rehearsal_buffer_written_now: false;
  feedback_events_written_now: false;
  feedback_events_mutated_now: false;
  execution_authority: false;
  codex_execution_authority: false;
  github_automation_authority: false;
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
  target_agent_mode_authority: false;
  final_critical_facts_authority: false;
  expected_files_write_authority: false;
  expected_checks_execution_authority: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
  product_write_lane_parked_by_686: true;
}

export interface AIContextPacketValidationPolicy extends AIContextPacketPrinciples {
  no_runtime_packet_build: true;
  no_ai_context_packet_write: true;
  no_codex_handoff_implementation: true;
  no_codex_execution: true;
  no_github_automation: true;
  no_external_handoff_sending: true;
  no_agent_routing_or_execution: true;
  no_provider_openai_call: true;
  no_retrieval_rag_execution: true;
  no_source_fetch_or_crawler: true;
  no_runtime_geometry_digest_build: true;
  no_runtime_layout_execution: true;
  no_graph_mutation: true;
  no_runtime_state_read_or_write: true;
  no_durable_perspective_delta_apply: true;
  no_perspective_snapshot_runtime: true;
  no_proof_or_evidence_write: true;
  no_accepted_evidence_write: true;
  no_formation_receipt_write: true;
  no_work_mutation: true;
  no_runtime_db_write_or_query: true;
  no_schema_or_migration: true;
  no_route_or_ui: true;
  no_browser_request: true;
  no_product_write_or_ids: true;
}

export interface AIContextPacketPrivacyPolicy {
  no_secrets_in_fixture: true;
  no_private_urls: true;
  no_raw_provider_thread_run_session_ids: true;
  no_raw_source_body: true;
  public_safe_packet_refs_only: true;
  public_safe_candidate_refs_only: true;
  public_safe_tension_refs_only: true;
  public_safe_knowledge_gap_refs_only: true;
  public_safe_source_refs_only: true;
  public_safe_digest_refs_only: true;
  public_safe_state_refs_only: true;
  public_safe_stop_condition_refs_only: true;
  public_safe_check_refs_only: true;
  public_safe_file_paths_only: true;
}

export interface AIContextPacketContract {
  contract_kind: AIContextPacketContractKind;
  contract_version: AIContextPacketContractVersion;
  source_perspective_geometry_digest_validation_ref: string;
  source_perspective_geometry_digest_validation_fingerprint: string;
  contract_scope: AIContextPacketContractScope;
  packet_principles: AIContextPacketPrinciples;
  target_agent_modes: AIContextPacketTargetAgentModeContract[];
  packet_input_fields: AIContextPacketInputField[];
  packet_output_fields: AIContextPacketOutputField[];
  packet_section_families: AIContextPacketSectionFamily[];
  forbidden_actions_policy: AIContextPacketForbiddenActionsPolicy;
  sample_ai_context_packet_preview: unknown;
  authority_boundary: AIContextPacketAuthorityBoundary;
  validation_policy: AIContextPacketValidationPolicy;
  privacy_policy: AIContextPacketPrivacyPolicy;
  recommendation_status: "ready_for_ai_context_packet_implementation_v0_1";
  next_recommended_slice: "ai_context_packet_implementation_v0_1";
  contract_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
}
