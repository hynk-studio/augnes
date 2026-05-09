import { randomUUID } from "node:crypto";
import { appendCoordinationEvent } from "@/lib/coordination-events";
import { openDatabase } from "@/lib/db";
import { getHandoff } from "@/lib/handoffs";
import { getWorkItem, normalizeScope, normalizeWorkId } from "@/lib/work";

const DEFAULT_MAILBOX_LIMIT = 50;
const MAX_MAILBOX_LIMIT = 200;

export const MAILBOX_MESSAGE_TYPES = [
  "handoff",
  "review_request",
  "blocked_notice",
  "result_report",
  "approval_needed",
  "verification_needed",
] as const;

export const MAILBOX_STATUSES = [
  "draft",
  "ready",
  "delivered",
  "acknowledged",
  "reviewed",
  "superseded",
  "expired",
] as const;

export type MailboxMessageType = (typeof MAILBOX_MESSAGE_TYPES)[number];
export type MailboxStatus = (typeof MAILBOX_STATUSES)[number];

export type MailboxMessage = {
  message_id: string;
  scope: string;
  work_id: string | null;
  from_agent: string;
  to_agent: string;
  message_type: MailboxMessageType | string;
  summary: string;
  payload_ref: string | null;
  requires_ack: boolean;
  status: MailboxStatus | string;
  created_at: string;
  updated_at: string;
  acknowledged_at: string | null;
  supersedes_message_id: string | null;
};

export type MailboxMessageInput = {
  message_id?: string;
  scope?: string | null;
  work_id?: string | null;
  from_agent: string;
  to_agent: string;
  message_type: MailboxMessageType;
  summary: string;
  payload_ref?: string | null;
  requires_ack?: boolean;
  status?: MailboxStatus;
  created_at?: string;
  acknowledged_at?: string | null;
  supersedes_message_id?: string | null;
};

type MailboxMessageRow = Omit<MailboxMessage, "requires_ack"> & {
  requires_ack: number;
};

export class MailboxNotFoundError extends Error {
  constructor(messageId: string, scope: string | null) {
    super(
      scope
        ? `Unknown mailbox message ${messageId} for scope ${scope}.`
        : `Unknown mailbox message ${messageId}.`,
    );
    this.name = "MailboxNotFoundError";
  }
}

export class MailboxValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MailboxValidationError";
  }
}

export function listMailboxMessages({
  scope,
  workId,
  status,
  messageType,
  fromAgent,
  toAgent,
  payloadRef,
  limit = DEFAULT_MAILBOX_LIMIT,
}: {
  scope?: string | null;
  workId?: string | null;
  status?: MailboxStatus | null;
  messageType?: MailboxMessageType | null;
  fromAgent?: string | null;
  toAgent?: string | null;
  payloadRef?: string | null;
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
    assertMailboxStatus(status);
    clauses.push("status = ?");
    params.push(status);
  }

  if (messageType) {
    assertMailboxMessageType(messageType);
    clauses.push("message_type = ?");
    params.push(messageType);
  }

  const cleanFromAgent = cleanNullableString(fromAgent);
  if (cleanFromAgent) {
    clauses.push("from_agent = ?");
    params.push(cleanFromAgent);
  }

  const cleanToAgent = cleanNullableString(toAgent);
  if (cleanToAgent) {
    clauses.push("to_agent = ?");
    params.push(cleanToAgent);
  }

  const cleanPayloadRef = cleanNullableString(payloadRef);
  if (cleanPayloadRef) {
    clauses.push("payload_ref = ?");
    params.push(cleanPayloadRef);
  }

  params.push(normalizeLimit(limit));
  const db = openDatabase();

  try {
    const rows = db
      .prepare(
        `
          SELECT
            message_id,
            scope,
            work_id,
            from_agent,
            to_agent,
            message_type,
            summary,
            payload_ref,
            requires_ack,
            status,
            created_at,
            updated_at,
            acknowledged_at,
            supersedes_message_id
          FROM mailbox_messages
          WHERE ${clauses.join(" AND ")}
          ORDER BY created_at DESC, message_id ASC
          LIMIT ?
        `,
      )
      .all(...params) as MailboxMessageRow[];

    return rows.map(parseMailboxMessageRow);
  } finally {
    db.close();
  }
}

export function getMailboxMessage(messageId: string, scope?: string | null) {
  const normalizedScope = scope ? normalizeScope(scope) : null;
  const db = openDatabase();

  try {
    const row = db
      .prepare(
        `
          SELECT
            message_id,
            scope,
            work_id,
            from_agent,
            to_agent,
            message_type,
            summary,
            payload_ref,
            requires_ack,
            status,
            created_at,
            updated_at,
            acknowledged_at,
            supersedes_message_id
          FROM mailbox_messages
          WHERE message_id = ?
            ${normalizedScope ? "AND scope = ?" : ""}
        `,
      )
      .get(
        ...([messageId.trim(), normalizedScope].filter(Boolean) as string[]),
      ) as MailboxMessageRow | undefined;

    return row ? parseMailboxMessageRow(row) : null;
  } finally {
    db.close();
  }
}

export function createMailboxMessage(input: MailboxMessageInput) {
  const now = input.created_at ?? new Date().toISOString();
  const scope = normalizeScope(input.scope);
  const workId = input.work_id ? normalizeWorkId(input.work_id) : null;
  const payloadRef = cleanNullableString(input.payload_ref);
  const status = input.status ?? "draft";
  const acknowledgedAt = cleanNullableString(input.acknowledged_at);
  if (acknowledgedAt && status !== "acknowledged") {
    throw new MailboxValidationError(
      "acknowledged_at may only be set when status is acknowledged.",
    );
  }

  const row = {
    message_id:
      cleanNullableString(input.message_id) ?? `mailbox:${randomUUID()}`,
    scope,
    work_id: workId,
    from_agent: requireNonEmptyString(input.from_agent, "from_agent"),
    to_agent: requireNonEmptyString(input.to_agent, "to_agent"),
    message_type: input.message_type,
    summary: requireNonEmptyString(input.summary, "summary"),
    payload_ref: payloadRef,
    requires_ack: input.requires_ack ? 1 : 0,
    status,
    created_at: now,
    updated_at: now,
    acknowledged_at: acknowledgedAt ?? (status === "acknowledged" ? now : null),
    supersedes_message_id: cleanNullableString(input.supersedes_message_id),
  };
  assertMailboxMessageType(row.message_type);
  assertMailboxStatus(row.status);
  validateMailboxReferences({
    scope,
    workId,
    payloadRef,
    messageType: row.message_type,
  });

  const db = openDatabase();
  let message: MailboxMessage;

  try {
    message = db.transaction(() => {
      db.prepare(
        `
          INSERT INTO mailbox_messages (
            message_id,
            scope,
            work_id,
            from_agent,
            to_agent,
            message_type,
            summary,
            payload_ref,
            requires_ack,
            status,
            created_at,
            updated_at,
            acknowledged_at,
            supersedes_message_id
          )
          VALUES (
            @message_id,
            @scope,
            @work_id,
            @from_agent,
            @to_agent,
            @message_type,
            @summary,
            @payload_ref,
            @requires_ack,
            @status,
            @created_at,
            @updated_at,
            @acknowledged_at,
            @supersedes_message_id
          )
        `,
      ).run(row);

      return selectMailboxMessageById(db, row.message_id);
    })();
  } finally {
    db.close();
  }

  appendMailboxEvent(message, "mailbox_message_created", message.created_at);
  appendMailboxStatusEvent(message, message.status, message.created_at);

  return message;
}

export function updateMailboxMessageStatus({
  messageId,
  scope,
  status,
}: {
  messageId: string;
  scope?: string | null;
  status: MailboxStatus;
}) {
  assertMailboxStatus(status);
  const normalizedScope = scope ? normalizeScope(scope) : null;
  const now = new Date().toISOString();
  const db = openDatabase();
  let previousStatus = "";
  let message: MailboxMessage;

  try {
    message = db.transaction(() => {
      const existing = selectMailboxMessageById(
        db,
        messageId.trim(),
        normalizedScope,
      );
      previousStatus = existing.status;

      db.prepare(
        `
          UPDATE mailbox_messages
          SET
            status = ?,
            updated_at = ?,
            acknowledged_at = CASE
              WHEN ? = 'acknowledged' AND acknowledged_at IS NULL THEN ?
              ELSE acknowledged_at
            END
          WHERE message_id = ?
            ${normalizedScope ? "AND scope = ?" : ""}
        `,
      ).run(
        ...([
          status,
          now,
          status,
          now,
          messageId.trim(),
          normalizedScope,
        ].filter(Boolean) as string[]),
      );

      return selectMailboxMessageById(db, messageId.trim(), normalizedScope);
    })();
  } finally {
    db.close();
  }

  if (previousStatus !== message.status) {
    appendMailboxStatusEvent(message, message.status, now);
  }

  return message;
}

function appendMailboxStatusEvent(
  message: MailboxMessage,
  status: string,
  createdAt: string,
) {
  if (status === "delivered") {
    appendMailboxEvent(message, "mailbox_message_delivered", createdAt, {
      uniqueEventId: true,
    });
  } else if (status === "acknowledged") {
    appendMailboxEvent(message, "mailbox_message_acknowledged", createdAt, {
      uniqueEventId: true,
    });
  } else if (status === "reviewed") {
    appendMailboxEvent(message, "mailbox_message_reviewed", createdAt, {
      uniqueEventId: true,
    });
  } else if (status === "superseded") {
    appendMailboxEvent(message, "mailbox_message_superseded", createdAt, {
      uniqueEventId: true,
    });
  } else if (status === "expired") {
    appendMailboxEvent(message, "mailbox_message_expired", createdAt, {
      uniqueEventId: true,
    });
  }
}

function appendMailboxEvent(
  message: MailboxMessage,
  eventType:
    | "mailbox_message_created"
    | "mailbox_message_delivered"
    | "mailbox_message_acknowledged"
    | "mailbox_message_reviewed"
    | "mailbox_message_superseded"
    | "mailbox_message_expired",
  createdAt: string,
  options?: { uniqueEventId?: boolean },
) {
  const suffix = eventType.replace("mailbox_message_", "");
  const eventId = options?.uniqueEventId
    ? `event:${message.message_id}:${suffix}:${randomUUID()}`
    : `event:${message.message_id}:${suffix}`;

  return appendCoordinationEvent({
    event_id: eventId,
    event_type: eventType,
    scope: message.scope,
    work_id: message.work_id,
    actor: message.from_agent,
    target: message.to_agent,
    source_surface: "local_runtime",
    authority_level:
      eventType === "mailbox_message_acknowledged"
        ? "acknowledged_notice"
        : message.message_type === "handoff"
          ? "handoff_guidance"
          : "interpretation_only",
    state_keys: ["coordination.mailbox"],
    payload_ref: message.message_id,
    result_status: message.status,
    created_at: createdAt,
  });
}

function validateMailboxReferences({
  scope,
  workId,
  payloadRef,
  messageType,
}: {
  scope: string;
  workId: string | null;
  payloadRef: string | null;
  messageType: MailboxMessageType;
}) {
  if (workId && !getWorkItem(workId, scope)) {
    throw new MailboxValidationError(`Unknown work_id ${workId} for scope ${scope}.`);
  }

  if (messageType === "handoff") {
    if (!payloadRef) {
      throw new MailboxValidationError(
        "payload_ref is required for handoff mailbox messages.",
      );
    }

    if (!payloadRef.startsWith("handoff:")) {
      throw new MailboxValidationError(
        "payload_ref for handoff mailbox messages must reference a handoff_id.",
      );
    }
  }

  if (payloadRef?.startsWith("handoff:") && !getHandoff(payloadRef, scope)) {
    throw new MailboxValidationError(
      `Unknown handoff payload_ref ${payloadRef} for scope ${scope}.`,
    );
  }
}

function selectMailboxMessageById(
  db: ReturnType<typeof openDatabase>,
  messageId: string,
  scope?: string | null,
) {
  const row = db
    .prepare(
      `
        SELECT
          message_id,
          scope,
          work_id,
          from_agent,
          to_agent,
          message_type,
          summary,
          payload_ref,
          requires_ack,
          status,
          created_at,
          updated_at,
          acknowledged_at,
          supersedes_message_id
        FROM mailbox_messages
        WHERE message_id = ?
          ${scope ? "AND scope = ?" : ""}
      `,
    )
    .get(...([messageId, scope].filter(Boolean) as string[])) as
    | MailboxMessageRow
    | undefined;

  if (!row) {
    throw new MailboxNotFoundError(messageId, scope ?? null);
  }

  return parseMailboxMessageRow(row);
}

function parseMailboxMessageRow(row: MailboxMessageRow): MailboxMessage {
  return {
    ...row,
    requires_ack: Boolean(row.requires_ack),
  };
}

function normalizeLimit(limit: number) {
  if (!Number.isFinite(limit)) {
    return DEFAULT_MAILBOX_LIMIT;
  }

  return Math.min(MAX_MAILBOX_LIMIT, Math.max(1, Math.floor(limit)));
}

function assertMailboxMessageType(
  value: string,
): asserts value is MailboxMessageType {
  if (!MAILBOX_MESSAGE_TYPES.includes(value as MailboxMessageType)) {
    throw new MailboxValidationError(
      `message_type must be one of: ${MAILBOX_MESSAGE_TYPES.join(", ")}.`,
    );
  }
}

function assertMailboxStatus(value: string): asserts value is MailboxStatus {
  if (!MAILBOX_STATUSES.includes(value as MailboxStatus)) {
    throw new MailboxValidationError(
      `status must be one of: ${MAILBOX_STATUSES.join(", ")}.`,
    );
  }
}

function requireNonEmptyString(value: string, key: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new MailboxValidationError(`${key} is required.`);
  }

  return value.trim();
}

function cleanNullableString(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  return value.trim() || null;
}
