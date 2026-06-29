#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const validationName = "operator_path_backend_safety_validation_bundle";
const validationVersion = "operator_path_backend_safety_validation_bundle.v0.1";
const fixtureVersion = "operator_path_backend_safety_validation_bundle.sample.v0.1";
const validationRef = "operator_path_backend_safety_validation_bundle_v0_1";
const scope = "project:augnes";

const docsPath = "docs/OPERATOR_PATH_BACKEND_SAFETY_VALIDATION_BUNDLE_V0_1.md";
const fixturePath = "fixtures/operator-path-backend-safety-validation-bundle.sample.v0.1.json";
const smokePath = "scripts/smoke-operator-path-backend-safety-validation-bundle-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const assistedDocsPath = "docs/OPERATOR_PATH_ASSISTED_MANUAL_QA_EXECUTION_REPORT_V0_1.md";
const assistedFixturePath =
  "fixtures/operator-path-assisted-manual-qa-execution-report.sample.v0.1.json";
const assistedSmokePath =
  "scripts/smoke-operator-path-assisted-manual-qa-execution-report-v0-1.mjs";
const runbookDocsPath = "docs/OPERATOR_PATH_MANUAL_QA_RUNBOOK_V0_1.md";
const usabilityDocsPath =
  "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_OPERATOR_PATH_USABILITY_AUDIT_V0_1.md";
const browserDocsPath =
  "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_OPERATOR_BROWSER_VALIDATION_V0_1.md";
const e2eDocsPath =
  "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_END_TO_END_OPERATOR_PATH_V0_1.md";
const e2eSmokePath =
  "scripts/smoke-final-rag-answer-review-memory-end-to-end-operator-path-v0-1.mjs";
const readinessDocsPath = "docs/PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_V0_1.md";
const uiDocsPath = "docs/FINAL_ANSWER_CANDIDATE_REVIEW_UI_BINDING_V0_1.md";
const bindingDocsPath = "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_V0_1.md";
const finalCandidateDocsPath = "docs/FINAL_RAG_ANSWER_GENERATION_CANDIDATE_REVIEW_V0_1.md";
const reviewMemoryStoreDocsPath =
  "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_STORE_RUNTIME_COMPLETION_V0_1.md";
const reviewMemoryRoutesDocsPath =
  "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_ROUTES_RUNTIME_COMPLETION_V0_1.md";
const productWriteDocsPath = "docs/PRODUCT_WRITE_ACCEPTED_EVIDENCE_REF_RUNTIME_V0_1.md";
const privacyGuardDocsPath = "docs/PRIVACY_REDACTION_RUNTIME_GUARD_V0_1.md";
const runtimeAuditDocsPath = "docs/RUNTIME_AUDIT_PANEL_RUNTIME_COMPLETION_V0_1.md";

const finalCandidateRoutePath = "app/api/research-retrieval/final-rag-answer/route.ts";
const bindingRoutePath = "app/api/research-retrieval/final-rag-answer/review-memory/route.ts";
const readinessRoutePath = "app/api/perspective/promotion/readiness-packet/route.ts";
const reviewMemoryListRoutePath = "app/api/research-candidate-review/review-records/route.ts";
const reviewMemoryDetailRoutePath =
  "app/api/research-candidate-review/review-records/[review_record_id]/route.ts";
const reviewMemoryActivityRoutePath =
  "app/api/research-candidate-review/review-records/[review_record_id]/activity/route.ts";
const reviewMemoryStorePath = "lib/research-candidate-review/review-memory-db-store.ts";
const reviewMemoryRouteContractPath =
  "lib/research-candidate-review/review-memory-db-route-contract.ts";
const retrievalStorePath = "lib/research-retrieval/index-store.ts";
const retrievalRebuildPath = "lib/research-retrieval/rebuild-index.ts";
const runtimeAuditStorePath = "lib/runtime-audit/audit-event-store.ts";
const routeAuditInstrumentationPath = "lib/runtime-audit/route-audit-instrumentation.ts";
const ragContextFixturePath = "fixtures/rag-context-preview-runtime-completion.sample.v0.1.json";
const finalCandidateFixturePath =
  "fixtures/final-rag-answer-generation-candidate-review.sample.v0.1.json";
const bindingFixturePath = "fixtures/final-rag-answer-review-memory-binding.sample.v0.1.json";
const readinessFixturePath = "fixtures/promotion-readiness-packet-from-review-memory.sample.v0.1.json";

const packageScriptName = "smoke:operator-path-backend-safety-validation-bundle-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-operator-path-backend-safety-validation-bundle-v0-1.mjs";

const checkedSurfaces = [
  "route:/api/research-retrieval/final-rag-answer",
  "route:/api/research-retrieval/final-rag-answer/review-memory",
  "route:/api/research-candidate-review/review-records",
  "route:/api/research-candidate-review/review-records/[review_record_id]",
  "route:/api/research-candidate-review/review-records/[review_record_id]/activity",
  "route:/api/perspective/promotion/readiness-packet",
  "runtime_audit_event_store",
];

const guardedPrimitives = [
  "globalThis.fetch",
  "http.request",
  "http.get",
  "https.request",
  "https.get",
  "net.connect",
  "tls.connect",
  "dns.lookup",
  "dns.resolve",
];

const exactOldSmokeCompatibilityFiles = [
  "scripts/smoke-operator-path-assisted-manual-qa-execution-report-v0-1.mjs",
  "scripts/smoke-operator-path-manual-qa-runbook-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-operator-path-usability-audit-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-operator-browser-validation-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-end-to-end-operator-path-v0-1.mjs",
  "scripts/smoke-promotion-readiness-packet-from-review-memory-v0-1.mjs",
  "scripts/smoke-final-answer-candidate-review-ui-binding-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-binding-v0-1.mjs",
  "scripts/smoke-final-rag-answer-generation-candidate-review-v0-1.mjs",
  "docs/OPERATOR_PATH_HUMAN_REVIEW_PACKET_V0_1.md",
  "fixtures/operator-path-human-review-packet.sample.v0.1.json",
  "scripts/smoke-operator-path-human-review-packet-v0-1.mjs",
  "docs/OPERATOR_PATH_BACKEND_REMAINING_GAP_INVENTORY_V0_1.md",
  "fixtures/operator-path-backend-remaining-gap-inventory.sample.v0.1.json",
  "scripts/smoke-operator-path-backend-remaining-gap-inventory-v0-1.mjs",
  "docs/OPERATOR_PATH_PUBLIC_SAFE_ARTIFACT_INDEX_V0_1.md",
  "fixtures/operator-path-public-safe-artifact-index.sample.v0.1.json",
  "scripts/smoke-operator-path-public-safe-artifact-index-v0-1.mjs",
  "components/promotion-readiness-packet-panel.tsx",
  "app/perspective/promotion/readiness-packet/page.tsx",
  "docs/PROMOTION_READINESS_PACKET_UI_READ_DISPLAY_BINDING_V0_1.md",
  "fixtures/promotion-readiness-packet-ui-read-display-binding.sample.v0.1.json",
  "scripts/smoke-promotion-readiness-packet-ui-read-display-binding-v0-1.mjs",
  "docs/PROMOTION_READINESS_PACKET_UI_BROWSER_STATIC_VALIDATION_V0_1.md",
  "fixtures/promotion-readiness-packet-ui-browser-static-validation.sample.v0.1.json",
  "reports/browser/2026-06-29-promotion-readiness-packet-ui-browser-static-validation.md",
  "scripts/browser-validate-promotion-readiness-packet-ui-browser-static-validation-v0-1.mjs",
  "scripts/smoke-promotion-readiness-packet-ui-browser-static-validation-v0-1.mjs",
];

const optionalAuditInstrumentationPaths = new Set([
  "lib/runtime-audit/audit-event-store.ts",
  "app/api/research-retrieval/final-rag-answer/route.ts",
  "app/api/research-retrieval/final-rag-answer/review-memory/route.ts",
  "app/api/perspective/promotion/readiness-packet/route.ts",
  "app/api/research-candidate-review/review-records/route.ts",
  "app/api/research-candidate-review/review-records/[review_record_id]/route.ts",
  "app/api/research-candidate-review/review-records/[review_record_id]/activity/route.ts",
]);

const expectedChangedFiles = new Set([
  docsPath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  ...exactOldSmokeCompatibilityFiles,
]);

const finalCandidateRouteVersion = "final_rag_answer_generation_candidate_review_route.v0.1";
const bindingRouteVersion = "final_rag_answer_review_memory_binding_route.v0.1";
const reviewMemoryRouteVersion = "research_candidate_review_memory_db_routes.v0.1";
const readinessRouteVersion = "promotion_readiness_packet_from_review_memory_route.v0.1";

const retrievalTempRoot =
  `.tmp/research-retrieval/operator-path-backend-safety-validation-bundle-${process.pid}`;
const reviewMemoryTempRoot =
  `.tmp/research-candidate-review-memory/operator-path-backend-safety-validation-bundle-${process.pid}`;
const retrievalDbPath = `${retrievalTempRoot}/retrieval-index.sqlite`;
const reviewMemoryDbPath = `${reviewMemoryTempRoot}/review-memory.sqlite`;
const missingReviewMemoryDbPath = `${reviewMemoryTempRoot}/missing/review-memory.sqlite`;
const schemaMissingReviewMemoryDbPath =
  `${reviewMemoryTempRoot}/schema-missing.sqlite`;
const auditDbPath = `.tmp/runtime-audit/operator-path-backend-safety-validation-${process.pid}.sqlite`;
const invalidAuditDbPath = "../runtime-audit/operator-path-backend-safety-validation.sqlite";
const reviewRecordId = "review-memory-binding:final-rag-answer:backend-safety-validation";

for (const filePath of [
  docsPath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  assistedDocsPath,
  assistedFixturePath,
  assistedSmokePath,
  runbookDocsPath,
  usabilityDocsPath,
  browserDocsPath,
  e2eDocsPath,
  e2eSmokePath,
  readinessDocsPath,
  uiDocsPath,
  bindingDocsPath,
  finalCandidateDocsPath,
  reviewMemoryStoreDocsPath,
  reviewMemoryRoutesDocsPath,
  productWriteDocsPath,
  privacyGuardDocsPath,
  runtimeAuditDocsPath,
  finalCandidateRoutePath,
  bindingRoutePath,
  readinessRoutePath,
  reviewMemoryListRoutePath,
  reviewMemoryDetailRoutePath,
  reviewMemoryActivityRoutePath,
  reviewMemoryStorePath,
  reviewMemoryRouteContractPath,
  retrievalStorePath,
  retrievalRebuildPath,
  runtimeAuditStorePath,
  routeAuditInstrumentationPath,
  ragContextFixturePath,
  finalCandidateFixturePath,
  bindingFixturePath,
  readinessFixturePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const rawDocs = readText(docsPath);
const docs = normalize(rawDocs);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(readText(packagePath));
const index = readText(indexPath);
const assistedDocs = normalize(readText(assistedDocsPath));
const browserDocs = normalize(readText(browserDocsPath));
const e2eSmokeSource = readText(e2eSmokePath);
const routeSources = {
  "route:/api/research-retrieval/final-rag-answer": readText(finalCandidateRoutePath),
  "route:/api/research-retrieval/final-rag-answer/review-memory": readText(bindingRoutePath),
  "route:/api/research-candidate-review/review-records": readText(reviewMemoryListRoutePath),
  "route:/api/research-candidate-review/review-records/[review_record_id]": readText(
    reviewMemoryDetailRoutePath,
  ),
  "route:/api/research-candidate-review/review-records/[review_record_id]/activity": readText(
    reviewMemoryActivityRoutePath,
  ),
  "route:/api/perspective/promotion/readiness-packet": readText(readinessRoutePath),
};

assertDocsFixturePackageAndIndex();
assertReferenceBoundaries();
assertPublicSafePolicy();
assertChangedFileScope();

const finalCandidateRoute = await import(pathToFileURL(finalCandidateRoutePath).href);
const bindingRoute = await import(pathToFileURL(bindingRoutePath).href);
const readinessRoute = await import(pathToFileURL(readinessRoutePath).href);
const reviewMemoryListRoute = await import(pathToFileURL(reviewMemoryListRoutePath).href);
const reviewMemoryDetailRoute = await import(pathToFileURL(reviewMemoryDetailRoutePath).href);
const reviewMemoryActivityRoute = await import(pathToFileURL(reviewMemoryActivityRoutePath).href);
const retrievalStore = await import(pathToFileURL(retrievalStorePath).href);
const retrievalRebuild = await import(pathToFileURL(retrievalRebuildPath).href);
const reviewMemoryStore = await import(pathToFileURL(reviewMemoryStorePath).href);
const runtimeAuditStore = await import(pathToFileURL(runtimeAuditStorePath).href);

const ragContextFixture = JSON.parse(readText(ragContextFixturePath));
const finalCandidateFixture = JSON.parse(readText(finalCandidateFixturePath));
const bindingFixture = JSON.parse(readText(bindingFixturePath));
const readinessFixture = JSON.parse(readText(readinessFixturePath));

rmSync(retrievalTempRoot, { recursive: true, force: true });
rmSync(reviewMemoryTempRoot, { recursive: true, force: true });
rmSync(dirname(auditDbPath), { recursive: true, force: true });
process.on("exit", () => {
  rmSync(retrievalTempRoot, { recursive: true, force: true });
  rmSync(reviewMemoryTempRoot, { recursive: true, force: true });
  rmSync(dirname(auditDbPath), { recursive: true, force: true });
});

seedRetrievalIndexDb();
const externalIoGuard = installExternalIoGuard();
let pathResult;
let healthcheckResult;
let auditCoverageResult;
try {
  pathResult = await runAuditedOperatorPath();
  healthcheckResult = await runReadonlyStoreHealthcheck(pathResult.candidateResult);
  auditCoverageResult = validateSelectedRouteAuditCoverage(pathResult.auditResults);
} finally {
  externalIoGuard.restore();
}

assert.equal(externalIoGuard.externalAttempts().length, 0, "external IO attempts must be zero");
assert.equal(healthcheckResult.final_status, "pass");
assert.equal(auditCoverageResult.final_status, "pass");
assertNoForbiddenAuthorityObserved(pathResult.observedAuthorityFlags);

const optionalRouteChanges = changedFiles().filter((filePath) =>
  optionalAuditInstrumentationPaths.has(filePath),
);
const auditGapFound = false;
const auditGapFixed = false;
assert.deepEqual(optionalRouteChanges, [], "no runtime audit route changes expected in this slice");

const summary = {
  validation_name: validationName,
  validation_version: validationVersion,
  scope,
  checked_surfaces: checkedSurfaces,
  server_side_no_external_io: {
    final_status: "pass",
    guarded_primitives: guardedPrimitives,
    bounded_node_process_validation_only: true,
    full_os_level_egress_proof: false,
    deterministic_mock_provider_path: true,
    existing_retrieval_index_test_setup_only: true,
  },
  readonly_store_healthcheck: healthcheckResult.summary,
  selected_route_audit_coverage: auditCoverageResult.coverage,
  external_io_attempt_count: externalIoGuard.externalAttempts().length,
  external_io_attempts_public_safe: externalIoGuard.externalAttempts(),
  local_loopback_allowed: true,
  live_provider_calls_observed: false,
  source_fetch_observed: false,
  github_or_release_observed: false,
  product_write_observed: false,
  promotion_execution_observed: false,
  promotion_decision_write_observed: false,
  proof_or_evidence_observed: false,
  durable_state_write_observed: false,
  formation_receipt_write_observed: false,
  accepted_evidence_ref_write_observed: false,
  product_id_allocation_observed: false,
  audit_gap_found: auditGapFound,
  audit_gap_fixed: auditGapFixed,
  audit_routes_changed: optionalRouteChanges,
  known_limitations: fixture.known_limitations,
  human_signoff_completed: false,
  final_status: "pass",
};

assertNoUnsafeText(JSON.stringify(summary), "public summary");
rmSync(retrievalTempRoot, { recursive: true, force: true });
rmSync(reviewMemoryTempRoot, { recursive: true, force: true });
rmSync(dirname(auditDbPath), { recursive: true, force: true });

console.log(JSON.stringify(summary, null, 2));

function assertDocsFixturePackageAndIndex() {
  assert.equal(fixture.fixture_version, fixtureVersion);
  assert.equal(fixture.scope, scope);
  assert.equal(fixture.validation_ref, validationRef);
  assert.equal(fixture.human_signoff_completed, false);
  assert.equal(fixture.next_recommended_slice, "human_spot_review_of_assisted_manual_qa_v0_1");
  assert.deepEqual(fixture.checked_surfaces, checkedSurfaces);
  assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);

  for (const pointer of [
    docsPath,
    fixturePath,
    smokePath,
    packageScriptName,
    validationRef,
    "human_spot_review_of_assisted_manual_qa_v0_1",
  ]) {
    assertIncludes(index, pointer, `latest index pointer ${pointer}`);
  }

  for (const phrase of [
    "This is a backend safety validation bundle.",
    "server-side no-external-IO validation",
    "backend read-only store/schema/path healthcheck",
    "selected-route audit coverage validation",
    "PR #852 browser-validated",
    "browser-observed request boundaries",
    "PR #855 added",
    "not human QA signoff",
    "Smoke/CI/browser/server-side pass is not truth.",
    "not full OS-level egress proof",
    "adds no runtime authority",
    "does not add broad all-route audit instrumentation",
    "does not add global middleware",
    "does not add raw telemetry capture",
    "adds no API routes unless a narrow audit gap is explicitly found and fixed",
    "adds no UI behavior changes",
    "does not call live providers",
    "does not fetch sources",
    "does not call GitHub or release routes",
    "does not execute promotion",
    "does not write promotion decisions",
    "does not use/write the promotion decision store",
    "does not create proof/evidence",
    "does not write durable state",
    "does not write Formation Receipts",
    "does not product-write",
    "does not write accepted evidence refs",
    "does not allocate product IDs",
    "Audit events are bounded metadata only.",
    "Audit events are not truth, proof, approval, durable state, product authority",
    "No selected-route audit gap was found",
  ]) {
    assertIncludes(docs, normalize(phrase), `docs phrase ${phrase}`);
  }

  for (const primitive of guardedPrimitives) {
    assert.ok(
      fixture.expected_guarded_primitives.includes(primitive),
      `fixture primitive ${primitive}`,
    );
    assertIncludes(rawDocs, primitive, `docs primitive ${primitive}`);
  }
}

function assertReferenceBoundaries() {
  assertIncludes(browserDocs, "Allowed browser-observed API requests", "#852 browser limitation");
  assertIncludes(browserDocs, "not server-side outbound network instrumentation", "#852 server limitation");
  assertIncludes(assistedDocs, "not human QA signoff", "#855 human-signoff boundary");
  assertIncludes(assistedDocs, "human_signoff_completed: false", "#855 human-signoff field");
  assertIncludes(e2eSmokeSource, "direct_route_handlers", "#851 direct route-handler validation");

  for (const [routeRef, source] of Object.entries(routeSources)) {
    assertIncludes(source, "maybeWriteRuntimeRouteAuditEventV01", `${routeRef} audit hook`);
    assertIncludes(source, "audit_event_result", `${routeRef} audit result`);
    assert.equal(source.includes("raw_request_body"), false, `${routeRef} raw request body`);
    assert.equal(source.includes("raw_response_body"), false, `${routeRef} raw response body`);
  }

  assertIncludes(
    readText(routeAuditInstrumentationPath),
    "primary_route_not_failed_by_audit",
    "audit failure nonfatal",
  );
  assertIncludes(readText(runtimeAuditStorePath), "audit_event_is_truth", "audit truth boundary");
}

function assertPublicSafePolicy() {
  for (const key of [
    "raw_request_bodies_allowed",
    "raw_response_bodies_allowed",
    "raw_route_outputs_allowed",
    "raw_db_rows_allowed",
    "raw_provider_output_allowed",
    "raw_prompt_text_allowed",
    "raw_retrieval_output_allowed",
    "raw_source_bodies_allowed",
    "terminal_logs_allowed",
    "private_paths_allowed",
    "real_secrets_allowed",
    "real_provider_ids_allowed",
    "real_product_ids_allowed",
    "github_payloads_allowed",
    "release_payloads_allowed",
    "browser_session_dumps_allowed",
    "hidden_reasoning_allowed",
    "smoke_ci_browser_server_side_pass_is_truth",
  ]) {
    assert.equal(fixture.public_safe_fixture_policy[key], false, `fixture blocks ${key}`);
  }
  assertNoUnsafeText(rawDocs, "docs");
  assertNoUnsafeText(fixtureText, "fixture");
}

function seedRetrievalIndexDb() {
  mkdirSync(dirname(retrievalDbPath), { recursive: true });
  const db = new Database(retrievalDbPath);
  try {
    retrievalStore.ensureResearchRetrievalIndexSchemaV01(db);
    const input = {
      ...ragContextFixture.safe_search_seed_rebuild_input_example,
      db_path: retrievalDbPath,
    };
    const result = retrievalRebuild.rebuildResearchRetrievalIndexV01(input, db);
    assert.equal(result.status, "rebuilt");
  } finally {
    db.close();
  }
}

async function runAuditedOperatorPath() {
  const auditResults = {};
  const observedAuthorityFlags = [];

  const candidateResponse = await callJson(
    finalCandidateRoute.POST(
      localPostRequest("http://localhost:3000/api/research-retrieval/final-rag-answer", {
        route_version: finalCandidateRouteVersion,
        scope,
        input: finalCandidateInput(),
        audit_db_path: auditDbPath,
      }),
    ),
    200,
    "final candidate route",
  );
  assert.equal(candidateResponse.result.status, "final_answer_candidate_created");
  assert.equal(candidateResponse.result.provider_mode, "mock_provider");
  assert.equal(candidateResponse.result.provider_status, "mock_provider_completed");
  assertAuditResult(candidateResponse.audit_event_result, "route:/api/research-retrieval/final-rag-answer");
  auditResults["route:/api/research-retrieval/final-rag-answer"] = candidateResponse.audit_event_result;
  collectAuthorityFlags(candidateResponse, observedAuthorityFlags);
  collectAuthorityFlags(candidateResponse.result, observedAuthorityFlags);

  const bindingResponse = await callJson(
    bindingRoute.POST(
      localPostRequest(
        "http://localhost:3000/api/research-retrieval/final-rag-answer/review-memory",
        {
          route_version: bindingRouteVersion,
          scope,
          input: bindingInput(candidateResponse.result, reviewMemoryDbPath),
          audit_db_path: auditDbPath,
        },
      ),
    ),
    201,
    "binding route",
  );
  assert.equal(bindingResponse.result.status, "created");
  assertAuditResult(
    bindingResponse.audit_event_result,
    "route:/api/research-retrieval/final-rag-answer/review-memory",
  );
  auditResults["route:/api/research-retrieval/final-rag-answer/review-memory"] =
    bindingResponse.audit_event_result;
  collectAuthorityFlags(bindingResponse, observedAuthorityFlags);
  collectAuthorityFlags(bindingResponse.result, observedAuthorityFlags);

  const listResponse = await callJson(
    reviewMemoryListRoute.GET(
      localGetRequest(reviewMemoryListUrl({ audit: true, candidateRef: candidateResponse.result.answer_candidate_ref })),
    ),
    200,
    "Review Memory list route",
  );
  assert.equal(listResponse.result.status, "listed");
  assert.equal(listResponse.result.records.length, 1);
  assertAuditResult(listResponse.audit_event_result, "route:/api/research-candidate-review/review-records");
  auditResults["route:/api/research-candidate-review/review-records"] = listResponse.audit_event_result;
  collectAuthorityFlags(listResponse, observedAuthorityFlags);

  const detailResponse = await callJson(
    reviewMemoryDetailRoute.GET(localGetRequest(reviewMemoryDetailUrl({ audit: true })), {
      params: Promise.resolve({ review_record_id: encodeURIComponent(reviewRecordId) }),
    }),
    200,
    "Review Memory detail route",
  );
  assert.equal(detailResponse.result.status, "read");
  assertAuditResult(
    detailResponse.audit_event_result,
    "route:/api/research-candidate-review/review-records/[review_record_id]",
  );
  auditResults["route:/api/research-candidate-review/review-records/[review_record_id]"] =
    detailResponse.audit_event_result;
  collectAuthorityFlags(detailResponse, observedAuthorityFlags);

  const activityResponse = await callJson(
    reviewMemoryActivityRoute.GET(localGetRequest(reviewMemoryActivityUrl({ audit: true })), {
      params: Promise.resolve({ review_record_id: encodeURIComponent(reviewRecordId) }),
    }),
    200,
    "Review Memory activity route",
  );
  assert.equal(activityResponse.result.status, "read");
  assertAuditResult(
    activityResponse.audit_event_result,
    "route:/api/research-candidate-review/review-records/[review_record_id]/activity",
  );
  auditResults["route:/api/research-candidate-review/review-records/[review_record_id]/activity"] =
    activityResponse.audit_event_result;
  collectAuthorityFlags(activityResponse, observedAuthorityFlags);

  const readinessResponse = await callJson(
    readinessRoute.POST(
      localPostRequest("http://localhost:3000/api/perspective/promotion/readiness-packet", {
        route_version: readinessRouteVersion,
        scope,
        input: readinessInput(),
        audit_db_path: auditDbPath,
      }),
    ),
    200,
    "promotion readiness route",
  );
  assert.ok(["ready_for_operator_promotion_review", "needs_more_evidence"].includes(readinessResponse.result.status));
  assert.equal(readinessResponse.result.promotion_execution_observed, undefined);
  assert.equal(readinessResponse.result.promotion_executed, false);
  assertAuditResult(readinessResponse.audit_event_result, "route:/api/perspective/promotion/readiness-packet");
  auditResults["route:/api/perspective/promotion/readiness-packet"] = readinessResponse.audit_event_result;
  collectAuthorityFlags(readinessResponse, observedAuthorityFlags);
  collectAuthorityFlags(readinessResponse.result, observedAuthorityFlags);

  const auditDb = new Database(auditDbPath, { readonly: true, fileMustExist: true });
  try {
    assert.equal(runtimeAuditStore.runtimeAuditEventSchemaExistsV01(auditDb), true);
    const events = runtimeAuditStore.listRuntimeAuditEventsV01({ limit: 20 }, auditDb);
    assert.ok(events.length >= 6, "audit events should be written for selected route coverage");
    for (const event of events) assertPublicSafeAuditEvent(event);
  } finally {
    auditDb.close();
  }

  return {
    candidateResult: candidateResponse.result,
    auditResults,
    observedAuthorityFlags,
  };
}

async function runReadonlyStoreHealthcheck(candidateResult) {
  const invalidUrl = reviewMemoryListUrl({ dbPath: "../private/SAFE_MARKER_secret-token.sqlite" });
  const invalidListResponse = await callJson(
    reviewMemoryListRoute.GET(localGetRequest(invalidUrl)),
    400,
    "Review Memory invalid path list route",
  );
  assert.equal(invalidListResponse.error_code, "invalid_db_path");
  assertNoUnsafeEcho(invalidListResponse, "invalid list response");

  const missingParent = dirname(missingReviewMemoryDbPath);
  assert.equal(existsSync(missingParent), false, "missing DB parent starts absent");
  const missingListResponse = await callJson(
    reviewMemoryListRoute.GET(localGetRequest(reviewMemoryListUrl({ dbPath: missingReviewMemoryDbPath }))),
    404,
    "Review Memory missing DB list route",
  );
  assert.equal(missingListResponse.error_code, "db_missing");
  assert.equal(existsSync(missingReviewMemoryDbPath), false, "read-only list must not create missing DB");
  assert.equal(existsSync(missingParent), false, "read-only list must not create missing DB parent");

  mkdirSync(dirname(schemaMissingReviewMemoryDbPath), { recursive: true });
  const emptyDb = new Database(schemaMissingReviewMemoryDbPath);
  emptyDb.close();
  const schemaMissingListResponse = await callJson(
    reviewMemoryListRoute.GET(localGetRequest(reviewMemoryListUrl({ dbPath: schemaMissingReviewMemoryDbPath }))),
    400,
    "Review Memory schema-missing list route",
  );
  assert.equal(schemaMissingListResponse.error_code, "schema_missing");
  assertSchemaStillMissing(schemaMissingReviewMemoryDbPath);

  for (const [label, call] of [
    [
      "detail missing DB",
      () =>
        reviewMemoryDetailRoute.GET(localGetRequest(reviewMemoryDetailUrl({ dbPath: missingReviewMemoryDbPath })), {
          params: Promise.resolve({ review_record_id: encodeURIComponent(reviewRecordId) }),
        }),
    ],
    [
      "activity missing DB",
      () =>
        reviewMemoryActivityRoute.GET(localGetRequest(reviewMemoryActivityUrl({ dbPath: missingReviewMemoryDbPath })), {
          params: Promise.resolve({ review_record_id: encodeURIComponent(reviewRecordId) }),
        }),
    ],
  ]) {
    const response = await callJson(call(), 404, label);
    assert.equal(response.error_code, "db_missing");
  }

  for (const [label, call] of [
    [
      "detail schema-missing DB",
      () =>
        reviewMemoryDetailRoute.GET(
          localGetRequest(reviewMemoryDetailUrl({ dbPath: schemaMissingReviewMemoryDbPath })),
          { params: Promise.resolve({ review_record_id: encodeURIComponent(reviewRecordId) }) },
        ),
    ],
    [
      "activity schema-missing DB",
      () =>
        reviewMemoryActivityRoute.GET(
          localGetRequest(reviewMemoryActivityUrl({ dbPath: schemaMissingReviewMemoryDbPath })),
          { params: Promise.resolve({ review_record_id: encodeURIComponent(reviewRecordId) }) },
        ),
    ],
  ]) {
    const response = await callJson(call(), 400, label);
    assert.equal(response.error_code, "schema_missing");
    assertSchemaStillMissing(schemaMissingReviewMemoryDbPath);
  }

  const bindingInvalidPathResponse = await callJson(
    bindingRoute.POST(
      localPostRequest("http://localhost:3000/api/research-retrieval/final-rag-answer/review-memory", {
        route_version: bindingRouteVersion,
        scope,
        input: bindingInput(candidateResult, "../private/SAFE_MARKER_secret-token.sqlite"),
        audit_db_path: invalidAuditDbPath,
      }),
    ),
    400,
    "binding invalid Review Memory path",
  );
  assert.ok(
    ["blocked_invalid_input", "blocked_private_or_raw_payload"].includes(
      bindingInvalidPathResponse.error_code,
    ),
    "binding invalid path must fail closed",
  );
  assertNoUnsafeEcho(bindingInvalidPathResponse, "binding invalid path response");

  const readinessMissingResponse = await callJson(
    readinessRoute.POST(
      localPostRequest("http://localhost:3000/api/perspective/promotion/readiness-packet", {
        route_version: readinessRouteVersion,
        scope,
        input: readinessInput({ review_memory_db_path: missingReviewMemoryDbPath }),
        audit_db_path: invalidAuditDbPath,
      }),
    ),
    404,
    "readiness missing Review Memory DB",
  );
  assert.equal(readinessMissingResponse.error_code, "db_missing");
  assert.equal(existsSync(missingReviewMemoryDbPath), false);
  assertNoUnsafeEcho(readinessMissingResponse, "readiness missing response");

  const readinessSchemaMissingResponse = await callJson(
    readinessRoute.POST(
      localPostRequest("http://localhost:3000/api/perspective/promotion/readiness-packet", {
        route_version: readinessRouteVersion,
        scope,
        input: readinessInput({ review_memory_db_path: schemaMissingReviewMemoryDbPath }),
        audit_db_path: invalidAuditDbPath,
      }),
    ),
    400,
    "readiness schema-missing Review Memory DB",
  );
  assert.equal(readinessSchemaMissingResponse.error_code, "schema_missing");
  assertSchemaStillMissing(schemaMissingReviewMemoryDbPath);
  assertNoUnsafeEcho(readinessSchemaMissingResponse, "readiness schema response");

  const noAuditCandidateResponse = await callJson(
    finalCandidateRoute.POST(
      localPostRequest("http://localhost:3000/api/research-retrieval/final-rag-answer", {
        route_version: finalCandidateRouteVersion,
        scope,
        input: finalCandidateInput({
          answer_request_id: "final-rag-answer-request:backend-safety-no-audit",
        }),
      }),
    ),
    200,
    "candidate route without audit DB",
  );
  assert.equal(noAuditCandidateResponse.audit_event_result.status, "audit_not_requested");

  const invalidAuditCandidateResponse = await callJson(
    finalCandidateRoute.POST(
      localPostRequest("http://localhost:3000/api/research-retrieval/final-rag-answer", {
        route_version: finalCandidateRouteVersion,
        scope,
        input: finalCandidateInput({
          answer_request_id: "final-rag-answer-request:backend-safety-invalid-audit",
        }),
        audit_db_path: invalidAuditDbPath,
      }),
    ),
    200,
    "candidate route with invalid audit DB",
  );
  assert.equal(invalidAuditCandidateResponse.audit_event_result.status, "audit_skipped_invalid_db_path");

  const rows = countReviewMemoryRows(reviewMemoryDbPath);
  assert.equal(rows.records, 1, "read-only checks must not create extra Review Memory records");
  assert.equal(rows.activities, 1, "read-only checks must not create extra Review Memory activity");

  return {
    final_status: "pass",
    summary: {
      final_status: "pass",
      invalid_db_paths_rejected: true,
      private_absolute_traversal_url_token_like_paths_rejected: true,
      unsafe_path_not_echoed: true,
      db_missing_without_file_or_directory_create: true,
      schema_missing_without_schema_ensure: true,
      read_only_surfaces_do_not_create_db_file_or_directory: true,
      read_only_surfaces_do_not_create_schema: true,
      read_only_surfaces_do_not_create_review_memory_row: true,
      read_only_surfaces_do_not_create_activity: true,
      promotion_readiness_read_only_open_checked: true,
      runtime_audit_invalid_path_nonfatal: true,
      retrieval_index_usage_test_setup_only: true,
      raw_db_rows_echoed: false,
    },
  };
}

function validateSelectedRouteAuditCoverage(auditResults) {
  const coverage = checkedSurfaces
    .filter((surface) => surface.startsWith("route:"))
    .map((routeRef) => {
      const auditResult = auditResults[routeRef];
      assertAuditResult(auditResult, routeRef);
      return {
        route_ref: routeRef,
        audit_covered: true,
        audit_optional_missing_db_nonfatal: true,
        audit_failure_nonfatal: true,
        no_raw_request_response_body: true,
        no_raw_provider_output: true,
        no_raw_retrieval_output: true,
        no_raw_db_rows: true,
        audit_event_not_truth_proof_approval_state_product: true,
        missing_or_deferred: false,
      };
    });
  return { final_status: "pass", coverage };
}

function finalCandidateInput(overrides = {}) {
  const base = structuredClone(finalCandidateFixture.valid_mock_provider_request);
  return {
    ...base,
    ...overrides,
    answer_request_id:
      overrides.answer_request_id ?? "final-rag-answer-request:backend-safety-validation",
    requested_by: "operator:backend-safety-validation",
    requested_at: "2026-06-29T00:00:00.000Z",
    rag_context_preview_request: {
      ...base.rag_context_preview_request,
      ...(overrides.rag_context_preview_request ?? {}),
      db_path: retrievalDbPath,
      preview_request_id:
        overrides.rag_context_preview_request?.preview_request_id ??
        "rag-context-preview-request:backend-safety-validation",
    },
  };
}

function bindingInput(candidateResult, dbPath) {
  const base = structuredClone(bindingFixture.valid_binding_request);
  return {
    ...base,
    binding_request_id: `final-rag-review-memory-binding:${hashPublicRef(dbPath)}`,
    requested_by: "operator:backend-safety-validation",
    requested_at: "2026-06-29T00:00:00.000Z",
    review_memory_db_path: dbPath,
    idempotency_key: reviewRecordId,
    final_answer_candidate_result: candidateResult,
    operator_review_payload: {
      ...base.operator_review_payload,
      operator_actor_ref: "operator:backend-safety-validation",
      reviewer_note_summary:
        "Keep this bounded final answer candidate as Review Memory for backend safety validation.",
      authority_boundary_acknowledged: true,
    },
  };
}

function readinessInput(overrides = {}) {
  const base = structuredClone(readinessFixture.valid_request);
  return {
    ...base,
    ...overrides,
    readiness_packet_request_id:
      overrides.readiness_packet_request_id ?? "promotion-readiness-request:backend-safety-validation",
    requested_by: "operator:backend-safety-validation",
    requested_at: "2026-06-29T00:00:00.000Z",
    review_memory_db_path: overrides.review_memory_db_path ?? reviewMemoryDbPath,
    review_record_id: reviewRecordId,
  };
}

function reviewMemoryListUrl(options = {}) {
  const url = new URL("http://localhost:3000/api/research-candidate-review/review-records");
  url.searchParams.set("route_version", reviewMemoryRouteVersion);
  url.searchParams.set("scope", scope);
  url.searchParams.set("db_path", options.dbPath ?? reviewMemoryDbPath);
  if (options.candidateRef) url.searchParams.set("candidate_ref", options.candidateRef);
  if (options.audit) url.searchParams.set("audit_db_path", auditDbPath);
  return url;
}

function reviewMemoryDetailUrl(options = {}) {
  const url = new URL(
    `http://localhost:3000/api/research-candidate-review/review-records/${encodeURIComponent(reviewRecordId)}`,
  );
  url.searchParams.set("route_version", reviewMemoryRouteVersion);
  url.searchParams.set("scope", scope);
  url.searchParams.set("db_path", options.dbPath ?? reviewMemoryDbPath);
  if (options.audit) url.searchParams.set("audit_db_path", auditDbPath);
  return url;
}

function reviewMemoryActivityUrl(options = {}) {
  const url = new URL(
    `http://localhost:3000/api/research-candidate-review/review-records/${encodeURIComponent(reviewRecordId)}/activity`,
  );
  url.searchParams.set("route_version", reviewMemoryRouteVersion);
  url.searchParams.set("scope", scope);
  url.searchParams.set("db_path", options.dbPath ?? reviewMemoryDbPath);
  if (options.audit) url.searchParams.set("audit_db_path", auditDbPath);
  return url;
}

function localPostRequest(url, body) {
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost:3000",
    },
    body: JSON.stringify(body),
  });
}

function localGetRequest(url) {
  return new Request(url, {
    method: "GET",
    headers: {
      host: "localhost:3000",
    },
  });
}

async function callJson(responseOrPromise, expectedStatus, label) {
  const response = await responseOrPromise;
  assert.equal(response.status, expectedStatus, `${label} status`);
  const body = await response.json();
  assertNoUnsafeEcho(body, label);
  return body;
}

function installExternalIoGuard() {
  const attempts = [];
  const restoreFns = [];
  const modules = {
    http: require("node:http"),
    https: require("node:https"),
    net: require("node:net"),
    tls: require("node:tls"),
    dns: require("node:dns"),
  };

  patch(globalThis, "fetch", "globalThis.fetch", (...args) => blockAttempt("globalThis.fetch", args));
  patch(modules.http, "request", "http.request", (...args) => blockAttempt("http.request", args));
  patch(modules.http, "get", "http.get", (...args) => blockAttempt("http.get", args));
  patch(modules.https, "request", "https.request", (...args) => blockAttempt("https.request", args));
  patch(modules.https, "get", "https.get", (...args) => blockAttempt("https.get", args));
  patch(modules.net, "connect", "net.connect", (...args) => blockAttempt("net.connect", args));
  patch(modules.tls, "connect", "tls.connect", (...args) => blockAttempt("tls.connect", args));
  patch(modules.dns, "lookup", "dns.lookup", (...args) => blockAttempt("dns.lookup", args));
  patch(modules.dns, "resolve", "dns.resolve", (...args) => blockAttempt("dns.resolve", args));

  function patch(target, method, primitive, replacement) {
    if (!target || typeof target[method] !== "function") return;
    const original = target[method];
    target[method] = replacement;
    restoreFns.push(() => {
      target[method] = original;
    });
    assert.ok(guardedPrimitives.includes(primitive), `${primitive} should be declared`);
  }

  function blockAttempt(primitive, args) {
    const attempt = publicSafeAttempt(primitive, args);
    attempts.push(attempt);
    throw new Error(`Blocked server-side IO attempt: ${primitive}`);
  }

  return {
    restore() {
      for (const restore of restoreFns.reverse()) restore();
    },
    externalAttempts() {
      return attempts.filter((attempt) => !attempt.local_loopback);
    },
  };
}

function publicSafeAttempt(primitive, args) {
  const target = targetFromArgs(args);
  return {
    primitive,
    target,
    local_loopback: isLoopbackTarget(target),
  };
}

function targetFromArgs(args) {
  const first = args[0];
  if (typeof first === "string") return sanitizeTarget(first);
  if (first instanceof URL) return sanitizeTarget(`${first.protocol}//${first.host}`);
  if (typeof Request !== "undefined" && first instanceof Request) {
    const url = new URL(first.url);
    return sanitizeTarget(`${url.protocol}//${url.host}`);
  }
  if (first && typeof first === "object") {
    const value = first;
    const host = value.hostname ?? value.host ?? value.servername ?? "unknown-host";
    const port = value.port ? `:${String(value.port)}` : "";
    const protocol = value.protocol ?? "socket:";
    return sanitizeTarget(`${protocol}//${host}${port}`);
  }
  if (typeof first === "number") {
    const host = typeof args[1] === "string" ? args[1] : "unknown-host";
    return sanitizeTarget(`socket://${host}:${first}`);
  }
  return "unknown-target";
}

function sanitizeTarget(value) {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}`;
  } catch {
    return String(value)
      .replace(/\/Users\/[^/]+/g, "/Users/REDACTED")
      .replace(/\/home\/[^/]+/g, "/home/REDACTED")
      .replace(/([?&](?:token|key|secret|password)=)[^&]+/gi, "$1REDACTED")
      .slice(0, 160);
  }
}

function isLoopbackTarget(value) {
  return /^(https?:|socket:|dns:)?\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+)?$/i.test(
    value,
  );
}

function assertAuditResult(result, routeRef) {
  assert.ok(result, `${routeRef} audit result exists`);
  assert.ok(
    ["audit_event_created", "idempotent_existing"].includes(result.status),
    `${routeRef} audit result status`,
  );
  assert.equal(result.authority_boundary.selected_route_subset_only, true);
  assert.equal(result.authority_boundary.primary_route_failure_from_audit_now, false);
  assert.equal(result.authority_boundary.raw_request_body_stored_now, false);
  assert.equal(result.authority_boundary.raw_response_body_stored_now, false);
  assert.equal(result.authority_boundary.raw_provider_output_stored_now, false);
  assert.equal(result.authority_boundary.raw_retrieval_output_stored_now, false);
  assert.equal(result.authority_boundary.audit_event_is_truth, false);
  assert.equal(result.authority_boundary.audit_event_is_proof, false);
  assert.equal(result.authority_boundary.audit_event_is_approval, false);
  assert.equal(result.authority_boundary.audit_event_is_durable_state, false);
  assert.equal(result.authority_boundary.audit_event_is_product_write_authority, false);
}

function assertPublicSafeAuditEvent(event) {
  assertNoUnsafeEcho(event, "audit event");
  assert.equal(event.privacy_report.raw_request_body_stored_now, false);
  assert.equal(event.privacy_report.raw_response_body_stored_now, false);
  assert.equal(event.privacy_report.hidden_reasoning_stored_now, false);
  assert.equal(event.privacy_report.raw_provider_output_stored_now, false);
  assert.equal(event.privacy_report.raw_retrieval_output_stored_now, false);
  assert.ok(event.reason_codes.includes("audit_event_is_not_truth"));
  assert.ok(event.reason_codes.includes("audit_event_is_not_proof"));
  assert.ok(event.reason_codes.includes("audit_event_is_not_approval"));
  assert.ok(event.reason_codes.includes("audit_event_is_not_durable_state"));
  assert.ok(event.reason_codes.includes("audit_event_is_not_product_write_authority"));
}

function assertSchemaStillMissing(dbPath) {
  const db = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    assert.equal(reviewMemoryStore.researchCandidateReviewMemoryDbSchemaExistsV01(db), false);
  } finally {
    db.close();
  }
}

function countReviewMemoryRows(dbPath) {
  const db = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    return {
      records: Number(
        db.prepare("SELECT COUNT(*) AS count FROM research_candidate_review_records").get().count,
      ),
      activities: Number(
        db.prepare("SELECT COUNT(*) AS count FROM research_candidate_review_record_activity").get().count,
      ),
    };
  } finally {
    db.close();
  }
}

function collectAuthorityFlags(value, observed) {
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    if (forbiddenAuthorityKey(key) && nested === true) observed.push(key);
    if (nested && typeof nested === "object") collectAuthorityFlags(nested, observed);
  }
}

function assertNoForbiddenAuthorityObserved(flags) {
  const allowed = new Set([
    "provider_call_executed",
    "prompt_sent",
    "retrieval_executed",
    "rag_answer_generated",
    "final_answer_candidate_generated",
    "db_query_or_write_executed",
    "db_write_executed",
    "review_memory_written",
    "promotion_readiness_packet_generated",
    "no_product_write_claim",
  ]);
  const unexpected = flags.filter((flag) => !allowed.has(flag));
  assert.deepEqual(unexpected, [], "forbidden authority flags must remain false");
}

function forbiddenAuthorityKey(key) {
  return /provider_openai_call|source_fetch|retrieval_index_write|promotion_execut|promotion_decision|proof_or_evidence|claim_or_evidence|durable_state|formation_receipt|product_write|accepted_evidence_ref|product_id|github|git_write|release/.test(
    key,
  );
}

function assertNoUnsafeEcho(value, label) {
  assertNoUnsafeText(JSON.stringify(value), label);
}

function assertNoUnsafeText(text, label) {
  const allowed = text
    .replaceAll(".tmp/", "DOT_TMP/")
    .replaceAll("tmp/", "TMP/")
    .replaceAll("http://localhost:3000", "http://localhost:PORT")
    .replaceAll("https://localhost:3000", "https://localhost:PORT");
  for (const marker of [
    "/Users/",
    "/home/",
    "file://",
    "OPENAI_API_KEY",
    "GITHUB_TOKEN",
    "sk-",
    "ghp_",
    "BEGIN PRIVATE KEY",
    "BEGIN RSA PRIVATE KEY",
    "BEGIN OPENSSH PRIVATE KEY",
    "provider_thread_id",
    "product_id:",
    "SAFE_MARKER_",
  ]) {
    assert.equal(allowed.includes(marker), false, `${label} must not contain ${marker}`);
  }
}

function assertChangedFileScope() {
  const changed = changedFiles();
  const unexpected = changed
    .filter((filePath) => !expectedChangedFiles.has(filePath))
    .filter((filePath) => !optionalAuditInstrumentationPaths.has(filePath))
    .sort();
  assert.deepEqual(
    unexpected,
    [],
    "changed-file scope limited to backend safety validation files plus exact old-smoke compatibility exceptions",
  );

  const optionalChanged = changed.filter((filePath) => optionalAuditInstrumentationPaths.has(filePath));
  if (optionalChanged.length > 0) {
    assertIncludes(rawDocs, "audit gap is explicitly found and fixed", "docs justify route instrumentation");
  }
}

function changedFiles() {
  const changed = new Set();
  for (const args of [
    ["diff", "--name-only"],
    ["ls-files", "--others", "--exclude-standard"],
    ["diff", "--name-only", "--cached"],
  ]) {
    for (const filePath of runGitLines(args)) {
      if (!isTempSmokeArtifact(filePath)) changed.add(filePath);
    }
  }
  for (const args of [
    ["diff", "--name-only", "origin/main...HEAD"],
    ["diff", "--name-only", "main...HEAD"],
  ]) {
    const lines = runGitLines(args, { allowFailure: true });
    for (const filePath of lines) {
      if (!isTempSmokeArtifact(filePath)) changed.add(filePath);
    }
    if (lines.length > 0) break;
  }
  return [...changed].sort();
}

function isTempSmokeArtifact(filePath) {
  return filePath.startsWith(".tmp/") || filePath.startsWith("tmp/");
}

function runGitLines(args, options = {}) {
  try {
    return execFileSync("git", args, { cwd: process.cwd(), encoding: "utf8" })
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (error) {
    if (options.allowFailure) return [];
    throw error;
  }
}

function hashPublicRef(value) {
  return String(value)
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function assertIncludes(text, phrase, label) {
  assert.ok(text.includes(phrase), `${label} must include ${phrase}`);
}

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

function normalize(value) {
  return value.replace(/\s+/g, " ").trim();
}
