import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const workId = "AG-TEMPORAL-INTERPRETATION";
const scope = "project:augnes";
const rawKeyA = "smoke-temporal-artifact-idempotency-key-A-raw";
const rawKeyB = "smoke-temporal-artifact-idempotency-key-B-raw";
const rawKeyC = "smoke-temporal-artifact-idempotency-key-C-raw";
const artifactIdA = "temporal-review:idempotency-smoke-a";
const artifactIdB = "temporal-review:idempotency-smoke-b";
const artifactIdC = "temporal-review:idempotency-smoke-c";
const sharedSourceRef = "scripts/smoke-temporal-artifact-idempotency.mjs";
const tempDir = mkdtempSync(
  path.join(os.tmpdir(), "augnes-temporal-artifact-idempotency-"),
);
const dbPath = path.join(tempDir, "augnes.db");
process.env.AUGNES_DB_PATH = dbPath;
process.env.OPENAI_API_KEY = "smoke-openai-key-must-not-be-used";

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("Temporal artifact idempotency smoke must not call fetch.");
};
let buildValidTemporalPreviewReviewArtifactFixture;
let TEMPORAL_REVIEW_ARTIFACT_FORBIDDEN_PERSISTENCE_FIXTURES;

try {
  assert.equal(
    isPathInside(path.dirname(dbPath), process.cwd()),
    false,
    "smoke DB must be outside the repo",
  );

  for (const [script, label] of [
    ["db:reset", "reset"],
    ["db:migrate", "migrate"],
    ["demo:seed", "demo seed"],
  ]) {
    execFileSync("npm", ["run", script], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        AUGNES_DB_PATH: dbPath,
      },
      encoding: "utf8",
      stdio: "pipe",
    });
    assert.ok(dbPath, `${label} should run against a temp DB path`);
  }

  const { openDatabase } = await import("./db-common.mjs");
  const { getWorkItem } = await import("../lib/work.ts");
  const {
    TemporalPreviewReviewArtifactDuplicateConflictError,
    TemporalPreviewReviewArtifactIdempotencyConflictError,
    computeTemporalReviewArtifactPayloadHash,
    findDuplicateTemporalReviewArtifactSourceHash,
    findTemporalReviewArtifactByIdempotencyKey,
    getTemporalPreviewReviewArtifact,
    hashTemporalReviewArtifactIdempotencyKey,
    insertTemporalPreviewReviewArtifactWithIdempotency,
    listTemporalPreviewReviewArtifacts,
  } = await import("../lib/temporal-review-artifacts.ts");
  ({
    buildValidTemporalPreviewReviewArtifactFixture,
    TEMPORAL_REVIEW_ARTIFACT_FORBIDDEN_PERSISTENCE_FIXTURES,
  } = await import("../lib/temporal-review-artifact-fixtures.ts"));
  const listRoute = await import(
    "../app/api/temporal-interpretation/review-artifacts/route.ts"
  );
  const getRoute = await import(
    "../app/api/temporal-interpretation/review-artifacts/[artifact_id]/route.ts"
  );

  assert.equal(Object.hasOwn(listRoute, "POST"), false, "list route must not expose POST");
  assert.equal(Object.hasOwn(getRoute, "POST"), false, "get route must not expose POST");

  const dbBefore = openDatabase();
  assert.equal(tableExists(dbBefore), true, "idempotency table should exist");
  assert.equal(hasRawStorageColumns(dbBefore), false, "idempotency table must not have raw storage columns");
  const protectedBefore = snapshotProtectedCounts(dbBefore);
  const artifactCountBefore = countRows(dbBefore, "temporal_preview_review_artifacts");
  const idempotencyCountBefore = countRows(
    dbBefore,
    "temporal_preview_review_artifact_idempotency",
  );
  dbBefore.close();
  assert.equal(artifactCountBefore, 0, "temp DB should start without artifacts");
  assert.equal(idempotencyCountBefore, 0, "temp DB should start without idempotency rows");

  const workItem = getWorkItem(workId, scope);
  assert.ok(workItem, "AG-TEMPORAL-INTERPRETATION should exist");

  const inputA = buildArtifactInput({
    artifact_id: artifactIdA,
    preview_hash: "sha256:temporal-idempotency-preview-a",
    reviewer_notes: "Initial idempotent insert.",
  });
  const expectedKeyHashA = hashTemporalReviewArtifactIdempotencyKey(rawKeyA);
  const expectedPayloadHashA = computeTemporalReviewArtifactPayloadHash(inputA);
  assert.ok(expectedKeyHashA.startsWith("sha256:"));
  assert.ok(expectedPayloadHashA.startsWith("sha256:"));

  const createdA = insertTemporalPreviewReviewArtifactWithIdempotency(inputA, {
    idempotency_key: rawKeyA,
    created_by: "codex-smoke",
  });
  assert.equal(createdA.created, true);
  assert.equal(createdA.idempotent_replay, false);
  assert.equal(createdA.artifact.artifact_id, artifactIdA);
  assert.equal(createdA.idempotency_key_hash, expectedKeyHashA);
  assert.equal(createdA.payload_hash, expectedPayloadHashA);

  const dbAfterA = openDatabase();
  const idempotencyRowsAfterA = dbAfterA
    .prepare(
      `
        SELECT *
        FROM temporal_preview_review_artifact_idempotency
        ORDER BY created_at ASC
      `,
    )
    .all();
  assert.equal(idempotencyRowsAfterA.length, 1);
  assert.equal(idempotencyRowsAfterA[0].idempotency_key_hash, expectedKeyHashA);
  assert.equal(idempotencyRowsAfterA[0].payload_hash, expectedPayloadHashA);
  assert.equal(idempotencyRowsAfterA[0].artifact_id, artifactIdA);
  assert.equal(idempotencyRowsAfterA[0].work_id, workId);
  assert.equal(idempotencyRowsAfterA[0].source_ref, sharedSourceRef);
  assert.equal(
    idempotencyRowsAfterA[0].preview_hash,
    "sha256:temporal-idempotency-preview-a",
  );
  assertRawKeyAbsent(dbAfterA, rawKeyA);
  dbAfterA.close();

  const lookupA = findTemporalReviewArtifactByIdempotencyKey(scope, rawKeyA);
  assert.ok(lookupA, "idempotency lookup should find first insert");
  assert.equal(lookupA.artifact.artifact_id, artifactIdA);

  const replayA = insertTemporalPreviewReviewArtifactWithIdempotency(inputA, {
    idempotency_key: rawKeyA,
    created_by: "codex-smoke",
  });
  assert.equal(replayA.created, false);
  assert.equal(replayA.idempotent_replay, true);
  assert.equal(replayA.artifact.artifact_id, artifactIdA);
  assert.equal(replayA.payload_hash, expectedPayloadHashA);

  const dbAfterReplay = openDatabase();
  assert.equal(countRows(dbAfterReplay, "temporal_preview_review_artifacts"), 1);
  assert.equal(
    countRows(dbAfterReplay, "temporal_preview_review_artifact_idempotency"),
    1,
  );
  dbAfterReplay.close();

  const modifiedSameKeyInput = {
    ...inputA,
    reviewer_notes: "Modified payload with same key must conflict.",
  };
  assert.throws(
    () =>
      insertTemporalPreviewReviewArtifactWithIdempotency(modifiedSameKeyInput, {
        idempotency_key: rawKeyA,
        created_by: "codex-smoke",
      }),
    (error) => {
      assert.ok(error instanceof TemporalPreviewReviewArtifactIdempotencyConflictError);
      assert.equal(error.idempotency_key_hash, expectedKeyHashA);
      assert.equal(error.existing_payload_hash, expectedPayloadHashA);
      assert.notEqual(error.attempted_payload_hash, expectedPayloadHashA);
      return true;
    },
    "same key with different payload should conflict",
  );

  const duplicateSourceHashInput = buildArtifactInput({
    artifact_id: artifactIdB,
    preview_hash: "sha256:temporal-idempotency-preview-a",
    reviewer_notes: "Different key but same source/hash/work should conflict.",
  });
  assert.throws(
    () =>
      insertTemporalPreviewReviewArtifactWithIdempotency(duplicateSourceHashInput, {
        idempotency_key: rawKeyB,
        created_by: "codex-smoke",
      }),
    (error) => {
      assert.ok(error instanceof TemporalPreviewReviewArtifactDuplicateConflictError);
      assert.equal(error.existing_artifact_id, artifactIdA);
      assert.equal(error.scope, scope);
      assert.equal(error.work_id, workId);
      assert.equal(error.source_ref, sharedSourceRef);
      assert.equal(error.preview_hash, "sha256:temporal-idempotency-preview-a");
      return true;
    },
    "same source_ref plus preview_hash plus work_id should conflict",
  );

  const duplicateLookup = findDuplicateTemporalReviewArtifactSourceHash({
    scope,
    work_id: workId,
    source_ref: sharedSourceRef,
    preview_hash: "sha256:temporal-idempotency-preview-a",
  });
  assert.ok(duplicateLookup);
  assert.equal(duplicateLookup.artifact_id, artifactIdA);

  const inputC = buildArtifactInput({
    artifact_id: artifactIdC,
    preview_hash: "sha256:temporal-idempotency-preview-c",
    reviewer_notes: "Different preview hash should create a second artifact.",
  });
  const createdC = insertTemporalPreviewReviewArtifactWithIdempotency(inputC, {
    idempotency_key: rawKeyC,
    created_by: "codex-smoke",
  });
  assert.equal(createdC.created, true);
  assert.equal(createdC.idempotent_replay, false);
  assert.equal(createdC.artifact.artifact_id, artifactIdC);

  const listed = listTemporalPreviewReviewArtifacts({ scope, work_id: workId });
  assert.equal(listed.length, 2, "list helper should read both created artifacts");
  assert.deepEqual(
    listed.map((artifact) => artifact.artifact_id).sort(),
    [artifactIdA, artifactIdC].sort(),
  );

  const directGet = getTemporalPreviewReviewArtifact(artifactIdA, scope);
  assert.ok(directGet, "get helper should read created artifact");
  assert.equal(directGet.artifact_id, artifactIdA);

  const apiListResponse = await listRoute.GET(
    new Request(
      `http://localhost/api/temporal-interpretation/review-artifacts?scope=${encodeURIComponent(scope)}&work_id=${encodeURIComponent(workId)}`,
    ),
  );
  assert.equal(apiListResponse.status, 200, "API list GET should return 200");
  const apiListPayload = await apiListResponse.json();
  assert.equal(apiListPayload.count, 2);

  const apiGetResponse = await getRoute.GET(
    new Request(
      `http://localhost/api/temporal-interpretation/review-artifacts/${encodeURIComponent(artifactIdA)}?scope=${encodeURIComponent(scope)}`,
    ),
    { params: Promise.resolve({ artifact_id: artifactIdA }) },
  );
  assert.equal(apiGetResponse.status, 200, "API get GET should return 200");
  const apiGetPayload = await apiGetResponse.json();
  assert.equal(apiGetPayload.artifact.artifact_id, artifactIdA);

  const rejectedFixtureNames = [];
  for (const fixture of TEMPORAL_REVIEW_ARTIFACT_FORBIDDEN_PERSISTENCE_FIXTURES) {
    const fixtureArtifactId = `temporal-review:idempotency-${fixture.name}`;
    const base = buildArtifactInput({
      artifact_id: fixtureArtifactId,
      source_ref: `scripts/smoke-temporal-artifact-idempotency.mjs#${fixture.name}`,
      preview_hash: `sha256:temporal-idempotency-forbidden-${fixture.name}`,
      reviewer_notes: `Forbidden fixture ${fixture.name} should be rejected.`,
    });
    const candidate = fixture.mutate(base);

    assert.throws(
      () =>
        insertTemporalPreviewReviewArtifactWithIdempotency(candidate, {
          idempotency_key: `forbidden-key-${fixture.name}`,
          created_by: "codex-smoke",
        }),
      (error) => {
        assert.ok(error instanceof Error, `${fixture.name} should throw an Error`);
        assert.ok(
          error.message.includes(fixture.expected_error_includes),
          `${fixture.name} should include expected error text. Expected ${JSON.stringify(
            fixture.expected_error_includes,
          )}, received ${JSON.stringify(error.message)}.`,
        );
        return true;
      },
      `${fixture.name} should be rejected by idempotent helper`,
    );
    rejectedFixtureNames.push(fixture.name);
  }

  const dbAfter = openDatabase();
  const protectedAfter = snapshotProtectedCounts(dbAfter);
  const finalArtifactCount = countRows(dbAfter, "temporal_preview_review_artifacts");
  const finalIdempotencyCount = countRows(
    dbAfter,
    "temporal_preview_review_artifact_idempotency",
  );
  assertRawKeyAbsent(dbAfter, rawKeyA);
  assertRawKeyAbsent(dbAfter, rawKeyB);
  assertRawKeyAbsent(dbAfter, rawKeyC);
  dbAfter.close();

  assert.equal(finalArtifactCount, 2, "only the two valid artifacts should be inserted");
  assert.equal(finalIdempotencyCount, 2, "only the two valid idempotency rows should be stored");
  assert.deepEqual(
    protectedAfter,
    protectedBefore,
    "idempotency smoke must not mutate protected authority rows",
  );
  assert.equal(fetchCalls, 0, "smoke should not call fetch/OpenAI/GitHub");

  console.log(
    JSON.stringify(
      {
        smoke: "temporal-artifact-idempotency",
        db_path: dbPath,
        work_id: workId,
        work_seeded: true,
        idempotency_table_exists: true,
        raw_key_stored: false,
        raw_payload_stored: false,
        first_insert_created: true,
        same_key_same_payload_replay: true,
        same_key_different_payload_conflict: true,
        duplicate_source_ref_preview_hash_work_id_conflict: true,
        different_preview_hash_different_key_created: true,
        typed_conflicts_observed: true,
        forbidden_fixture_count:
          TEMPORAL_REVIEW_ARTIFACT_FORBIDDEN_PERSISTENCE_FIXTURES.length,
        forbidden_fixture_names: rejectedFixtureNames,
        forbidden_fixture_corpus_rejected_through_idempotent_helper: true,
        read_only_list_get_apis_read_artifacts: true,
        no_route_post_added: true,
        protected_authority_rows_mutated: false,
        artifact_rows_inserted: finalArtifactCount,
        idempotency_rows_inserted: finalIdempotencyCount,
        fetch_calls: fetchCalls,
        openai_calls: 0,
        github_publication_adapter_calls: 0,
        approval_publish_replay_behavior: false,
      },
      null,
      2,
    ),
  );
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function buildArtifactInput({
  artifact_id,
  source_ref = sharedSourceRef,
  preview_hash,
  reviewer_notes,
}) {
  return buildValidTemporalPreviewReviewArtifactFixture({
    artifact_id,
    source_ref,
    preview_hash,
    reviewer_notes,
    linked_pr_url: "https://github.com/Aurna-code/augnes/pull/idempotency-smoke",
    created_by: "codex-smoke",
  });
}

function tableExists(db) {
  return Boolean(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'table'
            AND name = 'temporal_preview_review_artifact_idempotency'
        `,
      )
      .get(),
  );
}

function hasRawStorageColumns(db) {
  const columns = db
    .prepare("PRAGMA table_info(temporal_preview_review_artifact_idempotency)")
    .all()
    .map((column) => column.name);
  return columns.some((column) =>
    ["idempotency_key", "raw_key", "raw_payload", "raw_request"].includes(column),
  );
}

function assertRawKeyAbsent(db, rawKey) {
  const idempotencyRows = db
    .prepare("SELECT * FROM temporal_preview_review_artifact_idempotency")
    .all();
  const artifactRows = db
    .prepare("SELECT * FROM temporal_preview_review_artifacts")
    .all();
  assert.equal(
    JSON.stringify({ idempotencyRows, artifactRows }).includes(rawKey),
    false,
    "raw idempotency key must not be persisted",
  );
}

function snapshotProtectedCounts(db) {
  const tables = [
    "action_records",
    "delivery_ledger",
    "mailbox_messages",
    "publication_approval_decisions",
    "publication_approval_requests",
    "publication_drafts",
    "publication_readiness_checks",
    "state_delta_proposals",
    "state_entries",
    "state_tensions",
    "state_transitions",
  ];

  return Object.fromEntries(
    tables.map((table) => [
      table,
      db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count,
    ]),
  );
}

function countRows(db, table) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
}

function isPathInside(targetPath, parentPath) {
  const relativePath = path.relative(parentPath, targetPath);
  return (
    relativePath === "" ||
    (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
  );
}
