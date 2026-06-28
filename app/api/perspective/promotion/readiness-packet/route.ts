import { existsSync } from "node:fs";

import Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  buildPromotionReadinessPacketFromReviewMemoryV01,
  createPromotionReadinessPacketAuthorityBoundaryV01,
  createPromotionReadinessPacketFailureResultV01,
  preflightPromotionReadinessPacketFromReviewMemoryV01,
} from "@/lib/perspective/promotion/promotion-readiness-packet-from-review-memory";
import { requestHasResearchCandidateReviewMemoryDbRouteSameOriginBoundaryV01 } from "@/lib/research-candidate-review/review-memory-db-route-contract";
import { researchCandidateReviewMemoryDbSchemaExistsV01 } from "@/lib/research-candidate-review/review-memory-db-store";
import {
  maybeWriteRuntimeRouteAuditEventV01,
  type RuntimeRouteAuditInstrumentationResultV01,
} from "@/lib/runtime-audit/route-audit-instrumentation";
import {
  PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_ROUTE_VERSION_V01,
  PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_SCOPE_V01,
  type PromotionReadinessPacketFromReviewMemoryRequestV01,
  type PromotionReadinessPacketFromReviewMemoryResultV01,
} from "@/types/promotion-readiness-packet-from-review-memory";

export const runtime = "nodejs";

const routeRef = "route:/api/perspective/promotion/readiness-packet" as const;
const runtimeSliceRef = "promotion_readiness_packet_from_review_memory_v0_1" as const;

export async function POST(request: Request) {
  if (!requestHasResearchCandidateReviewMemoryDbRouteSameOriginBoundaryV01(request)) {
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
    routeBody.route_version !== PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_ROUTE_VERSION_V01 ||
    routeBody.scope !== PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_SCOPE_V01 ||
    !isRecord(routeBody.input)
  ) {
    return jsonResponse(errorResponse("invalid_route_request"), 400);
  }

  const preflightResult = preflightPromotionReadinessPacketFromReviewMemoryV01(routeBody.input);
  if (preflightResult) {
    const statusCode = resultHttpStatus(preflightResult);
    const auditEventResult = maybeAuditResult({
      auditDbPath: routeBody.audit_db_path,
      result: preflightResult,
      statusCode,
      action: "promotion_readiness_packet_rejected",
      boundedSummary: "Promotion readiness packet request was rejected before Review Memory DB open.",
    });
    return jsonResponse(resultResponse(preflightResult, statusCode, auditEventResult), statusCode);
  }

  const input = routeBody.input as unknown as PromotionReadinessPacketFromReviewMemoryRequestV01;
  const opened = openReadOnlyLocalDb(input.review_memory_db_path);
  if ("result" in opened) {
    const auditEventResult = maybeAuditResult({
      auditDbPath: routeBody.audit_db_path,
      result: opened.result,
      statusCode: resultHttpStatus(opened.result),
      action: "promotion_readiness_packet_rejected",
      boundedSummary: "Promotion readiness packet route could not open existing Review Memory DB.",
    });
    return jsonResponse(
      resultResponse(opened.result, resultHttpStatus(opened.result), auditEventResult),
      resultHttpStatus(opened.result),
    );
  }

  const db = opened.db;
  try {
    if (!researchCandidateReviewMemoryDbSchemaExistsV01(db)) {
      const result = createPromotionReadinessPacketFailureResultV01({
        status: "schema_missing",
        reason_codes: ["schema_missing", "schema_not_created_by_readiness_packet_route"],
        failure_codes: ["schema_missing"],
        input,
      });
      const auditEventResult = maybeAuditResult({
        auditDbPath: routeBody.audit_db_path,
        result,
        statusCode: 400,
        action: "promotion_readiness_packet_rejected",
        boundedSummary: "Promotion readiness packet route found missing Review Memory schema without creating it.",
      });
      return jsonResponse(resultResponse(result, 400, auditEventResult), 400);
    }

    const result = buildPromotionReadinessPacketFromReviewMemoryV01(input, db);
    const statusCode = resultHttpStatus(result);
    const auditEventResult = maybeAuditResult({
      auditDbPath: routeBody.audit_db_path,
      result,
      statusCode,
      action:
        result.status === "ready_for_operator_promotion_review" ||
        result.status === "needs_more_evidence"
          ? "promotion_readiness_packet_built"
          : "promotion_readiness_packet_rejected",
      boundedSummary:
        result.status === "ready_for_operator_promotion_review" ||
        result.status === "needs_more_evidence"
          ? "Promotion readiness packet route returned bounded diagnostic packet."
          : "Promotion readiness packet route returned bounded non-success status.",
    });
    return jsonResponse(resultResponse(result, statusCode, auditEventResult), statusCode);
  } finally {
    db.close();
  }
}

function openReadOnlyLocalDb(dbPath: string):
  | { db: Database.Database }
  | { result: PromotionReadinessPacketFromReviewMemoryResultV01 } {
  if (!existsSync(dbPath)) {
    return {
      result: createPromotionReadinessPacketFailureResultV01({
        status: "db_missing",
        reason_codes: ["db_missing", "review_memory_db_not_created_by_readiness_packet_route"],
        failure_codes: ["db_missing"],
      }),
    };
  }
  try {
    return { db: new Database(dbPath, { readonly: true, fileMustExist: true }) };
  } catch {
    return {
      result: createPromotionReadinessPacketFailureResultV01({
        status: "db_missing",
        reason_codes: ["db_missing", "review_memory_db_open_failed_bounded"],
        failure_codes: ["db_missing"],
      }),
    };
  }
}

function resultHttpStatus(result: PromotionReadinessPacketFromReviewMemoryResultV01): number {
  if (
    result.status === "ready_for_operator_promotion_review" ||
    result.status === "needs_more_evidence"
  ) {
    return 200;
  }
  if (result.status === "db_missing" || result.status === "not_found") return 404;
  if (result.status === "blocked_forbidden_authority") return 403;
  return 400;
}

function resultResponse(
  result: PromotionReadinessPacketFromReviewMemoryResultV01,
  statusCode: number,
  auditEventResult?: RuntimeRouteAuditInstrumentationResultV01,
) {
  return {
    route_version: PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_ROUTE_VERSION_V01,
    scope: PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_SCOPE_V01,
    status: statusCode >= 400 ? "error" : "ok",
    error_code: statusCode >= 400 ? result.status : null,
    result,
    provider_call_executed: false,
    prompt_sent: false,
    retrieval_executed: false,
    source_fetch_executed: false,
    retrieval_index_write_executed: false,
    review_memory_written: false,
    promotion_executed: false,
    promotion_decision_written: false,
    promotion_decision_store_written: false,
    formation_receipt_written: false,
    durable_state_written: false,
    durable_state_applied: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
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
    route_version: PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_ROUTE_VERSION_V01,
    scope: PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_SCOPE_V01,
    status: "error",
    error_code: errorCode,
    provider_call_executed: false,
    prompt_sent: false,
    retrieval_executed: false,
    source_fetch_executed: false,
    retrieval_index_write_executed: false,
    review_memory_written: false,
    promotion_executed: false,
    promotion_decision_written: false,
    promotion_decision_store_written: false,
    formation_receipt_written: false,
    durable_state_written: false,
    durable_state_applied: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    accepted_evidence_ref_write_executed: false,
    product_id_allocated: false,
    github_api_called: false,
    git_write_executed: false,
    release_executed: false,
    authority_boundary: createPromotionReadinessPacketAuthorityBoundaryV01(),
  };
}

function maybeAuditResult(input: {
  auditDbPath: unknown;
  result: PromotionReadinessPacketFromReviewMemoryResultV01;
  statusCode: number;
  action: string;
  boundedSummary: string;
}): RuntimeRouteAuditInstrumentationResultV01 {
  return maybeWriteRuntimeRouteAuditEventV01({
    audit_db_path: input.auditDbPath,
    route_ref: routeRef,
    runtime_slice_ref: runtimeSliceRef,
    event_surface: "promotion_readiness_packet_from_review_memory_runtime",
    event_kind: "route_response",
    event_action: input.action,
    event_status: input.result.status,
    subject_ref: input.result.review_record_ref ?? "promotion-readiness-packet:request",
    related_refs: [
      input.result.readiness_packet_request_id,
      input.result.readiness_packet_ref,
      input.result.review_record_ref,
      ...input.result.candidate_refs,
      ...input.result.source_refs,
    ].filter((ref): ref is string => typeof ref === "string" && ref.length > 0),
    primary_result_status: input.result.status,
    primary_result_ref: "promotion-readiness-packet:result",
    bounded_summary: input.boundedSummary,
    bounded_error_code: input.statusCode >= 400 ? input.result.status : null,
  });
}

function jsonResponse(response: unknown, status = 200) {
  return NextResponse.json(response, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
