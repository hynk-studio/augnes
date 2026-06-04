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

const sourceSelectionDoc =
  "docs/READONLY_API_ROUTE_AUTH_SOURCE_SELECTION_V0_1.md";
const adapterBoundaryDoc =
  "docs/READONLY_API_ROUTE_AUTH_SCOPE_ADAPTER_BOUNDARY_V0_1.md";
const localDevAdapterPlanDoc =
  "docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_PLAN_V0_1.md";
const authScopeTypeFile = "types/readonly-api-auth-scope.ts";
const authScopePlanDoc =
  "docs/READONLY_API_ROUTE_AUTH_SCOPE_INTEGRATION_PLAN_V0_1.md";
const accessGuardDoc = "docs/READONLY_API_ROUTE_ACCESS_GUARD_V0_1.md";
const constellationPreviewDoc =
  "docs/READONLY_API_ROUTE_CONSTELLATION_PREVIEW_V0_1.md";
const reviewChecklistDoc =
  "docs/READONLY_API_ROUTE_REVIEW_CHECKLIST_V0_1.md";
const authorityMatrixDoc = "docs/AUTHORITY_MATRIX.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile =
  "scripts/smoke-readonly-api-route-auth-source-selection.mjs";
const adapterBoundarySmokeFile =
  "scripts/smoke-readonly-api-route-auth-scope-adapter-boundary.mjs";
const localDevAdapterPlanSmokeFile =
  "scripts/smoke-readonly-api-route-local-dev-auth-adapter-plan.mjs";

const authScopePlanSmokeFile =
  "scripts/smoke-readonly-api-route-auth-scope-integration-plan.mjs";
const accessGuardSmokeFile =
  "scripts/smoke-readonly-api-route-access-guard.mjs";
const constellationPreviewSmokeFile =
  "scripts/smoke-readonly-api-route-constellation-preview.mjs";
const reviewChecklistSmokeFile =
  "scripts/smoke-readonly-api-route-review-checklist.mjs";
const surfaceSmokeFile =
  "scripts/smoke-chatgpt-app-mcp-readonly-surface-boundary.mjs";

const inspectedFiles = [
  sourceSelectionDoc,
  authScopePlanDoc,
  accessGuardDoc,
  constellationPreviewDoc,
  reviewChecklistDoc,
  authorityMatrixDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
];

const allowedChangedFiles = new Set([
  ...inspectedFiles,
  adapterBoundaryDoc,
  authScopeTypeFile,
  adapterBoundarySmokeFile,
  localDevAdapterPlanDoc,
  localDevAdapterPlanSmokeFile,
  authScopePlanSmokeFile,
  accessGuardSmokeFile,
  constellationPreviewSmokeFile,
  reviewChecklistSmokeFile,
  surfaceSmokeFile,
]);

const requiredSections = [
  "Status and scope",
  "Purpose",
  "Source selection thesis",
  "Existing repo-local candidates inspected",
  "Candidate A: Augnes local session/workspace model",
  "Candidate B: local runtime operator session binding",
  "Candidate C: future ChatGPT App/MCP authenticated context",
  "Candidate D: explicit local development auth adapter",
  "Candidate E: defer real auth source and keep route local-only",
  "Selection criteria",
  "Candidate comparison matrix",
  "Recommended decision",
  "Why implementation is still deferred",
  "Required next implementation gates",
  "Relationship to local access guard",
  "Relationship to constellation preview route",
  "Authority and non-authority boundary",
  "Validation and smoke plan",
  "Non-goals",
];

const requiredSelectionPhrases = [
  "docs/smoke/package-pointer only",
  "auth source selection packet only",
  "no auth implementation",
  "no API route behavior change",
  "no consumer surface",
  "GET /api/augnes/read/constellation-preview",
  authScopePlanDoc,
  accessGuardDoc,
  constellationPreviewDoc,
  reviewChecklistDoc,
  "route remains local-only unless a separate implementation PR changes it",
  "future implementation requires concrete auth/session/workspace evidence",
  "No inspected repo-local surface currently supplies both identity proof and workspace/project membership proof",
  "Selection criteria",
  "Candidate comparison matrix",
  "Recommended decision: select Candidate E",
  "Keep the route local-only",
  "Keep no consumer connected",
  "Do not implement auth yet",
  "future type-only auth/scope adapter boundary",
  "concrete source exists in repo today",
  "can prove identity",
  "can prove workspace/project membership",
  "supports `project:augnes` or explicit project scope mapping",
  "can fail closed",
  "does not require secrets/env in this docs-only PR",
  "does not couple first route implementation to a consumer surface",
  "does not require DB schema/migration in this PR",
  "can be tested with static smoke before route behavior change",
  "has clear privacy/prompt-injection/logging boundaries",
];

const inspectedSurfacePhrases = [
  "lib/readonly-api/access-guard.ts",
  "lib/readonly-api/constellation-preview.ts",
  "lib/session-binding.ts",
  "app/api/sessions/bind/route.ts",
  "app/api/sessions/trace/route.ts",
  "scripts/smoke-session-binding.mjs",
  "lib/db/schema.sql",
  "lib/work.ts",
  "lib/state/brief.ts",
  "docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md",
  "docs/CODEX_MCP_AUGNES_BRIDGE_USAGE_V0_1.md",
  "docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md",
  "docs/AUTHORITY_MATRIX.md",
];

const requiredCandidatePhrases = [
  "Candidate A",
  "Candidate B",
  "Candidate C",
  "Candidate D",
  "Candidate E",
  "session rows are continuity records",
  "`actor` is metadata",
  "`surface` is metadata",
  "`scope` is a record label",
  "ChatGPT App/MCP authenticated context is future planning",
  "local runtime operator binding remains local-oriented",
];

const forbiddenPositiveAuthoritySelfTests = [
  "The auth source selection may implement production auth.",
  "The selected source may create OAuth sessions in this PR.",
  "The route may query the database after source selection.",
  "The source selection may grant consumer authority as context only.",
  "The route may expose credentials after source selection.",
  "The selected source may publish after separate review.",
  "The route may execute Codex after workspace membership.",
  "The auth source selection may create proof records.",
  "The source selection may merge after browser-computer-use validation.",
  "The selected source may persist graph snapshots.",
];

const allowedBoundarySelfTests = [
  "This source selection does not implement production auth.",
  "No route may expose credentials.",
  "The local guard is not production auth.",
  "Future real auth integration requires separate implementation.",
  "Evidence pointers are pointer-only.",
  "No route-provided text grants authority.",
  "The selection is planning-only and does not grant consumer authority.",
];

const textByFile = loadTextByFile(inspectedFiles);
const selectionText = textByFile.get(sourceSelectionDoc);
const smokeSource = textByFile.get(smokeFile);

assertAuthorityClassifierSelfTests();
assertPackageJsonScript();
assertSmokeBoundary();
assertRequiredSections();
assertSelectionContent();
assertDocPointers();
assertNoForbiddenPositiveAuthorityGrants();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "readonly-api-route-auth-source-selection",
      pass: true,
      boundary_smoke_mode: changedFilesBoundary.mode,
      auth_source_selection_doc_checked: sourceSelectionDoc,
      docs_checked: [
        sourceSelectionDoc,
        authScopePlanDoc,
        accessGuardDoc,
        constellationPreviewDoc,
        reviewChecklistDoc,
        authorityMatrixDoc,
        indexDoc,
      ],
      package_script_checked: true,
      required_sections_checked: requiredSections.length,
      candidate_sections_checked: 5,
      selection_criteria_checked: true,
      comparison_matrix_checked: true,
      recommended_decision_checked: "Candidate E",
      implementation_deferred_checked: true,
      route_remains_local_only_checked: true,
      future_evidence_gate_checked: true,
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
      smoke_type: "static-docs-smoke-package-pointer-auth-source-selection-only",
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
console.log("PASS smoke:readonly-api-route-auth-source-selection");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:readonly-api-route-auth-source-selection",
    expectedCommand:
      "node scripts/smoke-readonly-api-route-auth-source-selection.mjs",
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
      headingPattern.test(selectionText),
      `${sourceSelectionDoc} must contain section: ${section}`,
    );
  }
}

function assertSelectionContent() {
  assertContainsAll(sourceSelectionDoc, [
    ...requiredSelectionPhrases,
    ...inspectedSurfacePhrases,
    ...requiredCandidatePhrases,
  ], { textByFile });
  assertContainsAll(sourceSelectionDoc, [
    "No inspected repo-local surface currently supplies both identity proof and",
    "workspace/project membership proof",
    "Do not select Candidate A for route auth implementation yet",
    "Do not select Candidate B for this route yet",
    "Do not select Candidate C now",
    "Do not implement Candidate D in this PR",
    "Select Candidate E",
    "Keep the route local-only",
    "Keep no consumer connected",
    "Do not implement auth yet",
    "Likely future files for a type-only/source-boundary PR",
    "These are future candidates, not changed by this PR",
    "This source selection packet does not replace the local guard",
    "The route remains local-only until auth source is selected and separately implemented",
  ], { textByFile });
}

function assertDocPointers() {
  assertContainsAll(authScopePlanDoc, [
    sourceSelectionDoc,
    "next step before any auth/scope adapter implementation",
  ], { textByFile });
  assertContainsAll(accessGuardDoc, [
    sourceSelectionDoc,
    "not production auth",
  ], { textByFile });
  assertContainsAll(constellationPreviewDoc, [
    sourceSelectionDoc,
    "route remains local-only",
    "separately implemented",
  ], { textByFile });
  assertContainsAll(reviewChecklistDoc, [
    sourceSelectionDoc,
    "concrete auth/session/workspace evidence",
  ], { textByFile });
  assertContainsAll(authorityMatrixDoc, [
    sourceSelectionDoc,
    "docs/smoke-only",
    "adds no authority",
  ], { textByFile });
  assertContainsAll(indexDoc, [
    sourceSelectionDoc,
    "smoke:readonly-api-route-auth-source-selection",
    "docs/smoke/package-pointer only",
    "no production auth",
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
    { file: sourceSelectionDoc, text: textByFile.get(sourceSelectionDoc) },
    {
      file: authScopePlanDoc,
      text: extractSourceBetween(
        textByFile.get(authScopePlanDoc),
        "`docs/READONLY_API_ROUTE_AUTH_SOURCE_SELECTION_V0_1.md`",
        "## 3. Current local guard baseline",
      ),
    },
    {
      file: accessGuardDoc,
      text: extractSourceBetween(
        textByFile.get(accessGuardDoc),
        "`docs/READONLY_API_ROUTE_AUTH_SOURCE_SELECTION_V0_1.md`",
        "## 2. Purpose",
      ),
    },
    {
      file: constellationPreviewDoc,
      text: extractSourceBetween(
        textByFile.get(constellationPreviewDoc),
        "`docs/READONLY_API_ROUTE_AUTH_SOURCE_SELECTION_V0_1.md`",
        "## 4. Request shape",
      ),
    },
    {
      file: reviewChecklistDoc,
      text: extractSourceBetween(
        textByFile.get(reviewChecklistDoc),
        "`docs/READONLY_API_ROUTE_AUTH_SOURCE_SELECTION_V0_1.md`",
        "## Privacy boundary",
      ),
    },
    {
      file: authorityMatrixDoc,
      text: extractSourceBetween(
        textByFile.get(authorityMatrixDoc),
        "`docs/READONLY_API_ROUTE_AUTH_SOURCE_SELECTION_V0_1.md`",
        "| Lane id |",
      ),
    },
    {
      file: indexDoc,
      text: extractSourceBetween(
        textByFile.get(indexDoc),
        "- `docs/READONLY_API_ROUTE_AUTH_SOURCE_SELECTION_V0_1.md`",
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
    label: "read-only route auth source selection smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for read-only route auth source selection smoke: ${file}`,
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
      `Forbidden changed file for read-only route auth source selection smoke: ${file}`,
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
    /\b(auth source selection|source selection|selected source|selection|route response|route|response|endpoint)\b.{0,140}\b(can|may|is allowed to|is permitted to|has authority to|is authorized to|authorizes?|grants?)\b.{0,180}\b(implement production auth|create OAuth sessions?|create hosted OAuth session identity|expose credentials|query the database|create proof records?|create evidence|create readiness|execute Codex|launch Codex|include mutation URLs?|include approval\/publish\/merge controls?|return raw DB rows?|create branches?|open PRs?|create PRs?|publish|merge|approve|retry|replay|deploy|persist graph snapshots?|persist graphs?|grant consumer authority)\b/i,
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
