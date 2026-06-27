// Contract-only Deterministic CRPF Variant Review v0.1 shape.
// CRPF means constrained random perspective formation reviewed as deterministic,
// fixture-backed variants. This file defines contracts only. It does not
// execute runtime randomness, call providers, send prompts, fetch sources,
// execute retrieval/RAG, query/write DB, add routes/UI, create proof/evidence,
// promote Perspective, mutate durable state, write Formation Receipts, execute
// Git/GitHub/Codex, export/import files, product-write, or allocate product IDs.

export const DeterministicCrpfVariantReviewContractVersion =
  "deterministic_crpf_variant_review.v0.1" as const;
export const DeterministicCrpfVariantVersion =
  "deterministic_crpf_variant.v0.1" as const;
export const DeterministicCrpfVariantComparisonVersion =
  "deterministic_crpf_variant_comparison.v0.1" as const;
export const DeterministicCrpfVariantValidationFindingVersion =
  "deterministic_crpf_variant_validation_finding.v0.1" as const;
export const DeterministicCrpfVariantReviewScope = "project:augnes" as const;

export const DeterministicCrpfVariantReviewStatuses = [
  "contract_only",
  "fixture_only",
  "deterministic_review_aid_only",
  "ready_for_future_operator_review",
  "blocked_private_or_raw_payload",
  "blocked_forbidden_authority",
  "rejected",
] as const;
export type DeterministicCrpfVariantReviewStatus =
  (typeof DeterministicCrpfVariantReviewStatuses)[number];

export const DeterministicCrpfVariantLabels = [
  "evidence_strict",
  "tension_preserving",
  "source_coverage_strict",
  "handoff_minimal",
  "operator_review_heavy",
] as const;
export type DeterministicCrpfVariantLabel =
  (typeof DeterministicCrpfVariantLabels)[number];

export const DeterministicCrpfVariantPolicies = [
  "fixed_seed_ref_required",
  "fixture_backed_variant_only",
  "evidence_strict_policy",
  "tension_preserving_policy",
  "source_coverage_strict_policy",
  "handoff_minimal_policy",
  "operator_review_heavy_policy",
  "candidate_inclusion_requires_public_safe_refs",
  "evidence_requirement_requires_review_context",
  "unresolved_tension_must_be_preserved",
  "source_coverage_must_be_explicit",
  "handoff_size_must_be_bounded",
  "operator_review_required",
] as const;
export type DeterministicCrpfVariantPolicy =
  (typeof DeterministicCrpfVariantPolicies)[number];

export const DeterministicCrpfReviewCues = [
  "inspect_evidence_coverage",
  "preserve_unresolved_tension",
  "inspect_source_ref_coverage",
  "reduce_handoff_size",
  "request_operator_review",
  "preserve_not_done_item",
  "inspect_overclaim_risk",
  "compare_expected_observed_delta",
  "no_action",
] as const;
export type DeterministicCrpfReviewCue =
  (typeof DeterministicCrpfReviewCues)[number];

export const DeterministicCrpfSelectionCriteria = [
  "fixed_seed_ref",
  "public_safe_candidate_refs",
  "evidence_coverage",
  "source_ref_coverage",
  "unresolved_tension_preservation",
  "knowledge_gap_preservation",
  "expected_observed_delta_preservation",
  "handoff_size_bound",
  "operator_review_load",
  "overclaim_risk",
] as const;
export type DeterministicCrpfSelectionCriterion =
  (typeof DeterministicCrpfSelectionCriteria)[number];

export const DeterministicCrpfReasonCodes = [
  "deterministic_crpf_review_only",
  "fixed_seed_required",
  "runtime_randomness_forbidden",
  "variant_is_review_aid",
  "variant_is_not_truth",
  "variant_is_not_proof",
  "variant_is_not_accepted_evidence",
  "variant_is_not_promotion",
  "variant_is_not_durable_state",
  "evidence_strict_variant_defined",
  "tension_preserving_variant_defined",
  "source_coverage_strict_variant_defined",
  "handoff_minimal_variant_defined",
  "operator_review_heavy_variant_defined",
  "source_refs_required",
  "unresolved_tension_preserved",
  "knowledge_gap_preserved",
  "expected_observed_delta_preserved",
  "operator_review_required",
  "privacy_guard_required",
  "product_write_denied",
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
  "codex_not_executed",
  "git_github_not_executed",
  "smoke_pass_not_truth",
  "ci_pass_not_truth",
  "raw_private_payload_blocked",
  "private_url_blocked",
  "local_private_path_blocked",
  "secret_like_pattern_blocked",
  "provider_thread_run_session_id_blocked",
] as const;
export type DeterministicCrpfReasonCode =
  (typeof DeterministicCrpfReasonCodes)[number];

export interface DeterministicCrpfAuthorityBoundary {
  deterministic_crpf_variant_review_now: true;
  contract_only: true;
  fixture_only: true;
  fixed_seed_only: true;
  deterministic_review_aid_only: true;
  caller_provided_fixture_only: true;
  runtime_randomness_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  source_fetch_now: false;
  retrieval_execution_now: false;
  rag_answer_generation_now: false;
  db_query_or_write_now: false;
  route_now: false;
  ui_now: false;
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
  variant_is_truth: false;
  variant_is_proof: false;
  variant_is_accepted_evidence: false;
  variant_is_promotion_readiness: false;
  variant_is_durable_state: false;
  variant_is_product_write: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
}

export interface DeterministicCrpfVariantContract {
  variant_version: typeof DeterministicCrpfVariantVersion;
  contract_version: typeof DeterministicCrpfVariantReviewContractVersion;
  scope: typeof DeterministicCrpfVariantReviewScope;
  status: DeterministicCrpfVariantReviewStatus;
  variant_id: string;
  variant_label: DeterministicCrpfVariantLabel;
  fixed_seed_ref: string;
  selection_policy: DeterministicCrpfVariantPolicy[];
  candidate_inclusion_policy: string;
  evidence_requirement_policy: string;
  unresolved_tension_policy: string;
  source_coverage_policy: string;
  handoff_policy: string;
  operator_review_policy: string;
  expected_benefits: string[];
  risk_notes: string[];
  review_cues: DeterministicCrpfReviewCue[];
  non_authority_notes: string[];
  reason_codes: DeterministicCrpfReasonCode[];
  authority_boundary: DeterministicCrpfAuthorityBoundary;
}

export interface DeterministicCrpfVariantComparisonBundle {
  comparison_version: typeof DeterministicCrpfVariantComparisonVersion;
  contract_version: typeof DeterministicCrpfVariantReviewContractVersion;
  variant_version: typeof DeterministicCrpfVariantVersion;
  scope: typeof DeterministicCrpfVariantReviewScope;
  status: DeterministicCrpfVariantReviewStatus;
  comparison_id: string;
  fixed_seed_ref: string;
  candidate_refs: string[];
  source_refs: string[];
  evidence_refs: string[];
  tension_refs: string[];
  gap_refs: string[];
  handoff_refs: string[];
  selection_criteria: DeterministicCrpfSelectionCriterion[];
  variants: DeterministicCrpfVariantContract[];
  expected_output_shape: string[];
  deterministic_fingerprint: string;
  boundary_notes: string[];
  reason_codes: DeterministicCrpfReasonCode[];
  authority_boundary: DeterministicCrpfAuthorityBoundary;
}

export interface DeterministicCrpfValidationFinding {
  finding_version: typeof DeterministicCrpfVariantValidationFindingVersion;
  scope: typeof DeterministicCrpfVariantReviewScope;
  finding_id: string;
  path: string;
  finding_kind:
    | "private_or_raw_payload"
    | "forbidden_authority"
    | "runtime_randomness"
    | "invalid_fixture"
    | "invalid_variant";
  severity: "info" | "warning" | "critical";
  action: "blocked" | "reference_only" | "allowed";
  reason_codes: DeterministicCrpfReasonCode[];
  public_safe_summary: string;
  original_value_included: false;
}
