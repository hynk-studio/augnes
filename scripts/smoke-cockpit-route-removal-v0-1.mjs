#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  buildCockpitRouteRemovalReadiness,
} from "../lib/workplane/cockpit-route-removal-readiness.ts";
import {
  assertContainsAll,
  assertPackageScript,
  collectGitDiffFiles,
  collectUntrackedFiles,
  loadTextByFile,
  repoRoot,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const removedFiles = [
  "app/cockpit/page.tsx",
  "components/augnes-cockpit.tsx",
  "components/workplane/legacy-cockpit-compatibility-panel.tsx",
];

const requiredBlankStateEntryIds = [
  "continue_current_work_entry",
  "review_pending_proposals_entry",
  "choose_perspective_lens_entry",
  "prepare_codex_handoff_entry",
  "review_runner_deltabatch_entry",
  "automation_mode_entry",
  "user_judgment_summary_entry",
];

const packageJsonFile = "package.json";
const removalDoc = "docs/COCKPIT_ROUTE_REMOVAL_V0_1.md";
const cleanupDoc = "docs/COCKPIT_POST_REMOVAL_CLEANUP_V0_1.md";
const readinessDoc = "docs/COCKPIT_ROUTE_REMOVAL_READINESS_V0_1.md";
const shrinkDoc = "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_V0_1.md";
const migrationDoc =
  "docs/LEGACY_COCKPIT_REMAINING_CAPABILITY_MIGRATION_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const stateProposalPanelFile =
  "components/workplane/state-proposal-review-panel.tsx";
const blankStateGridFile =
  "components/human-surface/blank-state-review-entry-grid.tsx";
const blankStateEntryModelFile =
  "lib/human-surface/blank-state-review-entries.ts";

const smokeFile = "scripts/smoke-cockpit-route-removal-v0-1.mjs";
const runtimeFile = "scripts/run-cockpit-route-removal-runtime-check-v0-1.mjs";

const expectedChangedFiles = [
  ...removedFiles,
  "components/workplane/agent-workplane.tsx",
  "types/agent-workplane-node.ts",
  "lib/workplane/workplane-node-context.ts",
  "types/cockpit-route-removal-readiness.ts",
  "lib/workplane/cockpit-route-removal-readiness.ts",
  "types/workplane-browser-regression.ts",
  "lib/workplane/workplane-browser-regression.ts",
  "types/workplane-bridge-trace-detail.ts",
  "lib/workplane/workplane-bridge-trace-detail.ts",
  "lib/workplane/workplane-run-postmortem-detail.ts",
  "lib/workplane/workplane-review-memory-detail.ts",
  "lib/metrics/runner-workplane-metrics.ts",
  "lib/guide/workplane-intent-projection.ts",
  removalDoc,
  cleanupDoc,
  readinessDoc,
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_V0_1.md",
  "docs/LEGACY_COCKPIT_REMAINING_CAPABILITY_MIGRATION_V0_1.md",
  "docs/COCKPIT_MANUAL_CONTROLS_MIGRATION_V0_1.md",
  "docs/WORKPLANE_STATE_PROPOSAL_REVIEW_V0_1.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_COCKPIT_CAPABILITY_INVENTORY_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md",
  "docs/AGENT_WORKPLANE_NODE_CONTRACT_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  packageJsonFile,
  smokeFile,
  runtimeFile,
  "scripts/smoke-cockpit-post-removal-cleanup-v0-1.mjs",
  "scripts/smoke-cockpit-route-removal-readiness-v0-1.mjs",
  "scripts/smoke-cockpit-manual-controls-migration-v0-1.mjs",
  "scripts/smoke-workplane-state-proposal-review-v0-1.mjs",
  "scripts/smoke-legacy-cockpit-remaining-capability-migration-v0-1.mjs",
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-v0-1.mjs",
  "scripts/smoke-blank-state-review-entry-absorption-v0-1.mjs",
  "scripts/smoke-agent-workplane-node-contract-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-cockpit-inheritance-v0-1.mjs",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-workplane-native-browser-regression-v0-1.mjs",
  "lib/workplane/legacy-cockpit-control-inventory.ts",
  "scripts/run-agent-workplane-legacy-cockpit-runtime-check-v0-1.mjs",
  "scripts/smoke-agent-workplane-legacy-cockpit-runtime-check-v0-1.mjs",
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-plan-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
  "scripts/smoke-agent-workplane-bridge-trace-detail-v0-1.mjs",
  "scripts/smoke-agent-workplane-review-memory-detail-v0-1.mjs",
  "scripts/smoke-agent-workplane-run-postmortem-detail-v0-1.mjs",
  "scripts/smoke-augnes-dogfood-metrics-baseline-v0-2.mjs",
  "scripts/smoke-legacy-cockpit-local-control-classification-v0-1.mjs",
  "scripts/smoke-legacy-cockpit-control-inventory-v0-1.mjs",
  "scripts/smoke-web-guide-panel-v0-1.mjs",
];

const textByFile = loadTextByFile([
  packageJsonFile,
  removalDoc,
  readinessDoc,
  shrinkDoc,
  migrationDoc,
  indexDoc,
  agentWorkplaneFile,
  stateProposalPanelFile,
  blankStateGridFile,
  blankStateEntryModelFile,
]);

assertRemovedFiles();
assertPackageScript({
  packageJsonText: textByFile.get(packageJsonFile),
  scriptName: "smoke:cockpit-route-removal-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-cockpit-route-removal-v0-1.mjs",
});
assertPackageScript({
  packageJsonText: textByFile.get(packageJsonFile),
  scriptName: "runtime:cockpit-route-removal-check-v0-1",
  expectedCommand:
    "node scripts/run-cockpit-route-removal-runtime-check-v0-1.mjs",
});
assertActiveCodeReferencesAbsent();
assertNativeSurfacesPreserved();
assertDocsUpdated();
assertReadinessHelper();
const changedFiles = assertChangedFilesBoundary();
assertNoForbiddenChangedPaths(changedFiles.files);
assertNoAuthorityDriftInChangedSource(changedFiles.files);

console.log(
  JSON.stringify(
    {
      smoke: "cockpit-route-removal-v0-1",
      pass: true,
      removed_files_checked: removedFiles,
      native_surfaces_preserved: true,
      readiness_zero_count_checked: true,
      changed_files_boundary: changedFiles,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:cockpit-route-removal-v0-1");

function assertRemovedFiles() {
  for (const file of removedFiles) {
    assert(!existsSync(path.join(repoRoot, file)), `${file} must be removed`);
  }
}

function assertActiveCodeReferencesAbsent() {
  const activeProductFiles = gitTrackedFiles().filter(
    (file) =>
      (file.startsWith("app/") || file.startsWith("components/")) &&
      !file.startsWith("app/api/") &&
      !removedFiles.includes(file) &&
      existsSync(path.join(repoRoot, file)),
  );
  const activeProductText = activeProductFiles
    .map((file) => [file, readFileSync(path.join(repoRoot, file), "utf8")])
    .map(([file, text]) => `\n--- ${file} ---\n${text}`)
    .join("\n");

  assert(!activeProductText.includes("import { " + "AugnesCockpit"));
  assert(!activeProductText.includes("<" + "AugnesCockpit"));
  assert(!activeProductText.includes("export function " + "AugnesCockpit"));
  assert(!activeProductText.includes("LegacyCockpitCompatibilityPanel"));
  assert(!activeProductText.includes('href="/cockpit"'));
  assert(
    !activeProductText.includes('data-workplane-panel-id="legacy_cockpit_compatibility"'),
  );
  assert(
    !activeProductText.includes('data-workplane-legacy-cockpit-route="/cockpit"'),
  );
}

function assertNativeSurfacesPreserved() {
  const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
  const stateProposalPanelText = textByFile.get(stateProposalPanelFile);
  const blankStateGridText = textByFile.get(blankStateGridFile);
  const blankStateModelText = textByFile.get(blankStateEntryModelFile);

  assert(agentWorkplaneText.includes("StateProposalReviewPanel"));
  assert(agentWorkplaneText.includes("<StateProposalReviewPanel"));
  assertContainsAll(
    stateProposalPanelText,
    [
      'data-workplane-state-proposal-review-panel="v0.1"',
      'data-workplane-panel-id="state_proposal_review"',
      'data-state-proposal-review-authority-boundary="read_only_no_apply"',
      'data-cockpit-manual-controls-migration="v0.1"',
      "data-cockpit-manual-control-id",
      "data-cockpit-manual-control-migration-status",
      "data-cockpit-manual-control-destination",
      "data-cockpit-manual-control-authority-class",
    ],
    { label: stateProposalPanelFile },
  );
  assert(blankStateGridText.includes('data-blank-state-review-entry-grid="v0.1"'));
  assert(blankStateGridText.includes("data-blank-state-entry-id"));
  for (const entryId of requiredBlankStateEntryIds) {
    assert(
      blankStateModelText.includes(entryId),
      `${blankStateEntryModelFile} must keep ${entryId}`,
    );
  }
}

function assertDocsUpdated() {
  assertContainsAll(
    textByFile.get(removalDoc),
    [
      "Cockpit Route Removal v0.1",
      "`unique_useful_cockpit_capability_count: 0`",
      "`zero_count_verified: true`",
      "`/cockpit` route removed",
      "`components/augnes-cockpit.tsx` removed",
      "`components/workplane/legacy-cockpit-compatibility-panel.tsx` removed",
      "`/cockpit` returns 404",
      "Blank State keeps the seven human-facing review entry cards",
      "Workplane State Proposal Review",
      "keeps field-level diffs",
      "Local-write/apply/commit/reject controls remain blocked",
      "`removal_completed: true`",
    ],
    { label: removalDoc },
  );
  assert(textByFile.get(indexDoc).includes(removalDoc));
  assert(textByFile.get(readinessDoc).includes(removalDoc));
  assert(textByFile.get(shrinkDoc).includes("Cockpit Route Removal v0.1"));
  assert(textByFile.get(shrinkDoc).includes("/cockpit was removed"));
  assert(
    textByFile.get(migrationDoc).includes("unique useful capability count was"),
  );
  assert(
    textByFile.get(migrationDoc).includes("route removal completed") ||
      textByFile.get(migrationDoc).includes("Route Removal v0.1"),
  );
}

function assertReadinessHelper() {
  const read = buildCockpitRouteRemovalReadiness();
  assert.equal(read.unique_useful_cockpit_capability_count, 0);
  assert.equal(read.zero_count_verified, true);
  assert.equal(read.status, "ready_for_route_removal");
  assert.equal(read.removal_completed, true);
  assert.equal(read.cockpit_route_present, false);
  assert.equal(read.augnes_cockpit_component_present, false);
  assert.equal(read.legacy_workplane_compatibility_panel_present, false);
  assert.equal(read.route_removal_allowed, false);
  assert.equal(read.component_removal_allowed, false);
  for (const [field, value] of Object.entries(read.authority_boundary)) {
    if (field === "marker") continue;
    assert.equal(value, false, `authority boundary ${field} must be false`);
  }
}

function assertChangedFilesBoundary() {
  const workingTree = collectGitDiffFiles(["diff", "--name-only", "HEAD"]);
  const untracked = collectUntrackedFiles();
  const files = uniqueSorted([...workingTree.files, ...untracked]);
  const allowed = new Set(expectedChangedFiles);
  for (const file of files) {
    assert(allowed.has(file), `Unexpected changed file: ${file}`);
  }
  return {
    files,
    working_tree_checked: workingTree.checked,
    untracked_files: untracked,
  };
}

function assertNoForbiddenChangedPaths(files) {
  const forbiddenPatterns = [
    /^app\/api\//,
    /^db\//,
    /^migrations\//,
    /(^|\/)(provider|providers|openai|github|codex|runner)(\/|$)/i,
    /(^|\/)(proof|evidence)(\/|$)/i,
    /memory.*apply/i,
    /perspective.*apply/i,
    /delta.*apply/i,
  ];
  for (const file of files) {
    for (const pattern of forbiddenPatterns) {
      assert(!pattern.test(file), `Forbidden authority path changed: ${file}`);
    }
  }
}

function assertNoAuthorityDriftInChangedSource(files) {
  const sourceFiles = files.filter(
    (file) =>
      /^(app|components)\//.test(file) &&
      /\.(ts|tsx|js|jsx|mjs)$/.test(file) &&
      existsSync(path.join(repoRoot, file)),
  );
  for (const file of sourceFiles) {
    const text = readFileSync(path.join(repoRoot, file), "utf8");
    assert(!/<form\b/i.test(text), `${file} must not add forms`);
    assert(!/<input\b/i.test(text), `${file} must not add inputs`);
    assert(!/<textarea\b/i.test(text), `${file} must not add textareas`);
    assert(!/\bformAction\b/i.test(text), `${file} must not add formAction`);
    assert(!/\bonClick\b/i.test(text), `${file} must not add onClick`);
    assert(!/localStorage\.setItem|sessionStorage\.setItem/.test(text));
    assert(!/use server/.test(text), `${file} must not add server actions`);
  }
}

function gitTrackedFiles() {
  const output = execFileSync("git", ["ls-files"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
