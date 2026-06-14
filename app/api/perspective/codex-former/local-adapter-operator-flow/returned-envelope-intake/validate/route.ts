import { validateCodexFormerLocalAdapterReturnedEnvelopeIntake } from "@/lib/perspective-ingest/codex-former-local-adapter-returned-envelope-intake";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  return NextResponse.json(
    validateCodexFormerLocalAdapterReturnedEnvelopeIntake(body),
    { status: 200 },
  );
}
