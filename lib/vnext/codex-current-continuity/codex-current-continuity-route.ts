import {
  READONLY_LOCAL_HOSTS,
  validateReadonlyApiLocalAccess,
  type ReadonlyApiAccessErrorCode,
  type ReadonlyApiAccessErrorStatus,
  type ReadonlyApiAccessPolicy,
} from "@/lib/readonly-api/access-guard";
import {
  CODEX_CURRENT_CONTINUITY_REQUEST_SCOPE_V01,
  CODEX_CURRENT_CONTINUITY_ROUTE_MARKER_V01,
  CODEX_CURRENT_CONTINUITY_VERSION_V01,
} from "@/types/vnext/codex-current-continuity";

export const CODEX_CURRENT_CONTINUITY_LOCAL_READONLY_HEADER_V01 =
  "x-augnes-local-readonly" as const;
export const CODEX_CURRENT_CONTINUITY_ROUTE_ID_V01 =
  "augnes.read.codex_current_continuity.v0.1" as const;
export const CODEX_CURRENT_CONTINUITY_ROUTE_FAMILY_V01 =
  "codex_current_continuity" as const;
export const CODEX_CURRENT_CONTINUITY_CACHE_CONTROL_V01 = "no-store" as const;

const ALLOWED_QUERY_KEYS = new Set(["scope"]);

export const CODEX_CURRENT_CONTINUITY_ACCESS_POLICY_V01: ReadonlyApiAccessPolicy = {
  route_id: CODEX_CURRENT_CONTINUITY_ROUTE_ID_V01,
  required_scope: CODEX_CURRENT_CONTINUITY_REQUEST_SCOPE_V01,
  required_marker_header: CODEX_CURRENT_CONTINUITY_LOCAL_READONLY_HEADER_V01,
  required_marker_value: CODEX_CURRENT_CONTINUITY_ROUTE_MARKER_V01,
  allowed_hosts: READONLY_LOCAL_HOSTS,
  route_family: CODEX_CURRENT_CONTINUITY_ROUTE_FAMILY_V01,
};

export type CodexCurrentContinuityReadErrorCodeV01 =
  | ReadonlyApiAccessErrorCode
  | "invalid_scope"
  | "unknown_query_key"
  | "duplicate_query_key"
  | "query_too_large"
  | "continuity_unavailable";

export type CodexCurrentContinuityReadErrorStatusV01 =
  | ReadonlyApiAccessErrorStatus
  | 503;

export type CodexCurrentContinuityReadValidationV01 =
  | {
      ok: true;
      scope: typeof CODEX_CURRENT_CONTINUITY_REQUEST_SCOPE_V01;
      local_authorized: true;
    }
  | {
      ok: false;
      code: CodexCurrentContinuityReadErrorCodeV01;
      status: CodexCurrentContinuityReadErrorStatusV01;
      authority_boundary: string[];
    };

const ROUTE_AUTHORITY = [
  "GET-only local exact-current-continuity read",
  "no database or project-file write",
  "no selection, session, run, Codex, NativeHost, result, proof, Evidence, proposal, Decision, Transition, provider, GitHub, retry, polling, or background authority",
] as const;

export function validateCodexCurrentContinuityReadRequestV01(
  request: Request,
): CodexCurrentContinuityReadValidationV01 {
  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return errorV01("malformed_request", 400);
  }
  if (request.method !== "GET") return errorV01("method_not_allowed", 405);
  if (url.search.length > 256 || request.url.length > 2_048) {
    return errorV01("query_too_large", 400);
  }
  for (const key of url.searchParams.keys()) {
    if (!ALLOWED_QUERY_KEYS.has(key)) return errorV01("unknown_query_key", 400);
    if (url.searchParams.getAll(key).length !== 1) {
      return errorV01("duplicate_query_key", 400);
    }
  }
  const scope = url.searchParams.get("scope");
  if (!scope) return errorV01("missing_scope", 400);
  if (scope !== CODEX_CURRENT_CONTINUITY_REQUEST_SCOPE_V01) {
    return errorV01("invalid_scope", 400);
  }
  const local = validateReadonlyApiLocalAccess(
    request,
    CODEX_CURRENT_CONTINUITY_ACCESS_POLICY_V01,
  );
  if (!local.ok) return local;
  return {
    ok: true,
    scope: CODEX_CURRENT_CONTINUITY_REQUEST_SCOPE_V01,
    local_authorized: true,
  };
}

export function buildCodexCurrentContinuityReadErrorV01(input: {
  code: CodexCurrentContinuityReadErrorCodeV01;
  status: CodexCurrentContinuityReadErrorStatusV01;
  authority_boundary?: readonly string[];
}) {
  return {
    response_version: "codex_current_continuity_route_response.v0.1",
    runtime: "augnes",
    projection_version: CODEX_CURRENT_CONTINUITY_VERSION_V01,
    error: { code: input.code, status: input.status },
    authority_boundary: [
      ...(input.authority_boundary ?? ROUTE_AUTHORITY),
    ],
  } as const;
}

function errorV01(
  code: CodexCurrentContinuityReadErrorCodeV01,
  status: CodexCurrentContinuityReadErrorStatusV01,
): CodexCurrentContinuityReadValidationV01 {
  return {
    ok: false,
    code,
    status,
    authority_boundary: [...ROUTE_AUTHORITY],
  };
}
