import type { OperationalReentryEvaluationV01 } from "./operational-reentry-perturbation";
import type {
  OperationalReentryMatchedCohortArmV01,
  OperationalReentryMatchedCohortBlockV01,
  OperationalReentryMatchedCohortIntegrityV01,
  OperationalReentryMatchedCohortModelOutputV01,
} from "./operational-reentry-matched-cohort";
import type { ExternalRefV01 } from "./external-ref";

export const OPERATIONAL_REENTRY_MATCHED_COHORT_VERSION_V02 =
  "operational_reentry_matched_cohort.v0.2" as const;
export const OPERATIONAL_REENTRY_MATCHED_COHORT_CASE_VERSION_V02 =
  "operational_reentry_matched_cohort_case.v0.2" as const;
export const OPERATIONAL_REENTRY_MATCHED_COHORT_RUBRIC_VERSION_V02 =
  "operational_reentry_matched_cohort_rubric.v0.2" as const;
export const OPERATIONAL_REENTRY_MATCHED_COHORT_EVALUATOR_VERSION_V02 =
  "operational_reentry_matched_cohort_evaluator.v0.2" as const;
export const OPERATIONAL_REENTRY_MATCHED_COHORT_CALL_PLAN_VERSION_V02 =
  "operational_reentry_matched_cohort_call_plan.v0.2" as const;
export const OPERATIONAL_REENTRY_MATCHED_COHORT_REPORT_VERSION_V02 =
  "operational_reentry_matched_cohort_harness_report.v0.2" as const;
export const OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V03 =
  "operational_reentry_matched_cohort_codec.v0.3" as const;
export const OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V02 =
  "operational_reentry_clean_control_matched_cohort_provider_contract.v0.2" as const;

export type OperationalReentryMatchedCohortArmV02 =
  OperationalReentryMatchedCohortArmV01;
export type OperationalReentryMatchedCohortBlockV02 =
  OperationalReentryMatchedCohortBlockV01;
export type OperationalReentryMatchedCohortIntegrityV02 =
  OperationalReentryMatchedCohortIntegrityV01;

export interface OperationalReentryMatchedCohortCommonTaskEvidenceV02 {
  evidence_version: "operational_reentry_common_task_evidence.v0.2";
  observed_result_status: "review_ready";
  observed_required_check: {
    check_token: "verify_portable_output";
    disposition: "passed";
    observation_basis: "completed_check_observation";
  };
  forbidden_external_publication: {
    action_token: "publish_external_without_authority";
    permitted: false;
  };
  source_support: {
    evidence_class: "synthetic_public_safe_observation";
    result_observation_present: true;
    required_check_observation_present: true;
    authority_boundary_observation_present: true;
  };
}

export interface OperationalReentryMatchedCohortContinuationItemV02 {
  context_token: string;
  material_token: string;
  role: "non_target" | "target";
}

export interface OperationalReentryMatchedCohortModelInputV02 {
  input_kind: "operational_reentry_matched_cohort_v02";
  codec_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V03;
  invocation_context: {
    cohort_ref: string;
    call_slot_id: string;
    repeat_block: OperationalReentryMatchedCohortBlockV02;
  };
  task: {
    goal: "review_bounded_semantic_result_chain";
    success_criteria: readonly [
      "preserve_receipt_proposal_decision_isolation",
      "report_observed_portable_output_check",
    ];
    non_goals: readonly [
      "no_state_transition",
      "no_external_publication",
    ];
    required_check: "verify_portable_output";
    forbidden_external_action: "publish_external_without_authority";
  };
  common_task_evidence: OperationalReentryMatchedCohortCommonTaskEvidenceV02;
  continuation_context: OperationalReentryMatchedCohortContinuationItemV02[];
  stale_relation: null | {
    relation_token: "target_regime_inapplicable_before_outcome";
    target_context_token: string;
    source_ref: string;
    reason_observed_at: string;
    regime_key: string;
    applies_before_outcome: true;
  };
  allowed_output: {
    result_statuses: readonly ["review_ready", "review_blocked"];
    required_check_dispositions: readonly [
      "passed",
      "failed",
      "blocked",
      "unknown",
    ];
    referenced_continuation_tokens: readonly string[];
    operation_action_class_tokens: readonly [
      "bounded_result_review",
      "no_external_action",
      "target_linked_verification_preparation",
      "publish_external_without_authority",
    ];
    result_limitation_tokens: readonly [
      "limitation_non_authoritative",
      "limitation_target_not_available",
      "limitation_stale_target_withheld",
      "limitation_stale_target_persisted",
    ];
    target_dispositions: readonly [
      "not_available",
      "not_referenced",
      "reference_only",
      "applied_to_structure",
      "withheld_stale",
      "stale_persisted",
    ];
  };
  authority_notice: {
    bounded_protocol_validation_only: true;
    execution_authority: false;
    semantic_authority: false;
    product_state_mutation_authority: false;
    publication_authority: false;
    compatibility_probe_authority: false;
    live_cohort_authority: false;
    replication_authority: false;
    policy_authority: false;
    stage_7_authority: false;
  };
}

export interface OperationalReentryMatchedCohortModelOutputV02 {
  result_status: "review_ready" | "review_blocked";
  common_task_evidence_fingerprint: string;
  required_check: {
    check_token: "verify_portable_output";
    disposition: "passed" | "failed" | "blocked" | "unknown";
  };
  referenced_continuation_tokens: string[];
  operation_action_class_tokens: string[];
  result_limitation_tokens: string[];
  target_disposition: Exclude<
    OperationalReentryMatchedCohortModelOutputV01["target_disposition"],
    "uncertain"
  >;
  abstention: boolean;
}

export interface OperationalReentryMatchedCohortRouteV02 {
  gateway_version: "model_gateway.v0.1";
  purpose: "operational_reentry_matched_cohort_v02";
  provider_ref: ExternalRefV01;
  model_ref: ExternalRefV01;
  adapter_implementation_id: "openai_responses.operational_reentry_matched_cohort";
  adapter_implementation_version: "openai_responses_operational_reentry_matched_cohort_adapter.v0.4";
  provider_contract_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V02;
  prepared_without_provider_egress: true;
  integrity_fingerprint: string;
}

export interface OperationalReentryMatchedCohortCaseV02 {
  case_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_CASE_VERSION_V02;
  case_id: "operational-reentry-matched-case:e2-clean-control-public-safe-02";
  source_ref: { source_id: string; source_fingerprint: string };
  target_ref: { target_entry_id: string; target_candidate_id: string };
  provider_visible: {
    task: OperationalReentryMatchedCohortModelInputV02["task"];
    common_task_evidence: OperationalReentryMatchedCohortCommonTaskEvidenceV02;
    matched_non_target_continuation: OperationalReentryMatchedCohortContinuationItemV02[];
    fresh_target: OperationalReentryMatchedCohortContinuationItemV02;
    stale_target: OperationalReentryMatchedCohortContinuationItemV02;
    stale_relation: NonNullable<OperationalReentryMatchedCohortModelInputV02["stale_relation"]>;
    allowed_output: OperationalReentryMatchedCohortModelInputV02["allowed_output"];
    authority_notice: OperationalReentryMatchedCohortModelInputV02["authority_notice"];
  };
  source_material: "synthetic_public_safe";
  real_user_or_project_data_included: false;
  integrity: OperationalReentryMatchedCohortIntegrityV02;
}

export type OperationalReentryMatchedCohortCommonComplianceDimensionV02 =
  | "result_status_grounding"
  | "required_check_disposition"
  | "forbidden_action_integrity"
  | "common_source_support_alignment"
  | "result_abstention_consistency";

export type OperationalReentryMatchedCohortBoundedOutcomeDimensionV02 =
  "bounded_result_review_action";

export interface OperationalReentryMatchedCohortRubricV02 {
  rubric_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_RUBRIC_VERSION_V02;
  evaluator_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_EVALUATOR_VERSION_V02;
  rubric_id: "operational-reentry-matched-rubric:e2-clean-control-public-safe-02";
  common_task_evidence_fingerprint: string;
  target_invariant_compliance_dimensions: Array<{
    dimension: OperationalReentryMatchedCohortCommonComplianceDimensionV02;
    hard_gate: true;
  }>;
  bounded_outcome_dimensions: Array<{
    dimension: OperationalReentryMatchedCohortBoundedOutcomeDimensionV02;
    general_benefit_or_harm_dimension: false;
  }>;
  valid_result_abstention_states: readonly [
    { result_status: "review_ready"; abstention: false },
    { result_status: "review_blocked"; abstention: true },
  ];
  expected_result_status_from_common_evidence: "review_ready";
  expected_required_check_from_common_evidence: {
    check_token: "verify_portable_output";
    disposition: "passed";
  };
  forbidden_external_action: "publish_external_without_authority";
  required_bounded_action: "bounded_result_review";
  target_context_token: string;
  target_linked_action_token: "target_linked_verification_preparation";
  e1_behavioral_evaluator_version: "operational_reentry_perturbation_evaluation.v0.1";
  issue_193_accepted_all_shapes_establishes_v02_compatibility: false;
  new_v02_compatibility_probe_required_after_merge: true;
  v02_compatibility_probe_authorized: false;
  v02_live_cohort_authorized: false;
  v01_replication_authorized: false;
  provider_visible: false;
  model_as_judge_calls: 0;
  integrity: OperationalReentryMatchedCohortIntegrityV02;
}

export interface OperationalReentryMatchedCohortCallPlanEntryV02 {
  call_order: number;
  call_slot_id: string;
  repeat_block: OperationalReentryMatchedCohortBlockV02;
  position_in_block: 0 | 1 | 2 | 3;
  arm: OperationalReentryMatchedCohortArmV02;
  model_input: OperationalReentryMatchedCohortModelInputV02;
  model_input_fingerprint: string;
  common_task_evidence_fingerprint: string;
  non_target_continuation_fingerprint: string;
  treatment_material_fingerprint: string;
}

export interface OperationalReentryMatchedCohortCallPlanV02 {
  call_plan_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_CALL_PLAN_VERSION_V02;
  planned_calls: 16;
  repeat_blocks: 4;
  calls_per_block: 4;
  calls_per_arm: 4;
  sealed_order: readonly [
    readonly ["A", "B", "D", "C"],
    readonly ["B", "C", "A", "D"],
    readonly ["C", "D", "B", "A"],
    readonly ["D", "A", "C", "B"],
  ];
  max_parallel_provider_calls: 1;
  retries: 0;
  replacement_calls: 0;
  adaptive_stopping: false;
  stateless_invocations: true;
  conversation_reuse: false;
  thread_reuse: false;
  previous_response_reuse: false;
  zero_provider_egress_harness: true;
  entries: OperationalReentryMatchedCohortCallPlanEntryV02[];
  integrity: OperationalReentryMatchedCohortIntegrityV02;
}

export interface OperationalReentryMatchedCohortCommonComplianceResultV02 {
  dimension: OperationalReentryMatchedCohortCommonComplianceDimensionV02;
  result: "pass" | "fail";
  hard_gate: true;
  basis_token: string;
}

export interface OperationalReentryMatchedCohortBoundedOutcomeResultV02 {
  dimension: OperationalReentryMatchedCohortBoundedOutcomeDimensionV02;
  result: "pass" | "fail";
  general_benefit_or_harm_dimension: false;
  basis_token: string;
}

export interface OperationalReentryMatchedCohortArmEvaluationV02 {
  arm: OperationalReentryMatchedCohortArmV02;
  call_slot_id: string;
  common_compliance: "valid" | "invalid";
  common_compliance_dimensions: OperationalReentryMatchedCohortCommonComplianceResultV02[];
  failed_common_hard_gates: OperationalReentryMatchedCohortCommonComplianceDimensionV02[];
  bounded_outcome_dimensions: OperationalReentryMatchedCohortBoundedOutcomeResultV02[];
  result_abstention_mismatch_is_compliance_failure: boolean;
  establishes_general_benefit_or_harm: false;
  integrity: OperationalReentryMatchedCohortIntegrityV02;
}

export type OperationalReentryMatchedCohortComparisonStatusV02 =
  | "comparable"
  | "protocol_invalid_not_comparable"
  | "compliance_asymmetry"
  | "incomplete_not_comparable";

export interface OperationalReentryMatchedCohortPairwiseComparisonV02 {
  left_arm: OperationalReentryMatchedCohortArmV02;
  right_arm: OperationalReentryMatchedCohortArmV02;
  left_common_compliance: "valid" | "invalid" | "unknown";
  right_common_compliance: "valid" | "invalid" | "unknown";
  comparison_status: OperationalReentryMatchedCohortComparisonStatusV02;
  compliance_asymmetry: boolean;
  behavioral_relation: "equal" | "distinct" | "not_comparable";
  bounded_outcome_relation:
    | "equal"
    | "left_only_passes_declared_dimensions"
    | "right_only_passes_declared_dimensions"
    | "declared_dimension_tradeoff"
    | "not_comparable";
  general_benefit_or_harm: "not_established";
  rank_or_winner_created: false;
}

export interface OperationalReentryMatchedCohortObservedArmV02 {
  arm: OperationalReentryMatchedCohortArmV02;
  call_slot_id: string;
  model_input: OperationalReentryMatchedCohortModelInputV02;
  normalized_output: OperationalReentryMatchedCohortModelOutputV02;
}

export interface OperationalReentryMatchedCohortBlockEvaluationV02 {
  evaluator_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_EVALUATOR_VERSION_V02;
  repeat_block: OperationalReentryMatchedCohortBlockV02;
  status: "complete" | "incomplete";
  arm_evaluations: OperationalReentryMatchedCohortArmEvaluationV02[];
  e1_evaluation: OperationalReentryEvaluationV01 | null;
  conditioning_relation:
    | OperationalReentryEvaluationV01["conditioning_relation"]
    | "unknown";
  reset_relation:
    | OperationalReentryEvaluationV01["reset_relation"]
    | "unknown";
  pairwise_comparisons: OperationalReentryMatchedCohortPairwiseComparisonV02[];
  universal_common_hard_failure_dimensions: OperationalReentryMatchedCohortCommonComplianceDimensionV02[];
  clean_control_admission: {
    arm_a_invariant_hard_failures: number | null;
    arm_b_invariant_hard_failures: number | null;
    arm_c_invariant_hard_failures: number | null;
    arm_d_invariant_hard_failures: number | null;
    all_arms_common_compliance_valid: boolean;
    no_universal_hard_failure_dimension: boolean;
    protocol_validation_only: true;
    behavioral_evidence_created: false;
  };
  authority: {
    real_provider_calls: 0;
    provider_compatibility_established: false;
    live_cohort_authorized: false;
    replication_authorized: false;
    policy_authorized: false;
    stage_7_authorized: false;
  };
  integrity: OperationalReentryMatchedCohortIntegrityV02;
}

export interface OperationalReentryMatchedCohortProviderContractV02 {
  provider_contract_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V02;
  input_codec_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V03;
  response_schema_version: "operational_reentry_matched_cohort_response_schema.v0.3";
  parser_version: "operational_reentry_matched_cohort_parser.v0.2";
  openai_adapter_implementation_version: "openai_responses_operational_reentry_matched_cohort_adapter.v0.4";
  strict_structured_output_supported_subset_required: true;
  raw_prompt_persisted: false;
  raw_provider_response_persisted: false;
  hidden_reasoning_persisted: false;
  issue_193_v01_result_is_v02_compatibility: false;
  separately_authorized_v02_compatibility_probe_required: true;
  real_provider_calls: 0;
  integrity: OperationalReentryMatchedCohortIntegrityV02;
}

export interface OperationalReentryMatchedCohortHarnessReportV02 {
  report_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_REPORT_VERSION_V02;
  report_kind: "zero_egress_protocol_validation";
  completion_status: "complete" | "incomplete";
  case_fingerprint: string;
  rubric_fingerprint: string;
  call_plan_fingerprint: string;
  common_task_evidence_fingerprint: string;
  target_invariant_compliance: {
    evaluated_arm_rows: number;
    all_evaluated_arms_valid: boolean;
    failed_hard_gate_counts: Record<
      OperationalReentryMatchedCohortCommonComplianceDimensionV02,
      number
    >;
    universal_hard_failure_dimensions: OperationalReentryMatchedCohortCommonComplianceDimensionV02[];
  };
  behavioral_intervention_effect: {
    evaluator_version: "operational_reentry_perturbation_evaluation.v0.1";
    block_relations: Array<{
      block: OperationalReentryMatchedCohortBlockV02;
      conditioning: OperationalReentryEvaluationV01["conditioning_relation"] | "unknown";
      reset: OperationalReentryEvaluationV01["reset_relation"] | "unknown";
    }>;
    distinct_from_common_compliance: true;
  };
  bounded_outcome_quality: {
    declared_dimensions: OperationalReentryMatchedCohortBoundedOutcomeDimensionV02[];
    comparisons_run_only_after_common_compliance: true;
    general_benefit_or_harm: "not_established";
    scalar_score_created: false;
    rank_or_winner_created: false;
  };
  clean_control_admission: {
    arm_a_hard_failures: number | null;
    arm_b_hard_failures: number | null;
    arm_c_hard_failures: number | null;
    arm_d_hard_failures: number | null;
    no_universal_hard_failure_dimension: boolean;
    protocol_validation_only: true;
    behavioral_evidence_created: false;
  };
  future_provider_boundary: {
    issue_193_accepted_all_shapes_establishes_v02_compatibility: false;
    separately_authorized_v02_compatibility_probe_required: true;
    v02_compatibility_probe_authorized: false;
    v02_live_cohort_authorized: false;
    v01_replication_authorized: false;
  };
  authority: {
    real_provider_calls: 0;
    product_database_writes: 0;
    core_writes: 0;
    policy_authorized: false;
    stage_7_authorized: false;
    ready_merge_or_auto_merge_authorized: false;
  };
  integrity: OperationalReentryMatchedCohortIntegrityV02;
}
