import { groupTransitionsByStateKey, listStateTransitions } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") ?? "project:augnes";
  const transitions = listStateTransitions(scope);

  return NextResponse.json({
    scope,
    as_of: new Date().toISOString(),
    trajectories: groupTransitionsByStateKey(transitions),
  });
}
