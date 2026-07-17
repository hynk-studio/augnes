import type Database from "better-sqlite3";

import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  assertVNextDurableSemanticStoreSchemaV01,
  insertVNextCoreRecordV01,
  readVNextCoreRecordV01,
  readVNextCoreRecordByIdempotencyKeyV01,
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
  readVNextLocalOperatorSessionHistoryV01,
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

export const VNEXT_OPERATOR_PILOT_REVIEW_MATERIAL_VERSION_V01 =
  "vnext_operator_pilot_review_material.v0.1" as const;
export const VNEXT_OPERATOR_PILOT_DEFAULT_DEFER_REVISIT_MS_V01 =
  24 * 60 * 60 * 1000;
export const VNEXT_OPERATOR_PILOT_DEFAULT_DEFER_EXPIRY_MS_V01 =
  7 * 24 * 60 * 60 * 1000;
export const VNEXT_OPERATOR_PILOT_MAX_REVIEW_RECORDS_V01 = 128;
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
  decision_history: VNextOperatorPilotDecisionHistoryItemV01[];
  transition_receipts: StateTransitionReceiptV01[];
  transition: {
    status: "not_applied" | "applied";
    transition_receipt_id: string | null;
    transition_receipt_fingerprint: string | null;
    notes: string[];
  };
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

export function listVNextOperatorPilotSemanticReviewsV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    authenticated_session_id: string | null;
  },
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
      authenticated_session_id: input.authenticated_session_id,
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
    authenticated_session_id: string | null;
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
  const decisionHistory = decisions.map((decision) => ({
    decision,
    ...validateVNextOperatorPilotReviewDecisionProvenanceV01(db, {
      config: input.config,
      proposal,
      decision,
      authenticated_session_id: input.authenticated_session_id,
    }),
  }));
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
    decision_history: decisionHistory,
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
    authentication.session.session_id,
  );
  const prevalidatedReplay = findExactSemanticDecisionReplay(
    db,
    input.config,
    prevalidated.proposal,
    authentication.session.session_id,
    request,
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
      nonceAdmission.session.session_id,
    );
    const replay = findExactSemanticDecisionReplay(
      db,
      input.config,
      material.proposal,
      nonceAdmission.session.session_id,
      request,
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
          VNEXT_OPERATOR_PILOT_DECISION_REQUEST_VERSION_V01,
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
  authenticatedSessionId: string,
): ResolvedDecisionRequestMaterialV01 {
  const detail = readVNextOperatorPilotSemanticReviewV01(db, {
    config,
    proposal_id: request.proposal_id,
    authenticated_session_id: authenticatedSessionId,
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
        record.created_at !== decision.decided_at
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
      const transition = loadValidatedVNextSemanticTransitionRelationV01(db, {
        workspace_id: config.workspace_id,
        project_id: config.project_id,
        transition_receipt_id: row.record_id,
        transition_receipt_fingerprint: row.fingerprint,
      });
      if (
        validateVNextOperatorPilotReviewDecisionProvenanceV01(db, {
          config,
          proposal: transition.proposal,
          decision: transition.decision,
          authenticated_session_id: null,
        }).status !== "valid"
      ) {
        throw reviewError(
          "operator_pilot_transition_decision_provenance_invalid",
          422,
        );
      }
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
  if (decision.decision === "accept") {
    const intent = decision.requested_transition_intent;
    if (
      !intent ||
      intent.transition_kind !== "semantic_candidate_apply" ||
      intent.target_refs.length !== 1 ||
      intent.intent_only !== true ||
      intent.applied !== false ||
      intent.state_transition_receipt_ref !== null ||
      !candidate ||
      candidate.target_refs.length !== 1 ||
      canonicalizeProtocolValueV01(intent.target_refs) !==
        canonicalizeProtocolValueV01(candidate.target_refs) ||
      intent.intent_id !==
        deriveIntentId(
          proposal.proposal_id,
          decision.candidate.candidate_id,
          config.operator_id,
          decision.decided_at,
        )
    ) {
      add("operator_pilot_decision_transition_intent_invalid");
    }
  } else if (decision.requested_transition_intent !== null) {
    add("operator_pilot_decision_transition_intent_forbidden");
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

  const valid = errors.length === 0;
  return {
    status: valid ? "valid" : "invalid",
    pilot_session_bound: valid,
    pilot_actionable:
      valid &&
      decision.decision === "accept" &&
      sessionId === input.authenticated_session_id,
    session_id: valid ? sessionId : null,
    request_fingerprint: valid ? requestFingerprint : null,
    errors,
  };
}

function decisionRequestFromPersistedDecision(
  decision: ReviewDecisionV01,
): VNextOperatorPilotDecisionRequestV01 | null {
  if (
    !(["accept", "reject", "defer"] as const).includes(
      decision.decision as "accept" | "reject" | "defer",
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
    decision: decision.decision as "accept" | "reject" | "defer",
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
