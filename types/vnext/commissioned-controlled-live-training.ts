import type {
  CommissionedWorkConditionV01,
  CommissionedWorkEpisodeArtifactV01,
  CommissionedWorkEpisodeCheckpointV01,
  CommissionedWorkEvidenceStatusV01,
  CommissionedWorkIntegrityV01,
  CommissionedWorkNativeHostRefBindingV01,
  CommissionedWorkObjectiveObservationV01,
  CommissionedWorkRecordRefV01,
  CommissionedWorkResourceLaneV01,
  CommissionedWorkRoleRefV01,
  CommissionedWorkTrainingResultV01,
} from "./commissioned-controlled-workbench";
import type { OperationalReentryArmRoleV01 } from "./operational-reentry-perturbation";

export const COMMISSIONED_LIVE_TRAINING_PLAN_VERSION_V01 =
  "commissioned_controlled_live_training_plan.v0.1" as const;
export const COMMISSIONED_LIVE_TRAINING_AUTHORIZATION_VERSION_V01 =
  "commissioned_controlled_live_training_authorization.v0.1" as const;
export const COMMISSIONED_LIVE_TRAINING_CONSUMPTION_VERSION_V01 =
  "commissioned_controlled_live_training_authorization_consumption.v0.1" as const;
export const COMMISSIONED_LIVE_TRAINING_ATTEMPT_ADMISSION_VERSION_V01 =
  "commissioned_controlled_live_training_attempt_admission.v0.1" as const;
export const COMMISSIONED_LIVE_TRAINING_ATTEMPT_START_VERSION_V01 =
  "commissioned_controlled_live_training_attempt_start.v0.1" as const;
export const COMMISSIONED_LIVE_TRAINING_ATTEMPT_TERMINAL_VERSION_V01 =
  "commissioned_controlled_live_training_attempt_terminal.v0.1" as const;
export const COMMISSIONED_LIVE_TRAINING_ATTEMPT_REGISTRY_VERSION_V01 =
  "commissioned_controlled_live_training_attempt_registry.v0.1" as const;
export const COMMISSIONED_LIVE_TRAINING_CLONE_SEAL_VERSION_V01 =
  "commissioned_controlled_live_training_clone_seal.v0.1" as const;
export const COMMISSIONED_LIVE_TRAINING_BLIND_OBSERVATION_VERSION_V01 =
  "commissioned_controlled_live_training_blind_objective_observation.v0.1" as const;
export const COMMISSIONED_LIVE_TRAINING_ANALYSIS_JOIN_VERSION_V01 =
  "commissioned_controlled_live_training_analysis_join.v0.1" as const;
export const COMMISSIONED_LIVE_TRAINING_RESULT_VERSION_V01 =
  "commissioned_controlled_live_training_result.v0.1" as const;
export const COMMISSIONED_LIVE_TRAINING_CANDIDATE_ASSESSMENT_VERSION_V01 =
  "commissioned_controlled_live_training_candidate_assessment.v0.1" as const;
export const COMMISSIONED_LIVE_TRAINING_CLEANUP_VERSION_V01 =
  "commissioned_controlled_live_training_cleanup.v0.1" as const;
export const COMMISSIONED_LIVE_TRAINING_CLEANUP_OBSERVATION_VERSION_V01 =
  "commissioned_controlled_live_training_cleanup_observation.v0.1" as const;
export const COMMISSIONED_LIVE_TRAINING_INCOMPLETE_CLOSEOUT_VERSION_V01 =
  "commissioned_controlled_live_training_incomplete_closeout.v0.1" as const;
export const COMMISSIONED_LIVE_TRAINING_ARTIFACT_INDEX_VERSION_V01 =
  "commissioned_controlled_live_training_artifact_index.v0.1" as const;
export const COMMISSIONED_LIVE_TRAINING_COMPLETION_WITNESS_VERSION_V01 =
  "commissioned_controlled_live_training_completion_witness.v0.1" as const;

export const COMMISSIONED_LIVE_TRAINING_FOUNDATION_MAIN_SHA_V01 =
  "53381b1aead57554e1c5b7978050b6a3a550f78c" as const;
export const COMMISSIONED_LIVE_TRAINING_FOUNDATION_MAIN_TREE_V01 =
  "a19354842a6eea028a5e8a669c8f4ec98e3da498" as const;
export const COMMISSIONED_LIVE_TRAINING_ISSUE_REF_V01 =
  "github:hynk-studio/augnes#1142" as const;
export const COMMISSIONED_LIVE_TRAINING_FAMILY_ID_V01 =
  "cw1-family-fourfold-01" as const;
export const COMMISSIONED_LIVE_TRAINING_PRIMARY_EPISODE_LIMIT_V01 = 15 as const;
export const COMMISSIONED_LIVE_TRAINING_REPLACEMENT_LIMIT_V01 = 3 as const;

export const COMMISSIONED_LIVE_TRAINING_CASE_IDS_V01 = [
  "case-amber-17",
  "case-cobalt-29",
  "case-cedar-41",
] as const;

export type CommissionedLiveTrainingCaseIdV01 =
  (typeof COMMISSIONED_LIVE_TRAINING_CASE_IDS_V01)[number];

export type CommissionedLiveTrainingSlotRoleV01 =
  | "predecessor"
  | "cold_successor";

export interface CommissionedLiveTrainingScheduleSlotV01 {
  slot_id: string;
  ordinal: number;
  round: 0 | 1 | 2 | 3 | 4;
  slot_role: CommissionedLiveTrainingSlotRoleV01;
  case_id: CommissionedLiveTrainingCaseIdV01;
  condition: CommissionedWorkConditionV01 | null;
  existing_reentry_role: OperationalReentryArmRoleV01 | null;
  executor_role_ref: CommissionedWorkRoleRefV01;
  primary_attempt_id: string;
  replacement_allowed: boolean;
  executor_visible_slot_identity: string;
  assignment_fingerprint: string;
}

export interface CommissionedLiveTrainingCohortPlanV01 {
  plan_version: typeof COMMISSIONED_LIVE_TRAINING_PLAN_VERSION_V01;
  cohort_id: string;
  issue_ref: typeof COMMISSIONED_LIVE_TRAINING_ISSUE_REF_V01;
  foundation_main_sha: typeof COMMISSIONED_LIVE_TRAINING_FOUNDATION_MAIN_SHA_V01;
  foundation_main_tree: typeof COMMISSIONED_LIVE_TRAINING_FOUNDATION_MAIN_TREE_V01;
  family_ref: CommissionedWorkRecordRefV01;
  training_case_refs: [
    CommissionedWorkRecordRefV01,
    CommissionedWorkRecordRefV01,
    CommissionedWorkRecordRefV01,
  ];
  sealed_at: string;
  primary_episode_limit: typeof COMMISSIONED_LIVE_TRAINING_PRIMARY_EPISODE_LIMIT_V01;
  replacement_invocation_limit: typeof COMMISSIONED_LIVE_TRAINING_REPLACEMENT_LIMIT_V01;
  slots: CommissionedLiveTrainingScheduleSlotV01[];
  schedule_fingerprint: string;
  replacement_policy_fingerprint: string;
  stop_condition_fingerprint: string;
  task_evidence_equal_within_case: true;
  condition_assignment_executor_visible: false;
  evaluator_condition_blind_until_observation_seal: true;
  holdout_case_commitment_only: true;
  holdout_source_materialized: false;
  holdout_execution_authorized: false;
  holdout_candidate_freeze_authorized: false;
  candidate_specific_transfer_claimed: false;
  integrity: CommissionedWorkIntegrityV01;
}

export type CommissionedLiveTrainingAuthorizationKindV01 =
  | "test_conformance"
  | "future_live_execution";

export type CommissionedLiveTrainingReasoningEffortV01 =
  | "low"
  | "medium"
  | "high"
  | "xhigh";

export interface CommissionedLiveTrainingExactNativeExecutionConfigurationV01 {
  configuration_version: "commissioned_live_training_native_execution_configuration.v0.1";
  provider_id: string;
  model_id: string;
  route_id: string;
  reasoning_effort: CommissionedLiveTrainingReasoningEffortV01;
  expected_cli_version: string;
  adapter_ref: CommissionedWorkRecordRefV01;
  capability_ref: CommissionedWorkRecordRefV01;
  host_ref: CommissionedWorkRecordRefV01;
  cli_ref: CommissionedWorkRecordRefV01;
  runtime_ref: CommissionedWorkRecordRefV01;
  provider_ref: CommissionedWorkRecordRefV01;
  model_ref: CommissionedWorkRecordRefV01;
  route_ref: CommissionedWorkRecordRefV01;
  cli_executable_identity: CommissionedLiveTrainingExecutableIdentityV01;
  runtime_executable_identity: CommissionedLiveTrainingExecutableIdentityV01;
  provider_bearing_native_host_invocation_limit_semantics: "max_provider_bearing_native_host_invocations";
  model_bearing_native_host_invocation_limit_semantics: "max_model_bearing_native_host_invocations";
  configuration_fingerprint: string;
}

export interface CommissionedLiveTrainingExecutableIdentityV01 {
  identity_version: "commissioned_live_training_executable_identity.v0.1";
  executable_kind: "codex_app_server_cli" | "node_runtime" | "test_fake_app_server";
  realpath_fingerprint: string;
  content_fingerprint: string;
  physical_identity_fingerprint: string;
  executable_ref: CommissionedWorkRecordRefV01;
}

export type CommissionedLiveTrainingOptionalCeilingV01 =
  | {
      observability: "observed";
      limit: number;
      source_ref: CommissionedWorkRecordRefV01;
    }
  | {
      observability: "unknown";
      limit: null;
      source_ref: null;
    };

export interface CommissionedLiveTrainingAuthoritySummaryV01 {
  authority_kind: "single_use_commissioned_training_only";
  authorizes_real_provider_calls: boolean;
  authorizes_only_exact_training_slots: true;
  authorizes_holdout: false;
  authorizes_fallback_or_substitution: false;
  authorizes_task_external_network: false;
  authorizes_outside_root_writes: false;
  authorizes_github_writes: false;
  authorizes_core_or_product_writes: false;
  authorizes_semantic_writes: false;
  authorizes_review_decision_or_transition: false;
  authorizes_policy_or_active_context: false;
  authorizes_publication: false;
  authorizes_merge: false;
  is_product_execution_grant: false;
  is_semantic_approval: false;
}

export interface CommissionedLiveTrainingAuthorizationV01 {
  authorization_version: typeof COMMISSIONED_LIVE_TRAINING_AUTHORIZATION_VERSION_V01;
  authorization_id: string;
  authorization_kind: CommissionedLiveTrainingAuthorizationKindV01;
  issue_ref: typeof COMMISSIONED_LIVE_TRAINING_ISSUE_REF_V01;
  issued_at: string;
  expires_at: string;
  source_binding: {
    repository_id: "hynk-studio/augnes";
    main_sha: string;
    main_tree: string;
    checkout_root_fingerprint: string;
    family_ref: CommissionedWorkRecordRefV01;
    training_case_refs: [
      CommissionedWorkRecordRefV01,
      CommissionedWorkRecordRefV01,
      CommissionedWorkRecordRefV01,
    ];
    cohort_plan_ref: CommissionedWorkRecordRefV01;
    schedule_fingerprint: string;
  };
  native_execution_configuration: CommissionedLiveTrainingExactNativeExecutionConfigurationV01;
  artifact_relative_root: string;
  primary_episode_limit: typeof COMMISSIONED_LIVE_TRAINING_PRIMARY_EPISODE_LIMIT_V01;
  replacement_invocation_limit: number;
  native_host_invocation_limit: number;
  provider_bearing_native_host_invocation_limit: number;
  model_bearing_native_host_invocation_limit: number;
  provider_call_limit: number;
  model_call_limit: number;
  task_external_network_limit: 0;
  usage_unit_ceiling: CommissionedLiveTrainingOptionalCeilingV01;
  cost_microunit_ceiling: CommissionedLiveTrainingOptionalCeilingV01;
  per_episode_timeout_ms: number;
  total_cohort_timeout_ms: number;
  replacement_policy_fingerprint: string;
  stop_condition_fingerprint: string;
  execution_evidence_class: "commissioned_agent_observation";
  authorization_nonce_fingerprint: string;
  single_use: true;
  consumed_state_in_record: "unconsumed";
  authority_summary: CommissionedLiveTrainingAuthoritySummaryV01;
  integrity: CommissionedWorkIntegrityV01;
}

export interface CommissionedLiveTrainingAuthorizationConsumptionV01 {
  consumption_version: typeof COMMISSIONED_LIVE_TRAINING_CONSUMPTION_VERSION_V01;
  consumption_id: string;
  authorization_ref: CommissionedWorkRecordRefV01;
  cohort_plan_ref: CommissionedWorkRecordRefV01;
  authorization_nonce_fingerprint: string;
  consumer_instance_ref: CommissionedWorkRecordRefV01;
  consumed_at: string;
  source_revalidation_fingerprint: string;
  native_execution_configuration_fingerprint: string;
  primary_marker_relative_path: string;
  witness_marker_relative_path: string;
  exclusive_before_first_native_host_invocation: true;
  marker_created_before_first_native_host_invocation: true;
  replay_allowed: false;
  integrity: CommissionedWorkIntegrityV01;
}

export interface CommissionedLiveTrainingCloneBaselineV01 {
  slot_id: string;
  clone_identity_fingerprint: string;
  root_scope_fingerprint: string;
  initial_head: string;
  initial_tree: string;
  clean_worktree_content_fingerprint: string;
  current_source_fingerprint: string;
  common_request_fingerprint: string;
}

export interface CommissionedLiveTrainingCloneSealV01 {
  seal_version: typeof COMMISSIONED_LIVE_TRAINING_CLONE_SEAL_VERSION_V01;
  seal_id: string;
  case_id: CommissionedLiveTrainingCaseIdV01;
  predecessor_checkpoint_ref: CommissionedWorkRecordRefV01;
  predecessor_head: string;
  predecessor_tree: string;
  predecessor_worktree_fingerprint: string;
  source_drift_fingerprint: string;
  post_drift_head: string;
  post_drift_tree: string;
  post_drift_parent_head: string;
  post_drift_current_source_fingerprint: string;
  post_drift_parent_is_predecessor_head: true;
  clone_baselines: [
    CommissionedLiveTrainingCloneBaselineV01,
    CommissionedLiveTrainingCloneBaselineV01,
    CommissionedLiveTrainingCloneBaselineV01,
    CommissionedLiveTrainingCloneBaselineV01,
  ];
  identical_initial_source_state: true;
  distinct_clone_identities: true;
  integrity: CommissionedWorkIntegrityV01;
}

export interface CommissionedLiveTrainingAttemptStartV01 {
  attempt_start_version: typeof COMMISSIONED_LIVE_TRAINING_ATTEMPT_START_VERSION_V01;
  attempt_start_id: string;
  attempt_id: string;
  slot_id: string;
  attempt_kind: "primary" | "replacement";
  authorization_consumption_ref: CommissionedWorkRecordRefV01;
  cohort_plan_ref: CommissionedWorkRecordRefV01;
  executor_role_ref: CommissionedWorkRoleRefV01;
  request_ref_fingerprint: string;
  run_ref_fingerprint: string;
  native_execution_configuration_fingerprint: string;
  adapter_execution_binding_fingerprint: string;
  clone_baseline: CommissionedLiveTrainingCloneBaselineV01;
  reserved_native_host_invocation_ordinal: number;
  provider_bearing_invocation_reserved: boolean;
  model_bearing_invocation_reserved: boolean;
  started_at: string;
  persisted_before_native_host_invocation: true;
  integrity: CommissionedWorkIntegrityV01;
}

export interface CommissionedLiveTrainingBlindObjectiveObservationV01 {
  blind_observation_version: typeof COMMISSIONED_LIVE_TRAINING_BLIND_OBSERVATION_VERSION_V01;
  blind_observation_id: string;
  slot_id: string;
  evaluator_role_ref: CommissionedWorkRoleRefV01;
  evaluator_view_fingerprint: string;
  case_commitment_ref: CommissionedWorkRecordRefV01;
  observation: CommissionedWorkObjectiveObservationV01;
  observation_ref: CommissionedWorkRecordRefV01;
  condition_assignment_visible: false;
  candidate_assignment_visible: false;
  executor_self_report_used_as_outcome_truth: false;
  sealed_at: string;
  mutable_after_seal: false;
  integrity: CommissionedWorkIntegrityV01;
}

export interface CommissionedLiveTrainingAnalysisJoinV01 {
  join_version: typeof COMMISSIONED_LIVE_TRAINING_ANALYSIS_JOIN_VERSION_V01;
  join_id: string;
  slot_id: string;
  blind_observation_ref: CommissionedWorkRecordRefV01;
  sealed_observation_fingerprint: string;
  condition: CommissionedWorkConditionV01;
  existing_reentry_role: OperationalReentryArmRoleV01;
  joined_at: string;
  joined_after_observation_seal: true;
  observation_mutated: false;
  integrity: CommissionedWorkIntegrityV01;
}

export interface CommissionedLiveTrainingAttemptAdmissionV01 {
  admission_version: typeof COMMISSIONED_LIVE_TRAINING_ATTEMPT_ADMISSION_VERSION_V01;
  attempt_id: string;
  slot_id: string;
  attempt_kind: "primary" | "replacement";
  replacement_of_attempt_ref: CommissionedWorkRecordRefV01 | null;
  attempt_start_ref: CommissionedWorkRecordRefV01;
  authorization_consumption_ref: CommissionedWorkRecordRefV01;
  cohort_plan_ref: CommissionedWorkRecordRefV01;
  executor_role_ref: CommissionedWorkRoleRefV01;
  run_ref_fingerprint: string;
  request_ref_fingerprint: string;
  host_ref_set: CommissionedWorkNativeHostRefBindingV01[];
  host_context_fingerprint: string;
  native_execution_configuration_fingerprint: string;
  adapter_execution_binding_fingerprint: string;
  native_host_result_fingerprint: string;
  clone_identity_fingerprint: string;
  clone_baseline: CommissionedLiveTrainingCloneBaselineV01;
  admitted_at: string;
  prior_attempt_material_inherited: false;
  prior_execution_grant_inherited: false;
  predecessor_or_sibling_transcript_inherited: false;
  hidden_reasoning_inherited: false;
  integrity: CommissionedWorkIntegrityV01;
}

export type CommissionedLiveTrainingAttemptFailureClassV01 =
  | "none"
  | "pre_action_host_infrastructure_failure"
  | "behavioral_failure"
  | "objective_check_failure"
  | "false_success"
  | "authority_failure"
  | "cleanup_failure"
  | "unknown_boundary";

export interface CommissionedLiveTrainingAttemptTerminalV01 {
  terminal_version: typeof COMMISSIONED_LIVE_TRAINING_ATTEMPT_TERMINAL_VERSION_V01;
  terminal_id: string;
  attempt_admission_ref: CommissionedWorkRecordRefV01;
  slot_id: string;
  terminal_status: "valid_episode" | "non_aggregable_failure";
  failure_class: CommissionedLiveTrainingAttemptFailureClassV01;
  first_meaningful_action_status: "observed_absent" | "observed_present" | "unknown";
  repository_mutation_status: "observed_absent" | "observed_present" | "unknown";
  native_host_settled: boolean;
  cleanup_complete: boolean;
  episode_ref: CommissionedWorkRecordRefV01 | null;
  blind_observation_ref: CommissionedWorkRecordRefV01 | null;
  finished_at: string;
  aggregable: boolean;
  replacement_eligible: boolean;
  integrity: CommissionedWorkIntegrityV01;
}

export interface CommissionedLiveTrainingAttemptRegistryV01 {
  registry_version: typeof COMMISSIONED_LIVE_TRAINING_ATTEMPT_REGISTRY_VERSION_V01;
  registry_id: string;
  cohort_plan_ref: CommissionedWorkRecordRefV01;
  authorization_ref: CommissionedWorkRecordRefV01;
  attempt_start_refs: CommissionedWorkRecordRefV01[];
  primary_attempts: CommissionedWorkRecordRefV01[];
  replacement_attempts: CommissionedWorkRecordRefV01[];
  terminal_refs: CommissionedWorkRecordRefV01[];
  non_aggregable_failure_refs: CommissionedWorkRecordRefV01[];
  replacement_invocation_count: number;
  every_primary_slot_resolved_exactly_once: boolean;
  incomplete_cohort_aggregable: false;
  integrity: CommissionedWorkIntegrityV01;
}

export type CommissionedLiveTrainingCandidateComponentStatusV01 =
  | "mechanically_eligible_for_holdout"
  | "not_eligible"
  | "incomplete";

export interface CommissionedLiveTrainingCandidateComponentAssessmentV01 {
  component_id:
    | "reobserve_current_source_before_action"
    | "preserve_negative_status_without_new_support"
    | "separate_execution_completion_from_verified_success";
  component_ref: CommissionedWorkRecordRefV01;
  status: CommissionedLiveTrainingCandidateComponentStatusV01;
  independent_origin_count: number;
  objective_condition_sensitive_pattern_observed: boolean;
  objective_supporting_episode_refs: CommissionedWorkRecordRefV01[];
  objective_supporting_evaluation_refs: CommissionedWorkRecordRefV01[];
  opposing_or_counterexample_refs: CommissionedWorkRecordRefV01[];
  relevant_hard_failures: string[];
  harmful_transfer_observation_refs: CommissionedWorkRecordRefV01[];
  strongest_simpler_comparator: string;
  missing_evidence_codes: string[];
  falsifier_codes: string[];
  uncertainty_codes: string[];
  actual_reference_status: CommissionedWorkEvidenceStatusV01;
  actual_use_status: CommissionedWorkEvidenceStatusV01;
  support_validated_status: CommissionedWorkEvidenceStatusV01;
  outcome_associated_status: CommissionedWorkEvidenceStatusV01;
  evidence_authority: {
    evidence_supported_procedural_knowledge: false;
    independently_learned: false;
    validated_for_transfer: false;
    active_context_created: false;
    policy_created: false;
  };
}

export interface CommissionedLiveTrainingCandidateAssessmentV01 {
  assessment_version: typeof COMMISSIONED_LIVE_TRAINING_CANDIDATE_ASSESSMENT_VERSION_V01;
  assessment_id: string;
  family_ref: CommissionedWorkRecordRefV01;
  cohort_plan_ref: CommissionedWorkRecordRefV01;
  training_result_ref: CommissionedWorkRecordRefV01;
  attempt_registry_ref: CommissionedWorkRecordRefV01;
  source_episode_refs: CommissionedWorkRecordRefV01[];
  source_blind_observation_refs: CommissionedWorkRecordRefV01[];
  assessor_role_ref: CommissionedWorkRoleRefV01;
  eligibility_rule_version: "commissioned_live_training_mechanical_eligibility_rule.v0.1";
  minimum_independent_origin_groups: 2;
  objective_condition_sensitive_pattern_required: true;
  contradictory_hard_failure_allowed: false;
  harmful_transfer_allowed: false;
  infrastructure_invalid_attempts_count_as_behavioral_evidence: false;
  executor_self_report_sufficient: false;
  components: [
    CommissionedLiveTrainingCandidateComponentAssessmentV01,
    CommissionedLiveTrainingCandidateComponentAssessmentV01,
    CommissionedLiveTrainingCandidateComponentAssessmentV01,
  ];
  holdout_source_used: false;
  holdout_candidate_frozen: false;
  learned_procedural_knowledge_claimed: false;
  behavioral_benefit_claimed: false;
  transfer_claimed: false;
  integrity: CommissionedWorkIntegrityV01;
}

export interface CommissionedLiveTrainingCleanupReportV01 {
  cleanup_version: typeof COMMISSIONED_LIVE_TRAINING_CLEANUP_VERSION_V01;
  cleanup_id: string;
  cohort_plan_ref: CommissionedWorkRecordRefV01;
  requested: true;
  completed: boolean;
  owned_processes_remaining: number;
  owned_listeners_remaining: number;
  owned_repository_roots_remaining: number;
  owned_runtime_roots_remaining: number;
  owned_temporary_roots_remaining: number;
  stale_artifact_temporaries_remaining: number;
  task_external_network_attempts: number;
  provider_calls_observed: CommissionedWorkResourceLaneV01;
  model_calls_observed: CommissionedWorkResourceLaneV01;
  cleanup_observation: CommissionedLiveTrainingCleanupObservationV01;
  cleanup_observation_ref: CommissionedWorkRecordRefV01;
  integrity: CommissionedWorkIntegrityV01;
}

export interface CommissionedLiveTrainingCleanupObservationV01 {
  observation_version: typeof COMMISSIONED_LIVE_TRAINING_CLEANUP_OBSERVATION_VERSION_V01;
  observation_id: string;
  cohort_plan_ref: CommissionedWorkRecordRefV01;
  native_host_invocations_started: number;
  exact_adapter_settlement_fingerprints: string[];
  every_started_adapter_invocation_settled: boolean;
  listener_owner_kind: "stdio_only_no_listener_created";
  repository_roots_absent: boolean;
  runtime_roots_absent: boolean;
  temporary_roots_absent: boolean;
  artifact_temporaries_absent: boolean;
  task_external_network_attempts: number;
  observed_at: string;
  integrity: CommissionedWorkIntegrityV01;
}

export interface CommissionedLiveTrainingResultV01 {
  result_version: typeof COMMISSIONED_LIVE_TRAINING_RESULT_VERSION_V01;
  result_id: string;
  cohort_plan_ref: CommissionedWorkRecordRefV01;
  authorization_ref: CommissionedWorkRecordRefV01;
  authorization_consumption_ref: CommissionedWorkRecordRefV01;
  attempt_registry_ref: CommissionedWorkRecordRefV01;
  merged_training_result: CommissionedWorkTrainingResultV01;
  predecessor_checkpoint_refs: [
    CommissionedWorkRecordRefV01,
    CommissionedWorkRecordRefV01,
    CommissionedWorkRecordRefV01,
  ];
  clone_seal_refs: [
    CommissionedWorkRecordRefV01,
    CommissionedWorkRecordRefV01,
    CommissionedWorkRecordRefV01,
  ];
  blind_observation_refs: CommissionedWorkRecordRefV01[];
  analysis_join_refs: CommissionedWorkRecordRefV01[];
  valid_predecessor_episode_count: 3;
  valid_successor_episode_count: 12;
  valid_primary_episode_count: 15;
  training_complete: true;
  all_primary_slots_present_exactly_once: true;
  objective_observations_sealed_before_unblinding: true;
  holdout_materialized: false;
  holdout_episode_count: 0;
  holdout_candidate_frozen: false;
  final_live_family_report_created: false;
  execution_evidence_class:
    | "commissioned_agent_protocol_conformance"
    | "commissioned_agent_observation";
  fake_output_is_behavioral_evidence: false;
  integrity: CommissionedWorkIntegrityV01;
}

export type CommissionedLiveTrainingArtifactSlotKindV01 =
  | "authorization"
  | "authorization_consumption_primary"
  | "authorization_consumption_witness"
  | "cohort_plan"
  | "family_manifest"
  | "attempt_start"
  | "attempt_admission"
  | "attempt_terminal"
  | "attempt_registry"
  | "episode"
  | "predecessor_checkpoint"
  | "clone_seal"
  | "blind_objective_observation"
  | "analysis_join"
  | "training_result"
  | "live_training_result"
  | "candidate_assessment"
  | "cleanup_report"
  | "incomplete_cleanup_report"
  | "incomplete_closeout";

export interface CommissionedLiveTrainingIncompleteCloseoutV01 {
  closeout_version: typeof COMMISSIONED_LIVE_TRAINING_INCOMPLETE_CLOSEOUT_VERSION_V01;
  closeout_id: string;
  cohort_plan_ref: CommissionedWorkRecordRefV01;
  authorization_ref: CommissionedWorkRecordRefV01;
  authorization_consumption_ref: CommissionedWorkRecordRefV01;
  failure_code: string;
  attempt_start_refs: CommissionedWorkRecordRefV01[];
  attempt_admission_refs: CommissionedWorkRecordRefV01[];
  attempt_terminal_refs: CommissionedWorkRecordRefV01[];
  primary_slots_completed: number;
  cohort_aggregable: false;
  nonce_reusable: false;
  cleanup_report_ref: CommissionedWorkRecordRefV01;
  integrity: CommissionedWorkIntegrityV01;
}

export interface CommissionedLiveTrainingCompletionWitnessV01 {
  witness_version: typeof COMMISSIONED_LIVE_TRAINING_COMPLETION_WITNESS_VERSION_V01;
  witness_id: string;
  authorization_ref: CommissionedWorkRecordRefV01;
  cohort_plan_ref: CommissionedWorkRecordRefV01;
  authorization_nonce_fingerprint: string;
  artifact_index_fingerprint: string;
  artifact_index_content_fingerprint: string;
  completion_state: "complete";
  append_only: true;
  integrity: CommissionedWorkIntegrityV01;
}

export interface CommissionedLiveTrainingArtifactIndexEntryV01 {
  slot_kind: CommissionedLiveTrainingArtifactSlotKindV01;
  record_ref: CommissionedWorkRecordRefV01;
  slot_id: string | null;
  attempt_id: string | null;
  case_id: string | null;
  relative_path: string;
  content_fingerprint: string;
}

export interface CommissionedLiveTrainingArtifactIndexV01 {
  index_version: typeof COMMISSIONED_LIVE_TRAINING_ARTIFACT_INDEX_VERSION_V01;
  cohort_id: string;
  authorization_fingerprint: string;
  cohort_plan_fingerprint: string;
  family_fingerprint: string;
  append_only: true;
  completion_state: "complete" | "incomplete";
  complete_expected_slots: boolean;
  cohort_aggregable: boolean;
  expected_primary_episode_count: 15;
  expected_predecessor_checkpoint_count: 3;
  expected_holdout_episode_count: 0;
  artifacts: CommissionedLiveTrainingArtifactIndexEntryV01[];
  raw_prompt_persisted: false;
  raw_transcript_persisted: false;
  hidden_reasoning_persisted: false;
  raw_terminal_output_persisted: false;
  raw_provider_payload_persisted: false;
  credential_or_secret_persisted: false;
  absolute_local_path_persisted: false;
  production_project_content_persisted: false;
  synthetic_expected_write_persisted_as_executor_evidence: false;
  holdout_materialized: false;
  github_writes: 0;
  product_database_writes: 0;
  core_writes: 0;
  semantic_writes: 0;
  review_decision_writes: 0;
  transition_writes: 0;
  policy_activations: 0;
  publication_writes: 0;
  integrity: CommissionedWorkIntegrityV01;
}

export interface CommissionedLiveTrainingArtifactsV01 {
  authorization: CommissionedLiveTrainingAuthorizationV01;
  authorization_consumption: CommissionedLiveTrainingAuthorizationConsumptionV01;
  cohort_plan: CommissionedLiveTrainingCohortPlanV01;
  family_manifest: import("./commissioned-controlled-workbench").CommissionedWorkFamilyManifestV01;
  attempt_starts: CommissionedLiveTrainingAttemptStartV01[];
  attempt_admissions: CommissionedLiveTrainingAttemptAdmissionV01[];
  attempt_terminals: CommissionedLiveTrainingAttemptTerminalV01[];
  attempt_registry: CommissionedLiveTrainingAttemptRegistryV01;
  episodes: CommissionedWorkEpisodeArtifactV01[];
  predecessor_checkpoints: CommissionedWorkEpisodeCheckpointV01[];
  clone_seals: CommissionedLiveTrainingCloneSealV01[];
  blind_objective_observations: CommissionedLiveTrainingBlindObjectiveObservationV01[];
  analysis_joins: CommissionedLiveTrainingAnalysisJoinV01[];
  training_result: CommissionedWorkTrainingResultV01;
  live_training_result: CommissionedLiveTrainingResultV01;
  candidate_assessment: CommissionedLiveTrainingCandidateAssessmentV01;
  cleanup_report: CommissionedLiveTrainingCleanupReportV01;
}
