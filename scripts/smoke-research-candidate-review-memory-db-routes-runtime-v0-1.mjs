import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const docPath = "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_ROUTES_RUNTIME_COMPLETION_V0_1.md";
const legacyRouteDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_ROUTES_V0_1.md";
const dbStoreDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_STORE_RUNTIME_COMPLETION_V0_1.md";
const dbStoreHelperPath = "lib/research-candidate-review/review-memory-db-store.ts";
const routeContractPath = "lib/research-candidate-review/review-memory-db-route-contract.ts";
const routeAuditInstrumentationHelperPath = "lib/runtime-audit/route-audit-instrumentation.ts";
const collectionRoutePath = "app/api/research-candidate-review/review-records/route.ts";
const detailRoutePath =
  "app/api/research-candidate-review/review-records/[review_record_id]/route.ts";
const activityRoutePath =
  "app/api/research-candidate-review/review-records/[review_record_id]/activity/route.ts";
const discardRoutePath =
  "app/api/research-candidate-review/review-records/[review_record_id]/discard/route.ts";
const legacyJsonRoutePath = "app/api/research-candidate/review-memory/route.ts";
const fixturePath = "fixtures/research-candidate-review.memory-db-routes-runtime.sample.v0.1.json";
const dbStoreFixturePath = "fixtures/research-candidate-review.memory-db-store-runtime.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const packageScriptName = "smoke:research-candidate-review-memory-db-routes-runtime-v0-1";
const packageScriptValue =
  "node scripts/smoke-research-candidate-review-memory-db-routes-runtime-v0-1.mjs";

const routeVersion = "research_candidate_review_memory_db_routes.v0.1";
const dbStoreVersion = "research_candidate_review_memory_db_store.v0.1";
const contractVersion = "research_candidate_review_memory_contract.v0.1";
const scope = "project:augnes";
const requiredTables = [
  "research_candidate_review_records",
  "research_candidate_review_record_candidates",
  "research_candidate_review_record_sources",
  "research_candidate_review_record_activity",
];
const routeFiles = [
  collectionRoutePath,
  detailRoutePath,
  activityRoutePath,
  discardRoutePath,
];
const allowedTrueBoundaryFields = [
  "review_memory_db_routes_now",
  "same_origin_required",
  "db_backed_review_memory_routes_now",
  "explicit_operator_route_action_only",
  "db_query_or_write_now",
  "db_schema_ensure_on_write_now",
];
const forbiddenFalseBoundaryFields = [
  "ui_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "source_fetch_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
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
  "review_memory_is_truth",
  "review_memory_is_proof",
  "review_memory_is_accepted_evidence",
  "review_memory_is_durable_perspective_state",
  "candidate_is_fact",
  "candidate_is_proof",
  "source_ref_is_proof",
  "discard_is_delete",
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
  roadmapPath,
  docPath,
  legacyRouteDocPath,
  dbStoreDocPath,
  dbStoreHelperPath,
  routeContractPath,
  collectionRoutePath,
  detailRoutePath,
  activityRoutePath,
  discardRoutePath,
  legacyJsonRoutePath,
  fixturePath,
  dbStoreFixturePath,
  packagePath,
  indexPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const roadmap = readText(roadmapPath);
const doc = normalizeWhitespace(readText(docPath));
const legacyRouteDoc = normalizeWhitespace(readText(legacyRouteDocPath));
const dbStoreDoc = normalizeWhitespace(readText(dbStoreDocPath));
const routeContractSource = readText(routeContractPath);
const routeSources = Object.fromEntries(routeFiles.map((filePath) => [filePath, readText(filePath)]));
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(readText(packagePath));
const index = readText(indexPath);

const routeContract = await import(pathToFileURL(routeContractPath).href);
const dbStore = await import(pathToFileURL(dbStoreHelperPath).href);
const routeImportDir = `.tmp/research-candidate-review-memory/db-route-smoke-imports-${process.pid}`;
rmSync(routeImportDir, { recursive: true, force: true });
process.on("exit", () => {
  rmSync(routeImportDir, { recursive: true, force: true });
});
const collectionRoute = await importMaterializedRoute(collectionRoutePath, `${routeImportDir}/collection-route.ts`);
const detailRoute = await importMaterializedRoute(detailRoutePath, `${routeImportDir}/detail-route.ts`);
const activityRoute = await importMaterializedRoute(activityRoutePath, `${routeImportDir}/activity-route.ts`);
const discardRoute = await importMaterializedRoute(discardRoutePath, `${routeImportDir}/discard-route.ts`);

assertRoadmapCoverage();
assertDocsCoverage();
assertFixtureCoverage();
assertPackageAndIndex();
assertRouteContractExports();
assertRouteModuleExports();
assertStaticRouteBoundaries();
assertChangedFileScope();
await assertTempDbRouteRuntimeBehavior();
assertExistingReviewMemorySmokes();
rmSync(routeImportDir, { recursive: true, force: true });

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-review-memory-db-routes-runtime-v0-1",
      final_status: "pass",
      route_version: routeVersion,
      db_store_version: dbStoreVersion,
      contract_version: contractVersion,
      scope,
      route_files: routeFiles.length,
    },
    null,
    2,
  ),
);

function assertRoadmapCoverage() {
  assert.ok(roadmap.includes("## PR 2.3"), "roadmap must include PR 2.3");
  assert.ok(
    roadmap.includes("research_candidate_review_memory_routes_v0_1"),
    "roadmap must include original route slice",
  );
  for (const routePath of [
    "app/api/research-candidate-review/review-records/route.ts",
    "app/api/research-candidate-review/review-records/[review_record_id]/route.ts",
    "app/api/research-candidate-review/review-records/[review_record_id]/activity/route.ts",
    "app/api/research-candidate-review/review-records/[review_record_id]/discard/route.ts",
  ]) {
    assert.ok(roadmap.includes(routePath), `roadmap must mention ${routePath}`);
  }
  for (const route of [
    "POST /review-records",
    "GET /review-records",
    "GET /review-records/:id",
    "GET /review-records/:id/activity",
    "POST /review-records/:id/discard",
  ]) {
    assert.ok(roadmap.includes(route), `roadmap must mention ${route}`);
  }
}

function assertDocsCoverage() {
  const requiredPhrases = [
    "This slice closes the original Phase 2.3 DB-backed route gap.",
    "The earlier JSON local-store route remains legacy/compatible but is not the DB-backed route completion.",
    "GET routes do not create DB files or schema.",
    "POST routes may ensure schema and write only review memory records, activity rows, and discard lifecycle transitions.",
    "This slice does not add UI.",
    "This slice does not call providers.",
    "This slice does not send prompts.",
    "This slice does not fetch sources.",
    "This slice does not execute retrieval/RAG.",
    "This slice does not create proof/evidence.",
    "This slice does not write claim/evidence records.",
    "This slice does not promote Perspective.",
    "This slice does not write/apply durable Perspective state.",
    "This slice does not write Formation Receipts.",
    "This slice does not execute Git Ledger export runtime.",
    "This slice does not execute Git or call GitHub.",
    "This slice does not execute Codex.",
    "This slice does not export/import files.",
    "This slice does not product-write.",
    "This slice does not allocate product IDs.",
    "Product-write remains parked by #686.",
    "Review memory is not truth.",
    "Review memory is not proof.",
    "Review memory is not accepted evidence.",
    "Review memory is not durable Perspective state.",
    "Candidate refs are not facts.",
    "Source refs are lineage pointers, not proof.",
    "Discard is lifecycle transition, not delete.",
    "Smoke/CI pass is not truth.",
    "The roadmap guide is not SSOT.",
    "Follow-up UI completion should bind to these DB-backed routes.",
  ];
  for (const phrase of requiredPhrases) {
    assert.ok(doc.includes(phrase), `doc must include: ${phrase}`);
  }
  assert.ok(
    legacyRouteDoc.includes("route-boundary-only") && legacyRouteDoc.includes("local-store-only"),
    "legacy route doc must remain route-boundary-only",
  );
  assert.ok(
    dbStoreDoc.includes("Follow-up route/UI completion should bind to this DB-backed store"),
    "DB store doc must point route follow-up to DB store",
  );
}

function assertFixtureCoverage() {
  assert.equal(fixture.fixture_version, "research_candidate_review_memory_db_routes_runtime.sample.v0.1");
  assert.equal(fixture.route_version, routeVersion);
  assert.equal(fixture.db_store_version, dbStoreVersion);
  assert.equal(fixture.contract_version, contractVersion);
  assert.equal(fixture.scope, scope);
  for (const key of [
    "safe_db_path_examples",
    "unsafe_db_path_examples",
    "create_request_example",
    "list_request_example",
    "detail_request_example",
    "activity_request_example",
    "discard_request_example",
    "expected_create_response_example",
    "expected_list_response_example",
    "expected_detail_response_example",
    "expected_activity_response_example",
    "expected_discard_response_example",
    "blocked_private_or_raw_payload_request_example",
    "blocked_forbidden_authority_request_example",
    "invalid_db_path_request_example",
    "not_found_response_example",
    "schema_missing_response_example",
    "db_missing_response_example",
    "same_origin_required_response_example",
    "authority_boundary_sample",
  ]) {
    assert.ok(Object.hasOwn(fixture, key), `fixture must include ${key}`);
  }
  for (const safePath of fixture.safe_db_path_examples) {
    assert.equal(
      routeContract.isSafeResearchCandidateReviewMemoryDbRoutePathV01(safePath),
      true,
      `${safePath} must be accepted`,
    );
  }
  for (const unsafePath of fixture.unsafe_db_path_examples) {
    assert.equal(
      routeContract.isSafeResearchCandidateReviewMemoryDbRoutePathV01(unsafePath),
      false,
      `${unsafePath} must be rejected`,
    );
  }
  assertSafeMarkersOnlyInBlockedExamples(fixture);
  assertNoLiveLookingFixtureValues(fixtureText);
  assertAuthorityBoundary(fixture.authority_boundary_sample);
}

function assertPackageAndIndex() {
  assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
  const indexBlock = extractIndexBlock(index, "Research Candidate Review Memory DB Routes Runtime Completion v0.1");
  for (const pointer of [
    docPath,
    routeContractPath,
    collectionRoutePath,
    detailRoutePath,
    activityRoutePath,
    discardRoutePath,
    fixturePath,
    "scripts/smoke-research-candidate-review-memory-db-routes-runtime-v0-1.mjs",
    packageScriptName,
  ]) {
    assert.ok(indexBlock.includes(pointer), `index block must point to ${pointer}`);
  }
  const normalizedIndexBlock = normalizeWhitespace(indexBlock);
  assert.ok(normalizedIndexBlock.includes("Product-write remains parked by #686."));
  assert.ok(normalizedIndexBlock.includes("GET routes do not create DB files or schema"));
}

function assertRouteContractExports() {
  for (const exportName of [
    "RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_ROUTE_VERSION_V01",
    "createResearchCandidateReviewMemoryDbRouteAuthorityBoundaryV01",
    "requestHasResearchCandidateReviewMemoryDbRouteSameOriginBoundaryV01",
    "isSafeResearchCandidateReviewMemoryDbRoutePathV01",
    "isSafeResearchCandidateReviewMemoryDbRouteRefV01",
    "validateResearchCandidateReviewMemoryDbRouteBodyV01",
    "validateResearchCandidateReviewMemoryDbRouteDiscardReasonV01",
    "createResearchCandidateReviewMemoryDbRouteErrorResponseV01",
    "createResearchCandidateReviewMemoryDbRouteStoreResponseV01",
  ]) {
    assert.notEqual(routeContract[exportName], undefined, `${exportName} must be exported`);
  }
  assert.ok(routeContractSource.includes("tmp/research-candidate-review-memory/"));
  assert.ok(routeContractSource.includes(".tmp/research-candidate-review-memory/"));
  assertAuthorityBoundary(routeContract.createResearchCandidateReviewMemoryDbRouteAuthorityBoundaryV01());
}

function assertRouteModuleExports() {
  assert.equal(typeof collectionRoute.GET, "function", "collection route exports GET");
  assert.equal(typeof collectionRoute.POST, "function", "collection route exports POST");
  assert.equal(typeof detailRoute.GET, "function", "detail route exports GET");
  assert.equal(typeof activityRoute.GET, "function", "activity route exports GET");
  assert.equal(typeof activityRoute.POST, "function", "activity route exports POST");
  assert.equal(typeof discardRoute.POST, "function", "discard route exports POST");
}

function assertStaticRouteBoundaries() {
  for (const [filePath, source] of Object.entries(routeSources)) {
    assert.ok(source.includes('export const runtime = "nodejs"'), `${filePath} uses node runtime`);
    assert.ok(source.includes("NextResponse.json"), `${filePath} uses bounded JSON response`);
    assert.ok(source.includes("requestHasResearchCandidateReviewMemoryDbRouteSameOriginBoundaryV01"));
    assert.ok(source.includes("same_origin_required"), `${filePath} has same-origin error`);
    assert.ok(!source.includes("OpenAI"), `${filePath} must not call OpenAI`);
    assert.ok(!source.includes("fetch("), `${filePath} must not fetch sources`);
    assert.ok(!source.includes("createPullRequest"), `${filePath} must not call GitHub`);
    assert.ok(!source.includes("product write implementation"), `${filePath} must not product-write`);
  }
  assertReadOnlyGetRoute(collectionRoutePath, routeSources[collectionRoutePath]);
  assertReadOnlyGetRoute(detailRoutePath, routeSources[detailRoutePath]);
  assertReadOnlyGetRoute(activityRoutePath, routeSources[activityRoutePath]);
  for (const [filePath, source] of [
    [collectionRoutePath, routeSources[collectionRoutePath]],
    [activityRoutePath, routeSources[activityRoutePath]],
    [discardRoutePath, routeSources[discardRoutePath]],
  ]) {
    assert.ok(source.includes("openWriteLocalDb"), `${filePath} POST uses write opener`);
    assert.ok(source.includes("ensureResearchCandidateReviewMemoryDbSchemaV01"), `${filePath} POST ensures schema`);
  }
}

async function assertTempDbRouteRuntimeBehavior() {
  const tempDir = `.tmp/research-candidate-review-memory/db-route-smoke-${process.pid}`;
  const dbPath = `${tempDir}/review-memory.sqlite`;
  const missingDbPath = `${tempDir}/missing.sqlite`;
  const noSchemaDbPath = `${tempDir}/no-schema.sqlite`;
  rmSync(tempDir, { recursive: true, force: true });
  mkdirSync(dirname(dbPath), { recursive: true });
  try {
    await assertMissingDbGetDoesNotCreate(missingDbPath);
    await assertSchemaMissingGetDoesNotCreateSchema(noSchemaDbPath);

    const createBody = {
      route_version: routeVersion,
      scope,
      action: "create_review_record",
      db_path: dbPath,
      input: fixture.safe_create_input_example,
    };
    const create = await callJson(
      collectionRoute.POST(localPostRequest(collectionUrl(), createBody)),
      201,
    );
    assert.equal(create.status, "ok");
    assert.equal(create.error_code, null);
    assert.equal(create.result.status, "created");
    assert.equal(create.result.record.review_record_id, "review-memory-db-route-record-001");
    assertAuthorityBoundary(create.authority_boundary);
    assertNoUnsafeEcho(create);
    assert.deepEqual(countRows(dbPath), {
      research_candidate_review_records: 1,
      research_candidate_review_record_candidates: 2,
      research_candidate_review_record_sources: 2,
      research_candidate_review_record_activity: 1,
    });

    const list = await callJson(
      collectionRoute.GET(
        localGetRequest(`${collectionUrl()}?db_path=${encodeURIComponent(dbPath)}&limit=10`),
      ),
    );
    assert.equal(list.status, "ok");
    assert.equal(list.result.status, "listed");
    assert.equal(list.result.records.length, 1);

    const detail = await callJson(
      detailRoute.GET(
        localGetRequest(`${detailUrl("review-memory-db-route-record-001")}?db_path=${encodeURIComponent(dbPath)}`),
        routeParams("review-memory-db-route-record-001"),
      ),
    );
    assert.equal(detail.status, "ok");
    assert.equal(detail.result.status, "read");
    assert.equal(detail.result.record.source_refs.length, 2);
    assert.equal(detail.result.record.candidate_refs.length, 2);
    assert.equal(detail.result.activities.length, 1);

    const activity = await callJson(
      activityRoute.GET(
        localGetRequest(`${activityUrl("review-memory-db-route-record-001")}?db_path=${encodeURIComponent(dbPath)}`),
        routeParams("review-memory-db-route-record-001"),
      ),
    );
    assert.equal(activity.status, "ok");
    assert.equal(activity.result.status, "read");
    assert.equal(activity.result.activities.length, 1);

    const append = await callJson(
      activityRoute.POST(
        localPostRequest(activityUrl("review-memory-db-route-record-001"), {
          route_version: routeVersion,
          scope,
          action: "append_review_record_activity",
          db_path: dbPath,
          input: fixture.safe_activity_append_example,
        }),
        routeParams("review-memory-db-route-record-001"),
      ),
    );
    assert.equal(append.status, "ok");
    assert.equal(append.result.status, "activity_appended");
    assert.deepEqual(countRows(dbPath).research_candidate_review_record_activity, 2);

    const orphanBefore = countRows(dbPath);
    const orphan = await callJson(
      activityRoute.POST(
        localPostRequest(activityUrl("review-memory-db-route-missing-001"), {
          route_version: routeVersion,
          scope,
          action: "append_review_record_activity",
          db_path: dbPath,
          input: {
            ...fixture.safe_activity_append_example,
            activity_id: "review-memory-db-route-missing-001:activity:operator-note",
            review_record_id: "review-memory-db-route-missing-001",
          },
        }),
        routeParams("review-memory-db-route-missing-001"),
      ),
      404,
    );
    assert.equal(orphan.status, "error");
    assert.equal(orphan.error_code, "not_found");
    assert.deepEqual(countRows(dbPath), orphanBefore);

    const discard = await callJson(
      discardRoute.POST(
        localPostRequest(discardUrl("review-memory-db-route-record-001"), {
          route_version: routeVersion,
          scope,
          action: "discard_review_record",
          db_path: dbPath,
          reason: "Operator discarded this review memory route record as a lifecycle transition.",
        }),
        routeParams("review-memory-db-route-record-001"),
      ),
    );
    assert.equal(discard.status, "ok");
    assert.equal(discard.result.status, "discarded");
    assert.equal(discard.result.record.lifecycle_state, "discarded");
    assert.equal(discard.result.record.review_decision, "discard");
    assert.equal(countRows(dbPath).research_candidate_review_records, 1);

    const missingRecord = await callJson(
      detailRoute.GET(
        localGetRequest(`${detailUrl("review-memory-db-route-not-found-001")}?db_path=${encodeURIComponent(dbPath)}`),
        routeParams("review-memory-db-route-not-found-001"),
      ),
      404,
    );
    assert.equal(missingRecord.status, "error");
    assert.equal(missingRecord.error_code, "not_found");

    await assertRejectedCreateWritesNoRows(dbPath, blockedForbiddenCreateInput(), "blocked_forbidden_authority", 403);
    await assertRejectedCreateWritesNoRows(dbPath, blockedPrivateCreateInput(), "blocked_private_or_raw_payload", 400);

    const invalidDbPathResponse = await callJson(
      collectionRoute.POST(localPostRequest(collectionUrl(), {
        route_version: routeVersion,
        scope,
        action: "create_review_record",
        db_path: "tmp/other-feature/SAFE_MARKER_SECRET_TOKEN.sqlite",
        input: fixture.safe_create_input_example,
      })),
      400,
    );
    assert.equal(invalidDbPathResponse.error_code, "invalid_db_path");
    assertNoUnsafeEcho(invalidDbPathResponse);
    assert.ok(!existsSync("tmp/other-feature/SAFE_MARKER_SECRET_TOKEN.sqlite"));

    const invalidJson = await callJson(
      collectionRoute.POST(new Request(collectionUrl(), {
        method: "POST",
        headers: localHeaders(),
        body: "{not-json",
      })),
      400,
    );
    assert.equal(invalidJson.error_code, "invalid_json_body");

    const crossSite = await callJson(
      collectionRoute.POST(new Request(collectionUrl(), {
        method: "POST",
        headers: {
          host: "localhost",
          origin: "https://example.invalid",
          "sec-fetch-site": "cross-site",
        },
        body: JSON.stringify(createBody),
      })),
      403,
    );
    assert.equal(crossSite.error_code, "same_origin_required");
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

async function assertMissingDbGetDoesNotCreate(dbPath) {
  assert.ok(!existsSync(dbPath));
  const list = await callJson(
    collectionRoute.GET(localGetRequest(`${collectionUrl()}?db_path=${encodeURIComponent(dbPath)}`)),
    404,
  );
  assert.equal(list.error_code, "db_missing");
  assert.ok(!existsSync(dbPath), "GET list on missing DB must not create DB file");

  const detail = await callJson(
    detailRoute.GET(
      localGetRequest(`${detailUrl("review-memory-db-route-missing-001")}?db_path=${encodeURIComponent(dbPath)}`),
      routeParams("review-memory-db-route-missing-001"),
    ),
    404,
  );
  assert.equal(detail.error_code, "db_missing");
  assert.ok(!existsSync(dbPath), "GET detail on missing DB must not create DB file");
}

async function assertSchemaMissingGetDoesNotCreateSchema(dbPath) {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.prepare("CREATE TABLE unrelated_smoke_table (id text primary key)").run();
  db.close();

  const list = await callJson(
    collectionRoute.GET(localGetRequest(`${collectionUrl()}?db_path=${encodeURIComponent(dbPath)}`)),
    400,
  );
  assert.equal(list.error_code, "schema_missing");

  const checkDb = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    assert.equal(dbStore.researchCandidateReviewMemoryDbSchemaExistsV01(checkDb), false);
  } finally {
    checkDb.close();
  }
}

async function assertRejectedCreateWritesNoRows(dbPath, input, expectedErrorCode, expectedHttpStatus) {
  const beforeCounts = countRows(dbPath);
  const response = await callJson(
    collectionRoute.POST(localPostRequest(collectionUrl(), {
      route_version: routeVersion,
      scope,
      action: "create_review_record",
      db_path: dbPath,
      input,
    })),
    expectedHttpStatus,
  );
  assert.equal(response.status, "error");
  assert.equal(response.error_code, expectedErrorCode);
  assert.deepEqual(countRows(dbPath), beforeCounts);
  assertNoUnsafeEcho(response);
}

function blockedForbiddenCreateInput() {
  return {
    ...fixture.safe_create_input_example,
    review_record_id: "review-memory-db-route-blocked-authority-001",
    candidate_ref: "candidate-ref:review-memory-db-route-blocked-authority-001",
    candidate_refs: ["candidate-ref:review-memory-db-route-blocked-authority-001"],
    source_refs: [
      {
        source_surface: "manual_source_ref",
        source_ref: "manual-source-ref:review-memory-db-route-blocked-authority-001",
        public_safe: true,
      },
    ],
    authority_boundary: {
      ...fixture.safe_create_input_example.authority_boundary,
      product_write_now: "enabled",
      proof_or_evidence_record_now: 1,
    },
  };
}

function blockedPrivateCreateInput() {
  return {
    ...fixture.safe_create_input_example,
    review_record_id: "review-memory-db-route-blocked-private-001",
    candidate_ref: "candidate-ref:review-memory-db-route-blocked-private-001",
    candidate_refs: ["candidate-ref:review-memory-db-route-blocked-private-001"],
    source_refs: [
      {
        source_surface: "manual_source_ref",
        source_ref: "manual-source-ref:review-memory-db-route-blocked-private-001",
        public_safe: true,
      },
    ],
    bounded_summary: "SAFE_MARKER_RAW_SOURCE_BODY",
  };
}

async function callJson(responsePromise, expectedStatus = 200) {
  const response = await responsePromise;
  assert.equal(response.status, expectedStatus);
  const json = await response.json();
  assert.equal(json.route_version, routeVersion);
  assert.equal(json.scope, scope);
  assertAuthorityBoundary(json.authority_boundary);
  assertNoUnsafeEcho(json);
  return json;
}

function localGetRequest(url) {
  return new Request(url, { headers: localHeaders() });
}

function localPostRequest(url, body) {
  return new Request(url, {
    method: "POST",
    headers: localHeaders(),
    body: JSON.stringify(body),
  });
}

function localHeaders() {
  return { host: "localhost" };
}

function collectionUrl() {
  return "http://localhost/api/research-candidate-review/review-records";
}

function detailUrl(reviewRecordId) {
  return `${collectionUrl()}/${encodeURIComponent(reviewRecordId)}`;
}

function activityUrl(reviewRecordId) {
  return `${detailUrl(reviewRecordId)}/activity`;
}

function discardUrl(reviewRecordId) {
  return `${detailUrl(reviewRecordId)}/discard`;
}

function routeParams(reviewRecordId) {
  return { params: Promise.resolve({ review_record_id: encodeURIComponent(reviewRecordId) }) };
}

function countRows(dbPath) {
  const db = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    return Object.fromEntries(
      requiredTables.map((tableName) => [
        tableName,
        db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count,
      ]),
    );
  } finally {
    db.close();
  }
}

function assertExistingReviewMemorySmokes() {
  for (const scriptName of [
    "smoke:research-candidate-review-memory-db-store-runtime-v0-1",
    "smoke:research-candidate-review-memory-routes-v0-1",
  ]) {
    assert.ok(packageJson.scripts?.[scriptName], `${scriptName} must exist`);
    execFileSync("npm", ["run", scriptName], { stdio: "pipe" });
  }
}

async function importMaterializedRoute(sourcePath, targetPath) {
  mkdirSync(dirname(targetPath), { recursive: true });
  const contractUrl = pathToFileURL(resolve(routeContractPath)).href;
  const storeUrl = pathToFileURL(resolve(dbStoreHelperPath)).href;
  const auditStubPath = `${dirname(targetPath)}/route-audit-instrumentation-stub.ts`;
  writeFileSync(
    auditStubPath,
    `export type RuntimeRouteAuditInstrumentationResultV01 = ReturnType<typeof maybeWriteRuntimeRouteAuditEventV01>;
export function maybeWriteRuntimeRouteAuditEventV01() {
  return {
    instrumentation_version: "runtime_audit_selected_route_instrumentation.v0.1",
    scope: "project:augnes",
    status: "audit_not_requested",
    audit_event_ref: null,
    audit_event_id: null,
    audit_event_persisted: false,
    reason_codes: ["runtime_audit_selected_route_instrumentation", "audit_db_path_absent"],
    authority_boundary: {
      audit_event_is_truth: false,
      audit_event_is_proof: false,
      audit_event_is_approval: false,
      audit_event_is_durable_state: false,
      audit_event_is_product_write_authority: false,
    },
  };
}
`,
  );
  const auditInstrumentationUrl = pathToFileURL(resolve(auditStubPath)).href;
  const transformed = readText(sourcePath)
    .replaceAll('from "next/server"', 'from "next/server.js"')
    .replace(
      /from\s+"[^"]*review-memory-db-route-contract";/g,
      `from "${contractUrl}";`,
    )
    .replace(
      /from\s+"[^"]*review-memory-db-store";/g,
      `from "${storeUrl}";`,
    )
    .replace(
      /from\s+"[^"]*route-audit-instrumentation";/g,
      `from "${auditInstrumentationUrl}";`,
    );
  writeFileSync(targetPath, transformed);
  return import(pathToFileURL(resolve(targetPath)).href);
}

function assertReadOnlyGetRoute(filePath, source) {
  const getSource = extractExportedFunctionSource(source, "GET");
  assert.ok(getSource.includes("openReadOnlyLocalDb"), `${filePath} GET uses read-only DB opener`);
  assert.ok(getSource.includes("schema_missing"), `${filePath} GET returns schema_missing`);
  assert.ok(!getSource.includes("openWriteLocalDb"), `${filePath} GET must not call write opener`);
  assert.ok(!getSource.includes("mkdirSync"), `${filePath} GET must not create directories`);
  assert.ok(
    !getSource.includes("ensureResearchCandidateReviewMemoryDbSchemaV01"),
    `${filePath} GET must not ensure schema`,
  );
  assert.ok(source.includes("readonly: true"), `${filePath} has read-only DB option`);
  assert.ok(source.includes("fileMustExist: true"), `${filePath} requires existing DB file`);
  assert.ok(source.includes("db_missing"), `${filePath} has db_missing response`);
}

function assertChangedFileScope() {
  const changed = changedFilesAgainstMain();
  if (runtimeAuditSelectedRouteInstrumentationV03SliceTouched(changed)) {
    const allowed = new Set([
      collectionRoutePath,
      detailRoutePath,
      activityRoutePath,
      discardRoutePath,
      "docs/RUNTIME_AUDIT_SELECTED_ROUTE_INSTRUMENTATION_V0_3.md",
      "fixtures/runtime-audit-selected-route-instrumentation.v0.3.sample.json",
      "scripts/smoke-runtime-audit-selected-route-instrumentation-v0-3.mjs",
      "scripts/smoke-runtime-audit-selected-route-instrumentation-v0-1.mjs",
      "scripts/smoke-research-candidate-review-memory-db-routes-runtime-v0-1.mjs",
      "scripts/smoke-research-candidate-review-memory-db-ui-runtime-v0-1.mjs",
      "scripts/smoke-foundation-lifecycle-review-memory-db-readonly-ui-completion-v0-1.mjs",
      "scripts/smoke-project-constellation-runtime-ui-completion-v0-1.mjs",
      "package.json",
      "docs/00_INDEX_LATEST.md",
    ]);
    for (const filePath of changed) {
      assert.ok(allowed.has(filePath), `unexpected v0.3 audit instrumentation changed file: ${filePath}`);
      assert.ok(!filePath.startsWith("components/"), "no component/UI file may be added");
      assert.ok(!filePath.includes("/components/"), "no component/UI file may be added");
      assert.ok(!filePath.startsWith("app/research-candidate/"), "no UI app route may be added");
      assert.ok(!/provider|retrieval|rag|git-ledger|github|codex|product-write|product-id/i.test(filePath));
    }
    return;
  }
  const dbRoutesRuntimeSliceTouched = changed.some((filePath) =>
    [
      docPath,
      routeContractPath,
      collectionRoutePath,
      detailRoutePath,
      activityRoutePath,
      discardRoutePath,
      fixturePath,
    ].includes(filePath),
  );
  if (!dbRoutesRuntimeSliceTouched) return;
  for (const filePath of changed) {
    assert.ok(!filePath.startsWith("components/"), "no component/UI file may be added");
    assert.ok(!filePath.includes("/components/"), "no component/UI file may be added");
    assert.ok(!filePath.startsWith("app/research-candidate/"), "no UI app route may be added");
    assert.ok(!/provider|retrieval|rag|git-ledger|github|codex|product-write|product-id/i.test(filePath));
  }
  for (const expected of [
    docPath,
    routeContractPath,
    collectionRoutePath,
    detailRoutePath,
    activityRoutePath,
    discardRoutePath,
    fixturePath,
    "scripts/smoke-research-candidate-review-memory-db-routes-runtime-v0-1.mjs",
  ]) {
    assert.ok(changed.includes(expected), `changed files must include ${expected}`);
  }
}

function runtimeAuditSelectedRouteInstrumentationV03SliceTouched(changed) {
  return changed.some((filePath) =>
    [
      "docs/RUNTIME_AUDIT_SELECTED_ROUTE_INSTRUMENTATION_V0_3.md",
      "fixtures/runtime-audit-selected-route-instrumentation.v0.3.sample.json",
      "scripts/smoke-runtime-audit-selected-route-instrumentation-v0-3.mjs",
    ].includes(filePath),
  );
}

function assertAuthorityBoundary(boundary) {
  assert.ok(boundary && typeof boundary === "object", "authority boundary must be object");
  for (const field of allowedTrueBoundaryFields) {
    assert.equal(boundary[field], true, `${field} must be true`);
  }
  for (const field of forbiddenFalseBoundaryFields) {
    assert.equal(boundary[field], false, `${field} must be false`);
  }
}

function assertSafeMarkersOnlyInBlockedExamples(value, path = []) {
  if (typeof value === "string") {
    for (const marker of safeMarkers) {
      if (value.includes(marker)) {
        assert.ok(
          path.some((part) => String(part).includes("blocked")),
          `${marker} may appear only in blocked examples; found at ${path.join(".")}`,
        );
      }
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertSafeMarkersOnlyInBlockedExamples(item, [...path, index]));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    assertSafeMarkersOnlyInBlockedExamples(nested, [...path, key]);
  }
}

function assertNoLiveLookingFixtureValues(text) {
  const sanitized = text
    .replaceAll("SAFE_MARKER_RAW_SOURCE_BODY", "")
    .replaceAll("token-like-review-memory", "blocked-review-memory");
  for (const pattern of [
    /https?:\/\//i,
    /file:\/\//i,
    /\/Users\//i,
    /\/home\//i,
    /sk-[A-Za-z0-9]/i,
    /ghp_[A-Za-z0-9]/i,
    /OPENAI_API_KEY/i,
    /GITHUB_TOKEN/i,
    /password:/i,
    /secret:/i,
    /-----BEGIN PRIVATE KEY-----/i,
    /\bthread_[A-Za-z0-9_-]+/i,
    /\brun_[A-Za-z0-9_-]+/i,
    /\bsession_[A-Za-z0-9_-]+/i,
  ]) {
    assert.doesNotMatch(sanitized, pattern, `fixture must not contain live-looking value ${pattern}`);
  }
}

function assertNoUnsafeEcho(result) {
  const text = JSON.stringify(result);
  for (const marker of safeMarkers) {
    assert.ok(!text.includes(marker), `response must not echo ${marker}`);
  }
}

function changedFilesAgainstMain() {
  try {
    const diffFiles = execFileSync("git", ["diff", "--name-only", "main"], { encoding: "utf8" })
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const untrackedFiles = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
      encoding: "utf8",
    })
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    return [...new Set([...diffFiles, ...untrackedFiles])]
      .filter((filePath) => !filePath.startsWith(".tmp/"))
      .sort();
  } catch {
    return [];
  }
}

function extractExportedFunctionSource(source, functionName) {
  const start = source.indexOf(`export async function ${functionName}`);
  assert.ok(start >= 0, `source must include exported ${functionName}`);
  const nextExport = source.indexOf("\nexport ", start + 1);
  return source.slice(start, nextExport === -1 ? source.length : nextExport);
}

function extractIndexBlock(text, title) {
  const start = text.indexOf(`- ${title}:`);
  assert.ok(start >= 0, `index must include ${title}`);
  const next = text.indexOf("\n- ", start + 1);
  return text.slice(start, next === -1 ? text.length : next);
}

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ");
}
