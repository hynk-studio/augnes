import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

import Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  createFormationReceiptV01,
  discardFormationReceiptV01,
  ensureFormationReceiptStoreSchemaV01,
  formationReceiptStoreSchemaExistsV01,
  isSafeFormationReceiptRouteDbPathV01,
  listFormationReceiptsV01,
  createFormationReceiptAuthorityBoundaryV01,
  type FormationReceiptCreateInput,
  type FormationReceiptListFilters,
  type FormationReceiptStoreResult,
} from "../../../../lib/perspective/formation-receipt/formation-receipt-store";

export const runtime = "nodejs";

const scope = "project:augnes" as const;
const routeVersion = "formation_receipt_durable_write_route.v0.1" as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dbPath = url.searchParams.get("db_path") ?? "";
  if (!isSafeFormationReceiptRouteDbPathV01(dbPath)) {
    return jsonResponse(errorResponse("invalid_db_path"), 400);
  }

  const filters: FormationReceiptListFilters = {
    promotion_decision_id: url.searchParams.get("promotion_decision_id") || undefined,
    review_record_ref: url.searchParams.get("review_record_ref") || undefined,
    include_discarded: url.searchParams.get("include_discarded") === "1",
  };

  const opened = openReadOnlyLocalDb(dbPath);
  if ("errorCode" in opened) {
    return jsonResponse(errorResponse(opened.errorCode), opened.status);
  }
  const db = opened.db;
  try {
    if (!formationReceiptStoreSchemaExistsV01(db)) {
      return jsonResponse(errorResponse("schema_missing"), 400);
    }
    const result = listFormationReceiptsV01(filters, db);
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
    receipt_id?: unknown;
    reason?: unknown;
  };
  if (!isSafeFormationReceiptRouteDbPathV01(inputBody.db_path)) {
    return jsonResponse(errorResponse("invalid_db_path"), 400);
  }

  const db = openWriteLocalDb(inputBody.db_path);
  try {
    if (inputBody.action === "discard") {
      if (typeof inputBody.receipt_id !== "string" || inputBody.receipt_id.length === 0) {
        return jsonResponse(errorResponse("invalid_receipt_id"), 400);
      }
      if (typeof inputBody.reason !== "string" || inputBody.reason.length === 0) {
        return jsonResponse(errorResponse("invalid_discard_reason"), 400);
      }
      const result = discardFormationReceiptV01(inputBody.receipt_id, inputBody.reason, db);
      return jsonResponse(storeResultResponse(result), storeResultHttpStatus(result));
    }
    if (inputBody.action !== undefined && inputBody.action !== "create") {
      return jsonResponse(errorResponse("invalid_action"), 400);
    }
    if (!inputBody.input || typeof inputBody.input !== "object" || Array.isArray(inputBody.input)) {
      return jsonResponse(errorResponse("invalid_input"), 400);
    }
    const result = createFormationReceiptV01(inputBody.input as FormationReceiptCreateInput, db);
    return jsonResponse(storeResultResponse(result), storeResultHttpStatus(result, 201));
  } finally {
    db.close();
  }
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
  ensureFormationReceiptStoreSchemaV01(db);
  return db;
}

function storeResultHttpStatus(result: FormationReceiptStoreResult, okStatus = 200): number {
  if (result.status === "not_found") return 404;
  if (result.status === "blocked_forbidden_authority") return 403;
  if (result.status.startsWith("blocked")) return 400;
  return okStatus;
}

function storeResultResponse(result: FormationReceiptStoreResult) {
  const errorCode = result.status.startsWith("blocked") || result.status === "not_found"
    ? result.status
    : null;
  return {
    route_version: routeVersion,
    scope,
    status: errorCode ? "error" : "ok",
    error_code: errorCode,
    result,
    formation_receipt_written: result.formation_receipt_written,
    durable_state_applied: false,
    promotion_executed: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    authority_boundary: createFormationReceiptAuthorityBoundaryV01(),
  };
}

function errorResponse(errorCode: string) {
  return {
    route_version: routeVersion,
    scope,
    status: "error",
    error_code: errorCode,
    formation_receipt_written: false,
    durable_state_applied: false,
    promotion_executed: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    authority_boundary: createFormationReceiptAuthorityBoundaryV01(),
  };
}

function jsonResponse(response: unknown, status = 200) {
  return NextResponse.json(response, { status });
}
