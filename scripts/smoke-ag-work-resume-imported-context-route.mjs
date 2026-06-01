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
  "imported-contexts",
  "route.ts",
);
const writerPath = path.join(rootDir, "lib", "ag-work-resume-imported-context.ts");
const docsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md",
);
const packagePath = path.join(rootDir, "package.json");
const schemaPath = path.join(rootDir, "lib", "db", "schema.sql");
const pointerDocPaths = [
  path.join(rootDir, "docs", "AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md"),
  path.join(rootDir, "docs", "AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_IMPLEMENTATION_V0_1.md"),
  path.join(rootDir, "docs", "AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_DESIGN_V0_1.md"),
  path.join(rootDir, "docs", "AG_WORK_RESUME_IMPORTED_CONTEXT_RECORD_DESIGN_V0_1.md"),
  path.join(rootDir, "docs", "AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md"),
];
const tableName = "ag_work_resume_imported_contexts";
const mappingTableName = "ag_work_resume_confirmed_mappings";
const proposalTableName = "ag_work_resume_mapping_proposals";
const tempDir = mkdtempSync(
  path.join(os.tmpdir(), "augnes-ag-resume-imported-context-route-"),
);
const dbPath = path.join(tempDir, "augnes.db");

process.env.AUGNES_DB_PATH = dbPath;
process.env.OPENAI_API_KEY = "smoke-openai-key-must-not-be-used";

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("AG resume imported context route smoke must not call fetch.");
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

  const { buildAgWorkResumePacketPreview } = await import("../lib/ag-work-resume-packet.ts");
  const {
    createAgWorkResumeMappingProposalRecord,
  } = await import("../lib/ag-work-resume-mapping-proposal-record.ts");
  const {
    createAgWorkResumeConfirmedMapping,
  } = await import("../lib/ag-work-resume-confirmed-mapping.ts");
  const { GET, POST } = await import(
    "../app/api/ag-work-resume/imported-contexts/route.ts"
  );
  assert.equal(typeof POST, "function", "imported context route must expose POST");
  assert.equal(typeof GET, "function", "imported context route must expose GET");

  const createFixture = (key, options = {}) =>
    createConfirmedMappingFixture({
      key,
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
      createAgWorkResumeConfirmedMapping,
      ...options,
    });

  const fixtures = {
    derived: createFixture("route-derived"),
    explicit: createFixture("route-explicit"),
    validation: createFixture("route-validation"),
    inactive: createFixture("route-inactive", { mappingStatus: "revoked" }),
    mismatch: createFixture("route-mismatch"),
  };
  let expectedImportedRows = countRows(dbPath, tableName);

  const derivedBefore = sideEffectSnapshot(dbPath, fixtures.derived);
  const derivedResponse = await POST(
    jsonRequest(
      buildRouteInput(fixtures.derived, {
        created_at: "2026-06-01T02:00:00.000Z",
      }),
    ),
  );
  const derivedPayload = await derivedResponse.json();
  assert.equal(derivedResponse.status, 201);
  assert.equal(derivedPayload.ok, true);
  assert.equal(derivedPayload.route, "ag_work_resume_imported_contexts.v0_1");
  assert.equal(derivedPayload.result.status, "created");
  assert.equal(derivedPayload.result.record.mapping_id, fixtures.derived.mapping_id);
  assert.equal(
    derivedPayload.result.record.foreign_scope,
    fixtures.derived.mapping.foreign_scope,
  );
  assert.equal(
    derivedPayload.result.record.foreign_work_id,
    fixtures.derived.mapping.foreign_work_id,
  );
  assert.equal(
    derivedPayload.result.record.local_scope,
    fixtures.derived.mapping.local_scope,
  );
  assert.equal(
    derivedPayload.result.record.local_work_id,
    fixtures.derived.mapping.local_work_id,
  );
  assert.equal(
    derivedPayload.result.record.source_runtime_instance_id,
    fixtures.derived.mapping.source_runtime_instance_id,
  );
  assert.deepEqual(derivedPayload.result.record.imported_expected_files, [
    "docs/imported-context-route.md",
  ]);
  assert.deepEqual(derivedPayload.result.record.imported_expected_checks, [
    "npm run smoke:ag-work-resume-imported-context-route",
  ]);
  assert.equal(
    derivedPayload.result.record.foreign_refs_summary.foreign_proof_ref,
    "proof:foreign-public-safe",
  );
  assert.match(derivedPayload.recommended_next_step, /not proof\/evidence/i);
  assertImportedAuthorityBoundary(derivedPayload.authority_boundary, true);
  assertImportedAuthorityBoundary(derivedPayload.result.authority_boundary, true);
  expectedImportedRows += 1;
  assert.equal(countRows(dbPath, tableName), expectedImportedRows);
  assertSideEffectsUnchanged(dbPath, fixtures.derived, derivedBefore);

  const explicitBefore = sideEffectSnapshot(dbPath, fixtures.explicit);
  const explicitResponse = await POST(
    jsonRequest(
      buildRouteInput(fixtures.explicit, {
        foreign_scope: fixtures.explicit.mapping.foreign_scope,
        foreign_work_id: fixtures.explicit.mapping.foreign_work_id,
        local_scope: fixtures.explicit.mapping.local_scope,
        local_work_id: fixtures.explicit.mapping.local_work_id,
        source_runtime_instance_id:
          fixtures.explicit.mapping.source_runtime_instance_id,
        created_at: "2026-06-01T02:01:00.000Z",
      }),
    ),
  );
  const explicitPayload = await explicitResponse.json();
  assert.equal(explicitResponse.status, 201);
  assert.equal(explicitPayload.ok, true);
  assert.equal(explicitPayload.result.status, "created");
  assert.equal(explicitPayload.result.record.mapping_id, fixtures.explicit.mapping_id);
  expectedImportedRows += 1;
  assert.equal(countRows(dbPath, tableName), expectedImportedRows);
  assertSideEffectsUnchanged(dbPath, fixtures.explicit, explicitBefore);

  const protectedBeforeFailures = snapshotProtectedCounts(dbPath);
  const proposalRowsBeforeFailures = countRows(dbPath, proposalTableName);
  const mappingRowsBeforeFailures = countRows(dbPath, mappingTableName);

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
    expectedImportedRows,
    expectedProposalRows: proposalRowsBeforeFailures,
    expectedMappingRows: mappingRowsBeforeFailures,
    protectedBefore: protectedBeforeFailures,
    fixture: fixtures.validation,
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
    expectedImportedRows,
    expectedProposalRows: proposalRowsBeforeFailures,
    expectedMappingRows: mappingRowsBeforeFailures,
    protectedBefore: protectedBeforeFailures,
    fixture: fixtures.validation,
  });
  await assertRouteFailureNoWrite({
    name: "non-object JSON",
    response: () => POST(jsonRequest([])),
    expectedHttpStatus: 400,
    expectedPayloadStatus: null,
    expectedImportedRows,
    expectedProposalRows: proposalRowsBeforeFailures,
    expectedMappingRows: mappingRowsBeforeFailures,
    protectedBefore: protectedBeforeFailures,
    fixture: fixtures.validation,
  });

  for (const invalidCase of [
    {
      name: "unknown db field",
      body: { ...buildRouteInput(fixtures.validation), db: {} },
      httpStatus: 400,
      resultStatus: null,
    },
    {
      name: "unknown now field",
      body: {
        ...buildRouteInput(fixtures.validation),
        now: "2026-06-01T02:02:00.000Z",
      },
      httpStatus: 400,
      resultStatus: null,
    },
    {
      name: "missing mapping_id",
      body: omit(buildRouteInput(fixtures.validation), "mapping_id"),
      httpStatus: 400,
      resultStatus: "invalid_input",
    },
    {
      name: "missing packet_id",
      body: omit(buildRouteInput(fixtures.validation), "packet_id"),
      httpStatus: 400,
      resultStatus: "invalid_input",
    },
    {
      name: "missing packet_hash",
      body: omit(buildRouteInput(fixtures.validation), "packet_hash"),
      httpStatus: 400,
      resultStatus: "invalid_input",
    },
    {
      name: "missing imported_summary",
      body: omit(buildRouteInput(fixtures.validation), "imported_summary"),
      httpStatus: 400,
      resultStatus: "invalid_input",
    },
    {
      name: "missing created_by",
      body: omit(buildRouteInput(fixtures.validation), "created_by"),
      httpStatus: 400,
      resultStatus: "invalid_input",
    },
    {
      name: "missing import_reason",
      body: omit(buildRouteInput(fixtures.validation), "import_reason"),
      httpStatus: 400,
      resultStatus: "invalid_input",
    },
    {
      name: "malformed created_at",
      body: {
        ...buildRouteInput(fixtures.validation),
        created_at: "2026-06-01T02:03:00Z",
      },
      httpStatus: 400,
      resultStatus: "invalid_input",
    },
    {
      name: "invalid expected files",
      body: {
        ...buildRouteInput(fixtures.validation),
        imported_expected_files: ["docs/ok.md", 7],
      },
      httpStatus: 400,
      resultStatus: "invalid_input",
    },
    {
      name: "invalid expected checks",
      body: {
        ...buildRouteInput(fixtures.validation),
        imported_expected_checks: ["npm run ok", false],
      },
      httpStatus: 400,
      resultStatus: "invalid_input",
    },
    {
      name: "invalid foreign_refs_summary",
      body: {
        ...buildRouteInput(fixtures.validation),
        foreign_refs_summary: [],
      },
      httpStatus: 400,
      resultStatus: "invalid_input",
    },
    {
      name: "missing redaction_report",
      body: omit(buildRouteInput(fixtures.validation), "redaction_report"),
      httpStatus: 400,
      resultStatus: "redaction_blocked",
    },
    {
      name: "unsafe redaction report",
      body: {
        ...buildRouteInput(fixtures.validation),
        redaction_report: { ...safeRedactionReport(), secrets_included: true },
      },
      httpStatus: 400,
      resultStatus: "redaction_blocked",
    },
    {
      name: "mapping missing",
      body: {
        ...buildRouteInput(fixtures.validation),
        mapping_id: "ag-resume-confirmed-mapping:missing",
      },
      httpStatus: 404,
      resultStatus: "mapping_not_found",
    },
    {
      name: "mapping inactive",
      body: buildRouteInput(fixtures.inactive),
      httpStatus: 409,
      resultStatus: "mapping_not_active",
      fixture: fixtures.inactive,
    },
    {
      name: "mapping mismatch",
      body: {
        ...buildRouteInput(fixtures.mismatch),
        foreign_work_id: "AG-IMPORTED-CONTEXT-ROUTE-MISMATCH",
      },
      httpStatus: 409,
      resultStatus: "mapping_mismatch",
      fixture: fixtures.mismatch,
    },
  ]) {
    await assertRouteFailureNoWrite({
      name: invalidCase.name,
      response: () => POST(jsonRequest(invalidCase.body)),
      expectedHttpStatus: invalidCase.httpStatus,
      expectedPayloadStatus: invalidCase.resultStatus,
      expectedImportedRows,
      expectedProposalRows: proposalRowsBeforeFailures,
      expectedMappingRows: mappingRowsBeforeFailures,
      protectedBefore: protectedBeforeFailures,
      fixture: invalidCase.fixture ?? fixtures.validation,
    });
  }

  assertNoForbiddenRows(dbPath);
  assert.equal(fetchCalls, 0, "route implementation must not call fetch/network");

  console.log(
    JSON.stringify(
      {
        smoke: "ag-work-resume-imported-context-route",
        temp_db_path: dbPath,
        cases: [
          "package route smoke script is present",
          "route source imports only imported context writer core and NextResponse",
          "docs and pointer guards pass",
          "route creates one imported context from active confirmed mapping",
          "omitted optional foreign/local fields derive from mapping",
          "explicit matching fields are accepted",
          "expected files/checks and foreign refs are accepted",
          "wrong content-type, invalid JSON, and non-object JSON fail closed",
          "db and now body fields fail closed",
          "missing required fields fail closed",
          "malformed created_at fails closed",
          "expected files/checks and foreign refs validation fails closed",
          "redaction report blocks unsafe or missing context",
          "missing, inactive, and mismatched mappings fail closed",
          "failure cases do not create imported context rows",
          "confirmed mapping, source proposal, and local work rows are unchanged",
          "work/proof/evidence/session tables receive no route rows",
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
    routePath,
    writerPath,
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
    packageJson.scripts?.["smoke:ag-work-resume-imported-context-route"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-imported-context-route.mjs",
  );
}

function assertSourceGuards() {
  const routeSource = readFileSync(routePath, "utf8");
  const routeImportText = extractImportText(routeSource);
  assert.match(
    routeImportText,
    /@\/lib\/ag-work-resume-imported-context/,
    "route must import imported context writer core",
  );
  assert.match(
    routeImportText,
    /@\/lib\/ag-work-resume-imported-context-read/,
    "route must import imported context read core",
  );
  assert.match(routeImportText, /next\/server/, "route must import NextResponse");
  for (const forbidden of [
    /ag-work-resume-confirmed-mapping/i,
    /ag-work-resume-mapping-proposal/i,
    /node:http/i,
    /node:https/i,
    /node:net/i,
    /node:tls/i,
  ]) {
    assert.doesNotMatch(routeImportText, forbidden, `route import guard forbids ${forbidden}`);
  }
  for (const forbidden of [
    /fetch\s*\(/i,
    /OpenAI/i,
    /GITHUB_TOKEN/i,
    /localStorage|sessionStorage|indexedDB/i,
    /Direct Resume Code/i,
    /relay/i,
    /createEvidenceRecord|recordEvidence|recordProof|bindSession|ensureSession|insertWorkItem|insertWorkEvent/i,
    /executeCodex|runCodex/i,
    /createAgWorkResumeConfirmedMapping/i,
    /createAgWorkResumeMappingProposalRecord/i,
    /\bdb\s*:/i,
    /\bnow\s*:/i,
  ]) {
    assert.doesNotMatch(routeSource, forbidden, `route source guard forbids ${forbidden}`);
  }
  assert.doesNotMatch(routeSource, /["']db["']\s*,/, "HTTP body must not allow db");
  assert.doesNotMatch(routeSource, /["']now["']\s*,/, "HTTP body must not allow now");

  const changedFiles = gitChangedFiles();
  const allowedFiles = new Set([
    "app/api/ag-work-resume/imported-contexts/route.ts",
    "lib/ag-work-resume-imported-context-read.ts",
    "scripts/ag-work-resume-imported-context-read.mjs",
    "scripts/smoke-ag-work-resume-imported-context-read.mjs",
    "components/augnes-cockpit.tsx",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_CREATE_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_COCKPIT_PANEL_V0_1.md",
    "reports/browser/2026-06-01-ag-work-resume-imported-context-create-cockpit-panel-verification.md",
    "reports/browser/2026-06-01-ag-work-resume-imported-context-read-cockpit-panel-verification.md",
    "scripts/smoke-ag-work-resume-imported-context-create-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-imported-context-read-cockpit-panel.mjs",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1.md",
    "scripts/smoke-ag-work-resume-imported-context-route.mjs",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md",
    "package.json",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_IMPLEMENTATION_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_RECORD_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
    "scripts/smoke-ag-work-resume-imported-context-writer.mjs",
    "scripts/smoke-ag-work-resume-imported-context-db-schema.mjs",
    "scripts/smoke-ag-work-resume-imported-context-db-schema-design.mjs",
    "scripts/smoke-ag-work-resume-imported-context-record-design.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-writer.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-route.mjs",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_IMPLEMENTATION_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md",
    "lib/ag-work-resume-proof-evidence-reconciliation-candidate.ts",
    "scripts/ag-work-resume-proof-evidence-reconciliation-candidate-create.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-writer.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-db-schema.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-db-schema-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-session-codex-gates-design.mjs",
    "app/api/ag-work-resume/proof-evidence-reconciliation-candidates/route.ts",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_V0_1.md",
    "lib/ag-work-resume-proof-evidence-reconciliation-candidate-read.ts",
    "scripts/ag-work-resume-proof-evidence-reconciliation-candidate-read.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-read.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-route.mjs",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_CREATE_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_COCKPIT_PANEL_V0_1.md",
    "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-create-cockpit-panel-verification.md",
    "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-read-cockpit-panel-verification.md",
    "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-verification.md",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-create-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-read-cockpit-panel.mjs",
    "app/api/ag-work-resume/proof-evidence-reconciliation-candidates/lifecycle-actions/route.ts",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTIONS_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTION_COCKPIT_PANEL_V0_1.md",
    "lib/ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.ts",
    "scripts/ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-route.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-cockpit-panel.mjs",
  ]);
  for (const file of changedFiles) {
    assert.ok(
      allowedFiles.has(file),
      `changed file is outside imported context route slice: ${file}`,
    );
    assert.ok(
      file === "app/api/ag-work-resume/imported-contexts/route.ts" ||
        file ===
          "app/api/ag-work-resume/proof-evidence-reconciliation-candidates/route.ts" ||
        file ===
          "app/api/ag-work-resume/proof-evidence-reconciliation-candidates/lifecycle-actions/route.ts" ||
        !file.startsWith("app/"),
      `app changes limited to imported context route or reconciliation candidate routes: ${file}`,
    );
    assert.ok(
      file === "components/augnes-cockpit.tsx" || !file.startsWith("components/"),
      `component changes limited to imported context read Cockpit panel: ${file}`,
    );
    assert.equal(file.startsWith("migrations/"), false, `no migration change: ${file}`);
    assert.equal(file.startsWith("apps/"), false, `no MCP/App change: ${file}`);
    assert.ok(
      file ===
        "reports/browser/2026-06-01-ag-work-resume-imported-context-read-cockpit-panel-verification.md" ||
        file ===
          "reports/browser/2026-06-01-ag-work-resume-imported-context-create-cockpit-panel-verification.md" ||
        file ===
          "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-read-cockpit-panel-verification.md" ||
        file ===
          "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-create-cockpit-panel-verification.md" ||
        file ===
          "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-verification.md" ||
        !file.startsWith("reports/browser/"),
      `browser report changes limited to imported context Cockpit panels: ${file}`,
    );
    assert.notEqual(file, "lib/db/schema.sql", "schema.sql must be unchanged");
    assert.ok(
      file === "lib/ag-work-resume-imported-context-read.ts" ||
        file === "lib/ag-work-resume-proof-evidence-reconciliation-candidate.ts" ||
        file === "lib/ag-work-resume-proof-evidence-reconciliation-candidate-read.ts" ||
        file === "lib/ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.ts" ||
        !file.startsWith("lib/"),
      `lib changes limited to imported context read core and reconciliation candidate writer/read/lifecycle core: ${file}`,
    );
  }
}

function assertDocsGuard() {
  const docs = readFileSync(docsPath, "utf8");
  for (const pattern of [
    /Purpose/i,
    /POST \/api\/ag-work-resume\/imported-contexts/i,
    /content-type: application\/json/i,
    /Invalid JSON is rejected/i,
    /Non-object JSON bodies are rejected/i,
    /Unknown body fields are rejected/i,
    /may not supply `db` or `now`/i,
    /delegates validation.*to `createAgWorkResumeImportedContext`/is,
    /mapping_id/i,
    /packet_id/i,
    /packet_hash/i,
    /imported_summary/i,
    /imported_expected_files/i,
    /imported_expected_checks/i,
    /foreign_refs_summary/i,
    /redaction_report/i,
    /created_by/i,
    /import_reason.*why user\/Core created or imported this bounded review\s+metadata/is,
    /created` -> HTTP 201/i,
    /invalid_input` -> HTTP 400/i,
    /mapping_not_found` -> HTTP 404/i,
    /mapping_not_active` -> HTTP 409/i,
    /mapping_mismatch` -> HTTP 409/i,
    /redaction_blocked` -> HTTP 400/i,
    /db_error` -> HTTP 500/i,
    /route creates imported context review metadata rows only/i,
    /does not record proof\/evidence/i,
    /does not bind sessions/i,
    /does not execute Codex/i,
    /does not create work items or work events/i,
    /does not mutate confirmed mapping rows/i,
    /does not mutate proposal rows/i,
    /does not add UI/i,
    /AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1\.md/i,
    /browser verification skipped: no rendered UI\/operator surface changed in this imported context route slice/i,
  ]) {
    assert.match(docs, pattern, `route docs must include ${pattern}`);
  }

  for (const pointerDocPath of pointerDocPaths) {
    const pointerDocs = readFileSync(pointerDocPath, "utf8");
    assert.match(
      pointerDocs,
      /AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1\.md/,
      `${path.basename(pointerDocPath)} must point to imported context route doc`,
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

function createConfirmedMappingFixture({
  key,
  mappingStatus = "active",
  buildAgWorkResumePacketPreview,
  createAgWorkResumeMappingProposalRecord,
  createAgWorkResumeConfirmedMapping,
}) {
  const packet = buildAgWorkResumePacketPreview(
    buildFixtureInput({
      key,
      foreignWorkId: `AG-IMPORTED-CONTEXT-ROUTE-${key.toUpperCase()}`,
      runtimeInstanceId: `runtime-instance:imported-context-route-${key}`,
    }),
  );
  const candidate = buildCandidateFromPacket(packet, {
    candidate_id: `candidate:${key}`,
    local_scope: "project:augnes",
    local_work_id: `AG-LOCAL-IMPORTED-CONTEXT-ROUTE-${key.toUpperCase()}`,
  });
  seedLocalWorkItem(dbPath, candidate);

  const proposal = createAgWorkResumeMappingProposalRecord(
    buildProposalCreateInput(packet, candidate, {
      proposal_reason: `User/Core requested imported context route fixture ${key}.`,
    }),
  );
  assert.equal(proposal.ok, true, `proposal fixture ${key} should be created`);

  const mapping = createAgWorkResumeConfirmedMapping(
    buildConfirmedInput(proposal.record, {
      confirmed_by: "user-core:imported-context-route-fixture",
      confirmation_reason: `User/Core confirmed route fixture mapping ${key}.`,
      confirmed_at: `2026-06-01T01:${String(fixtureMinute(key)).padStart(2, "0")}:00.000Z`,
    }),
  );
  assert.equal(mapping.ok, true, `confirmed mapping fixture ${key} should be created`);

  if (mappingStatus !== "active") {
    updateMappingStatus(dbPath, mapping.record.mapping_id, mappingStatus);
  }

  return {
    key,
    packet,
    candidate,
    proposal_id: proposal.record.proposal_id,
    proposal: readProposalRow(dbPath, proposal.record.proposal_id),
    mapping_id: mapping.record.mapping_id,
    mapping: readMappingRow(dbPath, mapping.record.mapping_id),
  };
}

function buildRouteInput(fixture, overrides = {}) {
  const hasOverride = (key) => Object.prototype.hasOwnProperty.call(overrides, key);
  return {
    mapping_id: fixture.mapping_id,
    packet_id: fixture.mapping.packet_id,
    packet_hash: fixture.mapping.packet_hash,
    imported_summary:
      overrides.imported_summary ??
      `Bounded imported context route summary for fixture ${fixture.key}.`,
    ...(hasOverride("imported_expected_files")
      ? { imported_expected_files: overrides.imported_expected_files }
      : { imported_expected_files: ["docs/imported-context-route.md"] }),
    ...(hasOverride("imported_expected_checks")
      ? { imported_expected_checks: overrides.imported_expected_checks }
      : {
          imported_expected_checks: [
            "npm run smoke:ag-work-resume-imported-context-route",
          ],
        }),
    ...(hasOverride("foreign_refs_summary")
      ? { foreign_refs_summary: overrides.foreign_refs_summary }
      : { foreign_refs_summary: { foreign_proof_ref: "proof:foreign-public-safe" } }),
    redaction_report: overrides.redaction_report ?? safeRedactionReport(),
    created_by: overrides.created_by ?? "user-core:imported-context-route-smoke",
    import_reason:
      overrides.import_reason ??
      `User/Core imported bounded route context for fixture ${fixture.key}.`,
    ...(overrides.source_runtime_instance_id !== undefined
      ? { source_runtime_instance_id: overrides.source_runtime_instance_id }
      : {}),
    ...(overrides.foreign_scope !== undefined
      ? { foreign_scope: overrides.foreign_scope }
      : {}),
    ...(overrides.foreign_work_id !== undefined
      ? { foreign_work_id: overrides.foreign_work_id }
      : {}),
    ...(overrides.local_scope !== undefined
      ? { local_scope: overrides.local_scope }
      : {}),
    ...(overrides.local_work_id !== undefined
      ? { local_work_id: overrides.local_work_id }
      : {}),
    ...(overrides.created_at !== undefined ? { created_at: overrides.created_at } : {}),
  };
}

function buildConfirmedInput(proposal, overrides = {}) {
  return {
    source_proposal_id: proposal.proposal_id,
    confirmed_by:
      overrides.confirmed_by ?? "user-core:imported-context-route-smoke",
    confirmation_reason:
      overrides.confirmation_reason ??
      "User/Core confirmed mapping before imported context route creation.",
    confirmed_at: overrides.confirmed_at,
  };
}

async function assertRouteFailureNoWrite({
  name,
  response,
  expectedHttpStatus,
  expectedPayloadStatus,
  expectedImportedRows,
  expectedProposalRows,
  expectedMappingRows,
  protectedBefore,
  fixture,
}) {
  const beforeImportedRows = countRows(dbPath, tableName);
  const beforeSnapshot = sideEffectSnapshot(dbPath, fixture);
  const routeResponse = await response();
  const payload = await routeResponse.json();
  assert.equal(routeResponse.status, expectedHttpStatus, name);
  assert.equal(payload.ok, false, name);
  if (expectedPayloadStatus) {
    assert.equal(payload.result.status, expectedPayloadStatus, name);
    assertImportedAuthorityBoundary(payload.authority_boundary, false);
  } else {
    assert.equal("result" in payload, false, name);
  }
  assert.equal(countRows(dbPath, tableName), beforeImportedRows, name);
  assert.equal(countRows(dbPath, tableName), expectedImportedRows, name);
  assert.equal(countRows(dbPath, proposalTableName), expectedProposalRows, name);
  assert.equal(countRows(dbPath, mappingTableName), expectedMappingRows, name);
  assertProtectedCounts(dbPath, protectedBefore, name);
  assertSideEffectsUnchanged(dbPath, fixture, beforeSnapshot);
}

function routeUrl() {
  return "http://localhost/api/ag-work-resume/imported-contexts";
}

function jsonRequest(body) {
  return new Request(routeUrl(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function sideEffectSnapshot(targetDbPath, fixture) {
  return {
    protectedCounts: snapshotProtectedCounts(targetDbPath),
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
    "work_items",
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
      links: JSON.stringify({ source: "imported-context-route-smoke" }),
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
    proposed_by: "user-core:imported-context-route-smoke",
    proposal_reason:
      overrides.proposal_reason ??
      "User/Core requested a durable proposal for later imported context route review.",
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
        title: `Imported context route fixture ${key}`,
        status: "in_progress",
        priority: "now",
        summary: "Create an imported context route smoke fixture.",
        next_action: "Create bounded imported review metadata through route.",
        user_attention_required: false,
        related_state_keys: ["coordination.ag_resume_imported_context"],
        links: {
          docs: ["docs/AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md"],
        },
        created_at: "2026-06-01T01:00:00.000Z",
        updated_at: "2026-06-01T01:00:00.000Z",
      },
      next_action: "Create bounded imported review metadata through route.",
      user_attention_required: false,
      recent_events: [],
      related_state_keys: ["coordination.ag_resume_imported_context"],
      related_proof: {
        action_ids: [],
        action_records: [],
        docs: ["docs/AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md"],
        note: "No local proof is imported by imported context.",
      },
      codex_handoff: {
        task_brief: "Implement imported context route.",
        constraints: ["No UI.", "No proof/evidence.", "No Codex execution."],
        suggested_verification: [
          "npm run smoke:ag-work-resume-imported-context-route",
        ],
      },
    },
    stateBrief: {
      runtime: "augnes",
      scope,
      as_of: "2026-06-01T01:00:00.000Z",
      generated_at: "2026-06-01T01:00:00.000Z",
      agent_instructions: ["Keep AG Resume mapping/import authority gated."],
      agent_handoff: {
        current_status: {
          notable_state_keys: ["coordination.ag_resume_imported_context"],
        },
        next_recommended_action: {
          related_state_keys: ["coordination.ag_resume_imported_context"],
        },
        codex_handoff: {
          task_brief: "Implement imported context route.",
          constraints: ["No UI.", "No proof/evidence.", "No Codex execution."],
          likely_files: [
            "app/api/ag-work-resume/imported-contexts/route.ts",
            "scripts/smoke-ag-work-resume-imported-context-route.mjs",
          ],
          verification_commands: [
            "npm run smoke:ag-work-resume-imported-context-route",
          ],
        },
      },
    },
    handoffDraft: {
      handoff_id: `handoff:imported-context-route-smoke:${key}`,
      status: "ready",
      expected_files: [
        "app/api/ag-work-resume/imported-contexts/route.ts",
        "scripts/smoke-ag-work-resume-imported-context-route.mjs",
      ],
      expected_checks: [
        "npm run smoke:ag-work-resume-imported-context-route",
      ],
      expected_execution_surfaces: [],
      forbidden_surfaces: ["proof/evidence", "session binding", "Codex execution"],
      stop_conditions: ["Imported context route output grants downstream authority."],
      safety_boundaries: [
        "Imported context creation is only bounded review metadata.",
      ],
    },
    git: {
      remote: "https://github.com/hynk-studio/augnes.git",
      base_branch: "main",
      base_commit: "0c873b4",
      working_branch: "codex/ag-resume-imported-context-route",
      head_commit: "imported-context-route",
      related_pr: null,
      dirty_worktree: false,
    },
    issuer: {
      runtime_instance_id: runtimeInstanceId,
      source_local_label: `source-local-imported-context-route-${key}`,
      created_by_surface: "imported-context-route-smoke",
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

function updateMappingStatus(targetDbPath, mappingId, status) {
  const db = new Database(targetDbPath);
  try {
    db.prepare(
      `UPDATE ${mappingTableName} SET status = ?, updated_at = ? WHERE mapping_id = ?`,
    ).run(status, "2026-06-01T01:30:00.000Z", mappingId);
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

function assertImportedAuthorityBoundary(boundary, created) {
  assert.equal(boundary.imported_context_created, created);
  assert.equal(boundary.review_metadata_only, true);
  assert.equal(boundary.confirmed_mapping_required, true);
  for (const key of [
    "confirmed_mapping_updated",
    "proposal_record_updated",
    "work_item_created",
    "work_event_created",
    "proof_recorded",
    "evidence_recorded",
    "session_bound",
    "codex_executed",
    "approval_granted",
    "publish_retry_replay_authority",
    "merge_authority",
  ]) {
    assert.equal(boundary[key], false, `${key} must be false`);
  }
  assert.equal(boundary.durable_approval, "user/Core gated");
  assert.match(boundary.statement, /bounded review metadata only/i);
  assert.match(boundary.statement, /not proof\/evidence\/session\/Codex\/merge authority/i);
}

function safeRedactionReport() {
  return {
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

function gitChangedFiles() {
  const diffResult = spawnSync("git", ["diff", "--name-only"], {
    cwd: rootDir,
    encoding: "utf8",
  });
  const cachedResult = spawnSync("git", ["diff", "--cached", "--name-only"], {
    cwd: rootDir,
    encoding: "utf8",
  });
  const untrackedResult = spawnSync("git", ["ls-files", "--others", "--exclude-standard"], {
    cwd: rootDir,
    encoding: "utf8",
  });
  if (diffResult.status !== 0 || cachedResult.status !== 0 || untrackedResult.status !== 0) return [];
  return `${diffResult.stdout}\n${cachedResult.stdout}\n${untrackedResult.stdout}`
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function isPathInside(childPath, parentPath) {
  const relative = path.relative(parentPath, childPath);
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}
