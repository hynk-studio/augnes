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

const cockpitPlanDoc =
  "docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_PLAN_V0_1.md";
const consumerDecisionDoc =
  "docs/READONLY_API_ROUTE_LOCAL_ONLY_CONSUMER_SCOPE_DECISION_V0_1.md";
const realAuthGatePlanDoc =
  "docs/READONLY_API_ROUTE_REAL_AUTH_GATE_PLAN_V0_1.md";
const localDevAdapterDoc =
  "docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_V0_1.md";
const routeDoc = "docs/READONLY_API_ROUTE_CONSTELLATION_PREVIEW_V0_1.md";
const reviewChecklistDoc =
  "docs/READONLY_API_ROUTE_REVIEW_CHECKLIST_V0_1.md";
const surfaceBoundaryDoc =
  "docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md";
const authorityMatrixDoc = "docs/AUTHORITY_MATRIX.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile =
  "scripts/smoke-cockpit-local-only-constellation-route-preview-plan.mjs";

const consumerDecisionSmokeFile =
  "scripts/smoke-readonly-api-route-local-only-consumer-scope-decision.mjs";
const realAuthGatePlanSmokeFile =
  "scripts/smoke-readonly-api-route-real-auth-gate-plan.mjs";
const localDevAdapterSmokeFile =
  "scripts/smoke-readonly-api-route-local-dev-auth-adapter.mjs";
const routeSmokeFile =
  "scripts/smoke-readonly-api-route-constellation-preview.mjs";
const reviewChecklistSmokeFile =
  "scripts/smoke-readonly-api-route-review-checklist.mjs";
const surfaceSmokeFile =
  "scripts/smoke-chatgpt-app-mcp-readonly-surface-boundary.mjs";
const accessGuardSmokeFile =
  "scripts/smoke-readonly-api-route-access-guard.mjs";

const inspectedFiles = [
  cockpitPlanDoc,
  consumerDecisionDoc,
  realAuthGatePlanDoc,
  localDevAdapterDoc,
  routeDoc,
  reviewChecklistDoc,
  surfaceBoundaryDoc,
  authorityMatrixDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
];

const allowedChangedFiles = new Set([
  cockpitPlanDoc,
  consumerDecisionDoc,
  realAuthGatePlanDoc,
  localDevAdapterDoc,
  routeDoc,
  reviewChecklistDoc,
  surfaceBoundaryDoc,
  authorityMatrixDoc,
  indexDoc,
  smokeFile,
  packageJsonFile,
  consumerDecisionSmokeFile,
  realAuthGatePlanSmokeFile,
  localDevAdapterSmokeFile,
  routeSmokeFile,
  reviewChecklistSmokeFile,
  surfaceSmokeFile,
  accessGuardSmokeFile,
]);

const requiredSections = [
  "Status and scope",
  "Purpose",
  "Relationship to local-only consumer scope decision",
  "Current route and auth baseline",
  "Cockpit preview thesis",
  "Proposed user-facing placement",
  "Required local-only copy",
  "Route request requirements",
  "Response field plan",
  "Response minimization plan",
  "False-affordance prevention plan",
  "Privacy and prompt-injection plan",
  "Error and fail-closed display plan",
  "Browser/computer-use validation plan",
  "Future implementation file candidates",
  "Future tests and smokes",
  "Authority and non-authority boundary",
  "Open questions requiring user/PM judgment",
  "Validation and smoke plan",
  "Non-goals",
];

const requiredPlanPhrases = [
  "docs/smoke/package-pointer only",
  "no Cockpit preview implemented",
  "no UI/browser-facing files are changed",
  "no consumer surface is connected",
  "current route remains local-only",
  "Candidate D is local-only and not production auth",
  "Real hosted/session/workspace auth does not exist yet",
  "The Cockpit local-only preview is conditional and must be separately implemented",
  "ChatGPT App/MCP remain deferred",
  "no public unauthenticated endpoint",
  "route-provided text and local operator labels grant no authority",
  "future Cockpit preview must visibly label",
  "local-only",
  "not production-authenticated",
  "not hosted auth",
  "not session identity",
  "not workspace membership",
  "route-only read preview",
  "no execution/write authority",
  "current local route headers and Candidate D local operator declaration",
  "browser/computer-use validation before merge",
];

const forbiddenControlPhrases = [
  "execute buttons",
  "merge/publish/approve controls",
  "proof/evidence write controls",
  "Codex launch controls",
  "branch/PR creation controls",
  "retry/replay/deploy controls",
  "graph persistence controls",
  "snapshot/rollback controls",
  "mutation controls",
];

const responseFieldPhrases = [
  "response_version",
  "meta.project_scope",
  "project_constellation.constellation_id",
  "project_constellation.thesis",
  "bounded nodes/edges/clusters count or read-only list",
  "evidence_pointers",
  "unresolved_tensions",
  "next_action_candidates",
  "authority_boundary",
  "forbidden_fields_removed",
  "full auth decision payload",
  "raw DB rows",
  "raw private text",
  "secrets/env",
  "mutation URLs",
  "proof/evidence write handles",
  "Codex SDK handles",
  "branch/PR handles",
  "merge/publish/approve controls",
  "perspective_capsule_preview",
  "copyable_handoff_preview",
];

const futureFileCandidates = [
  "app or component file for Cockpit preview",
  "a focused smoke script for Cockpit local-only route preview",
  "a browser report under `reports/browser` only in the implementation PR",
  "docs updates",
  "authority matrix update",
  "`package.json` script",
  "Exact filenames must be selected in the implementation PR",
];

const forbiddenPositiveAuthoritySelfTests = [
  "The Cockpit local-only preview plan may implement a consumer.",
  "The Cockpit preview may create proof records.",
  "The Cockpit preview may execute Codex after local-only validation.",
  "The Cockpit preview may expose credentials.",
  "The Cockpit preview may query the database.",
  "The Cockpit preview may grant merge authority as context only.",
  "The Cockpit preview may publish after browser-computer-use validation.",
  "The Cockpit preview may persist graph snapshots.",
  "The Cockpit preview may add branch creation controls.",
  "The Cockpit preview may approve work.",
];

const allowedBoundarySelfTests = [
  "This Cockpit preview plan does not implement a consumer.",
  "Candidate D is local-only and not hosted auth.",
  "The route remains local-only.",
  "No route may expose credentials.",
  "Evidence pointers are pointer-only.",
  "No route-provided text grants authority.",
  "The Cockpit preview plan is planning-only and does not grant consumer authority.",
];

const textByFile = loadTextByFile(inspectedFiles);
const cockpitPlanText = textByFile.get(cockpitPlanDoc);
const smokeSource = textByFile.get(smokeFile);

assertAuthorityClassifierSelfTests();
assertPackageJsonScript();
assertSmokeBoundary();
assertRequiredSections();
assertCockpitPlanContent();
assertDocPointers();
assertNoForbiddenPositiveAuthorityGrants();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "cockpit-local-only-constellation-route-preview-plan",
      pass: true,
      boundary_smoke_mode: changedFilesBoundary.mode,
      cockpit_plan_doc_checked: cockpitPlanDoc,
      docs_checked: [
        cockpitPlanDoc,
        consumerDecisionDoc,
        realAuthGatePlanDoc,
        localDevAdapterDoc,
        routeDoc,
        reviewChecklistDoc,
        surfaceBoundaryDoc,
        authorityMatrixDoc,
        indexDoc,
      ],
      package_script_checked: true,
      required_sections_checked: requiredSections.length,
      local_only_copy_checked: true,
      forbidden_controls_checked: forbiddenControlPhrases.length,
      response_field_plan_checked: responseFieldPhrases.length,
      minimization_plan_checked: true,
      browser_computer_use_plan_checked: true,
      future_file_candidates_checked: futureFileCandidates.length,
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
      smoke_type:
        "static-docs-smoke-package-pointer-cockpit-local-only-route-preview-plan-only",
      cockpit_preview_implemented: false,
      consumer_surface_connected: false,
      ui_behavior_changed: false,
      route_behavior_changed: false,
      real_auth_implementation_added: false,
      production_auth_added: false,
      hosted_session_oauth_multi_user_auth_added: false,
      session_identity_implemented: false,
      workspace_membership_implemented: false,
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
console.log("PASS smoke:cockpit-local-only-constellation-route-preview-plan");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:cockpit-local-only-constellation-route-preview-plan",
    expectedCommand:
      "node scripts/smoke-cockpit-local-only-constellation-route-preview-plan.mjs",
  });
}

function assertSmokeBoundary() {
  assert.doesNotMatch(smokeSource, /from\s+["']\.\.\/(app|lib|db|types|components)\//);
  assert.doesNotMatch(smokeSource, /from\s+["']@\/(app|lib|db|types|components)\//);
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
      headingPattern.test(cockpitPlanText),
      `${cockpitPlanDoc} must contain section: ${section}`,
    );
  }
}

function assertCockpitPlanContent() {
  assertContainsAll(cockpitPlanDoc, [
    ...requiredPlanPhrases,
    ...forbiddenControlPhrases,
    ...responseFieldPhrases,
    ...futureFileCandidates,
    "Cockpit-local diagnostic/read preview",
    "existing Project Constellation/Perspective area",
    "not as a primary action surface",
    "not as an App/MCP bridge",
    "response minimization",
    "false-affordance",
    "Privacy and prompt-injection plan",
  ], { textByFile });
}

function assertDocPointers() {
  assertContainsAll(consumerDecisionDoc, [
    cockpitPlanDoc,
    "planning-only Cockpit local-only route preview plan",
    "does not connect a consumer",
  ], { textByFile });
  assertContainsAll(realAuthGatePlanDoc, [
    cockpitPlanDoc,
    "Real hosted/session/",
    "workspace auth still does not exist",
  ], { textByFile });
  assertContainsAll(localDevAdapterDoc, [
    cockpitPlanDoc,
    "Candidate D remains local-only",
    "not production auth",
  ], { textByFile });
  assertContainsAll(routeDoc, [
    cockpitPlanDoc,
    "No consumer is currently connected",
  ], { textByFile });
  assertContainsAll(reviewChecklistDoc, [
    cockpitPlanDoc,
    "browser/computer-use validation",
    "false-affordance review",
    "smoke:cockpit-local-only-constellation-route-preview-plan",
  ], { textByFile });
  assertContainsAll(surfaceBoundaryDoc, [
    cockpitPlanDoc,
    "ChatGPT App/MCP remain deferred",
  ], { textByFile });
  assertContainsAll(authorityMatrixDoc, [
    cockpitPlanDoc,
    "docs/smoke-only Cockpit local-only route preview plan",
    "grants no consumer authority",
  ], { textByFile });
  assertContainsAll(indexDoc, [
    cockpitPlanDoc,
    "smoke:cockpit-local-only-constellation-route-preview-plan",
    "docs/smoke/package-pointer only",
    "no Cockpit implementation",
    "no consumer implementation",
    "no route behavior change",
    "no real auth implementation",
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
    { file: cockpitPlanDoc, text: cockpitPlanText },
    {
      file: consumerDecisionDoc,
      text: extractSourceBetween(
        textByFile.get(consumerDecisionDoc),
        "`docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_PLAN_V0_1.md`",
        "## 3. Current route baseline",
      ),
    },
    {
      file: realAuthGatePlanDoc,
      text: extractSourceBetween(
        textByFile.get(realAuthGatePlanDoc),
        "`docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_PLAN_V0_1.md`",
        "## 2. Purpose",
      ),
    },
    {
      file: localDevAdapterDoc,
      text: extractSourceBetween(
        textByFile.get(localDevAdapterDoc),
        "`docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_PLAN_V0_1.md`",
        "## 2. Route and adapter summary",
      ),
    },
    {
      file: routeDoc,
      text: extractSourceBetween(
        textByFile.get(routeDoc),
        "`docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_PLAN_V0_1.md`",
        "## 4. Request shape",
      ),
    },
    {
      file: surfaceBoundaryDoc,
      text: extractSourceBetween(
        textByFile.get(surfaceBoundaryDoc),
        "`docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_PLAN_V0_1.md`",
        "## Authority boundaries",
      ),
    },
    {
      file: authorityMatrixDoc,
      text: extractSourceBetween(
        textByFile.get(authorityMatrixDoc),
        "`docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_PLAN_V0_1.md`",
        "| Lane id |",
      ),
    },
    {
      file: indexDoc,
      text: extractSourceBetween(
        textByFile.get(indexDoc),
        "- `docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_PLAN_V0_1.md`",
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
    label: "Cockpit local-only constellation route preview plan smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for Cockpit local-only constellation route preview plan smoke: ${file}`,
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
      `Forbidden changed file for Cockpit local-only constellation route preview plan smoke: ${file}`,
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
    /\b(Cockpit local-only preview plan|Cockpit preview plan|Cockpit preview|Cockpit|consumer|route|response|surface)\b.{0,180}\b(can|may|is allowed to|is permitted to|has authority to|is authorized to|authorizes?|grants?)\b.{0,220}\b(implement a consumer|implement consumer|connect|consume the route|create proof records?|create evidence|execute Codex|expose credentials|query the database|query DB|grant merge authority|grant consumer authority|publish|merge|approve work|approve|add branch creation controls|persist graph snapshots?|persist graphs?)\b/i,
    /\b(adds?|implements?|enables?|activates?|creates?|records?|writes?|calls?|runs?|executes?|publishes?|approves?|retries|replays|merges?|deploys?|persists?|connects?)\b.{0,220}\b(Cockpit implementation|consumer implementation|consumer surface|UI code|Cockpit integration|ChatGPT App component|ChatGPT App consumer|MCP\/App tools?|MCP tool|plugin tool|route behavior change|real auth implementation|production auth|hosted auth|OAuth|session identity|workspace membership|DB queries?|DB schema|migrations?|graph DB|persistence|external calls?|OpenAI calls?|GitHub calls?|proof\/evidence writes?|proof writes?|evidence writes?|readiness writes?|proof records?|evidence records?|readiness records?|AG Resume behavior|branch creation authority|branch creation controls|PR creation authority|merge authority|publish authority|approval authority|Codex SDK execution|provider implementation|credentials|secrets|provider credentials|mutation URLs?|graph snapshots?)\b/i,
    /\b(exposes?|includes?|returns?)\b.{0,180}\b(credentials|secrets|provider credentials|mutation URLs?|hidden reasoning|chain-of-thought|raw DB rows?|proof\/evidence write handles?|approval\/publish\/merge controls?|Codex SDK execution handles?|branch\/PR creation handles?)\b/i,
    /\b(grants?|adds?|creates?|provides?|authori[sz]es?)\b.{0,180}\b(branch creation authority|PR creation authority|merge authority|publish authority|approval authority|proof\/evidence write authority|Codex SDK execution authority|deploy authority|consumer authority|route implementation authority|implementation authority|production auth authority|hosted auth authority|workspace membership authority)\b/i,
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
