import type Database from "better-sqlite3";

import {
  buildContinuityDynamicsDigestV01,
  buildWorkContinuityStateFrameV01,
} from "@/lib/vnext/continuity-dynamics";
import {
  assertVNextDurableSemanticStoreSchemaV01,
  readVNextCoreRecordV01,
  type VNextCoreRecordEnvelopeV01,
  type VNextCoreRecordKindV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import {
  isProtocolRecordV01,
  normalizeProtocolTextV01,
} from "@/lib/vnext/protocol-primitives";
import { readContextUseAttributionProjectionV01 } from "@/lib/vnext/runtime/context-use-attribution-read-model";
import type { ContextUseReviewV01 } from "@/types/vnext/context-use-review";
import type {
  ContinuityDynamicsDigestV01,
  ContinuityDynamicsWindowKindV01,
  WorkContinuityStateFrameV01,
} from "@/types/vnext/continuity-dynamics";
import { CONTINUITY_DYNAMICS_MAX_FRAMES_V01 } from "@/types/vnext/continuity-dynamics";
import type { PersonalPerspectiveShadowProjectionV01 } from "@/types/vnext/context-shadow-navigation";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { StateTransitionReceiptV01 } from "@/types/vnext/state-transition-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/u;

export interface ContinuityDynamicsPersistedFrameRequestV01 {
  review_id: string;
  review_fingerprint: string;
  context_shadow_projection?: PersonalPerspectiveShadowProjectionV01 | null;
}

export interface ContinuityDynamicsReadRequestV01 {
  workspace_id: string;
  project_id: string;
  frames: ContinuityDynamicsPersistedFrameRequestV01[];
  window_kind: ContinuityDynamicsWindowKindV01;
}

export interface ContinuityDynamicsReadResultV01 {
  result_version: "continuity_dynamics_read_result.v0.1";
  result_kind: "persisted_read_only_bounded_observation";
  workspace_id: string;
  project_id: string;
  frames: WorkContinuityStateFrameV01[];
  digest: ContinuityDynamicsDigestV01;
  persistence_boundary: {
    sqlite_query_only_required: true;
    inserts: 0;
    updates: 0;
    deletes: 0;
    schema_changes: 0;
    source_record_mutations: 0;
    provider_calls: 0;
    network_calls: 0;
    external_calls: 0;
  };
}

export class ContinuityDynamicsReadModelErrorV01 extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = "ContinuityDynamicsReadModelErrorV01";
    this.code = code;
  }
}

/**
 * Reads only exact persisted source chains from the existing vNext immutable
 * ledger. The caller connection must already be SQLite query-only; this
 * function performs no insert, update, delete, migration, provider, network,
 * or external operation.
 */
export function readContinuityDynamicsV01(
  db: Database.Database,
  requestInput: ContinuityDynamicsReadRequestV01,
): ContinuityDynamicsReadResultV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  assertQueryOnlyV01(db);
  const request = parseRequestV01(requestInput);
  const frames = request.frames.map((frameRequest) => {
    const attribution = readContextUseAttributionProjectionV01(db, {
      workspace_id: request.workspace_id,
      project_id: request.project_id,
      review_id: frameRequest.review_id,
      review_fingerprint: frameRequest.review_fingerprint,
    });
    const reviewRecord = readRequiredRecordV01(db, {
      record_kind: "context_use_review",
      record_id: frameRequest.review_id,
      workspace_id: request.workspace_id,
      project_id: request.project_id,
      missing_code: "continuity_dynamics_review_missing",
    });
    if (reviewRecord.fingerprint !== frameRequest.review_fingerprint) {
      failV01("continuity_dynamics_review_fingerprint_mismatch");
    }
    const review = reviewRecord.payload as ContextUseReviewV01;
    const priorPacket = readBoundRecordV01<TaskContextPacketV01>(db, {
      record_kind: "task_context_packet",
      record_id: review.prior_packet.packet_id,
      expected_fingerprint: review.prior_packet.packet_fingerprint,
      workspace_id: request.workspace_id,
      project_id: request.project_id,
      missing_code: "continuity_dynamics_prior_packet_missing",
      stale_code: "continuity_dynamics_prior_packet_fingerprint_mismatch",
    });
    const laterPacket = readBoundRecordV01<TaskContextPacketV01>(db, {
      record_kind: "task_context_packet",
      record_id: review.later_packet.packet_id,
      expected_fingerprint: review.later_packet.packet_fingerprint,
      workspace_id: request.workspace_id,
      project_id: request.project_id,
      missing_code: "continuity_dynamics_later_packet_missing",
      stale_code: "continuity_dynamics_later_packet_fingerprint_mismatch",
    });
    const transition = readBoundRecordV01<StateTransitionReceiptV01>(db, {
      record_kind: "state_transition_receipt",
      record_id: review.source_transition_receipt.transition_receipt_id,
      expected_fingerprint:
        review.source_transition_receipt.transition_receipt_fingerprint,
      workspace_id: request.workspace_id,
      project_id: request.project_id,
      missing_code: "continuity_dynamics_transition_missing",
      stale_code: "continuity_dynamics_transition_fingerprint_mismatch",
    });
    const runReceipt = readBoundRecordV01<RunReceiptV01>(db, {
      record_kind: "run_receipt",
      record_id: review.later_task_run_receipt.receipt_id,
      expected_fingerprint:
        review.later_task_run_receipt.receipt_fingerprint,
      workspace_id: request.workspace_id,
      project_id: request.project_id,
      missing_code: "continuity_dynamics_run_receipt_missing",
      stale_code: "continuity_dynamics_run_receipt_fingerprint_mismatch",
    });
    return buildWorkContinuityStateFrameV01({
      boundary_kind: "context_use_review_recorded",
      workspace_id: request.workspace_id,
      project_id: request.project_id,
      prior_task_context_packet: priorPacket,
      later_task_context_packet: laterPacket,
      source_transition_receipt: transition,
      later_task_run_receipt: runReceipt,
      context_use_review: review,
      context_use_attribution: attribution,
      context_shadow_projection: frameRequest.context_shadow_projection ?? null,
    });
  });
  const digest = buildContinuityDynamicsDigestV01({
    workspace_id: request.workspace_id,
    project_id: request.project_id,
    frames,
    window_kind: request.window_kind,
  });
  return {
    result_version: "continuity_dynamics_read_result.v0.1",
    result_kind: "persisted_read_only_bounded_observation",
    workspace_id: request.workspace_id,
    project_id: request.project_id,
    frames,
    digest,
    persistence_boundary: {
      sqlite_query_only_required: true,
      inserts: 0,
      updates: 0,
      deletes: 0,
      schema_changes: 0,
      source_record_mutations: 0,
      provider_calls: 0,
      network_calls: 0,
      external_calls: 0,
    },
  };
}

function parseRequestV01(
  value: ContinuityDynamicsReadRequestV01,
): ContinuityDynamicsReadRequestV01 {
  if (!isProtocolRecordV01(value)) {
    failV01("continuity_dynamics_read_request_invalid");
  }
  assertExactKeysV01(value, [
    "workspace_id",
    "project_id",
    "frames",
    "window_kind",
  ]);
  const workspaceId = normalizeProtocolTextV01(value.workspace_id);
  const projectId = normalizeProtocolTextV01(value.project_id);
  if (
    !workspaceId ||
    !projectId ||
    !Array.isArray(value.frames) ||
    value.frames.length < 1 ||
    value.frames.length > CONTINUITY_DYNAMICS_MAX_FRAMES_V01 ||
    ![
      "current_only",
      "recent_3",
      "recent_5",
      "since_last_transition",
    ].includes(String(value.window_kind))
  ) {
    failV01("continuity_dynamics_read_request_invalid");
  }
  const frames = value.frames.map((input) => {
    if (!isProtocolRecordV01(input)) {
      failV01("continuity_dynamics_frame_request_invalid");
    }
    assertExactKeysV01(input, [
      "review_id",
      "review_fingerprint",
      "context_shadow_projection",
    ]);
    const reviewId = normalizeProtocolTextV01(input.review_id);
    const reviewFingerprint = normalizeProtocolTextV01(
      input.review_fingerprint,
    );
    if (!reviewId || !SHA256_PATTERN.test(reviewFingerprint)) {
      failV01("continuity_dynamics_frame_request_invalid");
    }
    return {
      review_id: reviewId,
      review_fingerprint: reviewFingerprint,
      ...(input.context_shadow_projection !== undefined
        ? {
            context_shadow_projection:
              input.context_shadow_projection as PersonalPerspectiveShadowProjectionV01 | null,
          }
        : {}),
    };
  });
  return {
    workspace_id: workspaceId,
    project_id: projectId,
    frames,
    window_kind: value.window_kind,
  };
}

function readRequiredRecordV01(
  db: Database.Database,
  input: {
    record_kind: VNextCoreRecordKindV01;
    record_id: string;
    workspace_id: string;
    project_id: string;
    missing_code: string;
  },
): VNextCoreRecordEnvelopeV01 {
  const record = readVNextCoreRecordV01(db, input);
  if (!record) failV01(input.missing_code);
  return record;
}

function readBoundRecordV01<T>(
  db: Database.Database,
  input: {
    record_kind: VNextCoreRecordKindV01;
    record_id: string;
    expected_fingerprint: string;
    workspace_id: string;
    project_id: string;
    missing_code: string;
    stale_code: string;
  },
): T {
  const record = readRequiredRecordV01(db, input);
  if (record.fingerprint !== input.expected_fingerprint) {
    failV01(input.stale_code);
  }
  return record.payload as T;
}

function assertQueryOnlyV01(db: Database.Database): void {
  const queryOnly = db.pragma("query_only", { simple: true });
  if (queryOnly !== 1) {
    failV01("continuity_dynamics_sqlite_query_only_required");
  }
}

function assertExactKeysV01(
  value: Record<string, unknown>,
  allowed: readonly string[],
): void {
  const allowedSet = new Set(allowed);
  if (Object.keys(value).some((key) => !allowedSet.has(key))) {
    failV01("continuity_dynamics_read_request_unknown_field");
  }
}

function failV01(code: string): never {
  throw new ContinuityDynamicsReadModelErrorV01(code);
}
