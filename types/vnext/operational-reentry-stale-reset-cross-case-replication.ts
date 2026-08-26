import type { ExternalRefV01 } from "./external-ref";
import type {
  ModelGatewayCostBudgetV01,
  ModelInvocationReceiptV02,
} from "./model-invocation-receipt";

export const OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_VERSION_V01 =
  "operational_reentry_stale_reset_cross_case_replication.v0.1" as const;
export const OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_VERSION_V02 =
  "operational_reentry_stale_reset_cross_case_replication.v0.2" as const;
export const OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_CODEC_VERSION_V01 =
  "operational_reentry_stale_reset_cross_case_replication_codec.v0.1" as const;
export const OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_CODEC_VERSION_V02 =
  "operational_reentry_stale_reset_cross_case_replication_codec.v0.2" as const;
export const OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_PROVIDER_CONTRACT_VERSION_V01 =
  "operational_reentry_stale_reset_cross_case_replication_provider_contract.v0.1" as const;
export const OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_PROVIDER_CONTRACT_VERSION_V02 =
  "operational_reentry_stale_reset_cross_case_replication_provider_contract.v0.2" as const;
export const OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_RESPONSE_SCHEMA_VERSION_V01 =
  "operational_reentry_stale_reset_cross_case_replication_response_schema.v0.1" as const;
export const OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_RESPONSE_SCHEMA_VERSION_V02 =
  "operational_reentry_stale_reset_cross_case_replication_response_schema.v0.2" as const;
export const OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_PARSER_VERSION_V01 =
  "operational_reentry_stale_reset_cross_case_replication_parser.v0.1" as const;
export const OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_PARSER_VERSION_V02 =
  "operational_reentry_stale_reset_cross_case_replication_parser.v0.2" as const;
export const OPENAI_RESPONSES_OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_ADAPTER_VERSION_V01 =
  "openai_responses_operational_reentry_stale_reset_cross_case_replication_adapter.v0.1" as const;
export const OPENAI_RESPONSES_OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_ADAPTER_VERSION_V02 =
  "openai_responses_operational_reentry_stale_reset_cross_case_replication_adapter.v0.2" as const;
export const OPERATIONAL_REENTRY_V04_STALE_RESET_REPLICATION_CASE_VERSION_V01 =
  "operational_reentry_v04_stale_reset_replication_case.v0.1" as const;
export const OPERATIONAL_REENTRY_V04_STALE_RESET_REPLICATION_PLAN_VERSION_V01 =
  "operational_reentry_v04_stale_reset_replication_plan.v0.1" as const;
export const OPERATIONAL_REENTRY_V04_STALE_RESET_REPLICATION_PLAN_VERSION_V02 =
  "operational_reentry_v04_stale_reset_replication_plan.v0.2" as const;
export const OPERATIONAL_REENTRY_V04_STALE_RESET_REPLICATION_EVALUATOR_VERSION_V01 =
  "operational_reentry_v04_stale_reset_replication_evaluator.v0.1" as const;
export const OPERATIONAL_REENTRY_V04_STALE_RESET_REPLICATION_AUTHORIZATION_VERSION_V01 =
  "operational_reentry_v04_stale_reset_replication_authorization.v0.1" as const;
export const OPERATIONAL_REENTRY_V04_STALE_RESET_REPLICATION_AUTHORIZATION_VERSION_V02 =
  "operational_reentry_v04_stale_reset_replication_authorization.v0.2" as const;
export const OPERATIONAL_REENTRY_V04_STALE_RESET_REPLICATION_MANIFEST_VERSION_V01 =
  "operational_reentry_v04_stale_reset_replication_manifest.v0.1" as const;
export const OPERATIONAL_REENTRY_V04_STALE_RESET_REPLICATION_REPORT_VERSION_V01 =
  "operational_reentry_v04_stale_reset_replication_report.v0.1" as const;
export const OPERATIONAL_REENTRY_V04_STALE_RESET_REPLICATION_ARTIFACT_INDEX_VERSION_V01 =
  "operational_reentry_v04_stale_reset_replication_artifact_index.v0.1" as const;
export const OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_COMPATIBILITY_VERSION_V01 =
  "operational_reentry_stale_reset_cross_case_compatibility_probe.v0.1" as const;
export const OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_COMPATIBILITY_VERSION_V02 =
  "operational_reentry_stale_reset_cross_case_compatibility_probe.v0.2" as const;
export const OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_COMPATIBILITY_AUTHORIZATION_VERSION_V01 =
  "operational_reentry_stale_reset_cross_case_compatibility_probe_authorization.v0.1" as const;
export const OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_COMPATIBILITY_AUTHORIZATION_VERSION_V02 =
  "operational_reentry_stale_reset_cross_case_compatibility_probe_authorization.v0.2" as const;

export const OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_PURPOSE_V01 =
  "operational_reentry_stale_reset_cross_case_replication_v01" as const;
export const OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_REQUEST_FAMILY_V01 =
  "operational_reentry_v04_stale_reset_cross_case_replication" as const;
export const OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_COMPATIBILITY_REQUEST_FAMILY_V01 =
  "operational_reentry_stale_reset_cross_case_compatibility_probe" as const;

export const OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_IDS_V01 = [
  "operational-reentry-v04-stale-reset-replication-case:r1-reference-supersession-public-safe-01",
  "operational-reentry-v04-stale-reset-replication-case:r2-action-regime-supersession-public-safe-01",
] as const;

export type OperationalReentryStaleResetCrossCaseIdV01 =
  (typeof OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_IDS_V01)[number];
export type OperationalReentryStaleResetCrossCaseArmV01 = "A" | "B" | "C" | "G";
export type OperationalReentryStaleResetCrossCaseProviderShapeV01 = "A" | "B" | "C";
export type OperationalReentryStaleResetCrossCaseBlockV01 = 0 | 1 | 2 | 3;

export interface OperationalReentryStaleResetCrossCaseIntegrityV01 {
  algorithm: "sha256";
  canonicalization: "augnes-json-c14n-v0_1";
  fingerprint_scope: string;
  fingerprint: string;
}

export interface OperationalReentryStaleResetCrossCaseCommonEvidenceV01 {
  evidence_version: "operational_reentry_stale_reset_cross_case_common_evidence.v0.1";
  observed_result_status: "review_ready";
  observed_required_check: {
    check_token: string;
    disposition: "passed";
    observation_basis: "completed_check_observation";
  };
  forbidden_external_action: { action_token: string; permitted: false };
  source_support: {
    evidence_class: "synthetic_public_safe_observation";
    result_observation_present: true;
    required_check_observation_present: true;
    authority_boundary_observation_present: true;
  };
  observation_cutoff: string;
  target_independent_statements: readonly string[];
}

export interface OperationalReentryStaleResetCrossCaseProviderMaterialV01 {
  task: {
    goal: string;
    success_criteria: readonly string[];
    non_goals: readonly string[];
    required_check: string;
    forbidden_external_action: string;
  };
  common_task_evidence: OperationalReentryStaleResetCrossCaseCommonEvidenceV01;
  continuation_context: readonly {
    context_token: string;
    material_token: string;
    role: "target" | "non_target";
  }[];
  stale_relation: null | {
    relation_token: string;
    target_context_token: string;
    current_source_or_capability: string;
    current_superseding_relation: string;
    reason_observed_at: string;
    regime_key: string;
    applies_before_outcome: true;
  };
  allowed_output: {
    result_statuses: readonly ["review_ready", "review_blocked"];
    required_check_dispositions: readonly ["passed", "failed", "blocked", "unknown"];
    referenced_continuation_tokens: readonly string[];
    operation_action_class_tokens: readonly string[];
    result_limitation_tokens: readonly string[];
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

export interface OperationalReentryStaleResetCrossCaseInvocationV01 {
  input_kind: typeof OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_PURPOSE_V01;
  codec_version: typeof OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_CODEC_VERSION_V02;
  local_invocation_context: {
    case_id: OperationalReentryStaleResetCrossCaseIdV01;
    cohort_ref: string;
    call_slot_id: string;
    repeat_block: OperationalReentryStaleResetCrossCaseBlockV01;
  };
  provider_material: OperationalReentryStaleResetCrossCaseProviderMaterialV01;
}

export interface OperationalReentryStaleResetCrossCaseWireOutputV01 {
  result_status: "review_ready" | "review_blocked";
  required_check_disposition: "passed" | "failed" | "blocked" | "unknown";
  referenced_continuation_selections: Record<string, boolean>;
  operation_action_class_selections: Record<string, boolean>;
  result_limitation_selections: Record<string, boolean>;
  abstention: boolean;
}

export interface OperationalReentryStaleResetCrossCaseModelOutputV01 {
  result_status: "review_ready" | "review_blocked";
  common_task_evidence_fingerprint: string;
  required_check: {
    check_token: string;
    disposition: "passed" | "failed" | "blocked" | "unknown";
  };
  referenced_continuation_tokens: string[];
  operation_action_class_tokens: string[];
  result_limitation_tokens: string[];
  target_disposition:
    | "not_available"
    | "not_referenced"
    | "reference_only"
    | "applied_to_structure"
    | "withheld_stale"
    | "stale_persisted";
  abstention: boolean;
}

export interface OperationalReentryStaleResetCrossCaseSpecV01 {
  case_version: typeof OPERATIONAL_REENTRY_V04_STALE_RESET_REPLICATION_CASE_VERSION_V01;
  case_id: OperationalReentryStaleResetCrossCaseIdV01;
  case_label: "R1 reference supersession case" | "R2 action/regime supersession case";
  source_material: "synthetic_public_safe";
  real_user_or_project_data_included: false;
  construction_cutoff: string;
  observation_cutoff: string;
  source_statements: readonly string[];
  task: OperationalReentryStaleResetCrossCaseProviderMaterialV01["task"];
  common_task_evidence: OperationalReentryStaleResetCrossCaseCommonEvidenceV01;
  target: { context_token: string; material_token: string; role: "reference" | "action_preparation" };
  stale_relation: NonNullable<OperationalReentryStaleResetCrossCaseProviderMaterialV01["stale_relation"]>;
  non_target_continuation: OperationalReentryStaleResetCrossCaseProviderMaterialV01["continuation_context"];
  allowed_output: OperationalReentryStaleResetCrossCaseProviderMaterialV01["allowed_output"];
  authority_notice: OperationalReentryStaleResetCrossCaseProviderMaterialV01["authority_notice"];
  evaluator_binding: {
    target_reference_token: string;
    target_action_token: string | null;
    target_specific_limitations: Readonly<Record<string, "stale_persisted" | "stale_withheld" | "target_not_available">>;
    target_neutral_limitation: string;
    runtime_token_name_inference: false;
  };
  common_compliance_rubric: readonly string[];
  bounded_outcome_rubric: readonly string[];
  material_independence: {
    task_structure: string;
    target_role: string;
    target_token_family: string;
    non_target_evidence: readonly string[];
    stale_relation: string;
    primary_output_lane: "selected_or_referenced_target_identity" | "target_action_or_decision_preparation";
    supporting_output_lane: "target_specific_result_limitation";
  };
  request_bounds: { dynamic_material_bytes: 10240; final_request_bytes: 24576; response_bytes: 1168; max_output_tokens: 1168 };
  common_evidence_fingerprint: string;
  evaluator_binding_fingerprint: string;
  integrity: OperationalReentryStaleResetCrossCaseIntegrityV01;
}

export interface OperationalReentryStaleResetCrossCaseRouteV01 {
  gateway_version: "model_gateway.v0.1";
  purpose: typeof OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_PURPOSE_V01;
  provider_ref: ExternalRefV01;
  model_ref: ExternalRefV01;
  adapter_implementation_id: "openai_responses.operational_reentry_stale_reset_cross_case_replication";
  adapter_implementation_version: typeof OPENAI_RESPONSES_OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_ADAPTER_VERSION_V02;
  provider_contract_version: typeof OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_PROVIDER_CONTRACT_VERSION_V02;
  provider_contract_fingerprint: string;
  maximum_canonical_wire_response_bytes: number;
  response_bytes: 1168;
  max_output_tokens: 1168;
  prepared_without_provider_egress: true;
  integrity_fingerprint: string;
}

export interface OperationalReentryStaleResetCrossCaseProviderContractV01 {
  provider_contract_version: typeof OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_PROVIDER_CONTRACT_VERSION_V02;
  input_contract_version: typeof OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_VERSION_V02;
  input_codec_version: typeof OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_CODEC_VERSION_V02;
  response_schema_version: typeof OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_RESPONSE_SCHEMA_VERSION_V02;
  parser_version: typeof OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_PARSER_VERSION_V02;
  openai_adapter_implementation_version: typeof OPENAI_RESPONSES_OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_ADAPTER_VERSION_V02;
  route_purpose: typeof OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_PURPOSE_V01;
  strict_structured_output_supported_subset_required: true;
  parser_closed_wire_contract: true;
  per_shape_parser_closure: Readonly<Record<string, number>>;
  aggregate_parser_closure_cardinality: number;
  selection_representation: "exact_required_boolean_objects";
  common_task_evidence_fingerprint_locally_derived: true;
  required_check_token_locally_derived: true;
  target_disposition_locally_derived: true;
  local_invocation_identity_provider_visible: false;
  transport_correlation_experimental_material: false;
  dynamic_material_bytes: 10240;
  final_request_bytes: 24576;
  maximum_canonical_wire_response_bytes: number;
  response_bytes: 1168;
  max_output_tokens: 1168;
  timeout_ms: 30000;
  store: false;
  raw_prompt_persisted: false;
  raw_request_body_persisted: false;
  raw_provider_response_persisted: false;
  raw_provider_error_persisted: false;
  hidden_reasoning_persisted: false;
  prepared_without_provider_egress: true;
  new_provider_contract_implemented: true;
  zero_egress_shape_conformance: true;
  compatibility_result: "none";
  live_compatibility_authorizations_created: 0;
  live_compatibility_authorizations_consumed: 0;
  replication_live_authorizations_created: 0;
  replication_live_authorizations_consumed: 0;
  real_provider_calls: 0;
  replication_live_authorized: false;
  product_transfer_authorized: false;
  policy_authorized: false;
  stage_7_authorized: false;
  integrity: OperationalReentryStaleResetCrossCaseIntegrityV01;
}

export type OperationalReentryStaleResetCrossCasePresenceV01 = "present" | "absent" | "unknown" | "protocol_invalid";
export type OperationalReentryStaleResetCrossCaseLimitationV01 = "absent" | "target_not_available" | "stale_withheld" | "stale_persisted" | "mixed" | "unknown" | "protocol_invalid";
export type OperationalReentryStaleResetCrossCaseDimensionRelationV01 = "equal" | "left_more_persistent" | "right_more_persistent" | "unknown" | "not_comparable";
export type OperationalReentryStaleResetCrossCaseTargetRelationV01 = "equal" | "left_persists_more" | "right_persists_more" | "mixed" | "unknown" | "not_comparable" | "protocol_invalid" | "compliance_asymmetry";
export type OperationalReentryStaleResetCrossCasePatternStatusV01 = "supported_consistent" | "consistent_non_support" | "within_case_heterogeneous" | "not_comparable" | "incomplete" | "protocol_invalid";
export type OperationalReentryStaleResetCrossCaseDispositionV01 = "cross_case_pattern_replicated" | "case_heterogeneous" | "null_or_no_pattern" | "incomplete" | "protocol_invalid";

export interface OperationalReentryStaleResetCrossCaseLayerBV01 {
  case_id: OperationalReentryStaleResetCrossCaseIdV01;
  selected_or_referenced_target_identity: OperationalReentryStaleResetCrossCasePresenceV01;
  target_action_or_decision_preparation: OperationalReentryStaleResetCrossCasePresenceV01;
  target_specific_result_limitation: OperationalReentryStaleResetCrossCaseLimitationV01;
  target_disposition: OperationalReentryStaleResetCrossCaseModelOutputV01["target_disposition"] | "unknown" | "protocol_invalid";
  target_specific_required_check_relation: "not_available_under_v04";
  target_abstention_relation: "consistent" | "inconsistent" | "unknown";
  independent_directional_observation_count: 3;
  runtime_token_name_inference: false;
  target_neutral_tokens_add_directional_weight: false;
  state: "bounded_target_persistence_observed" | "no_target_persistence_observed" | "not_comparable" | "protocol_invalid" | "unknown";
  integrity: OperationalReentryStaleResetCrossCaseIntegrityV01;
}

export interface OperationalReentryStaleResetCrossCasePairV01 {
  pair_id: "A-B" | "A-C" | "A-G" | "B-C" | "B-G" | "C-G";
  direct_evaluation: true;
  inferred_transitively: false;
  comparison_status: "comparable" | "protocol_invalid" | "not_comparable" | "compliance_asymmetry" | "unknown";
  target_persistence_relation: OperationalReentryStaleResetCrossCaseTargetRelationV01;
  common_compliance_relation: "both_valid" | "both_invalid" | "compliance_asymmetry" | "unknown";
  bounded_outcome_relation: "equal" | "left_only_passes_declared_dimensions" | "right_only_passes_declared_dimensions" | "unknown" | "not_comparable";
  dimension_relations: {
    selected_or_referenced_target_identity: OperationalReentryStaleResetCrossCaseDimensionRelationV01;
    target_action_or_decision_preparation: OperationalReentryStaleResetCrossCaseDimensionRelationV01;
    target_specific_result_limitation: OperationalReentryStaleResetCrossCaseDimensionRelationV01;
  };
  scalar_score_created: false;
  rank_or_winner_created: false;
  integrity: OperationalReentryStaleResetCrossCaseIntegrityV01;
}

export interface OperationalReentryStaleResetCrossCaseBlockEvaluationV01 {
  repeat_block: OperationalReentryStaleResetCrossCaseBlockV01;
  status: "complete" | "incomplete";
  pair_evaluations: OperationalReentryStaleResetCrossCasePairV01[];
  all_six_pairs_evaluated_directly: boolean;
  pair_results_inferred_transitively: false;
  protocol_invalid: boolean;
  integrity: OperationalReentryStaleResetCrossCaseIntegrityV01;
}

export interface OperationalReentryStaleResetCrossCaseAuthorizationV01 {
  authorization_version: typeof OPERATIONAL_REENTRY_V04_STALE_RESET_REPLICATION_AUTHORIZATION_VERSION_V02;
  authorization_kind: "one_bounded_operational_reentry_v04_stale_reset_cross_case_replication";
  authorization_id: string;
  future_live_issue_number: number;
  exact_merged_source_head: string;
  repository_slug: "hynk-studio/augnes";
  authorized_origin: "https://github.com/hynk-studio/augnes.git";
  workspace_id: string;
  project_id: string;
  expected_active_selection_revision: number;
  project_root_fingerprint: string;
  gateway_authorization_project_is_lab_experiment_meaning: false;
  case_id: OperationalReentryStaleResetCrossCaseIdV01;
  case_version: typeof OPERATIONAL_REENTRY_V04_STALE_RESET_REPLICATION_CASE_VERSION_V01;
  case_fingerprint: string;
  common_evidence_fingerprint: string;
  construction_cutoff: string;
  observation_cutoff: string;
  gate_contract_fingerprint: string;
  evaluator_binding_fingerprint: string;
  sealed_plan_fingerprint: string;
  bg_witness_fingerprint: string;
  route_fingerprint: string;
  provider_contract_fingerprint: string;
  adapter_request_route_fingerprint: string;
  codec_version: typeof OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_CODEC_VERSION_V02;
  response_schema_version: typeof OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_RESPONSE_SCHEMA_VERSION_V02;
  parser_version: typeof OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_PARSER_VERSION_V02;
  adapter_version: typeof OPENAI_RESPONSES_OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_ADAPTER_VERSION_V02;
  request_family: typeof OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_REQUEST_FAMILY_V01;
  provider: "openai";
  model: "gpt-4.1-mini-2025-04-14";
  response_bytes: 1168;
  max_output_tokens: 1168;
  final_request_bytes: 24576;
  planned_calls: 16;
  repeat_blocks: 4;
  calls_per_arm: 4;
  parallel: 1;
  retries: 0;
  replacements: 0;
  adaptive_changes: 0;
  fresh_stateless: true;
  conversation_reuse: false;
  thread_reuse: false;
  previous_response_reuse: false;
  pricing_snapshot_fingerprint: string;
  pricing_authority_fingerprint: string;
  pricing_authority_expires_at: string;
  aggregate_worst_case_cost_nano_usd: number;
  maximum_total_ceiling_nano_usd: number;
  gateway_cost_budget: ModelGatewayCostBudgetV01;
  historical_authorization_reuse: false;
  second_cohort_under_same_authorization: false;
  other_case_under_same_authorization: false;
  replication_of_historical_calls: false;
  policy: false;
  stage_7: false;
  integrity: OperationalReentryStaleResetCrossCaseIntegrityV01;
}

export interface OperationalReentryStaleResetCrossCasePreparedInvocationV01 {
  invocation: OperationalReentryStaleResetCrossCaseInvocationV01;
  route: OperationalReentryStaleResetCrossCaseRouteV01;
  provider_request_trace_id: string;
  client_request_id: string;
  receipt?: ModelInvocationReceiptV02;
}
