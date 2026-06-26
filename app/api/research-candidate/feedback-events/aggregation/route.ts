import { NextResponse } from "next/server";

import {
  aggregateFeedbackEventsV01,
  createFeedbackAggregationAuthorityBoundaryV01,
  type FeedbackEventAggregationInput,
  type FeedbackEventAggregationResult,
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

  const result = aggregateFeedbackEventsV01(body as FeedbackEventAggregationInput);
  return jsonResponse(aggregationResponse(result), resultHttpStatus(result));
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

function resultHttpStatus(result: FeedbackEventAggregationResult): number {
  if (result.status === "blocked_private_or_raw_payload") return 400;
  if (result.status === "blocked_invalid_input") return 400;
  return 200;
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
