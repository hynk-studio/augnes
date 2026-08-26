import type { OperationalReentryArmRoleV01 } from "./operational-reentry-perturbation";

export const COMMISSIONED_WORK_FAMILY_VERSION_V01 =
  "commissioned_controlled_work_family.v0.1" as const;
export const COMMISSIONED_WORK_CASE_COMMITMENT_VERSION_V01 =
  "commissioned_controlled_work_case_commitment.v0.1" as const;
export const COMMISSIONED_WORK_EPISODE_VERSION_V01 =
  "commissioned_controlled_work_episode.v0.1" as const;
export const COMMISSIONED_WORK_EVALUATION_VERSION_V01 =
  "commissioned_controlled_work_evaluation.v0.1" as const;
export const COMMISSIONED_WORK_CANDIDATE_VERSION_V01 =
  "commissioned_controlled_work_consolidation_candidate.v0.1" as const;
export const COMMISSIONED_WORK_HOLDOUT_VERSION_V01 =
  "commissioned_controlled_work_holdout_evaluation.v0.1" as const;
export const COMMISSIONED_WORK_REPORT_VERSION_V01 =
  "commissioned_controlled_workbench_report.v0.1" as const;
export const COMMISSIONED_WORK_ARTIFACT_INDEX_VERSION_V01 =
  "commissioned_controlled_work_artifact_index.v0.1" as const;
export const COMMISSIONED_WORK_CANONICALIZATION_V01 =
  "augnes-json-c14n-v0_1" as const;

export const COMMISSIONED_WORK_CONDITIONS_V01 = [
  "exact_current_continuity",
  "matched_ablation",
  "stale_or_regime_shift_continuity",
  "zero_continuation_control",
] as const;

export type CommissionedWorkConditionV01 =
  (typeof COMMISSIONED_WORK_CONDITIONS_V01)[number];

export const COMMISSIONED_WORK_TREATMENT_ROLE_BINDINGS_V01 = Object.freeze({
  exact_current_continuity: "exact_reentry",
  matched_ablation: "matched_single_item_ablation",
  stale_or_regime_shift_continuity: "stale_or_regime_shift_reset",
  zero_continuation_control: "existing_one_run_baseline",
} as const satisfies Record<CommissionedWorkConditionV01, OperationalReentryArmRoleV01>);

export const COMMISSIONED_WORK_EVIDENCE_LADDER_STAGES_V01 = [
  "available",
  "selected",
  "presented_before_first_meaningful_action",
  "referenced",
  "behaviorally_conditioned",
  "support_validated",
  "outcome_associated",
  "intervention_sensitive",
  "repeatable",
  "held_out_transfer",
] as const;

export type CommissionedWorkEvidenceLadderStageV01 =
  (typeof COMMISSIONED_WORK_EVIDENCE_LADDER_STAGES_V01)[number];

export type CommissionedWorkEvidenceStatusV01 =
  | "established"
  | "not_established"
  | "unknown"
  | "not_applicable";

export type CommissionedWorkCaseRoleV01 = "training" | "holdout";
export type CommissionedWorkEpisodeRoleV01 = "predecessor" | "successor";
export type CommissionedWorkLifecycleStatusV01 =
  | "current"
  | "stale"
  | "rejected"
  | "deferred"
  | "superseded"
  | "retracted"
  | "incomplete"
  | "execution_only";

export type CommissionedWorkHoldoutVariantV01 =
  | "strongest_equal_budget_baseline"
  | "candidate_present"
  | "candidate_component_ablation"
  | "stale_or_reset";

export const COMMISSIONED_WORK_CANDIDATE_INTERVENTION_MODES_V01 = [
  "not_applicable",
  "no_candidate",
  "all_frozen_candidate_components",
  "frozen_candidate_minus_last_component",
] as const;

export type CommissionedWorkCandidateInterventionModeV01 =
  (typeof COMMISSIONED_WORK_CANDIDATE_INTERVENTION_MODES_V01)[number];

export type CommissionedWorkHoldoutRelationV01 =
  | "equal"
  | "improved"
  | "harmed"
  | "incomplete"
  | "non_comparable";

export const COMMISSIONED_WORK_CANDIDATE_COMPONENT_IDS_V01 = [
  "reobserve_current_source_before_action",
  "preserve_negative_status_without_new_support",
  "separate_execution_completion_from_verified_success",
] as const;

export type CommissionedWorkCandidateComponentIdV01 =
  (typeof COMMISSIONED_WORK_CANDIDATE_COMPONENT_IDS_V01)[number];

export type CommissionedWorkHardFailureCodeV01 =
  | "objective_oracle_failed"
  | "objective_oracle_missing"
  | "required_check_failed"
  | "required_check_not_performed"
  | "repository_diff_incorrect"
  | "negative_space_revived"
  | "source_currentness_mismatch"
  | "project_scope_violation"
  | "authority_expansion"
  | "outside_root_effect"
  | "transcript_inherited"
  | "hidden_reasoning_inherited";

export interface CommissionedWorkIntegrityV01 {
  algorithm: "sha256";
  canonicalization: typeof COMMISSIONED_WORK_CANONICALIZATION_V01;
  fingerprint_scope: string;
  fingerprint: string;
}

export interface CommissionedWorkRoleRefV01 {
  role_kind:
    | "task_author"
    | "executor"
    | "outcome_evaluator"
    | "consolidation_assessor";
  role_id: string;
  role_fingerprint: string;
}

export interface CommissionedWorkRecordRefV01 {
  record_version: string;
  record_id: string;
  record_fingerprint: string;
}

export interface CommissionedWorkOpaqueMaterialRefV01 {
  material_kind:
    | "common_task_evidence"
    | "continuation_material"
    | "excluded_or_ablated_material"
    | "stale_relation"
    | "intervention_provenance"
    | "task_definition"
    | "evaluator_rubric"
    | "candidate_component";
  opaque_id: string;
  content_fingerprint: string;
  lifecycle_status: CommissionedWorkLifecycleStatusV01 | null;
}

/**
 * Source-only material used to build a sealed commitment. Raw values are never
 * copied into a report or artifact index.
 */
export interface CommissionedWorkSourceMaterialV01 {
  material_id: string;
  material_kind:
    | "common_task_evidence"
    | "continuation_material"
    | "excluded_or_ablated_material"
    | "stale_relation"
    | "intervention_provenance";
  lifecycle_status: CommissionedWorkLifecycleStatusV01;
  content: string;
}

export interface CommissionedWorkRepositoryFileSourceV01 {
  repository_relative_path: string;
  content: string;
}

export interface CommissionedWorkRepositoryWriteSourceV01 {
  repository_relative_path: string;
  content: string;
}

export interface CommissionedWorkNegativeSpaceGuardSourceV01 {
  guard_id: string;
  repository_relative_path: string;
  forbidden_fragment: string;
  guarded_status:
    | "rejected"
    | "deferred"
    | "superseded"
    | "retracted"
    | "stale";
}

export interface CommissionedWorkRequiredCheckSourceV01 {
  check_id: string;
  oracle_relative_path: string;
}

export interface CommissionedWorkEpisodePlanSourceV01 {
  executor_role_id: string;
  claimed_complete: boolean;
  writes: CommissionedWorkRepositoryWriteSourceV01[];
  referenced_material_ids: string[];
}

export interface CommissionedWorkSuccessorPlanSourceV01
  extends CommissionedWorkEpisodePlanSourceV01 {
  condition: CommissionedWorkConditionV01;
  holdout_variant: CommissionedWorkHoldoutVariantV01 | null;
  candidate_intervention_mode: CommissionedWorkCandidateInterventionModeV01;
  selected_material_ids: string[];
  excluded_material_ids: string[];
  stale_relation_material_id: string | null;
  intervention_provenance_material_id: string;
}

export interface CommissionedWorkCaseSourceV01 {
  case_id: string;
  case_role: CommissionedWorkCaseRoleV01;
  project_id: string;
  independent_origin_group_id: string;
  task: {
    goal: string;
    success_criteria: string[];
    non_goals: string[];
  };
  repository_fixture: CommissionedWorkRepositoryFileSourceV01[];
  predecessor_plan: CommissionedWorkEpisodePlanSourceV01;
  source_drift_writes: CommissionedWorkRepositoryWriteSourceV01[];
  successor_plans: CommissionedWorkSuccessorPlanSourceV01[];
  current_source_relative_paths: string[];
  required_checks: CommissionedWorkRequiredCheckSourceV01[];
  source_currentness_check_id: string;
  expected_success_changed_paths: string[];
  expected_success_writes: CommissionedWorkRepositoryWriteSourceV01[];
  negative_space_guards: CommissionedWorkNegativeSpaceGuardSourceV01[];
  materials: CommissionedWorkSourceMaterialV01[];
  evaluator_version: string;
  budget: {
    max_changed_files: number;
    max_checks: number;
    max_processes: number;
    provider_call_limit: 0;
    network_call_limit: 0;
  };
}

export interface CommissionedWorkCaseCommitmentV01 {
  commitment_version: typeof COMMISSIONED_WORK_CASE_COMMITMENT_VERSION_V01;
  case_id: string;
  case_role: CommissionedWorkCaseRoleV01;
  project_id: string;
  independent_origin_group_id: string;
  repository_fixture_fingerprint: string;
  initial_source_fingerprint: string;
  task_fingerprint: string;
  common_evidence_fingerprint: string;
  source_drift_fingerprint: string;
  expected_current_source_fingerprint: string;
  source_currentness_check_id: string;
  evaluator_rubric_fingerprint: string;
  objective_oracle_fingerprint: string;
  expected_success_diff_fingerprint: string;
  hard_failure_set_fingerprint: string;
  condition_assignment_fingerprint: string;
  holdout_plan_fingerprint: string | null;
  repository_path_set_fingerprint: string;
  operation_shape_fingerprint: string;
  episode_plan_set_fingerprint: string;
  required_check_ids: string[];
  negative_space_guard_refs: CommissionedWorkOpaqueMaterialRefV01[];
  condition_bindings: Array<{
    condition: CommissionedWorkConditionV01;
    holdout_variant: CommissionedWorkHoldoutVariantV01 | null;
    existing_reentry_role: OperationalReentryArmRoleV01;
    common_evidence_fingerprint: string;
    continuation_material_refs: CommissionedWorkOpaqueMaterialRefV01[];
    excluded_material_refs: CommissionedWorkOpaqueMaterialRefV01[];
    stale_relation_ref: CommissionedWorkOpaqueMaterialRefV01 | null;
    intervention_provenance_ref: CommissionedWorkOpaqueMaterialRefV01;
    candidate_intervention_mode: CommissionedWorkCandidateInterventionModeV01;
    candidate_component_refs: CommissionedWorkOpaqueMaterialRefV01[];
    candidate_assignment_fingerprint: string | null;
    binding_fingerprint: string;
  }>;
  source_content_included: false;
  integrity: CommissionedWorkIntegrityV01;
}

export interface CommissionedWorkFamilyManifestV01 {
  family_version: typeof COMMISSIONED_WORK_FAMILY_VERSION_V01;
  family_id: string;
  evidence_class: "commissioned_controlled_work";
  execution_mode: "deterministic_zero_provider_faithful_adapter";
  workspace_id: string;
  task_family_key: string;
  sealed_at: string;
  construction_cutoff: string;
  evaluator_version: string;
  task_author: CommissionedWorkRoleRefV01;
  outcome_evaluator: CommissionedWorkRoleRefV01;
  consolidation_assessor: CommissionedWorkRoleRefV01;
  training_cases: [
    CommissionedWorkCaseCommitmentV01,
    CommissionedWorkCaseCommitmentV01,
    CommissionedWorkCaseCommitmentV01,
  ];
  holdout_case: CommissionedWorkCaseCommitmentV01;
  condition_order: readonly [
    "exact_current_continuity",
    "matched_ablation",
    "stale_or_regime_shift_continuity",
    "zero_continuation_control",
  ];
  equal_budget_fingerprint: string;
  hypothesis_fingerprint: string;
  task_or_rubric_mutation_allowed: false;
  holdout_content_in_manifest: false;
  holdout_used_for_candidate_derivation: false;
  material_boundary: CommissionedWorkMaterialBoundaryV01;
  authority_summary: CommissionedWorkAuthoritySummaryV01;
  integrity: CommissionedWorkIntegrityV01;
}

export interface CommissionedWorkRuntimeBindingV01 {
  /** Ephemeral execution input only; this shape must never enter a CW1 report. */
  report_included: false;
  case_id: string;
  condition: CommissionedWorkConditionV01 | null;
  holdout_variant: CommissionedWorkHoldoutVariantV01 | null;
  workspace_id: string;
  project_id: string;
  repository_root: string;
  database_path: string;
  home_root: string;
  data_root: string;
  config_root: string;
  runtime_root: string;
  artifact_root: string;
}

export interface CommissionedWorkObjectiveObservationV01 {
  observation_version: "commissioned_work_objective_observation.v0.1";
  evaluator_version: string;
  evaluator_role: CommissionedWorkRoleRefV01;
  workspace_id: string;
  project_id: string;
  case_id: string;
  episode_role: CommissionedWorkEpisodeRoleV01;
  condition: CommissionedWorkConditionV01 | null;
  holdout_variant: CommissionedWorkHoldoutVariantV01 | null;
  run_ref_fingerprint: string;
  oracle_executed: boolean;
  repository_state_fingerprint: string;
  current_source_fingerprint: string;
  changed_path_fingerprints: string[];
  required_checks: Array<{
    check_id: string;
    disposition: "passed" | "failed" | "skipped" | "unknown";
    command_fingerprint: string | null;
    exit_code: number | null;
  }>;
  repository_diff_correctness: "passed" | "failed" | "unknown";
  verification_completeness: "complete" | "incomplete" | "unknown";
  negative_space: {
    status: "preserved" | "revived" | "unknown";
    violated_guard_fingerprints: string[];
    guard_observations: Array<{
      guard_ref: CommissionedWorkOpaqueMaterialRefV01;
      status: "preserved" | "revived" | "unknown";
    }>;
  };
  source_currentness: "current" | "failed" | "unknown";
  project_scope: "exact" | "violated" | "unknown";
  authority_effects: {
    provider_calls: 0;
    model_calls: 0;
    external_network_calls: 0;
    outside_root_writes: 0;
    product_database_writes: 0;
    core_writes: 0;
    proposal_writes: 0;
    review_decision_writes: 0;
    transition_writes: 0;
    policy_activations: 0;
    active_pointer_writes: 0;
    github_writes: 0;
  };
  resources: CommissionedWorkResourceVectorV01;
  integrity: CommissionedWorkIntegrityV01;
}

export type CommissionedWorkResourceLaneV01 =
  | { provenance: "observed"; value: number }
  | { provenance: "unknown"; value: null };

export interface CommissionedWorkResourceVectorV01 {
  provider_calls: CommissionedWorkResourceLaneV01;
  model_calls: CommissionedWorkResourceLaneV01;
  external_network_calls: CommissionedWorkResourceLaneV01;
  tool_calls: CommissionedWorkResourceLaneV01;
  model_usage_units: CommissionedWorkResourceLaneV01;
  cost_microunits: CommissionedWorkResourceLaneV01;
  latency_ms: CommissionedWorkResourceLaneV01;
  human_review_burden: CommissionedWorkResourceLaneV01;
}

export interface CommissionedWorkEvidenceLadderRowV01 {
  stage: CommissionedWorkEvidenceLadderStageV01;
  status: CommissionedWorkEvidenceStatusV01;
  basis:
    | "exact_packet_delivery"
    | "exact_executor_reference"
    | "objective_repository_observation"
    | "cross_condition_difference"
    | "independent_origin_recurrence"
    | "frozen_holdout_observation"
    | "explicit_absence"
    | "instrumentation_unavailable"
    | "not_applicable";
  source_refs: CommissionedWorkRecordRefV01[];
}

export interface CommissionedWorkEvaluationVectorV01 {
  deterministic_repository_task_success: boolean;
  required_check_dispositions: CommissionedWorkObjectiveObservationV01["required_checks"];
  repository_diff_correctness: CommissionedWorkObjectiveObservationV01["repository_diff_correctness"];
  verification_completeness: CommissionedWorkObjectiveObservationV01["verification_completeness"];
  false_success_behavior: "observed" | "not_observed" | "unknown";
  negative_space_status: CommissionedWorkObjectiveObservationV01["negative_space"]["status"];
  first_material_repository_action: {
    action_kind: "file_add" | "file_modify" | "file_delete" | "none";
    repository_path_fingerprint: string | null;
  };
  condition_sensitive_structured_behavior: "observed" | "not_observed" | "unknown";
  harmful_transfer: "observed" | "not_observed" | "unknown";
  source_currentness_failure: boolean | null;
  authority_violation: boolean | null;
  project_scope_violation: boolean | null;
  executor_role: CommissionedWorkRoleRefV01;
  host_identity_fingerprint: string;
  model_identity: "zero_model";
  resources: CommissionedWorkResourceVectorV01;
  hard_failures: CommissionedWorkHardFailureCodeV01[];
  hard_failures_non_compensable: true;
  scalar_fitness_created: false;
}

export interface CommissionedWorkEpisodeArtifactV01 {
  episode_version: typeof COMMISSIONED_WORK_EPISODE_VERSION_V01;
  episode_id: string;
  episode_role: CommissionedWorkEpisodeRoleV01;
  case_id: string;
  case_role: CommissionedWorkCaseRoleV01;
  workspace_id: string;
  project_id: string;
  independent_origin_group_id: string;
  case_commitment_ref: CommissionedWorkRecordRefV01;
  repository_fixture_fingerprint: string;
  evaluator_version: string;
  objective_evaluator: CommissionedWorkRoleRefV01;
  condition: CommissionedWorkConditionV01 | null;
  existing_reentry_role: OperationalReentryArmRoleV01 | null;
  holdout_variant: CommissionedWorkHoldoutVariantV01 | null;
  common_evidence_fingerprint: string;
  continuation_binding_fingerprint: string | null;
  intervention_provenance_fingerprint: string | null;
  resolved_intervention_fingerprint: string | null;
  candidate_freeze_fingerprint: string | null;
  candidate_intervention_fingerprint: string | null;
  predecessor_episode_ref: CommissionedWorkRecordRefV01 | null;
  sealed_interruption_ref: CommissionedWorkRecordRefV01 | null;
  task_context_packet_ref: CommissionedWorkRecordRefV01;
  native_host_result_ref: CommissionedWorkRecordRefV01;
  run_receipt_ref: CommissionedWorkRecordRefV01;
  execution_binding: {
    run_ref_fingerprint: string;
    request_id: string;
    disposable_fixture_admission_fingerprint: string;
    live_authorization_created: false;
    fixture_admission_reused: false;
    fixture_episode_policy_fingerprint: string;
    new_run_for_cold_episode: true;
    predecessor_run_reused: false;
    predecessor_transcript_inherited: false;
    hidden_reasoning_inherited: false;
    executor_completion_is_outcome_truth: false;
    product_execution_grant_created: false;
    packet_material_set_fingerprint: string;
    consumed_material_set_fingerprint: string;
    continuation_materials_consumed: number;
    candidate_components_consumed: number;
    candidate_component_delivery_fingerprints: string[];
  };
  chronology: {
    started_at: string;
    first_material_action_at: string | null;
    finished_at: string;
    candidate_frozen_before_start: boolean | null;
  };
  repository_state: {
    initial_commit: string;
    initial_tree: string;
    episode_start_commit: string;
    episode_start_tree: string;
    episode_end_head: string;
    episode_end_tree: string;
    worktree_fingerprint: string;
  };
  executor_claimed_complete: boolean;
  repository_action_trace_fingerprint: string;
  objective_observation_ref: CommissionedWorkRecordRefV01;
  evaluation: CommissionedWorkEvaluationVectorV01;
  evidence_ladder: CommissionedWorkEvidenceLadderRowV01[];
  authority_summary: CommissionedWorkAuthoritySummaryV01;
  material_boundary: CommissionedWorkMaterialBoundaryV01;
  integrity: CommissionedWorkIntegrityV01;
}

export interface CommissionedWorkTrainingResultV01 {
  result_version: "commissioned_controlled_work_training_result.v0.1";
  family_ref: CommissionedWorkRecordRefV01;
  predecessor_episodes: CommissionedWorkEpisodeArtifactV01[];
  successor_episodes: CommissionedWorkEpisodeArtifactV01[];
  training_complete: true;
  all_frozen_training_slots_present: true;
  holdout_materialized: false;
  integrity: CommissionedWorkIntegrityV01;
}

export interface CommissionedWorkConsolidationCandidateV01 {
  candidate_version: typeof COMMISSIONED_WORK_CANDIDATE_VERSION_V01;
  candidate_id: string;
  candidate_kind: "procedural_component_recipe";
  family_ref: CommissionedWorkRecordRefV01;
  consolidation_assessor: CommissionedWorkRoleRefV01;
  frozen_at: string;
  source_episode_refs: CommissionedWorkRecordRefV01[];
  source_evaluation_refs: CommissionedWorkRecordRefV01[];
  independent_origin_groups: Array<{
    independent_origin_group_id: string;
    case_id: string;
    source_episode_refs: CommissionedWorkRecordRefV01[];
  }>;
  scope: {
    workspace_id: string;
    task_family_key: string;
    regime: "sealed_commissioned_repository_work_v0.1";
  };
  minimal_generalized_rule: {
    components: Array<{
      component_ref: CommissionedWorkOpaqueMaterialRefV01;
      source_episode_refs: CommissionedWorkRecordRefV01[];
      source_evaluation_refs: CommissionedWorkRecordRefV01[];
      independent_origin_group_ids: string[];
      opposing_or_counterexample_episode_refs: CommissionedWorkRecordRefV01[];
      whole_bundle_credit_applied: false;
    }>;
    ordered_components: [
      "reobserve_current_source_before_action",
      "preserve_negative_status_without_new_support",
      "separate_execution_completion_from_verified_success",
    ];
  };
  supporting_case_ids: string[];
  opposing_or_counterexample_episode_refs: CommissionedWorkRecordRefV01[];
  negative_transfer: {
    status: "observed" | "not_observed" | "unknown";
    source_refs: CommissionedWorkRecordRefV01[];
  };
  expected_downstream_effect:
    "reduce_currentness_negative_space_and_false_success_hard_failures";
  falsifier_codes: CommissionedWorkHardFailureCodeV01[];
  uncertainty_codes: string[];
  missing_evidence_codes: string[];
  applicability: {
    task_family_key: string;
    requires_source_reobservation: true;
    requires_objective_repository_oracle: true;
  };
  stale_or_reset_conditions: [
    "source_regime_changed",
    "continuity_source_superseded",
    "objective_oracle_changed",
  ];
  strongest_simpler_baseline: {
    variant: "strongest_equal_budget_baseline";
    selection_fingerprint: string;
    source_episode_refs: CommissionedWorkRecordRefV01[];
  };
  holdout_included_in_derivation: false;
  repeated_same_origin_counted_as_independent: false;
  accepted_semantic_state_created: false;
  active_context_created: false;
  policy_created: false;
  integrity: CommissionedWorkIntegrityV01;
}

export interface CommissionedWorkHoldoutComparisonV01 {
  comparison_id: string;
  left_variant: CommissionedWorkHoldoutVariantV01;
  right_variant: CommissionedWorkHoldoutVariantV01;
  relation: CommissionedWorkHoldoutRelationV01;
  objective_basis_only: true;
  behaviorally_distinct: boolean | null;
  behavioral_distinction_is_benefit: false;
  hard_failure_non_compensation_applied: boolean;
}

export interface CommissionedWorkHoldoutEvaluationV01 {
  holdout_version: typeof COMMISSIONED_WORK_HOLDOUT_VERSION_V01;
  holdout_id: string;
  family_ref: CommissionedWorkRecordRefV01;
  candidate_ref: CommissionedWorkRecordRefV01;
  candidate_frozen_at: string;
  holdout_materialized_at: string;
  holdout_started_at: string;
  candidate_frozen_before_holdout_materialization: true;
  candidate_frozen_before_holdout_execution: true;
  predecessor_episode: CommissionedWorkEpisodeArtifactV01;
  arms: [
    CommissionedWorkEpisodeArtifactV01,
    CommissionedWorkEpisodeArtifactV01,
    CommissionedWorkEpisodeArtifactV01,
    CommissionedWorkEpisodeArtifactV01,
  ];
  comparisons: CommissionedWorkHoldoutComparisonV01[];
  transfer_result: CommissionedWorkHoldoutRelationV01;
  general_benefit_claimed: false;
  general_harm_claimed: false;
  policy_fitness_claimed: false;
  integrity: CommissionedWorkIntegrityV01;
}

export interface CommissionedWorkAuthoritySummaryV01 {
  is_approval: false;
  is_canonical_core_record: false;
  is_naturalistic_rw1_evidence: false;
  is_accepted_semantic_state: false;
  is_policy: false;
  is_proposal: false;
  is_review_decision: false;
  is_transition: false;
  creates_production_run: false;
  creates_product_execution_grant: false;
  creates_active_pointer: false;
  writes_product_database: false;
  mutates_source_records: false;
  mutates_task_context_packet: false;
  mutates_semantic_state: false;
  activates_policy: false;
  authorizes_provider_calls: false;
  authorizes_network_use: false;
  authorizes_external_effects: false;
  authorizes_github_mutation: false;
  authorizes_publication: false;
  authorizes_merge: false;
  creates_scalar_fitness: false;
  creates_rank_or_winner: false;
  creates_live_cohort: false;
  creates_live_authorization: false;
  mutates_rw1_or_rw1a_material: false;
  claims_rw1_conclusion: false;
  claims_general_benefit: false;
  claims_stage_7: false;
}

export interface CommissionedWorkMaterialBoundaryV01 {
  bounded: true;
  max_cases: 4;
  max_successor_arms_per_case: 4;
  max_episode_artifacts: 20;
  max_required_checks_per_case: 8;
  max_repository_files_per_case: 32;
  max_strings: 32_768;
  max_string_characters: 4_096;
  max_collection_entries: 32_768;
  max_report_bytes: 8_388_608;
  raw_prompt_included: false;
  raw_transcript_included: false;
  raw_terminal_output_included: false;
  raw_provider_output_included: false;
  hidden_reasoning_included: false;
  credential_or_secret_included: false;
  absolute_local_path_included: false;
  production_project_content_included: false;
  arbitrary_source_prose_in_report: false;
}

export interface CommissionedWorkFinalReportV01 {
  report_version: typeof COMMISSIONED_WORK_REPORT_VERSION_V01;
  report_id: string;
  evidence_class: "commissioned_controlled_work";
  family: CommissionedWorkFamilyManifestV01;
  training: CommissionedWorkTrainingResultV01;
  consolidation_candidate: CommissionedWorkConsolidationCandidateV01;
  holdout: CommissionedWorkHoldoutEvaluationV01;
  evidence_ladder_stages: readonly CommissionedWorkEvidenceLadderStageV01[];
  family_evidence_ladder: CommissionedWorkEvidenceLadderRowV01[];
  counts: {
    training_cases: 3;
    holdout_cases: 1;
    predecessor_episodes: 4;
    successor_episodes: 16;
    total_episode_artifacts: 20;
    independent_training_origins: 3;
    real_provider_calls: 0;
    model_calls: 0;
    external_network_calls: 0;
  };
  cleanup: {
    requested: true;
    report_claims_cleanup_completion: false;
  };
  limitations: string[];
  material_boundary: CommissionedWorkMaterialBoundaryV01;
  authority_summary: CommissionedWorkAuthoritySummaryV01;
  integrity: CommissionedWorkIntegrityV01;
}

export interface CommissionedWorkArtifactIndexV01 {
  index_version: typeof COMMISSIONED_WORK_ARTIFACT_INDEX_VERSION_V01;
  family_id: string;
  report_fingerprint: string;
  candidate_fingerprint: string;
  run_label: string;
  append_only: true;
  complete_frozen_slots: true;
  expected_artifact_count: number;
  artifacts: Array<{
    slot_kind:
      | "family_manifest"
      | "training_result"
      | "episode"
      | "consolidation_candidate"
      | "holdout_evaluation"
      | "final_report";
    record_ref: CommissionedWorkRecordRefV01;
    artifact_version: string;
    case_id: string | null;
    episode_id: string | null;
    condition: CommissionedWorkConditionV01 | null;
    holdout_variant: CommissionedWorkHoldoutVariantV01 | null;
    relative_path: string;
    content_fingerprint: string;
  }>;
  raw_prompt_persisted: false;
  raw_transcript_persisted: false;
  hidden_reasoning_persisted: false;
  credential_or_secret_persisted: false;
  absolute_local_path_persisted: false;
  production_project_content_persisted: false;
  writes_outside_cw1_root: false;
  product_database_writes: 0;
  core_writes: 0;
  proposal_writes: 0;
  review_decision_writes: 0;
  transition_writes: 0;
  policy_activations: 0;
  integrity: CommissionedWorkIntegrityV01;
}
