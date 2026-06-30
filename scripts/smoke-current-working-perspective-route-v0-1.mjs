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

const routeFile = "app/api/perspective/current/route.ts";
const sourceHelperFile =
  "lib/perspective/current-working-perspective-source.ts";
const routeSmokeFile =
  "scripts/smoke-current-working-perspective-route-v0-1.mjs";
const currentPerspectiveDoc =
  "docs/AUGNES_CURRENT_WORKING_PERSPECTIVE_V0_1.md";
const currentPerspectiveSmokeFile =
  "scripts/smoke-current-working-perspective-v0-1.mjs";
const contractSmokeFile = "scripts/smoke-augnes-delta-contract-v0-1.mjs";
const projectionSmokeFile = "scripts/smoke-augnes-delta-projection-v0-1.mjs";
const projectionRouteSmokeFile =
  "scripts/smoke-augnes-delta-projection-route-v0-1.mjs";
const packageJsonFile = "package.json";
const indexDoc = "docs/00_INDEX_LATEST.md";

const requiredFiles = [
  routeFile,
  sourceHelperFile,
  routeSmokeFile,
  currentPerspectiveDoc,
  packageJsonFile,
  indexDoc,
];

const allowedChangedFiles = new Set([
  routeFile,
  sourceHelperFile,
  routeSmokeFile,
  currentPerspectiveDoc,
  currentPerspectiveSmokeFile,
  contractSmokeFile,
  projectionSmokeFile,
  projectionRouteSmokeFile,
  packageJsonFile,
  indexDoc,
]);

const allowedRouteFiles = new Set([routeFile]);

const textByFile = loadTextByFile(requiredFiles);
const routeText = textByFile.get(routeFile);
const sourceHelperText = textByFile.get(sourceHelperFile);
const routeSmokeText = textByFile.get(routeSmokeFile);
const currentPerspectiveDocText = textByFile.get(currentPerspectiveDoc);
const packageJsonText = textByFile.get(packageJsonFile);
const indexText = textByFile.get(indexDoc);

assertPackageJsonScript();
assertIndexPointer();
assertRouteDocs();
assertRouteShape();
assertSourceHelperShape();
assertNoRuntimeActuationCode();
const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "current-working-perspective-route-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      index_pointer_checked: true,
      route_doc_checked: true,
      route_get_only_checked: true,
      local_readonly_marker_checked: true,
      scope_fail_closed_checked: true,
      source_composition_helper_readonly_checked: true,
      route_uses_current_working_perspective_helper_checked: true,
      no_runtime_actuation_code_checked: true,
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      smoke_type:
        "static-current-working-perspective-runtime-read-route-source-composition-boundary-only",
      route_behavior_changed: true,
      route_behavior:
        "GET-only local read-only Current Working Perspective read surface",
      ui_behavior_changed: false,
      db_schema_migration_changed: false,
      db_write_added: false,
      mcp_app_tool_added: false,
      persistence_added: false,
      provider_openai_call_added: false,
      github_actuation_added: false,
      codex_execution_added: false,
      proof_evidence_write_added: false,
      durable_perspective_state_apply_added: false,
      memory_mutation_added: false,
      human_surface_added: false,
      guidebrief_added: false,
      product_write_behavior_added: false,
      autonomy_runner_added: false,
      external_side_effect_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:current-working-perspective-route-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:current-working-perspective-route-v0-1",
    expectedCommand:
      "node scripts/smoke-current-working-perspective-route-v0-1.mjs",
  });
}

function assertIndexPointer() {
  assertContainsAll(
    indexText,
    [
      currentPerspectiveDoc,
      "Phase 3B adds a GET-only read-only Current Working Perspective route",
      "source/composition helper",
      "Human Surface",
      "GuideBrief",
    ],
    { label: indexDoc },
  );
}

function assertRouteDocs() {
  assertContainsAll(
    currentPerspectiveDocText,
    [
      "Phase 3B Runtime Read Surface",
      "GET /api/perspective/current?scope=project:augnes",
      "read-only",
      "source/composition helper",
      "CurrentWorkingPerspective",
      "PerspectiveSnapshot",
      "AugnesDeltaProjectionReadModel",
      "x-augnes-local-readonly: current-working-perspective-v0.1",
      "no writes",
      "no persistence",
      "no external calls",
      "no approval/apply/proof/evidence authority",
      "Human Surface / GuideBrief are not implemented in Phase 3B",
      "current_frame",
      "current_thesis",
      "active_goals",
      "accepted_assumptions",
      "rejected_assumptions",
      "open_questions",
      "active_risks",
      "research_pressure",
      "next_candidates",
      "last_major_delta_refs",
      "review_queue_hints",
      "source_refs",
      "staleness",
      "gaps",
      "authority_boundary",
      "next_phase_notes",
    ],
    { label: currentPerspectiveDoc },
  );
}

function assertRouteShape() {
  assert(
    /export\s+function\s+GET\s*\(/.test(routeText),
    `${routeFile} must export GET`,
  );

  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
    assert(
      !new RegExp(`export\\s+function\\s+${method}\\s*\\(`).test(routeText),
      `${routeFile} must not export ${method}`,
    );
  }

  assertContainsAll(
    routeText,
    [
      "validateCurrentWorkingPerspectiveReadRequest",
      "buildCurrentWorkingPerspectiveRuntimeReadModel",
      "NextResponse.json",
      "CURRENT_WORKING_PERSPECTIVE_LOCAL_READ_HEADER",
      "CURRENT_WORKING_PERSPECTIVE_LOCAL_READ_MARKER",
      "CURRENT_WORKING_PERSPECTIVE_CACHE_CONTROL",
      "READONLY_RESPONSE_HEADERS",
    ],
    { label: routeFile },
  );

  assertContainsAll(
    sourceHelperText,
    [
      "validateReadonlyApiLocalAccess",
      "READONLY_LOCAL_HOSTS",
      "shouldUseReadonlyApiLocalDevAuthStrictMode",
      "validateReadonlyApiLocalDevAuthAdapter",
      "CURRENT_WORKING_PERSPECTIVE_ROUTE_SCOPE",
      "requestedScope !== CURRENT_WORKING_PERSPECTIVE_ROUTE_SCOPE",
      "\"missing_scope\"",
      "\"invalid_scope\"",
      "x-augnes-local-readonly",
      "current-working-perspective-v0.1",
    ],
    { label: sourceHelperFile },
  );
}

function assertSourceHelperShape() {
  assertContainsAll(
    sourceHelperText,
    [
      "buildCurrentWorkingPerspectiveRuntimeReadModel",
      "collectCurrentWorkingPerspectiveInput",
      "validateCurrentWorkingPerspectiveReadRequest",
      "buildCurrentWorkingPerspectiveReadError",
      "buildCurrentWorkingPerspective",
      "buildAugnesDeltaProjectionRuntimeReadModel",
      "PerspectiveSnapshot-shaped input",
      "perspective_version",
      "projection_version",
      "snapshot_version",
      "gaps",
      "readonly: true",
      "fileMustExist: true",
      "query_only = ON",
    ],
    { label: sourceHelperFile },
  );

  assert(
    /new\s+Database\s*\(\s*getDatabasePath\(\)\s*,\s*\{[\s\S]*readonly:\s*true[\s\S]*fileMustExist:\s*true[\s\S]*\}/.test(
      sourceHelperText,
    ),
    `${sourceHelperFile} must open the existing DB in read-only fileMustExist mode`,
  );
  assert(
    !/\bopenDatabase\s*\(/.test(sourceHelperText),
    `${sourceHelperFile} must not call the migration-capable openDatabase helper`,
  );
  assert(
    !/\bbuildPerspectiveSnapshot\s*\(/.test(sourceHelperText),
    `${sourceHelperFile} must not call snapshot helpers that can open migration-capable DB helpers`,
  );
}

function assertNoRuntimeActuationCode() {
  const checkedText = `${routeText}\n${sourceHelperText}`;
  const forbiddenPatterns = [
    /\bappendWorkEvent\s*\(/,
    /\bappendCoordinationEvent\s*\(/,
    /\bcreateEvidenceRecord\s*\(/,
    /\brecordProof\s*\(/,
    /\bcommitStateDeltaProposal\s*\(/,
    /\brejectStateDeltaProposal\s*\(/,
    /\bupdateStateDeltaProposalScoring\s*\(/,
    /\bcommitState\s*\(/,
    /\brejectState\s*\(/,
    /\binsert[A-Z]\w*\s*\(/,
    /\bupdate[A-Z]\w*\s*\(/,
    /\bdelete[A-Z]\w*\s*\(/,
    /\bfetch\s*\(/,
    /@openai/,
    /\bopenai\b/i,
    /\boctokit\b/i,
    /\bcreatePullRequest\s*\(/,
    /\bchild_process\b/,
    /\bspawn\s*\(/,
    /\bexecFile\s*\(/,
    /\bexecuteCodex\s*\(/,
    /\bcodexSdk\b/i,
    /\brandomUUID\b/,
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+\w+/i,
    /\bDELETE\s+FROM\b/i,
    /\bCREATE\s+TABLE\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bDROP\s+TABLE\b/i,
  ];

  for (const pattern of forbiddenPatterns) {
    assert(
      !pattern.test(checkedText),
      `Phase 3B route/source helper must not add runtime actuation code matching ${pattern}`,
    );
  }

  assertContainsAll(
    routeSmokeText,
    [
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "allowedRouteFiles",
      "readonly: true",
      "fileMustExist: true",
      "Human Surface",
      "GuideBrief",
    ],
    { label: routeSmokeFile },
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
      `Unexpected Phase 3B changed or untracked file: ${file}`,
    );
    assert(
      !/^app\/api\//.test(file) || allowedRouteFiles.has(file),
      `Phase 3B must not add API route files outside the Current Working Perspective read route: ${file}`,
    );
    assert(
      !/^app\/.*route\.(ts|tsx|js|jsx)$/.test(file) ||
        allowedRouteFiles.has(file),
      `Phase 3B must not add route files outside the Current Working Perspective read route: ${file}`,
    );
    assert(!/^components\//.test(file), `Phase 3B must not change UI files: ${file}`);
    assert(!/^db\//.test(file), `Phase 3B must not change DB files: ${file}`);
    assert(!/^migrations\//.test(file), `Phase 3B must not change migrations: ${file}`);
    assert(
      !/^apps\/augnes_apps\//.test(file),
      `Phase 3B must not change MCP/App files: ${file}`,
    );
    assert(
      !/(^|\/)(mcp|plugin|plugins|tool|tools)(\/|$)/i.test(file),
      `Phase 3B must not change MCP/App tool files: ${file}`,
    );
    assert(
      !/(^|\/)(provider|providers|openai|github)(\/|$)/i.test(file),
      `Phase 3B must not change provider/OpenAI/GitHub runtime files: ${file}`,
    );
    assert(
      !/(^|\/)(proof|evidence)(\/|$)/i.test(file),
      `Phase 3B must not add proof/evidence write paths: ${file}`,
    );
    assert(
      !/(^|\/)(human-surface|human_surface|guidebrief|guide-brief)(\/|$)/i.test(file),
      `Phase 3B must not add Human Surface or GuideBrief files: ${file}`,
    );
  }

  return {
    checked:
      workingTree.checked ||
      cached.checked ||
      baseRange.checked ||
      untrackedFiles.checked,
    skipped: !(
      workingTree.checked ||
      cached.checked ||
      baseRange.checked ||
      untrackedFiles.checked
    ),
    skip_reason:
      workingTree.checked ||
      cached.checked ||
      baseRange.checked ||
      untrackedFiles.checked
        ? null
        : "changed-file boundary could not be checked",
    files,
  };
}
