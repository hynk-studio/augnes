import type Database from "better-sqlite3";

import { VNEXT_LOCAL_CONTEXT_USE_PROBE_VERSION_V01 } from "@/lib/vnext/adapters/local-context-use-probe";
import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  assertVNextDurableSemanticStoreSchemaV01,
  deriveVNextSemanticTargetKeyV01,
  listVNextSemanticStateEntriesV01,
  listVNextSemanticTargetHeadsV01,
  readVNextCoreRecordV01,
  readVNextSemanticStateEntryV01,
  readVNextSemanticTargetHeadV01,
  rebuildVNextPersistedSemanticStateV01,
  type VNextCoreRecordEnvelopeV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import { canonicalizeProtocolValueV01, parseStrictIsoTimestampV01 } from "@/lib/vnext/protocol-primitives";
import { validateEpisodeDeltaProposalV01 } from "@/lib/vnext/episode-delta-proposal";
import {
  validateReviewDecisionAgainstEpisodeDeltaProposalV01,
  validateReviewDecisionV01,
} from "@/lib/vnext/review-decision";
import { validateRunReceiptV01 } from "@/lib/vnext/run-receipt";
import { validateStateTransitionReceiptV01 } from "@/lib/vnext/state-transition-receipt";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import {
  createStateTransitionReceiptLineageRefV01,
  validateSemanticTransitionFullChainV01,
} from "@/lib/vnext/state-transition-eligibility";
import {
  loadValidatedVNextSemanticTransitionRelationV01,
} from "@/lib/vnext/runtime/durable-semantic-transition";
import {
  VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
} from "@/lib/vnext/runtime/persisted-semantic-context-compiler";
import type { VNextLocalOperatorPilotConfigV01 } from "@/lib/vnext/runtime/local-operator-session";
import {
  readVNextLocalRuntimeClockNowV01,
  type VNextLocalRuntimeClockV01,
} from "@/lib/vnext/runtime/local-runtime-clock";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { StateTransitionReceiptV01 } from "@/types/vnext/state-transition-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

export const VNEXT_OPERATOR_PILOT_CONTINUITY_VERSION_V01 =
  "vnext_operator_pilot_project_continuity.v0.1" as const;
export const VNEXT_OPERATOR_PILOT_HANDOFF_VERSION_V01 =
  "vnext_operator_pilot_packet_handoff.v0.1" as const;

const MAX_HISTORY = 128;
const MAX_STATE_TARGETS = 512;
const MAX_HANDOFF_JSON_BYTES = 64 * 1024;
const MAX_HANDOFF_TEXT_CHARACTERS = 32 * 1024;

export class VNextOperatorPilotContinuityErrorV01 extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status = 400) {
    super(code);
    this.name = "VNextOperatorPilotContinuityErrorV01";
    this.code = code;
    this.status = status;
  }
}

export interface VNextOperatorPilotProjectContinuityV01 {
  continuity_version: typeof VNEXT_OPERATOR_PILOT_CONTINUITY_VERSION_V01;
  workspace_id: string;
  project_id: string;
  pending_proposal_count: number;
  pending_accepted_decision_count: number;
  latest_applied_transition: {
    transition_receipt_id: string;
    transition_receipt_fingerprint: string;
    proposal_id: string;
    decision_id: string;
    effect_count: number;
    applied_at: string;
    recorded_at: string;
  } | null;
  current_accepted_state_count: number;
  latest_target_head_revision: {
    revision: number;
    presence: "absent" | "present";
    target_key: string;
    transition_receipt_id: string;
    transition_receipt_fingerprint: string;
    updated_at: string;
  } | null;
  latest_compiled_packet: {
    packet_id: string;
    packet_fingerprint: string;
    generated_at: string;
    expires_at: string | null;
    accepted_state_count: number;
  } | null;
  packet_currentness: "fresh" | "stale" | "expired" | "not_available";
  latest_context_use_receipt: {
    receipt_id: string;
    receipt_fingerprint: string;
    recorded_at: string;
    task_context_packet_id: string;
    task_context_packet_fingerprint: string;
  } | null;
  latest_context_use_review_status: null;
  projection_is_read_only: true;
  semantic_authority_granted: false;
}

export interface VNextOperatorPilotPacketHandoffV01 {
  handoff_version: typeof VNEXT_OPERATOR_PILOT_HANDOFF_VERSION_V01;
  workspace_id: string;
  project_id: string;
  packet: {
    packet_id: string;
    packet_fingerprint: string;
    generated_at: string;
    expires_at: string | null;
    currentness: "fresh" | "expired";
    data_classification: TaskContextPacketV01["constraints"]["data_classification"];
  };
  accepted_state_refs: Array<{
    entry_id: string;
    state_ref: NonNullable<TaskContextPacketV01["selected_context"][number]["external_ref"]>;
    state_fingerprint: string;
    currentness_status: string;
    currentness_as_of: string | null;
  }>;
  constraints: TaskContextPacketV01["constraints"];
  return_contract: TaskContextPacketV01["return_contract"];
  structured_result_instruction: {
    required: true;
    packet_id: string;
    packet_fingerprint: string;
    instruction: string;
  };
  authority_summary: {
    handoff_is_execution: false;
    handoff_proves_consumption: false;
    grants_transition_authority: false;
    grants_provider_authority: false;
    grants_external_actuation_authority: false;
    credential_material_included: false;
    hidden_prompt_included: false;
  };
}

export interface VNextOperatorPilotPacketHandoffResultV01 {
  handoff: VNextOperatorPilotPacketHandoffV01;
  bounded_json: string;
  bounded_text: string;
}

export function projectVNextOperatorPilotContinuityV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    clock?: VNextLocalRuntimeClockV01;
  },
): VNextOperatorPilotProjectContinuityV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const now = readVNextLocalRuntimeClockNowV01(
    input.clock,
    "operator_pilot_continuity_observed_at",
  );
  const proposals = loadProposals(db, input.config);
  const proposalById = new Map(proposals.map((value) => [value.proposal_id, value]));
  const decisions = loadDecisions(db, input.config, proposalById);
  const receipts = loadTransitionReceipts(db, input.config);
  const receiptDecisionKeys = new Set(
    receipts.map((receipt) =>
      `${receipt.source_decision.decision_id}\0${receipt.source_decision.decision_fingerprint}`,
    ),
  );
  const decisionsByProposal = new Map<string, number>();
  for (const decision of decisions) {
    decisionsByProposal.set(
      decision.source_proposal.proposal_id,
      (decisionsByProposal.get(decision.source_proposal.proposal_id) ?? 0) + 1,
    );
  }
  const stateEntries = validateCurrentSemanticState(db, input.config);
  const targetHeads = listVNextSemanticTargetHeadsV01(db, {
    workspace_id: input.config.workspace_id,
    project_id: input.config.project_id,
    limit: MAX_STATE_TARGETS + 1,
  });
  if (targetHeads.length > MAX_STATE_TARGETS) {
    throw continuityError("operator_pilot_target_head_bound_exceeded", 422);
  }
  validateTargetHeads(db, input.config, targetHeads);
  const packets = loadCompiledPackets(db, input.config);
  const latestPacketBinding = packets.at(-1) ?? null;
  const latestPacket = latestPacketBinding?.packet ?? null;
  const contextUseReceipts = loadContextUseReceipts(db, input.config);
  const latestContextUse = contextUseReceipts.at(-1) ?? null;
  const latestReceipt = receipts.at(-1) ?? null;
  const latestHead = targetHeads[0] ?? null;
  return {
    continuity_version: VNEXT_OPERATOR_PILOT_CONTINUITY_VERSION_V01,
    workspace_id: input.config.workspace_id,
    project_id: input.config.project_id,
    pending_proposal_count: proposals.filter(
      (proposal) => !decisionsByProposal.has(proposal.proposal_id),
    ).length,
    pending_accepted_decision_count: decisions.filter(
      (decision) =>
        decision.decision === "accept" &&
        !receiptDecisionKeys.has(
          `${decision.decision_id}\0${decision.integrity.fingerprint}`,
        ),
    ).length,
    latest_applied_transition: latestReceipt
      ? {
          transition_receipt_id: latestReceipt.transition_receipt_id,
          transition_receipt_fingerprint: latestReceipt.integrity.fingerprint,
          proposal_id: latestReceipt.source_proposal.proposal_id,
          decision_id: latestReceipt.source_decision.decision_id,
          effect_count: latestReceipt.effects.length,
          applied_at: latestReceipt.applied_at,
          recorded_at: latestReceipt.recorded_at,
        }
      : null,
    current_accepted_state_count: stateEntries.length,
    latest_target_head_revision: latestHead
      ? {
          revision: latestHead.revision,
          presence: latestHead.presence,
          target_key: latestHead.target_key,
          transition_receipt_id: latestHead.source_transition_receipt_id,
          transition_receipt_fingerprint:
            latestHead.source_transition_receipt_fingerprint,
          updated_at: latestHead.updated_at,
        }
      : null,
    latest_compiled_packet: latestPacket
      ? {
          packet_id: latestPacket.packet_id,
          packet_fingerprint: latestPacket.integrity.fingerprint,
          generated_at: latestPacket.generated_at,
          expires_at: latestPacket.expires_at,
          accepted_state_count: latestPacket.selected_context.filter(
            (entry) => entry.entry_kind === "accepted_state_ref",
          ).length,
        }
      : null,
    packet_currentness: latestPacket
      ? latestPacketBinding!.projection_current
        ? packetCurrentness(latestPacket, now)
        : "stale"
      : "not_available",
    latest_context_use_receipt: latestContextUse
      ? {
          receipt_id: latestContextUse.receipt_id,
          receipt_fingerprint: latestContextUse.integrity.fingerprint,
          recorded_at: latestContextUse.recorded_at,
          task_context_packet_id:
            latestContextUse.task_context_packet_ref!.external_id,
          task_context_packet_fingerprint:
            latestContextUse.task_context_packet_ref!.source_ref!,
        }
      : null,
    latest_context_use_review_status: null,
    projection_is_read_only: true,
    semantic_authority_granted: false,
  };
}

export function buildVNextOperatorPilotPacketHandoffV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    packet_id: string;
    packet_fingerprint: string;
    clock?: VNextLocalRuntimeClockV01;
  },
): VNextOperatorPilotPacketHandoffResultV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const packet = loadPacket(db, input.config, input.packet_id, input.packet_fingerprint);
  validateCurrentSemanticState(db, input.config);
  const compiled = validateCompiledPacketLineage(db, input.config, packet);
  if (!compiled.projection_current) {
    throw continuityError("operator_pilot_handoff_packet_stale", 409);
  }
  const now = readVNextLocalRuntimeClockNowV01(
    input.clock,
    "operator_pilot_packet_handoff_observed_at",
  );
  const acceptedStateRefs = packet.selected_context
    .filter((entry) => entry.entry_kind === "accepted_state_ref")
    .map((entry) => {
      if (!entry.external_ref || !entry.source_ref) {
        throw continuityError("operator_pilot_handoff_state_ref_invalid", 422);
      }
      return {
        entry_id: entry.entry_id,
        state_ref: entry.external_ref,
        state_fingerprint: entry.source_ref,
        currentness_status: entry.currentness.status,
        currentness_as_of: entry.currentness.as_of,
      };
    });
  const handoff: VNextOperatorPilotPacketHandoffV01 = {
    handoff_version: VNEXT_OPERATOR_PILOT_HANDOFF_VERSION_V01,
    workspace_id: packet.workspace_id,
    project_id: packet.project_id,
    packet: {
      packet_id: packet.packet_id,
      packet_fingerprint: packet.integrity.fingerprint,
      generated_at: packet.generated_at,
      expires_at: packet.expires_at,
      currentness: packetCurrentness(packet, now),
      data_classification: packet.constraints.data_classification,
    },
    accepted_state_refs: acceptedStateRefs,
    constraints: packet.constraints,
    return_contract: packet.return_contract,
    structured_result_instruction: {
      required: true,
      packet_id: packet.packet_id,
      packet_fingerprint: packet.integrity.fingerprint,
      instruction:
        "Return a bounded structured Codex result report that references this exact TaskContextPacket ID and fingerprint. Do not return a raw prompt, transcript, hidden reasoning, or credential material.",
    },
    authority_summary: {
      handoff_is_execution: false,
      handoff_proves_consumption: false,
      grants_transition_authority: false,
      grants_provider_authority: false,
      grants_external_actuation_authority: false,
      credential_material_included: false,
      hidden_prompt_included: false,
    },
  };
  const boundedJson = JSON.stringify(handoff, null, 2);
  if (Buffer.byteLength(boundedJson, "utf8") > MAX_HANDOFF_JSON_BYTES) {
    throw continuityError("operator_pilot_handoff_json_bound_exceeded", 422);
  }
  const boundedText = buildBoundedHandoffText(handoff);
  if (boundedText.length > MAX_HANDOFF_TEXT_CHARACTERS) {
    throw continuityError("operator_pilot_handoff_text_bound_exceeded", 422);
  }
  return { handoff, bounded_json: boundedJson, bounded_text: boundedText };
}

function loadRecords(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  kind: string,
): VNextCoreRecordEnvelopeV01[] {
  const rows = db.prepare(
    `SELECT record_id FROM vnext_core_records
     WHERE workspace_id = ? AND project_id = ? AND record_kind = ?
     ORDER BY created_at, record_id LIMIT ?`,
  ).all(config.workspace_id, config.project_id, kind, MAX_HISTORY + 1) as Array<{
    record_id: string;
  }>;
  if (rows.length > MAX_HISTORY) {
    throw continuityError(`operator_pilot_${kind}_history_bound_exceeded`, 422);
  }
  return rows.map((row) => {
    const record = readVNextCoreRecordV01(db, {
      record_kind: kind as VNextCoreRecordEnvelopeV01["record_kind"],
      record_id: row.record_id,
      workspace_id: config.workspace_id,
      project_id: config.project_id,
    });
    if (!record) throw continuityError("operator_pilot_record_missing", 422);
    return record;
  });
}

function loadProposals(db: Database.Database, config: VNextLocalOperatorPilotConfigV01) {
  return loadRecords(db, config, "episode_delta_proposal").map((record) => {
    if (validateEpisodeDeltaProposalV01(record.payload).status !== "valid") {
      throw continuityError("operator_pilot_continuity_proposal_invalid", 422);
    }
    const proposal = record.payload as EpisodeDeltaProposalV01;
    assertEnvelope(record, proposal.workspace_id, proposal.project_id, proposal.integrity.fingerprint, proposal.proposal_id, proposal.created_at, null);
    return proposal;
  });
}

function loadDecisions(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  proposalById: Map<string, EpisodeDeltaProposalV01>,
) {
  return loadRecords(db, config, "review_decision").map((record) => {
    if (validateReviewDecisionV01(record.payload).status !== "valid") {
      throw continuityError("operator_pilot_continuity_decision_invalid", 422);
    }
    const decision = record.payload as ReviewDecisionV01;
    const proposal = proposalById.get(decision.source_proposal.proposal_id);
    if (
      !proposal ||
      validateReviewDecisionAgainstEpisodeDeltaProposalV01(decision, proposal).status !== "valid"
    ) {
      throw continuityError("operator_pilot_continuity_decision_relation_invalid", 422);
    }
    assertEnvelope(record, decision.workspace_id, decision.project_id, decision.integrity.fingerprint, decision.decision_id, decision.decided_at, null);
    return decision;
  });
}

function loadTransitionReceipts(db: Database.Database, config: VNextLocalOperatorPilotConfigV01) {
  return loadRecords(db, config, "state_transition_receipt").map((record) => {
    if (validateStateTransitionReceiptV01(record.payload).status !== "valid") {
      throw continuityError("operator_pilot_continuity_receipt_invalid", 422);
    }
    const receipt = record.payload as StateTransitionReceiptV01;
    loadValidatedVNextSemanticTransitionRelationV01(db, {
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      transition_receipt_id: receipt.transition_receipt_id,
      transition_receipt_fingerprint: receipt.integrity.fingerprint,
    });
    assertEnvelope(record, receipt.workspace_id, receipt.project_id, receipt.integrity.fingerprint, receipt.transition_receipt_id, receipt.recorded_at, receipt.idempotency_key);
    return receipt;
  });
}

function validateCurrentSemanticState(db: Database.Database, config: VNextLocalOperatorPilotConfigV01) {
  const entries = listVNextSemanticStateEntriesV01(db, config);
  if (entries.length > MAX_STATE_TARGETS) {
    throw continuityError("operator_pilot_semantic_state_bound_exceeded", 422);
  }
  for (const entry of entries) {
    const head = readVNextSemanticTargetHeadV01(db, {
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      target_key: entry.target_key,
    });
    if (
      !head ||
      head.presence !== "present" ||
      head.revision !== entry.revision ||
      head.current_state_fingerprint !== entry.state_fingerprint ||
      head.source_transition_receipt_id !== entry.source_transition_receipt_id ||
      head.source_transition_receipt_fingerprint !== entry.source_transition_receipt_fingerprint ||
      head.updated_at !== entry.updated_at ||
      deriveVNextSemanticTargetKeyV01(entry.target_ref) !== entry.target_key
    ) {
      throw continuityError("operator_pilot_semantic_projection_head_drift", 422);
    }
    const state = readVNextCoreRecordV01(db, {
      record_kind: "semantic_state",
      record_id: entry.state_ref.external_id,
      workspace_id: config.workspace_id,
      project_id: config.project_id,
    });
    if (!state) throw continuityError("operator_pilot_semantic_state_missing", 422);
    const rebuilt = rebuildVNextPersistedSemanticStateV01(state.payload);
    assertEnvelope(state, rebuilt.workspace_id, rebuilt.project_id, rebuilt.integrity.fingerprint, rebuilt.semantic_state_record_id, rebuilt.created_at, null);
    if (
      rebuilt.target_key !== entry.target_key ||
      rebuilt.state_content_fingerprint !== entry.state_fingerprint ||
      rebuilt.bounded_state_summary !== entry.bounded_state_summary ||
      rebuilt.source_proposal_id !== entry.source_proposal_id ||
      rebuilt.source_proposal_fingerprint !== entry.source_proposal_fingerprint ||
      rebuilt.source_candidate_id !== entry.source_candidate_id ||
      rebuilt.source_candidate_fingerprint !== entry.source_candidate_fingerprint ||
      canonicalizeProtocolValueV01(rebuilt.target_ref) !==
        canonicalizeProtocolValueV01(entry.target_ref) ||
      canonicalizeProtocolValueV01(rebuilt.state_ref) !== canonicalizeProtocolValueV01(entry.state_ref)
    ) {
      throw continuityError("operator_pilot_semantic_state_projection_drift", 422);
    }
    const transition = loadValidatedVNextSemanticTransitionRelationV01(db, {
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      transition_receipt_id: entry.source_transition_receipt_id,
      transition_receipt_fingerprint: entry.source_transition_receipt_fingerprint,
    });
    const effect = transition.receipt.effects.find(
      (item) => deriveVNextSemanticTargetKeyV01(item.target_ref) === entry.target_key,
    );
    if (
      !effect ||
      effect.after_state.presence !== "present" ||
      effect.after_state.state_fingerprint !== entry.state_fingerprint ||
      canonicalizeProtocolValueV01(effect.after_state.state_ref) !==
        canonicalizeProtocolValueV01(entry.state_ref) ||
      transition.receipt.recorded_at !== entry.updated_at ||
      transition.receipt.source_proposal.proposal_id !== entry.source_proposal_id ||
      transition.receipt.source_proposal.proposal_fingerprint !==
        entry.source_proposal_fingerprint ||
      transition.receipt.source_candidate.candidate_id !== entry.source_candidate_id ||
      transition.receipt.source_candidate.candidate_fingerprint !==
        entry.source_candidate_fingerprint
    ) {
      throw continuityError("operator_pilot_semantic_state_receipt_drift", 422);
    }
  }
  return entries;
}

function validateTargetHeads(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  heads: ReturnType<typeof listVNextSemanticTargetHeadsV01>,
): void {
  for (const head of heads) {
    const transition = loadValidatedVNextSemanticTransitionRelationV01(db, {
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      transition_receipt_id: head.source_transition_receipt_id,
      transition_receipt_fingerprint:
        head.source_transition_receipt_fingerprint,
    });
    const effect = transition.receipt.effects.find(
      (item) => deriveVNextSemanticTargetKeyV01(item.target_ref) === head.target_key,
    );
    const intended = transition.gate_record.intended_effects.find(
      (item) => item.target_key === head.target_key,
    );
    if (
      !effect ||
      !intended ||
      intended.expected_revision !== head.revision ||
      transition.receipt.recorded_at !== head.updated_at ||
      effect.after_state.presence !== head.presence ||
      effect.after_state.state_fingerprint !== head.current_state_fingerprint
    ) {
      throw continuityError("operator_pilot_target_head_receipt_drift", 422);
    }
  }
}

function loadCompiledPackets(db: Database.Database, config: VNextLocalOperatorPilotConfigV01) {
  return loadRecords(db, config, "task_context_packet")
    .map((record) => loadPacket(db, config, record.record_id, record.fingerprint))
    .filter((packet) => packet.compatibility.source_contracts.includes(VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01))
    .map((packet) => validateCompiledPacketLineage(db, config, packet));
}

function validateCompiledPacketLineage(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  packet: TaskContextPacketV01,
): { packet: TaskContextPacketV01; projection_current: boolean } {
  if (
    !packet.compatibility.source_contracts.includes(
      VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
    )
  ) {
    throw continuityError("operator_pilot_handoff_packet_not_compiled", 409);
  }
  const priorRefs = packet.compatibility.source_refs.filter(
    (ref) =>
      ref.ref_type === "task_context_packet" &&
      ref.compatibility_namespace ===
        VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
  );
  const receiptRefs = packet.compatibility.source_refs.filter(
    (ref) =>
      ref.ref_type === "state_transition_receipt" &&
      ref.compatibility_namespace ===
        "augnes.vnext.state-transition-receipt.v0.1",
  );
  if (priorRefs.length !== 1 || receiptRefs.length !== 1) {
    throw continuityError("operator_pilot_compiled_packet_lineage_ambiguous", 422);
  }
  const priorRef = priorRefs[0]!;
  const receiptRef = receiptRefs[0]!;
  if (!priorRef.source_ref || !receiptRef.source_ref) {
    throw continuityError("operator_pilot_compiled_packet_lineage_invalid", 422);
  }
  const priorPacket = loadPacket(
    db,
    config,
    priorRef.external_id,
    priorRef.source_ref,
  );
  const transition = loadValidatedVNextSemanticTransitionRelationV01(db, {
    workspace_id: config.workspace_id,
    project_id: config.project_id,
    transition_receipt_id: receiptRef.external_id,
    transition_receipt_fingerprint: receiptRef.source_ref,
  });
  const expectedPriorRef = {
    ref_version: "external_ref.v0.1" as const,
    ref_type: "task_context_packet",
    external_id: priorPacket.packet_id,
    trust_class: "derived_interpretation" as const,
    observed_at: priorPacket.generated_at,
    source_ref: priorPacket.integrity.fingerprint,
    compatibility_namespace:
      VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
  };
  if (
    canonicalizeProtocolValueV01(priorRef) !==
      canonicalizeProtocolValueV01(expectedPriorRef) ||
    canonicalizeProtocolValueV01(receiptRef) !==
      canonicalizeProtocolValueV01(
        createStateTransitionReceiptLineageRefV01(transition.receipt),
      )
  ) {
    throw continuityError("operator_pilot_compiled_packet_provenance_mismatch", 422);
  }
  const relation = validateSemanticTransitionFullChainV01({
    ...transition.eligibility_input,
    receipt: transition.receipt,
    prior_packet: priorPacket,
    later_packet: packet,
  });
  if (relation.status !== "valid") {
    throw continuityError("operator_pilot_compiled_packet_relation_invalid", 422);
  }
  const affectedCurrent = transition.receipt.effects.every((effect) => {
    const targetKey = deriveVNextSemanticTargetKeyV01(effect.target_ref);
    const head = readVNextSemanticTargetHeadV01(db, {
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      target_key: targetKey,
    });
    const intended = transition.gate_record.intended_effects.find(
      (item) => item.target_key === targetKey,
    );
    if (
      !head ||
      !intended ||
      head.revision !== intended.expected_revision ||
      head.source_transition_receipt_id !==
        transition.receipt.transition_receipt_id ||
      head.source_transition_receipt_fingerprint !==
        transition.receipt.integrity.fingerprint ||
      head.presence !== effect.after_state.presence ||
      head.current_state_fingerprint !== effect.after_state.state_fingerprint
    ) {
      return false;
    }
    const projection = readVNextSemanticStateEntryV01(db, {
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      target_key: targetKey,
    });
    return effect.after_state.presence === "absent"
      ? projection === null
      : !!projection &&
          projection.source_transition_receipt_id ===
            transition.receipt.transition_receipt_id &&
          projection.state_fingerprint === effect.after_state.state_fingerprint &&
          canonicalizeProtocolValueV01(projection.state_ref) ===
            canonicalizeProtocolValueV01(effect.after_state.state_ref);
  });
  const currentEntries = listVNextSemanticStateEntriesV01(db, {
    workspace_id: config.workspace_id,
    project_id: config.project_id,
  });
  const packetSelections = packet.selected_context.filter(
    (entry) => entry.entry_kind === "accepted_state_ref",
  );
  const fullSelectionCurrent =
    packetSelections.length === currentEntries.length &&
    currentEntries.every((projection) =>
      packetSelections.some(
        (entry) =>
          entry.source_ref === projection.state_fingerprint &&
          canonicalizeProtocolValueV01(entry.external_ref) ===
            canonicalizeProtocolValueV01(projection.state_ref),
      ),
    );
  return {
    packet,
    projection_current: affectedCurrent && fullSelectionCurrent,
  };
}

function loadPacket(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  packetId: string,
  packetFingerprint: string,
): TaskContextPacketV01 {
  const record = readVNextCoreRecordV01(db, {
    record_kind: "task_context_packet",
    record_id: packetId,
    workspace_id: config.workspace_id,
    project_id: config.project_id,
  });
  if (!record) throw continuityError("operator_pilot_packet_missing", 404);
  if (record.fingerprint !== packetFingerprint) throw continuityError("operator_pilot_packet_fingerprint_mismatch", 409);
  const packet = record.payload as TaskContextPacketV01;
  if (validateTaskContextPacketV01(packet, { evaluated_at: packet?.generated_at ?? "" }).status !== "valid") {
    throw continuityError("operator_pilot_packet_invalid", 422);
  }
  assertEnvelope(record, packet.workspace_id, packet.project_id, packet.integrity.fingerprint, packet.packet_id, packet.generated_at, null);
  return packet;
}

function loadContextUseReceipts(db: Database.Database, config: VNextLocalOperatorPilotConfigV01) {
  return loadRecords(db, config, "run_receipt")
    .map((record) => {
      if (validateRunReceiptV01(record.payload).status !== "valid") {
        throw continuityError("operator_pilot_run_receipt_invalid", 422);
      }
      const receipt = record.payload as RunReceiptV01;
      assertEnvelope(record, receipt.workspace_id, receipt.project_id, receipt.integrity.fingerprint, receipt.receipt_id, receipt.recorded_at, receipt.idempotency_key);
      return receipt;
    })
    .filter(
      (receipt) =>
        receipt.compatibility.source_contracts.includes(VNEXT_LOCAL_CONTEXT_USE_PROBE_VERSION_V01) &&
        receipt.task_context_packet_ref?.ref_type === "task_context_packet" &&
        /^sha256:[a-f0-9]{64}$/.test(receipt.task_context_packet_ref.source_ref!),
    );
}

function assertEnvelope(
  record: VNextCoreRecordEnvelopeV01,
  workspaceId: string,
  projectId: string,
  fingerprint: string,
  recordId: string,
  createdAt: string,
  idempotencyKey: string | null,
): void {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
    workspace_id: workspaceId,
    project_id: projectId,
    fingerprint,
  });
  if (
    record.record_id !== recordId ||
    record.created_at !== createdAt ||
    record.idempotency_key !== idempotencyKey
  ) {
    throw continuityError("operator_pilot_record_envelope_mismatch", 422);
  }
}

function packetCurrentness(packet: TaskContextPacketV01, now: string): "fresh" | "expired" {
  const observed = parseStrictIsoTimestampV01(now);
  const expires = packet.expires_at ? parseStrictIsoTimestampV01(packet.expires_at) : null;
  if (observed === null) throw continuityError("operator_pilot_currentness_time_invalid", 500);
  return expires !== null && observed > expires ? "expired" : "fresh";
}

function buildBoundedHandoffText(handoff: VNextOperatorPilotPacketHandoffV01): string {
  const lines = [
    "Augnes vNext bounded TaskContextPacket handoff",
    `Workspace: ${handoff.workspace_id}`,
    `Project: ${handoff.project_id}`,
    `Packet: ${handoff.packet.packet_id}`,
    `Fingerprint: ${handoff.packet.packet_fingerprint}`,
    `Currentness: ${handoff.packet.currentness}`,
    `Data classification: ${handoff.packet.data_classification}`,
    "",
    "Accepted semantic state references:",
    ...handoff.accepted_state_refs.map(
      (entry) =>
        `- ${entry.state_ref.ref_type}:${entry.state_ref.external_id} @ ${entry.state_fingerprint}`,
    ),
    "",
    "Required checks:",
    ...handoff.constraints.required_checks.map((value) => `- ${value}`),
    "Forbidden actions:",
    ...handoff.constraints.forbidden_actions.map((value) => `- ${value}`),
    "",
    `Return kind: ${handoff.return_contract.return_kind}`,
    `Required result fields: ${handoff.return_contract.required_fields.join(", ")}`,
    `Expected artifacts: ${handoff.return_contract.expected_artifacts.join(", ")}`,
    `Required result checks: ${handoff.return_contract.required_checks.join(", ")}`,
    "",
    handoff.structured_result_instruction.instruction,
    `Required packet reference: ${handoff.structured_result_instruction.packet_id} / ${handoff.structured_result_instruction.packet_fingerprint}`,
    "This handoff does not execute work, prove consumption, or grant transition or external-actuation authority.",
  ];
  return `${lines.join("\n")}\n`;
}

function continuityError(code: string, status = 400) {
  return new VNextOperatorPilotContinuityErrorV01(code, status);
}
