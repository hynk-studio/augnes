import {
  APPROVAL_REQUEST_STATUSES,
  ApprovalRequestValidationError,
  createPublicationApprovalRequest,
  listPublicationApprovalRequests,
  type ApprovalRequestInput,
  type ApprovalRequestStatus,
} from "@/lib/publication-approval-requests";
import { PublicationNotFoundError } from "@/lib/publications";
import { normalizeScope } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = normalizeScope(searchParams.get("scope"));
    const publicationId = searchParams.get("publication_id");
    const status = readOptionalStatus(searchParams.get("status"));
    const targetSurface = searchParams.get("target_surface");
    const limit = readOptionalLimit(searchParams.get("limit"));

    return NextResponse.json({
      scope,
      approval_requests: listPublicationApprovalRequests({
        scope,
        publicationId,
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
            : "Failed to list publication approval requests.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    rejectTargetOverride(body);
    const input: ApprovalRequestInput = {
      approval_request_id:
        readOptionalString(body, "approval_request_id") ?? undefined,
      scope: readOptionalString(body, "scope"),
      publication_id: requireString(body, "publication_id"),
      requested_by: requireString(body, "requested_by"),
      decision_prompt: requireString(body, "decision_prompt"),
      side_effect_summary: requireString(body, "side_effect_summary"),
      required_gate_checks: readOptionalStringArray(
        body,
        "required_gate_checks",
      ),
      authority_boundaries: readOptionalStringArray(
        body,
        "authority_boundaries",
      ),
      source_control_packet_ref: readOptionalString(
        body,
        "source_control_packet_ref",
      ),
      supersedes_request_id: readOptionalString(
        body,
        "supersedes_request_id",
      ),
      status: readOptionalBodyStatus(body, "status") ?? "requested",
      created_at: readOptionalString(body, "created_at") ?? undefined,
    };
    const approvalRequest = createPublicationApprovalRequest(input);

    return NextResponse.json(
      {
        scope: approvalRequest.scope,
        approval_request: approvalRequest,
      },
      { status: 201 },
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
            : "Failed to create publication approval request.",
      },
      { status: error instanceof ApprovalRequestValidationError ? 400 : 500 },
    );
  }
}

async function readJsonBody(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new ApprovalRequestValidationError(
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

    throw new ApprovalRequestValidationError("Request body must be valid JSON.");
  }
}

function rejectTargetOverride(record: Record<string, unknown>) {
  if (record.target_surface !== undefined || record.target_ref !== undefined) {
    throw new ApprovalRequestValidationError(
      "target_surface and target_ref overrides are not accepted. Approval requests copy the stored publication target.",
    );
  }
}

function requireString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApprovalRequestValidationError(`${key} is required.`);
  }

  return value.trim();
}

function readOptionalString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new ApprovalRequestValidationError(`${key} must be a string.`);
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
    throw new ApprovalRequestValidationError(`${key} must be a string array.`);
  }

  return value.map((item) => item.trim()).filter(Boolean);
}

function readOptionalStatus(value: string | null) {
  if (!value) {
    return null;
  }

  if (APPROVAL_REQUEST_STATUSES.includes(value as ApprovalRequestStatus)) {
    return value as ApprovalRequestStatus;
  }

  throw new ApprovalRequestValidationError(
    `status must be one of: ${APPROVAL_REQUEST_STATUSES.join(", ")}.`,
  );
}

function readOptionalBodyStatus(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === undefined || value === null) {
    return null;
  }

  if (
    typeof value === "string" &&
    APPROVAL_REQUEST_STATUSES.includes(value as ApprovalRequestStatus)
  ) {
    return value as ApprovalRequestStatus;
  }

  throw new ApprovalRequestValidationError(
    `${key} must be one of: ${APPROVAL_REQUEST_STATUSES.join(", ")}.`,
  );
}

function readOptionalLimit(value: string | null) {
  if (!value) {
    return undefined;
  }

  const limit = Number(value);
  if (!Number.isFinite(limit)) {
    throw new ApprovalRequestValidationError("limit must be a number.");
  }

  return limit;
}
