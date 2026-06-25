import { existsSync } from "node:fs";

import { NextResponse } from "next/server";

import {
  getReviewMemoryRouteAuthorityBoundary,
  getReviewMemoryRouteBoundaryNotes,
  isSafeReviewMemoryRouteStoreFilePath,
  sanitizeReviewMemoryRouteError,
  validateReviewMemoryRouteRequest,
  type ReviewMemoryRouteAction,
  type ReviewMemoryRouteResponse,
} from "../../../../lib/research-candidate-review/review-memory-route-contract";
import {
  createEmptyResearchCandidateReviewMemoryStoreSnapshot,
  discardResearchCandidateReviewMemoryRecord,
  readResearchCandidateReviewMemoryStoreFile,
  supersedeResearchCandidateReviewMemoryRecord,
  upsertResearchCandidateReviewMemoryRecord,
  writeResearchCandidateReviewMemoryStoreFile,
} from "../../../../lib/research-candidate-review/review-memory-store";
import type { ResearchCandidateReviewMemoryStoreSnapshot } from "../../../../types/research-candidate-review-memory-contract";

export const runtime = "nodejs";

const routeVersion = "research_candidate_review_memory_routes.v0.1" as const;
const routeScope = "project:augnes" as const;

export async function GET(request: Request) {
  if (!requestHasSameOriginBoundary(request)) {
    return jsonResponse(errorResponse("same_origin_required"), 403);
  }

  const url = new URL(request.url);
  const storeFilePath = url.searchParams.get("store_file_path") ?? "";
  const allowEmpty = url.searchParams.get("allow_empty") === "1";
  const asOf = url.searchParams.get("as_of") ?? "";

  if (!isSafeReviewMemoryRouteStoreFilePath(storeFilePath)) {
    return jsonResponse(errorResponse("unsafe_store_file_path"), 400);
  }

  try {
    if (existsSync(storeFilePath)) {
      return jsonResponse(okResponse(readResearchCandidateReviewMemoryStoreFile(storeFilePath)));
    }
    if (allowEmpty && asOf) {
      return jsonResponse(
        okResponse(
          createEmptyResearchCandidateReviewMemoryStoreSnapshot({
            scope: routeScope,
            as_of: asOf,
            records: [],
          }),
        ),
      );
    }
    return jsonResponse(errorResponse("store_file_missing"), 404);
  } catch (error) {
    return jsonResponse(errorResponse(sanitizeReviewMemoryRouteError(error)), 400);
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

  const validation = validateReviewMemoryRouteRequest(body);
  if (!validation.passed || !validation.request) {
    const errorCode = validation.failure_codes.includes("unsafe_store_file_path")
      ? "unsafe_store_file_path"
      : "invalid_route_request";
    return jsonResponse(errorResponse(errorCode), 400);
  }

  const routeRequest = validation.request;
  try {
    const storeFileExists = existsSync(routeRequest.store_file_path);
    let snapshot: ResearchCandidateReviewMemoryStoreSnapshot;
    if (routeRequest.action === "create_empty_snapshot") {
      snapshot = createEmptyResearchCandidateReviewMemoryStoreSnapshot({
        scope: routeScope,
        as_of: routeRequest.as_of ?? "",
        records: [],
      });
    } else if (routeRequest.action === "upsert_record" && routeRequest.record) {
      if (!storeFileExists && !routeRequest.as_of) {
        return jsonResponse(errorResponse("invalid_route_request"), 400);
      }
      snapshot = storeFileExists
        ? readResearchCandidateReviewMemoryStoreFile(routeRequest.store_file_path)
        : createEmptyResearchCandidateReviewMemoryStoreSnapshot({
            scope: routeScope,
            as_of: routeRequest.as_of ?? "",
            records: [],
          });
      snapshot = upsertResearchCandidateReviewMemoryRecord(snapshot, routeRequest.record);
    } else if (routeRequest.action === "discard_record" && routeRequest.discard) {
      if (!storeFileExists) return jsonResponse(errorResponse("store_file_missing"), 404);
      snapshot = readResearchCandidateReviewMemoryStoreFile(routeRequest.store_file_path);
      snapshot = discardResearchCandidateReviewMemoryRecord(snapshot, routeRequest.discard);
    } else if (routeRequest.action === "supersede_record" && routeRequest.supersede) {
      if (!storeFileExists) return jsonResponse(errorResponse("store_file_missing"), 404);
      snapshot = readResearchCandidateReviewMemoryStoreFile(routeRequest.store_file_path);
      snapshot = supersedeResearchCandidateReviewMemoryRecord(snapshot, routeRequest.supersede);
    } else {
      return jsonResponse(errorResponse("invalid_route_request"), 400);
    }

    writeResearchCandidateReviewMemoryStoreFile(routeRequest.store_file_path, snapshot);
    return jsonResponse(okResponse(snapshot, routeRequest.action));
  } catch (error) {
    return jsonResponse(errorResponse(sanitizeReviewMemoryRouteError(error)), 400);
  }
}

function requestHasSameOriginBoundary(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) return false;

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
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

function okResponse(snapshot: unknown, action?: ReviewMemoryRouteAction): ReviewMemoryRouteResponse {
  return {
    route_version: routeVersion,
    scope: routeScope,
    status: "ok",
    action,
    snapshot,
    boundary_notes: getReviewMemoryRouteBoundaryNotes(),
    authority_boundary: getReviewMemoryRouteAuthorityBoundary(),
  };
}

function errorResponse(errorCode: string): ReviewMemoryRouteResponse {
  return {
    route_version: routeVersion,
    scope: routeScope,
    status: "error",
    error_code: errorCode,
    boundary_notes: getReviewMemoryRouteBoundaryNotes(),
    authority_boundary: getReviewMemoryRouteAuthorityBoundary(),
  };
}

function jsonResponse(response: ReviewMemoryRouteResponse, status = 200) {
  return NextResponse.json(response, { status });
}
