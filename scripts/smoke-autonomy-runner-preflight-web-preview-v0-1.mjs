#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertPackageScript,
  collectGitDiffFiles,
  collectUntrackedFiles,
  getBaseRangeChangedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const contractDoc = "docs/AUTONOMY_RUNNER_PREFLIGHT_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const webReadHelperFile =
  "lib/autonomy/read-autonomy-runner-preflight-for-web.ts";
const panelFile =
  "components/autonomy/autonomy-runner-preflight-preview-panel.tsx";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const phase9aHelperFile = "lib/autonomy/autonomy-runner-preflight.ts";
const phase9bSourceFile =
  "lib/autonomy/autonomy-runner-preflight-source.ts";
const phase9aSmokeFile = "scripts/smoke-autonomy-runner-preflight-v0-1.mjs";
const phase9bSmokeFile =
  "scripts/smoke-autonomy-runner-preflight-route-v0-1.mjs";
const webSmokeFile =
  "scripts/smoke-autonomy-runner-preflight-web-preview-v0-1.mjs";

const requiredFiles = [
  contractDoc,
  indexDoc,
  packageJsonFile,
  webReadHelperFile,
  panelFile,
  agentWorkplaneFile,
  phase9aHelperFile,
  phase9bSourceFile,
  phase9aSmokeFile,
  phase9bSmokeFile,
  webSmokeFile,
];

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
  phase9aSmokeFile,
  phase9bSmokeFile,
  "apps/augnes_apps/src/server.ts",
  "apps/augnes_apps/src/lib/state-runtime-types.ts",
  "apps/augnes_apps/src/adapters/state-runtime-http.ts",
  "apps/augnes_apps/scripts/invariants.ts",
  "apps/augnes_apps/scripts/smoke.ts",
  "apps/augnes_apps/scripts/mock-state-runtime.ts",
  "scripts/smoke-chatgpt-app-autonomy-runner-preflight-tool-v0-1.mjs",
  "docs/CODEX_AUTONOMY_RUNNER_PREFLIGHT_CONSUMPTION_V0_1.md",
  "plugins/augnes-operator/skills/augnes-autonomy-runner-preflight/SKILL.md",
  "scripts/smoke-codex-autonomy-runner-preflight-v0-1.mjs",
];

const allowedChangedFiles = new Set([
  ...requiredFiles,
  ...priorSmokeAllowlistCompatibilityFiles,
]);

const phase9dChatgptAppFollowOnFiles = new Set([
  "apps/augnes_apps/src/server.ts",
  "apps/augnes_apps/src/lib/state-runtime-types.ts",
  "apps/augnes_apps/src/adapters/state-runtime-http.ts",
  "apps/augnes_apps/scripts/invariants.ts",
  "apps/augnes_apps/scripts/smoke.ts",
  "apps/augnes_apps/scripts/mock-state-runtime.ts",
  "scripts/smoke-chatgpt-app-autonomy-runner-preflight-tool-v0-1.mjs",
]);

const phase9eCodexAlignmentFollowOnFiles = new Set([
  "docs/CODEX_AUTONOMY_RUNNER_PREFLIGHT_CONSUMPTION_V0_1.md",
  "plugins/augnes-operator/skills/augnes-autonomy-runner-preflight/SKILL.md",
  "scripts/smoke-codex-autonomy-runner-preflight-v0-1.mjs",
]);

const phase9fCopyExportFollowOnFiles = new Set([
  "lib/autonomy/autonomy-runner-preflight-copy-export.ts",
  "components/autonomy/autonomy-runner-preflight-copy-export-panel.tsx",
  "components/autonomy/autonomy-runner-preflight-preview-panel.tsx",
  "scripts/smoke-autonomy-runner-preflight-copy-export-v0-1.mjs",
  "docs/AUTONOMY_RUNNER_SKELETON_PLANNING_V0_1.md",
  "docs/AUTONOMY_RUNNER_OPERATOR_APPROVAL_GATE_V0_1.md",
  "scripts/smoke-autonomy-runner-skeleton-planning-v0-1.mjs",
]);
for (const file of phase9fCopyExportFollowOnFiles) {
  allowedChangedFiles.add(file);
}

const forbiddenChangedFilePatterns = [
  /^app\/api\//,
  /^apps\/augnes_apps\//,
  /^migrations\//,
  /^db\//,
  /^lib\/db(\/|\.|$)/,
  /^plugins\//,
  /(^|\/)(mcp|tool|tools|hook|hooks)(\/|$)/i,
  /(^|\/)(provider|providers|openai|github|octokit)(\/|$)/i,
  /(^|\/)(proof|evidence)(\/|$)/i,
  /(^|\/)(scheduler|daemon|background-worker|background_worker)(\/|$)/i,
  /(^|\/)route\.(js|jsx|ts|tsx)$/,
];

const textByFile = loadTextByFile(requiredFiles);
const docText = textByFile.get(contractDoc);
const indexText = textByFile.get(indexDoc);
const packageJsonText = textByFile.get(packageJsonFile);
const helperText = textByFile.get(webReadHelperFile);
const panelText = textByFile.get(panelFile);
const workplaneText = textByFile.get(agentWorkplaneFile);
const phase9aHelperText = textByFile.get(phase9aHelperFile);
const phase9bSourceText = textByFile.get(phase9bSourceFile);

assertPackageJsonScript();
assertDocsAndIndexPointers();
assertReadHelperContract();
assertPanelContract();
assertWorkbenchIntegration();
assertNoForbiddenUiControls();
assertNoForbiddenRuntimeCode();
const behavior = assertBehavioralImportsAndPreviewShape();
const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "autonomy-runner-preflight-web-preview-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      docs_phase_9c_boundary_checked: true,
      index_pointer_checked: true,
      web_read_helper_checked: true,
      preview_panel_component_checked: true,
      workplane_integration_checked: true,
      component_import_behavior_checked: behavior.component_imported,
      helper_preview_shape_checked: behavior.helper_preview_shaped,
      displays_readiness_checked: true,
      displays_blockers_warnings_checked: true,
      displays_dry_run_status_checked: true,
      displays_planned_steps_checked: true,
      displays_would_execute_false_checked: true,
      displays_no_run_boundary_checked: true,
      displays_required_preconditions_checks_checked: true,
      displays_source_refs_or_route_status_checked: true,
      displays_public_safety_checked: true,
      no_forbidden_action_controls_checked: true,
      no_mutation_handlers_checked: true,
      no_api_route_files_changed_checked: true,
      no_mcp_app_tool_files_changed_checked: true,
      no_db_migration_files_changed_checked: true,
      no_provider_openai_github_codex_calls_checked: true,
      no_child_process_in_product_code_checked: true,
      no_fs_write_apis_checked: true,
      no_interval_timer_cron_worker_daemon_background_loop_checked: true,
      no_proof_evidence_write_checked: true,
      no_memory_perspective_mutation_checked: true,
      no_handoff_send_checked: true,
      no_branch_pr_creation_checked: true,
      no_auto_apply_budget_spend_external_post_checked: true,
      no_file_download_export_to_disk_checked: true,
      phase9a_smoke_reference_checked: true,
      phase9b_smoke_reference_checked: true,
      changed_files_boundary_checked: changedFilesBoundary.checked,
      changed_files_boundary_skipped: changedFilesBoundary.skipped,
      changed_files_boundary_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      changed_files_base_ref: changedFilesBoundary.base_ref,
      untracked_files_checked: changedFilesBoundary.untracked_checked,
      untracked_files_skipped: changedFilesBoundary.untracked_skipped,
      untracked_files_skip_reason: changedFilesBoundary.untracked_skip_reason,
      prior_smoke_allowlist_compatibility_files_allowed:
        priorSmokeAllowlistCompatibilityFiles,
      smoke_type:
        "static-and-import-autonomy-runner-preflight-web-preview-boundary",
    },
    null,
    2,
  ),
);
console.log("PASS smoke:autonomy-runner-preflight-web-preview-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:autonomy-runner-preflight-web-preview-v0-1",
    expectedCommand:
      "node scripts/smoke-autonomy-runner-preflight-web-preview-v0-1.mjs",
  });
}

function assertDocsAndIndexPointers() {
  assertContainsAll(docText, [
    "Phase 9C Read-Only Web Preview Panel",
    "Autonomy Runner Preflight Preview",
    "Dry-Run Plan Preview",
    "Primary placement is `/workbench` Agent Workplane.",
    webReadHelperFile,
    panelFile,
    "does not call the route over HTTP",
    "does not invent readiness, blocker, warning, budget, action-scope, delta-merge, escalation, stop-condition, staleness, or authority policy",
    "displays readiness, readiness summary, blockers, warnings",
    "Every planned step visibly preserves `would_execute: false`",
    "allowed_by_contract",
    "blocked_by",
    "would_require_review",
    "expected_output",
    "read-only display only",
    "Start runner button",
    "Run now button",
    "Schedule button",
    "Launch Codex button",
    "Call GitHub button",
    "Send handoff button",
    "Apply delta button",
    "Approve auto-apply button",
    "Persist run record button",
    "no API route",
    "no App/MCP tool",
    "no file download/export-to-disk",
    "smoke:autonomy-runner-preflight-web-preview-v0-1",
  ], { label: contractDoc });

  assertContainsAll(indexText, [
    "Phase 9C Agent Workplane Autonomy Runner Preflight read-only Web preview panel v0.1",
    webReadHelperFile,
    panelFile,
    webSmokeFile,
    "smoke:autonomy-runner-preflight-web-preview-v0-1",
    "`/workbench` panel is",
    "read-only display only",
    "consumes Phase 9A/9B preflight/dry-run preview data",
    "without inventing readiness or blocker policy",
    "dry_run_plan.status: dry_run_only",
    "would_execute: false",
    "all-false no-run authority boundary",
    "no API route",
    "file download/export-to-disk",
    "external side effect",
  ], { label: indexDoc });
}

function assertReadHelperContract() {
  assertContainsAll(helperText, [
    "export function readAutonomyRunnerPreflightPreviewForWeb",
    "export function buildPublicSafeAutonomyRunnerPreflightPreviewFallback",
    "readAutonomyRunnerPreflightForRoute({",
    "AUTONOMY_RUNNER_PREFLIGHT_ROUTE_SCOPE",
    "phase_9b_route_source",
    "public_safe_fixture_fallback",
    "dry_run_only",
    "would_execute: false",
    "would_spend_budget: false",
    "No runner starts.",
    "No scheduler starts.",
    "No daemon starts.",
    "No background work starts.",
    "No Codex execution.",
    "No GitHub/provider/OpenAI call.",
    "No DB write.",
    "No proof/evidence write.",
    "No memory mutation.",
    "No durable Perspective apply.",
    "No handoff send.",
    "No branch/PR creation.",
    "No auto-apply.",
    "No external side effect.",
    "contains_private_conversation: false",
    "contains_hidden_reasoning: false",
    "contains_local_private_paths: false",
    "contains_secrets_or_tokens: false",
    "contains_raw_provider_output: false",
    "contains_raw_retrieval_output: false",
    "contains_real_account_artifacts: false",
  ], { label: webReadHelperFile });

  assertContainsAll(phase9aHelperText, [
    "buildAutonomyRunnerPreflight",
    "buildAutonomyDryRunPlan",
    "deriveAutonomyRunReadiness",
    "would_execute: false",
    'status: "dry_run_only"',
  ], { label: phase9aHelperFile });

  assertContainsAll(phase9bSourceText, [
    "readAutonomyRunnerPreflightForRoute",
    "buildAutonomyRunnerPreflight",
    "does not invent readiness or blocker policy",
  ], { label: phase9bSourceFile });
}

function assertPanelContract() {
  assertContainsAll(panelText, [
    "export function AutonomyRunnerPreflightPreviewPanel",
    "Autonomy Runner Preflight Preview",
    "Dry-Run Plan Preview",
    "readiness",
    "readiness_summary",
    "blockers and warnings",
    "required user judgment",
    "required operator review",
    "assessment summaries",
    "budget",
    "action scope",
    "delta merge",
    "review escalation",
    "stop condition",
    "staleness",
    "authority",
    "dry_run_id",
    "status",
    "planned steps",
    "planned read source",
    "required precondition",
    "required check",
    "blocked step",
    "budget projection",
    "source and route status",
    "public safety",
    "no-run authority boundary",
    "allowed_by_contract",
    "blocked_by",
    "would_require_review",
    "would_execute",
    "expected_output",
    "No runner starts",
    "No scheduler starts",
    "No daemon starts",
    "No background work starts",
    "No Codex execution",
    "No GitHub/provider/OpenAI call",
    "No DB write",
    "No proof/evidence write",
    "No memory mutation",
    "No durable Perspective apply",
    "No handoff send",
    "No branch/PR creation",
    "No auto-apply",
    "No external side effect",
  ], { label: panelFile });
}

function assertWorkbenchIntegration() {
  assertContainsAll(workplaneText, [
    "AutonomyRunnerPreflightPreviewPanel",
    "readAutonomyRunnerPreflightPreviewForWeb",
    "autonomyRunnerPreflightPreview",
    "Promise.resolve(readAutonomyRunnerPreflightPreviewForWeb())",
    "<AutonomyRunnerPreflightPreviewPanel",
    "preview={autonomyRunnerPreflightPreview}",
    "AutonomyRunPreviewPanel",
    "AutonomyBoundaryCard",
  ], { label: agentWorkplaneFile });
}

function assertNoForbiddenUiControls() {
  for (const [file, text] of [
    [panelFile, panelText],
    [agentWorkplaneFile, workplaneText],
  ]) {
    assert(!/<form\b/i.test(text), `${file} must not render form elements`);
    assert(!/\bonSubmit\s*=/i.test(text), `${file} must not include onSubmit`);
    assert(!/\bformAction\s*=/i.test(text), `${file} must not include formAction`);
    assert(!/\baction\s*=/i.test(text), `${file} must not include action=`);
    assert(!/\bdownload\s*=/i.test(text), `${file} must not include download=`);
    assert(!/\bnavigator\.clipboard/i.test(text), `${file} must not use clipboard`);
    assert(!/\bfetch\s*\(/i.test(text), `${file} must not fetch`);
    assert(!/\brouter\.push/i.test(text), `${file} must not navigate`);
    assert(!/\bwindow\.open/i.test(text), `${file} must not open windows`);
  }

  assert(!/<button\b/i.test(panelText), `${panelFile} must not render buttons`);
  assert(!/\bonClick\s*=/i.test(panelText), `${panelFile} must not include onClick`);

  for (const forbiddenControl of [
    "Start runner",
    "Run now",
    "Schedule run",
    "Launch Codex",
    "Call GitHub",
    "Send handoff",
    "Apply delta",
    "Approve auto-apply",
    "Persist run record",
  ]) {
    assert(
      !new RegExp(`<(?:button|a)[^>]*>[\\\\s\\\\S]*${escapeRegExp(forbiddenControl)}[\\\\s\\\\S]*<\\\\/(?:button|a)>`, "i").test(panelText),
      `${panelFile} must not expose ${forbiddenControl} as a control`,
    );
  }
}

function assertNoForbiddenRuntimeCode() {
  for (const [file, text] of [
    [webReadHelperFile, helperText],
    [panelFile, panelText],
    [agentWorkplaneFile, workplaneText],
  ]) {
    assertNoForbiddenCodePatterns(file, text);
  }

  for (const [file, text] of [
    [webReadHelperFile, helperText],
    [panelFile, panelText],
  ]) {
    assertNoForbiddenImports(file, text);
  }
}

function assertNoForbiddenCodePatterns(file, text) {
  const productText =
    file === webSmokeFile ? stripStringLiterals(text) : stripStringLiterals(text);
  const patterns = [
    /\bchild_process\b/,
    /\bspawn\s*\(/,
    /\bexec\s*\(/,
    /\bexecFile(?:Sync)?\s*\(/,
    /\bwriteFile(?:Sync)?\s*\(/,
    /\bappendFile(?:Sync)?\s*\(/,
    /\bmkdir(?:Sync)?\s*\(/,
    /\brm(?:Sync)?\s*\(/,
    /\bunlink(?:Sync)?\s*\(/,
    /\bsetInterval\s*\(/,
    /\bsetTimeout\s*\(/,
    /\bnew\s+Worker\s*\(/,
    /\bcron\b/i,
    /\bnew\s+OpenAI\b/,
    /\bOctokit\b/,
    /\bexecuteCodex\s*\(/i,
    /\brunCodex\s*\(/i,
    /\bcallGithub\s*\(/i,
    /\bcreatePullRequest\s*\(/i,
    /\brecordProof\s*\(/i,
    /\bcreateEvidenceRecord\s*\(/i,
    /\bwriteMemory\s*\(/i,
    /\bmutateMemory\s*\(/i,
    /\bapplyProjectPerspective\s*\(/i,
    /\bsendHandoff\s*\(/i,
    /\bstartDaemon\s*\(/i,
    /\bscheduleBackgroundWork\s*\(/i,
    /\bautoApplyDelta\s*\(/i,
    /\bspendBudget\s*\(/i,
    /\bpostExternal/i,
  ];

  for (const pattern of patterns) {
    assert(!pattern.test(productText), `${file} must not match ${pattern}`);
  }
}

function assertNoForbiddenImports(file, text) {
  const importLines = text
    .split("\n")
    .filter((line) => line.trim().startsWith("import "));

  for (const line of importLines) {
    for (const forbiddenImport of [
      "@/app/",
      "@/apps/augnes_apps",
      "@/lib/db",
      "migrations",
      "openai",
      "octokit",
      "github",
      "provider",
      "providers",
      "proof",
      "evidence",
      "scheduler",
      "daemon",
      "background-worker",
      "background_worker",
      "node:fs",
      "node:child_process",
    ]) {
      assert(
        !line.includes(forbiddenImport),
        `${file} must not import ${forbiddenImport}`,
      );
    }
  }
}

function assertBehavioralImportsAndPreviewShape() {
  const behaviorScript = String.raw`
    import { AutonomyRunnerPreflightPreviewPanel } from "./components/autonomy/autonomy-runner-preflight-preview-panel.tsx";
    import { readAutonomyRunnerPreflightPreviewForWeb } from "./lib/autonomy/read-autonomy-runner-preflight-for-web.ts";

    const preview = readAutonomyRunnerPreflightPreviewForWeb();
    console.log(JSON.stringify({
      componentType: typeof AutonomyRunnerPreflightPreviewPanel,
      readiness: preview.readiness,
      dryRunStatus: preview.dry_run_plan.status,
      stepCount: preview.dry_run_plan.planned_steps.length,
      everyStepWouldExecuteFalse: preview.dry_run_plan.planned_steps.every((step) => step.would_execute === false),
      authorityAllFalse: Object.entries(preview.authority_boundary)
        .filter(([key]) => key !== "notes")
        .every(([, value]) => value === false),
      publicSafe: preview.public_safety.contains_private_conversation === false &&
        preview.public_safety.contains_hidden_reasoning === false &&
        preview.public_safety.contains_local_private_paths === false &&
        preview.public_safety.contains_secrets_or_tokens === false,
      source: preview.source_status.source,
    }));
  `;

  const output = execFileSync(
    "apps/augnes_apps/node_modules/.bin/tsx",
    ["--eval", behaviorScript],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env, TSX_TSCONFIG_PATH: "tsconfig.json" },
    },
  );
  const result = JSON.parse(output);

  assert.equal(result.componentType, "function");
  assert.equal(result.dryRunStatus, "dry_run_only");
  assert(result.stepCount > 0, "preview must include planned steps");
  assert.equal(result.everyStepWouldExecuteFalse, true);
  assert.equal(result.authorityAllFalse, true);
  assert.equal(result.publicSafe, true);
  assert(
    ["phase_9b_route_source", "public_safe_fixture_fallback"].includes(
      result.source,
    ),
  );

  return {
    component_imported: true,
    helper_preview_shaped: true,
  };
}

function assertChangedFileBoundary() {
  const scopedBoundary = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "Phase 9C Autonomy Runner Preflight Web preview",
  });
  const workingTree = collectGitDiffFiles(["diff", "--name-only", "HEAD"]);
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
    assert(allowedChangedFiles.has(file), `Unexpected Phase 9C changed file: ${file}`);
    for (const pattern of forbiddenChangedFilePatterns) {
      if (phase9dChatgptAppFollowOnFiles.has(file)) continue;
      if (phase9eCodexAlignmentFollowOnFiles.has(file)) continue;
      if (phase9fCopyExportFollowOnFiles.has(file)) continue;
      assert(!pattern.test(file), `Forbidden Phase 9C changed file: ${file}`);
    }
  }

  return {
    ...scopedBoundary,
    files,
    untracked_checked: true,
    untracked_skipped: false,
    untracked_skip_reason: null,
  };
}

function stripStringLiterals(text) {
  return text.replace(/(["'`])(?:\\.|(?!\1)[\s\S])*\1/g, "");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
