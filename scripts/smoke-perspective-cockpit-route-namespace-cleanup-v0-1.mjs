#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
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

const packageJsonFile = "package.json";
const cleanupDoc = "docs/PERSPECTIVE_COCKPIT_ROUTE_NAMESPACE_CLEANUP_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const readmeFile = "README.md";
const startHereDoc = "docs/AUGNES_START_HERE_FOR_USERS_AND_AI.md";
const agentsFile = "AGENTS.md";
const smokeFile =
  "scripts/smoke-perspective-cockpit-route-namespace-cleanup-v0-1.mjs";

const removedCockpitProductFiles = [
  "app/cockpit/page.tsx",
  "components/augnes-cockpit.tsx",
  "components/workplane/legacy-cockpit-compatibility-panel.tsx",
];

const requiredCurrentSurfaceFiles = [
  "app/page.tsx",
  "app/workbench/page.tsx",
  "app/perspective/page.tsx",
  "components/workplane/agent-workplane.tsx",
  "components/workplane/state-proposal-review-panel.tsx",
];

const requiredPerspectiveRouteFiles = [
  "app/perspective/memory-items/page.tsx",
  "app/perspective/memory-items/search/page.tsx",
  "app/perspective/memory-items/review/page.tsx",
  "app/perspective/memory-items/reuse/page.tsx",
  "app/perspective/memory-boundary-review-inbox/page.tsx",
  "app/perspective/memory-review-queue/local/page.tsx",
  "app/perspective/codex-former/local-adapter-operator-flow/page.tsx",
  "app/perspective/codex-former/capture-review-inbox-fixture/page.tsx",
  "app/perspective/codex-former/constellation-preview-fixture/page.tsx",
  "app/perspective/codex-former/local-adapter-snapshot-fixture/page.tsx",
  "app/perspective/codex-former/local-adapter-validate-result-fixture/page.tsx",
  "app/perspective/codex-former/session-perspective-panel-fixture/page.tsx",
];

const movedRouteTreeFiles = [
  "app/perspective/codex-former/capture-review-inbox-fixture/page.tsx",
  "app/perspective/codex-former/constellation-preview-fixture/page.tsx",
  "app/perspective/codex-former/local-adapter-operator-flow/operator-flow-surface.module.css",
  "app/perspective/codex-former/local-adapter-operator-flow/operator-flow-surface.tsx",
  "app/perspective/codex-former/local-adapter-operator-flow/page.tsx",
  "app/perspective/codex-former/local-adapter-snapshot-fixture/page.tsx",
  "app/perspective/codex-former/local-adapter-validate-result-fixture/page.tsx",
  "app/perspective/codex-former/local-adapter-validate-result-fixture/validate-result-fixture-surface.module.css",
  "app/perspective/codex-former/local-adapter-validate-result-fixture/validate-result-fixture-surface.tsx",
  "app/perspective/codex-former/session-perspective-panel-fixture/page.tsx",
  "app/perspective/memory-boundary-review-inbox/memory-boundary-review-inbox-surface.module.css",
  "app/perspective/memory-boundary-review-inbox/memory-boundary-review-inbox-surface.tsx",
  "app/perspective/memory-boundary-review-inbox/page.tsx",
  "app/perspective/memory-items/page.tsx",
  "app/perspective/memory-items/perspective-memory-items-surface.module.css",
  "app/perspective/memory-items/perspective-memory-items-surface.tsx",
  "app/perspective/memory-items/reuse/page.tsx",
  "app/perspective/memory-items/reuse/perspective-memory-item-reuse-workspace-surface.module.css",
  "app/perspective/memory-items/reuse/perspective-memory-item-reuse-workspace-surface.tsx",
  "app/perspective/memory-items/review/page.tsx",
  "app/perspective/memory-items/review/perspective-memory-item-review-workspace-surface.module.css",
  "app/perspective/memory-items/review/perspective-memory-item-review-workspace-surface.tsx",
  "app/perspective/memory-items/search/page.tsx",
  "app/perspective/memory-items/search/perspective-memory-item-search-surface.module.css",
  "app/perspective/memory-items/search/perspective-memory-item-search-surface.tsx",
  "app/perspective/memory-review-queue/local/local-memory-review-queue-surface.module.css",
  "app/perspective/memory-review-queue/local/local-memory-review-queue-surface.tsx",
  "app/perspective/memory-review-queue/local/page.tsx",
];

const oldMovedRouteTreeFiles = movedRouteTreeFiles.map((file) =>
  file.replace("app/perspective/", "app/cockpit/perspective/"),
);

const routeConstantFiles = [
  "lib/perspective-ingest/codex-former-capture-review-inbox-fixture-surface.ts",
  "lib/perspective-ingest/codex-former-local-adapter-operator-flow.ts",
  "lib/perspective-ingest/codex-former-local-adapter-snapshot-fixture-surface.ts",
  "lib/perspective-ingest/codex-former-local-adapter-validate-result-fixture-surface.ts",
  "lib/perspective-ingest/codex-former-session-perspective-panel-fixture-surface.ts",
  "lib/perspective-ingest/perspective-memory-item-reuse-packet.ts",
  "lib/perspective-ingest/perspective-memory-item-review-workspace.ts",
  "lib/perspective-ingest/perspective-memory-item-search.ts",
  "lib/perspective-ingest/perspective-memory-item.ts",
  "lib/perspective-ingest/perspective-memory-local-review-queue.ts",
  "lib/perspective-ingest/perspective-memory-product-persistence-boundary.ts",
];

const historicalBannerFiles = [
  "SUBMISSION.md",
  "docs/COCKPIT_MVP_UI_POLISH_PLAN.md",
  "docs/COCKPIT_SIX_TAB_MVP_FUNCTIONAL_MAP.md",
  "docs/COCKPIT_PERSPECTIVE_IA_V0_1.md",
  "docs/PROMOTION_READINESS_REVIEW_HUB_COCKPIT_ENTRYPOINT_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
];

const expectedChangedFiles = [
  agentsFile,
  cleanupDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
  "scripts/smoke-blank-state-review-entry-absorption-v0-1.mjs",
  "scripts/smoke-cockpit-post-removal-cleanup-v0-1.mjs",
  "scripts/smoke-cockpit-route-removal-readiness-v0-1.mjs",
  "scripts/smoke-cockpit-route-removal-v0-1.mjs",
  "scripts/smoke-agent-workplane-node-contract-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-workplane-state-proposal-review-v0-1.mjs",
  ...movedRouteTreeFiles,
  ...oldMovedRouteTreeFiles,
  ...routeConstantFiles,
  ...historicalBannerFiles,
];

const textByFile = loadTextByFile([
  packageJsonFile,
  cleanupDoc,
  indexDoc,
  readmeFile,
  startHereDoc,
  agentsFile,
  ...historicalBannerFiles,
  ...routeConstantFiles,
]);

const packageJsonText = textByFile.get(packageJsonFile);
const cleanupDocText = textByFile.get(cleanupDoc);
const indexText = textByFile.get(indexDoc);
const readmeText = textByFile.get(readmeFile);
const startHereText = textByFile.get(startHereDoc);
const agentsText = textByFile.get(agentsFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:perspective-cockpit-route-namespace-cleanup-v0-1",
  expectedCommand:
    "node scripts/smoke-perspective-cockpit-route-namespace-cleanup-v0-1.mjs",
});

assertNoCockpitRoutesRemain();
assertPerspectiveRoutesExist();
assertOldCockpitPerspectiveReferencesAbsent();
assertCockpitDeletionStillTrue();
assertCurrentSurfacesPresent();
assertDocsAligned();
assertHistoricalBanners();
const changedFiles = assertChangedFilesBoundary();
assertNoAuthorityPathChanges(changedFiles.files);

console.log(
  JSON.stringify(
    {
      smoke: "perspective-cockpit-route-namespace-cleanup-v0-1",
      pass: true,
      app_cockpit_routes_absent: true,
      perspective_route_files_checked: requiredPerspectiveRouteFiles,
      old_cockpit_perspective_references_absent: true,
      cockpit_deletion_still_true: removedCockpitProductFiles,
      current_surfaces_present: requiredCurrentSurfaceFiles,
      public_docs_aligned: [readmeFile, startHereDoc],
      historical_banners_checked: historicalBannerFiles,
      changed_files_boundary: changedFiles,
      no_authority_path_changes_checked: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:perspective-cockpit-route-namespace-cleanup-v0-1");

function assertNoCockpitRoutesRemain() {
  assert(!existsSync(path.join(repoRoot, "app/cockpit/page.tsx")));
  assert(!existsSync(path.join(repoRoot, "app/cockpit/perspective")));
  const cockpitRouteFiles = walkExistingFiles("app/cockpit").filter((file) =>
    /\/(?:page|route)\.(?:ts|tsx|js|jsx)$/.test(file),
  );
  assert.deepEqual(cockpitRouteFiles, [], "No app/cockpit route files may remain");
}

function assertPerspectiveRoutesExist() {
  for (const file of requiredPerspectiveRouteFiles) {
    assert(existsSync(path.join(repoRoot, file)), `${file} must exist`);
  }
}

function assertOldCockpitPerspectiveReferencesAbsent() {
  const liveFiles = gitTrackedFiles().filter(
    (file) =>
      /^(app|components|lib|types)\//.test(file) &&
      existsSync(path.join(repoRoot, file)) &&
      /\.(ts|tsx|js|jsx|mjs|css)$/.test(file),
  );

  for (const file of liveFiles) {
    const text = readFileSync(path.join(repoRoot, file), "utf8");
    assert(
      !text.includes("/cockpit/perspective"),
      `${file} must not reference /cockpit/perspective`,
    );
    assert(
      !text.includes("app/cockpit/perspective"),
      `${file} must not reference app/cockpit/perspective`,
    );
  }
}

function assertCockpitDeletionStillTrue() {
  for (const file of removedCockpitProductFiles) {
    assert(!existsSync(path.join(repoRoot, file)), `${file} must remain absent`);
  }
}

function assertCurrentSurfacesPresent() {
  for (const file of requiredCurrentSurfaceFiles) {
    assert(existsSync(path.join(repoRoot, file)), `${file} must remain present`);
  }
}

function assertDocsAligned() {
  for (const [file, text] of [
    [readmeFile, readmeText],
    [startHereDoc, startHereText],
  ]) {
    assertContainsAll(
      text,
      [
        "Blank State",
        "Agent Workplane",
        "GuideBrief",
        "Legacy Cockpit has been removed as a product surface",
      ],
      { label: file },
    );
  }
  assertContainsAll(
    cleanupDocText,
    [
      "Perspective Cockpit Route Namespace Cleanup v0.1",
      "app/cockpit/perspective/**",
      "app/perspective/**",
      "Legacy Cockpit remains removed as a product surface",
      "Perspective Memory functionality remains intact",
      "Old `/cockpit/perspective/...` paths are historical/legacy references only",
      "This cleanup adds no API route",
    ],
    { label: cleanupDoc },
  );
  assertContainsAll(indexText, [cleanupDoc], { label: indexDoc });
  assertContainsAll(
    agentsText,
    [
      "UI changes, legacy-surface migration docs, and",
      "substantial refactors are not blanket-forbidden by default",
    ],
    { label: agentsFile },
  );
  assert(!agentsText.includes("UI/Cockpit changes"));
}

function assertHistoricalBanners() {
  const requiredBanner = [
    "Historical Legacy Cockpit artifact.",
    "This document describes pre-removal Cockpit-era architecture or validation.",
    "It is not current product IA.",
    "Current product structure is Blank State + Agent Workplane + GuideBrief.",
    "Legacy Cockpit has been removed as a product surface.",
  ];
  for (const file of historicalBannerFiles) {
    assertContainsAll(textByFile.get(file), requiredBanner, { label: file });
  }
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
      `Unexpected changed file for Perspective Cockpit route namespace cleanup: ${file}`,
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

function assertNoAuthorityPathChanges(files) {
  const forbiddenPatterns = [
    /^app\/api\//,
    /^db\//,
    /^migrations\//,
    /(^|\/)(provider|providers|openai|github)(\/|$)/i,
    /(^|\/)(proof|evidence)(\/|$)/i,
    /(^|\/)(runner-execution|scheduler|autonomy-runner)(\/|$)/i,
    /(^|\/)(codex-execution|execute-codex|codex-runner)(\/|$)/i,
    /memory.*apply/i,
    /perspective.*apply/i,
    /delta.*apply|auto-apply/i,
  ];

  for (const file of files) {
    for (const pattern of forbiddenPatterns) {
      assert(!pattern.test(file), `Forbidden authority path changed: ${file}`);
    }
  }
}

function walkExistingFiles(root) {
  const rootPath = path.join(repoRoot, root);
  if (!existsSync(rootPath)) return [];
  const files = [];
  const stack = [rootPath];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
      } else if (entry.isFile()) {
        files.push(path.relative(repoRoot, entryPath));
      }
    }
  }
  return files.sort();
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
