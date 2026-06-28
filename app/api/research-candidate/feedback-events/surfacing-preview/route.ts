import { existsSync } from "node:fs";

import SqliteDatabase from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  FEEDBACK_INFLUENCED_SURFACING_PREVIEW_RUNTIME_COMPLETION_ROUTE_VERSION,
  createFeedbackInfluencedSurfacingPreviewRuntimeBlockedResultV01,
  createFeedbackInfluencedSurfacingPreviewRuntimeCompletionAuthorityBoundaryV01,
  isSafeFeedbackInfluencedSurfacingPreviewRuntimeDbPathV01,
  runFeedbackInfluencedSurfacingPreviewRuntimeCompletionV01,
  validateFeedbackInfluencedSurfacingPreviewRuntimeCompletionRequestV01,
  type FeedbackInfluencedSurfacingPreviewRuntimeCompletionRequestV01,
  type FeedbackInfluencedSurfacingPreviewRuntimeCompletionResultV01,
} from "@/lib/research-candidate-review/feedback-influenced-surfacing-preview";
import {
  aggregateFeedbackEventsRuntimeCompletionV01,
  feedbackEventAggregationRuntimeCompletionSchemaExistsV01,
  type FeedbackEventAggregationSqliteLikeV01,
} from "@/lib/research-candidate-review/feedback-event-aggregation-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const scope = "project:augnes" as const;

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

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonResponse(errorResponse("invalid_json_object"), 400);
  }

  const routeBody = body as {
    route_version?: unknown;
    request_version?: unknown;
    scope?: unknown;
    db_path?: unknown;
    input?: unknown;
  };
  if (
    routeBody.route_version !==
      FEEDBACK_INFLUENCED_SURFACING_PREVIEW_RUNTIME_COMPLETION_ROUTE_VERSION ||
    routeBody.scope !== scope ||
    !routeBody.input ||
    typeof routeBody.input !== "object" ||
    Array.isArray(routeBody.input)
  ) {
    return jsonResponse(errorResponse("invalid_route_request"), 400);
  }

  const input = {
    ...(routeBody.input as Record<string, unknown>),
    ...(routeBody.db_path !== undefined ? { db_path: routeBody.db_path } : {}),
  } as FeedbackInfluencedSurfacingPreviewRuntimeCompletionRequestV01;

  const validation = validateFeedbackInfluencedSurfacingPreviewRuntimeCompletionRequestV01(input);
  if (!validation.passed) {
    if (
      validation.failure_codes.includes("db_path_invalid") &&
      !validation.failure_codes.some((code) =>
        code.includes("forbidden_authority") ||
        /private|raw|secret|local_path|private_url/.test(code),
      )
    ) {
      return jsonResponse(errorResponse("invalid_db_path"), 400);
    }
    const blockedResult = createFeedbackInfluencedSurfacingPreviewRuntimeBlockedResultV01(
      validation.failure_codes.some((code) => code.includes("forbidden_authority"))
        ? "blocked_forbidden_authority"
        : validation.failure_codes.some((code) =>
              /private|raw|secret|local_path|private_url/.test(code),
            )
          ? "blocked_private_or_raw_payload"
          : "blocked_invalid_input",
      "feedback-surfacing-preview-runtime:blocked",
      validation.failure_codes.some((code) => code.includes("forbidden_authority"))
        ? ["forbidden_authority_blocked"]
        : validation.failure_codes.some((code) =>
              /private|raw|secret|local_path|private_url/.test(code),
            )
          ? ["private_or_raw_payload_blocked"]
          : ["invalid_surfacing_preview_request"],
    );
    return jsonResponse(
      completionResponse(blockedResult),
      completionResultHttpStatus(blockedResult),
    );
  }

  if (!isSafeFeedbackInfluencedSurfacingPreviewRuntimeDbPathV01(input.db_path)) {
    return jsonResponse(errorResponse("invalid_db_path"), 400);
  }

  if (!existsSync(input.db_path)) {
    const result = createFeedbackInfluencedSurfacingPreviewRuntimeBlockedResultV01(
      "db_missing",
      input.surfacing_preview_request_id,
      ["db_missing"],
    );
    return jsonResponse(completionResponse(result), 404);
  }

  let db: SqliteDatabase.Database;
  try {
    db = new SqliteDatabase(input.db_path, { readonly: true, fileMustExist: true });
  } catch {
    const result = createFeedbackInfluencedSurfacingPreviewRuntimeBlockedResultV01(
      "db_missing",
      input.surfacing_preview_request_id,
      ["db_missing"],
    );
    return jsonResponse(completionResponse(result), 404);
  }

  try {
    const sqliteLike = db as unknown as FeedbackEventAggregationSqliteLikeV01;
    if (!feedbackEventAggregationRuntimeCompletionSchemaExistsV01(sqliteLike)) {
      const result = createFeedbackInfluencedSurfacingPreviewRuntimeBlockedResultV01(
        "schema_missing",
        input.surfacing_preview_request_id,
        ["schema_missing"],
      );
      return jsonResponse(completionResponse(result), 400);
    }

    const result = runFeedbackInfluencedSurfacingPreviewRuntimeCompletionV01(input, {
      aggregateFeedbackEvents: (aggregationInput) =>
        aggregateFeedbackEventsRuntimeCompletionV01(aggregationInput, { db: sqliteLike }),
    });
    return jsonResponse(completionResponse(result), completionResultHttpStatus(result));
  } finally {
    db.close();
  }
}

function requestHasSameOriginBoundary(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase() ?? null;
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) return false;

  const origin = request.headers.get("origin");
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    new URL(request.url).host;
  if (!host) return false;
  if (!origin) return fetchSite ? true : isLocalTestHost(host);

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

function completionResultHttpStatus(
  result: FeedbackInfluencedSurfacingPreviewRuntimeCompletionResultV01,
): number {
  if (result.status === "db_missing") return 404;
  if (result.status === "schema_missing") return 400;
  if (result.status === "blocked_forbidden_authority") return 403;
  if (
    result.status === "blocked_private_or_raw_payload" ||
    result.status === "blocked_invalid_input" ||
    result.status === "rejected"
  ) {
    return 400;
  }
  return 200;
}

function completionResponse(
  result: FeedbackInfluencedSurfacingPreviewRuntimeCompletionResultV01,
) {
  const isBlocked =
    result.status.startsWith("blocked") ||
    result.status === "rejected" ||
    result.status === "db_missing" ||
    result.status === "schema_missing";
  return {
    route_version: FEEDBACK_INFLUENCED_SURFACING_PREVIEW_RUNTIME_COMPLETION_ROUTE_VERSION,
    scope,
    status: isBlocked ? "error" : "ok",
    error_code: isBlocked ? result.status : null,
    result,
    aggregation_read_executed: result.aggregation_status === "aggregated",
    advisory_only: true,
    feedback_is_truth: false,
    priority_hint_is_ranking_mutation: false,
    surfacing_preview_is_surfacing_mutation: false,
    rule_mutation_executed: false,
    parser_mutation_executed: false,
    prompt_mutation_executed: false,
    ranking_mutation_executed: false,
    surfacing_mutation_executed: false,
    source_suppression_executed: false,
    candidate_deleted: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    authority_boundary: result.authority_boundary,
  };
}

function errorResponse(errorCode: string) {
  return {
    route_version: FEEDBACK_INFLUENCED_SURFACING_PREVIEW_RUNTIME_COMPLETION_ROUTE_VERSION,
    scope,
    status: "error",
    error_code: errorCode,
    advisory_only: true,
    feedback_is_truth: false,
    priority_hint_is_ranking_mutation: false,
    surfacing_preview_is_surfacing_mutation: false,
    rule_mutation_executed: false,
    parser_mutation_executed: false,
    prompt_mutation_executed: false,
    ranking_mutation_executed: false,
    surfacing_mutation_executed: false,
    source_suppression_executed: false,
    candidate_deleted: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    authority_boundary:
      createFeedbackInfluencedSurfacingPreviewRuntimeCompletionAuthorityBoundaryV01(),
  };
}

function jsonResponse(response: unknown, status = 200) {
  return NextResponse.json(response, { status });
}
