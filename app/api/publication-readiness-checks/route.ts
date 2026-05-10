import {
  READINESS_CHECK_STATUSES,
  ReadinessCheckValidationError,
  listPublicationReadinessChecks,
  type ReadinessCheckStatus,
} from "@/lib/publication-readiness-checks";
import { normalizeScope } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = normalizeScope(searchParams.get("scope"));
    const publicationId = searchParams.get("publication_id");
    const approvalDecisionId = searchParams.get("approval_decision_id");
    const status = readOptionalStatus(searchParams.get("status"));
    const targetSurface = searchParams.get("target_surface");
    const limit = readOptionalLimit(searchParams.get("limit"));

    return NextResponse.json({
      scope,
      readiness_checks: listPublicationReadinessChecks({
        scope,
        publicationId,
        approvalDecisionId,
        status,
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
            : "Failed to list publication readiness checks.",
      },
      { status: 400 },
    );
  }
}

function readOptionalStatus(value: string | null) {
  if (!value) {
    return null;
  }

  if (READINESS_CHECK_STATUSES.includes(value as ReadinessCheckStatus)) {
    return value as ReadinessCheckStatus;
  }

  throw new ReadinessCheckValidationError(
    `status must be one of: ${READINESS_CHECK_STATUSES.join(", ")}.`,
  );
}

function readOptionalLimit(value: string | null) {
  if (!value) {
    return undefined;
  }

  const limit = Number(value);
  if (!Number.isFinite(limit)) {
    throw new ReadinessCheckValidationError("limit must be a number.");
  }

  return limit;
}
