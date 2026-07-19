import type { ExternalRefV01 } from "./external-ref";
import type {
  ClaimEvidenceRelationReferenceV01,
  ClaimOperationIntentV01,
  ClaimRecordReferenceV01,
  EvidenceRecordReferenceV01,
} from "./project-verify-material";

export const PROJECT_VERIFY_LIFECYCLE_BINDING_VERSION_V01 =
  "project_verify_lifecycle_binding.v0.1" as const;
export const PROJECT_VERIFY_LIFECYCLE_PROPOSAL_PROFILE_VERSION_V01 =
  "project_verify_lifecycle_proposal.v0.1" as const;
export const PROJECT_VERIFY_LIFECYCLE_CANONICALIZATION_V01 =
  "augnes-json-c14n-v0_1" as const;
export const PROJECT_VERIFY_LIFECYCLE_TARGET_NAMESPACE_V01 =
  "augnes.vnext.project-verify-lifecycle-family-target.v0.1" as const;
export const PROJECT_VERIFY_CLAIM_FAMILY_TARGET_REF_TYPE_V01 =
  "claim_family" as const;
export const PROJECT_VERIFY_RELATION_FAMILY_TARGET_REF_TYPE_V01 =
  "claim_evidence_relation_family" as const;
export const PROJECT_VERIFY_LIFECYCLE_MAX_ID_CHARACTERS_V01 = 256 as const;

export const PROJECT_VERIFY_LIFECYCLE_ENTITY_KINDS_V01 = [
  "claim_record",
  "claim_evidence_relation",
] as const;

export type ProjectVerifyLifecycleEntityKindV01 =
  (typeof PROJECT_VERIFY_LIFECYCLE_ENTITY_KINDS_V01)[number];
export type ProjectVerifyLifecycleRecordReferenceV01 =
  ClaimRecordReferenceV01 | ClaimEvidenceRelationReferenceV01;

export interface ProjectVerifyLifecycleCandidateBindingV01 {
  candidate_id: string;
  candidate_fingerprint: string;
}

export interface ProjectVerifyLifecycleRelationEndpointsV01 {
  claim_ref: ClaimRecordReferenceV01;
  evidence_ref: EvidenceRecordReferenceV01;
}

export interface ProjectVerifyLifecycleAuthorityV01 {
  binding_is_review_decision: false;
  binding_is_gate_authorization: false;
  binding_is_applied_transition: false;
  establishes_truth: false;
  accepts_evidence: false;
  selects_applied_current_head: false;
  creates_semantic_state: false;
  changes_later_context: false;
}

export interface ProjectVerifyLifecycleBindingIntegrityV01 {
  algorithm: "sha256";
  canonicalization: typeof PROJECT_VERIFY_LIFECYCLE_CANONICALIZATION_V01;
  fingerprint_scope: "project_verify_lifecycle_binding_without_integrity_fingerprint";
  fingerprint: string;
}

/**
 * Exact, non-authoritative identity copied into a lifecycle proposal and, only
 * after the existing Transition succeeds, into persisted semantic state.
 */
export interface ProjectVerifyLifecycleBindingV01 {
  binding_version: typeof PROJECT_VERIFY_LIFECYCLE_BINDING_VERSION_V01;
  entity_kind: ProjectVerifyLifecycleEntityKindV01;
  workspace_id: string;
  project_id: string;
  family_id: string;
  family_target_ref: ExternalRefV01;
  family_origin_fingerprint: string;
  applicability_scope_fingerprint: string;
  selected_record_ref: ProjectVerifyLifecycleRecordReferenceV01;
  selected_record_revision: number;
  selected_record_operation_intent: ClaimOperationIntentV01;
  prior_record_ref: ProjectVerifyLifecycleRecordReferenceV01 | null;
  operation_target_record_ref: ProjectVerifyLifecycleRecordReferenceV01 | null;
  relation_endpoints: ProjectVerifyLifecycleRelationEndpointsV01 | null;
  decision_candidate: ProjectVerifyLifecycleCandidateBindingV01;
  selected_candidate: ProjectVerifyLifecycleCandidateBindingV01;
  authority: ProjectVerifyLifecycleAuthorityV01;
  integrity: ProjectVerifyLifecycleBindingIntegrityV01;
}

export interface ProjectVerifyLifecycleCurrentHeadExpectationV01 {
  presence: "absent" | "present";
  revision: number;
  state_content_fingerprint: string | null;
  source_transition_receipt_id: string | null;
  source_transition_receipt_fingerprint: string | null;
  selected_record_ref: ProjectVerifyLifecycleRecordReferenceV01 | null;
}

export interface ProjectVerifyLifecycleProposalProfileIntegrityV01 {
  algorithm: "sha256";
  canonicalization: typeof PROJECT_VERIFY_LIFECYCLE_CANONICALIZATION_V01;
  fingerprint_scope: "project_verify_lifecycle_proposal_without_profile_fingerprint";
  fingerprint: string;
}

export interface ProjectVerifyLifecycleProposalProfileV01 {
  proposal_profile: typeof PROJECT_VERIFY_LIFECYCLE_PROPOSAL_PROFILE_VERSION_V01;
  admission_idempotency_key: string;
  lifecycle_binding: ProjectVerifyLifecycleBindingV01;
  current_head_expectation: ProjectVerifyLifecycleCurrentHeadExpectationV01;
  authority: ProjectVerifyLifecycleAuthorityV01;
  integrity: ProjectVerifyLifecycleProposalProfileIntegrityV01;
}

export type ProjectVerifyLifecycleBindingBuilderInputV01 = Omit<
  ProjectVerifyLifecycleBindingV01,
  "binding_version" | "authority" | "integrity"
>;

export type ProjectVerifyLifecycleProposalProfileBuilderInputV01 = Omit<
  ProjectVerifyLifecycleProposalProfileV01,
  "proposal_profile" | "admission_idempotency_key" | "authority" | "integrity"
>;

export interface ProjectVerifyLifecycleValidationIssueV01 {
  code: string;
  path: string;
  message: string;
}

export interface ProjectVerifyLifecycleValidationResultV01 {
  status: "valid" | "invalid";
  errors: ProjectVerifyLifecycleValidationIssueV01[];
}
