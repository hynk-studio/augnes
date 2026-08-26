import type {
  ContextUseReviewActuallyUsedV01,
  ContextUseReviewAssessmentV01,
  ContextUseReviewPresentedV01,
  ContextUseReviewUsageProvenanceV01,
} from "./context-use-review";
import type { ExternalRefTrustClassV01, ExternalRefV01 } from "./external-ref";
import type { TaskContextPacketCurrentnessV01 } from "./task-context-packet";

export const CONTEXT_USE_ATTRIBUTION_PROJECTION_VERSION_V01 =
  "context_use_attribution_projection.v0.1" as const;
export const CONTEXT_USE_ATTRIBUTION_PROJECTION_CANONICALIZATION_V01 =
  "augnes-json-c14n-v0_1" as const;
export const CONTEXT_USE_ATTRIBUTION_PROJECTION_MAX_ROWS_V01 = 128 as const;

export interface ContextUseAttributionReviewBindingV01 {
  review_version: "context_use_review.v0.1";
  review_id: string;
  review_fingerprint: string;
}

export interface ContextUseAttributionRunReceiptBindingV01 {
  receipt_version: "run_receipt.v0.1";
  receipt_id: string;
  receipt_fingerprint: string;
}

export interface ContextUseAttributionPacketBindingV01 {
  packet_version: "task_context_packet.v0.1";
  packet_id: string;
  packet_fingerprint: string;
}

export interface ContextUseAttributionTransitionBindingV01 {
  transition_receipt_version: "state_transition_receipt.v0.1";
  transition_receipt_id: string;
  transition_receipt_fingerprint: string;
}

export interface ContextUseAttributionOperationalContinuationBindingV01 {
  lineage_kind: "source_linked_operational_continuation";
  admission_version: "operational_continuation_admission.v0.1";
  admission_id: string;
  admission_fingerprint: string;
  materialization_id: string;
  materialization_fingerprint: string;
  selection_id: string;
  selection_fingerprint: string;
}

export interface ContextUseAttributionSourceChainV01 {
  prior_packet: ContextUseAttributionPacketBindingV01;
  source_transition_receipt?: ContextUseAttributionTransitionBindingV01;
  source_operational_continuation?: ContextUseAttributionOperationalContinuationBindingV01;
  relation_validation: "passed";
}

export interface ContextUseAttributionOperationalEntryBindingV01 {
  admission_id: string;
  admission_fingerprint: string;
  selection_id: string;
  selection_fingerprint: string;
  candidate_id: string;
  candidate_fingerprint: string;
  selected_by_exact_packet_and_admission_relation: true;
  proposal_only: true;
  semantic_transition_eligible: false;
  item_level_credit_or_blame: false;
}

export interface ContextUseAttributionEpisodeReviewContextV01 {
  scope: "packet_level_episode_review_only";
  presented: ContextUseReviewPresentedV01;
  actually_used: ContextUseReviewActuallyUsedV01;
  assessment: ContextUseReviewAssessmentV01;
  usage_provenance_status: "available" | "historical_missing";
  usage_provenance: ContextUseReviewUsageProvenanceV01 | null;
  item_level_judgment: false;
}

export interface ContextUseAttributionPresentationV01 {
  status: "yes" | "unknown";
  basis: "exact_packet_delivery" | "unknown";
  source_refs: ExternalRefV01[];
  unknown_reason: string | null;
}

export interface ContextUseAttributionActualUseV01 {
  status: "unknown";
  basis: "no_item_specific_relation";
  source_refs: ExternalRefV01[];
  unknown_reason: string;
}

export interface ContextUseAttributionCitationOrReferenceV01 {
  status: "referenced" | "unknown";
  basis: "exact_run_receipt_reference" | "unknown";
  source_refs: ExternalRefV01[];
  unknown_reason: string | null;
}

export interface ContextUseAttributionSupportValidationV01 {
  status: "unknown";
  basis: "no_exact_item_support_relation";
  source_refs: ExternalRefV01[];
  unknown_reason: string;
}

export interface ContextUseAttributionOutcomeAssociationV01 {
  status: "unknown";
  basis: "no_exact_item_outcome_relation";
  source_refs: ExternalRefV01[];
  unknown_reason: string;
}

export interface ContextUseAttributionCausalContributionV01 {
  status: "unknown";
  basis: "no_intervention_relation";
  intervention_refs: ExternalRefV01[];
  unknown_reason: string;
}

export interface ContextUseAttributionRowV01 {
  entry_id: string;
  entry_kind:
    | "accepted_state_ref"
    | "memory_ref"
    | "evidence_ref"
    | "claim_ref"
    | "artifact_ref"
    | "proof_ref"
    | "action_ref"
    | "legacy_state_key_ref"
    | "source_ref"
    | "work_ref"
    | "other_ref";
  source_ref: string | null;
  external_ref: ExternalRefV01 | null;
  compatibility_source_ref: ExternalRefV01 | null;
  why_included: string;
  bounded_summary: string | null;
  currentness: TaskContextPacketCurrentnessV01;
  trust_class: ExternalRefTrustClassV01;
  selected: true;
  presentation: ContextUseAttributionPresentationV01;
  actual_use: ContextUseAttributionActualUseV01;
  citation_or_reference: ContextUseAttributionCitationOrReferenceV01;
  support_validation: ContextUseAttributionSupportValidationV01;
  outcome_association: ContextUseAttributionOutcomeAssociationV01;
  causal_contribution: ContextUseAttributionCausalContributionV01;
  operational_continuation?: ContextUseAttributionOperationalEntryBindingV01;
  limitations: string[];
}

export type ContextUseAttributionMissingLaneV01 =
  | "item_presentation"
  | "item_actual_use"
  | "item_citation_or_reference"
  | "item_support_validation"
  | "item_outcome_association"
  | "item_causal_contribution";

export interface ContextUseAttributionCollectionV01 {
  bounded: true;
  max_rows: typeof CONTEXT_USE_ATTRIBUTION_PROJECTION_MAX_ROWS_V01;
  selected_entry_count: number;
  projected_row_count: number;
  truncated: false;
}

export interface ContextUseAttributionCompletenessV01 {
  status: "partial";
  missing_lanes: ContextUseAttributionMissingLaneV01[];
  historical_usage_provenance_missing: boolean;
}

export interface ContextUseAttributionMaterialBoundaryV01 {
  bounded_summaries_only: true;
  max_summary_characters: 2000;
  max_rows: typeof CONTEXT_USE_ATTRIBUTION_PROJECTION_MAX_ROWS_V01;
  max_refs_per_collection: 64;
  raw_prompt_included: false;
  raw_transcript_included: false;
  raw_terminal_output_included: false;
  raw_provider_output_included: false;
  hidden_reasoning_included: false;
  credential_or_secret_included: false;
  absolute_local_path_included: false;
}

export interface ContextUseAttributionAuthoritySummaryV01 {
  is_canonical_core_record: false;
  is_context_use_review: false;
  is_evidence: false;
  is_semantic_state: false;
  is_policy: false;
  is_proposal: false;
  is_review_decision: false;
  is_state_transition_receipt: false;
  writes_database: false;
  mutates_source_records: false;
  selects_context: false;
  creates_product_surface: false;
  authorizes_execution: false;
  authorizes_provider_calls: false;
  authorizes_network_use: false;
  authorizes_external_actuation: false;
  authorizes_github_mutation: false;
  authorizes_publication: false;
  authorizes_merge: false;
  notes: string[];
}

export interface ContextUseAttributionIntegrityV01 {
  algorithm: "sha256";
  canonicalization: typeof CONTEXT_USE_ATTRIBUTION_PROJECTION_CANONICALIZATION_V01;
  fingerprint_scope: "projection_without_integrity_fingerprint";
  fingerprint: string;
}

export interface ContextUseAttributionProjectionV01 {
  projection_version: typeof CONTEXT_USE_ATTRIBUTION_PROJECTION_VERSION_V01;
  projection_id: string;
  projection_kind: "derived_rebuildable_research_output";
  workspace_id: string;
  project_id: string;
  context_use_review: ContextUseAttributionReviewBindingV01;
  later_task_run_receipt: ContextUseAttributionRunReceiptBindingV01;
  later_task_context_packet: ContextUseAttributionPacketBindingV01;
  source_chain: ContextUseAttributionSourceChainV01;
  episode_review_context: ContextUseAttributionEpisodeReviewContextV01;
  collection: ContextUseAttributionCollectionV01;
  completeness: ContextUseAttributionCompletenessV01;
  rows: ContextUseAttributionRowV01[];
  material_boundary: ContextUseAttributionMaterialBoundaryV01;
  authority_summary: ContextUseAttributionAuthoritySummaryV01;
  integrity: ContextUseAttributionIntegrityV01;
}

export interface ContextUseAttributionValidationIssueV01 {
  severity: "error" | "warning";
  code: string;
  path: string | null;
  message: string;
}

export interface ContextUseAttributionValidationResultV01 {
  status: "valid" | "invalid" | "blocked";
  normalized_protocol_version:
    | typeof CONTEXT_USE_ATTRIBUTION_PROJECTION_VERSION_V01
    | null;
  errors: ContextUseAttributionValidationIssueV01[];
  warnings: ContextUseAttributionValidationIssueV01[];
}
