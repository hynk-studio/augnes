import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const workId = "AG-TEMPORAL-INTERPRETATION";
const scope = "project:augnes";
const privateArtifactId = "temporal-review:private-insert-helper-smoke";
const captureArtifactId = "temporal-review:private-insert-capture-output";
const smokeArtifactId = "temporal-review:private-insert-smoke-helper-preserved";
const tempDir = mkdtempSync(
  path.join(os.tmpdir(), "augnes-temporal-private-insert-helper-"),
);
const dbPath = path.join(tempDir, "augnes.db");
process.env.AUGNES_DB_PATH = dbPath;
process.env.OPENAI_API_KEY = "smoke-openai-key-must-not-be-used";

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("Temporal private insert helper smoke must not call fetch.");
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
  const {
    getTemporalPreviewReviewArtifact,
    insertTemporalPreviewReviewArtifact,
    insertTemporalPreviewReviewArtifactForSmoke,
    listTemporalPreviewReviewArtifacts,
  } = await import("../lib/temporal-review-artifacts.ts");
  const {
    buildTemporalPreviewReviewArtifactInputFromRouteCapture,
  } = await import("../lib/temporal-review-artifact-capture.ts");
  const {
    buildValidTemporalPreviewReviewArtifactFixture,
    TEMPORAL_REVIEW_ARTIFACT_FORBIDDEN_PERSISTENCE_FIXTURES,
  } = await import("../lib/temporal-review-artifact-fixtures.ts");
  const { TEMPORAL_HARDENING_FIXTURES } = await import(
    "../lib/temporal-interpretation/fixtures.ts"
  );
  const { validateTemporalPreviewGuardrails } = await import(
    "../lib/temporal-interpretation/guardrails.ts"
  );
  const listRoute = await import(
    "../app/api/temporal-interpretation/review-artifacts/route.ts"
  );
  const getRoute = await import(
    "../app/api/temporal-interpretation/review-artifacts/[artifact_id]/route.ts"
  );

  assert.equal(Object.hasOwn(listRoute, "POST"), false, "list route must not expose POST");
  assert.equal(Object.hasOwn(getRoute, "POST"), false, "get route must not expose POST");

  const dbBefore = openDatabase();
  const protectedBefore = snapshotProtectedCounts(dbBefore);
  const artifactCountBefore = countArtifacts(dbBefore);
  dbBefore.close();
  assert.equal(artifactCountBefore, 0, "temp DB should start without artifacts");

  const workItem = getWorkItem(workId, scope);
  assert.ok(workItem, "AG-TEMPORAL-INTERPRETATION should exist");

  const validInput = buildValidTemporalPreviewReviewArtifactFixture({
    artifact_id: privateArtifactId,
    source_ref: "scripts/smoke-temporal-private-insert-helper.mjs",
    preview_hash: "sha256:smoke-temporal-private-insert-helper",
    reviewer_notes:
      "Smoke validates the private non-smoke TemporalPreviewReviewArtifact insert helper.",
    linked_pr_url: "https://github.com/Aurna-code/augnes/pull/private-helper-smoke",
    created_by: "codex-smoke",
  });

  const inserted = insertTemporalPreviewReviewArtifact(validInput);
  assert.equal(inserted.artifact_id, privateArtifactId);
  assert.equal(inserted.work_id, workId);
  assert.equal(inserted.source_route, "/api/temporal-interpretation/preview");
  assert.equal(inserted.capture_mode, "route_capture");
  assert.equal(inserted.reviewer_verdict, "pass_with_notes");
  assert.equal(inserted.redaction_status, "bounded");
  assert.deepEqual(inserted.evidence_anchor_refs, ["state:implementation.stack"]);
  assert.deepEqual(inserted.summary_refs, ["summary:agent_handoff.current_status"]);

  const listedAfterPrivateInsert = listTemporalPreviewReviewArtifacts({
    scope,
    work_id: workId,
  });
  assert.equal(
    listedAfterPrivateInsert.some((artifact) => artifact.artifact_id === privateArtifactId),
    true,
    "list helper should read the private inserted artifact",
  );

  const directGet = getTemporalPreviewReviewArtifact(privateArtifactId, scope);
  assert.ok(directGet, "get helper should read the private inserted artifact");
  assert.equal(directGet.artifact_id, privateArtifactId);

  const apiListResponse = await listRoute.GET(
    new Request(
      `http://localhost/api/temporal-interpretation/review-artifacts?scope=${encodeURIComponent(scope)}&work_id=${encodeURIComponent(workId)}`,
    ),
  );
  assert.equal(apiListResponse.status, 200, "API list GET should return 200");
  const apiListPayload = await apiListResponse.json();
  assert.equal(apiListPayload.count, 1);
  assert.equal(apiListPayload.artifacts[0].artifact_id, privateArtifactId);

  const apiGetResponse = await getRoute.GET(
    new Request(
      `http://localhost/api/temporal-interpretation/review-artifacts/${encodeURIComponent(privateArtifactId)}?scope=${encodeURIComponent(scope)}`,
    ),
    { params: Promise.resolve({ artifact_id: privateArtifactId }) },
  );
  assert.equal(apiGetResponse.status, 200, "API get GET should return 200");
  const apiGetPayload = await apiGetResponse.json();
  assert.equal(apiGetPayload.artifact.artifact_id, privateArtifactId);

  assert.throws(
    () => insertTemporalPreviewReviewArtifact(validInput),
    /UNIQUE|constraint|duplicate/i,
    "second insert with same artifact_id should fail with the existing DB constraint",
  );

  const dbAfterDuplicate = openDatabase();
  assert.equal(
    countArtifacts(dbAfterDuplicate),
    1,
    "duplicate artifact_id insert must not create another row",
  );
  dbAfterDuplicate.close();

  const rejectedFixtureNames = [];
  for (const fixture of TEMPORAL_REVIEW_ARTIFACT_FORBIDDEN_PERSISTENCE_FIXTURES) {
    const artifactId = `temporal-review:private-helper-${fixture.name}`;
    const base = buildValidTemporalPreviewReviewArtifactFixture({
      artifact_id: artifactId,
      source_ref: "scripts/smoke-temporal-private-insert-helper.mjs",
      created_by: "codex-smoke",
    });
    const candidate = fixture.mutate(base);

    assert.throws(
      () => insertTemporalPreviewReviewArtifact(candidate),
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
      `${fixture.name} should be rejected by private insert helper`,
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
    assert.equal(createdRows, 0, `${fixture.name} must not create an artifact row`);
    dbCheck.close();
    rejectedFixtureNames.push(fixture.name);
  }

  const previewResponse = buildMockPreviewResponse({
    temporalHardeningFixtures: TEMPORAL_HARDENING_FIXTURES,
    validateTemporalPreviewGuardrails,
  });
  const captureInput = buildTemporalPreviewReviewArtifactInputFromRouteCapture(
    previewResponse,
    {
      artifact_id: captureArtifactId,
      source_surface: "local_runtime",
      source_ref: "scripts/smoke-temporal-private-insert-helper.mjs",
      reviewer_verdict: "pass_with_notes",
      reviewer_notes:
        "Private insert helper accepts bounded capture helper output.",
      manual_review_report_path:
        "docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_ROUTE_CAPTURE_V0_1.md",
      linked_evidence_record_ids: [],
      linked_session_id: null,
      redaction_status: "bounded",
      created_by: "codex-smoke",
      created_at: "2026-05-14T00:00:00.000Z",
      updated_at: "2026-05-14T00:00:00.000Z",
    },
  );
  const captureInserted = insertTemporalPreviewReviewArtifact(captureInput);
  assert.equal(captureInserted.artifact_id, captureArtifactId);
  assert.equal(captureInserted.capture_mode, "route_capture");
  assert.ok(captureInserted.preview_hash?.startsWith("sha256:"));
  assert.equal(
    captureInserted.evidence_anchor_refs.some((ref) => ref.startsWith("summary:")),
    false,
    "capture output evidence anchors must not contain summary refs",
  );

  const smokeInserted = insertTemporalPreviewReviewArtifactForSmoke(
    buildValidTemporalPreviewReviewArtifactFixture({
      artifact_id: smokeArtifactId,
      source_ref: "scripts/smoke-temporal-private-insert-helper.mjs",
      preview_hash: "sha256:smoke-helper-preserved",
      reviewer_notes: "Existing smoke insert helper remains available.",
      created_by: "codex-smoke",
    }),
  );
  assert.equal(smokeInserted.artifact_id, smokeArtifactId);

  const dbAfter = openDatabase();
  const protectedAfter = snapshotProtectedCounts(dbAfter);
  const artifactCount = countArtifacts(dbAfter);
  dbAfter.close();

  assert.equal(
    artifactCount,
    3,
    "only private, capture-output, and smoke-helper artifacts should be inserted",
  );
  assert.deepEqual(
    protectedAfter,
    protectedBefore,
    "private insert helper smoke must not mutate protected authority rows",
  );
  assert.equal(fetchCalls, 0, "smoke should not call fetch/OpenAI/GitHub");

  console.log(
    JSON.stringify(
      {
        smoke: "temporal-private-insert-helper",
        db_path: dbPath,
        work_id: workId,
        work_seeded: true,
        private_helper_artifact_id: privateArtifactId,
        private_helper_inserted: true,
        get_list_helpers_read_artifact: true,
        read_only_api_list_get_read_artifact: true,
        duplicate_same_artifact_id_rejected: true,
        forbidden_fixture_count:
          TEMPORAL_REVIEW_ARTIFACT_FORBIDDEN_PERSISTENCE_FIXTURES.length,
        forbidden_fixture_names: rejectedFixtureNames,
        forbidden_fixture_corpus_rejected_through_private_helper: true,
        capture_helper_output_inserted_through_private_helper: true,
        smoke_insert_helper_preserved: true,
        no_route_post_added: true,
        protected_authority_rows_mutated: false,
        artifact_rows_inserted: artifactCount,
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

function buildMockPreviewResponse({
  temporalHardeningFixtures,
  validateTemporalPreviewGuardrails,
}) {
  const fixture = temporalHardeningFixtures.find(
    (item) => item.name === "valid_review_bounded_preview",
  );
  assert.ok(fixture, "valid temporal hardening fixture should exist");
  const guardrails = validateTemporalPreviewGuardrails({
    context: fixture.input_context,
    preview: fixture.output_preview,
  });
  assert.equal(guardrails.passed, true, "valid mock preview guardrails should pass");

  return {
    runtime: "augnes",
    scope,
    as_of: fixture.input_context.as_of,
    generator: "mock",
    model: null,
    preview: fixture.output_preview,
    guardrails,
    boundaries: [
      "Temporal Preview is read-only and does not approve, publish, replay, or commit state.",
    ],
  };
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

function countArtifacts(db) {
  return db
    .prepare("SELECT COUNT(*) AS count FROM temporal_preview_review_artifacts")
    .get().count;
}

function isPathInside(targetPath, parentPath) {
  const relativePath = path.relative(parentPath, targetPath);
  return (
    relativePath === "" ||
    (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
  );
}
