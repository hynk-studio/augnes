import { buildStateBrief } from "@/lib/state/brief";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") ?? "project:augnes";

  return NextResponse.json(buildStateBrief(scope));
}
