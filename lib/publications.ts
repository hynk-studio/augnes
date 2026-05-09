import { randomUUID } from "node:crypto";
import {
  appendCoordinationEvent,
  getCoordinationEvent,
} from "@/lib/coordination-events";
import { openDatabase } from "@/lib/db";
import { getWorkItem, normalizeScope, normalizeWorkId } from "@/lib/work";

const DEFAULT_PUBLICATION_LIMIT = 50;
const DEFAULT_DELIVERY_LIMIT = 50;
const MAX_PUBLICATION_LIMIT = 200;
const MAX_DELIVERY_LIMIT = 200;
const TARGET_SURFACE_PATTERN = /^[a-z][a-z0-9_:-]{1,63}$/;

export const PUBLICATION_STATUSES = [
  "draft",
  "approved",
  "sent",
  "failed",
  "cancelled",
] as const;

export const DELIVERY_STATUSES = [
  "pending",
  "sent",
  "failed",
  "acknowledged",
] as const;

export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export type PublicationDraft = {
  publication_id: string;
  scope: string;
  work_id: string | null;
  source_event_id: string | null;
  target_surface: string;
  target_ref: string;
  status: PublicationStatus | string;
  preview_body: string;
  created_by: string;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
};

export type DeliveryRecord = {
  delivery_id: string;
  publication_id: string;
  scope: string;
  target_surface: string;
  target_ref: string;
  status: DeliveryStatus | string;
  sent_at: string | null;
  acknowledged_at: string | null;
  error_message: string | null;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicationDraftInput = {
  publication_id?: string;
  scope?: string | null;
  work_id?: string | null;
  source_event_id?: string | null;
  target_surface: string;
  target_ref: string;
  status?: PublicationStatus;
  preview_body: string;
  created_by: string;
  approved_by?: string | null;
  created_at?: string;
  sent_at?: string | null;
};

export type PublicationStatusUpdateInput = {
  publicationId: string;
  scope?: string | null;
  status: PublicationStatus;
  approved_by?: string | null;
  sent_at?: string | null;
};

export type DeliveryRecordInput = {
  delivery_id?: string;
  publication_id: string;
  scope?: string | null;
  target_surface?: string | null;
  target_ref?: string | null;
  status?: DeliveryStatus;
  sent_at?: string | null;
  acknowledged_at?: string | null;
  error_message?: string | null;
  idempotency_key?: string | null;
  created_at?: string;
};

export type DeliveryStatusUpdateInput = {
  deliveryId: string;
  scope?: string | null;
  status: DeliveryStatus;
  sent_at?: string | null;
  acknowledged_at?: string | null;
  error_message?: string | null;
};

export type DeliveryCreateResult = {
  delivery: DeliveryRecord;
  created: boolean;
  idempotent_replay: boolean;
};

type PublicationDraftRow = PublicationDraft;
type DeliveryRecordRow = DeliveryRecord;

export class PublicationNotFoundError extends Error {
  constructor(publicationId: string, scope: string | null) {
    super(
      scope
        ? `Unknown publication_id ${publicationId} for scope ${scope}.`
        : `Unknown publication_id ${publicationId}.`,
    );
    this.name = "PublicationNotFoundError";
  }
}

export class DeliveryNotFoundError extends Error {
  constructor(deliveryId: string, scope: string | null) {
    super(
      scope
        ? `Unknown delivery_id ${deliveryId} for scope ${scope}.`
        : `Unknown delivery_id ${deliveryId}.`,
    );
    this.name = "DeliveryNotFoundError";
  }
}

export class PublicationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicationValidationError";
  }
}

export function listPublications({
  scope,
  workId,
  status,
  targetSurface,
  limit = DEFAULT_PUBLICATION_LIMIT,
}: {
  scope?: string | null;
  workId?: string | null;
  status?: PublicationStatus | null;
  targetSurface?: string | null;
  limit?: number;
}) {
  const normalizedScope = normalizeScope(scope);
  const clauses = ["scope = ?"];
  const params: Array<string | number> = [normalizedScope];

  if (workId) {
    clauses.push("work_id = ?");
    params.push(normalizeWorkId(workId));
  }

  if (status) {
    assertPublicationStatus(status);
    clauses.push("status = ?");
    params.push(status);
  }

  const cleanTargetSurface = cleanNullableString(targetSurface);
  if (cleanTargetSurface) {
    assertTargetSurface(cleanTargetSurface);
    clauses.push("target_surface = ?");
    params.push(cleanTargetSurface);
  }

  params.push(
    normalizeLimit(limit, DEFAULT_PUBLICATION_LIMIT, MAX_PUBLICATION_LIMIT),
  );
  const db = openDatabase();

  try {
    const rows = db
      .prepare(
        `
          SELECT
            publication_id,
            scope,
            work_id,
            source_event_id,
            target_surface,
            target_ref,
            status,
            preview_body,
            created_by,
            approved_by,
            created_at,
            updated_at,
            sent_at
          FROM publication_drafts
          WHERE ${clauses.join(" AND ")}
          ORDER BY created_at DESC, publication_id ASC
          LIMIT ?
        `,
      )
      .all(...params) as PublicationDraftRow[];

    return rows.map(parsePublicationDraftRow);
  } finally {
    db.close();
  }
}

export function getPublication(publicationId: string, scope?: string | null) {
  const normalizedScope = scope ? normalizeScope(scope) : null;
  const db = openDatabase();

  try {
    const row = selectPublicationByIdOrNull(
      db,
      normalizePublicationId(publicationId),
      normalizedScope,
    );

    return row ? parsePublicationDraftRow(row) : null;
  } finally {
    db.close();
  }
}

export function createPublication(input: PublicationDraftInput) {
  const now = input.created_at ?? new Date().toISOString();
  const scope = normalizeScope(input.scope);
  const workId = input.work_id ? normalizeWorkId(input.work_id) : null;
  const sourceEventId = cleanNullableString(input.source_event_id);
  const status = input.status ?? "draft";
  const approvedBy = cleanNullableString(input.approved_by);
  const sentAt = cleanNullableString(input.sent_at);
  const row = {
    publication_id:
      cleanNullableString(input.publication_id) ?? `publication:${randomUUID()}`,
    scope,
    work_id: workId,
    source_event_id: sourceEventId,
    target_surface: normalizeTargetSurface(input.target_surface),
    target_ref: requireNonEmptyString(input.target_ref, "target_ref"),
    status,
    preview_body: requireNonEmptyString(input.preview_body, "preview_body"),
    created_by: requireNonEmptyString(input.created_by, "created_by"),
    approved_by: approvedBy,
    created_at: now,
    updated_at: now,
    sent_at: sentAt ?? (status === "sent" ? now : null),
  };

  assertPublicationId(row.publication_id);
  assertPublicationStatus(row.status);
  validatePublicationCreateMetadata(row.status, row.approved_by, row.sent_at);
  validatePublicationReferences({ scope, workId, sourceEventId });

  const db = openDatabase();
  let publication: PublicationDraft;

  try {
    publication = db.transaction(() => {
      db.prepare(
        `
          INSERT INTO publication_drafts (
            publication_id,
            scope,
            work_id,
            source_event_id,
            target_surface,
            target_ref,
            status,
            preview_body,
            created_by,
            approved_by,
            created_at,
            updated_at,
            sent_at
          )
          VALUES (
            @publication_id,
            @scope,
            @work_id,
            @source_event_id,
            @target_surface,
            @target_ref,
            @status,
            @preview_body,
            @created_by,
            @approved_by,
            @created_at,
            @updated_at,
            @sent_at
          )
        `,
      ).run(row);

      return selectPublicationById(db, row.publication_id);
    })();
  } finally {
    db.close();
  }

  appendPublicationDraftCreatedEvent(publication);

  return publication;
}

export function updatePublicationStatus(input: PublicationStatusUpdateInput) {
  assertPublicationStatus(input.status);
  const normalizedScope = input.scope ? normalizeScope(input.scope) : null;
  const publicationId = normalizePublicationId(input.publicationId);
  const now = new Date().toISOString();
  const approvedBy = cleanNullableString(input.approved_by);
  const sentAt = cleanNullableString(input.sent_at);
  validatePublicationStatusUpdateMetadata(input.status, approvedBy, sentAt);

  const db = openDatabase();
  let publication: PublicationDraft;

  try {
    publication = db.transaction(() => {
      selectPublicationById(db, publicationId, normalizedScope);

      const params = [
        input.status,
        now,
        input.status,
        approvedBy,
        approvedBy,
        input.status,
        sentAt,
        now,
        publicationId,
      ];
      if (normalizedScope) {
        params.push(normalizedScope);
      }

      db.prepare(
        `
          UPDATE publication_drafts
          SET
            status = ?,
            updated_at = ?,
            approved_by = CASE
              WHEN ? = 'approved' AND ? IS NOT NULL THEN ?
              ELSE approved_by
            END,
            sent_at = CASE
              WHEN ? = 'sent' AND sent_at IS NULL THEN COALESCE(?, ?)
              ELSE sent_at
            END
          WHERE publication_id = ?
            ${normalizedScope ? "AND scope = ?" : ""}
        `,
      ).run(...params);

      return selectPublicationById(db, publicationId, normalizedScope);
    })();
  } finally {
    db.close();
  }

  return publication;
}

export function listDeliveries({
  scope,
  publicationId,
  status,
  targetSurface,
  limit = DEFAULT_DELIVERY_LIMIT,
}: {
  scope?: string | null;
  publicationId?: string | null;
  status?: DeliveryStatus | null;
  targetSurface?: string | null;
  limit?: number;
}) {
  const normalizedScope = normalizeScope(scope);
  const clauses = ["scope = ?"];
  const params: Array<string | number> = [normalizedScope];

  if (publicationId) {
    clauses.push("publication_id = ?");
    params.push(normalizePublicationId(publicationId));
  }

  if (status) {
    assertDeliveryStatus(status);
    clauses.push("status = ?");
    params.push(status);
  }

  const cleanTargetSurface = cleanNullableString(targetSurface);
  if (cleanTargetSurface) {
    assertTargetSurface(cleanTargetSurface);
    clauses.push("target_surface = ?");
    params.push(cleanTargetSurface);
  }

  params.push(normalizeLimit(limit, DEFAULT_DELIVERY_LIMIT, MAX_DELIVERY_LIMIT));
  const db = openDatabase();

  try {
    const rows = db
      .prepare(
        `
          SELECT
            delivery_id,
            publication_id,
            scope,
            target_surface,
            target_ref,
            status,
            sent_at,
            acknowledged_at,
            error_message,
            idempotency_key,
            created_at,
            updated_at
          FROM delivery_ledger
          WHERE ${clauses.join(" AND ")}
          ORDER BY created_at DESC, delivery_id ASC
          LIMIT ?
        `,
      )
      .all(...params) as DeliveryRecordRow[];

    return rows.map(parseDeliveryRecordRow);
  } finally {
    db.close();
  }
}

export function getDelivery(deliveryId: string, scope?: string | null) {
  const normalizedScope = scope ? normalizeScope(scope) : null;
  const db = openDatabase();

  try {
    const row = selectDeliveryByIdOrNull(
      db,
      normalizeDeliveryId(deliveryId),
      normalizedScope,
    );

    return row ? parseDeliveryRecordRow(row) : null;
  } finally {
    db.close();
  }
}

export function createDelivery(input: DeliveryRecordInput): DeliveryCreateResult {
  const now = input.created_at ?? new Date().toISOString();
  const publicationId = normalizePublicationId(input.publication_id);
  const status = input.status ?? "pending";
  assertDeliveryStatus(status);

  const publication = requirePublicationForDelivery(publicationId, input.scope);
  const targetSurface = normalizeTargetSurface(
    input.target_surface ?? publication.target_surface,
  );
  const targetRef = requireNonEmptyString(
    input.target_ref ?? publication.target_ref,
    "target_ref",
  );
  const idempotencyKey = cleanNullableString(input.idempotency_key);
  const existing = idempotencyKey
    ? getDeliveryByIdempotencyKey({
        publicationId,
        targetSurface,
        targetRef,
        idempotencyKey,
      })
    : null;

  if (existing) {
    return {
      delivery: existing,
      created: false,
      idempotent_replay: true,
    };
  }

  const sentAt = cleanNullableString(input.sent_at);
  const acknowledgedAt = cleanNullableString(input.acknowledged_at);
  const row = {
    delivery_id:
      cleanNullableString(input.delivery_id) ?? `delivery:${randomUUID()}`,
    publication_id: publicationId,
    scope: publication.scope,
    target_surface: targetSurface,
    target_ref: targetRef,
    status,
    sent_at:
      sentAt ?? (status === "sent" || status === "acknowledged" ? now : null),
    acknowledged_at: acknowledgedAt ?? (status === "acknowledged" ? now : null),
    error_message: cleanNullableString(input.error_message),
    idempotency_key: idempotencyKey,
    created_at: now,
    updated_at: now,
  };

  assertDeliveryId(row.delivery_id);
  validateDeliveryStatusMetadata({
    status: row.status,
    sentAt: row.sent_at,
    acknowledgedAt: row.acknowledged_at,
    errorMessage: row.error_message,
    existingErrorMessage: null,
  });

  const db = openDatabase();
  let delivery: DeliveryRecord;

  try {
    delivery = db.transaction(() => {
      db.prepare(
        `
          INSERT INTO delivery_ledger (
            delivery_id,
            publication_id,
            scope,
            target_surface,
            target_ref,
            status,
            sent_at,
            acknowledged_at,
            error_message,
            idempotency_key,
            created_at,
            updated_at
          )
          VALUES (
            @delivery_id,
            @publication_id,
            @scope,
            @target_surface,
            @target_ref,
            @status,
            @sent_at,
            @acknowledged_at,
            @error_message,
            @idempotency_key,
            @created_at,
            @updated_at
          )
        `,
      ).run(row);

      return selectDeliveryById(db, row.delivery_id);
    })();
  } finally {
    db.close();
  }

  appendDeliveryStatusEvent(delivery, delivery.created_at);

  return {
    delivery,
    created: true,
    idempotent_replay: false,
  };
}

export function updateDeliveryStatus(input: DeliveryStatusUpdateInput) {
  assertDeliveryStatus(input.status);
  const normalizedScope = input.scope ? normalizeScope(input.scope) : null;
  const deliveryId = normalizeDeliveryId(input.deliveryId);
  const now = new Date().toISOString();
  const sentAt = cleanNullableString(input.sent_at);
  const acknowledgedAt = cleanNullableString(input.acknowledged_at);
  const errorMessage = cleanNullableString(input.error_message);

  const db = openDatabase();
  let previousStatus = "";
  let delivery: DeliveryRecord;

  try {
    delivery = db.transaction(() => {
      const existing = selectDeliveryById(db, deliveryId, normalizedScope);
      previousStatus = existing.status;
      validateDeliveryStatusMetadata({
        status: input.status,
        sentAt,
        acknowledgedAt,
        errorMessage,
        existingErrorMessage: existing.error_message,
      });

      const params = [
        input.status,
        now,
        input.status,
        sentAt,
        now,
        input.status,
        acknowledgedAt,
        now,
        input.status,
        errorMessage,
        deliveryId,
      ];
      if (normalizedScope) {
        params.push(normalizedScope);
      }

      db.prepare(
        `
          UPDATE delivery_ledger
          SET
            status = ?,
            updated_at = ?,
            sent_at = CASE
              WHEN ? IN ('sent', 'acknowledged') AND sent_at IS NULL THEN COALESCE(?, ?)
              ELSE sent_at
            END,
            acknowledged_at = CASE
              WHEN ? = 'acknowledged' AND acknowledged_at IS NULL THEN COALESCE(?, ?)
              ELSE acknowledged_at
            END,
            error_message = CASE
              WHEN ? = 'failed' THEN COALESCE(?, error_message)
              ELSE error_message
            END
          WHERE delivery_id = ?
            ${normalizedScope ? "AND scope = ?" : ""}
        `,
      ).run(...params);

      return selectDeliveryById(db, deliveryId, normalizedScope);
    })();
  } finally {
    db.close();
  }

  if (previousStatus !== delivery.status) {
    appendDeliveryStatusEvent(delivery, now);
  }

  return delivery;
}

function appendPublicationDraftCreatedEvent(publication: PublicationDraft) {
  return appendCoordinationEvent({
    event_id: `event:${publication.publication_id}:draft_created`,
    event_type: "publication_draft_created",
    scope: publication.scope,
    work_id: publication.work_id,
    actor: publication.created_by,
    target: `${publication.target_surface}:${publication.target_ref}`,
    source_surface: "local_runtime",
    authority_level: "publication_notice",
    state_keys: ["coordination.publication", "coordination.event_spine"],
    causal_parent_id: publication.source_event_id,
    payload_ref: publication.publication_id,
    result_status: publication.status,
    created_at: publication.created_at,
  });
}

function appendDeliveryStatusEvent(delivery: DeliveryRecord, createdAt: string) {
  if (delivery.status === "sent") {
    appendDeliveryEvent(delivery, "publication_sent", createdAt);
  } else if (delivery.status === "failed") {
    appendDeliveryEvent(delivery, "publication_failed", createdAt);
  } else if (delivery.status === "acknowledged") {
    appendDeliveryEvent(delivery, "publication_acknowledged", createdAt);
  }
}

function appendDeliveryEvent(
  delivery: DeliveryRecord,
  eventType:
    | "publication_sent"
    | "publication_failed"
    | "publication_acknowledged",
  createdAt: string,
) {
  const suffix = eventType.replace("publication_", "");

  return appendCoordinationEvent({
    event_id: `event:${delivery.delivery_id}:${suffix}:${randomUUID()}`,
    event_type: eventType,
    scope: delivery.scope,
    work_id:
      getPublication(delivery.publication_id, delivery.scope)?.work_id ?? null,
    actor: "augnes_runtime",
    target: `${delivery.target_surface}:${delivery.target_ref}`,
    source_surface: "local_runtime",
    authority_level:
      eventType === "publication_acknowledged"
        ? "acknowledged_notice"
        : "publication_notice",
    state_keys: ["coordination.delivery_ledger", "coordination.event_spine"],
    payload_ref: delivery.delivery_id,
    result_status: delivery.status,
    created_at: createdAt,
  });
}

function validatePublicationReferences({
  scope,
  workId,
  sourceEventId,
}: {
  scope: string;
  workId: string | null;
  sourceEventId: string | null;
}) {
  if (workId && !getWorkItem(workId, scope)) {
    throw new PublicationValidationError(
      `Unknown work_id ${workId} for scope ${scope}.`,
    );
  }

  if (sourceEventId && !getCoordinationEvent(sourceEventId, scope)) {
    throw new PublicationValidationError(
      `Unknown source_event_id ${sourceEventId} for scope ${scope}.`,
    );
  }
}

function requirePublicationForDelivery(
  publicationId: string,
  scope?: string | null,
) {
  const normalizedScope = scope ? normalizeScope(scope) : null;
  const publication = getPublication(publicationId, normalizedScope);
  if (!publication) {
    throw new PublicationNotFoundError(publicationId, normalizedScope);
  }

  return publication;
}

export function getDeliveryByIdempotencyKey({
  publicationId,
  targetSurface,
  targetRef,
  idempotencyKey,
}: {
  publicationId: string;
  targetSurface: string;
  targetRef: string;
  idempotencyKey: string;
}) {
  const db = openDatabase();

  try {
    const row = db
      .prepare(
        `
          SELECT
            delivery_id,
            publication_id,
            scope,
            target_surface,
            target_ref,
            status,
            sent_at,
            acknowledged_at,
            error_message,
            idempotency_key,
            created_at,
            updated_at
          FROM delivery_ledger
          WHERE publication_id = ?
            AND target_surface = ?
            AND target_ref = ?
            AND idempotency_key = ?
        `,
      )
      .get(publicationId, targetSurface, targetRef, idempotencyKey) as
      | DeliveryRecordRow
      | undefined;

    return row ? parseDeliveryRecordRow(row) : null;
  } finally {
    db.close();
  }
}

function selectPublicationById(
  db: ReturnType<typeof openDatabase>,
  publicationId: string,
  scope?: string | null,
) {
  const row = selectPublicationByIdOrNull(db, publicationId, scope);
  if (!row) {
    throw new PublicationNotFoundError(publicationId, scope ?? null);
  }

  return parsePublicationDraftRow(row);
}

function selectPublicationByIdOrNull(
  db: ReturnType<typeof openDatabase>,
  publicationId: string,
  scope?: string | null,
) {
  return db
    .prepare(
      `
        SELECT
          publication_id,
          scope,
          work_id,
          source_event_id,
          target_surface,
          target_ref,
          status,
          preview_body,
          created_by,
          approved_by,
          created_at,
          updated_at,
          sent_at
        FROM publication_drafts
        WHERE publication_id = ?
          ${scope ? "AND scope = ?" : ""}
      `,
    )
    .get(...([publicationId, scope].filter(Boolean) as string[])) as
    | PublicationDraftRow
    | undefined;
}

function selectDeliveryById(
  db: ReturnType<typeof openDatabase>,
  deliveryId: string,
  scope?: string | null,
) {
  const row = selectDeliveryByIdOrNull(db, deliveryId, scope);
  if (!row) {
    throw new DeliveryNotFoundError(deliveryId, scope ?? null);
  }

  return parseDeliveryRecordRow(row);
}

function selectDeliveryByIdOrNull(
  db: ReturnType<typeof openDatabase>,
  deliveryId: string,
  scope?: string | null,
) {
  return db
    .prepare(
      `
        SELECT
          delivery_id,
          publication_id,
          scope,
          target_surface,
          target_ref,
          status,
          sent_at,
          acknowledged_at,
          error_message,
          idempotency_key,
          created_at,
          updated_at
        FROM delivery_ledger
        WHERE delivery_id = ?
          ${scope ? "AND scope = ?" : ""}
      `,
    )
    .get(...([deliveryId, scope].filter(Boolean) as string[])) as
    | DeliveryRecordRow
    | undefined;
}

function parsePublicationDraftRow(row: PublicationDraftRow): PublicationDraft {
  return row;
}

function parseDeliveryRecordRow(row: DeliveryRecordRow): DeliveryRecord {
  return row;
}

function validatePublicationCreateMetadata(
  status: PublicationStatus,
  approvedBy: string | null,
  sentAt: string | null,
) {
  if (status !== "draft") {
    throw new PublicationValidationError(
      "Publication drafts must be created with status draft. Use the publication status API for approved, sent, failed, or cancelled.",
    );
  }

  if (approvedBy) {
    throw new PublicationValidationError(
      "approved_by is not allowed when creating a publication draft. Use the publication status API with status approved.",
    );
  }

  if (sentAt) {
    throw new PublicationValidationError(
      "sent_at is not allowed when creating a publication draft. Use the publication status API with status sent.",
    );
  }
}

function validatePublicationStatusUpdateMetadata(
  status: PublicationStatus,
  approvedBy: string | null,
  sentAt: string | null,
) {
  if (status === "approved" && !approvedBy) {
    throw new PublicationValidationError(
      "approved_by is required when status is approved.",
    );
  }

  if (approvedBy && status !== "approved") {
    throw new PublicationValidationError(
      "approved_by may only be provided when status is approved.",
    );
  }

  if (sentAt && status !== "sent") {
    throw new PublicationValidationError(
      "sent_at may only be provided when status is sent.",
    );
  }
}

function validateDeliveryStatusMetadata({
  status,
  sentAt,
  acknowledgedAt,
  errorMessage,
  existingErrorMessage,
}: {
  status: DeliveryStatus;
  sentAt: string | null;
  acknowledgedAt: string | null;
  errorMessage: string | null;
  existingErrorMessage: string | null;
}) {
  if (sentAt && status !== "sent" && status !== "acknowledged") {
    throw new PublicationValidationError(
      "sent_at may only be provided when delivery status is sent or acknowledged.",
    );
  }

  if (acknowledgedAt && status !== "acknowledged") {
    throw new PublicationValidationError(
      "acknowledged_at may only be provided when delivery status is acknowledged.",
    );
  }

  if (status === "failed" && !errorMessage && !existingErrorMessage) {
    throw new PublicationValidationError(
      "error_message is required when delivery status is failed.",
    );
  }
}

function normalizeLimit(limit: number, defaultLimit: number, maxLimit: number) {
  if (!Number.isFinite(limit)) {
    return defaultLimit;
  }

  return Math.min(maxLimit, Math.max(1, Math.floor(limit)));
}

function assertPublicationStatus(
  value: string,
): asserts value is PublicationStatus {
  if (!PUBLICATION_STATUSES.includes(value as PublicationStatus)) {
    throw new PublicationValidationError(
      `status must be one of: ${PUBLICATION_STATUSES.join(", ")}.`,
    );
  }
}

function assertDeliveryStatus(value: string): asserts value is DeliveryStatus {
  if (!DELIVERY_STATUSES.includes(value as DeliveryStatus)) {
    throw new PublicationValidationError(
      `status must be one of: ${DELIVERY_STATUSES.join(", ")}.`,
    );
  }
}

function normalizeTargetSurface(value: string) {
  const targetSurface = requireNonEmptyString(value, "target_surface");
  assertTargetSurface(targetSurface);

  return targetSurface;
}

function assertTargetSurface(value: string) {
  if (!TARGET_SURFACE_PATTERN.test(value)) {
    throw new PublicationValidationError(
      "target_surface must start with a lowercase letter and contain only lowercase letters, numbers, underscores, colons, or hyphens.",
    );
  }
}

function assertPublicationId(value: string) {
  if (!value.startsWith("publication:") || value.trim() !== value) {
    throw new PublicationValidationError(
      "publication_id must start with publication: and contain no surrounding whitespace.",
    );
  }
}

function normalizePublicationId(value: string) {
  const publicationId = requireNonEmptyString(value, "publication_id");
  assertPublicationId(publicationId);

  return publicationId;
}

function assertDeliveryId(value: string) {
  if (!value.startsWith("delivery:") || value.trim() !== value) {
    throw new PublicationValidationError(
      "delivery_id must start with delivery: and contain no surrounding whitespace.",
    );
  }
}

function normalizeDeliveryId(value: string) {
  const deliveryId = requireNonEmptyString(value, "delivery_id");
  assertDeliveryId(deliveryId);

  return deliveryId;
}

function requireNonEmptyString(value: string, key: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new PublicationValidationError(`${key} is required.`);
  }

  return value.trim();
}

function cleanNullableString(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  return value.trim() || null;
}
