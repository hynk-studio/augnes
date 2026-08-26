export const WORK_CONTINUITY_STATE_FRAME_VERSION_V01 =
  "work_continuity_state_frame.v0.1" as const;
export const CONTINUITY_DYNAMICS_DIGEST_VERSION_V01 =
  "continuity_dynamics_digest.v0.1" as const;
export const CONTINUITY_DYNAMICS_CANONICALIZATION_V01 =
  "augnes-json-c14n-v0_1" as const;
export const CONTINUITY_DYNAMICS_MAX_FRAMES_V01 = 5 as const;
export const CONTINUITY_DYNAMICS_MAX_SOURCE_BINDINGS_V01 = 64 as const;
export const CONTINUITY_DYNAMICS_MAX_TEXT_CHARACTERS_V01 = 2000 as const;

export type WorkContinuityFrameBoundaryKindV01 =
  | "context_use_review_recorded"
  | "semantic_transition_later_packet";

export type ContinuityDynamicsWindowKindV01 =
  | "current_only"
  | "recent_3"
  | "recent_5"
  | "since_last_transition";

export type ContinuityDynamicsStatusV01 =
  | "current_only"
  | "converging"
  | "diverging"
  | "stalled"
  | "volatile"
  | "regime_shift"
  | "insufficient";

export type ContinuityDimensionAvailabilityV01 =
  | "complete"
  | "partial"
  | "unavailable";

export interface ContinuityDynamicsIntegrityV01 {
  algorithm: "sha256";
  canonicalization: typeof CONTINUITY_DYNAMICS_CANONICALIZATION_V01;
  fingerprint_scope: "object_without_integrity_fingerprint";
  fingerprint: string;
}

export interface ContinuityDynamicsSourceBindingV01 {
  source_kind:
    | "task_context_packet"
    | "run_receipt"
    | "context_use_review"
    | "state_transition_receipt"
    | "context_use_attribution_projection"
    | "personal_perspective_shadow_projection"
    | "personal_perspective_paired_evaluation";
  source_id: string;
  source_fingerprint: string;
  source_timestamp: string | null;
}

export interface ContinuityDynamicsTransitionBindingV01 {
  transition_receipt_id: string;
  transition_receipt_fingerprint: string;
  applied_at: string;
  recorded_at: string;
}

export interface WorkContinuityFrameBoundaryV01 {
  kind: WorkContinuityFrameBoundaryKindV01;
  boundary_timestamp: string;
  boundary_source: ContinuityDynamicsSourceBindingV01;
  semantic_discontinuity: ContinuityDynamicsTransitionBindingV01 | null;
  caller_timestamp_used: false;
}

export interface ContinuityDimensionCompletenessV01 {
  status: ContinuityDimensionAvailabilityV01;
  missing: string[];
  limitations: string[];
}

export interface VerificationResolutionObservationV01 {
  passed_count: number;
  failed_count: number;
  blocked_count: number;
  skipped_count: number;
  unknown_count: number;
  unresolved_required_check_count: number;
  required_check_count: number;
  execution_completed_is_semantic_success: false;
}

export interface VerificationResolutionDimensionV01 {
  dimension: "verification_resolution";
  comparison_rule: "unresolved_required_checks_monotonic_v0.1";
  source_bindings: ContinuityDynamicsSourceBindingV01[];
  observation: VerificationResolutionObservationV01 | null;
  completeness: ContinuityDimensionCompletenessV01;
}

export interface BlockingFrictionObservationV01 {
  unresolved_count: number;
  blocker_classes: string[];
  blocker_count: number;
  gap_count: number;
  failed_required_check_count: number;
  blocked_required_check_count: number;
  skipped_required_check_count: number;
  unknown_required_check_count: number;
}

export interface BlockingFrictionDimensionV01 {
  dimension: "blocking_friction";
  comparison_rule: "unresolved_friction_and_new_classes_v0.1";
  source_bindings: ContinuityDynamicsSourceBindingV01[];
  observation: BlockingFrictionObservationV01 | null;
  completeness: ContinuityDimensionCompletenessV01;
}

export interface ContextEvidenceQualityObservationV01 {
  selected_item_count: number;
  presentation_known_count: number;
  exact_reference_count: number;
  unknown_actual_use_count: number;
  unknown_support_count: number;
  unknown_outcome_count: number;
  unknown_causal_count: number;
  known_evidence_lane_count: number;
  unknown_evidence_lane_count: number;
  packet_level_assessment: string;
  packet_level_assessment_is_item_judgment: false;
}

export interface ContextEvidenceQualityDimensionV01 {
  dimension: "context_evidence_quality";
  comparison_rule: "known_lanes_up_unknown_lanes_down_v0.1";
  source_bindings: ContinuityDynamicsSourceBindingV01[];
  observation: ContextEvidenceQualityObservationV01 | null;
  completeness: ContinuityDimensionCompletenessV01;
}

export interface ContextSelectionPressureObservationV01 {
  baseline_selected_count: number;
  shadow_selected_count: number;
  baseline_only_count: number;
  shadow_only_count: number;
  budget_excluded_count: number;
  duplicate_candidate_count: number;
  duplicate_selected_identity_count: number;
  candidate_completeness: "complete" | "partial";
  stop_reason: string;
  critical_omission_candidate_count: number;
  selection_difference_is_omission_harm: false;
  critical_omission_candidate_is_causal: false;
}

export interface ContextSelectionPressureDimensionV01 {
  dimension: "context_selection_pressure";
  comparison_rule: "exact_counts_no_direction_v0.1";
  source_bindings: ContinuityDynamicsSourceBindingV01[];
  observation: ContextSelectionPressureObservationV01 | null;
  completeness: ContinuityDimensionCompletenessV01;
}

export interface ReviewDecisionBurdenObservationV01 {
  correction_count: number;
  wrong_context_correction_count: number | null;
  repeated_explanation_estimate: number | null;
  missing_critical_context_count: number | null;
  review_assessment: string;
  subjective_burden_inferred: false;
}

export interface ReviewDecisionBurdenDimensionV01 {
  dimension: "review_decision_burden";
  comparison_rule: "exact_counts_no_direction_v0.1";
  source_bindings: ContinuityDynamicsSourceBindingV01[];
  observation: ReviewDecisionBurdenObservationV01 | null;
  completeness: ContinuityDimensionCompletenessV01;
}

export interface CostOperabilityDimensionV01 {
  dimension: "cost_operability";
  comparison_rule: "no_comparable_basis_v0.1";
  source_bindings: ContinuityDynamicsSourceBindingV01[];
  observation: null;
  completeness: ContinuityDimensionCompletenessV01;
}

export interface WorkContinuityFrameDimensionsV01 {
  verification_resolution: VerificationResolutionDimensionV01;
  blocking_friction: BlockingFrictionDimensionV01;
  context_evidence_quality: ContextEvidenceQualityDimensionV01;
  context_selection_pressure: ContextSelectionPressureDimensionV01;
  review_decision_burden: ReviewDecisionBurdenDimensionV01;
  cost_operability: CostOperabilityDimensionV01;
}

export interface ContinuityDynamicsMaterialBoundaryV01 {
  bounded: true;
  max_frames: typeof CONTINUITY_DYNAMICS_MAX_FRAMES_V01;
  max_source_bindings: typeof CONTINUITY_DYNAMICS_MAX_SOURCE_BINDINGS_V01;
  max_text_characters: typeof CONTINUITY_DYNAMICS_MAX_TEXT_CHARACTERS_V01;
  raw_prompt_included: false;
  raw_transcript_included: false;
  raw_terminal_output_included: false;
  raw_provider_output_included: false;
  hidden_reasoning_included: false;
  credential_or_secret_included: false;
  absolute_local_path_included: false;
}

export interface ContinuityDynamicsAuthoritySummaryV01 {
  is_canonical_core_record: false;
  is_semantic_state: false;
  is_evidence: false;
  is_policy: false;
  is_proposal: false;
  is_review_decision: false;
  is_transition: false;
  is_context_selector: false;
  writes_database: false;
  mutates_source_records: false;
  mutates_task_context_packet: false;
  selects_context: false;
  activates_policy: false;
  authorizes_execution: false;
  authorizes_provider_calls: false;
  authorizes_network_use: false;
  authorizes_external_actuation: false;
  authorizes_github_mutation: false;
  authorizes_publication: false;
  authorizes_merge: false;
  predicts_work_success: false;
  creates_global_health_score: false;
  notes: string[];
}

export interface WorkContinuityStateFrameV01 {
  frame_version: typeof WORK_CONTINUITY_STATE_FRAME_VERSION_V01;
  frame_id: string;
  frame_kind: "derived_rebuildable_read_only_observation";
  workspace_id: string;
  project_id: string;
  boundary: WorkContinuityFrameBoundaryV01;
  source_bindings: ContinuityDynamicsSourceBindingV01[];
  source_completeness: {
    status: "complete" | "partial";
    missing: string[];
    chronology: "exact_boundary_order_only";
    intermediate_chronology_proven: false;
    fabricated_historical_frames: false;
  };
  dimensions: WorkContinuityFrameDimensionsV01;
  material_boundary: ContinuityDynamicsMaterialBoundaryV01;
  authority_summary: ContinuityDynamicsAuthoritySummaryV01;
  integrity: ContinuityDynamicsIntegrityV01;
}

export interface ContinuityDimensionStepV01 {
  from_frame_id: string;
  to_frame_id: string;
  direction:
    | "improving"
    | "worsening"
    | "unchanged"
    | "mixed"
    | "not_comparable";
  exact_basis: string;
}

export interface ContinuityDimensionDynamicsV01 {
  dimension: keyof WorkContinuityFrameDimensionsV01;
  status: ContinuityDynamicsStatusV01;
  comparison_rule: string;
  step_comparisons: ContinuityDimensionStepV01[];
  completeness: ContinuityDimensionCompletenessV01;
  limitations: string[];
}

export interface ContinuityDynamicsDigestV01 {
  digest_version: typeof CONTINUITY_DYNAMICS_DIGEST_VERSION_V01;
  digest_id: string;
  digest_kind: "derived_rebuildable_read_only_dimension_vector";
  workspace_id: string;
  project_id: string;
  window: {
    kind: ContinuityDynamicsWindowKindV01;
    max_frames: 1 | 3 | 5;
    input_frame_count: number;
    selected_frame_count: number;
    truncated_to_bound: boolean;
    earlier_history_not_scanned: true;
    since_last_transition:
      | "not_applicable"
      | "found_in_bounded_input"
      | "not_found_in_bounded_input";
  };
  ordered_frames: Array<{
    frame_id: string;
    frame_fingerprint: string;
    boundary_kind: WorkContinuityFrameBoundaryKindV01;
    boundary_timestamp: string;
  }>;
  start_boundary: WorkContinuityFrameBoundaryV01;
  end_boundary: WorkContinuityFrameBoundaryV01;
  dynamics: {
    verification_resolution: ContinuityDimensionDynamicsV01;
    blocking_friction: ContinuityDimensionDynamicsV01;
    context_evidence_quality: ContinuityDimensionDynamicsV01;
    context_selection_pressure: ContinuityDimensionDynamicsV01;
    review_decision_burden: ContinuityDimensionDynamicsV01;
    cost_operability: ContinuityDimensionDynamicsV01;
  };
  warnings: string[];
  completeness: {
    status: "complete" | "partial";
    missing_frame_or_material_warnings: string[];
    intermediate_chronology_interpolated: false;
  };
  scalar_aggregate_created: false;
  material_boundary: ContinuityDynamicsMaterialBoundaryV01;
  authority_summary: ContinuityDynamicsAuthoritySummaryV01;
  integrity: ContinuityDynamicsIntegrityV01;
}
