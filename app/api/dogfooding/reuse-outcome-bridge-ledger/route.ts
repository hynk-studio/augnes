import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  handoffReuseOutcomeLedgerStoreSchemaExistsV01,
  type HandoffReuseOutcomeLedgerDbLike,
} from "@/lib/dogfooding/handoff-reuse-outcome-ledger";
import {
  listReuseOutcomeBridgeLedgerRecordsV01,
  readReuseOutcomeBridgeLedgerRecordByIdV01,
  readReuseOutcomeBridgeLedgerRecordByIdempotencyKeyV01,
  refuseReuseOutcomeBridgeLedgerWriteV01,
  validateReuseOutcomeBridgeLedgerWriteInputV01,
  writeReuseOutcomeBridgeLedgerRecordV01,
} from "@/lib/dogfooding/reuse-outcome-bridge-ledger-write";
import {
  HANDOFF_REUSE_OUTCOME_LEDGER_SCOPE,
  HANDOFF_REUSE_OUTCOME_LEDGER_STORE_VERSION,
} from "@/types/handoff-reuse-outcome-ledger";
import type { ReuseOutcomeBridgeLedgerStoreResult } from "@/types/reuse-outcome-bridge-ledger-write";

export const runtime = "nodejs";

const routeVersion = "reuse_outcome_bridge_ledger_route.v0.1" as const;
const safeLedgerDbPathPrefixes = [
  "tmp/dogfood-reuse-ledger/",
  ".tmp/dogfood-reuse-ledger/",
] as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dbPath = url.searchParams.get("db_path") ?? "";
  if (!isSafeReuseOutcomeBridgeLedgerRouteDbPathV01(dbPath)) {
    return jsonResponse(errorResponse("invalid_db_path"), 400);
  }

  const opened = openReadOnlyLedgerDb(dbPath);
  if ("errorCode" in opened) {
    return jsonResponse(errorResponse(opened.errorCode), opened.status);
  }

  const db = opened.db;
  try {
    if (!handoffReuseOutcomeLedgerStoreSchemaExistsV01(db)) {
      return jsonResponse(errorResponse("schema_missing"), 404);
    }
    const recordId = url.searchParams.get("record_id");
    const idempotencyKey = url.searchParams.get("idempotency_key");
    const result = recordId
      ? readReuseOutcomeBridgeLedgerRecordByIdV01(recordId, { db })
      : idempotencyKey
        ? readReuseOutcomeBridgeLedgerRecordByIdempotencyKeyV01(
            idempotencyKey,
            { db },
          )
        : listReuseOutcomeBridgeLedgerRecordsV01(
            {
              result_report_ref:
                url.searchParams.get("result_ref") ||
                url.searchParams.get("result_report_ref") ||
                undefined,
              operator_ref: url.searchParams.get("operator_ref") || undefined,
              work_ref: url.searchParams.get("work_ref") || undefined,
              handoff_ref: url.searchParams.get("handoff_ref") || undefined,
              limit: parseRouteLimit(url.searchParams.get("limit")),
            },
            { db },
          );
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
  if (!isSafeReuseOutcomeBridgeLedgerRouteDbPathV01(requestBody.db_path)) {
    return jsonResponse(errorResponse("invalid_db_path"), 400);
  }

  const validation = validateReuseOutcomeBridgeLedgerWriteInputV01(
    requestBody.input,
  );
  if (!validation.ok) {
    const result = refuseReuseOutcomeBridgeLedgerWriteV01(requestBody.input);
    return jsonResponse(storeResponse(result), storeStatus(result, true));
  }

  const db = openWriteLedgerDb(requestBody.db_path);
  try {
    const result = writeReuseOutcomeBridgeLedgerRecordV01(requestBody.input, {
      db,
    });
    return jsonResponse(storeResponse(result), storeStatus(result, true));
  } finally {
    db.close();
  }
}

export function isSafeReuseOutcomeBridgeLedgerRouteDbPathV01(
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
  if (!safeLedgerDbPathPrefixes.some((prefix) => value.startsWith(prefix))) {
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

function openReadOnlyLedgerDb(
  dbPath: string,
):
  | { db: Database.Database & HandoffReuseOutcomeLedgerDbLike }
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

function openWriteLedgerDb(
  dbPath: string,
): Database.Database & HandoffReuseOutcomeLedgerDbLike {
  const resolvedPath = resolve(process.cwd(), dbPath);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  return new Database(resolvedPath);
}

function storeStatus(
  result: ReuseOutcomeBridgeLedgerStoreResult,
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

function storeResponse(result: ReuseOutcomeBridgeLedgerStoreResult) {
  return {
    route_version: routeVersion,
    scope: HANDOFF_REUSE_OUTCOME_LEDGER_SCOPE,
    status: result.ok ? "ok" : "error",
    error_code: result.error_code,
    store_version: HANDOFF_REUSE_OUTCOME_LEDGER_STORE_VERSION,
    adapter_version: result.adapter_version,
    store_result: result,
    ledger_store_result: result.ledger_store_result,
    record: result.record,
    records: result.records,
    receipt: result.receipt,
    handoff_reuse_outcome_ledger_record_written:
      result.status === "written",
    no_side_effects: result.no_side_effects,
  };
}

function errorResponse(errorCode: string) {
  return {
    route_version: routeVersion,
    scope: HANDOFF_REUSE_OUTCOME_LEDGER_SCOPE,
    status: "error",
    error_code: errorCode,
    store_version: HANDOFF_REUSE_OUTCOME_LEDGER_STORE_VERSION,
    handoff_reuse_outcome_ledger_record_written: false,
    no_side_effects: {
      reuse_outcome_ledger_written: false,
      handoff_reuse_outcome_ledger_record_written: false,
      handoff_reuse_outcome_ledger_receipt_written: false,
      dogfood_metrics_written: false,
      work_episode_written: false,
      expected_observed_delta_written: false,
      memory_mutated: false,
      current_working_perspective_updated: false,
      perspective_unit_written: false,
      next_work_bias_written: false,
      continuity_relay_written: false,
      handoff_context_mutated: false,
      selected_refs_written_to_live_handoff: false,
      handoff_sent: false,
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
  const normalized = value.toLowerCase();
  return [
    "/users/",
    "/home/",
    "file://",
    "sk-",
    "ghp_",
    "openai_api_key",
    "github_token",
    "password:",
    "secret:",
    "token",
  ].some((marker) => normalized.includes(marker));
}
