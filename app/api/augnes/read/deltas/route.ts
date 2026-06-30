import {
  AUGNES_DELTA_PROJECTION_CACHE_CONTROL,
  AUGNES_DELTA_PROJECTION_LOCAL_READ_HEADER,
  AUGNES_DELTA_PROJECTION_LOCAL_READ_MARKER,
  buildAugnesDeltaProjectionReadError,
  buildAugnesDeltaProjectionRuntimeReadModel,
  validateAugnesDeltaProjectionReadRequest,
} from "@/lib/augnes-delta/source-collector";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const READONLY_RESPONSE_HEADERS = {
  [AUGNES_DELTA_PROJECTION_LOCAL_READ_HEADER]:
    AUGNES_DELTA_PROJECTION_LOCAL_READ_MARKER,
  "cache-control": AUGNES_DELTA_PROJECTION_CACHE_CONTROL,
} as const;

export function GET(request: Request) {
  try {
    const validation = validateAugnesDeltaProjectionReadRequest(request);

    if (!validation.ok) {
      return NextResponse.json(
        buildAugnesDeltaProjectionReadError({
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
      buildAugnesDeltaProjectionRuntimeReadModel({ scope: validation.scope }),
      {
        status: 200,
        headers: READONLY_RESPONSE_HEADERS,
      },
    );
  } catch {
    return NextResponse.json(
      buildAugnesDeltaProjectionReadError({
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
