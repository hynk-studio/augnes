import { criterionSpecificRelationsAvailableV01 } from "@/lib/vnext/episode-delta-proposal";
import { deriveCriterionIdentityV01 } from "@/lib/vnext/criterion-identity";
import {
  canonicalizeProtocolValueV01,
  compareExternalRefsV01,
  compareProtocolCodeUnitsV01,
  createProtocolSha256V01,
  normalizeExternalRefPrimitiveV01,
} from "@/lib/vnext/protocol-primitives";
import {
  isExactCriterionRelationRefV01,
  parseCriterionRelationRefExternalIdV01,
  validateCriterionAssessmentAgainstSourcesV01,
} from "@/lib/vnext/criterion-assessment";
import {
  buildClaimEvidenceRelationV01,
  buildClaimRecordV01,
  buildEvidenceRecordV01,
  canonicalizeProjectVerifyMaterialV01,
  claimRecordReferenceV01,
  createClaimApplicabilityScopeV01,
  evidenceRecordReferenceV01,
  assertValidClaimRecordV01,
} from "@/lib/vnext/project-verify-material";
import { materializeRunAssessmentProposalV01 } from "@/lib/vnext/run-assessment-proposal";
import { validateRunReceiptV01 } from "@/lib/vnext/run-receipt";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import {
  PROJECT_VERIFY_MATERIAL_MAX_COLLECTION_ITEMS_V01,
  RUN_CRITERION_CLAIM_FAMILY_NAMESPACE_V01,
  RUN_CRITERION_EVIDENCE_IDENTITY_NAMESPACE_V01,
  RUN_CRITERION_PROJECT_VERIFY_PRODUCER_PROFILE_V01,
  RUN_CRITERION_RELATION_FAMILY_NAMESPACE_V01,
  RUN_CRITERION_PROJECT_VERIFY_MATERIAL_VERSION_V01,
  type ClaimApplicabilityScopeV01,
  type ClaimEvidenceRelationBasisV01,
  type ClaimEvidenceRelationKindV01,
  type ClaimEvidenceRelationV01,
  type ClaimRecordV01,
  type EvidenceCoverageClassificationV01,
  type EvidenceRecordV01,
  type RunCriterionProjectVerifyMaterialV01,
} from "@/types/vnext/project-verify-material";
import type {
  CriterionAssessmentItemV01,
  CriterionAssessmentV01,
} from "@/types/vnext/criterion-assessment";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type {
  ExternalRefTrustClassV01,
  ExternalRefV01,
} from "@/types/vnext/external-ref";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

export {
  RUN_CRITERION_CLAIM_FAMILY_NAMESPACE_V01,
  RUN_CRITERION_EVIDENCE_IDENTITY_NAMESPACE_V01,
  RUN_CRITERION_PROJECT_VERIFY_PRODUCER_PROFILE_V01,
  RUN_CRITERION_RELATION_FAMILY_NAMESPACE_V01,
} from "@/types/vnext/project-verify-material";
const CRITERION_REF_NAMESPACE_V01 = "augnes.vnext.criterion.v0.1" as const;
const ASSESSMENT_REF_NAMESPACE_V01 =
  "augnes.vnext.criterion-assessment.v0.1" as const;
const PROPOSAL_REF_NAMESPACE_V01 =
  "augnes.vnext.episode-delta-proposal.v0.1" as const;

export class RunCriterionProjectVerifyMaterialErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "RunCriterionProjectVerifyMaterialErrorV01";
  }
}

export interface RunCriterionProjectVerifyMaterialInputV01 {
  packet: TaskContextPacketV01;
  receipt: RunReceiptV01;
  assessment: CriterionAssessmentV01;
  proposal: EpisodeDeltaProposalV01;
  existing_claim_records?: ClaimRecordV01[];
}

/**
 * Pure SR-2 producer for the merged SR-1 exact relation path. It revalidates
 * every source and the complete proposal snapshot, then records one bounded
 * Evidence item per exact relation ref. It does not persist, review, apply, or
 * select a Claim head.
 */
export function materializeRunCriterionProjectVerifyMaterialV01(
  input: RunCriterionProjectVerifyMaterialInputV01,
): RunCriterionProjectVerifyMaterialV01 {
  assertExactRunSourcesV01(input);
  const packetRef = cloneRefV01(input.assessment.packet_ref);
  const receiptRef = cloneRefV01(input.assessment.receipt_ref);
  const assessmentRef = refV01({
    ref_type: "criterion_assessment",
    external_id: input.assessment.assessment_fingerprint,
    source_ref: input.assessment.assessment_fingerprint,
    observed_at: input.receipt.recorded_at,
    compatibility_namespace: ASSESSMENT_REF_NAMESPACE_V01,
    trust_class: "derived_interpretation",
  });
  const proposalRef = refV01({
    ref_type: "episode_delta_proposal",
    external_id: input.proposal.proposal_id,
    source_ref: input.proposal.integrity.fingerprint,
    observed_at: input.proposal.created_at,
    compatibility_namespace: PROPOSAL_REF_NAMESPACE_V01,
    trust_class: "direct_local_observation",
  });
  const existingClaims = normalizeExistingClaimsV01(
    input.existing_claim_records ?? [],
    input.packet.workspace_id,
    input.packet.project_id,
  );
  const evidenceRecords: EvidenceRecordV01[] = [];
  const claimRecords: ClaimRecordV01[] = [];
  const relations: ClaimEvidenceRelationV01[] = [];

  for (const criterion of input.assessment.criteria) {
    const exactRelations = criterionRelationRefsV01(criterion);
    if (exactRelations.length === 0) continue;
    const criterionRef = criterionRefV01(criterion);
    const scope = createClaimApplicabilityScopeV01({
      subject_refs: [criterionRef],
      condition: {
        kind: "constant",
        value:
          criterion.status === "not_applicable"
            ? "not_applicable"
            : "applicable",
        context_refs: [],
      },
    });
    const candidateClaim = materializeRunCriterionClaimCandidateV01({
      packet: input.packet,
      criterion: {
        criterion_id: criterion.criterion_id,
        criterion: criterion.criterion,
      },
    });
    if (
      canonicalizeProjectVerifyMaterialV01(
        candidateClaim.applicability_scope,
      ) !== canonicalizeProjectVerifyMaterialV01(scope)
    ) {
      failV01("run_project_verify_claim_applicability_conflict");
    }
    const claim = selectExistingOrCandidateClaimV01({
      candidate: candidateClaim,
      existing_claims: existingClaims,
      criterion,
      scope,
    });
    claimRecords.push(claim);

    for (const relationSource of exactRelations) {
      const parsed = parseCriterionRelationRefExternalIdV01(
        relationSource.ref.external_id,
      );
      if (!parsed) failV01("run_project_verify_relation_ref_invalid");
      const relationMaterialFingerprint = parsed.relation_material_fingerprint;
      const evidence = buildEvidenceRecordV01({
        identity_namespace: RUN_CRITERION_EVIDENCE_IDENTITY_NAMESPACE_V01,
        identity_key: createProtocolSha256V01(
          canonicalizeProtocolValueV01(relationSource.ref.external_id),
        ),
        workspace_id: input.packet.workspace_id,
        project_id: input.packet.project_id,
        evidence_kind: "exact_criterion_relation_material",
        subject_refs: [criterionRef],
        source_refs: [
          relationSource.ref,
          packetRef,
          receiptRef,
          assessmentRef,
          proposalRef,
        ],
        source_observed_or_reported_at:
          relationSource.ref.observed_at ?? input.receipt.recorded_at,
        recorded_at: input.receipt.recorded_at,
        trust_class: parsed.trust_class,
        coverage: relationCoverageV01(parsed),
        bounded_summary: relationEvidenceSummaryV01(parsed),
        material_fingerprint: relationMaterialFingerprint,
        limitations: [
          "This record preserves one exact relation residue; it does not establish task truth, accept Evidence, or apply the Claim.",
        ],
        uncertainty:
          parsed.kind === "check" && parsed.direction === "missing"
            ? ["The exact required obligation is missing or inconclusive."]
            : [],
        producer: producerV01(),
      });
      evidenceRecords.push(evidence);
      const relation = buildClaimEvidenceRelationV01({
        family_origin: {
          origin_namespace: RUN_CRITERION_RELATION_FAMILY_NAMESPACE_V01,
          origin_seed: createProtocolSha256V01(
            canonicalizeProtocolValueV01(relationSource.ref.external_id),
          ),
          origin_profile: RUN_CRITERION_PROJECT_VERIFY_PRODUCER_PROFILE_V01,
          origin_producer_kind: "server_deterministic_evaluator",
        },
        workspace_id: input.packet.workspace_id,
        project_id: input.packet.project_id,
        revision: 1,
        prior_relation_ref: null,
        operation_intent: "create",
        supersedes_relation_ref: null,
        claim_ref: claimRecordReferenceV01(claim),
        evidence_ref: evidenceRecordReferenceV01(evidence),
        relation_kind: relationKindV01(parsed),
        applicability_scope: scope,
        basis: relationBasisV01(parsed),
        trust_class: parsed.trust_class,
        source_refs: [
          relationSource.ref,
          packetRef,
          receiptRef,
          assessmentRef,
          proposalRef,
        ],
        limitations: [
          "This immutable candidate relation neither proves the Claim nor resolves supporting, opposing, contradictory, or qualifying material.",
        ],
        uncertainty:
          parsed.kind === "check" && parsed.direction === "missing"
            ? ["The relation remains insufficient and non-conclusive."]
            : [],
        producer: producerV01(),
        created_at: input.receipt.recorded_at,
      });
      relations.push(relation);
    }
  }

  const uniqueClaims = uniqueByIdV01(claimRecords, (record) => record.claim_id);
  const uniqueEvidence = uniqueByIdV01(
    evidenceRecords,
    (record) => record.evidence_id,
  );
  const uniqueRelations = uniqueByIdV01(
    relations,
    (record) => record.relation_id,
  );
  if (
    uniqueEvidence.length > PROJECT_VERIFY_MATERIAL_MAX_COLLECTION_ITEMS_V01 ||
    uniqueClaims.length > PROJECT_VERIFY_MATERIAL_MAX_COLLECTION_ITEMS_V01 ||
    uniqueRelations.length > PROJECT_VERIFY_MATERIAL_MAX_COLLECTION_ITEMS_V01
  ) {
    failV01("run_project_verify_material_bound_exceeded");
  }
  const source = {
    packet: {
      packet_version: input.packet.packet_version,
      packet_id: input.packet.packet_id,
      packet_fingerprint: input.packet.integrity.fingerprint,
    },
    receipt: {
      receipt_version: input.receipt.receipt_version,
      receipt_id: input.receipt.receipt_id,
      receipt_fingerprint: input.receipt.integrity.fingerprint,
      run_id: input.receipt.run_id,
    },
    assessment: {
      assessment_version: input.assessment.assessment_version,
      assessment_fingerprint: input.assessment.assessment_fingerprint,
    },
    proposal: {
      proposal_version: input.proposal.proposal_version,
      proposal_id: input.proposal.proposal_id,
      proposal_fingerprint: input.proposal.integrity.fingerprint,
    },
  };
  const batchIdentity = {
    material_version: RUN_CRITERION_PROJECT_VERIFY_MATERIAL_VERSION_V01,
    workspace_id: input.packet.workspace_id,
    project_id: input.packet.project_id,
    source,
    evidence: uniqueEvidence.map((record) => ({
      id: record.evidence_id,
      fingerprint: record.integrity.fingerprint,
    })),
    claims: uniqueClaims.map((record) => ({
      id: record.claim_id,
      fingerprint: record.integrity.fingerprint,
    })),
    relations: uniqueRelations.map((record) => ({
      id: record.relation_id,
      fingerprint: record.integrity.fingerprint,
    })),
  };
  return {
    material_version: RUN_CRITERION_PROJECT_VERIFY_MATERIAL_VERSION_V01,
    workspace_id: input.packet.workspace_id,
    project_id: input.packet.project_id,
    source,
    evidence_records: uniqueEvidence,
    claim_records: uniqueClaims,
    relations: uniqueRelations,
    batch_idempotency_key: createProtocolSha256V01(
      canonicalizeProtocolValueV01(batchIdentity),
    ),
    authority: {
      explicit_admission_required: true,
      source_validation_grants_truth: false,
      evidence_is_accepted_automatically: false,
      claims_are_candidate_only: true,
      relations_are_candidate_only: true,
      creates_review_decision: false,
      applies_transition: false,
      changes_semantic_state: false,
      selects_applied_current_head: false,
      changes_later_context: false,
    },
  };
}

/**
 * Stable packet-scoped Claim candidate used by the source-bound producer and
 * persistence authenticity checks. Receipt outcome never changes this Claim's
 * family or bytes; only Evidence and relation material varies by receipt.
 */
export function materializeRunCriterionClaimCandidateV01(input: {
  packet: TaskContextPacketV01;
  criterion: { criterion_id: string; criterion: string };
}): ClaimRecordV01 {
  const planEntry = input.packet.criterion_verification_plan?.criteria.find(
    (entry) => entry.criterion_id === input.criterion.criterion_id,
  );
  if (
    validateTaskContextPacketV01(input.packet, {
      evaluated_at: input.packet.generated_at,
    }).status !== "valid" ||
    deriveCriterionIdentityV01(input.criterion.criterion) !==
      input.criterion.criterion_id ||
    !input.packet.task.success_criteria.some(
      (criterion) => criterion === input.criterion.criterion,
    ) ||
    !planEntry ||
    planEntry.criterion !== input.criterion.criterion
  ) {
    failV01("run_project_verify_claim_packet_invalid");
  }
  const criterionRef = criterionRefV01(input.criterion);
  const applicabilityScope = createClaimApplicabilityScopeV01({
    subject_refs: [criterionRef],
    condition: {
      kind: "constant",
      value: planEntry.applicability.value,
      context_refs: [],
    },
  });
  const packetRef = refV01({
    ref_type: "task_context_packet",
    external_id: input.packet.packet_id,
    source_ref: input.packet.integrity.fingerprint,
    observed_at: input.packet.generated_at,
    compatibility_namespace: input.packet.packet_version,
    trust_class: "direct_local_observation",
  });
  return buildClaimRecordV01({
    family_origin: {
      origin_namespace: RUN_CRITERION_CLAIM_FAMILY_NAMESPACE_V01,
      origin_seed: createProtocolSha256V01(
        canonicalizeProtocolValueV01({
          criterion_id: input.criterion.criterion_id,
          packet_id: input.packet.packet_id,
          packet_fingerprint: input.packet.integrity.fingerprint,
        }),
      ),
      origin_profile: RUN_CRITERION_PROJECT_VERIFY_PRODUCER_PROFILE_V01,
      origin_producer_kind: "server_deterministic_evaluator",
    },
    workspace_id: input.packet.workspace_id,
    project_id: input.packet.project_id,
    revision: 1,
    prior_claim_ref: null,
    operation_intent: "create",
    operation_target_claim_ref: null,
    proposition: input.criterion.criterion,
    subject_refs: [criterionRef],
    applicability_scope: applicabilityScope,
    source_refs: [criterionRef, packetRef],
    limitations: [
      "This immutable proposition is recorded as a candidate and is not accepted, applied, current, or true by record existence.",
    ],
    uncertainty: [],
    producer: producerV01(),
    created_at: input.packet.generated_at,
  });
}

function assertExactRunSourcesV01(
  input: RunCriterionProjectVerifyMaterialInputV01,
): void {
  if (
    validateTaskContextPacketV01(input.packet, {
      evaluated_at: input.packet.generated_at,
    }).status !== "valid"
  ) {
    failV01("run_project_verify_packet_invalid");
  }
  if (validateRunReceiptV01(input.receipt).status !== "valid") {
    failV01("run_project_verify_receipt_invalid");
  }
  const assessmentValidation = validateCriterionAssessmentAgainstSourcesV01({
    packet: input.packet,
    receipt: input.receipt,
    assessment: input.assessment,
  });
  if (assessmentValidation.status !== "valid") {
    failV01(assessmentValidation.code);
  }
  let expected: EpisodeDeltaProposalV01;
  try {
    expected = materializeRunAssessmentProposalV01({
      packet: input.packet,
      receipt: input.receipt,
      assessment: input.assessment,
    }).proposal;
  } catch {
    failV01("run_project_verify_proposal_source_invalid");
  }
  if (
    canonicalizeProtocolValueV01(expected) !==
    canonicalizeProtocolValueV01(input.proposal)
  ) {
    failV01("run_project_verify_proposal_source_conflict");
  }
  const hasRelations = input.assessment.criteria.some((criterion) =>
    [
      ...criterion.supporting_refs,
      ...criterion.opposing_refs,
      ...criterion.missing_refs,
    ].some(isExactCriterionRelationRefV01),
  );
  if (
    criterionSpecificRelationsAvailableV01({
      packet: input.packet,
      receipt: input.receipt,
      assessment: input.assessment,
    }) !== hasRelations
  ) {
    failV01("run_project_verify_relation_availability_conflict");
  }
}

function criterionRelationRefsV01(
  criterion: CriterionAssessmentItemV01,
): Array<{
  collection: "supporting" | "opposing" | "missing";
  ref: ExternalRefV01;
}> {
  const entries = [
    ...criterion.supporting_refs.map((ref) => ({
      collection: "supporting" as const,
      ref,
    })),
    ...criterion.opposing_refs.map((ref) => ({
      collection: "opposing" as const,
      ref,
    })),
    ...criterion.missing_refs.map((ref) => ({
      collection: "missing" as const,
      ref,
    })),
  ].filter((entry) => isExactCriterionRelationRefV01(entry.ref));
  for (const entry of entries) {
    const parsed = parseCriterionRelationRefExternalIdV01(
      entry.ref.external_id,
    );
    if (!parsed || parsed.criterion_id !== criterion.criterion_id) {
      failV01("run_project_verify_criterion_relation_binding_invalid");
    }
    const expectedCollection =
      parsed.kind === "applicability" || parsed.direction === "support"
        ? "supporting"
        : parsed.direction === "opposition"
          ? "opposing"
          : "missing";
    if (entry.collection !== expectedCollection) {
      failV01("run_project_verify_relation_direction_conflict");
    }
  }
  return entries.sort((left, right) =>
    compareExternalRefsV01(left.ref, right.ref),
  );
}

function selectExistingOrCandidateClaimV01(input: {
  candidate: ClaimRecordV01;
  existing_claims: ClaimRecordV01[];
  criterion: CriterionAssessmentItemV01;
  scope: ClaimApplicabilityScopeV01;
}): ClaimRecordV01 {
  const matching = input.existing_claims.filter(
    (record) => record.claim_family_id === input.candidate.claim_family_id,
  );
  const revisionOne = matching.filter((record) => record.revision === 1);
  if (
    revisionOne.length > 1 ||
    (matching.length > 0 && revisionOne.length !== 1)
  ) {
    failV01("run_project_verify_claim_family_lineage_conflict");
  }
  const existing = revisionOne[0];
  if (!existing) return input.candidate;
  if (
    canonicalizeProjectVerifyMaterialV01(existing) !==
    canonicalizeProjectVerifyMaterialV01(input.candidate)
  ) {
    failV01("run_project_verify_claim_family_material_conflict");
  }
  return existing;
}

function normalizeExistingClaimsV01(
  records: ClaimRecordV01[],
  workspaceId: string,
  projectId: string,
): ClaimRecordV01[] {
  const ids = new Set<string>();
  return records
    .map((record) => {
      assertValidClaimRecordV01(record);
      if (
        record.workspace_id !== workspaceId ||
        record.project_id !== projectId ||
        ids.has(record.claim_id)
      ) {
        failV01("run_project_verify_existing_claim_scope_conflict");
      }
      ids.add(record.claim_id);
      return structuredClone(record);
    })
    .sort((left, right) =>
      compareProtocolCodeUnitsV01(left.claim_id, right.claim_id),
    );
}

function relationCoverageV01(
  parsed: NonNullable<
    ReturnType<typeof parseCriterionRelationRefExternalIdV01>
  >,
): EvidenceCoverageClassificationV01 {
  if (parsed.kind === "applicability") return "not_applicable";
  return parsed.direction === "missing" ? "partial" : "complete";
}

function relationKindV01(
  parsed: NonNullable<
    ReturnType<typeof parseCriterionRelationRefExternalIdV01>
  >,
): ClaimEvidenceRelationKindV01 {
  if (parsed.kind === "applicability") return "qualifies";
  return parsed.direction === "support"
    ? "supports"
    : parsed.direction === "opposition"
      ? "opposes"
      : "insufficient";
}

function relationBasisV01(
  parsed: NonNullable<
    ReturnType<typeof parseCriterionRelationRefExternalIdV01>
  >,
): ClaimEvidenceRelationBasisV01 {
  if (parsed.kind === "applicability") return "observed";
  if (parsed.direction === "missing") return "insufficient";
  if (["observed", "attested", "mixed"].includes(parsed.basis)) {
    return parsed.basis as ClaimEvidenceRelationBasisV01;
  }
  return "insufficient";
}

function relationEvidenceSummaryV01(
  parsed: NonNullable<
    ReturnType<typeof parseCriterionRelationRefExternalIdV01>
  >,
): string {
  if (parsed.kind === "applicability") {
    return "The validated server-owned plan explicitly marks this exact criterion not applicable.";
  }
  if (parsed.direction === "support") {
    return "One exact required check residue supports this exact criterion obligation.";
  }
  if (parsed.direction === "opposition") {
    return "One exact required check residue opposes this exact criterion obligation.";
  }
  return "One exact required criterion obligation is missing or inconclusive.";
}

function criterionRefV01(
  criterion: Pick<CriterionAssessmentItemV01, "criterion_id" | "criterion">,
): ExternalRefV01 {
  return refV01({
    ref_type: "criterion",
    external_id: criterion.criterion_id,
    source_ref: criterion.criterion_id,
    compatibility_namespace: CRITERION_REF_NAMESPACE_V01,
    trust_class: "derived_interpretation",
  });
}

function producerV01() {
  return {
    producer_kind: "server_deterministic_evaluator" as const,
    producer_profile: RUN_CRITERION_PROJECT_VERIFY_PRODUCER_PROFILE_V01,
  };
}

function refV01(input: {
  ref_type: string;
  external_id: string;
  source_ref: string;
  trust_class: ExternalRefTrustClassV01;
  observed_at?: string;
  compatibility_namespace: string;
}): ExternalRefV01 {
  return normalizeExternalRefPrimitiveV01({
    ref_version: "external_ref.v0.1",
    ...input,
  });
}

function cloneRefV01(ref: ExternalRefV01): ExternalRefV01 {
  return normalizeExternalRefPrimitiveV01(structuredClone(ref));
}

function uniqueByIdV01<T>(records: T[], id: (record: T) => string): T[] {
  const unique = new Map<string, T>();
  for (const record of records) {
    const recordId = id(record);
    const existing = unique.get(recordId);
    if (
      existing &&
      canonicalizeProtocolValueV01(existing) !==
        canonicalizeProtocolValueV01(record)
    ) {
      failV01("run_project_verify_duplicate_record_conflict");
    }
    if (!existing) unique.set(recordId, record);
  }
  return [...unique.values()].sort((left, right) =>
    compareProtocolCodeUnitsV01(id(left), id(right)),
  );
}

function failV01(code: string): never {
  throw new RunCriterionProjectVerifyMaterialErrorV01(code);
}
