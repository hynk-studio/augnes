import {
  AUTONOMY_CONTRACT_CACHE_CONTROL,
  AUTONOMY_CONTRACT_LOCAL_READONLY_HEADER,
  AUTONOMY_CONTRACT_LOCAL_READONLY_VALUE,
  buildAutonomyContractReadError,
  readAutonomyContractForRoute,
  validateAutonomyContractReadRequest,
} from "@/lib/autonomy/autonomy-contract-source";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const READONLY_RESPONSE_HEADERS = {
  [AUTONOMY_CONTRACT_LOCAL_READONLY_HEADER]:
    AUTONOMY_CONTRACT_LOCAL_READONLY_VALUE,
  "cache-control": AUTONOMY_CONTRACT_CACHE_CONTROL,
} as const;

export async function GET(request: Request) {
  try {
    const validation = validateAutonomyContractReadRequest(request);

    if (!validation.ok) {
      return NextResponse.json(
        buildAutonomyContractReadError({
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
      readAutonomyContractForRoute({ scope: validation.scope }),
      {
        status: 200,
        headers: READONLY_RESPONSE_HEADERS,
      },
    );
  } catch {
    return NextResponse.json(
      buildAutonomyContractReadError({
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
