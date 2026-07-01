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

const contractDoc = "docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs";
const readHelperFile = "lib/handoff/read-handoff-capsule-for-web.ts";
const capsulePanelFile =
  "components/handoff/handoff-capsule-preview-panel.tsx";
const launchCardPanelFile =
  "components/handoff/codex-launch-card-preview-panel.tsx";
const boundaryCardFile =
  "components/handoff/handoff-preview-boundary-card.tsx";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const handoffBuilderPanelFile =
  "components/workplane/handoff-builder-preview-panel.tsx";
const handoffRouteFile =
  "app/api/augnes/read/handoff-capsule/route.ts";
const launchCardRouteFile =
  "app/api/augnes/read/codex-launch-card/route.ts";
const phase7aSmokeFile = "scripts/smoke-handoff-capsule-v0-1.mjs";

const requiredFiles = [
  contractDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
  readHelperFile,
  capsulePanelFile,
  launchCardPanelFile,
  boundaryCardFile,
  agentWorkplaneFile,
  handoffBuilderPanelFile,
  handoffRouteFile,
  launchCardRouteFile,
  phase7aSmokeFile,
];

const priorSmokeAllowlistCompatibilityFiles = [
  "scripts/smoke-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-route-v0-1.mjs",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
  "scripts/smoke-web-guide-panel-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-perspective-human-timeline-v0-1.mjs",
  "scripts/smoke-guide-brief-v0-1.mjs",
  "scripts/smoke-codex-guidebrief-handoff-v0-1.mjs",
];

const allowedChangedFiles = new Set([
  contractDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
  readHelperFile,
  capsulePanelFile,
  launchCardPanelFile,
  boundaryCardFile,
  agentWorkplaneFile,
  ...priorSmokeAllowlistCompatibilityFiles,
]);

const textByFile = loadTextByFile(requiredFiles);
const contractText = textByFile.get(contractDoc);
const indexText = textByFile.get(indexDoc);
const packageJsonText = textByFile.get(packageJsonFile);
const readHelperText = textByFile.get(readHelperFile);
const capsulePanelText = textByFile.get(capsulePanelFile);
const launchCardPanelText = textByFile.get(launchCardPanelFile);
const boundaryCardText = textByFile.get(boundaryCardFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const handoffBuilderText = textByFile.get(handoffBuilderPanelFile);
const handoffRouteText = textByFile.get(handoffRouteFile);
const launchCardRouteText = textByFile.get(launchCardRouteFile);
const phase7aSmokeText = textByFile.get(phase7aSmokeFile);

assertPackageJsonScript();
assertDocsAndIndex();
assertReadHelper();
assertPreviewComponents();
assertWorkbenchIntegration();
assertNoActionControls();
assertNoForbiddenHelperCode();
assertPhase7aAnd7bBoundaries();
const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "handoff-capsule-web-preview-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      docs_phase7c_checked: true,
      index_phase7c_checked: true,
      read_helper_public_safe_fallback_checked: true,
      preview_panel_exports_checked: true,
      workbench_integration_checked: true,
      guide_brief_mini_panel_preserved: true,
      handoff_builder_preview_preserved: true,
      legacy_cockpit_compatibility_preserved: true,
      observed_inferred_suggested_judgment_labels_checked: true,
      codex_launch_card_fields_checked: true,
      no_action_controls_checked: true,
      no_copy_export_behavior_checked: true,
      no_route_files_changed_checked: true,
      phase7a_launch_card_status_regression_checked: true,
      phase7b_get_only_routes_checked: true,
      changed_files_boundary_checked: changedFilesBoundary.checked,
      changed_files_boundary_skipped: changedFilesBoundary.skipped,
      changed_files_boundary_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      smoke_type:
        "static-handoff-capsule-web-preview-component-helper-doc-package-boundary-only",
    },
    null,
    2,
  ),
);
console.log("PASS smoke:handoff-capsule-web-preview-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:handoff-capsule-web-preview-v0-1",
    expectedCommand:
      "node scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
  });
}

function assertDocsAndIndex() {
  assertContainsAll(contractText, [
    "Phase 7C Web Preview UI",
    "Web preview UI renders Handoff Capsule and Codex Launch Card as read-only preview panels.",
    "Primary placement is `/workbench` Agent Workplane.",
    "Public Web default uses public-safe fallback",
    "No action buttons.",
    "No copy/export.",
    "No send.",
    "No launch.",
    "No Codex execution.",
    "No GitHub actuation.",
    "No branch/PR creation.",
    "No provider/OpenAI calls.",
    "No DB write.",
    "No proof/evidence writes.",
    "No memory mutation.",
    "No durable Perspective apply.",
    "No scheduler/autonomy runner.",
    "No product-write.",
    "No external side effects.",
    "Phase 7D ChatGPT App/MCP tool remains deferred.",
    "Phase 7E Codex skill alignment remains deferred.",
    "Phase 7F copy/export remains deferred.",
  ], { label: contractDoc });

  assertContainsAll(indexText, [
    "Phase 7C Handoff Capsule / Codex Launch Card Web preview UI v0.1",
    "`/workbench`\n  Agent Workplane",
    "public_safe_fixture_fallback",
    "source/fallback status",
    "preview-only",
    "no action authority",
  ], { label: indexDoc });
}

function assertReadHelper() {
  assertContainsAll(readHelperText, [
    "export function readHandoffCapsulePreviewForWeb",
    "export function buildPublicSafeHandoffCapsulePreviewFallback",
    "export function buildPublicSafeCodexLaunchCardPreviewFallback",
    "HANDOFF_PREVIEW_PUBLIC_SAFE_FALLBACK_SOURCE",
    "HANDOFF_PREVIEW_PUBLIC_SAFE_FALLBACK_REFS",
    "public_safe_fixture_fallback",
    "local_readonly_route_context",
    "validation_failed_fallback",
    "validateHandoffCapsuleReadRequest",
    "validateCodexLaunchCardReadRequest",
    "readHandoffCapsuleForRoute",
    "readCodexLaunchCardForRoute",
    "Live route-composed preview data remains marker-gated and local-host-gated by the Phase 7B route validators.",
    "Route-composed repo/task fields may be synthetic or operator-supplied preview defaults.",
  ], { label: readHelperFile });

  assert(
    !/readHandoffCapsuleForRoute\s*\(\s*\{[^}]*HANDOFF_CAPSULE_ROUTE_SCOPE/s.test(
      readHelperText,
    ),
    `${readHelperFile} must not directly call route readers with default scope outside a validated request path`,
  );
}

function assertPreviewComponents() {
  assertContainsAll(capsulePanelText, [
    "export function HandoffCapsulePreviewPanel",
    "Handoff Capsule preview",
    "Preview only: no send, no launch, no execution, no mutation.",
    "Observed",
    "Inferred",
    "Suggested",
    "Needs user judgment",
    "Selected delta refs",
    "Validation expectations",
    "Constraints and forbidden actions",
    "Source refs",
    "source/fallback status",
  ], { label: capsulePanelFile });

  assertContainsAll(launchCardPanelText, [
    "export function CodexLaunchCardPreviewPanel",
    "Codex Launch Card preview",
    "This is not Codex execution, not branch creation, not PR creation, not",
    "No status may mean executed.",
    "Expected files",
    "Forbidden files",
    "Required checks",
    "Optional checks",
    "Skipped-check policy",
    "PR body requirements",
    "Final report requirements",
    "Suggested for Codex",
    "Needs user judgment",
  ], { label: launchCardPanelFile });

  assertContainsAll(boundaryCardText, [
    "export function HandoffPreviewBoundaryCard",
    "Authority boundary",
    "no handoff send",
    "no Codex execution",
    "no GitHub actuation",
    "no branch/PR creation",
    "no provider/OpenAI calls",
    "no DB write",
    "no proof/evidence writes",
    "no memory mutation",
    "no durable Perspective apply",
    "no scheduler/autonomy",
    "no external side effects",
  ], { label: boundaryCardFile });
}

function assertWorkbenchIntegration() {
  assertContainsAll(agentWorkplaneText, [
    "readHandoffCapsulePreviewForWeb",
    "HandoffCapsulePreviewPanel",
    "CodexLaunchCardPreviewPanel",
    "HandoffPreviewBoundaryCard",
    "GuideBriefMiniPanel",
    "HandoffBuilderPreviewPanel",
    "LegacyCockpitCompatibilityPanel",
    "AugnesCockpit",
    "Agent Workplane projection and handoff previews",
    "handoffPreview",
  ], { label: agentWorkplaneFile });

  assertContainsAll(handoffBuilderText, [
    "Handoff Builder preview",
    "This preview does not copy, send, launch Codex, create PRs, call GitHub",
  ], { label: handoffBuilderPanelFile });
}

function assertNoActionControls() {
  const scanned = [
    [capsulePanelFile, capsulePanelText],
    [launchCardPanelFile, launchCardPanelText],
    [boundaryCardFile, boundaryCardText],
    [agentWorkplaneFile, agentWorkplaneText],
  ];
  const forbiddenPatterns = [
    /<button\b/i,
    /<form\b/i,
    /<input\b/i,
    /<textarea\b/i,
    /\bonClick\s*=/,
    /\bonSubmit\s*=/,
    /\baction\s*=/,
    /\bformAction\s*=/,
    /\bfetch\s*\(/,
    /\brouter\.push\s*\(/,
    /\bwindow\.open\s*\(/,
    /\bnavigator\.clipboard\b/,
    /copy\s*\(/i,
    /export\s*\(/i,
  ];

  for (const [file, text] of scanned) {
    for (const pattern of forbiddenPatterns) {
      assert(
        !pattern.test(text),
        `${file} must not include positive action/control pattern ${pattern}`,
      );
    }
  }
}

function assertNoForbiddenHelperCode() {
  const forbiddenHelperPatterns = [
    /from\s+["']@\/lib\/db/,
    /from\s+["']@\/app\//,
    /from\s+["']@\/components\//,
    /from\s+["']@\/apps\/augnes_apps/,
    /from\s+["'][^"']*(openai|octokit|github|provider)[^"']*["']/i,
    /\bfetch\s*\(/,
    /\bchild_process\b/,
    /\bspawn\s*\(/,
    /\bexec\s*\(/,
    /\bwriteFile(?:Sync)?\s*\(/,
    /\bappendFile(?:Sync)?\s*\(/,
    /\blaunchCodex\b/i,
    /\bsendHandoff\b/i,
    /\bcreatePullRequest\b/i,
    /\brecordProof\b/i,
    /\bcreateEvidenceRecord\b/i,
    /\bcommitStateUpdate\b/i,
  ];

  for (const pattern of forbiddenHelperPatterns) {
    assert(
      !pattern.test(readHelperText),
      `${readHelperFile} must not include forbidden helper pattern ${pattern}`,
    );
  }
}

function assertPhase7aAnd7bBoundaries() {
  assert(
    !contractText.includes("No status means executed"),
    `${contractDoc} must not imply status means executed`,
  );
  assertContainsAll(contractText, [
    "No status may mean \"executed\"; every status can only describe",
  ], { label: contractDoc });
  assertContainsAll(phase7aSmokeText, [
    "!docText.includes(\"No status means executed\")",
    "No status may mean \\\"executed\\\"; every status can only describe review/preparation state.",
  ], { label: phase7aSmokeFile });

  for (const [file, text] of [
    [handoffRouteFile, handoffRouteText],
    [launchCardRouteFile, launchCardRouteText],
  ]) {
    assertContainsAll(text, [
      'export const runtime = "nodejs"',
      'export const dynamic = "force-dynamic"',
      "export async function GET(request: Request)",
      "NextResponse.json",
      "READONLY_RESPONSE_HEADERS",
    ], { label: file });

    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      assert(
        !new RegExp(`export\\s+(?:async\\s+)?function\\s+${method}\\b`).test(
          text,
        ),
        `${file} must remain GET-only and must not export ${method}`,
      );
    }
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
      `Unexpected Phase 7C changed or untracked file: ${file}`,
    );
    assert(
      !/^app\/api\//.test(file),
      `Phase 7C must not change API route files: ${file}`,
    );
    assert(
      !/^apps\/augnes_apps\//.test(file),
      `Phase 7C must not change MCP/App tool files: ${file}`,
    );
    assert(
      !/^migrations\//.test(file),
      `Phase 7C must not change DB migration files: ${file}`,
    );
    assert(
      !/^lib\/db(\/|\.|$)/.test(file),
      `Phase 7C must not change DB runtime files: ${file}`,
    );
    assert(
      !/(^|\/)(provider|providers|openai|github|octokit)(\/|$)/i.test(file),
      `Phase 7C must not change provider/OpenAI/GitHub runtime files: ${file}`,
    );
    assert(
      !/(^|\/)(proof|evidence)(\/|$)/i.test(file),
      `Phase 7C must not add proof/evidence write paths: ${file}`,
    );
    assert(
      !/(^|\/)(scheduler|autonomy-runner|autonomy_runner)(\/|$)/i.test(file),
      `Phase 7C must not add scheduler/autonomy runner files: ${file}`,
    );
  }

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
    skip_reason: !(
      workingTree.checked ||
      cached.checked ||
      baseRange.checked ||
      untrackedFiles.length > 0
    )
      ? "No changed-file boundary available from git diff or merge base."
      : null,
    files,
    base_ref: baseRange.base_ref,
  };
}
