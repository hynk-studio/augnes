import { buildPlan, validatePlanRequest } from "@/lib/planner/planner";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const planRequest = validatePlanRequest(await request.json());
    return NextResponse.json(await buildPlan(planRequest));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to build plan.",
      },
      { status: 400 },
    );
  }
}
