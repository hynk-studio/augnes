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
import localDevAdapterModule from "../lib/readonly-api/local-dev-auth-adapter.ts";

const { GET } = routeModule;
const { validateReadonlyApiLocalAccess } = accessGuardModule;
const {
  CONSTELLATION_PREVIEW_ACCESS_POLICY,
  CONSTELLATION_PREVIEW_LOCAL_READ_HEADER,
  CONSTELLATION_PREVIEW_LOCAL_READ_MARKER,
  CONSTELLATION_PREVIEW_ROUTE_FAMILY,
  CONSTELLATION_PREVIEW_ROUTE_ID,
  CONSTELLATION_PREVIEW_SCOPE,
  validateConstellationPreviewRequest,
} = helperModule;
const {
  LOCAL_DEV_AUTH_ADAPTER_SOURCE_KIND,
  LOCAL_DEV_AUTH_OPERATOR_LABEL_HEADER,
  LOCAL_DEV_AUTH_OPERATOR_REF_HEADER,
  LOCAL_DEV_AUTH_OPERATOR_REF_VALUE,
  LOCAL_DEV_AUTH_PROJECT_SCOPE_HEADER,
  LOCAL_DEV_AUTH_PROJECT_SCOPE_VALUE,
  LOCAL_DEV_AUTH_WORKSPACE_REF_HEADER,
  LOCAL_DEV_AUTH_WORKSPACE_REF_VALUE,
  buildLocalDevAuthScopeRequest,
  validateReadonlyApiLocalDevAuthAdapter,
} = localDevAdapterModule;

const adapterFile = "lib/readonly-api/local-dev-auth-adapter.ts";
const helperFile = "lib/readonly-api/constellation-preview.ts";
const accessGuardFile = "lib/readonly-api/access-guard.ts";
const routeFile = "app/api/augnes/read/constellation-preview/route.ts";
const typeFile = "types/readonly-api-auth-scope.ts";
const adapterDoc = "docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_V0_1.md";
const cockpitPlanDoc =
  "docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_PLAN_V0_1.md";
const adapterPlanDoc =
  "docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_PLAN_V0_1.md";
const realAuthGatePlanDoc =
  "docs/READONLY_API_ROUTE_REAL_AUTH_GATE_PLAN_V0_1.md";
const adapterBoundaryDoc =
  "docs/READONLY_API_ROUTE_AUTH_SCOPE_ADAPTER_BOUNDARY_V0_1.md";
const authSourceSelectionDoc =
  "docs/READONLY_API_ROUTE_AUTH_SOURCE_SELECTION_V0_1.md";
const authScopePlanDoc =
  "docs/READONLY_API_ROUTE_AUTH_SCOPE_INTEGRATION_PLAN_V0_1.md";
const accessGuardDoc = "docs/READONLY_API_ROUTE_ACCESS_GUARD_V0_1.md";
const routeDoc = "docs/READONLY_API_ROUTE_CONSTELLATION_PREVIEW_V0_1.md";
const reviewChecklistDoc =
  "docs/READONLY_API_ROUTE_REVIEW_CHECKLIST_V0_1.md";
const surfaceBoundaryDoc =
  "docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md";
const consumerScopeDecisionDoc =
  "docs/READONLY_API_ROUTE_LOCAL_ONLY_CONSUMER_SCOPE_DECISION_V0_1.md";
const authorityMatrixDoc = "docs/AUTHORITY_MATRIX.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile =
  "scripts/smoke-readonly-api-route-local-dev-auth-adapter.mjs";
const cockpitPlanSmokeFile =
  "scripts/smoke-cockpit-local-only-constellation-route-preview-plan.mjs";
const adapterPlanSmokeFile =
  "scripts/smoke-readonly-api-route-local-dev-auth-adapter-plan.mjs";
const routeSmokeFile =
  "scripts/smoke-readonly-api-route-constellation-preview.mjs";
const adapterBoundarySmokeFile =
  "scripts/smoke-readonly-api-route-auth-scope-adapter-boundary.mjs";
const authSourceSelectionSmokeFile =
  "scripts/smoke-readonly-api-route-auth-source-selection.mjs";
const authScopePlanSmokeFile =
  "scripts/smoke-readonly-api-route-auth-scope-integration-plan.mjs";
const accessGuardSmokeFile =
  "scripts/smoke-readonly-api-route-access-guard.mjs";
const reviewChecklistSmokeFile =
  "scripts/smoke-readonly-api-route-review-checklist.mjs";
const surfaceSmokeFile =
  "scripts/smoke-chatgpt-app-mcp-readonly-surface-boundary.mjs";
const realAuthGatePlanSmokeFile =
  "scripts/smoke-readonly-api-route-real-auth-gate-plan.mjs";
const consumerScopeDecisionSmokeFile =
  "scripts/smoke-readonly-api-route-local-only-consumer-scope-decision.mjs";

const inspectedFiles = [
  adapterFile,
  helperFile,
  accessGuardFile,
  routeFile,
  typeFile,
  adapterDoc,
  cockpitPlanDoc,
  adapterPlanDoc,
  realAuthGatePlanDoc,
  adapterBoundaryDoc,
  authSourceSelectionDoc,
  authScopePlanDoc,
  accessGuardDoc,
  routeDoc,
  reviewChecklistDoc,
  surfaceBoundaryDoc,
  consumerScopeDecisionDoc,
  authorityMatrixDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
  adapterPlanSmokeFile,
  routeSmokeFile,
];

const allowedChangedFiles = new Set([
  adapterFile,
  helperFile,
  routeFile,
  adapterDoc,
  cockpitPlanDoc,
  adapterPlanDoc,
  realAuthGatePlanDoc,
  adapterBoundaryDoc,
  authSourceSelectionDoc,
  authScopePlanDoc,
  accessGuardDoc,
  routeDoc,
  reviewChecklistDoc,
  surfaceBoundaryDoc,
  consumerScopeDecisionDoc,
  authorityMatrixDoc,
  indexDoc,
  smokeFile,
  cockpitPlanSmokeFile,
  adapterPlanSmokeFile,
  routeSmokeFile,
  packageJsonFile,
  adapterBoundarySmokeFile,
  authSourceSelectionSmokeFile,
  authScopePlanSmokeFile,
  accessGuardSmokeFile,
  reviewChecklistSmokeFile,
  surfaceSmokeFile,
  realAuthGatePlanSmokeFile,
  consumerScopeDecisionSmokeFile,
]);

const requiredSections = [
  "Status and scope",
  "Route and adapter summary",
  "Local-only declaration headers",
  "Relationship to existing local guard",
  "Relationship to type-only auth/scope adapter boundary",
  "Success decision mapping",
  "Failure decision mapping",
  "Route behavior compatibility",
  "Response minimization",
  "Forbidden fields",
  "Privacy and prompt-injection handling",
  "Logging and telemetry handling",
  "Authority matrix note",
  "Tests and smokes",
  "Browser/computer-use status",
  "Local route manual check status",
  "Proof-only closeout status",
  "Non-goals",
];

const requiredAdapterExports = [
  "LOCAL_DEV_AUTH_ADAPTER_SOURCE_KIND",
  "LOCAL_DEV_AUTH_OPERATOR_REF_HEADER",
  "LOCAL_DEV_AUTH_OPERATOR_REF_VALUE",
  "LOCAL_DEV_AUTH_WORKSPACE_REF_HEADER",
  "LOCAL_DEV_AUTH_WORKSPACE_REF_VALUE",
  "LOCAL_DEV_AUTH_PROJECT_SCOPE_HEADER",
  "LOCAL_DEV_AUTH_PROJECT_SCOPE_VALUE",
  "LOCAL_DEV_AUTH_OPERATOR_LABEL_HEADER",
  "validateReadonlyApiLocalDevAuthAdapter",
  "buildLocalDevAuthScopeRequest",
  "ReadonlyApiLocalDevAuthAdapterResult",
];

const forbiddenFields = [
  "secrets",
  "credentials/auth/env",
  "raw DB rows",
  "raw private user text",
  "hidden reasoning / chain-of-thought",
  "proof/evidence write handles",
  "mutation URLs",
  "approval/publish/merge controls",
  "Codex SDK execution handles",
  "provider credentials",
  "session secrets",
  "OAuth tokens",
  "workspace private membership graph",
];

const forbiddenPositiveAuthoritySelfTests = [
  "The local dev auth adapter may implement production auth.",
  "Candidate D may prove hosted caller identity.",
  "The local adapter may create OAuth sessions.",
  "The route may expose credentials after local adapter validation.",
  "The route may query the database after local adapter validation.",
  "The local adapter may grant consumer authority as context only.",
  "The route may execute Codex after local operator declaration.",
  "The local adapter may create proof records.",
  "The local adapter may merge after separate review.",
  "The local adapter may persist graph snapshots.",
];

const allowedBoundarySelfTests = [
  "This local dev adapter does not implement production auth.",
  "Candidate D is local-only and not hosted auth.",
  "The local guard is not production auth.",
  "Future real auth integration requires separate implementation.",
  "No route may expose credentials.",
  "Evidence pointers are pointer-only.",
  "No route-provided text grants authority.",
  "The local dev adapter does not grant consumer authority.",
];

const textByFile = loadTextByFile(inspectedFiles);
const adapterSource = textByFile.get(adapterFile);
const helperSource = textByFile.get(helperFile);
const routeSource = textByFile.get(routeFile);
const smokeSource = textByFile.get(smokeFile);

assertAuthorityClassifierSelfTests();
assertPackageJsonScript();
assertAdapterSourceBoundary();
assertRouteComposition();
assertRequiredDocs();
assertAdapterDecisions();
await assertRouteBehavior();
assertNoForbiddenPositiveAuthorityGrants();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "readonly-api-route-local-dev-auth-adapter",
      pass: true,
      boundary_smoke_mode: changedFilesBoundary.mode,
      adapter_file_checked: adapterFile,
      helper_file_checked: helperFile,
      route_file_checked: routeFile,
      implementation_doc_checked: adapterDoc,
      package_script_checked: true,
      exports_checked: requiredAdapterExports.length,
      type_boundary_import_checked: true,
      local_guard_composition_checked: true,
      local_only_declaration_headers_checked: true,
      valid_route_request_checked: true,
      marker_only_fail_closed_checked: true,
      forbidden_fields_checked: forbiddenFields.length,
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
      smoke_type: "route-only-local-dev-auth-adapter-validation",
      production_auth_added: false,
      hosted_session_oauth_multi_user_auth_added: false,
      session_identity_implemented: false,
      workspace_membership_implemented: false,
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
console.log("PASS smoke:readonly-api-route-local-dev-auth-adapter");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:readonly-api-route-local-dev-auth-adapter",
    expectedCommand:
      "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-readonly-api-route-local-dev-auth-adapter.mjs",
  });
}

function assertAdapterSourceBoundary() {
  assertContainsAll(adapterFile, [
    ...requiredAdapterExports,
    "import type",
    "@/types/readonly-api-auth-scope",
    "ReadonlyApiAuthScopeDecisionV0",
    "local_development_auth_adapter_candidate",
    "operator:local-dev",
    "workspace:local-dev",
    "project:augnes",
    "local_development_declaration_only",
    "local_project_scope_declaration_only",
    "local_guard_failed",
    ...forbiddenFields,
  ], { textByFile });
  assert.match(
    adapterSource,
    /import type \{[\s\S]+ReadonlyApiAuthScopeDecisionV0[\s\S]+from "@\/types\/readonly-api-auth-scope"/,
    "adapter must import auth/scope type boundary as type-only",
  );
  assert.doesNotMatch(
    adapterSource,
    /import(?! type)[\s\S]+@\/types\/readonly-api-auth-scope/,
    "adapter must not runtime-import auth/scope types",
  );
  for (const [file, source] of [
    [adapterFile, adapterSource],
    [helperFile, helperSource],
    [routeFile, routeSource],
  ]) {
    assertNoRuntimeImports({
      file,
      text: source,
      forbiddenImports: [
        "../app/",
        "../app/api/",
        "@/app/",
        "@/app/api/",
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
  }
}

function assertRouteComposition() {
  assertContainsAll(helperFile, [
    "@/lib/readonly-api/access-guard",
    "@/lib/readonly-api/local-dev-auth-adapter",
    "validateReadonlyApiLocalAccess",
    "validateReadonlyApiLocalDevAuthAdapter",
    "localGuardResult: result",
    "localDevAuthResult.authority_boundary.notes",
  ], { textByFile });
  assert.match(routeSource, /export function GET\(request: Request\)/);
  assert.doesNotMatch(routeSource, /export (async )?function (POST|PUT|PATCH|DELETE)\b/);
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
      headingPattern.test(textByFile.get(adapterDoc)),
      `${adapterDoc} must contain section: ${section}`,
    );
  }

  assertContainsAll(adapterDoc, [
    "Candidate D local-only adapter implementation",
    "not production auth",
    "not hosted auth",
    "not OAuth",
    "not session identity",
    "not workspace membership",
    "no secrets/env handling",
    "no DB query",
    "no consumer surface",
    "no UI",
    "no MCP/App tool",
    "no proof/evidence/readiness writes",
    "no public unauthenticated endpoint",
    "route still requires",
    "x-augnes-local-readonly: constellation-preview-v0.1",
    "x-augnes-local-operator-ref: operator:local-dev",
    "x-augnes-local-workspace-ref: workspace:local-dev",
    "x-augnes-local-project-scope: project:augnes",
    "cannot prove hosted identity",
    "cannot prove hosted workspace/project membership",
    "No route-provided text grants authority",
    "local operator labels",
    "npm run smoke:readonly-api-route-local-dev-auth-adapter",
  ], { textByFile });
  assertContainsAll(adapterPlanDoc, [adapterDoc, "Candidate D local-only semantics were accepted"], { textByFile });
  assertContainsAll(adapterBoundaryDoc, [adapterDoc, "maps Candidate D to this type boundary locally only"], { textByFile });
  assertContainsAll(authSourceSelectionDoc, [adapterDoc, "not real hosted auth"], { textByFile });
  assertContainsAll(authScopePlanDoc, [adapterDoc, "Future real auth remains separate"], { textByFile });
  assertContainsAll(accessGuardDoc, [adapterDoc, "composes with this local guard", "does not replace it"], { textByFile });
  assertContainsAll(routeDoc, [
    adapterDoc,
    "x-augnes-local-operator-ref: operator:local-dev",
    "x-augnes-local-workspace-ref: workspace:local-dev",
    "x-augnes-local-project-scope: project:augnes",
    "old marker-only request is no longer sufficient",
    "no consumer surface",
  ], { textByFile });
  assertContainsAll(reviewChecklistDoc, [adapterDoc, "smoke:readonly-api-route-local-dev-auth-adapter", "local-only"], { textByFile });
  assertContainsAll(authorityMatrixDoc, [
    adapterFile,
    adapterDoc,
    "local-only route validation adapter",
    "grants no production auth",
    "grants no production auth, hosted auth, OAuth, session identity, workspace membership",
  ], { textByFile });
  assertContainsAll(indexDoc, [
    adapterDoc,
    adapterFile,
    "smoke:readonly-api-route-local-dev-auth-adapter",
    "local-only route validation implementation",
    "no production auth",
    "no hosted auth",
    "no route consumer",
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

function assertAdapterDecisions() {
  const validRequest = makeRequest();
  const localGuardResult = validateReadonlyApiLocalAccess(
    validRequest,
    CONSTELLATION_PREVIEW_ACCESS_POLICY,
  );
  assert.equal(localGuardResult.ok, true);

  const scopeRequest = buildLocalDevAuthScopeRequest({
    request: validRequest,
    localGuardResult,
  });
  assert.equal(scopeRequest.route_id, CONSTELLATION_PREVIEW_ROUTE_ID);
  assert.equal(scopeRequest.route_family, CONSTELLATION_PREVIEW_ROUTE_FAMILY);
  assert.equal(scopeRequest.requested_scope, CONSTELLATION_PREVIEW_SCOPE);
  assert.equal(scopeRequest.source_kind, LOCAL_DEV_AUTH_ADAPTER_SOURCE_KIND);
  assert.equal(scopeRequest.local_guard_result_ref, "local_guard:passed");

  const decision = validateReadonlyApiLocalDevAuthAdapter({
    request: validRequest,
    localGuardResult,
  });
  assert.equal(decision.ok, true);
  assert.equal(decision.route_id, CONSTELLATION_PREVIEW_ROUTE_ID);
  assert.equal(decision.route_family, CONSTELLATION_PREVIEW_ROUTE_FAMILY);
  assert.equal(decision.authorized_scope, CONSTELLATION_PREVIEW_SCOPE);
  assert.equal(decision.source_kind, LOCAL_DEV_AUTH_ADAPTER_SOURCE_KIND);
  assert.equal(decision.local_guard_composed, true);
  assert.equal(decision.identity_ref.identity_ref, LOCAL_DEV_AUTH_OPERATOR_REF_VALUE);
  assert.equal(decision.identity_ref.identity_source_kind, LOCAL_DEV_AUTH_ADAPTER_SOURCE_KIND);
  assert.equal(decision.identity_ref.identity_proof_label, "local_development_declaration_only");
  assert.equal(decision.identity_ref.raw_identity_payload_returned, false);
  assert.equal(decision.workspace_ref.workspace_ref, LOCAL_DEV_AUTH_WORKSPACE_REF_VALUE);
  assert.equal(decision.workspace_ref.workspace_source_kind, LOCAL_DEV_AUTH_ADAPTER_SOURCE_KIND);
  assert.equal(decision.workspace_ref.membership_proof_label, "local_project_scope_declaration_only");
  assert.equal(decision.workspace_ref.raw_membership_graph_returned, false);
  assert.equal(decision.project_ref.project_ref, LOCAL_DEV_AUTH_PROJECT_SCOPE_VALUE);
  assert.equal(decision.project_ref.project_scope, LOCAL_DEV_AUTH_PROJECT_SCOPE_VALUE);
  assert.equal(decision.project_ref.project_source_kind, LOCAL_DEV_AUTH_ADAPTER_SOURCE_KIND);
  assert.equal(decision.project_ref.membership_proof_label, "local_project_scope_declaration_only");
  assert.equal(decision.project_ref.raw_project_payload_returned, false);
  for (const field of forbiddenFields) {
    assert(decision.forbidden_fields_removed.includes(field));
  }
  assert.equal(decision.authority_boundary.production_auth, false);
  assert.equal(decision.authority_boundary.hosted_auth, false);
  assert.equal(decision.authority_boundary.oauth, false);
  assert.equal(decision.authority_boundary.session_identity_implementation, false);
  assert.equal(decision.authority_boundary.workspace_membership_implementation, false);
  assert.equal(decision.authority_boundary.consumer_authority, false);

  assertAdapterFailure({
    label: "missing local operator",
    request: makeRequest({ operatorRef: null }),
    code: "missing_identity",
    status: 403,
  });
  assertAdapterFailure({
    label: "invalid local operator",
    request: makeRequest({ operatorRef: "operator:wrong" }),
    code: "invalid_identity",
    status: 403,
  });
  assertAdapterFailure({
    label: "missing workspace",
    request: makeRequest({ workspaceRef: null }),
    code: "missing_workspace",
    status: 403,
  });
  assertAdapterFailure({
    label: "invalid workspace",
    request: makeRequest({ workspaceRef: "workspace:wrong" }),
    code: "unauthorized_workspace",
    status: 403,
  });
  assertAdapterFailure({
    label: "missing project scope",
    request: makeRequest({ projectScope: null }),
    code: "missing_project",
    status: 403,
  });
  assertAdapterFailure({
    label: "wrong project scope",
    request: makeRequest({ projectScope: "project:wrong" }),
    code: "unauthorized_project",
    status: 403,
  });

  const localGuardFailure = validateReadonlyApiLocalDevAuthAdapter({
    request: makeRequest(),
    localGuardResult: {
      ok: false,
      code: "method_not_allowed",
      status: 405,
      authority_boundary: [],
    },
  });
  assert.equal(localGuardFailure.ok, false);
  assert.equal(localGuardFailure.code, "local_guard_failed");
  assert.equal(localGuardFailure.status, 405);
  assert.equal(localGuardFailure.safe_error_label, "local_guard_failed");
}

async function assertRouteBehavior() {
  const validResponse = await GET(makeRequest({ operatorLabel: " Local Dev <script> " }));
  assert.equal(validResponse.status, 200);
  const body = await validResponse.json();
  assert.equal(body.response_version, "readonly_api_route_response.v0.1");
  assert.equal(body.meta.project_scope, CONSTELLATION_PREVIEW_SCOPE);
  assert.ok(body.project_constellation);
  assert.equal(
    body.project_constellation.constellation_id,
    "project_constellation.sample.sidecar_strategy_c.v0_1",
  );
  assert.equal(body.perspective_capsule_preview, undefined);
  assert.equal(body.copyable_handoff_preview, undefined);
  assert.equal(body.identity_ref, undefined);
  assert.equal(body.workspace_ref, undefined);
  assert.equal(body.project_ref, undefined);
  assert.equal(body.auth_decision, undefined);
  assert.equal(JSON.stringify(body).includes(LOCAL_DEV_AUTH_OPERATOR_REF_VALUE), false);
  assert.equal(JSON.stringify(body).includes(LOCAL_DEV_AUTH_WORKSPACE_REF_VALUE), false);
  assert.equal(JSON.stringify(body).includes(LOCAL_DEV_AUTH_OPERATOR_LABEL_HEADER), false);
  assert.equal(JSON.stringify(body).includes("OAuth tokens"), false);
  assert.equal(JSON.stringify(body).includes("session secrets"), false);
  assert.equal(JSON.stringify(body).includes("workspace private membership graph"), false);
  assertNoForbiddenHandles(body);

  await assertErrorResponse({
    label: "marker-only request",
    request: makeRequest({
      operatorRef: null,
      workspaceRef: null,
      projectScope: null,
    }),
    status: 403,
    code: "missing_identity",
  });
  await assertErrorResponse({
    label: "invalid local operator",
    request: makeRequest({ operatorRef: "operator:wrong" }),
    status: 403,
    code: "invalid_identity",
  });
  await assertErrorResponse({
    label: "missing workspace",
    request: makeRequest({ workspaceRef: null }),
    status: 403,
    code: "missing_workspace",
  });
  await assertErrorResponse({
    label: "invalid workspace",
    request: makeRequest({ workspaceRef: "workspace:wrong" }),
    status: 403,
    code: "unauthorized_workspace",
  });
  await assertErrorResponse({
    label: "missing project declaration",
    request: makeRequest({ projectScope: null }),
    status: 403,
    code: "missing_project",
  });
  await assertErrorResponse({
    label: "wrong project declaration",
    request: makeRequest({ projectScope: "project:wrong" }),
    status: 403,
    code: "unauthorized_project",
  });
  await assertErrorResponse({
    label: "missing marker header",
    request: makeRequest({ marker: null }),
    status: 403,
    code: "local_authorization_required",
  });
  await assertErrorResponse({
    label: "non-local forwarded host",
    request: makeRequest({ headers: { "X-Forwarded-Host": "example.com" } }),
    status: 403,
    code: "disallowed_forwarded_host",
  });

  const methodValidation = validateConstellationPreviewRequest(
    makeRequest({ method: "POST" }),
  );
  assert.equal(methodValidation.ok, false);
  assert.equal(methodValidation.code, "method_not_allowed");
  assert.equal(methodValidation.status, 405);

  const malformedValidation = validateConstellationPreviewRequest({
    url: "not a valid url",
    method: "GET",
    headers: new Headers(),
  });
  assert.equal(malformedValidation.ok, false);
  assert.equal(malformedValidation.code, "malformed_request");
  assert.equal(malformedValidation.status, 400);
}

function assertAdapterFailure({ label, request, code, status }) {
  const localGuardResult = validateReadonlyApiLocalAccess(
    request,
    CONSTELLATION_PREVIEW_ACCESS_POLICY,
  );
  assert.equal(localGuardResult.ok, true, `${label} local guard`);
  const decision = validateReadonlyApiLocalDevAuthAdapter({
    request,
    localGuardResult,
  });
  assert.equal(decision.ok, false, label);
  assert.equal(decision.code, code, label);
  assert.equal(decision.status, status, label);
  assert.equal(decision.safe_error_label, code, label);
  assert.equal(decision.authority_boundary.production_auth, false);
  assert.equal(decision.authority_boundary.consumer_authority, false);
}

function makeRequest({
  url = "http://127.0.0.1:3000/api/augnes/read/constellation-preview?scope=project:augnes",
  marker = CONSTELLATION_PREVIEW_LOCAL_READ_MARKER,
  operatorRef = LOCAL_DEV_AUTH_OPERATOR_REF_VALUE,
  workspaceRef = LOCAL_DEV_AUTH_WORKSPACE_REF_VALUE,
  projectScope = LOCAL_DEV_AUTH_PROJECT_SCOPE_VALUE,
  operatorLabel,
  method = "GET",
  headers = {},
} = {}) {
  const requestHeaders = new Headers(headers);
  if (marker !== null) {
    requestHeaders.set(CONSTELLATION_PREVIEW_LOCAL_READ_HEADER, marker);
  }
  if (operatorRef !== null) {
    requestHeaders.set(LOCAL_DEV_AUTH_OPERATOR_REF_HEADER, operatorRef);
  }
  if (workspaceRef !== null) {
    requestHeaders.set(LOCAL_DEV_AUTH_WORKSPACE_REF_HEADER, workspaceRef);
  }
  if (projectScope !== null) {
    requestHeaders.set(LOCAL_DEV_AUTH_PROJECT_SCOPE_HEADER, projectScope);
  }
  if (operatorLabel !== undefined) {
    requestHeaders.set(LOCAL_DEV_AUTH_OPERATOR_LABEL_HEADER, operatorLabel);
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
  assert.equal(body.identity_ref, undefined);
  assert.equal(body.auth_decision, undefined);
}

function assertNoForbiddenHandles(value) {
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
    /oauth.*token/i,
    /workspace.*private.*membership.*graph/i,
  ];

  for (const path of collectObjectKeyPaths(value)) {
    if (path === "forbidden_fields_removed") continue;
    assert(
      !forbiddenKeyPatterns.some((pattern) => pattern.test(path)),
      `response must not include forbidden handle key path: ${path}`,
    );
  }
}

function assertNoForbiddenPositiveAuthorityGrants() {
  const scopedTexts = [
    { file: adapterFile, text: stripForbiddenFieldsRemovedList(adapterSource) },
    { file: adapterDoc, text: textByFile.get(adapterDoc) },
    {
      file: adapterPlanDoc,
      text: extractSourceBetween(
        textByFile.get(adapterPlanDoc),
        "`docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_V0_1.md`",
        "## 2. Purpose",
      ),
    },
    {
      file: adapterBoundaryDoc,
      text: extractSourceBetween(
        textByFile.get(adapterBoundaryDoc),
        "`docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_V0_1.md`",
        "## 4. Type boundary overview",
      ),
    },
    {
      file: authSourceSelectionDoc,
      text: extractSourceBetween(
        textByFile.get(authSourceSelectionDoc),
        "`docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_V0_1.md`",
        "## 4. Existing repo-local candidates inspected",
      ),
    },
    {
      file: authScopePlanDoc,
      text: extractSourceBetween(
        textByFile.get(authScopePlanDoc),
        "`docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_V0_1.md`",
        "## 3. Current local guard baseline",
      ),
    },
    {
      file: accessGuardDoc,
      text: extractSourceBetween(
        textByFile.get(accessGuardDoc),
        "`docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_V0_1.md`",
        "## 2. Purpose",
      ),
    },
    {
      file: routeDoc,
      text: extractSourceBetween(
        textByFile.get(routeDoc),
        "`docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_V0_1.md`",
        "## 4. Request shape",
      ),
    },
    {
      file: authorityMatrixDoc,
      text: extractSourceBetween(
        textByFile.get(authorityMatrixDoc),
        "`lib/readonly-api/local-dev-auth-adapter.ts`",
        "| Lane id |",
      ),
    },
    {
      file: indexDoc,
      text: extractSourceBetween(
        textByFile.get(indexDoc),
        "- `docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_V0_1.md`",
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
    label: "read-only route local dev auth adapter smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for read-only route local dev auth adapter smoke: ${file}`,
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
  const exactAllowedRuntimeFiles = new Set([adapterFile, helperFile, routeFile]);
  const forbiddenPatterns = [
    /^AGENTS\.md$/,
    /^app\//,
    /^lib\//,
    /^components\//,
    /^db\//,
    /^migrations\//,
    /^apps\/augnes_apps\//,
    /^types\//,
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
    if (exactAllowedRuntimeFiles.has(file)) {
      continue;
    }
    assert(
      !forbiddenPatterns.some((pattern) => pattern.test(file)),
      `Forbidden changed file for read-only route local dev auth adapter smoke: ${file}`,
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

function stripForbiddenFieldsRemovedList(text) {
  return text.replace(
    /const LOCAL_DEV_AUTH_FORBIDDEN_FIELDS_REMOVED = \[[\s\S]+?\] as const satisfies readonly ReadonlyApiAuthScopeForbiddenFieldV0\[\];/,
    "",
  );
}

function isForbiddenPositiveClause(clause) {
  const xhrPattern = "XMLHttp" + "Request";
  const forbiddenPatterns = [
    /\b(local dev auth adapter|local development auth adapter|candidate d|local adapter|route response|route|response|endpoint)\b.{0,140}\b(can|may|is allowed to|is permitted to|has authority to|is authorized to|authorizes?|grants?)\b.{0,180}\b(implement production auth|prove hosted caller identity|prove hosted workspace\/project membership|create OAuth sessions?|create hosted OAuth sessions?|expose credentials|query the database|create proof records?|create evidence|create readiness|execute Codex|launch Codex|include mutation URLs?|include approval\/publish\/merge controls?|return raw DB rows?|create branches?|open PRs?|create PRs?|publish|merge|approve|retry|replay|deploy|persist graph snapshots?|persist graphs?|grant consumer authority)\b/i,
    /\b(adds?|implements?|enables?|activates?|creates?|records?|writes?|calls?|runs?|executes?|publishes?|approves?|retries|replays|merges?|deploys?|persists?|queries?|becomes?)\b.{0,180}\b(production auth|hosted auth|OAuth|hosted OAuth|session identity|multi-user tenancy|workspace membership|UI code|consumer surface|Cockpit integration|ChatGPT App component|MCP\/App tools?|MCP tools?|DB queries?|database queries?|DB schema|migrations?|graph DB|persistence|external calls?|OpenAI calls?|GitHub calls?|proof\/evidence writes?|proof writes?|evidence writes?|readiness writes?|proof records?|evidence records?|readiness records?|AG Resume behavior|branch creation authority|PR creation authority|merge authority|publish authority|approval authority|Codex SDK execution|provider implementation|credentials|secrets|provider credentials|mutation URLs?|graph snapshots?)\b/i,
    /\b(exposes?|includes?|returns?)\b.{0,180}\b(credentials|secrets|provider credentials|mutation URLs?|hidden reasoning|chain-of-thought|raw DB rows?|raw private user text|session secrets|OAuth tokens|workspace private membership graph|proof\/evidence write handles?|approval\/publish\/merge controls?|Codex SDK execution handles?|branch\/PR creation handles?)\b/i,
    /\b(grants?|adds?|creates?|provides?|authori[sz]es?)\b.{0,140}\b(consumer authority|branch creation authority|PR creation authority|merge authority|publish authority|approval authority|proof\/evidence write authority|Codex SDK execution authority|deploy authority|auth authority|implementation authority|route implementation authority|DB query authority)\b/i,
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
