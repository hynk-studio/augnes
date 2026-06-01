import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const writerPath = path.join(
  rootDir,
  "lib",
  "ag-work-resume-proof-evidence-reconciliation-candidate.ts",
);
const helperPath = path.join(
  rootDir,
  "scripts",
  "ag-work-resume-proof-evidence-reconciliation-candidate-create.mjs",
);
const smokePath = fileURLToPath(import.meta.url);
const docsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md",
);
const packagePath = path.join(rootDir, "package.json");
const schemaPath = path.join(rootDir, "lib", "db", "schema.sql");
const tableName = "ag_work_resume_proof_evidence_reconciliation_candidates";
const importedTableName = "ag_work_resume_imported_contexts";
const mappingTableName = "ag_work_resume_confirmed_mappings";
const proposalTableName = "ag_work_resume_mapping_proposals";
const pointerDocPaths = [
  path.join(
    rootDir,
    "docs",
    "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_IMPLEMENTATION_V0_1.md",
  ),
  path.join(
    rootDir,
    "docs",
    "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_DESIGN_V0_1.md",
  ),
  path.join(
    rootDir,
    "docs",
    "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md",
  ),
  path.join(
    rootDir,
    "docs",
    "AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md",
  ),
  path.join(rootDir, "docs", "AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1.md"),
  path.join(rootDir, "docs", "AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md"),
  path.join(rootDir, "docs", "AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md"),
  path.join(
    rootDir,
    "docs",
    "AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
  ),
];
const tempDir = mkdtempSync(
  path.join(os.tmpdir(), "augnes-ag-resume-reconciliation-candidate-writer-"),
);
const dbPath = path.join(tempDir, "augnes.db");
const foreignRefTypes = [
  "proof",
  "evidence",
  "action",
  "session",
  "git",
  "evidence_pack",
  "handoff",
  "other",
];

process.env.AUGNES_DB_PATH = dbPath;
process.env.OPENAI_API_KEY = "smoke-openai-key-must-not-be-used";

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error(
    "AG resume reconciliation candidate writer smoke must not call fetch.",
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

  const { buildAgWorkResumePacketPreview } = await import(
    "../lib/ag-work-resume-packet.ts"
  );
  const {
    createAgWorkResumeMappingProposalRecord,
  } = await import("../lib/ag-work-resume-mapping-proposal-record.ts");
  const {
    createAgWorkResumeConfirmedMapping,
  } = await import("../lib/ag-work-resume-confirmed-mapping.ts");
  const { createAgWorkResumeImportedContext } = await import(
    "../lib/ag-work-resume-imported-context.ts"
  );
  const {
    createAgWorkResumeProofEvidenceReconciliationCandidate,
  } = await import(
    "../lib/ag-work-resume-proof-evidence-reconciliation-candidate.ts"
  );

  const fixtures = {
    core: createImportedContextFixture({
      key: "core",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
      createAgWorkResumeConfirmedMapping,
      createAgWorkResumeImportedContext,
    }),
    helperEnv: createImportedContextFixture({
      key: "helper-env",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
      createAgWorkResumeConfirmedMapping,
      createAgWorkResumeImportedContext,
    }),
    helperFile: createImportedContextFixture({
      key: "helper-file",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
      createAgWorkResumeConfirmedMapping,
      createAgWorkResumeImportedContext,
    }),
    helperFlags: createImportedContextFixture({
      key: "helper-flags",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
      createAgWorkResumeConfirmedMapping,
      createAgWorkResumeImportedContext,
    }),
    helperStdin: createImportedContextFixture({
      key: "helper-stdin",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
      createAgWorkResumeConfirmedMapping,
      createAgWorkResumeImportedContext,
    }),
    invalid: createImportedContextFixture({
      key: "invalid",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
      createAgWorkResumeConfirmedMapping,
      createAgWorkResumeImportedContext,
    }),
    inactive: createImportedContextFixture({
      key: "inactive",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
      createAgWorkResumeConfirmedMapping,
      createAgWorkResumeImportedContext,
    }),
  };

  const coreBefore = sideEffectSnapshot(dbPath, fixtures.core);
  const deriveCount = countRows(dbPath, tableName);
  const deriveResult = createAgWorkResumeProofEvidenceReconciliationCandidate(
    buildCandidateInput(fixtures.core, {
      foreign_ref_id: "foreign-proof:derive",
      now: "2026-06-01T02:00:00.000Z",
    }),
  );
  assert.equal(deriveResult.ok, true);
  assert.equal(deriveResult.status, "created");
  assert.equal(deriveResult.record?.status, "proposed");
  assert.equal(deriveResult.record?.mapping_id, fixtures.core.mapping_id);
  assert.equal(deriveResult.imported_context?.import_id, fixtures.core.import_id);
  assert.equal(deriveResult.record?.redaction_status.safe, true);
  assert.ok(deriveResult.candidate_id?.startsWith(
    "ag-resume-proof-evidence-reconciliation-candidate:",
  ));
  assertCandidateAuthorityBoundary(deriveResult.authority_boundary, true);
  assertCandidateAuthorityBoundary(deriveResult.record.authority_boundary, true);
  assert.equal(countRows(dbPath, tableName), deriveCount + 1);
  assertSideEffectsUnchanged(dbPath, fixtures.core, coreBefore);

  const explicitCount = countRows(dbPath, tableName);
  const explicitResult = createAgWorkResumeProofEvidenceReconciliationCandidate(
    buildCandidateInput(fixtures.core, {
      mapping_id: fixtures.core.mapping_id,
      foreign_ref_id: "foreign-proof:explicit",
      created_at: "2026-06-01T02:01:00.000Z",
    }),
  );
  assert.equal(explicitResult.ok, true);
  assert.equal(explicitResult.status, "created");
  assert.equal(countRows(dbPath, tableName), explicitCount + 1);
  assertSideEffectsUnchanged(dbPath, fixtures.core, coreBefore);

  for (const [index, foreignRefType] of foreignRefTypes.entries()) {
    const before = countRows(dbPath, tableName);
    const result = createAgWorkResumeProofEvidenceReconciliationCandidate(
      buildCandidateInput(fixtures.core, {
        foreign_ref_type: foreignRefType,
        foreign_ref_id: `${foreignRefType}:foreign-ref-type-${index}`,
        created_at: `2026-06-01T02:${String(index + 10).padStart(2, "0")}:00.000Z`,
      }),
    );
    assert.equal(result.ok, true, `${foreignRefType} should be accepted`);
    assert.equal(result.record?.foreign_ref_type, foreignRefType);
    assert.equal(countRows(dbPath, tableName), before + 1);
    assertSideEffectsUnchanged(dbPath, fixtures.core, coreBefore);
  }

  const helperEnvBefore = sideEffectSnapshot(dbPath, fixtures.helperEnv);
  const helperEnvCount = countRows(dbPath, tableName);
  const helperEnv = runHelper({
    dbPath,
    envInput: buildCandidateInput(fixtures.helperEnv, {
      foreign_ref_id: "foreign-proof:helper-env",
      created_at: "2026-06-01T02:30:00.000Z",
    }),
  });
  assert.equal(helperEnv.status, 0);
  assert.equal(helperEnv.json.ok, true);
  assert.equal(
    helperEnv.json.helper,
    "ag_work_resume_proof_evidence_reconciliation_candidate_create.v0_1",
  );
  assert.equal(helperEnv.json.input_mode, "env");
  assert.equal(helperEnv.json.result.status, "created");
  assert.equal(countRows(dbPath, tableName), helperEnvCount + 1);
  assertSideEffectsUnchanged(dbPath, fixtures.helperEnv, helperEnvBefore);

  const helperFileBefore = sideEffectSnapshot(dbPath, fixtures.helperFile);
  const helperFileCount = countRows(dbPath, tableName);
  const inputFile = path.join(tempDir, "candidate-helper-file.json");
  writeFileSync(
    inputFile,
    JSON.stringify(
      buildCandidateInput(fixtures.helperFile, {
        foreign_ref_id: "foreign-proof:helper-file",
        created_at: "2026-06-01T02:31:00.000Z",
      }),
    ),
  );
  const helperFile = runHelper({ dbPath, filePath: inputFile });
  assert.equal(helperFile.status, 0);
  assert.equal(helperFile.json.ok, true);
  assert.equal(helperFile.json.input_mode, "file");
  assert.equal(countRows(dbPath, tableName), helperFileCount + 1);
  assertSideEffectsUnchanged(dbPath, fixtures.helperFile, helperFileBefore);

  const helperFlagsBefore = sideEffectSnapshot(dbPath, fixtures.helperFlags);
  const helperFlagsCount = countRows(dbPath, tableName);
  const helperFlags = runHelper({
    dbPath,
    flags: {
      import_id: fixtures.helperFlags.import_id,
      mapping_id: fixtures.helperFlags.mapping_id,
      foreign_ref_type: "evidence",
      foreign_ref_id: "foreign-evidence:helper-flags",
      local_target_scope: fixtures.helperFlags.mapping.local_scope,
      local_target_work_id: fixtures.helperFlags.mapping.local_work_id,
      summary: "Helper flags candidate summary.",
      redaction_status_json: JSON.stringify(safeRedactionStatus()),
      proposed_by: "user-core:candidate-helper",
      proposed_reason: "User/Core proposed candidate through helper flags.",
      created_at: "2026-06-01T02:32:00.000Z",
    },
  });
  assert.equal(helperFlags.status, 0);
  assert.equal(helperFlags.json.ok, true);
  assert.equal(helperFlags.json.input_mode, "flags");
  assert.equal(countRows(dbPath, tableName), helperFlagsCount + 1);
  assertSideEffectsUnchanged(dbPath, fixtures.helperFlags, helperFlagsBefore);

  const helperStdinBefore = sideEffectSnapshot(dbPath, fixtures.helperStdin);
  const helperStdinCount = countRows(dbPath, tableName);
  const helperStdin = runHelper({
    dbPath,
    stdinInput: buildCandidateInput(fixtures.helperStdin, {
      foreign_ref_id: "foreign-proof:helper-stdin",
      created_at: "2026-06-01T02:33:00.000Z",
    }),
  });
  assert.equal(helperStdin.status, 0);
  assert.equal(helperStdin.json.ok, true);
  assert.equal(helperStdin.json.input_mode, "stdin");
  assert.equal(countRows(dbPath, tableName), helperStdinCount + 1);
  assertSideEffectsUnchanged(dbPath, fixtures.helperStdin, helperStdinBefore);

  const helperInvalid = runHelper({
    dbPath,
    stdinInput: { foreign_ref_type: "proof" },
  });
  assert.notEqual(helperInvalid.status, 0);
  assert.equal(helperInvalid.json.ok, false);

  const invalidBase = buildCandidateInput(fixtures.invalid, {
    foreign_ref_id: "foreign-proof:invalid-base",
    created_at: "2026-06-01T02:40:00.000Z",
  });
  assertCreateFails({
    createAgWorkResumeProofEvidenceReconciliationCandidate,
    fixture: fixtures.invalid,
    input: omit(invalidBase, "import_id"),
    status: "invalid_input",
    label: "missing import_id",
  });
  assertCreateFails({
    createAgWorkResumeProofEvidenceReconciliationCandidate,
    fixture: fixtures.invalid,
    input: omit(invalidBase, "foreign_ref_type"),
    status: "invalid_input",
    label: "missing foreign_ref_type",
  });
  assertCreateFails({
    createAgWorkResumeProofEvidenceReconciliationCandidate,
    fixture: fixtures.invalid,
    input: { ...invalidBase, foreign_ref_type: "raw_payload" },
    status: "invalid_input",
    label: "unknown foreign_ref_type",
  });
  assertCreateFails({
    createAgWorkResumeProofEvidenceReconciliationCandidate,
    fixture: fixtures.invalid,
    input: omit(invalidBase, "foreign_ref_id"),
    status: "invalid_input",
    label: "missing foreign_ref_id",
  });
  assertCreateFails({
    createAgWorkResumeProofEvidenceReconciliationCandidate,
    fixture: fixtures.invalid,
    input: omit(invalidBase, "local_target_scope"),
    status: "invalid_input",
    label: "missing local_target_scope",
  });
  assertCreateFails({
    createAgWorkResumeProofEvidenceReconciliationCandidate,
    fixture: fixtures.invalid,
    input: omit(invalidBase, "local_target_work_id"),
    status: "invalid_input",
    label: "missing local_target_work_id",
  });
  assertCreateFails({
    createAgWorkResumeProofEvidenceReconciliationCandidate,
    fixture: fixtures.invalid,
    input: omit(invalidBase, "summary"),
    status: "invalid_input",
    label: "missing summary",
  });
  assertCreateFails({
    createAgWorkResumeProofEvidenceReconciliationCandidate,
    fixture: fixtures.invalid,
    input: omit(invalidBase, "proposed_by"),
    status: "invalid_input",
    label: "missing proposed_by",
  });
  assertCreateFails({
    createAgWorkResumeProofEvidenceReconciliationCandidate,
    fixture: fixtures.invalid,
    input: omit(invalidBase, "proposed_reason"),
    status: "invalid_input",
    label: "missing proposed_reason",
  });
  assertCreateFails({
    createAgWorkResumeProofEvidenceReconciliationCandidate,
    fixture: fixtures.invalid,
    input: { ...invalidBase, created_at: "2026-06-01T02:40:00Z" },
    status: "invalid_input",
    label: "malformed created_at",
  });
  assertCreateFails({
    createAgWorkResumeProofEvidenceReconciliationCandidate,
    fixture: fixtures.invalid,
    input: omit(invalidBase, "redaction_status"),
    status: "redaction_blocked",
    label: "redaction_status missing",
  });
  for (const [label, redaction_status] of [
    ["redaction safe not true", { ...safeRedactionStatus(), safe: false }],
    ["redaction secrets included", { ...safeRedactionStatus(), secrets_included: true }],
    [
      "redaction raw DB paths included",
      { ...safeRedactionStatus(), raw_db_paths_included: true },
    ],
    [
      "redaction session payloads included",
      { ...safeRedactionStatus(), session_payloads_included: true },
    ],
    [
      "redaction proof payloads included",
      { ...safeRedactionStatus(), proof_payloads_included: true },
    ],
  ]) {
    assertCreateFails({
      createAgWorkResumeProofEvidenceReconciliationCandidate,
      fixture: fixtures.invalid,
      input: { ...invalidBase, redaction_status },
      status: "redaction_blocked",
      label,
    });
  }
  assertCreateFails({
    createAgWorkResumeProofEvidenceReconciliationCandidate,
    fixture: fixtures.invalid,
    input: { ...invalidBase, import_id: "ag-resume-imported-context:missing" },
    status: "imported_context_not_found",
    label: "imported context missing",
  });

  updateImportedContextStatus(dbPath, fixtures.inactive.import_id, "revoked");
  const inactiveBefore = sideEffectSnapshot(dbPath, fixtures.inactive);
  assertCreateFails({
    createAgWorkResumeProofEvidenceReconciliationCandidate,
    fixture: fixtures.inactive,
    beforeSnapshot: inactiveBefore,
    input: buildCandidateInput(fixtures.inactive, {
      foreign_ref_id: "foreign-proof:inactive",
      created_at: "2026-06-01T02:41:00.000Z",
    }),
    status: "imported_context_not_allowed",
    label: "imported context inactive",
  });

  assertCreateFails({
    createAgWorkResumeProofEvidenceReconciliationCandidate,
    fixture: fixtures.invalid,
    input: { ...invalidBase, mapping_id: "ag-resume-confirmed-mapping:wrong" },
    status: "imported_context_mismatch",
    label: "mapping_id mismatch",
  });
  assertCreateFails({
    createAgWorkResumeProofEvidenceReconciliationCandidate,
    fixture: fixtures.invalid,
    input: { ...invalidBase, local_target_work_id: "AG-WRONG-LOCAL" },
    status: "imported_context_mismatch",
    label: "local target mismatch",
  });

  const duplicateBefore = sideEffectSnapshot(dbPath, fixtures.invalid);
  const duplicateInput = buildCandidateInput(fixtures.invalid, {
    foreign_ref_id: "foreign-proof:duplicate",
    created_at: "2026-06-01T02:42:00.000Z",
  });
  const duplicateCreate = createAgWorkResumeProofEvidenceReconciliationCandidate(
    duplicateInput,
  );
  assert.equal(duplicateCreate.ok, true);
  assertSideEffectsUnchanged(dbPath, fixtures.invalid, duplicateBefore);
  assertCreateFails({
    createAgWorkResumeProofEvidenceReconciliationCandidate,
    fixture: fixtures.invalid,
    input: { ...duplicateInput, created_at: "2026-06-01T02:43:00.000Z" },
    status: "duplicate_candidate",
    label: "duplicate candidate",
  });
  assertCreateFails({
    createAgWorkResumeProofEvidenceReconciliationCandidate,
    fixture: fixtures.invalid,
    input: { ...invalidBase, unexpected: true },
    status: "invalid_input",
    label: "unknown field",
  });

  assertNoForbiddenRows(dbPath);
  assert.equal(fetchCalls, 0, "candidate writer/helper smoke must not call fetch/network");

  console.log(
    JSON.stringify(
      {
        smoke: "ag-work-resume-proof-evidence-reconciliation-candidate-writer",
        temp_db_path: dbPath,
        cases: [
          "package scripts are present",
          "writer/helper/docs source guards pass",
          "core creates proposed reconciliation candidate from imported context",
          "core derives mapping_id from imported context when omitted",
          "core accepts explicit matching mapping_id",
          "supported foreign_ref_type values are accepted",
          "helper env/file/flags/stdin succeeds",
          "helper invalid input exits non-zero",
          "required fields fail closed",
          "malformed created_at fails closed",
          "redaction_status unsafe or missing fails closed",
          "imported context missing or inactive fails closed",
          "mapping and local target mismatches fail closed",
          "duplicate candidate fails closed",
          "unknown fields fail closed",
          "candidate creation changes only candidate rows",
          "imported context, confirmed mapping, source proposal, and local work rows are unchanged",
          "work/proof/evidence/session tables receive no rows",
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
  for (const file of [
    writerPath,
    helperPath,
    smokePath,
    docsPath,
    packagePath,
    schemaPath,
    ...pointerDocPaths,
  ]) {
    assert.ok(existsSync(file), `${file} must exist`);
  }
}

function assertPackageScripts() {
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  assert.equal(
    packageJson.scripts?.["ag:resume-proof-evidence-reconciliation-candidate-create"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/ag-work-resume-proof-evidence-reconciliation-candidate-create.mjs",
    "package.json must expose candidate create helper",
  );
  assert.equal(
    packageJson.scripts?.[
      "smoke:ag-work-resume-proof-evidence-reconciliation-candidate-writer"
    ],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-writer.mjs",
    "package.json must expose candidate writer smoke",
  );
}

function assertSourceGuards() {
  const writerSource = readFileSync(writerPath, "utf8");
  const helperSource = readFileSync(helperPath, "utf8");
  const smokeSource = readFileSync(smokePath, "utf8");
  const schemaSource = readFileSync(schemaPath, "utf8");

  assert.match(
    writerSource,
    /export function createAgWorkResumeProofEvidenceReconciliationCandidate/,
    "writer core export must exist",
  );
  assert.match(
    writerSource,
    /INSERT INTO ag_work_resume_proof_evidence_reconciliation_candidates/,
    "writer core must insert into candidate table",
  );
  assert.match(
    writerSource,
    /SELECT \* FROM ag_work_resume_imported_contexts WHERE import_id = \?/,
    "writer core must load imported context by import_id",
  );
  assert.match(
    writerSource,
    /status IN \(\$\{ACTIVE_DUPLICATE_STATUSES\.map/,
    "writer core must check active duplicate candidate statuses",
  );
  assert.doesNotMatch(
    writerSource,
    /\b(UPDATE|DELETE|DROP|ALTER\s+TABLE|CREATE\s+TABLE)\s+/i,
    "writer core must not mutate schema or update/delete rows",
  );
  assert.doesNotMatch(
    writerSource,
    /INSERT INTO\s+(?!ag_work_resume_proof_evidence_reconciliation_candidates)/i,
    "writer core must only insert candidate rows",
  );

  assert.match(
    helperSource,
    /createAgWorkResumeProofEvidenceReconciliationCandidate/,
    "helper must call candidate writer core",
  );
  assert.doesNotMatch(helperSource, /fetch\s*\(/i, "helper must not call fetch");
  assert.doesNotMatch(
    helperSource,
    /\/api\/|GitHub|OpenAI|record-proof|record-evidence|sessions\/bind|work_events/i,
    "helper must not call routes or proof/evidence/session/work/Codex helpers",
  );

  const importText = extractImportText(`${writerSource}\n${helperSource}\n${smokeSource}`);
  for (const forbidden of [
    /node:http/i,
    /node:https/i,
    /node:net/i,
    /node:tls/i,
    /app\/api/i,
    /components\//i,
    /apps\/augnes_apps\/src/i,
  ]) {
    assert.doesNotMatch(importText, forbidden, `source must not import ${forbidden}`);
  }

  assert.match(
    schemaSource,
    /CREATE TABLE IF NOT EXISTS ag_work_resume_proof_evidence_reconciliation_candidates/,
    "schema foundation must still exist",
  );
  assertNoUnexpectedChangedFiles();
}

function assertNoUnexpectedChangedFiles() {
  const changedFiles = new Set([
    ...gitLinesAllowFailure(["diff", "--name-only", "origin/main...HEAD"]),
    ...gitLines(["diff", "--name-only"]),
    ...gitLines(["diff", "--cached", "--name-only"]),
    ...gitLines(["ls-files", "--others", "--exclude-standard"]),
  ]);
  const allowedFiles = new Set([
    "lib/ag-work-resume-proof-evidence-reconciliation-candidate.ts",
    "scripts/ag-work-resume-proof-evidence-reconciliation-candidate-create.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-writer.mjs",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_IMPLEMENTATION_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-db-schema.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-db-schema-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-session-codex-gates-design.mjs",
    "scripts/smoke-ag-work-resume-imported-context-route.mjs",
    "scripts/smoke-ag-work-resume-imported-context-writer.mjs",
    "app/api/ag-work-resume/proof-evidence-reconciliation-candidates/route.ts",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_V0_1.md",
    "lib/ag-work-resume-proof-evidence-reconciliation-candidate-read.ts",
    "scripts/ag-work-resume-proof-evidence-reconciliation-candidate-read.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-read.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-route.mjs",
    "components/augnes-cockpit.tsx",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_CREATE_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_COCKPIT_PANEL_V0_1.md",
    "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-create-cockpit-panel-verification.md",
    "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-read-cockpit-panel-verification.md",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-create-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-read-cockpit-panel.mjs",
    "package.json",
  ]);
  const forbiddenPrefixes = [
    "app/",
    "components/",
    "migrations/",
    "apps/",
    "reports/browser/",
  ];

  for (const file of changedFiles) {
    assert.ok(
      allowedFiles.has(file),
      `changed file is outside candidate writer/helper slice: ${file}`,
    );
    assert.ok(
      file === "lib/ag-work-resume-proof-evidence-reconciliation-candidate.ts" ||
        file === "lib/ag-work-resume-proof-evidence-reconciliation-candidate-read.ts" ||
        !file.startsWith("lib/"),
      `lib changes are limited to candidate writer/read core: ${file}`,
    );
    assert.notEqual(file, "lib/db/schema.sql", "schema.sql must be unchanged");
    assert.equal(
      file !==
        "app/api/ag-work-resume/proof-evidence-reconciliation-candidates/route.ts" &&
        file !== "components/augnes-cockpit.tsx" &&
        file !==
          "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-read-cockpit-panel-verification.md" &&
        file !==
          "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-create-cockpit-panel-verification.md" &&
        forbiddenPrefixes.some((prefix) => file.startsWith(prefix)),
      false,
      `candidate writer/helper follow-up must not touch forbidden path except candidate create route: ${file}`,
    );
  }
}

function assertDocsGuard() {
  const docs = readFileSync(docsPath, "utf8");
  for (const pattern of [
    /Purpose/i,
    /Relationship To Candidate Schema Reconciliation And Gate Docs/i,
    /Core API/i,
    /Helper Usage/i,
    /Validation Rules/i,
    /DB Behavior/i,
    /Imported Context Validation/i,
    /Redaction Validation/i,
    /Duplicate Candidate Policy/i,
    /Output Shape/i,
    /Authority Boundary/i,
    /Non-Goals/i,
    /browser verification skipped: no rendered UI\/operator surface changed in this reconciliation candidate writer\/helper slice/i,
    /writer creates candidate review metadata rows only/i,
    /Candidate rows are not\s+proof\/evidence/is,
    /does not record proof\/evidence/i,
    /does not bind sessions/i,
    /does not execute Codex/i,
    /does not create work items\/events/i,
    /does not mutate imported context rows/i,
    /does not mutate\s+confirmed mapping rows/is,
    /does not mutate\s+proposal rows/is,
    /adds no route/i,
    /adds no UI/i,
  ]) {
    assert.match(docs, pattern, `writer docs must include ${pattern}`);
  }

  for (const pointerDocPath of pointerDocPaths) {
    const pointerDocs = readFileSync(pointerDocPath, "utf8");
    assert.match(
      pointerDocs,
      /AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1\.md/,
      `${path.basename(pointerDocPath)} must point to candidate writer doc`,
    );
  }
}

function resetDb(targetDbPath) {
  for (const script of ["db:reset", "db:migrate"]) {
    execFileSync("npm", ["run", script], {
      cwd: rootDir,
      env: {
        ...process.env,
        AUGNES_DB_PATH: targetDbPath,
      },
      encoding: "utf8",
      stdio: "pipe",
    });
  }
}

function createImportedContextFixture({
  key,
  buildAgWorkResumePacketPreview,
  createAgWorkResumeMappingProposalRecord,
  createAgWorkResumeConfirmedMapping,
  createAgWorkResumeImportedContext,
}) {
  const packet = buildAgWorkResumePacketPreview(
    buildFixtureInput({
      key,
      foreignWorkId: `AG-RECONCILIATION-CANDIDATE-${key.toUpperCase()}`,
      runtimeInstanceId: `runtime-instance:reconciliation-candidate-${key}`,
    }),
  );
  const candidate = buildCandidateFromPacket(packet, {
    candidate_id: `candidate:${key}`,
    local_scope: "project:augnes",
    local_work_id: `AG-LOCAL-RECONCILIATION-CANDIDATE-${key.toUpperCase()}`,
  });
  seedLocalWorkItem(dbPath, candidate);

  const proposal = createAgWorkResumeMappingProposalRecord(
    buildProposalCreateInput(packet, candidate, {
      proposal_reason: `User/Core requested reconciliation candidate fixture ${key}.`,
    }),
  );
  assert.equal(proposal.ok, true, `proposal fixture ${key} should be created`);

  const mapping = createAgWorkResumeConfirmedMapping(
    buildConfirmedInput(proposal.record, {
      confirmed_by: "user-core:reconciliation-candidate-fixture",
      confirmation_reason: `User/Core confirmed fixture mapping ${key}.`,
      confirmed_at: `2026-06-01T01:${String(fixtureMinute(key)).padStart(2, "0")}:00.000Z`,
    }),
  );
  assert.equal(mapping.ok, true, `confirmed mapping fixture ${key} should be created`);

  const imported = createAgWorkResumeImportedContext(
    buildImportedInput(mapping.record, key, {
      created_at: `2026-06-01T01:${String(fixtureMinute(key)).padStart(2, "0")}:30.000Z`,
    }),
  );
  assert.equal(imported.ok, true, `imported context fixture ${key} should be created`);

  return {
    key,
    packet,
    candidate,
    proposal_id: proposal.record.proposal_id,
    proposal: readProposalRow(dbPath, proposal.record.proposal_id),
    mapping_id: mapping.record.mapping_id,
    mapping: readMappingRow(dbPath, mapping.record.mapping_id),
    import_id: imported.record.import_id,
    imported: readImportedRow(dbPath, imported.record.import_id),
  };
}

function buildCandidateInput(fixture, overrides = {}) {
  return {
    import_id: fixture.import_id,
    ...(overrides.mapping_id !== undefined ? { mapping_id: overrides.mapping_id } : {}),
    foreign_ref_type: overrides.foreign_ref_type ?? "proof",
    foreign_ref_id:
      overrides.foreign_ref_id ?? `foreign-proof:${fixture.key}:public-safe`,
    local_target_scope:
      overrides.local_target_scope ?? fixture.mapping.local_scope,
    local_target_work_id:
      overrides.local_target_work_id ?? fixture.mapping.local_work_id,
    summary:
      overrides.summary ??
      `Bounded reconciliation candidate summary for fixture ${fixture.key}.`,
    redaction_status: overrides.redaction_status ?? safeRedactionStatus(),
    proposed_by: overrides.proposed_by ?? "user-core:reconciliation-candidate-smoke",
    proposed_reason:
      overrides.proposed_reason ??
      `User/Core proposed reconciliation candidate for fixture ${fixture.key}.`,
    ...(overrides.created_at !== undefined ? { created_at: overrides.created_at } : {}),
    ...(overrides.now !== undefined ? { now: overrides.now } : {}),
  };
}

function buildImportedInput(mapping, key, overrides = {}) {
  return {
    mapping_id: mapping.mapping_id,
    packet_id: mapping.packet_id,
    packet_hash: mapping.packet_hash,
    imported_summary: `Bounded imported context summary for reconciliation candidate fixture ${key}.`,
    imported_expected_files: ["docs/reconciliation-candidate.md"],
    imported_expected_checks: [
      "npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-writer",
    ],
    foreign_refs_summary: {
      foreign_proof_ref: `proof:foreign-public-safe:${key}`,
      foreign_evidence_ref: `evidence:foreign-public-safe:${key}`,
    },
    redaction_report: {
      secrets_included: false,
      raw_db_paths_included: false,
      session_payloads_included: false,
      proof_payloads_included: false,
    },
    created_by: "user-core:reconciliation-candidate-smoke",
    import_reason:
      "User/Core imported bounded context before reconciliation candidate creation.",
    created_at: overrides.created_at,
  };
}

function buildConfirmedInput(proposal, overrides = {}) {
  return {
    source_proposal_id: proposal.proposal_id,
    confirmed_by: overrides.confirmed_by ?? "user-core:reconciliation-candidate-smoke",
    confirmation_reason:
      overrides.confirmation_reason ??
      "User/Core confirmed mapping before reconciliation candidate creation.",
    confirmed_at: overrides.confirmed_at,
  };
}

function assertCreateFails({
  createAgWorkResumeProofEvidenceReconciliationCandidate,
  fixture,
  beforeSnapshot,
  input,
  status,
  label,
}) {
  const before = countRows(dbPath, tableName);
  const protectedBefore = snapshotProtectedCounts(dbPath);
  const sideBefore = beforeSnapshot ?? sideEffectSnapshot(dbPath, fixture);
  const result = createAgWorkResumeProofEvidenceReconciliationCandidate(input);
  assert.equal(result.ok, false, label);
  assert.equal(result.status, status, label);
  assert.equal(countRows(dbPath, tableName), before, label);
  assertProtectedCounts(dbPath, protectedBefore, label);
  assertSideEffectsUnchanged(dbPath, fixture, sideBefore);
  assertCandidateAuthorityBoundary(result.authority_boundary, false);
}

function runHelper({ dbPath: helperDbPath, envInput, filePath, flags, stdinInput }) {
  const args = [
    "--tsconfig",
    "tsconfig.json",
    "scripts/ag-work-resume-proof-evidence-reconciliation-candidate-create.mjs",
    "--json",
  ];
  if (filePath) {
    args.push("--file", filePath);
  }
  if (flags) {
    for (const [key, value] of Object.entries(flags)) {
      args.push(`--${key.replaceAll("_", "-")}`, value);
    }
  }
  const result = spawnSync(
    "./apps/augnes_apps/node_modules/.bin/tsx",
    args,
    {
      cwd: rootDir,
      env: {
        ...process.env,
        AUGNES_DB_PATH: helperDbPath,
        ...(envInput
          ? {
              AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_CREATE_INPUT:
                JSON.stringify(envInput),
            }
          : {}),
      },
      input: stdinInput ? JSON.stringify(stdinInput) : undefined,
      encoding: "utf8",
    },
  );
  let json = null;
  try {
    json = JSON.parse(result.stdout);
  } catch (error) {
    assert.fail(
      `helper stdout must be JSON. status=${result.status}\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}\n${error}`,
    );
  }
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, json };
}

function sideEffectSnapshot(targetDbPath, fixture) {
  return {
    protectedCounts: snapshotProtectedCounts(targetDbPath),
    importedRow: snapshotImportedRow(targetDbPath, fixture.import_id),
    mappingRow: snapshotMappingRow(targetDbPath, fixture.mapping_id),
    proposalRow: snapshotProposalRow(targetDbPath, fixture.proposal_id),
    localWorkRow: snapshotLocalWorkRow(
      targetDbPath,
      fixture.candidate.local_scope,
      fixture.candidate.local_work_id,
    ),
  };
}

function assertSideEffectsUnchanged(targetDbPath, fixture, before) {
  assertProtectedCounts(targetDbPath, before.protectedCounts, fixture.key);
  assert.equal(
    snapshotImportedRow(targetDbPath, fixture.import_id),
    before.importedRow,
    `${fixture.key}: imported context row must not change`,
  );
  assert.equal(
    snapshotMappingRow(targetDbPath, fixture.mapping_id),
    before.mappingRow,
    `${fixture.key}: confirmed mapping row must not change`,
  );
  assert.equal(
    snapshotProposalRow(targetDbPath, fixture.proposal_id),
    before.proposalRow,
    `${fixture.key}: source proposal row must not change`,
  );
  assert.equal(
    snapshotLocalWorkRow(
      targetDbPath,
      fixture.candidate.local_scope,
      fixture.candidate.local_work_id,
    ),
    before.localWorkRow,
    `${fixture.key}: local work row must not change`,
  );
}

function snapshotProtectedCounts(targetDbPath) {
  const tables = [
    "sessions",
    "work_events",
    "action_records",
    "verification_evidence_records",
  ];
  return Object.fromEntries(tables.map((table) => [table, countRows(targetDbPath, table)]));
}

function assertProtectedCounts(targetDbPath, before, label = "protected counts") {
  for (const [table, count] of Object.entries(before)) {
    assert.equal(countRows(targetDbPath, table), count, `${label}: ${table} count must not change`);
  }
}

function assertNoForbiddenRows(targetDbPath) {
  for (const table of [
    "sessions",
    "work_events",
    "action_records",
    "verification_evidence_records",
  ]) {
    assert.equal(countRows(targetDbPath, table), 0, `${table} rows must not be created`);
  }
}

function seedLocalWorkItem(targetDbPath, candidate) {
  const db = new Database(targetDbPath);
  try {
    db.prepare(
      `
        INSERT INTO work_items (
          scope,
          work_id,
          title,
          status,
          priority,
          summary,
          next_action,
          related_state_keys,
          links,
          created_at,
          updated_at
        )
        VALUES (
          @scope,
          @work_id,
          @title,
          @status,
          @priority,
          @summary,
          @next_action,
          @related_state_keys,
          @links,
          @created_at,
          @updated_at
        )
      `,
    ).run({
      scope: candidate.local_scope,
      work_id: candidate.local_work_id,
      title: candidate.title,
      status: candidate.status,
      priority: candidate.priority ?? "normal",
      summary: candidate.summary ?? "Smoke fixture local work item.",
      next_action: candidate.next_action,
      related_state_keys: JSON.stringify(candidate.related_state_keys ?? []),
      links: JSON.stringify({ source: "reconciliation-candidate-writer-smoke" }),
      created_at: "2026-06-01T01:00:00.000Z",
      updated_at: "2026-06-01T01:00:00.000Z",
    });
  } finally {
    db.close();
  }
}

function buildProposalCreateInput(packet, candidate, overrides = {}) {
  return {
    packet,
    candidates: [candidate],
    selected_candidate_id: candidate.candidate_id,
    proposed_by: "user-core:reconciliation-candidate-smoke",
    proposal_reason:
      overrides.proposal_reason ??
      "User/Core requested a durable proposal for later reconciliation candidate review.",
    status: "proposed",
    expires_at: null,
    source: {
      reviewed_by_surface: "codex",
      reviewed_at: "2026-06-01T01:00:00.000Z",
    },
  };
}

function buildFixtureInput({ key, foreignWorkId, runtimeInstanceId }) {
  const scope = "project:foreign";
  return {
    workBrief: {
      runtime: "augnes",
      scope,
      work_id: foreignWorkId,
      as_of: "2026-06-01T01:00:00.000Z",
      framing: {
        work_id: "Trace anchor only.",
        state_authority: "Augnes committed state remains authority.",
        execution_proof: "Action records remain proof.",
        temporal_proof: "Temporal graph remains proof over time.",
      },
      work: {
        work_id: foreignWorkId,
        scope,
        title: `Reconciliation candidate writer fixture ${key}`,
        status: "in_progress",
        priority: "now",
        summary: "Create a reconciliation candidate writer smoke fixture.",
        next_action: "Create bounded reconciliation candidate metadata.",
        user_attention_required: false,
        related_state_keys: ["coordination.ag_resume_reconciliation_candidate"],
        links: {
          docs: [
            "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md",
          ],
        },
        created_at: "2026-06-01T01:00:00.000Z",
        updated_at: "2026-06-01T01:00:00.000Z",
      },
      next_action: "Create bounded reconciliation candidate metadata.",
      user_attention_required: false,
      recent_events: [],
      related_state_keys: ["coordination.ag_resume_reconciliation_candidate"],
      related_proof: {
        action_ids: [],
        action_records: [],
        docs: [
          "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md",
        ],
        note: "No local proof is imported by reconciliation candidate metadata.",
      },
      codex_handoff: {
        task_brief: "Implement reconciliation candidate writer/helper.",
        constraints: ["No route/UI.", "No proof/evidence.", "No Codex execution."],
        suggested_verification: [
          "npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-writer",
        ],
      },
    },
    stateBrief: {
      runtime: "augnes",
      scope,
      as_of: "2026-06-01T01:00:00.000Z",
      generated_at: "2026-06-01T01:00:00.000Z",
      agent_instructions: ["Keep AG Resume reconciliation candidate authority gated."],
      agent_handoff: {
        current_status: {
          notable_state_keys: ["coordination.ag_resume_reconciliation_candidate"],
        },
        next_recommended_action: {
          related_state_keys: ["coordination.ag_resume_reconciliation_candidate"],
        },
        codex_handoff: {
          task_brief: "Implement reconciliation candidate writer/helper.",
          constraints: ["No route/UI.", "No proof/evidence.", "No Codex execution."],
          likely_files: [
            "lib/ag-work-resume-proof-evidence-reconciliation-candidate.ts",
            "scripts/ag-work-resume-proof-evidence-reconciliation-candidate-create.mjs",
          ],
          verification_commands: [
            "npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-writer",
          ],
        },
      },
    },
    handoffDraft: {
      handoff_id: `handoff:reconciliation-candidate-writer-smoke:${key}`,
      status: "ready",
      expected_files: [
        "lib/ag-work-resume-proof-evidence-reconciliation-candidate.ts",
        "scripts/ag-work-resume-proof-evidence-reconciliation-candidate-create.mjs",
      ],
      expected_checks: [
        "npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-writer",
      ],
      expected_execution_surfaces: [],
      forbidden_surfaces: ["proof/evidence", "session binding", "Codex execution"],
      stop_conditions: [
        "Reconciliation candidate writer output grants downstream authority.",
      ],
      safety_boundaries: [
        "Reconciliation candidate creation is only bounded review metadata.",
      ],
    },
    git: {
      remote: "https://github.com/hynk-studio/augnes.git",
      base_branch: "main",
      base_commit: "0c873b4",
      working_branch: "codex/ag-resume-reconciliation-candidate-writer",
      head_commit: "reconciliation-candidate-writer",
      related_pr: null,
      dirty_worktree: false,
    },
    issuer: {
      runtime_instance_id: runtimeInstanceId,
      source_local_label: `source-local-reconciliation-candidate-${key}`,
      created_by_surface: "reconciliation-candidate-writer-smoke",
      export_event_id: null,
    },
    foreign_evidence_refs: ["evidence:foreign-public-safe"],
    foreign_session_refs: ["session:foreign-public-safe"],
    foreign_evidence_pack_ref: "evidence-pack:foreign-public-safe",
  };
}

function buildCandidateFromPacket(packet, overrides = {}) {
  return {
    candidate_id: overrides.candidate_id ?? "candidate:local-work",
    local_scope: overrides.local_scope ?? "project:augnes",
    local_work_id: overrides.local_work_id ?? packet.source_work.work_id,
    title: overrides.title ?? packet.source_work.title,
    status: overrides.status ?? packet.source_work.status,
    next_action: overrides.next_action ?? packet.source_work.next_action,
    related_state_keys:
      overrides.related_state_keys ?? [...packet.source_work.related_state_keys],
    summary: overrides.summary ?? packet.source_work.summary,
    priority: overrides.priority ?? packet.source_work.priority,
    source: overrides.source ?? "explicit_user_input",
    work_brief_available: overrides.work_brief_available ?? true,
    codex_read_brief_available: overrides.codex_read_brief_available ?? true,
    repo_match: overrides.repo_match ?? {
      remote_matches: true,
      base_commit_reachable: true,
      expected_files_present: [...packet.handoff.expected_files],
      expected_files_missing: [],
      dirty_worktree: false,
    },
  };
}

function countRows(targetDbPath, table) {
  const db = new Database(targetDbPath);
  try {
    return db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
  } finally {
    db.close();
  }
}

function readProposalRow(targetDbPath, proposalId) {
  const db = new Database(targetDbPath);
  try {
    return db
      .prepare(`SELECT * FROM ${proposalTableName} WHERE proposal_id = ?`)
      .get(proposalId);
  } finally {
    db.close();
  }
}

function readMappingRow(targetDbPath, mappingId) {
  const db = new Database(targetDbPath);
  try {
    return db
      .prepare(`SELECT * FROM ${mappingTableName} WHERE mapping_id = ?`)
      .get(mappingId);
  } finally {
    db.close();
  }
}

function readImportedRow(targetDbPath, importId) {
  const db = new Database(targetDbPath);
  try {
    return db
      .prepare(`SELECT * FROM ${importedTableName} WHERE import_id = ?`)
      .get(importId);
  } finally {
    db.close();
  }
}

function updateImportedContextStatus(targetDbPath, importId, status) {
  const db = new Database(targetDbPath);
  try {
    db.prepare(
      `UPDATE ${importedTableName} SET status = ?, updated_at = ? WHERE import_id = ?`,
    ).run(status, "2026-06-01T02:39:00.000Z", importId);
  } finally {
    db.close();
  }
}

function snapshotProposalRow(targetDbPath, proposalId) {
  return JSON.stringify(readProposalRow(targetDbPath, proposalId));
}

function snapshotMappingRow(targetDbPath, mappingId) {
  return JSON.stringify(readMappingRow(targetDbPath, mappingId));
}

function snapshotImportedRow(targetDbPath, importId) {
  return JSON.stringify(readImportedRow(targetDbPath, importId));
}

function snapshotLocalWorkRow(targetDbPath, scope, workId) {
  const db = new Database(targetDbPath);
  try {
    return JSON.stringify(
      db
        .prepare("SELECT * FROM work_items WHERE scope = ? AND work_id = ?")
        .get(scope, workId) ?? null,
    );
  } finally {
    db.close();
  }
}

function assertCandidateAuthorityBoundary(boundary, created) {
  assert.equal(boundary.reconciliation_candidate_created, created);
  assert.equal(boundary.review_metadata_only, true);
  for (const key of [
    "proof_recorded",
    "evidence_recorded",
    "session_bound",
    "codex_executed",
    "work_item_created",
    "work_event_created",
    "imported_context_updated",
    "confirmed_mapping_updated",
    "proposal_record_updated",
    "approval_granted",
    "publish_retry_replay_authority",
    "merge_authority",
  ]) {
    assert.equal(boundary[key], false, `${key} must be false`);
  }
  assert.equal(boundary.durable_approval, "user/Core gated");
  assert.match(boundary.statement, /review metadata only/i);
  assert.match(boundary.statement, /not proof\/evidence\/session\/Codex\/merge authority/i);
}

function safeRedactionStatus() {
  return {
    safe: true,
    secrets_included: false,
    raw_db_paths_included: false,
    session_payloads_included: false,
    proof_payloads_included: false,
  };
}

function omit(value, key) {
  const clone = { ...value };
  delete clone[key];
  return clone;
}

function fixtureMinute(key) {
  return (Array.from(key).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 50) + 1;
}

function extractImportText(source) {
  return [
    ...source.matchAll(/^\s*import\s+[^;]+;$/gm),
    ...source.matchAll(/\bimport\(\s*["'][^"']+["']\s*\)/g),
  ]
    .map((match) => match[0])
    .join("\n");
}

function gitLines(args) {
  const result = spawnSync("git", args, {
    cwd: rootDir,
    encoding: "utf8",
  });
  assert.equal(
    result.status,
    0,
    `git ${args.join(" ")} must succeed\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
  );
  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function gitLinesAllowFailure(args) {
  const result = spawnSync("git", args, {
    cwd: rootDir,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    return [];
  }
  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function isPathInside(childPath, parentPath) {
  const relative = path.relative(parentPath, childPath);
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}
