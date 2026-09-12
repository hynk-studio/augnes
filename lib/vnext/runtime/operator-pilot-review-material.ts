import type Database from "better-sqlite3";

import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  assertVNextDurableSemanticStoreSchemaV01,
  insertVNextCoreRecordV01,
  iterateVNextCoreRecordsV01,
  readVNextCoreRecordV01,
  readVNextCoreRecordByIdempotencyKeyV01,
  type VNextCoreRecordEnvelopeV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import {
  assertPersistedRunAssessmentProposalSourceBoundV01,
  readOperationalFrictionProposalByIdentityV01,
} from "@/lib/vnext/persistence/episode-delta-proposal-admission";
import {
  deriveOperationalFrictionProposalAdmissionIdentityV01,
  type OperationalFrictionProposalAdmissionIdentityV01,
} from "@/lib/vnext/operational-friction-proposal";
import {
  canonicalizeProtocolValueV01,
  compareExternalRefsV01,
  compareProtocolCanonicalV01,
  createProtocolSha256V01,
  normalizeExternalRefPrimitiveV01,
  normalizeProtocolTextV01,
  parseStrictIsoTimestampV01,
  uniqueProtocolStringsV01,
  uniqueProtocolValuesV01,
} from "@/lib/vnext/protocol-primitives";
import {
  buildReviewDecisionV01,
  createEpisodeDeltaCandidateFingerprintV01,
  validateReviewDecisionAgainstEpisodeDeltaProposalV01,
  validateReviewDecisionV01,
} from "@/lib/vnext/review-decision";
import { validateRunReceiptV01 } from "@/lib/vnext/run-receipt";
import {
  compareEffectiveReviewDecisionsV01,
  type ReviewDecisionLineageComparableV01,
} from "@/lib/vnext/review-decision-lineage";
import { validateStateTransitionReceiptV01 } from "@/lib/vnext/state-transition-receipt";
import {
  readVNextOperatorStrategicAdvantageTransferV01,
  type VNextOperatorStrategicCostAvailabilityV01,
  type VNextOperatorStrategicAdvantageTransferReadbackV01,
} from "@/lib/vnext/runtime/operator-pilot-strategic-advantage-transfer";
import { readDefaultModelGatewayLocalCapabilityV01 } from "@/lib/vnext/model-gateway/model-gateway";
import { validateEpisodeDeltaProposalV01 } from "@/lib/vnext/episode-delta-proposal";
import {
  loadValidatedVNextSemanticTransitionRelationV01,
} from "@/lib/vnext/runtime/durable-semantic-transition";
import {
  readVNextLocalRuntimeClockNowV01,
  type VNextLocalRuntimeClockV01,
} from "@/lib/vnext/runtime/local-runtime-clock";
import type {
  VNextLocalOperatorPilotConfigV01,
  VNextLocalOperatorSessionMutationAdmissionV01,
  VNextLocalOperatorSessionPublicV01,
  VNextLocalOperatorSecretSourceV01,
  VNextLocalOperatorSessionCredentialV01,
} from "@/lib/vnext/runtime/local-operator-session";
import {
  admitVNextLocalOperatorMutationInsideTransactionV01,
  authenticateVNextLocalOperatorSessionV01,
  readVNextLocalOperatorSessionHistoryV01,
} from "@/lib/vnext/runtime/local-operator-session";
import {
  inspectVNextOperatorPilotCandidateAdmissionV01,
  VNEXT_OPERATOR_PILOT_POLICY_VERSION_V01,
  type VNextOperatorPilotCandidateAdmissionV01,
  type VNextOperatorPilotCurrentStateStatusV01,
} from "@/lib/vnext/runtime/operator-pilot-policy";
import {
  OPERATOR_PILOT_REVISION_DELTA_TARGET_INCOMPATIBLE_V01,
  evaluateVNextOperatorPilotRevisionDeltaTargetCompatibilityV01,
} from "@/lib/vnext/runtime/operator-pilot-revision-compatibility";
import { EXTERNAL_REF_VERSION_V01, type ExternalRefV01 } from "@/types/vnext/external-ref";
import type {
  EpisodeDeltaProposalDeltaCandidateV01,
  EpisodeDeltaProposalV01,
} from "@/types/vnext/episode-delta-proposal";
import { OPERATION_AWARE_PROPOSAL_REVISION_PROFILE_VERSION_V01 } from "@/types/vnext/episode-delta-proposal";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { StateTransitionReceiptV01 } from "@/types/vnext/state-transition-receipt";

export const VNEXT_OPERATOR_PILOT_REVIEW_MATERIAL_VERSION_V01 =
  "vnext_operator_pilot_review_material.v0.1" as const;
export const VNEXT_OPERATOR_PILOT_DEFAULT_DEFER_REVISIT_MS_V01 =
  24 * 60 * 60 * 1000;
export const VNEXT_OPERATOR_PILOT_DEFAULT_DEFER_EXPIRY_MS_V01 =
  7 * 24 * 60 * 60 * 1000;
// Retained for the separately owned compiled-packet reader.
export const VNEXT_OPERATOR_PILOT_MAX_REVIEW_RECORDS_V01 = 128;
const REVIEW_HISTORY_DISPLAY_SIZE = 128;
export const VNEXT_OPERATOR_PILOT_DECISION_REQUEST_VERSION_V01 =
  "vnext_operator_pilot_decision_request.v0.1" as const;

const VNEXT_OPERATOR_PILOT_ACTOR_NAMESPACE_V01 =
  "augnes.vnext.local-operator-pilot.v0.1";
const VNEXT_LOCAL_OPERATOR_SESSION_NAMESPACE_V01 =
  "augnes.vnext.local-operator-session.v0.1";

export class VNextOperatorPilotReviewErrorV01 extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status = 400) {
    super(code);
    this.name = "VNextOperatorPilotReviewErrorV01";
    this.code = code;
    this.status = status;
  }
}

export interface VNextOperatorPilotReviewListItemV01 {
  proposal_id: string;
  proposal_fingerprint: string;
  created_at: string;
  status: EpisodeDeltaProposalV01["status"];
  bounded_summary: string;
  source_currentness: EpisodeDeltaProposalV01["source_status"]["currentness"];
  source_receipts: Array<{ receipt_id: string; receipt_fingerprint: string }>;
  candidate_count: number;
  current_state_status: VNextOperatorPilotCurrentStateStatusV01;
  candidate_admissions: VNextOperatorPilotCandidateAdmissionV01[];
  decision_count: number;
  transition_status: "not_applied" | "applied";
  decision_application_summary: VNextOperatorPilotProposalDecisionApplicationSummaryV01;
  operational_friction_review?: VNextOperatorPilotOperationalFrictionReviewV01 | null;
}

export type VNextOperatorPilotProposalDecisionApplicationStatusV01 =
  | "needs_decision"
  | "ready_to_complete"
  | "accepted_proposal_only"
  | "project_updated"
  | "rejected"
  | "deferred"
  | "needs_more_information"
  | "continue_review";

export interface VNextOperatorPilotProposalDecisionBindingV01 {
  decision: ReviewDecisionV01["decision"];
  decision_id: string;
  decision_fingerprint: string;
  candidate_id: string;
  candidate_fingerprint: string;
  pilot_actionable: boolean;
  requested_project_change: boolean;
  matching_transition_receipt_id: string | null;
  matching_transition_receipt_fingerprint: string | null;
}

export interface VNextOperatorPilotProposalDecisionApplicationSummaryV01 {
  status: VNextOperatorPilotProposalDecisionApplicationStatusV01;
  effective_decision: VNextOperatorPilotProposalDecisionBindingV01 | null;
  preferred_candidate_id: string | null;
  preferred_candidate_fingerprint: string | null;
  applying_decision_pending: boolean;
  matching_transition_receipt_present: boolean;
  exact_lineage_and_receipt_binding: true;
}

export interface VNextOperatorPilotOperationalFrictionReviewV01 {
  status: "canonical_admission_verified";
  review_mode: "proposal_only_no_activation";
  admission_identity: OperationalFrictionProposalAdmissionIdentityV01;
  canonical_admission_identity_verified: true;
  canonical_writer_requires_exact_source_rematerialization: true;
  write_path_provenance: "not_serialized_not_reprovable";
  ordinary_readback_rehydrates_upstream_sources: false;
  activation_owner_present: false;
  semantic_transition_applicable: false;
  project_state_changed: false;
  task_context_packet_changed: false;
  authority_granted: false;
}

export interface VNextOperatorPilotReviewDetailV01
  extends VNextOperatorPilotReviewListItemV01 {
  proposal: EpisodeDeltaProposalV01;
  criterion_specific_relations_source_bound: boolean;
  candidates: Array<{
    candidate: EpisodeDeltaProposalV01["proposed_deltas"][number];
    candidate_fingerprint: string;
    pilot_admission: VNextOperatorPilotCandidateAdmissionV01;
  }>;
  source_run_receipts: RunReceiptV01[];
  source_lanes: {
    observations: EpisodeDeltaProposalV01["observations"];
    attestations: EpisodeDeltaProposalV01["attestations"];
    inferences: EpisodeDeltaProposalV01["inferences"];
  };
  decisions: ReviewDecisionV01[];
  decision_history: VNextOperatorPilotDecisionHistoryItemV01[];
  transition_receipts: StateTransitionReceiptV01[];
  // Projection metadata, not persisted authority. Readers validate full history;
  // payloads include the recent window and exact effective candidate bindings.
  history_read?: {
    decisions: { total_count: number; returned_count: number; complete: boolean };
    transitions: { total_count: number; returned_count: number; complete: boolean };
  };
  effective_candidate_decisions?: Array<{
    candidate_id: string;
    candidate_fingerprint: string;
    decision_id: string;
    decision_fingerprint: string;
  }>;
  transition: {
    status: "not_applied" | "applied";
    transition_receipt_id: string | null;
    transition_receipt_fingerprint: string | null;
    notes: string[];
  };
  strategic_analysis: VNextOperatorStrategicAdvantageTransferReadbackV01;
}

export interface VNextOperatorPilotDecisionProvenanceValidationV01 {
  status: "valid" | "invalid";
  pilot_session_bound: boolean;
  pilot_actionable: boolean;
  session_id: string | null;
  request_fingerprint: string | null;
  errors: string[];
}

export interface VNextOperatorPilotDecisionHistoryItemV01
  extends VNextOperatorPilotDecisionProvenanceValidationV01 {
  decision: ReviewDecisionV01;
}

export interface VNextOperatorPilotDecisionRequestV01 {
  proposal_id: string;
  proposal_fingerprint: string;
  candidate_id: string;
  candidate_fingerprint: string;
  decision: ReviewDecisionV01["decision"];
  rationale_summary: string;
  revisit?: { condition_summary: string } | null;
}

export interface VNextOperatorPilotSemanticApplyingDecisionV01 {
  review_mode: "semantic_transition";
  decision: "accept" | "supersede" | "retract";
  transition_kind:
    | "semantic_candidate_apply"
    | "semantic_candidate_supersede"
    | "semantic_candidate_retract";
  target_refs: ExternalRefV01[];
  project_verify_lifecycle: boolean;
  activation_owner: null;
}

export interface VNextOperatorPilotProposalOnlyApplyingDecisionV01 {
  review_mode: "proposal_only_no_activation";
  decision: "accept";
  transition_kind: null;
  target_refs: [];
  project_verify_lifecycle: false;
  activation_owner: null;
}

export type VNextOperatorPilotApplyingDecisionV01 =
  | VNextOperatorPilotSemanticApplyingDecisionV01
  | VNextOperatorPilotProposalOnlyApplyingDecisionV01;

/**
 * Pure adapter mapping over an exact proposal candidate. Generic R6 proposals
 * preserve their accept-based operation path; SR-3 lifecycle proposals use
 * the canonical decision required by the selected immutable record operation.
 */
export function resolveVNextOperatorPilotApplyingDecisionV01(
  proposal: EpisodeDeltaProposalV01,
  candidate: EpisodeDeltaProposalDeltaCandidateV01,
): VNextOperatorPilotApplyingDecisionV01 {
  const operationalBinding =
    proposal.operational_friction_proposal?.candidate_bindings.find(
      (binding) =>
        binding.candidate_id === candidate.candidate_id &&
        binding.candidate_fingerprint ===
          createEpisodeDeltaCandidateFingerprintV01(candidate) &&
        binding.operation === "unknown" &&
        binding.proposal_only === true &&
        binding.activation_owner === null &&
        binding.semantic_state_target_present === false,
    );
  if (operationalBinding) {
    return {
      review_mode: "proposal_only_no_activation",
      decision: "accept",
      transition_kind: null,
      target_refs: [],
      project_verify_lifecycle: false,
      activation_owner: null,
    };
  }
  const profile = proposal.project_verify_lifecycle;
  if (
    profile &&
    profile.lifecycle_binding.selected_candidate.candidate_id ===
      candidate.candidate_id &&
    profile.lifecycle_binding.selected_candidate.candidate_fingerprint ===
      createEpisodeDeltaCandidateFingerprintV01(candidate)
  ) {
    const operation =
      profile.lifecycle_binding.selected_record_operation_intent;
    return {
      review_mode: "semantic_transition",
      decision:
        operation === "supersede"
          ? "supersede"
          : operation === "retract"
            ? "retract"
            : "accept",
      transition_kind:
        operation === "supersede"
          ? "semantic_candidate_supersede"
          : operation === "retract"
            ? "semantic_candidate_retract"
            : "semantic_candidate_apply",
      target_refs: [
        structuredClone(profile.lifecycle_binding.family_target_ref),
      ],
      project_verify_lifecycle: true,
      activation_owner: null,
    };
  }
  return {
    review_mode: "semantic_transition",
    decision: "accept",
    transition_kind: "semantic_candidate_apply",
    target_refs: structuredClone(candidate.target_refs),
    project_verify_lifecycle: false,
    activation_owner: null,
  };
}

export interface VNextOperatorPilotDecisionResultV01 {
  status: "inserted" | "exact_replay";
  decision: ReviewDecisionV01;
  transition_requested: boolean;
  transition_applied: false;
  activation_requested: false;
  session_cookie: {
    value: string;
    expires_at: string;
    max_age_seconds: number;
  };
}

export function listVNextOperatorPilotSemanticReviewsV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    authenticated_session_id: string | null;
    model_capability?: ReturnType<typeof readDefaultModelGatewayLocalCapabilityV01>;
    strategic_cost_availability?: VNextOperatorStrategicCostAvailabilityV01;
  },
): VNextOperatorPilotReviewListItemV01[] {
  return db.transaction(() => {
    assertVNextDurableSemanticStoreSchemaV01(db);
    const items: VNextOperatorPilotReviewListItemV01[] = [];
    for (const record of iterateVNextCoreRecordsV01(db, {
      ...input.config, record_kind: "episode_delta_proposal",
    })) {
      const detail = readVNextOperatorPilotSemanticReviewV01(db, {
        config: input.config,
        proposal_id: record.record_id,
        authenticated_session_id: input.authenticated_session_id,
        model_capability: input.model_capability,
        strategic_cost_availability: input.strategic_cost_availability,
      });
      items.push({
        proposal_id: detail.proposal_id,
        proposal_fingerprint: detail.proposal_fingerprint,
        created_at: detail.created_at,
        status: detail.status,
        bounded_summary: detail.bounded_summary,
        source_currentness: detail.source_currentness,
        source_receipts: detail.source_receipts,
        candidate_count: detail.candidate_count,
        current_state_status: detail.current_state_status,
        candidate_admissions: detail.candidate_admissions,
        decision_count: detail.decision_count,
        transition_status: detail.transition_status,
        decision_application_summary: detail.decision_application_summary,
        operational_friction_review: detail.operational_friction_review,
      });
    }
    return items;
  })();
}

export function readVNextOperatorPilotSemanticReviewV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    proposal_id: string;
    authenticated_session_id: string | null;
    model_capability?: ReturnType<typeof readDefaultModelGatewayLocalCapabilityV01>;
    strategic_cost_availability?: VNextOperatorStrategicCostAvailabilityV01;
  },
): VNextOperatorPilotReviewDetailV01 {
  return db.transaction(() => readSemanticReviewSnapshotV01(db, input))();
}

function readSemanticReviewSnapshotV01(
  db: Database.Database,
  input: Parameters<typeof readVNextOperatorPilotSemanticReviewV01>[1],
): VNextOperatorPilotReviewDetailV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const proposalId = requiredText(input.proposal_id, "proposal_id");
  const proposalRecord = readVNextCoreRecordV01(db, {
    record_kind: "episode_delta_proposal",
    record_id: proposalId,
    workspace_id: input.config.workspace_id,
    project_id: input.config.project_id,
  });
  if (!proposalRecord) throw reviewError("operator_pilot_proposal_missing", 404);
  const proposalValidation = validateEpisodeDeltaProposalV01(
    proposalRecord.payload,
  );
  if (proposalValidation.status !== "valid") {
    throw reviewError("operator_pilot_proposal_invalid", 422);
  }
  const proposal = proposalRecord.payload as EpisodeDeltaProposalV01;
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(proposalRecord, {
    workspace_id: proposal.workspace_id,
    project_id: proposal.project_id,
    fingerprint: proposal.integrity.fingerprint,
  });
  if (
    proposalRecord.record_id !== proposal.proposal_id ||
    proposalRecord.created_at !== proposal.created_at ||
    (proposal.strategic_advantage_transfer &&
      !proposal.operation_revision &&
      proposalRecord.idempotency_key !==
        createProtocolSha256V01(
          canonicalizeProtocolValueV01({
            purpose:
              proposal.strategic_advantage_transfer.profile_version,
            analysis_identity:
              proposal.strategic_advantage_transfer.analysis_identity,
          }),
        ))
  ) {
    throw reviewError("operator_pilot_proposal_envelope_mismatch", 422);
  }
  assertScope(input.config, proposal.workspace_id, proposal.project_id);
  let operationalFrictionReview: VNextOperatorPilotOperationalFrictionReviewV01 | null =
    null;
  if (proposal.operational_friction_proposal) {
    try {
      const identity = deriveOperationalFrictionProposalAdmissionIdentityV01({
        workspace_id: input.config.workspace_id,
        project_id: input.config.project_id,
        proposal,
      });
      const canonical = readOperationalFrictionProposalByIdentityV01(
        db,
        identity,
      );
      if (
        !canonical ||
        canonical.record.record_id !== proposalRecord.record_id ||
        canonical.record.fingerprint !== proposalRecord.fingerprint
      ) {
        throw new Error("operational_friction_admission_missing");
      }
      operationalFrictionReview = {
        status: "canonical_admission_verified",
        review_mode: "proposal_only_no_activation",
        admission_identity: identity,
        canonical_admission_identity_verified:
          canonical.canonical_admission_identity_verified,
        canonical_writer_requires_exact_source_rematerialization:
          canonical.canonical_writer_requires_exact_source_rematerialization,
        write_path_provenance: canonical.write_path_provenance,
        ordinary_readback_rehydrates_upstream_sources: false,
        activation_owner_present: false,
        semantic_transition_applicable: false,
        project_state_changed: false,
        task_context_packet_changed: false,
        authority_granted: false,
      };
    } catch {
      throw reviewError("operator_pilot_operational_admission_conflict", 422);
    }
  }
  let criterionSpecificRelationsSourceBound = false;
  try {
    criterionSpecificRelationsSourceBound =
      assertPersistedRunAssessmentProposalSourceBoundV01(db, proposal);
  } catch {
    throw reviewError(
      "operator_pilot_proposal_relation_source_conflict",
      422,
    );
  }
  assertOperationAwareRevisionRelation(
    db,
    input.config,
    proposal,
    new Set([proposal.proposal_id]),
  );

  const sourceRunReceipts = loadSourceRunReceipts(
    db,
    input.config,
    proposal,
  );
  const candidateAdmissions = proposal.proposed_deltas.map((candidate) =>
    inspectVNextOperatorPilotCandidateAdmissionV01(db, {
      config: input.config,
      proposal,
      candidate,
      candidate_fingerprint:
        createEpisodeDeltaCandidateFingerprintV01(candidate),
    }),
  );
  const currentStateStatus = aggregateAdmissionState(candidateAdmissions);
  const history = readProposalHistoryV01(db, input, proposal, candidateAdmissions);
  const { decisions, decision_history: decisionHistory, transition_receipts: transitionReceipts } = history;
  const decisionApplicationSummary = deriveDecisionApplicationSummaryV01({
    source_currentness: proposal.source_status.currentness,
    candidate_admissions: candidateAdmissions,
    decision_count: history.history_read.decisions.total_count,
    transition_receipts: transitionReceipts,
    effective: history.effective,
    effective_by_candidate: history.effective_by_candidate,
  });
  return {
    proposal_id: proposal.proposal_id,
    proposal_fingerprint: proposal.integrity.fingerprint,
    created_at: proposal.created_at,
    status: proposal.status,
    bounded_summary: proposal.bounded_summary,
    source_currentness: proposal.source_status.currentness,
    source_receipts: sourceRunReceipts.map((receipt) => ({
      receipt_id: receipt.receipt_id,
      receipt_fingerprint: receipt.integrity.fingerprint,
    })),
    candidate_count: proposal.proposed_deltas.length,
    current_state_status: currentStateStatus,
    candidate_admissions: candidateAdmissions,
    decision_count: history.history_read.decisions.total_count,
    transition_status:
      transitionReceipts.length > 0 ? "applied" : "not_applied",
    decision_application_summary: decisionApplicationSummary,
    operational_friction_review: operationalFrictionReview,
    proposal,
    criterion_specific_relations_source_bound:
      criterionSpecificRelationsSourceBound,
    candidates: proposal.proposed_deltas.map((candidate, index) => ({
      candidate,
      candidate_fingerprint:
        createEpisodeDeltaCandidateFingerprintV01(candidate),
      pilot_admission: candidateAdmissions[index]!,
    })),
    source_run_receipts: sourceRunReceipts,
    source_lanes: {
      observations: proposal.observations,
      attestations: proposal.attestations,
      inferences: proposal.inferences,
    },
    decisions,
    decision_history: decisionHistory,
    history_read: history.history_read,
    effective_candidate_decisions: history.effective_candidate_decisions,
    transition_receipts: transitionReceipts,
    transition: {
      status: transitionReceipts.length > 0 ? "applied" : "not_applied",
      transition_receipt_id:
        transitionReceipts.at(-1)?.transition_receipt_id ?? null,
      transition_receipt_fingerprint:
        transitionReceipts.at(-1)?.integrity.fingerprint ?? null,
      notes:
        transitionReceipts.length > 0
          ? ["An exact validated StateTransitionReceipt is persisted for this proposal."]
          : ["No StateTransitionReceipt is persisted for this proposal."],
    },
    strategic_analysis: readVNextOperatorStrategicAdvantageTransferV01(db, {
      config: input.config,
      proposal,
      model_capability: input.model_capability,
      current_cost_availability: input.strategic_cost_availability,
    }),
  };
}

export function deriveVNextOperatorPilotProposalDecisionApplicationSummaryV01(
  input: {
    source_currentness: EpisodeDeltaProposalV01["source_status"]["currentness"];
    candidate_admissions: VNextOperatorPilotCandidateAdmissionV01[];
    decision_history: VNextOperatorPilotDecisionHistoryItemV01[];
    transition_receipts: StateTransitionReceiptV01[];
  },
): VNextOperatorPilotProposalDecisionApplicationSummaryV01 {
  const exact = input.decision_history.filter((entry) =>
    entry.status === "valid" && entry.pilot_session_bound &&
    input.candidate_admissions.some((candidate) =>
      candidate.candidate_id === entry.decision.candidate.candidate_id &&
      candidate.candidate_fingerprint === entry.decision.candidate.candidate_fingerprint,
    ),
  );
  const effectiveByCandidate = new Map<string, VNextOperatorPilotDecisionHistoryItemV01>();
  for (const candidate of input.candidate_admissions) {
    const entry = exact.filter((item) => item.decision.candidate.candidate_id === candidate.candidate_id)
      .sort((left, right) => compareEffectiveReviewDecisionsV01(left.decision, right.decision))[0];
    if (entry) effectiveByCandidate.set(candidate.candidate_id, entry);
  }
  return deriveDecisionApplicationSummaryV01({
    ...input,
    decision_count: input.decision_history.length,
    effective: [...exact].sort((left, right) => compareEffectiveReviewDecisionsV01(left.decision, right.decision))[0] ?? null,
    effective_by_candidate: effectiveByCandidate,
  });
}

function deriveDecisionApplicationSummaryV01(input: {
  source_currentness: EpisodeDeltaProposalV01["source_status"]["currentness"];
  candidate_admissions: VNextOperatorPilotCandidateAdmissionV01[];
  decision_count: number;
  transition_receipts: StateTransitionReceiptV01[];
  effective: VNextOperatorPilotDecisionHistoryItemV01 | null;
  effective_by_candidate: Map<string, VNextOperatorPilotDecisionHistoryItemV01>;
}): VNextOperatorPilotProposalDecisionApplicationSummaryV01 {
  const proposalOnlyAdmissions = input.candidate_admissions.filter(
    (candidate) => candidate.review_mode === "proposal_only_no_activation",
  );
  if (proposalOnlyAdmissions.length > 0) {
    if (proposalOnlyAdmissions.length !== input.candidate_admissions.length) {
      throw reviewError("operator_pilot_review_mode_mixed", 422);
    }
    return deriveProposalOnlyDecisionApplicationSummaryV01({
      candidate_admissions: proposalOnlyAdmissions,
      effective_by_candidate: input.effective_by_candidate,
      transition_receipts: input.transition_receipts,
    });
  }
  const effective = input.effective;
  if (effective) {
    const matchingReceipt =
      findExactDecisionCandidateTransitionReceiptV01(
        input.transition_receipts,
        effective.decision,
      );
    if (
      isApplyingDecisionV01(effective.decision.decision) &&
      effective.decision.requested_transition_intent !== null
    ) {
      if (effective.pilot_actionable && matchingReceipt === null) {
        return decisionApplicationSummaryV01(
          "ready_to_complete",
          effective,
          null,
        );
      }
      return decisionApplicationSummaryV01(
        matchingReceipt ? "project_updated" : "continue_review",
        effective,
        matchingReceipt,
      );
    }
    if (effective.decision.decision === "reject") {
      return decisionApplicationSummaryV01("rejected", effective, null);
    }
    if (effective.decision.decision === "defer") {
      return decisionApplicationSummaryV01("deferred", effective, null);
    }
    return decisionApplicationSummaryV01("continue_review", effective, null);
  }

  if (input.decision_count > 0) {
    return unresolvedDecisionApplicationSummaryV01(
      "continue_review",
      input.candidate_admissions[0] ?? null,
    );
  }

  const exactReviewableCandidate =
    input.source_currentness === "fresh" &&
    input.candidate_admissions.find(
      (candidate) => candidate.decision_allowed.accept,
    );
  if (exactReviewableCandidate) {
    return unresolvedDecisionApplicationSummaryV01(
      "needs_decision",
      exactReviewableCandidate,
    );
  }
  return unresolvedDecisionApplicationSummaryV01(
    "needs_more_information",
    input.candidate_admissions[0] ?? null,
  );
}

function deriveProposalOnlyDecisionApplicationSummaryV01(input: {
  candidate_admissions: VNextOperatorPilotCandidateAdmissionV01[];
  effective_by_candidate: Map<string, VNextOperatorPilotDecisionHistoryItemV01>;
  transition_receipts: StateTransitionReceiptV01[];
}): VNextOperatorPilotProposalDecisionApplicationSummaryV01 {
  const effectiveByCandidate = input.effective_by_candidate;
  for (const entry of effectiveByCandidate.values()) {
    if (
      findExactDecisionCandidateTransitionReceiptV01(
        input.transition_receipts,
        entry.decision,
      )
    ) {
      throw reviewError("operator_pilot_operational_transition_conflict", 422);
    }
  }
  const unresolved = input.candidate_admissions.find(
    (candidate) => !effectiveByCandidate.has(candidate.candidate_id),
  );
  if (unresolved) {
    return unresolvedDecisionApplicationSummaryV01(
      "needs_decision",
      unresolved,
    );
  }
  const settled = [...effectiveByCandidate.values()].sort((left, right) =>
    compareEffectiveReviewDecisionsV01(left.decision, right.decision),
  );
  const effective = settled[0];
  if (!effective) {
    return unresolvedDecisionApplicationSummaryV01(
      "needs_decision",
      input.candidate_admissions[0] ?? null,
    );
  }
  if (
    settled.some((entry) => entry.decision.decision === "defer")
  ) {
    return decisionApplicationSummaryV01(
      "deferred",
      settled.find((entry) => entry.decision.decision === "defer")!,
      null,
    );
  }
  if (
    settled.some((entry) => entry.decision.decision === "accept")
  ) {
    return decisionApplicationSummaryV01(
      "accepted_proposal_only",
      settled.find((entry) => entry.decision.decision === "accept")!,
      null,
    );
  }
  return decisionApplicationSummaryV01("rejected", effective, null);
}

function unresolvedDecisionApplicationSummaryV01(
  status:
    | "needs_decision"
    | "needs_more_information"
    | "continue_review",
  candidate: VNextOperatorPilotCandidateAdmissionV01 | null,
): VNextOperatorPilotProposalDecisionApplicationSummaryV01 {
  return {
    status,
    effective_decision: null,
    preferred_candidate_id: candidate?.candidate_id ?? null,
    preferred_candidate_fingerprint:
      candidate?.candidate_fingerprint ?? null,
    applying_decision_pending: false,
    matching_transition_receipt_present: false,
    exact_lineage_and_receipt_binding: true,
  };
}

function decisionApplicationSummaryV01(
  status: VNextOperatorPilotProposalDecisionApplicationStatusV01,
  entry: VNextOperatorPilotDecisionHistoryItemV01,
  receipt: StateTransitionReceiptV01 | null,
): VNextOperatorPilotProposalDecisionApplicationSummaryV01 {
  const decision = entry.decision;
  const requestedProjectChange =
    isApplyingDecisionV01(decision.decision) &&
    decision.requested_transition_intent !== null;
  return {
    status,
    effective_decision: {
      decision: decision.decision,
      decision_id: decision.decision_id,
      decision_fingerprint: decision.integrity.fingerprint,
      candidate_id: decision.candidate.candidate_id,
      candidate_fingerprint: decision.candidate.candidate_fingerprint,
      pilot_actionable: entry.pilot_actionable,
      requested_project_change: requestedProjectChange,
      matching_transition_receipt_id:
        receipt?.transition_receipt_id ?? null,
      matching_transition_receipt_fingerprint:
        receipt?.integrity.fingerprint ?? null,
    },
    preferred_candidate_id: decision.candidate.candidate_id,
    preferred_candidate_fingerprint:
      decision.candidate.candidate_fingerprint,
    applying_decision_pending:
      status === "ready_to_complete",
    matching_transition_receipt_present: receipt !== null,
    exact_lineage_and_receipt_binding: true,
  };
}

function findExactDecisionCandidateTransitionReceiptV01(
  receipts: StateTransitionReceiptV01[],
  decision: ReviewDecisionV01,
): StateTransitionReceiptV01 | null {
  return (
    receipts.find(
      (receipt) =>
        receipt.source_decision.decision_id === decision.decision_id &&
        receipt.source_decision.decision_fingerprint ===
          decision.integrity.fingerprint &&
        receipt.source_candidate.candidate_id ===
          decision.candidate.candidate_id &&
        receipt.source_candidate.candidate_fingerprint ===
          decision.candidate.candidate_fingerprint,
    ) ?? null
  );
}

export function recordVNextOperatorPilotReviewDecisionV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    credential: VNextLocalOperatorSessionCredentialV01;
    request: unknown;
    clock?: VNextLocalRuntimeClockV01;
    secret_source?: VNextLocalOperatorSecretSourceV01;
  },
): VNextOperatorPilotDecisionResultV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const request = parseDecisionRequest(input.request);
  const authentication = authenticateVNextLocalOperatorSessionV01(db, {
    config: input.config,
    credential: input.credential,
    clock: input.clock,
  });
  assertSessionScope(input.config, authentication.session);
  // Validate all semantic refusal paths before consuming the action nonce.
  const prevalidated = resolveDecisionRequestMaterial(
    db,
    input.config,
    request,
    authentication.session.session_id,
  );
  const prevalidatedReplay = findExactSemanticDecisionReplay(
    db,
    input.config,
    prevalidated.proposal,
    authentication.session.session_id,
    request,
  );
  assertDecisionRequestAllowedBeforeNonceV01(
    prevalidated,
    prevalidatedReplay,
    request,
  );
  if (db.inTransaction) {
    throw reviewError("operator_pilot_nested_transaction_forbidden", 409);
  }
  db.exec("BEGIN IMMEDIATE");
  try {
    const material = resolveDecisionRequestMaterial(
      db,
      input.config,
      request,
      authentication.session.session_id,
    );
    const replay = findExactSemanticDecisionReplay(
      db,
      input.config,
      material.proposal,
      authentication.session.session_id,
      request,
    );
    const applying = assertDecisionRequestAllowedBeforeNonceV01(
      material,
      replay,
      request,
    );
    const nonceAdmission =
      admitVNextLocalOperatorMutationInsideTransactionV01(db, {
        config: input.config,
        credential: input.credential,
        clock: input.clock,
        secret_source: input.secret_source,
      });
    assertSessionScope(input.config, nonceAdmission.session);
    if (replay) {
      db.exec("COMMIT");
      return {
        status: "exact_replay",
        decision: replay,
        transition_requested: replay.requested_transition_intent !== null,
        transition_applied: false,
        activation_requested: false,
        session_cookie: admissionCookie(nonceAdmission),
      };
    }
    const decidedAt = nonceAdmission.action_observed_at;
    const decisionRequestFingerprint =
      createVNextOperatorPilotDecisionRequestFingerprintV01(
        input.config,
        nonceAdmission.session.session_id,
        request,
      );
    const sessionBasisRef = createVNextOperatorPilotReviewDecisionSessionBasisRefV01(
      input.config,
      nonceAdmission.session,
      request,
      decidedAt,
    );
    const actorRef: ExternalRefV01 = {
      ref_version: EXTERNAL_REF_VERSION_V01,
      ref_type: "local_operator_actor",
      external_id: input.config.operator_id,
      trust_class: "user_declaration",
      observed_at: decidedAt,
      source_ref: sessionBasisRef.source_ref,
      compatibility_namespace: "augnes.vnext.local-operator-pilot.v0.1",
    };
    const applyingDecision = request.decision === applying.decision;
    const requestsSemanticTransition =
      applyingDecision && applying.review_mode === "semantic_transition";
    const priorDecisionBinding = requestsSemanticTransition
      ? resolveProjectVerifyPriorDecisionBindingV01(
          db,
          input.config,
          material.proposal,
        )
      : null;
    const selectedCandidateBinding = {
      candidate_id: material.candidate.candidate_id,
      candidate_fingerprint: material.candidate_fingerprint,
    };
    const decision = buildReviewDecisionV01({
      workspace_id: material.proposal.workspace_id,
      project_id: material.proposal.project_id,
      source_proposal: {
        proposal_version: material.proposal.proposal_version,
        proposal_id: material.proposal.proposal_id,
        proposal_fingerprint: material.proposal.integrity.fingerprint,
      },
      candidate: {
        candidate_id: material.candidate.candidate_id,
        candidate_fingerprint: material.candidate_fingerprint,
      },
      decision: request.decision,
      actor_ref: actorRef,
      authorization_basis_refs: [sessionBasisRef],
      decision_basis_material_ids: [...material.candidate.basis_material_ids],
      decision_basis_refs:
        material.candidate.source_refs.length > 0
          ? [...material.candidate.source_refs]
          : [...material.proposal.run_receipt_refs],
      rationale_summary: request.rationale_summary,
      decided_at: decidedAt,
      revisit:
        request.decision === "defer"
          ? {
              revisit_at: addMilliseconds(
                decidedAt,
                VNEXT_OPERATOR_PILOT_DEFAULT_DEFER_REVISIT_MS_V01,
              ),
              expires_at: addMilliseconds(
                decidedAt,
                VNEXT_OPERATOR_PILOT_DEFAULT_DEFER_EXPIRY_MS_V01,
              ),
              condition_summary: request.revisit!.condition_summary,
            }
          : null,
      requested_transition_intent:
        requestsSemanticTransition
          ? {
              intent_id: deriveIntentId(
                material.proposal.proposal_id,
                material.candidate.candidate_id,
                input.config.operator_id,
                decidedAt,
                applying.transition_kind,
              ),
              transition_kind: applying.transition_kind,
              bounded_summary:
                `Request one later independently previewed and gate-authorized ${material.admission.accept_operation} semantic transition for the selected candidate.`,
              target_refs: structuredClone(applying.target_refs),
              intent_only: true,
              applied: false,
              state_transition_receipt_ref: null,
            }
          : null,
      lineage: {
        prior_decisions:
          requestsSemanticTransition && priorDecisionBinding
            ? [priorDecisionBinding]
            : [],
        superseding_candidate:
          requestsSemanticTransition && applying.decision === "supersede"
            ? selectedCandidateBinding
            : null,
        retracted_decision:
          requestsSemanticTransition && applying.decision === "retract"
            ? priorDecisionBinding
            : null,
      },
      compatibility: {
        source_contracts: [
          material.proposal.proposal_version,
          VNEXT_OPERATOR_PILOT_REVIEW_MATERIAL_VERSION_V01,
          VNEXT_OPERATOR_PILOT_POLICY_VERSION_V01,
          VNEXT_OPERATOR_PILOT_DECISION_REQUEST_VERSION_V01,
          ...(material.proposal.project_verify_lifecycle
            ? [
                material.proposal.project_verify_lifecycle.proposal_profile,
                material.proposal.project_verify_lifecycle.lifecycle_binding
                  .binding_version,
              ]
            : []),
          ...(material.proposal.operational_friction_proposal
            ? [
                material.proposal.operational_friction_proposal.profile_version,
                material.proposal.operational_friction_proposal.source_bundle
                  .bundle_version,
              ]
            : []),
        ],
        unmapped_fields: [],
        warnings: [
          "Local session verification proves possession of a locally issued secret, not external or legal identity.",
          requestsSemanticTransition
            ? "The applying ReviewDecision carries intent for a separately recomputed gate and Transition path; the decision itself applies no state."
            : applying.review_mode === "proposal_only_no_activation" &&
                request.decision === "accept"
              ? "This decision records proposal-only judgment, creates no Transition intent, activates no operational policy, and has no later apply action in ACGC4B."
              : "This ReviewDecision carries no Transition intent and applies no state.",
        ],
        external_refs: [sessionBasisRef],
      },
      authority_notes: [
        "The server derived actor, session basis, proposal basis, targets, and timestamps; caller authority-shaped material was not accepted.",
      ],
    });
    if (validateReviewDecisionV01(decision).status !== "valid") {
      throw reviewError("operator_pilot_review_decision_invalid", 422);
    }
    if (
      validateReviewDecisionAgainstEpisodeDeltaProposalV01(
        decision,
        material.proposal,
      ).status !== "valid"
    ) {
      throw reviewError("operator_pilot_review_decision_relation_invalid", 422);
    }
    const write = insertVNextCoreRecordV01(db, {
      record_kind: "review_decision",
      record_id: decision.decision_id,
      workspace_id: decision.workspace_id,
      project_id: decision.project_id,
      fingerprint: decision.integrity.fingerprint,
      idempotency_key: decisionRequestFingerprint,
      payload: decision,
      created_at: decision.decided_at,
    });
    db.exec("COMMIT");
    return {
      status: write.status,
      decision,
      transition_requested: decision.requested_transition_intent !== null,
      transition_applied: false,
      activation_requested: false,
      session_cookie: admissionCookie(nonceAdmission),
    };
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  }
}

interface ResolvedDecisionRequestMaterialV01 {
  detail: VNextOperatorPilotReviewDetailV01;
  proposal: EpisodeDeltaProposalV01;
  candidate: EpisodeDeltaProposalDeltaCandidateV01;
  candidate_fingerprint: string;
  admission: VNextOperatorPilotCandidateAdmissionV01;
}

function isApplyingDecisionV01(
  decision: ReviewDecisionV01["decision"],
): decision is "accept" | "supersede" | "retract" {
  return (
    decision === "accept" ||
    decision === "supersede" ||
    decision === "retract"
  );
}

function assertDecisionRequestAllowedBeforeNonceV01(
  material: ResolvedDecisionRequestMaterialV01,
  replay: ReviewDecisionV01 | null,
  request: VNextOperatorPilotDecisionRequestV01,
): VNextOperatorPilotApplyingDecisionV01 {
  const applying = resolveVNextOperatorPilotApplyingDecisionV01(
    material.proposal,
    material.candidate,
  );
  if (material.admission.review_mode === "proposal_only_no_activation") {
    const effectiveBinding = material.detail.effective_candidate_decisions?.find(
      (entry) => entry.candidate_id === material.candidate.candidate_id &&
        entry.candidate_fingerprint === material.candidate_fingerprint,
    );
    const effective = material.detail.decision_history.find((entry) =>
      entry.decision.decision_id === effectiveBinding?.decision_id &&
      entry.decision.integrity.fingerprint === effectiveBinding.decision_fingerprint,
    );
    if (
      effective &&
      (effective.decision.decision === "accept" ||
        effective.decision.decision === "reject")
    ) {
      if (
        replay &&
        replay.decision_id === effective.decision.decision_id &&
        replay.integrity.fingerprint ===
          effective.decision.integrity.fingerprint
      ) {
        return applying;
      }
      throw reviewError(
        "operator_pilot_proposal_only_candidate_already_settled",
        409,
      );
    }
    if (request.decision === "supersede" || request.decision === "retract") {
      throw reviewError(
        "operator_pilot_proposal_only_decision_not_allowed",
        409,
      );
    }
  }
  if (
    !replay &&
    isApplyingDecisionV01(request.decision) &&
    request.decision !== applying.decision
  ) {
    throw reviewError("operator_pilot_decision_operation_mismatch", 409);
  }
  if (
    !replay &&
    request.decision === applying.decision &&
    !material.admission.decision_allowed.accept
  ) {
    throw reviewError(
      material.admission.blocking_reasons[0] ??
        "operator_pilot_accept_not_admitted",
      409,
    );
  }
  return applying;
}

function resolveProjectVerifyPriorDecisionBindingV01(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  proposal: EpisodeDeltaProposalV01,
): { decision_id: string; decision_fingerprint: string } | null {
  const profile = proposal.project_verify_lifecycle;
  if (!profile || profile.current_head_expectation.presence === "absent") {
    return null;
  }
  const expectation = profile.current_head_expectation;
  if (
    !expectation.source_transition_receipt_id ||
    !expectation.source_transition_receipt_fingerprint ||
    !expectation.selected_record_ref
  ) {
    throw reviewError(
      "operator_pilot_project_verify_prior_transition_binding_missing",
      409,
    );
  }
  const transition = loadValidatedVNextSemanticTransitionRelationV01(db, {
    workspace_id: config.workspace_id,
    project_id: config.project_id,
    transition_receipt_id: expectation.source_transition_receipt_id,
    transition_receipt_fingerprint:
      expectation.source_transition_receipt_fingerprint,
  });
  const priorProfile = transition.proposal.project_verify_lifecycle;
  if (
    transition.receipt.transition_receipt_id !==
      expectation.source_transition_receipt_id ||
    transition.receipt.integrity.fingerprint !==
      expectation.source_transition_receipt_fingerprint ||
    !priorProfile ||
    priorProfile.lifecycle_binding.family_id !==
      profile.lifecycle_binding.family_id ||
    canonicalizeProtocolValueV01(
      priorProfile.lifecycle_binding.selected_record_ref,
    ) !== canonicalizeProtocolValueV01(expectation.selected_record_ref) ||
    canonicalizeProtocolValueV01(
      profile.lifecycle_binding.prior_record_ref,
    ) !== canonicalizeProtocolValueV01(expectation.selected_record_ref)
  ) {
    throw reviewError(
      "operator_pilot_project_verify_prior_decision_binding_conflict",
      409,
    );
  }
  return {
    decision_id: transition.decision.decision_id,
    decision_fingerprint: transition.decision.integrity.fingerprint,
  };
}

function resolveDecisionRequestMaterial(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  request: VNextOperatorPilotDecisionRequestV01,
  authenticatedSessionId: string,
): ResolvedDecisionRequestMaterialV01 {
  const detail = readVNextOperatorPilotSemanticReviewV01(db, {
    config,
    proposal_id: request.proposal_id,
    authenticated_session_id: authenticatedSessionId,
  });
  const proposal = detail.proposal;
  if (
    proposal.strategic_advantage_transfer &&
    detail.strategic_analysis.status !== "available"
  ) {
    throw reviewError(
      `operator_pilot_strategic_decision_${detail.strategic_analysis.status}`,
      409,
    );
  }
  if (proposal.integrity.fingerprint !== request.proposal_fingerprint) {
    throw reviewError("operator_pilot_proposal_fingerprint_mismatch", 409);
  }
  const candidate = proposal.proposed_deltas.find(
    (item) => item.candidate_id === request.candidate_id,
  );
  if (!candidate) throw reviewError("operator_pilot_candidate_missing", 404);
  const candidateFingerprint =
    createEpisodeDeltaCandidateFingerprintV01(candidate);
  if (candidateFingerprint !== request.candidate_fingerprint) {
    throw reviewError("operator_pilot_candidate_fingerprint_mismatch", 409);
  }
  const admission = detail.candidate_admissions.find(
    (item) => item.candidate_id === candidate.candidate_id,
  );
  if (!admission) {
    throw reviewError("operator_pilot_candidate_policy_missing", 422);
  }
  if (admission.candidate_fingerprint !== candidateFingerprint) {
    throw reviewError("operator_pilot_candidate_policy_mismatch", 422);
  }
  return {
    detail,
    proposal,
    candidate,
    candidate_fingerprint: candidateFingerprint,
    admission,
  };
}

function admissionCookie(
  admission: VNextLocalOperatorSessionMutationAdmissionV01,
): VNextOperatorPilotDecisionResultV01["session_cookie"] {
  return {
    value: admission.cookie_value,
    expires_at: admission.cookie_expires_at,
    max_age_seconds: admission.cookie_max_age_seconds,
  };
}

function loadSourceRunReceipts(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  proposal: EpisodeDeltaProposalV01,
): RunReceiptV01[] {
  return proposal.run_receipt_refs.map((ref) => {
    if (
      ref.ref_type !== "run_receipt" ||
      !ref.source_ref?.startsWith("sha256:")
    ) {
      throw reviewError("operator_pilot_source_receipt_ref_invalid", 422);
    }
    const record = readVNextCoreRecordV01(db, {
      record_kind: "run_receipt",
      record_id: ref.external_id,
      workspace_id: config.workspace_id,
      project_id: config.project_id,
    });
    if (!record) throw reviewError("operator_pilot_source_receipt_missing", 422);
    if (validateRunReceiptV01(record.payload).status !== "valid") {
      throw reviewError("operator_pilot_source_receipt_invalid", 422);
    }
    const receipt = record.payload as RunReceiptV01;
    assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
      workspace_id: receipt.workspace_id,
      project_id: receipt.project_id,
      fingerprint: receipt.integrity.fingerprint,
    });
    if (
      receipt.receipt_id !== ref.external_id ||
      receipt.integrity.fingerprint !== ref.source_ref ||
      record.created_at !== receipt.recorded_at
    ) {
      throw reviewError("operator_pilot_source_receipt_relation_invalid", 422);
    }
    return receipt;
  });
}

function validatePersistedDecisionV01(record: VNextCoreRecordEnvelopeV01): ReviewDecisionV01 {
  if (validateReviewDecisionV01(record.payload).status !== "valid") {
    throw reviewError("operator_pilot_persisted_decision_invalid", 422);
  }
  const decision = record.payload as ReviewDecisionV01;
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
    workspace_id: decision.workspace_id,
    project_id: decision.project_id,
    fingerprint: decision.integrity.fingerprint,
  });
  if (
    record.record_id !== decision.decision_id ||
    record.fingerprint !== decision.integrity.fingerprint ||
    record.created_at !== decision.decided_at
  ) {
    throw reviewError("operator_pilot_persisted_decision_envelope_mismatch", 422);
  }
  return decision;
}

function assertDecisionProposalRelationV01(decision: ReviewDecisionV01, proposal: EpisodeDeltaProposalV01) {
  if (validateReviewDecisionAgainstEpisodeDeltaProposalV01(decision, proposal).status !== "valid") {
    throw reviewError("operator_pilot_persisted_decision_invalid", 422);
  }
}

// An exact writer binding must remain readable even outside the display window.
export function readVNextOperatorPilotReviewDecisionV01(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  proposal: EpisodeDeltaProposalV01,
  decisionId: string,
): ReviewDecisionV01 | null {
  const record = readVNextCoreRecordV01(db, {
    ...config, record_kind: "review_decision", record_id: decisionId,
  });
  if (!record) return null;
  const decision = validatePersistedDecisionV01(record);
  assertDecisionProposalRelationV01(decision, proposal);
  return decision;
}

function* loadProposalDecisions(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  proposal: EpisodeDeltaProposalV01,
): Generator<ReviewDecisionV01> {
  for (const record of iterateVNextCoreRecordsV01(db, {
    ...config, record_kind: "review_decision", order: "oldest_first",
  })) {
    const decision = validatePersistedDecisionV01(record);
    if (decision.source_proposal.proposal_id !== proposal.proposal_id) continue;
    assertDecisionProposalRelationV01(decision, proposal);
    yield decision;
  }
}

function* loadProposalTransitionReceipts(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  proposal: EpisodeDeltaProposalV01,
  exactDecisionKeys: Set<string>,
): Generator<StateTransitionReceiptV01> {
  const exactCandidateKeys = new Set(proposal.proposed_deltas.map((candidate) =>
    `${candidate.candidate_id}\0${createEpisodeDeltaCandidateFingerprintV01(candidate)}`,
  ));
  for (const record of iterateVNextCoreRecordsV01(db, {
    ...config, record_kind: "state_transition_receipt", order: "oldest_first",
  })) {
    const value = record.payload as StateTransitionReceiptV01 | null;
    if (!value || value.source_proposal?.proposal_id !== proposal.proposal_id) continue;
    if (
      proposal.operational_friction_proposal &&
      value.source_proposal.proposal_fingerprint === proposal.integrity.fingerprint &&
      exactCandidateKeys.has(`${value.source_candidate?.candidate_id}\0${value.source_candidate?.candidate_fingerprint}`) &&
      exactDecisionKeys.has(`${value.source_decision?.decision_id}\0${value.source_decision?.decision_fingerprint}`)
    ) {
      throw reviewError("operator_pilot_operational_transition_conflict", 422);
    }
    if (
      validateStateTransitionReceiptV01(value).status !== "valid" ||
      value.source_proposal.proposal_fingerprint !== proposal.integrity.fingerprint
    ) {
      throw reviewError("operator_pilot_transition_receipt_invalid", 422);
    }
    const transition = loadValidatedVNextSemanticTransitionRelationV01(db, {
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      transition_receipt_id: record.record_id,
      transition_receipt_fingerprint: record.fingerprint,
    });
    if (
      validateVNextOperatorPilotReviewDecisionProvenanceV01(db, {
        config, proposal: transition.proposal, decision: transition.decision,
        authenticated_session_id: null,
      }).status !== "valid"
    ) {
      throw reviewError("operator_pilot_transition_decision_provenance_invalid", 422);
    }
    if (proposal.operational_friction_proposal) {
      throw reviewError("operator_pilot_operational_transition_conflict", 422);
    }
    yield value;
  }
}

function readProposalHistoryV01(
  db: Database.Database,
  input: Parameters<typeof readVNextOperatorPilotSemanticReviewV01>[1],
  proposal: EpisodeDeltaProposalV01,
  admissions: VNextOperatorPilotCandidateAdmissionV01[],
) {
  // Keep the complete ordered comparison index, not complete protocol payloads.
  // The lineage comparator is not a pairwise maximum: preserve its stable sort
  // over the same oldest-first input, including priors on other pages.
  const index: Array<ReviewDecisionLineageComparableV01 & {
    candidate: ReviewDecisionV01["candidate"];
    eligible: boolean;
  }> = [];
  for (const decision of loadProposalDecisions(db, input.config, proposal)) {
    const provenance = validateVNextOperatorPilotReviewDecisionProvenanceV01(db, {
      ...input, proposal, decision,
    });
    index.push({
      decision_id: decision.decision_id,
      decided_at: decision.decided_at,
      integrity: { fingerprint: decision.integrity.fingerprint },
      lineage: { prior_decisions: decision.lineage.prior_decisions },
      candidate: decision.candidate,
      eligible: provenance.status === "valid" && provenance.pilot_session_bound &&
        admissions.some((candidate) =>
          candidate.candidate_id === decision.candidate.candidate_id &&
          candidate.candidate_fingerprint === decision.candidate.candidate_fingerprint,
        ),
    });
  }
  const exact = index.filter((entry) => entry.eligible);
  const effectiveIndex = [...exact].sort(compareEffectiveReviewDecisionsV01)[0];
  const effectiveCandidateIndexes = admissions.flatMap((candidate) => {
    const entry = exact.filter((item) => item.candidate.candidate_id === candidate.candidate_id)
      .sort(compareEffectiveReviewDecisionsV01)[0];
    return entry ? [entry] : [];
  });
  const selectedIds = new Set([
    ...index.slice(-REVIEW_HISTORY_DISPLAY_SIZE),
    ...effectiveCandidateIndexes,
    ...(effectiveIndex ? [effectiveIndex] : []),
  ].map((entry) => entry.decision_id));
  const decisionHistory = index.filter((entry) => selectedIds.has(entry.decision_id)).map((entry) => {
    const decision = readVNextOperatorPilotReviewDecisionV01(db, input.config, proposal, entry.decision_id);
    if (!decision) throw reviewError("operator_pilot_persisted_decision_missing", 422);
    const provenance = validateVNextOperatorPilotReviewDecisionProvenanceV01(db, { ...input, proposal, decision });
    return {
      decision, ...provenance,
      pilot_actionable: provenance.pilot_actionable && effectiveCandidateIndexes.some(
        (current) => current.decision_id === decision.decision_id,
      ),
    };
  });
  const byId = new Map(decisionHistory.map((entry) => [entry.decision.decision_id, entry]));
  const effectiveByCandidate = new Map(effectiveCandidateIndexes.map((entry) =>
    [entry.candidate.candidate_id, byId.get(entry.decision_id)!],
  ));
  const exactDecisionKeys = new Set(index.map((entry) => `${entry.decision_id}\0${entry.integrity.fingerprint}`));
  const displayedDecisions = new Map(decisionHistory.map((entry) =>
    [`${entry.decision.decision_id}\0${entry.decision.integrity.fingerprint}`, entry.decision],
  ));
  type PositionedReceipt = { position: number; receipt: StateTransitionReceiptV01 };
  const recentReceipts: PositionedReceipt[] = [];
  const firstMatchingReceipts = new Map<string, PositionedReceipt>();
  let transitionCount = 0;
  for (const receipt of loadProposalTransitionReceipts(db, input.config, proposal, exactDecisionKeys)) {
    const positioned = { position: transitionCount++, receipt };
    recentReceipts.push(positioned);
    if (recentReceipts.length > REVIEW_HISTORY_DISPLAY_SIZE) recentReceipts.shift();
    const key = `${receipt.source_decision.decision_id}\0${receipt.source_decision.decision_fingerprint}`;
    const decision = displayedDecisions.get(key);
    if (decision && !firstMatchingReceipts.has(key) && findExactDecisionCandidateTransitionReceiptV01([receipt], decision)) {
      firstMatchingReceipts.set(key, positioned);
    }
  }
  const receipts = [...new Map([...firstMatchingReceipts.values(), ...recentReceipts]
    .map((entry) => [entry.receipt.transition_receipt_id, entry])).values()]
    .sort((left, right) => left.position - right.position).map((entry) => entry.receipt);
  return {
    decisions: decisionHistory.map((entry) => entry.decision),
    decision_history: decisionHistory,
    transition_receipts: receipts,
    effective: effectiveIndex ? byId.get(effectiveIndex.decision_id)! : null,
    effective_by_candidate: effectiveByCandidate,
    effective_candidate_decisions: effectiveCandidateIndexes.map((entry) => ({
      candidate_id: entry.candidate.candidate_id,
      candidate_fingerprint: entry.candidate.candidate_fingerprint,
      decision_id: entry.decision_id,
      decision_fingerprint: entry.integrity.fingerprint,
    })),
    history_read: {
      decisions: { total_count: index.length, returned_count: decisionHistory.length, complete: index.length === decisionHistory.length },
      transitions: { total_count: transitionCount, returned_count: receipts.length, complete: transitionCount === receipts.length },
    },
  };
}

function parseDecisionRequest(value: unknown): VNextOperatorPilotDecisionRequestV01 {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw reviewError("operator_pilot_decision_body_invalid");
  }
  const record = value as Record<string, unknown>;
  const allowed = new Set([
    "proposal_id",
    "proposal_fingerprint",
    "candidate_id",
    "candidate_fingerprint",
    "decision",
    "rationale_summary",
    "revisit",
  ]);
  if (Object.keys(record).some((key) => !allowed.has(key))) {
    throw reviewError("operator_pilot_decision_body_unknown_field");
  }
  const proposalId = requiredText(record.proposal_id, "proposal_id");
  const proposalFingerprint = sha256(record.proposal_fingerprint, "proposal_fingerprint");
  const candidateId = requiredText(record.candidate_id, "candidate_id");
  const candidateFingerprint = sha256(record.candidate_fingerprint, "candidate_fingerprint");
  const decision = normalizeProtocolTextV01(record.decision);
  if (
    !(
      ["accept", "reject", "defer", "supersede", "retract"] as const
    ).includes(decision as never)
  ) {
    throw reviewError("operator_pilot_decision_value_invalid");
  }
  const rationale = boundedText(record.rationale_summary, "rationale_summary");
  let revisit: { condition_summary: string } | null = null;
  if (record.revisit !== undefined && record.revisit !== null) {
    if (
      typeof record.revisit !== "object" ||
      Array.isArray(record.revisit) ||
      Object.keys(record.revisit).length !== 1 ||
      !("condition_summary" in record.revisit)
    ) {
      throw reviewError("operator_pilot_revisit_invalid");
    }
    revisit = {
      condition_summary: boundedText(
        (record.revisit as Record<string, unknown>).condition_summary,
        "revisit.condition_summary",
      ),
    };
  }
  if (decision === "defer" && !revisit) {
    throw reviewError("operator_pilot_defer_revisit_required");
  }
  if (decision !== "defer" && revisit) {
    throw reviewError("operator_pilot_revisit_not_allowed");
  }
  return {
    proposal_id: proposalId,
    proposal_fingerprint: proposalFingerprint,
    candidate_id: candidateId,
    candidate_fingerprint: candidateFingerprint,
    decision: decision as ReviewDecisionV01["decision"],
    rationale_summary: rationale,
    revisit,
  };
}

function findExactSemanticDecisionReplay(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  proposal: EpisodeDeltaProposalV01,
  authenticatedSessionId: string,
  request: VNextOperatorPilotDecisionRequestV01,
): ReviewDecisionV01 | null {
  const requestFingerprint =
    createVNextOperatorPilotDecisionRequestFingerprintV01(
      config,
      authenticatedSessionId,
      request,
    );
  const record = readVNextCoreRecordByIdempotencyKeyV01(db, {
    record_kind: "review_decision",
    workspace_id: config.workspace_id,
    project_id: config.project_id,
    idempotency_key: requestFingerprint,
  });
  if (!record) return null;
  if (validateReviewDecisionV01(record.payload).status !== "valid") {
    throw reviewError("operator_pilot_decision_replay_conflict", 409);
  }
  const decision = record.payload as ReviewDecisionV01;
  const provenance = validateVNextOperatorPilotReviewDecisionProvenanceV01(
    db,
    {
      config,
      proposal,
      decision,
      authenticated_session_id: authenticatedSessionId,
    },
  );
  if (
    provenance.status !== "valid" ||
    provenance.request_fingerprint !== requestFingerprint ||
    provenance.session_id !== authenticatedSessionId
  ) {
    throw reviewError("operator_pilot_decision_replay_conflict", 409);
  }
  return decision;
}

export function createVNextOperatorPilotDecisionRequestFingerprintV01(
  config: VNextLocalOperatorPilotConfigV01,
  sessionId: string,
  request: VNextOperatorPilotDecisionRequestV01,
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      request_version: VNEXT_OPERATOR_PILOT_DECISION_REQUEST_VERSION_V01,
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      operator_id: config.operator_id,
      session_id: requiredText(sessionId, "session_id"),
      proposal_id: request.proposal_id,
      proposal_fingerprint: request.proposal_fingerprint,
      candidate_id: request.candidate_id,
      candidate_fingerprint: request.candidate_fingerprint,
      decision: request.decision,
      rationale_summary: request.rationale_summary,
      revisit: request.revisit ?? null,
    }),
  );
}

export function validateVNextOperatorPilotReviewDecisionProvenanceV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    proposal: EpisodeDeltaProposalV01;
    decision: ReviewDecisionV01;
    authenticated_session_id: string | null;
  },
): VNextOperatorPilotDecisionProvenanceValidationV01 {
  const { config, proposal, decision } = input;
  const errors: string[] = [];
  const add = (code: string) => {
    if (!errors.includes(code)) errors.push(code);
  };

  if (validateReviewDecisionV01(decision).status !== "valid") {
    add("operator_pilot_decision_invalid");
  }
  if (
    validateReviewDecisionAgainstEpisodeDeltaProposalV01(decision, proposal)
      .status !== "valid"
  ) {
    add("operator_pilot_decision_relation_invalid");
  }
  if (
    decision.workspace_id !== config.workspace_id ||
    decision.project_id !== config.project_id ||
    proposal.workspace_id !== config.workspace_id ||
    proposal.project_id !== config.project_id
  ) {
    add("operator_pilot_decision_scope_mismatch");
  }

  const basis =
    decision.authorization_basis_refs.length === 1
      ? decision.authorization_basis_refs[0]!
      : null;
  if (!basis) add("operator_pilot_decision_session_basis_count_invalid");
  if (
    !basis ||
    basis.ref_type !== "local_operator_session_action" ||
    basis.trust_class !== "direct_local_observation" ||
    basis.compatibility_namespace !== VNEXT_LOCAL_OPERATOR_SESSION_NAMESPACE_V01 ||
    basis.observed_at !== decision.decided_at ||
    !basis.source_ref
  ) {
    add("operator_pilot_decision_session_basis_invalid");
  }

  const sessionId = basis?.external_id ?? null;
  const session = sessionId
    ? readVNextLocalOperatorSessionHistoryV01(db, { session_id: sessionId })
    : null;
  if (!session) {
    add("operator_pilot_decision_session_missing");
  } else {
    if (
      session.workspace_id !== config.workspace_id ||
      session.project_id !== config.project_id ||
      session.operator_id !== config.operator_id
    ) {
      add("operator_pilot_decision_session_scope_mismatch");
    }
    if (!session.bootstrap_consumed_at) {
      add("operator_pilot_decision_session_bootstrap_unconsumed");
    }
    const issuedAt = parseStrictIsoTimestampV01(session.issued_at);
    const expiresAt = parseStrictIsoTimestampV01(session.expires_at);
    const decidedAt = parseStrictIsoTimestampV01(decision.decided_at);
    const consumedAt = session.bootstrap_consumed_at
      ? parseStrictIsoTimestampV01(session.bootstrap_consumed_at)
      : null;
    const revokedAt = session.revoked_at
      ? parseStrictIsoTimestampV01(session.revoked_at)
      : null;
    if (
      issuedAt === null ||
      expiresAt === null ||
      decidedAt === null ||
      (session.bootstrap_consumed_at !== null && consumedAt === null) ||
      (session.revoked_at !== null && revokedAt === null)
    ) {
      add("operator_pilot_decision_session_timestamp_invalid");
    } else {
      if (decidedAt < issuedAt || decidedAt > expiresAt) {
        add("operator_pilot_decision_outside_session_lifetime");
      }
      if (consumedAt !== null && consumedAt > decidedAt) {
        add("operator_pilot_decision_before_bootstrap_consumption");
      }
      if (revokedAt !== null && revokedAt < decidedAt) {
        add("operator_pilot_decision_after_session_revocation");
      }
    }
  }

  const request = decisionRequestFromPersistedDecision(decision);
  const requestFingerprint = request && sessionId
    ? createVNextOperatorPilotDecisionRequestFingerprintV01(
        config,
        sessionId,
        request,
      )
    : null;
  if (!request) add("operator_pilot_decision_request_identity_invalid");

  if (
    decision.actor_ref.ref_type !== "local_operator_actor" ||
    decision.actor_ref.external_id !== config.operator_id ||
    decision.actor_ref.trust_class !== "user_declaration" ||
    decision.actor_ref.compatibility_namespace !==
      VNEXT_OPERATOR_PILOT_ACTOR_NAMESPACE_V01 ||
    decision.actor_ref.observed_at !== decision.decided_at ||
    decision.actor_ref.source_ref !== basis?.source_ref
  ) {
    add("operator_pilot_decision_actor_binding_invalid");
  }

  if (basis && request && session) {
    const expectedBasis = createVNextOperatorPilotReviewDecisionSessionBasisRefV01(
      config,
      session,
      request,
      decision.decided_at,
    );
    if (!exactExternalRef(basis, expectedBasis)) {
      add("operator_pilot_decision_session_basis_mismatch");
    }
    const expectedActor: ExternalRefV01 = {
      ref_version: EXTERNAL_REF_VERSION_V01,
      ref_type: "local_operator_actor",
      external_id: config.operator_id,
      trust_class: "user_declaration",
      observed_at: decision.decided_at,
      source_ref: expectedBasis.source_ref,
      compatibility_namespace: VNEXT_OPERATOR_PILOT_ACTOR_NAMESPACE_V01,
    };
    if (!exactExternalRef(decision.actor_ref, expectedActor)) {
      add("operator_pilot_decision_actor_provenance_mismatch");
    }
  }

  const compatibilitySessionRefs = decision.compatibility.external_refs.filter(
    (ref) => ref.ref_type === "local_operator_session_action",
  );
  if (
    !basis ||
    compatibilitySessionRefs.length !== 1 ||
    !exactExternalRef(compatibilitySessionRefs[0]!, basis)
  ) {
    add("operator_pilot_decision_compatibility_session_basis_mismatch");
  }
  for (const contract of [
    proposal.proposal_version,
    VNEXT_OPERATOR_PILOT_REVIEW_MATERIAL_VERSION_V01,
    VNEXT_OPERATOR_PILOT_POLICY_VERSION_V01,
    VNEXT_OPERATOR_PILOT_DECISION_REQUEST_VERSION_V01,
  ]) {
    if (!decision.compatibility.source_contracts.includes(contract)) {
      add("operator_pilot_decision_source_contract_missing");
    }
  }

  const candidate = proposal.proposed_deltas.find(
    (value) =>
      value.candidate_id === decision.candidate.candidate_id &&
      createEpisodeDeltaCandidateFingerprintV01(value) ===
        decision.candidate.candidate_fingerprint,
  );
  if (!candidate) add("operator_pilot_decision_candidate_binding_invalid");
  let applying: VNextOperatorPilotApplyingDecisionV01 | null = null;
  let priorDecisionBinding: {
    decision_id: string;
    decision_fingerprint: string;
  } | null = null;
  if (candidate) {
    try {
      applying = resolveVNextOperatorPilotApplyingDecisionV01(
        proposal,
        candidate,
      );
      priorDecisionBinding = resolveProjectVerifyPriorDecisionBindingV01(
        db,
        config,
        proposal,
      );
    } catch {
      add("operator_pilot_decision_project_verify_lineage_invalid");
    }
  }
  const applyingDecision =
    applying !== null && decision.decision === applying.decision;
  if (isApplyingDecisionV01(decision.decision) && !applyingDecision) {
    add("operator_pilot_decision_operation_mismatch");
  }
  const transitionApplyingDecision =
    applyingDecision && applying?.review_mode === "semantic_transition";
  if (transitionApplyingDecision && applying) {
    const intent = decision.requested_transition_intent;
    if (
      !intent ||
      intent.transition_kind !== applying.transition_kind ||
      intent.target_refs.length !== applying.target_refs.length ||
      intent.intent_only !== true ||
      intent.applied !== false ||
      intent.state_transition_receipt_ref !== null ||
      canonicalizeProtocolValueV01(intent.target_refs) !==
        canonicalizeProtocolValueV01(applying.target_refs) ||
      intent.intent_id !==
        deriveIntentId(
          proposal.proposal_id,
          decision.candidate.candidate_id,
          config.operator_id,
          decision.decided_at,
          applying.transition_kind,
        )
    ) {
      add("operator_pilot_decision_transition_intent_invalid");
    }
  } else if (decision.requested_transition_intent !== null) {
    add("operator_pilot_decision_transition_intent_forbidden");
  }
  const expectedLineage = {
    prior_decisions:
      transitionApplyingDecision && priorDecisionBinding
        ? [priorDecisionBinding]
        : [],
    superseding_candidate:
      transitionApplyingDecision && applying?.decision === "supersede"
        ? {
            candidate_id: decision.candidate.candidate_id,
            candidate_fingerprint: decision.candidate.candidate_fingerprint,
          }
        : null,
    retracted_decision:
      transitionApplyingDecision && applying?.decision === "retract"
        ? priorDecisionBinding
        : null,
  };
  if (
    canonicalizeProtocolValueV01(decision.lineage) !==
    canonicalizeProtocolValueV01(expectedLineage)
  ) {
    add("operator_pilot_decision_lineage_mismatch");
  }
  if (decision.decision === "defer") {
    if (
      !decision.revisit ||
      decision.revisit.revisit_at !==
        addMilliseconds(
          decision.decided_at,
          VNEXT_OPERATOR_PILOT_DEFAULT_DEFER_REVISIT_MS_V01,
        ) ||
      decision.revisit.expires_at !==
        addMilliseconds(
          decision.decided_at,
          VNEXT_OPERATOR_PILOT_DEFAULT_DEFER_EXPIRY_MS_V01,
        ) ||
      !decision.revisit.condition_summary
    ) {
      add("operator_pilot_decision_revisit_invalid");
    }
  } else if (decision.revisit !== null) {
    add("operator_pilot_decision_revisit_forbidden");
  }

  const record = readVNextCoreRecordV01(db, {
    record_kind: "review_decision",
    record_id: decision.decision_id,
    workspace_id: config.workspace_id,
    project_id: config.project_id,
  });
  if (!record) {
    add("operator_pilot_decision_record_missing");
  } else if (
    record.record_id !== decision.decision_id ||
    record.fingerprint !== decision.integrity.fingerprint ||
    record.created_at !== decision.decided_at ||
    record.idempotency_key !== requestFingerprint ||
    canonicalizeProtocolValueV01(record.payload) !==
      canonicalizeProtocolValueV01(decision)
  ) {
    add("operator_pilot_decision_record_provenance_mismatch");
  }

  // authenticated_session_id is an application-local read context supplied
  // only after normal credential authentication. It is not Decision provenance
  // or an execution grant. Mutating owners authenticate again inside their CAS.
  const currentActionSession = input.authenticated_session_id
    ? readVNextLocalOperatorSessionHistoryV01(db, { session_id: input.authenticated_session_id })
    : null;
  const valid = errors.length === 0;
  return {
    status: valid ? "valid" : "invalid",
    pilot_session_bound: valid,
    pilot_actionable:
      valid && applyingDecision && currentActionSession !== null &&
      currentActionSession.workspace_id === config.workspace_id &&
      currentActionSession.project_id === config.project_id &&
      currentActionSession.operator_id === config.operator_id &&
      currentActionSession.bootstrap_consumed_at !== null &&
      currentActionSession.revoked_at === null,
    session_id: valid ? sessionId : null,
    request_fingerprint: valid ? requestFingerprint : null,
    errors,
  };
}

function decisionRequestFromPersistedDecision(
  decision: ReviewDecisionV01,
): VNextOperatorPilotDecisionRequestV01 | null {
  if (
    !(
      ["accept", "reject", "defer", "supersede", "retract"] as const
    ).includes(
      decision.decision,
    )
  ) {
    return null;
  }
  if (
    decision.decision === "defer" &&
    (!decision.revisit || !decision.revisit.condition_summary)
  ) {
    return null;
  }
  return {
    proposal_id: decision.source_proposal.proposal_id,
    proposal_fingerprint: decision.source_proposal.proposal_fingerprint,
    candidate_id: decision.candidate.candidate_id,
    candidate_fingerprint: decision.candidate.candidate_fingerprint,
    decision: decision.decision,
    rationale_summary: decision.rationale_summary,
    revisit:
      decision.decision === "defer"
        ? { condition_summary: decision.revisit!.condition_summary! }
        : null,
  };
}

function exactExternalRef(left: ExternalRefV01, right: ExternalRefV01): boolean {
  return (
    canonicalizeProtocolValueV01(left) ===
    canonicalizeProtocolValueV01(right)
  );
}

export function createVNextOperatorPilotReviewDecisionSessionBasisRefV01(
  config: VNextLocalOperatorPilotConfigV01,
  session: VNextLocalOperatorSessionPublicV01,
  request: VNextOperatorPilotDecisionRequestV01,
  observedAt: string,
): ExternalRefV01 {
  const fingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      action: "record_review_decision",
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      operator_id: config.operator_id,
      session_id: session.session_id,
      request: {
        proposal_id: request.proposal_id,
        proposal_fingerprint: request.proposal_fingerprint,
        candidate_id: request.candidate_id,
        candidate_fingerprint: request.candidate_fingerprint,
        decision: request.decision,
        rationale_summary: request.rationale_summary,
        revisit: request.revisit ?? null,
      },
      observed_at: observedAt,
    }),
  );
  return {
    ref_version: EXTERNAL_REF_VERSION_V01,
    ref_type: "local_operator_session_action",
    external_id: session.session_id,
    trust_class: "direct_local_observation",
    observed_at: observedAt,
    source_ref: fingerprint,
    compatibility_namespace: "augnes.vnext.local-operator-session.v0.1",
  };
}

function deriveIntentId(
  proposalId: string,
  candidateId: string,
  operatorId: string,
  decidedAt: string,
  transitionKind:
    VNextOperatorPilotApplyingDecisionV01["transition_kind"],
): string {
  const hash = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      proposal_id: proposalId,
      candidate_id: candidateId,
      operator_id: operatorId,
      decided_at: decidedAt,
      transition_kind: transitionKind,
    }),
  );
  return `transition-intent:${hash.slice(7, 31)}`;
}

function aggregateAdmissionState(
  admissions: VNextOperatorPilotCandidateAdmissionV01[],
): VNextOperatorPilotCurrentStateStatusV01 {
  if (admissions.some((item) => item.current_state_status === "drifted")) {
    return "drifted";
  }
  const values = new Set(admissions.map((item) => item.current_state_status));
  if (values.size > 1 || values.has("mixed")) return "mixed";
  return values.has("present") ? "present" : "absent";
}

function assertOperationAwareRevisionRelation(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  proposal: EpisodeDeltaProposalV01,
  visitedProposalIds: Set<string>,
): void {
  const revision = proposal.operation_revision;
  if (!revision) return;
  if (visitedProposalIds.has(revision.source.proposal_id)) {
    throw reviewError("operator_pilot_revision_source_cycle", 409);
  }
  const sourceRecord = readVNextCoreRecordV01(db, {
    record_kind: "episode_delta_proposal",
    record_id: revision.source.proposal_id,
    workspace_id: config.workspace_id,
    project_id: config.project_id,
  });
  if (!sourceRecord) {
    throw reviewError("operator_pilot_revision_source_proposal_missing", 404);
  }
  if (
    sourceRecord.fingerprint !== revision.source.proposal_fingerprint ||
    validateEpisodeDeltaProposalV01(sourceRecord.payload).status !== "valid"
  ) {
    throw reviewError("operator_pilot_revision_source_proposal_conflict", 409);
  }
  const source = sourceRecord.payload as EpisodeDeltaProposalV01;
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(sourceRecord, {
    workspace_id: source.workspace_id,
    project_id: source.project_id,
    fingerprint: source.integrity.fingerprint,
  });
  if (
    sourceRecord.record_id !== source.proposal_id ||
    sourceRecord.created_at !== source.created_at ||
    source.proposal_id !== revision.source.proposal_id ||
    source.integrity.fingerprint !== revision.source.proposal_fingerprint
  ) {
    throw reviewError("operator_pilot_revision_source_envelope_conflict", 409);
  }
  assertScope(config, source.workspace_id, source.project_id);
  const nextVisited = new Set(visitedProposalIds).add(source.proposal_id);
  assertOperationAwareRevisionRelation(db, config, source, nextVisited);

  const sourceCandidate = source.proposed_deltas.find(
    (candidate) =>
      candidate.candidate_id === revision.source.candidate_id &&
      createEpisodeDeltaCandidateFingerprintV01(candidate) ===
        revision.source.candidate_fingerprint,
  );
  const revisedCandidate = proposal.proposed_deltas.find(
    (candidate) =>
      candidate.candidate_id === revision.revised_candidate.candidate_id &&
      createEpisodeDeltaCandidateFingerprintV01(candidate) ===
        revision.revised_candidate.candidate_fingerprint,
  );
  if (!sourceCandidate || !revisedCandidate) {
    throw reviewError("operator_pilot_revision_candidate_relation_conflict", 409);
  }
  const compatibility =
    evaluateVNextOperatorPilotRevisionDeltaTargetCompatibilityV01({
      source_proposal: source,
      source_candidate: sourceCandidate,
      revised_delta_type: revisedCandidate.delta_type,
      revised_target_refs: revisedCandidate.target_refs,
    });
  if (
    compatibility.status === "incompatible" ||
    revision.selected_delta_type !== revisedCandidate.delta_type
  ) {
    throw reviewError(
      OPERATOR_PILOT_REVISION_DELTA_TARGET_INCOMPATIBLE_V01,
      409,
    );
  }

  const authorBasis =
    revision.author_basis_refs.length === 1
      ? revision.author_basis_refs[0]!
      : null;
  const session = authorBasis
    ? readVNextLocalOperatorSessionHistoryV01(db, {
        session_id: authorBasis.external_id,
      })
    : null;
  const createdAt = parseStrictIsoTimestampV01(proposal.created_at);
  const issuedAt = session
    ? parseStrictIsoTimestampV01(session.issued_at)
    : null;
  const expiresAt = session
    ? parseStrictIsoTimestampV01(session.expires_at)
    : null;
  const consumedAt = session?.bootstrap_consumed_at
    ? parseStrictIsoTimestampV01(session.bootstrap_consumed_at)
    : null;
  const revokedAt = session?.revoked_at
    ? parseStrictIsoTimestampV01(session.revoked_at)
    : null;
  if (
    !authorBasis ||
    authorBasis.ref_type !== "local_operator_session_action" ||
    authorBasis.trust_class !== "direct_local_observation" ||
    authorBasis.compatibility_namespace !==
      VNEXT_LOCAL_OPERATOR_SESSION_NAMESPACE_V01 ||
    authorBasis.observed_at !== proposal.created_at ||
    !session ||
    session.workspace_id !== config.workspace_id ||
    session.project_id !== config.project_id ||
    session.operator_id !== config.operator_id ||
    !session.bootstrap_consumed_at ||
    createdAt === null ||
    issuedAt === null ||
    expiresAt === null ||
    consumedAt === null ||
    createdAt < issuedAt ||
    createdAt > expiresAt ||
    consumedAt > createdAt ||
    (session.revoked_at !== null &&
      (revokedAt === null || revokedAt < createdAt))
  ) {
    throw reviewError("operator_pilot_revision_author_session_conflict", 409);
  }
  const idempotencyKey = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      request_version: "vnext_operator_pilot_proposal_revision_request.v0.1",
      revision_profile:
        OPERATION_AWARE_PROPOSAL_REVISION_PROFILE_VERSION_V01,
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      operator_id: config.operator_id,
      session_id: session.session_id,
      source_proposal_id: source.proposal_id,
      source_proposal_fingerprint: source.integrity.fingerprint,
      source_candidate_id: sourceCandidate.candidate_id,
      source_candidate_fingerprint:
        createEpisodeDeltaCandidateFingerprintV01(sourceCandidate),
    }),
  );
  const provenanceFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      action: "record_operation_aware_proposal_revision",
      profile: OPERATION_AWARE_PROPOSAL_REVISION_PROFILE_VERSION_V01,
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      operator_id: config.operator_id,
      session_id: session.session_id,
      source_proposal_id: source.proposal_id,
      source_proposal_fingerprint: source.integrity.fingerprint,
      source_candidate_id: sourceCandidate.candidate_id,
      source_candidate_fingerprint:
        createEpisodeDeltaCandidateFingerprintV01(sourceCandidate),
      idempotency_key: idempotencyKey,
      created_at: proposal.created_at,
    }),
  );
  const expectedAuthorBasis: ExternalRefV01 = {
    ref_version: EXTERNAL_REF_VERSION_V01,
    ref_type: "local_operator_session_action",
    external_id: session.session_id,
    trust_class: "direct_local_observation",
    observed_at: proposal.created_at,
    source_ref: provenanceFingerprint,
    compatibility_namespace: VNEXT_LOCAL_OPERATOR_SESSION_NAMESPACE_V01,
  };
  const expectedAuthor: ExternalRefV01 = {
    ref_version: EXTERNAL_REF_VERSION_V01,
    ref_type: "local_operator_actor",
    external_id: config.operator_id,
    trust_class: "user_declaration",
    observed_at: proposal.created_at,
    source_ref: provenanceFingerprint,
    compatibility_namespace:
      "augnes.vnext.operation-aware-proposal-revision.v0.1",
  };
  if (
    revision.admission_idempotency_key !== idempotencyKey ||
    !exactExternalRef(authorBasis, expectedAuthorBasis) ||
    !exactExternalRef(revision.authored_by_ref, expectedAuthor)
  ) {
    throw reviewError("operator_pilot_revision_provenance_conflict", 409);
  }

  const sourceProposalRef = revisionLineageRef(
    "episode_delta_proposal",
    source.proposal_id,
    source.created_at,
    source.integrity.fingerprint,
  );
  const sourceCandidateRef = revisionLineageRef(
    "episode_delta_candidate",
    sourceCandidate.candidate_id,
    source.created_at,
    createEpisodeDeltaCandidateFingerprintV01(sourceCandidate),
  );
  const immutablePairs: Array<[unknown, unknown]> = [
    [proposal.task_context_packet_ref, source.task_context_packet_ref],
    [proposal.run_receipt_refs, source.run_receipt_refs],
    [proposal.source_assessment ?? null, source.source_assessment ?? null],
    [
      proposal.strategic_advantage_transfer ?? null,
      source.strategic_advantage_transfer ?? null,
    ],
    [proposal.observations, source.observations],
    [proposal.attestations, source.attestations],
    [proposal.inferences, source.inferences],
    [proposal.conflicts, source.conflicts],
    [proposal.missing_information, source.missing_information],
    [proposal.uncertainties, source.uncertainties],
    [proposal.source_status, source.source_status],
    [proposal.compatibility.unmapped_fields, source.compatibility.unmapped_fields],
  ];
  if (
    immutablePairs.some(
      ([left, right]) =>
        canonicalizeProtocolValueV01(left) !==
        canonicalizeProtocolValueV01(right),
    ) ||
    proposal.bounded_summary !==
      `Operation-aware revision: ${revisedCandidate.title}` ||
    proposal.status !== "pending_review" ||
    canonicalizeProtocolValueV01(proposal.proposed_deltas) !==
      canonicalizeProtocolValueV01(
        uniqueProtocolValuesV01([
          ...source.proposed_deltas,
          revisedCandidate,
        ]).sort(compareProtocolCanonicalV01),
      ) ||
    canonicalizeProtocolValueV01(proposal.limitations) !==
      canonicalizeProtocolValueV01(
        uniqueProtocolStringsV01([
          ...source.limitations,
          "The source proposal and candidate remain immutable history.",
          "Operation-aware editing does not create a ReviewDecision, gate authorization, Transition, or later packet.",
        ]),
      ) ||
    canonicalizeProtocolValueV01(proposal.source_refs) !==
      canonicalizeProtocolValueV01(
        revisionRefs([
          ...source.source_refs,
          sourceProposalRef,
          sourceCandidateRef,
          expectedAuthorBasis,
        ]),
      ) ||
    canonicalizeProtocolValueV01(proposal.compatibility.source_contracts) !==
      canonicalizeProtocolValueV01(
        uniqueProtocolStringsV01([
          ...source.compatibility.source_contracts,
          OPERATION_AWARE_PROPOSAL_REVISION_PROFILE_VERSION_V01,
          "vnext_operator_pilot_proposal_revision_request.v0.1",
        ]),
      ) ||
    canonicalizeProtocolValueV01(proposal.compatibility.warnings) !==
      canonicalizeProtocolValueV01(
        uniqueProtocolStringsV01([
          ...source.compatibility.warnings,
          "The explicit operation is operator-authored candidate material and remains non-authoritative.",
        ]),
      ) ||
    canonicalizeProtocolValueV01(proposal.compatibility.external_refs) !==
      canonicalizeProtocolValueV01(
        revisionRefs([
          ...source.compatibility.external_refs,
          sourceProposalRef,
          sourceCandidateRef,
          expectedAuthorBasis,
        ]),
      )
  ) {
    throw reviewError("operator_pilot_revision_immutable_material_conflict", 409);
  }
}

function revisionLineageRef(
  refType: string,
  externalId: string,
  observedAt: string,
  sourceRef: string,
): ExternalRefV01 {
  return {
    ref_version: EXTERNAL_REF_VERSION_V01,
    ref_type: refType,
    external_id: externalId,
    trust_class: "derived_interpretation",
    observed_at: observedAt,
    source_ref: sourceRef,
    compatibility_namespace:
      "augnes.vnext.operation-aware-proposal-revision.v0.1",
  };
}

function revisionRefs(values: ExternalRefV01[]): ExternalRefV01[] {
  return uniqueProtocolValuesV01(
    values.map(normalizeExternalRefPrimitiveV01),
  ).sort(compareExternalRefsV01);
}

function assertScope(
  config: VNextLocalOperatorPilotConfigV01,
  workspaceId: string,
  projectId: string,
): void {
  if (
    workspaceId !== config.workspace_id ||
    projectId !== config.project_id
  ) {
    throw reviewError("operator_pilot_review_scope_mismatch", 403);
  }
}

function assertSessionScope(
  config: VNextLocalOperatorPilotConfigV01,
  session: VNextLocalOperatorSessionPublicV01,
): void {
  if (
    !session.authenticated ||
    session.workspace_id !== config.workspace_id ||
    session.project_id !== config.project_id ||
    session.operator_id !== config.operator_id ||
    session.revoked_at !== null
  ) {
    throw reviewError("operator_pilot_session_scope_mismatch", 403);
  }
}

function requiredText(value: unknown, field: string): string {
  const text = normalizeProtocolTextV01(value);
  if (!text || text.length > 256) {
    throw reviewError(`operator_pilot_${field}_invalid`);
  }
  return text;
}

function sha256(value: unknown, field: string): string {
  const text = requiredText(value, field);
  if (!/^sha256:[a-f0-9]{64}$/.test(text)) {
    throw reviewError(`operator_pilot_${field}_invalid`);
  }
  return text;
}

function boundedText(value: unknown, field: string): string {
  const text = normalizeProtocolTextV01(value);
  if (!text || text.length > 2000) {
    throw reviewError(`operator_pilot_${field}_invalid`);
  }
  return text;
}

function addMilliseconds(timestamp: string, delta: number): string {
  const value = parseStrictIsoTimestampV01(timestamp);
  if (value === null) throw reviewError("operator_pilot_timestamp_invalid", 500);
  return new Date(value + delta).toISOString();
}

function reviewError(code: string, status = 400): VNextOperatorPilotReviewErrorV01 {
  return new VNextOperatorPilotReviewErrorV01(code, status);
}
