import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

import Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  createManualAnchorAuthorityBoundaryV01,
  createManualAnchorRecordV01,
  discardManualAnchorRecordV01,
  ensureManualAnchorStoreSchemaV01,
  isSafeManualAnchorRouteDbPathV01,
  listManualAnchorRecordsV01,
  manualAnchorStoreSchemaExistsV01,
  readManualAnchorRecordV01,
  type ManualAnchorCreateInput,
  type ManualAnchorListFilters,
  type ManualAnchorStoreResult,
} from "../../../../../lib/perspective/layout/manual-anchor-store";

export const runtime = "nodejs";

const scope = "project:augnes" as const;
const routeVersion = "project_constellation_manual_anchor_route.v0.1" as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dbPath = url.searchParams.get("db_path") ?? "";
  if (!isSafeManualAnchorRouteDbPathV01(dbPath)) {
    return jsonResponse(errorResponse("invalid_db_path"), 400);
  }

  const opened = openReadOnlyLocalDb(dbPath);
  if ("errorCode" in opened) return jsonResponse(errorResponse(opened.errorCode), opened.status);

  const db = opened.db;
  try {
    if (!manualAnchorStoreSchemaExistsV01(db)) {
      return jsonResponse(errorResponse("schema_missing"), 400);
    }
    const anchorId = url.searchParams.get("anchor_id");
    const result = anchorId
      ? readManualAnchorRecordV01(anchorId, db)
      : listManualAnchorRecordsV01(createFilters(url), db);
    return jsonResponse(storeResultResponse(result), storeResultHttpStatus(result));
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

  const inputBody = body as {
    action?: unknown;
    db_path?: unknown;
    input?: unknown;
    anchor_id?: unknown;
    reason?: unknown;
  };
  if (!isSafeManualAnchorRouteDbPathV01(inputBody.db_path)) {
    return jsonResponse(errorResponse("invalid_db_path"), 400);
  }

  const isDiscardAction = inputBody.action === "discard";
  let createInput: ManualAnchorCreateInput | null = null;
  let discardAnchorId: string | null = null;
  let discardReason: string | null = null;
  if (isDiscardAction) {
    if (typeof inputBody.anchor_id !== "string" || inputBody.anchor_id.length === 0) {
      return jsonResponse(errorResponse("invalid_anchor_id"), 400);
    }
    if (typeof inputBody.reason !== "string" || inputBody.reason.length === 0) {
      return jsonResponse(errorResponse("invalid_discard_reason"), 400);
    }
    discardAnchorId = inputBody.anchor_id;
    discardReason = inputBody.reason;
  } else {
    if (inputBody.action !== undefined && inputBody.action !== "create") {
      return jsonResponse(errorResponse("invalid_action"), 400);
    }
    if (!inputBody.input || typeof inputBody.input !== "object" || Array.isArray(inputBody.input)) {
      return jsonResponse(errorResponse("invalid_input"), 400);
    }
    createInput = inputBody.input as ManualAnchorCreateInput;
  }

  const db = openWriteLocalDb(inputBody.db_path);
  try {
    if (isDiscardAction) {
      const result = discardManualAnchorRecordV01(discardAnchorId!, discardReason!, db);
      return jsonResponse(storeResultResponse(result), storeResultHttpStatus(result));
    }
    const result = createManualAnchorRecordV01(createInput!, db);
    return jsonResponse(storeResultResponse(result), storeResultHttpStatus(result, 201));
  } finally {
    db.close();
  }
}

function createFilters(url: URL): ManualAnchorListFilters {
  return {
    layout_id: url.searchParams.get("layout_id") || undefined,
    perspective_id: url.searchParams.get("perspective_id") || undefined,
    node_ref: url.searchParams.get("node_ref") || undefined,
    include_discarded: url.searchParams.get("include_discarded") === "1",
  };
}

function requestHasSameOriginBoundary(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) return false;

  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
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

function openReadOnlyLocalDb(dbPath: string):
  | { db: Database.Database }
  | { errorCode: "db_missing"; status: 404 } {
  if (!existsSync(dbPath)) return { errorCode: "db_missing", status: 404 };
  try {
    return { db: new Database(dbPath, { readonly: true, fileMustExist: true }) };
  } catch {
    return { errorCode: "db_missing", status: 404 };
  }
}

function openWriteLocalDb(dbPath: string) {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  ensureManualAnchorStoreSchemaV01(db);
  return db;
}

function storeResultHttpStatus(result: ManualAnchorStoreResult, okStatus = 200): number {
  if (result.status === "not_found") return 404;
  if (result.status === "blocked_forbidden_authority") return 403;
  if (result.status.startsWith("blocked")) return 400;
  return okStatus;
}

function storeResultResponse(result: ManualAnchorStoreResult) {
  const errorCode = result.status.startsWith("blocked") || result.status === "not_found"
    ? result.status
    : null;
  return {
    route_version: routeVersion,
    scope,
    status: errorCode ? "error" : "ok",
    error_code: errorCode,
    result,
    durable_state_mutated: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    authority_boundary: createManualAnchorAuthorityBoundaryV01(),
  };
}

function errorResponse(errorCode: string) {
  return {
    route_version: routeVersion,
    scope,
    status: "error",
    error_code: errorCode,
    durable_state_mutated: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    authority_boundary: createManualAnchorAuthorityBoundaryV01(),
  };
}

function jsonResponse(response: unknown, status = 200) {
  return NextResponse.json(response, { status });
}
