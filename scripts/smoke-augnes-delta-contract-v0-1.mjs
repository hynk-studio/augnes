import assert from "node:assert/strict";
import {
  assertContainsAll,
  assertNoRuntimeImports,
  assertPackageScript,
  collectGitDiffFiles,
  collectUntrackedFiles,
  getBaseRangeChangedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const contractDoc = "docs/AUGNES_DELTA_CONTRACT_V0_1.md";
const typeFile = "types/augnes-delta.ts";
const fixtureFile = "fixtures/augnes-delta.sample.v0.1.json";
const smokeFile = "scripts/smoke-augnes-delta-contract-v0-1.mjs";
const packageJsonFile = "package.json";
const indexDoc = "docs/00_INDEX_LATEST.md";

const requiredFiles = [
  contractDoc,
  typeFile,
  fixtureFile,
  smokeFile,
  packageJsonFile,
  indexDoc,
];

const followOnProjectionReadModelFiles = [
  "docs/AUGNES_DELTA_PROJECTION_READ_MODEL_V0_1.md",
  "types/augnes-delta-projection.ts",
  "lib/augnes-delta/projector.ts",
  "fixtures/augnes-delta-projection.sample.v0.1.json",
  "scripts/smoke-augnes-delta-projection-v0-1.mjs",
];

const followOnProjectionRuntimeReadSurfaceFiles = [
  "lib/augnes-delta/source-collector.ts",
  "app/api/augnes/read/deltas/route.ts",
  "scripts/smoke-augnes-delta-projection-route-v0-1.mjs",
];

const followOnCurrentWorkingPerspectiveFiles = [
  "docs/AUGNES_CURRENT_WORKING_PERSPECTIVE_V0_1.md",
  "types/current-working-perspective.ts",
  "lib/perspective/current-working-perspective.ts",
  "fixtures/current-working-perspective.sample.v0.1.json",
  "scripts/smoke-current-working-perspective-v0-1.mjs",
];

const followOnCurrentWorkingPerspectiveRuntimeReadSurfaceFiles = [
  "lib/perspective/current-working-perspective-source.ts",
  "app/api/perspective/current/route.ts",
  "scripts/smoke-current-working-perspective-route-v0-1.mjs",
];

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

const followOnAgentWorkplaneProjectionHandoffFiles = [
  "components/workplane/projection-candidates-panel.tsx",
  "components/workplane/delta-batch-panel.tsx",
  "components/workplane/handoff-builder-preview-panel.tsx",
  "components/workplane/run-postmortem-skeleton-panel.tsx",
  "components/workplane/trace-diagnostics-panel.tsx",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
];

const allowedChangedFiles = new Set([
  ...requiredFiles,
  ...followOnProjectionReadModelFiles,
  ...followOnProjectionRuntimeReadSurfaceFiles,
  ...followOnCurrentWorkingPerspectiveFiles,
  ...followOnCurrentWorkingPerspectiveRuntimeReadSurfaceFiles,
  ...followOnHumanSurfaceHomeFiles,
  ...followOnPerspectiveHumanTimelineFiles,
  ...followOnAgentWorkplaneFiles,
  ...followOnAgentWorkplanePanelFiles,
  ...followOnAgentWorkplaneProjectionHandoffFiles,
]);

const allowedRouteFiles = new Set([
  "app/api/augnes/read/deltas/route.ts",
  "app/api/perspective/current/route.ts",
]);

const textByFile = loadTextByFile(requiredFiles);
const contractText = textByFile.get(contractDoc);
const typeText = textByFile.get(typeFile);
const fixtureText = textByFile.get(fixtureFile);
const indexText = textByFile.get(indexDoc);
const packageJsonText = textByFile.get(packageJsonFile);
const fixture = JSON.parse(fixtureText);

assertPackageJsonScript();
assertIndexPointer();
assertContractDoc();
assertTypeContract();
assertFixtureShape();
assertAuthorityBoundary();
const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "augnes-delta-contract-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      index_pointer_checked: true,
      contract_terms_checked: true,
      type_exports_checked: true,
      fixture_json_parsed: true,
      batch_count: fixture.batches.length,
      delta_count: collectDeltas(fixture).length,
      authority_boundary_checked: true,
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_skip_reason: changedFilesBoundary.skip_reason,
      git_diff_name_only_checked: changedFilesBoundary.git_diff_name_only_checked,
      follow_on_projection_files_allowed:
        changedFilesBoundary.follow_on_projection_files_allowed,
      follow_on_projection_runtime_read_surface_files_allowed:
        changedFilesBoundary.follow_on_projection_runtime_read_surface_files_allowed,
      follow_on_current_working_perspective_files_allowed:
        changedFilesBoundary.follow_on_current_working_perspective_files_allowed,
      follow_on_current_working_perspective_runtime_read_surface_files_allowed:
        changedFilesBoundary.follow_on_current_working_perspective_runtime_read_surface_files_allowed,
      follow_on_human_surface_home_files_allowed:
        changedFilesBoundary.follow_on_human_surface_home_files_allowed,
      changed_files_observed: changedFilesBoundary.files,
      smoke_type: "static-contract-type-fixture-package-index-boundary-only",
      runtime_behavior_changed: changedFilesBoundary.api_route_added,
      ui_behavior_changed: changedFilesBoundary.ui_surface_added,
      human_surface_ui_added: changedFilesBoundary.human_surface_ui_added,
      agent_workplane_ui_added: changedFilesBoundary.agent_workplane_ui_added,
      ui_surface_added: changedFilesBoundary.ui_surface_added,
      route_behavior_changed: changedFilesBoundary.api_route_added,
      api_route_added: changedFilesBoundary.api_route_added,
      db_schema_migration_changed: false,
      mcp_app_tool_added: false,
      persistence_added: false,
      provider_openai_call_added: false,
      github_actuation_added: false,
      codex_execution_added: false,
      proof_evidence_write_added: false,
      durable_perspective_state_apply_added: false,
      product_write_behavior_added: false,
      autonomy_runner_added: false,
      external_side_effect_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:augnes-delta-contract-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:augnes-delta-contract-v0-1",
    expectedCommand: "node scripts/smoke-augnes-delta-contract-v0-1.mjs",
  });
}

function assertIndexPointer() {
  assertContainsAll(indexText, [contractDoc, "AugnesDelta"], {
    label: indexDoc,
  });
}

function assertContractDoc() {
  assertContainsAll(
    contractText,
    [
      "AugnesDelta",
      "DeltaBatch",
      "ResearchDiagnosticRef",
      "SnapshotRef",
      "manual mode",
      "autonomy mode",
      "authority boundary",
      "GitHub PRs are external review artifacts for code deltas",
      "AugnesDelta is broader than code, PRs, proof, evidence, or work events",
      "AugnesDelta is a projection/change contract, not source-of-truth state by itself",
    ],
    { label: contractDoc },
  );
}

function assertTypeContract() {
  assertNoRuntimeImports({
    file: typeFile,
    text: typeText,
    forbiddenImports: [
      "node:",
      "fs",
      "path",
      "child_process",
      ".json",
      "app/",
      "components/",
      "lib/",
      "db/",
      "migrations/",
      "apps/augnes_apps/",
      "@openai",
      "openai",
      "octokit",
    ],
  });

  assert(!/\bimport\s+/m.test(typeText), `${typeFile} must not contain imports`);
  assert(!/\breadFileSync\b|\bwriteFileSync\b|\bfetch\s*\(|\bnew\s+Database\b|\bprocess\.env\b/.test(typeText), `${typeFile} must not contain runtime side effects`);
  assert(!/\bfunction\b|\bclass\b/.test(typeText), `${typeFile} must not contain functions or classes`);

  const requiredExports = [
    "AUGNES_DELTA_CONTRACT_VERSION",
    "AUGNES_DELTA_TYPES",
    "AUGNES_DELTA_STATUSES",
    "AUGNES_DELTA_SOURCES",
    "AugnesDelta",
    "DeltaBatch",
    "ResearchDiagnosticRef",
    "SnapshotRef",
    "DeltaMergePolicy",
    "AugnesDeltaAuthorityBoundary",
    "AugnesDeltaValidationSummary",
    "AugnesDeltaBudgetSummary",
  ];

  for (const exportName of requiredExports) {
    const exportPattern = new RegExp(
      `export\\s+(?:const|type|interface)\\s+${escapeRegExp(exportName)}\\b`,
    );
    assert(exportPattern.test(typeText), `${typeFile} must export ${exportName}`);
  }

  assert(
    /blocked_reason:\s*string;/.test(typeText),
    `${typeFile} must require DeltaMergePolicy.blocked_reason`,
  );
  assert(
    !/blocked_reason\?:/.test(typeText),
    `${typeFile} must not make DeltaMergePolicy.blocked_reason optional`,
  );

  assertContainsAll(
    typeText,
    [
      "perspective_delta",
      "research_delta",
      "handoff_delta",
      "manual_review_required",
      "auto_apply_working_memory_only",
      "can_call_github",
      "can_call_openai_or_provider",
      "can_execute_codex",
    ],
    { label: typeFile },
  );
}

function assertFixtureShape() {
  assert.equal(
    fixture.contract_version,
    "augnes_delta_contract.v0.1",
    `${fixtureFile} must declare contract version`,
  );
  assert.equal(fixture.scope, "project:augnes", `${fixtureFile} must declare scope`);
  assert(Array.isArray(fixture.batches), `${fixtureFile} must include batches`);
  assert(fixture.batches.length >= 1, `${fixtureFile} must include at least one batch`);

  const deltas = collectDeltas(fixture);
  assert(deltas.length >= 3, `${fixtureFile} must include at least three deltas`);
  assert(deltas.some((delta) => delta.type === "perspective_delta"), `${fixtureFile} must include perspective_delta`);
  assert(deltas.some((delta) => delta.type === "research_delta"), `${fixtureFile} must include research_delta`);
  assert(
    deltas.some((delta) => ["handoff_delta", "code_delta"].includes(delta.type)),
    `${fixtureFile} must include handoff_delta or code_delta`,
  );
  assert(
    deltas.some(
      (delta) =>
        Array.isArray(delta.diagnostic_refs) && delta.diagnostic_refs.length > 0,
    ),
    `${fixtureFile} must include at least one diagnostic_refs entry`,
  );
  assert(
    Array.isArray(fixture.snapshot_refs) && fixture.snapshot_refs.length > 0,
    `${fixtureFile} must include at least one SnapshotRef`,
  );
  assert(
    Array.isArray(fixture.evidence_refs) && fixture.evidence_refs.length > 0,
    `${fixtureFile} must include at least one EvidenceRef pointer`,
  );

  assertContainsAll(
    fixtureText,
    [
      "manual_mode_project_perspective",
      "autonomy_mode_working_memory_future_contract",
      "future explicit Autonomy Contract",
      "not truth",
      "not proof",
      "not approval",
      "not readiness",
      "not committed Perspective state",
    ],
    { label: fixtureFile },
  );
}

function assertAuthorityBoundary() {
  const boundaries = [
    fixture.authority_boundary,
    ...fixture.batches.map((batch) => batch.authority_boundary),
    ...collectDeltas(fixture).map((delta) => delta.authority_boundary),
  ];

  const deniedFields = [
    "can_execute_codex",
    "can_call_github",
    "can_call_openai_or_provider",
    "can_record_proof",
    "can_create_evidence",
    "can_merge",
    "can_publish_external",
    "can_retry_replay_deploy",
    "can_commit_or_reject_state",
    "can_mutate_memory",
    "can_apply_project_perspective",
    "can_update_work",
    "can_create_branch_or_pr",
  ];

  for (const boundary of boundaries) {
    assert(boundary, `${fixtureFile} must include authority boundary objects`);
    for (const field of deniedFields) {
      assert.equal(
        boundary[field],
        false,
        `${fixtureFile} authority boundary must not grant ${field}`,
      );
    }
  }
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
      `Unexpected changed or untracked file for AugnesDelta contract phase: ${file}`,
    );
    assert(!/^app\/api\//.test(file) || allowedRouteFiles.has(file), `AugnesDelta contract follow-on must not add API routes outside approved read routes: ${file}`);
    assert(!/^app\/.*route\.(ts|tsx|js|jsx)$/.test(file) || allowedRouteFiles.has(file), `AugnesDelta contract follow-on must not add route files outside approved read routes: ${file}`);
    assert(
      !/^components\//.test(file) ||
        followOnHumanSurfaceHomeFiles.includes(file) ||
      followOnPerspectiveHumanTimelineFiles.includes(file) ||
        followOnAgentWorkplaneFiles.includes(file) ||
        followOnAgentWorkplanePanelFiles.includes(file) ||
        followOnAgentWorkplaneProjectionHandoffFiles.includes(file),
      `AugnesDelta contract follow-on must not change UI files outside Phase 4A/4B Human Surface or Phase 5A/5B/5C Agent Workplane files: ${file}`,
    );
    assert(!/^db\//.test(file), `AugnesDelta contract follow-on must not change DB files: ${file}`);
    assert(!/^migrations\//.test(file), `AugnesDelta contract follow-on must not change migrations: ${file}`);
    assert(!/^apps\/augnes_apps\//.test(file), `AugnesDelta contract follow-on must not change MCP/App files: ${file}`);
    assert(!/(^|\/)(mcp|plugin|plugins|tool|tools)(\/|$)/i.test(file), `AugnesDelta contract follow-on must not change MCP/App tool files: ${file}`);
    assert(!/(^|\/)(provider|providers|openai|github)(\/|$)/i.test(file), `AugnesDelta contract follow-on must not change provider/OpenAI/GitHub runtime files: ${file}`);
    assert(!/(^|\/)(proof|evidence)(\/|$)/i.test(file), `AugnesDelta contract follow-on must not add proof/evidence write paths: ${file}`);
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
    git_diff_name_only_checked: workingTree.checked,
    follow_on_projection_files_allowed: followOnProjectionReadModelFiles,
    follow_on_projection_runtime_read_surface_files_allowed:
      followOnProjectionRuntimeReadSurfaceFiles,
    follow_on_current_working_perspective_files_allowed:
      followOnCurrentWorkingPerspectiveFiles,
    follow_on_current_working_perspective_runtime_read_surface_files_allowed:
      followOnCurrentWorkingPerspectiveRuntimeReadSurfaceFiles,
    follow_on_human_surface_home_files_allowed: followOnHumanSurfaceHomeFiles,
    follow_on_perspective_human_timeline_files_allowed:
      followOnPerspectiveHumanTimelineFiles,
    follow_on_agent_workplane_files_allowed: followOnAgentWorkplaneFiles,
    follow_on_agent_workplane_panel_files_allowed:
      followOnAgentWorkplanePanelFiles,
    follow_on_agent_workplane_projection_handoff_files_allowed:
      followOnAgentWorkplaneProjectionHandoffFiles,
    api_route_added: files.some((file) => allowedRouteFiles.has(file)),
    human_surface_ui_added: humanSurfaceUiAdded,
    agent_workplane_ui_added: agentWorkplaneUiAdded,
    ui_surface_added: humanSurfaceUiAdded || agentWorkplaneUiAdded,
    files,
  };
}

function collectDeltas(parsedFixture) {
  return parsedFixture.batches.flatMap((batch) => batch.deltas || []);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
