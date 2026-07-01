import {
  CODEX_LAUNCH_CARD_LOCAL_READONLY_VALUE,
  HANDOFF_CAPSULE_CACHE_CONTROL,
  HANDOFF_CAPSULE_LOCAL_READONLY_HEADER,
  buildCodexLaunchCardReadError,
  readCodexLaunchCardForRoute,
  validateCodexLaunchCardReadRequest,
} from "@/lib/handoff/handoff-capsule-source";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const READONLY_RESPONSE_HEADERS = {
  [HANDOFF_CAPSULE_LOCAL_READONLY_HEADER]:
    CODEX_LAUNCH_CARD_LOCAL_READONLY_VALUE,
  "cache-control": HANDOFF_CAPSULE_CACHE_CONTROL,
} as const;

export async function GET(request: Request) {
  try {
    const validation = validateCodexLaunchCardReadRequest(request);

    if (!validation.ok) {
      return NextResponse.json(
        buildCodexLaunchCardReadError({
          code: validation.code,
          status: validation.status,
          authorityBoundary: validation.authority_boundary,
        }),
        {
          status: validation.status,
          headers: READONLY_RESPONSE_HEADERS,
        },
      );
    }

    return NextResponse.json(
      readCodexLaunchCardForRoute({ scope: validation.scope }),
      {
        status: 200,
        headers: READONLY_RESPONSE_HEADERS,
      },
    );
  } catch {
    return NextResponse.json(
      buildCodexLaunchCardReadError({
        code: "unavailable",
        status: 500,
      }),
      {
        status: 500,
        headers: READONLY_RESPONSE_HEADERS,
      },
    );
  }
}
