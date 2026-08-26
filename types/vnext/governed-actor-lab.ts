import type { ExternalRefTrustClassV01 } from "./external-ref";
import type {
  StrategyCompositionCaseReferenceV01,
  StrategyCompositionRoleV01,
} from "./strategy-composition-case";

export const GOVERNED_ACTOR_LAB_EXPERIMENT_VERSION_V01 =
  "governed_actor_lab_experiment.v0.1" as const;
export const GOVERNED_ACTOR_LAB_ACTOR_VERSION_V01 =
  "governed_actor_lab_actor_snapshot.v0.1" as const;
export const GOVERNED_ACTOR_LAB_MEMORY_VERSION_V01 =
  "governed_actor_lab_private_memory.v0.1" as const;
export const GOVERNED_ACTOR_LAB_EPISODE_VERSION_V01 =
  "governed_actor_lab_episode.v0.1" as const;
export const GOVERNED_ACTOR_LAB_REPORT_VERSION_V01 =
  "governed_actor_lab_report.v0.1" as const;
export const GOVERNED_ACTOR_LAB_PROMOTION_VERSION_V01 =
  "governed_actor_lab_promotion_candidate.v0.1" as const;
export const GOVERNED_ACTOR_LAB_CANONICALIZATION_V01 =
  "augnes-json-c14n-v0_1" as const;
export const GOVERNED_ACTOR_LAB_GENERATION_ZERO_SIZE_V01 = 4 as const;
export const GOVERNED_ACTOR_LAB_FINAL_GENERATION_V01 = 2 as const;
export const GOVERNED_ACTOR_LAB_ROOT_V01 =
  ".augnes-lab/perspective-evolution" as const;

export const GOVERNED_ACTOR_LAB_BASELINE_ARMS_V01 = [
  "single_strong_actor",
  "nonpersistent_compute_matched_ensemble",
  "persistent_population_no_evolution",
  "persistent_evolutionary_population",
  "disposable_curated_knowledge",
] as const;

export type GovernedActorLabBaselineArmV01 =
  (typeof GOVERNED_ACTOR_LAB_BASELINE_ARMS_V01)[number];

export type GovernedActorLabGenerationV01 = 0 | 1 | 2;
export type GovernedActorLabMemoryOperationV01 =
  | "add"
  | "revise"
  | "supersede"
  | "retract"
  | "no_change";
export type GovernedActorLabMemoryItemStatusV01 =
  | "current"
  | "superseded"
  | "retracted"
  | "quarantined";
export type GovernedActorLabMutationUnitV01 =
  | "procedural_operator_policy"
  | "evidence_retrieval_policy"
  | "memory_policy"
  | "orchestration_policy"
  | "strategy_component_recipe";
export type GovernedActorLabPromotionUnitV01 = GovernedActorLabMutationUnitV01;

export interface GovernedActorLabIntegrityV01 {
  algorithm: "sha256";
  canonicalization: typeof GOVERNED_ACTOR_LAB_CANONICALIZATION_V01;
  fingerprint_scope: "object_without_integrity_fingerprint";
  fingerprint: string;
}

export interface GovernedActorLabAuthoritySummaryV01 {
  is_canonical_core_record: false;
  is_product_actor: false;
  is_personal_perspective: false;
  is_project_perspective: false;
  is_reviewed_product_memory: false;
  is_evidence: false;
  is_claim: false;
  is_accepted_strategy: false;
  is_policy: false;
  is_task_context_packet: false;
  is_episode_delta_proposal: false;
  is_review_decision: false;
  is_transition: false;
  writes_product_database: false;
  reads_product_database: false;
  mutates_product_state: false;
  mutates_task_context: false;
  activates_policy: false;
  authorizes_execution: false;
  authorizes_provider_calls: false;
  authorizes_network_use: false;
  authorizes_external_actuation: false;
  authorizes_git_or_github_mutation: false;
  authorizes_publication: false;
  authorizes_merge: false;
  creates_scalar_fitness_or_ranking: false;
  creates_global_winner: false;
  promotes_actor_or_component: false;
  notes: string[];
}

export interface GovernedActorLabMaterialBoundaryV01 {
  bounded: true;
  max_actors_per_generation: 4;
  max_generations: 3;
  max_memory_items_per_actor: 16;
  max_memory_item_characters: 800;
  max_source_refs_per_item: 8;
  max_challenge_rounds: 1;
  max_text_characters: 1600;
  raw_prompt_included: false;
  raw_transcript_included: false;
  raw_terminal_output_included: false;
  raw_provider_output_included: false;
  hidden_reasoning_included: false;
  credential_or_secret_included: false;
  absolute_local_path_included: false;
}

export interface GovernedActorLabVersionBindingV01 {
  version: string;
  fingerprint: string;
}

export interface GovernedActorLabSyntheticSourceV01 {
  source_id: string;
  source_fingerprint: string;
  task_family_key: string;
  available_at: string;
  trust_class: ExternalRefTrustClassV01;
}

export interface GovernedActorLabToolManifestV01 {
  manifest_version: "governed_actor_lab_tool_manifest.v0.1";
  manifest_id: string;
  actor_operation: "read_exact_synthetic_source";
  allowed_source_refs: GovernedActorLabSyntheticSourceV01[];
  filesystem_scope: "exact_synthetic_sources_only";
  write_scope: "lab_artifact_store_only_by_runner";
  shell_allowed: false;
  git_or_github_allowed: false;
  product_database_allowed: false;
  browser_or_companion_mutation_allowed: false;
  task_context_mutation_allowed: false;
  network_allowed: false;
  provider_or_model_gateway_allowed: false;
  credential_access_allowed: false;
  os_wide_read_allowed: false;
  external_actuation_allowed: false;
  mutation_may_expand_scope: false;
  integrity: GovernedActorLabIntegrityV01;
}

export interface GovernedActorLabBudgetEnvelopeV01 {
  budget_version: "governed_actor_lab_equal_budget.v0.1";
  budget_id: string;
  provider_call_limit: 0;
  network_call_limit: 0;
  external_effect_limit: 0;
  tool_read_limit: number;
  step_limit: number;
  token_limit: 0;
  cost_microunits_limit: 0;
  equal_for_all_baseline_arms: true;
  equal_budget_is_equal_capability: false;
  integrity: GovernedActorLabIntegrityV01;
}

export interface GovernedActorLabExperimentManifestV01 {
  experiment_version: typeof GOVERNED_ACTOR_LAB_EXPERIMENT_VERSION_V01;
  experiment_id: string;
  experiment_kind: "isolated_deterministic_offline_actor_lab";
  experiment_scope: {
    workspace_id: string;
    project_id: string;
    synthetic: true;
    case_family_key: string;
    development_case_ids: string[];
    decision_time_cutoff: string;
  };
  hidden_holdout: {
    holdout_id: string;
    holdout_fingerprint: string;
    content_in_manifest: false;
    readable_phase: "frozen_generation_two_evaluation_only";
  };
  population: {
    generation_zero_size: typeof GOVERNED_ACTOR_LAB_GENERATION_ZERO_SIZE_V01;
    final_generation: typeof GOVERNED_ACTOR_LAB_FINAL_GENERATION_V01;
    generation_zero_actor_ids: string[];
    initial_population: GovernedActorLabInitialPopulationSpecificationV01;
    whole_actor_mutation_enabled: false;
    actor_identity_scope: "experiment_local";
  };
  evaluator: GovernedActorLabVersionBindingV01;
  actor_engine: GovernedActorLabVersionBindingV01;
  memory_policy: GovernedActorLabVersionBindingV01;
  mutation_policy: GovernedActorLabVersionBindingV01;
  tool_manifest: GovernedActorLabToolManifestV01;
  compute_budget: GovernedActorLabBudgetEnvelopeV01;
  deterministic_seed: string;
  lab_root: typeof GOVERNED_ACTOR_LAB_ROOT_V01;
  artifact_scope: "experiment_and_actor_scoped";
  authority_summary: GovernedActorLabAuthoritySummaryV01;
  material_boundary: GovernedActorLabMaterialBoundaryV01;
  integrity: GovernedActorLabIntegrityV01;
}

export interface GovernedActorLabMemorySnapshotReferenceV01 {
  memory_snapshot_id: string;
  memory_snapshot_fingerprint: string;
}

export interface GovernedActorLabMemoryItemReferenceV01 {
  memory_item_id: string;
  memory_item_fingerprint: string;
}

export interface GovernedActorLabEvaluationReferenceV01 {
  evaluation_id: string;
  evaluation_fingerprint: string;
}

export interface GovernedActorLabInterventionEvaluationReferenceV01 {
  intervention_id: string;
  intervention_fingerprint: string;
}

export interface GovernedActorLabHarmObservationReferenceV01 {
  observation_id: string;
  observation_fingerprint: string;
  observation_kind: "baseline_arm_harm" | "hidden_holdout_harm";
}

export interface GovernedActorLabActorSnapshotReferenceV01 {
  actor_snapshot_id: string;
  actor_snapshot_fingerprint: string;
}

export interface GovernedActorLabActorProfileV01 {
  procedural_operator_policy:
    | "verification_first"
    | "scope_sentinel"
    | "counterexample_search"
    | "bounded_synthesis";
  evidence_retrieval_policy:
    | "support_and_currentness"
    | "scope_and_conflict"
    | "falsifier_and_harm"
    | "minimal_sufficient_set";
  memory_policy:
    | "strict_source_only"
    | "revision_preferred"
    | "quarantine_first"
    | "minimal_retention";
  orchestration_policy:
    | "verify_then_solve"
    | "bound_then_solve"
    | "challenge_then_narrow"
    | "synthesize_then_abstain";
  role_bindings: StrategyCompositionRoleV01[];
  strategy_recipe_refs: StrategyCompositionCaseReferenceV01[];
}

export interface GovernedActorLabInitialPopulationSpecificationV01 {
  specification_version: "governed_actor_lab_initial_population.v0.1";
  specification_id: string;
  actors: Array<{
    lab_actor_id: string;
    profile: GovernedActorLabActorProfileV01;
  }>;
  provider_or_model_identity_bound: false;
  product_actor_identity_created: false;
  integrity: GovernedActorLabIntegrityV01;
}

export interface GovernedActorLabMutationReferenceV01 {
  mutation_id: string;
  mutation_fingerprint: string;
  unit: GovernedActorLabMutationUnitV01;
}

export interface GovernedActorLabActorSnapshotV01 {
  actor_version: typeof GOVERNED_ACTOR_LAB_ACTOR_VERSION_V01;
  lab_actor_id: string;
  actor_snapshot_id: string;
  experiment_id: string;
  generation: GovernedActorLabGenerationV01;
  parent_actor_ref: GovernedActorLabActorSnapshotReferenceV01 | null;
  lineage_fingerprint: string;
  profile: GovernedActorLabActorProfileV01;
  private_memory: GovernedActorLabMemorySnapshotReferenceV01;
  mutation_refs: GovernedActorLabMutationReferenceV01[];
  capability_ceiling_fingerprint: string;
  tool_manifest_fingerprint: string;
  state_frozen: true;
  authority_summary: GovernedActorLabAuthoritySummaryV01;
  integrity: GovernedActorLabIntegrityV01;
}

export interface GovernedActorLabMemoryItemV01 {
  memory_item_id: string;
  memory_item_fingerprint: string;
  experiment_id: string;
  lab_actor_id: string;
  episode_id: string;
  origin_candidate_id: string;
  item_kind: "procedural_operator_memory" | "evidence_retrieval_memory";
  bounded_content: string;
  task_family_key: string;
  applicability: string;
  uncertainty: string[];
  limitations: string[];
  source_refs: GovernedActorLabSyntheticSourceV01[];
  support_status: "support_validated" | "unknown" | "refused";
  status: GovernedActorLabMemoryItemStatusV01;
  supersedes_memory_item_id: string | null;
  superseded_by_memory_item_id: string | null;
  retracts_memory_item_id: string | null;
  inherited_from_memory_item_ref: GovernedActorLabMemoryItemReferenceV01 | null;
  intervention_evaluation_ref: GovernedActorLabInterventionEvaluationReferenceV01 | null;
  quarantine_reasons: string[];
  directive_shaped_material: false;
  hidden_holdout_material: false;
}

export interface GovernedActorLabPrivateMemorySnapshotV01 {
  memory_version: typeof GOVERNED_ACTOR_LAB_MEMORY_VERSION_V01;
  memory_snapshot_id: string;
  experiment_id: string;
  lab_actor_id: string;
  generation: GovernedActorLabGenerationV01;
  parent_snapshot: GovernedActorLabMemorySnapshotReferenceV01 | null;
  items: GovernedActorLabMemoryItemV01[];
  item_count: number;
  consultation_required_before_write: true;
  cross_actor_read_allowed: false;
  cross_experiment_read_allowed: false;
  product_memory_accessed: false;
  authority_summary: GovernedActorLabAuthoritySummaryV01;
  integrity: GovernedActorLabIntegrityV01;
}

export interface GovernedActorLabMemoryCandidateV01 {
  candidate_id: string;
  experiment_id: string;
  lab_actor_id: string;
  episode_id: string;
  requested_operation: GovernedActorLabMemoryOperationV01;
  target_memory_item_id: string | null;
  item_kind: GovernedActorLabMemoryItemV01["item_kind"];
  bounded_content: string;
  task_family_key: string;
  applicability: string;
  uncertainty: string[];
  limitations: string[];
  source_refs: GovernedActorLabSyntheticSourceV01[];
  evidence_class: ExternalRefTrustClassV01;
  evidence_basis:
    | "self_assertion"
    | "evaluator_preference"
    | "source_verification"
    | "matched_intervention"
    | "negative_verdict"
    | "unsupported";
  intervention_evaluation_ref: GovernedActorLabInterventionEvaluationReferenceV01 | null;
  support_status: "support_validated" | "unknown" | "refused";
  directive_shaped_material: boolean;
  hidden_holdout_material: boolean;
}

export interface GovernedActorLabMemoryAdmissionV01 {
  admission_id: string;
  candidate_id: string;
  experiment_id: string;
  lab_actor_id: string;
  episode_id: string;
  consulted_memory_snapshot: GovernedActorLabMemorySnapshotReferenceV01;
  operation: GovernedActorLabMemoryOperationV01;
  permission:
    | "permitted"
    | "candidate_unknown"
    | "refused"
    | "quarantined";
  created_memory_item_id: string | null;
  affected_memory_item_ids: string[];
  duplicate_detected: boolean;
  quarantine_reasons: string[];
  evaluation_frozen_before_admission: true;
  durable_write_phase: "post_episode_only";
  resulting_memory_snapshot: GovernedActorLabMemorySnapshotReferenceV01;
}

export interface GovernedActorLabItemTraceV01 {
  memory_item_id: string;
  eligible: boolean;
  retrieved: boolean;
  presented: boolean;
  cited_or_referenced: boolean;
  support_validated: boolean;
  outcome_associated: boolean;
  causal_contribution:
    | "matched_intervention_supported"
    | "unknown_no_intervention";
  intervention_evaluation_ref: GovernedActorLabInterventionEvaluationReferenceV01 | null;
  source_refs: GovernedActorLabSyntheticSourceV01[];
  limitations: string[];
}

export interface GovernedActorLabActorEpisodeV01 {
  lab_actor_id: string;
  frozen_actor_snapshot: GovernedActorLabActorSnapshotReferenceV01;
  frozen_memory_snapshot: GovernedActorLabMemorySnapshotReferenceV01;
  blind_solve: {
    case_id: string;
    peer_solution_visible: false;
    hidden_holdout_visible: false;
    memory_write_count: 0;
    retrieved_memory_item_ids: string[];
    claim_refs: string[];
  };
  challenge: {
    round: 1;
    peer_artifact_id: string;
    peer_actor_id: string;
    memory_write_count: 0;
  };
  synthesis: {
    synthesis_id: string;
    bounded: true;
    memory_write_count: 0;
    creates_product_decision: false;
    creates_product_transition: false;
  };
  item_traces: GovernedActorLabItemTraceV01[];
}

export interface GovernedActorLabInterventionEvaluationV01 {
  intervention_id: string;
  experiment_id: string;
  episode_id: string;
  evaluation_id: string;
  lab_actor_id: string;
  memory_item_ref: GovernedActorLabMemoryItemReferenceV01;
  task_family_key: string;
  source_ref: GovernedActorLabSyntheticSourceV01;
  intervention_kind: "memory_item_present_vs_absent";
  control: {
    memory_item_present: false;
    support_validated: false;
    outcome_associated: false;
  };
  treatment: {
    memory_item_present: true;
    support_validated: true;
    outcome_associated: true;
  };
  same_actor: true;
  same_case: true;
  same_evaluator: true;
  causal_scope: "exact_item_exact_episode_only";
  general_causal_contribution_claimed: false;
  integrity: GovernedActorLabIntegrityV01;
}

export interface GovernedActorLabOutcomeVectorV01 {
  verification: {
    hard_gate_failure: boolean | null;
    hard_gate_failure_codes: string[];
    required_checks_passed: number | null;
    support_validated_claims: number | null;
    unsupported_claims: number | null;
  };
  holdout: {
    cases_passed: number | null;
    cases_failed: number | null;
    unknown: number | null;
  };
  memory: {
    eligible: number | null;
    retrieved: number | null;
    presented: number | null;
    cited_or_referenced: number | null;
    support_validated: number | null;
    outcome_associated: number | null;
    matched_intervention_contribution: number | null;
    quarantined: number | null;
  };
  contribution: {
    unique_useful_contribution: number | null;
    basis: "matched_intervention" | "unavailable";
  };
  harm: {
    harmful_transfer_candidates: number | null;
    poisoning_refusals: number | null;
    stream_interference_candidates: number | null;
  };
  burden: {
    challenge_count: number | null;
    synthesis_count: number | null;
    review_operations: number | null;
  };
  compute: {
    provider_calls: 0;
    network_calls: 0;
    tool_reads: number | null;
    deterministic_steps: number | null;
    tokens: 0;
    cost_microunits: 0;
    external_effects: 0;
  };
  missing_dimensions: string[];
}

export interface GovernedActorLabEpisodeArtifactV01 {
  episode_version: typeof GOVERNED_ACTOR_LAB_EPISODE_VERSION_V01;
  episode_id: string;
  experiment_id: string;
  generation: GovernedActorLabGenerationV01;
  case_id: string;
  phase_order: [
    "blind_solve",
    "challenge_round_1",
    "bounded_synthesis",
    "evaluation_freeze",
    "post_episode_memory_admission",
  ];
  memory_snapshots_frozen_at_start: true;
  challenge_round_count: 1;
  actor_episodes: GovernedActorLabActorEpisodeV01[];
  evaluation: {
    evaluation_id: string;
    evaluation_fingerprint: string;
    evaluator_fingerprint: string;
    frozen: true;
    frozen_before_memory_admission: true;
    actor_outcomes: Array<{
      lab_actor_id: string;
      outcome: GovernedActorLabOutcomeVectorV01;
      complete: boolean;
    }>;
    intervention_evaluations: GovernedActorLabInterventionEvaluationV01[];
  };
  memory_admissions: GovernedActorLabMemoryAdmissionV01[];
  product_effects: GovernedActorLabProductEffectLedgerV01;
  integrity: GovernedActorLabIntegrityV01;
}

export interface GovernedActorLabMutationV01 {
  mutation_id: string;
  experiment_id: string;
  parent_actor_snapshot: GovernedActorLabActorSnapshotReferenceV01;
  child_generation: 1 | 2;
  unit: GovernedActorLabMutationUnitV01;
  deterministic_seed_basis: string;
  mutation_budget_units: 1;
  changed_from: string;
  changed_to: string;
  evaluator_changed: false;
  holdout_changed: false;
  tool_manifest_changed: false;
  capability_scope_expanded: false;
  whole_actor_profile_mutated: false;
  integrity: GovernedActorLabIntegrityV01;
}

export interface GovernedActorLabPopulationTransitionV01 {
  transition_id: string;
  experiment_id: string;
  from_generation: 0 | 1;
  to_generation: 1 | 2;
  hard_gate_excluded_actor_ids: string[];
  non_dominated_actor_ids: string[];
  conservatively_preserved_actor_ids: string[];
  diversity_preserved: true;
  deterministic_ties: true;
  ordinal_ranking_created: false;
  global_winner_created: false;
  product_promotion_created: false;
  selection_evaluation_ref: GovernedActorLabEvaluationReferenceV01;
  parent_post_episode_memory_refs: Array<{
    lab_actor_id: string;
    memory: GovernedActorLabMemorySnapshotReferenceV01;
  }>;
  child_start_memory_refs: Array<{
    lab_actor_id: string;
    parent_lab_actor_id: string;
    memory: GovernedActorLabMemorySnapshotReferenceV01;
  }>;
  branch_memory_policy: "inherit_admissible_private_memory";
  branch_memory_reset_intervention: false;
  mutations: GovernedActorLabMutationV01[];
  child_actor_refs: GovernedActorLabActorSnapshotReferenceV01[];
  integrity: GovernedActorLabIntegrityV01;
}

export interface GovernedActorLabHoldoutFixtureV01 {
  holdout_id: string;
  holdout_fingerprint: string;
  content: {
    cases: Array<{
      case_id: string;
      task_family_key: string;
      required_policy_signal: GovernedActorLabActorProfileV01["procedural_operator_policy"];
      harmful_transfer_trap: boolean;
    }>;
  };
}

export interface GovernedActorLabCuratedKnowledgeInputV01 {
  curated_input_version: "governed_actor_lab_curated_knowledge.v0.1";
  curated_input_id: string;
  construction: "deterministic_pre_cutoff_source_compilation";
  items: Array<{
    source_ref: GovernedActorLabSyntheticSourceV01;
    procedural_operator_policy: GovernedActorLabActorProfileV01["procedural_operator_policy"];
    evidence_retrieval_policy: GovernedActorLabActorProfileV01["evidence_retrieval_policy"];
  }>;
  persistent_actor_private_memory: false;
  mutation_or_evolution: false;
  hidden_holdout_material_included: false;
  provider_or_model_material_included: false;
  integrity: GovernedActorLabIntegrityV01;
}

export interface GovernedActorLabBaselineActorHardGateObservationV01 {
  episode_evaluation_ref: GovernedActorLabEvaluationReferenceV01;
  observation_index: number;
  lab_actor_id: string;
  complete: boolean;
  hard_gate_failure: boolean | null;
  hard_gate_failure_codes: string[];
  population_selection_excluded: boolean;
  observed_compute: {
    provider_calls: 0;
    network_calls: 0;
    tool_reads: number | null;
    deterministic_steps: number | null;
    tokens: 0;
    cost_microunits: 0;
    external_effects: 0;
  };
}

export type GovernedActorLabArmHardGateCodeV01 =
  | "no_valid_population"
  | "required_evaluation_incomplete"
  | "exact_budget_mismatch"
  | "holdout_leakage"
  | "capability_or_authority_violation"
  | "forbidden_product_provider_network_effect";

export interface GovernedActorLabBaselineArmHardGateV01 {
  arm_completed: boolean;
  arm_level_hard_gate_failure: boolean;
  arm_level_hard_gate_failure_codes: GovernedActorLabArmHardGateCodeV01[];
  actor_hard_gate_failure_count: number;
  population_selection_exclusion_count: number;
  valid_actor_observation_count: number;
  basis: "derived_from_serialized_actor_and_compute_observations";
}

export interface GovernedActorLabBaselineComputeAccountingV01 {
  accounting_basis: "sum_of_executed_actor_observations";
  all_required_dimensions_observed: boolean;
  provider_calls: 0;
  network_calls: 0;
  tool_reads: number;
  deterministic_steps: number;
  tokens: 0;
  cost_microunits: 0;
  external_effects: 0;
  exact_budget_match: boolean;
}

export interface GovernedActorLabBaselineObservationV01 {
  baseline_version: "governed_actor_lab_baseline_observation.v0.1";
  observation_id: string;
  arm: GovernedActorLabBaselineArmV01;
  experiment_id: string;
  manifest_ref: {
    experiment_id: string;
    experiment_fingerprint: string;
  };
  evaluator: GovernedActorLabVersionBindingV01;
  actor_engine: GovernedActorLabVersionBindingV01;
  development_case_sequence: GovernedActorLabSyntheticSourceV01[];
  hidden_holdout_ref: {
    holdout_id: string;
    holdout_fingerprint: string;
  };
  budget_id: string;
  budget_fingerprint: string;
  deterministic_seed: string;
  arm_seed: string;
  exact_budget_match: boolean;
  comparable: boolean;
  comparison_status: "comparable" | "non_comparable";
  non_comparable_reasons: string[];
  persistent_memory: boolean;
  mutation_enabled: boolean;
  curated_knowledge: boolean;
  execution: {
    episode_count: 3;
    actor_count: number;
    memory_reset_count: number;
    memory_persistence_setting: "none" | "private_cross_episode";
    mutation_setting: "none" | "g0_to_g1_to_g2";
    curated_input_refs: GovernedActorLabSyntheticSourceV01[];
    curated_input: GovernedActorLabCuratedKnowledgeInputV01 | null;
    single_actor_repetitions: number;
    episode_evaluation_refs: GovernedActorLabEvaluationReferenceV01[];
    actor_hard_gate_observations: GovernedActorLabBaselineActorHardGateObservationV01[];
    arm_hard_gate: GovernedActorLabBaselineArmHardGateV01;
    compute_accounting: GovernedActorLabBaselineComputeAccountingV01;
    transition_refs: Array<{
      transition_id: string;
      transition_fingerprint: string;
    }>;
  };
  outcome: GovernedActorLabOutcomeVectorV01;
  complete: boolean;
  mechanics_only: true;
  limitations: string[];
  integrity: GovernedActorLabIntegrityV01;
}

export interface GovernedActorLabPromotionCandidateV01 {
  promotion_version: typeof GOVERNED_ACTOR_LAB_PROMOTION_VERSION_V01;
  promotion_candidate_id: string;
  experiment_id: string;
  generation: GovernedActorLabGenerationV01;
  actor_lineage_refs: GovernedActorLabActorSnapshotReferenceV01[];
  unit: GovernedActorLabPromotionUnitV01;
  unit_ref: string;
  supporting_evaluation_refs: GovernedActorLabEvaluationReferenceV01[];
  harm_and_negative_transfer_refs: GovernedActorLabHarmObservationReferenceV01[];
  limitations: string[];
  unknowns: string[];
  target_scope: string;
  whole_actor_profile: false;
  creates_episode_delta_proposal: false;
  authority_summary: GovernedActorLabAuthoritySummaryV01;
  integrity: GovernedActorLabIntegrityV01;
}

export interface GovernedActorLabProductEffectLedgerV01 {
  core_reads: 0;
  core_writes: 0;
  product_database_reads: 0;
  product_database_writes: 0;
  task_context_writes: 0;
  proposal_writes: 0;
  review_decision_writes: 0;
  transition_writes: 0;
  policy_activations: 0;
  provider_or_model_calls: 0;
  network_calls: 0;
  git_or_github_runtime_mutations: 0;
  external_effects: 0;
}

export interface GovernedActorLabReportV01 {
  report_version: typeof GOVERNED_ACTOR_LAB_REPORT_VERSION_V01;
  report_id: string;
  report_kind: "deterministic_mechanics_and_substrate_proof";
  experiment_id: string;
  manifest_ref: {
    experiment_id: string;
    experiment_fingerprint: string;
  };
  evaluator: GovernedActorLabVersionBindingV01;
  actor_engine: GovernedActorLabVersionBindingV01;
  development_case_sequence: GovernedActorLabSyntheticSourceV01[];
  compute_budget: GovernedActorLabBudgetEnvelopeV01;
  generation_actor_refs: Array<{
    generation: GovernedActorLabGenerationV01;
    actors: GovernedActorLabActorSnapshotReferenceV01[];
  }>;
  episode_refs: Array<{
    episode_id: string;
    episode_fingerprint: string;
  }>;
  episode_evaluation_refs: GovernedActorLabEvaluationReferenceV01[];
  population_transitions: GovernedActorLabPopulationTransitionV01[];
  hidden_holdout_evaluation: {
    evaluation_id: string;
    evaluation_fingerprint: string;
    holdout_id: string;
    holdout_fingerprint: string;
    actor_state_frozen_before_read: true;
    mutation_state_frozen_before_read: true;
    leakage_detected: false;
    outcome: GovernedActorLabOutcomeVectorV01;
  };
  baselines: GovernedActorLabBaselineObservationV01[];
  non_dominance: {
    status: "determined" | "undetermined";
    non_dominated_arms: GovernedActorLabBaselineArmV01[];
    dominated_relations: Array<{
      dominant_arm: GovernedActorLabBaselineArmV01;
      dominated_arm: GovernedActorLabBaselineArmV01;
      basis:
        | "hard_gate_non_compensation"
        | "all_observed_dimensions_no_worse_and_one_better";
    }>;
    tradeoff_pairs: string[];
    incomplete_evidence_preserved: boolean;
    ordinal_ranking_created: false;
    global_winner_created: false;
  };
  persistence_benefit_candidate: {
    status: "supported_mechanics_candidate" | "mixed" | "inconclusive";
    comparison_arms: [
      "nonpersistent_compute_matched_ensemble",
      "persistent_population_no_evolution",
    ];
    verified_general_benefit: false;
  };
  evolution_benefit_candidate: {
    status: "supported_mechanics_candidate" | "mixed" | "inconclusive";
    comparison_arms: [
      "persistent_population_no_evolution",
      "persistent_evolutionary_population",
    ];
    verified_general_benefit: false;
  };
  signals: {
    poisoning_refusals: number;
    quarantined_items_retrieved: 0;
    harmful_transfer_candidates: number;
    stream_interference_candidates: number;
    diversity_collapse: boolean;
    evaluator_overfit: "not_observed_in_fixture" | "candidate" | "unknown";
    error_recovery: "deterministic_replay_available";
  };
  promotion_candidates: GovernedActorLabPromotionCandidateV01[];
  product_effects: GovernedActorLabProductEffectLedgerV01;
  mechanics_proof_only: true;
  empirical_llm_evolution_benefit_proven: false;
  limitations: string[];
  unknowns: string[];
  authority_summary: GovernedActorLabAuthoritySummaryV01;
  material_boundary: GovernedActorLabMaterialBoundaryV01;
  integrity: GovernedActorLabIntegrityV01;
}

export interface GovernedActorLabPilotResultV01 {
  manifest: GovernedActorLabExperimentManifestV01;
  generations: Array<{
    generation: GovernedActorLabGenerationV01;
    actors_at_episode_start: GovernedActorLabActorSnapshotV01[];
    memories_at_episode_start: GovernedActorLabPrivateMemorySnapshotV01[];
    post_episode_memories: GovernedActorLabPrivateMemorySnapshotV01[];
  }>;
  episodes: GovernedActorLabEpisodeArtifactV01[];
  transitions: GovernedActorLabPopulationTransitionV01[];
  report: GovernedActorLabReportV01;
}
