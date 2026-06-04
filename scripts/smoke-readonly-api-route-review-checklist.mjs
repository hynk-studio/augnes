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

const checklistDoc = "docs/READONLY_API_ROUTE_REVIEW_CHECKLIST_V0_1.md";
const planningDoc = "docs/READONLY_API_ROUTE_PLANNING_BOUNDARY_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-readonly-api-route-review-checklist.mjs";
const planningSmokeFile =
  "scripts/smoke-readonly-api-route-planning-boundary.mjs";
const surfaceSmokeFile =
  "scripts/smoke-chatgpt-app-mcp-readonly-surface-boundary.mjs";
const responseShapeTypeFile = "types/readonly-api-route-response.ts";
const responseShapeSmokeFile =
  "scripts/smoke-readonly-api-route-response-shape-boundary.mjs";
const implementationDesignDoc =
  "docs/READONLY_API_ROUTE_IMPLEMENTATION_DESIGN_PACKET_V0_1.md";
const implementationDesignSmokeFile =
  "scripts/smoke-readonly-api-route-implementation-design-packet.mjs";
const implementationPlanDoc =
  "docs/READONLY_API_ROUTE_IMPLEMENTATION_PLAN_V0_1.md";
const implementationPlanSmokeFile =
  "scripts/smoke-readonly-api-route-implementation-plan.mjs";
const constellationPreviewRouteDoc =
  "docs/READONLY_API_ROUTE_CONSTELLATION_PREVIEW_V0_1.md";
const constellationPreviewRouteFile =
  "app/api/augnes/read/constellation-preview/route.ts";
const constellationPreviewHelperFile =
  "lib/readonly-api/constellation-preview.ts";
const constellationPreviewSmokeFile =
  "scripts/smoke-readonly-api-route-constellation-preview.mjs";
const accessGuardDoc = "docs/READONLY_API_ROUTE_ACCESS_GUARD_V0_1.md";
const accessGuardFile = "lib/readonly-api/access-guard.ts";
const accessGuardSmokeFile =
  "scripts/smoke-readonly-api-route-access-guard.mjs";
const authScopePlanDoc =
  "docs/READONLY_API_ROUTE_AUTH_SCOPE_INTEGRATION_PLAN_V0_1.md";
const authScopePlanSmokeFile =
  "scripts/smoke-readonly-api-route-auth-scope-integration-plan.mjs";
const authSourceSelectionDoc =
  "docs/READONLY_API_ROUTE_AUTH_SOURCE_SELECTION_V0_1.md";
const authSourceSelectionSmokeFile =
  "scripts/smoke-readonly-api-route-auth-source-selection.mjs";
const adapterBoundaryDoc =
  "docs/READONLY_API_ROUTE_AUTH_SCOPE_ADAPTER_BOUNDARY_V0_1.md";
const authScopeTypeFile = "types/readonly-api-auth-scope.ts";
const adapterBoundarySmokeFile =
  "scripts/smoke-readonly-api-route-auth-scope-adapter-boundary.mjs";
const localDevAdapterPlanDoc =
  "docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_PLAN_V0_1.md";
const localDevAdapterPlanSmokeFile =
  "scripts/smoke-readonly-api-route-local-dev-auth-adapter-plan.mjs";
const localDevAdapterDoc =
  "docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_V0_1.md";
const localDevAdapterFile = "lib/readonly-api/local-dev-auth-adapter.ts";
const localDevAdapterSmokeFile =
  "scripts/smoke-readonly-api-route-local-dev-auth-adapter.mjs";
const realAuthGatePlanDoc =
  "docs/READONLY_API_ROUTE_REAL_AUTH_GATE_PLAN_V0_1.md";
const realAuthGatePlanSmokeFile =
  "scripts/smoke-readonly-api-route-real-auth-gate-plan.mjs";
const surfaceBoundaryDoc =
  "docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md";
const consumerScopeDecisionDoc =
  "docs/READONLY_API_ROUTE_LOCAL_ONLY_CONSUMER_SCOPE_DECISION_V0_1.md";
const consumerScopeDecisionSmokeFile =
  "scripts/smoke-readonly-api-route-local-only-consumer-scope-decision.mjs";
const authorityMatrixDoc = "docs/AUTHORITY_MATRIX.md";

const inspectedFiles = [
  checklistDoc,
  planningDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
];

const allowedChangedFiles = new Set([
  ...inspectedFiles,
  planningSmokeFile,
  surfaceSmokeFile,
  responseShapeTypeFile,
  responseShapeSmokeFile,
  implementationDesignDoc,
  implementationDesignSmokeFile,
  implementationPlanDoc,
  implementationPlanSmokeFile,
  constellationPreviewRouteDoc,
  constellationPreviewRouteFile,
  constellationPreviewHelperFile,
  constellationPreviewSmokeFile,
  accessGuardDoc,
  accessGuardFile,
  accessGuardSmokeFile,
  authScopePlanDoc,
  authScopePlanSmokeFile,
  authSourceSelectionDoc,
  authSourceSelectionSmokeFile,
  adapterBoundaryDoc,
  authScopeTypeFile,
  adapterBoundarySmokeFile,
  localDevAdapterPlanDoc,
  localDevAdapterPlanSmokeFile,
  localDevAdapterDoc,
  localDevAdapterFile,
  localDevAdapterSmokeFile,
  realAuthGatePlanDoc,
  realAuthGatePlanSmokeFile,
  surfaceBoundaryDoc,
  consumerScopeDecisionDoc,
  consumerScopeDecisionSmokeFile,
  authorityMatrixDoc,
]);

const requiredSections = [
  "Status and scope",
  "Purpose",
  "Checklist usage",
  "Auth and session boundary",
  "Privacy boundary",
  "Prompt-injection boundary",
  "Data provenance boundary",
  "Response minimization boundary",
  "Evidence pointer boundary",
  "Perspective Capsule boundary",
  "Project Constellation boundary",
  "Logging and telemetry boundary",
  "Browser/computer-use validation boundary",
  "Authority matrix boundary",
  "Required implementation PR evidence",
  "Validation and smoke plan",
  "Non-goals",
];

const checklistConcepts = [
  "checklist only",
  "No route is implemented",
  "future route implementation must answer each checklist item before merge",
  "who can call the route",
  "what workspace/project scope is allowed",
  "whether user/session identity is required",
  "how unauthorized access fails closed",
  "no public unauthenticated endpoint",
  "no secrets",
  "no credentials/auth/env",
  "no raw private user text unless explicitly scoped",
  "no hidden reasoning/chain-of-thought",
  "no raw DB rows",
  "minimal response payload",
  "no tool instructions from untrusted records are executed",
  "evidence/capsule text is treated as display data, not instructions",
  "route-provided text avoids granting authority",
  "source records are identified",
  "derived state is separated from committed state",
  "evidence pointers are labeled as pointers",
  "confidence/limits are visible where applicable",
  "only fields needed for the read-only surface",
  "no mutation URLs",
  "no write handles",
  "no approval/publish/merge controls",
  "pointer-only",
  "no proof/evidence/readiness record creation",
  "no acceptance or readiness marking",
  "non-authoritative",
  "no Codex launch",
  "no PR/branch creation",
  "no proof/evidence write",
  "read-only",
  "no graph DB",
  "no persistence",
  "no runtime node creation",
  "no source-of-truth",
  "route path",
  "auth/session design",
  "response schema or sample",
  "forbidden fields review",
  "browser/computer-use report if surfaced in UI",
  "tests/smokes run",
  "skipped checks with reasons",
  "authority matrix update status or skipped reason",
];

const authorityBoundaryPhrases = [
  "does not implement any API route",
  "no API route implementation",
  "no runtime behavior",
  "no UI code",
  "no ChatGPT App tool implementation",
  "no MCP tool implementation",
  "no DB schema/migrations",
  "no graph DB",
  "no persistence",
  "no auth implementation",
  "no external calls",
  "no proof/evidence writes",
  "no AG Resume behavior",
  "no Codex SDK execution/provider behavior",
  "no branch creation authority",
  "no PR creation authority by itself",
  "no merge/publish/approval/retry/replay/deploy authority",
  "does not grant authority",
];

const forbiddenPositiveAuthoritySelfTests = [
  "A future checklist may approve route deployment.",
  "A read-only checklist may expose credentials.",
  "A future route checklist is allowed to create proof records.",
  "A checklist may bypass auth review.",
  "A future route may merge without approval.",
  "A checklist may bypass auth review without security signoff.",
  "A read-only route may expose credentials without review.",
  "A future API route may create proof records without evidence gate approval.",
  "A planning checklist may deploy without authority matrix update.",
];

const allowedBoundarySelfTests = [
  "This checklist does not implement API routes.",
  "Future implementation requires auth/security review.",
  "Read-only route checklist does not write Augnes state.",
  "Checklist-only planning requires separate route implementation PR.",
  "No route may merge without separate approval.",
  "No API route may expose credentials.",
];

const textByFile = loadTextByFile(inspectedFiles);
const checklistDocText = textByFile.get(checklistDoc);

assertPackageJsonScript();
assertSmokeScriptBoundary();
assertRequiredSections();
assertAuthorityClassifierSelfTests();
assertRequiredContent();
assertPlanningDocPointer();
assertIndexPointer();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "readonly-api-route-review-checklist",
      pass: true,
      boundary_smoke_mode: changedFilesBoundary.mode,
      docs_checked: [checklistDoc, planningDoc, indexDoc],
      package_script_checked: true,
      required_sections_checked: requiredSections.length,
      checklist_concepts_checked: checklistConcepts.length,
      authority_boundary_phrases_checked: authorityBoundaryPhrases.length,
      forbidden_positive_authority_self_tests_checked:
        forbiddenPositiveAuthoritySelfTests.length,
      allowed_boundary_self_tests_checked: allowedBoundarySelfTests.length,
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
      smoke_type: "static-docs-package-pointer-api-route-review-checklist-only",
      api_route_implemented: false,
      runtime_behavior_changed: false,
      ui_behavior_changed: false,
      db_schema_migration_changed: false,
      mcp_app_tool_changes_added: false,
      proof_evidence_writes_added: false,
      ag_resume_behavior_added: false,
      codex_sdk_execution_added: false,
      auth_implementation_added: false,
      external_calls_added: false,
      branch_pr_creation_authority_added: false,
      merge_publish_authority_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:readonly-api-route-review-checklist");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:readonly-api-route-review-checklist",
    expectedCommand: "node scripts/smoke-readonly-api-route-review-checklist.mjs",
  });
}

function assertSmokeScriptBoundary() {
  const script = textByFile.get(smokeFile);
  assertNoRuntimeImports({
    file: smokeFile,
    text: script,
    forbiddenImports: [
      "app/",
      "components/",
      "db/",
      "migrations/",
      "apps/augnes_apps/",
      "reports/",
      "screenshots/",
      "@openai/codex-sdk",
      "openai",
      "zod",
      "io-ts",
      "runtypes",
      "superstruct",
      "valibot",
    ],
  });
}

function assertRequiredSections() {
  for (const section of requiredSections) {
    const headingPattern = new RegExp(`^##\\s+${escapeRegExp(section)}\\s*$`, "m");
    assert(
      headingPattern.test(checklistDocText),
      `${checklistDoc} must contain section: ${section}`,
    );
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

function assertRequiredContent() {
  assertContainsAll(checklistDoc, [
    ...checklistConcepts,
    ...authorityBoundaryPhrases,
    "auth/security/privacy/prompt-injection/provenance",
    "future read-only API route implementation PRs must satisfy",
    "fail-closed auth/session handling",
    "route response must not expose secrets",
    "Prompt-injection review",
    "Data provenance",
    "Response minimization",
    "Evidence pointers are pointer-only",
    "Perspective Capsule / Handoff Capsule material remains conceptual",
    "Project Constellation material remains read-only",
    "Logging and telemetry",
    "Browser/computer-use validation",
    "Authority matrix",
    "npm run smoke:readonly-api-route-review-checklist",
    "AUGNES_BOUNDARY_SMOKE_MODE=content-only",
  ], { textByFile });
  assertNoForbiddenPositiveClauses(checklistDoc, checklistDocText);
}

function assertPlanningDocPointer() {
  assertContainsAll(planningDoc, [
    checklistDoc,
    "checklist is required before future route implementation",
    "No API route is implemented by the checklist or this planning boundary",
    "smoke:readonly-api-route-review-checklist",
  ], { textByFile });
  assertNoForbiddenPositiveClauses(planningDoc, textByFile.get(planningDoc));
}

function assertIndexPointer() {
  assertContainsAll(indexDoc, [
    checklistDoc,
    "read-only API route review checklist",
    "smoke:readonly-api-route-review-checklist",
    "docs/smoke/package-pointer only",
    "no API route",
    "no auth implementation",
    "no runtime behavior",
    "no UI",
    "no DB",
    "no MCP/App tool",
    "no proof/evidence write",
    "no Codex SDK execution",
  ], { textByFile });
  assertNoForbiddenPositiveClauses(indexDoc, textByFile.get(indexDoc));
}

function assertChangedFilesBoundary() {
  const result = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "read-only API route review checklist smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for read-only API route review checklist smoke: ${file}`,
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
    /^components\//,
    /^app\//,
    /^db\//,
    /^migrations\//,
    /^apps\/augnes_apps\//,
    /^reports\/browser\//,
    /^screenshots\//,
    /(^|\/)(route|api)\.(js|jsx|ts|tsx)$/,
    /^plugins\/augnes-operator\/hooks\//,
    /^plugins\/augnes-operator\/(?:\.mcp\.json|mcp|mcpServers|apps|app-mappings|app_mappings)(\/|$)/,
    /(^|\/)(secret|secrets|env)(\/|$)/i,
    /(^|\/)\.env/i,
    /(^|\/)(ag-work-resume|ag_resume|ag-resume)(\/|$)/i,
    /(^|\/)(proof|evidence).*(writer|record|route|helper)/i,
    /(^|\/)(sidecar-runtime|sidecar_et_runtime|sidecar-et-runtime|runtime-sidecar)(\/|$)/i,
    /(^|\/)(codex-sdk|codex_sdk|provider|providers)(\/|$)/i,
    /(^|\/)(project-constellation).*(runtime|provider|engine|route|api|db|persistence)/i,
  ];

  for (const file of files) {
    if (file === constellationPreviewRouteFile) continue;
    if (file === localDevAdapterFile) continue;
    assert(
      !forbiddenPatterns.some((pattern) => pattern.test(file)),
      `Forbidden changed file for read-only API route review checklist smoke: ${file}`,
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
    /\b(checklist|read-only checklist|route checklist|API route|GET route|read-only route|route|endpoint|Augnes|Codex|PR)\b.{0,120}\b(can|may|is allowed to|is permitted to|has authority to|is authorized to|authorizes?)\b.{0,180}\b(approve route deployment|bypass auth review|create proof|create evidence|create readiness|execute Codex|expose credentials|write Augnes state|create branches?|open PRs?|create PRs?|approve merges?|approve|publish|merge|retry|replay|deploy|call GitHub|call OpenAI|call Augnes runtime|call MCP\/App tools?)\b/i,
    /\b(adds?|implements?|enables?|activates?|creates?|records?|writes?|calls?|runs?|executes?|publishes?|approves?|retries|replays|merges?|deploys?|exposes?|bypasses?)\b.{0,180}\b(runtime behavior|UI code|API routes?|route files?|DB schema|migrations?|graph DB|persistence|MCP\/App tools?|ChatGPT App tools?|MCP tools?|auth implementation|external calls?|proof\/evidence writes?|proof writes?|evidence writes?|proof records?|evidence records?|readiness records?|AG Resume behavior|branch creation authority|PR creation authority|merge authority|publish authority|approval authority|Codex SDK execution|provider implementation|credentials|secrets|provider credentials|Project Constellation runtime behavior|auth review)\b/i,
    /\b(grants?|adds?|creates?|provides?|authori[sz]es?)\b.{0,120}\b(branch creation authority|PR creation authority|merge authority|publish authority|approval authority|proof\/evidence write authority|Codex SDK execution authority|deploy authority)\b/i,
    /\b(navigator\.clipboard|@openai\/codex-sdk|api\.github\.com|api\.openai\.com|fetch\s*\(|XMLHttpRequest|gh\s+(api|pr|issue|repo))\b/i,
  ];

  if (!forbiddenPatterns.some((pattern) => pattern.test(clause))) return false;
  return !isNegatedBoundary(clause);
}

function isNegatedBoundary(clause) {
  return /\b(not|no|does not|do not|must not|never|is not|are not|cannot|can't|by itself|absent|excluded|excludes?)\b|않|아니다|만들지 않는다/i.test(
    clause,
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
