import { NextResponse } from "next/server";

import { createRebuildableRetrievalIndexRuntimeBoundaryV01 } from "@/lib/research-retrieval/rebuild-index";
import { rebuildableRetrievalIndexRuntimeDerivedStoreV01 } from "@/lib/research-retrieval/index-store";
import {
  searchRebuildableRetrievalIndexV01,
  validateResearchRetrievalIndexSearchRequestV01,
} from "@/lib/research-retrieval/search-index";

export const runtime = "nodejs";

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

  if (!isRecord(body)) {
    return jsonResponse(errorResponse("json_object_required"), 400);
  }

  const searchRequest = body.search_request;
  const validation = validateResearchRetrievalIndexSearchRequestV01(searchRequest);
  if (!validation.passed || !isRecord(searchRequest)) {
    return jsonResponse(errorResponse("invalid_search_request"), 400);
  }

  const inlineIndex = isRecord(body.index) ? body.index : null;
  const requestedIndexId =
    typeof body.index_id === "string"
      ? body.index_id
      : typeof searchRequest.index_id === "string"
        ? searchRequest.index_id
        : "";
  const index = inlineIndex ?? rebuildableRetrievalIndexRuntimeDerivedStoreV01.readIndex(requestedIndexId);
  if (!index) {
    return jsonResponse(errorResponse("derived_index_not_found"), 404);
  }

  const result = searchRebuildableRetrievalIndexV01(index as never, searchRequest as never);
  return jsonResponse({
    route_version: "rebuildable_retrieval_index_search_route.v0.1",
    scope: "project:augnes",
    status: result.rejected ? "rejected" : "ok",
    result,
    boundary_notes: [
      "Route searches only a caller-provided or process-local derived index.",
      "Search results are candidate-only review aids.",
      "Process memory cache is not durable state.",
    ],
    authority_boundary: createRebuildableRetrievalIndexRuntimeBoundaryV01({
      boundedLocalIndexSearchNow: true,
    }),
  });
}

function requestHasSameOriginBoundary(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) return false;

  const origin = request.headers.get("origin");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
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

function errorResponse(errorCode: string) {
  return {
    route_version: "rebuildable_retrieval_index_search_route.v0.1",
    scope: "project:augnes",
    status: "error",
    error_code: errorCode,
    authority_boundary: createRebuildableRetrievalIndexRuntimeBoundaryV01({
      boundedLocalIndexSearchNow: true,
    }),
  };
}

function jsonResponse(response: unknown, status = 200) {
  return NextResponse.json(response, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
