#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  assertContainsAll,
  assertPackageScript,
  collectGitDiffFiles,
  collectUntrackedFiles,
  getBaseRangeChangedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const helperFile = "lib/autonomy/autonomy-contract-copy-export.ts";
const componentFile = "components/autonomy/autonomy-copy-export-panel.tsx";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const webReadHelperFile = "lib/autonomy/read-autonomy-contract-for-web.ts";
const contractPanelFile =
  "components/autonomy/autonomy-contract-preview-panel.tsx";
const budgetPanelFile =
  "components/autonomy/autonomy-budget-preview-panel.tsx";
const policyPanelFile =
  "components/autonomy/autonomy-policy-preview-panel.tsx";
const runPanelFile = "components/autonomy/autonomy-run-preview-panel.tsx";
const boundaryCardFile = "components/autonomy/autonomy-boundary-card.tsx";
const contractDoc = "docs/AUTONOMY_CONTRACT_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-autonomy-contract-copy-export-v0-1.mjs";

const routeFile = "app/api/augnes/read/autonomy-contract/route.ts";
const appToolSmokeFile =
  "scripts/smoke-chatgpt-app-autonomy-contract-tool-v0-1.mjs";
const codexSkillFile =
  "plugins/augnes-operator/skills/augnes-autonomy-contract/SKILL.md";
const codexSkillSmokeFile =
  "scripts/smoke-codex-autonomy-contract-v0-1.mjs";

const priorSmokeAllowlistCompatibilityFiles = [
  "scripts/smoke-autonomy-contract-web-preview-v0-1.mjs",
  "scripts/smoke-autonomy-contract-v0-1.mjs",
  "scripts/smoke-autonomy-contract-route-v0-1.mjs",
  "scripts/smoke-chatgpt-app-autonomy-contract-tool-v0-1.mjs",
  "scripts/smoke-codex-autonomy-contract-v0-1.mjs",
  "scripts/smoke-handoff-capsule-copy-export-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
  "scripts/smoke-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-route-v0-1.mjs",
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-handoff-capsule-tool-v0-1.mjs",
  "scripts/smoke-codex-handoff-capsule-v0-1.mjs",
  "scripts/smoke-guide-brief-v0-1.mjs",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
  "scripts/smoke-web-guide-panel-v0-1.mjs",
  "scripts/smoke-chatgpt-app-guide-brief-tool-v0-1.mjs",
  "scripts/smoke-codex-guidebrief-handoff-v0-1.mjs",
];

const requiredFiles = [
  helperFile,
  componentFile,
  agentWorkplaneFile,
  webReadHelperFile,
  contractPanelFile,
  budgetPanelFile,
  policyPanelFile,
  runPanelFile,
  boundaryCardFile,
  contractDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
  routeFile,
  appToolSmokeFile,
  codexSkillFile,
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
  "apps/augnes_apps/src/server.ts",
  "apps/augnes_apps/src/lib/state-runtime-types.ts",
  "apps/augnes_apps/src/adapters/state-runtime-http.ts",
  "apps/augnes_apps/scripts/invariants.ts",
  "apps/augnes_apps/scripts/smoke.ts",
  "apps/augnes_apps/scripts/mock-state-runtime.ts",
  "scripts/smoke-chatgpt-app-autonomy-runner-preflight-tool-v0-1.mjs",
  "lib/autonomy/autonomy-runner-preflight-copy-export.ts",
  "components/autonomy/autonomy-runner-preflight-copy-export-panel.tsx",
  "scripts/smoke-autonomy-runner-preflight-copy-export-v0-1.mjs",
];
const allowedChangedFiles = new Set([
  helperFile,
  componentFile,
  agentWorkplaneFile,
  webReadHelperFile,
  boundaryCardFile,
  contractPanelFile,
  smokeFile,
  contractDoc,
  indexDoc,
  packageJsonFile,
  ...priorSmokeAllowlistCompatibilityFiles,
]);
for (const file of phase9aAutonomyRunnerPreflightFiles) {
  allowedChangedFiles.add(file);
}

const forbiddenChangedFilePatterns = [
  /^app\/api\//,
  /^apps\/augnes_apps\//,
  /^migrations\//,
  /^db\//,
  /^lib\/db(\/|\.|$)/,
  /^plugins\/(?!augnes-operator\/skills\/augnes-autonomy-contract\/SKILL\.md$)/,
  /(^|\/)(provider|providers|openai|github|octokit)(\/|$)/i,
  /(^|\/)(proof|evidence)(\/|$)/i,
  /(^|\/)(scheduler|autonomy-runner|autonomy_runner)(\/|$)/i,
  /(^|\/)(daemon)(\/|$)/i,
  /(^|\/)(handoff-execution|handoff_execution)(\/|$)/i,
  /(^|\/)(route|api)\.(js|jsx|ts|tsx)$/,
];

const textByFile = loadTextByFile(requiredFiles);
const helperText = textByFile.get(helperFile);
const componentText = textByFile.get(componentFile);
const workplaneText = textByFile.get(agentWorkplaneFile);
const webReadHelperText = textByFile.get(webReadHelperFile);
const contractPanelText = textByFile.get(contractPanelFile);
const boundaryCardText = textByFile.get(boundaryCardFile);
const contractDocText = textByFile.get(contractDoc);
const indexText = textByFile.get(indexDoc);
const packageJsonText = textByFile.get(packageJsonFile);
const routeText = textByFile.get(routeFile);
const appToolSmokeText = textByFile.get(appToolSmokeFile);
const codexSkillText = textByFile.get(codexSkillFile);

assertPackageJsonScript();
assertHelper();
assertComponent();
assertWorkbenchIntegration();
assertWordingUpdates();
assertDocsAndIndex();
assertPriorPhaseBoundaries();
assertNoForbiddenCode();
assertCompanionSmokesPass();
const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "autonomy-contract-copy-export-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      helper_exports_checked: true,
      helper_boundary_checked: true,
      helper_packet_formats_checked: true,
      component_local_clipboard_checked: true,
      manual_copy_fallback_checked: true,
      boundary_flags_checked: true,
      workbench_integration_checked: true,
      docs_index_checked: true,
      phase8a_contract_smoke_passed: true,
      phase8b_route_smoke_passed: true,
      phase8d_app_tool_smoke_passed: true,
      phase8e_codex_skill_smoke_passed: true,
      no_app_api_route_files_changed_checked: true,
      no_apps_augnes_apps_files_changed_checked: true,
      no_db_migration_schema_changed_checked: true,
      no_provider_openai_github_client_actuation_checked: true,
      no_codex_execution_code_checked: true,
      no_proof_evidence_write_code_checked: true,
      no_scheduler_autonomy_runner_checked: true,
      no_daemon_background_work_checked: true,
      no_handoff_execution_checked: true,
      no_branch_pr_creation_product_code_checked: true,
      no_external_side_effect_code_checked: true,
      prior_smoke_allowlist_compatibility_files_allowed:
        priorSmokeAllowlistCompatibilityFiles,
      changed_files_boundary_checked: changedFilesBoundary.checked,
      changed_files_boundary_skipped: changedFilesBoundary.skipped,
      changed_files_boundary_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      changed_files_base_ref: changedFilesBoundary.base_ref,
      untracked_files_checked: changedFilesBoundary.untracked_checked,
      untracked_files_skipped: changedFilesBoundary.untracked_skipped,
      untracked_files_skip_reason: changedFilesBoundary.untracked_skip_reason,
      smoke_type:
        "static-autonomy-contract-local-copy-export-helper-component-doc-package-boundary-only",
    },
    null,
    2,
  ),
);
console.log("PASS smoke:autonomy-contract-copy-export-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:autonomy-contract-copy-export-v0-1",
    expectedCommand:
      "node scripts/smoke-autonomy-contract-copy-export-v0-1.mjs",
  });
}

function assertHelper() {
  assertContainsAll(helperText, [
    "AUTONOMY_COPY_EXPORT_PACKET_VERSION",
    "autonomy_copy_export.v0.1",
    "AUTONOMY_COPY_EXPORT_PACKET_KIND",
    "autonomy_contract_copy_export_preview",
    "AUTONOMY_COPY_EXPORT_FINGERPRINT_ALGORITHM",
    "fnv1a-32-canonical-json-v0.1",
    "buildAutonomyContractMarkdownCopyPacket",
    "buildAutonomyBudgetMarkdownCopyPacket",
    "buildAutonomyReviewEscalationChecklistMarkdown",
    "buildCombinedAutonomyReviewPacketMarkdown",
    "buildAutonomyCopyExportJsonPacket",
    "buildAutonomyCopyExportPreview",
    "buildAutonomyCopyExportInputSummary",
    "buildAutonomyCopyExportFingerprint",
    "normalizeAutonomyCopyText",
    "formatAutonomyAuthorityBoundaryForCopy",
    "formatAutonomySourceStatusForCopy",
    "formatAutonomyBudgetForCopy",
    "formatAutonomyDeltaMergePolicyForCopy",
    "formatAutonomyReviewEscalationForCopy",
    "formatAutonomyRunPreviewForCopy",
    "Local clipboard/manual copy preview only.",
    "Copying does not run autonomy.",
    "Copying does not schedule autonomy.",
    "Copying does not start a daemon.",
    "Copying does not start background work.",
    "Copying does not launch Codex.",
    "Copying does not execute Codex.",
    "Copying does not send a handoff.",
    "Copying does not create a branch or PR.",
    "Copying does not call GitHub.",
    "Copying does not call OpenAI/provider APIs.",
    "Copying does not write DB records.",
    "Copying does not write proof/evidence.",
    "Copying does not mutate memory/state/work/Perspective.",
    "Copying does not apply durable memory or project Perspective.",
    "Copying does not publish, merge, retry, replay, deploy, or externally post.",
    "Copying does not spend budget.",
    "Copying does not auto-apply deltas.",
    "Copying is not approval, proof, evidence, merge authority, launch authority, run authority, budget approval, or source-of-truth state.",
    "Copied text may become stale; re-copy before use if source/fallback status changes.",
    "source_refs",
    "guide_brief_refs",
    "handoff_capsule_refs",
    "codex_launch_card_refs",
    "current_working_perspective_refs",
    "delta_projection_refs",
    "allowed_actions",
    "forbidden_actions",
    "budget",
    "reporting_cadence",
    "stop_conditions",
    "delta_merge_policy",
    "review_escalation_policy",
    "output_policy",
    "staleness_policy",
    "validation_policy",
    "run_preview",
    "authority_boundary_summary",
    "auto_apply_allowed: false",
    "auto_apply_targets: []",
    'run_preview_status: "preview_only"',
    "budget_is_not_spend_permission: true",
    "allowed_actions_are_not_commands: true",
    "autonomy_run_preview_is_not_execution: true",
    "no_runner_scheduler_daemon_background_work_exists: true",
    "phase_9_runner_requires_separate_explicit_scope_and_approval: true",
  ], { label: helperFile });
}

function assertComponent() {
  assertContainsAll(componentText, [
    '"use client"',
    "export function AutonomyCopyExportPanel",
    "buildAutonomyCopyExportPreview",
    'title="Autonomy copy/export preview"',
    "Phase 8F local copy",
    "Copy Autonomy Contract markdown",
    "Copy Budget summary",
    "Copy Review Escalation checklist",
    "Copy combined autonomy review packet",
    "Copy JSON preview",
    'type="button"',
    "navigator.clipboard.writeText(text)",
    "Clipboard API is unavailable. Select the fallback packet text manually.",
    "Clipboard write failed. Select the fallback packet text manually.",
    "manual copy fallback",
    "readOnly",
    "packet_fingerprint",
    "packet_character_count",
    "source/fallback status",
    "local_clipboard_only",
    "external_posted",
    "autonomy_ran",
    "autonomy_scheduled",
    "daemon_started",
    "background_work_started",
    "codex_executed",
    "codex_launched",
    "github_called",
    "provider_called",
    "proof_evidence_written",
    "db_written",
    "state_mutated",
    "handoff_sent",
    "branch_pr_created",
    "copy_persisted",
    "budget_spent",
    "auto_apply_performed",
  ], { label: componentFile });

  assert(!/\bfetch\s*\(/i.test(componentText), `${componentFile} must not fetch`);
  assert(!/window\.open/i.test(componentText), `${componentFile} must not call window.open`);
  assert(!/\bdownload\s*=/i.test(componentText), `${componentFile} must not include download=`);
  assert(!/<form\b/i.test(componentText), `${componentFile} must not render form`);
  assert(!/\bonSubmit\s*=/i.test(componentText), `${componentFile} must not include onSubmit`);
  assert(!/\bformAction\s*=/i.test(componentText), `${componentFile} must not include formAction`);
  assert(!/\baction\s*=/i.test(componentText), `${componentFile} must not include action=`);
  assert(!/router\.push/i.test(componentText), `${componentFile} must not call router.push`);
  assert(!/readAutonomyContractForRoute/.test(componentText), `${componentFile} must not call routes`);
}

function assertWorkbenchIntegration() {
  assertContainsAll(workplaneText, [
    "AutonomyCopyExportPanel",
    'from "@/components/autonomy/autonomy-copy-export-panel"',
    "<AutonomyCopyExportPanel preview={autonomyPreview} />",
    "GuideBriefMiniPanel",
    "HandoffBuilderPreviewPanel",
    "HandoffCapsulePreviewPanel",
    "CodexLaunchCardPreviewPanel",
    "HandoffCopyExportPanel",
    "HandoffPreviewBoundaryCard",
    "AutonomyContractPreviewPanel",
    "AutonomyBudgetPreviewPanel",
    "AutonomyPolicyPreviewPanel",
    "AutonomyRunPreviewPanel",
    "AutonomyBoundaryCard",
    "LegacyCockpitCompatibilityPanel",
  ], { label: agentWorkplaneFile });
}

function assertWordingUpdates() {
  assertContainsAll(webReadHelperText, [
    "Phase 8F permits local clipboard/manual copy preview only; copied text may become stale and is not authority.",
    "Phase 8F adds local clipboard/manual-copy Autonomy Contract preview only.",
    "Phase 8F copy/export is not file export-to-disk, external posting, send, schedule, run, launch, budget spend, or auto-apply.",
    "Local copy/export preview is clipboard/manual-copy only and may become stale.",
  ], { label: webReadHelperFile });

  assertContainsAll(contractPanelText, [
    "Copy/export is available only through the bounded Phase 8F local copy panel.",
  ], { label: contractPanelFile });

  assertContainsAll(boundaryCardText, [
    "Phase 8F permits local clipboard/manual copy preview only.",
    "Autonomy Contract still does not run, schedule, launch Codex, start daemon/background work, post, merge, publish, mutate state, spend budget, or auto-apply deltas.",
    "budget approval",
    "auto-apply authority",
    "no file export-to-disk",
    "no budget spend",
    "no auto-apply",
  ], { label: boundaryCardFile });
}

function assertDocsAndIndex() {
  assertContainsAll(contractDocText, [
    "Phase 8F Local Copy/Export Preview",
    "`lib/autonomy/autonomy-contract-copy-export.ts`",
    "`components/autonomy/autonomy-copy-export-panel.tsx`",
    "`scripts/smoke-autonomy-contract-copy-export-v0-1.mjs`",
    "npm run smoke:autonomy-contract-copy-export-v0-1",
    "Primary placement is `/workbench` Agent Workplane",
    "`/` and `/perspective` remain deferred",
    "local clipboard copy and manual text export preview only",
    "File download/export-to-disk remains deferred unless separately scoped.",
    "no external post",
    "no send",
    "no schedule",
    "no run",
    "no daemon",
    "no background work",
    "no launch Codex",
    "no Codex execution",
    "no branch/PR creation",
    "no GitHub/OpenAI/provider calls",
    "no DB write",
    "no proof/evidence write",
    "no state/memory/work/Perspective mutation",
    "no durable Perspective apply",
    "no scheduler/autonomy runner",
    "no product-write",
    "no merge/publish/retry/replay/deploy",
    "no external side effects",
    "no budget spend",
    "no auto-apply",
    "Copied text may become stale",
    "not approval, proof, evidence, source-of-truth state, merge authority, run authority, launch authority, budget approval, auto-apply authority, or external-post authority",
    "Phase 8 Autonomy Contract preview stack is complete",
    "Phase 9 Autonomy Runner planning and implementation remain future work and require separate explicit scope and approval.",
  ], { label: contractDoc });

  assertContainsAll(indexText, [
    "Phase 8F Autonomy Contract local copy/export preview v0.1",
    "`lib/autonomy/autonomy-contract-copy-export.ts`",
    "`components/autonomy/autonomy-copy-export-panel.tsx`",
    "`scripts/smoke-autonomy-contract-copy-export-v0-1.mjs`",
    "smoke:autonomy-contract-copy-export-v0-1",
    "local clipboard/manual copy only",
    "no external post",
    "file download/export-to-disk",
    "no external side effect",
  ], { label: indexDoc });
}

function assertPriorPhaseBoundaries() {
  assertContainsAll(routeText, [
    "export async function GET",
    "runtime = \"nodejs\"",
    "dynamic = \"force-dynamic\"",
    "validateAutonomyContractReadRequest",
    "readAutonomyContractForRoute",
  ], { label: routeFile });
  assert(!/export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\b/.test(routeText), `${routeFile} must remain GET-only`);

  assertContainsAll(appToolSmokeText, [
    "read-only",
    "modelOnlyToolMeta",
    "no copy/export behavior",
    "no write",
  ], { label: appToolSmokeFile });

  assertContainsAll(codexSkillText, [
    "This skill is instruction-only workflow guidance.",
    "It does not run commands.",
    "It does not call Augnes runtime.",
    "It does not run autonomy.",
    "It does not schedule autonomy.",
    "It does not perform background work.",
    "It does not create branches or PRs by itself.",
  ], { label: codexSkillFile });
}

function assertNoForbiddenCode() {
  assert(
    !/from\s+["']@\/app\//.test(helperText),
    `${helperFile} must not import app routes`,
  );
  assert(
    !/from\s+["']@\/components\//.test(helperText),
    `${helperFile} must not import components`,
  );
  assert(!/apps\/augnes_apps/.test(helperText), `${helperFile} must not import apps/augnes_apps`);
  assert(!/lib\/db/.test(helperText), `${helperFile} must not import lib/db`);
  assert(!/migrations/.test(helperText), `${helperFile} must not import migrations`);
  assert(
    !/(openai|octokit|github)(?:-|\w)*client/i.test(helperText),
    `${helperFile} must not import provider clients`,
  );
  assert(!/\bfetch\s*\(/i.test(helperText), `${helperFile} must not fetch`);
  assert(!/child_process/.test(helperText), `${helperFile} must not use child_process`);
  assert(
    !/\b(writeFile|appendFile|mkdir|rm|rmdir|unlink)\b/.test(helperText),
    `${helperFile} must not perform fs writes`,
  );
  assert(
    !/\b(executeCodex|runCodex|launchCodex|codex\.execute)\b/.test(helperText),
    `${helperFile} must not call Codex`,
  );
  assert(
    !/\b(setTimeout|setInterval|cron|queueMicrotask)\b/.test(helperText),
    `${helperFile} must not schedule background work`,
  );
  assert(
    !/\b(commitStateUpdate|mutateMemory|applyProjectPerspective|writeMemory)\b/.test(
      helperText,
    ),
    `${helperFile} must not mutate memory/state/work/Perspective`,
  );
}

function assertCompanionSmokesPass() {
  for (const scriptName of [
    "smoke:autonomy-contract-v0-1",
    "smoke:autonomy-contract-route-v0-1",
    "smoke:chatgpt-app-autonomy-contract-tool-v0-1",
    "smoke:codex-autonomy-contract-v0-1",
  ]) {
    execFileSync("npm", ["run", scriptName], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
  }
}

function assertChangedFileBoundary() {
  const workingTree = collectGitDiffFiles(["diff", "--name-only", "HEAD"]);
  const baseRange = getBaseRangeChangedFiles();
  const untrackedFiles = collectUntrackedFiles();
  const files = uniqueSorted([
    ...workingTree.files,
    ...baseRange.files,
    ...untrackedFiles,
  ]);

  for (const file of files) {
    assert(
      allowedChangedFiles.has(file),
      `Unexpected changed file for Phase 8F Autonomy Contract copy/export preview: ${file}`,
    );
    assert(
      phase9aAutonomyRunnerPreflightFiles.includes(file) ||
        !forbiddenChangedFilePatterns.some((pattern) => pattern.test(file)),
      `Forbidden Phase 8F changed file: ${file}`,
    );
  }

  const checked =
    workingTree.checked || baseRange.checked || untrackedFiles.length > 0;

  return {
    checked,
    skipped: !checked,
    skip_reason: checked ? null : "changed-file boundary could not be checked",
    files,
    working_tree_files: workingTree.files,
    working_tree_checked: workingTree.checked,
    base_ref: baseRange.base_ref,
    base_range_files: baseRange.files,
    base_range_checked: baseRange.checked,
    untracked_checked: true,
    untracked_skipped: false,
    untracked_skip_reason: null,
    untracked_files: untrackedFiles,
  };
}
