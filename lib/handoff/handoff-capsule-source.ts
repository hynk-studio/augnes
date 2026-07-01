import {
  GUIDE_BRIEF_ROUTE_SCOPE,
  readGuideBriefForRoute,
} from "@/lib/guide/guide-brief-source";
import {
  buildCodexLaunchCard,
  buildCodexLaunchCardAuthorityBoundary,
  buildHandoffCapsule,
  buildHandoffCapsuleAuthorityBoundary,
} from "@/lib/handoff/handoff-capsule";
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
import type { GuideBrief } from "@/types/guide-brief";
import type {
  CodexLaunchCard,
  CodexLaunchCardInput,
  HandoffCapsule,
  HandoffCapsuleInput,
  HandoffTargetSurface,
} from "@/types/handoff-capsule";
import type {
  ReadonlyApiAuthScopeErrorCodeV0,
  ReadonlyApiAuthScopeFailureV0,
} from "@/types/readonly-api-auth-scope";

export const HANDOFF_CAPSULE_ROUTE_SCOPE = GUIDE_BRIEF_ROUTE_SCOPE;
export const HANDOFF_CAPSULE_LOCAL_READONLY_HEADER =
  "x-augnes-local-readonly" as const;
export const HANDOFF_CAPSULE_LOCAL_READONLY_VALUE =
  "handoff-capsule-v0.1" as const;
export const CODEX_LAUNCH_CARD_LOCAL_READONLY_VALUE =
  "codex-launch-card-v0.1" as const;
export const HANDOFF_CAPSULE_ROUTE_FAMILY = "handoff_capsule" as const;
export const CODEX_LAUNCH_CARD_ROUTE_FAMILY = "codex_launch_card" as const;
export const HANDOFF_CAPSULE_ROUTE_ID =
  "augnes.read.handoff_capsule.v0.1" as const;
export const CODEX_LAUNCH_CARD_ROUTE_ID =
  "augnes.read.codex_launch_card.v0.1" as const;
export const HANDOFF_CAPSULE_CACHE_CONTROL = "no-store" as const;

const HANDOFF_CAPSULE_RESPONSE_VERSION =
  "handoff_capsule_route_response.v0.1" as const;
const CODEX_LAUNCH_CARD_RESPONSE_VERSION =
  "codex_launch_card_route_response.v0.1" as const;
const SUPPORTED_PHASE_7B_TARGET = "codex_handoff" as const;

export const HANDOFF_CAPSULE_ROUTE_AUTHORITY_BOUNDARY = [
  "GET-only local read-only Handoff Capsule / Codex Launch Card route",
  "fail-closed scope and local marker validation",
  "preview JSON only",
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
  "no scheduler/autonomy authority",
  "no external side effect authority",
] as const;

export const HANDOFF_CAPSULE_ACCESS_POLICY: ReadonlyApiAccessPolicy = {
  route_id: HANDOFF_CAPSULE_ROUTE_ID,
  required_scope: HANDOFF_CAPSULE_ROUTE_SCOPE,
  required_marker_header: HANDOFF_CAPSULE_LOCAL_READONLY_HEADER,
  required_marker_value: HANDOFF_CAPSULE_LOCAL_READONLY_VALUE,
  allowed_hosts: READONLY_LOCAL_HOSTS,
  route_family: HANDOFF_CAPSULE_ROUTE_FAMILY,
};

export const CODEX_LAUNCH_CARD_ACCESS_POLICY: ReadonlyApiAccessPolicy = {
  route_id: CODEX_LAUNCH_CARD_ROUTE_ID,
  required_scope: HANDOFF_CAPSULE_ROUTE_SCOPE,
  required_marker_header: HANDOFF_CAPSULE_LOCAL_READONLY_HEADER,
  required_marker_value: CODEX_LAUNCH_CARD_LOCAL_READONLY_VALUE,
  allowed_hosts: READONLY_LOCAL_HOSTS,
  route_family: CODEX_LAUNCH_CARD_ROUTE_FAMILY,
};

export type HandoffCapsuleReadErrorCode =
  | ReadonlyApiAccessErrorCode
  | ReadonlyApiAuthScopeErrorCodeV0
  | "missing_marker"
  | "invalid_marker"
  | "invalid_scope"
  | "invalid_target"
  | "unavailable";

export type CodexLaunchCardReadErrorCode =
  | ReadonlyApiAccessErrorCode
  | ReadonlyApiAuthScopeErrorCodeV0
  | "missing_marker"
  | "invalid_marker"
  | "invalid_scope"
  | "unavailable";

export type HandoffCapsuleReadErrorStatus =
  | ReadonlyApiAccessErrorStatus
  | ReadonlyApiAuthScopeFailureV0["status"]
  | 500;

export type HandoffCapsuleReadValidationResult =
  | {
      ok: true;
      scope: typeof HANDOFF_CAPSULE_ROUTE_SCOPE;
      target: typeof SUPPORTED_PHASE_7B_TARGET;
      route_id: typeof HANDOFF_CAPSULE_ROUTE_ID;
      route_family: typeof HANDOFF_CAPSULE_ROUTE_FAMILY;
      local_authorized: true;
    }
  | {
      ok: false;
      code: HandoffCapsuleReadErrorCode;
      status: HandoffCapsuleReadErrorStatus;
      authority_boundary: string[];
    };

export type CodexLaunchCardReadValidationResult =
  | {
      ok: true;
      scope: typeof HANDOFF_CAPSULE_ROUTE_SCOPE;
      route_id: typeof CODEX_LAUNCH_CARD_ROUTE_ID;
      route_family: typeof CODEX_LAUNCH_CARD_ROUTE_FAMILY;
      local_authorized: true;
    }
  | {
      ok: false;
      code: CodexLaunchCardReadErrorCode;
      status: HandoffCapsuleReadErrorStatus;
      authority_boundary: string[];
    };

export type HandoffCapsuleReadErrorBody = {
  response_version: typeof HANDOFF_CAPSULE_RESPONSE_VERSION;
  runtime: "augnes";
  error: {
    code: HandoffCapsuleReadErrorCode;
    status: HandoffCapsuleReadErrorStatus;
  };
  authority_boundary: ReturnType<typeof buildHandoffCapsuleAuthorityBoundary>;
  route_authority_boundary: string[];
};

export type CodexLaunchCardReadErrorBody = {
  response_version: typeof CODEX_LAUNCH_CARD_RESPONSE_VERSION;
  runtime: "augnes";
  error: {
    code: CodexLaunchCardReadErrorCode;
    status: HandoffCapsuleReadErrorStatus;
  };
  authority_boundary: ReturnType<typeof buildCodexLaunchCardAuthorityBoundary>;
  route_authority_boundary: string[];
};

export type HandoffCapsuleRouteResponse = {
  response_version: typeof HANDOFF_CAPSULE_RESPONSE_VERSION;
  runtime: "augnes";
  scope: typeof HANDOFF_CAPSULE_ROUTE_SCOPE;
  route_id: typeof HANDOFF_CAPSULE_ROUTE_ID;
  route_family: typeof HANDOFF_CAPSULE_ROUTE_FAMILY;
  capsule: HandoffCapsule;
  route_authority_boundary: string[];
  source_status: HandoffRouteSourceStatus;
  warnings: string[];
  gaps: string[];
};

export type CodexLaunchCardRouteResponse = {
  response_version: typeof CODEX_LAUNCH_CARD_RESPONSE_VERSION;
  runtime: "augnes";
  scope: typeof HANDOFF_CAPSULE_ROUTE_SCOPE;
  route_id: typeof CODEX_LAUNCH_CARD_ROUTE_ID;
  route_family: typeof CODEX_LAUNCH_CARD_ROUTE_FAMILY;
  launch_card: CodexLaunchCard;
  route_authority_boundary: string[];
  source_status: HandoffRouteSourceStatus;
  warnings: string[];
  gaps: string[];
};

type HandoffRouteSourceStatus = {
  guide_brief: string;
  capsule: string;
  launch_card?: string;
  synthetic_operator_supplied_fields: string[];
  source_disclosure: string;
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

type LocalAccessValidationResult =
  | {
      ok: true;
      scope: typeof HANDOFF_CAPSULE_ROUTE_SCOPE;
      route_id: string;
      route_family: string;
      local_authorized: true;
    }
  | {
      ok: false;
      code: ReadonlyApiAccessErrorCode | ReadonlyApiAuthScopeErrorCodeV0;
      status: HandoffCapsuleReadErrorStatus;
      authority_boundary: string[];
    };

export function validateHandoffCapsuleReadRequest(
  request: Request,
): HandoffCapsuleReadValidationResult {
  let url: URL;

  try {
    url = new URL(request.url);
  } catch {
    return handoffReadRouteError("malformed_request", 400);
  }

  const scopeResult = validateScope(url);
  if (!scopeResult.ok) return scopeResult;

  const target = url.searchParams.get("target");
  if (target !== SUPPORTED_PHASE_7B_TARGET) {
    return handoffReadRouteError("invalid_target", 400);
  }

  const markerResult = validateLocalMarker(
    request,
    HANDOFF_CAPSULE_LOCAL_READONLY_VALUE,
  );
  if (!markerResult.ok) return markerResult;

  const localAccessResult = validateLocalAccess({
    request,
    policy: HANDOFF_CAPSULE_ACCESS_POLICY,
  });
  if (!localAccessResult.ok) return localAccessResult;

  return {
    ok: true,
    scope: HANDOFF_CAPSULE_ROUTE_SCOPE,
    target: SUPPORTED_PHASE_7B_TARGET,
    route_id: HANDOFF_CAPSULE_ROUTE_ID,
    route_family: HANDOFF_CAPSULE_ROUTE_FAMILY,
    local_authorized: true,
  };
}

export function validateCodexLaunchCardReadRequest(
  request: Request,
): CodexLaunchCardReadValidationResult {
  let url: URL;

  try {
    url = new URL(request.url);
  } catch {
    return codexReadRouteError("malformed_request", 400);
  }

  const scopeResult = validateScope(url);
  if (!scopeResult.ok) {
    return scopeResult;
  }

  const markerResult = validateLocalMarker(
    request,
    CODEX_LAUNCH_CARD_LOCAL_READONLY_VALUE,
  );
  if (!markerResult.ok) {
    return {
      ok: false,
      code: markerResult.code,
      status: markerResult.status,
      authority_boundary: markerResult.authority_boundary,
    };
  }

  const localAccessResult = validateLocalAccess({
    request,
    policy: CODEX_LAUNCH_CARD_ACCESS_POLICY,
  });
  if (!localAccessResult.ok) {
    return {
      ok: false,
      code: localAccessResult.code,
      status: localAccessResult.status,
      authority_boundary: localAccessResult.authority_boundary,
    };
  }

  return {
    ok: true,
    scope: HANDOFF_CAPSULE_ROUTE_SCOPE,
    route_id: CODEX_LAUNCH_CARD_ROUTE_ID,
    route_family: CODEX_LAUNCH_CARD_ROUTE_FAMILY,
    local_authorized: true,
  };
}

export function buildHandoffCapsuleReadError({
  code,
  status,
  authorityBoundary = [...HANDOFF_CAPSULE_ROUTE_AUTHORITY_BOUNDARY],
}: {
  code: HandoffCapsuleReadErrorCode;
  status: HandoffCapsuleReadErrorStatus;
  authorityBoundary?: string[];
}): HandoffCapsuleReadErrorBody {
  return {
    response_version: HANDOFF_CAPSULE_RESPONSE_VERSION,
    runtime: "augnes",
    error: { code, status },
    authority_boundary: buildHandoffCapsuleAuthorityBoundary(),
    route_authority_boundary: authorityBoundary,
  };
}

export function buildCodexLaunchCardReadError({
  code,
  status,
  authorityBoundary = [...HANDOFF_CAPSULE_ROUTE_AUTHORITY_BOUNDARY],
}: {
  code: CodexLaunchCardReadErrorCode;
  status: HandoffCapsuleReadErrorStatus;
  authorityBoundary?: string[];
}): CodexLaunchCardReadErrorBody {
  return {
    response_version: CODEX_LAUNCH_CARD_RESPONSE_VERSION,
    runtime: "augnes",
    error: { code, status },
    authority_boundary: buildCodexLaunchCardAuthorityBoundary(),
    route_authority_boundary: authorityBoundary,
  };
}

export function readHandoffCapsuleForRoute({
  scope,
  target,
}: {
  scope: typeof HANDOFF_CAPSULE_ROUTE_SCOPE;
  target: typeof SUPPORTED_PHASE_7B_TARGET;
}): HandoffCapsuleRouteResponse {
  const guideBrief = readGuideBriefForRoute({ scope });
  const capsule = buildHandoffCapsule(
    buildHandoffCapsuleRouteInput({ scope, target, guideBrief }),
  );

  return {
    response_version: HANDOFF_CAPSULE_RESPONSE_VERSION,
    runtime: "augnes",
    scope,
    route_id: HANDOFF_CAPSULE_ROUTE_ID,
    route_family: HANDOFF_CAPSULE_ROUTE_FAMILY,
    capsule,
    route_authority_boundary: [...HANDOFF_CAPSULE_ROUTE_AUTHORITY_BOUNDARY],
    source_status: buildSourceStatus({ guideBrief, includesLaunchCard: false }),
    warnings: buildRouteWarnings(guideBrief),
    gaps: guideBrief.gaps.map((gap) => gap.summary),
  };
}

export function readCodexLaunchCardForRoute({
  scope,
}: {
  scope: typeof HANDOFF_CAPSULE_ROUTE_SCOPE;
}): CodexLaunchCardRouteResponse {
  const guideBrief = readGuideBriefForRoute({ scope });
  const sourceCapsule = buildHandoffCapsule(
    buildHandoffCapsuleRouteInput({
      scope,
      target: SUPPORTED_PHASE_7B_TARGET,
      guideBrief,
    }),
  );
  const launchCard = buildCodexLaunchCard(
    buildCodexLaunchCardRouteInput({ scope, sourceCapsule, guideBrief }),
  );

  return {
    response_version: CODEX_LAUNCH_CARD_RESPONSE_VERSION,
    runtime: "augnes",
    scope,
    route_id: CODEX_LAUNCH_CARD_ROUTE_ID,
    route_family: CODEX_LAUNCH_CARD_ROUTE_FAMILY,
    launch_card: launchCard,
    route_authority_boundary: [...HANDOFF_CAPSULE_ROUTE_AUTHORITY_BOUNDARY],
    source_status: buildSourceStatus({ guideBrief, includesLaunchCard: true }),
    warnings: buildRouteWarnings(guideBrief),
    gaps: guideBrief.gaps.map((gap) => gap.summary),
  };
}

export function buildHandoffCapsuleRouteInput({
  scope,
  target,
  guideBrief,
}: {
  scope: typeof HANDOFF_CAPSULE_ROUTE_SCOPE;
  target: HandoffTargetSurface;
  guideBrief: GuideBrief;
}): HandoffCapsuleInput {
  const guideBriefRef = `guide_brief:${scope}:${guideBrief.as_of}`;

  return {
    scope,
    capsule_id: `handoff_capsule.${scope.replace(/[^a-z0-9]+/gi, "_")}.${target}.v0.1.preview`,
    created_at: guideBrief.as_of,
    source_guide_brief_ref: guideBriefRef,
    source_snapshot_refs: [
      ...guideBrief.source_refs.perspective_snapshot_refs,
    ],
    guide_brief: guideBrief,
    target_surface: target,
    target_actor: "codex",
    handoff_intent: "implementation_preparation",
    status: "preview_only",
    title: "Codex handoff capsule preview",
    summary:
      "Preview-only Handoff Capsule composed from the local read-only GuideBrief route source for manual review.",
    selections: {
      guide_brief_ref: guideBriefRef,
      route_refs: [
        "/api/augnes/read/handoff-capsule?scope=project:augnes&target=codex_handoff",
        "/api/augnes/read/codex-launch-card?scope=project:augnes",
      ],
      docs_refs: [
        "docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md",
        "docs/GUIDEBRIEF_CONTRACT_V0_1.md",
        "docs/CODEX_GUIDEBRIEF_HANDOFF_V0_1.md",
      ],
      repo_refs: ["hynk-studio/augnes"],
    },
    expected_inputs: [
      "Validated local GET request.",
      "GuideBrief route source data.",
      "Future active operator/user prompt before any execution-scoped work.",
    ],
    expected_outputs: [
      "Preview JSON Handoff Capsule only.",
      "No sent handoff, launch, execution, write, or external side effect.",
    ],
    next_phase_notes: [
      "Phase 7B adds GET-only local read-only Handoff Capsule / Codex Launch Card preview routes.",
      "Phase 7C Web preview UI is deferred.",
      "Phase 7D ChatGPT App/MCP tool is deferred.",
      "Phase 7E Codex skill alignment is deferred.",
      "Future execution paths require separate explicit operator scope.",
    ],
    public_safety: {
      fixture_kind: "runtime_read_model",
      contains_private_conversations: false,
      contains_hidden_reasoning: false,
      contains_local_private_paths: false,
      contains_secrets: false,
      contains_tokens: false,
      contains_raw_provider_output: false,
      contains_raw_retrieval_output: false,
      contains_real_account_artifacts: false,
      notes: [
        "Route response is preview-only.",
        "GuideBrief-derived fields come from local read-only read models.",
        "Repo/task fields are shaped route defaults for manual review and are not live task assignment.",
      ],
    },
  };
}

export function buildCodexLaunchCardRouteInput({
  scope,
  sourceCapsule,
  guideBrief,
}: {
  scope: typeof HANDOFF_CAPSULE_ROUTE_SCOPE;
  sourceCapsule: HandoffCapsule;
  guideBrief: GuideBrief;
}): CodexLaunchCardInput {
  return {
    scope,
    launch_card_id: `codex_launch_card.${scope.replace(/[^a-z0-9]+/gi, "_")}.v0.1.preview`,
    created_at: guideBrief.as_of,
    source_capsule: sourceCapsule,
    source_guide_brief_ref: sourceCapsule.source_guide_brief_ref,
    repo: "hynk-studio/augnes",
    base_branch: "main",
    branch_suggestion:
      "operator-scoped-branch-required-before-any-codex-work",
    expected_pr_title: "Operator-scoped task required before PR title",
    task_goal:
      "Review the Codex Launch Card preview and provide an explicit operator prompt before any Codex implementation work.",
    task_summary:
      "Preview-only Launch Card route output. It is not Codex execution, branch creation, PR creation, or handoff send.",
    context_anchors: [
      sourceCapsule.source_guide_brief_ref,
      sourceCapsule.capsule_id,
      "docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md",
      "docs/CODEX_GUIDEBRIEF_HANDOFF_V0_1.md",
    ],
    expected_files: [
      "Operator prompt must supply expected files before Codex work.",
      "This route does not create a work plan or file authorization.",
    ],
    forbidden_files: [
      "app/** unless explicitly scoped by a future operator prompt",
      "components/** unless explicitly scoped by a future operator prompt",
      "apps/augnes_apps/** unless explicitly scoped by a future operator prompt",
      "migrations/**",
      "lib/db.ts",
      "provider/**",
      "proof/**",
      "evidence/**",
      "autonomy/**",
    ],
    required_checks: [
      "Operator prompt must supply required checks before Codex work.",
      "Report every skipped check with a concrete reason.",
    ],
    optional_checks: [],
    status: "preview_only",
    next_phase_notes: sourceCapsule.next_phase_notes,
    public_safety: sourceCapsule.public_safety,
  };
}

function validateScope(
  url: URL,
): ScopeValidationResult {
  const requestedScope = url.searchParams.get("scope");
  if (!requestedScope) {
    return scopeOrMarkerReadRouteError("missing_scope", 400);
  }

  if (requestedScope !== HANDOFF_CAPSULE_ROUTE_SCOPE) {
    return scopeOrMarkerReadRouteError("invalid_scope", 400);
  }

  return { ok: true };
}

function validateLocalMarker(
  request: Request,
  expectedMarker: string,
): LocalMarkerValidationResult {
  const marker = request.headers.get(HANDOFF_CAPSULE_LOCAL_READONLY_HEADER);
  if (!marker) {
    return scopeOrMarkerReadRouteError("missing_marker", 403);
  }

  if (marker !== expectedMarker) {
    return scopeOrMarkerReadRouteError("invalid_marker", 403);
  }

  return { ok: true };
}

function validateLocalAccess({
  request,
  policy,
}: {
  request: Request;
  policy: ReadonlyApiAccessPolicy;
}): LocalAccessValidationResult {
  const localGuardResult = validateReadonlyApiLocalAccess(request, policy);

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
    scope: HANDOFF_CAPSULE_ROUTE_SCOPE,
    route_id: policy.route_id,
    route_family: policy.route_family,
    local_authorized: true,
  };
}

function handoffReadRouteError(
  code: HandoffCapsuleReadErrorCode,
  status: HandoffCapsuleReadErrorStatus,
): Extract<HandoffCapsuleReadValidationResult, { ok: false }> {
  return {
    ok: false,
    code,
    status,
    authority_boundary: [...HANDOFF_CAPSULE_ROUTE_AUTHORITY_BOUNDARY],
  };
}

function scopeOrMarkerReadRouteError<
  TCode extends "missing_scope" | "invalid_scope" | "missing_marker" | "invalid_marker",
  TStatus extends 400 | 403,
>(code: TCode, status: TStatus) {
  return {
    ok: false as const,
    code,
    status,
    authority_boundary: [...HANDOFF_CAPSULE_ROUTE_AUTHORITY_BOUNDARY],
  };
}

function codexReadRouteError(
  code: CodexLaunchCardReadErrorCode,
  status: HandoffCapsuleReadErrorStatus,
): Extract<CodexLaunchCardReadValidationResult, { ok: false }> {
  return {
    ok: false,
    code,
    status,
    authority_boundary: [...HANDOFF_CAPSULE_ROUTE_AUTHORITY_BOUNDARY],
  };
}

function buildSourceStatus({
  guideBrief,
  includesLaunchCard,
}: {
  guideBrief: GuideBrief;
  includesLaunchCard: boolean;
}): HandoffRouteSourceStatus {
  return {
    guide_brief:
      guideBrief.gaps.length > 0
        ? "runtime_guide_brief_with_source_gaps"
        : "runtime_guide_brief",
    capsule:
      "preview_composed_from_read_only_guide_brief_and_route_defaults",
    launch_card: includesLaunchCard
      ? "preview_composed_from_handoff_capsule_and_operator_sample_defaults"
      : undefined,
    synthetic_operator_supplied_fields: [
      "repo",
      "base_branch",
      "branch_suggestion",
      "expected_pr_title",
      "task_goal",
      "expected_files",
      "required_checks",
    ],
    source_disclosure:
      "Route-composed operator/sample defaults do not claim live task assignment or execution state.",
  };
}

function buildRouteWarnings(guideBrief: GuideBrief): string[] {
  return [
    ...guideBrief.staleness_warnings.map((warning) => warning.summary),
    "Handoff Capsule and Codex Launch Card route outputs are preview JSON only.",
    "Launch Card status never means executed.",
  ];
}
