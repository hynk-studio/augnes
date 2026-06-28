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
import {
  maybeWriteRuntimeRouteAuditEventV01,
  type RuntimeRouteAuditInstrumentationResultV01,
} from "../../../../lib/runtime-audit/route-audit-instrumentation";

export const runtime = "nodejs";

const scope = "project:augnes" as const;
const routeVersion = "formation_receipt_durable_write_route.v0.1" as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dbPath = url.searchParams.get("db_path") ?? "";
  const auditDbPath = url.searchParams.get("audit_db_path");
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
    const statusCode = storeResultHttpStatus(result);
    const firstId = result.records[0]?.receipt_id ?? "";
    const auditEventResult = maybeWriteRuntimeRouteAuditEventV01({
      audit_db_path: auditDbPath,
      route_ref: "route:/api/perspective/formation-receipts",
      runtime_slice_ref: "runtime_audit_selected_route_instrumentation_v0_4_phase_4_promotion_state_v0_1",
      event_surface: "formation_receipt_runtime",
      event_kind: "route_response",
      event_action: "formation_receipts_listed",
      event_status: result.status,
      subject_ref: "formation-receipt:list",
      related_refs: result.records.slice(0, 10).map((record) => record.receipt_id),
      primary_result_status: result.status,
      primary_result_ref: `formation-receipt:list:${result.records.length}:${firstId}`,
      bounded_summary: "Formation Receipt route returned bounded receipt result.",
      bounded_error_code: statusCode >= 400 ? result.status : null,
    });
    return jsonResponse(storeResultResponse(result, auditEventResult), statusCode);
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
    audit_db_path?: unknown;
    input?: unknown;
    receipt_id?: unknown;
    reason?: unknown;
  };
  if (!isSafeFormationReceiptRouteDbPathV01(inputBody.db_path)) {
    return jsonResponse(errorResponse("invalid_db_path"), 400);
  }

  const isDiscardAction = inputBody.action === "discard";
  let discardReceiptId: string | null = null;
  let discardReason: string | null = null;
  let createInput: FormationReceiptCreateInput | null = null;
  if (isDiscardAction) {
    if (typeof inputBody.receipt_id !== "string" || inputBody.receipt_id.length === 0) {
      return jsonResponse(errorResponse("invalid_receipt_id"), 400);
    }
    if (typeof inputBody.reason !== "string" || inputBody.reason.length === 0) {
      return jsonResponse(errorResponse("invalid_discard_reason"), 400);
    }
    discardReceiptId = inputBody.receipt_id;
    discardReason = inputBody.reason;
  } else {
    if (inputBody.action !== undefined && inputBody.action !== "create") {
      return jsonResponse(errorResponse("invalid_action"), 400);
    }
    if (!inputBody.input || typeof inputBody.input !== "object" || Array.isArray(inputBody.input)) {
      return jsonResponse(errorResponse("invalid_input"), 400);
    }
    createInput = inputBody.input as FormationReceiptCreateInput;
  }

  const db = openWriteLocalDb(inputBody.db_path);
  try {
    if (isDiscardAction) {
      const result = discardFormationReceiptV01(discardReceiptId!, discardReason!, db);
      return jsonResponse(storeResultResponse(result), storeResultHttpStatus(result));
    }
    const result = createFormationReceiptV01(createInput!, db);
    const statusCode = storeResultHttpStatus(result, 201);
    const subjectRef = result.record?.receipt_id ?? createInput!.receipt_id;
    const auditEventResult = maybeWriteRuntimeRouteAuditEventV01({
      audit_db_path: inputBody.audit_db_path,
      route_ref: "route:/api/perspective/formation-receipts",
      runtime_slice_ref: "runtime_audit_selected_route_instrumentation_v0_4_phase_4_promotion_state_v0_1",
      event_surface: "formation_receipt_runtime",
      event_kind: "route_response",
      event_action: "formation_receipt_created",
      event_status: result.status,
      subject_ref: subjectRef,
      related_refs: [
        subjectRef,
        result.record?.promotion_decision_id ?? createInput!.promotion_decision_id,
        result.record?.review_record_ref ?? createInput!.review_record_ref,
      ].filter(Boolean),
      primary_result_status: result.status,
      primary_result_ref: subjectRef,
      bounded_summary: "Formation Receipt route returned bounded receipt result.",
      bounded_error_code: statusCode >= 400 ? result.status : null,
    });
    return jsonResponse(storeResultResponse(result, auditEventResult), statusCode);
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

function storeResultResponse(
  result: FormationReceiptStoreResult,
  auditEventResult?: RuntimeRouteAuditInstrumentationResultV01,
) {
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
    audit_event_result: auditEventResult,
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
