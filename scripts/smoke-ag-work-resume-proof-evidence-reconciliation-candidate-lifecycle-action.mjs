import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const corePath = path.join(
  rootDir,
  "lib",
  "ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.ts",
);
const helperPath = path.join(
  rootDir,
  "scripts",
  "ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.mjs",
);
const smokePath = fileURLToPath(import.meta.url);
const docsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTIONS_V0_1.md",
);
const packagePath = path.join(rootDir, "package.json");
const tableName = "ag_work_resume_proof_evidence_reconciliation_candidates";
const tempDir = mkdtempSync(
  path.join(os.tmpdir(), "augnes-ag-resume-reconciliation-candidate-lifecycle-"),
);
const dbPath = path.join(tempDir, "augnes.db");

process.env.AUGNES_DB_PATH = dbPath;
process.env.OPENAI_API_KEY = "smoke-openai-key-must-not-be-used";

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error(
    "AG resume reconciliation candidate lifecycle smoke must not call fetch.",
  );
};

try {
  assert.equal(
    isPathInside(path.dirname(dbPath), rootDir),
    false,
    "smoke DB must be outside the repo",
  );
  assertFilesExist();
  assertPackageScripts();
  assertSourceGuards();
  assertDocsGuard();
  resetDb(dbPath);

  const {
    applyAgWorkResumeProofEvidenceReconciliationCandidateLifecycleAction,
  } = await import(
    "../lib/ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.ts"
  );

  const protectedBefore = snapshotProtectedCounts(dbPath);
  let expectedCandidateRows = 0;

  insertCandidate(dbPath, { candidate_id: "candidate:accept", status: "proposed" });
  expectedCandidateRows += 1;
  assertSuccessfulLifecycle({
    run: () =>
      applyAgWorkResumeProofEvidenceReconciliationCandidateLifecycleAction({
        candidate_id: "candidate:accept",
        action: "accept_for_future_recording",
        reviewed_by: "user-core:reviewer",
        review_note: "Accept for future recording review metadata only.",
        reviewed_at: "2026-06-01T07:00:00.000Z",
      }),
    candidateId: "candidate:accept",
    action: "accept_for_future_recording",
    status: "accepted_for_future_recording",
    reviewedAt: "2026-06-01T07:00:00.000Z",
  });

  insertCandidate(dbPath, { candidate_id: "candidate:reject", status: "proposed" });
  expectedCandidateRows += 1;
  assertSuccessfulLifecycle({
    run: () =>
      applyAgWorkResumeProofEvidenceReconciliationCandidateLifecycleAction({
        candidate_id: "candidate:reject",
        action: "reject",
        reviewed_by: "user-core:reviewer",
        review_note: "Reject candidate review metadata.",
        now: "2026-06-01T07:01:00.000Z",
      }),
    candidateId: "candidate:reject",
    action: "reject",
    status: "rejected",
    reviewedAt: "2026-06-01T07:01:00.000Z",
  });

  insertCandidate(dbPath, { candidate_id: "candidate:defer", status: "proposed" });
  expectedCandidateRows += 1;
  assertSuccessfulLifecycle({
    run: () =>
      applyAgWorkResumeProofEvidenceReconciliationCandidateLifecycleAction({
        candidate_id: "candidate:defer",
        action: "defer",
        reviewed_by: "user-core:reviewer",
        review_note: "Defer candidate review metadata.",
        reviewed_at: "2026-06-01T07:02:00.000Z",
      }),
    candidateId: "candidate:defer",
    action: "defer",
    status: "deferred",
    reviewedAt: "2026-06-01T07:02:00.000Z",
  });

  insertCandidate(dbPath, { candidate_id: "candidate:withdraw", status: "proposed" });
  expectedCandidateRows += 1;
  assertSuccessfulLifecycle({
    run: () =>
      applyAgWorkResumeProofEvidenceReconciliationCandidateLifecycleAction({
        candidate_id: "candidate:withdraw",
        action: "withdraw",
        reviewed_by: "user-core:reviewer",
        review_note: "Withdraw candidate review metadata.",
        reviewed_at: "2026-06-01T07:03:00.000Z",
      }),
    candidateId: "candidate:withdraw",
    action: "withdraw",
    status: "withdrawn",
    reviewedAt: "2026-06-01T07:03:00.000Z",
  });

  insertCandidate(dbPath, {
    candidate_id: "candidate:revoke",
    status: "accepted_for_future_recording",
  });
  expectedCandidateRows += 1;
  assertSuccessfulLifecycle({
    run: () =>
      applyAgWorkResumeProofEvidenceReconciliationCandidateLifecycleAction({
        candidate_id: "candidate:revoke",
        action: "revoke",
        reviewed_by: "user-core:reviewer",
        review_note: "Revoke prior candidate lifecycle decision.",
        reviewed_at: "2026-06-01T07:04:00.000Z",
      }),
    candidateId: "candidate:revoke",
    action: "revoke",
    status: "revoked",
    reviewedAt: "2026-06-01T07:04:00.000Z",
  });

  insertCandidate(dbPath, { candidate_id: "candidate:supersede", status: "proposed" });
  insertCandidate(dbPath, {
    candidate_id: "candidate:replacement",
    status: "proposed",
    created_at: "2026-06-01T06:59:00.000Z",
  });
  expectedCandidateRows += 2;
  const replacementBefore = readCandidateRow(dbPath, "candidate:replacement");
  assertSuccessfulLifecycle({
    run: () =>
      applyAgWorkResumeProofEvidenceReconciliationCandidateLifecycleAction({
        candidate_id: "candidate:supersede",
        action: "supersede",
        reviewed_by: "user-core:reviewer",
        review_note: "Supersede with an existing replacement candidate id.",
        reviewed_at: "2026-06-01T07:05:00.000Z",
        replacement_candidate_id: "candidate:replacement",
        superseded_by_candidate_id: " candidate:replacement ",
      }),
    candidateId: "candidate:supersede",
    action: "supersede",
    status: "superseded",
    reviewedAt: "2026-06-01T07:05:00.000Z",
    supersededByCandidateId: "candidate:replacement",
    updatesSupersededByCandidateId: true,
  });
  assert.deepEqual(
    readCandidateRow(dbPath, "candidate:replacement"),
    replacementBefore,
    "replacement candidate row must not be updated",
  );
  assertSuccessfulLifecycle({
    run: () =>
      applyAgWorkResumeProofEvidenceReconciliationCandidateLifecycleAction({
        candidate_id: "candidate:supersede",
        action: "revoke",
        reviewed_by: "user-core:reviewer",
        review_note:
          "Revoke a superseded candidate while preserving replacement audit metadata.",
        reviewed_at: "2026-06-01T07:05:30.000Z",
      }),
    candidateId: "candidate:supersede",
    action: "revoke",
    status: "revoked",
    reviewedAt: "2026-06-01T07:05:30.000Z",
    supersededByCandidateId: "candidate:replacement",
    updatesSupersededByCandidateId: false,
  });
  assert.deepEqual(
    readCandidateRow(dbPath, "candidate:replacement"),
    replacementBefore,
    "revoking a superseded candidate must not update the replacement row",
  );

  insertCandidate(dbPath, { candidate_id: "candidate:deferred-accept", status: "deferred" });
  expectedCandidateRows += 1;
  assertSuccessfulLifecycle({
    run: () =>
      applyAgWorkResumeProofEvidenceReconciliationCandidateLifecycleAction({
        candidate_id: "candidate:deferred-accept",
        action: "accept_for_future_recording",
        reviewed_by: "user-core:reviewer",
        review_note: "Accept deferred candidate metadata.",
        reviewed_at: "2026-06-01T07:06:00.000Z",
      }),
    candidateId: "candidate:deferred-accept",
    action: "accept_for_future_recording",
    status: "accepted_for_future_recording",
    reviewedAt: "2026-06-01T07:06:00.000Z",
  });

  assert.equal(countRows(dbPath, tableName), expectedCandidateRows);
  assert.deepEqual(
    snapshotProtectedCounts(dbPath),
    protectedBefore,
    "protected table counts must remain unchanged after success cases",
  );

  const helperEnvId = "candidate:helper-env";
  insertCandidate(dbPath, { candidate_id: helperEnvId, status: "proposed" });
  expectedCandidateRows += 1;
  const helperEnv = runHelper({
    dbPath,
    envInput: {
      candidate_id: helperEnvId,
      action: "reject",
      reviewed_by: "user-core:helper",
      review_note: "Helper env lifecycle review metadata.",
      reviewed_at: "2026-06-01T07:10:00.000Z",
    },
  });
  assert.equal(helperEnv.status, 0);
  assert.equal(helperEnv.json.ok, true);
  assert.equal(helperEnv.json.input_mode, "env");

  const helperFileId = "candidate:helper-file";
  insertCandidate(dbPath, { candidate_id: helperFileId, status: "proposed" });
  expectedCandidateRows += 1;
  const inputFile = path.join(tempDir, "candidate-lifecycle-helper-file.json");
  writeFileSync(
    inputFile,
    JSON.stringify({
      candidate_id: helperFileId,
      action: "withdraw",
      reviewed_by: "user-core:helper",
      review_note: "Helper file lifecycle review metadata.",
      reviewed_at: "2026-06-01T07:11:00.000Z",
    }),
  );
  const helperFile = runHelper({ dbPath, filePath: inputFile });
  assert.equal(helperFile.status, 0);
  assert.equal(helperFile.json.input_mode, "file");

  const helperFlagsId = "candidate:helper-flags";
  insertCandidate(dbPath, { candidate_id: helperFlagsId, status: "proposed" });
  expectedCandidateRows += 1;
  const helperFlags = runHelper({
    dbPath,
    flags: {
      candidate_id: helperFlagsId,
      action: "defer",
      reviewed_by: "user-core:helper",
      review_note: "Helper flags lifecycle review metadata.",
      reviewed_at: "2026-06-01T07:12:00.000Z",
    },
  });
  assert.equal(helperFlags.status, 0);
  assert.equal(helperFlags.json.input_mode, "flags");

  const helperStdinId = "candidate:helper-stdin";
  insertCandidate(dbPath, { candidate_id: helperStdinId, status: "proposed" });
  expectedCandidateRows += 1;
  const helperStdin = runHelper({
    dbPath,
    stdinInput: {
      candidate_id: helperStdinId,
      action: "accept_for_future_recording",
      reviewed_by: "user-core:helper",
      review_note: "Helper stdin lifecycle review metadata.",
      reviewed_at: "2026-06-01T07:13:00.000Z",
    },
  });
  assert.equal(helperStdin.status, 0);
  assert.equal(helperStdin.json.input_mode, "stdin");

  const helperInvalid = runHelper({
    dbPath,
    stdinInput: { candidate_id: "candidate:missing", action: "reject" },
  });
  assert.notEqual(helperInvalid.status, 0);
  assert.equal(helperInvalid.json.ok, false);

  const validationId = "candidate:validation";
  insertCandidate(dbPath, { candidate_id: validationId, status: "proposed" });
  expectedCandidateRows += 1;
  const validationBefore = readCandidateRow(dbPath, validationId);
  for (const invalidCase of [
    {
      name: "missing candidate_id",
      input: {
        action: "reject",
        reviewed_by: "user-core",
        review_note: "Missing candidate_id.",
      },
      status: "invalid_input",
    },
    {
      name: "unknown action",
      input: {
        candidate_id: validationId,
        action: "confirm",
        reviewed_by: "user-core",
        review_note: "Unknown action.",
      },
      status: "invalid_input",
    },
    {
      name: "missing reviewed_by",
      input: {
        candidate_id: validationId,
        action: "reject",
        review_note: "Missing reviewed_by.",
      },
      status: "invalid_input",
    },
    {
      name: "missing review_note",
      input: {
        candidate_id: validationId,
        action: "reject",
        reviewed_by: "user-core",
      },
      status: "invalid_input",
    },
    {
      name: "malformed reviewed_at",
      input: {
        candidate_id: validationId,
        action: "reject",
        reviewed_by: "user-core",
        review_note: "Malformed reviewed_at.",
        reviewed_at: "2026-06-01T07:20:00Z",
      },
      status: "invalid_input",
    },
    {
      name: "malformed now",
      input: {
        candidate_id: validationId,
        action: "reject",
        reviewed_by: "user-core",
        review_note: "Malformed now.",
        now: "not-a-date",
      },
      status: "invalid_input",
    },
    {
      name: "replacement for non-supersede",
      input: {
        candidate_id: validationId,
        action: "reject",
        reviewed_by: "user-core",
        review_note: "Replacement only applies to supersede.",
        replacement_candidate_id: "candidate:replacement",
      },
      status: "invalid_input",
    },
    {
      name: "mismatched replacement fields",
      input: {
        candidate_id: validationId,
        action: "supersede",
        reviewed_by: "user-core",
        review_note: "Mismatched replacement fields.",
        replacement_candidate_id: "candidate:replacement",
        superseded_by_candidate_id: "candidate:other",
      },
      status: "invalid_input",
    },
    {
      name: "self replacement",
      input: {
        candidate_id: validationId,
        action: "supersede",
        reviewed_by: "user-core",
        review_note: "Self replacement.",
        replacement_candidate_id: validationId,
      },
      status: "invalid_input",
    },
    {
      name: "unknown field",
      input: {
        candidate_id: validationId,
        action: "reject",
        reviewed_by: "user-core",
        review_note: "Unknown field.",
        proof_id: "blocked",
      },
      status: "invalid_input",
    },
  ]) {
    assertFailureNoWrite({
      name: invalidCase.name,
      run: () =>
        applyAgWorkResumeProofEvidenceReconciliationCandidateLifecycleAction(
          invalidCase.input,
        ),
      expectedStatus: invalidCase.status,
      candidateId: validationId,
      expectedRow: validationBefore,
      expectedCandidateRows,
      protectedBefore,
    });
  }

  assertFailureNoWrite({
    name: "missing candidate",
    run: () =>
      applyAgWorkResumeProofEvidenceReconciliationCandidateLifecycleAction({
        candidate_id: "candidate:missing",
        action: "reject",
        reviewed_by: "user-core",
        review_note: "Missing candidate.",
        reviewed_at: "2026-06-01T07:21:00.000Z",
      }),
    expectedStatus: "not_found",
    candidateId: validationId,
    expectedRow: validationBefore,
    expectedCandidateRows,
    protectedBefore,
  });

  assertFailureNoWrite({
    name: "invalid transition",
    run: () =>
      applyAgWorkResumeProofEvidenceReconciliationCandidateLifecycleAction({
        candidate_id: helperEnvId,
        action: "accept_for_future_recording",
        reviewed_by: "user-core",
        review_note: "Reject cannot later accept without a separate design.",
        reviewed_at: "2026-06-01T07:22:00.000Z",
      }),
    expectedStatus: "invalid_transition",
    candidateId: helperEnvId,
    expectedRow: readCandidateRow(dbPath, helperEnvId),
    expectedCandidateRows,
    protectedBefore,
  });

  insertCandidate(dbPath, {
    candidate_id: "candidate:missing-replacement-target",
    status: "proposed",
  });
  expectedCandidateRows += 1;
  const missingReplacementBefore = readCandidateRow(
    dbPath,
    "candidate:missing-replacement-target",
  );
  assertFailureNoWrite({
    name: "replacement missing",
    run: () =>
      applyAgWorkResumeProofEvidenceReconciliationCandidateLifecycleAction({
        candidate_id: "candidate:missing-replacement-target",
        action: "supersede",
        reviewed_by: "user-core",
        review_note: "Missing replacement candidate.",
        reviewed_at: "2026-06-01T07:23:00.000Z",
        replacement_candidate_id: "candidate:nope",
      }),
    expectedStatus: "replacement_not_found",
    candidateId: "candidate:missing-replacement-target",
    expectedRow: missingReplacementBefore,
    expectedCandidateRows,
    protectedBefore,
  });

  assert.equal(countRows(dbPath, tableName), expectedCandidateRows);
  assert.deepEqual(snapshotProtectedCounts(dbPath), protectedBefore);
  assert.equal(fetchCalls, 0, "candidate lifecycle smoke must not call fetch/network");

  console.log(
    JSON.stringify(
      {
        smoke:
          "ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action",
        temp_db_path: dbPath,
        cases: [
          "package scripts are present",
          "core/helper/docs source guards pass",
          "accept_for_future_recording, reject, defer, withdraw, revoke, and supersede succeed",
          "accepted_for_future_recording is review metadata only",
          "supersede may link an existing replacement candidate without updating it",
          "revoke from superseded preserves superseded_by_candidate_id audit metadata",
          "deferred candidate can later accept",
          "helper env/file/flags/stdin succeeds",
          "helper invalid input exits non-zero",
          "required fields and malformed timestamps fail closed",
          "unsupported fields and replacement misuse fail closed",
          "missing candidate fails closed",
          "invalid transition and missing replacement fail closed",
          "only candidate lifecycle/review metadata fields change",
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
  for (const file of [corePath, helperPath, smokePath, docsPath, packagePath]) {
    assert.ok(existsSync(file), `${file} must exist`);
  }
}

function assertPackageScripts() {
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  assert.equal(
    packageJson.scripts?.[
      "ag:resume-proof-evidence-reconciliation-candidate-lifecycle-action"
    ],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.mjs",
    "package.json must expose candidate lifecycle helper",
  );
  assert.equal(
    packageJson.scripts?.[
      "smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action"
    ],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.mjs",
    "package.json must expose candidate lifecycle smoke",
  );
}

function assertSourceGuards() {
  const coreSource = readFileSync(corePath, "utf8");
  const helperSource = readFileSync(helperPath, "utf8");
  assert.match(
    coreSource,
    /export function applyAgWorkResumeProofEvidenceReconciliationCandidateLifecycleAction/,
    "core export must exist",
  );
  assert.match(
    coreSource,
    /UPDATE ag_work_resume_proof_evidence_reconciliation_candidates/,
    "core must update candidate table",
  );
  assert.match(
    coreSource,
    /accepted_for_future_recording/,
    "core must define accepted_for_future_recording",
  );
  assert.doesNotMatch(
    coreSource,
    /INSERT INTO|DELETE FROM|DROP|ALTER\s+TABLE|CREATE\s+TABLE/i,
    "core must not create or delete rows or mutate schema",
  );
  assert.doesNotMatch(coreSource, /fetch\s*\(/i, "core must not call fetch");
  assert.doesNotMatch(helperSource, /fetch\s*\(/i, "helper must not call fetch");
  assert.doesNotMatch(
    `${coreSource}\n${helperSource}`,
    /record-proof|record-evidence|sessions\/bind|work_events|commitStateUpdate/i,
    "core/helper must not call forbidden authority helpers",
  );
  assertNoUnexpectedChangedFiles();
}

function assertDocsGuard() {
  const docs = readFileSync(docsPath, "utf8");
  for (const token of [
    "Lifecycle actions update existing reconciliation candidate review metadata only",
    "accepted_for_future_recording is not proof/evidence recording",
    "Allowed Transitions",
    "invalid_transition",
    "replacement_not_found",
    "Imported-context inactive or mismatch checks are not reapplied",
    "Revoking a superseded candidate intentionally preserves",
    "Updated fields",
    "POST /api/ag-work-resume/proof-evidence-reconciliation-candidates/lifecycle-actions",
    "No proof/evidence recording",
    "No session binding",
    "No Codex execution or continuation",
    "No work item creation",
    "No work event creation",
    "No imported context mutation",
    "No confirmed mapping mutation",
    "No proposal mutation",
    "No approval, publish, retry, replay, merge",
  ]) {
    assert.match(docs, new RegExp(escapeRegExp(token)));
  }
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
    import_id: overrides.import_id ?? `import:${overrides.candidate_id}`,
    mapping_id: overrides.mapping_id ?? `mapping:${overrides.candidate_id}`,
    foreign_ref_type: overrides.foreign_ref_type ?? "proof",
    foreign_ref_id: overrides.foreign_ref_id ?? `proof:${overrides.candidate_id}`,
    local_target_scope: overrides.local_target_scope ?? "project:augnes",
    local_target_work_id:
      overrides.local_target_work_id ?? `AG-${String(overrides.candidate_id).toUpperCase()}`,
    summary:
      overrides.summary ??
      `Synthetic reconciliation candidate ${overrides.candidate_id}.`,
    redaction_status:
      overrides.redaction_status ??
      JSON.stringify({
        safe: true,
        secrets_included: false,
        raw_db_paths_included: false,
        session_payloads_included: false,
        proof_payloads_included: false,
      }),
    proposed_by: overrides.proposed_by ?? "user-core:smoke",
    proposed_reason:
      overrides.proposed_reason ?? "Synthetic candidate lifecycle smoke fixture.",
    reviewed_by: overrides.reviewed_by ?? null,
    reviewed_at: overrides.reviewed_at ?? null,
    review_note: overrides.review_note ?? null,
    supersedes_candidate_id: overrides.supersedes_candidate_id ?? null,
    superseded_by_candidate_id: overrides.superseded_by_candidate_id ?? null,
    authority_boundary:
      overrides.authority_boundary ??
      JSON.stringify({
        review_metadata_only: true,
        proof_recorded: false,
        evidence_recorded: false,
      }),
    created_at: overrides.created_at ?? "2026-06-01T06:00:00.000Z",
    updated_at: overrides.updated_at ?? "2026-06-01T06:00:00.000Z",
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

function assertSuccessfulLifecycle({
  run,
  candidateId,
  action,
  status,
  reviewedAt,
  supersededByCandidateId = null,
  updatesSupersededByCandidateId = false,
}) {
  const result = run();
  assert.equal(result.ok, true);
  assert.equal(result.status, "updated");
  assert.equal(result.action, action);
  assert.equal(result.candidate_id, candidateId);
  assert.equal(result.record.status, status);
  assert.equal(result.record.reviewed_at, reviewedAt);
  assert.equal(result.record.updated_at, reviewedAt);
  assert.equal(
    result.record.superseded_by_candidate_id,
    supersededByCandidateId,
  );
  assert.deepEqual(
    result.updated_fields,
    updatesSupersededByCandidateId
      ? [
          "status",
          "reviewed_by",
          "reviewed_at",
          "review_note",
          "updated_at",
          "superseded_by_candidate_id",
        ]
      : ["status", "reviewed_by", "reviewed_at", "review_note", "updated_at"],
  );
  assertCandidateAuthorityBoundary(result.authority_boundary, true);
  assert.equal(result.authority_boundary.proof_recorded, false);
  assert.equal(result.authority_boundary.evidence_recorded, false);
  return result;
}

function assertFailureNoWrite({
  name,
  run,
  expectedStatus,
  candidateId,
  expectedRow,
  expectedCandidateRows,
  protectedBefore,
}) {
  const result = run();
  assert.equal(result.ok, false, name);
  assert.equal(result.status, expectedStatus, name);
  assert.deepEqual(readCandidateRow(dbPath, candidateId), expectedRow, name);
  assert.equal(countRows(dbPath, tableName), expectedCandidateRows, name);
  assert.deepEqual(snapshotProtectedCounts(dbPath), protectedBefore, name);
  assertCandidateAuthorityBoundary(result.authority_boundary, false);
}

function assertCandidateAuthorityBoundary(authorityBoundary, updated) {
  assert.equal(authorityBoundary.reconciliation_candidate_lifecycle_updated, updated);
  assert.equal(authorityBoundary.reconciliation_candidate_updated, updated);
  assert.equal(authorityBoundary.review_metadata_only, true);
  assert.equal(authorityBoundary.reconciliation_candidate_created, false);
  assert.equal(authorityBoundary.reconciliation_candidate_deleted, false);
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

function runHelper({ dbPath: helperDbPath, envInput, filePath, flags, stdinInput }) {
  const args = ["--tsconfig", "tsconfig.json", helperPath, "--json"];
  if (filePath) args.push("--file", filePath);
  if (flags) {
    for (const [key, value] of Object.entries(flags)) {
      args.push(`--${key.replaceAll("_", "-")}`, String(value));
    }
  }
  const env = {
    ...process.env,
    AUGNES_DB_PATH: helperDbPath,
    OPENAI_API_KEY: "smoke-openai-key-must-not-be-used",
  };
  if (envInput) {
    env.AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTION_INPUT =
      JSON.stringify(envInput);
  }
  const result = spawnSync(
    path.join(rootDir, "apps", "augnes_apps", "node_modules", ".bin", "tsx"),
    args,
    {
      cwd: rootDir,
      env,
      input: stdinInput ? JSON.stringify(stdinInput) : undefined,
      encoding: "utf8",
    },
  );
  let json;
  try {
    json = JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(
      `Unable to parse helper JSON. status=${result.status} stdout=${result.stdout} stderr=${result.stderr} error=${error}`,
    );
  }
  return { ...result, json };
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

function assertNoUnexpectedChangedFiles() {
  const changedFiles = new Set([
    ...gitLinesAllowFailure(["diff", "--name-only", "origin/main...HEAD"]),
    ...gitLines(["diff", "--name-only"]),
    ...gitLines(["diff", "--cached", "--name-only"]),
    ...gitLines(["ls-files", "--others", "--exclude-standard"]),
  ]);
  const allowedFiles = new Set([
    "app/api/ag-work-resume/proof-evidence-reconciliation-candidates/lifecycle-actions/route.ts",
    "components/augnes-cockpit.tsx",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
    "docs/AG_WORK_RESUME_ACTUAL_PROOF_EVIDENCE_RECORDING_GATE_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_SCHEMA_INTEGRATION_POLICY_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_SCHEMA_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_MIGRATION_POLICY_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_COCKPIT_GATE_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_ROUTE_GATE_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_WRITER_HELPER_GATE_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_CROSS_LOCAL_CONTINUITY_REVIEW_METADATA_CLOSEOUT_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_CREATE_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_IMPLEMENTATION_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTIONS_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTION_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md",
    "lib/db/schema.sql",
    "lib/ag-work-resume-proof-evidence-recording.ts",
    "app/api/ag-work-resume/proof-evidence-recordings/route.ts",
    "lib/ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.ts",
    "package.json",
    "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-verification.md",
    "scripts/ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.mjs",
    "scripts/ag-work-resume-proof-evidence-recording-create.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-writer-helper.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-route-gate-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-route.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-cockpit-gate-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-route.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-create-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-db-schema.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-read-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-read.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-route.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-writer.mjs",
    "scripts/smoke-ag-work-resume-actual-proof-evidence-recording-gate-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-schema-integration-policy.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-schema-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-migration-policy.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-schema.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-writer-helper-gate-design.mjs",
    "scripts/smoke-ag-work-resume-review-metadata-closeout.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-session-codex-gates-design.mjs",
    "scripts/smoke-ag-work-resume-imported-context-route.mjs",
    "scripts/smoke-ag-work-resume-imported-context-writer.mjs",
  ]);
  for (const file of changedFiles) {
    assert.ok(
      allowedFiles.has(file),
      `changed file is outside candidate lifecycle action slice: ${file}`,
    );
  }
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

function isPathInside(child, parent) {
  const relative = path.relative(parent, child);
  return relative.length > 0 && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
