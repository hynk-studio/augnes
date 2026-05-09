import {
  MAILBOX_MESSAGE_TYPES,
  MAILBOX_STATUSES,
  MailboxValidationError,
  createMailboxMessage,
  listMailboxMessages,
  type MailboxMessageInput,
  type MailboxMessageType,
  type MailboxStatus,
} from "@/lib/mailbox";
import { normalizeScope } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = normalizeScope(searchParams.get("scope"));
    const workId = searchParams.get("work_id");
    const status = readOptionalStatus(searchParams.get("status"));
    const messageType = readOptionalMessageType(
      searchParams.get("message_type"),
    );
    const fromAgent = searchParams.get("from_agent");
    const toAgent = searchParams.get("to_agent");
    const limit = readOptionalLimit(searchParams.get("limit"));

    return NextResponse.json({
      scope,
      mailbox_messages: listMailboxMessages({
        scope,
        workId,
        status,
        messageType,
        fromAgent,
        toAgent,
        limit,
      }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to list mailbox messages.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const input: MailboxMessageInput = {
      message_id: readOptionalString(body, "message_id") ?? undefined,
      scope: readOptionalString(body, "scope"),
      work_id: readOptionalString(body, "work_id"),
      from_agent: requireString(body, "from_agent"),
      to_agent: requireString(body, "to_agent"),
      message_type: requireMessageType(body, "message_type"),
      summary: requireString(body, "summary"),
      payload_ref: readOptionalString(body, "payload_ref"),
      requires_ack: readOptionalBoolean(body, "requires_ack") ?? false,
      status: readOptionalBodyStatus(body, "status") ?? "draft",
      created_at: readOptionalString(body, "created_at") ?? undefined,
      acknowledged_at: readOptionalString(body, "acknowledged_at"),
      supersedes_message_id: readOptionalString(
        body,
        "supersedes_message_id",
      ),
    };

    const mailboxMessage = createMailboxMessage(input);

    return NextResponse.json(
      {
        scope: mailboxMessage.scope,
        mailbox_message: mailboxMessage,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create mailbox message.",
      },
      { status: error instanceof MailboxValidationError ? 400 : 500 },
    );
  }
}

async function readJsonBody(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new MailboxValidationError("Request body must be a JSON object.");
    }

    return body as Record<string, unknown>;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Request body must be a JSON object."
    ) {
      throw error;
    }

    throw new MailboxValidationError("Request body must be valid JSON.");
  }
}

function requireString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new MailboxValidationError(`${key} is required.`);
  }

  return value.trim();
}

function readOptionalString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new MailboxValidationError(`${key} must be a string.`);
  }

  return value.trim() || null;
}

function readOptionalBoolean(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "boolean") {
    throw new MailboxValidationError(`${key} must be a boolean.`);
  }

  return value;
}

function readOptionalStatus(value: string | null) {
  if (!value) {
    return null;
  }

  if (MAILBOX_STATUSES.includes(value as MailboxStatus)) {
    return value as MailboxStatus;
  }

  throw new MailboxValidationError(
    `status must be one of: ${MAILBOX_STATUSES.join(", ")}.`,
  );
}

function readOptionalBodyStatus(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === undefined || value === null) {
    return null;
  }

  if (
    typeof value === "string" &&
    MAILBOX_STATUSES.includes(value as MailboxStatus)
  ) {
    return value as MailboxStatus;
  }

  throw new MailboxValidationError(
    `${key} must be one of: ${MAILBOX_STATUSES.join(", ")}.`,
  );
}

function readOptionalMessageType(value: string | null) {
  if (!value) {
    return null;
  }

  if (MAILBOX_MESSAGE_TYPES.includes(value as MailboxMessageType)) {
    return value as MailboxMessageType;
  }

  throw new MailboxValidationError(
    `message_type must be one of: ${MAILBOX_MESSAGE_TYPES.join(", ")}.`,
  );
}

function requireMessageType(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (
    typeof value === "string" &&
    MAILBOX_MESSAGE_TYPES.includes(value as MailboxMessageType)
  ) {
    return value as MailboxMessageType;
  }

  throw new MailboxValidationError(
    `${key} must be one of: ${MAILBOX_MESSAGE_TYPES.join(", ")}.`,
  );
}

function readOptionalLimit(value: string | null) {
  if (!value) {
    return undefined;
  }

  const limit = Number(value);
  if (!Number.isFinite(limit)) {
    throw new MailboxValidationError("limit must be a number.");
  }

  return limit;
}
