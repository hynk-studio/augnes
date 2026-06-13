import {
  PERSPECTIVE_MEMORY_ITEM_API_ROUTE,
  isPerspectiveMemoryItemStatus,
} from "@/lib/perspective-ingest/perspective-memory-item";
import {
  getPerspectiveMemoryItem,
  updatePerspectiveMemoryItemStatusInStore,
} from "@/lib/perspective-ingest/perspective-memory-item-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonBodyResult = { value: Record<string, unknown> } | { error: string };

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;
  const item = getPerspectiveMemoryItem(decodeURIComponent(itemId));
  if (!item) {
    return blockedResponse([`unknown perspective-memory item: ${itemId}`], 404);
  }
  return NextResponse.json({
    ok: true,
    route: `${PERSPECTIVE_MEMORY_ITEM_API_ROUTE}/${itemId}`,
    persistence_backend: "sqlite:lib/db.ts",
    result: { item },
    authority_boundary: item.authority_boundary,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;
  if (!acceptsJson(request)) {
    return blockedResponse(["Request content-type must be application/json."], 400);
  }
  const body = await parseJsonBody(request);
  if ("error" in body) return blockedResponse([body.error], 400);
  const value = body.value.item_status;
  if (!isPerspectiveMemoryItemStatus(value)) {
    return blockedResponse(
      [
        "item_status must be one of: accepted, reviewing, retracted, superseded, deprecated.",
      ],
      400,
    );
  }
  const result = updatePerspectiveMemoryItemStatusInStore({
    itemId: decodeURIComponent(itemId),
    itemStatus: value,
  });
  if (!result.ok) return blockedResponse(result.blocked_reasons, 404);
  return NextResponse.json({
    ok: true,
    route: `${PERSPECTIVE_MEMORY_ITEM_API_ROUTE}/${itemId}`,
    persistence_backend: "sqlite:lib/db.ts",
    result: { item: result.item },
    authority_boundary: result.item.authority_boundary,
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
      route: PERSPECTIVE_MEMORY_ITEM_API_ROUTE,
      result_state: "BLOCKED",
      blocked_reasons: blockedReasons,
      authority_boundary: {
        perspective_memory_item_created: false,
        core_decision_created: false,
        core_memory_created: false,
        state_entry_created: false,
        runtime_handoff_created: false,
        automatic_runtime_injection_created: false,
        automatic_promotion_created: false,
        provider_model_call_created: false,
        github_mutation_created: false,
      },
    },
    { status },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
