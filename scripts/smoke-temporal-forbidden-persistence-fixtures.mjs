import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const workId = "AG-TEMPORAL-INTERPRETATION";
const scope = "project:augnes";
const validArtifactId = "temporal-review:forbidden-fixtures-valid";
const tempDir = mkdtempSync(
  path.join(os.tmpdir(), "augnes-temporal-forbidden-fixtures-"),
);
const dbPath = path.join(tempDir, "augnes.db");
process.env.AUGNES_DB_PATH = dbPath;
process.env.OPENAI_API_KEY = "smoke-openai-key-must-not-be-used";

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("Temporal forbidden persistence fixture smoke must not call fetch.");
};

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
  const { insertTemporalPreviewReviewArtifactForSmoke } = await import(
    "../lib/temporal-review-artifacts.ts"
  );
  const {
    buildValidTemporalPreviewReviewArtifactFixture,
    TEMPORAL_REVIEW_ARTIFACT_FORBIDDEN_PERSISTENCE_FIXTURES,
  } = await import("../lib/temporal-review-artifact-fixtures.ts");

  const workItem = getWorkItem(workId, scope);
  assert.ok(workItem, "AG-TEMPORAL-INTERPRETATION should exist");

  const dbBefore = openDatabase();
  const protectedBefore = snapshotProtectedCounts(dbBefore);
  dbBefore.close();

  const validFixture = buildValidTemporalPreviewReviewArtifactFixture({
    artifact_id: validArtifactId,
    source_ref: "scripts/smoke-temporal-forbidden-persistence-fixtures.mjs",
    preview_hash: "sha256:smoke-temporal-forbidden-persistence-fixtures",
    reviewer_notes:
      "Smoke validates reusable forbidden-persistence fixture corpus.",
    created_by: "codex-smoke",
  });
  const inserted = insertTemporalPreviewReviewArtifactForSmoke(validFixture);
  assert.equal(inserted.artifact_id, validArtifactId);
  assert.equal(inserted.work_id, workId);

  const rejectedFixtureNames = [];
  for (const fixture of TEMPORAL_REVIEW_ARTIFACT_FORBIDDEN_PERSISTENCE_FIXTURES) {
    const artifactId = `temporal-review:fixture-forbidden-${fixture.name}`;
    const base = buildValidTemporalPreviewReviewArtifactFixture({
      artifact_id: artifactId,
      source_ref: "scripts/smoke-temporal-forbidden-persistence-fixtures.mjs",
      created_by: "codex-smoke",
    });
    const candidate = fixture.mutate(base);

    assert.throws(
      () => insertTemporalPreviewReviewArtifactForSmoke(candidate),
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
      `${fixture.name} should be rejected: ${fixture.forbidden_reason}`,
    );

    const dbCheck = openDatabase();
    const createdRows = dbCheck
      .prepare(
        `
          SELECT COUNT(*) AS count
          FROM temporal_preview_review_artifacts
          WHERE scope = ? AND artifact_id = ?
        `,
      )
      .get(scope, artifactId).count;
    const totalRows = dbCheck
      .prepare(
        `
          SELECT COUNT(*) AS count
          FROM temporal_preview_review_artifacts
          WHERE scope = ?
        `,
      )
      .get(scope).count;
    dbCheck.close();

    assert.equal(createdRows, 0, `${fixture.name} must not create an artifact row`);
    assert.equal(totalRows, 1, `${fixture.name} must leave only the valid row`);
    rejectedFixtureNames.push(fixture.name);
  }

  const dbAfter = openDatabase();
  const protectedAfter = snapshotProtectedCounts(dbAfter);
  const artifactCount = dbAfter
    .prepare(
      `
        SELECT COUNT(*) AS count
        FROM temporal_preview_review_artifacts
        WHERE scope = ?
      `,
    )
    .get(scope).count;
  const validArtifactCount = dbAfter
    .prepare(
      `
        SELECT COUNT(*) AS count
        FROM temporal_preview_review_artifacts
        WHERE scope = ? AND artifact_id = ?
      `,
    )
    .get(scope, validArtifactId).count;
  dbAfter.close();

  assert.equal(artifactCount, 1, "only one valid artifact should be inserted");
  assert.equal(validArtifactCount, 1, "the valid fixture artifact should exist");
  assert.deepEqual(
    protectedAfter,
    protectedBefore,
    "forbidden fixture smoke must not mutate protected authority rows",
  );
  assert.equal(fetchCalls, 0, "smoke should not call fetch/OpenAI/GitHub");

  console.log(
    JSON.stringify(
      {
        smoke: "temporal-forbidden-persistence-fixtures",
        db_path: dbPath,
        work_id: workId,
        work_seeded: true,
        valid_artifact_id: validArtifactId,
        valid_fixture_inserted: true,
        forbidden_fixture_count:
          TEMPORAL_REVIEW_ARTIFACT_FORBIDDEN_PERSISTENCE_FIXTURES.length,
        forbidden_fixture_names: rejectedFixtureNames,
        all_forbidden_fixtures_rejected: true,
        only_valid_fixture_inserted: true,
        protected_authority_rows_mutated: false,
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

function isPathInside(targetPath, parentPath) {
  const relativePath = path.relative(parentPath, targetPath);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}
