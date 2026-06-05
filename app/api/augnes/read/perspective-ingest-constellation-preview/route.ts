import {
  buildPerspectiveIngestConstellationPreviewError,
  buildPerspectiveIngestConstellationPreviewReadResponse,
  validatePerspectiveIngestConstellationPreviewRequest,
} from "@/lib/readonly-api/perspective-ingest-constellation-preview";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    const validation =
      validatePerspectiveIngestConstellationPreviewRequest(request);

    if (!validation.ok) {
      return NextResponse.json(
        buildPerspectiveIngestConstellationPreviewError({
          code: validation.code,
          status: validation.status,
          authorityBoundary: validation.authority_boundary,
        }),
        { status: validation.status },
      );
    }

    return NextResponse.json(
      buildPerspectiveIngestConstellationPreviewReadResponse({
        source: validation.source,
      }),
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      buildPerspectiveIngestConstellationPreviewError({
        code: "unavailable",
        status: 500,
      }),
      { status: 500 },
    );
  }
}
