import type { ExternalRefV01 } from "./external-ref";
import type {
  GovernedActorLabActorProfileV01,
  GovernedActorLabBaselineArmV01,
  GovernedActorLabIntegrityV01,
  GovernedActorLabMemoryAdmissionV01,
  GovernedActorLabPopulationTransitionV01,
} from "./governed-actor-lab";
import type {
  ModelGatewayCostBudgetV01,
  ModelInvocationReceiptUsageV02,
  ModelInvocationReceiptV02,
} from "./model-invocation-receipt";

export const GOVERNED_ACTOR_LAB_LIVE_COHORT_VERSION_V01 =
  "governed_actor_lab_live_cohort.v0.1" as const;
export const GOVERNED_ACTOR_LAB_LIVE_CASEBOOK_VERSION_V01 =
  "governed_actor_lab_live_casebook.v0.1" as const;
export const GOVERNED_ACTOR_LAB_LIVE_CODEC_VERSION_V01 =
  "governed_actor_lab_live_codec.v0.1" as const;
export const GOVERNED_ACTOR_LAB_LIVE_REPORT_VERSION_V01 =
  "governed_actor_lab_live_report.v0.1" as const;
export const GOVERNED_ACTOR_LAB_LIVE_CALL_PLAN_VERSION_V01 =
  "governed_actor_lab_live_call_plan.v0.1" as const;
export const GOVERNED_ACTOR_LAB_LIVE_AGGREGATE_VERSION_V01 =
  "governed_actor_lab_live_aggregate.v0.1" as const;

export const GOVERNED_ACTOR_LAB_LIVE_PHASES_V01 = [
  "blind_solve",
  "challenge_synthesis",
] as const;

export type GovernedActorLabLivePhaseV01 =
  (typeof GOVERNED_ACTOR_LAB_LIVE_PHASES_V01)[number];

export interface GovernedActorLabLiveAuthorityBoundaryV01 {
  gateway_authorization_project_is_lab_experiment_meaning: false;
  lab_reads_product_database_for_actor_cognition: false;
  gateway_identity_selection_reads_allowed: true;
  product_database_writes: 0;
  core_writes: 0;
  task_context_writes: 0;
  episode_delta_proposal_writes: 0;
  review_decision_writes: 0;
  transition_writes: 0;
  personal_perspective_mutations: 0;
  policy_activations: 0;
  git_or_github_runtime_mutations: 0;
  provider_egress_only_through_model_gateway: true;
  model_output_is_evidence: false;
  model_output_is_accepted_claim: false;
  model_output_is_durable_memory: false;
  model_output_is_accepted_strategy: false;
  model_output_is_policy: false;
  model_output_is_decision: false;
  model_output_is_transition: false;
  provider_model_identity_is_lab_actor_identity: false;
  pairwise_better_is_global_winner: false;
  live_cohort_advantage_is_verified_general_benefit: false;
  pareto_non_dominated_is_product_promotion: false;
  promotion_authority: false;
  execution_authority: false;
  semantic_authority: false;
  merge_authority: false;
}

export interface GovernedActorLabLiveEvidenceSnippetV01 {
  source_token: string;
  text: string;
  observed_at: string;
}

export interface GovernedActorLabLiveClaimCandidateV01 {
  claim_token: string;
  statement: string;
}

export interface GovernedActorLabLiveActorVisibleCaseV01 {
  case_id: string;
  case_fingerprint: string;
  task_family_key: string;
  task_text: string;
  evidence_snippets: GovernedActorLabLiveEvidenceSnippetV01[];
  claim_candidates: GovernedActorLabLiveClaimCandidateV01[];
  allowed_result_tokens: string[];
  uncertainty_tokens: string[];
  success_criteria: string[];
}

export interface GovernedActorLabLiveEvaluatorCaseV01 {
  expected_result_token: string;
  required_support_relations: Array<{
    claim_token: string;
    required_source_tokens: string[];
  }>;
  forbidden_claim_tokens: string[];
  abstention_required: boolean;
  required_checks: string[];
  harmful_transfer_trap: boolean;
  evaluator_answer_material_never_provider_visible: true;
}

export interface GovernedActorLabLiveCaseV01 {
  actor_visible: GovernedActorLabLiveActorVisibleCaseV01;
  evaluator_only: GovernedActorLabLiveEvaluatorCaseV01;
}

export interface GovernedActorLabLiveCasebookV01 {
  casebook_version: typeof GOVERNED_ACTOR_LAB_LIVE_CASEBOOK_VERSION_V01;
  casebook_id: string;
  construction_cutoff: string;
  source_material: "synthetic_public_safe";
  development_cases: [
    GovernedActorLabLiveCaseV01,
    GovernedActorLabLiveCaseV01,
    GovernedActorLabLiveCaseV01,
  ];
  hidden_holdout: {
    holdout_id: string;
    holdout_fingerprint: string;
    cases: [
      GovernedActorLabLiveCaseV01,
      GovernedActorLabLiveCaseV01,
      GovernedActorLabLiveCaseV01,
      GovernedActorLabLiveCaseV01,
    ];
    actor_visible_materialization:
      "after_all_development_actor_and_mutation_state_frozen";
    evaluator_answers_provider_visible: false;
  };
  real_user_or_project_data_included: false;
  integrity: GovernedActorLabIntegrityV01;
}

export interface GovernedActorLabLivePrivateMemoryMaterialV01 {
  memory_item_ref: string;
  bounded_content: string;
  applicability: string;
  uncertainty: string[];
  limitations: string[];
  support_status: "support_validated";
}

export interface GovernedActorLabLiveCuratedMaterialV01 {
  curated_item_ref: string;
  bounded_content: string;
  source_tokens: string[];
  construction_cutoff_observed: true;
}

export interface GovernedActorLabLivePeerArtifactV01 {
  peer_artifact_ref: string;
  peer_slot: string;
  result_token: string;
  claim_candidates: Array<{
    claim_token: string;
    source_tokens: string[];
  }>;
  uncertainties: string[];
  abstention: boolean;
  normalized_output_fingerprint: string;
}

export interface GovernedActorLabLiveModelInputV01 {
  input_kind: "governed_actor_lab";
  codec_version: typeof GOVERNED_ACTOR_LAB_LIVE_CODEC_VERSION_V01;
  phase: GovernedActorLabLivePhaseV01;
  invocation_context: {
    cohort_ref: string;
    arm: GovernedActorLabBaselineArmV01;
    generation: 0 | 1 | 2 | "holdout";
    episode_or_holdout_index: number;
    actor_slot: string;
    frozen_actor_ref: string;
  };
  actor_profile: Pick<
    GovernedActorLabActorProfileV01,
    | "procedural_operator_policy"
    | "evidence_retrieval_policy"
    | "memory_policy"
    | "orchestration_policy"
  >;
  actor_visible_case: GovernedActorLabLiveActorVisibleCaseV01;
  admitted_private_memory: GovernedActorLabLivePrivateMemoryMaterialV01[];
  curated_knowledge: GovernedActorLabLiveCuratedMaterialV01[];
  own_blind_artifact: GovernedActorLabLivePeerArtifactV01 | null;
  peer_challenge_artifact: GovernedActorLabLivePeerArtifactV01 | null;
  authority_notice: {
    output_is_candidate_only: true;
    source_tokens_must_be_supplied: true;
    memory_write_authorized: false;
    provider_route_control_authorized: false;
  };
}

export interface GovernedActorLabLiveModelOutputV01 {
  result_token: string;
  claim_candidates: Array<{
    claim_token: string;
    source_tokens: string[];
  }>;
  uncertainties: string[];
  abstention: boolean;
  challenge_response: {
    peer_claim_tokens_considered: string[];
    accepted_peer_claim_tokens: string[];
    rejected_peer_claim_tokens: string[];
  };
  synthesis_token: string;
}

export interface GovernedActorLabLiveRouteV01 {
  gateway_version: "model_gateway.v0.1";
  purpose: "governed_actor_lab";
  provider_ref: ExternalRefV01;
  model_ref: ExternalRefV01;
  adapter_implementation_id: string;
  adapter_implementation_version: string;
  prepared_without_provider_egress: true;
  integrity_fingerprint: string;
}

export interface GovernedActorLabLiveCallPlanEntryV01 {
  call_order: number;
  call_slot_id: string;
  arm: GovernedActorLabBaselineArmV01;
  phase: GovernedActorLabLivePhaseV01;
  generation: 0 | 1 | 2 | "holdout";
  episode_or_holdout_index: number;
  actor_slot: string;
  case_id: string;
  case_fingerprint: string;
  peer_slot: string | null;
  max_input_bytes: number;
  max_output_tokens: number;
  timeout_ms: number;
}

export interface GovernedActorLabLiveCallPlanV01 {
  call_plan_version: typeof GOVERNED_ACTOR_LAB_LIVE_CALL_PLAN_VERSION_V01;
  planned_calls: 140;
  calls_per_arm: 28;
  development_calls_per_arm: 24;
  holdout_calls_per_arm: 4;
  retries: 0;
  max_parallel_provider_calls: 1;
  aggregate_provider_call_ceiling: 140;
  entries: GovernedActorLabLiveCallPlanEntryV01[];
  integrity: GovernedActorLabIntegrityV01;
}

export interface GovernedActorLabLiveCohortManifestV01 {
  cohort_version: typeof GOVERNED_ACTOR_LAB_LIVE_COHORT_VERSION_V01;
  cohort_id: string;
  cohort_count: 1;
  source_repository_head_sha: string;
  c1_experiment_ref: {
    experiment_id: string;
    experiment_fingerprint: string;
  };
  casebook_ref: {
    casebook_id: string;
    casebook_fingerprint: string;
  };
  development_case_sequence: Array<{
    case_id: string;
    case_fingerprint: string;
  }>;
  hidden_holdout_ref: {
    holdout_id: string;
    holdout_fingerprint: string;
  };
  exact_initial_population_fingerprint: string;
  evaluator_version: string;
  memory_policy_version: string;
  mutation_policy_version: string;
  gateway_version: "model_gateway.v0.1";
  gateway_purpose: "governed_actor_lab";
  gateway_codec_version: typeof GOVERNED_ACTOR_LAB_LIVE_CODEC_VERSION_V01;
  route: GovernedActorLabLiveRouteV01;
  call_plan_ref: {
    call_plan_fingerprint: string;
    planned_calls: 140;
  };
  limits: {
    max_input_bytes: number;
    max_output_tokens: number;
    timeout_ms: number;
    aggregate_provider_calls: 140;
    max_parallel_provider_calls: 1;
    retries: 0;
  };
  data_classification: "public_safe";
  provider_egress: "allow";
  retention_class: "none";
  raw_prompt_persisted: false;
  raw_response_persisted: false;
  hidden_reasoning_persisted: false;
  one_provider_model_adapter_route: true;
  stochastic_repeatability: "unmeasured_single_cohort";
  authority_boundary: GovernedActorLabLiveAuthorityBoundaryV01;
  integrity: GovernedActorLabIntegrityV01;
}

export type GovernedActorLabLiveInvocationStatusV01 =
  | "completed_live"
  | "refused"
  | "provider_rejected"
  | "malformed_response"
  | "timed_out"
  | "cancelled"
  | "transport_failed"
  | "source_token_invalid"
  | "route_changed"
  | "dependency_missing";

export interface GovernedActorLabLiveInvocationBindingV01 {
  binding_version: "governed_actor_lab_live_invocation_binding.v0.1";
  call_slot_id: string;
  call_order: number;
  cohort_id: string;
  arm: GovernedActorLabBaselineArmV01;
  generation: 0 | 1 | 2 | "holdout";
  actor_slot: string;
  lab_actor_id: string;
  phase: GovernedActorLabLivePhaseV01;
  case_id: string;
  case_fingerprint: string;
  frozen_actor_ref: string;
  frozen_private_memory_ref: string | null;
  curated_material_refs: string[];
  peer_artifact_ref: string | null;
  normalized_output: GovernedActorLabLiveModelOutputV01 | null;
  normalized_output_fingerprint: string | null;
  model_invocation_receipt: ModelInvocationReceiptV02 | null;
  model_invocation_receipt_fingerprint: string | null;
  provider_ref: ExternalRefV01;
  model_ref: ExternalRefV01;
  invocation_status: GovernedActorLabLiveInvocationStatusV01;
  usage: ModelInvocationReceiptUsageV02 | null;
  latency_ms: number | null;
  budget: {
    max_input_bytes: number;
    max_output_tokens: number;
    max_provider_calls: 1;
    timeout_ms: number;
    cost_budget?: ModelGatewayCostBudgetV01;
  };
  semantic_authority: false;
  product_authority: false;
  execution_authority: false;
  integrity: GovernedActorLabIntegrityV01;
}

export interface GovernedActorLabLiveEvaluationV01 {
  evaluation_id: string;
  evaluation_fingerprint: string;
  arm: GovernedActorLabBaselineArmV01;
  generation: 0 | 1 | 2 | "holdout";
  actor_slot: string;
  case_id: string;
  status: "pass" | "fail" | "unknown";
  hard_gate_failure: boolean | null;
  hard_gate_failure_codes: string[];
  required_checks_passed: number | null;
  required_checks_total: number;
  source_reference_coverage: number | null;
  support_validation_coverage: number | null;
  supported_claims: number | null;
  unsupported_claims: number | null;
  abstention_observed: boolean | null;
  harmful_transfer_candidate: boolean | null;
  missingness: string[];
  evaluator_model_calls: 0;
}

export interface GovernedActorLabLiveAggregateAccountingV01 {
  aggregate_version: typeof GOVERNED_ACTOR_LAB_LIVE_AGGREGATE_VERSION_V01;
  basis: "recomputed_from_model_invocation_receipts_and_local_refusals";
  planned_calls: 140;
  attempted_provider_calls: number;
  completed_live_calls: number;
  refused: number;
  provider_rejected: number;
  malformed_response: number;
  timed_out: number;
  cancelled: number;
  transport_failed: number;
  source_token_invalid: number;
  route_changed: number;
  dependency_missing: number;
  input_bytes: number;
  input_tokens_provider_reported: number | null;
  output_tokens_provider_reported: number | null;
  total_tokens_provider_reported: number | null;
  usage_receipts_reported: number;
  latency_ms_total: number;
  latency_ms_min: number | null;
  latency_ms_max: number | null;
  provider_model_consistent: boolean;
  output_token_ceiling: number;
  aggregate_provider_call_ceiling: 140;
  pricing_status: "unpriced_unknown" | "authority_present_provider_cost_unreported";
  exact_cost: null;
  cost_currency: null;
  planned_ceiling_copied_as_observed_usage: false;
  integrity: GovernedActorLabIntegrityV01;
}

export interface GovernedActorLabLiveArmResultV01 {
  arm: GovernedActorLabBaselineArmV01;
  persistent_memory: boolean;
  mutation_enabled: boolean;
  curated_knowledge: boolean;
  invocation_binding_refs: string[];
  evaluations: GovernedActorLabLiveEvaluationV01[];
  memory_admissions: GovernedActorLabMemoryAdmissionV01[];
  population_transitions: GovernedActorLabPopulationTransitionV01[];
  holdout: {
    passed: number;
    failed: number;
    unknown: number;
    state_frozen_before_materialization: true;
    memory_writes_after_holdout: 0;
    mutations_after_holdout: 0;
  };
  metrics: {
    required_checks_passed: number | null;
    source_reference_coverage: number | null;
    support_validation_coverage: number | null;
    unsupported_claims: number | null;
    abstentions: number | null;
    actor_memory_retrieved: number;
    actor_memory_presented: number;
    actor_memory_used: number;
    contamination_quarantined: number;
    poisoning_refusals: number;
    harmful_transfer_candidates: number | null;
    stream_interference_candidates: number;
    diversity_collapse_candidate: boolean | null;
    evaluator_overfit_candidate: boolean | null;
    challenge_count: number;
    synthesis_count: number;
    missingness: string[];
  };
  comparable: boolean;
  non_comparable_reasons: string[];
}

export interface GovernedActorLabLiveComparisonV01 {
  comparison: string;
  left_arm: GovernedActorLabBaselineArmV01;
  right_arm: GovernedActorLabBaselineArmV01;
  status: "left_better" | "right_better" | "tradeoff" | "equal" | "undetermined";
  basis: string[];
  global_winner_created: false;
}

export interface GovernedActorLabLiveReportV01 {
  report_version: typeof GOVERNED_ACTOR_LAB_LIVE_REPORT_VERSION_V01;
  report_id: string;
  report_kind: "bounded_live_model_governed_actor_lab_single_cohort";
  cohort_ref: {
    cohort_id: string;
    cohort_fingerprint: string;
  };
  source_repository_head_sha: string;
  route: GovernedActorLabLiveRouteV01;
  casebook_ref: {
    casebook_id: string;
    casebook_fingerprint: string;
    hidden_holdout_id: string;
    hidden_holdout_fingerprint: string;
  };
  accounting: GovernedActorLabLiveAggregateAccountingV01;
  arms: GovernedActorLabLiveArmResultV01[];
  comparisons: [
    GovernedActorLabLiveComparisonV01,
    GovernedActorLabLiveComparisonV01,
    GovernedActorLabLiveComparisonV01,
  ];
  non_dominance: {
    status: "determined" | "undetermined";
    non_dominated_arms: GovernedActorLabBaselineArmV01[];
    tradeoffs: string[];
    pairwise_better_is_global_winner: false;
  };
  hidden_holdout: {
    development_provider_material_contains_holdout: false;
    system_material_contains_holdout: false;
    challenge_artifacts_contain_holdout: false;
    private_memory_contains_holdout: false;
    mutation_input_contains_holdout: false;
    pre_holdout_reports_contain_holdout: false;
    evaluator_answers_sent_to_provider: false;
    all_actor_and_mutation_state_frozen_before_materialization: true;
    post_holdout_memory_writes: 0;
    post_holdout_mutations: 0;
  };
  stochastic_repeatability: "unmeasured_single_cohort";
  p_value_reported: false;
  significance_reported: false;
  confidence_interval_reported: false;
  verified_general_benefit: false;
  global_winner_created: false;
  product_promotion_created: false;
  promotion_candidates: string[];
  authority_boundary: GovernedActorLabLiveAuthorityBoundaryV01;
  limitations: string[];
  integrity: GovernedActorLabIntegrityV01;
}

export interface GovernedActorLabLiveCohortResultV01 {
  manifest: GovernedActorLabLiveCohortManifestV01;
  call_plan: GovernedActorLabLiveCallPlanV01;
  invocation_bindings: GovernedActorLabLiveInvocationBindingV01[];
  report: GovernedActorLabLiveReportV01;
}
