import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const routeFile =
  "app/cockpit/perspective/memory-boundary-review-inbox/page.tsx";
const componentFile =
  "app/cockpit/perspective/memory-boundary-review-inbox/memory-boundary-review-inbox-surface.tsx";
const cssFile =
  "app/cockpit/perspective/memory-boundary-review-inbox/memory-boundary-review-inbox-surface.module.css";
const boundaryModelFile =
  "lib/perspective-ingest/perspective-memory-product-persistence-boundary.ts";
const apiRouteFile =
  "app/api/perspective/memory/product-persistence-boundary/records/route.ts";
const apiRecordRouteFile =
  "app/api/perspective/memory/product-persistence-boundary/records/[recordId]/route.ts";
const localQueueSurfaceFile =
  "app/cockpit/perspective/memory-review-queue/local/local-memory-review-queue-surface.tsx";
const docFile =
  "docs/PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_REVIEW_INBOX_V0_1.md";
const boundaryDocFile =
  "docs/PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_V0_1.md";
const reportFile =
  "reports/2026-06-13-perspective-memory-boundary-review-inbox.md";
const browserReportFile =
  "reports/browser/2026-06-13-perspective-memory-boundary-review-inbox.md";
const browserSmokeFile =
  "scripts/browser-smoke-perspective-memory-boundary-review-inbox.mjs";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const routeText = readFileSync(routeFile, "utf8");
const componentText = readFileSync(componentFile, "utf8");
const cssText = readFileSync(cssFile, "utf8");
const modelText = readFileSync(boundaryModelFile, "utf8");
const apiRouteText = readFileSync(apiRouteFile, "utf8");
const apiRecordRouteText = readFileSync(apiRecordRouteFile, "utf8");
const localQueueSurfaceText = readFileSync(localQueueSurfaceFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const boundaryDocText = readFileSync(boundaryDocFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const browserReportText = readFileSync(browserReportFile, "utf8");

assertFilesAndScripts();
assertRouteSurface();
assertDocsReports();
assertForbiddenBehavior();

console.log("PASS smoke:perspective-memory-boundary-review-inbox");

function assertFilesAndScripts() {
  for (const file of [
    routeFile,
    componentFile,
    cssFile,
    boundaryModelFile,
    apiRouteFile,
    apiRecordRouteFile,
    localQueueSurfaceFile,
    docFile,
    boundaryDocFile,
    reportFile,
    browserReportFile,
    browserSmokeFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }

  assert.equal(
    packageJson.scripts["smoke:perspective-memory-boundary-review-inbox"],
    "node scripts/smoke-perspective-memory-boundary-review-inbox.mjs",
  );
  assert.equal(
    packageJson.scripts["browser:perspective-memory-boundary-review-inbox"],
    "node scripts/browser-smoke-perspective-memory-boundary-review-inbox.mjs",
  );
}

function assertRouteSurface() {
  assertIncludesAll(routeText, [
    "MemoryBoundaryReviewInboxSurface",
    "memory-boundary-review-inbox-surface",
  ]);
  assertIncludesAll(modelText, [
    "PERSPECTIVE_MEMORY_BOUNDARY_REVIEW_INBOX_ROUTE",
    "/cockpit/perspective/memory-boundary-review-inbox",
    "PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_API_ROUTE",
  ]);
  assertIncludesAll(componentText, [
    "Boundary Review Inbox",
    "data-augnes-boundary-review-inbox",
    "PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_API_ROUTE",
    "?limit=100",
    "PATCH",
    "sqlite:lib/db.ts",
    "product persistence boundary records",
    "not accepted Augnes memory",
    "not product memory write",
    "not review decision",
    "not Core decision",
    "not runtime handoff",
    "not automatic promotion",
    "data-augnes-boundary-inbox-record-list",
    "data-augnes-boundary-inbox-record-detail",
    "data-augnes-boundary-inbox-proposed-memory-payload",
    "data-augnes-boundary-inbox-proposal-diff-summary",
    "data-augnes-boundary-inbox-checklist-gate-summary",
    "data-augnes-boundary-inbox-status-reviewing",
    "data-augnes-boundary-inbox-status-kept-for-later",
    "data-augnes-boundary-inbox-status-retracted",
    "data-augnes-boundary-inbox-local-queue-link",
    "data-augnes-boundary-inbox-operator-flow-link",
    "can_create_accepted_memory",
    "can_create_core_decision",
    "can_auto_promote",
    "product_memory_write_created",
    "accepted_augnes_memory_created",
    "user_confirmation",
    "next_allowed_actions",
    "authority_boundary",
    "product_persistence_boundary_recorded",
    "locally_reviewing_boundary_record",
    "kept_for_later",
    "retracted_before_memory_write",
    "PASS with follow-up",
    "has warnings",
    "retracted or kept",
  ]);
  assertIncludesAll(cssText, [
    ".shell",
    ".grid",
    ".statusStrip",
    ".itemList",
    ".detailGrid",
    ".policyBox",
    "@media (max-width: 900px)",
    "@media (max-width: 520px)",
  ]);
  assertIncludesAll(localQueueSurfaceText, [
    "PERSPECTIVE_MEMORY_BOUNDARY_REVIEW_INBOX_ROUTE",
    "Open persisted boundary review inbox",
    "data-augnes-open-boundary-review-inbox",
  ]);
  assertIncludesAll(apiRouteText, ["GET", "POST", "listPerspectiveMemoryProductPersistenceBoundaryRecords"]);
  assertIncludesAll(apiRecordRouteText, ["PATCH", "boundary_status"]);
}

function assertDocsReports() {
  for (const text of [docText, reportText, browserReportText]) {
    assertIncludesAll(text, [
      "/cockpit/perspective/memory-boundary-review-inbox",
      "sqlite:lib/db.ts",
      "product persistence boundary",
      "proposed_memory_payload",
      "proposal_diff_summary",
      "checklist_gate_summary",
      "user_confirmation",
      "not accepted Augnes memory",
      "not product memory write",
      "not Core decision",
      "not automatic promotion",
    ]);
  }
  assertIncludesAll(boundaryDocText, [
    "persisted boundary review inbox",
    "/cockpit/perspective/memory-boundary-review-inbox",
  ]);
}

function assertForbiddenBehavior() {
  assertNoIncludes(componentText, [
    "perspective-memory-product-persistence-boundary-store",
    "localStorage.getItem",
    "localStorage.setItem",
    "localStorage.removeItem",
    "data-augnes-write-to-memory",
    "data-augnes-commit-memory",
    "data-augnes-accept-memory",
    "data-augnes-send-to-core",
    "data-augnes-create-core-decision",
    "data-augnes-auto-promote",
    "createAcceptedMemory",
    "createCoreDecision",
    "createReviewDecision",
    "new Octokit",
    "@octokit",
    "openai.chat",
    "OpenAI(",
    "Codex SDK",
    "provider/model",
  ]);
  assertNoIncludes(docText + reportText, [
    "localStorage-only persistence",
    "accepted Augnes memory created",
    "product memory write created",
    "Core decision created",
  ]);
}

function assertIncludesAll(text, snippets) {
  for (const snippet of snippets) {
    assert(text.includes(snippet), `expected source to include ${snippet}`);
  }
}

function assertNoIncludes(text, snippets) {
  for (const snippet of snippets) {
    assert(!text.includes(snippet), `source must not include ${snippet}`);
  }
}
