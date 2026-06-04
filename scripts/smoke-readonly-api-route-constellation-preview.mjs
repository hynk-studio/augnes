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
import helperModule from "../lib/readonly-api/constellation-preview.ts";

const { GET } = routeModule;
const {
  CONSTELLATION_PREVIEW_LOCAL_READ_HEADER,
  CONSTELLATION_PREVIEW_LOCAL_READ_MARKER,
  CONSTELLATION_PREVIEW_SCOPE,
  buildConstellationPreviewResponse,
  validateConstellationPreviewRequest,
} = helperModule;

const routeFile = "app/api/augnes/read/constellation-preview/route.ts";
const accessGuardFile = "lib/readonly-api/access-guard.ts";
const helperFile = "lib/readonly-api/constellation-preview.ts";
const accessGuardDoc = "docs/READONLY_API_ROUTE_ACCESS_GUARD_V0_1.md";
const authScopePlanDoc =
  "docs/READONLY_API_ROUTE_AUTH_SCOPE_INTEGRATION_PLAN_V0_1.md";
const authSourceSelectionDoc =
  "docs/READONLY_API_ROUTE_AUTH_SOURCE_SELECTION_V0_1.md";
const adapterBoundaryDoc =
  "docs/READONLY_API_ROUTE_AUTH_SCOPE_ADAPTER_BOUNDARY_V0_1.md";
const localDevAdapterPlanDoc =
  "docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_PLAN_V0_1.md";
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
const smokeFile =
  "scripts/smoke-readonly-api-route-constellation-preview.mjs";
const accessGuardSmokeFile =
  "scripts/smoke-readonly-api-route-access-guard.mjs";
const authScopePlanSmokeFile =
  "scripts/smoke-readonly-api-route-auth-scope-integration-plan.mjs";
const authSourceSelectionSmokeFile =
  "scripts/smoke-readonly-api-route-auth-source-selection.mjs";
const adapterBoundarySmokeFile =
  "scripts/smoke-readonly-api-route-auth-scope-adapter-boundary.mjs";
const localDevAdapterPlanSmokeFile =
  "scripts/smoke-readonly-api-route-local-dev-auth-adapter-plan.mjs";
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
const responseShapeTypeFile = "types/readonly-api-route-response.ts";
const staticFixtureFile =
  "fixtures/project-constellation.sample.sidecar-strategy-c-v0.1.json";

const inspectedFiles = [
  routeFile,
  accessGuardFile,
  helperFile,
  accessGuardDoc,
  authScopePlanDoc,
  routeDoc,
  planDoc,
  designDoc,
  planningDoc,
  checklistDoc,
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
  localDevAdapterPlanDoc,
  accessGuardSmokeFile,
  authScopePlanSmokeFile,
  authSourceSelectionSmokeFile,
  adapterBoundarySmokeFile,
  localDevAdapterPlanSmokeFile,
  planSmokeFile,
  designSmokeFile,
  planningSmokeFile,
  checklistSmokeFile,
  responseShapeSmokeFile,
  surfaceSmokeFile,
]);

const requiredSections = [
  "Status and scope",
  "Route summary",
  "Local authorization and fail-closed behavior",
  "Request shape",
  "Response shape",
  "Static source and provenance",
  "Response minimization",
  "Forbidden fields",
  "Evidence pointer semantics",
  "Project Constellation read model",
  "Prompt-injection handling",
  "Privacy handling",
  "Error behavior",
  "Authority matrix note",
  "Tests and smokes",
  "Browser/computer-use status",
  "Proof-only closeout status",
  "Non-goals",
];

const requiredRouteDocPhrases = [
  "route-only local validation slice",
  "GET /api/augnes/read/constellation-preview",
  "explicitly local-authorized",
  "scoped to `project:augnes`",
  "static public-safe fixture backed",
  "no consumer surface connected",
  "no public unauthenticated endpoint",
  "no DB query",
  "no persistence",
  "no graph DB",
  "no UI",
  "no MCP/App tool",
  "no proof/evidence/readiness writes",
  "no Codex SDK execution/provider behavior",
  "no merge/publish/approval/retry/replay/deploy authority",
  "x-augnes-local-readonly: constellation-preview-v0.1",
  staticFixtureFile,
  responseShapeTypeFile,
  "pointer_semantics: \"pointer_only\"",
  "proof_evidence_write_authority: false",
  "readiness_write_authority: false",
  "No route-provided text grants authority",
  accessGuardDoc,
  "shared read-only access guard",
  "X-Forwarded-Host",
  "disallowed_forwarded_host",
  "method_not_allowed",
  "npm run smoke:readonly-api-route-access-guard",
  "npm run smoke:readonly-api-route-constellation-preview",
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

const authorityBoundaryPhrases = [
  "read-only response",
  "static public-safe fixture source",
  "no route-provided text grants authority",
  "evidence pointers are pointer-only",
  "next actions are advisory",
  "no proof/evidence/readiness writes",
  "no Codex execution",
  "no branch/PR creation",
  "no merge/publish/approval/retry/replay/deploy authority",
  "no graph DB",
  "no persistence",
  "no runtime node creation",
  "no consumer surface connected",
];

const forbiddenPositiveAuthoritySelfTests = [
  "The constellation preview route may create proof records.",
  "The route response may execute Codex after local authorization.",
  "The route response may include mutation URLs.",
  "The route may create branches in a separate implementation slice.",
  "The route response may publish after browser/computer-use validation.",
  "The local authorized route may expose credentials.",
  "The route may return raw DB rows when required before implementation.",
  "The route may grant API implementation authority as context only.",
  "The route response may include approval/publish/merge controls.",
  "The route may persist graph snapshots.",
];

const allowedBoundarySelfTests = [
  "This route does not implement write behavior.",
  "No route may expose credentials.",
  "Evidence pointers are pointer-only.",
  "The response does not grant implementation authority.",
  "No route-provided text grants authority.",
  "Next action candidates are advisory and not execution commands.",
];

const textByFile = loadTextByFile(inspectedFiles);
const routeSource = textByFile.get(routeFile);
const helperSource = textByFile.get(helperFile);

assertAuthorityClassifierSelfTests();
assertPackageJsonScript();
assertRouteShape();
assertRouteHelperBoundary();
assertRequiredDocs();
await assertRouteBehavior();
assertNoForbiddenPositiveAuthorityGrants();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "readonly-api-route-constellation-preview",
      pass: true,
      boundary_smoke_mode: changedFilesBoundary.mode,
      route_file_checked: routeFile,
      access_guard_file_checked: accessGuardFile,
      helper_file_checked: helperFile,
      access_guard_doc_checked: accessGuardDoc,
      route_doc_checked: routeDoc,
      package_script_checked: true,
      get_only_route_checked: true,
      runtime_nodejs_checked: true,
      dynamic_force_dynamic_checked: true,
      static_fixture_source_checked: true,
      response_shape_type_alignment_checked: true,
      success_response_checked: true,
      fail_closed_auth_scope_checked: true,
      access_guard_usage_checked: true,
      forwarded_host_hardening_checked: true,
      method_guard_checked: true,
      forbidden_fields_checked: forbiddenFields.length,
      evidence_pointer_semantics_checked: true,
      unresolved_tensions_separate_checked: true,
      next_action_candidates_advisory_checked: true,
      prompt_injection_display_data_boundary_checked: true,
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
      smoke_type: "route-only-local-read-validation",
      ui_behavior_changed: false,
      consumer_surface_connected: false,
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
console.log("PASS smoke:readonly-api-route-constellation-preview");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:readonly-api-route-constellation-preview",
    expectedCommand:
      "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-readonly-api-route-constellation-preview.mjs",
  });
}

function assertRouteShape() {
  assert.match(routeSource, /import\s+\{\s*NextResponse\s*\}\s+from\s+"next\/server"/);
  assert.match(routeSource, /export const runtime = "nodejs"/);
  assert.match(routeSource, /export const dynamic = "force-dynamic"/);
  assert.match(routeSource, /export function GET\(request: Request\)/);
  assert.doesNotMatch(routeSource, /export (async )?function (POST|PUT|PATCH|DELETE)\b/);
}

function assertRouteHelperBoundary() {
  for (const [file, source] of [
    [routeFile, routeSource],
    [accessGuardFile, textByFile.get(accessGuardFile)],
    [helperFile, helperSource],
  ]) {
    assertNoRuntimeImports({
      file,
      text: source,
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
    assert.doesNotMatch(source, /\bfetch\s*\(/, `${file} must not call fetch`);
    assert.doesNotMatch(source, /\bXMLHttpRequest\b/, `${file} must not use XMLHttpRequest`);
    assert.doesNotMatch(source, /\bnavigator\.clipboard\b/, `${file} must not use clipboard APIs`);
    assert.doesNotMatch(source, /\bapi\.github\.com\b/, `${file} must not call GitHub APIs`);
    assert.doesNotMatch(source, /\bapi\.openai\.com\b/, `${file} must not call OpenAI APIs`);
    assert.doesNotMatch(source, /\breadFile(Sync)?\b/, `${file} must not read arbitrary files`);
  }

  assertContainsAll(helperFile, [
    "@/lib/readonly-api/access-guard",
    "validateReadonlyApiLocalAccess",
    "CONSTELLATION_PREVIEW_ACCESS_POLICY",
    staticFixtureFile,
    "@/types/readonly-api-route-response",
    "ReadonlyApiRouteResponseEnvelopeV0",
    "CONSTELLATION_PREVIEW_SCOPE = \"project:augnes\"",
    "CONSTELLATION_PREVIEW_LOCAL_READ_HEADER",
    "CONSTELLATION_PREVIEW_LOCAL_READ_MARKER",
    "pointer_semantics: \"pointer_only\"",
    "proof_evidence_write_authority: false",
    "readiness_write_authority: false",
  ], { textByFile });
  assertContainsAll(accessGuardFile, [
    "export const READONLY_LOCAL_HOSTS",
    "export function validateReadonlyApiLocalAccess",
    "x-forwarded-host",
    "method_not_allowed",
    "disallowed_forwarded_host",
  ], { textByFile });
  assertContainsAll(routeFile, [
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
      headingPattern.test(textByFile.get(routeDoc)),
      `${routeDoc} must contain section: ${section}`,
    );
  }

  assertContainsAll(routeDoc, [
    ...requiredRouteDocPhrases,
    ...forbiddenFields,
    planDoc,
    designDoc,
    checklistDoc,
    planningDoc,
    authorityMatrixDoc,
    accessGuardDoc,
  ], { textByFile });

  assertContainsAll(planDoc, [routeDoc, "first route-only local validation slice", "no consumer"], { textByFile });
  assertContainsAll(designDoc, [routeDoc, "first route-only local implementation slice", "still follows this design packet boundary"], { textByFile });
  assertContainsAll(checklistDoc, [routeDoc, "smoke:readonly-api-route-constellation-preview", "Future consumer PRs"], { textByFile });
  assertContainsAll(planningDoc, [routeDoc, "first implemented read-only route slice", "no write behavior"], { textByFile });
  assertContainsAll(authorityMatrixDoc, [
    "GET /api/augnes/read/constellation-preview",
    "lib/readonly-api/access-guard.ts",
    "project:augnes",
    "explicitly local-authorized",
    "fail-closed",
    "static fixture backed",
    "no commit/reject authority",
    "no proof/evidence write authority",
    "no consumer authority",
  ], { textByFile });
  assertContainsAll(indexDoc, [
    routeDoc,
    accessGuardDoc,
    "route-only local validation implementation",
    "smoke:readonly-api-route-access-guard",
    "smoke:readonly-api-route-constellation-preview",
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

async function assertRouteBehavior() {
  const validResponse = await GET(
    makeRequest({
      url: "http://127.0.0.1:3000/api/augnes/read/constellation-preview?scope=project:augnes",
      marker: CONSTELLATION_PREVIEW_LOCAL_READ_MARKER,
    }),
  );
  assert.equal(validResponse.status, 200, "valid local request must return 200");
  const body = await validResponse.json();

  assert.equal(body.response_version, "readonly_api_route_response.v0.1");
  assert.equal(body.meta.project_scope, CONSTELLATION_PREVIEW_SCOPE);
  assert.equal(body.meta.workspace_scope, CONSTELLATION_PREVIEW_SCOPE);
  assert.equal(body.meta.route_family, "project_constellation");
  assert.equal(body.meta.response_shape_boundary, "type_only");
  assert.equal(body.meta.api_route_implementation, false);
  assert.equal(body.meta.auth_implementation, false);
  assert.equal(body.meta.external_calls, false);
  assert.equal(body.meta.source_of_truth, false);
  assert.ok(body.project_constellation, "response must include project_constellation");
  assert.equal(
    body.project_constellation.constellation_id,
    "project_constellation.sample.sidecar_strategy_c.v0_1",
  );
  assert.ok(Array.isArray(body.source_refs) && body.source_refs.length >= 1);
  assert.ok(Array.isArray(body.project_constellation.nodes) && body.project_constellation.nodes.length > 0);
  assert.ok(Array.isArray(body.project_constellation.edges) && body.project_constellation.edges.length > 0);
  assert.ok(Array.isArray(body.project_constellation.clusters) && body.project_constellation.clusters.length > 0);
  assert.equal(body.perspective_capsule_preview, undefined);
  assert.equal(body.copyable_handoff_preview, undefined);
  assert.equal(body.whole_perspective, undefined);
  assert.equal(body.boundary_next_review, undefined);

  assertEvidencePointersArePointerOnly(body);
  assertUnresolvedTensionsAreSeparate(body);
  assertNextActionCandidatesAreAdvisory(body);
  assertForbiddenFieldsRemoved(body);
  assertNoForbiddenHandles(body);
  assertContainsAll(JSON.stringify(body.authority_boundary), authorityBoundaryPhrases);

  const directBody = buildConstellationPreviewResponse({
    generatedAt: "2026-06-04T00:00:00.000Z",
  });
  assert.equal(directBody.response_version, "readonly_api_route_response.v0.1");
  assert.equal(directBody.meta.project_scope, CONSTELLATION_PREVIEW_SCOPE);

  await assertErrorResponse({
    label: "missing scope",
    request: makeRequest({
      url: "http://127.0.0.1:3000/api/augnes/read/constellation-preview",
      marker: CONSTELLATION_PREVIEW_LOCAL_READ_MARKER,
    }),
    status: 400,
    code: "missing_scope",
  });
  await assertErrorResponse({
    label: "wrong scope",
    request: makeRequest({
      url: "http://127.0.0.1:3000/api/augnes/read/constellation-preview?scope=project:wrong",
      marker: CONSTELLATION_PREVIEW_LOCAL_READ_MARKER,
    }),
    status: 403,
    code: "unauthorized_scope",
  });
  await assertErrorResponse({
    label: "missing local authorization header",
    request: makeRequest({
      url: "http://127.0.0.1:3000/api/augnes/read/constellation-preview?scope=project:augnes",
    }),
    status: 403,
    code: "local_authorization_required",
  });
  await assertErrorResponse({
    label: "wrong local authorization header",
    request: makeRequest({
      url: "http://127.0.0.1:3000/api/augnes/read/constellation-preview?scope=project:augnes",
      marker: "wrong-marker",
    }),
    status: 403,
    code: "local_authorization_required",
  });
  await assertErrorResponse({
    label: "non-local host",
    request: makeRequest({
      url: "http://example.com/api/augnes/read/constellation-preview?scope=project:augnes",
      marker: CONSTELLATION_PREVIEW_LOCAL_READ_MARKER,
    }),
    status: 403,
    code: "local_authorization_required",
  });
  await assertErrorResponse({
    label: "non-local Host header",
    request: makeRequest({
      url: "http://127.0.0.1:3000/api/augnes/read/constellation-preview?scope=project:augnes",
      marker: CONSTELLATION_PREVIEW_LOCAL_READ_MARKER,
      headers: { Host: "example.com" },
    }),
    status: 403,
    code: "local_authorization_required",
  });
  await assertErrorResponse({
    label: "non-local forwarded host",
    request: makeRequest({
      url: "http://127.0.0.1:3000/api/augnes/read/constellation-preview?scope=project:augnes",
      marker: CONSTELLATION_PREVIEW_LOCAL_READ_MARKER,
      headers: { "X-Forwarded-Host": "example.com" },
    }),
    status: 403,
    code: "disallowed_forwarded_host",
  });

  const methodValidation = validateConstellationPreviewRequest(
    makeRequest({
      url: "http://127.0.0.1:3000/api/augnes/read/constellation-preview?scope=project:augnes",
      marker: CONSTELLATION_PREVIEW_LOCAL_READ_MARKER,
      method: "POST",
    }),
  );
  assert.deepEqual(methodValidation, {
    ok: false,
    code: "method_not_allowed",
    status: 405,
    authority_boundary: [
      "local read-only route access guard",
      "fail-closed local validation boundary",
      "not production auth",
      "no route-provided text grants authority",
      "no consumer authority",
      "no proof/evidence/readiness writes",
    ],
  });

  const malformedValidation = validateConstellationPreviewRequest({
    url: "not a valid url",
    headers: new Headers(),
  });
  assert.deepEqual(malformedValidation, {
    ok: false,
    code: "malformed_request",
    status: 400,
    authority_boundary: [
      "local read-only route access guard",
      "fail-closed local validation boundary",
      "not production auth",
      "no route-provided text grants authority",
      "no consumer authority",
      "no proof/evidence/readiness writes",
    ],
  });
}

function makeRequest({ url, marker, method = "GET", headers = {} }) {
  const requestHeaders = new Headers(headers);
  if (marker) {
    requestHeaders.set(CONSTELLATION_PREVIEW_LOCAL_READ_HEADER, marker);
  }
  return new Request(url, { method, headers: requestHeaders });
}

async function assertErrorResponse({ label, request, status, code }) {
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

function assertEvidencePointersArePointerOnly(body) {
  const pointers = collectObjects(body, (value) => value?.pointer_semantics === "pointer_only");
  assert.ok(pointers.length > 0, "response must include evidence pointers");
  for (const pointer of pointers) {
    assert.equal(pointer.pointer_kind, "evidence_pointer");
    assert.equal(pointer.pointer_semantics, "pointer_only");
    assert.equal(pointer.proof_evidence_write_authority, false);
    assert.equal(pointer.readiness_write_authority, false);
    assert.ok(pointer.pointer_id);
    assert.ok(pointer.target_ref);
  }
}

function assertUnresolvedTensionsAreSeparate(body) {
  assert.ok(Array.isArray(body.unresolved_tensions) && body.unresolved_tensions.length > 0);
  assert.ok(Array.isArray(body.project_constellation.unresolved_tensions));
  for (const tension of body.unresolved_tensions) {
    assert.ok(tension.tension_id);
    assert.ok(tension.summary);
    assert.equal(tension.pointer_semantics, undefined);
  }
}

function assertNextActionCandidatesAreAdvisory(body) {
  const candidates = collectObjects(body, (value) => typeof value?.candidate_id === "string");
  assert.ok(candidates.length > 0, "response must include next action candidates");
  for (const candidate of candidates) {
    assert.ok(candidate.summary);
    assert.ok(Array.isArray(candidate.authority_boundary));
    assertContainsAll(JSON.stringify(candidate.authority_boundary), [
      "advisory only",
      "does not execute Codex",
      "does not create branches",
      "does not open PRs",
      "does not publish",
      "does not merge",
      "does not approve",
      "does not retry",
      "does not replay",
      "does not deploy",
      "does not record proof/evidence",
    ]);
  }
}

function assertForbiddenFieldsRemoved(body) {
  assert.deepEqual([...body.forbidden_fields_removed].sort(), [...forbiddenFields].sort());
}

function assertNoForbiddenHandles(body) {
  const forbiddenKeyPatterns = [
    /secret/i,
    /credential/i,
    /auth_env/i,
    /chain.?of.?thought/i,
    /raw.?db.?rows?/i,
    /write.?handle/i,
    /mutation.?url/i,
    /approval.*control/i,
    /publish.*control/i,
    /merge.*control/i,
    /codex.*sdk.*handle/i,
    /provider.?credential/i,
    /branch.*handle/i,
    /pr.*handle/i,
  ];

  for (const path of collectObjectKeyPaths(body)) {
    if (path === "forbidden_fields_removed") continue;
    assert(
      !forbiddenKeyPatterns.some((pattern) => pattern.test(path)),
      `response must not include forbidden handle key path: ${path}`,
    );
  }
}

function assertNoForbiddenPositiveAuthorityGrants() {
  const scopedTexts = [
    { file: routeDoc, text: textByFile.get(routeDoc) },
    {
      file: planDoc,
      text: extractSourceBetween(
        textByFile.get(planDoc),
        "`docs/READONLY_API_ROUTE_CONSTELLATION_PREVIEW_V0_1.md`",
        "## 2. Purpose",
      ),
    },
    {
      file: designDoc,
      text: extractSourceBetween(
        textByFile.get(designDoc),
        "`docs/READONLY_API_ROUTE_CONSTELLATION_PREVIEW_V0_1.md`",
        "## 3. Candidate route",
      ),
    },
    {
      file: checklistDoc,
      text: extractSourceBetween(
        textByFile.get(checklistDoc),
        "`docs/READONLY_API_ROUTE_CONSTELLATION_PREVIEW_V0_1.md`",
        "## Validation and smoke plan",
      ),
    },
    {
      file: planningDoc,
      text: extractSourceBetween(
        textByFile.get(planningDoc),
        "`docs/READONLY_API_ROUTE_CONSTELLATION_PREVIEW_V0_1.md`",
        "## Validation and smoke plan",
      ),
    },
    {
      file: authorityMatrixDoc,
      text: extractSourceBetween(
        textByFile.get(authorityMatrixDoc),
        "`GET /api/augnes/read/constellation-preview`",
        "| Lane id |",
      ),
    },
    {
      file: indexDoc,
      text: extractSourceBetween(
        textByFile.get(indexDoc),
        "- `docs/READONLY_API_ROUTE_CONSTELLATION_PREVIEW_V0_1.md`",
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
    label: "read-only constellation preview route smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for read-only constellation preview route smoke: ${file}`,
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
  const exactAllowedRouteFiles = new Set([routeFile, helperFile]);
  const exactAllowedLibFiles = new Set([accessGuardFile]);
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
      `Forbidden changed file for read-only constellation preview route smoke: ${file}`,
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
    /\b(constellation preview route|local authorized route|route response|route|response|endpoint)\b.{0,140}\b(can|may|is allowed to|is permitted to|has authority to|is authorized to|authorizes?|grants?)\b.{0,180}\b(create proof records?|create evidence|create readiness|execute Codex|launch Codex|include mutation URLs?|include approval\/publish\/merge controls?|expose credentials|return raw DB rows?|create branches?|open PRs?|create PRs?|publish|merge|approve|retry|replay|deploy|persist graph snapshots?|persist graphs?|grant API implementation authority)\b/i,
    /\b(adds?|implements?|enables?|activates?|creates?|records?|writes?|calls?|runs?|executes?|publishes?|approves?|retries|replays|merges?|deploys?|persists?)\b.{0,180}\b(UI code|consumer surface|Cockpit integration|ChatGPT App component|MCP\/App tools?|MCP tools?|DB queries?|DB schema|migrations?|graph DB|persistence|external calls?|OpenAI calls?|GitHub calls?|proof\/evidence writes?|proof writes?|evidence writes?|readiness writes?|proof records?|evidence records?|readiness records?|AG Resume behavior|branch creation authority|PR creation authority|merge authority|publish authority|approval authority|Codex SDK execution|provider implementation|credentials|secrets|provider credentials|mutation URLs?|Project Constellation runtime behavior|graph snapshots?)\b/i,
    /\b(exposes?|includes?|returns?)\b.{0,180}\b(credentials|secrets|provider credentials|mutation URLs?|hidden reasoning|chain-of-thought|raw DB rows?|proof\/evidence write handles?|approval\/publish\/merge controls?|Codex SDK execution handles?|branch\/PR creation handles?)\b/i,
    /\b(grants?|adds?|creates?|provides?|authori[sz]es?)\b.{0,140}\b(branch creation authority|PR creation authority|merge authority|publish authority|approval authority|proof\/evidence write authority|Codex SDK execution authority|deploy authority|API implementation authority|implementation authority|route implementation authority|consumer authority)\b/i,
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

function collectObjects(value, predicate) {
  const matches = [];

  visitJson(value, (entry) => {
    if (entry && typeof entry === "object" && !Array.isArray(entry) && predicate(entry)) {
      matches.push(entry);
    }
  });

  return matches;
}

function collectObjectKeyPaths(value) {
  const paths = [];

  function walk(entry, prefix) {
    if (!entry || typeof entry !== "object") return;
    if (Array.isArray(entry)) {
      entry.forEach((item, index) => walk(item, `${prefix}[${index}]`));
      return;
    }

    for (const [key, child] of Object.entries(entry)) {
      const path = prefix ? `${prefix}.${key}` : key;
      paths.push(path);
      walk(child, path);
    }
  }

  walk(value, "");
  return paths;
}

function visitJson(value, visitor) {
  visitor(value);
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) {
      visitJson(item, visitor);
    }
    return;
  }
  for (const child of Object.values(value)) {
    visitJson(child, visitor);
  }
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
