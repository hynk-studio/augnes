import {
  ACTION_RESULT_KINDS,
  ACTION_RESULT_STATUSES,
  recordActionProof,
  type ActionResultKind,
  type ActionResultStatus,
} from "@/lib/actions/local-tools";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const scope = requireString(body, "scope");
    const sourceAgentId = requireString(body, "source_agent_id");
    const actionName = requireString(body, "action_name");
    const resultSummary = requireString(body, "result_summary");
    const resultStatus = optionalEnum(
      body,
      "result_status",
      ACTION_RESULT_STATUSES,
      "completed",
    );
    const resultKind = optionalEnum(
      body,
      "result_kind",
      ACTION_RESULT_KINDS,
      "other",
    );
    const workId = readOptionalString(body, "work_id");
    const filesChanged = readStringArray(body, "files_changed");
    const relatedStateKeys = readStringArray(body, "related_state_keys");

    return NextResponse.json(
      {
        scope,
        result: recordActionProof({
          scope,
          sourceAgentId,
          actionName,
          resultSummary,
          filesChanged,
          resultStatus,
          resultKind,
          workId,
          relatedStateKeys,
        }),
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to record action proof.",
      },
      { status: 400 },
    );
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

  return value.map((item) => {
    if (typeof item !== "string") {
      throw new Error(`${key} must be an array of strings.`);
    }

    return item.trim();
  }).filter(Boolean);
}

function optionalEnum<T extends ActionResultStatus | ActionResultKind>(
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
