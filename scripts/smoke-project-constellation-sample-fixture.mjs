import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertNoRuntimeImports,
  assertPackageScript,
  loadTextByFile,
  normalizeText,
} from "./smoke-boundary-common.mjs";

const fixtureFile =
  "fixtures/project-constellation.sample.sidecar-strategy-c-v0.1.json";
const projectDoc = "docs/PROJECT_CONSTELLATION_IA_V0_1.md";
const capsuleDoc = "docs/PERSPECTIVE_CAPSULE_CONTRACT_V0_1.md";
const codexAuthorityDoc = "docs/CODEX_SDK_EXECUTION_AUTHORITY_DESIGN_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-project-constellation-sample-fixture.mjs";
const codexAuthoritySmokeFile =
  "scripts/smoke-codex-sdk-execution-authority-design.mjs";

const inspectedFiles = [
  fixtureFile,
  projectDoc,
  capsuleDoc,
  codexAuthorityDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
];

const allowedChangedFiles = new Set(inspectedFiles);
allowedChangedFiles.add(codexAuthoritySmokeFile);
const textByFile = loadTextByFile(inspectedFiles);
const fixture = JSON.parse(textByFile.get(fixtureFile));

const allowedTopLevelKeys = new Set([
  "version",
  "status",
  "authority",
  "formation_mode",
  "source_use_case",
  "source_scope",
  "nodes",
  "edges",
  "clusters",
  "perspective_capsule_preview",
  "codex_execution_authority_preview",
  "non_goals",
  "forbidden_actions",
]);

const allowedNodeTypes = new Set([
  "project",
  "work_unit",
  "document",
  "concept",
  "decision",
  "tension",
  "evidence_pointer",
  "validation_result",
  "constraint",
  "next_move",
  "capsule_preview",
  "execution_authority_preview",
]);

const allowedEdgeTypes = new Set([
  "supports",
  "evidence_for",
  "evidence_against",
  "derived_from",
  "depends_on",
  "refines",
  "validates",
  "conflicts_with",
  "warns_against",
  "blocks",
  "next_candidate",
  "supersedes",
  "belongs_to",
  "adjacent_to",
]);

const requiredNodeLabels = [
  "lab evidence baseline",
  "grounded/quiet probe",
  "first fixture subset",
  "manifest routing",
  "manifest hardening",
  "closeout decision",
  "AG Resume isolation constraint",
  "Project Constellation IA next direction",
];

const requiredEdges = [
  {
    source: "node.grounded_quiet_probe",
    target: "node.first_fixture_subset",
    allowedTypes: ["derived_from", "supports"],
  },
  {
    source: "node.first_fixture_subset",
    target: "node.manifest_routing",
    allowedTypes: ["depends_on", "refines"],
  },
  {
    source: "node.manifest_routing",
    target: "node.manifest_hardening",
    allowedTypes: ["validates", "refines"],
  },
  {
    source: "node.manifest_hardening",
    target: "node.closeout_decision",
    allowedTypes: ["supports"],
  },
  {
    source: "node.ag_resume_isolation_constraint",
    target: "node.project_constellation_ia_next_direction",
    allowedTypes: ["warns_against"],
  },
  {
    source: "node.closeout_decision",
    target: "node.project_constellation_ia_next_direction",
    allowedTypes: ["next_candidate"],
  },
];

const capsuleRequiredFields = [
  "capsule_id",
  "capsule_version",
  "source_surface",
  "source_scope",
  "source_constellation_ref",
  "formation_mode",
  "thesis",
  "selected_nodes",
  "selected_edges",
  "evidence_pointers",
  "unresolved_tensions",
  "boundaries",
  "forbidden_actions",
  "next_action_candidates",
  "target_surface",
  "codex_handoff_packet",
  "required_checks",
  "skipped_check_policy",
  "browser_computer_use_expectation",
  "proof_only_closeout_status_or_skip",
  "final_report_requirements",
  "user_pm_judgment_questions",
  "assumptions",
  "blockers_or_risks",
];

const handoffPacketRequiredFields = [
  "repo",
  "base_branch",
  "task_goal",
  "expected_changed_files",
  "forbidden_changed_files",
  "hard_constraints",
  "required_checks",
  "final_report_requirements",
];

const expectedChangedFiles = [
  fixtureFile,
  smokeFile,
  packageJsonFile,
  projectDoc,
  capsuleDoc,
  codexAuthorityDoc,
  indexDoc,
];

assertPackageJsonScript();
assertSmokeScriptBoundary();
assertTopLevelBoundary();
assertPublicSafeFixture();
assertNodes();
assertEdges();
assertCluster();
assertPerspectiveCapsulePreview();
assertCodexExecutionAuthorityPreview();
assertNonGoalsAndForbiddenActions();
assertDocPointers();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "project-constellation-sample-fixture",
      pass: true,
      boundary_smoke_mode: changedFilesBoundary.mode,
      fixture_checked: fixtureFile,
      docs_checked: [projectDoc, capsuleDoc, codexAuthorityDoc, indexDoc],
      package_script_checked: true,
      required_nodes_checked: requiredNodeLabels.length,
      required_edges_checked: requiredEdges.length,
      required_cluster_checked: true,
      capsule_preview_checked: true,
      codex_execution_authority_preview_checked: true,
      public_safe_strings_checked: true,
      changed_files_boundary_checked: changedFilesBoundary.checked,
      changed_files_boundary_skipped: changedFilesBoundary.skipped,
      changed_files_boundary_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_checked: changedFilesBoundary.files,
      changed_files_observed: changedFilesBoundary.files,
      changed_files_base_ref: changedFilesBoundary.base_ref,
      changed_files_base_range_checked: changedFilesBoundary.base_range_checked,
      changed_files_base_range_skipped: changedFilesBoundary.base_range_skipped,
      changed_files_working_tree_checked:
        changedFilesBoundary.working_tree_checked,
      untracked_files_checked: changedFilesBoundary.untracked_checked,
      untracked_files_skipped: changedFilesBoundary.untracked_skipped,
      untracked_files_skip_reason: changedFilesBoundary.untracked_skip_reason,
      smoke_type: "static-fixture-boundary-only",
      runtime_behavior_changed: false,
      project_constellation_runtime_behavior_changed: false,
      graph_db_added: false,
      persistence_added: false,
      api_route_behavior_changed: false,
      mcp_app_tool_changes_added: false,
      codex_sdk_import_added: false,
      codex_sdk_call_added: false,
      provider_implementation_added: false,
      proof_evidence_writes_added: false,
      ag_resume_behavior_changed: false,
      qp_evidence_created: false,
      z_t_commits: false,
      merge_publish_authority_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:project-constellation-sample-fixture");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:project-constellation-sample-fixture",
    expectedCommand: "node scripts/smoke-project-constellation-sample-fixture.mjs",
  });
}

function assertSmokeScriptBoundary() {
  const script = textByFile.get(smokeFile);
  assertNoRuntimeImports({
    file: smokeFile,
    text: script,
    forbiddenImports: [
      "@openai/codex-sdk",
      "openai_codex",
      "app/",
      "components/",
      "lib/",
      "db/",
      "migrations/",
      "apps/augnes_apps/",
      "reports/",
      "screenshots/",
    ],
  });
}

function assertTopLevelBoundary() {
  assertObject(fixture, "$");
  assertOnlyKeys(fixture, allowedTopLevelKeys, "$");
  assert.equal(fixture.version, "project_constellation_sample.v0.1");
  assert.equal(fixture.status, "sample_fixture_only");
  assert.equal(fixture.authority, "read_only_non_authoritative");
  assert.equal(fixture.formation_mode, "work_unit_constellation");
  assert.equal(fixture.source_use_case, "sidecar_et_strategy_c_first_slice");
  assertObject(fixture.source_scope, "$.source_scope");
  assert(Array.isArray(fixture.nodes), "$.nodes must be an array");
  assert(Array.isArray(fixture.edges), "$.edges must be an array");
  assert(Array.isArray(fixture.clusters), "$.clusters must be an array");
}

function assertPublicSafeFixture() {
  const strings = collectStrings(fixture);
  for (const { value, path } of strings) {
    assertNoUnsafeString(value, path);
  }
  const fixtureText = textByFile.get(fixtureFile);
  assert(!/action_records/i.test(fixtureText), "fixture must not represent action_records");
  assert(
    !/verification_evidence_records/i.test(fixtureText),
    "fixture must not represent verification_evidence_records",
  );
  assert(!/bridge rows/i.test(fixtureText), "fixture must not represent bridge rows");
  assertNoUnnegatedFixturePhrase("proof/evidence/readiness writes");
  assertNoUnnegatedFixturePhrase("QP evidence");
  assertNoUnnegatedFixturePhrase("z_t commit");
  assertNoUnnegatedFixturePhrase("AG Resume writer/helper/route");
  assertNoRuntimeSidecarComputedTrue(fixture, "$");
}

function assertNodes() {
  const nodeIds = new Set();
  const nodeLabels = new Set();
  for (const [index, node] of fixture.nodes.entries()) {
    const path = `$.nodes[${index}]`;
    assertObject(node, path);
    assertSafeString(node.id, `${path}.id`);
    assert(!nodeIds.has(node.id), `${path}.id must be unique`);
    nodeIds.add(node.id);
    assert(allowedNodeTypes.has(node.type), `${path}.type is unsupported`);
    nodeLabels.add(node.label);
    for (const field of [
      "label",
      "summary",
      "source_refs",
      "boundary_notes",
      "evidence_pointers",
      "unresolved_tensions",
      "next_action_candidates",
    ]) {
      assert(Object.hasOwn(node, field), `${path} must include ${field}`);
    }
    for (const arrayField of [
      "source_refs",
      "boundary_notes",
      "evidence_pointers",
      "unresolved_tensions",
      "next_action_candidates",
    ]) {
      assert(
        Array.isArray(node[arrayField]),
        `${path}.${arrayField} must be an array`,
      );
    }
  }
  for (const label of requiredNodeLabels) {
    assert(nodeLabels.has(label), `${fixtureFile} must include node: ${label}`);
  }
}

function assertEdges() {
  const nodeIds = new Set(fixture.nodes.map((node) => node.id));
  const edgeIds = new Set();
  for (const [index, edge] of fixture.edges.entries()) {
    const path = `$.edges[${index}]`;
    assertObject(edge, path);
    assertSafeString(edge.id, `${path}.id`);
    assert(!edgeIds.has(edge.id), `${path}.id must be unique`);
    edgeIds.add(edge.id);
    assert(allowedEdgeTypes.has(edge.type), `${path}.type is unsupported`);
    assert(nodeIds.has(edge.source), `${path}.source must reference a node`);
    assert(nodeIds.has(edge.target), `${path}.target must reference a node`);
    assert(Array.isArray(edge.boundary_notes), `${path}.boundary_notes must be an array`);
    assert(
      Array.isArray(edge.evidence_pointers),
      `${path}.evidence_pointers must be an array`,
    );
  }

  for (const requiredEdge of requiredEdges) {
    const match = fixture.edges.find(
      (edge) =>
        edge.source === requiredEdge.source &&
        edge.target === requiredEdge.target &&
        requiredEdge.allowedTypes.includes(edge.type),
    );
    assert(
      match,
      `Missing required edge ${requiredEdge.source} -> ${requiredEdge.target}`,
    );
  }
}

function assertCluster() {
  const cluster = fixture.clusters.find(
    (entry) => entry.id === "cluster.sidecar_strategy_c_first_slice",
  );
  assert(cluster, "fixture must include cluster.sidecar_strategy_c_first_slice");
  assert.equal(cluster.label, "Sidecar e_t Strategy C first slice");
  for (const field of [
    "node_ids",
    "edge_ids",
    "cluster_thesis",
    "unresolved_tensions",
    "next_action_candidates",
    "boundaries",
  ]) {
    assert(Object.hasOwn(cluster, field), `cluster must include ${field}`);
  }
  const nodeIds = new Set(fixture.nodes.map((node) => node.id));
  const edgeIds = new Set(fixture.edges.map((edge) => edge.id));
  for (const nodeId of cluster.node_ids) {
    assert(nodeIds.has(nodeId), `cluster node_id must reference a node: ${nodeId}`);
  }
  for (const edgeId of cluster.edge_ids) {
    assert(edgeIds.has(edgeId), `cluster edge_id must reference an edge: ${edgeId}`);
  }
}

function assertPerspectiveCapsulePreview() {
  const capsule = fixture.perspective_capsule_preview;
  assertObject(capsule, "$.perspective_capsule_preview");
  for (const field of capsuleRequiredFields) {
    assert(Object.hasOwn(capsule, field), `capsule preview must include ${field}`);
  }
  assert.equal(capsule.source_surface, "project_constellation");
  assert.equal(capsule.formation_mode, "work_unit_constellation");
  assert.equal(capsule.target_surface, "codex_handoff");
  assertReferencesKnown(capsule.selected_nodes, fixture.nodes, "selected_nodes");
  assertReferencesKnown(capsule.selected_edges, fixture.edges, "selected_edges");
  assertHandoffPacket(capsule.codex_handoff_packet);
}

function assertHandoffPacket(packet) {
  assertObject(packet, "$.perspective_capsule_preview.codex_handoff_packet");
  for (const field of handoffPacketRequiredFields) {
    assert(Object.hasOwn(packet, field), `codex_handoff_packet must include ${field}`);
  }
  assert.equal(packet.repo, "hynk-studio/augnes");
  assert.equal(packet.base_branch, "main");
  assert.match(packet.task_goal, /sample fixture \/ smoke only/i);
  assert.deepEqual(packet.expected_changed_files, expectedChangedFiles);
  assertContainsAll(packet.hard_constraints.join("\n"), [
    "fixture/smoke/docs/package-pointer only",
    "no live Codex SDK call",
    "no provider implementation",
    "no proof/evidence/readiness writes",
  ], { label: "codex_handoff_packet hard_constraints" });
}

function assertCodexExecutionAuthorityPreview() {
  const preview = fixture.codex_execution_authority_preview;
  assertObject(preview, "$.codex_execution_authority_preview");
  assert.equal(preview.execution_intent, "docs_smoke_fixture_validation");
  assert.equal(preview.recommended_permission_profile, "workspace_write");
  assert.equal(preview.planning_review_permission, "read_only");
  assert.equal(preview.escalation_required, false);
  assert.deepEqual(preview.forbidden_escalations, [
    "full_access",
    "danger_full_access",
  ]);
  assert.equal(preview.user_approval_required, false);
  assert.equal(preview.evidence_pointer_semantics, "pointer_only");
  assert.equal(preview.live_sdk_call, false);
  assert.equal(preview.provider_implementation, false);
  assert.equal(preview.runtime_execution, false);
  assertContainsAll(preview.boundary_notes.join("\n"), [
    "conceptual only",
    "no live Codex SDK call",
    "no provider implementation",
    "no TypeScript execution types",
    "no proof/evidence write",
    "no AG Resume update",
    "no Project Constellation runtime node update",
  ], { label: "codex_execution_authority_preview boundary_notes" });
}

function assertNonGoalsAndForbiddenActions() {
  const combined = [
    ...fixture.non_goals,
    ...fixture.forbidden_actions,
    ...fixture.perspective_capsule_preview.forbidden_actions,
  ].join("\n");
  assertContainsAll(combined, [
    "no Project Constellation runtime behavior",
    "no graph DB",
    "no persistence",
    "no proof/evidence/readiness writes",
    "no Codex SDK execution",
    "no AG Resume writer/helper/route behavior",
    "no QP evidence",
    "no z_t commits",
    "no approval/publish/retry/replay/merge authority",
  ], { label: `${fixtureFile} non-goals/forbidden-actions` });
}

function assertDocPointers() {
  assertContainsAll(projectDoc, [
    fixtureFile,
    "public-safe",
    "sample_fixture_only",
    "read-only",
    "non-authoritative",
    "not graph runtime behavior",
    "smoke:project-constellation-sample-fixture",
  ], { textByFile });

  assertContainsAll(capsuleDoc, [
    fixtureFile,
    "first fixture-backed capsule preview",
    "conceptual",
    "non-authoritative",
  ], { textByFile });

  assertContainsAll(codexAuthorityDoc, [
    fixtureFile,
    "codex_execution_authority_preview",
    "conceptual only",
    "no live SDK call",
    "no provider implementation",
    "no runtime execution",
  ], { textByFile });

  assertContainsAll(indexDoc, [
    fixtureFile,
    "smoke:project-constellation-sample-fixture",
    "no Project Constellation runtime behavior",
    "no graph DB",
    "no persistence",
    "no proof/evidence write",
    "no Codex SDK execution",
    "no AG Resume writer/helper/route behavior",
  ], { textByFile });
}

function assertChangedFilesBoundary() {
  const result = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "Project Constellation sample fixture smoke",
  });
  const untrackedFiles = getUntrackedFiles();
  const contentOnly = result.mode === "content-only";
  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for Project Constellation sample fixture smoke: ${file}`,
      );
    }
  }
  const files = [...new Set([...result.files, ...untrackedFiles])].sort();
  if (!contentOnly) {
    assertNoForbiddenChangedPaths(files);
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

function assertReferencesKnown(values, collection, label) {
  assert(Array.isArray(values), `${label} must be an array`);
  const ids = new Set(collection.map((entry) => entry.id));
  for (const value of values) {
    assert(ids.has(value), `${label} contains unknown reference: ${value}`);
  }
}

function assertNoForbiddenChangedPaths(files) {
  const forbiddenPatterns = [
    /^AGENTS\.md$/,
    /^app\//,
    /^components\//,
    /^lib\//,
    /^db\//,
    /^migrations\//,
    /^apps\/augnes_apps\//,
    /^reports\//,
    /^screenshots\//,
    /(^|\/)(route|api)\.(js|jsx|ts|tsx)$/,
    /(^|\/)mcp/i,
    /(^|\/)hook/i,
    /(^|\/)\.env/,
  ];
  for (const file of files) {
    assert(
      !forbiddenPatterns.some((pattern) => pattern.test(file)),
      `Forbidden changed file for Project Constellation sample fixture smoke: ${file}`,
    );
  }
}

function assertNoUnsafeString(value, path) {
  assertSafeString(value, path);
  assert(!/https?:\/\//i.test(value), `${path} must not contain raw URL`);
  assert(
    !/(^|[\s"'`])\/(Users|var|tmp|etc|home|Volumes)\//.test(value),
    `${path} must not contain absolute path`,
  );
  assert(
    !/(sk-[A-Za-z0-9_-]{10,}|gh[pousr]_[A-Za-z0-9_]{10,}|xox[baprs]-|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]+PRIVATE KEY-----)/.test(
      value,
    ),
    `${path} must not contain token-like secret`,
  );
  assert(
    !/\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\b.{0,80}\b(FROM|INTO|TABLE|SET|VALUES|WHERE)\b/i.test(
      value,
    ),
    `${path} must not contain SQL-like string`,
  );
  assert(
    !/(chain[- ]of[- ]thought|hidden reasoning|scratchpad|private reasoning)/i.test(
      value,
    ),
    `${path} must not contain hidden reasoning marker`,
  );
}

function assertSafeString(value, path) {
  assert.equal(typeof value, "string", `${path} must be a string`);
  assert(value.length > 0, `${path} must not be empty`);
}

function assertNoUnnegatedFixturePhrase(phrase) {
  const text = normalizeText(textByFile.get(fixtureFile)).toLowerCase();
  const lowerPhrase = phrase.toLowerCase();
  let index = text.indexOf(lowerPhrase);
  while (index !== -1) {
    const before = text.slice(Math.max(0, index - 80), index);
    assert(
      /\b(no|not|does not|do not|must not|forbidden)\b/.test(before),
      `${fixtureFile} contains unnegated forbidden phrase: ${phrase}`,
    );
    index = text.indexOf(lowerPhrase, index + lowerPhrase.length);
  }
}

function assertNoRuntimeSidecarComputedTrue(value, path) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      assertNoRuntimeSidecarComputedTrue(entry, `${path}[${index}]`),
    );
    return;
  }
  if (!value || typeof value !== "object") return;
  const hasRuntimeSidecarKey = Object.keys(value).some((key) =>
    /runtime.*sidecar.*e_t|sidecar.*e_t.*runtime/i.test(key),
  );
  if (hasRuntimeSidecarKey && Object.hasOwn(value, "computed")) {
    assert.notEqual(value.computed, true, `${path}.computed must not be true`);
  }
  for (const [key, entry] of Object.entries(value)) {
    assertNoRuntimeSidecarComputedTrue(entry, `${path}.${key}`);
  }
}

function collectStrings(value, path = "$") {
  if (typeof value === "string") return [{ value, path }];
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectStrings(entry, `${path}[${index}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, entry]) =>
      collectStrings(entry, `${path}.${key}`),
    );
  }
  return [];
}

function assertOnlyKeys(object, allowedKeys, path) {
  for (const key of Object.keys(object)) {
    assert(allowedKeys.has(key), `${path}.${key} is not an allowed field`);
  }
}

function assertObject(value, path) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${path} must be an object`);
}

function getUntrackedFiles() {
  try {
    const output = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .sort();
  } catch {
    return [];
  }
}
