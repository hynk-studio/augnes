import { listWorkItems, normalizeScope } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = normalizeScope(searchParams.get("scope"));

  return NextResponse.json({
    scope,
    work_items: listWorkItems(scope),
  });
}
