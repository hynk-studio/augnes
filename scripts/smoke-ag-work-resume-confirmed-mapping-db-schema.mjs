import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
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
  "AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_IMPLEMENTATION_V0_1.md",
);
const designDocPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_DESIGN_V0_1.md",
);
const recordDesignDocPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md",
);
const gateDocPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
);

const tableName = "ag_work_resume_confirmed_mappings";
const tempDir = mkdtempSync(
  path.join(os.tmpdir(), "augnes-ag-resume-confirmed-mapping-schema-"),
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
    packageJson.scripts?.["smoke:ag-work-resume-confirmed-mapping-db-schema"],
    "node scripts/smoke-ag-work-resume-confirmed-mapping-db-schema.mjs",
    "package.json must expose confirmed mapping DB/schema smoke",
  );

  const schemaSource = readFileSync(schemaPath, "utf8");
  assertSchemaSource(schemaSource);
  assertDocs();
  assertNoConfirmedMappingRuntimeSurfaces();

  runNpmScript("db:reset", tempDbPath);
  inspectMigratedDatabase(tempDbPath, "reset");

  runNpmScript("db:migrate", tempDbPath);
  runNpmScript("db:migrate", tempDbPath);
  inspectMigratedDatabase(tempDbPath, "idempotent");

  assertNoUnexpectedChangedFiles();

  console.log(
    JSON.stringify(
      {
        smoke: "ag-work-resume-confirmed-mapping-db-schema",
        temp_db_path: tempDbPath,
        package_script_present: true,
        schema_source_guard_passed: true,
        table_and_indexes_present: true,
        constraints_passed: true,
        active_unique_partial_index_passed: true,
        no_runtime_writer_surface_passed: true,
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
    /CREATE TABLE IF NOT EXISTS ag_work_resume_confirmed_mappings/,
    "schema must create ag_work_resume_confirmed_mappings",
  );

  for (const column of requiredColumns()) {
    assert.match(
      tableBlock,
      new RegExp(`\\b${escapeRegExp(column)}\\b`),
      `schema table must include column ${column}`,
    );
  }

  for (const pattern of [
    /mapping_id TEXT PRIMARY KEY/i,
    /record_kind TEXT NOT NULL CHECK\s*\(\s*record_kind = 'ag_work_resume_confirmed_mapping'\s*\)/is,
    /schema TEXT NOT NULL CHECK\s*\(\s*schema = 'augnes\.ag_work_resume_confirmed_mapping\.v0_1'\s*\)/is,
    /status TEXT NOT NULL CHECK\s*\(\s*status IN\s*\(\s*'active',\s*'superseded',\s*'withdrawn',\s*'revoked'\s*\)\s*\)/is,
    /authority_boundary TEXT NOT NULL DEFAULT '\{\}'/i,
    /created_at TEXT NOT NULL DEFAULT\s+\(strftime\('%Y-%m-%dT%H:%M:%fZ', 'now'\)\)/i,
    /updated_at TEXT NOT NULL DEFAULT\s+\(strftime\('%Y-%m-%dT%H:%M:%fZ', 'now'\)\)/i,
  ]) {
    assert.match(tableBlock, pattern, `schema table must include ${pattern}`);
  }

  assert.doesNotMatch(
    tableBlock,
    /FOREIGN KEY/i,
    "confirmed mapping table must not add foreign keys in this slice",
  );

  for (const indexName of requiredIndexes()) {
    assert.match(
      indexSource,
      new RegExp(`\\b${escapeRegExp(indexName)}\\b`),
      `schema must include index ${indexName}`,
    );
  }
  assert.match(
    indexSource,
    /CREATE UNIQUE INDEX IF NOT EXISTS idx_ag_confirmed_mappings_active_foreign/is,
    "schema must include active foreign unique index",
  );
  assert.match(
    indexSource,
    /WHERE status = 'active'/i,
    "active unique index must apply only to active mappings",
  );
}

function inspectMigratedDatabase(dbPath, phase) {
  const db = openDb(dbPath);
  try {
    assert.equal(tableExists(db, tableName), true, `${phase}: table must exist`);
    assertColumns(db);
    assertIndexes(db);
    assert.equal(
      countRows(db, tableName),
      0,
      `${phase}: migration must not create confirmed mapping rows`,
    );
    assertProtectedTablesHaveNoRows(db, phase);
    assertForbiddenTablesAbsent(db);
    assertConstraintFailures(db);
    assertFixtureInsertAndActiveUniqueness(db);
  } finally {
    db.close();
  }
}

function assertColumns(db) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  const names = columns.map((column) => column.name);
  assert.deepEqual(names, requiredColumns(), "confirmed mapping columns must match");

  const byName = new Map(columns.map((column) => [column.name, column]));
  for (const name of [
    "record_kind",
    "schema",
    "status",
    "foreign_scope",
    "foreign_work_id",
    "local_scope",
    "local_work_id",
    "source_proposal_id",
    "packet_id",
    "packet_hash",
    "confirmed_by",
    "confirmed_at",
    "confirmation_reason",
    "authority_boundary",
    "created_at",
    "updated_at",
  ]) {
    assert.equal(byName.get(name)?.notnull, 1, `${name} must be NOT NULL`);
  }
  assert.equal(byName.get("mapping_id")?.pk, 1, "mapping_id must be primary key");
  assert.equal(
    byName.get("authority_boundary")?.dflt_value,
    "'{}'",
    "authority_boundary default must be JSON object text",
  );
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
  const activeIndex = indexes.find(
    (index) => index.name === "idx_ag_confirmed_mappings_active_foreign",
  );
  assert.equal(activeIndex?.unique, 1, "active foreign index must be unique");
  assert.equal(activeIndex?.partial, 1, "active foreign index must be partial");
  const activeIndexSql = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'index' AND name = ?")
    .get("idx_ag_confirmed_mappings_active_foreign").sql;
  assert.match(activeIndexSql, /WHERE status = 'active'/i);
}

function assertConstraintFailures(db) {
  assert.throws(
    () => insertMapping(db, { mapping_id: "mapping:invalid-status", status: "proposed" }),
    /CHECK constraint failed/i,
    "status CHECK must reject proposed",
  );
  assert.throws(
    () =>
      insertMapping(db, {
        mapping_id: "mapping:invalid-kind",
        record_kind: "ag_work_resume_mapping_proposal",
      }),
    /CHECK constraint failed/i,
    "record_kind CHECK must reject proposal kind",
  );
  assert.throws(
    () =>
      insertMapping(db, {
        mapping_id: "mapping:invalid-schema",
        schema: "augnes.ag_work_resume_mapping_proposal.v0_1",
      }),
    /CHECK constraint failed/i,
    "schema CHECK must reject proposal schema",
  );
  assert.throws(
    () => {
      db.prepare(`INSERT INTO ${tableName} (mapping_id) VALUES (?)`).run(
        "mapping:incomplete",
      );
    },
    /NOT NULL constraint failed/i,
    "required NOT NULL fields must reject incomplete rows",
  );
}

function assertFixtureInsertAndActiveUniqueness(db) {
  db.exec("SAVEPOINT confirmed_mapping_schema_fixture");
  try {
    insertMapping(db, { mapping_id: "mapping:fixture", status: "active" });
    const row = db
      .prepare(`SELECT * FROM ${tableName} WHERE mapping_id = ?`)
      .get("mapping:fixture");
    assert.equal(row.status, "active");
    assert.equal(row.record_kind, "ag_work_resume_confirmed_mapping");
    assert.equal(row.schema, "augnes.ag_work_resume_confirmed_mapping.v0_1");
    assert.equal(row.authority_boundary, "{}");
    assertIsoTimestamp(row.created_at, "created_at");
    assertIsoTimestamp(row.updated_at, "updated_at");

    db.exec("SAVEPOINT active_unique_check");
    try {
      assert.throws(
        () =>
          insertMapping(db, {
            mapping_id: "mapping:duplicate-active",
            status: "active",
          }),
        /UNIQUE constraint failed/i,
        "active unique index must reject duplicate active foreign mapping",
      );
      insertMapping(db, {
        mapping_id: "mapping:superseded-same-foreign",
        status: "superseded",
      });
      assert.equal(
        countRows(db, tableName),
        2,
        "active plus superseded same foreign identity must be allowed",
      );
    } finally {
      db.exec("ROLLBACK TO active_unique_check");
      db.exec("RELEASE active_unique_check");
    }

    assert.equal(
      countRows(db, tableName),
      1,
      "schema smoke fixture savepoint contains one direct confirmed mapping row",
    );
  } finally {
    db.exec("ROLLBACK TO confirmed_mapping_schema_fixture");
    db.exec("RELEASE confirmed_mapping_schema_fixture");
  }

  assert.equal(
    countRows(db, tableName),
    0,
    "schema smoke rolls back direct confirmed mapping fixture rows",
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
  ]) {
    assert.equal(countRows(db, table), 0, `${phase}: ${table} must have no rows`);
  }
}

function assertForbiddenTablesAbsent(db) {
  for (const table of [
    "ag_work_resume_imports",
    "ag_work_resume_imported_contexts",
  ]) {
    assert.equal(tableExists(db, table), false, `${table} must remain absent`);
  }
}

function assertDocs() {
  const implementationDoc = readFileSync(implementationDocPath, "utf8");
  const designDoc = readFileSync(designDocPath, "utf8");
  const recordDesignDoc = readFileSync(recordDesignDocPath, "utf8");
  const gateDoc = readFileSync(gateDocPath, "utf8");

  for (const pattern of [
    /schema foundation only/i,
    /adds no\s+writer\/helper\/route\/UI/is,
    /no confirmed mapping row creation behavior/i,
    /no rows during migration/i,
    /idx_ag_confirmed_mappings_active_foreign/i,
    /partial unique index/i,
    /does not add a DB foreign key/i,
    /future writer must validate/i,
    /source proposal exists/i,
    /source proposal is active for confirmation/i,
    /packet id\/hash/i,
    /local work exists/i,
    /duplicate active mapping/i,
    /No import/i,
    /No proof\/evidence/i,
    /No session binding/i,
    /No Codex execution or continuation/i,
    /No approval, publish, retry, replay, merge/i,
    /browser verification skipped: no rendered UI\/operator surface changed in this schema-only confirmed mapping slice/i,
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
      /AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_IMPLEMENTATION_V0_1\.md/,
      `${label} must point to implementation doc`,
    );
  }
}

function assertNoConfirmedMappingRuntimeSurfaces() {
  for (const relativePath of [
    "lib/ag-work-resume-confirmed-mapping-record.ts",
    "lib/ag-work-resume-confirmed-mapping-record-read.ts",
    "scripts/ag-work-resume-confirmed-mapping-record-create.mjs",
    "scripts/ag-work-resume-confirmed-mapping-record-read.mjs",
    "app/api/ag-work-resume/confirmed-mappings/route.ts",
    "app/api/ag-work-resume/confirmed-mapping-records/route.ts",
  ]) {
    assert.equal(
      existsSync(path.join(rootDir, relativePath)),
      false,
      `${relativePath} must not exist in schema-only slice`,
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
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_IMPLEMENTATION_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
    "scripts/smoke-ag-work-resume-confirmed-mapping-db-schema.mjs",
    "package.json",
  ]);
  const forbiddenPrefixes = [
    "app/",
    "apps/",
    "components/",
    "migrations/",
    "reports/browser/",
  ];

  for (const file of changedFiles) {
    assert.ok(
      allowedFiles.has(file),
      `changed file is outside confirmed mapping schema slice: ${file}`,
    );
    assert.ok(
      !forbiddenPrefixes.some((prefix) => file.startsWith(prefix)),
      `confirmed mapping schema slice must not touch forbidden path: ${file}`,
    );
    assert.ok(
      file === "lib/db/schema.sql" || !file.startsWith("lib/"),
      `no lib runtime files may change outside lib/db/schema.sql: ${file}`,
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

function insertMapping(db, overrides = {}) {
  const mapping = {
    mapping_id: overrides.mapping_id ?? "mapping:default",
    record_kind: "ag_work_resume_confirmed_mapping",
    schema: "augnes.ag_work_resume_confirmed_mapping.v0_1",
    status: overrides.status ?? "active",
    foreign_scope: "project:source",
    foreign_work_id: "AG-FOREIGN-1",
    local_scope: "project:augnes",
    local_work_id: "AG-LOCAL-1",
    source_proposal_id: "ag-resume-mapping-proposal:fixture",
    packet_id: "resume-packet:fixture",
    packet_hash: "sha256:fixture",
    confirmed_by: "user-core:schema-smoke",
    confirmed_at: "2026-05-31T00:00:00.000Z",
    confirmation_reason: "Schema smoke direct DB insert fixture, not runtime writer behavior.",
    ...overrides,
  };
  db.prepare(
    `
      INSERT INTO ${tableName} (
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
        confirmed_by,
        confirmed_at,
        confirmation_reason
      )
      VALUES (
        @mapping_id,
        @record_kind,
        @schema,
        @status,
        @foreign_scope,
        @foreign_work_id,
        @local_scope,
        @local_work_id,
        @source_proposal_id,
        @packet_id,
        @packet_hash,
        @confirmed_by,
        @confirmed_at,
        @confirmation_reason
      )
    `,
  ).run(mapping);
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
  assert.notEqual(start, -1, "confirmed mapping table block must exist");
  const endMarker =
    "\n);\n\nCREATE UNIQUE INDEX IF NOT EXISTS idx_ag_confirmed_mappings_active_foreign";
  const end = source.indexOf(endMarker, start);
  assert.notEqual(end, -1, "confirmed mapping table must end before first index");
  return source.slice(start, end + 3);
}

function requiredColumns() {
  return [
    "mapping_id",
    "record_kind",
    "schema",
    "status",
    "foreign_scope",
    "foreign_work_id",
    "local_scope",
    "local_work_id",
    "source_proposal_id",
    "packet_id",
    "packet_hash",
    "source_runtime_instance_id",
    "confirmed_by",
    "confirmed_at",
    "confirmation_reason",
    "supersedes_mapping_id",
    "superseded_by_mapping_id",
    "revoked_by",
    "revoked_at",
    "revocation_reason",
    "authority_boundary",
    "created_at",
    "updated_at",
  ];
}

function requiredIndexes() {
  return [
    "idx_ag_confirmed_mappings_active_foreign",
    "idx_ag_confirmed_mappings_foreign_time",
    "idx_ag_confirmed_mappings_local_time",
    "idx_ag_confirmed_mappings_source_proposal",
    "idx_ag_confirmed_mappings_packet_hash",
    "idx_ag_confirmed_mappings_status_time",
    "idx_ag_confirmed_mappings_supersedes",
    "idx_ag_confirmed_mappings_superseded_by",
  ];
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
