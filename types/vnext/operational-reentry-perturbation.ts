export const OPERATIONAL_REENTRY_PERTURBATION_SOURCE_VERSION_V01 =
  "operational_reentry_perturbation_source.v0.1" as const;
export const OPERATIONAL_REENTRY_PERTURBATION_ARM_VERSION_V01 =
  "operational_reentry_perturbation_arm.v0.1" as const;
export const OPERATIONAL_REENTRY_PERTURBATION_EVALUATION_VERSION_V01 =
  "operational_reentry_perturbation_evaluation.v0.1" as const;

export type OperationalReentryArmRoleV01 =
  | "exact_reentry"
  | "matched_single_item_ablation"
  | "stale_or_regime_shift_reset"
  | "existing_one_run_baseline";

export const OPERATIONAL_REENTRY_ARM_ROLE_ORDER_V01 = Object.freeze([
  "exact_reentry",
  "matched_single_item_ablation",
  "stale_or_regime_shift_reset",
  "existing_one_run_baseline",
] as const satisfies readonly OperationalReentryArmRoleV01[]);

export type OperationalReentryEvidenceClassV01 =
  | "deterministic_fixture_execution"
  | "synthetic_source_observation"
  | "unobserved";

export type OperationalReentryConditioningRelationV01 =
  | "reference_only"
  | "structured_delta_observed"
  | "no_structured_delta_observed"
  | "unknown"
  | "not_comparable";

export type OperationalReentryResetRelationV01 =
  | "appropriate_reset_observed"
  | "stale_persistence_candidate"
  | "unknown"
  | "not_comparable";

export interface OperationalReentryIntegrityV01 {
  algorithm: "sha256";
  canonicalization: "augnes-json-c14n-v0_1";
  fingerprint_scope: string;
  fingerprint: string;
}

export interface OperationalReentryRecordRefV01 {
  record_version: string;
  record_id: string;
  record_fingerprint: string;
}

export interface OperationalReentryTaskFrameV01 {
  goal: string;
  success_criteria: string[];
  non_goals: string[];
  required_checks: string[];
  forbidden_actions: string[];
  data_classification: string;
  task_family_key: string;
}

export interface OperationalReentryRepositoryFrameV01 {
  frozen_head_commit: string;
  initial_worktree_content_fingerprint: string;
  construction_cutoff: string;
  observation_cutoff: string;
  observation_cutoff_policy: "fixed_predeclared_cutoff";
  platform: string;
  deterministic_adapter_identity: string;
  capability_version: string;
  capability_coverage: string[];
  operation_approval_policy_fingerprint: string;
  verification_owner_set_fingerprint: string;
  equal_ceiling_fingerprint: string;
  equal_budget_is_equal_capability: false;
}

export interface OperationalReentryTargetBindingV01 {
  packet_entry_id: string;
  packet_entry_kind: "source_ref";
  external_ref: {
    ref_version: "external_ref.v0.1";
    ref_type: "operational_friction_candidate";
    external_id: string;
    trust_class: "derived_interpretation";
    observed_at: string;
    source_ref: string;
    compatibility_namespace: "operational_context_selection.v0.1";
  };
  currentness: {
    status: "fresh";
    as_of: string;
  };
  candidate: OperationalReentryRecordRefV01;
  selection: OperationalReentryRecordRefV01;
  materialization: OperationalReentryRecordRefV01;
  admission: OperationalReentryRecordRefV01;
  packet_a: OperationalReentryRecordRefV01;
  packet_b: OperationalReentryRecordRefV01;
  lineage_run_receipt: OperationalReentryRecordRefV01;
  attribution_projection: OperationalReentryRecordRefV01;
  attribution_row: {
    presentation: "yes";
    citation_or_reference: "referenced";
    actual_use: "unknown";
    support_validation: "unknown";
    outcome_association: "unknown";
    causal_contribution: "unknown";
    selected_by_exact_packet_and_admission_relation: true;
    proposal_only: true;
    semantic_transition_eligible: false;
    item_level_credit_or_blame: false;
  };
}

export interface OperationalReentryStage5TruthV01 {
  continuation_worked_end_to_end: true;
  exact_target_delivered_and_referenced: true;
  item_actual_use: "unknown";
  support_validation: "unknown";
  outcome_association: "unknown";
  causal_contribution: "unknown";
  item_actual_use_proven_count: 0;
  support_validated_count: 0;
  outcome_associated_count: 0;
  causally_supported_count: 0;
  exact_case_status: "inconclusive";
  bundle_credit_assigned: false;
}

export interface OperationalReentrySourceV01 {
  source_version: typeof OPERATIONAL_REENTRY_PERTURBATION_SOURCE_VERSION_V01;
  source_id: string;
  source_kind: "exact_rebuilt_merged_stage5_public_safe_case";
  merged_stage5_baseline_commit: string;
  workspace_id: string;
  project_id: string;
  work_id: string;
  work_fingerprint: string;
  evaluation_case_id: string;
  frozen_source_case: OperationalReentryRecordRefV01;
  parent_comparison_source_case: OperationalReentryRecordRefV01;
  task: OperationalReentryTaskFrameV01;
  repository: OperationalReentryRepositoryFrameV01;
  target: OperationalReentryTargetBindingV01;
  packet_b_entry_ids: string[];
  packet_b_entry_fingerprints: string[];
  non_target_packet_entry_ids: string[];
  non_target_packet_entry_fingerprints: string[];
  non_target_downstream_input_fingerprints: string[];
  selected_target_count: 1;
  target_disposition: "selected_effective_accept";
  target_is_bundle: false;
  target_budget_excluded: false;
  target_unresolved: false;
  continuation_hop: 1;
  second_continuation_hop_present: false;
  baseline: {
    workspace_id: string;
    project_id: string;
    work_id: string;
    work_fingerprint: string;
    evaluation_case_id: string;
    binding_kind: "exact_rebuilt_operational_comparison_one_run_semantics";
    parent_comparison_source_case: OperationalReentryRecordRefV01;
    equal_ceiling_fingerprint: string;
    scope_is_rebuilt_isolated_semantics: true;
    run_count: 1;
    resume_used: false;
    operational_continuation_present: false;
    packet_b_present: false;
    continuation_admission_present: false;
    post_cutoff_candidate_material_present: false;
  };
  stage5_truth: OperationalReentryStage5TruthV01;
  data_is_synthetic_public_safe: true;
  material_boundary: OperationalReentryMaterialBoundaryV01;
  integrity: OperationalReentryIntegrityV01;
}

export interface OperationalReentryDownstreamVectorV01 {
  referenced_source_ids: string[];
  required_check_dispositions: Array<{
    check_id: string;
    disposition: "passed" | "failed" | "blocked" | "skipped" | "unknown";
  }>;
  operation_action_classes: string[];
  blocker_warning_gap_classes: string[];
  changed_artifacts: Array<{
    artifact_id: string;
    before_hash: string | null;
    after_hash: string | null;
  }>;
  result_limitations: string[];
  response_status:
    | "continued"
    | "withheld"
    | "refused"
    | "abstained"
    | "neutral_current_source_selected"
    | "unobserved";
}

export interface OperationalReentryStaleRelationV01 {
  reason_kind: "stale" | "contradicted" | "superseded" | "regime_inapplicable";
  target_entry_id: string;
  source_ref: string;
  reason_observed_at: string;
  applies_before_outcome: true;
  regime_key: string;
  current_source_ref: string | null;
}

export interface OperationalReentryArmV01 {
  arm_version: typeof OPERATIONAL_REENTRY_PERTURBATION_ARM_VERSION_V01;
  arm_id: string;
  role: OperationalReentryArmRoleV01;
  evidence_class: OperationalReentryEvidenceClassV01;
  source_id: string;
  source_fingerprint: string;
  workspace_id: string;
  project_id: string;
  work_id: string;
  evaluation_case_id: string;
  task: OperationalReentryTaskFrameV01;
  repository: OperationalReentryRepositoryFrameV01;
  target_entry_ids: string[];
  packet_entry_ids: string[];
  packet_entry_fingerprints: string[];
  non_target_downstream_input_fingerprints: string[];
  target_lineage: OperationalReentryTargetBindingV01 | null;
  downstream: OperationalReentryDownstreamVectorV01;
  stale_relation: OperationalReentryStaleRelationV01 | null;
  post_cutoff_material_present: false;
  provider_calls: 0;
  model_calls: 0;
  network_calls: 0;
  product_admission_used: false;
  product_state_mutated: false;
  integrity: OperationalReentryIntegrityV01;
}

export type OperationalReentryParityDimensionV01 =
  | "task_goal"
  | "success_criteria"
  | "non_goals"
  | "required_checks"
  | "forbidden_actions"
  | "data_classification"
  | "task_family_identity"
  | "frozen_repository_head"
  | "initial_worktree_content"
  | "construction_cutoff"
  | "observation_cutoff_policy"
  | "platform"
  | "deterministic_adapter_identity"
  | "capability_version_and_coverage"
  | "operation_approval_policy"
  | "verification_owner_set"
  | "declared_equal_ceiling"
  | "non_target_packet_entries"
  | "non_target_downstream_inputs";

export interface OperationalReentryParityRowV01 {
  dimension: OperationalReentryParityDimensionV01;
  status: "equal" | "not_comparable";
  exact_reentry_fingerprint: string;
  ablation_fingerprint: string;
}

export interface OperationalReentryAuthorityV01 {
  is_canonical_core_record: false;
  is_evidence: false;
  is_proposal: false;
  is_review_decision: false;
  is_transition: false;
  is_policy: false;
  is_context_selector: false;
  is_execution_plan: false;
  writes_database: false;
  mutates_source_records: false;
  mutates_task_context_packet: false;
  mutates_semantic_state: false;
  authorizes_execution: false;
  authorizes_provider_calls: false;
  authorizes_network_use: false;
  authorizes_external_actuation: false;
  authorizes_github_mutation: false;
  authorizes_publication: false;
  authorizes_merge: false;
  claims_actual_use: false;
  claims_support_validation: false;
  claims_outcome_association: false;
  claims_causal_contribution: false;
  claims_general_benefit: false;
  creates_scalar_fitness: false;
  creates_global_winner: false;
  promotes_target_or_policy: false;
  activates_reset_or_fallback: false;
}

export interface OperationalReentryMaterialBoundaryV01 {
  bounded: true;
  max_text_characters: 2000;
  max_collection_items: 128;
  raw_prompt_included: false;
  raw_transcript_included: false;
  raw_terminal_output_included: false;
  raw_provider_output_included: false;
  hidden_reasoning_included: false;
  credential_or_secret_included: false;
  private_absolute_path_included: false;
  post_cutoff_material_included: false;
}

export interface OperationalReentryEvaluationV01 {
  evaluation_version: typeof OPERATIONAL_REENTRY_PERTURBATION_EVALUATION_VERSION_V01;
  evaluation_id: string;
  evaluation_kind: "pure_rebuildable_single_target_non_authoritative";
  source: OperationalReentrySourceV01;
  arms: OperationalReentryArmV01[];
  exact_reentry_ablation_parity: OperationalReentryParityRowV01[];
  single_target_intervention: {
    target_entry_id: string;
    exact_reentry_target_present: true;
    ablation_target_present: false;
    removed_entry_ids: string[];
    introduced_entry_ids: [];
    non_target_material_equal: boolean;
    only_intended_difference_is_target_presence: boolean;
    direct_conditioning_comparable: boolean;
  };
  stale_regime_relation: {
    target_identity_preserved: boolean;
    explicit_source_bound_pre_outcome_reason: boolean;
    comparable: boolean;
  };
  conditioning_relation: OperationalReentryConditioningRelationV01;
  conditioning_basis: string;
  reset_relation: OperationalReentryResetRelationV01;
  reset_basis: string;
  evidence_ladder: {
    availability: "exact";
    reference: "exact" | "not_observed";
    conditioning_candidate: OperationalReentryConditioningRelationV01;
    support_validation: "unknown";
    outcome_association: "unknown";
    causal_contribution: "unknown";
    reset_behavior: OperationalReentryResetRelationV01;
  };
  evidence_class: "deterministic_fixture_execution";
  deterministic_mechanics_only: true;
  real_provider_or_model_evidence: false;
  empirical_general_benefit_observed: false;
  no_bundle_credit_or_blame: true;
  limitations: string[];
  missing_evidence: string[];
  material_boundary: OperationalReentryMaterialBoundaryV01;
  authority_summary: OperationalReentryAuthorityV01;
  integrity: OperationalReentryIntegrityV01;
}

export interface OperationalReentryValidationResultV01 {
  status: "valid" | "blocked";
  errors: Array<{ code: string; path: string }>;
}
