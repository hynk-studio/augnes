import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const smokePath = fileURLToPath(import.meta.url);
const smokeRelativePath =
  "scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-schema.mjs";
const schemaRelativePath = "lib/db/schema.sql";
const schemaPath = path.join(rootDir, schemaRelativePath);
const packagePath = path.join(rootDir, "package.json");
const migrationPolicyPath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_MIGRATION_POLICY_V0_1.md";
const bridgeDesignPath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_SCHEMA_DESIGN_V0_1.md";
const schemaIntegrationPolicyPath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_SCHEMA_INTEGRATION_POLICY_V0_1.md";
const actualRecordingGateDesignPath =
  "docs/AG_WORK_RESUME_ACTUAL_PROOF_EVIDENCE_RECORDING_GATE_DESIGN_V0_1.md";
const closeoutPath =
  "docs/AG_WORK_RESUME_CROSS_LOCAL_CONTINUITY_REVIEW_METADATA_CLOSEOUT_V0_1.md";
const authorityGatePath =
  "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md";
const sessionCodexGatePath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md";
const reconciliationDesignPath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md";
const lifecycleDocPath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTIONS_V0_1.md";

const tableName = "ag_work_resume_proof_evidence_recording_links";
const tempDir = mkdtempSync(
  path.join(os.tmpdir(), "augnes-ag-resume-recording-link-schema-"),
);
const tempDbPath = path.join(tempDir, "augnes.db");

try {
  for (const file of [
    smokePath,
    schemaPath,
    packagePath,
    path.join(rootDir, migrationPolicyPath),
    path.join(rootDir, bridgeDesignPath),
    path.join(rootDir, schemaIntegrationPolicyPath),
    path.join(rootDir, actualRecordingGateDesignPath),
    path.join(rootDir, closeoutPath),
    path.join(rootDir, authorityGatePath),
    path.join(rootDir, sessionCodexGatePath),
    path.join(rootDir, reconciliationDesignPath),
    path.join(rootDir, lifecycleDocPath),
  ]) {
    assert.ok(existsSync(file), `${file} must exist`);
  }

  const smokeSource = readFileSync(smokePath, "utf8");
  assertNoForbiddenSmokeImports(smokeSource);

  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  assert.equal(
    packageJson.scripts?.[
      "smoke:ag-work-resume-proof-evidence-recording-bridge-table-schema"
    ],
    "node scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-schema.mjs",
    "package.json must expose bridge table schema smoke",
  );

  const schemaSource = readFileSync(schemaPath, "utf8");
  assertSchemaSource(schemaSource);
  assertPointerDocs();

  runNpmScript("db:reset", tempDbPath);
  inspectMigratedDatabase(tempDbPath, "reset");

  runNpmScript("db:migrate", tempDbPath);
  runNpmScript("db:migrate", tempDbPath);
  inspectMigratedDatabase(tempDbPath, "idempotent");

  assertNoUnexpectedChangedFiles();
  assertNoWriterRouteUiChanges();

  console.log(
    JSON.stringify(
      {
        smoke: "ag-work-resume-proof-evidence-recording-bridge-table-schema",
        temp_db_path: tempDbPath,
        cases: [
          "package script is present",
          "schema source creates bridge table and indexes only",
          "table exists after db reset/init",
          "required columns and NOT NULL fields exist",
          "record_kind/schema/target_record_kind/recording_status CHECK constraints fail closed",
          "target_action_id and failure_reason are NULL-only",
          "redaction_summary and provenance_json require JSON object text",
          "candidate/idempotency/target evidence unique indexes exist",
          "read indexes exist",
          "foreign keys exist with restrict/no-action behavior",
          "no cascade delete is allowed",
          "schema initialization creates no bridge rows",
          "schema initialization creates no verification_evidence_records rows",
          "schema initialization creates no action_records rows",
          "schema smoke direct DB fixture is rolled back",
          "protected AG Resume review-metadata tables remain empty after smoke",
          "changed files are limited to schema docs, package, scoped writer helper, and smoke guards",
          "no route/UI/browser files or unscoped runtime files changed",
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

  for (const pattern of [
    /CREATE TABLE IF NOT EXISTS ag_work_resume_proof_evidence_recording_links/,
    /recording_link_id TEXT PRIMARY KEY/i,
    /record_kind TEXT NOT NULL CHECK\s*\(\s*record_kind = 'ag_work_resume_proof_evidence_recording_link'\s*\)/is,
    /schema TEXT NOT NULL CHECK\s*\(\s*schema = 'augnes\.ag_work_resume_proof_evidence_recording_link\.v0_1'\s*\)/is,
    /candidate_id TEXT NOT NULL/i,
    /import_id TEXT NOT NULL/i,
    /mapping_id TEXT NOT NULL/i,
    /local_target_scope TEXT NOT NULL CHECK\s*\(\s*length\(trim\(local_target_scope\)\) > 0\s*\)/is,
    /local_target_work_id TEXT NOT NULL CHECK\s*\(\s*length\(trim\(local_target_work_id\)\) > 0\s*\)/is,
    /target_record_kind TEXT NOT NULL CHECK\s*\(\s*target_record_kind = 'verification_evidence'\s*\)/is,
    /target_evidence_id TEXT NOT NULL/i,
    /target_action_id TEXT CHECK \(target_action_id IS NULL\)/i,
    /idempotency_key TEXT NOT NULL CHECK\s*\(\s*length\(trim\(idempotency_key\)\) > 0\s*\)/is,
    /actor TEXT NOT NULL CHECK \(length\(trim\(actor\)\) > 0\)/i,
    /reason TEXT NOT NULL CHECK\s*\(\s*length\(trim\(reason\)\) > 0 AND length\(reason\) <= 4000\s*\)/is,
    /redaction_summary TEXT NOT NULL DEFAULT '\{\}' CHECK/is,
    /trust_provenance_label TEXT NOT NULL CHECK\s*\(\s*trust_provenance_label IN \('foreign_summary_user_core_attested'\)\s*\)/is,
    /provenance_json TEXT NOT NULL DEFAULT '\{\}' CHECK/is,
    /recording_status TEXT NOT NULL CHECK\s*\(\s*recording_status = 'recorded'\s*\)/is,
    /failure_reason TEXT CHECK \(failure_reason IS NULL\)/i,
    /created_at TEXT NOT NULL DEFAULT\s+\(strftime\('%Y-%m-%dT%H:%M:%fZ', 'now'\)\)/i,
    /updated_at TEXT NOT NULL DEFAULT\s+\(strftime\('%Y-%m-%dT%H:%M:%fZ', 'now'\)\)/i,
    /CHECK \(updated_at = created_at\)/i,
    /FOREIGN KEY \(candidate_id\)[\s\S]*REFERENCES ag_work_resume_proof_evidence_reconciliation_candidates\(candidate_id\)[\s\S]*ON DELETE RESTRICT[\s\S]*ON UPDATE RESTRICT/is,
    /FOREIGN KEY \(import_id\)[\s\S]*REFERENCES ag_work_resume_imported_contexts\(import_id\)[\s\S]*ON DELETE RESTRICT[\s\S]*ON UPDATE RESTRICT/is,
    /FOREIGN KEY \(mapping_id\)[\s\S]*REFERENCES ag_work_resume_confirmed_mappings\(mapping_id\)[\s\S]*ON DELETE RESTRICT[\s\S]*ON UPDATE RESTRICT/is,
    /FOREIGN KEY \(target_evidence_id\)[\s\S]*REFERENCES verification_evidence_records\(evidence_id\)[\s\S]*ON DELETE RESTRICT[\s\S]*ON UPDATE RESTRICT/is,
  ]) {
    assert.match(tableBlock, pattern, `schema table must include ${pattern}`);
  }

  assert.doesNotMatch(
    tableBlock,
    /FOREIGN KEY \(target_action_id\)/i,
    "first implementation must not add an action_records FK target",
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
    assertColumns(db);
    assertIndexes(db);
    assertForeignKeys(db);
    assertEmptyProtectedTables(db, phase);
    assertConstraintFailures(db);
    assertFkFailures(db);
    assertValidFixtureRollsBack(db);
  } finally {
    db.close();
  }
}

function assertColumns(db) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  const names = columns.map((column) => column.name);
  assert.deepEqual(names, requiredColumns(), "bridge columns must match");

  const byName = new Map(columns.map((column) => [column.name, column]));
  assert.equal(
    byName.get("recording_link_id")?.pk,
    1,
    "recording_link_id must be primary key",
  );

  for (const name of requiredNotNullColumns()) {
    assert.equal(byName.get(name)?.notnull, 1, `${name} must be NOT NULL`);
  }

  for (const [name, defaultValue] of [
    ["redaction_summary", "'{}'"],
    ["provenance_json", "'{}'"],
  ]) {
    assert.equal(
      byName.get(name)?.dflt_value,
      defaultValue,
      `${name} default must be ${defaultValue}`,
    );
  }

  for (const name of ["created_at", "updated_at"]) {
    assert.match(
      byName.get(name)?.dflt_value ?? "",
      /strftime\('%Y-%m-%dT%H:%M:%fZ', 'now'\)/,
      `${name} must default to ISO-like timestamp`,
    );
  }
}

function assertIndexes(db) {
  const indexes = db.prepare(`PRAGMA index_list(${tableName})`).all();
  const byName = new Map(indexes.map((index) => [index.name, index]));

  for (const indexName of requiredIndexes()) {
    assert.ok(byName.has(indexName), `index ${indexName} must exist`);
  }

  for (const indexName of uniqueIndexes()) {
    assert.equal(byName.get(indexName)?.unique, 1, `${indexName} must be unique`);
  }

  for (const [indexName, expectedColumns] of Object.entries(requiredIndexColumns())) {
    const columns = db
      .prepare(`PRAGMA index_info(${indexName})`)
      .all()
      .map((column) => column.name);
    assert.deepEqual(columns, expectedColumns, `${indexName} columns must match`);
  }
}

function assertForeignKeys(db) {
  const fks = db.prepare(`PRAGMA foreign_key_list(${tableName})`).all();
  const byFrom = new Map(fks.map((fk) => [fk.from, fk]));
  const expected = {
    candidate_id: {
      table: "ag_work_resume_proof_evidence_reconciliation_candidates",
      to: "candidate_id",
    },
    import_id: {
      table: "ag_work_resume_imported_contexts",
      to: "import_id",
    },
    mapping_id: {
      table: "ag_work_resume_confirmed_mappings",
      to: "mapping_id",
    },
    target_evidence_id: {
      table: "verification_evidence_records",
      to: "evidence_id",
    },
  };

  assert.equal(fks.length, 4, "bridge table must have four first-scope FKs");
  for (const [from, expectation] of Object.entries(expected)) {
    const fk = byFrom.get(from);
    assert.ok(fk, `FK for ${from} must exist`);
    assert.equal(fk.table, expectation.table, `${from} FK table must match`);
    assert.equal(fk.to, expectation.to, `${from} FK target column must match`);
    assert.equal(fk.on_delete, "RESTRICT", `${from} must use ON DELETE RESTRICT`);
    assert.equal(fk.on_update, "RESTRICT", `${from} must use ON UPDATE RESTRICT`);
  }
  assert.equal(byFrom.has("target_action_id"), false, "target_action_id FK is out of scope");
}

function assertConstraintFailures(db) {
  assert.throws(
    () => {
      db.prepare(`INSERT INTO ${tableName} (recording_link_id) VALUES (?)`).run(
        "recording-link:incomplete",
      );
    },
    /NOT NULL constraint failed/i,
    "required NOT NULL fields must reject incomplete rows",
  );

  db.exec("SAVEPOINT bridge_constraint_fixture");
  try {
    insertSourceRows(db);

    for (const [label, overrides, expected] of [
      [
        "invalid record kind",
        { recording_link_id: "recording-link:invalid-kind", record_kind: "proof" },
        /CHECK constraint failed/i,
      ],
      [
        "invalid schema",
        {
          recording_link_id: "recording-link:invalid-schema",
          schema: "augnes.ag_work_resume_proof.v0_1",
        },
        /CHECK constraint failed/i,
      ],
      [
        "empty local scope",
        { recording_link_id: "recording-link:empty-scope", local_target_scope: " " },
        /CHECK constraint failed/i,
      ],
      [
        "empty local work",
        { recording_link_id: "recording-link:empty-work", local_target_work_id: " " },
        /CHECK constraint failed/i,
      ],
      [
        "invalid target kind",
        { recording_link_id: "recording-link:invalid-target", target_record_kind: "action_record" },
        /CHECK constraint failed/i,
      ],
      [
        "target action not null",
        { recording_link_id: "recording-link:action", target_action_id: "action:1" },
        /CHECK constraint failed/i,
      ],
      [
        "empty idempotency key",
        { recording_link_id: "recording-link:empty-key", idempotency_key: " " },
        /CHECK constraint failed/i,
      ],
      [
        "empty actor",
        { recording_link_id: "recording-link:empty-actor", actor: " " },
        /CHECK constraint failed/i,
      ],
      [
        "empty reason",
        { recording_link_id: "recording-link:empty-reason", reason: " " },
        /CHECK constraint failed/i,
      ],
      [
        "long reason",
        { recording_link_id: "recording-link:long-reason", reason: "x".repeat(4001) },
        /CHECK constraint failed/i,
      ],
      [
        "invalid redaction JSON",
        { recording_link_id: "recording-link:bad-redaction-json", redaction_summary: "nope" },
        /CHECK constraint failed/i,
      ],
      [
        "redaction JSON array",
        { recording_link_id: "recording-link:redaction-array", redaction_summary: "[]" },
        /CHECK constraint failed/i,
      ],
      [
        "invalid trust label",
        {
          recording_link_id: "recording-link:bad-trust",
          trust_provenance_label: "raw_foreign_payload",
        },
        /CHECK constraint failed/i,
      ],
      [
        "invalid provenance JSON",
        { recording_link_id: "recording-link:bad-provenance-json", provenance_json: "nope" },
        /CHECK constraint failed/i,
      ],
      [
        "provenance JSON array",
        { recording_link_id: "recording-link:provenance-array", provenance_json: "[]" },
        /CHECK constraint failed/i,
      ],
      [
        "invalid status",
        { recording_link_id: "recording-link:invalid-status", recording_status: "pending" },
        /CHECK constraint failed/i,
      ],
      [
        "failure reason not null",
        { recording_link_id: "recording-link:failure", failure_reason: "failed" },
        /CHECK constraint failed/i,
      ],
      [
        "updated differs from created",
        {
          recording_link_id: "recording-link:updated-differs",
          created_at: "2026-06-02T00:00:00.000Z",
          updated_at: "2026-06-02T00:00:01.000Z",
        },
        /CHECK constraint failed/i,
      ],
    ]) {
      assert.throws(() => insertBridgeLink(db, overrides), expected, `${label} must fail`);
    }
  } finally {
    db.exec("ROLLBACK TO bridge_constraint_fixture");
    db.exec("RELEASE bridge_constraint_fixture");
  }

  assertEmptyProtectedTables(db, "post-constraint-fixture");
}

function assertFkFailures(db) {
  assert.throws(
    () => insertBridgeLink(db, { recording_link_id: "recording-link:missing-fks" }),
    /FOREIGN KEY constraint failed/i,
    "missing referenced rows must fail closed",
  );
  assertEmptyProtectedTables(db, "post-fk-failure");
}

function assertValidFixtureRollsBack(db) {
  db.exec("SAVEPOINT bridge_valid_fixture");
  try {
    insertSourceRows(db);
    insertBridgeLink(db);
    const row = db
      .prepare(`SELECT * FROM ${tableName} WHERE recording_link_id = ?`)
      .get("recording-link:fixture");

    assert.equal(
      row.record_kind,
      "ag_work_resume_proof_evidence_recording_link",
      "record kind must be fixed",
    );
    assert.equal(
      row.schema,
      "augnes.ag_work_resume_proof_evidence_recording_link.v0_1",
      "schema must be fixed",
    );
    assert.equal(row.target_record_kind, "verification_evidence");
    assert.equal(row.target_action_id, null);
    assert.equal(row.recording_status, "recorded");
    assert.equal(row.failure_reason, null);
    assert.equal(row.created_at, row.updated_at, "updated_at must equal created_at");
    assertIsoTimestamp(row.created_at, "created_at");
    assert.equal(countRows(db, tableName), 1, "savepoint has one bridge row");
    assert.equal(
      countRows(db, "verification_evidence_records"),
      3,
      "savepoint has direct evidence fixtures for unique/FK checks only",
    );
    assert.equal(countRows(db, "action_records"), 0);

    assertUniqueFailures(db);
    assertRestrictDeletes(db);
  } finally {
    db.exec("ROLLBACK TO bridge_valid_fixture");
    db.exec("RELEASE bridge_valid_fixture");
  }

  assertEmptyProtectedTables(db, "post-valid-fixture");
}

function assertUniqueFailures(db) {
  for (const [label, overrides] of [
    [
      "candidate unique",
      {
        recording_link_id: "recording-link:duplicate-candidate",
        idempotency_key: "actual-proof-evidence-recording:v0_1:duplicate-key",
        target_evidence_id: "evidence:duplicate-candidate-target",
      },
    ],
    [
      "idempotency unique",
      {
        recording_link_id: "recording-link:duplicate-idempotency",
        candidate_id: "candidate:duplicate-idempotency",
        idempotency_key:
          "actual-proof-evidence-recording:v0_1:candidate:fixture:import:fixture:mapping:fixture:proof:foreign-proof:fixture:project:augnes:AG-LOCAL-1:verification_evidence",
        target_evidence_id: "evidence:duplicate-idempotency-target",
      },
    ],
    [
      "target evidence unique",
      {
        recording_link_id: "recording-link:duplicate-evidence",
        candidate_id: "candidate:duplicate-evidence",
        idempotency_key: "actual-proof-evidence-recording:v0_1:duplicate-evidence-key",
      },
    ],
  ]) {
    assert.throws(() => insertBridgeLink(db, overrides), /UNIQUE constraint failed/i, label);
  }
}

function assertRestrictDeletes(db) {
  for (const [table, whereColumn, id] of [
    [
      "ag_work_resume_proof_evidence_reconciliation_candidates",
      "candidate_id",
      "candidate:fixture",
    ],
    ["ag_work_resume_imported_contexts", "import_id", "import:fixture"],
    ["ag_work_resume_confirmed_mappings", "mapping_id", "mapping:fixture"],
    ["verification_evidence_records", "evidence_id", "evidence:fixture"],
  ]) {
    assert.throws(
      () => db.prepare(`DELETE FROM ${table} WHERE ${whereColumn} = ?`).run(id),
      /FOREIGN KEY constraint failed/i,
      `${table} delete must be restricted while bridge row exists`,
    );
  }
}

function insertSourceRows(db) {
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
        confirmed_by,
        confirmed_at,
        confirmation_reason
      )
      VALUES (
        'mapping:fixture',
        'ag_work_resume_confirmed_mapping',
        'augnes.ag_work_resume_confirmed_mapping.v0_1',
        'active',
        'foreign:scope',
        'foreign-work:1',
        'project:augnes',
        'AG-LOCAL-1',
        'proposal:fixture',
        'packet:fixture',
        'packet-hash:fixture',
        'user-core:schema-smoke',
        '2026-06-02T00:00:00.000Z',
        'Schema smoke direct DB fixture for confirmed mapping.'
      )
    `,
  ).run();

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
        imported_summary,
        created_by,
        import_reason
      )
      VALUES (
        'import:fixture',
        'ag_work_resume_imported_context',
        'augnes.ag_work_resume_imported_context.v0_1',
        'review_metadata',
        'mapping:fixture',
        'foreign:scope',
        'foreign-work:1',
        'project:augnes',
        'AG-LOCAL-1',
        'packet:fixture',
        'packet-hash:fixture',
        'Schema smoke direct DB fixture for imported context.',
        'user-core:schema-smoke',
        'Schema smoke import reason.'
      )
    `,
  ).run();

  for (const [candidateId, foreignRefId] of [
    ["candidate:fixture", "foreign-proof:fixture"],
    ["candidate:duplicate-idempotency", "foreign-proof:duplicate-idempotency"],
    ["candidate:duplicate-evidence", "foreign-proof:duplicate-evidence"],
  ]) {
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
          proposed_by,
          proposed_reason
        )
        VALUES (
          ?,
          'ag_work_resume_proof_evidence_reconciliation_candidate',
          'augnes.ag_work_resume_proof_evidence_reconciliation_candidate.v0_1',
          'accepted_for_future_recording',
          'import:fixture',
          'mapping:fixture',
          'proof',
          ?,
          'project:augnes',
          'AG-LOCAL-1',
          'Schema smoke direct DB fixture for reconciliation candidate.',
          'user-core:schema-smoke',
          'Schema smoke candidate reason.'
        )
      `,
    ).run(candidateId, foreignRefId);
  }

  for (const evidenceId of [
    "evidence:fixture",
    "evidence:duplicate-candidate-target",
    "evidence:duplicate-idempotency-target",
  ]) {
    db.prepare(
      `
        INSERT INTO verification_evidence_records (
          evidence_id,
          evidence_kind,
          label,
          status,
          result_summary,
          source_surface,
          created_by
        )
        VALUES (
          ?,
          'check_passed',
          'Schema smoke evidence fixture',
          'passed',
          'Schema smoke direct DB fixture for bridge FK validation.',
          'schema_smoke',
          'user-core:schema-smoke'
        )
      `,
    ).run(evidenceId);
  }
}

function insertBridgeLink(db, overrides = {}) {
  const record = {
    recording_link_id: "recording-link:fixture",
    record_kind: "ag_work_resume_proof_evidence_recording_link",
    schema: "augnes.ag_work_resume_proof_evidence_recording_link.v0_1",
    candidate_id: "candidate:fixture",
    import_id: "import:fixture",
    mapping_id: "mapping:fixture",
    local_target_scope: "project:augnes",
    local_target_work_id: "AG-LOCAL-1",
    target_record_kind: "verification_evidence",
    target_evidence_id: "evidence:fixture",
    target_action_id: null,
    idempotency_key:
      "actual-proof-evidence-recording:v0_1:candidate:fixture:import:fixture:mapping:fixture:proof:foreign-proof:fixture:project:augnes:AG-LOCAL-1:verification_evidence",
    actor: "user-core:schema-smoke",
    reason: "Schema smoke direct DB bridge fixture, not recording behavior.",
    redaction_summary: JSON.stringify({ no_secrets: true, raw_payloads: false }),
    trust_provenance_label: "foreign_summary_user_core_attested",
    provenance_json: JSON.stringify({
      source_import_id: "import:fixture",
      source_mapping_id: "mapping:fixture",
      source_candidate_id: "candidate:fixture",
      target_evidence_id: "evidence:fixture",
      target_record_kind: "verification_evidence",
    }),
    recording_status: "recorded",
    failure_reason: null,
    ...overrides,
  };

  const timestampColumns =
    record.created_at === undefined && record.updated_at === undefined
      ? ""
      : ", created_at, updated_at";
  const timestampValues =
    record.created_at === undefined && record.updated_at === undefined
      ? ""
      : ", @created_at, @updated_at";

  db.prepare(
    `
      INSERT INTO ${tableName} (
        recording_link_id,
        record_kind,
        schema,
        candidate_id,
        import_id,
        mapping_id,
        local_target_scope,
        local_target_work_id,
        target_record_kind,
        target_evidence_id,
        target_action_id,
        idempotency_key,
        actor,
        reason,
        redaction_summary,
        trust_provenance_label,
        provenance_json,
        recording_status,
        failure_reason
        ${timestampColumns}
      )
      VALUES (
        @recording_link_id,
        @record_kind,
        @schema,
        @candidate_id,
        @import_id,
        @mapping_id,
        @local_target_scope,
        @local_target_work_id,
        @target_record_kind,
        @target_evidence_id,
        @target_action_id,
        @idempotency_key,
        @actor,
        @reason,
        @redaction_summary,
        @trust_provenance_label,
        @provenance_json,
        @recording_status,
        @failure_reason
        ${timestampValues}
      )
    `,
  ).run(record);
}

function assertPointerDocs() {
  for (const relativePath of [
    migrationPolicyPath,
    bridgeDesignPath,
    schemaIntegrationPolicyPath,
    actualRecordingGateDesignPath,
    closeoutPath,
    authorityGatePath,
    sessionCodexGatePath,
    reconciliationDesignPath,
    lifecycleDocPath,
  ]) {
    const source = readFileSync(path.join(rootDir, relativePath), "utf8");
    assert.match(
      source,
      /ag_work_resume_proof_evidence_recording_links/,
      `${relativePath} must mention bridge table name`,
    );
  }
}

function assertEmptyProtectedTables(db, phase) {
  for (const name of [
    tableName,
    "verification_evidence_records",
    "action_records",
    "sessions",
    "work_items",
    "work_events",
    "ag_work_resume_imported_contexts",
    "ag_work_resume_confirmed_mappings",
    "ag_work_resume_mapping_proposals",
    "ag_work_resume_proof_evidence_reconciliation_candidates",
  ]) {
    assert.equal(countRows(db, name), 0, `${phase}: ${name} must have no rows`);
  }
}

function assertNoUnexpectedChangedFiles() {
  const changedFiles = gitChangedFiles();
  const allowedFiles = new Set([
    schemaRelativePath,
    migrationPolicyPath,
    bridgeDesignPath,
    schemaIntegrationPolicyPath,
    actualRecordingGateDesignPath,
    closeoutPath,
    authorityGatePath,
    sessionCodexGatePath,
    reconciliationDesignPath,
    lifecycleDocPath,
    "package.json",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_ROUTE_GATE_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_WRITER_HELPER_GATE_DESIGN_V0_1.md",
    "lib/ag-work-resume-proof-evidence-recording.ts",
    "scripts/ag-work-resume-proof-evidence-recording-create.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-writer-helper.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-route-gate-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-writer-helper-gate-design.mjs",
    smokeRelativePath,
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

  const unexpectedFiles = changedFiles.filter((file) => !allowedFiles.has(file));
  assert.deepEqual(
    unexpectedFiles,
    [],
    `bridge table schema PR changed unexpected files: ${unexpectedFiles.join(", ")}`,
  );
}

function assertNoWriterRouteUiChanges() {
  const forbiddenFiles = gitChangedFiles().filter(
    (file) =>
      file.startsWith("app/") ||
      file.startsWith("app/api/") ||
      file.startsWith("components/") ||
      file.startsWith("pages/") ||
      file.startsWith("public/") ||
      file.startsWith("apps/") ||
      file.startsWith("reports/browser/") ||
      (file.startsWith("lib/") &&
        file !== schemaRelativePath &&
        file !== "lib/ag-work-resume-proof-evidence-recording.ts") ||
      (file.startsWith("scripts/") &&
        !file.startsWith("scripts/smoke-") &&
        file !== "scripts/ag-work-resume-proof-evidence-recording-create.mjs"),
  );
  assert.deepEqual(
    forbiddenFiles,
    [],
    `bridge-table follow-up must not change route/UI/browser files or unscoped runtime files: ${forbiddenFiles.join(", ")}`,
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
    `${scriptName} output should mention temp DB path`,
  );
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

function extractTableBlock(source) {
  const start = source.indexOf(`CREATE TABLE IF NOT EXISTS ${tableName}`);
  assert.notEqual(start, -1, "bridge table block must exist");
  const endMarker =
    "\n);\n\nCREATE UNIQUE INDEX IF NOT EXISTS idx_ag_recording_links_candidate_unique";
  const end = source.indexOf(endMarker, start);
  assert.notEqual(end, -1, "bridge table must end before first bridge index");
  return source.slice(start, end + 3);
}

function requiredColumns() {
  return [
    "recording_link_id",
    "record_kind",
    "schema",
    "candidate_id",
    "import_id",
    "mapping_id",
    "local_target_scope",
    "local_target_work_id",
    "target_record_kind",
    "target_evidence_id",
    "target_action_id",
    "idempotency_key",
    "actor",
    "reason",
    "redaction_summary",
    "trust_provenance_label",
    "provenance_json",
    "recording_status",
    "failure_reason",
    "created_at",
    "updated_at",
  ];
}

function requiredNotNullColumns() {
  return [
    "record_kind",
    "schema",
    "candidate_id",
    "import_id",
    "mapping_id",
    "local_target_scope",
    "local_target_work_id",
    "target_record_kind",
    "target_evidence_id",
    "idempotency_key",
    "actor",
    "reason",
    "redaction_summary",
    "trust_provenance_label",
    "provenance_json",
    "recording_status",
    "created_at",
    "updated_at",
  ];
}

function uniqueIndexes() {
  return [
    "idx_ag_recording_links_candidate_unique",
    "idx_ag_recording_links_idempotency_unique",
    "idx_ag_recording_links_target_evidence_unique",
  ];
}

function requiredIndexes() {
  return [
    ...uniqueIndexes(),
    "idx_ag_recording_links_import_time",
    "idx_ag_recording_links_mapping_time",
    "idx_ag_recording_links_local_target_time",
    "idx_ag_recording_links_status_time",
    "idx_ag_recording_links_actor_time",
    "idx_ag_recording_links_trust_label_time",
  ];
}

function requiredIndexColumns() {
  return {
    idx_ag_recording_links_candidate_unique: ["candidate_id"],
    idx_ag_recording_links_idempotency_unique: ["idempotency_key"],
    idx_ag_recording_links_target_evidence_unique: ["target_evidence_id"],
    idx_ag_recording_links_import_time: ["import_id", "created_at"],
    idx_ag_recording_links_mapping_time: ["mapping_id", "created_at"],
    idx_ag_recording_links_local_target_time: [
      "local_target_scope",
      "local_target_work_id",
      "created_at",
    ],
    idx_ag_recording_links_status_time: ["recording_status", "created_at"],
    idx_ag_recording_links_actor_time: ["actor", "created_at"],
    idx_ag_recording_links_trust_label_time: ["trust_provenance_label", "created_at"],
  };
}

function assertIsoTimestamp(value, field) {
  assert.match(
    value,
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    `${field} must use ISO-like strftime timestamp`,
  );
}

function gitChangedFiles() {
  return [
    ...new Set([
      ...gitLinesAllowFailure(["diff", "--name-only", "origin/main...HEAD"]),
      ...gitLines(["diff", "--name-only"]),
      ...gitLines(["diff", "--cached", "--name-only"]),
      ...gitLines(["ls-files", "--others", "--exclude-standard"]),
    ]),
  ];
}

function gitLines(args) {
  return execFileSync("git", args, { encoding: "utf8" })
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

function assertNoForbiddenSmokeImports(source) {
  const imports = [
    ...source.matchAll(/^\s*import\s+[^;]+;$/gm),
    ...source.matchAll(/\bimport\(\s*["'][^"']+["']\s*\)/g),
  ].map((match) => match[0]);
  const importText = imports.join("\n");
  for (const forbiddenImport of [
    /node:http/i,
    /node:https/i,
    /node:net/i,
    /node:tls/i,
    /node:dgram/i,
    /fetch\s*\(/i,
  ]) {
    assert.doesNotMatch(
      importText,
      forbiddenImport,
      `schema smoke must not import network helpers: ${forbiddenImport}`,
    );
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
