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
let canonicalSchemaContractCache = null;

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
  let retainBootstrapLock = false;

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
    replaceMigratedDatabase({
      databasePath,
      stagingPath,
      operationId,
      dependencies,
    });
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
    retainBootstrapLock = failure.retainBootstrapLock === true;
    failure.recoveryBackupCreated = Boolean(
      recoveryBackupPath && existsSync(recoveryBackupPath),
    );
    throw failure;
  } finally {
    if (lock && !retainBootstrapLock) releaseBootstrapLock(lockPath, lock);
  }
}

function classifyExistingDatabase(databasePath) {
  assertDatabaseFileSafe(databasePath);
  let source;
  let serialized;
  try {
    source = new Database(databasePath, { readonly: true, fileMustExist: true });
    verifyOpenDatabase(source);
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
    const sourceSignature = structuralSchemaContractSignature(clone);
    applyCanonicalDatabaseMigrations(clone);
    verifyOpenDatabase(clone);
    const migratedSignature = structuralSchemaContractSignature(clone);
    const canonicalSignature = canonicalStructuralSchemaContractSignature();
    if (migratedSignature !== canonicalSignature) {
      throw new PublicDatabaseBootstrapError("database_schema_unsupported");
    }
    const current = sourceSignature === canonicalSignature;
    return {
      state: current ? "current" : "old",
      schemaVersion: current ? "current" : "outdated",
      targetSignature: canonicalSignature,
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
      schemaSignature: structuralSchemaContractSignature(database),
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

function replaceMigratedDatabase({
  databasePath,
  stagingPath,
  operationId,
  dependencies,
}) {
  const rollbackPath = `${databasePath}.augnes-rollback-${operationId}`;
  let originalMoved = false;
  let stagingMoved = false;
  try {
    renameSync(databasePath, rollbackPath);
    originalMoved = true;
    for (const suffix of SQLITE_SIDE_SUFFIXES) {
      renameRegularFileIfPresent(`${databasePath}${suffix}`, `${rollbackPath}${suffix}`);
    }
    dependencies.afterOriginalMoved?.({ databasePath, stagingPath, rollbackPath });
    renameSync(stagingPath, databasePath);
    stagingMoved = true;
    setRestrictiveFileMode(databasePath);
    dependencies.afterStagingPublished?.({ databasePath, stagingPath, rollbackPath });
    if (dependencies.verifyPublishedDatabase) {
      dependencies.verifyPublishedDatabase(databasePath);
    } else {
      verifyDatabaseFile(databasePath);
    }
  } catch (error) {
    let recoveryError = null;
    if (stagingMoved) {
      try {
        cleanupDatabaseFamily(databasePath);
      } catch (cleanupError) {
        recoveryError = cleanupError;
      }
    }
    if (originalMoved) {
      try {
        dependencies.beforeOriginalRestore?.({
          databasePath,
          stagingPath,
          rollbackPath,
        });
        renameSync(rollbackPath, databasePath);
        for (const suffix of SQLITE_SIDE_SUFFIXES) {
          renameRegularFileIfPresent(`${rollbackPath}${suffix}`, `${databasePath}${suffix}`);
        }
      } catch (rollbackError) {
        const failure = new PublicDatabaseBootstrapError(
          "database_rollback_failed",
          rollbackError,
        );
        failure.retainBootstrapLock = true;
        throw failure;
      }
    }
    if (recoveryError) {
      throw new PublicDatabaseBootstrapError("database_bootstrap_failed", recoveryError);
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

export function structuralSchemaContractSignature(database) {
  return createHash("sha256")
    .update(JSON.stringify(buildStructuralSchemaContract(database)))
    .digest("hex");
}

export function canonicalStructuralSchemaContractSignature() {
  return canonicalSchemaContract().signature;
}

export function buildStructuralSchemaContract(database) {
  const objects = database
    .prepare(
      `SELECT type, name, tbl_name, sql
       FROM sqlite_schema
       WHERE name NOT LIKE 'sqlite_%'
       ORDER BY type, name, tbl_name`,
    )
    .all();
  const tableLikeNames = objects
    .filter((object) => object.type === "table" || object.type === "view")
    .map((object) => object.name)
    .sort(compareStrings);
  const indexMetadata = new Map();
  for (const tableName of tableLikeNames) {
    for (const index of database
      .prepare(
        `SELECT seq, name, "unique" AS is_unique, origin, partial
         FROM pragma_index_list(?)
         ORDER BY name`,
      )
      .all(tableName)) {
      indexMetadata.set(index.name, {
        unique: Number(index.is_unique),
        origin: normalizeIdentifier(index.origin),
        partial: Number(index.partial),
      });
    }
  }

  return {
    objects: objects.map((object) => ({
      type: normalizeIdentifier(object.type),
      name: object.name,
      table: object.tbl_name,
      definition: normalizeSqlDefinition(object.sql),
      columns:
        object.type === "table" || object.type === "view"
          ? database
              .prepare(
                `SELECT cid, name, type, "notnull" AS is_not_null,
                        dflt_value, pk, hidden
                 FROM pragma_table_xinfo(?)
                 ORDER BY cid`,
              )
              .all(object.name)
              .map((column) => ({
                position: Number(column.cid),
                name: column.name,
                declared_type: normalizeDeclaredType(column.type),
                not_null: Number(column.is_not_null),
                default_expression: normalizeSqlDefinition(column.dflt_value),
                primary_key_position: Number(column.pk),
                hidden: Number(column.hidden),
              }))
          : null,
      foreign_keys:
        object.type === "table"
          ? database
              .prepare(
                `SELECT id, seq, "table" AS target_table, "from" AS source_column,
                        "to" AS target_column, on_update, on_delete, match
                 FROM pragma_foreign_key_list(?)
                 ORDER BY id, seq`,
              )
              .all(object.name)
              .map((foreignKey) => ({
                id: Number(foreignKey.id),
                sequence: Number(foreignKey.seq),
                target_table: foreignKey.target_table,
                source_column: foreignKey.source_column,
                target_column: foreignKey.target_column,
                on_update: normalizeIdentifier(foreignKey.on_update),
                on_delete: normalizeIdentifier(foreignKey.on_delete),
                match: normalizeIdentifier(foreignKey.match),
              }))
          : null,
      index:
        object.type === "index"
          ? {
              ...(indexMetadata.get(object.name) ?? {
                unique: null,
                origin: null,
                partial: null,
              }),
              columns: database
                .prepare(
                  `SELECT seqno, cid, name, "desc" AS is_descending,
                          coll, key
                   FROM pragma_index_xinfo(?)
                   ORDER BY seqno`,
                )
                .all(object.name)
                .map((column) => ({
                  sequence: Number(column.seqno),
                  column_id: Number(column.cid),
                  name: column.name,
                  descending: Number(column.is_descending),
                  collation: normalizeIdentifier(column.coll),
                  key: Number(column.key),
                })),
            }
          : null,
    })),
  };
}

function canonicalSchemaContract() {
  if (canonicalSchemaContractCache) return canonicalSchemaContractCache;
  const database = new Database(":memory:");
  try {
    database.pragma("foreign_keys = ON");
    applyCanonicalDatabaseMigrations(database);
    verifyOpenDatabase(database);
    const contract = buildStructuralSchemaContract(database);
    canonicalSchemaContractCache = {
      contract,
      signature: createHash("sha256")
        .update(JSON.stringify(contract))
        .digest("hex"),
    };
    return canonicalSchemaContractCache;
  } finally {
    database.close();
  }
}

function normalizeDeclaredType(value) {
  if (value === null || value === undefined) return null;
  return String(value).trim().replace(/\s+/g, " ").toUpperCase();
}

function normalizeIdentifier(value) {
  if (value === null || value === undefined) return null;
  return String(value).toLowerCase();
}

function normalizeSqlDefinition(value) {
  if (value === null || value === undefined) return null;
  const input = String(value);
  const tokens = [];
  let index = 0;
  while (index < input.length) {
    const character = input[index];
    if (/\s/.test(character)) {
      index += 1;
      continue;
    }
    if (character === "-" && input[index + 1] === "-") {
      index += 2;
      while (index < input.length && input[index] !== "\n") index += 1;
      continue;
    }
    if (character === "/" && input[index + 1] === "*") {
      index += 2;
      while (index < input.length && !(input[index] === "*" && input[index + 1] === "/")) {
        index += 1;
      }
      index += 2;
      continue;
    }
    if (character === "'" || character === '"' || character === "`" || character === "[") {
      const closing = character === "[" ? "]" : character;
      let token = character;
      index += 1;
      while (index < input.length) {
        token += input[index];
        if (input[index] === closing) {
          if (closing !== "]" && input[index + 1] === closing) {
            token += input[index + 1];
            index += 2;
            continue;
          }
          index += 1;
          break;
        }
        index += 1;
      }
      tokens.push(token);
      continue;
    }
    if (/[A-Za-z_]/.test(character)) {
      let end = index + 1;
      while (end < input.length && /[A-Za-z0-9_$]/.test(input[end])) end += 1;
      tokens.push(input.slice(index, end).toLowerCase());
      index = end;
      continue;
    }
    if (/[0-9]/.test(character)) {
      let end = index;
      if (input.slice(index, index + 2).toLowerCase() === "0x") {
        end += 2;
        while (end < input.length && /[0-9A-Fa-f]/.test(input[end])) end += 1;
      } else {
        while (end < input.length && /[0-9]/.test(input[end])) end += 1;
        if (input[end] === ".") {
          end += 1;
          while (end < input.length && /[0-9]/.test(input[end])) end += 1;
        }
        if (input[end]?.toLowerCase() === "e") {
          end += 1;
          if (input[end] === "+" || input[end] === "-") end += 1;
          while (end < input.length && /[0-9]/.test(input[end])) end += 1;
        }
      }
      tokens.push(input.slice(index, end).toLowerCase());
      index = end;
      continue;
    }
    const twoCharacterOperator = input.slice(index, index + 2);
    if (["<=", ">=", "!=", "<>", "==", "||", "->", "->>"].includes(twoCharacterOperator)) {
      tokens.push(twoCharacterOperator);
      index += 2;
      continue;
    }
    tokens.push(character);
    index += 1;
  }
  return tokens;
}

function compareStrings(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
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
