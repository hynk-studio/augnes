import { listStateDeltaProposals, type StateDeltaProposal } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set(["pending", "committed", "rejected"]);

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") ?? "project:augnes";
  const status = searchParams.get("status");

  if (status && !VALID_STATUSES.has(status)) {
    return NextResponse.json(
      { error: "status must be pending, committed, or rejected." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    scope,
    proposals: listStateDeltaProposals({
      scope,
      status: status as StateDeltaProposal["status"] | undefined,
    }),
  });
}
