import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
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
  "proof-evidence-recordings",
  "route.ts",
);
const writerPath = path.join(
  rootDir,
  "lib",
  "ag-work-resume-proof-evidence-recording.ts",
);
const packagePath = path.join(rootDir, "package.json");
const tempDir = mkdtempSync(
  path.join(os.tmpdir(), "augnes-ag-resume-proof-evidence-recording-route-"),
);
const dbPath = path.join(tempDir, "augnes.db");

process.env.AUGNES_DB_PATH = dbPath;
process.env.OPENAI_API_KEY = "smoke-openai-key-must-not-be-used";

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("AG Resume proof/evidence recording route smoke must not call fetch.");
};

try {
  assertFilesExist();
  assertPackageScripts();
  assertSourceGuards();
  resetDb(dbPath);

  const { POST, GET } = await import(
    "../app/api/ag-work-resume/proof-evidence-recordings/route.ts"
  );
  assert.equal(typeof POST, "function", "recording route must expose POST");
  assert.equal(typeof GET, "function", "recording route must expose bounded 405 GET");

  const transportBefore = protectedCountsForPath(dbPath);
  await assertTransportFailure({
    label: "unsupported method",
    response: () => GET(new Request(routeUrl(), { method: "GET" })),
    status: 405,
    result: "unsupported_method",
  });
  await assertTransportFailure({
    label: "unsupported content type",
    response: () =>
      POST(
        new Request(routeUrl(), {
          method: "POST",
          headers: { "content-type": "text/plain" },
          body: JSON.stringify({ candidate_id: "candidate:content-type" }),
        }),
      ),
    status: 415,
    result: "unsupported_content_type",
  });
  await assertTransportFailure({
    label: "invalid JSON",
    response: () =>
      POST(
        new Request(routeUrl(), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{",
        }),
      ),
    status: 400,
    result: "invalid_json",
  });
  await assertTransportFailure({
    label: "non-object JSON",
    response: () => POST(jsonRequest([])),
    status: 400,
    result: "non_object_json",
  });
  await assertTransportFailure({
    label: "unsupported field",
    response: () => POST(jsonRequest({ candidate_id: "candidate:x", surprise: true })),
    status: 400,
    result: "unsupported_field",
  });
  await assertTransportFailure({
    label: "forbidden field db",
    response: () => POST(jsonRequest({ candidate_id: "candidate:x", db: "blocked" })),
    status: 400,
    result: "forbidden_field",
  });
  await assertTransportFailure({
    label: "forbidden field publish",
    response: () =>
      POST(jsonRequest({ candidate_id: "candidate:x", publish: true })),
    status: 400,
    result: "forbidden_field",
  });
  assert.deepEqual(
    protectedCountsForPath(dbPath),
    transportBefore,
    "transport failures must not mutate DB rows",
  );

  const success = createSourceFixture(dbPath, "route-success");
  const successBody = buildRouteBody(success);
  const successBefore = sideEffectSnapshot(dbPath, success);
  const successResponse = await POST(jsonRequest(successBody));
  const successPayload = await successResponse.json();
  assert.equal(successResponse.status, 201);
  assert.equal(successPayload.ok, true);
  assert.equal(successPayload.route, "ag_work_resume_proof_evidence_recordings.v0_1");
  assert.equal(successPayload.result, "recorded");
  assert.equal(successPayload.created, true);
  assert.equal(successPayload.candidate_id, success.candidate_id);
  assert.equal(successPayload.evidence_id, expectedEvidenceId(success));
  assert.equal(successPayload.recording_link_id, expectedLinkId(success));
  assert.equal(successPayload.idempotency_key, expectedIdempotencyKey(success));
  assert.equal(successPayload.target_record_kind, "verification_evidence");
  assert.equal(successPayload.authority_boundary.verification_evidence_record_created, true);
  assert.equal(successPayload.authority_boundary.bridge_link_created, true);
  assertNoForbiddenAuthority(successPayload.authority_boundary);
  assertPublicSafePayload(successPayload);
  assertRecordingRows(dbPath, success, successPayload);
  assertSideEffects(dbPath, success, successBefore, {
    evidenceDelta: 1,
    linkDelta: 1,
  });

  const idempotentBefore = sideEffectSnapshot(dbPath, success);
  const idempotentResponse = await POST(jsonRequest(successBody));
  const idempotentPayload = await idempotentResponse.json();
  assert.equal(idempotentResponse.status, 200);
  assert.equal(idempotentPayload.ok, true);
  assert.equal(idempotentPayload.result, "idempotent_no_new_write");
  assert.equal(idempotentPayload.created, false);
  assert.equal(idempotentPayload.evidence_id, successPayload.evidence_id);
  assert.equal(idempotentPayload.recording_link_id, successPayload.recording_link_id);
  assertNoForbiddenAuthority(idempotentPayload.authority_boundary);
  assertPublicSafePayload(idempotentPayload);
  assertSideEffects(dbPath, success, idempotentBefore, {
    evidenceDelta: 0,
    linkDelta: 0,
  });

  const duplicate = createSourceFixture(dbPath, "route-duplicate");
  seedDifferentKeyRecording(dbPath, duplicate);
  await assertRouteFailureNoWrite({
    POST,
    fixture: duplicate,
    body: buildRouteBody(duplicate),
    status: 409,
    result: "duplicate_conflict",
    label: "duplicate_conflict",
  });

  const proposed = createSourceFixture(dbPath, "route-proposed", {
    status: "proposed",
  });
  await assertRouteFailureNoWrite({
    POST,
    fixture: proposed,
    body: buildRouteBody(proposed),
    status: 409,
    result: "invalid_candidate",
    label: "invalid_candidate",
  });

  const missingApproval = createSourceFixture(dbPath, "route-missing-approval");
  await assertRouteFailureNoWrite({
    POST,
    fixture: missingApproval,
    body: omit(buildRouteBody(missingApproval), "user_core_approval"),
    status: 403,
    result: "unauthorized_attempt",
    label: "missing approval",
  });

  const unauthorized = createSourceFixture(dbPath, "route-unauthorized");
  await assertRouteFailureNoWrite({
    POST,
    fixture: unauthorized,
    body: {
      ...buildRouteBody(unauthorized),
      expected_idempotency_key: "actual-proof-evidence-recording:v0_1:wrong",
    },
    status: 403,
    result: "unauthorized_attempt",
    label: "unauthorized_attempt",
  });

  const crossCheck = createSourceFixture(dbPath, "route-cross-check");
  await assertRouteFailureNoWrite({
    POST,
    fixture: crossCheck,
    body: { ...buildRouteBody(crossCheck), import_id: "import:wrong" },
    status: 409,
    result: "source_cross_check_failed",
    label: "source_cross_check_failed",
  });

  const missingSource = createSourceFixture(dbPath, "route-missing-source");
  deleteWorkItem(dbPath, missingSource);
  await assertRouteFailureNoWrite({
    POST,
    fixture: missingSource,
    body: buildRouteBody(missingSource),
    status: 404,
    result: "missing_source_rows",
    label: "missing_source_rows",
  });

  const unsafeRedaction = createSourceFixture(dbPath, "route-unsafe-redaction");
  const unsafeSummary = {
    ...safeRedactionSummary(),
    raw_evidence_payloads_included: true,
  };
  await assertRouteFailureNoWrite({
    POST,
    fixture: unsafeRedaction,
    body: buildRouteBody(unsafeRedaction, {
      redaction_summary: unsafeSummary,
      user_core_approval: buildApproval(unsafeRedaction, {
        redaction_summary: unsafeSummary,
      }),
    }),
    status: 422,
    result: "unsafe_redaction",
    label: "unsafe_redaction",
  });

  const invalidActor = createSourceFixture(dbPath, "route-invalid-actor");
  await assertRouteFailureNoWrite({
    POST,
    fixture: invalidActor,
    body: buildRouteBody(invalidActor, {
      actor: "codex",
      user_core_approval: buildApproval(invalidActor, { actor: "codex" }),
    }),
    status: 422,
    result: "invalid_actor_reason",
    label: "invalid_actor_reason actor",
  });

  const invalidReason = createSourceFixture(dbPath, "route-invalid-reason");
  await assertRouteFailureNoWrite({
    POST,
    fixture: invalidReason,
    body: buildRouteBody(invalidReason, {
      reason: "",
      user_core_approval: buildApproval(invalidReason, { reason: "" }),
    }),
    status: 422,
    result: "invalid_actor_reason",
    label: "invalid_actor_reason reason",
  });

  const invalidTrust = createSourceFixture(dbPath, "route-invalid-trust");
  await assertRouteFailureNoWrite({
    POST,
    fixture: invalidTrust,
    body: buildRouteBody(invalidTrust, {
      trust_provenance_label: "raw_foreign_payload",
      user_core_approval: buildApproval(invalidTrust, {
        trust_provenance_label: "raw_foreign_payload",
      }),
    }),
    status: 422,
    result: "invalid_trust_provenance",
    label: "invalid_trust_provenance",
  });

  const uniqueFailure = createSourceFixture(dbPath, "route-unique-failure");
  seedEvidenceIdConflict(dbPath, uniqueFailure);
  await assertRouteFailureNoWrite({
    POST,
    fixture: uniqueFailure,
    body: buildRouteBody(uniqueFailure),
    status: 409,
    result: "fk_or_unique_failure",
    label: "fk_or_unique_failure",
    expectedFailurePattern: /constraint prevented recording/i,
  });

  const dbError = createSourceFixture(dbPath, "route-db-error");
  const originalDbPath = process.env.AUGNES_DB_PATH;
  try {
    process.env.AUGNES_DB_PATH = tempDir;
    const response = await POST(jsonRequest(buildRouteBody(dbError)));
    const payload = await response.json();
    assert.equal(response.status, 500);
    assert.equal(payload.result, "db_error");
    assert.equal(payload.created, false);
    assertNoForbiddenAuthority(payload.authority_boundary);
    assertPublicSafePayload(payload);
    assert.doesNotMatch(JSON.stringify(payload), /SQLITE|better-sqlite3|\/Users\//i);
  } finally {
    process.env.AUGNES_DB_PATH = originalDbPath;
  }

  assertNoForbiddenRows(dbPath);
  assert.equal(fetchCalls, 0, "recording route smoke must not call fetch/network");

  console.log(
    JSON.stringify(
      {
        smoke: "ag-work-resume-proof-evidence-recording-route",
        temp_db_path: dbPath,
        route: "POST /api/ag-work-resume/proof-evidence-recordings",
        cases: [
          "package script is present",
          "route source delegates only to createAgWorkResumeProofEvidenceRecordingFromCandidate",
          "application/json is required",
          "invalid JSON fails closed",
          "non-object JSON fails closed",
          "unsupported fields fail closed",
          "forbidden fields fail closed",
          "missing approval fails closed",
          "exact approved recorded request returns 201",
          "recorded request creates exactly one verification_evidence_records row and one bridge row",
          "idempotent repeat returns 200 and creates no duplicate rows",
          "duplicate_conflict returns 409 and creates no rows",
          "invalid_candidate returns 409 and creates no rows",
          "unauthorized_attempt returns 403 and creates no rows",
          "source_cross_check_failed returns 409 and creates no rows",
          "missing_source_rows returns 404 and creates no rows",
          "unsafe_redaction returns 422 and creates no rows",
          "invalid_actor_reason returns 422 and creates no rows",
          "invalid_trust_provenance returns 422 and creates no rows",
          "fk_or_unique_failure returns 409 and rolls back",
          "db_error returns 500 with public-safe bounded failure text",
          "every response includes authority_boundary",
          "no route response grants session/Codex/work/action/source-row/approval/publish/retry/replay/merge authority",
          "no fetch/network calls occur",
          "no UI/Cockpit files changed",
          "no writer/helper behavior changed",
          "no schema/migration files changed",
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
  for (const file of [routePath, writerPath, packagePath]) {
    assert.ok(existsSync(file), `${file} must exist`);
  }
}

function assertPackageScripts() {
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  assert.equal(
    packageJson.scripts?.["smoke:ag-work-resume-proof-evidence-recording-route"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-proof-evidence-recording-route.mjs",
    "package.json must expose recording route smoke",
  );
}

function assertSourceGuards() {
  const routeSource = readFileSync(routePath, "utf8");
  const writerSource = readFileSync(writerPath, "utf8");
  assert.match(routeSource, /export const runtime = "nodejs"/);
  assert.match(routeSource, /export const dynamic = "force-dynamic"/);
  assert.match(
    routeSource,
    /createAgWorkResumeProofEvidenceRecordingFromCandidate/,
    "route must delegate to bounded recording helper",
  );
  assert.match(routeSource, /content-type/);
  for (const field of [
    "candidate_id",
    "import_id",
    "mapping_id",
    "user_core_approval",
    "actor",
    "reason",
    "redaction_summary",
    "trust_provenance_label",
    "local_target_scope",
    "local_target_work_id",
    "expected_idempotency_key",
  ]) {
    assert.match(routeSource, new RegExp(`"${field}"`), `${field} must be supported`);
  }
  for (const field of [
    "db",
    "now",
    "session_id",
    "codex_continue",
    "codex_execute",
    "work_item_create",
    "work_event_create",
    "action_record",
    "mutate_imported_context",
    "mutate_confirmed_mapping",
    "mutate_proposal",
    "mutate_candidate",
    "publish",
    "retry",
    "replay",
    "merge",
    "auto_merge",
    "external_post",
    "committed_state",
  ]) {
    assert.match(routeSource, new RegExp(`"${field}"`), `${field} must be forbidden`);
  }
  assert.doesNotMatch(routeSource, /fetch\s*\(/i, "route must not call fetch");
  assert.doesNotMatch(routeSource, /\bdb\s*:/, "route must not pass db to helper");
  assert.doesNotMatch(routeSource, /\bnow\s*:/, "route must not pass now to helper");
  assert.doesNotMatch(
    routeSource,
    /record-proof|record-evidence|sessions\/bind|work_events|commitStateUpdate|OpenAI|octokit|GitHub|Browser|MCP/i,
    "route must not call proof/session/work/state/network helpers",
  );
  assert.doesNotMatch(
    writerSource,
    /export async function|Request|NextResponse/,
    "writer/helper behavior must remain independent of route implementation",
  );
  assertNoUnexpectedChangedFiles();
}

async function assertTransportFailure({ label, response, status, result }) {
  const routeResponse = await response();
  const payload = await routeResponse.json();
  assert.equal(routeResponse.status, status, label);
  assert.equal(payload.ok, false, label);
  assert.equal(payload.result, result, label);
  assert.equal(payload.created, false, label);
  assert.equal(payload.evidence_id, null, label);
  assert.equal(payload.recording_link_id, null, label);
  assert.ok(payload.authority_boundary, `${label} must include authority_boundary`);
  assertNoForbiddenAuthority(payload.authority_boundary);
  assertPublicSafePayload(payload);
}

async function assertRouteFailureNoWrite({
  POST,
  fixture,
  body,
  status,
  result,
  label,
  expectedFailurePattern,
}) {
  const before = sideEffectSnapshot(dbPath, fixture);
  const response = await POST(jsonRequest(body));
  const payload = await response.json();
  assert.equal(response.status, status, label);
  assert.equal(payload.ok, false, label);
  assert.equal(payload.result, result, label);
  assert.equal(payload.created, false, label);
  assert.equal(payload.evidence_id, null, label);
  assert.equal(payload.recording_link_id, null, label);
  assertNoForbiddenAuthority(payload.authority_boundary);
  assertPublicSafePayload(payload);
  if (expectedFailurePattern) {
    assert.match(payload.failures.join("\n"), expectedFailurePattern, label);
  }
  assertSideEffects(dbPath, fixture, before, { evidenceDelta: 0, linkDelta: 0 });
}

function createSourceFixture(targetDbPath, key, options = {}) {
  const suffix = key.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const scope = "project:augnes";
  const workId = `AG-REC-${suffix.toUpperCase()}`;
  const proposalId = `ag-resume-mapping-proposal:${suffix}`;
  const mappingId = `ag-resume-confirmed-mapping:${suffix}`;
  const importId = `ag-resume-imported-context:${suffix}`;
  const candidateId = `ag-resume-proof-evidence-reconciliation-candidate:${suffix}`;
  const packetId = `packet:${suffix}`;
  const packetHash = `packet-hash:${suffix}`;
  const foreignScope = "foreign:augnes";
  const foreignWorkId = `FOREIGN-${suffix.toUpperCase()}`;
  const now = "2026-06-01T12:00:00.000Z";
  const db = openDb(targetDbPath);
  try {
    db.prepare(
      `
        INSERT INTO work_items (scope, work_id, title, status, priority, summary, next_action, related_state_keys, links, created_at, updated_at)
        VALUES (?, ?, ?, 'active', 'normal', ?, '', '[]', '{}', ?, ?)
      `,
    ).run(scope, workId, `Recording route fixture ${key}`, `Fixture work ${key}`, now, now);
    db.prepare(
      `
        INSERT INTO ag_work_resume_mapping_proposals (
          proposal_id,
          record_kind,
          schema,
          status,
          foreign_scope,
          foreign_work_id,
          foreign_title,
          candidate_local_scope,
          candidate_local_work_id,
          candidate_title,
          packet_id,
          packet_hash,
          proposal_preview_id,
          proposal_preview_hash,
          comparison_summary,
          gaps_summary,
          conflicts_summary,
          questions_summary,
          foreign_refs_summary,
          repo_context_summary,
          redaction_summary,
          proposed_by,
          proposal_reason,
          authority_boundary,
          created_at,
          updated_at
        )
        VALUES (?, 'ag_work_resume_mapping_proposal', 'augnes.ag_work_resume_mapping_proposal.v0_1', 'proposed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', '[]', '[]', '[]', '{}', '{}', ?, 'user-core:fixture', ?, '{}', ?, ?)
      `,
    ).run(
      proposalId,
      foreignScope,
      foreignWorkId,
      `Foreign fixture ${key}`,
      scope,
      workId,
      `Local fixture ${key}`,
      packetId,
      packetHash,
      `preview:${suffix}`,
      `preview-hash:${suffix}`,
      JSON.stringify(safeRedactionSummary()),
      `Fixture proposal ${key}`,
      now,
      now,
    );
    db.prepare(
      `
        INSERT INTO ag_work_resume_confirmed_mappings (
          mapping_id,
          record_kind,
          schema,
          status,
          foreign_scope,
          foreign_work_id,
          local_scope,
          local_work_id,
          source_proposal_id,
          packet_id,
          packet_hash,
          source_runtime_instance_id,
          confirmed_by,
          confirmed_at,
          confirmation_reason,
          authority_boundary,
          created_at,
          updated_at
        )
        VALUES (?, 'ag_work_resume_confirmed_mapping', 'augnes.ag_work_resume_confirmed_mapping.v0_1', 'active', ?, ?, ?, ?, ?, ?, ?, ?, 'user-core:fixture', ?, ?, '{}', ?, ?)
      `,
    ).run(
      mappingId,
      foreignScope,
      foreignWorkId,
      scope,
      workId,
      proposalId,
      packetId,
      packetHash,
      `runtime:${suffix}`,
      now,
      `Fixture mapping ${key}`,
      now,
      now,
    );
    db.prepare(
      `
        INSERT INTO ag_work_resume_imported_contexts (
          import_id,
          record_kind,
          schema,
          status,
          mapping_id,
          foreign_scope,
          foreign_work_id,
          local_scope,
          local_work_id,
          packet_id,
          packet_hash,
          source_runtime_instance_id,
          imported_summary,
          imported_expected_files,
          imported_expected_checks,
          foreign_refs_summary,
          redaction_report,
          created_by,
          import_reason,
          created_at,
          updated_at,
          authority_boundary
        )
        VALUES (?, 'ag_work_resume_imported_context', 'augnes.ag_work_resume_imported_context.v0_1', 'review_metadata', ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', '[]', ?, ?, 'user-core:fixture', ?, ?, ?, '{}')
      `,
    ).run(
      importId,
      mappingId,
      foreignScope,
      foreignWorkId,
      scope,
      workId,
      packetId,
      packetHash,
      `runtime:${suffix}`,
      `Bounded imported context ${key}`,
      JSON.stringify({ proof_refs: [`proof:${suffix}`] }),
      JSON.stringify(safeRedactionSummary()),
      `Fixture import ${key}`,
      now,
      now,
    );
    db.prepare(
      `
        INSERT INTO ag_work_resume_proof_evidence_reconciliation_candidates (
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
          authority_boundary,
          created_at,
          updated_at
        )
        VALUES (?, 'ag_work_resume_proof_evidence_reconciliation_candidate', 'augnes.ag_work_resume_proof_evidence_reconciliation_candidate.v0_1', ?, ?, ?, 'proof', ?, ?, ?, ?, ?, 'user-core:fixture', ?, 'user-core:reviewer', ?, 'accepted for future recording fixture', '{}', ?, ?)
      `,
    ).run(
      candidateId,
      options.status ?? "accepted_for_future_recording",
      importId,
      mappingId,
      `proof:${suffix}`,
      scope,
      workId,
      `Bounded candidate summary ${key}`,
      JSON.stringify(safeRedactionSummary()),
      `Fixture candidate ${key}`,
      now,
      now,
      now,
    );
  } finally {
    db.close();
  }
  return {
    key,
    scope,
    work_id: workId,
    proposal_id: proposalId,
    mapping_id: mappingId,
    import_id: importId,
    candidate_id: candidateId,
    foreign_ref_type: "proof",
    foreign_ref_id: `proof:${suffix}`,
  };
}

function buildRouteBody(fixture, overrides = {}) {
  const redactionSummary = overrides.redaction_summary ?? safeRedactionSummary();
  const actor = overrides.actor ?? "user-core:recording-route-smoke";
  const reason =
    overrides.reason ??
    `User/Core approved fixture ${fixture.key} for route evidence recording.`;
  return {
    candidate_id: fixture.candidate_id,
    import_id: fixture.import_id,
    mapping_id: fixture.mapping_id,
    user_core_approval:
      overrides.user_core_approval ??
      buildApproval(fixture, {
        actor,
        reason,
        redaction_summary: redactionSummary,
        trust_provenance_label:
          overrides.trust_provenance_label ?? "foreign_summary_user_core_attested",
      }),
    actor,
    reason,
    redaction_summary: redactionSummary,
    trust_provenance_label:
      overrides.trust_provenance_label ?? "foreign_summary_user_core_attested",
    local_target_scope: fixture.scope,
    local_target_work_id: fixture.work_id,
    expected_idempotency_key:
      overrides.expected_idempotency_key ?? expectedIdempotencyKey(fixture),
  };
}

function buildApproval(fixture, overrides = {}) {
  const actor = overrides.actor ?? "user-core:recording-route-smoke";
  const reason =
    overrides.reason ??
    `User/Core approved fixture ${fixture.key} for route evidence recording.`;
  const redactionSummary = overrides.redaction_summary ?? safeRedactionSummary();
  const trustLabel =
    overrides.trust_provenance_label ?? "foreign_summary_user_core_attested";
  return {
    approval_kind: "ag_work_resume_actual_proof_evidence_recording",
    approval_schema:
      "augnes.ag_work_resume.actual_proof_evidence_recording.approval.v0_1",
    approved_candidate_id: fixture.candidate_id,
    approved_import_id: fixture.import_id,
    approved_mapping_id: fixture.mapping_id,
    approved_local_target_scope: fixture.scope,
    approved_local_target_work_id: fixture.work_id,
    approved_target_record_kind: "verification_evidence",
    approved_idempotency_key:
      overrides.idempotency_key ?? expectedIdempotencyKey(fixture),
    approved_actor: actor,
    approved_reason: reason,
    approved_redaction_summary: redactionSummary,
    approved_trust_provenance_label: trustLabel,
    approved_side_effects: {
      insert_tables: [
        "verification_evidence_records",
        "ag_work_resume_proof_evidence_recording_links",
      ],
      forbidden_tables: [
        "action_records",
        "sessions",
        "work_items",
        "work_events",
        "ag_work_resume_imported_contexts",
        "ag_work_resume_confirmed_mappings",
        "ag_work_resume_mapping_proposals",
        "ag_work_resume_proof_evidence_reconciliation_candidates",
      ],
    },
  };
}

function safeRedactionSummary() {
  return {
    safe: true,
    secrets_included: false,
    raw_db_paths_included: false,
    raw_session_payloads_included: false,
    session_payloads_included: false,
    raw_proof_payloads_included: false,
    proof_payloads_included: false,
    raw_evidence_payloads_included: false,
    evidence_payloads_included: false,
    tokens_included: false,
    keys_included: false,
    cookies_included: false,
    private_paths_included: false,
    raw_foreign_payload_copied: false,
    raw_foreign_payloads_copied: false,
    raw_command_output_included: false,
  };
}

function expectedIdempotencyKey(fixture) {
  return [
    "actual-proof-evidence-recording:v0_1",
    fixture.candidate_id,
    fixture.import_id,
    fixture.mapping_id,
    fixture.foreign_ref_type,
    fixture.foreign_ref_id,
    fixture.scope,
    fixture.work_id,
    "verification_evidence",
  ].join(":");
}

function expectedHash(fixture) {
  return hashValue({ idempotency_key: expectedIdempotencyKey(fixture) });
}

function expectedEvidenceId(fixture) {
  return `evidence:ag-resume-recording:${expectedHash(fixture)}`;
}

function expectedLinkId(fixture) {
  return `ag-resume-proof-evidence-recording-link:${expectedHash(fixture)}`;
}

function assertRecordingRows(targetDbPath, fixture, payload) {
  const db = openDb(targetDbPath);
  try {
    const evidence = db
      .prepare("SELECT * FROM verification_evidence_records WHERE evidence_id = ?")
      .get(payload.evidence_id);
    const link = db
      .prepare(
        "SELECT * FROM ag_work_resume_proof_evidence_recording_links WHERE recording_link_id = ?",
      )
      .get(payload.recording_link_id);
    assert.ok(evidence, "evidence row must exist");
    assert.ok(link, "bridge row must exist");
    assert.equal(evidence.evidence_id, expectedEvidenceId(fixture));
    assert.equal(evidence.scope, fixture.scope);
    assert.equal(evidence.work_id, fixture.work_id);
    assert.equal(evidence.related_action_id, null);
    assert.equal(evidence.related_work_event_id, null);
    assert.equal(link.recording_link_id, expectedLinkId(fixture));
    assert.equal(link.candidate_id, fixture.candidate_id);
    assert.equal(link.import_id, fixture.import_id);
    assert.equal(link.mapping_id, fixture.mapping_id);
    assert.equal(link.target_evidence_id, evidence.evidence_id);
    assert.equal(link.target_action_id, null);
    assert.equal(link.idempotency_key, expectedIdempotencyKey(fixture));
    assert.equal(link.recording_status, "recorded");
    assert.equal(link.failure_reason, null);
    const metadata = JSON.parse(evidence.metadata);
    assert.equal(metadata.candidate_id, fixture.candidate_id);
    assert.equal(metadata.import_id, fixture.import_id);
    assert.equal(metadata.mapping_id, fixture.mapping_id);
    assert.equal(metadata.action_records_created, false);
    assert.equal(metadata.session_binding_created, false);
    assert.equal(metadata.codex_continuation_started, false);
    const provenance = JSON.parse(link.provenance_json);
    assert.deepEqual(provenance.side_effects.allowed_insert_tables, [
      "verification_evidence_records",
      "ag_work_resume_proof_evidence_recording_links",
    ]);
    assert.equal(provenance.side_effects.action_records_created, false);
    assert.equal(provenance.side_effects.session_binding_created, false);
    assert.equal(provenance.side_effects.work_item_event_created, false);
    assert.equal(provenance.side_effects.candidate_mutated, false);
    assert.equal(provenance.side_effects.imported_context_mutated, false);
    assert.equal(provenance.side_effects.confirmed_mapping_mutated, false);
    assert.equal(provenance.side_effects.proposal_mutated, false);
  } finally {
    db.close();
  }
}

function assertNoForbiddenAuthority(boundary) {
  assert.equal(boundary.exact_user_core_approval_required, true);
  assert.equal(boundary.proof_recorded, false);
  assert.equal(boundary.action_record_created, false);
  assert.equal(boundary.route_added, false);
  assert.equal(boundary.ui_added, false);
  assert.equal(boundary.session_bound, false);
  assert.equal(boundary.codex_executed, false);
  assert.equal(boundary.codex_continued, false);
  assert.equal(boundary.work_item_created, false);
  assert.equal(boundary.work_event_created, false);
  assert.equal(boundary.imported_context_mutated, false);
  assert.equal(boundary.confirmed_mapping_mutated, false);
  assert.equal(boundary.proposal_record_mutated, false);
  assert.equal(boundary.reconciliation_candidate_mutated, false);
  assert.equal(boundary.approval_granted, false);
  assert.equal(boundary.publish_retry_replay_authority, false);
  assert.equal(boundary.merge_authority, false);
  assert.equal(boundary.auto_merge_authority, false);
  assert.equal(boundary.external_posting_authority, false);
  assert.equal(boundary.committed_state_mutated, false);
}

function assertPublicSafePayload(payload) {
  assert.ok(payload.authority_boundary, "response must include authority_boundary");
  const text = JSON.stringify(payload);
  assert.doesNotMatch(text, /sk-[A-Za-z0-9_-]+/);
  assert.doesNotMatch(text, /\bgh[pousr]_[A-Za-z0-9_]+/);
  assert.doesNotMatch(text, /cookie|raw session payload|private key/i);
  assert.doesNotMatch(text, /\/Users\/hynk/i);
  assert.doesNotMatch(text, /at .*:\d+:\d+/, "response must not include stack trace frames");
}

function sideEffectSnapshot(targetDbPath, fixture) {
  const db = openDb(targetDbPath);
  try {
    return {
      counts: protectedCounts(db),
      proposal: rowById(db, "ag_work_resume_mapping_proposals", "proposal_id", fixture.proposal_id),
      mapping: rowById(db, "ag_work_resume_confirmed_mappings", "mapping_id", fixture.mapping_id),
      imported: rowById(db, "ag_work_resume_imported_contexts", "import_id", fixture.import_id),
      candidate: rowById(
        db,
        "ag_work_resume_proof_evidence_reconciliation_candidates",
        "candidate_id",
        fixture.candidate_id,
      ),
      work: rowByWork(db, fixture.scope, fixture.work_id),
    };
  } finally {
    db.close();
  }
}

function assertSideEffects(targetDbPath, fixture, before, { evidenceDelta, linkDelta }) {
  const after = sideEffectSnapshot(targetDbPath, fixture);
  for (const [table, beforeCount] of Object.entries(before.counts)) {
    const expected =
      table === "verification_evidence_records"
        ? beforeCount + evidenceDelta
        : table === "ag_work_resume_proof_evidence_recording_links"
          ? beforeCount + linkDelta
          : beforeCount;
    assert.equal(after.counts[table], expected, `${table} count must match`);
  }
  assert.deepEqual(after.proposal, before.proposal, "proposal row must not mutate");
  assert.deepEqual(after.mapping, before.mapping, "confirmed mapping row must not mutate");
  assert.deepEqual(after.imported, before.imported, "imported context row must not mutate");
  assert.deepEqual(
    after.candidate,
    before.candidate,
    "reconciliation candidate row must not mutate",
  );
  assert.deepEqual(after.work, before.work, "work item row must not mutate");
}

function seedDifferentKeyRecording(targetDbPath, fixture) {
  const db = openDb(targetDbPath);
  try {
    const evidenceId = `evidence:different-key:${fixture.key}`;
    db.prepare(
      `
        INSERT INTO verification_evidence_records (
          evidence_id, scope, work_id, evidence_kind, label, status, result_summary,
          source_surface, source_ref, metadata, created_by, created_at
        )
        VALUES (?, ?, ?, 'check_passed', 'different key fixture', 'passed', 'seeded different key fixture', 'smoke', ?, '{}', 'user-core:fixture', '2026-06-01T12:10:00.000Z')
      `,
    ).run(evidenceId, fixture.scope, fixture.work_id, `candidate:${fixture.candidate_id}`);
    db.prepare(
      `
        INSERT INTO ag_work_resume_proof_evidence_recording_links (
          recording_link_id, record_kind, schema, candidate_id, import_id, mapping_id,
          local_target_scope, local_target_work_id, target_record_kind, target_evidence_id,
          target_action_id, idempotency_key, actor, reason, redaction_summary,
          trust_provenance_label, provenance_json, recording_status, failure_reason,
          created_at, updated_at
        )
        VALUES (?, 'ag_work_resume_proof_evidence_recording_link', 'augnes.ag_work_resume_proof_evidence_recording_link.v0_1', ?, ?, ?, ?, ?, 'verification_evidence', ?, NULL, ?, 'user-core:fixture', 'seeded different key fixture', ?, 'foreign_summary_user_core_attested', '{}', 'recorded', NULL, '2026-06-01T12:10:00.000Z', '2026-06-01T12:10:00.000Z')
      `,
    ).run(
      `ag-resume-proof-evidence-recording-link:different-key:${fixture.key}`,
      fixture.candidate_id,
      fixture.import_id,
      fixture.mapping_id,
      fixture.scope,
      fixture.work_id,
      evidenceId,
      `different-key:${fixture.key}`,
      JSON.stringify(safeRedactionSummary()),
    );
  } finally {
    db.close();
  }
}

function seedEvidenceIdConflict(targetDbPath, fixture) {
  const db = openDb(targetDbPath);
  try {
    db.prepare(
      `
        INSERT INTO verification_evidence_records (
          evidence_id, scope, work_id, evidence_kind, label, status, result_summary,
          source_surface, source_ref, metadata, created_by, created_at
        )
        VALUES (?, ?, ?, 'check_passed', 'unique failure fixture', 'passed', 'seeded unique failure fixture', 'smoke', ?, '{}', 'user-core:fixture', '2026-06-01T12:11:00.000Z')
      `,
    ).run(
      expectedEvidenceId(fixture),
      fixture.scope,
      fixture.work_id,
      `candidate:${fixture.candidate_id}`,
    );
  } finally {
    db.close();
  }
}

function deleteWorkItem(targetDbPath, fixture) {
  const db = openDb(targetDbPath);
  try {
    db.prepare("DELETE FROM work_items WHERE scope = ? AND work_id = ?").run(
      fixture.scope,
      fixture.work_id,
    );
  } finally {
    db.close();
  }
}

function assertNoForbiddenRows(targetDbPath) {
  const db = openDb(targetDbPath);
  try {
    assert.equal(countRows(db, "action_records"), 0);
    assert.equal(countRows(db, "sessions"), 0);
    assert.equal(countRows(db, "work_events"), 0);
    for (const table of [
      "publication_drafts",
      "publication_approval_requests",
      "publication_approval_decisions",
      "publication_readiness_checks",
      "delivery_ledger",
    ]) {
      assert.equal(countRows(db, table), 0, `${table} must remain empty`);
    }
  } finally {
    db.close();
  }
}

function protectedCounts(db) {
  return Object.fromEntries(
    [
      "verification_evidence_records",
      "ag_work_resume_proof_evidence_recording_links",
      "action_records",
      "sessions",
      "work_items",
      "work_events",
      "ag_work_resume_imported_contexts",
      "ag_work_resume_confirmed_mappings",
      "ag_work_resume_mapping_proposals",
      "ag_work_resume_proof_evidence_reconciliation_candidates",
      "publication_drafts",
      "publication_approval_requests",
      "publication_approval_decisions",
      "publication_readiness_checks",
      "delivery_ledger",
    ].map((table) => [table, countRows(db, table)]),
  );
}

function protectedCountsForPath(targetDbPath) {
  const db = openDb(targetDbPath);
  try {
    return protectedCounts(db);
  } finally {
    db.close();
  }
}

function rowById(db, table, key, value) {
  return db.prepare(`SELECT * FROM ${table} WHERE ${key} = ?`).get(value) ?? null;
}

function rowByWork(db, scope, workId) {
  return (
    db
      .prepare("SELECT * FROM work_items WHERE scope = ? AND work_id = ?")
      .get(scope, workId) ?? null
  );
}

function countRows(db, table) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
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

function openDb(targetDbPath) {
  const db = new Database(targetDbPath);
  db.pragma("foreign_keys = ON");
  return db;
}

function assertNoUnexpectedChangedFiles() {
  const changedFiles = [
    ...new Set([
      ...gitLinesAllowFailure(["diff", "--name-only", "origin/main...HEAD"]),
      ...gitLines(["diff", "--name-only"]),
      ...gitLines(["diff", "--cached", "--name-only"]),
      ...gitLines(["ls-files", "--others", "--exclude-standard"]),
    ]),
  ];
  const allowedFiles = new Set([
    "app/api/ag-work-resume/proof-evidence-recordings/route.ts",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-route.mjs",
    "package.json",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-route-gate-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-writer-helper.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-writer-helper-gate-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-schema.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-migration-policy.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-schema-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-schema-integration-policy.mjs",
    "scripts/smoke-ag-work-resume-actual-proof-evidence-recording-gate-design.mjs",
    "scripts/smoke-ag-work-resume-review-metadata-closeout.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-session-codex-gates-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-cockpit-panel.mjs",
  ]);
  assert.deepEqual(
    changedFiles.filter((file) => !allowedFiles.has(file)),
    [],
    "recording route PR should be limited to route, package script, and route/smoke guards",
  );
  assert.deepEqual(
    changedFiles.filter(
      (file) =>
        (file.startsWith("app/") &&
          file !== "app/api/ag-work-resume/proof-evidence-recordings/route.ts") ||
        file.startsWith("components/") ||
        file.startsWith("pages/") ||
        file.startsWith("public/") ||
        file.startsWith("migrations/") ||
        file.startsWith("reports/browser/"),
    ),
    [],
    "recording route PR must not add UI/Cockpit/schema/migration/browser files",
  );
  assert.deepEqual(
    changedFiles.filter(
      (file) =>
        file.startsWith("lib/") ||
        file === "lib/db/schema.sql" ||
        file.startsWith("db/"),
    ),
    [],
    "recording route PR must not modify writer/helper/schema files",
  );
}

function jsonRequest(body) {
  return new Request(routeUrl(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function routeUrl() {
  return "http://localhost/api/ag-work-resume/proof-evidence-recordings";
}

function omit(value, keyToOmit) {
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => key !== keyToOmit),
  );
}

function gitLines(args) {
  return execFileSync("git", args, { cwd: rootDir, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function gitLinesAllowFailure(args) {
  try {
    return gitLines(args);
  } catch {
    return [];
  }
}

function hashValue(value) {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 24);
}

function stableStringify(value) {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = canonicalize(value[key]);
        return acc;
      }, {});
  }
  return value;
}
