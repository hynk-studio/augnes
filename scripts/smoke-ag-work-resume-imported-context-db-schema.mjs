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
const schemaPath = path.join(rootDir, "lib", "db", "schema.sql");
const packagePath = path.join(rootDir, "package.json");
const implementationDocPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_IMPLEMENTATION_V0_1.md",
);
const designDocPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_DESIGN_V0_1.md",
);
const recordDesignDocPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_IMPORTED_CONTEXT_RECORD_DESIGN_V0_1.md",
);
const gateDocPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
);

const tableName = "ag_work_resume_imported_contexts";
const tempDir = mkdtempSync(
  path.join(os.tmpdir(), "augnes-ag-resume-imported-context-schema-"),
);
const tempDbPath = path.join(tempDir, "augnes.db");

try {
  for (const file of [
    smokePath,
    schemaPath,
    packagePath,
    implementationDocPath,
    designDocPath,
    recordDesignDocPath,
    gateDocPath,
  ]) {
    assert.ok(existsSync(file), `${file} must exist`);
  }

  const smokeSource = readFileSync(smokePath, "utf8");
  assertNoForbiddenSmokeSource(smokeSource);

  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  assert.equal(
    packageJson.scripts?.["smoke:ag-work-resume-imported-context-db-schema"],
    "node scripts/smoke-ag-work-resume-imported-context-db-schema.mjs",
    "package.json must expose imported context DB/schema smoke",
  );

  const schemaSource = readFileSync(schemaPath, "utf8");
  assertSchemaSource(schemaSource);
  assertDocs();
  assertNoImportedContextReadOrUiSurfaces();

  runNpmScript("db:reset", tempDbPath);
  inspectMigratedDatabase(tempDbPath, "reset");

  runNpmScript("db:migrate", tempDbPath);
  runNpmScript("db:migrate", tempDbPath);
  inspectMigratedDatabase(tempDbPath, "idempotent");

  assertNoUnexpectedChangedFiles();

  console.log(
    JSON.stringify(
      {
        smoke: "ag-work-resume-imported-context-db-schema",
        temp_db_path: tempDbPath,
        package_script_present: true,
        schema_source_guard_passed: true,
        table_and_indexes_present: true,
        constraints_passed: true,
        fixture_insert_rolled_back: true,
        migration_idempotency_passed: true,
        no_route_read_ui_surface_passed: true,
        docs_guard_passed: true,
        source_guard_passed: true,
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
    /CREATE TABLE IF NOT EXISTS ag_work_resume_imported_contexts/,
    "schema must create ag_work_resume_imported_contexts",
  );

  for (const column of requiredColumns()) {
    assert.match(
      tableBlock,
      new RegExp(`\\b${escapeRegExp(column)}\\b`),
      `schema table must include column ${column}`,
    );
  }

  for (const pattern of [
    /import_id TEXT PRIMARY KEY/i,
    /record_kind TEXT NOT NULL CHECK\s*\(\s*record_kind = 'ag_work_resume_imported_context'\s*\)/is,
    /schema TEXT NOT NULL CHECK\s*\(\s*schema = 'augnes\.ag_work_resume_imported_context\.v0_1'\s*\)/is,
    /status TEXT NOT NULL CHECK\s*\(\s*status IN\s*\(\s*'review_metadata',\s*'superseded',\s*'withdrawn',\s*'revoked'\s*\)\s*\)/is,
    /imported_expected_files TEXT NOT NULL DEFAULT '\[\]'/i,
    /imported_expected_checks TEXT NOT NULL DEFAULT '\[\]'/i,
    /foreign_refs_summary TEXT NOT NULL DEFAULT '\{\}'/i,
    /redaction_report TEXT NOT NULL DEFAULT '\{\}'/i,
    /authority_boundary TEXT NOT NULL DEFAULT '\{\}'/i,
    /import_reason TEXT NOT NULL/i,
    /created_at TEXT NOT NULL DEFAULT\s+\(strftime\('%Y-%m-%dT%H:%M:%fZ', 'now'\)\)/i,
    /updated_at TEXT NOT NULL DEFAULT\s+\(strftime\('%Y-%m-%dT%H:%M:%fZ', 'now'\)\)/i,
  ]) {
    assert.match(tableBlock, pattern, `schema table must include ${pattern}`);
  }

  assert.doesNotMatch(
    tableBlock,
    /FOREIGN KEY/i,
    "imported context table must not add foreign keys in this slice",
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
      tableExists(db, "ag_work_resume_confirmed_mappings"),
      true,
      `${phase}: confirmed mapping table must still exist`,
    );
    assertColumns(db);
    assertIndexes(db);
    assert.equal(
      countRows(db, tableName),
      0,
      `${phase}: migration must not create imported context rows`,
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
  assert.deepEqual(names, requiredColumns(), "imported context columns must match");

  const byName = new Map(columns.map((column) => [column.name, column]));
  for (const name of [
    "record_kind",
    "schema",
    "status",
    "mapping_id",
    "foreign_scope",
    "foreign_work_id",
    "local_scope",
    "local_work_id",
    "packet_id",
    "packet_hash",
    "imported_summary",
    "imported_expected_files",
    "imported_expected_checks",
    "foreign_refs_summary",
    "redaction_report",
    "created_by",
    "import_reason",
    "created_at",
    "updated_at",
    "authority_boundary",
  ]) {
    assert.equal(byName.get(name)?.notnull, 1, `${name} must be NOT NULL`);
  }
  assert.equal(byName.get("import_id")?.pk, 1, "import_id must be primary key");
  for (const [name, defaultValue] of [
    ["imported_expected_files", "'[]'"],
    ["imported_expected_checks", "'[]'"],
    ["foreign_refs_summary", "'{}'"],
    ["redaction_report", "'{}'"],
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
    () => insertImportedContext(db, { import_id: "imported:invalid-status", status: "active" }),
    /CHECK constraint failed/i,
    "status CHECK must reject active",
  );
  assert.throws(
    () =>
      insertImportedContext(db, {
        import_id: "imported:invalid-kind",
        record_kind: "ag_work_resume_confirmed_mapping",
      }),
    /CHECK constraint failed/i,
    "record_kind CHECK must reject confirmed mapping kind",
  );
  assert.throws(
    () =>
      insertImportedContext(db, {
        import_id: "imported:invalid-schema",
        schema: "augnes.ag_work_resume_confirmed_mapping.v0_1",
      }),
    /CHECK constraint failed/i,
    "schema CHECK must reject confirmed mapping schema",
  );
  assert.throws(
    () => {
      db.prepare(`INSERT INTO ${tableName} (import_id) VALUES (?)`).run(
        "imported:incomplete",
      );
    },
    /NOT NULL constraint failed/i,
    "required NOT NULL fields must reject incomplete rows",
  );
  assert.equal(
    countRows(db, tableName),
    0,
    "failed constraint fixtures must not create imported context rows",
  );
}

function assertFixtureInsertRollsBack(db) {
  db.exec("SAVEPOINT imported_context_schema_fixture");
  try {
    insertImportedContext(db, { import_id: "imported:fixture" });
    const row = db
      .prepare(`SELECT * FROM ${tableName} WHERE import_id = ?`)
      .get("imported:fixture");
    assert.equal(row.status, "review_metadata");
    assert.equal(row.record_kind, "ag_work_resume_imported_context");
    assert.equal(row.schema, "augnes.ag_work_resume_imported_context.v0_1");
    assert.equal(row.imported_expected_files, "[]");
    assert.equal(row.imported_expected_checks, "[]");
    assert.equal(row.foreign_refs_summary, "{}");
    assert.equal(row.redaction_report, "{}");
    assert.equal(row.authority_boundary, "{}");
    assert.equal(
      row.import_reason,
      "User/Core schema smoke reason for bounded imported context review metadata.",
    );
    assertIsoTimestamp(row.created_at, "created_at");
    assertIsoTimestamp(row.updated_at, "updated_at");
    assert.equal(
      countRows(db, tableName),
      1,
      "schema smoke fixture savepoint contains one direct imported context row",
    );
    assert.equal(
      countRows(db, "ag_work_resume_confirmed_mappings"),
      0,
      "direct imported context fixture must not create confirmed mapping rows",
    );
  } finally {
    db.exec("ROLLBACK TO imported_context_schema_fixture");
    db.exec("RELEASE imported_context_schema_fixture");
  }

  assert.equal(
    countRows(db, tableName),
    0,
    "schema smoke rolls back direct imported context fixture rows",
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
    "ag_work_resume_mapping_proposals",
    "ag_work_resume_confirmed_mappings",
  ]) {
    assert.equal(countRows(db, table), 0, `${phase}: ${table} must have no rows`);
  }
}

function assertDocs() {
  const implementationDoc = readFileSync(implementationDocPath, "utf8");
  const designDoc = readFileSync(designDocPath, "utf8");
  const recordDesignDoc = readFileSync(recordDesignDocPath, "utf8");
  const gateDoc = readFileSync(gateDocPath, "utf8");

  for (const pattern of [
    /schema foundation/i,
    /implements only the SQLite table and indexes/i,
    /ag_work_resume_imported_contexts/i,
    /idx_ag_imported_contexts_mapping_time/i,
    /idx_ag_imported_contexts_foreign_time/i,
    /idx_ag_imported_contexts_local_time/i,
    /idx_ag_imported_contexts_packet_hash/i,
    /idx_ag_imported_contexts_status_time/i,
    /idx_ag_imported_contexts_created_by_time/i,
    /import_reason TEXT NOT NULL/i,
    /import_reason` records why user\/Core created or imported this bounded review\s+metadata/is,
    /JSON text fields/i,
    /does not add a DB foreign key/i,
    /future writer.*mapping exists/is,
    /mapping status is `active`/i,
    /packet_id` and `packet_hash`/i,
    /redaction report excludes secrets, raw DB paths, raw session payloads, and\s+raw proof payloads/is,
    /idempotent SQL/i,
    /creates no imported context rows during migration/i,
    /No proof\/evidence/i,
    /No session binding/i,
    /No Codex execution or continuation/i,
    /No work item or work event creation/i,
    /No confirmed mapping mutation/i,
    /No proposal mutation/i,
    /No approval, publish, retry, replay, or merge/i,
    /browser verification skipped: no rendered UI\/operator surface changed in this schema-only imported context slice/i,
  ]) {
    assert.match(
      implementationDoc,
      pattern,
      `implementation doc must include ${pattern}`,
    );
  }

  for (const [label, source] of [
    ["design doc", designDoc],
    ["record design doc", recordDesignDoc],
    ["import authority gate doc", gateDoc],
  ]) {
    assert.match(
      source,
      /AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_IMPLEMENTATION_V0_1\.md/,
      `${label} must point to implementation doc`,
    );
  }
}

function assertNoImportedContextReadOrUiSurfaces() {
  for (const relativePath of [
    "lib/ag-work-resume-imported-context-read.ts",
    "scripts/ag-work-resume-imported-context-read.mjs",
  ]) {
    assert.equal(
      existsSync(path.join(rootDir, relativePath)),
      false,
      `${relativePath} must not exist in imported context schema/create-route slice`,
    );
  }
}

function assertNoUnexpectedChangedFiles() {
  const changedFiles = new Set([
    ...gitLines(["diff", "--name-only"]),
    ...gitLines(["diff", "--cached", "--name-only"]),
    ...gitLines(["ls-files", "--others", "--exclude-standard"]),
  ]);
  const allowedFiles = new Set([
    "lib/db/schema.sql",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_IMPLEMENTATION_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_RECORD_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
    "lib/ag-work-resume-imported-context.ts",
    "scripts/ag-work-resume-imported-context-create.mjs",
    "scripts/smoke-ag-work-resume-imported-context-writer.mjs",
    "scripts/smoke-ag-work-resume-imported-context-db-schema.mjs",
    "scripts/smoke-ag-work-resume-imported-context-db-schema-design.mjs",
    "scripts/smoke-ag-work-resume-imported-context-record-design.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-create-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-read-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-read.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-route.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-writer.mjs",
    "app/api/ag-work-resume/imported-contexts/route.ts",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md",
    "scripts/smoke-ag-work-resume-imported-context-route.mjs",
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
      `changed file is outside imported context schema slice: ${file}`,
    );
    assert.ok(
      file === "lib/db/schema.sql" ||
        file === "lib/ag-work-resume-imported-context.ts" ||
        !file.startsWith("lib/"),
      `lib changes limited to schema.sql or imported context writer core in this slice: ${file}`,
    );
    assert.ok(
      file === "app/api/ag-work-resume/imported-contexts/route.ts" ||
        !forbiddenPrefixes.some((prefix) => file.startsWith(prefix)),
      `imported context schema follow-up must not touch forbidden path outside create route: ${file}`,
    );
  }
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

function insertImportedContext(db, overrides = {}) {
  const record = {
    import_id: overrides.import_id ?? "imported:default",
    record_kind: "ag_work_resume_imported_context",
    schema: "augnes.ag_work_resume_imported_context.v0_1",
    status: overrides.status ?? "review_metadata",
    mapping_id: "ag-resume-confirmed-mapping:fixture",
    foreign_scope: "project:source",
    foreign_work_id: "AG-FOREIGN-1",
    local_scope: "project:augnes",
    local_work_id: "AG-LOCAL-1",
    packet_id: "resume-packet:fixture",
    packet_hash: "sha256:fixture",
    imported_summary: "Schema smoke direct DB insert fixture, not runtime writer behavior.",
    created_by: "user-core:schema-smoke",
    import_reason: "User/Core schema smoke reason for bounded imported context review metadata.",
    ...overrides,
  };
  db.prepare(
    `
      INSERT INTO ${tableName} (
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
        imported_summary,
        created_by,
        import_reason
      )
      VALUES (
        @import_id,
        @record_kind,
        @schema,
        @status,
        @mapping_id,
        @foreign_scope,
        @foreign_work_id,
        @local_scope,
        @local_work_id,
        @packet_id,
        @packet_hash,
        @imported_summary,
        @created_by,
        @import_reason
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
  assert.notEqual(start, -1, "imported context table block must exist");
  const endMarker =
    "\n);\n\nCREATE INDEX IF NOT EXISTS idx_ag_imported_contexts_mapping_time";
  const end = source.indexOf(endMarker, start);
  assert.notEqual(end, -1, "imported context table must end before first index");
  return source.slice(start, end + 3);
}

function requiredColumns() {
  return [
    "import_id",
    "record_kind",
    "schema",
    "status",
    "mapping_id",
    "foreign_scope",
    "foreign_work_id",
    "local_scope",
    "local_work_id",
    "packet_id",
    "packet_hash",
    "source_runtime_instance_id",
    "imported_summary",
    "imported_expected_files",
    "imported_expected_checks",
    "foreign_refs_summary",
    "redaction_report",
    "created_by",
    "import_reason",
    "created_at",
    "updated_at",
    "authority_boundary",
  ];
}

function requiredIndexes() {
  return [
    "idx_ag_imported_contexts_mapping_time",
    "idx_ag_imported_contexts_foreign_time",
    "idx_ag_imported_contexts_local_time",
    "idx_ag_imported_contexts_packet_hash",
    "idx_ag_imported_contexts_status_time",
    "idx_ag_imported_contexts_created_by_time",
  ];
}

function requiredIndexColumns() {
  return {
    idx_ag_imported_contexts_mapping_time: ["mapping_id", "created_at"],
    idx_ag_imported_contexts_foreign_time: [
      "foreign_scope",
      "foreign_work_id",
      "created_at",
    ],
    idx_ag_imported_contexts_local_time: [
      "local_scope",
      "local_work_id",
      "created_at",
    ],
    idx_ag_imported_contexts_packet_hash: ["packet_id", "packet_hash"],
    idx_ag_imported_contexts_status_time: ["status", "created_at"],
    idx_ag_imported_contexts_created_by_time: ["created_by", "created_at"],
  };
}

function assertNoForbiddenSmokeSource(source) {
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
    /app\/api/i,
    /\/api\//i,
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
