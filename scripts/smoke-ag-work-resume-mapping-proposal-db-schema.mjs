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
const migrationPath = path.join(rootDir, "scripts", "db-migrations.mjs");
const migratePath = path.join(rootDir, "scripts", "db-migrate.mjs");
const implementationDocPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_MAPPING_PROPOSAL_DB_SCHEMA_IMPLEMENTATION_V0_1.md",
);

const tableName = "ag_work_resume_mapping_proposals";
const tempDir = mkdtempSync(
  path.join(os.tmpdir(), "augnes-ag-resume-mapping-proposal-schema-"),
);
const tempDbPath = path.join(tempDir, "augnes.db");
const existingDbPath = path.join(tempDir, "existing-augnes.db");

try {
  assert.ok(existsSync(schemaPath), "schema.sql must exist");
  assert.ok(existsSync(packagePath), "package.json must exist");
  assert.ok(existsSync(implementationDocPath), "implementation doc must exist");

  const smokeSource = readFileSync(smokePath, "utf8");
  assertNoForbiddenSmokeSource(smokeSource);

  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  assert.equal(
    packageJson.scripts?.["smoke:ag-work-resume-mapping-proposal-db-schema"],
    "node scripts/smoke-ag-work-resume-mapping-proposal-db-schema.mjs",
    "package.json must expose mapping proposal DB/schema smoke",
  );

  const schemaSource = readFileSync(schemaPath, "utf8");
  assertSchemaSource(schemaSource);
  assertMigrationSourceGuards();
  assertImplementationDocs();

  runNpmScript("db:reset", tempDbPath);
  inspectEmptyMigratedDatabase(tempDbPath);

  runNpmScript("db:migrate", tempDbPath);
  runNpmScript("db:migrate", tempDbPath);
  inspectIdempotentDatabase(tempDbPath);

  prepareExistingDatabaseWithoutProposalTable(existingDbPath);
  runNpmScript("db:migrate", existingDbPath);
  inspectExistingMigratedDatabase(existingDbPath);

  assertNoUnexpectedChangedFiles();

  console.log(
    JSON.stringify(
      {
        smoke: "ag-work-resume-mapping-proposal-db-schema",
        temp_db_path: tempDbPath,
        existing_temp_db_path: existingDbPath,
        package_script_present: true,
        schema_source_guard_passed: true,
        migration_source_guard_passed: true,
        empty_db_migration_passed: true,
        existing_db_migration_passed: true,
        idempotency_passed: true,
        no_side_effects_passed: true,
        fixture_insert_read_passed: true,
        docs_guard_passed: true,
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
    /CREATE TABLE IF NOT EXISTS ag_work_resume_mapping_proposals/,
    "schema must create ag_work_resume_mapping_proposals",
  );

  for (const column of requiredColumns()) {
    assert.match(
      tableBlock,
      new RegExp(`\\b${escapeRegExp(column)}\\b`),
      `schema table must include column ${column}`,
    );
  }

  for (const pattern of [
    /proposal_id TEXT PRIMARY KEY/i,
    /record_kind TEXT NOT NULL CHECK\s*\(\s*record_kind = 'ag_work_resume_mapping_proposal'\s*\)/is,
    /schema TEXT NOT NULL CHECK\s*\(\s*schema = 'augnes\.ag_work_resume_mapping_proposal\.v0_1'\s*\)/is,
    /status TEXT NOT NULL CHECK\s*\(\s*status IN\s*\(/is,
    /comparison_summary TEXT NOT NULL DEFAULT '\[\]'/i,
    /gaps_summary TEXT NOT NULL DEFAULT '\[\]'/i,
    /conflicts_summary TEXT NOT NULL DEFAULT '\[\]'/i,
    /questions_summary TEXT NOT NULL DEFAULT '\[\]'/i,
    /foreign_refs_summary TEXT NOT NULL DEFAULT '\{\}'/i,
    /repo_context_summary TEXT NOT NULL DEFAULT '\{\}'/i,
    /redaction_summary TEXT NOT NULL DEFAULT '\{\}'/i,
    /authority_boundary TEXT NOT NULL DEFAULT '\{\}'/i,
    /proposed_at TEXT NOT NULL DEFAULT\s+\(strftime\('%Y-%m-%dT%H:%M:%fZ', 'now'\)\)/i,
    /created_at TEXT NOT NULL DEFAULT\s+\(strftime\('%Y-%m-%dT%H:%M:%fZ', 'now'\)\)/i,
    /updated_at TEXT NOT NULL DEFAULT\s+\(strftime\('%Y-%m-%dT%H:%M:%fZ', 'now'\)\)/i,
  ]) {
    assert.match(tableBlock, pattern, `schema table must include ${pattern}`);
  }

  for (const status of [
    "proposed",
    "needs_review",
    "superseded",
    "withdrawn",
    "rejected",
    "expired",
  ]) {
    assert.match(
      tableBlock,
      new RegExp(`'${escapeRegExp(status)}'`),
      `status CHECK must include ${status}`,
    );
  }
  assert.doesNotMatch(tableBlock, /confirmed/i, "status CHECK must exclude confirmed");

  for (const indexName of requiredIndexes()) {
    assert.match(
      indexSource,
      new RegExp(`\\b${escapeRegExp(indexName)}\\b`),
      `schema must include index ${indexName}`,
    );
  }
  assert.match(
    indexSource,
    /CREATE UNIQUE INDEX IF NOT EXISTS idx_ag_mapping_proposals_active_unique/is,
    "schema must include partial unique active proposal index",
  );
  assert.match(
    indexSource,
    /WHERE status IN \('proposed', 'needs_review'\)/i,
    "partial unique index must apply only to active statuses",
  );
  assert.doesNotMatch(
    tableBlock,
    /FOREIGN KEY/i,
    "proposal table must not add foreign keys in this slice",
  );
}

function assertMigrationSourceGuards() {
  const migrationSource = readFileSync(migrationPath, "utf8");
  const migrateSource = readFileSync(migratePath, "utf8");
  const combined = `${migrationSource}\n${migrateSource}`;
  const importStatements = [
    ...combined.matchAll(/^\s*import\s+[^;]+;$/gm),
    ...combined.matchAll(/\bimport\(\s*["'][^"']+["']\s*\)/g),
  ].map((match) => match[0]);
  const importText = importStatements.join("\n");

  for (const forbidden of [
    /node:http/i,
    /node:https/i,
    /app\/api/i,
  ]) {
    assert.doesNotMatch(importText, forbidden, `migration source must not import ${forbidden}`);
  }

  for (const forbidden of [
    /fetch\s*\(/i,
    /record-evidence/i,
    /record-completion/i,
    /execute Codex/i,
    /INSERT\s+INTO\s+ag_work_resume_mapping_proposals/i,
  ]) {
    assert.doesNotMatch(combined, forbidden, `migration source must not include ${forbidden}`);
  }
}

function inspectEmptyMigratedDatabase(dbPath) {
  const db = openDb(dbPath);
  try {
    assertTableAndIndexes(db);
    assert.equal(
      countRows(db, tableName),
      0,
      "migration must not create proposal rows",
    );
    for (const table of [
      "ag_work_resume_confirmed_mappings",
      "ag_work_resume_imports",
      "ag_work_resume_imported_contexts",
    ]) {
      assert.equal(tableExists(db, table), false, `${table} must not be created`);
    }
    for (const table of [
      "sessions",
      "work_items",
      "work_events",
      "action_records",
      "verification_evidence_records",
    ]) {
      assert.equal(countRows(db, table), 0, `${table} must have no migration-created rows`);
    }
  } finally {
    db.close();
  }
}

function inspectIdempotentDatabase(dbPath) {
  const db = openDb(dbPath);
  try {
    assertTableAndIndexes(db);
    assert.equal(
      countRows(db, tableName),
      0,
      "repeated migration must not create proposal rows",
    );
    assertConstraintFailures(db);
    assertFixtureInsertReadAndLifecycle(db);
  } finally {
    db.close();
  }
}

function prepareExistingDatabaseWithoutProposalTable(dbPath) {
  const db = openDb(dbPath);
  try {
    db.exec(`
      CREATE TABLE existing_migration_marker (
        id TEXT PRIMARY KEY,
        note TEXT NOT NULL
      );
      INSERT INTO existing_migration_marker (id, note)
      VALUES ('marker:1', 'pre-existing DB without proposal table');
    `);
    assert.equal(
      tableExists(db, tableName),
      false,
      "existing DB fixture must start without proposal table",
    );
  } finally {
    db.close();
  }
}

function inspectExistingMigratedDatabase(dbPath) {
  const db = openDb(dbPath);
  try {
    assertTableAndIndexes(db);
    assert.equal(
      countRows(db, tableName),
      0,
      "existing DB migration must not create proposal rows",
    );
    assert.equal(
      countRows(db, "existing_migration_marker"),
      1,
      "existing DB migration must preserve unrelated existing tables",
    );
  } finally {
    db.close();
  }
}

function assertTableAndIndexes(db) {
  assert.equal(tableExists(db, tableName), true, "proposal table must exist");
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  const columnNames = new Set(columns.map((column) => column.name));
  for (const column of requiredColumns()) {
    assert.ok(columnNames.has(column), `DB table must include column ${column}`);
  }
  assert.equal(columnNames.has("mapping_id"), false, "table must not contain mapping_id");
  assert.equal(columnNames.has("import_id"), false, "table must not contain import_id");

  const indexes = db
    .prepare(
      `
        SELECT name, sql
        FROM sqlite_master
        WHERE type = 'index'
          AND tbl_name = ?
      `,
    )
    .all(tableName);
  const indexNames = new Set(indexes.map((index) => index.name));
  for (const indexName of requiredIndexes()) {
    assert.ok(indexNames.has(indexName), `DB must include index ${indexName}`);
  }
  const activeUnique = indexes.find(
    (index) => index.name === "idx_ag_mapping_proposals_active_unique",
  );
  assert.ok(activeUnique, "partial unique active proposal index must exist");
  assert.match(activeUnique.sql ?? "", /CREATE UNIQUE INDEX/i);
  assert.match(activeUnique.sql ?? "", /WHERE status IN \('proposed', 'needs_review'\)/i);
}

function assertConstraintFailures(db) {
  assert.throws(
    () => insertProposal(db, { proposal_id: "proposal:bad-status", status: "confirmed" }),
    /CHECK constraint failed/i,
    "status CHECK must reject confirmed",
  );
  assert.throws(
    () => {
      db.prepare(`INSERT INTO ${tableName} (proposal_id) VALUES (?)`).run(
        "proposal:incomplete",
      );
    },
    /NOT NULL constraint failed/i,
    "required NOT NULL fields must reject incomplete rows",
  );
}

function assertFixtureInsertReadAndLifecycle(db) {
  insertProposal(db, { proposal_id: "proposal:fixture", status: "proposed" });
  const row = db
    .prepare(`SELECT * FROM ${tableName} WHERE proposal_id = ?`)
    .get("proposal:fixture");
  assert.equal(row.status, "proposed");
  assert.equal(row.record_kind, "ag_work_resume_mapping_proposal");
  assert.equal(row.schema, "augnes.ag_work_resume_mapping_proposal.v0_1");
  assertJsonField(row, "comparison_summary", []);
  assertJsonField(row, "gaps_summary", []);
  assertJsonField(row, "conflicts_summary", []);
  assertJsonField(row, "questions_summary", []);
  assertJsonField(row, "foreign_refs_summary", {});
  assertJsonField(row, "repo_context_summary", {});
  assertJsonField(row, "redaction_summary", {});
  assertJsonField(row, "authority_boundary", {});
  assertIsoTimestamp(row.proposed_at, "proposed_at");
  assertIsoTimestamp(row.created_at, "created_at");
  assertIsoTimestamp(row.updated_at, "updated_at");

  assert.throws(
    () =>
      insertProposal(db, {
        proposal_id: "proposal:active-duplicate",
        status: "needs_review",
      }),
    /UNIQUE constraint failed/i,
    "partial unique index must reject duplicate active proposals",
  );

  db.prepare(`UPDATE ${tableName} SET status = ? WHERE proposal_id = ?`).run(
    "withdrawn",
    "proposal:fixture",
  );
  assert.equal(
    db.prepare(`SELECT status FROM ${tableName} WHERE proposal_id = ?`).get(
      "proposal:fixture",
    ).status,
    "withdrawn",
    "status update to withdrawn must work",
  );

  insertProposal(db, {
    proposal_id: "proposal:allowed-after-withdrawn",
    status: "proposed",
  });
  db.prepare(`UPDATE ${tableName} SET status = ? WHERE proposal_id = ?`).run(
    "expired",
    "proposal:allowed-after-withdrawn",
  );
  assert.equal(
    db.prepare(`SELECT status FROM ${tableName} WHERE proposal_id = ?`).get(
      "proposal:allowed-after-withdrawn",
    ).status,
    "expired",
    "status update to expired must work",
  );
}

function assertImplementationDocs() {
  const docs = readFileSync(implementationDocPath, "utf8");
  for (const pattern of [
    /Purpose/i,
    /DB\/schema design/i,
    /Stage B proposal record design/i,
    /Stage A preview-only surfaces/i,
    /mapping\/import authority gate/i,
    /`ag_work_resume_mapping_proposals`/i,
    /idx_ag_mapping_proposals_active_unique/i,
    /no `confirmed` status/i,
    /JSON-ish arrays and objects as `TEXT`/i,
    /partial unique index/i,
    /Migration creates the table and\s+indexes when absent/is,
    /no foreign keys to\s+`work_items`, `agents`, `sessions`, proof\/evidence tables/is,
    /No write route/i,
    /No record writer/i,
    /No proposal records are created by migration/i,
    /No confirmed mapping/i,
    /No import/i,
    /No proof\/evidence/i,
    /No session binding/i,
    /No Codex execution/i,
    /Future write.*separately gated/is,
    /future read helper or read route.*separately gated/is,
    /Verification/i,
  ]) {
    assert.match(docs, pattern, `implementation doc must include ${pattern}`);
  }
}

function assertNoUnexpectedChangedFiles() {
  const result = spawnSync("git", ["diff", "--name-only"], {
    cwd: rootDir,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    return;
  }
  const changedFiles = result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const allowedScopedFollowUpFiles = new Set([
    "app/api/ag-work-resume/mapping-proposal-records/route.ts",
    "components/augnes-cockpit.tsx",
    "lib/ag-work-resume-mapping-proposal-record.ts",
    "lib/ag-work-resume-mapping-proposal-record-read.ts",
  ]);
  const forbiddenPrefixes = [
    "app/",
    "apps/",
    "components/",
    "lib/ag-work-resume",
    "app/api/",
  ];
  for (const file of changedFiles) {
    if (allowedScopedFollowUpFiles.has(file)) continue;
    assert.ok(
      !forbiddenPrefixes.some((prefix) => file.startsWith(prefix)),
      `smoke guard: route/UI/runtime file changed unexpectedly: ${file}`,
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

function insertProposal(db, overrides = {}) {
  const proposal = {
    proposal_id: overrides.proposal_id ?? "proposal:default",
    record_kind: "ag_work_resume_mapping_proposal",
    schema: "augnes.ag_work_resume_mapping_proposal.v0_1",
    status: overrides.status ?? "proposed",
    foreign_scope: "foreign:scope",
    foreign_work_id: "AG-FOREIGN-1",
    foreign_title: "Foreign work",
    candidate_local_scope: "local:scope",
    candidate_local_work_id: "AG-LOCAL-1",
    candidate_title: "Local work",
    packet_id: "packet:1",
    packet_hash: "sha256:packet",
    proposal_preview_id: "proposal-preview:1",
    proposal_preview_hash: "sha256:preview",
    proposed_by: "user-core",
    proposal_reason: "Schema smoke direct SQL fixture.",
    ...overrides,
  };
  db.prepare(
    `
      INSERT INTO ${tableName} (
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
        proposed_by,
        proposal_reason
      )
      VALUES (
        @proposal_id,
        @record_kind,
        @schema,
        @status,
        @foreign_scope,
        @foreign_work_id,
        @foreign_title,
        @candidate_local_scope,
        @candidate_local_work_id,
        @candidate_title,
        @packet_id,
        @packet_hash,
        @proposal_preview_id,
        @proposal_preview_hash,
        @proposed_by,
        @proposal_reason
      )
    `,
  ).run(proposal);
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

function assertJsonField(row, field, expected) {
  assert.deepEqual(JSON.parse(row[field]), expected, `${field} must parse as JSON`);
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
  assert.notEqual(start, -1, "proposal table block must exist");
  const endMarker = "\n);\n\nCREATE INDEX IF NOT EXISTS idx_ag_mapping_proposals_foreign_work_time";
  const end = source.indexOf(endMarker, start);
  assert.notEqual(end, -1, "proposal table block must end before first proposal index");
  return source.slice(start, end + 3);
}

function requiredColumns() {
  return [
    "proposal_id",
    "record_kind",
    "schema",
    "status",
    "foreign_scope",
    "foreign_work_id",
    "foreign_title",
    "foreign_status",
    "foreign_next_action",
    "candidate_local_scope",
    "candidate_local_work_id",
    "candidate_title",
    "candidate_status",
    "candidate_next_action",
    "packet_id",
    "packet_hash",
    "source_runtime_instance_id",
    "source_packet_created_at",
    "proposal_preview_id",
    "proposal_preview_hash",
    "match_confidence_label",
    "comparison_summary",
    "gaps_summary",
    "conflicts_summary",
    "questions_summary",
    "foreign_refs_summary",
    "repo_context_summary",
    "redaction_summary",
    "proposed_by",
    "proposed_at",
    "proposal_reason",
    "expires_at",
    "supersedes_proposal_id",
    "superseded_by_proposal_id",
    "reviewed_by",
    "reviewed_at",
    "review_note",
    "authority_boundary",
    "created_at",
    "updated_at",
  ];
}

function requiredIndexes() {
  return [
    "idx_ag_mapping_proposals_foreign_work_time",
    "idx_ag_mapping_proposals_candidate_time",
    "idx_ag_mapping_proposals_status_time",
    "idx_ag_mapping_proposals_packet_hash",
    "idx_ag_mapping_proposals_preview_hash",
    "idx_ag_mapping_proposals_expires_at",
    "idx_ag_mapping_proposals_supersedes",
    "idx_ag_mapping_proposals_superseded_by",
    "idx_ag_mapping_proposals_active_unique",
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
