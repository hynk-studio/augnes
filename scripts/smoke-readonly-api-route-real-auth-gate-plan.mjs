import assert from "node:assert/strict";
import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertPackageScript,
  collectUntrackedFiles,
  loadTextByFile,
  normalizeText,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const gatePlanDoc = "docs/READONLY_API_ROUTE_REAL_AUTH_GATE_PLAN_V0_1.md";
const localDevAdapterDoc =
  "docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_V0_1.md";
const localDevAdapterPlanDoc =
  "docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_PLAN_V0_1.md";
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
  "scripts/smoke-readonly-api-route-real-auth-gate-plan.mjs";

const localDevAdapterSmokeFile =
  "scripts/smoke-readonly-api-route-local-dev-auth-adapter.mjs";
const localDevAdapterPlanSmokeFile =
  "scripts/smoke-readonly-api-route-local-dev-auth-adapter-plan.mjs";
const adapterBoundarySmokeFile =
  "scripts/smoke-readonly-api-route-auth-scope-adapter-boundary.mjs";
const authSourceSelectionSmokeFile =
  "scripts/smoke-readonly-api-route-auth-source-selection.mjs";
const authScopePlanSmokeFile =
  "scripts/smoke-readonly-api-route-auth-scope-integration-plan.mjs";
const accessGuardSmokeFile =
  "scripts/smoke-readonly-api-route-access-guard.mjs";
const routeSmokeFile =
  "scripts/smoke-readonly-api-route-constellation-preview.mjs";
const reviewChecklistSmokeFile =
  "scripts/smoke-readonly-api-route-review-checklist.mjs";
const surfaceSmokeFile =
  "scripts/smoke-chatgpt-app-mcp-readonly-surface-boundary.mjs";
const consumerScopeDecisionSmokeFile =
  "scripts/smoke-readonly-api-route-local-only-consumer-scope-decision.mjs";

const inspectedFiles = [
  gatePlanDoc,
  localDevAdapterDoc,
  localDevAdapterPlanDoc,
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
];

const allowedChangedFiles = new Set([
  gatePlanDoc,
  localDevAdapterDoc,
  localDevAdapterPlanDoc,
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
  packageJsonFile,
  localDevAdapterSmokeFile,
  localDevAdapterPlanSmokeFile,
  adapterBoundarySmokeFile,
  authSourceSelectionSmokeFile,
  authScopePlanSmokeFile,
  accessGuardSmokeFile,
  routeSmokeFile,
  reviewChecklistSmokeFile,
  surfaceSmokeFile,
  consumerScopeDecisionSmokeFile,
]);

const requiredSections = [
  "Status and scope",
  "Purpose",
  "Current local-only baseline",
  "Why real auth is still not implemented",
  "Real auth gate thesis",
  "Required source evidence before implementation",
  "Required identity proof gate",
  "Required workspace/project membership proof gate",
  "Required scope mapping gate",
  "Required local guard and Candidate D transition gate",
  "Route behavior change gate",
  "Consumer surface gate",
  "Fail-closed behavior requirements",
  "Forbidden fields and response minimization requirements",
  "Privacy, prompt-injection, logging, and telemetry requirements",
  "Future implementation file-scope candidates",
  "Future smoke requirements",
  "Browser/computer-use requirements",
  "Authority and non-authority boundary",
  "Open questions requiring user/PM judgment",
  "Validation and smoke plan",
  "Non-goals",
];

const requiredGatePhrases = [
  "docs/smoke/package-pointer only",
  "no real auth implementation",
  "current route remains local-only after PR #390",
  "Candidate D is local-only and not production auth",
  "Candidate D cannot prove hosted caller identity",
  "Candidate D cannot prove hosted workspace/project membership",
  "blocked until a concrete source can prove both",
  "identity and workspace/project membership",
  "no consumer surface may connect before route-level real auth gates pass",
  "unless PM explicitly chooses local-only consumer scope in a separate PR",
  "Future real auth may wrap or replace Candidate D only in a separate implementation PR",
  "local guard may remain as a local-development gate but cannot replace real auth",
  "no public unauthenticated endpoint",
  "no route-provided text grants authority",
  "must not silently infer identity or scope",
  "route text",
  "fixture text",
  "user text",
  "capsule text",
  "evidence pointer text",
  "next action text",
  "labels",
  "unreviewed headers",
];

const sourceEvidencePhrases = [
  "identity source",
  "session source, if any",
  "workspace source",
  "project membership source",
  "scope mapping source",
  "unavailable-auth error source",
  "privacy boundary",
  "logging boundary",
  "secret handling boundary",
  "tests proving source fails closed",
];

const failClosedCases = [
  "missing identity",
  "invalid identity",
  "missing session",
  "invalid session",
  "missing workspace",
  "unauthorized workspace",
  "missing project",
  "unauthorized project",
  "missing scope",
  "ambiguous scope",
  "stale scope",
  "cross-workspace scope",
  "unavailable auth source",
  "malformed request",
  "method_not_allowed",
  "local_guard_failed if composed",
  "local_dev_adapter_failed if composed",
  "forbidden_field_detected",
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

const futureFileCandidates = [
  "lib/readonly-api/<selected-auth-source>-auth-adapter.ts",
  "docs/READONLY_API_ROUTE_<SELECTED_AUTH_SOURCE>_AUTH_ADAPTER_V0_1.md",
  "scripts/smoke-readonly-api-route-<selected-auth-source>-auth-adapter.mjs",
  "docs/AUTHORITY_MATRIX.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
  "Exact filenames must be chosen only after source selection",
];

const futureSmokePhrases = [
  "concrete identity source evidence",
  "concrete workspace/project membership source evidence",
  "scope mapping",
  "response minimization",
  "no mutation/control handles",
  "prompt-injection display-data boundary",
  "privacy/logging boundary",
  "route compatibility",
  "strict scoped changed-file enforcement",
  "content-only diagnostic mode",
];

const forbiddenPositiveAuthoritySelfTests = [
  "The real auth gate plan may implement production auth.",
  "The gate may create hosted OAuth sessions.",
  "Candidate D may prove hosted caller identity after this gate.",
  "The route may expose credentials after real auth gate planning.",
  "The route may query the database after real auth gate planning.",
  "The gate may grant consumer authority as context only.",
  "The route may execute Codex after workspace membership.",
  "The gate may create proof records.",
  "The gate may merge after separate review.",
  "The gate may persist graph snapshots.",
];

const allowedBoundarySelfTests = [
  "This real auth gate plan does not implement production auth.",
  "Candidate D is local-only and not hosted auth.",
  "The local guard is not production auth.",
  "Future real auth integration requires separate implementation.",
  "No route may expose credentials.",
  "Evidence pointers are pointer-only.",
  "No route-provided text grants authority.",
  "The real auth gate plan is planning-only and does not grant consumer authority.",
];

const textByFile = loadTextByFile(inspectedFiles);
const gateText = textByFile.get(gatePlanDoc);
const smokeSource = textByFile.get(smokeFile);

assertAuthorityClassifierSelfTests();
assertPackageJsonScript();
assertSmokeBoundary();
assertRequiredSections();
assertGatePlanContent();
assertDocPointers();
assertNoForbiddenPositiveAuthorityGrants();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "readonly-api-route-real-auth-gate-plan",
      pass: true,
      boundary_smoke_mode: changedFilesBoundary.mode,
      gate_plan_doc_checked: gatePlanDoc,
      docs_checked: [
        gatePlanDoc,
        localDevAdapterDoc,
        localDevAdapterPlanDoc,
        adapterBoundaryDoc,
        authSourceSelectionDoc,
        authScopePlanDoc,
        accessGuardDoc,
        routeDoc,
        reviewChecklistDoc,
        authorityMatrixDoc,
        indexDoc,
      ],
      package_script_checked: true,
      required_sections_checked: requiredSections.length,
      source_evidence_gate_checked: true,
      identity_proof_gate_checked: true,
      workspace_project_membership_gate_checked: true,
      scope_mapping_gate_checked: true,
      candidate_d_transition_gate_checked: true,
      consumer_surface_gate_checked: true,
      fail_closed_cases_checked: failClosedCases.length,
      forbidden_fields_checked: forbiddenFields.length,
      future_file_scope_candidates_checked: futureFileCandidates.length,
      future_smoke_requirements_checked: true,
      browser_computer_use_requirements_checked: true,
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
      smoke_type: "static-docs-smoke-package-pointer-real-auth-gate-plan-only",
      real_auth_implementation_added: false,
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
console.log("PASS smoke:readonly-api-route-real-auth-gate-plan");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:readonly-api-route-real-auth-gate-plan",
    expectedCommand:
      "node scripts/smoke-readonly-api-route-real-auth-gate-plan.mjs",
  });
}

function assertSmokeBoundary() {
  assert.doesNotMatch(smokeSource, /from\s+["']\.\.\/(app|lib|db|types)\//);
  assert.doesNotMatch(smokeSource, /from\s+["']@\/(app|lib|db|types)\//);
  assert.doesNotMatch(smokeSource, /\bfetch\s*\(/);
  assert.doesNotMatch(smokeSource, /\bnew\s+XMLHttpRequest\b|\bXMLHttpRequest\s*\(/);
  assert.doesNotMatch(smokeSource, /\bapi\.github\.com\b/);
  assert.doesNotMatch(smokeSource, /\bapi\.openai\.com\b/);
}

function assertRequiredSections() {
  for (const section of requiredSections) {
    const headingPattern = new RegExp(
      `^##\\s+\\d+\\.\\s+${escapeRegExp(section)}\\s*$`,
      "m",
    );
    assert(
      headingPattern.test(gateText),
      `${gatePlanDoc} must contain section: ${section}`,
    );
  }
}

function assertGatePlanContent() {
  assertContainsAll(gatePlanDoc, [
    ...requiredGatePhrases,
    ...sourceEvidencePhrases,
    ...failClosedCases,
    ...forbiddenFields,
    ...futureFileCandidates,
    ...futureSmokePhrases,
    "Required source evidence before implementation",
    "Required identity proof gate",
    "Required workspace/project membership proof gate",
    "Required scope mapping gate",
    "Required local guard and Candidate D transition gate",
    "Browser/computer-use may be skipped",
  ], { textByFile });
}

function assertDocPointers() {
  assertContainsAll(localDevAdapterDoc, [
    gatePlanDoc,
    "Candidate D remains local-only",
    "not the real auth gate",
  ], { textByFile });
  assertContainsAll(localDevAdapterPlanDoc, [
    gatePlanDoc,
    "does not satisfy real auth",
  ], { textByFile });
  assertContainsAll(adapterBoundaryDoc, [
    gatePlanDoc,
    "future real auth/scope implementation",
    "satisfy this type boundary",
  ], { textByFile });
  assertContainsAll(authSourceSelectionDoc, [
    gatePlanDoc,
    "Candidate E remains the real auth source decision",
  ], { textByFile });
  assertContainsAll(authScopePlanDoc, [
    gatePlanDoc,
    "next required decision point",
  ], { textByFile });
  assertContainsAll(accessGuardDoc, [
    gatePlanDoc,
    "remains not production auth",
  ], { textByFile });
  assertContainsAll(routeDoc, [
    gatePlanDoc,
    "current route remains local-only",
    "Candidate D local dev adapter",
  ], { textByFile });
  assertContainsAll(reviewChecklistDoc, [
    gatePlanDoc,
    "smoke:readonly-api-route-real-auth-gate-plan",
    "concrete source evidence",
  ], { textByFile });
  assertContainsAll(authorityMatrixDoc, [
    gatePlanDoc,
    "docs/smoke-only real auth gate plan",
    "adds no real auth implementation",
  ], { textByFile });
  assertContainsAll(indexDoc, [
    gatePlanDoc,
    "smoke:readonly-api-route-real-auth-gate-plan",
    "docs/smoke/package-pointer only",
    "no real auth implementation",
    "no route behavior change",
    "no consumer",
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
    { file: gatePlanDoc, text: gateText },
    {
      file: localDevAdapterDoc,
      text: extractSourceBetween(
        textByFile.get(localDevAdapterDoc),
        "`docs/READONLY_API_ROUTE_REAL_AUTH_GATE_PLAN_V0_1.md`",
        "## 2. Route and adapter summary",
      ),
    },
    {
      file: localDevAdapterPlanDoc,
      text: extractSourceBetween(
        textByFile.get(localDevAdapterPlanDoc),
        "`docs/READONLY_API_ROUTE_REAL_AUTH_GATE_PLAN_V0_1.md`",
        "## 2. Purpose",
      ),
    },
    {
      file: adapterBoundaryDoc,
      text: extractSourceBetween(
        textByFile.get(adapterBoundaryDoc),
        "`docs/READONLY_API_ROUTE_REAL_AUTH_GATE_PLAN_V0_1.md`",
        "## 4. Type boundary overview",
      ),
    },
    {
      file: authSourceSelectionDoc,
      text: extractSourceBetween(
        textByFile.get(authSourceSelectionDoc),
        "`docs/READONLY_API_ROUTE_REAL_AUTH_GATE_PLAN_V0_1.md`",
        "## 4. Existing repo-local candidates inspected",
      ),
    },
    {
      file: authScopePlanDoc,
      text: extractSourceBetween(
        textByFile.get(authScopePlanDoc),
        "`docs/READONLY_API_ROUTE_REAL_AUTH_GATE_PLAN_V0_1.md`",
        "## 3. Current local guard baseline",
      ),
    },
    {
      file: accessGuardDoc,
      text: extractSourceBetween(
        textByFile.get(accessGuardDoc),
        "`docs/READONLY_API_ROUTE_REAL_AUTH_GATE_PLAN_V0_1.md`",
        "## 2. Purpose",
      ),
    },
    {
      file: routeDoc,
      text: extractSourceBetween(
        textByFile.get(routeDoc),
        "`docs/READONLY_API_ROUTE_REAL_AUTH_GATE_PLAN_V0_1.md`",
        "## 4. Request shape",
      ),
    },
    {
      file: authorityMatrixDoc,
      text: extractSourceBetween(
        textByFile.get(authorityMatrixDoc),
        "`docs/READONLY_API_ROUTE_REAL_AUTH_GATE_PLAN_V0_1.md`",
        "| Lane id |",
      ),
    },
    {
      file: indexDoc,
      text: extractSourceBetween(
        textByFile.get(indexDoc),
        "- `docs/READONLY_API_ROUTE_REAL_AUTH_GATE_PLAN_V0_1.md`",
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
    label: "read-only route real auth gate plan smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for read-only route real auth gate plan smoke: ${file}`,
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
    /^types\//,
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
      `Forbidden changed file for read-only route real auth gate plan smoke: ${file}`,
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
    /\b(real auth gate plan|gate plan|real auth gate|gate|route|response|endpoint|Candidate D)\b.{0,160}\b(can|may|is allowed to|is permitted to|has authority to|is authorized to|authorizes?|grants?)\b.{0,200}\b(implement production auth|implement real auth|create hosted OAuth sessions?|prove hosted caller identity|expose credentials|query the database|query DB|grant consumer authority|execute Codex|create proof records?|create evidence|merge|publish|approve|retry|replay|deploy|persist graph snapshots?|persist graphs?)\b/i,
    /\b(adds?|implements?|enables?|activates?|creates?|records?|writes?|calls?|runs?|executes?|publishes?|approves?|retries|replays|merges?|deploys?|persists?|connects?)\b.{0,200}\b(real auth implementation|production auth|hosted auth|OAuth|hosted OAuth sessions?|session identity|workspace membership|route behavior change|consumer surface|consumer authority|UI code|Cockpit integration|ChatGPT App component|MCP\/App tools?|DB queries?|DB schema|migrations?|graph DB|persistence|external calls?|OpenAI calls?|GitHub calls?|proof\/evidence writes?|proof writes?|evidence writes?|readiness writes?|proof records?|evidence records?|readiness records?|AG Resume behavior|branch creation authority|PR creation authority|merge authority|publish authority|approval authority|Codex SDK execution|provider implementation|credentials|secrets|provider credentials|mutation URLs?|graph snapshots?)\b/i,
    /\b(exposes?|includes?|returns?)\b.{0,180}\b(credentials|secrets|provider credentials|mutation URLs?|hidden reasoning|chain-of-thought|raw DB rows?|proof\/evidence write handles?|approval\/publish\/merge controls?|Codex SDK execution handles?|branch\/PR creation handles?)\b/i,
    /\b(grants?|adds?|creates?|provides?|authori[sz]es?)\b.{0,160}\b(branch creation authority|PR creation authority|merge authority|publish authority|approval authority|proof\/evidence write authority|Codex SDK execution authority|deploy authority|API implementation authority|implementation authority|route implementation authority|consumer authority|real auth authority|production auth authority)\b/i,
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

function extractSourceBetween(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  if (start === -1) return "";
  const end = text.indexOf(endMarker, start + startMarker.length);
  return end === -1 ? text.slice(start) : text.slice(start, end);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
