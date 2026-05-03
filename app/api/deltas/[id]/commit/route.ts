import { commitStateDeltaProposal } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    return NextResponse.json({
      result: commitStateDeltaProposal(id),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to commit proposal.";

    return NextResponse.json(
      { error: message },
      { status: message === "Proposal not found." ? 404 : 409 },
    );
  }
}
