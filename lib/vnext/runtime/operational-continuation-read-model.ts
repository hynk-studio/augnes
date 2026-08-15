import type Database from "better-sqlite3";

import {
  materializeSourceLinkedOperationalContinuationV01,
  type OperationalContinuationCanonicalAdmissionReadbackV01,
} from "@/lib/vnext/operational-context-selection";
import {
  materializeOperationalFrictionProposalV01,
} from "@/lib/vnext/operational-friction-proposal";
import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  assertVNextDurableSemanticStoreSchemaV01,
  readVNextCoreRecordV01,
  type VNextCoreRecordKindV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import {
  readOperationalFrictionProposalFromExactSourcesV01,
} from "@/lib/vnext/persistence/episode-delta-proposal-admission";
import {
  canonicalizeProtocolValueV01,
  isProtocolRecordV01,
  normalizeProtocolTextV01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import { readContextUseAttributionProjectionV01 } from "@/lib/vnext/runtime/context-use-attribution-read-model";
import {
  rebuildContinuityDynamicsFromDurableSourcesV01,
  type ContinuityDynamicsReadRequestV01,
} from "@/lib/vnext/runtime/continuity-dynamics-read-model";
import type { VNextLocalOperatorPilotConfigV01 } from "@/lib/vnext/runtime/local-operator-session";
import {
  readVNextOperatorPilotSemanticReviewV01,
} from "@/lib/vnext/runtime/operator-pilot-review-material";
import type { ContextUseReviewV01 } from "@/types/vnext/context-use-review";
import type { PersonalPerspectivePairedEvaluationV01 } from "@/types/vnext/context-shadow-navigation";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { StateTransitionReceiptV01 } from "@/types/vnext/state-transition-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import type { SourceLinkedOperationalContinuationV01 } from "@/types/vnext/operational-context-selection";

export interface OperationalContinuationReadRequestV01 {
  workspace_id: string;
  project_id: string;
  operator_id: string;
  frames: ContinuityDynamicsReadRequestV01["frames"];
  window_kind: ContinuityDynamicsReadRequestV01["window_kind"];
  paired_evaluation: PersonalPerspectivePairedEvaluationV01;
  decision_time_cutoff: string;
  max_selected_candidates: number;
}

export interface OperationalContinuationReadResultV01 {
  result_version: "operational_continuation_read_result.v0.1";
  result_kind: "query_only_exact_source_compilation";
  workspace_id: string;
  project_id: string;
  continuation: SourceLinkedOperationalContinuationV01;
  canonical_admission_identity_verified: true;
  exact_source_rematerialization_bound: true;
  historical_canonical_writer_invocation_proven: false;
  persistence_boundary: {
    sqlite_query_only_required: true;
    inserts: 0;
    updates: 0;
    deletes: 0;
    migrations: 0;
    local_session_mutations: 0;
    proposal_mutations: 0;
    decision_mutations: 0;
    task_context_packet_writes: 0;
    semantic_writes: 0;
    attachment_or_execution_decisions: 0;
    provider_calls: 0;
    model_calls: 0;
    network_calls: 0;
    github_calls: 0;
    external_calls: 0;
  };
}

export class OperationalContinuationReadModelErrorV01 extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = "OperationalContinuationReadModelErrorV01";
    this.code = code;
  }
}

/**
 * Query-only durable-source adapter. The connection must already be in
 * SQLite query-only mode; no migration or mutation is attempted here.
 */
export function readOperationalContinuationV01(
  db: Database.Database,
  requestInput: OperationalContinuationReadRequestV01,
): OperationalContinuationReadResultV01 {
  assertQueryOnlyV01(db);
  const totalChangesBefore = readTotalChangesV01(db);
  const continuation = rebuildOperationalContinuationFromDurableSourcesV01(
    db,
    requestInput,
  );
  if (readTotalChangesV01(db) !== totalChangesBefore) {
    refuseV01("operational_continuation_query_only_mutation_detected");
  }
  return {
    result_version: "operational_continuation_read_result.v0.1",
    result_kind: "query_only_exact_source_compilation",
    workspace_id: continuation.selection.workspace_id,
    project_id: continuation.selection.project_id,
    continuation,
    canonical_admission_identity_verified: true,
    exact_source_rematerialization_bound: true,
    historical_canonical_writer_invocation_proven: false,
    persistence_boundary: {
      sqlite_query_only_required: true,
      inserts: 0,
      updates: 0,
      deletes: 0,
      migrations: 0,
      local_session_mutations: 0,
      proposal_mutations: 0,
      decision_mutations: 0,
      task_context_packet_writes: 0,
      semantic_writes: 0,
      attachment_or_execution_decisions: 0,
      provider_calls: 0,
      model_calls: 0,
      network_calls: 0,
      github_calls: 0,
      external_calls: 0,
    },
  };
}

/**
 * Exact durable-source recompilation shared by the query-only ACGC5A
 * consumer and the authenticated ACGC5B writer. This function performs no
 * write; callers that may later mutate own their transaction and must repeat
 * the complete read inside it before committing any continuation record.
 */
export function rebuildOperationalContinuationFromDurableSourcesV01(
  db: Database.Database,
  requestInput: OperationalContinuationReadRequestV01,
): SourceLinkedOperationalContinuationV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const request = parseRequestV01(requestInput);
  const dynamics = rebuildContinuityDynamicsFromDurableSourcesV01(db, {
    workspace_id: request.workspace_id,
    project_id: request.project_id,
    frames: request.frames,
    window_kind: request.window_kind,
  });
  const finalFrameRequest = request.frames.at(-1)!;
  const finalShadow = finalFrameRequest.context_shadow_projection;
  if (!finalShadow) refuseV01("operational_continuation_shadow_source_missing");
  const review = readBoundRecordV01<ContextUseReviewV01>(db, {
    record_kind: "context_use_review",
    record_id: finalFrameRequest.review_id,
    expected_fingerprint: finalFrameRequest.review_fingerprint,
    workspace_id: request.workspace_id,
    project_id: request.project_id,
  });
  const priorPacket = readBoundRecordV01<TaskContextPacketV01>(db, {
    record_kind: "task_context_packet",
    record_id: review.prior_packet.packet_id,
    expected_fingerprint: review.prior_packet.packet_fingerprint,
    workspace_id: request.workspace_id,
    project_id: request.project_id,
  });
  const packetA = readBoundRecordV01<TaskContextPacketV01>(db, {
    record_kind: "task_context_packet",
    record_id: review.later_packet.packet_id,
    expected_fingerprint: review.later_packet.packet_fingerprint,
    workspace_id: request.workspace_id,
    project_id: request.project_id,
  });
  const transition = readBoundRecordV01<StateTransitionReceiptV01>(db, {
    record_kind: "state_transition_receipt",
    record_id: review.source_transition_receipt.transition_receipt_id,
    expected_fingerprint:
      review.source_transition_receipt.transition_receipt_fingerprint,
    workspace_id: request.workspace_id,
    project_id: request.project_id,
  });
  const runReceipt = readBoundRecordV01<RunReceiptV01>(db, {
    record_kind: "run_receipt",
    record_id: review.later_task_run_receipt.receipt_id,
    expected_fingerprint: review.later_task_run_receipt.receipt_fingerprint,
    workspace_id: request.workspace_id,
    project_id: request.project_id,
  });
  const attribution = readContextUseAttributionProjectionV01(db, {
    workspace_id: request.workspace_id,
    project_id: request.project_id,
    review_id: review.review_id,
    review_fingerprint: review.integrity.fingerprint,
  });
  const operationalSource = {
    workspace_id: request.workspace_id,
    project_id: request.project_id,
    attribution,
    context_shadow_projection: finalShadow,
    paired_evaluation: request.paired_evaluation,
    dynamics_digest: dynamics.digest,
    frames: dynamics.frames,
  };
  const materialization =
    materializeOperationalFrictionProposalV01(operationalSource);
  const canonical = readOperationalFrictionProposalFromExactSourcesV01(
    db,
    operationalSource,
  );
  if (!canonical) {
    refuseV01("operational_continuation_canonical_admission_missing");
  }
  const config: VNextLocalOperatorPilotConfigV01 = {
    enabled: true,
    workspace_id: request.workspace_id,
    project_id: request.project_id,
    operator_id: request.operator_id,
    database_path: "query-only-explicit-connection-not-reopened",
  };
  const reviewDetail = readVNextOperatorPilotSemanticReviewV01(db, {
    config,
    proposal_id: canonical.proposal.proposal_id,
    authenticated_session_id: null,
  });
  if (
    reviewDetail.operational_friction_review?.status !==
      "canonical_admission_verified" ||
    reviewDetail.operational_friction_review.review_mode !==
      "proposal_only_no_activation" ||
    reviewDetail.operational_friction_review.activation_owner_present !==
      false ||
    reviewDetail.operational_friction_review.semantic_transition_applicable !==
      false ||
    reviewDetail.transition_receipts.length !== 0 ||
    canonicalizeProtocolValueV01(reviewDetail.proposal) !==
      canonicalizeProtocolValueV01(canonical.proposal)
  ) {
    refuseV01("operational_continuation_review_mode_conflict");
  }
  const canonicalAdmission: OperationalContinuationCanonicalAdmissionReadbackV01 = {
    ...canonical,
    exact_source_rematerialization_bound: true,
  };
  const continuation = materializeSourceLinkedOperationalContinuationV01({
    workspace_id: request.workspace_id,
    project_id: request.project_id,
    prior_packet_a: priorPacket,
    packet_a: packetA,
    source_transition_receipt_a: transition,
    run_receipt_a: runReceipt,
    context_use_review_a: review,
    operational_friction_source: operationalSource,
    operational_friction_materialization: materialization,
    canonical_admission: canonicalAdmission,
    decision_history: reviewDetail.decision_history,
    state_transition_receipts: reviewDetail.transition_receipts,
    decision_time_cutoff: request.decision_time_cutoff,
    max_selected_candidates: request.max_selected_candidates,
  });
  return continuation;
}

function parseRequestV01(
  input: OperationalContinuationReadRequestV01,
): OperationalContinuationReadRequestV01 {
  if (!isProtocolRecordV01(input)) {
    refuseV01("operational_continuation_read_request_invalid");
  }
  const allowed = new Set([
    "workspace_id",
    "project_id",
    "operator_id",
    "frames",
    "window_kind",
    "paired_evaluation",
    "decision_time_cutoff",
    "max_selected_candidates",
  ]);
  if (Object.keys(input).some((key) => !allowed.has(key))) {
    refuseV01("operational_continuation_read_request_unknown_field");
  }
  const workspaceId = normalizeProtocolTextV01(input.workspace_id);
  const projectId = normalizeProtocolTextV01(input.project_id);
  const operatorId = normalizeProtocolTextV01(input.operator_id);
  if (
    !workspaceId ||
    !projectId ||
    !operatorId ||
    !Array.isArray(input.frames) ||
    input.frames.length < 1 ||
    parseStrictIsoTimestampV01(input.decision_time_cutoff) === null ||
    !Number.isInteger(input.max_selected_candidates)
  ) {
    refuseV01("operational_continuation_read_request_invalid");
  }
  return {
    workspace_id: workspaceId,
    project_id: projectId,
    operator_id: operatorId,
    frames: structuredClone(input.frames),
    window_kind: input.window_kind,
    paired_evaluation: structuredClone(input.paired_evaluation),
    decision_time_cutoff: input.decision_time_cutoff,
    max_selected_candidates: input.max_selected_candidates,
  };
}

function readBoundRecordV01<T>(
  db: Database.Database,
  input: {
    record_kind: VNextCoreRecordKindV01;
    record_id: string;
    expected_fingerprint: string;
    workspace_id: string;
    project_id: string;
  },
): T {
  const record = readVNextCoreRecordV01(db, input);
  if (!record) refuseV01("operational_continuation_source_record_missing");
  if (record.fingerprint !== input.expected_fingerprint) {
    refuseV01("operational_continuation_source_record_resealed");
  }
  try {
    assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      fingerprint: input.expected_fingerprint,
    });
  } catch {
    refuseV01("operational_continuation_source_envelope_conflict");
  }
  return structuredClone(record.payload) as T;
}

function assertQueryOnlyV01(db: Database.Database): void {
  const row = db.pragma("query_only", { simple: true });
  if (row !== 1) refuseV01("operational_continuation_query_only_required");
}

function readTotalChangesV01(db: Database.Database): number {
  const row = db
    .prepare("SELECT total_changes() AS total_changes")
    .get() as { total_changes: number };
  return row.total_changes;
}

function refuseV01(code: string): never {
  throw new OperationalContinuationReadModelErrorV01(code);
}
