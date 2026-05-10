import { buildApprovalGateStateSummary } from "@/lib/approval-gate-state-summary";
import {
  APPROVAL_REQUEST_STATUSES,
  ApprovalRequestValidationError,
  type ApprovalRequestStatus,
} from "@/lib/publication-approval-requests";
import { PublicationValidationError } from "@/lib/publications";
import { normalizeScope } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = normalizeScope(searchParams.get("scope"));
    const publicationId = searchParams.get("publication_id");
    const status = readOptionalStatus(searchParams.get("status"));
    const targetSurface = searchParams.get("target_surface");
    const limit = readOptionalLimit(searchParams.get("limit"));

    return NextResponse.json(
      buildApprovalGateStateSummary({
        scope,
        publicationId,
        status,
        targetSurface,
        limit,
      }),
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to build approval gate-state summary.",
      },
      {
        status:
          error instanceof ApprovalRequestValidationError ||
          error instanceof PublicationValidationError
            ? 400
            : 500,
      },
    );
  }
}

function readOptionalStatus(value: string | null) {
  if (!value) {
    return null;
  }

  if (APPROVAL_REQUEST_STATUSES.includes(value as ApprovalRequestStatus)) {
    return value as ApprovalRequestStatus;
  }

  throw new ApprovalRequestValidationError(
    `status must be one of: ${APPROVAL_REQUEST_STATUSES.join(", ")}.`,
  );
}

function readOptionalLimit(value: string | null) {
  if (!value) {
    return undefined;
  }

  const limit = Number(value);
  if (!Number.isFinite(limit)) {
    throw new ApprovalRequestValidationError("limit must be a number.");
  }

  return limit;
}
