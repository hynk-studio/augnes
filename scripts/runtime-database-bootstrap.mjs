import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  chmodSync,
  closeSync,
  existsSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import { ensureApplicationDirectory } from "./augnes-local-paths.mjs";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";

export const DATABASE_BOOTSTRAP_CONTRACT = "augnes-local-database-bootstrap-v1";
const SQLITE_SIDE_SUFFIXES = ["-wal", "-shm", "-journal"];

export class PublicDatabaseBootstrapError extends Error {
  constructor(code, cause) {
    super(code, cause ? { cause } : undefined);
    this.name = "PublicDatabaseBootstrapError";
    this.code = code;
  }
}

export async function inspectRuntimeDatabase({ databasePath } = {}) {
  if (!databasePath || !path.isAbsolute(databasePath)) {
    throw new PublicDatabaseBootstrapError("database_path_invalid");
  }
  if (!existsSync(databasePath)) {
    return {
      database_state: "missing",
      schema_classification: "missing",
      schema_version: null,
    };
  }
  let classification;
  try {
    classification = classifyExistingDatabase(databasePath);
  } catch (error) {
    if (error?.code === "database_schema_unsupported") {
      return {
        database_state: "unsupported",
        schema_classification: "unsupported",
        schema_version: null,
      };
    }
    throw error;
  }
  return {
    database_state: classification.state,
    schema_classification: classification.state,
    schema_version: classification.schemaVersion,
  };
}

export async function prepareRuntimeDatabase({
  databasePath,
  backupDirectory,
  repositoryRoot,
  instanceId,
  databaseOverrideActive = false,
  dependencies = {},
} = {}) {
  if (
    !databasePath ||
    !backupDirectory ||
    !repositoryRoot ||
    !instanceId ||
    !path.isAbsolute(databasePath) ||
    !path.isAbsolute(backupDirectory)
  ) {
    throw new PublicDatabaseBootstrapError("database_path_invalid");
  }

  const operationId = `${process.pid}-${randomUUID()}`;
  const databaseDirectory = path.dirname(databasePath);
  const stagingPath = `${databasePath}.augnes-stage-${operationId}`;
  const lockPath = `${databasePath}.augnes-bootstrap.lock`;
  let lock = null;
  let recoveryBackupPath = null;

  try {
    ensureDatabaseDirectory({
      databaseDirectory,
      repositoryRoot,
      databaseOverrideActive,
    });
    assertDatabaseFileSafe(databasePath);
    lock = acquireBootstrapLock(lockPath, instanceId);

    if (!existsSync(databasePath)) {
      createCurrentDatabase(stagingPath, dependencies);
      replaceNewDatabase(stagingPath, databasePath, dependencies);
      const verified = verifyDatabaseFile(databasePath);
      return {
        databaseState: "created",
        schemaVersion: verified.schemaVersion,
        recoveryBackupCreated: false,
        resolvedDatabasePath: databasePath,
        recoveryBackupPath: null,
      };
    }

    const classification = classifyExistingDatabase(databasePath);
    if (classification.state === "current") {
      return {
        databaseState: "current",
        schemaVersion: classification.schemaVersion,
        recoveryBackupCreated: false,
        resolvedDatabasePath: databasePath,
        recoveryBackupPath: null,
      };
    }
    if (classification.state !== "old") {
      throw new PublicDatabaseBootstrapError("database_schema_unsupported");
    }

    ensureApplicationDirectory({
      directory: backupDirectory,
      repositoryRoot,
      insideRepositoryCode: "backup_path_must_be_outside_repository",
      invalidCode: "backup_directory_invalid",
    });
    recoveryBackupPath = path.join(
      backupDirectory,
      `augnes-pre-migration-${safeTimestamp()}-${randomUUID().slice(0, 8)}.db`,
    );
    await runBackup({
      sourcePath: databasePath,
      targetPath: recoveryBackupPath,
      backupDatabase: dependencies.backupDatabase,
    });
    verifyDatabaseFile(recoveryBackupPath);

    await runBackup({ sourcePath: databasePath, targetPath: stagingPath });
    migrateStagingDatabase(stagingPath, dependencies);
    const stagedVerification = verifyPreparedDatabase(stagingPath, dependencies);
    if (stagedVerification.schemaSignature !== classification.targetSignature) {
      throw new PublicDatabaseBootstrapError("database_schema_unsupported");
    }
    dependencies.beforeReplacement?.({ databasePath, stagingPath });
    replaceMigratedDatabase({ databasePath, stagingPath, operationId });
    const liveVerification = verifyDatabaseFile(databasePath);

    return {
      databaseState: "migrated",
      schemaVersion: liveVerification.schemaVersion,
      recoveryBackupCreated: true,
      resolvedDatabasePath: databasePath,
      recoveryBackupPath,
    };
  } catch (error) {
    cleanupDatabaseFamily(stagingPath);
    const failure =
      error instanceof PublicDatabaseBootstrapError
        ? error
        : new PublicDatabaseBootstrapError(classifyBootstrapFailure(error), error);
    failure.recoveryBackupCreated = Boolean(
      recoveryBackupPath && existsSync(recoveryBackupPath),
    );
    throw failure;
  } finally {
    if (lock) releaseBootstrapLock(lockPath, lock);
  }
}

function classifyExistingDatabase(databasePath) {
  assertDatabaseFileSafe(databasePath);
  let source;
  let serialized;
  try {
    source = new Database(databasePath, { readonly: true, fileMustExist: true });
    verifyOpenDatabase(source);
    assertRecognizableDatabase(source);
    serialized = standaloneSerializedDatabase(source.serialize());
  } catch (error) {
    if (error instanceof PublicDatabaseBootstrapError) throw error;
    throw new PublicDatabaseBootstrapError("database_open_failed", error);
  } finally {
    source?.close();
  }

  let clone;
  try {
    clone = new Database(serialized);
    clone.pragma("foreign_keys = ON");
    const beforeSignature = schemaSignature(clone);
    const beforeChanges = totalChanges(clone);
    applyCanonicalDatabaseMigrations(clone);
    verifyOpenDatabase(clone);
    const afterSignature = schemaSignature(clone);
    const changed =
      beforeSignature !== afterSignature || totalChanges(clone) !== beforeChanges;
    return {
      state: changed ? "old" : "current",
      schemaVersion: changed ? "outdated" : "current",
      targetSignature: afterSignature,
    };
  } catch (error) {
    if (error instanceof PublicDatabaseBootstrapError) throw error;
    throw new PublicDatabaseBootstrapError("database_schema_unsupported", error);
  } finally {
    clone?.close();
  }
}

function createCurrentDatabase(stagingPath, dependencies) {
  let database;
  try {
    createRestrictedEmptyFile(stagingPath);
    database = new Database(stagingPath);
    setRestrictiveFileMode(stagingPath);
    database.pragma("journal_mode = DELETE");
    database.pragma("foreign_keys = ON");
    (dependencies.migrateDatabase ?? applyCanonicalDatabaseMigrations)(database);
  } catch (error) {
    if (error instanceof PublicDatabaseBootstrapError) throw error;
    throw new PublicDatabaseBootstrapError("database_migration_failed", error);
  } finally {
    database?.close();
  }
  verifyPreparedDatabase(stagingPath, dependencies);
}

function migrateStagingDatabase(stagingPath, dependencies) {
  let database;
  try {
    database = new Database(stagingPath, { fileMustExist: true });
    database.pragma("journal_mode = DELETE");
    database.pragma("foreign_keys = ON");
    (dependencies.migrateDatabase ?? applyCanonicalDatabaseMigrations)(database);
  } catch (error) {
    if (error instanceof PublicDatabaseBootstrapError) throw error;
    throw new PublicDatabaseBootstrapError("database_migration_failed", error);
  } finally {
    database?.close();
  }
}

function verifyPreparedDatabase(stagingPath, dependencies) {
  if (dependencies.verifyPreparedDatabase) {
    try {
      dependencies.verifyPreparedDatabase(stagingPath);
    } catch (error) {
      throw new PublicDatabaseBootstrapError("database_integrity_failed", error);
    }
  }
  return verifyDatabaseFile(stagingPath);
}

export function verifyDatabaseFile(databasePath) {
  let database;
  try {
    database = new Database(databasePath, { readonly: true, fileMustExist: true });
    verifyOpenDatabase(database);
    return {
      schemaVersion: "current",
      schemaSignature: schemaSignature(database),
    };
  } catch (error) {
    if (error instanceof PublicDatabaseBootstrapError) throw error;
    throw new PublicDatabaseBootstrapError("database_integrity_failed", error);
  } finally {
    database?.close();
  }
}

function verifyOpenDatabase(database) {
  const integrity = database.pragma("integrity_check", { simple: true });
  if (integrity !== "ok") {
    throw new PublicDatabaseBootstrapError("database_integrity_failed");
  }
  const foreignKeyFailures = database.pragma("foreign_key_check");
  if (!Array.isArray(foreignKeyFailures) || foreignKeyFailures.length > 0) {
    throw new PublicDatabaseBootstrapError("database_integrity_failed");
  }
}

function assertRecognizableDatabase(database) {
  const tables = database
    .prepare(
      `SELECT name FROM sqlite_schema
       WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
       ORDER BY name`,
    )
    .all()
    .map((row) => row.name);
  if (tables.length === 0) return;
  const recognized = new Set([
    "agents",
    "sessions",
    "messages",
    "state_entries",
    "state_delta_proposals",
    "state_transitions",
    "vnext_core_records",
  ]);
  if (!tables.some((table) => recognized.has(table))) {
    throw new PublicDatabaseBootstrapError("database_schema_unsupported");
  }
}

async function runBackup({ sourcePath, targetPath, backupDatabase }) {
  try {
    createRestrictedEmptyFile(targetPath);
    if (backupDatabase) {
      await backupDatabase({ sourcePath, targetPath });
    } else {
      let source;
      try {
        source = new Database(sourcePath, { readonly: true, fileMustExist: true });
        await source.backup(targetPath);
      } finally {
        source?.close();
      }
    }
    makeDatabaseStandalone(targetPath);
    setRestrictiveFileMode(targetPath);
  } catch (error) {
    cleanupDatabaseFamily(targetPath);
    throw new PublicDatabaseBootstrapError("database_backup_failed", error);
  }
}

function replaceNewDatabase(stagingPath, databasePath, dependencies) {
  try {
    dependencies.beforeReplacement?.({ databasePath, stagingPath });
    renameSync(stagingPath, databasePath);
    setRestrictiveFileMode(databasePath);
  } catch (error) {
    throw new PublicDatabaseBootstrapError("database_bootstrap_failed", error);
  }
}

function replaceMigratedDatabase({ databasePath, stagingPath, operationId }) {
  const rollbackPath = `${databasePath}.augnes-rollback-${operationId}`;
  let originalMoved = false;
  let stagingMoved = false;
  try {
    renameSync(databasePath, rollbackPath);
    originalMoved = true;
    for (const suffix of SQLITE_SIDE_SUFFIXES) {
      renameRegularFileIfPresent(`${databasePath}${suffix}`, `${rollbackPath}${suffix}`);
    }
    renameSync(stagingPath, databasePath);
    stagingMoved = true;
    setRestrictiveFileMode(databasePath);
    verifyDatabaseFile(databasePath);
  } catch (error) {
    if (stagingMoved) cleanupDatabaseFamily(databasePath);
    if (originalMoved) {
      try {
        renameSync(rollbackPath, databasePath);
        for (const suffix of SQLITE_SIDE_SUFFIXES) {
          renameRegularFileIfPresent(`${rollbackPath}${suffix}`, `${databasePath}${suffix}`);
        }
      } catch (rollbackError) {
        throw new PublicDatabaseBootstrapError("database_bootstrap_failed", rollbackError);
      }
    }
    throw new PublicDatabaseBootstrapError("database_bootstrap_failed", error);
  }
  try {
    cleanupDatabaseFamily(rollbackPath);
  } catch (error) {
    throw new PublicDatabaseBootstrapError("database_bootstrap_failed", error);
  }
}

function ensureDatabaseDirectory({
  databaseDirectory,
  repositoryRoot,
  databaseOverrideActive,
}) {
  try {
    if (databaseOverrideActive) {
      ensureExplicitDatabaseDirectory(databaseDirectory);
    } else {
      ensureApplicationDirectory({
        directory: databaseDirectory,
        repositoryRoot,
        insideRepositoryCode: "database_path_invalid",
        invalidCode: "database_path_invalid",
      });
    }
  } catch (error) {
    throw new PublicDatabaseBootstrapError("database_path_invalid", error);
  }
}

function ensureExplicitDatabaseDirectory(directory) {
  const existedBefore = existsSync(directory);
  const firstCreated = mkdirSync(directory, { recursive: true, mode: 0o700 });
  try {
    const stats = lstatSync(directory);
    if (!stats.isDirectory() || stats.isSymbolicLink()) {
      throw new PublicDatabaseBootstrapError("database_path_invalid");
    }
    if (!existedBefore) {
      try {
        chmodSync(directory, 0o700);
      } catch {
        // Windows does not implement POSIX mode semantics.
      }
    }
  } catch (error) {
    if (firstCreated) {
      try {
        rmdirSync(directory);
      } catch {
        // Only an empty final directory created by this invocation is removable.
      }
    }
    throw error;
  }
}

function assertDatabaseFileSafe(databasePath) {
  try {
    const stats = lstatSync(databasePath);
    if (!stats.isFile() || stats.isSymbolicLink()) {
      throw new PublicDatabaseBootstrapError("database_path_invalid");
    }
  } catch (error) {
    if (error instanceof PublicDatabaseBootstrapError) throw error;
    if (error?.code !== "ENOENT") {
      throw new PublicDatabaseBootstrapError("database_path_invalid", error);
    }
  }
}

function acquireBootstrapLock(lockPath, instanceId) {
  const record = {
    contract: DATABASE_BOOTSTRAP_CONTRACT,
    instance_id: instanceId,
    supervisor_pid: process.pid,
    nonce: randomBytes(24).toString("hex"),
  };
  let descriptor;
  let createdIdentity = null;
  try {
    descriptor = openSync(lockPath, "wx", 0o600);
    const stats = fstatSync(descriptor, { bigint: true });
    createdIdentity = { dev: stats.dev, ino: stats.ino };
    writeFileSync(descriptor, `${JSON.stringify(record)}\n`, "utf8");
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = null;
    setRestrictiveFileMode(lockPath);
    return record;
  } catch (error) {
    if (descriptor !== undefined && descriptor !== null) closeSync(descriptor);
    if (createdIdentity) removeCreatedLock(lockPath, createdIdentity);
    if (error?.code === "EEXIST") {
      throw new PublicDatabaseBootstrapError("database_bootstrap_owned");
    }
    throw new PublicDatabaseBootstrapError("database_bootstrap_failed", error);
  }
}

function removeCreatedLock(lockPath, createdIdentity) {
  try {
    const stats = lstatSync(lockPath, { bigint: true });
    if (
      stats.isFile() &&
      !stats.isSymbolicLink() &&
      stats.dev === createdIdentity.dev &&
      stats.ino === createdIdentity.ino
    ) {
      unlinkSync(lockPath);
    }
  } catch {
    // A changed or already removed file is left untouched.
  }
}

function releaseBootstrapLock(lockPath, owner) {
  try {
    const stats = lstatSync(lockPath);
    if (!stats.isFile() || stats.isSymbolicLink()) return;
    const current = JSON.parse(readFileSync(lockPath, "utf8"));
    if (
      current.contract === owner.contract &&
      current.instance_id === owner.instance_id &&
      current.nonce === owner.nonce
    ) {
      unlinkSync(lockPath);
    }
  } catch (error) {
    if (error?.code !== "ENOENT") {
      // A changed or unreadable lock is never removed based on PID alone.
    }
  }
}

function schemaSignature(database) {
  return createHash("sha256")
    .update(
      JSON.stringify(
        database
          .prepare(
            `SELECT type, name, tbl_name, sql
             FROM sqlite_schema
             WHERE name NOT LIKE 'sqlite_%'
             ORDER BY type, name, tbl_name`,
          )
          .all(),
      ),
    )
    .digest("hex");
}

function totalChanges(database) {
  return Number(database.prepare("SELECT total_changes() AS value").get().value);
}

function standaloneSerializedDatabase(serialized) {
  const databaseImage = Buffer.from(serialized);
  const sqliteHeader = Buffer.from("SQLite format 3\0", "ascii");
  if (
    databaseImage.length >= 20 &&
    databaseImage.subarray(0, sqliteHeader.length).equals(sqliteHeader)
  ) {
    // sqlite3_serialize includes committed WAL content, but preserves the WAL
    // read/write version bytes. An anonymous in-memory clone has no sidecar
    // filename, so normalize only those standard header bytes to rollback mode.
    databaseImage[18] = 1;
    databaseImage[19] = 1;
  }
  return databaseImage;
}

function renameRegularFileIfPresent(source, destination) {
  try {
    const stats = lstatSync(source);
    if (!stats.isFile() || stats.isSymbolicLink()) {
      throw new PublicDatabaseBootstrapError("database_path_invalid");
    }
    renameSync(source, destination);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

function cleanupDatabaseFamily(databasePath) {
  for (const candidate of [databasePath, ...SQLITE_SIDE_SUFFIXES.map((s) => `${databasePath}${s}`)]) {
    try {
      const stats = lstatSync(candidate);
      if (stats.isFile() && !stats.isSymbolicLink()) unlinkSync(candidate);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
}

function setRestrictiveFileMode(filePath) {
  try {
    chmodSync(filePath, 0o600);
  } catch {
    // Windows does not implement POSIX mode semantics.
  }
}

function makeDatabaseStandalone(databasePath) {
  let database;
  try {
    database = new Database(databasePath, { fileMustExist: true });
    database.pragma("journal_mode = DELETE");
  } finally {
    database?.close();
  }
  cleanupSqliteSideFiles(databasePath);
}

function cleanupSqliteSideFiles(databasePath) {
  for (const suffix of SQLITE_SIDE_SUFFIXES) {
    const candidate = `${databasePath}${suffix}`;
    try {
      const stats = lstatSync(candidate);
      if (stats.isFile() && !stats.isSymbolicLink()) unlinkSync(candidate);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
}

function createRestrictedEmptyFile(filePath) {
  const descriptor = openSync(filePath, "wx", 0o600);
  try {
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
  setRestrictiveFileMode(filePath);
}

function safeTimestamp() {
  return new Date().toISOString().replaceAll(":", "").replaceAll(".", "-");
}

function classifyBootstrapFailure(error) {
  if (error?.code === "SQLITE_CANTOPEN" || error?.code === "SQLITE_NOTADB") {
    return "database_open_failed";
  }
  return "database_bootstrap_failed";
}
