import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

import Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  createPromotionDecisionAuthorityBoundaryV01,
  createPromotionDecisionRecordV01,
  ensurePromotionDecisionStoreSchemaV01,
  isSafePromotionDecisionRouteDbPathV01,
  listPromotionDecisionRecordsV01,
  promotionDecisionStoreSchemaExistsV01,
  type PromotionDecisionCreateInput,
  type PromotionDecisionListFilters,
  type PromotionDecisionStoreResult,
} from "../../../../lib/perspective/promotion/promotion-decision-store";

export const runtime = "nodejs";

const scope = "project:augnes" as const;
const routeVersion = "promotion_decision_store_route.v0.1" as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dbPath = url.searchParams.get("db_path") ?? "";
  if (!isSafePromotionDecisionRouteDbPathV01(dbPath)) {
    return jsonResponse(errorResponse("invalid_db_path"), 400);
  }

  const filters: PromotionDecisionListFilters = {
    decision_status: (url.searchParams.get("decision_status") || undefined) as
      | PromotionDecisionListFilters["decision_status"]
      | undefined,
    review_record_ref: url.searchParams.get("review_record_ref") || undefined,
    include_discarded: url.searchParams.get("include_discarded") === "1",
  };

  const opened = openReadOnlyLocalDb(dbPath);
  if ("errorCode" in opened) {
    return jsonResponse(errorResponse(opened.errorCode), opened.status);
  }
  const db = opened.db;
  try {
    if (!promotionDecisionStoreSchemaExistsV01(db)) {
      return jsonResponse(errorResponse("schema_missing"), 400);
    }
    const result = listPromotionDecisionRecordsV01(filters, db);
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

  const inputBody = body as { db_path?: unknown; input?: unknown };
  if (!isSafePromotionDecisionRouteDbPathV01(inputBody.db_path)) {
    return jsonResponse(errorResponse("invalid_db_path"), 400);
  }
  if (!inputBody.input || typeof inputBody.input !== "object" || Array.isArray(inputBody.input)) {
    return jsonResponse(errorResponse("invalid_input"), 400);
  }

  const db = openWriteLocalDb(inputBody.db_path);
  try {
    const result = createPromotionDecisionRecordV01(
      inputBody.input as PromotionDecisionCreateInput,
      db,
    );
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
  ensurePromotionDecisionStoreSchemaV01(db);
  return db;
}

function storeResultHttpStatus(result: PromotionDecisionStoreResult, okStatus = 200): number {
  if (result.status === "not_found") return 404;
  if (result.status === "blocked_forbidden_authority") return 403;
  if (result.status.startsWith("blocked")) return 400;
  return okStatus;
}

function storeResultResponse(result: PromotionDecisionStoreResult) {
  const errorCode = result.status.startsWith("blocked") || result.status === "not_found"
    ? result.status
    : null;
  return {
    route_version: routeVersion,
    scope,
    status: errorCode ? "error" : "ok",
    error_code: errorCode,
    result,
    promotion_executed: false,
    formation_receipt_written: false,
    durable_state_applied: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    authority_boundary: createPromotionDecisionAuthorityBoundaryV01({ routeNow: true }),
  };
}

function errorResponse(errorCode: string) {
  return {
    route_version: routeVersion,
    scope,
    status: "error",
    error_code: errorCode,
    promotion_executed: false,
    formation_receipt_written: false,
    durable_state_applied: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    authority_boundary: createPromotionDecisionAuthorityBoundaryV01({ routeNow: true }),
  };
}

function jsonResponse(response: unknown, status = 200) {
  return NextResponse.json(response, { status });
}
