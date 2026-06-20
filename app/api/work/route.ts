import {
  buildEmptyRuntimeStartupFallbackMetadata,
  getMissingEmptyRuntimeOptionalTables,
} from "@/lib/empty-runtime-startup-fallback";
import { listWorkItems, normalizeScope } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = normalizeScope(searchParams.get("scope"));

  try {
    return NextResponse.json({
      scope,
      work_items: listWorkItems(scope),
    });
  } catch (error) {
    const missingTables = getMissingEmptyRuntimeOptionalTables(error);

    if (missingTables.length === 0) {
      throw error;
    }

    return NextResponse.json({
      scope,
      work_items: [],
      ...buildEmptyRuntimeStartupFallbackMetadata({
        route: "GET /api/work",
        scope,
        missingTables,
      }),
    });
  }
}
