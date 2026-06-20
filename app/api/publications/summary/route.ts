import {
  buildApprovalPublicationEmptyRuntimeFallbackMetadata,
  getMissingApprovalPublicationOptionalTables,
} from "@/lib/empty-runtime-startup-fallback";
import {
  PUBLICATION_SUMMARY_BOUNDARIES,
  buildPublicationSummary,
} from "@/lib/publication-summary";
import { PublicationValidationError } from "@/lib/publications";
import { normalizeScope } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = normalizeScope(searchParams.get("scope"));

    return NextResponse.json(buildPublicationSummary({ scope }));
  } catch (error) {
    const missingTables = getMissingApprovalPublicationOptionalTables(error);

    if (missingTables.length > 0) {
      const { searchParams } = new URL(request.url);
      const scope = normalizeScope(searchParams.get("scope"));

      return NextResponse.json(
        buildEmptyPublicationSummaryFallback({
          scope,
          missingTables,
        }),
      );
    }

    if (!(error instanceof PublicationValidationError)) {
      throw error;
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to build publication summary.",
      },
      { status: 400 },
    );
  }
}

function buildEmptyPublicationSummaryFallback({
  scope,
  missingTables,
}: {
  scope: string;
  missingTables: ReturnType<typeof getMissingApprovalPublicationOptionalTables>;
}) {
  return {
    scope,
    as_of: new Date().toISOString(),
    summary: {
      drafts: [],
      approved_previews: [],
      sent: [],
      failed: [],
      cancelled: [],
      delivery_status: {
        pending_count: 0,
        sent_count: 0,
        failed_count: 0,
        acknowledged_count: 0,
      },
      failed_deliveries: [],
    },
    limits: {
      bounded_view: true,
      publication_limit: 200,
      delivery_limit: 200,
    },
    boundaries: [
      ...PUBLICATION_SUMMARY_BOUNDARIES,
      "Empty-runtime fallback: publication summary tables are missing, so this route returned empty read-only summary buckets.",
    ],
    ...buildApprovalPublicationEmptyRuntimeFallbackMetadata({
      route: "GET /api/publications/summary",
      scope,
      missingTables,
    }),
  };
}
