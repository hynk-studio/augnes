import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
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
  "route.ts",
);
const writerPath = path.join(
  rootDir,
  "lib",
  "ag-work-resume-proof-evidence-reconciliation-candidate.ts",
);
const docsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1.md",
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
    "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md",
  ),
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
const tempDir = mkdtempSync(
  path.join(os.tmpdir(), "augnes-ag-resume-reconciliation-candidate-route-"),
);
const dbPath = path.join(tempDir, "augnes.db");

process.env.AUGNES_DB_PATH = dbPath;
process.env.OPENAI_API_KEY = "smoke-openai-key-must-not-be-used";

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error(
    "AG resume reconciliation candidate route smoke must not call fetch.",
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
  const { GET, POST } = await import(
    "../app/api/ag-work-resume/proof-evidence-reconciliation-candidates/route.ts"
  );
  assert.equal(typeof GET, "function", "candidate route must expose GET");
  assert.equal(typeof POST, "function", "candidate route must expose POST");

  const fixtures = {
    derived: createImportedContextFixture({
      key: "route-derived",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
      createAgWorkResumeConfirmedMapping,
      createAgWorkResumeImportedContext,
    }),
    explicit: createImportedContextFixture({
      key: "route-explicit",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
      createAgWorkResumeConfirmedMapping,
      createAgWorkResumeImportedContext,
    }),
    validation: createImportedContextFixture({
      key: "route-validation",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
      createAgWorkResumeConfirmedMapping,
      createAgWorkResumeImportedContext,
    }),
    inactive: createImportedContextFixture({
      key: "route-inactive",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
      createAgWorkResumeConfirmedMapping,
      createAgWorkResumeImportedContext,
    }),
  };

  let expectedCandidateRows = countRows(dbPath, tableName);

  const derivedBefore = sideEffectSnapshot(dbPath, fixtures.derived);
  const derivedResponse = await POST(
    jsonRequest(
      buildRouteInput(fixtures.derived, {
        foreign_ref_id: "foreign-proof:route-derived",
        created_at: "2026-06-01T03:00:00.000Z",
      }),
    ),
  );
  const derivedPayload = await derivedResponse.json();
  assert.equal(derivedResponse.status, 201);
  assert.equal(derivedPayload.ok, true);
  assert.equal(
    derivedPayload.route,
    "ag_work_resume_proof_evidence_reconciliation_candidates.v0_1",
  );
  assert.equal(derivedPayload.result.status, "created");
  assert.equal(derivedPayload.result.record.status, "proposed");
  assert.equal(derivedPayload.result.record.mapping_id, fixtures.derived.mapping_id);
  assert.equal(
    derivedPayload.result.record.local_target_scope,
    fixtures.derived.mapping.local_scope,
  );
  assert.equal(
    derivedPayload.result.record.local_target_work_id,
    fixtures.derived.mapping.local_work_id,
  );
  assert.match(derivedPayload.recommended_next_step, /not proof\/evidence/i);
  assertCandidateAuthorityBoundary(derivedPayload.authority_boundary, true);
  assertCandidateAuthorityBoundary(
    derivedPayload.result.record.authority_boundary,
    true,
  );
  expectedCandidateRows += 1;
  assert.equal(countRows(dbPath, tableName), expectedCandidateRows);
  assertSideEffectsUnchanged(dbPath, fixtures.derived, derivedBefore);

  const explicitBefore = sideEffectSnapshot(dbPath, fixtures.explicit);
  const explicitResponse = await POST(
    jsonRequest(
      buildRouteInput(fixtures.explicit, {
        mapping_id: fixtures.explicit.mapping_id,
        foreign_ref_id: "foreign-proof:route-explicit",
        created_at: "2026-06-01T03:01:00.000Z",
      }),
    ),
  );
  const explicitPayload = await explicitResponse.json();
  assert.equal(explicitResponse.status, 201);
  assert.equal(explicitPayload.ok, true);
  assert.equal(explicitPayload.result.status, "created");
  assert.equal(explicitPayload.result.record.mapping_id, fixtures.explicit.mapping_id);
  expectedCandidateRows += 1;
  assert.equal(countRows(dbPath, tableName), expectedCandidateRows);
  assertSideEffectsUnchanged(dbPath, fixtures.explicit, explicitBefore);

  for (const [index, foreignRefType] of foreignRefTypes.entries()) {
    const before = countRows(dbPath, tableName);
    const response = await POST(
      jsonRequest(
        buildRouteInput(fixtures.derived, {
          foreign_ref_type: foreignRefType,
          foreign_ref_id: `${foreignRefType}:route-supported-${index}`,
          created_at: `2026-06-01T03:${String(index + 10).padStart(2, "0")}:00.000Z`,
        }),
      ),
    );
    const payload = await response.json();
    assert.equal(response.status, 201, `${foreignRefType} should return 201`);
    assert.equal(payload.result.status, "created", foreignRefType);
    assert.equal(payload.result.record.foreign_ref_type, foreignRefType);
    assert.equal(countRows(dbPath, tableName), before + 1);
    expectedCandidateRows += 1;
    assertSideEffectsUnchanged(dbPath, fixtures.derived, derivedBefore);
  }

  const protectedBeforeFailures = snapshotProtectedCounts(dbPath);
  const proposalRowsBeforeFailures = countRows(dbPath, proposalTableName);
  const mappingRowsBeforeFailures = countRows(dbPath, mappingTableName);
  const importedRowsBeforeFailures = countRows(dbPath, importedTableName);
  const validationBefore = sideEffectSnapshot(dbPath, fixtures.validation);

  await assertRouteFailureNoWrite({
    name: "wrong content-type",
    response: () =>
      POST(
        new Request(routeUrl(), {
          method: "POST",
          headers: { "content-type": "text/plain" },
          body: JSON.stringify(buildRouteInput(fixtures.validation)),
        }),
      ),
    expectedHttpStatus: 400,
    expectedPayloadStatus: null,
    expectedCandidateRows,
    expectedImportedRows: importedRowsBeforeFailures,
    expectedProposalRows: proposalRowsBeforeFailures,
    expectedMappingRows: mappingRowsBeforeFailures,
    protectedBefore: protectedBeforeFailures,
    fixture: fixtures.validation,
    beforeSnapshot: validationBefore,
  });
  await assertRouteFailureNoWrite({
    name: "invalid JSON",
    response: () =>
      POST(
        new Request(routeUrl(), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{",
        }),
      ),
    expectedHttpStatus: 400,
    expectedPayloadStatus: null,
    expectedCandidateRows,
    expectedImportedRows: importedRowsBeforeFailures,
    expectedProposalRows: proposalRowsBeforeFailures,
    expectedMappingRows: mappingRowsBeforeFailures,
    protectedBefore: protectedBeforeFailures,
    fixture: fixtures.validation,
    beforeSnapshot: validationBefore,
  });
  await assertRouteFailureNoWrite({
    name: "non-object JSON",
    response: () => POST(jsonRequest([])),
    expectedHttpStatus: 400,
    expectedPayloadStatus: null,
    expectedCandidateRows,
    expectedImportedRows: importedRowsBeforeFailures,
    expectedProposalRows: proposalRowsBeforeFailures,
    expectedMappingRows: mappingRowsBeforeFailures,
    protectedBefore: protectedBeforeFailures,
    fixture: fixtures.validation,
    beforeSnapshot: validationBefore,
  });

  for (const forbiddenField of ["db", "now"]) {
    await assertRouteFailureNoWrite({
      name: `unknown body field ${forbiddenField}`,
      response: () =>
        POST(
          jsonRequest({
            ...buildRouteInput(fixtures.validation),
            [forbiddenField]: "blocked",
          }),
        ),
      expectedHttpStatus: 400,
      expectedPayloadStatus: null,
      expectedCandidateRows,
      expectedImportedRows: importedRowsBeforeFailures,
      expectedProposalRows: proposalRowsBeforeFailures,
      expectedMappingRows: mappingRowsBeforeFailures,
      protectedBefore: protectedBeforeFailures,
      fixture: fixtures.validation,
      beforeSnapshot: validationBefore,
    });
  }

  const invalidBase = buildRouteInput(fixtures.validation, {
    foreign_ref_id: "foreign-proof:route-invalid-base",
    created_at: "2026-06-01T03:40:00.000Z",
  });
  const invalidCases = [
    ["missing import_id", omit(invalidBase, "import_id"), 400, "invalid_input"],
    [
      "missing foreign_ref_type",
      omit(invalidBase, "foreign_ref_type"),
      400,
      "invalid_input",
    ],
    [
      "unknown foreign_ref_type",
      { ...invalidBase, foreign_ref_type: "raw_payload" },
      400,
      "invalid_input",
    ],
    [
      "missing foreign_ref_id",
      omit(invalidBase, "foreign_ref_id"),
      400,
      "invalid_input",
    ],
    [
      "missing local_target_scope",
      omit(invalidBase, "local_target_scope"),
      400,
      "invalid_input",
    ],
    [
      "missing local_target_work_id",
      omit(invalidBase, "local_target_work_id"),
      400,
      "invalid_input",
    ],
    ["missing summary", omit(invalidBase, "summary"), 400, "invalid_input"],
    [
      "missing redaction_status",
      omit(invalidBase, "redaction_status"),
      400,
      "redaction_blocked",
    ],
    [
      "redaction safe not true",
      { ...invalidBase, redaction_status: { ...safeRedactionStatus(), safe: false } },
      400,
      "redaction_blocked",
    ],
    [
      "redaction secrets included",
      {
        ...invalidBase,
        redaction_status: { ...safeRedactionStatus(), secrets_included: true },
      },
      400,
      "redaction_blocked",
    ],
    [
      "redaction raw DB paths included",
      {
        ...invalidBase,
        redaction_status: {
          ...safeRedactionStatus(),
          raw_db_paths_included: true,
        },
      },
      400,
      "redaction_blocked",
    ],
    [
      "redaction session payloads included",
      {
        ...invalidBase,
        redaction_status: {
          ...safeRedactionStatus(),
          session_payloads_included: true,
        },
      },
      400,
      "redaction_blocked",
    ],
    [
      "redaction proof payloads included",
      {
        ...invalidBase,
        redaction_status: {
          ...safeRedactionStatus(),
          proof_payloads_included: true,
        },
      },
      400,
      "redaction_blocked",
    ],
    ["missing proposed_by", omit(invalidBase, "proposed_by"), 400, "invalid_input"],
    [
      "missing proposed_reason",
      omit(invalidBase, "proposed_reason"),
      400,
      "invalid_input",
    ],
    [
      "malformed created_at",
      { ...invalidBase, created_at: "2026-06-01T03:40:00Z" },
      400,
      "invalid_input",
    ],
    [
      "imported context missing",
      { ...invalidBase, import_id: "ag-resume-imported-context:missing" },
      404,
      "imported_context_not_found",
    ],
    [
      "mapping_id mismatch",
      { ...invalidBase, mapping_id: "ag-resume-confirmed-mapping:wrong" },
      409,
      "imported_context_mismatch",
    ],
    [
      "local target mismatch",
      { ...invalidBase, local_target_work_id: "AG-WRONG-LOCAL" },
      409,
      "imported_context_mismatch",
    ],
  ];

  for (const [name, body, expectedHttpStatus, expectedPayloadStatus] of invalidCases) {
    await assertRouteFailureNoWrite({
      name,
      response: () => POST(jsonRequest(body)),
      expectedHttpStatus,
      expectedPayloadStatus,
      expectedCandidateRows,
      expectedImportedRows: importedRowsBeforeFailures,
      expectedProposalRows: proposalRowsBeforeFailures,
      expectedMappingRows: mappingRowsBeforeFailures,
      protectedBefore: protectedBeforeFailures,
      fixture: fixtures.validation,
      beforeSnapshot: validationBefore,
    });
  }

  updateImportedContextStatus(dbPath, fixtures.inactive.import_id, "revoked");
  const inactiveBefore = sideEffectSnapshot(dbPath, fixtures.inactive);
  await assertRouteFailureNoWrite({
    name: "imported context not review_metadata",
    response: () =>
      POST(
        jsonRequest(
          buildRouteInput(fixtures.inactive, {
            foreign_ref_id: "foreign-proof:route-inactive",
            created_at: "2026-06-01T03:41:00.000Z",
          }),
        ),
      ),
    expectedHttpStatus: 409,
    expectedPayloadStatus: "imported_context_not_allowed",
    expectedCandidateRows,
    expectedImportedRows: importedRowsBeforeFailures,
    expectedProposalRows: proposalRowsBeforeFailures,
    expectedMappingRows: mappingRowsBeforeFailures,
    protectedBefore: protectedBeforeFailures,
    fixture: fixtures.inactive,
    beforeSnapshot: inactiveBefore,
  });

  const duplicateBefore = sideEffectSnapshot(dbPath, fixtures.validation);
  const duplicateInput = buildRouteInput(fixtures.validation, {
    foreign_ref_id: "foreign-proof:route-duplicate",
    created_at: "2026-06-01T03:42:00.000Z",
  });
  const duplicateCreate = await POST(jsonRequest(duplicateInput));
  const duplicateCreatePayload = await duplicateCreate.json();
  assert.equal(duplicateCreate.status, 201);
  assert.equal(duplicateCreatePayload.result.status, "created");
  expectedCandidateRows += 1;
  assert.equal(countRows(dbPath, tableName), expectedCandidateRows);
  assertSideEffectsUnchanged(dbPath, fixtures.validation, duplicateBefore);
  await assertRouteFailureNoWrite({
    name: "duplicate candidate",
    response: () =>
      POST(
        jsonRequest({
          ...duplicateInput,
          created_at: "2026-06-01T03:43:00.000Z",
        }),
      ),
    expectedHttpStatus: 409,
    expectedPayloadStatus: "duplicate_candidate",
    expectedCandidateRows,
    expectedImportedRows: importedRowsBeforeFailures,
    expectedProposalRows: proposalRowsBeforeFailures,
    expectedMappingRows: mappingRowsBeforeFailures,
    protectedBefore: protectedBeforeFailures,
    fixture: fixtures.validation,
    beforeSnapshot: duplicateBefore,
  });

  assertNoForbiddenRows(dbPath);
  assert.equal(fetchCalls, 0, "candidate route smoke must not call fetch/network");

  console.log(
    JSON.stringify(
      {
        smoke: "ag-work-resume-proof-evidence-reconciliation-candidate-route",
        temp_db_path: dbPath,
        cases: [
          "package script is present",
          "route source imports candidate writer/read cores and NextResponse",
          "docs and pointer guards pass",
          "route creates proposed candidate from imported context",
          "omitted mapping_id derives from imported context",
          "explicit matching mapping_id is accepted",
          "supported foreign_ref_type values are accepted",
          "wrong content-type, invalid JSON, and non-object JSON fail closed",
          "db and now body fields fail closed",
          "required fields fail closed",
          "redaction_status unsafe or missing fails closed",
          "missing and inactive imported contexts fail closed",
          "mapping and local target mismatches fail closed",
          "duplicate candidate fails closed",
          "failure cases create zero candidate rows",
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
  for (const file of [routePath, writerPath, docsPath, packagePath, schemaPath, ...pointerDocPaths]) {
    assert.ok(existsSync(file), `${file} must exist`);
  }
}

function assertPackageScripts() {
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  assert.equal(
    packageJson.scripts?.[
      "smoke:ag-work-resume-proof-evidence-reconciliation-candidate-route"
    ],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-route.mjs",
    "package.json must expose candidate route smoke",
  );
}

function assertSourceGuards() {
  const routeSource = readFileSync(routePath, "utf8");
  const writerSource = readFileSync(writerPath, "utf8");
  const schemaSource = readFileSync(schemaPath, "utf8");

  assert.match(
    routeSource,
    /createAgWorkResumeProofEvidenceReconciliationCandidate/,
    "route must call candidate writer core",
  );
  assert.match(routeSource, /from "@\/lib\/ag-work-resume-proof-evidence-reconciliation-candidate"/);
  assert.match(
    routeSource,
    /from "@\/lib\/ag-work-resume-proof-evidence-reconciliation-candidate-read"/,
  );
  assert.match(routeSource, /from "next\/server"/);
  assert.doesNotMatch(
    routeSource,
    /createAgWorkResumeImportedContext|readAgWorkResumeImportedContexts|ag-work-resume-imported-context["']/,
    "candidate route must not import imported context writer/read helpers",
  );
  assert.doesNotMatch(routeSource, /fetch\s*\(/i, "route must not call fetch");
  const importText = extractImportText(routeSource);
  assert.doesNotMatch(
    importText,
    /record-proof|record-evidence|sessions\/bind|work_events|codex|Direct Resume Code|relay|approval|publication|bridge|MCP|App schema/i,
    "route must not import forbidden authority helpers",
  );
  assert.doesNotMatch(
    routeSource,
    /\b(PUT|PATCH|DELETE)\s*\(/,
    "candidate route must not add update/delete handlers",
  );
  assert.match(
    writerSource,
    /export function createAgWorkResumeProofEvidenceReconciliationCandidate/,
    "writer core export must exist",
  );
  assert.match(
    schemaSource,
    /CREATE TABLE IF NOT EXISTS ag_work_resume_proof_evidence_reconciliation_candidates/,
    "candidate schema foundation must still exist",
  );

  for (const forbiddenImport of [
    /node:http/i,
    /node:https/i,
    /node:net/i,
    /node:tls/i,
    /components\//i,
    /apps\/augnes_apps\/src/i,
  ]) {
    assert.doesNotMatch(
      importText,
      forbiddenImport,
      `route source must not import ${forbiddenImport}`,
    );
  }

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
    "app/api/ag-work-resume/proof-evidence-reconciliation-candidates/route.ts",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-route.mjs",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_V0_1.md",
    "lib/ag-work-resume-proof-evidence-reconciliation-candidate-read.ts",
    "scripts/ag-work-resume-proof-evidence-reconciliation-candidate-read.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-read.mjs",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_IMPLEMENTATION_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
    "components/augnes-cockpit.tsx",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_COCKPIT_PANEL_V0_1.md",
    "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-read-cockpit-panel-verification.md",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-read-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-writer.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-db-schema.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-db-schema-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-session-codex-gates-design.mjs",
    "scripts/smoke-ag-work-resume-imported-context-route.mjs",
    "scripts/smoke-ag-work-resume-imported-context-writer.mjs",
    "package.json",
  ]);
  for (const file of changedFiles) {
    assert.ok(
      allowedFiles.has(file),
      `changed file is outside candidate route slice: ${file}`,
    );
    assert.ok(
      file ===
        "app/api/ag-work-resume/proof-evidence-reconciliation-candidates/route.ts" ||
        !file.startsWith("app/"),
      `app changes limited to candidate create route: ${file}`,
    );
    assert.ok(
      file === "components/augnes-cockpit.tsx" || !file.startsWith("components/"),
      `component changes limited to reconciliation candidate read Cockpit panel: ${file}`,
    );
    assert.equal(file.startsWith("migrations/"), false, `no migration change: ${file}`);
    assert.equal(file.startsWith("apps/"), false, `no MCP/App change: ${file}`);
    assert.ok(
      file ===
        "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-read-cockpit-panel-verification.md" ||
        !file.startsWith("reports/browser/"),
      `browser report changes limited to reconciliation candidate read Cockpit panel: ${file}`,
    );
    assert.notEqual(file, "lib/db/schema.sql", "schema.sql must be unchanged");
    assert.ok(
      file === "lib/ag-work-resume-proof-evidence-reconciliation-candidate-read.ts" ||
        !file.startsWith("lib/"),
      `lib changes limited to candidate read core: ${file}`,
    );
  }
}

function assertDocsGuard() {
  const docs = readFileSync(docsPath, "utf8");
  for (const pattern of [
    /POST \/api\/ag-work-resume\/proof-evidence-reconciliation-candidates/i,
    /route creates reconciliation candidate review metadata rows only/i,
    /Candidate rows are not proof\/evidence/i,
    /route does not record\s+proof\/evidence/is,
    /route does not bind sessions/i,
    /route does not execute Codex/i,
    /route does not create work items\/events/i,
    /route does not mutate\s+imported context rows/is,
    /confirmed mapping rows/is,
    /proposal rows/is,
    /route adds no UI/i,
    /created` -> HTTP 201/i,
    /duplicate_candidate` -> HTTP 409/i,
    /Authority Boundary/i,
    /Non-Goals/i,
    /browser verification skipped: no rendered UI\/operator surface changed in this reconciliation candidate route slice/i,
  ]) {
    assert.match(docs, pattern, `route docs must include ${pattern}`);
  }

  for (const pointerDocPath of pointerDocPaths) {
    const pointerDocs = readFileSync(pointerDocPath, "utf8");
    assert.match(
      pointerDocs,
      /AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1\.md/,
      `${path.basename(pointerDocPath)} must point to candidate route doc`,
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

async function assertRouteFailureNoWrite({
  name,
  response,
  expectedHttpStatus,
  expectedPayloadStatus,
  expectedCandidateRows,
  expectedImportedRows,
  expectedProposalRows,
  expectedMappingRows,
  protectedBefore,
  fixture,
  beforeSnapshot,
}) {
  const before = beforeSnapshot ?? sideEffectSnapshot(dbPath, fixture);
  const routeResponse = await response();
  const payload = await routeResponse.json();
  assert.equal(routeResponse.status, expectedHttpStatus, name);
  assert.equal(payload.ok, false, name);
  if (expectedPayloadStatus) {
    assert.equal(payload.result.status, expectedPayloadStatus, name);
    assertCandidateAuthorityBoundary(payload.authority_boundary, false);
  } else {
    assert.equal(payload.result, undefined, name);
  }
  assert.equal(countRows(dbPath, tableName), expectedCandidateRows, name);
  assert.equal(countRows(dbPath, importedTableName), expectedImportedRows, name);
  assert.equal(countRows(dbPath, proposalTableName), expectedProposalRows, name);
  assert.equal(countRows(dbPath, mappingTableName), expectedMappingRows, name);
  assertProtectedCounts(dbPath, protectedBefore, name);
  assertSideEffectsUnchanged(dbPath, fixture, before);
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
      foreignWorkId: `AG-RECONCILIATION-CANDIDATE-ROUTE-${key.toUpperCase()}`,
      runtimeInstanceId: `runtime-instance:reconciliation-candidate-route-${key}`,
    }),
  );
  const candidate = buildCandidateFromPacket(packet, {
    candidate_id: `candidate:${key}`,
    local_scope: "project:augnes",
    local_work_id: `AG-LOCAL-RECONCILIATION-CANDIDATE-ROUTE-${key.toUpperCase()}`,
  });
  seedLocalWorkItem(dbPath, candidate);

  const proposal = createAgWorkResumeMappingProposalRecord(
    buildProposalCreateInput(packet, candidate, {
      proposal_reason: `User/Core requested reconciliation candidate route fixture ${key}.`,
    }),
  );
  assert.equal(proposal.ok, true, `proposal fixture ${key} should be created`);

  const mapping = createAgWorkResumeConfirmedMapping(
    buildConfirmedInput(proposal.record, {
      confirmed_by: "user-core:reconciliation-candidate-route-fixture",
      confirmation_reason: `User/Core confirmed route fixture mapping ${key}.`,
      confirmed_at: `2026-06-01T02:${String(fixtureMinute(key)).padStart(2, "0")}:00.000Z`,
    }),
  );
  assert.equal(mapping.ok, true, `confirmed mapping fixture ${key} should be created`);

  const imported = createAgWorkResumeImportedContext(
    buildImportedInput(mapping.record, key, {
      created_at: `2026-06-01T02:${String(fixtureMinute(key)).padStart(2, "0")}:30.000Z`,
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

function buildRouteInput(fixture, overrides = {}) {
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
      `Bounded reconciliation candidate route summary for fixture ${fixture.key}.`,
    redaction_status: overrides.redaction_status ?? safeRedactionStatus(),
    proposed_by:
      overrides.proposed_by ?? "user-core:reconciliation-candidate-route-smoke",
    proposed_reason:
      overrides.proposed_reason ??
      `User/Core proposed reconciliation candidate through route for ${fixture.key}.`,
    ...(overrides.created_at !== undefined ? { created_at: overrides.created_at } : {}),
  };
}

function buildImportedInput(mapping, key, overrides = {}) {
  return {
    mapping_id: mapping.mapping_id,
    packet_id: mapping.packet_id,
    packet_hash: mapping.packet_hash,
    imported_summary: `Bounded imported context summary for reconciliation candidate route fixture ${key}.`,
    imported_expected_files: [
      "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1.md",
    ],
    imported_expected_checks: [
      "npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-route",
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
    created_by: "user-core:reconciliation-candidate-route-smoke",
    import_reason:
      "User/Core imported bounded context before reconciliation candidate route creation.",
    created_at: overrides.created_at,
  };
}

function buildConfirmedInput(proposal, overrides = {}) {
  return {
    source_proposal_id: proposal.proposal_id,
    confirmed_by: overrides.confirmed_by ?? "user-core:reconciliation-candidate-route-smoke",
    confirmation_reason:
      overrides.confirmation_reason ??
      "User/Core confirmed mapping before reconciliation candidate route creation.",
    confirmed_at: overrides.confirmed_at,
  };
}

function buildProposalCreateInput(packet, candidate, overrides = {}) {
  return {
    packet,
    candidates: [candidate],
    selected_candidate_id: candidate.candidate_id,
    proposed_by: "user-core:reconciliation-candidate-route-smoke",
    proposal_reason:
      overrides.proposal_reason ??
      "User/Core requested a durable proposal for later reconciliation candidate route review.",
    status: "proposed",
    expires_at: null,
    source: {
      reviewed_by_surface: "codex",
      reviewed_at: "2026-06-01T02:00:00.000Z",
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
      as_of: "2026-06-01T02:00:00.000Z",
      framing: {
        work_id: "Trace anchor only.",
        state_authority: "Augnes committed state remains authority.",
        execution_proof: "Action records remain proof.",
        temporal_proof: "Temporal graph remains proof over time.",
      },
      work: {
        work_id: foreignWorkId,
        scope,
        title: `Reconciliation candidate route fixture ${key}`,
        status: "in_progress",
        priority: "now",
        summary: "Create a reconciliation candidate route smoke fixture.",
        next_action: "Create bounded reconciliation candidate metadata.",
        user_attention_required: false,
        related_state_keys: ["coordination.ag_resume_reconciliation_candidate_route"],
        links: {
          docs: [
            "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1.md",
          ],
        },
        created_at: "2026-06-01T02:00:00.000Z",
        updated_at: "2026-06-01T02:00:00.000Z",
      },
      next_action: "Create bounded reconciliation candidate metadata.",
      user_attention_required: false,
      recent_events: [],
      related_state_keys: ["coordination.ag_resume_reconciliation_candidate_route"],
      related_proof: {
        action_ids: [],
        action_records: [],
        docs: [
          "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1.md",
        ],
        note: "No local proof is imported by reconciliation candidate metadata.",
      },
      codex_handoff: {
        task_brief: "Implement reconciliation candidate create route.",
        constraints: ["No UI.", "No proof/evidence.", "No Codex execution."],
        suggested_verification: [
          "npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-route",
        ],
      },
    },
    stateBrief: {
      runtime: "augnes",
      scope,
      as_of: "2026-06-01T02:00:00.000Z",
      generated_at: "2026-06-01T02:00:00.000Z",
      agent_instructions: ["Keep AG Resume reconciliation candidate route authority gated."],
      agent_handoff: {
        current_status: {
          notable_state_keys: ["coordination.ag_resume_reconciliation_candidate_route"],
        },
        next_recommended_action: {
          related_state_keys: ["coordination.ag_resume_reconciliation_candidate_route"],
        },
        codex_handoff: {
          task_brief: "Implement reconciliation candidate create route.",
          constraints: ["No UI.", "No proof/evidence.", "No Codex execution."],
          likely_files: [
            "app/api/ag-work-resume/proof-evidence-reconciliation-candidates/route.ts",
          ],
          verification_commands: [
            "npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-route",
          ],
        },
      },
    },
    handoffDraft: {
      handoff_id: `handoff:reconciliation-candidate-route-smoke:${key}`,
      status: "ready",
      expected_files: [
        "app/api/ag-work-resume/proof-evidence-reconciliation-candidates/route.ts",
      ],
      expected_checks: [
        "npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-route",
      ],
      expected_execution_surfaces: [],
      forbidden_surfaces: ["proof/evidence", "session binding", "Codex execution"],
      stop_conditions: [
        "Reconciliation candidate route output grants downstream authority.",
      ],
      safety_boundaries: [
        "Reconciliation candidate creation is only bounded review metadata.",
      ],
    },
    git: {
      remote: "https://github.com/hynk-studio/augnes.git",
      base_branch: "main",
      base_commit: "98ee395",
      working_branch: "codex/ag-resume-reconciliation-candidate-route",
      head_commit: "reconciliation-candidate-route",
      related_pr: null,
      dirty_worktree: false,
    },
    issuer: {
      runtime_instance_id: runtimeInstanceId,
      source_local_label: `source-local-reconciliation-candidate-route-${key}`,
      created_by_surface: "reconciliation-candidate-route-smoke",
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
      links: JSON.stringify({ source: "reconciliation-candidate-route-smoke" }),
      created_at: "2026-06-01T02:00:00.000Z",
      updated_at: "2026-06-01T02:00:00.000Z",
    });
  } finally {
    db.close();
  }
}

function jsonRequest(value) {
  return new Request(routeUrl(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(value),
  });
}

function routeUrl() {
  return "http://localhost/api/ag-work-resume/proof-evidence-reconciliation-candidates";
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
    ).run(status, "2026-06-01T03:39:00.000Z", importId);
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

function isPathInside(candidatePath, parentPath) {
  const relative = path.relative(parentPath, candidatePath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}
