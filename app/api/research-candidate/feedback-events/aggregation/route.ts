import { existsSync } from "node:fs";

import SqliteDatabase from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  FEEDBACK_EVENT_AGGREGATION_RUNTIME_COMPLETION_ROUTE_VERSION,
  aggregateFeedbackEventsV01,
  aggregateFeedbackEventsRuntimeCompletionV01,
  createFeedbackAggregationAuthorityBoundaryV01,
  createFeedbackEventAggregationRuntimeCompletionAuthorityBoundaryV01,
  feedbackEventAggregationRuntimeCompletionSchemaExistsV01,
  isSafeFeedbackEventAggregationRuntimeDbPathV01,
  type FeedbackEventAggregationInput,
  type FeedbackEventAggregationResult,
  type FeedbackEventAggregationRuntimeCompletionInputV01,
  type FeedbackEventAggregationRuntimeCompletionResultV01,
  type FeedbackEventAggregationSqliteLikeV01,
} from "../../../../../lib/research-candidate-review/feedback-event-aggregation-runtime";

export const runtime = "nodejs";

const scope = "project:augnes" as const;
const routeVersion = "feedback_event_aggregation_route.v0.1" as const;

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

  if (isRuntimeCompletionBody(body)) {
    return handleRuntimeCompletionBody(body);
  }

  const result = aggregateFeedbackEventsV01(body as FeedbackEventAggregationInput);
  return jsonResponse(aggregationResponse(result), resultHttpStatus(result));
}

function requestHasSameOriginBoundary(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase() ?? null;
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) return false;

  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? new URL(request.url).host;
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

function resultHttpStatus(result: FeedbackEventAggregationResult): number {
  if (result.status === "blocked_private_or_raw_payload") return 400;
  if (result.status === "blocked_invalid_input") return 400;
  return 200;
}

function completionResultHttpStatus(
  result: FeedbackEventAggregationRuntimeCompletionResultV01,
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

function isRuntimeCompletionBody(
  body: object,
): body is {
  route_version?: unknown;
  scope?: unknown;
  action?: unknown;
  db_path?: unknown;
  input?: unknown;
} {
  const value = body as Record<string, unknown>;
  return (
    value.route_version === FEEDBACK_EVENT_AGGREGATION_RUNTIME_COMPLETION_ROUTE_VERSION ||
    value.action === "aggregate_feedback_events" ||
    (value.input !== undefined &&
      typeof value.input === "object" &&
      value.input !== null &&
      !Array.isArray(value.input) &&
      "aggregation_version" in value.input)
  );
}

function handleRuntimeCompletionBody(body: {
  route_version?: unknown;
  scope?: unknown;
  action?: unknown;
  db_path?: unknown;
  input?: unknown;
}) {
  if (
    body.route_version !== FEEDBACK_EVENT_AGGREGATION_RUNTIME_COMPLETION_ROUTE_VERSION ||
    body.scope !== scope ||
    body.action !== "aggregate_feedback_events" ||
    !body.input ||
    typeof body.input !== "object" ||
    Array.isArray(body.input)
  ) {
    return jsonResponse(completionErrorResponse("invalid_route_request"), 400);
  }

  const input = {
    ...(body.input as Record<string, unknown>),
    ...(body.db_path !== undefined ? { db_path: body.db_path } : {}),
  } as FeedbackEventAggregationRuntimeCompletionInputV01;

  if (input.db_path !== undefined && !isSafeFeedbackEventAggregationRuntimeDbPathV01(input.db_path)) {
    return jsonResponse(completionErrorResponse("invalid_db_path"), 400);
  }

  const preflightResult = aggregateFeedbackEventsRuntimeCompletionV01(input);
  if (isCompletionBlockingInputResult(preflightResult)) {
    return jsonResponse(
      completionAggregationResponse(preflightResult),
      completionResultHttpStatus(preflightResult),
    );
  }

  if (!input.db_path) {
    return jsonResponse(
      completionAggregationResponse(preflightResult),
      completionResultHttpStatus(preflightResult),
    );
  }

  if (!existsSync(input.db_path)) {
    const result = preflightResult;
    result.status = "db_missing";
    result.reason_codes = ["db_missing", ...result.reason_codes];
    return jsonResponse(completionAggregationResponse(result), 404);
  }

  let db: SqliteDatabase.Database;
  try {
    db = new SqliteDatabase(input.db_path, { readonly: true, fileMustExist: true });
  } catch {
    const result = preflightResult;
    result.status = "db_missing";
    result.reason_codes = ["db_missing", ...result.reason_codes];
    return jsonResponse(completionAggregationResponse(result), 404);
  }

  try {
    const sqliteLike = db as unknown as FeedbackEventAggregationSqliteLikeV01;
    if (!feedbackEventAggregationRuntimeCompletionSchemaExistsV01(sqliteLike)) {
      const result = aggregateFeedbackEventsRuntimeCompletionV01(input);
      result.status = "schema_missing";
      result.reason_codes = ["schema_missing", ...result.reason_codes];
      result.authority_boundary =
        createFeedbackEventAggregationRuntimeCompletionAuthorityBoundaryV01({
          dbQueryNow: true,
        });
      return jsonResponse(completionAggregationResponse(result), 400);
    }
    const result = aggregateFeedbackEventsRuntimeCompletionV01(input, { db: sqliteLike });
    return jsonResponse(completionAggregationResponse(result), completionResultHttpStatus(result));
  } finally {
    db.close();
  }
}

function isCompletionBlockingInputResult(
  result: FeedbackEventAggregationRuntimeCompletionResultV01,
): boolean {
  return (
    result.status === "blocked_private_or_raw_payload" ||
    result.status === "blocked_forbidden_authority" ||
    result.status === "blocked_invalid_input" ||
    result.status === "rejected"
  );
}

function aggregationResponse(result: FeedbackEventAggregationResult) {
  const isBlocked = result.status.startsWith("blocked");
  return {
    route_version: routeVersion,
    scope,
    status: isBlocked ? "error" : "ok",
    error_code: isBlocked ? result.status : null,
    result,
    feedback_write_executed: false,
    candidate_mutated: false,
    rule_mutated: false,
    parser_mutated: false,
    durable_state_mutated: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    authority_boundary: createFeedbackAggregationAuthorityBoundaryV01(),
  };
}

function completionAggregationResponse(
  result: FeedbackEventAggregationRuntimeCompletionResultV01,
) {
  const isBlocked =
    result.status.startsWith("blocked") ||
    result.status === "rejected" ||
    result.status === "db_missing" ||
    result.status === "schema_missing";
  return {
    route_version: FEEDBACK_EVENT_AGGREGATION_RUNTIME_COMPLETION_ROUTE_VERSION,
    scope,
    status: isBlocked ? "error" : "ok",
    error_code: isBlocked ? result.status : null,
    result,
    feedback_write_executed: false,
    rule_mutation_executed: false,
    parser_mutation_executed: false,
    prompt_mutation_executed: false,
    ranking_mutation_executed: false,
    surfacing_mutation_executed: false,
    source_suppression_executed: false,
    candidate_deleted: false,
    durable_state_mutated: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    authority_boundary: result.authority_boundary,
  };
}

function completionErrorResponse(errorCode: string) {
  return {
    route_version: FEEDBACK_EVENT_AGGREGATION_RUNTIME_COMPLETION_ROUTE_VERSION,
    scope,
    status: "error",
    error_code: errorCode,
    feedback_write_executed: false,
    rule_mutation_executed: false,
    parser_mutation_executed: false,
    prompt_mutation_executed: false,
    ranking_mutation_executed: false,
    surfacing_mutation_executed: false,
    source_suppression_executed: false,
    candidate_deleted: false,
    durable_state_mutated: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    authority_boundary: createFeedbackEventAggregationRuntimeCompletionAuthorityBoundaryV01(),
  };
}

function errorResponse(errorCode: string) {
  return {
    route_version: routeVersion,
    scope,
    status: "error",
    error_code: errorCode,
    feedback_write_executed: false,
    candidate_mutated: false,
    rule_mutated: false,
    parser_mutated: false,
    durable_state_mutated: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    authority_boundary: createFeedbackAggregationAuthorityBoundaryV01(),
  };
}

function jsonResponse(response: unknown, status = 200) {
  return NextResponse.json(response, { status });
}
