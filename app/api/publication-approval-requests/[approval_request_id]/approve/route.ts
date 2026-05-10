import {
  APPROVAL_DECISION_AUTHORITY_BOUNDARIES,
  ApprovalDecisionConflictError,
  ApprovalDecisionValidationError,
  approvePublicationApprovalRequest,
  type ApprovalDecisionInput,
} from "@/lib/publication-approval-decisions";
import {
  ApprovalRequestNotFoundError,
  ApprovalRequestValidationError,
} from "@/lib/publication-approval-requests";
import { PublicationNotFoundError } from "@/lib/publications";
import { normalizeScope } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ approval_request_id: string }> },
) {
  const { approval_request_id } = await params;

  try {
    const body = await readJsonBody(request);
    rejectUnsupportedOverrides(body);
    const input: ApprovalDecisionInput = {
      approval_decision_id:
        readOptionalString(body, "approval_decision_id") ?? undefined,
      scope: readOptionalString(body, "scope"),
      approval_request_id: decodeURIComponent(approval_request_id),
      decided_by: requireString(body, "decided_by"),
      decision_reason: requireString(body, "decision_reason"),
      gate_checks: readOptionalStringArray(body, "gate_checks"),
      authority_boundaries: readOptionalStringArray(
        body,
        "authority_boundaries",
      ),
      source_control_packet_ref: readOptionalString(
        body,
        "source_control_packet_ref",
      ),
      decided_at: readOptionalString(body, "decided_at") ?? undefined,
    };
    const result = approvePublicationApprovalRequest(input);

    return NextResponse.json(
      {
        ...result,
        boundaries: APPROVAL_DECISION_AUTHORITY_BOUNDARIES,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ApprovalRequestNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof PublicationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ApprovalDecisionConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to approve publication approval request.",
      },
      {
        status:
          error instanceof ApprovalDecisionValidationError ||
          error instanceof ApprovalRequestValidationError
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
      throw new ApprovalDecisionValidationError(
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

    throw new ApprovalDecisionValidationError(
      "Request body must be valid JSON.",
    );
  }
}

function rejectUnsupportedOverrides(record: Record<string, unknown>) {
  const unsupportedKeys = [
    "status",
    "decision",
    "publication_id",
    "target_surface",
    "target_ref",
    "dry_run",
    "idempotency_key",
    "idempotencyKey",
    "publish",
    "retry",
    "delivery_id",
    "delivery_status",
    "github_token",
    "GITHUB_TOKEN",
    "target_override",
    "expected_target_surface",
    "actual_publish",
    "post_to_github",
    "post_to_discord",
    "proof",
    "record_proof",
  ].filter((key) => record[key] !== undefined);

  if (unsupportedKeys.length > 0) {
    throw new ApprovalDecisionValidationError(
      `${unsupportedKeys.join(", ")} ${
        unsupportedKeys.length === 1 ? "is" : "are"
      } not accepted by the approve route. It grants only an approved decision for the stored approval request target.`,
    );
  }
}

function requireString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApprovalDecisionValidationError(`${key} is required.`);
  }

  return value.trim();
}

function readOptionalString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new ApprovalDecisionValidationError(`${key} must be a string.`);
  }

  return value.trim() || null;
}

function readOptionalStringArray(
  record: Record<string, unknown>,
  key: string,
) {
  const value = record[key];
  if (value === undefined || value === null) {
    return undefined;
  }

  if (
    !Array.isArray(value) ||
    value.some((item) => typeof item !== "string")
  ) {
    throw new ApprovalDecisionValidationError(`${key} must be a string array.`);
  }

  return value.map((item) => item.trim()).filter(Boolean);
}
