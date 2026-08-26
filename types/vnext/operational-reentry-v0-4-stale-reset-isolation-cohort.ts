import type { ModelGatewayCostBudgetV01, ModelInvocationReceiptV02 } from "./model-invocation-receipt";
import type {
  OperationalReentryMatchedCohortIntegrityV04,
  OperationalReentryMatchedCohortInvocationV04,
  OperationalReentryMatchedCohortModelOutputV04,
  OperationalReentryMatchedCohortRouteV04,
} from "./operational-reentry-matched-cohort-v0-4";

export const OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_COHORT_VERSION_V01 =
  "operational_reentry_v04_stale_reset_isolation_cohort.v0.1" as const;
export const OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_PLAN_VERSION_V01 =
  "operational_reentry_v04_stale_reset_isolation_plan.v0.1" as const;
export const OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_EVALUATOR_VERSION_V01 =
  "operational_reentry_v04_stale_reset_isolation_evaluator.v0.1" as const;
export const OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_AUTHORIZATION_VERSION_V01 =
  "operational_reentry_v04_stale_reset_isolation_authorization.v0.1" as const;
export const OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_PRICING_VERSION_V01 =
  "operational_reentry_v04_stale_reset_isolation_pricing.v0.1" as const;
export const OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_MANIFEST_VERSION_V01 =
  "operational_reentry_v04_stale_reset_isolation_manifest.v0.1" as const;
export const OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_REPORT_VERSION_V01 =
  "operational_reentry_v04_stale_reset_isolation_report.v0.1" as const;
export const OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_ARTIFACT_INDEX_VERSION_V01 =
  "operational_reentry_v04_stale_reset_isolation_artifact_index.v0.1" as const;
export const OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_GATE_VERSION_V01 =
  "operational_reentry_v04_stale_reset_isolation_gate.v0.1" as const;
export const OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_PROVENANCE_VERSION_V01 =
  "operational_reentry_v04_stale_reset_isolation_provenance.v0.1" as const;
export const OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_CONFORMANCE_VERSION_V01 =
  "operational_reentry_v04_stale_reset_isolation_bg_conformance.v0.1" as const;

export type OperationalReentryV04StaleResetIsolationIntegrityV01 =
  OperationalReentryMatchedCohortIntegrityV04;
export type OperationalReentryV04StaleResetIsolationArmV01 =
  | "A"
  | "B"
  | "C"
  | "G";
export type OperationalReentryV04StaleResetIsolationBlockV01 = 0 | 1 | 2 | 3;

export interface OperationalReentryV04StaleResetIsolationGateContractV01 {
  gate_version: typeof OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_GATE_VERSION_V01;
  provenance_version: typeof OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_PROVENANCE_VERSION_V01;
  source_case_fingerprint: string;
  upstream_target_fingerprint: string;
  upstream_stale_relation_fingerprint: string;
  non_target_material_fingerprint: string;
  gate_disposition: "excluded_before_materialization";
  projected_provider_shape: "exact_B";
  local_provenance_provider_visibility: "absent";
  raw_target_text_persisted: false;
  core_evidence_created: false;
  proposal_review_decision_transition_created: false;
  policy_or_rank_winner_created: false;
  integrity: OperationalReentryV04StaleResetIsolationIntegrityV01;
}

export interface OperationalReentryV04StaleResetIsolationGateProvenanceV01 {
  provenance_version: typeof OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_PROVENANCE_VERSION_V01;
  gate_version: typeof OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_GATE_VERSION_V01;
  source_case_fingerprint: string;
  upstream_target_fingerprint: string;
  upstream_stale_relation_fingerprint: string;
  non_target_material_fingerprint: string;
  source_gate_lineage_fingerprint: string;
  gate_disposition: "excluded_before_materialization";
  target_excluded: true;
  stale_relation_excluded: true;
  non_target_material_unchanged: true;
  projected_provider_material_fingerprint: string;
  provider_request_fingerprint: string;
  local_provenance_provider_visibility: "absent";
  integrity: OperationalReentryV04StaleResetIsolationIntegrityV01;
}

export interface OperationalReentryV04StaleResetIsolationPlanEntryV01 {
  call_order: number;
  call_slot_id: string;
  repeat_block: OperationalReentryV04StaleResetIsolationBlockV01;
  position_in_block: 0 | 1 | 2 | 3;
  arm: OperationalReentryV04StaleResetIsolationArmV01;
  cohort_ref: string;
  local_source_provenance_fingerprint: string;
  local_invocation_identity_fingerprint: string;
  local_manifest_identity_fingerprint: string;
  non_intervention_parity_fingerprint: string;
  common_task_evidence_fingerprint: string;
  provider_material_fingerprint: string;
  provider_visible_request_fingerprint: string;
  schema_fingerprint: string;
  route_fingerprint: string;
  provider_contract_fingerprint: string;
  adapter_request_route_fingerprint: string;
  request_family_trace_id: string;
  client_request_id: string;
  invocation: OperationalReentryMatchedCohortInvocationV04;
  gate_provenance: OperationalReentryV04StaleResetIsolationGateProvenanceV01 | null;
}

export interface OperationalReentryV04StaleResetIsolationBgConformanceWitnessV01 {
  conformance_version: typeof OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_CONFORMANCE_VERSION_V01;
  repeat_block: OperationalReentryV04StaleResetIsolationBlockV01;
  left_arm: "B";
  right_arm: "G";
  experimental_arms_distinct: true;
  local_source_provenance_distinct: true;
  local_cohort_refs_distinct: true;
  local_call_slot_ids_distinct: true;
  local_invocation_identities_distinct: true;
  request_family_trace_ids_distinct: true;
  client_request_ids_distinct: true;
  local_manifest_identities_distinct: true;
  provider_material_equal: true;
  provider_material_fingerprint_equal: true;
  endpoint_equal: true;
  http_method_equal: true;
  model_equal: true;
  system_prompt_equal: true;
  dynamic_user_material_equal: true;
  strict_response_schema_equal: true;
  schema_name_equal: true;
  max_output_tokens_equal: true;
  store_false_equal: true;
  openai_json_request_body_bytes_equal: true;
  provider_visible_request_fingerprint_equal: true;
  schema_fingerprint_equal: true;
  provider_contract_identity_equal: true;
  route_fingerprint_equal: true;
  adapter_request_route_fingerprint_equal: true;
  request_response_budget_identity_equal: true;
  g_provenance_provider_visibility: "absent";
  provider_material_fingerprint: string;
  provider_visible_request_fingerprint: string;
  integrity: OperationalReentryV04StaleResetIsolationIntegrityV01;
}

export interface OperationalReentryV04StaleResetIsolationPlanV01 {
  plan_version: typeof OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_PLAN_VERSION_V01;
  cohort_version: typeof OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_COHORT_VERSION_V01;
  case_fingerprint: string;
  common_task_evidence_fingerprint: string;
  gate_contract_fingerprint: string;
  request_family_kind: "operational_reentry_v04_stale_reset_isolation_cohort";
  planned_calls: 16;
  repeat_blocks: 4;
  calls_per_block: 4;
  calls_per_arm: 4;
  sealed_order: readonly [
    readonly ["A", "B", "G", "C"],
    readonly ["B", "C", "A", "G"],
    readonly ["C", "G", "B", "A"],
    readonly ["G", "A", "C", "B"],
  ];
  each_arm_once_per_ordinal_position: true;
  maximum_parallel_provider_calls: 1;
  retries: 0;
  replacement_calls: 0;
  adaptive_stopping: false;
  fresh_stateless_invocation_per_call: true;
  conversation_reuse: false;
  thread_reuse: false;
  previous_response_reuse: false;
  entries: OperationalReentryV04StaleResetIsolationPlanEntryV01[];
  bg_conformance_witnesses: OperationalReentryV04StaleResetIsolationBgConformanceWitnessV01[];
  integrity: OperationalReentryV04StaleResetIsolationIntegrityV01;
}

export type OperationalReentryV04StaleResetIsolationLayerAStatusV01 =
  | "valid_target_present"
  | "valid_target_absent_or_gated"
  | "protocol_invalid"
  | "not_comparable";

export interface OperationalReentryV04StaleResetIsolationLayerAV01 {
  layer_version: "operational_reentry_v04_stale_reset_isolation_layer_a.v0.1";
  arm: OperationalReentryV04StaleResetIsolationArmV01;
  status: OperationalReentryV04StaleResetIsolationLayerAStatusV01;
  upstream_target_identity:
    | "exact_frozen_target"
    | "absent"
    | "unknown"
    | "protocol_invalid";
  upstream_stale_relation_identity:
    | "exact_frozen_relation"
    | "absent"
    | "unknown"
    | "protocol_invalid";
  substrate_gate_disposition:
    | "not_applicable"
    | "excluded_before_materialization"
    | "not_excluded"
    | "unknown"
    | "protocol_invalid";
  source_gate_lineage: string | "not_applicable" | "unknown" | "protocol_invalid";
  provider_projection_shape: "exact_A" | "exact_B" | "exact_C" | "unknown" | "protocol_invalid";
  provider_target_material: "present" | "absent" | "unknown" | "protocol_invalid";
  provider_stale_relation: "present" | "absent" | "unknown" | "protocol_invalid";
  provider_material_fingerprint: string | "mismatch" | "unknown" | "protocol_invalid";
  provider_request_fingerprint: string | "mismatch" | "unknown" | "protocol_invalid";
  local_provenance_provider_visibility: "absent" | "present_protocol_invalid" | "unknown";
  integrity: OperationalReentryV04StaleResetIsolationIntegrityV01;
}

export type OperationalReentryV04StaleResetIsolationPresenceV01 =
  | "present"
  | "absent"
  | "unknown"
  | "protocol_invalid";
export type OperationalReentryV04StaleResetIsolationLimitationV01 =
  | "absent"
  | "target_not_available"
  | "stale_withheld"
  | "stale_persisted"
  | "mixed"
  | "unknown"
  | "protocol_invalid";
export type OperationalReentryV04StaleResetIsolationArmBehavioralStateV01 =
  | "bounded_target_persistence_observed"
  | "no_target_persistence_observed"
  | "unknown"
  | "not_comparable"
  | "protocol_invalid";

export interface OperationalReentryV04StaleResetIsolationLayerBV01 {
  layer_version: "operational_reentry_v04_stale_reset_isolation_layer_b.v0.1";
  arm: OperationalReentryV04StaleResetIsolationArmV01;
  selected_or_referenced_target_identity: OperationalReentryV04StaleResetIsolationPresenceV01;
  target_action_or_decision_preparation: OperationalReentryV04StaleResetIsolationPresenceV01;
  target_specific_result_limitation: OperationalReentryV04StaleResetIsolationLimitationV01;
  continuation_packet_target_material: OperationalReentryV04StaleResetIsolationPresenceV01 | "not_comparable";
  target_disposition:
    | OperationalReentryMatchedCohortModelOutputV04["target_disposition"]
    | "unknown"
    | "protocol_invalid";
  target_specific_required_check_relation: "not_available_under_v04" | "unknown" | "protocol_invalid";
  target_abstention_relation: "consistent" | "inconsistent" | "not_available" | "unknown" | "protocol_invalid";
  independent_directional_observation_count: 3;
  derived_aliases_add_weight: false;
  action_and_decision_preparation_counted_once: true;
  state: OperationalReentryV04StaleResetIsolationArmBehavioralStateV01;
  integrity: OperationalReentryV04StaleResetIsolationIntegrityV01;
}

export type OperationalReentryV04StaleResetIsolationDimensionRelationV01 =
  | "equal"
  | "left_more_persistent"
  | "right_more_persistent"
  | "unknown"
  | "not_comparable";
export type OperationalReentryV04StaleResetIsolationTargetPersistenceRelationV01 =
  | "equal"
  | "left_persists_more"
  | "right_persists_more"
  | "mixed"
  | "unknown"
  | "not_comparable"
  | "protocol_invalid"
  | "compliance_asymmetry";

export interface OperationalReentryV04StaleResetIsolationPairEvaluationV01 {
  pair_version: "operational_reentry_v04_stale_reset_isolation_pair.v0.1";
  pair_id: "A-B" | "A-C" | "A-G" | "B-C" | "B-G" | "C-G";
  direct_evaluation: true;
  inferred_transitively: false;
  hypothesis_label: "H1" | "H2" | "H3" | "H4" | "H5_context";
  left_arm: OperationalReentryV04StaleResetIsolationArmV01;
  right_arm: OperationalReentryV04StaleResetIsolationArmV01;
  left_layer_a_status: OperationalReentryV04StaleResetIsolationLayerAStatusV01;
  right_layer_a_status: OperationalReentryV04StaleResetIsolationLayerAStatusV01;
  left_common_compliance: "valid" | "invalid" | "unknown";
  right_common_compliance: "valid" | "invalid" | "unknown";
  comparison_status:
    | "comparable"
    | "protocol_invalid"
    | "not_comparable"
    | "compliance_asymmetry"
    | "unknown";
  dimension_relations: {
    selected_or_referenced_target_identity: OperationalReentryV04StaleResetIsolationDimensionRelationV01;
    target_action_or_decision_preparation: OperationalReentryV04StaleResetIsolationDimensionRelationV01;
    target_specific_result_limitation: OperationalReentryV04StaleResetIsolationDimensionRelationV01;
  };
  target_persistence_relation: OperationalReentryV04StaleResetIsolationTargetPersistenceRelationV01;
  whole_output_behavioral_relation: "equal" | "distinct" | "unknown" | "not_comparable";
  common_compliance_relation:
    | "both_valid"
    | "both_invalid"
    | "compliance_asymmetry"
    | "unknown";
  bounded_outcome_relation:
    | "equal"
    | "left_only_passes_declared_dimensions"
    | "right_only_passes_declared_dimensions"
    | "unknown"
    | "not_comparable";
  scalar_score_created: false;
  rank_or_winner_created: false;
  integrity: OperationalReentryV04StaleResetIsolationIntegrityV01;
}

export interface OperationalReentryV04StaleResetIsolationObservedArmV01 {
  entry: OperationalReentryV04StaleResetIsolationPlanEntryV01;
  normalized_output: OperationalReentryMatchedCohortModelOutputV04 | null;
  layer_a?: OperationalReentryV04StaleResetIsolationLayerAV01;
  layer_b?: OperationalReentryV04StaleResetIsolationLayerBV01;
}

export interface OperationalReentryV04StaleResetIsolationBlockEvaluationV01 {
  evaluator_version: typeof OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_EVALUATOR_VERSION_V01;
  repeat_block: OperationalReentryV04StaleResetIsolationBlockV01;
  status: "complete" | "incomplete";
  layer_a: OperationalReentryV04StaleResetIsolationLayerAV01[];
  layer_b: OperationalReentryV04StaleResetIsolationLayerBV01[];
  pair_evaluations: OperationalReentryV04StaleResetIsolationPairEvaluationV01[];
  all_six_pairs_evaluated_directly: boolean;
  pair_results_inferred_transitively: false;
  deterministic_no_score_aggregation: true;
  integrity: OperationalReentryV04StaleResetIsolationIntegrityV01;
}

export interface OperationalReentryV04StaleResetIsolationEvaluatorContractV01 {
  evaluator_version: typeof OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_EVALUATOR_VERSION_V01;
  layer_a_dimensions: readonly [
    "upstream_target_identity",
    "upstream_stale_relation_identity",
    "substrate_gate_disposition",
    "source_gate_lineage",
    "provider_projection_shape",
    "provider_target_material",
    "provider_stale_relation",
    "provider_material_fingerprint",
    "provider_request_fingerprint",
    "local_provenance_provider_visibility",
  ];
  layer_b_independent_dimensions: readonly [
    "selected_or_referenced_target_identity",
    "target_action_or_decision_preparation",
    "target_specific_result_limitation",
  ];
  direct_pairs: readonly ["A-B", "A-C", "A-G", "B-C", "B-G", "C-G"];
  dimension_counting: false;
  majority_vote: false;
  weighting: false;
  scalar_score: false;
  rank_or_winner: false;
  transitive_pair_inference: false;
  integrity: OperationalReentryV04StaleResetIsolationIntegrityV01;
}

export interface OperationalReentryV04StaleResetIsolationPricingV01 {
  pricing_version: typeof OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_PRICING_VERSION_V01;
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
  per_call_conservative_worst_case_nano_usd: number;
  aggregate_conservative_worst_case_nano_usd: number;
  maximum_total_cost_nano_usd: 250_000_000;
  static_harness_is_live_pricing_authority: false;
  integrity: OperationalReentryV04StaleResetIsolationIntegrityV01;
}

export interface OperationalReentryV04StaleResetIsolationAuthorizationV01 {
  authorization_version: typeof OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_AUTHORIZATION_VERSION_V01;
  authorization_id: string;
  authorization_kind: "one_bounded_operational_reentry_v04_stale_reset_isolation_cohort";
  request_family_kind: "operational_reentry_v04_stale_reset_isolation_cohort";
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
  g_gate_provenance_contract_fingerprint: string;
  sealed_plan_fingerprint: string;
  evaluator_fingerprint: string;
  bg_static_conformance_witness_fingerprint: string;
  route_fingerprint: string;
  provider_contract_fingerprint: string;
  adapter_request_route_fingerprint: string;
  codec_version: "operational_reentry_matched_cohort_codec.v0.5";
  response_schema_version: "operational_reentry_matched_cohort_response_schema.v0.4";
  parser_version: "operational_reentry_matched_cohort_parser.v0.4";
  adapter_implementation_id: "openai_responses.operational_reentry_matched_cohort";
  adapter_implementation_version: "openai_responses_operational_reentry_matched_cohort_adapter.v0.6";
  model: "gpt-4.1-mini-2025-04-14";
  response_bytes: 1168;
  max_output_tokens: 1168;
  final_request_bytes: 24576;
  request_family: "operational_reentry_v04_stale_reset_isolation_cohort";
  planned_calls: 16;
  repeat_blocks: 4;
  calls_per_arm: 4;
  maximum_parallel_provider_calls: 1;
  retries: 0;
  replacements: 0;
  adaptive_changes: 0;
  fresh_stateless_invocation_per_call: true;
  conversation_reuse: false;
  thread_reuse: false;
  previous_response_reuse: false;
  pricing_snapshot_fingerprint: string;
  pricing_snapshot_evaluated_at: string;
  pricing_authority_fingerprint: string;
  pricing_authority_expires_at: string;
  aggregate_worst_case_cost_nano_usd: number;
  maximum_total_cost_nano_usd: 250_000_000;
  historical_authorization_reuse: false;
  second_cohort_under_same_authorization: false;
  replication: false;
  policy: false;
  stage_7: false;
  integrity: OperationalReentryV04StaleResetIsolationIntegrityV01;
}

export interface OperationalReentryV04StaleResetIsolationManifestV01 {
  manifest_version: typeof OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_MANIFEST_VERSION_V01;
  cohort_version: typeof OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_COHORT_VERSION_V01;
  cohort_id: string;
  future_live_issue_number: number;
  source_repository_head_sha: string;
  authorization_fingerprint: string;
  case_fingerprint: string;
  common_task_evidence_fingerprint: string;
  gate_contract_fingerprint: string;
  plan_fingerprint: string;
  evaluator_fingerprint: string;
  bg_static_conformance_witness_fingerprint: string;
  route: OperationalReentryMatchedCohortRouteV04;
  provider_contract_fingerprint: string;
  adapter_request_route_fingerprint: string;
  pricing_fingerprint: string;
  request_family_kind: "operational_reentry_v04_stale_reset_isolation_cohort";
  provider_egress: "allow_only_with_supplied_future_authorization";
  data_classification: "public_safe";
  retention_class: "none";
  raw_prompt_persisted: false;
  raw_request_body_persisted: false;
  raw_provider_response_persisted: false;
  raw_provider_error_persisted: false;
  hidden_reasoning_persisted: false;
  credentials_or_full_headers_persisted: false;
  integrity: OperationalReentryV04StaleResetIsolationIntegrityV01;
}

export type OperationalReentryV04StaleResetIsolationTerminalCategoryV01 =
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

export interface OperationalReentryV04StaleResetIsolationCallTerminalV01 {
  call_order: number;
  call_slot_id: string;
  repeat_block: OperationalReentryV04StaleResetIsolationBlockV01;
  position_in_block: 0 | 1 | 2 | 3;
  arm: OperationalReentryV04StaleResetIsolationArmV01;
  terminal_category: OperationalReentryV04StaleResetIsolationTerminalCategoryV01;
  egress_attempted: boolean;
  request_family_kind: "operational_reentry_v04_stale_reset_isolation_cohort";
  request_family_trace_id: string;
  client_request_id: string;
  local_invocation_identity_fingerprint: string;
  provider_material_fingerprint: string;
  provider_visible_request_fingerprint: string;
  normalized_output: OperationalReentryMatchedCohortModelOutputV04 | null;
  normalized_output_fingerprint: string | null;
  receipt: ModelInvocationReceiptV02 | null;
  exact_cost_nano_usd: number | "unknown";
  failure_code: string | null;
  retries: 0;
  replacement_calls: 0;
  integrity: OperationalReentryV04StaleResetIsolationIntegrityV01;
}

export interface OperationalReentryV04StaleResetIsolationReportV01 {
  report_version: typeof OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_REPORT_VERSION_V01;
  cohort_id: string;
  completion_status: "complete" | "incomplete";
  planned_calls: 16;
  terminal_call_records: 16;
  attempted_provider_calls: number;
  complete_blocks: number;
  all_six_pair_records: number;
  authorization_consumed: boolean;
  behavioral_result: "bounded_structured_observations_only" | "none";
  real_provider_calls: number;
  retries: 0;
  replacement_calls: 0;
  replication_authorized: false;
  policy_authorized: false;
  stage_7_authorized: false;
  product_database_writes: 0;
  core_writes: 0;
  integrity: OperationalReentryV04StaleResetIsolationIntegrityV01;
}

export interface OperationalReentryV04StaleResetIsolationPreparedV01 {
  authorization: OperationalReentryV04StaleResetIsolationAuthorizationV01;
  pricing: OperationalReentryV04StaleResetIsolationPricingV01;
  gate_contract: OperationalReentryV04StaleResetIsolationGateContractV01;
  evaluator_contract: OperationalReentryV04StaleResetIsolationEvaluatorContractV01;
  plan: OperationalReentryV04StaleResetIsolationPlanV01;
  manifest: OperationalReentryV04StaleResetIsolationManifestV01;
}

export interface OperationalReentryV04StaleResetIsolationExecutionResultV01
  extends OperationalReentryV04StaleResetIsolationPreparedV01 {
  calls: OperationalReentryV04StaleResetIsolationCallTerminalV01[];
  blocks: OperationalReentryV04StaleResetIsolationBlockEvaluationV01[];
  report: OperationalReentryV04StaleResetIsolationReportV01;
}
