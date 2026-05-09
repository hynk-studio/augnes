import { buildMailboxSummary } from "@/lib/mailbox-summary";
import { normalizeScope } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = normalizeScope(searchParams.get("scope"));
    const limit = readOptionalLimit(searchParams.get("limit"));

    return NextResponse.json(buildMailboxSummary({ scope, limit }));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to build mailbox summary.",
      },
      { status: 400 },
    );
  }
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
