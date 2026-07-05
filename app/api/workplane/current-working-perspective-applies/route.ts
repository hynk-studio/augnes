import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  currentWorkingPerspectiveApplyWriteSchemaExistsV01,
  listCurrentWorkingPerspectiveApplyRecordsV01,
  readCurrentWorkingPerspectiveApplyRecordByAppliedSnapshotRefV01,
  readCurrentWorkingPerspectiveApplyRecordByIdV01,
  readCurrentWorkingPerspectiveApplyRecordByIdempotencyKeyV01,
  readLatestAppliedCurrentWorkingPerspectiveSnapshotV01,
  refuseCurrentWorkingPerspectiveApplyWriteV01,
  validateCurrentWorkingPerspectiveApplyWriteInputV01,
  writeCurrentWorkingPerspectiveApplyRecordV01,
  type CurrentWorkingPerspectiveApplyWriteDbLike,
} from "@/lib/workplane/current-working-perspective-apply-write";
import {
  CURRENT_WORKING_PERSPECTIVE_APPLY_SCOPE,
  CURRENT_WORKING_PERSPECTIVE_APPLY_STORE_VERSION,
  type CurrentWorkingPerspectiveApplyStoreResult,
} from "@/types/current-working-perspective-apply-write";

export const runtime = "nodejs";

const routeVersion =
  "current_working_perspective_apply_route.v0.1" as const;
const safeDbPathPrefixes = [
  "tmp/current-working-perspective-applies/",
  ".tmp/current-working-perspective-applies/",
] as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dbPath = url.searchParams.get("db_path") ?? "";
  if (!isSafeCurrentWorkingPerspectiveApplyRouteDbPathV01(dbPath)) {
    return jsonResponse(errorResponse("invalid_db_path"), 400);
  }

  const opened = openReadOnlyDb(dbPath);
  if ("errorCode" in opened) {
    return jsonResponse(errorResponse(opened.errorCode), opened.status);
  }

  const db = opened.db;
  try {
    if (!currentWorkingPerspectiveApplyWriteSchemaExistsV01(db)) {
      return jsonResponse(errorResponse("schema_missing"), 404);
    }
    const recordId = url.searchParams.get("record_id");
    const idempotencyKey = url.searchParams.get("idempotency_key");
    const appliedSnapshotRef = url.searchParams.get("applied_snapshot_ref");
    const latestAppliedSnapshot =
      url.searchParams.get("latest_applied_snapshot") === "true";
    const result = recordId
      ? readCurrentWorkingPerspectiveApplyRecordByIdV01(recordId, { db })
      : idempotencyKey
        ? readCurrentWorkingPerspectiveApplyRecordByIdempotencyKeyV01(
            idempotencyKey,
            { db },
          )
        : appliedSnapshotRef
          ? readCurrentWorkingPerspectiveApplyRecordByAppliedSnapshotRefV01(
              appliedSnapshotRef,
              { db },
            )
          : latestAppliedSnapshot
            ? readLatestAppliedCurrentWorkingPerspectiveSnapshotV01({ db })
            : listCurrentWorkingPerspectiveApplyRecordsV01({
                db,
                operator_ref: url.searchParams.get("operator_ref") || undefined,
                limit: parseRouteLimit(url.searchParams.get("limit")),
              });
    return jsonResponse(storeResponse(result), storeStatus(result));
  } finally {
    db.close();
  }
}

export async function POST(request: Request) {
  if (!requestHasSameOriginBoundary(request)) {
    return jsonResponse(errorResponse("same_origin_required"), 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(errorResponse("invalid_json_body"), 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonResponse(errorResponse("invalid_json_object"), 400);
  }

  const requestBody = body as {
    action?: unknown;
    db_path?: unknown;
    input?: unknown;
  };
  if (requestBody.action !== undefined && requestBody.action !== "write") {
    return jsonResponse(errorResponse("invalid_action"), 400);
  }
  if (
    !isSafeCurrentWorkingPerspectiveApplyRouteDbPathV01(
      requestBody.db_path,
    )
  ) {
    return jsonResponse(errorResponse("invalid_db_path"), 400);
  }

  const validation = validateCurrentWorkingPerspectiveApplyWriteInputV01(
    requestBody.input,
  );
  if (!validation.ok) {
    const result = refuseCurrentWorkingPerspectiveApplyWriteV01(
      requestBody.input,
    );
    return jsonResponse(storeResponse(result), storeStatus(result, true));
  }

  const db = openWriteDb(requestBody.db_path);
  try {
    const result = writeCurrentWorkingPerspectiveApplyRecordV01(
      requestBody.input,
      { db },
    );
    return jsonResponse(storeResponse(result), storeStatus(result, true));
  } finally {
    db.close();
  }
}

export function isSafeCurrentWorkingPerspectiveApplyRouteDbPathV01(
  value: unknown,
): value is string {
  if (typeof value !== "string") return false;
  if (!value.endsWith(".sqlite") && !value.endsWith(".db")) return false;
  if (value.startsWith("/") || /^[A-Za-z]:/.test(value)) return false;
  if (
    value.includes("\\") ||
    value.includes("//") ||
    value.includes("..") ||
    value.includes("\0")
  ) {
    return false;
  }
  if (!safeDbPathPrefixes.some((prefix) => value.startsWith(prefix))) {
    return false;
  }
  return !hasPrivateMarker(value);
}

function requestHasSameOriginBoundary(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) {
    return false;
  }
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  const effectiveHost = request.headers.get("x-forwarded-host") ?? host;
  if (!effectiveHost) return false;
  if (!origin) return isLocalTestHost(effectiveHost);
  try {
    return new URL(origin).host.toLowerCase() === effectiveHost.toLowerCase();
  } catch {
    return false;
  }
}

function isLocalTestHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();
  return (
    /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(normalized) ||
    /^\[::1\](:\d+)?$/.test(normalized)
  );
}

function openReadOnlyDb(
  dbPath: string,
):
  | {
      db: Database.Database &
        CurrentWorkingPerspectiveApplyWriteDbLike;
    }
  | { errorCode: "db_missing"; status: 404 } {
  const resolvedPath = resolve(process.cwd(), dbPath);
  if (!existsSync(resolvedPath)) return { errorCode: "db_missing", status: 404 };
  try {
    return {
      db: new Database(resolvedPath, { readonly: true, fileMustExist: true }),
    };
  } catch {
    return { errorCode: "db_missing", status: 404 };
  }
}

function openWriteDb(
  dbPath: string,
): Database.Database & CurrentWorkingPerspectiveApplyWriteDbLike {
  const resolvedPath = resolve(process.cwd(), dbPath);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  return new Database(resolvedPath);
}

function storeStatus(
  result: CurrentWorkingPerspectiveApplyStoreResult,
  fromCreate = false,
): number {
  if (result.status === "written") return fromCreate ? 201 : 200;
  if (result.status === "idempotent_existing") return 200;
  if (result.status === "read" || result.status === "listed") return 200;
  if (result.status === "not_found" || result.status === "schema_missing") {
    return 404;
  }
  return 400;
}

function storeResponse(result: CurrentWorkingPerspectiveApplyStoreResult) {
  return {
    route_version: routeVersion,
    scope: CURRENT_WORKING_PERSPECTIVE_APPLY_SCOPE,
    status: result.ok ? "ok" : "error",
    error_code: result.error_code,
    store_version: CURRENT_WORKING_PERSPECTIVE_APPLY_STORE_VERSION,
    store_result: result,
    record: result.record,
    records: result.records,
    applied_snapshot: result.applied_snapshot,
    applied_snapshots: result.applied_snapshots,
    receipt: result.receipt,
    current_working_perspective_apply_record_written:
      result.status === "written",
    current_working_perspective_apply_receipt_written:
      result.status === "written",
    current_working_perspective_apply_persisted:
      result.status === "written",
    applied_current_working_perspective_snapshot_written:
      result.status === "written",
    current_working_perspective_update_applied_to_local_snapshot:
      result.status === "written",
    upstream_current_working_perspective_source_tables_updated: false,
    upstream_current_working_perspective_source_tables_mutated: false,
    current_working_perspective_route_response_replaced: false,
    perspective_unit_written: false,
    next_work_bias_written: false,
    continuity_relay_written: false,
    continuity_relay_updated: false,
    live_relay_state_applied: false,
    handoff_context_mutated: false,
    handoff_context_applied: false,
    selected_refs_written_to_live_handoff: false,
    handoff_sent: false,
    memory_written: false,
    memory_promoted: false,
    memory_mutated: false,
    dogfood_metrics_written: false,
    dogfood_metrics_global_state_updated: false,
    dogfood_metric_snapshot_written: false,
    reuse_outcome_ledger_written: false,
    expected_observed_delta_written: false,
    work_episode_written: false,
    provider_called: false,
    github_called: false,
    codex_executed: false,
    pr_created: false,
    pr_merged: false,
    autonomous_action_run: false,
    graph_or_vector_store_created: false,
    rag_stack_created: false,
    browser_observed: false,
    crawler_or_browser_observer_created: false,
    workbench_action_button_rendered: false,
    no_side_effects: result.no_side_effects,
  };
}

function errorResponse(errorCode: string) {
  return {
    route_version: routeVersion,
    scope: CURRENT_WORKING_PERSPECTIVE_APPLY_SCOPE,
    status: "error",
    error_code: errorCode,
    store_version: CURRENT_WORKING_PERSPECTIVE_APPLY_STORE_VERSION,
    current_working_perspective_apply_record_written: false,
    current_working_perspective_apply_receipt_written: false,
    current_working_perspective_apply_persisted: false,
    applied_current_working_perspective_snapshot_written: false,
    current_working_perspective_update_applied_to_local_snapshot: false,
    upstream_current_working_perspective_source_tables_updated: false,
    upstream_current_working_perspective_source_tables_mutated: false,
    current_working_perspective_route_response_replaced: false,
    perspective_unit_written: false,
    next_work_bias_written: false,
    continuity_relay_written: false,
    continuity_relay_updated: false,
    live_relay_state_applied: false,
    handoff_context_mutated: false,
    handoff_context_applied: false,
    selected_refs_written_to_live_handoff: false,
    handoff_sent: false,
    memory_written: false,
    memory_promoted: false,
    memory_mutated: false,
    dogfood_metrics_written: false,
    dogfood_metrics_global_state_updated: false,
    dogfood_metric_snapshot_written: false,
    reuse_outcome_ledger_written: false,
    expected_observed_delta_written: false,
    work_episode_written: false,
    provider_called: false,
    github_called: false,
    codex_executed: false,
    pr_created: false,
    pr_merged: false,
    autonomous_action_run: false,
    graph_or_vector_store_created: false,
    rag_stack_created: false,
    browser_observed: false,
    crawler_or_browser_observer_created: false,
    workbench_action_button_rendered: false,
  };
}

function parseRouteLimit(value: string | null): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return 50;
  return Math.max(1, Math.min(parsed, 100));
}

function hasPrivateMarker(value: string): boolean {
  return /token|secret|password|private|credential|key/i.test(value);
}

function jsonResponse(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-augnes-current-working-perspective-apply-route":
        routeVersion,
    },
  });
}
