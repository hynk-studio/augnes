import {
  canonicalizeProtocolValueV01,
  compareExternalRefsV01,
  createProtocolSha256V01,
  isProtocolRecordV01,
  normalizeExternalRefPrimitiveV01,
  normalizeProtocolTextV01,
  parseStrictIsoTimestampV01,
  scanForbiddenProtocolMaterialV01,
  validateExternalRefStructureV01,
  type ProtocolValidationIssueSinkV01,
} from "@/lib/vnext/protocol-primitives";
import {
  isExactCriterionRelationRefV01,
  parseCriterionRelationRefExternalIdV01,
} from "@/lib/vnext/criterion-assessment";
import {
  CLAIM_APPLICABILITY_SCOPE_VERSION_V01,
  CLAIM_EVIDENCE_RELATION_BASES_V01,
  CLAIM_EVIDENCE_RELATION_KINDS_V01,
  CLAIM_EVIDENCE_RELATION_VERSION_V01,
  CLAIM_OPERATION_INTENTS_V01,
  CLAIM_RECORD_VERSION_V01,
  EVIDENCE_COVERAGE_CLASSIFICATIONS_V01,
  EVIDENCE_RECORD_KINDS_V01,
  EVIDENCE_RECORD_VERSION_V01,
  PROJECT_VERIFY_MATERIAL_CANONICALIZATION_V01,
  PROJECT_VERIFY_MATERIAL_MAX_COLLECTION_ITEMS_V01,
  PROJECT_VERIFY_MATERIAL_MAX_LINEAGE_REVISIONS_V01,
  PROJECT_VERIFY_MATERIAL_MAX_REFS_PER_COLLECTION_V01,
  PROJECT_VERIFY_MATERIAL_MAX_TEXT_CHARACTERS_V01,
  PROJECT_VERIFY_PRODUCER_KINDS_V01,
  RUN_CRITERION_EVIDENCE_IDENTITY_NAMESPACE_V01,
  RUN_CRITERION_PROJECT_VERIFY_PRODUCER_PROFILE_V01,
  type ClaimApplicabilityScopeV01,
  type ClaimEvidenceRelationBasisV01,
  type ClaimEvidenceRelationReferenceV01,
  type ClaimEvidenceRelationV01,
  type ClaimOperationIntentV01,
  type ClaimRecordReferenceV01,
  type ClaimRecordV01,
  type EvidenceRecordReferenceV01,
  type EvidenceRecordV01,
  type ProjectVerifyMaterialBoundaryV01,
  type ProjectVerifyMaterialValidationResultV01,
  type ProjectVerifyProducerV01,
} from "@/types/vnext/project-verify-material";
import {
  EXTERNAL_REF_TRUST_CLASSES_V01,
  type ExternalRefTrustClassV01,
  type ExternalRefV01,
} from "@/types/vnext/external-ref";

const SHA256_PATTERN_V01 = /^sha256:[a-f0-9]{64}$/u;
const IDENTITY_TEXT_MAX_V01 = 256;
const externalRefTrustClassesV01 = new Set<string>(
  EXTERNAL_REF_TRUST_CLASSES_V01,
);
const evidenceKindsV01 = new Set<string>(EVIDENCE_RECORD_KINDS_V01);
const evidenceCoverageV01 = new Set<string>(
  EVIDENCE_COVERAGE_CLASSIFICATIONS_V01,
);
const producerKindsV01 = new Set<string>(PROJECT_VERIFY_PRODUCER_KINDS_V01);
const claimOperationsV01 = new Set<string>(CLAIM_OPERATION_INTENTS_V01);
const relationKindsV01 = new Set<string>(CLAIM_EVIDENCE_RELATION_KINDS_V01);
const relationBasesV01 = new Set<string>(CLAIM_EVIDENCE_RELATION_BASES_V01);

export class ProjectVerifyMaterialErrorV01 extends Error {
  constructor(
    readonly code: string,
    readonly blocked = false,
  ) {
    super(code);
    this.name = "ProjectVerifyMaterialErrorV01";
  }
}

export interface ClaimApplicabilityScopeBuilderInputV01 {
  subject_refs: ExternalRefV01[];
  environment_refs?: ExternalRefV01[];
  temporal_scope?: ClaimApplicabilityScopeV01["temporal_scope"];
  condition?: ClaimApplicabilityScopeV01["condition"];
}

export interface EvidenceRecordBuilderInputV01 {
  identity_namespace: string;
  identity_key: string;
  workspace_id: string;
  project_id: string;
  evidence_kind: EvidenceRecordV01["evidence_kind"];
  subject_refs: ExternalRefV01[];
  source_refs: ExternalRefV01[];
  source_observed_or_reported_at: string | null;
  recorded_at: string;
  trust_class: ExternalRefTrustClassV01;
  coverage: EvidenceRecordV01["coverage"];
  bounded_summary: string;
  material_fingerprint: string | null;
  limitations: string[];
  uncertainty: string[];
  producer: ProjectVerifyProducerV01;
}

export interface ClaimRecordBuilderInputV01 {
  family_namespace: string;
  family_seed: string;
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
}

export interface ClaimEvidenceRelationBuilderInputV01 {
  family_namespace: string;
  family_seed: string;
  workspace_id: string;
  project_id: string;
  revision: number;
  prior_relation_ref: ClaimEvidenceRelationReferenceV01 | null;
  operation_intent: ClaimOperationIntentV01;
  supersedes_relation_ref: ClaimEvidenceRelationReferenceV01 | null;
  claim_ref: ClaimRecordReferenceV01;
  evidence_ref: EvidenceRecordReferenceV01;
  relation_kind: ClaimEvidenceRelationV01["relation_kind"];
  applicability_scope: ClaimApplicabilityScopeV01;
  basis: ClaimEvidenceRelationBasisV01;
  trust_class: ExternalRefTrustClassV01;
  source_refs: ExternalRefV01[];
  limitations: string[];
  uncertainty: string[];
  producer: ProjectVerifyProducerV01;
  created_at: string;
}

export function createProjectVerifyMaterialBoundaryV01(): ProjectVerifyMaterialBoundaryV01 {
  return {
    bounded_summaries_only: true,
    max_text_characters: PROJECT_VERIFY_MATERIAL_MAX_TEXT_CHARACTERS_V01,
    max_collection_items: PROJECT_VERIFY_MATERIAL_MAX_COLLECTION_ITEMS_V01,
    max_refs_per_collection:
      PROJECT_VERIFY_MATERIAL_MAX_REFS_PER_COLLECTION_V01,
    raw_source_body_persisted: false,
    raw_prompt_persisted: false,
    raw_transcript_persisted: false,
    raw_terminal_output_persisted: false,
    raw_provider_output_persisted: false,
    raw_diff_persisted: false,
    hidden_reasoning_persisted: false,
    credential_or_secret_persisted: false,
    absolute_local_path_persisted: false,
  };
}

export function createClaimApplicabilityScopeV01(
  input: ClaimApplicabilityScopeBuilderInputV01,
): ClaimApplicabilityScopeV01 {
  const subjectRefs = normalizeRefsV01(input.subject_refs, "subject_refs", 1);
  const environmentRefs = normalizeRefsV01(
    input.environment_refs ?? [],
    "environment_refs",
    0,
  );
  const temporalScope = normalizeTemporalScopeV01(
    input.temporal_scope ?? {
      kind: "unbounded",
      valid_from: null,
      valid_until: null,
    },
  );
  const condition = normalizeApplicabilityConditionV01(
    input.condition ?? {
      kind: "constant",
      value: "applicable",
      context_refs: [],
    },
  );
  const withoutFingerprint = {
    scope_version: CLAIM_APPLICABILITY_SCOPE_VERSION_V01,
    subject_refs: subjectRefs,
    environment_refs: environmentRefs,
    temporal_scope: temporalScope,
    condition,
  };
  return {
    ...withoutFingerprint,
    scope_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(withoutFingerprint),
    ),
  };
}

export function buildEvidenceRecordV01(
  input: EvidenceRecordBuilderInputV01,
): EvidenceRecordV01 {
  const identityNamespace = normalizeIdentityTextV01(
    input.identity_namespace,
    "evidence_identity_namespace_invalid",
  );
  const identityKey = normalizeIdentityTextV01(
    input.identity_key,
    "evidence_identity_key_invalid",
  );
  const workspaceId = normalizeIdentityTextV01(
    input.workspace_id,
    "evidence_workspace_id_invalid",
  );
  const projectId = normalizeIdentityTextV01(
    input.project_id,
    "evidence_project_id_invalid",
  );
  if (!evidenceKindsV01.has(input.evidence_kind)) {
    failV01("evidence_kind_invalid");
  }
  const trustClass = normalizeTrustClassV01(input.trust_class);
  if (!evidenceCoverageV01.has(input.coverage)) {
    failV01("evidence_coverage_invalid");
  }
  const subjectRefs = normalizeRefsV01(input.subject_refs, "subject_refs", 1);
  const sourceRefs = normalizeRefsV01(input.source_refs, "source_refs", 1);
  const sourceAt = normalizeNullableTimestampV01(
    input.source_observed_or_reported_at,
    "evidence_source_time_invalid",
  );
  const recordedAt = normalizeTimestampV01(
    input.recorded_at,
    "evidence_recorded_at_invalid",
  );
  const summary = normalizeBoundedTextV01(
    input.bounded_summary,
    "evidence_summary_invalid",
  );
  const materialFingerprint = normalizeNullableSha256V01(
    input.material_fingerprint,
    "evidence_material_fingerprint_invalid",
  );
  const limitations = normalizeTextCollectionV01(
    input.limitations,
    "evidence_limitations_invalid",
  );
  const uncertainty = normalizeTextCollectionV01(
    input.uncertainty,
    "evidence_uncertainty_invalid",
  );
  const producer = normalizeProducerV01(input.producer);
  validateEvidenceKindTrustV01(input.evidence_kind, trustClass);
  validateProducerTrustV01(producer, trustClass);
  validateExactCriterionEvidenceV01({
    evidence_kind: input.evidence_kind,
    identity_namespace: identityNamespace,
    source_refs: sourceRefs,
    trust_class: trustClass,
    coverage: input.coverage,
    material_fingerprint: materialFingerprint,
    producer,
  });

  const identityMaterial = {
    evidence_version: EVIDENCE_RECORD_VERSION_V01,
    workspace_id: workspaceId,
    project_id: projectId,
    identity_namespace: identityNamespace,
    identity_key: identityKey,
  };
  const evidenceId = deriveScopedRecordIdV01("evidence", identityMaterial);
  const idempotencyKey = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      ...identityMaterial,
      evidence_id: evidenceId,
    }),
  );
  const withoutIntegrity = {
    evidence_version: EVIDENCE_RECORD_VERSION_V01,
    evidence_id: evidenceId,
    idempotency_key: idempotencyKey,
    identity_namespace: identityNamespace,
    identity_key: identityKey,
    workspace_id: workspaceId,
    project_id: projectId,
    evidence_kind: input.evidence_kind,
    subject_refs: subjectRefs,
    source_refs: sourceRefs,
    source_observed_or_reported_at: sourceAt,
    recorded_at: recordedAt,
    trust_class: trustClass,
    coverage: input.coverage,
    bounded_summary: summary,
    material_fingerprint: materialFingerprint,
    limitations,
    uncertainty,
    producer,
    lifecycle: {
      record_status: "recorded" as const,
      review_status: "not_reviewed" as const,
      decision_ref: null,
      acceptance_status: "not_accepted" as const,
      transition_ref: null,
    },
    material_boundary: createProjectVerifyMaterialBoundaryV01(),
    authority: {
      record_is_support_material: true as const,
      record_establishes_truth: false as const,
      record_is_accepted_semantic_state: false as const,
      satisfies_criterion_automatically: false as const,
      activates_claim_automatically: false as const,
      creates_review_decision: false as const,
      grants_transition_eligibility: false as const,
      applies_transition: false as const,
      changes_semantic_state: false as const,
      changes_later_context: false as const,
      promotes_perspective_or_memory: false as const,
      authorizes_execution: false as const,
      authorizes_model_or_provider_call: false as const,
      authorizes_network_or_external_action: false as const,
    },
    integrity: {
      algorithm: "sha256" as const,
      canonicalization: PROJECT_VERIFY_MATERIAL_CANONICALIZATION_V01,
      fingerprint_scope:
        "evidence_record_without_integrity_fingerprint" as const,
    },
  };
  const record: EvidenceRecordV01 = {
    ...withoutIntegrity,
    integrity: {
      ...withoutIntegrity.integrity,
      fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(withoutIntegrity),
      ),
    },
  };
  assertSafeMaterialV01(record);
  return record;
}

export function buildClaimRecordV01(
  input: ClaimRecordBuilderInputV01,
): ClaimRecordV01 {
  const familyNamespace = normalizeIdentityTextV01(
    input.family_namespace,
    "claim_family_namespace_invalid",
  );
  const familySeed = normalizeIdentityTextV01(
    input.family_seed,
    "claim_family_seed_invalid",
  );
  const workspaceId = normalizeIdentityTextV01(
    input.workspace_id,
    "claim_workspace_id_invalid",
  );
  const projectId = normalizeIdentityTextV01(
    input.project_id,
    "claim_project_id_invalid",
  );
  const revision = normalizeRevisionV01(
    input.revision,
    "claim_revision_invalid",
  );
  const operation = normalizeClaimOperationV01(input.operation_intent);
  const priorRef = normalizeRecordReferenceV01(
    input.prior_claim_ref,
    "claim_record",
    "claim_prior_ref_invalid",
  );
  const operationTarget = normalizeRecordReferenceV01(
    input.operation_target_claim_ref,
    "claim_record",
    "claim_operation_target_ref_invalid",
  );
  validateClaimLineageShapeV01({
    revision,
    operation,
    priorRef,
    operationTarget,
  });
  const proposition = normalizeBoundedTextV01(
    input.proposition,
    "claim_proposition_invalid",
  );
  const subjectRefs = normalizeRefsV01(input.subject_refs, "subject_refs", 1);
  const applicabilityScope = normalizeApplicabilityScopeV01(
    input.applicability_scope,
  );
  if (
    canonicalizeProtocolValueV01(subjectRefs) !==
    canonicalizeProtocolValueV01(applicabilityScope.subject_refs)
  ) {
    failV01("claim_subject_scope_conflict", true);
  }
  const sourceRefs = normalizeRefsV01(input.source_refs, "source_refs", 1);
  const limitations = normalizeTextCollectionV01(
    input.limitations,
    "claim_limitations_invalid",
  );
  const uncertainty = normalizeTextCollectionV01(
    input.uncertainty,
    "claim_uncertainty_invalid",
  );
  const producer = normalizeProducerV01(input.producer);
  const createdAt = normalizeTimestampV01(
    input.created_at,
    "claim_created_at_invalid",
  );

  const familyMaterial = {
    claim_version: CLAIM_RECORD_VERSION_V01,
    workspace_id: workspaceId,
    project_id: projectId,
    family_namespace: familyNamespace,
    family_seed: familySeed,
    subject_refs: subjectRefs,
    applicability_scope_fingerprint: applicabilityScope.scope_fingerprint,
    producer,
  };
  const claimFamilyId = deriveScopedRecordIdV01("claim-family", familyMaterial);
  if (revision > 1) {
    const expectedPriorId = deriveScopedRecordIdV01("claim", {
      claim_family_id: claimFamilyId,
      revision: revision - 1,
    });
    if (priorRef?.record_id !== expectedPriorId) {
      failV01("claim_prior_identity_conflict", true);
    }
    if (
      (operation === "supersede" || operation === "retract") &&
      !recordReferenceEqualV01(operationTarget, priorRef)
    ) {
      failV01("claim_operation_target_conflict", true);
    }
  }
  const claimId = deriveScopedRecordIdV01("claim", {
    claim_family_id: claimFamilyId,
    revision,
  });
  const idempotencyKey = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      claim_version: CLAIM_RECORD_VERSION_V01,
      workspace_id: workspaceId,
      project_id: projectId,
      claim_family_id: claimFamilyId,
      revision,
    }),
  );
  const withoutIntegrity = {
    claim_version: CLAIM_RECORD_VERSION_V01,
    claim_id: claimId,
    claim_family_id: claimFamilyId,
    idempotency_key: idempotencyKey,
    family_namespace: familyNamespace,
    family_seed: familySeed,
    workspace_id: workspaceId,
    project_id: projectId,
    revision,
    prior_claim_ref: priorRef,
    operation_intent: operation,
    operation_target_claim_ref: operationTarget,
    proposition,
    subject_refs: subjectRefs,
    applicability_scope: applicabilityScope,
    source_refs: sourceRefs,
    limitations,
    uncertainty,
    producer,
    created_at: createdAt,
    lifecycle: {
      record_status: "recorded" as const,
      candidate_status: "candidate" as const,
      review_status: "not_reviewed" as const,
      decision_ref: null,
      application_status: "not_applied" as const,
      transition_ref: null,
      truth_status: "not_established" as const,
    },
    material_boundary: createProjectVerifyMaterialBoundaryV01(),
    authority: {
      record_is_candidate_proposition: true as const,
      record_establishes_truth: false as const,
      record_is_accepted_semantic_state: false as const,
      selects_applied_current_head: false as const,
      validates_evidence: false as const,
      creates_review_decision: false as const,
      grants_transition_eligibility: false as const,
      applies_transition: false as const,
      changes_semantic_state: false as const,
      changes_later_context: false as const,
      promotes_perspective_or_memory: false as const,
      authorizes_execution: false as const,
      authorizes_model_or_provider_call: false as const,
      authorizes_network_or_external_action: false as const,
    },
    integrity: {
      algorithm: "sha256" as const,
      canonicalization: PROJECT_VERIFY_MATERIAL_CANONICALIZATION_V01,
      fingerprint_scope: "claim_record_without_integrity_fingerprint" as const,
    },
  };
  const record: ClaimRecordV01 = {
    ...withoutIntegrity,
    integrity: {
      ...withoutIntegrity.integrity,
      fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(withoutIntegrity),
      ),
    },
  };
  assertSafeMaterialV01(record);
  return record;
}

export function buildClaimEvidenceRelationV01(
  input: ClaimEvidenceRelationBuilderInputV01,
): ClaimEvidenceRelationV01 {
  const familyNamespace = normalizeIdentityTextV01(
    input.family_namespace,
    "relation_family_namespace_invalid",
  );
  const familySeed = normalizeIdentityTextV01(
    input.family_seed,
    "relation_family_seed_invalid",
  );
  const workspaceId = normalizeIdentityTextV01(
    input.workspace_id,
    "relation_workspace_id_invalid",
  );
  const projectId = normalizeIdentityTextV01(
    input.project_id,
    "relation_project_id_invalid",
  );
  const revision = normalizeRevisionV01(
    input.revision,
    "relation_revision_invalid",
  );
  const operation = normalizeClaimOperationV01(input.operation_intent);
  const priorRef = normalizeRecordReferenceV01(
    input.prior_relation_ref,
    "claim_evidence_relation",
    "relation_prior_ref_invalid",
  );
  const supersedesRef = normalizeRecordReferenceV01(
    input.supersedes_relation_ref,
    "claim_evidence_relation",
    "relation_supersedes_ref_invalid",
  );
  validateRelationLineageShapeV01({
    revision,
    operation,
    priorRef,
    supersedesRef,
  });
  const claimRef = normalizeRecordReferenceV01(
    input.claim_ref,
    "claim_record",
    "relation_claim_ref_invalid",
  );
  const evidenceRef = normalizeRecordReferenceV01(
    input.evidence_ref,
    "evidence_record",
    "relation_evidence_ref_invalid",
  );
  if (!claimRef || !evidenceRef) failV01("relation_endpoint_ref_missing", true);
  if (!relationKindsV01.has(input.relation_kind)) {
    failV01("relation_kind_invalid");
  }
  if (!relationBasesV01.has(input.basis)) {
    failV01("relation_basis_invalid");
  }
  const trustClass = normalizeTrustClassV01(input.trust_class);
  validateRelationBasisTrustV01(input.basis, trustClass);
  if (
    input.relation_kind === "insufficient" &&
    input.basis !== "insufficient"
  ) {
    failV01("relation_insufficient_basis_invalid");
  }
  const applicabilityScope = normalizeApplicabilityScopeV01(
    input.applicability_scope,
  );
  const sourceRefs = normalizeRefsV01(input.source_refs, "source_refs", 1);
  const limitations = normalizeTextCollectionV01(
    input.limitations,
    "relation_limitations_invalid",
  );
  const uncertainty = normalizeTextCollectionV01(
    input.uncertainty,
    "relation_uncertainty_invalid",
  );
  const producer = normalizeProducerV01(input.producer);
  validateProducerTrustV01(producer, trustClass);
  const createdAt = normalizeTimestampV01(
    input.created_at,
    "relation_created_at_invalid",
  );
  const familyMaterial = {
    relation_version: CLAIM_EVIDENCE_RELATION_VERSION_V01,
    workspace_id: workspaceId,
    project_id: projectId,
    family_namespace: familyNamespace,
    family_seed: familySeed,
    claim_ref: claimRef,
    evidence_ref: evidenceRef,
    applicability_scope_fingerprint: applicabilityScope.scope_fingerprint,
    producer,
  };
  const relationFamilyId = deriveScopedRecordIdV01(
    "claim-evidence-relation-family",
    familyMaterial,
  );
  if (revision > 1) {
    const expectedPriorId = deriveScopedRecordIdV01("claim-evidence-relation", {
      relation_family_id: relationFamilyId,
      revision: revision - 1,
    });
    if (priorRef?.record_id !== expectedPriorId) {
      failV01("relation_prior_identity_conflict", true);
    }
    if (
      operation === "supersede" &&
      !recordReferenceEqualV01(supersedesRef, priorRef)
    ) {
      failV01("relation_supersedes_identity_conflict", true);
    }
  }
  const relationId = deriveScopedRecordIdV01("claim-evidence-relation", {
    relation_family_id: relationFamilyId,
    revision,
  });
  const idempotencyKey = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      relation_version: CLAIM_EVIDENCE_RELATION_VERSION_V01,
      workspace_id: workspaceId,
      project_id: projectId,
      relation_family_id: relationFamilyId,
      revision,
    }),
  );
  const withoutIntegrity = {
    relation_version: CLAIM_EVIDENCE_RELATION_VERSION_V01,
    relation_id: relationId,
    relation_family_id: relationFamilyId,
    idempotency_key: idempotencyKey,
    family_namespace: familyNamespace,
    family_seed: familySeed,
    workspace_id: workspaceId,
    project_id: projectId,
    revision,
    prior_relation_ref: priorRef,
    operation_intent: operation,
    supersedes_relation_ref: supersedesRef,
    claim_ref: claimRef,
    evidence_ref: evidenceRef,
    relation_kind: input.relation_kind,
    applicability_scope: applicabilityScope,
    basis: input.basis,
    trust_class: trustClass,
    source_refs: sourceRefs,
    limitations,
    uncertainty,
    producer,
    created_at: createdAt,
    lifecycle: {
      record_status: "recorded" as const,
      candidate_status: "candidate" as const,
      review_status: "not_reviewed" as const,
      decision_ref: null,
      application_status: "not_applied" as const,
      transition_ref: null,
      relation_status: "not_established" as const,
    },
    material_boundary: createProjectVerifyMaterialBoundaryV01(),
    authority: {
      record_is_candidate_relation: true as const,
      relation_existence_proves_claim: false as const,
      evidence_count_calculates_truth: false as const,
      confidence_grants_authority: false as const,
      resolves_contradiction_automatically: false as const,
      selects_applied_current_head: false as const,
      creates_review_decision: false as const,
      grants_transition_eligibility: false as const,
      applies_transition: false as const,
      changes_semantic_state: false as const,
      changes_later_context: false as const,
      promotes_perspective_or_memory: false as const,
      authorizes_execution: false as const,
      authorizes_model_or_provider_call: false as const,
      authorizes_network_or_external_action: false as const,
    },
    integrity: {
      algorithm: "sha256" as const,
      canonicalization: PROJECT_VERIFY_MATERIAL_CANONICALIZATION_V01,
      fingerprint_scope:
        "claim_evidence_relation_without_integrity_fingerprint" as const,
    },
  };
  const record: ClaimEvidenceRelationV01 = {
    ...withoutIntegrity,
    integrity: {
      ...withoutIntegrity.integrity,
      fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(withoutIntegrity),
      ),
    },
  };
  assertSafeMaterialV01(record);
  return record;
}

export function validateEvidenceRecordV01(
  input: unknown,
): ProjectVerifyMaterialValidationResultV01<
  typeof EVIDENCE_RECORD_VERSION_V01
> {
  return validateRebuiltRecordV01(
    input,
    EVIDENCE_RECORD_VERSION_V01,
    "evidence_version",
    "evidence_record",
    () => rebuildEvidenceRecordV01(input),
  );
}

export function validateClaimRecordV01(
  input: unknown,
): ProjectVerifyMaterialValidationResultV01<typeof CLAIM_RECORD_VERSION_V01> {
  return validateRebuiltRecordV01(
    input,
    CLAIM_RECORD_VERSION_V01,
    "claim_version",
    "claim_record",
    () => rebuildClaimRecordV01(input),
  );
}

export function validateClaimEvidenceRelationV01(
  input: unknown,
): ProjectVerifyMaterialValidationResultV01<
  typeof CLAIM_EVIDENCE_RELATION_VERSION_V01
> {
  return validateRebuiltRecordV01(
    input,
    CLAIM_EVIDENCE_RELATION_VERSION_V01,
    "relation_version",
    "claim_evidence_relation",
    () => rebuildClaimEvidenceRelationV01(input),
  );
}

export function evidenceRecordReferenceV01(
  record: EvidenceRecordV01,
): EvidenceRecordReferenceV01 {
  assertValidEvidenceRecordV01(record);
  return {
    record_kind: "evidence_record",
    record_id: record.evidence_id,
    record_fingerprint: record.integrity.fingerprint,
  };
}

export function claimRecordReferenceV01(
  record: ClaimRecordV01,
): ClaimRecordReferenceV01 {
  assertValidClaimRecordV01(record);
  return {
    record_kind: "claim_record",
    record_id: record.claim_id,
    record_fingerprint: record.integrity.fingerprint,
  };
}

export function claimEvidenceRelationReferenceV01(
  record: ClaimEvidenceRelationV01,
): ClaimEvidenceRelationReferenceV01 {
  assertValidClaimEvidenceRelationV01(record);
  return {
    record_kind: "claim_evidence_relation",
    record_id: record.relation_id,
    record_fingerprint: record.integrity.fingerprint,
  };
}

export function canonicalizeProjectVerifyMaterialV01(value: unknown): string {
  return canonicalizeProtocolValueV01(value);
}

export function assertValidEvidenceRecordV01(
  input: unknown,
): asserts input is EvidenceRecordV01 {
  const validation = validateEvidenceRecordV01(input);
  if (validation.status !== "valid") {
    failV01(validation.errors[0]?.code ?? "evidence_record_invalid", true);
  }
}

export function assertValidClaimRecordV01(
  input: unknown,
): asserts input is ClaimRecordV01 {
  const validation = validateClaimRecordV01(input);
  if (validation.status !== "valid") {
    failV01(validation.errors[0]?.code ?? "claim_record_invalid", true);
  }
}

export function assertValidClaimEvidenceRelationV01(
  input: unknown,
): asserts input is ClaimEvidenceRelationV01 {
  const validation = validateClaimEvidenceRelationV01(input);
  if (validation.status !== "valid") {
    failV01(
      validation.errors[0]?.code ?? "claim_evidence_relation_invalid",
      true,
    );
  }
}

function rebuildEvidenceRecordV01(input: unknown): EvidenceRecordV01 {
  if (!isProtocolRecordV01(input)) failV01("evidence_record_malformed");
  assertSafeMaterialV01(input);
  if (input.evidence_version !== EVIDENCE_RECORD_VERSION_V01) {
    failV01("evidence_record_version_unsupported", true);
  }
  const record = input as unknown as EvidenceRecordV01;
  return buildEvidenceRecordV01({
    identity_namespace: record.identity_namespace,
    identity_key: record.identity_key,
    workspace_id: record.workspace_id,
    project_id: record.project_id,
    evidence_kind: record.evidence_kind,
    subject_refs: record.subject_refs,
    source_refs: record.source_refs,
    source_observed_or_reported_at: record.source_observed_or_reported_at,
    recorded_at: record.recorded_at,
    trust_class: record.trust_class,
    coverage: record.coverage,
    bounded_summary: record.bounded_summary,
    material_fingerprint: record.material_fingerprint,
    limitations: record.limitations,
    uncertainty: record.uncertainty,
    producer: record.producer,
  });
}

function rebuildClaimRecordV01(input: unknown): ClaimRecordV01 {
  if (!isProtocolRecordV01(input)) failV01("claim_record_malformed");
  assertSafeMaterialV01(input);
  if (input.claim_version !== CLAIM_RECORD_VERSION_V01) {
    failV01("claim_record_version_unsupported", true);
  }
  const record = input as unknown as ClaimRecordV01;
  return buildClaimRecordV01({
    family_namespace: record.family_namespace,
    family_seed: record.family_seed,
    workspace_id: record.workspace_id,
    project_id: record.project_id,
    revision: record.revision,
    prior_claim_ref: record.prior_claim_ref,
    operation_intent: record.operation_intent,
    operation_target_claim_ref: record.operation_target_claim_ref,
    proposition: record.proposition,
    subject_refs: record.subject_refs,
    applicability_scope: record.applicability_scope,
    source_refs: record.source_refs,
    limitations: record.limitations,
    uncertainty: record.uncertainty,
    producer: record.producer,
    created_at: record.created_at,
  });
}

function rebuildClaimEvidenceRelationV01(
  input: unknown,
): ClaimEvidenceRelationV01 {
  if (!isProtocolRecordV01(input)) {
    failV01("claim_evidence_relation_malformed");
  }
  assertSafeMaterialV01(input);
  if (input.relation_version !== CLAIM_EVIDENCE_RELATION_VERSION_V01) {
    failV01("claim_evidence_relation_version_unsupported", true);
  }
  const record = input as unknown as ClaimEvidenceRelationV01;
  return buildClaimEvidenceRelationV01({
    family_namespace: record.family_namespace,
    family_seed: record.family_seed,
    workspace_id: record.workspace_id,
    project_id: record.project_id,
    revision: record.revision,
    prior_relation_ref: record.prior_relation_ref,
    operation_intent: record.operation_intent,
    supersedes_relation_ref: record.supersedes_relation_ref,
    claim_ref: record.claim_ref,
    evidence_ref: record.evidence_ref,
    relation_kind: record.relation_kind,
    applicability_scope: record.applicability_scope,
    basis: record.basis,
    trust_class: record.trust_class,
    source_refs: record.source_refs,
    limitations: record.limitations,
    uncertainty: record.uncertainty,
    producer: record.producer,
    created_at: record.created_at,
  });
}

function validateRebuiltRecordV01<TVersion extends string>(
  input: unknown,
  version: TVersion,
  versionField: string,
  codePrefix: string,
  rebuild: () => unknown,
): ProjectVerifyMaterialValidationResultV01<TVersion> {
  try {
    const normalized = rebuild();
    if (
      canonicalizeProtocolValueV01(normalized) !==
      canonicalizeProtocolValueV01(input)
    ) {
      failV01(`${codePrefix}_not_canonical`, true);
    }
    return {
      status: "valid",
      normalized_protocol_version: version,
      errors: [],
      warnings: [],
    };
  } catch (error) {
    const issue =
      error instanceof ProjectVerifyMaterialErrorV01
        ? error
        : new ProjectVerifyMaterialErrorV01(`${codePrefix}_invalid`);
    return {
      status: issue.blocked ? "blocked" : "invalid",
      normalized_protocol_version:
        isProtocolRecordV01(input) && input[versionField] === version
          ? version
          : null,
      errors: [
        {
          severity: "error",
          code: issue.code,
          path: null,
          message: issue.code,
        },
      ],
      warnings: [],
    };
  }
}

function normalizeApplicabilityScopeV01(
  input: ClaimApplicabilityScopeV01,
): ClaimApplicabilityScopeV01 {
  if (!isProtocolRecordV01(input)) failV01("claim_scope_malformed");
  if (input.scope_version !== CLAIM_APPLICABILITY_SCOPE_VERSION_V01) {
    failV01("claim_scope_version_unsupported", true);
  }
  const normalized = createClaimApplicabilityScopeV01({
    subject_refs: input.subject_refs,
    environment_refs: input.environment_refs,
    temporal_scope: input.temporal_scope,
    condition: input.condition,
  });
  if (
    canonicalizeProtocolValueV01(normalized) !==
    canonicalizeProtocolValueV01(input)
  ) {
    failV01("claim_scope_fingerprint_mismatch", true);
  }
  return normalized;
}

function normalizeTemporalScopeV01(
  input: ClaimApplicabilityScopeV01["temporal_scope"],
): ClaimApplicabilityScopeV01["temporal_scope"] {
  if (!isProtocolRecordV01(input)) failV01("claim_temporal_scope_malformed");
  if (input.kind === "unbounded") {
    if (input.valid_from !== null || input.valid_until !== null) {
      failV01("claim_temporal_scope_unbounded_invalid");
    }
    return { kind: "unbounded", valid_from: null, valid_until: null };
  }
  if (input.kind !== "interval") failV01("claim_temporal_scope_kind_invalid");
  const validFrom = normalizeNullableTimestampV01(
    input.valid_from,
    "claim_valid_from_invalid",
  );
  const validUntil = normalizeNullableTimestampV01(
    input.valid_until,
    "claim_valid_until_invalid",
  );
  if (validFrom === null && validUntil === null) {
    failV01("claim_temporal_scope_interval_empty");
  }
  if (
    validFrom !== null &&
    validUntil !== null &&
    parseStrictIsoTimestampV01(validFrom)! >=
      parseStrictIsoTimestampV01(validUntil)!
  ) {
    failV01("claim_temporal_scope_interval_order_invalid");
  }
  return { kind: "interval", valid_from: validFrom, valid_until: validUntil };
}

function normalizeApplicabilityConditionV01(
  input: ClaimApplicabilityScopeV01["condition"],
): ClaimApplicabilityScopeV01["condition"] {
  if (!isProtocolRecordV01(input)) failV01("claim_condition_malformed");
  if (input.kind === "constant") {
    if (
      !["applicable", "not_applicable"].includes(String(input.value)) ||
      !Array.isArray(input.context_refs) ||
      input.context_refs.length !== 0
    ) {
      failV01("claim_constant_condition_invalid");
    }
    return {
      kind: "constant",
      value: input.value,
      context_refs: [],
    };
  }
  if (input.kind !== "exact_context" || input.value !== "applicable") {
    failV01("claim_exact_context_condition_invalid");
  }
  return {
    kind: "exact_context",
    value: "applicable",
    context_refs: normalizeRefsV01(input.context_refs, "context_refs", 1),
  };
}

function normalizeRefsV01(
  value: unknown,
  field: string,
  minimum: number,
): ExternalRefV01[] {
  if (!Array.isArray(value)) failV01(`${field}_malformed`);
  if (
    value.length < minimum ||
    value.length > PROJECT_VERIFY_MATERIAL_MAX_REFS_PER_COLLECTION_V01
  ) {
    failV01(`${field}_bound_invalid`);
  }
  const refs = value.map((ref, index) => {
    const issues: string[] = [];
    const sink: ProtocolValidationIssueSinkV01 = {
      error(code) {
        issues.push(code);
      },
      warning() {},
    };
    validateExternalRefStructureV01(ref, `$.${field}[${index}]`, sink);
    if (issues.length > 0) failV01(`${field}_external_ref_invalid`, true);
    const normalized = normalizeExternalRefPrimitiveV01(ref as ExternalRefV01);
    normalizeExternalRefTextV01(
      normalized.ref_type,
      `${field}_ref_type_invalid`,
    );
    normalizeExternalRefTextV01(
      normalized.external_id,
      `${field}_external_id_invalid`,
    );
    normalizeExternalRefTextV01(
      normalized.provider,
      `${field}_provider_invalid`,
    );
    normalizeExternalRefTextV01(normalized.host, `${field}_host_invalid`);
    normalizeExternalRefTextV01(
      normalized.source_ref,
      `${field}_source_ref_invalid`,
    );
    normalizeExternalRefTextV01(
      normalized.compatibility_namespace,
      `${field}_compatibility_namespace_invalid`,
    );
    return normalized;
  });
  refs.sort(compareExternalRefsV01);
  const canonical = refs.map(canonicalizeProtocolValueV01);
  if (new Set(canonical).size !== canonical.length) {
    failV01(`${field}_duplicate`, true);
  }
  return refs;
}

function normalizeTextCollectionV01(value: unknown, code: string): string[] {
  if (
    !Array.isArray(value) ||
    value.length > PROJECT_VERIFY_MATERIAL_MAX_COLLECTION_ITEMS_V01
  ) {
    failV01(code);
  }
  const normalized = value.map((item) => normalizeBoundedTextV01(item, code));
  normalized.sort();
  if (new Set(normalized).size !== normalized.length) failV01(code, true);
  return normalized;
}

function normalizeProducerV01(
  input: ProjectVerifyProducerV01,
): ProjectVerifyProducerV01 {
  if (
    !isProtocolRecordV01(input) ||
    !producerKindsV01.has(input.producer_kind)
  ) {
    failV01("project_verify_producer_invalid");
  }
  return {
    producer_kind: input.producer_kind,
    producer_profile: normalizeIdentityTextV01(
      input.producer_profile,
      "project_verify_producer_profile_invalid",
    ),
  };
}

function normalizeRecordReferenceV01<
  TKind extends "evidence_record" | "claim_record" | "claim_evidence_relation",
>(
  input: unknown,
  kind: TKind,
  code: string,
): {
  record_kind: TKind;
  record_id: string;
  record_fingerprint: string;
} | null {
  if (input === null) return null;
  if (!isProtocolRecordV01(input) || input.record_kind !== kind) {
    failV01(code, true);
  }
  return {
    record_kind: kind,
    record_id: normalizeIdentityTextV01(input.record_id, code),
    record_fingerprint: normalizeSha256V01(input.record_fingerprint, code),
  };
}

function validateClaimLineageShapeV01(input: {
  revision: number;
  operation: ClaimOperationIntentV01;
  priorRef: ClaimRecordReferenceV01 | null;
  operationTarget: ClaimRecordReferenceV01 | null;
}): void {
  if (input.revision === 1) {
    if (
      input.operation !== "create" ||
      input.priorRef !== null ||
      input.operationTarget !== null
    ) {
      failV01("claim_initial_revision_lineage_invalid", true);
    }
    return;
  }
  if (input.operation === "create" || input.priorRef === null) {
    failV01("claim_revision_lineage_invalid", true);
  }
  if (
    (input.operation === "revise" && input.operationTarget !== null) ||
    (["supersede", "retract"].includes(input.operation) &&
      input.operationTarget === null)
  ) {
    failV01("claim_operation_target_invalid", true);
  }
}

function validateRelationLineageShapeV01(input: {
  revision: number;
  operation: ClaimOperationIntentV01;
  priorRef: ClaimEvidenceRelationReferenceV01 | null;
  supersedesRef: ClaimEvidenceRelationReferenceV01 | null;
}): void {
  if (input.revision === 1) {
    if (
      input.operation !== "create" ||
      input.priorRef !== null ||
      input.supersedesRef !== null
    ) {
      failV01("relation_initial_revision_lineage_invalid", true);
    }
    return;
  }
  if (input.operation === "create" || input.priorRef === null) {
    failV01("relation_revision_lineage_invalid", true);
  }
  if (
    (input.operation === "supersede" && input.supersedesRef === null) ||
    (input.operation !== "supersede" && input.supersedesRef !== null)
  ) {
    failV01("relation_supersession_target_invalid", true);
  }
}

function recordReferenceEqualV01(
  left: ClaimRecordReferenceV01 | ClaimEvidenceRelationReferenceV01 | null,
  right: ClaimRecordReferenceV01 | ClaimEvidenceRelationReferenceV01 | null,
): boolean {
  return Boolean(
    left &&
    right &&
    left.record_kind === right.record_kind &&
    left.record_id === right.record_id &&
    left.record_fingerprint === right.record_fingerprint,
  );
}

function validateEvidenceKindTrustV01(
  kind: EvidenceRecordV01["evidence_kind"],
  trust: ExternalRefTrustClassV01,
): void {
  const exact: Partial<
    Record<EvidenceRecordV01["evidence_kind"], ExternalRefTrustClassV01>
  > = {
    direct_observation_material: "direct_local_observation",
    verified_external_observation_material: "verified_external_observation",
    host_attestation_material: "host_attestation",
    provider_report_material: "provider_report",
    user_declared_material: "user_declaration",
    imported_unverified_material: "imported_unverified",
    derived_interpretation_material: "derived_interpretation",
  };
  if (exact[kind] && exact[kind] !== trust) {
    failV01("evidence_kind_trust_conflict", true);
  }
}

function validateExactCriterionEvidenceV01(input: {
  evidence_kind: EvidenceRecordV01["evidence_kind"];
  identity_namespace: string;
  source_refs: ExternalRefV01[];
  trust_class: ExternalRefTrustClassV01;
  coverage: EvidenceRecordV01["coverage"];
  material_fingerprint: string | null;
  producer: ProjectVerifyProducerV01;
}): void {
  if (input.evidence_kind !== "exact_criterion_relation_material") return;
  const exactRefs = input.source_refs.filter(isExactCriterionRelationRefV01);
  const packetRefs = input.source_refs.filter(
    (ref) => ref.ref_type === "task_context_packet",
  );
  const receiptRefs = input.source_refs.filter(
    (ref) => ref.ref_type === "run_receipt",
  );
  const assessmentRefs = input.source_refs.filter(
    (ref) => ref.ref_type === "criterion_assessment",
  );
  const proposalRefs = input.source_refs.filter(
    (ref) => ref.ref_type === "episode_delta_proposal",
  );
  if (
    exactRefs.length !== 1 ||
    packetRefs.length !== 1 ||
    receiptRefs.length !== 1 ||
    assessmentRefs.length !== 1 ||
    proposalRefs.length !== 1 ||
    input.source_refs.length !== 5 ||
    input.producer.producer_kind !== "server_deterministic_evaluator" ||
    input.producer.producer_profile !==
      RUN_CRITERION_PROJECT_VERIFY_PRODUCER_PROFILE_V01 ||
    input.identity_namespace !== RUN_CRITERION_EVIDENCE_IDENTITY_NAMESPACE_V01
  ) {
    failV01("exact_criterion_evidence_source_invalid", true);
  }
  const parsed = parseCriterionRelationRefExternalIdV01(
    exactRefs[0]!.external_id,
  );
  if (
    !parsed ||
    parsed.trust_class !== input.trust_class ||
    parsed.relation_material_fingerprint !== input.material_fingerprint ||
    packetRefs[0]!.external_id !== parsed.packet_id ||
    packetRefs[0]!.source_ref !== parsed.packet_fingerprint ||
    (parsed.kind === "check" &&
      (receiptRefs[0]!.external_id !== parsed.receipt_id ||
        receiptRefs[0]!.source_ref !== parsed.receipt_fingerprint)) ||
    assessmentRefs[0]!.external_id !== assessmentRefs[0]!.source_ref ||
    !SHA256_PATTERN_V01.test(assessmentRefs[0]!.external_id) ||
    !SHA256_PATTERN_V01.test(receiptRefs[0]!.source_ref ?? "") ||
    !SHA256_PATTERN_V01.test(proposalRefs[0]!.source_ref ?? "")
  ) {
    failV01("exact_criterion_evidence_binding_invalid", true);
  }
  const expectedCoverage =
    parsed.kind === "applicability"
      ? "not_applicable"
      : parsed.direction === "missing"
        ? "partial"
        : "complete";
  if (input.coverage !== expectedCoverage) {
    failV01("exact_criterion_evidence_coverage_invalid", true);
  }
}

function validateRelationBasisTrustV01(
  basis: ClaimEvidenceRelationBasisV01,
  trust: ExternalRefTrustClassV01,
): void {
  if (
    basis === "observed" &&
    !["direct_local_observation", "verified_external_observation"].includes(
      trust,
    )
  ) {
    failV01("relation_observed_trust_invalid", true);
  }
  if (basis === "attested" && trust !== "host_attestation") {
    failV01("relation_attested_trust_invalid", true);
  }
  if (
    basis === "mixed" &&
    ![
      "direct_local_observation",
      "verified_external_observation",
      "host_attestation",
      "derived_interpretation",
    ].includes(trust)
  ) {
    failV01("relation_mixed_trust_invalid", true);
  }
}

function validateProducerTrustV01(
  producer: ProjectVerifyProducerV01,
  trust: ExternalRefTrustClassV01,
): void {
  const exactTrustByProducer: Partial<
    Record<ProjectVerifyProducerV01["producer_kind"], ExternalRefTrustClassV01>
  > = {
    host: "host_attestation",
    provider: "provider_report",
    user: "user_declaration",
    import: "imported_unverified",
  };
  const exact = exactTrustByProducer[producer.producer_kind];
  if (exact && trust !== exact) {
    failV01("project_verify_producer_trust_conflict", true);
  }
  if (
    producer.producer_kind === "model" &&
    !["provider_report", "derived_interpretation"].includes(trust)
  ) {
    failV01("project_verify_model_trust_invalid", true);
  }
}

function normalizeClaimOperationV01(value: unknown): ClaimOperationIntentV01 {
  if (!claimOperationsV01.has(String(value)))
    failV01("claim_operation_invalid");
  return value as ClaimOperationIntentV01;
}

function normalizeTrustClassV01(value: unknown): ExternalRefTrustClassV01 {
  if (!externalRefTrustClassesV01.has(String(value))) {
    failV01("project_verify_trust_class_invalid");
  }
  return value as ExternalRefTrustClassV01;
}

function normalizeRevisionV01(value: unknown, code: string): number {
  if (
    !Number.isSafeInteger(value) ||
    Number(value) < 1 ||
    Number(value) > PROJECT_VERIFY_MATERIAL_MAX_LINEAGE_REVISIONS_V01
  ) {
    failV01(code);
  }
  return Number(value);
}

function normalizeExternalRefTextV01(
  value: string | null | undefined,
  code: string,
): void {
  if (value == null) return;
  const maxCharacters =
    code.includes("external_id") || code.includes("source_ref")
      ? PROJECT_VERIFY_MATERIAL_MAX_TEXT_CHARACTERS_V01
      : IDENTITY_TEXT_MAX_V01;
  if (value.length === 0 || value.length > maxCharacters) failV01(code);
}

function normalizeIdentityTextV01(value: unknown, code: string): string {
  const text = normalizeProtocolTextV01(value);
  if (!text || text.length > IDENTITY_TEXT_MAX_V01) failV01(code);
  return text;
}

function normalizeBoundedTextV01(value: unknown, code: string): string {
  const text = normalizeProtocolTextV01(value);
  if (!text || text.length > PROJECT_VERIFY_MATERIAL_MAX_TEXT_CHARACTERS_V01) {
    failV01(code);
  }
  return text;
}

function normalizeTimestampV01(value: unknown, code: string): string {
  const text = normalizeProtocolTextV01(value);
  if (!text || parseStrictIsoTimestampV01(text) === null) failV01(code);
  return text;
}

function normalizeNullableTimestampV01(
  value: unknown,
  code: string,
): string | null {
  if (value === null) return null;
  return normalizeTimestampV01(value, code);
}

function normalizeSha256V01(value: unknown, code: string): string {
  const text = normalizeProtocolTextV01(value);
  if (!SHA256_PATTERN_V01.test(text)) failV01(code, true);
  return text;
}

function normalizeNullableSha256V01(
  value: unknown,
  code: string,
): string | null {
  return value === null ? null : normalizeSha256V01(value, code);
}

function deriveScopedRecordIdV01(prefix: string, material: unknown): string {
  return `${prefix}:${createProtocolSha256V01(
    canonicalizeProtocolValueV01(material),
  ).slice("sha256:".length)}`;
}

function assertSafeMaterialV01(value: unknown): void {
  const issues: Array<{ code: string; blocked: boolean }> = [];
  const sink: ProtocolValidationIssueSinkV01 = {
    error(code, _path, _message, blocked = false) {
      issues.push({ code, blocked });
    },
    warning() {},
  };
  scanForbiddenProtocolMaterialV01(value, "$", sink, {
    secret_material_message: "Secret-shaped material is forbidden.",
    provider_specific_field_message:
      "Provider-specific identity belongs only in ExternalRef material.",
    allowed_false_invariant_fields: new Set([
      "record_establishes_truth",
      "record_is_accepted_semantic_state",
      "satisfies_criterion_automatically",
      "activates_claim_automatically",
      "creates_review_decision",
      "grants_transition_eligibility",
      "applies_transition",
      "changes_semantic_state",
      "changes_later_context",
      "promotes_perspective_or_memory",
      "authorizes_execution",
      "authorizes_model_or_provider_call",
      "authorizes_network_or_external_action",
      "selects_applied_current_head",
      "validates_evidence",
      "relation_existence_proves_claim",
      "evidence_count_calculates_truth",
      "confidence_grants_authority",
      "resolves_contradiction_automatically",
      "raw_source_body_persisted",
      "raw_prompt_persisted",
      "raw_transcript_persisted",
      "raw_terminal_output_persisted",
      "raw_provider_output_persisted",
      "raw_diff_persisted",
      "hidden_reasoning_persisted",
      "credential_or_secret_persisted",
      "absolute_local_path_persisted",
    ]),
  });
  if (containsAbsoluteLocalPathV01(value)) {
    issues.push({ code: "absolute_local_path_material", blocked: true });
  }
  const issue = issues[0];
  if (issue) failV01(issue.code, issue.blocked);
}

function containsAbsoluteLocalPathV01(value: unknown): boolean {
  if (typeof value === "string") {
    return (
      /(?:^|[\s("'`\[])file:\/+/iu.test(value) ||
      /(?:^|[\s("'`\[])~[\\/]/u.test(value) ||
      /(?:^|[\s("'`\[])\\\\[^\s]/u.test(value) ||
      /(?:^|[\s("'`\[])[A-Za-z]:[\\/]/u.test(value) ||
      /(?:^|[\s("'`\[])\/(?=[A-Za-z0-9._~-])/u.test(value)
    );
  }
  if (Array.isArray(value)) return value.some(containsAbsoluteLocalPathV01);
  if (!isProtocolRecordV01(value)) return false;
  return Object.values(value).some(containsAbsoluteLocalPathV01);
}

function failV01(code: string, blocked = false): never {
  throw new ProjectVerifyMaterialErrorV01(code, blocked);
}
