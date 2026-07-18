import {
  buildEpisodeDeltaProposalV01,
  validateEpisodeDeltaProposalV01,
} from "@/lib/vnext/episode-delta-proposal";
import {
  canonicalizeProtocolValueV01,
  compareExternalRefsV01,
  compareProtocolCanonicalV01,
  createProtocolSha256V01,
  normalizeExternalRefPrimitiveV01,
  uniqueProtocolStringsV01,
  uniqueProtocolValuesV01,
} from "@/lib/vnext/protocol-primitives";
import { createEpisodeDeltaCandidateFingerprintV01 } from "@/lib/vnext/review-decision";
import {
  createStrategicAnalysisIdentityV01,
  createStrategicAdvantageTransferBudgetV01,
  normalizeStrategicAdvantageTransferModelOutputV01,
  resolveStrategicAdvantageTransferItemsV01,
  validateStrategicAdvantageTransferProfileV01,
} from "@/lib/vnext/strategic-advantage-transfer-protocol";
import { validateModelInvocationReceiptV02 } from "@/lib/vnext/model-gateway/model-invocation-receipt";
import type { CriterionAssessmentV01 } from "@/types/vnext/criterion-assessment";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type { ModelInvocationReceiptV02 } from "@/types/vnext/model-invocation-receipt";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import {
  STRATEGIC_ADVANTAGE_TRANSFER_LENSES_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_MODEL_SCHEMA_VERSION_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_PROFILE_VERSION_V01,
  type StrategicAdvantageTransferBaseStrategyV01,
  type StrategicAdvantageTransferModelOutputV01,
  type StrategicAdvantageTransferProfileV01,
  type StrategicAdvantageTransferSourceCatalogV01,
  type StrategicAdvantageTransferSourceProposalBindingV01,
  type StrategicAdvantageTransferWorkingFrameV01,
} from "@/types/vnext/strategic-advantage-transfer";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

export class StrategicAdvantageTransferMaterializationErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "StrategicAdvantageTransferMaterializationErrorV01";
  }
}

export interface StrategicAdvantageTransferMaterializationSourceV01 {
  source_proposal: EpisodeDeltaProposalV01;
  packet: TaskContextPacketV01;
  receipt: RunReceiptV01;
  assessment: CriterionAssessmentV01;
  base_strategy: StrategicAdvantageTransferBaseStrategyV01;
  working_frame: StrategicAdvantageTransferWorkingFrameV01;
  source_catalog: StrategicAdvantageTransferSourceCatalogV01;
  model_output: StrategicAdvantageTransferModelOutputV01;
  model_invocation_receipt: ModelInvocationReceiptV02;
}

export interface StrategicAdvantageTransferAdmissionIdentityV01 {
  profile_version: typeof STRATEGIC_ADVANTAGE_TRANSFER_PROFILE_VERSION_V01;
  workspace_id: string;
  project_id: string;
  source_proposal_id: string;
  source_proposal_fingerprint: string;
  packet_id: string;
  packet_fingerprint: string;
  receipt_id: string;
  receipt_fingerprint: string;
  assessment_fingerprint: string;
  base_fingerprint: string;
  working_frame_fingerprint: string;
  source_catalog_fingerprint: string;
  analysis_identity: string;
  idempotency_key: string;
}

export interface StrategicAdvantageTransferMaterializationV01 {
  status: "proposal";
  identity: StrategicAdvantageTransferAdmissionIdentityV01;
  model_output: StrategicAdvantageTransferModelOutputV01;
  proposal: EpisodeDeltaProposalV01;
}

export function deriveStrategicAdvantageTransferAdmissionIdentityV01(input: {
  source_proposal: EpisodeDeltaProposalV01;
  packet: TaskContextPacketV01;
  receipt: RunReceiptV01;
  assessment: CriterionAssessmentV01;
  base_strategy: StrategicAdvantageTransferBaseStrategyV01;
  working_frame: StrategicAdvantageTransferWorkingFrameV01;
  source_catalog: StrategicAdvantageTransferSourceCatalogV01;
}): StrategicAdvantageTransferAdmissionIdentityV01 {
  const budget = createStrategicAdvantageTransferBudgetV01();
  const analysisIdentity = createStrategicAnalysisIdentityV01({
    profile_version: STRATEGIC_ADVANTAGE_TRANSFER_PROFILE_VERSION_V01,
    schema_version: STRATEGIC_ADVANTAGE_TRANSFER_MODEL_SCHEMA_VERSION_V01,
    workspace_id: input.source_proposal.workspace_id,
    project_id: input.source_proposal.project_id,
    source_proposal_id: input.source_proposal.proposal_id,
    source_proposal_fingerprint: input.source_proposal.integrity.fingerprint,
    source_candidates: sourceProposalBinding(input.source_proposal).candidate_bindings,
    packet_id: input.packet.packet_id,
    packet_fingerprint: input.packet.integrity.fingerprint,
    receipt_id: input.receipt.receipt_id,
    receipt_fingerprint: input.receipt.integrity.fingerprint,
    assessment_version: input.assessment.assessment_version,
    assessment_fingerprint: input.assessment.assessment_fingerprint,
    base_fingerprint: input.base_strategy.base_fingerprint,
    working_frame_fingerprint:
      input.working_frame.working_frame_fingerprint,
    source_catalog_fingerprint:
      input.source_catalog.source_catalog_fingerprint,
    lenses: STRATEGIC_ADVANTAGE_TRANSFER_LENSES_V01,
    budget,
  });
  return {
    profile_version: STRATEGIC_ADVANTAGE_TRANSFER_PROFILE_VERSION_V01,
    workspace_id: input.source_proposal.workspace_id,
    project_id: input.source_proposal.project_id,
    source_proposal_id: input.source_proposal.proposal_id,
    source_proposal_fingerprint: input.source_proposal.integrity.fingerprint,
    packet_id: input.packet.packet_id,
    packet_fingerprint: input.packet.integrity.fingerprint,
    receipt_id: input.receipt.receipt_id,
    receipt_fingerprint: input.receipt.integrity.fingerprint,
    assessment_fingerprint: input.assessment.assessment_fingerprint,
    base_fingerprint: input.base_strategy.base_fingerprint,
    working_frame_fingerprint:
      input.working_frame.working_frame_fingerprint,
    source_catalog_fingerprint:
      input.source_catalog.source_catalog_fingerprint,
    analysis_identity: analysisIdentity,
    idempotency_key: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        purpose: STRATEGIC_ADVANTAGE_TRANSFER_PROFILE_VERSION_V01,
        analysis_identity: analysisIdentity,
      }),
    ),
  };
}

export function materializeStrategicAdvantageTransferProposalV01(
  input: StrategicAdvantageTransferMaterializationSourceV01,
): StrategicAdvantageTransferMaterializationV01 {
  assertSourceRelation(input);
  const identity = deriveStrategicAdvantageTransferAdmissionIdentityV01(input);
  const modelOutput = normalizeStrategicAdvantageTransferModelOutputV01(
    input.model_output,
    STRATEGIC_ADVANTAGE_TRANSFER_LENSES_V01,
  );
  const transfers = resolveStrategicAdvantageTransferItemsV01({
    catalog: input.source_catalog,
    model_output: modelOutput,
  });
  const modelReceipt = validateModelInvocationReceiptV02(
    input.model_invocation_receipt,
  );
  const normalizedOutputFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(modelOutput),
  );
  if (
    modelReceipt.normalized_output_fingerprint !==
    normalizedOutputFingerprint
  ) {
    refuse("strategic_advantage_transfer_model_output_receipt_conflict");
  }
  const modelReceiptFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(modelReceipt),
  );
  const modelReceiptRef: ExternalRefV01 = {
    ref_version: "external_ref.v0.1",
    ref_type: "model_invocation_receipt",
    external_id: modelReceipt.invocation_id,
    trust_class: "provider_report",
    observed_at: modelReceipt.finished_at,
    source_ref: modelReceiptFingerprint,
    compatibility_namespace:
      "augnes.vnext.strategic-advantage-transfer.v0.1",
  };
  const packetRef = packetRefV01(input.packet);
  const receiptRef = receiptRefV01(input.receipt);
  const sourceProposalRef: ExternalRefV01 = {
    ref_version: "external_ref.v0.1",
    ref_type: "episode_delta_proposal",
    external_id: input.source_proposal.proposal_id,
    trust_class: "direct_local_observation",
    observed_at: input.source_proposal.created_at,
    source_ref: input.source_proposal.integrity.fingerprint,
    compatibility_namespace:
      "augnes.vnext.strategic-advantage-transfer.v0.1",
  };
  const baseObservationId = `strategic-base:${input.base_strategy.base_fingerprint.slice(7, 31)}`;
  const modelAttestationId = `strategic-model-report:${modelReceiptFingerprint.slice(7, 31)}`;
  const interpreterRef: ExternalRefV01 = {
    ref_version: "external_ref.v0.1",
    ref_type: "strategic_advantage_transfer_profile",
    external_id: STRATEGIC_ADVANTAGE_TRANSFER_PROFILE_VERSION_V01,
    trust_class: "derived_interpretation",
    observed_at: modelReceipt.finished_at,
    source_ref: identity.analysis_identity,
    compatibility_namespace:
      "augnes.vnext.strategic-advantage-transfer.v0.1",
  };
  const inferenceIds = new Map(
    transfers.map((transfer) => [
      transfer.transfer_id,
      `strategic-inference:${transfer.transfer_id.slice("strategic-transfer:".length)}`,
    ]),
  );
  const noTransferInferenceId = `strategic-inference:no-transfer-${identity.analysis_identity.slice(7, 31)}`;
  const noTransferCandidateId = `strategic-candidate:no-transfer-${identity.analysis_identity.slice(7, 31)}`;
  const noTransferReasons = modelOutput.lens_results
    .filter((result) => result.result === "no_transfer")
    .map((result) => `${result.lens_id}: ${result.non_transfer_reason}`);
  const profile: StrategicAdvantageTransferProfileV01 = {
    profile_version: STRATEGIC_ADVANTAGE_TRANSFER_PROFILE_VERSION_V01,
    analysis_identity: identity.analysis_identity,
    source_proposal: sourceProposalBinding(input.source_proposal),
    packet_ref: packetRef,
    receipt_ref: receiptRef,
    assessment: structuredClone(input.assessment),
    base_strategy: structuredClone(input.base_strategy),
    working_frame: structuredClone(input.working_frame),
    source_catalog: structuredClone(input.source_catalog),
    lenses: [...STRATEGIC_ADVANTAGE_TRANSFER_LENSES_V01],
    budget: createStrategicAdvantageTransferBudgetV01(),
    model_invocation: {
      receipt: modelReceipt,
      receipt_ref: modelReceiptRef,
      receipt_fingerprint: modelReceiptFingerprint,
      normalized_output_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(modelOutput),
      ),
      schema_version: STRATEGIC_ADVANTAGE_TRANSFER_MODEL_SCHEMA_VERSION_V01,
    },
    normalized_model_output: modelOutput,
    transfer_items: transfers,
    stop_reason: modelOutput.stop_reason,
    compatibility: {
      source_contracts: uniqueProtocolStringsV01([
        STRATEGIC_ADVANTAGE_TRANSFER_PROFILE_VERSION_V01,
        input.source_proposal.proposal_version,
        input.packet.packet_version,
        input.receipt.receipt_version,
        input.assessment.assessment_version,
        modelReceipt.receipt_version,
      ]),
      warnings: [
        "The admitted immutable proposal embeds the exact normalized result and ModelInvocationReceipt for review lineage; no separate strategic result record is created.",
        "Normalized lens output is derived candidate material and grants no authority.",
        "Monetary cost remains unavailable under the current R4 no-pricing-authority contract; one server-selected call and token ceilings bound exposure.",
      ],
    },
    authority: {
      authoritative: false,
      creates_evidence: false,
      validates_claims: false,
      creates_decision: false,
      authorizes_gate: false,
      applies_transition: false,
      changes_semantic_state: false,
      changes_later_context: false,
      authorizes_execution: false,
      authorizes_external_action: false,
      confidence_or_agreement_grants_authority: false,
    },
  };
  const profileValidation =
    validateStrategicAdvantageTransferProfileV01(profile);
  if (profileValidation.status !== "valid") {
    refuse(
      `strategic_advantage_transfer_profile_invalid:${profileValidation.errors
        .map((issue) => issue.code)
        .join(",")}`,
    );
  }
  const proposal = buildEpisodeDeltaProposalV01({
    workspace_id: input.source_proposal.workspace_id,
    project_id: input.source_proposal.project_id,
    created_at: modelReceipt.finished_at,
    status: "pending_review",
    bounded_summary: `Bounded strategic local transfer for ${input.base_strategy.bounded_summary}`,
    task_context_packet_ref: packetRef,
    run_receipt_refs: [receiptRef],
    strategic_advantage_transfer: profile,
    observations: [
      {
        material_id: baseObservationId,
        material_kind: "strategic_base_accepted_state",
        bounded_summary: input.base_strategy.bounded_summary,
        event_at: input.base_strategy.state_ref.observed_at ?? null,
        observed_at: input.base_strategy.state_ref.observed_at ?? modelReceipt.finished_at,
        observer_ref: input.base_strategy.state_ref,
        trust_class: "direct_local_observation",
        source_run_receipt_refs: [receiptRef],
        source_refs: normalizeRefs(input.base_strategy.source_refs),
        subject_refs: [input.base_strategy.target_ref],
      },
    ],
    attestations: [
      {
        material_id: modelAttestationId,
        material_kind: "normalized_strategic_model_report",
        bounded_summary:
          "One bounded R4 invocation returned structured lens results; this provider report is provenance for interpretation, not independent transfer support.",
        reported_at: modelReceipt.finished_at,
        reporter_ref: modelReceiptRef,
        trust_class: "provider_report",
        source_run_receipt_refs: [receiptRef],
        source_refs: [modelReceiptRef],
        subject_refs: [input.base_strategy.target_ref],
      },
    ],
    inferences:
      transfers.length > 0
        ? transfers.map((transfer) => ({
            material_id: inferenceIds.get(transfer.transfer_id)!,
            material_kind: "strategic_advantage_transfer_item",
            bounded_summary: `${transfer.title}: ${transfer.patch_summary}`,
            inferred_at: modelReceipt.finished_at,
            interpreter_ref: interpreterRef,
            trust_class: "derived_interpretation" as const,
            basis_material_ids: [baseObservationId, modelAttestationId],
            source_run_receipt_refs: [receiptRef],
            source_refs: normalizeRefs([
              ...transfer.source_refs,
              modelReceiptRef,
            ]),
            subject_refs: [input.base_strategy.target_ref],
          }))
        : [
            {
              material_id: noTransferInferenceId,
              material_kind: "strategic_advantage_transfer_no_transfer_result",
              bounded_summary:
                "The bounded profile found no source-supported local transfer for the fixed lenses; exact bounded reasons remain in the typed strategic profile.",
              inferred_at: modelReceipt.finished_at,
              interpreter_ref: interpreterRef,
              trust_class: "derived_interpretation" as const,
              basis_material_ids: [baseObservationId, modelAttestationId],
              source_run_receipt_refs: [receiptRef],
              source_refs: normalizeRefs([modelReceiptRef]),
              subject_refs: [input.base_strategy.target_ref],
            },
          ],
    proposed_deltas: (transfers.length > 0 ? transfers : [null]).map(
      (transfer) =>
        transfer
          ? {
              candidate_id: `strategic-candidate:${transfer.transfer_id.slice("strategic-transfer:".length)}`,
              delta_type:
                transfer.support.status === "supported"
                  ? "validation_delta"
                  : "research_delta",
              operation: "unknown",
              title: transfer.title,
              current_state: {
                knowledge_status: "known",
                bounded_summary: input.base_strategy.bounded_summary,
                source_material_ids: [baseObservationId],
                source_refs: normalizeRefs(input.base_strategy.source_refs),
              },
              proposed_state_summary: transfer.patch_summary,
              target_refs: [input.base_strategy.target_ref],
              basis_material_ids: [inferenceIds.get(transfer.transfer_id)!],
              source_refs: normalizeRefs([
                ...transfer.source_refs,
                input.base_strategy.state_ref,
                sourceProposalRef,
                modelReceiptRef,
              ]),
              uncertainties: uniqueProtocolStringsV01(transfer.uncertainty),
              limitations: uniqueProtocolStringsV01([
                ...transfer.known_limitations,
                ...transfer.introduced_risks,
                "The candidate operation remains unknown and requires a separate human-authored operation-aware revision before acceptance can become eligible.",
              ]),
              review_required: true,
            }
          : {
              candidate_id: noTransferCandidateId,
              delta_type: "research_delta" as const,
              operation: "unknown" as const,
              title: "Review bounded no-transfer result",
              current_state: {
                knowledge_status: "known" as const,
                bounded_summary: input.base_strategy.bounded_summary,
                source_material_ids: [baseObservationId],
                source_refs: normalizeRefs(input.base_strategy.source_refs),
              },
              proposed_state_summary:
                "Review whether the bounded source catalog truthfully supports no local strategic transfer for the fixed lenses.",
              target_refs: [input.base_strategy.target_ref],
              basis_material_ids: [noTransferInferenceId],
              source_refs: normalizeRefs([
                input.base_strategy.state_ref,
                sourceProposalRef,
                modelReceiptRef,
              ]),
              uncertainties: uniqueProtocolStringsV01(noTransferReasons),
              limitations: [
                "No transferable advantage was admitted by the structured model result.",
                "This research candidate is review-required, operation unknown, and grants no authority.",
              ],
              review_required: true as const,
            },
    ),
    conflicts: [],
    missing_information:
      transfers.length === 0
        ? [
            {
              missing_id: `strategic-missing:no-transfer-${identity.analysis_identity.slice(7, 31)}`,
              knowledge_status: "unknown" as const,
              code: "strategic_transfer_not_supported_by_bounded_sources",
              bounded_summary:
                "The fixed lenses returned no source-supported local transfer; review may defer or reject this derived research candidate.",
              related_material_ids: [noTransferInferenceId],
              related_delta_ids: [noTransferCandidateId],
              source_refs: [modelReceiptRef],
              review_required: true as const,
            },
          ]
        : transfers
            .filter((transfer) => transfer.support.status === "unknown")
            .map((transfer) => ({
              missing_id: `strategic-missing:${transfer.transfer_id.slice("strategic-transfer:".length)}`,
              knowledge_status: "unknown",
              code: "strategic_transfer_requires_additional_validation",
              bounded_summary:
                "Exact available sources are insufficient to promote this derived transfer beyond research candidate material.",
              related_material_ids: [inferenceIds.get(transfer.transfer_id)!],
              related_delta_ids: [
                `strategic-candidate:${transfer.transfer_id.slice("strategic-transfer:".length)}`,
              ],
              source_refs: transfer.source_refs,
              review_required: true,
            })),
    uncertainties:
      transfers.length === 0
        ? [
            {
              uncertainty_id: `strategic-uncertainty:no-transfer-${identity.analysis_identity.slice(7, 31)}`,
              bounded_summary:
                "No source-supported local transfer was returned; each fixed-lens reason remains separately preserved in the typed strategic profile and candidate uncertainty material.",
              related_material_ids: [noTransferInferenceId],
              related_delta_ids: [noTransferCandidateId],
              source_refs: [modelReceiptRef],
            },
          ]
        : transfers.map((transfer) => ({
            uncertainty_id: `strategic-uncertainty:${transfer.transfer_id.slice("strategic-transfer:".length)}`,
            bounded_summary: transfer.uncertainty.join("; "),
            related_material_ids: [inferenceIds.get(transfer.transfer_id)!],
            related_delta_ids: [
              `strategic-candidate:${transfer.transfer_id.slice("strategic-transfer:".length)}`,
            ],
            source_refs: transfer.source_refs,
          })),
    limitations: [
      "The optional strategic profile stops at candidate-level human review.",
      "No lens, model output, support count, or agreement grants semantic authority.",
      "No ReviewDecision, gate, Transition, semantic-state change, or later packet is created by analysis.",
    ],
    source_status: {
      coverage: "partial",
      currentness: "fresh",
      as_of: modelReceipt.finished_at,
      review_required: true,
      basis:
        "Exact packet-selected accepted strategy, immutable result lineage, bounded source catalog, and one R4 receipt are preserved.",
      source_refs: normalizeRefs([
        packetRef,
        receiptRef,
        sourceProposalRef,
        input.base_strategy.state_ref,
        modelReceiptRef,
      ]),
    },
    source_refs: normalizeRefs([
      packetRef,
      receiptRef,
      sourceProposalRef,
      input.base_strategy.state_ref,
      input.base_strategy.target_ref,
      modelReceiptRef,
      ...transfers.flatMap((transfer) => transfer.source_refs),
    ]),
    compatibility: {
      source_contracts: profile.compatibility.source_contracts,
      unmapped_fields: [],
      warnings: profile.compatibility.warnings,
      external_refs: normalizeRefs([
        packetRef,
        receiptRef,
        sourceProposalRef,
        modelReceiptRef,
      ]),
    },
    authority_notes: [
      "Strategic transfer material is optional, bounded, source-linked, and non-authoritative.",
      "The proposal reuses existing candidate review and may not apply itself.",
    ],
  });
  const validation = validateEpisodeDeltaProposalV01(proposal);
  if (validation.status !== "valid") {
    refuse(
      `strategic_advantage_transfer_proposal_invalid:${validation.errors
        .map((issue) => issue.code)
        .join(",")}`,
    );
  }
  return { status: "proposal", identity, model_output: modelOutput, proposal };
}

function assertSourceRelation(
  input: StrategicAdvantageTransferMaterializationSourceV01,
): void {
  const source = input.source_proposal.source_assessment;
  if (
    !source ||
    input.source_proposal.operation_revision ||
    input.source_proposal.strategic_advantage_transfer ||
    input.source_proposal.workspace_id !== input.packet.workspace_id ||
    input.source_proposal.project_id !== input.packet.project_id ||
    input.receipt.workspace_id !== input.packet.workspace_id ||
    input.receipt.project_id !== input.packet.project_id ||
    input.assessment.workspace_id !== input.packet.workspace_id ||
    input.assessment.project_id !== input.packet.project_id ||
    source.packet_ref.external_id !== input.packet.packet_id ||
    source.packet_ref.source_ref !== input.packet.integrity.fingerprint ||
    source.receipt_ref.external_id !== input.receipt.receipt_id ||
    source.receipt_ref.source_ref !== input.receipt.integrity.fingerprint ||
    source.assessment.assessment_fingerprint !==
      input.assessment.assessment_fingerprint ||
    input.working_frame.packet_ref.external_id !== input.packet.packet_id ||
    input.working_frame.receipt_ref.external_id !== input.receipt.receipt_id ||
    input.working_frame.base_strategy.base_fingerprint !==
      input.base_strategy.base_fingerprint ||
    input.source_catalog.workspace_id !== input.packet.workspace_id ||
    input.source_catalog.project_id !== input.packet.project_id
  ) {
    refuse("strategic_advantage_transfer_source_binding_conflict");
  }
}

export function sourceProposalBinding(
  proposal: EpisodeDeltaProposalV01,
): StrategicAdvantageTransferSourceProposalBindingV01 {
  return {
    proposal_id: proposal.proposal_id,
    proposal_fingerprint: proposal.integrity.fingerprint,
    candidate_bindings: proposal.proposed_deltas
      .map((candidate) => ({
        candidate_id: candidate.candidate_id,
        candidate_fingerprint:
          createEpisodeDeltaCandidateFingerprintV01(candidate),
      }))
      .sort(compareProtocolCanonicalV01),
  };
}

export function packetRefV01(packet: TaskContextPacketV01): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: "task_context_packet",
    external_id: packet.packet_id,
    trust_class: "direct_local_observation",
    observed_at: packet.generated_at,
    source_ref: packet.integrity.fingerprint,
  };
}

export function receiptRefV01(receipt: RunReceiptV01): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: "run_receipt",
    external_id: receipt.receipt_id,
    trust_class: "direct_local_observation",
    observed_at: receipt.recorded_at,
    source_ref: receipt.integrity.fingerprint,
  };
}

function normalizeRefs(refs: ExternalRefV01[]): ExternalRefV01[] {
  return uniqueProtocolValuesV01(
    refs.map(normalizeExternalRefPrimitiveV01),
  ).sort(compareExternalRefsV01);
}

function refuse(code: string): never {
  throw new StrategicAdvantageTransferMaterializationErrorV01(code);
}
