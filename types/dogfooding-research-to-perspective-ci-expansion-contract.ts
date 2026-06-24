// Contract-only Dogfooding Research-to-Perspective CI Expansion v0.1 shape.
// This file defines types only. It does not implement runtime dogfooding
// ingestion, dogfooding record writes, CI runtime execution, GitHub Actions,
// Codex execution, GitHub or git automation, feedback event writes, Agent
// Substrate mutation or execution, salience writes, durable memory writes,
// Formation Receipt writes, provider/OpenAI calls, retrieval/RAG execution, DB
// access, Perspective promotion, proof/evidence writes, work mutation, routes,
// UI, schema changes, migrations, or product writes.

export type DogfoodingResearchToPerspectiveCiExpansionContractKind =
  "dogfooding_research_to_perspective_ci_expansion_contract";

export type DogfoodingResearchToPerspectiveCiExpansionContractVersion =
  "dogfooding_research_to_perspective_ci_expansion_contract.v0.1";

export type DogfoodingResearchToPerspectiveCiExpansionInputField =
  | "dogfooding_scope_ref"
  | "source_pr_ref"
  | "codex_result_report_ref"
  | "changed_files_ref"
  | "validation_matrix_ref"
  | "warning_refs"
  | "skipped_check_refs"
  | "authority_boundary_ref"
  | "source_refs"
  | "operator_context_ref";

export type DogfoodingResearchToPerspectiveCiExpansionOutputField =
  | "dogfooding_preview_id"
  | "dogfooding_version"
  | "source_pr_ref"
  | "codex_result_summary"
  | "changed_files_summary"
  | "validation_matrix_summary"
  | "warnings_summary"
  | "skipped_checks_summary"
  | "authority_boundary_summary"
  | "candidate_review_implications"
  | "perspective_delta_candidate_preview"
  | "ci_expansion_candidate_preview"
  | "source_refs"
  | "validation_policy"
  | "privacy_policy";

export type DogfoodingResearchToPerspectiveCiExpansionSectionKind =
  | "source_pr"
  | "codex_result_report"
  | "changed_files_summary"
  | "validation_matrix_summary"
  | "warnings_summary"
  | "skipped_checks_summary"
  | "authority_boundary_summary"
  | "candidate_review_implications"
  | "perspective_delta_candidate_preview"
  | "ci_expansion_candidate_preview"
  | "source_refs";

export interface DogfoodingResearchToPerspectiveCiExpansionContractScope {
  dogfooding_ci_expansion_contract_only: true;
  runtime_dogfooding_ingestion_now: false;
  dogfooding_record_write_now: false;
  ci_runtime_change_now: false;
  github_actions_added_now: false;
  ci_execution_now: false;
  codex_execution_now: false;
  github_automation_now: false;
  github_pr_creation_now: false;
  git_branch_creation_now: false;
  git_commit_creation_now: false;
  feedback_event_write_now: false;
  agent_substrate_mutation_now: false;
  salience_write_now: false;
  durable_memory_write_now: false;
  linkage_record_write_now: false;
  formation_receipt_write_now: false;
  provider_openai_call_now: false;
  retrieval_rag_execution_now: false;
  source_fetch_now: false;
  crawler_now: false;
  durable_perspective_state_write_now: false;
  durable_perspective_delta_apply_now: false;
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

export interface DogfoodingResearchToPerspectiveCiExpansionPrinciples {
  dogfooding_record_is_candidate_review_context_not_truth: true;
  ci_expansion_contract_only_not_runtime_ci: true;
  ci_signal_not_proof_or_evidence: true;
  smoke_pass_not_truth: true;
  smoke_fail_diagnostic_not_automatic_rejection: true;
  codex_result_report_candidate_input_not_execution_proof: true;
  pr_body_operator_report_not_authority: true;
  merge_status_repo_event_context_not_product_write: true;
  changed_files_review_cues_not_correctness_proof: true;
  validation_commands_review_cues_not_execution_authority: true;
  warnings_diagnostic_not_failure_unless_policy_says_so: true;
  skipped_checks_explicitly_justified: true;
  authority_boundary_regression_candidate_alert_not_mutation: true;
  dogfooding_candidate_remains_candidate_until_future_gate: true;
  product_decision_can_create_delta_candidate_later_not_state_now: true;
  source_refs_required: true;
  pr_refs_public_safe: true;
  product_write_lane_parked_by_686: true;
}

export interface DogfoodingResearchToPerspectiveCiExpansionSectionFamily {
  section_kind: DogfoodingResearchToPerspectiveCiExpansionSectionKind;
  pr_ref_required?: true;
  pr_ref_public_safe?: true;
  not_github_authority?: true;
  report_ref_required?: true;
  candidate_input_only?: true;
  not_execution_proof?: true;
  changed_files_are_review_cues_only?: true;
  not_correctness_proof?: true;
  validation_commands_are_review_cues_only?: true;
  not_execution_authority?: true;
  smoke_pass_not_truth?: true;
  smoke_fail_diagnostic_not_rejection?: true;
  warnings_are_diagnostic_only?: true;
  warning_not_failure_unless_policy_says_so?: true;
  skipped_checks_require_reason?: true;
  skipped_checks_not_silent?: true;
  authority_boundary_required?: true;
  regression_is_candidate_alert_not_mutation?: true;
  candidate_only?: true;
  not_proof_or_evidence?: true;
  not_durable_state?: true;
  not_durable_perspective_delta?: true;
  future_human_gate_required?: true;
  github_actions_added_now?: false;
  ci_runtime_change_now?: false;
  source_refs_required?: true;
  public_safe_refs_only?: true;
  runtime_write_now: false;
}

export interface DogfoodingResearchToPerspectiveCiExpansionForbiddenActionsPolicy {
  no_runtime_dogfooding_ingestion: true;
  no_dogfooding_record_write: true;
  no_ci_runtime_change: true;
  no_github_actions_addition: true;
  no_ci_execution: true;
  no_codex_execution: true;
  no_github_automation: true;
  no_pr_creation: true;
  no_branch_or_commit_creation: true;
  no_feedback_event_write: true;
  no_agent_substrate_mutation: true;
  no_salience_write: true;
  no_durable_memory_write: true;
  no_provider_openai_call: true;
  no_retrieval_rag_execution: true;
  no_db_write_or_query: true;
  no_perspective_promotion: true;
  no_durable_perspective_state_write: true;
  no_proof_or_evidence_write: true;
  no_accepted_evidence_write: true;
  no_work_mutation: true;
  no_product_write: true;
}

export interface DogfoodingResearchToPerspectiveCiExpansionAuthorityBoundary {
  contract_added_now: true;
  implementation_added_now: false;
  browser_validation_added_now: false;
  closeout_added_now: false;
  runtime_dogfooding_ingestion_implemented_now: false;
  dogfooding_record_write_now: false;
  ci_runtime_change_now: false;
  github_actions_added_now: false;
  ci_execution_now: false;
  codex_execution_now: false;
  github_automation_now: false;
  github_pr_creation_now: false;
  git_branch_creation_now: false;
  git_commit_creation_now: false;
  feedback_event_write_now: false;
  agent_substrate_mutation_now: false;
  salience_write_now: false;
  durable_memory_write_now: false;
  linkage_record_write_now: false;
  formation_receipt_write_now: false;
  provider_openai_call_now: false;
  retrieval_rag_execution_now: false;
  source_fetch_now: false;
  crawler_now: false;
  durable_perspective_state_write_now: false;
  durable_perspective_delta_apply_now: false;
  proof_or_evidence_record_write_now: false;
  accepted_evidence_write_now: false;
  work_mutation_now: false;
  runtime_db_write_now: false;
  runtime_db_query_now: false;
  production_db_used_now: false;
  db_schema_implemented_now: false;
  route_changed_now: false;
  component_changed_now: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
  dogfooding_authority: false;
  ci_authority: false;
  github_actions_authority: false;
  validation_pass_truth_authority: false;
  validation_failure_rejection_authority: false;
  codex_result_execution_authority: false;
  pr_body_authority: false;
  changed_files_correctness_authority: false;
  boundary_regression_mutation_authority: false;
  product_write_lane_parked_by_686: true;
}

export interface DogfoodingResearchToPerspectiveCiExpansionValidationPolicy {
  dogfooding_contract_only: true;
  dogfooding_not_source_of_truth: true;
  dogfooding_not_proof_or_evidence: true;
  dogfooding_not_runtime_ci: true;
  ci_signal_not_proof_or_evidence: true;
  smoke_pass_not_truth: true;
  smoke_fail_diagnostic_not_rejection: true;
  codex_result_report_candidate_input_only: true;
  pr_body_not_authority: true;
  changed_files_not_correctness_proof: true;
  validation_commands_not_execution_authority: true;
  authority_boundary_regression_candidate_alert_not_mutation: true;
  no_github_actions_addition: true;
  no_ci_runtime_change: true;
  no_runtime_dogfooding_ingestion: true;
  no_dogfooding_record_write: true;
  no_provider_openai_call: true;
  no_retrieval_rag_execution: true;
  no_db_write_or_query: true;
  no_perspective_promotion: true;
  no_proof_or_evidence_write: true;
  no_work_mutation: true;
  no_product_write_or_ids: true;
}

export interface DogfoodingResearchToPerspectiveCiExpansionPrivacyPolicy {
  no_secrets_in_fixture: true;
  no_private_urls: true;
  no_access_tokens: true;
  no_ssh_keys: true;
  no_raw_provider_thread_run_session_ids: true;
  no_raw_source_body: true;
  public_safe_pr_refs_only: true;
  public_safe_source_refs_only: true;
  public_safe_warning_refs_only: true;
}

export interface DogfoodingResearchToPerspectiveCiExpansionContractFixture {
  contract_kind: DogfoodingResearchToPerspectiveCiExpansionContractKind;
  contract_version: DogfoodingResearchToPerspectiveCiExpansionContractVersion;
  source_feedback_loop_closeout_ref: string;
  source_feedback_loop_closeout_fingerprint: string;
  contract_scope: DogfoodingResearchToPerspectiveCiExpansionContractScope;
  dogfooding_principles: DogfoodingResearchToPerspectiveCiExpansionPrinciples;
  dogfooding_input_fields: DogfoodingResearchToPerspectiveCiExpansionInputField[];
  dogfooding_output_fields: DogfoodingResearchToPerspectiveCiExpansionOutputField[];
  dogfooding_section_families:
    DogfoodingResearchToPerspectiveCiExpansionSectionFamily[];
  forbidden_actions_policy:
    DogfoodingResearchToPerspectiveCiExpansionForbiddenActionsPolicy;
  sample_dogfooding_ci_expansion_preview: unknown;
  authority_boundary: DogfoodingResearchToPerspectiveCiExpansionAuthorityBoundary;
  validation_policy: DogfoodingResearchToPerspectiveCiExpansionValidationPolicy;
  privacy_policy: DogfoodingResearchToPerspectiveCiExpansionPrivacyPolicy;
  recommendation_status:
    "ready_for_dogfooding_research_to_perspective_ci_expansion_implementation_v0_1";
  next_recommended_slice:
    "dogfooding_research_to_perspective_ci_expansion_implementation_v0_1";
  contract_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
}
