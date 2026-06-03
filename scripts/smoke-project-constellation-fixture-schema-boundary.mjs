import assert from "node:assert/strict";
import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertNoRuntimeImports,
  assertPackageScript,
  collectUntrackedFiles,
  loadTextByFile,
  normalizeText,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const typeFile = "types/project-constellation-fixture.ts";
const fixtureFile =
  "fixtures/project-constellation.sample.sidecar-strategy-c-v0.1.json";
const projectDoc = "docs/PROJECT_CONSTELLATION_IA_V0_1.md";
const closeoutDoc =
  "docs/PROJECT_CONSTELLATION_CAPSULE_HANDOFF_FIRST_LOOP_CLOSEOUT_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile =
  "scripts/smoke-project-constellation-fixture-schema-boundary.mjs";
const closeoutSmokeFile =
  "scripts/smoke-project-constellation-capsule-handoff-first-loop-closeout.mjs";
const boundaryCommonFile = "scripts/smoke-boundary-common.mjs";

const inspectedFiles = [
  typeFile,
  projectDoc,
  closeoutDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
];

const allowedChangedFiles = new Set([
  ...inspectedFiles,
  closeoutSmokeFile,
  boundaryCommonFile,
]);

const requiredExportedTypes = [
  "ProjectConstellationSampleFixtureV0",
  "ProjectConstellationSampleStatus",
  "ProjectConstellationAuthority",
  "ProjectConstellationFormationMode",
  "ProjectConstellationSourceScope",
  "ProjectConstellationNode",
  "ProjectConstellationNodeType",
  "ProjectConstellationEdge",
  "ProjectConstellationEdgeType",
  "ProjectConstellationCluster",
  "ProjectConstellationPerspectiveCapsulePreview",
  "ProjectConstellationCodexHandoffPacketPreview",
  "ProjectConstellationExecutionAuthorityPreview",
];

const requiredLiteralValues = [
  '"project_constellation_sample.v0.1"',
  '"sample_fixture_only"',
  '"read_only_non_authoritative"',
  '"work_unit_constellation"',
  '"sidecar_et_strategy_c_first_slice"',
];

const nodeTypeLiterals = [
  '"project"',
  '"work_unit"',
  '"document"',
  '"concept"',
  '"decision"',
  '"tension"',
  '"evidence_pointer"',
  '"validation_result"',
  '"constraint"',
  '"next_move"',
  '"capsule_preview"',
  '"execution_authority_preview"',
];

const edgeTypeLiterals = [
  '"supports"',
  '"evidence_for"',
  '"evidence_against"',
  '"derived_from"',
  '"depends_on"',
  '"refines"',
  '"validates"',
  '"conflicts_with"',
  '"warns_against"',
  '"blocks"',
  '"next_candidate"',
  '"supersedes"',
  '"belongs_to"',
  '"adjacent_to"',
];

const executionAuthorityFields = [
  "execution_intent",
  "recommended_permission_profile",
  "planning_review_permission",
  "escalation_required",
  "forbidden_escalations",
  "user_approval_required",
  "evidence_pointer_semantics",
  "live_sdk_call",
  "provider_implementation",
  "runtime_execution",
];

const boundaryPhrases = [
  "type-only",
  "not runtime schema",
  "not DB schema",
  "not API contract",
  "not MCP/App tool contract",
  "no live SDK call",
  "no provider implementation",
  "no runtime execution",
  fixtureFile,
];

const forbiddenPositiveAuthoritySelfTests = [
  "A fixture may merge without approval.",
  "A type boundary may execute Codex without review.",
  "A Project Constellation schema may deploy without authority matrix update.",
];

const allowedBoundarySelfTests = [
  "No fixture may merge without separate approval.",
  "No type boundary may execute Codex.",
];

const textByFile = loadTextByFile(inspectedFiles);
const typeText = textByFile.get(typeFile);

assertAuthorityClassifierSelfTests();
assertPackageJsonScript();
assertTypeExports();
assertTypeFileBoundary();
assertRequiredTypeContent();
assertDocPointers();
assertSmokeScriptBoundary();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "project-constellation-fixture-schema-boundary",
      pass: true,
      boundary_smoke_mode: changedFilesBoundary.mode,
      type_file_checked: typeFile,
      fixture_path_referenced: fixtureFile,
      docs_checked: [projectDoc, closeoutDoc, indexDoc],
      package_script_checked: true,
      exported_types_checked: requiredExportedTypes.length,
      literal_values_checked: requiredLiteralValues.length,
      node_type_literals_checked: nodeTypeLiterals.length,
      edge_type_literals_checked: edgeTypeLiterals.length,
      execution_authority_fields_checked: executionAuthorityFields.length,
      type_only_boundary_checked: true,
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
      untracked_files_observed: changedFilesBoundary.untracked_files,
      smoke_type: "static-type-docs-package-pointer-boundary-only",
      runtime_behavior_changed: false,
      ui_behavior_changed: false,
      graph_layout_engine_added: false,
      graph_db_added: false,
      persistence_added: false,
      api_route_behavior_changed: false,
      db_schema_migration_changed: false,
      mcp_app_tool_changes_added: false,
      proof_evidence_writes_added: false,
      ag_resume_behavior_added: false,
      codex_sdk_execution_added: false,
      provider_implementation_added: false,
      branch_pr_creation_authority_added: false,
      merge_publish_authority_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:project-constellation-fixture-schema-boundary");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:project-constellation-fixture-schema-boundary",
    expectedCommand:
      "node scripts/smoke-project-constellation-fixture-schema-boundary.mjs",
  });
}

function assertTypeExports() {
  for (const typeName of requiredExportedTypes) {
    const exportPattern = new RegExp(
      `export\\s+(?:type|interface)\\s+${escapeRegExp(typeName)}\\b`,
    );
    assert(exportPattern.test(typeText), `${typeFile} must export ${typeName}`);
  }
}

function assertTypeFileBoundary() {
  assertNoRuntimeImports({
    file: typeFile,
    text: typeText,
    forbiddenImports: [
      ".json",
      "zod",
      "io-ts",
      "runtypes",
      "superstruct",
      "valibot",
      "app/",
      "components/",
      "db/",
      "migrations/",
      "apps/augnes_apps/",
      "@openai/codex-sdk",
    ],
  });
  assert(!/\bimport\s+/m.test(typeText), `${typeFile} must not contain imports`);
  assert(!/\bexport\s+const\b/.test(typeText), `${typeFile} must not export runtime values`);
  assert(!/\bexport\s+let\b/.test(typeText), `${typeFile} must not export runtime values`);
  assert(!/\bexport\s+var\b/.test(typeText), `${typeFile} must not export runtime values`);
  assert(!/\bfunction\b/.test(typeText), `${typeFile} must not contain functions`);
  assert(!/\bclass\b/.test(typeText), `${typeFile} must not contain classes`);
  assert(!/\benum\b/.test(typeText), `${typeFile} must not contain enums`);
  assert(!/\bJSON\./.test(typeText), `${typeFile} must not import or parse JSON`);
  assert(!/\bzod\b|\bio-ts\b|\bruntypes\b|\bsuperstruct\b|\bvalibot\b/i.test(typeText), `${typeFile} must not reference runtime schema libraries`);
}

function assertRequiredTypeContent() {
  assertContainsAll(typeText, [
    ...requiredLiteralValues,
    ...nodeTypeLiterals,
    ...edgeTypeLiterals,
    ...executionAuthorityFields,
    ...boundaryPhrases,
    "live_sdk_call: false",
    "provider_implementation: false",
    "runtime_execution: false",
    "this type does not permit a live SDK call",
    "this type does not permit provider implementation",
    "this type does not permit runtime execution",
  ], { label: typeFile });
  assertNoForbiddenPositiveClauses(typeFile, typeText);
}

function assertDocPointers() {
  assertContainsAll(projectDoc, [
    typeFile,
    "type-only Project Constellation fixture boundary",
    "does not implement runtime graph behavior",
    "does not implement persistence",
    "does not implement graph DB",
    "does not implement API routes",
    "does not become source of truth",
    "smoke:project-constellation-fixture-schema-boundary",
  ], { textByFile });

  assertContainsAll(closeoutDoc, [
    typeFile,
    "recommended type-only fixture/schema boundary is now being introduced",
    "type-only/docs/smoke/package-pointer only",
    "does not add runtime behavior",
    "does not add UI behavior",
    "does not add graph DB",
    "does not add persistence",
    "does not add API routes",
  ], { textByFile });

  assertContainsAll(indexDoc, [
    typeFile,
    "type-only Project Constellation fixture/schema boundary",
    "smoke:project-constellation-fixture-schema-boundary",
    "non-SSOT",
    "no runtime schema",
    "no DB schema",
    "no API route",
    "no MCP/App tool",
    "no graph DB",
    "no persistence",
    "no proof/evidence write",
    "no Codex SDK execution",
  ], { textByFile });
}

function assertSmokeScriptBoundary() {
  const script = textByFile.get(smokeFile);
  assertNoRuntimeImports({
    file: smokeFile,
    text: script,
    forbiddenImports: [
      "app/",
      "components/",
      "db/",
      "migrations/",
      "apps/augnes_apps/",
      "reports/",
      "screenshots/",
      "@openai/codex-sdk",
      "zod",
      "io-ts",
      "runtypes",
      "superstruct",
      "valibot",
    ],
  });
}

function assertChangedFilesBoundary() {
  const result = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "Project Constellation fixture schema boundary smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for Project Constellation fixture schema boundary smoke: ${file}`,
      );
    }
  }

  const files = uniqueSorted([...result.files, ...untrackedFiles]);

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
    untracked_files: untrackedFiles,
  };
}

function assertNoForbiddenChangedPaths(files) {
  const forbiddenPatterns = [
    /^AGENTS\.md$/,
    /^components\//,
    /^app\//,
    /^db\//,
    /^migrations\//,
    /^apps\/augnes_apps\//,
    /^reports\/browser\//,
    /^screenshots\//,
    /(^|\/)(route|api)\.(js|jsx|ts|tsx)$/,
    /^plugins\/augnes-operator\/hooks\//,
    /^plugins\/augnes-operator\/(?:\.mcp\.json|mcp|mcpServers|apps|app-mappings|app_mappings)(\/|$)/,
    /(^|\/)(secret|secrets|env)(\/|$)/i,
    /(^|\/)\.env/i,
    /(^|\/)(ag-work-resume|ag_resume|ag-resume)(\/|$)/i,
    /(^|\/)(proof|evidence).*(writer|record|route|helper)/i,
    /(^|\/)(sidecar-runtime|sidecar_et_runtime|sidecar-et-runtime|runtime-sidecar)(\/|$)/i,
    /(^|\/)(codex-sdk|codex_sdk|provider|providers)(\/|$)/i,
    /(^|\/)(project-constellation).*(runtime|provider|engine|route|api|db|persistence)/i,
  ];

  for (const file of files) {
    assert(
      !forbiddenPatterns.some((pattern) => pattern.test(file)),
      `Forbidden changed file for Project Constellation fixture schema boundary smoke: ${file}`,
    );
  }
}

function assertNoForbiddenPositiveClauses(file, text) {
  const clauses = normalizeText(text)
    .split(/[.;!?]\s+/)
    .map((clause) => clause.trim())
    .filter(Boolean);

  for (const clause of clauses) {
    assert.equal(
      isForbiddenPositiveClause(clause),
      false,
      `${file} appears to grant forbidden authority or active behavior: ${clause}`,
    );
  }
}

function assertAuthorityClassifierSelfTests() {
  for (const clause of forbiddenPositiveAuthoritySelfTests) {
    assert.equal(
      isForbiddenPositiveClause(clause),
      true,
      `Authority classifier must reject forbidden positive claim: ${clause}`,
    );
  }

  for (const clause of allowedBoundarySelfTests) {
    assert.equal(
      isForbiddenPositiveClause(clause),
      false,
      `Authority classifier must allow legitimate boundary wording: ${clause}`,
    );
  }
}

function isForbiddenPositiveClause(clause) {
  const forbiddenPatterns = [
    /\b(type|schema|fixture|boundary|Project Constellation|Codex|PR)\b.{0,100}\b(can|may|is allowed to|is permitted to|has authority to|is authorized to|authorizes?)\b.{0,140}\b(create branches?|open PRs?|create PRs?|merge|publish|approve|retry|replay|deploy|record proof|record evidence|write proof|write evidence|execute Codex|call GitHub|call OpenAI|call Augnes runtime|call MCP\/App tools?|call SDK|implement providers?)\b/i,
    /\b(adds?|implements?|enables?|activates?|creates?|records?|writes?|calls?|runs?|executes?|publishes?|approves?|retries|replays|merges?|deploys?)\b.{0,140}\b(runtime behavior|UI behavior|graph layout engine|graph DB|persistence|runtime node creation|API routes?|DB schema|migrations?|MCP\/App tools?|proof\/evidence writes?|proof writes?|evidence writes?|AG Resume behavior|branch creation authority|PR creation authority|merge authority|publish authority|approval authority|Codex SDK execution|provider implementation|Project Constellation runtime implementation)\b/i,
    /\b(grants?|adds?|creates?|provides?|authori[sz]es?)\b.{0,80}\b(branch creation authority|PR creation authority|merge authority|publish authority|approval authority|proof\/evidence write authority|Codex SDK execution authority|deploy authority)\b/i,
    /\b(navigator\.clipboard|@openai\/codex-sdk|api\.github\.com|api\.openai\.com|fetch\s*\(|XMLHttpRequest|gh\s+(api|pr|issue|repo))\b/i,
  ];

  if (!forbiddenPatterns.some((pattern) => pattern.test(clause))) return false;
  return !isNegatedBoundary(clause);
}

function isNegatedBoundary(clause) {
  return /\b(not|no|does not|do not|must not|never|is not|are not|cannot|can't|by itself|type-only|boundary only)\b/i.test(
    clause,
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
