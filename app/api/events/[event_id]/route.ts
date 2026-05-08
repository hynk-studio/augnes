import { getCoordinationEvent } from "@/lib/coordination-events";
import { normalizeScope } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ event_id: string }> },
) {
  const { event_id } = await params;
  const { searchParams } = new URL(request.url);
  const scopeParam = searchParams.get("scope");
  const scope = scopeParam ? normalizeScope(scopeParam) : null;
  const event = getCoordinationEvent(decodeURIComponent(event_id), scope);

  if (!event) {
    return NextResponse.json(
      { error: `Unknown coordination event ${event_id}.` },
      { status: 404 },
    );
  }

  return NextResponse.json({ scope: event.scope, event });
}
