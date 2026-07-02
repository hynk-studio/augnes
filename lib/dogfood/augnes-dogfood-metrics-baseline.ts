import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildEmptyAugnesDogfoodReport,
  runAugnesDogfoodFixture,
} from "@/lib/dogfood/augnes-on-augnes-dogfood";
import { buildWorkplaneBrowserRegressionReport } from "@/lib/workplane/workplane-browser-regression";
import { buildLegacyCockpitLocalControlClassification } from "@/lib/workplane/legacy-cockpit-local-control-classification";
import {
  AUGNES_DOGFOOD_BASELINE_SIGNAL_IDS,
  AUGNES_DOGFOOD_METRICS_BASELINE_VERSION,
  type AugnesDogfoodBaselineAggregate,
  type AugnesDogfoodBaselineAuthorityBoundary,
  type AugnesDogfoodBaselineInput,
  type AugnesDogfoodBaselineIteration,
  type AugnesDogfoodBaselineMetricTrend,
  type AugnesDogfoodBaselineReport,
  type AugnesDogfoodBaselineSignal,
  type AugnesDogfoodBaselineSignalId,
  type AugnesDogfoodBaselineSignalStatus,
  type AugnesDogfoodBaselineStatus,
} from "@/types/augnes-dogfood-metrics-baseline";
import type { AugnesDogfoodReport } from "@/types/augnes-dogfood";
import type { WorkplaneBrowserRegressionReport } from "@/types/workplane-browser-regression";
import type { LegacyCockpitControlClassificationRead } from "@/types/legacy-cockpit-local-control-classification";

export {
  AUGNES_DOGFOOD_BASELINE_SIGNAL_IDS,
  AUGNES_DOGFOOD_METRICS_BASELINE_VERSION,
};

export const AUGNES_DOGFOOD_BASELINE_DEFAULT_SCOPE =
  "project:augnes" as const;
export const AUGNES_DOGFOOD_BASELINE_DEFAULT_ITERATIONS = 3 as const;
export const AUGNES_DOGFOOD_BASELINE_MINIMUM_ITERATIONS = 2 as const;
export const AUGNES_DOGFOOD_BASELINE_DEFAULT_CREATED_AT =
  "2026-07-03T00:00:00.000Z" as const;
export const AUGNES_DOGFOOD_BASELINE_AGGREGATE_REPORT_FILENAME =
  "augnes-dogfood-metrics-baseline-v0-2.aggregate.json" as const;

export const AUGNES_DOGFOOD_BASELINE_REQUIRED_DOCS = [
  "docs/AUGNES_DOGFOOD_METRICS_BASELINE_V0_2.md",
  "docs/AUGNES_ON_AUGNES_DOGFOOD_V0_1.md",
  "docs/AUGNES_WORKFLOW_METRICS_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
] as const;

export const AUGNES_DOGFOOD_BASELINE_SMOKE_REFS = [
  "smoke:augnes-dogfood-metrics-baseline-v0-2",
  "smoke:augnes-on-augnes-dogfood-v0-1",
  "smoke:runner-workplane-metrics-v0-1",
  "smoke:workplane-native-browser-regression-v0-1",
  "smoke:legacy-cockpit-local-control-classification-v0-1",
] as const;

type SignalContext = {
  iterations: AugnesDogfoodBaselineIteration[];
  browserRegression: WorkplaneBrowserRegressionReport | null;
  localControlClassification: LegacyCockpitControlClassificationRead;
  resumeLatencyEvidenceRefs: string[];
  reviewBurdenEvidenceRefs: string[];
};

export function buildEmptyAugnesDogfoodMetricsBaselineReport(
  input: AugnesDogfoodBaselineInput = {},
): AugnesDogfoodBaselineReport {
  return buildAugnesDogfoodMetricsBaselineReport({
    ...input,
    iterations: [],
    caveats: uniqueStrings([
      ...(input.caveats ?? []),
      "No repeated dogfood iterations were supplied; baseline status is insufficient_data.",
    ]),
  });
}

export function buildAugnesDogfoodMetricsBaselineReport(
  input: AugnesDogfoodBaselineInput = {},
): AugnesDogfoodBaselineReport {
  const scope = input.scope ?? AUGNES_DOGFOOD_BASELINE_DEFAULT_SCOPE;
  const createdAt = input.now ?? AUGNES_DOGFOOD_BASELINE_DEFAULT_CREATED_AT;
  const browserRegression = resolveBrowserRegression(input);
  const localControlClassification =
    input.local_control_classification ??
    buildLegacyCockpitLocalControlClassification({ as_of: createdAt });
  const iterations =
    input.iterations ??
    (input.dogfood_reports ?? [buildEmptyAugnesDogfoodReport({ scope })]).map(
      (dogfoodReport, index) =>
        buildBaselineIteration({
          dogfoodReport,
          index,
          browserRegression,
          localControlClassification,
        }),
    );
  const aggregate = aggregateAugnesDogfoodBaselineIterations({
    ...input,
    scope,
    now: createdAt,
    iterations,
    browser_regression_report: browserRegression ?? undefined,
    local_control_classification: localControlClassification,
  });
  const authorityBoundary = buildAuthorityBoundary({
    tempFixtureAllowed: iterations.some((iteration) => Boolean(iteration.db_path)),
    tempArtifactAllowed: iterations.some((iteration) =>
      Boolean(iteration.report_path),
    ),
  });
  const caveats = uniqueStrings([
    ...(input.caveats ?? []),
    ...aggregate.caveats,
  ]);
  const sourceRefs = uniqueStrings([
    ...AUGNES_DOGFOOD_BASELINE_REQUIRED_DOCS,
    ...(input.source_refs ?? []),
    ...aggregate.source_refs,
  ]);

  return {
    report_version: AUGNES_DOGFOOD_METRICS_BASELINE_VERSION,
    status: aggregate.status,
    scope,
    created_at: createdAt,
    iteration_model: {
      default_iteration_count: AUGNES_DOGFOOD_BASELINE_DEFAULT_ITERATIONS,
      minimum_meaningful_iterations: 2,
      product_workbench_creates_fixture_runs: false,
      temp_runner_fixture_per_iteration: iterations.some((iteration) =>
        Boolean(iteration.db_path),
      ),
    },
    authority_boundary: authorityBoundary,
    iterations,
    aggregate,
    recommended_next_reviews: aggregate.recommended_next_reviews,
    caveats,
    source_refs: sourceRefs,
    validation_summary: {
      status: "partial",
      smoke_refs: [...AUGNES_DOGFOOD_BASELINE_SMOKE_REFS],
      docs_refs: [...AUGNES_DOGFOOD_BASELINE_REQUIRED_DOCS],
      notes: [
        "smoke:augnes-dogfood-metrics-baseline-v0-2 validates the v0.2 baseline contract, aggregation, temp-path behavior, and authority boundary.",
        "Repeated dogfood baseline reports are evidence/signals, not shrink authority.",
        "Product /workbench render remains read-only and must not create fixture runs.",
      ],
    },
  };
}

export async function runAugnesDogfoodMetricsBaseline(
  input: AugnesDogfoodBaselineInput,
): Promise<AugnesDogfoodBaselineReport> {
  if (!input.output_dir) {
    throw new Error("augnes_dogfood_metrics_baseline_requires_output_dir");
  }

  const outputDir = input.output_dir;
  const iterationCount = normalizeIterationCount(input.iteration_count);
  mkdirSync(outputDir, { recursive: true });

  const originalAugnesDbPath = process.env.AUGNES_DB_PATH;
  const dogfoodReports: AugnesDogfoodReport[] = [];
  try {
    for (let index = 0; index < iterationCount; index += 1) {
      const iterationDir = join(outputDir, `iteration-${index + 1}`);
      const dbPath = join(iterationDir, "runner-ledger.sqlite");
      const reportPath = join(
        iterationDir,
        "augnes-on-augnes-dogfood-v0-1.report.json",
      );
      mkdirSync(iterationDir, { recursive: true });
      process.env.AUGNES_DB_PATH = dbPath;
      const dogfoodReport = await runAugnesDogfoodFixture({
        scope: input.scope,
        dbPath,
        outputPath: reportPath,
        tempDir: iterationDir,
      });
      dogfoodReports.push(dogfoodReport);
    }
  } finally {
    if (originalAugnesDbPath === undefined) {
      delete process.env.AUGNES_DB_PATH;
    } else {
      process.env.AUGNES_DB_PATH = originalAugnesDbPath;
    }
  }

  const browserRegression = resolveBrowserRegression(input);
  const report = buildAugnesDogfoodMetricsBaselineReport({
    ...input,
    dogfood_reports: dogfoodReports,
    browser_regression_report: browserRegression ?? undefined,
  });
  const aggregatePath = join(
    outputDir,
    AUGNES_DOGFOOD_BASELINE_AGGREGATE_REPORT_FILENAME,
  );
  writeFileSync(aggregatePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  return report;
}

export function aggregateAugnesDogfoodBaselineIterations(
  input: AugnesDogfoodBaselineInput,
): AugnesDogfoodBaselineAggregate {
  const iterations = input.iterations ?? [];
  const browserRegression = resolveBrowserRegression(input);
  const localControlClassification =
    input.local_control_classification ??
    buildLegacyCockpitLocalControlClassification({
      as_of: input.now ?? AUGNES_DOGFOOD_BASELINE_DEFAULT_CREATED_AT,
    });
  const signalContext: SignalContext = {
    iterations,
    browserRegression,
    localControlClassification,
    resumeLatencyEvidenceRefs: input.resume_latency_evidence_refs ?? [],
    reviewBurdenEvidenceRefs: input.review_burden_evidence_refs ?? [],
  };
  const signals = AUGNES_DOGFOOD_BASELINE_SIGNAL_IDS.map((signalId) =>
    buildAggregateSignal(signalId, signalContext),
  );
  const localControlUnknownCount =
    localControlClassification.unknown_controls.length;
  const browserRecommendation =
    browserRegression?.recommendation.decision ?? null;
  const caveats = uniqueStrings([
    ...(input.caveats ?? []),
    ...iterations.flatMap((iteration) => iteration.caveats),
    ...(browserRegression
      ? browserRegression.notes
      : [
          "Browser regression was not run inside this baseline; use the browser regression smoke or pass explicit server-rendered HTML/URL evidence.",
        ]),
    ...(localControlUnknownCount > 0
      ? [
          "Local control classification still has unknown/manual-review blockers.",
        ]
      : []),
    "Shrink remains gated unless baseline, browser, metrics, dogfood, local-control, rollback, and human review gates are all green.",
  ]);
  const sourceRefs = uniqueStrings([
    ...AUGNES_DOGFOOD_BASELINE_REQUIRED_DOCS,
    ...iterations.flatMap((iteration) => iteration.source_refs),
    ...(browserRegression
      ? [
          "browser_regression:workplane_native_replacement_v0_1",
          browserRegression.recommendation.decision,
        ]
      : []),
    ...localControlClassification.source_refs,
  ]);
  const status = summarizeStatuses(signals.map((signal) => signal.status));
  const recommendedNextReviews = buildRecommendedNextReviews({
    signals,
    localControlUnknownCount,
    browserRecommendation,
  });

  return {
    status,
    iteration_count: iterations.length,
    meaningful_iteration_count: iterations.filter(
      (iteration) => iteration.status !== "insufficient_data",
    ).length,
    recovered_batch_ids: uniqueStrings(
      iterations
        .map((iteration) => iteration.recovered_batch_id)
        .filter((value): value is string => Boolean(value)),
    ),
    recovered_delta_counts: iterations.map(
      (iteration) => iteration.recovered_delta_count,
    ),
    metrics_status_sequence: iterations
      .map((iteration) => iteration.metrics_status)
      .filter((value): value is string => Boolean(value)),
    dogfood_readiness_sequence: iterations
      .map((iteration) => iteration.dogfood_readiness_status)
      .filter((value): value is string => Boolean(value)),
    cockpit_shrink_readiness_sequence: iterations
      .map((iteration) => iteration.cockpit_shrink_readiness_status)
      .filter((value): value is string => Boolean(value)),
    shrink_gated: true,
    shrink_gate_summary:
      "Legacy Cockpit shrink remains gated; this baseline is evidence/signaling only and cannot delete, shrink, hide, or disable compatibility content.",
    browser_regression_status: browserRegression?.status ?? null,
    browser_regression_recommendation: browserRecommendation,
    local_control_classification_status: localControlClassification.status,
    local_control_unknown_count: localControlUnknownCount,
    signals,
    recommended_next_reviews: recommendedNextReviews,
    caveats,
    source_refs: sourceRefs,
  };
}

function buildBaselineIteration({
  dogfoodReport,
  index,
  browserRegression,
  localControlClassification,
}: {
  dogfoodReport: AugnesDogfoodReport;
  index: number;
  browserRegression: WorkplaneBrowserRegressionReport | null;
  localControlClassification: LegacyCockpitControlClassificationRead;
}): AugnesDogfoodBaselineIteration {
  const signalStatuses = Object.fromEntries(
    dogfoodReport.evaluation.signals.map((signal) => [
      signal.signal_id,
      mapDogfoodStatus(signal.status),
    ]),
  ) as Partial<Record<AugnesDogfoodBaselineSignalId, AugnesDogfoodBaselineSignalStatus>>;
  const localControlUnknownCount =
    localControlClassification.unknown_controls.length;

  signalStatuses.browser_regression_stability = browserRegression
    ? browserRegression.recommendation.decision ===
        "browser_regression_passed_shrink_gated" ||
      browserRegression.recommendation.decision ===
        "eligible_for_shrink_candidate_review"
      ? "passed"
      : mapBrowserRegressionStatus(browserRegression.status)
    : "insufficient_data";
  signalStatuses.local_control_classification_readiness =
    localControlUnknownCount > 0 ||
    localControlClassification.status === "needs_review"
      ? "needs_review"
      : "passed";
  signalStatuses.cockpit_shrink_readiness =
    localControlUnknownCount > 0 ? "needs_review" : "partial";

  const status = summarizeStatuses([
    mapDogfoodStatus(dogfoodReport.status),
    ...Object.values(signalStatuses),
  ]);
  const runnerSummary = dogfoodReport.runner_fixture_summary;
  const workplaneSnapshot = dogfoodReport.workplane_snapshot;
  const reportPath = dogfoodReport.artifacts.find(
    (artifact) => artifact.artifact_kind === "json_report",
  )?.artifact_ref;

  return {
    iteration_id: `augnes_dogfood_metrics_baseline.v0.2.iteration.${index + 1}`,
    iteration_index: index + 1,
    status,
    db_path: runnerSummary.db_path,
    report_path: reportPath ?? null,
    dogfood_report_version: dogfoodReport.report_version,
    dogfood_status: mapDogfoodStatus(dogfoodReport.status),
    recovered_batch_id: runnerSummary.recovered_batch_id,
    recovered_delta_count: runnerSummary.recovered_delta_count,
    metrics_status: dogfoodReport.metrics_snapshot.metrics_status,
    dogfood_readiness_status:
      dogfoodReport.metrics_snapshot.dogfood_readiness_status,
    cockpit_shrink_readiness_status:
      dogfoodReport.metrics_snapshot.cockpit_shrink_readiness_status,
    browser_regression_status: browserRegression?.status ?? null,
    browser_regression_recommendation:
      browserRegression?.recommendation.decision ?? null,
    local_control_classification_status: localControlClassification.status,
    local_control_unknown_count: localControlUnknownCount,
    evaluation_signal_statuses: signalStatuses,
    delta_batch_identity_separation:
      workplaneSnapshot.delta_batch_identity_separation,
    caveats: uniqueStrings([
      ...dogfoodReport.caveats,
      ...(localControlUnknownCount > 0
        ? [
            "Local control classification unknown/manual-review blocker keeps shrink gated.",
          ]
        : []),
    ]),
    source_refs: uniqueStrings([
      ...dogfoodReport.validation_summary.docs_refs,
      ...dogfoodReport.validation_summary.smoke_refs,
      ...dogfoodReport.artifacts.map((artifact) => artifact.artifact_ref),
      ...runnerSummary.source_refs,
      ...(reportPath ? [reportPath] : []),
      ...(browserRegression
        ? [browserRegression.recommendation.decision]
        : []),
      ...localControlClassification.source_refs,
    ]),
  };
}

function buildAggregateSignal(
  signalId: AugnesDogfoodBaselineSignalId,
  context: SignalContext,
): AugnesDogfoodBaselineSignal {
  const sequence = context.iterations.map(
    (iteration) =>
      iteration.evaluation_signal_statuses[signalId] ?? "insufficient_data",
  );
  let status = summarizeStatuses(sequence);
  const evidenceRefs = uniqueStrings(
    context.iterations.flatMap((iteration) => [
      iteration.recovered_batch_id ?? "",
      iteration.report_path ?? "",
      ...iteration.source_refs,
    ]),
  );
  const caveats: string[] = [];

  if (signalId === "resume_latency") {
    status =
      context.resumeLatencyEvidenceRefs.length >= 2
        ? summarizeStatuses(sequence)
        : "insufficient_data";
    if (status === "insufficient_data") {
      caveats.push(
        "Resume latency remains insufficient_data because no repeated timing evidence or human resume notes were supplied.",
      );
    }
  }

  if (signalId === "review_burden") {
    status =
      context.reviewBurdenEvidenceRefs.length >= 2
        ? summarizeStatuses(sequence)
        : "insufficient_data";
    if (status === "insufficient_data") {
      caveats.push(
        "Review burden remains insufficient_data because no repeated operator reading-time or proposal-diff burden evidence was supplied.",
      );
    }
  }

  if (signalId === "cockpit_shrink_readiness") {
    status =
      context.localControlClassification.unknown_controls.length > 0
        ? "needs_review"
        : status;
    caveats.push(
      "Baseline signals are not shrink authority; future deletion requires a separate PR and all gates green.",
    );
  }

  if (signalId === "browser_regression_stability") {
    if (context.browserRegression) {
      status =
        context.browserRegression.recommendation.decision ===
          "browser_regression_passed_shrink_gated" ||
        context.browserRegression.recommendation.decision ===
          "eligible_for_shrink_candidate_review"
          ? "passed"
          : mapBrowserRegressionStatus(context.browserRegression.status);
      caveats.push(
        "Browser regression stability is structural evidence only and remains not shrink authority.",
      );
    } else {
      status = "insufficient_data";
      caveats.push(
        "Browser regression was not supplied to the aggregate baseline.",
      );
    }
  }

  if (signalId === "local_control_classification_readiness") {
    status =
      context.localControlClassification.status === "needs_review" ||
      context.localControlClassification.unknown_controls.length > 0
        ? "needs_review"
        : "passed";
    if (context.localControlClassification.unknown_controls.length > 0) {
      caveats.push(
        "Unknown/manual-review Legacy Cockpit control remains a shrink blocker.",
      );
    }
  }

  return {
    signal_id: signalId,
    status,
    trend:
      signalId === "resume_latency" || signalId === "review_burden"
        ? status === "insufficient_data"
          ? "insufficient_data"
          : trendForStatuses(sequence)
        : trendForStatuses(sequence),
    summary: signalSummary(signalId, status, context),
    iteration_status_sequence: sequence,
    evidence_refs: uniqueStrings([
      ...evidenceRefs,
      ...(signalId === "resume_latency"
        ? context.resumeLatencyEvidenceRefs
        : []),
      ...(signalId === "review_burden"
        ? context.reviewBurdenEvidenceRefs
        : []),
    ]),
    source_refs: signalSourceRefs(signalId),
    caveats,
    recommended_next_review: signalRecommendedNextReview(signalId, status),
  };
}

function resolveBrowserRegression(
  input: AugnesDogfoodBaselineInput,
): WorkplaneBrowserRegressionReport | null {
  if (input.skip_browser_regression) return null;
  if (input.browser_regression_report) return input.browser_regression_report;
  if (!input.browser_regression_html) return null;

  return buildWorkplaneBrowserRegressionReport({
    html: input.browser_regression_html,
    url: input.browser_regression_url,
    source: "server_rendered_html",
    metrics_status: "watch",
    dogfood_status: "needs_review",
    cockpit_shrink_readiness: "needs_review",
    notes: [
      "Baseline helper parsed explicitly supplied HTML only; no product render wrote fixture runs.",
    ],
  });
}

function buildAuthorityBoundary({
  tempFixtureAllowed,
  tempArtifactAllowed,
}: {
  tempFixtureAllowed: boolean;
  tempArtifactAllowed: boolean;
}): AugnesDogfoodBaselineAuthorityBoundary {
  return {
    surface: "augnes_dogfood_metrics_baseline",
    baseline_is_local_harness: true,
    baseline_is_product_execution_authority: false,
    product_workbench_render_remains_read_only: true,
    temp_fixture_writes_are_script_smoke_only: tempFixtureAllowed,
    can_write_product_db: false,
    can_delete_legacy_cockpit: false,
    can_shrink_legacy_cockpit: false,
    can_hide_legacy_cockpit: false,
    can_change_product_ui_behavior: false,
    can_add_product_route: false,
    can_add_api_write_route: false,
    can_add_server_action: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_actuate_github: false,
    can_execute_codex: false,
    can_execute_runner_in_product: false,
    can_tick_runner_in_product: false,
    can_recover_delta_batch_in_product: false,
    can_schedule_runner_in_product: false,
    can_record_proof: false,
    can_create_evidence: false,
    can_apply_durable_memory: false,
    can_apply_perspective: false,
    can_auto_apply_delta: false,
    can_merge_publish_retry_replay_deploy: false,
    can_absorb_local_write_control_without_contract: false,
    can_create_temp_runner_fixture: tempFixtureAllowed,
    can_tick_temp_runner_fixture: tempFixtureAllowed,
    can_recover_temp_delta_batch_fixture: tempFixtureAllowed,
    can_write_temp_baseline_artifact: tempArtifactAllowed,
    notes: [
      "Baseline v0.2 is a local harness and report layer, not product execution authority.",
      "Temp runner fixture create/tick/recover permissions are available only to explicit script/smoke paths.",
      "Product /workbench render remains read-only and must not create, tick, recover, schedule, or persist runner fixture data.",
      "The baseline does not call provider/OpenAI/GitHub/Codex, create branches or PRs, add routes, add server actions, add UI controls, write product DB state, write proof/evidence, apply durable memory, apply Perspective, auto-apply deltas, or delete/shrink/hide Legacy Cockpit.",
    ],
  };
}

function buildRecommendedNextReviews({
  signals,
  localControlUnknownCount,
  browserRecommendation,
}: {
  signals: AugnesDogfoodBaselineSignal[];
  localControlUnknownCount: number;
  browserRecommendation: string | null;
}): string[] {
  const byId = new Map(signals.map((signal) => [signal.signal_id, signal]));
  return uniqueStrings([
    ...(localControlUnknownCount > 0
      ? ["Run DOM/manual legacy-control inventory for the unknown blocker."]
      : []),
    byId.get("resume_latency")?.status === "insufficient_data"
      ? "Capture repeated next-session resume timing or operator notes before claiming resume latency improvement."
      : "",
    byId.get("review_burden")?.status === "insufficient_data"
      ? "Add richer proposal diff and reading-burden detail before claiming review burden improvement."
      : "",
    browserRecommendation === null
      ? "Run server-rendered or browser regression evidence with the same baseline if shrink stability is being evaluated."
      : "",
    "Keep Legacy Cockpit compatibility rendered; consider a shrink candidate only if all baseline, browser, metrics, dogfood, local-control, rollback, and human review gates are green.",
  ]);
}

function signalSummary(
  signalId: AugnesDogfoodBaselineSignalId,
  status: AugnesDogfoodBaselineSignalStatus,
  context: SignalContext,
): string {
  const iterationCount = context.iterations.length;
  const localUnknownCount =
    context.localControlClassification.unknown_controls.length;
  const browserDecision = context.browserRegression?.recommendation.decision;
  const summaries: Record<AugnesDogfoodBaselineSignalId, string> = {
    resume_latency:
      "Resume latency is evaluated only from repeated timing evidence or explicit operator notes; dogfood fixture presence alone is not enough.",
    review_burden:
      "Review burden is evaluated only from repeated review effort evidence; proposal/read context alone remains insufficient.",
    delta_batch_quality: `Recovered DeltaBatch quality is aggregated across ${iterationCount} deterministic dogfood iterations.`,
    guidebrief_debug_usefulness:
      "GuideBrief debug usefulness is based on whether repeated dogfood iterations expose explanatory Workplane debug packets.",
    intent_projection_usefulness:
      "Intent Projection usefulness is tracked as reversible, non-executable focus context; partial status is honest until review effort improves.",
    autonomy_yield:
      "Autonomy yield is local deterministic fixture yield, not provider, GitHub, or Codex output.",
    stale_context_visibility:
      "Stale and fallback context visibility is treated as useful when source gaps remain explicit across iterations.",
    cockpit_shrink_readiness: `Cockpit shrink readiness is ${status}; unknown local controls: ${localUnknownCount}.`,
    browser_regression_stability: browserDecision
      ? `Browser regression recommendation is ${browserDecision}.`
      : "Browser regression stability has insufficient data until server-rendered or browser evidence is supplied.",
    local_control_classification_readiness: `Local control classification status is ${context.localControlClassification.status} with ${localUnknownCount} unknown/manual-review controls.`,
  };
  return summaries[signalId];
}

function signalRecommendedNextReview(
  signalId: AugnesDogfoodBaselineSignalId,
  status: AugnesDogfoodBaselineSignalStatus,
): string {
  const reviews: Record<AugnesDogfoodBaselineSignalId, string> = {
    resume_latency:
      "Collect repeated next-session resume timing before claiming improvement.",
    review_burden:
      "Collect repeated operator reading burden or richer proposal diff detail before claiming improvement.",
    delta_batch_quality:
      "Inspect recovered deltas for noisy or duplicate review candidates.",
    guidebrief_debug_usefulness:
      "Check whether GuideBrief debug packets explain why the next panel/action is relevant.",
    intent_projection_usefulness:
      "Review whether intent projection reduces handoff prep while staying non-executable.",
    autonomy_yield:
      "Track meaningful recovered deltas per deterministic dogfood run.",
    stale_context_visibility:
      "Keep stale, fallback, and missing source states explicit in future baselines.",
    cockpit_shrink_readiness:
      "Do not open a shrink candidate until all gates, rollback evidence, and human review are green.",
    browser_regression_stability:
      "Keep running server-rendered or browser regression before shrink discussion.",
    local_control_classification_readiness:
      status === "needs_review"
        ? "Run DOM/manual legacy-control inventory for unknown controls."
        : "Keep classification linked as evidence, not shrink authority.",
  };
  return reviews[signalId];
}

function signalSourceRefs(signalId: AugnesDogfoodBaselineSignalId): string[] {
  const common = ["docs/AUGNES_DOGFOOD_METRICS_BASELINE_V0_2.md"];
  const refs: Record<AugnesDogfoodBaselineSignalId, string[]> = {
    resume_latency: ["docs/AUGNES_WORKFLOW_METRICS_V0_1.md"],
    review_burden: ["docs/AUGNES_WORKFLOW_METRICS_V0_1.md"],
    delta_batch_quality: ["docs/AUGNES_ON_AUGNES_DOGFOOD_V0_1.md"],
    guidebrief_debug_usefulness: ["docs/AGENT_WORKPLANE_V0_1.md"],
    intent_projection_usefulness: ["docs/AGENT_WORKPLANE_V0_1.md"],
    autonomy_yield: ["docs/AUGNES_ON_AUGNES_DOGFOOD_V0_1.md"],
    stale_context_visibility: ["docs/AGENT_WORKPLANE_V0_1.md"],
    cockpit_shrink_readiness: [
      "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
    ],
    browser_regression_stability: [
      "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md",
    ],
    local_control_classification_readiness: [
      "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_V0_1.md",
    ],
  };
  return uniqueStrings([...common, ...refs[signalId]]);
}

function trendForStatuses(
  statuses: AugnesDogfoodBaselineSignalStatus[],
): AugnesDogfoodBaselineMetricTrend {
  const meaningful = statuses.filter((status) => status !== "insufficient_data");
  if (meaningful.length < 2) return "insufficient_data";
  const ranks = meaningful.map(statusRank);
  const first = ranks[0];
  const last = ranks[ranks.length - 1];
  const nondecreasing = ranks.every(
    (rank, index) => index === 0 || rank >= ranks[index - 1],
  );
  const nonincreasing = ranks.every(
    (rank, index) => index === 0 || rank <= ranks[index - 1],
  );
  if (nondecreasing && last > first) return "improving";
  if (nonincreasing && last < first) return "degrading";
  if (ranks.every((rank) => rank === first)) return "steady";
  return "unknown";
}

function statusRank(status: AugnesDogfoodBaselineSignalStatus): number {
  const ranks: Record<AugnesDogfoodBaselineSignalStatus, number> = {
    blocked: 0,
    insufficient_data: 1,
    needs_review: 2,
    partial: 3,
    passed: 4,
  };
  return ranks[status];
}

function summarizeStatuses(
  statuses: AugnesDogfoodBaselineStatus[],
): AugnesDogfoodBaselineStatus {
  if (statuses.length === 0) return "insufficient_data";
  if (statuses.some((status) => status === "blocked")) return "blocked";
  if (statuses.some((status) => status === "needs_review")) {
    return "needs_review";
  }
  if (statuses.some((status) => status === "partial")) return "partial";
  if (statuses.some((status) => status === "insufficient_data")) {
    return statuses.some((status) => status === "passed")
      ? "partial"
      : "insufficient_data";
  }
  return "passed";
}

function mapDogfoodStatus(status: string): AugnesDogfoodBaselineStatus {
  if (status === "passed") return "passed";
  if (status === "partial") return "partial";
  if (status === "needs_review") return "needs_review";
  if (status === "blocked") return "blocked";
  return "insufficient_data";
}

function mapBrowserRegressionStatus(status: string): AugnesDogfoodBaselineStatus {
  if (status === "passed") return "passed";
  if (status === "partial" || status === "skipped") return "partial";
  if (status === "needs_review") return "needs_review";
  if (status === "blocked" || status === "failed") return "blocked";
  return "insufficient_data";
}

function normalizeIterationCount(count: number | undefined): number {
  const requested =
    typeof count === "number" && Number.isFinite(count)
      ? Math.floor(count)
      : AUGNES_DOGFOOD_BASELINE_DEFAULT_ITERATIONS;
  return Math.max(AUGNES_DOGFOOD_BASELINE_MINIMUM_ITERATIONS, requested);
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
}
