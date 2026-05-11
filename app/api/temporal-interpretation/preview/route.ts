import {
  buildTemporalInterpretationPreview,
  validateTemporalPreviewRequest,
} from "@/lib/temporal-interpretation/preview";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const text = await request.text();
    const body = text.trim().length ? JSON.parse(text) : null;
    const previewRequest = validateTemporalPreviewRequest(body);

    return NextResponse.json(
      await buildTemporalInterpretationPreview(previewRequest),
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to build temporal interpretation preview.",
      },
      { status: 400 },
    );
  }
}
