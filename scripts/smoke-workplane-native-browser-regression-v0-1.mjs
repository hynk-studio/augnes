#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertPackageScript,
  collectGitDiffFiles,
  collectUntrackedFiles,
  getBaseRangeChangedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const typeFile = "types/workplane-browser-regression.ts";
const helperFile = "lib/workplane/workplane-browser-regression.ts";
const runScriptFile = "scripts/run-workplane-native-browser-regression-v0-1.mjs";
const smokeFile = "scripts/smoke-workplane-native-browser-regression-v0-1.mjs";
const docFile =
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md";
const packageJsonFile = "package.json";
const indexDoc = "docs/00_INDEX_LATEST.md";
const agentWorkplaneDoc = "docs/AGENT_WORKPLANE_V0_1.md";
const shrinkPlanDoc =
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md";
const dogfoodDoc = "docs/AUGNES_ON_AUGNES_DOGFOOD_V0_1.md";
const metricsDoc = "docs/AUGNES_WORKFLOW_METRICS_V0_1.md";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const augnesCockpitFile = "components/augnes-cockpit.tsx";
const legacyCompatibilityPanelFile =
  "components/workplane/legacy-cockpit-compatibility-panel.tsx";

const browserRegressionSliceFiles = [
  typeFile,
  helperFile,
  runScriptFile,
  smokeFile,
  docFile,
  packageJsonFile,
  indexDoc,
  agentWorkplaneDoc,
  shrinkPlanDoc,
  dogfoodDoc,
  metricsDoc,
];

const existingSmokeAllowlistFiles = [
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
];

const allowedChangedFiles = [
  ...browserRegressionSliceFiles,
  ...existingSmokeAllowlistFiles,
];

const requiredFiles = [
  ...browserRegressionSliceFiles,
  agentWorkplaneFile,
  augnesCockpitFile,
  legacyCompatibilityPanelFile,
];

const requiredStatuses = [
  "passed",
  "partial",
  "failed",
  "skipped",
  "blocked",
  "needs_review",
];

const requiredSurfaces = [
  "agent_workplane",
  "guidebrief_debug",
  "guidebrief_intent_projection",
  "workplane_metrics",
  "delta_projection",
  "projected_delta_batch",
  "runner_delta_batch",
  "legacy_cockpit_compatibility",
  "native_replacement",
  "shrink_readiness",
];

const requiredAuthorityFields = [
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
  "can_execute_runner",
  "can_tick_runner",
  "can_recover_delta_batch",
  "can_schedule_runner",
  "can_write_product_db",
  "can_record_proof",
  "can_create_evidence",
  "can_apply_durable_memory",
  "can_apply_perspective",
  "can_auto_apply_delta",
  "can_merge_publish_retry_replay_deploy",
];

const requiredReportFields = [
  "version",
  "status",
  "url",
  "checked_at",
  "source",
  "marker_checks",
  "section_checks",
  "no_control_checks",
  "capability_checks",
  "deltabatch_identity_checks",
  "deltabatch_identity_status",
  "legacy_compatibility_status",
  "no_control_status",
  "marker_summary",
  "capability_summary",
  "authority_boundary",
  "recommendation",
  "notes",
];

const requiredCapabilities = [
  "work_brief",
  "handoff",
  "perspective",
  "bridge",
  "operator_visibility",
  "work_run_visibility",
  "source_ref_visibility",
  "review_memory_proposal_visibility",
  "validation_smoke_visibility",
  "local_ui_controls",
];

const textByFile = loadTextByFile(requiredFiles);
const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const runScriptText = textByFile.get(runScriptFile);
const docText = textByFile.get(docFile);
const packageJsonText = textByFile.get(packageJsonFile);
const indexText = textByFile.get(indexDoc);
const agentWorkplaneDocText = textByFile.get(agentWorkplaneDoc);
const shrinkPlanDocText = textByFile.get(shrinkPlanDoc);
const dogfoodDocText = textByFile.get(dogfoodDoc);
const metricsDocText = textByFile.get(metricsDoc);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:workplane-native-browser-regression-v0-1",
  expectedCommand:
    "node scripts/smoke-workplane-native-browser-regression-v0-1.mjs",
});
assertPackageScript({
  packageJsonText,
  scriptName: "browser:workplane-native-regression-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/run-workplane-native-browser-regression-v0-1.mjs",
});

assertDocsAndPointers();
assertTypeContract();
assertHelperStaticShape();
assertRunScriptStaticShape();
const behavior = assertHelperBehavior();
assertCompatibilityStillRendered();
assertNoProductComponentBehaviorFilesChanged();
const changedFilesBoundary = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "workplane native browser regression v0.1",
});
assertNoSourceDeletion();
assertNoRouteOrAuthorityPathAdded();

console.log(
  JSON.stringify(
    {
      smoke: "workplane-native-browser-regression-v0-1",
      pass: true,
      type_exists: true,
      helper_exists: true,
      run_script_exists: true,
      doc_exists: true,
      package_scripts_checked: true,
      backlinks_checked: true,
      required_statuses_checked: requiredStatuses,
      required_surfaces_checked: requiredSurfaces,
      authority_fields_checked: requiredAuthorityFields,
      report_fields_checked: requiredReportFields,
      helper_exports_checked: true,
      fixture_report_status: behavior.full.status,
      fixture_recommendation_decision: behavior.full.recommendation.decision,
      missing_legacy_status: behavior.missingLegacy.status,
      identity_collision_status: behavior.identityCollision.status,
      mutation_control_status: behavior.mutationControl.status,
      capability_checks_checked: requiredCapabilities,
      deltabatch_identity_guard_checked: true,
      no_product_component_behavior_files_changed: true,
      legacy_cockpit_compatibility_retained_checked: true,
      no_route_or_authority_added_checked: true,
      no_source_deletion_checked: true,
      changed_files_boundary: changedFilesBoundary,
      changed_files_allowed: allowedChangedFiles,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:workplane-native-browser-regression-v0-1");

function assertDocsAndPointers() {
  for (const doc of [
    indexText,
    agentWorkplaneDocText,
    shrinkPlanDocText,
    dogfoodDocText,
    metricsDocText,
  ]) {
    assertContainsAll(doc, [docFile], {
      label: "browser regression backlink docs",
    });
  }

  assertContainsAll(
    docText,
    [
      "Why Browser Regression Exists",
      "Why it happens before any shrink candidate",
      "What It Validates",
      "What It Does Not Validate",
      "Server-Rendered HTML Fallback Model",
      "Optional Browser / CDP / Computer-Use Model",
      "Required Markers",
      "DeltaBatch Identity Separation",
      "No-Control Checks",
      "Capability Replacement Checks",
      "Recommendation Logic",
      "npm run browser:workplane-native-regression-v0-1",
      "npm run smoke:workplane-native-browser-regression-v0-1",
      "Output Report Shape",
      "Authority Boundary",
      "How This Feeds Shrink Review",
      "Not Implemented Yet",
      "Recommended Next Phase",
      "browser regression is evidence, not shrink authority",
      "Metrics are signals, not shrink authority",
      "Dogfood reports are evidence, not shrink authority",
      "No Legacy Cockpit functionality is deleted or shrunk",
      "No compatibility path is removed",
      "Future deletion requires a separate PR",
      "no route",
      "no API write route",
      "no server action",
      "no chat composer",
      "no provider/OpenAI/GitHub/Codex execution",
      "no Codex launch, branch creation, PR creation, merge, publish, retry, replay, or deploy",
      "no runner execution",
      "no runner tick",
      "no runner recovery write",
      "no scheduled runner behavior",
      "no product DB write or persistence",
      "no proof/evidence write",
      "no durable memory apply",
      "no Perspective apply",
      "no delta auto-apply",
      "no localStorage/sessionStorage durable view mode",
      "no product UI behavior change",
      'data-workplane-panel-id="legacy_cockpit_compatibility"',
      'data-workplane-panel-id="delta_projection"',
      'data-workplane-panel-id="projected_delta_batch"',
      'data-workplane-panel-id="delta_batch"',
      'data-guide-workplane-debug-panel="v0.1"',
      'data-guide-intent-projection-panel="v0.1"',
      'data-workplane-intent-mode-panel="v0.1"',
      'data-workplane-metrics-panel="v0.1"',
      "`delta_projection` / `perspective_delta`",
      "`projected_delta_batch` / `perspective_delta`",
      "`delta_batch` / `runner_delta_batch`",
    ],
    { label: docFile },
  );
}

function assertTypeContract() {
  assertContainsAll(
    typeText,
    [
      "WORKPLANE_BROWSER_REGRESSION_VERSION",
      "WorkplaneBrowserRegressionStatus",
      "WorkplaneBrowserRegressionCheckStatus",
      "WorkplaneBrowserRegressionSurface",
      "WorkplaneBrowserRegressionMarkerCheck",
      "WorkplaneBrowserRegressionSectionCheck",
      "WorkplaneBrowserRegressionNoControlCheck",
      "WorkplaneBrowserRegressionCapabilityCheck",
      "WorkplaneBrowserRegressionAuthorityBoundary",
      "WorkplaneBrowserRegressionInput",
      "WorkplaneBrowserRegressionReport",
      "WorkplaneBrowserRegressionRecommendation",
      ...requiredStatuses,
      ...requiredSurfaces,
      ...requiredAuthorityFields,
      ...requiredReportFields,
      ...requiredCapabilities,
    ],
    { label: typeFile },
  );

  for (const field of requiredAuthorityFields) {
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
      "buildWorkplaneBrowserRegressionReport",
      "parseWorkbenchHtmlForRegression",
      "buildEmptyWorkplaneBrowserRegressionReport",
      "WORKPLANE_BROWSER_REGRESSION_REQUIRED_MARKERS",
      "WORKPLANE_BROWSER_REGRESSION_DELTABATCH_IDENTITY_CHECKS",
      "WORKPLANE_BROWSER_REGRESSION_CAPABILITY_CHECKS",
      "WORKPLANE_BROWSER_REGRESSION_NO_CONTROL_SEGMENT_MARKERS",
      "Browser regression parses supplied HTML only.",
      "Browser regression is evidence, not shrink authority.",
      "Metrics are signals, not shrink authority.",
      "Dogfood reports are evidence, not shrink authority.",
      "delta_projection",
      "projected_delta_batch",
      "runner_delta_batch",
      "do_not_shrink",
      "browser_regression_passed_shrink_gated",
      "eligible_for_shrink_candidate_review",
    ],
    { label: helperFile },
  );

  assert(!/\bfetch\s*\(/.test(helperText), "helper must not fetch");
  assert(!/\bwriteFile|writeFileSync|appendFileSync\b/.test(helperText), "helper must not write files");
  assert(!/\blocalStorage|sessionStorage\b/.test(helperText), "helper must not use browser storage");
  assert(!/\bdocument\.|window\./.test(helperText), "helper must not require browser DOM APIs");
}

function assertRunScriptStaticShape() {
  assertContainsAll(
    runScriptText,
    [
      "AUGNES_BROWSER_REGRESSION_URL",
      "AUGNES_BROWSER_REGRESSION_OUTPUT_PATH",
      "http://127.0.0.1:3000/workbench",
      "method: \"GET\"",
      "buildWorkplaneBrowserRegressionReport",
      "if (outputPath)",
      "writeFileSync(outputPath",
      "server_rendered_html",
      "marker_counts",
      "capability_counts",
      "no_control_status",
      "legacy_compatibility_status",
      "deltabatch_identity_status",
      "recommendation",
    ],
    { label: runScriptFile },
  );

  assert(!runScriptText.includes("npm run dev"), "runner must not start the dev server");
  assert(!/\bmethod:\s*["'](POST|PUT|PATCH|DELETE)["']/.test(runScriptText), "runner must use GET only");
  assert(!/api\.openai\.com|api\.github\.com|@octokit|OpenAI\(/.test(runScriptText), "runner must not call provider/GitHub/Codex paths");
}

function assertHelperBehavior() {
  const fixtureHtml = buildFixtureHtml();
  const code = `
    import assert from "node:assert/strict";
    import { buildWorkplaneBrowserRegressionReport } from "./lib/workplane/workplane-browser-regression.ts";
    const fixture = ${JSON.stringify(fixtureHtml)};
    const full = buildWorkplaneBrowserRegressionReport({
      html: fixture,
      url: "http://127.0.0.1:3000/workbench",
      checked_at: "2026-07-02T00:00:00.000Z",
      metrics_status: "watch",
      dogfood_status: "needs_review",
      cockpit_shrink_readiness: "needs_review"
    });
    assert.equal(full.status, "partial");
    assert.equal(full.marker_summary.failed, 0);
    assert.equal(full.marker_summary.blocked, 0);
    assert.equal(full.legacy_compatibility_status, "passed");
    assert.equal(full.no_control_status, "passed");
    assert.equal(full.deltabatch_identity_status, "passed");
    assert.equal(full.recommendation.decision, "browser_regression_passed_shrink_gated");
    assert.equal(full.capability_checks.length, ${requiredCapabilities.length});
    for (const capabilityId of ${JSON.stringify(requiredCapabilities)}) {
      assert(full.capability_checks.some((check) => check.capability_id === capabilityId), capabilityId);
    }

    const missingLegacy = buildWorkplaneBrowserRegressionReport({
      html: fixture.replace(/data-workplane-panel-id="legacy_cockpit_compatibility"/g, "data-workplane-panel-id=\\"missing_legacy\\""),
      metrics_status: "watch",
      dogfood_status: "needs_review",
      cockpit_shrink_readiness: "needs_review"
    });
    assert.equal(missingLegacy.status, "blocked");
    assert.equal(missingLegacy.legacy_compatibility_status, "blocked");
    assert.equal(missingLegacy.recommendation.decision, "do_not_shrink");

    const identityCollision = buildWorkplaneBrowserRegressionReport({
      html: fixture.replace(
        /data-workplane-panel-id="delta_batch" data-workplane-node-id="runner_delta_batch"/g,
        "data-workplane-panel-id=\\"delta_batch\\" data-workplane-node-id=\\"perspective_delta\\""
      ),
      metrics_status: "watch",
      dogfood_status: "needs_review",
      cockpit_shrink_readiness: "needs_review"
    });
    assert.equal(identityCollision.status, "failed");
    assert.equal(identityCollision.deltabatch_identity_status, "failed");
    assert.equal(identityCollision.recommendation.decision, "do_not_shrink");

    const mutationControl = buildWorkplaneBrowserRegressionReport({
      html: fixture.replace(
        "GuideBrief Workplane Debug Context",
        "GuideBrief Workplane Debug Context <button>Apply</button>"
      ),
      metrics_status: "watch",
      dogfood_status: "needs_review",
      cockpit_shrink_readiness: "needs_review"
    });
    assert.equal(mutationControl.status, "failed");
    assert.equal(mutationControl.no_control_status, "failed");
    assert.equal(mutationControl.recommendation.decision, "do_not_shrink");
    console.log(JSON.stringify({ full, missingLegacy, identityCollision, mutationControl }));
  `;

  const output = execFileSync("node", ["--import", "tsx", "--eval", code], {
    encoding: "utf8",
  });
  return JSON.parse(output);
}

function buildFixtureHtml() {
  return `
    <main aria-label="Agent Workplane">Agent Workplane</main>
    <aside data-guide-workplane-debug-panel="v0.1">
      GuideBrief Workplane Debug Context
      <section>Observed</section>
      <section>Inferred</section>
      <section>Suggested</section>
      <section>Needs user judgment</section>
    </aside>
    <aside data-guide-intent-projection-panel="v0.1">
      GuideBrief Intent Projection reversible non-executable not authority
    </aside>
    <aside data-workplane-intent-mode-panel="v0.1">
      Workplane Intent Mode reversible view projection
    </aside>
    <section data-workplane-metrics-panel="v0.1">
      Runner / Workplane Metrics Metrics are signals, not authority
      <h3>Validation summary</h3>
    </section>
    <section data-workplane-panel-id="work_queue" data-workplane-node-id="current_objective">Work Queue</section>
    <section data-workplane-panel-id="current_perspective" data-workplane-node-id="current_perspective">Current Perspective</section>
    <section data-workplane-panel-id="delta_projection" data-workplane-node-id="perspective_delta">Delta Projection</section>
    <section data-workplane-panel-id="projected_delta_batch" data-workplane-node-id="perspective_delta">Projected Delta Batch</section>
    <section data-workplane-panel-id="delta_batch" data-workplane-node-id="runner_delta_batch">Recovered Runner DeltaBatch</section>
    <section data-workplane-panel-id="review_queue" data-workplane-node-id="authority_validation_debug">Review Queue Needs user judgment</section>
    <section data-workplane-panel-id="evidence_handoff" data-workplane-node-id="handoff_context">Evidence Handoff Validation summary</section>
    <section data-workplane-panel-id="workplane_inspector" data-workplane-node-id="source_ref_bridge">Source refs</section>
    <section data-workplane-panel-id="projection_candidates" data-workplane-node-id="perspective_delta">Projection Candidates</section>
    <section data-workplane-panel-id="handoff_builder_preview" data-workplane-node-id="handoff_context">Handoff Builder preview</section>
    <section data-workplane-panel-id="run_postmortem" data-workplane-node-id="run_postmortem">Run Postmortem</section>
    <section data-workplane-panel-id="trace_diagnostics" data-workplane-node-id="trace_bridge">Trace Diagnostics Validation summary</section>
    <section data-workplane-panel-id="legacy_cockpit_compatibility" data-workplane-node-id="legacy_cockpit_compatibility">Legacy Cockpit compatibility remains reachable</section>
  `;
}

function assertCompatibilityStillRendered() {
  assertContainsAll(
    agentWorkplaneText,
    [
      "LegacyCockpitCompatibilityPanel",
      "<LegacyCockpitCompatibilityPanel>",
      "<AugnesCockpit />",
      "</LegacyCockpitCompatibilityPanel>",
    ],
    { label: agentWorkplaneFile },
  );
  assertContainsAll(textByFile.get(legacyCompatibilityPanelFile), [
    'data-workplane-panel-id="legacy_cockpit_compatibility"',
    "Legacy Cockpit remains reachable",
  ]);
  assert(textByFile.get(augnesCockpitFile).includes("export function AugnesCockpit"));
}

function assertNoProductComponentBehaviorFilesChanged() {
  const changedFiles = observedChangedFiles();
  for (const file of changedFiles) {
    assert(
      !file.startsWith("components/") &&
        !file.startsWith("app/") &&
        !file.startsWith("lib/dogfood/") &&
        !file.startsWith("lib/metrics/") &&
        !file.startsWith("lib/guide/") &&
        !file.startsWith("lib/autonomy/"),
      `No product component/runtime behavior file changes allowed: ${file}`,
    );
  }
}

function assertNoRouteOrAuthorityPathAdded() {
  const changedFiles = observedChangedFiles();
  for (const file of changedFiles) {
    assert(!/^app\//.test(file), `No product route/page changes allowed: ${file}`);
    assert(!/^app\/api\//.test(file), `No API route changes allowed: ${file}`);
    assert(!/route\.(ts|tsx|js|jsx)$/.test(file), `No route file changes allowed: ${file}`);
    assert(!/^db\//.test(file), `No DB persistence changes allowed: ${file}`);
    assert(!/^migrations\//.test(file), `No migration changes allowed: ${file}`);
  }

  assert(!/server action/i.test(runScriptText.replace(/server-rendered/gi, "")), "runner must not add server actions");
  assert(!/api\.openai\.com|api\.github\.com|@octokit|createPullRequest|executeCodex/i.test(runScriptText), "runner must not add external execution paths");
  assert(!/tickAutonomyRun|recoverDeltaBatchForRun|runAutonomySchedulerWatch|runDueAutonomyRunsOnce/.test(runScriptText), "runner must not run runner behavior");
  assert(!/localStorage|sessionStorage/.test(runScriptText), "runner must not add durable browser mode");
}

function assertNoSourceDeletion() {
  for (const file of collectGitDiffFiles(["diff", "--name-only", "--diff-filter=D", "HEAD"]).files) {
    assert.fail(`No source deletion allowed: ${file}`);
  }
  const baseRangeDeleted = collectGitDiffFiles([
    "diff",
    "--name-only",
    "--diff-filter=D",
    "origin/main...HEAD",
  ]);
  for (const file of baseRangeDeleted.files) {
    assert.fail(`No broad source deletion allowed: ${file}`);
  }
}

function observedChangedFiles() {
  const workingTree = collectGitDiffFiles(["diff", "--name-only", "HEAD"]);
  const baseRange = getBaseRangeChangedFiles();
  const untracked = collectUntrackedFiles();
  return uniqueSorted([...workingTree.files, ...baseRange.files, ...untracked]);
}
