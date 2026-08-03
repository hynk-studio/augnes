import { loadCodexCurrentContinuityV01 } from "@/lib/vnext/codex-current-continuity/codex-current-continuity";
import {
  CODEX_CURRENT_CONTINUITY_CACHE_CONTROL_V01,
  CODEX_CURRENT_CONTINUITY_LOCAL_READONLY_HEADER_V01,
  buildCodexCurrentContinuityReadErrorV01,
  validateCodexCurrentContinuityReadRequestV01,
} from "@/lib/vnext/codex-current-continuity/codex-current-continuity-route";
import { CODEX_CURRENT_CONTINUITY_ROUTE_MARKER_V01 } from "@/types/vnext/codex-current-continuity";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const READONLY_RESPONSE_HEADERS = {
  [CODEX_CURRENT_CONTINUITY_LOCAL_READONLY_HEADER_V01]:
    CODEX_CURRENT_CONTINUITY_ROUTE_MARKER_V01,
  "cache-control": CODEX_CURRENT_CONTINUITY_CACHE_CONTROL_V01,
} as const;

export async function GET(request: Request) {
  const validation = validateCodexCurrentContinuityReadRequestV01(request);
  if (!validation.ok) {
    return NextResponse.json(
      buildCodexCurrentContinuityReadErrorV01(validation),
      { status: validation.status, headers: READONLY_RESPONSE_HEADERS },
    );
  }
  try {
    const projection = await loadCodexCurrentContinuityV01();
    return NextResponse.json(projection, {
      status: 200,
      headers: READONLY_RESPONSE_HEADERS,
    });
  } catch {
    return NextResponse.json(
      buildCodexCurrentContinuityReadErrorV01({
        code: "continuity_unavailable",
        status: 503,
      }),
      { status: 503, headers: READONLY_RESPONSE_HEADERS },
    );
  }
}
