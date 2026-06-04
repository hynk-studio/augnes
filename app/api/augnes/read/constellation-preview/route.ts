import {
  buildConstellationPreviewError,
  buildConstellationPreviewResponse,
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
        }),
        { status: validation.status },
      );
    }

    return NextResponse.json(
      buildConstellationPreviewResponse({ scope: validation.scope }),
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
