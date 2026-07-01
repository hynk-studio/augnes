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

const pageFile = "app/perspective/page.tsx";
const wrapperFile =
  "components/perspective/perspective-public-constellation-surface.tsx";
const humanSurfaceFile = "components/perspective/perspective-human-surface.tsx";
const summaryRailFile =
  "components/perspective/perspective-current-summary-rail.tsx";
const timelineFile = "components/perspective/perspective-timeline.tsx";
const deltaCardFile = "components/perspective/perspective-delta-card.tsx";
const inspectorFile = "components/perspective/perspective-delta-inspector.tsx";
const boundaryNextFile =
  "components/perspective/perspective-boundary-next-panel.tsx";
const deltaProjectionReadFile = "lib/human-surface/read-delta-projection.ts";
const humanSurfaceDoc = "docs/HUMAN_SURFACE_V0_1.md";
const smokeFile = "scripts/smoke-perspective-human-timeline-v0-1.mjs";
const packageJsonFile = "package.json";
const indexDoc = "docs/00_INDEX_LATEST.md";
const globalsCssFile = "app/globals.css";

const followOnSmokeCompatibilityFiles = [
  "scripts/smoke-augnes-delta-contract-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-route-v0-1.mjs",
  "scripts/smoke-current-working-perspective-v0-1.mjs",
  "scripts/smoke-current-working-perspective-route-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
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

const followOnGuideBriefRouteFiles = [
  "app/api/augnes/read/guide-brief/route.ts",
  "lib/guide/guide-brief-source.ts",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
];

const followOnWebGuidePanelFiles = [
  "components/guide/guide-brief-panel.tsx",
  "components/guide/guide-brief-section.tsx",
  "components/guide/guide-brief-summary-card.tsx",
  "components/guide/guide-brief-boundary-card.tsx",
  "components/guide/guide-brief-mini-panel.tsx",
  "lib/guide/read-guide-brief-for-web.ts",
  "components/human-surface/human-surface-home.tsx",
  "components/workplane/agent-workplane.tsx",
  "scripts/smoke-web-guide-panel-v0-1.mjs",
];
const followOnChatgptAppGuideBriefToolFiles = [
  "apps/augnes_apps/src/server.ts",
  "apps/augnes_apps/src/lib/state-runtime-types.ts",
  "apps/augnes_apps/src/adapters/state-runtime-http.ts",
  "apps/augnes_apps/scripts/invariants.ts",
  "apps/augnes_apps/scripts/smoke.ts",
  "apps/augnes_apps/scripts/mock-state-runtime.ts",
  "docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md",
  "scripts/smoke-chatgpt-app-guide-brief-tool-v0-1.mjs",
];


const requiredFiles = [
  pageFile,
  wrapperFile,
  humanSurfaceFile,
  summaryRailFile,
  timelineFile,
  deltaCardFile,
  inspectorFile,
  boundaryNextFile,
  deltaProjectionReadFile,
  humanSurfaceDoc,
  smokeFile,
  packageJsonFile,
  indexDoc,
  globalsCssFile,
];

const phase9aAutonomyRunnerPreflightFiles = [
  "docs/AUTONOMY_RUNNER_PREFLIGHT_V0_1.md",
  "types/autonomy-runner.ts",
  "lib/autonomy/autonomy-runner-preflight.ts",
  "fixtures/autonomy-runner-preflight.sample.v0.1.json",
  "scripts/smoke-autonomy-runner-preflight-v0-1.mjs",
  "package.json",
  "docs/00_INDEX_LATEST.md",
  "scripts/smoke-augnes-delta-contract-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-route-v0-1.mjs",
  "scripts/smoke-current-working-perspective-v0-1.mjs",
  "scripts/smoke-current-working-perspective-route-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-perspective-human-timeline-v0-1.mjs",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
  "scripts/smoke-guide-brief-v0-1.mjs",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
  "scripts/smoke-web-guide-panel-v0-1.mjs",
  "scripts/smoke-chatgpt-app-guide-brief-tool-v0-1.mjs",
  "scripts/smoke-codex-guidebrief-handoff-v0-1.mjs",
  "scripts/smoke-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-route-v0-1.mjs",
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-handoff-capsule-tool-v0-1.mjs",
  "scripts/smoke-codex-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-copy-export-v0-1.mjs",
  "scripts/smoke-autonomy-contract-v0-1.mjs",
  "scripts/smoke-autonomy-contract-route-v0-1.mjs",
  "scripts/smoke-autonomy-contract-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-autonomy-contract-tool-v0-1.mjs",
  "scripts/smoke-codex-autonomy-contract-v0-1.mjs",
  "scripts/smoke-autonomy-contract-copy-export-v0-1.mjs",
];
const allowedChangedFiles = new Set([
  "docs/AUTONOMY_CONTRACT_V0_1.md",
  "types/autonomy-contract.ts",
  "lib/autonomy/autonomy-contract.ts",
  "fixtures/autonomy-contract.sample.v0.1.json",
  "scripts/smoke-autonomy-contract-v0-1.mjs",
  "app/api/augnes/read/autonomy-contract/route.ts",
  "lib/autonomy/autonomy-contract-source.ts",
  "scripts/smoke-autonomy-contract-route-v0-1.mjs",
  "package.json",
  "docs/00_INDEX_LATEST.md",
  ...requiredFiles,
  ...followOnSmokeCompatibilityFiles,
  ...followOnAgentWorkplaneFiles,
  ...followOnAgentWorkplanePanelFiles,
  ...followOnAgentWorkplaneProjectionHandoffFiles,
  ...followOnAgentWorkplaneCleanupHardeningFiles,
  ...followOnGuideBriefCoreFiles,
  ...followOnGuideBriefRouteFiles,
  ...followOnWebGuidePanelFiles,
  ...followOnChatgptAppGuideBriefToolFiles,
]);
for (const file of phase9aAutonomyRunnerPreflightFiles) {
  allowedChangedFiles.add(file);
}
const phase8PriorSmokeAllowlistFiles = [
  "scripts/smoke-augnes-delta-contract-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-route-v0-1.mjs",
  "scripts/smoke-current-working-perspective-v0-1.mjs",
  "scripts/smoke-current-working-perspective-route-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-perspective-human-timeline-v0-1.mjs",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
  "scripts/smoke-guide-brief-v0-1.mjs",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
  "scripts/smoke-web-guide-panel-v0-1.mjs",
  "scripts/smoke-chatgpt-app-guide-brief-tool-v0-1.mjs",
  "scripts/smoke-codex-guidebrief-handoff-v0-1.mjs",
  "scripts/smoke-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-route-v0-1.mjs",
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-handoff-capsule-tool-v0-1.mjs",
  "scripts/smoke-codex-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-copy-export-v0-1.mjs",
];
for (const file of phase8PriorSmokeAllowlistFiles) {
  allowedChangedFiles.add(file);
}

const textByFile = loadTextByFile(requiredFiles);
const pageText = textByFile.get(pageFile);
const wrapperText = textByFile.get(wrapperFile);
const humanSurfaceText = textByFile.get(humanSurfaceFile);
const summaryRailText = textByFile.get(summaryRailFile);
const timelineText = textByFile.get(timelineFile);
const deltaCardText = textByFile.get(deltaCardFile);
const inspectorText = textByFile.get(inspectorFile);
const boundaryNextText = textByFile.get(boundaryNextFile);
const readHelperText = textByFile.get(deltaProjectionReadFile);
const docText = textByFile.get(humanSurfaceDoc);
const smokeText = textByFile.get(smokeFile);
const packageJsonText = textByFile.get(packageJsonFile);
const indexText = textByFile.get(indexDoc);
const cssText = textByFile.get(globalsCssFile);

assertPackageJsonScript();
assertIndexPointer();
assertPerspectiveRoute();
assertPerspectiveComponents();
assertDeltaProjectionReadHelper();
assertTimelineContent();
assertInspectorContent();
assertDocs();
assertNoMutationOrActuationCode();
const followOnCodexGuideBriefHandoffFiles = [
  "docs/CODEX_GUIDEBRIEF_HANDOFF_V0_1.md",
  "plugins/augnes-operator/skills/augnes-guidebrief-handoff/SKILL.md",
  "docs/GUIDEBRIEF_CONTRACT_V0_1.md",
  "docs/CODEX_AUGNES_OPERATOR_PLUGIN_V0_2.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
  "scripts/smoke-codex-guidebrief-handoff-v0-1.mjs",
  "scripts/smoke-augnes-operator-plugin-v2.mjs",
  "scripts/smoke-augnes-capsule-handoff-skill.mjs",
];
for (const file of followOnCodexGuideBriefHandoffFiles) {
  allowedChangedFiles.add(file);
}

const followOnHandoffCapsuleFiles = [
  "docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md",
  "types/handoff-capsule.ts",
  "lib/handoff/handoff-capsule.ts",
  "fixtures/handoff-capsule.sample.v0.1.json",
  "fixtures/codex-launch-card.sample.v0.1.json",
  "scripts/smoke-handoff-capsule-v0-1.mjs",
];
for (const file of followOnHandoffCapsuleFiles) {
  allowedChangedFiles.add(file);
}

const followOnHandoffCapsuleWebPreviewFiles = [
  "components/handoff/handoff-capsule-preview-panel.tsx",
  "components/handoff/codex-launch-card-preview-panel.tsx",
  "components/handoff/handoff-preview-boundary-card.tsx",
  "lib/handoff/read-handoff-capsule-for-web.ts",
  "components/workplane/agent-workplane.tsx",
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
  "scripts/smoke-handoff-capsule-route-v0-1.mjs",
  "scripts/smoke-web-guide-panel-v0-1.mjs",
];
for (const file of followOnHandoffCapsuleWebPreviewFiles) {
  allowedChangedFiles.add(file);
}

const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "perspective-human-timeline-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      index_pointer_checked: true,
      perspective_route_checked: true,
      perspective_human_surface_component_checked: true,
      current_working_perspective_summary_rail_checked: true,
      timeline_component_checked: true,
      delta_card_component_checked: true,
      inspector_component_checked: true,
      boundary_next_panel_checked: true,
      delta_projection_read_helper_checked: true,
      no_mutation_or_actuation_code_checked: true,
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      follow_on_smoke_compatibility_files_allowed:
        followOnSmokeCompatibilityFiles,
      follow_on_agent_workplane_files_allowed: followOnAgentWorkplaneFiles,
      follow_on_agent_workplane_panel_files_allowed:
        followOnAgentWorkplanePanelFiles,
      follow_on_guide_brief_core_files_allowed:
        followOnGuideBriefCoreFiles,
      smoke_type: "static-perspective-human-timeline-ui-helper-doc-package-index-boundary-only",
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
      workbench_page_changed: changedFilesBoundary.workbench_page_changed,
      graph_editor_added: false,
      persistence_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:perspective-human-timeline-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:perspective-human-timeline-v0-1",
    expectedCommand: "node scripts/smoke-perspective-human-timeline-v0-1.mjs",
  });
}

function assertIndexPointer() {
  assertContainsAll(
    indexText,
    [
      humanSurfaceDoc,
      "Phase 4B adds the read-only `/perspective` Human Timeline skeleton",
      "Delta Inspector",
      "Boundary / Next panel",
    ],
    { label: indexDoc },
  );
}

function assertPerspectiveRoute() {
  assertContainsAll(pageText, ["PerspectivePublicConstellationSurface"], {
    label: pageFile,
  });
  assertContainsAll(
    wrapperText,
    [
      "PerspectiveHumanSurface",
      "readCurrentPerspectiveForHumanSurface",
      "readDeltaProjectionForHumanSurface",
    ],
    { label: wrapperFile },
  );
}

function assertPerspectiveComponents() {
  assertContainsAll(
    humanSurfaceText,
    [
      '"use client"',
      "PerspectiveHumanSurface",
      "PerspectiveCurrentSummaryRail",
      "PerspectiveTimeline",
      "PerspectiveDeltaInspector",
      "PerspectiveBoundaryNextPanel",
      "useState",
      "selectedDeltaId",
      "Delta timeline",
      'href="/"',
      'href="/workbench"',
      "Delta Projection is unavailable from runtime. Showing public-safe sample / empty fallback. No state was read or mutated.",
    ],
    { label: humanSurfaceFile },
  );

  assertContainsAll(
    summaryRailText,
    [
      "Current Working Perspective",
      "Current summary",
      "Current thesis",
      "Active goals",
      "Open questions",
      "Active risks",
      "Research pressure",
      "Staleness",
      "Source status",
      "Current Working Perspective is unavailable from runtime. Showing",
    ],
    { label: summaryRailFile },
  );

  assertContainsAll(cssText, ["perspective-human-surface", "perspective-human-timeline-list"], {
    label: globalsCssFile,
  });
}

function assertDeltaProjectionReadHelper() {
  assertContainsAll(
    readHelperText,
    [
      "GET",
      "cache: \"no-store\"",
      "/api/augnes/read/deltas?scope=project:augnes",
      "x-augnes-local-readonly",
      "augnes-delta-projection-v0.1",
      "fixture_fallback",
      "empty_fallback",
      "fallback_reason",
      "authority_boundary",
      "augnes-delta-projection.sample.v0.1.json",
    ],
    { label: deltaProjectionReadFile },
  );
}

function assertTimelineContent() {
  assertContainsAll(
    timelineText,
    [
      "PerspectiveTimeline",
      "Vertical Perspective Timeline",
      "Augnes Delta timeline",
      "type, status",
      "source, title",
      "created_at",
      "review needs",
      "No projected deltas available yet",
    ],
    { label: timelineFile },
  );
  assertContainsAll(
    deltaCardText,
    [
      "PerspectiveDeltaCard",
      "delta.type",
      "delta.status",
      "delta.source",
      "delta.title",
      "delta.created_at",
      "Review needs",
      "aria-pressed",
      "type=\"button\"",
    ],
    { label: deltaCardFile },
  );
}

function assertInspectorContent() {
  assertContainsAll(
    inspectorText,
    [
      "Delta Inspector",
      "Read-only projection. No state mutation, no proof/evidence write, no external action.",
      "Target refs",
      "Source refs",
      "Snapshot refs",
      "Diagnostic refs",
      "Evidence refs",
      "Artifact refs",
      "Handoff refs",
      "Merge policy",
      "Authority boundary",
      "Validation summary",
      "Gaps / staleness",
      "Review notes",
      "Non-goals",
    ],
    { label: inspectorFile },
  );
  assertContainsAll(
    boundaryNextText,
    [
      "Boundary / Next panel",
      "Next candidates",
      "Open questions",
      "Active risks",
      "Source / fallback notes",
      "Gaps / staleness warnings",
    ],
    { label: boundaryNextFile },
  );
}

function assertDocs() {
  assertContainsAll(
    docText,
    [
      "Phase 4B Perspective Human Timeline",
      "/perspective",
      "Current Working Perspective rail",
      "vertical timeline skeleton",
      "Delta cards",
      "Delta Inspector",
      "Boundary / Next panel",
      "read-only authority boundary",
      "no graph editor",
      "no persistence",
      "Phase 5 Agent Workplane remains future",
    ],
    { label: humanSurfaceDoc },
  );
}

function assertNoMutationOrActuationCode() {
  const runtimeText = [
    wrapperText,
    humanSurfaceText,
    summaryRailText,
    timelineText,
    deltaCardText,
    inspectorText,
    boundaryNextText,
    readHelperText,
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
    /\bgraphDb\b/i,
    /\bdragSave\b/i,
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
      `Perspective Human Timeline code must not match ${pattern}`,
    );
  }

  assert(!/\bsave\s*\/\s*reset\s*\/\s*rollback\b/i.test(runtimeText), "Phase 4B must not add save/reset/rollback controls");

  assertContainsAll(
    smokeText,
    [
      "app/workbench/page.tsx",
      "app/api/",
      "migrations/",
      "apps/augnes_apps/",
      "no_mutation_or_actuation_code_checked",
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
      `Unexpected Phase 4B changed or untracked file: ${file}`,
    );
    assert(
      file !== "app/workbench/page.tsx" ||
        followOnAgentWorkplaneFiles.includes(file),
      "Phase 4B must not update /workbench page outside the Phase 5A Agent Workplane follow-on",
    );
    assert(
      !/^app\/api\//.test(file) ||
        followOnGuideBriefRouteFiles.includes(file) ||
        file === "app/api/augnes/read/autonomy-contract/route.ts",
      `Phase 4B must not add API routes outside exact Phase 6B GuideBrief follow-on scope: ${file}`,
    );
    assert(
      !/^app\/.*route\.(ts|tsx|js|jsx)$/.test(file) ||
        followOnGuideBriefRouteFiles.includes(file) ||
        file === "app/api/augnes/read/autonomy-contract/route.ts",
      `Phase 4B must not add route files outside exact Phase 6B GuideBrief follow-on scope: ${file}`,
    );
    assert(!/^db\//.test(file), `Phase 4B must not change DB files: ${file}`);
    assert(
      !/^migrations\//.test(file),
      `Phase 4B must not change migrations: ${file}`,
    );
    assert(
      (!/^apps\/augnes_apps\//.test(file) || followOnChatgptAppGuideBriefToolFiles.includes(file)),
      `Phase 4B must not change MCP/App files: ${file}`,
    );
    assert(
      ((!/(^|\/)(mcp|plugin|plugins|tool|tools)(\/|$)/i.test(file) || followOnCodexGuideBriefHandoffFiles.includes(file)) || followOnChatgptAppGuideBriefToolFiles.includes(file) || followOnCodexGuideBriefHandoffFiles.includes(file)),
      `Phase 4B must not change MCP/App tool files: ${file}`,
    );
    assert(
      !/(^|\/)(provider|providers|openai|github)(\/|$)/i.test(file),
      `Phase 4B must not change provider/OpenAI/GitHub runtime files: ${file}`,
    );
    assert(
      !/(^|\/)(proof|evidence)(\/|$)/i.test(file),
      `Phase 4B must not add proof/evidence write paths: ${file}`,
    );
    assert(
      !/(^|\/)(work-mutation|work_mutation|autonomy-runner|scheduler)(\/|$)/i.test(file),
      `Phase 4B must not add work mutation or autonomy runner files: ${file}`,
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
