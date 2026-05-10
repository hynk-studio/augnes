import {
  ApprovalDecisionValidationError,
  listPublicationApprovalDecisions,
} from "@/lib/publication-approval-decisions";
import { normalizeScope } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = normalizeScope(searchParams.get("scope"));
    const approvalRequestId = searchParams.get("approval_request_id");
    const publicationId = searchParams.get("publication_id");
    const targetSurface = searchParams.get("target_surface");
    const limit = readOptionalLimit(searchParams.get("limit"));

    return NextResponse.json({
      scope,
      approval_decisions: listPublicationApprovalDecisions({
        scope,
        approvalRequestId,
        publicationId,
        targetSurface,
        limit,
      }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to list publication approval decisions.",
      },
      { status: 400 },
    );
  }
}

function readOptionalLimit(value: string | null) {
  if (!value) {
    return undefined;
  }

  const limit = Number(value);
  if (!Number.isFinite(limit)) {
    throw new ApprovalDecisionValidationError("limit must be a number.");
  }

  return limit;
}
