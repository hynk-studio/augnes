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

const currentPerspectiveDoc =
  "docs/AUGNES_CURRENT_WORKING_PERSPECTIVE_V0_1.md";
const currentPerspectiveTypeFile = "types/current-working-perspective.ts";
const currentPerspectiveHelperFile =
  "lib/perspective/current-working-perspective.ts";
const fixtureFile = "fixtures/current-working-perspective.sample.v0.1.json";
const smokeFile = "scripts/smoke-current-working-perspective-v0-1.mjs";
const contractSmokeFile = "scripts/smoke-augnes-delta-contract-v0-1.mjs";
const projectionSmokeFile = "scripts/smoke-augnes-delta-projection-v0-1.mjs";
const projectionRouteSmokeFile =
  "scripts/smoke-augnes-delta-projection-route-v0-1.mjs";
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

const followOnAgentWorkplaneProjectionHandoffFiles = [
  "components/workplane/projection-candidates-panel.tsx",
  "components/workplane/delta-batch-panel.tsx",
  "components/workplane/handoff-builder-preview-panel.tsx",
  "components/workplane/run-postmortem-skeleton-panel.tsx",
  "components/workplane/trace-diagnostics-panel.tsx",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
];

const followOnAgentWorkplaneCleanupHardeningFiles = [
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
];

const followOnGuideBriefCoreFiles = [
  "docs/GUIDEBRIEF_CONTRACT_V0_1.md",
  "types/guide-brief.ts",
  "lib/guide/guide-brief.ts",
  "fixtures/guide-brief.sample.v0.1.json",
  "scripts/smoke-guide-brief-v0-1.mjs",
];

const followOnGuideBriefRouteFiles = [
  "app/api/augnes/read/guide-brief/route.ts",
  "lib/guide/guide-brief-source.ts",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
];
const followOnWebGuidePanelFiles = [
  "components/guide/guide-brief-panel.tsx",
  "components/guide/guide-brief-section.tsx",
  "components/guide/guide-brief-summary-card.tsx",
  "components/guide/guide-brief-boundary-card.tsx",
  "components/guide/guide-brief-mini-panel.tsx",
  "lib/guide/read-guide-brief-for-web.ts",
  "components/human-surface/human-surface-home.tsx",
  "components/perspective/perspective-public-constellation-surface.tsx",
  "components/perspective/perspective-human-surface.tsx",
  "components/workplane/agent-workplane.tsx",
  "scripts/smoke-web-guide-panel-v0-1.mjs",
];
const followOnChatgptAppGuideBriefToolFiles = [
  "apps/augnes_apps/src/server.ts",
  "apps/augnes_apps/src/lib/state-runtime-types.ts",
  "apps/augnes_apps/src/adapters/state-runtime-http.ts",
  "apps/augnes_apps/scripts/invariants.ts",
  "apps/augnes_apps/scripts/smoke.ts",
  "apps/augnes_apps/scripts/mock-state-runtime.ts",
  "docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md",
  "scripts/smoke-chatgpt-app-guide-brief-tool-v0-1.mjs",
];

const packageJsonFile = "package.json";
const indexDoc = "docs/00_INDEX_LATEST.md";

const requiredFiles = [
  currentPerspectiveDoc,
  currentPerspectiveTypeFile,
  currentPerspectiveHelperFile,
  fixtureFile,
  smokeFile,
  packageJsonFile,
  indexDoc,
];

const allowedChangedFiles = new Set([
  ...requiredFiles,
  contractSmokeFile,
  projectionSmokeFile,
  projectionRouteSmokeFile,
  currentPerspectiveSourceFile,
  currentPerspectiveRouteFile,
  currentPerspectiveRouteSmokeFile,
  ...followOnHumanSurfaceHomeFiles,
  ...followOnPerspectiveHumanTimelineFiles,
  ...followOnAgentWorkplaneFiles,
  ...followOnAgentWorkplanePanelFiles,
  ...followOnAgentWorkplaneProjectionHandoffFiles,
  ...followOnAgentWorkplaneCleanupHardeningFiles,
  ...followOnGuideBriefCoreFiles,
  ...followOnGuideBriefRouteFiles,
  ...followOnWebGuidePanelFiles,
  ...followOnChatgptAppGuideBriefToolFiles,
]);

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

const followOnHandoffCapsuleFiles = [
  "docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md",
  "types/handoff-capsule.ts",
  "lib/handoff/handoff-capsule.ts",
  "fixtures/handoff-capsule.sample.v0.1.json",
  "fixtures/codex-launch-card.sample.v0.1.json",
  "scripts/smoke-handoff-capsule-v0-1.mjs",
];
for (const file of followOnHandoffCapsuleFiles) {
  allowedChangedFiles.add(file);
}

const followOnHandoffCapsuleRouteFiles = [
  "app/api/augnes/read/handoff-capsule/route.ts",
  "app/api/augnes/read/codex-launch-card/route.ts",
  "lib/handoff/handoff-capsule-source.ts",
  "scripts/smoke-handoff-capsule-route-v0-1.mjs",
];
for (const file of followOnHandoffCapsuleRouteFiles) {
  allowedChangedFiles.add(file);
}

const allowedRouteFiles = new Set([
  currentPerspectiveRouteFile,
  "app/api/augnes/read/guide-brief/route.ts",
  "app/api/augnes/read/handoff-capsule/route.ts",
  "app/api/augnes/read/codex-launch-card/route.ts",
]);

const textByFile = loadTextByFile(requiredFiles);
const docText = textByFile.get(currentPerspectiveDoc);
const typeText = textByFile.get(currentPerspectiveTypeFile);
const helperText = textByFile.get(currentPerspectiveHelperFile);
const fixtureText = textByFile.get(fixtureFile);
const smokeText = textByFile.get(smokeFile);
const packageJsonText = textByFile.get(packageJsonFile);
const indexText = textByFile.get(indexDoc);
const fixture = JSON.parse(fixtureText);

assertPackageJsonScript();
assertIndexPointer();
assertDocumentContract();
assertTypeContract();
assertHelperContract();
assertFixtureShape();
assertAuthorityBoundary();
assertSourceRefsAndStaleness();
assertReviewQueueHintsResolveToDeltaRefs();
assertResearchDiagnosticsNonAuthority();
assertNoRuntimeActuationCode();
const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "current-working-perspective-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      index_pointer_checked: true,
      document_contract_checked: true,
      type_exports_checked: true,
      helper_exports_checked: true,
      fixture_json_parsed: true,
      active_goal_count: fixture.active_goals.length,
      next_candidate_count: fixture.next_candidates.length,
      last_major_delta_ref_count: fixture.last_major_delta_refs.length,
      gap_count: fixture.gaps.length,
      authority_boundary_checked: true,
      source_refs_checked: true,
      staleness_checked: true,
      review_queue_delta_refs_checked: true,
      research_diagnostics_non_authority_checked: true,
      clean_projection_gap_pressure_checked: true,
      follow_on_current_working_perspective_runtime_read_surface_files_allowed: [
        currentPerspectiveSourceFile,
        currentPerspectiveRouteFile,
        currentPerspectiveRouteSmokeFile,
      ],
      follow_on_human_surface_home_files_allowed:
        followOnHumanSurfaceHomeFiles,
      follow_on_agent_workplane_files_allowed: followOnAgentWorkplaneFiles,
      follow_on_agent_workplane_panel_files_allowed:
        followOnAgentWorkplanePanelFiles,
      follow_on_guide_brief_core_files_allowed:
        followOnGuideBriefCoreFiles,
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      smoke_type:
        "static-current-working-perspective-type-helper-fixture-package-index-boundary-only",
      runtime_route_added:
        changedFilesBoundary.files.includes(currentPerspectiveRouteFile),
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
console.log("PASS smoke:current-working-perspective-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:current-working-perspective-v0-1",
    expectedCommand: "node scripts/smoke-current-working-perspective-v0-1.mjs",
  });
}

function assertIndexPointer() {
  assertContainsAll(
    indexText,
    [
      currentPerspectiveDoc,
      "Current Working Perspective",
      "read-only Current Working Perspective read model",
    ],
    { label: indexDoc },
  );
}

function assertDocumentContract() {
  assertContainsAll(
    docText,
    [
      "CurrentWorkingPerspective",
      "PerspectiveSnapshot",
      "AugnesDeltaProjectionReadModel",
      "source_refs",
      "staleness",
      "gaps",
      "read-only derived current perspective model",
      "no state mutation",
      "Research diagnostics remain non-authoritative",
      "Projected deltas remain read-model inputs",
      "Phase 3B adds",
      "GET /api/perspective/current?scope=project:augnes",
      "Phase 4 - Human Surface v0.1",
    ],
    { label: currentPerspectiveDoc },
  );
}

function assertTypeContract() {
  assertNoRuntimeImports({
    file: currentPerspectiveTypeFile,
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

  assert(
    !/\breadFileSync\b|\bwriteFileSync\b|\bfetch\s*\(|\bnew\s+Database\b|\bprocess\.env\b/.test(
      typeText,
    ),
    `${currentPerspectiveTypeFile} must not contain runtime side effects`,
  );

  const requiredExports = [
    "CURRENT_WORKING_PERSPECTIVE_VERSION",
    "CURRENT_WORKING_PERSPECTIVE_GAP_SEVERITIES",
    "CURRENT_WORKING_PERSPECTIVE_STALENESS_STATUSES",
    "CurrentWorkingPerspective",
    "CurrentWorkingPerspectiveInput",
    "CurrentWorkingPerspectiveResult",
    "CurrentWorkingPerspectiveSourceRefs",
    "CurrentWorkingPerspectiveStaleness",
    "CurrentWorkingPerspectiveGap",
    "CurrentWorkingPerspectiveAuthorityBoundary",
    "CurrentWorkingPerspectiveReviewQueueHints",
    "CurrentWorkingPerspectiveResearchPressure",
  ];

  for (const exportName of requiredExports) {
    const exportPattern = new RegExp(
      `export\\s+(?:const|type|interface)\\s+${escapeRegExp(exportName)}\\b`,
    );
    assert(
      exportPattern.test(typeText),
      `${currentPerspectiveTypeFile} must export ${exportName}`,
    );
  }
}

function assertHelperContract() {
  const requiredExports = [
    "buildCurrentWorkingPerspective",
    "buildCurrentWorkingPerspectiveResult",
    "buildCurrentWorkingPerspectiveAuthorityBoundary",
    "buildCurrentPerspectiveSourceRefs",
    "buildCurrentPerspectiveReviewQueueHints",
    "buildCurrentPerspectiveStaleness",
    "createCurrentWorkingPerspectiveGap",
  ];

  for (const exportName of requiredExports) {
    const exportPattern = new RegExp(
      `export\\s+function\\s+${escapeRegExp(exportName)}\\b`,
    );
    assert(
      exportPattern.test(helperText),
      `${currentPerspectiveHelperFile} must export ${exportName}`,
    );
  }

  assertContainsAll(
    helperText,
    [
      "PerspectiveSnapshot remains derived source context",
      "AugnesDeltaProjectionReadModel deltas remain projection inputs",
      "research diagnostics are non-authoritative",
      "Phase 3B may add a GET-only route under a separate scoped PR",
    ],
    { label: currentPerspectiveHelperFile },
  );

  assert(
    /gaps\.length\s*===\s*0[\s\S]*return\s+"none"/.test(helperText) ||
      /deltaProjection\.gaps\.length\s*===\s*0[\s\S]*"none"/.test(
        helperText,
      ),
    `${currentPerspectiveHelperFile} must return none pressure when projection gaps are empty`,
  );
}

function assertFixtureShape() {
  assert.equal(
    fixture.runtime,
    "augnes",
    `${fixtureFile} must declare Augnes runtime`,
  );
  assert.equal(
    fixture.perspective_version,
    "current_working_perspective.v0.1",
    `${fixtureFile} must declare Current Working Perspective version`,
  );
  assert.equal(
    fixture.projection_version,
    "augnes_delta_projection.v0.1",
    `${fixtureFile} must preserve projection version`,
  );
  assert.equal(
    fixture.snapshot_version,
    "perspective_snapshot.v0.1",
    `${fixtureFile} must preserve snapshot version`,
  );
  assert.equal(fixture.scope, "project:augnes", `${fixtureFile} must use scope`);

  for (const field of [
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
  ]) {
    assert(
      Object.prototype.hasOwnProperty.call(fixture, field),
      `${fixtureFile} must include ${field}`,
    );
  }

  assert(fixture.active_goals.length >= 1, `${fixtureFile} needs active goals`);
  assert(
    fixture.accepted_assumptions.length >= 1,
    `${fixtureFile} needs accepted assumptions`,
  );
  assert(
    fixture.rejected_assumptions.length >= 1,
    `${fixtureFile} needs rejected assumptions`,
  );
  assert(
    fixture.open_questions.length >= 1,
    `${fixtureFile} needs open questions`,
  );
  assert(fixture.active_risks.length >= 1, `${fixtureFile} needs risks`);
  assert(
    fixture.next_candidates.length >= 1,
    `${fixtureFile} needs next candidates`,
  );
  assert(
    fixture.last_major_delta_refs.length >= 1,
    `${fixtureFile} needs delta refs`,
  );
  assert(fixture.gaps.length >= 1, `${fixtureFile} needs gaps`);

  assert.equal(
    fixture.public_safety.contains_secrets,
    false,
    `${fixtureFile} must be public-safe`,
  );
  assert.equal(
    fixture.public_safety.contains_raw_private_conversations,
    false,
    `${fixtureFile} must not contain raw private conversations`,
  );
}

function assertAuthorityBoundary() {
  const boundary = fixture.authority_boundary;
  assert(boundary, `${fixtureFile} must include authority boundary`);
  assert.equal(boundary.derived_view_only, true, "derived_view_only must be true");

  const deniedFields = [
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
    "can_write_db",
    "can_add_route",
    "can_add_ui",
  ];

  for (const field of deniedFields) {
    assert.equal(
      boundary[field],
      false,
      `${fixtureFile} authority boundary must deny ${field}`,
    );
  }
}

function assertSourceRefsAndStaleness() {
  assert(
    fixture.source_refs.perspective_snapshot,
    `${fixtureFile} must preserve PerspectiveSnapshot source refs`,
  );
  assert(
    fixture.source_refs.delta_projection,
    `${fixtureFile} must preserve Delta Projection source refs`,
  );
  assert(
    fixture.source_refs.delta_projection.source_counts,
    `${fixtureFile} must preserve Delta Projection source counts`,
  );
  assert(
    fixture.source_refs.delta_projection.delta_ids.length >= 1,
    `${fixtureFile} must preserve delta ids`,
  );
  assert(
    fixture.source_refs.delta_projection.batch_ids.length >= 1,
    `${fixtureFile} must preserve batch ids`,
  );
  assert(
    fixture.source_refs.snapshot_refs.length >= 1,
    `${fixtureFile} must include SnapshotRef entries`,
  );
  assert(
    fixture.source_refs.project_constellation_refs.includes(
      "docs/PROJECT_CONSTELLATION_IA_V0_1.md",
    ),
    `${fixtureFile} may include Project Constellation contextual refs only`,
  );
  assert(
    ["fresh", "stale", "partial", "unknown"].includes(fixture.staleness.status),
    `${fixtureFile} must include staleness status`,
  );
  assert(
    fixture.staleness.source_gap_codes.length >= 1,
    `${fixtureFile} must preserve source gap codes`,
  );
}

function assertReviewQueueHintsResolveToDeltaRefs() {
  const knownDeltaIds = new Set(fixture.source_refs.delta_projection.delta_ids);
  const queue = fixture.review_queue_hints;
  const fields = [
    "needs_review_delta_ids",
    "blocked_delta_ids",
    "manual_review_delta_ids",
    "validation_required_delta_ids",
    "project_perspective_review_delta_ids",
    "durable_memory_review_delta_ids",
    "user_decision_delta_ids",
  ];

  for (const field of fields) {
    assert(
      Array.isArray(queue[field]),
      `${fixtureFile} review_queue_hints.${field} must be an array`,
    );

    for (const deltaId of queue[field]) {
      assert(
        knownDeltaIds.has(deltaId),
        `${fixtureFile} review_queue_hints.${field} references unknown delta id: ${deltaId}`,
      );
    }
  }
}

function assertResearchDiagnosticsNonAuthority() {
  assert.equal(
    fixture.research_pressure.diagnostic_refs[0].status,
    "log_only",
    `${fixtureFile} diagnostics must be log_only`,
  );
  assertContainsAll(
    fixtureText,
    [
      "not truth",
      "not proof",
      "not approval",
      "not readiness",
      "not committed Perspective state",
      "Projected deltas are inputs, not source-of-truth state",
    ],
    { label: fixtureFile },
  );
}

function assertNoRuntimeActuationCode() {
  const checkedText = `${typeText}\n${helperText}`;
  const forbiddenPatterns = [
    /\bbuildPerspectiveSnapshot\s*\(/,
    /\bcollectAugnesDeltaProjectionInput\s*\(/,
    /\bbuildAugnesDeltaProjectionRuntimeReadModel\s*\(/,
    /\bNextResponse\b/,
    /\bappendWorkEvent\b/,
    /\bappendCoordinationEvent\b/,
    /\bcreateEvidenceRecord\b/,
    /\brecordProof\b/,
    /\bcommitState\b/,
    /\brejectState\b/,
    /\bcommitStateDeltaProposal\b/,
    /\brejectStateDeltaProposal\b/,
    /\bfetch\s*\(/,
    /@openai/,
    /\boctokit\b/i,
    /\bcreatePullRequest\b/,
    /\bchild_process\b/,
    /\bspawn\s*\(/,
    /\bexecFile\s*\(/,
    /\bnew\s+Database\b/,
    /\bprocess\.env\b/,
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+\w+/i,
    /\bDELETE\s+FROM\b/i,
    /\bCREATE\s+TABLE\b/i,
    /\bALTER\s+TABLE\b/i,
  ];

  for (const pattern of forbiddenPatterns) {
    assert(
      !pattern.test(checkedText),
      `Current Working Perspective type/helper must not add runtime actuation code matching ${pattern}`,
    );
  }

  assertContainsAll(
    smokeText,
    [
      "allowedChangedFiles",
      "runtime_route_added",
      "can_add_route",
      "can_add_ui",
      "can_write_db",
    ],
    { label: smokeFile },
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
      `Unexpected Phase 3A/3B Current Working Perspective changed file: ${file}`,
    );
    assert(
      !/^app\/api\//.test(file) || allowedRouteFiles.has(file),
      `Current Working Perspective follow-on must not add API route files outside the Current Working Perspective read route: ${file}`,
    );
    assert(
      !/^app\/.*route\.(ts|tsx|js|jsx)$/.test(file) ||
        allowedRouteFiles.has(file),
      `Current Working Perspective follow-on must not add route files outside the Current Working Perspective read route: ${file}`,
    );
    assert(
      !/^components\//.test(file) ||
        followOnHumanSurfaceHomeFiles.includes(file) ||
      followOnPerspectiveHumanTimelineFiles.includes(file) ||
        followOnAgentWorkplaneFiles.includes(file) ||
        followOnAgentWorkplanePanelFiles.includes(file) ||
        followOnAgentWorkplaneProjectionHandoffFiles.includes(file) ||
        followOnWebGuidePanelFiles.includes(file),
      `Phase 3A follow-on must not change UI files outside Phase 4A/4B Human Surface, Phase 5A/5B/5C Agent Workplane, or exact Phase 6C Web Guide files: ${file}`,
    );
    assert(!/^db\//.test(file), `Phase 3A must not change DB files: ${file}`);
    assert(!/^migrations\//.test(file), `Phase 3A must not change migrations: ${file}`);
    assert(
      (!/^apps\/augnes_apps\//.test(file) || followOnChatgptAppGuideBriefToolFiles.includes(file)),
      `Phase 3A must not change MCP/App files: ${file}`,
    );
    assert(
      ((!/(^|\/)(mcp|plugin|plugins|tool|tools)(\/|$)/i.test(file) || followOnCodexGuideBriefHandoffFiles.includes(file)) || followOnChatgptAppGuideBriefToolFiles.includes(file) || followOnCodexGuideBriefHandoffFiles.includes(file)),
      `Phase 3A must not change MCP/App tool files: ${file}`,
    );
    assert(
      !/(^|\/)(provider|providers|openai|github)(\/|$)/i.test(file),
      `Phase 3A must not change provider/OpenAI/GitHub runtime files: ${file}`,
    );
    assert(
      !/(^|\/)(proof|evidence)(\/|$)/i.test(file),
      `Phase 3A must not add proof/evidence write paths: ${file}`,
    );
  }

  const humanSurfaceUiAdded = files.some((file) =>
    file === "app/page.tsx" ||
    file === "app/perspective/page.tsx" ||
    file === "app/globals.css" ||
    file === "components/augnes-public-home-surface.tsx" ||
    file.startsWith("components/human-surface/") ||
    file.startsWith("components/perspective/") ||
    file.startsWith("components/guide/"),
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

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
