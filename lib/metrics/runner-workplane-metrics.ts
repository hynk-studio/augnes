import { buildGuideWorkplaneDebugContext } from "@/lib/guide/guide-workplane-debug-context";
import {
  buildWorkplaneIntentProjection,
  WORKPLANE_INTENT_PROJECTION_DEFAULT_INPUT,
} from "@/lib/guide/workplane-intent-projection";
import { readWorkplaneContext } from "@/lib/workplane/read-workplane-context";
import { buildAgentWorkplaneNodeContextRead } from "@/lib/workplane/workplane-node-context";
import { getAutonomyRun, listAutonomyRuns } from "@/lib/autonomy/runner";
import type { AutonomyRunRecord } from "@/types/autonomy-runner-execution";
import type {
  AugnesMetricAuthorityBoundary,
  AugnesMetricStatus,
  AugnesMetricTrend,
  AugnesWorkflowMetric,
  AugnesWorkflowMetricGroup,
  AugnesWorkflowMetricGroupId,
  AugnesWorkflowMetricId,
  AugnesWorkflowMetricsInput,
  AugnesWorkflowMetricsRead,
  DogfoodReadinessMetrics,
  GuideBriefProjectionMetrics,
  LegacyCockpitReadinessMetrics,
  RunnerWorkflowMetrics,
  WorkplaneReviewMetrics,
} from "@/types/augnes-workflow-metrics";
import {
  AUGNES_WORKFLOW_CORE_METRIC_IDS,
  AUGNES_WORKFLOW_METRIC_GROUP_IDS,
  AUGNES_WORKFLOW_METRICS_VERSION,
  RUNNER_WORKFLOW_METRIC_IDS,
  WORKPLANE_GUIDEBRIEF_METRIC_IDS,
} from "@/types/augnes-workflow-metrics";

const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z";
const DEFAULT_SCOPE = "project:augnes";
const DEFAULT_LIMIT = 100;
const FORBIDDEN_ACTION_ATTEMPT_WINDOW = 96;

const AUTHORITY_KEYWORD_PATTERN =
  /\b(provider|openai|github|codex|execute|schedule|recover|apply|proof|evidence|memory|perspective|merge|publish|deploy|replay|retry)\b/gi;

const ATTEMPT_OR_VIOLATION_MARKER_PATTERN =
  /\b(attempted|attempt|forbidden|unauthorized|disallowed|denied|blocked_by_authority|authority_violation|forbidden_action_attempt|attempted_forbidden_action)\b/gi;

const SAFE_BOUNDARY_DISCLOSURE_PATTERNS = [
  /\bscheduled run recorded; it will execute only when the local runner or scheduler is explicitly invoked\b/i,
  /\bdoes not\b.{0,96}\b(provider|openai|github|codex|execute|schedule|recover|apply|proof|evidence|memory|perspective|merge|publish|deploy|replay|retry)\b/i,
  /\bnot\b.{0,96}\b(provider|openai|github|codex|execute|schedule|recover|apply|proof|evidence|memory|perspective|merge|publish|deploy|replay|retry)\b/i,
  /\bwithout\b.{0,96}\b(provider|openai|github|codex|execute|schedule|recover|apply|proof|evidence|memory|perspective|merge|publish|deploy|replay|retry)\b/i,
  /\bno\b.{0,96}\b(provider|openai|github|codex|execute|schedule|recover|apply|proof|evidence|memory|perspective|merge|publish|deploy|replay|retry)\b/i,
  /\b(provider|openai|github|codex|execute|schedule|recover|apply|proof|evidence|memory|perspective|merge|publish|deploy|replay|retry)\b.{0,96}\bfalse\b/i,
  /\bfalse\b.{0,96}\b(provider|openai|github|codex|execute|schedule|recover|apply|proof|evidence|memory|perspective|merge|publish|deploy|replay|retry)\b/i,
];

export const RUNNER_WORKPLANE_METRIC_GROUPS =
  AUGNES_WORKFLOW_METRIC_GROUP_IDS;

export const RUNNER_WORKPLANE_CORE_METRIC_IDS =
  AUGNES_WORKFLOW_CORE_METRIC_IDS;

export const RUNNER_WORKPLANE_RUNNER_METRIC_IDS =
  RUNNER_WORKFLOW_METRIC_IDS;

export const RUNNER_WORKPLANE_GUIDEBRIEF_METRIC_IDS =
  WORKPLANE_GUIDEBRIEF_METRIC_IDS;

export const RUNNER_WORKPLANE_METRICS_DOC_REFS = [
  "docs/AUGNES_WORKFLOW_METRICS_V0_1.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/GUIDEBRIEF_INTENT_PROJECTION_V0_1.md",
  "docs/AGENT_WORKPLANE_COCKPIT_CAPABILITY_INVENTORY_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
] as const;

export const RUNNER_WORKPLANE_METRICS_SMOKE_REFS = [
  "smoke:runner-workplane-metrics-v0-1",
  "smoke:guidebrief-intent-projection-v0-1",
  "smoke:guide-workplane-debug-context-v0-1",
  "smoke:workplane-runner-deltabatch-integration-v0-1",
] as const;

export const RUNNER_WORKPLANE_METRICS_AUTHORITY_BOUNDARY: AugnesMetricAuthorityBoundary =
  {
    surface: "runner_workplane_metrics",
    read_only_metrics: true,
    metrics_are_authority: false,
    can_write_db: false,
    can_write_runner_ledger: false,
    can_record_proof: false,
    can_create_evidence: false,
    can_update_work: false,
    can_mutate_memory: false,
    can_apply_project_perspective: false,
    can_apply_durable_memory: false,
    can_auto_apply_delta: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_actuate_github: false,
    can_execute_codex: false,
    can_execute_runner: false,
    can_schedule_runner: false,
    can_recover_delta_batch: false,
    can_create_branch_or_pr: false,
    can_send_handoff: false,
    can_merge_publish_retry_replay_deploy: false,
    can_delete_legacy_cockpit: false,
    notes: [
      "Runner / Workplane metrics are read-only signals, not execution authority or auto-apply decisions.",
      "The metrics helper does not create runs, tick runs, recover DeltaBatches, schedule runners, call providers/OpenAI/GitHub/Codex, write DB state, write runner ledger records, write proof/evidence, mutate memory, apply Perspective, auto-apply deltas, send handoffs, create branches, open PRs, merge, publish, retry, replay, deploy, or delete Legacy Cockpit.",
    ],
  };

export async function readRunnerWorkplaneMetrics(
  options: AugnesWorkflowMetricsInput = {},
): Promise<AugnesWorkflowMetricsRead> {
  const workplaneContext =
    options.workplane_context ?? (await readWorkplaneContext());
  const nodeContextRead =
    options.node_context_read ??
    buildAgentWorkplaneNodeContextRead(workplaneContext);
  const debugContext =
    options.debug_context ??
    buildGuideWorkplaneDebugContext({
      node_context_read: nodeContextRead,
      selection: {
        selected_panel_id:
          WORKPLANE_INTENT_PROJECTION_DEFAULT_INPUT.selected_panel_id,
        selected_node_id:
          WORKPLANE_INTENT_PROJECTION_DEFAULT_INPUT.selected_node_id,
        debug_question:
          WORKPLANE_INTENT_PROJECTION_DEFAULT_INPUT.debug_question,
      },
    });
  const intentProjection =
    options.intent_projection ??
    buildWorkplaneIntentProjection({
      ...WORKPLANE_INTENT_PROJECTION_DEFAULT_INPUT,
      node_context_read: nodeContextRead,
      debug_context: debugContext,
      now: options.now,
    });
  const runnerRuns =
    options.runner_runs ??
    (options.dbPath
      ? readRunnerRunsForMetrics({
          dbPath: options.dbPath,
          scope: options.scope ?? workplaneContext.overview.scope,
          limit: options.limit ?? DEFAULT_LIMIT,
        })
      : []);

  return buildRunnerWorkplaneMetrics({
    ...options,
    scope: options.scope ?? workplaneContext.overview.scope,
    runner_runs: runnerRuns,
    workplane_context: workplaneContext,
    node_context_read: nodeContextRead,
    debug_context: debugContext,
    intent_projection: intentProjection,
  });
}

export function buildEmptyRunnerWorkplaneMetrics(
  options: AugnesWorkflowMetricsInput = {},
): AugnesWorkflowMetricsRead {
  return buildRunnerWorkplaneMetrics({
    ...options,
    runner_runs: options.runner_runs ?? [],
  });
}

export function buildRunnerWorkplaneMetrics(
  input: AugnesWorkflowMetricsInput = {},
): AugnesWorkflowMetricsRead {
  const scope =
    input.scope ??
    input.workplane_context?.overview.scope ??
    input.node_context_read?.scope ??
    DEFAULT_SCOPE;
  const asOf =
    input.now ??
    input.intent_projection?.created_at ??
    input.debug_context?.as_of ??
    input.node_context_read?.as_of ??
    FALLBACK_AS_OF;
  const runs = input.runner_runs ?? [];
  const runnerMetrics = buildRunnerMetrics({ runs });
  const workplaneMetrics = buildWorkplaneMetrics(input);
  const guidebriefMetrics = buildGuideBriefMetrics(input);
  const legacyMetrics = buildLegacyCockpitMetrics(input);
  const dogfoodMetrics = buildDogfoodReadinessMetrics({
    runnerMetrics,
    workplaneMetrics,
    input,
  });
  const coreMetrics = [
    guidebriefMetrics.handoff_loss_rate,
    dogfoodMetrics.resume_latency_signal,
    workplaneMetrics.perspective_delta_quality_signal,
    workplaneMetrics.review_burden_signal,
    dogfoodMetrics.autonomy_yield_signal,
    workplaneMetrics.stale_context_incident_count,
    dogfoodMetrics.delta_noise_signal,
    dogfoodMetrics.research_integration_yield_signal,
  ];
  const groups = buildMetricGroups({
    runnerMetrics,
    workplaneMetrics,
    guidebriefMetrics,
    legacyMetrics,
    dogfoodMetrics,
  });
  const allMetrics = groups.flatMap((group) => group.metrics);
  const status = summarizeStatus(allMetrics);
  const sourceRefs = uniqueStrings([
    ...RUNNER_WORKPLANE_METRICS_DOC_REFS,
    ...(input.workplane_context?.workplane_notes ?? []),
    ...(input.node_context_read?.source_refs ?? []),
    ...(input.debug_context?.source_refs ?? []),
    ...(input.intent_projection?.source_refs ?? []),
  ]);
  const caveats = uniqueStrings([
    ...(runs.length === 0
      ? [
          "Runner ledger run metrics have insufficient data because no runner_runs fixture or dbPath readback was supplied.",
        ]
      : []),
    ...allMetrics.flatMap((metric) => metric.caveats),
  ]);

  return {
    metrics_version: AUGNES_WORKFLOW_METRICS_VERSION,
    scope,
    as_of: asOf,
    status,
    summary: buildSummary({ status, groups, legacyMetrics, dogfoodMetrics }),
    groups,
    core_metrics: coreMetrics,
    runner_metrics: runnerMetrics,
    workplane_review_metrics: workplaneMetrics,
    guidebrief_projection_metrics: guidebriefMetrics,
    legacy_cockpit_readiness_metrics: legacyMetrics,
    dogfood_readiness_metrics: dogfoodMetrics,
    source_refs: sourceRefs,
    caveats,
    validation_summary: {
      status: "partial",
      smoke_refs: [...RUNNER_WORKPLANE_METRICS_SMOKE_REFS],
      docs_refs: [...RUNNER_WORKPLANE_METRICS_DOC_REFS],
      notes: [
        "Metrics compute read-only signals and do not run validation.",
        "smoke:runner-workplane-metrics-v0-1 validates deterministic fixture calculations, empty state behavior, Workplane panel wiring, and authority boundaries.",
      ],
    },
    authority_boundary: RUNNER_WORKPLANE_METRICS_AUTHORITY_BOUNDARY,
    recommended_next_review:
      legacyMetrics.shrink_readiness_status === "healthy"
        ? "Legacy Cockpit Shrink Plan v0.1 can be reviewed after a metrics baseline confirms native absorption is stable."
        : "Longer Augnes-on-Augnes Dogfood v0.1 is recommended before shrinking Legacy Cockpit compatibility.",
  };
}

function readRunnerRunsForMetrics({
  dbPath,
  scope,
  limit,
}: {
  dbPath: string;
  scope: string;
  limit: number;
}): AutonomyRunRecord[] {
  const summaries = listAutonomyRuns({ dbPath, scope, limit });
  return summaries
    .map((run) => getAutonomyRun(run.run_id, { dbPath }))
    .filter((run): run is AutonomyRunRecord => Boolean(run));
}

function buildRunnerMetrics({
  runs,
}: {
  runs: AutonomyRunRecord[];
}): RunnerWorkflowMetrics {
  const totalRuns = runs.length;
  const completedRuns = runs.filter((run) => run.status === "completed");
  const scheduledRuns = runs.filter((run) => isScheduledRun(run));
  const completedScheduledRuns = scheduledRuns.filter(
    (run) => run.status === "completed",
  );
  const recoveryDenominatorRuns = runs.filter((run) =>
    ["completed", "needs_review", "blocked"].includes(run.status),
  );
  const recoveredRuns = recoveryDenominatorRuns.filter(
    (run) => run.delta_batches.length > 0,
  );
  const cancelledRuns = runs.filter((run) => run.status === "cancelled");
  const safeCancelledRuns = cancelledRuns.filter(
    (run) => !run.steps.some((step) => step.status === "running"),
  );
  const pausedRuns = runs.filter((run) => run.status === "paused");
  const nonExecutingPausedRuns = pausedRuns.filter(
    (run) => !run.steps.some((step) => step.status === "running"),
  );
  const forbiddenActionAttempts = countForbiddenActionAttempts(runs);
  const errorRuns = runs.filter(
    (run) =>
      ["blocked", "failed"].includes(run.status) ||
      run.steps.some((step) => ["blocked", "failed"].includes(step.status)),
  );
  const durationValues = runs
    .map((run) => durationMs(run.started_at, run.finished_at))
    .filter((value): value is number => value !== null);
  const deltaBatchCount = runs.reduce(
    (count, run) => count + run.delta_batches.length,
    0,
  );
  const needsReviewRuns = runs.filter((run) => run.status === "needs_review");
  const commonRefs = ["docs/AUTONOMY_RUNNER_EXECUTION_V0_1.md"];

  return {
    group_id: "runner",
    run_completion_rate: ratioMetric({
      metric_id: "run_completion_rate",
      group_id: "runner",
      label: "Run completion rate",
      numerator: completedRuns.length,
      denominator: totalRuns,
      healthyAt: 0.8,
      watchAt: 0.5,
      summary: "Completed autonomy runs divided by total visible runs.",
      source_refs: commonRefs,
    }),
    scheduled_run_success_rate: ratioMetric({
      metric_id: "scheduled_run_success_rate",
      group_id: "runner",
      label: "Scheduled run success rate",
      numerator: completedScheduledRuns.length,
      denominator: scheduledRuns.length,
      healthyAt: 0.8,
      watchAt: 0.5,
      summary:
        "Completed scheduled runs divided by scheduled runs in the supplied readback.",
      source_refs: commonRefs,
    }),
    delta_batch_recovery_rate: ratioMetric({
      metric_id: "delta_batch_recovery_rate",
      group_id: "runner",
      label: "DeltaBatch recovery rate",
      numerator: recoveredRuns.length,
      denominator: recoveryDenominatorRuns.length,
      healthyAt: 0.7,
      watchAt: 0.4,
      summary:
        "Completed, needs-review, or blocked runs with recovered DeltaBatches.",
      source_refs: [
        ...commonRefs,
        "docs/AGENT_WORKPLANE_RUNNER_DELTABATCH_INTEGRATION_V0_1.md",
      ],
    }),
    cancelled_run_safety_rate: ratioMetric({
      metric_id: "cancelled_run_safety_rate",
      group_id: "runner",
      label: "Cancelled run safety rate",
      numerator: safeCancelledRuns.length,
      denominator: cancelledRuns.length,
      healthyAt: 1,
      watchAt: 0.8,
      summary:
        "Cancelled runs with no currently running step in the supplied snapshot.",
      source_refs: commonRefs,
    }),
    paused_run_non_execution_rate: ratioMetric({
      metric_id: "paused_run_non_execution_rate",
      group_id: "runner",
      label: "Paused run non-execution rate",
      numerator: nonExecutingPausedRuns.length,
      denominator: pausedRuns.length,
      healthyAt: 1,
      watchAt: 0.8,
      summary:
        "Paused runs with no running steps in the supplied snapshot.",
      source_refs: commonRefs,
    }),
    forbidden_action_attempt_count: countMetric({
      metric_id: "forbidden_action_attempt_count",
      group_id: "runner",
      label: "Forbidden action attempt count",
      value: forbiddenActionAttempts,
      summary:
        "Runner events, step errors, and DeltaBatch validation notes matching forbidden authority keywords.",
      source_refs: commonRefs,
      healthyWhenZero: true,
      caveats:
        totalRuns === 0
          ? ["No runner runs were supplied, so forbidden action attempts default to zero."]
          : [],
    }),
    runner_error_rate: ratioMetric({
      metric_id: "runner_error_rate",
      group_id: "runner",
      label: "Runner error rate",
      numerator: errorRuns.length,
      denominator: totalRuns,
      healthyAt: 0,
      watchAt: 0.25,
      inverse: true,
      summary:
        "Blocked or failed runs, or runs with blocked/failed steps, divided by total runs.",
      source_refs: commonRefs,
    }),
    average_run_duration_ms: averageMetric({
      metric_id: "average_run_duration_ms",
      group_id: "runner",
      label: "Average run duration",
      values: durationValues,
      unit: "milliseconds",
      summary:
        "Average finished_at minus started_at for runs with both timestamps.",
      source_refs: commonRefs,
    }),
    average_delta_batch_count_per_run: averageMetric({
      metric_id: "average_delta_batch_count_per_run",
      group_id: "runner",
      label: "Average DeltaBatch count per run",
      values: totalRuns > 0 ? [deltaBatchCount / totalRuns] : [],
      unit: "count",
      summary: "Recovered DeltaBatch count divided by total runs.",
      source_refs: commonRefs,
    }),
    needs_review_ratio: ratioMetric({
      metric_id: "needs_review_ratio",
      group_id: "runner",
      label: "Needs-review ratio",
      numerator: needsReviewRuns.length,
      denominator: totalRuns,
      healthyAt: 0.2,
      watchAt: 0.4,
      inverse: true,
      summary: "Runs in needs_review divided by total runs.",
      source_refs: commonRefs,
    }),
  };
}

function buildWorkplaneMetrics(
  input: AugnesWorkflowMetricsInput,
): WorkplaneReviewMetrics {
  const context = input.workplane_context;
  const projectionDeltas = context?.delta_projection_read.data.deltas ?? [];
  const deltasWithEvidence = projectionDeltas.filter(
    (delta) => delta.evidence_refs.length > 0,
  );
  const reviewQueueLoad =
    context?.overview.review_queue.total_attention_count ?? null;
  const fallbackSourceCount = context
    ? Object.values(context.source_status).filter(
        (status) => status !== "runtime" && status !== "runner_ledger",
      ).length
    : null;
  const staleSourceCount = context
    ? [
        context.overview.current_perspective.staleness_status,
        input.node_context_read?.staleness.status ?? "unknown",
        context.runner_delta_batch_read.staleness.status,
      ].filter((status) => /stale|unknown|fallback/i.test(String(status)))
        .length
    : null;
  const recoveredVisible =
    context?.runner_delta_batch_read.recovered_batch_count ?? 0;

  return {
    group_id: "workplane",
    recovered_delta_batch_visibility_rate: signalMetric({
      metric_id: "recovered_delta_batch_visibility_rate",
      group_id: "workplane",
      label: "Recovered DeltaBatch visibility",
      value: context ? (recoveredVisible > 0 ? 1 : 0) : null,
      summary:
        "Whether Workplane can expose the latest recovered runner DeltaBatch readback.",
      source_refs: [
        "docs/AGENT_WORKPLANE_RUNNER_DELTABATCH_INTEGRATION_V0_1.md",
      ],
      status:
        context == null
          ? "insufficient_data"
          : recoveredVisible > 0
            ? "healthy"
            : "watch",
      caveats:
        context && recoveredVisible === 0
          ? ["No recovered runner DeltaBatch is visible in the current Workplane context."]
          : [],
    }),
    workplane_review_queue_load: countMetric({
      metric_id: "workplane_review_queue_load",
      group_id: "workplane",
      label: "Workplane review queue load",
      value: reviewQueueLoad,
      summary: "Total Workplane attention refs from the review queue summary.",
      source_refs: ["docs/AGENT_WORKPLANE_V0_1.md"],
      healthyWhenZero: true,
    }),
    workplane_fallback_source_count: countMetric({
      metric_id: "workplane_fallback_source_count",
      group_id: "stale_context",
      label: "Fallback source count",
      value: fallbackSourceCount,
      summary:
        "Workplane source_status entries that are not runtime or runner_ledger.",
      source_refs: ["docs/AGENT_WORKPLANE_V0_1.md"],
      healthyWhenZero: true,
    }),
    workplane_stale_source_count: countMetric({
      metric_id: "workplane_stale_source_count",
      group_id: "stale_context",
      label: "Stale source count",
      value: staleSourceCount,
      summary:
        "Stale, unknown, or fallback staleness signals visible in Workplane context.",
      source_refs: ["docs/AGENT_WORKPLANE_V0_1.md"],
      healthyWhenZero: true,
    }),
    review_burden_signal: countMetric({
      metric_id: "review_burden_signal",
      group_id: "workplane",
      label: "Review burden signal",
      value: reviewQueueLoad,
      summary:
        "Review load proxy: lower Workplane attention count means lower review burden.",
      source_refs: ["docs/AGENT_WORKPLANE_V0_1.md"],
      healthyWhenZero: true,
    }),
    stale_context_incident_count: countMetric({
      metric_id: "stale_context_incident_count",
      group_id: "stale_context",
      label: "Stale context incidents",
      value:
        staleSourceCount === null || fallbackSourceCount === null
          ? null
          : staleSourceCount + fallbackSourceCount,
      summary:
        "Combined stale and fallback context signals that should be visible before shrink decisions.",
      source_refs: ["docs/AGENT_WORKPLANE_V0_1.md"],
      healthyWhenZero: true,
    }),
    perspective_delta_quality_signal: ratioMetric({
      metric_id: "perspective_delta_quality_signal",
      group_id: "workplane",
      label: "Perspective delta quality signal",
      numerator: deltasWithEvidence.length,
      denominator: projectionDeltas.length,
      healthyAt: 0.6,
      watchAt: 0.3,
      summary:
        "Projected Delta Projection deltas with evidence refs divided by projected deltas.",
      source_refs: ["docs/AGENT_WORKPLANE_V0_1.md"],
    }),
  };
}

function buildGuideBriefMetrics(
  input: AugnesWorkflowMetricsInput,
): GuideBriefProjectionMetrics {
  const debugContext = input.debug_context;
  const intentProjection = input.intent_projection;
  const nodeContextRead = input.node_context_read;
  const identityHealthy = hasDistinctDeltaBatchIdentities(nodeContextRead);
  const handoffCandidates = intentProjection?.candidate_handoffs ?? [];
  const blockedHandoffs = handoffCandidates.filter(
    (candidate) => candidate.status === "blocked",
  );

  return {
    group_id: "guidebrief",
    intent_projection_reversibility_signal: signalMetric({
      metric_id: "intent_projection_reversibility_signal",
      group_id: "guidebrief",
      label: "Intent projection reversibility",
      value:
        intentProjection?.reversibility.reversible &&
        intentProjection.reversibility.dismissible &&
        intentProjection.reversibility.durable_state_changed === false
          ? 1
          : intentProjection
            ? 0
            : null,
      status:
        intentProjection == null
          ? "insufficient_data"
          : intentProjection.reversibility.reversible &&
              intentProjection.reversibility.dismissible &&
              intentProjection.reversibility.durable_state_changed === false
            ? "healthy"
            : "blocked",
      summary:
        "Intent Projection is reversible, dismissible, durable_state_changed false, and non-executable.",
      source_refs: ["docs/GUIDEBRIEF_INTENT_PROJECTION_V0_1.md"],
    }),
    guidebrief_debug_context_coverage_signal: signalMetric({
      metric_id: "guidebrief_debug_context_coverage_signal",
      group_id: "guidebrief",
      label: "GuideBrief debug coverage",
      value: debugContext
        ? debugContext.observed.length > 0 &&
          debugContext.inferred.length > 0 &&
          debugContext.suggested.length > 0 &&
          Array.isArray(debugContext.needs_user_judgment)
          ? 1
          : 0
        : null,
      status:
        debugContext == null
          ? "insufficient_data"
          : debugContext.observed.length > 0 &&
              debugContext.inferred.length > 0 &&
              debugContext.suggested.length > 0
            ? "healthy"
            : "watch",
      summary:
        "Debug context covers observed, inferred, suggested, and needs-user-judgment sections.",
      source_refs: ["docs/GUIDEBRIEF_WORKPLANE_DEBUG_CONTEXT_V0_1.md"],
    }),
    projected_vs_recovered_deltabatch_identity_signal: signalMetric({
      metric_id: "projected_vs_recovered_deltabatch_identity_signal",
      group_id: "guidebrief",
      label: "Projected vs recovered DeltaBatch identity",
      value: identityHealthy ? 1 : nodeContextRead ? 0 : null,
      status:
        nodeContextRead == null
          ? "insufficient_data"
          : identityHealthy
            ? "healthy"
            : "blocked",
      summary:
        "Checks that delta_projection, projected_delta_batch, and delta_batch remain distinct signals.",
      source_refs: [
        "docs/AGENT_WORKPLANE_NODE_CONTRACT_V0_1.md",
        "docs/AGENT_WORKPLANE_RUNNER_DELTABATCH_INTEGRATION_V0_1.md",
      ],
    }),
    handoff_loss_rate: ratioMetric({
      metric_id: "handoff_loss_rate",
      group_id: "handoff",
      label: "Handoff loss rate",
      numerator: blockedHandoffs.length,
      denominator: handoffCandidates.length,
      healthyAt: 0.1,
      watchAt: 0.3,
      inverse: true,
      summary:
        "Blocked draft handoff candidates divided by all draft handoff candidates.",
      source_refs: ["docs/GUIDEBRIEF_INTENT_PROJECTION_V0_1.md"],
    }),
  };
}

function buildLegacyCockpitMetrics(
  input: AugnesWorkflowMetricsInput,
): LegacyCockpitReadinessMetrics {
  const inventoryText = input.cockpit_inventory_text ?? "";
  const mapText = input.native_absorption_map_text ?? "";
  const zeroCountVerified =
    /unique_useful_cockpit_capability_count:\s*0/i.test(mapText) ||
    /zero_count_verified:\s*true/i.test(mapText) ||
    /Cockpit Route Removal v0\.1/i.test(mapText);
  const pendingMarkers = [
    "needs_native_absorption",
    "legacy_only_still_useful",
    "partial native replacement exists",
    "partial native replacement",
  ];
  const dependencyScore = zeroCountVerified
    ? 0
    : pendingMarkers.filter(
        (marker) => inventoryText.includes(marker) || mapText.includes(marker),
      ).length;
  const activeCockpitRouteMention = /retained compatibility route|remains reachable at \/cockpit/i.test(
    `${inventoryText}\n${mapText}`,
  );
  const hasCompatibilityPath = !zeroCountVerified && activeCockpitRouteMention;
  const status: AugnesMetricStatus =
    zeroCountVerified
      ? "healthy"
      : dependencyScore > 0 || hasCompatibilityPath
        ? "watch"
        : "unknown";
  const metric = signalMetric({
    metric_id: "cockpit_compatibility_dependency_signal",
    group_id: "cockpit_absorption",
    label: "Cockpit compatibility dependency",
    value: zeroCountVerified ? 0 : hasCompatibilityPath || dependencyScore > 0 ? 1 : null,
    status,
    summary:
      "Signals whether Legacy Cockpit compatibility remains a dependency after route-removal readiness.",
    source_refs: [
      "docs/AGENT_WORKPLANE_COCKPIT_CAPABILITY_INVENTORY_V0_1.md",
      "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
      "docs/COCKPIT_ROUTE_REMOVAL_READINESS_V0_1.md",
      "docs/COCKPIT_ROUTE_REMOVAL_V0_1.md",
    ],
    caveats:
      zeroCountVerified
        ? [
            "Route removal readiness verified unique useful Cockpit-only capability count is 0; this metric does not grant product deletion authority.",
          ]
        : dependencyScore === 0 && !hasCompatibilityPath
        ? [
            "Cockpit readiness docs were not supplied to the metrics helper; dependency status remains unknown.",
          ]
        : [
            "Compatibility dependency is a shrink-readiness signal only, not deletion authority.",
          ],
  });

  return {
    group_id: "cockpit_absorption",
    cockpit_compatibility_dependency_signal: metric,
    summary:
      status === "healthy"
        ? "Legacy Cockpit route/component removal readiness is verified; Cockpit is no longer an active Workplane dependency."
        : status === "watch"
        ? "Legacy Cockpit compatibility remains relevant; shrink should wait for a metrics baseline and explicit shrink plan."
        : "Legacy Cockpit shrink readiness is unknown until inventory and absorption data are reviewed.",
    shrink_readiness_status: status,
  };
}

function buildDogfoodReadinessMetrics({
  runnerMetrics,
  workplaneMetrics,
  input,
}: {
  runnerMetrics: RunnerWorkflowMetrics;
  workplaneMetrics: WorkplaneReviewMetrics;
  input: AugnesWorkflowMetricsInput;
}): DogfoodReadinessMetrics {
  const activeGoalCount =
    input.workplane_context?.overview.current_perspective.active_goal_count ??
    null;
  const nextCandidateCount =
    input.workplane_context?.overview.current_perspective
      .next_candidate_count ?? null;
  const recoveredDeltaCount =
    input.workplane_context?.overview.runner_delta_batch.recovered_delta_count ??
    input.runner_runs?.reduce(
      (count, run) =>
        count +
        run.delta_batches.reduce(
          (batchCount, batch) => batchCount + batch.delta_count,
          0,
        ),
      0,
    ) ??
    null;
  const totalDeltaCount =
    input.runner_runs?.reduce(
      (count, run) =>
        count +
        run.delta_batches.reduce(
          (batchCount, batch) => batchCount + batch.delta_count,
          0,
        ),
      0,
    ) ?? null;
  const blockedDeltaBatches =
    input.runner_runs?.reduce(
      (count, run) =>
        count +
        run.delta_batches.filter(
          (batch) => batch.validation.validation_status === "blocked",
        ).length,
      0,
    ) ?? null;

  const autonomyYield = cloneAsCoreMetric({
    metric: runnerMetrics.delta_batch_recovery_rate,
    metric_id: "autonomy_yield_signal",
    group_id: "dogfood_readiness",
    label: "Autonomy yield signal",
    summary:
      "Dogfood proxy derived from DeltaBatch recovery rate for reviewable runner output.",
  });
  const deltaNoise = ratioMetric({
    metric_id: "delta_noise_signal",
    group_id: "dogfood_readiness",
    label: "Delta noise signal",
    numerator: blockedDeltaBatches ?? 0,
    denominator: totalDeltaCount ?? 0,
    healthyAt: 0.1,
    watchAt: 0.3,
    inverse: true,
    summary:
      "Blocked recovered DeltaBatch count divided by recovered DeltaBatch delta count.",
    source_refs: [
      "docs/AGENT_WORKPLANE_RUNNER_DELTABATCH_INTEGRATION_V0_1.md",
    ],
  });
  const resumeLatency = signalMetric({
    metric_id: "resume_latency_signal",
    group_id: "dogfood_readiness",
    label: "Resume latency signal",
    value: activeGoalCount === null ? null : activeGoalCount,
    status:
      activeGoalCount === null
        ? "insufficient_data"
        : activeGoalCount <= 3
          ? "healthy"
          : "watch",
    summary:
      "Proxy for resume friction: fewer active goals should make the next work context easier to resume.",
    source_refs: ["docs/AGENT_WORKPLANE_V0_1.md"],
  });
  const researchYield = signalMetric({
    metric_id: "research_integration_yield_signal",
    group_id: "dogfood_readiness",
    label: "Research integration yield",
    value: nextCandidateCount,
    status:
      nextCandidateCount === null
        ? "insufficient_data"
        : nextCandidateCount > 0 || (recoveredDeltaCount ?? 0) > 0
          ? "healthy"
          : "watch",
    summary:
      "Proxy for research integration: Workplane next candidates and recovered deltas visible for review.",
    source_refs: ["docs/AGENT_WORKPLANE_V0_1.md"],
  });
  const readinessStatus = summarizeStatus([
    autonomyYield,
    deltaNoise,
    resumeLatency,
    researchYield,
    workplaneMetrics.recovered_delta_batch_visibility_rate,
  ]);

  return {
    group_id: "dogfood_readiness",
    autonomy_yield_signal: autonomyYield,
    delta_noise_signal: deltaNoise,
    resume_latency_signal: resumeLatency,
    research_integration_yield_signal: researchYield,
    summary:
      readinessStatus === "healthy"
        ? "Dogfood readiness signals are healthy enough to consider shrink planning after a sustained baseline."
        : "Dogfood readiness still needs observation before Legacy Cockpit shrink.",
    readiness_status: readinessStatus,
  };
}

function buildMetricGroups({
  runnerMetrics,
  workplaneMetrics,
  guidebriefMetrics,
  legacyMetrics,
  dogfoodMetrics,
}: {
  runnerMetrics: RunnerWorkflowMetrics;
  workplaneMetrics: WorkplaneReviewMetrics;
  guidebriefMetrics: GuideBriefProjectionMetrics;
  legacyMetrics: LegacyCockpitReadinessMetrics;
  dogfoodMetrics: DogfoodReadinessMetrics;
}): AugnesWorkflowMetricGroup[] {
  return [
    metricGroup({
      group_id: "runner",
      title: "Runner metrics",
      summary: "Read-only runner ledger and recovered DeltaBatch signals.",
      metrics: Object.values(runnerMetrics).filter(isMetric),
    }),
    metricGroup({
      group_id: "workplane",
      title: "Workplane review metrics",
      summary: "Review queue, recovered DeltaBatch, and delta quality signals.",
      metrics: [
        workplaneMetrics.recovered_delta_batch_visibility_rate,
        workplaneMetrics.workplane_review_queue_load,
        workplaneMetrics.review_burden_signal,
        workplaneMetrics.perspective_delta_quality_signal,
      ],
    }),
    metricGroup({
      group_id: "guidebrief",
      title: "GuideBrief projection metrics",
      summary:
        "Debug coverage, intent reversibility, handoff loss, and identity separation signals.",
      metrics: Object.values(guidebriefMetrics).filter(isMetric),
    }),
    metricGroup({
      group_id: "stale_context",
      title: "Stale and fallback metrics",
      summary: "Signals that make stale and fallback context visible.",
      metrics: [
        workplaneMetrics.workplane_fallback_source_count,
        workplaneMetrics.workplane_stale_source_count,
        workplaneMetrics.stale_context_incident_count,
      ],
    }),
    metricGroup({
      group_id: "cockpit_absorption",
      title: "Cockpit absorption readiness",
      summary: legacyMetrics.summary,
      metrics: [legacyMetrics.cockpit_compatibility_dependency_signal],
    }),
    metricGroup({
      group_id: "dogfood_readiness",
      title: "Dogfood readiness",
      summary: dogfoodMetrics.summary,
      metrics: [
        dogfoodMetrics.autonomy_yield_signal,
        dogfoodMetrics.delta_noise_signal,
        dogfoodMetrics.resume_latency_signal,
        dogfoodMetrics.research_integration_yield_signal,
      ],
    }),
  ];
}

function metricGroup({
  group_id,
  title,
  summary,
  metrics,
}: {
  group_id: AugnesWorkflowMetricGroupId;
  title: string;
  summary: string;
  metrics: AugnesWorkflowMetric[];
}): AugnesWorkflowMetricGroup {
  return {
    group_id,
    title,
    summary,
    status: summarizeStatus(metrics),
    metrics,
  };
}

function ratioMetric({
  metric_id,
  group_id,
  label,
  numerator,
  denominator,
  healthyAt,
  watchAt,
  inverse = false,
  summary,
  source_refs,
}: {
  metric_id: AugnesWorkflowMetricId;
  group_id: AugnesWorkflowMetricGroupId;
  label: string;
  numerator: number;
  denominator: number;
  healthyAt: number;
  watchAt: number;
  inverse?: boolean;
  summary: string;
  source_refs: string[];
}): AugnesWorkflowMetric {
  if (denominator <= 0) {
    return baseMetric({
      metric_id,
      group_id,
      label,
      value: null,
      unit: "ratio",
      numerator: null,
      denominator: null,
      status: "insufficient_data",
      summary,
      source_refs,
      caveats: [`${metric_id} has no denominator in the supplied readback.`],
    });
  }

  const value = numerator / denominator;
  const status = inverse
    ? value <= healthyAt
      ? "healthy"
      : value <= watchAt
        ? "watch"
        : "needs_review"
    : value >= healthyAt
      ? "healthy"
      : value >= watchAt
        ? "watch"
        : "needs_review";

  return baseMetric({
    metric_id,
    group_id,
    label,
    value,
    unit: "ratio",
    numerator,
    denominator,
    status,
    summary,
    source_refs,
  });
}

function countMetric({
  metric_id,
  group_id,
  label,
  value,
  summary,
  source_refs,
  healthyWhenZero,
  caveats = [],
}: {
  metric_id: AugnesWorkflowMetricId;
  group_id: AugnesWorkflowMetricGroupId;
  label: string;
  value: number | null;
  summary: string;
  source_refs: string[];
  healthyWhenZero: boolean;
  caveats?: string[];
}): AugnesWorkflowMetric {
  const status =
    value === null
      ? "insufficient_data"
      : healthyWhenZero
        ? value === 0
          ? "healthy"
          : value <= 3
            ? "watch"
            : "needs_review"
        : value > 0
          ? "watch"
          : "healthy";

  return baseMetric({
    metric_id,
    group_id,
    label,
    value,
    unit: "count",
    numerator: value,
    denominator: null,
    status,
    summary,
    source_refs,
    caveats,
  });
}

function signalMetric({
  metric_id,
  group_id,
  label,
  value,
  status,
  summary,
  source_refs,
  caveats = [],
}: {
  metric_id: AugnesWorkflowMetricId;
  group_id: AugnesWorkflowMetricGroupId;
  label: string;
  value: number | null;
  status: AugnesMetricStatus;
  summary: string;
  source_refs: string[];
  caveats?: string[];
}): AugnesWorkflowMetric {
  return baseMetric({
    metric_id,
    group_id,
    label,
    value,
    unit: "signal",
    numerator: value,
    denominator: value === null ? null : 1,
    status,
    summary,
    source_refs,
    caveats,
  });
}

function averageMetric({
  metric_id,
  group_id,
  label,
  values,
  unit,
  summary,
  source_refs,
}: {
  metric_id: AugnesWorkflowMetricId;
  group_id: AugnesWorkflowMetricGroupId;
  label: string;
  values: number[];
  unit: "count" | "milliseconds";
  summary: string;
  source_refs: string[];
}): AugnesWorkflowMetric {
  if (values.length === 0) {
    return baseMetric({
      metric_id,
      group_id,
      label,
      value: null,
      unit,
      numerator: null,
      denominator: null,
      status: "insufficient_data",
      summary,
      source_refs,
      caveats: [`${metric_id} has no values in the supplied readback.`],
    });
  }

  const value =
    values.reduce((total, current) => total + current, 0) / values.length;
  return baseMetric({
    metric_id,
    group_id,
    label,
    value,
    unit,
    numerator: values.reduce((total, current) => total + current, 0),
    denominator: values.length,
    status: "healthy",
    summary,
    source_refs,
  });
}

function baseMetric({
  metric_id,
  group_id,
  label,
  value,
  unit,
  numerator,
  denominator,
  status,
  summary,
  source_refs,
  caveats = [],
}: {
  metric_id: AugnesWorkflowMetricId;
  group_id: AugnesWorkflowMetricGroupId;
  label: string;
  value: number | null;
  unit: "ratio" | "count" | "milliseconds" | "signal";
  numerator: number | null;
  denominator: number | null;
  status: AugnesMetricStatus;
  summary: string;
  source_refs: string[];
  caveats?: string[];
}): AugnesWorkflowMetric {
  return {
    signal_id: `augnes_metric.${metric_id}`,
    metric_id,
    group_id,
    label,
    value,
    unit,
    numerator,
    denominator,
    status,
    trend: "unknown",
    summary,
    source_refs: uniqueStrings(source_refs),
    caveats,
    validation_refs: [...RUNNER_WORKPLANE_METRICS_SMOKE_REFS],
  };
}

function cloneAsCoreMetric({
  metric,
  metric_id,
  group_id,
  label,
  summary,
}: {
  metric: AugnesWorkflowMetric;
  metric_id: AugnesWorkflowMetricId;
  group_id: AugnesWorkflowMetricGroupId;
  label: string;
  summary: string;
}): AugnesWorkflowMetric {
  return {
    ...metric,
    signal_id: `augnes_metric.${metric_id}`,
    metric_id,
    group_id,
    label,
    summary,
  };
}

function hasDistinctDeltaBatchIdentities(
  nodeContextRead: AugnesWorkflowMetricsInput["node_context_read"],
): boolean {
  if (!nodeContextRead) return false;
  const expected = [
    ["delta_projection", "perspective_delta"],
    ["projected_delta_batch", "perspective_delta"],
    ["delta_batch", "runner_delta_batch"],
  ];
  return expected.every(([panelId, nodeId]) =>
    nodeContextRead.panels.some(
      (panel) => panel.panel_id === panelId && panel.node_id === nodeId,
    ),
  );
}

function isScheduledRun(run: AutonomyRunRecord): boolean {
  return (
    Boolean(run.scheduled_for) ||
    run.events.some((event) => event.event_type === "run_scheduled")
  );
}

function countForbiddenActionAttempts(runs: AutonomyRunRecord[]): number {
  const texts = runs.flatMap((run) => [
    run.stop_reason ?? "",
    ...run.events.map((event) => event.message),
    ...run.steps.map((step) => `${step.error_message ?? ""} ${step.summary}`),
    ...run.delta_batches.flatMap((batch) => [
      batch.summary,
      ...batch.validation.notes,
      ...batch.validation.skipped_checks.map(
        (check) => `${check.check} ${check.reason}`,
      ),
    ]),
  ]);
  return texts.filter(isExplicitForbiddenActionAttempt).length;
}

function isExplicitForbiddenActionAttempt(text: string): boolean {
  const normalized = normalizeMetricClassifierText(text);
  if (!normalized || isSafeBoundaryDisclosure(normalized)) return false;

  const markers = matchIndexes(
    normalized,
    ATTEMPT_OR_VIOLATION_MARKER_PATTERN,
  );
  if (markers.length === 0) return false;

  const authorityKeywords = matchIndexes(normalized, AUTHORITY_KEYWORD_PATTERN);
  if (authorityKeywords.length === 0) return false;

  return markers.some((markerIndex) =>
    authorityKeywords.some(
      (keywordIndex) =>
        Math.abs(keywordIndex - markerIndex) <= FORBIDDEN_ACTION_ATTEMPT_WINDOW,
    ),
  );
}

function isSafeBoundaryDisclosure(text: string): boolean {
  const normalized = normalizeMetricClassifierText(text);
  if (!normalized) return false;

  const compact = normalized.replace(/[\s-]+/g, "_");
  if (
    /\bno_[a-z0-9_]*(provider|openai|github|codex|execute|schedule|recover|apply|proof|evidence|memory|perspective|merge|publish|deploy|replay|retry)/i.test(
      compact,
    )
  ) {
    return true;
  }

  return SAFE_BOUNDARY_DISCLOSURE_PATTERNS.some((pattern) =>
    pattern.test(normalized),
  );
}

function matchIndexes(text: string, pattern: RegExp): number[] {
  pattern.lastIndex = 0;
  return [...text.matchAll(pattern)].map((match) => match.index ?? 0);
}

function normalizeMetricClassifierText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function durationMs(
  startedAt: string | null,
  finishedAt: string | null,
): number | null {
  if (!startedAt || !finishedAt) return null;
  const started = Date.parse(startedAt);
  const finished = Date.parse(finishedAt);
  if (!Number.isFinite(started) || !Number.isFinite(finished)) return null;
  return Math.max(0, finished - started);
}

function summarizeStatus(metrics: AugnesWorkflowMetric[]): AugnesMetricStatus {
  if (metrics.length === 0) return "unknown";
  if (metrics.some((metric) => metric.status === "blocked")) return "blocked";
  if (metrics.some((metric) => metric.status === "needs_review")) {
    return "needs_review";
  }
  if (metrics.some((metric) => metric.status === "watch")) return "watch";
  if (metrics.every((metric) => metric.status === "insufficient_data")) {
    return "insufficient_data";
  }
  if (metrics.some((metric) => metric.status === "unknown")) return "unknown";
  return "healthy";
}

function buildSummary({
  status,
  groups,
  legacyMetrics,
  dogfoodMetrics,
}: {
  status: AugnesMetricStatus;
  groups: AugnesWorkflowMetricGroup[];
  legacyMetrics: LegacyCockpitReadinessMetrics;
  dogfoodMetrics: DogfoodReadinessMetrics;
}): string {
  const watchGroups = groups
    .filter((group) => group.status !== "healthy")
    .map((group) => group.group_id)
    .join(", ");
  return [
    `Runner / Workplane Metrics status is ${status}.`,
    watchGroups ? `Watch groups: ${watchGroups}.` : "All groups are healthy.",
    legacyMetrics.summary,
    dogfoodMetrics.summary,
  ].join(" ");
}

function isMetric(value: unknown): value is AugnesWorkflowMetric {
  return Boolean(
    value &&
      typeof value === "object" &&
      "metric_id" in value &&
      "signal_id" in value,
  );
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}
