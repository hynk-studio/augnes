import type { BoundedSourceFetcherV01 } from "../../../../lib/research-source/fetch-bounded-source";
import {
  createBoundedSourceIntakeRuntimeAuthorityBoundaryV01,
  runBoundedSourceIntakeRuntimeV01,
  type BoundedSourceIntakeRuntimeResultV01,
} from "../../../../lib/research-source/intake-runtime";

export const runtime = "nodejs";

export const BOUNDED_SOURCE_INTAKE_RUNTIME_COMPLETION_ROUTE_VERSION_V01 =
  "bounded_source_intake_runtime_completion_route.v0.1" as const;

const scope = "project:augnes" as const;

export type BoundedSourceIntakeRouteErrorCodeV01 =
  | "same_origin_required"
  | "invalid_json_body"
  | "invalid_json_object"
  | "invalid_route_request"
  | "blocked_private_or_raw_payload"
  | "blocked_forbidden_authority"
  | "blocked_invalid_input"
  | "unsupported_content_type"
  | "content_too_large"
  | "fetch_failed"
  | "source_unavailable"
  | "timeout";

export interface BoundedSourceIntakeRouteResponseV01 {
  route_version: typeof BOUNDED_SOURCE_INTAKE_RUNTIME_COMPLETION_ROUTE_VERSION_V01;
  scope: typeof scope;
  status: "ok" | "error";
  error_code: BoundedSourceIntakeRouteErrorCodeV01 | null;
  result?: BoundedSourceIntakeRuntimeResultV01;
  raw_body_stored: false;
  provider_extraction_started: false;
  retrieval_indexed: false;
  proof_or_evidence_created: false;
  product_write_executed: false;
  boundary_notes: string[];
  authority_boundary: ReturnType<typeof createBoundedSourceIntakeRuntimeAuthorityBoundaryV01>;
}

export function createBoundedSourceIntakeRuntimeCompletionPostHandlerV01(options?: {
  fetcher?: BoundedSourceFetcherV01;
  allow_live_fetch?: boolean;
}) {
  return async function boundedSourceIntakePost(request: Request) {
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

    const routeBody = body as { route_version?: unknown; scope?: unknown; input?: unknown };
    if (
      routeBody.route_version !== BOUNDED_SOURCE_INTAKE_RUNTIME_COMPLETION_ROUTE_VERSION_V01 ||
      routeBody.scope !== scope ||
      !routeBody.input ||
      typeof routeBody.input !== "object" ||
      Array.isArray(routeBody.input)
    ) {
      return jsonResponse(errorResponse("invalid_route_request"), 400);
    }

    const result = await runBoundedSourceIntakeRuntimeV01(routeBody.input, {
      fetcher: options?.fetcher,
      allow_live_fetch: options?.allow_live_fetch,
    });
    const statusCode = runtimeResultHttpStatus(result);
    return jsonResponse(runtimeResultResponse(result, statusCode), statusCode);
  };
}

export const POST = createBoundedSourceIntakeRuntimeCompletionPostHandlerV01();

function runtimeResultHttpStatus(result: BoundedSourceIntakeRuntimeResultV01): number {
  if (result.status === "blocked_forbidden_authority") return 403;
  if (result.status === "blocked_private_or_raw_payload") return 400;
  if (result.status === "blocked_invalid_input" || result.status === "rejected") return 400;
  if (result.failure_kind === "unsupported_content_type") return 415;
  if (result.failure_kind === "content_too_large") return 413;
  if (result.failure_kind === "timeout") return 504;
  return 200;
}

function runtimeResultResponse(
  result: BoundedSourceIntakeRuntimeResultV01,
  statusCode: number,
): BoundedSourceIntakeRouteResponseV01 {
  return {
    route_version: BOUNDED_SOURCE_INTAKE_RUNTIME_COMPLETION_ROUTE_VERSION_V01,
    scope,
    status: statusCode >= 400 ? "error" : "ok",
    error_code: statusCode >= 400 ? routeErrorCodeForResult(result) : null,
    result,
    raw_body_stored: false,
    provider_extraction_started: false,
    retrieval_indexed: false,
    proof_or_evidence_created: false,
    product_write_executed: false,
    boundary_notes: boundaryNotes(),
    authority_boundary: createBoundedSourceIntakeRuntimeAuthorityBoundaryV01(),
  };
}

function routeErrorCodeForResult(
  result: BoundedSourceIntakeRuntimeResultV01,
): BoundedSourceIntakeRouteErrorCodeV01 {
  if (result.status === "blocked_forbidden_authority") return "blocked_forbidden_authority";
  if (result.status === "blocked_private_or_raw_payload") return "blocked_private_or_raw_payload";
  if (result.status === "blocked_invalid_input" || result.status === "rejected") {
    return "blocked_invalid_input";
  }
  if (result.failure_kind === "unsupported_content_type") return "unsupported_content_type";
  if (result.failure_kind === "content_too_large") return "content_too_large";
  if (result.failure_kind === "timeout") return "timeout";
  if (result.failure_kind === "source_unavailable") return "source_unavailable";
  return "fetch_failed";
}

function errorResponse(errorCode: BoundedSourceIntakeRouteErrorCodeV01):
  BoundedSourceIntakeRouteResponseV01 {
  return {
    route_version: BOUNDED_SOURCE_INTAKE_RUNTIME_COMPLETION_ROUTE_VERSION_V01,
    scope,
    status: "error",
    error_code: errorCode,
    raw_body_stored: false,
    provider_extraction_started: false,
    retrieval_indexed: false,
    proof_or_evidence_created: false,
    product_write_executed: false,
    boundary_notes: boundaryNotes(),
    authority_boundary: createBoundedSourceIntakeRuntimeAuthorityBoundaryV01(),
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

function boundaryNotes(): string[] {
  return [
    "Bounded Source Intake Runtime Completion accepts explicit user-provided source inputs only.",
    "Raw source body is non-persistent by default.",
    "Source refs are lineage pointers, not proof.",
    "Bounded source summary is not truth.",
    "Failed fetch creates gap metadata, not hallucinated summary.",
    "Product-write remains parked by #686.",
  ];
}

function jsonResponse(response: unknown, status = 200) {
  return Response.json(response, { status });
}
