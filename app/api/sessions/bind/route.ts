import {
  bindSession,
  SessionBindingValidationError,
  SessionNotFoundError,
} from "@/lib/session-binding";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const binding = bindSession({
      session_id: readRequiredString(body, "session_id"),
      scope: readOptionalString(body, "scope"),
      surface: readRequiredString(body, "surface"),
      actor: readOptionalString(body, "actor"),
      related_work_id: readOptionalString(body, "related_work_id"),
      related_pr: readOptionalString(body, "related_pr"),
      summary: readOptionalString(body, "summary"),
      handoff_ref: readOptionalString(body, "handoff_ref"),
      evidence_pack_ref: readOptionalString(body, "evidence_pack_ref"),
    });

    return NextResponse.json({ scope: binding.scope, binding }, { status: 201 });
  } catch (error) {
    if (error instanceof SessionNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to bind session metadata.",
      },
      {
        status: error instanceof SessionBindingValidationError ? 400 : 400,
      },
    );
  }
}

async function readJsonBody(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new SessionBindingValidationError("Request body must be a JSON object.");
    }

    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof SessionBindingValidationError) {
      throw error;
    }

    throw new SessionBindingValidationError("Request body must be valid JSON.");
  }
}

function readRequiredString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new SessionBindingValidationError(`${key} is required.`);
  }

  return value.trim();
}

function readOptionalString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new SessionBindingValidationError(`${key} must be a string.`);
  }

  return value.trim() || null;
}
