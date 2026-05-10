import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Legacy publication-id GitHub PR comment publish route is disabled. Use POST /api/publication-readiness-checks/{readiness_check_id}/publish/github-pr-comment so C1-C4 Core gates, readiness freshness, idempotency, and explicit target approval are enforced.",
      required_route:
        "/api/publication-readiness-checks/{readiness_check_id}/publish/github-pr-comment",
      boundaries: [
        "Approval is not publication.",
        "Dry-run readiness is not publication.",
        "C5 publish must be Core-gated from a fresh readiness_check_id.",
        "This disabled route does not call the GitHub adapter, use GITHUB_TOKEN, create delivery rows, post externally, record proof, update mailbox, or commit/reject state.",
      ],
    },
    { status: 410 },
  );
}
