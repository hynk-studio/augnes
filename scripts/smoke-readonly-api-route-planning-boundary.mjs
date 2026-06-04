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

const routeDoc = "docs/READONLY_API_ROUTE_PLANNING_BOUNDARY_V0_1.md";
const checklistDoc = "docs/READONLY_API_ROUTE_REVIEW_CHECKLIST_V0_1.md";
const surfaceDoc =
  "docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-readonly-api-route-planning-boundary.mjs";
const checklistSmokeFile =
  "scripts/smoke-readonly-api-route-review-checklist.mjs";
const surfaceSmokeFile =
  "scripts/smoke-chatgpt-app-mcp-readonly-surface-boundary.mjs";
const responseShapeTypeFile = "types/readonly-api-route-response.ts";
const responseShapeSmokeFile =
  "scripts/smoke-readonly-api-route-response-shape-boundary.mjs";
const implementationDesignDoc =
  "docs/READONLY_API_ROUTE_IMPLEMENTATION_DESIGN_PACKET_V0_1.md";
const implementationDesignSmokeFile =
  "scripts/smoke-readonly-api-route-implementation-design-packet.mjs";
const implementationPlanDoc =
  "docs/READONLY_API_ROUTE_IMPLEMENTATION_PLAN_V0_1.md";
const implementationPlanSmokeFile =
  "scripts/smoke-readonly-api-route-implementation-plan.mjs";
const constellationPreviewRouteDoc =
  "docs/READONLY_API_ROUTE_CONSTELLATION_PREVIEW_V0_1.md";
const constellationPreviewRouteFile =
  "app/api/augnes/read/constellation-preview/route.ts";
const constellationPreviewHelperFile =
  "lib/readonly-api/constellation-preview.ts";
const constellationPreviewSmokeFile =
  "scripts/smoke-readonly-api-route-constellation-preview.mjs";
const accessGuardDoc = "docs/READONLY_API_ROUTE_ACCESS_GUARD_V0_1.md";
const accessGuardFile = "lib/readonly-api/access-guard.ts";
const accessGuardSmokeFile =
  "scripts/smoke-readonly-api-route-access-guard.mjs";
const authorityMatrixDoc = "docs/AUTHORITY_MATRIX.md";

const inspectedFiles = [
  routeDoc,
  surfaceDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
];

const allowedChangedFiles = new Set([
  ...inspectedFiles,
  checklistDoc,
  checklistSmokeFile,
  surfaceSmokeFile,
  responseShapeTypeFile,
  responseShapeSmokeFile,
  implementationDesignDoc,
  implementationDesignSmokeFile,
  implementationPlanDoc,
  implementationPlanSmokeFile,
  constellationPreviewRouteDoc,
  constellationPreviewRouteFile,
  constellationPreviewHelperFile,
  constellationPreviewSmokeFile,
  accessGuardDoc,
  accessGuardFile,
  accessGuardSmokeFile,
  authorityMatrixDoc,
]);

const requiredSections = [
  "Status and scope",
  "Purpose",
  "Relationship to ChatGPT App/MCP read-only surface",
  "Candidate read-only route families",
  "Allowed response concepts",
  "Forbidden response concepts",
  "Evidence pointer semantics",
  "Perspective Capsule semantics",
  "Project Constellation semantics",
  "Auth/security gates",
  "Browser/computer-use gates",
  "Implementation gates",
  "Validation and smoke plan",
  "Non-goals",
];

const readOnlyRouteConcepts = [
  "planning only",
  "No API route is implemented in this PR",
  "GET/read-only",
  "Whole Perspective summary",
  "Project Constellation read model",
  "nodes",
  "edges",
  "clusters",
  "evidence pointers",
  "unresolved tensions",
  "next action candidates",
  "Perspective Capsule / Handoff Capsule preview",
  "copyable handoff text",
  "boundary / next review",
];

const forbiddenResponseConcepts = [
  "secrets",
  "raw private user text beyond scoped Augnes records",
  "hidden reasoning / chain-of-thought",
  "raw DB rows",
  "credentials/auth/env",
  "proof/evidence write handles",
  "mutation URLs",
  "approval/publish/merge controls",
  "Codex SDK execution handles",
  "provider credentials",
];

const implementationGates = [
  "API route PR",
  "auth/security review",
  "privacy review",
  "prompt-injection review",
  "browser/computer-use validation if surfaced in UI",
  "authority matrix update",
  "smoke and test coverage",
];

const authorityBoundaryPhrases = [
  "does not implement any API route",
  "no API route implementation",
  "no runtime behavior",
  "no UI code",
  "no ChatGPT App tool implementation",
  "no MCP tool implementation",
  "no DB schema/migrations",
  "no graph DB",
  "no persistence",
  "no proof/evidence writes",
  "no AG Resume behavior",
  "no Codex SDK execution/provider behavior",
  "no auth implementation",
  "no external calls",
  "no branch creation authority",
  "no PR creation authority by itself",
  "no merge/publish/approval/retry/replay/deploy authority",
  "must not become graph DB",
  "must not launch handoff execution",
];

const forbiddenPositiveAuthoritySelfTests = [
  "A future read-only API route may create proof records.",
  "A future GET route may execute Codex.",
  "A read-only route is allowed to expose credentials.",
  "A planning-only route may approve merges.",
  "A future route may merge without approval.",
  "A read-only route may expose credentials without review.",
  "A future API route may create proof records without evidence gate approval.",
  "A planning-only route may deploy without authority matrix update.",
];

const allowedBoundarySelfTests = [
  "This planning note does not implement API routes.",
  "A future API route requires separate auth/security review.",
  "Read-only route planning does not write Augnes state.",
  "GET/read-only routes still require privacy review before implementation.",
  "No route may merge without separate approval.",
  "No API route may expose credentials.",
];

const textByFile = loadTextByFile(inspectedFiles);
const routeDocText = textByFile.get(routeDoc);

assertPackageJsonScript();
assertSmokeScriptBoundary();
assertRequiredSections();
assertAuthorityClassifierSelfTests();
assertRequiredContent();
assertSurfaceDocPointer();
assertIndexPointer();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "readonly-api-route-planning-boundary",
      pass: true,
      boundary_smoke_mode: changedFilesBoundary.mode,
      docs_checked: [routeDoc, surfaceDoc, indexDoc],
      package_script_checked: true,
      required_sections_checked: requiredSections.length,
      read_only_route_concepts_checked: readOnlyRouteConcepts.length,
      forbidden_response_concepts_checked: forbiddenResponseConcepts.length,
      implementation_gates_checked: implementationGates.length,
      authority_boundary_phrases_checked: authorityBoundaryPhrases.length,
      forbidden_positive_authority_self_tests_checked:
        forbiddenPositiveAuthoritySelfTests.length,
      allowed_boundary_self_tests_checked: allowedBoundarySelfTests.length,
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
      smoke_type: "static-docs-package-pointer-api-route-planning-boundary-only",
      api_route_implemented: false,
      runtime_behavior_changed: false,
      ui_behavior_changed: false,
      db_schema_migration_changed: false,
      mcp_app_tool_changes_added: false,
      proof_evidence_writes_added: false,
      ag_resume_behavior_added: false,
      codex_sdk_execution_added: false,
      auth_implementation_added: false,
      external_calls_added: false,
      branch_pr_creation_authority_added: false,
      merge_publish_authority_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:readonly-api-route-planning-boundary");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:readonly-api-route-planning-boundary",
    expectedCommand: "node scripts/smoke-readonly-api-route-planning-boundary.mjs",
  });
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
      "openai",
      "zod",
      "io-ts",
      "runtypes",
      "superstruct",
      "valibot",
    ],
  });
}

function assertRequiredSections() {
  for (const section of requiredSections) {
    const headingPattern = new RegExp(`^##\\s+${escapeRegExp(section)}\\s*$`, "m");
    assert(
      headingPattern.test(routeDocText),
      `${routeDoc} must contain section: ${section}`,
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

function assertRequiredContent() {
  assertContainsAll(routeDoc, [
    ...readOnlyRouteConcepts,
    ...forbiddenResponseConcepts,
    ...implementationGates,
    ...authorityBoundaryPhrases,
    "Evidence pointers are pointers only",
    "do not create proof/evidence/readiness records",
    "Perspective Capsule / Handoff Capsule route material remains conceptual and non-authoritative",
    "must not launch handoff execution",
    "Project Constellation route material remains read-only",
    "must not become graph DB",
    "must not expose credentials/auth/env",
    "Future implementation must be GET/read-only only unless separately scoped.",
    "Even GET/read-only routes need auth/security/privacy boundaries",
    checklistDoc,
    "checklist is required before future route implementation",
    "No API route is implemented by the checklist or this planning boundary",
    "npm run smoke:readonly-api-route-review-checklist",
    "npm run smoke:readonly-api-route-planning-boundary",
    "AUGNES_BOUNDARY_SMOKE_MODE=content-only",
  ], { textByFile });
  assertNoForbiddenPositiveClauses(routeDoc, routeDocText);
}

function assertSurfaceDocPointer() {
  assertContainsAll(surfaceDoc, [
    routeDoc,
    "future read-only API route planning",
    "No route, tool, component, or runtime endpoint is implemented",
  ], { textByFile });
  assertNoForbiddenPositiveClauses(surfaceDoc, textByFile.get(surfaceDoc));
}

function assertIndexPointer() {
  assertContainsAll(indexDoc, [
    routeDoc,
    "read-only API route planning boundary",
    "smoke:readonly-api-route-planning-boundary",
    "docs/smoke/package-pointer only",
    "non-SSOT",
    "no API route",
    "no runtime behavior",
    "no UI",
    "no DB",
    "no MCP/App tool",
    "no proof/evidence write",
    "no Codex SDK execution",
  ], { textByFile });
  assertNoForbiddenPositiveClauses(indexDoc, textByFile.get(indexDoc));
}

function assertChangedFilesBoundary() {
  const result = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "read-only API route planning boundary smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for read-only API route planning boundary smoke: ${file}`,
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
    if (file === constellationPreviewRouteFile) continue;
    assert(
      !forbiddenPatterns.some((pattern) => pattern.test(file)),
      `Forbidden changed file for read-only API route planning boundary smoke: ${file}`,
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
    /\b(API route|GET route|read-only route|route|endpoint|Augnes|Codex|PR)\b.{0,120}\b(can|may|is allowed to|is permitted to|has authority to|is authorized to|authorizes?)\b.{0,160}\b(create proof|create evidence|create readiness|execute Codex|expose credentials|write Augnes state|create branches?|open PRs?|create PRs?|approve merges?|approve|publish|merge|retry|replay|deploy|call GitHub|call OpenAI|call Augnes runtime|call MCP\/App tools?)\b/i,
    /\b(adds?|implements?|enables?|activates?|creates?|records?|writes?|calls?|runs?|executes?|publishes?|approves?|retries|replays|merges?|deploys?|exposes?)\b.{0,160}\b(runtime behavior|UI code|API routes?|route files?|DB schema|migrations?|graph DB|persistence|MCP\/App tools?|ChatGPT App tools?|MCP tools?|proof\/evidence writes?|proof writes?|evidence writes?|proof records?|evidence records?|readiness records?|AG Resume behavior|branch creation authority|PR creation authority|merge authority|publish authority|approval authority|Codex SDK execution|provider implementation|credentials|secrets|provider credentials|Project Constellation runtime behavior)\b/i,
    /\b(grants?|adds?|creates?|provides?|authori[sz]es?)\b.{0,100}\b(branch creation authority|PR creation authority|merge authority|publish authority|approval authority|proof\/evidence write authority|Codex SDK execution authority|deploy authority)\b/i,
    /\b(navigator\.clipboard|@openai\/codex-sdk|api\.github\.com|api\.openai\.com|fetch\s*\(|XMLHttpRequest|gh\s+(api|pr|issue|repo))\b/i,
  ];

  if (!forbiddenPatterns.some((pattern) => pattern.test(clause))) return false;
  return !isNegatedBoundary(clause);
}

function isNegatedBoundary(clause) {
  return /\b(not|no|does not|do not|must not|never|is not|are not|cannot|can't|by itself)\b|않|아니다|만들지 않는다/i.test(
    clause,
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
