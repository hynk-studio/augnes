import autonomyRunnerPreflightSample from "@/fixtures/autonomy-runner-preflight.sample.v0.1.json";
import {
  AUTONOMY_RUNNER_PREFLIGHT_ROUTE_AUTHORITY_BOUNDARY,
  AUTONOMY_RUNNER_PREFLIGHT_ROUTE_SCOPE,
  readAutonomyRunnerPreflightForRoute,
  type AutonomyRunnerPreflightRouteResponse,
  type AutonomyRunnerPreflightRouteSourceStatus,
} from "@/lib/autonomy/autonomy-runner-preflight-source";
import type {
  AutonomyDryRunPlan,
  AutonomyRunnerPreflight,
} from "@/types/autonomy-runner";

export const AUTONOMY_RUNNER_PREFLIGHT_WEB_PREVIEW_SOURCE =
  "phase_9b_route_source" as const;
export const AUTONOMY_RUNNER_PREFLIGHT_WEB_PUBLIC_SAFE_FALLBACK_SOURCE =
  "public_safe_fixture_fallback" as const;

export type AutonomyRunnerPreflightWebSource =
  | typeof AUTONOMY_RUNNER_PREFLIGHT_WEB_PREVIEW_SOURCE
  | typeof AUTONOMY_RUNNER_PREFLIGHT_WEB_PUBLIC_SAFE_FALLBACK_SOURCE;

export type AutonomyRunnerPreflightWebSourceStatus =
  AutonomyRunnerPreflightRouteSourceStatus & {
    source: AutonomyRunnerPreflightWebSource;
  };

export type AutonomyRunnerPreflightPreviewForWeb = {
  preflight: AutonomyRunnerPreflight;
  dry_run_plan: AutonomyDryRunPlan;
  readiness: AutonomyRunnerPreflight["readiness"];
  blockers: AutonomyRunnerPreflight["blockers"];
  warnings: AutonomyRunnerPreflight["warnings"];
  source_refs: AutonomyRunnerPreflight["source_refs"];
  authority_boundary: AutonomyRunnerPreflight["authority_boundary"];
  public_safety: AutonomyRunnerPreflight["public_safety"];
  source_status: AutonomyRunnerPreflightWebSourceStatus;
  route_refs: string[];
  docs_refs: string[];
  boundary_notes: string[];
  route_notes: string[];
  fallback_reasons: string[];
};

const SAMPLE_PREFLIGHT =
  autonomyRunnerPreflightSample as unknown as AutonomyRunnerPreflight;

const WEB_PREVIEW_BOUNDARY_NOTES = [
  "Read-only Agent Workplane Autonomy Runner Preflight preview display only.",
  "No runner starts.",
  "No scheduler starts.",
  "No daemon starts.",
  "No background work starts.",
  "No Codex execution.",
  "No GitHub/provider/OpenAI call.",
  "No DB write.",
  "No proof/evidence write.",
  "No memory mutation.",
  "No durable Perspective apply.",
  "No handoff send.",
  "No branch/PR creation.",
  "No auto-apply.",
  "No external side effect.",
  "No file download/export-to-disk.",
  "Dry-run plan remains dry_run_only and every planned step has would_execute false.",
] as const;

export function readAutonomyRunnerPreflightPreviewForWeb(): AutonomyRunnerPreflightPreviewForWeb {
  try {
    const routeResponse = readAutonomyRunnerPreflightForRoute({
      scope: AUTONOMY_RUNNER_PREFLIGHT_ROUTE_SCOPE,
    });

    return buildWebPreviewFromRouteResponse(routeResponse);
  } catch {
    return buildPublicSafeAutonomyRunnerPreflightPreviewFallback(
      "Phase 9B route-source composition was unavailable to this Web render, so the committed public-safe preflight fixture is displayed.",
    );
  }
}

export function buildPublicSafeAutonomyRunnerPreflightPreviewFallback(
  reason: string,
): AutonomyRunnerPreflightPreviewForWeb {
  const preflight = normalizePreflightForWeb(SAMPLE_PREFLIGHT);

  return {
    preflight,
    dry_run_plan: preflight.dry_run_plan,
    readiness: preflight.readiness,
    blockers: preflight.blockers,
    warnings: [
      ...preflight.warnings,
      {
        warning_id: "warning.phase_9c_public_safe_fallback",
        kind: "phase_boundary",
        severity: "medium",
        summary:
          "Agent Workplane is showing public-safe Autonomy Runner Preflight fixture data, not active autonomy state.",
        source_refs: ["fixtures/autonomy-runner-preflight.sample.v0.1.json"],
        review_hint:
          "Use this as preview structure only; future live-source composition remains separately scoped.",
      },
    ],
    source_refs: preflight.source_refs,
    authority_boundary: preflight.authority_boundary,
    public_safety: preflight.public_safety,
    source_status: {
      source: AUTONOMY_RUNNER_PREFLIGHT_WEB_PUBLIC_SAFE_FALLBACK_SOURCE,
      autonomy_contract: "public_safe_fixture_fallback",
      autonomy_runner_preflight: "public_safe_fixture_fallback",
      dry_run_plan: "dry_run_only_fixture",
      source_disclosure:
        "Web preview is using committed public-safe Autonomy Runner Preflight fixture data and is not displaying active autonomy state.",
      synthetic_operator_supplied_fields: [
        "preflight_id",
        "dry_run_id",
        "readiness_review_notes",
      ],
    },
    route_refs: [
      "/api/augnes/read/autonomy-runner-preflight?scope=project:augnes",
    ],
    docs_refs: [
      "docs/AUTONOMY_RUNNER_PREFLIGHT_V0_1.md",
      "docs/AUTHORITY_MATRIX.md",
      "docs/AGENT_WORKPLANE_V0_1.md",
    ],
    boundary_notes: [...WEB_PREVIEW_BOUNDARY_NOTES],
    route_notes: [
      "Public-safe fallback is display-only.",
      "Dry-run plan status remains dry_run_only.",
      "Every planned step has would_execute false.",
    ],
    fallback_reasons: [reason],
  };
}

function buildWebPreviewFromRouteResponse(
  routeResponse: AutonomyRunnerPreflightRouteResponse,
): AutonomyRunnerPreflightPreviewForWeb {
  const preflight = normalizePreflightForWeb(routeResponse.preflight);

  return {
    preflight,
    dry_run_plan: preflight.dry_run_plan,
    readiness: preflight.readiness,
    blockers: preflight.blockers,
    warnings: preflight.warnings,
    source_refs: preflight.source_refs,
    authority_boundary: preflight.authority_boundary,
    public_safety: preflight.public_safety,
    source_status: {
      source: AUTONOMY_RUNNER_PREFLIGHT_WEB_PREVIEW_SOURCE,
      ...routeResponse.source_status,
    },
    route_refs: [
      ...routeResponse.source_refs.route_refs,
      "GET /api/augnes/read/autonomy-runner-preflight?scope=project:augnes",
    ],
    docs_refs: [
      ...routeResponse.source_refs.docs_refs,
      "docs/AGENT_WORKPLANE_V0_1.md",
    ],
    boundary_notes: [
      ...WEB_PREVIEW_BOUNDARY_NOTES,
      ...AUTONOMY_RUNNER_PREFLIGHT_ROUTE_AUTHORITY_BOUNDARY,
    ],
    route_notes: routeResponse.route_notes,
    fallback_reasons: [],
  };
}

function normalizePreflightForWeb(
  preflight: AutonomyRunnerPreflight,
): AutonomyRunnerPreflight {
  return {
    ...preflight,
    dry_run_plan: {
      ...preflight.dry_run_plan,
      status: "dry_run_only",
      planned_steps: preflight.dry_run_plan.planned_steps.map((step) => ({
        ...step,
        would_execute: false,
      })),
      budget_projection: {
        ...preflight.dry_run_plan.budget_projection,
        would_spend_budget: false,
      },
      no_run_boundary: preflight.dry_run_plan.no_run_boundary,
    },
    authority_boundary: preflight.authority_boundary,
    public_safety: {
      ...preflight.public_safety,
      contains_private_conversation: false,
      contains_hidden_reasoning: false,
      contains_local_private_paths: false,
      contains_secrets_or_tokens: false,
      contains_raw_provider_output: false,
      contains_raw_retrieval_output: false,
      contains_real_account_artifacts: false,
    },
  };
}
