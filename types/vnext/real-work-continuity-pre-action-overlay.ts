import type {
  REAL_WORK_CONTINUITY_BENEFIT_PILOT_VERSION_V01,
  RealWorkPilotAuthorityBoundaryV01,
  RealWorkPilotConditionV01,
  RealWorkPilotTaskFamilyV01,
  RealWorkPilotWorkIdentityV01,
} from "@/types/vnext/real-work-continuity-benefit-pilot";

export const REAL_WORK_CONTINUITY_PRE_ACTION_OVERLAY_VERSION_V01 =
  "real_work_continuity_pre_action_overlay.v0.1" as const;

export const REAL_WORK_CONTINUITY_PRE_ACTION_OVERLAY_ARTIFACT_VERSION_V01 =
  "real_work_continuity_pre_action_overlay_artifact.v0.1" as const;

export const REAL_WORK_CONTINUITY_PRE_ACTION_OVERLAY_REPORT_VERSION_V01 =
  "real_work_continuity_pre_action_overlay_report.v0.1" as const;

export type RealWorkPreActionWorkDomainV01 =
  | "software_engineering"
  | "research_synthesis"
  | "long_form_writing"
  | "general_planning"
  | "design_context_maintenance"
  | "investigation_open_ended"
  | "data_analysis_modeling"
  | "operational_casework"
  | "learning_skill_development"
  | "long_running_selection_procurement"
  | "mixed"
  | "other_bounded"
  | "unknown";

export type RealWorkPreActionWorkPhaseV01 =
  | "orientation"
  | "exploration"
  | "convergence"
  | "production"
  | "validation_review"
  | "closure_handoff"
  | "mixed_or_unknown";

export type RealWorkPreActionClassificationBasisV01 =
  | "user_declared"
  | "source_artifact_bound"
  | "bounded_reviewer"
  | "unknown";

export type RealWorkPreActionSourceCurrentnessV01 =
  | "exact"
  | "stale"
  | "partial"
  | "unknown";

export type RealWorkPreActionC1RetrievalV01 =
  | "exact"
  | "unavailable"
  | "not_applicable"
  | "unknown";

export type RealWorkPreActionSnapshotPresentedV01 =
  | "yes"
  | "no"
  | "not_applicable"
  | "unknown";

export type RealWorkPreActionPresentationTargetV01 =
  | "user"
  | "acting_host"
  | "both"
  | "not_applicable"
  | "unknown";

export type RealWorkPreActionPresentationChannelV01 =
  | "exact_tool_projection"
  | "host_context"
  | "user_supplied"
  | "other_bounded"
  | "not_applicable"
  | "unknown";

export type RealWorkPreActionAmbientOverlapV01 =
  | "exact_same_snapshot"
  | "source_bound_material_overlap"
  | "semantic_overlap_candidate"
  | "none_observed"
  | "unknown";

export type RealWorkPreActionTimingBasisV01 =
  | "user_attested_before_action"
  | "acting_host_attested_before_action"
  | "bounded_pre_action_source_record";

export type RealWorkPreActionExposureObservationBasisV01 =
  | "direct_observation"
  | "user_declared"
  | "acting_host_declared"
  | "bounded_source_record"
  | "not_applicable"
  | "unknown";

export type RealWorkPreActionConditionIntegrityV01 =
  | "valid_for_comparison"
  | "confounded"
  | "continuity_unavailable"
  | "source_currentness_invalid"
  | "exposure_unknown";

export type RealWorkPreActionTaskMixDiagnosticLabelV01 =
  | "observed_overlap"
  | "partial_overlap"
  | "no_observed_overlap"
  | "unknown";

export interface RealWorkContinuityPreActionOverlayInputV01 {
  pilot_id: string;
  episode_id: string;
  freeze_fingerprint: string;
  workspace_id: string;
  project_id: string;
  work_id: string;
  task_family: RealWorkPilotTaskFamilyV01;
  condition: RealWorkPilotConditionV01;
  work_domain: RealWorkPreActionWorkDomainV01;
  work_domain_classification_basis: RealWorkPreActionClassificationBasisV01;
  work_phase: RealWorkPreActionWorkPhaseV01;
  work_phase_classification_basis: RealWorkPreActionClassificationBasisV01;
  source_currentness: RealWorkPreActionSourceCurrentnessV01;
  c1_retrieval: RealWorkPreActionC1RetrievalV01;
  evaluated_snapshot_presented: RealWorkPreActionSnapshotPresentedV01;
  retrieved_snapshot_fingerprint: string | null;
  presentation_target: RealWorkPreActionPresentationTargetV01;
  presentation_channel: RealWorkPreActionPresentationChannelV01;
  ambient_overlap: RealWorkPreActionAmbientOverlapV01;
  exposure_observation_basis: RealWorkPreActionExposureObservationBasisV01;
  observed_at: string;
  observed_before_first_meaningful_action: true;
  pre_action_timing_basis: RealWorkPreActionTimingBasisV01;
}

export interface RealWorkContinuityPreActionOverlayMethodBoundaryV01 {
  actually_used_inferred: false;
  attention_inferred: false;
  causal_contribution_inferred: false;
  helpfulness_inferred: false;
  cognitive_effect_inferred: false;
  causal_task_matching_claim: false;
  statistical_equivalence_claim: false;
  overlay_owned_provider_calls: 0;
  overlay_owned_model_calls: 0;
  overlay_owned_network_calls: 0;
  overlay_owned_github_calls: 0;
}

export interface RealWorkContinuityPreActionOverlayV01 {
  artifact_version: typeof REAL_WORK_CONTINUITY_PRE_ACTION_OVERLAY_ARTIFACT_VERSION_V01;
  artifact_kind: "pre_action_condition_integrity_overlay";
  overlay_version: typeof REAL_WORK_CONTINUITY_PRE_ACTION_OVERLAY_VERSION_V01;
  pilot_version: typeof REAL_WORK_CONTINUITY_BENEFIT_PILOT_VERSION_V01;
  pilot_id: string;
  episode_id: string;
  freeze_fingerprint: string;
  work_identity: RealWorkPilotWorkIdentityV01;
  task_family: RealWorkPilotTaskFamilyV01;
  condition: RealWorkPilotConditionV01;
  work_domain: RealWorkPreActionWorkDomainV01;
  work_domain_classification_basis: RealWorkPreActionClassificationBasisV01;
  work_phase: RealWorkPreActionWorkPhaseV01;
  work_phase_classification_basis: RealWorkPreActionClassificationBasisV01;
  source_currentness: RealWorkPreActionSourceCurrentnessV01;
  c1_retrieval: RealWorkPreActionC1RetrievalV01;
  evaluated_snapshot_presented: RealWorkPreActionSnapshotPresentedV01;
  retrieved_snapshot_fingerprint: string | null;
  presentation_target: RealWorkPreActionPresentationTargetV01;
  presentation_channel: RealWorkPreActionPresentationChannelV01;
  ambient_overlap: RealWorkPreActionAmbientOverlapV01;
  exposure_observation_basis: RealWorkPreActionExposureObservationBasisV01;
  observed_at: string;
  observed_before_first_meaningful_action: true;
  pre_action_timing_basis: RealWorkPreActionTimingBasisV01;
  condition_integrity: RealWorkPreActionConditionIntegrityV01;
  authority: RealWorkPilotAuthorityBoundaryV01;
  method: RealWorkContinuityPreActionOverlayMethodBoundaryV01;
  integrity: {
    algorithm: "sha256";
    fingerprint_scope: "pre_action_overlay_without_integrity";
    fingerprint: string;
  };
}

export interface RealWorkPreActionTaskMixDiagnosticV01 {
  label: RealWorkPreActionTaskMixDiagnosticLabelV01;
  valid_authentic_episode_count: {
    B0: number;
    C1: number;
  };
  valid_authentic_episode_ids: {
    B0: string[];
    C1: string[];
  };
  work_domains: {
    B0: RealWorkPreActionWorkDomainV01[];
    C1: RealWorkPreActionWorkDomainV01[];
    overlap: RealWorkPreActionWorkDomainV01[];
  };
  work_phases: {
    B0: RealWorkPreActionWorkPhaseV01[];
    C1: RealWorkPreActionWorkPhaseV01[];
    overlap: RealWorkPreActionWorkPhaseV01[];
  };
  work_contexts: {
    B0: string[];
    C1: string[];
    overlap: string[];
  };
  limitations: string[];
  causal_comparability_claim: false;
  statistical_equivalence_claim: false;
}

export interface RealWorkContinuityPreActionOverlayReportV01 {
  report_version: typeof REAL_WORK_CONTINUITY_PRE_ACTION_OVERLAY_REPORT_VERSION_V01;
  overlay_version: typeof REAL_WORK_CONTINUITY_PRE_ACTION_OVERLAY_VERSION_V01;
  pilot_version: typeof REAL_WORK_CONTINUITY_BENEFIT_PILOT_VERSION_V01;
  pilot_id: string;
  workspace_id: string;
  project_id: string;
  generated_at: string;
  overlay_coverage: Record<
    "authentic_real_work" | "synthetic_test_only",
    {
      frozen_episode_count: number;
      overlay_count: number;
      missing_overlay_episode_ids: string[];
    }
  >;
  domain_coverage: Record<
    "authentic_real_work" | "synthetic_test_only",
    Record<RealWorkPreActionWorkDomainV01, number>
  >;
  phase_coverage: Record<
    "authentic_real_work" | "synthetic_test_only",
    Record<RealWorkPreActionWorkPhaseV01, number>
  >;
  classification_basis_missingness: Record<
    "authentic_real_work" | "synthetic_test_only",
    {
      work_domain_unknown_basis: number;
      work_phase_unknown_basis: number;
    }
  >;
  condition_integrity_counts_by_condition: Record<
    "authentic_real_work" | "synthetic_test_only",
    Record<
      RealWorkPilotConditionV01,
      Record<RealWorkPreActionConditionIntegrityV01, number>
    >
  >;
  episode_ids_by_validity_state: Record<
    "authentic_real_work" | "synthetic_test_only",
    Record<RealWorkPreActionConditionIntegrityV01, string[]>
  >;
  presentation_target_coverage: Record<
    "authentic_real_work" | "synthetic_test_only",
    Record<RealWorkPreActionPresentationTargetV01, number>
  >;
  presentation_channel_coverage: Record<
    "authentic_real_work" | "synthetic_test_only",
    Record<RealWorkPreActionPresentationChannelV01, number>
  >;
  ambient_overlap_counts: Record<
    "authentic_real_work" | "synthetic_test_only",
    Record<RealWorkPreActionAmbientOverlapV01, number>
  >;
  task_mix_diagnostic: Record<
    RealWorkPilotTaskFamilyV01,
    RealWorkPreActionTaskMixDiagnosticV01
  >;
  limitations_and_confounds: string[];
  core_rw1_report_or_disposition_rewrite: false;
  authority: RealWorkPilotAuthorityBoundaryV01;
  method: RealWorkContinuityPreActionOverlayMethodBoundaryV01;
  integrity: {
    algorithm: "sha256";
    fingerprint_scope: "pre_action_overlay_report_without_integrity";
    fingerprint: string;
  };
}
