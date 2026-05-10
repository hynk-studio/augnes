import {
  ReadinessCheckValidationError,
  checkPublicationReadiness,
  type ReadinessCheckInput,
} from "@/lib/publication-readiness-checks";
import {
  ApprovalDecisionNotFoundError,
  ApprovalDecisionValidationError,
} from "@/lib/publication-approval-decisions";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ approval_decision_id: string }> },
) {
  const { approval_decision_id } = await params;

  try {
    const body = await readJsonBody(request);
    rejectUnsupportedFields(body);
    const input: ReadinessCheckInput = {
      readiness_check_id:
        readOptionalString(body, "readiness_check_id") ?? undefined,
      scope: readOptionalString(body, "scope"),
      approval_decision_id: decodeURIComponent(approval_decision_id),
      checked_by: requireString(body, "checked_by"),
      source_control_packet_ref: readOptionalString(
        body,
        "source_control_packet_ref",
      ),
      checked_at: readOptionalString(body, "checked_at") ?? undefined,
    };
    const result = checkPublicationReadiness(input);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ApprovalDecisionNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to run publication readiness check.",
      },
      {
        status:
          error instanceof ReadinessCheckValidationError ||
          error instanceof ApprovalDecisionValidationError
            ? 400
            : 500,
      },
    );
  }
}

async function readJsonBody(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new ReadinessCheckValidationError(
        "Request body must be a JSON object.",
      );
    }

    return body as Record<string, unknown>;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Request body must be a JSON object."
    ) {
      throw error;
    }

    throw new ReadinessCheckValidationError("Request body must be valid JSON.");
  }
}

function rejectUnsupportedFields(record: Record<string, unknown>) {
  const unsupportedKeys = [
    "dry_run",
    "dryRun",
    "publish",
    "actual_publish",
    "retry",
    "idempotency_key",
    "idempotencyKey",
    "delivery_id",
    "delivery_status",
    "target_ref",
    "target_surface",
    "target_override",
    "expected_target_surface",
    "github_token",
    "GITHUB_TOKEN",
    "token",
    "post_to_github",
    "post_to_discord",
    "proof",
    "record_proof",
  ].filter((key) => record[key] !== undefined);

  if (unsupportedKeys.length > 0) {
    throw new ReadinessCheckValidationError(
      `${unsupportedKeys.join(", ")} ${
        unsupportedKeys.length === 1 ? "is" : "are"
      } not accepted by the dry-run readiness route. It checks readiness only and does not publish, retry, create delivery rows, use tokens, or record proof.`,
    );
  }
}

function requireString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ReadinessCheckValidationError(`${key} is required.`);
  }

  return value.trim();
}

function readOptionalString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new ReadinessCheckValidationError(`${key} must be a string.`);
  }

  return value.trim() || null;
}
