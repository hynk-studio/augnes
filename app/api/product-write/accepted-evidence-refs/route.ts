import { existsSync } from "node:fs";

import Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  createAcceptedEvidenceRefAuthorityBoundaryV01,
  createAcceptedEvidenceRefDbMissingResultV01,
  createAcceptedEvidenceRefRuntimeV01,
  isSafeAcceptedEvidenceRefRouteDbPathV01,
  listAcceptedEvidenceRefRuntimeV01,
  preflightAcceptedEvidenceRefRuntimeV01,
  readAcceptedEvidenceRefByIdempotencyKeyRuntimeV01,
  readAcceptedEvidenceRefRuntimeV01,
  type ProductWriteAcceptedEvidenceRefDbLike,
} from "../../../../lib/product-write/accepted-evidence-ref-runtime";
import {
  maybeWriteRuntimeRouteAuditEventV01,
  type RuntimeRouteAuditInstrumentationResultV01,
} from "../../../../lib/runtime-audit/route-audit-instrumentation";
import {
  ProductWriteAcceptedEvidenceRefRouteVersion,
  ProductWriteAcceptedEvidenceRefRuntimeSliceRef,
  ProductWriteAcceptedEvidenceRefScope,
  type ProductWriteAcceptedEvidenceRefCreateInput,
  type ProductWriteAcceptedEvidenceRefListFilters,
  type ProductWriteAcceptedEvidenceRefResult,
} from "../../../../types/product-write-accepted-evidence-ref";

export const runtime = "nodejs";

const routeRef = "route:/api/product-write/accepted-evidence-refs" as const;

export async function GET(request: Request) {
  if (!requestHasSameOriginBoundary(request)) {
    return jsonResponse(errorResponse("same_origin_required"), 403);
  }

  const url = new URL(request.url);
  const dbPath = url.searchParams.get("db_path") ?? "";
  const auditDbPath = url.searchParams.get("audit_db_path");
  if (!isSafeAcceptedEvidenceRefRouteDbPathV01(dbPath)) {
    return jsonResponse(errorResponse("invalid_db_path"), 400);
  }

  const opened = openReadOnlyLocalDb(dbPath);
  if ("errorCode" in opened) {
    return jsonResponse(errorResponse(opened.errorCode), opened.status);
  }

  const acceptedEvidenceRefWriteId =
    url.searchParams.get("accepted_evidence_ref_write_id") || undefined;
  const idempotencyKey = url.searchParams.get("idempotency_key") || undefined;
  const filters: ProductWriteAcceptedEvidenceRefListFilters = {
    promotion_decision_ref: url.searchParams.get("promotion_decision_ref") || undefined,
    formation_receipt_ref: url.searchParams.get("formation_receipt_ref") || undefined,
    review_record_ref: url.searchParams.get("review_record_ref") || undefined,
    operator_approval_ref: url.searchParams.get("operator_approval_ref") || undefined,
    limit: parseLimit(url.searchParams.get("limit")),
  };

  const db = opened.db as unknown as ProductWriteAcceptedEvidenceRefDbLike;
  try {
    const result = acceptedEvidenceRefWriteId
      ? readAcceptedEvidenceRefRuntimeV01(acceptedEvidenceRefWriteId, db)
      : idempotencyKey
        ? readAcceptedEvidenceRefByIdempotencyKeyRuntimeV01(idempotencyKey, db)
        : listAcceptedEvidenceRefRuntimeV01(filters, db);
    const statusCode = storeResultHttpStatus(result);
    const auditEventResult = maybeAuditResult({
      auditDbPath,
      result,
      action: acceptedEvidenceRefWriteId || idempotencyKey
        ? "accepted_evidence_ref_write_read"
        : "accepted_evidence_ref_writes_listed",
      fallbackSubjectRef: acceptedEvidenceRefWriteId || idempotencyKey || "accepted-evidence-ref-write:list",
      boundedSummary: acceptedEvidenceRefWriteId || idempotencyKey
        ? "Accepted evidence ref route returned bounded read result."
        : "Accepted evidence ref route returned bounded list result.",
      statusCode,
    });
    return jsonResponse(storeResultResponse(result, auditEventResult), statusCode);
  } finally {
    opened.db.close();
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

  const inputBody = body as { db_path?: unknown; audit_db_path?: unknown; input?: unknown };
  if (!isSafeAcceptedEvidenceRefRouteDbPathV01(inputBody.db_path)) {
    return jsonResponse(errorResponse("invalid_db_path"), 400);
  }
  if (!inputBody.input || typeof inputBody.input !== "object" || Array.isArray(inputBody.input)) {
    return jsonResponse(errorResponse("invalid_input"), 400);
  }

  const preflightResult = preflightAcceptedEvidenceRefRuntimeV01(inputBody.input);
  if (preflightResult) {
    const statusCode = storeResultHttpStatus(preflightResult, 201);
    const auditEventResult = maybeAuditResult({
      auditDbPath: inputBody.audit_db_path,
      result: preflightResult,
      action: "accepted_evidence_ref_write_rejected",
      fallbackSubjectRef: rejectedAttemptSubjectRef(preflightResult),
      boundedSummary: "Accepted evidence ref route rejected bounded write attempt before product DB open.",
      statusCode,
    });
    return jsonResponse(storeResultResponse(preflightResult, auditEventResult), statusCode);
  }

  const opened = openExistingWriteLocalDb(inputBody.db_path);
  if ("errorCode" in opened) {
    const result = createAcceptedEvidenceRefDbMissingResultV01();
    const statusCode = storeResultHttpStatus(result, 201);
    const auditEventResult = maybeAuditResult({
      auditDbPath: inputBody.audit_db_path,
      result,
      action: "accepted_evidence_ref_write_rejected",
      fallbackSubjectRef: "aer-write:attempt:db_schema_missing",
      boundedSummary: "Accepted evidence ref route rejected bounded write attempt because the lineage DB was missing.",
      statusCode,
    });
    return jsonResponse(storeResultResponse(result, auditEventResult), statusCode);
  }

  try {
    const result = createAcceptedEvidenceRefRuntimeV01(
      inputBody.input as ProductWriteAcceptedEvidenceRefCreateInput,
      opened.db as unknown as ProductWriteAcceptedEvidenceRefDbLike,
    );
    const statusCode = storeResultHttpStatus(result, 201);
    const auditEventResult = maybeAuditResult({
      auditDbPath: inputBody.audit_db_path,
      result,
      action: result.status === "written" || result.status === "idempotent_existing"
        ? "accepted_evidence_ref_write_created"
        : "accepted_evidence_ref_write_rejected",
      fallbackSubjectRef: rejectedAttemptSubjectRef(result),
      boundedSummary: result.status === "written" || result.status === "idempotent_existing"
        ? "Accepted evidence ref route stored or replayed bounded write record."
        : "Accepted evidence ref route rejected bounded write attempt.",
      statusCode,
    });
    return jsonResponse(storeResultResponse(result, auditEventResult), statusCode);
  } finally {
    opened.db.close();
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

function openExistingWriteLocalDb(dbPath: string):
  | { db: Database.Database }
  | { errorCode: "db_missing"; status: 404 } {
  try {
    return { db: new Database(dbPath, { fileMustExist: true }) };
  } catch {
    return { errorCode: "db_missing", status: 404 };
  }
}

function storeResultHttpStatus(result: ProductWriteAcceptedEvidenceRefResult, okStatus = 200): number {
  if (result.status === "not_found") return 404;
  if (result.status === "conflict_existing_idempotency_key") return 409;
  if (result.status === "blocked_forbidden_authority") return 403;
  if (result.status.startsWith("blocked")) return 400;
  if (result.status === "idempotent_existing") return 200;
  return okStatus;
}

function storeResultResponse(
  result: ProductWriteAcceptedEvidenceRefResult,
  auditEventResult?: RuntimeRouteAuditInstrumentationResultV01,
) {
  const errorCode =
    result.status.startsWith("blocked") ||
    result.status === "not_found" ||
    result.status === "conflict_existing_idempotency_key"
      ? result.status
      : null;
  return {
    route_version: ProductWriteAcceptedEvidenceRefRouteVersion,
    scope: ProductWriteAcceptedEvidenceRefScope,
    status: errorCode ? "error" : "ok",
    error_code: errorCode,
    result,
    accepted_evidence_ref_write_record_written: result.accepted_evidence_ref_write_record_written,
    product_id_allocated: false,
    broad_product_persistence_executed: false,
    product_write_adapter_enabled: false,
    proof_created: false,
    evidence_created: false,
    claim_evidence_written: false,
    work_item_created: false,
    promotion_executed: false,
    formation_receipt_written_now: false,
    durable_perspective_state_mutated: false,
    authority_boundary: createAcceptedEvidenceRefAuthorityBoundaryV01({
      routeNow: true,
      writeNow: result.status === "written",
      dbNow: result.authority_boundary.db_query_or_write_now,
    }),
    audit_event_result: auditEventResult,
  };
}

function errorResponse(errorCode: string) {
  return {
    route_version: ProductWriteAcceptedEvidenceRefRouteVersion,
    scope: ProductWriteAcceptedEvidenceRefScope,
    status: "error",
    error_code: errorCode,
    accepted_evidence_ref_write_record_written: false,
    product_id_allocated: false,
    broad_product_persistence_executed: false,
    product_write_adapter_enabled: false,
    proof_created: false,
    evidence_created: false,
    claim_evidence_written: false,
    work_item_created: false,
    promotion_executed: false,
    formation_receipt_written_now: false,
    durable_perspective_state_mutated: false,
    authority_boundary: createAcceptedEvidenceRefAuthorityBoundaryV01({ routeNow: true }),
  };
}

function maybeAuditResult(input: {
  auditDbPath: unknown;
  result: ProductWriteAcceptedEvidenceRefResult;
  action: string;
  fallbackSubjectRef: string;
  boundedSummary: string;
  statusCode: number;
}): RuntimeRouteAuditInstrumentationResultV01 {
  const isError = input.statusCode >= 400;
  const auditRecords = isError ? [] : input.result.records;
  const primaryResultRef =
    !isError && input.result.record
      ? input.result.record.accepted_evidence_ref_write_id
      : !isError && auditRecords.length > 0
        ? `accepted-evidence-ref:list:${auditRecords.length}:${auditRecords[0].accepted_evidence_ref_write_id}`
        : input.fallbackSubjectRef;
  return maybeWriteRuntimeRouteAuditEventV01({
    audit_db_path: input.auditDbPath,
    route_ref: routeRef,
    runtime_slice_ref: ProductWriteAcceptedEvidenceRefRuntimeSliceRef,
    event_surface: "product_write_gate",
    event_kind: "route_response",
    event_action: input.action,
    event_status: input.result.status,
    subject_ref: !isError && input.result.record
      ? input.result.record.accepted_evidence_ref_write_id
      : input.fallbackSubjectRef,
    related_refs: auditRecords
      .slice(0, 10)
      .map((record) => record.accepted_evidence_ref_write_id),
    primary_result_status: input.result.status,
    primary_result_ref: primaryResultRef,
    bounded_summary: input.boundedSummary,
    bounded_error_code: input.statusCode >= 400 ? input.result.status : null,
  });
}

function rejectedAttemptSubjectRef(result: ProductWriteAcceptedEvidenceRefResult): string {
  if (result.status === "written" || result.status === "idempotent_existing") {
    return result.record?.accepted_evidence_ref_write_id ?? "aer-write:attempt";
  }
  const primaryReason =
    result.reason_codes.find((code) =>
      code.endsWith("_ref_missing") ||
      code.endsWith("_refs_missing") ||
      code.endsWith("_key_missing") ||
      code === "operator_approval_missing" ||
      code === "operator_approval_payload_missing",
    ) ??
    result.reason_codes.find((code) => code.includes("conflict")) ??
    result.reason_codes.find((code) => code.includes("forbidden")) ??
    result.reason_codes.find((code) => code.includes("blocked")) ??
    result.reason_codes.find((code) => code.includes("schema")) ??
    result.reason_codes.find((code) => code.includes("mismatch")) ??
    result.status;
  return `aer-write:attempt:${primaryReason}`.slice(0, 120);
}

function parseLimit(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return undefined;
  return Math.min(Math.max(parsed, 1), 100);
}

function jsonResponse(response: unknown, status = 200) {
  return NextResponse.json(response, { status });
}
