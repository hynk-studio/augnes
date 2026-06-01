import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const routePath = path.join(
  rootDir,
  "app",
  "api",
  "ag-work-resume",
  "proof-evidence-reconciliation-candidates",
  "lifecycle-actions",
  "route.ts",
);
const corePath = path.join(
  rootDir,
  "lib",
  "ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.ts",
);
const docsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTIONS_V0_1.md",
);
const packagePath = path.join(rootDir, "package.json");
const tableName = "ag_work_resume_proof_evidence_reconciliation_candidates";
const tempDir = mkdtempSync(
  path.join(
    os.tmpdir(),
    "augnes-ag-resume-reconciliation-candidate-lifecycle-route-",
  ),
);
const dbPath = path.join(tempDir, "augnes.db");

process.env.AUGNES_DB_PATH = dbPath;
process.env.OPENAI_API_KEY = "smoke-openai-key-must-not-be-used";

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error(
    "AG resume reconciliation candidate lifecycle route smoke must not call fetch.",
  );
};

try {
  assertFilesExist();
  assertPackageScripts();
  assertSourceGuards();
  resetDb(dbPath);

  const { POST } = await import(
    "../app/api/ag-work-resume/proof-evidence-reconciliation-candidates/lifecycle-actions/route.ts"
  );
  assert.equal(typeof POST, "function", "candidate lifecycle route must expose POST");

  const protectedBefore = snapshotProtectedCounts(dbPath);
  let expectedCandidateRows = 0;

  insertCandidate(dbPath, { candidate_id: "candidate:route-accept", status: "proposed" });
  expectedCandidateRows += 1;
  const acceptResponse = await POST(
    jsonRequest({
      candidate_id: "candidate:route-accept",
      action: "accept_for_future_recording",
      reviewed_by: "user-core:route",
      review_note: "Route accepts candidate for future recording metadata only.",
      reviewed_at: "2026-06-01T08:00:00.000Z",
    }),
  );
  const acceptPayload = await acceptResponse.json();
  assert.equal(acceptResponse.status, 200);
  assert.equal(acceptPayload.ok, true);
  assert.equal(
    acceptPayload.route,
    "ag_work_resume_proof_evidence_reconciliation_candidate_lifecycle_actions.v0_1",
  );
  assert.equal(acceptPayload.result.status, "updated");
  assert.equal(acceptPayload.result.record.status, "accepted_for_future_recording");
  assert.equal(acceptPayload.result.record.reviewed_at, "2026-06-01T08:00:00.000Z");
  assert.match(
    acceptPayload.recommended_next_step,
    /not proof\/evidence recording/i,
  );
  assertCandidateAuthorityBoundary(acceptPayload.authority_boundary, true);

  insertCandidate(dbPath, { candidate_id: "candidate:route-reject", status: "proposed" });
  insertCandidate(dbPath, { candidate_id: "candidate:route-defer", status: "proposed" });
  insertCandidate(dbPath, { candidate_id: "candidate:route-withdraw", status: "proposed" });
  insertCandidate(dbPath, {
    candidate_id: "candidate:route-revoke",
    status: "accepted_for_future_recording",
  });
  insertCandidate(dbPath, { candidate_id: "candidate:route-supersede", status: "proposed" });
  insertCandidate(dbPath, { candidate_id: "candidate:route-replacement", status: "proposed" });
  expectedCandidateRows += 6;

  let routeReplacementBeforeSupersededRevoke = null;
  for (const [candidate_id, action, expectedStatus, reviewed_at, extra] of [
    [
      "candidate:route-reject",
      "reject",
      "rejected",
      "2026-06-01T08:01:00.000Z",
      {},
    ],
    [
      "candidate:route-defer",
      "defer",
      "deferred",
      "2026-06-01T08:02:00.000Z",
      {},
    ],
    [
      "candidate:route-withdraw",
      "withdraw",
      "withdrawn",
      "2026-06-01T08:03:00.000Z",
      {},
    ],
    [
      "candidate:route-revoke",
      "revoke",
      "revoked",
      "2026-06-01T08:04:00.000Z",
      {},
    ],
    [
      "candidate:route-supersede",
      "supersede",
      "superseded",
      "2026-06-01T08:05:00.000Z",
      { replacement_candidate_id: "candidate:route-replacement" },
    ],
  ]) {
    const beforeReplacement =
      action === "supersede"
        ? readCandidateRow(dbPath, "candidate:route-replacement")
        : null;
    const response = await POST(
      jsonRequest({
        candidate_id,
        action,
        reviewed_by: "user-core:route",
        review_note: `Route ${action} candidate review metadata.`,
        reviewed_at,
        ...extra,
      }),
    );
    const payload = await response.json();
    assert.equal(response.status, 200, action);
    assert.equal(payload.result.record.status, expectedStatus, action);
    if (action === "supersede") {
      assert.equal(
        payload.result.record.superseded_by_candidate_id,
        "candidate:route-replacement",
      );
      assert.deepEqual(
        readCandidateRow(dbPath, "candidate:route-replacement"),
        beforeReplacement,
        "route supersede must not update replacement row",
      );
      routeReplacementBeforeSupersededRevoke = beforeReplacement;
    }
  }
  const revokeSupersededResponse = await POST(
    jsonRequest({
      candidate_id: "candidate:route-supersede",
      action: "revoke",
      reviewed_by: "user-core:route",
      review_note:
        "Route revokes a superseded candidate while preserving replacement audit metadata.",
      reviewed_at: "2026-06-01T08:05:30.000Z",
    }),
  );
  const revokeSupersededPayload = await revokeSupersededResponse.json();
  assert.equal(revokeSupersededResponse.status, 200);
  assert.equal(revokeSupersededPayload.result.before_record.status, "superseded");
  assert.equal(revokeSupersededPayload.result.record.status, "revoked");
  assert.equal(
    revokeSupersededPayload.result.record.superseded_by_candidate_id,
    "candidate:route-replacement",
  );
  assert.deepEqual(
    revokeSupersededPayload.result.updated_fields,
    ["status", "reviewed_by", "reviewed_at", "review_note", "updated_at"],
  );
  assert.deepEqual(
    readCandidateRow(dbPath, "candidate:route-replacement"),
    routeReplacementBeforeSupersededRevoke,
    "route revoke from superseded must not update replacement row",
  );

  assert.equal(countRows(dbPath, tableName), expectedCandidateRows);
  assert.deepEqual(snapshotProtectedCounts(dbPath), protectedBefore);

  const validationId = "candidate:route-validation";
  insertCandidate(dbPath, { candidate_id: validationId, status: "proposed" });
  expectedCandidateRows += 1;
  const validationBefore = readCandidateRow(dbPath, validationId);

  const failureCases = [
    {
      name: "wrong content-type",
      response: () =>
        POST(
          new Request(routeUrl(), {
            method: "POST",
            headers: { "content-type": "text/plain" },
            body: JSON.stringify(validLifecycleBody(validationId)),
          }),
        ),
      httpStatus: 400,
      payloadStatus: null,
    },
    {
      name: "invalid JSON",
      response: () =>
        POST(
          new Request(routeUrl(), {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: "{",
          }),
        ),
      httpStatus: 400,
      payloadStatus: null,
    },
    {
      name: "non-object JSON",
      response: () => POST(jsonRequest([])),
      httpStatus: 400,
      payloadStatus: null,
    },
    {
      name: "unsupported db field",
      response: () => POST(jsonRequest({ ...validLifecycleBody(validationId), db: "blocked" })),
      httpStatus: 400,
      payloadStatus: null,
    },
    {
      name: "unsupported now field",
      response: () => POST(jsonRequest({ ...validLifecycleBody(validationId), now: "blocked" })),
      httpStatus: 400,
      payloadStatus: null,
    },
    {
      name: "unsupported proof mutation field",
      response: () =>
        POST(jsonRequest({ ...validLifecycleBody(validationId), proof_id: "blocked" })),
      httpStatus: 400,
      payloadStatus: null,
    },
    {
      name: "missing candidate_id",
      response: () => POST(jsonRequest(omit(validLifecycleBody(validationId), "candidate_id"))),
      httpStatus: 400,
      payloadStatus: "invalid_input",
    },
    {
      name: "invalid action",
      response: () =>
        POST(jsonRequest({ ...validLifecycleBody(validationId), action: "approve" })),
      httpStatus: 400,
      payloadStatus: "invalid_input",
    },
    {
      name: "missing reviewed_by",
      response: () => POST(jsonRequest(omit(validLifecycleBody(validationId), "reviewed_by"))),
      httpStatus: 400,
      payloadStatus: "invalid_input",
    },
    {
      name: "missing review_note",
      response: () => POST(jsonRequest(omit(validLifecycleBody(validationId), "review_note"))),
      httpStatus: 400,
      payloadStatus: "invalid_input",
    },
    {
      name: "malformed reviewed_at",
      response: () =>
        POST(
          jsonRequest({
            ...validLifecycleBody(validationId),
            reviewed_at: "2026-06-01T08:10:00Z",
          }),
        ),
      httpStatus: 400,
      payloadStatus: "invalid_input",
    },
    {
      name: "replacement for non-supersede",
      response: () =>
        POST(
          jsonRequest({
            ...validLifecycleBody(validationId),
            replacement_candidate_id: "candidate:route-replacement",
          }),
        ),
      httpStatus: 400,
      payloadStatus: "invalid_input",
    },
    {
      name: "missing candidate",
      response: () =>
        POST(jsonRequest({ ...validLifecycleBody("candidate:nope"), action: "reject" })),
      httpStatus: 404,
      payloadStatus: "not_found",
    },
    {
      name: "missing replacement",
      response: () =>
        POST(
          jsonRequest({
            ...validLifecycleBody(validationId),
            action: "supersede",
            replacement_candidate_id: "candidate:nope",
          }),
        ),
      httpStatus: 404,
      payloadStatus: "replacement_not_found",
    },
  ];

  for (const failureCase of failureCases) {
    await assertRouteFailureNoWrite({
      ...failureCase,
      expectedCandidateRows,
      protectedBefore,
      candidateId: validationId,
      expectedRow: validationBefore,
    });
  }

  await assertRouteFailureNoWrite({
    name: "invalid transition",
    response: () =>
      POST(
        jsonRequest({
          ...validLifecycleBody("candidate:route-accept"),
          action: "accept_for_future_recording",
        }),
      ),
    httpStatus: 409,
    payloadStatus: "invalid_transition",
    expectedCandidateRows,
    protectedBefore,
    candidateId: "candidate:route-accept",
    expectedRow: readCandidateRow(dbPath, "candidate:route-accept"),
  });

  assert.equal(countRows(dbPath, tableName), expectedCandidateRows);
  assert.deepEqual(snapshotProtectedCounts(dbPath), protectedBefore);
  assert.equal(fetchCalls, 0, "candidate lifecycle route smoke must not call fetch/network");

  console.log(
    JSON.stringify(
      {
        smoke:
          "ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-route",
        temp_db_path: dbPath,
        cases: [
          "package script is present",
          "route source delegates to lifecycle core",
          "all lifecycle actions succeed through POST route",
          "accepted_for_future_recording returns review metadata only",
          "revoke from superseded preserves superseded_by_candidate_id audit metadata",
          "wrong content-type, invalid JSON, and non-object JSON fail closed",
          "db, now, and proof mutation fields fail closed",
          "missing fields and invalid action fail closed",
          "missing candidate, invalid transition, and missing replacement fail closed",
          "failure cases do not write",
          "protected table counts remain unchanged",
          "no fetch/network call observed",
        ],
      },
      null,
      2,
    ),
  );
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function assertFilesExist() {
  for (const file of [routePath, corePath, docsPath, packagePath]) {
    assert.ok(existsSync(file), `${file} must exist`);
  }
}

function assertPackageScripts() {
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  assert.equal(
    packageJson.scripts?.[
      "smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-route"
    ],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-route.mjs",
    "package.json must expose candidate lifecycle route smoke",
  );
}

function assertSourceGuards() {
  const routeSource = readFileSync(routePath, "utf8");
  const coreSource = readFileSync(corePath, "utf8");
  assert.match(
    routeSource,
    /applyAgWorkResumeProofEvidenceReconciliationCandidateLifecycleAction/,
    "route must call lifecycle core",
  );
  assert.match(routeSource, /from "next\/server"/);
  assert.match(routeSource, /content-type/);
  assert.doesNotMatch(routeSource, /export function GET|export async function GET/);
  assert.doesNotMatch(routeSource, /\b(PUT|PATCH|DELETE)\s*\(/);
  assert.doesNotMatch(routeSource, /fetch\s*\(/i, "route must not call fetch");
  assert.doesNotMatch(
    `${routeSource}\n${coreSource}`,
    /createAgWorkResumeProofEvidenceReconciliationCandidate\(|readAgWorkResumeProofEvidenceReconciliationCandidates\(|record-proof|record-evidence|sessions\/bind|work_events|commitStateUpdate/i,
    "route/core must not call create/read/proof/evidence/session/work/Codex/publish helpers",
  );
  const docs = readFileSync(docsPath, "utf8");
  assert.match(docs, /POST \/api\/ag-work-resume\/proof-evidence-reconciliation-candidates\/lifecycle-actions/);
}

function resetDb(targetDbPath) {
  execFileSync("node", ["scripts/db-reset.mjs"], {
    cwd: rootDir,
    env: {
      ...process.env,
      AUGNES_DB_PATH: targetDbPath,
      OPENAI_API_KEY: "smoke-openai-key-must-not-be-used",
    },
    stdio: "pipe",
  });
}

function insertCandidate(targetDbPath, overrides = {}) {
  const db = new Database(targetDbPath);
  const row = {
    candidate_id: overrides.candidate_id,
    record_kind: "ag_work_resume_proof_evidence_reconciliation_candidate",
    schema: "augnes.ag_work_resume_proof_evidence_reconciliation_candidate.v0_1",
    status: overrides.status ?? "proposed",
    import_id: `import:${overrides.candidate_id}`,
    mapping_id: `mapping:${overrides.candidate_id}`,
    foreign_ref_type: "proof",
    foreign_ref_id: `proof:${overrides.candidate_id}`,
    local_target_scope: "project:augnes",
    local_target_work_id: `AG-${String(overrides.candidate_id).toUpperCase()}`,
    summary: `Synthetic reconciliation candidate ${overrides.candidate_id}.`,
    redaction_status: JSON.stringify({
      safe: true,
      secrets_included: false,
      raw_db_paths_included: false,
      session_payloads_included: false,
      proof_payloads_included: false,
    }),
    proposed_by: "user-core:route-smoke",
    proposed_reason: "Synthetic route lifecycle smoke fixture.",
    reviewed_by: null,
    reviewed_at: null,
    review_note: null,
    supersedes_candidate_id: null,
    superseded_by_candidate_id: null,
    authority_boundary: JSON.stringify({
      review_metadata_only: true,
      proof_recorded: false,
      evidence_recorded: false,
    }),
    created_at: "2026-06-01T06:00:00.000Z",
    updated_at: "2026-06-01T06:00:00.000Z",
  };
  try {
    db.prepare(
      `
        INSERT INTO ${tableName} (
          candidate_id,
          record_kind,
          schema,
          status,
          import_id,
          mapping_id,
          foreign_ref_type,
          foreign_ref_id,
          local_target_scope,
          local_target_work_id,
          summary,
          redaction_status,
          proposed_by,
          proposed_reason,
          reviewed_by,
          reviewed_at,
          review_note,
          supersedes_candidate_id,
          superseded_by_candidate_id,
          authority_boundary,
          created_at,
          updated_at
        )
        VALUES (
          @candidate_id,
          @record_kind,
          @schema,
          @status,
          @import_id,
          @mapping_id,
          @foreign_ref_type,
          @foreign_ref_id,
          @local_target_scope,
          @local_target_work_id,
          @summary,
          @redaction_status,
          @proposed_by,
          @proposed_reason,
          @reviewed_by,
          @reviewed_at,
          @review_note,
          @supersedes_candidate_id,
          @superseded_by_candidate_id,
          @authority_boundary,
          @created_at,
          @updated_at
        )
      `,
    ).run(row);
  } finally {
    db.close();
  }
}

async function assertRouteFailureNoWrite({
  name,
  response,
  httpStatus,
  payloadStatus,
  expectedCandidateRows,
  protectedBefore,
  candidateId,
  expectedRow,
}) {
  const routeResponse = await response();
  const payload = await routeResponse.json();
  assert.equal(routeResponse.status, httpStatus, name);
  if (payloadStatus) {
    assert.equal(payload.result?.status, payloadStatus, name);
    assertCandidateAuthorityBoundary(payload.authority_boundary, false);
  } else {
    assert.equal(payload.ok, false, name);
  }
  assert.equal(countRows(dbPath, tableName), expectedCandidateRows, name);
  assert.deepEqual(snapshotProtectedCounts(dbPath), protectedBefore, name);
  assert.deepEqual(readCandidateRow(dbPath, candidateId), expectedRow, name);
}

function assertCandidateAuthorityBoundary(authorityBoundary, updated) {
  assert.equal(authorityBoundary.reconciliation_candidate_lifecycle_updated, updated);
  assert.equal(authorityBoundary.reconciliation_candidate_updated, updated);
  assert.equal(authorityBoundary.review_metadata_only, true);
  assert.equal(authorityBoundary.proof_recorded, false);
  assert.equal(authorityBoundary.evidence_recorded, false);
  assert.equal(authorityBoundary.session_bound, false);
  assert.equal(authorityBoundary.codex_executed, false);
  assert.equal(authorityBoundary.work_item_created, false);
  assert.equal(authorityBoundary.work_event_created, false);
  assert.equal(authorityBoundary.imported_context_updated, false);
  assert.equal(authorityBoundary.confirmed_mapping_updated, false);
  assert.equal(authorityBoundary.proposal_record_updated, false);
  assert.equal(authorityBoundary.approval_granted, false);
  assert.equal(authorityBoundary.publish_retry_replay_authority, false);
  assert.equal(authorityBoundary.merge_authority, false);
}

function validLifecycleBody(candidate_id) {
  return {
    candidate_id,
    action: "reject",
    reviewed_by: "user-core:route",
    review_note: "Route failure fixture.",
    reviewed_at: "2026-06-01T08:10:00.000Z",
  };
}

function jsonRequest(body) {
  return new Request(routeUrl(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function routeUrl() {
  return "http://localhost/api/ag-work-resume/proof-evidence-reconciliation-candidates/lifecycle-actions";
}

function readCandidateRow(targetDbPath, candidateId) {
  const db = new Database(targetDbPath);
  try {
    return db
      .prepare(`SELECT * FROM ${tableName} WHERE candidate_id = ?`)
      .get(candidateId);
  } finally {
    db.close();
  }
}

function snapshotProtectedCounts(targetDbPath) {
  const tables = [
    "action_records",
    "verification_evidence_records",
    "sessions",
    "work_items",
    "work_events",
    "ag_work_resume_imported_contexts",
    "ag_work_resume_confirmed_mappings",
    "ag_work_resume_mapping_proposals",
  ];
  return Object.fromEntries(tables.map((table) => [table, countRows(targetDbPath, table)]));
}

function countRows(targetDbPath, table) {
  const db = new Database(targetDbPath);
  try {
    const exists = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(table);
    if (!exists) return 0;
    return db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
  } finally {
    db.close();
  }
}

function omit(value, keyToOmit) {
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== keyToOmit));
}
