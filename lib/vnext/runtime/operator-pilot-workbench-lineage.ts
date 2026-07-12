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
import { validateContextUseReviewV01 } from "@/lib/vnext/context-use-review";
import { validateRunReceiptV01 } from "@/lib/vnext/run-receipt";
import { validateStateTransitionReceiptV01 } from "@/lib/vnext/state-transition-receipt";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import { buildTaskContextPacketHandoffHrefV01 } from "@/lib/vnext/task-context-packet-handoff";
import {
  loadValidatedVNextSemanticTransitionRelationV01,
  type ValidatedVNextSemanticTransitionRelationV01,
} from "@/lib/vnext/runtime/durable-semantic-transition";
import {
  VNextOperatorPilotContextUseReviewErrorV01,
  readVNextOperatorPilotContextUseReviewForLaterResultV01,
  readVNextOperatorPilotContextUseReviewV01,
  type VNextOperatorPilotContextUseReviewReadModelV01,
} from "@/lib/vnext/runtime/operator-pilot-context-use-review";
import {
  VNextOperatorPilotLaterResultErrorV01,
  VNEXT_OPERATOR_PILOT_LATER_RESULT_INTAKE_VERSION_V01,
  readLatestVNextOperatorPilotLaterResultForPacketV01,
  readVNextOperatorPilotLaterResultV01,
  type VNextOperatorPilotLaterResultReadModelV01,
  type VNextOperatorPilotReportedPayloadUseV01,
} from "@/lib/vnext/runtime/operator-pilot-later-result-intake";
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
import type { ContextUseReviewV01 } from "@/types/vnext/context-use-review";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { StateTransitionReceiptV01 } from "@/types/vnext/state-transition-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

export const VNEXT_OPERATOR_PILOT_WORKBENCH_LINEAGE_VERSION_V01 =
  "vnext_operator_pilot_workbench_lineage.v0.1" as const;

export type VNextOperatorPilotProposalLineageStageStatusV01 =
  | "not_applied"
  | "applied_awaiting_packet"
  | "packet_compiled_awaiting_result"
  | "later_result_recorded_awaiting_review"
  | "reviewed";

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
    handoff_href: string;
  };
  later_result: null | {
    receipt_id: string;
    receipt_fingerprint: string;
    recorded_at: string;
    run_id: string;
    reported_payload_use: VNextOperatorPilotReportedPayloadUseV01;
    cited_selected_state_count: number;
    actual_use_review_required: true;
    helpfulness_established: false;
  };
  context_use_review: null | {
    review_id: string;
    review_fingerprint: string;
    reviewed_at: string;
    actually_used: ContextUseReviewV01["usage"]["actually_used"];
    assessment: ContextUseReviewV01["assessment"];
    correction_count: number;
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
  const laterResults = loadValidatedLaterResults(db, input.config);
  const contextUseReviews = loadValidatedContextUseReviews(db, input.config);
  const chains = transitions.map((transition) =>
    buildLineageChain({
      db,
      config: input.config,
      transition,
      compiled_packets: compiledPackets,
      later_results: laterResults,
      context_use_reviews: contextUseReviews,
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

function loadValidatedLaterResults(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
): VNextOperatorPilotLaterResultReadModelV01[] {
  const laterResults: VNextOperatorPilotLaterResultReadModelV01[] = [];
  for (const record of listScopedRecords(db, config, "run_receipt")) {
    if (validateRunReceiptV01(record.payload).status !== "valid") {
      throw lineageError(
        "operator_pilot_workbench_lineage_run_receipt_invalid",
      );
    }
    const receipt = record.payload as RunReceiptV01;
    assertRecordEnvelope(record, {
      record_id: receipt.receipt_id,
      fingerprint: receipt.integrity.fingerprint,
      idempotency_key: receipt.idempotency_key,
      created_at: receipt.recorded_at,
      workspace_id: receipt.workspace_id,
      project_id: receipt.project_id,
    });
    if (
      !receipt.compatibility.source_contracts.includes(
        VNEXT_OPERATOR_PILOT_LATER_RESULT_INTAKE_VERSION_V01,
      )
    ) {
      continue;
    }
    laterResults.push(
      readVNextOperatorPilotLaterResultV01(db, {
        config,
        receipt_id: receipt.receipt_id,
        receipt_fingerprint: receipt.integrity.fingerprint,
      }),
    );
  }
  return laterResults;
}

function loadValidatedContextUseReviews(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
): VNextOperatorPilotContextUseReviewReadModelV01[] {
  return listScopedRecords(db, config, "context_use_review").map((record) => {
    if (validateContextUseReviewV01(record.payload).status !== "valid") {
      throw lineageError(
        "operator_pilot_workbench_lineage_context_review_invalid",
      );
    }
    const review = record.payload as ContextUseReviewV01;
    return readVNextOperatorPilotContextUseReviewV01(db, {
      config,
      review_id: review.review_id,
      review_fingerprint: review.integrity.fingerprint,
    });
  });
}

function buildLineageChain(input: {
  db: Database.Database;
  config: VNextLocalOperatorPilotConfigV01;
  transition: ValidatedVNextSemanticTransitionRelationV01;
  compiled_packets: ValidatedCompiledPacketV01[];
  later_results: VNextOperatorPilotLaterResultReadModelV01[];
  context_use_reviews: VNextOperatorPilotContextUseReviewReadModelV01[];
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
  const laterResult = compiled
    ? readLatestLaterResult(
        input.db,
        input.config,
        compiled.inspection,
        input.later_results,
      )
    : null;
  const contextUseReview = laterResult
    ? readContextUseReview(
        input.db,
        input.config,
        compiled!.inspection,
        laterResult,
        input.context_use_reviews,
      )
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
    later_result: laterResult
      ? {
          receipt_id: laterResult.receipt.receipt_id,
          receipt_fingerprint: laterResult.receipt.integrity.fingerprint,
          recorded_at: laterResult.receipt.recorded_at,
          run_id: laterResult.receipt.run_id,
          reported_payload_use:
            laterResult.packet_consumption.reported_payload_use,
          cited_selected_state_count:
            laterResult.packet_consumption.cited_selected_context.length,
          actual_use_review_required:
            laterResult.relation.actual_use_review_required,
          helpfulness_established:
            laterResult.relation.helpfulness_established,
        }
      : null,
    context_use_review: contextUseReview
      ? {
          review_id: contextUseReview.review.review_id,
          review_fingerprint:
            contextUseReview.review.integrity.fingerprint,
          reviewed_at: contextUseReview.review.reviewed_at,
          actually_used: contextUseReview.review.usage.actually_used,
          assessment: contextUseReview.review.assessment,
          correction_count:
            contextUseReview.review.corrections.correction_count,
        }
      : null,
    stage_status: contextUseReview
      ? "reviewed"
      : laterResult
        ? "later_result_recorded_awaiting_review"
        : compiled
          ? "packet_compiled_awaiting_result"
          : "applied_awaiting_packet",
  };
}

function summarizePacket(
  inspection: VNextOperatorPilotPacketLineageInspectionV01,
  observedAt: string,
): NonNullable<
  VNextOperatorPilotProposalDurableLineageChainV01["compiled_packet"]
> {
  const packet = inspection.packet;
  const handoffHref = buildTaskContextPacketHandoffHrefV01({
    packet_id: packet.packet_id,
    packet_fingerprint: packet.integrity.fingerprint,
  });
  if (!handoffHref) {
    throw lineageError(
      "operator_pilot_workbench_lineage_packet_handoff_invalid",
    );
  }
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
    handoff_href: handoffHref,
  };
}

function readLatestLaterResult(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  packet: VNextOperatorPilotPacketLineageInspectionV01,
  validatedResults: VNextOperatorPilotLaterResultReadModelV01[],
): VNextOperatorPilotLaterResultReadModelV01 | null {
  const samePacketResults = validatedResults.filter((result) => {
    const packetRef = result.receipt.task_context_packet_ref;
    if (packetRef?.external_id !== packet.packet.packet_id) return false;
    if (
      packetRef.source_ref !== packet.packet.integrity.fingerprint ||
      result.source_transition_receipt.transition_receipt_id !==
        packet.source_transition_receipt.transition_receipt_id ||
      result.source_transition_receipt.transition_receipt_fingerprint !==
        packet.source_transition_receipt.transition_receipt_fingerprint
    ) {
      throw lineageError(
        "operator_pilot_workbench_lineage_later_result_relation_mismatch",
      );
    }
    return true;
  });
  if (samePacketResults.length === 0) return null;
  if (samePacketResults.length > 1) {
    throw lineageError(
      "operator_pilot_workbench_lineage_later_result_relation_ambiguous",
      409,
    );
  }
  let latest: VNextOperatorPilotLaterResultReadModelV01;
  try {
    latest = readLatestVNextOperatorPilotLaterResultForPacketV01(db, {
      config,
      packet_id: packet.packet.packet_id,
      packet_fingerprint: packet.packet.integrity.fingerprint,
    });
  } catch (error) {
    if (
      error instanceof VNextOperatorPilotLaterResultErrorV01 &&
      error.code === "operator_pilot_later_result_missing"
    ) {
      return null;
    }
    throw error;
  }
  if (
    !samePacketResults.some(
      (result) =>
        result.receipt.receipt_id === latest.receipt.receipt_id &&
        result.receipt.integrity.fingerprint ===
          latest.receipt.integrity.fingerprint,
    )
  ) {
    throw lineageError(
      "operator_pilot_workbench_lineage_later_result_selection_invalid",
    );
  }
  return latest;
}

function readContextUseReview(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  packet: VNextOperatorPilotPacketLineageInspectionV01,
  laterResult: VNextOperatorPilotLaterResultReadModelV01,
  validatedReviews: VNextOperatorPilotContextUseReviewReadModelV01[],
): VNextOperatorPilotContextUseReviewReadModelV01 | null {
  let review: VNextOperatorPilotContextUseReviewReadModelV01;
  try {
    review = readVNextOperatorPilotContextUseReviewForLaterResultV01(db, {
      config,
      later_task_run_receipt_id: laterResult.receipt.receipt_id,
      later_task_run_receipt_fingerprint:
        laterResult.receipt.integrity.fingerprint,
    });
  } catch (error) {
    if (
      error instanceof VNextOperatorPilotContextUseReviewErrorV01 &&
      error.code === "operator_pilot_context_use_review_missing"
    ) {
      return null;
    }
    throw error;
  }
  if (
    review.review.later_packet.packet_id !== packet.packet.packet_id ||
    review.review.later_packet.packet_fingerprint !==
      packet.packet.integrity.fingerprint ||
    review.review.source_transition_receipt.transition_receipt_id !==
      packet.source_transition_receipt.transition_receipt_id ||
    review.review.source_transition_receipt.transition_receipt_fingerprint !==
      packet.source_transition_receipt.transition_receipt_fingerprint ||
    !validatedReviews.some(
      (candidate) =>
        candidate.review.review_id === review.review.review_id &&
        candidate.review.integrity.fingerprint ===
          review.review.integrity.fingerprint,
    )
  ) {
    throw lineageError(
      "operator_pilot_workbench_lineage_context_review_relation_mismatch",
    );
  }
  return review;
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
