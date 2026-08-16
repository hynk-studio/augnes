import type { ExternalRefV01 } from "./external-ref";
import type { OperationalContinuationAdmissionV01 } from "./operational-continuation-admission";
import type {
  OperationalContextSelectionRowV01,
  OperationalContextSelectionV01,
  OperationalContinuationAdmissionIdentityV01,
} from "./operational-context-selection";
import type {
  RunReceiptExecutionStatusV01,
  RunReceiptVerificationStatusV01,
} from "./run-receipt";
import type { TaskContextPacketV01 } from "./task-context-packet";

export const MODEL_HOST_SUCCESSION_ROUTE_PROFILE_VERSION_V01 =
  "model_host_succession_route_profile.v0.1" as const;
export const MODEL_HOST_SUCCESSION_FROZEN_CASE_VERSION_V01 =
  "model_host_succession_frozen_case.v0.1" as const;
export const MODEL_HOST_SUCCESSION_FALLBACK_PLAN_VERSION_V01 =
  "model_host_succession_fallback_plan.v0.1" as const;
export const MODEL_HOST_SUCCESSION_BENCHMARK_VERSION_V01 =
  "model_host_succession_benchmark.v0.1" as const;

export type ModelHostSuccessionEvidenceClassV01 =
  | "observed_deterministic_execution"
  | "simulated_route_contract"
  | "observed_live_provider"
  | "unobserved";

export type ModelHostSuccessionRouteRoleV01 =
  | "same_model_cold_session_simulation"
  | "capability_constrained_simulation"
  | "alternate_provider_host_contract_simulation"
  | "zero_model_fallback"
  | "predecessor_route_replay";

export const MODEL_HOST_SUCCESSION_ROUTE_ROLE_ORDER_V01 = Object.freeze([
  "same_model_cold_session_simulation",
  "capability_constrained_simulation",
  "alternate_provider_host_contract_simulation",
  "zero_model_fallback",
  "predecessor_route_replay",
] as const satisfies readonly ModelHostSuccessionRouteRoleV01[]);

export interface ModelHostSuccessionIntegrityV01 {
  algorithm: "sha256";
  canonicalization: "augnes-json-c14n-v0_1";
  fingerprint_scope: string;
  fingerprint: string;
}

export interface ModelHostSuccessionRecordRefV01 {
  record_version: string;
  record_id: string;
  record_fingerprint: string;
}

export interface ModelHostSuccessionRouteProfileRefV01 {
  route_profile_version: typeof MODEL_HOST_SUCCESSION_ROUTE_PROFILE_VERSION_V01;
  route_profile_id: string;
  route_profile_fingerprint: string;
  route_role: ModelHostSuccessionRouteRoleV01;
}

export interface ModelHostSuccessionCapabilityCoverageRowV01 {
  operation_class: string;
  coverage: "supported" | "unsupported";
  basis: string;
}

export interface ModelHostSuccessionRouteProfileAuthorityV01 {
  automatic_selection_authorized: false;
  activation_authorized: false;
  policy_authorized: false;
  automatic_start_authorized: false;
  automatic_resume_authorized: false;
  automatic_fallback_authorized: false;
  automatic_rollback_authorized: false;
  provider_egress_authorized: false;
  external_effect_authority_granted: false;
}

export interface ModelHostSuccessionRouteProfileV01 {
  route_profile_version: typeof MODEL_HOST_SUCCESSION_ROUTE_PROFILE_VERSION_V01;
  route_profile_id: string;
  route_role: ModelHostSuccessionRouteRoleV01;
  provider_ref: ExternalRefV01 | null;
  model_ref: ExternalRefV01 | null;
  host_ref: ExternalRefV01;
  adapter_implementation_id: string;
  adapter_implementation_version: string;
  native_host_adapter_version: string;
  capability_version: string;
  execution_profile: "deterministic_zero_model" | "native_host_managed_model";
  provider_egress_policy: "forbidden";
  session_continuity_mode: "fresh_session_no_reuse";
  evidence_class: ModelHostSuccessionEvidenceClassV01;
  supported_operation_classes: string[];
  unsupported_operation_classes: string[];
  capability_coverage: ModelHostSuccessionCapabilityCoverageRowV01[];
  predecessor_route_ref: ModelHostSuccessionRouteProfileRefV01 | null;
  fallback_target_ref: ModelHostSuccessionRouteProfileRefV01 | null;
  authority: ModelHostSuccessionRouteProfileAuthorityV01;
  integrity: ModelHostSuccessionIntegrityV01;
}

export interface ModelHostSuccessionStage5TruthV01 {
  continuation_mechanism_worked_end_to_end: true;
  exact_selected_entry_delivered_and_referenced: true;
  item_actual_use: "unknown";
  support_validation: "unknown";
  outcome_association: "unknown";
  causal_contribution: "unknown";
  task_outcomes_equal_in_deciding_case: true;
  verification_outcomes_equal_in_deciding_case: true;
  structural_coordination_favored: "one_run_baseline";
  complete_path_review_burden_favored: "one_run_baseline";
  usage: "unobserved";
  monetary_cost: "unobserved";
  required_human_intervention: "unobserved";
  genuine_performance_latency: "unobserved";
  exact_case_result: "inconclusive";
  general_benefit_established: false;
  general_failure_established: false;
  packet_b_harmful_transfer_established: false;
  policy_fitness_established: false;
}

export interface ModelHostSuccessionFrozenRepositoryStateV01 {
  frozen_head_commit: string;
  frozen_worktree_content_fingerprint: string;
  worktree_status: "clean";
  construction_cutoff: string;
  observation_cutoff: string;
  platform: string;
}

export interface ModelHostSuccessionFrozenCaseV01 {
  frozen_case_version: typeof MODEL_HOST_SUCCESSION_FROZEN_CASE_VERSION_V01;
  frozen_case_id: string;
  source_case_kind: "exact_rebuilt_merged_stage5_public_safe_case";
  merged_stage5_baseline_commit: string;
  merged_stage5_comparison_binding: {
    comparison_version: "operational_continuation_comparison.v0.1";
    source_case_id: string;
    source_case_fingerprint: string;
  };
  stage5_truth: ModelHostSuccessionStage5TruthV01;
  workspace_id: string;
  project_id: string;
  task: TaskContextPacketV01["task"];
  constraints: TaskContextPacketV01["constraints"];
  packet_a: TaskContextPacketV01;
  operational_context_selection: OperationalContextSelectionV01;
  acgc5a_materialization_identity: OperationalContinuationAdmissionIdentityV01;
  packet_b: TaskContextPacketV01;
  packet_b_canonical_bytes_fingerprint: string;
  continuation_admission: OperationalContinuationAdmissionV01;
  selected_operational_entry: OperationalContextSelectionRowV01;
  repository_state: ModelHostSuccessionFrozenRepositoryStateV01;
  continuation_hop: 1;
  second_continuation_hop_present: false;
  data_is_synthetic_public_safe: true;
  material_boundary: {
    bounded: true;
    raw_prompt_included: false;
    raw_transcript_included: false;
    raw_provider_output_included: false;
    hidden_reasoning_included: false;
    secret_or_credential_included: false;
    private_path_included: false;
    post_cutoff_material_included: false;
  };
  integrity: ModelHostSuccessionIntegrityV01;
}

export type ModelHostSuccessionArmContractStatusV01 =
  | "contract_compatible"
  | "contract_incompatible"
  | "fallback_required"
  | "unobserved";

export interface ModelHostSuccessionFreshIdentityProofV01 {
  project_scope_fingerprint: string;
  database_scope_fingerprint: string;
  repository_root_fingerprint: string;
  attachment_id: string | null;
  attachment_binding_fingerprint: string | null;
  start_request_fingerprint: string | null;
  start_grant_fingerprint: string | null;
  managed_run_id: string | null;
  controller_identity_fingerprint: string | null;
  browser_decision_session_identity_fingerprint: string | null;
  host_session_identity_fingerprint: string | null;
  host_thread_identity_fingerprint: string | null;
  host_turn_identity_fingerprint: string | null;
  provider_thread_identity_fingerprint: string | null;
  prior_identity_reuse_count: 0;
  no_reuse_proven: true;
  resume_used: false;
  retry_used: false;
}

export interface ModelHostSuccessionRequiredCheckSummaryV01 {
  passed: string[];
  failed: string[];
  blocked: string[];
  skipped: string[];
  unknown: string[];
}

export interface ModelHostSuccessionContinuationTraceV01 {
  packet_b_exact_bytes_delivered: boolean;
  selected_entry_count: number;
  selected_entry_delivered_count: number;
  selected_entry_exact_receipt_referenced_count: number;
  excluded_candidate_credit_count: 0;
  bundle_credit_assigned: false;
  packet_level_actual_use_claim: "unknown";
  item_actual_use: "unknown";
  support_validation: "unknown";
  outcome_association: "unknown";
  causal_contribution: "unknown";
}

export interface ModelHostSuccessionArmRecordRefsV01 {
  run: ModelHostSuccessionRecordRefV01 | null;
  run_receipt: ModelHostSuccessionRecordRefV01 | null;
  context_use_review: ModelHostSuccessionRecordRefV01 | null;
  context_use_attribution: ModelHostSuccessionRecordRefV01 | null;
}

export interface ModelHostSuccessionResourceObservationsV01 {
  provider_calls: number;
  model_calls: number;
  network_calls: number;
  github_calls: number;
  external_calls: number;
  usage_units: number | null;
  monetary_cost_microunits: number | null;
  genuine_latency_ms: number | null;
  observation_provenance:
    | "exact_deterministic_fixture_ledger"
    | "simulated_contract_only"
    | "unobserved";
}

export interface ModelHostSuccessionArmResultV01 {
  arm_version: "model_host_succession_arm_result.v0.1";
  arm_id: string;
  route_profile_ref: ModelHostSuccessionRouteProfileRefV01;
  evidence_class: ModelHostSuccessionEvidenceClassV01;
  fresh_identity_proof: ModelHostSuccessionFreshIdentityProofV01;
  contract_status: ModelHostSuccessionArmContractStatusV01;
  execution_status: RunReceiptExecutionStatusV01 | "unavailable" | "not_executed";
  verification_status: RunReceiptVerificationStatusV01 | "not_run";
  required_checks: ModelHostSuccessionRequiredCheckSummaryV01;
  supported_capability: string[];
  unsupported_capability: string[];
  unsupported_operation_executed_count: 0;
  stronger_result_inherited: false;
  silent_fallback_used: false;
  continuation_trace: ModelHostSuccessionContinuationTraceV01;
  record_refs: ModelHostSuccessionArmRecordRefsV01;
  resource_observations: ModelHostSuccessionResourceObservationsV01;
  privacy_egress: "none_observed" | "unobserved";
  review_burden: {
    review_action_count: number;
    correction_count: number | null;
    required_human_intervention_count: number | null;
  };
  fallback_required: boolean;
  fallback_used: boolean;
  direct_success_claimed: false;
  predecessor_replay_status: "not_applicable" | "explicit_fresh_replay_completed";
  cleanup_recovery_burden: number | null;
  cleanup_status: "complete" | "pending" | "unobserved";
  platform_boundary: string;
  limitations: string[];
  integrity: ModelHostSuccessionIntegrityV01;
}

export interface ModelHostSuccessionFallbackPlanV01 {
  fallback_plan_version: typeof MODEL_HOST_SUCCESSION_FALLBACK_PLAN_VERSION_V01;
  fallback_plan_id: string;
  failed_arm_ref: {
    arm_id: string;
    arm_fingerprint: string;
    settled_status:
      | "failed"
      | "unavailable"
      | "not_executed"
      | "contract_incompatible"
      | "fallback_required";
  };
  predecessor_route_ref: ModelHostSuccessionRouteProfileRefV01;
  frozen_case_ref: {
    frozen_case_id: string;
    frozen_case_fingerprint: string;
  };
  fallback_reason: string;
  fallback_trigger: string;
  benchmark_harness_authorization: "explicit_harness_sequence_only";
  required_fresh_execution_identities: string[];
  candidate_history_immutable: true;
  automatic_execution_authorized: false;
  product_route_mutation_authorized: false;
  policy_activation_authorized: false;
  rollback_activation_authorized: false;
  integrity: ModelHostSuccessionIntegrityV01;
}

export interface ModelHostSuccessionCapabilityDeltaValueV01 {
  explicit_operation_class_count: number;
  supported_operation_class_count: number;
  unsupported_operation_class_count: number;
  supported_operation_classes_fingerprint: string;
  unsupported_operation_classes_fingerprint: string;
}

export interface ModelHostSuccessionPairwiseDeltaV01 {
  left_route_role: ModelHostSuccessionRouteRoleV01;
  right_route_role: ModelHostSuccessionRouteRoleV01;
  dimension: string;
  relation:
    | "equal"
    | "tradeoff"
    | "unknown"
    | "not_comparable"
    | "left_narrow_coverage"
    | "right_narrow_coverage";
  left_value:
    | string
    | number
    | boolean
    | ModelHostSuccessionCapabilityDeltaValueV01
    | null;
  right_value:
    | string
    | number
    | boolean
    | ModelHostSuccessionCapabilityDeltaValueV01
    | null;
  basis: string;
}

export interface ModelHostSuccessionAdrOwnerGapObservationV01 {
  question: string;
  observation: string;
  evidence_owner_refs: string[];
  decision_deferred_to_acgc6b: true;
}

export interface ModelHostSuccessionBenchmarkAuthorityV01 {
  quality_score_created: false;
  scalar_score_created: false;
  provider_or_model_rank_created: false;
  route_winner_created: false;
  route_selected: false;
  route_promoted_or_demoted: false;
  blacklist_created: false;
  policy_fitness_claimed: false;
  operational_policy_activated: false;
  active_route_pointer_created: false;
  activation_receipt_created: false;
  rollback_receipt_created: false;
  automatic_fallback_authorized: false;
  automatic_rollback_authorized: false;
  automatic_start_authorized: false;
  automatic_resume_authorized: false;
  packet_c_created: false;
  second_continuation_hop_created: false;
  semantic_state_changed: false;
  transition_created: false;
  benchmark_persisted: false;
  benchmark_builder_database_writes: 0;
  benchmark_builder_session_writes: 0;
  benchmark_builder_project_file_writes: 0;
  benchmark_builder_project_commands: 0;
  real_provider_calls: 0;
  network_calls: 0;
  github_calls: 0;
  external_calls: 0;
}

export type ModelHostSuccessionBenchmarkSummaryV01 =
  | "portable_within_tested_contracts"
  | "conditionally_portable"
  | "not_portable_in_exact_case"
  | "inconclusive";

export interface ModelHostSuccessionBenchmarkV01 {
  benchmark_version: typeof MODEL_HOST_SUCCESSION_BENCHMARK_VERSION_V01;
  benchmark_id: string;
  benchmark_kind: "pure_rebuildable_exact_case_non_authoritative";
  frozen_case: ModelHostSuccessionFrozenCaseV01;
  route_profiles: ModelHostSuccessionRouteProfileV01[];
  arm_results: ModelHostSuccessionArmResultV01[];
  fallback_plan: ModelHostSuccessionFallbackPlanV01;
  fallback_relation: {
    candidate_arm_id: string;
    predecessor_replay_arm_id: string;
    candidate_history_unchanged: true;
    cross_arm_contamination_detected: false;
    automatic_execution_used: false;
  };
  pairwise_route_deltas: ModelHostSuccessionPairwiseDeltaV01[];
  summary: ModelHostSuccessionBenchmarkSummaryV01;
  trade_offs: string[];
  resource_observation_provenance: string[];
  missing_evidence: string[];
  limitations: string[];
  adr_owner_gap_observations: ModelHostSuccessionAdrOwnerGapObservationV01[];
  material_boundary: ModelHostSuccessionFrozenCaseV01["material_boundary"];
  authority_summary: ModelHostSuccessionBenchmarkAuthorityV01;
  integrity: ModelHostSuccessionIntegrityV01;
}

export interface ModelHostSuccessionValidationIssueV01 {
  code: string;
  path: string;
}

export type ModelHostSuccessionValidationResultV01 =
  | { status: "valid"; errors: [] }
  | { status: "blocked"; errors: ModelHostSuccessionValidationIssueV01[] };
