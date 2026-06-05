import {
  buildPerspectiveIngestLocalPreviewError,
  buildPerspectiveIngestLocalPreviewReadResponse,
  validatePerspectiveIngestLocalPreviewAccess,
  validatePerspectiveIngestLocalPreviewBody,
} from "@/lib/readonly-api/perspective-ingest-local-preview";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const accessValidation =
      validatePerspectiveIngestLocalPreviewAccess(request);

    if (!accessValidation.ok) {
      return NextResponse.json(
        buildPerspectiveIngestLocalPreviewError({
          code: accessValidation.code,
          status: accessValidation.status,
          summary: accessValidation.summary,
          authorityBoundary: accessValidation.authority_boundary,
        }),
        { status: accessValidation.status },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        buildPerspectiveIngestLocalPreviewError({
          code: "invalid_json",
          status: 400,
          summary: "Request body must be valid JSON.",
        }),
        { status: 400 },
      );
    }

    const bodyValidation = validatePerspectiveIngestLocalPreviewBody(body);

    if (!bodyValidation.ok) {
      return NextResponse.json(
        buildPerspectiveIngestLocalPreviewError({
          code: bodyValidation.code,
          status: bodyValidation.status,
          summary: bodyValidation.summary,
          authorityBoundary: bodyValidation.authority_boundary,
        }),
        { status: bodyValidation.status },
      );
    }

    return NextResponse.json(
      buildPerspectiveIngestLocalPreviewReadResponse({
        generatedAt: new Date().toISOString(),
        request: bodyValidation.request,
      }),
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      buildPerspectiveIngestLocalPreviewError({
        code: "unavailable",
        status: 500,
        summary: "Local preview route is unavailable.",
      }),
      { status: 500 },
    );
  }
}
