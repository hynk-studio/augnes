import {
  PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_API_ROUTE,
  PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_STATUSES,
  isPerspectiveMemoryProductPersistenceBoundaryStatus,
} from "@/lib/perspective-ingest/perspective-memory-product-persistence-boundary";
import {
  getPerspectiveMemoryProductPersistenceBoundaryRecord,
  updatePerspectiveMemoryProductPersistenceBoundaryRecordStatusInStore,
} from "@/lib/perspective-ingest/perspective-memory-product-persistence-boundary-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonBodyResult =
  | { value: Record<string, unknown> }
  | { error: string };

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ recordId: string }> },
) {
  const { recordId } = await params;
  const record = getPerspectiveMemoryProductPersistenceBoundaryRecord(
    decodeURIComponent(recordId),
  );
  if (!record) {
    return blockedResponse([`unknown boundary record: ${recordId}`], 404);
  }
  return NextResponse.json({
    ok: true,
    route: `${PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_API_ROUTE}/${recordId}`,
    persistence_backend: "sqlite:lib/db.ts",
    result: { record },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ recordId: string }> },
) {
  const { recordId } = await params;
  if (!acceptsJson(request)) {
    return blockedResponse(["Request content-type must be application/json."], 400);
  }
  const body = await parseJsonBody(request);
  if ("error" in body) return blockedResponse([body.error], 400);
  const value = body.value.boundary_status;
  if (!isPerspectiveMemoryProductPersistenceBoundaryStatus(value)) {
    return blockedResponse(
      [
        `boundary_status must be one of: ${PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_STATUSES.join(", ")}.`,
      ],
      400,
    );
  }
  const result =
    updatePerspectiveMemoryProductPersistenceBoundaryRecordStatusInStore({
      recordId: decodeURIComponent(recordId),
      boundaryStatus: value,
    });
  if (!result.ok) return blockedResponse(result.blocked_reasons, 404);
  return NextResponse.json({
    ok: true,
    route: `${PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_API_ROUTE}/${recordId}`,
    persistence_backend: "sqlite:lib/db.ts",
    result: { record: result.record },
    authority_boundary: result.record.authority_boundary,
  });
}

async function parseJsonBody(request: Request): Promise<JsonBodyResult> {
  try {
    const text = await request.text();
    const value = text.trim().length > 0 ? JSON.parse(text) : null;
    if (!isRecord(value)) {
      return { error: "Request body must be a JSON object." };
    }
    return { value };
  } catch (error) {
    return {
      error: `Invalid JSON request body: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

function acceptsJson(request: Request) {
  return (request.headers.get("content-type") ?? "")
    .toLowerCase()
    .includes("application/json");
}

function blockedResponse(blockedReasons: string[], status: number) {
  return NextResponse.json(
    {
      ok: false,
      route: PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_API_ROUTE,
      result_state: "BLOCKED",
      blocked_reasons: blockedReasons,
      authority_boundary: {
        product_persistence_boundary_record_created: false,
        accepted_augnes_memory_created: false,
        product_memory_write_created: false,
        review_decision_created: false,
        core_decision_created: false,
        runtime_handoff_created: false,
        automatic_promotion: false,
      },
    },
    { status },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
