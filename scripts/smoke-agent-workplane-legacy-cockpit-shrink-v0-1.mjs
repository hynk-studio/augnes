#!/usr/bin/env node
import assert from "node:assert/strict";
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
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile =
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-v0-1.mjs";
const runtimeSmokeFile =
  "scripts/smoke-agent-workplane-legacy-cockpit-runtime-check-v0-1.mjs";
const remainingCapabilityMigrationSmokeFile =
  "scripts/smoke-legacy-cockpit-remaining-capability-migration-v0-1.mjs";

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
];

const textByFile = loadTextByFile([
  agentWorkplaneFile,
  legacyCompatibilityPanelFile,
  augnesCockpitFile,
  cockpitPageFile,
  shrinkDoc,
  shrinkPlanDoc,
  browserRegressionDoc,
  indexDoc,
  packageJsonFile,
]);

const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const panelText = textByFile.get(legacyCompatibilityPanelFile);
const cockpitPageText = textByFile.get(cockpitPageFile);
const augnesCockpitText = textByFile.get(augnesCockpitFile);
const shrinkDocText = textByFile.get(shrinkDoc);
const indexText = textByFile.get(indexDoc);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:agent-workplane-legacy-cockpit-shrink-v0-1",
  expectedCommand:
    "node scripts/smoke-agent-workplane-legacy-cockpit-shrink-v0-1.mjs",
});

assert(!agentWorkplaneText.includes("AugnesCockpit"), `${agentWorkplaneFile} must not import or render AugnesCockpit`);
assert(!agentWorkplaneText.includes("<AugnesCockpit"), `${agentWorkplaneFile} must not render <AugnesCockpit />`);
assertContainsAll(agentWorkplaneText, [
  "LegacyCockpitCompatibilityPanel",
  "<LegacyCockpitCompatibilityPanel />",
  "Agent Workplane shrunk compatibility route",
]);

assertContainsAll(panelText, [
  'data-workplane-panel-id="legacy_cockpit_compatibility"',
  'data-workplane-node-id="legacy_cockpit_compatibility"',
  'data-workplane-node-kind="compatibility_panel"',
  'data-workplane-node-status="compatibility_only"',
  'data-workplane-legacy-cockpit-shrink="workbench_full_mount_removed"',
  'data-workplane-legacy-cockpit-route="/cockpit"',
  'href="/cockpit"',
  "Legacy Cockpit full mount was removed from /workbench.",
  "Full Legacy Cockpit remains reachable at /cockpit",
  "Native Agent Workplane panels own the primary operational surface.",
  "Retained local-write/manual compatibility controls remain available only through /cockpit",
  "No provider/OpenAI/GitHub/Codex/runner execution authority is added.",
]);
assert(!panelText.includes("ReactNode"), `${legacyCompatibilityPanelFile} must not accept children`);
assert(!panelText.includes("children"), `${legacyCompatibilityPanelFile} must not wrap full Cockpit children`);
assertNoMutationControls(panelText, legacyCompatibilityPanelFile);

assertContainsAll(cockpitPageText, [
  'import { AugnesCockpit } from "@/components/augnes-cockpit"',
  "Legacy Cockpit compatibility route",
  "Agent Workplane no longer embeds the full Cockpit in /workbench",
  "retained compatibility/local-write/manual controls",
  "<AugnesCockpit />",
]);
assert(!/formAction|onClick|use server|server action/i.test(cockpitPageText), `${cockpitPageFile} must not add actions`);
assertContainsAll(augnesCockpitText, ["export function AugnesCockpit"]);

assertContainsAll(shrinkDocText, [
  "/workbench no longer mounts full AugnesCockpit.",
  "/cockpit preserves full Legacy Cockpit compatibility.",
  "Native Agent Workplane panels remain the primary operational surface.",
  "Retained compatibility",
  "full six-tab Cockpit shell, now only at /cockpit",
  "No hidden feature loss",
]);
assertContainsAll(indexText, [shrinkDoc], { label: indexDoc });

const deletedFiles = collectGitDiffFiles([
  "diff",
  "--name-only",
  "--diff-filter=D",
  "origin/main...HEAD",
]).files;
assert(!deletedFiles.includes(augnesCockpitFile), `${augnesCockpitFile} must not be deleted`);

const changedFilesBoundary = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "agent workplane legacy cockpit shrink v0.1",
});
assertNoForbiddenProductAuthorityFilesChanged(changedFilesBoundary.files);
assertNoForbiddenExecutionText([agentWorkplaneText, panelText, cockpitPageText]);

console.log(
  JSON.stringify(
    {
      smoke: "agent-workplane-legacy-cockpit-shrink-v0-1",
      pass: true,
      workbench_full_mount_removed_checked: true,
      cockpit_route_retained_checked: true,
      compact_pointer_checked: true,
      augnes_cockpit_source_retained_checked: true,
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
