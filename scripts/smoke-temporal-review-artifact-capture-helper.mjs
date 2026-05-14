import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const workId = "AG-TEMPORAL-INTERPRETATION";
const scope = "project:augnes";
const artifactId = "temporal-review:capture-helper-smoke";
const tempDir = mkdtempSync(
  path.join(os.tmpdir(), "augnes-temporal-capture-helper-"),
);
const dbPath = path.join(tempDir, "augnes.db");
process.env.AUGNES_DB_PATH = dbPath;
process.env.OPENAI_API_KEY = "smoke-openai-key-must-not-be-used";

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("Temporal review artifact capture helper smoke must not call fetch.");
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
    insertTemporalPreviewReviewArtifactForSmoke,
    getTemporalPreviewReviewArtifact,
    listTemporalPreviewReviewArtifacts,
  } = await import("../lib/temporal-review-artifacts.ts");
  const {
    buildTemporalPreviewReviewArtifactInputFromRouteCapture,
  } = await import("../lib/temporal-review-artifact-capture.ts");
  const {
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

  const db = openDatabase();
  const protectedBefore = snapshotProtectedCounts(db);
  const artifactsBefore = db
    .prepare("SELECT COUNT(*) AS count FROM temporal_preview_review_artifacts")
    .get().count;
  db.close();
  assert.equal(artifactsBefore, 0, "temp DB should start without review artifacts");

  const workItem = getWorkItem(workId, scope);
  assert.ok(workItem, "AG-TEMPORAL-INTERPRETATION should exist");

  const previewResponse = buildMockPreviewResponse({
    temporalHardeningFixtures: TEMPORAL_HARDENING_FIXTURES,
    validateTemporalPreviewGuardrails,
  });
  const builtInput = buildTemporalPreviewReviewArtifactInputFromRouteCapture(
    previewResponse,
    {
      artifact_id: artifactId,
      source_surface: "local_runtime",
      source_ref: "scripts/smoke-temporal-review-artifact-capture-helper.mjs",
      reviewer_verdict: "pass_with_notes",
      reviewer_notes: "Capture helper smoke stores only bounded review context.",
      manual_review_report_path:
        "docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_ROUTE_CAPTURE_V0_1.md",
      linked_evidence_record_ids: [],
      linked_session_id: null,
      linked_pr_url: "https://github.com/Aurna-code/augnes/pull/127",
      redaction_status: "bounded",
      created_by: "codex-smoke",
      created_at: "2026-05-14T00:00:00.000Z",
      updated_at: "2026-05-14T00:00:00.000Z",
    },
  );

  const dbAfterBuild = openDatabase();
  const artifactsAfterBuild = dbAfterBuild
    .prepare("SELECT COUNT(*) AS count FROM temporal_preview_review_artifacts")
    .get().count;
  dbAfterBuild.close();
  assert.equal(artifactsAfterBuild, 0, "capture helper must not write by default");

  const inserted = insertTemporalPreviewReviewArtifactForSmoke(builtInput);
  assert.equal(inserted.artifact_id, artifactId);
  assert.equal(inserted.work_id, workId);
  assert.equal(inserted.source_route, "/api/temporal-interpretation/preview");
  assert.equal(inserted.generator, "mock");
  assert.equal(inserted.capture_mode, "route_capture");
  assert.equal(inserted.reviewer_verdict, "pass_with_notes");
  assert.equal(inserted.redaction_status, "bounded");
  assert.equal(inserted.guardrail_passed, true);
  assert.ok(inserted.preview_hash?.startsWith("sha256:"), "preview hash should be computed");
  assert.ok(inserted.evidence_anchor_refs.length > 0, "evidence anchors should be populated");
  assert.equal(
    inserted.evidence_anchor_refs.some((ref) => ref.startsWith("summary:")),
    false,
    "evidence anchors must not contain summary refs",
  );
  assert.ok(
    inserted.summary_refs.includes("summary:agent_handoff.current_status"),
    "summary refs should be preserved separately",
  );
  assert.ok(
    inserted.admission_decisions_json.length > 0,
    "admission decisions should be persisted as bounded JSON",
  );
  assert.ok(
    inserted.bounded_preview_json &&
      typeof inserted.bounded_preview_json === "object" &&
      Object.hasOwn(inserted.bounded_preview_json, "active_context_admission"),
    "bounded preview should include active_context_admission",
  );

  const captureForbiddenCaseNames = [];
  for (const captureCase of buildCaptureForbiddenCases(previewResponse)) {
    assert.throws(
      () => {
        const candidate = buildTemporalPreviewReviewArtifactInputFromRouteCapture(
          captureCase.previewResponse,
          captureCase.metadata,
        );
        insertTemporalPreviewReviewArtifactForSmoke(candidate);
      },
      (error) => {
        assert.ok(error instanceof Error, `${captureCase.name} should throw an Error`);
        assert.ok(
          error.message.includes(captureCase.expected_error_includes),
          `${captureCase.name} should include ${JSON.stringify(
            captureCase.expected_error_includes,
          )}, received ${JSON.stringify(error.message)}.`,
        );
        return true;
      },
      `${captureCase.name} should be rejected`,
    );
    captureForbiddenCaseNames.push(captureCase.name);
  }

  const rejectedReusableFixtureNames = [];
  for (const fixture of TEMPORAL_REVIEW_ARTIFACT_FORBIDDEN_PERSISTENCE_FIXTURES) {
    const base = buildTemporalPreviewReviewArtifactInputFromRouteCapture(
      previewResponse,
      {
        artifact_id: `temporal-review:capture-helper-${fixture.name}`,
        source_surface: "local_runtime",
        source_ref: "scripts/smoke-temporal-review-artifact-capture-helper.mjs",
        reviewer_verdict: "pass_with_notes",
        reviewer_notes: "Reusable forbidden fixture run through capture output.",
        linked_evidence_record_ids: [],
        linked_session_id: null,
        redaction_status: "bounded",
        created_by: "codex-smoke",
      },
    );
    const candidate = fixture.mutate(base);

    assert.throws(
      () => insertTemporalPreviewReviewArtifactForSmoke(candidate),
      (error) => {
        assert.ok(error instanceof Error, `${fixture.name} should throw an Error`);
        assert.ok(
          error.message.includes(fixture.expected_error_includes),
          `${fixture.name} should include ${JSON.stringify(
            fixture.expected_error_includes,
          )}, received ${JSON.stringify(error.message)}.`,
        );
        return true;
      },
      `${fixture.name} should remain rejected through capture output`,
    );
    rejectedReusableFixtureNames.push(fixture.name);
  }

  const listed = listTemporalPreviewReviewArtifacts({ scope, work_id: workId });
  assert.equal(listed.length, 1, "list helper should read only the inserted artifact");
  assert.equal(listed[0].artifact_id, artifactId);

  const directGet = getTemporalPreviewReviewArtifact(artifactId, scope);
  assert.ok(directGet, "get helper should read inserted artifact");
  assert.equal(directGet.artifact_id, artifactId);

  const apiListResponse = await listRoute.GET(
    new Request(
      `http://localhost/api/temporal-interpretation/review-artifacts?scope=${encodeURIComponent(scope)}&work_id=${encodeURIComponent(workId)}`,
    ),
  );
  assert.equal(apiListResponse.status, 200, "API list GET should return 200");
  const apiListPayload = await apiListResponse.json();
  assert.equal(apiListPayload.count, 1);
  assert.equal(apiListPayload.artifacts[0].artifact_id, artifactId);

  const apiGetResponse = await getRoute.GET(
    new Request(
      `http://localhost/api/temporal-interpretation/review-artifacts/${encodeURIComponent(artifactId)}?scope=${encodeURIComponent(scope)}`,
    ),
    { params: Promise.resolve({ artifact_id: artifactId }) },
  );
  assert.equal(apiGetResponse.status, 200, "API get GET should return 200");
  const apiGetPayload = await apiGetResponse.json();
  assert.equal(apiGetPayload.artifact.artifact_id, artifactId);

  const dbAfter = openDatabase();
  const protectedAfter = snapshotProtectedCounts(dbAfter);
  const artifactCount = dbAfter
    .prepare("SELECT COUNT(*) AS count FROM temporal_preview_review_artifacts")
    .get().count;
  dbAfter.close();

  assert.equal(artifactCount, 1, "only the capture helper artifact should be inserted");
  assert.deepEqual(
    protectedAfter,
    protectedBefore,
    "capture helper smoke must not mutate protected authority rows",
  );
  assert.equal(fetchCalls, 0, "smoke should not call fetch/OpenAI/GitHub");

  console.log(
    JSON.stringify(
      {
        smoke: "temporal-review-artifact-capture-helper",
        db_path: dbPath,
        work_id: workId,
        work_seeded: true,
        artifact_id: artifactId,
        helper_writes_db_by_default: false,
        artifact_inserted_via_existing_smoke_helper: true,
        bounded_preview_json_generated: true,
        preview_hash_generated: true,
        generator: inserted.generator,
        capture_mode: inserted.capture_mode,
        reviewer_verdict: inserted.reviewer_verdict,
        redaction_status: inserted.redaction_status,
        evidence_anchor_refs_populated: inserted.evidence_anchor_refs.length > 0,
        active_context_admission_present: true,
        admission_decision_count: inserted.admission_decisions_json.length,
        guardrail_passed: inserted.guardrail_passed,
        capture_forbidden_case_names: captureForbiddenCaseNames,
        capture_forbidden_cases_rejected: true,
        reusable_forbidden_fixture_count: rejectedReusableFixtureNames.length,
        reusable_forbidden_fixtures_rejected_through_capture_output: true,
        no_route_post_added: true,
        list_get_apis_still_read_artifact: true,
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

function buildCaptureForbiddenCases(previewResponse) {
  return [
    {
      name: "capture_preview_nested_raw_openai_response",
      previewResponse: withPreviewPatch(previewResponse, {
        active_context_admission: {
          ...previewResponse.preview.active_context_admission,
          raw_openai_response: "forbidden",
        },
      }),
      metadata: baseMetadata("capture-forbidden-raw-response"),
      expected_error_includes: "raw_openai_response is forbidden",
    },
    {
      name: "capture_preview_nested_approval_status",
      previewResponse: withPreviewPatch(previewResponse, {
        active_context_admission: {
          ...previewResponse.preview.active_context_admission,
          approval_status: "approved",
        },
      }),
      metadata: baseMetadata("capture-forbidden-approval-status"),
      expected_error_includes: "approval_status is forbidden",
    },
    {
      name: "capture_preview_safe_next_step_instruction_key",
      previewResponse: withPreviewPatch(previewResponse, {
        safe_next_step_instruction: "approve and publish",
      }),
      metadata: baseMetadata("capture-forbidden-safe-next-step-instruction"),
      expected_error_includes: "safe_next_step_instruction is forbidden",
    },
    {
      name: "capture_summary_ref_as_evidence_anchor",
      previewResponse: withPreviewPatch(previewResponse, {
        evidence_anchors: [
          ...previewResponse.preview.evidence_anchors,
          {
            ref: "summary:agent_handoff.current_status",
            claim: "Summary-only ref must not become an evidence anchor.",
            source_type: "doc",
          },
        ],
      }),
      metadata: baseMetadata("capture-summary-ref-as-evidence"),
      expected_error_includes:
        "summary_refs must not be stored as evidence_anchor_refs",
    },
    {
      name: "capture_reviewer_verdict_approved",
      previewResponse,
      metadata: {
        ...baseMetadata("capture-reviewer-verdict-approved"),
        reviewer_verdict: "approved",
      },
      expected_error_includes: "reviewer_verdict must be one of",
    },
    {
      name: "capture_missing_linked_session_id",
      previewResponse,
      metadata: {
        ...baseMetadata("capture-missing-linked-session"),
        linked_session_id: "session:missing-temporal-capture-helper",
      },
      expected_error_includes: "Unknown linked_session_id",
    },
    {
      name: "capture_missing_linked_evidence_record_id",
      previewResponse,
      metadata: {
        ...baseMetadata("capture-missing-linked-evidence"),
        linked_evidence_record_ids: ["evidence:missing-temporal-capture-helper"],
      },
      expected_error_includes: "Unknown linked evidence_id",
    },
  ];
}

function baseMetadata(suffix) {
  return {
    artifact_id: `temporal-review:${suffix}`,
    source_surface: "local_runtime",
    source_ref: "scripts/smoke-temporal-review-artifact-capture-helper.mjs",
    reviewer_verdict: "pass_with_notes",
    reviewer_notes: "Capture helper forbidden case.",
    linked_evidence_record_ids: [],
    linked_session_id: null,
    redaction_status: "bounded",
    created_by: "codex-smoke",
  };
}

function withPreviewPatch(previewResponse, patch) {
  return {
    ...previewResponse,
    preview: {
      ...previewResponse.preview,
      ...patch,
    },
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

function isPathInside(targetPath, parentPath) {
  const relativePath = path.relative(parentPath, targetPath);
  return (
    relativePath === "" ||
    (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
  );
}
