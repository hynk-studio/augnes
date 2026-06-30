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

const projectionDoc = "docs/AUGNES_DELTA_PROJECTION_READ_MODEL_V0_1.md";
const projectionTypeFile = "types/augnes-delta-projection.ts";
const projectorFile = "lib/augnes-delta/projector.ts";
const fixtureFile = "fixtures/augnes-delta-projection.sample.v0.1.json";
const smokeFile = "scripts/smoke-augnes-delta-projection-v0-1.mjs";
const contractSmokeFile = "scripts/smoke-augnes-delta-contract-v0-1.mjs";
const sourceCollectorFile = "lib/augnes-delta/source-collector.ts";
const routeFile = "app/api/augnes/read/deltas/route.ts";
const routeSmokeFile = "scripts/smoke-augnes-delta-projection-route-v0-1.mjs";
const packageJsonFile = "package.json";
const indexDoc = "docs/00_INDEX_LATEST.md";

const requiredFiles = [
  projectionDoc,
  projectionTypeFile,
  projectorFile,
  fixtureFile,
  smokeFile,
  contractSmokeFile,
  packageJsonFile,
  indexDoc,
];

const allowedChangedFiles = new Set(requiredFiles);
const followOnProjectionRuntimeReadSurfaceFiles = [
  sourceCollectorFile,
  routeFile,
  routeSmokeFile,
];

for (const file of followOnProjectionRuntimeReadSurfaceFiles) {
  allowedChangedFiles.add(file);
}

const allowedRouteFiles = new Set([routeFile]);

const textByFile = loadTextByFile(requiredFiles);
const projectionDocText = textByFile.get(projectionDoc);
const projectionTypeText = textByFile.get(projectionTypeFile);
const projectorText = textByFile.get(projectorFile);
const fixtureText = textByFile.get(fixtureFile);
const indexText = textByFile.get(indexDoc);
const packageJsonText = textByFile.get(packageJsonFile);
const fixture = JSON.parse(fixtureText);

assertPackageJsonScript();
assertIndexPointer();
assertProjectionDoc();
assertProjectionTypes();
assertProjectorExports();
assertFixtureShape();
assertCanonicalDeltaSynchronization();
assertSeparateTraceGapReporting();
assertAuthorityBoundaries();
assertConservativeMergePolicies();
assertPointerOnlyRefs();
assertNoRuntimeActuationCode();
const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "augnes-delta-projection-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      index_pointer_checked: true,
      projection_doc_checked: true,
      projection_type_exports_checked: true,
      projector_exports_checked: true,
      fixture_json_parsed: true,
      batch_count: fixture.batches.length,
      delta_count: collectDeltas(fixture).length,
      gap_count: fixture.gaps.length,
      canonical_delta_synchronization_checked: true,
      separate_trace_gap_reporting_checked: true,
      authority_boundary_checked: true,
      conservative_merge_policy_checked: true,
      pointer_only_refs_checked: true,
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      follow_on_projection_runtime_read_surface_files_allowed:
        followOnProjectionRuntimeReadSurfaceFiles,
      smoke_type: "static-projection-read-model-type-helper-fixture-package-index-boundary-only",
      runtime_behavior_changed: changedFilesBoundary.api_route_added,
      ui_behavior_changed: false,
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
      memory_mutation_added: false,
      product_write_behavior_added: false,
      autonomy_runner_added: false,
      external_side_effect_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:augnes-delta-projection-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:augnes-delta-projection-v0-1",
    expectedCommand: "node scripts/smoke-augnes-delta-projection-v0-1.mjs",
  });
}

function assertIndexPointer() {
  assertContainsAll(
    indexText,
    [projectionDoc, "read-only Augnes Delta projection read-model"],
    { label: indexDoc },
  );
}

function assertProjectionDoc() {
  assertContainsAll(
    projectionDocText,
    [
      "AugnesDeltaProjectionReadModel",
      "AugnesDelta",
      "DeltaBatch",
      "source_refs",
      "source_counts",
      "gaps",
      "read-only projection",
      "authority boundary",
      "conservative merge policy",
      "no state mutation",
    ],
    { label: projectionDoc },
  );
}

function assertProjectionTypes() {
  assertNoRuntimeImports({
    file: projectionTypeFile,
    text: projectionTypeText,
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
      projectionTypeText,
    ),
    `${projectionTypeFile} must not contain runtime side effects`,
  );

  const requiredExports = [
    "AUGNES_DELTA_PROJECTION_VERSION",
    "AugnesDeltaProjectionReadModel",
    "AugnesDeltaProjectionSourceRefs",
    "AugnesDeltaProjectionSourceCounts",
    "AugnesDeltaProjectionGap",
    "AugnesDeltaProjectionGapSeverity",
    "AugnesDeltaProjectionOptions",
    "AugnesDeltaProjectionAuthorityBoundary",
    "AugnesDeltaProjectionInput",
    "AugnesDeltaProjectionSourceKind",
    "AugnesDeltaProjectionResult",
  ];

  for (const exportName of requiredExports) {
    const exportPattern = new RegExp(
      `export\\s+(?:const|type|interface)\\s+${escapeRegExp(exportName)}\\b`,
    );
    assert(
      exportPattern.test(projectionTypeText),
      `${projectionTypeFile} must export ${exportName}`,
    );
  }
}

function assertProjectorExports() {
  const requiredExports = [
    "buildAugnesDeltaProjectionReadModel",
    "projectStateDeltaProposalToDelta",
    "projectWorkEventToDelta",
    "projectCoordinationEventToDelta",
    "projectActionRecordToDelta",
    "projectEvidenceRecordToDelta",
    "buildDefaultDeltaProjectionAuthorityBoundary",
    "buildDefaultDeltaAuthorityBoundary",
    "buildBlockedProjectionMergePolicy",
    "buildManualProjectionMergePolicy",
    "buildPointerEvidenceRef",
    "buildPointerArtifactRef",
    "buildPointerHandoffRef",
    "buildProjectionBatch",
    "createProjectionGap",
  ];

  for (const exportName of requiredExports) {
    const exportPattern = new RegExp(
      `export\\s+function\\s+${escapeRegExp(exportName)}\\b`,
    );
    assert(
      exportPattern.test(projectorText),
      `${projectorFile} must export ${exportName}`,
    );
  }
}

function assertFixtureShape() {
  assert.equal(
    fixture.projection_version,
    "augnes_delta_projection.v0.1",
    `${fixtureFile} must declare projection version`,
  );
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
  assert(
    deltas.some((delta) => delta.source === "state_delta_proposal"),
    `${fixtureFile} must include state_delta_proposal source example`,
  );
  assert(
    deltas.some((delta) => delta.source === "work_event"),
    `${fixtureFile} must include work_event source example`,
  );
  assert(
    deltas.some((delta) => delta.source === "coordination_event"),
    `${fixtureFile} must include coordination_event source example`,
  );
  assert(
    deltas.some((delta) => ["validation_delta", "handoff_delta"].includes(delta.type)),
    `${fixtureFile} must include validation_delta or handoff_delta`,
  );
  assert(Array.isArray(fixture.gaps), `${fixtureFile} must include gaps`);
  assert(fixture.gaps.length >= 1, `${fixtureFile} must include at least one gap`);
  assert(
    fixture.source_refs &&
      Array.isArray(fixture.source_refs.state_delta_proposal_ids) &&
      Array.isArray(fixture.source_refs.work_event_ids) &&
      Array.isArray(fixture.source_refs.coordination_event_ids),
    `${fixtureFile} must include source refs for core source examples`,
  );
  assert(
    fixture.source_counts &&
      fixture.source_counts.state_delta_proposals >= 1 &&
      fixture.source_counts.work_events >= 1 &&
      fixture.source_counts.coordination_events >= 1,
    `${fixtureFile} must include source counts for core source examples`,
  );
}

function assertCanonicalDeltaSynchronization() {
  assert(Array.isArray(fixture.deltas), `${fixtureFile} must include top-level deltas`);
  const batchDeltas = fixture.batches.flatMap((batch) => batch.deltas ?? []);
  const topLevelIds = fixture.deltas.map((delta) => delta.delta_id);
  const batchIds = batchDeltas.map((delta) => delta.delta_id);

  assert.deepEqual(
    topLevelIds,
    batchIds,
    `${fixtureFile} top-level delta IDs must match batch delta IDs in order`,
  );
  assert.deepEqual(
    fixture.deltas,
    batchDeltas,
    `${fixtureFile} top-level deltas must be canonical copies of batch deltas`,
  );
  assert.equal(
    fixture.source_counts.total_projected_deltas,
    fixture.deltas.length,
    `${fixtureFile} source_counts.total_projected_deltas must match canonical top-level deltas`,
  );
}

function assertSeparateTraceGapReporting() {
  const gapCodes = new Set(fixture.gaps.map((gap) => gap.code));

  assert(
    projectorText.includes("handoff_traces_not_available"),
    `${projectorFile} must report missing handoff traces separately`,
  );
  assert(
    projectorText.includes("codex_result_traces_not_available"),
    `${projectorFile} must report missing Codex result traces separately`,
  );
  assert(
    !projectorText.includes("handoff_codex_result_traces_not_available"),
    `${projectorFile} must not collapse handoff and Codex trace gaps into one code`,
  );
  assert(
    !gapCodes.has("handoff_codex_result_traces_not_available"),
    `${fixtureFile} must not use a combined handoff/Codex trace gap`,
  );

  if (fixture.source_counts.handoff_traces === 0) {
    assert(
      gapCodes.has("handoff_traces_not_available"),
      `${fixtureFile} must include handoff_traces_not_available when handoff_traces count is zero`,
    );
  }

  if (fixture.source_counts.codex_result_traces === 0) {
    assert(
      gapCodes.has("codex_result_traces_not_available"),
      `${fixtureFile} must include codex_result_traces_not_available when codex_result_traces count is zero`,
    );
  }

  assert.equal(
    fixture.source_counts.total_gaps,
    fixture.gaps.length,
    `${fixtureFile} source_counts.total_gaps must match gaps length`,
  );
}

function assertAuthorityBoundaries() {
  const boundaries = collectObjectsByKey(fixture, "authority_boundary");
  assert(boundaries.length >= 3, `${fixtureFile} must include authority boundaries`);

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
  ];

  for (const boundary of boundaries) {
    for (const field of deniedFields) {
      assert.equal(boundary[field], false, `${field} must be false in authority boundary`);
    }
  }
}

function assertConservativeMergePolicies() {
  const policies = collectObjectsByKey(fixture, "merge_policy");
  assert(policies.length >= 3, `${fixtureFile} must include merge policies`);

  for (const policy of policies) {
    assert.equal(
      typeof policy.blocked_reason,
      "string",
      "every merge_policy must include blocked_reason",
    );
    assert(policy.blocked_reason.length > 0, "blocked_reason must not be empty");
    assert.equal(policy.allowed_auto_apply, false, "allowed_auto_apply must be false");
    assert.equal(
      policy.durable_memory_allowed,
      false,
      "durable_memory_allowed must be false",
    );
    assert.equal(
      policy.project_perspective_allowed,
      false,
      "project_perspective_allowed must be false",
    );
    assert.equal(
      policy.external_side_effect_allowed,
      false,
      "external_side_effect_allowed must be false",
    );
  }
}

function assertPointerOnlyRefs() {
  const evidenceRefs = collectObjectsWithProperty(fixture, "evidence_ref");
  const artifactRefs = collectObjectsWithProperty(fixture, "artifact_ref");
  const handoffRefs = collectObjectsWithProperty(fixture, "handoff_ref");

  assert(evidenceRefs.length >= 1, `${fixtureFile} must include EvidenceRef pointer`);
  assert(artifactRefs.length >= 1, `${fixtureFile} must include ArtifactRef pointer`);
  assert(handoffRefs.length >= 1, `${fixtureFile} must include HandoffRef pointer`);

  for (const ref of evidenceRefs) {
    assert.equal(ref.pointer_semantics, "pointer_only", "EvidenceRef must be pointer_only");
    assert.equal(
      ref.proof_write_authority,
      false,
      "EvidenceRef proof write authority must be false",
    );
    assert.equal(
      ref.evidence_write_authority,
      false,
      "EvidenceRef evidence write authority must be false",
    );
  }

  for (const ref of artifactRefs) {
    assert.equal(ref.pointer_semantics, "pointer_only", "ArtifactRef must be pointer_only");
    assert.equal(ref.source_of_truth, false, "ArtifactRef source_of_truth must be false");
  }

  for (const ref of handoffRefs) {
    assert.equal(ref.pointer_semantics, "pointer_only", "HandoffRef must be pointer_only");
    assert.equal(
      ref.execution_authority,
      false,
      "HandoffRef execution_authority must be false",
    );
    assert.equal(
      ref.external_send_authority,
      false,
      "HandoffRef external_send_authority must be false",
    );
  }
}

function assertNoRuntimeActuationCode() {
  const checkedRuntimeText = `${projectionTypeText}\n${projectorText}`;
  const forbiddenPatterns = [
    /\bappendWorkEvent\b/,
    /\bappendCoordinationEvent\b/,
    /\bcreateEvidenceRecord\b/,
    /\binsertEvidence\b/,
    /\brecordProof\b/,
    /\bcommitState\b/,
    /\brejectState\b/,
    /\bcommitStateDeltaProposal\b/,
    /\brejectStateDeltaProposal\b/,
    /\bcommitStateUpdate\b/,
    /\bfetch\s*\(/,
    /@openai/,
    /\boctokit\b/i,
    /\bcreatePullRequest\b/,
    /\bchild_process\b/,
    /\bspawn\s*\(/,
    /\bexecFile\s*\(/,
    /\brandomUUID\b/,
    /\bnew\s+Database\b/,
    /\bprocess\.env\b/,
  ];

  for (const pattern of forbiddenPatterns) {
    assert(
      !pattern.test(checkedRuntimeText),
      `Projection type/helper must not add runtime actuation code matching ${pattern}`,
    );
  }
}

function assertChangedFileBoundary() {
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
      `Unexpected Phase 2A/review-fix changed file: ${file}`,
    );
    assert(
      !/^app\/api\//.test(file) || allowedRouteFiles.has(file),
      `Phase 2A follow-on must not add API route files outside the Delta Projection read route: ${file}`,
    );
    assert(
      !/^app\/.*route\.(ts|tsx|js|jsx)$/.test(file) ||
        allowedRouteFiles.has(file),
      `Phase 2A follow-on must not add route files outside the Delta Projection read route: ${file}`,
    );
    assert(!/^components\//.test(file), `Phase 2A must not change UI files: ${file}`);
    assert(!/^db\//.test(file), `Phase 2A must not change DB files: ${file}`);
    assert(!/^migrations\//.test(file), `Phase 2A must not change migrations: ${file}`);
    assert(
      !/^apps\/augnes_apps\//.test(file),
      `Phase 2A must not change MCP/App files: ${file}`,
    );
    assert(
      !/(^|\/)(mcp|plugin|plugins|tool|tools)(\/|$)/i.test(file),
      `Phase 2A must not change MCP/App tool files: ${file}`,
    );
    assert(
      !/(^|\/)(provider|providers|openai|github)(\/|$)/i.test(file),
      `Phase 2A must not change provider/OpenAI/GitHub runtime files: ${file}`,
    );
    assert(
      !/(^|\/)(proof|evidence)(\/|$)/i.test(file),
      `Phase 2A must not add proof/evidence write paths: ${file}`,
    );
  }

  return {
    checked: workingTree.checked || baseRange.checked,
    skipped: !(workingTree.checked || baseRange.checked),
    skip_reason:
      workingTree.checked || baseRange.checked
        ? null
        : "changed-file boundary could not be checked",
    api_route_added: files.some((file) => allowedRouteFiles.has(file)),
    files,
  };
}

function collectDeltas(model) {
  const topLevel = Array.isArray(model.deltas) ? model.deltas : [];
  const fromBatches = Array.isArray(model.batches)
    ? model.batches.flatMap((batch) => batch.deltas ?? [])
    : [];
  const byId = new Map();

  for (const delta of [...topLevel, ...fromBatches]) {
    byId.set(delta.delta_id, delta);
  }

  return [...byId.values()];
}

function collectObjectsByKey(value, key) {
  const matches = [];

  visit(value, (node) => {
    if (node && typeof node === "object" && !Array.isArray(node) && node[key]) {
      matches.push(node[key]);
    }
  });

  return matches;
}

function collectObjectsWithProperty(value, property) {
  const matches = [];

  visit(value, (node) => {
    if (
      node &&
      typeof node === "object" &&
      !Array.isArray(node) &&
      Object.prototype.hasOwnProperty.call(node, property)
    ) {
      matches.push(node);
    }
  });

  return matches;
}

function visit(value, visitor) {
  visitor(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      visit(item, visitor);
    }
    return;
  }

  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      visit(item, visitor);
    }
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
