import {
  createProviderAssistedExtractionRuntimeAuthorityBoundaryV01,
  PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_ROUTE_VERSION_V01,
} from "../../../../lib/research-extraction/provider-boundary";
import {
  runProviderAssistedExtractionRuntimeV01,
  type ProviderAssistedExtractionRuntimeResultV01,
  type ProviderExtractionAdapterV01,
} from "../../../../lib/research-extraction/provider-extract-candidates";

export const runtime = "nodejs";

const scope = "project:augnes" as const;

export type ProviderAssistedExtractionRouteErrorCodeV01 =
  | "same_origin_required"
  | "invalid_json_body"
  | "invalid_json_object"
  | "invalid_route_request"
  | "blocked_private_or_raw_payload"
  | "blocked_forbidden_authority"
  | "blocked_invalid_input"
  | "provider_unavailable"
  | "provider_missing_key"
  | "provider_refused"
  | "unsupported_extraction";

export interface ProviderAssistedExtractionRouteResponseV01 {
  route_version: typeof PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_ROUTE_VERSION_V01;
  scope: typeof scope;
  status: "ok" | "error";
  error_code: ProviderAssistedExtractionRouteErrorCodeV01 | null;
  result?: ProviderAssistedExtractionRuntimeResultV01;
  raw_source_body_stored: false;
  raw_provider_output_stored: false;
  hidden_reasoning_stored: false;
  retrieval_indexed: false;
  proof_or_evidence_created: false;
  promotion_executed: false;
  product_write_executed: false;
  boundary_notes: string[];
  authority_boundary: ReturnType<typeof createProviderAssistedExtractionRuntimeAuthorityBoundaryV01>;
}

export function createProviderAssistedExtractionRuntimeCompletionPostHandlerV01(options?: {
  providerAdapter?: ProviderExtractionAdapterV01;
}) {
  return async function providerAssistedExtractionPost(request: Request) {
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
      routeBody.route_version !== PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_ROUTE_VERSION_V01 ||
      routeBody.scope !== scope ||
      !routeBody.input ||
      typeof routeBody.input !== "object" ||
      Array.isArray(routeBody.input)
    ) {
      return jsonResponse(errorResponse("invalid_route_request"), 400);
    }

    const result = await runProviderAssistedExtractionRuntimeV01(routeBody.input, {
      providerAdapter: options?.providerAdapter,
    });
    const statusCode = runtimeResultHttpStatus(result);
    return jsonResponse(runtimeResultResponse(result, statusCode), statusCode);
  };
}

export const POST = createProviderAssistedExtractionRuntimeCompletionPostHandlerV01();

function runtimeResultHttpStatus(result: ProviderAssistedExtractionRuntimeResultV01): number {
  if (result.status === "blocked_forbidden_authority") return 403;
  if (
    result.status === "blocked_private_or_raw_payload" ||
    result.status === "blocked_invalid_input" ||
    result.status === "rejected" ||
    result.status === "unsupported_extraction"
  ) {
    return 400;
  }
  return 200;
}

function runtimeResultResponse(
  result: ProviderAssistedExtractionRuntimeResultV01,
  statusCode: number,
): ProviderAssistedExtractionRouteResponseV01 {
  return {
    route_version: PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_ROUTE_VERSION_V01,
    scope,
    status: statusCode >= 400 ? "error" : "ok",
    error_code: statusCode >= 400 ? routeErrorCodeForResult(result) : null,
    result,
    raw_source_body_stored: false,
    raw_provider_output_stored: false,
    hidden_reasoning_stored: false,
    retrieval_indexed: false,
    proof_or_evidence_created: false,
    promotion_executed: false,
    product_write_executed: false,
    boundary_notes: boundaryNotes(),
    authority_boundary: result.authority_boundary,
  };
}

function routeErrorCodeForResult(
  result: ProviderAssistedExtractionRuntimeResultV01,
): ProviderAssistedExtractionRouteErrorCodeV01 {
  if (result.status === "blocked_forbidden_authority") return "blocked_forbidden_authority";
  if (result.status === "blocked_private_or_raw_payload") return "blocked_private_or_raw_payload";
  if (result.status === "blocked_invalid_input" || result.status === "rejected") {
    return "blocked_invalid_input";
  }
  if (result.status === "provider_missing_key") return "provider_missing_key";
  if (result.status === "provider_refused") return "provider_refused";
  if (result.status === "unsupported_extraction") return "unsupported_extraction";
  return "provider_unavailable";
}

function errorResponse(
  errorCode: ProviderAssistedExtractionRouteErrorCodeV01,
): ProviderAssistedExtractionRouteResponseV01 {
  return {
    route_version: PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_ROUTE_VERSION_V01,
    scope,
    status: "error",
    error_code: errorCode,
    raw_source_body_stored: false,
    raw_provider_output_stored: false,
    hidden_reasoning_stored: false,
    retrieval_indexed: false,
    proof_or_evidence_created: false,
    promotion_executed: false,
    product_write_executed: false,
    boundary_notes: boundaryNotes(),
    authority_boundary: createProviderAssistedExtractionRuntimeAuthorityBoundaryV01(),
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
    "Provider-Assisted Extraction Runtime Completion requires explicit same-origin POST operator action.",
    "Provider key/config missing is a graceful bounded refusal.",
    "Normalized provider output is candidate-only.",
    "Provider output is not truth/proof/evidence.",
    "Provider confidence is not promotion readiness.",
    "Product-write remains parked by #686.",
  ];
}

function jsonResponse(response: unknown, status = 200) {
  return Response.json(response, { status });
}
