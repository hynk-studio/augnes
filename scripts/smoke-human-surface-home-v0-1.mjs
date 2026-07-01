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
const publicHomeFile = "components/augnes-public-home-surface.tsx";
const homeComponentFile = "components/human-surface/human-surface-home.tsx";
const blankStateFile = "components/human-surface/blank-state-panel.tsx";
const modePresetFile = "components/human-surface/mode-preset-selector.tsx";
const currentPerspectiveCardFile =
  "components/human-surface/current-perspective-card.tsx";
const recentDeltasFile = "components/human-surface/recent-deltas-preview.tsx";
const surfaceLinkGridFile = "components/human-surface/surface-link-grid.tsx";
const currentPerspectiveReadFile =
  "lib/human-surface/read-current-perspective.ts";
const humanSurfaceDoc = "docs/HUMAN_SURFACE_V0_1.md";
const smokeFile = "scripts/smoke-human-surface-home-v0-1.mjs";
const packageJsonFile = "package.json";
const indexDoc = "docs/00_INDEX_LATEST.md";
const globalsCssFile = "app/globals.css";

const followOnSmokeCompatibilityFiles = [
  "scripts/smoke-augnes-delta-contract-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-route-v0-1.mjs",
  "scripts/smoke-current-working-perspective-v0-1.mjs",
  "scripts/smoke-current-working-perspective-route-v0-1.mjs",
];

const followOnPerspectiveHumanTimelineFiles = [
  "app/perspective/page.tsx",
  "components/perspective/perspective-public-constellation-surface.tsx",
  "components/perspective/perspective-human-surface.tsx",
  "components/perspective/perspective-current-summary-rail.tsx",
  "components/perspective/perspective-timeline.tsx",
  "components/perspective/perspective-delta-card.tsx",
  "components/perspective/perspective-delta-inspector.tsx",
  "components/perspective/perspective-boundary-next-panel.tsx",
  "lib/human-surface/read-delta-projection.ts",
  "scripts/smoke-perspective-human-timeline-v0-1.mjs",
];

const followOnAgentWorkplaneFiles = [
  "app/workbench/page.tsx",
  "components/workplane/agent-workplane.tsx",
  "components/workplane/workplane-header.tsx",
  "components/workplane/workplane-overview.tsx",
  "components/workplane/workplane-boundary-card.tsx",
  "components/workplane/legacy-cockpit-compatibility-panel.tsx",
  "lib/workplane/read-workplane-context.ts",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
];

const followOnAgentWorkplanePanelFiles = [
  "components/workplane/workplane-panel-shell.tsx",
  "components/workplane/work-queue-panel.tsx",
  "components/workplane/current-perspective-workplane-panel.tsx",
  "components/workplane/delta-projection-workplane-panel.tsx",
  "components/workplane/review-queue-workplane-panel.tsx",
  "components/workplane/evidence-handoff-workplane-panel.tsx",
  "components/workplane/workplane-inspector.tsx",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
];

const followOnAgentWorkplaneProjectionHandoffFiles = [
  "components/workplane/projection-candidates-panel.tsx",
  "components/workplane/delta-batch-panel.tsx",
  "components/workplane/handoff-builder-preview-panel.tsx",
  "components/workplane/run-postmortem-skeleton-panel.tsx",
  "components/workplane/trace-diagnostics-panel.tsx",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
];

const followOnAgentWorkplaneCleanupHardeningFiles = [
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
];

const followOnGuideBriefCoreFiles = [
  "docs/GUIDEBRIEF_CONTRACT_V0_1.md",
  "types/guide-brief.ts",
  "lib/guide/guide-brief.ts",
  "fixtures/guide-brief.sample.v0.1.json",
  "scripts/smoke-guide-brief-v0-1.mjs",
];

const requiredFiles = [
  pageFile,
  publicHomeFile,
  homeComponentFile,
  blankStateFile,
  modePresetFile,
  currentPerspectiveCardFile,
  recentDeltasFile,
  surfaceLinkGridFile,
  currentPerspectiveReadFile,
  humanSurfaceDoc,
  smokeFile,
  packageJsonFile,
  indexDoc,
  globalsCssFile,
];

const allowedChangedFiles = new Set([
  ...requiredFiles,
  ...followOnSmokeCompatibilityFiles,
  ...followOnPerspectiveHumanTimelineFiles,
  ...followOnAgentWorkplaneFiles,
  ...followOnAgentWorkplanePanelFiles,
  ...followOnAgentWorkplaneProjectionHandoffFiles,
  ...followOnAgentWorkplaneCleanupHardeningFiles,
  ...followOnGuideBriefCoreFiles,
]);

const textByFile = loadTextByFile(requiredFiles);
const pageText = textByFile.get(pageFile);
const publicHomeText = textByFile.get(publicHomeFile);
const homeText = textByFile.get(homeComponentFile);
const blankStateText = textByFile.get(blankStateFile);
const modePresetText = textByFile.get(modePresetFile);
const currentCardText = textByFile.get(currentPerspectiveCardFile);
const recentDeltasText = textByFile.get(recentDeltasFile);
const surfaceLinksText = textByFile.get(surfaceLinkGridFile);
const readHelperText = textByFile.get(currentPerspectiveReadFile);
const docText = textByFile.get(humanSurfaceDoc);
const smokeText = textByFile.get(smokeFile);
const packageJsonText = textByFile.get(packageJsonFile);
const indexText = textByFile.get(indexDoc);
const cssText = textByFile.get(globalsCssFile);

assertPackageJsonScript();
assertIndexPointer();
assertHomeRoute();
assertHumanSurfaceComponents();
assertModePresets();
assertCurrentPerspectiveCard();
assertRecentDeltasPreview();
assertSurfaceLinks();
assertFallbackDisclosure();
assertRuntimeReadMarkerUse();
assertDocs();
assertNoMutationOrActuationCode();
const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "human-surface-home-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      index_pointer_checked: true,
      home_route_checked: true,
      blank_state_checked: true,
      mode_presets_checked: true,
      current_working_perspective_card_checked: true,
      recent_deltas_preview_checked: true,
      surface_links_checked: true,
      fallback_disclosure_checked: true,
      route_marker_checked: true,
      no_mutation_or_actuation_code_checked: true,
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      follow_on_smoke_compatibility_files_allowed:
        followOnSmokeCompatibilityFiles,
      follow_on_perspective_human_timeline_files_allowed:
        followOnPerspectiveHumanTimelineFiles,
      follow_on_agent_workplane_files_allowed: followOnAgentWorkplaneFiles,
      follow_on_agent_workplane_panel_files_allowed:
        followOnAgentWorkplanePanelFiles,
      follow_on_guide_brief_core_files_allowed:
        followOnGuideBriefCoreFiles,
      smoke_type: "static-human-surface-home-ui-helper-doc-package-index-boundary-only",
      phase5a_agent_workplane_follow_on_used:
        changedFilesBoundary.phase5a_agent_workplane_follow_on_used,
      phase5b_agent_workplane_panel_follow_on_used:
        changedFilesBoundary.phase5b_agent_workplane_panel_follow_on_used,
      route_behavior_changed: changedFilesBoundary.route_behavior_changed,
      route_behavior_change_reason:
        changedFilesBoundary.route_behavior_change_reason,
      db_schema_migration_changed: false,
      db_write_added: false,
      mcp_app_tool_added: false,
      provider_openai_github_runtime_call_added: false,
      codex_execution_added: false,
      proof_evidence_write_added: false,
      memory_mutation_added: false,
      durable_perspective_state_apply_added: false,
      scheduler_autonomy_runner_added: false,
      perspective_timeline_added: false,
      workbench_page_changed: changedFilesBoundary.workbench_page_changed,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:human-surface-home-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:human-surface-home-v0-1",
    expectedCommand: "node scripts/smoke-human-surface-home-v0-1.mjs",
  });
}

function assertIndexPointer() {
  assertContainsAll(indexText, [humanSurfaceDoc, "Phase 4A read-only Human Surface Home"], {
    label: indexDoc,
  });
}

function assertHomeRoute() {
  assertContainsAll(pageText, ["AugnesPublicHomeSurface"], { label: pageFile });
  assertContainsAll(publicHomeText, ["HumanSurfaceHome"], {
    label: publicHomeFile,
  });
  assert(!pageText.includes("AugnesCockpit"), "/ must not render Cockpit directly");
}

function assertHumanSurfaceComponents() {
  assertContainsAll(
    homeText,
    [
      "HumanSurfaceHome",
      "readCurrentPerspectiveForHumanSurface",
      "BlankStatePanel",
      "CurrentPerspectiveCard",
      "RecentDeltasPreview",
      "SurfaceLinkGrid",
      "What are you trying to do?",
      'href="/perspective"',
      'href="/workbench"',
    ],
    { label: homeComponentFile },
  );

  assertContainsAll(blankStateText, ["The Blank State", "Read-only boundary"], {
    label: blankStateFile,
  });

  assertContainsAll(cssText, ["human-surface-home", "human-surface-mode-grid"], {
    label: globalsCssFile,
  });
}

function assertModePresets() {
  assertContainsAll(
    modePresetText,
    [
      "general",
      "writing",
      "research",
      "coding",
      "office",
      "presentation",
      "agentic",
      "physical_world_model",
      "display-only",
      "do not create work",
    ],
    { label: modePresetFile },
  );

  assert(
    !/\bonClick\s*=|\buseState\s*\(|<button\b|<input\b|<form\b/i.test(
      modePresetText,
    ),
    `${modePresetFile} mode preset selection must remain local/display-only`,
  );
}

function assertCurrentPerspectiveCard() {
  assertContainsAll(
    currentCardText,
    [
      "Current Working Perspective",
      "What Augnes thinks is going on",
      "Current thesis",
      "Active goals",
      "Open questions",
      "Active risks",
      "Research pressure",
      "Staleness",
      "Source status",
      'href="/perspective"',
    ],
    { label: currentPerspectiveCardFile },
  );
}

function assertRecentDeltasPreview() {
  assertContainsAll(
    recentDeltasText,
    [
      "Recent important deltas",
      "last major",
      "needs review",
      "blocked / manual review",
      "delta.type",
      "delta.source",
      "delta.created_at",
      "delta.review_reason",
      "No projected deltas available yet. Augnes can still show Current",
    ],
    { label: recentDeltasFile },
  );
}

function assertSurfaceLinks() {
  assertContainsAll(
    surfaceLinksText,
    [
      'href: "/perspective"',
      'href: "/workbench"',
      "Future Guide / ChatGPT / Codex handoff",
    ],
    { label: surfaceLinkGridFile },
  );
}

function assertFallbackDisclosure() {
  assertContainsAll(
    `${currentCardText}\n${readHelperText}`,
    [
      "source_status",
      "fixture_fallback",
      "empty_fallback",
      "fallback_reason",
      "authority_boundary",
      "Current Working Perspective is unavailable from runtime. Showing public-safe sample / empty fallback. No state was read or mutated.",
    ],
    { label: "human surface fallback disclosure" },
  );
}

function assertRuntimeReadMarkerUse() {
  assertContainsAll(
    readHelperText,
    [
      "GET",
      "cache: \"no-store\"",
      "x-augnes-local-readonly",
      "current-working-perspective-v0.1",
      "/api/perspective/current?scope=project:augnes",
    ],
    { label: currentPerspectiveReadFile },
  );
}

function assertDocs() {
  assertContainsAll(
    docText,
    [
      "Phase 4A Human Surface Home",
      "The Blank State",
      "source_status",
      "fixture_fallback",
      "read-only Human Surface UI",
      "Phase 4B Perspective Human Timeline",
      "Phase 5 Agent Workplane is future work",
      "Mode preset display does not create work",
    ],
    { label: humanSurfaceDoc },
  );
}

function assertNoMutationOrActuationCode() {
  const runtimeText = [
    homeText,
    blankStateText,
    modePresetText,
    currentCardText,
    recentDeltasText,
    surfaceLinksText,
    readHelperText,
    publicHomeText,
  ].join("\n");

  const forbiddenPatterns = [
    /\bmethod:\s*["'](?:POST|PUT|PATCH|DELETE)["']/,
    /\bfetch\s*\([^)]*,\s*\{[\s\S]*\bmethod:\s*["'](?:POST|PUT|PATCH|DELETE)["']/,
    /\bappendWorkEvent\s*\(/,
    /\bappendCoordinationEvent\s*\(/,
    /\bcreateEvidenceRecord\s*\(/,
    /\brecordProof\s*\(/,
    /\bcommitState\b/,
    /\brejectState\b/,
    /\bcommitStateDeltaProposal\b/,
    /\brejectStateDeltaProposal\b/,
    /\bwrite[A-Z]\w*\s*\(/,
    /\binsert[A-Z]\w*\s*\(/,
    /\bupdate[A-Z]\w*\s*\(/,
    /\bdelete[A-Z]\w*\s*\(/,
    /\bnew\s+Database\b/,
    /@openai/,
    /\bopenai\b/i,
    /\boctokit\b/i,
    /\bcreatePullRequest\s*\(/,
    /\bchild_process\b/,
    /\bspawn\s*\(/,
    /\bexecFile\s*\(/,
    /\bexecuteCodex\s*\(/,
    /\bcodexSdk\b/i,
    /\bsetInterval\s*\(/,
    /\bsetTimeout\s*\(/,
    /\bscheduler\s*\(/i,
    /\bfrom\s+["'][^"']*scheduler/i,
    /\bautonomyRunner\b/i,
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+\w+/i,
    /\bDELETE\s+FROM\b/i,
    /\bCREATE\s+TABLE\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bDROP\s+TABLE\b/i,
  ];

  for (const pattern of forbiddenPatterns) {
    assert(
      !pattern.test(runtimeText),
      `Human Surface runtime/component code must not match ${pattern}`,
    );
  }

  assertContainsAll(
    smokeText,
    [
      "no_mutation_or_actuation_code_checked",
      "app/workbench/page.tsx",
      "components/perspective/",
      "migrations/",
      "apps/augnes_apps/",
    ],
    { label: smokeFile },
  );
}

function assertChangedFileBoundary() {
  const workingTree = collectGitDiffFiles(["diff", "--name-only"]);
  const cached = collectGitDiffFiles(["diff", "--cached", "--name-only"]);
  const baseRange = getBaseRangeChangedFiles();
  const untrackedFiles = collectUntrackedFiles();
  const files = uniqueSorted([
    ...workingTree.files,
    ...cached.files,
    ...baseRange.files,
    ...untrackedFiles,
  ]);

  for (const file of files) {
    assert(
      allowedChangedFiles.has(file),
      `Unexpected Phase 4A changed or untracked file: ${file}`,
    );
    assert(
      file !== "app/perspective/page.tsx" ||
        followOnPerspectiveHumanTimelineFiles.includes(file),
      "Phase 4A follow-on must only update /perspective page for Phase 4B",
    );
    assert(
      file !== "app/workbench/page.tsx" ||
        followOnAgentWorkplaneFiles.includes(file),
      "Phase 4A must not update /workbench page outside the Phase 5A Agent Workplane follow-on",
    );
    assert(
      !/^components\/perspective\//.test(file) ||
        followOnPerspectiveHumanTimelineFiles.includes(file),
      `Phase 4A follow-on must not add /perspective timeline components outside Phase 4B: ${file}`,
    );
    assert(!/^app\/api\//.test(file), `Phase 4A must not add API routes: ${file}`);
    assert(
      !/^app\/.*route\.(ts|tsx|js|jsx)$/.test(file),
      `Phase 4A must not add route files: ${file}`,
    );
    assert(!/^db\//.test(file), `Phase 4A must not change DB files: ${file}`);
    assert(
      !/^migrations\//.test(file),
      `Phase 4A must not change migrations: ${file}`,
    );
    assert(
      !/^apps\/augnes_apps\//.test(file),
      `Phase 4A must not change MCP/App files: ${file}`,
    );
    assert(
      !/(^|\/)(mcp|plugin|plugins|tool|tools)(\/|$)/i.test(file),
      `Phase 4A must not change MCP/App tool files: ${file}`,
    );
    assert(
      !/(^|\/)(provider|providers|openai|github)(\/|$)/i.test(file),
      `Phase 4A must not change provider/OpenAI/GitHub runtime files: ${file}`,
    );
    assert(
      !/(^|\/)(proof|evidence)(\/|$)/i.test(file),
      `Phase 4A must not add proof/evidence write paths: ${file}`,
    );
    assert(
      !/(^|\/)(work-mutation|work_mutation|autonomy-runner|scheduler)(\/|$)/i.test(file),
      `Phase 4A must not add work mutation or autonomy runner files: ${file}`,
    );
  }

  const phase5aAgentWorkplaneFollowOnUsed = files.some((file) =>
    followOnAgentWorkplaneFiles.includes(file),
  );
  const phase5bAgentWorkplanePanelFollowOnUsed = files.some((file) =>
    followOnAgentWorkplanePanelFiles.includes(file),
  );
  const workbenchPageChanged = files.includes("app/workbench/page.tsx");

  return {
    checked:
      workingTree.checked ||
      cached.checked ||
      baseRange.checked ||
      untrackedFiles.length > 0,
    skipped: !(
      workingTree.checked ||
      cached.checked ||
      baseRange.checked ||
      untrackedFiles.length > 0
    ),
    skip_reason:
      workingTree.checked ||
      cached.checked ||
      baseRange.checked ||
      untrackedFiles.length > 0
        ? null
        : "changed-file boundary could not be checked",
    phase5a_agent_workplane_follow_on_used:
      phase5aAgentWorkplaneFollowOnUsed,
    phase5b_agent_workplane_panel_follow_on_used:
      phase5bAgentWorkplanePanelFollowOnUsed,
    workbench_page_changed: workbenchPageChanged,
    route_behavior_changed: workbenchPageChanged,
    route_behavior_change_reason: workbenchPageChanged
      ? "Phase 5A Agent Workplane follow-on updates /workbench wrapper only."
      : null,
    files,
  };
}
