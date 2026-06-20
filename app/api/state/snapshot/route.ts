import {
  groupEntriesForSnapshot,
  listOpenTensions,
  listStateEntries,
} from "@/lib/db";
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
    const entries = listStateEntries(scope);
    const groupedEntries = groupEntriesForSnapshot(entries);

    return NextResponse.json({
      scope,
      as_of: asOf,
      ...groupedEntries,
      open_tensions: listOpenTensions(scope),
    });
  } catch (error) {
    const missingTables = getMissingEmptyRuntimeOptionalTables(error);

    if (missingTables.length === 0) {
      throw error;
    }

    return NextResponse.json({
      scope,
      as_of: asOf,
      active_state: [],
      future_state: [],
      deprecated_state: [],
      completed_state: [],
      open_tensions: [],
      ...buildEmptyRuntimeStartupFallbackMetadata({
        route: "GET /api/state/snapshot",
        scope,
        missingTables,
      }),
    });
  }
}
