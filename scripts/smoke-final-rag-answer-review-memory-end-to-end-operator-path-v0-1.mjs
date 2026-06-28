#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const docsPath = "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_END_TO_END_OPERATOR_PATH_V0_1.md";
const fixturePath =
  "fixtures/final-rag-answer-review-memory-end-to-end-operator-path.sample.v0.1.json";
const smokePath =
  "scripts/smoke-final-rag-answer-review-memory-end-to-end-operator-path-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const finalCandidateDocsPath = "docs/FINAL_RAG_ANSWER_GENERATION_CANDIDATE_REVIEW_V0_1.md";
const finalCandidateFixturePath =
  "fixtures/final-rag-answer-generation-candidate-review.sample.v0.1.json";
const finalCandidateSmokePath =
  "scripts/smoke-final-rag-answer-generation-candidate-review-v0-1.mjs";
const finalCandidateRoutePath = "app/api/research-retrieval/final-rag-answer/route.ts";
const finalCandidateBuilderPath = "lib/research-retrieval/build-final-rag-answer-candidate.ts";
const finalCandidateProviderBoundaryPath =
  "lib/research-retrieval/final-rag-answer-provider-boundary.ts";
const finalCandidateTypePath = "types/final-rag-answer-candidate-review.ts";

const bindingDocsPath = "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_V0_1.md";
const bindingFixturePath = "fixtures/final-rag-answer-review-memory-binding.sample.v0.1.json";
const bindingSmokePath = "scripts/smoke-final-rag-answer-review-memory-binding-v0-1.mjs";
const bindingRoutePath = "app/api/research-retrieval/final-rag-answer/review-memory/route.ts";
const bindingHelperPath = "lib/research-retrieval/final-rag-answer-review-memory-binding.ts";
const bindingTypePath = "types/final-rag-answer-review-memory-binding.ts";

const uiDocsPath = "docs/FINAL_ANSWER_CANDIDATE_REVIEW_UI_BINDING_V0_1.md";
const uiFixturePath = "fixtures/final-answer-candidate-review-ui-binding.sample.v0.1.json";
const uiSmokePath = "scripts/smoke-final-answer-candidate-review-ui-binding-v0-1.mjs";
const uiComponentPath = "components/final-rag-answer-review-memory-panel.tsx";
const uiPagePath = "app/research-retrieval/final-rag-answer/review-memory/page.tsx";

const readinessDocsPath = "docs/PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_V0_1.md";
const readinessFixturePath =
  "fixtures/promotion-readiness-packet-from-review-memory.sample.v0.1.json";
const readinessSmokePath = "scripts/smoke-promotion-readiness-packet-from-review-memory-v0-1.mjs";
const readinessRoutePath = "app/api/perspective/promotion/readiness-packet/route.ts";
const readinessHelperPath =
  "lib/perspective/promotion/promotion-readiness-packet-from-review-memory.ts";
const readinessTypePath = "types/promotion-readiness-packet-from-review-memory.ts";
const promotionDecisionStorePath = "lib/perspective/promotion/promotion-decision-store.ts";

const reviewMemoryStoreDocsPath =
  "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_STORE_RUNTIME_COMPLETION_V0_1.md";
const reviewMemoryRoutesDocsPath =
  "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_ROUTES_RUNTIME_COMPLETION_V0_1.md";
const reviewMemoryStorePath = "lib/research-candidate-review/review-memory-db-store.ts";
const reviewMemoryRouteContractPath =
  "lib/research-candidate-review/review-memory-db-route-contract.ts";
const reviewMemoryRecordsRoutePath = "app/api/research-candidate-review/review-records/route.ts";

const v06AuditPath = "docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_6.md";
const promotionRuntimeDocsPath = "docs/PERSPECTIVE_PROMOTION_RUNTIME_V0_1.md";
const productWriteAcceptedEvidenceRefDocsPath =
  "docs/PRODUCT_WRITE_ACCEPTED_EVIDENCE_REF_RUNTIME_V0_1.md";
const privacyGuardDocsPath = "docs/PRIVACY_REDACTION_RUNTIME_GUARD_V0_1.md";
const runtimeAuditDocsPath = "docs/RUNTIME_AUDIT_PANEL_RUNTIME_COMPLETION_V0_1.md";
const ragContextFixturePath = "fixtures/rag-context-preview-runtime-completion.sample.v0.1.json";
const retrievalStorePath = "lib/research-retrieval/index-store.ts";
const retrievalRebuildPath = "lib/research-retrieval/rebuild-index.ts";

const packageScriptName =
  "smoke:final-rag-answer-review-memory-end-to-end-operator-path-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-final-rag-answer-review-memory-end-to-end-operator-path-v0-1.mjs";
const pathVersion = "final_rag_answer_review_memory_end_to_end_operator_path.sample.v0.1";
const runtimeRef = "final_rag_answer_review_memory_end_to_end_operator_path_v0_1";
const scope = "project:augnes";

const finalCandidateRouteVersion = "final_rag_answer_generation_candidate_review_route.v0.1";
const bindingRouteVersion = "final_rag_answer_review_memory_binding_route.v0.1";
const reviewMemoryRouteVersion = "research_candidate_review_memory_db_routes.v0.1";
const readinessRouteVersion = "promotion_readiness_packet_from_review_memory_route.v0.1";

const retrievalTempRoot =
  `.tmp/research-retrieval/final-rag-answer-review-memory-e2e-smoke-${process.pid}`;
const reviewMemoryTempRoot =
  `.tmp/research-candidate-review-memory/final-rag-answer-review-memory-e2e-smoke-${process.pid}`;
const retrievalDbPath = `${retrievalTempRoot}/retrieval-index.sqlite`;
const reviewMemoryDbPath = `${reviewMemoryTempRoot}/review-memory.sqlite`;
const reviewRecordId = "review-memory-binding:final-rag-answer:e2e-operator-path";

const expectedChangedFiles = new Set([
  docsPath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  "scripts/smoke-final-answer-candidate-review-ui-binding-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-binding-v0-1.mjs",
  "scripts/smoke-final-rag-answer-generation-candidate-review-v0-1.mjs",
  "scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-6.mjs",
]);

const requiredExistingFiles = [
  finalCandidateDocsPath,
  finalCandidateFixturePath,
  finalCandidateSmokePath,
  finalCandidateTypePath,
  finalCandidateBuilderPath,
  finalCandidateProviderBoundaryPath,
  finalCandidateRoutePath,
  bindingDocsPath,
  bindingFixturePath,
  bindingSmokePath,
  bindingTypePath,
  bindingHelperPath,
  bindingRoutePath,
  uiDocsPath,
  uiFixturePath,
  uiSmokePath,
  uiComponentPath,
  uiPagePath,
  readinessDocsPath,
  readinessFixturePath,
  readinessSmokePath,
  readinessTypePath,
  readinessHelperPath,
  readinessRoutePath,
  reviewMemoryStoreDocsPath,
  reviewMemoryRoutesDocsPath,
  reviewMemoryStorePath,
  reviewMemoryRouteContractPath,
  reviewMemoryRecordsRoutePath,
  promotionRuntimeDocsPath,
  promotionDecisionStorePath,
  productWriteAcceptedEvidenceRefDocsPath,
  privacyGuardDocsPath,
  runtimeAuditDocsPath,
  v06AuditPath,
  ragContextFixturePath,
  retrievalStorePath,
  retrievalRebuildPath,
];

for (const filePath of [docsPath, fixturePath, smokePath, packagePath, indexPath, ...requiredExistingFiles]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const docs = normalize(readText(docsPath));
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(readText(packagePath));
const index = readText(indexPath);
const finalCandidateFixture = JSON.parse(readText(finalCandidateFixturePath));
const bindingFixture = JSON.parse(readText(bindingFixturePath));
const readinessFixture = JSON.parse(readText(readinessFixturePath));
const ragContextFixture = JSON.parse(readText(ragContextFixturePath));
const finalCandidateDocs = normalize(readText(finalCandidateDocsPath));
const bindingDocs = normalize(readText(bindingDocsPath));
const uiDocs = normalize(readText(uiDocsPath));
const readinessDocs = normalize(readText(readinessDocsPath));
const v06Audit = readText(v06AuditPath);
const productWriteDocs = normalize(readText(productWriteAcceptedEvidenceRefDocsPath));
const uiComponent = readText(uiComponentPath);
const uiPage = readText(uiPagePath);
const readinessHelper = readText(readinessHelperPath);
const readinessRouteSource = readText(readinessRoutePath);
const smokeSource = readText(smokePath);

const finalCandidateRoute = await import(pathToFileURL(finalCandidateRoutePath).href);
const bindingRoute = await import(pathToFileURL(bindingRoutePath).href);
const reviewMemoryReadRoute = await import(pathToFileURL(reviewMemoryRecordsRoutePath).href);
const readinessRoute = await import(pathToFileURL(readinessRoutePath).href);
const retrievalStore = await import(pathToFileURL(retrievalStorePath).href);
const retrievalRebuild = await import(pathToFileURL(retrievalRebuildPath).href);

rmSync(retrievalTempRoot, { recursive: true, force: true });
rmSync(reviewMemoryTempRoot, { recursive: true, force: true });
process.on("exit", () => {
  rmSync(retrievalTempRoot, { recursive: true, force: true });
  rmSync(reviewMemoryTempRoot, { recursive: true, force: true });
});

assertDocsFixturePackageAndIndex();
assertPrerequisiteRuntimeReferences();
assertStaticNoAuthorityBoundaries();
seedRetrievalIndexDb();
await assertEndToEndOperatorPath();
assertChangedFileScope();
rmSync(retrievalTempRoot, { recursive: true, force: true });
rmSync(reviewMemoryTempRoot, { recursive: true, force: true });

console.log(
  JSON.stringify(
    {
      smoke: "final-rag-answer-review-memory-end-to-end-operator-path-v0-1",
      final_status: "pass",
      path_version: pathVersion,
      runtime_ref: runtimeRef,
      scope,
      route_stages: "direct_route_handlers",
      degraded_route_stages: [],
      skipped_live_provider_validation: true,
      skipped_browser_visual_validation: true,
    },
    null,
    2,
  ),
);

function assertDocsFixturePackageAndIndex() {
  assert.equal(fixture.path_version, pathVersion);
  assert.equal(fixture.scope, scope);
  assert.equal(fixture.runtime_ref, runtimeRef);
  assert.deepEqual(fixture.expected_runtime_sequence, [
    "final_rag_answer_generation_candidate_review_v0_1",
    "final_rag_answer_candidate_review_memory_binding_v0_1",
    "final_answer_candidate_review_ui_binding_v0_1",
    "promotion_readiness_packet_from_review_memory_v0_1",
  ]);
  assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);

  for (const pointer of [
    docsPath,
    fixturePath,
    smokePath,
    packageScriptName,
    runtimeRef,
    "final RAG answer candidate",
    "Review Memory binding",
    "Review Memory read/display surface",
    "promotion readiness packet",
  ]) {
    assertIncludes(index, pointer, `latest index pointer ${pointer}`);
  }

  for (const phrase of [
    "This slice implements `final_rag_answer_review_memory_end_to_end_operator_path_v0_1`.",
    "It validates an operator path only.",
    "It does not add new runtime authority.",
    "It does not add new API routes.",
    "It does not add UI behavior.",
    "It does not add DB schema.",
    "It does not create proof/evidence.",
    "It does not promote Perspective.",
    "It does not write promotion decisions.",
    "It does not use or write the promotion decision store.",
    "It does not write Formation Receipts.",
    "It does not write or apply durable Perspective state.",
    "It does not product-write.",
    "It does not write accepted evidence refs.",
    "It does not allocate product IDs.",
    "It does not call live providers.",
    "It does not execute live retrieval beyond the existing deterministic/mock/test setup path.",
    "It does not fetch sources.",
    "It does not execute Git/GitHub/release work.",
    "End-to-end readiness is not authority.",
    "Operator review remains required before any future promotion decision.",
    "Smoke/CI pass is not truth.",
    "Review Memory is not truth.",
    "Review Memory is not proof.",
    "Review Memory is not accepted evidence.",
    "Source refs remain lineage pointers, not proof.",
    "`product_write_accepted_evidence_ref_runtime_v0_1` remains first-target-only",
  ]) {
    assertIncludes(docs, normalize(phrase), `docs phrase ${phrase}`);
  }

  assertPublicSafeFixture();
}

function assertPrerequisiteRuntimeReferences() {
  for (const marker of [
    "promotion_readiness_packet_from_review_memory_v0_1",
    "PR #848",
  ]) {
    assertIncludes(v06Audit, marker, `#850/v0.6 prerequisite marker ${marker}`);
  }
  for (const phrase of [
    "Provider output remains candidate-only",
    "final_rag_answer_generation_candidate_review_v0_1",
  ]) {
    assertIncludes(finalCandidateDocs, normalize(phrase), `final candidate docs ${phrase}`);
  }
  for (const phrase of [
    "Review Memory is not truth.",
    "final_rag_answer_candidate_review_memory_binding_v0_1",
  ]) {
    assertIncludes(bindingDocs, normalize(phrase), `binding docs ${phrase}`);
  }
  assertIncludes(uiDocs, "read/display-only", "UI read/display-only docs");
  assertIncludes(readinessDocs, "does not use or write the promotion decision store", "readiness store boundary");
  assertIncludes(readinessDocs, "promotion_readiness_packet_from_review_memory_runtime", "readiness audit surface");
  assertIncludes(productWriteDocs, "first target", "accepted evidence ref first target boundary");
}

function assertStaticNoAuthorityBoundaries() {
  assert.equal(typeof finalCandidateRoute.POST, "function", "final candidate route POST");
  assert.equal(typeof bindingRoute.POST, "function", "binding route POST");
  assert.equal(typeof reviewMemoryReadRoute.GET, "function", "Review Memory read GET");
  assert.equal(typeof readinessRoute.POST, "function", "readiness route POST");

  assertIncludes(uiComponent, "data-read-display-only-ui-now", "UI read/display marker");
  assertIncludes(uiComponent, 'method: "GET"', "UI GET-only fetch");
  assert.equal(uiComponent.includes('method: "POST"'), false, "UI must not POST");
  assertIncludes(uiDocs, "GET-only route usage", "UI docs GET-only marker");
  assertIncludes(uiDocs, "no write controls", "UI docs no write controls marker");
  assertIncludes(uiPage, "FinalRagAnswerReviewMemoryPanel", "UI page renders existing panel");
  for (const marker of [
    "/Users/",
    "/home/",
    "file://",
    "https://private.example",
    "https://internal.example",
    "OPENAI_API_KEY",
    "GITHUB_TOKEN",
    "provider_thread_id",
    "raw-db-row",
  ]) {
    assertIncludes(uiComponent, marker, `UI sanitizer marker ${marker}`);
  }

  assert.equal(readinessHelper.includes("promotion-decision-store"), false);
  assert.equal(readinessRouteSource.includes("promotion-decision-store"), false);
  const promotionDecisionStoreImportNeedle = "pathToFileURL(" + "promotionDecisionStorePath";
  assert.equal(smokeSource.includes(promotionDecisionStoreImportNeedle), false);
  const liveFetchNeedle = "await " + "fetch(";
  assert.equal(smokeSource.includes(liveFetchNeedle), false, "E2E smoke must not fetch live sources");
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
    assert.equal(countRows(db, "research_retrieval_index_entries"), input.entries.length);
  } finally {
    db.close();
  }
}

async function assertEndToEndOperatorPath() {
  const candidateBody = {
    route_version: finalCandidateRouteVersion,
    scope,
    input: finalCandidateInput(),
  };
  const candidateResponse = await callJson(
    finalCandidateRoute.POST(
      localPostRequest("http://localhost:3000/api/research-retrieval/final-rag-answer", candidateBody),
    ),
    200,
    "final answer candidate route",
  );
  assert.equal(candidateResponse.status, "ok");
  assert.equal(candidateResponse.result.status, "final_answer_candidate_created");
  assert.equal(candidateResponse.result.provider_mode, "mock_provider");
  assert.equal(candidateResponse.result.provider_status, "mock_provider_completed");
  assert.equal(candidateResponse.result.final_answer_candidate_generated, true);
  assert.equal(candidateResponse.result.answer_review_state, "candidate_only");
  assert.equal(candidateResponse.result.no_truth_claim, true);
  assert.equal(candidateResponse.result.no_proof_claim, true);
  assert.equal(candidateResponse.result.no_accepted_evidence_claim, true);
  assert.equal(candidateResponse.result.no_promotion_claim, true);
  assert.equal(candidateResponse.result.no_product_write_claim, true);
  assert.equal(candidateResponse.result.provider_call_executed, true);
  assert.equal(candidateResponse.result.prompt_sent, true);
  assert.equal(candidateResponse.result.retrieval_executed, true);
  assert.equal(candidateResponse.result.rag_answer_generated, true);
  assert.equal(candidateResponse.result.proof_or_evidence_created, false);
  assert.equal(candidateResponse.result.claim_or_evidence_written, false);
  assert.equal(candidateResponse.result.promotion_executed, false);
  assert.equal(candidateResponse.result.durable_state_written, false);
  assert.equal(candidateResponse.result.durable_state_applied, false);
  assert.equal(candidateResponse.result.formation_receipt_written, false);
  assert.equal(candidateResponse.result.product_write_executed, false);
  assert.equal(candidateResponse.result.product_id_allocated, false);
  assert.equal(candidateResponse.accepted_evidence_ref_write_executed, false);
  assert.equal(candidateResponse.github_api_called, false);
  assert.equal(candidateResponse.git_write_executed, false);
  assert.equal(candidateResponse.release_executed, false);
  assertCandidateAuthorityBoundary(candidateResponse.result.authority_boundary);

  const bindingBody = {
    route_version: bindingRouteVersion,
    scope,
    input: bindingInput(candidateResponse.result),
  };
  const bindingResponse = await callJson(
    bindingRoute.POST(
      localPostRequest(
        "http://localhost:3000/api/research-retrieval/final-rag-answer/review-memory",
        bindingBody,
      ),
    ),
    201,
    "Review Memory binding route",
  );
  assert.equal(bindingResponse.status, "ok");
  assert.equal(bindingResponse.result.status, "created");
  assert.equal(bindingResponse.result.store_result.status, "created");
  assert.equal(bindingResponse.result.store_result.record.record_kind, "candidate_review_snapshot");
  assert.equal(bindingResponse.result.store_result.record.review_record_id, reviewRecordId);
  assert.equal(bindingResponse.result.review_memory_written, true);
  assert.equal(bindingResponse.review_memory_written, true);
  assertStageFalseFlags(bindingResponse, {
    review_memory_written: true,
    db_write_executed: true,
  });
  assertStageFalseFlags(bindingResponse.result, {
    review_memory_written: true,
    db_write_executed: true,
  });
  assertReviewMemoryRecordBoundary(bindingResponse.result.store_result.record);
  assert.equal(countReviewMemoryRows(reviewMemoryDbPath).records, 1);

  const readUrl = new URL("http://localhost:3000/api/research-candidate-review/review-records");
  readUrl.searchParams.set("route_version", reviewMemoryRouteVersion);
  readUrl.searchParams.set("scope", scope);
  readUrl.searchParams.set("db_path", reviewMemoryDbPath);
  readUrl.searchParams.set("candidate_ref", candidateResponse.result.answer_candidate_ref);
  const readResponse = await callJson(
    reviewMemoryReadRoute.GET(
      new Request(readUrl, {
        method: "GET",
        headers: {
          host: "localhost:3000",
        },
      }),
    ),
    200,
    "Review Memory GET route",
  );
  assert.equal(readResponse.status, "ok");
  assert.equal(readResponse.action, "list_review_records");
  assert.equal(readResponse.result.status, "listed");
  assert.equal(readResponse.result.records.length, 1);
  assert.equal(readResponse.result.records[0].review_record_id, reviewRecordId);
  assertReviewMemoryRecordBoundary(readResponse.result.records[0]);
  assert.equal(readResponse.authority_boundary.review_memory_db_routes_now, true);
  assert.equal(readResponse.authority_boundary.db_backed_review_memory_routes_now, true);
  assert.equal(readResponse.authority_boundary.db_query_or_write_now, true);
  assert.equal(readResponse.authority_boundary.product_write_now, false);
  assert.equal(readResponse.authority_boundary.promotion_execution_now, false);
  assert.equal(readResponse.authority_boundary.proof_or_evidence_record_now, false);

  const readinessBody = {
    route_version: readinessRouteVersion,
    scope,
    input: readinessInput(),
  };
  const readinessResponse = await callJson(
    readinessRoute.POST(
      localPostRequest("http://localhost:3000/api/perspective/promotion/readiness-packet", readinessBody),
    ),
    200,
    "promotion readiness packet route",
  );
  assert.equal(readinessResponse.status, "ok");
  assert.ok(
    fixture.expected_readiness_boundary.allowed_readiness_states.includes(readinessResponse.result.status),
    "readiness status must be bounded",
  );
  assert.equal(readinessResponse.result.promotion_readiness_packet_generated, true);
  assert.equal(readinessResponse.result.review_record_ref, reviewRecordId);
  if (readinessResponse.result.status === "ready_for_operator_promotion_review") {
    assert.equal(
      fixture.expected_readiness_boundary.ready_for_operator_promotion_review_means,
      "future_human_review_readiness_only",
    );
    assert.ok(
      readinessResponse.result.non_authority_notes.some((note) => note.includes("not promotion")),
      "ready status must carry non-authority note",
    );
    assert.ok(readinessResponse.result.operator_next_actions.length > 0);
  }
  assertReadinessFalseFlags(readinessResponse);
  assertReadinessFalseFlags(readinessResponse.result);
  assertReadinessBoundary(readinessResponse.authority_boundary);
  assertReadinessBoundary(readinessResponse.result.authority_boundary);
  assert.equal(countReviewMemoryRows(reviewMemoryDbPath).records, 1, "readiness route must not write records");
  assert.equal(countReviewMemoryRows(reviewMemoryDbPath).activities, 1, "readiness route must not write activity");
}

function finalCandidateInput(overrides = {}) {
  const base = structuredClone(finalCandidateFixture.valid_mock_provider_request);
  return {
    ...base,
    ...overrides,
    answer_request_id: overrides.answer_request_id ?? "final-rag-answer-request:e2e-operator-path",
    requested_by: "operator:final-rag-answer-e2e-smoke",
    requested_at: "2026-06-29T00:00:00.000Z",
    rag_context_preview_request: {
      ...base.rag_context_preview_request,
      ...(overrides.rag_context_preview_request ?? {}),
      db_path: retrievalDbPath,
      preview_request_id: "rag-context-preview-request:e2e-operator-path",
    },
  };
}

function bindingInput(candidateResult) {
  const base = structuredClone(bindingFixture.valid_binding_request);
  return {
    ...base,
    binding_request_id: "final-rag-review-memory-binding:e2e-operator-path",
    requested_by: "operator:final-rag-review-memory-e2e-smoke",
    requested_at: "2026-06-29T00:00:00.000Z",
    review_memory_db_path: reviewMemoryDbPath,
    idempotency_key: reviewRecordId,
    final_answer_candidate_result: candidateResult,
    operator_review_payload: {
      ...base.operator_review_payload,
      operator_actor_ref: "operator:final-rag-review-memory-e2e-smoke",
      reviewer_note_summary:
        "Keep this bounded final answer candidate as Review Memory for E2E operator path validation.",
      authority_boundary_acknowledged: true,
    },
  };
}

function readinessInput() {
  const base = structuredClone(readinessFixture.valid_request);
  return {
    ...base,
    readiness_packet_request_id: "promotion-readiness-request:e2e-operator-path",
    requested_by: "operator:promotion-readiness-e2e-smoke",
    requested_at: "2026-06-29T00:00:00.000Z",
    review_memory_db_path: reviewMemoryDbPath,
    review_record_id: reviewRecordId,
  };
}

function assertCandidateAuthorityBoundary(boundary) {
  assert.equal(boundary.final_rag_answer_generation_candidate_review_now, true);
  assert.equal(boundary.answer_review_state_candidate_only, true);
  assert.equal(boundary.mock_answer_provider_now, true);
  for (const field of [
    "final_answer_is_truth",
    "final_answer_is_proof",
    "final_answer_is_accepted_evidence",
    "final_answer_is_promotion_readiness",
    "final_answer_is_product",
    "proof_or_evidence_record_now",
    "claim_or_evidence_write_now",
    "review_memory_write_now",
    "promotion_execution_now",
    "durable_state_write_now",
    "durable_state_apply_now",
    "formation_receipt_write_now",
    "product_write_now",
    "product_write_accepted_evidence_ref_write_now",
    "product_id_allocation_now",
    "github_api_call_now",
    "git_write_now",
    "release_execution_now",
  ]) {
    assert.equal(boundary[field], false, `${field} must be false`);
  }
}

function assertReviewMemoryRecordBoundary(record) {
  assert.equal(record.record_kind, "candidate_review_snapshot");
  assert.equal(record.lifecycle_state, "active");
  assert.ok(record.candidate_refs.some((ref) => ref.startsWith("final-rag-answer-candidate:")));
  assert.ok(record.candidate_refs.some((ref) => ref.startsWith("final-rag-answer-request:")));
  assert.ok(record.source_refs.length > 0);
  for (const source of record.source_refs) {
    assert.equal(source.public_safe, true);
    assert.equal(source.source_surface, "manual_source_ref");
  }
  for (const ack of [
    "review_memory_not_truth",
    "review_memory_not_proof",
    "review_memory_not_accepted_evidence",
    "review_memory_not_durable_state",
    "final_answer_candidate_not_truth",
    "final_answer_candidate_not_proof",
    "final_answer_candidate_not_accepted_evidence",
    "final_answer_candidate_not_promotion",
    "final_answer_candidate_not_product",
    "source_refs_are_lineage_not_proof",
    "product_write_not_executed",
  ]) {
    assert.ok(record.boundary_acknowledgements.includes(ack), `record must include ${ack}`);
  }
  assert.equal(record.authority_boundary.review_memory_is_truth, false);
  assert.equal(record.authority_boundary.review_memory_is_proof, false);
  assert.equal(record.authority_boundary.review_memory_is_accepted_evidence, false);
  assert.equal(record.authority_boundary.review_memory_is_durable_perspective_state, false);
  assert.equal(record.authority_boundary.product_write_now, false);
  assert.equal(record.authority_boundary.promotion_execution_now, false);
  assertNoUnsafeEcho(record, "Review Memory record");
}

function assertStageFalseFlags(value, allowedTrue = {}) {
  for (const field of Object.keys(fixture.expected_no_authority_flags_after_candidate_stage)) {
    if (!(field in value)) continue;
    if (allowedTrue[field] === true) {
      assert.equal(value[field], true, `${field} allowed true for this stage only`);
    } else {
      assert.equal(value[field], false, `${field} must be false`);
    }
  }
}

function assertReadinessFalseFlags(value) {
  for (const field of [
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
    "provider_call_executed",
    "prompt_sent",
    "retrieval_executed",
    "source_fetch_executed",
    "retrieval_index_write_executed",
    "github_api_called",
    "git_write_executed",
    "release_executed",
  ]) {
    assert.equal(value[field], false, `${field} must be false`);
  }
}

function assertReadinessBoundary(boundary) {
  assert.equal(boundary.promotion_readiness_packet_from_review_memory_now, true);
  assert.equal(boundary.explicit_operator_readiness_packet_only, true);
  assert.equal(boundary.read_only_review_memory_db_query_now, true);
  assert.equal(boundary.review_memory_record_read_now, true);
  assert.equal(boundary.bounded_readiness_packet_now, true);
  for (const field of [
    "promotion_execution_now",
    "promotion_decision_record_write_now",
    "promotion_decision_store_write_now",
    "formation_receipt_write_now",
    "durable_state_write_now",
    "durable_state_apply_now",
    "proof_or_evidence_record_now",
    "claim_or_evidence_write_now",
    "accepted_evidence_ref_write_now",
    "product_write_now",
    "product_id_allocation_now",
    "final_answer_generation_now",
    "provider_openai_call_now",
    "prompt_sent_now",
    "retrieval_execution_now",
    "source_fetch_now",
    "retrieval_index_write_now",
    "review_memory_write_now",
    "git_write_now",
    "github_api_call_now",
    "release_execution_now",
    "readiness_packet_is_promotion",
    "readiness_packet_is_proof",
    "readiness_packet_is_evidence",
    "readiness_packet_is_accepted_evidence",
    "readiness_packet_is_durable_state",
    "readiness_packet_is_product",
  ]) {
    assert.equal(boundary[field], false, `${field} must be false`);
  }
}

function assertPublicSafeFixture() {
  const policy = fixture.public_safe_fixture_policy;
  assert.equal(policy.public_safe_symbolic_refs_only, true);
  assert.equal(policy.raw_prompt_allowed, false);
  assert.equal(policy.raw_provider_output_allowed, false);
  assert.equal(policy.raw_retrieval_output_allowed, false);
  assert.equal(policy.raw_source_body_allowed, false);
  assert.equal(policy.raw_db_rows_allowed, false);
  assert.equal(policy.hidden_reasoning_allowed, false);
  assert.equal(policy.github_payloads_allowed, false);
  assert.equal(policy.private_urls_allowed, false);
  assert.equal(policy.local_private_paths_allowed, false);
  assert.equal(policy.secrets_allowed, false);
  assert.equal(policy.smoke_or_ci_pass_is_truth, false);
  assert.equal(
    fixture.skipped_or_degraded_route_stage_policy.live_provider_validation_skip_reason,
    "This approved slice requires deterministic mock-provider validation only.",
  );
  assertNoUnsafeEcho(
    {
      path_version: fixture.path_version,
      scope: fixture.scope,
      expected_runtime_sequence: fixture.expected_runtime_sequence,
      expected_route_sequence: fixture.expected_route_sequence,
      expected_no_authority_flags: fixture.expected_no_authority_flags,
    },
    "public-safe fixture summary",
  );
}

async function callJson(responseOrPromise, expectedStatus, label) {
  const response = await responseOrPromise;
  const json = await response.json();
  if (response.status !== expectedStatus) {
    console.error(JSON.stringify(json, null, 2));
  }
  assert.equal(response.status, expectedStatus, `${label} HTTP status ${expectedStatus}`);
  assertNoUnsafeEcho(json, `${label} response`);
  return json;
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

function countReviewMemoryRows(path) {
  const db = new Database(path, { readonly: true, fileMustExist: true });
  try {
    return {
      records: Number(db.prepare("SELECT COUNT(*) AS count FROM research_candidate_review_records").get().count),
      activities: Number(
        db.prepare("SELECT COUNT(*) AS count FROM research_candidate_review_record_activity").get().count,
      ),
    };
  } finally {
    db.close();
  }
}

function countRows(db, tableName) {
  return Number(db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count);
}

function assertNoUnsafeEcho(value, label) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  for (const marker of [
    "SAFE_MARKER",
    "SECRET_TOKEN",
    "OPENAI_API_KEY",
    "GITHUB_TOKEN",
    "github_pat_",
    "ghp_",
    "/Users/",
    "/home/",
    "file://",
    "https://private.example",
    "https://internal.example",
    "https://intranet.example",
    "https://corp.example",
    "provider_thread_id:",
    "provider_run_id:",
    "provider_session_id:",
    "raw provider output:",
    "raw retrieval output:",
    "raw source body:",
    "raw DB row:",
    "hidden reasoning:",
    "github payload:",
    "diff --git",
  ]) {
    assert.equal(text.includes(marker), false, `${label} must not echo ${marker}`);
  }
  assert.doesNotMatch(text, /sk-[A-Za-z0-9]/, `${label} must not echo API keys`);
}

function assertChangedFileScope() {
  const changed = new Set();
  for (const args of [
    ["diff", "--name-only"],
    ["ls-files", "--others", "--exclude-standard"],
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
  const unexpected = [...changed].filter((filePath) => !expectedChangedFiles.has(filePath)).sort();
  assert.deepEqual(
    unexpected,
    [],
    "changed-file scope limited to approved E2E validation files plus exact compatibility exceptions when required",
  );
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

function assertIncludes(text, phrase, label) {
  assert.ok(text.includes(phrase), `${label} must include ${phrase}`);
}

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

function normalize(value) {
  return value.replace(/\s+/g, " ").trim();
}
