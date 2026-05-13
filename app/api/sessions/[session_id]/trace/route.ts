import { buildSessionTrace } from "@/lib/session-binding";
import { normalizeScope } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ session_id: string }> },
) {
  const { session_id } = await params;
  const { searchParams } = new URL(request.url);
  const scope = normalizeScope(searchParams.get("scope"));
  const trace = buildSessionTrace({ scope, session_id });

  if (trace.sessions.length === 0) {
    return NextResponse.json(
      { error: `Unknown session_id ${session_id} for scope ${scope}.` },
      { status: 404 },
    );
  }

  return NextResponse.json(trace);
}
