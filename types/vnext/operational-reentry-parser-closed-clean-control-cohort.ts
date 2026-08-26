import type { ModelProviderRejectionObservationV01 } from "@/lib/vnext/model-gateway/provider-rejection-observation";
import type { ModelProviderResponseInvalidObservationV01 } from "@/lib/vnext/model-gateway/provider-response-invalid-observation";
import type {
  ModelGatewayCostBudgetV01,
  ModelInvocationReceiptUsageV02,
  ModelInvocationReceiptV02,
} from "./model-invocation-receipt";
import type {
  OperationalReentryMatchedCohortArmV02,
  OperationalReentryMatchedCohortBlockEvaluationV02,
  OperationalReentryMatchedCohortBlockV02,
  OperationalReentryMatchedCohortIntegrityV02,
  OperationalReentryMatchedCohortModelInputV02,
  OperationalReentryMatchedCohortObservedArmV02,
} from "./operational-reentry-matched-cohort-v0-2";
import type {
  OperationalReentryMatchedCohortModelInputV03,
  OperationalReentryMatchedCohortModelOutputV03,
  OperationalReentryMatchedCohortProviderContractV03,
  OperationalReentryMatchedCohortRouteV03,
} from "./operational-reentry-matched-cohort-v0-3";

export const OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_VERSION_V01 =
  "operational_reentry_parser_closed_clean_control_matched_cohort.v0.1" as const;
export const OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_AUTHORIZATION_VERSION_V01 =
  "operational_reentry_parser_closed_clean_control_matched_cohort_authorization.v0.1" as const;
export const OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_PLAN_VERSION_V01 =
  "operational_reentry_parser_closed_clean_control_matched_cohort_plan.v0.1" as const;
export const OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_MANIFEST_VERSION_V01 =
  "operational_reentry_parser_closed_clean_control_matched_cohort_manifest.v0.1" as const;
export const OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_REPORT_VERSION_V01 =
  "operational_reentry_parser_closed_clean_control_matched_cohort_report.v0.1" as const;
export const OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_ARTIFACT_INDEX_VERSION_V01 =
  "operational_reentry_parser_closed_clean_control_matched_cohort_artifact_index.v0.1" as const;
export const OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_EVALUATOR_BRIDGE_VERSION_V01 =
  "operational_reentry_parser_closed_clean_control_evaluator_bridge.v0.1" as const;

export type OperationalReentryParserClosedCleanControlCohortIntegrityV01 =
  OperationalReentryMatchedCohortIntegrityV02;

export interface OperationalReentryParserClosedCleanControlCohortHarnessV01 {
  harness_version: typeof OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_VERSION_V01;
  issue_number: 219;
  implementation_kind: "zero_egress_future_live_harness";
  successor_live_authorizations_created: 0;
  successor_live_authorizations_consumed: 0;
  real_provider_calls: 0;
  behavioral_cohort_result: "none";
  compatibility_probe_result_reused_as_behavioral_input: false;
  behavioral_cohort_executed: false;
  replication_authorized: false;
  policy_authorized: false;
  stage_7_authorized: false;
}

export interface OperationalReentryParserClosedCleanControlCohortPlanEntryV01 {
  call_order: number;
  call_slot_id: string;
  repeat_block: OperationalReentryMatchedCohortBlockV02;
  position_in_block: 0 | 1 | 2 | 3;
  arm: OperationalReentryMatchedCohortArmV02;
  behavioral_family: typeof OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_VERSION_V01;
  case_fingerprint: string;
  common_task_evidence_fingerprint: string;
  non_target_continuation_fingerprint: string;
  treatment_material_fingerprint: string;
  model_input_fingerprint: string;
  provider_visible_request_fingerprint: string;
  schema_fingerprint: string;
  adapter_request_route_fingerprint: string;
  request_family_trace_id: string;
  client_request_id: string;
  model_input: OperationalReentryMatchedCohortModelInputV03;
}

export interface OperationalReentryParserClosedCleanControlCohortPlanV01 {
  plan_version: typeof OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_PLAN_VERSION_V01;
  behavioral_family: typeof OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_VERSION_V01;
  case_fingerprint: string;
  common_task_evidence_fingerprint: string;
  request_family_kind: "parser_closed_clean_control_cohort";
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
  maximum_parallel_provider_calls: 1;
  retries: 0;
  replacement_calls: 0;
  adaptive_stopping: false;
  fresh_stateless_invocation_per_call: true;
  conversation_reuse: false;
  thread_reuse: false;
  previous_response_reuse: false;
  entries: OperationalReentryParserClosedCleanControlCohortPlanEntryV01[];
  integrity: OperationalReentryParserClosedCleanControlCohortIntegrityV01;
}

export interface OperationalReentryParserClosedCleanControlEvaluatorBridgeV01 {
  bridge_version: typeof OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_EVALUATOR_BRIDGE_VERSION_V01;
  historical_evaluator_version: "operational_reentry_matched_cohort_evaluator.v0.2";
  historical_e1_evaluator_version: "operational_reentry_perturbation_evaluation.v0.1";
  parser_closed_wire_representation_is_evaluator_dimension: false;
  v03_semantics_equal_canonical_v02: true;
  compared_dimensions: readonly [
    "task",
    "common_task_evidence",
    "continuation_context",
    "stale_relation",
    "authority_notice",
    "result_status_semantics",
    "required_check_semantics",
    "operation_action_semantics",
    "result_limitation_semantics",
  ];
  integrity: OperationalReentryParserClosedCleanControlCohortIntegrityV01;
}

export interface OperationalReentryParserClosedCleanControlCohortPricingV01 {
  pricing_version: "operational_reentry_parser_closed_clean_control_matched_cohort_pricing.v0.1";
  pricing_snapshot_authority: "future_live_issue_must_refresh_official_pricing";
  pricing_source_version: string;
  pricing_snapshot_evaluated_at: string;
  pricing_authority_expires_at: string;
  pricing_authority_fingerprint: string;
  input_nano_usd_per_token: number;
  cached_input_nano_usd_per_token: number;
  output_nano_usd_per_token: number;
  exact_cost_basis: "validated_provider_reported_token_usage";
  missing_exact_usage_or_cost: "unknown_never_zero";
  gateway_cost_budget: ModelGatewayCostBudgetV01;
  per_call_conservative_worst_case_nano_usd: 11_699_200;
  aggregate_conservative_worst_case_nano_usd: 187_187_200;
  maximum_total_cost_nano_usd: 1_000_000_000;
  static_harness_is_live_pricing_authority: false;
  integrity: OperationalReentryParserClosedCleanControlCohortIntegrityV01;
}

export interface OperationalReentryParserClosedCleanControlCohortAuthorizationV01 {
  authorization_version: typeof OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_AUTHORIZATION_VERSION_V01;
  authorization_id: string;
  authorization_kind: "one_bounded_parser_closed_clean_control_behavioral_cohort";
  request_family_kind: "parser_closed_clean_control_cohort";
  future_live_issue_number: number;
  exact_merged_source_head: string;
  repository_slug: "hynk-studio/augnes";
  authorized_origin:
    "https://github.com/hynk-studio/augnes.git";
  issued_at: string;
  expires_at: string;
  workspace_id: string;
  project_id: string;
  expected_active_selection_revision: number;
  project_root_fingerprint: string;
  gateway_authorization_project_is_lab_experiment_meaning: false;
  case_fingerprint: string;
  common_task_evidence_fingerprint: string;
  behavioral_plan_fingerprint: string;
  route_fingerprint: string;
  provider_contract_fingerprint: string;
  adapter_request_route_fingerprint: string;
  evaluator_bridge_fingerprint: string;
  evaluator_bridge_version: typeof OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_EVALUATOR_BRIDGE_VERSION_V01;
  evaluator_version: "operational_reentry_matched_cohort_evaluator.v0.2";
  e1_evaluator_version: "operational_reentry_perturbation_evaluation.v0.1";
  provider_contract_version: "operational_reentry_clean_control_matched_cohort_provider_contract.v0.3";
  codec_version: "operational_reentry_matched_cohort_codec.v0.4";
  response_schema_version: "operational_reentry_matched_cohort_response_schema.v0.4";
  parser_version: "operational_reentry_matched_cohort_parser.v0.3";
  adapter_implementation_version: "openai_responses_operational_reentry_matched_cohort_adapter.v0.5";
  planned_calls: 16;
  maximum_parallel_provider_calls: 1;
  retries: 0;
  replacement_calls: 0;
  adaptive_stopping: false;
  fresh_stateless_invocation_per_call: true;
  conversation_reuse: false;
  thread_reuse: false;
  previous_response_reuse: false;
  behavioral_cohort_authorized: true;
  replication_authorized: false;
  policy_authorized: false;
  stage_7_authorized: false;
  pricing_snapshot_evaluated_at: string;
  pricing_source_version: string;
  pricing_authority_fingerprint: string;
  pricing_authority_expires_at: string;
  pricing_fingerprint: string;
  maximum_total_cost_nano_usd: 1_000_000_000;
  integrity: OperationalReentryParserClosedCleanControlCohortIntegrityV01;
}

export interface OperationalReentryParserClosedCleanControlCohortManifestV01 {
  manifest_version: typeof OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_MANIFEST_VERSION_V01;
  cohort_version: typeof OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_VERSION_V01;
  cohort_id: string;
  future_live_issue_number: number;
  source_repository_head_sha: string;
  authorization_fingerprint: string;
  case_fingerprint: string;
  common_task_evidence_fingerprint: string;
  plan_fingerprint: string;
  evaluator_bridge_fingerprint: string;
  route: OperationalReentryMatchedCohortRouteV03;
  provider_contract_fingerprint: string;
  adapter_request_route_fingerprint: string;
  pricing_fingerprint: string;
  request_family_kind: "parser_closed_clean_control_cohort";
  provider_egress: "allow_only_with_supplied_future_authorization";
  data_classification: "public_safe";
  retention_class: "none";
  raw_prompt_persisted: false;
  raw_request_body_persisted: false;
  raw_provider_response_persisted: false;
  raw_provider_error_persisted: false;
  hidden_reasoning_persisted: false;
  credentials_or_full_headers_persisted: false;
  integrity: OperationalReentryParserClosedCleanControlCohortIntegrityV01;
}

export type OperationalReentryParserClosedCleanControlCohortTerminalCategoryV01 =
  | "completed_live"
  | "provider_rejected"
  | "provider_response_invalid"
  | "transport_failed"
  | "timed_out"
  | "cancelled"
  | "blocked_before_egress"
  | "authority_or_source_route_drift"
  | "internal_failure"
  | "not_attempted_after_hard_stop";

export interface OperationalReentryParserClosedCleanControlCohortCallTerminalV01 {
  call_order: number;
  call_slot_id: string;
  repeat_block: OperationalReentryMatchedCohortBlockV02;
  position_in_block: 0 | 1 | 2 | 3;
  arm: OperationalReentryMatchedCohortArmV02;
  terminal_category: OperationalReentryParserClosedCleanControlCohortTerminalCategoryV01;
  hard_stop: boolean;
  egress_attempted: boolean;
  request_family_kind: "parser_closed_clean_control_cohort";
  request_family_trace_id: string;
  client_request_id: string;
  model_input_fingerprint: string;
  route_fingerprint: string;
  provider_contract_fingerprint: string;
  pricing_fingerprint: string;
  input_bytes: number | null;
  usage: ModelInvocationReceiptUsageV02 | null;
  latency_ms: number | null;
  normalized_output: OperationalReentryMatchedCohortModelOutputV03 | null;
  normalized_output_fingerprint: string | null;
  receipt: ModelInvocationReceiptV02 | null;
  provider_rejection_observation: ModelProviderRejectionObservationV01 | null;
  provider_response_invalid_observation: ModelProviderResponseInvalidObservationV01 | null;
  terminal_failure_code: string | null;
  exact_cost_nano_usd: number | "unknown";
  integrity: OperationalReentryParserClosedCleanControlCohortIntegrityV01;
}

export interface OperationalReentryParserClosedCleanControlCohortReportV01 {
  report_version: typeof OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_REPORT_VERSION_V01;
  cohort_id: string;
  completion_status: "complete" | "incomplete";
  planned_calls: 16;
  terminal_call_records: 16;
  attempted_provider_calls: number;
  terminal_execution_state_valid: boolean;
  complete_blocks: OperationalReentryMatchedCohortBlockV02[];
  incomplete_blocks: OperationalReentryMatchedCohortBlockV02[];
  terminal_category_counts: Record<
    OperationalReentryParserClosedCleanControlCohortTerminalCategoryV01,
    number
  >;
  common_compliance_valid_blocks: number;
  compliance_asymmetry_count: number;
  conditioning_relations: Array<{ block: OperationalReentryMatchedCohortBlockV02; relation: string }>;
  reset_relations: Array<{ block: OperationalReentryMatchedCohortBlockV02; relation: string }>;
  bounded_pairwise_relation_counts: Record<string, number>;
  relation_repeatability: "repeatable" | "mixed" | "unknown";
  usage: {
    known_call_count: number;
    cached_input_known_call_count: number;
    total_input_tokens: number | "unknown";
    total_cached_input_tokens: number | "unknown";
    total_uncached_input_tokens: number | "unknown";
    total_output_tokens: number | "unknown";
  };
  latency: { known_call_count: number; total_ms: number | "unknown" };
  exact_cost_nano_usd: number | "unknown";
  conservative_cost: {
    per_call_worst_case_nano_usd: 11_699_200;
    planned_aggregate_worst_case_nano_usd: 187_187_200;
    authorization_ceiling_nano_usd: 1_000_000_000;
  };
  limitations: readonly [
    "synthetic_behavioral_result_is_not_core_evidence",
    "no_product_history_attribution",
    "no_policy_or_promotion_authority",
  ];
  historical_stage_5: {
    actual_use: "unknown";
    support_validation: "unknown";
    outcome_association: "unknown";
    causal_contribution: "unknown";
    exact_case: "inconclusive";
  };
  scalar_score_created: false;
  rank_created: false;
  winner_created: false;
  product_database_writes: 0;
  core_writes: 0;
  proposal_writes: 0;
  review_decision_writes: 0;
  transition_writes: 0;
  policy_writes: 0;
  authorization_consumed: boolean;
  integrity: OperationalReentryParserClosedCleanControlCohortIntegrityV01;
}

export interface OperationalReentryParserClosedCleanControlCohortPreparedV01 {
  authorization: OperationalReentryParserClosedCleanControlCohortAuthorizationV01;
  plan: OperationalReentryParserClosedCleanControlCohortPlanV01;
  evaluator_bridge: OperationalReentryParserClosedCleanControlEvaluatorBridgeV01;
  provider_contract: OperationalReentryMatchedCohortProviderContractV03;
  pricing: OperationalReentryParserClosedCleanControlCohortPricingV01;
  manifest: OperationalReentryParserClosedCleanControlCohortManifestV01;
}

export interface OperationalReentryParserClosedCleanControlCohortExecutionResultV01
  extends OperationalReentryParserClosedCleanControlCohortPreparedV01 {
  calls: OperationalReentryParserClosedCleanControlCohortCallTerminalV01[];
  evaluator_inputs: OperationalReentryMatchedCohortObservedArmV02[];
  block_evaluations: OperationalReentryMatchedCohortBlockEvaluationV02[];
  report: OperationalReentryParserClosedCleanControlCohortReportV01;
}

export interface OperationalReentryParserClosedCleanControlCohortAuthorizationCandidateInputV01
  extends Omit<
    OperationalReentryParserClosedCleanControlCohortAuthorizationV01,
    "authorization_version" | "authorization_kind" | "request_family_kind" | "integrity"
  > {}

export interface OperationalReentryParserClosedCleanControlEvaluatorProjectionV01 {
  bridge: OperationalReentryParserClosedCleanControlEvaluatorBridgeV01;
  canonical_v02_input: OperationalReentryMatchedCohortModelInputV02;
  observed_arm: OperationalReentryMatchedCohortObservedArmV02;
}
