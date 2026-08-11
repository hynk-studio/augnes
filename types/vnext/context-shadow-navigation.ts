import type { ContextUseAttributionRowV01 } from "./context-use-attribution-projection";
import type { ExternalRefV01 } from "./external-ref";
import type {
  PersonalPerspectiveContextCandidateScopeV01,
  PersonalPerspectiveContextSelectionV01,
  PersonalPerspectiveEffectiveScopeV01,
} from "./project-controls";
import type {
  TaskContextPacketExcludedEntryV01,
  TaskContextPacketSelectedEntryV01,
} from "./task-context-packet";

export const PERSONAL_PERSPECTIVE_CANDIDATE_SNAPSHOT_VERSION_V01 =
  "personal_perspective_candidate_snapshot.v0.1" as const;
export const PERSONAL_PERSPECTIVE_SHADOW_NAVIGATION_VERSION_V01 =
  "personal_perspective_shadow_navigation.v0.1" as const;
export const PERSONAL_PERSPECTIVE_SHADOW_COMPARISON_VERSION_V01 =
  "personal_perspective_shadow_comparison.v0.1" as const;
export const PERSONAL_PERSPECTIVE_SHADOW_PROJECTION_VERSION_V01 =
  "personal_perspective_shadow_projection.v0.1" as const;
export const PERSONAL_PERSPECTIVE_PAIRED_EVALUATION_VERSION_V01 =
  "personal_perspective_paired_evaluation.v0.1" as const;
export const PERSONAL_PERSPECTIVE_SHADOW_POLICY_VERSION_V01 =
  "personal_perspective_baseline_prefix_budget.v0.1" as const;
export const PERSONAL_PERSPECTIVE_SHADOW_SELECTOR_SEAM_V01 =
  "selectPersonalPerspectiveContextV01" as const;
export const PERSONAL_PERSPECTIVE_SHADOW_MAX_CANDIDATES_V01 = 128 as const;

export interface ContextShadowPacketBindingV01 {
  packet_version: "task_context_packet.v0.1";
  packet_id: string;
  packet_fingerprint: string;
}

export interface ContextShadowIntegrityV01 {
  algorithm: "sha256";
  canonicalization: "augnes-json-c14n-v0_1";
  fingerprint_scope: "object_without_integrity_fingerprint";
  fingerprint: string;
}

export interface ContextShadowAuthoritySummaryV01 {
  is_canonical_core_record: false;
  is_task_context_packet: false;
  is_memory: false;
  is_evidence: false;
  is_policy: false;
  is_proposal: false;
  is_review_decision: false;
  is_transition: false;
  writes_database: false;
  mutates_source_records: false;
  mutates_task_context_packet: false;
  selects_product_context: false;
  activates_policy: false;
  authorizes_execution: false;
  authorizes_provider_calls: false;
  authorizes_network_use: false;
  authorizes_external_actuation: false;
  authorizes_github_mutation: false;
  authorizes_publication: false;
  authorizes_merge: false;
  notes: string[];
}

export interface ContextShadowMaterialBoundaryV01 {
  bounded: true;
  max_candidates: typeof PERSONAL_PERSPECTIVE_SHADOW_MAX_CANDIDATES_V01;
  raw_prompt_included: false;
  raw_transcript_included: false;
  raw_terminal_output_included: false;
  raw_provider_output_included: false;
  hidden_reasoning_included: false;
  credential_or_secret_included: false;
  absolute_local_path_included: false;
}

export type PersonalPerspectiveCandidateBaselineDispositionV01 =
  | "selected"
  | "excluded";

export interface PersonalPerspectiveCandidateSnapshotRowV01 {
  candidate_id: string;
  candidate_fingerprint: string;
  candidate_scope: PersonalPerspectiveContextCandidateScopeV01;
  review_status: "reviewed" | "unreviewed" | "contested" | "retracted";
  trust_policy_status: "eligible" | "ineligible";
  entry_id: string;
  entry_kind: TaskContextPacketSelectedEntryV01["entry_kind"];
  source_ref: string | null;
  external_ref: ExternalRefV01 | null;
  currentness_status: TaskContextPacketSelectedEntryV01["currentness"]["status"];
  currentness_source_ref: ExternalRefV01 | null;
  trust_class: TaskContextPacketSelectedEntryV01["trust_class"];
  compatibility_source_ref: ExternalRefV01 | null;
  baseline_disposition: PersonalPerspectiveCandidateBaselineDispositionV01;
  baseline_exclusion_reason: string | null;
}

export interface PersonalPerspectiveCandidateSnapshotV01 {
  snapshot_version: typeof PERSONAL_PERSPECTIVE_CANDIDATE_SNAPSHOT_VERSION_V01;
  snapshot_id: string;
  workspace_id: string;
  project_id: string;
  effective_scope: PersonalPerspectiveEffectiveScopeV01;
  effective_scope_fingerprint: string;
  scope_lineage_ref: ExternalRefV01 | null;
  selector_seam: typeof PERSONAL_PERSPECTIVE_SHADOW_SELECTOR_SEAM_V01;
  selector_version: PersonalPerspectiveContextSelectionV01["context_selection_version"];
  candidate_set_fingerprint: string;
  collection: {
    bounded: true;
    max_candidates: typeof PERSONAL_PERSPECTIVE_SHADOW_MAX_CANDIDATES_V01;
    input_candidate_count: number;
    unique_candidate_count: number;
    duplicate_candidate_count: number;
    truncated: false;
  };
  source_completeness: {
    status: "complete" | "partial";
    candidate_source: "exact_pre_outcome_input" | "not_collected_scope_excluded";
    missing: string[];
  };
  candidates: PersonalPerspectiveCandidateSnapshotRowV01[];
  authority_summary: ContextShadowAuthoritySummaryV01;
  integrity: ContextShadowIntegrityV01;
}

export interface PersonalPerspectiveBaselineSelectionBindingV01 {
  baseline_result_id: string;
  baseline_result_fingerprint: string;
  packet: ContextShadowPacketBindingV01;
  selection: PersonalPerspectiveContextSelectionV01;
}

export interface PersonalPerspectiveShadowSelectedRowV01 {
  baseline_selected_order: number;
  entry: TaskContextPacketSelectedEntryV01;
}

export interface PersonalPerspectiveShadowExcludedRowV01 {
  exclusion_kind: "baseline_hard_exclusion" | "shadow_budget";
  baseline_selected_order: number | null;
  entry: TaskContextPacketExcludedEntryV01;
}

export type PersonalPerspectiveShadowStopReasonV01 =
  | "scope_excluded"
  | "no_eligible_material"
  | "max_shadow_selected_reached"
  | "candidates_exhausted";

export interface PersonalPerspectiveShadowNavigationResultV01 {
  shadow_result_version: typeof PERSONAL_PERSPECTIVE_SHADOW_NAVIGATION_VERSION_V01;
  shadow_result_id: string;
  workspace_id: string;
  project_id: string;
  candidate_snapshot_id: string;
  candidate_snapshot_fingerprint: string;
  baseline_result_id: string;
  baseline_result_fingerprint: string;
  policy_version: typeof PERSONAL_PERSPECTIVE_SHADOW_POLICY_VERSION_V01;
  policy_kind: "strict_subset_of_baseline_eligible_in_baseline_order";
  max_shadow_selected: number;
  selected: PersonalPerspectiveShadowSelectedRowV01[];
  excluded: PersonalPerspectiveShadowExcludedRowV01[];
  budget: {
    eligible_available: number;
    selected_count: number;
    budget_excluded_count: number;
    remaining_capacity: number;
  };
  stop_reason: PersonalPerspectiveShadowStopReasonV01;
  completeness: {
    status: "complete" | "partial";
    missing: string[];
  };
  authority_summary: ContextShadowAuthoritySummaryV01;
  integrity: ContextShadowIntegrityV01;
}

export interface PersonalPerspectiveShadowComparisonV01 {
  comparison_version: typeof PERSONAL_PERSPECTIVE_SHADOW_COMPARISON_VERSION_V01;
  comparison_id: string;
  candidate_snapshot_fingerprint: string;
  baseline_result_fingerprint: string;
  shadow_result_fingerprint: string;
  overlap: TaskContextPacketSelectedEntryV01[];
  baseline_only: TaskContextPacketSelectedEntryV01[];
  shadow_only: TaskContextPacketSelectedEntryV01[];
  exclusion_reason_deltas: Array<{
    entry_id: string;
    baseline_reason: string | null;
    shadow_reason: string;
  }>;
  duplicate_indicators: {
    exact_duplicate_candidate_count: number;
    duplicate_selected_identity_count: number;
  };
  budget: PersonalPerspectiveShadowNavigationResultV01["budget"];
  stop_reason: PersonalPerspectiveShadowStopReasonV01;
  source_completeness: PersonalPerspectiveCandidateSnapshotV01["source_completeness"];
  limitations: string[];
  authority_summary: ContextShadowAuthoritySummaryV01;
  integrity: ContextShadowIntegrityV01;
}

export interface PersonalPerspectiveShadowProjectionV01 {
  projection_version: typeof PERSONAL_PERSPECTIVE_SHADOW_PROJECTION_VERSION_V01;
  projection_id: string;
  projection_kind: "derived_rebuildable_pre_outcome_research_output";
  workspace_id: string;
  project_id: string;
  temporal_boundary: "candidate_and_baseline_frozen_before_later_evidence";
  candidate_snapshot: PersonalPerspectiveCandidateSnapshotV01;
  baseline: PersonalPerspectiveBaselineSelectionBindingV01;
  shadow: PersonalPerspectiveShadowNavigationResultV01;
  comparison: PersonalPerspectiveShadowComparisonV01;
  frozen_identity: {
    candidate_snapshot_fingerprint: string;
    baseline_result_fingerprint: string;
    shadow_result_fingerprint: string;
    comparison_fingerprint: string;
    frozen_pair_fingerprint: string;
  };
  material_boundary: ContextShadowMaterialBoundaryV01;
  authority_summary: ContextShadowAuthoritySummaryV01;
  integrity: ContextShadowIntegrityV01;
}

export type PersonalPerspectivePairedComparisonLaneV01 =
  | "overlap"
  | "baseline_only"
  | "shadow_only";

export interface PersonalPerspectivePairedEvaluationRowV01 {
  comparison_lane: PersonalPerspectivePairedComparisonLaneV01;
  entry_id: string;
  attribution: Pick<
    ContextUseAttributionRowV01,
    | "presentation"
    | "actual_use"
    | "citation_or_reference"
    | "support_validation"
    | "outcome_association"
    | "causal_contribution"
    | "limitations"
  >;
  critical_omission_candidate: boolean;
  critical_omission_candidate_rule:
    | "baseline_only_exact_reference_non_causal_v0.1"
    | null;
  limitations: string[];
}

export interface PersonalPerspectivePairedEvaluationV01 {
  evaluation_version: typeof PERSONAL_PERSPECTIVE_PAIRED_EVALUATION_VERSION_V01;
  evaluation_id: string;
  evaluation_kind: "derived_rebuildable_later_paired_research_output";
  workspace_id: string;
  project_id: string;
  pre_outcome_shadow: {
    projection_id: string;
    projection_fingerprint: string;
    frozen_pair_fingerprint: string;
  };
  later_context_use_attribution: {
    projection_id: string;
    projection_fingerprint: string;
    review_id: string;
    packet: ContextShadowPacketBindingV01;
  };
  rows: PersonalPerspectivePairedEvaluationRowV01[];
  summary: {
    overlap_count: number;
    baseline_only_count: number;
    shadow_only_count: number;
    selected_count_delta: number;
    critical_omission_candidate_count: number;
    attribution_missing_lanes: string[];
    attribution_coverage: "partial";
  };
  hindsight_boundary: {
    frozen_shadow_unchanged: true;
    later_evidence_used_for_selection: false;
    later_evidence_scope: "evaluation_only";
  };
  limitations: string[];
  authority_summary: ContextShadowAuthoritySummaryV01;
  integrity: ContextShadowIntegrityV01;
}
