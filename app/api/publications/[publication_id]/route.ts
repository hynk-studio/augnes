import { getPublication } from "@/lib/publications";
import { normalizeScope } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ publication_id: string }> },
) {
  const { publication_id } = await params;
  const { searchParams } = new URL(request.url);
  const scopeParam = searchParams.get("scope");
  const scope = scopeParam ? normalizeScope(scopeParam) : null;
  const publication = getPublication(decodeURIComponent(publication_id), scope);

  if (!publication) {
    return NextResponse.json(
      { error: `Unknown publication_id ${publication_id}.` },
      { status: 404 },
    );
  }

  return NextResponse.json({ scope: publication.scope, publication });
}
