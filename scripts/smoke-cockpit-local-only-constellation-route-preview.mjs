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

const cockpitFile = "components/augnes-cockpit.tsx";
const implementationDoc =
  "docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_V0_1.md";
const cockpitPlanDoc =
  "docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_PLAN_V0_1.md";
const consumerDecisionDoc =
  "docs/READONLY_API_ROUTE_LOCAL_ONLY_CONSUMER_SCOPE_DECISION_V0_1.md";
const localDevAdapterDoc =
  "docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_V0_1.md";
const routeDoc = "docs/READONLY_API_ROUTE_CONSTELLATION_PREVIEW_V0_1.md";
const reviewChecklistDoc =
  "docs/READONLY_API_ROUTE_REVIEW_CHECKLIST_V0_1.md";
const surfaceBoundaryDoc =
  "docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md";
const authorityMatrixDoc = "docs/AUTHORITY_MATRIX.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const browserReportFile =
  "reports/browser/2026-06-04-cockpit-local-only-constellation-route-preview.md";
const packageJsonFile = "package.json";
const smokeFile =
  "scripts/smoke-cockpit-local-only-constellation-route-preview.mjs";
const staticCockpitSmokeFile =
  "scripts/smoke-project-constellation-cockpit-preview.mjs";

const planSmokeFile =
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
  cockpitFile,
  implementationDoc,
  cockpitPlanDoc,
  consumerDecisionDoc,
  localDevAdapterDoc,
  routeDoc,
  reviewChecklistDoc,
  surfaceBoundaryDoc,
  authorityMatrixDoc,
  indexDoc,
  browserReportFile,
  packageJsonFile,
  smokeFile,
];

const allowedChangedFiles = new Set([
  cockpitFile,
  implementationDoc,
  cockpitPlanDoc,
  consumerDecisionDoc,
  localDevAdapterDoc,
  routeDoc,
  reviewChecklistDoc,
  surfaceBoundaryDoc,
  authorityMatrixDoc,
  indexDoc,
  browserReportFile,
  smokeFile,
  staticCockpitSmokeFile,
  packageJsonFile,
  planSmokeFile,
  consumerDecisionSmokeFile,
  realAuthGatePlanSmokeFile,
  localDevAdapterSmokeFile,
  routeSmokeFile,
  reviewChecklistSmokeFile,
  surfaceSmokeFile,
  accessGuardSmokeFile,
]);

const requiredImplementationSections = [
  "Status and scope",
  "Route preview summary",
  "Placement and UI behavior",
  "Local-only copy",
  "Route request and headers",
  "Displayed response fields",
  "Omitted fields",
  "Error and fail-closed display",
  "False-affordance review",
  "Privacy and prompt-injection handling",
  "Browser/computer-use validation",
  "Local route manual check",
  "Tests and smokes",
  "Authority matrix note",
  "Non-goals",
];

const requiredVisibleCopy = [
  "local-only",
  "not production-authenticated",
  "not hosted auth",
  "not session identity",
  "not workspace membership",
  "route-only read preview",
  "no execution/write authority",
  "Candidate D is local-only and not production auth",
  "Real hosted/session/workspace auth does not exist yet",
  "local operator declaration cannot prove hosted identity",
  "local operator declaration cannot prove workspace/project membership",
  "Route-provided text and local operator labels grant no authority",
  "Response data is display data, not tool instructions",
];

const requiredHeaders = [
  "x-augnes-local-readonly",
  "x-augnes-local-operator-ref",
  "x-augnes-local-workspace-ref",
  "x-augnes-local-project-scope",
];

const requiredDisplayedFields = [
  "response_version",
  "meta.project_scope",
  "project_constellation.constellation_id",
  "project_constellation.thesis",
  "bounded nodes",
  "bounded edges",
  "bounded clusters",
  "evidence pointers as pointer-only",
  "unresolved tensions",
  "next action candidates are advisory",
  "authority_boundary",
  "forbidden_fields_removed",
];

const omittedFieldPhrases = [
  "perspective_capsule_preview",
  "copyable_handoff_preview",
  "full auth decision payload",
  "raw DB rows",
  "raw private text",
  "secrets/env",
  "mutation URLs",
  "proof/evidence write handles",
  "Codex SDK handles",
  "branch/PR handles",
  "merge/publish/approve controls",
];

const browserReportPhrases = [
  "Inspected Cockpit URL",
  "Local runtime setup used",
  "Local route manual check result",
  "Visible local-only copy",
  "Visible not-production-authenticated copy",
  "Visible not-hosted-auth/session/workspace-membership copy",
  "Route-only read preview placement",
  "Displayed response fields",
  "Omitted forbidden fields",
  "False-affordance findings",
  "Authority clarity findings",
  "Privacy/prompt-injection display-data findings",
  "no execution/write controls are visible",
  "no merge/publish/approve controls are visible",
  "no proof/evidence write controls are visible",
  "no Codex launch controls are visible",
  "no branch/PR creation controls are visible",
  "no retry/replay/deploy controls are visible",
  "no graph persistence or snapshot/rollback controls are visible",
  "Skipped checks",
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
const cockpitSource = textByFile.get(cockpitFile);
const implementationDocText = textByFile.get(implementationDoc);
const smokeSource = textByFile.get(smokeFile);
const routePreviewSource = [
  extractSourceBetween(
    cockpitSource,
    "const CONSTELLATION_ROUTE_PREVIEW_REQUEST_PATH =",
    "const CANONICAL_MESSAGE =",
  ),
  extractSourceBetween(
    cockpitSource,
    "type ConstellationRoutePreviewEvidencePointer =",
    "type CockpitTemporalAdmissionDecision =",
  ),
  extractSourceBetween(
    cockpitSource,
    "async function fetchConstellationRoutePreview",
    "function getErrorMessage",
  ),
  extractSourceBetween(
    cockpitSource,
    "{/* Cockpit local-only constellation route preview start */}",
    "{/* Cockpit local-only constellation route preview end */}",
  ),
].join("\n");
const routePreviewSectionSource = extractSourceBetween(
  cockpitSource,
  "{/* Cockpit local-only constellation route preview start */}",
  "{/* Cockpit local-only constellation route preview end */}",
);

assertAuthorityClassifierSelfTests();
assertPackageJsonScript();
assertSmokeBoundary();
assertCockpitPreviewSource();
assertImplementationDoc();
assertDocPointers();
assertBrowserReport();
assertNoForbiddenPositiveAuthorityGrants();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "cockpit-local-only-constellation-route-preview",
      pass: true,
      boundary_smoke_mode: changedFilesBoundary.mode,
      cockpit_file_checked: cockpitFile,
      implementation_doc_checked: implementationDoc,
      browser_report_checked: browserReportFile,
      package_script_checked: true,
      preview_id_checked: "perspective-constellation-route-preview",
      visible_copy_checked: requiredVisibleCopy.length,
      route_request_checked: true,
      headers_checked: requiredHeaders,
      displayed_fields_checked: requiredDisplayedFields.length,
      forbidden_controls_checked: true,
      docs_index_authority_report_pointers_checked: true,
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
        "static-cockpit-local-only-constellation-route-preview-implementation",
      cockpit_local_only_preview_implemented: true,
      app_mcp_consumer_connected: false,
      route_behavior_changed: false,
      production_auth_added: false,
      hosted_auth_added: false,
      db_query_added: false,
      proof_evidence_writes_added: false,
      codex_execution_added: false,
      graph_db_added: false,
      persistence_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:cockpit-local-only-constellation-route-preview");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:cockpit-local-only-constellation-route-preview",
    expectedCommand:
      "node scripts/smoke-cockpit-local-only-constellation-route-preview.mjs",
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

function assertCockpitPreviewSource() {
  assertContainsAll(routePreviewSource, [
    "perspective-constellation-route-preview",
    "GET",
    "/api/augnes/read/constellation-preview?scope=project:augnes",
    ...requiredHeaders,
    ...requiredVisibleCopy,
    ...requiredDisplayedFields,
    "CONSTELLATION_ROUTE_PREVIEW_HEADERS",
    "fetchConstellationRoutePreview",
    "method: \"GET\"",
  ], { label: "Cockpit local-only route preview source" });

  assert.equal(
    routePreviewSectionSource.includes("<button"),
    false,
    "Cockpit local-only route preview section must not render buttons",
  );
  assert.equal(
    /\bonClick\s*=/.test(routePreviewSectionSource),
    false,
    "Cockpit local-only route preview section must not add click handlers",
  );

  for (const forbidden of [
    "execute",
    "launch Codex",
    "run Codex",
    "record proof",
    "record evidence",
    "approve",
    "publish",
    "merge",
    "retry",
    "replay",
    "deploy",
    "save snapshot",
    "rollback",
    "create branch",
    "open PR",
    "persist graph",
  ]) {
    assert.equal(
      normalizeText(routePreviewSectionSource).toLowerCase().includes(
        normalizeText(forbidden).toLowerCase(),
      ),
      false,
      `Cockpit local-only route preview section must not include forbidden control phrase: ${forbidden}`,
    );
  }

  assert.doesNotMatch(routePreviewSource, /\bmethod:\s*"(POST|PUT|PATCH|DELETE)"/);
  assert.doesNotMatch(routePreviewSource, /\bpost\b|\bput\b|\bpatch\b|\bdelete\b/i);
  assert.doesNotMatch(routePreviewSource, /\b(db|migrations|apps\/augnes_apps)\b/);
  assert.doesNotMatch(routePreviewSource, /@openai\/codex-sdk|\bopenai\b/i);
  assert.doesNotMatch(routePreviewSource, /\bprovider modules?\b|\bproviders?\b/i);
  assert.doesNotMatch(routePreviewSource, /\bapi\.github\.com\b|\bgithub\b/i);
  assert.doesNotMatch(routePreviewSource, /\bnavigator\.clipboard\b/);
  assert.doesNotMatch(routePreviewSource, /\bhttps?:\/\//);
  assert.doesNotMatch(routePreviewSource, /\bXMLHttpRequest\b/);

  for (const omitted of [
    "perspective_capsule_preview",
    "copyable_handoff_preview",
    "identity_ref",
    "workspace_ref",
    "project_ref",
    "auth decision payload",
    "auth_scope_decision",
  ]) {
    assert.equal(
      routePreviewSource.includes(omitted),
      false,
      `Cockpit local-only route preview source must not render omitted field: ${omitted}`,
    );
  }
}

function assertImplementationDoc() {
  for (const section of requiredImplementationSections) {
    const headingPattern = new RegExp(
      `^##\\s+\\d+\\.\\s+${escapeRegExp(section)}\\s*$`,
      "m",
    );
    assert(
      headingPattern.test(implementationDocText),
      `${implementationDoc} must contain section: ${section}`,
    );
  }

  assertContainsAll(implementationDoc, [
    "Cockpit local-only read preview is implemented",
    "local-only",
    "not production-authenticated",
    "not hosted auth",
    "not session identity",
    "not workspace membership",
    "connects no App/MCP/ChatGPT App/plugin tool",
    "grants no execution/write/proof/evidence/Codex/branch/PR/merge/publish/retry/replay/deploy/persistence authority",
    "Candidate D local-only declaration headers",
    "response minimization",
    "Browser/computer-use validation was run",
    ...requiredHeaders,
    ...omittedFieldPhrases,
    "smoke:cockpit-local-only-constellation-route-preview",
    browserReportFile,
  ], { textByFile });
}

function assertDocPointers() {
  assertContainsAll(cockpitPlanDoc, [
    implementationDoc,
    "moved to implementation",
    "no further Cockpit local-only preview planning PR should follow unless implementation is blocked",
  ], { textByFile });
  assertContainsAll(consumerDecisionDoc, [
    implementationDoc,
    "Cockpit was selected as the first local-only consumer implementation slice",
    "ChatGPT App/MCP remain deferred",
  ], { textByFile });
  assertContainsAll(localDevAdapterDoc, [
    implementationDoc,
    "Candidate D local-only semantics",
  ], { textByFile });
  assertContainsAll(routeDoc, [
    implementationDoc,
    "Cockpit local-only consumer now exists",
    "no App/MCP consumer exists",
  ], { textByFile });
  assertContainsAll(reviewChecklistDoc, [
    implementationDoc,
    "smoke:cockpit-local-only-constellation-route-preview",
    "browser/computer-use validation",
    "false-affordance",
  ], { textByFile });
  assertContainsAll(surfaceBoundaryDoc, [
    implementationDoc,
    "ChatGPT App/MCP remain deferred",
    "not connected by the Cockpit preview",
  ], { textByFile });
  assertContainsAll(authorityMatrixDoc, [
    implementationDoc,
    "Cockpit local-only route preview is local-only/read-only",
    "grants no App/MCP",
  ], { textByFile });
  assertContainsAll(indexDoc, [
    implementationDoc,
    browserReportFile,
    "smoke:cockpit-local-only-constellation-route-preview",
    "local-only Cockpit implementation",
    "no App/MCP",
    "no production auth",
    "no hosted auth",
    "no DB query",
    "no proof/evidence write",
    "no Codex SDK execution",
    "no graph DB",
    "no persistence",
    "no merge/publish/approval/retry/replay/deploy authority",
  ], { textByFile });
}

function assertBrowserReport() {
  assertContainsAll(browserReportFile, browserReportPhrases, { textByFile });
}

function assertNoForbiddenPositiveAuthorityGrants() {
  const scopedTexts = [
    { file: implementationDoc, text: implementationDocText },
    {
      file: cockpitPlanDoc,
      text: extractSourceBetween(
        textByFile.get(cockpitPlanDoc),
        "`docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_V0_1.md`",
        "## 2. Purpose",
      ),
    },
    {
      file: consumerDecisionDoc,
      text: extractSourceBetween(
        textByFile.get(consumerDecisionDoc),
        "`docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_V0_1.md`",
        "## 3. Current route baseline",
      ),
    },
    {
      file: localDevAdapterDoc,
      text: extractSourceBetween(
        textByFile.get(localDevAdapterDoc),
        "`docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_V0_1.md`",
        "## 2. Route and adapter summary",
      ),
    },
    {
      file: routeDoc,
      text: extractSourceBetween(
        textByFile.get(routeDoc),
        "`docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_V0_1.md`",
        "## 4. Request shape",
      ),
    },
    {
      file: surfaceBoundaryDoc,
      text: extractSourceBetween(
        textByFile.get(surfaceBoundaryDoc),
        "`docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_V0_1.md`",
        "## Authority boundaries",
      ),
    },
    {
      file: authorityMatrixDoc,
      text: extractSourceBetween(
        textByFile.get(authorityMatrixDoc),
        "`docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_V0_1.md`",
        "| Lane id |",
      ),
    },
    {
      file: indexDoc,
      text: extractSourceBetween(
        textByFile.get(indexDoc),
        "- `docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_V0_1.md`",
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
    label: "Cockpit local-only constellation route preview smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for Cockpit local-only constellation route preview smoke: ${file}`,
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
    /^app\/api\//,
    /^lib\//,
    /^types\//,
    /^db\//,
    /^migrations\//,
    /^apps\/augnes_apps\//,
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
      `Forbidden changed file for Cockpit local-only constellation route preview smoke: ${file}`,
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
    /\b(adds?|implements?|enables?|activates?|creates?|records?|writes?|calls?|runs?|executes?|publishes?|approves?|retries|replays|merges?|deploys?|persists?|connects?)\b.{0,220}\b(App\/MCP consumer|ChatGPT App component|MCP\/App tools?|MCP tool|plugin tool|route behavior change|real auth implementation|production auth|hosted auth|OAuth|session identity|workspace membership|DB queries?|DB schema|migrations?|graph DB|persistence|external calls?|OpenAI calls?|GitHub calls?|proof\/evidence writes?|proof writes?|evidence writes?|readiness writes?|proof records?|evidence records?|readiness records?|AG Resume behavior|branch creation authority|branch creation controls|PR creation authority|merge authority|publish authority|approval authority|Codex SDK execution|provider implementation|credentials|secrets|provider credentials|mutation URLs?|graph snapshots?)\b/i,
    /\b(exposes?|includes?|returns?)\b.{0,180}\b(credentials|secrets|provider credentials|mutation URLs?|hidden reasoning|chain-of-thought|raw DB rows?|proof\/evidence write handles?|approval\/publish\/merge controls?|Codex SDK execution handles?|branch\/PR creation handles?)\b/i,
    /\b(grants?|adds?|creates?|provides?|authori[sz]es?)\b.{0,180}\b(branch creation authority|PR creation authority|merge authority|publish authority|approval authority|proof\/evidence write authority|Codex SDK execution authority|deploy authority|consumer authority|route implementation authority|implementation authority|production auth authority|hosted auth authority|workspace membership authority)\b/i,
    /\b(navigator\.clipboard|@openai\/codex-sdk|api\.github\.com|api\.openai\.com|XMLHttpRequest|gh\s+(api|pr|issue|repo))\b/i,
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
