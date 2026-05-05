import {
  ACTION_RESULT_KINDS,
  ACTION_RESULT_STATUSES,
  recordExternalAction,
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
    const filesChanged = Array.isArray(body.files_changed)
      ? body.files_changed.filter(
          (file): file is string => typeof file === "string",
        )
      : [];

    return NextResponse.json(
      {
        scope,
        result: recordExternalAction({
          scope,
          sourceAgentId,
          actionName,
          resultSummary,
          filesChanged,
          resultStatus,
          resultKind,
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
            : "Failed to record external action.",
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
