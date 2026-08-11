import type {
  StrategyCompositionAblationTargetV01,
  StrategyCompositionCaseReferenceV01,
  StrategyCompositionSourceBindingV01,
} from "./strategy-composition-case";

export const STRATEGY_COMPOSITION_COMPARISON_VERSION_V01 =
  "strategy_composition_comparison.v0.1" as const;
export const STRATEGY_COMPOSITION_BUDGET_VERSION_V01 =
  "strategy_composition_equal_budget.v0.1" as const;
export const STRATEGY_COMPOSITION_OUTCOME_OBSERVATION_VERSION_V01 =
  "strategy_composition_outcome_observation.v0.1" as const;
export const STRATEGY_COMPOSITION_COMPARISON_CANONICALIZATION_V01 =
  "augnes-json-c14n-v0_1" as const;

export const STRATEGY_COMPOSITION_COMPARISON_VARIANTS_V01 = [
  "monolithic",
  "unbound",
  "bound",
  "ordered",
] as const;

export type StrategyCompositionComparisonVariantV01 =
  (typeof STRATEGY_COMPOSITION_COMPARISON_VARIANTS_V01)[number];

export type StrategyCompositionObservationSubjectV01 =
  | StrategyCompositionComparisonVariantV01
  | "ablation";

export const STRATEGY_COMPOSITION_OUTCOME_DIMENSIONS_V01 = [
  "verification.required_passed",
  "verification.failed",
  "verification.blocked",
  "verification.skipped",
  "verification.unknown",
  "verification.hard_gate_failure",
  "review_burden.correction_count",
  "review_burden.intervention_count",
  "review_burden.repeated_explanation_count",
  "review_burden.missing_critical_context_correction_count",
  "cost_operability.provider_call_count",
  "cost_operability.tool_call_count",
  "cost_operability.token_count",
  "cost_operability.cost_microunits",
  "cost_operability.latency_ms",
  "cost_operability.cleanup_recovery_count",
  "cost_operability.egress_observation",
] as const;

export type StrategyCompositionOutcomeDimensionV01 =
  (typeof STRATEGY_COMPOSITION_OUTCOME_DIMENSIONS_V01)[number];

export interface StrategyCompositionComparisonIntegrityV01 {
  algorithm: "sha256";
  canonicalization: typeof STRATEGY_COMPOSITION_COMPARISON_CANONICALIZATION_V01;
  fingerprint_scope: "object_without_integrity_fingerprint";
  fingerprint: string;
}

export interface StrategyCompositionBudgetEnvelopeV01 {
  budget_version: typeof STRATEGY_COMPOSITION_BUDGET_VERSION_V01;
  budget_id: string;
  budget_kind: "exact_equal_ceiling_envelope";
  budget_key: string;
  provider_call_limit: number;
  tool_call_limit: number;
  step_limit: number;
  token_limit: number;
  cost_limit_microunits: number;
  latency_limit_ms: number;
  equal_for_all_variants: true;
  cost_adjusted_comparison_supported: false;
  integrity: StrategyCompositionComparisonIntegrityV01;
}

export interface StrategyCompositionBudgetReferenceV01 {
  budget_id: string;
  budget_fingerprint: string;
}

export interface StrategyCompositionEvaluationCaseReferenceV01 {
  evaluation_case_id: string;
  evaluation_case_fingerprint: string;
  task_family_key: string;
}

export interface StrategyCompositionOutcomeVectorV01 {
  verification: {
    required_passed: number | null;
    failed: number | null;
    blocked: number | null;
    skipped: number | null;
    unknown: number | null;
    hard_gate_failure: boolean | null;
    hard_gate_failure_codes: string[];
  };
  review_burden: {
    correction_count: number | null;
    intervention_count: number | null;
    repeated_explanation_count: number | null;
    missing_critical_context_correction_count: number | null;
  };
  cost_operability: {
    provider_call_count: number | null;
    tool_call_count: number | null;
    token_count: number | null;
    cost_microunits: number | null;
    latency_ms: number | null;
    cleanup_recovery_count: number | null;
    egress_observation: "none_observed" | "observed" | "unknown";
  };
}

export interface StrategyCompositionOutcomeObservationV01 {
  observation_version: typeof STRATEGY_COMPOSITION_OUTCOME_OBSERVATION_VERSION_V01;
  subject_kind: StrategyCompositionObservationSubjectV01;
  case_ref: StrategyCompositionCaseReferenceV01;
  evaluation_case: StrategyCompositionEvaluationCaseReferenceV01;
  holdout_case: StrategyCompositionCaseReferenceV01;
  budget: StrategyCompositionBudgetReferenceV01;
  source: StrategyCompositionSourceBindingV01;
  observation_mode: "deterministic_exact_fixture";
  outcome: StrategyCompositionOutcomeVectorV01;
  budget_compliance: StrategyCompositionBudgetComplianceV01;
  completeness: "complete" | "partial";
  missing_dimensions: StrategyCompositionOutcomeDimensionV01[];
  outcome_is_evaluation_truth: false;
  observed_advantage_is_verified_general_benefit: false;
  limitations: string[];
}

export interface StrategyCompositionBudgetComplianceV01 {
  provider_call_count: "within_ceiling" | "unobserved";
  tool_call_count: "within_ceiling" | "unobserved";
  step_count: "unobserved";
  token_count: "within_ceiling" | "unobserved";
  cost_microunits: "within_ceiling" | "unobserved";
  latency_ms: "within_ceiling" | "unobserved";
  all_observed_resource_dimensions_within_ceiling: true;
  equal_budget_is_equal_capability: false;
}

export interface StrategyCompositionVariantSummaryV01 {
  variant_kind: StrategyCompositionComparisonVariantV01;
  case_ref: StrategyCompositionCaseReferenceV01;
  case_role: "baseline" | "development";
  baseline_case_ref: StrategyCompositionCaseReferenceV01 | null;
  component_count: number;
  role_binding_count: number;
  relation_count: number;
  component_set_fingerprint: string;
  source_set_fingerprint: string;
  construction_material_fingerprint: string;
  role_binding_fingerprint: string;
  relation_fingerprint: string;
  structurally_valid: true;
}

export type StrategyCompositionDimensionRelationV01 =
  | "better"
  | "worse"
  | "equal"
  | "tradeoff"
  | "unknown"
  | "not_comparable";

export interface StrategyCompositionDimensionDeltaV01 {
  dimension: StrategyCompositionOutcomeDimensionV01;
  relation: StrategyCompositionDimensionRelationV01;
  preferred_direction: "higher" | "lower" | "required_false";
  left_value: number | boolean | string | null;
  right_value: number | boolean | string | null;
  exact_delta: number | null;
  exact_basis: string;
}

export type StrategyCompositionPairSummaryRelationV01 =
  | "left_better"
  | "right_better"
  | "left_better_hard_gate"
  | "right_better_hard_gate"
  | "equal"
  | "tradeoff"
  | "unknown"
  | "not_comparable";

export interface StrategyCompositionPairwiseComparisonV01 {
  pair_id: string;
  structural_question:
    | "monolithic_to_unbound"
    | "unbound_to_bound"
    | "bound_to_ordered"
    | "monolithic_to_ordered";
  left_variant: StrategyCompositionComparisonVariantV01;
  right_variant: StrategyCompositionComparisonVariantV01;
  left_case_ref: StrategyCompositionCaseReferenceV01;
  right_case_ref: StrategyCompositionCaseReferenceV01;
  same_evaluation_case: true;
  same_holdout_case: true;
  same_budget: true;
  dimension_deltas: StrategyCompositionDimensionDeltaV01[];
  summary_relation: StrategyCompositionPairSummaryRelationV01;
  hard_gate_non_compensation_applied: boolean;
  pairwise_better_is_global_winner: false;
  limitations: string[];
}

export interface StrategyCompositionNonDominanceSummaryV01 {
  status: "determined" | "undetermined";
  non_dominated_variants: StrategyCompositionComparisonVariantV01[];
  dominated_relations: Array<{
    dominant_variant: StrategyCompositionComparisonVariantV01;
    dominated_variant: StrategyCompositionComparisonVariantV01;
    basis:
      | "hard_gate_non_compensation"
      | "all_observed_dimensions_no_worse_and_one_better";
  }>;
  tradeoff_pairs: string[];
  unknown_dimensions: StrategyCompositionOutcomeDimensionV01[];
  ordinal_ranking_created: false;
  global_winner_created: false;
  product_promotion_created: false;
  limitations: string[];
}

export interface StrategyCompositionAblationAssociationV01 {
  parent_case_ref: StrategyCompositionCaseReferenceV01;
  ablation_case_ref: StrategyCompositionCaseReferenceV01;
  target: StrategyCompositionAblationTargetV01;
  same_evaluation_case: true;
  same_holdout_case: true;
  same_budget: true;
  dimension_deltas: StrategyCompositionDimensionDeltaV01[];
  association_kind: "bounded_ablation_intervention_association";
  causal_contribution_claimed: false;
  general_causal_contribution_claimed: false;
  limitations: string[];
}

export interface StrategyCompositionNegativeTransferObservationV01 {
  case_ref: StrategyCompositionCaseReferenceV01;
  origin_task_family_key: string;
  target_task_family_key: string;
  transfer_hypothesis_source_ref_ids: string[];
  adverse_association_source_ref_ids: string[];
  adverse_association_supplied: boolean;
  signal: "local_negative_transfer_candidate";
  causal_negative_contribution_claimed: false;
  general_harm_claimed: false;
  component_blacklist_created: false;
  promotion_or_depromotion_created: false;
  limitations: string[];
}

export interface StrategyCompositionComparisonMaterialBoundaryV01 {
  bounded: true;
  variant_count: 4;
  max_text_characters: 1600;
  max_collection_items: 128;
  raw_prompt_included: false;
  raw_transcript_included: false;
  raw_terminal_output_included: false;
  raw_provider_output_included: false;
  hidden_reasoning_included: false;
  credential_or_secret_included: false;
  absolute_local_path_included: false;
  stochastic_aggregation_supported: false;
}

export interface StrategyCompositionComparisonAuthoritySummaryV01 {
  is_canonical_core_record: false;
  is_evidence: false;
  is_evaluation_truth: false;
  is_accepted_strategy: false;
  is_policy: false;
  is_execution_plan: false;
  is_proposal: false;
  is_review_decision: false;
  is_transition: false;
  creates_actor_identity: false;
  writes_database: false;
  mutates_source_records: false;
  mutates_semantic_state: false;
  mutates_task_context_packet: false;
  selects_context: false;
  activates_policy: false;
  authorizes_execution: false;
  authorizes_provider_calls: false;
  authorizes_network_use: false;
  authorizes_external_actuation: false;
  authorizes_github_mutation: false;
  authorizes_publication: false;
  authorizes_merge: false;
  claims_verified_general_benefit: false;
  claims_general_causal_contribution: false;
  claims_general_harm: false;
  promotes_or_depromotes_component_or_strategy: false;
  creates_scalar_fitness_or_quality: false;
  creates_global_winner_or_ranking: false;
  notes: string[];
}

export interface StrategyCompositionComparisonV01 {
  comparison_version: typeof STRATEGY_COMPOSITION_COMPARISON_VERSION_V01;
  comparison_id: string;
  comparison_kind: "derived_rebuildable_offline_research_comparison";
  workspace_id: string;
  project_id: string;
  comparison_family_key: string;
  variant_summaries: StrategyCompositionVariantSummaryV01[];
  structural_parity: {
    source_cases_validated_by_builder: true;
    serialized_validation_scope: "projection_internal_consistency_only";
    monolithic_baseline_role_valid: true;
    componentized_development_roles_valid: true;
    four_variant_task_family_equal: true;
    four_variant_construction_cutoff_equal: true;
    componentized_baseline_binding_equal: true;
    componentized_baseline_is_monolithic: true;
    componentized_components_equal: true;
    componentized_sources_equal: true;
    componentized_construction_material_equal: true;
    bound_and_ordered_role_bindings_equal: true;
    intended_binding_and_order_deltas_only: true;
    common_component_set_fingerprint: string;
    common_source_set_fingerprint: string;
    common_construction_material_fingerprint: string;
  };
  evaluation_binding: {
    evaluation_case: StrategyCompositionEvaluationCaseReferenceV01;
    parent_development_case: StrategyCompositionCaseReferenceV01;
    holdout_case: StrategyCompositionCaseReferenceV01;
    frozen_cutoff: string;
    observation_cutoff: string;
    same_holdout_for_all_variants: true;
    holdout_outcome_not_used_for_construction: true;
  };
  equal_budget: StrategyCompositionBudgetEnvelopeV01;
  outcome_observations: StrategyCompositionOutcomeObservationV01[];
  pairwise_comparisons: StrategyCompositionPairwiseComparisonV01[];
  non_dominance: StrategyCompositionNonDominanceSummaryV01;
  ablation_association: StrategyCompositionAblationAssociationV01 | null;
  negative_transfer: StrategyCompositionNegativeTransferObservationV01 | null;
  completeness: {
    status: "complete" | "partial";
    missing_dimensions: StrategyCompositionOutcomeDimensionV01[];
    stochastic_aggregation: "unsupported_v0.1";
  };
  limitations: string[];
  material_boundary: StrategyCompositionComparisonMaterialBoundaryV01;
  authority_summary: StrategyCompositionComparisonAuthoritySummaryV01;
  integrity: StrategyCompositionComparisonIntegrityV01;
}
