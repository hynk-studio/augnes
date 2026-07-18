import {
  buildEpisodeDeltaProposalV01,
  collectRunAssessmentProposalSourceMaterialBoundViolationsV01,
  createRunAssessmentProposalSourceMaterialBoundaryV01,
  validateEpisodeDeltaProposalV01,
} from "@/lib/vnext/episode-delta-proposal";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  evaluateCriterionAssessmentV01,
  validateCriterionAssessmentV01,
} from "@/lib/vnext/criterion-assessment";
import { validateRunReceiptV01 } from "@/lib/vnext/run-receipt";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import type { CriterionAssessmentV01 } from "@/types/vnext/criterion-assessment";
import {
  RUN_ASSESSMENT_PROPOSAL_PROFILE_VERSION_V01,
  type EpisodeDeltaProposalAttestationTrustClassV01,
  type EpisodeDeltaProposalAttestationV01,
  type EpisodeDeltaProposalInferenceV01,
  type EpisodeDeltaProposalObservationV01,
  type EpisodeDeltaProposalSourceAssessmentV01,
  type EpisodeDeltaProposalV01,
} from "@/types/vnext/episode-delta-proposal";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type {
  RunReceiptAttestationTrustClassV01,
  RunReceiptV01,
} from "@/types/vnext/run-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

const RUN_ASSESSMENT_PROPOSAL_NAMESPACE_V01 =
  "augnes.vnext.run-assessment-proposal.v0.1";

export class RunAssessmentProposalMaterializationErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "RunAssessmentProposalMaterializationErrorV01";
  }
}

export interface RunAssessmentProposalAdmissionIdentityV01 {
  admission_profile: typeof RUN_ASSESSMENT_PROPOSAL_PROFILE_VERSION_V01;
  workspace_id: string;
  project_id: string;
  work_ref: ExternalRefV01 | null;
  packet_id: string;
  packet_fingerprint: string;
  receipt_id: string;
  receipt_fingerprint: string;
  run_id: string;
  assessment_version: CriterionAssessmentV01["assessment_version"];
  assessment_fingerprint: string;
  idempotency_key: string;
}

export interface RunAssessmentProposalMaterializationV01 {
  identity: RunAssessmentProposalAdmissionIdentityV01;
  proposal: EpisodeDeltaProposalV01;
}

/**
 * Pure deterministic R6-B materializer. It accepts one already source-bound
 * packet, receipt, and assessment; reads no clock or process state; and makes
 * no database, network, provider, or model call.
 */
export function materializeRunAssessmentProposalV01(input: {
  packet: TaskContextPacketV01;
  receipt: RunReceiptV01;
  assessment: CriterionAssessmentV01;
}): RunAssessmentProposalMaterializationV01 {
  assertExactSourceMaterialV01(input);
  const identity = deriveRunAssessmentProposalAdmissionIdentityV01(input);
  const receiptRef = cloneRefV01(input.assessment.receipt_ref);
  const packetRef = cloneRefV01(input.assessment.packet_ref);
  const runRef = sourceRefV01({
    ref_type: "run",
    external_id: input.receipt.run_id,
    source_ref: input.receipt.integrity.fingerprint,
    trust_class: "direct_local_observation",
    observed_at: input.receipt.recorded_at,
  });
  const assessmentRef = sourceRefV01({
    ref_type: "criterion_assessment",
    external_id: input.assessment.assessment_fingerprint,
    source_ref: input.assessment.assessment_fingerprint,
    trust_class: "derived_interpretation",
    observed_at: input.receipt.recorded_at,
  });
  const interpreterRef = sourceRefV01({
    ref_type: "criterion_assessment_evaluator",
    external_id: input.assessment.assessment_version,
    source_ref: input.assessment.assessment_fingerprint,
    trust_class: "derived_interpretation",
    observed_at: input.receipt.recorded_at,
  });
  const receiptMaterialId = `receipt-record:${input.receipt.receipt_id}`;
  const observations = [
    {
      material_id: receiptMaterialId,
      material_kind: "persisted_run_receipt",
      bounded_summary:
        "The exact immutable RunReceipt is persisted; receipt persistence and execution completion do not establish task success.",
      event_at: input.receipt.finished_at,
      observed_at: input.receipt.recorded_at,
      observer_ref: receiptRef,
      trust_class: "direct_local_observation" as const,
      source_run_receipt_refs: [receiptRef],
      source_refs: [receiptRef, runRef],
      subject_refs: [runRef],
    },
    ...projectObservationsV01(input.receipt, receiptRef, runRef),
  ];
  const { attestations, derivedAttestations } = projectAttestationsV01(
    input.receipt,
    receiptRef,
  );
  const criterionInferences = assessmentInferencesV01({
    assessment: input.assessment,
    receipt_ref: receiptRef,
    packet_ref: packetRef,
    assessment_ref: assessmentRef,
    interpreter_ref: interpreterRef,
    inferred_at: input.receipt.recorded_at,
    basis_material_id: receiptMaterialId,
  });
  const inferences: EpisodeDeltaProposalInferenceV01[] = [
    ...derivedAttestations.map((item) => ({
      material_id: `receipt-inference:${item.attestation_id}`,
      material_kind: item.attestation_kind,
      bounded_summary: item.summary,
      inferred_at: item.reported_at,
      interpreter_ref: interpreterRef,
      trust_class: "derived_interpretation" as const,
      basis_material_ids: [receiptMaterialId],
      source_run_receipt_refs: [receiptRef],
      source_refs: cloneRefsV01([item.reporter_ref, ...item.source_refs]),
      subject_refs: cloneRefsV01(item.subject_refs),
    })),
    ...criterionInferences,
  ];
  const candidateMaterial = proposalCandidatesV01({
    packet: input.packet,
    assessment: input.assessment,
    assessment_ref: assessmentRef,
    packet_ref: packetRef,
    receipt_ref: receiptRef,
  });
  const sourceAssessment = sourceAssessmentSnapshotV01({
    identity,
    packet: input.packet,
    receipt: input.receipt,
    assessment: input.assessment,
    run_ref: runRef,
    packet_ref: packetRef,
    receipt_ref: receiptRef,
  });
  if (
    collectRunAssessmentProposalSourceMaterialBoundViolationsV01(
      sourceAssessment,
    ).length > 0
  ) {
    failV01("run_assessment_proposal_source_material_bound_exceeded");
  }
  const proposal = buildEpisodeDeltaProposalV01({
    workspace_id: input.packet.workspace_id,
    project_id: input.packet.project_id,
    created_at: input.receipt.recorded_at,
    status: "pending_review",
    bounded_summary:
      "Review validation candidates derived from one exact persisted run assessment.",
    task_context_packet_ref: packetRef,
    run_receipt_refs: [receiptRef],
    source_assessment: sourceAssessment,
    observations,
    attestations,
    inferences,
    proposed_deltas: candidateMaterial.candidates,
    conflicts: [],
    missing_information: candidateMaterial.missing_information,
    uncertainties: candidateMaterial.uncertainties,
    limitations: [
      "TaskContextPacket v0.1 and RunReceipt v0.1 expose no protocol-owned criterion-to-residue relation.",
      "Execution completion, passed transport checks, skipped checks, changed artifacts, and unsupported coverage do not establish task success.",
      "The proposal is pending review and does not create a ReviewDecision, Transition, accepted Evidence, semantic state, or later context.",
    ],
    source_status: {
      coverage: "partial",
      currentness: sourceCurrentnessV01(input.packet),
      as_of:
        input.packet.source_status.currentness.status === "unknown"
          ? null
          : input.packet.source_status.currentness.as_of ??
            input.receipt.recorded_at,
      review_required: true,
      basis:
        "Exact persisted packet, receipt, run, and criterion-assessment lineage is available; criterion-specific relations remain unavailable.",
      source_refs: [packetRef, receiptRef, assessmentRef],
    },
    source_refs: [
      packetRef,
      receiptRef,
      runRef,
      assessmentRef,
      ...(input.receipt.work_ref ? [cloneRefV01(input.receipt.work_ref)] : []),
    ],
    compatibility: {
      source_contracts: [
        input.packet.packet_version,
        input.receipt.receipt_version,
        input.assessment.assessment_version,
        RUN_ASSESSMENT_PROPOSAL_PROFILE_VERSION_V01,
        ...input.receipt.compatibility.source_contracts,
      ],
      unmapped_fields: input.receipt.compatibility.unmapped_fields.map(
        (entry) => ({ ...entry }),
      ),
      warnings: [
        ...input.receipt.compatibility.warnings,
        "No fuzzy, lexical, embedding, model, or provider relation was used to classify task criteria.",
      ],
      external_refs: cloneRefsV01(input.receipt.compatibility.external_refs),
    },
    authority_notes: [
      "The embedded criterion assessment is a bounded source snapshot, not a second assessment authority.",
      "Pending validation candidates remain operation unknown and cannot be accepted as semantic state under the current pilot policy.",
    ],
  });
  const validation = validateEpisodeDeltaProposalV01(proposal);
  if (validation.status !== "valid") {
    throw new RunAssessmentProposalMaterializationErrorV01(
      `run_assessment_proposal_output_invalid:${validation.errors
        .map((issue) => `${issue.code}@${issue.path ?? "$"}`)
        .join(",")}`,
    );
  }
  return { identity, proposal };
}

export function deriveRunAssessmentProposalAdmissionIdentityV01(input: {
  packet: TaskContextPacketV01;
  receipt: RunReceiptV01;
  assessment: CriterionAssessmentV01;
}): RunAssessmentProposalAdmissionIdentityV01 {
  const withoutKey = {
    admission_profile: RUN_ASSESSMENT_PROPOSAL_PROFILE_VERSION_V01,
    workspace_id: input.packet.workspace_id,
    project_id: input.packet.project_id,
    work_ref: input.receipt.work_ref ? cloneRefV01(input.receipt.work_ref) : null,
    packet_id: input.packet.packet_id,
    packet_fingerprint: input.packet.integrity.fingerprint,
    receipt_id: input.receipt.receipt_id,
    receipt_fingerprint: input.receipt.integrity.fingerprint,
    run_id: input.receipt.run_id,
    assessment_version: input.assessment.assessment_version,
    assessment_fingerprint: input.assessment.assessment_fingerprint,
  };
  return {
    ...withoutKey,
    idempotency_key: createProtocolSha256V01(
      canonicalizeProtocolValueV01(withoutKey),
    ),
  };
}

function assertExactSourceMaterialV01(input: {
  packet: TaskContextPacketV01;
  receipt: RunReceiptV01;
  assessment: CriterionAssessmentV01;
}): void {
  if (
    validateTaskContextPacketV01(input.packet, {
      evaluated_at: input.packet.generated_at,
    }).status !== "valid"
  ) {
    failV01("run_assessment_proposal_packet_invalid");
  }
  if (validateRunReceiptV01(input.receipt).status !== "valid") {
    failV01("run_assessment_proposal_receipt_invalid");
  }
  if (validateCriterionAssessmentV01(input.assessment).status !== "valid") {
    failV01("run_assessment_proposal_assessment_invalid");
  }
  const recomputed = evaluateCriterionAssessmentV01({
    packet: input.packet,
    receipt: input.receipt,
  });
  if (
    canonicalizeProtocolValueV01(recomputed) !==
    canonicalizeProtocolValueV01(input.assessment)
  ) {
    failV01("run_assessment_proposal_assessment_conflict");
  }
  if (
    input.packet.workspace_id !== input.receipt.workspace_id ||
    input.packet.project_id !== input.receipt.project_id ||
    input.packet.workspace_id !== input.assessment.workspace_id ||
    input.packet.project_id !== input.assessment.project_id ||
    input.receipt.run_id !== input.assessment.run_id ||
    input.assessment.packet_ref.external_id !== input.packet.packet_id ||
    input.assessment.packet_ref.source_ref !== input.packet.integrity.fingerprint ||
    input.assessment.receipt_ref.external_id !== input.receipt.receipt_id ||
    input.assessment.receipt_ref.source_ref !== input.receipt.integrity.fingerprint
  ) {
    failV01("run_assessment_proposal_source_binding_conflict");
  }
}

function projectObservationsV01(
  receipt: RunReceiptV01,
  receiptRef: ExternalRefV01,
  runRef: ExternalRefV01,
): EpisodeDeltaProposalObservationV01[] {
  return receipt.observations.map((item) => ({
    material_id: `receipt-observation:${item.observation_id}`,
    material_kind: item.observation_kind,
    bounded_summary: item.summary,
    event_at: item.event_at,
    observed_at: item.observed_at,
    observer_ref: cloneRefV01(item.observer_ref),
    trust_class: item.trust_class,
    source_run_receipt_refs: [receiptRef],
    source_refs: cloneRefsV01(item.source_refs),
    subject_refs: cloneRefsV01([
      ...item.related_artifact_refs,
      ...(item.related_command_ids.length > 0 || item.related_check_ids.length > 0
        ? [runRef]
        : []),
    ]),
  }));
}

function projectAttestationsV01(
  receipt: RunReceiptV01,
  receiptRef: ExternalRefV01,
): {
  attestations: EpisodeDeltaProposalAttestationV01[];
  derivedAttestations: RunReceiptV01["attestations"];
} {
  const attestations: EpisodeDeltaProposalAttestationV01[] = [];
  const derivedAttestations: RunReceiptV01["attestations"] = [];
  for (const item of receipt.attestations) {
    const trust = projectAttestationTrustClassV01(item.trust_class);
    if (trust === null) {
      derivedAttestations.push(structuredClone(item));
      continue;
    }
    attestations.push({
      material_id: `receipt-attestation:${item.attestation_id}`,
      material_kind: item.attestation_kind,
      bounded_summary: item.summary,
      reported_at: item.reported_at,
      reporter_ref: sourceRefV01({
        ref_type: "proposal_attestation_reporter",
        external_id: stableIdV01(
          "attestation-reporter",
          canonicalizeProtocolValueV01({
            attestation_id: item.attestation_id,
            source_reporter_ref: item.reporter_ref,
            trust_class: trust,
          }),
        ),
        source_ref: item.reporter_ref.source_ref ?? null,
        trust_class: trust,
        observed_at: item.reporter_ref.observed_at ?? item.reported_at,
      }),
      trust_class: trust,
      source_run_receipt_refs: [receiptRef],
      source_refs: cloneRefsV01([item.reporter_ref, ...item.source_refs]),
      subject_refs: cloneRefsV01(item.subject_refs),
    });
  }
  return { attestations, derivedAttestations };
}

function projectAttestationTrustClassV01(
  trust: RunReceiptAttestationTrustClassV01,
): EpisodeDeltaProposalAttestationTrustClassV01 | null {
  switch (trust) {
    case "host_attestation":
    case "provider_report":
    case "user_declaration":
    case "imported_unverified":
      return trust;
    case "derived_interpretation":
      return null;
  }
}

function assessmentInferencesV01(input: {
  assessment: CriterionAssessmentV01;
  receipt_ref: ExternalRefV01;
  packet_ref: ExternalRefV01;
  assessment_ref: ExternalRefV01;
  interpreter_ref: ExternalRefV01;
  inferred_at: string;
  basis_material_id: string;
}): EpisodeDeltaProposalInferenceV01[] {
  const criteria = input.assessment.criteria.length
    ? input.assessment.criteria
    : [null];
  return criteria.map((criterion) => ({
    material_id: criterion
      ? assessmentMaterialIdV01(criterion.criterion_id)
      : "criterion-assessment:task",
    material_kind: criterion
      ? "criterion_assessment_item"
      : "criterion_assessment_summary",
    bounded_summary: criterion
      ? `Criterion remains ${criterion.status} with basis ${criterion.basis}; no criterion-specific protocol relation is available.`
      : "No success criterion was present; validation remains required before semantic change can be considered.",
    inferred_at: input.inferred_at,
    interpreter_ref: input.interpreter_ref,
    trust_class: "derived_interpretation",
    basis_material_ids: [input.basis_material_id],
    source_run_receipt_refs: [input.receipt_ref],
    source_refs: [input.packet_ref, input.receipt_ref, input.assessment_ref],
    subject_refs: criterion
      ? [criterionRefV01(criterion.criterion_id, input.assessment_ref)]
      : [input.assessment_ref],
  }));
}

function proposalCandidatesV01(input: {
  packet: TaskContextPacketV01;
  assessment: CriterionAssessmentV01;
  assessment_ref: ExternalRefV01;
  packet_ref: ExternalRefV01;
  receipt_ref: ExternalRefV01;
}) {
  const criteria = input.assessment.criteria.length
    ? input.assessment.criteria
    : [null];
  const candidates = criteria.map((criterion) => {
    const identity = criterion?.criterion_id ?? "task-success-criteria-missing";
    const candidateId = stableIdV01("validation-candidate", identity);
    const materialId = criterion
      ? assessmentMaterialIdV01(criterion.criterion_id)
      : "criterion-assessment:task";
    const targetRef = criterion
      ? criterionRefV01(criterion.criterion_id, input.assessment_ref)
      : input.assessment_ref;
    return {
      candidate_id: candidateId,
      delta_type: "validation_delta" as const,
      operation: "unknown" as const,
      title: criterion
        ? `Validate: ${criterion.criterion}`
        : "Establish explicit task success criteria",
      current_state: {
        knowledge_status: "unknown" as const,
        bounded_summary: null,
        source_material_ids: [],
        source_refs: [],
      },
      proposed_state_summary: criterion
        ? "Validate this criterion through an explicit protocol-owned relation; current run residue supports no semantic state change."
        : "Establish bounded success criteria before any semantic state change is proposed.",
      target_refs: [targetRef],
      basis_material_ids: [materialId],
      source_refs: [input.assessment_ref, input.packet_ref, input.receipt_ref],
      uncertainties: criterion
        ? [...criterion.uncertainty]
        : ["Task success criteria are absent."],
      limitations: [
        "Operation remains unknown and review-required.",
        "No criterion-to-residue relation was inferred.",
      ],
      review_required: true as const,
    };
  });
  return {
    candidates,
    missing_information: candidates.map((candidate, index) => ({
      missing_id: stableIdV01("missing-information", candidate.candidate_id),
      knowledge_status: "unknown" as const,
      code: input.assessment.criteria[index]
        ? "criterion_relation_unavailable"
        : "success_criteria_missing",
      bounded_summary: input.assessment.criteria[index]
        ? "No protocol-owned relation connects this criterion to receipt residue."
        : "The packet contains no explicit success criterion to assess.",
      related_material_ids: [candidate.basis_material_ids[0]!],
      related_delta_ids: [candidate.candidate_id],
      source_refs: [],
      review_required: true as const,
    })),
    uncertainties: candidates.map((candidate, index) => ({
      uncertainty_id: stableIdV01("uncertainty", candidate.candidate_id),
      bounded_summary: input.assessment.criteria[index]
        ? "Execution completion and task success remain separate; criterion status is unknown."
        : "Task success cannot be assessed without an explicit criterion.",
      related_material_ids: [candidate.basis_material_ids[0]!],
      related_delta_ids: [candidate.candidate_id],
      source_refs: [],
    })),
  };
}

function sourceAssessmentSnapshotV01(input: {
  identity: RunAssessmentProposalAdmissionIdentityV01;
  packet: TaskContextPacketV01;
  receipt: RunReceiptV01;
  assessment: CriterionAssessmentV01;
  run_ref: ExternalRefV01;
  packet_ref: ExternalRefV01;
  receipt_ref: ExternalRefV01;
}): EpisodeDeltaProposalSourceAssessmentV01 {
  return {
    admission_profile: RUN_ASSESSMENT_PROPOSAL_PROFILE_VERSION_V01,
    admission_idempotency_key: input.identity.idempotency_key,
    source_material_boundary:
      createRunAssessmentProposalSourceMaterialBoundaryV01(),
    work_ref: input.receipt.work_ref
      ? cloneRefV01(input.receipt.work_ref)
      : null,
    run_ref: input.run_ref,
    packet_ref: input.packet_ref,
    receipt_ref: input.receipt_ref,
    assessment: structuredClone(input.assessment),
    expected: {
      task_goal: input.packet.task.goal,
      success_criteria: input.assessment.criteria.map((criterion) => ({
        criterion_id: criterion.criterion_id,
        criterion: criterion.criterion,
      })),
      required_checks: [...input.packet.constraints.required_checks],
      expected_artifacts: [...input.packet.return_contract.expected_artifacts],
      required_return_fields: [...input.packet.return_contract.required_fields],
      forbidden_actions: [...input.packet.constraints.forbidden_actions],
      data_classification: input.packet.constraints.data_classification,
    },
    observed: {
      execution: structuredClone(input.receipt.execution),
      verification: structuredClone(input.receipt.verification),
      commands: structuredClone(input.receipt.commands),
      checks: structuredClone(input.receipt.checks),
      skipped_checks: structuredClone(input.receipt.skipped_checks),
      changed_artifacts: structuredClone(input.receipt.changed_artifacts),
      artifact_refs: structuredClone(input.receipt.artifact_refs),
      blockers: structuredClone(input.receipt.blockers),
      warnings: structuredClone(input.receipt.warnings),
      gaps: structuredClone(input.receipt.gaps),
      result_summary: structuredClone(input.receipt.result_summary),
      capability_coverage: structuredClone(input.receipt.capability_coverage),
      trust_summary: structuredClone(input.receipt.trust_summary),
      compatibility: structuredClone(input.receipt.compatibility),
    },
    comparison: {
      relation_policy: "explicit_protocol_relations_only",
      criterion_specific_relations_available: false,
      task_success_status: "unknown",
      execution_status_is_task_success: false,
      gaps: comparisonGapsV01(input.receipt, input.assessment),
    },
    authority: {
      authoritative: false,
      creates_evidence: false,
      validates_claims: false,
      creates_decision: false,
      applies_transition: false,
      changes_semantic_state: false,
      changes_later_context: false,
    },
  };
}

function comparisonGapsV01(
  receipt: RunReceiptV01,
  assessment: CriterionAssessmentV01,
): string[] {
  return [
    "No protocol-owned criterion-to-residue relation is available.",
    ...receipt.skipped_checks.map(
      (check) => `Skipped check ${check.check_id}: ${check.reason}`,
    ),
    ...receipt.gaps.map((gap) => `Receipt gap ${gap.code}: ${gap.summary}`),
    ...receipt.capability_coverage
      .filter((entry) => entry.coverage_level === "outside_coverage")
      .map((entry) => `Capability ${entry.capability} is outside coverage.`),
    ...assessment.criteria.flatMap((criterion) => criterion.uncertainty),
  ];
}

function sourceCurrentnessV01(
  packet: TaskContextPacketV01,
): "fresh" | "stale" | "partial" | "unknown" {
  switch (packet.source_status.currentness.status) {
    case "fresh":
    case "stale":
    case "partial":
    case "unknown":
      return packet.source_status.currentness.status;
  }
}

function assessmentMaterialIdV01(criterionId: string): string {
  return stableIdV01("criterion-assessment", criterionId);
}

function criterionRefV01(
  criterionId: string,
  assessmentRef: ExternalRefV01,
): ExternalRefV01 {
  return sourceRefV01({
    ref_type: "criterion_assessment_item",
    external_id: criterionId,
    source_ref: assessmentRef.source_ref ?? null,
    trust_class: "derived_interpretation",
    observed_at: assessmentRef.observed_at ?? null,
  });
}

function stableIdV01(kind: string, identity: string): string {
  return `${kind}:${createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      profile: RUN_ASSESSMENT_PROPOSAL_PROFILE_VERSION_V01,
      kind,
      identity,
    }),
  ).slice("sha256:".length, 31)}`;
}

function sourceRefV01(input: {
  ref_type: string;
  external_id: string;
  source_ref: string | null;
  trust_class: ExternalRefV01["trust_class"];
  observed_at: string | null;
}): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: input.ref_type,
    external_id: input.external_id,
    trust_class: input.trust_class,
    observed_at: input.observed_at,
    source_ref: input.source_ref,
    compatibility_namespace: RUN_ASSESSMENT_PROPOSAL_NAMESPACE_V01,
  };
}

function cloneRefV01(ref: ExternalRefV01): ExternalRefV01 {
  return structuredClone(ref);
}

function cloneRefsV01(refs: ExternalRefV01[]): ExternalRefV01[] {
  return refs.map(cloneRefV01);
}

function failV01(code: string): never {
  throw new RunAssessmentProposalMaterializationErrorV01(code);
}
