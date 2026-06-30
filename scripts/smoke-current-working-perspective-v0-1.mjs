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
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      smoke_type:
        "static-current-working-perspective-type-helper-fixture-package-index-boundary-only",
      runtime_route_added: false,
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
      "Phase 3B may add a GET-only read-only route",
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
      `Unexpected Phase 3A Current Working Perspective changed file: ${file}`,
    );
    assert(!/^app\/api\//.test(file), `Phase 3A must not add API route files: ${file}`);
    assert(
      !/^app\/.*route\.(ts|tsx|js|jsx)$/.test(file),
      `Phase 3A must not add route files: ${file}`,
    );
    assert(!/^components\//.test(file), `Phase 3A must not change UI files: ${file}`);
    assert(!/^db\//.test(file), `Phase 3A must not change DB files: ${file}`);
    assert(!/^migrations\//.test(file), `Phase 3A must not change migrations: ${file}`);
    assert(
      !/^apps\/augnes_apps\//.test(file),
      `Phase 3A must not change MCP/App files: ${file}`,
    );
    assert(
      !/(^|\/)(mcp|plugin|plugins|tool|tools)(\/|$)/i.test(file),
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
    files,
  };
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
