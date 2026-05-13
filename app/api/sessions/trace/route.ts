import { buildSessionTrace } from "@/lib/session-binding";
import { normalizeScope } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = normalizeScope(searchParams.get("scope"));
  const limit = parseOptionalLimit(searchParams.get("limit"));

  return NextResponse.json(buildSessionTrace({ scope, limit }));
}

function parseOptionalLimit(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
