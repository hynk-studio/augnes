import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const writerPath = path.join(
  rootDir,
  "lib",
  "ag-work-resume-proof-evidence-recording.ts",
);
const helperPath = path.join(
  rootDir,
  "scripts",
  "ag-work-resume-proof-evidence-recording-create.mjs",
);
const smokePath = fileURLToPath(import.meta.url);
const packagePath = path.join(rootDir, "package.json");
const schemaPath = path.join(rootDir, "lib", "db", "schema.sql");
const designPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_WRITER_HELPER_GATE_DESIGN_V0_1.md",
);
const tempDir = mkdtempSync(
  path.join(os.tmpdir(), "augnes-ag-resume-proof-evidence-recording-writer-"),
);
const dbPath = path.join(tempDir, "augnes.db");

process.env.AUGNES_DB_PATH = dbPath;
process.env.OPENAI_API_KEY = "smoke-openai-key-must-not-be-used";

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("AG Resume proof/evidence recording smoke must not call fetch.");
};

try {
  assertFilesExist();
  assertPackageScripts();
  assertSourceGuards();
  resetDb(dbPath);

  const { createAgWorkResumeProofEvidenceRecordingFromCandidate } = await import(
    "../lib/ag-work-resume-proof-evidence-recording.ts"
  );

  const success = createSourceFixture(dbPath, "success");
  const successInput = buildRecordingInput(success);
  const successBefore = sideEffectSnapshot(dbPath, success);
  const successResult = createAgWorkResumeProofEvidenceRecordingFromCandidate(
    successInput,
  );
  assert.equal(successResult.ok, true, JSON.stringify(successResult, null, 2));
  assert.equal(successResult.result, "recorded");
  assert.equal(successResult.created, true);
  assert.equal(successResult.candidate_id, success.candidate_id);
  assert.equal(successResult.target_record_kind, "verification_evidence");
  assert.equal(successResult.idempotency_key, expectedIdempotencyKey(success));
  assert.equal(successResult.authority_boundary.verification_evidence_record_created, true);
  assert.equal(successResult.authority_boundary.bridge_link_created, true);
  assertNoForbiddenAuthority(successResult.authority_boundary);
  assertRecordingRows(dbPath, success, successResult);
  assertSideEffects(dbPath, success, successBefore, {
    evidenceDelta: 1,
    linkDelta: 1,
  });

  const idempotentBefore = sideEffectSnapshot(dbPath, success);
  const idempotentResult = createAgWorkResumeProofEvidenceRecordingFromCandidate(
    successInput,
  );
  assert.equal(idempotentResult.ok, true);
  assert.equal(idempotentResult.result, "idempotent_no_new_write");
  assert.equal(idempotentResult.created, false);
  assert.equal(idempotentResult.evidence_id, successResult.evidence_id);
  assert.equal(idempotentResult.recording_link_id, successResult.recording_link_id);
  assert.equal(idempotentResult.idempotency_key, successResult.idempotency_key);
  assertNoForbiddenAuthority(idempotentResult.authority_boundary);
  assertSideEffects(dbPath, success, idempotentBefore, {
    evidenceDelta: 0,
    linkDelta: 0,
  });

  assertFailureCase({
    dbPath,
    createAgWorkResumeProofEvidenceRecordingFromCandidate,
    fixture: success,
    input: {
      ...successInput,
      reason: "Different reason for same idempotency key should fail closed.",
      user_core_approval: buildApproval(success, {
        reason: "Different reason for same idempotency key should fail closed.",
      }),
    },
    result: "duplicate_conflict",
    label: "same key different payload",
  });

  const differentKey = createSourceFixture(dbPath, "different-key");
  seedDifferentKeyRecording(dbPath, differentKey);
  assertFailureCase({
    dbPath,
    createAgWorkResumeProofEvidenceRecordingFromCandidate,
    fixture: differentKey,
    input: buildRecordingInput(differentKey),
    result: "duplicate_conflict",
    label: "same candidate different key",
  });

  const proposed = createSourceFixture(dbPath, "proposed", { status: "proposed" });
  assertFailureCase({
    dbPath,
    createAgWorkResumeProofEvidenceRecordingFromCandidate,
    fixture: proposed,
    input: buildRecordingInput(proposed),
    result: "invalid_candidate",
    label: "candidate not accepted_for_future_recording",
  });

  const missingApproval = createSourceFixture(dbPath, "missing-approval");
  assertFailureCase({
    dbPath,
    createAgWorkResumeProofEvidenceRecordingFromCandidate,
    fixture: missingApproval,
    input: { ...buildRecordingInput(missingApproval), user_core_approval: null },
    result: "unauthorized_attempt",
    label: "missing approval",
  });

  const staleApproval = createSourceFixture(dbPath, "stale-approval");
  assertFailureCase({
    dbPath,
    createAgWorkResumeProofEvidenceRecordingFromCandidate,
    fixture: staleApproval,
    input: {
      ...buildRecordingInput(staleApproval),
      user_core_approval: {
        ...buildApproval(staleApproval),
        approved_local_target_work_id: "AG-STALE",
      },
    },
    result: "unauthorized_attempt",
    label: "stale approval",
  });

  const crossCheck = createSourceFixture(dbPath, "cross-check");
  assertFailureCase({
    dbPath,
    createAgWorkResumeProofEvidenceRecordingFromCandidate,
    fixture: crossCheck,
    input: { ...buildRecordingInput(crossCheck), import_id: "import:wrong" },
    result: "source_cross_check_failed",
    label: "import_id mismatch",
  });
  assertFailureCase({
    dbPath,
    createAgWorkResumeProofEvidenceRecordingFromCandidate,
    fixture: crossCheck,
    input: { ...buildRecordingInput(crossCheck), mapping_id: "mapping:wrong" },
    result: "source_cross_check_failed",
    label: "mapping_id mismatch",
  });

  const missingSource = createSourceFixture(dbPath, "missing-source");
  deleteWorkItem(dbPath, missingSource);
  assertFailureCase({
    dbPath,
    createAgWorkResumeProofEvidenceRecordingFromCandidate,
    fixture: missingSource,
    input: buildRecordingInput(missingSource),
    result: "missing_source_rows",
    label: "missing local work source row",
  });

  const unsafeRedaction = createSourceFixture(dbPath, "unsafe-redaction");
  assertFailureCase({
    dbPath,
    createAgWorkResumeProofEvidenceRecordingFromCandidate,
    fixture: unsafeRedaction,
    input: {
      ...buildRecordingInput(unsafeRedaction),
      redaction_summary: {
        ...safeRedactionSummary(),
        raw_evidence_payloads_included: true,
      },
      user_core_approval: buildApproval(unsafeRedaction, {
        redaction_summary: {
          ...safeRedactionSummary(),
          raw_evidence_payloads_included: true,
        },
      }),
    },
    result: "unsafe_redaction",
    label: "unsafe redaction",
  });

  const invalidActor = createSourceFixture(dbPath, "invalid-actor");
  assertFailureCase({
    dbPath,
    createAgWorkResumeProofEvidenceRecordingFromCandidate,
    fixture: invalidActor,
    input: {
      ...buildRecordingInput(invalidActor),
      actor: "codex",
      user_core_approval: buildApproval(invalidActor, { actor: "codex" }),
    },
    result: "invalid_actor_reason",
    label: "invalid actor",
  });
  assertFailureCase({
    dbPath,
    createAgWorkResumeProofEvidenceRecordingFromCandidate,
    fixture: invalidActor,
    input: {
      ...buildRecordingInput(invalidActor),
      reason: "",
      user_core_approval: buildApproval(invalidActor, { reason: "" }),
    },
    result: "invalid_actor_reason",
    label: "invalid reason",
  });

  const invalidTrust = createSourceFixture(dbPath, "invalid-trust");
  assertFailureCase({
    dbPath,
    createAgWorkResumeProofEvidenceRecordingFromCandidate,
    fixture: invalidTrust,
    input: {
      ...buildRecordingInput(invalidTrust),
      trust_provenance_label: "raw_foreign_payload",
      user_core_approval: buildApproval(invalidTrust, {
        trust_provenance_label: "raw_foreign_payload",
      }),
    },
    result: "invalid_trust_provenance",
    label: "invalid trust label",
  });

  const uniqueFailure = createSourceFixture(dbPath, "unique-failure");
  seedEvidenceIdConflict(dbPath, uniqueFailure);
  assertFailureCase({
    dbPath,
    createAgWorkResumeProofEvidenceRecordingFromCandidate,
    fixture: uniqueFailure,
    input: buildRecordingInput(uniqueFailure),
    result: "fk_or_unique_failure",
    label: "evidence unique failure rollback",
  });

  const helperEnv = createSourceFixture(dbPath, "helper-env");
  const helperBefore = sideEffectSnapshot(dbPath, helperEnv);
  const helperRun = runHelper({
    dbPath,
    envInput: buildRecordingInput(helperEnv),
  });
  assert.equal(helperRun.status, 0);
  assert.equal(helperRun.json.ok, true);
  assert.equal(helperRun.json.helper, "ag_work_resume_proof_evidence_recording_create.v0_1");
  assert.equal(helperRun.json.input_mode, "env");
  assert.equal(helperRun.json.result.result, "recorded");
  assertSideEffects(dbPath, helperEnv, helperBefore, {
    evidenceDelta: 1,
    linkDelta: 1,
  });

  const helperFlags = createSourceFixture(dbPath, "helper-flags");
  const helperFlagsBefore = sideEffectSnapshot(dbPath, helperFlags);
  const helperFlagsRun = runHelper({
    dbPath,
    flagsInput: buildRecordingInput(helperFlags),
  });
  assert.equal(helperFlagsRun.status, 0);
  assert.equal(helperFlagsRun.json.ok, true);
  assert.equal(helperFlagsRun.json.input_mode, "flags");
  assertSideEffects(dbPath, helperFlags, helperFlagsBefore, {
    evidenceDelta: 1,
    linkDelta: 1,
  });

  assertNoForbiddenRows(dbPath);
  assert.equal(fetchCalls, 0, "recording writer/helper smoke must not call fetch/network");

  console.log(
    JSON.stringify(
      {
        smoke: "ag-work-resume-proof-evidence-recording-writer-helper",
        temp_db_path: dbPath,
        cases: [
          "package scripts are present",
          "writer/helper source guards pass",
          "successful exact approved recording creates exactly one evidence row and one bridge row",
          "same key/same payload returns idempotent_no_new_write",
          "same key/different payload fails closed",
          "same candidate/different key fails closed",
          "candidate not accepted_for_future_recording fails closed",
          "missing approval fails closed",
          "stale/mismatched approval fails closed",
          "import_id and mapping_id cross-check mismatch fails closed",
          "missing source rows fail closed",
          "unsafe redaction fails closed",
          "invalid actor/reason fails closed",
          "invalid trust label fails closed",
          "FK/unique failures roll back",
          "helper env and flags modes succeed",
          "no action_records rows are created",
          "no sessions are bound",
          "no work_items/work_events are created",
          "imported context rows are not mutated",
          "confirmed mapping rows are not mutated",
          "proposal rows are not mutated",
          "reconciliation candidate rows are not mutated",
          "no route/UI files are added",
          "no approval/publish/retry/replay/merge authority is added",
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
  for (const file of [writerPath, helperPath, smokePath, packagePath, schemaPath, designPath]) {
    assert.ok(existsSync(file), `${file} must exist`);
  }
}

function assertPackageScripts() {
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  assert.equal(
    packageJson.scripts?.["ag:resume-proof-evidence-recording-create"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/ag-work-resume-proof-evidence-recording-create.mjs",
    "package.json must expose the recording create helper",
  );
  assert.equal(
    packageJson.scripts?.[
      "smoke:ag-work-resume-proof-evidence-recording-writer-helper"
    ],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-proof-evidence-recording-writer-helper.mjs",
    "package.json must expose the recording writer/helper smoke",
  );
}

function assertSourceGuards() {
  const writerSource = readFileSync(writerPath, "utf8");
  const helperSource = readFileSync(helperPath, "utf8");

  assert.match(
    writerSource,
    /export function createAgWorkResumeProofEvidenceRecordingFromCandidate/,
    "writer core export must exist",
  );
  assert.match(
    writerSource,
    /INSERT INTO verification_evidence_records/,
    "writer must insert one verification evidence row",
  );
  assert.match(
    writerSource,
    /INSERT INTO ag_work_resume_proof_evidence_recording_links/,
    "writer must insert one recording bridge row",
  );
  assert.match(
    writerSource,
    /db\.transaction/,
    "writer must use a local database transaction",
  );
  assert.match(
    writerSource,
    /idempotent_no_new_write/,
    "writer must implement idempotent no-new-write behavior",
  );
  assert.doesNotMatch(
    writerSource,
    /INSERT INTO\s+(?!verification_evidence_records|ag_work_resume_proof_evidence_recording_links)/i,
    "writer must only insert into the two allowed tables",
  );
  assert.doesNotMatch(
    writerSource,
    /\b(UPDATE|DELETE|DROP|ALTER\s+TABLE|CREATE\s+TABLE)\s+/i,
    "writer must not update/delete/source rows or mutate schema",
  );
  assert.doesNotMatch(
    writerSource,
    /INSERT INTO action_records|INSERT INTO work_items|INSERT INTO work_events|INSERT INTO sessions/i,
    "writer must not insert protected tables",
  );
  assert.match(
    helperSource,
    /createAgWorkResumeProofEvidenceRecordingFromCandidate/,
    "helper script must call recording writer core",
  );
  assert.doesNotMatch(helperSource, /fetch\s*\(/i, "helper must not call fetch");
  assert.doesNotMatch(
    `${writerSource}\n${helperSource}`,
    /\/api\/|@octokit|openai|record-proof|sessions\/bind|autoMerge\s*\(|auto_merge\s*\(/i,
    "writer/helper must not call routes, GitHub/OpenAI, proof, session, or merge helpers",
  );
  assertNoUnexpectedChangedFiles();
}

function createSourceFixture(dbPath, key, options = {}) {
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
  const db = openDb(dbPath);
  try {
    db.prepare(
      `
        INSERT INTO work_items (scope, work_id, title, status, priority, summary, next_action, related_state_keys, links, created_at, updated_at)
        VALUES (?, ?, ?, 'active', 'normal', ?, '', '[]', '{}', ?, ?)
      `,
    ).run(scope, workId, `Recording fixture ${key}`, `Fixture work ${key}`, now, now);
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

function buildRecordingInput(fixture, overrides = {}) {
  const redactionSummary = overrides.redaction_summary ?? safeRedactionSummary();
  const actor = overrides.actor ?? "user-core:recording-smoke";
  const reason =
    overrides.reason ??
    `User/Core approved fixture ${fixture.key} for actual evidence recording.`;
  return {
    candidate_id: fixture.candidate_id,
    import_id: fixture.import_id,
    mapping_id: fixture.mapping_id,
    user_core_approval: overrides.user_core_approval ?? buildApproval(fixture, {
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
    now: "2026-06-01T12:30:00.000Z",
  };
}

function buildApproval(fixture, overrides = {}) {
  const actor = overrides.actor ?? "user-core:recording-smoke";
  const reason =
    overrides.reason ??
    `User/Core approved fixture ${fixture.key} for actual evidence recording.`;
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

function assertRecordingRows(dbPath, fixture, result) {
  const db = openDb(dbPath);
  try {
    const evidence = db
      .prepare("SELECT * FROM verification_evidence_records WHERE evidence_id = ?")
      .get(result.evidence_id);
    const link = db
      .prepare(
        "SELECT * FROM ag_work_resume_proof_evidence_recording_links WHERE recording_link_id = ?",
      )
      .get(result.recording_link_id);
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

function assertFailureCase({
  dbPath,
  createAgWorkResumeProofEvidenceRecordingFromCandidate,
  fixture,
  input,
  result,
  label,
}) {
  const before = sideEffectSnapshot(dbPath, fixture);
  const output = createAgWorkResumeProofEvidenceRecordingFromCandidate(input);
  assert.equal(output.ok, false, `${label} should fail`);
  assert.equal(output.result, result, `${label} should return ${result}`);
  assert.equal(output.created, false, `${label} should not create rows`);
  assert.equal(output.evidence_id, null, `${label} should not fabricate evidence id`);
  assert.equal(
    output.recording_link_id,
    null,
    `${label} should not fabricate bridge id`,
  );
  assertNoForbiddenAuthority(output.authority_boundary);
  assertSideEffects(dbPath, fixture, before, { evidenceDelta: 0, linkDelta: 0 });
}

function assertNoForbiddenAuthority(boundary) {
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

function sideEffectSnapshot(dbPath, fixture) {
  const db = openDb(dbPath);
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

function assertSideEffects(dbPath, fixture, before, { evidenceDelta, linkDelta }) {
  const after = sideEffectSnapshot(dbPath, fixture);
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

function seedDifferentKeyRecording(dbPath, fixture) {
  const db = openDb(dbPath);
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

function seedEvidenceIdConflict(dbPath, fixture) {
  const db = openDb(dbPath);
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

function deleteWorkItem(dbPath, fixture) {
  const db = openDb(dbPath);
  try {
    db.prepare("DELETE FROM work_items WHERE scope = ? AND work_id = ?").run(
      fixture.scope,
      fixture.work_id,
    );
  } finally {
    db.close();
  }
}

function runHelper({ dbPath, envInput, flagsInput }) {
  const env = {
    ...process.env,
    AUGNES_DB_PATH: dbPath,
    OPENAI_API_KEY: "smoke-openai-key-must-not-be-used",
  };
  const args = [
    "run",
    "--silent",
    "ag:resume-proof-evidence-recording-create",
    "--",
    "--json",
  ];
  if (envInput) {
    env.AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_CREATE_INPUT =
      JSON.stringify(envInput);
  }
  if (flagsInput) {
    args.push(
      "--candidate-id",
      flagsInput.candidate_id,
      "--import-id",
      flagsInput.import_id,
      "--mapping-id",
      flagsInput.mapping_id,
      "--user-core-approval-json",
      JSON.stringify(flagsInput.user_core_approval),
      "--actor",
      flagsInput.actor,
      "--reason",
      flagsInput.reason,
      "--redaction-summary-json",
      JSON.stringify(flagsInput.redaction_summary),
      "--trust-provenance-label",
      flagsInput.trust_provenance_label,
      "--local-target-scope",
      flagsInput.local_target_scope,
      "--local-target-work-id",
      flagsInput.local_target_work_id,
      "--expected-idempotency-key",
      flagsInput.expected_idempotency_key,
      "--now",
      flagsInput.now,
    );
  }
  const result = spawnSync("npm", args, {
    cwd: rootDir,
    env,
    encoding: "utf8",
  });
  return {
    ...result,
    json: parseJsonOutput(result.stdout),
  };
}

function parseJsonOutput(output) {
  const start = output.indexOf("{");
  assert.notEqual(start, -1, `expected JSON output, got: ${output}`);
  return JSON.parse(output.slice(start));
}

function assertNoForbiddenRows(dbPath) {
  const db = openDb(dbPath);
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
  const result = spawnSync("npm", ["run", "db:reset"], {
    cwd: rootDir,
    env: {
      ...process.env,
      AUGNES_DB_PATH: targetDbPath,
    },
    encoding: "utf8",
  });
  assert.equal(
    result.status,
    0,
    `db:reset failed\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
  );
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
    "lib/ag-work-resume-proof-evidence-recording.ts",
    "scripts/ag-work-resume-proof-evidence-recording-create.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-writer-helper.mjs",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_ROUTE_GATE_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_WRITER_HELPER_GATE_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_SCHEMA_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_MIGRATION_POLICY_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_SCHEMA_INTEGRATION_POLICY_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_COCKPIT_GATE_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_ACTUAL_PROOF_EVIDENCE_RECORDING_GATE_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_CROSS_LOCAL_CONTINUITY_REVIEW_METADATA_CLOSEOUT_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_GATE_CLOSEOUT_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTIONS_V0_1.md",
    "components/augnes-cockpit.tsx",
    "reports/browser/2026-06-02-ag-work-resume-proof-evidence-recording-cockpit-verification.md",
    "package.json",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-route-gate-design.mjs",
    "app/api/ag-work-resume/proof-evidence-recordings/route.ts",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-route.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-writer-helper-gate-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-schema.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-migration-policy.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-schema-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-schema-integration-policy.mjs",
    "scripts/smoke-ag-work-resume-actual-proof-evidence-recording-gate-design.mjs",
    "scripts/smoke-ag-work-resume-review-metadata-closeout.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-gate-closeout.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-session-codex-gates-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-cockpit-gate-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-cockpit-panel.mjs",
  ]);
  assert.deepEqual(
    changedFiles.filter((file) => !allowedFiles.has(file)),
    [],
    "recording writer/helper PR should be limited to helper, script, package, and smoke guards",
  );
  assert.deepEqual(
    changedFiles.filter(
      (file) =>
        (file.startsWith("app/") &&
          file !== "app/api/ag-work-resume/proof-evidence-recordings/route.ts") ||
        (file.startsWith("components/") &&
          file !== "components/augnes-cockpit.tsx") ||
        file.startsWith("pages/") ||
        file.startsWith("public/") ||
        file.startsWith("migrations/") ||
        (file.startsWith("reports/browser/") &&
          file !==
            "reports/browser/2026-06-02-ag-work-resume-proof-evidence-recording-cockpit-verification.md"),
    ),
    [],
    "recording writer/helper compatibility must not add route or unscoped UI/Cockpit/browser files",
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
