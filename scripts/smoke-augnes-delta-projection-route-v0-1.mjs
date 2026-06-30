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

const routeFile = "app/api/augnes/read/deltas/route.ts";
const sourceCollectorFile = "lib/augnes-delta/source-collector.ts";
const routeSmokeFile = "scripts/smoke-augnes-delta-projection-route-v0-1.mjs";
const projectionDoc = "docs/AUGNES_DELTA_PROJECTION_READ_MODEL_V0_1.md";
const projectionSmokeFile = "scripts/smoke-augnes-delta-projection-v0-1.mjs";
const contractSmokeFile = "scripts/smoke-augnes-delta-contract-v0-1.mjs";
const currentPerspectiveDoc = "docs/AUGNES_CURRENT_WORKING_PERSPECTIVE_V0_1.md";
const currentPerspectiveTypeFile = "types/current-working-perspective.ts";
const currentPerspectiveHelperFile =
  "lib/perspective/current-working-perspective.ts";
const currentPerspectiveFixtureFile =
  "fixtures/current-working-perspective.sample.v0.1.json";
const currentPerspectiveSmokeFile =
  "scripts/smoke-current-working-perspective-v0-1.mjs";
const currentPerspectiveSourceFile =
  "lib/perspective/current-working-perspective-source.ts";
const currentPerspectiveRouteFile = "app/api/perspective/current/route.ts";
const currentPerspectiveRouteSmokeFile =
  "scripts/smoke-current-working-perspective-route-v0-1.mjs";
const followOnHumanSurfaceHomeFiles = [
  "app/page.tsx",
  "app/globals.css",
  "components/augnes-public-home-surface.tsx",
  "components/human-surface/blank-state-panel.tsx",
  "components/human-surface/current-perspective-card.tsx",
  "components/human-surface/human-surface-home.tsx",
  "components/human-surface/mode-preset-selector.tsx",
  "components/human-surface/recent-deltas-preview.tsx",
  "components/human-surface/surface-link-grid.tsx",
  "lib/human-surface/read-current-perspective.ts",
  "docs/HUMAN_SURFACE_V0_1.md",
  "scripts/smoke-human-surface-home-v0-1.mjs",
];
const followOnPerspectiveHumanTimelineFiles = [
  "app/perspective/page.tsx",
  "components/perspective/perspective-public-constellation-surface.tsx",
  "components/perspective/perspective-human-surface.tsx",
  "components/perspective/perspective-current-summary-rail.tsx",
  "components/perspective/perspective-timeline.tsx",
  "components/perspective/perspective-delta-card.tsx",
  "components/perspective/perspective-delta-inspector.tsx",
  "components/perspective/perspective-boundary-next-panel.tsx",
  "lib/human-surface/read-delta-projection.ts",
  "scripts/smoke-perspective-human-timeline-v0-1.mjs",
];
const followOnAgentWorkplaneFiles = [
  "app/workbench/page.tsx",
  "components/workplane/agent-workplane.tsx",
  "components/workplane/workplane-header.tsx",
  "components/workplane/workplane-overview.tsx",
  "components/workplane/workplane-boundary-card.tsx",
  "components/workplane/legacy-cockpit-compatibility-panel.tsx",
  "lib/workplane/read-workplane-context.ts",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
];
const followOnAgentWorkplanePanelFiles = [
  "components/workplane/workplane-panel-shell.tsx",
  "components/workplane/work-queue-panel.tsx",
  "components/workplane/current-perspective-workplane-panel.tsx",
  "components/workplane/delta-projection-workplane-panel.tsx",
  "components/workplane/review-queue-workplane-panel.tsx",
  "components/workplane/evidence-handoff-workplane-panel.tsx",
  "components/workplane/workplane-inspector.tsx",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
];
const packageJsonFile = "package.json";
const indexDoc = "docs/00_INDEX_LATEST.md";

const requiredFiles = [
  routeFile,
  sourceCollectorFile,
  routeSmokeFile,
  projectionDoc,
  packageJsonFile,
  indexDoc,
];

const allowedChangedFiles = new Set([
  routeFile,
  sourceCollectorFile,
  routeSmokeFile,
  projectionDoc,
  projectionSmokeFile,
  contractSmokeFile,
  currentPerspectiveDoc,
  currentPerspectiveTypeFile,
  currentPerspectiveHelperFile,
  currentPerspectiveFixtureFile,
  currentPerspectiveSmokeFile,
  currentPerspectiveSourceFile,
  currentPerspectiveRouteFile,
  currentPerspectiveRouteSmokeFile,
  ...followOnHumanSurfaceHomeFiles,
  ...followOnPerspectiveHumanTimelineFiles,
  ...followOnAgentWorkplaneFiles,
  ...followOnAgentWorkplanePanelFiles,
  packageJsonFile,
  indexDoc,
]);

const allowedRouteFiles = new Set([routeFile, currentPerspectiveRouteFile]);

const textByFile = loadTextByFile(requiredFiles);
const routeText = textByFile.get(routeFile);
const sourceCollectorText = textByFile.get(sourceCollectorFile);
const routeSmokeText = textByFile.get(routeSmokeFile);
const projectionDocText = textByFile.get(projectionDoc);
const indexText = textByFile.get(indexDoc);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageJsonScript();
assertIndexPointer();
assertRouteDocs();
assertRouteShape();
assertSourceCollectorShape();
assertNoRuntimeActuationCode();
const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "augnes-delta-projection-route-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      index_pointer_checked: true,
      route_doc_checked: true,
      route_get_only_checked: true,
      local_readonly_marker_checked: true,
      scope_fail_closed_checked: true,
      source_collector_readonly_checked: true,
      route_uses_projector_via_collector_checked: true,
      no_runtime_actuation_code_checked: true,
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      follow_on_human_surface_home_files_allowed:
        followOnHumanSurfaceHomeFiles,
      follow_on_agent_workplane_files_allowed: followOnAgentWorkplaneFiles,
      follow_on_agent_workplane_panel_files_allowed:
        followOnAgentWorkplanePanelFiles,
      smoke_type: "static-runtime-read-route-source-collector-boundary-only",
      route_behavior_changed: true,
      route_behavior: "GET-only local read-only Augnes Delta projection read surface",
      ui_behavior_changed: changedFilesBoundary.ui_surface_added,
      human_surface_ui_added: changedFilesBoundary.human_surface_ui_added,
      agent_workplane_ui_added: changedFilesBoundary.agent_workplane_ui_added,
      ui_surface_added: changedFilesBoundary.ui_surface_added,
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
      product_write_behavior_added: false,
      autonomy_runner_added: false,
      external_side_effect_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:augnes-delta-projection-route-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:augnes-delta-projection-route-v0-1",
    expectedCommand:
      "node scripts/smoke-augnes-delta-projection-route-v0-1.mjs",
  });
}

function assertIndexPointer() {
  assertContainsAll(
    indexText,
    [
      projectionDoc,
      "Phase 2B adds a GET-only read-only Delta Projection route",
      "source collector",
    ],
    { label: indexDoc },
  );
}

function assertRouteDocs() {
  assertContainsAll(
    projectionDocText,
    [
      "Phase 2B Runtime Read Surface",
      "GET /api/augnes/read/deltas?scope=project:augnes",
      "read-only",
      "source collector",
      "source_refs",
      "source_counts",
      "gaps",
      "x-augnes-local-readonly: augnes-delta-projection-v0.1",
      "no writes",
      "no persistence",
      "no external calls",
      "no approval/apply/proof/evidence authority",
    ],
    { label: projectionDoc },
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
      "validateAugnesDeltaProjectionReadRequest",
      "buildAugnesDeltaProjectionRuntimeReadModel",
      "NextResponse.json",
      "AUGNES_DELTA_PROJECTION_LOCAL_READ_HEADER",
      "AUGNES_DELTA_PROJECTION_LOCAL_READ_MARKER",
      "AUGNES_DELTA_PROJECTION_CACHE_CONTROL",
      "READONLY_RESPONSE_HEADERS",
    ],
    { label: routeFile },
  );

  assertContainsAll(
    sourceCollectorText,
    [
      "validateReadonlyApiLocalAccess",
      "READONLY_LOCAL_HOSTS",
      "shouldUseReadonlyApiLocalDevAuthStrictMode",
      "validateReadonlyApiLocalDevAuthAdapter",
      "AUGNES_DELTA_PROJECTION_ROUTE_SCOPE = \"project:augnes\"",
      "requestedScope !== AUGNES_DELTA_PROJECTION_ROUTE_SCOPE",
      "\"missing_scope\"",
      "\"invalid_scope\"",
      "x-augnes-local-readonly",
      "augnes-delta-projection-v0.1",
    ],
    { label: sourceCollectorFile },
  );
}

function assertSourceCollectorShape() {
  assertContainsAll(
    sourceCollectorText,
    [
      "buildAugnesDeltaProjectionReadModel",
      "collectAugnesDeltaProjectionInput",
      "state_delta_proposals",
      "work_events",
      "coordination_events",
      "action_records",
      "verification_evidence_records",
      "dogfooding_records",
      "handoff_traces",
      "codex_result_traces",
      "runtime_read_context.augnes_delta_projection.v0.1",
      "projection_version",
      "contract_version",
      "source_refs",
      "gaps",
      "authority_boundary",
      "readonly: true",
      "fileMustExist: true",
      "query_only = ON",
    ],
    { label: sourceCollectorFile },
  );

  assert(
    /new\s+Database\s*\(\s*getDatabasePath\(\)\s*,\s*\{[\s\S]*readonly:\s*true[\s\S]*fileMustExist:\s*true[\s\S]*\}/.test(
      sourceCollectorText,
    ),
    `${sourceCollectorFile} must open the existing DB in read-only fileMustExist mode`,
  );
  assert(
    !/\bopenDatabase\s*\(/.test(sourceCollectorText),
    `${sourceCollectorFile} must not call the migration-capable openDatabase helper`,
  );
  assert(
    !/\bbuildPerspectiveSnapshot\s*\(/.test(sourceCollectorText),
    `${sourceCollectorFile} must not call snapshot helpers that can open migration-capable DB helpers`,
  );
}

function assertNoRuntimeActuationCode() {
  const checkedText = `${routeText}\n${sourceCollectorText}`;
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
      `Phase 2B route/source collector must not add runtime actuation code matching ${pattern}`,
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
      `Unexpected Phase 2B changed or untracked file: ${file}`,
    );
    assert(
      !/^app\/api\//.test(file) || allowedRouteFiles.has(file),
      `Phase 2B follow-on must not add API route files outside approved read routes: ${file}`,
    );
    assert(
      !/^app\/.*route\.(ts|tsx|js|jsx)$/.test(file) ||
        allowedRouteFiles.has(file),
      `Phase 2B follow-on must not add route files outside approved read routes: ${file}`,
    );
    assert(
      !/^components\//.test(file) ||
        followOnHumanSurfaceHomeFiles.includes(file) ||
        followOnPerspectiveHumanTimelineFiles.includes(file) ||
        followOnAgentWorkplaneFiles.includes(file) ||
        followOnAgentWorkplanePanelFiles.includes(file),
      `Phase 2B follow-on must not change UI files outside Phase 4A/4B Human Surface or Phase 5A/5B Agent Workplane files: ${file}`,
    );
    assert(!/^db\//.test(file), `Phase 2B must not change DB files: ${file}`);
    assert(!/^migrations\//.test(file), `Phase 2B must not change migrations: ${file}`);
    assert(
      !/^apps\/augnes_apps\//.test(file),
      `Phase 2B must not change MCP/App files: ${file}`,
    );
    assert(
      !/(^|\/)(mcp|plugin|plugins|tool|tools)(\/|$)/i.test(file),
      `Phase 2B must not change MCP/App tool files: ${file}`,
    );
    assert(
      !/(^|\/)(provider|providers|openai|github)(\/|$)/i.test(file),
      `Phase 2B must not change provider/OpenAI/GitHub runtime files: ${file}`,
    );
    assert(
      !/(^|\/)(proof|evidence)(\/|$)/i.test(file),
      `Phase 2B must not add proof/evidence write paths: ${file}`,
    );
  }

  const humanSurfaceUiAdded = files.some((file) =>
    file === "app/page.tsx" ||
    file === "app/perspective/page.tsx" ||
    file === "app/globals.css" ||
    file === "components/augnes-public-home-surface.tsx" ||
    file.startsWith("components/human-surface/") ||
    file.startsWith("components/perspective/"),
  );
  const agentWorkplaneUiAdded = files.some((file) =>
    file === "app/workbench/page.tsx" ||
    file.startsWith("components/workplane/"),
  );

  return {
    checked:
      workingTree.checked ||
      cached.checked ||
      baseRange.checked ||
      untrackedFiles.length > 0,
    skipped: !workingTree.checked && !cached.checked && !baseRange.checked,
    skip_reason:
      !workingTree.checked && !cached.checked && !baseRange.checked
        ? "git diff checks were unavailable"
        : null,
    human_surface_ui_added: humanSurfaceUiAdded,
    agent_workplane_ui_added: agentWorkplaneUiAdded,
    ui_surface_added: humanSurfaceUiAdded || agentWorkplaneUiAdded,
    files,
  };
}
