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

const helperFile = "lib/handoff/handoff-capsule-copy-export.ts";
const componentFile = "components/handoff/handoff-copy-export-panel.tsx";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const readHelperFile = "lib/handoff/read-handoff-capsule-for-web.ts";
const boundaryCardFile =
  "components/handoff/handoff-preview-boundary-card.tsx";
const capsulePanelFile =
  "components/handoff/handoff-capsule-preview-panel.tsx";
const launchCardPanelFile =
  "components/handoff/codex-launch-card-preview-panel.tsx";
const contractDoc = "docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-handoff-capsule-copy-export-v0-1.mjs";
const webPreviewSmokeFile =
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs";
const phase7aSmokeFile = "scripts/smoke-handoff-capsule-v0-1.mjs";
const handoffRouteFile =
  "app/api/augnes/read/handoff-capsule/route.ts";
const launchCardRouteFile =
  "app/api/augnes/read/codex-launch-card/route.ts";
const appToolSmokeFile =
  "scripts/smoke-chatgpt-app-handoff-capsule-tool-v0-1.mjs";
const codexSkillSmokeFile = "scripts/smoke-codex-handoff-capsule-v0-1.mjs";

const requiredFiles = [
  helperFile,
  componentFile,
  agentWorkplaneFile,
  readHelperFile,
  boundaryCardFile,
  capsulePanelFile,
  launchCardPanelFile,
  contractDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
  webPreviewSmokeFile,
  phase7aSmokeFile,
  handoffRouteFile,
  launchCardRouteFile,
  appToolSmokeFile,
  codexSkillSmokeFile,
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
  helperFile,
  componentFile,
  agentWorkplaneFile,
  readHelperFile,
  boundaryCardFile,
  capsulePanelFile,
  launchCardPanelFile,
  contractDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
  webPreviewSmokeFile,
  "scripts/smoke-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-route-v0-1.mjs",
  "scripts/smoke-chatgpt-app-handoff-capsule-tool-v0-1.mjs",
  "scripts/smoke-codex-handoff-capsule-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
  "scripts/smoke-guide-brief-v0-1.mjs",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
  "scripts/smoke-web-guide-panel-v0-1.mjs",
  "scripts/smoke-chatgpt-app-guide-brief-tool-v0-1.mjs",
  "scripts/smoke-codex-guidebrief-handoff-v0-1.mjs",
  "docs/CODEX_AUTONOMY_CONTRACT_CONSUMPTION_V0_1.md",
  "plugins/augnes-operator/skills/augnes-autonomy-contract/SKILL.md",
  "scripts/smoke-codex-autonomy-contract-v0-1.mjs",
  "scripts/smoke-augnes-operator-plugin-v2.mjs",
  "docs/CODEX_AUGNES_OPERATOR_PLUGIN_V0_2.md",
  "scripts/smoke-autonomy-contract-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-autonomy-contract-tool-v0-1.mjs",
  "scripts/smoke-guide-brief-v0-1.mjs",
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

const phase8dAutonomyContractAppToolFiles = new Set([
  "apps/augnes_apps/src/server.ts",
  "apps/augnes_apps/src/lib/state-runtime-types.ts",
  "apps/augnes_apps/src/adapters/state-runtime-http.ts",
  "apps/augnes_apps/scripts/invariants.ts",
  "apps/augnes_apps/scripts/smoke.ts",
  "apps/augnes_apps/scripts/mock-state-runtime.ts",
  "docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md",
  "scripts/smoke-chatgpt-app-autonomy-contract-tool-v0-1.mjs",
]);
for (const file of phase8dAutonomyContractAppToolFiles) {
  allowedChangedFiles.add(file);
}

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
for (const file of phase8fAutonomyContractCopyExportFiles) {
  allowedChangedFiles.add(file);
}

const textByFile = loadTextByFile(requiredFiles);
const helperText = textByFile.get(helperFile);
const componentText = textByFile.get(componentFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const readHelperText = textByFile.get(readHelperFile);
const boundaryCardText = textByFile.get(boundaryCardFile);
const capsulePanelText = textByFile.get(capsulePanelFile);
const launchCardPanelText = textByFile.get(launchCardPanelFile);
const contractText = textByFile.get(contractDoc);
const indexText = textByFile.get(indexDoc);
const packageJsonText = textByFile.get(packageJsonFile);
const webPreviewSmokeText = textByFile.get(webPreviewSmokeFile);
const phase7aSmokeText = textByFile.get(phase7aSmokeFile);
const handoffRouteText = textByFile.get(handoffRouteFile);
const launchCardRouteText = textByFile.get(launchCardRouteFile);
const appToolSmokeText = textByFile.get(appToolSmokeFile);
const codexSkillSmokeText = textByFile.get(codexSkillSmokeFile);

assertPackageJsonScript();
assertHelper();
assertComponent();
assertWorkbenchIntegration();
assertDocsAndIndex();
assertPriorPhaseBoundaries();
assertNoForbiddenCode();
const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "handoff-capsule-copy-export-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      helper_exports_checked: true,
      helper_boundary_checked: true,
      component_local_clipboard_checked: true,
      manual_copy_fallback_checked: true,
      workbench_integration_checked: true,
      docs_index_checked: true,
      phase7a_launch_card_status_regression_checked: true,
      phase7b_routes_get_only_checked: true,
      phase7d_app_tools_read_only_checked: true,
      phase7e_skill_instruction_only_checked: true,
      no_route_app_db_provider_codex_proof_autonomy_drift_checked: true,
      changed_files_boundary_checked: changedFilesBoundary.checked,
      changed_files_boundary_skipped: changedFilesBoundary.skipped,
      changed_files_boundary_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      smoke_type:
        "static-handoff-capsule-copy-export-helper-component-doc-package-boundary-only",
    },
    null,
    2,
  ),
);
console.log("PASS smoke:handoff-capsule-copy-export-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:handoff-capsule-copy-export-v0-1",
    expectedCommand:
      "node scripts/smoke-handoff-capsule-copy-export-v0-1.mjs",
  });
}

function assertHelper() {
  assertContainsAll(helperText, [
    "HANDOFF_COPY_EXPORT_PACKET_VERSION",
    "handoff_copy_export.v0.1",
    "HANDOFF_COPY_EXPORT_PACKET_KIND",
    "handoff_capsule_copy_export_preview",
    "HANDOFF_COPY_EXPORT_FINGERPRINT_ALGORITHM",
    "buildHandoffCapsuleMarkdownCopyPacket",
    "buildCodexLaunchCardMarkdownCopyPacket",
    "buildCombinedHandoffLaunchMarkdownCopyPacket",
    "buildHandoffCopyExportJsonPacket",
    "buildHandoffCopyExportPreview",
    "buildHandoffCopyExportInputSummary",
    "buildHandoffCopyExportFingerprint",
    "normalizeHandoffCopyText",
    "formatAuthorityBoundaryForCopy",
    "formatSourceStatusForCopy",
    "formatObservedInferredSuggestedJudgmentForCopy",
    "formatCodexLaunchCardFieldsForCopy",
    "Local clipboard/manual copy preview only.",
    "Copying does not send a handoff.",
    "Copying does not launch Codex.",
    "Copying does not execute Codex.",
    "Copying does not create a branch or PR.",
    "Copying does not call GitHub.",
    "Copying does not call OpenAI/provider APIs.",
    "Copying does not write DB records.",
    "Copying does not write proof/evidence.",
    "Copying does not mutate memory/state/work/Perspective.",
    "Copying does not publish, merge, retry, replay, deploy, or externally post.",
    "Copied text may become stale; re-copy before use if source/fallback status changes.",
    "Observed",
    "Inferred",
    "Suggested",
    "Needs User Judgment",
    "expected_files",
    "forbidden_files",
    "required_checks",
    "optional_checks",
    "skipped_check_policy",
    "pr_body_requirements",
    "final_report_requirements",
    "proof_evidence_boundary",
    "authority_boundary_summary",
    "source_status",
    "warnings",
    "gaps",
  ], { label: helperFile });

  assertNoPatterns(helperFile, helperText, [
    /from\s+["']@\/app\//,
    /from\s+["']@\/components\//,
    /from\s+["']@\/apps\/augnes_apps/,
    /from\s+["']@\/lib\/db/,
    /from\s+["'][^"']*(openai|octokit|github|provider)[^"']*["']/i,
    /\bfetch\s*\(/,
    /\bchild_process\b/,
    /\bspawn\s*\(/,
    /\bexec\s*\(/,
    /\bwriteFile(?:Sync)?\s*\(/,
    /\bappendFile(?:Sync)?\s*\(/,
    /\bDate\.now\s*\(/,
    /\bnew\s+Date\s*\(/,
    /\bMath\.random\s*\(/,
    /\bnavigator\b/,
    /\bwindow\b/,
    /\bdocument\b/,
    /\blaunchCodex\b/i,
    /\bsendHandoff\b/i,
    /\bcreatePullRequest\b/i,
    /\brecordProof\b/i,
    /\bcreateEvidenceRecord\b/i,
  ]);
}

function assertComponent() {
  assertContainsAll(componentText, [
    '"use client"',
    "export function HandoffCopyExportPanel",
    "buildHandoffCopyExportPreview",
    'type="button"',
    "Copy Handoff Capsule markdown",
    "Copy Codex Launch Card markdown",
    "Copy combined review packet",
    "Copy JSON preview",
    "navigator.clipboard.writeText",
    "manual copy fallback",
    "readOnly",
    "local_clipboard_only",
    "external_handoff_sent",
    "codex_executed",
    "github_called",
    "provider_called",
    "proof_evidence_written",
    "db_written",
    "state_mutated",
    "copy_persisted",
    "no_packet_copied",
    "current",
    "stale",
    "unavailable",
    "source/fallback status",
  ], { label: componentFile });

  assert(
    (componentText.match(/<button/g) ?? []).length >= 3,
    `${componentFile} must render local clipboard buttons`,
  );
  assert(
    (componentText.match(/type="button"/g) ?? []).length >= 3,
    `${componentFile} buttons must declare type="button"`,
  );
  assert(
    /<textarea[\s\S]*readOnly[\s\S]*value=/.test(componentText),
    `${componentFile} must provide a readOnly manual copy fallback textarea`,
  );

  assertNoPatterns(componentFile, componentText, [
    /\bfetch\s*\(/,
    /\bwindow\.open\s*\(/,
    /\bdownload\s*=/,
    /<form\b/i,
    /\btype=["']submit["']/i,
    /\bonSubmit\s*=/,
    /\bformAction\s*=/,
    /\/api\/augnes\/read\//,
    /\brouter\.push\s*\(/,
    /\bwriteFile(?:Sync)?\s*\(/,
    /\bappendFile(?:Sync)?\s*\(/,
  ]);
}

function assertWorkbenchIntegration() {
  assertContainsAll(agentWorkplaneText, [
    "HandoffCopyExportPanel",
    "HandoffCapsulePreviewPanel",
    "CodexLaunchCardPreviewPanel",
    "HandoffPreviewBoundaryCard",
    "GuideBriefMiniPanel",
    "HandoffBuilderPreviewPanel",
    "LegacyCockpitCompatibilityPanel",
    "RunPostmortemSkeletonPanel",
    "TraceDiagnosticsPanel",
  ], { label: agentWorkplaneFile });
}

function assertDocsAndIndex() {
  assertContainsAll(contractText, [
    "Phase 7F Local Copy/Export Preview",
    "Phase 7F adds local clipboard/manual copy preview",
    "lib/handoff/handoff-capsule-copy-export.ts",
    "components/handoff/handoff-copy-export-panel.tsx",
    "smoke:handoff-capsule-copy-export-v0-1",
    "Primary placement is `/workbench` Agent Workplane",
    "`/` and `/perspective` compact previews remain deferred",
    "File download/export-to-disk remains deferred",
    "local_clipboard_only true",
    "external_handoff_sent false",
    "codex_executed false",
    "github_called false",
    "provider_called false",
    "proof_evidence_written false",
    "db_written false",
    "state_mutated false",
    "copy_persisted false",
    "no external post",
    "no network send",
    "no fetch",
    "no window.open",
    "no download-to-file",
    "no API write route",
    "no App/MCP tool change",
    "no DB write",
    "no provider/OpenAI call",
    "no GitHub actuation",
    "no Codex execution",
    "no handoff send",
    "no branch/PR creation behavior from Augnes product code",
    "no proof/evidence write",
    "no memory mutation",
    "no durable Perspective apply",
    "no scheduler/autonomy runner",
    "no product-write",
    "no merge/publish/retry/replay/deploy",
    "no external side effects",
    "no persistence of copied packet state",
    "Copied text may become stale",
    "Phase 7 Handoff Capsule / Codex Launch Card preview stack is complete after",
    "Phase 8 Autonomy Contract may consume Handoff Capsule / Codex Launch Card",
  ], { label: contractDoc });

  assertContainsAll(indexText, [
    "Phase 7F Handoff Capsule / Codex Launch Card local copy/export preview v0.1",
    "`lib/handoff/handoff-capsule-copy-export.ts`",
    "`components/handoff/handoff-copy-export-panel.tsx`",
    "`scripts/smoke-handoff-capsule-copy-export-v0-1.mjs`",
    "local clipboard/manual copy preview only",
    "no external post",
    "file\n  download/export-to-disk",
    "external side effect",
  ], { label: indexDoc });
}

function assertPriorPhaseBoundaries() {
  assert(
    !contractText.includes("No status means executed"),
    `${contractDoc} must not imply status means executed`,
  );
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

  assertContainsAll(appToolSmokeText, [
    "read_only_annotations_checked",
    "model_only_tool_meta_checked",
    "phase7c_web_preview_read_only_checked",
  ], { label: appToolSmokeFile });
  assertContainsAll(codexSkillSmokeText, [
    "instruction-only",
    "no_copy_export_behavior_added_checked",
  ], { label: codexSkillSmokeFile });
  assertContainsAll(webPreviewSmokeText, [
    "HandoffCopyExportPanel",
    "navigator.clipboard.writeText",
    "manual copy fallback",
    "readOnly",
  ], { label: webPreviewSmokeFile });
}

function assertNoForbiddenCode() {
  const changedRuntimeTexts = [
    [helperFile, helperText],
    [componentFile, componentText],
    [agentWorkplaneFile, agentWorkplaneText],
    [readHelperFile, readHelperText],
    [boundaryCardFile, boundaryCardText],
    [capsulePanelFile, capsulePanelText],
    [launchCardPanelFile, launchCardPanelText],
  ];

  for (const [file, text] of changedRuntimeTexts) {
    assertNoPatterns(file, text, [
      /from\s+["'][^"']*(openai|octokit|github|provider)[^"']*["']/i,
      /\bcreatePullRequest\b/i,
      /\bmergePullRequest\b/i,
      /\bpublish\b\s*\(/i,
      /\bretry\b\s*\(/i,
      /\breplay\b\s*\(/i,
      /\bdeploy\b\s*\(/i,
      /\brecordProof\b/i,
      /\bcreateEvidenceRecord\b/i,
      /\bcommitStateUpdate\b/i,
      /\bsendHandoff\b/i,
      /\blaunchCodex\b/i,
      /\bexecuteCodex\b/i,
      /\bchild_process\b/,
      /\bwriteFile(?:Sync)?\s*\(/,
      /\bappendFile(?:Sync)?\s*\(/,
    ]);
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
      `Unexpected Phase 7F changed or untracked file: ${file}`,
    );
    assert(
      !/^app\/api\//.test(file) ||
        file === "app/api/augnes/read/autonomy-contract/route.ts" ||
        file === "app/api/augnes/read/autonomy-runner-preflight/route.ts",
      `Phase 7F must not change routes: ${file}`,
    );
    assert(
      !/^apps\/augnes_apps\//.test(file) ||
        phase8dAutonomyContractAppToolFiles.has(file),
      `Phase 7F must not change App/MCP files: ${file}`,
    );
    assert(
      !/^migrations\//.test(file),
      `Phase 7F must not change DB migrations: ${file}`,
    );
    assert(
      !/^lib\/db(\/|\.|$)/.test(file),
      `Phase 7F must not change DB runtime files: ${file}`,
    );
    assert(
      !/(^|\/)(provider|providers|openai|github|octokit)(\/|$)/i.test(file),
      `Phase 7F must not change provider/OpenAI/GitHub runtime files: ${file}`,
    );
    assert(
      !/(^|\/)(proof|evidence)(\/|$)/i.test(file),
      `Phase 7F must not add proof/evidence write paths: ${file}`,
    );
    assert(
      !/(^|\/)(scheduler|autonomy-runner|autonomy_runner)(\/|$)/i.test(file),
      `Phase 7F must not add scheduler/autonomy runner files: ${file}`,
    );
    assert(
      !/^plugins\//.test(file) ||
        file ===
          "plugins/augnes-operator/skills/augnes-autonomy-contract/SKILL.md",
      `Phase 7F must not change Codex skill/plugin files: ${file}`,
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

function assertNoPatterns(file, text, patterns) {
  for (const pattern of patterns) {
    assert(!pattern.test(text), `${file} must not include ${pattern}`);
  }
}
