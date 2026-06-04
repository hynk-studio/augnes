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
import routeModule from "../app/api/augnes/read/constellation-preview/route.ts";
import accessGuardModule from "../lib/readonly-api/access-guard.ts";
import helperModule from "../lib/readonly-api/constellation-preview.ts";

const { GET } = routeModule;
const { READONLY_LOCAL_HOSTS, validateReadonlyApiLocalAccess } =
  accessGuardModule;
const {
  CONSTELLATION_PREVIEW_ACCESS_POLICY,
  CONSTELLATION_PREVIEW_LOCAL_READ_HEADER,
  CONSTELLATION_PREVIEW_LOCAL_READ_MARKER,
  CONSTELLATION_PREVIEW_SCOPE,
} = helperModule;

const accessGuardFile = "lib/readonly-api/access-guard.ts";
const helperFile = "lib/readonly-api/constellation-preview.ts";
const routeFile = "app/api/augnes/read/constellation-preview/route.ts";
const accessGuardDoc = "docs/READONLY_API_ROUTE_ACCESS_GUARD_V0_1.md";
const authScopePlanDoc =
  "docs/READONLY_API_ROUTE_AUTH_SCOPE_INTEGRATION_PLAN_V0_1.md";
const authSourceSelectionDoc =
  "docs/READONLY_API_ROUTE_AUTH_SOURCE_SELECTION_V0_1.md";
const adapterBoundaryDoc =
  "docs/READONLY_API_ROUTE_AUTH_SCOPE_ADAPTER_BOUNDARY_V0_1.md";
const authScopeTypeFile = "types/readonly-api-auth-scope.ts";
const routeDoc = "docs/READONLY_API_ROUTE_CONSTELLATION_PREVIEW_V0_1.md";
const planDoc = "docs/READONLY_API_ROUTE_IMPLEMENTATION_PLAN_V0_1.md";
const designDoc =
  "docs/READONLY_API_ROUTE_IMPLEMENTATION_DESIGN_PACKET_V0_1.md";
const planningDoc = "docs/READONLY_API_ROUTE_PLANNING_BOUNDARY_V0_1.md";
const checklistDoc = "docs/READONLY_API_ROUTE_REVIEW_CHECKLIST_V0_1.md";
const authorityMatrixDoc = "docs/AUTHORITY_MATRIX.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const accessGuardSmokeFile =
  "scripts/smoke-readonly-api-route-access-guard.mjs";
const authScopePlanSmokeFile =
  "scripts/smoke-readonly-api-route-auth-scope-integration-plan.mjs";
const authSourceSelectionSmokeFile =
  "scripts/smoke-readonly-api-route-auth-source-selection.mjs";
const adapterBoundarySmokeFile =
  "scripts/smoke-readonly-api-route-auth-scope-adapter-boundary.mjs";
const routeSmokeFile =
  "scripts/smoke-readonly-api-route-constellation-preview.mjs";
const planSmokeFile =
  "scripts/smoke-readonly-api-route-implementation-plan.mjs";
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

const inspectedFiles = [
  accessGuardFile,
  helperFile,
  routeFile,
  accessGuardDoc,
  authScopePlanDoc,
  routeDoc,
  planDoc,
  checklistDoc,
  authorityMatrixDoc,
  indexDoc,
  packageJsonFile,
  accessGuardSmokeFile,
  routeSmokeFile,
];

const allowedChangedFiles = new Set([
  ...inspectedFiles,
  designDoc,
  planningDoc,
  authSourceSelectionDoc,
  adapterBoundaryDoc,
  authScopeTypeFile,
  authScopePlanSmokeFile,
  authSourceSelectionSmokeFile,
  adapterBoundarySmokeFile,
  planSmokeFile,
  designSmokeFile,
  planningSmokeFile,
  checklistSmokeFile,
  responseShapeSmokeFile,
  surfaceSmokeFile,
]);

const requiredSections = [
  "Status and scope",
  "Purpose",
  "Guard policy",
  "Local authorization boundary",
  "Scope validation",
  "Forwarded host handling",
  "Method handling",
  "Error behavior",
  "Relationship to constellation preview route",
  "Relationship to future real auth",
  "Security limits",
  "Tests and smokes",
  "Non-goals",
];

const requiredGuardDocPhrases = [
  "local read-only route access guard",
  "not production auth",
  "no hosted/session/OAuth/multi-user auth",
  "no secrets/env handling",
  "no consumer surface",
  "no DB query",
  "no persistence",
  "no proof/evidence/readiness writes",
  "no publish/merge/approval/retry/replay/deploy authority",
  "fail-closed local validation boundary",
  "x-augnes-local-readonly",
  "constellation-preview-v0.1",
  "scope=project:augnes",
  "X-Forwarded-Host",
  "disallowed_forwarded_host",
  "method_not_allowed",
  "Future real authenticated workspace/project integration remains separate scope",
  "npm run smoke:readonly-api-route-access-guard",
];

const forbiddenPositiveAuthoritySelfTests = [
  "The access guard may expose credentials after local authorization.",
  "The local access guard may become production auth.",
  "The access guard may create proof records.",
  "The route may execute Codex after local authorization.",
  "The route response may include mutation URLs.",
  "The route may publish after browser-computer-use validation.",
  "The guard may grant consumer authority as context only.",
  "The route may create branches in a separate implementation slice.",
  "The guard may persist graph snapshots.",
  "The guard may query the database.",
];

const allowedBoundarySelfTests = [
  "This access guard does not implement production auth.",
  "No route may expose credentials.",
  "Evidence pointers are pointer-only.",
  "The response does not grant implementation authority.",
  "No route-provided text grants authority.",
  "The guard is local-only and does not grant consumer authority.",
  "Next action candidates are advisory and not execution commands.",
];

const textByFile = loadTextByFile(inspectedFiles);
const accessGuardSource = textByFile.get(accessGuardFile);
const helperSource = textByFile.get(helperFile);
const routeSource = textByFile.get(routeFile);

assertAuthorityClassifierSelfTests();
assertPackageJsonScript();
assertGuardSource();
assertRouteUsesGuard();
assertRequiredDocs();
assertGuardBehavior();
await assertRouteCompatibility();
assertNoForbiddenPositiveAuthorityGrants();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "readonly-api-route-access-guard",
      pass: true,
      boundary_smoke_mode: changedFilesBoundary.mode,
      access_guard_file_checked: accessGuardFile,
      helper_file_checked: helperFile,
      route_file_checked: routeFile,
      access_guard_doc_checked: accessGuardDoc,
      package_script_checked: true,
      expected_exports_checked: true,
      local_authorization_checked: true,
      forwarded_host_hardening_checked: true,
      method_handling_checked: true,
      route_compatibility_checked: true,
      minimal_error_body_checked: true,
      docs_index_authority_pointers_checked: true,
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
      smoke_type: "route-access-scope-guard-local-validation",
      production_auth_added: false,
      hosted_session_oauth_multi_user_auth_added: false,
      consumer_surface_connected: false,
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
      external_calls_added: false,
      branch_pr_creation_authority_added: false,
      merge_publish_authority_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:readonly-api-route-access-guard");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:readonly-api-route-access-guard",
    expectedCommand:
      "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-readonly-api-route-access-guard.mjs",
  });
}

function assertGuardSource() {
  assertContainsAll(accessGuardFile, [
    "export const READONLY_LOCAL_HOSTS",
    "export type ReadonlyApiAccessPolicy",
    "export type ReadonlyApiAccessResult",
    "export type ReadonlyApiAccessErrorCode",
    "export type ReadonlyApiAccessErrorStatus",
    "export function validateReadonlyApiLocalAccess",
    "malformed_request",
    "missing_scope",
    "unauthorized_scope",
    "local_authorization_required",
    "disallowed_forwarded_host",
    "method_not_allowed",
    "x-forwarded-host",
    "request.method",
  ], { textByFile });

  assert.deepEqual(READONLY_LOCAL_HOSTS, ["localhost", "127.0.0.1", "::1"]);
  assert.equal(typeof validateReadonlyApiLocalAccess, "function");

  assertNoRuntimeImports({
    file: accessGuardFile,
    text: accessGuardSource,
    forbiddenImports: [
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
  assert.doesNotMatch(accessGuardSource, /\bfetch\s*\(/, "guard must not call fetch");
  assert.doesNotMatch(accessGuardSource, /\bXMLHttpRequest\b/, "guard must not use XMLHttpRequest");
  assert.doesNotMatch(accessGuardSource, /\bapi\.github\.com\b/, "guard must not call GitHub APIs");
  assert.doesNotMatch(accessGuardSource, /\bapi\.openai\.com\b/, "guard must not call OpenAI APIs");
  assert.doesNotMatch(accessGuardSource, /\breadFile(Sync)?\b/, "guard must not read files");
}

function assertRouteUsesGuard() {
  assertContainsAll(helperFile, [
    "@/lib/readonly-api/access-guard",
    "validateReadonlyApiLocalAccess",
    "CONSTELLATION_PREVIEW_ACCESS_POLICY",
    "READONLY_LOCAL_HOSTS",
    "required_scope: CONSTELLATION_PREVIEW_SCOPE",
    "required_marker_header: CONSTELLATION_PREVIEW_LOCAL_READ_HEADER",
    "required_marker_value: CONSTELLATION_PREVIEW_LOCAL_READ_MARKER",
  ], { textByFile });
  assertContainsAll(routeFile, [
    "validateConstellationPreviewRequest",
    "buildConstellationPreviewError",
    "authorityBoundary: validation.authority_boundary",
  ], { textByFile });
}

function assertRequiredDocs() {
  for (const section of requiredSections) {
    const headingPattern = new RegExp(
      `^##\\s+\\d+\\.\\s+${escapeRegExp(section)}\\s*$`,
      "m",
    );
    assert(
      headingPattern.test(textByFile.get(accessGuardDoc)),
      `${accessGuardDoc} must contain section: ${section}`,
    );
  }

  assertContainsAll(accessGuardDoc, requiredGuardDocPhrases, { textByFile });
  assertContainsAll(routeDoc, [
    accessGuardDoc,
    "shared read-only access guard",
    "not production auth",
    "X-Forwarded-Host",
    "disallowed_forwarded_host",
    "method_not_allowed",
    "npm run smoke:readonly-api-route-access-guard",
  ], { textByFile });
  assertContainsAll(planDoc, [
    accessGuardDoc,
    "Future real authenticated workspace/project integration remains separate scope",
  ], { textByFile });
  assertContainsAll(checklistDoc, [
    accessGuardDoc,
    "not production auth",
    "smoke:readonly-api-route-access-guard",
    "concrete auth/session evidence beyond this local guard",
  ], { textByFile });
  assertContainsAll(authorityMatrixDoc, [
    "lib/readonly-api/access-guard.ts",
    "local-only",
    "fail-closed",
    "not production auth",
    "no consumer authority",
    "no proof/evidence/readiness authority",
  ], { textByFile });
  assertContainsAll(indexDoc, [
    accessGuardDoc,
    "smoke:readonly-api-route-access-guard",
    "not production auth",
    "no hosted/session/OAuth/multi-user auth",
    "no secrets/env handling",
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

function assertGuardBehavior() {
  const valid = validateReadonlyApiLocalAccess(makeRequest(), CONSTELLATION_PREVIEW_ACCESS_POLICY);
  assert.deepEqual(valid, {
    ok: true,
    scope: CONSTELLATION_PREVIEW_SCOPE,
    route_id: "augnes.read.constellation-preview.v0.1",
    route_family: "project_constellation",
    local_authorized: true,
  });

  assertGuardError({
    label: "missing scope",
    request: makeRequest({ scope: null }),
    status: 400,
    code: "missing_scope",
  });
  assertGuardError({
    label: "wrong scope",
    request: makeRequest({ scope: "project:wrong" }),
    status: 403,
    code: "unauthorized_scope",
  });
  assertGuardError({
    label: "missing marker",
    request: makeRequest({ marker: null }),
    status: 403,
    code: "local_authorization_required",
  });
  assertGuardError({
    label: "wrong marker",
    request: makeRequest({ marker: "wrong-marker" }),
    status: 403,
    code: "local_authorization_required",
  });
  assertGuardError({
    label: "non-local URL host",
    request: makeRequest({ urlHost: "example.com" }),
    status: 403,
    code: "local_authorization_required",
  });
  assertGuardError({
    label: "non-local Host header",
    request: makeRequest({ headers: { Host: "example.com" } }),
    status: 403,
    code: "local_authorization_required",
  });
  assertGuardError({
    label: "non-local forwarded host",
    request: makeRequest({ headers: { "X-Forwarded-Host": "example.com" } }),
    status: 403,
    code: "disallowed_forwarded_host",
  });
  assertGuardError({
    label: "malformed request",
    request: {
      url: "not a valid url",
      method: "GET",
      headers: new Headers(),
    },
    status: 400,
    code: "malformed_request",
  });

  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
    assertGuardError({
      label: `${method} method`,
      request: makeRequest({ method }),
      status: 405,
      code: "method_not_allowed",
    });
  }
}

async function assertRouteCompatibility() {
  const response = await GET(makeRequest());
  assert.equal(response.status, 200, "valid route request must still return 200");
  const body = await response.json();
  assert.equal(body.response_version, "readonly_api_route_response.v0.1");
  assert.equal(body.meta.project_scope, CONSTELLATION_PREVIEW_SCOPE);
  assert.equal(
    body.project_constellation.constellation_id,
    "project_constellation.sample.sidecar_strategy_c.v0_1",
  );
  assert.equal(body.perspective_capsule_preview, undefined);
  assert.equal(body.copyable_handoff_preview, undefined);
  assert.equal(body.whole_perspective, undefined);
  assert.equal(body.boundary_next_review, undefined);
  assert.ok(Array.isArray(body.evidence_pointers) && body.evidence_pointers.length > 0);

  await assertRouteError({
    label: "route missing marker",
    request: makeRequest({ marker: null }),
    status: 403,
    code: "local_authorization_required",
  });
  await assertRouteError({
    label: "route wrong scope",
    request: makeRequest({ scope: "project:wrong" }),
    status: 403,
    code: "unauthorized_scope",
  });
  await assertRouteError({
    label: "route non-local forwarded host",
    request: makeRequest({ headers: { "X-Forwarded-Host": "example.com" } }),
    status: 403,
    code: "disallowed_forwarded_host",
  });
}

function assertGuardError({ label, request, status, code }) {
  const result = validateReadonlyApiLocalAccess(request, CONSTELLATION_PREVIEW_ACCESS_POLICY);
  assert.equal(result.ok, false, `${label} must fail closed`);
  assert.equal(result.status, status, `${label} status`);
  assert.equal(result.code, code, `${label} code`);
  assert.ok(Array.isArray(result.authority_boundary), `${label} boundary`);
  assertContainsAll(JSON.stringify(result.authority_boundary), [
    "fail-closed local validation boundary",
    "not production auth",
    "no route-provided text grants authority",
  ]);
}

async function assertRouteError({ label, request, status, code }) {
  const response = await GET(request);
  assert.equal(response.status, status, `${label} status`);
  const body = await response.json();
  assert.deepEqual(
    Object.keys(body).sort(),
    ["authority_boundary", "error", "response_version"].sort(),
    `${label} body must be minimal`,
  );
  assert.equal(body.response_version, "readonly_api_route_response.v0.1");
  assert.deepEqual(body.error, { code, status });
  assert.equal(body.source_refs, undefined);
  assert.equal(body.project_constellation, undefined);
}

function makeRequest({
  urlHost = "127.0.0.1:3000",
  scope = "project:augnes",
  marker = CONSTELLATION_PREVIEW_LOCAL_READ_MARKER,
  method = "GET",
  headers = {},
} = {}) {
  const requestHeaders = new Headers(headers);
  if (marker !== null) {
    requestHeaders.set(CONSTELLATION_PREVIEW_LOCAL_READ_HEADER, marker);
  }

  const query = scope === null ? "" : `?scope=${encodeURIComponent(scope)}`;
  return new Request(
    `http://${urlHost}/api/augnes/read/constellation-preview${query}`,
    {
      method,
      headers: requestHeaders,
    },
  );
}

function assertNoForbiddenPositiveAuthorityGrants() {
  const scopedTexts = [
    { file: accessGuardDoc, text: textByFile.get(accessGuardDoc) },
    {
      file: routeDoc,
      text: extractSourceBetween(
        textByFile.get(routeDoc),
        "`docs/READONLY_API_ROUTE_ACCESS_GUARD_V0_1.md`",
        "## 4. Request shape",
      ),
    },
    {
      file: planDoc,
      text: extractSourceBetween(
        textByFile.get(planDoc),
        "`docs/READONLY_API_ROUTE_ACCESS_GUARD_V0_1.md`",
        "## 2. Purpose",
      ),
    },
    {
      file: checklistDoc,
      text: extractSourceBetween(
        textByFile.get(checklistDoc),
        "`docs/READONLY_API_ROUTE_ACCESS_GUARD_V0_1.md`",
        "## Privacy boundary",
      ),
    },
    {
      file: authorityMatrixDoc,
      text: extractSourceBetween(
        textByFile.get(authorityMatrixDoc),
        "`lib/readonly-api/access-guard.ts`",
        "| Lane id |",
      ),
    },
    {
      file: indexDoc,
      text: extractSourceBetween(
        textByFile.get(indexDoc),
        "- `docs/READONLY_API_ROUTE_ACCESS_GUARD_V0_1.md`",
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
    label: "read-only route access guard smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for read-only route access guard smoke: ${file}`,
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
  const exactAllowedRouteFiles = new Set([routeFile]);
  const exactAllowedLibFiles = new Set([accessGuardFile, helperFile]);
  const forbiddenPatterns = [
    /^AGENTS\.md$/,
    /^components\//,
    /^db\//,
    /^migrations\//,
    /^apps\/augnes_apps\//,
    /^reports\/browser\//,
    /^screenshots\//,
    /^app\//,
    /^lib\//,
    /(^|\/)(secret|secrets|env)(\/|$)/i,
    /(^|\/)\.env/i,
    /(^|\/)(ag-work-resume|ag_resume|ag-resume)(\/|$)/i,
    /(^|\/)(proof|evidence).*(writer|record|route|helper)/i,
    /(^|\/)(sidecar-runtime|sidecar_et_runtime|sidecar-et-runtime|runtime-sidecar)(\/|$)/i,
    /(^|\/)(codex-sdk|codex_sdk|provider|providers)(\/|$)/i,
    /(^|\/)(project-constellation).*(runtime|provider|engine|db|persistence)/i,
  ];

  for (const file of files) {
    if (exactAllowedRouteFiles.has(file) || exactAllowedLibFiles.has(file)) continue;
    assert(
      !forbiddenPatterns.some((pattern) => pattern.test(file)),
      `Forbidden changed file for read-only route access guard smoke: ${file}`,
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
    /\b(access guard|local access guard|guard|route response|route|response|endpoint)\b.{0,140}\b(can|may|is allowed to|is permitted to|has authority to|is authorized to|authorizes?|grants?)\b.{0,180}\b(expose credentials|become production auth|create proof records?|create evidence|create readiness|execute Codex|launch Codex|include mutation URLs?|include approval\/publish\/merge controls?|return raw DB rows?|create branches?|open PRs?|create PRs?|publish|merge|approve|retry|replay|deploy|persist graph snapshots?|persist graphs?|query the database|grant consumer authority)\b/i,
    /\b(adds?|implements?|enables?|activates?|creates?|records?|writes?|calls?|runs?|executes?|publishes?|approves?|retries|replays|merges?|deploys?|persists?|queries?)\b.{0,180}\b(production auth|hosted\/session\/OAuth\/multi-user auth|UI code|consumer surface|Cockpit integration|ChatGPT App component|MCP\/App tools?|MCP tools?|DB queries?|database queries?|DB schema|migrations?|graph DB|persistence|external calls?|OpenAI calls?|GitHub calls?|proof\/evidence writes?|proof writes?|evidence writes?|readiness writes?|proof records?|evidence records?|readiness records?|AG Resume behavior|branch creation authority|PR creation authority|merge authority|publish authority|approval authority|Codex SDK execution|provider implementation|credentials|secrets|provider credentials|mutation URLs?|Project Constellation runtime behavior|graph snapshots?)\b/i,
    /\b(exposes?|includes?|returns?)\b.{0,180}\b(credentials|secrets|provider credentials|mutation URLs?|hidden reasoning|chain-of-thought|raw DB rows?|proof\/evidence write handles?|approval\/publish\/merge controls?|Codex SDK execution handles?|branch\/PR creation handles?)\b/i,
    /\b(grants?|adds?|creates?|provides?|authori[sz]es?)\b.{0,140}\b(consumer authority|branch creation authority|PR creation authority|merge authority|publish authority|approval authority|proof\/evidence write authority|Codex SDK execution authority|deploy authority|API implementation authority|implementation authority|route implementation authority)\b/i,
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
