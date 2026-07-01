import {
  AUTONOMY_RUNNER_PREFLIGHT_CACHE_CONTROL,
  AUTONOMY_RUNNER_PREFLIGHT_READONLY_HEADER,
  AUTONOMY_RUNNER_PREFLIGHT_READONLY_HEADER_VALUE,
  buildAutonomyRunnerPreflightRouteError,
  readAutonomyRunnerPreflightForRoute,
  validateAutonomyRunnerPreflightRouteRequest,
} from "@/lib/autonomy/autonomy-runner-preflight-source";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const READONLY_RESPONSE_HEADERS = {
  [AUTONOMY_RUNNER_PREFLIGHT_READONLY_HEADER]:
    AUTONOMY_RUNNER_PREFLIGHT_READONLY_HEADER_VALUE,
  "cache-control": AUTONOMY_RUNNER_PREFLIGHT_CACHE_CONTROL,
} as const;

export async function GET(request: Request) {
  try {
    const validation = validateAutonomyRunnerPreflightRouteRequest(request);

    if (!validation.ok) {
      return NextResponse.json(
        buildAutonomyRunnerPreflightRouteError({
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
      readAutonomyRunnerPreflightForRoute({ scope: validation.scope }),
      {
        status: 200,
        headers: READONLY_RESPONSE_HEADERS,
      },
    );
  } catch {
    return NextResponse.json(
      buildAutonomyRunnerPreflightRouteError({
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
