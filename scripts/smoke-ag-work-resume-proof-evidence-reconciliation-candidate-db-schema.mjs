import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const smokePath = fileURLToPath(import.meta.url);
const smokeRelativePath =
  "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-db-schema.mjs";
const writerSmokeRelativePath =
  "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-writer.mjs";
const writerHelperRelativePath =
  "scripts/ag-work-resume-proof-evidence-reconciliation-candidate-create.mjs";
const designSmokeRelativePath =
  "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-db-schema-design.mjs";
const reconciliationSmokeRelativePath =
  "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-design.mjs";
const gateSmokeRelativePath =
  "scripts/smoke-ag-work-resume-proof-evidence-session-codex-gates-design.mjs";
const writerCoreRelativePath =
  "lib/ag-work-resume-proof-evidence-reconciliation-candidate.ts";
const schemaPath = path.join(rootDir, "lib", "db", "schema.sql");
const packagePath = path.join(rootDir, "package.json");
const writerDocRelativePath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md";
const implementationDocRelativePath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_IMPLEMENTATION_V0_1.md";
const designDocRelativePath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_DESIGN_V0_1.md";
const reconciliationDocRelativePath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md";
const gateDocRelativePath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md";
const implementationDocPath = path.join(rootDir, implementationDocRelativePath);
const designDocPath = path.join(rootDir, designDocRelativePath);
const pointerDocRelativePaths = [
  designDocRelativePath,
  reconciliationDocRelativePath,
  gateDocRelativePath,
  "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_CREATE_COCKPIT_PANEL_V0_1.md",
  "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_COCKPIT_PANEL_V0_1.md",
  "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1.md",
  "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md",
  "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md",
  "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
];

const tableName = "ag_work_resume_proof_evidence_reconciliation_candidates";
const tempDir = mkdtempSync(
  path.join(os.tmpdir(), "augnes-ag-resume-reconciliation-candidate-schema-"),
);
const tempDbPath = path.join(tempDir, "augnes.db");

try {
  for (const file of [
    smokePath,
    schemaPath,
    packagePath,
    path.join(rootDir, writerCoreRelativePath),
    path.join(rootDir, writerHelperRelativePath),
    path.join(rootDir, writerSmokeRelativePath),
    path.join(rootDir, writerDocRelativePath),
    implementationDocPath,
    designDocPath,
    ...pointerDocRelativePaths.map((relativePath) => path.join(rootDir, relativePath)),
  ]) {
    assert.ok(existsSync(file), `${file} must exist`);
  }

  const smokeSource = readFileSync(smokePath, "utf8");
  assertNoForbiddenSmokeImports(smokeSource);

  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  assert.equal(
    packageJson.scripts?.[
      "smoke:ag-work-resume-proof-evidence-reconciliation-candidate-db-schema"
    ],
    "node scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-db-schema.mjs",
    "package.json must expose candidate DB/schema smoke",
  );

  const schemaSource = readFileSync(schemaPath, "utf8");
  assertSchemaSource(schemaSource);
  assertDocs();
  assertNoCandidateReadRouteUi();

  runNpmScript("db:reset", tempDbPath);
  inspectMigratedDatabase(tempDbPath, "reset");

  runNpmScript("db:migrate", tempDbPath);
  runNpmScript("db:migrate", tempDbPath);
  inspectMigratedDatabase(tempDbPath, "idempotent");

  assertNoUnexpectedChangedFiles();
  assertNoRuntimeImplementationCode();

  console.log(
    JSON.stringify(
      {
        smoke: "ag-work-resume-proof-evidence-reconciliation-candidate-db-schema",
        temp_db_path: tempDbPath,
        cases: [
          "package script is present",
          "schema source creates candidate table and indexes only",
          "implementation and pointer docs pass",
          "table exists in isolated temp DB",
          "columns match expected order and names",
          "NOT NULL fields and JSON text defaults are present",
          "created_at and updated_at defaults are present",
          "record_kind/schema/status/foreign_ref_type CHECK constraints fail closed",
          "incomplete rows fail closed",
          "valid direct fixture insert succeeds inside a savepoint only",
          "fixture insert rolls back and leaves zero candidate rows",
          "lookup indexes exist",
          "db:migrate is idempotent",
          "migration creates no proof/evidence/session/Codex/work/imported-context/confirmed-mapping/proposal rows",
    "no forbidden legacy candidate route/UI files exist",
          "schema smoke uses direct DB insert only for schema validation, not runtime writer behavior",
          "source guard limits changed files to schema, docs, package, smoke, writer/helper, route, and narrow design-smoke compatibility",
        ],
      },
      null,
      2,
    ),
  );
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function assertSchemaSource(source) {
  const tableBlock = extractTableBlock(source);
  const indexSource = source.slice(source.indexOf(`CREATE TABLE IF NOT EXISTS ${tableName}`));

  assert.match(
    source,
    /CREATE TABLE IF NOT EXISTS ag_work_resume_proof_evidence_reconciliation_candidates/,
    "schema must create candidate table",
  );

  for (const column of requiredColumns()) {
    assert.match(
      tableBlock,
      new RegExp(`\\b${escapeRegExp(column)}\\b`),
      `schema table must include column ${column}`,
    );
  }

  for (const pattern of [
    /candidate_id TEXT PRIMARY KEY/i,
    /record_kind TEXT NOT NULL CHECK\s*\(\s*record_kind = 'ag_work_resume_proof_evidence_reconciliation_candidate'\s*\)/is,
    /schema TEXT NOT NULL CHECK\s*\(\s*schema = 'augnes\.ag_work_resume_proof_evidence_reconciliation_candidate\.v0_1'\s*\)/is,
    /status TEXT NOT NULL CHECK\s*\(\s*status IN\s*\(\s*'proposed',\s*'accepted_for_future_recording',\s*'rejected',\s*'deferred',\s*'superseded',\s*'withdrawn',\s*'revoked'\s*\)\s*\)/is,
    /foreign_ref_type TEXT NOT NULL CHECK\s*\(\s*foreign_ref_type IN\s*\(\s*'proof',\s*'evidence',\s*'action',\s*'session',\s*'git',\s*'evidence_pack',\s*'handoff',\s*'other'\s*\)\s*\)/is,
    /redaction_status TEXT NOT NULL DEFAULT '\{\}'/i,
    /authority_boundary TEXT NOT NULL DEFAULT '\{\}'/i,
    /created_at TEXT NOT NULL DEFAULT\s+\(strftime\('%Y-%m-%dT%H:%M:%fZ', 'now'\)\)/i,
    /updated_at TEXT NOT NULL DEFAULT\s+\(strftime\('%Y-%m-%dT%H:%M:%fZ', 'now'\)\)/i,
  ]) {
    assert.match(tableBlock, pattern, `schema table must include ${pattern}`);
  }

  assert.doesNotMatch(
    tableBlock,
    /FOREIGN KEY/i,
    "candidate schema must not add foreign keys in this foundation slice",
  );

  for (const indexName of requiredIndexes()) {
    assert.match(
      indexSource,
      new RegExp(`\\b${escapeRegExp(indexName)}\\b`),
      `schema must include index ${indexName}`,
    );
  }
}

function inspectMigratedDatabase(dbPath, phase) {
  const db = openDb(dbPath);
  try {
    assert.equal(tableExists(db, tableName), true, `${phase}: table must exist`);
    assert.equal(
      tableExists(db, "ag_work_resume_imported_contexts"),
      true,
      `${phase}: imported context table must still exist`,
    );
    assert.equal(
      tableExists(db, "ag_work_resume_confirmed_mappings"),
      true,
      `${phase}: confirmed mapping table must still exist`,
    );
    assertColumns(db);
    assertIndexes(db);
    assert.equal(
      countRows(db, tableName),
      0,
      `${phase}: migration must not create candidate rows`,
    );
    assertProtectedTablesHaveNoRows(db, phase);
    assertConstraintFailures(db);
    assertFixtureInsertRollsBack(db);
  } finally {
    db.close();
  }
}

function assertColumns(db) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  const names = columns.map((column) => column.name);
  assert.deepEqual(names, requiredColumns(), "candidate columns must match");

  const byName = new Map(columns.map((column) => [column.name, column]));
  for (const name of [
    "record_kind",
    "schema",
    "status",
    "import_id",
    "mapping_id",
    "foreign_ref_type",
    "foreign_ref_id",
    "local_target_scope",
    "local_target_work_id",
    "summary",
    "redaction_status",
    "proposed_by",
    "proposed_reason",
    "authority_boundary",
    "created_at",
    "updated_at",
  ]) {
    assert.equal(byName.get(name)?.notnull, 1, `${name} must be NOT NULL`);
  }
  assert.equal(byName.get("candidate_id")?.pk, 1, "candidate_id must be primary key");

  for (const [name, defaultValue] of [
    ["redaction_status", "'{}'"],
    ["authority_boundary", "'{}'"],
  ]) {
    assert.equal(
      byName.get(name)?.dflt_value,
      defaultValue,
      `${name} default must be ${defaultValue}`,
    );
  }

  assert.match(
    byName.get("created_at")?.dflt_value ?? "",
    /strftime\('%Y-%m-%dT%H:%M:%fZ', 'now'\)/,
    "created_at must default to ISO-like timestamp",
  );
  assert.match(
    byName.get("updated_at")?.dflt_value ?? "",
    /strftime\('%Y-%m-%dT%H:%M:%fZ', 'now'\)/,
    "updated_at must default to ISO-like timestamp",
  );
}

function assertIndexes(db) {
  const indexes = db.prepare(`PRAGMA index_list(${tableName})`).all();
  const indexNames = new Set(indexes.map((index) => index.name));
  for (const indexName of requiredIndexes()) {
    assert.ok(indexNames.has(indexName), `index ${indexName} must exist`);
  }
  for (const [indexName, expectedColumns] of Object.entries(requiredIndexColumns())) {
    const columns = db
      .prepare(`PRAGMA index_info(${indexName})`)
      .all()
      .map((column) => column.name);
    assert.deepEqual(columns, expectedColumns, `${indexName} columns must match`);
  }
}

function assertConstraintFailures(db) {
  assert.throws(
    () => insertCandidate(db, { candidate_id: "candidate:invalid-kind", record_kind: "proof" }),
    /CHECK constraint failed/i,
    "record_kind CHECK must reject non-candidate kind",
  );
  assert.throws(
    () =>
      insertCandidate(db, {
        candidate_id: "candidate:invalid-schema",
        schema: "augnes.ag_work_resume_imported_context.v0_1",
      }),
    /CHECK constraint failed/i,
    "schema CHECK must reject imported context schema",
  );
  assert.throws(
    () => insertCandidate(db, { candidate_id: "candidate:invalid-status", status: "active" }),
    /CHECK constraint failed/i,
    "status CHECK must reject active",
  );
  assert.throws(
    () =>
      insertCandidate(db, {
        candidate_id: "candidate:invalid-foreign-type",
        foreign_ref_type: "raw_payload",
      }),
    /CHECK constraint failed/i,
    "foreign_ref_type CHECK must reject raw_payload",
  );
  assert.throws(
    () => {
      db.prepare(`INSERT INTO ${tableName} (candidate_id) VALUES (?)`).run(
        "candidate:incomplete",
      );
    },
    /NOT NULL constraint failed/i,
    "required NOT NULL fields must reject incomplete rows",
  );
  assert.equal(
    countRows(db, tableName),
    0,
    "failed constraint fixtures must not create candidate rows",
  );
}

function assertFixtureInsertRollsBack(db) {
  db.exec("SAVEPOINT reconciliation_candidate_schema_fixture");
  try {
    insertCandidate(db, { candidate_id: "candidate:fixture" });
    const row = db
      .prepare(`SELECT * FROM ${tableName} WHERE candidate_id = ?`)
      .get("candidate:fixture");
    assert.equal(row.status, "proposed");
    assert.equal(
      row.record_kind,
      "ag_work_resume_proof_evidence_reconciliation_candidate",
    );
    assert.equal(
      row.schema,
      "augnes.ag_work_resume_proof_evidence_reconciliation_candidate.v0_1",
    );
    assert.equal(row.foreign_ref_type, "proof");
    assert.equal(row.redaction_status, "{}");
    assert.equal(row.authority_boundary, "{}");
    assert.equal(
      row.summary,
      "Schema smoke direct DB insert fixture, not runtime writer behavior.",
    );
    assertIsoTimestamp(row.created_at, "created_at");
    assertIsoTimestamp(row.updated_at, "updated_at");
    assert.equal(
      countRows(db, tableName),
      1,
      "schema smoke fixture savepoint contains one direct candidate row",
    );
    assertProtectedTablesHaveNoRows(db, "savepoint-fixture");
  } finally {
    db.exec("ROLLBACK TO reconciliation_candidate_schema_fixture");
    db.exec("RELEASE reconciliation_candidate_schema_fixture");
  }

  assert.equal(
    countRows(db, tableName),
    0,
    "schema smoke rolls back direct candidate fixture rows",
  );
  assertProtectedTablesHaveNoRows(db, "post-fixture");
}

function assertProtectedTablesHaveNoRows(db, phase) {
  for (const table of [
    "sessions",
    "work_items",
    "work_events",
    "action_records",
    "verification_evidence_records",
    "ag_work_resume_imported_contexts",
    "ag_work_resume_confirmed_mappings",
    "ag_work_resume_mapping_proposals",
  ]) {
    assert.equal(countRows(db, table), 0, `${phase}: ${table} must have no rows`);
  }
}

function assertDocs() {
  const implementationDoc = readFileSync(implementationDocPath, "utf8");
  const designDoc = readFileSync(designDocPath, "utf8");

  for (const pattern of [
    /schema foundation only/i,
    /implements only the SQLite table and indexes/i,
    /ag_work_resume_proof_evidence_reconciliation_candidates/i,
    /idx_ag_reconciliation_candidates_import_time/i,
    /idx_ag_reconciliation_candidates_mapping_time/i,
    /idx_ag_reconciliation_candidates_foreign_ref/i,
    /idx_ag_reconciliation_candidates_local_target_time/i,
    /idx_ag_reconciliation_candidates_status_time/i,
    /idx_ag_reconciliation_candidates_proposed_by_time/i,
    /idx_ag_reconciliation_candidates_reviewed_by_time/i,
    /idx_ag_reconciliation_candidates_supersedes/i,
    /idx_ag_reconciliation_candidates_superseded_by/i,
    /JSON text fields/i,
    /redaction_status/i,
    /authority_boundary/i,
    /does not add database-level foreign keys/i,
    /future writer validation must require/i,
    /imported context exists/i,
    /imported context status is allowed for reconciliation/i,
    /`mapping_id` matches the imported context/i,
    /local target work identity exists/i,
    /redaction status is safe/i,
    /foreign ref is a bounded summary, not a raw payload/i,
    /actor is present/i,
    /reason is present/i,
    /duplicate candidate policy/i,
    /idempotent SQL/i,
    /creates no reconciliation candidate rows during migration/i,
    /accepted_for_future_recording.*not proof\/evidence recording/is,
    /No proof\/evidence recording/i,
    /No session binding/i,
    /No Codex execution or continuation/i,
    /No work item or work event creation/i,
    /No imported context mutation/i,
    /No confirmed mapping mutation/i,
    /No proposal mutation/i,
    /No approval, publish, retry, replay, merge/i,
    /browser verification skipped: no rendered UI\/operator surface changed in this schema-only proof\/evidence reconciliation candidate slice/i,
  ]) {
    assert.match(
      implementationDoc,
      pattern,
      `implementation doc must include ${pattern}`,
    );
  }

  assert.match(
    designDoc,
    /AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_IMPLEMENTATION_V0_1\.md/,
    "design doc must point to implementation doc",
  );

  for (const relativePath of pointerDocRelativePaths) {
    const source = readFileSync(path.join(rootDir, relativePath), "utf8");
    assert.match(
      source,
      /AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_IMPLEMENTATION_V0_1\.md/,
      `${relativePath} must point to candidate schema implementation doc`,
    );
  }
}

function assertNoCandidateReadRouteUi() {
  for (const relativePath of [
    "app/api/ag-work-resume/reconciliation-candidates/route.ts",
    "components/ag-work-resume-proof-evidence-reconciliation-candidate.tsx",
  ]) {
    assert.equal(
      existsSync(path.join(rootDir, relativePath)),
      false,
      `${relativePath} must not exist in candidate writer/schema slice`,
    );
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
    "lib/db/schema.sql",
    writerCoreRelativePath,
    writerDocRelativePath,
    implementationDocRelativePath,
    designDocRelativePath,
    reconciliationDocRelativePath,
    gateDocRelativePath,
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_CREATE_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
    smokeRelativePath,
    writerSmokeRelativePath,
    writerHelperRelativePath,
    designSmokeRelativePath,
    reconciliationSmokeRelativePath,
    gateSmokeRelativePath,
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
      `changed file is outside candidate schema foundation slice: ${file}`,
    );
    assert.ok(
      file === "lib/db/schema.sql" ||
        file === writerCoreRelativePath ||
        file === "lib/ag-work-resume-proof-evidence-reconciliation-candidate-read.ts" ||
        !file.startsWith("lib/"),
      `lib changes are limited to schema.sql or candidate writer/read core in this slice: ${file}`,
    );
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
      `candidate schema follow-up must not touch forbidden path except candidate create route: ${file}`,
    );
  }
}

function assertNoRuntimeImplementationCode() {
  const runtimeFiles = [
    ...gitLinesAllowFailure(["diff", "--name-only", "origin/main...HEAD"]),
    ...gitLines(["diff", "--name-only"]),
    ...gitLines(["diff", "--cached", "--name-only"]),
    ...gitLines(["ls-files", "--others", "--exclude-standard"]),
  ].filter(
    (file) =>
      !file.startsWith("docs/") &&
      file !== "package.json" &&
      file !== "lib/db/schema.sql" &&
      file !== writerCoreRelativePath &&
      file !== "lib/ag-work-resume-proof-evidence-reconciliation-candidate-read.ts" &&
      file !== smokeRelativePath &&
      file !== writerSmokeRelativePath &&
      file !== writerHelperRelativePath &&
      file !== "scripts/ag-work-resume-proof-evidence-reconciliation-candidate-read.mjs" &&
      file !== "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-read.mjs" &&
      file !== designSmokeRelativePath &&
      file !== reconciliationSmokeRelativePath &&
      file !== gateSmokeRelativePath &&
      file !== "scripts/smoke-ag-work-resume-imported-context-route.mjs" &&
      file !== "scripts/smoke-ag-work-resume-imported-context-writer.mjs" &&
      file !==
        "app/api/ag-work-resume/proof-evidence-reconciliation-candidates/route.ts" &&
      file !== "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-route.mjs" &&
      file !== "components/augnes-cockpit.tsx" &&
      file !==
        "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-read-cockpit-panel-verification.md" &&
      file !==
        "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-create-cockpit-panel-verification.md" &&
      file !==
        "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-create-cockpit-panel.mjs" &&
      file !==
        "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-read-cockpit-panel.mjs",
  );
  assert.deepEqual(
    [...new Set(runtimeFiles)],
    [],
    `candidate schema follow-up must not change runtime implementation files outside candidate writer core/helper: ${runtimeFiles.join(", ")}`,
  );
}

function runNpmScript(scriptName, dbPath) {
  const result = spawnSync("npm", ["run", scriptName], {
    cwd: rootDir,
    env: {
      ...process.env,
      AUGNES_DB_PATH: dbPath,
    },
    encoding: "utf8",
  });
  assert.equal(
    result.status,
    0,
    `${scriptName} must pass for temp DB ${dbPath}\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
  );
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    new RegExp(escapeRegExp(dbPath)),
    `${scriptName} output should mention the temp DB path`,
  );
}

function insertCandidate(db, overrides = {}) {
  const record = {
    candidate_id: overrides.candidate_id ?? "candidate:default",
    record_kind: "ag_work_resume_proof_evidence_reconciliation_candidate",
    schema: "augnes.ag_work_resume_proof_evidence_reconciliation_candidate.v0_1",
    status: overrides.status ?? "proposed",
    import_id: "ag-resume-imported-context:fixture",
    mapping_id: "ag-resume-confirmed-mapping:fixture",
    foreign_ref_type: overrides.foreign_ref_type ?? "proof",
    foreign_ref_id: "foreign-proof:fixture",
    local_target_scope: "project:augnes",
    local_target_work_id: "AG-LOCAL-1",
    summary: "Schema smoke direct DB insert fixture, not runtime writer behavior.",
    proposed_by: "user-core:schema-smoke",
    proposed_reason:
      "User/Core schema smoke reason for bounded reconciliation candidate review metadata.",
    ...overrides,
  };
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
        proposed_by,
        proposed_reason
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
        @proposed_by,
        @proposed_reason
      )
    `,
  ).run(record);
}

function openDb(dbPath) {
  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  return db;
}

function tableExists(db, name) {
  return Boolean(
    db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(name),
  );
}

function countRows(db, name) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${name}`).get().count;
}

function assertIsoTimestamp(value, field) {
  assert.match(
    value,
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    `${field} must use ISO-like strftime timestamp`,
  );
}

function extractTableBlock(source) {
  const start = source.indexOf(`CREATE TABLE IF NOT EXISTS ${tableName}`);
  assert.notEqual(start, -1, "candidate table block must exist");
  const endMarker =
    "\n);\n\nCREATE INDEX IF NOT EXISTS idx_ag_reconciliation_candidates_import_time";
  const end = source.indexOf(endMarker, start);
  assert.notEqual(end, -1, "candidate table must end before first index");
  return source.slice(start, end + 3);
}

function requiredColumns() {
  return [
    "candidate_id",
    "record_kind",
    "schema",
    "status",
    "import_id",
    "mapping_id",
    "foreign_ref_type",
    "foreign_ref_id",
    "local_target_scope",
    "local_target_work_id",
    "summary",
    "redaction_status",
    "proposed_by",
    "proposed_reason",
    "reviewed_by",
    "reviewed_at",
    "review_note",
    "supersedes_candidate_id",
    "superseded_by_candidate_id",
    "authority_boundary",
    "created_at",
    "updated_at",
  ];
}

function requiredIndexes() {
  return [
    "idx_ag_reconciliation_candidates_import_time",
    "idx_ag_reconciliation_candidates_mapping_time",
    "idx_ag_reconciliation_candidates_foreign_ref",
    "idx_ag_reconciliation_candidates_local_target_time",
    "idx_ag_reconciliation_candidates_status_time",
    "idx_ag_reconciliation_candidates_proposed_by_time",
    "idx_ag_reconciliation_candidates_reviewed_by_time",
    "idx_ag_reconciliation_candidates_supersedes",
    "idx_ag_reconciliation_candidates_superseded_by",
  ];
}

function requiredIndexColumns() {
  return {
    idx_ag_reconciliation_candidates_import_time: ["import_id", "created_at"],
    idx_ag_reconciliation_candidates_mapping_time: ["mapping_id", "created_at"],
    idx_ag_reconciliation_candidates_foreign_ref: [
      "foreign_ref_type",
      "foreign_ref_id",
    ],
    idx_ag_reconciliation_candidates_local_target_time: [
      "local_target_scope",
      "local_target_work_id",
      "created_at",
    ],
    idx_ag_reconciliation_candidates_status_time: ["status", "created_at"],
    idx_ag_reconciliation_candidates_proposed_by_time: ["proposed_by", "created_at"],
    idx_ag_reconciliation_candidates_reviewed_by_time: [
      "reviewed_by",
      "reviewed_at",
    ],
    idx_ag_reconciliation_candidates_supersedes: ["supersedes_candidate_id"],
    idx_ag_reconciliation_candidates_superseded_by: [
      "superseded_by_candidate_id",
    ],
  };
}

function assertNoForbiddenSmokeImports(source) {
  const importStatements = [
    ...source.matchAll(/^\s*import\s+[^;]+;$/gm),
    ...source.matchAll(/\bimport\(\s*["'][^"']+["']\s*\)/g),
  ].map((match) => match[0]);
  const importText = importStatements.join("\n");
  for (const forbidden of [
    /node:http/i,
    /node:https/i,
    /node:net/i,
    /node:tls/i,
    /node:dgram/i,
    /app\/api/i,
    /\/api\//i,
    /components\//i,
    /apps\/augnes_apps/i,
  ]) {
    assert.doesNotMatch(
      importText,
      forbidden,
      `smoke source must not import ${forbidden}`,
    );
  }
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
