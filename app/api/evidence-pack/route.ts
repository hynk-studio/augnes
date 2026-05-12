import {
  EvidencePackNotFoundError,
  buildEvidencePack,
} from "@/lib/evidence-pack";
import { normalizeScope } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = normalizeScope(searchParams.get("scope"));

    return NextResponse.json(
      buildEvidencePack({
        scope,
        work_id: searchParams.get("work_id"),
        publication_id: searchParams.get("publication_id"),
        delivery_id: searchParams.get("delivery_id"),
        target_ref: searchParams.get("target_ref"),
      }),
    );
  } catch (error) {
    if (error instanceof EvidencePackNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to build evidence pack.",
      },
      { status: 400 },
    );
  }
}
