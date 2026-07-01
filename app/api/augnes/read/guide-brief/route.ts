import {
  GUIDE_BRIEF_CACHE_CONTROL,
  GUIDE_BRIEF_LOCAL_READONLY_HEADER,
  GUIDE_BRIEF_LOCAL_READONLY_VALUE,
  buildGuideBriefReadError,
  readGuideBriefForRoute,
  validateGuideBriefReadRequest,
} from "@/lib/guide/guide-brief-source";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const READONLY_RESPONSE_HEADERS = {
  [GUIDE_BRIEF_LOCAL_READONLY_HEADER]: GUIDE_BRIEF_LOCAL_READONLY_VALUE,
  "cache-control": GUIDE_BRIEF_CACHE_CONTROL,
} as const;

export async function GET(request: Request) {
  try {
    const validation = validateGuideBriefReadRequest(request);

    if (!validation.ok) {
      return NextResponse.json(
        buildGuideBriefReadError({
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
      readGuideBriefForRoute({ scope: validation.scope }),
      {
        status: 200,
        headers: READONLY_RESPONSE_HEADERS,
      },
    );
  } catch {
    return NextResponse.json(
      buildGuideBriefReadError({
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
