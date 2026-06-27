import { existsSync } from "node:fs";

import Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  createResearchCandidateReviewMemoryDbRouteErrorResponseV01,
  createResearchCandidateReviewMemoryDbRouteStoreResponseV01,
  isSafeResearchCandidateReviewMemoryDbRoutePathV01,
  isSafeResearchCandidateReviewMemoryDbRouteRefV01,
  requestHasResearchCandidateReviewMemoryDbRouteSameOriginBoundaryV01,
  researchCandidateReviewMemoryDbRouteStoreResultHttpStatusV01,
  validateResearchCandidateReviewMemoryDbRouteQueryIdentityV01,
} from "../../../../../lib/research-candidate-review/review-memory-db-route-contract";
import {
  readResearchCandidateReviewRecordV01,
  researchCandidateReviewMemoryDbSchemaExistsV01,
} from "../../../../../lib/research-candidate-review/review-memory-db-store";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ review_record_id: string }> },
) {
  if (!requestHasResearchCandidateReviewMemoryDbRouteSameOriginBoundaryV01(request)) {
    return jsonResponse(createResearchCandidateReviewMemoryDbRouteErrorResponseV01("same_origin_required", "read_review_record"), 403);
  }

  const reviewRecordId = decodeRouteParam((await params).review_record_id);
  if (!isSafeResearchCandidateReviewMemoryDbRouteRefV01(reviewRecordId)) {
    return jsonResponse(createResearchCandidateReviewMemoryDbRouteErrorResponseV01("invalid_review_record_id", "read_review_record"), 400);
  }

  const url = new URL(request.url);
  const identityError = validateResearchCandidateReviewMemoryDbRouteQueryIdentityV01(url);
  if (identityError) {
    return jsonResponse(createResearchCandidateReviewMemoryDbRouteErrorResponseV01(identityError, "read_review_record"), 400);
  }

  const dbPath = url.searchParams.get("db_path") ?? "";
  if (!isSafeResearchCandidateReviewMemoryDbRoutePathV01(dbPath)) {
    return jsonResponse(createResearchCandidateReviewMemoryDbRouteErrorResponseV01("invalid_db_path", "read_review_record"), 400);
  }

  const opened = openReadOnlyLocalDb(dbPath);
  if ("errorCode" in opened) {
    return jsonResponse(
      createResearchCandidateReviewMemoryDbRouteErrorResponseV01(opened.errorCode, "read_review_record"),
      opened.status,
    );
  }
  const db = opened.db;
  try {
    if (!researchCandidateReviewMemoryDbSchemaExistsV01(db)) {
      return jsonResponse(createResearchCandidateReviewMemoryDbRouteErrorResponseV01("schema_missing", "read_review_record"), 400);
    }
    const result = readResearchCandidateReviewRecordV01(reviewRecordId, db);
    return jsonResponse(
      createResearchCandidateReviewMemoryDbRouteStoreResponseV01("read_review_record", result),
      researchCandidateReviewMemoryDbRouteStoreResultHttpStatusV01(result),
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
