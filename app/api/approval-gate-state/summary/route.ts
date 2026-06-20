import {
  APPROVAL_GATE_STATE_BOUNDARIES,
  buildApprovalGateStateSummary,
} from "@/lib/approval-gate-state-summary";
import {
  buildApprovalPublicationEmptyRuntimeFallbackMetadata,
  getMissingApprovalPublicationOptionalTables,
} from "@/lib/empty-runtime-startup-fallback";
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
    const missingTables = getMissingApprovalPublicationOptionalTables(error);

    if (missingTables.length > 0) {
      const { searchParams } = new URL(request.url);
      const scope = normalizeScope(searchParams.get("scope"));
      const limit = readFallbackLimit(searchParams.get("limit"));

      return NextResponse.json(
        buildEmptyApprovalGateStateFallback({
          scope,
          limit,
          missingTables,
        }),
      );
    }

    if (
      !(error instanceof ApprovalRequestValidationError) &&
      !(error instanceof PublicationValidationError)
    ) {
      throw error;
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to build approval gate-state summary.",
      },
      {
        status: 400,
      },
    );
  }
}

function buildEmptyApprovalGateStateFallback({
  scope,
  limit,
  missingTables,
}: {
  scope: string;
  limit: number;
  missingTables: ReturnType<typeof getMissingApprovalPublicationOptionalTables>;
}) {
  return {
    scope,
    as_of: new Date().toISOString(),
    summary: {
      requested: [],
      blocked_or_not_ready: [],
      ready_for_future_approval_review: [],
      approved_for_future_publish_readiness: [],
      dry_run_ready_for_future_publish: [],
      dry_run_blocked: [],
      stale_or_mismatched: [],
      terminal_or_inactive: {
        superseded_count: 0,
        cancelled_count: 0,
        expired_count: 0,
      },
    },
    counts: {
      requested_count: 0,
      blocked_count: 0,
      ready_for_review_count: 0,
      approved_count: 0,
      dry_run_ready_count: 0,
      dry_run_blocked_count: 0,
      superseded_count: 0,
      cancelled_count: 0,
      expired_count: 0,
    },
    limits: {
      bounded_view: true,
      approval_request_limit: limit,
      delivery_limit: 200,
    },
    boundaries: [
      ...APPROVAL_GATE_STATE_BOUNDARIES,
      "Empty-runtime fallback: approval/publication gate tables are missing, so this route returned empty read-only gate buckets.",
    ],
    ...buildApprovalPublicationEmptyRuntimeFallbackMetadata({
      route: "GET /api/approval-gate-state/summary",
      scope,
      missingTables,
    }),
  };
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

function readFallbackLimit(value: string | null) {
  return readOptionalLimit(value) ?? 50;
}
