import type Database from "better-sqlite3";

import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  assertVNextDurableSemanticStoreSchemaV01,
  deriveVNextSemanticTargetKeyV01,
  insertVNextCoreRecordV01,
  readVNextCoreRecordByIdempotencyKeyV01,
  readVNextCoreRecordV01,
  readVNextSemanticStateEntryV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import {
  canonicalizeProtocolValueV01,
  compareExternalRefsV01,
  createProtocolSha256V01,
  normalizeExternalRefPrimitiveV01,
  normalizeProtocolTextV01,
  uniqueProtocolStringsV01,
  uniqueProtocolValuesV01,
} from "@/lib/vnext/protocol-primitives";
import {
  buildEpisodeDeltaProposalV01,
  validateEpisodeDeltaProposalV01,
} from "@/lib/vnext/episode-delta-proposal";
import { createEpisodeDeltaCandidateFingerprintV01 } from "@/lib/vnext/review-decision";
import {
  admitVNextLocalOperatorMutationInsideTransactionV01,
  authenticateVNextLocalOperatorSessionV01,
  type VNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSecretSourceV01,
  type VNextLocalOperatorSessionCredentialV01,
  type VNextLocalOperatorSessionMutationAdmissionV01,
} from "@/lib/vnext/runtime/local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "@/lib/vnext/runtime/local-runtime-clock";
import {
  readVNextOperatorPilotSemanticReviewV01,
  type VNextOperatorPilotReviewDetailV01,
} from "@/lib/vnext/runtime/operator-pilot-review-material";
import { readVNextOperatorPilotCanonicalTargetStateV01 } from "@/lib/vnext/runtime/operator-pilot-policy";
import {
  OPERATOR_PILOT_REVISION_DELTA_TARGET_INCOMPATIBLE_V01,
  evaluateVNextOperatorPilotRevisionDeltaTargetCompatibilityV01,
} from "@/lib/vnext/runtime/operator-pilot-revision-compatibility";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import {
  EPISODE_DELTA_PROPOSAL_DELTA_TYPES_V01,
  OPERATION_AWARE_PROPOSAL_REVISION_PROFILE_VERSION_V01,
  type EpisodeDeltaProposalDeltaCandidateV01,
  type EpisodeDeltaProposalDeltaTypeV01,
  type EpisodeDeltaProposalOperationRevisionV01,
  type EpisodeDeltaProposalOperationV01,
  type EpisodeDeltaProposalV01,
} from "@/types/vnext/episode-delta-proposal";
import {
  EXTERNAL_REF_VERSION_V01,
  type ExternalRefV01,
} from "@/types/vnext/external-ref";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

export const VNEXT_OPERATOR_PILOT_PROPOSAL_REVISION_REQUEST_VERSION_V01 =
  "vnext_operator_pilot_proposal_revision_request.v0.1" as const;

const REVISION_NAMESPACE =
  "augnes.vnext.operation-aware-proposal-revision.v0.1";
const SESSION_ACTION_NAMESPACE = "augnes.vnext.local-operator-session.v0.1";
const MAX_TEXT = 2000;
const MAX_ITEMS = 128;

type RevisionOperationV01 = Exclude<
  EpisodeDeltaProposalOperationV01,
  "unknown" | "no_change"
>;

export class VNextOperatorPilotProposalRevisionErrorV01 extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status = 400) {
    super(code);
    this.name = "VNextOperatorPilotProposalRevisionErrorV01";
    this.code = code;
    this.status = status;
  }
}

export interface VNextOperatorPilotProposalRevisionRequestV01 {
  action: "revise";
  proposal_id: string;
  proposal_fingerprint: string;
  candidate_id: string;
  candidate_fingerprint: string;
  delta_type: EpisodeDeltaProposalDeltaTypeV01;
  operation: RevisionOperationV01;
  title: string;
  proposed_state_summary: string;
  rationale_summary: string;
  uncertainties: string[];
  limitations: string[];
}

export interface VNextOperatorPilotProposalRevisionResultV01 {
  status: "inserted" | "exact_replay";
  proposal: EpisodeDeltaProposalV01;
  source_proposal_unchanged: true;
  transition_applied: false;
  session_cookie: {
    value: string;
    expires_at: string;
    max_age_seconds: number;
  };
}

export function recordVNextOperatorPilotProposalRevisionV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    credential: VNextLocalOperatorSessionCredentialV01;
    request: unknown;
    clock?: VNextLocalRuntimeClockV01;
    secret_source?: VNextLocalOperatorSecretSourceV01;
  },
): VNextOperatorPilotProposalRevisionResultV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const request = parseRevisionRequest(input.request);
  const authentication = authenticateVNextLocalOperatorSessionV01(db, input);
  const source = resolveSourceMaterial(
    db,
    input.config,
    authentication.session.session_id,
    request,
  );
  const idempotencyKey = createRevisionAdmissionIdentity(
    input.config,
    authentication.session.session_id,
    request,
  );
  readRevisionReplay(
    db,
    input.config,
    source,
    request,
    authentication.session.session_id,
    idempotencyKey,
  );
  if (db.inTransaction) {
    throw revisionError("operator_pilot_revision_nested_transaction", 409);
  }
  db.exec("BEGIN IMMEDIATE");
  try {
    const admission = admitVNextLocalOperatorMutationInsideTransactionV01(
      db,
      input,
    );
    const exactSource = resolveSourceMaterial(
      db,
      input.config,
      admission.session.session_id,
      request,
    );
    const existing = readRevisionReplay(
      db,
      input.config,
      exactSource,
      request,
      admission.session.session_id,
      idempotencyKey,
    );
    if (existing) {
      db.exec("COMMIT");
      return {
        status: "exact_replay",
        proposal: existing,
        source_proposal_unchanged: true,
        transition_applied: false,
        session_cookie: admissionCookie(admission),
      };
    }
    const proposal = materializeRevision({
      config: input.config,
      source: exactSource,
      request,
      session_id: admission.session.session_id,
      created_at: admission.action_observed_at,
      idempotency_key: idempotencyKey,
    });
    const validation = validateEpisodeDeltaProposalV01(proposal);
    if (validation.status !== "valid") {
      throw revisionError(
        `operator_pilot_revision_material_invalid:${validation.errors
          .map((issue) => issue.code)
          .join(",")}`,
        422,
      );
    }
    const write = insertVNextCoreRecordV01(db, {
      record_kind: "episode_delta_proposal",
      record_id: proposal.proposal_id,
      workspace_id: proposal.workspace_id,
      project_id: proposal.project_id,
      fingerprint: proposal.integrity.fingerprint,
      idempotency_key: idempotencyKey,
      payload: proposal,
      created_at: proposal.created_at,
    });
    const sourceAfter = readVNextCoreRecordV01(db, {
      record_kind: "episode_delta_proposal",
      record_id: exactSource.proposal.proposal_id,
      workspace_id: input.config.workspace_id,
      project_id: input.config.project_id,
    });
    if (
      !sourceAfter ||
      canonicalizeProtocolValueV01(sourceAfter.payload) !==
        canonicalizeProtocolValueV01(exactSource.proposal)
    ) {
      throw revisionError("operator_pilot_revision_source_mutated", 409);
    }
    db.exec("COMMIT");
    return {
      status: write.status,
      proposal,
      source_proposal_unchanged: true,
      transition_applied: false,
      session_cookie: admissionCookie(admission),
    };
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  }
}

interface ResolvedRevisionSourceV01 {
  detail: VNextOperatorPilotReviewDetailV01;
  proposal: EpisodeDeltaProposalV01;
  candidate: EpisodeDeltaProposalDeltaCandidateV01;
  candidate_fingerprint: string;
  target_states: VNextOperatorPilotReviewDetailV01["candidate_admissions"][number]["target_states"];
}

function resolveSourceMaterial(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  sessionId: string,
  request: VNextOperatorPilotProposalRevisionRequestV01,
): ResolvedRevisionSourceV01 {
  const detail = readVNextOperatorPilotSemanticReviewV01(db, {
    config,
    proposal_id: request.proposal_id,
    authenticated_session_id: sessionId,
  });
  if (detail.proposal_fingerprint !== request.proposal_fingerprint) {
    throw revisionError("operator_pilot_revision_proposal_conflict", 409);
  }
  const candidateRead = detail.candidates.find(
    (entry) => entry.candidate.candidate_id === request.candidate_id,
  );
  if (!candidateRead) {
    throw revisionError("operator_pilot_revision_candidate_missing", 404);
  }
  if (candidateRead.candidate_fingerprint !== request.candidate_fingerprint) {
    throw revisionError("operator_pilot_revision_candidate_conflict", 409);
  }
  const compatibility =
    evaluateVNextOperatorPilotRevisionDeltaTargetCompatibilityV01({
      source_proposal: detail.proposal,
      source_candidate: candidateRead.candidate,
      revised_delta_type: request.delta_type,
      revised_target_refs: candidateRead.candidate.target_refs,
    });
  if (compatibility.status === "incompatible") {
    throw revisionError(
      OPERATOR_PILOT_REVISION_DELTA_TARGET_INCOMPATIBLE_V01,
      409,
    );
  }
  const targetStates = candidateRead.candidate.target_refs.map((targetRef) =>
    request.operation === "add"
      ? candidateRead.pilot_admission.target_states.find(
          (state) =>
            canonicalizeProtocolValueV01(state.target_ref) ===
            canonicalizeProtocolValueV01(targetRef),
        ) ??
        readVNextOperatorPilotCanonicalTargetStateV01(db, {
          config,
          source_target_ref: targetRef,
        })
      : readVNextOperatorPilotCanonicalTargetStateV01(db, {
          config,
          source_target_ref: targetRef,
        }),
  );
  if (
    candidateRead.candidate.target_refs.length === 0 ||
    candidateRead.candidate.target_refs.length > 64 ||
    targetStates.length !== candidateRead.candidate.target_refs.length ||
    targetStates.some((state) => state.presence === "drifted")
  ) {
    throw revisionError("operator_pilot_revision_target_state_unavailable", 409);
  }
  const requiresAbsent = request.operation === "add";
  if (!requiresAbsent) {
    assertSourcePacketContainsCurrentTargets(
      db,
      config,
      detail.proposal,
      targetStates,
    );
  }
  if (
    targetStates.some((state) =>
      requiresAbsent
        ? state.presence !== "absent"
        : state.presence !== "present",
    )
  ) {
    throw revisionError(
      requiresAbsent
        ? "operator_pilot_revision_add_requires_absent_state"
        : "operator_pilot_revision_operation_requires_present_state",
      409,
    );
  }
  return {
    detail,
    proposal: detail.proposal,
    candidate: candidateRead.candidate,
    candidate_fingerprint: candidateRead.candidate_fingerprint,
    target_states: targetStates,
  };
}

function assertSourcePacketContainsCurrentTargets(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  proposal: EpisodeDeltaProposalV01,
  targetStates: ResolvedRevisionSourceV01["target_states"],
): void {
  const ref = proposal.task_context_packet_ref;
  if (
    !ref ||
    ref.ref_type !== "task_context_packet" ||
    !ref.source_ref?.startsWith("sha256:")
  ) {
    throw revisionError("operator_pilot_revision_source_packet_invalid", 422);
  }
  const record = readVNextCoreRecordV01(db, {
    record_kind: "task_context_packet",
    record_id: ref.external_id,
    workspace_id: config.workspace_id,
    project_id: config.project_id,
  });
  if (!record) {
    throw revisionError("operator_pilot_revision_source_packet_missing", 422);
  }
  const packet = record.payload as TaskContextPacketV01;
  if (
    validateTaskContextPacketV01(packet, {
      evaluated_at: packet?.generated_at ?? "",
    }).status !== "valid"
  ) {
    throw revisionError("operator_pilot_revision_source_packet_invalid", 422);
  }
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
    workspace_id: packet.workspace_id,
    project_id: packet.project_id,
    fingerprint: packet.integrity.fingerprint,
  });
  if (
    packet.packet_id !== ref.external_id ||
    packet.integrity.fingerprint !== ref.source_ref ||
    record.created_at !== packet.generated_at
  ) {
    throw revisionError("operator_pilot_revision_source_packet_conflict", 409);
  }
  for (const target of targetStates) {
    const projection = readVNextSemanticStateEntryV01(db, {
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      target_key: deriveVNextSemanticTargetKeyV01(target.target_ref),
    });
    if (
      !projection ||
      projection.revision !== target.revision ||
      projection.state_fingerprint !== target.state_fingerprint ||
      canonicalizeProtocolValueV01(projection.target_ref) !==
        canonicalizeProtocolValueV01(target.target_ref) ||
      !packet.selected_context.some(
        (entry) =>
          entry.entry_kind === "accepted_state_ref" &&
          entry.source_ref === projection.state_fingerprint &&
          canonicalizeProtocolValueV01(entry.external_ref) ===
            canonicalizeProtocolValueV01(projection.state_ref),
      )
    ) {
      throw revisionError(
        "operator_pilot_revision_prior_packet_state_missing",
        409,
      );
    }
  }
}

function materializeRevision(input: {
  config: VNextLocalOperatorPilotConfigV01;
  source: ResolvedRevisionSourceV01;
  request: VNextOperatorPilotProposalRevisionRequestV01;
  session_id: string;
  created_at: string;
  idempotency_key: string;
}): EpisodeDeltaProposalV01 {
  const provenanceFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      action: "record_operation_aware_proposal_revision",
      profile: OPERATION_AWARE_PROPOSAL_REVISION_PROFILE_VERSION_V01,
      workspace_id: input.config.workspace_id,
      project_id: input.config.project_id,
      operator_id: input.config.operator_id,
      session_id: input.session_id,
      source_proposal_id: input.source.proposal.proposal_id,
      source_proposal_fingerprint:
        input.source.proposal.integrity.fingerprint,
      source_candidate_id: input.source.candidate.candidate_id,
      source_candidate_fingerprint: input.source.candidate_fingerprint,
      idempotency_key: input.idempotency_key,
      created_at: input.created_at,
    }),
  );
  const authorBasisRef: ExternalRefV01 = {
    ref_version: EXTERNAL_REF_VERSION_V01,
    ref_type: "local_operator_session_action",
    external_id: input.session_id,
    trust_class: "direct_local_observation",
    observed_at: input.created_at,
    source_ref: provenanceFingerprint,
    compatibility_namespace: SESSION_ACTION_NAMESPACE,
  };
  const authorRef: ExternalRefV01 = {
    ref_version: EXTERNAL_REF_VERSION_V01,
    ref_type: "local_operator_actor",
    external_id: input.config.operator_id,
    trust_class: "user_declaration",
    observed_at: input.created_at,
    source_ref: provenanceFingerprint,
    compatibility_namespace: REVISION_NAMESPACE,
  };
  const sourceProposalRef = protocolRef(
    "episode_delta_proposal",
    input.source.proposal.proposal_id,
    input.source.proposal.created_at,
    input.source.proposal.integrity.fingerprint,
  );
  const sourceCandidateRef = protocolRef(
    "episode_delta_candidate",
    input.source.candidate.candidate_id,
    input.source.proposal.created_at,
    input.source.candidate_fingerprint,
  );
  const stateLineageRefs = normalizeRefs(
    input.source.target_states.flatMap((state) =>
      state.source_transition_receipt_id &&
      state.source_transition_receipt_fingerprint
        ? [
            protocolRef(
              "state_transition_receipt",
              state.source_transition_receipt_id,
              input.created_at,
              state.source_transition_receipt_fingerprint,
            ),
          ]
        : [],
    ),
  );
  const candidateIdentity = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      profile: OPERATION_AWARE_PROPOSAL_REVISION_PROFILE_VERSION_V01,
      idempotency_key: input.idempotency_key,
      delta_type: input.request.delta_type,
      operation: input.request.operation,
      title: input.request.title,
      proposed_state_summary: input.request.proposed_state_summary,
      targets: input.source.target_states.map((state) => state.target_ref),
    }),
  );
  const revisedCandidate: EpisodeDeltaProposalDeltaCandidateV01 = {
    candidate_id: `operation-aware-candidate:${candidateIdentity.slice(7, 39)}`,
    delta_type: input.request.delta_type,
    operation: input.request.operation,
    title: input.request.title,
    current_state: {
      knowledge_status: "known",
      bounded_summary:
        input.request.operation === "add"
          ? "Canonical durable semantic state is absent for every exact target."
          : "Canonical durable semantic state is present at the exact observed target revisions.",
      source_material_ids: uniqueProtocolStringsV01(
        input.source.candidate.basis_material_ids,
      ),
      source_refs: normalizeRefs([
        sourceProposalRef,
        sourceCandidateRef,
        ...stateLineageRefs,
      ]),
    },
    proposed_state_summary: input.request.proposed_state_summary,
    target_refs: normalizeRefs(
      input.source.target_states.map((state) => state.target_ref),
    ),
    basis_material_ids: uniqueProtocolStringsV01(
      input.source.candidate.basis_material_ids,
    ),
    source_refs: normalizeRefs([
      ...input.source.candidate.source_refs,
      sourceProposalRef,
      sourceCandidateRef,
      authorBasisRef,
      ...stateLineageRefs,
    ]),
    uncertainties: uniqueProtocolStringsV01([
      ...input.source.candidate.uncertainties,
      ...input.request.uncertainties,
    ]),
    limitations: uniqueProtocolStringsV01([
      ...input.source.candidate.limitations,
      ...input.request.limitations,
      "This immutable revision remains candidate material until a separate ReviewDecision and authorized Transition.",
    ]),
    review_required: true,
  };
  const revisedCandidateFingerprint =
    createEpisodeDeltaCandidateFingerprintV01(revisedCandidate);
  const operationRevision: EpisodeDeltaProposalOperationRevisionV01 = {
    revision_profile: OPERATION_AWARE_PROPOSAL_REVISION_PROFILE_VERSION_V01,
    admission_idempotency_key: input.idempotency_key,
    source: {
      proposal_id: input.source.proposal.proposal_id,
      proposal_fingerprint: input.source.proposal.integrity.fingerprint,
      candidate_id: input.source.candidate.candidate_id,
      candidate_fingerprint: input.source.candidate_fingerprint,
    },
    revised_candidate: {
      candidate_id: revisedCandidate.candidate_id,
      candidate_fingerprint: revisedCandidateFingerprint,
    },
    authored_by_ref: authorRef,
    author_basis_refs: [authorBasisRef],
    rationale_summary: input.request.rationale_summary,
    selected_delta_type: input.request.delta_type,
    selected_operation: input.request.operation,
    target_expectations: input.source.target_states.map((state) => ({
      target_ref: normalizeExternalRefPrimitiveV01(state.target_ref),
      presence: state.presence === "present" ? "present" : "absent",
      revision: state.revision,
      state_fingerprint: state.state_fingerprint,
      source_transition_receipt_id: state.source_transition_receipt_id,
      source_transition_receipt_fingerprint:
        state.source_transition_receipt_fingerprint,
    })),
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
  return buildEpisodeDeltaProposalV01({
    workspace_id: input.source.proposal.workspace_id,
    project_id: input.source.proposal.project_id,
    created_at: input.created_at,
    status: "pending_review",
    bounded_summary: `Operation-aware revision: ${input.request.title}`,
    task_context_packet_ref: structuredClone(
      input.source.proposal.task_context_packet_ref,
    ),
    run_receipt_refs: structuredClone(input.source.proposal.run_receipt_refs),
    ...(input.source.proposal.source_assessment
      ? {
          source_assessment: structuredClone(
            input.source.proposal.source_assessment,
          ),
        }
      : {}),
    operation_revision: operationRevision,
    observations: structuredClone(input.source.proposal.observations),
    attestations: structuredClone(input.source.proposal.attestations),
    inferences: structuredClone(input.source.proposal.inferences),
    proposed_deltas: [
      ...structuredClone(input.source.proposal.proposed_deltas),
      revisedCandidate,
    ],
    conflicts: structuredClone(input.source.proposal.conflicts),
    missing_information: structuredClone(
      input.source.proposal.missing_information,
    ),
    uncertainties: structuredClone(input.source.proposal.uncertainties),
    limitations: uniqueProtocolStringsV01([
      ...input.source.proposal.limitations,
      "The source proposal and candidate remain immutable history.",
      "Operation-aware editing does not create a ReviewDecision, gate authorization, Transition, or later packet.",
    ]),
    source_status: structuredClone(input.source.proposal.source_status),
    source_refs: normalizeRefs([
      ...input.source.proposal.source_refs,
      sourceProposalRef,
      sourceCandidateRef,
      authorBasisRef,
    ]),
    compatibility: {
      source_contracts: uniqueProtocolStringsV01([
        ...input.source.proposal.compatibility.source_contracts,
        OPERATION_AWARE_PROPOSAL_REVISION_PROFILE_VERSION_V01,
        VNEXT_OPERATOR_PILOT_PROPOSAL_REVISION_REQUEST_VERSION_V01,
      ]),
      unmapped_fields: structuredClone(
        input.source.proposal.compatibility.unmapped_fields,
      ),
      warnings: uniqueProtocolStringsV01([
        ...input.source.proposal.compatibility.warnings,
        "The explicit operation is operator-authored candidate material and remains non-authoritative.",
      ]),
      external_refs: normalizeRefs([
        ...input.source.proposal.compatibility.external_refs,
        sourceProposalRef,
        sourceCandidateRef,
        authorBasisRef,
      ]),
    },
    authority_notes: [
      "The server copied immutable source material and allowlisted only operation-aware candidate fields.",
      "The revision grants no decision, gate, Transition, execution, or external-action authority.",
    ],
  });
}

function readRevisionReplay(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  source: ResolvedRevisionSourceV01,
  request: VNextOperatorPilotProposalRevisionRequestV01,
  sessionId: string,
  idempotencyKey: string,
): EpisodeDeltaProposalV01 | null {
  const record = readVNextCoreRecordByIdempotencyKeyV01(db, {
    record_kind: "episode_delta_proposal",
    workspace_id: config.workspace_id,
    project_id: config.project_id,
    idempotency_key: idempotencyKey,
  });
  if (!record) return null;
  if (validateEpisodeDeltaProposalV01(record.payload).status !== "valid") {
    throw revisionError("operator_pilot_revision_replay_conflict", 409);
  }
  const proposal = record.payload as EpisodeDeltaProposalV01;
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
    workspace_id: proposal.workspace_id,
    project_id: proposal.project_id,
    fingerprint: proposal.integrity.fingerprint,
  });
  if (
    record.record_id !== proposal.proposal_id ||
    record.fingerprint !== proposal.integrity.fingerprint ||
    record.created_at !== proposal.created_at ||
    record.idempotency_key !== idempotencyKey ||
    proposal.operation_revision?.authored_by_ref.external_id !==
      config.operator_id ||
    proposal.operation_revision.author_basis_refs.length !== 1 ||
    proposal.operation_revision.author_basis_refs[0]?.external_id !== sessionId
  ) {
    throw revisionError("operator_pilot_revision_replay_conflict", 409);
  }
  const expected = materializeRevision({
    config,
    source,
    request,
    session_id: sessionId,
    created_at: proposal.created_at,
    idempotency_key: idempotencyKey,
  });
  if (
    canonicalizeProtocolValueV01(expected) !==
    canonicalizeProtocolValueV01(proposal)
  ) {
    throw revisionError("operator_pilot_revision_replay_conflict", 409);
  }
  return proposal;
}

function createRevisionAdmissionIdentity(
  config: VNextLocalOperatorPilotConfigV01,
  sessionId: string,
  request: VNextOperatorPilotProposalRevisionRequestV01,
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      request_version:
        VNEXT_OPERATOR_PILOT_PROPOSAL_REVISION_REQUEST_VERSION_V01,
      revision_profile:
        OPERATION_AWARE_PROPOSAL_REVISION_PROFILE_VERSION_V01,
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      operator_id: config.operator_id,
      session_id: sessionId,
      source_proposal_id: request.proposal_id,
      source_proposal_fingerprint: request.proposal_fingerprint,
      source_candidate_id: request.candidate_id,
      source_candidate_fingerprint: request.candidate_fingerprint,
    }),
  );
}

function parseRevisionRequest(
  value: unknown,
): VNextOperatorPilotProposalRevisionRequestV01 {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw revisionError("operator_pilot_revision_body_invalid");
  }
  const record = value as Record<string, unknown>;
  const allowed = new Set([
    "action",
    "proposal_id",
    "proposal_fingerprint",
    "candidate_id",
    "candidate_fingerprint",
    "delta_type",
    "operation",
    "title",
    "proposed_state_summary",
    "rationale_summary",
    "uncertainties",
    "limitations",
  ]);
  if (
    Object.keys(record).length !== allowed.size ||
    Object.keys(record).some((key) => !allowed.has(key))
  ) {
    throw revisionError("operator_pilot_revision_body_unknown_field");
  }
  if (record.action !== "revise") {
    throw revisionError("operator_pilot_revision_action_invalid");
  }
  const deltaType = normalizeProtocolTextV01(record.delta_type);
  if (
    !EPISODE_DELTA_PROPOSAL_DELTA_TYPES_V01.includes(
      deltaType as EpisodeDeltaProposalDeltaTypeV01,
    )
  ) {
    throw revisionError("operator_pilot_revision_delta_type_invalid");
  }
  const operation = normalizeProtocolTextV01(record.operation);
  if (
    !(["add", "revise", "supersede", "retract", "remove"] as const).includes(
      operation as RevisionOperationV01,
    )
  ) {
    throw revisionError("operator_pilot_revision_operation_invalid");
  }
  return {
    action: "revise",
    proposal_id: requiredText(record.proposal_id, "proposal_id"),
    proposal_fingerprint: sha256(
      record.proposal_fingerprint,
      "proposal_fingerprint",
    ),
    candidate_id: requiredText(record.candidate_id, "candidate_id"),
    candidate_fingerprint: sha256(
      record.candidate_fingerprint,
      "candidate_fingerprint",
    ),
    delta_type: deltaType as EpisodeDeltaProposalDeltaTypeV01,
    operation: operation as RevisionOperationV01,
    title: boundedText(record.title, "title"),
    proposed_state_summary: boundedText(
      record.proposed_state_summary,
      "proposed_state_summary",
    ),
    rationale_summary: boundedText(
      record.rationale_summary,
      "rationale_summary",
    ),
    uncertainties: boundedStringArray(record.uncertainties, "uncertainties"),
    limitations: boundedStringArray(record.limitations, "limitations"),
  };
}

function requiredText(value: unknown, field: string): string {
  const normalized = normalizeProtocolTextV01(value);
  if (!normalized || normalized.length > 256) {
    throw revisionError(`operator_pilot_revision_${field}_invalid`);
  }
  return normalized;
}

function sha256(value: unknown, field: string): string {
  const normalized = normalizeProtocolTextV01(value);
  if (!/^sha256:[a-f0-9]{64}$/u.test(normalized)) {
    throw revisionError(`operator_pilot_revision_${field}_invalid`);
  }
  return normalized;
}

function boundedText(value: unknown, field: string): string {
  const normalized = normalizeProtocolTextV01(value);
  if (!normalized || normalized.length > MAX_TEXT) {
    throw revisionError(`operator_pilot_revision_${field}_invalid`);
  }
  return normalized;
}

function boundedStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length > MAX_ITEMS) {
    throw revisionError(`operator_pilot_revision_${field}_invalid`);
  }
  const normalized = uniqueProtocolStringsV01(value);
  if (
    normalized.length !== value.length ||
    normalized.some((item) => item.length > MAX_TEXT)
  ) {
    throw revisionError(`operator_pilot_revision_${field}_invalid`);
  }
  return normalized;
}

function protocolRef(
  refType: string,
  externalId: string,
  observedAt: string,
  fingerprint: string,
): ExternalRefV01 {
  return {
    ref_version: EXTERNAL_REF_VERSION_V01,
    ref_type: refType,
    external_id: externalId,
    trust_class: "derived_interpretation",
    observed_at: observedAt,
    source_ref: fingerprint,
    compatibility_namespace: REVISION_NAMESPACE,
  };
}

function normalizeRefs(values: ExternalRefV01[]): ExternalRefV01[] {
  return uniqueProtocolValuesV01(
    values.map(normalizeExternalRefPrimitiveV01),
  ).sort(compareExternalRefsV01);
}

function admissionCookie(
  admission: VNextLocalOperatorSessionMutationAdmissionV01,
): VNextOperatorPilotProposalRevisionResultV01["session_cookie"] {
  return {
    value: admission.cookie_value,
    expires_at: admission.cookie_expires_at,
    max_age_seconds: admission.cookie_max_age_seconds,
  };
}

function revisionError(code: string, status = 400): never {
  throw new VNextOperatorPilotProposalRevisionErrorV01(code, status);
}
