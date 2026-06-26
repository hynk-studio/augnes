import { existsSync } from "node:fs";

import Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  createDurablePerspectiveStateAuthorityBoundaryV01,
  durablePerspectiveStateSchemaExistsV01,
  isSafeDurablePerspectiveStateRouteDbPathV01,
  readDurablePerspectiveStateV01,
  type DurablePerspectiveStateApplyResult,
} from "../../../../../lib/perspective/state/state-store";

export const runtime = "nodejs";

const scope = "project:augnes" as const;
const routeVersion = "durable_perspective_state_read_route.v0.1" as const;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ perspective_id: string }> },
) {
  const { perspective_id } = await params;
  const url = new URL(request.url);
  const dbPath = url.searchParams.get("db_path") ?? "";
  if (!isSafeDurablePerspectiveStateRouteDbPathV01(dbPath)) {
    return jsonResponse(errorResponse("invalid_db_path"), 400);
  }

  const opened = openReadOnlyLocalDb(dbPath);
  if ("errorCode" in opened) {
    return jsonResponse(errorResponse(opened.errorCode), opened.status);
  }
  const db = opened.db;
  try {
    if (!durablePerspectiveStateSchemaExistsV01(db)) {
      return jsonResponse(errorResponse("schema_missing"), 400);
    }
    const result = readDurablePerspectiveStateV01(decodeURIComponent(perspective_id), db);
    return jsonResponse(storeResultResponse(result), storeResultHttpStatus(result));
  } finally {
    db.close();
  }
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

function storeResultHttpStatus(result: DurablePerspectiveStateApplyResult, okStatus = 200): number {
  if (result.status === "not_found") return 404;
  if (result.status === "blocked_forbidden_authority") return 403;
  if (result.status.startsWith("blocked")) return 400;
  return okStatus;
}

function storeResultResponse(result: DurablePerspectiveStateApplyResult) {
  const errorCode = result.status.startsWith("blocked") || result.status === "not_found"
    ? result.status
    : null;
  return {
    route_version: routeVersion,
    scope,
    status: errorCode ? "error" : "ok",
    error_code: errorCode,
    result,
    durable_state_applied: result.durable_state_applied,
    formation_receipt_written: result.formation_receipt_written,
    promotion_executed: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    authority_boundary: createDurablePerspectiveStateAuthorityBoundaryV01(),
  };
}

function errorResponse(errorCode: string) {
  return {
    route_version: routeVersion,
    scope,
    status: "error",
    error_code: errorCode,
    durable_state_applied: false,
    formation_receipt_written: false,
    promotion_executed: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    authority_boundary: createDurablePerspectiveStateAuthorityBoundaryV01(),
  };
}

function jsonResponse(response: unknown, status = 200) {
  return NextResponse.json(response, { status });
}
