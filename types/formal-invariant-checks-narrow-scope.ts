// Contract-only Formal Invariant Checks Narrow Scope v0.1 shape.
// This file defines narrow, static invariant contracts only. It does not add a
// theorem prover runtime, Lean dependency, natural-language proof generation,
// provider calls, retrieval/RAG, DB activity, routes/UI, proof/evidence writes,
// promotion, durable state mutation, Formation Receipt writes, Git/GitHub/Codex
// execution, export/import runtime, product-write, or product ID allocation.

export const FormalInvariantChecksNarrowScopeContractVersion =
  "formal_invariant_checks_narrow_scope.v0.1" as const;
export const FormalInvariantSpecVersion =
  "formal_invariant_spec.v0.1" as const;
export const FormalInvariantCaseVersion =
  "formal_invariant_case.v0.1" as const;
export const FormalInvariantBundleVersion =
  "formal_invariant_bundle.v0.1" as const;
export const FormalInvariantValidationFindingVersion =
  "formal_invariant_validation_finding.v0.1" as const;
export const FormalInvariantScope = "project:augnes" as const;

export const FormalInvariantStatuses = [
  "contract_only",
  "fixture_only",
  "static_invariant_smoke_only",
  "ready_for_future_operator_review",
  "blocked_forbidden_authority",
  "blocked_private_or_raw_payload",
  "rejected",
] as const;
export type FormalInvariantStatus =
  (typeof FormalInvariantStatuses)[number];

export const FormalInvariantKinds = [
  "candidate_not_proof",
  "provider_output_not_evidence",
  "retrieval_result_not_promotion",
  "codex_result_not_state",
  "dataset_row_not_training_data",
  "feedback_not_truth",
  "layout_coordinate_not_authority",
  "git_ref_not_authority",
  "github_pr_not_core_decision",
  "ci_pass_not_truth",
  "smoke_pass_not_truth",
  "git_ledger_packet_not_commit",
  "product_write_gate_required",
  "product_id_allocation_disabled",
  "private_identifier_not_canonical_label",
] as const;
export type FormalInvariantKind = (typeof FormalInvariantKinds)[number];

export const FormalInvariantSurfaces = [
  "route_contract",
  "type_contract",
  "fixture_contract",
  "smoke_script",
  "docs_boundary",
  "authority_boundary",
  "product_write_target_contract",
  "github_actuation_contract",
  "git_ledger_contract",
  "empirical_calibration_dataset",
  "deterministic_crpf_variant_review",
  "codex_result_report_ingestion",
  "temporal_handoff_experiment",
  "privacy_redaction_guard",
  "local_data_export_policy",
  "unknown",
] as const;
export type FormalInvariantSurface =
  (typeof FormalInvariantSurfaces)[number];

export const FormalInvariantCheckModes = [
  "static_text_match",
  "authority_boundary_field_check",
  "fixture_negative_case",
  "fixture_positive_boundary_case",
  "type_surface_check",
  "route_refusal_contract_check",
  "no_runtime_file_scope_check",
] as const;
export type FormalInvariantCheckMode =
  (typeof FormalInvariantCheckModes)[number];

export const FormalInvariantExpectedResults = [
  "allowed_boundary_statement",
  "blocked_positive_authority_claim",
  "refused_route_payload",
  "forbidden_authority_false",
  "required_prerequisite_present",
  "non_authority_phrase_present",
  "no_runtime_capability_present",
] as const;
export type FormalInvariantExpectedResult =
  (typeof FormalInvariantExpectedResults)[number];

export const FormalInvariantFailureSeverities = [
  "info",
  "warning",
  "blocking",
  "critical",
] as const;
export type FormalInvariantFailureSeverity =
  (typeof FormalInvariantFailureSeverities)[number];

export const FormalInvariantReasonCodes = [
  "formal_invariant_checks_narrow_scope_only",
  "static_smoke_only",
  "theorem_prover_runtime_not_added",
  "natural_language_claim_proving_forbidden",
  "route_refusal_contract_only",
  "authority_boundary_required",
  "candidate_not_proof",
  "provider_output_not_evidence",
  "retrieval_result_not_promotion",
  "codex_result_not_state",
  "dataset_row_not_training_data",
  "feedback_not_truth",
  "layout_coordinate_not_authority",
  "git_ref_not_authority",
  "github_pr_not_core_decision",
  "ci_pass_not_truth",
  "smoke_pass_not_truth",
  "git_ledger_packet_not_commit",
  "git_ledger_packet_not_proof",
  "git_ledger_packet_not_product_write",
  "product_write_gate_required",
  "product_write_remains_parked",
  "product_write_denied",
  "product_id_allocation_disabled",
  "private_identifier_not_canonical_label",
  "source_refs_required",
  "promotion_decision_required",
  "formation_receipt_required",
  "explicit_operator_approval_required",
  "audit_trail_required",
  "rollback_policy_required",
  "idempotency_key_required",
  "preview_to_write_diff_required",
  "privacy_guard_required",
  "provider_call_not_executed",
  "prompt_not_sent",
  "source_fetch_not_executed",
  "retrieval_not_executed",
  "rag_answer_not_generated",
  "db_write_not_executed",
  "proof_not_created",
  "evidence_not_created",
  "promotion_not_executed",
  "durable_state_not_mutated",
  "formation_receipt_not_written",
  "git_github_not_executed",
  "codex_not_executed",
  "product_id_allocation_not_executed",
  "local_export_not_executed",
  "local_import_not_executed",
  "raw_private_payload_blocked",
  "private_url_blocked",
  "local_private_path_blocked",
  "secret_like_pattern_blocked",
  "provider_thread_run_session_id_blocked",
] as const;
export type FormalInvariantReasonCode =
  (typeof FormalInvariantReasonCodes)[number];

export interface FormalInvariantAuthorityBoundary {
  formal_invariant_checks_contract_now: true;
  contract_only: true;
  fixture_only: true;
  static_invariant_smoke_only: true;
  narrow_scope_only: true;
  caller_provided_fixture_only: true;
  theorem_prover_runtime_now: false;
  lean_dependency_added_now: false;
  natural_language_claim_proving_now: false;
  runtime_route_check_now: false;
  runtime_state_mutation_now: false;
  db_query_or_write_now: false;
  route_now: false;
  ui_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  source_fetch_now: false;
  retrieval_execution_now: false;
  rag_answer_generation_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  promotion_execution_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  git_ledger_export_runtime_now: false;
  git_write_now: false;
  github_api_call_now: false;
  repository_file_write_now: false;
  local_file_export_now: false;
  local_file_import_now: false;
  codex_execution_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  product_write_now: false;
  product_write_runtime_now: false;
  product_write_adapter_enabled_now: false;
  product_id_allocation_now: false;
  product_persistence_now: false;
  product_write_authority: false;
  invariant_pass_is_truth: false;
  invariant_pass_is_proof: false;
  invariant_pass_is_approval: false;
  invariant_pass_is_promotion: false;
  invariant_pass_is_durable_state: false;
  invariant_pass_is_product_write_authority: false;
  invariant_pass_is_merge_authority: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
}

export interface FormalInvariantSpec {
  spec_version: typeof FormalInvariantSpecVersion;
  contract_version: typeof FormalInvariantChecksNarrowScopeContractVersion;
  scope: typeof FormalInvariantScope;
  invariant_id: string;
  invariant_kind: FormalInvariantKind;
  invariant_surface: FormalInvariantSurface;
  check_mode: FormalInvariantCheckMode;
  expected_result: FormalInvariantExpectedResult;
  failure_severity: FormalInvariantFailureSeverity;
  public_safe_statement: string;
  reason_codes: FormalInvariantReasonCode[];
  authority_boundary: FormalInvariantAuthorityBoundary;
}

export interface FormalInvariantPositiveCase {
  case_version: typeof FormalInvariantCaseVersion;
  scope: typeof FormalInvariantScope;
  case_id: string;
  invariant_kind: FormalInvariantKind;
  surface: FormalInvariantSurface;
  check_mode: FormalInvariantCheckMode;
  expected_result: "allowed_boundary_statement";
  expected_allowed: true;
  statement: string;
  reason_codes: FormalInvariantReasonCode[];
  authority_boundary: FormalInvariantAuthorityBoundary;
}

export interface FormalInvariantNegativeCase {
  case_version: typeof FormalInvariantCaseVersion;
  scope: typeof FormalInvariantScope;
  case_id: string;
  invariant_kind: FormalInvariantKind;
  surface: FormalInvariantSurface;
  check_mode: FormalInvariantCheckMode;
  expected_result: "blocked_positive_authority_claim";
  expected_blocked: true;
  statement_segments: string[];
  public_safe_summary: string;
  reason_codes: FormalInvariantReasonCode[];
  authority_boundary: FormalInvariantAuthorityBoundary;
}

export interface FormalInvariantRouteRefusalCase {
  case_version: typeof FormalInvariantCaseVersion;
  scope: typeof FormalInvariantScope;
  case_id: string;
  invariant_kind: FormalInvariantKind;
  surface: FormalInvariantSurface;
  check_mode: FormalInvariantCheckMode;
  expected_result: "refused_route_payload";
  expected_allowed: true;
  statement: string;
  reason_codes: FormalInvariantReasonCode[];
  authority_boundary: FormalInvariantAuthorityBoundary;
}

export interface FormalInvariantProductWriteGateCase {
  case_version: typeof FormalInvariantCaseVersion;
  scope: typeof FormalInvariantScope;
  case_id: string;
  invariant_kind: "product_write_gate_required";
  surface: FormalInvariantSurface;
  check_mode: FormalInvariantCheckMode;
  expected_result: "required_prerequisite_present";
  expected_allowed: true;
  statement: string;
  required_prerequisites: string[];
  reason_codes: FormalInvariantReasonCode[];
  authority_boundary: FormalInvariantAuthorityBoundary;
}

export interface FormalInvariantPrivacyIdentifierCase {
  case_version: typeof FormalInvariantCaseVersion;
  scope: typeof FormalInvariantScope;
  case_id: string;
  invariant_kind: "private_identifier_not_canonical_label";
  surface: FormalInvariantSurface;
  check_mode: FormalInvariantCheckMode;
  expected_result: "refused_route_payload" | "non_authority_phrase_present";
  expected_allowed: true;
  statement: string;
  reason_codes: FormalInvariantReasonCode[];
  authority_boundary: FormalInvariantAuthorityBoundary;
}

export interface FormalInvariantBundle {
  bundle_version: typeof FormalInvariantBundleVersion;
  contract_version: typeof FormalInvariantChecksNarrowScopeContractVersion;
  spec_version: typeof FormalInvariantSpecVersion;
  case_version: typeof FormalInvariantCaseVersion;
  scope: typeof FormalInvariantScope;
  status: FormalInvariantStatus;
  bundle_id: string;
  invariant_specs: FormalInvariantSpec[];
  positive_boundary_cases: FormalInvariantPositiveCase[];
  negative_forbidden_claim_cases: FormalInvariantNegativeCase[];
  route_refusal_contract_cases: FormalInvariantRouteRefusalCase[];
  product_write_gate_cases: FormalInvariantProductWriteGateCase[];
  privacy_identifier_cases: FormalInvariantPrivacyIdentifierCase[];
  deterministic_fingerprint: string;
  boundary_notes: string[];
  reason_codes: FormalInvariantReasonCode[];
  authority_boundary: FormalInvariantAuthorityBoundary;
}

export interface FormalInvariantValidationFinding {
  finding_version: typeof FormalInvariantValidationFindingVersion;
  scope: typeof FormalInvariantScope;
  finding_id: string;
  path: string;
  finding_kind:
    | "private_or_raw_payload"
    | "forbidden_authority"
    | "invalid_invariant_case"
    | "runtime_scope_violation"
    | "missing_prerequisite";
  severity: FormalInvariantFailureSeverity;
  action: "blocked" | "reference_only" | "allowed";
  reason_codes: FormalInvariantReasonCode[];
  public_safe_summary: string;
  original_value_included: false;
}
