import {
  ReadinessCheckValidationError,
  getPublicationReadinessCheck,
} from "@/lib/publication-readiness-checks";
import { normalizeScope } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ readiness_check_id: string }> },
) {
  const { readiness_check_id } = await params;

  try {
    const { searchParams } = new URL(request.url);
    const scopeParam = searchParams.get("scope");
    const scope = scopeParam ? normalizeScope(scopeParam) : null;
    const readinessCheck = getPublicationReadinessCheck(
      decodeURIComponent(readiness_check_id),
      scope,
    );

    if (!readinessCheck) {
      return NextResponse.json(
        { error: `Unknown readiness_check_id ${readiness_check_id}.` },
        { status: 404 },
      );
    }

    return NextResponse.json({
      scope: readinessCheck.scope,
      readiness_check: readinessCheck,
    });
  } catch (error) {
    if (error instanceof ReadinessCheckValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to read publication readiness check." },
      { status: 500 },
    );
  }
}
