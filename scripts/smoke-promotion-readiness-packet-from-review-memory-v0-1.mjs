#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const docsPath = "docs/PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_V0_1.md";
const fixturePath = "fixtures/promotion-readiness-packet-from-review-memory.sample.v0.1.json";
const typePath = "types/promotion-readiness-packet-from-review-memory.ts";
const helperPath = "lib/perspective/promotion/promotion-readiness-packet-from-review-memory.ts";
const routePath = "app/api/perspective/promotion/readiness-packet/route.ts";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const auditStorePath = "lib/runtime-audit/audit-event-store.ts";
const v06AuditPath = "docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_6.md";
const finalUiDocsPath = "docs/FINAL_ANSWER_CANDIDATE_REVIEW_UI_BINDING_V0_1.md";
const finalBindingDocsPath = "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_V0_1.md";
const finalRagDocsPath = "docs/FINAL_RAG_ANSWER_GENERATION_CANDIDATE_REVIEW_V0_1.md";
const reviewMemoryStoreDocsPath =
  "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_STORE_RUNTIME_COMPLETION_V0_1.md";
const reviewMemoryRoutesDocsPath =
  "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_ROUTES_RUNTIME_COMPLETION_V0_1.md";
const reviewMemoryStorePath = "lib/research-candidate-review/review-memory-db-store.ts";
const reviewMemoryRouteContractPath =
  "lib/research-candidate-review/review-memory-db-route-contract.ts";
const promotionContractDocsPath = "docs/PERSPECTIVE_PROMOTION_RUNTIME_V0_1.md";
const promotionContractTypePath = "types/perspective-promotion-runtime-contract.ts";
const promotionDecisionStorePath = "lib/perspective/promotion/promotion-decision-store.ts";
const productWriteDocsPath = "docs/PRODUCT_WRITE_ACCEPTED_EVIDENCE_REF_RUNTIME_V0_1.md";
const privacyGuardDocsPath = "docs/PRIVACY_REDACTION_RUNTIME_GUARD_V0_1.md";
const runtimeAuditDocsPath = "docs/RUNTIME_AUDIT_PANEL_RUNTIME_COMPLETION_V0_1.md";

const packageScriptName = "smoke:promotion-readiness-packet-from-review-memory-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-promotion-readiness-packet-from-review-memory-v0-1.mjs";
const runtimeVersion = "promotion_readiness_packet_from_review_memory.v0.1";
const requestVersion = "promotion_readiness_packet_from_review_memory_request.v0.1";
const resultVersion = "promotion_readiness_packet_from_review_memory_result.v0.1";
const routeVersion = "promotion_readiness_packet_from_review_memory_route.v0.1";
const runtimeRef = "promotion_readiness_packet_from_review_memory_v0_1";
const scope = "project:augnes";
const tempRoot = `.tmp/research-candidate-review-memory/promotion-readiness-packet-smoke-${process.pid}`;
const dbPath = `${tempRoot}/review-memory.sqlite`;
const emptyDbPath = `${tempRoot}/empty-schema.sqlite`;
const missingDbPath = `${tempRoot}/missing/review-memory.sqlite`;
const auditDbPath = `.tmp/runtime-audit/promotion-readiness-packet-smoke-${process.pid}.sqlite`;
const invalidAuditDbPath = "../runtime-audit/promotion-readiness-packet.sqlite";

const expectedChangedFiles = new Set([
  typePath,
  helperPath,
  routePath,
  docsPath,
  fixturePath,
  "scripts/smoke-promotion-readiness-packet-from-review-memory-v0-1.mjs",
  packagePath,
  indexPath,
  auditStorePath,
  "scripts/smoke-final-answer-candidate-review-ui-binding-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-binding-v0-1.mjs",
  "scripts/smoke-final-rag-answer-generation-candidate-review-v0-1.mjs",
  "scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-6.mjs",
  "scripts/smoke-final-rag-answer-review-memory-end-to-end-operator-path-v0-1.mjs",
  "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_OPERATOR_BROWSER_VALIDATION_V0_1.md",
  "fixtures/final-rag-answer-review-memory-operator-browser-validation.sample.v0.1.json",
  "scripts/browser-validate-final-rag-answer-review-memory-operator-path-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-operator-browser-validation-v0-1.mjs",
  "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_OPERATOR_PATH_USABILITY_AUDIT_V0_1.md",
  "fixtures/final-rag-answer-review-memory-operator-path-usability-audit.sample.v0.1.json",
  "scripts/smoke-final-rag-answer-review-memory-operator-path-usability-audit-v0-1.mjs",
  "docs/OPERATOR_PATH_MANUAL_QA_RUNBOOK_V0_1.md",
  "fixtures/operator-path-manual-qa-runbook.sample.v0.1.json",
  "scripts/smoke-operator-path-manual-qa-runbook-v0-1.mjs",
  "docs/OPERATOR_PATH_ASSISTED_MANUAL_QA_EXECUTION_REPORT_V0_1.md",
  "fixtures/operator-path-assisted-manual-qa-execution-report.sample.v0.1.json",
  "scripts/assisted-execute-operator-path-manual-qa-v0-1.mjs",
  "scripts/smoke-operator-path-assisted-manual-qa-execution-report-v0-1.mjs",
  "docs/OPERATOR_PATH_BACKEND_SAFETY_VALIDATION_BUNDLE_V0_1.md",
  "fixtures/operator-path-backend-safety-validation-bundle.sample.v0.1.json",
  "scripts/smoke-operator-path-backend-safety-validation-bundle-v0-1.mjs",
  "docs/OPERATOR_PATH_HUMAN_REVIEW_PACKET_V0_1.md",
  "fixtures/operator-path-human-review-packet.sample.v0.1.json",
  "scripts/smoke-operator-path-human-review-packet-v0-1.mjs",
  "docs/OPERATOR_PATH_BACKEND_REMAINING_GAP_INVENTORY_V0_1.md",
  "fixtures/operator-path-backend-remaining-gap-inventory.sample.v0.1.json",
  "scripts/smoke-operator-path-backend-remaining-gap-inventory-v0-1.mjs",
  "docs/OPERATOR_PATH_PUBLIC_SAFE_ARTIFACT_INDEX_V0_1.md",
  "fixtures/operator-path-public-safe-artifact-index.sample.v0.1.json",
  "scripts/smoke-operator-path-public-safe-artifact-index-v0-1.mjs",
]);
const falseExecutionFlags = [
  "provider_call_executed",
  "prompt_sent",
  "retrieval_executed",
  "source_fetch_executed",
  "retrieval_index_write_executed",
  "review_memory_written",
  "promotion_executed",
  "promotion_decision_written",
  "promotion_decision_store_written",
  "formation_receipt_written",
  "durable_state_written",
  "durable_state_applied",
  "proof_or_evidence_created",
  "claim_or_evidence_written",
  "product_write_executed",
  "accepted_evidence_ref_write_executed",
  "product_id_allocated",
  "github_api_called",
  "git_write_executed",
  "release_executed",
];
const forbiddenBoundaryFalseFields = [
  "promotion_execution_now",
  "promotion_decision_record_write_now",
  "promotion_decision_store_write_now",
  "promotion_route_write_now",
  "promotion_decision_ui_now",
  "formation_receipt_write_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "accepted_evidence_ref_write_now",
  "product_write_now",
  "product_write_runtime_now",
  "product_write_adapter_enabled_now",
  "product_id_allocation_now",
  "broad_product_persistence_now",
  "product_persistence_now",
  "final_answer_generation_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "retrieval_execution_now",
  "source_fetch_now",
  "retrieval_index_write_now",
  "embedding_created_now",
  "vector_search_now",
  "review_memory_write_now",
  "review_record_create_now",
  "review_record_activity_write_now",
  "review_record_discard_now",
  "git_write_now",
  "github_api_call_now",
  "repository_file_write_now",
  "release_execution_now",
  "codex_execution_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_authority",
  "readiness_packet_is_promotion",
  "readiness_packet_is_proof",
  "readiness_packet_is_evidence",
  "readiness_packet_is_accepted_evidence",
  "readiness_packet_is_durable_state",
  "readiness_packet_is_product",
  "review_memory_is_truth",
  "review_memory_is_proof",
  "review_memory_is_accepted_evidence",
  "review_memory_is_durable_perspective_state",
  "final_answer_candidate_is_truth",
  "final_answer_candidate_is_proof",
  "source_ref_is_proof",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
];

for (const filePath of [
  docsPath,
  fixturePath,
  typePath,
  helperPath,
  routePath,
  packagePath,
  indexPath,
  auditStorePath,
  v06AuditPath,
  finalUiDocsPath,
  finalBindingDocsPath,
  finalRagDocsPath,
  reviewMemoryStoreDocsPath,
  reviewMemoryRoutesDocsPath,
  reviewMemoryStorePath,
  reviewMemoryRouteContractPath,
  promotionContractDocsPath,
  promotionContractTypePath,
  promotionDecisionStorePath,
  productWriteDocsPath,
  privacyGuardDocsPath,
  runtimeAuditDocsPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const docsText = readText(docsPath);
const normalizedDocs = normalize(docsText);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(readText(packagePath));
const indexText = readText(indexPath);
const typeSource = readText(typePath);
const helperSource = readText(helperPath);
const routeSource = readText(routePath);
const auditStoreSource = readText(auditStorePath);
const v06AuditText = readText(v06AuditPath);
const finalUiDocsText = readText(finalUiDocsPath);
const finalBindingDocsText = readText(finalBindingDocsPath);
const reviewMemoryStoreDocsText = readText(reviewMemoryStoreDocsPath);
const reviewMemoryRoutesDocsText = readText(reviewMemoryRoutesDocsPath);
const promotionContractDocsText = readText(promotionContractDocsPath);

const store = await import(pathToFileURL(reviewMemoryStorePath).href);
const route = await import(pathToFileURL(routePath).href);

rmSync(tempRoot, { recursive: true, force: true });
rmSync(auditDbPath, { force: true });
process.on("exit", () => {
  rmSync(tempRoot, { recursive: true, force: true });
  rmSync(auditDbPath, { force: true });
});

assertDocsFixturePackageAndIndex();
assertStaticBoundaries();
await assertRouteRuntimeBehavior();
assertChangedFileScope();

console.log(
  JSON.stringify(
    {
      smoke: "promotion-readiness-packet-from-review-memory-v0-1",
      final_status: "pass",
      runtime_version: runtimeVersion,
      request_version: requestVersion,
      result_version: resultVersion,
      route_version: routeVersion,
      scope,
    },
    null,
    2,
  ),
);

function assertDocsFixturePackageAndIndex() {
  assert.equal(fixture.fixture_version, "promotion_readiness_packet_from_review_memory.sample.v0.1");
  assert.equal(fixture.runtime_version, runtimeVersion);
  assert.equal(fixture.request_version, requestVersion);
  assert.equal(fixture.result_version, resultVersion);
  assert.equal(fixture.route_version, routeVersion);
  assert.equal(fixture.scope, scope);
  assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
  for (const pointer of [
    docsPath,
    fixturePath,
    typePath,
    helperPath,
    routePath,
    "scripts/smoke-promotion-readiness-packet-from-review-memory-v0-1.mjs",
    packageScriptName,
    runtimeRef,
    "promotion_readiness_packet_from_review_memory_runtime",
  ]) {
    assert.ok(indexText.includes(pointer), `latest index must include ${pointer}`);
  }
  for (const marker of [
    "v0_2_1_remaining_runtime_gap_audit_v0_6",
    "PR #848",
    "promotion_readiness_packet_from_review_memory_v0_1",
  ]) {
    assert.ok(v06AuditText.includes(marker), `v0.6 audit must include ${marker}`);
  }
  assert.ok(finalUiDocsText.includes("read/display-only"));
  assert.ok(finalBindingDocsText.includes("Review Memory is not truth."));
  assert.ok(reviewMemoryStoreDocsText.includes("Review memory is not truth."));
  assert.ok(reviewMemoryRoutesDocsText.includes("Review Memory"));
  assert.ok(promotionContractDocsText.includes("promotion_runtime"));
  for (const phrase of [
    "This slice implements `promotion_readiness_packet_from_review_memory_v0_1`.",
    "This packet is diagnostic only.",
    "It is not promotion execution",
    "It does not write promotion decision records.",
    "does not use or write the promotion decision store",
    "does not create proof/evidence",
    "does not write claim/evidence records",
    "does not write Formation Receipts",
    "does not write or apply durable Perspective state",
    "does not product-write",
    "does not write accepted evidence refs",
    "does not allocate product IDs",
    "does not generate final answers",
    "does not call providers",
    "does not send prompts",
    "does not execute retrieval",
    "does not fetch sources",
    "does not write retrieval indexes",
    "Review Memory is not truth",
    "Review Memory is not proof",
    "Review Memory is not accepted evidence",
    "Review Memory is not durable Perspective state",
    "Final answer candidate remains candidate-only",
    "Source refs are lineage pointers, not proof",
    "Readiness packet is diagnostic, not authority",
    "Operator must separately decide any future promotion",
    "Smoke/CI pass is not truth",
    "promotion_readiness_packet_from_review_memory_runtime",
  ]) {
    assert.ok(normalizedDocs.includes(normalize(phrase)), `docs must include ${phrase}`);
  }
  assert.ok(typeSource.includes("PromotionReadinessPacketFromReviewMemoryRequestV01"));
  assert.ok(typeSource.includes("promotion_decision_store_written: false"));
  assert.ok(auditStoreSource.includes("\"promotion_readiness_packet_from_review_memory_runtime\""));
  assertPublicSafeFixture();
}

function assertStaticBoundaries() {
  assert.equal(typeof route.POST, "function", "route exports POST");
  assert.equal(route.GET, undefined, "no GET route");
  assert.ok(routeSource.includes("requestHasResearchCandidateReviewMemoryDbRouteSameOriginBoundaryV01"));
  assert.ok(routeSource.includes("same_origin_required"));
  assert.ok(routeSource.includes("preflightPromotionReadinessPacketFromReviewMemoryV01"));
  assert.ok(routeSource.includes("fileMustExist: true"));
  assert.ok(routeSource.includes("readonly: true"));
  assert.ok(routeSource.includes("researchCandidateReviewMemoryDbSchemaExistsV01"));
  assert.ok(!routeSource.includes("mkdirSync"), "route must not mkdir");
  assert.ok(!routeSource.includes("ensureResearchCandidateReviewMemoryDbSchemaV01"), "route must not ensure schema");
  assert.ok(!routeSource.includes("export async function GET"), "no GET route");
  assert.ok(!helperSource.includes("promotion-decision-store"), "helper must not import promotion decision store");
  assert.ok(!routeSource.includes("promotion-decision-store"), "route must not import promotion decision store");
  for (const source of [routeSource, helperSource]) {
    assert.ok(!source.includes("createPromotionDecision"), "no promotion decision store create");
    assert.ok(!source.includes("createPerspectivePromotionDecision"), "no promotion decision write");
    assert.ok(!source.includes("createResearchCandidateReviewRecordV01"), "no Review Memory write");
    assert.ok(!source.includes("appendResearchCandidateReviewRecordActivityV01"), "no activity write");
    assert.ok(!source.includes("fetch("), "no source/provider fetch");
    assert.ok(!source.includes("OpenAI"), "no provider call path");
    assert.ok(!source.includes("product write implementation"), "no product-write path");
  }
}

async function assertRouteRuntimeBehavior() {
  const validInputValue = validInput({ review_memory_db_path: dbPath });
  const validBody = routeBody(validInputValue);
  const crossOrigin = await callJson(
    route.POST(new Request("http://localhost:3000/api/perspective/promotion/readiness-packet", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        host: "localhost:3000",
        origin: "https://example.invalid",
      },
      body: JSON.stringify(validBody),
    })),
    403,
  );
  assert.equal(crossOrigin.error_code, "same_origin_required");
  assert.equal(existsSync(dbPath), false, "cross-origin request must not create DB");

  setupReviewMemoryDb(dbPath, validInputValue.review_record_id);
  const ready = await callJson(route.POST(localPostRequest(validBody)), 200);
  assert.equal(ready.status, "ok");
  assert.equal(ready.error_code, null);
  assert.equal(ready.result.status, "ready_for_operator_promotion_review");
  assert.equal(ready.result.readiness_state, "ready_for_operator_promotion_review");
  assert.ok(ready.result.readiness_packet_ref.startsWith("promotion-readiness-packet:"));
  assert.equal(ready.result.review_record_ref, validInputValue.review_record_id);
  assert.deepEqual(ready.result.candidate_refs.sort(), fixture.expected_ready_packet.candidate_refs.sort());
  assert.deepEqual(ready.result.source_refs.sort(), fixture.expected_ready_packet.source_refs.sort());
  assert.ok(ready.result.readiness_gate_report.require_source_refs === "passed");
  assert.ok(ready.result.non_authority_notes.some((note) => note.includes("not promotion")));
  assert.ok(ready.result.operator_next_actions.length > 0);
  assert.equal(ready.result.promotion_readiness_packet_generated, true);
  assertFalseExecutionFlags(ready);
  assertFalseExecutionFlags(ready.result);
  assertAuthorityBoundary(ready.authority_boundary, {
    read_only_review_memory_db_query_now: true,
    review_memory_record_read_now: true,
    bounded_readiness_packet_now: true,
    gate_report_diagnostic_now: true,
  });
  assert.equal(countRows(dbPath).records, 1, "route must not write records");
  assert.equal(countRows(dbPath).activities, 1, "route must not write activity");

  const readyWithAudit = await callJson(
    route.POST(localPostRequest({ ...validBody, audit_db_path: auditDbPath })),
    200,
  );
  assert.equal(readyWithAudit.audit_event_result.status, "audit_event_created");
  assertAuditPublicSafe();

  const readyInvalidAudit = await callJson(
    route.POST(localPostRequest({ ...validBody, audit_db_path: invalidAuditDbPath })),
    200,
  );
  assert.equal(readyInvalidAudit.audit_event_result.status, "audit_skipped_invalid_db_path");
  assert.equal(readyInvalidAudit.result.status, "ready_for_operator_promotion_review");

  const missingSourceDb = `${tempRoot}/missing-source/review-memory.sqlite`;
  setupReviewMemoryDb(missingSourceDb, "review-memory:missing-source");
  deleteSourceRefsForRecord(missingSourceDb, "review-memory:missing-source");
  const missingSource = await callJson(
    route.POST(localPostRequest(routeBody(validInput({
      review_memory_db_path: missingSourceDb,
      review_record_id: "review-memory:missing-source",
      readiness_packet_request_id: "promotion-readiness-request:missing-source",
    })))),
    400,
  );
  assert.equal(missingSource.result.status, "blocked_missing_source_refs");
  assert.equal(missingSource.result.promotion_executed, false);

  const missingBoundaryDb = `${tempRoot}/missing-boundary/review-memory.sqlite`;
  setupReviewMemoryDb(missingBoundaryDb, "review-memory:missing-boundary", {
    boundary_acknowledgements: [],
  });
  const missingBoundary = await callJson(
    route.POST(localPostRequest(routeBody(validInput({
      review_memory_db_path: missingBoundaryDb,
      review_record_id: "review-memory:missing-boundary",
      readiness_packet_request_id: "promotion-readiness-request:missing-boundary",
    })))),
    400,
  );
  assert.equal(missingBoundary.result.status, "blocked_boundary_acknowledgements");

  const discardedDb = `${tempRoot}/discarded/review-memory.sqlite`;
  setupReviewMemoryDb(discardedDb, "review-memory:discarded", {
    lifecycle_state: "discarded",
    review_decision: "discard",
    discard_reason: "Discarded in bounded smoke setup for readiness degradation.",
  });
  const discarded = await callJson(
    route.POST(localPostRequest(routeBody(validInput({
      review_memory_db_path: discardedDb,
      review_record_id: "review-memory:discarded",
      readiness_packet_request_id: "promotion-readiness-request:discarded",
    })))),
    200,
  );
  assert.equal(discarded.result.status, "needs_more_evidence");
  assert.notEqual(discarded.result.status, "ready_for_operator_promotion_review");

  const missingDbDir = dirname(missingDbPath);
  assert.equal(existsSync(missingDbDir), false, "missing DB dir should not exist before call");
  const missingDb = await callJson(
    route.POST(localPostRequest(routeBody(validInput({
      review_memory_db_path: missingDbPath,
      readiness_packet_request_id: "promotion-readiness-request:db-missing",
    })))),
    404,
  );
  assert.equal(missingDb.result.status, "db_missing");
  assert.equal(existsSync(missingDbPath), false, "db_missing must not create file");
  assert.equal(existsSync(missingDbDir), false, "db_missing must not create directory");

  mkdirSync(dirname(emptyDbPath), { recursive: true });
  new Database(emptyDbPath).close();
  const schemaMissing = await callJson(
    route.POST(localPostRequest(routeBody(validInput({
      review_memory_db_path: emptyDbPath,
      readiness_packet_request_id: "promotion-readiness-request:schema-missing",
    })))),
    400,
  );
  assert.equal(schemaMissing.result.status, "schema_missing");
  assert.equal(tableExists(emptyDbPath, "research_candidate_review_records"), false, "schema_missing must not create schema");

  const notFound = await callJson(
    route.POST(localPostRequest(routeBody(validInput({
      review_memory_db_path: dbPath,
      review_record_id: "review-memory:not-found",
      readiness_packet_request_id: "promotion-readiness-request:not-found",
    })))),
    404,
  );
  assert.equal(notFound.result.status, "not_found");

  for (const testCase of fixture.blocked_authority_cases) {
    const blockedDbPath = `${tempRoot}/forbidden-${testCase.field}/review-memory.sqlite`;
    const blockedDbDir = dirname(blockedDbPath);
    const response = await callJson(
      route.POST(localPostRequest(routeBody(validInput({
        authority_boundary: {
          ...fixture.valid_request.authority_boundary,
          [testCase.field]: valueForBlockedLabel(testCase.blocked_value_label),
        },
        review_memory_db_path: blockedDbPath,
      })))),
      403,
    );
    assert.equal(response.result.status, testCase.expected_status);
    assert.ok(
      response.result.reason_codes.some((code) => code.includes("blocked_forbidden_authority") || code.includes("blocked_authority")),
      `${testCase.field} reason code must name blocked authority`,
    );
    assert.ok(
      response.result.failure_codes.some((code) => code.includes("blocked_forbidden_authority") || code.includes(testCase.field)),
      `${testCase.field} failure code must name blocked authority`,
    );
    assertFalseExecutionFlags(response);
    assertFalseExecutionFlags(response.result);
    assert.equal(existsSync(blockedDbPath), false, `${testCase.field} must not create DB file`);
    assert.equal(existsSync(blockedDbDir), false, `${testCase.field} must not create DB directory`);
  }

  for (const testCase of fixture.blocked_private_raw_key_cases) {
    const response = await callJson(
      route.POST(localPostRequest(routeBody(validInput({
        [testCase.blocked_key]: "bounded-looking public text",
        review_memory_db_path: `${tempRoot}/private-${testCase.blocked_key}/review-memory.sqlite`,
      })))),
      400,
    );
    assert.equal(response.result.status, testCase.expected_status);
    assert.equal(existsSync(`${tempRoot}/private-${testCase.blocked_key}`), false);
  }

  const invalidDbPath = await callJson(
    route.POST(localPostRequest(routeBody(validInput({
      review_memory_db_path: "../unsafe-review-memory.sqlite",
      readiness_packet_request_id: "promotion-readiness-request:invalid-db-path",
    })))),
    400,
  );
  assert.equal(invalidDbPath.result.status, "invalid_db_path");
  assertNoUnsafeEcho(invalidDbPath, "invalid DB path response");
}

function setupReviewMemoryDb(path, reviewRecordId, overrides = {}) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  try {
    store.ensureResearchCandidateReviewMemoryDbSchemaV01(db);
    const result = store.createResearchCandidateReviewRecordV01(
      createReviewMemoryRecordInput(reviewRecordId, overrides),
      db,
    );
    assert.equal(result.status, "created", `setup record ${reviewRecordId}`);
  } finally {
    db.close();
  }
}

function createReviewMemoryRecordInput(reviewRecordId, overrides = {}) {
  const sourceRefs = overrides.source_refs ?? [
    {
      source_surface: "manual_source_ref",
      source_ref: "source-ref:promotion-readiness-001",
      source_version: "final_rag_answer_generation_candidate_review.v0.1",
      public_safe: true,
    },
    {
      source_surface: "manual_source_ref",
      source_ref: "source-ref:promotion-readiness-002",
      source_version: "final_rag_answer_generation_candidate_review.v0.1",
      public_safe: true,
    },
  ];
  return {
    contract_version: "research_candidate_review_memory_contract.v0.1",
    scope,
    review_record_id: reviewRecordId,
    record_kind: "candidate_review_snapshot",
    lifecycle_state: "active",
    review_decision: "keep_for_review",
    review_action: "save_review_note",
    candidate_ref: "final-rag-answer-candidate:promotion-readiness-smoke",
    candidate_refs: [
      "final-rag-answer-candidate:promotion-readiness-smoke",
      "final-rag-answer-request:promotion-readiness-smoke",
      "rag-context-preview:promotion-readiness-smoke",
    ],
    source_refs: sourceRefs,
    related_record_refs: ["rag-context-preview:promotion-readiness-smoke"],
    reviewer_actor: "operator:promotion-readiness-smoke",
    operator_actor_ref: "operator:promotion-readiness-smoke",
    reviewer_note_summary: "Keep this final answer candidate Review Memory record for bounded readiness review.",
    bounded_summary: "Final answer candidate Review Memory snapshot for bounded readiness packet inspection. Candidate-only and non-authoritative.",
    boundary_acknowledgements: [
      "final_answer_candidate_not_truth",
      "final_answer_candidate_not_proof",
      "final_answer_candidate_not_accepted_evidence",
      "final_answer_candidate_not_promotion",
      "final_answer_candidate_not_product",
      "review_memory_not_truth",
      "review_memory_not_proof",
      "review_memory_not_accepted_evidence",
      "review_memory_not_durable_state",
      "source_refs_are_lineage_not_proof",
      "product_write_not_executed",
    ],
    privacy_report: {
      privacy_class: "public_safe",
      public_safe: true,
      raw_conversation_included: false,
      hidden_reasoning_included: false,
      raw_source_body_included: false,
      raw_candidate_payload_included: false,
      raw_provider_output_included: false,
      provider_thread_run_session_ids_included: false,
      private_urls_included: false,
      local_private_paths_included: false,
      secrets_included: false,
      raw_db_rows_included: false,
      raw_browser_dump_included: false,
      blocked_reason_codes: [],
    },
    authority_boundary: {
      review_memory_db_store_now: true,
      review_memory_is_truth: false,
      review_memory_is_proof: false,
      source_ref_is_proof: false,
      product_write_now: false,
      promotion_execution_now: false,
    },
    reason_codes: [
      "final_rag_answer_candidate_review_memory_binding_v0_1",
      "review_memory_not_truth",
      "source_refs_are_lineage_not_proof",
    ],
    created_at: "2026-06-29T00:00:00.000Z",
    updated_at: "2026-06-29T00:00:00.000Z",
    ...overrides,
  };
}

function validInput(overrides = {}) {
  return {
    ...structuredClone(fixture.valid_request),
    ...overrides,
    readiness_policy: {
      ...fixture.valid_request.readiness_policy,
      ...(overrides.readiness_policy ?? {}),
    },
    authority_boundary: {
      ...fixture.valid_request.authority_boundary,
      ...(overrides.authority_boundary ?? {}),
    },
  };
}

function routeBody(input) {
  return {
    route_version: routeVersion,
    scope,
    input,
  };
}

function localPostRequest(body) {
  return new Request("http://localhost:3000/api/perspective/promotion/readiness-packet", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost:3000",
    },
    body: JSON.stringify(body),
  });
}

async function callJson(responseOrPromise, expectedStatus = 200) {
  const response = await responseOrPromise;
  const json = await response.json();
  if (response.status !== expectedStatus) {
    console.error(JSON.stringify(json, null, 2));
  }
  assert.equal(response.status, expectedStatus, `HTTP status ${expectedStatus}`);
  assertNoUnsafeEcho(json, "route response");
  return json;
}

function valueForBlockedLabel(label) {
  if (label === "boolean_true") return true;
  if (label === "string_true") return "true";
  if (label === "numeric_one") return 1;
  if (label === "object_enabled") return { enabled: true };
  if (label === "array_enabled") return ["enabled"];
  if (label === "string_enabled") return "enabled";
  throw new Error(`Unhandled blocked value label ${label}`);
}

function assertAuditPublicSafe() {
  assert.ok(existsSync(auditDbPath), "audit DB should exist when requested");
  const db = new Database(auditDbPath, { readonly: true, fileMustExist: true });
  try {
    const rows = db.prepare("SELECT * FROM runtime_audit_events").all();
    assert.ok(rows.length >= 1, "audit event should be written");
    for (const row of rows) {
      assert.equal(row.event_surface, "promotion_readiness_packet_from_review_memory_runtime");
      assertNoUnsafeEcho(row, "audit event row");
    }
  } finally {
    db.close();
  }
}

function countRows(path) {
  const db = new Database(path, { readonly: true, fileMustExist: true });
  try {
    return {
      records: Number(db.prepare("SELECT COUNT(*) AS count FROM research_candidate_review_records").get().count),
      activities: Number(db.prepare("SELECT COUNT(*) AS count FROM research_candidate_review_record_activity").get().count),
    };
  } finally {
    db.close();
  }
}

function tableExists(path, tableName) {
  const db = new Database(path, { readonly: true, fileMustExist: true });
  try {
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(tableName);
    return Boolean(row);
  } finally {
    db.close();
  }
}

function deleteSourceRefsForRecord(path, reviewRecordId) {
  const db = new Database(path);
  try {
    db.prepare("DELETE FROM research_candidate_review_record_sources WHERE review_record_id = ?").run(reviewRecordId);
  } finally {
    db.close();
  }
}

function assertFalseExecutionFlags(value) {
  for (const field of falseExecutionFlags) {
    assert.equal(value[field], false, `${field} must be false`);
  }
}

function assertAuthorityBoundary(boundary, conditionalExpected = {}) {
  assert.ok(boundary && typeof boundary === "object", "authority boundary object");
  assert.equal(boundary.promotion_readiness_packet_from_review_memory_now, true);
  assert.equal(boundary.explicit_operator_readiness_packet_only, true);
  assert.equal(boundary.same_origin_post_route_now, true);
  assert.equal(boundary.source_refs_lineage_only, true);
  assert.equal(boundary.no_truth_language_required, true);
  assert.equal(boundary.no_proof_language_required, true);
  for (const [field, expected] of Object.entries(conditionalExpected)) {
    assert.equal(boundary[field], expected, `${field} conditional expected`);
  }
  for (const field of forbiddenBoundaryFalseFields) {
    assert.equal(boundary[field], false, `${field} must remain false`);
  }
}

function assertPublicSafeFixture() {
  const policy = fixture.public_safe_fixture_policy;
  assert.equal(policy.public_safe_symbolic_refs_only, true);
  assert.equal(policy.raw_provider_output_allowed, false);
  assert.equal(policy.raw_retrieval_output_allowed, false);
  assert.equal(policy.raw_source_body_allowed, false);
  assert.equal(policy.raw_db_rows_allowed, false);
  assert.equal(policy.hidden_reasoning_allowed, false);
  assert.equal(policy.github_payloads_allowed, false);
  assert.equal(policy.secrets_allowed, false);
  assert.equal(policy.smoke_or_ci_pass_is_truth, false);
  for (const marker of [
    "raw_provider_output",
    "raw_db_row",
    "hidden_reasoning",
    "github_payload",
  ]) {
    assert.ok(fixtureText.includes(marker), `fixture names blocked marker ${marker}`);
  }
  assertNoUnsafeEcho(JSON.stringify({
    valid_request: fixture.valid_request,
    expected_ready_packet: fixture.expected_ready_packet,
  }), "fixture safe content");
}

function assertChangedFileScope() {
  const output = execFileSync("git", ["diff", "--name-only"], { encoding: "utf8" });
  const changed = output.split("\n").map((line) => line.trim()).filter(Boolean);
  if (changed.length === 0) return;
  const unexpected = changed.filter((filePath) => !expectedChangedFiles.has(filePath)).sort();
  assert.deepEqual(unexpected, [], `unexpected changed files: ${unexpected.join(", ")}`);
}

function assertNoUnsafeEcho(value, label) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  for (const pattern of [
    /SAFE_MARKER_/i,
    /\/Users\//i,
    /\/home\//i,
    /file:\/\//i,
    /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)/i,
    /https?:\/\/[^/\s]*(?:private|internal|intranet|corp|\.local)[^/\s]*/i,
    /sk-[A-Za-z0-9]/i,
    /ghp_[A-Za-z0-9]/i,
    /github_pat_[A-Za-z0-9_]/i,
    /OPENAI_API_KEY/i,
    /GITHUB_TOKEN/i,
    /-----BEGIN (?:RSA |OPENSSH )?PRIVATE KEY-----/i,
  ]) {
    assert.ok(!pattern.test(text), `${label} must not echo unsafe material for ${pattern}`);
  }
}

function normalize(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function readText(path) {
  return readFileSync(path, "utf8");
}
