import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  listProjectHistoryIntakeRecordsV01,
  projectHistoryIntakeWriteSchemaExistsV01,
  readProjectHistoryIntakeRecordByIdempotencyKeyV01,
  readProjectHistoryIntakeRecordByIdV01,
  refuseProjectHistoryIntakeWriteV01,
  validateProjectHistoryIntakeWriteInputV01,
  writeProjectHistoryIntakeRecordV01,
  type ProjectHistoryIntakeWriteDbLike,
} from "@/lib/intake/project-history-intake-write";
import {
  PROJECT_HISTORY_INTAKE_SCOPE,
  PROJECT_HISTORY_INTAKE_STORE_VERSION,
  type ProjectHistoryIntakeStoreResult,
} from "@/types/project-history-intake-write";

export const runtime = "nodejs";

const routeVersion = "project_history_intake_record_route.v0.1" as const;
const safeProjectHistoryDbPathPrefixes = [
  "tmp/project-history-intake-records/",
  ".tmp/project-history-intake-records/",
] as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dbPath = url.searchParams.get("db_path") ?? "";
  if (!isSafeProjectHistoryIntakeRecordRouteDbPathV01(dbPath)) {
    return jsonResponse(errorResponse("invalid_db_path"), 400);
  }

  const opened = openReadOnlyProjectHistoryDb(dbPath);
  if ("errorCode" in opened) {
    return jsonResponse(errorResponse(opened.errorCode), opened.status);
  }

  const db = opened.db;
  try {
    if (!projectHistoryIntakeWriteSchemaExistsV01(db)) {
      return jsonResponse(errorResponse("schema_missing"), 404);
    }
    const recordId = url.searchParams.get("record_id");
    const idempotencyKey = url.searchParams.get("idempotency_key");
    const result = recordId
      ? readProjectHistoryIntakeRecordByIdV01(recordId, { db })
      : idempotencyKey
        ? readProjectHistoryIntakeRecordByIdempotencyKeyV01(idempotencyKey, {
            db,
          })
        : listProjectHistoryIntakeRecordsV01({
            db,
            operator_ref: url.searchParams.get("operator_ref") || undefined,
            project_ref: url.searchParams.get("project_ref") || undefined,
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
  if (!isSafeProjectHistoryIntakeRecordRouteDbPathV01(requestBody.db_path)) {
    return jsonResponse(errorResponse("invalid_db_path"), 400);
  }

  const validation = validateProjectHistoryIntakeWriteInputV01(
    requestBody.input,
  );
  if (!validation.ok) {
    const result = refuseProjectHistoryIntakeWriteV01(requestBody.input);
    return jsonResponse(storeResponse(result), storeStatus(result, true));
  }

  const db = openWriteProjectHistoryDb(requestBody.db_path);
  try {
    const result = writeProjectHistoryIntakeRecordV01(requestBody.input, { db });
    return jsonResponse(storeResponse(result), storeStatus(result, true));
  } finally {
    db.close();
  }
}

export function isSafeProjectHistoryIntakeRecordRouteDbPathV01(
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
  if (!safeProjectHistoryDbPathPrefixes.some((prefix) => value.startsWith(prefix))) {
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
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (!host) return false;
  if (forwardedHost && forwardedHost.toLowerCase() !== host.toLowerCase()) {
    return false;
  }
  if (!origin) return isLocalTestHost(host);
  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
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

function openReadOnlyProjectHistoryDb(
  dbPath: string,
):
  | { db: Database.Database & ProjectHistoryIntakeWriteDbLike }
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

function openWriteProjectHistoryDb(
  dbPath: string,
): Database.Database & ProjectHistoryIntakeWriteDbLike {
  const resolvedPath = resolve(process.cwd(), dbPath);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  return new Database(resolvedPath);
}

function storeStatus(
  result: ProjectHistoryIntakeStoreResult,
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

function storeResponse(result: ProjectHistoryIntakeStoreResult) {
  return {
    route_version: routeVersion,
    scope: PROJECT_HISTORY_INTAKE_SCOPE,
    status: result.ok ? "ok" : "error",
    error_code: result.error_code,
    store_version: PROJECT_HISTORY_INTAKE_STORE_VERSION,
    store_result: result,
    record: result.record,
    records: result.records,
    receipt: result.receipt,
    project_history_intake_record_written: result.status === "written",
    project_history_intake_receipt_written: result.status === "written",
    memory_mutated: false,
    current_working_perspective_updated: false,
    perspective_unit_written: false,
    next_work_bias_written: false,
    continuity_relay_written: false,
    handoff_context_mutated: false,
    handoff_sent: false,
    no_side_effects: result.no_side_effects,
  };
}

function errorResponse(errorCode: string) {
  return {
    route_version: routeVersion,
    scope: PROJECT_HISTORY_INTAKE_SCOPE,
    status: "error",
    error_code: errorCode,
    store_version: PROJECT_HISTORY_INTAKE_STORE_VERSION,
    project_history_intake_record_written: false,
    project_history_intake_receipt_written: false,
    memory_mutated: false,
    current_working_perspective_updated: false,
    perspective_unit_written: false,
    next_work_bias_written: false,
    continuity_relay_written: false,
    handoff_context_mutated: false,
    handoff_sent: false,
    no_side_effects: {
      project_history_intake_record_written: false,
      project_history_intake_receipt_written: false,
      project_history_persisted_as_candidate_record: false,
      memory_mutated: false,
      current_working_perspective_updated: false,
      perspective_unit_written: false,
      next_work_bias_written: false,
      continuity_relay_written: false,
      handoff_context_mutated: false,
      selected_refs_written_to_live_handoff: false,
      handoff_sent: false,
      dogfood_metrics_written: false,
      reuse_ledger_written: false,
      provider_called: false,
      github_called: false,
      codex_executed: false,
      pr_created: false,
      pr_merged: false,
      autonomous_action_run: false,
      graph_or_vector_store_created: false,
      rag_stack_created: false,
      crawler_or_browser_observer_created: false,
    },
  };
}

function jsonResponse(body: unknown, status: number) {
  return NextResponse.json(body, { status });
}

function parseRouteLimit(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function hasPrivateMarker(value: string): boolean {
  return (
    /(^|\/)\.env(\b|$)/i.test(value) ||
    value.includes("/Users") ||
    value.includes("/home") ||
    /password\s*:/i.test(value) ||
    /secret\s*:/i.test(value)
  );
}
