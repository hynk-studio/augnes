import { buildWorkBrief, normalizeScope, normalizeWorkId } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ work_id: string }> },
) {
  const { work_id } = await params;
  const { searchParams } = new URL(request.url);
  const scope = normalizeScope(searchParams.get("scope"));
  const workId = normalizeWorkId(work_id);
  const brief = buildWorkBrief(workId, scope);

  if (!brief) {
    return NextResponse.json(
      { error: `Unknown work_id ${workId} for scope ${scope}.` },
      { status: 404 },
    );
  }

  return NextResponse.json(brief);
}
