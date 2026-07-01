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
const routeFile = "app/api/augnes/read/autonomy-runner-preflight/route.ts";
const sourceFile = "lib/autonomy/autonomy-runner-preflight-source.ts";
const phase9aHelperFile = "lib/autonomy/autonomy-runner-preflight.ts";
const routeSmokeFile = "scripts/smoke-autonomy-runner-preflight-route-v0-1.mjs";
const packageJsonFile = "package.json";
const indexDoc = "docs/00_INDEX_LATEST.md";

const requiredFiles = [
  contractDoc,
  routeFile,
  sourceFile,
  phase9aHelperFile,
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
  "scripts/smoke-autonomy-runner-preflight-v0-1.mjs",
];

const allowedChangedFiles = new Set([
  ...requiredFiles,
  ...priorSmokeAllowlistCompatibilityFiles,
]);

const forbiddenChangedFilePatterns = [
  /^app\/(?!api\/augnes\/read\/autonomy-runner-preflight\/route\.ts$)/,
  /^components\//,
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

const authorityBooleanFields = [
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
const docText = textByFile.get(contractDoc);
const routeText = textByFile.get(routeFile);
const sourceText = textByFile.get(sourceFile);
const phase9aHelperText = textByFile.get(phase9aHelperFile);
const packageJsonText = textByFile.get(packageJsonFile);
const indexText = textByFile.get(indexDoc);

assertPackageJsonScript();
assertDocsAndIndexPointers();
assertRouteContract();
assertSourceHelperContract();
assertResponseShapeContract();
assertNoForbiddenRuntimeCode();
const routeBehavior = assertRouteBehavior();
const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "autonomy-runner-preflight-route-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      docs_route_boundary_checked: true,
      index_pointer_checked: true,
      route_exports_get_only_checked: true,
      route_requires_exact_scope_checked: true,
      route_requires_local_readonly_header_checked: true,
      route_requires_local_readonly_marker_checked: true,
      route_no_store_checked: true,
      source_uses_phase_9a_helper_checked: true,
      source_does_not_invent_readiness_policy_checked: true,
      behavior_checked: routeBehavior.checked,
      behavior_cases: routeBehavior.cases,
      dry_run_only_checked: true,
      all_planned_steps_would_execute_false_checked: true,
      authority_boundary_all_false_checked: true,
      no_ui_component_page_files_changed_checked: true,
      no_mcp_app_tool_files_changed_checked: true,
      no_db_migration_files_changed_checked: true,
      no_provider_openai_github_codex_calls_checked: true,
      no_child_process_in_route_source_checked: true,
      no_fs_writes_in_route_source_checked: true,
      no_interval_timer_cron_worker_daemon_background_loop_checked: true,
      no_proof_evidence_write_checked: true,
      no_memory_perspective_state_mutation_checked: true,
      no_handoff_send_checked: true,
      no_branch_pr_creation_checked: true,
      no_auto_apply_budget_spend_external_post_checked: true,
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
        "static-and-direct-autonomy-runner-preflight-get-only-read-route-boundary",
    },
    null,
    2,
  ),
);
console.log("PASS smoke:autonomy-runner-preflight-route-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:autonomy-runner-preflight-route-v0-1",
    expectedCommand:
      "node scripts/smoke-autonomy-runner-preflight-route-v0-1.mjs",
  });
}

function assertDocsAndIndexPointers() {
  assertContainsAll(docText, [
    "Phase 9B GET-Only Read Route",
    "GET /api/augnes/read/autonomy-runner-preflight?scope=project:augnes",
    "x-augnes-local-readonly: autonomy-runner-preflight-v0.1",
    "cache-control: no-store",
    "exports `GET` only",
    "fails closed on missing scope, invalid scope, missing marker, invalid marker",
    "Source composition is owned by\n`lib/autonomy/autonomy-runner-preflight-source.ts`",
    "calls\n`buildAutonomyRunnerPreflight()`",
    "The route does not invent\nreadiness, blocker, warning, budget, action-scope, delta-merge, escalation,\nstop-condition, staleness, or authority policy.",
    "The Phase 9B route does not start a runner.",
    "The route does not schedule\nanything.",
    "The route does not run Codex.",
    "The route does not call GitHub,\nOpenAI, or provider APIs.",
    "The route does not write DB/proof/evidence.",
    "The\nroute does not mutate memory/state/work/Perspective.",
    "The route does not send\nhandoff.",
    "The route does not create branches or PRs.",
    "The route does not\nauto-apply deltas.",
    "The route does not spend budget.",
    "The route does not start a\ndaemon or background work.",
    "smoke:autonomy-runner-preflight-route-v0-1",
    "Browser/CDP validation is skipped because Phase 9A has no UI or route.",
    "Browser/CDP validation is skipped because Phase 9B adds only a GET-only read\nroute and no UI.",
  ], { label: contractDoc });

  assertContainsAll(indexText, [
    "Phase 9B Autonomy Runner Preflight GET-only read route v0.1",
    routeFile,
    sourceFile,
    routeSmokeFile,
    "smoke:autonomy-runner-preflight-route-v0-1",
    "GET /api/augnes/read/autonomy-runner-preflight?scope=project:augnes",
    "x-augnes-local-readonly: autonomy-runner-preflight-v0.1",
    "cache-control: no-store",
    "GET-only",
    "local/read-only",
    "fail-closed on\n  scope/header validation",
    "consuming the Phase 9A helper without inventing readiness or\n  blocker policy",
    "dry_run_plan.status: dry_run_only",
    "would_execute: false",
    "all-false no-run\n  authority boundary",
    "no UI, MCP/App tool, actual runner,\n  scheduler, daemon, background work",
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
    "validateAutonomyRunnerPreflightRouteRequest(request)",
    "readAutonomyRunnerPreflightForRoute",
    "buildAutonomyRunnerPreflightRouteError",
    "READONLY_RESPONSE_HEADERS",
    "AUTONOMY_RUNNER_PREFLIGHT_READONLY_HEADER",
    "AUTONOMY_RUNNER_PREFLIGHT_READONLY_HEADER_VALUE",
    "AUTONOMY_RUNNER_PREFLIGHT_CACHE_CONTROL",
    "status: 200",
    "status: validation.status",
    "code: \"unavailable\"",
  ], { label: routeFile });
}

function assertSourceHelperContract() {
  assertContainsAll(sourceText, [
    'AUTONOMY_RUNNER_PREFLIGHT_ROUTE_SCOPE =\n  AUTONOMY_CONTRACT_ROUTE_SCOPE',
    'AUTONOMY_RUNNER_PREFLIGHT_READONLY_HEADER =\n  "x-augnes-local-readonly"',
    'AUTONOMY_RUNNER_PREFLIGHT_READONLY_HEADER_VALUE =\n  "autonomy-runner-preflight-v0.1"',
    'AUTONOMY_RUNNER_PREFLIGHT_ROUTE_FAMILY =\n  "autonomy_runner_preflight"',
    'AUTONOMY_RUNNER_PREFLIGHT_ROUTE_ID =\n  "augnes.read.autonomy_runner_preflight.v0.1"',
    'AUTONOMY_RUNNER_PREFLIGHT_CACHE_CONTROL = "no-store"',
    "AUTONOMY_RUNNER_PREFLIGHT_ROUTE_AUTHORITY_BOUNDARY",
    "validateAutonomyRunnerPreflightRouteRequest",
    "buildAutonomyRunnerPreflightRouteError",
    "readAutonomyRunnerPreflightForRoute",
    "buildAutonomyRunnerPreflightRouteSourceStatus",
    "validateReadonlyApiLocalAccess",
    "shouldUseReadonlyApiLocalDevAuthStrictMode",
    "validateReadonlyApiLocalDevAuthAdapter",
    "readAutonomyContractForRoute",
    "buildAutonomyRunnerPreflight",
    "buildAutonomyPreflightAuthorityBoundary",
    "does not invent readiness or blocker policy",
    "dry_run_only_no_runner",
    "This is preflight/dry-run preview data, not active autonomy state.",
    "Dry-run plan status remains dry_run_only.",
    "Every planned step has would_execute false.",
    "Authority boundary denies execution/write/schedule/external behavior.",
  ], { label: sourceFile });

  assert(
    !/\bderiveAutonomyRunReadiness\b/.test(sourceText),
    `${sourceFile} must not derive readiness outside Phase 9A helper`,
  );
  assert(
    !/\bbuildAutonomyRunBlockers\b/.test(sourceText),
    `${sourceFile} must not build blockers outside Phase 9A helper`,
  );
  assert(
    !/\bassessAutonomy[A-Z]/.test(sourceText),
    `${sourceFile} must not run individual assessors outside Phase 9A helper`,
  );

  assertContainsAll(phase9aHelperText, [
    "buildAutonomyRunnerPreflight",
    "buildAutonomyDryRunPlan",
    "deriveAutonomyRunReadiness",
    "buildAutonomyRunBlockers",
    "would_execute: false",
    "status: \"dry_run_only\"",
  ], { label: phase9aHelperFile });
}

function assertResponseShapeContract() {
  assertContainsAll(sourceText, [
    "response_version: AUTONOMY_RUNNER_PREFLIGHT_RESPONSE_VERSION",
    'runtime: "augnes"',
    "scope,",
    "route_id: AUTONOMY_RUNNER_PREFLIGHT_ROUTE_ID",
    "route_family: AUTONOMY_RUNNER_PREFLIGHT_ROUTE_FAMILY",
    "preflight,",
    "dry_run_plan: preflight.dry_run_plan",
    "readiness: preflight.readiness",
    "blockers: preflight.blockers",
    "warnings: preflight.warnings",
    "source_refs: preflight.source_refs",
    "authority_boundary: preflight.authority_boundary",
    "public_safety: preflight.public_safety",
    "route_authority_boundary",
    "source_status: buildAutonomyRunnerPreflightRouteSourceStatus",
    "route_notes",
    "authority_boundary: buildAutonomyPreflightAuthorityBoundary()",
  ], { label: sourceFile });
}

function assertRouteBehavior() {
  const behaviorScript = String.raw`
    import { GET } from "./app/api/augnes/read/autonomy-runner-preflight/route.ts";

    async function main() {
      const headerName = "x-augnes-local-readonly";
      const headerValue = "autonomy-runner-preflight-v0.1";
      const validUrl = "http://localhost/api/augnes/read/autonomy-runner-preflight?scope=project:augnes";
      const makeRequest = ({ url = validUrl, marker = headerValue } = {}) => {
        const headers = new Headers();
        if (marker !== null) headers.set(headerName, marker);
        return new Request(url, { method: "GET", headers });
      };
      const summarize = async (response) => ({
        status: response.status,
        cacheControl: response.headers.get("cache-control"),
        contentType: response.headers.get("content-type"),
        marker: response.headers.get(headerName),
        body: await response.json(),
      });

      const valid = await summarize(await GET(makeRequest()));
      const missingScope = await summarize(await GET(makeRequest({
        url: "http://localhost/api/augnes/read/autonomy-runner-preflight",
      })));
      const invalidScope = await summarize(await GET(makeRequest({
        url: "http://localhost/api/augnes/read/autonomy-runner-preflight?scope=project:other",
      })));
      const missingMarker = await summarize(await GET(makeRequest({ marker: null })));
      const invalidMarker = await summarize(await GET(makeRequest({ marker: "wrong" })));

      console.log(JSON.stringify({
        valid,
        missingScope,
        invalidScope,
        missingMarker,
        invalidMarker,
      }));
    }

    main().catch((error) => {
      console.error(error);
      process.exit(1);
    });
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

  assert.equal(result.valid.status, 200, "valid GET must return 200");
  assert.equal(result.valid.cacheControl, "no-store");
  assert.match(result.valid.contentType, /application\/json/);
  assert.equal(result.valid.marker, "autonomy-runner-preflight-v0.1");
  assert.equal(result.valid.body.scope, "project:augnes");
  assert(result.valid.body.preflight, "valid body must include preflight");
  assert.equal(
    result.valid.body.preflight.preflight_version,
    "autonomy_runner_preflight.v0.1",
  );
  assert.equal(result.valid.body.dry_run_plan.status, "dry_run_only");
  assert.equal(result.valid.body.preflight.dry_run_plan.status, "dry_run_only");
  assert(
    result.valid.body.dry_run_plan.planned_steps.length > 0,
    "dry-run plan must include planned steps",
  );
  for (const step of result.valid.body.dry_run_plan.planned_steps) {
    assert.equal(step.would_execute, false, `${step.step_id} must not execute`);
  }
  for (const field of authorityBooleanFields) {
    assert.equal(
      result.valid.body.authority_boundary[field],
      false,
      `authority_boundary.${field} must be false`,
    );
    assert.equal(
      result.valid.body.dry_run_plan.no_run_boundary[field],
      false,
      `no_run_boundary.${field} must be false`,
    );
  }
  assert.equal(
    result.valid.body.public_safety.contains_private_conversation,
    false,
  );

  assertRouteFailure(result.missingScope, 400, "missing_scope");
  assertRouteFailure(result.invalidScope, 400, "invalid_scope");
  assertRouteFailure(result.missingMarker, 403, "missing_marker");
  assertRouteFailure(result.invalidMarker, 403, "invalid_marker");

  return {
    checked: true,
    cases: [
      "valid",
      "missing_scope",
      "invalid_scope",
      "missing_marker",
      "invalid_marker",
    ],
  };
}

function assertRouteFailure(observed, status, code) {
  assert.equal(observed.status, status, `${code} must return ${status}`);
  assert.equal(observed.cacheControl, "no-store", `${code} must return no-store`);
  assert.match(observed.contentType, /application\/json/);
  assert.equal(observed.marker, "autonomy-runner-preflight-v0.1");
  assert.equal(observed.body.error.code, code);
  assert.equal(observed.body.error.status, status);
}

function assertNoForbiddenRuntimeCode() {
  const checkedEntries = [
    [routeFile, routeText],
    [sourceFile, sourceText],
  ];

  for (const [file, text] of checkedEntries) {
    assertNoForbiddenCodePatterns(file, text);
    assertNoForbiddenImports(file, text, [
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
      "daemon",
      "background-worker",
      "background_worker",
    ]);
  }
}

function assertNoForbiddenCodePatterns(file, text) {
  const patterns = [
    /\bfetch\s*\(/,
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
    /\blaunchCodex\s*\(/i,
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

function assertChangedFileBoundary() {
  const scopedBoundary = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "Phase 9B Autonomy Runner Preflight read route",
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
    assert(allowedChangedFiles.has(file), `Unexpected Phase 9B changed file: ${file}`);
    for (const pattern of forbiddenChangedFilePatterns) {
      if (file === routeFile) continue;
      assert(!pattern.test(file), `Forbidden Phase 9B changed file: ${file}`);
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
