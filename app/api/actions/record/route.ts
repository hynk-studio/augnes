import { recordExternalAction } from "@/lib/actions/local-tools";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const scope = requireString(body, "scope");
    const sourceAgentId = requireString(body, "source_agent_id");
    const actionName = requireString(body, "action_name");
    const resultSummary = requireString(body, "result_summary");
    const filesChanged = Array.isArray(body.files_changed)
      ? body.files_changed.filter(
          (file): file is string => typeof file === "string",
        )
      : [];

    return NextResponse.json(
      {
        scope,
        result: recordExternalAction({
          scope,
          sourceAgentId,
          actionName,
          resultSummary,
          filesChanged,
        }),
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to record external action.",
      },
      { status: 400 },
    );
  }
}

function requireString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} is required.`);
  }

  return value.trim();
}
