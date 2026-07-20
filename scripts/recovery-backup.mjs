import { createHash, randomUUID } from "node:crypto";
import {
  chmodSync,
  closeSync,
  existsSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  linkSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  readdirSync,
  renameSync,
  rmdirSync,
  rmSync,
  unlinkSync,
  writeFileSync,
  writeSync,
} from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import {
  inspectRecoveryPrivateMaterialBoundary,
  normalizeRecoveryPrivateMaterial,
  recoveryPrivateMaterialManifestContract,
} from "../lib/db/recovery-private-material-contract.mjs";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import {
  classifyPrivateProcessOwnership,
  readProcessBirthIdentity,
  startPrivateProcessOwnershipProbe,
  validPrivateProcessOwnershipFields,
} from "./local-process-ownership.mjs";
import { validateRecoveryCanonicalDatabaseV01 } from "./recovery-canonical-record-validator.mjs";

export const RECOVERY_BACKUP_CONTRACT = "augnes.recovery-backup.v1";
export const RECOVERY_BACKUP_CONTRACT_VERSION = 1;
export const RECOVERY_OPERATION_CONTRACT = "augnes.recovery-operations.v1";
export const RECOVERY_OPERATION_SCHEMA_VERSION = 2;
export const LEGACY_RECOVERY_ADOPTION_CONTRACT =
  "augnes.legacy-recovery-adoptions.v1";
export const LEGACY_RECOVERY_ADOPTION_SCHEMA_VERSION = 1;
export const LEGACY_RECOVERY_ADOPTION_FILE =
  "augnes-legacy-recovery-adoptions.json";
export const RECOVERY_MANIFEST_FILE = "recovery-manifest.json";
export const RECOVERY_DATABASE_PAYLOAD = "state/augnes.db";
export const RECOVERY_OPERATION_FILE = "augnes-recovery-operations.json";
export const RECOVERY_BACKUP_OPERATION_CONTRACT =
  "augnes.recovery-backup-operation.v1";
export const RECOVERY_BACKUP_OPERATION_SCHEMA_VERSION = 1;
export const RECOVERY_BACKUP_OPERATION_FILE =
  "augnes-recovery-backup-operation.json";

export function recoveryContractFileMode(mode, platform = process.platform) {
  return platform === "win32" ? 0o600 : Number(mode) & 0o777;
}

const RECOVERY_BACKUP_NAME =
  /^augnes-recovery-\d{8}T\d{6}-[0-9a-f]{8}\.backup$/u;
const RECOVERY_OPERATION_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const RECOVERY_STAGING_NAME =
  /^\.augnes-recovery-incomplete-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const RECOVERY_OPERATION_WRITE_NAME =
  /^augnes-recovery-operations\.json\.write-(\d+)-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const RECOVERY_BACKUP_OPERATION_WRITE_NAME =
  /^augnes-recovery-backup-operation\.json\.write-(\d+)-([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/iu;
const LEGACY_RECOVERY_ADOPTION_WRITE_NAME =
  /^augnes-legacy-recovery-adoptions\.json\.write-(\d+)-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const LEGACY_RECOVERY_BACKUP_NAME =
  /^augnes-pre-migration-(\d{4}-\d{2}-\d{2})T(\d{2})(\d{2})(\d{2})-(\d{3})Z-[A-Za-z0-9-]+\.db$/u;
const MAX_MANIFEST_BYTES = 256 * 1024;
const MAX_OPERATION_BYTES = 256 * 1024;
const MAX_BACKUP_OPERATION_BYTES = 64 * 1024;
const MAX_LEGACY_RECOVERY_ADOPTION_BYTES = 1024 * 1024;
const MAX_OPERATION_EVENTS = 20;
const MAX_RECOVERY_BACKUPS = 6;
const MAX_RECOVERY_CANDIDATES = 12;
const MAX_BACKUP_DIRECTORY_ENTRIES = 1_000;
const HASH_BUFFER = Buffer.allocUnsafe(64 * 1024);

export class PublicRecoveryBackupError extends Error {
  constructor(code, cause) {
    super(code, cause ? { cause } : undefined);
    this.name = "PublicRecoveryBackupError";
    this.code = code;
  }
}

/**
 * Validate immutable Core records through the same protocol and relation
 * readers used by the product. Recovery only reports a bounded public code;
 * rejected record material never crosses this boundary.
 */
export function validateRecoveryCanonicalRecords(database) {
  const result = validateRecoveryCanonicalDatabaseV01(database);
  if (result.status !== "valid") {
    throw new PublicRecoveryBackupError(result.code);
  }
  return result.record_count;
}

export async function createRecoveryBackup({
  databasePath,
  backupDirectory,
  applicationScopeFingerprint,
  sourceApplication,
  reason,
  operationKind = "backup",
  inspectDatabase,
  backupBasename = null,
  stagingBasename = null,
  operationUuid: requestedOperationUuid = null,
  protectedBackupIds = [],
  allowIneligible = false,
  expectedSourcePayload = null,
  expectedSourceIdentity = null,
  now = () => new Date(),
  dependencies = {},
} = {}) {
  assertAbsolute(databasePath, "recovery_source_invalid");
  assertAbsolute(backupDirectory, "recovery_backup_directory_invalid");
  assertScopeFingerprint(applicationScopeFingerprint);
  assertSourceApplication(sourceApplication);
  assertBackupReason(reason);
  if (!["backup", "legacy_adoption"].includes(operationKind)) {
    throw new PublicRecoveryBackupError("recovery_backup_operation_invalid");
  }
  if (
    !Array.isArray(protectedBackupIds) ||
    protectedBackupIds.length > MAX_RECOVERY_BACKUPS ||
    !protectedBackupIds.every((value) =>
      /^recovery:[0-9a-f-]{36}$/iu.test(value),
    )
  ) {
    throw new PublicRecoveryBackupError("recovery_backup_retention_invalid");
  }
  if (typeof inspectDatabase !== "function") {
    throw new PublicRecoveryBackupError("recovery_verifier_unavailable");
  }
  if (typeof allowIneligible !== "boolean") {
    throw new PublicRecoveryBackupError("recovery_backup_eligibility_invalid");
  }
  if (expectedSourcePayload !== null) validatePayloadEntry(expectedSourcePayload);
  if (
    (expectedSourcePayload === null) !== (expectedSourceIdentity === null) ||
    (expectedSourceIdentity !== null &&
      !validDirectoryIdentity(expectedSourceIdentity))
  ) {
    throw new PublicRecoveryBackupError("recovery_source_invalid");
  }
  assertRegularFile(databasePath, "recovery_source_invalid");
  ensureRestrictedDirectory(backupDirectory);

  if (
    requestedOperationUuid !== null &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
      requestedOperationUuid,
    )
  ) {
    throw new PublicRecoveryBackupError("recovery_backup_name_invalid");
  }
  const stagingOperationUuid =
    typeof stagingBasename === "string" && RECOVERY_STAGING_NAME.test(stagingBasename)
      ? stagingBasename.slice(".augnes-recovery-incomplete-".length)
      : null;
  if (
    requestedOperationUuid !== null &&
    stagingOperationUuid !== null &&
    requestedOperationUuid.toLowerCase() !== stagingOperationUuid.toLowerCase()
  ) {
    throw new PublicRecoveryBackupError("recovery_backup_name_invalid");
  }
  const operationUuid =
    requestedOperationUuid ?? stagingOperationUuid ?? randomUUID();
  const createdAt = now().toISOString();
  const resolvedBackupBasename =
    backupBasename ?? recoveryBackupBasename(createdAt, operationUuid);
  const resolvedStagingBasename =
    stagingBasename ?? `.augnes-recovery-incomplete-${operationUuid}`;
  assertBackupBasename(resolvedBackupBasename);
  assertStagingBasename(resolvedStagingBasename);
  if (
    resolvedBackupBasename !== recoveryBackupBasename(createdAt, operationUuid) ||
    resolvedStagingBasename !==
      `.augnes-recovery-incomplete-${operationUuid.toLowerCase()}`
  ) {
    throw new PublicRecoveryBackupError("recovery_backup_name_invalid");
  }

  const backupPath = path.join(backupDirectory, resolvedBackupBasename);
  const stagingPath = path.join(backupDirectory, resolvedStagingBasename);
  let stagingIdentity = null;
  let publishedIdentity = null;
  let backupOperation = null;
  let backupOwnershipProbe = null;
  if (existsSync(backupPath) || existsSync(stagingPath)) {
    throw new PublicRecoveryBackupError("recovery_backup_conflict");
  }

  try {
    mkdirSync(stagingPath, { mode: 0o700 });
    setRestrictedMode(stagingPath, 0o700);
    const createdStaging = lstatSync(stagingPath, { bigint: true });
    stagingIdentity = {
      dev: createdStaging.dev,
      ino: createdStaging.ino,
    };
    backupOperation = await beginRecoveryBackupOperation({
      backupDirectory,
      applicationScopeFingerprint,
      operationUuid,
      operationKind,
      reason,
      backupBasename: resolvedBackupBasename,
      stagingBasename: resolvedStagingBasename,
      stagingDirectoryIdentity: directoryIdentity(createdStaging),
      createdAt,
    });
    backupOwnershipProbe = backupOperation.ownershipProbe;
    dependencies.afterStagingCreated?.({
      stagingPath,
      stagingIdentity: {
        dev: createdStaging.dev.toString(),
        ino: createdStaging.ino.toString(),
      },
    });
    const stateDirectory = path.join(stagingPath, "state");
    mkdirSync(stateDirectory, { mode: 0o700 });
    setRestrictedMode(stateDirectory, 0o700);
    const payloadPath = path.join(stagingPath, RECOVERY_DATABASE_PAYLOAD);
    await snapshotSqliteDatabase({
      sourcePath: databasePath,
      targetPath: payloadPath,
      backupDatabase: dependencies.backupDatabase,
    });
    await dependencies.afterSnapshotCreated?.({
      sourcePath: databasePath,
      targetPath: payloadPath,
    });
    normalizeRecoverySnapshotPrivateMaterial(payloadPath);
    if (expectedSourcePayload !== null) {
      let sourceIdentity = null;
      const sourcePayload = readStablePayloadEntry(
        databasePath,
        RECOVERY_DATABASE_PAYLOAD,
        (identity) => {
          sourceIdentity = identity;
        },
      );
      if (
        JSON.stringify(sourcePayload) !== JSON.stringify(expectedSourcePayload) ||
        sourceIdentity === null ||
        !sameDirectoryIdentity(sourceIdentity, expectedSourceIdentity)
      ) {
        throw new PublicRecoveryBackupError("recovery_source_changed");
      }
    }
    await dependencies.prepareSnapshotDatabase?.({
      databasePath: payloadPath,
    });

    assertRecoveryPrivateMaterialPayload(
      payloadPath,
      "recovery_backup_verification_failed",
    );
    let database;
    try {
      database = normalizeDatabaseInspection(inspectDatabase(payloadPath));
    } catch (error) {
      if (error instanceof PublicRecoveryBackupError) throw error;
      throw new PublicRecoveryBackupError(
        "recovery_backup_verification_failed",
        error,
      );
    }
    assertRecoveryEligibility(database, allowIneligible, "recovery_backup_ineligible");
    if (!database.recovery_eligible && reason !== "pre_restore_safety") {
      throw new PublicRecoveryBackupError("recovery_backup_ineligible");
    }
    const payload = readStablePayloadEntry(
      payloadPath,
      RECOVERY_DATABASE_PAYLOAD,
    );
    const manifestWithoutIdentity = {
      contract: RECOVERY_BACKUP_CONTRACT,
      contract_version: RECOVERY_BACKUP_CONTRACT_VERSION,
      portable: false,
      backup_id: `recovery:${operationUuid}`,
      application_scope_fingerprint: applicationScopeFingerprint,
      created_at: createdAt,
      reason,
      source_application: normalizeSourceApplication(sourceApplication),
      private_material: recoveryPrivateMaterialManifestContract(),
      database,
      payloads: [payload],
    };
    const manifest = {
      ...manifestWithoutIdentity,
      backup_identity: recoveryManifestIdentity(manifestWithoutIdentity),
    };
    writeRestrictedJson(
      path.join(stagingPath, RECOVERY_MANIFEST_FILE),
      manifest,
    );
    fsyncDirectoryBestEffort(stateDirectory);
    fsyncDirectoryBestEffort(stagingPath);

    validateRecoveryBackup({
      backupPath: stagingPath,
      expectedApplicationScopeFingerprint: applicationScopeFingerprint,
      inspectDatabase,
      expectedBackupId: manifest.backup_id,
      allowIneligible,
      allowStagingName: true,
    });
    const verifiedStagingIdentity = lstatSync(stagingPath, { bigint: true });
    if (
      stagingIdentity === null ||
      verifiedStagingIdentity.dev !== stagingIdentity.dev ||
      verifiedStagingIdentity.ino !== stagingIdentity.ino
    ) {
      throw new PublicRecoveryBackupError("recovery_backup_staging_changed");
    }
    renameSync(stagingPath, backupPath);
    publishedIdentity = {
      dev: verifiedStagingIdentity.dev,
      ino: verifiedStagingIdentity.ino,
    };
    fsyncDirectoryBestEffort(backupDirectory);
    const verified = validateRecoveryBackup({
      backupPath,
      expectedApplicationScopeFingerprint: applicationScopeFingerprint,
      inspectDatabase,
      expectedBackupId: manifest.backup_id,
      allowIneligible,
    });
    enforceRecoveryBackupRetention({
      backupDirectory,
      applicationScopeFingerprint,
      inspectDatabase,
      newBackupId: verified.manifest.backup_id,
      protectedBackupIds,
    });
    dependencies.afterBackupPublished?.({
      backupPath,
      manifest: verified.manifest,
      backupDirectoryIdentity: verified.backupDirectoryIdentity,
    });
    clearRecoveryBackupOperation(backupOperation);
    backupOperation = null;
    return {
      backupPath,
      payloadPath: verified.payloadPath,
      backupDirectoryIdentity: verified.backupDirectoryIdentity,
      stateDirectoryIdentity: verified.stateDirectoryIdentity,
      manifestFileIdentity: verified.manifestFileIdentity,
      payloadFileIdentity: verified.payloadFileIdentity,
      backupBasename: resolvedBackupBasename,
      stagingBasename: resolvedStagingBasename,
      manifest: verified.manifest,
      public: publicBackupSummary(verified.manifest),
    };
  } catch (error) {
    if (stagingIdentity !== null) {
      removeIncompleteRecoveryBackup(stagingPath, stagingIdentity);
    }
    if (publishedIdentity) {
      removeCreatedRecoveryBackup(backupPath, publishedIdentity);
    }
    if (
      backupOperation !== null &&
      !existsSync(stagingPath) &&
      !existsSync(backupPath)
    ) {
      clearRecoveryBackupOperation(backupOperation);
      backupOperation = null;
    }
    if (error instanceof PublicRecoveryBackupError) throw error;
    throw new PublicRecoveryBackupError("recovery_backup_creation_failed", error);
  } finally {
    await backupOwnershipProbe?.close();
  }
}

export async function reconcileRecoveryBackupOperation(options = {}) {
  try {
    return await reconcileRecoveryBackupOperationInternal(options);
  } catch (error) {
    if (error instanceof PublicRecoveryBackupError) throw error;
    throw new PublicRecoveryBackupError(
      "recovery_backup_operation_reconciliation_failed",
      error,
    );
  }
}

async function reconcileRecoveryBackupOperationInternal({
  backupDirectory,
  applicationScopeFingerprint,
  inspectDatabase,
  inspectSafetyDatabase = inspectDatabase,
  dependencies = {},
} = {}) {
  assertAbsolute(backupDirectory, "recovery_backup_directory_invalid");
  assertScopeFingerprint(applicationScopeFingerprint);
  if (typeof inspectDatabase !== "function") {
    throw new PublicRecoveryBackupError("recovery_verifier_unavailable");
  }
  if (typeof inspectSafetyDatabase !== "function") {
    throw new PublicRecoveryBackupError("recovery_verifier_unavailable");
  }
  try {
    lstatSync(backupDirectory);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return { reconciled: false, outcome: "no_backup_operation" };
    }
    throw new PublicRecoveryBackupError(
      "recovery_backup_directory_invalid",
      error,
    );
  }
  ensureRestrictedDirectory(backupDirectory);
  const journalPath = path.join(
    backupDirectory,
    RECOVERY_BACKUP_OPERATION_FILE,
  );
  const backupDirectoryEntries = boundedBackupDirectoryEntries(backupDirectory);
  const operationWriteCandidates = backupDirectoryEntries.filter((entry) =>
    entry.startsWith(`${RECOVERY_BACKUP_OPERATION_FILE}.write-`),
  );
  const operationWriteEntries = operationWriteCandidates
    .filter((entry) => RECOVERY_BACKUP_OPERATION_WRITE_NAME.test(entry));
  if (operationWriteCandidates.length !== operationWriteEntries.length) {
    throw new PublicRecoveryBackupError(
      "recovery_backup_operation_journal_invalid",
    );
  }
  const journalExists = existsSync(journalPath);
  if (!journalExists && operationWriteEntries.length === 0) {
    const removedEmptyStages = removeUnjournaledEmptyRecoveryStages({
      backupDirectory,
      entries: backupDirectoryEntries,
      dependencies,
    });
    return {
      reconciled: removedEmptyStages > 0,
      outcome:
        removedEmptyStages > 0
          ? "empty_unjournaled_stage_removed"
          : "no_backup_operation",
    };
  }
  if (operationWriteEntries.length > 1) {
    throw new PublicRecoveryBackupError(
      "recovery_backup_operation_journal_invalid",
    );
  }
  const operationPath = journalExists
    ? journalPath
    : path.join(backupDirectory, operationWriteEntries[0]);
  if (!journalExists && operationWriteEntries.length !== 1) {
      throw new PublicRecoveryBackupError(
        "recovery_backup_operation_journal_invalid",
      );
  }

  let journalIdentity = null;
  let record;
  try {
    record = normalizeRecoveryBackupOperation(
      readStableJsonFile(operationPath, {
        maximumBytes: MAX_BACKUP_OPERATION_BYTES,
        afterDescriptorOpened: (identity) => {
          journalIdentity = identity;
        },
      }),
    );
  } catch (error) {
    if (!journalExists) {
      return reconcileMalformedBackupOperationWrite({
        backupDirectory,
        writeBasename: operationWriteEntries[0],
        dependencies,
      });
    }
    throw new PublicRecoveryBackupError(
      "recovery_backup_operation_journal_invalid",
      error,
    );
  }
  const rootStats = lstatSync(backupDirectory, { bigint: true });
  if (
    record.application_scope_fingerprint !== applicationScopeFingerprint ||
    !sameDirectoryIdentity(
      record.backup_directory_identity,
      directoryIdentity(rootStats),
    )
  ) {
    throw new PublicRecoveryBackupError(
      "recovery_backup_operation_scope_conflict",
    );
  }
  const expectedWriteBasename = recoveryBackupOperationWriteBasename(
    record.operation_id,
    record.owner_pid,
  );
  if (
    operationWriteEntries.length === 1 &&
    operationWriteEntries[0] !== expectedWriteBasename
  ) {
    throw new PublicRecoveryBackupError(
      "recovery_backup_operation_journal_invalid",
    );
  }
  let linkedWriteIdentity = null;
  if (journalExists && operationWriteEntries.length === 1) {
    const linkedWritePath = path.join(
      backupDirectory,
      operationWriteEntries[0],
    );
    const linkedWriteStats = lstatSync(linkedWritePath, { bigint: true });
    linkedWriteIdentity = directoryIdentity(linkedWriteStats);
    if (
      !linkedWriteStats.isFile() ||
      linkedWriteStats.isSymbolicLink() ||
      hasUnsafeMode(linkedWriteStats.mode) ||
      !sameDirectoryIdentity(linkedWriteIdentity, journalIdentity)
    ) {
      throw new PublicRecoveryBackupError(
        "recovery_backup_operation_journal_invalid",
      );
    }
  }
  const ownership = await classifyPrivateProcessOwnership({
    contract: RECOVERY_BACKUP_OPERATION_CONTRACT,
    schemaVersion: RECOVERY_BACKUP_OPERATION_SCHEMA_VERSION,
    repositoryFingerprint: record.application_scope_fingerprint,
    ownershipId: record.operation_id,
    ownerPid: record.owner_pid,
    ownerProcessIdentity: record.owner_process_identity,
    probePort: record.owner_probe_port,
    probeToken: record.owner_probe_token,
    ownershipBinding: record.ownership_binding,
  });
  if (ownership === "verified_live") {
    throw new PublicRecoveryBackupError(
      "recovery_backup_operation_in_progress",
    );
  }
  if (ownership !== "stale") {
    throw new PublicRecoveryBackupError(
      "recovery_backup_operation_ownership_unverifiable",
    );
  }

  const stagingPath = path.join(backupDirectory, record.staging_basename);
  const backupPath = path.join(backupDirectory, record.backup_basename);
  if (existsSync(stagingPath) && existsSync(backupPath)) {
    throw new PublicRecoveryBackupError("recovery_backup_operation_conflict");
  }
  if (existsSync(backupPath)) {
    const allowIneligible = record.reason === "pre_restore_safety";
    const verified = validateRecoveryBackup({
      backupPath,
      expectedApplicationScopeFingerprint: applicationScopeFingerprint,
      inspectDatabase: allowIneligible ? inspectSafetyDatabase : inspectDatabase,
      expectedBackupId: `recovery:${record.operation_id}`,
      allowIneligible,
    });
    if (
      record.staging_directory_identity !== null &&
      !sameDirectoryIdentity(
        verified.backupDirectoryIdentity,
        record.staging_directory_identity,
      )
    ) {
      throw new PublicRecoveryBackupError("recovery_backup_operation_changed");
    }
  } else if (existsSync(stagingPath)) {
    const before = lstatSync(stagingPath, { bigint: true });
    if (
      !before.isDirectory() ||
      before.isSymbolicLink() ||
      hasUnsafeMode(before.mode) ||
      (record.staging_directory_identity !== null &&
        !sameDirectoryIdentity(
          directoryIdentity(before),
          record.staging_directory_identity,
        )) ||
      (record.staging_directory_identity === null &&
        readdirSync(stagingPath).length !== 0)
    ) {
      throw new PublicRecoveryBackupError("recovery_backup_operation_changed");
    }
    const capturedIdentity = directoryIdentity(before);
    dependencies.beforeStagingRemoval?.({ stagingPath });
    const after = lstatSync(stagingPath, { bigint: true });
    if (
      !sameDirectoryIdentity(capturedIdentity, directoryIdentity(after)) ||
      (record.staging_directory_identity !== null &&
        !sameDirectoryIdentity(
          record.staging_directory_identity,
          directoryIdentity(after),
        ))
    ) {
      throw new PublicRecoveryBackupError("recovery_backup_operation_changed");
    }
    removeIncompleteRecoveryBackup(stagingPath, capturedIdentity);
    if (existsSync(stagingPath)) {
      throw new PublicRecoveryBackupError("recovery_backup_operation_changed");
    }
    fsyncDirectoryBestEffort(backupDirectory);
  }
  if (linkedWriteIdentity !== null) {
    const linkedWritePath = path.join(backupDirectory, expectedWriteBasename);
    assertExactFileIdentity(
      linkedWritePath,
      linkedWriteIdentity,
      "recovery_backup_operation_changed",
    );
    unlinkSync(linkedWritePath);
    fsyncDirectoryBestEffort(backupDirectory);
  }
  clearRecoveryBackupOperation({
    journalPath: operationPath,
    journalIdentity,
    record,
  });
  return {
    reconciled: true,
    outcome: existsSync(backupPath)
      ? "published_backup_preserved"
      : "stale_backup_stage_removed",
  };
}

function removeUnjournaledEmptyRecoveryStages({
  backupDirectory,
  entries,
  dependencies,
}) {
  let removed = 0;
  for (const entry of entries.filter((value) => RECOVERY_STAGING_NAME.test(value))) {
    const stagingPath = path.join(backupDirectory, entry);
    const before = lstatSync(stagingPath, { bigint: true });
    if (
      !before.isDirectory() ||
      before.isSymbolicLink() ||
      hasUnsafeMode(before.mode) ||
      readdirSync(stagingPath).length !== 0
    ) {
      throw new PublicRecoveryBackupError(
        "recovery_backup_operation_unowned_stage",
      );
    }
    const identity = directoryIdentity(before);
    dependencies.beforeEmptyStagingRemoval?.({ stagingPath });
    const after = lstatSync(stagingPath, { bigint: true });
    if (!sameDirectoryIdentity(identity, directoryIdentity(after))) {
      throw new PublicRecoveryBackupError("recovery_backup_operation_changed");
    }
    rmdirSync(stagingPath);
    removed += 1;
  }
  if (removed > 0) fsyncDirectoryBestEffort(backupDirectory);
  return removed;
}

function reconcileMalformedBackupOperationWrite({
  backupDirectory,
  writeBasename,
  dependencies,
}) {
  const match = writeBasename.match(RECOVERY_BACKUP_OPERATION_WRITE_NAME);
  if (!match) {
    throw new PublicRecoveryBackupError(
      "recovery_backup_operation_journal_invalid",
    );
  }
  const ownerPid = Number(match[1]);
  const operationId = match[2].toLowerCase();
  const owner = readProcessBirthIdentity(ownerPid);
  if (owner.state !== "missing") {
    throw new PublicRecoveryBackupError(
      "recovery_backup_operation_ownership_unverifiable",
    );
  }
  const stagingPath = path.join(
    backupDirectory,
    `.augnes-recovery-incomplete-${operationId}`,
  );
  if (existsSync(stagingPath)) {
    const before = lstatSync(stagingPath, { bigint: true });
    if (
      !before.isDirectory() ||
      before.isSymbolicLink() ||
      hasUnsafeMode(before.mode) ||
      readdirSync(stagingPath).length !== 0
    ) {
      throw new PublicRecoveryBackupError(
        "recovery_backup_operation_journal_invalid",
      );
    }
    const identity = directoryIdentity(before);
    dependencies.beforeEmptyStagingRemoval?.({ stagingPath });
    const after = lstatSync(stagingPath, { bigint: true });
    if (!sameDirectoryIdentity(identity, directoryIdentity(after))) {
      throw new PublicRecoveryBackupError("recovery_backup_operation_changed");
    }
    rmdirSync(stagingPath);
  }
  const writePath = path.join(backupDirectory, writeBasename);
  const writeStats = lstatSync(writePath, { bigint: true });
  if (
    !writeStats.isFile() ||
    writeStats.isSymbolicLink() ||
    hasUnsafeMode(writeStats.mode)
  ) {
    throw new PublicRecoveryBackupError(
      "recovery_backup_operation_journal_invalid",
    );
  }
  const writeIdentity = directoryIdentity(writeStats);
  dependencies.beforeMalformedJournalRemoval?.({ writePath });
  assertExactFileIdentity(
    writePath,
    writeIdentity,
    "recovery_backup_operation_changed",
  );
  unlinkSync(writePath);
  fsyncDirectoryBestEffort(backupDirectory);
  return {
    reconciled: true,
    outcome: "incomplete_backup_journal_removed",
  };
}

async function beginRecoveryBackupOperation({
  backupDirectory,
  applicationScopeFingerprint,
  operationUuid,
  operationKind,
  reason,
  backupBasename,
  stagingBasename,
  stagingDirectoryIdentity,
  createdAt,
}) {
  const ownershipNonce = randomUUID();
  const ownershipProbe = await startPrivateProcessOwnershipProbe({
    contract: RECOVERY_BACKUP_OPERATION_CONTRACT,
    schemaVersion: RECOVERY_BACKUP_OPERATION_SCHEMA_VERSION,
    repositoryFingerprint: applicationScopeFingerprint,
    ownershipId: operationUuid,
    ownershipNonce,
  });
  const journalPath = path.join(
    backupDirectory,
    RECOVERY_BACKUP_OPERATION_FILE,
  );
  const rootStats = lstatSync(backupDirectory, { bigint: true });
  const record = {
    contract: RECOVERY_BACKUP_OPERATION_CONTRACT,
    schema_version: RECOVERY_BACKUP_OPERATION_SCHEMA_VERSION,
    application_scope_fingerprint: applicationScopeFingerprint,
    operation_id: operationUuid,
    operation_kind: operationKind,
    reason,
    created_at: createdAt,
    phase: "staging_owned",
    backup_basename: backupBasename,
    staging_basename: stagingBasename,
    backup_directory_identity: directoryIdentity(rootStats),
    staging_directory_identity: stagingDirectoryIdentity,
    owner_pid: process.pid,
    owner_process_identity: ownershipProbe.ownerProcessIdentity,
    owner_probe_port: ownershipProbe.probePort,
    owner_probe_token: ownershipProbe.probeToken,
    ownership_binding: ownershipProbe.ownershipBinding,
  };
  const temporaryPath = path.join(
    backupDirectory,
    recoveryBackupOperationWriteBasename(operationUuid, process.pid),
  );
  let temporaryIdentity = null;
  try {
    if (existsSync(journalPath) || existsSync(temporaryPath)) {
      throw Object.assign(new Error("backup operation exists"), {
        code: "EEXIST",
      });
    }
    writeRestrictedJson(temporaryPath, record);
    const temporaryStats = lstatSync(temporaryPath, { bigint: true });
    temporaryIdentity = {
      dev: temporaryStats.dev,
      ino: temporaryStats.ino,
    };
    linkSync(temporaryPath, journalPath);
    fsyncDirectoryBestEffort(backupDirectory);
    removeExactRegularFile(temporaryPath, temporaryIdentity);
    if (existsSync(temporaryPath)) {
      throw new PublicRecoveryBackupError(
        "recovery_backup_operation_journal_failed",
      );
    }
    temporaryIdentity = null;
    fsyncDirectoryBestEffort(backupDirectory);
    const journalStats = lstatSync(journalPath, { bigint: true });
    return {
      journalPath,
      journalIdentity: directoryIdentity(journalStats),
      record,
      ownershipProbe,
    };
  } catch (error) {
    removeExactRegularFile(temporaryPath, temporaryIdentity);
    await ownershipProbe.close();
    throw new PublicRecoveryBackupError(
      error?.code === "EEXIST"
        ? "recovery_backup_operation_in_progress"
        : "recovery_backup_operation_journal_failed",
      error,
    );
  }
}

function clearRecoveryBackupOperation(operation) {
  const current = normalizeRecoveryBackupOperation(
    readStableJsonFile(operation.journalPath, {
      maximumBytes: MAX_BACKUP_OPERATION_BYTES,
    }),
  );
  if (current.operation_id !== operation.record.operation_id) {
    throw new PublicRecoveryBackupError("recovery_backup_operation_changed");
  }
  assertExactFileIdentity(
    operation.journalPath,
    operation.journalIdentity,
    "recovery_backup_operation_changed",
  );
  unlinkSync(operation.journalPath);
  fsyncDirectoryBestEffort(path.dirname(operation.journalPath));
}

function recoveryBackupOperationWriteBasename(operationId, ownerPid) {
  return `${RECOVERY_BACKUP_OPERATION_FILE}.write-${ownerPid}-${operationId}`;
}

function boundedBackupDirectoryEntries(backupDirectory) {
  const entries = readdirSync(backupDirectory);
  if (entries.length > MAX_BACKUP_DIRECTORY_ENTRIES) {
    throw new PublicRecoveryBackupError(
      "recovery_backup_operation_journal_invalid",
    );
  }
  return entries;
}

function directoryIdentity(stats) {
  return { dev: stats.dev.toString(), ino: stats.ino.toString() };
}

function assertExactFileIdentity(filePath, identity, code) {
  try {
    const stats = lstatSync(filePath, { bigint: true });
    if (
      !stats.isFile() ||
      stats.isSymbolicLink() ||
      !sameDirectoryIdentity(directoryIdentity(stats), identity)
    ) {
      throw new Error("identity changed");
    }
  } catch (error) {
    throw new PublicRecoveryBackupError(code, error);
  }
}

function normalizeRecoveryBackupOperation(value) {
  assertPlainRecord(value);
  assertExactKeys(value, [
    "application_scope_fingerprint",
    "backup_basename",
    "backup_directory_identity",
    "contract",
    "created_at",
    "operation_id",
    "operation_kind",
    "owner_pid",
    "owner_probe_port",
    "owner_probe_token",
    "owner_process_identity",
    "ownership_binding",
    "phase",
    "reason",
    "schema_version",
    "staging_basename",
    "staging_directory_identity",
  ]);
  if (
    value.contract !== RECOVERY_BACKUP_OPERATION_CONTRACT ||
    value.schema_version !== RECOVERY_BACKUP_OPERATION_SCHEMA_VERSION ||
    !/^[a-f0-9]{64}$/u.test(value.application_scope_fingerprint ?? "") ||
    !RECOVERY_OPERATION_UUID.test(value.operation_id ?? "") ||
    !["backup", "legacy_adoption"].includes(value.operation_kind) ||
    value.phase !== "staging_owned" ||
    !validIsoTimestamp(value.created_at) ||
    !Number.isInteger(value.owner_pid) ||
    value.owner_pid <= 0 ||
    !validPrivateProcessOwnershipFields({
      ownerProcessIdentity: value.owner_process_identity,
      probePort: value.owner_probe_port,
      probeToken: value.owner_probe_token,
      ownershipBinding: value.ownership_binding,
    }) ||
    !validDirectoryIdentity(value.backup_directory_identity) ||
    !validDirectoryIdentity(value.staging_directory_identity) ||
    value.staging_basename !==
      `.augnes-recovery-incomplete-${value.operation_id.toLowerCase()}` ||
    value.backup_basename !==
      recoveryBackupBasename(value.created_at, value.operation_id)
  ) {
    throw new PublicRecoveryBackupError(
      "recovery_backup_operation_journal_invalid",
    );
  }
  assertBackupBasename(value.backup_basename);
  assertStagingBasename(value.staging_basename);
  assertBackupReason(value.reason);
  return value;
}

export function validateRecoveryBackup({
  backupPath,
  expectedApplicationScopeFingerprint,
  inspectDatabase,
  expectedBackupId = null,
  expectedBackupIdentity = null,
  expectedBackupDirectoryIdentity = null,
  expectedStateDirectoryIdentity = null,
  expectedManifestFileIdentity = null,
  expectedPayloadFileIdentity = null,
  allowIneligible = false,
  allowStagingName = false,
  dependencies = {},
} = {}) {
  assertAbsolute(backupPath, "restore_validation_failed");
  assertScopeFingerprint(expectedApplicationScopeFingerprint);
  if (typeof inspectDatabase !== "function") {
    throw new PublicRecoveryBackupError("recovery_verifier_unavailable");
  }
  if (typeof allowIneligible !== "boolean") {
    throw new PublicRecoveryBackupError("restore_validation_failed");
  }
  if (
    expectedBackupDirectoryIdentity !== null &&
    !validDirectoryIdentity(expectedBackupDirectoryIdentity)
  ) {
    throw new PublicRecoveryBackupError("restore_validation_failed");
  }
  for (const identity of [
    expectedStateDirectoryIdentity,
    expectedManifestFileIdentity,
    expectedPayloadFileIdentity,
  ]) {
    if (identity !== null && !validDirectoryIdentity(identity)) {
      throw new PublicRecoveryBackupError("restore_validation_failed");
    }
  }
  const basename = path.basename(backupPath);
  if (
    (!RECOVERY_BACKUP_NAME.test(basename) &&
      !(allowStagingName && RECOVERY_STAGING_NAME.test(basename))) ||
    path.dirname(backupPath) === backupPath
  ) {
    throw new PublicRecoveryBackupError("restore_validation_failed");
  }
  assertRestrictedDirectory(backupPath, "restore_validation_failed");
  const openedBackupDirectory = lstatSync(backupPath, { bigint: true });
  const backupDirectoryIdentity = {
    dev: openedBackupDirectory.dev.toString(),
    ino: openedBackupDirectory.ino.toString(),
  };
  if (
    expectedBackupDirectoryIdentity !== null &&
    !sameDirectoryIdentity(
      backupDirectoryIdentity,
      expectedBackupDirectoryIdentity,
    )
  ) {
    throw new PublicRecoveryBackupError("restore_backup_changed");
  }
  assertExactDirectoryEntries(backupPath, [RECOVERY_MANIFEST_FILE, "state"]);
  const stateDirectory = path.join(backupPath, "state");
  assertRestrictedDirectory(stateDirectory, "restore_validation_failed");
  const openedStateDirectory = lstatSync(stateDirectory, { bigint: true });
  const stateDirectoryIdentity = {
    dev: openedStateDirectory.dev.toString(),
    ino: openedStateDirectory.ino.toString(),
  };
  if (
    expectedStateDirectoryIdentity !== null &&
    !sameDirectoryIdentity(
      stateDirectoryIdentity,
      expectedStateDirectoryIdentity,
    )
  ) {
    throw new PublicRecoveryBackupError("restore_backup_changed");
  }
  dependencies.afterStateDirectoryOpened?.({
    backupPath,
    stateDirectory,
    stateDirectoryIdentity,
  });
  assertExactDirectoryEntries(stateDirectory, ["augnes.db"]);

  const manifestPath = path.join(backupPath, RECOVERY_MANIFEST_FILE);
  let manifestFileIdentity = null;
  const manifest = readManifest(manifestPath, (identity) => {
    manifestFileIdentity = identity;
  });
  if (
    manifestFileIdentity === null ||
    (expectedManifestFileIdentity !== null &&
      !sameDirectoryIdentity(
        manifestFileIdentity,
        expectedManifestFileIdentity,
      ))
  ) {
    throw new PublicRecoveryBackupError("restore_backup_changed");
  }
  validateRecoveryManifestShape(manifest, {
    expectedApplicationScopeFingerprint,
    expectedBackupId,
    expectedBackupIdentity,
    allowIneligible,
  });
  const payloadPath = path.join(backupPath, RECOVERY_DATABASE_PAYLOAD);
  let payloadFileIdentity = null;
  const actualPayload = readStablePayloadEntry(
    payloadPath,
    RECOVERY_DATABASE_PAYLOAD,
    (identity) => {
      payloadFileIdentity = identity;
    },
  );
  if (JSON.stringify(actualPayload) !== JSON.stringify(manifest.payloads[0])) {
    throw new PublicRecoveryBackupError("restore_payload_tampered");
  }
  assertRecoveryPrivateMaterialPayload(
    payloadPath,
    "restore_database_contract_mismatch",
  );
  const database = normalizeDatabaseInspection(inspectDatabase(payloadPath));
  assertRecoveryEligibility(database, allowIneligible, "restore_database_incompatible");
  if (JSON.stringify(database) !== JSON.stringify(manifest.database)) {
    throw new PublicRecoveryBackupError("restore_database_contract_mismatch");
  }
  const payloadFile = lstatSync(payloadPath, { bigint: true });
  if (
    payloadFileIdentity === null ||
    (expectedPayloadFileIdentity !== null &&
      !sameDirectoryIdentity(
        payloadFileIdentity,
        expectedPayloadFileIdentity,
      )) ||
    payloadFile.dev.toString() !== payloadFileIdentity.dev ||
    payloadFile.ino.toString() !== payloadFileIdentity.ino
  ) {
    throw new PublicRecoveryBackupError("restore_backup_changed");
  }
  let finalBackupDirectory;
  let finalStateDirectory;
  let finalManifestFile;
  try {
    finalBackupDirectory = lstatSync(backupPath, { bigint: true });
    finalStateDirectory = lstatSync(stateDirectory, { bigint: true });
    finalManifestFile = lstatSync(manifestPath, { bigint: true });
  } catch (error) {
    throw new PublicRecoveryBackupError("restore_backup_changed", error);
  }
  if (
    finalBackupDirectory.dev.toString() !== backupDirectoryIdentity.dev ||
    finalBackupDirectory.ino.toString() !== backupDirectoryIdentity.ino
  ) {
    throw new PublicRecoveryBackupError("restore_backup_changed");
  }
  if (
    !finalStateDirectory.isDirectory() ||
    finalStateDirectory.isSymbolicLink() ||
    finalStateDirectory.dev.toString() !== stateDirectoryIdentity.dev ||
    finalStateDirectory.ino.toString() !== stateDirectoryIdentity.ino
  ) {
    throw new PublicRecoveryBackupError("restore_backup_changed");
  }
  if (
    !finalManifestFile.isFile() ||
    finalManifestFile.isSymbolicLink() ||
    finalManifestFile.dev.toString() !== manifestFileIdentity.dev ||
    finalManifestFile.ino.toString() !== manifestFileIdentity.ino
  ) {
    throw new PublicRecoveryBackupError("restore_backup_changed");
  }
  return {
    backupPath,
    payloadPath,
    backupDirectoryIdentity,
    stateDirectoryIdentity,
    manifestFileIdentity,
    payloadFileIdentity,
    manifest,
    public: publicBackupSummary(manifest),
  };
}

export function listRecoveryBackups({
  backupDirectory,
  applicationScopeFingerprint,
  inspectDatabase,
  allowRetentionOverflow = false,
} = {}) {
  assertAbsolute(backupDirectory, "recovery_backup_directory_invalid");
  assertScopeFingerprint(applicationScopeFingerprint);
  if (!existsSync(backupDirectory)) return { verified: [], rejected: [] };
  assertRestrictedDirectory(
    backupDirectory,
    "recovery_backup_directory_invalid",
  );
  const names = readdirSync(backupDirectory).sort();
  const backupNames = names.filter((name) => RECOVERY_BACKUP_NAME.test(name));
  if (
    names.length > MAX_BACKUP_DIRECTORY_ENTRIES ||
    backupNames.length >
      MAX_RECOVERY_CANDIDATES + (allowRetentionOverflow ? 1 : 0)
  ) {
    throw new PublicRecoveryBackupError("recovery_backup_inventory_too_large");
  }
  const verified = [];
  const rejected = [];
  const backupIds = new Set();
  const backupIdentities = new Set();
  let duplicateDetected = false;
  for (const name of backupNames) {
    try {
      const candidate = validateRecoveryBackup({
          backupPath: path.join(backupDirectory, name),
          expectedApplicationScopeFingerprint: applicationScopeFingerprint,
          inspectDatabase,
        });
      if (
        backupIds.has(candidate.manifest.backup_id) ||
        backupIdentities.has(candidate.manifest.backup_identity)
      ) {
        throw new PublicRecoveryBackupError("recovery_backup_duplicate");
      }
      backupIds.add(candidate.manifest.backup_id);
      backupIdentities.add(candidate.manifest.backup_identity);
      verified.push(candidate);
    } catch (error) {
      if (error?.code === "recovery_backup_duplicate") {
        duplicateDetected = true;
      }
      rejected.push({
        backup_basename: name,
        reason: publicRecoveryErrorCode(error, "restore_validation_failed"),
      });
    }
  }
  if (duplicateDetected) {
    throw new PublicRecoveryBackupError("recovery_backup_duplicate");
  }
  verified.sort((left, right) => {
    const byTime = right.manifest.created_at.localeCompare(
      left.manifest.created_at,
    );
    return byTime ||
      right.manifest.backup_id.localeCompare(left.manifest.backup_id);
  });
  return { verified, rejected };
}

function enforceRecoveryBackupRetention({
  backupDirectory,
  applicationScopeFingerprint,
  inspectDatabase,
  newBackupId,
  protectedBackupIds,
}) {
  const inventory = listRecoveryBackups({
    backupDirectory,
    applicationScopeFingerprint,
    inspectDatabase,
    allowRetentionOverflow: true,
  });
  if (
    inventory.verified.length + inventory.rejected.length >
    MAX_RECOVERY_CANDIDATES
  ) {
    throw new PublicRecoveryBackupError("recovery_backup_retention_blocked");
  }
  if (inventory.verified.length <= MAX_RECOVERY_BACKUPS) return;
  const protectedIds = new Set([newBackupId, ...protectedBackupIds]);
  const operations = readRecoveryOperationResults(backupDirectory);
  if (operations.pending_action?.selected_backup_id) {
    protectedIds.add(operations.pending_action.selected_backup_id);
  }
  if (operations.events[0]?.protected_backup_id) {
    protectedIds.add(operations.events[0].protected_backup_id);
  }
  const removable = [...inventory.verified]
    .reverse()
    .find((backup) => !protectedIds.has(backup.manifest.backup_id));
  if (!removable) {
    throw new PublicRecoveryBackupError("recovery_backup_retention_blocked");
  }
  const stats = lstatSync(removable.backupPath, { bigint: true });
  if (
    !stats.isDirectory() ||
    stats.isSymbolicLink() ||
    stats.dev.toString() !== removable.backupDirectoryIdentity.dev ||
    stats.ino.toString() !== removable.backupDirectoryIdentity.ino
  ) {
    throw new PublicRecoveryBackupError("recovery_backup_changed");
  }
  rmSync(removable.backupPath, { recursive: true, force: false });
  fsyncDirectoryBestEffort(backupDirectory);
  const retained = listRecoveryBackups({
    backupDirectory,
    applicationScopeFingerprint,
    inspectDatabase,
  });
  if (
    retained.verified.length !== MAX_RECOVERY_BACKUPS ||
    !retained.verified.some(
      (backup) => backup.manifest.backup_id === newBackupId,
    )
  ) {
    throw new PublicRecoveryBackupError("recovery_backup_retention_failed");
  }
}

export function selectRecoveryBackup(inventory, backupId = "latest") {
  if (!inventory || !Array.isArray(inventory.verified)) {
    throw new PublicRecoveryBackupError("restore_validation_failed");
  }
  const selected =
    backupId === "latest"
      ? inventory.verified[0]
      : inventory.verified.find(
          (backup) => backup.manifest.backup_id === backupId,
        );
  if (!selected) {
    throw new PublicRecoveryBackupError("recovery_backup_not_found");
  }
  return selected;
}

export async function adoptLegacyRecoveryBackups({
  backupDirectory,
  applicationScopeFingerprint,
  inspectDatabase,
  inspectSourceDatabase = inspectDatabase,
  dependencies = {},
} = {}) {
  assertAbsolute(backupDirectory, "recovery_backup_directory_invalid");
  assertScopeFingerprint(applicationScopeFingerprint);
  if (
    typeof inspectDatabase !== "function" ||
    typeof inspectSourceDatabase !== "function"
  ) {
    throw new PublicRecoveryBackupError("recovery_verifier_unavailable");
  }
  if (!existsSync(backupDirectory)) {
    return { adopted: [], already_adopted: [], rejected: [] };
  }
  assertRestrictedDirectory(
    backupDirectory,
    "recovery_backup_directory_invalid",
  );
  const names = readdirSync(backupDirectory).sort();
  if (names.length > MAX_BACKUP_DIRECTORY_ENTRIES) {
    throw new PublicRecoveryBackupError("recovery_backup_inventory_too_large");
  }
  const legacyNames = names.filter((name) =>
    LEGACY_RECOVERY_BACKUP_NAME.test(name),
  );
  const adoptionState = readLegacyRecoveryAdoptionState({
    backupDirectory,
    applicationScopeFingerprint,
  });
  let adoptionStateChanged = false;
  for (const [legacyBasename, entry] of adoptionState.entries) {
    const legacyPath = path.join(backupDirectory, legacyBasename);
    if (existsSync(legacyPath)) continue;
    const backupPath = adoptedLegacyBackupPath(
      backupDirectory,
      legacyBasename,
      entry,
    );
    if (existsSync(backupPath)) continue;
    adoptionState.entries.delete(legacyBasename);
    adoptionStateChanged = true;
  }
  if (adoptionStateChanged) {
    writeLegacyRecoveryAdoptionState({
      backupDirectory,
      applicationScopeFingerprint,
      entries: adoptionState.entries,
    });
  }
  const result = { adopted: [], already_adopted: [], rejected: [] };
  const available = [];
  const adoptionNames = [
    ...new Set([...legacyNames, ...adoptionState.entries.keys()]),
  ].sort();
  for (const legacyBasename of adoptionNames) {
    const legacyPath = path.join(backupDirectory, legacyBasename);
    try {
      const recordedAdoption = adoptionState.entries.get(legacyBasename) ?? null;
      if (!existsSync(legacyPath)) {
        if (recordedAdoption === null) continue;
        const backupPath = adoptedLegacyBackupPath(
          backupDirectory,
          legacyBasename,
          recordedAdoption,
        );
        const existing = validateRecoveryBackup({
          backupPath,
          expectedApplicationScopeFingerprint: applicationScopeFingerprint,
          inspectDatabase,
          expectedBackupId: recordedAdoption.adopted_backup_id,
          expectedBackupIdentity:
            recordedAdoption.adopted_backup_identity,
        });
        available.push({
          classification: "already_adopted",
          backupPath,
          legacyPath,
          legacy_basename: legacyBasename,
          backup_id: existing.manifest.backup_id,
          source_payload: null,
          source_identity: null,
        });
        continue;
      }
      assertLegacyDatabaseHasNoSideFiles(legacyPath);
      let payloadIdentity = null;
      const payload = readStablePayloadEntry(
        legacyPath,
        RECOVERY_DATABASE_PAYLOAD,
        (identity) => {
          payloadIdentity = identity;
        },
      );
      if (payloadIdentity === null) {
        throw new PublicRecoveryBackupError("legacy_backup_changed");
      }
      if (payload.mode !== 0o600) {
        throw new PublicRecoveryBackupError("legacy_backup_unsafe");
      }
      normalizeDatabaseInspection(inspectSourceDatabase(legacyPath));
      const operationUuid = deterministicLegacyBackupUuid(
        legacyBasename,
        payload.sha256,
      );
      const createdAt = legacyBackupCreatedAt(legacyBasename);
      const backupBasename = recoveryBackupBasename(createdAt, operationUuid);
      const stagingBasename = `.augnes-recovery-incomplete-${operationUuid}`;
      const backupPath = path.join(backupDirectory, backupBasename);
      const expectedBackupId = `recovery:${operationUuid}`;
      if (
        recordedAdoption !== null &&
        legacyRecoveryAdoptionMatches({
          entry: recordedAdoption,
          legacyBasename,
          payload,
          expectedBackupId,
        })
      ) {
        if (!existsSync(backupPath)) {
          result.rejected.push({
            legacy_basename: legacyBasename,
            reason: "legacy_backup_retained_after_adoption",
          });
          continue;
        }
        const existing = validateRecoveryBackup({
          backupPath,
          expectedApplicationScopeFingerprint: applicationScopeFingerprint,
          inspectDatabase,
          expectedBackupId,
          expectedBackupIdentity: recordedAdoption.adopted_backup_identity,
        });
        available.push({
          classification: "already_adopted",
          backupPath,
          legacyPath,
          legacy_basename: legacyBasename,
          backup_id: existing.manifest.backup_id,
          source_payload: payload,
          source_identity: payloadIdentity,
        });
        continue;
      }
      if (existsSync(backupPath)) {
        const existing = validateRecoveryBackup({
          backupPath,
          expectedApplicationScopeFingerprint: applicationScopeFingerprint,
          inspectDatabase,
          expectedBackupId,
        });
        adoptionState.entries.set(
          legacyBasename,
          createLegacyRecoveryAdoptionEntry({
            legacyBasename,
            payload,
            manifest: existing.manifest,
          }),
        );
        writeLegacyRecoveryAdoptionState({
          backupDirectory,
          applicationScopeFingerprint,
          entries: adoptionState.entries,
        });
        available.push({
          classification: "already_adopted",
          backupPath,
          legacyPath,
          legacy_basename: legacyBasename,
          backup_id: existing.manifest.backup_id,
          source_payload: payload,
          source_identity: payloadIdentity,
        });
        continue;
      }
      const adopted = await createRecoveryBackup({
        databasePath: legacyPath,
        backupDirectory,
        applicationScopeFingerprint,
        sourceApplication: {
          application_version: null,
          build_identity: null,
          package_contract: null,
          package_contract_version: null,
          runtime_contract: null,
          runtime_schema_version: null,
        },
        reason: "manual_recovery",
        operationKind: "legacy_adoption",
        inspectDatabase,
        backupBasename,
        stagingBasename,
        operationUuid,
        expectedSourcePayload: payload,
        expectedSourceIdentity: payloadIdentity,
        now: () => new Date(createdAt),
        dependencies: {
          ...dependencies,
          prepareSnapshotDatabase: prepareLegacyRecoveryAdoptionSnapshot,
        },
      });
      adoptionState.entries.set(
        legacyBasename,
        createLegacyRecoveryAdoptionEntry({
          legacyBasename,
          payload,
          manifest: adopted.manifest,
        }),
      );
      writeLegacyRecoveryAdoptionState({
        backupDirectory,
        applicationScopeFingerprint,
        entries: adoptionState.entries,
      });
      available.push({
        classification: "adopted",
        backupPath,
        legacyPath,
        legacy_basename: legacyBasename,
        backup_id: adopted.manifest.backup_id,
        source_payload: payload,
        source_identity: payloadIdentity,
      });
    } catch (error) {
      result.rejected.push({
        legacy_basename: legacyBasename,
        reason: publicRecoveryErrorCode(error, "legacy_backup_invalid"),
      });
    }
  }
  for (const adoption of available) {
    const recordedAdoption =
      adoptionState.entries.get(adoption.legacy_basename) ?? null;
    try {
      if (recordedAdoption === null) {
        throw new PublicRecoveryBackupError(
          "legacy_backup_adoption_state_invalid",
        );
      }
      if (!existsSync(adoption.backupPath)) {
        throw new PublicRecoveryBackupError(
          "legacy_backup_retained_after_adoption",
        );
      }
      validateRecoveryBackup({
        backupPath: adoption.backupPath,
        expectedApplicationScopeFingerprint: applicationScopeFingerprint,
        inspectDatabase,
        expectedBackupId: adoption.backup_id,
        expectedBackupIdentity: recordedAdoption.adopted_backup_identity,
      });
    } catch (error) {
      result.rejected.push({
        legacy_basename: adoption.legacy_basename,
        reason: publicRecoveryErrorCode(error, "legacy_backup_invalid"),
      });
      continue;
    }
    if (
      adoption.source_payload !== null &&
      adoption.source_identity !== null
    ) {
      dependencies.afterLegacyAdoptionLedgerPersisted?.({
        legacyBasename: adoption.legacy_basename,
        backupId: adoption.backup_id,
      });
      try {
        removeVerifiedAdoptedLegacySource({
          backupDirectory,
          legacyPath: adoption.legacyPath,
          expectedPayload: adoption.source_payload,
          expectedIdentity: adoption.source_identity,
        });
      } catch (error) {
        result.rejected.push({
          legacy_basename: adoption.legacy_basename,
          reason: publicRecoveryErrorCode(error, "legacy_backup_invalid"),
        });
        continue;
      }
    }
    result[adoption.classification].push({
      legacy_basename: adoption.legacy_basename,
      backup_id: adoption.backup_id,
    });
  }
  return result;
}

function readLegacyRecoveryAdoptionState({
  backupDirectory,
  applicationScopeFingerprint,
}) {
  cleanupLegacyRecoveryAdoptionWriteResidue(backupDirectory);
  const filePath = path.join(
    backupDirectory,
    LEGACY_RECOVERY_ADOPTION_FILE,
  );
  try {
    const value = readStableJsonFile(filePath, {
      maximumBytes: MAX_LEGACY_RECOVERY_ADOPTION_BYTES,
    });
    return {
      entries: validateLegacyRecoveryAdoptionDocument(
        value,
        applicationScopeFingerprint,
      ),
    };
  } catch (error) {
    if (error?.code === "ENOENT") return { entries: new Map() };
    throw new PublicRecoveryBackupError(
      "legacy_backup_adoption_state_invalid",
      error,
    );
  }
}

function writeLegacyRecoveryAdoptionState({
  backupDirectory,
  applicationScopeFingerprint,
  entries,
}) {
  if (!(entries instanceof Map)) {
    throw new PublicRecoveryBackupError(
      "legacy_backup_adoption_state_invalid",
    );
  }
  const document = {
    contract: LEGACY_RECOVERY_ADOPTION_CONTRACT,
    schema_version: LEGACY_RECOVERY_ADOPTION_SCHEMA_VERSION,
    application_scope_fingerprint: applicationScopeFingerprint,
    entries: [...entries.values()].sort((left, right) =>
      left.legacy_basename.localeCompare(right.legacy_basename),
    ),
  };
  validateLegacyRecoveryAdoptionDocument(
    document,
    applicationScopeFingerprint,
  );
  const filePath = path.join(
    backupDirectory,
    LEGACY_RECOVERY_ADOPTION_FILE,
  );
  const temporaryPath = `${filePath}.write-${process.pid}-${randomUUID()}`;
  try {
    writeRestrictedJson(temporaryPath, document);
    renameSync(temporaryPath, filePath);
    setRestrictedMode(filePath, 0o600);
    fsyncDirectoryBestEffort(backupDirectory);
  } catch (error) {
    if (error instanceof PublicRecoveryBackupError) throw error;
    throw new PublicRecoveryBackupError(
      "legacy_backup_adoption_state_unavailable",
      error,
    );
  } finally {
    removeRegularFileIfPresent(temporaryPath);
  }
}

function validateLegacyRecoveryAdoptionDocument(
  value,
  applicationScopeFingerprint,
) {
  assertPlainRecord(value);
  assertExactKeys(value, [
    "application_scope_fingerprint",
    "contract",
    "entries",
    "schema_version",
  ]);
  if (
    value.contract !== LEGACY_RECOVERY_ADOPTION_CONTRACT ||
    value.schema_version !== LEGACY_RECOVERY_ADOPTION_SCHEMA_VERSION ||
    value.application_scope_fingerprint !== applicationScopeFingerprint ||
    !Array.isArray(value.entries) ||
    value.entries.length > MAX_BACKUP_DIRECTORY_ENTRIES
  ) {
    throw new PublicRecoveryBackupError(
      "legacy_backup_adoption_state_invalid",
    );
  }
  const entries = new Map();
  let priorBasename = null;
  for (const entry of value.entries) {
    assertPlainRecord(entry);
    assertExactKeys(entry, [
      "adopted_backup_id",
      "adopted_backup_identity",
      "legacy_basename",
      "source_mode",
      "source_sha256",
      "source_size",
    ]);
    if (
      typeof entry.legacy_basename !== "string" ||
      Buffer.byteLength(entry.legacy_basename, "utf8") > 255 ||
      !LEGACY_RECOVERY_BACKUP_NAME.test(entry.legacy_basename) ||
      !Number.isSafeInteger(entry.source_size) ||
      entry.source_size <= 0 ||
      entry.source_mode !== 0o600 ||
      !/^[a-f0-9]{64}$/u.test(entry.source_sha256 ?? "") ||
      !/^recovery:[0-9a-f-]{36}$/iu.test(entry.adopted_backup_id ?? "") ||
      !/^sha256:[a-f0-9]{64}$/u.test(
        entry.adopted_backup_identity ?? "",
      ) ||
      (priorBasename !== null &&
        priorBasename.localeCompare(entry.legacy_basename) >= 0)
    ) {
      throw new PublicRecoveryBackupError(
        "legacy_backup_adoption_state_invalid",
      );
    }
    priorBasename = entry.legacy_basename;
    entries.set(entry.legacy_basename, { ...entry });
  }
  return entries;
}

function createLegacyRecoveryAdoptionEntry({
  legacyBasename,
  payload,
  manifest,
}) {
  return {
    legacy_basename: legacyBasename,
    source_size: payload.size,
    source_mode: payload.mode,
    source_sha256: payload.sha256,
    adopted_backup_id: manifest.backup_id,
    adopted_backup_identity: manifest.backup_identity,
  };
}

function legacyRecoveryAdoptionMatches({
  entry,
  legacyBasename,
  payload,
  expectedBackupId,
}) {
  return (
    entry.legacy_basename === legacyBasename &&
    entry.source_size === payload.size &&
    entry.source_mode === payload.mode &&
    entry.source_sha256 === payload.sha256 &&
    entry.adopted_backup_id === expectedBackupId
  );
}

function cleanupLegacyRecoveryAdoptionWriteResidue(backupDirectory) {
  let removed = false;
  for (const basename of readdirSync(backupDirectory)) {
    const match = LEGACY_RECOVERY_ADOPTION_WRITE_NAME.exec(basename);
    if (!match) continue;
    const writerPid = Number(match[1]);
    if (!Number.isSafeInteger(writerPid) || writerPid <= 0) {
      throw new PublicRecoveryBackupError(
        "legacy_backup_adoption_state_invalid",
      );
    }
    const temporaryPath = path.join(backupDirectory, basename);
    const stats = lstatSync(temporaryPath);
    if (
      !stats.isFile() ||
      stats.isSymbolicLink() ||
      hasUnsafeMode(stats.mode) ||
      writerPid === process.pid ||
      processIsAlive(writerPid)
    ) {
      throw new PublicRecoveryBackupError(
        "legacy_backup_adoption_state_unavailable",
      );
    }
    unlinkSync(temporaryPath);
    removed = true;
  }
  if (removed) fsyncDirectoryBestEffort(backupDirectory);
}

export async function stageRecoveryBackupDatabase({
  selectedBackup,
  targetPath,
  inspectDatabase,
  migrateDatabase,
  requireCurrent = true,
  dependencies = {},
} = {}) {
  if (!selectedBackup?.payloadPath) {
    throw new PublicRecoveryBackupError("restore_validation_failed");
  }
  if (selectedBackup.manifest?.database?.recovery_eligible !== true) {
    throw new PublicRecoveryBackupError("restore_database_incompatible");
  }
  assertAbsolute(targetPath, "restore_stage_invalid");
  if (existsSync(targetPath)) {
    throw new PublicRecoveryBackupError("restore_stage_conflict");
  }
  let stagedIdentity = null;
  try {
    assertSelectedBackupIdentityUnchanged(selectedBackup);
    dependencies.beforePayloadCopy?.({
      sourcePath: selectedBackup.payloadPath,
      targetPath,
    });
    assertSelectedBackupIdentityUnchanged(selectedBackup);
    stagedIdentity = copyVerifiedRecoveryPayload({
      sourcePath: selectedBackup.payloadPath,
      targetPath,
      expectedSha256: selectedBackup.manifest.payloads[0].sha256,
      afterTargetCreated: dependencies.afterTargetCreated,
    });
    assertSelectedBackupIdentityUnchanged(selectedBackup);
    let inspection = normalizeDatabaseInspection(inspectDatabase(targetPath));
    if (inspection.schema_classification === "old") {
      if (typeof migrateDatabase !== "function") {
        throw new PublicRecoveryBackupError("restore_database_incompatible");
      }
      let database;
      try {
        database = new Database(targetPath, { fileMustExist: true });
        database.pragma("journal_mode = DELETE");
        database.pragma("foreign_keys = ON");
        try {
          migrateDatabase(database);
        } catch (error) {
          if (error instanceof PublicRecoveryBackupError) throw error;
          throw new PublicRecoveryBackupError(
            "restore_migration_failed",
            error,
          );
        }
      } finally {
        database?.close();
      }
      makeDatabaseStandalone(targetPath);
      try {
        inspection = normalizeDatabaseInspection(inspectDatabase(targetPath));
      } catch (error) {
        throw new PublicRecoveryBackupError(
          "post_migration_verification_failed",
          error,
        );
      }
    }
    if (requireCurrent && inspection.schema_classification !== "current") {
      throw new PublicRecoveryBackupError("restore_database_incompatible");
    }
    return inspection;
  } catch (error) {
    removeExactRegularFile(targetPath, stagedIdentity);
    removeSqliteSideFiles(targetPath);
    if (error instanceof PublicRecoveryBackupError) throw error;
    throw new PublicRecoveryBackupError("restore_stage_failed", error);
  }
}

function assertSelectedBackupIdentityUnchanged(selectedBackup) {
  if (
    !validDirectoryIdentity(selectedBackup.backupDirectoryIdentity) ||
    !validDirectoryIdentity(selectedBackup.stateDirectoryIdentity) ||
    !validDirectoryIdentity(selectedBackup.manifestFileIdentity) ||
    !validDirectoryIdentity(selectedBackup.payloadFileIdentity)
  ) {
    throw new PublicRecoveryBackupError("restore_backup_changed");
  }
  const expected = [
    [selectedBackup.backupPath, selectedBackup.backupDirectoryIdentity, "dir"],
    [
      path.join(selectedBackup.backupPath, "state"),
      selectedBackup.stateDirectoryIdentity,
      "dir",
    ],
    [
      path.join(selectedBackup.backupPath, RECOVERY_MANIFEST_FILE),
      selectedBackup.manifestFileIdentity,
      "file",
    ],
    [selectedBackup.payloadPath, selectedBackup.payloadFileIdentity, "file"],
  ];
  try {
    for (const [candidate, identity, kind] of expected) {
      const stats = lstatSync(candidate, { bigint: true });
      if (
        stats.isSymbolicLink() ||
        (kind === "dir" ? !stats.isDirectory() : !stats.isFile()) ||
        stats.dev.toString() !== identity.dev ||
        stats.ino.toString() !== identity.ino
      ) {
        throw new PublicRecoveryBackupError("restore_backup_changed");
      }
    }
  } catch (error) {
    if (error instanceof PublicRecoveryBackupError) throw error;
    throw new PublicRecoveryBackupError("restore_backup_changed", error);
  }
}

export function recoveryBackupBasename(createdAt, operationUuid) {
  const date = new Date(createdAt);
  if (!Number.isFinite(date.getTime()) || !RECOVERY_OPERATION_UUID.test(operationUuid)) {
    throw new PublicRecoveryBackupError("recovery_backup_name_invalid");
  }
  const stamp = date
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .slice(0, 15);
  return `augnes-recovery-${stamp}-${operationUuid.replaceAll("-", "").slice(0, 8).toLowerCase()}.backup`;
}

export function removeIncompleteRecoveryBackup(stagingPath, expectedIdentity = null) {
  if (!stagingPath || !path.isAbsolute(stagingPath)) return;
  if (!RECOVERY_STAGING_NAME.test(path.basename(stagingPath))) return;
  try {
    const stats = lstatSync(stagingPath, { bigint: true });
    if (
      !stats.isDirectory() ||
      stats.isSymbolicLink() ||
      (expectedIdentity !== null &&
        (stats.dev.toString() !== expectedIdentity.dev.toString() ||
          stats.ino.toString() !== expectedIdentity.ino.toString()))
    ) {
      return;
    }
    rmSync(stagingPath, { recursive: true, force: true });
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

export function removeEmptyIncompleteRecoveryBackup(stagingPath) {
  if (!stagingPath || !path.isAbsolute(stagingPath)) return false;
  if (!RECOVERY_STAGING_NAME.test(path.basename(stagingPath))) return false;
  try {
    const stats = lstatSync(stagingPath);
    if (
      !stats.isDirectory() ||
      stats.isSymbolicLink() ||
      hasUnsafeMode(stats.mode) ||
      readdirSync(stagingPath).length !== 0
    ) {
      return false;
    }
    rmdirSync(stagingPath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT" || error?.code === "ENOTEMPTY") return false;
    throw error;
  }
}

function removeCreatedRecoveryBackup(backupPath, expectedIdentity) {
  try {
    const stats = lstatSync(backupPath, { bigint: true });
    if (
      stats.isDirectory() &&
      !stats.isSymbolicLink() &&
      stats.dev === expectedIdentity.dev &&
      stats.ino === expectedIdentity.ino
    ) {
      rmSync(backupPath, { recursive: true, force: true });
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

export function readRecoveryOperationResults(
  backupDirectory,
  dependencies = {},
) {
  assertAbsolute(backupDirectory, "recovery_backup_directory_invalid");
  cleanupRecoveryOperationWriteResidue(backupDirectory);
  const filePath = path.join(backupDirectory, RECOVERY_OPERATION_FILE);
  try {
    const value = readStableJsonFile(filePath, {
      maximumBytes: MAX_OPERATION_BYTES,
      afterDescriptorOpened: dependencies.afterDescriptorOpened,
    });
    validateOperationDocument(value);
    return value;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return {
        contract: RECOVERY_OPERATION_CONTRACT,
        schema_version: RECOVERY_OPERATION_SCHEMA_VERSION,
        installed_package: null,
        pending_package: null,
        pending_update_source: null,
        pending_action: null,
        completed_action: null,
        events: [],
      };
    }
    throw new PublicRecoveryBackupError("recovery_result_unavailable");
  }
}

export function writeRecoveryOperationResult({ backupDirectory, event } = {}) {
  assertAbsolute(backupDirectory, "recovery_backup_directory_invalid");
  ensureRestrictedDirectory(backupDirectory);
  const normalized = normalizeOperationEvent(event);
  const current = readRecoveryOperationResults(backupDirectory);
  const next = {
    contract: RECOVERY_OPERATION_CONTRACT,
    schema_version: RECOVERY_OPERATION_SCHEMA_VERSION,
    installed_package: current.installed_package,
    pending_package: current.pending_package,
    pending_update_source: current.pending_update_source,
    pending_action: current.pending_action,
    completed_action: current.completed_action,
    events: [normalized, ...current.events]
      .slice(0, MAX_OPERATION_EVENTS),
  };
  writeRecoveryOperationDocument(backupDirectory, next);
  return normalized;
}

export function readInstalledPackageIdentity(backupDirectory) {
  return readRecoveryOperationResults(backupDirectory).installed_package;
}

export function readPendingPackageIdentity(backupDirectory) {
  return readRecoveryOperationResults(backupDirectory).pending_package;
}

export function writePendingPackageIdentity({
  backupDirectory,
  identity,
  sourceIdentity,
} = {}) {
  assertAbsolute(backupDirectory, "recovery_backup_directory_invalid");
  ensureRestrictedDirectory(backupDirectory);
  const pendingPackage = normalizeInstalledPackageIdentity(identity);
  const current = readRecoveryOperationResults(backupDirectory);
  const pendingUpdateSource =
    sourceIdentity !== undefined
      ? sourceIdentity === null
        ? null
        : normalizeSourceApplication(sourceIdentity)
      : current.pending_package?.build_identity === pendingPackage.build_identity
        ? current.pending_update_source
        : null;
  writeRecoveryOperationDocument(backupDirectory, {
    contract: RECOVERY_OPERATION_CONTRACT,
    schema_version: RECOVERY_OPERATION_SCHEMA_VERSION,
    installed_package: current.installed_package,
    pending_package: pendingPackage,
    pending_update_source: pendingUpdateSource,
    pending_action: current.pending_action,
    completed_action: current.completed_action,
    events: current.events,
  });
  return pendingPackage;
}

export function clearPendingPackageIdentity({ backupDirectory } = {}) {
  assertAbsolute(backupDirectory, "recovery_backup_directory_invalid");
  ensureRestrictedDirectory(backupDirectory);
  const current = readRecoveryOperationResults(backupDirectory);
  if (current.pending_package === null) return false;
  writeRecoveryOperationDocument(backupDirectory, {
    contract: RECOVERY_OPERATION_CONTRACT,
    schema_version: RECOVERY_OPERATION_SCHEMA_VERSION,
    installed_package: current.installed_package,
    pending_package: null,
    pending_update_source: null,
    pending_action: current.pending_action,
    completed_action: current.completed_action,
    events: current.events,
  });
  return true;
}

export function writeInstalledPackageIdentity({
  backupDirectory,
  identity,
} = {}) {
  assertAbsolute(backupDirectory, "recovery_backup_directory_invalid");
  ensureRestrictedDirectory(backupDirectory);
  const installedPackage = normalizeInstalledPackageIdentity(identity);
  const current = readRecoveryOperationResults(backupDirectory);
  writeRecoveryOperationDocument(backupDirectory, {
    contract: RECOVERY_OPERATION_CONTRACT,
    schema_version: RECOVERY_OPERATION_SCHEMA_VERSION,
    installed_package: installedPackage,
    pending_package: null,
    pending_update_source: null,
    pending_action: current.pending_action,
    completed_action: current.completed_action,
    events: current.events,
  });
  return installedPackage;
}

export function completePendingPackageUpdate({
  backupDirectory,
  expectedBuildIdentity,
  event,
} = {}) {
  assertAbsolute(backupDirectory, "recovery_backup_directory_invalid");
  ensureRestrictedDirectory(backupDirectory);
  if (!/^sha256:[a-f0-9]{64}$/u.test(expectedBuildIdentity ?? "")) {
    throw new PublicRecoveryBackupError("recovery_package_identity_changed");
  }
  const normalized = normalizeOperationEvent(event);
  const current = readRecoveryOperationResults(backupDirectory);
  if (
    current.pending_package === null ||
    current.pending_package.build_identity !== expectedBuildIdentity
  ) {
    throw new PublicRecoveryBackupError("recovery_package_identity_changed");
  }
  writeRecoveryOperationDocument(backupDirectory, {
    contract: RECOVERY_OPERATION_CONTRACT,
    schema_version: RECOVERY_OPERATION_SCHEMA_VERSION,
    installed_package: current.pending_package,
    pending_package: null,
    pending_update_source: null,
    pending_action: current.pending_action,
    completed_action: current.completed_action,
    events: [normalized, ...current.events].slice(0, MAX_OPERATION_EVENTS),
  });
  return normalized;
}

export function writePendingRecoveryAction({
  backupDirectory,
  action,
} = {}) {
  assertAbsolute(backupDirectory, "recovery_backup_directory_invalid");
  ensureRestrictedDirectory(backupDirectory);
  const pendingAction = normalizePendingRecoveryAction(action);
  const current = readRecoveryOperationResults(backupDirectory);
  if (
    current.pending_action !== null ||
    current.completed_action?.action_id === pendingAction.action_id
  ) {
    throw new PublicRecoveryBackupError("recovery_action_in_progress");
  }
  writeRecoveryOperationDocument(backupDirectory, {
    contract: RECOVERY_OPERATION_CONTRACT,
    schema_version: RECOVERY_OPERATION_SCHEMA_VERSION,
    installed_package: current.installed_package,
    pending_package: current.pending_package,
    pending_update_source: current.pending_update_source,
    pending_action: pendingAction,
    completed_action: current.completed_action,
    events: current.events,
  });
  return pendingAction;
}

export function clearPendingRecoveryAction({
  backupDirectory,
  expectedActionId = null,
} = {}) {
  assertAbsolute(backupDirectory, "recovery_backup_directory_invalid");
  ensureRestrictedDirectory(backupDirectory);
  const current = readRecoveryOperationResults(backupDirectory);
  if (current.pending_action === null) return false;
  if (
    expectedActionId !== null &&
    current.pending_action.action_id !== expectedActionId
  ) {
    throw new PublicRecoveryBackupError("recovery_action_changed");
  }
  writeRecoveryOperationDocument(backupDirectory, {
    contract: RECOVERY_OPERATION_CONTRACT,
    schema_version: RECOVERY_OPERATION_SCHEMA_VERSION,
    installed_package: current.installed_package,
    pending_package: current.pending_package,
    pending_update_source: current.pending_update_source,
    pending_action: null,
    completed_action: current.completed_action,
    events: current.events,
  });
  return true;
}

export function completePendingRecoveryAction({
  backupDirectory,
  expectedActionId,
  event,
} = {}) {
  assertAbsolute(backupDirectory, "recovery_backup_directory_invalid");
  ensureRestrictedDirectory(backupDirectory);
  const current = readRecoveryOperationResults(backupDirectory);
  if (current.completed_action?.action_id === expectedActionId) {
    return current.completed_action.event;
  }
  if (
    current.pending_action === null ||
    current.pending_action.action_id !== expectedActionId
  ) {
    throw new PublicRecoveryBackupError("recovery_action_changed");
  }
  const normalized = normalizeOperationEvent(event);
  writeRecoveryOperationDocument(backupDirectory, {
    contract: RECOVERY_OPERATION_CONTRACT,
    schema_version: RECOVERY_OPERATION_SCHEMA_VERSION,
    installed_package: current.installed_package,
    pending_package: current.pending_package,
    pending_update_source: current.pending_update_source,
    pending_action: null,
    completed_action: {
      action_id: expectedActionId,
      event: normalized,
    },
    events: [normalized, ...current.events].slice(0, MAX_OPERATION_EVENTS),
  });
  return normalized;
}

function writeRecoveryOperationDocument(backupDirectory, value) {
  const filePath = path.join(backupDirectory, RECOVERY_OPERATION_FILE);
  const temporaryPath = `${filePath}.write-${process.pid}-${randomUUID()}`;
  try {
    writeRestrictedJson(temporaryPath, value);
    renameSync(temporaryPath, filePath);
    setRestrictedMode(filePath, 0o600);
    fsyncDirectoryBestEffort(backupDirectory);
  } finally {
    removeRegularFileIfPresent(temporaryPath);
  }
}

function cleanupRecoveryOperationWriteResidue(backupDirectory) {
  if (!existsSync(backupDirectory)) return;
  assertRestrictedDirectory(
    backupDirectory,
    "recovery_backup_directory_invalid",
  );
  let removed = false;
  for (const basename of readdirSync(backupDirectory)) {
    const match = RECOVERY_OPERATION_WRITE_NAME.exec(basename);
    if (!match) continue;
    const writerPid = Number(match[1]);
    if (!Number.isSafeInteger(writerPid) || writerPid <= 0) {
      throw new PublicRecoveryBackupError("recovery_result_unavailable");
    }
    const temporaryPath = path.join(backupDirectory, basename);
    const stats = lstatSync(temporaryPath);
    if (
      !stats.isFile() ||
      stats.isSymbolicLink() ||
      hasUnsafeMode(stats.mode) ||
      writerPid === process.pid ||
      processIsAlive(writerPid)
    ) {
      throw new PublicRecoveryBackupError("recovery_result_unavailable");
    }
    unlinkSync(temporaryPath);
    removed = true;
  }
  if (removed) fsyncDirectoryBestEffort(backupDirectory);
}

function processIsAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code !== "ESRCH";
  }
}

function validateRecoveryManifestShape(
  manifest,
  {
    expectedApplicationScopeFingerprint,
    expectedBackupId,
    expectedBackupIdentity,
    allowIneligible,
  },
) {
  assertPlainRecord(manifest);
  assertExactKeys(manifest, [
    "application_scope_fingerprint",
    "backup_id",
    "backup_identity",
    "contract",
    "contract_version",
    "created_at",
    "database",
    "payloads",
    "portable",
    "private_material",
    "reason",
    "source_application",
  ]);
  if (
    manifest.contract !== RECOVERY_BACKUP_CONTRACT ||
    manifest.contract_version !== RECOVERY_BACKUP_CONTRACT_VERSION ||
    manifest.portable !== false ||
    !/^recovery:[0-9a-f-]{36}$/i.test(manifest.backup_id ?? "") ||
    manifest.application_scope_fingerprint !==
      expectedApplicationScopeFingerprint ||
    !validIsoTimestamp(manifest.created_at) ||
    !/^sha256:[a-f0-9]{64}$/u.test(manifest.backup_identity ?? "") ||
    (expectedBackupId !== null && manifest.backup_id !== expectedBackupId) ||
    (expectedBackupIdentity !== null &&
      manifest.backup_identity !== expectedBackupIdentity)
  ) {
    throw new PublicRecoveryBackupError("restore_validation_failed");
  }
  assertBackupReason(manifest.reason);
  assertSourceApplication(manifest.source_application);
  normalizeRecoveryPrivateMaterialManifest(manifest.private_material);
  const database = normalizeDatabaseInspection(manifest.database);
  assertRecoveryEligibility(database, allowIneligible, "restore_database_incompatible");
  if (!database.recovery_eligible && manifest.reason !== "pre_restore_safety") {
    throw new PublicRecoveryBackupError("restore_database_contract_mismatch");
  }
  if (
    !Array.isArray(manifest.payloads) ||
    manifest.payloads.length !== 1 ||
    manifest.payloads[0]?.path !== RECOVERY_DATABASE_PAYLOAD
  ) {
    throw new PublicRecoveryBackupError("restore_validation_failed");
  }
  validatePayloadEntry(manifest.payloads[0]);
  const { backup_identity: ignored, ...withoutIdentity } = manifest;
  void ignored;
  if (recoveryManifestIdentity(withoutIdentity) !== manifest.backup_identity) {
    throw new PublicRecoveryBackupError("restore_manifest_tampered");
  }
}

function normalizeRecoveryPrivateMaterialManifest(value) {
  const expected = recoveryPrivateMaterialManifestContract();
  assertPlainRecord(value);
  assertExactKeys(value, [
    "contract",
    "contract_version",
    "legacy_observe_reason",
    "legacy_observe_source_agent_id",
    "legacy_observe_state_keys",
    "normalization_marker",
    "normalized_fields",
    "raw_private_material_persisted",
  ]);
  if (
    value.contract !== expected.contract ||
    value.contract_version !== expected.contract_version ||
    value.legacy_observe_reason !== expected.legacy_observe_reason ||
    value.legacy_observe_source_agent_id !==
      expected.legacy_observe_source_agent_id ||
    JSON.stringify(value.legacy_observe_state_keys) !==
      JSON.stringify(expected.legacy_observe_state_keys) ||
    value.normalization_marker !== expected.normalization_marker ||
    value.raw_private_material_persisted !== false ||
    JSON.stringify(value.normalized_fields) !==
      JSON.stringify(expected.normalized_fields)
  ) {
    throw new PublicRecoveryBackupError("restore_database_contract_mismatch");
  }
  return expected;
}

function normalizeDatabaseInspection(value) {
  assertPlainRecord(value);
  assertExactKeys(value, [
    "canonical_record_count",
    "migration_contract",
    "migration_contract_version",
    "migration_ids",
    "recovery_eligible",
    "record_contract",
    "record_contract_version",
    "reader_contracts",
    "schema_classification",
    "schema_contract",
    "schema_signature",
  ]);
  if (
    !validContract(value.schema_contract) ||
    !/^[a-f0-9]{64}$/u.test(value.schema_signature ?? "") ||
    !["current", "old", "incompatible"].includes(value.schema_classification) ||
    !validContract(value.migration_contract) ||
    !Number.isInteger(value.migration_contract_version) ||
    value.migration_contract_version < 1 ||
    !Array.isArray(value.migration_ids) ||
    value.migration_ids.length > 256 ||
    !value.migration_ids.every(validMigrationId) ||
    new Set(value.migration_ids).size !== value.migration_ids.length ||
    !validContract(value.record_contract) ||
    !Number.isInteger(value.record_contract_version) ||
    value.record_contract_version < 1 ||
    typeof value.recovery_eligible !== "boolean" ||
    !Array.isArray(value.reader_contracts) ||
    !value.reader_contracts.every(validContract) ||
    new Set(value.reader_contracts).size !== value.reader_contracts.length ||
    !Number.isSafeInteger(value.canonical_record_count) ||
    value.canonical_record_count < 0
  ) {
    throw new PublicRecoveryBackupError("restore_database_contract_mismatch");
  }
  if (
    (value.recovery_eligible &&
      (!["current", "old"].includes(value.schema_classification) ||
        value.reader_contracts.length !== 3)) ||
    (!value.recovery_eligible &&
      (value.schema_classification !== "incompatible" ||
        value.migration_ids.length === 0 ||
        value.reader_contracts.length !== 3))
  ) {
    throw new PublicRecoveryBackupError("restore_database_contract_mismatch");
  }
  return {
    schema_contract: value.schema_contract,
    schema_signature: value.schema_signature,
    schema_classification: value.schema_classification,
    migration_contract: value.migration_contract,
    migration_contract_version: value.migration_contract_version,
    migration_ids: [...value.migration_ids],
    recovery_eligible: value.recovery_eligible,
    record_contract: value.record_contract,
    record_contract_version: value.record_contract_version,
    reader_contracts: [...value.reader_contracts],
    canonical_record_count: value.canonical_record_count,
  };
}

function assertRecoveryEligibility(database, allowIneligible, code) {
  if (database.recovery_eligible !== true && allowIneligible !== true) {
    throw new PublicRecoveryBackupError(code);
  }
}

function normalizeSourceApplication(value) {
  assertSourceApplication(value);
  return {
    application_version: value.application_version,
    build_identity: value.build_identity ?? null,
    package_contract: value.package_contract ?? null,
    package_contract_version: value.package_contract_version ?? null,
    runtime_contract: value.runtime_contract,
    runtime_schema_version: value.runtime_schema_version,
  };
}

function assertSourceApplication(value) {
  assertPlainRecord(value);
  assertExactKeys(value, [
    "application_version",
    "build_identity",
    "package_contract",
    "package_contract_version",
    "runtime_contract",
    "runtime_schema_version",
  ]);
  if (
    !(
      value.application_version === null ||
      validPublicApplicationVersion(value.application_version)
    ) ||
    !(
      value.build_identity === null ||
      /^sha256:[a-f0-9]{64}$/u.test(value.build_identity ?? "")
    ) ||
    !(
      value.package_contract === null || validContract(value.package_contract)
    ) ||
    !(
      value.package_contract_version === null ||
      (Number.isInteger(value.package_contract_version) &&
        value.package_contract_version > 0)
    ) ||
    !(value.runtime_contract === null || validContract(value.runtime_contract)) ||
    !(
      value.runtime_schema_version === null ||
      (Number.isInteger(value.runtime_schema_version) &&
        value.runtime_schema_version > 0)
    )
  ) {
    throw new PublicRecoveryBackupError("recovery_source_contract_invalid");
  }
}

function readManifest(filePath, onStableIdentity = null) {
  try {
    return readStableJsonFile(filePath, {
      maximumBytes: MAX_MANIFEST_BYTES,
      afterDescriptorOpened: onStableIdentity,
    });
  } catch (error) {
    if (error instanceof PublicRecoveryBackupError) throw error;
    throw new PublicRecoveryBackupError("restore_manifest_invalid");
  }
}

function readStableJsonFile(
  filePath,
  { maximumBytes, afterDescriptorOpened = null },
) {
  let descriptor = null;
  try {
    descriptor = openSync(filePath, "r");
    const beforePath = lstatSync(filePath, { bigint: true });
    const beforeDescriptor = fstatSync(descriptor, { bigint: true });
    if (
      !beforePath.isFile() ||
      beforePath.isSymbolicLink() ||
      beforePath.dev !== beforeDescriptor.dev ||
      beforePath.ino !== beforeDescriptor.ino ||
      beforeDescriptor.size <= 0n ||
      beforeDescriptor.size > BigInt(maximumBytes) ||
      hasUnsafeMode(beforePath.mode)
    ) {
      throw new Error("invalid JSON file");
    }
    afterDescriptorOpened?.({
      dev: beforeDescriptor.dev.toString(),
      ino: beforeDescriptor.ino.toString(),
    });
    const bytes = Buffer.alloc(Number(beforeDescriptor.size));
    let offset = 0;
    while (offset < bytes.length) {
      const read = readSync(
        descriptor,
        bytes,
        offset,
        bytes.length - offset,
        offset,
      );
      if (read === 0) throw new Error("JSON file changed");
      offset += read;
    }
    const afterDescriptor = fstatSync(descriptor, { bigint: true });
    const afterPath = lstatSync(filePath, { bigint: true });
    if (
      beforeDescriptor.dev !== afterDescriptor.dev ||
      beforeDescriptor.ino !== afterDescriptor.ino ||
      beforeDescriptor.size !== afterDescriptor.size ||
      beforeDescriptor.mtimeNs !== afterDescriptor.mtimeNs ||
      afterDescriptor.dev !== afterPath.dev ||
      afterDescriptor.ino !== afterPath.ino ||
      afterDescriptor.size !== afterPath.size ||
      afterDescriptor.mtimeNs !== afterPath.mtimeNs
    ) {
      throw new Error("JSON file changed");
    }
    return JSON.parse(bytes.toString("utf8"));
  } finally {
    if (descriptor !== null) closeSync(descriptor);
  }
}

function publicBackupSummary(manifest) {
  return {
    backup_id: manifest.backup_id,
    label: `${manifest.reason.replaceAll("_", " ")} · ${manifest.created_at}`,
    created_at: manifest.created_at,
    reason: manifest.reason,
    source_application_version:
      manifest.source_application.application_version ?? "unknown",
    verified: manifest.database.recovery_eligible === true,
    recovery_eligible: manifest.database.recovery_eligible === true,
  };
}

function copyVerifiedRecoveryPayload({
  sourcePath,
  targetPath,
  expectedSha256,
  afterTargetCreated = null,
}) {
  assertRegularFile(sourcePath, "restore_payload_invalid");
  if (!/^[a-f0-9]{64}$/u.test(expectedSha256 ?? "")) {
    throw new PublicRecoveryBackupError("restore_payload_invalid");
  }
  let sourceDescriptor = null;
  let targetDescriptor = null;
  let targetIdentity = null;
  try {
    sourceDescriptor = openSync(sourcePath, "r");
    const beforePath = lstatSync(sourcePath, { bigint: true });
    const beforeSource = fstatSync(sourceDescriptor, { bigint: true });
    if (
      !beforePath.isFile() ||
      beforePath.isSymbolicLink() ||
      hasUnsafeMode(beforePath.mode) ||
      beforePath.dev !== beforeSource.dev ||
      beforePath.ino !== beforeSource.ino ||
      beforeSource.size <= 0n ||
      beforeSource.size > BigInt(Number.MAX_SAFE_INTEGER)
    ) {
      throw new PublicRecoveryBackupError("restore_payload_invalid");
    }
    targetDescriptor = openSync(targetPath, "wx", 0o600);
    const createdTarget = fstatSync(targetDescriptor, { bigint: true });
    targetIdentity = { dev: createdTarget.dev, ino: createdTarget.ino };
    afterTargetCreated?.({
      dev: createdTarget.dev.toString(),
      ino: createdTarget.ino.toString(),
    });
    const hash = createHash("sha256");
    let position = 0;
    while (true) {
      const count = readSync(
        sourceDescriptor,
        HASH_BUFFER,
        0,
        HASH_BUFFER.length,
        position,
      );
      if (count === 0) break;
      hash.update(HASH_BUFFER.subarray(0, count));
      let written = 0;
      while (written < count) {
        written += writeSync(
          targetDescriptor,
          HASH_BUFFER,
          written,
          count - written,
          position + written,
        );
      }
      position += count;
    }
    fsyncSync(targetDescriptor);
    const afterSource = fstatSync(sourceDescriptor, { bigint: true });
    const afterPath = lstatSync(sourcePath, { bigint: true });
    if (
      hash.digest("hex") !== expectedSha256 ||
      beforeSource.dev !== afterSource.dev ||
      beforeSource.ino !== afterSource.ino ||
      beforeSource.size !== afterSource.size ||
      beforeSource.mtimeNs !== afterSource.mtimeNs ||
      afterSource.dev !== afterPath.dev ||
      afterSource.ino !== afterPath.ino ||
      afterSource.size !== afterPath.size ||
      afterSource.mtimeNs !== afterPath.mtimeNs
    ) {
      throw new PublicRecoveryBackupError("restore_payload_changed");
    }
  } catch (error) {
    removeExactRegularFile(targetPath, targetIdentity);
    if (error instanceof PublicRecoveryBackupError) throw error;
    throw new PublicRecoveryBackupError("restore_stage_failed", error);
  } finally {
    if (targetDescriptor !== null) closeSync(targetDescriptor);
    if (sourceDescriptor !== null) closeSync(sourceDescriptor);
  }
  setRestrictedMode(targetPath, 0o600);
  const publishedTarget = lstatSync(targetPath, { bigint: true });
  if (
    targetIdentity === null ||
    !publishedTarget.isFile() ||
    publishedTarget.isSymbolicLink() ||
    publishedTarget.dev !== targetIdentity.dev ||
    publishedTarget.ino !== targetIdentity.ino
  ) {
    throw new PublicRecoveryBackupError("restore_stage_changed");
  }
  return targetIdentity;
}

async function snapshotSqliteDatabase({
  sourcePath,
  targetPath,
  backupDatabase,
}) {
  assertRegularFile(sourcePath, "recovery_source_invalid");
  const sourceIdentity = lstatSync(sourcePath, { bigint: true });
  const descriptor = openSync(targetPath, "wx", 0o600);
  closeSync(descriptor);
  try {
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
    const sourceAfter = lstatSync(sourcePath, { bigint: true });
    if (
      !sourceAfter.isFile() ||
      sourceAfter.isSymbolicLink() ||
      sourceIdentity.dev !== sourceAfter.dev ||
      sourceIdentity.ino !== sourceAfter.ino
    ) {
      throw new PublicRecoveryBackupError("recovery_source_changed");
    }
    makeDatabaseStandalone(targetPath);
    setRestrictedMode(targetPath, 0o600);
  } catch (error) {
    removeRegularFileIfPresent(targetPath);
    removeSqliteSideFiles(targetPath);
    throw error;
  }
}

function normalizeRecoverySnapshotPrivateMaterial(databasePath) {
  let database;
  try {
    database = new Database(databasePath, { fileMustExist: true });
    database.pragma("journal_mode = DELETE");
    database.pragma("secure_delete = ON");
    normalizeRecoveryPrivateMaterial(database);
    // Always rebuild the snapshot. A logically current source can still carry
    // old raw text in freelist or unallocated pages from an earlier migration.
    database.exec("VACUUM");
    database.pragma("journal_mode = DELETE");
  } finally {
    database?.close();
  }
  removeSqliteSideFiles(databasePath);
  setRestrictedMode(databasePath, 0o600);
}

function prepareLegacyRecoveryAdoptionSnapshot({ databasePath }) {
  let database;
  try {
    database = new Database(databasePath, { fileMustExist: true });
    database.pragma("journal_mode = DELETE");
    database.pragma("foreign_keys = ON");
    database.pragma("secure_delete = ON");
    database.transaction(() => {
      applyCanonicalDatabaseMigrations(database);
    })();
    database.exec("VACUUM");
    database.pragma("journal_mode = DELETE");
  } finally {
    database?.close();
  }
  removeSqliteSideFiles(databasePath);
  setRestrictedMode(databasePath, 0o600);
}

function assertRecoveryPrivateMaterialPayload(databasePath, code) {
  let database;
  try {
    database = new Database(databasePath, {
      readonly: true,
      fileMustExist: true,
    });
    assertCanonicalRecoverySqliteImage(database);
    if (!inspectRecoveryPrivateMaterialBoundary(database).current) {
      throw new PublicRecoveryBackupError(code);
    }
  } catch (error) {
    if (error instanceof PublicRecoveryBackupError) throw error;
    throw new PublicRecoveryBackupError(code, error);
  } finally {
    database?.close();
  }
}

function assertCanonicalRecoverySqliteImage(database) {
  if (Number(database.pragma("freelist_count", { simple: true })) !== 0) {
    throw new Error("recovery_sqlite_freelist_not_compact");
  }
  const serialized = Buffer.from(database.serialize());
  assertCanonicalSqliteHeader(serialized);
  let compact;
  try {
    compact = new Database(serialized);
    compact.pragma("secure_delete = ON");
    compact.exec("VACUUM");
    const compactSerialized = Buffer.from(compact.serialize());
    assertCanonicalSqliteHeader(compactSerialized);
    if (
      !normalizeCanonicalSqliteHeader(serialized).equals(
        normalizeCanonicalSqliteHeader(compactSerialized),
      )
    ) {
      throw new Error("recovery_sqlite_image_not_canonical");
    }
  } finally {
    compact?.close();
  }
}

function assertCanonicalSqliteHeader(image) {
  if (
    image.length < 100 ||
    !image
      .subarray(0, 16)
      .equals(Buffer.from("SQLite format 3\0", "ascii")) ||
    image.readUInt32BE(24) !== image.readUInt32BE(92)
  ) {
    throw new Error("recovery_sqlite_header_invalid");
  }
}

function normalizeCanonicalSqliteHeader(image) {
  const normalized = Buffer.from(image);
  for (const offset of [24, 40, 92]) normalized.fill(0, offset, offset + 4);
  return normalized;
}

function makeDatabaseStandalone(databasePath) {
  let database;
  try {
    database = new Database(databasePath, { fileMustExist: true });
    database.pragma("journal_mode = DELETE");
  } finally {
    database?.close();
  }
  removeSqliteSideFiles(databasePath);
}

function readStablePayloadEntry(filePath, relativePath, onStableIdentity = null) {
  assertSafeRelativePath(relativePath);
  const descriptor = openSync(filePath, "r");
  let after;
  let sha256;
  try {
    const beforePath = lstatSync(filePath, { bigint: true });
    const beforeDescriptor = fstatSync(descriptor, { bigint: true });
    if (
      !beforePath.isFile() ||
      beforePath.isSymbolicLink() ||
      hasUnsafeMode(beforePath.mode) ||
      beforePath.dev !== beforeDescriptor.dev ||
      beforePath.ino !== beforeDescriptor.ino ||
      beforeDescriptor.size > BigInt(Number.MAX_SAFE_INTEGER)
    ) {
      throw new PublicRecoveryBackupError("restore_payload_invalid");
    }
    sha256 = hashOpenRegularFile(descriptor);
    const afterDescriptor = fstatSync(descriptor, { bigint: true });
    after = lstatSync(filePath, { bigint: true });
    if (
      beforeDescriptor.dev !== afterDescriptor.dev ||
      beforeDescriptor.ino !== afterDescriptor.ino ||
      beforeDescriptor.size !== afterDescriptor.size ||
      beforeDescriptor.mtimeNs !== afterDescriptor.mtimeNs ||
      afterDescriptor.dev !== after.dev ||
      afterDescriptor.ino !== after.ino ||
      afterDescriptor.size !== after.size ||
      afterDescriptor.mtimeNs !== after.mtimeNs ||
      !after.isFile() ||
      after.isSymbolicLink()
    ) {
      throw new PublicRecoveryBackupError("restore_payload_changed");
    }
    onStableIdentity?.({
      dev: afterDescriptor.dev.toString(),
      ino: afterDescriptor.ino.toString(),
    });
  } finally {
    closeSync(descriptor);
  }
  return {
    path: relativePath,
    size: Number(after.size),
    mode: recoveryContractFileMode(after.mode),
    sha256,
  };
}

function validatePayloadEntry(entry) {
  assertPlainRecord(entry);
  assertExactKeys(entry, ["mode", "path", "sha256", "size"]);
  assertSafeRelativePath(entry.path);
  if (
    entry.path !== RECOVERY_DATABASE_PAYLOAD ||
    !Number.isSafeInteger(entry.size) ||
    entry.size <= 0 ||
    entry.mode !== 0o600 ||
    !/^[a-f0-9]{64}$/u.test(entry.sha256 ?? "")
  ) {
    throw new PublicRecoveryBackupError("restore_payload_invalid");
  }
}

function validateOperationDocument(value) {
  assertPlainRecord(value);
  assertExactKeys(value, [
    "completed_action",
    "contract",
    "events",
    "installed_package",
    "pending_action",
    "pending_package",
    "pending_update_source",
    "schema_version",
  ]);
  if (
    value.contract !== RECOVERY_OPERATION_CONTRACT ||
    value.schema_version !== RECOVERY_OPERATION_SCHEMA_VERSION ||
    !Array.isArray(value.events) ||
    value.events.length > MAX_OPERATION_EVENTS
  ) {
    throw new Error("invalid operation document");
  }
  if (value.installed_package !== null) {
    normalizeInstalledPackageIdentity(value.installed_package);
  }
  if (value.pending_package !== null) {
    normalizeInstalledPackageIdentity(value.pending_package);
  }
  if (value.pending_update_source !== null) {
    normalizeSourceApplication(value.pending_update_source);
  }
  if (
    value.pending_package === null &&
    value.pending_update_source !== null
  ) {
    throw new Error("orphaned pending update source");
  }
  if (value.pending_action !== null) {
    normalizePendingRecoveryAction(value.pending_action);
  }
  if (value.completed_action !== null) {
    normalizeCompletedRecoveryAction(value.completed_action);
  }
  if (
    value.pending_action !== null &&
    value.completed_action?.action_id === value.pending_action.action_id
  ) {
    throw new Error("completed action remains pending");
  }
  value.events.forEach(normalizeOperationEvent);
}

function normalizeCompletedRecoveryAction(value) {
  assertPlainRecord(value);
  assertExactKeys(value, ["action_id", "event"]);
  if (!/^[0-9a-f-]{36}$/iu.test(value.action_id ?? "")) {
    throw new PublicRecoveryBackupError("recovery_result_invalid");
  }
  return {
    action_id: value.action_id,
    event: normalizeOperationEvent(value.event),
  };
}

function normalizePendingRecoveryAction(value) {
  assertPlainRecord(value);
  assertExactKeys(value, [
    "accepted_at",
    "action",
    "action_id",
    "application_scope_fingerprint",
    "requesting_runtime_generation_id",
    "requesting_runtime_instance_id",
    "selected_backup_directory_identity",
    "selected_backup_id",
    "selected_backup_identity",
    "selected_backup_manifest_file_identity",
    "selected_backup_payload_file_identity",
    "selected_backup_state_directory_identity",
    "target_application_version",
    "target_build_identity",
    "target_package_contract",
    "target_package_contract_version",
    "target_runtime_contract",
    "target_runtime_schema_version",
  ]);
  const restore = value.action === "restore_backup";
  if (
    !["restore_backup", "retry_update"].includes(value.action) ||
    !/^[0-9a-f-]{36}$/iu.test(value.action_id ?? "") ||
    !validIsoTimestamp(value.accepted_at) ||
    !/^[a-f0-9]{64}$/u.test(value.application_scope_fingerprint ?? "") ||
    !validPublicApplicationVersion(value.target_application_version) ||
    !/^sha256:[a-f0-9]{64}$/u.test(value.target_build_identity ?? "") ||
    !validContract(value.target_package_contract) ||
    !Number.isSafeInteger(value.target_package_contract_version) ||
    value.target_package_contract_version < 1 ||
    !validContract(value.target_runtime_contract) ||
    !Number.isSafeInteger(value.target_runtime_schema_version) ||
    value.target_runtime_schema_version < 1 ||
    !/^[0-9a-f-]{36}$/iu.test(
      value.requesting_runtime_instance_id ?? "",
    ) ||
    !/^[0-9a-f-]{36}$/iu.test(
      value.requesting_runtime_generation_id ?? "",
    ) ||
    (restore
      ? !validPendingActionBackupSelection(value)
      : !(
          (value.selected_backup_id === null &&
            value.selected_backup_identity === null &&
            value.selected_backup_directory_identity === null &&
            value.selected_backup_state_directory_identity === null &&
            value.selected_backup_manifest_file_identity === null &&
            value.selected_backup_payload_file_identity === null) ||
          validPendingActionBackupSelection(value)
        ))
  ) {
    throw new PublicRecoveryBackupError("recovery_action_invalid");
  }
  return {
    action_id: value.action_id,
    action: value.action,
    accepted_at: value.accepted_at,
    application_scope_fingerprint: value.application_scope_fingerprint,
    target_application_version: value.target_application_version,
    target_build_identity: value.target_build_identity,
    target_package_contract: value.target_package_contract,
    target_package_contract_version: value.target_package_contract_version,
    target_runtime_contract: value.target_runtime_contract,
    target_runtime_schema_version: value.target_runtime_schema_version,
    requesting_runtime_instance_id: value.requesting_runtime_instance_id,
    requesting_runtime_generation_id:
      value.requesting_runtime_generation_id,
    selected_backup_id: value.selected_backup_id,
    selected_backup_identity: value.selected_backup_identity,
    selected_backup_directory_identity:
      value.selected_backup_directory_identity === null
        ? null
        : { ...value.selected_backup_directory_identity },
    selected_backup_state_directory_identity:
      value.selected_backup_state_directory_identity === null
        ? null
        : { ...value.selected_backup_state_directory_identity },
    selected_backup_manifest_file_identity:
      value.selected_backup_manifest_file_identity === null
        ? null
        : { ...value.selected_backup_manifest_file_identity },
    selected_backup_payload_file_identity:
      value.selected_backup_payload_file_identity === null
        ? null
        : { ...value.selected_backup_payload_file_identity },
  };
}

function validPendingActionBackupSelection(value) {
  return (
    /^recovery:[0-9a-f-]{36}$/iu.test(value.selected_backup_id ?? "") &&
    /^sha256:[a-f0-9]{64}$/u.test(value.selected_backup_identity ?? "") &&
    validDirectoryIdentity(value.selected_backup_directory_identity) &&
    validDirectoryIdentity(value.selected_backup_state_directory_identity) &&
    validDirectoryIdentity(value.selected_backup_manifest_file_identity) &&
    validDirectoryIdentity(value.selected_backup_payload_file_identity)
  );
}

function normalizeInstalledPackageIdentity(value) {
  assertPlainRecord(value);
  assertExactKeys(value, [
    "application_scope_fingerprint",
    "application_version",
    "build_identity",
    "database_migration_contract",
    "database_migration_contract_version",
    "database_migration_ids",
    "database_reader_contracts",
    "database_record_contract",
    "database_record_contract_version",
    "database_schema_contract",
    "database_schema_signature",
    "package_contract",
    "package_contract_version",
    "package_platform",
    "recorded_at",
    "runtime_contract",
    "runtime_schema_version",
  ]);
  if (
    !validPublicApplicationVersion(value.application_version) ||
    !/^sha256:[a-f0-9]{64}$/u.test(value.build_identity ?? "") ||
    !/^[a-f0-9]{64}$/u.test(value.application_scope_fingerprint ?? "") ||
    !validContract(value.package_contract) ||
    !Number.isSafeInteger(value.package_contract_version) ||
    value.package_contract_version < 1 ||
    !validContract(value.package_platform) ||
    !validContract(value.runtime_contract) ||
    !Number.isSafeInteger(value.runtime_schema_version) ||
    value.runtime_schema_version < 1 ||
    !validContract(value.database_schema_contract) ||
    !/^[a-f0-9]{64}$/u.test(value.database_schema_signature ?? "") ||
    !validContract(value.database_migration_contract) ||
    !Number.isSafeInteger(value.database_migration_contract_version) ||
    value.database_migration_contract_version < 1 ||
    !Array.isArray(value.database_migration_ids) ||
    value.database_migration_ids.length > 256 ||
    !value.database_migration_ids.every(validMigrationId) ||
    new Set(value.database_migration_ids).size !==
      value.database_migration_ids.length ||
    !validContract(value.database_record_contract) ||
    !Number.isSafeInteger(value.database_record_contract_version) ||
    value.database_record_contract_version < 1 ||
    !Array.isArray(value.database_reader_contracts) ||
    value.database_reader_contracts.length > 64 ||
    !value.database_reader_contracts.every(validContract) ||
    new Set(value.database_reader_contracts).size !==
      value.database_reader_contracts.length ||
    !validIsoTimestamp(value.recorded_at)
  ) {
    throw new PublicRecoveryBackupError("recovery_result_invalid");
  }
  return {
    application_version: value.application_version,
    build_identity: value.build_identity,
    application_scope_fingerprint: value.application_scope_fingerprint,
    package_contract: value.package_contract,
    package_contract_version: value.package_contract_version,
    package_platform: value.package_platform,
    runtime_contract: value.runtime_contract,
    runtime_schema_version: value.runtime_schema_version,
    database_schema_contract: value.database_schema_contract,
    database_schema_signature: value.database_schema_signature,
    database_migration_contract: value.database_migration_contract,
    database_migration_contract_version:
      value.database_migration_contract_version,
    database_migration_ids: [...value.database_migration_ids],
    database_record_contract: value.database_record_contract,
    database_record_contract_version: value.database_record_contract_version,
    database_reader_contracts: [...value.database_reader_contracts],
    recorded_at: value.recorded_at,
  };
}

function normalizeOperationEvent(value) {
  assertPlainRecord(value);
  assertExactKeys(value, [
    "application_version",
    "backup_verified",
    "data_preserved",
    "database_state",
    "finished_at",
    "operation_kind",
    "outcome",
    "protected_backup_id",
    "protected_backup_identity",
    "reason_code",
    "safety_backup_created",
    "target_application_version",
    "target_build_identity",
    "next_action",
  ]);
  for (const key of [
    "database_state",
    "operation_kind",
    "outcome",
    "reason_code",
    "next_action",
  ]) {
    if (value[key] !== null && !validPublicCode(value[key])) {
      throw new PublicRecoveryBackupError("recovery_result_invalid");
    }
  }
  for (const key of ["application_version", "target_application_version"]) {
    if (value[key] !== null && !validPublicApplicationVersion(value[key])) {
      throw new PublicRecoveryBackupError("recovery_result_invalid");
    }
  }
  if (
    !validIsoTimestamp(value.finished_at) ||
    !(
      value.target_build_identity === null ||
      /^sha256:[a-f0-9]{64}$/u.test(value.target_build_identity ?? "")
    ) ||
    typeof value.backup_verified !== "boolean" ||
    typeof value.data_preserved !== "boolean" ||
    typeof value.safety_backup_created !== "boolean" ||
    !(
      (value.protected_backup_id === null &&
        value.protected_backup_identity === null) ||
      (/^recovery:[0-9a-f-]{36}$/iu.test(
        value.protected_backup_id ?? "",
      ) &&
        /^sha256:[a-f0-9]{64}$/u.test(
          value.protected_backup_identity ?? "",
        ))
    )
  ) {
    throw new PublicRecoveryBackupError("recovery_result_invalid");
  }
  return {
    operation_kind: value.operation_kind,
    outcome: value.outcome,
    reason_code: value.reason_code,
    finished_at: value.finished_at,
    application_version: value.application_version,
    target_application_version: value.target_application_version,
    target_build_identity: value.target_build_identity,
    database_state: value.database_state,
    protected_backup_id: value.protected_backup_id,
    protected_backup_identity: value.protected_backup_identity,
    backup_verified: value.backup_verified,
    safety_backup_created: value.safety_backup_created,
    data_preserved: value.data_preserved,
    next_action: value.next_action,
  };
}

function recoveryManifestIdentity(manifest) {
  return `sha256:${createHash("sha256")
    .update(JSON.stringify(manifest))
    .digest("hex")}`;
}

function hashOpenRegularFile(descriptor) {
  const hash = createHash("sha256");
  let position = 0;
  while (true) {
    const count = readSync(
      descriptor,
      HASH_BUFFER,
      0,
      HASH_BUFFER.length,
      position,
    );
    if (count === 0) break;
    hash.update(HASH_BUFFER.subarray(0, count));
    position += count;
  }
  return hash.digest("hex");
}

function writeRestrictedJson(filePath, value) {
  let descriptor = null;
  try {
    descriptor = openSync(filePath, "wx", 0o600);
    writeFileSync(descriptor, `${JSON.stringify(value)}\n`, "utf8");
    fsyncSync(descriptor);
  } finally {
    if (descriptor !== null) closeSync(descriptor);
  }
  setRestrictedMode(filePath, 0o600);
}

function ensureRestrictedDirectory(directory) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  assertRestrictedDirectory(directory, "recovery_backup_directory_invalid");
  setRestrictedMode(directory, 0o700);
}

function assertRestrictedDirectory(directory, code) {
  try {
    const stats = lstatSync(directory);
    if (
      !stats.isDirectory() ||
      stats.isSymbolicLink() ||
      hasUnsafeMode(stats.mode)
    ) {
      throw new Error("unsafe directory");
    }
  } catch (error) {
    if (error instanceof PublicRecoveryBackupError) throw error;
    throw new PublicRecoveryBackupError(code, error);
  }
}

function assertExactDirectoryEntries(directory, expected) {
  const actual = readdirSync(directory).sort();
  const sortedExpected = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(sortedExpected)) {
    throw new PublicRecoveryBackupError("restore_unexpected_files");
  }
}

function assertRegularFile(filePath, code) {
  try {
    const stats = lstatSync(filePath);
    if (!stats.isFile() || stats.isSymbolicLink()) throw new Error("not regular");
  } catch (error) {
    throw new PublicRecoveryBackupError(code, error);
  }
}

function assertBackupBasename(value) {
  if (typeof value !== "string" || !RECOVERY_BACKUP_NAME.test(value)) {
    throw new PublicRecoveryBackupError("recovery_backup_name_invalid");
  }
}

function assertStagingBasename(value) {
  if (typeof value !== "string" || !RECOVERY_STAGING_NAME.test(value)) {
    throw new PublicRecoveryBackupError("recovery_backup_name_invalid");
  }
}

function assertBackupReason(value) {
  if (
    ![
      "pre_update",
      "pre_restore_safety",
      "manual_recovery",
    ].includes(value)
  ) {
    throw new PublicRecoveryBackupError("recovery_backup_reason_invalid");
  }
}

function assertScopeFingerprint(value) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/u.test(value)) {
    throw new PublicRecoveryBackupError("recovery_scope_invalid");
  }
}

function assertAbsolute(value, code) {
  if (typeof value !== "string" || !path.isAbsolute(value)) {
    throw new PublicRecoveryBackupError(code);
  }
}

function assertSafeRelativePath(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 4096 ||
    value.includes("\\") ||
    value.includes("\0") ||
    path.posix.isAbsolute(value) ||
    value.split("/").some((part) => part === "" || part === "." || part === "..") ||
    path.posix.normalize(value) !== value
  ) {
    throw new PublicRecoveryBackupError("restore_payload_path_invalid");
  }
}

function assertPlainRecord(value) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new PublicRecoveryBackupError("restore_validation_failed");
  }
}

function assertExactKeys(value, keys) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new PublicRecoveryBackupError("restore_validation_failed");
  }
}

function validIsoTimestamp(value) {
  if (typeof value !== "string" || value.length > 64) return false;
  try {
    return new Date(value).toISOString() === value;
  } catch {
    return false;
  }
}

function legacyBackupCreatedAt(legacyBasename) {
  const match = legacyBasename.match(LEGACY_RECOVERY_BACKUP_NAME);
  if (!match) {
    throw new PublicRecoveryBackupError("legacy_backup_invalid");
  }
  const createdAt = `${match[1]}T${match[2]}:${match[3]}:${match[4]}.${match[5]}Z`;
  if (!validIsoTimestamp(createdAt)) {
    throw new PublicRecoveryBackupError("legacy_backup_invalid");
  }
  return createdAt;
}

function adoptedLegacyBackupPath(
  backupDirectory,
  legacyBasename,
  adoptionEntry,
) {
  const operationUuid = adoptionEntry.adopted_backup_id.slice(
    "recovery:".length,
  );
  return path.join(
    backupDirectory,
    recoveryBackupBasename(
      legacyBackupCreatedAt(legacyBasename),
      operationUuid,
    ),
  );
}

function removeVerifiedAdoptedLegacySource({
  backupDirectory,
  legacyPath,
  expectedPayload,
  expectedIdentity,
}) {
  assertLegacyDatabaseHasNoSideFiles(legacyPath);
  let observedIdentity = null;
  const observedPayload = readStablePayloadEntry(
    legacyPath,
    RECOVERY_DATABASE_PAYLOAD,
    (identity) => {
      observedIdentity = identity;
    },
  );
  if (
    observedIdentity === null ||
    !sameDirectoryIdentity(observedIdentity, expectedIdentity) ||
    JSON.stringify(observedPayload) !== JSON.stringify(expectedPayload)
  ) {
    throw new PublicRecoveryBackupError("legacy_backup_changed");
  }
  const finalIdentity = lstatSync(legacyPath, { bigint: true });
  if (
    !finalIdentity.isFile() ||
    finalIdentity.isSymbolicLink() ||
    finalIdentity.dev.toString() !== expectedIdentity.dev ||
    finalIdentity.ino.toString() !== expectedIdentity.ino
  ) {
    throw new PublicRecoveryBackupError("legacy_backup_changed");
  }
  unlinkSync(legacyPath);
  fsyncDirectoryBestEffort(backupDirectory);
  if (existsSync(legacyPath)) {
    throw new PublicRecoveryBackupError("legacy_backup_changed");
  }
}

function assertLegacyDatabaseHasNoSideFiles(legacyPath) {
  for (const suffix of ["-wal", "-shm", "-journal"]) {
    try {
      lstatSync(`${legacyPath}${suffix}`);
      throw new PublicRecoveryBackupError("legacy_backup_unsafe");
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    }
  }
}

function deterministicLegacyBackupUuid(legacyBasename, payloadSha256) {
  const hex = createHash("sha256")
    .update(`${legacyBasename}\0${payloadSha256}`)
    .digest("hex")
    .slice(0, 32)
    .split("");
  hex[12] = "5";
  hex[16] = ["8", "9", "a", "b"][Number.parseInt(hex[16], 16) % 4];
  const compact = hex.join("");
  return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`;
}

function validContract(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 256 &&
    /^[A-Za-z0-9][A-Za-z0-9._:+\-/]*$/u.test(value)
  );
}

function validMigrationId(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 160 &&
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(value)
  );
}

function validPublicCode(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 128 &&
    /^[A-Za-z0-9][A-Za-z0-9._:-]*$/u.test(value)
  );
}

function validPublicApplicationVersion(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 80 &&
    /^v?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/u.test(value)
  );
}

function validDirectoryIdentity(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).sort().join(",") === "dev,ino" &&
    typeof value.dev === "string" &&
    /^\d+$/u.test(value.dev) &&
    typeof value.ino === "string" &&
    /^\d+$/u.test(value.ino)
  );
}

function sameDirectoryIdentity(left, right) {
  return left.dev === right.dev && left.ino === right.ino;
}

function hasUnsafeMode(mode) {
  return process.platform !== "win32" && (Number(mode) & 0o077) !== 0;
}

function setRestrictedMode(filePath, mode) {
  try {
    chmodSync(filePath, mode);
  } catch {
    // Windows does not implement POSIX permission semantics.
  }
}

function removeRegularFileIfPresent(filePath) {
  try {
    const stats = lstatSync(filePath);
    if (stats.isFile() && !stats.isSymbolicLink()) unlinkSync(filePath);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

function removeSqliteSideFiles(databasePath) {
  for (const suffix of ["-wal", "-shm", "-journal"]) {
    const candidate = `${databasePath}${suffix}`;
    let identity = null;
    try {
      const stats = lstatSync(candidate, { bigint: true });
      if (!stats.isFile() || stats.isSymbolicLink()) continue;
      identity = { dev: stats.dev, ino: stats.ino };
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    removeExactRegularFile(candidate, identity);
  }
}

function removeExactRegularFile(filePath, expectedIdentity) {
  if (expectedIdentity === null) return;
  try {
    const stats = lstatSync(filePath, { bigint: true });
    if (
      stats.isFile() &&
      !stats.isSymbolicLink() &&
      stats.dev === expectedIdentity.dev &&
      stats.ino === expectedIdentity.ino
    ) {
      unlinkSync(filePath);
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
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

function publicRecoveryErrorCode(error, fallback) {
  return typeof error?.code === "string" && validPublicCode(error.code)
    ? error.code
    : fallback;
}
