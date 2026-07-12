import type Database from "better-sqlite3";

import {
  buildContextUseReviewV01,
  validateContextUseReviewRelationsV01,
  validateContextUseReviewV01,
} from "@/lib/vnext/context-use-review";
import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  assertVNextDurableSemanticStoreSchemaV01,
  insertVNextCoreRecordV01,
  readVNextCoreRecordV01,
  type VNextCoreRecordEnvelopeV01,
  type VNextCoreRecordWriteResultV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  normalizeProtocolTextV01,
} from "@/lib/vnext/protocol-primitives";
import {
  validateSemanticTransitionFullChainV01,
} from "@/lib/vnext/state-transition-eligibility";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import {
  admitVNextLocalOperatorMutationInsideTransactionV01,
  authenticateVNextLocalOperatorSessionV01,
  type VNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSecretSourceV01,
  type VNextLocalOperatorSessionCredentialV01,
  type VNextLocalOperatorSessionMutationAdmissionV01,
} from "@/lib/vnext/runtime/local-operator-session";
import {
  loadValidatedVNextSemanticTransitionRelationV01,
  type ValidatedVNextSemanticTransitionRelationV01,
} from "@/lib/vnext/runtime/durable-semantic-transition";
import {
  VNEXT_OPERATOR_PILOT_LATER_RESULT_INTAKE_VERSION_V01,
  readVNextOperatorPilotLaterResultV01,
} from "@/lib/vnext/runtime/operator-pilot-later-result-intake";
import {
  inspectVNextOperatorPilotPacketLineageV01,
} from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import {
  VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
} from "@/lib/vnext/runtime/persisted-semantic-context-compiler";
import type { ContextUseReviewV01 } from "@/types/vnext/context-use-review";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

export const VNEXT_OPERATOR_PILOT_CONTEXT_USE_REVIEW_VERSION_V01 =
  "vnext_operator_pilot_context_use_review.v0.1" as const;

const COMPATIBILITY_NAMESPACE =
  "augnes.vnext.operator-pilot-context-use-review.v0.1";
const LOCAL_SESSION_NAMESPACE = "augnes.vnext.local-operator-session.v0.1";
const MAX_HISTORY = 128;
const MAX_COLLECTION_ITEMS = 128;
const MAX_SUMMARY_CHARACTERS = 2000;
const MAX_METRIC_VALUE = 1_000_000;

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

export interface VNextOperatorPilotContextUseReviewRelationV01 {
  prior_later_transition_exact: true;
  later_result_exact: true;
  reviewer_session_bound: true;
}

export interface VNextOperatorPilotContextUseReviewReadModelV01 {
  review_version: ContextUseReviewV01["review_version"];
  workspace_id: string;
  project_id: string;
  review: ContextUseReviewV01;
  relation: VNextOperatorPilotContextUseReviewRelationV01;
  correction_proposal_created: false;
  semantic_state_mutated: false;
  transition_created: false;
  evidence_accepted: false;
  perspective_mutated: false;
  memory_promoted: false;
  work_closed: false;
  automatic_context_change: false;
}

export interface VNextOperatorPilotContextUseReviewWriteResultV01
  extends VNextOperatorPilotContextUseReviewReadModelV01 {
  status: VNextCoreRecordWriteResultV01["status"];
  session_admission: VNextLocalOperatorSessionMutationAdmissionV01;
}

interface ParsedReviewRequestV01 {
  later_packet_id: string;
  later_packet_fingerprint: string;
  transition_receipt_id: string;
  transition_receipt_fingerprint: string;
  later_task_run_receipt_id: string;
  later_task_run_receipt_fingerprint: string;
  usage: ContextUseReviewV01["usage"];
  assessment: ContextUseReviewV01["assessment"];
  corrections: ContextUseReviewV01["corrections"];
  metrics: ContextUseReviewV01["metrics"];
  notes: string[];
}

interface ReviewRelationMaterialV01 {
  prior_packet: TaskContextPacketV01;
  later_packet: TaskContextPacketV01;
  transition: ValidatedVNextSemanticTransitionRelationV01;
  later_task_run_receipt: RunReceiptV01;
}

export function recordVNextOperatorPilotContextUseReviewV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    credential: VNextLocalOperatorSessionCredentialV01;
    request: unknown;
    clock?: Parameters<typeof authenticateVNextLocalOperatorSessionV01>[1]["clock"];
    secret_source?: VNextLocalOperatorSecretSourceV01;
  },
): VNextOperatorPilotContextUseReviewWriteResultV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  authenticateVNextLocalOperatorSessionV01(db, input);
  const request = parseReviewRequest(input.request);
  resolveReviewRelationMaterial(db, input.config, request);
  if (db.inTransaction) {
    throw reviewError("operator_pilot_context_use_review_nested_transaction", 409);
  }
  db.exec("BEGIN IMMEDIATE");
  try {
    const admission = admitVNextLocalOperatorMutationInsideTransactionV01(
      db,
      input,
    );
    const material = resolveReviewRelationMaterial(
      db,
      input.config,
      request,
    );
    const logicalIdentity = createLogicalIdentity(
      input.config,
      material,
      request,
    );
    const requestFingerprint = createRequestFingerprint(
      input.config,
      material,
      request,
    );
    const existing = findReviewByLogicalIdentity(
      db,
      input.config,
      logicalIdentity,
    );
    if (existing) {
      const persistedRequestFingerprint = readPersistedRequestFingerprint(
        existing.review,
        logicalIdentity,
      );
      if (persistedRequestFingerprint !== requestFingerprint) {
        throw reviewError("operator_pilot_context_use_review_conflict", 409);
      }
      db.exec("COMMIT");
      return {
        ...existing,
        status: "exact_replay",
        session_admission: admission,
      };
    }
    const review = buildRuntimeReview(
      input.config,
      material,
      request,
      logicalIdentity,
      requestFingerprint,
      admission,
    );
    assertReviewRelations(review, material);
    const write = insertVNextCoreRecordV01(db, {
      record_kind: "context_use_review",
      record_id: review.review_id,
      workspace_id: review.workspace_id,
      project_id: review.project_id,
      fingerprint: review.integrity.fingerprint,
      idempotency_key: createLogicalIdempotencyKey(logicalIdentity),
      payload: review,
      created_at: review.reviewed_at,
    });
    if (write.status !== "inserted") {
      throw reviewError(
        "operator_pilot_context_use_review_unexpected_replay",
        409,
      );
    }
    const model = buildReviewReadModel(
      db,
      input.config,
      write.record,
      review,
    );
    db.exec("COMMIT");
    return { ...model, status: "inserted", session_admission: admission };
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  }
}

export function readVNextOperatorPilotContextUseReviewV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    review_id: string;
    review_fingerprint: string;
  },
): VNextOperatorPilotContextUseReviewReadModelV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const reviewId = requiredText(input.review_id, "review_id");
  const fingerprint = sha256(input.review_fingerprint, "review_fingerprint");
  const record = readVNextCoreRecordV01(db, {
    record_kind: "context_use_review",
    record_id: reviewId,
    workspace_id: input.config.workspace_id,
    project_id: input.config.project_id,
  });
  if (!record) {
    throw reviewError("operator_pilot_context_use_review_missing", 404);
  }
  if (record.fingerprint !== fingerprint) {
    throw reviewError(
      "operator_pilot_context_use_review_fingerprint_mismatch",
      409,
    );
  }
  return buildReviewReadModel(
    db,
    input.config,
    record,
    record.payload as ContextUseReviewV01,
  );
}

export function readVNextOperatorPilotContextUseReviewForLaterResultV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    later_task_run_receipt_id: string;
    later_task_run_receipt_fingerprint: string;
  },
): VNextOperatorPilotContextUseReviewReadModelV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const receiptId = requiredText(
    input.later_task_run_receipt_id,
    "later_task_run_receipt_id",
  );
  const receiptFingerprint = sha256(
    input.later_task_run_receipt_fingerprint,
    "later_task_run_receipt_fingerprint",
  );
  const matches = listContextUseReviewRecords(db, input.config)
    .map((record) =>
      buildReviewReadModel(
        db,
        input.config,
        record,
        record.payload as ContextUseReviewV01,
      ),
    )
    .filter(
      (model) =>
        model.review.later_task_run_receipt.receipt_id === receiptId &&
        model.review.later_task_run_receipt.receipt_fingerprint ===
          receiptFingerprint,
    );
  if (matches.length > 1) {
    throw reviewError(
      "operator_pilot_context_use_review_duplicate_relation",
      409,
    );
  }
  const match = matches[0];
  if (!match) {
    throw reviewError("operator_pilot_context_use_review_missing", 404);
  }
  return match;
}

function buildRuntimeReview(
  config: VNextLocalOperatorPilotConfigV01,
  material: ReviewRelationMaterialV01,
  request: ParsedReviewRequestV01,
  logicalIdentity: string,
  requestFingerprint: string,
  admission: VNextLocalOperatorSessionMutationAdmissionV01,
): ContextUseReviewV01 {
  return buildRuntimeReviewForObservedAction(
    config,
    material,
    request,
    logicalIdentity,
    requestFingerprint,
    admission.action_observed_at,
    admission.session.session_id,
  );
}

function buildRuntimeReviewForObservedAction(
  config: VNextLocalOperatorPilotConfigV01,
  material: ReviewRelationMaterialV01,
  request: ParsedReviewRequestV01,
  logicalIdentity: string,
  requestFingerprint: string,
  reviewedAt: string,
  sessionId: string,
): ContextUseReviewV01 {
  const authenticationFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      action: "record_context_use_review",
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      operator_id: config.operator_id,
      session_id: sessionId,
      logical_identity: logicalIdentity,
      request_fingerprint: requestFingerprint,
      observed_at: reviewedAt,
    }),
  );
  const authenticationRef: ExternalRefV01 = {
    ref_version: "external_ref.v0.1",
    ref_type: "local_operator_session_action",
    external_id: sessionId,
    trust_class: "direct_local_observation",
    observed_at: reviewedAt,
    source_ref: authenticationFingerprint,
    compatibility_namespace: LOCAL_SESSION_NAMESPACE,
  };
  const reviewerRef: ExternalRefV01 = {
    ref_version: "external_ref.v0.1",
    ref_type: "local_operator_actor",
    external_id: config.operator_id,
    trust_class: "user_declaration",
    observed_at: reviewedAt,
    source_ref: authenticationFingerprint,
    compatibility_namespace: COMPATIBILITY_NAMESPACE,
  };
  const requestRef: ExternalRefV01 = {
    ref_version: "external_ref.v0.1",
    ref_type: "context_use_review_request",
    external_id: logicalIdentity,
    trust_class: "user_declaration",
    observed_at: reviewedAt,
    source_ref: requestFingerprint,
    compatibility_namespace: COMPATIBILITY_NAMESPACE,
  };
  let review: ContextUseReviewV01;
  try {
    review = buildContextUseReviewV01({
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      prior_packet: {
        packet_version: material.prior_packet.packet_version,
        packet_id: material.prior_packet.packet_id,
        packet_fingerprint: material.prior_packet.integrity.fingerprint,
      },
      later_packet: {
        packet_version: material.later_packet.packet_version,
        packet_id: material.later_packet.packet_id,
        packet_fingerprint: material.later_packet.integrity.fingerprint,
      },
      source_transition_receipt: {
        transition_receipt_version:
          material.transition.receipt.transition_receipt_version,
        transition_receipt_id:
          material.transition.receipt.transition_receipt_id,
        transition_receipt_fingerprint:
          material.transition.receipt.integrity.fingerprint,
      },
      later_task_run_receipt: {
        receipt_version: material.later_task_run_receipt.receipt_version,
        receipt_id: material.later_task_run_receipt.receipt_id,
        receipt_fingerprint:
          material.later_task_run_receipt.integrity.fingerprint,
      },
      reviewer_ref: reviewerRef,
      reviewer_authentication_basis_refs: [authenticationRef],
      reviewed_at: reviewedAt,
      usage: request.usage,
      assessment: request.assessment,
      corrections: request.corrections,
      metrics: request.metrics,
      notes: request.notes,
      compatibility: {
        source_contracts: [
          VNEXT_OPERATOR_PILOT_CONTEXT_USE_REVIEW_VERSION_V01,
          VNEXT_OPERATOR_PILOT_LATER_RESULT_INTAKE_VERSION_V01,
        ],
        unmapped_fields: [],
        warnings: [
          "Local session verification proves possession of a locally issued secret, not external, legal, or operating-system identity.",
          "The review does not create a correction proposal, retract semantic state, accept Evidence, close work, or establish outcome improvement.",
        ],
        external_refs: [requestRef],
      },
      authority_notes: [
        "The runtime derived reviewer identity, authentication basis, relation bindings, and reviewed_at; the caller supplied only bounded assessment material.",
      ],
    });
  } catch {
    throw reviewError("operator_pilot_context_use_review_material_blocked", 422);
  }
  if (validateContextUseReviewV01(review).status !== "valid") {
    throw reviewError("operator_pilot_context_use_review_invalid", 422);
  }
  return review;
}

function resolveReviewRelationMaterial(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  request: Pick<
    ParsedReviewRequestV01,
    | "later_packet_id"
    | "later_packet_fingerprint"
    | "transition_receipt_id"
    | "transition_receipt_fingerprint"
    | "later_task_run_receipt_id"
    | "later_task_run_receipt_fingerprint"
  >,
): ReviewRelationMaterialV01 {
  try {
    return resolveReviewRelationMaterialInternal(db, config, request);
  } catch (error) {
    if (error instanceof VNextOperatorPilotContextUseReviewErrorV01) {
      throw error;
    }
    throw reviewError(
      "operator_pilot_context_use_review_source_relation_invalid",
      422,
    );
  }
}

function resolveReviewRelationMaterialInternal(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  request: Pick<
    ParsedReviewRequestV01,
    | "later_packet_id"
    | "later_packet_fingerprint"
    | "transition_receipt_id"
    | "transition_receipt_fingerprint"
    | "later_task_run_receipt_id"
    | "later_task_run_receipt_fingerprint"
  >,
): ReviewRelationMaterialV01 {
  const laterResult = readVNextOperatorPilotLaterResultV01(db, {
    config,
    receipt_id: request.later_task_run_receipt_id,
    receipt_fingerprint: request.later_task_run_receipt_fingerprint,
  });
  if (
    laterResult.receipt.task_context_packet_ref?.external_id !==
      request.later_packet_id ||
    laterResult.receipt.task_context_packet_ref.source_ref !==
      request.later_packet_fingerprint ||
    laterResult.source_transition_receipt.transition_receipt_id !==
      request.transition_receipt_id ||
    laterResult.source_transition_receipt.transition_receipt_fingerprint !==
      request.transition_receipt_fingerprint
  ) {
    throw reviewError(
      "operator_pilot_context_use_review_later_result_relation_mismatch",
      409,
    );
  }
  const packetInspection = inspectVNextOperatorPilotPacketLineageV01(db, {
    config,
    packet_id: request.later_packet_id,
    packet_fingerprint: request.later_packet_fingerprint,
  });
  if (
    packetInspection.source_transition_receipt.transition_receipt_id !==
      request.transition_receipt_id ||
    packetInspection.source_transition_receipt
      .transition_receipt_fingerprint !==
      request.transition_receipt_fingerprint
  ) {
    throw reviewError(
      "operator_pilot_context_use_review_transition_relation_mismatch",
      409,
    );
  }
  const priorRefs = packetInspection.packet.compatibility.source_refs.filter(
    (ref) =>
      ref.ref_type === "task_context_packet" &&
      ref.compatibility_namespace ===
        VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
  );
  if (priorRefs.length !== 1 || !priorRefs[0]!.source_ref) {
    throw reviewError(
      "operator_pilot_context_use_review_prior_packet_relation_invalid",
      422,
    );
  }
  const priorPacket = loadPacket(
    db,
    config,
    priorRefs[0]!.external_id,
    priorRefs[0]!.source_ref,
  );
  const transition = loadValidatedVNextSemanticTransitionRelationV01(db, {
    workspace_id: config.workspace_id,
    project_id: config.project_id,
    transition_receipt_id: request.transition_receipt_id,
    transition_receipt_fingerprint: request.transition_receipt_fingerprint,
  });
  const fullChain = validateSemanticTransitionFullChainV01({
    ...transition.eligibility_input,
    receipt: transition.receipt,
    prior_packet: priorPacket,
    later_packet: packetInspection.packet,
  });
  if (fullChain.status !== "valid") {
    throw reviewError(
      "operator_pilot_context_use_review_full_chain_invalid",
      422,
    );
  }
  return {
    prior_packet: priorPacket,
    later_packet: packetInspection.packet,
    transition,
    later_task_run_receipt: laterResult.receipt,
  };
}

function assertReviewRelations(
  review: ContextUseReviewV01,
  material: ReviewRelationMaterialV01,
): void {
  const validation = validateContextUseReviewRelationsV01(
    review,
    material.prior_packet,
    material.later_packet,
    material.transition.receipt,
    material.later_task_run_receipt,
  );
  if (validation.status !== "valid") {
    throw reviewError(
      "operator_pilot_context_use_review_relation_invalid",
      422,
    );
  }
}

function buildReviewReadModel(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  record: VNextCoreRecordEnvelopeV01,
  review: ContextUseReviewV01,
): VNextOperatorPilotContextUseReviewReadModelV01 {
  if (validateContextUseReviewV01(review).status !== "valid") {
    throw reviewError("operator_pilot_persisted_context_use_review_invalid", 422);
  }
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
    workspace_id: review.workspace_id,
    project_id: review.project_id,
    fingerprint: review.integrity.fingerprint,
  });
  const logicalIdentity = createLogicalIdentityFromReview(review);
  if (
    review.workspace_id !== config.workspace_id ||
    review.project_id !== config.project_id ||
    record.record_id !== review.review_id ||
    record.created_at !== review.reviewed_at ||
    record.idempotency_key !== createLogicalIdempotencyKey(logicalIdentity)
  ) {
    throw reviewError(
      "operator_pilot_context_use_review_envelope_mismatch",
      422,
    );
  }
  const requestFingerprint = readPersistedRequestFingerprint(
    review,
    logicalIdentity,
  );
  assertReviewerSessionBinding(
    config,
    review,
    logicalIdentity,
    requestFingerprint,
  );
  const material = resolveReviewRelationMaterial(db, config, {
    later_packet_id: review.later_packet.packet_id,
    later_packet_fingerprint: review.later_packet.packet_fingerprint,
    transition_receipt_id:
      review.source_transition_receipt.transition_receipt_id,
    transition_receipt_fingerprint:
      review.source_transition_receipt.transition_receipt_fingerprint,
    later_task_run_receipt_id: review.later_task_run_receipt.receipt_id,
    later_task_run_receipt_fingerprint:
      review.later_task_run_receipt.receipt_fingerprint,
  });
  assertReviewRelations(review, material);
  if (
    requestFingerprint !==
    createRequestFingerprintFromReview(config, material, review)
  ) {
    throw reviewError(
      "operator_pilot_context_use_review_request_fingerprint_mismatch",
      422,
    );
  }
  const expectedReview = buildRuntimeReviewForObservedAction(
    config,
    material,
    requestFromReview(review),
    logicalIdentity,
    requestFingerprint,
    review.reviewed_at,
    review.reviewer_authentication_basis_refs[0]!.external_id,
  );
  if (
    canonicalizeProtocolValueV01(expectedReview) !==
    canonicalizeProtocolValueV01(review)
  ) {
    throw reviewError(
      "operator_pilot_context_use_review_runtime_shape_mismatch",
      422,
    );
  }
  return {
    review_version: review.review_version,
    workspace_id: review.workspace_id,
    project_id: review.project_id,
    review,
    relation: {
      prior_later_transition_exact: true,
      later_result_exact: true,
      reviewer_session_bound: true,
    },
    correction_proposal_created: false,
    semantic_state_mutated: false,
    transition_created: false,
    evidence_accepted: false,
    perspective_mutated: false,
    memory_promoted: false,
    work_closed: false,
    automatic_context_change: false,
  };
}

function assertReviewerSessionBinding(
  config: VNextLocalOperatorPilotConfigV01,
  review: ContextUseReviewV01,
  logicalIdentity: string,
  requestFingerprint: string,
): void {
  const basis = review.reviewer_authentication_basis_refs;
  if (
    review.reviewer_ref.ref_type !== "local_operator_actor" ||
    review.reviewer_ref.external_id !== config.operator_id ||
    review.reviewer_ref.trust_class !== "user_declaration" ||
    review.reviewer_ref.compatibility_namespace !== COMPATIBILITY_NAMESPACE ||
    review.reviewer_ref.observed_at !== review.reviewed_at ||
    basis.length !== 1 ||
    basis[0]!.ref_type !== "local_operator_session_action" ||
    basis[0]!.trust_class !== "direct_local_observation" ||
    basis[0]!.compatibility_namespace !== LOCAL_SESSION_NAMESPACE ||
    basis[0]!.observed_at !== review.reviewed_at ||
    review.reviewer_ref.source_ref !== basis[0]!.source_ref
  ) {
    throw reviewError(
      "operator_pilot_context_use_review_reviewer_binding_invalid",
      422,
    );
  }
  const expectedFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      action: "record_context_use_review",
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      operator_id: config.operator_id,
      session_id: basis[0]!.external_id,
      logical_identity: logicalIdentity,
      request_fingerprint: requestFingerprint,
      observed_at: review.reviewed_at,
    }),
  );
  if (basis[0]!.source_ref !== expectedFingerprint) {
    throw reviewError(
      "operator_pilot_context_use_review_authentication_basis_invalid",
      422,
    );
  }
}

function findReviewByLogicalIdentity(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  logicalIdentity: string,
): VNextOperatorPilotContextUseReviewReadModelV01 | null {
  const matches = listContextUseReviewRecords(db, config)
    .map((record) =>
      buildReviewReadModel(
        db,
        config,
        record,
        record.payload as ContextUseReviewV01,
      ),
    )
    .filter(
      (model) => createLogicalIdentityFromReview(model.review) === logicalIdentity,
    );
  if (matches.length > 1) {
    throw reviewError(
      "operator_pilot_context_use_review_duplicate_identity",
      409,
    );
  }
  return matches[0] ?? null;
}

function listContextUseReviewRecords(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
): VNextCoreRecordEnvelopeV01[] {
  const rows = db
    .prepare(
      `SELECT record_id FROM vnext_core_records
       WHERE workspace_id = ? AND project_id = ?
         AND record_kind = 'context_use_review'
       ORDER BY created_at, record_id LIMIT ?`,
    )
    .all(config.workspace_id, config.project_id, MAX_HISTORY + 1) as Array<{
    record_id: string;
  }>;
  if (rows.length > MAX_HISTORY) {
    throw reviewError(
      "operator_pilot_context_use_review_history_bound_exceeded",
      422,
    );
  }
  return rows.map((row) => {
    const record = readVNextCoreRecordV01(db, {
      record_kind: "context_use_review",
      record_id: row.record_id,
      workspace_id: config.workspace_id,
      project_id: config.project_id,
    });
    if (!record) {
      throw reviewError("operator_pilot_context_use_review_missing", 404);
    }
    return record;
  });
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
  if (!record) {
    throw reviewError("operator_pilot_context_use_review_prior_packet_missing", 404);
  }
  if (record.fingerprint !== packetFingerprint) {
    throw reviewError(
      "operator_pilot_context_use_review_prior_packet_fingerprint_mismatch",
      409,
    );
  }
  const packet = record.payload as TaskContextPacketV01;
  if (
    validateTaskContextPacketV01(packet, {
      evaluated_at: packet?.generated_at ?? "",
    }).status !== "valid"
  ) {
    throw reviewError(
      "operator_pilot_context_use_review_prior_packet_invalid",
      422,
    );
  }
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
    workspace_id: packet.workspace_id,
    project_id: packet.project_id,
    fingerprint: packet.integrity.fingerprint,
  });
  if (
    record.record_id !== packet.packet_id ||
    record.created_at !== packet.generated_at ||
    record.idempotency_key !== null
  ) {
    throw reviewError(
      "operator_pilot_context_use_review_prior_packet_envelope_mismatch",
      422,
    );
  }
  return packet;
}

function createLogicalIdentity(
  config: VNextLocalOperatorPilotConfigV01,
  material: ReviewRelationMaterialV01,
  request: ParsedReviewRequestV01,
): string {
  return logicalIdentityFor({
    workspace_id: config.workspace_id,
    project_id: config.project_id,
    prior_packet_id: material.prior_packet.packet_id,
    prior_packet_fingerprint: material.prior_packet.integrity.fingerprint,
    later_packet_id: request.later_packet_id,
    later_packet_fingerprint: request.later_packet_fingerprint,
    transition_receipt_id: request.transition_receipt_id,
    transition_receipt_fingerprint: request.transition_receipt_fingerprint,
    later_task_run_receipt_id: request.later_task_run_receipt_id,
    later_task_run_receipt_fingerprint:
      request.later_task_run_receipt_fingerprint,
    reviewer_id: config.operator_id,
  });
}

function createLogicalIdentityFromReview(review: ContextUseReviewV01): string {
  return logicalIdentityFor({
    workspace_id: review.workspace_id,
    project_id: review.project_id,
    prior_packet_id: review.prior_packet.packet_id,
    prior_packet_fingerprint: review.prior_packet.packet_fingerprint,
    later_packet_id: review.later_packet.packet_id,
    later_packet_fingerprint: review.later_packet.packet_fingerprint,
    transition_receipt_id:
      review.source_transition_receipt.transition_receipt_id,
    transition_receipt_fingerprint:
      review.source_transition_receipt.transition_receipt_fingerprint,
    later_task_run_receipt_id: review.later_task_run_receipt.receipt_id,
    later_task_run_receipt_fingerprint:
      review.later_task_run_receipt.receipt_fingerprint,
    reviewer_id: review.reviewer_ref.external_id,
  });
}

function logicalIdentityFor(value: Record<string, string>): string {
  const hash = createProtocolSha256V01(canonicalizeProtocolValueV01(value));
  return `context-use-review-logical:${hash.slice(7, 39)}`;
}

function createLogicalIdempotencyKey(logicalIdentity: string): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({ logical_identity: logicalIdentity }),
  );
}

function createRequestFingerprint(
  config: VNextLocalOperatorPilotConfigV01,
  material: ReviewRelationMaterialV01,
  request: ParsedReviewRequestV01,
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      prior_packet_id: material.prior_packet.packet_id,
      prior_packet_fingerprint: material.prior_packet.integrity.fingerprint,
      later_packet_id: request.later_packet_id,
      later_packet_fingerprint: request.later_packet_fingerprint,
      transition_receipt_id: request.transition_receipt_id,
      transition_receipt_fingerprint: request.transition_receipt_fingerprint,
      later_task_run_receipt_id: request.later_task_run_receipt_id,
      later_task_run_receipt_fingerprint:
        request.later_task_run_receipt_fingerprint,
      reviewer_id: config.operator_id,
      usage: request.usage,
      assessment: request.assessment,
      corrections: request.corrections,
      metrics: request.metrics,
      notes: request.notes,
    }),
  );
}

function createRequestFingerprintFromReview(
  config: VNextLocalOperatorPilotConfigV01,
  material: ReviewRelationMaterialV01,
  review: ContextUseReviewV01,
): string {
  return createRequestFingerprint(config, material, requestFromReview(review));
}

function requestFromReview(
  review: ContextUseReviewV01,
): ParsedReviewRequestV01 {
  return {
    later_packet_id: review.later_packet.packet_id,
    later_packet_fingerprint: review.later_packet.packet_fingerprint,
    transition_receipt_id:
      review.source_transition_receipt.transition_receipt_id,
    transition_receipt_fingerprint:
      review.source_transition_receipt.transition_receipt_fingerprint,
    later_task_run_receipt_id: review.later_task_run_receipt.receipt_id,
    later_task_run_receipt_fingerprint:
      review.later_task_run_receipt.receipt_fingerprint,
    usage: review.usage,
    assessment: review.assessment,
    corrections: review.corrections,
    metrics: review.metrics,
    notes: review.notes,
  };
}

function readPersistedRequestFingerprint(
  review: ContextUseReviewV01,
  logicalIdentity: string,
): string {
  const refs = review.compatibility.external_refs.filter(
    (ref) =>
      ref.ref_type === "context_use_review_request" &&
      ref.compatibility_namespace === COMPATIBILITY_NAMESPACE,
  );
  if (
    refs.length !== 1 ||
    refs[0]!.external_id !== logicalIdentity ||
    refs[0]!.trust_class !== "user_declaration" ||
    refs[0]!.observed_at !== review.reviewed_at ||
    !refs[0]!.source_ref
  ) {
    throw reviewError(
      "operator_pilot_context_use_review_request_binding_invalid",
      422,
    );
  }
  return refs[0]!.source_ref;
}

function parseReviewRequest(value: unknown): ParsedReviewRequestV01 {
  const record = strictRecord(value, "body");
  const allowed = new Set([
    "later_packet_id",
    "later_packet_fingerprint",
    "transition_receipt_id",
    "transition_receipt_fingerprint",
    "later_task_run_receipt_id",
    "later_task_run_receipt_fingerprint",
    "usage",
    "assessment",
    "corrections",
    "metrics",
    "notes",
  ]);
  assertExactKeys(record, allowed, "body");
  const usage = strictRecord(record.usage, "usage");
  assertExactKeys(usage, new Set(["presented", "actually_used"]), "usage");
  const presented = enumValue(usage.presented, ["yes", "no", "unknown"], "presented");
  const actuallyUsed = enumValue(
    usage.actually_used,
    ["yes", "partial", "no", "unknown"],
    "actually_used",
  );
  const corrections = strictRecord(record.corrections, "corrections");
  assertExactKeys(
    corrections,
    new Set(["correction_count", "summaries"]),
    "corrections",
  );
  const summaries = boundedStrings(corrections.summaries, "correction_summaries");
  const correctionCount = boundedInteger(
    corrections.correction_count,
    "correction_count",
    false,
  )!;
  if (correctionCount !== summaries.length) {
    throw reviewError("operator_pilot_correction_count_mismatch");
  }
  const metrics = strictRecord(record.metrics, "metrics");
  const metricKeys = new Set([
    "wrong_context_correction_count",
    "repeated_explanation_estimate",
    "missing_critical_context_count",
    "context_refs_used_count",
  ]);
  assertExactKeys(metrics, metricKeys, "metrics");
  const assessment = enumValue(
    record.assessment,
    ["helpful", "stale", "misleading", "missing", "noisy", "not_applicable"],
    "assessment",
  );
  const parsedMetrics: ContextUseReviewV01["metrics"] = {
    wrong_context_correction_count: boundedInteger(
      metrics.wrong_context_correction_count,
      "wrong_context_correction_count",
      true,
    ),
    repeated_explanation_estimate: boundedInteger(
      metrics.repeated_explanation_estimate,
      "repeated_explanation_estimate",
      true,
    ),
    missing_critical_context_count: boundedInteger(
      metrics.missing_critical_context_count,
      "missing_critical_context_count",
      true,
    ),
    context_refs_used_count: boundedInteger(
      metrics.context_refs_used_count,
      "context_refs_used_count",
      true,
    ),
  };
  if (
    (actuallyUsed === "yes" || actuallyUsed === "partial") &&
    presented !== "yes"
  ) {
    throw reviewError("operator_pilot_context_use_review_use_without_presentation");
  }
  if (
    assessment === "helpful" &&
    actuallyUsed !== "yes" &&
    actuallyUsed !== "partial"
  ) {
    throw reviewError("operator_pilot_context_use_review_helpful_without_use");
  }
  if (
    (parsedMetrics.context_refs_used_count ?? 0) > 0 &&
    actuallyUsed !== "yes" &&
    actuallyUsed !== "partial"
  ) {
    throw reviewError(
      "operator_pilot_context_use_review_context_refs_used_without_use",
    );
  }
  return {
    later_packet_id: requiredText(record.later_packet_id, "later_packet_id"),
    later_packet_fingerprint: sha256(
      record.later_packet_fingerprint,
      "later_packet_fingerprint",
    ),
    transition_receipt_id: requiredText(
      record.transition_receipt_id,
      "transition_receipt_id",
    ),
    transition_receipt_fingerprint: sha256(
      record.transition_receipt_fingerprint,
      "transition_receipt_fingerprint",
    ),
    later_task_run_receipt_id: requiredText(
      record.later_task_run_receipt_id,
      "later_task_run_receipt_id",
    ),
    later_task_run_receipt_fingerprint: sha256(
      record.later_task_run_receipt_fingerprint,
      "later_task_run_receipt_fingerprint",
    ),
    usage: { presented, actually_used: actuallyUsed },
    assessment,
    corrections: { correction_count: correctionCount, summaries },
    metrics: parsedMetrics,
    notes: boundedStrings(record.notes, "notes"),
  };
}

function strictRecord(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw reviewError(`operator_pilot_context_use_review_${field}_invalid`);
  }
  return value as Record<string, unknown>;
}

function assertExactKeys(
  record: Record<string, unknown>,
  allowed: Set<string>,
  field: string,
): void {
  const keys = Object.keys(record);
  if (
    keys.length !== allowed.size ||
    keys.some((key) => !allowed.has(key))
  ) {
    throw reviewError(
      `operator_pilot_context_use_review_${field}_unknown_field`,
    );
  }
}

function requiredText(value: unknown, field: string, max = 256): string {
  const text = normalizeProtocolTextV01(value);
  if (!text || text !== value || text.length > max) {
    throw reviewError(`operator_pilot_context_use_review_${field}_invalid`);
  }
  return text;
}

function sha256(value: unknown, field: string): string {
  const text = requiredText(value, field);
  if (!/^sha256:[a-f0-9]{64}$/.test(text)) {
    throw reviewError(`operator_pilot_context_use_review_${field}_invalid`);
  }
  return text;
}

function enumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
): T {
  const text = requiredText(value, field);
  if (!allowed.includes(text as T)) {
    throw reviewError(`operator_pilot_context_use_review_${field}_invalid`);
  }
  return text as T;
}

function boundedStrings(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length > MAX_COLLECTION_ITEMS) {
    throw reviewError(`operator_pilot_context_use_review_${field}_invalid`);
  }
  const strings = value.map((item) =>
    requiredText(item, field, MAX_SUMMARY_CHARACTERS),
  );
  const normalized = [...new Set(strings)].sort();
  if (normalized.length !== strings.length) {
    throw reviewError(`operator_pilot_context_use_review_${field}_duplicate`);
  }
  return normalized;
}

function boundedInteger(
  value: unknown,
  field: string,
  nullable: boolean,
): number | null {
  if (nullable && value === null) return null;
  if (
    !Number.isInteger(value) ||
    (value as number) < 0 ||
    (value as number) > MAX_METRIC_VALUE
  ) {
    throw reviewError(`operator_pilot_context_use_review_${field}_invalid`);
  }
  return value as number;
}

function reviewError(code: string, status = 400) {
  return new VNextOperatorPilotContextUseReviewErrorV01(code, status);
}
