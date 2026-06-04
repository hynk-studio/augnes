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

const localDevAdapterPlanDoc =
  "docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_PLAN_V0_1.md";
const localDevAdapterDoc =
  "docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_V0_1.md";
const localDevAdapterFile = "lib/readonly-api/local-dev-auth-adapter.ts";
const constellationPreviewHelperFile =
  "lib/readonly-api/constellation-preview.ts";
const adapterBoundaryDoc =
  "docs/READONLY_API_ROUTE_AUTH_SCOPE_ADAPTER_BOUNDARY_V0_1.md";
const authScopeTypeFile = "types/readonly-api-auth-scope.ts";
const authSourceSelectionDoc =
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
  "scripts/smoke-readonly-api-route-local-dev-auth-adapter-plan.mjs";
const localDevAdapterSmokeFile =
  "scripts/smoke-readonly-api-route-local-dev-auth-adapter.mjs";

const adapterBoundarySmokeFile =
  "scripts/smoke-readonly-api-route-auth-scope-adapter-boundary.mjs";
const authSourceSelectionSmokeFile =
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

const inspectedFiles = [
  localDevAdapterPlanDoc,
  localDevAdapterDoc,
  localDevAdapterFile,
  constellationPreviewHelperFile,
  adapterBoundaryDoc,
  authScopeTypeFile,
  authSourceSelectionDoc,
  authScopePlanDoc,
  accessGuardDoc,
  routeDoc,
  reviewChecklistDoc,
  authorityMatrixDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
];

const allowedChangedFiles = new Set([
  localDevAdapterPlanDoc,
  localDevAdapterDoc,
  localDevAdapterFile,
  constellationPreviewHelperFile,
  adapterBoundaryDoc,
  authSourceSelectionDoc,
  authScopePlanDoc,
  accessGuardDoc,
  routeDoc,
  reviewChecklistDoc,
  authorityMatrixDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
  localDevAdapterSmokeFile,
  adapterBoundarySmokeFile,
  authSourceSelectionSmokeFile,
  authScopePlanSmokeFile,
  accessGuardSmokeFile,
  constellationPreviewSmokeFile,
  reviewChecklistSmokeFile,
  surfaceSmokeFile,
]);

const requiredSections = [
  "Status and scope",
  "Purpose",
  "Relationship to Candidate D",
  "Relationship to type-only auth/scope adapter boundary",
  "Current local guard baseline",
  "Local development auth adapter thesis",
  "Proposed local-only source model",
  "Identity proof plan",
  "Workspace/project membership proof plan",
  "Scope mapping plan",
  "Local guard composition plan",
  "Request and decision mapping to types/readonly-api-auth-scope.ts",
  "Fail-closed behavior plan",
  "Forbidden fields and minimization plan",
  "Privacy and prompt-injection plan",
  "Logging and telemetry plan",
  "Future implementation slices",
  "Future tests and smokes",
  "Browser/computer-use plan",
  "Authority and non-authority boundary",
  "Open questions requiring user/PM judgment",
  "Validation and smoke plan",
  "Non-goals",
];

const requiredPlanPhrases = [
  "docs/smoke/package-pointer only",
  "Candidate D",
  authScopeTypeFile,
  adapterBoundaryDoc,
  "local-only and is not production auth",
  "no adapter implementation",
  "no route behavior change",
  "no consumer surface",
  "current route remains local-only",
  "local guard may compose but cannot replace real auth",
  "no public unauthenticated endpoint",
  "no secrets/env requirement",
  "cannot prove hosted caller identity",
  "cannot prove hosted workspace/project membership",
  "must not be used as hosted auth",
  "must compose with the existing local guard",
  "not replace future real auth",
  "Future implementation may use an explicit local operator identity token",
  "documented as local-only and not a secret-bearing production auth source",
  "Future implementation must map Candidate D request and decision results",
  "Candidate D local-only semantics were accepted for implementation",
  "remains local-only and not production auth",
];

const localOnlySourceVocabulary = [
  "local_operator_ref",
  "local_operator_label",
  "local_adapter_source_kind: local_development_auth_adapter_candidate",
  "requested_scope: project:augnes",
  "local_guard_result_ref",
  "local_guard_composed: true",
  "identity_proof_label: local_development_declaration_only",
  "membership_proof_label: local_project_scope_declaration_only",
];

const failClosedPhrases = [
  "missing local operator identity",
  "invalid local operator identity",
  "missing scope",
  "unauthorized scope",
  "local guard failure",
  "method mismatch",
  "malformed request",
  "unavailable local adapter source",
  "forbidden field detection",
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

const futureSlicePhrases = [
  "Slice 1: PM/user confirms Candidate D local-only semantics or defers",
  "Slice 2: exact local operator declaration vocabulary is reviewed",
  "Slice 3: type-mapped local adapter test fixtures are defined",
  "Slice 4: local guard composition behavior is implemented in a scoped PR",
  "Slice 5: fail-closed local adapter smoke is added",
  "Slice 6: forbidden field and response minimization smoke is added",
  "Slice 7: prompt-injection, privacy, and logging smoke is added",
  "Slice 8: local route manual checks are run",
  "Slice 9: consumer selection remains separate",
  "These are future implementation slices",
];

const futureTestPhrases = [
  "focused local dev auth adapter smoke",
  "local guard composition smoke",
  "fail-closed missing local operator identity smoke",
  "fail-closed invalid local operator identity smoke",
  "fail-closed missing scope smoke",
  "fail-closed unauthorized scope smoke",
  "fail-closed local guard failure smoke",
  "fail-closed method mismatch smoke",
  "fail-closed malformed request smoke",
  "fail-closed unavailable local adapter source smoke",
  "forbidden field detection smoke",
  "response minimization smoke",
  "prompt-injection display-data smoke",
  "privacy/logging smoke",
  "route compatibility smoke",
  "browser/computer-use report only if a UI/App/MCP consumer is surfaced",
];

const forbiddenPositiveAuthoritySelfTests = [
  "The local dev auth adapter plan may implement production auth.",
  "Candidate D may prove hosted caller identity.",
  "The local adapter may create OAuth sessions.",
  "The route may expose credentials after local adapter planning.",
  "The route may query the database after local adapter planning.",
  "The local adapter may grant consumer authority as context only.",
  "The route may execute Codex after local operator declaration.",
  "The local adapter may create proof records.",
  "The local adapter may merge after separate review.",
  "The local adapter may persist graph snapshots.",
];

const allowedBoundarySelfTests = [
  "This local dev adapter plan does not implement production auth.",
  "Candidate D is local-only and not hosted auth.",
  "The local guard is not production auth.",
  "Future real auth integration requires separate implementation.",
  "No route may expose credentials.",
  "Evidence pointers are pointer-only.",
  "No route-provided text grants authority.",
  "The local dev adapter plan is planning-only and does not grant consumer authority.",
];

const textByFile = loadTextByFile(inspectedFiles);
const planText = textByFile.get(localDevAdapterPlanDoc);
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
      smoke: "readonly-api-route-local-dev-auth-adapter-plan",
      pass: true,
      boundary_smoke_mode: changedFilesBoundary.mode,
      local_dev_adapter_plan_doc_checked: localDevAdapterPlanDoc,
      docs_checked: [
        localDevAdapterPlanDoc,
        localDevAdapterDoc,
        adapterBoundaryDoc,
        authSourceSelectionDoc,
        authScopePlanDoc,
        accessGuardDoc,
        reviewChecklistDoc,
        authorityMatrixDoc,
        indexDoc,
      ],
      type_file_read_as_text_only: authScopeTypeFile,
      type_file_allowed_as_changed_file: false,
      package_script_checked: true,
      required_sections_checked: requiredSections.length,
      candidate_d_checked: true,
      local_only_non_production_auth_checked: true,
      type_boundary_mapping_checked: true,
      local_guard_composition_plan_checked: true,
      fail_closed_behavior_plan_checked: true,
      forbidden_fields_checked: forbiddenFields.length,
      future_slices_checked: true,
      future_tests_smokes_checked: true,
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
      smoke_type: "static-docs-smoke-package-pointer-local-dev-auth-adapter-plan-only",
      adapter_implementation_added: false,
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
console.log("PASS smoke:readonly-api-route-local-dev-auth-adapter-plan");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:readonly-api-route-local-dev-auth-adapter-plan",
    expectedCommand:
      "node scripts/smoke-readonly-api-route-local-dev-auth-adapter-plan.mjs",
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
      "../db/",
      "../types/",
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
      `${localDevAdapterPlanDoc} must contain section: ${section}`,
    );
  }
}

function assertPlanContent() {
  assertContainsAll(localDevAdapterPlanDoc, [
    ...requiredPlanPhrases,
    ...localOnlySourceVocabulary,
    ...failClosedPhrases,
    ...forbiddenFields,
    ...futureSlicePhrases,
    ...futureTestPhrases,
    "GET /api/augnes/read/constellation-preview",
    "no public unauthenticated endpoint",
    "must not connect Cockpit, ChatGPT App, MCP, or any consumer",
    "Browser/computer-use may be skipped for this PR",
    "No route-provided text grants authority",
    "planning-only and does not grant consumer authority",
  ], { textByFile });
  assertContainsAll(authScopeTypeFile, [
    "ReadonlyApiAuthScopeRequestV0",
    "ReadonlyApiAuthScopeDecisionV0",
    "local_development_auth_adapter_candidate",
    "local_guard_composed",
    "forbidden_field_detected",
  ], { textByFile });
}

function assertDocPointers() {
  assertContainsAll(localDevAdapterPlanDoc, [
    localDevAdapterDoc,
    "Candidate D local-only semantics were accepted",
    "remains local-only and not production auth",
  ], { textByFile });
  assertContainsAll(adapterBoundaryDoc, [
    localDevAdapterPlanDoc,
    "maps Candidate D",
    "planning level only",
    "local-only and not production auth",
  ], { textByFile });
  assertContainsAll(authSourceSelectionDoc, [
    localDevAdapterPlanDoc,
    "source-specific Candidate D plan",
    "local-only",
    "was not selected for implementation until user/PM explicitly accepted local-only semantics",
  ], { textByFile });
  assertContainsAll(authScopePlanDoc, [
    localDevAdapterPlanDoc,
    "maps Candidate D",
    "planning level only",
    "future real auth remains separate",
  ], { textByFile });
  assertContainsAll(accessGuardDoc, [
    localDevAdapterPlanDoc,
    "Local guard composition remains local-only",
    "not production auth",
  ], { textByFile });
  assertContainsAll(reviewChecklistDoc, [
    localDevAdapterPlanDoc,
    "Candidate D local development auth adapter plan",
    "concrete evidence",
    "must not call Candidate D production auth",
  ], { textByFile });
  assertContainsAll(authorityMatrixDoc, [
    localDevAdapterPlanDoc,
    "docs/smoke-only Candidate D local development auth adapter plan",
    "adds no authority",
  ], { textByFile });
  assertContainsAll(indexDoc, [
    localDevAdapterPlanDoc,
    localDevAdapterDoc,
    "smoke:readonly-api-route-local-dev-auth-adapter-plan",
    "smoke:readonly-api-route-local-dev-auth-adapter",
    "docs/smoke/package-pointer only",
    "no auth implementation",
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
    { file: localDevAdapterPlanDoc, text: textByFile.get(localDevAdapterPlanDoc) },
    {
      file: adapterBoundaryDoc,
      text: extractSourceBetween(
        textByFile.get(adapterBoundaryDoc),
        "`docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_PLAN_V0_1.md`",
        "## 4. Type boundary overview",
      ),
    },
    {
      file: authSourceSelectionDoc,
      text: extractSourceBetween(
        textByFile.get(authSourceSelectionDoc),
        "`docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_PLAN_V0_1.md`",
        "## 4. Existing repo-local candidates inspected",
      ),
    },
    {
      file: authScopePlanDoc,
      text: extractSourceBetween(
        textByFile.get(authScopePlanDoc),
        "`docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_PLAN_V0_1.md`",
        "## 3. Current local guard baseline",
      ),
    },
    {
      file: accessGuardDoc,
      text: extractSourceBetween(
        textByFile.get(accessGuardDoc),
        "`docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_PLAN_V0_1.md`",
        "## 2. Purpose",
      ),
    },
    {
      file: reviewChecklistDoc,
      text: extractSourceBetween(
        textByFile.get(reviewChecklistDoc),
        "`docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_PLAN_V0_1.md`",
        "## Privacy boundary",
      ),
    },
    {
      file: authorityMatrixDoc,
      text: extractSourceBetween(
        textByFile.get(authorityMatrixDoc),
        "`docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_PLAN_V0_1.md`",
        "| Lane id |",
      ),
    },
    {
      file: indexDoc,
      text: extractSourceBetween(
        textByFile.get(indexDoc),
        "- `docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_PLAN_V0_1.md`",
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
    label: "read-only route local dev auth adapter plan smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for read-only route local dev auth adapter plan smoke: ${file}`,
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
  ]);
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
      `Forbidden changed file for read-only route local dev auth adapter plan smoke: ${file}`,
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
    /\b(local dev auth adapter plan|local development auth adapter plan|local adapter|candidate d|adapter|route response|route|response|endpoint)\b.{0,140}\b(can|may|is allowed to|is permitted to|has authority to|is authorized to|authorizes?|grants?)\b.{0,180}\b(implement production auth|prove hosted caller identity|prove hosted workspace\/project membership|create OAuth sessions?|create hosted OAuth sessions?|expose credentials|query the database|create proof records?|create evidence|create readiness|execute Codex|launch Codex|include mutation URLs?|include approval\/publish\/merge controls?|return raw DB rows?|create branches?|open PRs?|create PRs?|publish|merge|approve|retry|replay|deploy|persist graph snapshots?|persist graphs?|grant consumer authority)\b/i,
    /\b(adds?|implements?|enables?|activates?|creates?|records?|writes?|calls?|runs?|executes?|publishes?|approves?|retries|replays|merges?|deploys?|persists?|queries?|becomes?)\b.{0,180}\b(adapter implementation|auth implementation|production auth|hosted auth|OAuth|hosted OAuth|session identity|multi-user tenancy|workspace membership|UI code|consumer surface|Cockpit integration|ChatGPT App component|MCP\/App tools?|MCP tools?|DB queries?|database queries?|DB schema|migrations?|graph DB|persistence|external calls?|OpenAI calls?|GitHub calls?|proof\/evidence writes?|proof writes?|evidence writes?|readiness writes?|proof records?|evidence records?|readiness records?|AG Resume behavior|branch creation authority|PR creation authority|merge authority|publish authority|approval authority|Codex SDK execution|provider implementation|credentials|secrets|provider credentials|mutation URLs?|graph snapshots?)\b/i,
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
