import {
  HandoffGenerationError,
  createGeneratedHandoff,
} from "@/lib/handoff-builder";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const generated = createGeneratedHandoff({
      scope: readOptionalString(body, "scope"),
      work_id: requireString(body, "work_id"),
      target_agent: readOptionalString(body, "target_agent"),
      created_by: readOptionalString(body, "created_by"),
    });

    return NextResponse.json(
      {
        scope: generated.handoff.scope,
        handoff: generated.handoff,
        packet_text: generated.packet_text,
      },
      { status: 201 },
    );
  } catch (error) {
    const status = error instanceof HandoffGenerationError ? 404 : 400;

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate handoff.",
      },
      { status },
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

function readOptionalString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`${key} must be a string.`);
  }

  return value.trim() || null;
}
