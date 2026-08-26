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
export const GOVERNED_ACTOR_LAB_LIVE_INCOMPLETE_REPORT_VERSION_V01 =
  "governed_actor_lab_live_incomplete_report.v0.1" as const;
export const GOVERNED_ACTOR_LAB_LIVE_ATTEMPT_VERSION_V01 =
  "governed_actor_lab_live_attempt.v0.1" as const;
export const GOVERNED_ACTOR_LAB_LIVE_CHECKPOINT_VERSION_V01 =
  "governed_actor_lab_live_checkpoint.v0.1" as const;
export const GOVERNED_ACTOR_LAB_LIVE_AUTHORIZATION_VERSION_V01 =
  "governed_actor_lab_live_authorization.v0.1" as const;
export const GOVERNED_ACTOR_LAB_LIVE_HISTORICAL_SOURCE_HEAD_V01 =
  "84df543e53ae64f42245e97bd445577e53148c1f" as const;
export const GOVERNED_ACTOR_LAB_LIVE_HISTORICAL_COHORT_ID_V01 =
  "live-cohort:6bd6bc3c1805d1cb3696376a22185e3a" as const;
export const GOVERNED_ACTOR_LAB_LIVE_HISTORICAL_TERMINAL_REASON_V01 =
  "actor_lab_no_selection_evidence" as const;

export type GovernedActorLabLiveAuthorizationLineageV01 =
  | {
      authorization_version: typeof GOVERNED_ACTOR_LAB_LIVE_AUTHORIZATION_VERSION_V01;
      authorization_kind: "initial_authorized_cohort";
      authorized_source_head: string;
      historical_source_head: null;
      historical_cohort_id: null;
      historical_result: null;
      historical_terminal_reason: null;
      replacement_source_head: null;
      authorized_replacement_count: 0;
      retry_of_historical_cohort: false;
      historical_artifacts_rewritten: false;
      further_cohort_authorized: false;
    }
  | {
      authorization_version: typeof GOVERNED_ACTOR_LAB_LIVE_AUTHORIZATION_VERSION_V01;
      authorization_kind: "authorized_replacement_after_historical_incomplete";
      authorized_source_head: string;
      historical_source_head: typeof GOVERNED_ACTOR_LAB_LIVE_HISTORICAL_SOURCE_HEAD_V01;
      historical_cohort_id: typeof GOVERNED_ACTOR_LAB_LIVE_HISTORICAL_COHORT_ID_V01;
      historical_result: "incomplete";
      historical_terminal_reason: typeof GOVERNED_ACTOR_LAB_LIVE_HISTORICAL_TERMINAL_REASON_V01;
      replacement_source_head: string;
      authorized_replacement_count: 1;
      retry_of_historical_cohort: false;
      historical_artifacts_rewritten: false;
      further_cohort_authorized: false;
    };

export const GOVERNED_ACTOR_LAB_LIVE_PHASES_V01 = [
  "blind_solve",
  "challenge_synthesis",
  "holdout_blind",
] as const;

export type GovernedActorLabLivePhaseV01 =
  (typeof GOVERNED_ACTOR_LAB_LIVE_PHASES_V01)[number];

export const GOVERNED_ACTOR_LAB_LIVE_EVALUATION_CHECK_CODES_V01 = [
  "expected_result_mismatch",
  "required_support_missing",
  "forbidden_unsupported_claim",
  "abstention_mismatch",
  "peer_challenge_not_considered",
] as const;

export type GovernedActorLabLiveEvaluationCheckCodeV01 =
  (typeof GOVERNED_ACTOR_LAB_LIVE_EVALUATION_CHECK_CODES_V01)[number];

export const GOVERNED_ACTOR_LAB_LIVE_EVALUATION_CHECK_PREDICATES_V01 = [
  "expected_result_matches",
  "all_required_support_relations_present",
  "no_forbidden_claim_present",
  "abstention_matches",
  "addressable_peer_claim_considered",
] as const;

export type GovernedActorLabLiveEvaluationCheckPredicateV01 =
  (typeof GOVERNED_ACTOR_LAB_LIVE_EVALUATION_CHECK_PREDICATES_V01)[number];

export type GovernedActorLabLiveEvaluationCheckSeverityV01 =
  | "ordinary_evaluation_failure"
  | "selection_disqualifying_hard_gate";

export interface GovernedActorLabLiveEvaluationCheckRuleV01 {
  check_code: GovernedActorLabLiveEvaluationCheckCodeV01;
  predicate: GovernedActorLabLiveEvaluationCheckPredicateV01;
  severity: GovernedActorLabLiveEvaluationCheckSeverityV01;
}

export interface GovernedActorLabLiveEvaluationCheckResultV01
  extends GovernedActorLabLiveEvaluationCheckRuleV01 {
  result: "pass" | "fail" | "unknown";
  basis:
    | "deterministic_predicate"
    | "no_addressable_peer_claim"
    | "provider_output_unavailable";
}

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
  quality_dimensions: string[];
  required_checks: GovernedActorLabLiveEvaluationCheckRuleV01[];
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
  memory_token: string;
  memory_item_ref: string;
  bounded_content: string;
  applicability: string;
  uncertainty: string[];
  limitations: string[];
  support_status: "support_validated";
}

export interface GovernedActorLabLiveCuratedMaterialV01 {
  curated_token: string;
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
  referenced_memory_tokens: string[];
  referenced_curated_tokens: string[];
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
  authorization_lineage: GovernedActorLabLiveAuthorizationLineageV01;
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
  | "dependency_missing"
  | "not_attempted_arm_terminal"
  | "cohort_internal_error_receipt_unavailable";

export type GovernedActorLabLiveProviderAttemptStatusV01 =
  | "receipt_attempted"
  | "receipt_not_attempted"
  | "known_not_attempted_local"
  | "unknown_receipt_unavailable";

export type GovernedActorLabLiveArmTerminalReasonV01 =
  "no_valid_population";

export interface GovernedActorLabLiveArmTerminalV01 {
  terminal_version: "governed_actor_lab_live_arm_terminal.v0.1";
  terminal_id: string;
  arm: GovernedActorLabBaselineArmV01;
  terminal_generation: 0 | 1 | 2;
  terminal_reason: GovernedActorLabLiveArmTerminalReasonV01;
  selection_evaluation_ref: {
    evaluation_id: string;
    evaluation_fingerprint: string;
  };
  actor_evaluation_refs: Array<{
    lab_actor_id: string;
    evaluation_id: string;
    evaluation_fingerprint: string;
  }>;
  actor_hard_gate_exclusions: Array<{
    lab_actor_id: string;
    evaluation_id: string;
    hard_gate_failure_codes: GovernedActorLabLiveEvaluationCheckCodeV01[];
  }>;
  last_terminal_state_ref: string;
  arm_state_frozen: true;
  excluded_actors_revived: false;
  mutation_applied: false;
  product_authority: false;
  promotion_authority: false;
  integrity: GovernedActorLabIntegrityV01;
}

export interface GovernedActorLabLiveNoEgressDispositionV01 {
  code:
    | "dependency_missing"
    | "route_changed"
    | "not_attempted_arm_terminal"
    | "cohort_internal_error_receipt_unavailable";
  arm_terminal_ref: string | null;
  arm_terminal_reason: GovernedActorLabLiveArmTerminalReasonV01 | null;
}

export interface GovernedActorLabLiveInvocationBindingV01 {
  binding_version: "governed_actor_lab_live_invocation_binding.v0.1";
  call_slot_id: string;
  call_order: number;
  cohort_id: string;
  arm: GovernedActorLabBaselineArmV01;
  generation: 0 | 1 | 2 | "holdout";
  episode_or_holdout_index: number;
  actor_slot: string;
  peer_slot: string | null;
  lab_actor_id: string | null;
  phase: GovernedActorLabLivePhaseV01;
  case_id: string;
  case_fingerprint: string;
  frozen_actor_ref: string | null;
  frozen_private_memory_ref: string | null;
  last_terminal_state_ref: string | null;
  arm_terminal_ref: string | null;
  curated_material_refs: string[];
  presented_memory_tokens: string[];
  presented_curated_tokens: string[];
  peer_artifact_ref: string | null;
  peer_claim_tokens_supplied: string[];
  normalized_output: GovernedActorLabLiveModelOutputV01 | null;
  normalized_output_fingerprint: string | null;
  model_invocation_receipt: ModelInvocationReceiptV02 | null;
  model_invocation_receipt_fingerprint: string | null;
  provider_ref: ExternalRefV01;
  model_ref: ExternalRefV01;
  invocation_status: GovernedActorLabLiveInvocationStatusV01;
  provider_attempt_status: GovernedActorLabLiveProviderAttemptStatusV01;
  no_egress_disposition: GovernedActorLabLiveNoEgressDispositionV01 | null;
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
  checks: GovernedActorLabLiveEvaluationCheckResultV01[];
  evaluation_failure_codes: GovernedActorLabLiveEvaluationCheckCodeV01[];
  hard_gate_failure: boolean | null;
  hard_gate_failure_codes: GovernedActorLabLiveEvaluationCheckCodeV01[];
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
  attempted_provider_calls: number | null;
  receipt_bearing_attempted_calls: number;
  attempted_provider_calls_unknown_slots: number;
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
  not_attempted_arm_terminal: number;
  cohort_internal_error_receipt_unavailable: number;
  journaled_slot_count: number;
  missing_call_slots: number;
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
  terminal: GovernedActorLabLiveArmTerminalV01 | null;
  actor_evaluation_failures: number;
  actor_selection_hard_gate_exclusions: number;
  actor_unknowns: number;
  arm_completion_status: "complete" | "terminal" | "incomplete";
  arm_level_hard_gate: {
    failed: boolean;
    codes: Array<"holdout_selection_disqualifying_output">;
    basis: Array<{
      code: "holdout_selection_disqualifying_output";
      evaluation_fingerprints: string[];
    }>;
  };
  holdout: {
    passed: number;
    failed: number;
    unknown: number;
    state_frozen_before_materialization: true;
    memory_writes_after_holdout: 0;
    mutations_after_holdout: 0;
    materialized: boolean;
  };
  metrics: {
    required_checks_passed: number | null;
    source_reference_coverage: number | null;
    support_validation_coverage: number | null;
    unsupported_claims: number | null;
    abstentions: number | null;
    actor_memory_retrieved: number;
    actor_memory_presented: number;
    actor_memory_eligible: number;
    actor_memory_explicitly_referenced: number;
    actor_memory_actual_use: null;
    curated_material_presented: number;
    curated_material_explicitly_referenced: number;
    curated_material_actual_use: null;
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
  comparison_eligible: boolean;
  non_comparable_reasons: string[];
}

export interface GovernedActorLabLiveCheckpointV01 {
  checkpoint_version: typeof GOVERNED_ACTOR_LAB_LIVE_CHECKPOINT_VERSION_V01;
  checkpoint_id: string;
  cohort_id: string;
  arm: GovernedActorLabBaselineArmV01;
  generation: 0 | 1 | 2;
  actor_refs: Array<{
    lab_actor_id: string;
    actor_snapshot_id: string;
    actor_snapshot_fingerprint: string;
  }>;
  memory_refs: Array<{
    lab_actor_id: string;
    memory_snapshot_id: string;
    memory_snapshot_fingerprint: string;
  }>;
  evaluation_refs: Array<{
    evaluation_id: string;
    evaluation_fingerprint: string;
  }>;
  memory_admission_refs: Array<{
    admission_id: string;
    candidate_id: string;
    resulting_memory_snapshot_id: string;
    resulting_memory_snapshot_fingerprint: string;
  }>;
  transition_ref: {
    transition_id: string;
    transition_fingerprint: string;
  } | null;
  terminal_ref: {
    terminal_id: string;
    terminal_fingerprint: string;
  } | null;
  holdout_content_included: false;
  journal_prefix_length: number;
  integrity: GovernedActorLabIntegrityV01;
}

export type GovernedActorLabLiveAttemptStatusV01 =
  | "complete"
  | "truthful_incomplete"
  | "blocked_pre_egress"
  | "cohort_internal_error"
  | "cancelled";

export interface GovernedActorLabLiveTerminalAttemptV01 {
  attempt_version: typeof GOVERNED_ACTOR_LAB_LIVE_ATTEMPT_VERSION_V01;
  cohort_id: string;
  status: GovernedActorLabLiveAttemptStatusV01;
  terminal_reason: string;
  persisted_invocation_prefix: number;
  persisted_checkpoint_count: number;
  missing_call_slots: number;
  provider_attempt_count_unknown: boolean;
  authorization_lineage: GovernedActorLabLiveAuthorizationLineageV01;
  retry_authorized: false;
  further_cohort_authorized: false;
  integrity: GovernedActorLabIntegrityV01;
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
  completion_status: "complete";
  cohort_ref: {
    cohort_id: string;
    cohort_fingerprint: string;
  };
  source_repository_head_sha: string;
  authorization_lineage: GovernedActorLabLiveAuthorizationLineageV01;
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
  result_kind: "complete";
  manifest: GovernedActorLabLiveCohortManifestV01;
  call_plan: GovernedActorLabLiveCallPlanV01;
  invocation_bindings: GovernedActorLabLiveInvocationBindingV01[];
  checkpoints: GovernedActorLabLiveCheckpointV01[];
  terminal_attempt: GovernedActorLabLiveTerminalAttemptV01;
  report: GovernedActorLabLiveReportV01;
}

export interface GovernedActorLabLiveIncompleteArmV01 {
  arm: GovernedActorLabBaselineArmV01;
  status: "terminal" | "incomplete" | "frozen_g2";
  terminal_ref: string | null;
  terminal_reason: GovernedActorLabLiveArmTerminalReasonV01 | null;
  latest_checkpoint_ref: string | null;
  finalized_slots: number;
  receipt_bearing_attempted_calls: number;
  completed_live_calls: number;
  holdout_materialization:
    | "materialized"
    | "not_materialized_arm_terminal"
    | "not_reached";
}

export interface GovernedActorLabLiveIncompleteReportV01 {
  report_version: typeof GOVERNED_ACTOR_LAB_LIVE_INCOMPLETE_REPORT_VERSION_V01;
  report_id: string;
  report_kind: "bounded_live_model_governed_actor_lab_truthful_incomplete";
  completion_status: "truthful_incomplete";
  cohort_ref: {
    cohort_id: string;
    cohort_fingerprint: string;
  };
  source_repository_head_sha: string;
  authorization_lineage: GovernedActorLabLiveAuthorizationLineageV01;
  route: GovernedActorLabLiveRouteV01;
  accounting: GovernedActorLabLiveAggregateAccountingV01;
  arms: GovernedActorLabLiveIncompleteArmV01[];
  terminal_arms: Array<{
    arm: GovernedActorLabBaselineArmV01;
    terminal_ref: string;
    terminal_reason: GovernedActorLabLiveArmTerminalReasonV01;
  }>;
  incomplete_arms: GovernedActorLabBaselineArmV01[];
  comparisons: [
    GovernedActorLabLiveComparisonV01,
    GovernedActorLabLiveComparisonV01,
    GovernedActorLabLiveComparisonV01,
  ];
  non_dominance: {
    status: "undetermined";
    non_dominated_arms: [];
    tradeoffs: string[];
    pairwise_better_is_global_winner: false;
  };
  holdout_materialization_complete: boolean;
  stochastic_repeatability: "unmeasured_single_cohort";
  verified_general_benefit: false;
  global_winner_created: false;
  product_promotion_created: false;
  authority_boundary: GovernedActorLabLiveAuthorityBoundaryV01;
  limitations: string[];
  integrity: GovernedActorLabIntegrityV01;
}

export interface GovernedActorLabLiveIncompleteResultV01 {
  result_kind: "truthful_incomplete";
  manifest: GovernedActorLabLiveCohortManifestV01;
  call_plan: GovernedActorLabLiveCallPlanV01;
  invocation_bindings: GovernedActorLabLiveInvocationBindingV01[];
  checkpoints: GovernedActorLabLiveCheckpointV01[];
  arm_terminals: GovernedActorLabLiveArmTerminalV01[];
  terminal_attempt: GovernedActorLabLiveTerminalAttemptV01;
  report: GovernedActorLabLiveIncompleteReportV01;
}

export type GovernedActorLabLiveExecutionResultV01 =
  | GovernedActorLabLiveCohortResultV01
  | GovernedActorLabLiveIncompleteResultV01;
