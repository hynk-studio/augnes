// Contract-only Perspective Packet Receipt Linkage v0.1 shape.
// This file defines types only. It does not implement linkage runtime build,
// linkage record writes, durable audit log writes, Formation Receipt writes,
// Codex execution, GitHub automation, branch/commit/PR creation, external
// handoff sending, agent routing/execution, provider/OpenAI calls,
// retrieval/RAG execution, source fetching, crawling, DB access, durable memory
// writes, Perspective promotion, proof/evidence writes, work mutation, routes,
// UI, schema changes, migrations, or product writes.

export type PerspectivePacketReceiptLinkageContractKind =
  "perspective_packet_receipt_linkage_contract";

export type PerspectivePacketReceiptLinkageContractVersion =
  "perspective_packet_receipt_linkage_contract.v0.1";

export type PerspectivePacketReceiptLinkageInputField =
  | "linkage_scope_ref"
  | "ai_context_packet_ref"
  | "codex_handoff_draft_ref"
  | "perspective_geometry_digest_ref"
  | "selected_candidate_refs"
  | "omitted_candidate_refs"
  | "deferred_candidate_refs"
  | "unresolved_tension_refs"
  | "knowledge_gap_refs"
  | "source_refs"
  | "authority_boundary_ref"
  | "forbidden_actions_ref"
  | "stop_conditions_ref"
  | "expected_files_ref"
  | "expected_checks_ref"
  | "future_formation_receipt_ref"
  | "future_decision_or_handoff_ref"
  | "operator_context_ref";

export type PerspectivePacketReceiptLinkageOutputField =
  | "linkage_id"
  | "linkage_version"
  | "ai_context_packet_ref"
  | "codex_handoff_draft_ref"
  | "perspective_geometry_digest_ref"
  | "selected_candidates"
  | "omitted_candidates"
  | "deferred_candidates"
  | "unresolved_tensions"
  | "knowledge_gaps"
  | "source_refs"
  | "authority_boundary"
  | "forbidden_actions"
  | "stop_conditions"
  | "expected_files"
  | "expected_checks"
  | "future_formation_receipt_ref"
  | "future_decision_or_handoff_ref"
  | "linkage_notes"
  | "validation_policy"
  | "privacy_policy";

export type PerspectivePacketReceiptLinkageSectionKind =
  | "ai_context_packet_link"
  | "codex_handoff_draft_link"
  | "perspective_geometry_digest_link"
  | "selected_candidates"
  | "omitted_candidates"
  | "deferred_candidates"
  | "unresolved_tensions"
  | "knowledge_gaps"
  | "future_formation_receipt_ref"
  | "future_decision_or_handoff_ref"
  | "authority_boundary"
  | "forbidden_actions"
  | "expected_files"
  | "expected_checks"
  | "linkage_notes";

export interface PerspectivePacketReceiptLinkageContractScope {
  perspective_packet_receipt_linkage_contract_only: true;
  linkage_runtime_build_now: false;
  linkage_record_write_now: false;
  durable_audit_log_write_now: false;
  formation_receipt_write_now: false;
  formation_receipt_runtime_mutation_now: false;
  codex_handoff_draft_runtime_build_now: false;
  codex_handoff_draft_write_now: false;
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
  durable_memory_write_now: false;
  schema_migration_now: false;
  route_ui_now: false;
  browser_request_now: false;
  product_write_now: false;
}

export interface PerspectivePacketReceiptLinkagePrinciples {
  linkage_is_provenance_not_execution_authority: true;
  linkage_is_derived_public_safe_advisory_only: true;
  linkage_not_source_of_truth: true;
  linkage_not_proof_or_evidence: true;
  linkage_not_completion_proof: true;
  linkage_not_durable_perspective_state: true;
  linkage_not_work_status: true;
  linkage_not_product_write: true;
  linkage_does_not_prove_codex_ran: true;
  linkage_does_not_prove_pr_created: true;
  linkage_does_not_prove_validation_passed: true;
  linkage_does_not_create_formation_receipt_now: true;
  formation_receipt_ref_future_only: true;
  decision_or_handoff_ref_future_only: true;
  source_refs_required: true;
  authority_boundary_required: true;
  forbidden_actions_required: true;
  stop_conditions_required: true;
  selected_candidates_remain_candidates: true;
  omitted_candidates_remain_visible: true;
  deferred_candidates_remain_visible: true;
  unresolved_tensions_preserved: true;
  knowledge_gaps_preserved: true;
  candidate_durable_distinction_preserved: true;
  ai_context_packet_context_not_execution_authority: true;
  codex_handoff_draft_not_execution_approval: true;
  perspective_geometry_digest_interpretation_not_truth: true;
  expected_files_hints_not_write_authority: true;
  expected_checks_hints_not_execution_authority: true;
  final_report_template_not_completion_proof: true;
  product_write_lane_parked_by_686: true;
}

export interface PerspectivePacketReceiptLinkageSectionFamily {
  section_kind: PerspectivePacketReceiptLinkageSectionKind;
  ai_context_packet_ref_required?: true;
  context_not_execution_authority?: true;
  codex_handoff_draft_ref_required?: true;
  draft_not_execution_approval?: true;
  geometry_digest_ref_required?: true;
  interpretation_not_truth?: true;
  candidate_refs_required?: true;
  candidates_remain_candidates?: true;
  not_proof_or_evidence?: true;
  not_durable_state?: true;
  source_refs_required?: true;
  omitted_candidate_refs_required?: true;
  omitted_candidates_remain_visible?: true;
  omission_not_rejection?: true;
  deferred_candidate_refs_required?: true;
  deferred_candidates_remain_visible?: true;
  deferral_not_rejection?: true;
  tension_refs_required?: true;
  must_remain_visible?: true;
  resolution_not_implied?: true;
  knowledge_gap_refs_required?: true;
  closure_not_implied?: true;
  source_refs_or_gap_reason_required?: true;
  future_formation_receipt_ref_required?: true;
  receipt_not_written_now?: true;
  not_completion_proof?: true;
  future_decision_or_handoff_ref_required?: true;
  decision_not_made_now?: true;
  handoff_not_sent_now?: true;
  authority_boundary_required?: true;
  execution_authority_false?: true;
  state_mutation_authority_false?: true;
  external_call_authority_false?: true;
  product_write_authority_false?: true;
  forbidden_actions_required?: true;
  must_include_execution_bans?: true;
  must_include_state_mutation_bans?: true;
  must_include_provider_retrieval_bans?: true;
  must_include_product_write_ban?: true;
  expected_files_are_hints_only?: true;
  not_file_write_authority?: true;
  expected_checks_are_validation_hints_only?: true;
  not_execution_authority?: true;
  notes_are_explanatory_only?: true;
  not_truth_source?: true;
  runtime_write_now: false;
}

export interface PerspectivePacketReceiptLinkageForbiddenActionsPolicy {
  no_linkage_runtime_build: true;
  no_linkage_record_write: true;
  no_durable_audit_log_write: true;
  no_formation_receipt_write: true;
  no_codex_execution_from_linkage: true;
  no_github_automation_from_linkage: true;
  no_github_pr_creation_from_linkage: true;
  no_git_branch_creation_from_linkage: true;
  no_git_commit_creation_from_linkage: true;
  no_external_handoff_sending_from_linkage: true;
  no_agent_routing_from_linkage: true;
  no_agent_execution_from_linkage: true;
  no_provider_openai_call_from_linkage: true;
  no_retrieval_rag_execution_from_linkage: true;
  no_source_fetch_from_linkage: true;
  no_crawler_from_linkage: true;
  no_db_write_or_query_from_linkage: true;
  no_durable_memory_write_from_linkage: true;
  no_perspective_promotion_from_linkage: true;
  no_durable_perspective_state_write_from_linkage: true;
  no_proof_or_evidence_write_from_linkage: true;
  no_accepted_evidence_write_from_linkage: true;
  no_work_mutation_from_linkage: true;
  no_product_write_from_linkage: true;
}

export interface PerspectivePacketReceiptLinkageAuthorityBoundary {
  contract_added_now: true;
  implementation_added_now: false;
  browser_validation_added_now: false;
  linkage_runtime_build_implemented_now: false;
  linkage_record_write_now: false;
  durable_audit_log_write_now: false;
  formation_receipt_write_now: false;
  codex_handoff_draft_runtime_build_implemented_now: false;
  codex_handoff_draft_write_now: false;
  codex_handoff_implemented_now: false;
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
  durable_salience_write_now: false;
  recent_rehearsal_buffer_written_now: false;
  feedback_events_written_now: false;
  feedback_events_mutated_now: false;
  execution_authority: false;
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

export interface PerspectivePacketReceiptLinkageValidationPolicy
  extends PerspectivePacketReceiptLinkagePrinciples {
  no_runtime_linkage_build: true;
  no_linkage_record_write: true;
  no_durable_audit_log_write: true;
  no_formation_receipt_write: true;
  no_codex_execution: true;
  no_github_automation: true;
  no_github_pr_creation: true;
  no_git_branch_or_commit_creation: true;
  no_external_handoff_sending: true;
  no_agent_routing_or_execution: true;
  no_provider_openai_call: true;
  no_retrieval_rag_execution: true;
  no_source_fetch_or_crawler: true;
  no_ai_context_packet_runtime_build: true;
  no_codex_handoff_draft_runtime_build: true;
  no_runtime_geometry_digest_build: true;
  no_runtime_layout_execution: true;
  no_graph_mutation: true;
  no_runtime_state_read_or_write: true;
  no_durable_perspective_delta_apply: true;
  no_perspective_snapshot_runtime: true;
  no_proof_or_evidence_write: true;
  no_accepted_evidence_write: true;
  no_work_mutation: true;
  no_runtime_db_write_or_query: true;
  no_durable_memory_write: true;
  no_schema_or_migration: true;
  no_route_or_ui: true;
  no_browser_request: true;
  no_product_write_or_ids: true;
}

export interface PerspectivePacketReceiptLinkagePrivacyPolicy {
  no_secrets_in_fixture: true;
  no_private_urls: true;
  no_raw_provider_thread_run_session_ids: true;
  no_raw_source_body: true;
  no_access_tokens: true;
  no_ssh_keys: true;
  public_safe_linkage_refs_only: true;
  public_safe_packet_refs_only: true;
  public_safe_handoff_refs_only: true;
  public_safe_receipt_refs_only: true;
  public_safe_candidate_refs_only: true;
  public_safe_tension_refs_only: true;
  public_safe_knowledge_gap_refs_only: true;
  public_safe_source_refs_only: true;
  public_safe_file_paths_only: true;
  public_safe_check_refs_only: true;
  public_safe_stop_condition_refs_only: true;
}

export interface PerspectivePacketReceiptLinkageContractFixture {
  contract_kind: PerspectivePacketReceiptLinkageContractKind;
  contract_version: PerspectivePacketReceiptLinkageContractVersion;
  source_codex_handoff_draft_validation_ref: string;
  source_codex_handoff_draft_validation_fingerprint: string;
  contract_scope: PerspectivePacketReceiptLinkageContractScope;
  linkage_principles: PerspectivePacketReceiptLinkagePrinciples;
  linkage_input_fields: PerspectivePacketReceiptLinkageInputField[];
  linkage_output_fields: PerspectivePacketReceiptLinkageOutputField[];
  linkage_section_families: PerspectivePacketReceiptLinkageSectionFamily[];
  forbidden_actions_policy: PerspectivePacketReceiptLinkageForbiddenActionsPolicy;
  sample_perspective_packet_receipt_linkage_preview: unknown;
  authority_boundary: PerspectivePacketReceiptLinkageAuthorityBoundary;
  validation_policy: PerspectivePacketReceiptLinkageValidationPolicy;
  privacy_policy: PerspectivePacketReceiptLinkagePrivacyPolicy;
  recommendation_status: "ready_for_perspective_packet_receipt_linkage_implementation_v0_1";
  next_recommended_slice: "perspective_packet_receipt_linkage_implementation_v0_1";
}
