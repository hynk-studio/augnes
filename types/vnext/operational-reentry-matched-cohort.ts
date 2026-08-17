import type { ExternalRefV01 } from "./external-ref";
import type { ModelGatewayCostBudgetV01, ModelInvocationReceiptUsageV02, ModelInvocationReceiptV02 } from "./model-invocation-receipt";
import type { OperationalReentryEvaluationV01 } from "./operational-reentry-perturbation";
import type { ModelProviderRejectionObservationV01 } from "@/lib/vnext/model-gateway/provider-rejection-observation";

export const OPERATIONAL_REENTRY_MATCHED_COHORT_VERSION_V01 =
  "operational_reentry_matched_cohort.v0.1" as const;
export const OPERATIONAL_REENTRY_MATCHED_COHORT_CASE_VERSION_V01 =
  "operational_reentry_matched_cohort_case.v0.1" as const;
export const OPERATIONAL_REENTRY_MATCHED_COHORT_RUBRIC_VERSION_V01 =
  "operational_reentry_matched_cohort_rubric.v0.1" as const;
export const OPERATIONAL_REENTRY_MATCHED_COHORT_CALL_PLAN_VERSION_V01 =
  "operational_reentry_matched_cohort_call_plan.v0.1" as const;
export const OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V01 =
  "operational_reentry_matched_cohort_codec.v0.1" as const;
export const OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V02 =
  "operational_reentry_matched_cohort_provider_contract.v0.2" as const;
export const OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V02 =
  "operational_reentry_matched_cohort_codec.v0.2" as const;
export const OPERATIONAL_REENTRY_MATCHED_COHORT_AUTHORIZATION_VERSION_V01 =
  "operational_reentry_matched_cohort_authorization.v0.1" as const;
export const OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_LINEAGE_VERSION_V02 =
  "operational_reentry_matched_cohort_replacement_lineage.v0.2" as const;

export type OperationalReentryMatchedCohortArmV01 = "A" | "B" | "C" | "D";
export type OperationalReentryMatchedCohortBlockV01 = 0 | 1 | 2 | 3;

export interface OperationalReentryMatchedCohortIntegrityV01 {
  algorithm: "sha256";
  canonicalization: "augnes-json-c14n-v0_1";
  fingerprint_scope: string;
  fingerprint: string;
}

export interface OperationalReentryMatchedCohortModelOutputV01 {
  result_token: string;
  referenced_context_tokens: string[];
  required_check_dispositions: string[];
  operation_action_class_tokens: string[];
  blocker_warning_gap_tokens: string[];
  result_limitation_tokens: string[];
  target_disposition:
    | "not_available"
    | "not_referenced"
    | "reference_only"
    | "applied_to_structure"
    | "withheld_stale"
    | "stale_persisted"
    | "uncertain";
  abstention: boolean;
}

export interface OperationalReentryMatchedCohortModelInputV01 {
  input_kind: "operational_reentry_matched_cohort";
  codec_version:
    | typeof OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V01
    | typeof OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V02;
  invocation_context: {
    cohort_ref: string;
    call_slot_id: string;
    repeat_block: OperationalReentryMatchedCohortBlockV01;
  };
  task: {
    goal_token: string;
    success_criterion_tokens: string[];
    non_goal_tokens: string[];
    required_check_tokens: string[];
    forbidden_action_tokens: string[];
    task_family_token: string;
  };
  context_material: Array<{
    context_token: string;
    material_token: string;
  }>;
  target_context_token: string | null;
  stale_relation: null | {
    relation_token: string;
    target_context_token: string;
    source_ref: string;
    reason_observed_at: string;
    regime_key: string;
    applies_before_outcome: true;
  };
  allowed_output: {
    result_tokens: string[];
    referenced_context_tokens: string[];
    required_check_disposition_tokens: string[];
    operation_action_class_tokens: string[];
    blocker_warning_gap_tokens: string[];
    result_limitation_tokens: string[];
    target_dispositions: OperationalReentryMatchedCohortModelOutputV01["target_disposition"][];
  };
  authority_notice: {
    bounded_research_candidate_only: true;
    execution_authority: false;
    semantic_authority: false;
    product_state_mutation_authority: false;
    publication_authority: false;
  };
}

export interface OperationalReentryMatchedCohortCaseV01 {
  case_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_CASE_VERSION_V01;
  case_id: string;
  source_ref: { source_id: string; source_fingerprint: string };
  target_ref: { target_entry_id: string; target_candidate_id: string };
  actor_visible: {
    task: OperationalReentryMatchedCohortModelInputV01["task"];
    non_target_context: OperationalReentryMatchedCohortModelInputV01["context_material"];
    target_context: OperationalReentryMatchedCohortModelInputV01["context_material"][number];
    stale_relation: NonNullable<OperationalReentryMatchedCohortModelInputV01["stale_relation"]>;
    output_tokens: OperationalReentryMatchedCohortModelInputV01["allowed_output"];
  };
  source_material: "synthetic_public_safe";
  real_user_or_project_data_included: false;
  integrity: OperationalReentryMatchedCohortIntegrityV01;
}

export type OperationalReentryMatchedCohortRubricDimensionV01 =
  | "result_correctness"
  | "required_check_disposition"
  | "forbidden_action_integrity"
  | "source_support_alignment"
  | "appropriate_abstention";

export interface OperationalReentryMatchedCohortRubricV01 {
  rubric_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_RUBRIC_VERSION_V01;
  rubric_id: string;
  evaluator_only: true;
  model_as_judge_calls: 0;
  dimensions: Array<{
    dimension: OperationalReentryMatchedCohortRubricDimensionV01;
    hard_failure: boolean;
  }>;
  expected_result_token: string;
  expected_check_disposition_token: string;
  required_action_token: string;
  target_context_token: string;
  target_linked_action_tokens: string[];
  target_linked_limitation_tokens: string[];
  aggregate_rules: {
    repeat_count: 4;
    predominant_count: 3;
    bounded_positive_min_better: 3;
    bounded_positive_min_structured_delta: 3;
  };
  provider_visible: false;
  integrity: OperationalReentryMatchedCohortIntegrityV01;
}

export interface OperationalReentryMatchedCohortCallPlanEntryV01 {
  call_order: number;
  call_slot_id: string;
  repeat_block: OperationalReentryMatchedCohortBlockV01;
  position_in_block: 0 | 1 | 2 | 3;
  arm: OperationalReentryMatchedCohortArmV01;
  model_input: OperationalReentryMatchedCohortModelInputV01;
  model_input_fingerprint: string;
}

export interface OperationalReentryMatchedCohortCallPlanV01 {
  call_plan_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_CALL_PLAN_VERSION_V01;
  planned_calls: 16;
  repeat_blocks: 4;
  calls_per_block: 4;
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
  entries: OperationalReentryMatchedCohortCallPlanEntryV01[];
  integrity: OperationalReentryMatchedCohortIntegrityV01;
}

export interface OperationalReentryMatchedCohortRouteV01 {
  gateway_version: "model_gateway.v0.1";
  purpose: "operational_reentry_matched_cohort";
  provider_ref: ExternalRefV01;
  model_ref: ExternalRefV01;
  adapter_implementation_id: string;
  adapter_implementation_version: string;
  prepared_without_provider_egress: true;
  integrity_fingerprint: string;
}

export interface OperationalReentryMatchedCohortPricingV01 {
  pricing_version: "operational_reentry_matched_cohort_pricing.v0.1";
  provider_ref: ExternalRefV01;
  model_ref: ExternalRefV01;
  currency: "USD";
  accounting_unit: "nano_usd";
  input_nano_usd_per_token: 400;
  cached_input_nano_usd_per_token: 100;
  output_nano_usd_per_token: 1600;
  conservative_input_nano_usd_per_utf8_byte: 400;
  pricing_source: "official_openai_model_page";
  pricing_source_url: "https://developers.openai.com/api/docs/models/gpt-4.1-mini";
  pricing_effective_at: string;
  pricing_expires_at: string;
  gateway_cost_budget: ModelGatewayCostBudgetV01;
  aggregate_worst_case_cost_nano_usd: number;
  aggregate_ceiling_nano_usd: 5_000_000_000;
  integrity: OperationalReentryMatchedCohortIntegrityV01;
}

export interface OperationalReentryMatchedCohortAuthorizationV01 {
  authorization_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_AUTHORIZATION_VERSION_V01;
  authorization_kind: "one_issue_185_live_cohort";
  issue_number: 185;
  source_head: string;
  planned_calls: 16;
  max_total_cost_usd: "5.00";
  aggregate_ceiling_nano_usd: 5_000_000_000;
  retries: 0;
  replacement_calls: 0;
  further_cohort_authorized: false;
  source_correction_after_egress_authorized: false;
  integrity: OperationalReentryMatchedCohortIntegrityV01;
}

export interface OperationalReentryMatchedCohortReplacementLineageV02 {
  lineage_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_LINEAGE_VERSION_V02;
  authorization_kind: "authorized_replacement_after_historical_incomplete";
  historical_issue_number: 185;
  historical_pr_number: 186;
  historical_source_head: "123c5e31708a35c68be73b332d595bed9a9eea94";
  retry_of_historical_cohort: false;
  historical_artifacts_rewritten: false;
  replacement_count: 1;
  further_cohort_authorized: false;
  replacement_authorization_granted: false;
  replacement_authorization_consumed: false;
  integrity: OperationalReentryMatchedCohortIntegrityV01;
}

export interface OperationalReentryMatchedCohortManifestV01 {
  cohort_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_VERSION_V01;
  cohort_id: string;
  source_repository_head_sha: string;
  authorization: OperationalReentryMatchedCohortAuthorizationV01;
  source_ref: OperationalReentryMatchedCohortCaseV01["source_ref"];
  target_ref: OperationalReentryMatchedCohortCaseV01["target_ref"];
  case_fingerprint: string;
  rubric_fingerprint: string;
  call_plan_fingerprint: string;
  route: OperationalReentryMatchedCohortRouteV01;
  pricing_fingerprint: string;
  provider_egress: "allow";
  execution_mode: "live";
  data_classification: "public_safe";
  retention_class: "none";
  raw_prompt_persisted: false;
  raw_provider_response_persisted: false;
  hidden_reasoning_persisted: false;
  manual_retries: 0;
  manual_normalized_output_edits: 0;
  integrity: OperationalReentryMatchedCohortIntegrityV01;
}

export type OperationalReentryMatchedCohortTerminalCategoryV01 =
  | "completed_live"
  | "provider_rejected"
  | "provider_response_invalid"
  | "transport_failed"
  | "timed_out"
  | "cancelled"
  | "blocked_before_egress"
  | "cohort_internal_failure";

export interface OperationalReentryMatchedCohortCallTerminalV01 {
  call_order: number;
  call_slot_id: string;
  repeat_block: OperationalReentryMatchedCohortBlockV01;
  arm: OperationalReentryMatchedCohortArmV01;
  terminal_category: OperationalReentryMatchedCohortTerminalCategoryV01;
  egress_attempted: boolean;
  input_bytes: number | null;
  usage: ModelInvocationReceiptUsageV02 | null;
  latency_ms: number | null;
  route_fingerprint: string;
  pricing_fingerprint: string;
  normalized_output: OperationalReentryMatchedCohortModelOutputV01 | null;
  normalized_output_fingerprint: string | null;
  receipt: ModelInvocationReceiptV02 | null;
  terminal_failure_code: string | null;
  provider_rejection_observation?: ModelProviderRejectionObservationV01;
  exact_cost: {
    status: "calculated" | "unknown";
    input_nano_usd: number | null;
    output_nano_usd: number | null;
    total_nano_usd: number | null;
  };
  worst_case_cost_nano_usd: number;
  operator_intervention: {
    manual_retries: 0;
    replacement_calls: 0;
    manual_normalized_output_edits: 0;
  };
  integrity: OperationalReentryMatchedCohortIntegrityV01;
}

export interface OperationalReentryMatchedCohortDimensionResultV01 {
  dimension: OperationalReentryMatchedCohortRubricDimensionV01;
  result: "pass" | "fail" | "unknown";
  hard_failure: boolean;
  basis_token: string;
}

export interface OperationalReentryMatchedCohortArmEvaluationV01 {
  arm: OperationalReentryMatchedCohortArmV01;
  call_slot_id: string;
  dimensions: OperationalReentryMatchedCohortDimensionResultV01[];
  hard_failure_observed: boolean;
  integrity: OperationalReentryMatchedCohortIntegrityV01;
}

export type OperationalReentryMatchedCohortPairwiseRelationV01 =
  | "pareto_better"
  | "pareto_equal"
  | "pareto_worse"
  | "mixed_tradeoff"
  | "not_comparable";

export interface OperationalReentryMatchedCohortBlockEvaluationV01 {
  repeat_block: OperationalReentryMatchedCohortBlockV01;
  status: "complete" | "incomplete";
  arm_evaluations: OperationalReentryMatchedCohortArmEvaluationV01[];
  e1_evaluation: OperationalReentryEvaluationV01 | null;
  e1_conditioning_relation: OperationalReentryEvaluationV01["conditioning_relation"] | "unknown";
  e1_reset_relation: OperationalReentryEvaluationV01["reset_relation"] | "unknown";
  pairwise_relations: Array<{
    left_arm: OperationalReentryMatchedCohortArmV01;
    right_arm: OperationalReentryMatchedCohortArmV01;
    relation: OperationalReentryMatchedCohortPairwiseRelationV01;
  }>;
  integrity: OperationalReentryMatchedCohortIntegrityV01;
}

export type OperationalReentryMatchedCohortRepeatabilityV01 =
  | "consistent"
  | "predominant"
  | "mixed"
  | "incomplete";

export interface OperationalReentryMatchedCohortReportV01 {
  report_version: "operational_reentry_matched_cohort_report.v0.1";
  cohort_id: string;
  completion_status: "complete" | "incomplete";
  terminal_calls: number;
  planned_calls: 16;
  source_head_and_tracked_worktree_unchanged_at_terminal: boolean;
  terminal_category_counts: Record<OperationalReentryMatchedCohortTerminalCategoryV01, number>;
  terminal_failure_code_counts: Record<string, number>;
  block_evaluations: OperationalReentryMatchedCohortBlockEvaluationV01[];
  repeatability: Array<{
    left_arm: OperationalReentryMatchedCohortArmV01;
    right_arm: OperationalReentryMatchedCohortArmV01;
    disposition: OperationalReentryMatchedCohortRepeatabilityV01;
    observed_relations: OperationalReentryMatchedCohortPairwiseRelationV01[];
  }>;
  exact_case_dispositions: {
    conditioning: "bounded_positive_signal" | "bounded_negative_signal" | "no_directional_signal" | "mixed" | "incomplete";
    reset: "repeatable_appropriate_reset" | "repeatable_stale_persistence" | "mixed" | "incomplete";
  };
  relation_counts: {
    e1_conditioning: Record<string, number>;
    e1_reset: Record<string, number>;
    a_vs_b: Record<OperationalReentryMatchedCohortPairwiseRelationV01, number>;
    c_vs_a: Record<OperationalReentryMatchedCohortPairwiseRelationV01, number>;
    contextual_vs_d: {
      a_vs_d: Record<OperationalReentryMatchedCohortPairwiseRelationV01, number>;
      b_vs_d: Record<OperationalReentryMatchedCohortPairwiseRelationV01, number>;
      c_vs_d: Record<OperationalReentryMatchedCohortPairwiseRelationV01, number>;
    };
  };
  operator_confirmation: {
    confirm_authorized_cohort: true;
    authorization_issue: 185;
    source_head: string;
    max_total_cost_usd: "5.00";
  };
  accounting: {
    attempted_provider_calls: number;
    completed_live_calls: number;
    failed_or_blocked_calls: number;
    missing_call_slots: number;
    provider_reported_input_tokens: number | null;
    provider_reported_cached_input_tokens: number | null;
    provider_reported_output_tokens: number | null;
    provider_reported_total_tokens: number | null;
    exact_cost_status: "calculated" | "unknown";
    calculated_exact_cost_nano_usd: number | null;
    aggregate_worst_case_cost_nano_usd: number;
    aggregate_ceiling_nano_usd: 5_000_000_000;
    latency_ms: { minimum: number | null; maximum: number | null; total: number | null };
    operator_intervention: { manual_retries: 0; replacement_calls: 0; manual_normalized_output_edits: 0 };
    post_egress_source_changes: 0 | 1;
  };
  limitations: string[];
  authority_ledger: {
    is_core_record: false;
    is_evidence: false;
    is_proposal: false;
    is_review_decision: false;
    is_transition: false;
    is_policy: false;
    writes_product_database: 0;
    writes_core: 0;
    mutates_task_context_packet: false;
    mutates_current_work: false;
    mutates_semantic_state: false;
    authorizes_execution: false;
    authorizes_automatic_context_injection: false;
    authorizes_fallback_or_rollback: false;
    authorizes_start_or_resume: false;
    authorizes_retry_or_scheduling: false;
    authorizes_external_actuation: false;
    authorizes_github_mutation: false;
    authorizes_publication: false;
    authorizes_merge: false;
    claims_hidden_actual_use: false;
    claims_general_causal_contribution: false;
    claims_general_benefit: false;
    claims_model_or_provider_superiority: false;
    creates_scalar_fitness: false;
    creates_global_winner: false;
    promotes_target_model_policy_or_actor: false;
    activates_stage_7: false;
    product_api_or_ui_changes: false;
    default_routing_changes: false;
    c9_started: false;
    ready_for_review_authority: false;
  };
  integrity: OperationalReentryMatchedCohortIntegrityV01;
}

export interface OperationalReentryMatchedCohortExecutionResultV01 {
  result_kind: "complete" | "incomplete";
  manifest: OperationalReentryMatchedCohortManifestV01;
  case: OperationalReentryMatchedCohortCaseV01;
  rubric: OperationalReentryMatchedCohortRubricV01;
  call_plan: OperationalReentryMatchedCohortCallPlanV01;
  pricing: OperationalReentryMatchedCohortPricingV01;
  calls: OperationalReentryMatchedCohortCallTerminalV01[];
  block_evaluations: OperationalReentryMatchedCohortBlockEvaluationV01[];
  report: OperationalReentryMatchedCohortReportV01;
}
