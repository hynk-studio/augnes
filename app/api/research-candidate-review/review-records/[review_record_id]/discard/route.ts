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
} from "../../../../../../lib/research-candidate-review/review-memory-db-store";

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
    return jsonResponse(
      createResearchCandidateReviewMemoryDbRouteStoreResponseV01("discard_review_record", result),
      researchCandidateReviewMemoryDbRouteStoreResultHttpStatusV01(result),
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
