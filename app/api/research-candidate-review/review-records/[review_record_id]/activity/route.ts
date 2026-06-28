import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

import Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  createResearchCandidateReviewMemoryDbRouteErrorResponseV01,
  createResearchCandidateReviewMemoryDbRouteStoreResponseV01,
  isSafeResearchCandidateReviewMemoryDbRoutePathV01,
  isSafeResearchCandidateReviewMemoryDbRouteRefV01,
  requestHasResearchCandidateReviewMemoryDbRouteSameOriginBoundaryV01,
  researchCandidateReviewMemoryDbRouteStoreResultHttpStatusV01,
  validateResearchCandidateReviewMemoryDbRouteBodyV01,
  validateResearchCandidateReviewMemoryDbRouteQueryIdentityV01,
} from "../../../../../../lib/research-candidate-review/review-memory-db-route-contract";
import {
  appendResearchCandidateReviewRecordActivityV01,
  ensureResearchCandidateReviewMemoryDbSchemaV01,
  readResearchCandidateReviewRecordV01,
  researchCandidateReviewMemoryDbSchemaExistsV01,
  type ResearchCandidateReviewMemoryDbActivityInputV01,
  type ResearchCandidateReviewMemoryDbStoreResultV01,
} from "../../../../../../lib/research-candidate-review/review-memory-db-store";
import {
  maybeWriteRuntimeRouteAuditEventV01,
  type RuntimeRouteAuditInstrumentationResultV01,
} from "../../../../../../lib/runtime-audit/route-audit-instrumentation";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ review_record_id: string }> },
) {
  if (!requestHasResearchCandidateReviewMemoryDbRouteSameOriginBoundaryV01(request)) {
    return jsonResponse(createResearchCandidateReviewMemoryDbRouteErrorResponseV01("same_origin_required", "list_review_record_activity"), 403);
  }

  const reviewRecordId = decodeRouteParam((await params).review_record_id);
  if (!isSafeResearchCandidateReviewMemoryDbRouteRefV01(reviewRecordId)) {
    return jsonResponse(createResearchCandidateReviewMemoryDbRouteErrorResponseV01("invalid_review_record_id", "list_review_record_activity"), 400);
  }

  const url = new URL(request.url);
  const auditDbPath = url.searchParams.get("audit_db_path");
  const identityError = validateResearchCandidateReviewMemoryDbRouteQueryIdentityV01(url);
  if (identityError) {
    return jsonResponse(createResearchCandidateReviewMemoryDbRouteErrorResponseV01(identityError, "list_review_record_activity"), 400);
  }

  const dbPath = url.searchParams.get("db_path") ?? "";
  if (!isSafeResearchCandidateReviewMemoryDbRoutePathV01(dbPath)) {
    return jsonResponse(createResearchCandidateReviewMemoryDbRouteErrorResponseV01("invalid_db_path", "list_review_record_activity"), 400);
  }

  const opened = openReadOnlyLocalDb(dbPath);
  if ("errorCode" in opened) {
    return jsonResponse(
      createResearchCandidateReviewMemoryDbRouteErrorResponseV01(opened.errorCode, "list_review_record_activity"),
      opened.status,
    );
  }
  const db = opened.db;
  try {
    if (!researchCandidateReviewMemoryDbSchemaExistsV01(db)) {
      return jsonResponse(createResearchCandidateReviewMemoryDbRouteErrorResponseV01("schema_missing", "list_review_record_activity"), 400);
    }
    const result = readResearchCandidateReviewRecordV01(reviewRecordId, db);
    const statusCode = researchCandidateReviewMemoryDbRouteStoreResultHttpStatusV01(result);
    const firstActivityId = result.activities[0]?.activity_id ?? "empty";
    const auditEventResult = writeReviewMemoryActivityRouteAuditEvent({
      audit_db_path: auditDbPath,
      event_action: "review_memory_activity_listed",
      event_status: result.status,
      subject_ref: reviewRecordId,
      related_refs: [
        reviewRecordId,
        ...result.activities.map((activity) => activity.activity_id),
      ],
      primary_result_status: result.status,
      primary_result_ref: `${reviewRecordId}:activity:${result.activities.length}:${firstActivityId}`,
      bounded_summary: "Review memory activity route returned bounded activity result.",
      bounded_error_code: statusCode >= 400 ? result.status : null,
    });
    return jsonResponse(
      createRouteStoreResponseWithAudit("list_review_record_activity", result, auditEventResult),
      statusCode,
    );
  } finally {
    db.close();
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ review_record_id: string }> },
) {
  if (!requestHasResearchCandidateReviewMemoryDbRouteSameOriginBoundaryV01(request)) {
    return jsonResponse(createResearchCandidateReviewMemoryDbRouteErrorResponseV01("same_origin_required", "append_review_record_activity"), 403);
  }

  const reviewRecordId = decodeRouteParam((await params).review_record_id);
  if (!isSafeResearchCandidateReviewMemoryDbRouteRefV01(reviewRecordId)) {
    return jsonResponse(createResearchCandidateReviewMemoryDbRouteErrorResponseV01("invalid_review_record_id", "append_review_record_activity"), 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(createResearchCandidateReviewMemoryDbRouteErrorResponseV01("invalid_json_body", "append_review_record_activity"), 400);
  }

  const validation = validateResearchCandidateReviewMemoryDbRouteBodyV01(body, "append_review_record_activity");
  if (!validation.passed || !validation.body) {
    const errorCode = validation.failure_codes.includes("invalid_db_path")
      ? "invalid_db_path"
      : validation.failure_codes[0] ?? "invalid_activity_input";
    return jsonResponse(createResearchCandidateReviewMemoryDbRouteErrorResponseV01(errorCode, "append_review_record_activity"), 400);
  }
  if (!validation.body.input || typeof validation.body.input !== "object" || Array.isArray(validation.body.input)) {
    return jsonResponse(createResearchCandidateReviewMemoryDbRouteErrorResponseV01("invalid_activity_input", "append_review_record_activity"), 400);
  }
  const input = validation.body.input as Partial<ResearchCandidateReviewMemoryDbActivityInputV01>;
  if (input.review_record_id !== reviewRecordId) {
    return jsonResponse(createResearchCandidateReviewMemoryDbRouteErrorResponseV01("invalid_activity_input", "append_review_record_activity"), 400);
  }

  const db = openWriteLocalDb(validation.body.db_path as string);
  try {
    const result = appendResearchCandidateReviewRecordActivityV01(
      validation.body.input as ResearchCandidateReviewMemoryDbActivityInputV01,
      db,
    );
    const statusCode = researchCandidateReviewMemoryDbRouteStoreResultHttpStatusV01(result);
    const activityRef = result.activities[0]?.activity_id ?? reviewRecordId;
    const auditEventResult = writeReviewMemoryActivityRouteAuditEvent({
      audit_db_path: (body as { audit_db_path?: unknown }).audit_db_path,
      event_action: "review_memory_activity_appended",
      event_status: result.status,
      subject_ref: reviewRecordId,
      related_refs: [
        reviewRecordId,
        ...result.activities.map((activity) => activity.activity_id),
      ],
      primary_result_status: result.status,
      primary_result_ref: activityRef,
      bounded_summary: "Review memory activity route returned bounded activity result.",
      bounded_error_code: statusCode >= 400 ? result.status : null,
    });
    return jsonResponse(
      createRouteStoreResponseWithAudit("append_review_record_activity", result, auditEventResult),
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

function decodeRouteParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return "";
  }
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

function writeReviewMemoryActivityRouteAuditEvent(input: {
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
    route_ref: "route:/api/research-candidate-review/review-records/[review_record_id]/activity",
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
