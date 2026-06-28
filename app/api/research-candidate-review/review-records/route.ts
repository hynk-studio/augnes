import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

import Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  createResearchCandidateReviewMemoryDbRouteErrorResponseV01,
  createResearchCandidateReviewMemoryDbRouteStoreResponseV01,
  isSafeResearchCandidateReviewMemoryDbRoutePathV01,
  parseResearchCandidateReviewMemoryDbRouteListFiltersV01,
  requestHasResearchCandidateReviewMemoryDbRouteSameOriginBoundaryV01,
  researchCandidateReviewMemoryDbRouteStoreResultHttpStatusV01,
  validateResearchCandidateReviewMemoryDbRouteBodyV01,
  validateResearchCandidateReviewMemoryDbRouteQueryIdentityV01,
} from "../../../../lib/research-candidate-review/review-memory-db-route-contract";
import {
  createResearchCandidateReviewRecordV01,
  ensureResearchCandidateReviewMemoryDbSchemaV01,
  listResearchCandidateReviewRecordsV01,
  researchCandidateReviewMemoryDbSchemaExistsV01,
  type ResearchCandidateReviewMemoryDbCreateInputV01,
  type ResearchCandidateReviewMemoryDbStoreResultV01,
} from "../../../../lib/research-candidate-review/review-memory-db-store";
import {
  maybeWriteRuntimeRouteAuditEventV01,
  type RuntimeRouteAuditInstrumentationResultV01,
} from "../../../../lib/runtime-audit/route-audit-instrumentation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!requestHasResearchCandidateReviewMemoryDbRouteSameOriginBoundaryV01(request)) {
    return jsonResponse(createResearchCandidateReviewMemoryDbRouteErrorResponseV01("same_origin_required", "list_review_records"), 403);
  }

  const url = new URL(request.url);
  const auditDbPath = url.searchParams.get("audit_db_path");
  const identityError = validateResearchCandidateReviewMemoryDbRouteQueryIdentityV01(url);
  if (identityError) {
    return jsonResponse(createResearchCandidateReviewMemoryDbRouteErrorResponseV01(identityError, "list_review_records"), 400);
  }

  const dbPath = url.searchParams.get("db_path") ?? "";
  if (!isSafeResearchCandidateReviewMemoryDbRoutePathV01(dbPath)) {
    return jsonResponse(createResearchCandidateReviewMemoryDbRouteErrorResponseV01("invalid_db_path", "list_review_records"), 400);
  }

  const opened = openReadOnlyLocalDb(dbPath);
  if ("errorCode" in opened) {
    return jsonResponse(
      createResearchCandidateReviewMemoryDbRouteErrorResponseV01(opened.errorCode, "list_review_records"),
      opened.status,
    );
  }
  const db = opened.db;
  try {
    if (!researchCandidateReviewMemoryDbSchemaExistsV01(db)) {
      return jsonResponse(createResearchCandidateReviewMemoryDbRouteErrorResponseV01("schema_missing", "list_review_records"), 400);
    }
    const result = listResearchCandidateReviewRecordsV01(
      parseResearchCandidateReviewMemoryDbRouteListFiltersV01(url),
      db,
    );
    const statusCode = researchCandidateReviewMemoryDbRouteStoreResultHttpStatusV01(result);
    const auditEventResult = writeReviewMemoryRouteAuditEvent({
      audit_db_path: auditDbPath,
      event_action: "review_memory_records_listed",
      event_status: result.status,
      subject_ref: "review-memory:list",
      related_refs: result.records.map((record) => record.review_record_id),
      primary_result_status: result.status,
      primary_result_ref: `review-memory:list:${result.records.length}:${result.records[0]?.review_record_id ?? "empty"}`,
      bounded_summary: "Review memory route returned bounded list result.",
      bounded_error_code: statusCode >= 400 ? result.status : null,
    });
    return jsonResponse(
      createRouteStoreResponseWithAudit("list_review_records", result, auditEventResult),
      statusCode,
    );
  } finally {
    db.close();
  }
}

export async function POST(request: Request) {
  if (!requestHasResearchCandidateReviewMemoryDbRouteSameOriginBoundaryV01(request)) {
    return jsonResponse(createResearchCandidateReviewMemoryDbRouteErrorResponseV01("same_origin_required", "create_review_record"), 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(createResearchCandidateReviewMemoryDbRouteErrorResponseV01("invalid_json_body", "create_review_record"), 400);
  }

  const validation = validateResearchCandidateReviewMemoryDbRouteBodyV01(body, "create_review_record");
  if (!validation.passed || !validation.body) {
    const errorCode = validation.failure_codes.includes("invalid_db_path")
      ? "invalid_db_path"
      : validation.failure_codes[0] ?? "invalid_route_request";
    return jsonResponse(createResearchCandidateReviewMemoryDbRouteErrorResponseV01(errorCode, "create_review_record"), 400);
  }
  if (!validation.body.input || typeof validation.body.input !== "object" || Array.isArray(validation.body.input)) {
    return jsonResponse(createResearchCandidateReviewMemoryDbRouteErrorResponseV01("invalid_route_request", "create_review_record"), 400);
  }

  const db = openWriteLocalDb(validation.body.db_path as string);
  try {
    const result = createResearchCandidateReviewRecordV01(
      validation.body.input as ResearchCandidateReviewMemoryDbCreateInputV01,
      db,
    );
    const statusCode = researchCandidateReviewMemoryDbRouteStoreResultHttpStatusV01(result, 201);
    const auditEventResult = writeReviewMemoryRouteAuditEvent({
      audit_db_path: (body as { audit_db_path?: unknown }).audit_db_path,
      event_action: "review_memory_record_created",
      event_status: result.status,
      subject_ref: result.record?.review_record_id ?? "review-memory:create",
      related_refs: [
        result.record?.review_record_id ?? "",
        ...result.records.map((record) => record.review_record_id),
      ].filter(Boolean),
      primary_result_status: result.status,
      primary_result_ref: result.record?.review_record_id ?? "review-memory:create",
      bounded_summary: "Review memory route created bounded review record.",
      bounded_error_code: statusCode >= 400 ? result.status : null,
    });
    return jsonResponse(
      createRouteStoreResponseWithAudit("create_review_record", result, auditEventResult),
      statusCode,
    );
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

function openWriteLocalDb(dbPath: string) {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  ensureResearchCandidateReviewMemoryDbSchemaV01(db);
  return db;
}

function jsonResponse(response: unknown, status = 200) {
  return NextResponse.json(response, { status });
}

function createRouteStoreResponseWithAudit(
  action: Parameters<typeof createResearchCandidateReviewMemoryDbRouteStoreResponseV01>[0],
  result: ResearchCandidateReviewMemoryDbStoreResultV01,
  auditEventResult: RuntimeRouteAuditInstrumentationResultV01,
) {
  return {
    ...createResearchCandidateReviewMemoryDbRouteStoreResponseV01(action, result),
    audit_event_result: auditEventResult,
  };
}

function writeReviewMemoryRouteAuditEvent(input: {
  audit_db_path?: unknown;
  event_action: string;
  event_status: string;
  subject_ref: string;
  related_refs?: string[];
  primary_result_status: string;
  primary_result_ref: string;
  bounded_summary: string;
  bounded_error_code?: string | null;
}) {
  return maybeWriteRuntimeRouteAuditEventV01({
    audit_db_path: input.audit_db_path,
    route_ref: "route:/api/research-candidate-review/review-records",
    runtime_slice_ref: "runtime_audit_selected_route_instrumentation_v0_3",
    event_surface: "review_memory_db_routes",
    event_kind: "route_response",
    event_action: input.event_action,
    event_status: input.event_status,
    subject_ref: input.subject_ref,
    related_refs: input.related_refs,
    primary_result_status: input.primary_result_status,
    primary_result_ref: input.primary_result_ref,
    bounded_summary: input.bounded_summary,
    bounded_error_code: input.bounded_error_code,
  });
}
