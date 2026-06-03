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

const closeoutDoc =
  "docs/PROJECT_CONSTELLATION_CAPSULE_HANDOFF_FIRST_LOOP_CLOSEOUT_V0_1.md";
const projectDoc = "docs/PROJECT_CONSTELLATION_IA_V0_1.md";
const typeBoundaryFile = "types/project-constellation-fixture.ts";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile =
  "scripts/smoke-project-constellation-capsule-handoff-first-loop-closeout.mjs";
const fixtureSchemaBoundarySmokeFile =
  "scripts/smoke-project-constellation-fixture-schema-boundary.mjs";
const boundaryCommonFile = "scripts/smoke-boundary-common.mjs";
const capsuleHandoffSkillSmokeFile =
  "scripts/smoke-augnes-capsule-handoff-skill.mjs";
const capsuleHandoffDogfoodSmokeFile =
  "scripts/smoke-capsule-handoff-skill-dogfood-report.mjs";

const inspectedFiles = [closeoutDoc, indexDoc, packageJsonFile, smokeFile];
const allowedChangedFiles = new Set([
  ...inspectedFiles,
  projectDoc,
  typeBoundaryFile,
  fixtureSchemaBoundarySmokeFile,
  boundaryCommonFile,
  capsuleHandoffSkillSmokeFile,
  capsuleHandoffDogfoodSmokeFile,
]);

const requiredSections = [
  "Status and scope",
  "Why this closeout exists",
  "First loop inventory",
  "Product value confirmed",
  "UI/UX outcome",
  "Perspective Capsule / Handoff Capsule outcome",
  "Codex Plugin / Skill outcome",
  "Codex SDK execution authority boundary",
  "Boundary smoke outcome",
  "Dogfood findings",
  "Authority boundaries preserved",
  "What is still not implemented",
  "Known friction",
  "Next safe candidates",
  "Recommended next step",
  "Non-goals",
];

const inventoryTerms = [
  "Project Constellation IA",
  "Project Constellation boundary guard",
  "boundary smoke scope profiles",
  "Perspective Capsule / Handoff Capsule contract",
  "cross-PR boundary smoke content-only mode",
  "Codex SDK execution authority design",
  "Project Constellation sample fixture",
  "Project Constellation read-only Cockpit preview",
  "Perspective Capsule copyable handoff preview",
  "Augnes Operator Plugin v0.2",
  "augnes-capsule-handoff",
  "Capsule Handoff skill dogfood report",
  "Capsule Handoff skill wording refinement",
];

const productLoopTerms = [
  "symbolic constellation",
  "selected perspective",
  "Perspective Capsule / Handoff Capsule text",
  "manually copied",
  "Codex skill",
  "workflow discipline",
  "Dogfood records friction",
  "Boundary smokes protect non-authority",
];

const uiTerms = [
  "practical symbolic node/edge/cluster preview",
  "not decorative space UI",
  "nodes",
  "edges",
  "cluster thesis",
  "evidence pointers",
  "unresolved tensions",
  "next action candidates",
  "capsule preview",
  "Codex execution authority preview",
  "copyable handoff text",
  "no action controls",
];

const authorityBoundaryPhrases = [
  "no graph DB",
  "no persistence",
  "no save/rollback",
  "no runtime node creation",
  "no API route",
  "no MCP/App tool",
  "no proof/evidence write",
  "no AG Resume writer/helper/route behavior",
  "no live Codex SDK call",
  "no provider implementation",
  "no branch creation authority",
  "no PR creation authority by itself",
  "no merge/publish/approval/retry/replay/deploy authority",
  "read-only",
  "non-authoritative",
  "evidence-pointer-based",
  "handoff-preview-oriented",
];

const nextSafeCandidates = [
  "A. Type-only Project Constellation fixture/schema boundary",
  "B. Type-only Codex execution record boundary",
  "C. ChatGPT App/MCP read-only surface planning",
  "D. Better Cockpit visual polish for symbolic node/edge layout, still read-only",
  "E. More dogfood with real capsule-driven docs/smoke tasks",
];

const textByFile = loadTextByFile(inspectedFiles);
const closeout = textByFile.get(closeoutDoc);

assertPackageJsonScript();
assertRequiredSections();
assertCloseoutContent();
assertIndexPointer();
assertSmokeScriptBoundary();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "project-constellation-capsule-handoff-first-loop-closeout",
      pass: true,
      boundary_smoke_mode: changedFilesBoundary.mode,
      closeout_checked: closeoutDoc,
      index_checked: indexDoc,
      package_script_checked: true,
      required_sections_checked: requiredSections.length,
      inventory_terms_checked: inventoryTerms.length,
      product_loop_terms_checked: productLoopTerms.length,
      ui_terms_checked: uiTerms.length,
      authority_boundary_phrases_checked: authorityBoundaryPhrases.length,
      next_safe_candidates_checked: nextSafeCandidates.length,
      recommended_next_step_checked: true,
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
      smoke_type: "static-docs-package-pointer-closeout-boundary-only",
      runtime_behavior_changed: false,
      ui_behavior_changed: false,
      api_route_behavior_changed: false,
      db_schema_migration_changed: false,
      mcp_app_tool_changes_added: false,
      proof_evidence_writes_added: false,
      ag_resume_behavior_added: false,
      codex_sdk_execution_added: false,
      branch_pr_creation_authority_added: false,
      merge_publish_authority_added: false,
    },
    null,
    2,
  ),
);
console.log(
  "PASS smoke:project-constellation-capsule-handoff-first-loop-closeout",
);

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:project-constellation-capsule-handoff-first-loop-closeout",
    expectedCommand:
      "node scripts/smoke-project-constellation-capsule-handoff-first-loop-closeout.mjs",
  });
}

function assertRequiredSections() {
  for (const section of requiredSections) {
    const headingPattern = new RegExp(`^##\\s+${escapeRegExp(section)}\\s*$`, "m");
    assert(
      headingPattern.test(closeout),
      `${closeoutDoc} must contain section: ${section}`,
    );
  }
}

function assertCloseoutContent() {
  assertContainsAll(closeoutDoc, [
    ...inventoryTerms,
    ...productLoopTerms,
    ...uiTerms,
    ...authorityBoundaryPhrases,
    ...nextSafeCandidates,
    "Recommended next step: A. Type-only Project Constellation fixture/schema boundary.",
    "sample fixture and Cockpit preview now exist",
    "type-only boundary can reduce drift",
    "docs/smoke/package-pointer only",
    "Codex SDK execution authority remains design-only",
    "Default scoped mode remains the direct-edit gate.",
    "AUGNES_BOUNDARY_SMOKE_MODE=content-only",
    "Content-only mode skips changed/untracked/path boundary enforcement while preserving content checks.",
    "Project Constellation runtime implementation files",
  ], { textByFile });
  assertNoForbiddenPositiveClauses(closeoutDoc, closeout);
}

function assertIndexPointer() {
  assertContainsAll(indexDoc, [
    closeoutDoc,
    "Project Constellation Capsule Handoff first-loop closeout",
    "smoke:project-constellation-capsule-handoff-first-loop-closeout",
    "docs/smoke/package-pointer only",
    "read-only",
    "non-authoritative",
    "no runtime behavior",
    "no UI/API/DB/MCP/App/proof/evidence/Codex SDK authority",
    "Recommended next step: Type-only Project Constellation fixture/schema boundary",
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
    ],
  });
}

function assertChangedFilesBoundary() {
  const result = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "Project Constellation Capsule Handoff first loop closeout smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for Project Constellation Capsule Handoff first loop closeout smoke: ${file}`,
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
      `Forbidden changed file for Project Constellation Capsule Handoff first loop closeout smoke: ${file}`,
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

function isForbiddenPositiveClause(clause) {
  const forbiddenPatterns = [
    /\b(closeout|loop|Project Constellation|capsule|handoff|skill|Codex|PR)\b.{0,100}\b(can|may|is allowed to|is permitted to|has authority to|is authorized to|authorizes?)\b.{0,140}\b(create branches?|open PRs?|create PRs?|merge|publish|approve|retry|replay|deploy|record proof|record evidence|write proof|write evidence|execute Codex|call GitHub|call OpenAI|call Augnes runtime|call MCP\/App tools?)\b/i,
    /\b(adds?|implements?|enables?|activates?|creates?|records?|writes?|calls?|runs?|executes?|publishes?|approves?|retries|replays|merges?|deploys?)\b.{0,140}\b(runtime behavior|UI behavior|API routes?|DB schema|migrations?|MCP\/App tools?|proof\/evidence writes?|proof writes?|evidence writes?|branch creation authority|PR creation authority|merge authority|publish authority|approval authority|Codex SDK execution|provider implementation|Project Constellation runtime implementation)\b/i,
    /\b(grants?|adds?|creates?|provides?|authori[sz]es?)\b.{0,80}\b(branch creation authority|PR creation authority|merge authority|publish authority|approval authority|proof\/evidence write authority|Codex SDK execution authority|deploy authority)\b/i,
    /\b(navigator\.clipboard|@openai\/codex-sdk|api\.github\.com|api\.openai\.com|fetch\s*\(|XMLHttpRequest|gh\s+(api|pr|issue|repo))\b/i,
  ];

  if (!forbiddenPatterns.some((pattern) => pattern.test(clause))) return false;
  return !isNegatedBoundary(clause);
}

function isNegatedBoundary(clause) {
  return /\b(not|no|does not|do not|must not|without|never|is not|are not|cannot|can't|by itself|remains design-only|not current runtime behavior)\b/i.test(
    clause,
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
