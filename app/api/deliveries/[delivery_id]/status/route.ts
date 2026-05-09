import {
  DELIVERY_STATUSES,
  DeliveryNotFoundError,
  PublicationValidationError,
  updateDeliveryStatus,
  type DeliveryStatus,
} from "@/lib/publications";
import { normalizeScope } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ delivery_id: string }> },
) {
  const { delivery_id } = await params;

  try {
    const body = await readJsonBody(request);
    const scope = readOptionalString(body, "scope");
    const delivery = updateDeliveryStatus({
      deliveryId: decodeURIComponent(delivery_id),
      scope: scope ? normalizeScope(scope) : null,
      status: requireStatus(body, "status"),
      sent_at: readOptionalString(body, "sent_at"),
      acknowledged_at: readOptionalString(body, "acknowledged_at"),
      error_message: readOptionalString(body, "error_message"),
    });

    return NextResponse.json({
      scope: delivery.scope,
      delivery,
    });
  } catch (error) {
    if (error instanceof DeliveryNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update delivery status.",
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
    DELIVERY_STATUSES.includes(value as DeliveryStatus)
  ) {
    return value as DeliveryStatus;
  }

  throw new PublicationValidationError(
    `${key} must be one of: ${DELIVERY_STATUSES.join(", ")}.`,
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
