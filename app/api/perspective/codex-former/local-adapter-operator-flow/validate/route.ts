import { runOperatorFlowLocalValidationBridge } from "@/lib/perspective-ingest/codex-former-local-adapter-operator-flow-local-validate";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  return NextResponse.json(runOperatorFlowLocalValidationBridge(body), {
    status: 200,
  });
}
