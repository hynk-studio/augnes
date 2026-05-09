import {
  PUBLICATION_STATUSES,
  PublicationNotFoundError,
  PublicationValidationError,
  updatePublicationStatus,
  type PublicationStatus,
} from "@/lib/publications";
import { normalizeScope } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ publication_id: string }> },
) {
  const { publication_id } = await params;

  try {
    const body = await readJsonBody(request);
    const scope = readOptionalString(body, "scope");
    const publication = updatePublicationStatus({
      publicationId: decodeURIComponent(publication_id),
      scope: scope ? normalizeScope(scope) : null,
      status: requireStatus(body, "status"),
      approved_by: readOptionalString(body, "approved_by"),
      sent_at: readOptionalString(body, "sent_at"),
    });

    return NextResponse.json({
      scope: publication.scope,
      publication,
    });
  } catch (error) {
    if (error instanceof PublicationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update publication status.",
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

function requireStatus(record: Record<string, unknown>, key: string) {
  const value = record[key];
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
