import { runLocalTool, validateToolName } from "@/lib/actions/local-tools";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const scope =
      typeof body.scope === "string" && body.scope.trim()
        ? body.scope.trim()
        : "project:augnes";
    const toolName = validateToolName(body.tool_name);

    return NextResponse.json(
      {
        scope,
        result: runLocalTool({ scope, toolName }),
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to run action.",
      },
      { status: 400 },
    );
  }
}
