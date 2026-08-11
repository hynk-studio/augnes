export const STRATEGY_COMPOSITION_CASE_VERSION_V01 =
  "strategy_composition_case.v0.1" as const;
export const STRATEGY_COMPOSITION_EVALUATION_DESIGN_VERSION_V01 =
  "strategy_composition_evaluation_design.v0.1" as const;
export const STRATEGY_COMPOSITION_CANONICALIZATION_V01 =
  "augnes-json-c14n-v0_1" as const;

export const STRATEGY_COMPOSITION_MAX_COMPONENTS_V01 = 24 as const;
export const STRATEGY_COMPOSITION_MAX_ROLE_BINDINGS_V01 = 16 as const;
export const STRATEGY_COMPOSITION_MAX_RELATIONS_V01 = 64 as const;
export const STRATEGY_COMPOSITION_MAX_SOURCE_REFS_V01 = 64 as const;
export const STRATEGY_COMPOSITION_MAX_TEXT_ITEMS_V01 = 32 as const;
export const STRATEGY_COMPOSITION_MAX_TEXT_CHARACTERS_V01 = 1600 as const;

export const STRATEGY_COMPOSITION_ROLES_V01 = [
  "planning",
  "decomposition",
  "evidence_request",
  "verification",
  "falsification",
  "synthesis",
  "scope_narrowing",
  "uncertainty_preservation",
  "abstention",
] as const;

export type StrategyCompositionRoleV01 =
  (typeof STRATEGY_COMPOSITION_ROLES_V01)[number];

export type StrategyCompositionSourceKindV01 =
  | "task_context_packet"
  | "run_receipt"
  | "context_use_review"
  | "criterion_assessment"
  | "strategic_advantage_transfer_item"
  | "accepted_semantic_source"
  | "synthetic_fixture"
  | "evaluation_outcome"
  | "other_source";

export type StrategyCompositionSourceUseV01 =
  | "construction_input"
  | "design_reference"
  | "withheld_holdout"
  | "evaluation_outcome"
  | "adverse_association";

export interface StrategyCompositionSourceBindingV01 {
  source_ref_id: string;
  source_kind: StrategyCompositionSourceKindV01;
  source_use: StrategyCompositionSourceUseV01;
  workspace_id: string;
  project_id: string;
  source_id: string;
  source_fingerprint: string;
  observed_at: string;
  available_at: string;
  epistemic_status: "observed" | "attested" | "derived" | "unknown";
}

export interface StrategyCompositionCaseBindingV01 {
  workspace_id: string;
  project_id: string;
  case_key: string;
  task_family_key: string;
  construction_cutoff: string;
  synthetic: boolean;
}

export interface StrategyCompositionProvenanceRelationV01 {
  source_ref_id: string;
  relation_kind:
    | "strategic_advantage_transfer_hypothesis"
    | "accepted_semantic_source"
    | "other_source";
  accepted_component: false;
  verified_benefit: false;
  causal_evidence: false;
  product_promotion: false;
}

export interface StrategyComponentCandidateV01 {
  component_id: string;
  title: string;
  summary: string;
  procedural_function: string;
  applicability_condition: string;
  source_ref_ids: string[];
  expected_effect: string;
  falsifier: string;
  uncertainty: string[];
  limitations: string[];
  provenance_relations: StrategyCompositionProvenanceRelationV01[];
  accepted_strategy: false;
}

export interface StrategyCompositionRoleBindingV01 {
  role: StrategyCompositionRoleV01;
  component_id: string;
  rationale: string;
  actor_identity_included: false;
}

export interface StrategyCompositionRelationV01 {
  relation_kind: "must_precede" | "depends_on";
  subject_component_id: string;
  object_component_id: string;
}

export interface StrategyCompositionCaseReferenceV01 {
  workspace_id: string;
  project_id: string;
  case_id: string;
  case_fingerprint: string;
  case_key: string;
  task_family_key: string;
  construction_cutoff: string;
}

export interface StrategyCompositionBaselineDesignV01 {
  design_version: typeof STRATEGY_COMPOSITION_EVALUATION_DESIGN_VERSION_V01;
  case_role: "baseline";
  baseline_case: null;
  superiority_claimed: false;
}

export interface StrategyCompositionDevelopmentDesignV01 {
  design_version: typeof STRATEGY_COMPOSITION_EVALUATION_DESIGN_VERSION_V01;
  case_role: "development";
  baseline_case: StrategyCompositionCaseReferenceV01;
  superiority_claimed: false;
}

export interface StrategyCompositionHoldoutDesignV01 {
  design_version: typeof STRATEGY_COMPOSITION_EVALUATION_DESIGN_VERSION_V01;
  case_role: "holdout";
  baseline_case: StrategyCompositionCaseReferenceV01;
  parent_development_case: StrategyCompositionCaseReferenceV01;
  development_task_family_key: string;
  holdout_task_family_key: string;
  frozen_cutoff: string;
  withheld_source_ref_ids: string[];
  evaluation_outcome_source_ref_ids: string[];
  development_outcome_included: false;
  holdout_success_claimed: false;
  superiority_claimed: false;
}

export type StrategyCompositionAblationTargetV01 =
  | {
      target_kind: "component";
      component_id: string;
    }
  | {
      target_kind: "role_binding";
      role: StrategyCompositionRoleV01;
      component_id: string;
    }
  | {
      target_kind: "relation";
      relation_kind: StrategyCompositionRelationV01["relation_kind"];
      subject_component_id: string;
      object_component_id: string;
    };

export interface StrategyCompositionAblationDesignV01 {
  design_version: typeof STRATEGY_COMPOSITION_EVALUATION_DESIGN_VERSION_V01;
  case_role: "ablation";
  baseline_case: StrategyCompositionCaseReferenceV01;
  parent_case: StrategyCompositionCaseReferenceV01;
  targets: StrategyCompositionAblationTargetV01[];
  exactly_one_target: true;
  causal_contribution_claimed: false;
  superiority_claimed: false;
}

export interface StrategyCompositionNegativeTransferDesignV01 {
  design_version: typeof STRATEGY_COMPOSITION_EVALUATION_DESIGN_VERSION_V01;
  case_role: "negative_transfer";
  baseline_case: StrategyCompositionCaseReferenceV01;
  origin_case: StrategyCompositionCaseReferenceV01;
  origin_task_family_key: string;
  target_task_family_key: string;
  transfer_hypothesis_source_ref_ids: string[];
  adverse_association_source_ref_ids: string[];
  observed_adverse_association: "supplied" | "not_supplied";
  negative_transfer_candidate: true;
  causal_negative_contribution_claimed: false;
  general_harm_claimed: false;
  superiority_claimed: false;
}

export type StrategyCompositionEvaluationDesignV01 =
  | StrategyCompositionBaselineDesignV01
  | StrategyCompositionDevelopmentDesignV01
  | StrategyCompositionHoldoutDesignV01
  | StrategyCompositionAblationDesignV01
  | StrategyCompositionNegativeTransferDesignV01;

export interface StrategyCompositionMaterialBoundaryV01 {
  bounded: true;
  max_components: typeof STRATEGY_COMPOSITION_MAX_COMPONENTS_V01;
  max_role_bindings: typeof STRATEGY_COMPOSITION_MAX_ROLE_BINDINGS_V01;
  max_relations: typeof STRATEGY_COMPOSITION_MAX_RELATIONS_V01;
  max_source_refs: typeof STRATEGY_COMPOSITION_MAX_SOURCE_REFS_V01;
  max_text_items: typeof STRATEGY_COMPOSITION_MAX_TEXT_ITEMS_V01;
  max_text_characters: typeof STRATEGY_COMPOSITION_MAX_TEXT_CHARACTERS_V01;
  raw_prompt_included: false;
  raw_transcript_included: false;
  raw_terminal_output_included: false;
  raw_provider_output_included: false;
  hidden_reasoning_included: false;
  credential_or_secret_included: false;
  absolute_local_path_included: false;
  actor_identity_included: false;
}

export interface StrategyCompositionAuthoritySummaryV01 {
  is_canonical_core_record: false;
  is_accepted_strategy: false;
  is_evidence: false;
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
  claims_verified_benefit: false;
  claims_causal_contribution: false;
  claims_general_harm: false;
  promotes_component_or_strategy: false;
  notes: string[];
}

export interface StrategyCompositionIntegrityV01 {
  algorithm: "sha256";
  canonicalization: typeof STRATEGY_COMPOSITION_CANONICALIZATION_V01;
  fingerprint_scope: "object_without_integrity_fingerprint";
  fingerprint: string;
}

export interface StrategyCompositionCaseV01 {
  case_version: typeof STRATEGY_COMPOSITION_CASE_VERSION_V01;
  case_id: string;
  case_kind: "derived_rebuildable_offline_research_case";
  case_binding: StrategyCompositionCaseBindingV01;
  source_refs: StrategyCompositionSourceBindingV01[];
  components: StrategyComponentCandidateV01[];
  role_bindings: StrategyCompositionRoleBindingV01[];
  relations: StrategyCompositionRelationV01[];
  evaluation_design: StrategyCompositionEvaluationDesignV01;
  limitations: string[];
  missingness: string[];
  scalar_fitness_created: false;
  material_boundary: StrategyCompositionMaterialBoundaryV01;
  authority_summary: StrategyCompositionAuthoritySummaryV01;
  integrity: StrategyCompositionIntegrityV01;
}
