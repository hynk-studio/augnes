import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const contractDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_CONTRACT_V0_1.md";
const storeDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_STORE_V0_1.md";
const runtimeDocPath =
  "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_STORE_RUNTIME_COMPLETION_V0_1.md";
const helperPath = "lib/research-candidate-review/review-memory-db-store.ts";
const jsonStoreHelperPath = "lib/research-candidate-review/review-memory-store.ts";
const fixturePath = "fixtures/research-candidate-review.memory-db-store-runtime.sample.v0.1.json";
const schemaPath = "lib/db/schema.sql";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const packageScriptName = "smoke:research-candidate-review-memory-db-store-runtime-v0-1";
const packageScriptValue =
  "node scripts/smoke-research-candidate-review-memory-db-store-runtime-v0-1.mjs";

const dbStoreVersion = "research_candidate_review_memory_db_store.v0.1";
const contractVersion = "research_candidate_review_memory_contract.v0.1";
const recordVersion = "research_candidate_review_memory_record.v0.1";
const activityVersion = "research_candidate_review_memory_db_activity.v0.1";
const scope = "project:augnes";

const requiredExports = [
  "ensureResearchCandidateReviewMemoryDbSchemaV01",
  "researchCandidateReviewMemoryDbSchemaExistsV01",
  "createResearchCandidateReviewRecordV01",
  "readResearchCandidateReviewRecordV01",
  "listResearchCandidateReviewRecordsV01",
  "appendResearchCandidateReviewRecordActivityV01",
  "discardResearchCandidateReviewRecordV01",
  "supersedeResearchCandidateReviewRecordV01",
  "createResearchCandidateReviewMemoryDbAuthorityBoundaryV01",
];

const requiredTables = [
  "research_candidate_review_records",
  "research_candidate_review_record_candidates",
  "research_candidate_review_record_sources",
  "research_candidate_review_record_activity",
];

const allowedTrueBoundaryFields = [
  "review_memory_db_store_now",
  "caller_injected_db_only",
  "explicit_operator_review_memory_write_only",
  "db_query_or_write_now",
  "review_record_persistence_now",
  "review_record_activity_persistence_now",
];

const forbiddenFalseBoundaryFields = [
  "route_now",
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
  contractDocPath,
  storeDocPath,
  runtimeDocPath,
  helperPath,
  jsonStoreHelperPath,
  fixturePath,
  schemaPath,
  packagePath,
  indexPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const roadmap = readText(roadmapPath);
const storeDoc = normalizeWhitespace(readText(storeDocPath));
const runtimeDoc = normalizeWhitespace(readText(runtimeDocPath));
const helperSource = readText(helperPath);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const schema = readText(schemaPath);
const packageJson = JSON.parse(readText(packagePath));
const index = readText(indexPath);
const helper = await import(pathToFileURL(helperPath).href);

assertRoadmapCoverage();
assertDocsCoverage();
assertFixtureCoverage();
assertHelperExports();
assertSchemaCoverage();
assertPackageAndIndex();
assertStaticScopeBoundaries();
await assertTempDbRuntimeBehavior();
assertExistingReviewMemorySmokes();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-review-memory-db-store-runtime-v0-1",
      final_status: "pass",
      db_store_version: dbStoreVersion,
      contract_version: contractVersion,
      scope,
      tables: requiredTables.length,
    },
    null,
    2,
  ),
);

function assertRoadmapCoverage() {
  assert.ok(
    roadmap.includes("research_candidate_review_memory_store_v0_1"),
    "roadmap must contain research_candidate_review_memory_store_v0_1",
  );
  assert.ok(roadmap.includes("## PR 2.2"), "roadmap must include Phase 2.2 PR 2.2");
  for (const tableName of requiredTables) {
    assert.ok(roadmap.includes(tableName), `roadmap must mention ${tableName}`);
  }
  for (const helperName of [
    "createReviewRecord(input, db)",
    "readReviewRecord(id, db)",
    "listReviewRecords(filters, db)",
    "appendReviewRecordActivity(event, db)",
    "discardReviewRecord(id, reason, db)",
  ]) {
    assert.ok(roadmap.includes(helperName), `roadmap must mention ${helperName}`);
  }
  assert.ok(roadmap.includes("/tmp DB smoke only"), "roadmap must mention temp DB smoke");
  assert.ok(roadmap.includes("caller-injected DB only"), "roadmap must mention caller-injected DB");
}

function assertDocsCoverage() {
  const requiredPhrases = [
    "This slice closes the DB-backed Phase 2.2 store gap that the earlier local-store-only implementation did not fully cover.",
    "This slice closes the gap left by the earlier local-store-only JSON helper implementation.",
    "This slice uses caller-injected DB only.",
    "This slice uses temp DB smoke only.",
    "This slice may query/write DB only for review memory records, link rows, and activity rows.",
    "This slice does not add routes.",
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
    "Follow-up route/UI completion should bind to this DB-backed store rather than only the JSON local-store helper.",
  ];
  for (const phrase of requiredPhrases) {
    assert.ok(runtimeDoc.includes(phrase), `runtime doc must include: ${phrase}`);
  }
  assert.ok(
    storeDoc.includes("local-store-only") && storeDoc.includes("It does not query or write DB."),
    "existing store doc must preserve local-store-only DB boundary",
  );
}

function assertFixtureCoverage() {
  assert.equal(fixture.fixture_version, "research_candidate_review_memory_db_store_runtime.sample.v0.1");
  assert.equal(fixture.db_store_version, dbStoreVersion);
  assert.equal(fixture.contract_version, contractVersion);
  assert.equal(fixture.record_version, recordVersion);
  assert.equal(fixture.activity_version, activityVersion);
  assert.equal(fixture.scope, scope);
  for (const key of [
    "safe_create_input_example",
    "safe_created_record_result_example",
    "safe_read_result_example",
    "safe_list_result_example",
    "safe_activity_append_example",
    "safe_discard_result_example",
    "safe_supersede_result_example",
    "idempotent_create_example",
    "conflict_existing_record_example",
    "blocked_private_or_raw_payload_example",
    "blocked_forbidden_authority_example",
    "blocked_forbidden_authority_non_false_example",
    "invalid_non_public_safe_source_ref_example",
    "invalid_malformed_source_ref_example",
    "invalid_missing_source_refs_example",
    "invalid_orphan_activity_example",
    "authority_boundary_sample",
  ]) {
    assert.ok(Object.hasOwn(fixture, key), `fixture must include ${key}`);
  }
  assertSafeMarkersOnlyInBlockedExamples(fixture);
  assertNoLiveLookingFixtureValues(fixtureText);
}

function assertHelperExports() {
  for (const exportName of requiredExports) {
    assert.equal(typeof helper[exportName], "function", `helper must export ${exportName}`);
    assert.ok(helperSource.includes(`export function ${exportName}`));
  }
}

function assertSchemaCoverage() {
  for (const tableName of requiredTables) {
    assert.ok(schema.includes(`CREATE TABLE IF NOT EXISTS ${tableName}`), `schema must include ${tableName}`);
    assert.ok(helperSource.includes(`CREATE TABLE IF NOT EXISTS ${tableName}`), `helper schema must include ${tableName}`);
  }
}

function assertPackageAndIndex() {
  assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
  assert.ok(index.includes(runtimeDocPath), "latest index must point to runtime completion doc");
  assert.ok(index.includes(packageScriptName), "latest index must mention package smoke script");
}

function assertStaticScopeBoundaries() {
  const changedFiles = changedFilesAgainstMain();
  const allowedDbRouteRuntimeFiles = new Set([
    "app/api/research-candidate-review/review-records/route.ts",
    "app/api/research-candidate-review/review-records/[review_record_id]/route.ts",
    "app/api/research-candidate-review/review-records/[review_record_id]/activity/route.ts",
    "app/api/research-candidate-review/review-records/[review_record_id]/discard/route.ts",
  ]);
  assert.ok(
    !changedFiles.some((file) => file.startsWith("app/api/") && !allowedDbRouteRuntimeFiles.has(file)),
    "no unexpected app/api route was added",
  );
  assert.ok(!changedFiles.some((file) => file.startsWith("app/") && file.endsWith(".tsx")), "no UI page/component was added");
  assert.ok(!changedFiles.some((file) => file.startsWith("components/")), "no component/UI file was added");
  assert.ok(
    !changedFiles.some((file) =>
      /provider|retrieval|rag|github|git-ledger|codex-execution|product-write|product-id/i.test(file),
    ),
    "no provider/retrieval/Git/GitHub/Codex/product-write/product-ID runtime file was added",
  );
}

async function assertTempDbRuntimeBehavior() {
  const tempDir = join(tmpdir(), "augnes-review-memory-db-store-runtime-v0-1");
  rmSync(tempDir, { recursive: true, force: true });
  mkdirSync(tempDir, { recursive: true });
  const dbPath = join(tempDir, "review-memory.sqlite");
  const db = new Database(dbPath);
  try {
    assert.equal(helper.researchCandidateReviewMemoryDbSchemaExistsV01(db), false);
    helper.ensureResearchCandidateReviewMemoryDbSchemaV01(db);
    assert.equal(helper.researchCandidateReviewMemoryDbSchemaExistsV01(db), true);
    for (const tableName of requiredTables) {
      assert.equal(tableCount(db, tableName), 0, `${tableName} starts empty`);
    }

    const createResult = helper.createResearchCandidateReviewRecordV01(
      fixture.safe_create_input_example,
      db,
    );
    assert.equal(createResult.status, "created");
    assert.equal(tableCount(db, "research_candidate_review_records"), 1);
    assert.equal(tableCount(db, "research_candidate_review_record_candidates"), 2);
    assert.equal(tableCount(db, "research_candidate_review_record_sources"), 2);
    assert.equal(tableCount(db, "research_candidate_review_record_activity"), 1);
    assert.deepEqual(createResult.record.candidate_refs, [
      "candidate-ref:review-memory-db-001",
      "candidate-ref:review-memory-db-secondary-001",
    ]);
    assert.deepEqual(
      createResult.record.source_refs.map((source) => source.source_ref).sort(),
      ["lifecycle-summary:review-memory-db-001", "logical-claim-shape:review-memory-db-001"],
    );

    const readResult = helper.readResearchCandidateReviewRecordV01(
      fixture.safe_create_input_example.review_record_id,
      db,
    );
    assert.equal(readResult.status, "read");
    assert.equal(readResult.record.review_record_id, fixture.safe_create_input_example.review_record_id);
    assert.equal(readResult.record.source_refs.length, 2);
    assert.equal(readResult.record.candidate_refs.length, 2);
    assert.equal(readResult.activities.length, 1);

    const listResult = helper.listResearchCandidateReviewRecordsV01(
      { candidate_ref: "candidate-ref:review-memory-db-001", limit: 10 },
      db,
    );
    assert.equal(listResult.status, "listed");
    assert.equal(listResult.records.length, 1);
    assert.equal(listResult.records[0].review_record_id, fixture.safe_create_input_example.review_record_id);

    const duplicateResult = helper.createResearchCandidateReviewRecordV01(
      fixture.safe_create_input_example,
      db,
    );
    assert.equal(duplicateResult.status, "idempotent_existing");
    assert.equal(tableCount(db, "research_candidate_review_records"), 1);
    assert.equal(tableCount(db, "research_candidate_review_record_candidates"), 2);
    assert.equal(tableCount(db, "research_candidate_review_record_sources"), 2);
    assert.equal(tableCount(db, "research_candidate_review_record_activity"), 1);

    const beforeConflictCounts = countAllReviewMemoryRows(db);
    const conflictInput = {
      ...fixture.safe_create_input_example,
      bounded_summary: "Different bounded summary must conflict for the same review record id.",
    };
    const conflictResult = helper.createResearchCandidateReviewRecordV01(conflictInput, db);
    assert.equal(conflictResult.status, "conflict_existing_record");
    assert.deepEqual(countAllReviewMemoryRows(db), beforeConflictCounts);

    const appendResult = helper.appendResearchCandidateReviewRecordActivityV01(
      fixture.safe_activity_append_example,
      db,
    );
    assert.equal(appendResult.status, "activity_appended");
    assert.equal(tableCount(db, "research_candidate_review_record_activity"), 2);

    const beforeOrphanCounts = countAllReviewMemoryRows(db);
    const orphanResult = helper.appendResearchCandidateReviewRecordActivityV01(
      fixture.invalid_orphan_activity_example,
      db,
    );
    assert.equal(orphanResult.status, "not_found");
    assert.deepEqual(countAllReviewMemoryRows(db), beforeOrphanCounts);

    const discardInput = {
      ...fixture.safe_create_input_example,
      review_record_id: "review-memory-db-record-discard-001",
      candidate_ref: "candidate-ref:review-memory-db-discard-001",
      candidate_refs: ["candidate-ref:review-memory-db-discard-001"],
      source_refs: [
        {
          source_surface: "manual_source_ref",
          source_ref: "manual-source-ref:review-memory-db-discard-001",
          public_safe: true,
        },
      ],
      bounded_summary: "Discard target review memory record.",
      created_at: "2026-06-27T00:06:00.000Z",
      updated_at: "2026-06-27T00:06:00.000Z",
    };
    const discardCreate = helper.createResearchCandidateReviewRecordV01(discardInput, db);
    assert.equal(discardCreate.status, "created");
    const discardResult = helper.discardResearchCandidateReviewRecordV01(
      discardInput.review_record_id,
      fixture.safe_discard_result_example.discard_reason,
      db,
    );
    assert.equal(discardResult.status, "discarded");
    assert.equal(discardResult.record.lifecycle_state, "discarded");
    assert.equal(discardResult.record.review_decision, "discard");
    assert.equal(discardResult.record.discard_reason, fixture.safe_discard_result_example.discard_reason);
    assert.equal(discardResult.record.candidate_refs.length, 1);
    assert.equal(discardResult.record.source_refs.length, 1);
    assert.ok(discardResult.activities.some((activity) => activity.activity_kind === "review_record_discarded"));
    assert.equal(
      helper.readResearchCandidateReviewRecordV01(discardInput.review_record_id, db).record.lifecycle_state,
      "discarded",
    );
    assert.equal(
      helper.listResearchCandidateReviewRecordsV01(
        { lifecycle_state: "discarded", include_discarded: true, limit: 10 },
        db,
      ).records.length,
      1,
    );

    const supersedeResult = helper.supersedeResearchCandidateReviewRecordV01(
      fixture.safe_supersede_input_example,
      db,
    );
    assert.equal(supersedeResult.status, "superseded");
    assert.equal(
      helper.readResearchCandidateReviewRecordV01("review-memory-db-record-001", db).record.lifecycle_state,
      "superseded",
    );
    assert.equal(
      helper.readResearchCandidateReviewRecordV01("review-memory-db-record-001", db).record.superseded_by_record_ref,
      "review-memory-db-record-002",
    );
    assert.equal(
      helper.readResearchCandidateReviewRecordV01("review-memory-db-record-002", db).record.supersedes_record_ref,
      "review-memory-db-record-001",
    );

    assertCreateRejectedNoRows(
      db,
      fixture.blocked_private_or_raw_payload_example,
      "blocked_private_or_raw_payload",
    );
    assertCreateRejectedNoRows(
      db,
      fixture.blocked_forbidden_authority_example,
      "blocked_forbidden_authority",
    );
    assertCreateRejectedNoRows(
      db,
      fixture.blocked_forbidden_authority_non_false_example,
      "blocked_forbidden_authority",
    );
    assertCreateRejectedNoRows(
      db,
      fixture.invalid_non_public_safe_source_ref_example,
      "blocked_invalid_input",
    );
    assertCreateRejectedNoRows(
      db,
      fixture.invalid_malformed_source_ref_example,
      "blocked_invalid_input",
    );
    assertCreateRejectedNoRows(
      db,
      fixture.invalid_missing_source_refs_example,
      "blocked_invalid_input",
    );

    const boundary = helper.createResearchCandidateReviewMemoryDbAuthorityBoundaryV01();
    assertAuthorityBoundary(boundary);
    assertAuthorityBoundary(createResult.authority_boundary);
  } finally {
    db.close();
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function assertExistingReviewMemorySmokes() {
  const optionalScripts = [
    "smoke:research-candidate-review-memory-store-v0-1",
    "smoke:research-candidate-review-memory-routes-v0-1",
    "smoke:research-candidate-review-memory-ui-v0-1",
  ];
  for (const scriptName of optionalScripts) {
    if (!packageJson.scripts?.[scriptName]) continue;
    execFileSync("npm", ["run", scriptName], { stdio: "pipe" });
  }
}

function assertAuthorityBoundary(boundary) {
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
  const forbiddenPatterns = [
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
  ];
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(text, pattern, `fixture must not contain live-looking value ${pattern}`);
  }
}

function assertNoUnsafeEcho(result) {
  const text = JSON.stringify(result);
  for (const marker of safeMarkers) {
    assert.ok(!text.includes(marker), `result must not echo ${marker}`);
  }
}

function assertCreateRejectedNoRows(db, input, expectedStatus) {
  const beforeCounts = countAllReviewMemoryRows(db);
  const result = helper.createResearchCandidateReviewRecordV01(input, db);
  assert.equal(result.status, expectedStatus);
  assert.deepEqual(countAllReviewMemoryRows(db), beforeCounts);
  assertNoUnsafeEcho(result);
  assert.equal(result.record, null);
  assert.deepEqual(result.records, []);
  assert.deepEqual(result.activities, []);
}

function countAllReviewMemoryRows(db) {
  return Object.fromEntries(requiredTables.map((tableName) => [tableName, tableCount(db, tableName)]));
}

function tableCount(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
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
    return [...new Set([...diffFiles, ...untrackedFiles])].sort();
  } catch {
    return [];
  }
}

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ");
}
