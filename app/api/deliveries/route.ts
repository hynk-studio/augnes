import {
  DELIVERY_STATUSES,
  PublicationNotFoundError,
  PublicationValidationError,
  createDelivery,
  listDeliveries,
  type DeliveryRecordInput,
  type DeliveryStatus,
} from "@/lib/publications";
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
      deliveries: listDeliveries({
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
          error instanceof Error ? error.message : "Failed to list deliveries.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const input: DeliveryRecordInput = {
      delivery_id: readOptionalString(body, "delivery_id") ?? undefined,
      publication_id: requireString(body, "publication_id"),
      scope: readOptionalString(body, "scope"),
      target_surface: readOptionalString(body, "target_surface"),
      target_ref: readOptionalString(body, "target_ref"),
      status: readOptionalBodyStatus(body, "status") ?? "pending",
      sent_at: readOptionalString(body, "sent_at"),
      acknowledged_at: readOptionalString(body, "acknowledged_at"),
      error_message: readOptionalString(body, "error_message"),
      idempotency_key: readOptionalString(body, "idempotency_key"),
      created_at: readOptionalString(body, "created_at") ?? undefined,
    };
    const result = createDelivery(input);

    return NextResponse.json(
      {
        scope: result.delivery.scope,
        delivery: result.delivery,
        idempotent_replay: result.idempotent_replay || undefined,
      },
      { status: result.created ? 201 : 200 },
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
            : "Failed to create delivery record.",
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

  if (DELIVERY_STATUSES.includes(value as DeliveryStatus)) {
    return value as DeliveryStatus;
  }

  throw new PublicationValidationError(
    `status must be one of: ${DELIVERY_STATUSES.join(", ")}.`,
  );
}

function readOptionalBodyStatus(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === undefined || value === null) {
    return null;
  }

  if (
    typeof value === "string" &&
    DELIVERY_STATUSES.includes(value as DeliveryStatus)
  ) {
    return value as DeliveryStatus;
  }

  throw new PublicationValidationError(
    `${key} must be one of: ${DELIVERY_STATUSES.join(", ")}.`,
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
