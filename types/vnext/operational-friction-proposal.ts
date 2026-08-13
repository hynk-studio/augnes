import type {
  EpisodeDeltaProposalDeltaTypeV01,
  EpisodeDeltaProposalOperationV01,
} from "./episode-delta-proposal";
import type { ExternalRefV01 } from "./external-ref";

export const OPERATIONAL_FRICTION_PROPOSAL_PROFILE_VERSION_V01 =
  "operational_friction_proposal_profile.v0.1" as const;
export const OPERATIONAL_FRICTION_DERIVATION_RULE_VERSION_V01 =
  "operational_friction_derivation.v0.1" as const;
export const OPERATIONAL_FRICTION_SOURCE_BUNDLE_VERSION_V01 =
  "operational_friction_source_bundle.v0.1" as const;
export const OPERATIONAL_FRICTION_CANONICALIZATION_V01 =
  "augnes-json-c14n-v0_1" as const;
export const OPERATIONAL_FRICTION_MAX_OBSERVATIONS_V01 = 64 as const;
export const OPERATIONAL_FRICTION_MAX_CANDIDATES_V01 = 32 as const;

export const OPERATIONAL_FRICTION_CODES_V01 = [
  "critical_context_omission_candidate",
  "source_currentness_unknown",
  "verification_preparation_missing",
  "blocking_friction_non_converging",
  "wrong_context_correction_observed",
  "packet_level_review_stale",
  "packet_level_review_misleading",
  "packet_level_review_missing",
  "packet_level_review_noisy",
] as const;

export const OPERATIONAL_FRICTION_UNAVAILABLE_LANES_V01 = [
  "repeated_explanation",
  "task_granularity_mismatch",
  "tool_surface_mismatch",
  "excessive_review_burden",
  "item_level_helpfulness",
  "item_level_harm",
  "causal_contribution",
  "cost_operability_direction",
  "model_provider_superiority",
  "policy_benefit",
] as const;

export type OperationalFrictionCodeV01 =
  (typeof OPERATIONAL_FRICTION_CODES_V01)[number];
export type OperationalFrictionUnavailableLaneCodeV01 =
  (typeof OPERATIONAL_FRICTION_UNAVAILABLE_LANES_V01)[number];

export type OperationalFrictionSourceKindV01 =
  | "context_use_attribution_projection"
  | "personal_perspective_paired_evaluation"
  | "continuity_dynamics_digest"
  | "work_continuity_state_frame";

export interface OperationalFrictionSourceBindingV01 {
  source_kind: OperationalFrictionSourceKindV01;
  source_version: string;
  source_id: string;
  source_fingerprint: string;
  source_timestamp: string | null;
  source_timestamp_basis:
    | "exact_boundary_timestamp"
    | "not_serialized_by_source_contract";
}

export interface OperationalFrictionPacketReviewBindingV01 {
  packet_version: "task_context_packet.v0.1";
  packet_id: string;
  packet_fingerprint: string;
  review_version: "context_use_review.v0.1";
  review_id: string;
  review_fingerprint: string;
}

export interface OperationalFrictionSourceBundleV01 {
  bundle_version: typeof OPERATIONAL_FRICTION_SOURCE_BUNDLE_VERSION_V01;
  bundle_id: string;
  bundle_fingerprint: string;
  workspace_id: string;
  project_id: string;
  attribution: OperationalFrictionSourceBindingV01;
  paired_evaluation: OperationalFrictionSourceBindingV01;
  dynamics_digest: OperationalFrictionSourceBindingV01;
  ordered_frames: OperationalFrictionSourceBindingV01[];
  packet_review_binding: OperationalFrictionPacketReviewBindingV01;
  start_boundary_timestamp: string;
  end_boundary_timestamp: string;
  chronology: "exact_digest_order_no_interpolation";
  caller_timestamp_used: false;
}

export type OperationalFrictionOperationDomainV01 =
  | "context_validation"
  | "source_currentness_validation"
  | "verification_preparation"
  | "continuity_friction_validation"
  | "context_correction_preparation"
  | "packet_review_validation";

export type OperationalFrictionTargetClassV01 =
  | "bounded_validation_hypothesis"
  | "bounded_research_hypothesis"
  | "bounded_agent_plan_hypothesis";

export type OperationalFrictionEpistemicStatusV01 =
  | "exact_source_observation"
  | "bounded_non_causal_candidate";

export interface OperationalFrictionObservationV01 {
  observation_id: string;
  friction_code: OperationalFrictionCodeV01;
  scope:
    | "paired_evaluation_basis_set"
    | "attribution_rows"
    | "current_end_frame"
    | "bounded_dynamics_window"
    | "packet_level_episode_review_only";
  operation_domain: OperationalFrictionOperationDomainV01;
  epistemic_status: OperationalFrictionEpistemicStatusV01;
  derivation_rule_id: string;
  derivation_rule_version: typeof OPERATIONAL_FRICTION_DERIVATION_RULE_VERSION_V01;
  source_refs: ExternalRefV01[];
  attribution_row_ids: string[];
  paired_evaluation_entry_ids: string[];
  frame_ids: string[];
  digest_refs: ExternalRefV01[];
  exact_count: number | null;
  exact_count_basis: string | null;
  causal_contribution: false;
  item_level_credit_or_blame: false;
  uncertainties: string[];
  limitations: string[];
}

export interface OperationalFrictionUnavailableLaneV01 {
  lane_code: OperationalFrictionUnavailableLaneCodeV01;
  status: "unavailable" | "unsupported";
  source_refs: ExternalRefV01[];
  basis: string;
  false_zero_emitted: false;
}

export interface OperationalFrictionCandidateBindingV01 {
  candidate_id: string;
  candidate_fingerprint: string;
  delta_family: Extract<
    EpisodeDeltaProposalDeltaTypeV01,
    "research_delta" | "validation_delta" | "agent_plan_delta"
  >;
  operation: Extract<EpisodeDeltaProposalOperationV01, "unknown">;
  operation_domain: OperationalFrictionOperationDomainV01;
  target_class: OperationalFrictionTargetClassV01;
  basis_observation_ids: string[];
  review_required: true;
  proposal_only: true;
  activation_owner: null;
  semantic_state_target_present: false;
}

export interface OperationalFrictionAuthoritySummaryV01 {
  authoritative: false;
  is_evidence: false;
  is_causal_diagnosis: false;
  is_review_decision: false;
  is_state_transition_receipt: false;
  is_semantic_state: false;
  is_operational_policy: false;
  proposal_only: true;
  activates_policy: false;
  policy_activation_owner_present: false;
  semantic_transition_eligible: false;
  mutates_task_context_packet: false;
  mutates_memory: false;
  mutates_perspective: false;
  writes_database: false;
  creates_core_record: false;
  authorizes_execution: false;
  authorizes_scheduling: false;
  authorizes_retry: false;
  authorizes_routing: false;
  authorizes_context_selection: false;
  authorizes_provider_calls: false;
  authorizes_network_use: false;
  authorizes_external_effects: false;
  authorizes_github_mutation: false;
  authorizes_publication: false;
  authorizes_merge: false;
}

export interface OperationalFrictionProposalProfileIntegrityV01 {
  algorithm: "sha256";
  canonicalization: typeof OPERATIONAL_FRICTION_CANONICALIZATION_V01;
  fingerprint_scope: "profile_without_integrity_fingerprint";
  fingerprint: string;
}

export interface OperationalFrictionProposalProfileV01 {
  profile_version: typeof OPERATIONAL_FRICTION_PROPOSAL_PROFILE_VERSION_V01;
  profile_id: string;
  profile_kind: "derived_rebuildable_proposal_only_material";
  workspace_id: string;
  project_id: string;
  created_at: string;
  source_bundle: OperationalFrictionSourceBundleV01;
  derivation_rule_version: typeof OPERATIONAL_FRICTION_DERIVATION_RULE_VERSION_V01;
  observations: OperationalFrictionObservationV01[];
  unavailable_lanes: OperationalFrictionUnavailableLaneV01[];
  candidate_bindings: OperationalFrictionCandidateBindingV01[];
  source_coverage: "complete" | "partial";
  source_currentness: "fresh" | "partial" | "unknown";
  uncertainties: string[];
  limitations: string[];
  proposal_only_status: "proposal_only";
  policy_activation_owner: null;
  serialized_validation_scope: "projection_internal_only_upstream_sources_required_for_relation_proof";
  authority_summary: OperationalFrictionAuthoritySummaryV01;
  integrity: OperationalFrictionProposalProfileIntegrityV01;
}

export interface OperationalFrictionProposalValidationIssueV01 {
  severity: "error" | "warning";
  code: string;
  path: string | null;
  message: string;
}

export interface OperationalFrictionProposalValidationResultV01 {
  status: "valid" | "invalid" | "blocked";
  normalized_profile_version:
    | typeof OPERATIONAL_FRICTION_PROPOSAL_PROFILE_VERSION_V01
    | null;
  errors: OperationalFrictionProposalValidationIssueV01[];
  warnings: OperationalFrictionProposalValidationIssueV01[];
}
