import { existsSync } from "node:fs";

import Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  createRebuildableRetrievalIndexRuntimeBoundaryV01,
  validateRebuildableRetrievalIndexV01,
} from "@/lib/research-retrieval/rebuild-index";
import {
  createResearchRetrievalIndexAuthorityBoundaryV01,
  isSafeResearchRetrievalDbPathV01,
  rebuildableRetrievalIndexRuntimeDerivedStoreV01,
  researchRetrievalIndexSchemaExistsV01,
} from "@/lib/research-retrieval/index-store";
import {
  RESEARCH_RETRIEVAL_INDEX_RUNTIME_COMPLETION_SEARCH_VERSION_V01,
  searchResearchRetrievalIndexV01,
  type ResearchRetrievalIndexSearchInputV01,
  type ResearchRetrievalIndexSearchRuntimeResultV01,
  searchRebuildableRetrievalIndexV01,
  validateResearchRetrievalIndexSearchRequestV01,
} from "@/lib/research-retrieval/search-index";
import {
  maybeWriteRuntimeRouteAuditEventV01,
  type RuntimeRouteAuditInstrumentationResultV01,
} from "@/lib/runtime-audit/route-audit-instrumentation";

export const runtime = "nodejs";

const completionSearchRouteVersion =
  "rebuildable_retrieval_index_runtime_completion_search_route.v0.1" as const;

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

  if (isCompletionSearchRouteBody(body)) {
    return handleCompletionSearchRoute(body);
  }

  const searchRequest = body.search_request;
  const validation = validateResearchRetrievalIndexSearchRequestV01(searchRequest);
  if (!validation.passed || !isRecord(searchRequest)) {
    return jsonResponse(errorResponse("invalid_search_request"), 400);
  }

  const hasInlineIndex = Object.prototype.hasOwnProperty.call(body, "index");
  const inlineIndex = hasInlineIndex && isRecord(body.index) ? body.index : null;
  if (hasInlineIndex) {
    if (!inlineIndex || !validateRebuildableRetrievalIndexV01(inlineIndex).passed) {
      return jsonResponse(errorResponse("invalid_inline_index"), 400);
    }
  }

  const requestedIndexId =
    typeof body.index_id === "string"
      ? body.index_id
      : typeof searchRequest.index_id === "string"
        ? searchRequest.index_id
        : "";
  let index: unknown = inlineIndex;
  if (!index) {
    index = rebuildableRetrievalIndexRuntimeDerivedStoreV01.readIndex(requestedIndexId);
  }
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

function handleCompletionSearchRoute(body: Record<string, unknown>) {
  const inputBody = body as {
    route_version?: unknown;
    scope?: unknown;
    db_path?: unknown;
    audit_db_path?: unknown;
    input?: unknown;
  };
  if (
    inputBody.route_version !== completionSearchRouteVersion ||
    inputBody.scope !== "project:augnes" ||
    !isRecord(inputBody.input)
  ) {
    return jsonResponse(completionErrorResponse("invalid_route_request"), 400);
  }
  if (!isSafeResearchRetrievalDbPathV01(inputBody.db_path)) {
    return jsonResponse(completionErrorResponse("invalid_db_path"), 400);
  }
  if (!existsSync(inputBody.db_path)) {
    return jsonResponse(completionErrorResponse("db_missing"), 404);
  }
  const input = {
    ...inputBody.input,
    db_path: inputBody.db_path,
  } as ResearchRetrievalIndexSearchInputV01;
  if (input.search_version !== RESEARCH_RETRIEVAL_INDEX_RUNTIME_COMPLETION_SEARCH_VERSION_V01) {
    return jsonResponse(completionErrorResponse("invalid_route_request"), 400);
  }

  let db: Database.Database;
  try {
    db = new Database(inputBody.db_path, { readonly: true, fileMustExist: true });
  } catch {
    return jsonResponse(completionErrorResponse("db_missing"), 404);
  }
  try {
    if (!researchRetrievalIndexSchemaExistsV01(db)) {
      return jsonResponse(completionErrorResponse("schema_missing"), 400);
    }
    const result = searchResearchRetrievalIndexV01(input, db);
    const statusCode = completionSearchHttpStatus(result);
    const auditEventResult = maybeWriteRuntimeRouteAuditEventV01({
      audit_db_path: inputBody.audit_db_path,
      route_ref: "route:/api/research-retrieval/search",
      runtime_slice_ref: "rebuildable_retrieval_index_runtime_completion_v0_1",
      event_surface: "retrieval_index_runtime",
      event_kind: "route_response",
      event_action: "retrieval_index_search_completed",
      event_status: result.status,
      subject_ref: result.search_request_id || "retrieval-index-search:result",
      related_refs: [
        result.search_request_id,
        ...result.results.map((item) => item.result_ref),
        ...result.results.map((item) => item.index_entry_id),
      ].filter(Boolean),
      primary_result_status: result.status,
      primary_result_ref: result.search_request_id || "retrieval-index-search:result",
      bounded_summary:
        result.status === "searched" || result.status === "not_found"
          ? "Retrieval search route returned bounded search results."
          : "Retrieval search route returned bounded status.",
      bounded_error_code: statusCode >= 400 ? result.status : null,
    });
    return jsonResponse(completionSearchResponse(result, statusCode, auditEventResult), statusCode);
  } finally {
    db.close();
  }
}

function isCompletionSearchRouteBody(body: Record<string, unknown>): boolean {
  if (body.route_version === completionSearchRouteVersion) return true;
  return (
    isRecord(body.input) &&
    body.input.search_version === RESEARCH_RETRIEVAL_INDEX_RUNTIME_COMPLETION_SEARCH_VERSION_V01
  );
}

function completionSearchHttpStatus(result: ResearchRetrievalIndexSearchRuntimeResultV01): number {
  if (result.status === "blocked_forbidden_authority") return 403;
  if (result.status === "schema_missing") return 400;
  if (result.status === "blocked_private_or_raw_payload" || result.status === "blocked_invalid_input") {
    return 400;
  }
  return 200;
}

function completionSearchResponse(
  result: ResearchRetrievalIndexSearchRuntimeResultV01,
  statusCode: number,
  auditEventResult?: RuntimeRouteAuditInstrumentationResultV01,
) {
  return {
    route_version: completionSearchRouteVersion,
    scope: "project:augnes",
    status: statusCode >= 400 ? "error" : "ok",
    error_code: statusCode >= 400 ? result.status : null,
    result,
    provider_call_executed: false,
    prompt_sent: false,
    source_fetch_executed: false,
    live_crawling_executed: false,
    embedding_created: false,
    vector_search_executed: false,
    rag_answer_generated: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    promotion_executed: false,
    durable_state_written: false,
    formation_receipt_written: false,
    product_write_executed: false,
    product_id_allocated: false,
    authority_boundary: result.authority_boundary,
    audit_event_result: auditEventResult,
  };
}

function completionErrorResponse(errorCode: string) {
  return {
    route_version: completionSearchRouteVersion,
    scope: "project:augnes",
    status: "error",
    error_code: errorCode,
    provider_call_executed: false,
    prompt_sent: false,
    source_fetch_executed: false,
    live_crawling_executed: false,
    embedding_created: false,
    vector_search_executed: false,
    rag_answer_generated: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    promotion_executed: false,
    durable_state_written: false,
    formation_receipt_written: false,
    product_write_executed: false,
    product_id_allocated: false,
    authority_boundary: createResearchRetrievalIndexAuthorityBoundaryV01({
      derived_index_search_now: false,
    }),
  };
}
