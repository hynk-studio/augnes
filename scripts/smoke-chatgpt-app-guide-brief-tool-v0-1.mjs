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
const guideBriefDoc = "docs/GUIDEBRIEF_CONTRACT_V0_1.md";
const chatgptBoundaryDoc =
  "docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-chatgpt-app-guide-brief-tool-v0-1.mjs";

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
];

const requiredFiles = [
  serverFile,
  stateRuntimeTypesFile,
  httpAdapterFile,
  appInvariantsFile,
  appSmokeFile,
  appMockRuntimeFile,
  guideBriefDoc,
  chatgptBoundaryDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
];

const allowedChangedFiles = new Set([
  serverFile,
  stateRuntimeTypesFile,
  httpAdapterFile,
  appInvariantsFile,
  appSmokeFile,
  appMockRuntimeFile,
  guideBriefDoc,
  chatgptBoundaryDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
  ...priorSmokeAllowlistCompatibilityFiles,
]);

const textByFile = loadTextByFile(requiredFiles);
const serverText = textByFile.get(serverFile);
const stateRuntimeTypesText = textByFile.get(stateRuntimeTypesFile);
const httpAdapterText = textByFile.get(httpAdapterFile);
const appInvariantsText = textByFile.get(appInvariantsFile);
const appSmokeText = textByFile.get(appSmokeFile);
const appMockRuntimeText = textByFile.get(appMockRuntimeFile);
const guideBriefDocText = textByFile.get(guideBriefDoc);
const chatgptBoundaryDocText = textByFile.get(chatgptBoundaryDoc);
const indexText = textByFile.get(indexDoc);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageJsonScript();
assertServerTool();
assertRuntimeTypes();
assertHttpAdapter();
assertAppCompatibility();
assertDocsAndIndex();
assertNoForbiddenGuideBriefActuation();
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

const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "chatgpt-app-guide-brief-tool-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      tool_registration_checked: true,
      read_only_annotations_checked: true,
      guidebrief_structured_content_checked: true,
      tool_narrative_boundary_checked: true,
      route_adapter_checked: true,
      local_readonly_marker_checked: true,
      guidebrief_schema_exports_checked: true,
      app_compatibility_smoke_updates_checked: true,
      docs_index_checked: true,
      no_app_api_route_files_changed_checked: true,
      no_web_ui_files_changed_checked: true,
      no_provider_openai_github_calls_checked: true,
      no_codex_execution_code_checked: true,
      no_proof_evidence_write_code_checked: true,
      no_db_schema_migration_changed_checked: true,
      no_scheduler_autonomy_runner_checked: true,
      no_handoff_execution_added_checked: true,
      no_branch_pr_merge_publish_deploy_added_checked: true,
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      prior_smoke_allowlist_compatibility_files_allowed:
        priorSmokeAllowlistCompatibilityFiles,
      smoke_type:
        "static-chatgpt-app-guidebrief-tool-source-doc-package-boundary-only",
    },
    null,
    2,
  ),
);
console.log("PASS smoke:chatgpt-app-guide-brief-tool-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:chatgpt-app-guide-brief-tool-v0-1",
    expectedCommand:
      "node scripts/smoke-chatgpt-app-guide-brief-tool-v0-1.mjs",
  });
}

function extractGuideBriefToolBlock() {
  const match = /registerAppTool\(\s*server,\s*"augnes_get_guide_brief"/.exec(
    serverText,
  );
  assert.ok(
    match,
    `${serverFile} must register augnes_get_guide_brief through registerAppTool`,
  );
  const start = match.index;
  const next = serverText.indexOf("registerAppTool(", start + 1);
  return serverText.slice(start, next === -1 ? undefined : next);
}

function extractGuideBriefAdapterBlock() {
  const start = httpAdapterText.indexOf("async getGuideBrief");
  assert.notEqual(start, -1, `${httpAdapterFile} must implement getGuideBrief`);
  const next = httpAdapterText.indexOf("\n  async ", start + 1);
  return httpAdapterText.slice(start, next === -1 ? undefined : next);
}

function extractBuildGuideBriefStructuredContentBlock() {
  const start = serverText.indexOf("function buildGuideBriefStructuredContent");
  assert.notEqual(
    start,
    -1,
    `${serverFile} must include a boundary-aware GuideBrief structured content helper`,
  );
  const next = serverText.indexOf("\nfunction ", start + 1);
  return serverText.slice(start, next === -1 ? undefined : next);
}

function assertServerTool() {
  assertContainsAll(
    serverText,
    [
      '"augnes_get_guide_brief"',
      "GuideBriefToolInputSchema",
      "describeGuideBrief",
      "buildGuideBriefSummary",
      "buildGuideBriefStructuredContent",
      "restoreGuideBriefAuthorityBoundary",
      "restoreGuideBriefReadBoundary",
      "summarizeGuideBriefSourceRefs",
      "GUIDE_BRIEF_AUTHORITY_BOUNDARY_FALSE_FIELDS",
      "GUIDE_BRIEF_READ_BOUNDARY_FALSE_FIELDS",
      "can_call_openai_or_provider",
      "github_openai_provider_calls",
    ],
    { label: serverFile },
  );

  const toolBlock = extractGuideBriefToolBlock();
  assertContainsAll(
    toolBlock,
    [
      "registerAppTool",
      "Read-only GuideBrief tool",
      "Observed/Inferred/Suggested/Needs user judgment separated",
      "suggestions as not actions",
      "handoff candidates preview-only",
      "does not decide needs_user_judgment items",
      "does not execute Codex",
      "does not call GitHub/OpenAI/provider services",
      "does not create proof/evidence records",
      "does not mutate state, memory, or DB records",
      "inputSchema: GuideBriefToolInputSchema.shape",
      "annotations: localRouteReadAnnotations",
      "modelOnlyToolMeta",
      "stateRuntimeAdapter.getGuideBrief(resolvedScope)",
      "buildGuideBriefStructuredContent",
      "guideBrief",
      "guideBriefSummary",
      "content: narrative(describeGuideBrief(guideBrief))",
    ],
    { label: `${serverFile} augnes_get_guide_brief block` },
  );

  assert(
    !/const\s+structuredContent\s*=\s*sanitizePayload\s*\(\s*\{/.test(
      toolBlock,
    ),
    "augnes_get_guide_brief must not use generic sanitizePayload as the final structuredContent operation",
  );
  assert(
    !toolBlock.includes("bridgeWriteAnnotations"),
    "augnes_get_guide_brief must not use bridgeWriteAnnotations",
  );
  assert(
    !toolBlock.includes("widgetToolMeta"),
    "Phase 6D must not add a widget-backed GuideBrief panel",
  );

  assertContainsAll(
    serverText,
    [
      "Handoff candidates are preview-only.",
      "Suggestions are not actions.",
      "Needs user judgment items are not decided by the guide.",
      "Read-only tool: no writes, no Codex execution, no GitHub/OpenAI/provider calls, no handoff send.",
    ],
    { label: serverFile },
  );

  const structuredContentBlock = extractBuildGuideBriefStructuredContentBlock();
  assertContainsAll(
    structuredContentBlock,
    [
      "sanitizePayload({",
      "observed_count",
      "inferred_count",
      "suggested_count",
      "needs_user_judgment_count",
      "staleness_warning_count",
      "handoff_candidate_count",
      "authority_boundary",
      "surface_rendering_notes",
      "read_boundary",
      "route_boundary",
      "source_refs",
      "structuredContent.authority_boundary = restoreGuideBriefAuthorityBoundary",
      "structuredContent.read_boundary = restoreGuideBriefReadBoundary",
      "structuredContent.route_boundary = restoreGuideBriefReadBoundary",
      "for (const guideBriefKey of [\"guideBrief\", \"guide_brief\"] as const)",
      "authority_boundary: restoreGuideBriefAuthorityBoundary",
    ],
    { label: `${serverFile} buildGuideBriefStructuredContent block` },
  );

  assert(
    structuredContentBlock.indexOf("sanitizePayload({") <
      structuredContentBlock.indexOf(
        "structuredContent.authority_boundary = restoreGuideBriefAuthorityBoundary",
      ),
    "GuideBrief structured content helper must rehydrate authority boundary after generic sanitization",
  );
  assert(
    structuredContentBlock.indexOf("sanitizePayload({") <
      structuredContentBlock.indexOf(
        "structuredContent.read_boundary = restoreGuideBriefReadBoundary",
      ),
    "GuideBrief structured content helper must rehydrate read boundary after generic sanitization",
  );
}

function assertRuntimeTypes() {
  assertContainsAll(
    stateRuntimeTypesText,
    [
      "export const GuideBriefToolInputSchema",
      "scope: z.string().min(1).optional()",
      "compact: z.boolean().optional()",
      "export const GuideBriefResultSchema",
      'runtime: z.literal("augnes")',
      "guide_version: z.string()",
      "observed: z.array(z.unknown())",
      "inferred: z.array(z.unknown())",
      "suggested: z.array(z.unknown())",
      "needs_user_judgment: z.array(z.unknown())",
      "authority_boundary: GuideBriefAuthorityBoundarySchema",
      "can_execute_codex: z.literal(false)",
      "can_call_github: z.literal(false)",
      "can_call_openai_or_provider: z.literal(false)",
      "can_send_handoff: z.literal(false)",
      "export type GuideBriefResult",
      "getGuideBrief(scope: StateRuntimeScope): Promise<GuideBriefResult>",
    ],
    { label: stateRuntimeTypesFile },
  );
}

function assertHttpAdapter() {
  assertContainsAll(
    httpAdapterText,
    [
      "GuideBriefResultSchema",
      "type GuideBriefResult",
      'GUIDE_BRIEF_LOCAL_READ_HEADER = "x-augnes-local-readonly"',
      'GUIDE_BRIEF_LOCAL_READ_MARKER = "guide-brief-v0.1"',
      'guideBrief: { method: "GET", path: "/api/augnes/read/guide-brief" }',
    ],
    { label: httpAdapterFile },
  );

  const adapterBlock = extractGuideBriefAdapterBlock();
  assertContainsAll(
    adapterBlock,
    [
      "async getGuideBrief(scope: StateRuntimeScope): Promise<GuideBriefResult>",
      "endpointContract.guideBrief.method",
      "endpointContract.guideBrief.path",
      "GuideBriefResultSchema",
      '"guide brief"',
      "query: { scope: parseScope(scope) }",
      "[GUIDE_BRIEF_LOCAL_READ_HEADER]: GUIDE_BRIEF_LOCAL_READ_MARKER",
    ],
    { label: `${httpAdapterFile} getGuideBrief block` },
  );

  assert(
    !/method:\s*"POST"|method:\s*"PUT"|method:\s*"PATCH"|method:\s*"DELETE"/.test(
      adapterBlock,
    ),
    "getGuideBrief adapter block must use GET only",
  );
}

function assertAppCompatibility() {
  assertContainsAll(
    appInvariantsText,
    [
      '"augnes_get_guide_brief"',
      "LOCAL_ROUTE_READ_ANNOTATIONS",
      "augnes_get_project_constellation_preview",
      "augnes_get_guide_brief",
    ],
    { label: appInvariantsFile },
  );

  assertContainsAll(
    appSmokeText,
    [
      "augnes_get_guide_brief: {}",
      "guideBrief: result.structuredContent?.guideBrief",
      "guideBriefSummary: result.structuredContent?.guideBriefSummary",
      "Suggestions are not actions",
      "Needs user judgment items are not decided by the guide",
      "Handoff candidates are preview-only",
    ],
    { label: appSmokeFile },
  );

  assertContainsAll(
    appMockRuntimeText,
    [
      "async getGuideBrief(scope: StateRuntimeScope): Promise<GuideBriefResult>",
      'guide_version: "guide_brief.v0.1"',
      "GuideBrief is read-only.",
      "Suggested items are candidate next actions only.",
      "Needs user judgment items must not be decided by the guide.",
      "Handoff candidates are preview-only.",
      "can_execute_codex: false",
      "can_call_github: false",
      "can_call_openai_or_provider: false",
      "can_send_handoff: false",
    ],
    { label: appMockRuntimeFile },
  );
}

function assertDocsAndIndex() {
  assertContainsAll(
    guideBriefDocText,
    [
      "Phase 6D ChatGPT App/MCP Read-Only Guide Tool",
      "augnes_get_guide_brief",
      "consumes the Phase 6B GET-only local read-only route",
      "Observed/Inferred/Suggested/Needs user judgment separation",
      "no MCP/App write tool",
      "no Codex execution",
      "no GitHub/OpenAI/provider calls",
      "no proof/evidence writes",
      "no state/memory/DB mutation",
      "no branch/PR creation",
      "no handoff execution",
      "Phase 6E scope is Codex GuideBrief alignment docs, skill guidance, smoke",
      "Phase 7 Handoff Capsule / Codex Launch Card remains deferred",
    ],
    { label: guideBriefDoc },
  );

  assertContainsAll(
    chatgptBoundaryDocText,
    [
      "augnes_get_guide_brief",
      "read-only and local-route backed",
      "does not expose a write surface",
      "suggestions are not actions",
      "needs_user_judgment is not decided by the tool",
    ],
    { label: chatgptBoundaryDoc },
  );

  assertContainsAll(
    indexText,
    [
      "Phase 6D",
      "augnes_get_guide_brief",
      "no MCP/App write tool",
      "no external action authority",
      "no Codex execution",
    ],
    { label: indexDoc },
  );
}

function assertNoForbiddenGuideBriefActuation() {
  const toolBlock = extractGuideBriefToolBlock();
  const adapterBlock = extractGuideBriefAdapterBlock();
  const guideBriefCode = `${toolBlock}\n${adapterBlock}`;

  const forbiddenPatterns = [
    /bridgeWriteAnnotations/,
    /createEvidenceRecord|recordProof|appendWorkEvent/,
    /createPullRequest|mergePullRequest|publish|deploy|retry|replay/,
    /spawn\s*\(|exec\s*\(|executeCodex|launchCodex/i,
    /@octokit|Octokit|createOctokit/i,
    /from\s+["']openai["']|new\s+OpenAI/i,
    /method:\s*["']POST["']|method:\s*["']PUT["']|method:\s*["']PATCH["']|method:\s*["']DELETE["']/,
  ];

  for (const pattern of forbiddenPatterns) {
    assert(
      !pattern.test(guideBriefCode),
      `GuideBrief tool/adapter block must not match forbidden pattern ${pattern}`,
    );
  }
}

function assertChangedFileBoundary() {
  const workingTree = collectGitDiffFiles(["diff", "--name-only"]);
  const cached = collectGitDiffFiles(["diff", "--cached", "--name-only"]);
  const untrackedFiles = collectUntrackedFiles();
  const baseRange = getBaseRangeChangedFiles();
  const files = uniqueSorted([
    ...workingTree.files,
    ...cached.files,
    ...untrackedFiles,
    ...baseRange.files,
  ]);

  for (const file of files) {
    assert(
      allowedChangedFiles.has(file),
      `Unexpected changed file for Phase 6D GuideBrief App/MCP tool: ${file}`,
    );
    assert(!/^app\/api\//.test(file), `Phase 6D must not change API route files: ${file}`);
    assert(
      !/^components\//.test(file) &&
        !["app/page.tsx", "app/perspective/page.tsx", "app/workbench/page.tsx"].includes(file),
      `Phase 6D must not change Web UI files: ${file}`,
    );
    assert(!/^migrations\//.test(file), `Phase 6D must not change migrations: ${file}`);
    assert(!/^provider\//i.test(file), `Phase 6D must not change provider runtime files: ${file}`);
    assert(!/^proof\//i.test(file), `Phase 6D must not change proof/evidence write files: ${file}`);
    assert(!/^autonomy\//i.test(file), `Phase 6D must not change autonomy runner files: ${file}`);
    assert(file !== "lib/db.ts", "Phase 6D must not change lib/db.ts");
  }

  const checked =
    workingTree.checked || cached.checked || baseRange.checked;

  return {
    checked,
    skipped: !checked,
    skip_reason: checked ? null : "changed-file boundary could not be checked",
    files,
    working_tree_files: workingTree.files,
    cached_files: cached.files,
    untracked_files: untrackedFiles,
    base_ref: baseRange.base_ref,
    base_range_files: baseRange.files,
  };
}
