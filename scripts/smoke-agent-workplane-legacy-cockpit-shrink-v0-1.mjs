#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertPackageScript,
  collectGitDiffFiles,
  loadTextByFile,
} from "./smoke-boundary-common.mjs";

const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const legacyCompatibilityPanelFile =
  "components/workplane/legacy-cockpit-compatibility-panel.tsx";
const augnesCockpitFile = "components/augnes-cockpit.tsx";
const cockpitPageFile = "app/cockpit/page.tsx";
const shrinkDoc = "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_V0_1.md";
const remainingCapabilityMigrationDoc =
  "docs/LEGACY_COCKPIT_REMAINING_CAPABILITY_MIGRATION_V0_1.md";
const shrinkPlanDoc =
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md";
const browserRegressionDoc =
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md";
const routeRemovalDoc = "docs/COCKPIT_ROUTE_REMOVAL_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile =
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-v0-1.mjs";
const runtimeSmokeFile =
  "scripts/smoke-agent-workplane-legacy-cockpit-runtime-check-v0-1.mjs";
const remainingCapabilityMigrationSmokeFile =
  "scripts/smoke-legacy-cockpit-remaining-capability-migration-v0-1.mjs";

const followOnWorkplaneStateProposalReviewFiles = [
  "types/workplane-state-proposal-review.ts",
  "lib/workplane/workplane-state-proposal-review.ts",
  "components/workplane/state-proposal-review-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "types/agent-workplane-node.ts",
  "lib/workplane/workplane-node-context.ts",
  "docs/WORKPLANE_STATE_PROPOSAL_REVIEW_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "docs/LEGACY_COCKPIT_REMAINING_CAPABILITY_MIGRATION_V0_1.md",
  "docs/BLANK_STATE_REVIEW_ENTRY_ABSORPTION_V0_1.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_V0_1.md",
  "docs/AGENT_WORKPLANE_NODE_CONTRACT_V0_1.md",
  "package.json",
  "scripts/smoke-workplane-state-proposal-review-v0-1.mjs",
  "scripts/smoke-agent-workplane-node-contract-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-review-memory-detail-v0-1.mjs",
  "scripts/smoke-blank-state-review-entry-absorption-v0-1.mjs",
  "scripts/smoke-legacy-cockpit-remaining-capability-migration-v0-1.mjs",
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-v0-1.mjs",
];

const followOnCockpitManualControlsMigrationFiles = [
  "types/cockpit-manual-controls-migration.ts",
  "lib/workplane/cockpit-manual-controls-migration.ts",
  "types/workplane-state-proposal-review.ts",
  "lib/workplane/workplane-state-proposal-review.ts",
  "components/workplane/state-proposal-review-panel.tsx",
  "docs/COCKPIT_MANUAL_CONTROLS_MIGRATION_V0_1.md",
  "docs/WORKPLANE_STATE_PROPOSAL_REVIEW_V0_1.md",
  "docs/LEGACY_COCKPIT_REMAINING_CAPABILITY_MIGRATION_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_V0_1.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
  "scripts/smoke-cockpit-manual-controls-migration-v0-1.mjs",
  "scripts/smoke-workplane-state-proposal-review-v0-1.mjs",
  "scripts/smoke-legacy-cockpit-remaining-capability-migration-v0-1.mjs",
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-v0-1.mjs",
  "scripts/smoke-blank-state-review-entry-absorption-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
];

const followOnCockpitRouteRemovalReadinessFiles = [
  "types/cockpit-route-removal-readiness.ts",
  "lib/workplane/cockpit-route-removal-readiness.ts",
  "docs/COCKPIT_ROUTE_REMOVAL_READINESS_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "docs/LEGACY_COCKPIT_REMAINING_CAPABILITY_MIGRATION_V0_1.md",
  "docs/COCKPIT_MANUAL_CONTROLS_MIGRATION_V0_1.md",
  "docs/WORKPLANE_STATE_PROPOSAL_REVIEW_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_V0_1.md",
  "package.json",
  "scripts/smoke-cockpit-route-removal-readiness-v0-1.mjs",
  "scripts/smoke-cockpit-manual-controls-migration-v0-1.mjs",
  "scripts/smoke-workplane-state-proposal-review-v0-1.mjs",
  "scripts/smoke-legacy-cockpit-remaining-capability-migration-v0-1.mjs",
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-v0-1.mjs",
  "scripts/smoke-blank-state-review-entry-absorption-v0-1.mjs",
];

const followOnCockpitRouteRemovalFiles = [
  "docs/COCKPIT_ROUTE_REMOVAL_V0_1.md",
  "docs/COCKPIT_ROUTE_REMOVAL_READINESS_V0_1.md",
  "docs/COCKPIT_MANUAL_CONTROLS_MIGRATION_V0_1.md",
  "docs/WORKPLANE_STATE_PROPOSAL_REVIEW_V0_1.md",
  "docs/AGENT_WORKPLANE_COCKPIT_CAPABILITY_INVENTORY_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
  "docs/AGENT_WORKPLANE_NODE_CONTRACT_V0_1.md",
  "lib/guide/workplane-intent-projection.ts",
  "lib/metrics/runner-workplane-metrics.ts",
  "lib/workplane/workplane-bridge-trace-detail.ts",
  "lib/workplane/workplane-browser-regression.ts",
  "lib/workplane/workplane-review-memory-detail.ts",
  "lib/workplane/workplane-run-postmortem-detail.ts",
  "types/workplane-bridge-trace-detail.ts",
  "types/workplane-browser-regression.ts",
  "scripts/smoke-cockpit-route-removal-v0-1.mjs",
  "scripts/run-cockpit-route-removal-runtime-check-v0-1.mjs",
  "scripts/smoke-cockpit-route-removal-readiness-v0-1.mjs",
  "scripts/smoke-cockpit-manual-controls-migration-v0-1.mjs",
  "scripts/smoke-workplane-state-proposal-review-v0-1.mjs",
];

const allowedChangedFiles = [
  agentWorkplaneFile,
  legacyCompatibilityPanelFile,
  cockpitPageFile,
  augnesCockpitFile,
  shrinkDoc,
  remainingCapabilityMigrationDoc,
  shrinkPlanDoc,
  browserRegressionDoc,
  "lib/workplane/workplane-browser-regression.ts",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
  "docs/AGENT_WORKPLANE_COCKPIT_CAPABILITY_INVENTORY_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_CONTROL_INVENTORY_V0_1.md",
  "lib/workplane/legacy-cockpit-control-inventory.ts",
  "docs/AUGNES_DOGFOOD_METRICS_BASELINE_V0_2.md",
  indexDoc,
  packageJsonFile,
  smokeFile,
  "scripts/run-agent-workplane-legacy-cockpit-runtime-check-v0-1.mjs",
  runtimeSmokeFile,
  remainingCapabilityMigrationSmokeFile,
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
  "scripts/smoke-agent-workplane-cockpit-inheritance-v0-1.mjs",
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-plan-v0-1.mjs",
  "scripts/smoke-workplane-native-browser-regression-v0-1.mjs",
  "scripts/smoke-legacy-cockpit-control-inventory-v0-1.mjs",
  "scripts/smoke-legacy-cockpit-local-control-classification-v0-1.mjs",
  "scripts/smoke-augnes-dogfood-metrics-baseline-v0-2.mjs",
  "scripts/smoke-runner-workplane-metrics-v0-1.mjs",
  "scripts/smoke-augnes-on-augnes-dogfood-v0-1.mjs",
  "scripts/smoke-agent-workplane-bridge-trace-detail-v0-1.mjs",
  "scripts/smoke-agent-workplane-review-memory-detail-v0-1.mjs",
  "scripts/smoke-agent-workplane-run-postmortem-detail-v0-1.mjs",
  "scripts/smoke-web-guide-panel-v0-1.mjs",
  ...followOnWorkplaneStateProposalReviewFiles,
  ...followOnCockpitManualControlsMigrationFiles,
  ...followOnCockpitRouteRemovalReadinessFiles,
  ...followOnCockpitRouteRemovalFiles,
];

const textByFile = loadTextByFile([
  agentWorkplaneFile,
  shrinkDoc,
  shrinkPlanDoc,
  browserRegressionDoc,
  routeRemovalDoc,
  indexDoc,
  packageJsonFile,
]);

const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const shrinkDocText = textByFile.get(shrinkDoc);
const routeRemovalDocText = textByFile.get(routeRemovalDoc);
const indexText = textByFile.get(indexDoc);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:agent-workplane-legacy-cockpit-shrink-v0-1",
  expectedCommand:
    "node scripts/smoke-agent-workplane-legacy-cockpit-shrink-v0-1.mjs",
});

assert(!agentWorkplaneText.includes("AugnesCockpit"), `${agentWorkplaneFile} must not import or render AugnesCockpit`);
assert(!agentWorkplaneText.includes("<" + "AugnesCockpit"), `${agentWorkplaneFile} must not render <" + "AugnesCockpit />`);
assert(!agentWorkplaneText.includes("LegacyCockpitCompatibilityPanel"), `${agentWorkplaneFile} must not import the removed compatibility panel`);
assert(!agentWorkplaneText.includes("<" + "LegacyCockpitCompatibilityPanel"), `${agentWorkplaneFile} must not render the removed compatibility panel`);
assert(!agentWorkplaneText.includes("legacy_cockpit_compatibility"), `${agentWorkplaneFile} must not expose the removed compatibility node`);
assert(!agentWorkplaneText.includes('href="/cockpit"'), `${agentWorkplaneFile} must not link to the removed /cockpit route`);
assertContainsAll(agentWorkplaneText, ["StateProposalReviewPanel"]);

assert(!existsSync(legacyCompatibilityPanelFile), `${legacyCompatibilityPanelFile} must be deleted`);
assert(!existsSync(cockpitPageFile), `${cockpitPageFile} must be deleted`);
assert(!existsSync(augnesCockpitFile), `${augnesCockpitFile} must be deleted`);

assertContainsAll(shrinkDocText, [
  "/workbench no longer mounts full AugnesCockpit.",
  "/cockpit was removed in Cockpit Route Removal v0.1.",
  "Native Agent Workplane panels remain the primary operational surface.",
  "Compatibility Removal",
  "Cockpit Route Removal v0.1",
  "docs/COCKPIT_MANUAL_CONTROLS_MIGRATION_V0_1.md",
  "Safe manual preview/copy review rows are native in Workplane State Proposal Review.",
  "No hidden feature loss",
]);
assertContainsAll(routeRemovalDocText, [
  "`/cockpit` route removed",
  "`components/augnes-cockpit.tsx` removed",
  "`LegacyCockpitCompatibilityPanel` import/render was removed",
]);
assertContainsAll(indexText, [shrinkDoc, routeRemovalDoc], { label: indexDoc });

const deletedFiles = collectGitDiffFiles([
  "diff",
  "--name-only",
  "--diff-filter=D",
  "HEAD",
]).files;
for (const removedFile of [cockpitPageFile, augnesCockpitFile, legacyCompatibilityPanelFile]) {
  assert(deletedFiles.includes(removedFile), `${removedFile} must be deleted in this PR`);
}

const changedFilesBoundary = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "agent workplane legacy cockpit shrink v0.1",
});
assertNoForbiddenProductAuthorityFilesChanged(changedFilesBoundary.files);
assertNoForbiddenExecutionText([agentWorkplaneText]);

console.log(
  JSON.stringify(
    {
      smoke: "agent-workplane-legacy-cockpit-shrink-v0-1",
      pass: true,
      workbench_full_mount_removed_checked: true,
      cockpit_route_removed_checked: true,
      compact_pointer_removed_checked: true,
      augnes_cockpit_source_removed_checked: true,
      package_script_checked: true,
      docs_pointer_checked: true,
      no_product_execution_authority_added_checked: true,
      changed_files_boundary: changedFilesBoundary,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:agent-workplane-legacy-cockpit-shrink-v0-1");

function assertNoMutationControls(text, label) {
  const forbiddenControls = [
    /<button\b/i,
    /<form\b/i,
    /<input\b/i,
    /<textarea\b/i,
    /\bonClick\b/i,
    /\bformAction\b/i,
  ];
  for (const pattern of forbiddenControls) {
    assert(!pattern.test(text), `${label} must stay pointer/status-only`);
  }
}

function assertNoForbiddenProductAuthorityFilesChanged(files) {
  for (const file of files) {
    assert(!file.startsWith("app/api/"), `No API write route is added: ${file}`);
    assert(!/^db\//.test(file), `No DB path may change: ${file}`);
    assert(!/^migrations\//.test(file), `No migration path may change: ${file}`);
    assert(!/\/(proof|evidence|memory|persistence)\//i.test(file), `No proof/evidence/memory/persistence path may change: ${file}`);
    assert(!/\/(provider|providers|openai|github|codex|runner|scheduler)\//i.test(file), `No provider/GitHub/Codex/runner authority path may change: ${file}`);
  }
}

function assertNoForbiddenExecutionText(texts) {
  const combined = texts.join("\n");
  assert(!/api\.openai\.com|api\.github\.com|@octokit|createPullRequest|executeCodex/i.test(combined), "No provider/GitHub/Codex execution path may be added");
  assert(!/tickAutonomyRun|recoverDeltaBatchForRun|runAutonomySchedulerWatch|runDueAutonomyRunsOnce/.test(combined), "No runner execution/tick/recovery/scheduling may be added");
  assert(!/writeFile|writeFileSync|appendFileSync|insert into|update\s+\w+\s+set/i.test(combined), "No product DB/proof/evidence/persistence write path may be added");
}
