import {
  CURRENT_WORKING_PERSPECTIVE_CACHE_CONTROL,
  CURRENT_WORKING_PERSPECTIVE_LOCAL_READ_HEADER,
  CURRENT_WORKING_PERSPECTIVE_LOCAL_READ_MARKER,
  buildCurrentWorkingPerspectiveReadError,
  buildCurrentWorkingPerspectiveRuntimeReadModel,
  validateCurrentWorkingPerspectiveReadRequest,
} from "@/lib/perspective/current-working-perspective-source";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const READONLY_RESPONSE_HEADERS = {
  [CURRENT_WORKING_PERSPECTIVE_LOCAL_READ_HEADER]:
    CURRENT_WORKING_PERSPECTIVE_LOCAL_READ_MARKER,
  "cache-control": CURRENT_WORKING_PERSPECTIVE_CACHE_CONTROL,
} as const;

export function GET(request: Request) {
  try {
    const validation = validateCurrentWorkingPerspectiveReadRequest(request);

    if (!validation.ok) {
      return NextResponse.json(
        buildCurrentWorkingPerspectiveReadError({
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
      buildCurrentWorkingPerspectiveRuntimeReadModel({ scope: validation.scope }),
      {
        status: 200,
        headers: READONLY_RESPONSE_HEADERS,
      },
    );
  } catch {
    return NextResponse.json(
      buildCurrentWorkingPerspectiveReadError({
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
