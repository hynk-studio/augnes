import { GITHUB_PR_COMMENT_TARGET_SURFACE } from "@/lib/github-pr-comment-target";
import { publishGitHubPrComment } from "@/lib/github-publication";
import {
  PublicationNotFoundError,
  PublicationValidationError,
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
    const dryRun = requireBoolean(body, "dry_run");
    const scope = readOptionalString(body, "scope");
    const result = await publishGitHubPrComment({
      publicationId: decodeURIComponent(publication_id),
      scope: scope ? normalizeScope(scope) : null,
      dryRun,
      idempotencyKey: requireString(body, "idempotency_key"),
      targetRefOverride: readOptionalString(body, "target_ref"),
      expectedTargetSurface:
        readOptionalString(body, "expected_target_surface") ??
        GITHUB_PR_COMMENT_TARGET_SURFACE,
      requestedBy:
        readOptionalString(body, "requested_by") ??
        readOptionalString(body, "approved_by"),
    });

    return NextResponse.json(
      {
        scope: result.publication.scope,
        ...result,
      },
      { status: result.error_message && !result.delivery ? 400 : 200 },
    );
  } catch (error) {
    if (error instanceof PublicationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to publish GitHub PR comment.",
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

function requireBoolean(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value !== "boolean") {
    throw new PublicationValidationError(
      `${key} must be explicitly provided as a boolean.`,
    );
  }

  return value;
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
