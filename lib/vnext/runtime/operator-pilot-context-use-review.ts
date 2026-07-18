import type Database from "better-sqlite3";

import {
  buildContextUseReviewV01,
  deriveContextUseReviewPresentationProvenanceV01,
  validateContextUseReviewRelationsV01,
  validateContextUseReviewV01,
} from "@/lib/vnext/context-use-review";
import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  assertVNextDurableSemanticStoreSchemaV01,
  insertVNextCoreRecordV01,
  readVNextCoreRecordByIdempotencyKeyV01,
  readVNextCoreRecordV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  normalizeProtocolTextV01,
  uniqueProtocolStringsV01,
} from "@/lib/vnext/protocol-primitives";
import { validateRunReceiptV01 } from "@/lib/vnext/run-receipt";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
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
  VNEXT_OPERATOR_PILOT_CONTEXT_USE_REVIEW_CONTRACT_V01,
  VNEXT_OPERATOR_PILOT_CONTEXT_USE_REVIEW_NAMESPACE_V01,
  VNEXT_OPERATOR_PILOT_LATER_RESULT_INTAKE_CONTRACT_V01,
  createVNextOperatorPilotContextUseReviewLogicalIdentityV01,
  createVNextOperatorPilotContextUseReviewRequestFingerprintV01,
} from "@/lib/vnext/runtime/operator-pilot-context-use-contract";
import { loadValidatedVNextSemanticTransitionRelationV01 } from "@/lib/vnext/runtime/durable-semantic-transition";
import { inspectVNextOperatorPilotPacketLineageV01 } from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import {
  CONTEXT_USE_REVIEW_ACTUALLY_USED_VALUES_V01,
  CONTEXT_USE_REVIEW_ASSESSMENTS_V01,
  CONTEXT_USE_REVIEW_USAGE_PROVENANCE_VERSION_V01,
  type ContextUseReviewAssessmentV01,
  type ContextUseReviewActuallyUsedV01,
  type ContextUseReviewUsageProvenanceV01,
  type ContextUseReviewV01,
} from "@/types/vnext/context-use-review";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

const SESSION_ACTION_NAMESPACE = "augnes.vnext.local-operator-session.v0.1";
const MAX_TEXT = 2000;
const MAX_ITEMS = 128;

export class VNextOperatorPilotContextUseReviewErrorV01 extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status = 400) {
    super(code);
    this.name = "VNextOperatorPilotContextUseReviewErrorV01";
    this.code = code;
    this.status = status;
  }
}

export interface VNextOperatorPilotContextUseReviewRequestV01 {
  action: "record_context_use_review";
  later_run_receipt_id: string;
  later_run_receipt_fingerprint: string;
  actually_used: ContextUseReviewActuallyUsedV01;
  assessment: ContextUseReviewAssessmentV01;
  correction_summaries: string[];
  notes: string[];
  metrics: ContextUseReviewV01["metrics"];
}

export interface VNextOperatorPilotContextUseReviewResultV01 {
  status: "inserted" | "exact_replay";
  review: ContextUseReviewV01;
  semantic_state_changed: false;
  transition_created: false;
  packet_created: false;
  session_admission: VNextLocalOperatorSessionMutationAdmissionV01;
}

interface ContextUseSourceV01 {
  later_receipt: RunReceiptV01;
  later_packet: TaskContextPacketV01;
  prior_packet: TaskContextPacketV01;
  transition: ReturnType<
    typeof loadValidatedVNextSemanticTransitionRelationV01
  >;
}

export function recordVNextOperatorPilotContextUseReviewV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    credential: VNextLocalOperatorSessionCredentialV01;
    request: unknown;
    clock?: VNextLocalRuntimeClockV01;
    secret_source?: VNextLocalOperatorSecretSourceV01;
  },
): VNextOperatorPilotContextUseReviewResultV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const request = parseRequest(input.request);
  authenticateVNextLocalOperatorSessionV01(db, input);
  resolveContextUseSource(db, input.config, request);
  if (db.inTransaction) {
    throw reviewError("operator_pilot_context_use_review_nested_transaction", 409);
  }
  db.exec("BEGIN IMMEDIATE");
  try {
    const admission = admitVNextLocalOperatorMutationInsideTransactionV01(
      db,
      input,
    );
    const source = resolveContextUseSource(db, input.config, request);
    const identitySeed = identityMaterial(input.config, source);
    const logicalIdentity =
      createVNextOperatorPilotContextUseReviewLogicalIdentityV01(identitySeed);
    const idempotencyKey = createProtocolSha256V01(
      canonicalizeProtocolValueV01({ logical_identity: logicalIdentity }),
    );
    const existing = readVNextCoreRecordByIdempotencyKeyV01(db, {
      record_kind: "context_use_review",
      workspace_id: input.config.workspace_id,
      project_id: input.config.project_id,
      idempotency_key: idempotencyKey,
    });
    if (existing) {
      if (validateContextUseReviewV01(existing.payload).status !== "valid") {
        throw reviewError("operator_pilot_context_use_review_replay_conflict", 409);
      }
      const stored = existing.payload as ContextUseReviewV01;
      const expected = materializeReview({
        config: input.config,
        source,
        request,
        session_id: admission.session.session_id,
        reviewed_at: stored.reviewed_at,
        include_usage_provenance: stored.usage_provenance !== undefined,
      });
      assertVNextCoreRecordMatchesProtocolPayloadBindingV01(existing, {
        workspace_id: stored.workspace_id,
        project_id: stored.project_id,
        fingerprint: stored.integrity.fingerprint,
      });
      if (
        existing.record_id !== stored.review_id ||
        existing.created_at !== stored.reviewed_at ||
        existing.idempotency_key !== idempotencyKey ||
        canonicalizeProtocolValueV01(stored) !==
          canonicalizeProtocolValueV01(expected)
      ) {
        throw reviewError("operator_pilot_context_use_review_replay_conflict", 409);
      }
      db.exec("COMMIT");
      return result("exact_replay", stored, admission);
    }
    const review = materializeReview({
      config: input.config,
      source,
      request,
      session_id: admission.session.session_id,
      reviewed_at: admission.action_observed_at,
    });
    const relation = validateContextUseReviewRelationsV01(
      review,
      source.prior_packet,
      source.later_packet,
      source.transition.receipt,
      source.later_receipt,
    );
    if (relation.status !== "valid") {
      throw reviewError("operator_pilot_context_use_review_relation_invalid", 422);
    }
    const write = insertVNextCoreRecordV01(db, {
      record_kind: "context_use_review",
      record_id: review.review_id,
      workspace_id: review.workspace_id,
      project_id: review.project_id,
      fingerprint: review.integrity.fingerprint,
      idempotency_key: idempotencyKey,
      payload: review,
      created_at: review.reviewed_at,
    });
    db.exec("COMMIT");
    return result(write.status, review, admission);
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  }
}

function materializeReview(input: {
  config: VNextLocalOperatorPilotConfigV01;
  source: ContextUseSourceV01;
  request: VNextOperatorPilotContextUseReviewRequestV01;
  session_id: string;
  reviewed_at: string;
  include_usage_provenance?: boolean;
}): ContextUseReviewV01 {
  const identity = identityMaterial(input.config, input.source);
  const logicalIdentity =
    createVNextOperatorPilotContextUseReviewLogicalIdentityV01(identity);
  const presentation = deriveContextUseReviewPresentationProvenanceV01(
    input.source.later_receipt,
  );
  const usage = {
    presented: presentation.presented,
    actually_used: input.request.actually_used,
  } as const;
  const requestMaterial = {
    ...identity,
    usage,
    assessment: input.request.assessment,
    corrections: {
      correction_count: input.request.correction_summaries.length,
      summaries: input.request.correction_summaries,
    },
    metrics: input.request.metrics,
    notes: input.request.notes,
  };
  const requestFingerprint =
    createVNextOperatorPilotContextUseReviewRequestFingerprintV01(
      requestMaterial,
    );
  const authenticationFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      action: "record_context_use_review",
      workspace_id: input.config.workspace_id,
      project_id: input.config.project_id,
      operator_id: input.config.operator_id,
      session_id: input.session_id,
      logical_identity: logicalIdentity,
      request_fingerprint: requestFingerprint,
      observed_at: input.reviewed_at,
    }),
  );
  const reviewerRef: ExternalRefV01 = {
    ref_version: "external_ref.v0.1",
    ref_type: "local_operator_actor",
    external_id: input.config.operator_id,
    trust_class: "user_declaration",
    observed_at: input.reviewed_at,
    source_ref: authenticationFingerprint,
    compatibility_namespace:
      VNEXT_OPERATOR_PILOT_CONTEXT_USE_REVIEW_NAMESPACE_V01,
  };
  const basisRef: ExternalRefV01 = {
    ref_version: "external_ref.v0.1",
    ref_type: "local_operator_session_action",
    external_id: input.session_id,
    trust_class: "direct_local_observation",
    observed_at: input.reviewed_at,
    source_ref: authenticationFingerprint,
    compatibility_namespace: SESSION_ACTION_NAMESPACE,
  };
  const requestRef: ExternalRefV01 = {
    ref_version: "external_ref.v0.1",
    ref_type: "context_use_review_request",
    external_id: logicalIdentity,
    trust_class: "user_declaration",
    observed_at: input.reviewed_at,
    source_ref: requestFingerprint,
    compatibility_namespace:
      VNEXT_OPERATOR_PILOT_CONTEXT_USE_REVIEW_NAMESPACE_V01,
  };
  const usageProvenance =
    deriveVNextOperatorPilotContextUseUsageProvenanceV01({
      receipt: input.source.later_receipt,
      actually_used: input.request.actually_used,
      request_ref: requestRef,
    });
  return buildContextUseReviewV01({
    ...requestMaterial,
    ...(input.include_usage_provenance === false
      ? {}
      : { usage_provenance: usageProvenance }),
    reviewer_ref: reviewerRef,
    reviewer_authentication_basis_refs: [basisRef],
    reviewed_at: input.reviewed_at,
    compatibility: {
      source_contracts: [
        VNEXT_OPERATOR_PILOT_CONTEXT_USE_REVIEW_CONTRACT_V01,
        VNEXT_OPERATOR_PILOT_LATER_RESULT_INTAKE_CONTRACT_V01,
      ],
      unmapped_fields: [],
      warnings: [
        "Presented status and provenance are derived only from the exact passed packet-delivery relation.",
        "The current RunReceipt contract has no explicit actual-context-use relation; actual use and usefulness remain operator declarations, while receipt trust counts remain task-wide residue.",
      ],
      external_refs: [requestRef],
    },
    authority_notes: [
      "This review cannot create a proposal, decision, Transition, state change, packet, policy change, or automatic correction.",
    ],
  });
}

export function deriveVNextOperatorPilotContextUseUsageProvenanceV01(input: {
  receipt: RunReceiptV01;
  actually_used: ContextUseReviewActuallyUsedV01;
  request_ref: ExternalRefV01;
}): ContextUseReviewUsageProvenanceV01 {
  const presentation = deriveContextUseReviewPresentationProvenanceV01(
    input.receipt,
  );
  return {
    provenance_version: CONTEXT_USE_REVIEW_USAGE_PROVENANCE_VERSION_V01,
    presented: presentation.provenance,
    actually_used:
      input.actually_used === "unknown"
        ? { basis: "unknown", source_refs: [] }
        : { basis: "user_declaration", source_refs: [input.request_ref] },
    assessment: {
      basis: "user_declaration",
      source_refs: [input.request_ref],
    },
  };
}

function identityMaterial(
  config: VNextLocalOperatorPilotConfigV01,
  source: ContextUseSourceV01,
) {
  return {
    workspace_id: config.workspace_id,
    project_id: config.project_id,
    prior_packet: {
      packet_version: source.prior_packet.packet_version,
      packet_id: source.prior_packet.packet_id,
      packet_fingerprint: source.prior_packet.integrity.fingerprint,
    },
    later_packet: {
      packet_version: source.later_packet.packet_version,
      packet_id: source.later_packet.packet_id,
      packet_fingerprint: source.later_packet.integrity.fingerprint,
    },
    source_transition_receipt: {
      transition_receipt_version:
        source.transition.receipt.transition_receipt_version,
      transition_receipt_id:
        source.transition.receipt.transition_receipt_id,
      transition_receipt_fingerprint:
        source.transition.receipt.integrity.fingerprint,
    },
    later_task_run_receipt: {
      receipt_version: source.later_receipt.receipt_version,
      receipt_id: source.later_receipt.receipt_id,
      receipt_fingerprint: source.later_receipt.integrity.fingerprint,
    },
    reviewer_ref: {
      ref_version: "external_ref.v0.1" as const,
      ref_type: "local_operator_actor",
      external_id: config.operator_id,
      trust_class: "user_declaration" as const,
      observed_at: source.later_receipt.recorded_at,
      source_ref: source.later_receipt.integrity.fingerprint,
      compatibility_namespace:
        VNEXT_OPERATOR_PILOT_CONTEXT_USE_REVIEW_NAMESPACE_V01,
    },
  };
}

function resolveContextUseSource(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  request: VNextOperatorPilotContextUseReviewRequestV01,
): ContextUseSourceV01 {
  const receiptRecord = readVNextCoreRecordV01(db, {
    record_kind: "run_receipt",
    record_id: request.later_run_receipt_id,
    workspace_id: config.workspace_id,
    project_id: config.project_id,
  });
  if (!receiptRecord) {
    throw reviewError("operator_pilot_context_use_later_receipt_missing", 404);
  }
  if (receiptRecord.fingerprint !== request.later_run_receipt_fingerprint) {
    throw reviewError("operator_pilot_context_use_later_receipt_conflict", 409);
  }
  if (validateRunReceiptV01(receiptRecord.payload).status !== "valid") {
    throw reviewError("operator_pilot_context_use_later_receipt_invalid", 422);
  }
  const laterReceipt = receiptRecord.payload as RunReceiptV01;
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(receiptRecord, {
    workspace_id: laterReceipt.workspace_id,
    project_id: laterReceipt.project_id,
    fingerprint: laterReceipt.integrity.fingerprint,
  });
  if (
    receiptRecord.record_id !== laterReceipt.receipt_id ||
    receiptRecord.created_at !== laterReceipt.recorded_at ||
    receiptRecord.idempotency_key !== laterReceipt.idempotency_key ||
    !laterReceipt.compatibility.source_contracts.includes(
      VNEXT_OPERATOR_PILOT_LATER_RESULT_INTAKE_CONTRACT_V01,
    ) ||
    !laterReceipt.task_context_packet_ref?.source_ref
  ) {
    throw reviewError("operator_pilot_context_use_later_receipt_binding_invalid", 422);
  }
  const laterPacket = loadPacket(
    db,
    config,
    laterReceipt.task_context_packet_ref.external_id,
    laterReceipt.task_context_packet_ref.source_ref,
  );
  const inspection = inspectVNextOperatorPilotPacketLineageV01(db, {
    config,
    packet_id: laterPacket.packet_id,
    packet_fingerprint: laterPacket.integrity.fingerprint,
  });
  if (
    canonicalizeProtocolValueV01(inspection.packet) !==
    canonicalizeProtocolValueV01(laterPacket)
  ) {
    throw reviewError("operator_pilot_context_use_packet_lineage_invalid", 422);
  }
  const priorPacket = loadPacket(
    db,
    config,
    inspection.prior_packet.packet_id,
    inspection.prior_packet.packet_fingerprint,
  );
  const transition = loadValidatedVNextSemanticTransitionRelationV01(db, {
    workspace_id: config.workspace_id,
    project_id: config.project_id,
    transition_receipt_id:
      inspection.source_transition_receipt.transition_receipt_id,
    transition_receipt_fingerprint:
      inspection.source_transition_receipt.transition_receipt_fingerprint,
  });
  const receiptTransitionRefs = laterReceipt.source_refs.filter(
    (ref) =>
      ref.ref_type === "state_transition_receipt" &&
      ref.external_id === transition.receipt.transition_receipt_id &&
      ref.source_ref === transition.receipt.integrity.fingerprint &&
      (ref.trust_class === "direct_local_observation" ||
        ref.trust_class === "verified_external_observation"),
  );
  if (receiptTransitionRefs.length !== 1) {
    throw reviewError("operator_pilot_context_use_full_chain_invalid", 422);
  }
  return {
    later_receipt: laterReceipt,
    later_packet: laterPacket,
    prior_packet: priorPacket,
    transition,
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
  if (!record || record.fingerprint !== packetFingerprint) {
    throw reviewError("operator_pilot_context_use_packet_conflict", 409);
  }
  const packet = record.payload as TaskContextPacketV01;
  if (
    validateTaskContextPacketV01(packet, {
      evaluated_at: packet?.generated_at ?? "",
    }).status !== "valid"
  ) {
    throw reviewError("operator_pilot_context_use_packet_invalid", 422);
  }
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
    workspace_id: packet.workspace_id,
    project_id: packet.project_id,
    fingerprint: packet.integrity.fingerprint,
  });
  if (record.record_id !== packet.packet_id || record.created_at !== packet.generated_at) {
    throw reviewError("operator_pilot_context_use_packet_envelope_invalid", 422);
  }
  return packet;
}

function parseRequest(value: unknown): VNextOperatorPilotContextUseReviewRequestV01 {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw reviewError("operator_pilot_context_use_review_body_invalid");
  }
  const record = value as Record<string, unknown>;
  const allowed = new Set([
    "action",
    "later_run_receipt_id",
    "later_run_receipt_fingerprint",
    "actually_used",
    "assessment",
    "correction_summaries",
    "notes",
    "metrics",
  ]);
  if (
    Object.keys(record).length !== allowed.size ||
    Object.keys(record).some((key) => !allowed.has(key)) ||
    record.action !== "record_context_use_review"
  ) {
    throw reviewError("operator_pilot_context_use_review_body_unknown_field");
  }
  const actuallyUsed = normalizeProtocolTextV01(record.actually_used);
  const assessment = normalizeProtocolTextV01(record.assessment);
  if (
    !CONTEXT_USE_REVIEW_ACTUALLY_USED_VALUES_V01.includes(
      actuallyUsed as ContextUseReviewActuallyUsedV01,
    ) ||
    !CONTEXT_USE_REVIEW_ASSESSMENTS_V01.includes(
      assessment as ContextUseReviewAssessmentV01,
    )
  ) {
    throw reviewError("operator_pilot_context_use_review_value_invalid");
  }
  return {
    action: "record_context_use_review",
    later_run_receipt_id: boundedText(record.later_run_receipt_id, 256),
    later_run_receipt_fingerprint: fingerprint(
      record.later_run_receipt_fingerprint,
    ),
    actually_used: actuallyUsed as ContextUseReviewActuallyUsedV01,
    assessment: assessment as ContextUseReviewAssessmentV01,
    correction_summaries: stringArray(record.correction_summaries),
    notes: stringArray(record.notes),
    metrics: metrics(record.metrics),
  };
}

function metrics(value: unknown): ContextUseReviewV01["metrics"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw reviewError("operator_pilot_context_use_review_metrics_invalid");
  }
  const record = value as Record<string, unknown>;
  const keys = [
    "wrong_context_correction_count",
    "repeated_explanation_estimate",
    "missing_critical_context_count",
    "context_refs_used_count",
  ] as const;
  if (
    Object.keys(record).length !== keys.length ||
    Object.keys(record).some((key) => !keys.includes(key as (typeof keys)[number]))
  ) {
    throw reviewError("operator_pilot_context_use_review_metrics_invalid");
  }
  const metric = (key: (typeof keys)[number]): number | null => {
    const item = record[key];
    if (item === null) return null;
    if (!Number.isSafeInteger(item) || Number(item) < 0) {
      throw reviewError("operator_pilot_context_use_review_metrics_invalid");
    }
    return Number(item);
  };
  return {
    wrong_context_correction_count: metric("wrong_context_correction_count"),
    repeated_explanation_estimate: metric("repeated_explanation_estimate"),
    missing_critical_context_count: metric("missing_critical_context_count"),
    context_refs_used_count: metric("context_refs_used_count"),
  };
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > MAX_ITEMS) {
    throw reviewError("operator_pilot_context_use_review_text_invalid");
  }
  const normalized = uniqueProtocolStringsV01(value);
  if (
    normalized.length !== value.length ||
    normalized.some((item) => !item || item.length > MAX_TEXT)
  ) {
    throw reviewError("operator_pilot_context_use_review_text_invalid");
  }
  return normalized;
}

function boundedText(value: unknown, max: number): string {
  const text = normalizeProtocolTextV01(value);
  if (!text || text.length > max) {
    throw reviewError("operator_pilot_context_use_review_text_invalid");
  }
  return text;
}

function fingerprint(value: unknown): string {
  const text = normalizeProtocolTextV01(value);
  if (!/^sha256:[a-f0-9]{64}$/u.test(text)) {
    throw reviewError("operator_pilot_context_use_review_fingerprint_invalid");
  }
  return text;
}

function result(
  status: "inserted" | "exact_replay",
  review: ContextUseReviewV01,
  admission: VNextLocalOperatorSessionMutationAdmissionV01,
): VNextOperatorPilotContextUseReviewResultV01 {
  return {
    status,
    review,
    semantic_state_changed: false,
    transition_created: false,
    packet_created: false,
    session_admission: admission,
  };
}

function reviewError(code: string, status = 400): never {
  throw new VNextOperatorPilotContextUseReviewErrorV01(code, status);
}
