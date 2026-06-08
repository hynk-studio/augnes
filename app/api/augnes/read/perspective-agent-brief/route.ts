import {
  buildPerspectiveAgentBriefReadError,
  buildPerspectiveAgentBriefReadResponse,
  validatePerspectiveAgentBriefReadRequest,
} from "@/lib/readonly-api/perspective-agent-brief";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    const validation = validatePerspectiveAgentBriefReadRequest(request);

    if (!validation.ok) {
      return NextResponse.json(
        buildPerspectiveAgentBriefReadError({
          code: validation.code,
          status: validation.status,
          authorityBoundary: validation.authority_boundary,
        }),
        { status: validation.status },
      );
    }

    return NextResponse.json(
      buildPerspectiveAgentBriefReadResponse({
        source: validation.source,
        selectedNodeId: validation.selected_node_id,
      }),
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      buildPerspectiveAgentBriefReadError({
        code: "unavailable",
        status: 500,
      }),
      { status: 500 },
    );
  }
}
