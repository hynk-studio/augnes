import type Database from "better-sqlite3";

import {
  buildContextUseAttributionProjectionV01,
} from "@/lib/vnext/context-use-attribution-projection";
import {
  validateContextUseReviewRelationsV01,
  validateContextUseReviewV01,
} from "@/lib/vnext/context-use-review";
import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  assertVNextDurableSemanticStoreSchemaV01,
  readVNextCoreRecordV01,
  type VNextCoreRecordEnvelopeV01,
  type VNextCoreRecordKindV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import { normalizeProtocolTextV01 } from "@/lib/vnext/protocol-primitives";
import { validateRunReceiptV01 } from "@/lib/vnext/run-receipt";
import { validateStateTransitionReceiptV01 } from "@/lib/vnext/state-transition-receipt";
import { readOperationalContinuationLineageStateV01 } from "@/lib/vnext/runtime/source-linked-operational-continuation-lineage";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import type { ContextUseAttributionProjectionV01 } from "@/types/vnext/context-use-attribution-projection";
import type { ContextUseReviewV01 } from "@/types/vnext/context-use-review";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { OperationalContinuationAdmissionV01 } from "@/types/vnext/operational-continuation-admission";
import type { OperationalContextSelectionV01 } from "@/types/vnext/operational-context-selection";
import type { StateTransitionReceiptV01 } from "@/types/vnext/state-transition-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

export interface ContextUseAttributionReadRequestV01 {
  workspace_id: string;
  project_id: string;
  review_id: string;
  review_fingerprint: string;
  operational_context_selection?: OperationalContextSelectionV01;
}

export class ContextUseAttributionReadModelErrorV01 extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = "ContextUseAttributionReadModelErrorV01";
    this.code = code;
  }
}

/**
 * Resolves one exact persisted review chain and derives a rebuildable read
 * projection. The function performs no insert, update, delete, migration,
 * provider, network, or external call.
 */
export function readContextUseAttributionProjectionV01(
  db: Database.Database,
  requestInput: ContextUseAttributionReadRequestV01,
): ContextUseAttributionProjectionV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const request = parseRequestV01(requestInput);
  const reviewRecord = readRequiredRecordV01(db, {
    record_kind: "context_use_review",
    record_id: request.review_id,
    workspace_id: request.workspace_id,
    project_id: request.project_id,
    missing_code: "context_use_attribution_review_missing",
  });
  if (reviewRecord.fingerprint !== request.review_fingerprint) {
    failV01("context_use_attribution_review_fingerprint_mismatch");
  }
  if (validateContextUseReviewV01(reviewRecord.payload).status !== "valid") {
    failV01("context_use_attribution_review_invalid");
  }
  const review = reviewRecord.payload as ContextUseReviewV01;
  assertEnvelopeV01(reviewRecord, {
    workspace_id: review.workspace_id,
    project_id: review.project_id,
    record_id: review.review_id,
    fingerprint: review.integrity.fingerprint,
    created_at: review.reviewed_at,
    error_code: "context_use_attribution_review_envelope_invalid",
  });

  const priorPacket = readPacketV01(db, {
    workspace_id: request.workspace_id,
    project_id: request.project_id,
    packet_id: review.prior_packet.packet_id,
    packet_fingerprint: review.prior_packet.packet_fingerprint,
    role: "prior",
  });
  const laterPacket = readPacketV01(db, {
    workspace_id: request.workspace_id,
    project_id: request.project_id,
    packet_id: review.later_packet.packet_id,
    packet_fingerprint: review.later_packet.packet_fingerprint,
    role: "later",
  });
  const runReceipt = readRunReceiptV01(db, request, review);
  if (
    review.source_transition_receipt &&
    request.operational_context_selection !== undefined
  ) {
    failV01("context_use_attribution_unexpected_operational_selection");
  }
  const lineageSource = review.source_transition_receipt
    ? readTransitionV01(db, request, review)
    : readOperationalContinuationV01(db, request, review);
  const relation = validateContextUseReviewRelationsV01(
    review,
    priorPacket,
    laterPacket,
    lineageSource,
    runReceipt,
  );
  if (relation.status !== "valid") {
    failV01(
      `context_use_attribution_source_relation_invalid:${relation.errors
        .map((issue) => issue.code)
        .join(",")}`,
    );
  }
  return buildContextUseAttributionProjectionV01({
    review,
    prior_packet: priorPacket,
    later_packet: laterPacket,
    ...(review.source_transition_receipt
      ? {
          source_transition_receipt:
            lineageSource as StateTransitionReceiptV01,
        }
      : {
          source_operational_continuation_admission:
            lineageSource as OperationalContinuationAdmissionV01,
          source_operational_context_selection:
            request.operational_context_selection,
        }),
    later_task_run_receipt: runReceipt,
  });
}

function readPacketV01(
  db: Database.Database,
  input: {
    workspace_id: string;
    project_id: string;
    packet_id: string;
    packet_fingerprint: string;
    role: "prior" | "later";
  },
): TaskContextPacketV01 {
  const record = readRequiredRecordV01(db, {
    record_kind: "task_context_packet",
    record_id: input.packet_id,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    missing_code: `context_use_attribution_${input.role}_packet_missing`,
  });
  if (record.fingerprint !== input.packet_fingerprint) {
    failV01(`context_use_attribution_${input.role}_packet_fingerprint_mismatch`);
  }
  const packet = record.payload as TaskContextPacketV01;
  if (
    validateTaskContextPacketV01(packet, {
      evaluated_at: packet?.generated_at ?? "",
    }).status !== "valid"
  ) {
    failV01(`context_use_attribution_${input.role}_packet_invalid`);
  }
  assertEnvelopeV01(record, {
    workspace_id: packet.workspace_id,
    project_id: packet.project_id,
    record_id: packet.packet_id,
    fingerprint: packet.integrity.fingerprint,
    created_at: packet.generated_at,
    error_code: `context_use_attribution_${input.role}_packet_envelope_invalid`,
  });
  return packet;
}

function readTransitionV01(
  db: Database.Database,
  request: ContextUseAttributionReadRequestV01,
  review: ContextUseReviewV01,
): StateTransitionReceiptV01 {
  if (!review.source_transition_receipt) {
    failV01("context_use_attribution_transition_receipt_binding_missing");
  }
  const record = readRequiredRecordV01(db, {
    record_kind: "state_transition_receipt",
    record_id: review.source_transition_receipt.transition_receipt_id,
    workspace_id: request.workspace_id,
    project_id: request.project_id,
    missing_code: "context_use_attribution_transition_receipt_missing",
  });
  if (
    record.fingerprint !==
    review.source_transition_receipt.transition_receipt_fingerprint
  ) {
    failV01("context_use_attribution_transition_receipt_fingerprint_mismatch");
  }
  if (validateStateTransitionReceiptV01(record.payload).status !== "valid") {
    failV01("context_use_attribution_transition_receipt_invalid");
  }
  const transition = record.payload as StateTransitionReceiptV01;
  assertEnvelopeV01(record, {
    workspace_id: transition.workspace_id,
    project_id: transition.project_id,
    record_id: transition.transition_receipt_id,
    fingerprint: transition.integrity.fingerprint,
    idempotency_key: transition.idempotency_key,
    created_at: transition.recorded_at,
    error_code: "context_use_attribution_transition_receipt_envelope_invalid",
  });
  return transition;
}

function readOperationalContinuationV01(
  db: Database.Database,
  request: ContextUseAttributionReadRequestV01,
  review: ContextUseReviewV01,
) {
  const binding = review.source_operational_continuation;
  if (!binding) {
    failV01("context_use_attribution_operational_continuation_binding_missing");
  }
  const state = readOperationalContinuationLineageStateV01(db, request);
  if (
    !request.operational_context_selection ||
    !state ||
    state.admission.admission_id !== binding.admission_id ||
    state.admission.integrity.fingerprint !== binding.admission_fingerprint ||
    state.admission.acgc5a_materialization_identity.materialization_id !==
      binding.materialization_id ||
    state.admission.acgc5a_materialization_identity.materialization_fingerprint !==
      binding.materialization_fingerprint ||
    state.admission.operational_context_selection.selection_id !==
      binding.selection_id ||
    state.admission.operational_context_selection.selection_fingerprint !==
      binding.selection_fingerprint
  ) {
    failV01("context_use_attribution_operational_continuation_mismatch");
  }
  return state.admission;
}

function readRunReceiptV01(
  db: Database.Database,
  request: ContextUseAttributionReadRequestV01,
  review: ContextUseReviewV01,
): RunReceiptV01 {
  const record = readRequiredRecordV01(db, {
    record_kind: "run_receipt",
    record_id: review.later_task_run_receipt.receipt_id,
    workspace_id: request.workspace_id,
    project_id: request.project_id,
    missing_code: "context_use_attribution_run_receipt_missing",
  });
  if (
    record.fingerprint !== review.later_task_run_receipt.receipt_fingerprint
  ) {
    failV01("context_use_attribution_run_receipt_fingerprint_mismatch");
  }
  if (validateRunReceiptV01(record.payload).status !== "valid") {
    failV01("context_use_attribution_run_receipt_invalid");
  }
  const receipt = record.payload as RunReceiptV01;
  assertEnvelopeV01(record, {
    workspace_id: receipt.workspace_id,
    project_id: receipt.project_id,
    record_id: receipt.receipt_id,
    fingerprint: receipt.integrity.fingerprint,
    idempotency_key: receipt.idempotency_key,
    created_at: receipt.recorded_at,
    error_code: "context_use_attribution_run_receipt_envelope_invalid",
  });
  return receipt;
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

function assertEnvelopeV01(
  record: VNextCoreRecordEnvelopeV01,
  expected: {
    workspace_id: string;
    project_id: string;
    record_id: string;
    fingerprint: string;
    idempotency_key?: string;
    created_at: string;
    error_code: string;
  },
) {
  try {
    assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, expected);
  } catch {
    failV01(expected.error_code);
  }
  if (
    record.record_id !== expected.record_id ||
    record.created_at !== expected.created_at ||
    (expected.idempotency_key !== undefined &&
      record.idempotency_key !== expected.idempotency_key)
  ) {
    failV01(expected.error_code);
  }
}

function parseRequestV01(
  value: ContextUseAttributionReadRequestV01,
): ContextUseAttributionReadRequestV01 {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    failV01("context_use_attribution_read_request_invalid");
  }
  const allowed = new Set([
    "workspace_id",
    "project_id",
    "review_id",
    "review_fingerprint",
    "operational_context_selection",
  ]);
  const keys = Object.keys(value);
  if (
    keys.length < allowed.size - 1 ||
    keys.length > allowed.size ||
    keys.some((key) => !allowed.has(key))
  ) {
    failV01("context_use_attribution_read_request_unknown_field");
  }
  const request = {
    workspace_id: normalizeProtocolTextV01(value.workspace_id),
    project_id: normalizeProtocolTextV01(value.project_id),
    review_id: normalizeProtocolTextV01(value.review_id),
    review_fingerprint: normalizeProtocolTextV01(value.review_fingerprint),
    ...(value.operational_context_selection
      ? {
          operational_context_selection: structuredClone(
            value.operational_context_selection,
          ),
        }
      : {}),
  };
  if (
    !request.workspace_id ||
    !request.project_id ||
    !request.review_id ||
    !/^sha256:[a-f0-9]{64}$/u.test(request.review_fingerprint)
  ) {
    failV01("context_use_attribution_read_request_invalid");
  }
  return request;
}

function failV01(code: string): never {
  throw new ContextUseAttributionReadModelErrorV01(code);
}
