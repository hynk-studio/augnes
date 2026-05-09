import {
  HANDOFF_STATUSES,
  HandoffNotFoundError,
  updateHandoffStatus,
  type HandoffStatus,
} from "@/lib/handoffs";
import { normalizeScope } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ handoff_id: string }> },
) {
  const { handoff_id } = await params;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const scope = readOptionalString(body, "scope");
    const status = requireStatus(body, "status");
    const handoff = updateHandoffStatus({
      handoffId: decodeURIComponent(handoff_id),
      scope: scope ? normalizeScope(scope) : null,
      status,
    });

    return NextResponse.json({
      scope: handoff.scope,
      handoff,
    });
  } catch (error) {
    if (error instanceof HandoffNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update handoff status.",
      },
      { status: 400 },
    );
  }
}

function requireStatus(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (
    typeof value === "string" &&
    HANDOFF_STATUSES.includes(value as HandoffStatus)
  ) {
    return value as HandoffStatus;
  }

  throw new Error(`${key} must be one of: ${HANDOFF_STATUSES.join(", ")}.`);
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
