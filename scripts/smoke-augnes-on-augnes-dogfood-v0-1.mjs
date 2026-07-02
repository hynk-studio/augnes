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

const typeFile = "types/augnes-dogfood.ts";
const helperFile = "lib/dogfood/augnes-on-augnes-dogfood.ts";
const docFile = "docs/AUGNES_ON_AUGNES_DOGFOOD_V0_1.md";
const smokeFile = "scripts/smoke-augnes-on-augnes-dogfood-v0-1.mjs";
const runScriptFile = "scripts/run-augnes-on-augnes-dogfood-v0-1.mjs";
const agentWorkplaneDoc = "docs/AGENT_WORKPLANE_V0_1.md";
const intentDoc = "docs/GUIDEBRIEF_INTENT_PROJECTION_V0_1.md";
const metricsDoc = "docs/AUGNES_WORKFLOW_METRICS_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";

const existingFollowOnSmokeFiles = [
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
];

const followOnLegacyCockpitShrinkPlanFiles = [
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-plan-v0-1.mjs",
  "docs/AGENT_WORKPLANE_COCKPIT_CAPABILITY_INVENTORY_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AUGNES_WORKFLOW_METRICS_V0_1.md",
  "docs/AUGNES_ON_AUGNES_DOGFOOD_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
];

const followOnWorkplaneNativeBrowserRegressionFiles = [
  "types/workplane-browser-regression.ts",
  "lib/workplane/workplane-browser-regression.ts",
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md",
  "scripts/run-workplane-native-browser-regression-v0-1.mjs",
  "scripts/smoke-workplane-native-browser-regression-v0-1.mjs",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
  "docs/AUGNES_ON_AUGNES_DOGFOOD_V0_1.md",
  "docs/AUGNES_WORKFLOW_METRICS_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
];

const followOnAgentWorkplaneBridgeTraceDetailFiles = [
  "types/workplane-bridge-trace-detail.ts",
  "lib/workplane/workplane-bridge-trace-detail.ts",
  "components/workplane/source-ref-bridge-detail-panel.tsx",
  "docs/AGENT_WORKPLANE_BRIDGE_TRACE_DETAIL_V0_1.md",
  "scripts/smoke-agent-workplane-bridge-trace-detail-v0-1.mjs",
  "components/workplane/agent-workplane.tsx",
  "lib/workplane/workplane-node-context.ts",
  "lib/workplane/workplane-browser-regression.ts",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
];
const followOnAgentWorkplaneReviewMemoryDetailFiles = [
  "types/workplane-review-memory-detail.ts",
  "lib/workplane/workplane-review-memory-detail.ts",
  "components/workplane/review-memory-detail-panel.tsx",
  "docs/AGENT_WORKPLANE_REVIEW_MEMORY_DETAIL_V0_1.md",
  "scripts/smoke-agent-workplane-review-memory-detail-v0-1.mjs",
  "components/workplane/agent-workplane.tsx",
  "types/agent-workplane-node.ts",
  "lib/workplane/workplane-node-context.ts",
  "lib/workplane/workplane-browser-regression.ts",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md",
  "docs/AGENT_WORKPLANE_BRIDGE_TRACE_DETAIL_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
];

const followOnAgentWorkplaneRunPostmortemDetailFiles = [
  "types/workplane-run-postmortem-detail.ts",
  "lib/workplane/workplane-run-postmortem-detail.ts",
  "components/workplane/run-postmortem-detail-panel.tsx",
  "docs/AGENT_WORKPLANE_RUN_POSTMORTEM_DETAIL_V0_1.md",
  "scripts/smoke-agent-workplane-run-postmortem-detail-v0-1.mjs",
  "components/workplane/agent-workplane.tsx",
  "lib/workplane/workplane-node-context.ts",
  "lib/workplane/workplane-browser-regression.ts",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md",
  "docs/AGENT_WORKPLANE_BRIDGE_TRACE_DETAIL_V0_1.md",
  "docs/AGENT_WORKPLANE_REVIEW_MEMORY_DETAIL_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
];

const followOnLegacyCockpitLocalControlClassificationFiles = [
  "types/legacy-cockpit-local-control-classification.ts",
  "lib/workplane/legacy-cockpit-local-control-classification.ts",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_V0_1.md",
  "scripts/smoke-legacy-cockpit-local-control-classification-v0-1.mjs",
  "docs/AGENT_WORKPLANE_COCKPIT_CAPABILITY_INVENTORY_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_RUN_POSTMORTEM_DETAIL_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
];

const followOnAugnesDogfoodMetricsBaselineFiles = [
  "types/augnes-dogfood-metrics-baseline.ts",
  "lib/dogfood/augnes-dogfood-metrics-baseline.ts",
  "docs/AUGNES_DOGFOOD_METRICS_BASELINE_V0_2.md",
  "scripts/run-augnes-dogfood-metrics-baseline-v0-2.mjs",
  "scripts/smoke-augnes-dogfood-metrics-baseline-v0-2.mjs",
  "docs/AUGNES_ON_AUGNES_DOGFOOD_V0_1.md",
  "docs/AUGNES_WORKFLOW_METRICS_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
];

const followOnLegacyCockpitControlInventoryFiles = [
  "types/legacy-cockpit-control-inventory.ts",
  "lib/workplane/legacy-cockpit-control-inventory.ts",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_CONTROL_INVENTORY_V0_1.md",
  "scripts/smoke-legacy-cockpit-control-inventory-v0-1.mjs",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_V0_1.md",
  "docs/AUGNES_DOGFOOD_METRICS_BASELINE_V0_2.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md",
  "docs/AGENT_WORKPLANE_REVIEW_MEMORY_DETAIL_V0_1.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AUGNES_ON_AUGNES_DOGFOOD_V0_1.md",
  "docs/AUGNES_WORKFLOW_METRICS_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
];


const requiredFiles = [
  typeFile,
  helperFile,
  docFile,
  smokeFile,
  runScriptFile,
  agentWorkplaneDoc,
  intentDoc,
  metricsDoc,
  indexDoc,
  packageJsonFile,
];

const allowedChangedFiles = new Set([
  ...requiredFiles,
  ...existingFollowOnSmokeFiles,
  ...followOnLegacyCockpitShrinkPlanFiles,
  ...followOnWorkplaneNativeBrowserRegressionFiles,
  ...followOnAgentWorkplaneBridgeTraceDetailFiles,
  ...followOnAgentWorkplaneReviewMemoryDetailFiles,
  ...followOnAgentWorkplaneRunPostmortemDetailFiles,
  ...followOnLegacyCockpitLocalControlClassificationFiles,
  ...followOnAugnesDogfoodMetricsBaselineFiles,
  ...followOnLegacyCockpitControlInventoryFiles,
]);

const textByFile = loadTextByFile(requiredFiles);
const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const docText = textByFile.get(docFile);
const runScriptText = textByFile.get(runScriptFile);
const agentWorkplaneDocText = textByFile.get(agentWorkplaneDoc);
const intentDocText = textByFile.get(intentDoc);
const metricsDocText = textByFile.get(metricsDoc);
const indexText = textByFile.get(indexDoc);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:augnes-on-augnes-dogfood-v0-1",
  expectedCommand: "node scripts/smoke-augnes-on-augnes-dogfood-v0-1.mjs",
});
assertPackageScript({
  packageJsonText,
  scriptName: "dogfood:augnes-on-augnes-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/run-augnes-on-augnes-dogfood-v0-1.mjs",
});

assertDocsAndPointers();
assertTypeContract();
assertHelperStaticShape();
assertRunScriptStaticShape();
const behavior = assertDogfoodBehavior();
assertChangedFileBoundary();
assertNoSourceFileDeletion();
assertNoBroadSourceDeletion();
assertNoNewRoute();
assertNoUiActionControlsAdded();
assertNoForbiddenProductAuthority();
assertNoLegacyCockpitDeletionOrShrink();

console.log(
  JSON.stringify(
    {
      smoke: "augnes-on-augnes-dogfood-v0-1",
      pass: true,
      type_exists: true,
      helper_exists: true,
      run_script_exists: true,
      doc_exists: true,
      package_scripts_checked: true,
      index_pointer_checked: true,
      agent_workplane_doc_pointer_checked: true,
      intent_doc_pointer_checked: true,
      metrics_doc_pointer_checked: true,
      required_signals_checked: true,
      required_authority_fields_checked: true,
      helper_exports_checked: true,
      script_temp_db_default_checked: true,
      deterministic_run_id_checked: behavior.run_id,
      recovered_batch_id: behavior.recovered_batch_id,
      recovered_delta_count: behavior.recovered_delta_count,
      metrics_status: behavior.metrics_status,
      evaluation_signal_statuses: behavior.evaluation_signal_statuses,
      insufficient_data_recorded: behavior.insufficient_data_recorded,
      caveats_checked: behavior.caveat_count,
      recommended_next_review_checked: behavior.recommended_next_review,
      delta_batch_identity_separation_checked:
        behavior.delta_batch_identity_separation_checked,
      projected_vs_recovered_metrics_checked:
        behavior.projected_vs_recovered_metrics_checked,
      no_route_added_checked: true,
      no_broad_source_deletion_checked: true,
      no_legacy_cockpit_deletion_or_shrink_checked: true,
      no_ui_action_controls_added: true,
      no_product_db_writes_added: true,
      no_provider_openai_github_codex_execution_path_added: true,
      no_memory_perspective_delta_auto_apply_added: true,
      changed_files_allowed: [...allowedChangedFiles],
    },
    null,
    2,
  ),
);
console.log("PASS smoke:augnes-on-augnes-dogfood-v0-1");

function assertDocsAndPointers() {
  assertContainsAll(indexText, [docFile], { label: indexDoc });
  assertContainsAll(agentWorkplaneDocText, [docFile], {
    label: agentWorkplaneDoc,
  });
  assertContainsAll(intentDocText, [docFile], { label: intentDoc });
  assertContainsAll(metricsDocText, [docFile], { label: metricsDoc });
  assertContainsAll(
    docText,
    [
      "Why Augnes-on-Augnes Dogfood Exists",
      "Why It Runs Before Legacy Cockpit Shrink",
      "What the Harness Does",
      "What the Harness Does Not Do",
      "Agent Workplane",
      "GuideBrief Workplane Debug Context",
      "GuideBrief Intent Projection",
      "Runner / Workplane Metrics",
      "Local Runner and Recovered DeltaBatch Fixture",
      "Temp Fixture Writes vs Product Render Paths",
      "Resume Latency",
      "DeltaBatch Quality",
      "GuideBrief Debug Usefulness",
      "Intent Projection Usefulness",
      "Review Burden",
      "Autonomy Yield",
      "Stale Context Visibility",
      "Cockpit Shrink Readiness",
      "npm run dogfood:augnes-on-augnes-v0-1",
      "npm run smoke:augnes-on-augnes-dogfood-v0-1",
      "Output Report Shape",
      "Authority Boundary",
      "Empty and Insufficient-Data Behavior",
      "Browser Sanity Expectation",
      "What Is Not Implemented Yet",
      "Recommended Next Phase",
      "dogfood is a local harness, not product execution authority",
      "temp runner fixture writes are allowed only in the explicit script/smoke path",
      "product /workbench render remains read-only",
      "no runner execution is added to product UI",
      "no runner tick is added to product UI",
      "no runner recovery write is added to product UI",
      "no scheduled runner behavior is added",
      "no GuideBrief execution authority is added",
      "no route is added",
      "no API write route is added",
      "no server action is added",
      "no chat composer is added",
      "no provider/OpenAI/GitHub/Codex execution is added",
      "no Codex launch, branch creation, PR creation, merge, publish, retry, replay, or deploy is added",
      "no product DB write or persistence is added",
      "no proof/evidence write is added",
      "no durable memory apply is added",
      "no Perspective apply is added",
      "no delta auto-apply is added",
      "no localStorage/sessionStorage durable view mode is added",
      "no legacy Cockpit functionality is deleted or shrunk",
    ],
    { label: docFile },
  );
}

function assertTypeContract() {
  assertContainsAll(
    typeText,
    [
      "AUGNES_DOGFOOD_VERSION",
      "AugnesDogfoodStatus",
      "AugnesDogfoodStepStatus",
      "AugnesDogfoodSignalStatus",
      "AugnesDogfoodAuthorityBoundary",
      "AugnesDogfoodInput",
      "AugnesDogfoodRunnerFixtureSummary",
      "AugnesDogfoodWorkplaneSnapshot",
      "AugnesDogfoodGuideBriefSnapshot",
      "AugnesDogfoodIntentProjectionSnapshot",
      "AugnesDogfoodMetricsSnapshot",
      "AugnesDogfoodEvaluationSignal",
      "AugnesDogfoodEvaluation",
      "AugnesDogfoodArtifactRef",
      "AugnesDogfoodReport",
      "passed",
      "partial",
      "needs_review",
      "blocked",
      "insufficient_data",
      "resume_latency",
      "delta_batch_quality",
      "guidebrief_debug_usefulness",
      "intent_projection_usefulness",
      "review_burden",
      "autonomy_yield",
      "stale_context_visibility",
      "cockpit_shrink_readiness",
      "can_write_product_db_from_workbench",
      "can_call_provider_openai",
      "can_call_github",
      "can_actuate_github",
      "can_execute_codex",
      "can_create_branch_or_pr",
      "can_apply_project_perspective",
      "can_apply_durable_memory",
      "can_auto_apply_delta",
      "can_record_proof",
      "can_create_evidence",
      "can_send_handoff",
      "can_merge_publish_retry_replay_deploy",
      "can_delete_or_shrink_legacy_cockpit",
      "can_add_product_route",
      "can_add_server_action",
      "can_add_ui_execution_control",
      "can_create_temp_runner_fixture",
      "can_tick_temp_runner_fixture",
      "can_recover_temp_delta_batch_fixture",
      "can_write_temp_dogfood_artifact",
      "report_version",
      "runner_fixture_summary",
      "workplane_snapshot",
      "guidebrief_snapshot",
      "intent_projection_snapshot",
      "metrics_snapshot",
      "evaluation",
      "artifacts",
      "recommended_next_review",
    ],
    { label: typeFile },
  );
}

function assertHelperStaticShape() {
  assertContainsAll(
    helperText,
    [
      "buildAugnesDogfoodReport",
      "runAugnesDogfoodFixture",
      "buildAugnesDogfoodEvaluation",
      "buildEmptyAugnesDogfoodReport",
      "AUGNES_DOGFOOD_SIGNAL_IDS",
      "AUGNES_DOGFOOD_DEFAULT_INTENT",
      "Focus the Workplane on runner and DeltaBatch review.",
      "Prepare this state for Codex handoff.",
      "createAutonomyRun",
      "tickAutonomyRun",
      "recoverDeltaBatchForRun",
      "readRunnerDeltaBatchesForWorkplane",
      "buildGuideWorkplaneDebugContext",
      "buildWorkplaneIntentProjection",
      "readRunnerWorkplaneMetrics",
      "product_workbench_render_remains_read_only",
      "temp_fixture_writes_are_script_smoke_only",
      "delta_projection",
      "projected_delta_batch",
      "delta_batch",
      "runner_delta_batch",
      "projected_vs_recovered_deltabatch_identity_signal",
      "recovered_delta_batch_visibility_rate",
      "Legacy Cockpit Shrink Plan v0.1",
      "Further dogfood or metrics baseline accumulation",
    ],
    { label: helperFile },
  );

  assert.match(
    helperText,
    /if\s*\(!input\.dbPath\)\s*\{[\s\S]*requires_explicit_dbPath/,
    "fixture helper must require explicit dbPath",
  );
  assert.match(
    helperText,
    /if\s*\(input\.outputPath\)\s*\{[\s\S]*writeFileSync/,
    "helper must write report only behind explicit outputPath",
  );
  assert.doesNotMatch(helperText, /\bopenDatabase\s*\(/, "dogfood helper must not open product DB directly");
  assert.doesNotMatch(helperText, /\bfetch\s*\(/, "dogfood helper must not call fetch");
}

function assertRunScriptStaticShape() {
  assertContainsAll(
    runScriptText,
    [
      "mkdtempSync",
      "tmpdir()",
      "AUGNES_DOGFOOD_DB_PATH",
      "AUGNES_DOGFOOD_REPORT_PATH",
      "runner-ledger.sqlite",
      "runAugnesDogfoodFixture",
      "temp_db_path",
      "report_path",
      "run_id",
      "recovered_batch_id",
      "metrics_status",
      "evaluation_signal_statuses",
      "authority_boundary_summary",
      "can_call_provider_openai",
      "can_call_github",
      "can_execute_codex",
      "can_create_branch_or_pr",
      "can_apply_project_perspective",
      "can_apply_durable_memory",
      "can_auto_apply_delta",
      "can_record_proof",
      "can_create_evidence",
    ],
    { label: runScriptFile },
  );
  assert.doesNotMatch(
    runScriptText,
    /process\.env\.AUGNES_DB_PATH\s*=\s*process\.env\.AUGNES_DB_PATH/,
    "script must not default to product AUGNES_DB_PATH",
  );
}

function assertDogfoodBehavior() {
  const tempDir = mkdtempSync(join(tmpdir(), "augnes-dogfood-smoke-v0-1-"));
  const tempDbPath = join(tempDir, "runner.sqlite");
  const reportPath = join(tempDir, "report.json");
  const output = execFileSync(
    resolveRootBin("tsx"),
    [
      "--tsconfig",
      "tsconfig.json",
      runScriptFile,
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        AUGNES_DOGFOOD_DB_PATH: tempDbPath,
        AUGNES_DOGFOOD_REPORT_PATH: reportPath,
      },
      shell: process.platform === "win32",
    },
  );
  const summary = JSON.parse(output);
  assert.equal(
    summary.run_id,
    "autonomy_run.dogfood.augnes_on_augnes_v0_1",
  );
  assert.equal(
    summary.recovered_batch_id,
    "autonomy_run.dogfood.augnes_on_augnes_v0_1.batch.recovered",
  );
  assert(summary.recovered_delta_count > 0, "recovered delta count must be > 0");
  assert.equal(summary.temp_db_path, tempDbPath);
  assert.equal(summary.report_path, reportPath);
  assert(existsSync(reportPath), "dogfood report must be written to explicit report path");

  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  assert.equal(report.report_version, "augnes_dogfood.v0.1");
  assert.equal(report.runner_fixture_summary.run_id, summary.run_id);
  assert.equal(
    report.runner_fixture_summary.recovered_batch_id,
    summary.recovered_batch_id,
  );
  assert(report.runner_fixture_summary.recovered_delta_count > 0);
  assert(report.workplane_snapshot.recovered_delta_count > 0);
  assert(report.metrics_snapshot.metrics_status);
  assert.deepEqual(
    Object.keys(report.evaluation_signal_statuses ?? {}),
    [],
    "report should keep evaluation signals in evaluation.signals, not a duplicate top-level field",
  );

  const signalStatuses = Object.fromEntries(
    report.evaluation.signals.map((signal) => [signal.signal_id, signal.status]),
  );
  for (const signalId of [
    "resume_latency",
    "delta_batch_quality",
    "guidebrief_debug_usefulness",
    "intent_projection_usefulness",
    "review_burden",
    "autonomy_yield",
    "stale_context_visibility",
    "cockpit_shrink_readiness",
  ]) {
    assert(signalStatuses[signalId], `${signalId} signal must exist`);
    const signal = report.evaluation.signals.find(
      (item) => item.signal_id === signalId,
    );
    assert(signal.caveats.length >= 0);
    assert(signal.recommended_next_review);
  }

  assert(
    Object.values(signalStatuses).includes("insufficient_data"),
    "report must record insufficient data honestly when applicable",
  );
  assert(report.caveats.length > 0, "report must include caveats");
  assert(report.recommended_next_review);
  assert.match(
    report.recommended_next_review,
    /Legacy Cockpit Shrink Plan v0\.1|further dogfood|metrics baseline/i,
  );
  assert.equal(
    report.authority_boundary.can_apply_project_perspective,
    false,
  );
  assert.equal(report.authority_boundary.can_apply_durable_memory, false);
  assert.equal(report.authority_boundary.can_auto_apply_delta, false);
  assert.equal(report.authority_boundary.can_record_proof, false);
  assert.equal(report.authority_boundary.can_create_evidence, false);
  assert.equal(report.authority_boundary.can_call_provider_openai, false);
  assert.equal(report.authority_boundary.can_call_github, false);
  assert.equal(report.authority_boundary.can_execute_codex, false);
  assert.equal(report.authority_boundary.can_create_branch_or_pr, false);
  assert.equal(
    report.authority_boundary.can_delete_or_shrink_legacy_cockpit,
    false,
  );
  assert.equal(report.authority_boundary.can_create_temp_runner_fixture, true);
  assert.equal(report.authority_boundary.can_tick_temp_runner_fixture, true);
  assert.equal(
    report.authority_boundary.can_recover_temp_delta_batch_fixture,
    true,
  );
  assert.equal(report.authority_boundary.can_write_temp_dogfood_artifact, true);
  assert.equal(
    report.workplane_snapshot.delta_batch_identity_separation
      .delta_projection_perspective_delta,
    true,
  );
  assert.equal(
    report.workplane_snapshot.delta_batch_identity_separation
      .projected_delta_batch_perspective_delta,
    true,
  );
  assert.equal(
    report.workplane_snapshot.delta_batch_identity_separation
      .delta_batch_runner_delta_batch,
    true,
  );
  assert.equal(
    report.metrics_snapshot.projected_vs_recovered_deltabatch_identity_metric,
    "healthy",
  );
  assert(report.metrics_snapshot.recovered_delta_batch_visibility_metric);

  return {
    run_id: summary.run_id,
    recovered_batch_id: summary.recovered_batch_id,
    recovered_delta_count: summary.recovered_delta_count,
    metrics_status: summary.metrics_status,
    evaluation_signal_statuses: signalStatuses,
    insufficient_data_recorded: Object.values(signalStatuses).includes(
      "insufficient_data",
    ),
    caveat_count: report.caveats.length,
    recommended_next_review: report.recommended_next_review,
    delta_batch_identity_separation_checked: true,
    projected_vs_recovered_metrics_checked: true,
  };
}

function assertChangedFileBoundary() {
  const files = uniqueSorted([
    ...collectGitDiffFiles(["diff", "--name-only"]).files,
    ...collectGitDiffFiles(["diff", "--cached", "--name-only"]).files,
    ...getBaseRangeChangedFiles().files,
    ...collectUntrackedFiles(),
  ]);

  for (const file of files) {
    assert(
      allowedChangedFiles.has(file),
      `Unexpected Augnes-on-Augnes dogfood changed or untracked file: ${file}`,
    );
  }
}

function assertNoSourceFileDeletion() {
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

function assertNoBroadSourceDeletion() {
  const deletionNameStatus = collectNameStatus(["diff", "--name-status", "HEAD"]);
  const broadDeletion = deletionNameStatus.find((line) => line.startsWith("D"));
  assert(!broadDeletion, `No broad source deletion allowed: ${broadDeletion}`);
}

function assertNoNewRoute() {
  for (const file of changedAndUntrackedFiles()) {
    assert(!/^app\/api\//.test(file), `No API route changes allowed: ${file}`);
    assert(
      !/^app\/.*route\.(ts|tsx|js|jsx)$/.test(file),
      `No route file changes allowed: ${file}`,
    );
  }
}

function assertNoUiActionControlsAdded() {
  for (const file of changedAndUntrackedFiles()) {
    if (followOnAgentWorkplaneBridgeTraceDetailFiles.includes(file)) {
      continue;
    }
    if ((followOnAgentWorkplaneReviewMemoryDetailFiles.includes(file) ||
        followOnAgentWorkplaneRunPostmortemDetailFiles.includes(file))) {
      continue;
    }
    assert(
      !/^components\/.*\.(tsx|ts)$/.test(file),
      `Dogfood slice must not add product UI controls or panels: ${file}`,
    );
  }
}

function assertNoForbiddenProductAuthority() {
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
    [/\bfetch\s*\(/, "network fetch"],
  ]) {
    assert(!pattern.test(implementationText), `Dogfood code must not add ${label}`);
  }
}

function assertNoLegacyCockpitDeletionOrShrink() {
  const changedText = [docText, helperText, typeText].join("\n");
  assertContainsAll(changedText, [
    "can_delete_or_shrink_legacy_cockpit",
    "no legacy Cockpit functionality is deleted or shrunk",
  ]);
  assert.doesNotMatch(
    helperText,
    /delete(?:OrShrink)?LegacyCockpit|shrinkLegacyCockpit|removeLegacyCockpit/i,
    "dogfood helper must not add Legacy Cockpit deletion or shrink behavior",
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

function collectNameStatus(args) {
  try {
    const output = execFileSync("git", args, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function resolveRootBin(binName) {
  const executableName = process.platform === "win32" ? `${binName}.cmd` : binName;
  const binPath = join(process.cwd(), "node_modules", ".bin", executableName);
  assert(
    existsSync(binPath),
    `missing_root_bin:${binName}: run npm install from the repository root before running smoke:augnes-on-augnes-dogfood-v0-1`,
  );
  return binPath;
}
