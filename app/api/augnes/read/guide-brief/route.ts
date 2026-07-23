import {
  GUIDE_BRIEF_CACHE_CONTROL_V02,
  GUIDE_BRIEF_LOCAL_READONLY_HEADER_V02,
  buildProjectGuideBriefReadErrorV02,
  validateProjectGuideBriefReadRequestV02,
} from "@/lib/vnext/guide-brief/project-guide-brief-route";
import { loadProjectGuideBriefV02 } from "@/lib/vnext/guide-brief/project-guide-brief-source";
import { GUIDE_BRIEF_ROUTE_MARKER_V02 } from "@/types/vnext/guide-brief";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const READONLY_RESPONSE_HEADERS = {
  [GUIDE_BRIEF_LOCAL_READONLY_HEADER_V02]: GUIDE_BRIEF_ROUTE_MARKER_V02,
  "cache-control": GUIDE_BRIEF_CACHE_CONTROL_V02,
} as const;

export async function GET(request: Request) {
  try {
    const validation = validateProjectGuideBriefReadRequestV02(request);

    if (!validation.ok) {
      return NextResponse.json(
        buildProjectGuideBriefReadErrorV02({
          code: validation.code,
          status: validation.status,
          authority_boundary: validation.authority_boundary,
        }),
        {
          status: validation.status,
          headers: READONLY_RESPONSE_HEADERS,
        },
      );
    }

    const bundle = await loadProjectGuideBriefV02({ project_id: validation.project_id });
    if (validation.project_id && bundle.source.project_resolution !== "resolved") {
      return NextResponse.json(
        buildProjectGuideBriefReadErrorV02({ code: "project_unavailable", status: 404 }),
        { status: 404, headers: READONLY_RESPONSE_HEADERS },
      );
    }
    return NextResponse.json(bundle.guide, {
      status: 200,
      headers: READONLY_RESPONSE_HEADERS,
    });
  } catch {
    return NextResponse.json(
      buildProjectGuideBriefReadErrorV02({
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
