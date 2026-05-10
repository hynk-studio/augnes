import { getPublicationApprovalRequest } from "@/lib/publication-approval-requests";
import { normalizeScope } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ approval_request_id: string }> },
) {
  const { approval_request_id } = await params;
  const { searchParams } = new URL(request.url);
  const scopeParam = searchParams.get("scope");
  const scope = scopeParam ? normalizeScope(scopeParam) : null;
  const approvalRequest = getPublicationApprovalRequest(
    decodeURIComponent(approval_request_id),
    scope,
  );

  if (!approvalRequest) {
    return NextResponse.json(
      { error: `Unknown approval_request_id ${approval_request_id}.` },
      { status: 404 },
    );
  }

  return NextResponse.json({
    scope: approvalRequest.scope,
    approval_request: approvalRequest,
  });
}
