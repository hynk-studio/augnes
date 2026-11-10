import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Database from "better-sqlite3";
import { structuralSchemaContractSignature } from "../lib/db/structural-schema-contract.mjs";
import { CANONICAL_DATABASE_SUPPORTED_SOURCE_SCHEMA_SIGNATURES } from "../lib/db/canonical-database-contract.mjs";
import { openPreparedDatabase, PREPARED_DATABASE_SCHEMA_SIGNATURE } from "../lib/db/prepared-database.mjs";
import { createCanonicalTestResourceRoot, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Frozen pre-extraction source is the compatibility oracle, not a moving main.
const baseline = "f034b71192e99bf8adc48a032e020e25140107bf";
const instant = "2026-10-29T00:00:00.000Z";
const canonicalPath = "scripts/canonical-database-migrations.mjs";
const facadePath = "scripts/db-migrations.mjs";
const researchPath = "scripts/database-migrations/research-candidate.mjs";

function frozenClock(operation) {
  const RealDate = globalThis.Date;
  globalThis.Date = class extends RealDate {
    constructor(...args) { super(...(args.length ? args : [instant])); }
    static now() { return RealDate.parse(instant); }
  };
  try { return operation(); } finally { globalThis.Date = RealDate; }
}

// Copy only the actual relative import closure. No worktree, dependency tree,
// production registry or extension seam is created. Source bytes are retained.
function copyClosure(destination, read) {
  const copied = new Map();
  function copy(relative) {
    if (copied.has(relative)) return;
    assert(!relative.startsWith("../") && !path.isAbsolute(relative));
    const source = read(relative);
    copied.set(relative, source);
    const target = path.join(destination, relative);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, source);
    if (relative.endsWith(".mjs")) {
      for (const match of source.matchAll(/(?:from\s+|import\s*)["'](\.[^"']+)["']/gu)) {
        copy(path.posix.normalize(path.posix.join(path.posix.dirname(relative), match[1])));
      }
    }
  }
  copy(canonicalPath); copy(facadePath); copy("lib/db/schema.sql");
  return copied;
}

async function loadClosure(root) {
  return {
    canonical: await import(pathToFileURL(path.join(root, canonicalPath)).href),
    migrations: await import(pathToFileURL(path.join(root, facadePath)).href),
  };
}

function snapshot(db) {
  const schema = db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_schema ORDER BY type,name").all();
  const records = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name").all().map(({ name }) => [
    name,
    db.prepare(`SELECT * FROM "${name.replaceAll('"', '""')}"`).all().map(row => JSON.stringify(row)).sort(),
  ]);
  return { schema, records };
}

function openFixture(filename, trace = []) {
  const db = new Database(filename, { verbose: sql => trace.push(sql) });
  // Existing SQL random identities are controlled at their generation point.
  // No result, schema, timestamp or identity is deleted/normalized for comparison.
  let randomCalls = 0;
  db.function("randomblob", size => Buffer.alloc(size, ++randomCalls));
  db.pragma("foreign_keys = ON");
  return db;
}

function seedRecords(db) {
  db.prepare("INSERT INTO agents(id,name,created_at) VALUES ('agent:parity','Migration preservation',?)").run(instant);
  db.prepare("INSERT INTO sessions(id,agent_id,scope,title,started_at) VALUES ('session:parity','agent:parity','project:augnes','Preserved session',?)").run(instant);
  db.prepare("INSERT INTO messages(id,session_id,role,content,created_at) VALUES ('message:parity','session:parity','user','synthetic private fixture',?)").run(instant);
  db.prepare("INSERT INTO vnext_workspace_identities VALUES ('workspace:parity','workspace_identity.v0.1','canonical','canonical_registry','parity',?)").run(instant);
  db.prepare("INSERT INTO vnext_project_identities VALUES ('workspace:parity','project:parity','project_identity.v0.1','canonical','canonical_registry','Preserved native project',?)").run(instant);
  seedCore(db);
  db.prepare(`INSERT INTO research_candidate_manual_note_preview_drafts (
    preview_draft_id,status,source_kind,operator_note_label,parser_version,preview_version,input_fingerprint,
    preview_json,authority_json,runtime_boundary_json,no_side_effects_json,created_at,updated_at
  ) VALUES ('draft:parity','preview_draft','manual_paste','Preserved research draft','parser.v1','preview.v1',?,
    '{"observation":"synthetic retained observation"}','{"promotion":false}','{}','{}',?,?)`).run(`sha256:${"1".repeat(64)}`, instant, instant);
  db.prepare(`INSERT INTO research_candidate_manual_note_preview_draft_discards (
    discard_id,preview_draft_id,discarded_at,discarded_by,discard_reason,authority_json,no_side_effects_json
  ) VALUES ('discard:parity','draft:parity',?,'operator:fixture','Retain historical decision','{}','{}')`).run(instant);
}

function seedCore(db) {
  db.prepare(`INSERT INTO vnext_core_records (
    record_kind,record_id,workspace_id,project_id,fingerprint,payload_json,created_at
  ) VALUES ('semantic_state','state:parity','workspace:parity','project:parity',?,
    '{"summary":"Preserve native state","source":"fixture"}',?)`).run(`sha256:${"2".repeat(64)}`, instant);
}

function compareExports(before, after) {
  assert.deepEqual(Object.keys(after), Object.keys(before));
  for (const key of Object.keys(before)) {
    assert.equal(typeof after[key], typeof before[key], key);
    if (typeof before[key] === "function") assert.equal(after[key].length, before[key].length, key);
    else assert.deepEqual(after[key], before[key], key);
  }
}

function migrateImage(module, filename) {
  const trace = [];
  const db = openFixture(filename, trace);
  try {
    trace.length = 0;
    const result = frozenClock(() => module.canonical.applyCanonicalDatabaseMigrations(db));
    assert(!result || typeof result.then !== "function", "preparation remains synchronous");
    const executionTrace = [...trace];
    assert.equal(db.inTransaction, false);
    const image = snapshot(db);
    assert.equal(structuralSchemaContractSignature(db), PREPARED_DATABASE_SCHEMA_SIGNATURE);
    assert.deepEqual(db.pragma("foreign_key_check"), []);
    assert.equal(db.pragma("integrity_check", { simple: true }), "ok");
    return { result, trace: executionTrace, image };
  } finally { db.close(); }
}

function oldCoreSql(migrations) {
  const sql = migrations.vNextDurableSemanticStoreSchemaSqlV01;
  const predecessor = sql.replace(/,\s*'work_expectation_record'/u, "");
  assert.notEqual(predecessor, sql);
  return predecessor;
}

function transactionControls(module) {
  const db = openFixture(":memory:");
  try {
    db.exec(oldCoreSql(module.migrations)); seedCore(db);
    const before = snapshot(db);
    db.exec("BEGIN");
    assert.throws(() => module.migrations.migrateVNextDurableSemanticStoreV01(db),
      /vnext_core_record_kind_upgrade_nested_transaction_forbidden/u);
    assert.equal(db.inTransaction, true); db.exec("ROLLBACK");
    assert.deepEqual(snapshot(db), before);

    const primary = new Error("migration_family_injected_mid_upgrade");
    const exec = db.exec;
    db.exec = function (sql) {
      if (sql.includes("DROP TRIGGER IF EXISTS trg_vnext_core_records_immutable_update")) throw primary;
      return exec.call(this, sql);
    };
    try { assert.throws(() => module.migrations.migrateVNextDurableSemanticStoreV01(db), error => error === primary); }
    finally { db.exec = exec; }
    assert.equal(db.inTransaction, false);
    assert.deepEqual(snapshot(db), before, "migration-owned transaction rolls back temporary table and copy");
    const result = module.migrations.migrateVNextDurableSemanticStoreV01(db);
    assert.deepEqual(result.rebuilt_tables, ["vnext_core_records"]);
    assert.deepEqual(db.prepare("SELECT * FROM vnext_core_records").all().map(JSON.stringify), before.records.find(([name]) => name === "vnext_core_records")[1]);
    assert.throws(() => db.prepare("DELETE FROM vnext_core_records").run(), /vnext_core_records_immutable/u);
    return snapshot(db);
  } finally { db.close(); }
}

function partialProgressControl(module) {
  const db = openFixture(":memory:");
  const primary = new Error("migration_family_injected_research_failure");
  try {
    const prepare = db.prepare;
    db.prepare = function (sql) {
      if (sql.includes("AND name = 'research_candidate_manual_note_preview_draft_discards'")) throw primary;
      return prepare.call(this, sql);
    };
    try { assert.throws(() => frozenClock(() => module.canonical.applyCanonicalDatabaseMigrations(db)), error => error === primary); }
    finally { db.prepare = prepare; }
    assert.equal(db.inTransaction, false);
    assert(db.prepare("SELECT name FROM sqlite_schema WHERE name='vnext_core_records'").get(), "earlier native preparation survives later failure");
    assert.equal(db.prepare("SELECT count(*) AS count FROM augnes_schema_migrations").get().count, 0, "ledger stays last");
    const failed = snapshot(db);
    frozenClock(() => module.canonical.applyCanonicalDatabaseMigrations(db));
    return { failed, recovered: snapshot(db) };
  } finally { db.close(); }
}

function researchPartialProgressControl(module) {
  const db = openFixture(":memory:");
  const primary = new Error("migration_family_injected_index_failure");
  try {
    const prepare = db.prepare;
    db.prepare = function (sql) {
      if (sql.includes("CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_note_preview_drafts_input")) throw primary;
      return prepare.call(this, sql);
    };
    try { assert.throws(() => module.migrations.migrateResearchCandidateManualNotePreviewDrafts(db), error => error === primary); }
    finally { db.prepare = prepare; }
    assert.equal(db.inTransaction, false);
    assert(db.prepare("SELECT name FROM sqlite_schema WHERE name='research_candidate_manual_note_preview_drafts'").get());
    assert.equal(db.prepare("SELECT count(*) AS count FROM sqlite_schema WHERE type='index' AND name LIKE 'idx_research_candidate_manual_note_preview_drafts_%'").get().count, 2);
    const failed = snapshot(db);
    const resumed = module.migrations.migrateResearchCandidateManualNotePreviewDrafts(db);
    assert.equal(resumed.created_table, false);
    assert.equal(resumed.created_indexes.length, 2);
    return { failed, resumed, image: snapshot(db) };
  } finally { db.close(); }
}

function historicalOrderControl(module, schema) {
  const trace = [];
  const db = openFixture(":memory:", trace);
  try {
    // Direct migration compatibility fixture: native kind upgrade plus legacy
    // scoring and mailbox rebuild. Runtime predecessor admission is tested
    // separately with the exact supported ledgerless image below.
    db.exec(oldCoreSql(module.migrations)); seedCore(db);
    const proposal = schema.match(/CREATE TABLE IF NOT EXISTS state_delta_proposals \([\s\S]*?\n\);/u)[0];
    const scoringColumns = new Set(module.migrations.proposalScoringColumns.map(value => value.name));
    const stripped = proposal.split("\n").filter(line => !scoringColumns.has(line.trim().split(/\s/u)[0])).join("\n");
    db.exec(stripped);
    const mailbox = schema.match(/CREATE TABLE IF NOT EXISTS coordination_events \([\s\S]*?\n\);/u)[0];
    db.exec(mailbox.replace(/,\n\s*'mailbox_message_created'[\s\S]*?'mailbox_message_expired'/u, ""));
    db.prepare("INSERT INTO coordination_events(event_id,event_type,actor,source_surface,authority_level,created_at) VALUES ('event:parity','handoff_created','operator:fixture','codex','raw_observation',?)").run(instant);
    trace.length = 0;
    const result = frozenClock(() => module.canonical.applyCanonicalDatabaseMigrations(db));
    const executionTrace = [...trace];
    assert(result.result.added_columns.length > 0);
    assert.equal(result.mailboxResult.rebuilt_coordination_events, true);
    assert.equal(result.vNextDurableSemanticStoreResult.rebuilt_tables.length, 1);
    assert.equal(db.prepare("SELECT event_id FROM coordination_events").get().event_id, "event:parity");
    return { result, trace: executionTrace, image: snapshot(db) };
  } finally { db.close(); }
}

export async function testCanonicalMigrationFamilies() {
  const owner = createCanonicalTestResourceRoot("ag-resource-test-");
  const root = owner.root;
  let primaryFailure;
  let checks = 0;
  try {
    const beforeRoot = path.join(root, "baseline"), afterRoot = path.join(root, "candidate");
    copyClosure(beforeRoot, relative => execFileSync("git", ["show", `${baseline}:${relative}`], {
      cwd: repositoryRoot, encoding: "utf8", timeout: 10_000, maxBuffer: 4 * 1024 * 1024,
    }));
    const candidateFiles = copyClosure(afterRoot, relative => readFileSync(path.join(repositoryRoot, relative), "utf8"));
    const before = await loadClosure(beforeRoot), after = await loadClosure(afterRoot);
    compareExports(before.canonical, after.canonical); compareExports(before.migrations, after.migrations); checks++;
    const seedPath = path.join(root, "seed.db");
    const seed = openFixture(seedPath);
    try { frozenClock(() => before.canonical.applyCanonicalDatabaseMigrations(seed)); seedRecords(seed); }
    finally { seed.close(); }
    for (const kind of ["empty", "current", "ledgerless-predecessor"]) {
      const left = path.join(root, `${kind}-baseline.db`), right = path.join(root, `${kind}-candidate.db`);
      if (kind !== "empty") {
        copyFileSync(seedPath, left); copyFileSync(seedPath, right);
        if (kind === "ledgerless-predecessor") for (const filename of [left, right]) {
          const db = openFixture(filename);
          try {
            db.exec("DROP TABLE augnes_schema_migrations; DROP TABLE augnes_package_identity_guard");
            assert(CANONICAL_DATABASE_SUPPORTED_SOURCE_SCHEMA_SIGNATURES.includes(structuralSchemaContractSignature(db)));
          } finally { db.close(); }
          assert.throws(() => openPreparedDatabase(filename), error => error.code === "database_unprepared");
        }
      }
      const expected = migrateImage(before, left), actual = migrateImage(after, right);
      assert.deepEqual(actual, expected, `${kind}: result, exact effective SQL/transaction order, full schema and records`);
      assert.deepEqual(Object.keys(actual.result), Object.keys(expected.result), `${kind}: public result field order`);
      if (kind !== "empty") {
        assert(actual.image.records.find(([name]) => name === "vnext_core_records")[1].length > 0);
        assert(actual.image.records.find(([name]) => name === "research_candidate_manual_note_preview_draft_discards")[1].length > 0);
        assert.equal(JSON.parse(actual.image.records.find(([name]) => name === "messages")[1][0]).content, "augnes.private-material.not-persisted.v1");
      }
      const repeatedExpected = migrateImage(before, left), repeatedActual = migrateImage(after, right);
      assert.deepEqual(repeatedActual, repeatedExpected, `${kind}: repeat after reopen`);
      assert.deepEqual(repeatedActual.image, actual.image, `${kind}: repeated application changes no stored data/schema`);
      assert.deepEqual(repeatedActual.result.migrationLedgerResult.inserted_migration_ids, []);
      const ordinary = openPreparedDatabase(right);
      try { assert.deepEqual(snapshot(ordinary), actual.image); } finally { ordinary.close(); }
      checks++;
    }
    assert.deepEqual(transactionControls(after), transactionControls(before)); checks++;
    assert.deepEqual(partialProgressControl(after), partialProgressControl(before)); checks++;
    assert.deepEqual(researchPartialProgressControl(after), researchPartialProgressControl(before)); checks++;
    const schema = candidateFiles.get("lib/db/schema.sql");
    assert.deepEqual(historicalOrderControl(after, schema), historicalOrderControl(before, schema)); checks++;

    // Positive detection control edits an actual production family in an owned
    // copy. Generic preparation, composition and unrelated owners stay exact.
    const controlRoot = path.join(root, "research-control");
    copyClosure(controlRoot, relative => candidateFiles.get(relative));
    const original = candidateFiles.get(researchPath);
    const changed = original.replaceAll("idx_research_candidate_manual_note_preview_drafts_input", "idx_research_candidate_manual_note_preview_drafts_input_control");
    assert.notEqual(changed, original); writeFileSync(path.join(controlRoot, researchPath), changed);
    for (const [relative, source] of candidateFiles) {
      if (relative !== researchPath) assert.equal(readFileSync(path.join(controlRoot, relative), "utf8"), source);
    }
    const control = await loadClosure(controlRoot);
    const db = openFixture(":memory:");
    const normal = openFixture(":memory:");
    try {
      const alteredResult = frozenClock(() => control.canonical.applyCanonicalDatabaseMigrations(db));
      const ordinaryResult = frozenClock(() => after.canonical.applyCanonicalDatabaseMigrations(normal));
      seedRecords(db); seedRecords(normal);
      const alteredImage = snapshot(db), ordinaryImage = snapshot(normal);
      assert.throws(() => assert.deepEqual(alteredImage, ordinaryImage), assert.AssertionError, "parity checker must detect actual family change");
      assert(db.prepare("SELECT name FROM sqlite_schema WHERE name='idx_research_candidate_manual_note_preview_drafts_input_control'").get());
      assert.deepEqual(alteredImage.schema.filter(row => !row.name.startsWith("idx_research_candidate_")), ordinaryImage.schema.filter(row => !row.name.startsWith("idx_research_candidate_")));
      assert.deepEqual(alteredImage.records, ordinaryImage.records);
      assert.deepEqual(Object.fromEntries(Object.entries(alteredResult).filter(([key]) => !key.startsWith("researchCandidate"))), Object.fromEntries(Object.entries(ordinaryResult).filter(([key]) => !key.startsWith("researchCandidate"))));
      assert.notDeepEqual(alteredResult.researchCandidateManualNotePreviewDraftsResult, ordinaryResult.researchCandidateManualNotePreviewDraftsResult);
    } finally { db.close(); normal.close(); }
    checks++;
    console.log(`Canonical migration families: ${checks} compatibility/control groups passed (baseline ${baseline}).`);
  } catch (error) {
    primaryFailure = error;
    throw error;
  } finally {
    const [cleanup] = cleanupCanonicalTestResources([owner]);
    if (!cleanup.completed) {
      const error = new Error(`migration_family_cleanup_failed: ${cleanup.failures.join(",")}`);
      if (primaryFailure) throw new AggregateError([primaryFailure, error], "Migration test and cleanup failed", { cause: primaryFailure });
      throw error;
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  testCanonicalMigrationFamilies().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
