#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  assertContainsAll,
  assertPackageScript,
  collectGitDiffFiles,
  collectUntrackedFiles,
  loadTextByFile,
  repoRoot,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const cleanupDoc = "docs/COCKPIT_POST_REMOVAL_CLEANUP_V0_1.md";
const routeRemovalDoc = "docs/COCKPIT_ROUTE_REMOVAL_V0_1.md";
const readinessDoc = "docs/COCKPIT_ROUTE_REMOVAL_READINESS_V0_1.md";
const shrinkDoc = "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_V0_1.md";
const migrationDoc =
  "docs/LEGACY_COCKPIT_REMAINING_CAPABILITY_MIGRATION_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const cleanupSmoke = "scripts/smoke-cockpit-post-removal-cleanup-v0-1.mjs";

const retiredFiles = [
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-v0-1.mjs",
  "scripts/smoke-agent-workplane-cockpit-inheritance-v0-1.mjs",
  "scripts/smoke-agent-workplane-legacy-cockpit-runtime-check-v0-1.mjs",
  "scripts/run-agent-workplane-legacy-cockpit-runtime-check-v0-1.mjs",
];

const retiredPackageScripts = [
  "smoke:agent-workplane-legacy-cockpit-shrink-v0-1",
  "smoke:agent-workplane-cockpit-inheritance-v0-1",
  "smoke:agent-workplane-legacy-cockpit-runtime-check-v0-1",
  "runtime:agent-workplane-legacy-cockpit-check-v0-1",
];

const removedCockpitProductFiles = [
  "app/cockpit/page.tsx",
  "components/augnes-cockpit.tsx",
  "components/workplane/legacy-cockpit-compatibility-panel.tsx",
];

const remainingAuthoritativeSmokeFiles = [
  "scripts/smoke-cockpit-route-removal-v0-1.mjs",
  "scripts/smoke-cockpit-route-removal-readiness-v0-1.mjs",
  "scripts/smoke-cockpit-manual-controls-migration-v0-1.mjs",
  "scripts/smoke-workplane-state-proposal-review-v0-1.mjs",
  "scripts/smoke-legacy-cockpit-remaining-capability-migration-v0-1.mjs",
  "scripts/smoke-blank-state-review-entry-absorption-v0-1.mjs",
  "scripts/smoke-agent-workplane-node-contract-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
];

const remainingAuthoritativePackageScripts = [
  [
    "smoke:cockpit-route-removal-v0-1",
    "tsx --tsconfig tsconfig.json scripts/smoke-cockpit-route-removal-v0-1.mjs",
  ],
  [
    "smoke:cockpit-route-removal-readiness-v0-1",
    "tsx --tsconfig tsconfig.json scripts/smoke-cockpit-route-removal-readiness-v0-1.mjs",
  ],
  [
    "smoke:cockpit-manual-controls-migration-v0-1",
    "node scripts/smoke-cockpit-manual-controls-migration-v0-1.mjs",
  ],
  [
    "smoke:workplane-state-proposal-review-v0-1",
    "node scripts/smoke-workplane-state-proposal-review-v0-1.mjs",
  ],
  [
    "smoke:legacy-cockpit-remaining-capability-migration-v0-1",
    "node scripts/smoke-legacy-cockpit-remaining-capability-migration-v0-1.mjs",
  ],
  [
    "smoke:blank-state-review-entry-absorption-v0-1",
    "node scripts/smoke-blank-state-review-entry-absorption-v0-1.mjs",
  ],
  [
    "smoke:agent-workplane-node-contract-v0-1",
    "node scripts/smoke-agent-workplane-node-contract-v0-1.mjs",
  ],
  [
    "smoke:agent-workplane-panels-v0-1",
    "node scripts/smoke-agent-workplane-panels-v0-1.mjs",
  ],
];

const expectedChangedFiles = [
  cleanupDoc,
  indexDoc,
  routeRemovalDoc,
  readinessDoc,
  shrinkDoc,
  migrationDoc,
  packageJsonFile,
  cleanupSmoke,
  ...retiredFiles,
  "scripts/smoke-cockpit-manual-controls-migration-v0-1.mjs",
  "scripts/smoke-workplane-state-proposal-review-v0-1.mjs",
  "scripts/smoke-blank-state-review-entry-absorption-v0-1.mjs",
  "scripts/smoke-agent-workplane-node-contract-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-cockpit-route-removal-v0-1.mjs",
  "scripts/smoke-cockpit-route-removal-readiness-v0-1.mjs",
  "scripts/smoke-legacy-cockpit-remaining-capability-migration-v0-1.mjs",
];

const textByFile = loadTextByFile([
  cleanupDoc,
  indexDoc,
  routeRemovalDoc,
  readinessDoc,
  shrinkDoc,
  migrationDoc,
  packageJsonFile,
]);

const cleanupDocText = textByFile.get(cleanupDoc);
const indexDocText = textByFile.get(indexDoc);
const routeRemovalDocText = textByFile.get(routeRemovalDoc);
const readinessDocText = textByFile.get(readinessDoc);
const shrinkDocText = textByFile.get(shrinkDoc);
const migrationDocText = textByFile.get(migrationDoc);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:cockpit-post-removal-cleanup-v0-1",
  expectedCommand:
    "node scripts/smoke-cockpit-post-removal-cleanup-v0-1.mjs",
});
for (const [scriptName, expectedCommand] of remainingAuthoritativePackageScripts) {
  assertPackageScript({ packageJsonText, scriptName, expectedCommand });
}

assertRetiredFilesAndPackageScripts();
assertRemainingSmokesPresent();
assertCockpitProductFilesRemainDeleted();
assertActiveProductReferencesAbsent();
assertDocsUpdated();
const changedFiles = assertChangedFilesBoundary();
assertNoForbiddenChangedPaths(changedFiles.files);

console.log(
  JSON.stringify(
    {
      smoke: "cockpit-post-removal-cleanup-v0-1",
      pass: true,
      cleanup_doc_checked: true,
      retired_files_checked: retiredFiles,
      retired_package_scripts_checked: retiredPackageScripts,
      authoritative_smokes_checked: remainingAuthoritativeSmokeFiles,
      cockpit_product_files_remain_deleted: removedCockpitProductFiles,
      changed_files_boundary: changedFiles,
      no_authority_paths_changed_checked: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:cockpit-post-removal-cleanup-v0-1");

function assertRetiredFilesAndPackageScripts() {
  for (const file of retiredFiles) {
    assert(!existsSync(path.join(repoRoot, file)), `${file} must be retired`);
  }
  for (const scriptName of retiredPackageScripts) {
    assert(
      !packageJsonText.includes(`"${scriptName}"`),
      `${packageJsonFile} must not retain ${scriptName}`,
    );
  }
  for (const file of retiredFiles) {
    assert(
      !packageJsonText.includes(file),
      `${packageJsonFile} must not reference ${file}`,
    );
  }
}

function assertRemainingSmokesPresent() {
  for (const file of remainingAuthoritativeSmokeFiles) {
    assert(existsSync(path.join(repoRoot, file)), `${file} must remain present`);
  }
}

function assertCockpitProductFilesRemainDeleted() {
  for (const file of removedCockpitProductFiles) {
    assert(!existsSync(path.join(repoRoot, file)), `${file} must remain deleted`);
  }
}

function assertActiveProductReferencesAbsent() {
  const activeProductFiles = gitTrackedFiles().filter(
    (file) =>
      (file.startsWith("app/") || file.startsWith("components/")) &&
      !file.startsWith("app/api/") &&
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
}

function assertDocsUpdated() {
  assertContainsAll(
    cleanupDocText,
    [
      "Cockpit Post-Removal Cleanup v0.1",
      "Why This Follows PR #943",
      "Retired Pre-Removal Smokes",
      ...retiredFiles,
      "Authoritative Post-Removal Smokes",
      ...remainingAuthoritativePackageScripts.map(([scriptName]) => scriptName),
      "Migrated Capability Preservation",
      "No Product Behavior Change",
      "No Authority Change",
      "Cockpit decomposition cleanup is complete",
    ],
    { label: cleanupDoc },
  );
  assertContainsAll(indexDocText, [cleanupDoc], { label: indexDoc });
  assertContainsAll(routeRemovalDocText, [cleanupDoc], {
    label: routeRemovalDoc,
  });
  assertContainsAll(readinessDocText, [cleanupDoc], { label: readinessDoc });
  assertContainsAll(
    shrinkDocText,
    [
      cleanupDoc,
      "retired stale retained-route smokes",
      "runtime:agent-workplane-legacy-cockpit-check-v0-1",
      "smoke:agent-workplane-legacy-cockpit-runtime-check-v0-1",
      "smoke:cockpit-route-removal-v0-1",
    ],
    { label: shrinkDoc },
  );
  assertContainsAll(
    migrationDocText,
    [
      cleanupDoc,
      "route split / retained Cockpit smokes were temporary and are now retired after route removal",
      "smoke:cockpit-route-removal-v0-1",
    ],
    { label: migrationDoc },
  );
}

function assertChangedFilesBoundary() {
  const workingTree = collectGitDiffFiles(["diff", "--name-only", "HEAD"]);
  const staged = collectGitDiffFiles(["diff", "--cached", "--name-only"]);
  const baseRange = collectGitDiffFiles([
    "diff",
    "--name-only",
    "origin/main...HEAD",
  ]);
  const untracked = collectUntrackedFiles();
  const files = uniqueSorted([
    ...workingTree.files,
    ...staged.files,
    ...baseRange.files,
    ...untracked,
  ]);
  const allowed = new Set(expectedChangedFiles);

  for (const file of files) {
    assert(
      allowed.has(file),
      `Unexpected changed file for Cockpit Post-Removal Cleanup v0.1: ${file}`,
    );
  }

  return {
    files,
    working_tree_files: workingTree.files,
    staged_files: staged.files,
    base_range_files: baseRange.files,
    untracked_files: untracked,
  };
}

function assertNoForbiddenChangedPaths(files) {
  const forbiddenPatterns = [
    /^app\//,
    /^components\//,
    /^lib\//,
    /^types\//,
    /^db\//,
    /^migrations\//,
    /(^|\/)(provider|providers|openai|github|codex|runner-execution|scheduler)(\/|$)/i,
    /(^|\/)(proof|evidence|persistence)(\/|$)/i,
    /(^|\/)(memory|perspective\/state|delta-apply|delta_apply)(\/|$)/i,
  ];

  for (const file of files) {
    for (const pattern of forbiddenPatterns) {
      assert(!pattern.test(file), `Forbidden cleanup path changed: ${file}`);
    }
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
