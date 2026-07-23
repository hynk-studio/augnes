import {
  READONLY_LOCAL_HOSTS,
  validateReadonlyApiLocalAccess,
  type ReadonlyApiAccessErrorCode,
  type ReadonlyApiAccessErrorStatus,
  type ReadonlyApiAccessPolicy,
} from "@/lib/readonly-api/access-guard";
import {
  shouldUseReadonlyApiLocalDevAuthStrictMode,
  validateReadonlyApiLocalDevAuthAdapter,
} from "@/lib/readonly-api/local-dev-auth-adapter";
import {
  GUIDE_BRIEF_REQUEST_SCOPE_V02,
  GUIDE_BRIEF_ROUTE_MARKER_V02,
  GUIDE_BRIEF_VERSION_V02,
} from "@/types/vnext/guide-brief";
import type {
  ReadonlyApiAuthScopeErrorCodeV0,
  ReadonlyApiAuthScopeFailureV0,
} from "@/types/readonly-api-auth-scope";

export const GUIDE_BRIEF_LOCAL_READONLY_HEADER_V02 = "x-augnes-local-readonly" as const;
export const GUIDE_BRIEF_ROUTE_ID_V02 = "augnes.read.guide_brief.v0.2" as const;
export const GUIDE_BRIEF_ROUTE_FAMILY_V02 = "guide_brief" as const;
export const GUIDE_BRIEF_CACHE_CONTROL_V02 = "no-store" as const;

const PROJECT_ID = /^project:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const ALLOWED_QUERY_KEYS = new Set(["scope", "project_id", "strict_local_auth"]);

export const GUIDE_BRIEF_ACCESS_POLICY_V02: ReadonlyApiAccessPolicy = {
  route_id: GUIDE_BRIEF_ROUTE_ID_V02,
  required_scope: GUIDE_BRIEF_REQUEST_SCOPE_V02,
  required_marker_header: GUIDE_BRIEF_LOCAL_READONLY_HEADER_V02,
  required_marker_value: GUIDE_BRIEF_ROUTE_MARKER_V02,
  allowed_hosts: READONLY_LOCAL_HOSTS,
  route_family: GUIDE_BRIEF_ROUTE_FAMILY_V02,
};

export type GuideBriefReadErrorCodeV02 =
  | ReadonlyApiAccessErrorCode
  | ReadonlyApiAuthScopeErrorCodeV0
  | "invalid_scope"
  | "unknown_query_key"
  | "duplicate_query_key"
  | "query_too_large"
  | "project_id_invalid"
  | "project_unavailable"
  | "unavailable";

export type GuideBriefReadErrorStatusV02 =
  | ReadonlyApiAccessErrorStatus
  | ReadonlyApiAuthScopeFailureV0["status"]
  | 404
  | 500;

export type GuideBriefReadValidationResultV02 =
  | {
      ok: true;
      scope: typeof GUIDE_BRIEF_REQUEST_SCOPE_V02;
      project_id: string | null;
      local_authorized: true;
    }
  | {
      ok: false;
      code: GuideBriefReadErrorCodeV02;
      status: GuideBriefReadErrorStatusV02;
      authority_boundary: string[];
    };

const ROUTE_AUTHORITY = [
  "GET-only local read-only current-project GuideBrief route",
  "GuideBrief is a non-authoritative View",
  "no database, proof, Evidence, decision, Transition, provider, GitHub, Codex, approval, or external-side-effect authority",
] as const;

export function validateProjectGuideBriefReadRequestV02(
  request: Request,
): GuideBriefReadValidationResultV02 {
  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return errorV02("malformed_request", 400);
  }
  if (url.search.length > 1_024 || request.url.length > 2_048) return errorV02("query_too_large", 400);
  for (const key of url.searchParams.keys()) {
    if (!ALLOWED_QUERY_KEYS.has(key)) return errorV02("unknown_query_key", 400);
    if (url.searchParams.getAll(key).length !== 1) return errorV02("duplicate_query_key", 400);
  }
  const scope = url.searchParams.get("scope");
  if (!scope) return errorV02("missing_scope", 400);
  if (scope !== GUIDE_BRIEF_REQUEST_SCOPE_V02) return errorV02("invalid_scope", 400);
  const projectId = url.searchParams.get("project_id");
  if (projectId !== null && !PROJECT_ID.test(projectId)) return errorV02("project_id_invalid", 400);

  const local = validateReadonlyApiLocalAccess(request, GUIDE_BRIEF_ACCESS_POLICY_V02);
  if (!local.ok) return local;
  if (shouldUseReadonlyApiLocalDevAuthStrictMode(request)) {
    const auth = validateReadonlyApiLocalDevAuthAdapter({ request, localGuardResult: local });
    if (!auth.ok) {
      return { ok: false, code: auth.code, status: auth.status, authority_boundary: [...auth.authority_boundary.notes] };
    }
  }
  return { ok: true, scope: GUIDE_BRIEF_REQUEST_SCOPE_V02, project_id: projectId, local_authorized: true };
}

export function buildProjectGuideBriefReadErrorV02(input: {
  code: GuideBriefReadErrorCodeV02;
  status: GuideBriefReadErrorStatusV02;
  authority_boundary?: readonly string[];
}) {
  return {
    response_version: "guide_brief_route_response.v0.2",
    runtime: "augnes",
    guide_version: GUIDE_BRIEF_VERSION_V02,
    error: { code: input.code, status: input.status },
    authority_boundary: [...(input.authority_boundary ?? ROUTE_AUTHORITY)],
  } as const;
}

function errorV02(
  code: GuideBriefReadErrorCodeV02,
  status: GuideBriefReadErrorStatusV02,
): GuideBriefReadValidationResultV02 {
  return { ok: false, code, status, authority_boundary: [...ROUTE_AUTHORITY] };
}
