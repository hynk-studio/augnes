import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const docsPath = "docs/REBUILDABLE_RETRIEVAL_INDEX_RUNTIME_COMPLETION_V0_1.md";
const legacyDocsPath = "docs/REBUILDABLE_RETRIEVAL_INDEX_RUNTIME_V0_1.md";
const contractDocsPath = "docs/RESEARCH_RETRIEVAL_RAG_RUNTIME_V0_1.md";
const indexStorePath = "lib/research-retrieval/index-store.ts";
const rebuildPath = "lib/research-retrieval/rebuild-index.ts";
const searchPath = "lib/research-retrieval/search-index.ts";
const rebuildRoutePath = "app/api/research-retrieval/rebuild/route.ts";
const searchRoutePath = "app/api/research-retrieval/search/route.ts";
const fixturePath = "fixtures/research-retrieval-index-runtime-completion.sample.v0.1.json";
const packagePath = "package.json";
const latestIndexPath = "docs/00_INDEX_LATEST.md";
const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";

const packageScriptName = "smoke:research-retrieval-index-runtime-completion-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-research-retrieval-index-runtime-completion-v0-1.mjs";
const rebuildVersion = "research_retrieval_index_runtime_completion_rebuild.v0.1";
const searchVersion = "research_retrieval_index_runtime_completion_search.v0.1";
const indexVersion = "research_retrieval_index_runtime_completion_index.v0.1";
const scope = "project:augnes";
const tempRoot = `.tmp/research-retrieval/runtime-completion-smoke-${process.pid}`;
const helperDbPath = `${tempRoot}/helper-index.sqlite`;
const routeDbPath = `${tempRoot}/route-index.sqlite`;
const missingDbPath = `${tempRoot}/missing-index.sqlite`;
const schemaMissingDbPath = `${tempRoot}/schema-missing.sqlite`;

const allowedTrueBoundaryFields = [
  "rebuildable_retrieval_index_runtime_now",
  "explicit_operator_rebuild_only",
  "explicit_operator_search_only",
  "caller_injected_db_only",
  "db_query_or_write_now",
  "public_safe_derived_entries_only",
  "stale_marker_visible",
  "backrefs_visible",
];
const conditionalBoundaryFields = ["derived_index_write_now", "derived_index_search_now"];
const forbiddenFalseBoundaryFields = [
  "provider_openai_call_now",
  "prompt_sent_now",
  "source_fetch_now",
  "live_crawling_now",
  "embedding_created_now",
  "vector_search_now",
  "rag_answer_generation_now",
  "raw_source_body_indexed_now",
  "raw_provider_output_indexed_now",
  "raw_retrieval_output_stored_now",
  "hidden_reasoning_stored_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
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
  "retrieval_result_is_evidence",
  "retrieval_result_is_truth",
  "retrieval_score_is_truth",
  "retrieval_score_is_promotion_readiness",
  "rag_context_is_truth",
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
  contractDocsPath,
  indexStorePath,
  rebuildPath,
  searchPath,
  rebuildRoutePath,
  searchRoutePath,
  fixturePath,
  packagePath,
  latestIndexPath,
  roadmapPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const docs = normalize(readText(docsPath));
const legacyDocs = normalize(readText(legacyDocsPath));
const contractDocs = normalize(readText(contractDocsPath));
const indexStoreSource = readText(indexStorePath);
const rebuildSource = readText(rebuildPath);
const searchSource = readText(searchPath);
const rebuildRouteSource = readText(rebuildRoutePath);
const searchRouteSource = readText(searchRoutePath);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(readText(packagePath));
const latestIndex = normalize(readText(latestIndexPath));
const roadmap = normalize(readText(roadmapPath));

const indexStore = await import(pathToFileURL(indexStorePath).href);
const rebuild = await import(pathToFileURL(rebuildPath).href);
const search = await import(pathToFileURL(searchPath).href);
const rebuildRoute = await import(pathToFileURL(rebuildRoutePath).href);
const searchRoute = await import(pathToFileURL(searchRoutePath).href);

rmSync(tempRoot, { recursive: true, force: true });
mkdirSync(tempRoot, { recursive: true });
process.on("exit", () => rmSync(tempRoot, { recursive: true, force: true }));

assertDocsAndRoadmapCoverage();
assertPackageAndIndexCoverage();
assertFixtureCoverage();
assertLibraryExports();
assertRouteShape();
assertStaticRuntimeBoundaries();
assertDbPathPolicy();
assertHelperRuntimeBehavior();
await assertRouteRuntimeBehavior();
assertFixtureSafety();

console.log(
  JSON.stringify(
    {
      smoke: "research-retrieval-index-runtime-completion-v0-1",
      final_status: "pass",
      rebuild_version: rebuildVersion,
      search_version: searchVersion,
      index_version: indexVersion,
      scope,
    },
    null,
    2,
  ),
);

function assertDocsAndRoadmapCoverage() {
  for (const phrase of [
    "original Phase 3.6 rebuildable retrieval index runtime completion",
    "writes derived retrieval index rows only",
    "does not create proof/evidence",
    "does not write claim/evidence records",
    "does not promote Perspective",
    "does not write/apply durable Perspective state",
    "does not write Formation Receipts",
    "does not call providers",
    "does not send prompts",
    "does not fetch sources",
    "does not crawl",
    "does not create embeddings",
    "does not use vector search",
    "does not generate RAG answers",
    "does not execute Git/GitHub",
    "does not execute Codex",
    "does not product-write",
    "does not allocate product IDs",
    "Product-write remains parked by #686",
    "Index is derived and rebuildable",
    "Search result is not evidence",
    "Retrieval score is not truth score",
    "Retrieval score is not promotion readiness",
    "Source refs are lineage pointers, not proof",
    "Smoke/CI pass is not truth",
    "The roadmap guide is not SSOT",
    "Follow-up RAG context preview completion should use this search runtime",
  ]) {
    assert.ok(docs.includes(normalize(phrase)), `docs must mention: ${phrase}`);
  }
  assert.ok(legacyDocs.includes("in-memory derived cache"), "legacy docs must show earlier runtime was process-local");
  assert.ok(contractDocs.includes("RAG"), "contract docs must exist and mention RAG");
  assert.ok(
    roadmap.includes("SQLite FTS or deterministic simple index") ||
      roadmap.includes("SQLite FTS 또는 deterministic simple index") ||
      roadmap.includes("rebuildable retrieval index"),
    "roadmap must contain Phase 3.6 retrieval index requirements",
  );
}

function assertPackageAndIndexCoverage() {
  assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
  assert.ok(latestIndex.includes("REBUILDABLE_RETRIEVAL_INDEX_RUNTIME_COMPLETION_V0_1.md"));
  assert.ok(latestIndex.includes("research-retrieval-index-runtime-completion.sample.v0.1.json"));
  assert.ok(latestIndex.includes(packageScriptName));
  assert.ok(latestIndex.includes("Product-write remains parked by #686"));
  assert.ok(latestIndex.includes("The roadmap guide is not SSOT"));
}

function assertFixtureCoverage() {
  for (const key of [
    "fixture_version",
    "rebuild_version",
    "search_version",
    "index_version",
    "scope",
    "safe_db_path_examples",
    "unsafe_db_path_examples",
    "safe_rebuild_input_example",
    "safe_index_entries_example",
    "safe_search_input_example",
    "expected_rebuild_result_example",
    "expected_search_result_example",
    "stale_entry_example",
    "blocked_private_or_raw_payload_example",
    "blocked_forbidden_authority_example",
    "invalid_db_path_example",
    "invalid_query_example",
    "invalid_raw_source_body_entry_example",
    "authority_boundary_sample",
  ]) {
    assert.ok(Object.hasOwn(fixture, key), `fixture missing ${key}`);
  }
  assert.equal(fixture.rebuild_version, rebuildVersion);
  assert.equal(fixture.search_version, searchVersion);
  assert.equal(fixture.index_version, indexVersion);
  assert.equal(fixture.scope, scope);
  assert.equal(fixture.safe_rebuild_input_example.scope, scope);
  assert.equal(fixture.safe_search_input_example.scope, scope);
  assert.ok(fixture.safe_rebuild_input_example.entries.length >= 7);
  for (const dbPath of fixture.safe_db_path_examples) {
    assert.equal(indexStore.isSafeResearchRetrievalDbPathV01(dbPath), true, `${dbPath} should be safe`);
  }
  for (const dbPath of fixture.unsafe_db_path_examples) {
    assert.equal(indexStore.isSafeResearchRetrievalDbPathV01(dbPath), false, `${dbPath} should be rejected`);
  }
  assertAuthorityBoundary(fixture.authority_boundary_sample, {
    derived_index_write_now: true,
    derived_index_search_now: true,
  });
}

function assertLibraryExports() {
  for (const [moduleName, moduleValue, names] of [
    [
      "index-store",
      indexStore,
      [
        "ensureResearchRetrievalIndexSchemaV01",
        "researchRetrievalIndexSchemaExistsV01",
        "replaceResearchRetrievalIndexEntriesV01",
        "readResearchRetrievalIndexMetadataV01",
        "createResearchRetrievalIndexAuthorityBoundaryV01",
        "isSafeResearchRetrievalDbPathV01",
      ],
    ],
    [
      "rebuild-index",
      rebuild,
      [
        "validateResearchRetrievalRebuildInputV01",
        "rebuildResearchRetrievalIndexV01",
        "normalizeResearchRetrievalIndexEntryV01",
        "createResearchRetrievalIndexEntryIdV01",
        "tokenizeResearchRetrievalTextV01",
      ],
    ],
    [
      "search-index",
      search,
      [
        "validateResearchRetrievalSearchInputV01",
        "searchResearchRetrievalIndexV01",
        "createResearchRetrievalSearchResultFingerprintV01",
      ],
    ],
  ]) {
    for (const name of names) assert.equal(typeof moduleValue[name], "function", `${moduleName}.${name} export`);
  }
}

function assertRouteShape() {
  assert.equal(typeof rebuildRoute.POST, "function", "rebuild route must export POST");
  assert.equal(typeof searchRoute.POST, "function", "search route must export POST");
  assert.equal(rebuildRoute.GET, undefined, "rebuild route must not export GET");
  assert.equal(searchRoute.GET, undefined, "search route must not export GET");
  assert.ok(rebuildRouteSource.includes("ensureResearchRetrievalIndexSchemaV01"));
  assert.ok(searchRouteSource.includes("fileMustExist: true"));
  assert.ok(searchRouteSource.includes("existsSync"));
}

function assertStaticRuntimeBoundaries() {
  for (const [label, source] of [
    ["index store", indexStoreSource],
    ["rebuild helper", rebuildSource],
    ["search helper", searchSource],
    ["rebuild route", rebuildRouteSource],
    ["search route", searchRouteSource],
  ]) {
    assert.doesNotMatch(source, /\bOpenAI\b|provider\/openai|chat\.completions|responses\.create/i, `${label} must not call providers`);
    assert.doesNotMatch(source, /\bfetch\s*\(/, `${label} must not fetch sources`);
    assert.doesNotMatch(
      source,
      /createEmbedding|embeddings\.create|new\s+Vector|pgvector|chromadb|vector\s+database/i,
      `${label} must not implement embeddings/vector DB`,
    );
    assert.doesNotMatch(source, /rag answer/i, `${label} must not generate RAG answers`);
    assert.doesNotMatch(source, /github\.com\/|Octokit|gh\s+pr/i, `${label} must not call GitHub`);
  }
  assert.doesNotMatch(rebuildRouteSource + searchRouteSource, /app\/api\/product|product-id|allocateProduct/i);
}

function assertDbPathPolicy() {
  assert.equal(indexStore.isSafeResearchRetrievalDbPathV01("tmp/research-retrieval/index.sqlite"), true);
  assert.equal(indexStore.isSafeResearchRetrievalDbPathV01(".tmp/research-retrieval/index.db"), true);
  for (const dbPath of [
    "/tmp/research-retrieval/index.sqlite",
    "../tmp/research-retrieval/index.sqlite",
    "tmp/research-retrieval/index.txt",
    "tmp\\research-retrieval\\index.sqlite",
    "url-scheme://research-retrieval/index.sqlite",
    "tmp/research-retrieval/secret-token.sqlite",
  ]) {
    assert.equal(indexStore.isSafeResearchRetrievalDbPathV01(dbPath), false, `${dbPath} must be rejected`);
  }
}

function assertHelperRuntimeBehavior() {
  const db = new Database(helperDbPath);
  try {
    assert.equal(indexStore.researchRetrievalIndexSchemaExistsV01(db), false);
    indexStore.ensureResearchRetrievalIndexSchemaV01(db);
    assert.equal(indexStore.researchRetrievalIndexSchemaExistsV01(db), true);

    const rebuildInput = makeRebuildInput(helperDbPath);
    const validation = rebuild.validateResearchRetrievalRebuildInputV01(rebuildInput);
    assert.equal(validation.passed, true);
    const rebuildResult = rebuild.rebuildResearchRetrievalIndexV01(rebuildInput, db);
    assert.equal(rebuildResult.status, "rebuilt");
    assert.equal(rebuildResult.entry_count, rebuildInput.entries.length);
    assert.equal(rebuildResult.stale_count, 1);
    assert.equal(countRows(db, "research_retrieval_index_entries"), rebuildInput.entries.length);
    assert.ok(countRows(db, "research_retrieval_index_terms") > rebuildInput.entries.length);
    assert.equal(countRows(db, "research_retrieval_index_rebuilds"), 1);
    assertAuthorityBoundary(rebuildResult.authority_boundary, {
      derived_index_write_now: true,
      derived_index_search_now: false,
    });

    const metadata = indexStore.readResearchRetrievalIndexMetadataV01(db);
    assert.equal(metadata.schema_exists, true);
    assert.equal(metadata.entry_count, rebuildInput.entries.length);
    assert.ok(metadata.index_versions.includes(indexVersion));

    const searchInput = makeSearchInput(helperDbPath, {
      query: "calibration evidence review",
      include_stale: true,
      filters: { candidate_ref: "candidate-ref:calibration-claim" },
    });
    const searchResult = search.searchResearchRetrievalIndexV01(searchInput, db);
    assert.equal(searchResult.status, "searched");
    assert.ok(searchResult.results.length >= 2);
    assert.equal(searchResult.retrieval_executed, true);
    assert.equal(searchResult.rag_answer_generated, false);
    assert.equal(searchResult.provider_call_executed, false);
    assert.equal(searchResult.embedding_created, false);
    assert.equal(searchResult.vector_search_executed, false);
    assert.equal(searchResult.proof_or_evidence_created, false);
    assert.equal(searchResult.promotion_executed, false);
    assert.equal(searchResult.product_write_executed, false);
    for (const result of searchResult.results) {
      assert.equal(result.score_is_truth, false);
      assert.equal(result.score_is_promotion_readiness, false);
      assert.equal(result.retrieval_result_is_evidence, false);
      assert.equal(result.source_refs_are_lineage, true);
      assert.ok(result.candidate_ref || result.source_ref_id || result.review_record_ref);
      assertNoUnsafeEcho(result, "search result");
    }
    assertAuthorityBoundary(searchResult.authority_boundary, {
      derived_index_write_now: false,
      derived_index_search_now: true,
    });

    const sourceSurfaceSearch = search.searchResearchRetrievalIndexV01(
      makeSearchInput(helperDbPath, {
        query: "calibration source",
        include_stale: true,
        filters: { source_surface: "bounded_source_intake_summary" },
      }),
      db,
    );
    assert.equal(sourceSurfaceSearch.status, "searched");
    assert.ok(sourceSurfaceSearch.results.every((result) => result.source_surface === "bounded_source_intake_summary"));

    const staleExcludedSearch = search.searchResearchRetrievalIndexV01(
      makeSearchInput(helperDbPath, {
        query: "operator evidence promotion",
        include_stale: false,
        filters: {},
      }),
      db,
    );
    assert.ok(staleExcludedSearch.results.every((result) => result.stale_marker !== "stale"));

    const staleIncludedSearch = search.searchResearchRetrievalIndexV01(
      makeSearchInput(helperDbPath, {
        query: "operator evidence promotion",
        include_stale: true,
        filters: {},
      }),
      db,
    );
    assert.ok(staleIncludedSearch.results.some((result) => result.stale_marker === "stale"));

    const firstFingerprint = search.createResearchRetrievalSearchResultFingerprintV01(searchResult.results[0]);
    const secondFingerprint = search.createResearchRetrievalSearchResultFingerprintV01(searchResult.results[0]);
    assert.equal(firstFingerprint, secondFingerprint);

    const duplicateInput = makeRebuildInput(helperDbPath, {
      rebuild_request_id: "retrieval-rebuild-request:duplicate-dedupe",
      entries: [...rebuildInput.entries, rebuildInput.entries[0]],
    });
    const duplicateResult = rebuild.rebuildResearchRetrievalIndexV01(duplicateInput, db);
    assert.equal(duplicateResult.status, "rebuilt");
    assert.equal(duplicateResult.duplicate_entry_count, 1);
    assert.equal(countRows(db, "research_retrieval_index_entries"), rebuildInput.entries.length);

    const reducedInput = makeRebuildInput(helperDbPath, {
      rebuild_request_id: "retrieval-rebuild-request:reduced",
      entries: [rebuildInput.entries[0]],
    });
    const reducedResult = rebuild.rebuildResearchRetrievalIndexV01(reducedInput, db);
    assert.equal(reducedResult.status, "rebuilt");
    assert.equal(countRows(db, "research_retrieval_index_entries"), 1);
    const restoredResult = rebuild.rebuildResearchRetrievalIndexV01(
      makeRebuildInput(helperDbPath, { rebuild_request_id: "retrieval-rebuild-request:restored" }),
      db,
    );
    assert.equal(restoredResult.status, "rebuilt");
    assert.equal(countRows(db, "research_retrieval_index_entries"), rebuildInput.entries.length);

    const deterministicFirst = search.searchResearchRetrievalIndexV01(searchInput, db);
    const deterministicSecond = search.searchResearchRetrievalIndexV01(searchInput, db);
    assert.deepEqual(deterministicSecond.results, deterministicFirst.results);

    const beforeInvalidRows = countRows(db, "research_retrieval_index_entries");
    const privateResult = rebuild.rebuildResearchRetrievalIndexV01(
      {
        ...fixture.blocked_private_or_raw_payload_example,
        db_path: helperDbPath,
      },
      db,
    );
    assert.equal(privateResult.status, "blocked_private_or_raw_payload");
    assert.equal(countRows(db, "research_retrieval_index_entries"), beforeInvalidRows);
    assertNoUnsafeEcho(privateResult, "blocked private rebuild result");

    const invalidRawEntryInput = makeRebuildInput(helperDbPath, {
      rebuild_request_id: "retrieval-rebuild-request:invalid-raw-entry",
      entries: [fixture.invalid_raw_source_body_entry_example],
    });
    const invalidRawEntryResult = rebuild.rebuildResearchRetrievalIndexV01(invalidRawEntryInput, db);
    assert.equal(invalidRawEntryResult.status, "blocked_private_or_raw_payload");
    assert.equal(countRows(db, "research_retrieval_index_entries"), beforeInvalidRows);

    const forbiddenAuthoritySearch = search.searchResearchRetrievalIndexV01(
      {
        ...fixture.blocked_forbidden_authority_example,
        db_path: helperDbPath,
      },
      db,
    );
    assert.equal(forbiddenAuthoritySearch.status, "blocked_forbidden_authority");
    assertNoUnsafeEcho(forbiddenAuthoritySearch, "blocked authority search result");

    const invalidQuery = search.searchResearchRetrievalIndexV01(
      {
        ...fixture.invalid_query_example,
        db_path: helperDbPath,
      },
      db,
    );
    assert.equal(invalidQuery.status, "blocked_invalid_input");
  } finally {
    db.close();
  }
}

async function assertRouteRuntimeBehavior() {
  const rebuildResponse = await rebuildRoute.POST(
    localPostRequest("http://localhost:3000/api/research-retrieval/rebuild", {
      route_version: "rebuildable_retrieval_index_runtime_completion_rebuild_route.v0.1",
      scope,
      db_path: routeDbPath,
      input: makeRebuildInput(routeDbPath, {
        rebuild_request_id: "retrieval-rebuild-request:route",
      }),
    }),
  );
  const rebuildBody = await rebuildResponse.json();
  assert.equal(rebuildResponse.status, 200);
  assert.equal(rebuildBody.status, "ok");
  assert.equal(rebuildBody.result.status, "rebuilt");
  assert.ok(existsSync(routeDbPath));

  const listDb = new Database(routeDbPath, { readonly: true, fileMustExist: true });
  try {
    assert.equal(countRows(listDb, "research_retrieval_index_entries"), fixture.safe_rebuild_input_example.entries.length);
  } finally {
    listDb.close();
  }

  const searchResponse = await searchRoute.POST(
    localPostRequest("http://localhost:3000/api/research-retrieval/search", {
      route_version: "rebuildable_retrieval_index_runtime_completion_search_route.v0.1",
      scope,
      db_path: routeDbPath,
      input: makeSearchInput(routeDbPath, {
        search_request_id: "retrieval-search-request:route",
        query: "calibration review",
        include_stale: true,
      }),
    }),
  );
  const searchBody = await searchResponse.json();
  assert.equal(searchResponse.status, 200);
  assert.equal(searchBody.status, "ok");
  assert.equal(searchBody.result.status, "searched");
  assert.ok(searchBody.result.results.length > 0);
  assert.equal(searchBody.result.rag_answer_generated, false);
  assert.equal(searchBody.result.product_write_executed, false);

  const missingDbResponse = await searchRoute.POST(
    localPostRequest("http://localhost:3000/api/research-retrieval/search", {
      route_version: "rebuildable_retrieval_index_runtime_completion_search_route.v0.1",
      scope,
      db_path: missingDbPath,
      input: makeSearchInput(missingDbPath, {
        search_request_id: "retrieval-search-request:missing-db",
      }),
    }),
  );
  const missingDbBody = await missingDbResponse.json();
  assert.equal(missingDbResponse.status, 404);
  assert.equal(missingDbBody.error_code, "db_missing");
  assert.equal(existsSync(missingDbPath), false, "search route must not create missing DB");

  mkdirSync(dirname(schemaMissingDbPath), { recursive: true });
  const schemaMissingDb = new Database(schemaMissingDbPath);
  schemaMissingDb.close();
  const schemaMissingResponse = await searchRoute.POST(
    localPostRequest("http://localhost:3000/api/research-retrieval/search", {
      route_version: "rebuildable_retrieval_index_runtime_completion_search_route.v0.1",
      scope,
      db_path: schemaMissingDbPath,
      input: makeSearchInput(schemaMissingDbPath, {
        search_request_id: "retrieval-search-request:schema-missing",
      }),
    }),
  );
  const schemaMissingBody = await schemaMissingResponse.json();
  assert.equal(schemaMissingResponse.status, 400);
  assert.equal(schemaMissingBody.error_code, "schema_missing");

  const invalidDbPath = "../research-retrieval/route-index.sqlite";
  const invalidDbResponse = await searchRoute.POST(
    localPostRequest("http://localhost:3000/api/research-retrieval/search", {
      route_version: "rebuildable_retrieval_index_runtime_completion_search_route.v0.1",
      scope,
      db_path: invalidDbPath,
      input: makeSearchInput(routeDbPath, {
        search_request_id: "retrieval-search-request:invalid-db-path",
      }),
    }),
  );
  const invalidDbBody = await invalidDbResponse.json();
  assert.equal(invalidDbResponse.status, 400);
  assert.equal(invalidDbBody.error_code, "invalid_db_path");
  assert.doesNotMatch(JSON.stringify(invalidDbBody), /\.\.\/research-retrieval/);

  const forbiddenResponse = await rebuildRoute.POST(
    localPostRequest("http://localhost:3000/api/research-retrieval/rebuild", {
      route_version: "rebuildable_retrieval_index_runtime_completion_rebuild_route.v0.1",
      scope,
      db_path: routeDbPath,
      input: {
        ...makeRebuildInput(routeDbPath, {
          rebuild_request_id: "retrieval-rebuild-request:forbidden-authority-route",
        }),
        authority_boundary: {
          provider_openai_call_now: true,
          product_write_authority: "enabled",
        },
      },
    }),
  );
  const forbiddenBody = await forbiddenResponse.json();
  assert.equal(forbiddenResponse.status, 403);
  assert.equal(forbiddenBody.error_code, "blocked_forbidden_authority");

  const crossSiteResponse = await rebuildRoute.POST(
    new Request("http://localhost:3000/api/research-retrieval/rebuild", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        host: "localhost:3000",
        origin: "https://example.invalid",
        "sec-fetch-site": "cross-site",
      },
      body: JSON.stringify({
        route_version: "rebuildable_retrieval_index_runtime_completion_rebuild_route.v0.1",
        scope,
        db_path: routeDbPath,
        input: makeRebuildInput(routeDbPath),
      }),
    }),
  );
  const crossSiteBody = await crossSiteResponse.json();
  assert.equal(crossSiteResponse.status, 403);
  assert.equal(crossSiteBody.error_code, "same_origin_required");

  const invalidJsonResponse = await searchRoute.POST(
    new Request("http://localhost:3000/api/research-retrieval/search", {
      method: "POST",
      headers: localHeaders(),
      body: "{",
    }),
  );
  const invalidJsonBody = await invalidJsonResponse.json();
  assert.equal(invalidJsonResponse.status, 400);
  assert.equal(invalidJsonBody.error_code, "invalid_json_body");
}

function makeRebuildInput(dbPath, overrides = {}) {
  return {
    ...fixture.safe_rebuild_input_example,
    db_path: dbPath,
    entries: fixture.safe_rebuild_input_example.entries.map((entry) => ({ ...entry })),
    authority_boundary: {
      ...fixture.safe_rebuild_input_example.authority_boundary,
    },
    reason_codes: [...fixture.safe_rebuild_input_example.reason_codes],
    ...overrides,
  };
}

function makeSearchInput(dbPath, overrides = {}) {
  return {
    ...fixture.safe_search_input_example,
    db_path: dbPath,
    filters: {
      ...(fixture.safe_search_input_example.filters ?? {}),
      ...(overrides.filters ?? {}),
    },
    authority_boundary: {
      ...fixture.safe_search_input_example.authority_boundary,
    },
    reason_codes: [...fixture.safe_search_input_example.reason_codes],
    ...overrides,
  };
}

function countRows(db, tableName) {
  const row = db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get();
  return Number(row.count);
}

function assertAuthorityBoundary(boundary, conditional = {}) {
  for (const field of allowedTrueBoundaryFields) {
    assert.equal(boundary[field], true, `authority boundary ${field} must be true`);
  }
  for (const field of conditionalBoundaryFields) {
    if (Object.hasOwn(conditional, field)) {
      assert.equal(boundary[field], conditional[field], `authority boundary ${field} mismatch`);
    } else {
      assert.equal(typeof boundary[field], "boolean", `authority boundary ${field} must be boolean`);
    }
  }
  for (const field of forbiddenFalseBoundaryFields) {
    assert.equal(boundary[field], false, `authority boundary ${field} must be false`);
  }
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
  for (const marker of safeMarkers) {
    assertMarkerOnlyInsideBlockedExamples(parsed, marker, []);
  }
  assert.doesNotMatch(fixtureText, /sk-[A-Za-z0-9]|ghp_[A-Za-z0-9]|OPENAI_API_KEY|GITHUB_TOKEN/);
  assert.doesNotMatch(fixtureText, /\/Users\/|\/home\/|file:\/\//);
  assert.doesNotMatch(fixtureText, /raw provider output dump|raw retrieval output dump|raw conversation dump/i);
}

function assertMarkerOnlyInsideBlockedExamples(value, marker, path) {
  if (typeof value === "string") {
    if (value.includes(marker)) {
      const joined = path.join(".");
      assert.match(joined, /blocked|invalid_raw_source_body_entry_example/, `${marker} appears outside blocked example at ${joined}`);
    }
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

function localPostRequest(url, body) {
  return new Request(url, {
    method: "POST",
    headers: localHeaders(),
    body: JSON.stringify(body),
  });
}

function localHeaders() {
  return { "content-type": "application/json", host: "localhost:3000" };
}

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

function normalize(value) {
  return value.replace(/\s+/g, " ").trim();
}
