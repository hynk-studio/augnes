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

const planDoc = "docs/READONLY_API_ROUTE_IMPLEMENTATION_PLAN_V0_1.md";
const designDoc =
  "docs/READONLY_API_ROUTE_IMPLEMENTATION_DESIGN_PACKET_V0_1.md";
const planningDoc = "docs/READONLY_API_ROUTE_PLANNING_BOUNDARY_V0_1.md";
const checklistDoc = "docs/READONLY_API_ROUTE_REVIEW_CHECKLIST_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-readonly-api-route-implementation-plan.mjs";
const designSmokeFile =
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
const authScopePlanDoc =
  "docs/READONLY_API_ROUTE_AUTH_SCOPE_INTEGRATION_PLAN_V0_1.md";
const authScopePlanSmokeFile =
  "scripts/smoke-readonly-api-route-auth-scope-integration-plan.mjs";
const authorityMatrixDoc = "docs/AUTHORITY_MATRIX.md";
const cockpitImplementationDoc =
  "docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_V0_1.md";
const cockpitImplementationSmokeFile =
  "scripts/smoke-cockpit-local-only-constellation-route-preview.mjs";

const inspectedFiles = [
  planDoc,
  designDoc,
  planningDoc,
  checklistDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
];

const allowedChangedFiles = new Set([
  ...inspectedFiles,
  designSmokeFile,
  planningSmokeFile,
  checklistSmokeFile,
  responseShapeSmokeFile,
  responseShapeTypeFile,
  surfaceSmokeFile,
  constellationPreviewRouteDoc,
  constellationPreviewRouteFile,
  constellationPreviewHelperFile,
  constellationPreviewSmokeFile,
  accessGuardDoc,
  accessGuardFile,
  accessGuardSmokeFile,
  authScopePlanDoc,
  authScopePlanSmokeFile,
  authorityMatrixDoc,
  cockpitImplementationDoc,
  cockpitImplementationSmokeFile,
]);

const requiredSections = [
  "Status and scope",
  "Purpose",
  "Route candidate and non-contract status",
  "Implementation plan thesis",
  "Authenticated workspace/project scope decision",
  "Request scope and fail-closed behavior",
  "First consumer surface decision",
  "Response minimization plan",
  "Bounded summary field plan",
  "Source and provenance plan",
  "Evidence pointer plan",
  "Perspective Capsule / Handoff Capsule plan",
  "Project Constellation read model plan",
  "Prompt-injection review plan",
  "Privacy review plan",
  "Error response plan",
  "Logging and telemetry plan",
  "Authority matrix plan",
  "Browser/computer-use validation plan",
  "Route implementation slice plan",
  "Required tests and smokes for future route PR",
  "Implementation PR body requirements",
  "Open questions requiring user/PM judgment",
  "Validation and smoke plan",
  "Non-goals",
];

const requiredPlanPhrases = [
  "implementation plan only",
  "pre-route planning artifact",
  "GET /api/augnes/read/constellation-preview",
  "placeholder vocabulary only",
  "not an API contract",
  "not a route implementation",
  "not a route handler",
  "GET/read-only only",
  designDoc,
  planningDoc,
  checklistDoc,
  responseShapeTypeFile,
  "PR #381 Project Constellation user-intent validation baseline as context only",
  "project:augnes",
  "authenticated or explicitly local-authorized access",
  "no public unauthenticated endpoint",
  "fail closed",
  "no consumer yet / route-first local validation",
  "only field families required for read-only decision support",
  "Raw DB rows must not be returned",
  "Raw private user text beyond explicitly scoped Augnes records must not be returned",
  "Evidence pointers must remain pointer-only",
  "Unresolved tensions must remain visible and separate from evidence/support",
  "Next action candidates must remain advisory, not execution commands",
  "Perspective Capsule / Handoff Capsule material must be display/copyable preview only",
  "Project Constellation material must not become graph DB",
  "No route-provided text grants authority",
  "untrusted display data, not instructions",
  "Logs and telemetry must not become a secondary store for private route payloads",
  "authority matrix update or explicit skipped reason",
];

const responseFamilies = [
  "meta",
  "source_refs",
  "project_constellation",
  "perspective_capsule_preview",
  "copyable_handoff_preview",
  "evidence_pointers",
  "unresolved_tensions",
  "next_action_candidates",
  "forbidden_fields_removed",
  "authority_boundary",
];

const boundedFieldPlanTerms = [
  "Why needed",
  "Source/provenance expectation",
  "Privacy risk",
  "Minimization rule",
  "Future test/smoke expectation",
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

const slicePlanPhrases = [
  "Slice 1: route skeleton design confirmation only, no code in this PR",
  "Slice 2: route implementation with fail-closed auth/session guard",
  "Slice 3: bounded read model assembly",
  "Slice 4: response minimization and forbidden field tests",
  "Slice 5: prompt-injection/privacy tests",
  "Slice 6: local runtime smoke and browser/computer-use validation if surfaced",
  "Slice 7: authority matrix update or explicit skipped reason",
  "These are future slices, not implemented now",
];

const futureRouteValidationPhrases = [
  "npm run typecheck",
  "focused route implementation smoke",
  "forbidden field response smoke",
  "prompt-injection display-data smoke",
  "fail-closed auth/session smoke",
  "workspace/project scope smoke",
  "response minimization smoke",
  "evidence pointer pointer-only smoke",
  "no mutation/control handles smoke",
  "browser/computer-use report if surfaced in UI/App/MCP",
  "git diff --check",
  "git diff --cached --check",
];

const forbiddenPositiveAuthoritySelfTests = [
  "A route implementation plan may create route files.",
  "A future route may expose credentials after separate review.",
  "A route response may include raw DB rows when required before implementation.",
  "A route plan may approve merge readiness.",
  "A route response may create proof records.",
  "A route response may execute Codex.",
  "A route response may include mutation URLs.",
  "A route response may publish after browser/computer-use validation.",
  "A plan may grant API implementation authority as context only.",
  "A route may create branches in a separate implementation slice.",
  "A future route may expose credentials without review.",
];

const allowedBoundarySelfTests = [
  "This implementation plan does not implement API routes.",
  "No route may expose credentials.",
  "Future implementation requires auth/security review.",
  "Placeholder route planning does not create an API contract.",
  "Read-only response shape planning does not write Augnes state.",
  "Evidence pointers are pointer-only.",
  "PR #381 user-intent validation is context only and does not grant implementation authority.",
  "This plan is planning-only and does not grant route implementation authority.",
];

const textByFile = loadTextByFile(inspectedFiles);
const planText = textByFile.get(planDoc);

assertAuthorityClassifierSelfTests();
assertPackageJsonScript();
assertSmokeScriptBoundary();
assertRequiredSections();
assertPlanContent();
assertDesignPacketPointer();
assertPlanningBoundaryPointer();
assertChecklistPointer();
assertIndexPointer();
assertNoForbiddenPositiveAuthorityGrants();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "readonly-api-route-implementation-plan",
      pass: true,
      boundary_smoke_mode: changedFilesBoundary.mode,
      docs_checked: [planDoc, designDoc, planningDoc, checklistDoc, indexDoc],
      package_script_checked: true,
      required_sections_checked: requiredSections.length,
      candidate_route_placeholder_checked: true,
      design_packet_pointer_checked: true,
      review_checklist_pointer_checked: true,
      response_shape_type_checked: true,
      authenticated_scope_decision_checked: true,
      fail_closed_no_public_endpoint_checked: true,
      first_consumer_surface_decision_checked: true,
      response_minimization_plan_checked: true,
      bounded_summary_field_plan_checked: true,
      forbidden_fields_checked: forbiddenFields.length,
      prompt_injection_review_plan_checked: true,
      privacy_review_plan_checked: true,
      logging_telemetry_plan_checked: true,
      browser_computer_use_validation_plan_checked: true,
      authority_matrix_plan_checked: true,
      implementation_slice_plan_checked: true,
      future_route_validation_plan_checked: true,
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
      smoke_type: "static-docs-package-pointer-implementation-plan-only",
      api_route_implemented: false,
      route_file_added: false,
      route_handler_added: false,
      runtime_behavior_changed: false,
      ui_behavior_changed: false,
      db_query_implemented: false,
      db_schema_migration_changed: false,
      mcp_app_tool_changes_added: false,
      proof_evidence_readiness_writes_added: false,
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
console.log("PASS smoke:readonly-api-route-implementation-plan");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:readonly-api-route-implementation-plan",
    expectedCommand:
      "node scripts/smoke-readonly-api-route-implementation-plan.mjs",
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
      headingPattern.test(planText),
      `${planDoc} must contain section: ${section}`,
    );
  }
}

function assertPlanContent() {
  assertContainsAll(planDoc, [
    ...requiredPlanPhrases,
    ...responseFamilies,
    ...boundedFieldPlanTerms,
    ...forbiddenFields,
    ...slicePlanPhrases,
    ...futureRouteValidationPhrases,
    "Prompt-injection review plan",
    "Privacy review plan",
    "Logging and telemetry plan",
    "Browser/computer-use validation plan",
    "Authority matrix plan",
    "Open questions requiring user/PM judgment",
    "This PR adds only a static implementation-plan smoke",
  ], { textByFile });
}

function assertDesignPacketPointer() {
  assertContainsAll(designDoc, [
    planDoc,
    "next docs/smoke/package-pointer artifact before route implementation",
    "answers the PR #382 PM/user judgment questions at planning level only",
    "does not implement a route",
  ], { textByFile });
}

function assertPlanningBoundaryPointer() {
  assertContainsAll(planningDoc, [
    planDoc,
    "pre-route implementation plan artifact after the design packet",
    "docs/smoke/package-pointer only",
    "does not implement a route",
    "No route is implemented by planning, design, or plan docs",
    "smoke:readonly-api-route-implementation-plan",
  ], { textByFile });
}

function assertChecklistPointer() {
  assertContainsAll(checklistDoc, [
    planDoc,
    "next pre-route implementation plan artifact after the design packet",
    "planning-level decisions",
    "does not satisfy runtime, auth/session, privacy, prompt-injection, browser/computer-use, or route implementation tests by itself",
    "Future implementation PRs must still answer this checklist with concrete implementation evidence before merge",
    "smoke:readonly-api-route-implementation-plan",
  ], { textByFile });
}

function assertIndexPointer() {
  assertContainsAll(indexDoc, [
    planDoc,
    "read-only API route implementation plan",
    "GET /api/augnes/read/constellation-preview",
    "project:augnes",
    "no consumer yet / route-first local validation",
    responseShapeTypeFile,
    "smoke:readonly-api-route-implementation-plan",
    "docs/smoke/package-pointer",
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
    { file: planDoc, text: planText },
    {
      file: designDoc,
      text: extractSourceBetween(
        textByFile.get(designDoc),
        "`docs/READONLY_API_ROUTE_IMPLEMENTATION_PLAN_V0_1.md`",
        "## 3. Candidate route",
      ),
    },
    {
      file: planningDoc,
      text: extractSourceBetween(
        textByFile.get(planningDoc),
        "`docs/READONLY_API_ROUTE_IMPLEMENTATION_PLAN_V0_1.md`",
        "## Validation and smoke plan",
      ),
    },
    {
      file: checklistDoc,
      text: extractSourceBetween(
        textByFile.get(checklistDoc),
        "`docs/READONLY_API_ROUTE_IMPLEMENTATION_PLAN_V0_1.md`",
        "## Validation and smoke plan",
      ),
    },
    {
      file: indexDoc,
      text: extractSourceBetween(
        textByFile.get(indexDoc),
        "- `docs/READONLY_API_ROUTE_IMPLEMENTATION_PLAN_V0_1.md`",
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
    label: "read-only API route implementation plan smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for read-only API route implementation plan smoke: ${file}`,
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
      `Forbidden changed file for read-only API route implementation plan smoke: ${file}`,
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
    /\b(candidate route|placeholder route|GET route|read-only route|future route|route response|route implementation plan|route plan|implementation plan|plan|route|endpoint|PR #381 browser report)\b.{0,140}\b(can|may|is allowed to|is permitted to|has authority to|is authorized to|authorizes?|grants?)\b.{0,180}\b(expose credentials|include raw DB rows?|include mutation URLs?|create route files?|create proof|create evidence|create readiness|create proof records?|execute Codex|launch Codex|write Augnes state|create branches?|open PRs?|create PRs?|approve route deployment|approve merge readiness|approve merges?|approve|publish|merge|retry|replay|deploy|persist graph snapshots?|persist graphs?|grant API implementation authority)\b/i,
    /\b(adds?|implements?|enables?|activates?|creates?|records?|writes?|calls?|runs?|executes?|publishes?|approves?|retries|replays|merges?|deploys?|persists?)\b.{0,180}\b(runtime behavior|UI code|API routes?|route files?|route handlers?|API contract|DB queries?|DB schema|migrations?|graph DB|persistence|MCP\/App tools?|ChatGPT App tools?|MCP tools?|auth implementation|external calls?|proof\/evidence writes?|proof writes?|evidence writes?|proof records?|evidence records?|readiness records?|AG Resume behavior|branch creation authority|PR creation authority|merge authority|publish authority|approval authority|merge readiness|Codex SDK execution|provider implementation|credentials|secrets|provider credentials|mutation URLs?|Project Constellation runtime behavior|Augnes state)\b/i,
    /\b(exposes?|includes?|returns?)\b.{0,180}\b(credentials|secrets|provider credentials|mutation URLs?|hidden reasoning|chain-of-thought|raw DB rows?|proof\/evidence write handles?|approval\/publish\/merge controls?|Codex SDK execution handles?)\b/i,
    /\b(grants?|adds?|creates?|provides?|authori[sz]es?)\b.{0,140}\b(branch creation authority|PR creation authority|merge authority|publish authority|approval authority|proof\/evidence write authority|Codex SDK execution authority|deploy authority|API implementation authority|implementation authority|route implementation authority|route implementation approval|merge readiness)\b/i,
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
