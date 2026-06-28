import { existsSync } from "node:fs";

import Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  buildRagContextPreviewRuntimeCompletionV01,
  createRagContextPreviewRuntimeCompletionAuthorityBoundaryV01,
  RAG_CONTEXT_PREVIEW_RUNTIME_COMPLETION_PREVIEW_VERSION_V01,
  RAG_CONTEXT_PREVIEW_RUNTIME_COMPLETION_REQUEST_VERSION_V01,
  type RagContextPreviewRuntimeRequestV01,
  type RagContextPreviewRuntimeResultV01,
} from "@/lib/research-retrieval/build-rag-context-preview";
import {
  isSafeResearchRetrievalDbPathV01,
  researchRetrievalIndexSchemaExistsV01,
} from "@/lib/research-retrieval/index-store";
import {
  maybeWriteRuntimeRouteAuditEventV01,
  type RuntimeRouteAuditInstrumentationResultV01,
} from "@/lib/runtime-audit/route-audit-instrumentation";

export const runtime = "nodejs";

const scope = "project:augnes" as const;
const routeVersion = "rag_context_preview_runtime_completion_route.v0.1" as const;

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
    return jsonResponse(errorResponse("invalid_json_object"), 400);
  }

  const routeBody = body as {
    route_version?: unknown;
    scope?: unknown;
    input?: unknown;
    audit_db_path?: unknown;
  };
  if (
    routeBody.route_version !== routeVersion ||
    routeBody.scope !== scope ||
    !isRecord(routeBody.input)
  ) {
    return jsonResponse(errorResponse("invalid_route_request"), 400);
  }
  const input = routeBody.input as unknown as RagContextPreviewRuntimeRequestV01;
  if (
    input.request_version !== RAG_CONTEXT_PREVIEW_RUNTIME_COMPLETION_REQUEST_VERSION_V01 ||
    input.preview_version !== RAG_CONTEXT_PREVIEW_RUNTIME_COMPLETION_PREVIEW_VERSION_V01
  ) {
    return jsonResponse(errorResponse("invalid_route_request"), 400);
  }
  if (!isSafeResearchRetrievalDbPathV01(input.db_path)) {
    return jsonResponse(errorResponse("invalid_db_path"), 400);
  }
  if (!existsSync(input.db_path)) {
    return jsonResponse(errorResponse("db_missing"), 404);
  }

  let db: Database.Database;
  try {
    db = new Database(input.db_path, { readonly: true, fileMustExist: true });
  } catch {
    return jsonResponse(errorResponse("db_missing"), 404);
  }
  try {
    if (!researchRetrievalIndexSchemaExistsV01(db)) {
      return jsonResponse(errorResponse("schema_missing"), 400);
    }
    const result = buildRagContextPreviewRuntimeCompletionV01(input, db);
    const statusCode = resultHttpStatus(result);
    const auditEventResult = maybeWriteRuntimeRouteAuditEventV01({
      audit_db_path: routeBody.audit_db_path,
      route_ref: "route:/api/research-retrieval/rag-context-preview",
      runtime_slice_ref: "rag_context_preview_runtime_completion_v0_1",
      event_surface: "rag_context_preview_runtime",
      event_kind: "route_response",
      event_action: "rag_context_preview_completed",
      event_status: result.status,
      subject_ref: result.preview_request_id,
      related_refs: [result.query_ref, result.search_request_ref, ...result.retrieved_refs],
      primary_result_status: result.status,
      primary_result_ref: result.preview_request_id,
      bounded_summary:
        result.status === "context_preview_created"
          ? "RAG context preview route returned context preview."
          : "RAG context preview route returned bounded status.",
      bounded_error_code: statusCode >= 400 ? result.status : null,
    });
    return jsonResponse(resultResponse(result, statusCode, auditEventResult), statusCode);
  } finally {
    db.close();
  }
}

function resultHttpStatus(result: RagContextPreviewRuntimeResultV01): number {
  if (result.status === "blocked_forbidden_authority") return 403;
  if (result.status === "db_missing") return 404;
  if (
    result.status === "schema_missing" ||
    result.status === "blocked_private_or_raw_payload" ||
    result.status === "blocked_invalid_input" ||
    result.status === "rejected"
  ) {
    return 400;
  }
  return 200;
}

function resultResponse(
  result: RagContextPreviewRuntimeResultV01,
  statusCode: number,
  auditEventResult?: RuntimeRouteAuditInstrumentationResultV01,
) {
  return {
    route_version: routeVersion,
    scope,
    status: statusCode >= 400 ? "error" : "ok",
    error_code: statusCode >= 400 ? result.status : null,
    result,
    retrieval_executed: result.retrieval_executed,
    rag_answer_generated: false,
    final_answer_generated: false,
    provider_call_executed: false,
    prompt_sent: false,
    source_fetch_executed: false,
    embedding_created: false,
    vector_search_executed: false,
    retrieval_index_write_executed: false,
    db_write_executed: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    candidate_mutation_executed: false,
    review_memory_written: false,
    promotion_executed: false,
    durable_state_written: false,
    formation_receipt_written: false,
    product_write_executed: false,
    product_id_allocated: false,
    authority_boundary: result.authority_boundary,
    audit_event_result: auditEventResult,
  };
}

function errorResponse(errorCode: string) {
  return {
    route_version: routeVersion,
    scope,
    status: "error",
    error_code: errorCode,
    retrieval_executed: false,
    rag_answer_generated: false,
    final_answer_generated: false,
    provider_call_executed: false,
    prompt_sent: false,
    source_fetch_executed: false,
    embedding_created: false,
    vector_search_executed: false,
    retrieval_index_write_executed: false,
    db_write_executed: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    candidate_mutation_executed: false,
    review_memory_written: false,
    promotion_executed: false,
    durable_state_written: false,
    formation_receipt_written: false,
    product_write_executed: false,
    product_id_allocated: false,
    authority_boundary: createRagContextPreviewRuntimeCompletionAuthorityBoundaryV01(),
  };
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

function jsonResponse(response: unknown, status = 200) {
  return NextResponse.json(response, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
