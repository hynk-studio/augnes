import {
  MAILBOX_STATUSES,
  MailboxNotFoundError,
  MailboxValidationError,
  updateMailboxMessageStatus,
  type MailboxStatus,
} from "@/lib/mailbox";
import { normalizeScope } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ message_id: string }> },
) {
  const { message_id } = await params;

  try {
    const body = await readJsonBody(request);
    const scope = readOptionalString(body, "scope");
    const status = requireStatus(body, "status");
    const mailboxMessage = updateMailboxMessageStatus({
      messageId: decodeURIComponent(message_id),
      scope: scope ? normalizeScope(scope) : null,
      status,
    });

    return NextResponse.json({
      scope: mailboxMessage.scope,
      mailbox_message: mailboxMessage,
    });
  } catch (error) {
    if (error instanceof MailboxNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update mailbox message status.",
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

function requireStatus(record: Record<string, unknown>, key: string) {
  const value = record[key];
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
