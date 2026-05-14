import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const workId = "AG-TEMPORAL-INTERPRETATION";
const scope = "project:augnes";
const rawKeyA = "smoke-temporal-capture-route-key-A-raw";
const rawKeyB = "smoke-temporal-capture-route-key-B-raw";
const rawKeyC = "smoke-temporal-capture-route-key-C-raw";
const sharedSourceRef = "scripts/smoke-temporal-capture-route.mjs#shared";
const tempDir = mkdtempSync(path.join(os.tmpdir(), "augnes-temporal-capture-route-"));
const dbPath = path.join(tempDir, "augnes.db");
process.env.AUGNES_DB_PATH = dbPath;
process.env.OPENAI_API_KEY = "smoke-openai-key-must-not-be-used";

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("Temporal capture route smoke must not call fetch.");
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
    computeTemporalReviewArtifactPayloadHash,
    getTemporalPreviewReviewArtifact,
    hashTemporalReviewArtifactIdempotencyKey,
    listTemporalPreviewReviewArtifacts,
  } = await import("../lib/temporal-review-artifacts.ts");
  const { buildTemporalPreviewReviewArtifactInputFromRouteCapture } = await import(
    "../lib/temporal-review-artifact-capture.ts"
  );
  const { TEMPORAL_HARDENING_FIXTURES } = await import(
    "../lib/temporal-interpretation/fixtures.ts"
  );
  const { validateTemporalPreviewGuardrails } = await import(
    "../lib/temporal-interpretation/guardrails.ts"
  );
  const captureRoute = await import(
    "../app/api/temporal-interpretation/review-artifacts/capture/route.ts"
  );
  const listRoute = await import(
    "../app/api/temporal-interpretation/review-artifacts/route.ts"
  );
  const getRoute = await import(
    "../app/api/temporal-interpretation/review-artifacts/[artifact_id]/route.ts"
  );

  assert.equal(Object.hasOwn(captureRoute, "POST"), true, "capture route must expose POST");
  assert.equal(Object.hasOwn(captureRoute, "GET"), false, "capture route must not expose GET");
  assert.equal(Object.hasOwn(listRoute, "POST"), false, "list route must not expose POST");
  assert.equal(Object.hasOwn(getRoute, "POST"), false, "get route must not expose POST");

  const dbBefore = openDatabase();
  assert.equal(tableExists(dbBefore), true, "idempotency table should exist");
  assert.equal(
    hasRawStorageColumns(dbBefore),
    false,
    "idempotency table must not have raw storage columns",
  );
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

  const previewResponseA = buildMockPreviewResponse({
    temporalHardeningFixtures: TEMPORAL_HARDENING_FIXTURES,
    validateTemporalPreviewGuardrails,
  });
  const requestA = buildRouteRequest({
    source_ref: sharedSourceRef,
    preview_response: previewResponseA,
    idempotency_key: rawKeyA,
  });
  const expectedInputA = buildTemporalPreviewReviewArtifactInputFromRouteCapture(
    previewResponseA,
    {
      scope,
      work_id: workId,
      source_surface: "local_runtime",
      source_ref: sharedSourceRef,
      reviewer_verdict: "pass_with_notes",
      reviewer_notes: "Capture route smoke stores bounded review context.",
      manual_review_report_path:
        "docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_ROUTE_CAPTURE_V0_1.md",
      linked_evidence_record_ids: [],
      linked_session_id: null,
      linked_pr_url: "https://github.com/Aurna-code/augnes/pull/capture-route-smoke",
      redaction_status: "bounded",
      created_by: "codex-smoke",
    },
  );
  const expectedPayloadHashA =
    computeTemporalReviewArtifactPayloadHash(expectedInputA);
  const expectedKeyHashA = hashTemporalReviewArtifactIdempotencyKey(rawKeyA);

  const createdAResponse = await captureRoute.POST(jsonRequest(requestA));
  assert.equal(createdAResponse.status, 201);
  const createdAPayload = await createdAResponse.json();
  assert.equal(createdAPayload.created, true);
  assert.equal(createdAPayload.idempotent_replay, false);
  assert.equal(createdAPayload.artifact.source_ref, sharedSourceRef);
  assert.equal(createdAPayload.artifact.work_id, workId);
  assert.equal(createdAPayload.artifact.reviewer_verdict, "pass_with_notes");
  assert.equal(createdAPayload.artifact.capture_mode, "route_capture");
  assert.equal(createdAPayload.artifact.redaction_status, "bounded");
  assert.ok(createdAPayload.artifact.preview_hash.startsWith("sha256:"));
  assertCaptureBoundaries(createdAPayload.boundaries);

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
  assert.equal(idempotencyRowsAfterA[0].artifact_id, createdAPayload.artifact.artifact_id);
  assertRawKeyAbsent(dbAfterA, rawKeyA);
  dbAfterA.close();

  const directGetA = getTemporalPreviewReviewArtifact(
    createdAPayload.artifact.artifact_id,
    scope,
  );
  assert.ok(directGetA, "created artifact should persist");
  assert.equal(directGetA.artifact_id, createdAPayload.artifact.artifact_id);

  const replayAResponse = await captureRoute.POST(jsonRequest(requestA));
  assert.equal(replayAResponse.status, 200);
  const replayAPayload = await replayAResponse.json();
  assert.equal(replayAPayload.created, false);
  assert.equal(replayAPayload.idempotent_replay, true);
  assert.equal(replayAPayload.artifact.artifact_id, createdAPayload.artifact.artifact_id);

  const sameKeyModifiedPayload = {
    ...requestA,
    manual_review: {
      ...requestA.manual_review,
      reviewer_notes: "Modified payload with same key must conflict.",
    },
  };
  const sameKeyConflictResponse = await captureRoute.POST(
    jsonRequest(sameKeyModifiedPayload),
  );
  assert.equal(sameKeyConflictResponse.status, 409);
  const sameKeyConflictPayload = await sameKeyConflictResponse.json();
  assert.equal(sameKeyConflictPayload.error, "idempotency_conflict");

  const duplicateSourceHashResponse = await captureRoute.POST(
    jsonRequest({
      ...requestA,
      idempotency_key: rawKeyB,
    }),
  );
  assert.equal(duplicateSourceHashResponse.status, 409);
  const duplicateSourceHashPayload = await duplicateSourceHashResponse.json();
  assert.equal(
    duplicateSourceHashPayload.error,
    "duplicate_source_hash_conflict",
  );

  const requestC = buildRouteRequest({
    source_ref: sharedSourceRef,
    preview_response: withPreviewPatch(previewResponseA, {
      current_interpretation:
        `${previewResponseA.preview.current_interpretation} Different bounded preview hash for route smoke.`,
    }),
    idempotency_key: rawKeyC,
  });
  const createdCResponse = await captureRoute.POST(jsonRequest(requestC));
  assert.equal(createdCResponse.status, 201);
  const createdCPayload = await createdCResponse.json();
  assert.equal(createdCPayload.created, true);
  assert.notEqual(
    createdCPayload.artifact.preview_hash,
    createdAPayload.artifact.preview_hash,
  );

  const forbiddenCaseNames = [];
  for (const captureCase of buildRouteForbiddenCases(previewResponseA)) {
    const response = await captureRoute.POST(jsonRequest(captureCase.request));
    assert.equal(
      response.status,
      400,
      `${captureCase.name} should return 400`,
    );
    const payload = await response.json();
    assert.ok(
      String(payload.message).includes(captureCase.expected_error_includes),
      `${captureCase.name} should include ${JSON.stringify(
        captureCase.expected_error_includes,
      )}, received ${JSON.stringify(payload.message)}.`,
    );
    forbiddenCaseNames.push(captureCase.name);
  }

  const invalidJsonResponse = await captureRoute.POST(
    new Request(
      "http://localhost/api/temporal-interpretation/review-artifacts/capture",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      },
    ),
  );
  assert.equal(invalidJsonResponse.status, 400);
  const invalidJsonPayload = await invalidJsonResponse.json();
  assert.equal(invalidJsonPayload.error, "invalid_json");

  const oversizedPayload = {
    ...buildRouteRequest({
      source_ref: "scripts/smoke-temporal-capture-route.mjs#oversized",
      preview_response: previewResponseA,
      idempotency_key: "smoke-temporal-capture-route-oversized",
    }),
    manual_review: {
      reviewer_verdict: "pass_with_notes",
      reviewer_notes: "x".repeat(140 * 1024),
    },
  };
  const oversizedResponse = await captureRoute.POST(jsonRequest(oversizedPayload));
  assert.equal(oversizedResponse.status, 413);
  const oversizedResponsePayload = await oversizedResponse.json();
  assert.equal(oversizedResponsePayload.error, "payload_too_large");

  const listed = listTemporalPreviewReviewArtifacts({ scope, work_id: workId });
  assert.equal(listed.length, 2, "list helper should read both created artifacts");
  assert.deepEqual(
    listed.map((artifact) => artifact.artifact_id).sort(),
    [createdAPayload.artifact.artifact_id, createdCPayload.artifact.artifact_id].sort(),
  );

  const apiListResponse = await listRoute.GET(
    new Request(
      `http://localhost/api/temporal-interpretation/review-artifacts?scope=${encodeURIComponent(scope)}&work_id=${encodeURIComponent(workId)}`,
    ),
  );
  assert.equal(apiListResponse.status, 200);
  const apiListPayload = await apiListResponse.json();
  assert.equal(apiListPayload.count, 2);

  const apiGetResponse = await getRoute.GET(
    new Request(
      `http://localhost/api/temporal-interpretation/review-artifacts/${encodeURIComponent(createdAPayload.artifact.artifact_id)}?scope=${encodeURIComponent(scope)}`,
    ),
    { params: Promise.resolve({ artifact_id: createdAPayload.artifact.artifact_id }) },
  );
  assert.equal(apiGetResponse.status, 200);
  const apiGetPayload = await apiGetResponse.json();
  assert.equal(apiGetPayload.artifact.artifact_id, createdAPayload.artifact.artifact_id);

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
  assert.equal(finalIdempotencyCount, 2, "only two idempotency rows should be stored");
  assert.deepEqual(
    protectedAfter,
    protectedBefore,
    "capture route smoke must not mutate protected authority rows",
  );
  assert.equal(fetchCalls, 0, "smoke should not call fetch/OpenAI/GitHub");

  console.log(
    JSON.stringify(
      {
        smoke: "temporal-capture-route",
        db_path: dbPath,
        work_id: workId,
        route_path: "/api/temporal-interpretation/review-artifacts/capture",
        public_capture_route_added: true,
        idempotency_key_required: true,
        first_insert_created: true,
        same_key_same_payload_replay: true,
        same_key_different_payload_conflict: true,
        duplicate_source_ref_preview_hash_work_id_conflict: true,
        different_preview_hash_different_key_created: true,
        raw_idempotency_key_stored: false,
        raw_payload_or_request_stored: false,
        payload_size_bound_bytes: 131072,
        invalid_json_rejected: true,
        oversized_payload_rejected: true,
        forbidden_case_names: forbiddenCaseNames,
        forbidden_fixture_cases_rejected_through_route: true,
        reviewer_verdict_not_reviewed_rejected: true,
        client_artifact_id_rejected: true,
        list_get_apis_still_get_only: true,
        read_only_list_get_apis_read_artifacts: true,
        protected_authority_rows_mutated: false,
        artifact_rows_inserted: finalArtifactCount,
        idempotency_rows_inserted: finalIdempotencyCount,
        fetch_calls: fetchCalls,
        openai_calls: 0,
        github_publication_adapter_calls: 0,
        approval_publish_replay_behavior: false,
        evidence_pack_integration_added: false,
        cockpit_code_changed: false,
        chatgpt_app_tools_changed: false,
        perspective_snapshot_runtime_added: false,
        raw_episode_bundle_runtime_added: false,
      },
      null,
      2,
    ),
  );
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function buildRouteRequest({
  source_ref,
  preview_response,
  idempotency_key,
  links = {
    linked_evidence_record_ids: [],
    linked_session_id: null,
    linked_pr_url: "https://github.com/Aurna-code/augnes/pull/capture-route-smoke",
  },
}) {
  return {
    scope,
    work_id: workId,
    source_surface: "local_runtime",
    source_ref,
    preview_response,
    manual_review: {
      reviewer_verdict: "pass_with_notes",
      reviewer_notes: "Capture route smoke stores bounded review context.",
      manual_review_report_path:
        "docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_ROUTE_CAPTURE_V0_1.md",
    },
    links,
    capture: {
      capture_mode: "route_capture",
      redaction_status: "bounded",
      created_by: "codex-smoke",
    },
    idempotency_key,
  };
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

function buildRouteForbiddenCases(previewResponse) {
  return [
    {
      name: "nested_raw_openai_response",
      request: buildRouteRequest({
        source_ref: "scripts/smoke-temporal-capture-route.mjs#raw-openai-response",
        preview_response: withPreviewPatch(previewResponse, {
          active_context_admission: {
            ...previewResponse.preview.active_context_admission,
            raw_openai_response: "forbidden",
          },
        }),
        idempotency_key: "smoke-temporal-capture-route-forbidden-raw-openai-response",
      }),
      expected_error_includes: "raw_openai_response is forbidden",
    },
    {
      name: "nested_approval_status",
      request: buildRouteRequest({
        source_ref: "scripts/smoke-temporal-capture-route.mjs#approval-status",
        preview_response: withPreviewPatch(previewResponse, {
          active_context_admission: {
            ...previewResponse.preview.active_context_admission,
            approval_status: "approved",
          },
        }),
        idempotency_key: "smoke-temporal-capture-route-forbidden-approval-status",
      }),
      expected_error_includes: "approval_status is forbidden",
    },
    {
      name: "safe_next_step_instruction",
      request: buildRouteRequest({
        source_ref: "scripts/smoke-temporal-capture-route.mjs#safe-next-step-instruction",
        preview_response: withPreviewPatch(previewResponse, {
          safe_next_step_instruction: "approve and publish",
        }),
        idempotency_key:
          "smoke-temporal-capture-route-forbidden-safe-next-step-instruction",
      }),
      expected_error_includes: "safe_next_step_instruction is forbidden",
    },
    {
      name: "summary_ref_as_evidence_anchor",
      request: buildRouteRequest({
        source_ref: "scripts/smoke-temporal-capture-route.mjs#summary-ref-as-evidence",
        preview_response: withPreviewPatch(previewResponse, {
          evidence_anchors: [
            ...previewResponse.preview.evidence_anchors,
            {
              ref: "summary:agent_handoff.current_status",
              claim: "Summary-only ref must not become an evidence anchor.",
              source_type: "doc",
            },
          ],
        }),
        idempotency_key: "smoke-temporal-capture-route-summary-ref-as-evidence",
      }),
      expected_error_includes:
        "summary_refs must not be stored as evidence_anchor_refs",
    },
    {
      name: "reviewer_verdict_approved",
      request: withManualReviewPatch(
        buildRouteRequest({
          source_ref: "scripts/smoke-temporal-capture-route.mjs#approved",
          preview_response: previewResponse,
          idempotency_key: "smoke-temporal-capture-route-reviewer-approved",
        }),
        { reviewer_verdict: "approved" },
      ),
      expected_error_includes: "manual_review.reviewer_verdict must be one of",
    },
    {
      name: "reviewer_verdict_not_reviewed",
      request: withManualReviewPatch(
        buildRouteRequest({
          source_ref: "scripts/smoke-temporal-capture-route.mjs#not-reviewed",
          preview_response: previewResponse,
          idempotency_key: "smoke-temporal-capture-route-reviewer-not-reviewed",
        }),
        { reviewer_verdict: "not_reviewed" },
      ),
      expected_error_includes: "manual_review.reviewer_verdict must be one of",
    },
    {
      name: "capture_artifact_id_client_supplied",
      request: {
        ...buildRouteRequest({
          source_ref: "scripts/smoke-temporal-capture-route.mjs#client-artifact-id",
          preview_response: previewResponse,
          idempotency_key: "smoke-temporal-capture-route-client-artifact-id",
        }),
        capture: {
          capture_mode: "route_capture",
          redaction_status: "bounded",
          created_by: "codex-smoke",
          artifact_id: "temporal-review:client-supplied",
        },
      },
      expected_error_includes: "capture.artifact_id is forbidden",
    },
    {
      name: "missing_linked_evidence_record_id",
      request: buildRouteRequest({
        source_ref: "scripts/smoke-temporal-capture-route.mjs#missing-evidence",
        preview_response: previewResponse,
        idempotency_key: "smoke-temporal-capture-route-missing-evidence",
        links: {
          linked_evidence_record_ids: ["evidence:missing-temporal-capture-route"],
          linked_session_id: null,
          linked_pr_url: null,
        },
      }),
      expected_error_includes: "Unknown linked evidence_id",
    },
    {
      name: "missing_linked_session_id",
      request: buildRouteRequest({
        source_ref: "scripts/smoke-temporal-capture-route.mjs#missing-session",
        preview_response: previewResponse,
        idempotency_key: "smoke-temporal-capture-route-missing-session",
        links: {
          linked_evidence_record_ids: [],
          linked_session_id: "session:missing-temporal-capture-route",
          linked_pr_url: null,
        },
      }),
      expected_error_includes: "Unknown linked_session_id",
    },
  ];
}

function jsonRequest(body) {
  return new Request(
    "http://localhost/api/temporal-interpretation/review-artifacts/capture",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );
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

function withManualReviewPatch(request, patch) {
  return {
    ...request,
    manual_review: {
      ...request.manual_review,
      ...patch,
    },
  };
}

function assertCaptureBoundaries(boundaries) {
  for (const expected of [
    "Creates bounded TemporalPreviewReviewArtifact only.",
    "Does not call OpenAI.",
    "Does not call GitHub or GitHub publication adapter.",
    "Does not approve, publish, replay, or commit state.",
    "Does not create PerspectiveSnapshot or RawEpisodeBundle runtime.",
    "Does not update Evidence Pack directly.",
  ]) {
    assert.ok(boundaries.includes(expected), `boundary missing: ${expected}`);
  }
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
