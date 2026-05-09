import { getHandoff } from "@/lib/handoffs";
import { normalizeScope } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ handoff_id: string }> },
) {
  const { handoff_id } = await params;
  const { searchParams } = new URL(request.url);
  const scopeParam = searchParams.get("scope");
  const scope = scopeParam ? normalizeScope(scopeParam) : null;
  const handoff = getHandoff(decodeURIComponent(handoff_id), scope);

  if (!handoff) {
    return NextResponse.json(
      { error: `Unknown handoff_id ${handoff_id}.` },
      { status: 404 },
    );
  }

  return NextResponse.json({ scope: handoff.scope, handoff });
}
