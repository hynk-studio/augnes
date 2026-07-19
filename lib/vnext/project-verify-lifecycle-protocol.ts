import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  isProtocolRecordV01,
  normalizeExternalRefPrimitiveV01,
  normalizeProtocolTextV01,
} from "@/lib/vnext/protocol-primitives";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import {
  PROJECT_VERIFY_LIFECYCLE_BINDING_VERSION_V01,
  PROJECT_VERIFY_LIFECYCLE_CANONICALIZATION_V01,
  PROJECT_VERIFY_LIFECYCLE_ENTITY_KINDS_V01,
  PROJECT_VERIFY_LIFECYCLE_MAX_ID_CHARACTERS_V01,
  PROJECT_VERIFY_LIFECYCLE_PROPOSAL_PROFILE_VERSION_V01,
  PROJECT_VERIFY_LIFECYCLE_TARGET_NAMESPACE_V01,
  type ProjectVerifyLifecycleBindingV01,
  type ProjectVerifyLifecycleBindingBuilderInputV01,
  type ProjectVerifyLifecycleCandidateBindingV01,
  type ProjectVerifyLifecycleCurrentHeadExpectationV01,
  type ProjectVerifyLifecycleEntityKindV01,
  type ProjectVerifyLifecycleProposalProfileV01,
  type ProjectVerifyLifecycleProposalProfileBuilderInputV01,
  type ProjectVerifyLifecycleRecordReferenceV01,
  type ProjectVerifyLifecycleRelationEndpointsV01,
  type ProjectVerifyLifecycleValidationIssueV01,
  type ProjectVerifyLifecycleValidationResultV01,
} from "@/types/vnext/project-verify-lifecycle";
import type {
  ClaimEvidenceRelationV01,
  ClaimOperationIntentV01,
  ClaimRecordV01,
} from "@/types/vnext/project-verify-material";

const SHA256_V01 = /^sha256:[a-f0-9]{64}$/u;
const OPERATIONS_V01 = new Set<ClaimOperationIntentV01>([
  "create",
  "revise",
  "supersede",
  "retract",
]);
const BINDING_KEYS_V01 = new Set([
  "binding_version",
  "entity_kind",
  "workspace_id",
  "project_id",
  "family_id",
  "family_target_ref",
  "family_origin_fingerprint",
  "applicability_scope_fingerprint",
  "selected_record_ref",
  "selected_record_revision",
  "selected_record_operation_intent",
  "prior_record_ref",
  "operation_target_record_ref",
  "relation_endpoints",
  "decision_candidate",
  "selected_candidate",
  "authority",
  "integrity",
]);
const PROFILE_KEYS_V01 = new Set([
  "proposal_profile",
  "admission_idempotency_key",
  "lifecycle_binding",
  "current_head_expectation",
  "authority",
  "integrity",
]);
const LIFECYCLE_AUTHORITY_V01 = {
  binding_is_review_decision: false,
  binding_is_gate_authorization: false,
  binding_is_applied_transition: false,
  establishes_truth: false,
  accepts_evidence: false,
  selects_applied_current_head: false,
  creates_semantic_state: false,
  changes_later_context: false,
} as const;

export function canonicalizeProjectVerifyLifecycleV01(value: unknown): string {
  return canonicalizeProtocolValueV01(value);
}

export function createProjectVerifyFamilyOriginFingerprintV01(
  familyOrigin: unknown,
): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(familyOrigin));
}

export function createProjectVerifyFamilyTargetRefV01(input: {
  entity_kind: ProjectVerifyLifecycleEntityKindV01;
  family_id: string;
  family_origin_fingerprint: string;
}): ExternalRefV01 {
  const familyId = requiredTextV01(input.family_id, "family_id");
  const originFingerprint = requiredShaV01(
    input.family_origin_fingerprint,
    "family_origin_fingerprint",
  );
  return normalizeExternalRefPrimitiveV01({
    ref_version: "external_ref.v0.1",
    ref_type:
      input.entity_kind === "claim_record"
        ? "claim_family"
        : "claim_evidence_relation_family",
    external_id: familyId,
    source_ref: originFingerprint,
    compatibility_namespace: PROJECT_VERIFY_LIFECYCLE_TARGET_NAMESPACE_V01,
    trust_class: "derived_interpretation",
  });
}

export function createProjectVerifyLifecycleRecordRefV01(
  record: ClaimRecordV01 | ClaimEvidenceRelationV01,
): ProjectVerifyLifecycleRecordReferenceV01 {
  return "claim_version" in record
    ? {
        record_kind: "claim_record",
        record_id: record.claim_id,
        record_fingerprint: record.integrity.fingerprint,
      }
    : {
        record_kind: "claim_evidence_relation",
        record_id: record.relation_id,
        record_fingerprint: record.integrity.fingerprint,
      };
}

export function mapProjectVerifyOperationToProposalOperationV01(
  operation: ClaimOperationIntentV01,
): "add" | "revise" | "supersede" | "retract" {
  return operation === "create" ? "add" : operation;
}

export function createProjectVerifyLifecycleAdmissionIdempotencyKeyV01(input: {
  workspace_id: string;
  project_id: string;
  entity_kind: ProjectVerifyLifecycleEntityKindV01;
  selected_record_ref: ProjectVerifyLifecycleRecordReferenceV01;
}): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      profile_version: PROJECT_VERIFY_LIFECYCLE_PROPOSAL_PROFILE_VERSION_V01,
      workspace_id: requiredTextV01(input.workspace_id, "workspace_id"),
      project_id: requiredTextV01(input.project_id, "project_id"),
      entity_kind: input.entity_kind,
      selected_record_ref: normalizeRecordRefV01(input.selected_record_ref),
    }),
  );
}

export function buildProjectVerifyLifecycleBindingV01(
  input: ProjectVerifyLifecycleBindingBuilderInputV01,
): ProjectVerifyLifecycleBindingV01 {
  const entityKind = normalizeEntityKindV01(input.entity_kind);
  const targetRef = createProjectVerifyFamilyTargetRefV01({
    entity_kind: entityKind,
    family_id: input.family_id,
    family_origin_fingerprint: input.family_origin_fingerprint,
  });
  if (
    canonicalizeProtocolValueV01(
      normalizeExternalRefPrimitiveV01(input.family_target_ref),
    ) !== canonicalizeProtocolValueV01(targetRef)
  ) {
    throw new Error("family_target_binding_conflict");
  }
  const selected = normalizeRecordRefV01(input.selected_record_ref);
  const decisionCandidate = normalizeCandidateV01(input.decision_candidate);
  const selectedCandidate = normalizeCandidateV01(input.selected_candidate);
  if (canonical(decisionCandidate) !== canonical(selectedCandidate)) {
    throw new Error("project_verify_lifecycle_candidate_binding_conflict");
  }
  const withoutIntegrityFingerprint = {
    binding_version: PROJECT_VERIFY_LIFECYCLE_BINDING_VERSION_V01,
    entity_kind: entityKind,
    workspace_id: requiredTextV01(input.workspace_id, "workspace_id"),
    project_id: requiredTextV01(input.project_id, "project_id"),
    family_id: requiredTextV01(input.family_id, "family_id"),
    family_target_ref: targetRef,
    family_origin_fingerprint: requiredShaV01(
      input.family_origin_fingerprint,
      "family_origin_fingerprint",
    ),
    applicability_scope_fingerprint: requiredShaV01(
      input.applicability_scope_fingerprint,
      "applicability_scope_fingerprint",
    ),
    selected_record_ref: selected,
    selected_record_revision: normalizeRevisionV01(
      input.selected_record_revision,
    ),
    selected_record_operation_intent: normalizeOperationV01(
      input.selected_record_operation_intent,
    ),
    prior_record_ref: input.prior_record_ref
      ? normalizeRecordRefV01(input.prior_record_ref)
      : null,
    operation_target_record_ref: input.operation_target_record_ref
      ? normalizeRecordRefV01(input.operation_target_record_ref)
      : null,
    relation_endpoints: input.relation_endpoints
      ? normalizeRelationEndpointsV01(input.relation_endpoints)
      : null,
    decision_candidate: decisionCandidate,
    selected_candidate: selectedCandidate,
    authority: LIFECYCLE_AUTHORITY_V01,
    integrity: {
      algorithm: "sha256" as const,
      canonicalization: PROJECT_VERIFY_LIFECYCLE_CANONICALIZATION_V01,
      fingerprint_scope:
        "project_verify_lifecycle_binding_without_integrity_fingerprint" as const,
    },
  };
  assertBindingSemanticsV01(withoutIntegrityFingerprint);
  return {
    ...withoutIntegrityFingerprint,
    integrity: {
      ...withoutIntegrityFingerprint.integrity,
      fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(withoutIntegrityFingerprint),
      ),
    },
  };
}

export function buildProjectVerifyLifecycleProposalProfileV01(
  input: ProjectVerifyLifecycleProposalProfileBuilderInputV01,
): ProjectVerifyLifecycleProposalProfileV01 {
  const binding = normalizeProjectVerifyLifecycleBindingV01(
    input.lifecycle_binding,
  );
  const head = normalizeHeadExpectationV01(input.current_head_expectation);
  if (
    binding.selected_record_operation_intent === "create"
      ? head.presence !== "absent" || head.revision !== 0
      : head.presence !== "present" ||
        head.revision !== binding.selected_record_revision - 1 ||
        canonical(head.selected_record_ref) !==
          canonical(binding.prior_record_ref)
  ) {
    throw new Error("project_verify_lifecycle_head_expectation_conflict");
  }
  const withoutIntegrityFingerprint = {
    proposal_profile: PROJECT_VERIFY_LIFECYCLE_PROPOSAL_PROFILE_VERSION_V01,
    admission_idempotency_key:
      createProjectVerifyLifecycleAdmissionIdempotencyKeyV01(binding),
    lifecycle_binding: binding,
    current_head_expectation: head,
    authority: LIFECYCLE_AUTHORITY_V01,
    integrity: {
      algorithm: "sha256" as const,
      canonicalization: PROJECT_VERIFY_LIFECYCLE_CANONICALIZATION_V01,
      fingerprint_scope:
        "project_verify_lifecycle_proposal_without_profile_fingerprint" as const,
    },
  };
  return {
    ...withoutIntegrityFingerprint,
    integrity: {
      ...withoutIntegrityFingerprint.integrity,
      fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(withoutIntegrityFingerprint),
      ),
    },
  };
}

export function normalizeProjectVerifyLifecycleBindingV01(
  value: ProjectVerifyLifecycleBindingV01,
): ProjectVerifyLifecycleBindingV01 {
  const validation = validateProjectVerifyLifecycleBindingV01(value);
  if (validation.status !== "valid") {
    throw new Error(
      validation.errors[0]?.code ?? "project_verify_lifecycle_binding_invalid",
    );
  }
  return JSON.parse(
    canonicalizeProtocolValueV01(value),
  ) as ProjectVerifyLifecycleBindingV01;
}

export function normalizeProjectVerifyLifecycleProposalProfileV01(
  value: ProjectVerifyLifecycleProposalProfileV01,
): ProjectVerifyLifecycleProposalProfileV01 {
  const validation = validateProjectVerifyLifecycleProposalProfileV01(value);
  if (validation.status !== "valid") {
    throw new Error(
      validation.errors[0]?.code ?? "project_verify_lifecycle_profile_invalid",
    );
  }
  return JSON.parse(
    canonicalizeProtocolValueV01(value),
  ) as ProjectVerifyLifecycleProposalProfileV01;
}

export function validateProjectVerifyLifecycleBindingV01(
  value: unknown,
): ProjectVerifyLifecycleValidationResultV01 {
  const errors: ProjectVerifyLifecycleValidationIssueV01[] = [];
  try {
    if (!isProtocolRecordV01(value)) throw new Error("binding_not_object");
    rejectUnknownV01(value, BINDING_KEYS_V01, "$.binding");
    if (
      value.binding_version !== PROJECT_VERIFY_LIFECYCLE_BINDING_VERSION_V01
    ) {
      throw new Error("binding_version_invalid");
    }
    const rebuilt = buildProjectVerifyLifecycleBindingV01({
      entity_kind: value.entity_kind as ProjectVerifyLifecycleEntityKindV01,
      workspace_id: value.workspace_id as string,
      project_id: value.project_id as string,
      family_id: value.family_id as string,
      family_target_ref: value.family_target_ref as ExternalRefV01,
      family_origin_fingerprint: value.family_origin_fingerprint as string,
      applicability_scope_fingerprint:
        value.applicability_scope_fingerprint as string,
      selected_record_ref:
        value.selected_record_ref as ProjectVerifyLifecycleRecordReferenceV01,
      selected_record_revision: value.selected_record_revision as number,
      selected_record_operation_intent:
        value.selected_record_operation_intent as ClaimOperationIntentV01,
      prior_record_ref:
        value.prior_record_ref as ProjectVerifyLifecycleRecordReferenceV01 | null,
      operation_target_record_ref:
        value.operation_target_record_ref as ProjectVerifyLifecycleRecordReferenceV01 | null,
      relation_endpoints:
        value.relation_endpoints as ProjectVerifyLifecycleRelationEndpointsV01 | null,
      decision_candidate:
        value.decision_candidate as ProjectVerifyLifecycleCandidateBindingV01,
      selected_candidate:
        value.selected_candidate as ProjectVerifyLifecycleCandidateBindingV01,
    });
    if (canonical(rebuilt) !== canonical(value)) {
      throw new Error("binding_canonical_material_mismatch");
    }
  } catch (error) {
    errors.push(issueV01(error, "$.binding"));
  }
  return { status: errors.length ? "invalid" : "valid", errors };
}

export function validateProjectVerifyLifecycleProposalProfileV01(
  value: unknown,
): ProjectVerifyLifecycleValidationResultV01 {
  const errors: ProjectVerifyLifecycleValidationIssueV01[] = [];
  try {
    if (!isProtocolRecordV01(value)) throw new Error("profile_not_object");
    rejectUnknownV01(value, PROFILE_KEYS_V01, "$.project_verify_lifecycle");
    if (
      value.proposal_profile !==
      PROJECT_VERIFY_LIFECYCLE_PROPOSAL_PROFILE_VERSION_V01
    ) {
      throw new Error("profile_version_invalid");
    }
    const bindingValidation = validateProjectVerifyLifecycleBindingV01(
      value.lifecycle_binding,
    );
    if (bindingValidation.status !== "valid") {
      throw new Error(bindingValidation.errors[0]?.code ?? "binding_invalid");
    }
    const rebuilt = buildProjectVerifyLifecycleProposalProfileV01({
      lifecycle_binding:
        value.lifecycle_binding as ProjectVerifyLifecycleBindingV01,
      current_head_expectation:
        value.current_head_expectation as ProjectVerifyLifecycleCurrentHeadExpectationV01,
    });
    if (canonical(rebuilt) !== canonical(value)) {
      throw new Error("profile_canonical_material_mismatch");
    }
  } catch (error) {
    errors.push(issueV01(error, "$.project_verify_lifecycle"));
  }
  return { status: errors.length ? "invalid" : "valid", errors };
}

export function createProjectVerifyLifecycleProtocolMetadataV01() {
  return {
    canonicalization: PROJECT_VERIFY_LIFECYCLE_CANONICALIZATION_V01,
    binding_version: PROJECT_VERIFY_LIFECYCLE_BINDING_VERSION_V01,
    proposal_profile_version:
      PROJECT_VERIFY_LIFECYCLE_PROPOSAL_PROFILE_VERSION_V01,
  } as const;
}

function assertBindingSemanticsV01(
  binding: Omit<ProjectVerifyLifecycleBindingV01, "integrity"> & {
    integrity: Omit<
      ProjectVerifyLifecycleBindingV01["integrity"],
      "fingerprint"
    >;
  },
): void {
  const expectedKind =
    binding.entity_kind === "claim_record"
      ? "claim_record"
      : "claim_evidence_relation";
  if (binding.selected_record_ref.record_kind !== expectedKind) {
    throw new Error("selected_record_kind_conflict");
  }
  if (
    binding.family_target_ref.external_id !== binding.family_id ||
    binding.family_target_ref.source_ref !== binding.family_origin_fingerprint
  ) {
    throw new Error("family_target_binding_conflict");
  }
  if (binding.selected_record_operation_intent === "create") {
    if (
      binding.selected_record_revision !== 1 ||
      binding.prior_record_ref !== null ||
      binding.operation_target_record_ref !== null
    ) {
      throw new Error("initial_record_lineage_conflict");
    }
  } else {
    if (binding.selected_record_revision < 2 || !binding.prior_record_ref) {
      throw new Error("record_prior_binding_missing");
    }
    if (
      binding.prior_record_ref.record_kind !== expectedKind ||
      ((binding.selected_record_operation_intent === "supersede" ||
        binding.selected_record_operation_intent === "retract") &&
        canonical(binding.operation_target_record_ref) !==
          canonical(binding.prior_record_ref)) ||
      (binding.selected_record_operation_intent === "revise" &&
        binding.operation_target_record_ref !== null)
    ) {
      throw new Error("record_operation_target_conflict");
    }
  }
  if (
    (binding.entity_kind === "claim_record" &&
      binding.relation_endpoints !== null) ||
    (binding.entity_kind === "claim_evidence_relation" &&
      binding.relation_endpoints === null)
  ) {
    throw new Error("relation_endpoint_shape_conflict");
  }
}

function normalizeHeadExpectationV01(
  value: ProjectVerifyLifecycleCurrentHeadExpectationV01,
): ProjectVerifyLifecycleCurrentHeadExpectationV01 {
  const revision = Number(value.revision);
  if (!Number.isSafeInteger(revision) || revision < 0) {
    throw new Error("current_head_revision_invalid");
  }
  if (value.presence === "absent") {
    if (
      revision !== 0 ||
      value.state_content_fingerprint !== null ||
      value.source_transition_receipt_id !== null ||
      value.source_transition_receipt_fingerprint !== null ||
      value.selected_record_ref !== null
    ) {
      throw new Error("absent_head_material_conflict");
    }
    return {
      presence: "absent",
      revision: 0,
      state_content_fingerprint: null,
      source_transition_receipt_id: null,
      source_transition_receipt_fingerprint: null,
      selected_record_ref: null,
    };
  }
  if (value.presence !== "present" || revision < 1) {
    throw new Error("current_head_presence_invalid");
  }
  return {
    presence: "present",
    revision,
    state_content_fingerprint: requiredShaV01(
      value.state_content_fingerprint,
      "state_content_fingerprint",
    ),
    source_transition_receipt_id: requiredTextV01(
      value.source_transition_receipt_id,
      "source_transition_receipt_id",
    ),
    source_transition_receipt_fingerprint: requiredShaV01(
      value.source_transition_receipt_fingerprint,
      "source_transition_receipt_fingerprint",
    ),
    selected_record_ref: normalizeRecordRefV01(value.selected_record_ref!),
  };
}

function normalizeRecordRefV01(
  value: ProjectVerifyLifecycleRecordReferenceV01,
): ProjectVerifyLifecycleRecordReferenceV01 {
  if (!isProtocolRecordV01(value)) throw new Error("record_ref_invalid");
  if (
    value.record_kind !== "claim_record" &&
    value.record_kind !== "claim_evidence_relation"
  ) {
    throw new Error("record_ref_kind_invalid");
  }
  return {
    record_kind: value.record_kind,
    record_id: requiredTextV01(value.record_id, "record_id"),
    record_fingerprint: requiredShaV01(
      value.record_fingerprint,
      "record_fingerprint",
    ),
  } as ProjectVerifyLifecycleRecordReferenceV01;
}

function normalizeRelationEndpointsV01(
  value: ProjectVerifyLifecycleRelationEndpointsV01,
): ProjectVerifyLifecycleRelationEndpointsV01 {
  if (!isProtocolRecordV01(value))
    throw new Error("relation_endpoints_invalid");
  const claim = value.claim_ref;
  const evidence = value.evidence_ref;
  if (
    !isProtocolRecordV01(claim) ||
    claim.record_kind !== "claim_record" ||
    !isProtocolRecordV01(evidence) ||
    evidence.record_kind !== "evidence_record"
  ) {
    throw new Error("relation_endpoint_ref_invalid");
  }
  return {
    claim_ref: {
      record_kind: "claim_record",
      record_id: requiredTextV01(claim.record_id, "claim_ref.record_id"),
      record_fingerprint: requiredShaV01(
        claim.record_fingerprint,
        "claim_ref.record_fingerprint",
      ),
    },
    evidence_ref: {
      record_kind: "evidence_record",
      record_id: requiredTextV01(evidence.record_id, "evidence_ref.record_id"),
      record_fingerprint: requiredShaV01(
        evidence.record_fingerprint,
        "evidence_ref.record_fingerprint",
      ),
    },
  };
}

function normalizeCandidateV01(
  value: ProjectVerifyLifecycleCandidateBindingV01,
): ProjectVerifyLifecycleCandidateBindingV01 {
  if (!isProtocolRecordV01(value)) throw new Error("candidate_binding_invalid");
  return {
    candidate_id: requiredTextV01(value.candidate_id, "candidate_id"),
    candidate_fingerprint: requiredShaV01(
      value.candidate_fingerprint,
      "candidate_fingerprint",
    ),
  };
}

function normalizeEntityKindV01(
  value: ProjectVerifyLifecycleEntityKindV01,
): ProjectVerifyLifecycleEntityKindV01 {
  if (!PROJECT_VERIFY_LIFECYCLE_ENTITY_KINDS_V01.includes(value)) {
    throw new Error("entity_kind_invalid");
  }
  return value;
}

function normalizeOperationV01(value: ClaimOperationIntentV01) {
  if (!OPERATIONS_V01.has(value)) throw new Error("record_operation_invalid");
  return value;
}

function normalizeRevisionV01(value: number): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error("selected_record_revision_invalid");
  }
  return value;
}

function requiredTextV01(value: unknown, field: string): string {
  if (typeof value !== "string") throw new Error(`${field}_invalid`);
  const normalized = normalizeProtocolTextV01(value);
  if (
    !normalized ||
    normalized.length > PROJECT_VERIFY_LIFECYCLE_MAX_ID_CHARACTERS_V01
  ) {
    throw new Error(`${field}_invalid`);
  }
  return normalized;
}

function requiredShaV01(value: unknown, field: string): string {
  const normalized = requiredTextV01(value, field);
  if (!SHA256_V01.test(normalized)) throw new Error(`${field}_invalid`);
  return normalized;
}

function rejectUnknownV01(
  value: Record<string, unknown>,
  keys: ReadonlySet<string>,
  path: string,
): void {
  const unknown = Object.keys(value).find((key) => !keys.has(key));
  if (unknown) throw new Error(`${path}.${unknown}:unknown_field`);
}

function canonical(value: unknown): string {
  return canonicalizeProtocolValueV01(value);
}

function issueV01(
  error: unknown,
  path: string,
): ProjectVerifyLifecycleValidationIssueV01 {
  const message = error instanceof Error ? error.message : "invalid_material";
  return { code: message.split(":").at(-1) ?? message, path, message };
}
