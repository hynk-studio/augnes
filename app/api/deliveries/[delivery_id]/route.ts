import { getDelivery } from "@/lib/publications";
import { normalizeScope } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ delivery_id: string }> },
) {
  const { delivery_id } = await params;
  const { searchParams } = new URL(request.url);
  const scopeParam = searchParams.get("scope");
  const scope = scopeParam ? normalizeScope(scopeParam) : null;
  const delivery = getDelivery(decodeURIComponent(delivery_id), scope);

  if (!delivery) {
    return NextResponse.json(
      { error: `Unknown delivery_id ${delivery_id}.` },
      { status: 404 },
    );
  }

  return NextResponse.json({ scope: delivery.scope, delivery });
}
