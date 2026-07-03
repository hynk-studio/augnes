#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  assertContainsAll,
  assertPackageScript,
  collectGitDiffFiles,
  collectUntrackedFiles,
  getBaseRangeChangedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const pageFile = "app/page.tsx";
const homeFile = "components/human-surface/human-surface-home.tsx";
const blankStateFile = "components/human-surface/blank-state-panel.tsx";
const entryGridFile =
  "components/human-surface/blank-state-review-entry-grid.tsx";
const entryReadModelFile =
  "lib/human-surface/blank-state-review-entries.ts";
const globalsCssFile = "app/globals.css";
const humanSurfaceDoc = "docs/HUMAN_SURFACE_V0_1.md";
const closeoutDoc = "docs/BLANK_STATE_REVIEW_ENTRY_ABSORPTION_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile =
  "scripts/smoke-blank-state-review-entry-absorption-v0-1.mjs";
const humanSurfaceSmokeFile = "scripts/smoke-human-surface-home-v0-1.mjs";

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
  "app/cockpit/page.tsx",
  "components/augnes-cockpit.tsx",
  "components/workplane/legacy-cockpit-compatibility-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "types/agent-workplane-node.ts",
  "lib/workplane/workplane-node-context.ts",
  "types/cockpit-route-removal-readiness.ts",
  "lib/workplane/cockpit-route-removal-readiness.ts",
  "docs/COCKPIT_ROUTE_REMOVAL_V0_1.md",
  "docs/COCKPIT_ROUTE_REMOVAL_READINESS_V0_1.md",
  "docs/COCKPIT_MANUAL_CONTROLS_MIGRATION_V0_1.md",
  "docs/WORKPLANE_STATE_PROPOSAL_REVIEW_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_V0_1.md",
  "docs/LEGACY_COCKPIT_REMAINING_CAPABILITY_MIGRATION_V0_1.md",
  "docs/AGENT_WORKPLANE_NODE_CONTRACT_V0_1.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_COCKPIT_CAPABILITY_INVENTORY_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
  "scripts/smoke-cockpit-route-removal-v0-1.mjs",
  "scripts/run-cockpit-route-removal-runtime-check-v0-1.mjs",
  "scripts/smoke-cockpit-route-removal-readiness-v0-1.mjs",
  "scripts/smoke-cockpit-manual-controls-migration-v0-1.mjs",
  "scripts/smoke-workplane-state-proposal-review-v0-1.mjs",
  "scripts/smoke-legacy-cockpit-remaining-capability-migration-v0-1.mjs",
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-v0-1.mjs",
  "scripts/smoke-agent-workplane-node-contract-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-cockpit-inheritance-v0-1.mjs",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-workplane-native-browser-regression-v0-1.mjs",
  "lib/workplane/legacy-cockpit-control-inventory.ts",
  "scripts/run-agent-workplane-legacy-cockpit-runtime-check-v0-1.mjs",
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
  "lib/guide/workplane-intent-projection.ts",
  "lib/metrics/runner-workplane-metrics.ts",
  "lib/workplane/workplane-bridge-trace-detail.ts",
  "lib/workplane/workplane-browser-regression.ts",
  "lib/workplane/workplane-review-memory-detail.ts",
  "lib/workplane/workplane-run-postmortem-detail.ts",
  "types/workplane-bridge-trace-detail.ts",
  "types/workplane-browser-regression.ts",
];

const requiredEntryIds = [
  "continue_current_work_entry",
  "review_pending_proposals_entry",
  "choose_perspective_lens_entry",
  "prepare_codex_handoff_entry",
  "review_runner_deltabatch_entry",
  "automation_mode_entry",
  "user_judgment_summary_entry",
];

const stateProposalReviewNextSurfaceEntryIds = [
  "review_pending_proposals_entry",
  "choose_perspective_lens_entry",
  "user_judgment_summary_entry",
];

const allowedChangedFiles = [
  homeFile,
  blankStateFile,
  entryGridFile,
  entryReadModelFile,
  globalsCssFile,
  humanSurfaceDoc,
  closeoutDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
  humanSurfaceSmokeFile,
  ...followOnWorkplaneStateProposalReviewFiles,
  ...followOnCockpitManualControlsMigrationFiles,
  ...followOnCockpitRouteRemovalReadinessFiles,
  ...followOnCockpitRouteRemovalFiles,
];

const textByFile = loadTextByFile([
  pageFile,
  homeFile,
  blankStateFile,
  entryGridFile,
  entryReadModelFile,
  globalsCssFile,
  humanSurfaceDoc,
  closeoutDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
  humanSurfaceSmokeFile,
]);

const pageText = textByFile.get(pageFile);
const homeText = textByFile.get(homeFile);
const blankStateText = textByFile.get(blankStateFile);
const entryGridText = textByFile.get(entryGridFile);
const entryReadModelText = textByFile.get(entryReadModelFile);
const cssText = textByFile.get(globalsCssFile);
const humanSurfaceDocText = textByFile.get(humanSurfaceDoc);
const closeoutDocText = textByFile.get(closeoutDoc);
const indexText = textByFile.get(indexDoc);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:blank-state-review-entry-absorption-v0-1",
  expectedCommand:
    "node scripts/smoke-blank-state-review-entry-absorption-v0-1.mjs",
});

assertContainsAll(pageText, ["AugnesPublicHomeSurface"], { label: pageFile });
assertContainsAll(
  homeText,
  [
    "buildBlankStateReviewEntries",
    "readRunnerDeltaBatchesForWorkplane",
    "reviewEntries",
    "<BlankStatePanel entries={reviewEntries} />",
  ],
  { label: homeFile },
);
assertContainsAll(
  blankStateText,
  [
    "BlankStateReviewEntryGrid",
    "Read-only boundary: Blank State Review Entry Absorption v0.1",
    "does not create work, approve, apply, reject, commit",
  ],
  { label: blankStateFile },
);
assertContainsAll(
  entryGridText,
  [
    'data-blank-state-review-entry-grid="v0.1"',
    "data-blank-state-entry-destination={entry.destination}",
    "data-blank-state-entry-id={entry.capability_id}",
    "data-blank-state-entry-next-surface={",
    "data-blank-state-entry-target={entry.target_label}",
    "data-blank-state-entry-source-status={entry.source_status}",
    "href={entry.href}",
  ],
  { label: entryGridFile },
);
assertContainsAll(
  entryReadModelText,
  [
    "BLANK_STATE_REVIEW_ENTRY_IDS",
    'destination: "workplane";',
    'next_surface?: "state_proposal_review";',
    ...requiredEntryIds.map((id) => `"${id}"`),
    'href: "/workbench#work_queue"',
    'href: "/workbench#review_queue"',
    'href: "/perspective"',
    'href: "/workbench#handoff_builder_preview"',
    'href: "/workbench#runner_delta_batch"',
    'href: "/workbench#authority_boundary"',
    "No approve, apply, reject, or commit control.",
    "No runner execution, tick, recovery, or scheduling.",
    "No provider, GitHub, Codex, runner, scheduler, DB, proof, evidence, memory, Perspective, or delta apply authority.",
    "User judgment remains user-owned. Suggestions are not actions.",
  ],
  { label: entryReadModelFile },
);

const uniqueIds = new Set(
  [...entryReadModelText.matchAll(/"([a-z_]+_entry)"/g)].map((match) => match[1]),
);
assert.equal(uniqueIds.size, 7, "Blank State must define exactly seven entry ids");
for (const id of requiredEntryIds) {
  assert(uniqueIds.has(id), `Missing Blank State entry id: ${id}`);
}
assertBlankStateEntryMarkerContract();

assertContainsAll(
  cssText,
  [
    "human-surface-review-entry-grid",
    "human-surface-review-entry-card",
    "human-surface-review-entry-section",
  ],
  { label: globalsCssFile },
);
assertContainsAll(
  humanSurfaceDocText,
  [
    "Blank State Review Entry Absorption v0.1",
    "Continue Current Work",
    "Review Pending Proposals",
    "Choose Perspective Lens",
    "Prepare Codex Handoff",
    "Review Runner DeltaBatch",
    "Automation Mode",
    "User Judgment Summary",
  ],
  { label: humanSurfaceDoc },
);
assertContainsAll(
  closeoutDocText,
  [
    ...requiredEntryIds.map((id) => `\`${id}\``),
    "This PR adds high-level entry, summary, and navigation only.",
    "This PR adds no:",
    "localStorage or sessionStorage write",
    "`/cockpit` deletion",
    "`components/augnes-cockpit.tsx` deletion",
  ],
  { label: closeoutDoc },
);
assertContainsAll(indexText, [closeoutDoc, "Blank State Review Entry Absorption v0.1"], {
  label: indexDoc,
});

assertNoMutationControls([homeText, blankStateText, entryGridText, entryReadModelText]);
const changedFiles = assertChangedFilesBoundary();
assertNoForbiddenChangedPaths(changedFiles.files);

console.log(
  JSON.stringify(
    {
      smoke: "blank-state-review-entry-absorption-v0-1",
      pass: true,
      required_entry_ids_checked: requiredEntryIds,
      exactly_seven_entries_checked: true,
      package_script_checked: true,
      home_wiring_checked: true,
      stable_markers_checked: true,
      docs_checked: true,
      no_mutation_controls_checked: true,
      changed_files_boundary: changedFiles,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:blank-state-review-entry-absorption-v0-1");

function assertNoMutationControls(texts) {
  const combined = texts.join("\n");
  const forbiddenPatterns = [
    /<button\b/i,
    /<form\b/i,
    /<input\b/i,
    /<textarea\b/i,
    /\bonClick\b/i,
    /\bformAction\b/i,
    /\buse server\b/i,
    /\buse client\b/i,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
    /\bmethod:\s*["'](?:POST|PUT|PATCH|DELETE)["']/,
    /\bappendFile\b|\bwriteFile\b|\bwriteFileSync\b/,
    /\binsert into\b|\bupdate\s+\w+\s+set\b|\bdelete\s+from\b/i,
    /api\.openai\.com|api\.github\.com|@octokit/i,
    /\bexecuteCodex\b|\bcreatePullRequest\b|\bmergePullRequest\b/i,
    /\btickAutonomyRun\b|\brunAutonomySchedulerWatch\b|\brunDueAutonomyRunsOnce\b/,
  ];

  for (const pattern of forbiddenPatterns) {
    assert(
      !pattern.test(combined),
      `Blank State review entries must not add mutation/control behavior: ${pattern}`,
    );
  }
}

function assertBlankStateEntryMarkerContract() {
  const destinationAssignments = entryReadModelText.match(
    /destination:\s*"workplane",/g,
  );
  assert.equal(
    destinationAssignments?.length ?? 0,
    7,
    "Every Blank State entry must set destination: \"workplane\"",
  );

  const nextSurfaceAssignments = entryReadModelText.match(
    /next_surface:\s*"state_proposal_review",/g,
  );
  assert.equal(
    nextSurfaceAssignments?.length ?? 0,
    3,
    "Exactly the three State Proposal Review related entries must set next_surface",
  );

  for (const id of stateProposalReviewNextSurfaceEntryIds) {
    assert(
      new RegExp(
        `capability_id:\\s*"${id}",\\s*destination:\\s*"workplane",\\s*next_surface:\\s*"state_proposal_review",`,
      ).test(entryReadModelText),
      `Missing state_proposal_review next surface for ${id}`,
    );
  }
}

function assertChangedFilesBoundary() {
  const workingTree = collectGitDiffFiles(["diff", "--name-only"]);
  const cached = collectGitDiffFiles(["diff", "--cached", "--name-only"]);
  const baseRange = getBaseRangeChangedFiles();
  const untracked = collectUntrackedFiles();
  const files = uniqueSorted([
    ...workingTree.files,
    ...cached.files,
    ...baseRange.files,
    ...untracked,
  ]);
  const allowed = new Set(allowedChangedFiles);

  for (const file of files) {
    assert(
      allowed.has(file),
      `Unexpected changed file for Blank State Review Entry Absorption v0.1: ${file}`,
    );
  }

  return {
    files,
    working_tree_files: workingTree.files,
    cached_files: cached.files,
    base_range_files: baseRange.files,
    untracked_files: untracked,
  };
}

function assertNoForbiddenChangedPaths(files) {
  const allowedFollowOnFiles = new Set([
    ...followOnWorkplaneStateProposalReviewFiles,
    ...followOnCockpitManualControlsMigrationFiles,
    ...followOnCockpitRouteRemovalReadinessFiles,
    ...followOnCockpitRouteRemovalFiles,
  ]);
  const forbiddenPatterns = [
    /^app\/workbench\/page\.(tsx|ts|jsx|js)$/,
    /^app\/cockpit\//,
    /^app\/api\//,
    /^components\/augnes-cockpit\.tsx$/,
    /^components\/workplane\//,
    /^db\//,
    /^migrations\//,
    /(^|\/)(proof|evidence|memory|persistence)(\/|$)/i,
    /(^|\/)(provider|providers|openai|github|codex|scheduler)(\/|$)/i,
    /(^|\/)(autonomy-runner|runner-execution)(\/|$)/i,
    /(^|\/)(perspective\/state|delta-apply|delta_apply)(\/|$)/i,
  ];

  for (const file of files) {
    if (allowedFollowOnFiles.has(file)) {
      continue;
    }
    for (const pattern of forbiddenPatterns) {
      assert(!pattern.test(file), `Forbidden path changed: ${file}`);
    }
  }
}
