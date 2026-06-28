import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  createFinalRagAnswerReviewMemoryBindingAuthorityBoundaryV01,
  createFinalRagAnswerReviewMemoryBindingFailureResultV01,
  preflightFinalRagAnswerReviewMemoryBindingRuntimeV01,
  runFinalRagAnswerReviewMemoryBindingRuntimeV01,
} from "@/lib/research-retrieval/final-rag-answer-review-memory-binding";
import {
  maybeWriteRuntimeRouteAuditEventV01,
  type RuntimeRouteAuditInstrumentationResultV01,
} from "@/lib/runtime-audit/route-audit-instrumentation";
import {
  FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_ROUTE_VERSION_V01,
  FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_SCOPE_V01,
  type FinalRagAnswerReviewMemoryBindingRequestV01,
  type FinalRagAnswerReviewMemoryBindingResultV01,
} from "@/types/final-rag-answer-review-memory-binding";

export const runtime = "nodejs";

const routeRef = "route:/api/research-retrieval/final-rag-answer/review-memory" as const;
const runtimeSliceRef = "final_rag_answer_candidate_review_memory_binding_v0_1" as const;

export function createFinalRagAnswerReviewMemoryBindingPostHandlerV01() {
  return async function finalRagAnswerReviewMemoryBindingPost(request: Request) {
    if (!requestHasSameOriginBoundary(request)) {
      return jsonResponse(errorResponse("same_origin_required"), 403);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse(errorResponse("invalid_json_body"), 400);
    }
    if (!isRecord(body)) return jsonResponse(errorResponse("invalid_json_object"), 400);

    const routeBody = body as {
      route_version?: unknown;
      scope?: unknown;
      input?: unknown;
      audit_db_path?: unknown;
    };
    if (
      routeBody.route_version !== FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_ROUTE_VERSION_V01 ||
      routeBody.scope !== FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_SCOPE_V01 ||
      !isRecord(routeBody.input)
    ) {
      return jsonResponse(errorResponse("invalid_route_request"), 400);
    }

    const preflightResult = preflightFinalRagAnswerReviewMemoryBindingRuntimeV01(routeBody.input);
    if (preflightResult) {
      const statusCode = resultHttpStatus(preflightResult);
      const auditEventResult = maybeAuditResult({
        auditDbPath: routeBody.audit_db_path,
        result: preflightResult,
        statusCode,
        action: "final_rag_answer_review_memory_binding_rejected",
        boundedSummary: "Final RAG answer review memory binding rejected request before Review Memory DB open.",
      });
      return jsonResponse(resultResponse(preflightResult, statusCode, auditEventResult), statusCode);
    }

    const input = routeBody.input as unknown as FinalRagAnswerReviewMemoryBindingRequestV01;
    let db: Database.Database;
    try {
      db = openWriteLocalDb(input.review_memory_db_path);
    } catch {
      const result = createFinalRagAnswerReviewMemoryBindingFailureResultV01({
        status: "blocked_invalid_input",
        reason_codes: ["review_memory_db_open_failed_bounded"],
        failure_codes: ["review_memory_db_open_failed_bounded"],
        input,
      });
      const auditEventResult = maybeAuditResult({
        auditDbPath: routeBody.audit_db_path,
        result,
        statusCode: 400,
        action: "final_rag_answer_review_memory_binding_rejected",
        boundedSummary: "Final RAG answer review memory binding could not open bounded Review Memory DB.",
      });
      return jsonResponse(resultResponse(result, 400, auditEventResult), 400);
    }

    try {
      const result = runFinalRagAnswerReviewMemoryBindingRuntimeV01(input, db);
      const statusCode = resultHttpStatus(result);
      const auditEventResult = maybeAuditResult({
        auditDbPath: routeBody.audit_db_path,
        result,
        statusCode,
        action:
          result.status === "created" || result.status === "idempotent_existing"
            ? "final_rag_answer_review_memory_record_bound"
            : "final_rag_answer_review_memory_binding_rejected",
        boundedSummary:
          result.status === "created" || result.status === "idempotent_existing"
            ? "Final RAG answer candidate was bound to bounded Review Memory record."
            : "Final RAG answer review memory binding returned bounded non-success status.",
      });
      return jsonResponse(resultResponse(result, statusCode, auditEventResult), statusCode);
    } finally {
      db.close();
    }
  };
}

export const POST = createFinalRagAnswerReviewMemoryBindingPostHandlerV01();

function openWriteLocalDb(dbPath: string): Database.Database {
  mkdirSync(dirname(dbPath), { recursive: true });
  return new Database(dbPath);
}

function resultHttpStatus(result: FinalRagAnswerReviewMemoryBindingResultV01): number {
  if (result.status === "created") return 201;
  if (result.status === "idempotent_existing") return 200;
  if (result.status === "conflict_existing_record") return 409;
  if (result.status === "blocked_forbidden_authority") return 403;
  return 400;
}

function resultResponse(
  result: FinalRagAnswerReviewMemoryBindingResultV01,
  statusCode: number,
  auditEventResult?: RuntimeRouteAuditInstrumentationResultV01,
) {
  return {
    route_version: FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_ROUTE_VERSION_V01,
    scope: FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_SCOPE_V01,
    status: statusCode >= 400 ? "error" : "ok",
    error_code: statusCode >= 400 ? result.status : null,
    result,
    provider_call_executed: false,
    prompt_sent: false,
    retrieval_executed: false,
    rag_answer_generated: false,
    final_answer_generated: false,
    db_query_or_write_executed: result.db_query_or_write_executed,
    db_write_executed: result.db_write_executed,
    review_memory_written: result.review_memory_written,
    source_fetch_executed: false,
    retrieval_index_write_executed: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    promotion_executed: false,
    durable_state_written: false,
    durable_state_applied: false,
    formation_receipt_written: false,
    product_write_executed: false,
    accepted_evidence_ref_write_executed: false,
    product_id_allocated: false,
    github_api_called: false,
    git_write_executed: false,
    release_executed: false,
    authority_boundary: result.authority_boundary,
    audit_event_result: auditEventResult,
  };
}

function errorResponse(errorCode: string) {
  return {
    route_version: FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_ROUTE_VERSION_V01,
    scope: FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_SCOPE_V01,
    status: "error",
    error_code: errorCode,
    provider_call_executed: false,
    prompt_sent: false,
    retrieval_executed: false,
    rag_answer_generated: false,
    final_answer_generated: false,
    db_query_or_write_executed: false,
    db_write_executed: false,
    review_memory_written: false,
    source_fetch_executed: false,
    retrieval_index_write_executed: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    promotion_executed: false,
    durable_state_written: false,
    durable_state_applied: false,
    formation_receipt_written: false,
    product_write_executed: false,
    accepted_evidence_ref_write_executed: false,
    product_id_allocated: false,
    github_api_called: false,
    git_write_executed: false,
    release_executed: false,
    authority_boundary: createFinalRagAnswerReviewMemoryBindingAuthorityBoundaryV01(),
  };
}

function maybeAuditResult(input: {
  auditDbPath: unknown;
  result: FinalRagAnswerReviewMemoryBindingResultV01;
  statusCode: number;
  action: string;
  boundedSummary: string;
}): RuntimeRouteAuditInstrumentationResultV01 {
  return maybeWriteRuntimeRouteAuditEventV01({
    audit_db_path: input.auditDbPath,
    route_ref: routeRef,
    runtime_slice_ref: runtimeSliceRef,
    event_surface: "final_rag_answer_review_memory_binding_runtime",
    event_kind: "route_response",
    event_action: input.action,
    event_status: input.result.status,
    subject_ref: input.result.review_record_id ?? "final-rag-answer-review-memory-binding:request",
    related_refs: [
      input.result.binding_request_id,
      input.result.answer_request_id,
      input.result.answer_candidate_ref,
      input.result.review_record_id,
    ].filter((ref): ref is string => typeof ref === "string" && ref.length > 0),
    primary_result_status: input.result.status,
    primary_result_ref:
      input.result.review_record_id ??
      input.result.answer_candidate_ref ??
      "final-rag-answer-review-memory-binding:result",
    bounded_summary: input.boundedSummary,
    bounded_error_code: input.statusCode >= 400 ? input.result.status : null,
  });
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
