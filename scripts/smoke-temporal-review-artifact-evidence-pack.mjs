import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const workId = "AG-TEMPORAL-INTERPRETATION";
const scope = "project:augnes";
const tempDir = mkdtempSync(
  path.join(os.tmpdir(), "augnes-temporal-review-artifact-evidence-pack-"),
);
const dbPath = path.join(tempDir, "augnes.db");
process.env.AUGNES_DB_PATH = dbPath;
delete process.env.OPENAI_API_KEY;

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("Evidence Pack Temporal review artifact smoke must not call fetch.");
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
  const { GET: getEvidencePack } = await import("../app/api/evidence-pack/route.ts");
  const { createEvidenceRecord } = await import("../lib/evidence-records.ts");
  const {
    insertTemporalPreviewReviewArtifactForSmoke,
    listTemporalPreviewReviewArtifacts,
  } = await import("../lib/temporal-review-artifacts.ts");
  const { buildValidTemporalPreviewReviewArtifactFixture } = await import(
    "../lib/temporal-review-artifact-fixtures.ts"
  );

  const noArtifactResponse = await getEvidencePack(
    new Request(
      `http://localhost/api/evidence-pack?scope=${encodeURIComponent(scope)}&work_id=${encodeURIComponent(workId)}`,
    ),
  );
  assert.equal(noArtifactResponse.status, 200, "Evidence Pack no-artifact case should return 200");
  const noArtifactPack = await noArtifactResponse.json();
  assert.equal(
    noArtifactPack.temporal_review_artifact_trace.available,
    false,
    "no-artifact trace should report unavailable",
  );
  assert.equal(
    noArtifactPack.temporal_review_artifact_trace.artifact_count,
    0,
    "no-artifact trace should report zero artifacts",
  );
  assert.ok(
    noArtifactPack.temporal_review_artifact_trace.gaps.some((gap) =>
      gap.includes("No TemporalPreviewReviewArtifact records found"),
    ),
    "no-artifact trace should include a clear gap",
  );

  const evidenceRecord = createEvidenceRecord({
    evidence_id: "evidence:temporal-review-artifact-evidence-pack-smoke",
    scope,
    work_id: workId,
    evidence_kind: "check_passed",
    label: "Temporal review artifact Evidence Pack smoke",
    status: "passed",
    result_summary:
      "Smoke inserted bounded TemporalPreviewReviewArtifact rows and verified Evidence Pack read-only summary behavior.",
    source_surface: "local_runtime",
    source_ref: "scripts/smoke-temporal-review-artifact-evidence-pack.mjs",
    metadata: { smoke: "temporal-review-artifact-evidence-pack" },
    created_by: "codex-smoke",
    created_at: "2026-05-15T00:00:00.000Z",
  });

  insertTemporalPreviewReviewArtifactForSmoke(
    buildValidTemporalPreviewReviewArtifactFixture({
      artifact_id: "temporal-review:evidence-pack-older",
      source_ref: "scripts/smoke-temporal-review-artifact-evidence-pack.mjs#older",
      preview_hash: "sha256:temporal-review-artifact-evidence-pack-older",
      reviewer_verdict: "pass_with_notes",
      guardrail_passed: true,
      capture_mode: "route_capture",
      generator: "mock",
      model: null,
      linked_evidence_record_ids: [],
      linked_session_id: null,
      linked_pr_url: null,
      manual_review_report_path:
        "docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_ROUTE_CAPTURE_V0_1.md",
      created_by: "codex-smoke",
      created_at: "2026-05-14T00:00:00.000Z",
      updated_at: "2026-05-14T00:00:00.000Z",
    }),
  );

  const latestArtifact = insertTemporalPreviewReviewArtifactForSmoke(
    buildValidTemporalPreviewReviewArtifactFixture({
      artifact_id: "temporal-review:evidence-pack-latest",
      source_ref: "scripts/smoke-temporal-review-artifact-evidence-pack.mjs#latest",
      preview_hash: "sha256:temporal-review-artifact-evidence-pack-latest",
      reviewer_verdict: "fail",
      guardrail_passed: false,
      capture_mode: "route_capture",
      generator: "mock",
      model: "temporal-mock-v0",
      linked_evidence_record_ids: [evidenceRecord.evidence_id],
      linked_session_id: "session:demo-runtime-core",
      linked_pr_url: "https://github.com/Aurna-code/augnes/pull/132",
      manual_review_report_path:
        "docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_ROUTE_CAPTURE_V0_1.md",
      created_by: "codex-smoke",
      created_at: "2026-05-15T00:00:00.000Z",
      updated_at: "2026-05-15T00:00:00.000Z",
    }),
  );

  const dbBefore = openDatabase();
  const protectedBefore = snapshotReadOnlyCounts(dbBefore);
  dbBefore.close();

  const artifactResponse = await getEvidencePack(
    new Request(
      `http://localhost/api/evidence-pack?scope=${encodeURIComponent(scope)}&work_id=${encodeURIComponent(workId)}`,
    ),
  );
  assert.equal(artifactResponse.status, 200, "Evidence Pack artifact case should return 200");
  const artifactPack = await artifactResponse.json();
  const trace = artifactPack.temporal_review_artifact_trace;

  assert.equal(trace.available, true, "artifact trace should report available");
  assert.equal(trace.work_id, workId, "artifact trace should use the Temporal work anchor");
  assert.equal(trace.artifact_count, 2, "artifact trace should count matching artifacts");
  assert.equal(
    trace.latest_artifact_id,
    latestArtifact.artifact_id,
    "artifact trace should expose the latest artifact id",
  );
  assert.equal(trace.latest_reviewer_verdict, "fail");
  assert.equal(trace.latest_guardrail_passed, false);
  assert.equal(trace.latest_capture_mode, "route_capture");
  assert.equal(trace.latest_generator, "mock");
  assert.equal(trace.latest_model, "temporal-mock-v0");
  assert.equal(trace.latest_created_at, "2026-05-15T00:00:00.000Z");
  assert.deepEqual(trace.linked_evidence_record_ids, [evidenceRecord.evidence_id]);
  assert.equal(trace.linked_session_id, "session:demo-runtime-core");
  assert.equal(trace.linked_pr_url, "https://github.com/Aurna-code/augnes/pull/132");
  assert.equal(
    trace.manual_review_report_path,
    "docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_ROUTE_CAPTURE_V0_1.md",
  );
  assert.deepEqual(trace.gaps, [], "artifact-present trace should not report missing-artifact gaps");
  assert.ok(
    trace.boundaries.some((boundary) => boundary.includes("read-only and non-authoritative")),
    "artifact trace should include a read-only boundary",
  );

  const traceKeys = Object.keys(trace);
  for (const forbiddenKey of [
    "approval_status",
    "readiness_status",
    "replay_status",
    "commit_status",
    "memory_admission_status",
    "proof_publication_status",
    "perspective_snapshot_id",
    "raw_episode_bundle_id",
  ]) {
    assert.equal(
      traceKeys.includes(forbiddenKey),
      false,
      `artifact trace should not expose inferred authority field ${forbiddenKey}`,
    );
  }

  const artifactsAfterPackRead = listTemporalPreviewReviewArtifacts({
    scope,
    work_id: workId,
  });
  assert.equal(
    artifactsAfterPackRead.length,
    2,
    "Evidence Pack should not create or delete artifact rows while reading",
  );

  const dbAfter = openDatabase();
  const protectedAfter = snapshotReadOnlyCounts(dbAfter);
  dbAfter.close();

  assert.deepEqual(
    protectedAfter,
    protectedBefore,
    "Evidence Pack read should not mutate protected authority or artifact/evidence/session rows",
  );
  assert.equal(fetchCalls, 0, "Evidence Pack smoke should make no fetch/OpenAI/GitHub calls");

  console.log(
    JSON.stringify(
      {
        smoke: "temporal-review-artifact-evidence-pack",
        db_path: dbPath,
        work_id: workId,
        no_artifact_gap_verified: true,
        artifact_present_summary_verified: true,
        artifact_count: trace.artifact_count,
        latest_artifact_id: trace.latest_artifact_id,
        latest_reviewer_verdict: trace.latest_reviewer_verdict,
        latest_guardrail_passed: trace.latest_guardrail_passed,
        linked_evidence_record_ids: trace.linked_evidence_record_ids,
        linked_session_id: trace.linked_session_id,
        linked_pr_url: trace.linked_pr_url,
        capture_post_route_called_by_evidence_pack: false,
        artifact_create_capture_added_by_evidence_pack: false,
        evidence_pack_write_behavior_added: false,
        protected_authority_rows_mutated: false,
        approval_readiness_replay_state_memory_inference_present: false,
        openai_calls: 0,
        github_publication_adapter_calls: 0,
        fetch_calls: fetchCalls,
      },
      null,
      2,
    ),
  );
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function snapshotReadOnlyCounts(db) {
  const tables = [
    "action_records",
    "delivery_ledger",
    "mailbox_messages",
    "publication_approval_decisions",
    "publication_approval_requests",
    "publication_drafts",
    "publication_readiness_checks",
    "sessions",
    "state_delta_proposals",
    "state_entries",
    "state_tensions",
    "state_transitions",
    "temporal_preview_review_artifacts",
    "verification_evidence_records",
  ];

  return Object.fromEntries(
    tables.map((table) => [
      table,
      db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count,
    ]),
  );
}
