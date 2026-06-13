import {
  PERSPECTIVE_MEMORY_ITEM_API_ROUTE,
  isPerspectiveMemoryItemKind,
  isPerspectiveMemoryItemStatus,
  type PerspectiveMemoryItemKind,
  type PerspectiveMemoryItemStatus,
} from "@/lib/perspective-ingest/perspective-memory-item";
import {
  createPerspectiveMemoryItemFromBoundaryRecord,
  listPerspectiveMemoryItems,
} from "@/lib/perspective-ingest/perspective-memory-item-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonBodyResult = { value: Record<string, unknown> } | { error: string };
type StatusParseResult = { value: PerspectiveMemoryItemStatus | null } | { error: string };
type KindParseResult = { value: PerspectiveMemoryItemKind | null } | { error: string };
type LimitParseResult = { value: number | null } | { error: string };

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const itemStatus = parseItemStatus(searchParams.get("item_status"));
  if ("error" in itemStatus) return blockedResponse([itemStatus.error], 400);
  const memoryKind = parseMemoryKind(searchParams.get("memory_kind"));
  if ("error" in memoryKind) return blockedResponse([memoryKind.error], 400);
  const limit = parseLimit(searchParams.get("limit"));
  if ("error" in limit) return blockedResponse([limit.error], 400);
  const items = listPerspectiveMemoryItems({
    itemStatus: itemStatus.value,
    memoryKind: memoryKind.value,
    sourceBoundaryRecordId: searchParams.get("source_boundary_record_id"),
    limit: limit.value,
  });
  return NextResponse.json({
    ok: true,
    route: PERSPECTIVE_MEMORY_ITEM_API_ROUTE,
    persistence_backend: "sqlite:lib/db.ts",
    result: items,
    authority_boundary: {
      perspective_memory_items_read: true,
      core_decision_created: false,
      core_memory_created: false,
      runtime_handoff_created: false,
      automatic_runtime_injection_created: false,
      automatic_promotion_created: false,
      provider_model_call_created: false,
      github_mutation_created: false,
    },
  });
}

export async function POST(request: Request) {
  if (!acceptsJson(request)) {
    return blockedResponse(["Request content-type must be application/json."], 400);
  }
  const body = await parseJsonBody(request);
  if ("error" in body) return blockedResponse([body.error], 400);
  const sourceBoundaryRecordId = body.value.source_boundary_record_id;
  if (typeof sourceBoundaryRecordId !== "string" || sourceBoundaryRecordId.trim() === "") {
    return blockedResponse(["source_boundary_record_id is required."], 400);
  }
  const userConfirmation = body.value.user_confirmation;
  if (!isRecord(userConfirmation)) {
    return blockedResponse(["user_confirmation is required."], 400);
  }
  const result = createPerspectiveMemoryItemFromBoundaryRecord({
    sourceBoundaryRecordId,
    userConfirmation: {
      user_confirmed_create_persisted_perspective_memory_item:
        userConfirmation.user_confirmed_create_persisted_perspective_memory_item ===
        true,
      user_confirmed_not_core_decision:
        userConfirmation.user_confirmed_not_core_decision === true,
      user_confirmed_no_automatic_runtime_injection:
        userConfirmation.user_confirmed_no_automatic_runtime_injection === true,
      user_confirmed_source_boundary_record_preserved:
        userConfirmation.user_confirmed_source_boundary_record_preserved === true,
    },
  });
  if (!result.ok) return blockedResponse(result.blocked_reasons, 400);
  return NextResponse.json(
    {
      ok: true,
      route: PERSPECTIVE_MEMORY_ITEM_API_ROUTE,
      persistence_backend: "sqlite:lib/db.ts",
      created: result.created,
      idempotent_replay: result.idempotent_replay,
      result: { item: result.item },
      recommended_next_step:
        "Review the persisted perspective-memory item. This is not a Core decision or automatic runtime injection.",
    },
    { status: result.created ? 201 : 200 },
  );
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

function parseItemStatus(value: string | null): StatusParseResult {
  if (!value) return { value: null };
  if (!isPerspectiveMemoryItemStatus(value)) {
    return { error: `item_status is not supported: ${value}` };
  }
  return { value };
}

function parseMemoryKind(value: string | null): KindParseResult {
  if (!value) return { value: null };
  if (!isPerspectiveMemoryItemKind(value)) {
    return { error: `memory_kind is not supported: ${value}` };
  }
  return { value };
}

function parseLimit(value: string | null): LimitParseResult {
  if (!value) return { value: null };
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return { error: "limit must be a positive number." };
  }
  return { value: Math.trunc(parsed) };
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
