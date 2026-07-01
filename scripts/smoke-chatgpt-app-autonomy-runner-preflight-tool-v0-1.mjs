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

const serverFile = "apps/augnes_apps/src/server.ts";
const stateRuntimeTypesFile = "apps/augnes_apps/src/lib/state-runtime-types.ts";
const httpAdapterFile = "apps/augnes_apps/src/adapters/state-runtime-http.ts";
const appInvariantsFile = "apps/augnes_apps/scripts/invariants.ts";
const appSmokeFile = "apps/augnes_apps/scripts/smoke.ts";
const appMockRuntimeFile = "apps/augnes_apps/scripts/mock-state-runtime.ts";
const runnerDoc = "docs/AUTONOMY_RUNNER_PREFLIGHT_V0_1.md";
const chatgptBoundaryDoc =
  "docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const appPackageJsonFile = "apps/augnes_apps/package.json";
const smokeFile =
  "scripts/smoke-chatgpt-app-autonomy-runner-preflight-tool-v0-1.mjs";

const priorPhaseSmokeScripts = [
  "smoke:autonomy-runner-preflight-v0-1",
  "smoke:autonomy-runner-preflight-route-v0-1",
  "smoke:autonomy-runner-preflight-web-preview-v0-1",
];

const requiredFiles = [
  serverFile,
  stateRuntimeTypesFile,
  httpAdapterFile,
  appInvariantsFile,
  appSmokeFile,
  appMockRuntimeFile,
  runnerDoc,
  chatgptBoundaryDoc,
  indexDoc,
  packageJsonFile,
  appPackageJsonFile,
  smokeFile,
];

const allowedChangedFiles = new Set([
  serverFile,
  stateRuntimeTypesFile,
  httpAdapterFile,
  appInvariantsFile,
  appSmokeFile,
  appMockRuntimeFile,
  runnerDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
  "scripts/smoke-autonomy-runner-preflight-v0-1.mjs",
  "scripts/smoke-autonomy-runner-preflight-route-v0-1.mjs",
  "scripts/smoke-autonomy-runner-preflight-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-autonomy-contract-tool-v0-1.mjs",
  "scripts/smoke-chatgpt-app-handoff-capsule-tool-v0-1.mjs",
  "scripts/smoke-chatgpt-app-guide-brief-tool-v0-1.mjs",
  "scripts/smoke-autonomy-contract-v0-1.mjs",
  "scripts/smoke-autonomy-contract-route-v0-1.mjs",
  "scripts/smoke-autonomy-contract-web-preview-v0-1.mjs",
  "scripts/smoke-codex-autonomy-contract-v0-1.mjs",
  "scripts/smoke-autonomy-contract-copy-export-v0-1.mjs",
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
  "scripts/smoke-codex-guidebrief-handoff-v0-1.mjs",
  "scripts/smoke-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-route-v0-1.mjs",
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
  "scripts/smoke-codex-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-copy-export-v0-1.mjs",
]);

const authorityFalseFields = [
  "source_of_truth",
  "can_start_runner",
  "can_schedule_runner",
  "can_start_daemon",
  "can_start_background_work",
  "can_commit_or_reject_state",
  "can_record_proof",
  "can_create_evidence",
  "can_update_work",
  "can_mutate_memory",
  "can_apply_project_perspective",
  "can_publish_external",
  "can_merge",
  "can_retry_replay_deploy",
  "can_call_github",
  "can_call_openai_or_provider",
  "can_execute_codex",
  "can_create_branch_or_pr",
  "can_send_handoff",
  "can_launch_codex",
  "can_launch_autonomy",
  "can_schedule_background_work",
  "can_create_mcp_tool",
  "can_create_ui_action",
  "can_post_external_comment",
  "can_write_db",
  "can_spend_budget",
  "can_auto_apply_delta",
];

const textByFile = loadTextByFile(requiredFiles);
const serverText = textByFile.get(serverFile);
const stateRuntimeTypesText = textByFile.get(stateRuntimeTypesFile);
const httpAdapterText = textByFile.get(httpAdapterFile);
const appInvariantsText = textByFile.get(appInvariantsFile);
const appSmokeText = textByFile.get(appSmokeFile);
const appMockRuntimeText = textByFile.get(appMockRuntimeFile);
const runnerDocText = textByFile.get(runnerDoc);
const indexText = textByFile.get(indexDoc);
const packageJsonText = textByFile.get(packageJsonFile);
const appPackageJsonText = textByFile.get(appPackageJsonFile);

assertPackageJsonScript();
assertAppPackageScriptsExist();
assertServerTool();
assertRuntimeTypes();
assertHttpAdapter();
assertMockRuntime();
assertAppInvariantsAndSmoke();
assertDocsAndIndex();
assertNoForbiddenScopeDrift();
const behavior = assertBehavioralToolInvocation();
const priorSmokes = assertPriorPhaseSmokesPass();
const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "chatgpt-app-autonomy-runner-preflight-tool-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      app_package_scripts_checked: true,
      server_tool_registration_checked: true,
      read_only_annotations_checked: true,
      model_only_tool_meta_checked: true,
      strict_scope_schema_checked: true,
      state_runtime_adapter_marker_checked: true,
      mock_runtime_behavior_checked: true,
      direct_tool_invocation_checked: behavior,
      prior_phase_smokes_checked: priorSmokes,
      docs_index_checked: true,
      no_api_route_files_changed_checked: true,
      no_ui_component_page_files_changed_checked: true,
      no_db_migration_files_changed_checked: true,
      no_provider_openai_github_codex_calls_checked: true,
      no_child_process_in_product_code_checked: true,
      no_fs_write_apis_in_product_code_checked: true,
      no_timer_worker_daemon_loop_checked: true,
      no_proof_evidence_memory_perspective_handoff_auto_apply_budget_external_scope_drift_checked: true,
      changed_files_boundary_checked: changedFilesBoundary.checked,
      changed_files_boundary_skipped: changedFilesBoundary.skipped,
      changed_files_boundary_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      changed_files_base_ref: changedFilesBoundary.base_ref,
      untracked_files_checked: changedFilesBoundary.untracked_checked,
      untracked_files_skipped: changedFilesBoundary.untracked_skipped,
      untracked_files_skip_reason: changedFilesBoundary.untracked_skip_reason,
      smoke_type:
        "static-and-import-chatgpt-app-autonomy-runner-preflight-tool-boundary",
    },
    null,
    2,
  ),
);
console.log("PASS smoke:chatgpt-app-autonomy-runner-preflight-tool-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:chatgpt-app-autonomy-runner-preflight-tool-v0-1",
    expectedCommand:
      "node scripts/smoke-chatgpt-app-autonomy-runner-preflight-tool-v0-1.mjs",
  });
}

function assertAppPackageScriptsExist() {
  const appPackageJson = JSON.parse(appPackageJsonText);
  for (const scriptName of ["typecheck", "invariants", "smoke"]) {
    assert(
      appPackageJson.scripts?.[scriptName],
      `${appPackageJsonFile} must keep ${scriptName} script`,
    );
  }
}

function extractToolBlock(toolName) {
  const match = new RegExp(`registerAppTool\\(\\s*server,\\s*"${toolName}"`).exec(
    serverText,
  );
  assert.ok(match, `${serverFile} must register ${toolName}`);
  const start = match.index;
  const next = serverText.indexOf("registerAppTool(", start + 1);
  return serverText.slice(start, next === -1 ? undefined : next);
}

function extractSchemaBlock(schemaName) {
  const start = stateRuntimeTypesText.indexOf(`export const ${schemaName}`);
  assert.notEqual(start, -1, `${stateRuntimeTypesFile} must define ${schemaName}`);
  const next = stateRuntimeTypesText.indexOf("\nexport const ", start + 1);
  return stateRuntimeTypesText.slice(start, next === -1 ? undefined : next);
}

function extractAdapterBlock(methodName) {
  const start = httpAdapterText.indexOf(`async ${methodName}`);
  assert.notEqual(start, -1, `${httpAdapterFile} must implement ${methodName}`);
  const next = httpAdapterText.indexOf("\n  async ", start + 1);
  return httpAdapterText.slice(start, next === -1 ? undefined : next);
}

function assertServerTool() {
  assertContainsAll(
    serverText,
    [
      '"augnes_get_autonomy_runner_preflight"',
      "AutonomyRunnerPreflightToolInputSchema",
      "type AutonomyRunnerPreflightPreviewResult",
      "buildAutonomyRunnerPreflightStructuredContent",
      "describeAutonomyRunnerPreflight",
      "resolveAutonomyRunnerPreflightScope",
      "buildAutonomyRunnerPreflightBoundaryNotes",
      "AUTONOMY_RUNNER_PREFLIGHT_AUTHORITY_BOUNDARY_FALSE_FIELDS",
      "AUTONOMY_RUNNER_PREFLIGHT_READ_BOUNDARY_FALSE_FIELDS",
      "stateRuntimeAdapter.getAutonomyRunnerPreflight",
      "dry_run_only",
      "would_execute false",
      "The tool is not approval to run.",
    ],
    { label: serverFile },
  );

  const toolBlock = extractToolBlock("augnes_get_autonomy_runner_preflight");
  assertContainsAll(
    toolBlock,
    [
      "Read-only Autonomy Runner Preflight / Dry-Run preview tool",
      "local marker-gated Autonomy Runner Preflight route/source path",
      "readiness",
      "blockers",
      "warnings",
      "dry-run plan status",
      "planned steps",
      "source refs",
      "public safety",
      "no-run authority boundary",
      "no actual runner execution",
      "no scheduler",
      "no daemon",
      "no background work",
      "no Codex execution",
      "no Codex launch",
      "no GitHub/OpenAI/provider calls",
      "no DB writes",
      "no proof/evidence writes",
      "no state, memory, work, or Perspective mutation",
      "no handoff send",
      "no branch/PR creation",
      "no auto-apply behavior",
      "no budget spending",
      "no copy/export/download behavior",
      "no publish/merge/retry/replay/deploy/external side effect",
      "dry_run_only",
      "would_execute false",
      "not approval to run",
      "inputSchema: AutonomyRunnerPreflightToolInputSchema.shape",
      "annotations: localRouteReadAnnotations",
      "modelOnlyToolMeta",
      "stateRuntimeAdapter.getAutonomyRunnerPreflight",
      "buildAutonomyRunnerPreflightStructuredContent",
      "content: narrative(describeAutonomyRunnerPreflight(result))",
      "buildBridgeToolError(\"augnes_get_autonomy_runner_preflight\", error)",
    ],
    { label: `${serverFile} augnes_get_autonomy_runner_preflight block` },
  );
  assert(!toolBlock.includes("bridgeWriteAnnotations"), "tool must not use bridgeWriteAnnotations");
  assert(!toolBlock.includes("widgetToolMeta"), "tool must not use widgetToolMeta");
  assert(!/ui:\s*\{\s*resourceUri/.test(toolBlock), "tool must not be widget-backed");
}

function assertRuntimeTypes() {
  assertContainsAll(
    stateRuntimeTypesText,
    [
      "export const AutonomyRunnerPreflightToolInputSchema",
      "scope: z.literal(\"project:augnes\").optional()",
      "include_dry_run_plan: z.boolean().optional()",
      "include_boundary: z.boolean().optional()",
      "export const AutonomyRunnerPreflightPreviewResultSchema",
      "export const AutonomyRunnerPreflightPacketSchema",
      "export const AutonomyDryRunPlanPreviewSchema",
      "export const AutonomyRunnerPreflightStepSchema",
      "would_execute: z.literal(false)",
      "status: z.literal(\"dry_run_only\")",
      "export const AutonomyRunnerPreflightAuthorityBoundarySchema",
      "export const AutonomyRunnerPreflightPublicSafetySchema",
      "contains_private_conversation: z.literal(false)",
      "contains_hidden_reasoning: z.literal(false)",
      "contains_local_private_paths: z.literal(false)",
      "contains_secrets_or_tokens: z.literal(false)",
      "contains_raw_provider_output: z.literal(false)",
      "contains_raw_retrieval_output: z.literal(false)",
      "contains_real_account_artifacts: z.literal(false)",
      "export type AutonomyRunnerPreflightPreviewResult",
      "export interface StateRuntimeAutonomyRunnerPreflightInput",
      "getAutonomyRunnerPreflight(input: StateRuntimeAutonomyRunnerPreflightInput)",
    ],
    { label: stateRuntimeTypesFile },
  );

  for (const field of authorityFalseFields) {
    assertContainsAll(stateRuntimeTypesText, [`${field}: z.literal(false)`], {
      label: stateRuntimeTypesFile,
    });
  }

  const schemaBlock = extractSchemaBlock("AutonomyRunnerPreflightToolInputSchema");
  assert.doesNotMatch(
    schemaBlock,
    /url|file|path|repo|command|action|output|destination|target|write/i,
    "tool input schema must not accept URLs, paths, repo names, commands, action names, output destinations, or write targets",
  );
}

function assertHttpAdapter() {
  assertContainsAll(
    httpAdapterText,
    [
      "AutonomyRunnerPreflightPreviewResultSchema",
      "type AutonomyRunnerPreflightPreviewResult",
      "type StateRuntimeAutonomyRunnerPreflightInput",
      "AUTONOMY_RUNNER_PREFLIGHT_LOCAL_READ_HEADER = \"x-augnes-local-readonly\"",
      "AUTONOMY_RUNNER_PREFLIGHT_LOCAL_READ_MARKER = \"autonomy-runner-preflight-v0.1\"",
      "autonomyRunnerPreflight: { method: \"GET\", path: \"/api/augnes/read/autonomy-runner-preflight\" }",
    ],
    { label: httpAdapterFile },
  );

  const adapterBlock = extractAdapterBlock("getAutonomyRunnerPreflight");
  assertContainsAll(
    adapterBlock,
    [
      "endpointContract.autonomyRunnerPreflight.method",
      "endpointContract.autonomyRunnerPreflight.path",
      "AutonomyRunnerPreflightPreviewResultSchema",
      "\"autonomy runner preflight preview\"",
      "query: { scope: parseScope(input.scope) }",
      "[AUTONOMY_RUNNER_PREFLIGHT_LOCAL_READ_HEADER]: AUTONOMY_RUNNER_PREFLIGHT_LOCAL_READ_MARKER",
    ],
    { label: `${httpAdapterFile} getAutonomyRunnerPreflight` },
  );
  assert(!/autonomyRunnerPreflight:\s*\{\s*method:\s*"POST"/.test(httpAdapterText));
}

function assertMockRuntime() {
  assertContainsAll(
    appMockRuntimeText,
    [
      "AutonomyRunnerPreflightPreviewResult",
      "StateRuntimeAutonomyRunnerPreflightInput",
      "buildMockAutonomyRunnerPreflightRouteResponse",
      "getAutonomyRunnerPreflight(input: StateRuntimeAutonomyRunnerPreflightInput)",
      "\"/api/augnes/read/autonomy-runner-preflight\"",
      "autonomy-runner-preflight-v0.1",
      "preflight_version: \"autonomy_runner_preflight.v0.1\"",
      "status: \"dry_run_only\"",
      "would_execute: false",
      "can_start_runner: false",
      "can_schedule_runner: false",
      "can_execute_codex: false",
      "can_call_github: false",
      "can_call_openai_or_provider: false",
      "can_write_db: false",
      "can_spend_budget: false",
      "can_auto_apply_delta: false",
      "contains_private_conversation: false",
      "contains_hidden_reasoning: false",
      "contains_local_private_paths: false",
      "contains_secrets_or_tokens: false",
      "contains_raw_provider_output: false",
      "contains_raw_retrieval_output: false",
      "contains_real_account_artifacts: false",
    ],
    { label: appMockRuntimeFile },
  );
}

function assertAppInvariantsAndSmoke() {
  assertContainsAll(
    appInvariantsText,
    [
      '"augnes_get_autonomy_runner_preflight"',
      "LOCAL_ROUTE_READ_ANNOTATIONS",
    ],
    { label: appInvariantsFile },
  );

  assertContainsAll(
    appSmokeText,
    [
      "augnes_get_autonomy_runner_preflight",
      "autonomyRunnerPreflight",
      "preflightSummary",
      "dryRunPlan",
      "dryRunPlanSummary",
      "plannedSteps",
      "noRunBoundary",
      "noRunBoundaryNotes",
      "autonomy_runner_preflight.v0.1",
      "dry_run_only",
      "would_execute false",
      "can_start_runner",
      "can_schedule_runner",
      "can_spend_budget",
      "can_auto_apply_delta",
      "no runner starts, no scheduler starts, no daemon starts, no background work starts",
      "no Codex execution, no GitHub\\/provider\\/OpenAI call",
    ],
    { label: appSmokeFile },
  );
}

function assertDocsAndIndex() {
  assertContainsAll(
    runnerDocText,
    [
      "Phase 9D ChatGPT App/MCP Read-Only Preview Tool",
      "augnes_get_autonomy_runner_preflight",
      "ChatGPT App/MCP read-only preview tool",
      "returns Autonomy Runner Preflight / Dry-Run preview data",
      "The tool is not approval to run.",
      "does not run, schedule, start a runner, start a daemon, start background work",
      "launch Codex, execute Codex, call GitHub/providers/OpenAI",
      "write DB, create proof/evidence, mutate memory/Perspective/state/work",
      "send a handoff, create branches/PRs, apply deltas, spend budget",
      "create external side effects",
      "adds no write-capable MCP/App tool",
      "smoke:chatgpt-app-autonomy-runner-preflight-tool-v0-1",
    ],
    { label: runnerDoc },
  );

  assertContainsAll(
    indexText,
    [
      "Phase 9D ChatGPT App/MCP Autonomy Runner Preflight read-only preview tool",
      "augnes_get_autonomy_runner_preflight",
      "scripts/smoke-chatgpt-app-autonomy-runner-preflight-tool-v0-1.mjs",
      "smoke:chatgpt-app-autonomy-runner-preflight-tool-v0-1",
      "read-only preview only",
      "dry_run_plan.status: dry_run_only",
      "would_execute: false",
      "all-false authority boundary",
      "adds no API route, UI, actual runner, scheduler, daemon",
      "write-capable App/MCP tool",
      "external side effect",
    ],
    { label: indexDoc },
  );
}

function assertNoForbiddenScopeDrift() {
  const changed = collectChangedFiles();
  for (const file of changed) {
    assert(!file.startsWith("app/api/"), `Phase 9D must not change API route files: ${file}`);
    assert(!file.startsWith("components/"), `Phase 9D must not change UI component files: ${file}`);
    assert(!file.startsWith("app/") || !/page|route|layout/.test(file), `Phase 9D must not change app route/page files: ${file}`);
    assert(!file.startsWith("migrations/"), `Phase 9D must not change DB migration files: ${file}`);
    assert(!/^lib\/db/.test(file), `Phase 9D must not change DB runtime files: ${file}`);
    assert(!/^provider\//.test(file), `Phase 9D must not change provider runtime files: ${file}`);
    assert(!/(^|\/)(proof|evidence)(\/|$)/.test(file), `Phase 9D must not change proof/evidence write files: ${file}`);
    assert(!/(^|\/)(scheduler|daemon)(\/|$)/.test(file), `Phase 9D must not change scheduler/daemon files: ${file}`);
    assert(!/(^|\/)(copy|export|download)(\/|$)/i.test(file), `Phase 9D must not add copy/export/download files: ${file}`);
    if (file.startsWith("apps/augnes_apps/")) {
      assert(
        [serverFile, stateRuntimeTypesFile, httpAdapterFile, appInvariantsFile, appSmokeFile, appMockRuntimeFile].includes(file),
        `Unexpected App/MCP file changed in Phase 9D: ${file}`,
      );
    }
  }

  const productTexts = [
    serverText,
    stateRuntimeTypesText,
    httpAdapterText,
    appMockRuntimeText,
  ].join("\n");
  const codeOnly = stripStringLiterals(productTexts);

  assert.doesNotMatch(
    productTexts,
    /from\s+["'](?:openai|@openai|octokit|@octokit|github|@actions\/github)["']/i,
    "Phase 9D product code must not import provider/OpenAI/GitHub clients",
  );
  assert.doesNotMatch(
    productTexts,
    /from\s+["']node:child_process["']|from\s+["']child_process["']/i,
    "Phase 9D product code must not import child_process",
  );
  assert.doesNotMatch(
    codeOnly,
    /writeFile|appendFile|createWriteStream|mkdir|rm\s*\(|unlink|rmdir|truncate|cp\s*\(/i,
    "Phase 9D product code must not add fs write APIs",
  );
  assert.doesNotMatch(
    codeOnly,
    /setInterval\s*\(|setTimeout\s*\(|cron|worker|daemonLoop|startBackgroundWork|scheduleBackgroundWork|executeCodex|launchCodex|callGithub|callOpenAI|createEvidence|recordProof|mutateMemory|applyProjectPerspective|sendHandoff|createBranch|createPullRequest|autoApply|spendBudget|postExternal/i,
    "Phase 9D product code must not add execution/write/schedule/external side-effect helpers",
  );
  assert.doesNotMatch(
    extractToolBlock("augnes_get_autonomy_runner_preflight"),
    /navigator\.clipboard|clipboard\.write|download=|window\.open/i,
    "Phase 9D tool must not add copy/export/download behavior",
  );
}

function assertBehavioralToolInvocation() {
  const behaviorScript = String.raw`
    const { MockAugnesCoreAdapter } = await import("./src/adapters/mock-core.ts");
    const { MockStateRuntimeBridgeAdapter } = await import("./scripts/mock-state-runtime.ts");
    const { createMcpAppServer } = await import("./src/server.ts");

    const server = createMcpAppServer(
      new MockAugnesCoreAdapter(),
      new MockStateRuntimeBridgeAdapter(),
      { enableAgentBridge: true }
    );
    try {
      const tool = server._registeredTools.augnes_get_autonomy_runner_preflight;
      const result = await tool.handler({
        scope: "project:augnes",
        include_dry_run_plan: true,
        include_boundary: true,
      });
      const invalidScope = await tool.handler({ scope: "project:not-augnes" });
      const content = result.structuredContent;
      const publicSafety = content.public_safety;
      const authority = content.authority_boundary;
      const noRunBoundary = content.no_run_boundary;
      const authorityAllFalse = Object.entries(authority)
        .filter(([key]) => key !== "notes")
        .every(([, value]) => value === false);
      const noRunBoundaryAllFalse = Object.entries(noRunBoundary)
        .filter(([key]) => key !== "notes")
        .every(([, value]) => value === false);
      const noLeakage =
        publicSafety.contains_private_conversation === false &&
        publicSafety.contains_hidden_reasoning === false &&
        publicSafety.contains_local_private_paths === false &&
        publicSafety.contains_secrets_or_tokens === false &&
        publicSafety.contains_raw_provider_output === false &&
        publicSafety.contains_raw_retrieval_output === false &&
        publicSafety.contains_real_account_artifacts === false;
      const serialized = JSON.stringify(content);
      console.log(JSON.stringify({
        toolExists: Boolean(tool),
        annotations: tool.annotations,
        contentText: result.content?.[0]?.text ?? "",
        panel: content.panel,
        preflightVersion: content.preflight?.preflight_version,
        readiness: content.readiness,
        readinessSummary: content.readiness_summary,
        blockerCount: content.blockers?.length ?? 0,
        warningCount: content.warnings?.length ?? 0,
        dryRunStatus: content.dry_run_plan?.status,
        plannedStepCount: content.planned_steps?.length ?? 0,
        everyStepWouldExecuteFalse: content.planned_steps?.every((step) => step.would_execute === false),
        noRunBoundaryAllFalse,
        authorityAllFalse,
        noRunStarted: content.no_run_boundary_notes?.no_run_started,
        noSchedulerStarted: content.no_run_boundary_notes?.no_scheduler_started,
        noCodexExecution: content.no_run_boundary_notes?.no_codex_execution,
        noGithubProviderCall: content.no_run_boundary_notes?.no_github_or_provider_call,
        noDbWrite: content.no_run_boundary_notes?.no_db_write,
        noProofEvidenceWrite: content.no_run_boundary_notes?.no_proof_or_evidence_write,
        noMemoryPerspectiveMutation: content.no_run_boundary_notes?.no_memory_or_perspective_mutation,
        noHandoffSend: content.no_run_boundary_notes?.no_handoff_send,
        noBranchOrPrCreation: content.no_run_boundary_notes?.no_branch_or_pr_creation,
        noAutoApply: content.no_run_boundary_notes?.no_auto_apply,
        noBudgetSpend: content.no_run_boundary_notes?.no_budget_spend,
        noExternalSideEffect: content.no_run_boundary_notes?.no_external_side_effect,
        publicSafe: noLeakage,
        hasSourceRefs: Boolean(content.source_refs),
        hasSourceStatus: Boolean(content.source_status),
        hasAssessments: Boolean(content.assessments),
        invalidScopeFailedClosed: Boolean(invalidScope.structuredContent?.error),
        invalidScopeMessage: invalidScope.structuredContent?.error?.message ?? "",
        noCredentialLikeLeaks: !/sk-[A-Za-z0-9]|ghp_[A-Za-z0-9]|github_pat_|\/Users\//i.test(serialized),
      }));
    } finally {
      server.close();
    }
  `;

  const output = execFileSync(
    process.execPath,
    ["--import", "tsx", "--input-type=module", "--eval", behaviorScript],
    {
      cwd: "apps/augnes_apps",
      encoding: "utf8",
      env: { ...process.env, TSX_TSCONFIG_PATH: "tsconfig.json" },
    },
  );
  const result = JSON.parse(output);

  assert.equal(result.toolExists, true);
  assert.deepEqual(result.annotations, {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  });
  assert.equal(result.panel, "autonomy_runner_preflight_preview");
  assert.equal(result.preflightVersion, "autonomy_runner_preflight.v0.1");
  assert.equal(result.dryRunStatus, "dry_run_only");
  assert(result.plannedStepCount > 0, "tool output must include planned steps");
  assert.equal(result.everyStepWouldExecuteFalse, true);
  assert.equal(result.authorityAllFalse, true);
  assert.equal(result.noRunBoundaryAllFalse, true);
  assert.equal(result.noRunStarted, true);
  assert.equal(result.noSchedulerStarted, true);
  assert.equal(result.noCodexExecution, true);
  assert.equal(result.noGithubProviderCall, true);
  assert.equal(result.noDbWrite, true);
  assert.equal(result.noProofEvidenceWrite, true);
  assert.equal(result.noMemoryPerspectiveMutation, true);
  assert.equal(result.noHandoffSend, true);
  assert.equal(result.noBranchOrPrCreation, true);
  assert.equal(result.noAutoApply, true);
  assert.equal(result.noBudgetSpend, true);
  assert.equal(result.noExternalSideEffect, true);
  assert.equal(result.publicSafe, true);
  assert.equal(result.hasSourceRefs, true);
  assert.equal(result.hasSourceStatus, true);
  assert.equal(result.hasAssessments, true);
  assert.equal(result.invalidScopeFailedClosed, true);
  assert.match(result.invalidScopeMessage, /project:augnes/);
  assert.equal(result.noCredentialLikeLeaks, true);
  assert.match(result.contentText, /Read-only Autonomy Runner Preflight \/ Dry-Run preview tool/i);
  assert.match(result.contentText, /Every planned step would_execute false: true/i);
  assert.match(result.contentText, /no runner starts, no scheduler starts, no daemon starts, no background work starts/i);

  return {
    valid_scope_succeeded: true,
    invalid_scope_failed_closed: true,
    dry_run_only_checked: true,
    planned_steps_would_execute_false_checked: true,
    authority_boundary_all_false_checked: true,
    public_safety_checked: true,
  };
}

function assertPriorPhaseSmokesPass() {
  const results = [];
  for (const scriptName of priorPhaseSmokeScripts) {
    execFileSync("npm", ["run", scriptName], {
      cwd: process.cwd(),
      stdio: "pipe",
      encoding: "utf8",
    });
    results.push(scriptName);
  }

  return results;
}

function collectChangedFiles() {
  return uniqueSorted([
    ...collectGitDiffFiles(["diff", "--name-only", "HEAD"]).files,
    ...collectGitDiffFiles(["diff", "--cached", "--name-only"]).files,
    ...getBaseRangeChangedFiles().files,
    ...collectUntrackedFiles(),
  ]);
}

function assertChangedFileBoundary() {
  const scopedBoundary = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "Phase 9D ChatGPT App/MCP Autonomy Runner Preflight tool",
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
    assert(allowedChangedFiles.has(file), `Unexpected Phase 9D changed file: ${file}`);
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
