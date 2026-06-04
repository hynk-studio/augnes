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

const boundaryDoc = "docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md";
const routePlanningDoc = "docs/READONLY_API_ROUTE_PLANNING_BOUNDARY_V0_1.md";
const routeChecklistDoc = "docs/READONLY_API_ROUTE_REVIEW_CHECKLIST_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile =
  "scripts/smoke-chatgpt-app-mcp-readonly-surface-boundary.mjs";
const routePlanningSmokeFile =
  "scripts/smoke-readonly-api-route-planning-boundary.mjs";
const routeChecklistSmokeFile =
  "scripts/smoke-readonly-api-route-review-checklist.mjs";
const routeResponseShapeTypeFile = "types/readonly-api-route-response.ts";
const routeResponseShapeSmokeFile =
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
const authorityMatrixDoc = "docs/AUTHORITY_MATRIX.md";

const inspectedFiles = [boundaryDoc, indexDoc, packageJsonFile, smokeFile];
const allowedChangedFiles = new Set([
  ...inspectedFiles,
  routePlanningDoc,
  routePlanningSmokeFile,
  routeChecklistDoc,
  routeChecklistSmokeFile,
  routeResponseShapeTypeFile,
  routeResponseShapeSmokeFile,
  implementationDesignDoc,
  implementationDesignSmokeFile,
  implementationPlanDoc,
  implementationPlanSmokeFile,
  constellationPreviewRouteDoc,
  constellationPreviewRouteFile,
  constellationPreviewHelperFile,
  constellationPreviewSmokeFile,
  authorityMatrixDoc,
]);

const requiredSections = [
  "Status and scope",
  "Purpose",
  "Surface model",
  "User-facing read-only capabilities",
  "Project Constellation rendering expectations",
  "Perspective Capsule rendering expectations",
  "Evidence pointers and unresolved tensions",
  "Boundary / Next review",
  "Copyable handoff expectations",
  "MCP/App tool non-goals",
  "Authority boundaries",
  "Future implementation gates",
  "Validation and smoke plan",
  "Non-goals",
];

const readOnlySurfaceTerms = [
  "planning only",
  "user-facing decision support",
  "Whole Perspective",
  "Project Constellation",
  "nodes",
  "edges",
  "clusters",
  "evidence pointers",
  "unresolved tensions",
  "next action candidates",
  "Perspective Capsule / Handoff Capsule preview",
  "copyable handoff text",
  "boundary / next review",
  "manual and read-only",
];

const requiredNonGoals = [
  "no ChatGPT App tool implementation",
  "no MCP tool implementation",
  "no runtime behavior",
  "no UI code",
  "no API routes",
  "no DB schema/migrations",
  "no graph DB",
  "no persistence",
  "no proof/evidence writes",
  "no AG Resume behavior",
  "no Codex SDK execution/provider behavior",
  "no GitHub/OpenAI/Augnes runtime calls",
  "no network calls",
  "no write tools",
  "no proof/evidence/readiness records",
  "no branch creation authority",
  "no PR creation authority by itself",
  "no merge/publish/approval/retry/replay/deploy authority",
];

const authorityBoundaryPhrases = [
  "must not write Augnes state",
  "must not create proof/evidence/readiness records",
  "must not execute Codex",
  "must not create branches or PRs",
  "must not approve, publish, merge, retry, replay, or deploy",
  "no Augnes state writes",
  "no source-of-truth claim",
  "read-only API route",
  "ChatGPT App component",
  "MCP read-only tool",
  "auth/security review",
  "browser/computer-use validation",
  "authority matrix update",
];

const forbiddenPositiveAuthoritySelfTests = [
  "A future read-only ChatGPT App may create PRs.",
  "A future read-only MCP surface may execute Codex.",
  "A planning-only ChatGPT App may publish outcomes.",
  "A future MCP tool is allowed to write Augnes state.",
  "A future surface may merge without approval.",
  "A planning-only ChatGPT App may publish without review.",
  "A future MCP tool may deploy without authority matrix update.",
];

const allowedBoundarySelfTests = [
  "This planning note does not create PR authority.",
  "The surface must not execute Codex.",
  "Future implementation requires separate gates before any tool surface exists.",
  "Read-only rendering is decision support only and does not write Augnes state.",
  "No surface may merge without separate approval.",
  "No MCP tool may expose credentials.",
];

const textByFile = loadTextByFile(inspectedFiles);
const boundaryDocText = textByFile.get(boundaryDoc);

assertPackageJsonScript();
assertSmokeScriptBoundary();
assertRequiredSections();
assertAuthorityClassifierSelfTests();
assertRequiredContent();
assertIndexPointer();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "chatgpt-app-mcp-readonly-surface-boundary",
      pass: true,
      boundary_smoke_mode: changedFilesBoundary.mode,
      docs_checked: [boundaryDoc, indexDoc],
      package_script_checked: true,
      required_sections_checked: requiredSections.length,
      read_only_surface_terms_checked: readOnlySurfaceTerms.length,
      non_goals_checked: requiredNonGoals.length,
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
      smoke_type: "static-docs-package-pointer-planning-boundary-only",
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
console.log("PASS smoke:chatgpt-app-mcp-readonly-surface-boundary");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:chatgpt-app-mcp-readonly-surface-boundary",
    expectedCommand:
      "node scripts/smoke-chatgpt-app-mcp-readonly-surface-boundary.mjs",
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
      headingPattern.test(boundaryDocText),
      `${boundaryDoc} must contain section: ${section}`,
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
  assertContainsAll(boundaryDoc, [
    ...readOnlySurfaceTerms,
    ...requiredNonGoals,
    ...authorityBoundaryPhrases,
    "ChatGPT App/MCP surface",
    "read-only user-facing decision support",
    "must not write Augnes state",
    "must not create proof/evidence/readiness records",
    "must not execute Codex",
    "must not create branches or PRs",
    "must not approve, publish, merge, retry, replay, or deploy",
    "future implementation requires separate gates",
    routePlanningDoc,
    "future read-only API route planning",
    "No route, tool, component, or runtime endpoint is implemented",
    "npm run smoke:chatgpt-app-mcp-readonly-surface-boundary",
    "AUGNES_BOUNDARY_SMOKE_MODE=content-only",
  ], { textByFile });
  assertNoForbiddenPositiveClauses(boundaryDoc, boundaryDocText);
}

function assertIndexPointer() {
  assertContainsAll(indexDoc, [
    boundaryDoc,
    "ChatGPT App/MCP read-only surface boundary",
    "smoke:chatgpt-app-mcp-readonly-surface-boundary",
    "docs/smoke/package-pointer only",
    "read-only",
    "non-authoritative",
    "no ChatGPT App tool implementation",
    "no MCP tool implementation",
    "no runtime behavior",
    "no UI/API/DB/MCP/App/proof/evidence/Codex SDK authority",
  ], { textByFile });
  assertNoForbiddenPositiveClauses(indexDoc, textByFile.get(indexDoc));
}

function assertChangedFilesBoundary() {
  const result = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "ChatGPT App/MCP read-only surface boundary smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for ChatGPT App/MCP read-only surface boundary smoke: ${file}`,
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
      `Forbidden changed file for ChatGPT App/MCP read-only surface boundary smoke: ${file}`,
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
    /\b(ChatGPT App|MCP|surface|tool|Augnes|Codex|PR)\b.{0,120}\b(can|may|is allowed to|is permitted to|has authority to|is authorized to|authorizes?)\b.{0,160}\b(write Augnes state|create proof|create evidence|create readiness|execute Codex|create branches?|open PRs?|create PRs?|approve|publish|merge|retry|replay|deploy|call GitHub|call OpenAI|call Augnes runtime|call MCP\/App tools?)\b/i,
    /\b(adds?|implements?|enables?|activates?|creates?|records?|writes?|calls?|runs?|executes?|publishes?|approves?|retries|replays|merges?|deploys?)\b.{0,160}\b(runtime behavior|UI code|API routes?|DB schema|migrations?|graph DB|persistence|MCP\/App tools?|ChatGPT App tools?|MCP tools?|proof\/evidence writes?|proof writes?|evidence writes?|AG Resume behavior|branch creation authority|PR creation authority|merge authority|publish authority|approval authority|Codex SDK execution|provider implementation|Project Constellation runtime behavior)\b/i,
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
