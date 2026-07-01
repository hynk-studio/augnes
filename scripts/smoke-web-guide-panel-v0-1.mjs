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

const panelFile = "components/guide/guide-brief-panel.tsx";
const sectionFile = "components/guide/guide-brief-section.tsx";
const summaryCardFile = "components/guide/guide-brief-summary-card.tsx";
const boundaryCardFile = "components/guide/guide-brief-boundary-card.tsx";
const miniPanelFile = "components/guide/guide-brief-mini-panel.tsx";
const webReadFile = "lib/guide/read-guide-brief-for-web.ts";
const homeComponentFile = "components/human-surface/human-surface-home.tsx";
const perspectiveWrapperFile =
  "components/perspective/perspective-public-constellation-surface.tsx";
const perspectiveSurfaceFile =
  "components/perspective/perspective-human-surface.tsx";
const workbenchComponentFile = "components/workplane/agent-workplane.tsx";
const guideBriefDoc = "docs/GUIDEBRIEF_CONTRACT_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-web-guide-panel-v0-1.mjs";

const priorSmokeAllowlistCompatibilityFiles = [
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
  "scripts/smoke-chatgpt-app-autonomy-contract-tool-v0-1.mjs",
];

const followOnHandoffCapsuleAppToolFiles = [
  "docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md",
  "scripts/smoke-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-route-v0-1.mjs",
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-handoff-capsule-tool-v0-1.mjs",
  "docs/CODEX_HANDOFF_CAPSULE_CONSUMPTION_V0_1.md",
  "plugins/augnes-operator/skills/augnes-handoff-capsule/SKILL.md",
  "scripts/smoke-codex-handoff-capsule-v0-1.mjs",
];

const followOnAutonomyContractCodexSkillFiles = [
  "docs/CODEX_AUTONOMY_CONTRACT_CONSUMPTION_V0_1.md",
  "plugins/augnes-operator/skills/augnes-autonomy-contract/SKILL.md",
  "scripts/smoke-codex-autonomy-contract-v0-1.mjs",
  "scripts/smoke-augnes-operator-plugin-v2.mjs",
  "docs/CODEX_AUGNES_OPERATOR_PLUGIN_V0_2.md",
  "docs/AUTONOMY_CONTRACT_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
  "scripts/smoke-autonomy-contract-v0-1.mjs",
  "scripts/smoke-autonomy-contract-route-v0-1.mjs",
  "scripts/smoke-autonomy-contract-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-autonomy-contract-tool-v0-1.mjs",
  "scripts/smoke-codex-guidebrief-handoff-v0-1.mjs",
  "scripts/smoke-codex-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-route-v0-1.mjs",
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-handoff-capsule-tool-v0-1.mjs",
  "scripts/smoke-handoff-capsule-copy-export-v0-1.mjs",
  "scripts/smoke-guide-brief-v0-1.mjs",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
  "scripts/smoke-web-guide-panel-v0-1.mjs",
];

const phase8fAutonomyContractCopyExportFiles = [
  "lib/autonomy/autonomy-contract-copy-export.ts",
  "components/autonomy/autonomy-copy-export-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "lib/autonomy/read-autonomy-contract-for-web.ts",
  "components/autonomy/autonomy-boundary-card.tsx",
  "components/autonomy/autonomy-contract-preview-panel.tsx",
  "scripts/smoke-autonomy-contract-copy-export-v0-1.mjs",
  "scripts/smoke-autonomy-contract-web-preview-v0-1.mjs",
  "docs/AUTONOMY_CONTRACT_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
];

const requiredFiles = [
  panelFile,
  sectionFile,
  summaryCardFile,
  boundaryCardFile,
  miniPanelFile,
  webReadFile,
  homeComponentFile,
  perspectiveWrapperFile,
  perspectiveSurfaceFile,
  workbenchComponentFile,
  guideBriefDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
];

const phase9aAutonomyRunnerPreflightFiles = [
  "docs/AUTONOMY_RUNNER_PREFLIGHT_V0_1.md",
  "types/autonomy-runner.ts",
  "lib/autonomy/autonomy-runner-preflight.ts",
  "fixtures/autonomy-runner-preflight.sample.v0.1.json",
  "scripts/smoke-autonomy-runner-preflight-v0-1.mjs",
  "app/api/augnes/read/autonomy-runner-preflight/route.ts",
  "lib/autonomy/autonomy-runner-preflight-source.ts",
  "scripts/smoke-autonomy-runner-preflight-route-v0-1.mjs",
  "lib/autonomy/read-autonomy-runner-preflight-for-web.ts",
  "components/autonomy/autonomy-runner-preflight-preview-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "scripts/smoke-autonomy-runner-preflight-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-autonomy-runner-preflight-tool-v0-1.mjs",
  "docs/CODEX_AUTONOMY_RUNNER_PREFLIGHT_CONSUMPTION_V0_1.md",
  "plugins/augnes-operator/skills/augnes-autonomy-runner-preflight/SKILL.md",
  "scripts/smoke-codex-autonomy-runner-preflight-v0-1.mjs",
  "lib/autonomy/autonomy-runner-preflight-copy-export.ts",
  "components/autonomy/autonomy-runner-preflight-copy-export-panel.tsx",
  "scripts/smoke-autonomy-runner-preflight-copy-export-v0-1.mjs",
  "docs/AUTONOMY_RUNNER_SKELETON_PLANNING_V0_1.md",
  "docs/AUTONOMY_RUNNER_OPERATOR_APPROVAL_GATE_V0_1.md",
  "scripts/smoke-autonomy-runner-skeleton-planning-v0-1.mjs",
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
  ...priorSmokeAllowlistCompatibilityFiles,
  ...followOnChatgptAppGuideBriefToolFiles,
  ...followOnHandoffCapsuleAppToolFiles,
  ...followOnAutonomyContractCodexSkillFiles,
  ...phase8fAutonomyContractCopyExportFiles,
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
const phase8cAutonomyContractWebPreviewFiles = [
  "components/autonomy/autonomy-boundary-card.tsx",
  "components/autonomy/autonomy-budget-preview-panel.tsx",
  "components/autonomy/autonomy-contract-preview-panel.tsx",
  "components/autonomy/autonomy-policy-preview-panel.tsx",
  "components/autonomy/autonomy-preview-shared.tsx",
  "components/autonomy/autonomy-run-preview-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "lib/autonomy/read-autonomy-contract-for-web.ts",
  "scripts/smoke-autonomy-contract-web-preview-v0-1.mjs",
];
for (const file of phase8cAutonomyContractWebPreviewFiles) {
  allowedChangedFiles.add(file);
}

const textByFile = loadTextByFile(requiredFiles);
const panelText = textByFile.get(panelFile);
const sectionText = textByFile.get(sectionFile);
const summaryCardText = textByFile.get(summaryCardFile);
const boundaryCardText = textByFile.get(boundaryCardFile);
const miniPanelText = textByFile.get(miniPanelFile);
const webReadText = textByFile.get(webReadFile);
const homeText = textByFile.get(homeComponentFile);
const perspectiveWrapperText = textByFile.get(perspectiveWrapperFile);
const perspectiveSurfaceText = textByFile.get(perspectiveSurfaceFile);
const workbenchText = textByFile.get(workbenchComponentFile);
const docText = textByFile.get(guideBriefDoc);
const indexText = textByFile.get(indexDoc);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageJsonScript();
assertSharedPanelContract();
assertWebReadPath();
assertSurfaceEntries();
assertDocsAndIndex();
assertNoActionControls();
assertNoForbiddenRuntimeCode();
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
  "scripts/smoke-handoff-capsule-route-v0-1.mjs",
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
];
for (const file of followOnHandoffCapsuleWebPreviewFiles) {
  allowedChangedFiles.add(file);
}

const followOnHandoffCapsuleCopyExportFiles = [
  "lib/handoff/handoff-capsule-copy-export.ts",
  "components/handoff/handoff-copy-export-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "lib/handoff/read-handoff-capsule-for-web.ts",
  "components/handoff/handoff-preview-boundary-card.tsx",
  "components/handoff/codex-launch-card-preview-panel.tsx",
  "components/handoff/handoff-capsule-preview-panel.tsx",
  "scripts/smoke-handoff-capsule-copy-export-v0-1.mjs",
];
for (const file of followOnHandoffCapsuleCopyExportFiles) {
  allowedChangedFiles.add(file);
}

const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "web-guide-panel-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      shared_panel_component_checked: true,
      guide_brief_labels_checked: true,
      read_only_boundary_copy_checked: true,
      web_read_path_checked: true,
      home_entry_checked: true,
      perspective_entry_checked: true,
      workbench_entry_checked: true,
      docs_index_checked: true,
      no_chat_composer_checked: true,
      no_positive_write_execute_controls_checked: true,
      no_route_handlers_changed_checked: true,
      no_mcp_app_tool_files_changed_checked: true,
      no_db_migration_schema_changed_checked: true,
      no_provider_openai_github_codex_calls_checked: true,
      no_proof_evidence_write_code_checked: true,
      no_scheduler_autonomy_runner_checked: true,
      no_handoff_execution_checked: true,
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      prior_smoke_allowlist_compatibility_files_allowed:
        priorSmokeAllowlistCompatibilityFiles,
      smoke_type:
        "static-web-guide-panel-component-source-doc-package-boundary-only",
    },
    null,
    2,
  ),
);
console.log("PASS smoke:web-guide-panel-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:web-guide-panel-v0-1",
    expectedCommand: "node scripts/smoke-web-guide-panel-v0-1.mjs",
  });
}

function assertSharedPanelContract() {
  assertContainsAll(
    panelText,
    [
      "GuideBrief",
      "read-only guide packet",
      "Observed",
      "Inferred",
      "Suggested",
      "Needs user judgment",
      "Staleness warnings",
      "Source refs",
      "Source-backed read-model observations only.",
      "Derived interpretation only",
      "Candidate next actions or navigation suggestions only.",
      "Unresolved choices for a user, operator, or PM.",
      "data-guide-brief-panel",
    ],
    { label: panelFile },
  );

  assertContainsAll(
    boundaryCardText,
    [
      "Authority boundary",
      "No hidden execution authority",
      "Suggestions are not actions",
      "The guide does not decide user judgment items",
      "Handoff candidates are preview-only",
      "can_create_ui_action",
      "can_send_handoff",
      "can_execute_codex",
    ],
    { label: boundaryCardFile },
  );

  assertContainsAll(
    miniPanelText,
    ["GuideBriefPanel", 'variant: "home" | "perspective" | "workbench"'],
    { label: miniPanelFile },
  );

  assertContainsAll(
    sectionText,
    ["section", "aria-labelledby", "No guide items materialized."],
    { label: sectionFile },
  );

  assertContainsAll(
    summaryCardText,
    [
      "GuideBrief summary",
      "Research pressure",
      "Projected deltas",
      "Review queue",
    ],
    { label: summaryCardFile },
  );
}

function assertWebReadPath() {
  assertContainsAll(
    webReadText,
    [
      "export function readGuideBriefForWeb",
      "validateGuideBriefReadRequest",
      "readGuideBriefForRoute({ scope: validation.scope })",
      "buildPublicSafeGuideBriefFallback",
      "public_safe_fixture_fallback",
      "No explicit local read-only request context was supplied to the Web Guide display.",
      "Live GuideBrief route data remains marker-gated and local-host-gated.",
      "Phase 6C adds read-only Web Guide panel skeleton rendering.",
      "Web Guide display uses a public-safe fallback unless an explicit local read-only request context passes the Phase 6B GuideBrief route guard.",
      "Phase 6D ChatGPT App/MCP Guide tool remains deferred.",
      "Phase 6E Codex Guide alignment remains deferred.",
      "Phase 7 Handoff Capsule / Codex Launch Card remains deferred.",
    ],
    { label: webReadFile },
  );

  assert(
    !/readGuideBriefForRoute\s*\(\s*\{\s*scope:\s*GUIDE_BRIEF_ROUTE_SCOPE\s*\}\s*\)/.test(
      webReadText,
    ),
    `${webReadFile} must not directly call readGuideBriefForRoute({ scope: GUIDE_BRIEF_ROUTE_SCOPE }) from public Web rendering`,
  );
  assert(
    /validateGuideBriefReadRequest[\s\S]+validation\.ok[\s\S]+readGuideBriefForRoute\s*\(\s*\{\s*scope:\s*validation\.scope\s*\}\s*\)/.test(
      webReadText,
    ),
    `${webReadFile} must call readGuideBriefForRoute only after GuideBrief local read validation succeeds`,
  );
  assert(
    /return\s+buildPublicSafeGuideBriefFallback/.test(webReadText),
    `${webReadFile} must return public-safe fallback on default or failed validation paths`,
  );

  assert(
    /\bimport\s+type\s+\{\s*GuideBrief\s*\}/.test(webReadText),
    `${webReadFile} must import GuideBrief as a type`,
  );
  assert(
    !/\bfetch\s*\(/.test(webReadText),
    `${webReadFile} must not fetch the local API route`,
  );
}

function assertSurfaceEntries() {
  assertContainsAll(
    homeText,
    [
      "readGuideBriefForWeb",
      "GuideBriefMiniPanel",
      'variant="home"',
      "<CurrentPerspectiveCard",
    ],
    { label: homeComponentFile },
  );

  assertContainsAll(
    perspectiveWrapperText,
    ["readGuideBriefForWeb", "guideBrief={guideBrief}"],
    { label: perspectiveWrapperFile },
  );

  assertContainsAll(
    perspectiveSurfaceText,
    [
      "GuideBriefMiniPanel",
      "guideBrief: GuideBrief",
      'variant="perspective"',
      "<PerspectiveDeltaInspector",
      "<PerspectiveBoundaryNextPanel",
    ],
    { label: perspectiveSurfaceFile },
  );

  assertContainsAll(
    workbenchText,
    [
      "readGuideBriefForWeb",
      "GuideBriefMiniPanel",
      'variant="workbench"',
      "<WorkplaneOverview",
      "<LegacyCockpitCompatibilityPanel>",
    ],
    { label: workbenchComponentFile },
  );
}

function assertDocsAndIndex() {
  assertContainsAll(
    docText,
    [
      "Phase 6C Web Guide Read-Only Panel Skeleton",
      "shared display components",
      "Entry points:",
      "`/`",
      "`/perspective`",
      "`/workbench`",
      "The Web Guide UI preserves the required separation",
      "The Web Guide panel is read-only display only",
      "Public Web surfaces must not bypass the Phase 6B local read guard",
      "public_safe_fixture_fallback",
      "The live GuideBrief route remains marker-gated and local read-only",
      "source/fallback status must remain visible",
      "does not include a chat composer",
      "Phase 6D ChatGPT App/MCP Guide tool",
      "Phase 6E Codex Guide alignment",
      "Phase 7 Handoff Capsule / Codex Launch Card",
    ],
    { label: guideBriefDoc },
  );

  assertContainsAll(
    indexText,
    [
      "Phase 6C adds a read-only Web Guide panel skeleton",
      "components/guide/*",
      "lib/guide/read-guide-brief-for-web.ts",
      "no UI action/write/execution authority",
      "no chat composer",
      "public-safe GuideBrief fallback",
      "source/fallback status",
      "x-augnes-local-readonly: guide-brief-v0.1",
    ],
    { label: indexDoc },
  );
}

function assertNoActionControls() {
  const implementationFiles = [
    panelFile,
    sectionFile,
    summaryCardFile,
    boundaryCardFile,
    miniPanelFile,
    homeComponentFile,
    perspectiveWrapperFile,
    perspectiveSurfaceFile,
    workbenchComponentFile,
  ];

  for (const file of implementationFiles) {
    const text = textByFile.get(file);
    assert(!/<\s*button\b/i.test(text), `${file} must not render a button`);
    assert(!/<\s*textarea\b/i.test(text), `${file} must not render a textarea`);
    assert(!/<\s*form\b/i.test(text), `${file} must not render a form`);
    assert(
      !/\bplaceholder\s*=\s*["'][^"']*(chat|prompt|message)/i.test(text),
      `${file} must not add a chat or prompt input`,
    );

    const positiveControlPattern =
      /<\s*(?:button|a)\b[^>]*>[\s\S]{0,120}\b(apply|approve|reject|send|launch codex|create pr|record proof|create evidence|persist|commit|merge|deploy|retry|replay|publish|copy handoff)\b/i;
    assert(
      !positiveControlPattern.test(text),
      `${file} must not render positive write/execute controls`,
    );
  }
}

function assertNoForbiddenRuntimeCode() {
  const checkedText = [
    panelText,
    sectionText,
    summaryCardText,
    boundaryCardText,
    miniPanelText,
    webReadText,
    homeText,
    perspectiveWrapperText,
    perspectiveSurfaceText,
    workbenchText,
  ].join("\n");

  const forbiddenPatterns = [
    /\bfetch\s*\(/,
    /\bappendWorkEvent\b/,
    /\bappendCoordinationEvent\b/,
    /\bcreateEvidenceRecord\b/,
    /\brecordProof\b/,
    /\bcommitState\b/,
    /\brejectState\b/,
    /\bcommitStateDeltaProposal\b/,
    /\brejectStateDeltaProposal\b/,
    /@openai/,
    /\bfrom\s+["']openai["']/,
    /\boctokit\b/i,
    /\bgithub\b.*\b(rest|graphql|request|client|token)\b/i,
    /\bcreatePullRequest\b/,
    /\bchild_process\b/,
    /\bspawn\s*\(/,
    /\bexecFile\s*\(/,
    /\bwriteFileSync\b/,
    /\bprocess\.env\b/,
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+[A-Za-z_][\w.]*\s+SET\b/i,
    /\bDELETE\s+FROM\b/i,
    /\bCREATE\s+TABLE\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bDROP\s+TABLE\b/i,
    /\bsetInterval\s*\(/,
    /\bsetTimeout\s*\(/,
    /\bautonomyRunner\b/i,
    /\bcreateMcpTool\b/i,
    /\bsendHandoff\b/i,
    /\bexecuteCodex\b/i,
    /\bserverAction\b/i,
  ];

  for (const pattern of forbiddenPatterns) {
    assert(
      !pattern.test(checkedText),
      `Phase 6C Web Guide files must not add forbidden runtime code matching ${pattern}`,
    );
  }
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
      `Unexpected Phase 6C Web Guide changed or untracked file: ${file}`,
    );
    assert(
      !/^app\/api\//.test(file) ||
        file === "app/api/augnes/read/autonomy-contract/route.ts" ||
        file === "app/api/augnes/read/autonomy-runner-preflight/route.ts",
      `Phase 6C must not change API routes: ${file}`,
    );
    assert(
      !/^app\/.*route\.(ts|tsx|js|jsx)$/.test(file) ||
        file === "app/api/augnes/read/autonomy-contract/route.ts" ||
        file === "app/api/augnes/read/autonomy-runner-preflight/route.ts",
      `Phase 6C must not add route handlers: ${file}`,
    );
    assert(!/^db\//.test(file), `Phase 6C must not change DB files: ${file}`);
    assert(
      !/^migrations\//.test(file),
      `Phase 6C must not change migrations: ${file}`,
    );
    assert(
      (!/^apps\/augnes_apps\//.test(file) || followOnChatgptAppGuideBriefToolFiles.includes(file)),
      `Phase 6C must not change MCP/App files: ${file}`,
    );
    assert(
      ((!/(^|\/)(mcp|plugin|plugins|tool|tools)(\/|$)/i.test(file) ||
        followOnCodexGuideBriefHandoffFiles.includes(file)) ||
        followOnChatgptAppGuideBriefToolFiles.includes(file) ||
        followOnCodexGuideBriefHandoffFiles.includes(file) ||
        followOnHandoffCapsuleAppToolFiles.includes(file) ||
        followOnAutonomyContractCodexSkillFiles.includes(file) || phase9aAutonomyRunnerPreflightFiles.includes(file)),
      `Phase 6C must not change MCP/App tool files: ${file}`,
    );
    assert(
      !/(^|\/)(provider|providers|openai|github)(\/|$)/i.test(file),
      `Phase 6C must not change provider/OpenAI/GitHub runtime files: ${file}`,
    );
    assert(
      !/(^|\/)(proof|evidence)(\/|$)/i.test(file),
      `Phase 6C must not add proof/evidence write paths: ${file}`,
    );
    assert(
      !/(^|\/)(work-mutation|work_mutation|autonomy-runner|scheduler)(\/|$)/i.test(file),
      `Phase 6C must not add scheduler or autonomy runner files: ${file}`,
    );
  }

  return {
    checked: workingTree.checked || cached.checked || baseRange.checked,
    skipped: !(workingTree.checked || cached.checked || baseRange.checked),
    skip_reason:
      workingTree.checked || cached.checked || baseRange.checked
        ? null
        : "changed-file boundary could not be checked",
    files,
  };
}
