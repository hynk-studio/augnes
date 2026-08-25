import type {
  CODEX_CURRENT_CONTINUITY_ROUTE_MARKER_V01,
  CODEX_CURRENT_CONTINUITY_VERSION_V01,
} from "@/types/vnext/codex-current-continuity";

export const REAL_WORK_CONTINUITY_BENEFIT_PILOT_VERSION_V01 =
  "real_work_continuity_benefit_pilot.v0.1" as const;

export const REAL_WORK_CONTINUITY_BENEFIT_PILOT_ARTIFACT_VERSION_V01 =
  "real_work_continuity_benefit_pilot_artifact.v0.1" as const;

export const REAL_WORK_CONTINUITY_BENEFIT_PILOT_REPORT_VERSION_V01 =
  "real_work_continuity_benefit_pilot_report.v0.1" as const;

export type RealWorkPilotTaskFamilyV01 = "resume" | "verify" | "decide";
export type RealWorkPilotConditionV01 = "B0" | "C1";
export type RealWorkPilotAuthenticityV01 =
  | "authentic_real_work"
  | "synthetic_test_only";

export type RealWorkPilotLaterOutcomeLabelV01 =
  | "helpful"
  | "neutral"
  | "misleading"
  | "harmful_transfer_candidate"
  | "insufficient_unknown";

export type RealWorkPilotDispositionV01 =
  | "positive_signal_candidate"
  | "mixed_or_family_specific"
  | "burden_dominant_candidate"
  | "harm_signal_candidate"
  | "insufficient_real_work";

export type RealWorkPilotSourceRefKindV01 =
  | "git_revision"
  | "repository_path"
  | "task_context_packet"
  | "run_receipt"
  | "continuity_snapshot"
  | "manual_handoff"
  | "direct_observation"
  | "later_review_material"
  | "other_bounded";

export interface RealWorkPilotSourceRefV01 {
  ref_kind: RealWorkPilotSourceRefKindV01;
  ref: string;
  fingerprint: string;
  revision: string | null;
}

export interface RealWorkPilotWorkIdentityV01 {
  workspace_id: string;
  project_id: string;
  work_id: string;
  identity_fingerprint: string;
}

export interface RealWorkPilotBaselineMaterialIdentityV01 {
  material_kind: "direct_host_manual_handoff";
  material_ref: string;
  material_fingerprint: string;
  normal_user_task_text_allowed: true;
  direct_source_inspection_allowed: true;
  ordinary_host_capabilities_allowed: true;
  safety_or_authority_critical_material_withheld: false;
  evaluated_c1_projection_included: false;
}

export interface RealWorkPilotC1OwnerV01 {
  projection_version: typeof CODEX_CURRENT_CONTINUITY_VERSION_V01;
  route_marker: typeof CODEX_CURRENT_CONTINUITY_ROUTE_MARKER_V01;
  producer: "lib/vnext/codex-current-continuity/codex-current-continuity.ts#readCodexCurrentContinuityV01";
  consumer: "apps/augnes_apps/scripts/codex-current-continuity.ts#fetchCurrentContinuity";
}

export interface RealWorkPilotContinuityMaterialIdentityV01 {
  material_kind: "codex_current_continuity_projection";
  owner: RealWorkPilotC1OwnerV01;
  source_status: "exact";
  snapshot_status: "exact";
  snapshot_binding: string;
  material_ref: string;
  material_fingerprint: string;
  automatic_injection: false;
  hidden_or_unreviewed_material: false;
  policy_injection: false;
}

export interface RealWorkPilotAuthorityBoundaryV01 {
  writes_product_or_core_database: false;
  creates_core_record: false;
  creates_evidence: false;
  creates_proposal: false;
  creates_review_decision: false;
  creates_or_applies_transition: false;
  creates_or_activates_policy: false;
  creates_stage_7_behavior: false;
  changes_context_selection_or_injection: false;
  calls_provider_or_model: false;
  calls_network: false;
  calls_github: false;
  grants_semantic_authority: false;
  grants_execution_authority: false;
  grants_external_effect_authority: false;
  grants_merge_or_promotion_authority: false;
}

export interface RealWorkPilotMethodBoundaryV01 {
  model_as_judge: false;
  scalar_fitness: false;
  rank: false;
  winner: false;
  adaptive_assignment: false;
  causal_contribution_from_presence_or_reference: false;
  harness_owned_real_provider_calls: 0;
  harness_owned_network_calls: 0;
}

export interface RealWorkPilotEpisodeFreezeInputV01 {
  authenticity: RealWorkPilotAuthenticityV01;
  task_family: RealWorkPilotTaskFamilyV01;
  family_episode_index: 1 | 2 | 3 | 4;
  workspace_id: string;
  project_id: string;
  work_id: string;
  source_refs: RealWorkPilotSourceRefV01[];
  natural_task_goal: string;
  success_or_verification_criteria: string[];
  known_constraints: string[];
  baseline_material: RealWorkPilotBaselineMaterialIdentityV01;
  continuity_material: RealWorkPilotContinuityMaterialIdentityV01 | null;
  freeze_timestamp: string;
  outcome_known_at_freeze: false;
}

export interface RealWorkPilotEpisodeFreezeV01 {
  artifact_version: typeof REAL_WORK_CONTINUITY_BENEFIT_PILOT_ARTIFACT_VERSION_V01;
  artifact_kind: "pre_outcome_episode_freeze";
  pilot_version: typeof REAL_WORK_CONTINUITY_BENEFIT_PILOT_VERSION_V01;
  pilot_id: string;
  episode_id: string;
  authenticity: RealWorkPilotAuthenticityV01;
  task_family: RealWorkPilotTaskFamilyV01;
  family_episode_index: 1 | 2 | 3 | 4;
  condition: RealWorkPilotConditionV01;
  work_identity: RealWorkPilotWorkIdentityV01;
  source_refs: RealWorkPilotSourceRefV01[];
  source_frame_fingerprint: string;
  natural_task_goal: string;
  success_or_verification_criteria: string[];
  known_constraints: string[];
  baseline_material: RealWorkPilotBaselineMaterialIdentityV01;
  continuity_material: RealWorkPilotContinuityMaterialIdentityV01 | null;
  freeze_timestamp: string;
  outcome_known_at_freeze: false;
  authority: RealWorkPilotAuthorityBoundaryV01;
  method: RealWorkPilotMethodBoundaryV01;
  integrity: {
    algorithm: "sha256";
    fingerprint_scope: "episode_freeze_without_integrity";
    fingerprint: string;
  };
}

export type RealWorkPilotMeasureKeyV01 =
  | "resume_time_to_first_correct_action_ms"
  | "resume_steps_to_first_correct_action"
  | "resume_repeated_explanation_count"
  | "resume_wrong_context_correction_count"
  | "resume_missing_critical_context_count"
  | "resume_stale_context_direction_error"
  | "resume_unnecessary_review_context_burden_steps"
  | "resume_first_meaningful_action_later_confirmed_correct"
  | "verify_required_checks_identified_count"
  | "verify_required_checks_completed_count"
  | "verify_source_lineage_refs_required_count"
  | "verify_source_lineage_refs_covered_count"
  | "verify_skipped_required_checks_count"
  | "verify_false_success"
  | "verify_contradiction_or_staleness_detected"
  | "verify_unsupported_claim_corrected_or_refused"
  | "verify_later_reversal_missing_or_misclassified_context"
  | "decide_time_to_material_decision_ms"
  | "decide_steps_to_material_decision"
  | "decide_review_turns_to_material_decision"
  | "decide_duplicate_candidate_count"
  | "decide_irrelevant_candidate_count"
  | "decide_missing_context_correction_count"
  | "decide_later_correction_or_reversal"
  | "decide_source_candidate_decision_traceability_preserved"
  | "decide_uncertainty_opposition_falsifier_preserved"
  | "decide_recommendation_assessment_boundary_integrity"
  | "cross_manual_interventions_count"
  | "cross_additional_review_steps"
  | "cross_tool_calls_from_existing_safe_receipts"
  | "cross_provider_calls_from_existing_safe_receipts"
  | "cross_latency_ms_from_exact_evidence"
  | "cross_cost_microunits_from_exact_evidence"
  | "cross_privacy_egress_class"
  | "cross_stale_or_harmful_transfer"
  | "cross_misleading_confidence_or_false_attention"
  | "cross_authority_drift"
  | "cross_explanation_protocol_burden_steps";

export type RealWorkPilotObservationBasisV01 =
  | "direct_observation"
  | "bounded_human_review"
  | "existing_safe_receipt"
  | "later_source_linked_review";

export type RealWorkPilotPrivacyEgressClassV01 =
  | "local_only_no_egress"
  | "ordinary_host_egress"
  | "provider_egress_from_existing_receipt"
  | "privacy_expansion_candidate"
  | "unknown_egress";

export type RealWorkPilotMeasureValueV01 =
  | number
  | boolean
  | RealWorkPilotPrivacyEgressClassV01;

export type RealWorkPilotMeasureObservationV01 =
  | {
      status: "unknown";
      reason: string;
    }
  | {
      status: "observed";
      value: RealWorkPilotMeasureValueV01;
      basis: RealWorkPilotObservationBasisV01;
      source_refs: RealWorkPilotSourceRefV01[];
    };

export type RealWorkPilotMeasureSetV01 = Record<
  RealWorkPilotMeasureKeyV01,
  RealWorkPilotMeasureObservationV01
>;

export interface RealWorkPilotImmediateObservationInputV01 {
  episode_id: string;
  workspace_id: string;
  project_id: string;
  work_id: string;
  observed_at: string;
  measurements: Partial<RealWorkPilotMeasureSetV01>;
}

export interface RealWorkPilotImmediateObservationV01 {
  artifact_version: typeof REAL_WORK_CONTINUITY_BENEFIT_PILOT_ARTIFACT_VERSION_V01;
  artifact_kind: "immediate_bounded_observation";
  pilot_version: typeof REAL_WORK_CONTINUITY_BENEFIT_PILOT_VERSION_V01;
  pilot_id: string;
  episode_id: string;
  freeze_fingerprint: string;
  work_identity: RealWorkPilotWorkIdentityV01;
  task_family: RealWorkPilotTaskFamilyV01;
  condition: RealWorkPilotConditionV01;
  observed_at: string;
  measurements: RealWorkPilotMeasureSetV01;
  harness_owned_real_provider_calls: 0;
  harness_owned_network_calls: 0;
  authority: RealWorkPilotAuthorityBoundaryV01;
  integrity: {
    algorithm: "sha256";
    fingerprint_scope: "immediate_observation_without_integrity";
    fingerprint: string;
  };
}

export interface RealWorkPilotLaterOutcomeReviewInputV01 {
  episode_id: string;
  workspace_id: string;
  project_id: string;
  work_id: string;
  reviewed_at: string;
  label: RealWorkPilotLaterOutcomeLabelV01;
  source_refs: RealWorkPilotSourceRefV01[];
  later_measurements: Partial<RealWorkPilotMeasureSetV01>;
  limitations: string[];
}

export interface RealWorkPilotLaterOutcomeReviewV01 {
  artifact_version: typeof REAL_WORK_CONTINUITY_BENEFIT_PILOT_ARTIFACT_VERSION_V01;
  artifact_kind: "later_source_linked_outcome_review";
  pilot_version: typeof REAL_WORK_CONTINUITY_BENEFIT_PILOT_VERSION_V01;
  pilot_id: string;
  episode_id: string;
  freeze_fingerprint: string;
  immediate_observation_fingerprint: string;
  work_identity: RealWorkPilotWorkIdentityV01;
  task_family: RealWorkPilotTaskFamilyV01;
  condition: RealWorkPilotConditionV01;
  reviewed_at: string;
  label: RealWorkPilotLaterOutcomeLabelV01;
  source_refs: RealWorkPilotSourceRefV01[];
  later_measurements: Partial<RealWorkPilotMeasureSetV01>;
  limitations: string[];
  causal_contribution: "not_inferred_from_presence_or_reference";
  authority: RealWorkPilotAuthorityBoundaryV01;
  integrity: {
    algorithm: "sha256";
    fingerprint_scope: "later_outcome_review_without_integrity";
    fingerprint: string;
  };
}

export interface RealWorkPilotMeasureDistributionV01 {
  measure: RealWorkPilotMeasureKeyV01;
  B0: {
    observed_values: RealWorkPilotMeasureValueV01[];
    unknown_count: number;
  };
  C1: {
    observed_values: RealWorkPilotMeasureValueV01[];
    unknown_count: number;
  };
}

export interface RealWorkContinuityBenefitPilotReportV01 {
  report_version: typeof REAL_WORK_CONTINUITY_BENEFIT_PILOT_REPORT_VERSION_V01;
  pilot_version: typeof REAL_WORK_CONTINUITY_BENEFIT_PILOT_VERSION_V01;
  pilot_id: string;
  workspace_id: string;
  project_id: string;
  generated_at: string;
  schedule: {
    families: ["resume", "verify", "decide"];
    per_family: ["B0", "C1", "C1", "B0"];
    maximum_authentic_episodes: 12;
    adaptive_reassignment: false;
  };
  authentic_episode_count: number;
  synthetic_test_only_excluded_count: number;
  pilot_complete: boolean;
  counts_by_family_condition: Record<
    RealWorkPilotTaskFamilyV01,
    Record<RealWorkPilotConditionV01, number>
  >;
  stage_completeness: {
    frozen: number;
    immediate_observation: number;
    later_outcome_review: number;
    missing_immediate_episode_ids: string[];
    missing_later_review_episode_ids: string[];
  };
  measure_distributions: Record<
    RealWorkPilotTaskFamilyV01,
    RealWorkPilotMeasureDistributionV01[]
  >;
  burden: {
    manual_interventions: RealWorkPilotMeasureDistributionV01[];
    additional_review_steps: RealWorkPilotMeasureDistributionV01[];
    explanation_protocol_burden: RealWorkPilotMeasureDistributionV01[];
  };
  incidents: {
    harmful_or_stale_transfer_episode_ids: string[];
    misleading_confidence_or_false_attention_episode_ids: string[];
    authority_drift_episode_ids: string[];
    harmful_transfer_label_episode_ids: string[];
    misleading_label_episode_ids: string[];
  };
  later_labels_by_family_condition: Record<
    RealWorkPilotTaskFamilyV01,
    Record<
      RealWorkPilotConditionV01,
      Record<RealWorkPilotLaterOutcomeLabelV01, number>
    >
  >;
  family_specific_asymmetries: string[];
  baseline_comparison: {
    method: "bounded_descriptive_raw_distributions";
    significance_claim: false;
    scalar_score: false;
    global_winner: false;
    notes: string[];
  };
  disposition: RealWorkPilotDispositionV01;
  disposition_authority: "review_material_only";
  limitations_and_confounds: string[];
  harness_owned_real_provider_calls: 0;
  harness_owned_network_calls: 0;
  authority: RealWorkPilotAuthorityBoundaryV01;
  integrity: {
    algorithm: "sha256";
    fingerprint_scope: "pilot_report_without_integrity";
    fingerprint: string;
  };
}
