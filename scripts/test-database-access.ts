import assert from "node:assert/strict";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { openDatabase } from "../lib/db";
import { DatabaseAccessError, PREPARED_DATABASE_SCHEMA_SIGNATURE } from "../lib/db/prepared-database.mjs";
import { configureOwnedDatabase, withOwnedDatabase } from "../lib/db/connection-ownership.mjs";
import { GET } from "../app/api/vnext/continuity-pins/route";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { canonicalStructuralSchemaContractSignature, prepareRuntimeDatabase, restoreRuntimeDatabase, inspectRecoveryDatabaseFile } from "./runtime-database-bootstrap.mjs";
import { createRecoveryBackup } from "./recovery-backup.mjs";
import { runAugnesDogfoodFixture } from "../lib/dogfood/augnes-on-augnes-dogfood";
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01 } from "../lib/vnext/persistence/project-identity-registry";

function request(project: string) {
  return new Request(`http://127.0.0.1:3100/api/vnext/continuity-pins?project_id=${project}`, {
    headers: { host: "127.0.0.1:3100", origin: "http://127.0.0.1:3100", "sec-fetch-site": "same-origin" },
  });
}
export function databaseSnapshot(db: Database.Database) {
  const schema = db.prepare("SELECT type, name, tbl_name, sql FROM sqlite_schema ORDER BY type,name").all();
  const tables = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name").all() as { name: string }[];
  return { schema, records: tables.map(({ name }) => [name, db.prepare(`SELECT * FROM "${name.replaceAll('"', '""')}"`).all().map(row => JSON.stringify(row)).sort()]) };
}

// Also used around populated pin collections, so target resolution and its
// transitive runner-ledger reads cannot hide preparation behind an empty list.
export async function assertOrdinaryRequest<T>(databasePath: string, read: () => Promise<T>): Promise<T> {
  const control = new Database(databasePath, { readonly: true, fileMustExist: true });
  const before = databaseSnapshot(control);
  const prepare = Database.prototype.prepare, exec = Database.prototype.exec, close = Database.prototype.close;
  const handles = new Set<Database.Database>();
  let closed = 0;
  const inspect = (sql: string) => assert(!/\b(CREATE|ALTER|DROP|REINDEX|VACUUM|ATTACH)\b/i.test(sql), "GET attempted schema preparation");
  Database.prototype.prepare = function (this: Database.Database, sql: string) { handles.add(this); inspect(sql); return prepare.call(this, sql); } as typeof prepare;
  Database.prototype.exec = function (this: Database.Database, sql: string) { handles.add(this); inspect(sql); return exec.call(this, sql); };
  Database.prototype.close = function (this: Database.Database) { closed++; return close.call(this); };
  try {
    const value = await read();
    assert.equal(handles.size, 1); assert.equal(closed, 1);
    for (const handle of handles) assert.equal(handle.open, false);
    return value;
  } finally {
    Database.prototype.prepare = prepare; Database.prototype.exec = exec; Database.prototype.close = close;
    try { assert.deepEqual(databaseSnapshot(control), before); } finally { control.close(); }
  }
}
function causeContains(error: unknown, expected: unknown): boolean {
  return error === expected || (error instanceof Error && causeContains(error.cause, expected)) ||
    (error instanceof AggregateError && error.errors.some(e => causeContains(e, expected)));
}

export async function testDatabaseAccess() {
  const root = fs.mkdtempSync(path.join(tmpdir(), "augnes-access-"));
  const databasePath = path.join(root, "prepared.db");
  const previous = process.env.AUGNES_DB_PATH;
  const fingerprint = "a".repeat(64);
  const lifecycle = { databasePath, backupDirectory: path.join(root, "backups"), repositoryRoot: process.cwd(), instanceId: "database-access-regression", repositoryFingerprint: fingerprint, databaseOverrideActive: true };
  const proto = Database.prototype;
  const original = { pragma: proto.pragma, prepare: proto.prepare, exec: proto.exec, close: proto.close, backup: proto.backup, mkdirSync: fs.mkdirSync };
  let fixture: Database.Database | undefined;
  try {
    process.env.AUGNES_DB_PATH = databasePath;
    assert.equal(canonicalStructuralSchemaContractSignature(), PREPARED_DATABASE_SCHEMA_SIGNATURE);
    // The actual startup owner supplies a complete store without a manual step.
    await prepareRuntimeDatabase(lifecycle as unknown as Parameters<typeof prepareRuntimeDatabase>[0]);
    fixture = openDatabase();
    const workspace = getOrCreateDefaultWorkspaceIdentityV01(fixture);
    const project = getOrCreateCanonicalProjectForLocalRootV01(fixture, {
      workspace_id: workspace.workspace_id,
      local_root: normalizeLocalProjectRootRefV01(root, { base_path: root }),
      display_name: "Database access fixture",
    });
    fixture.prepare("INSERT INTO agents (id,name) VALUES ('agent:access','preserved record')").run();
    const projectId = project.project.project_id;
    fixture.close(); fixture = undefined;

    // Real post-construction failures, with each constructed handle observed.
    for (const stage of ["configuration", "readiness"] as const) {
      const primary = new Error(`injected_${stage}`);
      let acquired: Database.Database | undefined;
      if (stage === "configuration") proto.pragma = function (this: Database.Database) { acquired = this; throw primary; };
      else proto.prepare = function (this: Database.Database) { acquired = this; throw primary; };
      try { assert.throws(() => openDatabase(), e => causeContains(e, primary)); }
      finally { proto.pragma = original.pragma; proto.prepare = original.prepare; }
      assert(acquired); assert.equal(acquired.open, false);
    }
    const failedCleanup = new Error("injected_close_refusal");
    const primary = new Error("injected_setup");
    const uncertain = new Database(":memory:");
    uncertain.close = () => { throw failedCleanup; };
    try {
      assert.throws(() => configureOwnedDatabase(uncertain, () => { throw primary; }), e =>
        e instanceof AggregateError && e.cause === primary && e.errors.includes(failedCleanup));
      assert.equal(uncertain.open, true, "failed cleanup must not be described as released");
    } finally { original.close.call(uncertain); }
    // Preparation owns failure too; borrowed handles are never silently closed.
    const preparedFailure = new Database(":memory:");
    assert.throws(() => withOwnedDatabase(preparedFailure, () => { throw primary; }), e => e === primary);
    assert.equal(preparedFailure.open, false);
    let migrationHandle: Database.Database | undefined;
    await assert.rejects(prepareRuntimeDatabase({ ...lifecycle, databasePath: path.join(root, "failed-prepare.db"), dependencies: { migrateDatabase(db: Database.Database) { migrationHandle = db; throw primary; } } } as unknown as Parameters<typeof prepareRuntimeDatabase>[0]), e => causeContains(e, primary));
    assert(migrationHandle); assert.equal(migrationHandle.open, false);
    assert.equal(fs.existsSync(path.join(root, "failed-prepare.db")), false);

    // The existing explicit CLI owner, including its owned vs borrowed contract.
    const { initializeDatabase } = await import("./db-common.mjs");
    const cli = initializeDatabase(); cli.close();
    for (const stage of ["pragma", "exec"] as const) {
      let acquired: Database.Database | undefined;
      proto[stage] = function (this: Database.Database) { acquired = this; throw primary; } as never;
      try { assert.throws(() => initializeDatabase(), e => causeContains(e, primary)); }
      finally { proto[stage] = original[stage] as never; }
      assert(acquired); assert.equal(acquired.open, false);
    }
    const borrowed = new Database(":memory:");
    borrowed.exec = () => { throw primary; };
    try { assert.throws(() => initializeDatabase(borrowed), e => e === primary); assert.equal(borrowed.open, true); }
    finally { borrowed.close(); }

    fixture = openDatabase();
    const before = databaseSnapshot(fixture), filesBefore = fs.readdirSync(root).sort(), bytesBefore = fs.readFileSync(databasePath);
    let closes = 0, directories = 0, preparationSQL = 0;
    const observed = new Set<Database.Database>();
    const inspect = (sql: string) => {
      if (/\b(CREATE|ALTER|DROP|REINDEX|VACUUM|ATTACH)\b/i.test(sql)) { preparationSQL++; throw new Error("ordinary_access_attempted_preparation"); }
    };
    proto.exec = function (this: Database.Database, sql: string) { observed.add(this); inspect(sql); return original.exec.call(this, sql); };
    proto.prepare = function (this: Database.Database, sql: string) { observed.add(this); inspect(sql); return original.prepare.call(this, sql); } as typeof proto.prepare;
    proto.close = function (this: Database.Database) { closes++; return original.close.call(this); };
    fs.mkdirSync = (() => { directories++; throw new Error("ordinary_access_attempted_directory_creation"); }) as typeof fs.mkdirSync;
    syncBuiltinESMExports();
    try {
      const ordinary = openDatabase();
      try { assert.equal(ordinary.prepare<[], { name: string }>("SELECT name FROM agents WHERE id='agent:access'").get()?.name, "preserved record"); }
      finally { ordinary.close(); }
      const response = await GET(request(projectId));
      assert.equal(response.status, 200); assert.equal((await response.json()).ok, true);
    } finally {
      proto.exec = original.exec; proto.prepare = original.prepare; proto.close = original.close;
      fs.mkdirSync = original.mkdirSync; syncBuiltinESMExports();
    }
    assert.equal(preparationSQL, 0); assert.equal(directories, 0); assert.equal(closes, 2);
    assert.equal(observed.size, 2); for (const db of observed) assert.equal(db.open, false);
    assert.deepEqual(databaseSnapshot(fixture), before); assert.deepEqual(fs.readFileSync(databasePath), bytesBefore);
    assert.deepEqual(fs.readdirSync(root).sort(), filesBefore);
    fixture.close(); fixture = undefined;

    for (const kind of ["missing-parent", "missing-file", "unprepared", "incompatible", "invalid-ledger", "invalid-package", "not-sqlite"] as const) {
      const target = kind === "missing-parent" ? path.join(root, "absent", "db.sqlite") : path.join(root, `${kind}.db`);
      if (kind === "unprepared" || kind === "incompatible") withOwnedDatabase(new Database(target), db => { if (kind === "incompatible") db.exec("CREATE TABLE unrelated (value TEXT)"); });
      if (kind === "invalid-ledger" || kind === "invalid-package") {
        fs.copyFileSync(databasePath, target);
        withOwnedDatabase(new Database(target), db => db.exec(kind === "invalid-ledger" ? "DELETE FROM augnes_schema_migrations" : "DELETE FROM augnes_package_identity_guard"));
      }
      if (kind === "not-sqlite") fs.writeFileSync(target, "incompatible storage");
      const bytes = fs.existsSync(target) ? fs.readFileSync(target) : null, files = fs.readdirSync(root).sort();
      process.env.AUGNES_DB_PATH = target;
      const code = kind.startsWith("missing") ? "database_missing" : kind === "unprepared" ? "database_unprepared" : "database_incompatible";
      assert.throws(() => openDatabase(), e => e instanceof DatabaseAccessError && e.code === code);
      const response = await GET(request(projectId)); const body = await response.json();
      assert.equal(response.status, 503); assert.equal(body.ok, false); assert.equal(body.error_code, code);
      assert.equal(JSON.stringify(body).includes(root), false); assert.equal("collection" in body, false);
      assert.deepEqual(fs.readdirSync(root).sort(), files);
      assert.deepEqual(fs.existsSync(target) ? fs.readFileSync(target) : null, bytes);
    }
    // Same pathname, replacement image: a previous successful read confers no readiness.
    process.env.AUGNES_DB_PATH = databasePath;
    fs.renameSync(databasePath, `${databasePath}.saved`); new Database(databasePath).close();
    assert.throws(() => openDatabase(), e => e instanceof DatabaseAccessError && e.code === "database_unprepared");
    fs.unlinkSync(databasePath); fs.renameSync(`${databasePath}.saved`, databasePath);

    // The supported ledgerless upgrade fixture is nonempty and exact, not an
    // arbitrary partial schema made acceptable for this test.
    withOwnedDatabase(new Database(databasePath), db => db.exec("DROP TABLE augnes_schema_migrations; DROP TABLE augnes_package_identity_guard;"));
    assert.throws(() => openDatabase(), e => e instanceof DatabaseAccessError && e.code === "database_unprepared");
    await prepareRuntimeDatabase(lifecycle as unknown as Parameters<typeof prepareRuntimeDatabase>[0]);
    fixture = openDatabase();
    assert.equal(fixture.prepare<[], { name: string }>("SELECT name FROM agents WHERE id='agent:access'").get()?.name, "preserved record");
    fixture.close(); fixture = undefined;
    const backupOptions = { databasePath, backupDirectory: lifecycle.backupDirectory, applicationScopeFingerprint: fingerprint,
      sourceApplication: { application_version: null, build_identity: null, package_contract: null, package_contract_version: null, runtime_contract: null, runtime_schema_version: null }, reason: "manual_recovery", inspectDatabase: inspectRecoveryDatabaseFile } as unknown as Parameters<typeof createRecoveryBackup>[0];
    let backupHandle: Database.Database | undefined;
    proto.backup = function (this: Database.Database) { backupHandle = this; return Promise.reject(primary); };
    try { await assert.rejects(createRecoveryBackup(backupOptions), e => causeContains(e, primary)); }
    finally { proto.backup = original.backup; }
    assert(backupHandle); assert.equal(backupHandle.open, false);
    const backup = await createRecoveryBackup(backupOptions);
    withOwnedDatabase(openDatabase(), db => db.prepare("UPDATE agents SET name='changed' WHERE id='agent:access'").run());
    await restoreRuntimeDatabase({ ...lifecycle, selectedBackupId: backup.manifest.backup_id } as unknown as Parameters<typeof restoreRuntimeDatabase>[0]);
    await prepareRuntimeDatabase(lifecycle as unknown as Parameters<typeof prepareRuntimeDatabase>[0]);
    withOwnedDatabase(openDatabase(), db => assert.equal(db.prepare<[], { name: string }>("SELECT name FROM agents WHERE id='agent:access'").get()?.name, "preserved record"));
    assert.equal((await GET(request(projectId))).status, 200);
    const runnerFixturePath = path.join(root, "runner-fixture", "ledger.db");
    const runnerReport = await runAugnesDogfoodFixture({ dbPath: runnerFixturePath, tempDir: root });
    assert.equal(runnerReport.runner_fixture_summary.run_id, "autonomy_run.dogfood.augnes_on_augnes_v0_1");
    process.env.AUGNES_DB_PATH = runnerFixturePath;
    withOwnedDatabase(openDatabase(), db => assert(db.prepare("SELECT 1 FROM autonomy_runs").get()));
    assert.equal(fs.readdirSync(root).some(name => /augnes-(stage|rollback|bootstrap)/.test(name)), false);
    console.log(JSON.stringify({ database_access: "pass", cleanup_faults: ["configuration", "readiness", "preparation", "cleanup_refusal_reported"], prepared_read_and_GET: "unchanged", missing_unprepared_incompatible: "distinct_refusal", replacement: "rechecked", nonempty_upgrade_restore_restart: "preserved", owned_connections: "closed" }));
  } finally {
    proto.pragma = original.pragma; proto.prepare = original.prepare; proto.exec = original.exec; proto.close = original.close; proto.backup = original.backup;
    fs.mkdirSync = original.mkdirSync; syncBuiltinESMExports();
    if (fixture?.open) fixture.close();
    if (previous === undefined) delete process.env.AUGNES_DB_PATH; else process.env.AUGNES_DB_PATH = previous;
    fs.rmSync(root, { recursive: true, force: true });
  }
}
if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  testDatabaseAccess().catch(error => { console.error(error); process.exitCode = 1; });
}
