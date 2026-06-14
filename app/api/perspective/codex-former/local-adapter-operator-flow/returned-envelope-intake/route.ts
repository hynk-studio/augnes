import { listCodexFormerLocalAdapterReturnedEnvelopeIntakeRefs } from "@/lib/perspective-ingest/codex-former-local-adapter-returned-envelope-intake";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    listCodexFormerLocalAdapterReturnedEnvelopeIntakeRefs(),
    { status: 200 },
  );
}
