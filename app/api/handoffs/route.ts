import {
  HANDOFF_STATUSES,
  listHandoffs,
  type HandoffStatus,
} from "@/lib/handoffs";
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
      boundaries: {
        historical_read_only: true,
        handoff_creation: false,
        native_host_execution: false,
        receipt_admission: false,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to list historical handoffs.",
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
