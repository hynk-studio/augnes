import type Database from "better-sqlite3";

import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  assertVNextDurableSemanticStoreSchemaV01,
  readVNextCoreRecordV01,
  type VNextCoreRecordEnvelopeV01,
  type VNextCoreRecordKindV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import {
  canonicalizeProtocolValueV01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import { validateStateTransitionReceiptV01 } from "@/lib/vnext/state-transition-receipt";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import {
  loadValidatedVNextSemanticTransitionRelationV01,
  type ValidatedVNextSemanticTransitionRelationV01,
} from "@/lib/vnext/runtime/durable-semantic-transition";
import {
  readVNextLocalRuntimeClockNowV01,
  type VNextLocalRuntimeClockV01,
} from "@/lib/vnext/runtime/local-runtime-clock";
import type { VNextLocalOperatorPilotConfigV01 } from "@/lib/vnext/runtime/local-operator-session";
import {
  inspectVNextOperatorPilotPacketLineageV01,
  type VNextOperatorPilotPacketLineageInspectionV01,
} from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import {
  validateVNextOperatorPilotReviewDecisionProvenanceV01,
  VNEXT_OPERATOR_PILOT_MAX_REVIEW_RECORDS_V01,
} from "@/lib/vnext/runtime/operator-pilot-review-material";
import { validateVNextOperatorPilotSemanticGateConfirmationProvenanceV01 } from "@/lib/vnext/runtime/operator-pilot-semantic-transition";
import { VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01 } from "@/lib/vnext/runtime/persisted-semantic-context-compiler";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type { StateTransitionReceiptV01 } from "@/types/vnext/state-transition-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

export const VNEXT_OPERATOR_PILOT_WORKBENCH_LINEAGE_VERSION_V01 =
  "vnext_operator_pilot_workbench_lineage.v0.1" as const;

export type VNextOperatorPilotProposalLineageStageStatusV01 =
  | "not_applied"
  | "applied_awaiting_packet"
  | "packet_compiled";

export class VNextOperatorPilotWorkbenchLineageErrorV01 extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status = 422) {
    super(code);
    this.name = "VNextOperatorPilotWorkbenchLineageErrorV01";
    this.code = code;
    this.status = status;
  }
}

export interface VNextOperatorPilotProposalDurableLineageV01 {
  lineage_version: typeof VNEXT_OPERATOR_PILOT_WORKBENCH_LINEAGE_VERSION_V01;
  workspace_id: string;
  project_id: string;
  proposal_id: string;
  proposal_fingerprint: string;
  overall_status: VNextOperatorPilotProposalLineageStageStatusV01;
  chains: VNextOperatorPilotProposalDurableLineageChainV01[];
  read_only: true;
  semantic_authority_granted: false;
}

export interface VNextOperatorPilotProposalDurableLineageChainV01 {
  transition: {
    receipt_id: string;
    receipt_fingerprint: string;
    decision_id: string;
    decision_fingerprint: string;
    candidate_id: string;
    candidate_fingerprint: string;
    applied_at: string;
    recorded_at: string;
  };
  semantic_gate: {
    gate_id: string;
    gate_fingerprint: string;
    status: "authorized";
    confirmed_at: string;
    evaluated_at: string;
    expires_at: string;
  };
  compiled_packet: null | {
    packet_id: string;
    packet_fingerprint: string;
    generated_at: string;
    expires_at: string | null;
    currentness: "fresh" | "expired";
    projection_current: boolean;
  };
  stage_status: Exclude<
    VNextOperatorPilotProposalLineageStageStatusV01,
    "not_applied"
  >;
}

interface ValidatedCompiledPacketV01 {
  inspection: VNextOperatorPilotPacketLineageInspectionV01;
}

export function readVNextOperatorPilotProposalDurableLineageV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    proposal: EpisodeDeltaProposalV01;
    clock?: VNextLocalRuntimeClockV01;
  },
): VNextOperatorPilotProposalDurableLineageV01 {
  try {
    return readProposalDurableLineage(db, input);
  } catch (error) {
    if (error instanceof VNextOperatorPilotWorkbenchLineageErrorV01) {
      throw error;
    }
    throw lineageError("operator_pilot_workbench_lineage_invalid");
  }
}

function readProposalDurableLineage(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    proposal: EpisodeDeltaProposalV01;
    clock?: VNextLocalRuntimeClockV01;
  },
): VNextOperatorPilotProposalDurableLineageV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  assertProposalScope(input.config, input.proposal);
  const observedAt = readVNextLocalRuntimeClockNowV01(
    input.clock,
    "operator_pilot_workbench_lineage_observed_at",
  );
  const transitions = loadValidatedTransitions(
    db,
    input.config,
    input.proposal,
  );
  const compiledPackets = loadValidatedCompiledPackets(db, input.config);
  const chains = transitions.map((transition) =>
    buildLineageChain({
      transition,
      compiled_packets: compiledPackets,
      observed_at: observedAt,
    }),
  );
  return {
    lineage_version: VNEXT_OPERATOR_PILOT_WORKBENCH_LINEAGE_VERSION_V01,
    workspace_id: input.config.workspace_id,
    project_id: input.config.project_id,
    proposal_id: input.proposal.proposal_id,
    proposal_fingerprint: input.proposal.integrity.fingerprint,
    overall_status: chains.at(-1)?.stage_status ?? "not_applied",
    chains,
    read_only: true,
    semantic_authority_granted: false,
  };
}

function loadValidatedTransitions(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  proposal: EpisodeDeltaProposalV01,
): ValidatedVNextSemanticTransitionRelationV01[] {
  const matches: ValidatedVNextSemanticTransitionRelationV01[] = [];
  for (const record of listScopedRecords(
    db,
    config,
    "state_transition_receipt",
  )) {
    if (validateStateTransitionReceiptV01(record.payload).status !== "valid") {
      throw lineageError(
        "operator_pilot_workbench_lineage_transition_invalid",
      );
    }
    const receipt = record.payload as StateTransitionReceiptV01;
    assertRecordEnvelope(record, {
      record_id: receipt.transition_receipt_id,
      fingerprint: receipt.integrity.fingerprint,
      idempotency_key: receipt.idempotency_key,
      created_at: receipt.recorded_at,
      workspace_id: receipt.workspace_id,
      project_id: receipt.project_id,
    });
    const transition = loadValidatedVNextSemanticTransitionRelationV01(db, {
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      transition_receipt_id: receipt.transition_receipt_id,
      transition_receipt_fingerprint: receipt.integrity.fingerprint,
    });
    if (
      canonicalizeProtocolValueV01(transition.receipt) !==
      canonicalizeProtocolValueV01(receipt)
    ) {
      throw lineageError(
        "operator_pilot_workbench_lineage_transition_payload_mismatch",
      );
    }
    const decisionProvenance =
      validateVNextOperatorPilotReviewDecisionProvenanceV01(db, {
        config,
        proposal: transition.proposal,
        decision: transition.decision,
        authenticated_session_id: null,
      });
    const gateProvenance =
      validateVNextOperatorPilotSemanticGateConfirmationProvenanceV01(db, {
        config,
        proposal: transition.proposal,
        decision: transition.decision,
        gate: transition.gate_record,
      });
    if (
      decisionProvenance.status !== "valid" ||
      gateProvenance.status !== "valid"
    ) {
      throw lineageError(
        "operator_pilot_workbench_lineage_pilot_provenance_invalid",
      );
    }
    if (receipt.source_proposal.proposal_id !== proposal.proposal_id) {
      continue;
    }
    if (
      receipt.source_proposal.proposal_fingerprint !==
        proposal.integrity.fingerprint ||
      transition.proposal.proposal_id !== proposal.proposal_id ||
      transition.proposal.integrity.fingerprint !==
        proposal.integrity.fingerprint
    ) {
      throw lineageError(
        "operator_pilot_workbench_lineage_proposal_relation_mismatch",
      );
    }
    matches.push(transition);
  }
  return matches;
}

function loadValidatedCompiledPackets(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
): ValidatedCompiledPacketV01[] {
  const compiled: ValidatedCompiledPacketV01[] = [];
  for (const record of listScopedRecords(
    db,
    config,
    "task_context_packet",
  )) {
    const packet = record.payload as TaskContextPacketV01;
    if (
      validateTaskContextPacketV01(packet, {
        evaluated_at:
          typeof packet?.generated_at === "string" ? packet.generated_at : "",
      }).status !== "valid"
    ) {
      throw lineageError("operator_pilot_workbench_lineage_packet_invalid");
    }
    assertRecordEnvelope(record, {
      record_id: packet.packet_id,
      fingerprint: packet.integrity.fingerprint,
      idempotency_key: null,
      created_at: packet.generated_at,
      workspace_id: packet.workspace_id,
      project_id: packet.project_id,
    });
    if (
      !packet.compatibility.source_contracts.includes(
        VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
      )
    ) {
      continue;
    }
    compiled.push({
      inspection: inspectVNextOperatorPilotPacketLineageV01(db, {
        config,
        packet_id: packet.packet_id,
        packet_fingerprint: packet.integrity.fingerprint,
      }),
    });
  }
  return compiled;
}

function buildLineageChain(input: {
  transition: ValidatedVNextSemanticTransitionRelationV01;
  compiled_packets: ValidatedCompiledPacketV01[];
  observed_at: string;
}): VNextOperatorPilotProposalDurableLineageChainV01 {
  const receipt = input.transition.receipt;
  const matchingPackets = input.compiled_packets.filter(
    ({ inspection }) =>
      inspection.source_transition_receipt.transition_receipt_id ===
        receipt.transition_receipt_id &&
      inspection.source_transition_receipt.transition_receipt_fingerprint ===
        receipt.integrity.fingerprint,
  );
  if (matchingPackets.length > 1) {
    throw lineageError(
      "operator_pilot_workbench_lineage_packet_relation_ambiguous",
      409,
    );
  }
  const compiled = matchingPackets[0] ?? null;
  const packetSummary = compiled
    ? summarizePacket(compiled.inspection, input.observed_at)
    : null;
  const gate = input.transition.gate_record;
  return {
    transition: {
      receipt_id: receipt.transition_receipt_id,
      receipt_fingerprint: receipt.integrity.fingerprint,
      decision_id: receipt.source_decision.decision_id,
      decision_fingerprint: receipt.source_decision.decision_fingerprint,
      candidate_id: receipt.source_candidate.candidate_id,
      candidate_fingerprint: receipt.source_candidate.candidate_fingerprint,
      applied_at: receipt.applied_at,
      recorded_at: receipt.recorded_at,
    },
    semantic_gate: {
      gate_id: gate.gate_record_id,
      gate_fingerprint: gate.integrity.fingerprint,
      status: "authorized",
      confirmed_at: gate.confirmed_at,
      evaluated_at: gate.semantic_commit_gate_evaluation.evaluated_at,
      expires_at: gate.semantic_commit_gate_evaluation.expires_at,
    },
    compiled_packet: packetSummary,
    stage_status: compiled ? "packet_compiled" : "applied_awaiting_packet",
  };
}

function summarizePacket(
  inspection: VNextOperatorPilotPacketLineageInspectionV01,
  observedAt: string,
): NonNullable<
  VNextOperatorPilotProposalDurableLineageChainV01["compiled_packet"]
> {
  const packet = inspection.packet;
  const observed = parseStrictIsoTimestampV01(observedAt);
  const expires = packet.expires_at
    ? parseStrictIsoTimestampV01(packet.expires_at)
    : null;
  if (observed === null) {
    throw lineageError(
      "operator_pilot_workbench_lineage_currentness_time_invalid",
      500,
    );
  }
  return {
    packet_id: packet.packet_id,
    packet_fingerprint: packet.integrity.fingerprint,
    generated_at: packet.generated_at,
    expires_at: packet.expires_at,
    currentness: expires !== null && observed > expires ? "expired" : "fresh",
    projection_current: inspection.projection_current,
  };
}

function listScopedRecords(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  recordKind: VNextCoreRecordKindV01,
): VNextCoreRecordEnvelopeV01[] {
  const rows = db
    .prepare(
      `SELECT record_id FROM vnext_core_records
       WHERE workspace_id = ? AND project_id = ? AND record_kind = ?
       ORDER BY created_at, record_id LIMIT ?`,
    )
    .all(
      config.workspace_id,
      config.project_id,
      recordKind,
      VNEXT_OPERATOR_PILOT_MAX_REVIEW_RECORDS_V01 + 1,
    ) as Array<{ record_id: string }>;
  if (rows.length > VNEXT_OPERATOR_PILOT_MAX_REVIEW_RECORDS_V01) {
    throw lineageError(
      `operator_pilot_workbench_lineage_${recordKind}_history_bound_exceeded`,
    );
  }
  return rows.map((row) => {
    const record = readVNextCoreRecordV01(db, {
      record_kind: recordKind,
      record_id: row.record_id,
      workspace_id: config.workspace_id,
      project_id: config.project_id,
    });
    if (!record) {
      throw lineageError("operator_pilot_workbench_lineage_record_missing");
    }
    return record;
  });
}

function assertRecordEnvelope(
  record: VNextCoreRecordEnvelopeV01,
  expected: {
    record_id: string;
    fingerprint: string;
    idempotency_key: string | null;
    created_at: string;
    workspace_id: string;
    project_id: string;
  },
): void {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
    workspace_id: expected.workspace_id,
    project_id: expected.project_id,
    fingerprint: expected.fingerprint,
  });
  if (
    record.record_id !== expected.record_id ||
    record.fingerprint !== expected.fingerprint ||
    record.idempotency_key !== expected.idempotency_key ||
    record.created_at !== expected.created_at
  ) {
    throw lineageError(
      "operator_pilot_workbench_lineage_record_envelope_mismatch",
    );
  }
}

function assertProposalScope(
  config: VNextLocalOperatorPilotConfigV01,
  proposal: EpisodeDeltaProposalV01,
): void {
  if (
    proposal.workspace_id !== config.workspace_id ||
    proposal.project_id !== config.project_id
  ) {
    throw lineageError(
      "operator_pilot_workbench_lineage_proposal_scope_mismatch",
      403,
    );
  }
}

function lineageError(code: string, status = 422) {
  return new VNextOperatorPilotWorkbenchLineageErrorV01(code, status);
}
