import { listStateDeltaProposals, type StateDeltaProposal } from "@/lib/db";
import type { ConsolidationStatus } from "@/lib/runtime/candidate-scoring";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set(["pending", "committed", "rejected"]);
const VALID_CONSOLIDATION_STATUSES = new Set([
  "candidate",
  "reinforced",
  "ready",
  "needs_review",
  "expired",
  "committed",
  "rejected",
]);

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") ?? "project:augnes";
  const status = searchParams.get("status");
  const consolidationStatus = searchParams.get("consolidation_status");
  const includeExpired = searchParams.get("include_expired") === "true";

  if (status && !VALID_STATUSES.has(status)) {
    return NextResponse.json(
      { error: "status must be pending, committed, or rejected." },
      { status: 400 },
    );
  }

  if (
    consolidationStatus &&
    !VALID_CONSOLIDATION_STATUSES.has(consolidationStatus)
  ) {
    return NextResponse.json(
      {
        error:
          "consolidation_status must be candidate, reinforced, ready, needs_review, expired, committed, or rejected.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    scope,
    proposals: listStateDeltaProposals({
      scope,
      status: status as StateDeltaProposal["status"] | undefined,
      consolidation_status: consolidationStatus as
        | ConsolidationStatus
        | undefined,
      include_expired: includeExpired,
    }),
  });
}
