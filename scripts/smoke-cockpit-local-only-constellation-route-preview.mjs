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
const closeoutDoc =
  "docs/READONLY_CONSTELLATION_LOCAL_ONLY_CONSUMER_CLOSEOUT_V0_1.md";
const consumerDecisionDoc =
  "docs/READONLY_API_ROUTE_LOCAL_ONLY_CONSUMER_SCOPE_DECISION_V0_1.md";
const localDevAdapterDoc =
  "docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_V0_1.md";
const realAuthGatePlanDoc =
  "docs/READONLY_API_ROUTE_REAL_AUTH_GATE_PLAN_V0_1.md";
const routeDoc = "docs/READONLY_API_ROUTE_CONSTELLATION_PREVIEW_V0_1.md";
const reviewChecklistDoc =
  "docs/READONLY_API_ROUTE_REVIEW_CHECKLIST_V0_1.md";
const surfaceBoundaryDoc =
  "docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md";
const implementationPlanDoc =
  "docs/READONLY_API_ROUTE_IMPLEMENTATION_PLAN_V0_1.md";
const implementationDesignDoc =
  "docs/READONLY_API_ROUTE_IMPLEMENTATION_DESIGN_PACKET_V0_1.md";
const authorityMatrixDoc = "docs/AUTHORITY_MATRIX.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const routeFile = "app/api/augnes/read/constellation-preview/route.ts";
const routeHelperFile = "lib/readonly-api/constellation-preview.ts";
const localDevAdapterFile = "lib/readonly-api/local-dev-auth-adapter.ts";
const responseShapeTypeFile = "types/readonly-api-route-response.ts";
const globalsCssFile = "app/globals.css";
const perspectiveIngestTypeFile =
  "types/perspective-ingest-constellation-preview.ts";
const perspectiveIngestChatGptFixtureFile =
  "fixtures/perspective-ingest/chatgpt-record-to-constellation.sample.v0.1.json";
const perspectiveIngestCodexFixtureFile =
  "fixtures/perspective-ingest/codex-record-to-constellation.sample.v0.1.json";
const perspectiveIngestSessionEpisodeFile =
  "lib/perspective-ingest/session-episode.ts";
const perspectiveIngestChatGptAdapterFile =
  "lib/perspective-ingest/chatgpt-record-adapter.ts";
const perspectiveIngestCodexAdapterFile =
  "lib/perspective-ingest/codex-record-adapter.ts";
const perspectiveIngestPacketBuilderFile =
  "lib/perspective-ingest/episode-to-constellation-packet.ts";
const perspectiveIngestRouteHelperFile =
  "lib/readonly-api/perspective-ingest-constellation-preview.ts";
const perspectiveIngestRouteFile =
  "app/api/augnes/read/perspective-ingest-constellation-preview/route.ts";
const perspectiveIngestDoc =
  "docs/PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_V0_1.md";
const perspectiveIngestSmokeFile =
  "scripts/smoke-perspective-ingest-constellation-preview.mjs";
const perspectiveIngestLocalPostGuardFile =
  "lib/readonly-api/local-preview-post-guard.ts";
const perspectiveIngestLocalValidationFile =
  "lib/perspective-ingest/manual-pasted-text-validation.ts";
const perspectiveIngestLocalAdapterFile =
  "lib/perspective-ingest/manual-pasted-text-adapter.ts";
const perspectiveIngestLocalRouteHelperFile =
  "lib/readonly-api/perspective-ingest-local-preview.ts";
const perspectiveIngestLocalRouteFile =
  "app/api/augnes/read/perspective-ingest-local-preview/route.ts";
const perspectiveIngestLocalDoc =
  "docs/PERSPECTIVE_INGEST_LOCAL_PASTED_TEXT_PREVIEW_V0_1.md";
const perspectiveIngestLocalSmokeFile =
  "scripts/smoke-perspective-ingest-local-pasted-text-preview.mjs";
const perspectiveCapsuleSmokeFile =
  "scripts/smoke-perspective-capsule-contract.mjs";
const browserReportFile =
  "reports/browser/2026-06-04-cockpit-local-only-constellation-route-preview.md";
const pastedTextDogfoodReportFile =
  "reports/browser/2026-06-05-perspective-ingest-local-pasted-text-dogfood.md";
const packageJsonFile = "package.json";
const smokeFile =
  "scripts/smoke-cockpit-local-only-constellation-route-preview.mjs";
const closeoutSmokeFile =
  "scripts/smoke-readonly-constellation-local-only-consumer-closeout.mjs";
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
const responseShapeSmokeFile =
  "scripts/smoke-readonly-api-route-response-shape-boundary.mjs";
const reviewChecklistSmokeFile =
  "scripts/smoke-readonly-api-route-review-checklist.mjs";
const surfaceSmokeFile =
  "scripts/smoke-chatgpt-app-mcp-readonly-surface-boundary.mjs";
const accessGuardSmokeFile =
  "scripts/smoke-readonly-api-route-access-guard.mjs";
const implementationPlanSmokeFile =
  "scripts/smoke-readonly-api-route-implementation-plan.mjs";
const implementationDesignSmokeFile =
  "scripts/smoke-readonly-api-route-implementation-design-packet.mjs";

const inspectedFiles = [
  cockpitFile,
  implementationDoc,
  cockpitPlanDoc,
  closeoutDoc,
  consumerDecisionDoc,
  localDevAdapterDoc,
  realAuthGatePlanDoc,
  routeDoc,
  reviewChecklistDoc,
  surfaceBoundaryDoc,
  implementationPlanDoc,
  implementationDesignDoc,
  authorityMatrixDoc,
  indexDoc,
  routeFile,
  routeHelperFile,
  localDevAdapterFile,
  responseShapeTypeFile,
  browserReportFile,
  pastedTextDogfoodReportFile,
  packageJsonFile,
  smokeFile,
];

const allowedChangedFiles = new Set([
  cockpitFile,
  implementationDoc,
  cockpitPlanDoc,
  closeoutDoc,
  consumerDecisionDoc,
  localDevAdapterDoc,
  realAuthGatePlanDoc,
  routeDoc,
  reviewChecklistDoc,
  surfaceBoundaryDoc,
  implementationPlanDoc,
  implementationDesignDoc,
  authorityMatrixDoc,
  indexDoc,
  routeFile,
  routeHelperFile,
  localDevAdapterFile,
  responseShapeTypeFile,
  browserReportFile,
  pastedTextDogfoodReportFile,
  smokeFile,
  closeoutSmokeFile,
  staticCockpitSmokeFile,
  packageJsonFile,
  planSmokeFile,
  consumerDecisionSmokeFile,
  realAuthGatePlanSmokeFile,
  localDevAdapterSmokeFile,
  routeSmokeFile,
  responseShapeSmokeFile,
  reviewChecklistSmokeFile,
  surfaceSmokeFile,
  accessGuardSmokeFile,
  implementationPlanSmokeFile,
  implementationDesignSmokeFile,
  globalsCssFile,
  perspectiveIngestTypeFile,
  perspectiveIngestChatGptFixtureFile,
  perspectiveIngestCodexFixtureFile,
  perspectiveIngestSessionEpisodeFile,
  perspectiveIngestChatGptAdapterFile,
  perspectiveIngestCodexAdapterFile,
  perspectiveIngestPacketBuilderFile,
  perspectiveIngestRouteHelperFile,
  perspectiveIngestRouteFile,
  perspectiveIngestDoc,
  perspectiveIngestSmokeFile,
  perspectiveIngestLocalPostGuardFile,
  perspectiveIngestLocalValidationFile,
  perspectiveIngestLocalAdapterFile,
  perspectiveIngestLocalRouteHelperFile,
  perspectiveIngestLocalRouteFile,
  perspectiveIngestLocalDoc,
  perspectiveIngestLocalSmokeFile,
  perspectiveCapsuleSmokeFile,
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
  "GET-only",
  "static fixture",
  "no execution/write authority",
  "Boundary class:",
  "read_only_local_static_preview",
  "Copy Codex handoff",
  "Copied",
  "Use for handoff",
  "Selected for handoff",
  "Evidence ranked for selected action:",
  "Preview Codex handoff",
  "If clipboard is unavailable, select and copy this preview text manually.",
  "Select preview text",
  "Preview text selected",
];

const requiredHeaders = [
  "x-augnes-local-readonly",
];

const requiredDisplayedFields = [
  "response_version",
  "meta.project_scope",
  "boundary_class",
  "read_only_local_static_preview",
  "project_constellation.constellation_id",
  "project_constellation.thesis",
  "bounded nodes",
  "bounded edges",
  "bounded clusters",
  "evidence pointers as pointer-only",
  "unresolved tensions",
  "next action candidates are advisory",
];

const requiredHandoffBuilderPhrases = [
  "buildProjectConstellationCodexHandoffPrompt",
  "Repo: hynk-studio/augnes",
  "Workflow: create a focused PR. Do not merge.",
  "Task goal:",
  "Project Constellation thesis:",
  "Selected/current nodes:",
  "Unresolved tensions that matter:",
  "Evidence pointers prioritized for this handoff:",
  "Selected next action candidate:",
  "Expected changed-file guidance:",
  "Validation guidance:",
  "Final report expectations:",
  "PR number and URL",
  "head commit SHA",
  "browser/computer-use result when UI changes",
  "next suggested goal",
  "getRankedConstellationHandoffEvidencePointers",
  "scoreConstellationHandoffEvidencePointer",
  "dedupeConstellationEvidencePointers",
  "selectedNextActionCandidate",
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
    "const PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_REQUEST_PATH =",
  ),
  extractSourceBetween(
    cockpitSource,
    "type ConstellationRoutePreviewEvidencePointer =",
    "type CockpitTemporalAdmissionDecision =",
  ),
  extractSourceBetween(
    cockpitSource,
    "const [constellationRoutePreviewState",
    "const preview = temporalPreview?.preview",
  ),
  extractSourceBetween(
    cockpitSource,
    "const selectedConstellationHandoffEvidencePointers",
    "const perspectiveIngestConstellationPreview",
  ),
  extractSourceBetween(
    cockpitSource,
    "async function fetchConstellationRoutePreview",
    "async function fetchPerspectiveIngestLocalPastedTextPreview",
  ),
  extractSourceBetween(
    cockpitSource,
    "async function copyConstellationCodexHandoff",
    "return (",
  ),
  extractSourceBetween(
    cockpitSource,
    "async function copyTextToClipboard",
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
const handoffBuilderSource = extractSourceBetween(
  cockpitSource,
  "function buildProjectConstellationCodexHandoffPrompt",
  "function getErrorMessage",
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
      handoff_builder_fields_checked: requiredHandoffBuilderPhrases.length,
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
    "copyConstellationCodexHandoff",
    "selectedConstellationNextActionId",
    "setSelectedConstellationNextActionId",
    "selectedConstellationNextAction",
    "selectedConstellationHandoffEvidencePointers",
    "selectedConstellationHandoffPreviewText",
    "selectedConstellationHandoffPreviewRef",
    "selectConstellationHandoffPreviewText",
    "Use for handoff",
    "Selected for handoff",
    "Evidence ranked for selected action:",
    "Preview Codex handoff",
    "Select preview text",
    "aria-pressed",
    "navigator.clipboard.writeText",
    "document.execCommand(\"copy\")",
    "buildProjectConstellationCodexHandoffPrompt",
    "method: \"GET\"",
  ], { label: "Cockpit local-only route preview source" });

  assert.equal(
    routePreviewSectionSource.includes("<button"),
    true,
    "Cockpit local-only route preview section must render the copy handoff button",
  );
  assert.equal(
    /\bonClick\s*=/.test(routePreviewSectionSource),
    true,
    "Cockpit local-only route preview section must wire the copy handoff click handler",
  );
  assertContainsAll(routePreviewSectionSource, [
    "Copy Codex handoff",
    "CopyFeedback",
    "constellationHandoffCopyNotice",
    "selectedConstellationNextAction",
    "selectedConstellationHandoffEvidencePointers",
    "selectedConstellationHandoffPreviewText",
    "Evidence ranked for selected action:",
    "Preview Codex handoff",
    "If clipboard is unavailable, select and copy this preview text manually.",
    "Select preview text",
    "Selected Codex handoff text",
    "Use for handoff",
  ], { label: "Cockpit local-only route preview copy action" });
  assertContainsAll(routePreviewSectionSource, [
    "<details",
    "<summary>",
    "<textarea",
    "readOnly",
    "ref={selectedConstellationHandoffPreviewRef}",
    "value={selectedConstellationHandoffPreviewText}",
  ], {
    label: "Project Constellation read-only selected handoff preview UI",
  });
  assertContainsAll(cockpitSource, [
    "selectedConstellationHandoffPreviewRef",
    "selectConstellationHandoffPreviewText",
    "previewTextarea.focus()",
    "previewTextarea.select()",
    "Preview text selected",
  ], {
    label: "Project Constellation manual preview text selection fallback",
  });
  assert.equal(
    cockpitSource.includes("navigator.clipboard.writeText(selectedConstellationHandoffPreviewText)"),
    false,
    "Manual preview text selection fallback must not add a second clipboard writer",
  );
  assertContainsAll(cockpitSource, [
    "const selectedConstellationHandoffPreviewText = constellationRoutePreview",
    "buildProjectConstellationCodexHandoffPrompt(",
    "copyConstellationCodexHandoff(handoffText: string)",
    "copyTextToClipboard(handoffText)",
    "copyConstellationCodexHandoff(",
    "selectedConstellationHandoffPreviewText",
  ], {
    label: "Project Constellation preview and copy shared handoff text",
  });
  assertContainsAll(routePreviewSource, [
    "selectedConstellationHandoffEvidencePointers",
    "getRankedConstellationHandoffEvidencePointers(",
    ".slice(0, 2)",
    "pointer.target_ref ?? pointer.pointer_id",
  ], {
    label: "Project Constellation selected handoff evidence preview",
  });
  assertContainsAll(handoffBuilderSource, requiredHandoffBuilderPhrases, {
    label: "Project Constellation Codex handoff builder",
  });
  assertContainsAll(handoffBuilderSource, [
    "const rankedEvidencePointers = getRankedConstellationHandoffEvidencePointers",
    "selectedNextActionCandidate ??",
    "rankedEvidencePointers.slice(0, 5)",
    "recommendedNextAction?.source_refs",
    "relatedNodeSourceRefs",
    "countConstellationHandoffTokenOverlap",
  ], {
    label: "Project Constellation prioritized evidence handoff builder",
  });
  assert.equal(
    handoffBuilderSource.includes("preview.evidence_pointers.slice(0, 5)"),
    false,
    "Copied Codex handoff builder must not take the first global evidence pointers without ranking",
  );
  for (const longDefaultDiagnostic of [
    "authority_boundary",
    "forbidden_fields_removed",
    "diagnostics=authority",
    "no merge/publish/approval/retry/replay/deploy authority",
  ]) {
    assert.equal(
      handoffBuilderSource.includes(longDefaultDiagnostic),
      false,
      `Copied Codex handoff builder must not include long default diagnostic prose: ${longDefaultDiagnostic}`,
    );
  }

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
    "connects no App/MCP/ChatGPT App/plugin tool",
    "grants no execution/write/proof/evidence/Codex/branch/PR/merge/publish/retry/replay/deploy/persistence authority",
    "default Cockpit request sends only the local read-only marker header",
    "read_only_local_static_preview",
    "boundary_class",
    "diagnostics=authority",
    "Copy Codex handoff",
    "Codex-ready prompt",
    "local clipboard",
    "Use for handoff",
    "prioritizes evidence pointers for the selected next action",
    "shows the top selected-action evidence refs beside the copy action",
    "read-only expanded handoff preview",
    "If clipboard is unavailable, select and copy this preview text manually.",
    "Select preview text",
    "does not change the route payload shape",
    "does not include long default authority lists",
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
    "Copy Codex handoff",
    "Users can select which advisory next action drives the copied handoff",
    "prioritizes evidence pointers for that selected action",
    "shows the top selected-action evidence refs beside the copy action",
    "read-only expanded handoff preview",
    "uses the same generated handoff text as the copy action",
    "Select preview text",
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
    if (
      [
        routeFile,
        routeHelperFile,
        localDevAdapterFile,
        responseShapeTypeFile,
        perspectiveIngestRouteFile,
        perspectiveIngestRouteHelperFile,
        perspectiveIngestLocalPostGuardFile,
        perspectiveIngestLocalValidationFile,
        perspectiveIngestLocalAdapterFile,
        perspectiveIngestLocalRouteFile,
        perspectiveIngestLocalRouteHelperFile,
        perspectiveIngestTypeFile,
        perspectiveIngestSessionEpisodeFile,
        perspectiveIngestChatGptAdapterFile,
        perspectiveIngestCodexAdapterFile,
        perspectiveIngestPacketBuilderFile,
      ].includes(file)
    ) {
      continue;
    }

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
