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

const typeFile = "types/readonly-api-auth-scope.ts";
const adapterBoundaryDoc =
  "docs/READONLY_API_ROUTE_AUTH_SCOPE_ADAPTER_BOUNDARY_V0_1.md";
const localDevAdapterPlanDoc =
  "docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_PLAN_V0_1.md";
const localDevAdapterDoc =
  "docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_V0_1.md";
const realAuthGatePlanDoc =
  "docs/READONLY_API_ROUTE_REAL_AUTH_GATE_PLAN_V0_1.md";
const localDevAdapterFile = "lib/readonly-api/local-dev-auth-adapter.ts";
const constellationPreviewHelperFile =
  "lib/readonly-api/constellation-preview.ts";
const sourceSelectionDoc =
  "docs/READONLY_API_ROUTE_AUTH_SOURCE_SELECTION_V0_1.md";
const authScopePlanDoc =
  "docs/READONLY_API_ROUTE_AUTH_SCOPE_INTEGRATION_PLAN_V0_1.md";
const accessGuardDoc = "docs/READONLY_API_ROUTE_ACCESS_GUARD_V0_1.md";
const routeDoc = "docs/READONLY_API_ROUTE_CONSTELLATION_PREVIEW_V0_1.md";
const reviewChecklistDoc =
  "docs/READONLY_API_ROUTE_REVIEW_CHECKLIST_V0_1.md";
const authorityMatrixDoc = "docs/AUTHORITY_MATRIX.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile =
  "scripts/smoke-readonly-api-route-auth-scope-adapter-boundary.mjs";
const localDevAdapterPlanSmokeFile =
  "scripts/smoke-readonly-api-route-local-dev-auth-adapter-plan.mjs";
const localDevAdapterSmokeFile =
  "scripts/smoke-readonly-api-route-local-dev-auth-adapter.mjs";

const sourceSelectionSmokeFile =
  "scripts/smoke-readonly-api-route-auth-source-selection.mjs";
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
const realAuthGatePlanSmokeFile =
  "scripts/smoke-readonly-api-route-real-auth-gate-plan.mjs";

const inspectedFiles = [
  typeFile,
  adapterBoundaryDoc,
  sourceSelectionDoc,
  authScopePlanDoc,
  reviewChecklistDoc,
  authorityMatrixDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
];

const allowedChangedFiles = new Set([
  ...inspectedFiles,
  accessGuardDoc,
  routeDoc,
  localDevAdapterPlanDoc,
  localDevAdapterDoc,
  realAuthGatePlanDoc,
  localDevAdapterFile,
  constellationPreviewHelperFile,
  localDevAdapterPlanSmokeFile,
  localDevAdapterSmokeFile,
  sourceSelectionSmokeFile,
  authScopePlanSmokeFile,
  accessGuardSmokeFile,
  constellationPreviewSmokeFile,
  reviewChecklistSmokeFile,
  surfaceSmokeFile,
  realAuthGatePlanSmokeFile,
  "types/perspective-agent-brief.ts",
  "lib/readonly-api/perspective-agent-brief.ts",
  "app/api/augnes/read/perspective-agent-brief/route.ts",
  "docs/PERSPECTIVE_AGENT_BRIEF_READ_SURFACE_V0_1.md",
  "reports/2026-06-07-perspective-agent-brief-read-surface.md",
  "scripts/smoke-perspective-agent-brief-read-surface.mjs",
  "scripts/smoke-perspective-temporal-spatial-projection-builders.mjs",
  "scripts/smoke-cockpit-perspective-workbench-temporal-underlay.mjs",
  "scripts/smoke-perspective-capsule-contract.mjs",
  "scripts/smoke-readonly-api-route-access-guard.mjs",
  "scripts/smoke-readonly-api-route-response-shape-boundary.mjs",
  "scripts/smoke-readonly-api-route-auth-source-selection.mjs",
]);

const requiredExports = [
  "ReadonlyApiAuthScopeAdapterBoundaryV0",
  "ReadonlyApiAuthScopeRequestV0",
  "ReadonlyApiAuthScopeDecisionV0",
  "ReadonlyApiAuthScopeSuccessV0",
  "ReadonlyApiAuthScopeFailureV0",
  "ReadonlyApiAuthScopeErrorCodeV0",
  "ReadonlyApiAuthScopeIdentityRefV0",
  "ReadonlyApiAuthScopeWorkspaceRefV0",
  "ReadonlyApiAuthScopeProjectRefV0",
  "ReadonlyApiAuthScopeSourceKindV0",
  "ReadonlyApiAuthScopeAdapterAuthorityBoundaryV0",
  "ReadonlyApiAuthScopeForbiddenFieldV0",
];

const requiredErrorCodes = [
  "missing_identity",
  "invalid_identity",
  "missing_session",
  "invalid_session",
  "missing_workspace",
  "unauthorized_workspace",
  "missing_project",
  "unauthorized_project",
  "missing_scope",
  "ambiguous_scope",
  "stale_scope",
  "cross_workspace_scope",
  "unavailable_auth_source",
  "malformed_request",
  "method_not_allowed",
  "local_guard_failed",
  "forbidden_field_detected",
];

const requiredSourceKinds = [
  "local_guard_only",
  "augnes_local_session_candidate",
  "local_operator_session_candidate",
  "chatgpt_app_mcp_context_candidate",
  "local_development_auth_adapter_candidate",
  "future_external_auth_candidate",
];

const requiredForbiddenFields = [
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

const requiredTypeBoundaryPhrases = [
  "type-only",
  "not runtime schema",
  "not auth implementation",
  "not production auth",
  "not hosted auth",
  "not OAuth",
  "not session identity implementation",
  "not workspace membership implementation",
  "not route behavior change",
  "not consumer authority",
  "not proof/evidence write authority",
  "not DB query authority",
  "not source-of-truth",
];

const requiredSections = [
  "Status and scope",
  "Purpose",
  "Relationship to source selection",
  "Type boundary overview",
  "Request type boundary",
  "Decision type boundary",
  "Success result boundary",
  "Failure result boundary",
  "Error code boundary",
  "Identity/workspace/project refs",
  "Source kind boundary",
  "Forbidden fields boundary",
  "Local guard composition boundary",
  "Future implementation requirements",
  "Future smoke requirements",
  "Authority and non-authority boundary",
  "Validation and smoke plan",
  "Non-goals",
];

const requiredDocPhrases = [
  "type/docs/smoke/package-pointer only",
  "type-only",
  "no auth implementation",
  "no route behavior change",
  "not runtime schema",
  "no DB query",
  "no consumer surface",
  "no secrets/env handling",
  "no production auth",
  "no hosted auth",
  "no OAuth",
  "no session identity implementation",
  "no workspace membership implementation",
  "future implementation still requires a concrete source selected by user/PM",
  "current route remains local-only",
  "local guard may compose but cannot replace real auth",
  "There must be no public unauthenticated endpoint",
  "No route-provided text grants authority",
  "Forbidden fields must be removed or never returned",
  typeFile,
  sourceSelectionDoc,
];

const forbiddenPositiveAuthoritySelfTests = [
  "The auth scope adapter boundary may implement production auth.",
  "The adapter boundary may create hosted OAuth sessions.",
  "The selected source may expose credentials after adapter typing.",
  "The route may query the database after adapter boundary.",
  "The adapter may grant consumer authority as context only.",
  "The route may execute Codex after workspace membership.",
  "The adapter may create proof records.",
  "The adapter may merge after separate review.",
  "The adapter may persist graph snapshots.",
  "The type file may become runtime schema.",
];

const allowedBoundarySelfTests = [
  "This adapter boundary does not implement production auth.",
  "The type file is type-only and not runtime schema.",
  "No route may expose credentials.",
  "The local guard is not production auth.",
  "Future real auth integration requires separate implementation.",
  "Evidence pointers are pointer-only.",
  "No route-provided text grants authority.",
  "The adapter boundary is planning-only and does not grant consumer authority.",
];

const textByFile = loadTextByFile(inspectedFiles);
const typeText = textByFile.get(typeFile);
const docText = textByFile.get(adapterBoundaryDoc);
const smokeSource = textByFile.get(smokeFile);

assertAuthorityClassifierSelfTests();
assertPackageJsonScript();
assertSmokeBoundary();
assertTypeBoundary();
assertRequiredSections();
assertDocContent();
assertDocPointers();
assertNoForbiddenPositiveAuthorityGrants();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "readonly-api-route-auth-scope-adapter-boundary",
      pass: true,
      boundary_smoke_mode: changedFilesBoundary.mode,
      type_file_checked: typeFile,
      adapter_boundary_doc_checked: adapterBoundaryDoc,
      docs_checked: [
        adapterBoundaryDoc,
        sourceSelectionDoc,
        authScopePlanDoc,
        reviewChecklistDoc,
        authorityMatrixDoc,
        indexDoc,
      ],
      package_script_checked: true,
      exported_types_checked: requiredExports.length,
      error_codes_checked: requiredErrorCodes.length,
      source_kinds_checked: requiredSourceKinds.length,
      forbidden_fields_checked: requiredForbiddenFields.length,
      type_boundary_phrases_checked: requiredTypeBoundaryPhrases.length,
      required_sections_checked: requiredSections.length,
      local_guard_composition_boundary_checked: true,
      source_selection_pointer_checked: true,
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
      smoke_type: "type-docs-smoke-package-pointer-auth-scope-adapter-boundary-only",
      auth_implementation_added: false,
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
console.log("PASS smoke:readonly-api-route-auth-scope-adapter-boundary");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:readonly-api-route-auth-scope-adapter-boundary",
    expectedCommand:
      "node scripts/smoke-readonly-api-route-auth-scope-adapter-boundary.mjs",
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

function assertTypeBoundary() {
  assert.doesNotMatch(typeText, /^\s*import\b/m, "type file must not import runtime code");
  assert.doesNotMatch(typeText, /^\s*export\s+(const|function|class)\b/m, "type file must export types only");
  assertNoRuntimeImports({
    file: typeFile,
    text: typeText,
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

  for (const exportName of requiredExports) {
    assert(
      new RegExp(`export\\s+type\\s+${escapeRegExp(exportName)}\\b`).test(typeText),
      `${typeFile} must export type: ${exportName}`,
    );
  }
  assertContainsAll(typeFile, [
    ...requiredErrorCodes,
    ...requiredSourceKinds,
    ...requiredForbiddenFields,
    ...requiredTypeBoundaryPhrases,
    "route_id",
    "route_family",
    "requested_scope",
    "requested_project",
    "requested_workspace",
    "request_method",
    "local_guard_result_ref",
    "source_kind",
    "ok: true",
    "identity_ref",
    "workspace_ref",
    "project_ref",
    "authorized_scope",
    "local_guard_composed",
    "ok: false",
    "safe_error_label",
  ], { textByFile });
}

function assertRequiredSections() {
  for (const section of requiredSections) {
    const headingPattern = new RegExp(
      `^##\\s+\\d+\\.\\s+${escapeRegExp(section)}\\s*$`,
      "m",
    );
    assert(
      headingPattern.test(docText),
      `${adapterBoundaryDoc} must contain section: ${section}`,
    );
  }
}

function assertDocContent() {
  assertContainsAll(adapterBoundaryDoc, [
    ...requiredDocPhrases,
    ...requiredExports,
    ...requiredErrorCodes,
    ...requiredSourceKinds,
    ...requiredForbiddenFields,
    "Forbidden fields must be removed or never returned",
    "current route remains local-only until a separate implementation PR changes it",
    "The local guard may compose but cannot replace real auth",
    "This type boundary does not satisfy those implementation requirements by itself",
  ], { textByFile });
}

function assertDocPointers() {
  assertContainsAll(sourceSelectionDoc, [
    adapterBoundaryDoc,
    typeFile,
    "recommended next artifact after Candidate E",
    "no auth implementation",
    "no route behavior change",
  ], { textByFile });
  assertContainsAll(authScopePlanDoc, [
    adapterBoundaryDoc,
    typeFile,
    "type vocabulary only",
    "do not implement auth",
  ], { textByFile });
  assertContainsAll(reviewChecklistDoc, [
    adapterBoundaryDoc,
    typeFile,
    "type-only auth/scope adapter boundary",
    "concrete auth/session/workspace evidence",
  ], { textByFile });
  assertContainsAll(authorityMatrixDoc, [
    adapterBoundaryDoc,
    typeFile,
    "type-only auth/scope adapter boundary",
    "add no authority",
  ], { textByFile });
  assertContainsAll(indexDoc, [
    adapterBoundaryDoc,
    typeFile,
    "smoke:readonly-api-route-auth-scope-adapter-boundary",
    "type/docs/smoke/package-pointer only",
    "no auth implementation",
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
    { file: typeFile, text: extractSourceBetween(textByFile.get(typeFile), "/**", "*/") },
    { file: adapterBoundaryDoc, text: textByFile.get(adapterBoundaryDoc) },
    {
      file: sourceSelectionDoc,
      text: extractSourceBetween(
        textByFile.get(sourceSelectionDoc),
        "`docs/READONLY_API_ROUTE_AUTH_SCOPE_ADAPTER_BOUNDARY_V0_1.md`",
        "## 4. Existing repo-local candidates inspected",
      ),
    },
    {
      file: authScopePlanDoc,
      text: extractSourceBetween(
        textByFile.get(authScopePlanDoc),
        "`docs/READONLY_API_ROUTE_AUTH_SCOPE_ADAPTER_BOUNDARY_V0_1.md`",
        "## 3. Current local guard baseline",
      ),
    },
    {
      file: reviewChecklistDoc,
      text: extractSourceBetween(
        textByFile.get(reviewChecklistDoc),
        "`docs/READONLY_API_ROUTE_AUTH_SCOPE_ADAPTER_BOUNDARY_V0_1.md`",
        "## Privacy boundary",
      ),
    },
    {
      file: authorityMatrixDoc,
      text: extractSourceBetween(
        textByFile.get(authorityMatrixDoc),
        "`docs/READONLY_API_ROUTE_AUTH_SCOPE_ADAPTER_BOUNDARY_V0_1.md`",
        "| Lane id |",
      ),
    },
    {
      file: indexDoc,
      text: extractSourceBetween(
        textByFile.get(indexDoc),
        "- `docs/READONLY_API_ROUTE_AUTH_SCOPE_ADAPTER_BOUNDARY_V0_1.md`",
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
    label: "read-only route auth scope adapter boundary smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for read-only route auth scope adapter boundary smoke: ${file}`,
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
  const exactAllowedRuntimeFiles = new Set([
    localDevAdapterFile,
    constellationPreviewHelperFile,
    "app/api/augnes/read/perspective-agent-brief/route.ts",
    "lib/readonly-api/perspective-agent-brief.ts",
  ]);
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
    if (exactAllowedRuntimeFiles.has(file)) {
      continue;
    }
    assert(
      !forbiddenPatterns.some((pattern) => pattern.test(file)),
      `Forbidden changed file for read-only route auth scope adapter boundary smoke: ${file}`,
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
    /\b(auth scope adapter boundary|adapter boundary|adapter|type file|selected source|route response|route|response|endpoint)\b.{0,140}\b(can|may|is allowed to|is permitted to|has authority to|is authorized to|authorizes?|grants?)\b.{0,180}\b(implement production auth|create hosted OAuth sessions?|create OAuth sessions?|expose credentials|query the database|create proof records?|create evidence|create readiness|execute Codex|launch Codex|include mutation URLs?|include approval\/publish\/merge controls?|return raw DB rows?|create branches?|open PRs?|create PRs?|publish|merge|approve|retry|replay|deploy|persist graph snapshots?|persist graphs?|grant consumer authority|become runtime schema)\b/i,
    /\b(adds?|implements?|enables?|activates?|creates?|records?|writes?|calls?|runs?|executes?|publishes?|approves?|retries|replays|merges?|deploys?|persists?|queries?|becomes?)\b.{0,180}\b(production auth|hosted auth|OAuth|hosted OAuth|session identity|multi-user tenancy|workspace membership|runtime schema|UI code|consumer surface|Cockpit integration|ChatGPT App component|MCP\/App tools?|MCP tools?|DB queries?|database queries?|DB schema|migrations?|graph DB|persistence|external calls?|OpenAI calls?|GitHub calls?|proof\/evidence writes?|proof writes?|evidence writes?|readiness writes?|proof records?|evidence records?|readiness records?|AG Resume behavior|branch creation authority|PR creation authority|merge authority|publish authority|approval authority|Codex SDK execution|provider implementation|credentials|secrets|provider credentials|mutation URLs?|graph snapshots?)\b/i,
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
