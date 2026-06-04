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

const closeoutDoc =
  "docs/READONLY_CONSTELLATION_LOCAL_ONLY_CONSUMER_CLOSEOUT_V0_1.md";
const cockpitImplementationDoc =
  "docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_V0_1.md";
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
  "scripts/smoke-readonly-constellation-local-only-consumer-closeout.mjs";

const cockpitImplementationSmokeFile =
  "scripts/smoke-cockpit-local-only-constellation-route-preview.mjs";
const cockpitPlanSmokeFile =
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
const staticCockpitSmokeFile =
  "scripts/smoke-project-constellation-cockpit-preview.mjs";
const accessGuardSmokeFile =
  "scripts/smoke-readonly-api-route-access-guard.mjs";
const usefulnessPlanFile =
  "docs/PERSPECTIVE_HANDOFF_USEFULNESS_EXPERIMENT_PLAN_V0_1.md";
const usefulnessPlanSmokeFile =
  "scripts/smoke-perspective-handoff-usefulness-experiment-plan.mjs";
const capsuleHandoffSkillFile =
  "plugins/augnes-operator/skills/augnes-capsule-handoff/SKILL.md";
const capsuleHandoffSkillSmokeFile =
  "scripts/smoke-augnes-capsule-handoff-skill.mjs";
const capsuleDogfoodSmokeFile =
  "scripts/smoke-capsule-handoff-skill-dogfood-report.mjs";
const userIntentSmokeFile =
  "scripts/smoke-project-constellation-user-intent-validation.mjs";

const inspectedFiles = [
  closeoutDoc,
  cockpitImplementationDoc,
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
  closeoutDoc,
  cockpitImplementationDoc,
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
  cockpitImplementationSmokeFile,
  cockpitPlanSmokeFile,
  consumerDecisionSmokeFile,
  realAuthGatePlanSmokeFile,
  localDevAdapterSmokeFile,
  routeSmokeFile,
  reviewChecklistSmokeFile,
  surfaceSmokeFile,
  staticCockpitSmokeFile,
  accessGuardSmokeFile,
  usefulnessPlanFile,
  usefulnessPlanSmokeFile,
  capsuleHandoffSkillFile,
  capsuleHandoffSkillSmokeFile,
  capsuleDogfoodSmokeFile,
  userIntentSmokeFile,
]);

const requiredSections = [
  "Status and scope",
  "Purpose",
  "Milestone thesis",
  "Completed PR chain",
  "Completed route/local guard/local adapter state",
  "Completed Cockpit local-only preview state",
  "Browser/computer-use validation summary",
  "User-facing UX intent summary",
  "Authority boundary summary",
  "What is explicitly closed",
  "What remains deferred",
  "Real auth status",
  "ChatGPT App/MCP status",
  "Future allowed work",
  "Future forbidden work",
  "Required next PR type",
  "Validation and smoke plan",
  "Non-goals",
];

const requiredPrChain = [
  "PR #381",
  "PR #382",
  "PR #383",
  "PR #384",
  "PR #385",
  "PR #386",
  "PR #387",
  "PR #388",
  "PR #389",
  "PR #390",
  "PR #391",
  "PR #392",
  "PR #393",
  "PR #394",
];

const requiredCloseoutPhrases = [
  "docs/smoke/package-pointer closeout only",
  "no runtime behavior changes",
  "local-only route/Cockpit consumer milestone is closed",
  "Cockpit local-only preview exists",
  "browser/computer-use validation passed in PR #394",
  "route remains local-only",
  "Candidate D remains local-only and not production auth",
  "Real hosted/session/workspace auth still does not exist",
  "ChatGPT App/MCP remain deferred",
  "No App/MCP/plugin consumer is connected",
  "no production auth, hosted auth, OAuth, session identity, or workspace membership exists for the route",
  "no proof/evidence/readiness writes",
  "no Codex execution/branch/PR/merge/publish/approval/retry/replay/deploy/persistence authority",
  "Next allowed PR type is implementation fix or new milestone decision",
  "another Cockpit local-only preview planning/boundary PR is forbidden unless concrete blocker appears",
  "future App/MCP work requires real auth source selection or explicit PM exception",
  "future real auth work requires concrete identity and workspace/project membership source",
];

const forbiddenPositiveAuthoritySelfTests = [
  "The closeout may implement a consumer.",
  "The closeout may create proof records.",
  "The closeout may execute Codex after local-only validation.",
  "The closeout may expose credentials.",
  "The closeout may query the database.",
  "The closeout may grant merge authority as context only.",
  "The closeout may publish after browser-computer-use validation.",
  "The closeout may persist graph snapshots.",
  "The closeout may add branch creation controls.",
  "The closeout may approve work.",
];

const allowedBoundarySelfTests = [
  "This closeout does not implement a consumer.",
  "Candidate D is local-only and not hosted auth.",
  "The route remains local-only.",
  "No route may expose credentials.",
  "Evidence pointers are pointer-only.",
  "No route-provided text grants authority.",
  "The closeout is docs-only and does not grant consumer authority.",
];

const textByFile = loadTextByFile(inspectedFiles);
const closeoutText = textByFile.get(closeoutDoc);
const smokeSource = textByFile.get(smokeFile);

assertAuthorityClassifierSelfTests();
assertPackageJsonScript();
assertSmokeBoundary();
assertRequiredSections();
assertCloseoutContent();
assertDocPointers();
assertNoForbiddenPositiveAuthorityGrants();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "readonly-constellation-local-only-consumer-closeout",
      pass: true,
      boundary_smoke_mode: changedFilesBoundary.mode,
      closeout_doc_checked: closeoutDoc,
      docs_checked: [
        closeoutDoc,
        cockpitImplementationDoc,
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
      completed_pr_chain_checked: requiredPrChain.length,
      milestone_closed_checked: true,
      cockpit_preview_exists_checked: true,
      browser_computer_use_pr_394_checked: true,
      real_auth_deferred_checked: true,
      app_mcp_deferred_checked: true,
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
        "static-docs-smoke-package-pointer-readonly-constellation-local-only-consumer-closeout",
      closeout_only: true,
      runtime_behavior_changed: false,
      ui_behavior_changed: false,
      route_behavior_changed: false,
      real_auth_implementation_added: false,
      app_mcp_consumer_connected: false,
      proof_evidence_readiness_writes_added: false,
      codex_execution_added: false,
      graph_db_added: false,
      persistence_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:readonly-constellation-local-only-consumer-closeout");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:readonly-constellation-local-only-consumer-closeout",
    expectedCommand:
      "node scripts/smoke-readonly-constellation-local-only-consumer-closeout.mjs",
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
      headingPattern.test(closeoutText),
      `${closeoutDoc} must contain section: ${section}`,
    );
  }
}

function assertCloseoutContent() {
  assertContainsAll(closeoutDoc, [
    ...requiredPrChain,
    ...requiredCloseoutPhrases,
    "reports/browser/2026-06-04-cockpit-local-only-constellation-route-preview.md",
    "PR #394: Cockpit local-only preview implementation and browser validation",
    "no App/MCP tool implementation",
    "no ChatGPT App component",
    "no plugin tool implementation",
    "no public unauthenticated endpoint",
    "route-provided text and local operator labels grant no authority",
    "local route manual check may be skipped because this PR does not change route behavior",
  ], { textByFile });
}

function assertDocPointers() {
  const pointerChecks = [
    [cockpitImplementationDoc, [
      closeoutDoc,
      "closed local-only milestone",
    ]],
    [cockpitPlanDoc, [
      closeoutDoc,
      "no more planning PRs for this same preview should follow",
    ]],
    [consumerDecisionDoc, [
      closeoutDoc,
      "Cockpit local-only preview was implemented and validated",
      "ChatGPT App/MCP remain deferred",
    ]],
    [realAuthGatePlanDoc, [
      closeoutDoc,
      "real auth still blocked until source evidence exists",
    ]],
    [localDevAdapterDoc, [
      closeoutDoc,
      "Candidate D remains local-only and not production auth",
    ]],
    [routeDoc, [
      closeoutDoc,
      "route local-only status",
    ]],
    [reviewChecklistDoc, [
      closeoutDoc,
      "local-only consumer milestone is closed",
      "future consumer/auth work needs new scope",
    ]],
    [surfaceBoundaryDoc, [
      closeoutDoc,
      "ChatGPT App/MCP remain deferred after local Cockpit closeout",
    ]],
  ];

  for (const [file, phrases] of pointerChecks) {
    assertContainsAll(file, phrases, { textByFile });
  }

  assertContainsAll(authorityMatrixDoc, [
    closeoutDoc,
    "closeout adds no authority",
    "marks the local-only milestone closed",
  ], { textByFile });

  assertContainsAll(indexDoc, [
    closeoutDoc,
    "smoke:readonly-constellation-local-only-consumer-closeout",
    "closeout-only",
    "no route/UI/auth/DB/App/MCP/proof/Codex/graph/persistence behavior changes",
  ], { textByFile });
}

function assertNoForbiddenPositiveAuthorityGrants() {
  const scopedTexts = [
    { file: closeoutDoc, text: closeoutText },
    {
      file: cockpitImplementationDoc,
      text: extractSourceBetween(
        textByFile.get(cockpitImplementationDoc),
        "`docs/READONLY_CONSTELLATION_LOCAL_ONLY_CONSUMER_CLOSEOUT_V0_1.md`",
        "## 2. Route preview summary",
      ),
    },
    {
      file: cockpitPlanDoc,
      text: extractSourceBetween(
        textByFile.get(cockpitPlanDoc),
        "`docs/READONLY_CONSTELLATION_LOCAL_ONLY_CONSUMER_CLOSEOUT_V0_1.md`",
        "## 2. Purpose",
      ),
    },
    {
      file: consumerDecisionDoc,
      text: extractSourceBetween(
        textByFile.get(consumerDecisionDoc),
        "`docs/READONLY_CONSTELLATION_LOCAL_ONLY_CONSUMER_CLOSEOUT_V0_1.md`",
        "## 3. Current route baseline",
      ),
    },
    {
      file: realAuthGatePlanDoc,
      text: extractSourceBetween(
        textByFile.get(realAuthGatePlanDoc),
        "`docs/READONLY_CONSTELLATION_LOCAL_ONLY_CONSUMER_CLOSEOUT_V0_1.md`",
        "## 2. Purpose",
      ),
    },
    {
      file: localDevAdapterDoc,
      text: extractSourceBetween(
        textByFile.get(localDevAdapterDoc),
        "`docs/READONLY_CONSTELLATION_LOCAL_ONLY_CONSUMER_CLOSEOUT_V0_1.md`",
        "## 2. Route and adapter summary",
      ),
    },
    {
      file: routeDoc,
      text: extractSourceBetween(
        textByFile.get(routeDoc),
        "`docs/READONLY_CONSTELLATION_LOCAL_ONLY_CONSUMER_CLOSEOUT_V0_1.md`",
        "## 4. Request shape",
      ),
    },
    {
      file: reviewChecklistDoc,
      text: extractSourceBetween(
        textByFile.get(reviewChecklistDoc),
        "`docs/READONLY_CONSTELLATION_LOCAL_ONLY_CONSUMER_CLOSEOUT_V0_1.md`",
        "## Validation and smoke plan",
      ),
    },
    {
      file: surfaceBoundaryDoc,
      text: extractSourceBetween(
        textByFile.get(surfaceBoundaryDoc),
        "`docs/READONLY_CONSTELLATION_LOCAL_ONLY_CONSUMER_CLOSEOUT_V0_1.md`",
        "## Authority boundaries",
      ),
    },
    {
      file: authorityMatrixDoc,
      text: extractSourceBetween(
        textByFile.get(authorityMatrixDoc),
        "`docs/READONLY_CONSTELLATION_LOCAL_ONLY_CONSUMER_CLOSEOUT_V0_1.md`",
        "| Lane id |",
      ),
    },
    {
      file: indexDoc,
      text: extractSourceBetween(
        textByFile.get(indexDoc),
        "- `docs/READONLY_CONSTELLATION_LOCAL_ONLY_CONSUMER_CLOSEOUT_V0_1.md`",
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
    label: "read-only constellation local-only consumer closeout smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for read-only constellation local-only consumer closeout smoke: ${file}`,
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
      `Forbidden changed file for read-only constellation local-only consumer closeout smoke: ${file}`,
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
    /\b(closeout|consumer|Cockpit local-only preview|Cockpit preview|route|surface)\b.{0,180}\b(can|may|is allowed to|is permitted to|has authority to|is authorized to|authorizes?|grants?)\b.{0,220}\b(implement a consumer|implement consumer|create proof records?|create evidence|execute Codex|expose credentials|query the database|query DB|grant merge authority|publish|merge|approve work|approve|add branch creation controls|persist graph snapshots?|persist graphs?)\b/i,
    /\b(adds?|implements?|enables?|activates?|creates?|records?|writes?|calls?|runs?|executes?|publishes?|approves?|retries|replays|merges?|deploys?|persists?|connects?)\b.{0,220}\b(consumer implementation|consumer surface changes?|App\/MCP consumer|ChatGPT App component|MCP\/App tools?|MCP tool|plugin tool|route behavior change|real auth implementation|production auth|hosted auth|OAuth|session identity|workspace membership|DB queries?|DB schema|migrations?|graph DB|persistence|external calls?|OpenAI calls?|GitHub calls?|proof\/evidence writes?|proof writes?|evidence writes?|readiness writes?|proof records?|evidence records?|readiness records?|AG Resume behavior|branch creation authority|branch creation controls|PR creation authority|merge authority|publish authority|approval authority|Codex SDK execution|provider implementation|credentials|secrets|provider credentials|mutation URLs?|graph snapshots?)\b/i,
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
