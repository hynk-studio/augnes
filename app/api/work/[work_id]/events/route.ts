import {
  ACTION_RESULT_KINDS,
  ACTION_RESULT_STATUSES,
  type ActionResultKind,
  type ActionResultStatus,
} from "@/lib/actions/local-tools";
import {
  appendWorkEvent,
  normalizeScope,
  normalizeWorkId,
  WorkNotFoundError,
  WORK_ACTORS,
  WORK_EVENT_TYPES,
  type WorkActor,
  type WorkEventType,
} from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ work_id: string }> },
) {
  const { work_id } = await params;
  const workId = normalizeWorkId(work_id);

  try {
    const body = await readJsonBody(request);
    const scope = normalizeScope(readOptionalString(body, "scope"));
    const summary = requireString(body, "summary");
    const actor = optionalEnum(body, "actor", WORK_ACTORS, "codex");
    const eventType = optionalEnum(
      body,
      "event_type",
      WORK_EVENT_TYPES,
      "note",
    );
    const resultStatus = optionalNullableEnum<
      ActionResultStatus
    >(body, "result_status", ACTION_RESULT_STATUSES);
    const resultKind = optionalNullableEnum<ActionResultKind>(
      body,
      "result_kind",
      ACTION_RESULT_KINDS,
    );
    const event = appendWorkEvent({
      work_id: workId,
      scope,
      actor,
      event_type: eventType,
      summary,
      result_status: resultStatus,
      result_kind: resultKind,
      related_action_id: readOptionalString(body, "related_action_id"),
      related_pr: readOptionalString(body, "related_pr"),
      related_state_keys: readOptionalStringArray(body, "related_state_keys"),
    });

    return NextResponse.json({ scope, event }, { status: 201 });
  } catch (error) {
    if (error instanceof WorkNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to record work event.",
      },
      { status: 400 },
    );
  }
}

async function readJsonBody(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("Request body must be a JSON object.");
    }

    return body as Record<string, unknown>;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Request body must be a JSON object."
    ) {
      throw error;
    }

    throw new Error("Request body must be valid JSON.");
  }
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
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`${key} must be a string.`);
  }

  return value.trim() || undefined;
}

function readOptionalStringArray(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(`${key} must be an array of strings.`);
  }

  return value.map((item) => {
    if (typeof item !== "string") {
      throw new Error(`${key} must be an array of strings.`);
    }

    return item.trim();
  });
}

function optionalEnum<T extends WorkActor | WorkEventType>(
  record: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
  defaultValue: T,
) {
  const value = record[key];
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value === "string" && allowed.includes(value as T)) {
    return value as T;
  }

  throw new Error(`${key} must be one of: ${allowed.join(", ")}.`);
}

function optionalNullableEnum<T extends ActionResultStatus | ActionResultKind>(
  record: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
) {
  const value = record[key];
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "string" && allowed.includes(value as T)) {
    return value as T;
  }

  throw new Error(`${key} must be one of: ${allowed.join(", ")}.`);
}
