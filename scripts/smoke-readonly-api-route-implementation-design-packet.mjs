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

const designDoc =
  "docs/READONLY_API_ROUTE_IMPLEMENTATION_DESIGN_PACKET_V0_1.md";
const planningDoc = "docs/READONLY_API_ROUTE_PLANNING_BOUNDARY_V0_1.md";
const checklistDoc = "docs/READONLY_API_ROUTE_REVIEW_CHECKLIST_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile =
  "scripts/smoke-readonly-api-route-implementation-design-packet.mjs";
const planningSmokeFile =
  "scripts/smoke-readonly-api-route-planning-boundary.mjs";
const checklistSmokeFile =
  "scripts/smoke-readonly-api-route-review-checklist.mjs";
const responseShapeSmokeFile =
  "scripts/smoke-readonly-api-route-response-shape-boundary.mjs";
const surfaceSmokeFile =
  "scripts/smoke-chatgpt-app-mcp-readonly-surface-boundary.mjs";
const responseShapeTypeFile = "types/readonly-api-route-response.ts";
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
const cockpitImplementationDoc =
  "docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_V0_1.md";
const cockpitImplementationSmokeFile =
  "scripts/smoke-cockpit-local-only-constellation-route-preview.mjs";

const inspectedFiles = [
  designDoc,
  planningDoc,
  checklistDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
];

const allowedChangedFiles = new Set([
  ...inspectedFiles,
  planningSmokeFile,
  checklistSmokeFile,
  responseShapeSmokeFile,
  responseShapeTypeFile,
  surfaceSmokeFile,
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
  cockpitImplementationDoc,
  cockpitImplementationSmokeFile,
]);

const requiredSections = [
  "Status and scope",
  "Purpose",
  "Candidate route",
  "Source boundaries",
  "Auth/session design questions",
  "Workspace/project scope",
  "Response shape mapping",
  "Forbidden fields review",
  "Evidence pointer handling",
  "Perspective Capsule handling",
  "Project Constellation handling",
  "User-intent validation baseline from PR #381",
  "Prompt-injection handling",
  "Privacy and minimization",
  "Error and fail-closed behavior",
  "Browser/computer-use validation plan",
  "Required implementation PR evidence",
  "Validation and smoke plan",
  "Non-goals",
];

const requiredDesignPhrases = [
  "implementation design packet only",
  "pre-route design artifact",
  "GET /api/augnes/read/constellation-preview",
  "candidate only",
  "placeholder vocabulary",
  "not an API contract",
  "not a route implementation",
  "not a route handler",
  "does not implement any endpoint",
  "Future implementation must separately propose the actual route path",
  "separate route implementation PR",
  "auth/security review",
  "privacy review",
  "prompt-injection review",
  "browser/computer-use validation if surfaced",
  "authority matrix update",
  "tests/smokes",
  responseShapeTypeFile,
  "ReadonlyApiRouteResponseEnvelopeV0",
  "ReadonlyApiRouteProjectConstellationReadModel",
  "ReadonlyApiRoutePerspectiveCapsulePreview",
  "ReadonlyApiRouteCopyableHandoffPreview",
  "ReadonlyApiRouteForbiddenField",
  "Conceptual response outline, not an API contract",
];

const forbiddenFields = [
  "secrets",
  "credentials/auth/env",
  "hidden reasoning / chain-of-thought",
  "raw DB rows",
  "proof/evidence write handles",
  "mutation URLs",
  "approval/publish/merge controls",
  "Codex SDK execution handles",
  "provider credentials",
];

const boundaryConcepts = [
  "Unauthorized access must fail closed",
  "There must be no public unauthenticated endpoint",
  "Route-provided text must be display data, not instructions",
  "No route-provided text grants authority",
  "Evidence pointers are pointer-only",
  "They do not create proof records",
  "No route may record proof",
  "No route may record evidence",
  "Perspective Capsule / Handoff Capsule material is display/copyable preview only",
  "does not launch Codex",
  "call providers",
  "create branches",
  "create PRs",
  "record proof",
  "record evidence",
  "Project Constellation material is read-only",
  "does not become graph DB",
  "persistence",
  "source-of-truth",
  "graph layout engine",
  "runtime node creation",
  "runtime behavior",
  "Next action candidates are advisory and not execution commands",
  "Unresolved tensions must remain visible and must not be collapsed into support",
  "User-authored, project-authored, document-authored, or route-provided text",
  "untrusted display data",
  "must not be interpreted as tool instructions",
  "no raw private user text beyond explicitly scoped Augnes records",
  "Logs and telemetry must not become a secondary store for private route payloads",
  "Browser/computer-use may be skipped for this design packet",
];

const pr381BaselinePhrases = [
  "PR #381",
  "current UI baseline",
  "all 8 user-intent scenarios passed",
  "preview identity",
  "sample fixture status",
  "cluster thesis",
  "nodes",
  "edges",
  "evidence pointers",
  "unresolved tensions",
  "next action candidates",
  "boundary copy",
  "copyable handoff material",
  "absence of false action affordances",
  "context only",
  "not API readiness",
  "not route implementation approval",
  "not proof/evidence write authority",
  "not API contract approval",
  "not merge authority",
  "not publish authority",
];

const forbiddenPositiveAuthoritySelfTests = [
  "A candidate route may expose credentials without review.",
  "A design packet may approve route deployment.",
  "A placeholder route may create proof records.",
  "A future GET route may execute Codex.",
  "A future route may execute Codex after separate review.",
  "A route response may include mutation URLs.",
  "A route response may include mutation URLs when required before implementation.",
  "A route response may create branches.",
  "A route response may create branches in a separate implementation PR.",
  "A route response may open PRs.",
  "A route response may merge or publish.",
  "A route response may publish after browser/computer-use validation.",
  "A route response may persist graph snapshots.",
  "A PR #381 browser report may grant API implementation authority.",
  "A PR #381 browser report may grant API implementation authority as context only.",
  "A placeholder route may deploy after fail-closed review.",
];

const allowedBoundarySelfTests = [
  "This design packet does not implement API routes.",
  "No route may expose credentials.",
  "Future implementation requires auth/security review.",
  "Placeholder route planning does not create an API contract.",
  "Read-only response shape planning does not write Augnes state.",
  "PR #381 user-intent validation is context only and does not grant implementation authority.",
  "Evidence pointers are pointer-only.",
];

const textByFile = loadTextByFile(inspectedFiles);
const designText = textByFile.get(designDoc);

assertAuthorityClassifierSelfTests();
assertPackageJsonScript();
assertSmokeScriptBoundary();
assertRequiredSections();
assertDesignContent();
assertPlanningBoundaryPointer();
assertChecklistPointer();
assertIndexPointer();
assertNoForbiddenPositiveAuthorityGrants();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "readonly-api-route-implementation-design-packet",
      pass: true,
      boundary_smoke_mode: changedFilesBoundary.mode,
      docs_checked: [designDoc, planningDoc, checklistDoc, indexDoc],
      package_script_checked: true,
      required_sections_checked: requiredSections.length,
      candidate_route_placeholder_checked: true,
      response_shape_mapping_checked: true,
      forbidden_fields_checked: forbiddenFields.length,
      auth_session_questions_checked: true,
      workspace_project_scope_checked: true,
      prompt_injection_handling_checked: true,
      privacy_minimization_checked: true,
      pr_381_baseline_checked: true,
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
      smoke_type: "static-docs-package-pointer-implementation-design-only",
      api_route_implemented: false,
      route_file_added: false,
      runtime_behavior_changed: false,
      ui_behavior_changed: false,
      db_schema_migration_changed: false,
      mcp_app_tool_changes_added: false,
      proof_evidence_writes_added: false,
      ag_resume_behavior_added: false,
      codex_sdk_execution_added: false,
      provider_implementation_added: false,
      graph_db_added: false,
      persistence_added: false,
      auth_implementation_added: false,
      external_calls_added: false,
      branch_pr_creation_authority_added: false,
      merge_publish_authority_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:readonly-api-route-implementation-design-packet");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:readonly-api-route-implementation-design-packet",
    expectedCommand:
      "node scripts/smoke-readonly-api-route-implementation-design-packet.mjs",
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
    const headingPattern = new RegExp(
      `^##\\s+\\d+\\.\\s+${escapeRegExp(section)}\\s*$`,
      "m",
    );
    assert(
      headingPattern.test(designText),
      `${designDoc} must contain section: ${section}`,
    );
  }
}

function assertDesignContent() {
  assertContainsAll(designDoc, [
    ...requiredDesignPhrases,
    ...forbiddenFields,
    ...boundaryConcepts,
    ...pr381BaselinePhrases,
    "Auth/session design questions",
    "Workspace/project scope",
    "Response shape mapping",
    "Forbidden fields review",
    "Evidence pointer handling",
    "Perspective Capsule handling",
    "Project Constellation handling",
    "Prompt-injection handling",
    "Privacy and minimization",
    "Error and fail-closed behavior",
    "Required implementation PR evidence",
  ], { textByFile });
}

function assertPlanningBoundaryPointer() {
  assertContainsAll(planningDoc, [
    designDoc,
    "pre-route implementation design artifact",
    "docs/smoke/package-pointer only",
    "does not implement a route",
    checklistDoc,
    responseShapeTypeFile,
    "PR #381",
    "Project Constellation user-intent validation baseline",
    "smoke:readonly-api-route-implementation-design-packet",
  ], { textByFile });
}

function assertChecklistPointer() {
  assertContainsAll(checklistDoc, [
    designDoc,
    "next pre-route artifact",
    planningDoc,
    responseShapeTypeFile,
    "PR #381 user-intent validation baseline",
    "Future route implementation PRs must still answer this checklist before merge",
    "smoke:readonly-api-route-implementation-design-packet",
  ], { textByFile });
}

function assertIndexPointer() {
  assertContainsAll(indexDoc, [
    designDoc,
    "read-only API route implementation design packet",
    "GET /api/augnes/read/constellation-preview",
    "PR #381 Project Constellation user-intent validation baseline",
    "smoke:readonly-api-route-implementation-design-packet",
    "docs/smoke/package-pointer only",
    "no route",
    "no API contract",
    "no runtime behavior",
    "no UI",
    "no auth implementation",
    "no DB",
    "no MCP/App tool",
    "no proof/evidence write",
    "no Codex SDK execution",
    "no provider implementation",
    "no graph DB",
    "no persistence",
    "no AG Resume behavior",
    "no merge/publish/approval/retry/replay/deploy authority",
  ], { textByFile });
}

function assertNoForbiddenPositiveAuthorityGrants() {
  const scopedTexts = [
    { file: designDoc, text: designText },
    {
      file: planningDoc,
      text: extractSourceBetween(
        textByFile.get(planningDoc),
        "`docs/READONLY_API_ROUTE_IMPLEMENTATION_DESIGN_PACKET_V0_1.md`",
        "## Validation and smoke plan",
      ),
    },
    {
      file: checklistDoc,
      text: extractSourceBetween(
        textByFile.get(checklistDoc),
        "`docs/READONLY_API_ROUTE_IMPLEMENTATION_DESIGN_PACKET_V0_1.md`",
        "## Validation and smoke plan",
      ),
    },
    {
      file: indexDoc,
      text: extractSourceBetween(
        textByFile.get(indexDoc),
        "- `docs/READONLY_API_ROUTE_IMPLEMENTATION_DESIGN_PACKET_V0_1.md`",
        "- `PERSPECTIVE_CAPSULE_CONTRACT_V0_1.md`",
      ),
    },
  ];

  for (const { file, text } of scopedTexts) {
    assertNoForbiddenPositiveClauses(file, text);
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

function assertChangedFilesBoundary() {
  const result = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "read-only API route implementation design packet smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for read-only API route implementation design packet smoke: ${file}`,
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
      `Forbidden changed file for read-only API route implementation design packet smoke: ${file}`,
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
    /\b(candidate route|placeholder route|GET route|read-only route|route response|route|endpoint|design packet|PR #381 browser report)\b.{0,140}\b(can|may|is allowed to|is permitted to|has authority to|is authorized to|authorizes?|grants?)\b.{0,180}\b(expose credentials|include mutation URLs?|create proof|create evidence|create readiness|execute Codex|launch Codex|write Augnes state|create branches?|open PRs?|create PRs?|approve route deployment|approve merges?|approve|publish|merge|retry|replay|deploy|persist graph snapshots?|persist graphs?|grant API implementation authority)\b/i,
    /\b(adds?|implements?|enables?|activates?|creates?|records?|writes?|calls?|runs?|executes?|publishes?|approves?|retries|replays|merges?|deploys?|persists?)\b.{0,180}\b(runtime behavior|UI code|API routes?|route files?|route handlers?|API contract|DB schema|migrations?|graph DB|persistence|MCP\/App tools?|ChatGPT App tools?|MCP tools?|auth implementation|external calls?|proof\/evidence writes?|proof writes?|evidence writes?|proof records?|evidence records?|readiness records?|AG Resume behavior|branch creation authority|PR creation authority|merge authority|publish authority|approval authority|Codex SDK execution|provider implementation|credentials|secrets|provider credentials|mutation URLs?|Project Constellation runtime behavior)\b/i,
    /\b(exposes?|includes?)\b.{0,180}\b(credentials|secrets|provider credentials|mutation URLs?|hidden reasoning|chain-of-thought|raw DB rows?|proof\/evidence write handles?|approval\/publish\/merge controls?|Codex SDK execution handles?)\b/i,
    /\b(grants?|adds?|creates?|provides?|authori[sz]es?)\b.{0,140}\b(branch creation authority|PR creation authority|merge authority|publish authority|approval authority|proof\/evidence write authority|Codex SDK execution authority|deploy authority|API implementation authority|route implementation approval)\b/i,
    /\b(navigator\.clipboard|@openai\/codex-sdk|api\.github\.com|api\.openai\.com|fetch\s*\(|XMLHttpRequest|gh\s+(api|pr|issue|repo))\b/i,
  ];

  if (!forbiddenPatterns.some((pattern) => pattern.test(clause))) return false;
  return !isNegatedBoundary(clause);
}

function isNegatedBoundary(clause) {
  return /\b(not|no|does not|do not|must not|never|is not|are not|cannot|can't|by itself)\b/i.test(
    clause,
  );
}

function extractSourceBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `Missing source marker: ${startMarker}`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(end, -1, `Missing source marker after ${startMarker}: ${endMarker}`);
  return source.slice(start, end);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
