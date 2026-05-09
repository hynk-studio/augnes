import {
  HANDOFF_STATUSES,
  createHandoff,
  listHandoffs,
  type HandoffInput,
  type HandoffStatus,
} from "@/lib/handoffs";
import { syncMailboxForHandoff } from "@/lib/handoff-mailbox";
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
    const limit = readOptionalLimit(searchParams.get("limit"));

    return NextResponse.json({
      scope,
      handoffs: listHandoffs({
        scope,
        workId,
        status,
        limit,
      }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to list handoffs.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const input: HandoffInput = {
      handoff_id: readOptionalString(body, "handoff_id") ?? undefined,
      scope: readOptionalString(body, "scope"),
      work_id: readOptionalString(body, "work_id"),
      source_state_brief_ref: readOptionalString(
        body,
        "source_state_brief_ref",
      ),
      source_work_brief_ref: readOptionalString(body, "source_work_brief_ref"),
      target_agent: requireString(body, "target_agent"),
      status: readOptionalBodyStatus(body, "status") ?? "draft",
      current_committed_state_summary: requireString(
        body,
        "current_committed_state_summary",
      ),
      task_brief: requireString(body, "task_brief"),
      expected_files: readStringArray(body, "expected_files"),
      expected_state_keys: readStringArray(body, "expected_state_keys"),
      expected_checks: readStringArray(body, "expected_checks"),
      expected_execution_surfaces: readStringArray(
        body,
        "expected_execution_surfaces",
      ),
      safety_boundaries: readStringArray(body, "safety_boundaries"),
      completion_record_fields: readObject(body, "completion_record_fields"),
      created_by: requireString(body, "created_by"),
      created_at: readOptionalString(body, "created_at") ?? undefined,
      supersedes_handoff_id: readOptionalString(body, "supersedes_handoff_id"),
    };

    const handoff = createHandoff(input);
    const mailboxSync = syncMailboxForHandoff(handoff);

    return NextResponse.json(
      {
        scope: handoff.scope,
        handoff,
        ...(mailboxSync.mailbox_message
          ? {
              mailbox_message: mailboxSync.mailbox_message,
              mailbox_sync: mailboxSync.action,
            }
          : {}),
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create handoff.",
      },
      { status: 400 },
    );
  }
}

function readOptionalStatus(value: string | null) {
  if (!value) {
    return null;
  }

  if (HANDOFF_STATUSES.includes(value as HandoffStatus)) {
    return value as HandoffStatus;
  }

  throw new Error(`status must be one of: ${HANDOFF_STATUSES.join(", ")}.`);
}

function readOptionalBodyStatus(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === undefined || value === null) {
    return null;
  }

  if (
    typeof value === "string" &&
    HANDOFF_STATUSES.includes(value as HandoffStatus)
  ) {
    return value as HandoffStatus;
  }

  throw new Error(`${key} must be one of: ${HANDOFF_STATUSES.join(", ")}.`);
}

function requireString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} is required.`);
  }

  return value.trim();
}

function readOptionalString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`${key} must be a string.`);
  }

  return value.trim() || null;
}

function readStringArray(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(`${key} must be an array of strings.`);
  }

  return value.filter((item): item is string => typeof item === "string");
}

function readObject(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === undefined || value === null) {
    return {};
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${key} must be an object.`);
  }

  return value as HandoffInput["completion_record_fields"];
}

function readOptionalLimit(value: string | null) {
  if (!value) {
    return undefined;
  }

  const limit = Number(value);
  if (!Number.isFinite(limit)) {
    throw new Error("limit must be a number.");
  }

  return limit;
}
