import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  listSelectedSessionDigestIngestRecordsV01,
  readSelectedSessionDigestIngestRecordByIdempotencyKeyV01,
  readSelectedSessionDigestIngestRecordByIdV01,
  refuseSelectedSessionDigestIngestWriteV01,
  selectedSessionDigestIngestWriteSchemaExistsV01,
  validateSelectedSessionDigestIngestWriteInputV01,
  writeSelectedSessionDigestIngestRecordV01,
  type SelectedSessionDigestIngestWriteDbLike,
} from "@/lib/intake/selected-session-digest-ingest-write";
import {
  SELECTED_SESSION_DIGEST_INGEST_SCOPE,
  SELECTED_SESSION_DIGEST_INGEST_STORE_VERSION,
  type SelectedSessionDigestIngestStoreResult,
} from "@/types/selected-session-digest-ingest-write";

export const runtime = "nodejs";

const routeVersion = "selected_session_digest_ingest_record_route.v0.1" as const;
const safeIngestRecordDbPathPrefixes = [
  "tmp/selected-session-digest-ingest-records/",
  ".tmp/selected-session-digest-ingest-records/",
] as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dbPath = url.searchParams.get("db_path") ?? "";
  if (!isSafeSelectedSessionDigestIngestRecordRouteDbPathV01(dbPath)) {
    return jsonResponse(errorResponse("invalid_db_path"), 400);
  }

  const opened = openReadOnlyIngestRecordDb(dbPath);
  if ("errorCode" in opened) {
    return jsonResponse(errorResponse(opened.errorCode), opened.status);
  }

  const db = opened.db;
  try {
    if (!selectedSessionDigestIngestWriteSchemaExistsV01(db)) {
      return jsonResponse(errorResponse("schema_missing"), 404);
    }
    const recordId = url.searchParams.get("record_id");
    const idempotencyKey = url.searchParams.get("idempotency_key");
    const result = recordId
      ? readSelectedSessionDigestIngestRecordByIdV01(recordId, { db })
      : idempotencyKey
        ? readSelectedSessionDigestIngestRecordByIdempotencyKeyV01(
            idempotencyKey,
            { db },
          )
        : listSelectedSessionDigestIngestRecordsV01({
            db,
            idempotency_key:
              url.searchParams.get("idempotency_key") || undefined,
            operator_ref: url.searchParams.get("operator_ref") || undefined,
            source_kind: url.searchParams.get("source_kind") || undefined,
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
  const dbPath = requestBody.db_path;
  if (!isSafeSelectedSessionDigestIngestRecordRouteDbPathV01(dbPath)) {
    return jsonResponse(errorResponse("invalid_db_path"), 400);
  }

  const validation = validateSelectedSessionDigestIngestWriteInputV01(
    requestBody.input,
  );
  if (!validation.ok) {
    const result = refuseSelectedSessionDigestIngestWriteV01(requestBody.input);
    return jsonResponse(storeResponse(result), storeStatus(result, true));
  }

  const db = openWriteIngestRecordDb(dbPath);
  try {
    const result = writeSelectedSessionDigestIngestRecordV01(
      requestBody.input,
      { db },
    );
    return jsonResponse(storeResponse(result), storeStatus(result, true));
  } finally {
    db.close();
  }
}

export function isSafeSelectedSessionDigestIngestRecordRouteDbPathV01(
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
  if (!safeIngestRecordDbPathPrefixes.some((prefix) => value.startsWith(prefix))) {
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
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return false;
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

function openReadOnlyIngestRecordDb(
  dbPath: string,
):
  | { db: Database.Database & SelectedSessionDigestIngestWriteDbLike }
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

function openWriteIngestRecordDb(
  dbPath: string,
): Database.Database & SelectedSessionDigestIngestWriteDbLike {
  const resolvedPath = resolve(process.cwd(), dbPath);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  return new Database(resolvedPath);
}

function storeStatus(
  result: SelectedSessionDigestIngestStoreResult,
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

function storeResponse(result: SelectedSessionDigestIngestStoreResult) {
  return {
    route_version: routeVersion,
    scope: SELECTED_SESSION_DIGEST_INGEST_SCOPE,
    status: result.ok ? "ok" : "error",
    error_code: result.error_code,
    store_version: SELECTED_SESSION_DIGEST_INGEST_STORE_VERSION,
    store_result: result,
    record: result.record,
    records: result.records,
    receipt: result.receipt,
    selected_session_digest_ingest_record_written:
      result.status === "written",
    selected_session_digest_ingest_receipt_written:
      result.status === "written",
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
    scope: SELECTED_SESSION_DIGEST_INGEST_SCOPE,
    status: "error",
    error_code: errorCode,
    store_version: SELECTED_SESSION_DIGEST_INGEST_STORE_VERSION,
    selected_session_digest_ingest_record_written: false,
    selected_session_digest_ingest_receipt_written: false,
    memory_mutated: false,
    current_working_perspective_updated: false,
    perspective_unit_written: false,
    next_work_bias_written: false,
    continuity_relay_written: false,
    handoff_context_mutated: false,
    handoff_sent: false,
    no_side_effects: {
      selected_session_digest_ingest_record_written: false,
      selected_session_digest_ingest_receipt_written: false,
      selected_session_digest_persisted_as_candidate_record: false,
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

function jsonResponse(response: unknown, status = 200) {
  return NextResponse.json(response, { status });
}

function parseRouteLimit(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function hasPrivateMarker(value: string): boolean {
  const normalized = value.toLowerCase();
  return [
    "/users/",
    "\\users\\",
    "/home/",
    "file://",
    ".env",
    "sk-",
    "ghp_",
    "github_pat_",
    "xoxb-",
    "password:",
    "secret:",
  ].some((marker) => normalized.includes(marker));
}
