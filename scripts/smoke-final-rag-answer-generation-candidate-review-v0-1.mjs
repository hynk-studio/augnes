import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const docsPath = "docs/FINAL_RAG_ANSWER_GENERATION_CANDIDATE_REVIEW_V0_1.md";
const fixturePath = "fixtures/final-rag-answer-generation-candidate-review.sample.v0.1.json";
const typePath = "types/final-rag-answer-candidate-review.ts";
const builderPath = "lib/research-retrieval/build-final-rag-answer-candidate.ts";
const providerBoundaryPath = "lib/research-retrieval/final-rag-answer-provider-boundary.ts";
const routePath = "app/api/research-retrieval/final-rag-answer/route.ts";
const packagePath = "package.json";
const latestIndexPath = "docs/00_INDEX_LATEST.md";
const v03AuditPath = "docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_3.md";
const ragContextPreviewDocPath = "docs/RAG_CONTEXT_PREVIEW_RUNTIME_COMPLETION_V0_1.md";
const retrievalIndexDocPath = "docs/REBUILDABLE_RETRIEVAL_INDEX_RUNTIME_COMPLETION_V0_1.md";
const providerExtractionDocPath = "docs/PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_V0_1.md";
const providerExtractionContractDocPath = "docs/PROVIDER_ASSISTED_EXTRACTION_CANDIDATE_ONLY_CONTRACT_V0_1.md";
const productWriteAcceptedEvidenceRefDocPath = "docs/PRODUCT_WRITE_ACCEPTED_EVIDENCE_REF_RUNTIME_V0_1.md";
const productWriteTargetContractDocPath = "docs/PRODUCT_WRITE_TARGET_CONTRACT_V0_1.md";
const privacyGuardDocPath = "docs/PRIVACY_REDACTION_RUNTIME_GUARD_V0_1.md";
const runtimeAuditDocPath = "docs/RUNTIME_AUDIT_PANEL_RUNTIME_COMPLETION_V0_1.md";
const ragContextRoutePath = "app/api/research-retrieval/rag-context-preview/route.ts";
const ragContextBuilderPath = "lib/research-retrieval/build-rag-context-preview.ts";
const retrievalStorePath = "lib/research-retrieval/index-store.ts";
const retrievalRebuildPath = "lib/research-retrieval/rebuild-index.ts";
const ragContextFixturePath = "fixtures/rag-context-preview-runtime-completion.sample.v0.1.json";
const providerExtractionRoutePath = "app/api/research-candidate-review/provider-extraction/route.ts";
const providerExtractionRuntimePath = "lib/research-extraction/provider-extract-candidates.ts";
const providerExtractionBoundaryPath = "lib/research-extraction/provider-boundary.ts";
const providerNormalizePath = "lib/research-extraction/normalize-provider-output.ts";
const runtimeAuditStorePath = "lib/runtime-audit/audit-event-store.ts";

const packageScriptName = "smoke:final-rag-answer-generation-candidate-review-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-final-rag-answer-generation-candidate-review-v0-1.mjs";

const runtimeVersion = "final_rag_answer_generation_candidate_review.v0.1";
const requestVersion = "final_rag_answer_generation_candidate_review_request.v0.1";
const resultVersion = "final_rag_answer_generation_candidate_review_result.v0.1";
const routeVersion = "final_rag_answer_generation_candidate_review_route.v0.1";
const scope = "project:augnes";

const tempRoot = `.tmp/research-retrieval/final-rag-answer-candidate-review-smoke-${process.pid}`;
const dbPath = `${tempRoot}/final-answer.sqlite`;
const missingDbPath = `${tempRoot}/missing.sqlite`;
const schemaMissingDbPath = `${tempRoot}/schema-missing.sqlite`;
const blockedFreshDbPath = `${tempRoot}/blocked-fresh.sqlite`;
const auditDbPath = `.tmp/runtime-audit/final-rag-answer-candidate-review-smoke-${process.pid}.sqlite`;
const invalidAuditDbPath = "../runtime-audit/final-rag-answer.sqlite";

const expectedChangedFiles = new Set([
  typePath,
  builderPath,
  providerBoundaryPath,
  routePath,
  runtimeAuditStorePath,
  docsPath,
  fixturePath,
  "scripts/smoke-final-rag-answer-generation-candidate-review-v0-1.mjs",
  "scripts/smoke-bounded-source-intake-runtime-completion-v0-1.mjs",
  "scripts/smoke-research-candidate-review-memory-db-ui-runtime-v0-1.mjs",
  "scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-3.mjs",
  "docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_4.md",
  "fixtures/v0-2-1-remaining-runtime-gap-audit.sample.v0.4.json",
  "scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-4.mjs",
  "types/final-rag-answer-review-memory-binding.ts",
  "lib/research-retrieval/final-rag-answer-review-memory-binding.ts",
  "app/api/research-retrieval/final-rag-answer/review-memory/route.ts",
  "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_V0_1.md",
  "fixtures/final-rag-answer-review-memory-binding.sample.v0.1.json",
  "scripts/smoke-final-rag-answer-review-memory-binding-v0-1.mjs",
  "docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_5.md",
  "fixtures/v0-2-1-remaining-runtime-gap-audit.sample.v0.5.json",
  "scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-5.mjs",
  "components/final-rag-answer-review-memory-panel.tsx",
  "app/research-retrieval/final-rag-answer/review-memory/page.tsx",
  "docs/FINAL_ANSWER_CANDIDATE_REVIEW_UI_BINDING_V0_1.md",
  "fixtures/final-answer-candidate-review-ui-binding.sample.v0.1.json",
  "scripts/smoke-final-answer-candidate-review-ui-binding-v0-1.mjs",
  "docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_6.md",
  "fixtures/v0-2-1-remaining-runtime-gap-audit.sample.v0.6.json",
  "scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-6.mjs",
  "types/promotion-readiness-packet-from-review-memory.ts",
  "lib/perspective/promotion/promotion-readiness-packet-from-review-memory.ts",
  "app/api/perspective/promotion/readiness-packet/route.ts",
  "docs/PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_V0_1.md",
  "fixtures/promotion-readiness-packet-from-review-memory.sample.v0.1.json",
  "scripts/smoke-promotion-readiness-packet-from-review-memory-v0-1.mjs",
  "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_END_TO_END_OPERATOR_PATH_V0_1.md",
  "fixtures/final-rag-answer-review-memory-end-to-end-operator-path.sample.v0.1.json",
  "scripts/smoke-final-rag-answer-review-memory-end-to-end-operator-path-v0-1.mjs",
  "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_OPERATOR_BROWSER_VALIDATION_V0_1.md",
  "fixtures/final-rag-answer-review-memory-operator-browser-validation.sample.v0.1.json",
  "scripts/browser-validate-final-rag-answer-review-memory-operator-path-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-operator-browser-validation-v0-1.mjs",
  "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_OPERATOR_PATH_USABILITY_AUDIT_V0_1.md",
  "fixtures/final-rag-answer-review-memory-operator-path-usability-audit.sample.v0.1.json",
  "scripts/smoke-final-rag-answer-review-memory-operator-path-usability-audit-v0-1.mjs",
  "docs/OPERATOR_PATH_MANUAL_QA_RUNBOOK_V0_1.md",
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
  "fixtures/operator-path-manual-qa-runbook.sample.v0.1.json",
  "scripts/smoke-operator-path-manual-qa-runbook-v0-1.mjs",
  "docs/OPERATOR_PATH_ASSISTED_MANUAL_QA_EXECUTION_REPORT_V0_1.md",
  "fixtures/operator-path-assisted-manual-qa-execution-report.sample.v0.1.json",
  "scripts/assisted-execute-operator-path-manual-qa-v0-1.mjs",
  "scripts/smoke-operator-path-assisted-manual-qa-execution-report-v0-1.mjs",
  "docs/OPERATOR_PATH_BACKEND_SAFETY_VALIDATION_BUNDLE_V0_1.md",
  "fixtures/operator-path-backend-safety-validation-bundle.sample.v0.1.json",
  "scripts/smoke-operator-path-backend-safety-validation-bundle-v0-1.mjs",
  "lib/runtime-audit/audit-event-store.ts",
  packagePath,
  latestIndexPath,
]);

const authorityAllowedTrueFields = [
  "final_rag_answer_generation_candidate_review_now",
  "explicit_operator_answer_generation_only",
  "same_origin_post_route_now",
  "db_backed_rag_context_preview_now",
  "bounded_prompt_descriptor_now",
  "answer_provider_adapter_boundary_now",
  "answer_review_state_candidate_only",
  "citation_source_refs_visible",
  "no_truth_language_required",
  "no_proof_language_required",
  "raw_prompt_non_persistent",
  "raw_provider_output_non_persistent",
];

const authorityForbiddenFalseFields = [
  "provider_call_on_load_now",
  "background_provider_call_now",
  "hidden_provider_call_now",
  "raw_prompt_stored_now",
  "raw_provider_output_stored_now",
  "raw_retrieval_output_stored_now",
  "raw_source_body_stored_now",
  "hidden_reasoning_stored_now",
  "chain_of_thought_stored_now",
  "provider_thread_run_session_id_canonicalized_now",
  "source_fetch_now",
  "automatic_crawling_now",
  "retrieval_index_write_now",
  "embedding_created_now",
  "vector_search_now",
  "final_answer_is_truth",
  "final_answer_is_proof",
  "final_answer_is_accepted_evidence",
  "final_answer_is_promotion_readiness",
  "final_answer_is_product",
  "retrieval_result_is_evidence",
  "retrieval_score_is_truth_score",
  "retrieval_score_is_promotion_readiness",
  "source_ref_is_proof",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "review_memory_write_now",
  "promotion_execution_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "product_write_now",
  "product_write_runtime_now",
  "product_write_accepted_evidence_ref_write_now",
  "product_write_adapter_enabled_now",
  "product_id_allocation_now",
  "broad_product_persistence_now",
  "product_persistence_now",
  "github_api_call_now",
  "git_write_now",
  "repository_file_write_now",
  "release_execution_now",
  "codex_execution_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_authority",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
];

const falseExecutionFlags = [
  "db_write_executed",
  "retrieval_index_write_executed",
  "source_fetch_executed",
  "proof_or_evidence_created",
  "claim_or_evidence_written",
  "review_memory_written",
  "promotion_executed",
  "durable_state_written",
  "durable_state_applied",
  "formation_receipt_written",
  "product_write_executed",
  "product_id_allocated",
  "github_api_called",
  "git_write_executed",
  "release_executed",
];

for (const filePath of [
  docsPath,
  fixturePath,
  typePath,
  builderPath,
  providerBoundaryPath,
  routePath,
  packagePath,
  latestIndexPath,
  v03AuditPath,
  ragContextPreviewDocPath,
  retrievalIndexDocPath,
  providerExtractionDocPath,
  providerExtractionContractDocPath,
  productWriteAcceptedEvidenceRefDocPath,
  productWriteTargetContractDocPath,
  privacyGuardDocPath,
  runtimeAuditDocPath,
  runtimeAuditStorePath,
  ragContextRoutePath,
  ragContextBuilderPath,
  retrievalStorePath,
  retrievalRebuildPath,
  ragContextFixturePath,
  providerExtractionRoutePath,
  providerExtractionRuntimePath,
  providerExtractionBoundaryPath,
  providerNormalizePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const docs = normalize(readText(docsPath));
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(readText(packagePath));
const latestIndex = normalize(readText(latestIndexPath));
const v03Audit = normalize(readText(v03AuditPath));
const ragContextDocs = normalize(readText(ragContextPreviewDocPath));
const providerExtractionDocs = normalize(readText(providerExtractionDocPath));
const productWriteDocs = normalize(readText(productWriteAcceptedEvidenceRefDocPath));
const typeSource = readText(typePath);
const builderSource = readText(builderPath);
const providerBoundarySource = readText(providerBoundaryPath);
const routeSource = readText(routePath);
const runtimeAuditStoreSource = readText(runtimeAuditStorePath);
const ragContextFixture = JSON.parse(readText(ragContextFixturePath));

const builder = await import(pathToFileURL(builderPath).href);
const providerBoundary = await import(pathToFileURL(providerBoundaryPath).href);
const route = await import(pathToFileURL(routePath).href);
const store = await import(pathToFileURL(retrievalStorePath).href);
const rebuild = await import(pathToFileURL(retrievalRebuildPath).href);

rmSync(tempRoot, { recursive: true, force: true });
rmSync(auditDbPath, { force: true });
mkdirSync(tempRoot, { recursive: true });
process.on("exit", () => {
  rmSync(tempRoot, { recursive: true, force: true });
  rmSync(auditDbPath, { force: true });
});

assertDocsCoverage();
assertPackageAndIndexCoverage();
assertFixtureCoverage();
assertLibraryAndRouteExports();
assertStaticBoundaries();
seedRetrievalIndexDb();
await assertRouteRuntime();
assertBuilderAndProviderBoundary();
assertFixtureSafety();
assertChangedFileScope();
rmSync(tempRoot, { recursive: true, force: true });
rmSync(auditDbPath, { force: true });

console.log(
  JSON.stringify(
    {
      smoke: "final-rag-answer-generation-candidate-review-v0-1",
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

function assertDocsCoverage() {
  for (const phrase of [
    "explicitly approved final RAG answer candidate/review slice",
    "does not create proof/evidence records",
    "does not promote Perspective",
    "does not write durable Perspective state",
    "does not write Formation Receipts",
    "does not product-write",
    "does not allocate product IDs",
    "does not execute GitHub actuation",
    "does not execute release work",
    "does not write accepted evidence refs",
    "Context preview remains a review aid",
    "Retrieval result remains non-authoritative",
    "Provider output remains candidate-only",
    "Provider cited source refs must be a subset of context-preview source refs",
    "Provider citation notes must reference context-backed source refs only",
    "Unbacked provider citations reject candidate generation",
    "Private/raw markers are blocked in keys as well as values",
    "final_rag_answer_candidate_review_runtime",
    "operator review before any future evidence, promotion, or product-write path",
    "Smoke/CI pass is not truth",
  ]) {
    assert.ok(docs.includes(normalize(phrase)), `docs must mention ${phrase}`);
  }
  assert.ok(v03Audit.includes("v0_2_1_remaining_runtime_gap_audit_v0_3"));
  assert.ok(v03Audit.includes("product_write_accepted_evidence_ref_runtime_v0_1"));
  assert.ok(ragContextDocs.includes("RAG context is not truth"));
  assert.ok(ragContextDocs.includes("Retrieval score is not truth score"));
  assert.ok(providerExtractionDocs.includes("Provider output is not truth"));
  assert.ok(providerExtractionDocs.includes("candidate-only"));
  assert.ok(productWriteDocs.includes("accepted evidence ref write"));
  assert.ok(productWriteDocs.includes("not product ID allocation"));
  assert.ok(productWriteDocs.includes("not broad product persistence"));
}

function assertPackageAndIndexCoverage() {
  assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
  for (const pointer of [
    "FINAL_RAG_ANSWER_GENERATION_CANDIDATE_REVIEW_V0_1.md",
    "final-rag-answer-generation-candidate-review.sample.v0.1.json",
    "smoke-final-rag-answer-generation-candidate-review-v0-1.mjs",
    "types/final-rag-answer-candidate-review.ts",
    "lib/research-retrieval/build-final-rag-answer-candidate.ts",
    "lib/research-retrieval/final-rag-answer-provider-boundary.ts",
    "app/api/research-retrieval/final-rag-answer/route.ts",
    packageScriptName,
  ]) {
    assert.ok(latestIndex.includes(pointer), `latest index must mention ${pointer}`);
  }
}

function assertFixtureCoverage() {
  for (const key of [
    "fixture_version",
    "runtime_version",
    "request_version",
    "result_version",
    "route_version",
    "scope",
    "v0_3_remaining_gap_audit_ref",
    "rag_context_preview_runtime_ref",
    "product_write_accepted_evidence_ref_runtime_ref",
    "valid_mock_provider_request",
    "configured_provider_missing_key_request",
    "empty_no_context_case",
    "forbidden_authority_cases",
    "private_raw_payload_blocked_case",
    "provider_cited_unbacked_source_ref_rejection_case",
    "raw_provider_output_key_blocked_case",
    "nested_raw_retrieval_output_key_blocked_case",
    "provider_output_raw_provider_output_key_blocked_case",
    "db_missing_case",
    "schema_missing_case",
    "invalid_db_path_case",
    "audit_cases",
    "expected_success",
    "public_safe_fixture_policy",
  ]) {
    assert.ok(Object.hasOwn(fixture, key), `fixture missing ${key}`);
  }
  assert.equal(fixture.runtime_version, runtimeVersion);
  assert.equal(fixture.request_version, requestVersion);
  assert.equal(fixture.result_version, resultVersion);
  assert.equal(fixture.route_version, routeVersion);
  assert.equal(fixture.scope, scope);
  assert.equal(fixture.valid_mock_provider_request.no_truth_language_required, true);
  assert.equal(fixture.valid_mock_provider_request.no_proof_language_required, true);
  assert.equal(fixture.valid_mock_provider_request.raw_prompt_storage_policy, "non_persistent");
  assert.equal(fixture.valid_mock_provider_request.raw_provider_output_storage_policy, "non_persistent");
  assert.equal(fixture.valid_mock_provider_request.no_chain_of_thought_storage, true);
  assert.equal(
    fixture.provider_cited_unbacked_source_ref_rejection_case.expected_reason_code,
    "provider_cited_unbacked_source_ref",
  );
  assert.equal(fixture.raw_provider_output_key_blocked_case.blocked_key, "raw_provider_output");
  assert.equal(fixture.nested_raw_retrieval_output_key_blocked_case.blocked_key, "raw_retrieval_output");
  assert.equal(fixture.provider_output_raw_provider_output_key_blocked_case.blocked_key, "raw_provider_output");
  assert.equal(fixture.audit_cases.expected_event_surface, "final_rag_answer_candidate_review_runtime");
  assert.deepEqual(
    fixture.forbidden_authority_cases.map((item) => `${item.field}:${item.value_kind}`).sort(),
    [
      "durable_state_apply_now:array_enabled",
      "final_answer_is_truth:string_true",
      "product_write_now:numeric_one",
      "proof_or_evidence_record_now:object_enabled",
    ],
  );
  assertPublicSafeFixturePolicy(fixture.public_safe_fixture_policy);
}

function assertLibraryAndRouteExports() {
  for (const name of [
    "preflightFinalRagAnswerCandidateReviewRuntimeV01",
    "validateFinalRagAnswerCandidateReviewInputV01",
    "runFinalRagAnswerCandidateReviewRuntimeV01",
    "createFinalRagAnswerCandidateRefV01",
  ]) {
    assert.equal(typeof builder[name], "function", `${name} must be exported`);
  }
  for (const name of [
    "createFinalRagAnswerCandidateAuthorityBoundaryV01",
    "createMockFinalRagAnswerProviderAdapterV01",
    "collectFinalRagAnswerForbiddenAuthorityFieldsV01",
    "containsUnsafeFinalRagAnswerRuntimeTextV01",
  ]) {
    assert.equal(typeof providerBoundary[name], "function", `${name} must be exported`);
  }
  assert.equal(typeof route.POST, "function", "route must export POST");
  assert.equal(typeof route.createFinalRagAnswerCandidateReviewPostHandlerV01, "function");
  assert.equal(route.GET, undefined, "route must not export GET provider execution");
}

function assertStaticBoundaries() {
  assert.ok(routeSource.includes("requestHasSameOriginBoundary"), "route must enforce same-origin boundary");
  assert.ok(routeSource.includes("method: \"POST\"") || routeSource.includes("export const POST"), "route must expose POST");
  assert.ok(!routeSource.includes("export async function GET"), "route must not expose GET");
  assert.ok(routeSource.includes("fileMustExist: true"), "route opens existing DB only");
  assert.ok(routeSource.includes("readonly: true"), "route opens retrieval DB read-only");
  assert.ok(routeSource.includes("final_rag_answer_candidate_review_runtime"));
  assert.ok(runtimeAuditStoreSource.includes("\"final_rag_answer_candidate_review_runtime\""));
  assert.ok(routeSource.indexOf("preflightFinalRagAnswerCandidateReviewRuntimeV01") < routeSource.indexOf("new Database"));
  assert.ok(!routeSource.includes("ensureResearchRetrievalIndexSchemaV01"), "route must not create retrieval schema");
  assert.ok(!routeSource.includes("rebuildResearchRetrievalIndexV01"), "route must not rebuild retrieval index");
  for (const [label, source] of [
    ["type", typeSource],
    ["builder", builderSource],
    ["provider boundary", providerBoundarySource],
    ["route", routeSource],
  ]) {
    assert.doesNotMatch(source, /\bfrom\s+["']openai["']|chat\.completions|responses\.create/i, `${label} must not hardwire provider calls`);
    assert.doesNotMatch(source, /\bfetch\s*\(/, `${label} must not fetch sources or call providers directly`);
    assert.doesNotMatch(source, /createEmbedding|embeddings\.create|pgvector|chromadb|vector\s+database/i, `${label} must not add embeddings/vector search`);
    assert.doesNotMatch(source, /proof\s*insert|evidence\s*insert|review_memory\s*insert|formation_receipt\s*insert/i, `${label} must not write proof/review/receipt state`);
  }
  for (const field of [
    "provider_call_on_load_now",
    "background_provider_call_now",
    "hidden_provider_call_now",
    "raw_prompt_stored_now",
    "raw_provider_output_stored_now",
    "product_write_accepted_evidence_ref_write_now",
    "product_id_allocation_now",
    "github_api_call_now",
    "release_execution_now",
  ]) {
    assert.ok(providerBoundarySource.includes(`"${field}"`) || typeSource.includes(`${field}: false`), `${field} boundary named`);
  }
  assert.ok(providerBoundarySource.includes("isFalseLikeAuthorityValue"), "forbidden authority must be fail-closed");
}

function seedRetrievalIndexDb() {
  const db = new Database(dbPath);
  try {
    store.ensureResearchRetrievalIndexSchemaV01(db);
    const input = {
      ...ragContextFixture.safe_search_seed_rebuild_input_example,
      db_path: dbPath,
    };
    const result = rebuild.rebuildResearchRetrievalIndexV01(input, db);
    assert.equal(result.status, "rebuilt");
    assert.equal(countRows(db, "research_retrieval_index_entries"), input.entries.length);
  } finally {
    db.close();
  }
}

async function assertRouteRuntime() {
  const before = dbCounts(dbPath);
  const successResponse = await route.POST(
    localPostRequest({
      route_version: routeVersion,
      scope,
      audit_db_path: auditDbPath,
      input: validInput(),
    }),
  );
  const successBody = await successResponse.json();
  assert.equal(successResponse.status, 200);
  assert.equal(successBody.status, "ok");
  assert.equal(successBody.result.status, "final_answer_candidate_created");
  assert.equal(successBody.result.result_version, resultVersion);
  assert.equal(successBody.result.runtime_version, runtimeVersion);
  assert.equal(successBody.result.provider_mode, "mock_provider");
  assert.equal(successBody.result.provider_status, "mock_provider_completed");
  assert.equal(successBody.result.answer_review_state, "candidate_only");
  assert.equal(successBody.result.no_truth_claim, true);
  assert.equal(successBody.result.no_proof_claim, true);
  assert.equal(successBody.result.no_accepted_evidence_claim, true);
  assert.equal(successBody.result.no_promotion_claim, true);
  assert.equal(successBody.result.no_product_write_claim, true);
  assert.equal(successBody.result.provider_call_executed, true);
  assert.equal(successBody.result.prompt_sent, true);
  assert.equal(successBody.result.retrieval_executed, true);
  assert.equal(successBody.result.rag_answer_generated, true);
  assert.equal(successBody.result.final_answer_candidate_generated, true);
  assert.equal(typeof successBody.result.bounded_answer, "string");
  assert.ok(successBody.result.bounded_answer.length > 0);
  assert.ok(successBody.result.answer_candidate_ref?.startsWith("final-rag-answer-candidate:v0.1:"));
  assert.ok(successBody.result.rag_context_preview_ref?.startsWith("rag-context-preview-request:"));
  assert.ok(successBody.result.retrieved_refs.length > 0);
  assert.ok(successBody.result.cited_source_refs.length > 0);
  assert.ok(successBody.result.bounded_citation_notes.length > 0);
  assertFalseExecutionFlags(successBody);
  assertFalseExecutionFlags(successBody.result);
  assertAuthorityBoundary(successBody.result.authority_boundary, {
    retrieval_execution_via_context_preview_now: true,
    mock_answer_provider_now: true,
    configured_provider_missing_key_refusal_now: false,
    final_answer_candidate_generated_now: true,
  });
  for (const reasonCode of [
    "final_answer_candidate_is_not_truth",
    "final_answer_candidate_is_not_proof",
    "final_answer_candidate_is_not_accepted_evidence",
    "final_answer_candidate_is_not_promotion",
    "final_answer_candidate_is_not_product",
    "retrieval_result_not_evidence",
    "retrieval_score_not_truth",
    "retrieval_score_not_promotion_readiness",
    "source_refs_are_lineage_pointers_not_proof",
    "raw_prompt_not_stored",
    "raw_provider_output_not_stored",
    "hidden_reasoning_not_stored",
    "product_write_not_executed",
  ]) {
    assert.ok(successBody.result.reason_codes.includes(reasonCode), `success must include ${reasonCode}`);
  }
  assert.deepEqual(dbCounts(dbPath), before, "final answer route must not write retrieval DB rows");
  assert.equal(successBody.audit_event_result.status, "audit_event_created");
  assertNoUnsafeEcho(successBody, "success response");
  assertAuditPublicSafe();

  const missingAuditResponse = await route.POST(
    localPostRequest({
      route_version: routeVersion,
      scope,
      input: validInput({ answer_request_id: "final-rag-answer-request:missing-audit" }),
    }),
  );
  const missingAuditBody = await missingAuditResponse.json();
  assert.equal(missingAuditResponse.status, 200);
  assert.equal(missingAuditBody.result.status, "final_answer_candidate_created");
  assert.equal(missingAuditBody.audit_event_result.status, fixture.audit_cases.missing_audit_db_path_status);

  const invalidAuditResponse = await route.POST(
    localPostRequest({
      route_version: routeVersion,
      scope,
      audit_db_path: invalidAuditDbPath,
      input: validInput({ answer_request_id: "final-rag-answer-request:invalid-audit" }),
    }),
  );
  const invalidAuditBody = await invalidAuditResponse.json();
  assert.equal(invalidAuditResponse.status, 200);
  assert.equal(invalidAuditBody.result.status, "final_answer_candidate_created");
  assert.equal(invalidAuditBody.audit_event_result.status, fixture.audit_cases.invalid_audit_db_path_status);
  assertNoUnsafeEcho(invalidAuditBody, "invalid audit response");

  const configuredResponse = await route.POST(
    localPostRequest({
      route_version: routeVersion,
      scope,
      input: validInput({
        answer_request_id: "final-rag-answer-request:configured-missing-key",
        provider_mode: fixture.configured_provider_missing_key_request.provider_mode,
        provider_ref: fixture.configured_provider_missing_key_request.provider_ref,
        model_or_tool_ref: fixture.configured_provider_missing_key_request.model_or_tool_ref,
      }),
    }),
  );
  const configuredBody = await configuredResponse.json();
  assert.equal(configuredResponse.status, 200);
  assert.equal(configuredBody.result.status, "provider_missing_key");
  assert.equal(configuredBody.result.provider_status, "provider_missing_key");
  assert.equal(configuredBody.result.provider_call_executed, false);
  assert.equal(configuredBody.result.prompt_sent, false);
  assert.equal(configuredBody.result.retrieval_executed, true);
  assert.equal(configuredBody.result.final_answer_candidate_generated, false);
  assertAuthorityBoundary(configuredBody.result.authority_boundary, {
    retrieval_execution_via_context_preview_now: true,
    mock_answer_provider_now: false,
    configured_provider_missing_key_refusal_now: true,
    final_answer_candidate_generated_now: false,
  });

  const emptyResponse = await route.POST(
    localPostRequest({
      route_version: routeVersion,
      scope,
      input: validInput({
        answer_request_id: "final-rag-answer-request:no-context",
        rag_context_preview_request: {
          ...fixture.valid_mock_provider_request.rag_context_preview_request,
          db_path: dbPath,
          preview_request_id: "rag-context-preview-request:final-answer-no-context",
          query: fixture.empty_no_context_case.query,
        },
      }),
    }),
  );
  const emptyBody = await emptyResponse.json();
  assert.equal(emptyResponse.status, 200);
  assert.equal(emptyBody.result.status, fixture.empty_no_context_case.expected_status);
  assert.equal(emptyBody.result.provider_call_executed, false);
  assert.equal(emptyBody.result.prompt_sent, false);
  assert.equal(emptyBody.result.final_answer_candidate_generated, false);

  for (const testCase of [
    { field: "final_answer_is_truth", value: "true" },
    { field: "product_write_now", value: 1 },
    { field: "proof_or_evidence_record_now", value: { enabled: true } },
    { field: "durable_state_apply_now", value: ["enabled"] },
  ]) {
    const response = await route.POST(
      localPostRequest({
        route_version: routeVersion,
        scope,
        input: validInput({
          answer_request_id: `final-rag-answer-request:forbidden-${testCase.field}`,
          authority_boundary: {
            ...fixture.valid_mock_provider_request.authority_boundary,
            [testCase.field]: testCase.value,
          },
          rag_context_preview_request: {
            ...fixture.valid_mock_provider_request.rag_context_preview_request,
            db_path: blockedFreshDbPath,
          },
        }),
      }),
    );
    const body = await response.json();
    assert.equal(response.status, 403);
    assert.equal(body.error_code, "blocked_forbidden_authority");
    assert.equal(body.result.status, "blocked_forbidden_authority");
    assert.equal(existsSync(blockedFreshDbPath), false, "forbidden authority must not create DB file");
    assertNoUnsafeEcho(body, `forbidden response ${testCase.field}`);
  }

  const unsafeMarker = ["SAFE", "MARKER", "RAW", "PROVIDER", "OUTPUT"].join("_");
  const privateResponse = await route.POST(
    localPostRequest({
      route_version: routeVersion,
      scope,
      input: validInput({
        answer_request_id: "final-rag-answer-request:private-blocked",
        provider_ref: unsafeMarker,
        rag_context_preview_request: {
          ...fixture.valid_mock_provider_request.rag_context_preview_request,
          db_path: blockedFreshDbPath,
        },
      }),
    }),
  );
  const privateBody = await privateResponse.json();
  assert.equal(privateResponse.status, 400);
  assert.equal(privateBody.error_code, "blocked_private_or_raw_payload");
  assert.equal(privateBody.result.status, "blocked_private_or_raw_payload");
  assert.equal(existsSync(blockedFreshDbPath), false, "private/raw payload must not create DB file");
  assertNoUnsafeEcho(privateBody, "private blocked response");

  const rawProviderOutputKeyResponse = await route.POST(
    localPostRequest({
      route_version: routeVersion,
      scope,
      input: validInput({
        answer_request_id: "final-rag-answer-request:raw-provider-output-key",
        raw_provider_output: fixture.raw_provider_output_key_blocked_case.bounded_looking_value,
        rag_context_preview_request: {
          ...fixture.valid_mock_provider_request.rag_context_preview_request,
          db_path: blockedFreshDbPath,
        },
      }),
    }),
  );
  const rawProviderOutputKeyBody = await rawProviderOutputKeyResponse.json();
  assert.equal(rawProviderOutputKeyResponse.status, 400);
  assert.equal(rawProviderOutputKeyBody.error_code, fixture.raw_provider_output_key_blocked_case.expected_status);
  assert.equal(rawProviderOutputKeyBody.result.status, fixture.raw_provider_output_key_blocked_case.expected_status);
  assert.equal(existsSync(blockedFreshDbPath), false, "raw provider output key must not create DB file");
  assertNoUnsafeEcho(rawProviderOutputKeyBody, "raw provider output key response");

  const nestedRawRetrievalOutputKeyResponse = await route.POST(
    localPostRequest({
      route_version: routeVersion,
      scope,
      input: validInput({
        answer_request_id: "final-rag-answer-request:nested-raw-retrieval-output-key",
        rag_context_preview_request: {
          ...fixture.valid_mock_provider_request.rag_context_preview_request,
          db_path: blockedFreshDbPath,
          raw_retrieval_output: fixture.nested_raw_retrieval_output_key_blocked_case.bounded_looking_value,
        },
      }),
    }),
  );
  const nestedRawRetrievalOutputKeyBody = await nestedRawRetrievalOutputKeyResponse.json();
  assert.equal(nestedRawRetrievalOutputKeyResponse.status, 400);
  assert.equal(
    nestedRawRetrievalOutputKeyBody.error_code,
    fixture.nested_raw_retrieval_output_key_blocked_case.expected_status,
  );
  assert.equal(
    nestedRawRetrievalOutputKeyBody.result.status,
    fixture.nested_raw_retrieval_output_key_blocked_case.expected_status,
  );
  assert.equal(existsSync(blockedFreshDbPath), false, "nested raw retrieval output key must not create DB file");
  assertNoUnsafeEcho(nestedRawRetrievalOutputKeyBody, "nested raw retrieval output key response");

  const unbackedProviderHandler = route.createFinalRagAnswerCandidateReviewPostHandlerV01({
    providerAdapter: () => ({
      status: "answered",
      bounded_answer: "Safe candidate answer for operator review with unbacked citation rejection.",
      cited_source_refs: [fixture.provider_cited_unbacked_source_ref_rejection_case.unbacked_source_ref],
      bounded_citation_notes: [
        {
          source_ref: fixture.provider_cited_unbacked_source_ref_rejection_case.unbacked_source_ref,
          bounded_note: "Public-safe citation note for an unbacked source ref.",
        },
      ],
      reason_codes: ["mock_answer_provider_now"],
    }),
  });
  const beforeUnbackedProvider = dbCounts(dbPath);
  const unbackedProviderResponse = await unbackedProviderHandler(
    localPostRequest({
      route_version: routeVersion,
      scope,
      input: validInput({ answer_request_id: "final-rag-answer-request:unbacked-provider-citation" }),
    }),
  );
  const unbackedProviderBody = await unbackedProviderResponse.json();
  assert.equal(unbackedProviderResponse.status, 400);
  assert.equal(unbackedProviderBody.result.status, fixture.provider_cited_unbacked_source_ref_rejection_case.expected_status);
  assert.equal(unbackedProviderBody.result.provider_call_executed, true);
  assert.equal(unbackedProviderBody.result.prompt_sent, true);
  assert.equal(unbackedProviderBody.result.final_answer_candidate_generated, false);
  assert.equal(unbackedProviderBody.result.rag_answer_generated, false);
  assert.equal(unbackedProviderBody.result.answer_candidate_ref, null);
  assert.ok(
    unbackedProviderBody.result.failure_codes.includes(
      fixture.provider_cited_unbacked_source_ref_rejection_case.expected_reason_code,
    ),
  );
  assert.ok(
    unbackedProviderBody.result.reason_codes.includes(
      fixture.provider_cited_unbacked_source_ref_rejection_case.expected_reason_code,
    ),
  );
  assert.equal(
    unbackedProviderBody.result.cited_source_refs.includes(
      fixture.provider_cited_unbacked_source_ref_rejection_case.unbacked_source_ref,
    ),
    false,
  );
  assert.equal(
    unbackedProviderBody.result.bounded_citation_notes.some(
      (note) => note.source_ref === fixture.provider_cited_unbacked_source_ref_rejection_case.unbacked_source_ref,
    ),
    false,
  );
  assertFalseExecutionFlags(unbackedProviderBody);
  assertFalseExecutionFlags(unbackedProviderBody.result);
  assert.deepEqual(dbCounts(dbPath), beforeUnbackedProvider, "unbacked citation rejection must not write DB rows");
  assertNoUnsafeEcho(unbackedProviderBody, "unbacked provider citation response");

  const rawProviderOutputHandler = route.createFinalRagAnswerCandidateReviewPostHandlerV01({
    providerAdapter: () => ({
      status: "answered",
      bounded_answer: "Safe candidate answer for operator review with unsafe key rejection.",
      cited_source_refs: ["source-ref:calibration-runtime"],
      bounded_citation_notes: [
        {
          source_ref: "source-ref:calibration-runtime",
          bounded_note: "Public-safe citation note for context-backed source ref.",
        },
      ],
      raw_provider_output: fixture.provider_output_raw_provider_output_key_blocked_case.bounded_looking_value,
      reason_codes: ["mock_answer_provider_now"],
    }),
  });
  const rawProviderOutputResponse = await rawProviderOutputHandler(
    localPostRequest({
      route_version: routeVersion,
      scope,
      input: validInput({ answer_request_id: "final-rag-answer-request:provider-output-raw-key" }),
    }),
  );
  const rawProviderOutputBody = await rawProviderOutputResponse.json();
  assert.equal(rawProviderOutputResponse.status, 400);
  assert.equal(rawProviderOutputBody.result.status, fixture.provider_output_raw_provider_output_key_blocked_case.expected_status);
  assert.equal(rawProviderOutputBody.result.provider_call_executed, true);
  assert.equal(rawProviderOutputBody.result.prompt_sent, true);
  assert.equal(rawProviderOutputBody.result.final_answer_candidate_generated, false);
  assert.equal(rawProviderOutputBody.result.rag_answer_generated, false);
  assert.equal(rawProviderOutputBody.result.answer_candidate_ref, null);
  assertFalseExecutionFlags(rawProviderOutputBody);
  assertFalseExecutionFlags(rawProviderOutputBody.result);
  assertNoUnsafeEcho(rawProviderOutputBody, "provider output raw key response");

  const missingDbResponse = await route.POST(
    localPostRequest({
      route_version: routeVersion,
      scope,
      input: validInput({
        answer_request_id: "final-rag-answer-request:missing-db",
        rag_context_preview_request: {
          ...fixture.valid_mock_provider_request.rag_context_preview_request,
          db_path: missingDbPath,
        },
      }),
    }),
  );
  const missingDbBody = await missingDbResponse.json();
  assert.equal(missingDbResponse.status, 404);
  assert.equal(missingDbBody.error_code, fixture.db_missing_case.expected_status);
  assert.equal(missingDbBody.result.status, fixture.db_missing_case.expected_status);
  assert.equal(existsSync(missingDbPath), false, "missing DB path must not create DB file");

  mkdirSync(dirname(schemaMissingDbPath), { recursive: true });
  const schemaDb = new Database(schemaMissingDbPath);
  schemaDb.close();
  const schemaResponse = await route.POST(
    localPostRequest({
      route_version: routeVersion,
      scope,
      input: validInput({
        answer_request_id: "final-rag-answer-request:schema-missing",
        rag_context_preview_request: {
          ...fixture.valid_mock_provider_request.rag_context_preview_request,
          db_path: schemaMissingDbPath,
        },
      }),
    }),
  );
  const schemaBody = await schemaResponse.json();
  assert.equal(schemaResponse.status, 400);
  assert.equal(schemaBody.error_code, fixture.schema_missing_case.expected_status);
  assert.equal(schemaBody.result.status, fixture.schema_missing_case.expected_status);

  const invalidDbPathResponse = await route.POST(
    localPostRequest({
      route_version: routeVersion,
      scope,
      input: validInput({
        answer_request_id: "final-rag-answer-request:invalid-db-path",
        rag_context_preview_request: {
          ...fixture.valid_mock_provider_request.rag_context_preview_request,
          db_path: fixture.invalid_db_path_case.db_path,
        },
      }),
    }),
  );
  const invalidDbPathBody = await invalidDbPathResponse.json();
  assert.equal(invalidDbPathResponse.status, 400);
  assert.equal(invalidDbPathBody.error_code, fixture.invalid_db_path_case.expected_error_code);
  assertNoUnsafeEcho(invalidDbPathBody, "invalid DB path response");

  const crossSiteResponse = await route.POST(
    new Request("http://localhost:3000/api/research-retrieval/final-rag-answer", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        host: "localhost:3000",
        origin: "https://example.invalid",
        "sec-fetch-site": "cross-site",
      },
      body: JSON.stringify({
        route_version: routeVersion,
        scope,
        input: validInput({ answer_request_id: "final-rag-answer-request:cross-origin" }),
      }),
    }),
  );
  const crossSiteBody = await crossSiteResponse.json();
  assert.equal(crossSiteResponse.status, 403);
  assert.equal(crossSiteBody.error_code, "same_origin_required");
}

function assertBuilderAndProviderBoundary() {
  const safeInput = validInput();
  assert.equal(builder.validateFinalRagAnswerCandidateReviewInputV01(safeInput).passed, true);
  const forbidden = builder.validateFinalRagAnswerCandidateReviewInputV01({
    ...safeInput,
    authority_boundary: {
      ...safeInput.authority_boundary,
      final_answer_is_truth: "true",
    },
  });
  assert.equal(forbidden.passed, false);
  assert.equal(forbidden.status, "blocked_forbidden_authority");
  const unsafe = builder.validateFinalRagAnswerCandidateReviewInputV01({
    ...safeInput,
    provider_ref: ["SAFE", "MARKER", "RAW", "RETRIEVAL", "OUTPUT"].join("_"),
  });
  assert.equal(unsafe.passed, false);
  assert.equal(unsafe.status, "blocked_private_or_raw_payload");
  const unsafeKey = builder.validateFinalRagAnswerCandidateReviewInputV01({
    ...safeInput,
    raw_provider_output: "bounded-looking text",
  });
  assert.equal(unsafeKey.passed, false);
  assert.equal(unsafeKey.status, "blocked_private_or_raw_payload");
  assert.equal(
    providerBoundary.containsUnsafeFinalRagAnswerRuntimeTextV01({ raw_provider_output: "bounded-looking text" }),
    true,
  );
  assert.equal(
    providerBoundary.containsUnsafeFinalRagAnswerRuntimeTextV01({
      raw_provider_output_storage_policy: "non_persistent",
      raw_prompt_storage_policy: "non_persistent",
      no_chain_of_thought_storage: true,
    }),
    false,
  );
  const mockAdapter = providerBoundary.createMockFinalRagAnswerProviderAdapterV01();
  const output = mockAdapter({
    provider_ref: "provider:mock",
    model_or_tool_ref: "model:mock",
    bounded_prompt_descriptor: "answer_review_state:candidate_only",
    bounded_context_summaries: [
      {
        context_ref: "context:one",
        source_ref: "source-ref:one",
        bounded_title: "Bounded context one",
        bounded_context_summary: "Bounded public-safe context summary.",
      },
    ],
    max_answer_chars: 600,
    citation_policy: "source_ref_lineage_citations_only",
    no_truth_language_required: true,
    no_proof_language_required: true,
  });
  assert.equal(output.status, "answered");
  assert.ok(output.bounded_answer.includes("Candidate answer for operator review"));
  assert.ok(output.bounded_answer.includes("not truth, proof, accepted evidence"));
  assertNoUnsafeEcho(output, "mock adapter output");
}

function assertFalseExecutionFlags(value) {
  for (const field of falseExecutionFlags) {
    assert.equal(value[field], false, `${field} must be false`);
  }
  assert.equal(value.product_write_executed, false);
  assert.equal(value.product_id_allocated, false);
}

function assertAuthorityBoundary(boundary, conditionals) {
  assert.ok(boundary && typeof boundary === "object", "authority boundary must exist");
  for (const field of authorityAllowedTrueFields) {
    assert.equal(boundary[field], true, `${field} must be true`);
  }
  for (const [field, expected] of Object.entries(conditionals)) {
    assert.equal(boundary[field], expected, `${field} conditional value`);
  }
  for (const field of authorityForbiddenFalseFields) {
    assert.equal(boundary[field], false, `${field} must be false`);
  }
}

function assertAuditPublicSafe() {
  assert.ok(existsSync(auditDbPath), "audit DB should be created only when requested");
  const db = new Database(auditDbPath, { readonly: true, fileMustExist: true });
  try {
    const rows = db.prepare("SELECT * FROM runtime_audit_events").all();
    assert.ok(rows.length >= 1, "audit event row should exist");
    for (const row of rows) {
      assert.equal(row.event_surface, fixture.audit_cases.expected_event_surface);
      assertNoUnsafeEcho(row, "audit event row");
    }
  } finally {
    db.close();
  }
}

function assertPublicSafeFixturePolicy(policy) {
  assert.ok(policy && typeof policy === "object", "public safe fixture policy object");
  assert.equal(policy.symbolic_refs_only, true);
  for (const field of [
    "raw_prompt_allowed",
    "raw_provider_output_allowed",
    "raw_retrieval_output_allowed",
    "raw_source_body_allowed",
    "raw_db_rows_allowed",
    "raw_conversations_allowed",
    "hidden_reasoning_allowed",
    "telemetry_dumps_allowed",
    "raw_diffs_allowed",
    "terminal_logs_allowed",
    "github_payloads_allowed",
    "private_paths_allowed",
    "private_urls_allowed",
    "secrets_allowed",
  ]) {
    assert.equal(policy[field], false, `policy ${field} false`);
  }
}

function assertFixtureSafety() {
  const parsed = JSON.parse(fixtureText);
  assertFixtureValuesPublicSafe(parsed, []);
  assert.doesNotMatch(fixtureText, /\bsk-[A-Za-z0-9_-]{8,}\b|\bghp_[A-Za-z0-9_]{8,}\b|\bgithub_pat_[A-Za-z0-9_]{8,}\b/);
  assert.doesNotMatch(fixtureText, /\/Users\/|\/home\/|file:\/\//);
  assert.doesNotMatch(fixtureText, /diff --git/);
}

function assertFixtureValuesPublicSafe(value, path) {
  if (typeof value === "string") {
    const joinedPath = path.join(".");
    if (/public_safe_fixture_policy|private_raw_payload_blocked_case/.test(joinedPath)) return;
    assert.doesNotMatch(value, /\/Users\/|\/home\/|file:\/\//, `${joinedPath} must not contain private path`);
    assert.doesNotMatch(value, /\bsk-[A-Za-z0-9_-]{8,}\b|\bghp_[A-Za-z0-9_]{8,}\b|\bgithub_pat_[A-Za-z0-9_]{8,}\b/, `${joinedPath} must not contain token`);
    assert.doesNotMatch(value, /diff --git|raw source body:|raw provider output:|raw retrieval output:|raw DB row:|raw conversation:|hidden reasoning:|telemetry dump:/i, `${joinedPath} must not contain raw payload`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertFixtureValuesPublicSafe(item, [...path, String(index)]));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      assertFixtureValuesPublicSafe(nested, [...path, key]);
    }
  }
}

function assertNoUnsafeEcho(value, label) {
  const text = JSON.stringify(value);
  for (const marker of [
    "SAFE_MARKER_RAW_PROVIDER_OUTPUT",
    "SAFE_MARKER_RAW_RETRIEVAL_OUTPUT",
    "SAFE_MARKER_PRIVATE_URL",
    "SAFE_MARKER_LOCAL_PRIVATE_PATH",
    "SAFE_MARKER_SECRET_TOKEN",
    "SAFE_MARKER_HIDDEN_REASONING",
  ]) {
    assert.equal(text.includes(marker), false, `${label} must not echo ${marker}`);
  }
  assert.doesNotMatch(text, /sk-[A-Za-z0-9]|ghp_[A-Za-z0-9]|OPENAI_API_KEY|GITHUB_TOKEN/);
  assert.doesNotMatch(text, /\/Users\/|\/home\/|file:\/\//);
  assert.doesNotMatch(text, /raw source body:|raw provider output:|raw retrieval output:|raw DB row:|raw conversation:|hidden reasoning:|telemetry dump:|diff --git/i);
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
    "changed-file scope limited to final RAG candidate review slice files plus exact old-smoke compatibility exceptions",
  );
}

function validInput(overrides = {}) {
  const base = {
    ...fixture.valid_mock_provider_request,
    rag_context_preview_request: {
      ...fixture.valid_mock_provider_request.rag_context_preview_request,
      db_path: dbPath,
    },
  };
  return {
    ...base,
    ...overrides,
    rag_context_preview_request: {
      ...base.rag_context_preview_request,
      ...(overrides.rag_context_preview_request ?? {}),
    },
  };
}

function dbCounts(path) {
  const db = new Database(path, { readonly: true, fileMustExist: true });
  try {
    return {
      entries: countRows(db, "research_retrieval_index_entries"),
      terms: countRows(db, "research_retrieval_index_terms"),
      rebuilds: countRows(db, "research_retrieval_index_rebuilds"),
    };
  } finally {
    db.close();
  }
}

function countRows(db, tableName) {
  return Number(db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count);
}

function localPostRequest(body) {
  return new Request("http://localhost:3000/api/research-retrieval/final-rag-answer", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost:3000",
    },
    body: JSON.stringify(body),
  });
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

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

function normalize(value) {
  return value.replace(/\s+/g, " ").trim();
}
