#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  assertContainsAll,
  assertChangedFilesWithin,
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
const chatgptBoundaryDoc =
  "docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md";
const contractDoc = "docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-chatgpt-app-handoff-capsule-tool-v0-1.mjs";
const phase7aSmokeFile = "scripts/smoke-handoff-capsule-v0-1.mjs";
const phase7bSmokeFile = "scripts/smoke-handoff-capsule-route-v0-1.mjs";
const phase7cSmokeFile = "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs";
const handoffRouteFile =
  "app/api/augnes/read/handoff-capsule/route.ts";
const launchCardRouteFile =
  "app/api/augnes/read/codex-launch-card/route.ts";

const priorSmokeAllowlistCompatibilityFiles = [
  "scripts/smoke-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-route-v0-1.mjs",
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-guide-brief-tool-v0-1.mjs",
  "scripts/smoke-guide-brief-v0-1.mjs",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
  "scripts/smoke-web-guide-panel-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
  "scripts/smoke-codex-guidebrief-handoff-v0-1.mjs",
];

const requiredFiles = [
  serverFile,
  stateRuntimeTypesFile,
  httpAdapterFile,
  appInvariantsFile,
  appSmokeFile,
  appMockRuntimeFile,
  chatgptBoundaryDoc,
  contractDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
  phase7aSmokeFile,
  phase7bSmokeFile,
  phase7cSmokeFile,
  handoffRouteFile,
  launchCardRouteFile,
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
  serverFile,
  stateRuntimeTypesFile,
  httpAdapterFile,
  appInvariantsFile,
  appSmokeFile,
  appMockRuntimeFile,
  chatgptBoundaryDoc,
  contractDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
  "docs/CODEX_HANDOFF_CAPSULE_CONSUMPTION_V0_1.md",
  "plugins/augnes-operator/skills/augnes-handoff-capsule/SKILL.md",
  "scripts/smoke-codex-handoff-capsule-v0-1.mjs",
  "docs/CODEX_AUGNES_OPERATOR_PLUGIN_V0_2.md",
  "scripts/smoke-augnes-operator-plugin-v2.mjs",
  "scripts/smoke-augnes-capsule-handoff-skill.mjs",
  "scripts/smoke-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-route-v0-1.mjs",
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
  "scripts/smoke-codex-guidebrief-handoff-v0-1.mjs",
  "lib/handoff/handoff-capsule-copy-export.ts",
  "components/handoff/handoff-copy-export-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "lib/handoff/read-handoff-capsule-for-web.ts",
  "components/handoff/handoff-preview-boundary-card.tsx",
  "components/handoff/codex-launch-card-preview-panel.tsx",
  "components/handoff/handoff-capsule-preview-panel.tsx",
  "scripts/smoke-handoff-capsule-copy-export-v0-1.mjs",
  ...priorSmokeAllowlistCompatibilityFiles,
]);
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

const followOnHandoffCapsuleCopyExportFiles = new Set([
  "lib/handoff/handoff-capsule-copy-export.ts",
  "components/handoff/handoff-copy-export-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "lib/handoff/read-handoff-capsule-for-web.ts",
  "components/handoff/handoff-preview-boundary-card.tsx",
  "components/handoff/codex-launch-card-preview-panel.tsx",
  "components/handoff/handoff-capsule-preview-panel.tsx",
  "scripts/smoke-handoff-capsule-copy-export-v0-1.mjs",
]);

const textByFile = loadTextByFile(requiredFiles);
const serverText = textByFile.get(serverFile);
const stateRuntimeTypesText = textByFile.get(stateRuntimeTypesFile);
const httpAdapterText = textByFile.get(httpAdapterFile);
const appInvariantsText = textByFile.get(appInvariantsFile);
const appSmokeText = textByFile.get(appSmokeFile);
const appMockRuntimeText = textByFile.get(appMockRuntimeFile);
const chatgptBoundaryDocText = textByFile.get(chatgptBoundaryDoc);
const contractDocText = textByFile.get(contractDoc);
const indexText = textByFile.get(indexDoc);
const packageJsonText = textByFile.get(packageJsonFile);
const phase7aSmokeText = textByFile.get(phase7aSmokeFile);
const phase7bSmokeText = textByFile.get(phase7bSmokeFile);
const phase7cSmokeText = textByFile.get(phase7cSmokeFile);
const handoffRouteText = textByFile.get(handoffRouteFile);
const launchCardRouteText = textByFile.get(launchCardRouteFile);

assertPackageJsonScript();
assertServerTools();
assertRuntimeTypes();
assertHttpAdapter();
assertMockRuntime();
assertAppCompatibility();
assertDocsAndIndex();
assertNoForbiddenScopeDrift();
assertPriorPhaseBoundaries();
const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "chatgpt-app-handoff-capsule-tool-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      server_tool_registration_checked: true,
      read_only_annotations_checked: true,
      model_only_tool_meta_checked: true,
      state_runtime_adapter_markers_checked: true,
      mock_runtime_marker_checks_checked: true,
      app_invariants_and_smoke_checked: true,
      docs_index_checked: true,
      no_web_ui_files_changed_checked: true,
      no_app_api_route_files_changed_checked: true,
      no_db_provider_github_codex_proof_autonomy_scope_drift_checked: true,
      phase7a_launch_card_status_regression_checked: true,
      phase7b_get_only_routes_checked: true,
      phase7c_web_preview_read_only_checked: true,
      changed_files_boundary_checked: changedFilesBoundary.checked,
      changed_files_boundary_skipped: changedFilesBoundary.skipped,
      changed_files_boundary_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      smoke_type:
        "static-chatgpt-app-handoff-capsule-tool-source-doc-package-boundary-only",
    },
    null,
    2,
  ),
);
console.log("PASS smoke:chatgpt-app-handoff-capsule-tool-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:chatgpt-app-handoff-capsule-tool-v0-1",
    expectedCommand:
      "node scripts/smoke-chatgpt-app-handoff-capsule-tool-v0-1.mjs",
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

function assertToolBlock(toolName, expected) {
  const toolBlock = extractToolBlock(toolName);

  assertContainsAll(toolBlock, expected.required, {
    label: `${serverFile} ${toolName} block`,
  });
  assert(
    !toolBlock.includes("bridgeWriteAnnotations"),
    `${toolName} must not use bridgeWriteAnnotations`,
  );
  assert(
    !toolBlock.includes("widgetToolMeta"),
    `${toolName} must not use widgetToolMeta`,
  );
  assert(
    !/ui:\s*\{\s*resourceUri/.test(toolBlock),
    `${toolName} must not be widget-backed`,
  );
}

function assertServerTools() {
  assertContainsAll(
    serverText,
    [
      '"augnes_get_handoff_capsule_preview"',
      '"augnes_get_codex_launch_card_preview"',
      "HandoffCapsulePreviewToolInputSchema",
      "CodexLaunchCardPreviewToolInputSchema",
      "describeHandoffCapsulePreview",
      "describeCodexLaunchCardPreview",
      "buildHandoffCapsulePreviewStructuredContent",
      "buildCodexLaunchCardPreviewStructuredContent",
      "restoreHandoffPreviewAuthorityBoundary",
      "restoreHandoffPreviewReadBoundary",
      "HANDOFF_PREVIEW_AUTHORITY_BOUNDARY_FALSE_FIELDS",
      "HANDOFF_PREVIEW_READ_BOUNDARY_FALSE_FIELDS",
      "can_call_openai_or_provider",
      "can_launch_codex",
      "can_send_handoff",
      "github_openai_provider_calls",
    ],
    { label: serverFile },
  );

  assertToolBlock("augnes_get_handoff_capsule_preview", {
    required: [
      "registerAppTool",
      "Read-only Handoff Capsule preview tool",
      "preview/review preparation only",
      "preserves Observed/Inferred/Suggested/Needs user judgment separation",
      "suggestions as advisory only",
      "unresolved user judgment unresolved",
      "does not send handoffs",
      "does not launch or execute Codex",
      "does not call GitHub/OpenAI/provider services",
      "does not create branches or PRs",
      "does not create proof/evidence records",
      "does not mutate state, memory, DB, work, or Perspective",
      "does not publish, merge, retry, replay, deploy, or externally post",
      "inputSchema: HandoffCapsulePreviewToolInputSchema.shape",
      "annotations: localRouteReadAnnotations",
      "modelOnlyToolMeta",
      "stateRuntimeAdapter.getHandoffCapsulePreview",
      "buildHandoffCapsulePreviewStructuredContent",
      "content: narrative(describeHandoffCapsulePreview(result))",
    ],
  });

  assertToolBlock("augnes_get_codex_launch_card_preview", {
    required: [
      "registerAppTool",
      "Read-only Codex Launch Card preview tool",
      "preview/review preparation only",
      "preserves Observed/Inferred/Suggested/Needs user judgment separation",
      "suggestions for Codex as advisory only",
      "unresolved user judgment unresolved",
      "does not send handoffs",
      "does not launch or execute Codex",
      "does not call GitHub/OpenAI/provider services",
      "does not create branches or PRs",
      "does not create proof/evidence records",
      "does not mutate state, memory, DB, work, or Perspective",
      "does not publish, merge, retry, replay, deploy, or externally post",
      "inputSchema: CodexLaunchCardPreviewToolInputSchema.shape",
      "annotations: localRouteReadAnnotations",
      "modelOnlyToolMeta",
      "stateRuntimeAdapter.getCodexLaunchCardPreview",
      "buildCodexLaunchCardPreviewStructuredContent",
      "content: narrative(describeCodexLaunchCardPreview(result))",
    ],
  });
}

function assertRuntimeTypes() {
  assertContainsAll(
    stateRuntimeTypesText,
    [
      "export const HandoffCapsulePreviewToolInputSchema",
      "export const CodexLaunchCardPreviewToolInputSchema",
      "export const HandoffCapsulePreviewResultSchema",
      "export const CodexLaunchCardPreviewResultSchema",
      "export type HandoffCapsulePreviewResult",
      "export type CodexLaunchCardPreviewResult",
      "interface StateRuntimeHandoffCapsulePreviewInput",
      "interface StateRuntimeCodexLaunchCardPreviewInput",
      "getHandoffCapsulePreview(input: StateRuntimeHandoffCapsulePreviewInput)",
      "getCodexLaunchCardPreview(input: StateRuntimeCodexLaunchCardPreviewInput)",
      "can_execute_codex: z.literal(false)",
      "can_launch_codex: z.literal(false)",
      "can_send_handoff: z.literal(false)",
      "can_create_branch_or_pr: z.literal(false)",
      "can_call_github: z.literal(false)",
      "can_call_openai_or_provider: z.literal(false)",
      "can_record_proof: z.literal(false)",
      "can_create_evidence: z.literal(false)",
      "can_mutate_memory: z.literal(false)",
      "can_apply_project_perspective: z.literal(false)",
      "can_merge: z.literal(false)",
      "can_retry_replay_deploy: z.literal(false)",
      "can_create_mcp_tool: z.literal(false)",
      "can_create_ui_action: z.literal(false)",
      "can_post_external_comment: z.literal(false)",
    ],
    { label: stateRuntimeTypesFile },
  );
}

function assertHttpAdapter() {
  assertContainsAll(
    httpAdapterText,
    [
      "handoffCapsulePreview: { method: \"GET\", path: \"/api/augnes/read/handoff-capsule\" }",
      "codexLaunchCardPreview: { method: \"GET\", path: \"/api/augnes/read/codex-launch-card\" }",
      "HANDOFF_CAPSULE_LOCAL_READ_HEADER = \"x-augnes-local-readonly\"",
      "HANDOFF_CAPSULE_LOCAL_READ_MARKER = \"handoff-capsule-v0.1\"",
      "CODEX_LAUNCH_CARD_LOCAL_READ_HEADER = \"x-augnes-local-readonly\"",
      "CODEX_LAUNCH_CARD_LOCAL_READ_MARKER = \"codex-launch-card-v0.1\"",
      "HandoffCapsulePreviewResultSchema",
      "CodexLaunchCardPreviewResultSchema",
    ],
    { label: httpAdapterFile },
  );

  const handoffBlock = extractAdapterBlock("getHandoffCapsulePreview");
  assertContainsAll(
    handoffBlock,
    [
      "endpointContract.handoffCapsulePreview.method",
      "endpointContract.handoffCapsulePreview.path",
      "HandoffCapsulePreviewResultSchema",
      "query: {",
      "scope: parseScope(input.scope)",
      "target: input.target",
      "[HANDOFF_CAPSULE_LOCAL_READ_HEADER]: HANDOFF_CAPSULE_LOCAL_READ_MARKER",
    ],
    { label: `${httpAdapterFile} getHandoffCapsulePreview` },
  );

  const launchCardBlock = extractAdapterBlock("getCodexLaunchCardPreview");
  assertContainsAll(
    launchCardBlock,
    [
      "endpointContract.codexLaunchCardPreview.method",
      "endpointContract.codexLaunchCardPreview.path",
      "CodexLaunchCardPreviewResultSchema",
      "query: { scope: parseScope(input.scope) }",
      "[CODEX_LAUNCH_CARD_LOCAL_READ_HEADER]: CODEX_LAUNCH_CARD_LOCAL_READ_MARKER",
    ],
    { label: `${httpAdapterFile} getCodexLaunchCardPreview` },
  );

  assert(
    !/handoffCapsulePreview:\s*\{\s*method:\s*"POST"/.test(httpAdapterText),
    "adapter must not add POST for Handoff Capsule preview",
  );
  assert(
    !/codexLaunchCardPreview:\s*\{\s*method:\s*"POST"/.test(httpAdapterText),
    "adapter must not add POST for Codex Launch Card preview",
  );
}

function assertMockRuntime() {
  assertContainsAll(
    appMockRuntimeText,
    [
      "getHandoffCapsulePreview(input: StateRuntimeHandoffCapsulePreviewInput)",
      "getCodexLaunchCardPreview(input: StateRuntimeCodexLaunchCardPreviewInput)",
      "handleMockStateRuntimeReadRoute",
      "request.method !== \"GET\"",
      "scope !== \"project:augnes\"",
      "target !== \"codex_handoff\"",
      "handoff-capsule-v0.1",
      "codex-launch-card-v0.1",
      "can_call_openai_or_provider: false",
      "can_execute_codex: false",
      "can_launch_codex: false",
      "can_send_handoff: false",
      "can_create_branch_or_pr: false",
      "can_post_external_comment: false",
      "No status may mean executed.",
      "Synthetic mock preview",
    ],
    { label: appMockRuntimeFile },
  );
}

function assertAppCompatibility() {
  assertContainsAll(
    appInvariantsText,
    [
      '"augnes_get_handoff_capsule_preview"',
      '"augnes_get_codex_launch_card_preview"',
      "LOCAL_ROUTE_READ_ANNOTATIONS",
    ],
    { label: appInvariantsFile },
  );

  assertContainsAll(
    appSmokeText,
    [
      "augnes_get_handoff_capsule_preview",
      "augnes_get_codex_launch_card_preview",
      "handoffCapsule",
      "codexLaunchCard",
      "expectedFiles",
      "forbiddenFiles",
      "requiredChecks",
      "skippedCheckPolicy",
      "prBodyRequirements",
      "finalReportRequirements",
      "can_call_openai_or_provider",
      "can_launch_codex",
      "can_send_handoff",
      "can_create_branch_or_pr",
      "github_openai_provider_calls",
      "No status may mean executed",
      "not Codex execution, not branch creation, not PR creation, not a launch action",
    ],
    { label: appSmokeFile },
  );
}

function assertDocsAndIndex() {
  assertContainsAll(
    contractDocText,
    [
      "Phase 7D ChatGPT App/MCP Read-Only Preview Tools",
      "augnes_get_handoff_capsule_preview",
      "augnes_get_codex_launch_card_preview",
      "GET /api/augnes/read/handoff-capsule?scope=project:augnes&target=codex_handoff",
      "x-augnes-local-readonly: handoff-capsule-v0.1",
      "GET /api/augnes/read/codex-launch-card?scope=project:augnes",
      "x-augnes-local-readonly: codex-launch-card-v0.1",
      "preview/review preparation only",
      "Suggestions remain advisory only.",
      "Unresolved user judgment remains unresolved.",
      "Codex Launch Card status never means executed.",
      "no write tool",
      "no widget-backed UI",
      "no Codex execution",
      "no handoff send",
      "no GitHub/OpenAI/provider calls",
      "no branch/PR creation",
      "no proof/evidence writes",
      "no state/memory/DB/work/Perspective mutation",
      "no copy/export behavior",
      "no external side effects",
      "Phase 7E Codex skill alignment and Phase 7F local copy/export preview are",
      "Phase 7F Local Copy/Export Preview",
    ],
    { label: contractDoc },
  );

  assertContainsAll(
    chatgptBoundaryDocText,
    [
      "Handoff Capsule / Codex Launch Card preview tools",
      "augnes_get_handoff_capsule_preview",
      "augnes_get_codex_launch_card_preview",
      "local-route backed",
      "do not expose a widget",
      "write tool",
      "Codex execution",
      "handoff send",
      "GitHub/OpenAI/provider calls",
      "branch or PR creation",
      "proof/evidence writes",
      "state/memory/DB/work/Perspective mutation",
      "publish/merge/retry/replay/deploy",
      "Suggestions are advisory only.",
      "Unresolved user judgment remains unresolved.",
      "Codex Launch Card status never means executed.",
    ],
    { label: chatgptBoundaryDoc },
  );

  assertContainsAll(
    indexText,
    [
      "Phase 7D ChatGPT App/MCP read-only Handoff Capsule / Codex Launch Card preview tools v0.1",
      "`augnes_get_handoff_capsule_preview`",
      "`augnes_get_codex_launch_card_preview`",
      "`x-augnes-local-readonly: handoff-capsule-v0.1`",
      "`x-augnes-local-readonly: codex-launch-card-v0.1`",
      "model-only structured preview content",
      "all-false authority boundaries",
      "no Web UI",
      "no action authority",
    ],
    { label: indexDoc },
  );
}

function assertNoForbiddenScopeDrift() {
  const changed = uniqueSorted([
    ...collectGitDiffFiles(["diff", "--name-only", "HEAD"]).files,
    ...getBaseRangeChangedFiles().files,
    ...collectUntrackedFiles(),
  ]);

  const forbiddenChangedPatterns = [
    /^app\/api\//,
    /^components\//,
    /^migrations\//,
    /^lib\/db/,
    /^provider\//,
    /(^|\/)(proof|evidence)(\/|$)/,
    /(^|\/)(scheduler|autonomy)(\/|$)/,
  ];
  const phase8AutonomyContractCoreFiles = new Set([
    "lib/autonomy/autonomy-contract.ts",
    "app/api/augnes/read/autonomy-contract/route.ts",
    "lib/autonomy/autonomy-contract-source.ts",
    "scripts/smoke-autonomy-contract-route-v0-1.mjs",
  ]);

  for (const file of changed) {
    if (followOnHandoffCapsuleCopyExportFiles.has(file)) {
      continue;
    }
    if (phase8AutonomyContractCoreFiles.has(file)) {
      continue;
    }

    for (const pattern of forbiddenChangedPatterns) {
      assert(
        !pattern.test(file),
        `Phase 7D must not change forbidden file: ${file}`,
      );
    }
  }

  const phase7dTexts = [
    serverText,
    stateRuntimeTypesText,
    httpAdapterText,
    appMockRuntimeText,
  ].join("\n");

  assert.doesNotMatch(
    phase7dTexts,
    /from\s+["'](?:openai|@openai|octokit|@octokit|github|@actions\/github)["']/i,
    "Phase 7D must not import provider/OpenAI/GitHub clients",
  );
  assert.doesNotMatch(
    phase7dTexts,
    /child_process|spawn\s*\(|exec\s*\(/,
    "Phase 7D must not add Codex execution or shell process code",
  );
  assert.doesNotMatch(
    phase7dTexts,
    /createEvidenceRecord\s*\(|recordProof\s*\(|appendWorkEvent\s*\(|createPullRequest\s*\(|mergePullRequest\s*\(|publish[A-Z]\w*\s*\(|deploy[A-Z]\w*\s*\(|retryReplay\s*\(/i,
    "Phase 7D must not add proof/evidence/GitHub/publish/deploy mutation helpers",
  );
}

function assertPriorPhaseBoundaries() {
  assert(
    !contractDocText.includes("No status means executed"),
    `${contractDoc} must not contain unsafe Launch Card status wording`,
  );
  assertContainsAll(
    phase7aSmokeText,
    [
      '!docText.includes("No status means executed")',
      "No status may mean",
      "every status can only describe review/preparation state.",
    ],
    { label: phase7aSmokeFile },
  );

  assertContainsAll(
    handoffRouteText,
    ["export async function GET", "runtime = \"nodejs\"", "dynamic = \"force-dynamic\""],
    { label: handoffRouteFile },
  );
  assertContainsAll(
    launchCardRouteText,
    ["export async function GET", "runtime = \"nodejs\"", "dynamic = \"force-dynamic\""],
    { label: launchCardRouteFile },
  );
  for (const [file, text] of [
    [handoffRouteFile, handoffRouteText],
    [launchCardRouteFile, launchCardRouteText],
  ]) {
    assert.doesNotMatch(
      text,
      /export\s+(?:async\s+)?function\s+(?:POST|PUT|PATCH|DELETE)\b/,
      `${file} must remain GET-only`,
    );
  }

  assertContainsAll(
    phase7bSmokeText,
    ["route_exports_get_only_checked", "Codex Launch Card", "buildCodexLaunchCard"],
    { label: phase7bSmokeFile },
  );
  assertContainsAll(
    phase7cSmokeText,
    ["no_action_controls_checked", "phase7f_local_copy_controls_checked"],
    { label: phase7cSmokeFile },
  );
}

function assertChangedFileBoundary() {
  return assertChangedFilesWithin({
    allowedChangedFiles,
    label: "Phase 7D ChatGPT App/MCP Handoff Capsule preview tool",
  });
}
