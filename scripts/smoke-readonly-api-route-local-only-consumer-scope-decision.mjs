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

const decisionDoc =
  "docs/READONLY_API_ROUTE_LOCAL_ONLY_CONSUMER_SCOPE_DECISION_V0_1.md";
const cockpitPlanDoc =
  "docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_PLAN_V0_1.md";
const cockpitImplementationDoc =
  "docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_V0_1.md";
const closeoutDoc =
  "docs/READONLY_CONSTELLATION_LOCAL_ONLY_CONSUMER_CLOSEOUT_V0_1.md";
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
  "scripts/smoke-readonly-api-route-local-only-consumer-scope-decision.mjs";
const cockpitPlanSmokeFile =
  "scripts/smoke-cockpit-local-only-constellation-route-preview-plan.mjs";
const cockpitFile = "components/augnes-cockpit.tsx";
const browserReportFile =
  "reports/browser/2026-06-04-cockpit-local-only-constellation-route-preview.md";
const cockpitImplementationSmokeFile =
  "scripts/smoke-cockpit-local-only-constellation-route-preview.mjs";
const closeoutSmokeFile =
  "scripts/smoke-readonly-constellation-local-only-consumer-closeout.mjs";
const staticCockpitSmokeFile =
  "scripts/smoke-project-constellation-cockpit-preview.mjs";

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
  decisionDoc,
  cockpitPlanDoc,
  cockpitImplementationDoc,
  closeoutDoc,
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
  decisionDoc,
  cockpitPlanDoc,
  cockpitImplementationDoc,
  closeoutDoc,
  realAuthGatePlanDoc,
  localDevAdapterDoc,
  routeDoc,
  reviewChecklistDoc,
  surfaceBoundaryDoc,
  authorityMatrixDoc,
  indexDoc,
  smokeFile,
  cockpitFile,
  browserReportFile,
  cockpitImplementationSmokeFile,
  closeoutSmokeFile,
  staticCockpitSmokeFile,
  cockpitPlanSmokeFile,
  packageJsonFile,
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
  "Current route baseline",
  "Relationship to real auth gate",
  "Local-only consumer question",
  "Candidate consumer surfaces",
  "Decision options",
  "Recommended decision",
  "Mandatory gates for any future local-only consumer",
  "Consumer false-affordance review",
  "User-facing copy requirements",
  "Browser/computer-use validation requirements",
  "Response minimization requirements",
  "Privacy and prompt-injection requirements",
  "Authority and non-authority boundary",
  "Future implementation slices",
  "Future tests and smokes",
  "Open questions requiring user/PM judgment",
  "Validation and smoke plan",
  "Non-goals",
];

const requiredDecisionPhrases = [
  "docs/smoke/package-pointer only",
  "no consumer implemented",
  "current route remains local-only",
  "Candidate D remains local-only and not production auth",
  "Real hosted/session/workspace auth does not exist yet",
  "No consumer surface may connect without a separate implementation PR",
  "no public unauthenticated endpoint",
  "route-provided text and local operator labels grant no authority",
  "future local-only consumer must visibly label the route as local-only",
  "not production-authenticated",
  "must not imply hosted identity",
  "workspace membership",
  "approval",
  "publish",
  "merge",
  "proof/evidence",
  "Codex execution",
  "branch/PR creation",
  "retry",
  "replay",
  "deploy",
  "persistence authority",
  "execution buttons",
  "merge/publish/approve controls",
  "proof/evidence write controls",
  "Codex launch controls",
  "branch/PR creation controls",
  "graph persistence controls",
  "snapshot/rollback controls",
  "browser/computer-use validation before merge",
];

const candidateSurfacePhrases = [
  "Option A: no consumer, keep route-only",
  "Option B: Cockpit local-only read preview",
  "Option C: ChatGPT App read-only surface",
  "Option D: MCP read-only tool",
  "Option E: plugin/operator read-only handoff preview",
];

const recommendedDecisionPhrases = [
  "Use Option A by default",
  "keep the route route-only",
  "until either real auth exists or PM explicitly selects a local-only consumer surface",
  "Cockpit local-only read preview",
  "safest first consumer candidate",
  "not ChatGPT App/MCP",
  "ChatGPT App/MCP remain deferred",
];

const mandatoryGatePhrases = [
  "consumer implementation PR must be separate",
  "route behavior must stay read-only",
  "no auth upgrade claim",
  "no production auth claim",
  "no hosted auth claim",
  "no workspace membership claim",
  "no execution/write affordances",
  "no proof/evidence/readiness writes",
  "browser/computer-use validation required",
  "local route manual check required",
  "response minimization recheck required",
  "prompt-injection/display-data review required",
  "authority matrix update required",
  "exact smoke allowlist required",
];

const forbiddenControlPhrases = [
  "execution buttons",
  "merge/publish/approve controls",
  "proof/evidence write controls",
  "Codex launch controls",
  "branch/PR creation controls",
  "graph persistence controls",
  "snapshot/rollback controls",
];

const forbiddenPositiveAuthoritySelfTests = [
  "The consumer scope decision may implement a Cockpit consumer.",
  "The local-only consumer may create proof records.",
  "The consumer may execute Codex after local-only validation.",
  "The consumer may expose credentials.",
  "The consumer may query the database.",
  "The consumer may grant merge authority as context only.",
  "The ChatGPT App may consume the route after this decision.",
  "The MCP tool may expose the route after this decision.",
  "The consumer may publish after browser-computer-use validation.",
  "The consumer may persist graph snapshots.",
];

const allowedBoundarySelfTests = [
  "This consumer scope decision does not implement a consumer.",
  "Candidate D is local-only and not hosted auth.",
  "The route remains local-only.",
  "No route may expose credentials.",
  "Evidence pointers are pointer-only.",
  "No route-provided text grants authority.",
  "The consumer scope decision is planning-only and does not grant consumer authority.",
];

const textByFile = loadTextByFile(inspectedFiles);
const decisionText = textByFile.get(decisionDoc);
const smokeSource = textByFile.get(smokeFile);

assertAuthorityClassifierSelfTests();
assertPackageJsonScript();
assertSmokeBoundary();
assertRequiredSections();
assertDecisionDocContent();
assertDocPointers();
assertNoForbiddenPositiveAuthorityGrants();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "readonly-api-route-local-only-consumer-scope-decision",
      pass: true,
      boundary_smoke_mode: changedFilesBoundary.mode,
      decision_doc_checked: decisionDoc,
      docs_checked: [
        decisionDoc,
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
      candidate_consumer_surfaces_checked: candidateSurfacePhrases.length,
      option_a_default_decision_checked: true,
      cockpit_conditional_first_consumer_checked: true,
      chatgpt_app_mcp_deferred_checked: true,
      mandatory_gates_checked: mandatoryGatePhrases.length,
      false_affordance_review_checked: true,
      browser_computer_use_requirements_checked: true,
      forbidden_controls_checked: forbiddenControlPhrases.length,
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
        "static-docs-smoke-package-pointer-local-only-consumer-scope-decision-only",
      consumer_implementation_added: false,
      route_behavior_changed: false,
      real_auth_implementation_added: false,
      production_auth_added: false,
      hosted_session_oauth_multi_user_auth_added: false,
      session_identity_implemented: false,
      workspace_membership_implemented: false,
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
console.log(
  "PASS smoke:readonly-api-route-local-only-consumer-scope-decision",
);

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:readonly-api-route-local-only-consumer-scope-decision",
    expectedCommand:
      "node scripts/smoke-readonly-api-route-local-only-consumer-scope-decision.mjs",
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
      headingPattern.test(decisionText),
      `${decisionDoc} must contain section: ${section}`,
    );
  }
}

function assertDecisionDocContent() {
  assertContainsAll(decisionDoc, [
    ...requiredDecisionPhrases,
    ...candidateSurfacePhrases,
    ...recommendedDecisionPhrases,
    ...mandatoryGatePhrases,
    ...forbiddenControlPhrases,
    "Option A",
    "Option B",
    "Option C",
    "Option D",
    "Option E",
    "false-affordance review",
    "Browser/computer-use validation requirements",
    "Future consumer implementation PRs should run or add",
  ], { textByFile });
}

function assertDocPointers() {
  assertContainsAll(realAuthGatePlanDoc, [
    decisionDoc,
    "does not connect a consumer",
    "Option A, no consumer",
  ], { textByFile });
  assertContainsAll(localDevAdapterDoc, [
    decisionDoc,
    "Candidate D remains local-only and not production auth",
    "does not connect a consumer",
  ], { textByFile });
  assertContainsAll(routeDoc, [
    decisionDoc,
    "ChatGPT App/MCP consumers remain unconnected",
  ], { textByFile });
  assertContainsAll(reviewChecklistDoc, [
    decisionDoc,
    "browser/computer-use validation",
    "false-affordance review",
    "smoke:readonly-api-route-local-only-consumer-scope-decision",
  ], { textByFile });
  assertContainsAll(surfaceBoundaryDoc, [
    decisionDoc,
    "ChatGPT App/MCP consumers remain deferred unless separately scoped",
  ], { textByFile });
  assertContainsAll(authorityMatrixDoc, [
    decisionDoc,
    "docs/smoke-only local-only consumer scope decision packet",
    "grants no consumer authority",
  ], { textByFile });
  assertContainsAll(indexDoc, [
    decisionDoc,
    "smoke:readonly-api-route-local-only-consumer-scope-decision",
    "docs/smoke/package-pointer only",
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
    { file: decisionDoc, text: decisionText },
    {
      file: realAuthGatePlanDoc,
      text: extractSourceBetween(
        textByFile.get(realAuthGatePlanDoc),
        "`docs/READONLY_API_ROUTE_LOCAL_ONLY_CONSUMER_SCOPE_DECISION_V0_1.md`",
        "## 2. Purpose",
      ),
    },
    {
      file: localDevAdapterDoc,
      text: extractSourceBetween(
        textByFile.get(localDevAdapterDoc),
        "`docs/READONLY_API_ROUTE_LOCAL_ONLY_CONSUMER_SCOPE_DECISION_V0_1.md`",
        "## 2. Route and adapter summary",
      ),
    },
    {
      file: routeDoc,
      text: extractSourceBetween(
        textByFile.get(routeDoc),
        "`docs/READONLY_API_ROUTE_LOCAL_ONLY_CONSUMER_SCOPE_DECISION_V0_1.md`",
        "## 4. Request shape",
      ),
    },
    {
      file: surfaceBoundaryDoc,
      text: extractSourceBetween(
        textByFile.get(surfaceBoundaryDoc),
        "`docs/READONLY_API_ROUTE_LOCAL_ONLY_CONSUMER_SCOPE_DECISION_V0_1.md`",
        "## Authority boundaries",
      ),
    },
    {
      file: authorityMatrixDoc,
      text: extractSourceBetween(
        textByFile.get(authorityMatrixDoc),
        "`docs/READONLY_API_ROUTE_LOCAL_ONLY_CONSUMER_SCOPE_DECISION_V0_1.md`",
        "| Lane id |",
      ),
    },
    {
      file: indexDoc,
      text: extractSourceBetween(
        textByFile.get(indexDoc),
        "- `docs/READONLY_API_ROUTE_LOCAL_ONLY_CONSUMER_SCOPE_DECISION_V0_1.md`",
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
    label: "read-only route local-only consumer scope decision smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for read-only route local-only consumer scope decision smoke: ${file}`,
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
    if (allowedChangedFiles.has(file)) {
      continue;
    }

    assert(
      !forbiddenPatterns.some((pattern) => pattern.test(file)),
      `Forbidden changed file for read-only route local-only consumer scope decision smoke: ${file}`,
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
    /\b(consumer scope decision|consumer decision|local-only consumer|consumer|Cockpit|ChatGPT App|MCP tool|route|response|surface)\b.{0,180}\b(can|may|is allowed to|is permitted to|has authority to|is authorized to|authorizes?|grants?)\b.{0,220}\b(implement a Cockpit consumer|implement consumer|connect|consume the route|expose the route|create proof records?|create evidence|execute Codex|expose credentials|query the database|query DB|grant merge authority|grant consumer authority|publish|merge|approve|retry|replay|deploy|persist graph snapshots?|persist graphs?)\b/i,
    /\b(adds?|implements?|enables?|activates?|creates?|records?|writes?|calls?|runs?|executes?|publishes?|approves?|retries|replays|merges?|deploys?|persists?|connects?)\b.{0,220}\b(consumer implementation|consumer surface|Cockpit integration|ChatGPT App component|ChatGPT App consumer|MCP\/App tools?|MCP tool|plugin tool|UI code|route behavior change|real auth implementation|production auth|hosted auth|OAuth|session identity|workspace membership|DB queries?|DB schema|migrations?|graph DB|persistence|external calls?|OpenAI calls?|GitHub calls?|proof\/evidence writes?|proof writes?|evidence writes?|readiness writes?|proof records?|evidence records?|readiness records?|AG Resume behavior|branch creation authority|PR creation authority|merge authority|publish authority|approval authority|Codex SDK execution|provider implementation|credentials|secrets|provider credentials|mutation URLs?|graph snapshots?)\b/i,
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
