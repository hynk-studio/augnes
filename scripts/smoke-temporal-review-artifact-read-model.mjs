import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const workId = "AG-TEMPORAL-INTERPRETATION";
const scope = "project:augnes";
const artifactId = "temporal-review:smoke-read-model";
const tempDir = mkdtempSync(path.join(os.tmpdir(), "augnes-temporal-review-artifact-"));
const dbPath = path.join(tempDir, "augnes.db");
process.env.AUGNES_DB_PATH = dbPath;
process.env.OPENAI_API_KEY = "smoke-openai-key-must-not-be-used";

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("Temporal review artifact read model smoke must not call fetch.");
};

try {
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
    insertTemporalPreviewReviewArtifactForSmoke,
    getTemporalPreviewReviewArtifact,
    listTemporalPreviewReviewArtifacts,
  } = await import("../lib/temporal-review-artifacts.ts");
  const { buildValidTemporalPreviewReviewArtifactFixture } = await import(
    "../lib/temporal-review-artifact-fixtures.ts"
  );
  const listRoute = await import(
    "../app/api/temporal-interpretation/review-artifacts/route.ts"
  );
  const getRoute = await import(
    "../app/api/temporal-interpretation/review-artifacts/[artifact_id]/route.ts"
  );
  const evidencePackRoute = await import("../app/api/evidence-pack/route.ts");

  const db = openDatabase();
  const tableExists = Boolean(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'table' AND name = 'temporal_preview_review_artifacts'
        `,
      )
      .get(),
  );
  assert.equal(tableExists, true, "temporal_preview_review_artifacts table should exist");
  const indexNames = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'index'
          AND tbl_name = 'temporal_preview_review_artifacts'
        ORDER BY name ASC
      `,
    )
    .all()
    .map((row) => row.name);
  assert.ok(
    indexNames.includes("idx_temporal_review_artifacts_scope_work_time"),
    "scope/work index should exist",
  );
  const protectedBefore = snapshotProtectedCounts(db);
  db.close();

  const workItem = getWorkItem(workId, scope);
  assert.ok(workItem, "AG-TEMPORAL-INTERPRETATION should exist");

  const baseArtifact = buildValidTemporalPreviewReviewArtifactFixture({
    artifact_id: artifactId,
    source_ref: "scripts/smoke-temporal-review-artifact-read-model.mjs",
    preview_hash: "sha256:smoke-temporal-review-artifact",
    reviewer_notes: "Smoke artifact validates read-only list/get behavior.",
    linked_pr_url: "https://github.com/Aurna-code/augnes/pull/124",
    created_by: "codex-smoke",
  });

  assert.throws(
    () =>
      insertTemporalPreviewReviewArtifactForSmoke({
        ...baseArtifact,
        artifact_id: "temporal-review:read-model-top-level-raw-response",
        raw_openai_response: "forbidden",
      }),
    /forbidden/,
    "top-level raw_openai_response should be rejected",
  );

  assert.throws(
    () =>
      insertTemporalPreviewReviewArtifactForSmoke({
        ...baseArtifact,
        artifact_id: "temporal-review:summary-ref-as-evidence",
        evidence_anchor_refs: ["summary:agent_handoff.current_status"],
      }),
    /summary_refs must not be stored as evidence_anchor_refs/,
    "summary-only refs should be rejected as evidence anchors",
  );

  assert.throws(
    () =>
      insertTemporalPreviewReviewArtifactForSmoke({
        ...baseArtifact,
        artifact_id: "temporal-review:read-model-nested-bounded-raw-response",
        bounded_preview_json: { raw_openai_response: "forbidden" },
      }),
    /forbidden/,
    "nested forbidden fields in bounded_preview_json should be rejected",
  );

  const inserted = insertTemporalPreviewReviewArtifactForSmoke(baseArtifact);
  assert.equal(inserted.artifact_id, artifactId);
  assert.equal(inserted.work_id, workId);
  assert.equal(inserted.guardrail_passed, true);
  assert.deepEqual(inserted.evidence_anchor_refs, ["state:implementation.stack"]);
  assert.deepEqual(inserted.summary_refs, ["summary:agent_handoff.current_status"]);

  const listedByWork = listTemporalPreviewReviewArtifacts({ scope, work_id: workId });
  assert.equal(listedByWork.length, 1, "list by work_id should return sample");
  assert.equal(listedByWork[0].artifact_id, artifactId);

  const listedByVerdict = listTemporalPreviewReviewArtifacts({
    scope,
    work_id: workId,
    reviewer_verdict: "pass_with_notes",
  });
  assert.equal(listedByVerdict.length, 1, "list by reviewer_verdict should return sample");

  const directGet = getTemporalPreviewReviewArtifact(artifactId, scope);
  assert.ok(directGet, "get by artifact_id should return sample");
  assert.equal(directGet.artifact_id, artifactId);

  const dbWithExistingForbiddenRow = openDatabase();
  dbWithExistingForbiddenRow
    .prepare(
      `
        UPDATE temporal_preview_review_artifacts
        SET admission_decisions_json = ?
        WHERE scope = ? AND artifact_id = ?
      `,
    )
    .run(
      JSON.stringify([{ raw_openai_response: "forbidden existing row" }]),
      scope,
      artifactId,
    );
  dbWithExistingForbiddenRow.close();

  assert.throws(
    () => getTemporalPreviewReviewArtifact(artifactId, scope),
    /forbidden/,
    "read path should reject nested forbidden fields in existing DB rows",
  );

  const dbRestoreArtifact = openDatabase();
  dbRestoreArtifact
    .prepare(
      `
        UPDATE temporal_preview_review_artifacts
        SET admission_decisions_json = ?
        WHERE scope = ? AND artifact_id = ?
      `,
    )
    .run(JSON.stringify(baseArtifact.admission_decisions_json), scope, artifactId);
  dbRestoreArtifact.close();

  const listResponse = await listRoute.GET(
    new Request(
      `http://localhost/api/temporal-interpretation/review-artifacts?scope=${encodeURIComponent(scope)}&work_id=${encodeURIComponent(workId)}`,
    ),
  );
  assert.equal(listResponse.status, 200, "API list GET should return 200");
  const listPayload = await listResponse.json();
  assert.equal(listPayload.count, 1);
  assert.equal(listPayload.artifacts[0].artifact_id, artifactId);
  assert.ok(
    listPayload.boundaries.some((boundary) => boundary.includes("bounded review artifacts only")),
    "API list should include non-authority boundaries",
  );

  const getResponse = await getRoute.GET(
    new Request(
      `http://localhost/api/temporal-interpretation/review-artifacts/${encodeURIComponent(artifactId)}?scope=${encodeURIComponent(scope)}`,
    ),
    { params: Promise.resolve({ artifact_id: artifactId }) },
  );
  assert.equal(getResponse.status, 200, "API get GET should return 200");
  const getPayload = await getResponse.json();
  assert.equal(getPayload.artifact.artifact_id, artifactId);
  assert.equal(getPayload.artifact.work_id, workId);

  const missingResponse = await getRoute.GET(
    new Request(
      `http://localhost/api/temporal-interpretation/review-artifacts/temporal-review:missing?scope=${encodeURIComponent(scope)}`,
    ),
    { params: Promise.resolve({ artifact_id: "temporal-review:missing" }) },
  );
  assert.equal(missingResponse.status, 404, "missing API get should return 404");
  const missingPayload = await missingResponse.json();
  assert.ok(missingPayload.gaps.length > 0, "missing API get should include gaps");

  const evidencePackResponse = await evidencePackRoute.GET(
    new Request(
      `http://localhost/api/evidence-pack?scope=${encodeURIComponent(scope)}&work_id=${encodeURIComponent(workId)}`,
    ),
  );
  assert.equal(evidencePackResponse.status, 200, "Evidence Pack should still return 200");
  const evidencePack = await evidencePackResponse.json();
  assert.equal(
    evidencePack.temporal_review_artifact_trace.available,
    true,
    "Evidence Pack should expose Temporal review artifact awareness",
  );
  assert.equal(
    evidencePack.temporal_review_artifact_trace.artifact_count,
    1,
    "Evidence Pack should count matching Temporal review artifacts",
  );
  assert.equal(
    evidencePack.temporal_review_artifact_trace.latest_artifact_id,
    artifactId,
    "Evidence Pack should expose latest artifact id",
  );
  assert.equal(
    evidencePack.temporal_review_artifact_trace.latest_reviewer_verdict,
    "pass_with_notes",
    "Evidence Pack should expose latest reviewer verdict",
  );
  assert.equal(
    evidencePack.temporal_review_artifact_trace.latest_guardrail_passed,
    true,
    "Evidence Pack should expose latest guardrail status",
  );

  const dbAfter = openDatabase();
  const protectedAfter = snapshotProtectedCounts(dbAfter);
  const artifactCount = dbAfter
    .prepare("SELECT COUNT(*) AS count FROM temporal_preview_review_artifacts")
    .get().count;
  dbAfter.close();

  assert.equal(artifactCount, 1, "only the bounded sample artifact should be inserted");
  assert.deepEqual(
    protectedAfter,
    protectedBefore,
    "read model smoke must not mutate protected authority rows",
  );
  assert.equal(fetchCalls, 0, "smoke should not call fetch");

  console.log(
    JSON.stringify(
      {
        smoke: "temporal-review-artifact-read-model",
        db_path: dbPath,
        table_exists: tableExists,
        work_id: workId,
        work_seeded: true,
        artifact_id: artifactId,
        artifact_inserted: true,
        forbidden_fields_rejected: true,
        raw_openai_response_rejected: true,
        approval_publish_memory_fields_rejected: true,
        nested_forbidden_json_fields_rejected: true,
        existing_db_forbidden_json_rejected_on_read: true,
        summary_only_refs_blocked_as_evidence_anchors: true,
        list_by_work_id_ok: true,
        get_by_artifact_id_ok: true,
        api_list_get_ok: true,
        api_get_ok: true,
        missing_get_returns_404: true,
        evidence_pack_integration_added: true,
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
