#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertNoRuntimeImports,
  assertPackageScript,
  collectUntrackedFiles,
  loadTextByFile,
} from "./smoke-boundary-common.mjs";

const contractDoc = "docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md";
const handoffRouteFile = "app/api/augnes/read/handoff-capsule/route.ts";
const launchCardRouteFile = "app/api/augnes/read/codex-launch-card/route.ts";
const sourceFile = "lib/handoff/handoff-capsule-source.ts";
const phase7aSmokeFile = "scripts/smoke-handoff-capsule-v0-1.mjs";
const routeSmokeFile = "scripts/smoke-handoff-capsule-route-v0-1.mjs";
const packageJsonFile = "package.json";
const indexDoc = "docs/00_INDEX_LATEST.md";

const requiredFiles = [
  contractDoc,
  handoffRouteFile,
  launchCardRouteFile,
  sourceFile,
  phase7aSmokeFile,
  routeSmokeFile,
  packageJsonFile,
  indexDoc,
];

const priorSmokeAllowlistCompatibilityFiles = [
  "scripts/smoke-augnes-delta-contract-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-route-v0-1.mjs",
  "scripts/smoke-current-working-perspective-v0-1.mjs",
  "scripts/smoke-current-working-perspective-route-v0-1.mjs",
  "scripts/smoke-guide-brief-v0-1.mjs",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
  "scripts/smoke-web-guide-panel-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-perspective-human-timeline-v0-1.mjs",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
  "scripts/smoke-codex-guidebrief-handoff-v0-1.mjs",
];

const followOnHandoffCapsuleWebPreviewFiles = [
  "components/handoff/handoff-capsule-preview-panel.tsx",
  "components/handoff/codex-launch-card-preview-panel.tsx",
  "components/handoff/handoff-preview-boundary-card.tsx",
  "lib/handoff/read-handoff-capsule-for-web.ts",
  "components/workplane/agent-workplane.tsx",
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
];

const followOnHandoffCapsuleAppToolFiles = [
  "apps/augnes_apps/src/server.ts",
  "apps/augnes_apps/src/lib/state-runtime-types.ts",
  "apps/augnes_apps/src/adapters/state-runtime-http.ts",
  "apps/augnes_apps/scripts/invariants.ts",
  "apps/augnes_apps/scripts/smoke.ts",
  "apps/augnes_apps/scripts/mock-state-runtime.ts",
  "scripts/smoke-chatgpt-app-handoff-capsule-tool-v0-1.mjs",
  "scripts/smoke-chatgpt-app-autonomy-contract-tool-v0-1.mjs",
  "scripts/smoke-chatgpt-app-guide-brief-tool-v0-1.mjs",
  "docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md",
];

const followOnHandoffCapsuleCodexSkillFiles = [
  "docs/CODEX_HANDOFF_CAPSULE_CONSUMPTION_V0_1.md",
  "plugins/augnes-operator/skills/augnes-handoff-capsule/SKILL.md",
  "scripts/smoke-codex-handoff-capsule-v0-1.mjs",
  "docs/CODEX_AUGNES_OPERATOR_PLUGIN_V0_2.md",
  "scripts/smoke-augnes-operator-plugin-v2.mjs",
  "scripts/smoke-augnes-capsule-handoff-skill.mjs",
  "scripts/smoke-chatgpt-app-handoff-capsule-tool-v0-1.mjs",
];

const followOnHandoffCapsuleCopyExportFiles = [
  "lib/handoff/handoff-capsule-copy-export.ts",
  "components/handoff/handoff-copy-export-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "lib/handoff/read-handoff-capsule-for-web.ts",
  "components/handoff/handoff-preview-boundary-card.tsx",
  "components/handoff/codex-launch-card-preview-panel.tsx",
  "components/handoff/handoff-capsule-preview-panel.tsx",
  "scripts/smoke-handoff-capsule-copy-export-v0-1.mjs",
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
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
  ...followOnHandoffCapsuleWebPreviewFiles,
  ...followOnHandoffCapsuleAppToolFiles,
  ...followOnHandoffCapsuleCodexSkillFiles,
  ...followOnHandoffCapsuleCopyExportFiles,
  ...phase8eAutonomyContractCodexSkillFiles,
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

const forbiddenChangedFilePatterns = [
  /^app\/(?!api\/augnes\/read\/(?:handoff-capsule|codex-launch-card|autonomy-contract)\/route\.ts$)/,
  /^components\/(?!autonomy\/|workplane\/agent-workplane\.tsx$)/,
  /^apps\/augnes_apps\//,
  /^migrations\//,
  /^db\//,
  /^lib\/db(\/|\.|$)/,
  /^plugins\//,
  /(^|\/)(provider|providers|openai|github|octokit)(\/|$)/i,
  /(^|\/)(proof|evidence)(\/|$)/i,
  /(^|\/)(scheduler|autonomy-runner|autonomy_runner)(\/|$)/i,
  /(^|\/)(handoff-execution|handoff_execution)(\/|$)/i,
];

const textByFile = loadTextByFile(requiredFiles);
const contractText = textByFile.get(contractDoc);
const handoffRouteText = textByFile.get(handoffRouteFile);
const launchCardRouteText = textByFile.get(launchCardRouteFile);
const sourceText = textByFile.get(sourceFile);
const phase7aSmokeText = textByFile.get(phase7aSmokeFile);
const packageJsonText = textByFile.get(packageJsonFile);
const indexText = textByFile.get(indexDoc);

assertPackageJsonScript();
assertDocsAndIndexPointers();
assertRouteContract({
  file: handoffRouteFile,
  text: handoffRouteText,
  validator: "validateHandoffCapsuleReadRequest(request)",
  reader: "readHandoffCapsuleForRoute",
  marker: "HANDOFF_CAPSULE_LOCAL_READONLY_VALUE",
});
assertRouteContract({
  file: launchCardRouteFile,
  text: launchCardRouteText,
  validator: "validateCodexLaunchCardReadRequest(request)",
  reader: "readCodexLaunchCardForRoute",
  marker: "CODEX_LAUNCH_CARD_LOCAL_READONLY_VALUE",
});
assertSourceHelperContract();
assertNoForbiddenRuntimeCode();
assertPhase7aRegressionGuard();
const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "handoff-capsule-route-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      docs_route_boundary_checked: true,
      index_pointer_checked: true,
      route_exports_get_only_checked: true,
      route_runtime_nodejs_checked: true,
      route_dynamic_force_dynamic_checked: true,
      route_next_response_checked: true,
      route_headers_checked: true,
      source_helper_exports_checked: true,
      source_helper_readonly_access_guard_checked: true,
      source_helper_scope_marker_target_validation_checked: true,
      source_helper_composition_checked: true,
      no_ui_files_changed_checked: true,
      no_mcp_app_tool_files_changed_checked: true,
      no_db_migration_schema_changed_checked: true,
      no_provider_openai_github_codex_calls_checked: true,
      no_proof_evidence_write_code_checked: true,
      no_scheduler_autonomy_runner_checked: true,
      no_handoff_execution_checked: true,
      phase7a_launch_card_status_regression_checked: true,
      prior_smoke_allowlist_compatibility_files_allowed:
        priorSmokeAllowlistCompatibilityFiles,
      changed_files_boundary_checked: changedFilesBoundary.checked,
      changed_files_boundary_skipped: changedFilesBoundary.skipped,
      changed_files_boundary_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      changed_files_base_ref: changedFilesBoundary.base_ref,
      direct_route_invocation_skipped: true,
      direct_route_invocation_skip_reason:
        "Static smoke avoids importing Next route handlers from plain Node without the Next runtime and TS path loader.",
      smoke_type:
        "static-handoff-capsule-codex-launch-card-read-route-boundary-only",
    },
    null,
    2,
  ),
);
console.log("PASS smoke:handoff-capsule-route-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:handoff-capsule-route-v0-1",
    expectedCommand: "node scripts/smoke-handoff-capsule-route-v0-1.mjs",
  });
}

function assertDocsAndIndexPointers() {
  assertContainsAll(contractText, [
    "Phase 7B GET-Only Read Routes",
    "GET /api/augnes/read/handoff-capsule?scope=project:augnes&target=codex_handoff",
    "x-augnes-local-readonly: handoff-capsule-v0.1",
    "GET /api/augnes/read/codex-launch-card?scope=project:augnes",
    "x-augnes-local-readonly: codex-launch-card-v0.1",
    "cache-control: no-store",
    "exports `GET` only",
    "fails closed on missing scope, invalid scope, missing marker, invalid marker, and invalid target",
    "Source composition is owned by `lib/handoff/handoff-capsule-source.ts`",
    "Phase 7C Web preview UI, Phase 7D ChatGPT App/MCP read-only preview tools,",
    "Phase 7D ChatGPT App/MCP read-only preview tools, Phase 7E Codex skill",
    "Phase 7F local copy/export preview are documented below.",
    "no DB schema/migration, DB write, provider/OpenAI call, GitHub actuation, Codex execution, proof/evidence write, memory mutation, durable Perspective state apply, handoff send, branch/PR creation, scheduler/autonomy runner, product-write, or external side effects",
  ], { label: contractDoc });

  assertContainsAll(indexText, [
    "Phase 7B Handoff Capsule / Codex Launch Card read route v0.1",
    "GET /api/augnes/read/handoff-capsule?scope=project:augnes&target=codex_handoff",
    "GET /api/augnes/read/codex-launch-card?scope=project:augnes",
    "x-augnes-local-readonly: handoff-capsule-v0.1",
    "x-augnes-local-readonly: codex-launch-card-v0.1",
    "cache-control: no-store",
    "GET-only",
    "read-only",
    "no UI/MCP/App/DB/provider/GitHub/Codex execution/proof/evidence/memory/autonomy/handoff-send/external side effects",
  ], { label: indexDoc });
}

function assertRouteContract({ file, text, validator, reader, marker }) {
  assert(
    /export\s+const\s+runtime\s*=\s*"nodejs"/.test(text),
    `${file} must use nodejs runtime`,
  );
  assert(
    /export\s+const\s+dynamic\s*=\s*"force-dynamic"/.test(text),
    `${file} must be force-dynamic`,
  );
  assert(
    /export\s+async\s+function\s+GET\s*\(\s*request:\s*Request\s*\)/.test(
      text,
    ),
    `${file} must export async GET(request: Request)`,
  );

  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
    assert(
      !new RegExp(`export\\s+(?:async\\s+)?function\\s+${method}\\b`).test(
        text,
      ),
      `${file} must not export ${method}`,
    );
  }

  assertContainsAll(text, [
    "NextResponse.json",
    validator,
    reader,
    "READONLY_RESPONSE_HEADERS",
    "HANDOFF_CAPSULE_LOCAL_READONLY_HEADER",
    marker,
    "HANDOFF_CAPSULE_CACHE_CONTROL",
    "status: 200",
    "status: validation.status",
    "code: \"unavailable\"",
  ], { label: file });
}

function assertSourceHelperContract() {
  assertContainsAll(sourceText, [
    'HANDOFF_CAPSULE_ROUTE_SCOPE = GUIDE_BRIEF_ROUTE_SCOPE',
    'HANDOFF_CAPSULE_LOCAL_READONLY_HEADER =\n  "x-augnes-local-readonly"',
    'HANDOFF_CAPSULE_LOCAL_READONLY_VALUE =\n  "handoff-capsule-v0.1"',
    'CODEX_LAUNCH_CARD_LOCAL_READONLY_VALUE =\n  "codex-launch-card-v0.1"',
    'HANDOFF_CAPSULE_ROUTE_FAMILY = "handoff_capsule"',
    'CODEX_LAUNCH_CARD_ROUTE_FAMILY = "codex_launch_card"',
    'HANDOFF_CAPSULE_ROUTE_ID =\n  "augnes.read.handoff_capsule.v0.1"',
    'CODEX_LAUNCH_CARD_ROUTE_ID =\n  "augnes.read.codex_launch_card.v0.1"',
    'HANDOFF_CAPSULE_CACHE_CONTROL = "no-store"',
    "validateHandoffCapsuleReadRequest",
    "validateCodexLaunchCardReadRequest",
    "buildHandoffCapsuleReadError",
    "buildCodexLaunchCardReadError",
    "readHandoffCapsuleForRoute",
    "readCodexLaunchCardForRoute",
    "buildHandoffCapsuleRouteInput",
    "buildCodexLaunchCardRouteInput",
    "validateReadonlyApiLocalAccess",
    "validateReadonlyApiLocalDevAuthAdapter",
    "shouldUseReadonlyApiLocalDevAuthStrictMode",
    "missing_scope",
    "invalid_scope",
    "missing_marker",
    "invalid_marker",
    "invalid_target",
    "target !== SUPPORTED_PHASE_7B_TARGET",
    "readGuideBriefForRoute({ scope })",
    "buildHandoffCapsule(",
    "buildCodexLaunchCard(",
    "const sourceCapsule = buildHandoffCapsule",
    "preview JSON only",
    "no Codex execution authority",
    "no handoff send authority",
    "no external side effect authority",
    "Route-composed operator/sample defaults do not claim live task assignment or execution state.",
    "Launch Card status never means executed.",
  ], { label: sourceFile });
}

function assertNoForbiddenRuntimeCode() {
  for (const [file, text] of [
    [sourceFile, sourceText],
    [handoffRouteFile, handoffRouteText],
    [launchCardRouteFile, launchCardRouteText],
  ]) {
    assertNoRuntimeImports({
      file,
      text,
      forbiddenImports: [
        "components/",
        "apps/augnes_apps/",
        "lib/db",
        "migrations/",
        "provider/",
        "providers/",
        "proof/",
        "evidence/",
        "child_process",
        "fs",
        "openai",
        "octokit",
        "@octokit",
        "@openai",
      ],
    });
  }

  const sourceOnlyForbiddenPatterns = [
    /\bfetch\s*\(/,
    /\bspawn\s*\(/,
    /\bexec\s*\(/,
    /\bexecFile\s*\(/,
    /\bwriteFile(?:Sync)?\s*\(/,
    /\bappendWorkEvent\b/,
    /\bcreateEvidenceRecord\b/,
    /\brecordProof\b/,
    /\bcommitStateUpdate\b/,
    /\bcreatePullRequest\b/,
    /\bmergePullRequest\b/,
    /\bsendHandoff\b/,
    /\bexecuteCodex\b/,
    /\blaunchCodex\b/,
    /\bsetInterval\s*\(/,
    /\bsetTimeout\s*\(/,
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+[A-Za-z_][\w.]*\s+SET\b/i,
    /\bDELETE\s+FROM\b/i,
    /\bCREATE\s+TABLE\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bDROP\s+TABLE\b/i,
  ];

  for (const pattern of sourceOnlyForbiddenPatterns) {
    assert(
      !pattern.test(sourceText),
      `${sourceFile} must not include forbidden pattern ${pattern}`,
    );
  }

  assert(
    !sourceText.includes("from \"@/app/") && !sourceText.includes("from '@/app/"),
    `${sourceFile} must not import app routes`,
  );
}

function assertPhase7aRegressionGuard() {
  assert(
    !contractText.includes("No status means executed"),
    `${contractDoc} must not imply status means executed`,
  );
  assertContainsAll(contractText, [
    "No status may mean \"executed\"; every status can only describe review/preparation state.",
  ], { label: contractDoc });
  assertContainsAll(phase7aSmokeText, [
    "!docText.includes(\"No status means executed\")",
    "No status may mean \\\"executed\\\"; every status can only describe review/preparation state.",
  ], { label: phase7aSmokeFile });
}

function assertChangedFileBoundary() {
  const result = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "Handoff Capsule / Codex Launch Card Phase 7B route boundary smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for Handoff Capsule route smoke: ${file}`,
      );
    }
  }

  const files = [...new Set([...result.files, ...untrackedFiles])].sort();

  if (!contentOnly) {
    for (const file of files) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected changed file for Handoff Capsule route smoke: ${file}`,
      );
      assert(
          followOnHandoffCapsuleWebPreviewFiles.includes(file) ||
          followOnHandoffCapsuleAppToolFiles.includes(file) ||
          followOnHandoffCapsuleCodexSkillFiles.includes(file) ||
          followOnHandoffCapsuleCopyExportFiles.includes(file) ||
          phase8eAutonomyContractCodexSkillFiles.includes(file) ||
          phase8fAutonomyContractCopyExportFiles.includes(file) ||
          phase9aAutonomyRunnerPreflightFiles.includes(file) ||
          file ===
            "app/api/augnes/read/autonomy-runner-preflight/route.ts" ||
          !forbiddenChangedFilePatterns.some((pattern) => pattern.test(file)),
        `Forbidden changed path for Handoff Capsule route smoke: ${file}`,
      );
    }
  }

  return {
    ...result,
    files,
    untracked_checked: !contentOnly,
    untracked_skipped: contentOnly,
    untracked_skip_reason: contentOnly
      ? "untracked-file boundary skipped because AUGNES_BOUNDARY_SMOKE_MODE=content-only"
      : null,
  };
}
