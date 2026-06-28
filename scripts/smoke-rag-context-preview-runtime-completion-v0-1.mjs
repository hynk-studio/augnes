import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const docsPath = "docs/RAG_CONTEXT_PREVIEW_RUNTIME_COMPLETION_V0_1.md";
const legacyDocsPath = "docs/RAG_CONTEXT_PREVIEW_V0_1.md";
const builderPath = "lib/research-retrieval/build-rag-context-preview.ts";
const routePath = "app/api/research-retrieval/rag-context-preview/route.ts";
const componentPath = "components/rag-context-preview-panel.tsx";
const fixturePath = "fixtures/rag-context-preview-runtime-completion.sample.v0.1.json";
const legacyFixturePath = "fixtures/rag-context-preview.sample.v0.1.json";
const packagePath = "package.json";
const latestIndexPath = "docs/00_INDEX_LATEST.md";
const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const retrievalCompletionDocPath = "docs/REBUILDABLE_RETRIEVAL_INDEX_RUNTIME_COMPLETION_V0_1.md";
const retrievalSearchPath = "lib/research-retrieval/search-index.ts";
const retrievalStorePath = "lib/research-retrieval/index-store.ts";
const retrievalRebuildPath = "lib/research-retrieval/rebuild-index.ts";
const retrievalSearchRoutePath = "app/api/research-retrieval/search/route.ts";

const packageScriptName = "smoke:rag-context-preview-runtime-completion-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-rag-context-preview-runtime-completion-v0-1.mjs";
const routeVersion = "rag_context_preview_runtime_completion_route.v0.1";
const previewVersion = "rag_context_preview_runtime_completion.v0.1";
const requestVersion = "rag_context_preview_runtime_completion_request.v0.1";
const resultVersion = "rag_context_preview_runtime_completion_result.v0.1";
const searchVersion = "research_retrieval_index_runtime_completion_search.v0.1";
const scope = "project:augnes";
const tempRoot = `.tmp/research-retrieval/rag-context-preview-runtime-smoke-${process.pid}`;
const dbPath = `${tempRoot}/preview.sqlite`;
const missingDbPath = `${tempRoot}/missing.sqlite`;
const schemaMissingDbPath = `${tempRoot}/schema-missing.sqlite`;

const allowedTrueBoundaryFields = [
  "rag_context_preview_runtime_now",
  "db_backed_retrieval_search_now",
  "explicit_operator_preview_only",
  "same_origin_post_route_now",
  "read_only_db_search_now",
  "context_preview_created_now",
  "candidate_vs_durable_markers_visible",
  "staleness_warnings_visible",
  "unresolved_tension_markers_visible",
  "knowledge_gap_markers_visible",
];
const forbiddenFalseBoundaryFields = [
  "rag_answer_generation_now",
  "final_answer_generation_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "source_fetch_now",
  "live_crawling_now",
  "embedding_created_now",
  "vector_search_now",
  "retrieval_index_write_now",
  "db_write_now",
  "raw_source_body_included_now",
  "raw_provider_output_included_now",
  "raw_retrieval_output_stored_now",
  "hidden_reasoning_stored_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "candidate_mutation_now",
  "review_memory_write_now",
  "promotion_execution_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "product_write_now",
  "product_write_runtime_now",
  "product_write_adapter_enabled_now",
  "product_id_allocation_now",
  "product_persistence_now",
  "git_ledger_export_runtime_now",
  "git_write_now",
  "github_api_call_now",
  "repository_file_write_now",
  "local_file_export_now",
  "local_file_import_now",
  "codex_execution_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_authority",
  "rag_context_is_truth",
  "rag_context_is_proof",
  "rag_context_is_accepted_evidence",
  "rag_context_is_promotion_readiness",
  "retrieval_result_is_evidence",
  "retrieval_score_is_truth",
  "retrieval_score_is_promotion_readiness",
  "source_ref_is_proof",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
];
const safeMarkers = [
  "SAFE_MARKER_PRIVATE_URL",
  "SAFE_MARKER_LOCAL_PRIVATE_PATH",
  "SAFE_MARKER_SECRET_TOKEN",
  "SAFE_MARKER_RAW_SOURCE_BODY",
  "SAFE_MARKER_RAW_PROVIDER_OUTPUT",
  "SAFE_MARKER_RAW_RETRIEVAL_OUTPUT",
  "SAFE_MARKER_PROVIDER_THREAD_ID",
  "SAFE_MARKER_RAW_CONVERSATION",
  "SAFE_MARKER_HIDDEN_REASONING",
  "SAFE_MARKER_RAW_DB_ROW",
  "SAFE_MARKER_RAW_DIFF",
  "SAFE_MARKER_TELEMETRY_DUMP",
];

for (const filePath of [
  docsPath,
  legacyDocsPath,
  builderPath,
  routePath,
  componentPath,
  fixturePath,
  legacyFixturePath,
  packagePath,
  latestIndexPath,
  roadmapPath,
  retrievalCompletionDocPath,
  retrievalSearchPath,
  retrievalStorePath,
  retrievalRebuildPath,
  retrievalSearchRoutePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const docs = normalize(readText(docsPath));
const legacyDocs = normalize(readText(legacyDocsPath));
const builderSource = readText(builderPath);
const routeSource = readText(routePath);
const componentSource = readText(componentPath);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(readText(packagePath));
const latestIndex = normalize(readText(latestIndexPath));
const roadmap = normalize(readText(roadmapPath));

const builder = await import(pathToFileURL(builderPath).href);
const route = await import(pathToFileURL(routePath).href);
const store = await import(pathToFileURL(retrievalStorePath).href);
const rebuild = await import(pathToFileURL(retrievalRebuildPath).href);

rmSync(tempRoot, { recursive: true, force: true });
mkdirSync(tempRoot, { recursive: true });
process.on("exit", () => rmSync(tempRoot, { recursive: true, force: true }));

assertDocsCoverage();
assertPackageAndIndexCoverage();
assertFixtureCoverage();
assertLibraryAndRouteExports();
assertStaticBoundaries();
seedRetrievalIndexDb();
await assertPreviewRouteRuntime();
assertBuilderEdgeCases();
assertFixtureSafety();
rmSync(tempRoot, { recursive: true, force: true });
runExistingSmokes();

console.log(
  JSON.stringify(
    {
      smoke: "rag-context-preview-runtime-completion-v0-1",
      final_status: "pass",
      preview_version: previewVersion,
      request_version: requestVersion,
      result_version: resultVersion,
      search_version: searchVersion,
      scope,
    },
    null,
    2,
  ),
);

function assertDocsCoverage() {
  for (const phrase of [
    "original Phase 3.7 RAG context preview requirements",
    "DB-backed retrieval search results",
    "caller-provided-results only",
    "creates context previews only",
    "does not generate final answers",
    "does not call providers",
    "does not send prompts",
    "does not fetch sources",
    "does not crawl",
    "does not create embeddings",
    "does not use vector search",
    "does not write retrieval indexes",
    "does not write DB",
    "does not create proof/evidence",
    "does not write claim/evidence records",
    "does not mutate candidates",
    "does not write review memory",
    "does not promote Perspective",
    "does not write/apply durable Perspective state",
    "does not write Formation Receipts",
    "does not execute Git/GitHub",
    "does not execute Codex",
    "does not product-write",
    "does not allocate product IDs",
    "Product-write remains parked by #686",
    "RAG context is not truth",
    "RAG context is not proof",
    "RAG context is not accepted evidence",
    "RAG context is not promotion readiness",
    "Retrieval result is not evidence",
    "Retrieval score is not truth score",
    "Retrieval score is not promotion readiness",
    "Source refs are lineage pointers, not proof",
    "Smoke/CI pass is not truth",
    "The roadmap guide is not SSOT",
  ]) {
    assert.ok(docs.includes(normalize(phrase)), `docs must mention ${phrase}`);
  }
  assert.ok(legacyDocs.includes("caller-provided retrieval search results"));
  assert.ok(roadmap.includes("retrieved_refs"));
  assert.ok(roadmap.includes("included_context_summaries"));
  assert.ok(roadmap.includes("candidate_vs_durable_markers"));
  assert.ok(roadmap.includes("final answer as truth"));
}

function assertPackageAndIndexCoverage() {
  assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
  for (const pointer of [
    "RAG_CONTEXT_PREVIEW_RUNTIME_COMPLETION_V0_1.md",
    "rag-context-preview-runtime-completion.sample.v0.1.json",
    "smoke-rag-context-preview-runtime-completion-v0-1.mjs",
    "app/api/research-retrieval/rag-context-preview/route.ts",
    packageScriptName,
  ]) {
    assert.ok(latestIndex.includes(pointer), `latest index must mention ${pointer}`);
  }
}

function assertFixtureCoverage() {
  for (const key of [
    "fixture_version",
    "preview_version",
    "request_version",
    "result_version",
    "search_version",
    "scope",
    "safe_preview_request_example",
    "safe_search_seed_rebuild_input_example",
    "safe_search_results_example",
    "expected_context_preview_result_example",
    "no_results_preview_example",
    "stale_exclusion_example",
    "max_items_exclusion_example",
    "max_chars_exclusion_example",
    "candidate_vs_durable_marker_examples",
    "unresolved_tension_examples",
    "knowledge_gap_examples",
    "blocked_private_or_raw_payload_example",
    "blocked_forbidden_authority_example",
    "invalid_db_path_example",
    "invalid_query_example",
    "authority_boundary_sample",
  ]) {
    assert.ok(Object.hasOwn(fixture, key), `fixture missing ${key}`);
  }
  assert.equal(fixture.preview_version, previewVersion);
  assert.equal(fixture.request_version, requestVersion);
  assert.equal(fixture.result_version, resultVersion);
  assert.equal(fixture.search_version, searchVersion);
  assert.equal(fixture.scope, scope);
  assertAuthorityBoundary(fixture.authority_boundary_sample);
}

function assertLibraryAndRouteExports() {
  for (const name of [
    "createRagContextPreviewRuntimeCompletionAuthorityBoundaryV01",
    "validateRagContextPreviewRuntimeRequestV01",
    "buildRagContextPreviewRuntimeCompletionV01",
    "buildRagContextPreviewFromSearchResultsV01",
    "createRagContextPreviewRuntimeFingerprintV01",
  ]) {
    assert.equal(typeof builder[name], "function", `${name} must be exported`);
  }
  assert.equal(typeof route.POST, "function", "route must export POST");
  assert.equal(route.GET, undefined, "route must not export GET");
}

function assertStaticBoundaries() {
  assert.ok(routeSource.includes("fileMustExist: true"), "route opens DB read-only fileMustExist");
  assert.ok(routeSource.includes("readonly: true"), "route uses readonly DB");
  assert.ok(!routeSource.includes("ensureResearchRetrievalIndexSchemaV01"), "preview route must not ensure schema");
  assert.ok(!routeSource.includes("rebuildResearchRetrievalIndexV01"), "preview route must not rebuild index");
  assert.ok(componentSource.includes("DB-backed RAG context preview only"));
  assert.ok(componentSource.includes("Included context summaries"));
  assert.ok(componentSource.includes("Excluded context reasons"));
  assert.ok(componentSource.includes("Candidate vs durable markers"));
  assert.ok(componentSource.includes("Staleness warnings"));
  assert.ok(componentSource.includes("Unresolved tensions"));
  assert.ok(componentSource.includes("Knowledge gaps"));
  assert.ok(componentSource.includes("Authority boundary"));
  for (const [label, source] of [
    ["builder", builderSource],
    ["route", routeSource],
    ["component", componentSource],
  ]) {
    assert.doesNotMatch(source, /\bOpenAI\b|chat\.completions|responses\.create/i, `${label} must not call providers`);
    assert.doesNotMatch(source, /\bfetch\s*\(/, `${label} must not fetch`);
    assert.doesNotMatch(source, /createEmbedding|embeddings\.create|pgvector|chromadb|vector\s+database/i, `${label} must not create embeddings/vector search`);
    assert.doesNotMatch(source, /final_answer_text|answer_text|prompt_text|actual_prompt/i, `${label} must not add answer or prompt text fields`);
  }
}

function seedRetrievalIndexDb() {
  const db = new Database(dbPath);
  try {
    store.ensureResearchRetrievalIndexSchemaV01(db);
    const input = {
      ...fixture.safe_search_seed_rebuild_input_example,
      db_path: dbPath,
    };
    const result = rebuild.rebuildResearchRetrievalIndexV01(input, db);
    assert.equal(result.status, "rebuilt");
    assert.equal(countRows(db, "research_retrieval_index_entries"), input.entries.length);
  } finally {
    db.close();
  }
}

async function assertPreviewRouteRuntime() {
  const before = dbCounts(dbPath);
  const response = await route.POST(
    localPostRequest({
      route_version: routeVersion,
      scope,
      input: {
        ...fixture.safe_preview_request_example,
        db_path: dbPath,
      },
    }),
  );
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.result.status, "context_preview_created");
  assert.equal(body.result.result_version, resultVersion);
  assert.equal(body.result.preview_version, previewVersion);
  assert.equal(body.result.retrieval_executed, true);
  assertFalseExecutionFlags(body.result);
  assertAuthorityBoundary(body.result.authority_boundary);
  assert.ok(body.result.included_context_summaries.length > 0);
  assert.ok(body.result.retrieved_refs.length > 0);
  assert.ok(body.result.candidate_vs_durable_markers.some((marker) => marker.marker === "provider_candidate_context"));
  assert.ok(body.result.candidate_vs_durable_markers.some((marker) => marker.marker === "durable_state_context"));
  assert.ok(body.result.staleness_warnings.length > 0);
  assert.ok(body.result.unresolved_tensions.length > 0);
  assert.ok(body.result.knowledge_gaps.length > 0);
  for (const item of body.result.included_context_summaries) {
    assert.equal(item.retrieval_score_is_truth, false);
    assert.equal(item.retrieval_score_is_promotion_readiness, false);
    assert.equal(item.retrieval_result_is_evidence, false);
    assert.equal(item.source_refs_are_lineage, true);
    assert.ok(item.source_ref_id, "included context requires source_ref_id");
  }
  assert.deepEqual(dbCounts(dbPath), before, "preview route must not write DB rows");
  assertNoUnsafeEcho(body, "safe route response");

  const noResultsResponse = await route.POST(
    localPostRequest({
      route_version: routeVersion,
      scope,
      input: {
        ...fixture.safe_preview_request_example,
        db_path: dbPath,
        preview_request_id: "rag-context-preview-request:no-results",
        query: fixture.no_results_preview_example.query,
      },
    }),
  );
  const noResultsBody = await noResultsResponse.json();
  assert.equal(noResultsResponse.status, 200);
  assert.equal(noResultsBody.result.status, "no_retrieval_results");

  const maxItemsResponse = await route.POST(
    localPostRequest({
      route_version: routeVersion,
      scope,
      input: {
        ...fixture.safe_preview_request_example,
        db_path: dbPath,
        preview_request_id: "rag-context-preview-request:max-items",
        max_context_items: fixture.max_items_exclusion_example.max_context_items,
      },
    }),
  );
  const maxItemsBody = await maxItemsResponse.json();
  assert.equal(maxItemsResponse.status, 200);
  assert.ok(
    maxItemsBody.result.excluded_context_reasons.some(
      (item) => item.exclusion_reason === fixture.max_items_exclusion_example.expected_exclusion_reason,
    ),
  );

  const maxCharsResponse = await route.POST(
    localPostRequest({
      route_version: routeVersion,
      scope,
      input: {
        ...fixture.safe_preview_request_example,
        db_path: dbPath,
        preview_request_id: "rag-context-preview-request:max-chars",
        max_context_chars: fixture.max_chars_exclusion_example.max_context_chars,
      },
    }),
  );
  const maxCharsBody = await maxCharsResponse.json();
  assert.equal(maxCharsResponse.status, 200);
  assert.ok(
    maxCharsBody.result.excluded_context_reasons.some(
      (item) => item.exclusion_reason === fixture.max_chars_exclusion_example.expected_exclusion_reason,
    ),
  );

  const missingSourceResponse = await route.POST(
    localPostRequest({
      route_version: routeVersion,
      scope,
      input: {
        ...fixture.safe_preview_request_example,
        db_path: dbPath,
        preview_request_id: "rag-context-preview-request:missing-source",
        query: "missing source ref context",
      },
    }),
  );
  const missingSourceBody = await missingSourceResponse.json();
  assert.equal(missingSourceResponse.status, 200);
  assert.ok(missingSourceBody.result.excluded_context_reasons.some((item) => item.exclusion_reason === "missing_source_ref"));

  const privateResponse = await route.POST(
    localPostRequest({
      route_version: routeVersion,
      scope,
      input: {
        ...fixture.blocked_private_or_raw_payload_example,
        db_path: dbPath,
      },
    }),
  );
  const privateBody = await privateResponse.json();
  assert.equal(privateResponse.status, 400);
  assert.equal(privateBody.error_code, "blocked_private_or_raw_payload");
  assertNoUnsafeEcho(privateBody, "private blocked response");

  const forbiddenResponse = await route.POST(
    localPostRequest({
      route_version: routeVersion,
      scope,
      input: {
        ...fixture.blocked_forbidden_authority_example,
        db_path: dbPath,
      },
    }),
  );
  const forbiddenBody = await forbiddenResponse.json();
  assert.equal(forbiddenResponse.status, 403);
  assert.equal(forbiddenBody.error_code, "blocked_forbidden_authority");

  const invalidQueryResponse = await route.POST(
    localPostRequest({
      route_version: routeVersion,
      scope,
      input: {
        ...fixture.safe_preview_request_example,
        db_path: dbPath,
        preview_request_id: "rag-context-preview-request:invalid-query",
        query: fixture.invalid_query_example.query,
      },
    }),
  );
  const invalidQueryBody = await invalidQueryResponse.json();
  assert.equal(invalidQueryResponse.status, 400);
  assert.equal(invalidQueryBody.error_code, "blocked_invalid_input");

  const invalidPath = fixture.invalid_db_path_example.db_path;
  const invalidPathResponse = await route.POST(
    localPostRequest({
      route_version: routeVersion,
      scope,
      input: {
        ...fixture.safe_preview_request_example,
        db_path: invalidPath,
      },
    }),
  );
  const invalidPathBody = await invalidPathResponse.json();
  assert.equal(invalidPathResponse.status, 400);
  assert.equal(invalidPathBody.error_code, "invalid_db_path");
  assert.doesNotMatch(JSON.stringify(invalidPathBody), /\.\.\/research-retrieval/);

  const missingDbResponse = await route.POST(
    localPostRequest({
      route_version: routeVersion,
      scope,
      input: {
        ...fixture.safe_preview_request_example,
        db_path: missingDbPath,
      },
    }),
  );
  const missingDbBody = await missingDbResponse.json();
  assert.equal(missingDbResponse.status, 404);
  assert.equal(missingDbBody.error_code, "db_missing");
  assert.equal(existsSync(missingDbPath), false);

  mkdirSync(dirname(schemaMissingDbPath), { recursive: true });
  const schemaDb = new Database(schemaMissingDbPath);
  schemaDb.close();
  const schemaMissingResponse = await route.POST(
    localPostRequest({
      route_version: routeVersion,
      scope,
      input: {
        ...fixture.safe_preview_request_example,
        db_path: schemaMissingDbPath,
      },
    }),
  );
  const schemaMissingBody = await schemaMissingResponse.json();
  assert.equal(schemaMissingResponse.status, 400);
  assert.equal(schemaMissingBody.error_code, "schema_missing");

  const crossSiteResponse = await route.POST(
    new Request("http://localhost:3000/api/research-retrieval/rag-context-preview", {
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
        input: {
          ...fixture.safe_preview_request_example,
          db_path: dbPath,
        },
      }),
    }),
  );
  const crossSiteBody = await crossSiteResponse.json();
  assert.equal(crossSiteResponse.status, 403);
  assert.equal(crossSiteBody.error_code, "same_origin_required");
}

function assertBuilderEdgeCases() {
  const staleFake = builder.buildRagContextPreviewFromSearchResultsV01(
    {
      ...fixture.safe_preview_request_example,
      db_path: dbPath,
      preview_request_id: "rag-context-preview-request:stale-exclusion-builder",
      include_stale: false,
    },
    {
      search_version: searchVersion,
      scope,
      status: "searched",
      search_request_id: "search:stale-exclusion-builder",
      result_count: 1,
      results: [
        {
          ...fixture.safe_search_results_example.results[0],
          result_ref: "retrieval-search-result:stale-builder",
          index_entry_id: "retrieval-index-entry:stale-builder",
          stale_marker: "stale",
        },
      ],
      retrieval_executed: true,
      rag_answer_generated: false,
      provider_call_executed: false,
      prompt_sent: false,
      source_fetch_executed: false,
      embedding_created: false,
      vector_search_executed: false,
      proof_or_evidence_created: false,
      claim_or_evidence_written: false,
      promotion_executed: false,
      durable_state_written: false,
      formation_receipt_written: false,
      product_write_executed: false,
      product_id_allocated: false,
      authority_boundary: {},
      reason_codes: [],
    },
  );
  assert.equal(staleFake.status, "no_retrieval_results");
  assert.ok(staleFake.excluded_context_reasons.some((item) => item.exclusion_reason === "stale_excluded"));

  const invalidDbValidation = builder.validateRagContextPreviewRuntimeRequestV01({
    ...fixture.safe_preview_request_example,
    db_path: fixture.invalid_db_path_example.db_path,
  });
  assert.equal(invalidDbValidation.passed, false);
  assert.equal(invalidDbValidation.status, "blocked_invalid_input");
}

function assertFalseExecutionFlags(result) {
  for (const [key, expected] of Object.entries({
    rag_answer_generated: false,
    provider_call_executed: false,
    prompt_sent: false,
    source_fetch_executed: false,
    embedding_created: false,
    vector_search_executed: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    candidate_mutation_executed: false,
    promotion_executed: false,
    durable_state_written: false,
    formation_receipt_written: false,
    product_write_executed: false,
    product_id_allocated: false,
  })) {
    assert.equal(result[key], expected, `${key} must be false`);
  }
}

function assertAuthorityBoundary(boundary) {
  assert.ok(boundary && typeof boundary === "object", "authority boundary must exist");
  for (const field of allowedTrueBoundaryFields) {
    assert.equal(boundary[field], true, `${field} must be true`);
  }
  for (const field of forbiddenFalseBoundaryFields) {
    assert.equal(boundary[field], false, `${field} must be false`);
  }
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

function assertNoUnsafeEcho(value, label) {
  const text = JSON.stringify(value);
  for (const marker of safeMarkers) {
    assert.equal(text.includes(marker), false, `${label} must not echo ${marker}`);
  }
  assert.doesNotMatch(text, /sk-[A-Za-z0-9]|ghp_[A-Za-z0-9]|OPENAI_API_KEY|GITHUB_TOKEN/);
  assert.doesNotMatch(text, /\/Users\/|\/home\/|file:\/\//);
}

function assertFixtureSafety() {
  const parsed = JSON.parse(fixtureText);
  for (const marker of safeMarkers) assertMarkerOnlyInsideBlockedExamples(parsed, marker, []);
  assert.doesNotMatch(fixtureText, /sk-[A-Za-z0-9]|ghp_[A-Za-z0-9]|OPENAI_API_KEY|GITHUB_TOKEN/);
  assert.doesNotMatch(fixtureText, /\/Users\/|\/home\/|file:\/\//);
}

function assertMarkerOnlyInsideBlockedExamples(value, marker, path) {
  if (typeof value === "string") {
    if (value.includes(marker)) assert.match(path.join("."), /blocked/, `${marker} outside blocked example`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertMarkerOnlyInsideBlockedExamples(item, marker, [...path, String(index)]));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      assertMarkerOnlyInsideBlockedExamples(nested, marker, [...path, key]);
    }
  }
}

function runExistingSmokes() {
  for (const scriptName of [
    "smoke:rag-context-preview-v0-1",
    "smoke:research-retrieval-index-runtime-completion-v0-1",
    "smoke:provider-assisted-extraction-runtime-completion-v0-1",
    "smoke:bounded-source-intake-runtime-completion-v0-1",
  ]) {
    execFileSync("npm", ["run", scriptName], { stdio: "pipe" });
  }
}

function localPostRequest(body) {
  return new Request("http://localhost:3000/api/research-retrieval/rag-context-preview", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost:3000",
    },
    body: JSON.stringify(body),
  });
}

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

function normalize(value) {
  return value.replace(/\s+/g, " ").trim();
}
