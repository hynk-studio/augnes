#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  assertContainsAll,
  assertPackageScript,
  collectGitDiffFiles,
  collectUntrackedFiles,
  getBaseRangeChangedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const typeFile = "types/augnes-dogfood-metrics-baseline.ts";
const helperFile = "lib/dogfood/augnes-dogfood-metrics-baseline.ts";
const runScriptFile = "scripts/run-augnes-dogfood-metrics-baseline-v0-2.mjs";
const smokeFile = "scripts/smoke-augnes-dogfood-metrics-baseline-v0-2.mjs";
const docFile = "docs/AUGNES_DOGFOOD_METRICS_BASELINE_V0_2.md";
const packageJsonFile = "package.json";
const indexDoc = "docs/00_INDEX_LATEST.md";
const dogfoodDoc = "docs/AUGNES_ON_AUGNES_DOGFOOD_V0_1.md";
const metricsDoc = "docs/AUGNES_WORKFLOW_METRICS_V0_1.md";
const shrinkPlanDoc =
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md";
const classificationDoc =
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_V0_1.md";
const browserRegressionDoc =
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md";
const agentWorkplaneDoc = "docs/AGENT_WORKPLANE_V0_1.md";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const augnesCockpitFile = "components/augnes-cockpit.tsx";
const cockpitPageFile = "app/cockpit/page.tsx";
const legacyCompatibilityPanelFile =
  "components/workplane/legacy-cockpit-compatibility-panel.tsx";
const legacyCockpitShrinkDoc =
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_V0_1.md";
const legacyCockpitShrinkSmoke =
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-v0-1.mjs";

const baselineSliceFiles = [
  typeFile,
  helperFile,
  runScriptFile,
  smokeFile,
  docFile,
  dogfoodDoc,
  metricsDoc,
  shrinkPlanDoc,
  classificationDoc,
  browserRegressionDoc,
  legacyCockpitShrinkDoc,
  agentWorkplaneDoc,
  indexDoc,
  packageJsonFile,
];

const existingSmokeAllowlistFiles = [
  "scripts/smoke-legacy-cockpit-local-control-classification-v0-1.mjs",
  "scripts/smoke-agent-workplane-run-postmortem-detail-v0-1.mjs",
  "scripts/smoke-agent-workplane-review-memory-detail-v0-1.mjs",
  "scripts/smoke-agent-workplane-bridge-trace-detail-v0-1.mjs",
  "scripts/smoke-workplane-native-browser-regression-v0-1.mjs",
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-plan-v0-1.mjs",
  "scripts/smoke-augnes-on-augnes-dogfood-v0-1.mjs",
  "scripts/smoke-runner-workplane-metrics-v0-1.mjs",
  "scripts/smoke-guidebrief-intent-projection-v0-1.mjs",
  "scripts/smoke-guide-workplane-debug-context-v0-1.mjs",
  "scripts/smoke-guide-brief-v0-1.mjs",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
  "scripts/smoke-agent-workplane-node-contract-v0-1.mjs",
  "scripts/smoke-workplane-runner-deltabatch-integration-v0-1.mjs",
  "scripts/smoke-agent-workplane-cockpit-inheritance-v0-1.mjs",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
  "scripts/smoke-autonomy-runner-v0-1.mjs",
  "types/legacy-cockpit-control-inventory.ts",
  "lib/workplane/legacy-cockpit-control-inventory.ts",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_CONTROL_INVENTORY_V0_1.md",
  "scripts/smoke-legacy-cockpit-control-inventory-v0-1.mjs",
  "docs/AGENT_WORKPLANE_REVIEW_MEMORY_DETAIL_V0_1.md",
  legacyCockpitShrinkSmoke,
];

const allowedChangedFiles = new Set([
  ...baselineSliceFiles,
  ...existingSmokeAllowlistFiles,
  agentWorkplaneFile,
  cockpitPageFile,
  legacyCompatibilityPanelFile,
  "docs/AGENT_WORKPLANE_COCKPIT_CAPABILITY_INVENTORY_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
  "lib/workplane/workplane-browser-regression.ts",
  "lib/workplane/legacy-cockpit-control-inventory.ts",
]);

const requiredFiles = [
  ...baselineSliceFiles,
  agentWorkplaneFile,
  augnesCockpitFile,
  cockpitPageFile,
  legacyCompatibilityPanelFile,
];

const requiredStatuses = [
  "passed",
  "partial",
  "needs_review",
  "blocked",
  "insufficient_data",
];

const requiredTrends = [
  "improving",
  "steady",
  "degrading",
  "insufficient_data",
  "unknown",
];

const requiredSignals = [
  "resume_latency",
  "review_burden",
  "delta_batch_quality",
  "guidebrief_debug_usefulness",
  "intent_projection_usefulness",
  "autonomy_yield",
  "stale_context_visibility",
  "cockpit_shrink_readiness",
  "browser_regression_stability",
  "local_control_classification_readiness",
];

const requiredAuthorityFields = [
  "can_write_product_db",
  "can_delete_legacy_cockpit",
  "can_shrink_legacy_cockpit",
  "can_hide_legacy_cockpit",
  "can_change_product_ui_behavior",
  "can_add_product_route",
  "can_add_api_write_route",
  "can_add_server_action",
  "can_call_provider_openai",
  "can_call_github",
  "can_actuate_github",
  "can_execute_codex",
  "can_execute_runner_in_product",
  "can_tick_runner_in_product",
  "can_recover_delta_batch_in_product",
  "can_schedule_runner_in_product",
  "can_record_proof",
  "can_create_evidence",
  "can_apply_durable_memory",
  "can_apply_perspective",
  "can_auto_apply_delta",
  "can_merge_publish_retry_replay_deploy",
  "can_absorb_local_write_control_without_contract",
  "can_create_temp_runner_fixture",
  "can_tick_temp_runner_fixture",
  "can_recover_temp_delta_batch_fixture",
  "can_write_temp_baseline_artifact",
];

const requiredTypeShapes = [
  "AUGNES_DOGFOOD_METRICS_BASELINE_VERSION",
  "AugnesDogfoodBaselineStatus",
  "AugnesDogfoodBaselineSignalStatus",
  "AugnesDogfoodBaselineIterationStatus",
  "AugnesDogfoodBaselineAuthorityBoundary",
  "AugnesDogfoodBaselineInput",
  "AugnesDogfoodBaselineIteration",
  "AugnesDogfoodBaselineMetricTrend",
  "AugnesDogfoodBaselineSignal",
  "AugnesDogfoodBaselineAggregate",
  "AugnesDogfoodBaselineReport",
  "iteration_model",
  "authority_boundary",
  "iterations",
  "aggregate",
  "recommended_next_reviews",
  "validation_summary",
];

const textByFile = loadTextByFile(requiredFiles);
const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const runScriptText = textByFile.get(runScriptFile);
const docText = textByFile.get(docFile);
const packageJsonText = textByFile.get(packageJsonFile);
const indexText = textByFile.get(indexDoc);
const dogfoodDocText = textByFile.get(dogfoodDoc);
const metricsDocText = textByFile.get(metricsDoc);
const shrinkPlanDocText = textByFile.get(shrinkPlanDoc);
const classificationDocText = textByFile.get(classificationDoc);
const browserRegressionDocText = textByFile.get(browserRegressionDoc);
const agentWorkplaneDocText = textByFile.get(agentWorkplaneDoc);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const legacyCompatibilityPanelText = textByFile.get(
  legacyCompatibilityPanelFile,
);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:augnes-dogfood-metrics-baseline-v0-2",
  expectedCommand:
    "node scripts/smoke-augnes-dogfood-metrics-baseline-v0-2.mjs",
});
assertPackageScript({
  packageJsonText,
  scriptName: "dogfood:augnes-metrics-baseline-v0-2",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/run-augnes-dogfood-metrics-baseline-v0-2.mjs",
});

assertDocsAndPointers();
assertTypeContract();
assertHelperStaticShape();
assertRunScriptStaticShape();
const behavior = assertBaselineBehavior();
assertCompatibilityStillRendered();
assertChangedFileBoundary();
assertNoSourceDeletion();
assertNoRouteOrAuthorityPathAdded();
assertNoProductComponentBehaviorFilesChanged();
assertNoLegacyCockpitDeletionOrShrink();

console.log(
  JSON.stringify(
    {
      smoke: "augnes-dogfood-metrics-baseline-v0-2",
      pass: true,
      type_exists: true,
      helper_exists: true,
      run_script_exists: true,
      doc_exists: true,
      package_scripts_checked: true,
      docs_backlinks_checked: true,
      required_statuses_checked: requiredStatuses,
      required_trends_checked: requiredTrends,
      required_signals_checked: requiredSignals,
      authority_fields_checked: requiredAuthorityFields,
      helper_exports_checked: true,
      deterministic_iteration_count: behavior.iteration_count,
      aggregate_report_path: behavior.aggregate_report_path,
      recovered_batch_ids: behavior.recovered_batch_ids,
      recovered_delta_counts: behavior.recovered_delta_counts,
      resume_latency_status: behavior.resume_latency.status,
      resume_latency_trend: behavior.resume_latency.trend,
      review_burden_status: behavior.review_burden.status,
      review_burden_trend: behavior.review_burden.trend,
      cockpit_shrink_readiness_status:
        behavior.cockpit_shrink_readiness_status,
      browser_regression_recommendation:
        behavior.browser_regression_recommendation,
      local_control_classification_status:
        behavior.local_control_classification_status,
      local_control_unknown_count: behavior.local_control_unknown_count,
      shrink_gated_checked: behavior.shrink_gated,
      compatibility_render_checked: true,
      no_product_component_behavior_files_changed: true,
      no_route_or_authority_path_added: true,
      no_source_deletion_checked: true,
      no_legacy_cockpit_deletion_or_shrink_checked: true,
      changed_files_allowed: [...allowedChangedFiles],
    },
    null,
    2,
  ),
);
console.log("PASS smoke:augnes-dogfood-metrics-baseline-v0-2");

function assertDocsAndPointers() {
  for (const [file, text] of [
    [indexDoc, indexText],
    [dogfoodDoc, dogfoodDocText],
    [metricsDoc, metricsDocText],
    [shrinkPlanDoc, shrinkPlanDocText],
    [classificationDoc, classificationDocText],
    [browserRegressionDoc, browserRegressionDocText],
    [agentWorkplaneDoc, agentWorkplaneDocText],
  ]) {
    assertContainsAll(text, [docFile], { label: file });
  }

  assertContainsAll(
    docText,
    [
      "Why Repeated Baseline Exists",
      "Why After Local Control Classification",
      "Why Before Any Shrink Candidate",
      "What The Baseline Harness Does",
      "What The Baseline Harness Does Not Do",
      "Iteration Model",
      "Aggregate Report Model",
      "Trend Model",
      "Signal Definitions",
      "Resume Latency",
      "Review Burden",
      "DeltaBatch Quality",
      "GuideBrief Debug Usefulness",
      "Intent Projection Usefulness",
      "Autonomy Yield",
      "Stale Context Visibility",
      "Browser Regression Stability",
      "Local Control Classification Readiness",
      "Why Shrink Remains Gated",
      "npm run dogfood:augnes-metrics-baseline-v0-2",
      "npm run smoke:augnes-dogfood-metrics-baseline-v0-2",
      "Output Report Shape",
      "Authority Boundary",
      "What Remains Blocked",
      "Recommended Next Phase",
      "No Legacy Cockpit functionality is deleted, hidden, or disabled",
      "explicit `/cockpit` compatibility route",
      "Future native absorption of retained local-write/manual controls requires a separate authority contract",
      "Baseline reports are evidence/signals, not shrink authority",
      "Browser regression, metrics, dogfood, and classification are evidence/signals, not shrink authority",
      "Local-write controls require a separate authority contract before native absorption",
      "no product route beyond the explicit `/cockpit` compatibility route",
      "no API write route is added",
      "no server action is added",
      "no chat composer is added",
      "no provider/OpenAI/GitHub/Codex execution is added",
      "no Codex launch, branch creation, PR creation, merge, publish, retry, replay, or deploy is added",
      "no runner execution is added to product UI",
      "no runner tick is added to product UI",
      "no runner recovery write is added to product UI",
      "no scheduled runner behavior is added",
      "no product DB write or persistence is added",
      "no proof/evidence write is added",
      "no durable memory apply is added",
      "no Perspective apply is added",
      "no delta auto-apply is added",
      "no localStorage/sessionStorage durable view mode is added",
      "no product UI action authority is added",
      "`delta_projection` / `perspective_delta`",
      "`projected_delta_batch` / `perspective_delta`",
      "`delta_batch` / `runner_delta_batch`",
      "browser_regression_passed_shrink_gated",
    ],
    { label: docFile },
  );
}

function assertTypeContract() {
  assertContainsAll(
    typeText,
    [
      ...requiredTypeShapes,
      ...requiredStatuses,
      ...requiredTrends,
      ...requiredSignals,
      ...requiredAuthorityFields,
      "report_version",
      "iteration_count",
      "recovered_batch_ids",
      "recovered_delta_counts",
      "metrics_status_sequence",
      "dogfood_readiness_sequence",
      "cockpit_shrink_readiness_sequence",
      "shrink_gated",
      "browser_regression_status",
      "browser_regression_recommendation",
      "local_control_classification_status",
      "local_control_unknown_count",
      "source_refs",
      "caveats",
    ],
    { label: typeFile },
  );

  for (const field of requiredAuthorityFields.slice(0, 23)) {
    assert(
      typeText.includes(`${field}: false`),
      `${typeFile} must type ${field} as false`,
    );
  }
}

function assertHelperStaticShape() {
  assertContainsAll(
    helperText,
    [
      "buildAugnesDogfoodMetricsBaselineReport",
      "runAugnesDogfoodMetricsBaseline",
      "aggregateAugnesDogfoodBaselineIterations",
      "buildEmptyAugnesDogfoodMetricsBaselineReport",
      "AUGNES_DOGFOOD_BASELINE_SIGNAL_IDS",
      "AUGNES_DOGFOOD_BASELINE_DEFAULT_ITERATIONS",
      "AUGNES_DOGFOOD_BASELINE_SMOKE_REFS",
      "AUGNES_DOGFOOD_BASELINE_REQUIRED_DOCS",
      "runAugnesDogfoodFixture",
      "buildWorkplaneBrowserRegressionReport",
      "buildLegacyCockpitLocalControlClassification",
      "process.env.AUGNES_DB_PATH",
      "augnes_dogfood_metrics_baseline_requires_output_dir",
      "can_create_temp_runner_fixture",
      "can_tick_temp_runner_fixture",
      "can_recover_temp_delta_batch_fixture",
      "can_write_temp_baseline_artifact",
      "can_write_product_db",
      "can_delete_legacy_cockpit",
      "can_shrink_legacy_cockpit",
      "can_hide_legacy_cockpit",
      "can_absorb_local_write_control_without_contract",
      "browser_regression_passed_shrink_gated",
      "Shrink remains gated",
      "Resume latency remains insufficient_data",
      "Review burden remains insufficient_data",
    ],
    { label: helperFile },
  );

  assert.match(
    helperText,
    /if\s*\(!input\.output_dir\)\s*\{[\s\S]*requires_output_dir/,
    "run helper must require explicit output_dir",
  );
  assert.match(
    helperText,
    /writeFileSync\(aggregatePath/,
    "helper must write aggregate only to explicit output_dir",
  );
  assert.doesNotMatch(helperText, /\bfetch\s*\(/, "helper must not fetch");
  assert.doesNotMatch(
    helperText,
    /api\.openai\.com|api\.github\.com|@octokit|OpenAI\(/,
    "helper must not add provider/GitHub/Codex clients",
  );
}

function assertRunScriptStaticShape() {
  assertContainsAll(
    runScriptText,
    [
      "mkdtempSync",
      "tmpdir()",
      "AUGNES_BASELINE_ITERATIONS",
      "AUGNES_BASELINE_OUTPUT_DIR",
      "AUGNES_BASELINE_BROWSER_REGRESSION_URL",
      "AUGNES_BASELINE_SKIP_BROWSER_REGRESSION",
      "runAugnesDogfoodMetricsBaseline",
      "version",
      "status",
      "iteration_count",
      "output_dir",
      "aggregate_report_path",
      "iteration_report_paths",
      "recovered_batch_ids",
      "recovered_delta_counts",
      "metrics_status_sequence",
      "dogfood_readiness_sequence",
      "cockpit_shrink_readiness_sequence",
      "resume_latency",
      "review_burden",
      "browser_regression_status",
      "recommendation",
      "authority_boundary_summary",
      "method: \"GET\"",
    ],
    { label: runScriptFile },
  );

  assert(!runScriptText.includes("npm run dev"), "script must not start dev server");
  assert(!/\bmethod:\s*["'](POST|PUT|PATCH|DELETE)["']/.test(runScriptText), "script must use GET only");
  assert(!/api\.openai\.com|api\.github\.com|@octokit|OpenAI\(/.test(runScriptText), "script must not call provider/GitHub/Codex clients");
}

function assertBaselineBehavior() {
  const tempDir = mkdtempSync(join(tmpdir(), "augnes-baseline-smoke-v0-2-"));
  const outputDir = join(tempDir, "baseline-output");
  const output = execFileSync(
    resolveRootBin("tsx"),
    ["--tsconfig", "tsconfig.json", runScriptFile],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        AUGNES_BASELINE_ITERATIONS: "2",
        AUGNES_BASELINE_OUTPUT_DIR: outputDir,
        AUGNES_BASELINE_SKIP_BROWSER_REGRESSION: "1",
      },
      shell: process.platform === "win32",
    },
  );
  const summary = JSON.parse(output);
  assert.equal(summary.version, "augnes_dogfood_metrics_baseline.v0.2");
  assert.equal(summary.iteration_count, 2);
  assert.equal(summary.output_dir, outputDir);
  assert(summary.aggregate_report_path.startsWith(outputDir));
  assert(existsSync(summary.aggregate_report_path), "aggregate report must exist");
  assert.equal(summary.resume_latency.status, "insufficient_data");
  assert.equal(summary.resume_latency.trend, "insufficient_data");
  assert.equal(summary.review_burden.status, "insufficient_data");
  assert.equal(summary.review_burden.trend, "insufficient_data");
  assert(summary.recovered_delta_counts.every((count) => count > 0));
  assert(summary.iteration_report_paths.every((file) => file.startsWith(outputDir)));

  const report = JSON.parse(readFileSync(summary.aggregate_report_path, "utf8"));
  assert.equal(report.iterations.length, 2);
  assert.equal(report.aggregate.shrink_gated, true);
  assert.equal(report.authority_boundary.can_write_product_db, false);
  assert.equal(report.authority_boundary.can_delete_legacy_cockpit, false);
  assert.equal(report.authority_boundary.can_shrink_legacy_cockpit, false);
  assert.equal(report.authority_boundary.can_hide_legacy_cockpit, false);
  assert.equal(report.authority_boundary.can_add_product_route, false);
  assert.equal(report.authority_boundary.can_add_api_write_route, false);
  assert.equal(report.authority_boundary.can_add_server_action, false);
  assert.equal(report.authority_boundary.can_call_provider_openai, false);
  assert.equal(report.authority_boundary.can_call_github, false);
  assert.equal(report.authority_boundary.can_execute_codex, false);
  assert.equal(report.authority_boundary.can_execute_runner_in_product, false);
  assert.equal(report.authority_boundary.can_tick_runner_in_product, false);
  assert.equal(
    report.authority_boundary.can_recover_delta_batch_in_product,
    false,
  );
  assert.equal(report.authority_boundary.can_schedule_runner_in_product, false);
  assert.equal(report.authority_boundary.can_record_proof, false);
  assert.equal(report.authority_boundary.can_create_evidence, false);
  assert.equal(report.authority_boundary.can_apply_durable_memory, false);
  assert.equal(report.authority_boundary.can_apply_perspective, false);
  assert.equal(report.authority_boundary.can_auto_apply_delta, false);
  assert.equal(
    report.authority_boundary.can_absorb_local_write_control_without_contract,
    false,
  );
  assert.equal(report.authority_boundary.can_create_temp_runner_fixture, true);
  assert.equal(report.authority_boundary.can_tick_temp_runner_fixture, true);
  assert.equal(
    report.authority_boundary.can_recover_temp_delta_batch_fixture,
    true,
  );
  assert.equal(report.authority_boundary.can_write_temp_baseline_artifact, true);
  assert(
    report.iterations.every((iteration) =>
      String(iteration.db_path).startsWith(outputDir),
    ),
    "iteration db paths must stay under explicit output dir",
  );
  assert(
    report.iterations.every((iteration) =>
      String(iteration.report_path).startsWith(outputDir),
    ),
    "iteration reports must stay under explicit output dir",
  );

  const signalStatuses = Object.fromEntries(
    report.aggregate.signals.map((signal) => [signal.signal_id, signal.status]),
  );
  const signalTrends = Object.fromEntries(
    report.aggregate.signals.map((signal) => [signal.signal_id, signal.trend]),
  );
  for (const signalId of requiredSignals) {
    assert(signalStatuses[signalId], `${signalId} must exist`);
    assert(signalTrends[signalId], `${signalId} trend must exist`);
  }
  assert.equal(signalStatuses.delta_batch_quality, "passed");
  assert.equal(signalStatuses.intent_projection_usefulness, "partial");
  assert.equal(signalStatuses.resume_latency, "insufficient_data");
  assert.equal(signalStatuses.review_burden, "insufficient_data");
  assert.equal(signalStatuses.cockpit_shrink_readiness, "needs_review");
  assert.equal(
    signalStatuses.local_control_classification_readiness,
    "needs_review",
  );
  assert(report.aggregate.local_control_unknown_count > 0);
  assert(report.aggregate.recommended_next_reviews.length > 0);
  assert(report.aggregate.caveats.length > 0);
  assert(report.aggregate.source_refs.length > 0);
  assert(
    report.iterations.every(
      (iteration) =>
        iteration.delta_batch_identity_separation
          .delta_projection_perspective_delta &&
        iteration.delta_batch_identity_separation
          .projected_delta_batch_perspective_delta &&
        iteration.delta_batch_identity_separation.delta_batch_runner_delta_batch,
    ),
    "DeltaBatch identity separation must stay true",
  );

  const browserBehavior = assertBrowserFixtureAggregate(summary.aggregate_report_path);

  return {
    iteration_count: summary.iteration_count,
    aggregate_report_path: summary.aggregate_report_path,
    recovered_batch_ids: summary.recovered_batch_ids,
    recovered_delta_counts: summary.recovered_delta_counts,
    resume_latency: summary.resume_latency,
    review_burden: summary.review_burden,
    cockpit_shrink_readiness_status:
      browserBehavior.cockpit_shrink_readiness_status,
    browser_regression_recommendation:
      browserBehavior.browser_regression_recommendation,
    local_control_classification_status:
      browserBehavior.local_control_classification_status,
    local_control_unknown_count: browserBehavior.local_control_unknown_count,
    shrink_gated: report.aggregate.shrink_gated,
  };
}

function assertBrowserFixtureAggregate(aggregateReportPath) {
  const fixtureHtml = buildWorkbenchFixtureHtml();
  const code = `
    import assert from "node:assert/strict";
    import { readFileSync } from "node:fs";
    import { buildAugnesDogfoodMetricsBaselineReport } from "./lib/dogfood/augnes-dogfood-metrics-baseline.ts";
    const base = JSON.parse(readFileSync(${JSON.stringify(aggregateReportPath)}, "utf8"));
    const report = buildAugnesDogfoodMetricsBaselineReport({
      iterations: base.iterations,
      browser_regression_html: ${JSON.stringify(fixtureHtml)},
      browser_regression_url: "http://127.0.0.1:3000/workbench"
    });
    const bySignal = Object.fromEntries(report.aggregate.signals.map((signal) => [signal.signal_id, signal]));
    assert.equal(report.aggregate.browser_regression_recommendation, "browser_regression_passed_shrink_gated");
    assert.equal(report.aggregate.shrink_gated, true);
    assert.equal(bySignal.browser_regression_stability.status, "passed");
    assert.equal(bySignal.resume_latency.status, "insufficient_data");
    assert.equal(bySignal.review_burden.status, "insufficient_data");
    assert.equal(bySignal.cockpit_shrink_readiness.status, "needs_review");
    assert.equal(bySignal.local_control_classification_readiness.status, "needs_review");
    assert(report.aggregate.local_control_unknown_count > 0);
    console.log(JSON.stringify({
      browser_regression_recommendation: report.aggregate.browser_regression_recommendation,
      cockpit_shrink_readiness_status: bySignal.cockpit_shrink_readiness.status,
      local_control_classification_status: report.aggregate.local_control_classification_status,
      local_control_unknown_count: report.aggregate.local_control_unknown_count
    }));
  `;
  return JSON.parse(
    execFileSync(
      process.execPath,
      ["--import", "tsx", "-e", code],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        shell: process.platform === "win32",
      },
    ),
  );
}

function buildWorkbenchFixtureHtml() {
  const sections = [
    '<section data-workplane-panel-id="work_queue" data-workplane-node-id="work_queue">Agent Workplane Work Brief source refs validation summary</section>',
    '<section data-workplane-panel-id="current_perspective" data-workplane-node-id="current_perspective">Current Perspective stale fallback Source Ref Bridge</section>',
    '<section data-workplane-panel-id="delta_projection" data-workplane-node-id="perspective_delta">Delta Projection native perspective delta</section>',
    '<section data-workplane-panel-id="projected_delta_batch" data-workplane-node-id="perspective_delta">Projected Delta Batch perspective delta reversible non-executable</section>',
    '<section data-workplane-panel-id="delta_batch" data-workplane-node-id="runner_delta_batch">Recovered Runner DeltaBatch runner_delta_batch validation status no runner execution no runner tick no DeltaBatch recovery</section>',
    '<section data-workplane-panel-id="review_queue" data-workplane-node-id="authority_validation_debug">Review Queue needs user judgment authority validation</section>',
    '<section data-workplane-panel-id="review_memory_detail" data-workplane-node-id="authority_validation_debug" data-workplane-review-memory-detail-panel="v0.1">Review / memory proposal detail durable memory review Perspective review validation required needs user judgment no durable memory apply no Perspective apply</section>',
    '<section data-workplane-panel-id="evidence_handoff" data-workplane-node-id="handoff_context">evidence refs handoff refs validation summary</section>',
    '<section data-workplane-panel-id="workplane_inspector" data-workplane-node-id="source_ref_bridge">Workplane Inspector Source Ref Bridge diagnostic refs source refs</section>',
    '<section data-workplane-panel-id="source_ref_bridge" data-workplane-node-id="source_ref_bridge" data-workplane-bridge-trace-detail-panel="v0.1">Source Ref Bridge Trace Bridge Bridge matrix validation summary evidence refs diagnostic refs</section>',
    '<section data-workplane-panel-id="projection_candidates" data-workplane-node-id="projection_candidates">projection candidates reversible not authority</section>',
    '<section data-workplane-panel-id="handoff_builder_preview" data-workplane-node-id="handoff_context">Handoff Builder preview no Codex execution</section>',
    '<section data-workplane-panel-id="run_postmortem" data-workplane-node-id="run_postmortem" data-workplane-run-postmortem-detail-panel="v0.1">Run Postmortem detail source-backed run postmortem run_id step refs event refs recovered DeltaBatch validation status source refs no runner execution no runner tick no DeltaBatch recovery</section>',
    '<section data-workplane-panel-id="trace_diagnostics" data-workplane-node-id="trace_bridge">Trace / Diagnostics Trace Bridge diagnostic refs evidence refs validation summary</section>',
    '<section data-guide-workplane-debug-panel="v0.1">GuideBrief Workplane Debug Context Observed Inferred Suggested Needs user judgment</section>',
    '<section data-guide-intent-projection-panel="v0.1">GuideBrief Intent Projection reversible non-executable</section>',
    '<section data-workplane-intent-mode-panel="v0.1">Workplane Intent Mode reversible non-executable</section>',
    '<section data-workplane-metrics-panel="v0.1">Runner / Workplane Metrics Metrics are signals not authority</section>',
    '<section data-workplane-panel-id="legacy_cockpit_compatibility" data-workplane-node-id="legacy_cockpit_compatibility" data-workplane-legacy-cockpit-shrink="workbench_full_mount_removed" data-workplane-legacy-cockpit-route="/cockpit">Legacy Cockpit route split Legacy Cockpit full mount was removed from /workbench Full Legacy Cockpit remains reachable at /cockpit Native Agent Workplane remains primary local UI controls</section>',
  ];
  return `<!doctype html><html><body><main>${sections.join("\n")}</main></body></html>`;
}

function assertCompatibilityStillRendered() {
  assert(existsSync(augnesCockpitFile), "components/augnes-cockpit.tsx must exist");
  assert(
    existsSync(legacyCompatibilityPanelFile),
    "components/workplane/legacy-cockpit-compatibility-panel.tsx must exist",
  );
  assertContainsAll(
    legacyCompatibilityPanelText,
    [
      'data-workplane-panel-id="legacy_cockpit_compatibility"',
      'data-workplane-node-id="legacy_cockpit_compatibility"',
      'data-workplane-legacy-cockpit-shrink="workbench_full_mount_removed"',
      'data-workplane-legacy-cockpit-route="/cockpit"',
      "Legacy Cockpit full mount was removed from /workbench",
    ],
    { label: legacyCompatibilityPanelFile },
  );
  assertContainsAll(
    agentWorkplaneText,
    ["LegacyCockpitCompatibilityPanel", "<" + "LegacyCockpitCompatibilityPanel />"],
    { label: agentWorkplaneFile },
  );
  assert(
    !agentWorkplaneText.includes("AugnesCockpit"),
    "agent-workplane.tsx must not import or render AugnesCockpit after route split",
  );
  assertContainsAll(textByFile.get(cockpitPageFile), [
    'import { ' + 'AugnesCockpit } from "@/components/augnes-cockpit"',
    "<" + "AugnesCockpit />",
  ]);
}

function assertChangedFileBoundary() {
  const files = changedAndUntrackedFiles();
  for (const file of files) {
    assert(
      allowedChangedFiles.has(file),
      `Unexpected dogfood metrics baseline changed or untracked file: ${file}`,
    );
  }
}

function assertNoSourceDeletion() {
  const deletedFiles = uniqueSorted([
    ...collectGitDiffFiles(["diff", "--name-only", "--diff-filter=D", "HEAD"])
      .files,
    ...collectGitDiffFiles([
      "diff",
      "--name-only",
      "--diff-filter=D",
      "origin/main...HEAD",
    ]).files,
  ]);
  assert.deepEqual(deletedFiles, [], "No source file deletion is allowed");
}

function assertNoRouteOrAuthorityPathAdded() {
  for (const file of changedAndUntrackedFiles()) {
    if (
      file === agentWorkplaneFile ||
      file === cockpitPageFile ||
      file === legacyCompatibilityPanelFile
    ) {
      continue;
    }
    assert(!/^app\/api\//.test(file), `No API route changes allowed: ${file}`);
    assert(
      !/^app\/.*route\.(ts|tsx|js|jsx)$/.test(file),
      `No route file changes allowed: ${file}`,
    );
    assert(
      !/^app\/.*actions?\.(ts|tsx|js|jsx)$/.test(file),
      `No server action file changes allowed: ${file}`,
    );
    assert(
      !/^components\/.*\.(tsx|ts)$/.test(file),
      `No product component behavior changes allowed: ${file}`,
    );
  }

  const implementationText = [helperText, runScriptText].join("\n");
  for (const [pattern, label] of [
    [/@openai|from\s+["'][^"']*openai/i, "OpenAI import"],
    [/\boctokit\b|@octokit|github\/rest/i, "GitHub client"],
    [/\bexecuteCodex\s*\(/i, "Codex execution"],
    [/\bcreateBranch\b|\bcreatePullRequest\b|\bopenPullRequest\b/i, "branch or PR creation"],
    [/\bapplyPerspective\s*\(/i, "Perspective apply"],
    [/\bapplyDurableMemory\s*\(/i, "durable memory apply"],
    [/\bautoApplyDelta\s*\(/i, "delta auto-apply"],
    [/\brecordProof\s*\(/i, "proof write"],
    [/\bcreateEvidence\b|\bcreateEvidenceRecord\s*\(/i, "evidence write"],
    [/\blocalStorage\b|\bsessionStorage\b/i, "durable browser view mode"],
    [/\bmethod:\s*["'](?:POST|PUT|PATCH|DELETE)["']/, "mutating HTTP method"],
  ]) {
    assert(!pattern.test(implementationText), `Baseline code must not add ${label}`);
  }
}

function assertNoProductComponentBehaviorFilesChanged() {
  const files = changedAndUntrackedFiles();
  assert(
    !files.includes(augnesCockpitFile),
    "components/augnes-cockpit.tsx must not be changed by this baseline slice",
  );
  assert(
    textByFile.get(augnesCockpitFile).includes("export function " + "AugnesCockpit"),
    "components/augnes-cockpit.tsx must keep exporting AugnesCockpit",
  );
}

function assertNoLegacyCockpitDeletionOrShrink() {
  const changedText = [docText, helperText, typeText].join("\n");
  assertContainsAll(changedText, [
    "can_delete_legacy_cockpit",
    "can_shrink_legacy_cockpit",
    "can_hide_legacy_cockpit",
    "No Legacy Cockpit functionality is deleted, hidden, or disabled",
    "explicit `/cockpit` compatibility route",
    "Future native absorption of retained local-write/manual controls requires a separate authority contract",
  ]);
  assert.doesNotMatch(
    helperText,
    /delete(?:OrShrink)?LegacyCockpit|shrinkLegacyCockpit|hideLegacyCockpit|removeLegacyCockpit/i,
    "baseline helper must not add Legacy Cockpit deletion, shrink, hide, or removal behavior",
  );
}

function changedAndUntrackedFiles() {
  return uniqueSorted([
    ...collectGitDiffFiles(["diff", "--name-only"]).files,
    ...collectGitDiffFiles(["diff", "--cached", "--name-only"]).files,
    ...getBaseRangeChangedFiles().files,
    ...collectUntrackedFiles(),
  ]);
}

function resolveRootBin(binName) {
  const executableName = process.platform === "win32" ? `${binName}.cmd` : binName;
  const binPath = join(process.cwd(), "node_modules", ".bin", executableName);
  assert(
    existsSync(binPath),
    `missing_root_bin:${binName}: run npm install from the repository root before running smoke:augnes-dogfood-metrics-baseline-v0-2`,
  );
  return binPath;
}
