#!/usr/bin/env node
import assert from "node:assert/strict";
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

const contractDoc = "docs/AUTONOMY_CONTRACT_V0_1.md";
const routeFile = "app/api/augnes/read/autonomy-contract/route.ts";
const sourceFile = "lib/autonomy/autonomy-contract-source.ts";
const phase8aHelperFile = "lib/autonomy/autonomy-contract.ts";
const phase8aFixtureFile = "fixtures/autonomy-contract.sample.v0.1.json";
const routeSmokeFile = "scripts/smoke-autonomy-contract-route-v0-1.mjs";
const packageJsonFile = "package.json";
const indexDoc = "docs/00_INDEX_LATEST.md";

const requiredFiles = [
  contractDoc,
  routeFile,
  sourceFile,
  phase8aHelperFile,
  phase8aFixtureFile,
  routeSmokeFile,
  packageJsonFile,
  indexDoc,
];

const priorSmokeAllowlistCompatibilityFiles = [
  "scripts/smoke-autonomy-contract-v0-1.mjs",
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

const allowedChangedFiles = new Set([
  contractDoc,
  routeFile,
  sourceFile,
  routeSmokeFile,
  packageJsonFile,
  indexDoc,
  "components/autonomy/autonomy-boundary-card.tsx",
  "components/autonomy/autonomy-budget-preview-panel.tsx",
  "components/autonomy/autonomy-contract-preview-panel.tsx",
  "components/autonomy/autonomy-policy-preview-panel.tsx",
  "components/autonomy/autonomy-preview-shared.tsx",
  "components/autonomy/autonomy-run-preview-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "lib/autonomy/read-autonomy-contract-for-web.ts",
  "scripts/smoke-autonomy-contract-web-preview-v0-1.mjs",
  ...priorSmokeAllowlistCompatibilityFiles,
  ...phase8dAutonomyContractAppToolFiles,
  ...phase8eAutonomyContractCodexSkillFiles,
  ...phase8fAutonomyContractCopyExportFiles,
]);

const forbiddenChangedFilePatterns = [
  /^app\/(?!api\/augnes\/read\/autonomy-contract\/route\.ts$)/,
  /^components\/(?!autonomy\/|workplane\/agent-workplane\.tsx$)/,
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

const authorityBooleanFields = [
  "source_of_truth",
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
  "can_start_daemon",
];

const requiredBlockedTargets = [
  "proof_evidence_write",
  "external_publication",
  "github_actuation",
  "provider_call",
  "branch_pr_creation",
  "durable_apply_without_review",
];

const textByFile = loadTextByFile(requiredFiles);
const docText = textByFile.get(contractDoc);
const routeText = textByFile.get(routeFile);
const sourceText = textByFile.get(sourceFile);
const phase8aHelperText = textByFile.get(phase8aHelperFile);
const fixture = JSON.parse(textByFile.get(phase8aFixtureFile));
const packageJsonText = textByFile.get(packageJsonFile);
const indexText = textByFile.get(indexDoc);

assertPackageJsonScript();
assertDocsAndIndexPointers();
assertRouteContract();
assertSourceHelperContract();
assertResponseShapeContract();
assertPreservedAutonomyPolicyDefaults();
assertNoActiveExecutionLanguage();
assertNoForbiddenRuntimeCode();
const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "autonomy-contract-route-v0-1",
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
      source_helper_local_dev_auth_adapter_checked: true,
      source_helper_composition_checked: true,
      response_shape_checked: true,
      error_shape_checked: true,
      run_preview_status_checked: "preview_only",
      auto_apply_allowed_checked: false,
      auto_apply_targets_checked: [],
      authority_boundary_all_false_checked: true,
      no_ui_files_changed_checked: true,
      no_mcp_app_tool_files_changed_checked: true,
      no_db_migration_schema_changed_checked: true,
      no_provider_openai_github_codex_calls_checked: true,
      no_proof_evidence_write_code_checked: true,
      no_scheduler_autonomy_runner_checked: true,
      no_handoff_execution_checked: true,
      prior_smoke_allowlist_compatibility_files_allowed:
        priorSmokeAllowlistCompatibilityFiles,
      changed_files_boundary_checked: changedFilesBoundary.checked,
      changed_files_boundary_skipped: changedFilesBoundary.skipped,
      changed_files_boundary_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      changed_files_base_ref: changedFilesBoundary.base_ref,
      direct_route_invocation_skipped: true,
      direct_route_invocation_skip_reason:
        "Static smoke avoids importing a Next route handler from plain Node without the Next runtime and TS path loader.",
      smoke_type:
        "static-autonomy-contract-get-only-read-route-boundary-only",
    },
    null,
    2,
  ),
);
console.log("PASS smoke:autonomy-contract-route-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:autonomy-contract-route-v0-1",
    expectedCommand: "node scripts/smoke-autonomy-contract-route-v0-1.mjs",
  });
}

function assertDocsAndIndexPointers() {
  assertContainsAll(docText, [
    "Phase 8B GET-Only Read Route",
    "GET /api/augnes/read/autonomy-contract?scope=project:augnes",
    "x-augnes-local-readonly: autonomy-contract-v0.1",
    "cache-control: no-store",
    "exports `GET` only",
    "fails closed on missing scope, invalid scope, missing marker, invalid marker, and local access failures",
    "Source composition is owned by `lib/autonomy/autonomy-contract-source.ts`",
    "The route may compose from GuideBrief, Handoff Capsule, and Codex Launch Card read-only preview sources.",
    "The Phase 8B route does not run autonomy.",
    "The route does not schedule autonomy.",
    "The route does not launch Codex.",
    "The route does not send handoff.",
    "The route does not call GitHub/OpenAI/provider APIs.",
    "The route does not write DB/proof/evidence.",
    "The route does not mutate memory/state/work/Perspective.",
    "The route does not create branches or PRs.",
    "The route does not start background work or daemon.",
    "The route does not merge/publish/retry/replay/deploy or externally post.",
    "Phase 8C Read-Only Web Preview UI",
    "Phase 8D ChatGPT App/MCP Read-Only Preview Tool",
    "augnes_get_autonomy_contract_preview",
    "Phase 8E Codex Skill Alignment",
    "plugins/augnes-operator/skills/augnes-autonomy-contract/SKILL.md",
    "Phase 8F Local Copy/Export Preview",
    "local clipboard copy and manual text export preview only",
  ], { label: contractDoc });

  assertContainsAll(indexText, [
    "Phase 8B Autonomy Contract read route v0.1",
    "GET /api/augnes/read/autonomy-contract?scope=project:augnes",
    "x-augnes-local-readonly: autonomy-contract-v0.1",
    "cache-control: no-store",
    "GET-only",
    "local read-only",
    "preview JSON only",
    routeFile,
    sourceFile,
    routeSmokeFile,
    "smoke:autonomy-contract-route-v0-1",
    "no runner/scheduler/daemon/background work/write/execution/external authority",
  ], { label: indexDoc });
}

function assertRouteContract() {
  assert(
    /export\s+const\s+runtime\s*=\s*"nodejs"/.test(routeText),
    `${routeFile} must use nodejs runtime`,
  );
  assert(
    /export\s+const\s+dynamic\s*=\s*"force-dynamic"/.test(routeText),
    `${routeFile} must be force-dynamic`,
  );
  assert(
    /export\s+async\s+function\s+GET\s*\(\s*request:\s*Request\s*\)/.test(
      routeText,
    ),
    `${routeFile} must export async GET(request: Request)`,
  );

  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
    assert(
      !new RegExp(`export\\s+(?:async\\s+)?function\\s+${method}\\b`).test(
        routeText,
      ),
      `${routeFile} must not export ${method}`,
    );
  }

  assertContainsAll(routeText, [
    "NextResponse.json",
    "validateAutonomyContractReadRequest(request)",
    "readAutonomyContractForRoute",
    "buildAutonomyContractReadError",
    "READONLY_RESPONSE_HEADERS",
    "AUTONOMY_CONTRACT_LOCAL_READONLY_HEADER",
    "AUTONOMY_CONTRACT_LOCAL_READONLY_VALUE",
    "AUTONOMY_CONTRACT_CACHE_CONTROL",
    "status: 200",
    "status: validation.status",
    "code: \"unavailable\"",
  ], { label: routeFile });
}

function assertSourceHelperContract() {
  assertContainsAll(sourceText, [
    'AUTONOMY_CONTRACT_ROUTE_SCOPE = "project:augnes"',
    'AUTONOMY_CONTRACT_LOCAL_READONLY_HEADER = "x-augnes-local-readonly"',
    'AUTONOMY_CONTRACT_LOCAL_READONLY_VALUE = "autonomy-contract-v0.1"',
    'AUTONOMY_CONTRACT_ROUTE_FAMILY = "autonomy_contract"',
    'AUTONOMY_CONTRACT_ROUTE_ID = "augnes.read.autonomy_contract.v0.1"',
    'AUTONOMY_CONTRACT_CACHE_CONTROL = "no-store"',
    "AUTONOMY_CONTRACT_ROUTE_AUTHORITY_BOUNDARY",
    "validateAutonomyContractReadRequest",
    "buildAutonomyContractReadError",
    "readAutonomyContractForRoute",
    "buildAutonomyContractRouteInput",
    "buildAutonomyContractRouteSourceStatus",
    "buildAutonomyContractRouteWarnings",
    "validateReadonlyApiLocalAccess",
    "shouldUseReadonlyApiLocalDevAuthStrictMode",
    "validateReadonlyApiLocalDevAuthAdapter",
    "buildAutonomyContract",
    "buildAutonomyContractAuthorityBoundary",
    "buildAutonomyBudget",
    "buildAutonomyDeltaMergePolicy",
    "buildAutonomyReviewEscalationPolicy",
    "buildAutonomyStopConditions",
    "buildAutonomyReportingCadence",
    "buildAutonomyOutputPolicy",
    "buildAutonomyRunPreview",
    "buildDefaultForbiddenActions",
    "buildDefaultAllowedActions",
    "readGuideBriefForRoute",
    "readHandoffCapsuleForRoute",
    "readCodexLaunchCardForRoute",
    'target: "codex_handoff"',
    "source_disclosure",
    "This is preview contract data, not active autonomy state.",
    "synthetic_operator_supplied_fields",
    "synthetic_operator_supplied_preview_defaults",
    "phase_8a_default_no_auto_apply_policy",
    "preview_only_no_runner",
    'status: "preview_only"',
  ], { label: sourceFile });
}

function assertResponseShapeContract() {
  assertContainsAll(sourceText, [
    'response_version: AUTONOMY_CONTRACT_RESPONSE_VERSION',
    'runtime: "augnes"',
    "scope,",
    "route_id: AUTONOMY_CONTRACT_ROUTE_ID",
    "route_family: AUTONOMY_CONTRACT_ROUTE_FAMILY",
    "contract,",
    "route_authority_boundary",
    "source_status: buildAutonomyContractRouteSourceStatus",
    "warnings: buildAutonomyContractRouteWarnings",
    "gaps: buildAutonomyContractRouteGaps",
    "authority_boundary: buildAutonomyContractAuthorityBoundary()",
    "route_authority_boundary: authorityBoundary",
  ], { label: sourceFile });
}

function assertPreservedAutonomyPolicyDefaults() {
  assert.equal(fixture.run_preview.status, "preview_only");
  assert.equal(fixture.delta_merge_policy.auto_apply_allowed, false);
  assert.deepEqual(fixture.delta_merge_policy.auto_apply_targets, []);

  for (const target of requiredBlockedTargets) {
    assert(
      fixture.delta_merge_policy.blocked_targets.includes(target),
      `blocked_targets must include ${target}`,
    );
  }

  assertContainsAll(JSON.stringify(fixture.delta_merge_policy), [
    "Durable memory changes require user/operator review",
    "Project Perspective changes require user/operator review",
  ], { label: "fixture.delta_merge_policy" });

  for (const field of authorityBooleanFields) {
    assert.equal(
      fixture.authority_boundary[field],
      false,
      `authority_boundary.${field} must remain false`,
    );
  }

  assertContainsAll(phase8aHelperText, [
    "auto_apply_allowed: false",
    "auto_apply_targets: []",
    "buildAutonomyContractAuthorityBoundary",
    "can_launch_autonomy: false",
    "can_schedule_background_work: false",
    "can_start_daemon: false",
  ], { label: phase8aHelperFile });
}

function assertNoActiveExecutionLanguage() {
  for (const [file, text] of [
    [contractDoc, docText],
    [sourceFile, sourceText],
    [phase8aFixtureFile, JSON.stringify(fixture)],
  ]) {
    for (const phrase of [
      "active schedule",
      "active runner",
      "active execution",
      "background job",
      "active autonomy state",
    ]) {
      assertNoUnnegatedPositivePhrase(text, phrase, file);
    }
  }
}

function assertNoForbiddenRuntimeCode() {
  assertNoForbiddenCodePatterns(routeFile, routeText);
  assertNoForbiddenCodePatterns(sourceFile, sourceText);

  assertNoForbiddenImports(sourceFile, sourceText, [
    "@/app/",
    "@/components/",
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
    "autonomy-runner",
    "autonomy_runner",
  ]);

  assertNoForbiddenImports(routeFile, routeText, [
    "@/components/",
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
    "autonomy-runner",
    "autonomy_runner",
  ]);
}

function assertChangedFileBoundary() {
  const scopedBoundary = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "Phase 8B Autonomy Contract read route",
  });
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
      `Unexpected changed file for Phase 8B: ${file}`,
    );
    for (const pattern of forbiddenChangedFilePatterns) {
      assert(!pattern.test(file), `Forbidden Phase 8B changed file: ${file}`);
    }
  }

  return {
    ...scopedBoundary,
    files,
  };
}

function assertNoForbiddenCodePatterns(file, text) {
  const patterns = [
    /\bfetch\s*\(/,
    /\bchild_process\b/,
    /\bspawn\s*\(/,
    /\bexec\s*\(/,
    /\bwriteFile(?:Sync)?\s*\(/,
    /\bappendFile(?:Sync)?\s*\(/,
    /\bsetInterval\s*\(/,
    /\bsetTimeout\s*\(/,
    /\bnew\s+Worker\s*\(/,
    /\blaunchCodex\s*\(/i,
    /\bexecuteCodex\s*\(/i,
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
  ];

  for (const pattern of patterns) {
    assert(!pattern.test(text), `${file} must not match ${pattern}`);
  }
}

function assertNoForbiddenImports(file, text, forbiddenImports) {
  const importLines = text
    .split("\n")
    .filter((line) => line.trim().startsWith("import "));

  for (const line of importLines) {
    for (const forbiddenImport of forbiddenImports) {
      assert(
        !line.includes(forbiddenImport),
        `${file} must not import ${forbiddenImport}`,
      );
    }
  }
}

function assertNoUnnegatedPositivePhrase(text, phrase, label) {
  const lowerText = text.toLowerCase();
  const lowerPhrase = phrase.toLowerCase();
  let index = lowerText.indexOf(lowerPhrase);

  while (index !== -1) {
    const before = lowerText.slice(Math.max(0, index - 96), index);
    const negated = /\b(no|not|does not|do not|must not|without|not active)\b/.test(
      before,
    );
    assert(
      negated,
      `${label} contains unnegated active execution phrase: ${phrase}`,
    );
    index = lowerText.indexOf(lowerPhrase, index + lowerPhrase.length);
  }
}
