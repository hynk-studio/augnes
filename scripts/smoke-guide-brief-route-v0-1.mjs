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

const guideBriefDoc = "docs/GUIDEBRIEF_CONTRACT_V0_1.md";
const guideBriefRouteFile = "app/api/augnes/read/guide-brief/route.ts";
const guideBriefSourceFile = "lib/guide/guide-brief-source.ts";
const guideBriefCoreHelperFile = "lib/guide/guide-brief.ts";
const routeSmokeFile = "scripts/smoke-guide-brief-route-v0-1.mjs";
const packageJsonFile = "package.json";
const indexDoc = "docs/00_INDEX_LATEST.md";

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
];

const requiredFiles = [
  guideBriefDoc,
  guideBriefRouteFile,
  guideBriefSourceFile,
  guideBriefCoreHelperFile,
  routeSmokeFile,
  packageJsonFile,
  indexDoc,
];

const allowedChangedFiles = new Set([
  guideBriefDoc,
  guideBriefRouteFile,
  guideBriefSourceFile,
  routeSmokeFile,
  packageJsonFile,
  indexDoc,
  ...priorSmokeAllowlistCompatibilityFiles,
]);

const textByFile = loadTextByFile(requiredFiles);
const docText = textByFile.get(guideBriefDoc);
const routeText = textByFile.get(guideBriefRouteFile);
const sourceText = textByFile.get(guideBriefSourceFile);
const helperText = textByFile.get(guideBriefCoreHelperFile);
const smokeText = textByFile.get(routeSmokeFile);
const packageJsonText = textByFile.get(packageJsonFile);
const indexText = textByFile.get(indexDoc);

assertPackageJsonScript();
assertDocsAndIndexPointers();
assertRouteContract();
assertRouteSourceContract();
assertNoForbiddenActuationCode();
assertNoRouteSourceDirectDbImport();
const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "guide-brief-route-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      docs_route_boundary_checked: true,
      index_pointer_checked: true,
      route_exports_get_only_checked: true,
      route_scope_validation_checked: true,
      route_local_readonly_marker_checked: true,
      route_no_store_checked: true,
      route_fail_closed_paths_checked: true,
      route_guide_brief_json_composition_checked: true,
      source_helper_readonly_sources_checked: true,
      no_direct_db_import_checked: true,
      no_provider_openai_github_codex_calls_checked: true,
      no_write_or_mutation_patterns_checked: true,
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      prior_smoke_allowlist_compatibility_files_allowed:
        priorSmokeAllowlistCompatibilityFiles,
      direct_route_invocation_skipped: true,
      direct_route_invocation_skip_reason:
        "Static smoke avoids importing a Next route handler from plain Node without the Next runtime and TS path loader; optional local route sanity covers behavior when run.",
      ui_behavior_changed: false,
      mcp_app_tool_added: false,
      db_schema_migration_changed: false,
      db_write_added: false,
      provider_openai_github_runtime_call_added: false,
      codex_execution_added: false,
      proof_evidence_write_added: false,
      memory_mutation_added: false,
      durable_perspective_state_apply_added: false,
      scheduler_autonomy_runner_added: false,
      handoff_execution_added: false,
      external_side_effect_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:guide-brief-route-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:guide-brief-route-v0-1",
    expectedCommand: "node scripts/smoke-guide-brief-route-v0-1.mjs",
  });
}

function assertDocsAndIndexPointers() {
  assertContainsAll(
    docText,
    [
      "Phase 6B GET-Only Read Route",
      "GET /api/augnes/read/guide-brief?scope=project:augnes",
      "x-augnes-local-readonly: guide-brief-v0.1",
      "exports `GET` only",
      "fails closed on missing scope, invalid scope, missing marker, invalid marker",
      "cache-control: no-store",
      "Source composition is owned by `lib/guide/guide-brief-source.ts`",
      "Phase 6C Web Guide UI is deferred",
      "Phase 6D ChatGPT App/MCP Guide tool is deferred",
      "Phase 6E Codex Guide alignment is deferred",
      "Phase 7 Handoff Capsule / Codex Launch Card may consume GuideBrief only",
      "no DB schema/migration, DB write, provider/OpenAI call, GitHub actuation, Codex execution, proof/evidence write, memory mutation",
    ],
    { label: guideBriefDoc },
  );

  assertContainsAll(
    indexText,
    [
      "GET /api/augnes/read/guide-brief?scope=project:augnes",
      "x-augnes-local-readonly: guide-brief-v0.1",
      "cache-control: no-store",
      "no UI, MCP/App tool, DB write, provider/OpenAI call, GitHub actuation, Codex execution",
    ],
    { label: indexDoc },
  );
}

function assertRouteContract() {
  assert(
    /export\s+async\s+function\s+GET\s*\(\s*request:\s*Request\s*\)/.test(
      routeText,
    ),
    `${guideBriefRouteFile} must export async GET(request: Request)`,
  );

  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
    assert(
      !new RegExp(`export\\s+(?:async\\s+)?function\\s+${method}\\b`).test(
        routeText,
      ),
      `${guideBriefRouteFile} must not export ${method}`,
    );
  }

  assertContainsAll(
    routeText,
    [
      "validateGuideBriefReadRequest(request)",
      "buildGuideBriefReadError",
      "readGuideBriefForRoute({ scope: validation.scope })",
      "READONLY_RESPONSE_HEADERS",
      "GUIDE_BRIEF_LOCAL_READONLY_HEADER",
      "GUIDE_BRIEF_LOCAL_READONLY_VALUE",
      "GUIDE_BRIEF_CACHE_CONTROL",
      "status: 200",
      "status: validation.status",
      "code: \"unavailable\"",
    ],
    { label: guideBriefRouteFile },
  );

  assertContainsAll(
    sourceText,
    [
      'GUIDE_BRIEF_ROUTE_SCOPE = "project:augnes"',
      'GUIDE_BRIEF_LOCAL_READONLY_HEADER =\n  "x-augnes-local-readonly"',
      'GUIDE_BRIEF_LOCAL_READONLY_VALUE = "guide-brief-v0.1"',
      'GUIDE_BRIEF_CACHE_CONTROL = "no-store"',
      "validateGuideBriefReadRequest",
      "requestedScope",
      "missing_scope",
      "invalid_scope",
      "validateReadonlyApiLocalAccess",
      "if (!localGuardResult.ok)",
      "return localGuardResult",
      "GUIDE_BRIEF_ACCESS_POLICY",
      "required_marker_header: GUIDE_BRIEF_LOCAL_READONLY_HEADER",
      "required_marker_value: GUIDE_BRIEF_LOCAL_READONLY_VALUE",
    ],
    { label: guideBriefSourceFile },
  );
}

function assertRouteSourceContract() {
  assertContainsAll(
    sourceText,
    [
      "export function readGuideBriefForRoute",
      "export function buildGuideBriefRouteInput",
      "export function buildGuideBriefWorkplaneContextForRoute",
      "buildGuideBrief(buildGuideBriefRouteInput({ scope }))",
      "buildCurrentWorkingPerspectiveRuntimeReadModel({ scope })",
      "buildAugnesDeltaProjectionRuntimeReadModel({ scope })",
      "current_working_perspective: currentWorkingPerspective",
      "delta_projection: deltaProjection",
      "surface_role: \"agent_workplane\"",
      "route: \"/workbench\"",
      "legacy_cockpit_reachable: true",
      "trace_diagnostics_bounded: true",
      "Phase 6B adds a GET-only local read-only GuideBrief route.",
      "Phase 6C Web Guide UI remains deferred.",
      "Phase 6D ChatGPT App/MCP Guide tool remains deferred.",
      "Phase 6E Codex Guide alignment remains deferred.",
      "Phase 7 Handoff Capsule / Codex Launch Card remains deferred.",
      "authority_boundary: buildGuideBriefAuthorityBoundary()",
    ],
    { label: guideBriefSourceFile },
  );

  assertContainsAll(
    helperText,
    [
      "buildGuideBrief",
      "authority_boundary: buildGuideBriefAuthorityBoundary()",
      "GuideBrief is read-only.",
      "Handoff candidates are preview-only.",
    ],
    { label: guideBriefCoreHelperFile },
  );
}

function assertNoForbiddenActuationCode() {
  const checkedText = `${routeText}\n${sourceText}`;
  const forbiddenPatterns = [
    /\bfetch\s*\(/,
    /\bappendWorkEvent\b/,
    /\bappendCoordinationEvent\b/,
    /\bcreateEvidenceRecord\b/,
    /\brecordProof\b/,
    /\bcommitState\b/,
    /\brejectState\b/,
    /\bcommitStateDeltaProposal\b/,
    /\brejectStateDeltaProposal\b/,
    /@openai/,
    /\bfrom\s+["']openai["']/,
    /\boctokit\b/i,
    /\bgithub\b.*\b(rest|graphql|request|client|token)\b/i,
    /\bcreatePullRequest\b/,
    /\bchild_process\b/,
    /\bspawn\s*\(/,
    /\bexecFile\s*\(/,
    /\bwriteFileSync\b/,
    /\bprocess\.env\b/,
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+[A-Za-z_][\w.]*\s+SET\b/i,
    /\bDELETE\s+FROM\b/i,
    /\bCREATE\s+TABLE\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bDROP\s+TABLE\b/i,
    /\bsetInterval\s*\(/,
    /\bsetTimeout\s*\(/,
    /\bautonomyRunner\b/i,
    /\bcreateMcpTool\b/i,
    /\bsendHandoff\b/i,
    /\bexecuteCodex\b/i,
  ];

  for (const pattern of forbiddenPatterns) {
    assert(
      !pattern.test(checkedText),
      `GuideBrief route/source must not add actuation code matching ${pattern}`,
    );
  }

  assertContainsAll(
    smokeText,
    [
      "allowedChangedFiles",
      "route_exports_get_only_checked",
      "no_provider_openai_github_codex_calls_checked",
      "direct_route_invocation_skipped",
    ],
    { label: routeSmokeFile },
  );
}

function assertNoRouteSourceDirectDbImport() {
  assert(
    !/\bfrom\s+["']@\/lib\/db["']/.test(sourceText),
    `${guideBriefSourceFile} must not import lib/db directly`,
  );
  assert(
    !/\bfrom\s+["'][^"']*\/db["']/.test(sourceText),
    `${guideBriefSourceFile} must not import a db helper directly`,
  );
  assert(
    !/\bnew\s+Database\b/.test(sourceText),
    `${guideBriefSourceFile} must not open a database directly`,
  );
}

function assertChangedFileBoundary() {
  const workingTree = collectGitDiffFiles(["diff", "--name-only"]);
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
    assert(
      allowedChangedFiles.has(file),
      `Unexpected Phase 6B GuideBrief route changed or untracked file: ${file}`,
    );
    assert(file !== "app/page.tsx", "Phase 6B must not update / home page");
    assert(
      file !== "app/perspective/page.tsx",
      "Phase 6B must not update /perspective page",
    );
    assert(
      file !== "app/workbench/page.tsx",
      "Phase 6B must not update /workbench page",
    );
    assert(!/^components\//.test(file), `Phase 6B must not change UI files: ${file}`);
    assert(
      !/^app\/api\//.test(file) || file === guideBriefRouteFile,
      `Phase 6B must not add API route files outside GuideBrief read route: ${file}`,
    );
    assert(!/^db\//.test(file), `Phase 6B must not change DB files: ${file}`);
    assert(
      !/^migrations\//.test(file),
      `Phase 6B must not change migrations: ${file}`,
    );
    assert(
      !/^apps\/augnes_apps\//.test(file),
      `Phase 6B must not change MCP/App files: ${file}`,
    );
    assert(
      !/(^|\/)(mcp|plugin|plugins|tool|tools)(\/|$)/i.test(file),
      `Phase 6B must not change MCP/App tool files: ${file}`,
    );
    assert(
      !/(^|\/)(provider|providers|openai|github)(\/|$)/i.test(file),
      `Phase 6B must not change provider/OpenAI/GitHub runtime files: ${file}`,
    );
    assert(
      !/(^|\/)(proof|evidence)(\/|$)/i.test(file),
      `Phase 6B must not add proof/evidence write paths: ${file}`,
    );
    assert(
      !/(^|\/)(autonomy-runner|scheduler)(\/|$)/i.test(file),
      `Phase 6B must not add scheduler or autonomy runner files: ${file}`,
    );
  }

  return {
    checked:
      workingTree.checked ||
      cached.checked ||
      baseRange.checked ||
      untrackedFiles.length > 0,
    skipped: !(
      workingTree.checked ||
      cached.checked ||
      baseRange.checked ||
      untrackedFiles.length > 0
    ),
    skip_reason:
      workingTree.checked ||
      cached.checked ||
      baseRange.checked ||
      untrackedFiles.length > 0
        ? null
        : "changed-file boundary could not be checked",
    files,
  };
}
