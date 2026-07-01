import { buildAugnesDeltaProjectionRuntimeReadModel } from "@/lib/augnes-delta/source-collector";
import { buildGuideBrief, buildGuideBriefAuthorityBoundary } from "@/lib/guide/guide-brief";
import { buildCurrentWorkingPerspectiveRuntimeReadModel } from "@/lib/perspective/current-working-perspective-source";
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
import type { GuideBrief, GuideBriefInput } from "@/types/guide-brief";
import type {
  ReadonlyApiAuthScopeErrorCodeV0,
  ReadonlyApiAuthScopeFailureV0,
} from "@/types/readonly-api-auth-scope";

export const GUIDE_BRIEF_ROUTE_SCOPE = "project:augnes" as const;
export const GUIDE_BRIEF_LOCAL_READONLY_HEADER =
  "x-augnes-local-readonly" as const;
export const GUIDE_BRIEF_LOCAL_READONLY_VALUE = "guide-brief-v0.1" as const;
export const GUIDE_BRIEF_ROUTE_FAMILY = "guide_brief" as const;
export const GUIDE_BRIEF_ROUTE_ID = "augnes.read.guide_brief.v0.1" as const;
export const GUIDE_BRIEF_CACHE_CONTROL = "no-store" as const;

export const GUIDE_BRIEF_ACCESS_POLICY: ReadonlyApiAccessPolicy = {
  route_id: GUIDE_BRIEF_ROUTE_ID,
  required_scope: GUIDE_BRIEF_ROUTE_SCOPE,
  required_marker_header: GUIDE_BRIEF_LOCAL_READONLY_HEADER,
  required_marker_value: GUIDE_BRIEF_LOCAL_READONLY_VALUE,
  allowed_hosts: READONLY_LOCAL_HOSTS,
  route_family: GUIDE_BRIEF_ROUTE_FAMILY,
};

const GUIDE_BRIEF_VERSION = "guide_brief.v0.1" as const;

const GUIDE_BRIEF_READ_ERROR_AUTHORITY_BOUNDARY = [
  "GET-only local read-only GuideBrief route",
  "fail-closed scope and local marker validation",
  "read-only existing Current Working Perspective and Delta Projection source helpers only",
  "GuideBrief route composes the Phase 6A guide packet and preserves its authority boundary",
  "no DB schema or migration authority",
  "no DB write authority",
  "no proof/evidence write authority",
  "no memory mutation authority",
  "no durable Perspective apply authority",
  "no provider, OpenAI, GitHub, or Codex execution authority",
  "no MCP/App tool, UI action, handoff send, scheduler, or autonomy authority",
  "no external side effect authority",
];

const GUIDE_BRIEF_DOC_REFS = [
  "docs/GUIDEBRIEF_CONTRACT_V0_1.md",
  "docs/AUGNES_CURRENT_WORKING_PERSPECTIVE_V0_1.md",
  "docs/AUGNES_DELTA_PROJECTION_READ_MODEL_V0_1.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/HUMAN_SURFACE_V0_1.md",
  "docs/PERSPECTIVE_CAPSULE_CONTRACT_V0_1.md",
] as const;

export type GuideBriefReadErrorCode =
  | ReadonlyApiAccessErrorCode
  | ReadonlyApiAuthScopeErrorCodeV0
  | "invalid_scope"
  | "unavailable";

export type GuideBriefReadErrorStatus =
  | ReadonlyApiAccessErrorStatus
  | ReadonlyApiAuthScopeFailureV0["status"]
  | 500;

export type GuideBriefReadValidationResult =
  | {
      ok: true;
      scope: typeof GUIDE_BRIEF_ROUTE_SCOPE;
      route_id: typeof GUIDE_BRIEF_ROUTE_ID;
      route_family: typeof GUIDE_BRIEF_ROUTE_FAMILY;
      local_authorized: true;
    }
  | {
      ok: false;
      code: GuideBriefReadErrorCode;
      status: GuideBriefReadErrorStatus;
      authority_boundary: string[];
    };

export type GuideBriefReadErrorBody = {
  response_version: "guide_brief_route_response.v0.1";
  runtime: "augnes";
  guide_version: typeof GUIDE_BRIEF_VERSION;
  error: {
    code: GuideBriefReadErrorCode;
    status: GuideBriefReadErrorStatus;
  };
  authority_boundary: ReturnType<typeof buildGuideBriefAuthorityBoundary>;
  route_authority_boundary: string[];
};

export function validateGuideBriefReadRequest(
  request: Request,
): GuideBriefReadValidationResult {
  let url: URL;

  try {
    url = new URL(request.url);
  } catch {
    return readRouteError("malformed_request", 400);
  }

  const requestedScope = url.searchParams.get("scope");
  if (!requestedScope) {
    return readRouteError("missing_scope", 400);
  }

  if (requestedScope !== GUIDE_BRIEF_ROUTE_SCOPE) {
    return readRouteError("invalid_scope", 400);
  }

  const localGuardResult = validateReadonlyApiLocalAccess(
    request,
    GUIDE_BRIEF_ACCESS_POLICY,
  );

  if (!localGuardResult.ok) {
    return localGuardResult;
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
    scope: GUIDE_BRIEF_ROUTE_SCOPE,
    route_id: GUIDE_BRIEF_ROUTE_ID,
    route_family: GUIDE_BRIEF_ROUTE_FAMILY,
    local_authorized: true,
  };
}

export function buildGuideBriefReadError({
  code,
  status,
  authorityBoundary = GUIDE_BRIEF_READ_ERROR_AUTHORITY_BOUNDARY,
}: {
  code: GuideBriefReadErrorCode;
  status: GuideBriefReadErrorStatus;
  authorityBoundary?: string[];
}): GuideBriefReadErrorBody {
  return {
    response_version: "guide_brief_route_response.v0.1",
    runtime: "augnes",
    guide_version: GUIDE_BRIEF_VERSION,
    error: {
      code,
      status,
    },
    authority_boundary: buildGuideBriefAuthorityBoundary(),
    route_authority_boundary: authorityBoundary,
  };
}

export function readGuideBriefForRoute({
  scope,
}: {
  scope: typeof GUIDE_BRIEF_ROUTE_SCOPE;
}): GuideBrief {
  return buildGuideBrief(buildGuideBriefRouteInput({ scope }));
}

export function buildGuideBriefRouteInput({
  scope,
}: {
  scope: typeof GUIDE_BRIEF_ROUTE_SCOPE;
}): GuideBriefInput {
  const deltaProjection = buildAugnesDeltaProjectionRuntimeReadModel({ scope });
  const currentWorkingPerspective =
    buildCurrentWorkingPerspectiveRuntimeReadModel({ scope });

  return {
    scope,
    as_of: latestKnownAsOf([
      currentWorkingPerspective.as_of,
      deltaProjection.as_of,
    ]),
    current_working_perspective: currentWorkingPerspective,
    delta_projection: deltaProjection,
    workplane_context: buildGuideBriefWorkplaneContextForRoute({
      currentPerspectiveGapCount: currentWorkingPerspective.gaps.length,
      deltaProjectionGapCount: deltaProjection.gaps.length,
    }),
    surface_context: {
      source_status: {
        current_working_perspective:
          currentWorkingPerspective.gaps.length > 0
            ? "runtime_read_model_with_source_gaps"
            : "runtime_read_model",
        delta_projection:
          deltaProjection.gaps.length > 0
            ? "runtime_read_model_with_source_gaps"
            : "runtime_read_model",
        workplane: "static_phase_5_contract_context",
      },
      fallback_reasons: buildRouteFallbackReasons({
        currentPerspectiveGapCount: currentWorkingPerspective.gaps.length,
        deltaProjectionGapCount: deltaProjection.gaps.length,
      }),
      route_refs: ["/", "/perspective", "/workbench"],
      source_surfaces: [
        "current_working_perspective",
        "delta_projection",
        "human_surface",
        "perspective_timeline",
        "agent_workplane",
        "docs",
      ],
    },
    docs_refs: [...GUIDE_BRIEF_DOC_REFS],
    next_phase_notes: [
      "Phase 6B adds a GET-only local read-only GuideBrief route.",
      "Phase 6C Web Guide UI remains deferred.",
      "Phase 6D ChatGPT App/MCP Guide tool remains deferred.",
      "Phase 6E Codex Guide alignment remains deferred.",
      "Phase 7 Handoff Capsule / Codex Launch Card remains deferred.",
    ],
  };
}

export function buildGuideBriefWorkplaneContextForRoute({
  currentPerspectiveGapCount = 0,
  deltaProjectionGapCount = 0,
}: {
  currentPerspectiveGapCount?: number;
  deltaProjectionGapCount?: number;
} = {}): GuideBriefInput["workplane_context"] {
  return {
    surface_role: "agent_workplane",
    route: "/workbench",
    panels_available: [
      "Work Queue",
      "Current Working Perspective",
      "Augnes Delta Projection",
      "Review Queue",
      "Evidence / Handoff",
      "Workplane Inspector",
      "Projection Candidates",
      "Delta Batch",
      "Handoff Builder preview",
      "Run Postmortem",
      "Trace / Diagnostics",
    ],
    legacy_cockpit_reachable: true,
    trace_diagnostics_bounded: true,
    source_fallback_status: [
      currentPerspectiveGapCount > 0
        ? `Current Working Perspective runtime read model reported ${currentPerspectiveGapCount} source gaps`
        : "Current Working Perspective runtime read model available",
      deltaProjectionGapCount > 0
        ? `Augnes Delta Projection runtime read model reported ${deltaProjectionGapCount} source gaps`
        : "Augnes Delta Projection runtime read model available",
      "Agent Workplane context is static Phase 5 contract context for /workbench",
    ],
    authority_boundary_notes: [
      "GuideBrief route provides read-only Agent Workplane context only.",
      "The route does not add UI actions, Workplane writes, handoff send, Codex execution, provider calls, GitHub calls, proof/evidence writes, or state mutation.",
      "Trace and diagnostics refs must stay bounded or collapsed when rendered by a future surface.",
    ],
  };
}

function readRouteError(
  code: GuideBriefReadErrorCode,
  status: GuideBriefReadErrorStatus,
): GuideBriefReadValidationResult {
  return {
    ok: false,
    code,
    status,
    authority_boundary: GUIDE_BRIEF_READ_ERROR_AUTHORITY_BOUNDARY,
  };
}

function buildRouteFallbackReasons({
  currentPerspectiveGapCount,
  deltaProjectionGapCount,
}: {
  currentPerspectiveGapCount: number;
  deltaProjectionGapCount: number;
}): string[] {
  const reasons: string[] = [];

  if (currentPerspectiveGapCount > 0) {
    reasons.push(
      `Current Working Perspective runtime read model surfaced ${currentPerspectiveGapCount} source gaps.`,
    );
  }

  if (deltaProjectionGapCount > 0) {
    reasons.push(
      `Augnes Delta Projection runtime read model surfaced ${deltaProjectionGapCount} source gaps.`,
    );
  }

  return reasons;
}

function latestKnownAsOf(values: string[]): string | undefined {
  const timestamps = values
    .map((value) => ({
      value,
      time: Date.parse(value),
    }))
    .filter((entry) => Number.isFinite(entry.time))
    .sort((left, right) => right.time - left.time);

  return timestamps[0]?.value ?? values.find(Boolean);
}
