import {
  AUTONOMY_CONTRACT_ROUTE_SCOPE,
  readAutonomyContractForRoute,
  type AutonomyContractRouteResponse,
} from "@/lib/autonomy/autonomy-contract-source";
import {
  buildAutonomyPreflightAuthorityBoundary,
  buildAutonomyRunnerPreflight,
} from "@/lib/autonomy/autonomy-runner-preflight";
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
import type {
  AutonomyDryRunPlan,
  AutonomyRunnerAuthorityBoundary,
  AutonomyRunnerPreflight,
} from "@/types/autonomy-runner";
import type {
  ReadonlyApiAuthScopeErrorCodeV0,
  ReadonlyApiAuthScopeFailureV0,
} from "@/types/readonly-api-auth-scope";

export const AUTONOMY_RUNNER_PREFLIGHT_ROUTE_SCOPE =
  AUTONOMY_CONTRACT_ROUTE_SCOPE;
export const AUTONOMY_RUNNER_PREFLIGHT_READONLY_HEADER =
  "x-augnes-local-readonly" as const;
export const AUTONOMY_RUNNER_PREFLIGHT_READONLY_HEADER_VALUE =
  "autonomy-runner-preflight-v0.1" as const;
export const AUTONOMY_RUNNER_PREFLIGHT_ROUTE_FAMILY =
  "autonomy_runner_preflight" as const;
export const AUTONOMY_RUNNER_PREFLIGHT_ROUTE_ID =
  "augnes.read.autonomy_runner_preflight.v0.1" as const;
export const AUTONOMY_RUNNER_PREFLIGHT_CACHE_CONTROL = "no-store" as const;

const AUTONOMY_RUNNER_PREFLIGHT_RESPONSE_VERSION =
  "autonomy_runner_preflight_route_response.v0.1" as const;
const ROUTE_PREFLIGHT_CREATED_AT_FALLBACK =
  "1970-01-01T00:00:00.000Z" as const;

export const AUTONOMY_RUNNER_PREFLIGHT_ROUTE_AUTHORITY_BOUNDARY = [
  "GET-only local read-only Autonomy Runner Preflight route",
  "fail-closed scope and local marker validation",
  "preview JSON only",
  "uses Phase 9A Autonomy Runner Preflight helper",
  "does not invent readiness or blocker policy",
  "no actual runner authority",
  "no scheduler authority",
  "no daemon authority",
  "no background work authority",
  "no DB schema or migration authority",
  "no DB write authority",
  "no proof/evidence write authority",
  "no memory mutation authority",
  "no durable Perspective apply authority",
  "no provider/OpenAI authority",
  "no GitHub actuation authority",
  "no Codex execution authority",
  "no branch/PR creation authority from Augnes product code",
  "no MCP/App write tool authority",
  "no UI action authority",
  "no handoff send authority",
  "no budget spend authority",
  "no auto-apply authority",
  "no external side effect authority",
] as const;

export const AUTONOMY_RUNNER_PREFLIGHT_ACCESS_POLICY: ReadonlyApiAccessPolicy =
  {
    route_id: AUTONOMY_RUNNER_PREFLIGHT_ROUTE_ID,
    required_scope: AUTONOMY_RUNNER_PREFLIGHT_ROUTE_SCOPE,
    required_marker_header: AUTONOMY_RUNNER_PREFLIGHT_READONLY_HEADER,
    required_marker_value: AUTONOMY_RUNNER_PREFLIGHT_READONLY_HEADER_VALUE,
    allowed_hosts: READONLY_LOCAL_HOSTS,
    route_family: AUTONOMY_RUNNER_PREFLIGHT_ROUTE_FAMILY,
  };

export type AutonomyRunnerPreflightRouteErrorCode =
  | ReadonlyApiAccessErrorCode
  | ReadonlyApiAuthScopeErrorCodeV0
  | "invalid_scope"
  | "missing_marker"
  | "invalid_marker"
  | "unavailable";

export type AutonomyRunnerPreflightRouteErrorStatus =
  | ReadonlyApiAccessErrorStatus
  | ReadonlyApiAuthScopeFailureV0["status"]
  | 500;

export type AutonomyRunnerPreflightRouteValidationResult =
  | {
      ok: true;
      scope: typeof AUTONOMY_RUNNER_PREFLIGHT_ROUTE_SCOPE;
      route_id: typeof AUTONOMY_RUNNER_PREFLIGHT_ROUTE_ID;
      route_family: typeof AUTONOMY_RUNNER_PREFLIGHT_ROUTE_FAMILY;
      local_authorized: true;
    }
  | {
      ok: false;
      code: AutonomyRunnerPreflightRouteErrorCode;
      status: AutonomyRunnerPreflightRouteErrorStatus;
      authority_boundary: string[];
    };

export type AutonomyRunnerPreflightRouteErrorBody = {
  response_version: typeof AUTONOMY_RUNNER_PREFLIGHT_RESPONSE_VERSION;
  runtime: "augnes";
  error: {
    code: AutonomyRunnerPreflightRouteErrorCode;
    status: AutonomyRunnerPreflightRouteErrorStatus;
  };
  authority_boundary: AutonomyRunnerAuthorityBoundary;
  route_authority_boundary: string[];
};

export type AutonomyRunnerPreflightRouteResponse = {
  response_version: typeof AUTONOMY_RUNNER_PREFLIGHT_RESPONSE_VERSION;
  runtime: "augnes";
  scope: typeof AUTONOMY_RUNNER_PREFLIGHT_ROUTE_SCOPE;
  route_id: typeof AUTONOMY_RUNNER_PREFLIGHT_ROUTE_ID;
  route_family: typeof AUTONOMY_RUNNER_PREFLIGHT_ROUTE_FAMILY;
  preflight: AutonomyRunnerPreflight;
  dry_run_plan: AutonomyDryRunPlan;
  readiness: AutonomyRunnerPreflight["readiness"];
  blockers: AutonomyRunnerPreflight["blockers"];
  warnings: AutonomyRunnerPreflight["warnings"];
  source_refs: AutonomyRunnerPreflight["source_refs"];
  authority_boundary: AutonomyRunnerAuthorityBoundary;
  public_safety: AutonomyRunnerPreflight["public_safety"];
  route_authority_boundary: string[];
  source_status: AutonomyRunnerPreflightRouteSourceStatus;
  route_notes: string[];
};

export type AutonomyRunnerPreflightRouteSourceStatus = {
  autonomy_contract: string;
  autonomy_runner_preflight: string;
  dry_run_plan: string;
  source_disclosure: string;
  synthetic_operator_supplied_fields: string[];
};

type ScopeValidationResult =
  | { ok: true }
  | {
      ok: false;
      code: "missing_scope" | "invalid_scope";
      status: 400;
      authority_boundary: string[];
    };

type LocalMarkerValidationResult =
  | { ok: true }
  | {
      ok: false;
      code: "missing_marker" | "invalid_marker";
      status: 403;
      authority_boundary: string[];
    };

export function validateAutonomyRunnerPreflightRouteRequest(
  request: Request,
): AutonomyRunnerPreflightRouteValidationResult {
  let url: URL;

  try {
    url = new URL(request.url);
  } catch {
    return autonomyRunnerPreflightRouteError("malformed_request", 400);
  }

  const scopeResult = validateScope(url);
  if (!scopeResult.ok) return scopeResult;

  const markerResult = validateLocalMarker(request);
  if (!markerResult.ok) return markerResult;

  const localGuardResult = validateReadonlyApiLocalAccess(
    request,
    AUTONOMY_RUNNER_PREFLIGHT_ACCESS_POLICY,
  );

  if (!localGuardResult.ok) {
    return {
      ok: false,
      code: localGuardResult.code,
      status: localGuardResult.status,
      authority_boundary: [...localGuardResult.authority_boundary],
    };
  }

  if (shouldUseReadonlyApiLocalDevAuthStrictMode(request)) {
    const localDevAuthResult = validateReadonlyApiLocalDevAuthAdapter({
      request,
      localGuardResult,
    });

    if (!localDevAuthResult.ok) {
      return {
        ok: false,
        code: localDevAuthResult.code,
        status: localDevAuthResult.status,
        authority_boundary: [...localDevAuthResult.authority_boundary.notes],
      };
    }
  }

  return {
    ok: true,
    scope: AUTONOMY_RUNNER_PREFLIGHT_ROUTE_SCOPE,
    route_id: AUTONOMY_RUNNER_PREFLIGHT_ROUTE_ID,
    route_family: AUTONOMY_RUNNER_PREFLIGHT_ROUTE_FAMILY,
    local_authorized: true,
  };
}

export function buildAutonomyRunnerPreflightRouteError({
  code,
  status,
  authorityBoundary = [
    ...AUTONOMY_RUNNER_PREFLIGHT_ROUTE_AUTHORITY_BOUNDARY,
  ],
}: {
  code: AutonomyRunnerPreflightRouteErrorCode;
  status: AutonomyRunnerPreflightRouteErrorStatus;
  authorityBoundary?: string[];
}): AutonomyRunnerPreflightRouteErrorBody {
  return {
    response_version: AUTONOMY_RUNNER_PREFLIGHT_RESPONSE_VERSION,
    runtime: "augnes",
    error: { code, status },
    authority_boundary: buildAutonomyPreflightAuthorityBoundary(),
    route_authority_boundary: authorityBoundary,
  };
}

export function readAutonomyRunnerPreflightForRoute({
  scope,
}: {
  scope: typeof AUTONOMY_RUNNER_PREFLIGHT_ROUTE_SCOPE;
}): AutonomyRunnerPreflightRouteResponse {
  const contractResponse = readAutonomyContractForRoute({ scope });
  const preflight = buildAutonomyRunnerPreflight({
    scope,
    contract: contractResponse.contract,
    preflight_id: `autonomy_runner_preflight.${scopeKey(scope)}.route_preview.v0.1`,
    dry_run_id: `autonomy_dry_run_plan.${scopeKey(scope)}.route_preview.v0.1`,
    created_at:
      contractResponse.contract.created_at ?? ROUTE_PREFLIGHT_CREATED_AT_FALLBACK,
    source_refs: {
      route_refs: [
        "GET /api/augnes/read/autonomy-runner-preflight?scope=project:augnes",
        "GET /api/augnes/read/autonomy-contract?scope=project:augnes",
      ],
      docs_refs: [
        "docs/AUTONOMY_RUNNER_PREFLIGHT_V0_1.md",
        "docs/AUTONOMY_CONTRACT_V0_1.md",
        "docs/AUTHORITY_MATRIX.md",
      ],
    },
    required_operator_review: [
      "phase_9b_route_preview_review",
      ...contractResponse.warnings.map((_, index) =>
        `autonomy_contract_route_warning.${index + 1}`,
      ),
    ],
    next_phase_notes: [
      "Phase 9B adds a GET-only local read-only Autonomy Runner Preflight route.",
      "The route returns preflight/dry-run preview data only.",
      "The route does not start, schedule, or execute any runner.",
      "Recommended next phase: Phase 9C - Agent Workplane Autonomy Runner Preflight read-only preview panel v0.1.",
    ],
  });

  return {
    response_version: AUTONOMY_RUNNER_PREFLIGHT_RESPONSE_VERSION,
    runtime: "augnes",
    scope,
    route_id: AUTONOMY_RUNNER_PREFLIGHT_ROUTE_ID,
    route_family: AUTONOMY_RUNNER_PREFLIGHT_ROUTE_FAMILY,
    preflight,
    dry_run_plan: preflight.dry_run_plan,
    readiness: preflight.readiness,
    blockers: preflight.blockers,
    warnings: preflight.warnings,
    source_refs: preflight.source_refs,
    authority_boundary: preflight.authority_boundary,
    public_safety: preflight.public_safety,
    route_authority_boundary: [
      ...AUTONOMY_RUNNER_PREFLIGHT_ROUTE_AUTHORITY_BOUNDARY,
    ],
    source_status: buildAutonomyRunnerPreflightRouteSourceStatus({
      contractResponse,
    }),
    route_notes: [
      "Route output is local/read-only preview data.",
      "Dry-run plan status remains dry_run_only.",
      "Every planned step has would_execute false.",
      "Authority boundary denies execution/write/schedule/external behavior.",
    ],
  };
}

export function buildAutonomyRunnerPreflightRouteSourceStatus({
  contractResponse,
}: {
  contractResponse: AutonomyContractRouteResponse;
}): AutonomyRunnerPreflightRouteSourceStatus {
  return {
    autonomy_contract: contractResponse.source_status.autonomy_contract,
    autonomy_runner_preflight: "route_composed_from_phase_9a_helper",
    dry_run_plan: "dry_run_only_no_runner",
    source_disclosure:
      "This is preflight/dry-run preview data, not active autonomy state.",
    synthetic_operator_supplied_fields: [
      ...contractResponse.source_status.synthetic_operator_supplied_fields,
      "preflight_id",
      "dry_run_id",
      "route_review_notes",
    ],
  };
}

function validateScope(url: URL): ScopeValidationResult {
  const requestedScope = url.searchParams.get("scope");
  if (!requestedScope) {
    return scopeOrMarkerRouteError("missing_scope", 400);
  }

  if (requestedScope !== AUTONOMY_RUNNER_PREFLIGHT_ROUTE_SCOPE) {
    return scopeOrMarkerRouteError("invalid_scope", 400);
  }

  return { ok: true };
}

function validateLocalMarker(request: Request): LocalMarkerValidationResult {
  const marker = request.headers.get(
    AUTONOMY_RUNNER_PREFLIGHT_READONLY_HEADER,
  );
  if (!marker) {
    return scopeOrMarkerRouteError("missing_marker", 403);
  }

  if (marker !== AUTONOMY_RUNNER_PREFLIGHT_READONLY_HEADER_VALUE) {
    return scopeOrMarkerRouteError("invalid_marker", 403);
  }

  return { ok: true };
}

function autonomyRunnerPreflightRouteError(
  code: AutonomyRunnerPreflightRouteErrorCode,
  status: AutonomyRunnerPreflightRouteErrorStatus,
): Extract<AutonomyRunnerPreflightRouteValidationResult, { ok: false }> {
  return {
    ok: false,
    code,
    status,
    authority_boundary: [
      ...AUTONOMY_RUNNER_PREFLIGHT_ROUTE_AUTHORITY_BOUNDARY,
    ],
  };
}

function scopeOrMarkerRouteError<
  TCode extends
    | "missing_scope"
    | "invalid_scope"
    | "missing_marker"
    | "invalid_marker",
  TStatus extends 400 | 403,
>(code: TCode, status: TStatus) {
  return {
    ok: false as const,
    code,
    status,
    authority_boundary: [
      ...AUTONOMY_RUNNER_PREFLIGHT_ROUTE_AUTHORITY_BOUNDARY,
    ],
  };
}

function scopeKey(scope: string): string {
  return scope.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
}
