import {
  HandoffReviewError,
  createCodexResultReviewDraft,
  type SkippedCheck,
} from "@/lib/handoff-review";
import { type HandoffRecord } from "@/lib/handoffs";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const result = createCodexResultReviewDraft({
      scope: readOptionalString(body, "scope"),
      handoff_id: readOptionalString(body, "handoff_id"),
      handoff: readOptionalHandoff(body, "handoff"),
      actual_files_changed: readOptionalStringArray(
        body,
        "actual_files_changed",
      ),
      actual_state_keys: readOptionalStringArray(body, "actual_state_keys"),
      actual_checks: readOptionalStringArray(body, "actual_checks"),
      actual_execution_surfaces: readOptionalStringArray(
        body,
        "actual_execution_surfaces",
      ),
      result_status: readOptionalString(body, "result_status"),
      result_kind: readOptionalString(body, "result_kind"),
      result_summary: requireString(body, "result_summary"),
      related_pr: readOptionalString(body, "related_pr"),
      blockers_or_failures: readOptionalStringArray(
        body,
        "blockers_or_failures",
      ),
      skipped_checks: readOptionalSkippedChecks(body, "skipped_checks"),
    });

    return NextResponse.json(
      {
        ...result,
        boundaries: {
          review_only: true,
          records_are_drafts_only: true,
          codex_execution: false,
          proof_recording: false,
          state_commit_or_reject: false,
          external_publication: false,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to review Codex result.",
      },
      { status: error instanceof HandoffReviewError ? 400 : 500 },
    );
  }
}

async function readJsonBody(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("Request body must be a JSON object.");
    }

    return body as Record<string, unknown>;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Request body must be a JSON object."
    ) {
      throw error;
    }

    throw new Error("Request body must be valid JSON.");
  }
}

function requireString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HandoffReviewError(`${key} is required.`);
  }

  return value.trim();
}

function readOptionalString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new HandoffReviewError(`${key} must be a string.`);
  }

  return value.trim() || null;
}

function readOptionalStringArray(
  record: Record<string, unknown>,
  key: string,
) {
  const value = record[key];
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new HandoffReviewError(`${key} must be an array of strings.`);
  }

  return value.map((item) => {
    if (typeof item !== "string") {
      throw new HandoffReviewError(`${key} must be an array of strings.`);
    }

    return item.trim();
  });
}

function readOptionalSkippedChecks(
  record: Record<string, unknown>,
  key: string,
): Array<string | SkippedCheck> {
  const value = record[key];
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new HandoffReviewError(
      `${key} must be an array of strings or { check, reason } objects.`,
    );
  }

  return value.map((item) => {
    if (typeof item === "string") {
      return item;
    }

    if (item && typeof item === "object" && !Array.isArray(item)) {
      const candidate = item as Record<string, unknown>;
      if (typeof candidate.check === "string") {
        return {
          check: candidate.check,
          reason:
            typeof candidate.reason === "string"
              ? candidate.reason
              : "reason not provided",
        };
      }
    }

    throw new HandoffReviewError(
      `${key} must be an array of strings or { check, reason } objects.`,
    );
  });
}

function readOptionalHandoff(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === undefined || value === null) {
    return null;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HandoffReviewError(`${key} must be a handoff object.`);
  }

  return value as HandoffRecord;
}
