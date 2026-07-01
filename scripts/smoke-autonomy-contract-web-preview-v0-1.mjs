#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertPackageScript,
  loadTextByFile,
} from "./smoke-boundary-common.mjs";

const contractDoc = "docs/AUTONOMY_CONTRACT_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const webReadHelperFile = "lib/autonomy/read-autonomy-contract-for-web.ts";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const contractPanelFile =
  "components/autonomy/autonomy-contract-preview-panel.tsx";
const budgetPanelFile =
  "components/autonomy/autonomy-budget-preview-panel.tsx";
const policyPanelFile =
  "components/autonomy/autonomy-policy-preview-panel.tsx";
const runPanelFile = "components/autonomy/autonomy-run-preview-panel.tsx";
const boundaryCardFile = "components/autonomy/autonomy-boundary-card.tsx";
const sharedPanelFile = "components/autonomy/autonomy-preview-shared.tsx";
const copyExportPanelFile =
  "components/autonomy/autonomy-copy-export-panel.tsx";
const copyExportHelperFile =
  "lib/autonomy/autonomy-contract-copy-export.ts";
const copyExportSmokeFile =
  "scripts/smoke-autonomy-contract-copy-export-v0-1.mjs";
const webSmokeFile = "scripts/smoke-autonomy-contract-web-preview-v0-1.mjs";

const requiredFiles = [
  contractDoc,
  indexDoc,
  packageJsonFile,
  webReadHelperFile,
  agentWorkplaneFile,
  contractPanelFile,
  budgetPanelFile,
  policyPanelFile,
  runPanelFile,
  boundaryCardFile,
  sharedPanelFile,
  copyExportPanelFile,
  webSmokeFile,
];

const priorSmokeAllowlistCompatibilityFiles = [
  "scripts/smoke-autonomy-contract-v0-1.mjs",
  "scripts/smoke-autonomy-contract-route-v0-1.mjs",
  "scripts/smoke-augnes-delta-contract-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-route-v0-1.mjs",
  "scripts/smoke-current-working-perspective-v0-1.mjs",
  "scripts/smoke-current-working-perspective-route-v0-1.mjs",
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

const phase8dAutonomyContractAppToolFiles = [
  "apps/augnes_apps/src/server.ts",
  "apps/augnes_apps/src/lib/state-runtime-types.ts",
  "apps/augnes_apps/src/adapters/state-runtime-http.ts",
  "apps/augnes_apps/scripts/invariants.ts",
  "apps/augnes_apps/scripts/smoke.ts",
  "apps/augnes_apps/scripts/mock-state-runtime.ts",
  "docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md",
  "scripts/smoke-chatgpt-app-autonomy-contract-tool-v0-1.mjs",
];

const phase8eAutonomyContractCodexSkillFiles = [
  "docs/CODEX_AUTONOMY_CONTRACT_CONSUMPTION_V0_1.md",
  "plugins/augnes-operator/skills/augnes-autonomy-contract/SKILL.md",
  "scripts/smoke-codex-autonomy-contract-v0-1.mjs",
  "scripts/smoke-augnes-operator-plugin-v2.mjs",
  "docs/CODEX_AUGNES_OPERATOR_PLUGIN_V0_2.md",
  "docs/AUTONOMY_CONTRACT_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
];

const phase8fAutonomyContractCopyExportFiles = [
  copyExportHelperFile,
  copyExportPanelFile,
  copyExportSmokeFile,
  webReadHelperFile,
  agentWorkplaneFile,
  boundaryCardFile,
  contractPanelFile,
  contractDoc,
  indexDoc,
  packageJsonFile,
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
  "docs/CODEX_AUTONOMY_RUNNER_PREFLIGHT_CONSUMPTION_V0_1.md",
  "plugins/augnes-operator/skills/augnes-autonomy-runner-preflight/SKILL.md",
  "scripts/smoke-codex-autonomy-runner-preflight-v0-1.mjs",
];
const allowedChangedFiles = new Set([
  contractDoc,
  indexDoc,
  packageJsonFile,
  webReadHelperFile,
  agentWorkplaneFile,
  contractPanelFile,
  budgetPanelFile,
  policyPanelFile,
  runPanelFile,
  boundaryCardFile,
  sharedPanelFile,
  webSmokeFile,
  ...priorSmokeAllowlistCompatibilityFiles,
  ...phase8dAutonomyContractAppToolFiles,
  ...phase8eAutonomyContractCodexSkillFiles,
  ...phase8fAutonomyContractCopyExportFiles,
]);
for (const file of phase9aAutonomyRunnerPreflightFiles) {
  allowedChangedFiles.add(file);
}

const forbiddenChangedFilePatterns = [
  /^app\/api\//,
  /^apps\/augnes_apps\/(?!(?:src\/server\.ts|src\/lib\/state-runtime-types\.ts|src\/adapters\/state-runtime-http\.ts|scripts\/invariants\.ts|scripts\/smoke\.ts|scripts\/mock-state-runtime\.ts)$)/,
  /^migrations\//,
  /^db\//,
  /^lib\/db(\/|\.|$)/,
  /^plugins\/(?!augnes-operator\/skills\/augnes-autonomy-contract\/SKILL\.md$)/,
  /(^|\/)(provider|providers|openai|github|octokit)(\/|$)/i,
  /(^|\/)(proof|evidence)(\/|$)/i,
  /(^|\/)(scheduler|autonomy-runner|autonomy_runner)(\/|$)/i,
  /(^|\/)(handoff-execution|handoff_execution)(\/|$)/i,
];

const textByFile = loadTextByFile(requiredFiles);
const docText = textByFile.get(contractDoc);
const indexText = textByFile.get(indexDoc);
const packageJsonText = textByFile.get(packageJsonFile);
const helperText = textByFile.get(webReadHelperFile);
const workplaneText = textByFile.get(agentWorkplaneFile);
const componentTexts = [
  contractPanelFile,
  budgetPanelFile,
  policyPanelFile,
  runPanelFile,
  boundaryCardFile,
  sharedPanelFile,
].map((file) => [file, textByFile.get(file)]);
const copyExportPanelText = textByFile.get(copyExportPanelFile);
const combinedComponentText = componentTexts
  .concat([[copyExportPanelFile, copyExportPanelText]])
  .map(([file, text]) => `${file}\n${text}`)
  .join("\n");

assertPackageJsonScript();
assertDocsAndIndexPointers();
assertReadHelperContract();
assertComponentExportsAndContent();
assertWorkbenchIntegration();
assertNoForbiddenUiControls();
assertNoForbiddenReadHelperCode();
assertCompanionSmokesPass();
const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "autonomy-contract-web-preview-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      docs_phase_8c_boundary_checked: true,
      index_pointer_checked: true,
      read_helper_exports_checked: true,
      public_safe_fallback_checked: true,
      workbench_integration_checked: true,
      existing_workbench_panels_preserved_checked: true,
      autonomy_panel_exports_checked: true,
      autonomy_panel_content_checked: true,
      no_buttons_or_forms_checked: true,
      no_client_fetch_or_external_action_controls_checked: true,
      read_helper_forbidden_imports_checked: true,
      no_api_route_files_changed_checked: true,
      no_mcp_app_db_provider_codex_proof_scheduler_drift_checked: true,
      phase_8a_contract_smoke_passed: true,
      phase_8b_route_smoke_passed: true,
      prior_smoke_allowlist_compatibility_files_allowed:
        priorSmokeAllowlistCompatibilityFiles,
      phase8f_autonomy_contract_copy_export_files_allowed:
        phase8fAutonomyContractCopyExportFiles,
      changed_files_boundary_checked: changedFilesBoundary.checked,
      changed_files_boundary_skipped: changedFilesBoundary.skipped,
      changed_files_boundary_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      changed_files_base_ref: changedFilesBoundary.base_ref,
      smoke_type:
        "static-autonomy-contract-read-only-web-preview-boundary",
    },
    null,
    2,
  ),
);
console.log("PASS smoke:autonomy-contract-web-preview-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:autonomy-contract-web-preview-v0-1",
    expectedCommand:
      "node scripts/smoke-autonomy-contract-web-preview-v0-1.mjs",
  });
}

function assertDocsAndIndexPointers() {
  assertContainsAll(docText, [
    "Phase 8C Read-Only Web Preview UI",
    "Primary placement is `/workbench` Agent Workplane.",
    "`/` and `/perspective` remain deferred",
    "Public Web display defaults to the public-safe fixture fallback",
    "Source/fallback status must remain visible.",
    "Route-composed budget/operator fields may remain synthetic/operator-supplied preview defaults and must be disclosed.",
    "Source composition for the Web display is owned by `lib/autonomy/read-autonomy-contract-for-web.ts`.",
    "does not fetch the Phase 8B route from the client",
    "does not call local routes through HTTP",
    "does not import app route handlers",
    "does not bypass the local marker guard",
    "Phase 8C Web preview adds no action buttons",
    "no forms",
    "no start",
    "no run",
    "no schedule",
    "no launch Codex",
    "no send handoff",
    "no apply memory",
    "no apply project Perspective",
    "no approve auto-apply",
    "no persist contract",
    "no copy/export",
    "no API write route",
    "no App/MCP tool",
    "no DB schema/migration/write",
    "no provider/OpenAI call",
    "no GitHub actuation",
    "no proof/evidence writes",
    "no memory mutation",
    "no durable Perspective apply",
    "no scheduler/autonomy runner",
    "no daemon",
    "no background work",
    "no product-write",
    "no merge/publish/retry/replay/deploy",
    "no external side effects",
    "Phase 8D ChatGPT App/MCP Read-Only Preview Tool",
    "augnes_get_autonomy_contract_preview",
    "Phase 8E Codex Skill Alignment",
    "plugins/augnes-operator/skills/augnes-autonomy-contract/SKILL.md",
    "Phase 8F Local Copy/Export Preview",
    "local clipboard copy and manual text export preview only",
    "Phase 9 runner remains deferred and requires separate explicit scope and approval.",
  ], { label: contractDoc });

  assertContainsAll(indexText, [
    "Phase 8C Autonomy Contract Web preview UI v0.1",
    "`components/autonomy/*`",
    "`lib/autonomy/read-autonomy-contract-for-web.ts`",
    "`scripts/smoke-autonomy-contract-web-preview-v0-1.mjs`",
    "smoke:autonomy-contract-web-preview-v0-1",
    "`/workbench` Agent Workplane preview panels",
    "public-safe fixture fallback data",
    "source/fallback status visible",
    "no action buttons",
    "forms",
    "copy/export behavior",
    "runner/scheduler/daemon/background work/write/execution/external authority",
  ], { label: indexDoc });
}

function assertReadHelperContract() {
  assertContainsAll(helperText, [
    "export const AUTONOMY_PREVIEW_PUBLIC_SAFE_FALLBACK_SOURCE",
    "export const AUTONOMY_PREVIEW_PUBLIC_SAFE_FALLBACK_REFS",
    "export function readAutonomyContractPreviewForWeb",
    "export function buildPublicSafeAutonomyContractPreviewFallback",
    "validateAutonomyContractReadRequest(context.request)",
    "readAutonomyContractForRoute({",
    "public_safe_fixture_fallback",
    "local_readonly_route_context",
    "validation_failed_fallback",
    "No explicit local read-only request context was supplied to the Autonomy Contract Web preview.",
    "not live autonomy state",
    "not active run state",
    "not budget approval or spend permission",
    "not runner, scheduler, daemon, proof, evidence, or background work",
    "auto_apply_allowed: false",
    "auto_apply_targets: []",
    'status: "preview_only"',
    "No runner exists.",
    "No scheduler exists.",
    "No daemon exists.",
    "No background job exists.",
    "Phase 9 requires separate explicit scope and approval.",
    "contains_private_conversation: false",
    "contains_hidden_reasoning: false",
    "contains_local_private_paths: false",
    "contains_secrets_or_tokens: false",
    "contains_raw_provider_output: false",
    "contains_raw_retrieval_output: false",
    "contains_real_account_artifacts: false",
  ], { label: webReadHelperFile });
}

function assertComponentExportsAndContent() {
  assertContainsAll(textByFile.get(contractPanelFile), [
    "export function AutonomyContractPreviewPanel",
    "source/fallback status",
    "allowed actions",
    "forbidden actions",
    "warnings and gaps",
    "Preview only.",
    "Future runner not implemented.",
    "No run, no schedule, no Codex launch, no handoff send, no write, and no external side effect.",
    "Copy/export is available only through the bounded Phase 8F local copy panel.",
  ], { label: contractPanelFile });

  assertContainsAll(textByFile.get(budgetPanelFile), [
    "export function AutonomyBudgetPreviewPanel",
    "budget_id",
    "time_limit_minutes",
    "max_iterations",
    "max_tool_calls",
    "max_codex_tasks",
    "max_prs",
    "max_file_changes",
    "allowed_file_globs",
    "forbidden_file_globs",
    "retry_limit",
    "failure_threshold",
    "reporting_interval",
    "requires_budget_refresh_after",
    "Budget is boundary only.",
    "Budget is not spend permission.",
    "Missing budget blocks future autonomy.",
    "Phase 8C does not charge, call providers, execute tools, or run background work.",
  ], { label: budgetPanelFile });

  assertContainsAll(textByFile.get(policyPanelFile), [
    "export function AutonomyPolicyPreviewPanel",
    "delta merge policy",
    "review escalation policy",
    "default_delta_status",
    "auto_apply_allowed",
    "auto_apply_targets",
    "review_required_targets",
    "blocked_targets",
    "durable_memory_policy",
    "project_perspective_policy",
    "external_side_effect_policy",
    "codex_launch_policy",
    "proof_evidence_policy",
    "stale_context_policy",
    "user_judgment_policy",
    "requires_user_judgment_when",
    "requires_operator_review_when",
    "requires_fresh_snapshot_when",
    "requires_new_budget_when",
    "blocks_run_when",
    "review_queue_target",
    "auto_apply_allowed must remain false in Phase 8.",
    "Durable memory and project Perspective require review.",
  ], { label: policyPanelFile });

  assertContainsAll(textByFile.get(runPanelFile), [
    "export function AutonomyRunPreviewPanel",
    "run preview",
    "stop conditions",
    "reporting cadence",
    "output policy",
    "planned_steps",
    "allowed_read_sources",
    "proposed_delta_outputs",
    "proposed_reports",
    "blocked_steps",
    "required_preconditions",
    "not_implemented_notes",
    "AutonomyRunPreview is not execution.",
    "No runner exists.",
    "No scheduler exists.",
    "No daemon exists.",
    "No background job exists.",
    "Phase 9 requires separate explicit scope and approval.",
  ], { label: runPanelFile });

  assertContainsAll(textByFile.get(boundaryCardFile), [
    "export function AutonomyBoundaryCard",
    "no runner",
    "no scheduler",
    "no daemon",
    "no background work",
    "no Codex execution",
    "no Codex launch",
    "no GitHub actuation",
    "no provider/OpenAI calls",
    "no DB write",
    "no proof/evidence writes",
    "no memory mutation",
    "no durable Perspective apply",
    "no handoff send",
    "no branch/PR creation",
    "no merge/publish/retry/replay/deploy",
    "no external side effects",
    "Every authority boolean is expected to deny execution, write, schedule, and external authority.",
    "Phase 8F permits local clipboard/manual copy preview only.",
  ], { label: boundaryCardFile });

  assertContainsAll(copyExportPanelText, [
    "export function AutonomyCopyExportPanel",
    "Phase 8F local copy",
    "Autonomy copy/export preview",
    "Copy Autonomy Contract markdown",
    "Copy Budget summary",
    "Copy Review Escalation checklist",
    "Copy combined autonomy review packet",
    'type="button"',
    "navigator.clipboard.writeText(text)",
    "readOnly",
    "manual copy fallback",
    "local_clipboard_only",
    "budget_spent",
    "auto_apply_performed",
  ], { label: copyExportPanelFile });

  assertContainsAll(combinedComponentText, [
    "budget",
    "allowed actions",
    "forbidden actions",
    "delta merge policy",
    "review escalation",
    "stop conditions",
    "reporting cadence",
    "output policy",
    "run preview",
    "authority boundary",
    "source/fallback status",
    "preview_only",
    "false",
  ], { label: "components/autonomy/*" });
}

function assertWorkbenchIntegration() {
  assertContainsAll(workplaneText, [
    "readAutonomyContractPreviewForWeb",
    "AutonomyContractPreviewPanel",
    "AutonomyBudgetPreviewPanel",
    "AutonomyPolicyPreviewPanel",
    "AutonomyRunPreviewPanel",
    "AutonomyBoundaryCard",
    "AutonomyCopyExportPanel",
    "autonomyPreview,",
    "] = await Promise.all",
    "Promise.resolve(readAutonomyContractPreviewForWeb())",
    "<AutonomyContractPreviewPanel preview={autonomyPreview} />",
    "<AutonomyBudgetPreviewPanel preview={autonomyPreview} />",
    "<AutonomyPolicyPreviewPanel preview={autonomyPreview} />",
    "<AutonomyRunPreviewPanel preview={autonomyPreview} />",
    "<AutonomyBoundaryCard preview={autonomyPreview} />",
    "<AutonomyCopyExportPanel preview={autonomyPreview} />",
    "GuideBriefMiniPanel",
    "WorkQueuePanel",
    "CurrentPerspectiveWorkplanePanel",
    "DeltaProjectionWorkplanePanel",
    "ReviewQueueWorkplanePanel",
    "EvidenceHandoffWorkplanePanel",
    "WorkplaneInspector",
    "ProjectionCandidatesPanel",
    "DeltaBatchPanel",
    "HandoffBuilderPreviewPanel",
    "HandoffCapsulePreviewPanel",
    "CodexLaunchCardPreviewPanel",
    "HandoffCopyExportPanel",
    "HandoffPreviewBoundaryCard",
    "RunPostmortemSkeletonPanel",
    "TraceDiagnosticsPanel",
    "LegacyCockpitCompatibilityPanel",
  ], { label: agentWorkplaneFile });
}

function assertNoForbiddenUiControls() {
  for (const [file, text] of componentTexts) {
    assert(!/<button\b/i.test(text), `${file} must not render button elements`);
    assert(!/<form\b/i.test(text), `${file} must not render form elements`);
    assert(!/\bonClick\s*=/i.test(text), `${file} must not include onClick`);
    assert(!/\bonSubmit\s*=/i.test(text), `${file} must not include onSubmit`);
    assert(!/\baction\s*=/i.test(text), `${file} must not include action=`);
    assert(
      !/\bformAction\s*=/i.test(text),
      `${file} must not include formAction`,
    );
    assert(!/\bfetch\s*\(/i.test(text), `${file} must not fetch`);
    assert(!/router\.push/i.test(text), `${file} must not call router.push`);
    assert(!/window\.open/i.test(text), `${file} must not call window.open`);
    assert(
      !/navigator\.clipboard/i.test(text),
      `${file} must not use navigator.clipboard`,
    );
    assert(!/\bdownload\s*=/i.test(text), `${file} must not include download=`);
  }

  assert(
    !/\bfetch\s*\(/i.test(copyExportPanelText),
    `${copyExportPanelFile} must not fetch`,
  );
  assert(
    !/<form\b/i.test(copyExportPanelText),
    `${copyExportPanelFile} must not render form elements`,
  );
  assert(
    !/\bonSubmit\s*=/i.test(copyExportPanelText),
    `${copyExportPanelFile} must not include onSubmit`,
  );
  assert(
    !/\baction\s*=/i.test(copyExportPanelText),
    `${copyExportPanelFile} must not include action=`,
  );
  assert(
    !/\bformAction\s*=/i.test(copyExportPanelText),
    `${copyExportPanelFile} must not include formAction`,
  );
  assert(
    !/router\.push/i.test(copyExportPanelText),
    `${copyExportPanelFile} must not call router.push`,
  );
  assert(
    !/window\.open/i.test(copyExportPanelText),
    `${copyExportPanelFile} must not call window.open`,
  );
  assert(
    !/\bdownload\s*=/i.test(copyExportPanelText),
    `${copyExportPanelFile} must not include download=`,
  );
  assert(
    /navigator\.clipboard\.writeText\(text\)/.test(copyExportPanelText),
    `${copyExportPanelFile} may use navigator.clipboard.writeText only for local copy`,
  );
  assert(
    /<textarea[\s\S]*readOnly[\s\S]*value=\{copyState\.fallbackText\}/.test(
      copyExportPanelText,
    ),
    `${copyExportPanelFile} must provide read-only manual copy fallback textarea`,
  );

  for (const forbiddenLabel of [
    "Start autonomy",
    "Schedule",
    "Run now",
    "Launch Codex",
    "Send handoff",
    "Apply memory",
    "Apply project Perspective",
    "Approve auto-apply",
    "Persist contract",
    "Create contract",
    "Save contract",
  ]) {
    assert(
      !combinedComponentText.includes(`>${forbiddenLabel}<`),
      `components/autonomy must not render ${forbiddenLabel} controls`,
    );
  }
}

function assertNoForbiddenReadHelperCode() {
  assert(
    !/from\s+["']@\/app\//.test(helperText),
    `${webReadHelperFile} must not import app routes`,
  );
  assert(
    !/from\s+["']@\/components\//.test(helperText),
    `${webReadHelperFile} must not import components`,
  );
  assert(
    !/apps\/augnes_apps/.test(helperText),
    `${webReadHelperFile} must not import apps/augnes_apps`,
  );
  assert(!/lib\/db/.test(helperText), `${webReadHelperFile} must not import lib/db`);
  assert(!/migrations/.test(helperText), `${webReadHelperFile} must not import migrations`);
  assert(
    !/(openai|octokit|github)(?:-|\w)*client/i.test(helperText),
    `${webReadHelperFile} must not import provider clients`,
  );
  assert(!/\bfetch\s*\(/i.test(helperText), `${webReadHelperFile} must not fetch`);
  assert(
    !/child_process/.test(helperText),
    `${webReadHelperFile} must not use child_process`,
  );
  assert(
    !/\b(writeFile|appendFile|mkdir|rm|rmdir|unlink)\b/.test(helperText),
    `${webReadHelperFile} must not perform fs writes`,
  );
  assert(
    !/\b(executeCodex|runCodex|launchCodex|codex\.execute)\b/.test(
      helperText,
    ),
    `${webReadHelperFile} must not call Codex`,
  );
  assert(
    !/\b(setTimeout|setInterval|cron|queueMicrotask)\b/.test(helperText),
    `${webReadHelperFile} must not schedule background work`,
  );
  assert(!/\bdaemon\b/i.test(stripStringLiterals(helperText)), `${webReadHelperFile} must not start daemon code`);
  assert(
    !/\b(commitStateUpdate|mutateMemory|applyProjectPerspective|writeMemory)\b/.test(
      helperText,
    ),
    `${webReadHelperFile} must not mutate memory/state/work/Perspective`,
  );
}

function assertCompanionSmokesPass() {
  execFileSync("npm", ["run", "smoke:autonomy-contract-v0-1"], {
    cwd: process.cwd(),
    stdio: "pipe",
  });
  execFileSync("npm", ["run", "smoke:autonomy-contract-route-v0-1"], {
    cwd: process.cwd(),
    stdio: "pipe",
  });
}

function assertChangedFileBoundary() {
  const result = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "Phase 8C Autonomy Contract Web preview",
  });

  for (const file of result.files) {
    assert(
      allowedChangedFiles.has(file),
      `Unexpected changed file for Phase 8C: ${file}`,
    );
    assert(
      phase9aAutonomyRunnerPreflightFiles.includes(file) ||
        !forbiddenChangedFilePatterns.some((pattern) => pattern.test(file)),
      `Forbidden Phase 8C changed file: ${file}`,
    );
  }

  return result;
}

function stripStringLiterals(text) {
  return text.replace(/(["'`])(?:\\.|(?!\1).)*\1/gs, "");
}
