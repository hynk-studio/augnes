import {
  buildAutonomyBudget,
  buildAutonomyContract,
  buildAutonomyContractAuthorityBoundary,
  buildAutonomyDeltaMergePolicy,
  buildAutonomyOutputPolicy,
  buildAutonomyReportingCadence,
  buildAutonomyReviewEscalationPolicy,
  buildAutonomyRunPreview,
  buildAutonomyStopConditions,
  buildDefaultAllowedActions,
  buildDefaultForbiddenActions,
} from "@/lib/autonomy/autonomy-contract";
import {
  GUIDE_BRIEF_ROUTE_SCOPE,
  readGuideBriefForRoute,
} from "@/lib/guide/guide-brief-source";
import {
  readCodexLaunchCardForRoute,
  readHandoffCapsuleForRoute,
  type CodexLaunchCardRouteResponse,
  type HandoffCapsuleRouteResponse,
} from "@/lib/handoff/handoff-capsule-source";
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
  AutonomyContract,
  AutonomyContractBuilderInput,
  AutonomyGap,
} from "@/types/autonomy-contract";
import type { GuideBrief, GuideBriefGapSeverity } from "@/types/guide-brief";
import type {
  ReadonlyApiAuthScopeErrorCodeV0,
  ReadonlyApiAuthScopeFailureV0,
} from "@/types/readonly-api-auth-scope";

export const AUTONOMY_CONTRACT_ROUTE_SCOPE = "project:augnes" as const;
export const AUTONOMY_CONTRACT_LOCAL_READONLY_HEADER =
  "x-augnes-local-readonly" as const;
export const AUTONOMY_CONTRACT_LOCAL_READONLY_VALUE =
  "autonomy-contract-v0.1" as const;
export const AUTONOMY_CONTRACT_ROUTE_FAMILY =
  "autonomy_contract" as const;
export const AUTONOMY_CONTRACT_ROUTE_ID =
  "augnes.read.autonomy_contract.v0.1" as const;
export const AUTONOMY_CONTRACT_CACHE_CONTROL = "no-store" as const;

const AUTONOMY_CONTRACT_RESPONSE_VERSION =
  "autonomy_contract_route_response.v0.1" as const;
const ROUTE_PREVIEW_CREATED_AT_FALLBACK = "1970-01-01T00:00:00.000Z" as const;

export const AUTONOMY_CONTRACT_ROUTE_AUTHORITY_BOUNDARY = [
  "GET-only local read-only Autonomy Contract route",
  "fail-closed scope and local marker validation",
  "preview JSON only",
  "no autonomy runner authority",
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
  "no Codex launch authority",
  "no branch/PR creation authority from Augnes product code",
  "no MCP/App write tool authority",
  "no UI action authority",
  "no handoff send authority",
  "no external side effect authority",
] as const;

export const AUTONOMY_CONTRACT_ACCESS_POLICY: ReadonlyApiAccessPolicy = {
  route_id: AUTONOMY_CONTRACT_ROUTE_ID,
  required_scope: AUTONOMY_CONTRACT_ROUTE_SCOPE,
  required_marker_header: AUTONOMY_CONTRACT_LOCAL_READONLY_HEADER,
  required_marker_value: AUTONOMY_CONTRACT_LOCAL_READONLY_VALUE,
  allowed_hosts: READONLY_LOCAL_HOSTS,
  route_family: AUTONOMY_CONTRACT_ROUTE_FAMILY,
};

export type AutonomyContractReadErrorCode =
  | ReadonlyApiAccessErrorCode
  | ReadonlyApiAuthScopeErrorCodeV0
  | "invalid_scope"
  | "missing_marker"
  | "invalid_marker"
  | "unavailable";

export type AutonomyContractReadErrorStatus =
  | ReadonlyApiAccessErrorStatus
  | ReadonlyApiAuthScopeFailureV0["status"]
  | 500;

export type AutonomyContractReadValidationResult =
  | {
      ok: true;
      scope: typeof AUTONOMY_CONTRACT_ROUTE_SCOPE;
      route_id: typeof AUTONOMY_CONTRACT_ROUTE_ID;
      route_family: typeof AUTONOMY_CONTRACT_ROUTE_FAMILY;
      local_authorized: true;
    }
  | {
      ok: false;
      code: AutonomyContractReadErrorCode;
      status: AutonomyContractReadErrorStatus;
      authority_boundary: string[];
    };

export type AutonomyContractReadErrorBody = {
  response_version: typeof AUTONOMY_CONTRACT_RESPONSE_VERSION;
  runtime: "augnes";
  error: {
    code: AutonomyContractReadErrorCode;
    status: AutonomyContractReadErrorStatus;
  };
  authority_boundary: ReturnType<typeof buildAutonomyContractAuthorityBoundary>;
  route_authority_boundary: string[];
};

export type AutonomyContractRouteResponse = {
  response_version: typeof AUTONOMY_CONTRACT_RESPONSE_VERSION;
  runtime: "augnes";
  scope: typeof AUTONOMY_CONTRACT_ROUTE_SCOPE;
  route_id: typeof AUTONOMY_CONTRACT_ROUTE_ID;
  route_family: typeof AUTONOMY_CONTRACT_ROUTE_FAMILY;
  contract: AutonomyContract;
  route_authority_boundary: string[];
  source_status: AutonomyContractRouteSourceStatus;
  warnings: string[];
  gaps: string[];
};

export type AutonomyContractRouteSourceStatus = {
  guide_brief: string;
  handoff_capsule: string;
  codex_launch_card: string;
  autonomy_contract: string;
  budget: string;
  delta_merge_policy: string;
  run_preview: string;
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

type AutonomyContractRouteInputSources = {
  scope: typeof AUTONOMY_CONTRACT_ROUTE_SCOPE;
  guideBrief: GuideBrief;
  handoffCapsuleResponse: HandoffCapsuleRouteResponse;
  codexLaunchCardResponse: CodexLaunchCardRouteResponse;
};

export function validateAutonomyContractReadRequest(
  request: Request,
): AutonomyContractReadValidationResult {
  let url: URL;

  try {
    url = new URL(request.url);
  } catch {
    return autonomyContractReadRouteError("malformed_request", 400);
  }

  const scopeResult = validateScope(url);
  if (!scopeResult.ok) return scopeResult;

  const markerResult = validateLocalMarker(request);
  if (!markerResult.ok) return markerResult;

  const localGuardResult = validateReadonlyApiLocalAccess(
    request,
    AUTONOMY_CONTRACT_ACCESS_POLICY,
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
    scope: AUTONOMY_CONTRACT_ROUTE_SCOPE,
    route_id: AUTONOMY_CONTRACT_ROUTE_ID,
    route_family: AUTONOMY_CONTRACT_ROUTE_FAMILY,
    local_authorized: true,
  };
}

export function buildAutonomyContractReadError({
  code,
  status,
  authorityBoundary = [...AUTONOMY_CONTRACT_ROUTE_AUTHORITY_BOUNDARY],
}: {
  code: AutonomyContractReadErrorCode;
  status: AutonomyContractReadErrorStatus;
  authorityBoundary?: string[];
}): AutonomyContractReadErrorBody {
  return {
    response_version: AUTONOMY_CONTRACT_RESPONSE_VERSION,
    runtime: "augnes",
    error: { code, status },
    authority_boundary: buildAutonomyContractAuthorityBoundary(),
    route_authority_boundary: authorityBoundary,
  };
}

export function readAutonomyContractForRoute({
  scope,
}: {
  scope: typeof AUTONOMY_CONTRACT_ROUTE_SCOPE;
}): AutonomyContractRouteResponse {
  const guideBrief = readGuideBriefForRoute({ scope });
  const handoffCapsuleResponse = readHandoffCapsuleForRoute({
    scope,
    target: "codex_handoff",
  });
  const codexLaunchCardResponse = readCodexLaunchCardForRoute({ scope });
  const input = buildAutonomyContractRouteInput({
    scope,
    guideBrief,
    handoffCapsuleResponse,
    codexLaunchCardResponse,
  });
  const contract = buildAutonomyContract(input);

  return {
    response_version: AUTONOMY_CONTRACT_RESPONSE_VERSION,
    runtime: "augnes",
    scope,
    route_id: AUTONOMY_CONTRACT_ROUTE_ID,
    route_family: AUTONOMY_CONTRACT_ROUTE_FAMILY,
    contract,
    route_authority_boundary: [
      ...AUTONOMY_CONTRACT_ROUTE_AUTHORITY_BOUNDARY,
    ],
    source_status: buildAutonomyContractRouteSourceStatus({
      guideBrief,
      handoffCapsuleResponse,
      codexLaunchCardResponse,
    }),
    warnings: buildAutonomyContractRouteWarnings({
      guideBrief,
      handoffCapsuleResponse,
      codexLaunchCardResponse,
    }),
    gaps: buildAutonomyContractRouteGaps({
      guideBrief,
      handoffCapsuleResponse,
      codexLaunchCardResponse,
      contract,
    }),
  };
}

export function buildAutonomyContractRouteInput({
  scope,
  guideBrief,
  handoffCapsuleResponse,
  codexLaunchCardResponse,
}: AutonomyContractRouteInputSources): AutonomyContractBuilderInput {
  const scopeKey = scope.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
  const guideBriefRef = `guide_brief:${scope}:${guideBrief.as_of}`;
  const handoffCapsule = handoffCapsuleResponse.capsule;
  const codexLaunchCard = codexLaunchCardResponse.launch_card;
  const createdAt = guideBrief.as_of || ROUTE_PREVIEW_CREATED_AT_FALLBACK;

  return {
    scope,
    contract_id: `autonomy_contract.${scopeKey}.v0.1.preview`,
    created_at: createdAt,
    status: "preview_only",
    title: "Autonomy Contract preview",
    goal:
      "Preview a future bounded autonomy delegation contract for Augnes without running autonomy.",
    autonomy_mode: "scheduled_hunt_preview",
    bounded_context_summary:
      "Preview-only Autonomy Contract composed from local read-only GuideBrief, Handoff Capsule, and Codex Launch Card route sources plus synthetic no-spend operator defaults.",
    guide_brief: guideBriefRef,
    handoff_capsules: [handoffCapsule.capsule_id],
    codex_launch_cards: [codexLaunchCard.launch_card_id],
    current_working_perspective_ref:
      guideBrief.source_refs.current_working_perspective_ref,
    delta_projection_ref: guideBrief.source_refs.delta_projection_ref,
    context_scope: {
      scope_summary:
        "Route-composed preview context for future Augnes autonomy review.",
      included_refs: uniqueSorted([
        guideBriefRef,
        handoffCapsule.capsule_id,
        codexLaunchCard.launch_card_id,
        guideBrief.source_refs.current_working_perspective_ref,
        guideBrief.source_refs.delta_projection_ref,
      ]),
      excluded_refs: [
        "private conversation logs",
        "hidden reasoning",
        "local private paths",
        "secrets/tokens",
        "raw provider output",
        "raw retrieval output",
        "real account artifacts",
        "active autonomy execution state",
      ],
      freshness:
        guideBrief.staleness_warnings.length > 0 || guideBrief.gaps.length > 0
          ? "partial"
          : "fresh",
      notes: [
        "Context refs are preview inputs only.",
        "Handoff Capsule and Codex Launch Card consumption does not grant launch, execution, handoff send, branch/PR creation, proof/evidence, merge, or external authority.",
        "This route does not run, schedule, launch, apply, post, merge, or mutate anything.",
      ],
    },
    allowed_agents: ["chatgpt", "codex"],
    allowed_surfaces: [
      "agent_workplane_preview",
      "chatgpt_review",
      "codex_handoff",
    ],
    allowed_actions: buildDefaultAllowedActions(),
    forbidden_actions: buildDefaultForbiddenActions(),
    budget: buildAutonomyBudget({
      budget_id: `autonomy_budget.${scopeKey}.route_preview.v0.1`,
      time_limit_minutes: 0,
      wall_clock_window: {
        starts_at: null,
        ends_at: null,
        timezone: "UTC",
        notes: [
          "Preview route creates no wall-clock schedule.",
          "No active schedule is created.",
          "Future runner budget requires separate operator review.",
        ],
      },
      max_iterations: 0,
      max_tool_calls: 0,
      max_codex_tasks: 0,
      max_prs: 0,
      max_file_changes: 0,
      allowed_file_globs: [],
      forbidden_file_globs: [
        "app/**",
        "app/api/**",
        "components/**",
        "apps/augnes_apps/**",
        "migrations/**",
        "lib/db*",
        "proof/**",
        "evidence/**",
        "scheduler/**",
        "autonomy-runner/**",
      ],
      token_or_compute_budget: {
        max_tokens: null,
        max_compute_units: null,
        notes: [
          "Budget is a boundary, not permission to spend.",
          "Phase 8B route does not call providers, execute tools, or run background work.",
        ],
      },
      cost_budget: {
        currency: "USD",
        amount: null,
        notes: [
          "No spend permission is granted.",
          "Phase 8B route must not charge or call provider APIs.",
        ],
      },
      retry_limit: 0,
      failure_threshold: 0,
      reporting_interval: "manual preview report only",
      requires_budget_refresh_after: [
        "missing_budget",
        "budget_exceeded",
        "scope_change",
        "new_external_side_effect_request",
        "required_check_failed",
        "required_check_skipped",
      ],
      budget_boundary_notes: [
        "Budget is a boundary, not spend permission.",
        "Missing budget blocks future autonomy.",
        "Route-composed budget fields are synthetic/operator-supplied preview defaults, not active delegation approval.",
      ],
    }),
    reporting_cadence: buildAutonomyReportingCadence({
      mode: "manual",
      interval_description:
        "Manual report after preview packet review; no scheduled reporting is active.",
      report_target_surface: "manual_operator_review",
    }),
    stop_conditions: buildAutonomyStopConditions(),
    delta_merge_policy: buildAutonomyDeltaMergePolicy({
      policy_id: `autonomy_delta_merge_policy.${scopeKey}.route_preview.v0.1`,
    }),
    review_escalation_policy: buildAutonomyReviewEscalationPolicy({
      escalation_id: `autonomy_review_escalation_policy.${scopeKey}.route_preview.v0.1`,
    }),
    output_policy: buildAutonomyOutputPolicy({
      output_surfaces: [
        "manual_operator_review",
        "future_agent_workplane_preview",
      ],
    }),
    staleness_policy: {
      policy_id: `autonomy_staleness_policy.${scopeKey}.route_preview.v0.1`,
      fresh_snapshot_required: true,
      stale_context_blocks_future_run: true,
      stale_guide_brief_requires_review: true,
      stale_handoff_capsule_requires_review: true,
      refresh_required_sources: [
        "GuideBrief",
        "Handoff Capsule",
        "Codex Launch Card",
        "Current Working Perspective",
        "Delta Projection",
      ],
      notes: [
        "Stale route-composed context requires review before any future autonomous run.",
      ],
    },
    validation_policy: {
      policy_id: `autonomy_validation_policy.${scopeKey}.route_preview.v0.1`,
      required_checks: [
        "npm run typecheck",
        "npm run smoke:autonomy-contract-v0-1",
        "npm run smoke:autonomy-contract-route-v0-1",
      ],
      optional_checks: [
        "Prior Phase 1-7 smokes when changed-file allowlists are in scope.",
      ],
      skipped_check_policy: [
        "Skipped checks must be reported with concrete reasons.",
        "Skipped required checks block future autonomy.",
      ],
      failed_check_policy: ["Failed required checks block future autonomy."],
      validation_notes: [
        "Validation is report context only and does not create proof/evidence.",
      ],
    },
    run_preview: buildAutonomyRunPreview({
      preview_id: `autonomy_run_preview.${scopeKey}.route_preview.v0.1`,
      title: "Autonomy Contract route preview",
      planned_steps: [
        "Read GuideBrief, Handoff Capsule, Codex Launch Card, Current Working Perspective, and Delta Projection refs.",
        "Summarize bounded context and rank candidate deltas for manual review.",
        "Prepare review packet and draft report preview.",
      ],
      blocked_steps: [
        "run_codex",
        "open_pr",
        "call_github",
        "call_openai_or_provider",
        "write_memory",
        "apply_project_perspective",
        "record_proof",
        "create_evidence",
        "schedule_run",
        "send_handoff",
        "publish_external",
        "start_background_work",
      ],
      not_implemented_notes: [
        "AutonomyRunPreview is not background work.",
        "No runner, scheduler, daemon, background job, active runner, active schedule, or active execution exists in Phase 8B.",
        "Future runner requires separate Phase 9 scope and explicit approval.",
      ],
      status: "preview_only",
    }),
    source_refs: {
      guide_brief_refs: [guideBriefRef],
      handoff_capsule_refs: [handoffCapsule.capsule_id],
      codex_launch_card_refs: [codexLaunchCard.launch_card_id],
      current_working_perspective_refs: [
        guideBrief.source_refs.current_working_perspective_ref,
      ],
      delta_projection_refs: [guideBrief.source_refs.delta_projection_ref],
      workplane_refs: [guideBrief.source_refs.workplane_ref],
      delta_ids: guideBrief.source_refs.delta_ids,
      batch_ids: guideBrief.source_refs.batch_ids,
      evidence_refs: uniqueSorted([
        ...guideBrief.source_refs.evidence_refs,
        ...handoffCapsule.source_refs.evidence_refs,
        ...codexLaunchCard.source_refs.evidence_refs,
      ]),
      artifact_refs: uniqueSorted([
        ...guideBrief.source_refs.artifact_refs,
        ...handoffCapsule.source_refs.artifact_refs,
        ...codexLaunchCard.source_refs.artifact_refs,
      ]),
      handoff_refs: uniqueSorted([
        ...guideBrief.source_refs.handoff_refs,
        ...handoffCapsule.source_refs.handoff_refs,
        ...codexLaunchCard.source_refs.handoff_refs,
      ]),
      diagnostic_refs: uniqueSorted([
        ...guideBrief.source_refs.diagnostic_refs,
        ...handoffCapsule.source_refs.diagnostic_refs,
        ...codexLaunchCard.source_refs.diagnostic_refs,
      ]),
      route_refs: [
        "GET /api/augnes/read/autonomy-contract?scope=project:augnes",
        "GET /api/augnes/read/guide-brief?scope=project:augnes",
        "GET /api/augnes/read/handoff-capsule?scope=project:augnes&target=codex_handoff",
        "GET /api/augnes/read/codex-launch-card?scope=project:augnes",
      ],
      docs_refs: [
        "docs/AUTONOMY_CONTRACT_V0_1.md",
        "docs/GUIDEBRIEF_CONTRACT_V0_1.md",
        "docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md",
        "docs/CODEX_HANDOFF_CAPSULE_CONSUMPTION_V0_1.md",
        "docs/AUGNES_DELTA_CONTRACT_V0_1.md",
        "docs/AUTHORITY_MATRIX.md",
        "docs/AGENT_WORKPLANE_V0_1.md",
      ],
      repo_refs: ["hynk-studio/augnes"],
    },
    gaps: buildRouteContractGaps(guideBrief),
    public_safety: {
      fixture_kind: "runtime_preview",
      contains_private_conversation: false,
      contains_hidden_reasoning: false,
      contains_local_private_paths: false,
      contains_secrets_or_tokens: false,
      contains_raw_provider_output: false,
      contains_raw_retrieval_output: false,
      contains_real_account_artifacts: false,
      notes: [
        "No private conversation.",
        "No hidden reasoning.",
        "No local private paths.",
        "No secrets/tokens.",
        "No raw provider output.",
        "No raw retrieval output.",
        "No real account artifacts.",
        "Route response is preview-only Autonomy Contract data.",
      ],
    },
    next_phase_notes: [
      "Phase 8B adds a GET-only local read-only Autonomy Contract preview route.",
      "Phase 8C Web preview UI is deferred.",
      "Phase 8D ChatGPT App/MCP read-only tool is deferred.",
      "Phase 8E Codex skill alignment is deferred.",
      "Phase 8F copy/export preview is deferred.",
      "Future Phase 9 runner requires separate explicit scope and approval.",
    ],
  };
}

export function buildAutonomyContractRouteSourceStatus({
  guideBrief,
}: {
  guideBrief: GuideBrief;
  handoffCapsuleResponse?: HandoffCapsuleRouteResponse;
  codexLaunchCardResponse?: CodexLaunchCardRouteResponse;
}): AutonomyContractRouteSourceStatus {
  return {
    guide_brief:
      guideBrief.gaps.length > 0
        ? "runtime_read_model_with_source_gaps"
        : "runtime_read_model",
    handoff_capsule: "route_composed_preview",
    codex_launch_card: "route_composed_preview",
    autonomy_contract: "route_composed_preview",
    budget: "synthetic_operator_supplied_preview_defaults",
    delta_merge_policy: "phase_8a_default_no_auto_apply_policy",
    run_preview: "preview_only_no_runner",
    source_disclosure:
      "This is preview contract data, not active autonomy state.",
    synthetic_operator_supplied_fields: [
      "title",
      "goal",
      "autonomy_mode",
      "allowed_agents",
      "allowed_surfaces",
      "budget",
      "reporting_cadence",
      "run_preview",
    ],
  };
}

export function buildAutonomyContractRouteWarnings({
  guideBrief,
  handoffCapsuleResponse,
  codexLaunchCardResponse,
}: {
  guideBrief: GuideBrief;
  handoffCapsuleResponse?: HandoffCapsuleRouteResponse;
  codexLaunchCardResponse?: CodexLaunchCardRouteResponse;
}): string[] {
  return uniqueSorted([
    ...guideBrief.staleness_warnings.map((warning) => warning.summary),
    ...(handoffCapsuleResponse?.warnings ?? []),
    ...(codexLaunchCardResponse?.warnings ?? []),
    "Autonomy Contract route output is preview JSON only.",
    "Route-composed budget/operator fields are synthetic preview defaults and do not grant active delegation approval.",
    "The route does not run autonomy, schedule autonomy, launch Codex, send handoffs, write proof/evidence, mutate state, or call providers/GitHub.",
  ]);
}

function buildAutonomyContractRouteGaps({
  guideBrief,
  handoffCapsuleResponse,
  codexLaunchCardResponse,
  contract,
}: {
  guideBrief: GuideBrief;
  handoffCapsuleResponse?: HandoffCapsuleRouteResponse;
  codexLaunchCardResponse?: CodexLaunchCardRouteResponse;
  contract: AutonomyContract;
}): string[] {
  return uniqueSorted([
    ...guideBrief.gaps.map((gap) => gap.summary),
    ...(handoffCapsuleResponse?.gaps ?? []),
    ...(codexLaunchCardResponse?.gaps ?? []),
    ...contract.gaps.map((gap) => gap.summary),
    "Route-composed budget fields are preview defaults; operator budget review is required before any future autonomy.",
  ]);
}

function buildRouteContractGaps(guideBrief: GuideBrief): AutonomyGap[] {
  const sourceGaps = guideBrief.gaps.map((gap) => ({
    code: `guide_brief.${gap.code}`,
    severity: normalizeGapSeverity(gap.severity),
    summary: gap.summary,
    source_refs: [...gap.source_refs],
    blocks_future_runner: true,
  }));

  return [
    ...sourceGaps,
    {
      code: "route_preview_synthetic_budget",
      severity: "high",
      summary:
        "Budget fields are route-composed preview defaults; operator budget review is required before any future autonomy.",
      source_refs: ["AutonomyBudget"],
      blocks_future_runner: true,
    },
    {
      code: "phase_9_runner_not_scoped",
      severity: "medium",
      summary:
        "Future runner implementation is intentionally deferred outside Phase 8B.",
      source_refs: ["docs/AUTONOMY_CONTRACT_V0_1.md"],
      blocks_future_runner: true,
    },
  ];
}

function validateScope(url: URL): ScopeValidationResult {
  const requestedScope = url.searchParams.get("scope");
  if (!requestedScope) {
    return scopeOrMarkerReadRouteError("missing_scope", 400);
  }

  if (
    requestedScope !== AUTONOMY_CONTRACT_ROUTE_SCOPE ||
    requestedScope !== GUIDE_BRIEF_ROUTE_SCOPE
  ) {
    return scopeOrMarkerReadRouteError("invalid_scope", 400);
  }

  return { ok: true };
}

function validateLocalMarker(request: Request): LocalMarkerValidationResult {
  const marker = request.headers.get(AUTONOMY_CONTRACT_LOCAL_READONLY_HEADER);
  if (!marker) {
    return scopeOrMarkerReadRouteError("missing_marker", 403);
  }

  if (marker !== AUTONOMY_CONTRACT_LOCAL_READONLY_VALUE) {
    return scopeOrMarkerReadRouteError("invalid_marker", 403);
  }

  return { ok: true };
}

function autonomyContractReadRouteError(
  code: AutonomyContractReadErrorCode,
  status: AutonomyContractReadErrorStatus,
): Extract<AutonomyContractReadValidationResult, { ok: false }> {
  return {
    ok: false,
    code,
    status,
    authority_boundary: [...AUTONOMY_CONTRACT_ROUTE_AUTHORITY_BOUNDARY],
  };
}

function scopeOrMarkerReadRouteError<
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
    authority_boundary: [...AUTONOMY_CONTRACT_ROUTE_AUTHORITY_BOUNDARY],
  };
}

function normalizeGapSeverity(
  severity: GuideBriefGapSeverity,
): AutonomyGap["severity"] {
  return severity === "high" ? "high" : severity === "medium" ? "medium" : "low";
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}
