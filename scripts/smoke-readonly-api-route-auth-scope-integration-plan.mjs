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

const authScopePlanDoc =
  "docs/READONLY_API_ROUTE_AUTH_SCOPE_INTEGRATION_PLAN_V0_1.md";
const authSourceSelectionDoc =
  "docs/READONLY_API_ROUTE_AUTH_SOURCE_SELECTION_V0_1.md";
const adapterBoundaryDoc =
  "docs/READONLY_API_ROUTE_AUTH_SCOPE_ADAPTER_BOUNDARY_V0_1.md";
const authScopeTypeFile = "types/readonly-api-auth-scope.ts";
const accessGuardDoc = "docs/READONLY_API_ROUTE_ACCESS_GUARD_V0_1.md";
const constellationPreviewDoc =
  "docs/READONLY_API_ROUTE_CONSTELLATION_PREVIEW_V0_1.md";
const implementationPlanDoc =
  "docs/READONLY_API_ROUTE_IMPLEMENTATION_PLAN_V0_1.md";
const reviewChecklistDoc =
  "docs/READONLY_API_ROUTE_REVIEW_CHECKLIST_V0_1.md";
const authorityMatrixDoc = "docs/AUTHORITY_MATRIX.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile =
  "scripts/smoke-readonly-api-route-auth-scope-integration-plan.mjs";
const authSourceSelectionSmokeFile =
  "scripts/smoke-readonly-api-route-auth-source-selection.mjs";
const adapterBoundarySmokeFile =
  "scripts/smoke-readonly-api-route-auth-scope-adapter-boundary.mjs";

const accessGuardSmokeFile =
  "scripts/smoke-readonly-api-route-access-guard.mjs";
const constellationPreviewSmokeFile =
  "scripts/smoke-readonly-api-route-constellation-preview.mjs";
const implementationPlanSmokeFile =
  "scripts/smoke-readonly-api-route-implementation-plan.mjs";
const reviewChecklistSmokeFile =
  "scripts/smoke-readonly-api-route-review-checklist.mjs";
const surfaceSmokeFile =
  "scripts/smoke-chatgpt-app-mcp-readonly-surface-boundary.mjs";

const inspectedFiles = [
  authScopePlanDoc,
  accessGuardDoc,
  constellationPreviewDoc,
  implementationPlanDoc,
  reviewChecklistDoc,
  authorityMatrixDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
];

const allowedChangedFiles = new Set([
  ...inspectedFiles,
  authSourceSelectionDoc,
  adapterBoundaryDoc,
  authScopeTypeFile,
  authSourceSelectionSmokeFile,
  adapterBoundarySmokeFile,
  accessGuardSmokeFile,
  constellationPreviewSmokeFile,
  implementationPlanSmokeFile,
  reviewChecklistSmokeFile,
  surfaceSmokeFile,
]);

const requiredSections = [
  "Status and scope",
  "Purpose",
  "Current local guard baseline",
  "Real auth/scope integration thesis",
  "Candidate authenticated scope source",
  "Session identity plan",
  "Workspace/project membership plan",
  "Request scope validation plan",
  "Fail-closed behavior plan",
  "Local guard transition plan",
  "Route compatibility plan",
  "Response minimization impact",
  "Prompt-injection and privacy impact",
  "Logging and telemetry impact",
  "Authority matrix impact",
  "Future implementation slices",
  "Future tests and smokes",
  "Browser/computer-use plan",
  "Proof-only closeout plan",
  "Open questions requiring user/PM judgment",
  "Validation and smoke plan",
  "Non-goals",
];

const requiredPlanPhrases = [
  "docs/smoke/package-pointer only",
  "planning-only",
  "does not implement auth/session/workspace behavior",
  "GET /api/augnes/read/constellation-preview",
  accessGuardDoc,
  constellationPreviewDoc,
  "project:augnes",
  "current local guard remains valid for route-only local validation",
  "not production auth",
  "no public unauthenticated endpoint",
  "Candidate authenticated scope source",
  "Option A",
  "Option B",
  "Option C",
  "Option D",
  "Option E",
  "Recommended default: use Option E for now",
  "Keep the route local-only",
  "concrete auth/session/workspace source is selected",
  "Session identity plan",
  "Workspace/project membership plan",
  "Fail-closed behavior plan",
  "Local guard transition plan",
  "Future implementation slices",
  "Future tests and smokes",
  "Browser/computer-use plan",
  "No Cockpit, ChatGPT App, MCP, or consumer should be connected",
  "No secrets/env requirement is added in this planning PR",
];

const failClosedPhrases = [
  "missing identity",
  "missing workspace",
  "missing project",
  "unauthorized workspace",
  "unauthorized project",
  "stale scope",
  "ambiguous scope",
  "cross-workspace scope",
  "invalid session",
  "missing session",
  "unavailable auth source",
];

const futureSlicePhrases = [
  "Slice 1: identify concrete auth/session/workspace source, no route behavior change",
  "Slice 2: type-only auth/scope decision boundary, if needed",
  "Slice 3: route-level auth/scope adapter implementation",
  "Slice 4: fail-closed auth/scope smoke",
  "Slice 5: response minimization recheck",
  "Slice 6: prompt-injection/privacy/logging recheck",
  "Slice 7: local route manual checks",
  "Slice 8: browser/computer-use only if a consumer is surfaced",
  "Slice 9: consumer selection PR",
  "These are future slices, not implemented now",
];

const futureTestPhrases = [
  "focused auth/scope integration smoke",
  "fail-closed missing identity smoke",
  "fail-closed invalid session smoke",
  "fail-closed missing workspace smoke",
  "fail-closed unauthorized workspace smoke",
  "fail-closed cross-workspace scope smoke",
  "fail-closed unavailable auth source smoke",
  "response minimization smoke",
  "forbidden fields smoke",
  "prompt-injection display-data smoke",
  "privacy/logging smoke",
  "browser/computer-use report only if surfaced in UI/App/MCP",
];

const forbiddenPositiveAuthoritySelfTests = [
  "The auth scope integration plan may implement production auth.",
  "The plan may create hosted OAuth session identity.",
  "The route may expose credentials after auth planning.",
  "The route may query the database when required before implementation.",
  "The plan may grant consumer authority as context only.",
  "The plan may publish after browser-computer-use validation.",
  "The route may execute Codex after workspace membership.",
  "The auth plan may create proof records.",
  "The auth plan may merge after separate review.",
  "The auth plan may persist graph snapshots.",
];

const allowedBoundarySelfTests = [
  "This plan does not implement production auth.",
  "No route may expose credentials.",
  "The local guard is not production auth.",
  "Future real auth integration requires separate implementation.",
  "Evidence pointers are pointer-only.",
  "No route-provided text grants authority.",
  "The plan is planning-only and does not grant consumer authority.",
];

const textByFile = loadTextByFile(inspectedFiles);
const planText = textByFile.get(authScopePlanDoc);
const smokeSource = textByFile.get(smokeFile);

assertAuthorityClassifierSelfTests();
assertPackageJsonScript();
assertSmokeBoundary();
assertRequiredSections();
assertPlanContent();
assertDocPointers();
assertNoForbiddenPositiveAuthorityGrants();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "readonly-api-route-auth-scope-integration-plan",
      pass: true,
      boundary_smoke_mode: changedFilesBoundary.mode,
      auth_scope_plan_doc_checked: authScopePlanDoc,
      docs_checked: [
        authScopePlanDoc,
        accessGuardDoc,
        constellationPreviewDoc,
        implementationPlanDoc,
        reviewChecklistDoc,
        authorityMatrixDoc,
        indexDoc,
      ],
      package_script_checked: true,
      required_sections_checked: requiredSections.length,
      local_guard_baseline_checked: true,
      candidate_auth_scope_options_checked: 5,
      recommended_default_checked: true,
      session_identity_plan_checked: true,
      workspace_project_membership_plan_checked: true,
      fail_closed_behavior_plan_checked: true,
      local_guard_transition_plan_checked: true,
      future_implementation_slices_checked: true,
      future_tests_smokes_checked: true,
      browser_computer_use_plan_checked: true,
      authority_matrix_pointer_checked: true,
      index_pointer_checked: true,
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
      smoke_type: "static-docs-smoke-package-pointer-auth-scope-plan-only",
      production_auth_added: false,
      hosted_session_oauth_multi_user_auth_added: false,
      session_identity_implemented: false,
      workspace_membership_implemented: false,
      route_behavior_changed: false,
      consumer_surface_connected: false,
      ui_behavior_changed: false,
      db_query_implemented: false,
      db_schema_migration_changed: false,
      mcp_app_tool_changes_added: false,
      proof_evidence_readiness_writes_added: false,
      ag_resume_behavior_added: false,
      codex_sdk_execution_added: false,
      graph_db_added: false,
      persistence_added: false,
      external_calls_added: false,
      merge_publish_authority_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:readonly-api-route-auth-scope-integration-plan");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:readonly-api-route-auth-scope-integration-plan",
    expectedCommand:
      "node scripts/smoke-readonly-api-route-auth-scope-integration-plan.mjs",
  });
}

function assertSmokeBoundary() {
  assertNoRuntimeImports({
    file: smokeFile,
    text: smokeSource,
    forbiddenImports: [
      "../app/",
      "../app/api/",
      "../lib/",
      "components/",
      "db/",
      "migrations/",
      "apps/augnes_apps/",
      "@openai/codex-sdk",
      "openai",
      "provider",
      "providers",
    ],
  });
  assert.doesNotMatch(smokeSource, /\bfetch\s*\(/, "smoke must not call fetch");
  const xhrToken = "XMLHttp" + "Request";
  assert(!smokeSource.includes(xhrToken), `smoke must not use ${xhrToken}`);
  assert.doesNotMatch(smokeSource, /\bapi\.github\.com\b/, "smoke must not call GitHub APIs");
  assert.doesNotMatch(smokeSource, /\bapi\.openai\.com\b/, "smoke must not call OpenAI APIs");
}

function assertRequiredSections() {
  for (const section of requiredSections) {
    const headingPattern = new RegExp(
      `^##\\s+\\d+\\.\\s+${escapeRegExp(section)}\\s*$`,
      "m",
    );
    assert(
      headingPattern.test(planText),
      `${authScopePlanDoc} must contain section: ${section}`,
    );
  }
}

function assertPlanContent() {
  assertContainsAll(authScopePlanDoc, [
    ...requiredPlanPhrases,
    ...failClosedPhrases,
    ...futureSlicePhrases,
    ...futureTestPhrases,
  ], { textByFile });
  assertContainsAll(authScopePlanDoc, [
    "must not silently infer workspace/project scope from",
    "headers other than explicitly reviewed auth/session headers",
    "request body text",
    "Future real auth/session/workspace integration must be separate from the local marker guard",
    "The local marker guard must not replace real auth",
    "There must be no public unauthenticated endpoint",
    "This planning PR does not add logging or telemetry behavior",
    "This plan adds no authority",
  ], { textByFile });
}

function assertDocPointers() {
  assertContainsAll(accessGuardDoc, [
    authScopePlanDoc,
    "next planning step beyond this local marker guard",
    "still is not production auth",
  ], { textByFile });
  assertContainsAll(constellationPreviewDoc, [
    authScopePlanDoc,
    "remains explicitly local-authorized only",
  ], { textByFile });
  assertContainsAll(implementationPlanDoc, [
    authScopePlanDoc,
    "planning level only",
    "does not implement production auth",
  ], { textByFile });
  assertContainsAll(reviewChecklistDoc, [
    authScopePlanDoc,
    "smoke:readonly-api-route-auth-scope-integration-plan",
    "concrete auth/session evidence",
  ], { textByFile });
  assertContainsAll(authorityMatrixDoc, [
    authScopePlanDoc,
    "adds no authority",
    "does not implement production auth",
    "workspace membership",
    "no consumer authority",
  ], { textByFile });
  assertContainsAll(indexDoc, [
    authScopePlanDoc,
    "smoke:readonly-api-route-auth-scope-integration-plan",
    "docs/smoke/package-pointer only",
    "no production auth",
    "no hosted/session/OAuth/multi-user auth",
    "no route behavior change",
    "no consumer surface",
    "no DB query",
    "no UI",
    "no MCP/App tool",
    "no proof/evidence write",
    "no Codex SDK execution",
    "no graph DB",
    "no persistence",
    "no merge/publish/approval/retry/replay/deploy authority",
  ], { textByFile });
}

function assertNoForbiddenPositiveAuthorityGrants() {
  const scopedTexts = [
    { file: authScopePlanDoc, text: textByFile.get(authScopePlanDoc) },
    {
      file: accessGuardDoc,
      text: extractSourceBetween(
        textByFile.get(accessGuardDoc),
        "`docs/READONLY_API_ROUTE_AUTH_SCOPE_INTEGRATION_PLAN_V0_1.md`",
        "## 2. Purpose",
      ),
    },
    {
      file: constellationPreviewDoc,
      text: extractSourceBetween(
        textByFile.get(constellationPreviewDoc),
        "`docs/READONLY_API_ROUTE_AUTH_SCOPE_INTEGRATION_PLAN_V0_1.md`",
        "## 4. Request shape",
      ),
    },
    {
      file: implementationPlanDoc,
      text: extractSourceBetween(
        textByFile.get(implementationPlanDoc),
        "`docs/READONLY_API_ROUTE_AUTH_SCOPE_INTEGRATION_PLAN_V0_1.md`",
        "## 2. Purpose",
      ),
    },
    {
      file: reviewChecklistDoc,
      text: extractSourceBetween(
        textByFile.get(reviewChecklistDoc),
        "`docs/READONLY_API_ROUTE_AUTH_SCOPE_INTEGRATION_PLAN_V0_1.md`",
        "## Privacy boundary",
      ),
    },
    {
      file: authorityMatrixDoc,
      text: extractSourceBetween(
        textByFile.get(authorityMatrixDoc),
        "`docs/READONLY_API_ROUTE_AUTH_SCOPE_INTEGRATION_PLAN_V0_1.md`",
        "| Lane id |",
      ),
    },
    {
      file: indexDoc,
      text: extractSourceBetween(
        textByFile.get(indexDoc),
        "- `docs/READONLY_API_ROUTE_AUTH_SCOPE_INTEGRATION_PLAN_V0_1.md`",
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
    label: "read-only route auth scope integration plan smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for read-only route auth scope integration plan smoke: ${file}`,
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
    /^app\//,
    /^lib\//,
    /^components\//,
    /^db\//,
    /^migrations\//,
    /^apps\/augnes_apps\//,
    /^reports\/browser\//,
    /^screenshots\//,
    /(^|\/)(secret|secrets|env)(\/|$)/i,
    /(^|\/)\.env/i,
    /(^|\/)(ag-work-resume|ag_resume|ag-resume)(\/|$)/i,
    /(^|\/)(proof|evidence).*(writer|record|route|helper)/i,
    /(^|\/)(sidecar-runtime|sidecar_et_runtime|sidecar-et-runtime|runtime-sidecar)(\/|$)/i,
    /(^|\/)(codex-sdk|codex_sdk|provider|providers)(\/|$)/i,
    /(^|\/)(project-constellation).*(runtime|provider|engine|db|persistence)/i,
  ];

  for (const file of files) {
    assert(
      !forbiddenPatterns.some((pattern) => pattern.test(file)),
      `Forbidden changed file for read-only route auth scope integration plan smoke: ${file}`,
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
  const xhrPattern = "XMLHttp" + "Request";
  const forbiddenPatterns = [
    /\b(auth scope integration plan|auth plan|plan|route response|route|response|endpoint)\b.{0,140}\b(can|may|is allowed to|is permitted to|has authority to|is authorized to|authorizes?|grants?)\b.{0,180}\b(implement production auth|create hosted OAuth session identity|expose credentials|query the database|create proof records?|create evidence|create readiness|execute Codex|launch Codex|include mutation URLs?|include approval\/publish\/merge controls?|return raw DB rows?|create branches?|open PRs?|create PRs?|publish|merge|approve|retry|replay|deploy|persist graph snapshots?|persist graphs?|grant consumer authority)\b/i,
    /\b(adds?|implements?|enables?|activates?|creates?|records?|writes?|calls?|runs?|executes?|publishes?|approves?|retries|replays|merges?|deploys?|persists?|queries?)\b.{0,180}\b(production auth|hosted auth|OAuth|hosted OAuth|session identity|multi-user tenancy|workspace membership|UI code|consumer surface|Cockpit integration|ChatGPT App component|MCP\/App tools?|MCP tools?|DB queries?|database queries?|DB schema|migrations?|graph DB|persistence|external calls?|OpenAI calls?|GitHub calls?|proof\/evidence writes?|proof writes?|evidence writes?|readiness writes?|proof records?|evidence records?|readiness records?|AG Resume behavior|branch creation authority|PR creation authority|merge authority|publish authority|approval authority|Codex SDK execution|provider implementation|credentials|secrets|provider credentials|mutation URLs?|graph snapshots?)\b/i,
    /\b(exposes?|includes?|returns?)\b.{0,180}\b(credentials|secrets|provider credentials|mutation URLs?|hidden reasoning|chain-of-thought|raw DB rows?|proof\/evidence write handles?|approval\/publish\/merge controls?|Codex SDK execution handles?|branch\/PR creation handles?)\b/i,
    /\b(grants?|adds?|creates?|provides?|authori[sz]es?)\b.{0,140}\b(consumer authority|branch creation authority|PR creation authority|merge authority|publish authority|approval authority|proof\/evidence write authority|Codex SDK execution authority|deploy authority|auth authority|implementation authority|route implementation authority)\b/i,
    new RegExp(
      `\\b(navigator\\.clipboard|@openai\\/codex-sdk|api\\.github\\.com|api\\.openai\\.com|fetch\\s*\\(|${xhrPattern}|gh\\s+(api|pr|issue|repo))\\b`,
      "i",
    ),
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
