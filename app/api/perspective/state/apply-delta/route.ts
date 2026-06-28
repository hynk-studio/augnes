import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

import Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  applyDurablePerspectiveStateV01,
  createDurablePerspectiveStateAuthorityBoundaryV01,
  ensureDurablePerspectiveStateSchemaV01,
  isSafeDurablePerspectiveStateRouteDbPathV01,
  type DurablePerspectiveStateApplyInput,
  type DurablePerspectiveStateApplyResult,
} from "../../../../../lib/perspective/state/state-store";
import {
  maybeWriteRuntimeRouteAuditEventV01,
  type RuntimeRouteAuditInstrumentationResultV01,
} from "../../../../../lib/runtime-audit/route-audit-instrumentation";

export const runtime = "nodejs";

const scope = "project:augnes" as const;
const routeVersion = "durable_perspective_state_apply_route.v0.1" as const;

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

  const inputBody = body as { action?: unknown; db_path?: unknown; audit_db_path?: unknown; input?: unknown };
  if (!isSafeDurablePerspectiveStateRouteDbPathV01(inputBody.db_path)) {
    return jsonResponse(errorResponse("invalid_db_path"), 400);
  }
  if (inputBody.action !== undefined && inputBody.action !== "apply") {
    return jsonResponse(errorResponse("invalid_action"), 400);
  }
  if (!inputBody.input || typeof inputBody.input !== "object" || Array.isArray(inputBody.input)) {
    return jsonResponse(errorResponse("invalid_input"), 400);
  }
  const applyInput = inputBody.input as DurablePerspectiveStateApplyInput;

  const db = openWriteLocalDb(inputBody.db_path);
  try {
    const result = applyDurablePerspectiveStateV01(applyInput, db);
    const statusCode = storeResultHttpStatus(result, 201);
    const primaryResultRef =
      result.apply_event?.apply_event_id ??
      result.state?.state_fingerprint ??
      applyInput.apply_event_id ??
      applyInput.formation_receipt_id ??
      applyInput.perspective_id;
    const auditEventResult = maybeWriteRuntimeRouteAuditEventV01({
      audit_db_path: inputBody.audit_db_path,
      route_ref: "route:/api/perspective/state/apply-delta",
      runtime_slice_ref: "runtime_audit_selected_route_instrumentation_v0_4_phase_4_promotion_state_v0_1",
      event_surface: "durable_perspective_state_runtime",
      event_kind: "route_response",
      event_action: "durable_perspective_state_delta_applied",
      event_status: result.status,
      subject_ref: applyInput.perspective_id,
      related_refs: [
        applyInput.perspective_id,
        result.apply_event?.apply_event_id ?? applyInput.apply_event_id,
        result.apply_event?.formation_receipt_id ?? applyInput.formation_receipt_id,
        result.apply_event?.promotion_decision_id ?? applyInput.promotion_decision_id,
      ].filter(Boolean),
      primary_result_status: result.status,
      primary_result_ref: primaryResultRef,
      bounded_summary: "Durable Perspective state apply route returned bounded apply result.",
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

function openWriteLocalDb(dbPath: string) {
  if (!existsSync(dirname(dbPath))) mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  ensureDurablePerspectiveStateSchemaV01(db);
  return db;
}

function storeResultHttpStatus(result: DurablePerspectiveStateApplyResult, okStatus = 200): number {
  if (result.status === "not_found") return 404;
  if (result.status === "blocked_forbidden_authority") return 403;
  if (result.status.startsWith("blocked")) return 400;
  return okStatus;
}

function storeResultResponse(
  result: DurablePerspectiveStateApplyResult,
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
    durable_state_applied: result.durable_state_applied,
    formation_receipt_written: result.formation_receipt_written,
    promotion_executed: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    authority_boundary: createDurablePerspectiveStateAuthorityBoundaryV01(),
    audit_event_result: auditEventResult,
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
