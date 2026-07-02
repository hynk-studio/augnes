import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import {
  createAutonomyRun,
  getAutonomyRun,
  recoverDeltaBatchForRun,
  tickAutonomyRun,
} from "@/lib/autonomy/runner";
import { readWorkplaneContext, type WorkplaneContextRead } from "@/lib/workplane/read-workplane-context";
import { buildAgentWorkplaneNodeContextRead } from "@/lib/workplane/workplane-node-context";
import {
  readRunnerDeltaBatchesForWorkplane,
  type WorkplaneRunnerDeltaBatchRead,
} from "@/lib/workplane/read-runner-delta-batches-for-workplane";
import {
  buildGuideWorkplaneDebugContext,
  GUIDE_WORKPLANE_DEBUG_DEFAULT_SELECTIONS,
} from "@/lib/guide/guide-workplane-debug-context";
import { buildWorkplaneIntentProjection } from "@/lib/guide/workplane-intent-projection";
import { readRunnerWorkplaneMetrics } from "@/lib/metrics/runner-workplane-metrics";
import type {
  AutonomyRunRecord,
  RecoveredAutonomyDeltaBatch,
} from "@/types/autonomy-runner-execution";
import {
  AUGNES_DOGFOOD_SIGNAL_IDS,
  AUGNES_DOGFOOD_VERSION,
  type AugnesDogfoodArtifactRef,
  type AugnesDogfoodAuthorityBoundary,
  type AugnesDogfoodEvaluation,
  type AugnesDogfoodEvaluationSignal,
  type AugnesDogfoodInput,
  type AugnesDogfoodIntentProjectionSnapshot,
  type AugnesDogfoodMetricsSnapshot,
  type AugnesDogfoodReport,
  type AugnesDogfoodRunnerFixtureSummary,
  type AugnesDogfoodSignalId,
  type AugnesDogfoodStatus,
  type AugnesDogfoodWorkplaneSnapshot,
  type AugnesDogfoodGuideBriefSnapshot,
} from "@/types/augnes-dogfood";
import type { AgentWorkplaneNodeContextRead } from "@/types/agent-workplane-node";
import type { AugnesWorkflowMetric, AugnesWorkflowMetricsRead } from "@/types/augnes-workflow-metrics";
import type { GuideWorkplaneDebugContext } from "@/types/guide-debug-context";
import type { WorkplaneIntentProjection } from "@/types/workplane-intent-projection";

export {
  AUGNES_DOGFOOD_SIGNAL_IDS,
  AUGNES_DOGFOOD_VERSION,
};

export const AUGNES_DOGFOOD_DEFAULT_SCOPE = "project:augnes" as const;
export const AUGNES_DOGFOOD_DEFAULT_RUN_ID =
  "autonomy_run.dogfood.augnes_on_augnes_v0_1" as const;
export const AUGNES_DOGFOOD_DEFAULT_TITLE =
  "Augnes-on-Augnes Dogfood v0.1" as const;
export const AUGNES_DOGFOOD_DEFAULT_CONTRACT_REF =
  "autonomy_contract.dogfood.augnes_on_augnes_v0_1" as const;
export const AUGNES_DOGFOOD_DEFAULT_CREATED_AT =
  "2026-07-02T00:00:00.000Z" as const;
export const AUGNES_DOGFOOD_DEFAULT_INTENT =
  "Focus the Workplane on runner and DeltaBatch review." as const;
export const AUGNES_DOGFOOD_CODEX_HANDOFF_INTENT =
  "Prepare this state for Codex handoff." as const;

const DOGFOOD_DOC = "docs/AUGNES_ON_AUGNES_DOGFOOD_V0_1.md";
const METRICS_DOC = "docs/AUGNES_WORKFLOW_METRICS_V0_1.md";
const INTENT_DOC = "docs/GUIDEBRIEF_INTENT_PROJECTION_V0_1.md";
const DEBUG_DOC = "docs/GUIDEBRIEF_WORKPLANE_DEBUG_CONTEXT_V0_1.md";
const RUNNER_DOC = "docs/AGENT_WORKPLANE_RUNNER_DELTABATCH_INTEGRATION_V0_1.md";
const WORKPLANE_DOC = "docs/AGENT_WORKPLANE_V0_1.md";

const DOGFOOD_SMOKE_REFS = [
  "smoke:augnes-on-augnes-dogfood-v0-1",
  "smoke:runner-workplane-metrics-v0-1",
  "smoke:guidebrief-intent-projection-v0-1",
  "smoke:guide-workplane-debug-context-v0-1",
  "smoke:workplane-runner-deltabatch-integration-v0-1",
] as const;

type RunFixtureResult = {
  run: AutonomyRunRecord;
  recoveredDeltaBatch: RecoveredAutonomyDeltaBatch;
  runnerDeltaBatchRead: WorkplaneRunnerDeltaBatchRead;
  workplaneContext: WorkplaneContextRead;
  nodeContextRead: AgentWorkplaneNodeContextRead;
  debugContexts: GuideWorkplaneDebugContext[];
  intentProjections: WorkplaneIntentProjection[];
  metricsReadout: AugnesWorkflowMetricsRead;
};

export function buildEmptyAugnesDogfoodReport(
  input: AugnesDogfoodInput = {},
): AugnesDogfoodReport {
  return buildAugnesDogfoodReport({
    ...input,
    caveats: uniqueStrings([
      ...(input.caveats ?? []),
      "No runner fixture, recovered DeltaBatch, Workplane context, GuideBrief context, Intent Projection, or metrics readout was supplied.",
    ]),
  });
}

export function buildAugnesDogfoodReport(
  input: AugnesDogfoodInput = {},
): AugnesDogfoodReport {
  const scope = input.scope ?? input.runner_run?.scope ?? AUGNES_DOGFOOD_DEFAULT_SCOPE;
  const createdAt = input.now ?? input.metrics_readout?.as_of ?? AUGNES_DOGFOOD_DEFAULT_CREATED_AT;
  const authorityBoundary = buildDogfoodAuthorityBoundary(input);
  const runnerFixtureSummary = buildRunnerFixtureSummary(input);
  const workplaneSnapshot = buildWorkplaneSnapshot(input, scope);
  const guidebriefSnapshot = buildGuideBriefSnapshot(input);
  const intentProjectionSnapshot = buildIntentProjectionSnapshot(input);
  const metricsSnapshot = buildMetricsSnapshot(input);
  const evaluation = buildAugnesDogfoodEvaluation({
    ...input,
    scope,
  });
  const artifacts = buildArtifactRefs(input);
  const status = summarizeReportStatus([
    runnerFixtureSummary.recovered_delta_count > 0 ? "passed" : "insufficient_data",
    workplaneSnapshot.status,
    guidebriefSnapshot.status,
    intentProjectionSnapshot.status,
    metricsSnapshot.status,
    evaluation.status,
  ]);
  const caveats = uniqueStrings([
    ...(input.caveats ?? []),
    ...metricsSnapshot.caveats,
    ...evaluation.signals.flatMap((signal) => signal.caveats),
  ]);
  const recommendedNextReview = evaluation.recommended_next_review;

  return {
    report_version: AUGNES_DOGFOOD_VERSION,
    status,
    scope,
    created_at: createdAt,
    authority_boundary: authorityBoundary,
    runner_fixture_summary: runnerFixtureSummary,
    workplane_snapshot: workplaneSnapshot,
    guidebrief_snapshot: guidebriefSnapshot,
    intent_projection_snapshot: intentProjectionSnapshot,
    metrics_snapshot: metricsSnapshot,
    evaluation,
    artifacts,
    caveats,
    recommended_next_review: recommendedNextReview,
    validation_summary: {
      status: "partial",
      smoke_refs: [...DOGFOOD_SMOKE_REFS],
      docs_refs: [DOGFOOD_DOC, WORKPLANE_DOC, DEBUG_DOC, INTENT_DOC, METRICS_DOC, RUNNER_DOC],
      notes: [
        "Dogfood validation is local fixture-backed validation, not product execution authority.",
        "Product /workbench render remains read-only and does not create runner fixtures.",
        "Temp runner fixture writes are allowed only in explicit script/smoke paths.",
      ],
    },
  };
}

export async function runAugnesDogfoodFixture(
  input: AugnesDogfoodInput,
): Promise<AugnesDogfoodReport> {
  if (!input.dbPath) {
    throw new Error("augnes_dogfood_fixture_requires_explicit_dbPath");
  }

  const fixture = await buildTempRunnerFixture(input);
  const report = buildAugnesDogfoodReport({
    ...input,
    runner_run: fixture.run,
    runner_runs: [fixture.run],
    recovered_delta_batch: fixture.recoveredDeltaBatch,
    runner_delta_batch_read: fixture.runnerDeltaBatchRead,
    workplane_context: fixture.workplaneContext,
    node_context_read: fixture.nodeContextRead,
    guidebrief_debug_contexts: fixture.debugContexts,
    intent_projections: fixture.intentProjections,
    metrics_readout: fixture.metricsReadout,
    artifacts: [
      ...(input.artifacts ?? []),
      {
        artifact_ref: input.dbPath,
        artifact_kind: "temp_runner_ledger",
        pointer_semantics: "pointer_only",
        summary:
          "Explicit local dogfood runner ledger fixture. This is not product DB state.",
        durable_product_state: false,
      },
      ...(input.outputPath
        ? [
            {
              artifact_ref: input.outputPath,
              artifact_kind: "json_report" as const,
              pointer_semantics: "pointer_only" as const,
              summary:
                "Explicit local dogfood JSON report written by the script path.",
              durable_product_state: false as const,
            },
          ]
        : []),
    ],
  });

  if (input.outputPath) {
    mkdirSync(dirname(input.outputPath), { recursive: true });
    writeFileSync(input.outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }

  return report;
}

export function buildAugnesDogfoodEvaluation(
  input: AugnesDogfoodInput = {},
): AugnesDogfoodEvaluation {
  const runnerSummary = buildRunnerFixtureSummary(input);
  const workplaneSnapshot = buildWorkplaneSnapshot(
    input,
    input.scope ?? input.runner_run?.scope ?? AUGNES_DOGFOOD_DEFAULT_SCOPE,
  );
  const guidebriefSnapshot = buildGuideBriefSnapshot(input);
  const intentSnapshot = buildIntentProjectionSnapshot(input);
  const metricsSnapshot = buildMetricsSnapshot(input);
  const metricById = metricMap(input.metrics_readout);
  const shrinkHealthy =
    metricsSnapshot.cockpit_shrink_readiness_status === "healthy" ||
    metricsSnapshot.cockpit_shrink_readiness_status === "watch";
  const nextReview = shrinkHealthy
    ? "Legacy Cockpit Shrink Plan v0.1 can be reviewed only after dogfood and metrics indicate readiness."
    : "Further dogfood or metrics baseline accumulation is recommended before Legacy Cockpit Shrink Plan v0.1.";

  const signals: AugnesDogfoodEvaluationSignal[] = [
    signal({
      signal_id: "resume_latency",
      status: "insufficient_data",
      summary:
        "The fixture exposes next-action context, but v0.1 has no before/after session timing baseline.",
      evidence_refs: evidenceRefs([
        input.runner_run?.run_id,
        input.node_context_read?.as_of,
        input.metrics_readout?.metrics_version,
      ]),
      metric_refs: metricRefs(metricById, ["resume_latency_signal"]),
      caveats: [
        "Resume latency requires repeated dogfood sessions or human timing notes before it can pass.",
      ],
      recommended_next_review:
        "Accumulate a repeated dogfood baseline before treating resume latency as improved.",
    }),
    signal({
      signal_id: "delta_batch_quality",
      status:
        runnerSummary.recovered_delta_count > 0
          ? runnerSummary.recovered_validation_status === "blocked"
            ? "blocked"
            : "passed"
          : "insufficient_data",
      summary:
        runnerSummary.recovered_delta_count > 0
          ? `Recovered DeltaBatch ${runnerSummary.recovered_batch_id} exposes ${runnerSummary.recovered_delta_count} review candidate deltas.`
          : "No recovered DeltaBatch was available for dogfood review.",
      evidence_refs: evidenceRefs([
        runnerSummary.recovered_batch_id,
        runnerSummary.run_id,
      ]),
      metric_refs: metricRefs(metricById, [
        "delta_batch_recovery_rate",
        "average_delta_batch_count_per_run",
        "delta_noise_signal",
      ]),
      caveats:
        runnerSummary.recovered_delta_count > 0
          ? [
              "Recovered deltas are review candidates; no apply, approve, proof, or durable memory write is implied.",
            ]
          : ["DeltaBatch quality cannot be evaluated without recovered deltas."],
      recommended_next_review:
        "Inspect recovered deltas for noise before using them as shrink-planning evidence.",
    }),
    signal({
      signal_id: "guidebrief_debug_usefulness",
      status:
        guidebriefSnapshot.debug_context_count >= 3 &&
        guidebriefSnapshot.observed_count > 0
          ? "passed"
          : "insufficient_data",
      summary:
        "GuideBrief debug contexts explain Workplane inspector, recovered runner DeltaBatch, and projected DeltaBatch selections.",
      evidence_refs: guidebriefSnapshot.debug_context_ids,
      metric_refs: metricRefs(metricById, [
        "guidebrief_debug_context_coverage_signal",
      ]),
      caveats:
        guidebriefSnapshot.needs_user_judgment_count > 0
          ? ["At least one selected context still requires user judgment."]
          : [],
      recommended_next_review:
        "Use GuideBrief debug packets to check whether Workplane state is explainable before a handoff.",
    }),
    signal({
      signal_id: "intent_projection_usefulness",
      status: intentSnapshot.projection_count > 0 ? "partial" : "insufficient_data",
      summary:
        "Intent Projection focuses runner/DeltaBatch review and prepares a draft handoff-oriented view, but remains non-executable.",
      evidence_refs: intentSnapshot.projection_ids,
      metric_refs: metricRefs(metricById, [
        "intent_projection_reversibility_signal",
        "handoff_loss_rate",
      ]),
      caveats: [
        "Intent Projection is reversible view/draft context only and cannot send handoffs or launch Codex.",
      ],
      recommended_next_review:
        "Review whether the projected panel ordering actually reduces handoff preparation work.",
    }),
    signal({
      signal_id: "review_burden",
      status: "insufficient_data",
      summary:
        "The report exposes review queue load and suppressed/focused refs, but v0.1 has no prior burden baseline.",
      evidence_refs: evidenceRefs([
        input.workplane_context?.overview.review_queue.total_attention_count?.toString(),
      ]),
      metric_refs: metricRefs(metricById, [
        "workplane_review_queue_load",
        "review_burden_signal",
      ]),
      caveats: [
        "Review burden needs repeated runs or operator timing notes before pass/fail status is meaningful.",
      ],
      recommended_next_review:
        "Compare attention refs and required reading across at least one more dogfood run.",
    }),
    signal({
      signal_id: "autonomy_yield",
      status:
        runnerSummary.completed_step_count > 0 &&
        runnerSummary.recovered_delta_count > 0
          ? "passed"
          : "insufficient_data",
      summary:
        "Autonomy yield is estimated from deterministic completed runner steps and recovered deltas.",
      evidence_refs: evidenceRefs([runnerSummary.run_id, runnerSummary.recovered_batch_id]),
      metric_refs: metricRefs(metricById, [
        "autonomy_yield_signal",
        "average_delta_batch_count_per_run",
      ]),
      caveats: [
        "Yield is local fixture yield; it is not provider, GitHub, or Codex output.",
      ],
      recommended_next_review:
        "Track meaningful deltas per dogfood run across more sessions.",
    }),
    signal({
      signal_id: "stale_context_visibility",
      status: workplaneSnapshot.stale_or_fallback_visible ? "passed" : "partial",
      summary:
        "Workplane and GuideBrief snapshots preserve source, stale, empty, and fallback visibility.",
      evidence_refs: evidenceRefs([
        workplaneSnapshot.source_status.current_perspective,
        workplaneSnapshot.source_status.delta_projection,
        workplaneSnapshot.source_status.runner_delta_batch,
      ]),
      metric_refs: metricRefs(metricById, [
        "workplane_fallback_source_count",
        "workplane_stale_source_count",
        "stale_context_incident_count",
      ]),
      caveats: workplaneSnapshot.stale_or_fallback_visible
        ? []
        : ["No stale/fallback signal was visible in this fixture packet."],
      recommended_next_review:
        "Keep stale and fallback states visible in any future shrink planning packet.",
    }),
    signal({
      signal_id: "cockpit_shrink_readiness",
      status: shrinkHealthy ? "needs_review" : "partial",
      summary: shrinkHealthy
        ? "Metrics indicate shrink planning may be reviewed, but dogfood remains non-authoritative."
        : "Dogfood does not yet justify Legacy Cockpit shrink planning without another baseline.",
      evidence_refs: evidenceRefs([
        metricsSnapshot.cockpit_shrink_readiness_status,
        input.metrics_readout?.recommended_next_review,
      ]),
      metric_refs: metricRefs(metricById, [
        "cockpit_compatibility_dependency_signal",
      ]),
      caveats: [
        "Dogfood is not deletion authority and cannot shrink or delete Legacy Cockpit.",
      ],
      recommended_next_review: nextReview,
    }),
  ];

  const status = summarizeReportStatus(signals.map((item) => item.status));

  return {
    status,
    signals,
    summary:
      "Augnes-on-Augnes Dogfood v0.1 produced a local runner fixture, recovered DeltaBatch readback, GuideBrief debug/projection packets, metrics readout, and review signals without adding product authority.",
    recommended_next_review: nextReview,
  };
}

async function buildTempRunnerFixture(
  input: AugnesDogfoodInput,
): Promise<RunFixtureResult> {
  const scope = input.scope ?? AUGNES_DOGFOOD_DEFAULT_SCOPE;
  const dbPath = requiredDbPath(input);
  const run = createAutonomyRun({
    dbPath,
    run_id: AUGNES_DOGFOOD_DEFAULT_RUN_ID,
    scope,
    autonomy_contract_ref: AUGNES_DOGFOOD_DEFAULT_CONTRACT_REF,
    title: AUGNES_DOGFOOD_DEFAULT_TITLE,
    created_at: AUGNES_DOGFOOD_DEFAULT_CREATED_AT,
    budget_snapshot: {
      budget_id: "autonomy_runner_budget.dogfood.augnes_on_augnes_v0_1",
      max_iterations: 4,
      max_tool_calls: 0,
      max_codex_tasks: 0,
      notes: [
        "Dogfood fixture budget bounds deterministic local runner ticks only.",
        "No provider, GitHub, Codex, memory mutation, or Perspective apply budget is granted.",
      ],
    },
    source_refs: {
      autonomy_contract_refs: [AUGNES_DOGFOOD_DEFAULT_CONTRACT_REF],
      guide_brief_refs: [
        "guidebrief:workplane_debug_context.v0.1",
        "guidebrief:intent_projection.v0.1",
      ],
      handoff_refs: ["codex_handoff_candidate:dogfood.review_only"],
      current_working_perspective_refs: [
        "current_working_perspective:dogfood.review_context",
      ],
      delta_projection_refs: [
        "delta_projection:dogfood.review_context",
        "projected_delta_batch:dogfood.review_context",
      ],
      preflight_refs: ["preflight:workbench_sanity.2026-07-02"],
      runner_refs: ["runner:local_temp_fixture"],
      docs_refs: [DOGFOOD_DOC, METRICS_DOC, INTENT_DOC, DEBUG_DOC],
      repo_refs: ["hynk-studio/augnes"],
    },
    metadata: {
      dogfood_version: AUGNES_DOGFOOD_VERSION,
      product_render_path: "/workbench",
      product_render_creates_fixture_runs: false,
      temp_fixture_only: true,
    },
  });

  tickAutonomyRun({
    dbPath,
    run_id: run.run_id,
    now: "2026-07-02T00:00:01.000Z",
  });
  const completed = tickAutonomyRun({
    dbPath,
    run_id: run.run_id,
    now: "2026-07-02T00:00:02.000Z",
  });
  const recoveredDeltaBatch = recoverDeltaBatchForRun({
    dbPath,
    run_id: run.run_id,
    now: "2026-07-02T00:00:03.000Z",
  });
  const finalRun = getAutonomyRun(run.run_id, { dbPath }) ?? completed;
  const runnerDeltaBatchRead = readRunnerDeltaBatchesForWorkplane({
    dbPath,
    scope,
    limit: 4,
  });
  const baseWorkplaneContext = input.workplane_context ?? (await readWorkplaneContext());
  const workplaneContext = withRunnerDeltaBatchRead(
    baseWorkplaneContext,
    runnerDeltaBatchRead,
  );
  const nodeContextRead =
    input.node_context_read ??
    buildAgentWorkplaneNodeContextRead(workplaneContext);
  const debugContexts = [
    buildGuideWorkplaneDebugContext({
      scope,
      as_of: "2026-07-02T00:00:04.000Z",
      node_context_read: nodeContextRead,
      selection: GUIDE_WORKPLANE_DEBUG_DEFAULT_SELECTIONS.workplane_inspector,
    }),
    buildGuideWorkplaneDebugContext({
      scope,
      as_of: "2026-07-02T00:00:04.000Z",
      node_context_read: nodeContextRead,
      selection: {
        ...GUIDE_WORKPLANE_DEBUG_DEFAULT_SELECTIONS.recovered_runner_delta_batch,
        batch_id: recoveredDeltaBatch.batch_id,
        run_id: run.run_id,
      },
    }),
    buildGuideWorkplaneDebugContext({
      scope,
      as_of: "2026-07-02T00:00:04.000Z",
      node_context_read: nodeContextRead,
      selection: GUIDE_WORKPLANE_DEBUG_DEFAULT_SELECTIONS.projected_delta_batch,
    }),
  ];
  const runnerReviewProjection = buildWorkplaneIntentProjection({
    original_user_intent: AUGNES_DOGFOOD_DEFAULT_INTENT,
    scope,
    selected_panel_id: "delta_batch",
    selected_node_id: "runner_delta_batch",
    selected_run_id: run.run_id,
    selected_batch_id: recoveredDeltaBatch.batch_id,
    debug_question:
      "How should the Workplane focus runner and DeltaBatch review?",
    now: "2026-07-02T00:00:05.000Z",
    node_context_read: nodeContextRead,
    debug_context: debugContexts[1],
  });
  const codexHandoffProjection = buildWorkplaneIntentProjection({
    original_user_intent: AUGNES_DOGFOOD_CODEX_HANDOFF_INTENT,
    scope,
    selected_panel_id: "handoff_builder_preview",
    selected_node_id: "handoff_context",
    selected_run_id: run.run_id,
    selected_batch_id: recoveredDeltaBatch.batch_id,
    debug_question: "What context should be prepared for Codex handoff?",
    now: "2026-07-02T00:00:06.000Z",
    node_context_read: nodeContextRead,
  });
  const metricsReadout = await readRunnerWorkplaneMetrics({
    scope,
    now: "2026-07-02T00:00:07.000Z",
    dbPath,
    runner_runs: [finalRun],
    workplane_context: workplaneContext,
    node_context_read: nodeContextRead,
    debug_context: debugContexts[1],
    intent_projection: runnerReviewProjection,
    cockpit_inventory_text: input.cockpit_inventory_text,
    native_absorption_map_text: input.native_absorption_map_text,
  });

  return {
    run: finalRun,
    recoveredDeltaBatch,
    runnerDeltaBatchRead,
    workplaneContext,
    nodeContextRead,
    debugContexts,
    intentProjections: [runnerReviewProjection, codexHandoffProjection],
    metricsReadout,
  };
}

function withRunnerDeltaBatchRead(
  context: WorkplaneContextRead,
  runnerDeltaBatchRead: WorkplaneRunnerDeltaBatchRead,
): WorkplaneContextRead {
  return {
    ...context,
    runner_delta_batch_read: runnerDeltaBatchRead,
    overview: {
      ...context.overview,
      runner_delta_batch: {
        as_of: runnerDeltaBatchRead.as_of,
        recovered_batch_count: runnerDeltaBatchRead.recovered_batch_count,
        recovered_delta_count: runnerDeltaBatchRead.recovered_delta_count,
        latest_batch_id: runnerDeltaBatchRead.latest_batch_id,
        latest_run_id: runnerDeltaBatchRead.latest_run_id,
        latest_validation_status: runnerDeltaBatchRead.latest_validation_status,
      },
    },
    source_status: {
      ...context.source_status,
      runner_delta_batch: runnerDeltaBatchRead.source_status,
    },
    fallback_reason: {
      ...context.fallback_reason,
      runner_delta_batch: runnerDeltaBatchRead.fallback_reason,
    },
    workplane_notes: uniqueStrings([
      ...context.workplane_notes,
      "Dogfood context replaced runner DeltaBatch readback with explicit temp ledger fixture readback.",
    ]),
  };
}

function buildDogfoodAuthorityBoundary(
  input: AugnesDogfoodInput,
): AugnesDogfoodAuthorityBoundary {
  const tempFixtureAllowed = Boolean(input.dbPath);
  const tempArtifactAllowed = Boolean(input.outputPath);

  return {
    surface: "augnes_on_augnes_dogfood",
    dogfood_is_local_harness: true,
    dogfood_is_product_execution_authority: false,
    product_workbench_render_remains_read_only: true,
    temp_fixture_writes_are_script_smoke_only: tempFixtureAllowed,
    can_write_product_db_from_workbench: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_actuate_github: false,
    can_execute_codex: false,
    can_create_branch_or_pr: false,
    can_apply_project_perspective: false,
    can_apply_durable_memory: false,
    can_auto_apply_delta: false,
    can_record_proof: false,
    can_create_evidence: false,
    can_send_handoff: false,
    can_merge_publish_retry_replay_deploy: false,
    can_delete_or_shrink_legacy_cockpit: false,
    can_add_product_route: false,
    can_add_server_action: false,
    can_add_ui_execution_control: false,
    can_create_temp_runner_fixture: tempFixtureAllowed,
    can_tick_temp_runner_fixture: tempFixtureAllowed,
    can_recover_temp_delta_batch_fixture: tempFixtureAllowed,
    can_write_temp_dogfood_artifact: tempArtifactAllowed,
    notes: [
      "Dogfood is a local harness, not product execution authority.",
      "Temp runner fixture writes are allowed only when an explicit dbPath is supplied by script or smoke.",
      "Product /workbench render remains read-only and must not create, tick, recover, or write runner fixture data.",
      "The harness does not call provider/OpenAI/GitHub/Codex, create branches or PRs, apply Perspective or durable memory, write proof/evidence, auto-apply deltas, add routes, add server actions, add UI execution controls, or delete/shrink Legacy Cockpit.",
    ],
  };
}

function buildRunnerFixtureSummary(
  input: AugnesDogfoodInput,
): AugnesDogfoodRunnerFixtureSummary {
  const run = input.runner_run ?? input.runner_runs?.[0] ?? null;
  const recovered = input.recovered_delta_batch ?? run?.delta_batches?.[0] ?? null;

  return {
    fixture_mode: input.dbPath
      ? "temp_runner_ledger_fixture"
      : run
        ? "supplied_fixture"
        : "empty",
    db_path: input.dbPath ?? null,
    run_id: run?.run_id ?? recovered?.run_id ?? null,
    run_status: run?.status ?? null,
    run_title: run?.title ?? null,
    step_count: run?.steps.length ?? 0,
    completed_step_count:
      run?.steps.filter((step) => step.status === "completed").length ?? 0,
    event_count: run?.events.length ?? 0,
    recovered_batch_id: recovered?.batch_id ?? null,
    recovered_batch_status: recovered?.status ?? null,
    recovered_delta_count: recovered?.delta_count ?? 0,
    recovered_validation_status: recovered?.validation.validation_status ?? null,
    source_refs: uniqueStrings([
      ...(run ? flattenRunnerSourceRefs(run.source_refs) : []),
      ...(recovered ? flattenRunnerSourceRefs(recovered.source_refs) : []),
    ]),
  };
}

function buildWorkplaneSnapshot(
  input: AugnesDogfoodInput,
  scope: string,
): AugnesDogfoodWorkplaneSnapshot {
  const context = input.workplane_context;
  const runnerRead = input.runner_delta_batch_read ?? context?.runner_delta_batch_read;
  const identity = buildDeltaBatchIdentitySeparation(input.node_context_read);
  const sourceStatus = {
    current_perspective: context?.source_status.current_perspective ?? null,
    delta_projection: context?.source_status.delta_projection ?? null,
    runner_delta_batch: runnerRead?.source_status ?? null,
  };
  const fallbackReasons = uniqueStrings(
    [
      context?.fallback_reason.current_perspective ?? "",
      context?.fallback_reason.delta_projection ?? "",
      runnerRead?.fallback_reason ?? "",
    ].filter(Boolean),
  );
  const staleOrFallbackVisible =
    fallbackReasons.length > 0 ||
    Object.values(sourceStatus).some(
      (status) => status && status !== "runtime" && status !== "runner_ledger",
    ) ||
    Boolean(runnerRead && runnerRead.staleness.status !== "fresh");
  const status: AugnesDogfoodStatus = runnerRead
    ? runnerRead.recovered_delta_count > 0
      ? "passed"
      : "partial"
    : "insufficient_data";

  return {
    scope: context?.overview.scope ?? scope,
    status,
    source_status: sourceStatus,
    fallback_reasons: fallbackReasons,
    runner_delta_batch_read_status: runnerRead?.status ?? null,
    recovered_batch_count: runnerRead?.recovered_batch_count ?? 0,
    recovered_delta_count: runnerRead?.recovered_delta_count ?? 0,
    latest_batch_id: runnerRead?.latest_batch_id ?? null,
    latest_run_id: runnerRead?.latest_run_id ?? null,
    delta_batch_identity_separation: identity,
    stale_or_fallback_visible: staleOrFallbackVisible,
    notes: [
      "Workplane snapshot is built from read context only.",
      "Recovered runner DeltaBatch readback remains separate from projected Delta Projection batches.",
    ],
  };
}

function buildGuideBriefSnapshot(
  input: AugnesDogfoodInput,
): AugnesDogfoodGuideBriefSnapshot {
  const debugContexts = input.guidebrief_debug_contexts ?? [];
  const selectionStatuses = Object.fromEntries(
    debugContexts.map((context) => [
      context.debug_context_id,
      context.selected_context.selection_status,
    ]),
  );
  const matchedContexts = debugContexts
    .map((context) =>
      [
        context.selected_context.matched_panel_id,
        context.selected_context.matched_node_id,
      ]
        .filter(Boolean)
        .join("/"),
    )
    .filter(Boolean);
  const observedCount = debugContexts.reduce(
    (count, context) => count + context.observed.length,
    0,
  );
  const inferredCount = debugContexts.reduce(
    (count, context) => count + context.inferred.length,
    0,
  );
  const suggestedCount = debugContexts.reduce(
    (count, context) => count + context.suggested.length,
    0,
  );
  const judgmentCount = debugContexts.reduce(
    (count, context) => count + context.needs_user_judgment.length,
    0,
  );
  const status: AugnesDogfoodStatus =
    debugContexts.length > 0 && observedCount > 0
      ? "passed"
      : "insufficient_data";

  return {
    status,
    debug_context_count: debugContexts.length,
    debug_context_ids: debugContexts.map((context) => context.debug_context_id),
    matched_contexts: uniqueStrings(matchedContexts),
    selection_statuses: selectionStatuses,
    observed_count: observedCount,
    inferred_count: inferredCount,
    suggested_count: suggestedCount,
    needs_user_judgment_count: judgmentCount,
    stale_warning_count: debugContexts.reduce(
      (count, context) => count + context.stale_warnings.length,
      0,
    ),
    codex_handoff_candidate_statuses: uniqueStrings(
      debugContexts.map(
        (context) => context.codex_debug_handoff_candidate.status,
      ),
    ),
    notes: [
      "GuideBrief debug contexts are explanatory packets and cannot launch Codex or send handoffs.",
    ],
  };
}

function buildIntentProjectionSnapshot(
  input: AugnesDogfoodInput,
): AugnesDogfoodIntentProjectionSnapshot {
  const projections = input.intent_projections ?? [];
  const reversible =
    projections.length > 0 &&
    projections.every((projection) => projection.reversibility.reversible);
  const durableStateChanged = projections.some(
    (projection) => projection.reversibility.durable_state_changed,
  );
  const status: AugnesDogfoodStatus =
    projections.length > 0
      ? reversible && !durableStateChanged
        ? "passed"
        : "needs_review"
      : "insufficient_data";

  return {
    status,
    projection_count: projections.length,
    projection_ids: projections.map((projection) => projection.projection_id),
    intent_classes: uniqueStrings(
      projections.map((projection) => projection.intent_class),
    ),
    projection_statuses: uniqueStrings(
      projections.map((projection) => projection.projection_status),
    ),
    prioritized_panels: uniqueStrings(
      projections.flatMap((projection) =>
        projection.prioritized_panels.map(String),
      ),
    ),
    candidate_action_count: projections.reduce(
      (count, projection) => count + projection.candidate_actions.length,
      0,
    ),
    candidate_handoff_count: projections.reduce(
      (count, projection) => count + projection.candidate_handoffs.length,
      0,
    ),
    candidate_runner_config_count: projections.reduce(
      (count, projection) => count + projection.candidate_runner_configs.length,
      0,
    ),
    candidate_perspective_update_count: projections.reduce(
      (count, projection) =>
        count + projection.candidate_perspective_updates.length,
      0,
    ),
    reversible,
    durable_state_changed: durableStateChanged,
    notes: [
      "Intent projections are reversible view/draft packets and do not persist Workplane mode.",
    ],
  };
}

function buildMetricsSnapshot(
  input: AugnesDogfoodInput,
): AugnesDogfoodMetricsSnapshot {
  const metrics = input.metrics_readout;
  const metricById = metricMap(metrics);
  const status: AugnesDogfoodStatus = metrics
    ? mapMetricStatus(metrics.status)
    : "insufficient_data";

  return {
    status,
    metrics_status: metrics?.status ?? null,
    runner_metrics_status: metrics?.runner_metrics.run_completion_rate.status ?? null,
    dogfood_readiness_status:
      metrics?.dogfood_readiness_metrics.readiness_status ?? null,
    cockpit_shrink_readiness_status:
      metrics?.legacy_cockpit_readiness_metrics.shrink_readiness_status ?? null,
    recovered_delta_batch_visibility_metric: metricById.get(
      "recovered_delta_batch_visibility_rate",
    )?.status ?? null,
    projected_vs_recovered_deltabatch_identity_metric: metricById.get(
      "projected_vs_recovered_deltabatch_identity_signal",
    )?.status ?? null,
    resume_latency_metric: metricById.get("resume_latency_signal")?.status ?? null,
    autonomy_yield_metric: metricById.get("autonomy_yield_signal")?.status ?? null,
    review_burden_metric: metricById.get("review_burden_signal")?.status ?? null,
    caveats: metrics?.caveats ?? [
      "Metrics readout was not supplied; dogfood report records insufficient data.",
    ],
    recommended_next_review: metrics?.recommended_next_review ?? null,
  };
}

function buildArtifactRefs(input: AugnesDogfoodInput): AugnesDogfoodArtifactRef[] {
  return uniqueArtifacts([
    ...(input.artifacts ?? []),
    {
      artifact_ref: DOGFOOD_DOC,
      artifact_kind: "doc",
      pointer_semantics: "pointer_only",
      summary: "Augnes-on-Augnes Dogfood v0.1 documentation.",
      durable_product_state: false,
    },
    {
      artifact_ref: "scripts/run-augnes-on-augnes-dogfood-v0-1.mjs",
      artifact_kind: "script",
      pointer_semantics: "pointer_only",
      summary: "Local dogfood script that creates temp fixture paths by default.",
      durable_product_state: false,
    },
    {
      artifact_ref: "scripts/smoke-augnes-on-augnes-dogfood-v0-1.mjs",
      artifact_kind: "smoke",
      pointer_semantics: "pointer_only",
      summary: "Dogfood smoke for shape, behavior, and authority boundaries.",
      durable_product_state: false,
    },
  ]);
}

function signal(
  input: AugnesDogfoodEvaluationSignal,
): AugnesDogfoodEvaluationSignal {
  return input;
}

function metricMap(metrics: AugnesWorkflowMetricsRead | undefined) {
  const entries =
    metrics?.groups
      .flatMap((group) => group.metrics)
      .map((metric): [string, AugnesWorkflowMetric] => [metric.metric_id, metric]) ??
    [];
  return new Map(entries);
}

function metricRefs(metricById: Map<string, AugnesWorkflowMetric>, ids: string[]) {
  return ids
    .filter((id) => metricById.has(id))
    .map((id) => `metric:${id}`);
}

function evidenceRefs(values: Array<string | null | undefined>) {
  return uniqueStrings(values.filter((value): value is string => Boolean(value)));
}

function mapMetricStatus(status: string): AugnesDogfoodStatus {
  if (status === "healthy") return "passed";
  if (status === "watch" || status === "unknown") return "partial";
  if (status === "needs_review") return "needs_review";
  if (status === "blocked") return "blocked";
  return "insufficient_data";
}

function summarizeReportStatus(
  statuses: AugnesDogfoodStatus[],
): AugnesDogfoodStatus {
  if (statuses.some((status) => status === "blocked")) return "blocked";
  if (statuses.some((status) => status === "needs_review")) return "needs_review";
  if (statuses.some((status) => status === "partial")) return "partial";
  if (statuses.some((status) => status === "insufficient_data")) {
    return statuses.some((status) => status === "passed")
      ? "partial"
      : "insufficient_data";
  }
  return "passed";
}

function buildDeltaBatchIdentitySeparation(
  nodeContextRead: AgentWorkplaneNodeContextRead | undefined,
) {
  return {
    delta_projection_perspective_delta:
      hasPanelNode(nodeContextRead, "delta_projection", "perspective_delta"),
    projected_delta_batch_perspective_delta: hasPanelNode(
      nodeContextRead,
      "projected_delta_batch",
      "perspective_delta",
    ),
    delta_batch_runner_delta_batch: hasPanelNode(
      nodeContextRead,
      "delta_batch",
      "runner_delta_batch",
    ),
  };
}

function hasPanelNode(
  nodeContextRead: AgentWorkplaneNodeContextRead | undefined,
  panelId: string,
  nodeId: string,
) {
  return Boolean(
    nodeContextRead?.panels.some(
      (panel) => panel.panel_id === panelId && panel.node_id === nodeId,
    ),
  );
}

function flattenRunnerSourceRefs(
  refs: AutonomyRunRecord["source_refs"],
): string[] {
  return (Object.entries(refs) as Array<[string, string[]]>).flatMap(([key, values]) =>
    values.map((value) => `${key.replace(/_refs$/, "")}:${value}`),
  );
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
}

function uniqueArtifacts(
  values: readonly AugnesDogfoodArtifactRef[],
): AugnesDogfoodArtifactRef[] {
  const seen = new Set<string>();
  const artifacts: AugnesDogfoodArtifactRef[] = [];
  for (const value of values) {
    if (seen.has(value.artifact_ref)) continue;
    seen.add(value.artifact_ref);
    artifacts.push(value);
  }
  return artifacts;
}

function requiredDbPath(input: AugnesDogfoodInput): string {
  if (!input.dbPath) throw new Error("augnes_dogfood_fixture_requires_dbPath");
  return input.dbPath;
}
