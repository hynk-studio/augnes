import type Database from "better-sqlite3";

import { mapCodexSemanticReviewToEpisodeDeltaProposalV01 } from "@/lib/vnext/compat/episode-delta-proposal-from-codex-review";
import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  assertVNextDurableSemanticStoreSchemaV01,
  insertVNextCoreRecordV01,
  readVNextCoreRecordV01,
  type VNextCoreRecordWriteResultV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  normalizeProtocolTextV01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import {
  buildReviewDecisionV01,
  createEpisodeDeltaCandidateFingerprintV01,
  validateReviewDecisionAgainstEpisodeDeltaProposalV01,
  validateReviewDecisionV01,
} from "@/lib/vnext/review-decision";
import { validateRunReceiptV01 } from "@/lib/vnext/run-receipt";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import { validateStateTransitionReceiptV01 } from "@/lib/vnext/state-transition-receipt";
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
} from "@/lib/vnext/runtime/local-operator-session";
import {
  inspectVNextOperatorPilotCandidateAdmissionV01,
  VNEXT_OPERATOR_PILOT_POLICY_VERSION_V01,
  type VNextOperatorPilotCandidateAdmissionV01,
  type VNextOperatorPilotCurrentStateStatusV01,
} from "@/lib/vnext/runtime/operator-pilot-policy";
import { EXTERNAL_REF_VERSION_V01, type ExternalRefV01 } from "@/types/vnext/external-ref";
import type {
  EpisodeDeltaProposalDeltaCandidateV01,
  EpisodeDeltaProposalV01,
} from "@/types/vnext/episode-delta-proposal";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { StateTransitionReceiptV01 } from "@/types/vnext/state-transition-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

export const VNEXT_OPERATOR_PILOT_REVIEW_MATERIAL_VERSION_V01 =
  "vnext_operator_pilot_review_material.v0.1" as const;
export const VNEXT_OPERATOR_PILOT_DEFAULT_DEFER_REVISIT_MS_V01 =
  24 * 60 * 60 * 1000;
export const VNEXT_OPERATOR_PILOT_DEFAULT_DEFER_EXPIRY_MS_V01 =
  7 * 24 * 60 * 60 * 1000;
export const VNEXT_OPERATOR_PILOT_MAX_REVIEW_RECORDS_V01 = 128;

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

export interface VNextOperatorPilotPreparedReviewMaterialV01 {
  material_version: typeof VNEXT_OPERATOR_PILOT_REVIEW_MATERIAL_VERSION_V01;
  workspace_id: string;
  project_id: string;
  run_receipt: RunReceiptV01;
  proposal: EpisodeDeltaProposalV01;
  run_receipt_write_status: VNextCoreRecordWriteResultV01["status"];
  proposal_write_status: VNextCoreRecordWriteResultV01["status"];
  prior_packet: TaskContextPacketV01 | null;
  prior_packet_write_status: VNextCoreRecordWriteResultV01["status"] | null;
  decision_created: false;
  transition_created: false;
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
}

export interface VNextOperatorPilotReviewDetailV01
  extends VNextOperatorPilotReviewListItemV01 {
  proposal: EpisodeDeltaProposalV01;
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
  transition_receipts: StateTransitionReceiptV01[];
  transition: {
    status: "not_applied" | "applied";
    transition_receipt_id: string | null;
    transition_receipt_fingerprint: string | null;
    notes: string[];
  };
}

export interface VNextOperatorPilotDecisionRequestV01 {
  proposal_id: string;
  proposal_fingerprint: string;
  candidate_id: string;
  candidate_fingerprint: string;
  decision: "accept" | "reject" | "defer";
  rationale_summary: string;
  revisit?: { condition_summary: string } | null;
}

export interface VNextOperatorPilotDecisionResultV01 {
  status: "inserted" | "exact_replay";
  decision: ReviewDecisionV01;
  transition_requested: boolean;
  transition_applied: false;
  session_cookie: {
    value: string;
    expires_at: string;
    max_age_seconds: number;
  };
}

/** Maps and atomically persists one already-structured Codex semantic mapper input. */
export function prepareVNextOperatorPilotReviewMaterialV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    mapper_input: unknown;
    prior_packet?: unknown;
  },
): VNextOperatorPilotPreparedReviewMaterialV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const mapping = mapCodexSemanticReviewToEpisodeDeltaProposalV01(
    input.mapper_input,
  );
  if (mapping.status !== "mapped" || !mapping.receipt || !mapping.proposal) {
    throw reviewError(
      mapping.status === "blocked"
        ? "operator_pilot_review_material_blocked"
        : "operator_pilot_review_material_invalid",
      422,
    );
  }
  const receipt = mapping.receipt;
  const proposal = mapping.proposal;
  assertScope(input.config, receipt.workspace_id, receipt.project_id);
  assertScope(input.config, proposal.workspace_id, proposal.project_id);
  if (validateRunReceiptV01(receipt).status !== "valid") {
    throw reviewError("operator_pilot_run_receipt_invalid", 422);
  }
  if (validateEpisodeDeltaProposalV01(proposal).status !== "valid") {
    throw reviewError("operator_pilot_proposal_invalid", 422);
  }
  const priorPacket = validateOptionalPriorPacket(
    input.prior_packet,
    input.config,
    receipt,
    proposal,
  );
  if (db.inTransaction) {
    throw reviewError("operator_pilot_nested_transaction_forbidden", 409);
  }
  db.exec("BEGIN IMMEDIATE");
  try {
    const priorPacketWrite = priorPacket
      ? insertVNextCoreRecordV01(db, {
          record_kind: "task_context_packet",
          record_id: priorPacket.packet_id,
          workspace_id: priorPacket.workspace_id,
          project_id: priorPacket.project_id,
          fingerprint: priorPacket.integrity.fingerprint,
          idempotency_key: null,
          payload: priorPacket,
          created_at: priorPacket.generated_at,
        })
      : null;
    const receiptWrite = insertVNextCoreRecordV01(db, {
      record_kind: "run_receipt",
      record_id: receipt.receipt_id,
      workspace_id: receipt.workspace_id,
      project_id: receipt.project_id,
      fingerprint: receipt.integrity.fingerprint,
      idempotency_key: receipt.idempotency_key,
      payload: receipt,
      created_at: receipt.recorded_at,
    });
    const proposalWrite = insertVNextCoreRecordV01(db, {
      record_kind: "episode_delta_proposal",
      record_id: proposal.proposal_id,
      workspace_id: proposal.workspace_id,
      project_id: proposal.project_id,
      fingerprint: proposal.integrity.fingerprint,
      idempotency_key: null,
      payload: proposal,
      created_at: proposal.created_at,
    });
    db.exec("COMMIT");
    return {
      material_version: VNEXT_OPERATOR_PILOT_REVIEW_MATERIAL_VERSION_V01,
      workspace_id: proposal.workspace_id,
      project_id: proposal.project_id,
      run_receipt: receipt,
      proposal,
      run_receipt_write_status: receiptWrite.status,
      proposal_write_status: proposalWrite.status,
      prior_packet: priorPacket,
      prior_packet_write_status: priorPacketWrite?.status ?? null,
      decision_created: false,
      transition_created: false,
    };
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  }
}

function validateOptionalPriorPacket(
  value: unknown,
  config: VNextLocalOperatorPilotConfigV01,
  receipt: RunReceiptV01,
  proposal: EpisodeDeltaProposalV01,
): TaskContextPacketV01 | null {
  if (value === undefined || value === null) return null;
  const evaluatedAt =
    typeof value === "object" &&
    !Array.isArray(value) &&
    value !== null &&
    typeof (value as Record<string, unknown>).generated_at === "string"
      ? String((value as Record<string, unknown>).generated_at)
      : "";
  const validation = validateTaskContextPacketV01(value, { evaluated_at: evaluatedAt });
  if (validation.status !== "valid") {
    throw reviewError("operator_pilot_prior_packet_invalid", 422);
  }
  const packet = value as TaskContextPacketV01;
  assertScope(config, packet.workspace_id, packet.project_id);
  if (
    canonicalizeProtocolValueV01(receipt.task_context_packet_ref) !==
    canonicalizeProtocolValueV01(proposal.task_context_packet_ref)
  ) {
    throw reviewError(
      "operator_pilot_prior_packet_cross_contract_provenance_mismatch",
      422,
    );
  }
  for (const [field, ref] of [
    ["run_receipt", receipt.task_context_packet_ref],
    ["proposal", proposal.task_context_packet_ref],
  ] as const) {
    if (
      !ref ||
      ref.ref_type !== "task_context_packet" ||
      ref.external_id !== packet.packet_id ||
      ref.source_ref !== packet.integrity.fingerprint
    ) {
      throw reviewError(
        `operator_pilot_prior_packet_${field}_binding_mismatch`,
        422,
      );
    }
  }
  return packet;
}

export function listVNextOperatorPilotSemanticReviewsV01(
  db: Database.Database,
  input: { config: VNextLocalOperatorPilotConfigV01 },
): VNextOperatorPilotReviewListItemV01[] {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const rows = db.prepare(
    `SELECT record_id FROM vnext_core_records
     WHERE workspace_id = ? AND project_id = ?
       AND record_kind = 'episode_delta_proposal'
     ORDER BY created_at DESC, record_id
     LIMIT ?`,
  ).all(
    input.config.workspace_id,
    input.config.project_id,
    VNEXT_OPERATOR_PILOT_MAX_REVIEW_RECORDS_V01 + 1,
  ) as Array<{
    record_id: string;
  }>;
  if (rows.length > VNEXT_OPERATOR_PILOT_MAX_REVIEW_RECORDS_V01) {
    throw reviewError("operator_pilot_proposal_history_bound_exceeded", 422);
  }
  return rows.map((row) => {
    const detail = readVNextOperatorPilotSemanticReviewV01(db, {
      config: input.config,
      proposal_id: row.record_id,
    });
    return {
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
    };
  });
}

export function readVNextOperatorPilotSemanticReviewV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    proposal_id: string;
  },
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
    proposalRecord.created_at !== proposal.created_at
  ) {
    throw reviewError("operator_pilot_proposal_envelope_mismatch", 422);
  }
  assertScope(input.config, proposal.workspace_id, proposal.project_id);

  const sourceRunReceipts = loadSourceRunReceipts(
    db,
    input.config,
    proposal,
  );
  const decisions = loadProposalDecisions(db, input.config, proposal);
  const transitionReceipts = loadProposalTransitionReceipts(
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
    decision_count: decisions.length,
    transition_status:
      transitionReceipts.length > 0 ? "applied" : "not_applied",
    proposal,
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
  };
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
  );
  const prevalidatedReplay = findExactSemanticDecisionReplay(
    prevalidated.detail.decisions,
    request,
    input.config.operator_id,
  );
  if (
    !prevalidatedReplay &&
    request.decision === "accept" &&
    !prevalidated.admission.decision_allowed.accept
  ) {
    throw reviewError(
      prevalidated.admission.blocking_reasons[0] ??
        "operator_pilot_accept_not_admitted",
      409,
    );
  }
  if (db.inTransaction) {
    throw reviewError("operator_pilot_nested_transaction_forbidden", 409);
  }
  db.exec("BEGIN IMMEDIATE");
  try {
    const nonceAdmission =
      admitVNextLocalOperatorMutationInsideTransactionV01(db, {
        config: input.config,
        credential: input.credential,
        clock: input.clock,
        secret_source: input.secret_source,
      });
    assertSessionScope(input.config, nonceAdmission.session);
    const material = resolveDecisionRequestMaterial(
      db,
      input.config,
      request,
    );
    const replay = findExactSemanticDecisionReplay(
      material.detail.decisions,
      request,
      input.config.operator_id,
    );
    if (replay) {
      db.exec("COMMIT");
      return {
        status: "exact_replay",
        decision: replay,
        transition_requested: replay.requested_transition_intent !== null,
        transition_applied: false,
        session_cookie: admissionCookie(nonceAdmission),
      };
    }
    if (
      request.decision === "accept" &&
      !material.admission.decision_allowed.accept
    ) {
      throw reviewError(
        material.admission.blocking_reasons[0] ??
          "operator_pilot_accept_not_admitted",
        409,
      );
    }
    const decidedAt = nonceAdmission.action_observed_at;
    const sessionBasisRef = createSessionAuthorizationBasisRef(
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
        request.decision === "accept"
          ? {
              intent_id: deriveIntentId(
                material.proposal.proposal_id,
                material.candidate.candidate_id,
                input.config.operator_id,
                decidedAt,
              ),
              transition_kind: "semantic_candidate_apply",
              bounded_summary:
                "Request one later separately previewed and confirmed accept/create semantic transition for the selected candidate.",
              target_refs: [...material.candidate.target_refs],
              intent_only: true,
              applied: false,
              state_transition_receipt_ref: null,
            }
          : null,
      lineage: {
        prior_decisions: [],
        superseding_candidate: null,
        retracted_decision: null,
      },
      compatibility: {
        source_contracts: [
          material.proposal.proposal_version,
          VNEXT_OPERATOR_PILOT_REVIEW_MATERIAL_VERSION_V01,
          VNEXT_OPERATOR_PILOT_POLICY_VERSION_V01,
        ],
        unmapped_fields: [],
        warnings: [
          "Local session verification proves possession of a locally issued secret, not external or legal identity.",
          "The decision does not apply state; accept carries intent for a separate preview-confirm-commit path.",
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
      idempotency_key: null,
      payload: decision,
      created_at: decision.decided_at,
    });
    db.exec("COMMIT");
    return {
      status: write.status,
      decision,
      transition_requested: decision.requested_transition_intent !== null,
      transition_applied: false,
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

function resolveDecisionRequestMaterial(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  request: VNextOperatorPilotDecisionRequestV01,
): ResolvedDecisionRequestMaterialV01 {
  const detail = readVNextOperatorPilotSemanticReviewV01(db, {
    config,
    proposal_id: request.proposal_id,
  });
  const proposal = detail.proposal;
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

function loadProposalDecisions(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  proposal: EpisodeDeltaProposalV01,
): ReviewDecisionV01[] {
  const rows = db.prepare(
    `SELECT record_id FROM vnext_core_records
     WHERE workspace_id = ? AND project_id = ?
       AND record_kind = 'review_decision'
     ORDER BY created_at, record_id
     LIMIT ?`,
  ).all(
    config.workspace_id,
    config.project_id,
    VNEXT_OPERATOR_PILOT_MAX_REVIEW_RECORDS_V01 + 1,
  ) as Array<{
    record_id: string;
  }>;
  if (rows.length > VNEXT_OPERATOR_PILOT_MAX_REVIEW_RECORDS_V01) {
    throw reviewError("operator_pilot_decision_history_bound_exceeded", 422);
  }
  return rows
    .map((row) => {
      const record = readVNextCoreRecordV01(db, {
        record_kind: "review_decision",
        record_id: row.record_id,
        workspace_id: config.workspace_id,
        project_id: config.project_id,
      });
      if (!record) {
        throw reviewError("operator_pilot_persisted_decision_missing", 422);
      }
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
        record.created_at !== decision.decided_at ||
        record.idempotency_key !== null
      ) {
        throw reviewError(
          "operator_pilot_persisted_decision_envelope_mismatch",
          422,
        );
      }
      return decision;
    })
    .filter(
      (value): value is ReviewDecisionV01 =>
        typeof value === "object" &&
        value !== null &&
        (value as ReviewDecisionV01).source_proposal?.proposal_id ===
          proposal.proposal_id,
    )
    .map((decision) => {
      if (
        validateReviewDecisionAgainstEpisodeDeltaProposalV01(
          decision,
          proposal,
        ).status !== "valid"
      ) {
        throw reviewError("operator_pilot_persisted_decision_invalid", 422);
      }
      return decision;
    });
}

function loadProposalTransitionReceipts(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  proposal: EpisodeDeltaProposalV01,
): StateTransitionReceiptV01[] {
  const rows = db.prepare(
    `SELECT record_id, fingerprint, payload_json FROM vnext_core_records
     WHERE workspace_id = ? AND project_id = ?
       AND record_kind = 'state_transition_receipt'
     ORDER BY created_at, record_id
     LIMIT ?`,
  ).all(
    config.workspace_id,
    config.project_id,
    VNEXT_OPERATOR_PILOT_MAX_REVIEW_RECORDS_V01 + 1,
  ) as Array<{
    record_id: string;
    fingerprint: string;
    payload_json: string;
  }>;
  if (rows.length > VNEXT_OPERATOR_PILOT_MAX_REVIEW_RECORDS_V01) {
    throw reviewError("operator_pilot_transition_history_bound_exceeded", 422);
  }
  return rows
    .map((row) => ({ row, value: JSON.parse(row.payload_json) as unknown }))
    .filter(
      (entry): entry is { row: typeof rows[number]; value: StateTransitionReceiptV01 } =>
        typeof entry.value === "object" &&
        entry.value !== null &&
        (entry.value as StateTransitionReceiptV01).source_proposal?.proposal_id ===
          proposal.proposal_id,
    )
    .map(({ row, value }) => {
      if (
        validateStateTransitionReceiptV01(value).status !== "valid" ||
        value.source_proposal.proposal_fingerprint !==
          proposal.integrity.fingerprint
      ) {
        throw reviewError("operator_pilot_transition_receipt_invalid", 422);
      }
      loadValidatedVNextSemanticTransitionRelationV01(db, {
        workspace_id: config.workspace_id,
        project_id: config.project_id,
        transition_receipt_id: row.record_id,
        transition_receipt_fingerprint: row.fingerprint,
      });
      return value;
    });
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
  if (!(["accept", "reject", "defer"] as const).includes(decision as never)) {
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
    decision: decision as "accept" | "reject" | "defer",
    rationale_summary: rationale,
    revisit,
  };
}

function findExactSemanticDecisionReplay(
  decisions: ReviewDecisionV01[],
  request: VNextOperatorPilotDecisionRequestV01,
  operatorId: string,
): ReviewDecisionV01 | null {
  return (
    decisions.find(
      (decision) =>
        decision.candidate.candidate_id === request.candidate_id &&
        decision.candidate.candidate_fingerprint ===
          request.candidate_fingerprint &&
        decision.decision === request.decision &&
        decision.rationale_summary === request.rationale_summary &&
        decision.actor_ref.external_id === operatorId &&
        (request.decision !== "defer" ||
          decision.revisit?.condition_summary ===
            request.revisit?.condition_summary),
    ) ?? null
  );
}

function createSessionAuthorizationBasisRef(
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
): string {
  const hash = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      proposal_id: proposalId,
      candidate_id: candidateId,
      operator_id: operatorId,
      decided_at: decidedAt,
      transition_kind: "semantic_candidate_apply",
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
