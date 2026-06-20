import { groupTransitionsByStateKey, listStateTransitions } from "@/lib/db";
import {
  buildEmptyRuntimeStartupFallbackMetadata,
  getMissingEmptyRuntimeOptionalTables,
} from "@/lib/empty-runtime-startup-fallback";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") ?? "project:augnes";
  const asOf = new Date().toISOString();

  try {
    const transitions = listStateTransitions(scope);

    return NextResponse.json({
      scope,
      as_of: asOf,
      trajectories: groupTransitionsByStateKey(transitions),
    });
  } catch (error) {
    const missingTables = getMissingEmptyRuntimeOptionalTables(error);

    if (missingTables.length === 0) {
      throw error;
    }

    return NextResponse.json({
      scope,
      as_of: asOf,
      trajectories: {},
      ...buildEmptyRuntimeStartupFallbackMetadata({
        route: "GET /api/state/trajectory",
        scope,
        missingTables,
      }),
    });
  }
}
