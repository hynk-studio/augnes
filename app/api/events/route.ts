import {
  COORDINATION_EVENT_TYPES,
  listCoordinationEvents,
  type CoordinationEventType,
} from "@/lib/coordination-events";
import { normalizeScope } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = normalizeScope(searchParams.get("scope"));
    const eventType = readOptionalEventType(searchParams.get("event_type"));
    const workId = searchParams.get("work_id");
    const limit = readOptionalLimit(searchParams.get("limit"));

    return NextResponse.json({
      scope,
      events: listCoordinationEvents({
        scope,
        eventType,
        workId,
        limit,
      }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to list coordination events.",
      },
      { status: 400 },
    );
  }
}

function readOptionalEventType(value: string | null) {
  if (!value) {
    return null;
  }

  if (COORDINATION_EVENT_TYPES.includes(value as CoordinationEventType)) {
    return value as CoordinationEventType;
  }

  throw new Error(`event_type must be one of: ${COORDINATION_EVENT_TYPES.join(", ")}.`);
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
