import type { ExternalRefTrustClassV01, ExternalRefV01 } from "./external-ref";
import type { CriterionAssessmentV01 } from "./criterion-assessment";
import type { EpisodeDeltaProposalV01 } from "./episode-delta-proposal";
import type { RunReceiptV01 } from "./run-receipt";
import type { TaskContextPacketV01 } from "./task-context-packet";

export const EVIDENCE_RECORD_VERSION_V01 = "evidence_record.v0.1" as const;
export const CLAIM_RECORD_VERSION_V01 = "claim_record.v0.1" as const;
export const CLAIM_EVIDENCE_RELATION_VERSION_V01 =
  "claim_evidence_relation.v0.1" as const;
export const CLAIM_APPLICABILITY_SCOPE_VERSION_V01 =
  "claim_applicability_scope.v0.1" as const;
export const PROJECT_VERIFY_FAMILY_ORIGIN_VERSION_V01 =
  "project_verify_family_origin.v0.1" as const;
export const PROJECT_VERIFY_MATERIAL_CANONICALIZATION_V01 =
  "augnes-json-c14n-v0_1" as const;
export const PROJECT_VERIFY_MATERIAL_MAX_TEXT_CHARACTERS_V01 = 2_000 as const;
export const PROJECT_VERIFY_MATERIAL_MAX_COLLECTION_ITEMS_V01 = 64 as const;
export const PROJECT_VERIFY_MATERIAL_MAX_REFS_PER_COLLECTION_V01 = 64 as const;
export const PROJECT_VERIFY_MATERIAL_MAX_LINEAGE_REVISIONS_V01 = 256 as const;
export const RUN_CRITERION_PROJECT_VERIFY_MATERIAL_VERSION_V01 =
  "run_criterion_project_verify_material.v0.1" as const;
export const RUN_CRITERION_PROJECT_VERIFY_PRODUCER_PROFILE_V01 =
  "run_criterion_project_verify_producer.v0.1" as const;
export const RUN_CRITERION_PROJECT_VERIFY_SOURCE_AUTHENTICATOR_V01 =
  "run_criterion_project_verify_source_authenticator.v0.1" as const;
export const RUN_CRITERION_CLAIM_FAMILY_NAMESPACE_V01 =
  "augnes.vnext.criterion-claim-family.v0.1" as const;
export const RUN_CRITERION_EVIDENCE_IDENTITY_NAMESPACE_V01 =
  "augnes.vnext.exact-criterion-evidence.v0.1" as const;
export const RUN_CRITERION_RELATION_FAMILY_NAMESPACE_V01 =
  "augnes.vnext.exact-criterion-claim-evidence-relation.v0.1" as const;

export const PROJECT_VERIFY_PORTABLE_EXPORT_CLASSIFICATION_V01 = {
  classification_version: "project_verify_export_classification.v0.1",
  canonical_lifecycle_material: [
    "EvidenceRecordV01 payload, exact scope, trust, coverage, sources, limitations, uncertainty, and integrity",
    "ClaimRecordV01 revisions and exact prior, supersession, and retraction candidate lineage",
    "ClaimEvidenceRelationV01 revisions, exact endpoints, relation kind, scope, basis, trust, and lineage",
    "future exact ReviewDecision and applied Transition refs only when SR-3 supplies them through the existing authority path",
  ],
  rebuildable_material: [
    "project list grouping",
    "latest recorded candidate revision projection",
    "relation counts",
    "display summaries",
    "future reconciliation and Workbench views",
  ],
  import_authority: {
    creates_review_decision: false,
    applies_transition: false,
    accepts_evidence: false,
    selects_applied_current_head: false,
    changes_truth_status: false,
  },
} as const;

export const EVIDENCE_RECORD_KINDS_V01 = [
  "exact_criterion_relation_material",
  "direct_observation_material",
  "verified_external_observation_material",
  "host_attestation_material",
  "artifact_source_material",
  "provider_report_material",
  "user_declared_material",
  "imported_unverified_material",
  "derived_interpretation_material",
] as const;

export const PROJECT_VERIFY_PRODUCER_KINDS_V01 = [
  "server_deterministic_evaluator",
  "local_adapter",
  "host",
  "model",
  "provider",
  "user",
  "import",
] as const;

export const EVIDENCE_COVERAGE_CLASSIFICATIONS_V01 = [
  "complete",
  "partial",
  "unknown",
  "not_applicable",
] as const;

export const CLAIM_OPERATION_INTENTS_V01 = [
  "create",
  "revise",
  "supersede",
  "retract",
] as const;

export const CLAIM_EVIDENCE_RELATION_KINDS_V01 = [
  "supports",
  "opposes",
  "contradicts",
  "qualifies",
  "contextualizes",
  "insufficient",
] as const;

export const CLAIM_EVIDENCE_RELATION_BASES_V01 = [
  "observed",
  "attested",
  "mixed",
  "insufficient",
] as const;

export type EvidenceRecordKindV01 = (typeof EVIDENCE_RECORD_KINDS_V01)[number];
export type ProjectVerifyProducerKindV01 =
  (typeof PROJECT_VERIFY_PRODUCER_KINDS_V01)[number];
export type EvidenceCoverageClassificationV01 =
  (typeof EVIDENCE_COVERAGE_CLASSIFICATIONS_V01)[number];
export type ClaimOperationIntentV01 =
  (typeof CLAIM_OPERATION_INTENTS_V01)[number];
export type ClaimEvidenceRelationKindV01 =
  (typeof CLAIM_EVIDENCE_RELATION_KINDS_V01)[number];
export type ClaimEvidenceRelationBasisV01 =
  (typeof CLAIM_EVIDENCE_RELATION_BASES_V01)[number];

export interface ProjectVerifyProducerV01 {
  producer_kind: ProjectVerifyProducerKindV01;
  producer_profile: string;
}

export interface ProjectVerifyFamilyOriginSeedV01 {
  origin_namespace: string;
  origin_seed: string;
  origin_profile: string;
  origin_producer_kind: ProjectVerifyProducerKindV01;
}

export interface ClaimFamilyOriginV01 extends ProjectVerifyFamilyOriginSeedV01 {
  origin_version: typeof PROJECT_VERIFY_FAMILY_ORIGIN_VERSION_V01;
  workspace_id: string;
  project_id: string;
  subject_refs: ExternalRefV01[];
  applicability_scope_fingerprint: string;
}

export interface ClaimEvidenceRelationFamilyOriginV01 extends ProjectVerifyFamilyOriginSeedV01 {
  origin_version: typeof PROJECT_VERIFY_FAMILY_ORIGIN_VERSION_V01;
  workspace_id: string;
  project_id: string;
  claim_ref: ClaimRecordReferenceV01;
  evidence_ref: EvidenceRecordReferenceV01;
  applicability_scope_fingerprint: string;
}

export interface ProjectVerifyMaterialBoundaryV01 {
  bounded_summaries_only: true;
  max_text_characters: typeof PROJECT_VERIFY_MATERIAL_MAX_TEXT_CHARACTERS_V01;
  max_collection_items: typeof PROJECT_VERIFY_MATERIAL_MAX_COLLECTION_ITEMS_V01;
  max_refs_per_collection: typeof PROJECT_VERIFY_MATERIAL_MAX_REFS_PER_COLLECTION_V01;
  raw_source_body_persisted: false;
  raw_prompt_persisted: false;
  raw_transcript_persisted: false;
  raw_terminal_output_persisted: false;
  raw_provider_output_persisted: false;
  raw_diff_persisted: false;
  hidden_reasoning_persisted: false;
  credential_or_secret_persisted: false;
  absolute_local_path_persisted: false;
}

export interface ProjectVerifyRecordReferenceV01<
  TKind extends "evidence_record" | "claim_record" | "claim_evidence_relation",
> {
  record_kind: TKind;
  record_id: string;
  record_fingerprint: string;
}

export type EvidenceRecordReferenceV01 =
  ProjectVerifyRecordReferenceV01<"evidence_record">;
export type ClaimRecordReferenceV01 =
  ProjectVerifyRecordReferenceV01<"claim_record">;
export type ClaimEvidenceRelationReferenceV01 =
  ProjectVerifyRecordReferenceV01<"claim_evidence_relation">;

export interface ClaimApplicabilityScopeV01 {
  scope_version: typeof CLAIM_APPLICABILITY_SCOPE_VERSION_V01;
  subject_refs: ExternalRefV01[];
  environment_refs: ExternalRefV01[];
  temporal_scope:
    | {
        kind: "unbounded";
        valid_from: null;
        valid_until: null;
      }
    | {
        kind: "interval";
        valid_from: string | null;
        valid_until: string | null;
      };
  condition:
    | {
        kind: "constant";
        value: "applicable" | "not_applicable";
        context_refs: [];
      }
    | {
        kind: "exact_context";
        value: "applicable";
        context_refs: ExternalRefV01[];
      };
  scope_fingerprint: string;
}

export interface EvidenceRecordLifecycleV01 {
  record_status: "recorded";
  review_status: "not_reviewed";
  decision_ref: null;
  acceptance_status: "not_accepted";
  transition_ref: null;
}

export interface EvidenceRecordAuthorityV01 {
  record_is_support_material: true;
  record_establishes_truth: false;
  record_is_accepted_semantic_state: false;
  satisfies_criterion_automatically: false;
  activates_claim_automatically: false;
  creates_review_decision: false;
  grants_transition_eligibility: false;
  applies_transition: false;
  changes_semantic_state: false;
  changes_later_context: false;
  promotes_perspective_or_memory: false;
  authorizes_execution: false;
  authorizes_model_or_provider_call: false;
  authorizes_network_or_external_action: false;
}

export interface EvidenceRecordIntegrityV01 {
  algorithm: "sha256";
  canonicalization: typeof PROJECT_VERIFY_MATERIAL_CANONICALIZATION_V01;
  fingerprint_scope: "evidence_record_without_integrity_fingerprint";
  fingerprint: string;
}

export interface EvidenceRecordV01 {
  evidence_version: typeof EVIDENCE_RECORD_VERSION_V01;
  evidence_id: string;
  idempotency_key: string;
  identity_namespace: string;
  identity_key: string;
  workspace_id: string;
  project_id: string;
  evidence_kind: EvidenceRecordKindV01;
  subject_refs: ExternalRefV01[];
  source_refs: ExternalRefV01[];
  source_observed_or_reported_at: string | null;
  recorded_at: string;
  trust_class: ExternalRefTrustClassV01;
  coverage: EvidenceCoverageClassificationV01;
  bounded_summary: string;
  material_fingerprint: string | null;
  limitations: string[];
  uncertainty: string[];
  producer: ProjectVerifyProducerV01;
  lifecycle: EvidenceRecordLifecycleV01;
  material_boundary: ProjectVerifyMaterialBoundaryV01;
  authority: EvidenceRecordAuthorityV01;
  integrity: EvidenceRecordIntegrityV01;
}

export interface ClaimRecordLifecycleV01 {
  record_status: "recorded";
  candidate_status: "candidate";
  review_status: "not_reviewed";
  decision_ref: null;
  application_status: "not_applied";
  transition_ref: null;
  truth_status: "not_established";
}

export interface ClaimRecordAuthorityV01 {
  record_is_candidate_proposition: true;
  record_establishes_truth: false;
  record_is_accepted_semantic_state: false;
  selects_applied_current_head: false;
  validates_evidence: false;
  creates_review_decision: false;
  grants_transition_eligibility: false;
  applies_transition: false;
  changes_semantic_state: false;
  changes_later_context: false;
  promotes_perspective_or_memory: false;
  authorizes_execution: false;
  authorizes_model_or_provider_call: false;
  authorizes_network_or_external_action: false;
}

export interface ClaimRecordIntegrityV01 {
  algorithm: "sha256";
  canonicalization: typeof PROJECT_VERIFY_MATERIAL_CANONICALIZATION_V01;
  fingerprint_scope: "claim_record_without_integrity_fingerprint";
  fingerprint: string;
}

export interface ClaimRecordV01 {
  claim_version: typeof CLAIM_RECORD_VERSION_V01;
  claim_id: string;
  claim_family_id: string;
  idempotency_key: string;
  family_origin: ClaimFamilyOriginV01;
  workspace_id: string;
  project_id: string;
  revision: number;
  prior_claim_ref: ClaimRecordReferenceV01 | null;
  operation_intent: ClaimOperationIntentV01;
  operation_target_claim_ref: ClaimRecordReferenceV01 | null;
  proposition: string;
  subject_refs: ExternalRefV01[];
  applicability_scope: ClaimApplicabilityScopeV01;
  source_refs: ExternalRefV01[];
  limitations: string[];
  uncertainty: string[];
  producer: ProjectVerifyProducerV01;
  created_at: string;
  lifecycle: ClaimRecordLifecycleV01;
  material_boundary: ProjectVerifyMaterialBoundaryV01;
  authority: ClaimRecordAuthorityV01;
  integrity: ClaimRecordIntegrityV01;
}

export interface ClaimEvidenceRelationLifecycleV01 {
  record_status: "recorded";
  candidate_status: "candidate";
  review_status: "not_reviewed";
  decision_ref: null;
  application_status: "not_applied";
  transition_ref: null;
  relation_status: "not_established";
}

export interface ClaimEvidenceRelationAuthorityV01 {
  record_is_candidate_relation: true;
  relation_existence_proves_claim: false;
  evidence_count_calculates_truth: false;
  confidence_grants_authority: false;
  resolves_contradiction_automatically: false;
  selects_applied_current_head: false;
  creates_review_decision: false;
  grants_transition_eligibility: false;
  applies_transition: false;
  changes_semantic_state: false;
  changes_later_context: false;
  promotes_perspective_or_memory: false;
  authorizes_execution: false;
  authorizes_model_or_provider_call: false;
  authorizes_network_or_external_action: false;
}

export interface ClaimEvidenceRelationIntegrityV01 {
  algorithm: "sha256";
  canonicalization: typeof PROJECT_VERIFY_MATERIAL_CANONICALIZATION_V01;
  fingerprint_scope: "claim_evidence_relation_without_integrity_fingerprint";
  fingerprint: string;
}

export interface ClaimEvidenceRelationV01 {
  relation_version: typeof CLAIM_EVIDENCE_RELATION_VERSION_V01;
  relation_id: string;
  relation_family_id: string;
  idempotency_key: string;
  family_origin: ClaimEvidenceRelationFamilyOriginV01;
  workspace_id: string;
  project_id: string;
  revision: number;
  prior_relation_ref: ClaimEvidenceRelationReferenceV01 | null;
  operation_intent: ClaimOperationIntentV01;
  supersedes_relation_ref: ClaimEvidenceRelationReferenceV01 | null;
  claim_ref: ClaimRecordReferenceV01;
  evidence_ref: EvidenceRecordReferenceV01;
  relation_kind: ClaimEvidenceRelationKindV01;
  applicability_scope: ClaimApplicabilityScopeV01;
  basis: ClaimEvidenceRelationBasisV01;
  trust_class: ExternalRefTrustClassV01;
  source_refs: ExternalRefV01[];
  limitations: string[];
  uncertainty: string[];
  producer: ProjectVerifyProducerV01;
  created_at: string;
  lifecycle: ClaimEvidenceRelationLifecycleV01;
  material_boundary: ProjectVerifyMaterialBoundaryV01;
  authority: ClaimEvidenceRelationAuthorityV01;
  integrity: ClaimEvidenceRelationIntegrityV01;
}

export interface ProjectVerifyMaterialValidationIssueV01 {
  severity: "error" | "warning";
  code: string;
  path: string | null;
  message: string;
}

export interface ProjectVerifyMaterialValidationResultV01<
  TVersion extends string,
> {
  status: "valid" | "invalid" | "blocked";
  normalized_protocol_version: TVersion | null;
  errors: ProjectVerifyMaterialValidationIssueV01[];
  warnings: ProjectVerifyMaterialValidationIssueV01[];
}

export interface RunCriterionProjectVerifySourceBindingV01 {
  packet: {
    packet_version: TaskContextPacketV01["packet_version"];
    packet_id: string;
    packet_fingerprint: string;
  };
  receipt: {
    receipt_version: RunReceiptV01["receipt_version"];
    receipt_id: string;
    receipt_fingerprint: string;
    run_id: string;
  };
  assessment: {
    assessment_version: CriterionAssessmentV01["assessment_version"];
    assessment_fingerprint: string;
  };
  proposal: {
    proposal_version: EpisodeDeltaProposalV01["proposal_version"];
    proposal_id: string;
    proposal_fingerprint: string;
  };
}

export interface RunCriterionProjectVerifyMaterialV01 {
  material_version: typeof RUN_CRITERION_PROJECT_VERIFY_MATERIAL_VERSION_V01;
  workspace_id: string;
  project_id: string;
  source: RunCriterionProjectVerifySourceBindingV01;
  evidence_records: EvidenceRecordV01[];
  claim_records: ClaimRecordV01[];
  relations: ClaimEvidenceRelationV01[];
  batch_idempotency_key: string;
  authority: {
    explicit_admission_required: true;
    source_validation_grants_truth: false;
    evidence_is_accepted_automatically: false;
    claims_are_candidate_only: true;
    relations_are_candidate_only: true;
    creates_review_decision: false;
    applies_transition: false;
    changes_semantic_state: false;
    selects_applied_current_head: false;
    changes_later_context: false;
  };
}
