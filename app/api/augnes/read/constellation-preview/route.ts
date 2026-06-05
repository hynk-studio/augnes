import {
  buildConstellationPreviewError,
  buildConstellationPreviewResponse,
  shouldIncludeConstellationPreviewDiagnostics,
  validateConstellationPreviewRequest,
} from "@/lib/readonly-api/constellation-preview";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    const validation = validateConstellationPreviewRequest(request);

    if (!validation.ok) {
      return NextResponse.json(
        buildConstellationPreviewError({
          code: validation.code,
          status: validation.status,
          authorityBoundary: validation.authority_boundary,
        }),
        { status: validation.status },
      );
    }

    return NextResponse.json(
      buildConstellationPreviewResponse({
        includeDiagnostics: shouldIncludeConstellationPreviewDiagnostics(request),
        scope: validation.scope,
      }),
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      buildConstellationPreviewError({
        code: "unavailable",
        status: 500,
      }),
      { status: 500 },
    );
  }
}
