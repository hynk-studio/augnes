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
  readSync,
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
export const DATABASE_BOOTSTRAP_JOURNAL_SCHEMA_VERSION = 2;
const SQLITE_SIDE_SUFFIXES = ["-wal", "-shm", "-journal"];
const DATABASE_JOURNAL_PHASES = new Set([
  "acquired",
  "backup_ready",
  "staging_ready",
  "moving_original",
  "original_moved",
  "publishing_staging",
  "staging_published",
  "published_verified",
  "cleanup_complete",
  "original_restored",
  "restoring_original",
  "restore_failed",
]);
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

export function inspectDatabaseReconciliation({
  databasePath,
  backupDirectory,
  repositoryFingerprint,
} = {}) {
  validateReconciliationInputs({
    databasePath,
    backupDirectory,
    repositoryFingerprint,
  });
  const lockPath = bootstrapJournalPath(databasePath);
  const result = readBootstrapJournalResult(lockPath);
  if (result.state === "missing") return publicDatabaseReconciliation("clean");
  if (result.state !== "valid") {
    return publicDatabaseReconciliation("recovery_required", {
      reason: "database_legacy_recovery_record",
    });
  }
  const validation = validateBootstrapJournal({
    journal: result.value,
    databasePath,
    backupDirectory,
    repositoryFingerprint,
  });
  if (!validation.valid) {
    return publicDatabaseReconciliation("recovery_required", {
      reason: validation.reason,
    });
  }
  if (isProcessAlive(result.value.supervisor_pid)) {
    return publicDatabaseReconciliation("reconciliation_in_progress", {
      reason: "database_reconciliation_required",
      phase: result.value.phase,
    });
  }
  return publicDatabaseReconciliation("recoverable", {
    phase: result.value.phase,
    automatic_reconciliation: true,
    recovery_backup_present: regularFileExists(validation.recoveryBackupPath),
    rollback_material_present: databaseFamilyExists(validation.rollbackPath),
  });
}

export function reconcileInterruptedDatabaseBootstrap({
  databasePath,
  backupDirectory,
  repositoryFingerprint,
  reconciliationLeaseOwned = false,
} = {}) {
  validateReconciliationInputs({
    databasePath,
    backupDirectory,
    repositoryFingerprint,
  });
  if (!reconciliationLeaseOwned) {
    throw new PublicDatabaseBootstrapError("database_reconciliation_required");
  }
  const lockPath = bootstrapJournalPath(databasePath);
  const result = readBootstrapJournalResult(lockPath);
  if (result.state === "missing") {
    return {
      databaseStateReconciled: false,
      recoveryBackupPreserved: false,
      result: "clean",
    };
  }
  if (result.state !== "valid") {
    throw new PublicDatabaseBootstrapError("database_legacy_recovery_record");
  }
  const journal = result.value;
  const validation = validateBootstrapJournal({
    journal,
    databasePath,
    backupDirectory,
    repositoryFingerprint,
  });
  if (!validation.valid) {
    throw new PublicDatabaseBootstrapError(validation.reason);
  }
  if (isProcessAlive(journal.supervisor_pid)) {
    throw new PublicDatabaseBootstrapError("database_reconciliation_required");
  }

  try {
    cleanupExactRegularFile(validation.journalTemporaryPath);
    const outcome = recoverDatabaseJournalPhase({
      journal,
      databasePath,
      stagingPath: validation.stagingPath,
      rollbackPath: validation.rollbackPath,
      recoveryBackupPath: validation.recoveryBackupPath,
    });
    releaseBootstrapLock(lockPath, journal);
    return {
      databaseStateReconciled: true,
      recoveryBackupPreserved: regularFileExists(
        validation.recoveryBackupPath,
      ),
      ...outcome,
    };
  } catch (error) {
    if (error instanceof PublicDatabaseBootstrapError) throw error;
    throw new PublicDatabaseBootstrapError(
      "database_reconciliation_failed",
      error,
    );
  }
}

export function bootstrapJournalPath(databasePath) {
  return `${databasePath}.augnes-bootstrap.lock`;
}

export async function prepareRuntimeDatabase({
  databasePath,
  backupDirectory,
  repositoryRoot,
  instanceId,
  repositoryFingerprint = null,
  runtimeOwnershipGeneration = null,
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
  const rollbackPath = `${databasePath}.augnes-rollback-${operationId}`;
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
    lock = acquireBootstrapLock({
      lockPath,
      databasePath,
      repositoryFingerprint:
        repositoryFingerprint ??
        createHash("sha256").update(repositoryRoot).digest("hex"),
      runtimeInstanceId: instanceId,
      runtimeOwnershipGeneration,
      operationId,
      stagingPath,
      rollbackPath,
      sourceWasMissing: !existsSync(databasePath),
    });
    notifyJournalPhase(dependencies, lock);

    if (!existsSync(databasePath)) {
      createCurrentDatabase(stagingPath, dependencies);
      updateBootstrapJournal(lockPath, lock, {
        phase: "staging_ready",
        source_was_missing: true,
        staged_family: readDatabaseFamilyIdentity(stagingPath),
      });
      notifyJournalPhase(dependencies, lock);
      replaceNewDatabase({
        stagingPath,
        databasePath,
        lockPath,
        lock,
        dependencies,
      });
      const verified = verifyDatabaseFile(databasePath);
      updateBootstrapJournal(lockPath, lock, {
        phase: "published_verified",
        published_family: readDatabaseFamilyIdentity(databasePath),
      });
      notifyJournalPhase(dependencies, lock);
      updateBootstrapJournal(lockPath, lock, { phase: "cleanup_complete" });
      notifyJournalPhase(dependencies, lock);
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
    updateBootstrapJournal(lockPath, lock, {
      recovery_backup_basename: path.basename(recoveryBackupPath),
    });
    await runBackup({
      sourcePath: databasePath,
      targetPath: recoveryBackupPath,
      backupDatabase: dependencies.backupDatabase,
    });
    verifyDatabaseFile(recoveryBackupPath);
    updateBootstrapJournal(lockPath, lock, {
      phase: "backup_ready",
      recovery_backup_basename: path.basename(recoveryBackupPath),
    });
    notifyJournalPhase(dependencies, lock);

    await runBackup({ sourcePath: databasePath, targetPath: stagingPath });
    migrateStagingDatabase(stagingPath, dependencies);
    const stagedVerification = verifyPreparedDatabase(stagingPath, dependencies);
    if (stagedVerification.schemaSignature !== classification.targetSignature) {
      throw new PublicDatabaseBootstrapError("database_schema_unsupported");
    }
    updateBootstrapJournal(lockPath, lock, {
      phase: "staging_ready",
      source_was_missing: false,
      original_family: readDatabaseFamilyIdentity(databasePath),
      staged_family: readDatabaseFamilyIdentity(stagingPath),
    });
    notifyJournalPhase(dependencies, lock);
    dependencies.beforeReplacement?.({ databasePath, stagingPath });
    replaceMigratedDatabase({
      databasePath,
      stagingPath,
      rollbackPath,
      lockPath,
      lock,
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

function replaceNewDatabase({
  stagingPath,
  databasePath,
  lockPath,
  lock,
  dependencies,
}) {
  try {
    dependencies.beforeReplacement?.({ databasePath, stagingPath });
    updateBootstrapJournal(lockPath, lock, { phase: "publishing_staging" });
    notifyJournalPhase(dependencies, lock);
    renameSync(stagingPath, databasePath);
    setRestrictiveFileMode(databasePath);
    updateBootstrapJournal(lockPath, lock, {
      phase: "staging_published",
      published_family: readDatabaseFamilyIdentity(databasePath),
    });
    notifyJournalPhase(dependencies, lock);
    dependencies.afterStagingPublished?.({ databasePath, stagingPath });
  } catch (error) {
    throw new PublicDatabaseBootstrapError("database_bootstrap_failed", error);
  }
}

function replaceMigratedDatabase({
  databasePath,
  stagingPath,
  rollbackPath,
  lockPath,
  lock,
  dependencies,
}) {
  let originalMoved = false;
  let stagingMoved = false;
  try {
    updateBootstrapJournal(lockPath, lock, { phase: "moving_original" });
    notifyJournalPhase(dependencies, lock);
    renameSync(databasePath, rollbackPath);
    originalMoved = true;
    for (const suffix of SQLITE_SIDE_SUFFIXES) {
      renameRegularFileIfPresent(`${databasePath}${suffix}`, `${rollbackPath}${suffix}`);
    }
    updateBootstrapJournal(lockPath, lock, {
      phase: "original_moved",
      rollback_family: readDatabaseFamilyIdentity(rollbackPath),
    });
    notifyJournalPhase(dependencies, lock);
    dependencies.afterOriginalMoved?.({ databasePath, stagingPath, rollbackPath });
    updateBootstrapJournal(lockPath, lock, { phase: "publishing_staging" });
    notifyJournalPhase(dependencies, lock);
    renameSync(stagingPath, databasePath);
    stagingMoved = true;
    setRestrictiveFileMode(databasePath);
    updateBootstrapJournal(lockPath, lock, {
      phase: "staging_published",
      published_family: readDatabaseFamilyIdentity(databasePath),
    });
    notifyJournalPhase(dependencies, lock);
    dependencies.afterStagingPublished?.({ databasePath, stagingPath, rollbackPath });
    if (dependencies.verifyPublishedDatabase) {
      dependencies.verifyPublishedDatabase(databasePath);
    } else {
      verifyDatabaseFile(databasePath);
    }
    updateBootstrapJournal(lockPath, lock, {
      phase: "published_verified",
      published_family: readDatabaseFamilyIdentity(databasePath),
    });
    notifyJournalPhase(dependencies, lock);
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
        updateBootstrapJournal(lockPath, lock, { phase: "restoring_original" });
        notifyJournalPhase(dependencies, lock);
        dependencies.beforeOriginalRestore?.({
          databasePath,
          stagingPath,
          rollbackPath,
        });
        renameSync(rollbackPath, databasePath);
        for (const suffix of SQLITE_SIDE_SUFFIXES) {
          renameRegularFileIfPresent(`${rollbackPath}${suffix}`, `${databasePath}${suffix}`);
        }
        updateBootstrapJournal(lockPath, lock, {
          phase: "original_restored",
          restored_family: readDatabaseFamilyIdentity(databasePath),
        });
        notifyJournalPhase(dependencies, lock);
      } catch (rollbackError) {
        try {
          updateBootstrapJournal(lockPath, lock, { phase: "restore_failed" });
          notifyJournalPhase(dependencies, lock);
        } catch {
          // The existing exact journal is retained when even its phase update fails.
        }
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
    updateBootstrapJournal(lockPath, lock, { phase: "cleanup_complete" });
    notifyJournalPhase(dependencies, lock);
  } catch (error) {
    const failure = new PublicDatabaseBootstrapError(
      "database_reconciliation_required",
      error,
    );
    failure.retainBootstrapLock = true;
    throw failure;
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

function acquireBootstrapLock({
  lockPath,
  databasePath,
  repositoryFingerprint,
  runtimeInstanceId,
  runtimeOwnershipGeneration,
  operationId,
  stagingPath,
  rollbackPath,
  sourceWasMissing,
}) {
  const now = new Date().toISOString();
  const record = {
    schema_version: DATABASE_BOOTSTRAP_JOURNAL_SCHEMA_VERSION,
    contract: DATABASE_BOOTSTRAP_CONTRACT,
    repository_fingerprint: repositoryFingerprint,
    runtime_instance_id: runtimeInstanceId,
    runtime_ownership_generation:
      runtimeOwnershipGeneration ?? `bootstrap-${operationId}`,
    supervisor_pid: process.pid,
    operation_id: operationId,
    ownership_nonce: randomBytes(24).toString("hex"),
    database_identity_hash: databaseIdentityHash(databasePath),
    phase: "acquired",
    stage_basename: path.basename(stagingPath),
    rollback_basename: path.basename(rollbackPath),
    journal_temp_basename: `${path.basename(lockPath)}.write-${operationId}`,
    recovery_backup_basename: null,
    source_was_missing: sourceWasMissing,
    original_family: null,
    staged_family: null,
    rollback_family: null,
    published_family: null,
    restored_family: null,
    created_at: now,
    last_transition_at: now,
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
    fsyncDirectoryBestEffort(path.dirname(lockPath));
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
      current.schema_version === owner.schema_version &&
      current.operation_id === owner.operation_id &&
      current.ownership_nonce === owner.ownership_nonce
    ) {
      unlinkSync(lockPath);
    }
  } catch (error) {
    if (error?.code !== "ENOENT") {
      // A changed or unreadable lock is never removed based on PID alone.
    }
  }
}

function updateBootstrapJournal(lockPath, owner, updates) {
  const current = readBootstrapJournalFile(lockPath);
  if (
    !current ||
    current.contract !== owner.contract ||
    current.schema_version !== owner.schema_version ||
    current.operation_id !== owner.operation_id ||
    current.ownership_nonce !== owner.ownership_nonce
  ) {
    throw new PublicDatabaseBootstrapError("database_reconciliation_required");
  }
  const next = {
    ...current,
    ...updates,
    last_transition_at: new Date().toISOString(),
  };
  if (!DATABASE_JOURNAL_PHASES.has(next.phase)) {
    throw new PublicDatabaseBootstrapError("database_reconciliation_required");
  }
  atomicWriteRestrictedJson(
    lockPath,
    next,
    path.join(path.dirname(lockPath), next.journal_temp_basename),
  );
  Object.assign(owner, next);
}

function notifyJournalPhase(dependencies, journal) {
  dependencies.afterJournalPhase?.({
    phase: journal.phase,
    operationId: journal.operation_id,
    stageBasename: journal.stage_basename,
    rollbackBasename: journal.rollback_basename,
    recoveryBackupBasename: journal.recovery_backup_basename,
  });
}

function readBootstrapJournalFile(lockPath) {
  try {
    const stats = lstatSync(lockPath);
    if (!stats.isFile() || stats.isSymbolicLink()) return null;
    const value = JSON.parse(readFileSync(lockPath, "utf8"));
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : null;
  } catch {
    return null;
  }
}

function atomicWriteRestrictedJson(filePath, value, temporaryPath) {
  let descriptor = null;
  try {
    descriptor = openSync(temporaryPath, "wx", 0o600);
    writeFileSync(descriptor, `${JSON.stringify(value)}\n`, "utf8");
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = null;
    renameSync(temporaryPath, filePath);
    setRestrictiveFileMode(filePath);
    fsyncDirectoryBestEffort(path.dirname(filePath));
  } finally {
    if (descriptor !== null) closeSync(descriptor);
    try {
      unlinkSync(temporaryPath);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
}

function fsyncDirectoryBestEffort(directory) {
  let descriptor = null;
  try {
    descriptor = openSync(directory, "r");
    fsyncSync(descriptor);
  } catch {
    // Directory fsync is unavailable on some supported platforms.
  } finally {
    if (descriptor !== null) closeSync(descriptor);
  }
}

function validateReconciliationInputs({
  databasePath,
  backupDirectory,
  repositoryFingerprint,
}) {
  if (
    !databasePath ||
    !backupDirectory ||
    !repositoryFingerprint ||
    !path.isAbsolute(databasePath) ||
    !path.isAbsolute(backupDirectory)
  ) {
    throw new PublicDatabaseBootstrapError("database_path_invalid");
  }
}

function readBootstrapJournalResult(lockPath) {
  try {
    const stats = lstatSync(lockPath);
    if (!stats.isFile() || stats.isSymbolicLink()) return { state: "invalid" };
    const value = JSON.parse(readFileSync(lockPath, "utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { state: "invalid" };
    }
    return { state: "valid", value };
  } catch (error) {
    if (error?.code === "ENOENT") return { state: "missing" };
    return { state: "invalid" };
  }
}

function validateBootstrapJournal({
  journal,
  databasePath,
  backupDirectory,
  repositoryFingerprint,
}) {
  const unsupported = (reason = "database_reconciliation_required") => ({
    valid: false,
    reason,
  });
  if (
    journal.schema_version !== DATABASE_BOOTSTRAP_JOURNAL_SCHEMA_VERSION ||
    journal.contract !== DATABASE_BOOTSTRAP_CONTRACT
  ) {
    return unsupported("database_legacy_recovery_record");
  }
  if (
    journal.repository_fingerprint !== repositoryFingerprint ||
    journal.database_identity_hash !== databaseIdentityHash(databasePath) ||
    !DATABASE_JOURNAL_PHASES.has(journal.phase) ||
    typeof journal.runtime_instance_id !== "string" ||
    journal.runtime_instance_id.length === 0 ||
    typeof journal.runtime_ownership_generation !== "string" ||
    journal.runtime_ownership_generation.length === 0 ||
    !Number.isInteger(journal.supervisor_pid) ||
    journal.supervisor_pid <= 0 ||
    typeof journal.ownership_nonce !== "string" ||
    journal.ownership_nonce.length < 32 ||
    !validOperationId(journal.operation_id)
  ) {
    return unsupported();
  }

  const databaseBasename = path.basename(databasePath);
  const expectedStage = `${databaseBasename}.augnes-stage-${journal.operation_id}`;
  const expectedRollback = `${databaseBasename}.augnes-rollback-${journal.operation_id}`;
  const lockBasename = path.basename(bootstrapJournalPath(databasePath));
  const expectedJournalTemporary = `${lockBasename}.write-${journal.operation_id}`;
  if (
    journal.stage_basename !== expectedStage ||
    journal.rollback_basename !== expectedRollback ||
    journal.journal_temp_basename !== expectedJournalTemporary ||
    !validFamilyIdentityOrNull(journal.original_family) ||
    !validFamilyIdentityOrNull(journal.staged_family) ||
    !validFamilyIdentityOrNull(journal.rollback_family) ||
    !validFamilyIdentityOrNull(journal.published_family) ||
    !validFamilyIdentityOrNull(journal.restored_family)
  ) {
    return unsupported();
  }
  if (!validJournalPhaseShape(journal)) return unsupported();

  let recoveryBackupPath = null;
  if (journal.recovery_backup_basename !== null) {
    if (
      typeof journal.recovery_backup_basename !== "string" ||
      path.basename(journal.recovery_backup_basename) !==
        journal.recovery_backup_basename ||
      !/^augnes-pre-migration-[A-Za-z0-9-]+\.db$/.test(
        journal.recovery_backup_basename,
      )
    ) {
      return unsupported();
    }
    recoveryBackupPath = path.join(
      backupDirectory,
      journal.recovery_backup_basename,
    );
  }

  return {
    valid: true,
    stagingPath: path.join(path.dirname(databasePath), journal.stage_basename),
    rollbackPath: path.join(
      path.dirname(databasePath),
      journal.rollback_basename,
    ),
    journalTemporaryPath: path.join(
      path.dirname(databasePath),
      journal.journal_temp_basename,
    ),
    recoveryBackupPath,
  };
}

function recoverDatabaseJournalPhase({
  journal,
  databasePath,
  stagingPath,
  rollbackPath,
  recoveryBackupPath,
}) {
  if (recoveryBackupPath && regularFileExists(recoveryBackupPath)) {
    try {
      verifyDatabaseFile(recoveryBackupPath);
    } catch (error) {
      if (journal.phase !== "acquired") throw error;
      removeExactOperationFamily(recoveryBackupPath, null);
    }
  }

  switch (journal.phase) {
    case "acquired":
    case "backup_ready":
      if (journal.source_was_missing === true) {
        assertDatabaseFamilyAbsent(databasePath);
      } else {
        assertLiveSourceRecognizableWhenPresent(databasePath);
      }
      removeExactOperationFamily(stagingPath, journal.staged_family);
      assertDatabaseFamilyAbsent(rollbackPath);
      return { result: "database_rollback_restored" };
    case "staging_ready":
      if (journal.source_was_missing === true) {
        assertDatabaseFamilyAbsent(databasePath);
      } else {
        assertDatabaseFamilyMatches(databasePath, journal.original_family);
      }
      removeExactOperationFamily(stagingPath, journal.staged_family);
      assertDatabaseFamilyAbsent(rollbackPath);
      return { result: "database_rollback_restored" };
    case "moving_original":
      restoreOriginalFamily({
        databasePath,
        rollbackPath,
        expectedOriginal: journal.original_family,
        expectedPublished: null,
      });
      removeExactOperationFamily(stagingPath, journal.staged_family);
      return { result: "database_rollback_restored" };
    case "original_moved":
      assertDatabaseFamilyAbsent(databasePath);
      restoreOriginalFamily({
        databasePath,
        rollbackPath,
        expectedOriginal: journal.original_family,
        expectedPublished: journal.published_family,
      });
      removeExactOperationFamily(stagingPath, journal.staged_family);
      return { result: "database_rollback_restored" };
    case "publishing_staging":
      if (journal.source_was_missing === true) {
        if (databaseFamilyExists(databasePath)) {
          assertDatabaseFamilyMatches(databasePath, journal.staged_family);
          assertCanonicalCurrentDatabase(databasePath);
          removeExactOperationFamily(stagingPath, journal.staged_family);
          return { result: "database_verified_publish_committed" };
        }
        removeExactOperationFamily(stagingPath, journal.staged_family);
        return { result: "database_rollback_restored" };
      }
      restoreOriginalFamily({
        databasePath,
        rollbackPath,
        expectedOriginal: journal.original_family,
        expectedPublished: journal.staged_family,
      });
      removeExactOperationFamily(stagingPath, journal.staged_family);
      return { result: "database_rollback_restored" };
    case "staging_published":
      if (journal.source_was_missing === true) {
        assertDatabaseFamilyMatches(databasePath, journal.published_family);
        assertCanonicalCurrentDatabase(databasePath);
        assertDatabaseFamilyAbsent(rollbackPath);
        removeExactOperationFamily(stagingPath, journal.staged_family);
        return { result: "database_verified_publish_committed" };
      }
      restoreOriginalFamily({
        databasePath,
        rollbackPath,
        expectedOriginal: journal.original_family,
        expectedPublished: journal.published_family,
      });
      removeExactOperationFamily(stagingPath, journal.staged_family);
      return { result: "database_rollback_restored" };
    case "restoring_original":
    case "restore_failed":
      restoreOriginalFamily({
        databasePath,
        rollbackPath,
        expectedOriginal: journal.original_family,
        expectedPublished: journal.published_family,
      });
      removeExactOperationFamily(stagingPath, journal.staged_family);
      return { result: "database_rollback_restored" };
    case "original_restored":
      assertDatabaseFamilyMatches(databasePath, journal.original_family);
      removeExactOperationFamily(stagingPath, journal.staged_family);
      cleanupRecordedRollbackFamily(rollbackPath, journal.original_family);
      return { result: "database_rollback_restored" };
    case "published_verified":
    case "cleanup_complete":
      assertDatabaseFamilyMatches(databasePath, journal.published_family);
      assertCanonicalCurrentDatabase(databasePath);
      removeExactOperationFamily(stagingPath, journal.staged_family);
      cleanupRecordedRollbackFamily(rollbackPath, journal.original_family);
      return { result: "database_verified_publish_committed" };
    default:
      throw new PublicDatabaseBootstrapError("database_reconciliation_required");
  }
}

function restoreOriginalFamily({
  databasePath,
  rollbackPath,
  expectedOriginal,
  expectedPublished,
}) {
  if (!validFamilyIdentity(expectedOriginal)) {
    throw new PublicDatabaseBootstrapError("database_reconciliation_required");
  }
  if (
    databaseFamilyExists(databasePath) &&
    expectedPublished &&
    databaseFamilyIsRecordedSubset(databasePath, expectedPublished)
  ) {
    removeExactOperationFamily(databasePath, expectedPublished);
  }

  for (const expected of expectedOriginal) {
    const livePath = `${databasePath}${expected.suffix}`;
    const rollbackMember = `${rollbackPath}${expected.suffix}`;
    const liveMatches = regularFileMatches(livePath, expected);
    const rollbackMatches = regularFileMatches(rollbackMember, expected);
    if (liveMatches && !rollbackMatches) continue;
    if (!liveMatches && rollbackMatches && !existsSync(livePath)) {
      renameSync(rollbackMember, livePath);
      continue;
    }
    throw new PublicDatabaseBootstrapError("database_reconciliation_failed");
  }
  assertDatabaseFamilyMatches(databasePath, expectedOriginal);
  verifyDatabaseFile(databasePath);
  assertDatabaseFamilyAbsent(rollbackPath);
}

function cleanupRecordedRollbackFamily(rollbackPath, expectedOriginal) {
  if (!databaseFamilyExists(rollbackPath)) return;
  removeExactOperationFamily(rollbackPath, expectedOriginal);
}

function removeExactOperationFamily(databasePath, expectedFamily) {
  if (!databaseFamilyExists(databasePath)) return;
  for (const suffix of ["", ...SQLITE_SIDE_SUFFIXES]) {
    const candidate = `${databasePath}${suffix}`;
    if (!existsSync(candidate)) continue;
    if (expectedFamily) {
      const expected = expectedFamily.find((entry) => entry.suffix === suffix);
      if (!expected || !regularFileMatches(candidate, expected)) {
        throw new PublicDatabaseBootstrapError(
          "database_reconciliation_failed",
        );
      }
    }
    cleanupExactRegularFile(candidate);
  }
}

function cleanupExactRegularFile(filePath) {
  if (!filePath) return;
  try {
    const stats = lstatSync(filePath);
    if (!stats.isFile() || stats.isSymbolicLink()) {
      throw new PublicDatabaseBootstrapError("database_reconciliation_required");
    }
    unlinkSync(filePath);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

function assertLiveSourceRecognizableWhenPresent(databasePath) {
  if (!databaseFamilyExists(databasePath)) {
    throw new PublicDatabaseBootstrapError("database_reconciliation_failed");
  }
  classifyExistingDatabase(databasePath);
}

function assertCanonicalCurrentDatabase(databasePath) {
  const verification = verifyDatabaseFile(databasePath);
  if (
    verification.schemaSignature !==
    canonicalStructuralSchemaContractSignature()
  ) {
    throw new PublicDatabaseBootstrapError("database_reconciliation_failed");
  }
}

function assertDatabaseFamilyMatches(databasePath, expected) {
  if (!databaseFamilyMatches(databasePath, expected)) {
    throw new PublicDatabaseBootstrapError("database_reconciliation_failed");
  }
}

function databaseFamilyMatches(databasePath, expected) {
  if (!validFamilyIdentity(expected)) return false;
  let actual;
  try {
    actual = readDatabaseFamilyIdentity(databasePath);
  } catch {
    return false;
  }
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function databaseFamilyIsRecordedSubset(databasePath, expected) {
  if (!validFamilyIdentity(expected) || !databaseFamilyExists(databasePath)) {
    return false;
  }
  for (const suffix of ["", ...SQLITE_SIDE_SUFFIXES]) {
    const candidate = `${databasePath}${suffix}`;
    if (!existsSync(candidate)) continue;
    const expectedMember = expected.find((entry) => entry.suffix === suffix);
    if (!expectedMember || !regularFileMatches(candidate, expectedMember)) {
      return false;
    }
  }
  return true;
}

function regularFileMatches(filePath, expected) {
  try {
    const identity = readSingleFileIdentity(filePath, expected.suffix);
    return JSON.stringify(identity) === JSON.stringify(expected);
  } catch {
    return false;
  }
}

function readSingleFileIdentity(filePath, suffix) {
  const stats = lstatSync(filePath, { bigint: true });
  if (!stats.isFile() || stats.isSymbolicLink()) {
    throw new PublicDatabaseBootstrapError("database_reconciliation_required");
  }
  return {
    suffix,
    dev: stats.dev.toString(),
    ino: stats.ino.toString(),
    size: stats.size.toString(),
    sha256: hashRegularFile(filePath),
  };
}

function assertDatabaseFamilyAbsent(databasePath) {
  if (databaseFamilyExists(databasePath)) {
    throw new PublicDatabaseBootstrapError("database_reconciliation_failed");
  }
}

function databaseFamilyExists(databasePath) {
  return ["", ...SQLITE_SIDE_SUFFIXES].some((suffix) =>
    existsSync(`${databasePath}${suffix}`),
  );
}

function regularFileExists(filePath) {
  if (!filePath) return false;
  try {
    const stats = lstatSync(filePath);
    return stats.isFile() && !stats.isSymbolicLink();
  } catch {
    return false;
  }
}

function validOperationId(value) {
  return (
    typeof value === "string" &&
    /^\d+-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function validJournalPhaseShape(journal) {
  if (typeof journal.source_was_missing !== "boolean") return false;
  if (
    !journal.source_was_missing &&
    journal.phase !== "acquired" &&
    typeof journal.recovery_backup_basename !== "string"
  ) {
    return false;
  }
  const stagedPhases = new Set([
    "staging_ready",
    "moving_original",
    "original_moved",
    "publishing_staging",
    "staging_published",
    "published_verified",
    "cleanup_complete",
    "original_restored",
    "restoring_original",
    "restore_failed",
  ]);
  if (stagedPhases.has(journal.phase) && !validFamilyIdentity(journal.staged_family)) {
    return false;
  }
  const originalPhases = new Set([
    "moving_original",
    "original_moved",
    "publishing_staging",
    "staging_published",
    "published_verified",
    "cleanup_complete",
    "original_restored",
    "restoring_original",
    "restore_failed",
  ]);
  if (
    !journal.source_was_missing &&
    originalPhases.has(journal.phase) &&
    !validFamilyIdentity(journal.original_family)
  ) {
    return false;
  }
  const publishedPhases = new Set([
    "staging_published",
    "published_verified",
    "cleanup_complete",
  ]);
  return (
    !publishedPhases.has(journal.phase) ||
    validFamilyIdentity(journal.published_family)
  );
}

function validFamilyIdentityOrNull(value) {
  return value === null || validFamilyIdentity(value);
}

function validFamilyIdentity(value) {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.some((entry) => entry?.suffix === "") &&
    value.every(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        ["", ...SQLITE_SIDE_SUFFIXES].includes(entry.suffix) &&
        typeof entry.dev === "string" &&
        /^\d+$/.test(entry.dev) &&
        typeof entry.ino === "string" &&
        /^\d+$/.test(entry.ino) &&
        typeof entry.size === "string" &&
        /^\d+$/.test(entry.size) &&
        typeof entry.sha256 === "string" &&
        /^[0-9a-f]{64}$/.test(entry.sha256),
    ) &&
    new Set(value.map((entry) => entry.suffix)).size === value.length
  );
}

function publicDatabaseReconciliation(state, extra = {}) {
  return {
    state,
    automatic_reconciliation: false,
    phase: null,
    recovery_backup_present: false,
    rollback_material_present: false,
    reason: null,
    ...extra,
  };
}

function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === "EPERM";
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

function databaseIdentityHash(databasePath) {
  return createHash("sha256").update(path.resolve(databasePath)).digest("hex");
}

function readDatabaseFamilyIdentity(databasePath) {
  const family = [];
  for (const suffix of ["", ...SQLITE_SIDE_SUFFIXES]) {
    const candidate = `${databasePath}${suffix}`;
    try {
      const stats = lstatSync(candidate, { bigint: true });
      if (!stats.isFile() || stats.isSymbolicLink()) {
        throw new PublicDatabaseBootstrapError("database_path_invalid");
      }
      family.push({
        suffix,
        dev: stats.dev.toString(),
        ino: stats.ino.toString(),
        size: stats.size.toString(),
        sha256: hashRegularFile(candidate),
      });
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  if (!family.some((entry) => entry.suffix === "")) {
    throw new PublicDatabaseBootstrapError("database_reconciliation_required");
  }
  return family;
}

function hashRegularFile(filePath) {
  const descriptor = openSync(filePath, "r");
  const hash = createHash("sha256");
  const buffer = Buffer.allocUnsafe(64 * 1024);
  try {
    while (true) {
      const count = readSync(descriptor, buffer, 0, buffer.length, null);
      if (count === 0) break;
      hash.update(buffer.subarray(0, count));
    }
  } finally {
    closeSync(descriptor);
  }
  return hash.digest("hex");
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
