import {
  listStateDeltaProposals,
  listStateEntries,
  updateStateDeltaProposalScoring,
} from "@/lib/db";
import { consolidateCandidates } from "@/lib/runtime/consolidation";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_SCOPE = "project:augnes";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  try {
    const scope = readScope(body);
    const now = new Date().toISOString();
    const proposals = listStateDeltaProposals({
      scope,
      status: "pending",
      include_expired: true,
    });
    const currentState = listStateEntries(scope);
    const result = consolidateCandidates({
      proposals,
      currentState,
      now,
    });
    const updatedProposals = updateStateDeltaProposalScoring(result.updates);

    return NextResponse.json({
      scope,
      evaluated_count: result.evaluated_count,
      ready_count: result.ready_count,
      needs_review_count: result.needs_review_count,
      reinforced_count: result.reinforced_count,
      expired_count: result.expired_count,
      updates: updatedProposals,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to consolidate candidates.",
      },
      { status: 400 },
    );
  }
}

function readScope(body: unknown) {
  if (!isRecord(body) || body.scope === undefined) {
    return DEFAULT_SCOPE;
  }

  if (typeof body.scope !== "string" || body.scope.trim().length === 0) {
    throw new Error("scope must be a non-empty string.");
  }

  return body.scope.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
