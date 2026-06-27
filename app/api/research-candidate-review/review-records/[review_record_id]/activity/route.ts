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
} from "../../../../../../lib/research-candidate-review/review-memory-db-store";

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
    return jsonResponse(
      createResearchCandidateReviewMemoryDbRouteStoreResponseV01("list_review_record_activity", result),
      researchCandidateReviewMemoryDbRouteStoreResultHttpStatusV01(result),
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
    return jsonResponse(
      createResearchCandidateReviewMemoryDbRouteStoreResponseV01("append_review_record_activity", result),
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
