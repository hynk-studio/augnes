import type { CriterionAssessmentItemV01 } from "./criterion-assessment";
import type { ExternalRefTrustClassV01, ExternalRefV01 } from "./external-ref";
import type {
  ClaimApplicabilityScopeV01,
  ClaimEvidenceRelationKindV01,
  ClaimEvidenceRelationReferenceV01,
  ClaimEvidenceRelationV01,
  ClaimRecordReferenceV01,
  ClaimRecordV01,
  EvidenceRecordReferenceV01,
  EvidenceRecordV01,
} from "./project-verify-material";

export const PROJECT_VERIFY_RECONCILIATION_VERSION_V01 =
  "project_verify_reconciliation.v0.1" as const;
export const PROJECT_VERIFY_READ_MAX_IDENTIFIER_CHARACTERS_V01 = 256 as const;
export const PROJECT_VERIFY_RECONCILIATION_MAX_FAMILIES_V01 = 256 as const;
export const PROJECT_VERIFY_RECONCILIATION_MAX_REVISIONS_V01 = 256 as const;
export const PROJECT_VERIFY_RECONCILIATION_MAX_REFS_V01 = 256 as const;
export const PROJECT_VERIFY_RECONCILIATION_MAX_CONFLICTS_V01 = 256 as const;

export type ProjectVerifyExactProtocolKindV01 =
  | "task_context_packet"
  | "run_receipt"
  | "criterion_assessment"
  | "evidence_record"
  | "claim_record"
  | "claim_evidence_relation"
  | "episode_delta_proposal"
  | "episode_delta_proposal_candidate"
  | "review_decision"
  | "semantic_commit_gate"
  | "state_transition_receipt"
  | "semantic_state"
  | "semantic_target_head"
  | "context_use_review";

/**
 * A read-model ref never authenticates its source by itself. The source-bound
 * reader must have loaded and validated the exact canonical payload before it
 * emits this projection.
 */
export interface ProjectVerifyExactProtocolRefV01 {
  record_kind: ProjectVerifyExactProtocolKindV01;
  record_id: string;
  record_fingerprint: string;
}

export type ProjectVerifyReadCompletenessStatusV01 =
  "complete" | "partial" | "bounded_incomplete" | "conflict";

export interface ProjectVerifyReadCompletenessV01 {
  status: ProjectVerifyReadCompletenessStatusV01;
  returned_items: number;
  fixed_bound: number;
  continuation_cursor: string | null;
  omitted_reason: string | null;
}

export interface ProjectVerifyReconciliationBoundsV01 {
  max_families: typeof PROJECT_VERIFY_RECONCILIATION_MAX_FAMILIES_V01;
  max_revisions_per_family: typeof PROJECT_VERIFY_RECONCILIATION_MAX_REVISIONS_V01;
  max_refs_per_collection: typeof PROJECT_VERIFY_RECONCILIATION_MAX_REFS_V01;
  max_conflicts: typeof PROJECT_VERIFY_RECONCILIATION_MAX_CONFLICTS_V01;
}

export type ProjectVerifyConflictKindV01 =
  | "source"
  | "lineage"
  | "scope"
  | "trust"
  | "review_decision"
  | "semantic_commit_gate"
  | "transition"
  | "current_head"
  | "bounded_read";

export interface ProjectVerifyConflictV01 {
  conflict_kind: ProjectVerifyConflictKindV01;
  code: string;
  exact_refs: ProjectVerifyExactProtocolRefV01[];
  source_refs: ExternalRefV01[];
}

export interface ProjectVerifyReadAuthorityV01 {
  read_only: true;
  projection_is_rebuildable: true;
  writes_database: false;
  creates_evidence: false;
  accepts_evidence: false;
  creates_claim_or_relation: false;
  creates_proposal: false;
  creates_review_decision: false;
  authorizes_semantic_commit_gate: false;
  applies_transition: false;
  selects_current_head: false;
  establishes_truth: false;
  changes_semantic_state: false;
  changes_later_context: false;
  calls_model_or_provider: false;
  performs_network_or_external_action: false;
}

export type ProjectVerifyApplicabilityComparisonStatusV01 =
  "not_applicable" | "overlap" | "disjoint" | "unknown";

export type ProjectVerifyApplicabilityComparisonBasisV01 =
  | "constant_not_applicable"
  | "exact_scope_fingerprint"
  | "unbounded_temporal_scope"
  | "interval_overlap"
  | "interval_disjoint"
  | "touching_interval_endpoint"
  | "environment_identity_unknown"
  | "condition_identity_unknown"
  | "temporal_scope_invalid";

/** Subject identity is deliberately outside the temporal/scope helper. */
export interface ProjectVerifyApplicabilityComparisonV01 {
  status: ProjectVerifyApplicabilityComparisonStatusV01;
  basis: ProjectVerifyApplicabilityComparisonBasisV01;
  left_scope_fingerprint: string;
  right_scope_fingerprint: string;
  subjects_compared: false;
  caller_must_prove_exact_subject_identity: true;
}

export interface ProjectVerifyRecordedLayerV01 {
  recorded: true;
  latest_recorded_candidate: boolean;
  prior_record_ref:
    ClaimRecordReferenceV01 | ClaimEvidenceRelationReferenceV01 | null;
  operation_target_ref:
    ClaimRecordReferenceV01 | ClaimEvidenceRelationReferenceV01 | null;
}

export type ProjectVerifyReviewStatusV01 =
  "no_proposal" | "pending_review" | "reviewed" | "conflict";

export interface ProjectVerifyReviewLayerV01 {
  status: ProjectVerifyReviewStatusV01;
  proposal_ref: ProjectVerifyExactProtocolRefV01 | null;
  proposal_candidate_ref: ProjectVerifyExactProtocolRefV01 | null;
}

export type ProjectVerifyDecisionStatusV01 =
  | "no_decision"
  | "accepted"
  | "rejected"
  | "deferred"
  | "supersede_decision"
  | "retract_decision"
  | "conflict";

export interface ProjectVerifyDecisionLayerV01 {
  status: ProjectVerifyDecisionStatusV01;
  decision_ref: ProjectVerifyExactProtocolRefV01 | null;
}

export type ProjectVerifyGateStatusV01 =
  "no_gate" | "authorized" | "expired" | "source_conflict";

export interface ProjectVerifyGateLayerV01 {
  status: ProjectVerifyGateStatusV01;
  gate_ref: ProjectVerifyExactProtocolRefV01 | null;
}

export type ProjectVerifyTransitionStatusV01 =
  "no_transition" | "applied" | "transition_missing" | "source_conflict";

export interface ProjectVerifyTransitionLayerV01 {
  status: ProjectVerifyTransitionStatusV01;
  transition_receipt_ref: ProjectVerifyExactProtocolRefV01 | null;
  semantic_state_ref: ProjectVerifyExactProtocolRefV01 | null;
  semantic_target_head_ref: ProjectVerifyExactProtocolRefV01 | null;
}

export type ProjectVerifyApplicationStatusV01 =
  | "never_applied"
  | "previously_applied"
  | "applied_current"
  | "applied_superseded"
  | "applied_retracted"
  | "pending_later_candidate"
  | "conflict";

export interface ProjectVerifyApplicationLayerV01 {
  status: ProjectVerifyApplicationStatusV01;
  current_family_head: boolean;
  applied_at: string | null;
  ended_at: string | null;
}

export interface ProjectVerifyTruthLayerV01 {
  claim_truth: "not_established";
  relation_is_proof: false;
  evidence_acceptance: "not_established_by_reconciliation";
}

export interface ProjectVerifyRevisionLifecycleV01 {
  record: ProjectVerifyRecordedLayerV01;
  review: ProjectVerifyReviewLayerV01;
  decision: ProjectVerifyDecisionLayerV01;
  gate: ProjectVerifyGateLayerV01;
  transition: ProjectVerifyTransitionLayerV01;
  application: ProjectVerifyApplicationLayerV01;
  truth: ProjectVerifyTruthLayerV01;
  conflicts: ProjectVerifyConflictV01[];
}

export interface ProjectVerifyEvidenceProjectionV01 {
  evidence_ref: EvidenceRecordReferenceV01;
  evidence: EvidenceRecordV01;
  source_authentication:
    | { status: "verified"; authenticator_profile: string }
    | { status: "not_required"; authenticator_profile: null }
    | { status: "conflict"; authenticator_profile: string | null };
  trust_class: ExternalRefTrustClassV01;
  coverage: EvidenceRecordV01["coverage"];
  source_refs: ExternalRefV01[];
  limitations: string[];
  uncertainty: string[];
  acceptance_status: "not_accepted_by_record_existence";
}

export interface ProjectVerifyClaimRevisionProjectionV01 {
  claim_ref: ClaimRecordReferenceV01;
  claim: ClaimRecordV01;
  lifecycle: ProjectVerifyRevisionLifecycleV01;
}

export interface ProjectVerifyClaimFamilyProjectionV01 {
  claim_family_id: string;
  family_target_ref: ExternalRefV01;
  family_origin_fingerprint: string;
  applicability_scope_fingerprint: string;
  subject_refs: ExternalRefV01[];
  applicability_scope: ClaimApplicabilityScopeV01;
  revisions: ProjectVerifyClaimRevisionProjectionV01[];
  latest_recorded_candidate_ref: ClaimRecordReferenceV01 | null;
  applied_current_head_ref: ClaimRecordReferenceV01 | null;
  previously_applied_refs: ClaimRecordReferenceV01[];
  pending_revision_refs: ClaimRecordReferenceV01[];
  conflicts: ProjectVerifyConflictV01[];
  completeness: ProjectVerifyReadCompletenessV01;
}

export interface ProjectVerifyRelationRevisionProjectionV01 {
  relation_ref: ClaimEvidenceRelationReferenceV01;
  relation: ClaimEvidenceRelationV01;
  lifecycle: ProjectVerifyRevisionLifecycleV01;
}

export interface ProjectVerifyRelationFamilyProjectionV01 {
  relation_family_id: string;
  family_target_ref: ExternalRefV01;
  family_origin_fingerprint: string;
  applicability_scope_fingerprint: string;
  claim_ref: ClaimRecordReferenceV01;
  evidence_ref: EvidenceRecordReferenceV01;
  applicability_scope: ClaimApplicabilityScopeV01;
  revisions: ProjectVerifyRelationRevisionProjectionV01[];
  latest_recorded_candidate_ref: ClaimEvidenceRelationReferenceV01 | null;
  applied_current_head_ref: ClaimEvidenceRelationReferenceV01 | null;
  previously_applied_refs: ClaimEvidenceRelationReferenceV01[];
  pending_revision_refs: ClaimEvidenceRelationReferenceV01[];
  conflicts: ProjectVerifyConflictV01[];
  completeness: ProjectVerifyReadCompletenessV01;
}

export interface ProjectVerifyCriterionProjectionV01 {
  packet_ref: ProjectVerifyExactProtocolRefV01;
  receipt_ref: ProjectVerifyExactProtocolRefV01;
  assessment_ref: ProjectVerifyExactProtocolRefV01;
  criterion: CriterionAssessmentItemV01;
}

export interface ProjectVerifyRelationMaterialBucketsV01 {
  supports: ClaimEvidenceRelationReferenceV01[];
  opposes: ClaimEvidenceRelationReferenceV01[];
  contradicts: ClaimEvidenceRelationReferenceV01[];
  qualifies: ClaimEvidenceRelationReferenceV01[];
  contextualizes: ClaimEvidenceRelationReferenceV01[];
  insufficient: ClaimEvidenceRelationReferenceV01[];
}

export interface ProjectVerifyAppliedRelationMaterialV01 {
  relation_kind: ClaimEvidenceRelationKindV01;
  relation_ref: ClaimEvidenceRelationReferenceV01;
  claim_ref: ClaimRecordReferenceV01;
  evidence_ref: EvidenceRecordReferenceV01;
}

export interface ProjectVerifyApplicabilityGroupV01 {
  group_id: string;
  subject_refs: ExternalRefV01[];
  claim_family_ids: string[];
  pairwise_scope_comparisons: Array<{
    left_claim_family_id: string;
    right_claim_family_id: string;
    comparison: ProjectVerifyApplicabilityComparisonV01;
  }>;
  disposition:
    | "coexisting"
    | "disputed"
    | "unresolved_scope_overlap"
    | "scope_overlap_unknown"
    | "not_applicable";
  applied_relation_material: ProjectVerifyAppliedRelationMaterialV01[];
}

export interface ProjectVerifyLaterContextProjectionV01 {
  source_transition_receipt_ref: ProjectVerifyExactProtocolRefV01;
  later_packet_ref: ProjectVerifyExactProtocolRefV01 | null;
  context_use_review_ref: ProjectVerifyExactProtocolRefV01 | null;
  status:
    | "transition_applied_packet_pending"
    | "packet_compiled_feedback_pending"
    | "feedback_recorded"
    | "conflict";
}

export interface ProjectVerifyReconciliationSummaryV01 {
  support_present: boolean;
  opposition_present: boolean;
  contradiction_present: boolean;
  qualification_present: boolean;
  contextualization_present: boolean;
  insufficient_material_present: boolean;
  mixed_or_disputed_material_present: boolean;
  no_applied_relation: boolean;
  pending_review: boolean;
  applied_current: boolean;
  retracted: boolean;
  claim_truth: "not_established";
}

/**
 * Bounded, deterministic and rebuildable Core read material. It does not add a
 * lifecycle writer or reinterpret latest-recorded material as an applied head.
 */
export interface ProjectVerifyReconciliationV01 {
  reconciliation_version: typeof PROJECT_VERIFY_RECONCILIATION_VERSION_V01;
  workspace_id: string;
  project_id: string;
  observed_at: string;
  source_packets: ProjectVerifyExactProtocolRefV01[];
  source_receipts: ProjectVerifyExactProtocolRefV01[];
  source_assessments: ProjectVerifyExactProtocolRefV01[];
  criteria: ProjectVerifyCriterionProjectionV01[];
  evidence: ProjectVerifyEvidenceProjectionV01[];
  claim_families: ProjectVerifyClaimFamilyProjectionV01[];
  relation_families: ProjectVerifyRelationFamilyProjectionV01[];
  pending_relation_material: ProjectVerifyRelationMaterialBucketsV01;
  applied_relation_material: ProjectVerifyRelationMaterialBucketsV01;
  applicability_groups: ProjectVerifyApplicabilityGroupV01[];
  later_context: ProjectVerifyLaterContextProjectionV01[];
  conflicts: ProjectVerifyConflictV01[];
  summary: ProjectVerifyReconciliationSummaryV01;
  bounds: ProjectVerifyReconciliationBoundsV01;
  completeness: ProjectVerifyReadCompletenessV01;
  projection_fingerprint: string;
  authority: ProjectVerifyReadAuthorityV01;
}
