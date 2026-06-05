import type { ReadonlyApiAccessResult } from "@/lib/readonly-api/access-guard";
import type {
  ReadonlyApiAuthScopeAdapterAuthorityBoundaryV0,
  ReadonlyApiAuthScopeDecisionV0,
  ReadonlyApiAuthScopeErrorCodeV0,
  ReadonlyApiAuthScopeForbiddenFieldV0,
  ReadonlyApiAuthScopeRequestV0,
  ReadonlyApiAuthScopeSourceKindV0,
} from "@/types/readonly-api-auth-scope";

export const LOCAL_DEV_AUTH_ADAPTER_SOURCE_KIND =
  "local_development_auth_adapter_candidate" satisfies ReadonlyApiAuthScopeSourceKindV0;
export const LOCAL_DEV_AUTH_OPERATOR_REF_HEADER =
  "x-augnes-local-operator-ref";
export const LOCAL_DEV_AUTH_OPERATOR_REF_VALUE = "operator:local-dev";
export const LOCAL_DEV_AUTH_WORKSPACE_REF_HEADER =
  "x-augnes-local-workspace-ref";
export const LOCAL_DEV_AUTH_WORKSPACE_REF_VALUE = "workspace:local-dev";
export const LOCAL_DEV_AUTH_PROJECT_SCOPE_HEADER =
  "x-augnes-local-project-scope";
export const LOCAL_DEV_AUTH_PROJECT_SCOPE_VALUE = "project:augnes";
export const LOCAL_DEV_AUTH_OPERATOR_LABEL_HEADER =
  "x-augnes-local-operator-label";
export const LOCAL_DEV_AUTH_STRICT_MODE_HEADER =
  "x-augnes-local-auth-strict";
export const LOCAL_DEV_AUTH_STRICT_MODE_QUERY_PARAM = "strict_local_auth";

export type ReadonlyApiLocalDevAuthAdapterResult =
  ReadonlyApiAuthScopeDecisionV0;

const LOCAL_DEV_AUTH_FORBIDDEN_FIELDS_REMOVED = [
  "secrets",
  "credentials/auth/env",
  "raw DB rows",
  "raw private user text",
  "hidden reasoning / chain-of-thought",
  "proof/evidence write handles",
  "mutation URLs",
  "approval/publish/merge controls",
  "Codex SDK execution handles",
  "provider credentials",
  "session secrets",
  "OAuth tokens",
  "workspace private membership graph",
] as const satisfies readonly ReadonlyApiAuthScopeForbiddenFieldV0[];

const LOCAL_DEV_AUTH_AUTHORITY_BOUNDARY = {
  type_only: true,
  runtime_schema: false,
  auth_implementation: false,
  production_auth: false,
  hosted_auth: false,
  oauth: false,
  session_identity_implementation: false,
  workspace_membership_implementation: false,
  route_behavior_change: false,
  consumer_authority: false,
  proof_evidence_write_authority: false,
  db_query_authority: false,
  source_of_truth: false,
  notes: [
    "Candidate D local-only development auth adapter",
    "not production auth",
    "not hosted auth",
    "not OAuth",
    "not session identity",
    "not workspace membership",
    "composes with the existing local read-only access guard",
    "no consumer authority",
    "no proof/evidence/readiness writes",
    "no route-provided text grants authority",
    "local operator labels are display data only",
  ],
} as const satisfies ReadonlyApiAuthScopeAdapterAuthorityBoundaryV0;

export function buildLocalDevAuthScopeRequest({
  request,
  localGuardResult,
}: {
  request: Request;
  localGuardResult: ReadonlyApiAccessResult;
}): ReadonlyApiAuthScopeRequestV0 {
  let requestedScope: string | null = null;

  try {
    requestedScope = new URL(request.url).searchParams.get("scope");
  } catch {
    requestedScope = null;
  }

  return {
    route_id: localGuardResult.ok
      ? localGuardResult.route_id
      : "augnes.read.constellation-preview.v0.1",
    route_family: localGuardResult.ok
      ? localGuardResult.route_family
      : "project_constellation",
    requested_scope: requestedScope,
    requested_project: requestedScope === "project:augnes" ? "augnes" : null,
    requested_workspace: headerValue(
      request,
      LOCAL_DEV_AUTH_WORKSPACE_REF_HEADER,
    ),
    request_method: typeof request.method === "string" ? request.method : "",
    local_guard_result_ref: localGuardResult.ok ? "local_guard:passed" : "local_guard:failed",
    source_kind: LOCAL_DEV_AUTH_ADAPTER_SOURCE_KIND,
  };
}

export function shouldUseReadonlyApiLocalDevAuthStrictMode(
  request: Request,
): boolean {
  if (isTruthyDebugValue(headerValue(request, LOCAL_DEV_AUTH_STRICT_MODE_HEADER))) {
    return true;
  }

  try {
    return isTruthyDebugValue(
      new URL(request.url).searchParams.get(
        LOCAL_DEV_AUTH_STRICT_MODE_QUERY_PARAM,
      ),
    );
  } catch {
    return false;
  }
}

export function validateReadonlyApiLocalDevAuthAdapter({
  request,
  localGuardResult,
}: {
  request: Request;
  localGuardResult: ReadonlyApiAccessResult;
}): ReadonlyApiLocalDevAuthAdapterResult {
  if (!localGuardResult.ok) {
    return fail("local_guard_failed", localGuardResult.status);
  }

  const operatorRef = headerValue(request, LOCAL_DEV_AUTH_OPERATOR_REF_HEADER);
  if (!operatorRef) {
    return fail("missing_identity", 403);
  }
  if (operatorRef !== LOCAL_DEV_AUTH_OPERATOR_REF_VALUE) {
    return fail("invalid_identity", 403);
  }

  const workspaceRef = headerValue(request, LOCAL_DEV_AUTH_WORKSPACE_REF_HEADER);
  if (!workspaceRef) {
    return fail("missing_workspace", 403);
  }
  if (workspaceRef !== LOCAL_DEV_AUTH_WORKSPACE_REF_VALUE) {
    return fail("unauthorized_workspace", 403);
  }

  const projectScope = headerValue(request, LOCAL_DEV_AUTH_PROJECT_SCOPE_HEADER);
  if (!projectScope) {
    return fail("missing_project", 403);
  }
  if (projectScope !== LOCAL_DEV_AUTH_PROJECT_SCOPE_VALUE) {
    return fail("unauthorized_project", 403);
  }

  normalizeLocalOperatorLabel(
    headerValue(request, LOCAL_DEV_AUTH_OPERATOR_LABEL_HEADER),
  );

  return {
    ok: true,
    route_id: localGuardResult.route_id,
    route_family: localGuardResult.route_family,
    identity_ref: {
      identity_ref: LOCAL_DEV_AUTH_OPERATOR_REF_VALUE,
      identity_source_kind: LOCAL_DEV_AUTH_ADAPTER_SOURCE_KIND,
      identity_proof_label: "local_development_declaration_only",
      raw_identity_payload_returned: false,
    },
    workspace_ref: {
      workspace_ref: LOCAL_DEV_AUTH_WORKSPACE_REF_VALUE,
      workspace_source_kind: LOCAL_DEV_AUTH_ADAPTER_SOURCE_KIND,
      membership_proof_label: "local_project_scope_declaration_only",
      raw_membership_graph_returned: false,
    },
    project_ref: {
      project_ref: LOCAL_DEV_AUTH_PROJECT_SCOPE_VALUE,
      project_scope: LOCAL_DEV_AUTH_PROJECT_SCOPE_VALUE,
      project_source_kind: LOCAL_DEV_AUTH_ADAPTER_SOURCE_KIND,
      membership_proof_label: "local_project_scope_declaration_only",
      raw_project_payload_returned: false,
    },
    authorized_scope: LOCAL_DEV_AUTH_PROJECT_SCOPE_VALUE,
    source_kind: LOCAL_DEV_AUTH_ADAPTER_SOURCE_KIND,
    local_guard_composed: true,
    authority_boundary: LOCAL_DEV_AUTH_AUTHORITY_BOUNDARY,
    forbidden_fields_removed: LOCAL_DEV_AUTH_FORBIDDEN_FIELDS_REMOVED,
  };
}

function fail(
  code: ReadonlyApiAuthScopeErrorCodeV0,
  status: 400 | 401 | 403 | 405 | 500 | 503,
): ReadonlyApiLocalDevAuthAdapterResult {
  return {
    ok: false,
    code,
    status,
    safe_error_label: code,
    authority_boundary: LOCAL_DEV_AUTH_AUTHORITY_BOUNDARY,
    forbidden_fields_removed: LOCAL_DEV_AUTH_FORBIDDEN_FIELDS_REMOVED,
  };
}

function headerValue(request: Request, headerName: string): string | null {
  const value = request.headers.get(headerName);
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isTruthyDebugValue(value: string | null): boolean {
  if (!value) {
    return false;
  }

  return ["1", "true", "yes", "strict", "required"].includes(
    value.trim().toLowerCase(),
  );
}

function normalizeLocalOperatorLabel(label: string | null): string | null {
  if (!label) {
    return null;
  }

  return label
    .trim()
    .replace(/[^\w .:@-]/g, "")
    .slice(0, 80);
}
