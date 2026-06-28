import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  createResearchCandidateReviewMemoryDbRouteErrorResponseV01,
  createResearchCandidateReviewMemoryDbRouteStoreResponseV01,
  isSafeResearchCandidateReviewMemoryDbRouteRefV01,
  requestHasResearchCandidateReviewMemoryDbRouteSameOriginBoundaryV01,
  researchCandidateReviewMemoryDbRouteStoreResultHttpStatusV01,
  validateResearchCandidateReviewMemoryDbRouteBodyV01,
  validateResearchCandidateReviewMemoryDbRouteDiscardReasonV01,
} from "../../../../../../lib/research-candidate-review/review-memory-db-route-contract";
import {
  discardResearchCandidateReviewRecordV01,
  ensureResearchCandidateReviewMemoryDbSchemaV01,
  type ResearchCandidateReviewMemoryDbStoreResultV01,
} from "../../../../../../lib/research-candidate-review/review-memory-db-store";
import {
  maybeWriteRuntimeRouteAuditEventV01,
  type RuntimeRouteAuditInstrumentationResultV01,
} from "../../../../../../lib/runtime-audit/route-audit-instrumentation";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ review_record_id: string }> },
) {
  if (!requestHasResearchCandidateReviewMemoryDbRouteSameOriginBoundaryV01(request)) {
    return jsonResponse(createResearchCandidateReviewMemoryDbRouteErrorResponseV01("same_origin_required", "discard_review_record"), 403);
  }

  const reviewRecordId = decodeRouteParam((await params).review_record_id);
  if (!isSafeResearchCandidateReviewMemoryDbRouteRefV01(reviewRecordId)) {
    return jsonResponse(createResearchCandidateReviewMemoryDbRouteErrorResponseV01("invalid_review_record_id", "discard_review_record"), 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(createResearchCandidateReviewMemoryDbRouteErrorResponseV01("invalid_json_body", "discard_review_record"), 400);
  }

  const validation = validateResearchCandidateReviewMemoryDbRouteBodyV01(body, "discard_review_record");
  if (!validation.passed || !validation.body) {
    const errorCode = validation.failure_codes.includes("invalid_db_path")
      ? "invalid_db_path"
      : validation.failure_codes[0] ?? "invalid_route_request";
    return jsonResponse(createResearchCandidateReviewMemoryDbRouteErrorResponseV01(errorCode, "discard_review_record"), 400);
  }
  const reasonError = validateResearchCandidateReviewMemoryDbRouteDiscardReasonV01(validation.body.reason);
  if (reasonError) {
    return jsonResponse(createResearchCandidateReviewMemoryDbRouteErrorResponseV01(reasonError, "discard_review_record"), 400);
  }

  const db = openWriteLocalDb(validation.body.db_path as string);
  try {
    const result = discardResearchCandidateReviewRecordV01(
      reviewRecordId,
      validation.body.reason as string,
      db,
    );
    const statusCode = researchCandidateReviewMemoryDbRouteStoreResultHttpStatusV01(result);
    const auditEventResult = maybeWriteRuntimeRouteAuditEventV01({
      audit_db_path: (body as { audit_db_path?: unknown }).audit_db_path,
      route_ref: "route:/api/research-candidate-review/review-records/[review_record_id]/discard",
      runtime_slice_ref: "runtime_audit_selected_route_instrumentation_v0_3",
      event_surface: "review_memory_db_routes",
      event_kind: "route_response",
      event_action: "review_memory_record_discarded",
      event_status: result.status,
      subject_ref: reviewRecordId,
      related_refs: [
        reviewRecordId,
        ...result.records.map((record) => record.review_record_id),
        ...result.activities.map((activity) => activity.activity_id),
      ],
      primary_result_status: result.status,
      primary_result_ref: result.record?.review_record_id ?? reviewRecordId,
      bounded_summary: "Review memory discard route returned bounded lifecycle transition result.",
      bounded_error_code: statusCode >= 400 ? result.status : null,
    });
    return jsonResponse(
      createRouteStoreResponseWithAudit("discard_review_record", result, auditEventResult),
      statusCode,
    );
  } finally {
    db.close();
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
