import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const helperPath = "lib/empty-runtime-startup-fallback.ts";
const approvalRoutePath = "app/api/approval-gate-state/summary/route.ts";
const publicationRoutePath = "app/api/publications/summary/route.ts";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const smokePath =
  "scripts/smoke-approval-publication-empty-runtime-startup-fallback-v0-1.mjs";

for (const filePath of [
  helperPath,
  approvalRoutePath,
  publicationRoutePath,
  indexPath,
  packagePath,
  smokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const helper = readFileSync(helperPath, "utf8");
const approvalRoute = readFileSync(approvalRoutePath, "utf8");
const publicationRoute = readFileSync(publicationRoutePath, "utf8");
const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assertHelperContract();
assertApprovalRouteFallback();
assertPublicationRouteFallback();
assertForbiddenPatternsAbsent();
assertDocsAndPackagePointers();

console.log(
  JSON.stringify(
    {
      smoke: "approval-publication-empty-runtime-startup-fallback-v0-1",
      helper_contract_checked: true,
      approval_route_checked: true,
      publication_route_checked: true,
      route_compatible_empty_shapes_checked: true,
      invalid_query_preservation_checked: true,
      unexpected_errors_rethrown_checked: true,
      forbidden_patterns_absent: true,
      docs_pointer_checked: true,
      package_script_checked: true,
    },
    null,
    2,
  ),
);

function assertHelperContract() {
  for (const requiredText of [
    "APPROVAL_PUBLICATION_EMPTY_RUNTIME_OPTIONAL_TABLES",
    '"publication_drafts"',
    '"delivery_ledger"',
    '"publication_approval_requests"',
    '"publication_approval_decisions"',
    '"publication_readiness_checks"',
    "getMissingApprovalPublicationOptionalTables",
    "isMissingApprovalPublicationOptionalTableError",
    "buildApprovalPublicationEmptyRuntimeFallbackMetadata",
    "approval_or_publication_workflow_created: false",
    "promotion_workflow_created: false",
    "approval_workflow_created: false",
    "publication_workflow_created: false",
    "provider_or_openai_calls: false",
    "retrieval_or_rag: false",
    "source_fetching: false",
    "proof_or_evidence_writes: false",
    "perspective_promotion: false",
    "canonical_graph_write: false",
    "work_item_creation: false",
    "codex_execution: false",
    "external_handoff_sending: false",
    "browser_persistence: false",
    "missing_table_errors_bounded_to_recognized_optional_runtime_tables: true",
    "unexpected_db_errors_rethrown: true",
  ]) {
    assert.ok(helper.includes(requiredText), `helper must include ${requiredText}`);
  }

  for (const stateWorkTable of [
    '"state_entries"',
    '"work_items"',
    '"state_transitions"',
    '"state_delta_proposals"',
    "getMissingEmptyRuntimeOptionalTables",
    "buildEmptyRuntimeStartupFallbackMetadata",
  ]) {
    assert.ok(
      helper.includes(stateWorkTable),
      `existing #646 state/work fallback must still include ${stateWorkTable}`,
    );
  }

  assert.match(
    helper,
    /no such table:\\s\*/,
    "helper must recognize SQLite no-such-table errors",
  );
  assert.doesNotMatch(
    helper,
    /\b(?:INSERT|UPDATE|DELETE|CREATE TABLE|ALTER TABLE|DROP TABLE)\b/i,
    "helper must not write or mutate schema",
  );
  assert.doesNotMatch(helper, /\bfetch\s*\(/, "helper must not fetch");
  assert.doesNotMatch(helper, /\bsqlite_master\b/i, "helper must not inspect DB schema");
}

function assertApprovalRouteFallback() {
  assertRouteCommon({
    routeSource: approvalRoute,
    routePath: approvalRoutePath,
    routeLabel: "GET /api/approval-gate-state/summary",
  });

  for (const requiredText of [
    "buildEmptyApprovalGateStateFallback",
    "ApprovalRequestValidationError",
    "PublicationValidationError",
    "readFallbackLimit",
    "APPROVAL_GATE_STATE_BOUNDARIES",
    "requested: []",
    "blocked_or_not_ready: []",
    "ready_for_future_approval_review: []",
    "approved_for_future_publish_readiness: []",
    "dry_run_ready_for_future_publish: []",
    "dry_run_blocked: []",
    "stale_or_mismatched: []",
    "terminal_or_inactive",
    "requested_count: 0",
    "blocked_count: 0",
    "ready_for_review_count: 0",
    "approved_count: 0",
    "dry_run_ready_count: 0",
    "dry_run_blocked_count: 0",
    "approval_request_limit: limit",
    "delivery_limit: 200",
  ]) {
    assert.ok(
      approvalRoute.includes(requiredText),
      `${approvalRoutePath} must include ${requiredText}`,
    );
  }

  assert.match(
    approvalRoute,
    /status:\s*400/,
    `${approvalRoutePath} must preserve invalid-query 400 responses`,
  );
}

function assertPublicationRouteFallback() {
  assertRouteCommon({
    routeSource: publicationRoute,
    routePath: publicationRoutePath,
    routeLabel: "GET /api/publications/summary",
  });

  for (const requiredText of [
    "buildEmptyPublicationSummaryFallback",
    "PublicationValidationError",
    "PUBLICATION_SUMMARY_BOUNDARIES",
    "drafts: []",
    "approved_previews: []",
    "sent: []",
    "failed: []",
    "cancelled: []",
    "pending_count: 0",
    "sent_count: 0",
    "failed_count: 0",
    "acknowledged_count: 0",
    "failed_deliveries: []",
    "publication_limit: 200",
    "delivery_limit: 200",
    "{ status: 400 }",
  ]) {
    assert.ok(
      publicationRoute.includes(requiredText),
      `${publicationRoutePath} must include ${requiredText}`,
    );
  }
}

function assertRouteCommon({ routeSource, routePath, routeLabel }) {
  for (const requiredText of [
    "buildApprovalPublicationEmptyRuntimeFallbackMetadata",
    "getMissingApprovalPublicationOptionalTables",
    "const missingTables = getMissingApprovalPublicationOptionalTables(error)",
    "if (missingTables.length > 0) {",
    "missingTables,",
    "throw error;",
    routeLabel,
    "Empty-runtime fallback",
  ]) {
    assert.ok(routeSource.includes(requiredText), `${routePath} must include ${requiredText}`);
  }

  assert.doesNotMatch(
    routeSource,
    /\b(?:INSERT|UPDATE|DELETE|CREATE TABLE|ALTER TABLE|DROP TABLE)\b/i,
    `${routePath} must not write or mutate schema`,
  );
  assert.doesNotMatch(routeSource, /\bfetch\s*\(/, `${routePath} must not fetch`);
}

function assertForbiddenPatternsAbsent() {
  const checkedSources = {
    [helperPath]: helper,
    [approvalRoutePath]: approvalRoute,
    [publicationRoutePath]: publicationRoute,
  };
  const forbiddenImportPattern =
    /(?:openai|provider|retriev|rag|source-fetch|crawler|scraper|embedding|vector|proof|evidence|perspective.*promotion|canonical.*graph|work-item.*create|codex.*execution|handoff.*send|mcp|plugin)/i;
  const forbiddenPersistencePattern =
    /\b(?:localStorage|sessionStorage|indexedDB|document\.cookie)\b/;

  for (const [filePath, source] of Object.entries(checkedSources)) {
    const imports = source
      .split("\n")
      .filter((line) => /^\s*import\b/.test(line))
      .join("\n");

    assert.doesNotMatch(
      imports,
      forbiddenImportPattern,
      `${filePath} must not import forbidden provider/retrieval/proof/evidence/work/promotion modules`,
    );
    assert.doesNotMatch(
      source,
      forbiddenPersistencePattern,
      `${filePath} must not add browser persistence`,
    );
    assert.doesNotMatch(
      source,
      /\bfake seed data\b/i,
      `${filePath} must not create fake seed data`,
    );
  }
}

function assertDocsAndPackagePointers() {
  assert.equal(
    packageJson.scripts[
      "smoke:approval-publication-empty-runtime-startup-fallback-v0-1"
    ],
    "node scripts/smoke-approval-publication-empty-runtime-startup-fallback-v0-1.mjs",
    "package.json must expose the approval/publication empty-runtime fallback smoke",
  );

  for (const requiredText of [
    "Approval/publication empty-runtime startup fallback lane",
    "GET /api/publications/summary",
    "GET /api/approval-gate-state/summary",
    "publication_drafts",
    "delivery_ledger",
    "publication_approval_requests",
    "publication_approval_decisions",
    "publication_readiness_checks",
    "smoke:approval-publication-empty-runtime-startup-fallback-v0-1",
  ]) {
    assert.ok(index.includes(requiredText), `docs index must include ${requiredText}`);
  }
}
