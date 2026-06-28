import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

import SqliteDatabase from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  buildRuntimeAuditPanelModelV01,
  type RuntimeAuditPanelEventV01,
} from "@/lib/runtime-audit/build-runtime-audit-model";
import {
  RUNTIME_AUDIT_EVENT_ROUTE_VERSION,
  RUNTIME_AUDIT_EVENT_STORE_VERSION,
  createRuntimeAuditEventAuthorityBoundaryV01,
  createRuntimeAuditEventV01,
  ensureRuntimeAuditEventSchemaV01,
  isSafeRuntimeAuditDbPathV01,
  listRuntimeAuditEventsV01,
  runtimeAuditEventSchemaExistsV01,
  validateRuntimeAuditEventInputV01,
  validateRuntimeAuditFiltersV01,
  type RuntimeAuditEventInputV01,
  type RuntimeAuditEventListFiltersV01,
  type RuntimeAuditEventWriteStatusV01,
  type RuntimeAuditSqliteLikeV01,
} from "@/lib/runtime-audit/audit-event-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const scope = "project:augnes" as const;

export async function GET(request: Request) {
  if (!requestHasSameOriginBoundary(request)) {
    return jsonResponse(errorResponse("same_origin_required", false), 403);
  }

  const url = new URL(request.url);
  const dbPath = url.searchParams.get("db_path") ?? "";
  if (!isSafeRuntimeAuditDbPathV01(dbPath)) {
    return jsonResponse(errorResponse("invalid_db_path", false), 400);
  }

  const filters = parseFilters(url);
  const filterFailures = validateRuntimeAuditFiltersV01(filters);
  if (filterFailures.length > 0) {
    const status = statusForValidationFailures(filterFailures);
    return jsonResponse(errorResponse(status, false, filterFailures), status === "blocked_forbidden_authority" ? 403 : 400);
  }

  if (!existsSync(dbPath)) {
    return jsonResponse(errorResponse("db_missing", false), 404);
  }

  let db: SqliteDatabase.Database;
  try {
    db = new SqliteDatabase(dbPath, { readonly: true, fileMustExist: true });
  } catch {
    return jsonResponse(errorResponse("db_missing", false), 404);
  }

  try {
    const sqliteLike = db as unknown as RuntimeAuditSqliteLikeV01;
    if (!runtimeAuditEventSchemaExistsV01(sqliteLike)) {
      return jsonResponse(errorResponse("schema_missing", false), 400);
    }

    const events = listRuntimeAuditEventsV01(filters, sqliteLike);
    const auditModel = buildRuntimeAuditPanelModelV01(events as RuntimeAuditPanelEventV01[], {
      audit_id: "runtime-audit:db-backed-route-list",
      as_of: events[0]?.created_at,
    });
    return jsonResponse({
      route_version: RUNTIME_AUDIT_EVENT_ROUTE_VERSION,
      store_version: RUNTIME_AUDIT_EVENT_STORE_VERSION,
      scope,
      status: "ok",
      error_code: null,
      events,
      audit_model: auditModel,
      result: {
        status: "audit_events_listed",
        event_count: events.length,
        model_summary: auditModel.summary,
      },
      audit_event_read_executed: true,
      audit_event_persisted: false,
      bounded_summary_only: true,
      raw_request_body_stored_now: false,
      raw_response_body_stored_now: false,
      product_write_executed: false,
      authority_boundary: createRuntimeAuditEventAuthorityBoundaryV01({ readNow: true }),
    });
  } finally {
    db.close();
  }
}

export async function POST(request: Request) {
  if (!requestHasSameOriginBoundary(request)) {
    return jsonResponse(errorResponse("same_origin_required", true), 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(errorResponse("invalid_json_body", true), 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonResponse(errorResponse("invalid_json_object", true), 400);
  }

  const routeBody = body as {
    route_version?: unknown;
    scope?: unknown;
    action?: unknown;
    db_path?: unknown;
    input?: unknown;
  };
  if (
    routeBody.route_version !== RUNTIME_AUDIT_EVENT_ROUTE_VERSION ||
    routeBody.scope !== scope ||
    routeBody.action !== "create_audit_event" ||
    !routeBody.input ||
    typeof routeBody.input !== "object" ||
    Array.isArray(routeBody.input)
  ) {
    return jsonResponse(errorResponse("invalid_route_request", true), 400);
  }

  const input = routeBody.input as RuntimeAuditEventInputV01;
  const validation = validateRuntimeAuditEventInputV01(input);
  if (!validation.passed) {
    const status = statusForValidationFailures(validation.failure_codes);
    return jsonResponse(
      errorResponse(status, true, validation.failure_codes),
      status === "blocked_forbidden_authority" ? 403 : 400,
    );
  }

  if (!isSafeRuntimeAuditDbPathV01(routeBody.db_path)) {
    return jsonResponse(errorResponse("invalid_db_path", true), 400);
  }
  const dbPath = routeBody.db_path as string;

  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new SqliteDatabase(dbPath);
  try {
    const sqliteLike = db as unknown as RuntimeAuditSqliteLikeV01;
    ensureRuntimeAuditEventSchemaV01(sqliteLike);
    const result = createRuntimeAuditEventV01(input, sqliteLike);
    return jsonResponse(completionResponse(result), statusForWriteResult(result.status));
  } finally {
    db.close();
  }
}

function parseFilters(url: URL): RuntimeAuditEventListFiltersV01 {
  const filters: RuntimeAuditEventListFiltersV01 = {};
  const eventSurface = url.searchParams.get("event_surface");
  const eventKind = url.searchParams.get("event_kind");
  const eventStatus = url.searchParams.get("event_status");
  const subjectRef = url.searchParams.get("subject_ref");
  const limit = url.searchParams.get("limit");
  if (eventSurface) filters.event_surface = eventSurface as RuntimeAuditEventListFiltersV01["event_surface"];
  if (eventKind) filters.event_kind = eventKind as RuntimeAuditEventListFiltersV01["event_kind"];
  if (eventStatus) filters.event_status = eventStatus;
  if (subjectRef) filters.subject_ref = subjectRef;
  if (limit) filters.limit = Number(limit);
  return filters;
}

function requestHasSameOriginBoundary(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase() ?? null;
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) return false;

  const origin = request.headers.get("origin");
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    new URL(request.url).host;
  if (!host) return false;
  if (!origin) return fetchSite ? true : isLocalTestHost(host);

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

function completionResponse(result: ReturnType<typeof createRuntimeAuditEventV01>) {
  const isError =
    result.status.startsWith("blocked") ||
    result.status === "invalid_db_path" ||
    result.status === "rejected" ||
    result.status === "conflict_existing_audit_event";
  return {
    route_version: RUNTIME_AUDIT_EVENT_ROUTE_VERSION,
    store_version: RUNTIME_AUDIT_EVENT_STORE_VERSION,
    scope,
    status: isError ? "error" : "ok",
    error_code: isError ? result.status : null,
    result,
    audit_event_persisted: result.audit_event_persisted,
    audit_event_read_executed: false,
    bounded_summary_only: true,
    raw_request_body_stored_now: false,
    raw_response_body_stored_now: false,
    raw_terminal_log_stored_now: false,
    browser_dump_ingested_now: false,
    hidden_reasoning_stored_now: false,
    raw_provider_output_stored_now: false,
    raw_retrieval_output_stored_now: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    authority_boundary: result.authority_boundary,
  };
}

function errorResponse(
  errorCode: string,
  persistenceRequest: boolean,
  reasonCodes: string[] = [errorCode],
) {
  const status = errorCode === "same_origin_required" ? "blocked_forbidden_authority" : errorCode;
  return {
    route_version: RUNTIME_AUDIT_EVENT_ROUTE_VERSION,
    store_version: RUNTIME_AUDIT_EVENT_STORE_VERSION,
    scope,
    status: "error",
    error_code: errorCode,
    result: {
      store_version: RUNTIME_AUDIT_EVENT_STORE_VERSION,
      scope,
      status,
      audit_event_id: null,
      audit_event_ref: null,
      event_fingerprint: null,
      audit_event_persisted: false,
      authority_boundary: createRuntimeAuditEventAuthorityBoundaryV01({
        persistenceNow: false,
        readNow: !persistenceRequest,
      }),
      reason_codes: [...new Set(["bounded_error", "no_raw_unsafe_echo", ...reasonCodes])].sort(),
    },
    audit_event_persisted: false,
    audit_event_read_executed: !persistenceRequest,
    bounded_summary_only: true,
    raw_request_body_stored_now: false,
    raw_response_body_stored_now: false,
    raw_terminal_log_stored_now: false,
    browser_dump_ingested_now: false,
    hidden_reasoning_stored_now: false,
    raw_provider_output_stored_now: false,
    raw_retrieval_output_stored_now: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    authority_boundary: createRuntimeAuditEventAuthorityBoundaryV01({
      persistenceNow: false,
      readNow: !persistenceRequest,
    }),
  };
}

function statusForValidationFailures(failures: string[]): RuntimeAuditEventWriteStatusV01 {
  if (failures.some((failure) => failure.includes("forbidden_authority"))) {
    return "blocked_forbidden_authority";
  }
  if (failures.some((failure) => /private|raw|secret|local_path|private_url|hidden_reasoning|browser_dump|terminal_log/.test(failure))) {
    return "blocked_private_or_raw_payload";
  }
  return "blocked_invalid_input";
}

function statusForWriteResult(status: RuntimeAuditEventWriteStatusV01): number {
  if (status === "blocked_forbidden_authority") return 403;
  if (
    status === "blocked_private_or_raw_payload" ||
    status === "blocked_invalid_input" ||
    status === "invalid_db_path" ||
    status === "rejected"
  ) {
    return 400;
  }
  if (status === "conflict_existing_audit_event") return 409;
  return 200;
}

function jsonResponse(response: unknown, status = 200) {
  return NextResponse.json(response, { status });
}
