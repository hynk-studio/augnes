import { existsSync } from "node:fs";

import Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  createFinalRagAnswerCandidateReviewFailureResultV01,
  preflightFinalRagAnswerCandidateReviewRuntimeV01,
  runFinalRagAnswerCandidateReviewRuntimeV01,
} from "@/lib/research-retrieval/build-final-rag-answer-candidate";
import {
  createFinalRagAnswerCandidateAuthorityBoundaryV01,
  type FinalRagAnswerProviderAdapterV01,
} from "@/lib/research-retrieval/final-rag-answer-provider-boundary";
import {
  isSafeResearchRetrievalDbPathV01,
  researchRetrievalIndexSchemaExistsV01,
  type ResearchRetrievalIndexDbLikeV01,
} from "@/lib/research-retrieval/index-store";
import {
  maybeWriteRuntimeRouteAuditEventV01,
  type RuntimeRouteAuditInstrumentationResultV01,
} from "@/lib/runtime-audit/route-audit-instrumentation";
import {
  FINAL_RAG_ANSWER_CANDIDATE_REVIEW_ROUTE_VERSION_V01,
  FINAL_RAG_ANSWER_CANDIDATE_REVIEW_SCOPE_V01,
  type FinalRagAnswerCandidateReviewRequestV01,
  type FinalRagAnswerCandidateReviewResultV01,
} from "@/types/final-rag-answer-candidate-review";

export const runtime = "nodejs";

const routeRef = "route:/api/research-retrieval/final-rag-answer" as const;
const runtimeSliceRef = "final_rag_answer_generation_candidate_review_v0_1" as const;

export function createFinalRagAnswerCandidateReviewPostHandlerV01(options: {
  providerAdapter?: FinalRagAnswerProviderAdapterV01;
} = {}) {
  return async function finalRagAnswerCandidateReviewPost(request: Request) {
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
      routeBody.route_version !== FINAL_RAG_ANSWER_CANDIDATE_REVIEW_ROUTE_VERSION_V01 ||
      routeBody.scope !== FINAL_RAG_ANSWER_CANDIDATE_REVIEW_SCOPE_V01 ||
      !isRecord(routeBody.input)
    ) {
      return jsonResponse(errorResponse("invalid_route_request"), 400);
    }

    const preflightResult = preflightFinalRagAnswerCandidateReviewRuntimeV01(routeBody.input);
    if (preflightResult) {
      const statusCode = resultHttpStatus(preflightResult);
      const auditEventResult = maybeAuditResult({
        auditDbPath: routeBody.audit_db_path,
        result: preflightResult,
        statusCode,
        action: "final_rag_answer_candidate_rejected",
        boundedSummary: "Final RAG answer candidate route rejected request before retrieval DB open.",
      });
      return jsonResponse(resultResponse(preflightResult, statusCode, auditEventResult), statusCode);
    }

    const input = routeBody.input as unknown as FinalRagAnswerCandidateReviewRequestV01;
    const dbPath = input.rag_context_preview_request.db_path;
    if (!isSafeResearchRetrievalDbPathV01(dbPath)) {
      return jsonResponse(errorResponse("invalid_db_path"), 400);
    }
    if (!existsSync(dbPath)) {
      const result = createFinalRagAnswerCandidateReviewFailureResultV01({
        status: "db_missing",
        reason_codes: ["db_missing", "retrieval_db_not_created"],
        failure_codes: ["db_missing"],
      });
      const auditEventResult = maybeAuditResult({
        auditDbPath: routeBody.audit_db_path,
        result,
        statusCode: 404,
        action: "final_rag_answer_candidate_rejected",
        boundedSummary: "Final RAG answer candidate route rejected missing retrieval DB.",
      });
      return jsonResponse(resultResponse(result, 404, auditEventResult), 404);
    }

    let db: Database.Database;
    try {
      db = new Database(dbPath, { readonly: true, fileMustExist: true });
    } catch {
      const result = createFinalRagAnswerCandidateReviewFailureResultV01({
        status: "db_missing",
        reason_codes: ["db_missing", "retrieval_db_not_created"],
        failure_codes: ["db_missing"],
      });
      const auditEventResult = maybeAuditResult({
        auditDbPath: routeBody.audit_db_path,
        result,
        statusCode: 404,
        action: "final_rag_answer_candidate_rejected",
        boundedSummary: "Final RAG answer candidate route rejected missing retrieval DB.",
      });
      return jsonResponse(resultResponse(result, 404, auditEventResult), 404);
    }

    try {
      if (!researchRetrievalIndexSchemaExistsV01(db as unknown as ResearchRetrievalIndexDbLikeV01)) {
        const result = createFinalRagAnswerCandidateReviewFailureResultV01({
          status: "schema_missing",
          reason_codes: ["schema_missing", "retrieval_index_schema_missing"],
          failure_codes: ["schema_missing"],
        });
        const auditEventResult = maybeAuditResult({
          auditDbPath: routeBody.audit_db_path,
          result,
          statusCode: 400,
          action: "final_rag_answer_candidate_rejected",
          boundedSummary: "Final RAG answer candidate route rejected missing retrieval index schema.",
        });
        return jsonResponse(resultResponse(result, 400, auditEventResult), 400);
      }

      const result = await runFinalRagAnswerCandidateReviewRuntimeV01(
        input,
        db as unknown as ResearchRetrievalIndexDbLikeV01,
        { providerAdapter: options.providerAdapter },
      );
      const statusCode = resultHttpStatus(result);
      const auditEventResult = maybeAuditResult({
        auditDbPath: routeBody.audit_db_path,
        result,
        statusCode,
        action:
          result.status === "final_answer_candidate_created"
            ? "final_rag_answer_candidate_created"
            : "final_rag_answer_candidate_rejected",
        boundedSummary:
          result.status === "final_answer_candidate_created"
            ? "Final RAG answer candidate route returned bounded candidate-only answer."
            : "Final RAG answer candidate route returned bounded non-success status.",
      });
      return jsonResponse(resultResponse(result, statusCode, auditEventResult), statusCode);
    } finally {
      db.close();
    }
  };
}

export const POST = createFinalRagAnswerCandidateReviewPostHandlerV01();

function resultHttpStatus(result: FinalRagAnswerCandidateReviewResultV01): number {
  if (result.status === "blocked_forbidden_authority") return 403;
  if (result.status === "db_missing") return 404;
  if (
    result.status === "blocked_invalid_input" ||
    result.status === "blocked_private_or_raw_payload" ||
    result.status === "schema_missing" ||
    result.status === "rejected"
  ) {
    return 400;
  }
  return 200;
}

function resultResponse(
  result: FinalRagAnswerCandidateReviewResultV01,
  statusCode: number,
  auditEventResult?: RuntimeRouteAuditInstrumentationResultV01,
) {
  return {
    route_version: FINAL_RAG_ANSWER_CANDIDATE_REVIEW_ROUTE_VERSION_V01,
    scope: FINAL_RAG_ANSWER_CANDIDATE_REVIEW_SCOPE_V01,
    status: statusCode >= 400 ? "error" : "ok",
    error_code: statusCode >= 400 ? result.status : null,
    result,
    provider_call_executed: result.provider_call_executed,
    prompt_sent: result.prompt_sent,
    retrieval_executed: result.retrieval_executed,
    rag_answer_generated: result.rag_answer_generated,
    final_answer_candidate_generated: result.final_answer_candidate_generated,
    db_write_executed: false,
    retrieval_index_write_executed: false,
    source_fetch_executed: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    review_memory_written: false,
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
    route_version: FINAL_RAG_ANSWER_CANDIDATE_REVIEW_ROUTE_VERSION_V01,
    scope: FINAL_RAG_ANSWER_CANDIDATE_REVIEW_SCOPE_V01,
    status: "error",
    error_code: errorCode,
    provider_call_executed: false,
    prompt_sent: false,
    retrieval_executed: false,
    rag_answer_generated: false,
    final_answer_candidate_generated: false,
    db_write_executed: false,
    retrieval_index_write_executed: false,
    source_fetch_executed: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    review_memory_written: false,
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
    authority_boundary: createFinalRagAnswerCandidateAuthorityBoundaryV01(),
  };
}

function maybeAuditResult(input: {
  auditDbPath: unknown;
  result: FinalRagAnswerCandidateReviewResultV01;
  statusCode: number;
  action: string;
  boundedSummary: string;
}): RuntimeRouteAuditInstrumentationResultV01 {
  return maybeWriteRuntimeRouteAuditEventV01({
    audit_db_path: input.auditDbPath,
    route_ref: routeRef,
    runtime_slice_ref: runtimeSliceRef,
    event_surface: "rag_context_preview_runtime",
    event_kind: "route_response",
    event_action: input.action,
    event_status: input.result.status,
    subject_ref: input.result.answer_request_id ?? "final-rag-answer-candidate:request",
    related_refs: [
      input.result.rag_context_preview_ref,
      input.result.answer_candidate_ref,
      ...input.result.retrieved_refs.slice(0, 8),
      ...input.result.cited_source_refs.slice(0, 8),
    ].filter((ref): ref is string => typeof ref === "string" && ref.length > 0),
    primary_result_status: input.result.status,
    primary_result_ref:
      input.result.answer_candidate_ref ??
      input.result.answer_request_id ??
      "final-rag-answer-candidate:result",
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
