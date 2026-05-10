import {
  ApprovalDecisionValidationError,
  getPublicationApprovalDecision,
} from "@/lib/publication-approval-decisions";
import { normalizeScope } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ approval_decision_id: string }> },
) {
  const { approval_decision_id } = await params;

  try {
    const { searchParams } = new URL(request.url);
    const scopeParam = searchParams.get("scope");
    const scope = scopeParam ? normalizeScope(scopeParam) : null;
    const approvalDecision = getPublicationApprovalDecision(
      decodeURIComponent(approval_decision_id),
      scope,
    );

    if (!approvalDecision) {
      return NextResponse.json(
        { error: `Unknown approval_decision_id ${approval_decision_id}.` },
        { status: 404 },
      );
    }

    return NextResponse.json({
      scope: approvalDecision.scope,
      approval_decision: approvalDecision,
    });
  } catch (error) {
    if (error instanceof ApprovalDecisionValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to read publication approval decision." },
      { status: 500 },
    );
  }
}
