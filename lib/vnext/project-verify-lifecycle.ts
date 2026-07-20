import {
  buildEpisodeDeltaProposalV01,
  validateEpisodeDeltaProposalV01,
} from "@/lib/vnext/episode-delta-proposal";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  normalizeExternalRefPrimitiveV01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import {
  buildProjectVerifyLifecycleBindingV01,
  buildProjectVerifyLifecycleProposalProfileV01,
  createProjectVerifyFamilyOriginFingerprintV01,
  createProjectVerifyFamilyTargetRefV01,
  createProjectVerifyLifecycleAdmissionIdempotencyKeyV01,
  createProjectVerifyLifecycleRecordRefV01,
  mapProjectVerifyOperationToProposalOperationV01,
} from "@/lib/vnext/project-verify-lifecycle-protocol";
import {
  validateClaimEvidenceRelationV01,
  validateClaimRecordV01,
} from "@/lib/vnext/project-verify-material";
import { createEpisodeDeltaCandidateFingerprintV01 } from "@/lib/vnext/review-decision";
import type {
  EpisodeDeltaProposalDeltaCandidateV01,
  EpisodeDeltaProposalV01,
} from "@/types/vnext/episode-delta-proposal";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import {
  PROJECT_VERIFY_LIFECYCLE_BINDING_VERSION_V01,
  PROJECT_VERIFY_LIFECYCLE_PROPOSAL_PROFILE_VERSION_V01,
  PROJECT_VERIFY_LIFECYCLE_TARGET_NAMESPACE_V01,
  type ProjectVerifyLifecycleCurrentHeadExpectationV01,
  type ProjectVerifyLifecycleEntityKindV01,
  type ProjectVerifyLifecycleRecordReferenceV01,
} from "@/types/vnext/project-verify-lifecycle";
import type {
  ClaimEvidenceRelationV01,
  ClaimRecordV01,
} from "@/types/vnext/project-verify-material";

export const PROJECT_VERIFY_LIFECYCLE_MATERIALIZER_VERSION_V01 =
  "project_verify_lifecycle_materializer.v0.1" as const;

export class ProjectVerifyLifecycleMaterializationErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "ProjectVerifyLifecycleMaterializationErrorV01";
  }
}

export interface ProjectVerifyLifecycleProposalAdmissionIdentityV01 {
  proposal_profile: typeof PROJECT_VERIFY_LIFECYCLE_PROPOSAL_PROFILE_VERSION_V01;
  workspace_id: string;
  project_id: string;
  entity_kind: ProjectVerifyLifecycleEntityKindV01;
  family_id: string;
  selected_record_ref: ProjectVerifyLifecycleRecordReferenceV01;
  admission_idempotency_key: string;
}

export interface ProjectVerifyLifecycleProposalMaterializationV01 {
  identity: ProjectVerifyLifecycleProposalAdmissionIdentityV01;
  proposal: EpisodeDeltaProposalV01;
}

export type ProjectVerifyLifecycleSelectedRecordV01 =
  ClaimRecordV01 | ClaimEvidenceRelationV01;

export interface ProjectVerifyLifecycleProposalMaterializationInputV01 {
  selected_record: ProjectVerifyLifecycleSelectedRecordV01;
  current_head_expectation: ProjectVerifyLifecycleCurrentHeadExpectationV01;
  /** Exact server-owned time at which the family head was read. */
  observed_at: string;
}

/**
 * Pure deterministic proposal materializer for one explicitly selected SR-2
 * record and one already source-authenticated current-head snapshot. Reading
 * the immutable record, its complete family lineage, and the live head belongs
 * to the canonical admission wrapper; this function reads no clock, database,
 * process, model, provider, or network state.
 */
export function materializeProjectVerifyLifecycleProposalV01(
  input: ProjectVerifyLifecycleProposalMaterializationInputV01,
): ProjectVerifyLifecycleProposalMaterializationV01 {
  const source = normalizeSelectedRecordV01(input.selected_record);
  const observedAt = exactTimestampV01(input.observed_at, "observed_at");
  if (Date.parse(observedAt) < Date.parse(source.record.created_at)) {
    failV01("project_verify_lifecycle_observation_predates_selected_record");
  }
  const selectedRecordRef = createProjectVerifyLifecycleRecordRefV01(
    source.record,
  );
  const familyOriginFingerprint = createProjectVerifyFamilyOriginFingerprintV01(
    source.record.family_origin,
  );
  const familyTargetRef = createProjectVerifyFamilyTargetRefV01({
    entity_kind: source.entity_kind,
    family_id: source.family_id,
    family_origin_fingerprint: familyOriginFingerprint,
  });
  const identity = deriveProjectVerifyLifecycleProposalAdmissionIdentityV01({
    workspace_id: source.record.workspace_id,
    project_id: source.record.project_id,
    entity_kind: source.entity_kind,
    family_id: source.family_id,
    selected_record_ref: selectedRecordRef,
  });
  const selectedRecordExternalRef = recordExternalRefV01(
    selectedRecordRef,
    observedAt,
  );
  const headObservationRef = currentHeadObservationRefV01({
    identity,
    family_target_ref: familyTargetRef,
    expectation: input.current_head_expectation,
    observed_at: observedAt,
  });
  const currentStateSourceRefs = currentHeadSourceRefsV01(
    input.current_head_expectation,
    observedAt,
  );
  const observationId = stableIdV01("project-verify-lifecycle-observation", {
    identity,
    current_head_expectation: input.current_head_expectation,
  });
  const candidateId = stableIdV01("project-verify-lifecycle-candidate", {
    identity,
  });
  const operation = mapProjectVerifyOperationToProposalOperationV01(
    source.record.operation_intent,
  );
  const candidate: EpisodeDeltaProposalDeltaCandidateV01 = {
    candidate_id: candidateId,
    delta_type: "validation_delta",
    operation,
    title:
      source.entity_kind === "claim_record"
        ? `${operationLabelV01(operation)} Claim revision ${source.record.revision}`
        : `${operationLabelV01(operation)} Claim-Evidence relation revision ${source.record.revision}`,
    current_state: {
      knowledge_status: "known",
      bounded_summary:
        input.current_head_expectation.presence === "present"
          ? `The exact family head currently binds ${input.current_head_expectation.selected_record_ref?.record_id}; this is applied identity, not truth.`
          : "No applied semantic head exists for this exact family target.",
      source_material_ids: [observationId],
      source_refs: uniqueRefsV01([
        headObservationRef,
        ...currentStateSourceRefs,
      ]),
    },
    proposed_state_summary: proposedStateSummaryV01(source.record),
    target_refs: [familyTargetRef],
    basis_material_ids: [observationId],
    source_refs: uniqueRefsV01([
      selectedRecordExternalRef,
      headObservationRef,
      ...source.record.source_refs,
      ...currentStateSourceRefs,
    ]),
    uncertainties: [...source.record.uncertainty],
    limitations: uniqueStringsV01([
      ...source.record.limitations,
      "The selected immutable record remains candidate material and does not establish truth or Evidence acceptance.",
      "Only the existing ReviewDecision, semantic gate, and successfully committed Transition may change the applied family head.",
    ]),
    review_required: true,
  };
  const candidateBinding = {
    candidate_id: candidate.candidate_id,
    candidate_fingerprint: createEpisodeDeltaCandidateFingerprintV01(candidate),
  };
  const lifecycleBinding = buildProjectVerifyLifecycleBindingV01({
    entity_kind: source.entity_kind,
    workspace_id: source.record.workspace_id,
    project_id: source.record.project_id,
    family_id: source.family_id,
    family_target_ref: familyTargetRef,
    family_origin_fingerprint: familyOriginFingerprint,
    applicability_scope_fingerprint:
      source.record.applicability_scope.scope_fingerprint,
    selected_record_ref: selectedRecordRef,
    selected_record_revision: source.record.revision,
    selected_record_operation_intent: source.record.operation_intent,
    prior_record_ref: source.prior_record_ref,
    operation_target_record_ref: source.operation_target_record_ref,
    relation_endpoints: source.relation_endpoints,
    decision_candidate: candidateBinding,
    selected_candidate: candidateBinding,
  });
  const profile = buildProjectVerifyLifecycleProposalProfileV01({
    lifecycle_binding: lifecycleBinding,
    current_head_expectation: input.current_head_expectation,
  });
  if (
    profile.admission_idempotency_key !== identity.admission_idempotency_key
  ) {
    failV01("project_verify_lifecycle_idempotency_conflict");
  }
  const proposal = buildEpisodeDeltaProposalV01({
    workspace_id: source.record.workspace_id,
    project_id: source.record.project_id,
    created_at: observedAt,
    status: "pending_review",
    bounded_summary:
      source.entity_kind === "claim_record"
        ? `Review application of one exact immutable Claim revision ${source.record.revision}.`
        : `Review application of one exact immutable Claim-Evidence relation revision ${source.record.revision}.`,
    task_context_packet_ref: null,
    run_receipt_refs: [],
    project_verify_lifecycle: profile,
    observations: [
      {
        material_id: observationId,
        material_kind: "canonical_project_verify_record_and_head_bytes",
        bounded_summary:
          "Core directly read the exact immutable SR-2 record and exact semantic family-head bytes; this observation establishes source identity only, not proposition truth or Evidence acceptance.",
        event_at: null,
        observed_at: observedAt,
        observer_ref: headObservationRef,
        trust_class: "direct_local_observation",
        source_run_receipt_refs: [],
        source_refs: uniqueRefsV01([
          selectedRecordExternalRef,
          ...source.record.source_refs,
          ...currentStateSourceRefs,
        ]),
        subject_refs: [familyTargetRef, selectedRecordExternalRef],
      },
    ],
    attestations: [],
    inferences: [],
    proposed_deltas: [candidate],
    conflicts: [],
    missing_information: [],
    uncertainties: source.record.uncertainty.map((summary, index) => ({
      uncertainty_id: stableIdV01("project-verify-lifecycle-uncertainty", {
        candidate_id: candidateId,
        index,
        summary,
      }),
      bounded_summary: summary,
      related_material_ids: [observationId],
      related_delta_ids: [candidateId],
      source_refs: [selectedRecordExternalRef],
    })),
    limitations: uniqueStringsV01([
      ...source.record.limitations,
      "This proposal is a review-required candidate, not a ReviewDecision, gate authorization, applied Transition, truth result, or accepted Evidence.",
    ]),
    source_status: {
      coverage: "complete",
      currentness: "fresh",
      as_of: observedAt,
      review_required: true,
      basis:
        "Complete coverage refers only to exact canonical record and family-head identity bytes; it does not establish semantic truth.",
      source_refs: uniqueRefsV01([
        selectedRecordExternalRef,
        headObservationRef,
        ...currentStateSourceRefs,
      ]),
    },
    source_refs: uniqueRefsV01([
      selectedRecordExternalRef,
      headObservationRef,
      ...source.record.source_refs,
      ...currentStateSourceRefs,
    ]),
    compatibility: {
      source_contracts: [
        source.recordVersion,
        PROJECT_VERIFY_LIFECYCLE_BINDING_VERSION_V01,
        PROJECT_VERIFY_LIFECYCLE_PROPOSAL_PROFILE_VERSION_V01,
      ],
      unmapped_fields: [],
      warnings: [
        "No proposition similarity, relation inference, model judgment, Evidence count, or confidence score selected this record or family head.",
      ],
      external_refs: [],
    },
    authority_notes: [
      "The direct observation covers canonical local bytes only and does not relabel the Claim or relation as observed truth.",
      "Proposal creation performs no review, gate authorization, Transition, semantic-state write, later-context change, provider call, or external action.",
    ],
  });
  const validation = validateEpisodeDeltaProposalV01(proposal);
  if (validation.status !== "valid") {
    failV01(
      `project_verify_lifecycle_proposal_invalid:${validation.errors
        .map((issue) => `${issue.code}@${issue.path ?? "$"}`)
        .join(",")}`,
    );
  }
  return { identity, proposal };
}

export function deriveProjectVerifyLifecycleProposalAdmissionIdentityV01(input: {
  workspace_id: string;
  project_id: string;
  entity_kind: ProjectVerifyLifecycleEntityKindV01;
  family_id: string;
  selected_record_ref: ProjectVerifyLifecycleRecordReferenceV01;
}): ProjectVerifyLifecycleProposalAdmissionIdentityV01 {
  return {
    proposal_profile: PROJECT_VERIFY_LIFECYCLE_PROPOSAL_PROFILE_VERSION_V01,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    entity_kind: input.entity_kind,
    family_id: input.family_id,
    selected_record_ref: structuredClone(input.selected_record_ref),
    admission_idempotency_key:
      createProjectVerifyLifecycleAdmissionIdempotencyKeyV01(input),
  };
}

function normalizeSelectedRecordV01(
  record: ProjectVerifyLifecycleSelectedRecordV01,
):
  | {
      entity_kind: "claim_record";
      family_id: string;
      record: ClaimRecordV01;
      prior_record_ref: ClaimRecordV01["prior_claim_ref"];
      operation_target_record_ref: ClaimRecordV01["operation_target_claim_ref"];
      relation_endpoints: null;
      recordVersion: string;
    }
  | {
      entity_kind: "claim_evidence_relation";
      family_id: string;
      record: ClaimEvidenceRelationV01;
      prior_record_ref: ClaimEvidenceRelationV01["prior_relation_ref"];
      operation_target_record_ref: ClaimEvidenceRelationV01["prior_relation_ref"];
      relation_endpoints: {
        claim_ref: ClaimEvidenceRelationV01["claim_ref"];
        evidence_ref: ClaimEvidenceRelationV01["evidence_ref"];
      };
      recordVersion: string;
    } {
  if ("claim_version" in record) {
    if (validateClaimRecordV01(record).status !== "valid") {
      failV01("project_verify_lifecycle_claim_invalid");
    }
    return {
      entity_kind: "claim_record",
      family_id: record.claim_family_id,
      record: structuredClone(record),
      prior_record_ref: structuredClone(record.prior_claim_ref),
      operation_target_record_ref: structuredClone(
        record.operation_target_claim_ref,
      ),
      relation_endpoints: null,
      recordVersion: record.claim_version,
    };
  }
  if (validateClaimEvidenceRelationV01(record).status !== "valid") {
    failV01("project_verify_lifecycle_relation_invalid");
  }
  return {
    entity_kind: "claim_evidence_relation",
    family_id: record.relation_family_id,
    record: structuredClone(record),
    prior_record_ref: structuredClone(record.prior_relation_ref),
    operation_target_record_ref:
      record.operation_intent === "supersede"
        ? structuredClone(record.supersedes_relation_ref)
        : record.operation_intent === "retract"
          ? structuredClone(record.prior_relation_ref)
          : null,
    relation_endpoints: {
      claim_ref: structuredClone(record.claim_ref),
      evidence_ref: structuredClone(record.evidence_ref),
    },
    recordVersion: record.relation_version,
  };
}

function proposedStateSummaryV01(
  record: ProjectVerifyLifecycleSelectedRecordV01,
): string {
  return "claim_version" in record
    ? `Apply exact Claim record ${record.claim_id} revision ${record.revision} as the semantic projection for its exact family; proposition truth remains not established.`
    : `Apply exact ${record.relation_kind} relation record ${record.relation_id} revision ${record.revision} as the semantic projection for its exact family; relation existence does not prove the Claim.`;
}

function recordExternalRefV01(
  recordRef: ProjectVerifyLifecycleRecordReferenceV01,
  observedAt: string,
): ExternalRefV01 {
  return normalizeExternalRefPrimitiveV01({
    ref_version: "external_ref.v0.1",
    ref_type: recordRef.record_kind,
    external_id: recordRef.record_id,
    source_ref: recordRef.record_fingerprint,
    observed_at: observedAt,
    compatibility_namespace: PROJECT_VERIFY_LIFECYCLE_TARGET_NAMESPACE_V01,
    trust_class: "direct_local_observation",
  });
}

function currentHeadObservationRefV01(input: {
  identity: ProjectVerifyLifecycleProposalAdmissionIdentityV01;
  family_target_ref: ExternalRefV01;
  expectation: ProjectVerifyLifecycleCurrentHeadExpectationV01;
  observed_at: string;
}): ExternalRefV01 {
  const fingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      observation_profile: "project_verify_lifecycle_head_observation.v0.1",
      workspace_id: input.identity.workspace_id,
      project_id: input.identity.project_id,
      family_target_ref: input.family_target_ref,
      current_head_expectation: input.expectation,
    }),
  );
  return normalizeExternalRefPrimitiveV01({
    ref_version: "external_ref.v0.1",
    ref_type: "project_verify_family_head_observation",
    external_id: `project-verify-head:${fingerprint.slice(7, 39)}`,
    source_ref: fingerprint,
    observed_at: input.observed_at,
    compatibility_namespace: PROJECT_VERIFY_LIFECYCLE_TARGET_NAMESPACE_V01,
    trust_class: "direct_local_observation",
  });
}

function currentHeadSourceRefsV01(
  expectation: ProjectVerifyLifecycleCurrentHeadExpectationV01,
  observedAt: string,
): ExternalRefV01[] {
  if (expectation.presence === "absent") return [];
  if (
    !expectation.selected_record_ref ||
    !expectation.state_content_fingerprint ||
    !expectation.source_transition_receipt_id ||
    !expectation.source_transition_receipt_fingerprint
  ) {
    failV01("project_verify_lifecycle_present_head_incomplete");
  }
  return uniqueRefsV01([
    recordExternalRefV01(expectation.selected_record_ref, observedAt),
    normalizeExternalRefPrimitiveV01({
      ref_version: "external_ref.v0.1",
      ref_type: "semantic_state_content",
      external_id: expectation.state_content_fingerprint,
      source_ref: expectation.state_content_fingerprint,
      observed_at: observedAt,
      compatibility_namespace: PROJECT_VERIFY_LIFECYCLE_TARGET_NAMESPACE_V01,
      trust_class: "direct_local_observation",
    }),
    normalizeExternalRefPrimitiveV01({
      ref_version: "external_ref.v0.1",
      ref_type: "state_transition_receipt",
      external_id: expectation.source_transition_receipt_id,
      source_ref: expectation.source_transition_receipt_fingerprint,
      observed_at: observedAt,
      compatibility_namespace: PROJECT_VERIFY_LIFECYCLE_TARGET_NAMESPACE_V01,
      trust_class: "direct_local_observation",
    }),
  ]);
}

function stableIdV01(prefix: string, material: unknown): string {
  const fingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(material),
  );
  return `${prefix}:${fingerprint.slice(7, 39)}`;
}

function operationLabelV01(
  operation: EpisodeDeltaProposalDeltaCandidateV01["operation"],
): string {
  switch (operation) {
    case "add":
      return "Create";
    case "revise":
      return "Revise";
    case "supersede":
      return "Supersede";
    case "retract":
      return "Retract";
    default:
      failV01("project_verify_lifecycle_operation_invalid");
  }
}

function uniqueRefsV01(refs: ExternalRefV01[]): ExternalRefV01[] {
  const byCanonical = new Map<string, ExternalRefV01>();
  for (const ref of refs) {
    const normalized = normalizeExternalRefPrimitiveV01(ref);
    byCanonical.set(canonicalizeProtocolValueV01(normalized), normalized);
  }
  return [...byCanonical.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, ref]) => ref);
}

function uniqueStringsV01(values: string[]): string[] {
  return [
    ...new Set(values.map((value) => value.trim()).filter(Boolean)),
  ].sort();
}

function exactTimestampV01(value: unknown, field: string): string {
  if (typeof value !== "string") failV01(`${field}_invalid`);
  const normalized = value.trim();
  if (parseStrictIsoTimestampV01(normalized) === null) {
    failV01(`${field}_invalid`);
  }
  return normalized;
}

function failV01(code: string): never {
  throw new ProjectVerifyLifecycleMaterializationErrorV01(code);
}
