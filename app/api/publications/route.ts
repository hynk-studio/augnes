import {
  PUBLICATION_STATUSES,
  PublicationValidationError,
  createPublication,
  listPublications,
  type PublicationDraftInput,
  type PublicationStatus,
} from "@/lib/publications";
import { normalizeScope } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = normalizeScope(searchParams.get("scope"));
    const workId = searchParams.get("work_id");
    const status = readOptionalStatus(searchParams.get("status"));
    const targetSurface = searchParams.get("target_surface");
    const limit = readOptionalLimit(searchParams.get("limit"));

    return NextResponse.json({
      scope,
      publications: listPublications({
        scope,
        workId,
        status,
        targetSurface,
        limit,
      }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to list publications.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const input: PublicationDraftInput = {
      publication_id: readOptionalString(body, "publication_id") ?? undefined,
      scope: readOptionalString(body, "scope"),
      work_id: readOptionalString(body, "work_id"),
      source_event_id: readOptionalString(body, "source_event_id"),
      target_surface: requireString(body, "target_surface"),
      target_ref: requireString(body, "target_ref"),
      status: readOptionalBodyStatus(body, "status") ?? "draft",
      preview_body: requireString(body, "preview_body"),
      created_by: requireString(body, "created_by"),
      approved_by: readOptionalString(body, "approved_by"),
      created_at: readOptionalString(body, "created_at") ?? undefined,
      sent_at: readOptionalString(body, "sent_at"),
    };
    const publication = createPublication(input);

    return NextResponse.json(
      {
        scope: publication.scope,
        publication,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create publication.",
      },
      { status: error instanceof PublicationValidationError ? 400 : 500 },
    );
  }
}

async function readJsonBody(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new PublicationValidationError("Request body must be a JSON object.");
    }

    return body as Record<string, unknown>;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Request body must be a JSON object."
    ) {
      throw error;
    }

    throw new PublicationValidationError("Request body must be valid JSON.");
  }
}

function requireString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new PublicationValidationError(`${key} is required.`);
  }

  return value.trim();
}

function readOptionalString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new PublicationValidationError(`${key} must be a string.`);
  }

  return value.trim() || null;
}

function readOptionalStatus(value: string | null) {
  if (!value) {
    return null;
  }

  if (PUBLICATION_STATUSES.includes(value as PublicationStatus)) {
    return value as PublicationStatus;
  }

  throw new PublicationValidationError(
    `status must be one of: ${PUBLICATION_STATUSES.join(", ")}.`,
  );
}

function readOptionalBodyStatus(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === undefined || value === null) {
    return null;
  }

  if (
    typeof value === "string" &&
    PUBLICATION_STATUSES.includes(value as PublicationStatus)
  ) {
    return value as PublicationStatus;
  }

  throw new PublicationValidationError(
    `${key} must be one of: ${PUBLICATION_STATUSES.join(", ")}.`,
  );
}

function readOptionalLimit(value: string | null) {
  if (!value) {
    return undefined;
  }

  const limit = Number(value);
  if (!Number.isFinite(limit)) {
    throw new PublicationValidationError("limit must be a number.");
  }

  return limit;
}
