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

const serverFile = "apps/augnes_apps/src/server.ts";
const stateRuntimeTypesFile = "apps/augnes_apps/src/lib/state-runtime-types.ts";
const httpAdapterFile = "apps/augnes_apps/src/adapters/state-runtime-http.ts";
const appInvariantsFile = "apps/augnes_apps/scripts/invariants.ts";
const appSmokeFile = "apps/augnes_apps/scripts/smoke.ts";
const appMockRuntimeFile = "apps/augnes_apps/scripts/mock-state-runtime.ts";
const smokeFile = "scripts/smoke-chatgpt-app-autonomy-contract-tool-v0-1.mjs";
const chatgptBoundaryDoc =
  "docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md";
const autonomyContractDoc = "docs/AUTONOMY_CONTRACT_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const phase8bRouteFile = "app/api/augnes/read/autonomy-contract/route.ts";
const phase8bSmokeFile = "scripts/smoke-autonomy-contract-route-v0-1.mjs";
const phase8cSmokeFile = "scripts/smoke-autonomy-contract-web-preview-v0-1.mjs";

const allowedPriorSmokeAllowlistFiles = [
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
  "scripts/smoke-autonomy-contract-v0-1.mjs",
  "scripts/smoke-autonomy-contract-route-v0-1.mjs",
  "scripts/smoke-autonomy-contract-web-preview-v0-1.mjs",
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
  serverFile,
  stateRuntimeTypesFile,
  httpAdapterFile,
  appInvariantsFile,
  appSmokeFile,
  appMockRuntimeFile,
  smokeFile,
  chatgptBoundaryDoc,
  autonomyContractDoc,
  indexDoc,
  packageJsonFile,
  phase8bRouteFile,
  phase8bSmokeFile,
  phase8cSmokeFile,
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
  "scripts/smoke-chatgpt-app-autonomy-runner-preflight-tool-v0-1.mjs",
  "lib/autonomy/autonomy-runner-preflight-copy-export.ts",
  "components/autonomy/autonomy-runner-preflight-copy-export-panel.tsx",
  "scripts/smoke-autonomy-runner-preflight-copy-export-v0-1.mjs",
];
const allowedChangedFiles = new Set([
  serverFile,
  stateRuntimeTypesFile,
  httpAdapterFile,
  appInvariantsFile,
  appSmokeFile,
  appMockRuntimeFile,
  smokeFile,
  chatgptBoundaryDoc,
  autonomyContractDoc,
  indexDoc,
  packageJsonFile,
  ...allowedPriorSmokeAllowlistFiles,
  ...phase8eAutonomyContractCodexSkillFiles,
  ...phase8fAutonomyContractCopyExportFiles,
]);
for (const file of phase9aAutonomyRunnerPreflightFiles) {
  allowedChangedFiles.add(file);
}

const textByFile = loadTextByFile(requiredFiles);
const serverText = textByFile.get(serverFile);
const stateRuntimeTypesText = textByFile.get(stateRuntimeTypesFile);
const httpAdapterText = textByFile.get(httpAdapterFile);
const appInvariantsText = textByFile.get(appInvariantsFile);
const appSmokeText = textByFile.get(appSmokeFile);
const appMockRuntimeText = textByFile.get(appMockRuntimeFile);
const smokeText = textByFile.get(smokeFile);
const chatgptBoundaryDocText = textByFile.get(chatgptBoundaryDoc);
const autonomyContractDocText = textByFile.get(autonomyContractDoc);
const indexText = textByFile.get(indexDoc);
const packageJsonText = textByFile.get(packageJsonFile);
const phase8bRouteText = textByFile.get(phase8bRouteFile);
const phase8bSmokeText = textByFile.get(phase8bSmokeFile);
const phase8cSmokeText = textByFile.get(phase8cSmokeFile);

assertPackageJsonScript();
assertServerTool();
assertRuntimeTypes();
assertHttpAdapter();
assertMockRuntime();
assertAppInvariantsAndSmoke();
assertDocsAndIndex();
assertPriorPhaseBoundaries();
assertNoForbiddenScopeDrift();
const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "chatgpt-app-autonomy-contract-tool-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      server_tool_registration_checked: true,
      read_only_annotations_checked: true,
      model_only_tool_meta_checked: true,
      structured_content_builder_checked: true,
      narrative_content_checked: true,
      state_runtime_adapter_marker_checked: true,
      mock_runtime_marker_check_checked: true,
      app_invariants_and_smoke_checked: true,
      docs_index_checked: true,
      phase8b_route_get_only_checked: true,
      phase8c_web_preview_read_only_checked: true,
      no_web_ui_files_changed_checked: true,
      no_app_api_route_files_changed_checked: true,
      no_db_provider_github_codex_proof_scheduler_scope_drift_checked: true,
      changed_files_boundary_checked: changedFilesBoundary.checked,
      changed_files_boundary_skipped: changedFilesBoundary.skipped,
      changed_files_boundary_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      smoke_type:
        "static-chatgpt-app-autonomy-contract-tool-source-doc-package-boundary-only",
    },
    null,
    2,
  ),
);
console.log("PASS smoke:chatgpt-app-autonomy-contract-tool-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:chatgpt-app-autonomy-contract-tool-v0-1",
    expectedCommand:
      "node scripts/smoke-chatgpt-app-autonomy-contract-tool-v0-1.mjs",
  });
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
      '"augnes_get_autonomy_contract_preview"',
      "AutonomyContractPreviewToolInputSchema",
      "type AutonomyContractPreviewResult",
      "describeAutonomyContractPreview",
      "buildAutonomyContractPreviewStructuredContent",
      "summarizeAutonomyPreviewSourceStatus",
      "summarizeAutonomyPreviewAuthorityBoundary",
      "restoreAutonomyPreviewAuthorityBoundary",
      "buildAutonomyPreviewReadBoundary",
      "AUTONOMY_PREVIEW_AUTHORITY_BOUNDARY_FALSE_FIELDS",
      "AUTONOMY_PREVIEW_READ_BOUNDARY_FALSE_FIELDS",
      "auto_apply_allowed remains false",
      "run_preview.status remains preview_only",
      "Budget is not spend permission",
    ],
    { label: serverFile },
  );

  const toolBlock = extractToolBlock("augnes_get_autonomy_contract_preview");
  assertContainsAll(
    toolBlock,
    [
      "Read-only Autonomy Contract preview tool",
      "preview/review planning only",
      "no autonomy runner",
      "no scheduler",
      "no daemon",
      "no background work",
      "no Codex execution",
      "no Codex launch",
      "no GitHub/OpenAI/provider calls",
      "no branch/PR creation",
      "no proof/evidence record creation",
      "no state, memory, DB, work, or Perspective mutation",
      "no handoff send",
      "no copy/export behavior",
      "no publish/merge/retry/replay/deploy/external post",
      "Budget is not spend permission",
      "auto_apply_allowed remains false",
      "run_preview is not execution",
      "suggestions or candidate actions are advisory/planning only",
      "unresolved user judgment remains unresolved",
      "inputSchema: AutonomyContractPreviewToolInputSchema.shape",
      "annotations: localRouteReadAnnotations",
      "modelOnlyToolMeta",
      "stateRuntimeAdapter.getAutonomyContractPreview",
      "buildAutonomyContractPreviewStructuredContent",
      "content: narrative(describeAutonomyContractPreview(result))",
      "buildBridgeToolError(\"augnes_get_autonomy_contract_preview\", error)",
    ],
    { label: `${serverFile} augnes_get_autonomy_contract_preview block` },
  );
  assert(
    !toolBlock.includes("bridgeWriteAnnotations"),
    "Autonomy Contract preview tool must not use bridgeWriteAnnotations",
  );
  assert(
    !toolBlock.includes("widgetToolMeta"),
    "Autonomy Contract preview tool must not use widgetToolMeta",
  );
  assert(
    !/ui:\s*\{\s*resourceUri/.test(toolBlock),
    "Autonomy Contract preview tool must not be widget-backed",
  );
}

function assertRuntimeTypes() {
  assertContainsAll(
    stateRuntimeTypesText,
    [
      "export const AutonomyContractPreviewToolInputSchema",
      "export const AutonomyContractPreviewResultSchema",
      "export const AutonomyContractPreviewPacketSchema",
      "export const AutonomyPreviewAuthorityBoundarySchema",
      "export type AutonomyContractPreviewResult",
      "export interface StateRuntimeAutonomyContractPreviewInput",
      "getAutonomyContractPreview(input: StateRuntimeAutonomyContractPreviewInput)",
      "source_of_truth: z.literal(false)",
      "can_commit_or_reject_state: z.literal(false)",
      "can_record_proof: z.literal(false)",
      "can_create_evidence: z.literal(false)",
      "can_update_work: z.literal(false)",
      "can_mutate_memory: z.literal(false)",
      "can_apply_project_perspective: z.literal(false)",
      "can_publish_external: z.literal(false)",
      "can_merge: z.literal(false)",
      "can_retry_replay_deploy: z.literal(false)",
      "can_call_github: z.literal(false)",
      "can_call_openai_or_provider: z.literal(false)",
      "can_execute_codex: z.literal(false)",
      "can_create_branch_or_pr: z.literal(false)",
      "can_send_handoff: z.literal(false)",
      "can_launch_codex: z.literal(false)",
      "can_launch_autonomy: z.literal(false)",
      "can_schedule_background_work: z.literal(false)",
      "can_create_mcp_tool: z.literal(false)",
      "can_create_ui_action: z.literal(false)",
      "can_post_external_comment: z.literal(false)",
      "can_write_db: z.literal(false)",
      "can_start_daemon: z.literal(false)",
      "auto_apply_allowed: z.literal(false)",
      "auto_apply_targets: z.array(z.unknown()).length(0)",
      'run_preview: z.object({ status: z.literal("preview_only") }).passthrough()',
    ],
    { label: stateRuntimeTypesFile },
  );
}

function assertHttpAdapter() {
  assertContainsAll(
    httpAdapterText,
    [
      "AutonomyContractPreviewResultSchema",
      "type AutonomyContractPreviewResult",
      "type StateRuntimeAutonomyContractPreviewInput",
      "AUTONOMY_CONTRACT_LOCAL_READ_HEADER = \"x-augnes-local-readonly\"",
      "AUTONOMY_CONTRACT_LOCAL_READ_MARKER = \"autonomy-contract-v0.1\"",
      "autonomyContractPreview: { method: \"GET\", path: \"/api/augnes/read/autonomy-contract\" }",
    ],
    { label: httpAdapterFile },
  );

  const adapterBlock = extractAdapterBlock("getAutonomyContractPreview");
  assertContainsAll(
    adapterBlock,
    [
      "endpointContract.autonomyContractPreview.method",
      "endpointContract.autonomyContractPreview.path",
      "AutonomyContractPreviewResultSchema",
      "\"autonomy contract preview\"",
      "query: { scope: parseScope(input.scope) }",
      "[AUTONOMY_CONTRACT_LOCAL_READ_HEADER]: AUTONOMY_CONTRACT_LOCAL_READ_MARKER",
    ],
    { label: `${httpAdapterFile} getAutonomyContractPreview` },
  );

  assert(
    !/autonomyContractPreview:\s*\{\s*method:\s*"POST"/.test(httpAdapterText),
    "adapter must not add POST for Autonomy Contract preview",
  );
}

function assertMockRuntime() {
  assertContainsAll(
    appMockRuntimeText,
    [
      "AutonomyContractPreviewResult",
      "StateRuntimeAutonomyContractPreviewInput",
      "buildMockAutonomyContractPreviewRouteResponse",
      "getAutonomyContractPreview(input: StateRuntimeAutonomyContractPreviewInput)",
      "handleMockStateRuntimeReadRoute",
      "request.method !== \"GET\"",
      "scope !== \"project:augnes\"",
      "\"/api/augnes/read/autonomy-contract\"",
      "autonomy-contract-v0.1",
      "marker ? \"invalid_marker\" : \"missing_marker\"",
      "contract_version: \"autonomy_contract.v0.1\"",
      "status: \"preview_only\"",
      "autonomy_mode: \"scheduled_hunt_preview\"",
      "auto_apply_allowed: false",
      "auto_apply_targets: []",
      "run_preview: {",
      "status: \"preview_only\"",
      "can_call_openai_or_provider: false",
      "can_execute_codex: false",
      "can_launch_codex: false",
      "can_schedule_background_work: false",
      "can_write_db: false",
      "can_start_daemon: false",
      "Budget is not spend permission.",
      "AutonomyRunPreview is not execution.",
    ],
    { label: appMockRuntimeFile },
  );
  assert(
    !/url\.pathname === "\/api\/augnes\/read\/autonomy-contract"[\s\S]*request\.method\s*===\s*"POST"/.test(
      appMockRuntimeText,
    ),
    "mock runtime must not accept POST for Autonomy Contract preview",
  );
}

function assertAppInvariantsAndSmoke() {
  assertContainsAll(
    appInvariantsText,
    [
      '"augnes_get_autonomy_contract_preview"',
      "LOCAL_ROUTE_READ_ANNOTATIONS",
    ],
    { label: appInvariantsFile },
  );

  assertContainsAll(
    appSmokeText,
    [
      "augnes_get_autonomy_contract_preview",
      "autonomyContract",
      "contractSummary",
      "budget",
      "deltaMergePolicy",
      "reviewEscalationPolicy",
      "stopConditions",
      "runPreview",
      "outputPolicy",
      "stalenessPolicy",
      "validationPolicy",
      "allowedActions",
      "forbiddenActions",
      "contract_version",
      "autonomy_contract.v0.1",
      "run_preview_status",
      "preview_only",
      "auto_apply_allowed",
      "auto_apply_targets",
      "autonomy_runner_authority",
      "scheduler_authority",
      "daemon_authority",
      "background_work_authority",
      "budget_spend_permission",
      "run_preview_is_execution",
      "Budget is not spend permission",
      "no autonomy runner, no scheduler, no daemon, no background work",
      "no Codex execution, no Codex launch",
      "no GitHub\\/OpenAI\\/provider calls",
      "no handoff send",
    ],
    { label: appSmokeFile },
  );
}

function assertDocsAndIndex() {
  assertContainsAll(
    autonomyContractDocText,
    [
      "Phase 8D ChatGPT App/MCP Read-Only Preview Tool",
      "augnes_get_autonomy_contract_preview",
      "GET /api/augnes/read/autonomy-contract?scope=project:augnes",
      "x-augnes-local-readonly: autonomy-contract-v0.1",
      "model-only and not widget-backed",
      "preview/review planning only",
      "no write tool",
      "no widget-backed UI",
      "does not run autonomy",
      "schedule autonomy",
      "start a daemon",
      "start background work",
      "execute Codex",
      "launch Codex",
      "send handoffs",
      "call GitHub/OpenAI/provider APIs",
      "create branches or PRs",
      "create proof/evidence records",
      "mutate state/memory/DB/work/Perspective",
      "copy/export",
      "publish/merge/retry/replay/deploy",
      "external side effects",
      "Budget remains boundary only and not spend permission",
      "`auto_apply_allowed` remains `false`",
      "`run_preview.status` remains `preview_only`",
      "run preview is not execution",
      "Phase 8E Codex Skill Alignment",
      "plugins/augnes-operator/skills/augnes-autonomy-contract/SKILL.md",
      "Phase 8F Local Copy/Export Preview",
      "local clipboard copy and manual text export preview only",
      "Phase 9 runner remains deferred",
    ],
    { label: autonomyContractDoc },
  );

  assertContainsAll(
    chatgptBoundaryDocText,
    [
      "Phase 8D Autonomy Contract preview tool",
      "augnes_get_autonomy_contract_preview",
      "GET /api/augnes/read/autonomy-contract?scope=project:augnes",
      "x-augnes-local-readonly: autonomy-contract-v0.1",
      "model-only",
      "preview/review planning only",
      "does not expose a widget",
      "write tool",
      "run action",
      "scheduler",
      "daemon",
      "background work",
      "Codex execution",
      "Codex launch",
      "handoff send",
      "GitHub/OpenAI/provider calls",
      "branch or PR creation",
      "proof/evidence writes",
      "state/memory/DB/work/Perspective mutation",
      "publish/merge/retry/replay/deploy",
      "external posting",
      "Budget is boundary only and not spend permission",
      "`auto_apply_allowed` remains `false`",
      "`run_preview.status` is `preview_only`",
      "run preview is not execution",
    ],
    { label: chatgptBoundaryDoc },
  );

  assertContainsAll(
    indexText,
    [
      "Phase 8D ChatGPT App/MCP read-only Autonomy Contract preview tool v0.1",
      "`augnes_get_autonomy_contract_preview`",
      "`apps/augnes_apps/src/server.ts`",
      "`apps/augnes_apps/src/lib/state-runtime-types.ts`",
      "`apps/augnes_apps/src/adapters/state-runtime-http.ts`",
      "`apps/augnes_apps/scripts/mock-state-runtime.ts`",
      "`scripts/smoke-chatgpt-app-autonomy-contract-tool-v0-1.mjs`",
      "smoke:chatgpt-app-autonomy-contract-tool-v0-1",
      "`x-augnes-local-readonly: autonomy-contract-v0.1`",
      "model-only tool",
      "preview-only structured content",
      "no Web UI",
      "write tool",
      "copy/export behavior",
      "runner/scheduler/daemon/background work/write/execution/external authority",
      "external side effect",
      "This index pointer is not roadmap authority.",
    ],
    { label: indexDoc },
  );
}

function assertPriorPhaseBoundaries() {
  assertContainsAll(
    phase8bRouteText,
    [
      "export const runtime = \"nodejs\"",
      "export const dynamic = \"force-dynamic\"",
      "export async function GET",
      "validateAutonomyContractReadRequest",
      "readAutonomyContractForRoute",
      "\"cache-control\"",
      "AUTONOMY_CONTRACT_CACHE_CONTROL",
    ],
    { label: phase8bRouteFile },
  );
  assert.doesNotMatch(
    phase8bRouteText,
    /export\s+(?:async\s+)?function\s+(?:POST|PUT|PATCH|DELETE)\b/,
    "Phase 8B Autonomy Contract route must remain GET-only",
  );
  assertContainsAll(
    phase8bSmokeText,
    ["route_exports_get_only_checked", "changed_files_boundary_checked"],
    { label: phase8bSmokeFile },
  );
  assertContainsAll(
    phase8cSmokeText,
    ["no_buttons_or_forms_checked", "Phase 8C Web preview adds no action buttons"],
    { label: phase8cSmokeFile },
  );
}

function assertNoForbiddenScopeDrift() {
  const changed = collectChangedFiles();
  const expectedAppFiles = new Set([
    serverFile,
    stateRuntimeTypesFile,
    httpAdapterFile,
    appInvariantsFile,
    appSmokeFile,
    appMockRuntimeFile,
  ]);
  const allowedPhase8fWebFiles = new Set([
    "components/autonomy/autonomy-copy-export-panel.tsx",
    "components/autonomy/autonomy-boundary-card.tsx",
    "components/autonomy/autonomy-contract-preview-panel.tsx",
    "components/workplane/agent-workplane.tsx",
  ]);
  const allowedPhase9cWebPreviewFiles = new Set([
    "components/autonomy/autonomy-runner-preflight-preview-panel.tsx",
    "components/workplane/agent-workplane.tsx",
  ]);
  const allowedPhase9fCopyPreviewFiles = new Set([
    "components/autonomy/autonomy-runner-preflight-copy-export-panel.tsx",
  ]);

  for (const file of changed) {
    assert(
      !file.startsWith("components/") ||
        allowedPhase8fWebFiles.has(file) ||
        allowedPhase9cWebPreviewFiles.has(file) ||
        allowedPhase9fCopyPreviewFiles.has(file),
      `Phase 8D must not change Web UI files: ${file}`,
    );
    assert(
      !file.startsWith("app/api/") ||
        file === "app/api/augnes/read/autonomy-runner-preflight/route.ts",
      `Phase 8D must not change app/api route files: ${file}`,
    );
    assert(
      !file.startsWith("migrations/"),
      `Phase 8D must not change DB migration files: ${file}`,
    );
    assert(!/^lib\/db/.test(file), `Phase 8D must not change DB runtime files: ${file}`);
    assert(!/^provider\//.test(file), `Phase 8D must not change provider runtime files: ${file}`);
    assert(
      !/(^|\/)(proof|evidence)(\/|$)/.test(file),
      `Phase 8D must not change proof/evidence write files: ${file}`,
    );
    assert(
      !/(^|\/)(scheduler|daemon)(\/|$)/.test(file),
      `Phase 8D must not change scheduler/daemon files: ${file}`,
    );
    if (file.startsWith("apps/augnes_apps/")) {
      assert(expectedAppFiles.has(file), `Unexpected App/MCP file changed in Phase 8D: ${file}`);
    }
  }

  const phase8dTexts = [
    serverText,
    stateRuntimeTypesText,
    httpAdapterText,
    appInvariantsText,
    appSmokeText,
    appMockRuntimeText,
  ].join("\n");

  assert.doesNotMatch(
    phase8dTexts,
    /from\s+["'](?:openai|@openai|octokit|@octokit|github|@actions\/github)["']/i,
    "Phase 8D must not import provider/OpenAI/GitHub clients",
  );
  assert.doesNotMatch(
    phase8dTexts,
    /createPullRequest\s*\(|mergePullRequest\s*\(|executeCodex\s*\(|launchCodex\s*\(|startDaemon\s*\(|scheduleAutonomy\s*\(|startBackgroundWork\s*\(/i,
    "Phase 8D must not add GitHub/Codex/daemon/scheduler/background execution helpers",
  );
  assert.doesNotMatch(
    phase8dTexts,
    /createEvidenceRecord\s*\(|recordProof\s*\(|writeProof\s*\(|appendProof\s*\(|mutateMemory\s*\(|applyProjectPerspective\s*\(/i,
    "Phase 8D must not add proof/evidence/memory/Perspective mutation helpers",
  );
  const autonomyToolBlock = extractToolBlock("augnes_get_autonomy_contract_preview");
  const autonomyMockStart = appMockRuntimeText.indexOf("function buildMockAutonomyContractPreviewRouteResponse");
  const autonomyMockEnd = appMockRuntimeText.indexOf("export async function handleMockStateRuntimeReadRoute", autonomyMockStart);
  const autonomyMockBlock = appMockRuntimeText.slice(
    autonomyMockStart,
    autonomyMockEnd === -1 ? undefined : autonomyMockEnd,
  );
  assert.doesNotMatch(
    `${autonomyToolBlock}\n${autonomyMockBlock}`,
    /navigator\.clipboard|clipboard\.write|download=|window\.open/i,
    "Phase 8D Autonomy tool and mock route must not add copy/export behavior",
  );
}

function collectChangedFiles() {
  return uniqueSorted([
    ...collectGitDiffFiles(["diff", "--name-only", "HEAD"]).files,
    ...getBaseRangeChangedFiles().files,
    ...collectUntrackedFiles(),
  ]);
}

function assertChangedFileBoundary() {
  const mode = process.env.AUGNES_BOUNDARY_SMOKE_MODE || "scoped";
  assert(
    ["scoped", "content-only"].includes(mode),
    `AUGNES_BOUNDARY_SMOKE_MODE must be unset, scoped, or content-only; received ${JSON.stringify(mode)}`,
  );
  const files = collectChangedFiles();

  if (mode === "content-only") {
    return {
      mode,
      checked: false,
      skipped: true,
      skip_reason:
        "changed-file boundary skipped because AUGNES_BOUNDARY_SMOKE_MODE=content-only",
      files,
    };
  }

  for (const file of files) {
    assert(allowedChangedFiles.has(file), `Unexpected changed file for Phase 8D Autonomy Contract App/MCP tool: ${file}`);
  }

  return {
    mode,
    checked: true,
    skipped: false,
    skip_reason: null,
    files,
  };
}
