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

import {
  createRecoveryPrivateMaterialIdentityContext,
  inspectRecoveryPrivateMaterialBoundary,
  normalizeRecoveryPrivateMaterialIdentityRow,
} from "../lib/db/recovery-private-material-contract.mjs";
import { ensureApplicationDirectory } from "./augnes-local-paths.mjs";
import {
  CANONICAL_DATABASE_MIGRATION_CONTRACT,
  CANONICAL_DATABASE_MIGRATION_CONTRACT_VERSION,
  CANONICAL_DATABASE_MIGRATION_IDS,
  CANONICAL_DATABASE_RECORD_CONTRACT,
  CANONICAL_DATABASE_RECORD_CONTRACT_VERSION,
  CANONICAL_DATABASE_SCHEMA_CONTRACT,
  CANONICAL_DATABASE_SUPPORTED_SOURCE_SCHEMA_SIGNATURES,
  applyCanonicalDatabaseMigrations,
  readCanonicalDatabaseMigrationLedger,
  requireCanonicalPackageIdentityGuard,
  verifyCanonicalDatabaseMigrationLedger,
  verifyCanonicalPackageIdentityGuard,
} from "./canonical-database-migrations.mjs";
import {
  classifyPrivateProcessOwnership,
  startPrivateProcessOwnershipProbe,
  validPrivateProcessOwnershipFields,
} from "./local-process-ownership.mjs";
import {
  PublicRecoveryBackupError,
  createRecoveryBackup,
  listRecoveryBackups,
  recoveryBackupBasename,
  removeEmptyIncompleteRecoveryBackup,
  removeIncompleteRecoveryBackup,
  selectRecoveryBackup,
  stageRecoveryBackupDatabase,
  validateRecoveryCanonicalRecords,
  validateRecoveryBackup,
} from "./recovery-backup.mjs";

export const DATABASE_BOOTSTRAP_CONTRACT = "augnes-local-database-bootstrap-v1";
export const DATABASE_BOOTSTRAP_JOURNAL_SCHEMA_VERSION = 4;
export const LEGACY_DATABASE_BOOTSTRAP_JOURNAL_SCHEMA_VERSION = 3;
export const DATABASE_READER_CONTRACTS = Object.freeze([
  "project_home.v0.1",
  "decision_centered_semantic_workbench.v0.1",
  "shared_project_inspector.v0.1",
]);
// Exact #1118 pre-migration recovery image produced by pinned merge-base
// e3a35bb after its documented perspective_memory_items rollback fixture.
// This source is accepted only for one-way legacy backup adoption, never as a
// normal authoritative update source.
export const LEGACY_RECOVERY_ADOPTION_SOURCE_SCHEMA_SIGNATURES = Object.freeze([
  "1c6625843bae76075cea39176bd9955d63d90e0432465e99521bdce8c3687433",
]);
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
  "restart_verification_pending",
  "cleanup_complete",
  "original_restored",
  "restoring_original",
  "restore_failed",
]);
let canonicalSchemaContractCache = null;
let canonicalMissingPackageIdentityGuardSignatureCache = null;

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

export async function inspectDatabaseReconciliation({
  databasePath,
  backupDirectory,
  repositoryFingerprint,
  recoveryOwner = null,
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
  const ownership = await classifyBootstrapJournalOwner(result.value, {
    recoveryOwner,
  });
  if (ownership === "verified_live") {
    return publicDatabaseReconciliation("reconciliation_in_progress", {
      reason: "database_reconciliation_required",
      phase: result.value.phase,
    });
  }
  if (ownership !== "stale") {
    return publicDatabaseReconciliation("recovery_required", {
      reason: "database_reconciliation_required",
      phase: result.value.phase,
    });
  }
  return publicDatabaseReconciliation("recoverable", {
    phase: result.value.phase,
    automatic_reconciliation: true,
    recovery_backup_present: recoveryBackupExists(
      validation.recoveryBackupPath,
      validation.legacy,
    ),
    rollback_material_present: databaseFamilyExists(validation.rollbackPath),
  });
}

export async function reconcileInterruptedDatabaseBootstrap({
  databasePath,
  backupDirectory,
  repositoryFingerprint,
  reconciliationLeaseOwned = false,
  recoveryOwner = null,
  completeRecoveryAction = null,
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
  if (
    (await classifyBootstrapJournalOwner(journal, { recoveryOwner })) !==
    "stale"
  ) {
    throw new PublicDatabaseBootstrapError("database_reconciliation_required");
  }

  const recoveryActionSettlementRequired =
    !validation.legacy &&
    journal.operation_kind === "restore" &&
    journal.recovery_action_id !== null;
  if (
    recoveryActionSettlementRequired &&
    typeof completeRecoveryAction !== "function"
  ) {
    throw new PublicDatabaseBootstrapError("database_reconciliation_required");
  }

  try {
    cleanupExactRegularFile(validation.journalTemporaryPath);
    const reconciledRecoveryBackup = reconcilePublishedRecoveryBackup({
      journal,
      validation,
      databasePath,
      lockPath,
    });
    const outcome = recoverDatabaseJournalPhase({
      journal,
      databasePath,
      stagingPath: validation.stagingPath,
      rollbackPath: validation.rollbackPath,
      recoveryBackupPath: validation.recoveryBackupPath,
      recoveryBackupStagingPath: validation.recoveryBackupStagingPath,
    });
    const reusableRecoveryBackup =
      !validation.legacy &&
      journal.operation_kind === "update" &&
      outcome.result === "database_rollback_restored" &&
      validation.recoveryBackupPath !== null &&
      reconciledRecoveryBackup !== null &&
      typeof journal.recovery_backup_id === "string" &&
      typeof journal.recovery_backup_identity === "string" &&
      validFamilyIdentity(journal.original_family)
        ? {
            backupPath: validation.recoveryBackupPath,
            backupId: journal.recovery_backup_id,
            backupIdentity: journal.recovery_backup_identity,
            backupDirectoryIdentity:
              reconciledRecoveryBackup.backupDirectoryIdentity,
            stateDirectoryIdentity:
              reconciledRecoveryBackup.stateDirectoryIdentity,
            manifestFileIdentity:
              reconciledRecoveryBackup.manifestFileIdentity,
            payloadFileIdentity:
              reconciledRecoveryBackup.payloadFileIdentity,
            sourceFamily: journal.original_family,
          }
        : null;
    const reconciliationOperation = validation.legacy
      ? null
      : {
          operationKind: journal.operation_kind,
          result: outcome.result,
          selectedBackupId: journal.selected_backup_id,
          selectedBackupIdentity: journal.selected_backup_identity,
          selectedBackupDirectoryIdentity:
            journal.selected_backup_directory_identity,
          protectedBackupId: journal.recovery_backup_id,
          protectedBackupIdentity: journal.recovery_backup_identity,
          recoveryActionId: journal.recovery_action_id,
        };
    if (recoveryActionSettlementRequired) {
      if (
        outcome.result === "database_verified_publish_committed" ||
        (outcome.result === "database_rollback_restored" &&
          validFamilyIdentity(journal.original_family))
      ) {
        updateBootstrapJournal(lockPath, journal, {
          phase:
            outcome.result === "database_verified_publish_committed"
              ? "cleanup_complete"
              : "original_restored",
        });
      }
      const settled = await completeRecoveryAction(reconciliationOperation);
      if (settled !== true) {
        throw new PublicDatabaseBootstrapError(
          "database_reconciliation_required",
        );
      }
    }
    releaseBootstrapLock(lockPath, journal);
    return {
      databaseStateReconciled: true,
      recoveryBackupPreserved: recoveryBackupExists(
        validation.recoveryBackupPath,
        validation.legacy,
      ),
      ...outcome,
      reusableRecoveryBackup,
      reconciliationOperation,
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
  forceCurrentRecoveryBackup = false,
  requirePackageIdentityGuard = false,
  reusableRecoveryBackup = null,
  targetCompatibility = null,
  dependencies = {},
} = {}) {
  if (
    !databasePath ||
    !backupDirectory ||
    !repositoryRoot ||
    !instanceId ||
    !path.isAbsolute(databasePath) ||
    !path.isAbsolute(backupDirectory) ||
    typeof forceCurrentRecoveryBackup !== "boolean" ||
    typeof requirePackageIdentityGuard !== "boolean" ||
    !validReusableRecoveryBackupOrNull(reusableRecoveryBackup)
  ) {
    throw new PublicDatabaseBootstrapError("database_path_invalid");
  }

  const operationId = `${process.pid}-${randomUUID()}`;
  const effectiveRepositoryFingerprint =
    repositoryFingerprint ??
    createHash("sha256").update(repositoryRoot).digest("hex");
  const compatibility = normalizeTargetCompatibility(
    targetCompatibility,
    effectiveRepositoryFingerprint,
  );
  const databaseDirectory = path.dirname(databasePath);
  const stagingPath = `${databasePath}.augnes-stage-${operationId}`;
  const rollbackPath = `${databasePath}.augnes-rollback-${operationId}`;
  const lockPath = `${databasePath}.augnes-bootstrap.lock`;
  const ownershipNonce = randomBytes(24).toString("hex");
  let lock = null;
  let ownerProbe = null;
  let recoveryBackupPath = null;
  let recoveryBackupId = null;
  let recoveryBackupIdentity = null;
  let retainBootstrapLock = false;
  let publicationControl = null;
  let publicationOwnerTransferred = false;

  try {
    ensureDatabaseDirectory({
      databaseDirectory,
      repositoryRoot,
      databaseOverrideActive,
    });
    assertDatabaseFileSafe(databasePath);
    assertNoOrphanedDatabaseSideFiles(databasePath);
    ownerProbe = await startPrivateProcessOwnershipProbe({
      contract: DATABASE_BOOTSTRAP_CONTRACT,
      schemaVersion: DATABASE_BOOTSTRAP_JOURNAL_SCHEMA_VERSION,
      repositoryFingerprint: effectiveRepositoryFingerprint,
      ownershipId: operationId,
      ownershipNonce,
    });
    lock = acquireBootstrapLock({
      lockPath,
      databasePath,
      repositoryFingerprint: effectiveRepositoryFingerprint,
      runtimeInstanceId: instanceId,
      runtimeOwnershipGeneration,
      operationId,
      ownershipNonce,
      ownerProof: ownerProbe,
      stagingPath,
      rollbackPath,
      sourceWasMissing: !existsSync(databasePath),
      operationKind: existsSync(databasePath) ? "update" : "create",
      targetCompatibility: compatibility,
    });
    notifyJournalPhase(dependencies, lock);

    if (!existsSync(databasePath)) {
      createCurrentDatabase(stagingPath, dependencies, {
        requirePackageIdentityGuard,
      });
      updateBootstrapJournal(lockPath, lock, {
        phase: "staging_ready",
        source_was_missing: true,
        staged_family: readDatabaseFamilyIdentity(stagingPath),
      });
      notifyJournalPhase(dependencies, lock);
      if (dependencies.verifyPreparedDatabase) {
        try {
          dependencies.verifyPreparedDatabase(stagingPath);
        } catch (error) {
          throw new PublicDatabaseBootstrapError(
            "database_integrity_failed",
            error,
          );
        }
      }
      if (dependencies.verifyRequiredReaders) {
        try {
          dependencies.verifyRequiredReaders(stagingPath);
        } catch (error) {
          throw new PublicDatabaseBootstrapError(
            "database_reader_incompatible",
            error,
          );
        }
      }
      replaceNewDatabase({
        stagingPath,
        databasePath,
        lockPath,
        lock,
        dependencies,
      });
      let verifiedInspection;
      try {
        verifiedInspection = inspectRecoveryDatabaseFile(databasePath);
        updateBootstrapJournal(lockPath, lock, {
          phase: "published_verified",
          published_family: readDatabaseFamilyIdentity(databasePath),
        });
        notifyJournalPhase(dependencies, lock);
        dependencies.afterPublishedVerified?.({
          databasePath,
          operationKind: lock.operation_kind,
          recoveryActionId: lock.recovery_action_id,
          recoveryBackupId: lock.recovery_backup_id,
          recoveryBackupIdentity: lock.recovery_backup_identity,
          recoveryBackupDirectoryIdentity:
            lock.recovery_backup_staging_identity,
          selectedBackupId: lock.selected_backup_id,
          selectedBackupIdentity: lock.selected_backup_identity,
        });
        updateBootstrapJournal(lockPath, lock, { phase: "cleanup_complete" });
        notifyJournalPhase(dependencies, lock);
      } catch (error) {
        removeUnverifiedNewPublicationOrRetain({
          databasePath,
          lock,
          cause: error,
        });
      }
      return {
        databaseState: "created",
        schemaVersion:
          verifiedInspection.schema_classification === "current"
            ? "current"
            : "outdated",
        recoveryBackupCreated: false,
        resolvedDatabasePath: databasePath,
        recoveryBackupPath: null,
      };
    }

    const classification = classifyExistingDatabase(databasePath);
    if (classification.state === "current") {
      if (forceCurrentRecoveryBackup) {
        let originalFamily = readDatabaseFamilyIdentity(databasePath);
        const originalLogicalIdentity =
          readStableLogicalDatabaseIdentity(databasePath);
        updateBootstrapJournal(lockPath, lock, {
          original_family: originalFamily,
          original_logical_identity: originalLogicalIdentity,
        });
        ensureApplicationDirectory({
          directory: backupDirectory,
          repositoryRoot,
          insideRepositoryCode: "backup_path_must_be_outside_repository",
          invalidCode: "backup_directory_invalid",
        });
        const recoveryBackup = await resolveVerifiedUpdateRecoveryBackup({
          databasePath,
          backupDirectory,
          compatibility,
          originalFamily,
          originalLogicalIdentity,
          reusableRecoveryBackup,
          lockPath,
          lock,
          dependencies,
        });
        recoveryBackupPath = recoveryBackup.backupPath;
        recoveryBackupId = recoveryBackup.manifest.backup_id;
        recoveryBackupIdentity = recoveryBackup.manifest.backup_identity;
        originalFamily = recoveryBackup.sourceFamily;
        if (!databaseFamilyMatches(databasePath, originalFamily)) {
          throw new PublicDatabaseBootstrapError("update_ownership_conflict");
        }
        const stagedInspection = await stageRecoveryBackupDatabase({
          selectedBackup: recoveryBackup,
          targetPath: stagingPath,
          inspectDatabase: inspectRecoveryDatabaseFile,
          dependencies: {
            afterTargetCreated: (stagingFileIdentity) => {
              dependencies.beforeStagingFileIdentityRecorded?.({
                stagingPath,
                stagingFileIdentity,
              });
              updateBootstrapJournal(lockPath, lock, {
                staging_file_identity: stagingFileIdentity,
              });
            },
          },
        });
        if (requirePackageIdentityGuard) {
          requireRuntimePackageIdentityGuard(stagingPath);
        }
        const verifiedStagedInspection =
          inspectRecoveryDatabaseFile(stagingPath);
        const stagedFamily = readDatabaseFamilyIdentity(stagingPath);
        updateBootstrapJournal(lockPath, lock, {
          phase: "staging_ready",
          source_was_missing: false,
          original_family: originalFamily,
          staged_family: stagedFamily,
        });
        notifyJournalPhase(dependencies, lock);
        if (
          stagedInspection.schema_signature !==
            classification.targetSignature ||
          verifiedStagedInspection.schema_signature !==
            classification.targetSignature
        ) {
          throw new PublicDatabaseBootstrapError("database_schema_unsupported");
        }
        const replacement = replaceMigratedDatabase({
          databasePath,
          stagingPath,
          rollbackPath,
          lockPath,
          lock,
          dependencies,
        });
        if (replacement.restartVerificationPending) {
          retainBootstrapLock = true;
          publicationOwnerTransferred = true;
          publicationControl = createDeferredPublicationControl({
            databasePath,
            stagingPath,
            rollbackPath,
            lockPath,
            lock,
            ownerProbe,
            dependencies,
          });
        }
        const publishedInspection = inspectRecoveryDatabaseFile(databasePath);
        return {
          databaseState: "current",
          schemaVersion:
            publishedInspection.schema_classification === "current"
              ? "current"
              : "outdated",
          recoveryBackupCreated: true,
          resolvedDatabasePath: databasePath,
          recoveryBackupPath: recoveryBackup.backupPath,
          recoveryBackupId: recoveryBackup.manifest.backup_id,
          recoveryBackupIdentity: recoveryBackup.manifest.backup_identity,
          publicationControl,
        };
      }
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

    let originalFamily = readDatabaseFamilyIdentity(databasePath);
    const originalLogicalIdentity =
      readStableLogicalDatabaseIdentity(databasePath);
    updateBootstrapJournal(lockPath, lock, {
      original_family: originalFamily,
      original_logical_identity: originalLogicalIdentity,
    });

    ensureApplicationDirectory({
      directory: backupDirectory,
      repositoryRoot,
      insideRepositoryCode: "backup_path_must_be_outside_repository",
      invalidCode: "backup_directory_invalid",
    });
    const recoveryBackup = await resolveVerifiedUpdateRecoveryBackup({
      databasePath,
      backupDirectory,
      compatibility,
      originalFamily,
      originalLogicalIdentity,
      reusableRecoveryBackup,
      lockPath,
      lock,
      dependencies,
    });
    recoveryBackupPath = recoveryBackup.backupPath;
    recoveryBackupId = recoveryBackup.manifest.backup_id;
    recoveryBackupIdentity = recoveryBackup.manifest.backup_identity;
    originalFamily = recoveryBackup.sourceFamily;
    if (!databaseFamilyMatches(databasePath, originalFamily)) {
      throw new PublicDatabaseBootstrapError("update_ownership_conflict");
    }

    const stagedInspection = await stageRecoveryBackupDatabase({
      selectedBackup: recoveryBackup,
      targetPath: stagingPath,
      inspectDatabase: inspectRecoveryDatabaseFile,
      migrateDatabase:
        dependencies.migrateDatabase ?? applyCanonicalDatabaseMigrations,
      dependencies: {
        beforePayloadCopy: dependencies.beforeStageCopy,
        afterTargetCreated: (stagingFileIdentity) => {
          dependencies.beforeStagingFileIdentityRecorded?.({
            stagingPath,
            stagingFileIdentity,
          });
          updateBootstrapJournal(lockPath, lock, {
            staging_file_identity: stagingFileIdentity,
          });
        },
      },
    });
    if (requirePackageIdentityGuard) {
      requireRuntimePackageIdentityGuard(stagingPath);
    }
    const verifiedStagedInspection = inspectRecoveryDatabaseFile(stagingPath);
    const stagedFamily = readDatabaseFamilyIdentity(stagingPath);
    updateBootstrapJournal(lockPath, lock, {
      staged_family: stagedFamily,
    });
    if (dependencies.verifyPreparedDatabase) {
      try {
        dependencies.verifyPreparedDatabase(stagingPath);
      } catch (error) {
        throw new PublicDatabaseBootstrapError(
          "database_integrity_failed",
          error,
        );
      }
    }
    if (dependencies.verifyRequiredReaders) {
      try {
        dependencies.verifyRequiredReaders(stagingPath);
      } catch (error) {
        throw new PublicDatabaseBootstrapError(
          "database_reader_incompatible",
          error,
        );
      }
    }
    const stagedVerification = {
      schemaSignature: stagedInspection.schema_signature,
    };
    if (
      stagedVerification.schemaSignature !== classification.targetSignature ||
      verifiedStagedInspection.schema_signature !==
        classification.targetSignature
    ) {
      throw new PublicDatabaseBootstrapError("database_schema_unsupported");
    }
    updateBootstrapJournal(lockPath, lock, {
      phase: "staging_ready",
      source_was_missing: false,
      original_family: originalFamily,
      staged_family: stagedFamily,
    });
    notifyJournalPhase(dependencies, lock);
    const replacement = replaceMigratedDatabase({
      databasePath,
      stagingPath,
      rollbackPath,
      lockPath,
      lock,
      dependencies,
    });
    if (replacement.restartVerificationPending) {
      retainBootstrapLock = true;
      publicationOwnerTransferred = true;
      publicationControl = createDeferredPublicationControl({
        databasePath,
        stagingPath,
        rollbackPath,
        lockPath,
        lock,
        ownerProbe,
        dependencies,
      });
    }
    const liveVerification = inspectRecoveryDatabaseFile(databasePath);

    return {
      databaseState: "migrated",
      schemaVersion:
        liveVerification.schema_classification === "current"
          ? "current"
          : "outdated",
      recoveryBackupCreated: true,
      resolvedDatabasePath: databasePath,
      recoveryBackupPath,
      recoveryBackupId: recoveryBackup.manifest.backup_id,
      recoveryBackupIdentity: recoveryBackup.manifest.backup_identity,
      publicationControl,
    };
  } catch (error) {
    if (publicationControl !== null) {
      try {
        await publicationControl.rollback();
        publicationControl = null;
        publicationOwnerTransferred = false;
        retainBootstrapLock = false;
      } catch (rollbackError) {
        const failure = normalizeBootstrapError(rollbackError);
        failure.retainBootstrapLock = true;
        throw failure;
      }
    }
    let cleanupFailure = null;
    try {
      cleanupRecordedOperationFamily(
        stagingPath,
        lock?.staged_family ?? null,
        lock?.staging_file_identity ?? null,
      );
    } catch (cleanupError) {
      cleanupFailure = cleanupError;
    }
    const failure = normalizeBootstrapError(cleanupFailure ?? error);
    if (cleanupFailure) failure.retainBootstrapLock = true;
    retainBootstrapLock = failure.retainBootstrapLock === true;
    failure.recoveryBackupCreated = Boolean(
      recoveryBackupPath && existsSync(recoveryBackupPath),
    );
    failure.recoveryBackupId = recoveryBackupId;
    failure.recoveryBackupIdentity = recoveryBackupIdentity;
    throw failure;
  } finally {
    if (lock && !retainBootstrapLock) releaseBootstrapLock(lockPath, lock);
    if (!publicationOwnerTransferred) await ownerProbe?.close();
  }
}

async function resolveVerifiedUpdateRecoveryBackup({
  databasePath,
  backupDirectory,
  compatibility,
  originalFamily,
  originalLogicalIdentity,
  reusableRecoveryBackup,
  lockPath,
  lock,
  dependencies,
}) {
  if (reusableRecoveryBackup !== null) {
    if (
      path.dirname(reusableRecoveryBackup.backupPath) !== backupDirectory
    ) {
      throw new PublicDatabaseBootstrapError("update_ownership_conflict");
    }
    const backupBasename = path.basename(reusableRecoveryBackup.backupPath);
    const operationUuid = reusableRecoveryBackup.backupId.slice(
      "recovery:".length,
    );
    const stagingBasename = `.augnes-recovery-incomplete-${operationUuid}`;
    if (existsSync(path.join(backupDirectory, stagingBasename))) {
      throw new PublicDatabaseBootstrapError(
        "database_reconciliation_required",
      );
    }
    updateBootstrapJournal(lockPath, lock, {
      recovery_backup_basename: backupBasename,
      recovery_backup_staging_basename: stagingBasename,
    });
    const verified = validateRecoveryBackup({
      backupPath: reusableRecoveryBackup.backupPath,
      expectedApplicationScopeFingerprint:
        compatibility.applicationScopeFingerprint,
      inspectDatabase: inspectRecoveryDatabaseFile,
      expectedBackupId: reusableRecoveryBackup.backupId,
      expectedBackupIdentity: reusableRecoveryBackup.backupIdentity,
      expectedBackupDirectoryIdentity:
        reusableRecoveryBackup.backupDirectoryIdentity,
      expectedStateDirectoryIdentity:
        reusableRecoveryBackup.stateDirectoryIdentity,
      expectedManifestFileIdentity:
        reusableRecoveryBackup.manifestFileIdentity,
      expectedPayloadFileIdentity:
        reusableRecoveryBackup.payloadFileIdentity,
    });
    const sourceFamily = stabilizeSourceFamilyAgainstBackup({
      databasePath,
      backupPayloadPath: verified.payloadPath,
      originalFamily,
      originalLogicalIdentity,
    });
    if (verified.manifest.reason !== "pre_update") {
      throw new PublicDatabaseBootstrapError(
        "database_backup_verification_failed",
      );
    }
    updateBootstrapJournal(lockPath, lock, {
      phase: "backup_ready",
      original_family: sourceFamily,
      recovery_backup_staging_identity: verified.backupDirectoryIdentity,
      recovery_backup_id: verified.manifest.backup_id,
      recovery_backup_identity: verified.manifest.backup_identity,
    });
    notifyJournalPhase(dependencies, lock);
    return {
      ...verified,
      backupBasename,
      stagingBasename,
      sourceFamily,
    };
  }

  const backupUuid = randomUUID();
  const backupCreatedAt = new Date().toISOString();
  const backupBasename = recoveryBackupBasename(backupCreatedAt, backupUuid);
  const stagingBasename = `.augnes-recovery-incomplete-${backupUuid}`;
  updateBootstrapJournal(lockPath, lock, {
    recovery_backup_basename: backupBasename,
    recovery_backup_staging_basename: stagingBasename,
  });
  const created = await createRecoveryBackup({
    databasePath,
    backupDirectory,
    applicationScopeFingerprint: compatibility.applicationScopeFingerprint,
    sourceApplication: compatibility.sourceApplication,
    reason: "pre_update",
    inspectDatabase: inspectRecoveryDatabaseFile,
    backupBasename,
    stagingBasename,
    now: () => new Date(backupCreatedAt),
    dependencies: {
      backupDatabase: dependencies.backupDatabase,
      afterStagingCreated: ({ stagingPath, stagingIdentity }) => {
        dependencies.beforeRecoveryBackupStagingRecorded?.({
          stagingPath,
          stagingIdentity,
        });
        updateBootstrapJournal(lockPath, lock, {
          recovery_backup_staging_identity: stagingIdentity,
        });
      },
      afterBackupPublished: (published) => {
        dependencies.afterRecoveryBackupPublished?.(published);
      },
    },
  });
  const sourceFamily = stabilizeSourceFamilyAgainstBackup({
    databasePath,
    backupPayloadPath: created.payloadPath,
    originalFamily,
    originalLogicalIdentity,
  });
  updateBootstrapJournal(lockPath, lock, {
    phase: "backup_ready",
    original_family: sourceFamily,
    recovery_backup_id: created.manifest.backup_id,
    recovery_backup_identity: created.manifest.backup_identity,
  });
  notifyJournalPhase(dependencies, lock);
  return { ...created, sourceFamily };
}

function stabilizeSourceFamilyAgainstBackup({
  databasePath,
  backupPayloadPath,
  originalFamily,
  originalLogicalIdentity,
}) {
  if (!/^sha256:[a-f0-9]{64}$/u.test(originalLogicalIdentity)) {
    throw new PublicDatabaseBootstrapError("database_reconciliation_required");
  }
  if (!databaseFamilyMatches(databasePath, originalFamily)) {
    throw new PublicDatabaseBootstrapError("update_ownership_conflict");
  }
  const backupIdentity = logicalDatabaseIdentity(backupPayloadPath);
  const firstLiveIdentity = logicalDatabaseIdentity(databasePath);
  if (
    backupIdentity !== originalLogicalIdentity ||
    firstLiveIdentity !== originalLogicalIdentity ||
    !databaseFamilyMatches(databasePath, originalFamily)
  ) {
    throw new PublicDatabaseBootstrapError("update_ownership_conflict");
  }
  const secondLiveIdentity = logicalDatabaseIdentity(databasePath);
  if (
    secondLiveIdentity !== originalLogicalIdentity ||
    !databaseFamilyMatches(databasePath, originalFamily)
  ) {
    throw new PublicDatabaseBootstrapError("update_ownership_conflict");
  }
  return originalFamily;
}

function readStableLogicalDatabaseIdentity(databasePath) {
  const first = logicalDatabaseIdentity(databasePath);
  const second = logicalDatabaseIdentity(databasePath);
  if (first !== second) {
    throw new PublicDatabaseBootstrapError("update_ownership_conflict");
  }
  return first;
}

function logicalDatabaseIdentity(databasePath) {
  let database;
  try {
    database = new Database(databasePath, {
      readonly: true,
      fileMustExist: true,
    });
    verifyOpenDatabase(database);
    database.exec("BEGIN");
    const privateMaterialIdentityContext =
      createRecoveryPrivateMaterialIdentityContext(database);
    const digest = createHash("sha256");
    updateLogicalDigest(digest, "augnes.logical-database.v2");
    updateLogicalDigest(digest, database.pragma("user_version", { simple: true }));
    updateLogicalDigest(
      digest,
      database.pragma("application_id", { simple: true }),
    );
    const schemaObjects = database
      .prepare(
        `SELECT type, name, tbl_name, sql
         FROM sqlite_schema
         WHERE name NOT LIKE 'sqlite_%' OR name = 'sqlite_sequence'
         ORDER BY type, name, tbl_name, sql`,
      )
      .all();
    for (const schemaObject of schemaObjects) {
      updateLogicalDigest(digest, schemaObject.type);
      updateLogicalDigest(digest, schemaObject.name);
      updateLogicalDigest(digest, schemaObject.tbl_name);
      updateLogicalDigest(digest, schemaObject.sql);
      if (schemaObject.type !== "table") continue;
      const columns = database
        .prepare(
          `SELECT cid, name, type, "notnull" AS not_null,
                  dflt_value, pk, hidden
           FROM pragma_table_xinfo(?)
           ORDER BY cid`,
        )
        .all(schemaObject.name);
      for (const column of columns) {
        updateLogicalDigest(digest, JSON.stringify(column));
      }
      const selectable = columns.filter((column) => Number(column.hidden) !== 1);
      if (selectable.length === 0) continue;
      const columnSql = selectable
        .map((column) => quoteSqliteIdentifier(column.name))
        .join(", ");
      const orderSql = selectable
        .map((column) => `${quoteSqliteIdentifier(column.name)} COLLATE BINARY`)
        .join(", ");
      const statement = database
        .prepare(
          `SELECT ${columnSql}
           FROM ${quoteSqliteIdentifier(schemaObject.name)}
           ORDER BY ${orderSql}`,
        )
        .raw(true)
        .safeIntegers(true);
      const columnNames = selectable.map((column) => column.name);
      for (const row of statement.iterate()) {
        updateLogicalDigest(digest, "row");
        const normalizedRow = normalizeRecoveryPrivateMaterialIdentityRow(
          schemaObject.name,
          columnNames,
          row,
          privateMaterialIdentityContext,
        );
        for (const value of normalizedRow) updateLogicalDigest(digest, value);
      }
    }
    database.exec("COMMIT");
    return `sha256:${digest.digest("hex")}`;
  } catch (error) {
    try {
      if (database?.inTransaction) database.exec("ROLLBACK");
    } catch {
      // The original bounded integrity failure remains authoritative.
    }
    if (error instanceof PublicDatabaseBootstrapError) throw error;
    throw new PublicDatabaseBootstrapError(
      "database_integrity_failed",
      error,
    );
  } finally {
    database?.close();
  }
}

function updateLogicalDigest(digest, value) {
  let encoded;
  if (value === null) encoded = "null";
  else if (Buffer.isBuffer(value)) encoded = `blob:${value.toString("hex")}`;
  else if (typeof value === "bigint") encoded = `integer:${value}`;
  else if (typeof value === "number") {
    encoded = `real:${Object.is(value, -0) ? "-0" : String(value)}`;
  } else encoded = `${typeof value}:${String(value)}`;
  digest.update(`${Buffer.byteLength(encoded, "utf8")}:`);
  digest.update(encoded, "utf8");
}

function quoteSqliteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export async function restoreRuntimeDatabase({
  databasePath,
  backupDirectory,
  repositoryRoot,
  instanceId,
  repositoryFingerprint = null,
  runtimeOwnershipGeneration = null,
  databaseOverrideActive = false,
  selectedBackupId = "latest",
  expectedSelectedBackupIdentity = null,
  expectedSelectedBackupDirectoryIdentity = null,
  expectedSelectedStateDirectoryIdentity = null,
  expectedSelectedManifestFileIdentity = null,
  expectedSelectedPayloadFileIdentity = null,
  requirePackageIdentityGuard = false,
  targetCompatibility = null,
  dependencies = {},
} = {}) {
  if (
    !databasePath ||
    !backupDirectory ||
    !repositoryRoot ||
    !instanceId ||
    !path.isAbsolute(databasePath) ||
    !path.isAbsolute(backupDirectory) ||
    typeof requirePackageIdentityGuard !== "boolean"
  ) {
    throw new PublicDatabaseBootstrapError("database_path_invalid");
  }
  if (
    selectedBackupId !== "latest" &&
    !/^recovery:[0-9a-f-]{36}$/iu.test(selectedBackupId)
  ) {
    throw new PublicDatabaseBootstrapError("restore_validation_failed");
  }
  if (
    (expectedSelectedBackupIdentity !== null &&
      !/^sha256:[a-f0-9]{64}$/u.test(expectedSelectedBackupIdentity)) ||
    !validDirectoryIdentityOrNull(expectedSelectedBackupDirectoryIdentity) ||
    !validDirectoryIdentityOrNull(expectedSelectedStateDirectoryIdentity) ||
    !validDirectoryIdentityOrNull(expectedSelectedManifestFileIdentity) ||
    !validDirectoryIdentityOrNull(expectedSelectedPayloadFileIdentity)
  ) {
    throw new PublicDatabaseBootstrapError("restore_validation_failed");
  }

  const operationId = `${process.pid}-${randomUUID()}`;
  const effectiveRepositoryFingerprint =
    repositoryFingerprint ??
    createHash("sha256").update(repositoryRoot).digest("hex");
  const compatibility = normalizeTargetCompatibility(
    targetCompatibility,
    effectiveRepositoryFingerprint,
  );
  const stagingPath = `${databasePath}.augnes-stage-${operationId}`;
  const rollbackPath = `${databasePath}.augnes-rollback-${operationId}`;
  const lockPath = bootstrapJournalPath(databasePath);
  const ownershipNonce = randomBytes(24).toString("hex");
  let lock = null;
  let ownerProbe = null;
  let safetyBackup = null;
  let retainBootstrapLock = false;
  let publicationControl = null;
  let publicationOwnerTransferred = false;

  try {
    ensureDatabaseDirectory({
      databaseDirectory: path.dirname(databasePath),
      repositoryRoot,
      databaseOverrideActive,
    });
    assertDatabaseFileSafe(databasePath);
    assertNoOrphanedDatabaseSideFiles(databasePath);
    if (existsSync(databasePath)) {
      try {
        inspectSafetyRecoveryDatabaseFile(databasePath);
      } catch (error) {
        throw new PublicRecoveryBackupError(
          "recovery_backup_verification_failed",
          error,
        );
      }
    }
    ensureApplicationDirectory({
      directory: backupDirectory,
      repositoryRoot,
      insideRepositoryCode: "backup_path_must_be_outside_repository",
      invalidCode: "backup_directory_invalid",
    });
    ownerProbe = await startPrivateProcessOwnershipProbe({
      contract: DATABASE_BOOTSTRAP_CONTRACT,
      schemaVersion: DATABASE_BOOTSTRAP_JOURNAL_SCHEMA_VERSION,
      repositoryFingerprint: effectiveRepositoryFingerprint,
      ownershipId: operationId,
      ownershipNonce,
    });
    lock = acquireBootstrapLock({
      lockPath,
      databasePath,
      repositoryFingerprint: effectiveRepositoryFingerprint,
      runtimeInstanceId: instanceId,
      runtimeOwnershipGeneration,
      operationId,
      ownershipNonce,
      ownerProof: ownerProbe,
      stagingPath,
      rollbackPath,
      sourceWasMissing: !existsSync(databasePath),
      operationKind: "restore",
      targetCompatibility: compatibility,
    });
    notifyJournalPhase(dependencies, lock);

    const inventory = listRecoveryBackups({
      backupDirectory,
      applicationScopeFingerprint: compatibility.applicationScopeFingerprint,
      inspectDatabase: inspectRecoveryDatabaseFile,
    });
    let selected = selectRecoveryBackup(inventory, selectedBackupId);
    if (
      (expectedSelectedBackupIdentity !== null &&
        selected.manifest.backup_identity !== expectedSelectedBackupIdentity) ||
      (expectedSelectedBackupDirectoryIdentity !== null &&
        (selected.backupDirectoryIdentity.dev !==
          expectedSelectedBackupDirectoryIdentity.dev ||
          selected.backupDirectoryIdentity.ino !==
            expectedSelectedBackupDirectoryIdentity.ino)) ||
      (expectedSelectedStateDirectoryIdentity !== null &&
        (selected.stateDirectoryIdentity.dev !==
          expectedSelectedStateDirectoryIdentity.dev ||
          selected.stateDirectoryIdentity.ino !==
            expectedSelectedStateDirectoryIdentity.ino)) ||
      (expectedSelectedManifestFileIdentity !== null &&
        (selected.manifestFileIdentity.dev !==
          expectedSelectedManifestFileIdentity.dev ||
          selected.manifestFileIdentity.ino !==
            expectedSelectedManifestFileIdentity.ino)) ||
      (expectedSelectedPayloadFileIdentity !== null &&
        (selected.payloadFileIdentity.dev !==
          expectedSelectedPayloadFileIdentity.dev ||
          selected.payloadFileIdentity.ino !==
            expectedSelectedPayloadFileIdentity.ino))
    ) {
      throw new PublicDatabaseBootstrapError("restore_backup_changed");
    }
    let originalFamily = existsSync(databasePath)
      ? readDatabaseFamilyIdentity(databasePath)
      : null;
    const originalLogicalIdentity = existsSync(databasePath)
      ? readStableLogicalDatabaseIdentity(databasePath)
      : null;
    updateBootstrapJournal(lockPath, lock, {
      selected_backup_id: selected.manifest.backup_id,
      selected_backup_identity: selected.manifest.backup_identity,
      selected_backup_directory_identity: selected.backupDirectoryIdentity,
      original_family: originalFamily,
      original_logical_identity: originalLogicalIdentity,
    });

    if (existsSync(databasePath)) {
      const backupUuid = randomUUID();
      const backupCreatedAt = new Date().toISOString();
      const safetyBackupBasename = recoveryBackupBasename(
        backupCreatedAt,
        backupUuid,
      );
      const safetyBackupStagingBasename = `.augnes-recovery-incomplete-${backupUuid}`;
      updateBootstrapJournal(lockPath, lock, {
        recovery_backup_basename: safetyBackupBasename,
        recovery_backup_staging_basename: safetyBackupStagingBasename,
      });
      safetyBackup = await createRecoveryBackup({
        databasePath,
        backupDirectory,
        applicationScopeFingerprint: compatibility.applicationScopeFingerprint,
        sourceApplication: compatibility.sourceApplication,
        reason: "pre_restore_safety",
        inspectDatabase: inspectSafetyRecoveryDatabaseFile,
        allowIneligible: true,
        protectedBackupIds: [selected.manifest.backup_id],
        backupBasename: safetyBackupBasename,
        stagingBasename: safetyBackupStagingBasename,
        now: () => new Date(backupCreatedAt),
        dependencies: {
          backupDatabase: dependencies.backupDatabase,
          afterStagingCreated: ({ stagingPath, stagingIdentity }) => {
            dependencies.beforeRecoveryBackupStagingRecorded?.({
              stagingPath,
              stagingIdentity,
            });
            updateBootstrapJournal(lockPath, lock, {
              recovery_backup_staging_identity: stagingIdentity,
            });
          },
          afterBackupPublished: (published) => {
            dependencies.afterRecoveryBackupPublished?.(published);
          },
        },
      });
      originalFamily = stabilizeSourceFamilyAgainstBackup({
        databasePath,
        backupPayloadPath: safetyBackup.payloadPath,
        originalFamily,
        originalLogicalIdentity,
      });
      updateBootstrapJournal(lockPath, lock, {
        phase: "backup_ready",
        original_family: originalFamily,
        recovery_backup_id: safetyBackup.manifest.backup_id,
        recovery_backup_identity: safetyBackup.manifest.backup_identity,
      });
      notifyJournalPhase(dependencies, lock);
      if (!databaseFamilyMatches(databasePath, originalFamily)) {
        throw new PublicDatabaseBootstrapError("update_ownership_conflict");
      }
    }

    selected = validateRecoveryBackup({
      backupPath: selected.backupPath,
      expectedApplicationScopeFingerprint:
        compatibility.applicationScopeFingerprint,
      inspectDatabase: inspectRecoveryDatabaseFile,
      expectedBackupId: selected.manifest.backup_id,
      expectedBackupIdentity: selected.manifest.backup_identity,
      expectedBackupDirectoryIdentity: selected.backupDirectoryIdentity,
      expectedStateDirectoryIdentity: selected.stateDirectoryIdentity,
      expectedManifestFileIdentity: selected.manifestFileIdentity,
      expectedPayloadFileIdentity: selected.payloadFileIdentity,
    });
    const stagedInspection = await stageRecoveryBackupDatabase({
      selectedBackup: selected,
      targetPath: stagingPath,
      inspectDatabase: inspectRecoveryDatabaseFile,
      migrateDatabase:
        dependencies.migrateDatabase ?? applyCanonicalDatabaseMigrations,
      dependencies: {
        backupDatabase: dependencies.restoreBackupDatabase,
        afterTargetCreated: (stagingFileIdentity) => {
          dependencies.beforeStagingFileIdentityRecorded?.({
            stagingPath,
            stagingFileIdentity,
          });
          updateBootstrapJournal(lockPath, lock, {
            staging_file_identity: stagingFileIdentity,
          });
        },
      },
    });
    if (requirePackageIdentityGuard) {
      requireRuntimePackageIdentityGuard(stagingPath);
    }
    const verifiedStagedInspection = inspectRecoveryDatabaseFile(stagingPath);
    const stagedFamily = readDatabaseFamilyIdentity(stagingPath);
    updateBootstrapJournal(lockPath, lock, {
      staged_family: stagedFamily,
    });
    if (dependencies.verifyPreparedDatabase) {
      try {
        dependencies.verifyPreparedDatabase(stagingPath);
      } catch (error) {
        throw new PublicDatabaseBootstrapError(
          "database_integrity_failed",
          error,
        );
      }
    }
    if (dependencies.verifyRequiredReaders) {
      try {
        dependencies.verifyRequiredReaders(stagingPath);
      } catch (error) {
        throw new PublicDatabaseBootstrapError(
          "database_reader_incompatible",
          error,
        );
      }
    }
    if (
      stagedInspection.schema_signature !== compatibility.schemaSignature ||
      verifiedStagedInspection.schema_signature !==
        compatibility.schemaSignature
    ) {
      throw new PublicDatabaseBootstrapError("restore_database_incompatible");
    }
    updateBootstrapJournal(lockPath, lock, {
      phase: "staging_ready",
      source_was_missing: !existsSync(databasePath),
      original_family: originalFamily,
      staged_family: stagedFamily,
    });
    notifyJournalPhase(dependencies, lock);

    if (existsSync(databasePath)) {
      const replacement = replaceMigratedDatabase({
        databasePath,
        stagingPath,
        rollbackPath,
        lockPath,
        lock,
        dependencies,
      });
      if (replacement.restartVerificationPending) {
        retainBootstrapLock = true;
        publicationOwnerTransferred = true;
        publicationControl = createDeferredPublicationControl({
          databasePath,
          stagingPath,
          rollbackPath,
          lockPath,
          lock,
          ownerProbe,
          dependencies,
        });
      }
    } else {
      replaceNewDatabase({
        databasePath,
        stagingPath,
        lockPath,
        lock,
        dependencies,
      });
      try {
        inspectRecoveryDatabaseFile(databasePath);
        updateBootstrapJournal(lockPath, lock, {
          phase: "published_verified",
          published_family: readDatabaseFamilyIdentity(databasePath),
        });
        notifyJournalPhase(dependencies, lock);
        dependencies.afterPublishedVerified?.({
          databasePath,
          operationKind: lock.operation_kind,
          recoveryActionId: lock.recovery_action_id,
          recoveryBackupId: lock.recovery_backup_id,
          recoveryBackupIdentity: lock.recovery_backup_identity,
          recoveryBackupDirectoryIdentity:
            lock.recovery_backup_staging_identity,
          selectedBackupId: lock.selected_backup_id,
          selectedBackupIdentity: lock.selected_backup_identity,
        });
        updateBootstrapJournal(lockPath, lock, { phase: "cleanup_complete" });
        notifyJournalPhase(dependencies, lock);
      } catch (error) {
        removeUnverifiedNewPublicationOrRetain({
          databasePath,
          lock,
          cause: error,
        });
      }
    }
    const published = inspectRecoveryDatabaseFile(databasePath);
    return {
      databaseState: "restored",
      schemaVersion: "current",
      resolvedDatabasePath: databasePath,
      selectedBackupId: selected.manifest.backup_id,
      safetyBackupCreated: safetyBackup !== null,
      safetyBackupRecoveryEligible:
        safetyBackup?.manifest.database.recovery_eligible === true,
      safetyBackupPath: safetyBackup?.backupPath ?? null,
      safetyBackupId: safetyBackup?.manifest.backup_id ?? null,
      safetyBackupIdentity: safetyBackup?.manifest.backup_identity ?? null,
      recoveryBackupCreated: safetyBackup !== null,
      recoveryBackupPath: safetyBackup?.backupPath ?? null,
      recoveryInspection: published,
      publicationControl,
    };
  } catch (error) {
    if (publicationControl !== null) {
      try {
        await publicationControl.rollback();
        publicationControl = null;
        publicationOwnerTransferred = false;
        retainBootstrapLock = false;
      } catch (rollbackError) {
        const failure = normalizeBootstrapError(rollbackError);
        failure.retainBootstrapLock = true;
        throw failure;
      }
    }
    let cleanupFailure = null;
    try {
      cleanupRecordedOperationFamily(
        stagingPath,
        lock?.staged_family ?? null,
        lock?.staging_file_identity ?? null,
      );
    } catch (cleanupError) {
      cleanupFailure = cleanupError;
    }
    const failure = normalizeBootstrapError(cleanupFailure ?? error);
    if (cleanupFailure) failure.retainBootstrapLock = true;
    retainBootstrapLock = failure.retainBootstrapLock === true;
    failure.recoveryBackupCreated = safetyBackup !== null;
    failure.safetyBackupCreated = safetyBackup !== null;
    failure.recoveryBackupId = safetyBackup?.manifest.backup_id ?? null;
    failure.recoveryBackupIdentity =
      safetyBackup?.manifest.backup_identity ?? null;
    throw failure;
  } finally {
    if (lock && !retainBootstrapLock) releaseBootstrapLock(lockPath, lock);
    if (!publicationOwnerTransferred) await ownerProbe?.close();
  }
}

function classifyExistingDatabase(databasePath) {
  const inspection = inspectRecoveryDatabaseFile(databasePath, {
    allowLegacyPrivateMaterial: true,
  });
  return {
    state: inspection.schema_classification,
    schemaVersion:
      inspection.schema_classification === "current" ? "current" : "outdated",
    targetSignature: canonicalStructuralSchemaContractSignature(),
  };
}

function createCurrentDatabase(
  stagingPath,
  dependencies,
  { requirePackageIdentityGuard = false } = {},
) {
  let database;
  try {
    createRestrictedEmptyFile(stagingPath);
    database = new Database(stagingPath);
    setRestrictiveFileMode(stagingPath);
    database.pragma("journal_mode = DELETE");
    database.pragma("foreign_keys = ON");
    (dependencies.migrateDatabase ?? applyCanonicalDatabaseMigrations)(
      database,
    );
    if (requirePackageIdentityGuard) {
      requireCanonicalPackageIdentityGuard(database, new Date().toISOString());
    }
  } catch (error) {
    if (error instanceof PublicDatabaseBootstrapError) throw error;
    throw new PublicDatabaseBootstrapError("database_migration_failed", error);
  } finally {
    database?.close();
  }
  verifyPreparedDatabase(stagingPath, {});
}

function verifyPreparedDatabase(stagingPath, dependencies) {
  if (dependencies.verifyPreparedDatabase) {
    try {
      dependencies.verifyPreparedDatabase(stagingPath);
    } catch (error) {
      throw new PublicDatabaseBootstrapError(
        "database_integrity_failed",
        error,
      );
    }
  }
  const verification = inspectRecoveryDatabaseFile(stagingPath);
  if (verification.schema_classification !== "current") {
    throw new PublicDatabaseBootstrapError("database_schema_unsupported");
  }
  return {
    schemaVersion: "current",
    schemaSignature: verification.schema_signature,
    recoveryInspection: verification,
  };
}

export function verifyDatabaseFile(databasePath) {
  let database;
  try {
    database = new Database(databasePath, {
      readonly: true,
      fileMustExist: true,
    });
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

export function inspectRecoveryDatabaseFile(
  databasePath,
  {
    allowLegacyPrivateMaterial = false,
    allowLegacyRecoveryAdoptionSource = false,
  } = {},
) {
  if (
    typeof allowLegacyPrivateMaterial !== "boolean" ||
    typeof allowLegacyRecoveryAdoptionSource !== "boolean"
  ) {
    throw new PublicDatabaseBootstrapError("database_open_failed");
  }
  assertDatabaseFileSafe(databasePath);
  let source;
  let serialized;
  let sourceSignature;
  let sourceLedger = null;
  let sourceLedgerCurrent = false;
  let sourcePackageIdentityGuardCurrent = false;
  let sourcePrivateMaterialCurrent = false;
  let canonicalRecordCount = 0;
  try {
    source = new Database(databasePath, {
      readonly: true,
      fileMustExist: true,
    });
    verifyOpenDatabase(source);
    sourceSignature = structuralSchemaContractSignature(source);
    sourceLedger = readCanonicalDatabaseMigrationLedger(source);
    if (sourceLedger !== null) {
      try {
        verifyCanonicalDatabaseMigrationLedger(source);
        sourceLedgerCurrent = true;
      } catch {
        sourceLedgerCurrent = false;
      }
    }
    try {
      verifyCanonicalPackageIdentityGuard(source);
      sourcePackageIdentityGuardCurrent = true;
    } catch {
      sourcePackageIdentityGuardCurrent = false;
    }
    sourcePrivateMaterialCurrent =
      inspectRecoveryPrivateMaterialBoundary(source).current;
    if (!sourcePrivateMaterialCurrent && !allowLegacyPrivateMaterial) {
      throw new PublicDatabaseBootstrapError(
        "database_private_material_unsupported",
      );
    }
    canonicalRecordCount = verifyCanonicalDatabaseInvariants(source, {
      requireCurrentLedger: false,
    });
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
    applyCanonicalDatabaseMigrations(clone);
    if (!inspectRecoveryPrivateMaterialBoundary(clone).current) {
      throw new PublicDatabaseBootstrapError(
        "database_private_material_unsupported",
      );
    }
    verifyOpenDatabase(clone);
    const migratedSignature = structuralSchemaContractSignature(clone);
    const canonicalSignature = canonicalStructuralSchemaContractSignature();
    if (
      sourceSignature === canonicalSignature &&
      (!sourceLedgerCurrent || !sourcePackageIdentityGuardCurrent)
    ) {
      throw new PublicDatabaseBootstrapError("database_schema_unsupported");
    }
    if (
      sourceSignature !== canonicalSignature &&
      ![
        ...CANONICAL_DATABASE_SUPPORTED_SOURCE_SCHEMA_SIGNATURES,
        ...(allowLegacyRecoveryAdoptionSource
          ? LEGACY_RECOVERY_ADOPTION_SOURCE_SCHEMA_SIGNATURES
          : []),
      ].includes(sourceSignature)
    ) {
      throw new PublicDatabaseBootstrapError("database_schema_unsupported");
    }
    if (migratedSignature !== canonicalSignature) {
      throw new PublicDatabaseBootstrapError("database_schema_unsupported");
    }
    verifyCanonicalDatabaseMigrationLedger(clone);
    verifyCanonicalDatabaseInvariants(clone, { requireCurrentLedger: true });
    const current =
      sourceSignature === canonicalSignature &&
      sourceLedgerCurrent &&
      sourcePackageIdentityGuardCurrent &&
      sourcePrivateMaterialCurrent;
    return {
      schema_contract: CANONICAL_DATABASE_SCHEMA_CONTRACT,
      schema_signature: sourceSignature,
      schema_classification: current ? "current" : "old",
      migration_contract: CANONICAL_DATABASE_MIGRATION_CONTRACT,
      migration_contract_version: CANONICAL_DATABASE_MIGRATION_CONTRACT_VERSION,
      migration_ids: sourceLedgerCurrent
        ? sourceLedger.map((entry) => entry.migration_id)
        : [],
      recovery_eligible: true,
      record_contract: CANONICAL_DATABASE_RECORD_CONTRACT,
      record_contract_version: CANONICAL_DATABASE_RECORD_CONTRACT_VERSION,
      reader_contracts: [...DATABASE_READER_CONTRACTS],
      canonical_record_count: canonicalRecordCount,
    };
  } catch (error) {
    if (error instanceof PublicDatabaseBootstrapError) throw error;
    throw new PublicDatabaseBootstrapError(
      "database_schema_unsupported",
      error,
    );
  } finally {
    clone?.close();
  }
}

export function inspectRecoverySourceDatabaseFile(databasePath) {
  return inspectRecoveryDatabaseFile(databasePath, {
    allowLegacyPrivateMaterial: true,
  });
}

export function inspectLegacyRecoveryAdoptionSourceDatabaseFile(databasePath) {
  return inspectRecoveryDatabaseFile(databasePath, {
    allowLegacyPrivateMaterial: true,
    allowLegacyRecoveryAdoptionSource: true,
  });
}

export function inspectRuntimePackageIdentityGuard(databasePath) {
  assertDatabaseFileSafe(databasePath);
  let database;
  try {
    database = new Database(databasePath, {
      readonly: true,
      fileMustExist: true,
    });
    verifyOpenDatabase(database);
    return verifyCanonicalPackageIdentityGuard(database);
  } catch (error) {
    if (error instanceof PublicDatabaseBootstrapError) throw error;
    throw new PublicDatabaseBootstrapError(
      "database_package_identity_guard_invalid",
      error,
    );
  } finally {
    database?.close();
  }
}

export function requireRuntimePackageIdentityGuard(
  databasePath,
  updatedAt = new Date().toISOString(),
) {
  assertDatabaseFileSafe(databasePath);
  let database;
  try {
    database = new Database(databasePath, { fileMustExist: true });
    database.pragma("journal_mode = DELETE");
    database.pragma("foreign_keys = ON");
    const requireIdentity = database.transaction(() =>
      requireCanonicalPackageIdentityGuard(database, updatedAt),
    );
    const guard = requireIdentity();
    verifyOpenDatabase(database);
    return guard;
  } catch (error) {
    if (error instanceof PublicDatabaseBootstrapError) throw error;
    throw new PublicDatabaseBootstrapError(
      "database_package_identity_guard_update_failed",
      error,
    );
  } finally {
    database?.close();
  }
}

export function inspectSafetyRecoveryDatabaseFile(databasePath) {
  try {
    return inspectRecoveryDatabaseFile(databasePath);
  } catch (error) {
    if (
      error instanceof PublicDatabaseBootstrapError &&
      error.code === "database_schema_unsupported"
    ) {
      return inspectKnownPreservedRecoveryDatabaseFile(databasePath);
    }
    throw error;
  }
}

export function inspectKnownPreservedRecoveryDatabaseFile(databasePath) {
  assertDatabaseFileSafe(databasePath);
  let database;
  try {
    database = new Database(databasePath, {
      readonly: true,
      fileMustExist: true,
    });
    verifyOpenDatabase(database);
    const schemaSignature = structuralSchemaContractSignature(database);
    if (
      schemaSignature !== canonicalStructuralSchemaContractSignature() &&
      schemaSignature !== canonicalMissingPackageIdentityGuardSignature() &&
      !CANONICAL_DATABASE_SUPPORTED_SOURCE_SCHEMA_SIGNATURES.includes(
        schemaSignature,
      )
    ) {
      throw new PublicDatabaseBootstrapError("database_schema_unsupported");
    }
    if (!inspectRecoveryPrivateMaterialBoundary(database).current) {
      throw new PublicDatabaseBootstrapError(
        "database_private_material_unsupported",
      );
    }
    const migrationLedger = verifyCanonicalDatabaseMigrationLedger(database);
    const canonicalRecordCount = verifyCanonicalDatabaseInvariants(database, {
      requireCurrentLedger: false,
    });
    return {
      schema_contract: CANONICAL_DATABASE_SCHEMA_CONTRACT,
      schema_signature: schemaSignature,
      schema_classification: "incompatible",
      migration_contract: CANONICAL_DATABASE_MIGRATION_CONTRACT,
      migration_contract_version: CANONICAL_DATABASE_MIGRATION_CONTRACT_VERSION,
      migration_ids: migrationLedger.map((entry) => entry.migration_id),
      recovery_eligible: false,
      record_contract: CANONICAL_DATABASE_RECORD_CONTRACT,
      record_contract_version: CANONICAL_DATABASE_RECORD_CONTRACT_VERSION,
      reader_contracts: [...DATABASE_READER_CONTRACTS],
      canonical_record_count: canonicalRecordCount,
    };
  } catch (error) {
    if (error instanceof PublicDatabaseBootstrapError) throw error;
    throw new PublicDatabaseBootstrapError("database_open_failed", error);
  } finally {
    database?.close();
  }
}

function verifyCanonicalDatabaseInvariants(
  database,
  { requireCurrentLedger = true } = {},
) {
  if (requireCurrentLedger) {
    verifyCanonicalDatabaseMigrationLedger(database);
    verifyCanonicalPackageIdentityGuard(database);
  }
  if (!databaseTableExists(database, "vnext_core_records")) return 0;

  let canonicalRecordCount;
  try {
    canonicalRecordCount = validateRecoveryCanonicalRecords(database);
  } catch (error) {
    if (error instanceof PublicRecoveryBackupError) {
      throw new PublicDatabaseBootstrapError(error.code, error);
    }
    throw error;
  }

  const rows = database
    .prepare(
      `SELECT record_kind, record_id, workspace_id, project_id, fingerprint,
              idempotency_key, payload_json
       FROM vnext_core_records
       ORDER BY record_kind, record_id`,
    )
    .all();
  for (const row of rows) {
    let payload;
    try {
      payload = JSON.parse(row.payload_json);
    } catch (error) {
      throw new PublicDatabaseBootstrapError(
        "database_canonical_invariant_failed",
        error,
      );
    }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new PublicDatabaseBootstrapError(
        "database_canonical_invariant_failed",
      );
    }
    if (
      (Object.hasOwn(payload, "workspace_id") &&
        payload.workspace_id !== row.workspace_id) ||
      (Object.hasOwn(payload, "project_id") &&
        payload.project_id !== row.project_id)
    ) {
      throw new PublicDatabaseBootstrapError(
        "database_cross_project_reference",
      );
    }
    if (
      !/^sha256:[a-f0-9]{64}$/u.test(row.fingerprint) ||
      (row.idempotency_key !== null &&
        !/^sha256:[a-f0-9]{64}$/u.test(row.idempotency_key))
    ) {
      throw new PublicDatabaseBootstrapError(
        "database_canonical_invariant_failed",
      );
    }
  }

  verifySemanticProjectionLineage(database);
  // The bundled canonical validator above invokes the production Project Home,
  // Semantic Workbench, and shared Inspector reader cores. Keep this local
  // check limited to registry linkage instead of advertising JSON parsing as
  // product-reader verification.
  verifyProjectRegistryBindings(database);
  return canonicalRecordCount;
}

function verifySemanticProjectionLineage(database) {
  if (databaseTableExists(database, "vnext_semantic_state_entries")) {
    const missing = database
      .prepare(
        `SELECT COUNT(*) AS count
         FROM vnext_semantic_state_entries AS state
         LEFT JOIN vnext_core_records AS receipt
           ON receipt.record_kind = 'state_transition_receipt'
          AND receipt.record_id = state.source_transition_receipt_id
          AND receipt.workspace_id = state.workspace_id
          AND receipt.project_id = state.project_id
          AND receipt.fingerprint = state.source_transition_receipt_fingerprint
         LEFT JOIN vnext_core_records AS proposal
           ON proposal.record_kind = 'episode_delta_proposal'
          AND proposal.record_id = state.source_proposal_id
          AND proposal.workspace_id = state.workspace_id
          AND proposal.project_id = state.project_id
          AND proposal.fingerprint = state.source_proposal_fingerprint
         WHERE receipt.record_id IS NULL OR proposal.record_id IS NULL`,
      )
      .get().count;
    if (missing !== 0) {
      throw new PublicDatabaseBootstrapError(
        "database_canonical_invariant_failed",
      );
    }
  }
  if (databaseTableExists(database, "vnext_semantic_target_heads")) {
    const missing = database
      .prepare(
        `SELECT COUNT(*) AS count
         FROM vnext_semantic_target_heads AS head
         LEFT JOIN vnext_core_records AS receipt
           ON receipt.record_kind = 'state_transition_receipt'
          AND receipt.record_id = head.source_transition_receipt_id
          AND receipt.workspace_id = head.workspace_id
          AND receipt.project_id = head.project_id
          AND receipt.fingerprint = head.source_transition_receipt_fingerprint
         WHERE receipt.record_id IS NULL`,
      )
      .get().count;
    if (missing !== 0) {
      throw new PublicDatabaseBootstrapError(
        "database_canonical_invariant_failed",
      );
    }
  }
}

function verifyProjectRegistryBindings(database) {
  if (
    !databaseTableExists(database, "vnext_project_identities") ||
    !databaseTableExists(database, "vnext_active_project_selections")
  ) {
    return;
  }
  const missingActiveProject = database
    .prepare(
      `SELECT COUNT(*) AS count
       FROM vnext_active_project_selections AS active
       LEFT JOIN vnext_project_identities AS project
         ON project.workspace_id = active.workspace_id
        AND project.project_id = active.project_id
       WHERE project.project_id IS NULL`,
    )
    .get().count;
  if (missingActiveProject !== 0) {
    throw new PublicDatabaseBootstrapError("database_reader_incompatible");
  }
}

function databaseTableExists(database, tableName) {
  return Boolean(
    database
      .prepare(
        "SELECT name FROM sqlite_schema WHERE type = 'table' AND name = ?",
      )
      .get(tableName),
  );
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

function replaceNewDatabase({
  stagingPath,
  databasePath,
  lockPath,
  lock,
  dependencies,
}) {
  let stagingMoved = false;
  try {
    dependencies.beforeReplacement?.({ databasePath, stagingPath });
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
    dependencies.afterStagingPublished?.({ databasePath, stagingPath });
  } catch (error) {
    if (stagingMoved) {
      removeOperationOwnedPublishedFamily(
        databasePath,
        lock.published_family ?? lock.staged_family,
      );
    }
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
    dependencies.beforeReplacement?.({ databasePath, stagingPath });
    if (!databaseFamilyMatches(databasePath, lock.original_family)) {
      throw new PublicDatabaseBootstrapError("update_ownership_conflict");
    }
    updateBootstrapJournal(lockPath, lock, { phase: "moving_original" });
    notifyJournalPhase(dependencies, lock);
    renameSync(databasePath, rollbackPath);
    originalMoved = true;
    for (const suffix of SQLITE_SIDE_SUFFIXES) {
      renameRegularFileIfPresent(
        `${databasePath}${suffix}`,
        `${rollbackPath}${suffix}`,
      );
    }
    updateBootstrapJournal(lockPath, lock, {
      phase: "original_moved",
      rollback_family: readDatabaseFamilyIdentity(rollbackPath),
    });
    notifyJournalPhase(dependencies, lock);
    dependencies.afterOriginalMoved?.({
      databasePath,
      stagingPath,
      rollbackPath,
    });
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
    dependencies.afterStagingPublished?.({
      databasePath,
      stagingPath,
      rollbackPath,
    });
    dependencies.verifyPublishedDatabase?.(databasePath);
    const publishedInspection = inspectRecoveryDatabaseFile(databasePath);
    if (publishedInspection.schema_classification !== "current") {
      throw new PublicDatabaseBootstrapError("database_schema_unsupported");
    }
    updateBootstrapJournal(lockPath, lock, {
      phase: "published_verified",
      published_family: readDatabaseFamilyIdentity(databasePath),
    });
    notifyJournalPhase(dependencies, lock);
    dependencies.afterPublishedVerified?.({
      databasePath,
      operationKind: lock.operation_kind,
      recoveryActionId: lock.recovery_action_id,
      recoveryBackupId: lock.recovery_backup_id,
      recoveryBackupIdentity: lock.recovery_backup_identity,
      recoveryBackupDirectoryIdentity:
        lock.recovery_backup_staging_identity,
      selectedBackupId: lock.selected_backup_id,
      selectedBackupIdentity: lock.selected_backup_identity,
    });
    if (dependencies.deferPublicationCleanup === true) {
      updateBootstrapJournal(lockPath, lock, {
        phase: "restart_verification_pending",
      });
      notifyJournalPhase(dependencies, lock);
      return { restartVerificationPending: true };
    }
  } catch (error) {
    let recoveryError = null;
    if (stagingMoved) {
      try {
        removeOperationOwnedPublishedFamily(
          databasePath,
          lock.published_family ?? lock.staged_family,
        );
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
          renameRegularFileIfPresent(
            `${rollbackPath}${suffix}`,
            `${databasePath}${suffix}`,
          );
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
      throw new PublicDatabaseBootstrapError(
        "database_bootstrap_failed",
        recoveryError,
      );
    }
    if (!originalMoved && error instanceof PublicDatabaseBootstrapError) {
      throw error;
    }
    throw new PublicDatabaseBootstrapError("database_bootstrap_failed", error);
  }
  try {
    removeExactOperationFamily(rollbackPath, lock.rollback_family);
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
  return { restartVerificationPending: false };
}

function createDeferredPublicationControl({
  databasePath,
  stagingPath,
  rollbackPath,
  lockPath,
  lock,
  ownerProbe,
  dependencies,
}) {
  let settled = false;

  async function closeOwnerProbe() {
    await ownerProbe?.close();
  }

  return Object.freeze({
    async commit() {
      if (settled) {
        throw new PublicDatabaseBootstrapError(
          "database_reconciliation_required",
        );
      }
      try {
        assertDatabaseFamilyMatches(databasePath, lock.published_family);
        assertJournalPublishedDatabase(databasePath, lock);
        updateBootstrapJournal(lockPath, lock, { phase: "cleanup_complete" });
        notifyJournalPhase(dependencies, lock);
        cleanupRecordedRollbackFamily(rollbackPath, lock.original_family);
        removeJournalStagingFamily(stagingPath, lock);
        releaseBootstrapLock(lockPath, lock);
        settled = true;
        return { result: "database_verified_publish_committed" };
      } finally {
        await closeOwnerProbe();
      }
    },

    async rollback() {
      if (settled) {
        throw new PublicDatabaseBootstrapError(
          "database_reconciliation_required",
        );
      }
      try {
        updateBootstrapJournal(lockPath, lock, {
          phase: "restoring_original",
        });
        notifyJournalPhase(dependencies, lock);
        restoreOriginalFamily({
          databasePath,
          rollbackPath,
          expectedOriginal: lock.original_family,
          expectedPublished: lock.published_family,
        });
        removeJournalStagingFamily(stagingPath, lock);
        updateBootstrapJournal(lockPath, lock, {
          phase: "original_restored",
          restored_family: readDatabaseFamilyIdentity(databasePath),
        });
        notifyJournalPhase(dependencies, lock);
        releaseBootstrapLock(lockPath, lock);
        settled = true;
        return {
          result: "database_rollback_restored",
          inspection: inspectRecoverySourceDatabaseFile(databasePath),
        };
      } finally {
        await closeOwnerProbe();
      }
    },
  });
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

function assertNoOrphanedDatabaseSideFiles(databasePath) {
  if (existsSync(databasePath)) return;
  if (
    SQLITE_SIDE_SUFFIXES.some((suffix) => existsSync(`${databasePath}${suffix}`))
  ) {
    throw new PublicDatabaseBootstrapError(
      "database_reconciliation_required",
    );
  }
}

function acquireBootstrapLock({
  lockPath,
  databasePath,
  repositoryFingerprint,
  runtimeInstanceId,
  runtimeOwnershipGeneration,
  operationId,
  ownershipNonce,
  ownerProof,
  stagingPath,
  rollbackPath,
  sourceWasMissing,
  operationKind,
  targetCompatibility,
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
    owner_process_identity: ownerProof.ownerProcessIdentity,
    owner_probe_port: ownerProof.probePort,
    owner_probe_token: ownerProof.probeToken,
    owner_probe_binding: ownerProof.ownershipBinding,
    operation_id: operationId,
    ownership_nonce: ownershipNonce,
    database_identity_hash: databaseIdentityHash(databasePath),
    operation_kind: operationKind,
    recovery_action_id: targetCompatibility.recoveryActionId,
    target_schema_contract: CANONICAL_DATABASE_SCHEMA_CONTRACT,
    target_schema_signature: targetCompatibility.schemaSignature,
    target_migration_contract: CANONICAL_DATABASE_MIGRATION_CONTRACT,
    target_migration_contract_version:
      CANONICAL_DATABASE_MIGRATION_CONTRACT_VERSION,
    target_migration_ids: [...targetCompatibility.migrationIds],
    target_record_contract: CANONICAL_DATABASE_RECORD_CONTRACT,
    target_record_contract_version: CANONICAL_DATABASE_RECORD_CONTRACT_VERSION,
    phase: "acquired",
    stage_basename: path.basename(stagingPath),
    rollback_basename: path.basename(rollbackPath),
    journal_temp_basename: `${path.basename(lockPath)}.write-${operationId}`,
    recovery_backup_basename: null,
    recovery_backup_staging_basename: null,
    recovery_backup_staging_identity: null,
    recovery_backup_id: null,
    recovery_backup_identity: null,
    staging_file_identity: null,
    selected_backup_id: null,
    selected_backup_identity: null,
    selected_backup_directory_identity: null,
    source_was_missing: sourceWasMissing,
    original_family: null,
    original_logical_identity: null,
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
    ![
      LEGACY_DATABASE_BOOTSTRAP_JOURNAL_SCHEMA_VERSION,
      DATABASE_BOOTSTRAP_JOURNAL_SCHEMA_VERSION,
    ].includes(journal.schema_version) ||
    journal.contract !== DATABASE_BOOTSTRAP_CONTRACT
  ) {
    return unsupported("database_legacy_recovery_record");
  }
  const legacy =
    journal.schema_version === LEGACY_DATABASE_BOOTSTRAP_JOURNAL_SCHEMA_VERSION;
  if (!hasExactBootstrapJournalKeys(journal, legacy)) return unsupported();
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
    !validPrivateProcessOwnershipFields({
      ownerProcessIdentity: journal.owner_process_identity,
      probePort: journal.owner_probe_port,
      probeToken: journal.owner_probe_token,
      ownershipBinding: journal.owner_probe_binding,
    }) ||
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
    (!legacy &&
      !validDirectoryIdentityOrNull(journal.staging_file_identity)) ||
    !validFamilyIdentityOrNull(journal.rollback_family) ||
    !validFamilyIdentityOrNull(journal.published_family) ||
    !validFamilyIdentityOrNull(journal.restored_family)
  ) {
    return unsupported();
  }
  if (!validJournalPhaseShape(journal)) return unsupported();

  if (!legacy && !validCurrentJournalContractFields(journal)) {
    return unsupported();
  }

  let recoveryBackupPath = null;
  let recoveryBackupStagingPath = null;
  if (journal.recovery_backup_basename !== null) {
    if (
      typeof journal.recovery_backup_basename !== "string" ||
      path.basename(journal.recovery_backup_basename) !==
        journal.recovery_backup_basename ||
      !(legacy
        ? /^augnes-pre-migration-[A-Za-z0-9-]+\.db$/u.test(
            journal.recovery_backup_basename,
          )
        : /^augnes-recovery-\d{8}T\d{6}-[0-9a-f]{8}\.backup$/u.test(
            journal.recovery_backup_basename,
          ))
    ) {
      return unsupported();
    }
    recoveryBackupPath = path.join(
      backupDirectory,
      journal.recovery_backup_basename,
    );
  }
  if (!legacy && journal.recovery_backup_staging_basename !== null) {
    recoveryBackupStagingPath = path.join(
      backupDirectory,
      journal.recovery_backup_staging_basename,
    );
  }

  return {
    valid: true,
    legacy,
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
    recoveryBackupStagingPath,
  };
}

const LEGACY_BOOTSTRAP_JOURNAL_KEYS = Object.freeze(
  [
    "contract",
    "created_at",
    "database_identity_hash",
    "journal_temp_basename",
    "last_transition_at",
    "operation_id",
    "original_family",
    "owner_probe_binding",
    "owner_probe_port",
    "owner_probe_token",
    "owner_process_identity",
    "ownership_nonce",
    "phase",
    "published_family",
    "recovery_backup_basename",
    "repository_fingerprint",
    "restored_family",
    "rollback_basename",
    "rollback_family",
    "runtime_instance_id",
    "runtime_ownership_generation",
    "schema_version",
    "source_was_missing",
    "stage_basename",
    "staged_family",
    "supervisor_pid",
  ].sort(),
);

const CURRENT_BOOTSTRAP_JOURNAL_KEYS = Object.freeze(
  [
    ...LEGACY_BOOTSTRAP_JOURNAL_KEYS,
    "operation_kind",
    "original_logical_identity",
    "recovery_action_id",
    "recovery_backup_id",
    "recovery_backup_identity",
    "recovery_backup_staging_basename",
    "recovery_backup_staging_identity",
    "selected_backup_directory_identity",
    "selected_backup_id",
    "selected_backup_identity",
    "staging_file_identity",
    "target_migration_contract",
    "target_migration_contract_version",
    "target_migration_ids",
    "target_record_contract",
    "target_record_contract_version",
    "target_schema_contract",
    "target_schema_signature",
  ].sort(),
);

function hasExactBootstrapJournalKeys(journal, legacy) {
  const expected = legacy
    ? LEGACY_BOOTSTRAP_JOURNAL_KEYS
    : CURRENT_BOOTSTRAP_JOURNAL_KEYS;
  return JSON.stringify(Object.keys(journal).sort()) === JSON.stringify(expected);
}

function validCurrentJournalContractFields(journal) {
  const validBackupBasename =
    journal.recovery_backup_basename === null ||
    (typeof journal.recovery_backup_basename === "string" &&
      /^augnes-recovery-\d{8}T\d{6}-[0-9a-f]{8}\.backup$/u.test(
        journal.recovery_backup_basename,
      ));
  const validBackupStagingBasename =
    journal.recovery_backup_staging_basename === null ||
    (typeof journal.recovery_backup_staging_basename === "string" &&
      /^\.augnes-recovery-incomplete-[0-9a-f-]{36}$/iu.test(
        journal.recovery_backup_staging_basename,
      ));
  return (
    ["create", "update", "restore"].includes(journal.operation_kind) &&
    journal.target_schema_contract === CANONICAL_DATABASE_SCHEMA_CONTRACT &&
    journal.target_schema_signature ===
      canonicalStructuralSchemaContractSignature() &&
    journal.target_migration_contract ===
      CANONICAL_DATABASE_MIGRATION_CONTRACT &&
    journal.target_migration_contract_version ===
      CANONICAL_DATABASE_MIGRATION_CONTRACT_VERSION &&
    Array.isArray(journal.target_migration_ids) &&
    JSON.stringify(journal.target_migration_ids) ===
      JSON.stringify(CANONICAL_DATABASE_MIGRATION_IDS) &&
    journal.target_record_contract === CANONICAL_DATABASE_RECORD_CONTRACT &&
    journal.target_record_contract_version ===
      CANONICAL_DATABASE_RECORD_CONTRACT_VERSION &&
    (journal.recovery_action_id === null ||
      /^[0-9a-f-]{36}$/iu.test(journal.recovery_action_id)) &&
    (journal.original_logical_identity === null ||
      /^sha256:[a-f0-9]{64}$/u.test(journal.original_logical_identity)) &&
    validBackupBasename &&
    validBackupStagingBasename &&
    validDirectoryIdentityOrNull(journal.recovery_backup_staging_identity) &&
    ((journal.recovery_backup_basename === null &&
      journal.recovery_backup_staging_basename === null) ||
      (journal.recovery_backup_basename !== null &&
        journal.recovery_backup_staging_basename !== null)) &&
    ((journal.recovery_backup_id === null &&
      journal.recovery_backup_identity === null) ||
      (/^recovery:[0-9a-f-]{36}$/iu.test(journal.recovery_backup_id) &&
        /^sha256:[a-f0-9]{64}$/u.test(journal.recovery_backup_identity))) &&
    (journal.selected_backup_id === null ||
      /^recovery:[0-9a-f-]{36}$/iu.test(journal.selected_backup_id)) &&
    (journal.selected_backup_identity === null ||
      /^sha256:[a-f0-9]{64}$/u.test(journal.selected_backup_identity)) &&
    validDirectoryIdentityOrNull(journal.selected_backup_directory_identity) &&
    (journal.operation_kind === "restore"
      ? (typeof journal.selected_backup_id === "string" &&
          typeof journal.selected_backup_identity === "string" &&
          validDirectoryIdentityOrNull(
            journal.selected_backup_directory_identity,
          ) &&
          journal.selected_backup_directory_identity !== null) ||
        journal.phase === "acquired"
      : journal.selected_backup_id === null &&
        journal.selected_backup_identity === null &&
        journal.selected_backup_directory_identity === null)
  );
}

function reconcilePublishedRecoveryBackup({
  journal,
  validation,
  databasePath,
  lockPath,
}) {
  if (validation.legacy || validation.recoveryBackupPath === null) return null;
  const hasRecordedIdentity =
    typeof journal.recovery_backup_id === "string" &&
    typeof journal.recovery_backup_identity === "string";
  const backupExists = existsSync(validation.recoveryBackupPath);
  if (!backupExists) {
    if (hasRecordedIdentity || journal.phase !== "acquired") {
      throw new PublicDatabaseBootstrapError(
        "database_reconciliation_failed",
      );
    }
    return null;
  }

  let verified;
  try {
    verified = validateRecoveryBackup({
      backupPath: validation.recoveryBackupPath,
      expectedApplicationScopeFingerprint: journal.repository_fingerprint,
      inspectDatabase:
        journal.operation_kind === "restore"
          ? inspectSafetyRecoveryDatabaseFile
          : inspectRecoveryDatabaseFile,
      expectedBackupId: hasRecordedIdentity
        ? journal.recovery_backup_id
        : null,
      expectedBackupIdentity: hasRecordedIdentity
        ? journal.recovery_backup_identity
        : null,
      allowIneligible: journal.operation_kind === "restore",
    });
  } catch (error) {
    throw new PublicDatabaseBootstrapError(
      "database_reconciliation_failed",
      error,
    );
  }
  const expectedReason =
    journal.operation_kind === "restore" ? "pre_restore_safety" : "pre_update";
  if (verified.manifest.reason !== expectedReason) {
    throw new PublicDatabaseBootstrapError(
      "database_reconciliation_failed",
    );
  }
  if (hasRecordedIdentity) return verified;
  if (journal.phase !== "acquired" || journal.original_family === null) {
    throw new PublicDatabaseBootstrapError(
      "database_reconciliation_failed",
    );
  }
  const sourceFamily = stabilizeSourceFamilyAgainstBackup({
    databasePath,
    backupPayloadPath: verified.payloadPath,
    originalFamily: journal.original_family,
    originalLogicalIdentity: journal.original_logical_identity,
  });
  updateBootstrapJournal(lockPath, journal, {
    phase: "backup_ready",
    original_family: sourceFamily,
    recovery_backup_id: verified.manifest.backup_id,
    recovery_backup_identity: verified.manifest.backup_identity,
  });
  return verified;
}

function recoverDatabaseJournalPhase({
  journal,
  databasePath,
  stagingPath,
  rollbackPath,
  recoveryBackupPath,
  recoveryBackupStagingPath,
}) {
  if (recoveryBackupStagingPath) {
    if (journal.recovery_backup_staging_identity === null) {
      if (existsSync(recoveryBackupStagingPath)) {
        removeEmptyIncompleteRecoveryBackup(recoveryBackupStagingPath);
        if (existsSync(recoveryBackupStagingPath)) {
          throw new PublicDatabaseBootstrapError(
            "database_reconciliation_required",
          );
        }
      }
    } else {
      removeIncompleteRecoveryBackup(
        recoveryBackupStagingPath,
        journal.recovery_backup_staging_identity,
      );
      if (existsSync(recoveryBackupStagingPath)) {
        throw new PublicDatabaseBootstrapError(
          "database_reconciliation_required",
        );
      }
    }
  }
  if (recoveryBackupPath) {
    if (
      journal.schema_version ===
      LEGACY_DATABASE_BOOTSTRAP_JOURNAL_SCHEMA_VERSION
    ) {
      if (regularFileExists(recoveryBackupPath)) {
        try {
          verifyDatabaseFile(recoveryBackupPath);
        } catch (error) {
          if (journal.phase !== "acquired") throw error;
          removeExactOperationFamily(recoveryBackupPath, null);
        }
      } else if (journal.phase !== "acquired") {
        throw new PublicDatabaseBootstrapError(
          "database_reconciliation_failed",
        );
      }
    } else if (existsSync(recoveryBackupPath)) {
      try {
        validateRecoveryBackup({
          backupPath: recoveryBackupPath,
          expectedApplicationScopeFingerprint: journal.repository_fingerprint,
          inspectDatabase:
            journal.operation_kind === "restore"
              ? inspectSafetyRecoveryDatabaseFile
              : inspectRecoveryDatabaseFile,
          expectedBackupId: journal.recovery_backup_id,
          expectedBackupIdentity: journal.recovery_backup_identity,
          allowIneligible: journal.operation_kind === "restore",
        });
      } catch (error) {
        if (journal.phase !== "acquired") throw error;
      }
    } else if (
      journal.recovery_backup_id !== null ||
      journal.phase !== "acquired"
    ) {
      throw new PublicDatabaseBootstrapError(
        "database_reconciliation_failed",
      );
    }
  }

  switch (journal.phase) {
    case "acquired":
    case "backup_ready":
      if (journal.source_was_missing === true) {
        assertDatabaseFamilyAbsent(databasePath);
      } else if (journal.original_family !== null) {
        assertDatabaseFamilyMatches(databasePath, journal.original_family);
      } else if (
        journal.operation_kind === "restore" &&
        journal.phase === "acquired"
      ) {
        assertDatabaseFileSafe(databasePath);
        if (!existsSync(databasePath)) {
          throw new PublicDatabaseBootstrapError(
            "database_reconciliation_failed",
          );
        }
      } else {
        assertLiveSourceRecognizableWhenPresent(databasePath);
      }
      removeJournalStagingFamily(stagingPath, journal);
      assertDatabaseFamilyAbsent(rollbackPath);
      return { result: "database_rollback_restored" };
    case "staging_ready":
      if (journal.source_was_missing === true) {
        assertDatabaseFamilyAbsent(databasePath);
      } else {
        assertDatabaseFamilyMatches(databasePath, journal.original_family);
      }
      removeJournalStagingFamily(stagingPath, journal);
      assertDatabaseFamilyAbsent(rollbackPath);
      return { result: "database_rollback_restored" };
    case "moving_original":
      restoreOriginalFamily({
        databasePath,
        rollbackPath,
        expectedOriginal: journal.original_family,
        expectedPublished: null,
      });
      removeJournalStagingFamily(stagingPath, journal);
      return { result: "database_rollback_restored" };
    case "original_moved":
      assertDatabaseFamilyAbsent(databasePath);
      restoreOriginalFamily({
        databasePath,
        rollbackPath,
        expectedOriginal: journal.original_family,
        expectedPublished: journal.published_family,
      });
      removeJournalStagingFamily(stagingPath, journal);
      return { result: "database_rollback_restored" };
    case "publishing_staging":
      if (journal.source_was_missing === true) {
        if (databaseFamilyExists(databasePath)) {
          assertDatabaseFamilyMatches(databasePath, journal.staged_family);
          assertJournalPublishedDatabase(databasePath, journal);
          removeJournalStagingFamily(stagingPath, journal);
          return { result: "database_verified_publish_committed" };
        }
        removeJournalStagingFamily(stagingPath, journal);
        return { result: "database_rollback_restored" };
      }
      restoreOriginalFamily({
        databasePath,
        rollbackPath,
        expectedOriginal: journal.original_family,
        expectedPublished: journal.staged_family,
      });
      removeJournalStagingFamily(stagingPath, journal);
      return { result: "database_rollback_restored" };
    case "staging_published":
      if (journal.source_was_missing === true) {
        assertDatabaseFamilyMatches(databasePath, journal.published_family);
        assertJournalPublishedDatabase(databasePath, journal);
        assertDatabaseFamilyAbsent(rollbackPath);
        removeJournalStagingFamily(stagingPath, journal);
        return { result: "database_verified_publish_committed" };
      }
      restoreOriginalFamily({
        databasePath,
        rollbackPath,
        expectedOriginal: journal.original_family,
        expectedPublished: journal.published_family,
      });
      removeJournalStagingFamily(stagingPath, journal);
      return { result: "database_rollback_restored" };
    case "restart_verification_pending":
      if (journal.source_was_missing === true) {
        assertDatabaseFamilyMatches(databasePath, journal.published_family);
        assertJournalPublishedDatabase(databasePath, journal);
        removeJournalStagingFamily(stagingPath, journal);
        return { result: "database_verified_publish_committed" };
      }
      restoreOriginalFamily({
        databasePath,
        rollbackPath,
        expectedOriginal: journal.original_family,
        expectedPublished: journal.published_family,
      });
      removeJournalStagingFamily(stagingPath, journal);
      return { result: "database_rollback_restored" };
    case "restoring_original":
    case "restore_failed":
      restoreOriginalFamily({
        databasePath,
        rollbackPath,
        expectedOriginal: journal.original_family,
        expectedPublished: journal.published_family,
      });
      removeJournalStagingFamily(stagingPath, journal);
      return { result: "database_rollback_restored" };
    case "original_restored":
      assertDatabaseFamilyMatches(databasePath, journal.original_family);
      removeJournalStagingFamily(stagingPath, journal);
      cleanupRecordedRollbackFamily(rollbackPath, journal.original_family);
      return { result: "database_rollback_restored" };
    case "published_verified":
      if (
        journal.schema_version ===
          DATABASE_BOOTSTRAP_JOURNAL_SCHEMA_VERSION &&
        journal.source_was_missing !== true
      ) {
        restoreOriginalFamily({
          databasePath,
          rollbackPath,
          expectedOriginal: journal.original_family,
          expectedPublished: journal.published_family,
        });
        removeJournalStagingFamily(stagingPath, journal);
        return { result: "database_rollback_restored" };
      }
      assertDatabaseFamilyMatches(databasePath, journal.published_family);
      assertJournalPublishedDatabase(databasePath, journal);
      removeJournalStagingFamily(stagingPath, journal);
      cleanupRecordedRollbackFamily(rollbackPath, journal.original_family);
      return { result: "database_verified_publish_committed" };
    case "cleanup_complete":
      assertDatabaseFamilyMatches(databasePath, journal.published_family);
      assertJournalPublishedDatabase(databasePath, journal);
      removeJournalStagingFamily(stagingPath, journal);
      cleanupRecordedRollbackFamily(rollbackPath, journal.original_family);
      return { result: "database_verified_publish_committed" };
    default:
      throw new PublicDatabaseBootstrapError(
        "database_reconciliation_required",
      );
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
    (databaseFamilyIsRecordedSubset(databasePath, expectedPublished) ||
      databaseFamilyUsesRecordedFileIdentities(
        databasePath,
        expectedPublished,
      ))
  ) {
    removeOperationOwnedPublishedFamily(databasePath, expectedPublished);
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

function removeOperationOwnedPublishedFamily(databasePath, expectedFamily) {
  if (!databaseFamilyExists(databasePath)) return;
  if (databaseFamilyIsRecordedSubset(databasePath, expectedFamily)) {
    removeExactOperationFamily(databasePath, expectedFamily);
    return;
  }
  if (!databaseFamilyUsesRecordedFileIdentities(databasePath, expectedFamily)) {
    throw new PublicDatabaseBootstrapError("database_reconciliation_failed");
  }
  for (const suffix of ["", ...SQLITE_SIDE_SUFFIXES]) {
    const candidate = `${databasePath}${suffix}`;
    if (existsSync(candidate)) cleanupExactRegularFile(candidate);
  }
}

function removeJournalStagingFamily(stagingPath, journal) {
  if (!databaseFamilyExists(stagingPath)) return;
  if (validFamilyIdentity(journal.staged_family)) {
    removeExactOperationFamily(stagingPath, journal.staged_family);
    return;
  }
  if (
    journal.schema_version ===
      LEGACY_DATABASE_BOOTSTRAP_JOURNAL_SCHEMA_VERSION &&
    journal.staging_file_identity === undefined
  ) {
    const observedFamily = readDatabaseFamilyIdentity(stagingPath);
    removeExactOperationFamily(stagingPath, observedFamily);
    return;
  }
  if (journal.staging_file_identity === null) {
    const existingMembers = ["", ...SQLITE_SIDE_SUFFIXES].filter((suffix) =>
      existsSync(`${stagingPath}${suffix}`),
    );
    if (existingMembers.length !== 1 || existingMembers[0] !== "") {
      throw new PublicDatabaseBootstrapError("database_reconciliation_failed");
    }
    const emptyMain = lstatSync(stagingPath);
    if (
      !emptyMain.isFile() ||
      emptyMain.isSymbolicLink() ||
      emptyMain.size !== 0
    ) {
      throw new PublicDatabaseBootstrapError("database_reconciliation_failed");
    }
    cleanupExactRegularFile(stagingPath);
    return;
  }
  if (!validDirectoryIdentityOrNull(journal.staging_file_identity)) {
    throw new PublicDatabaseBootstrapError("database_reconciliation_failed");
  }
  let main;
  try {
    main = lstatSync(stagingPath, { bigint: true });
  } catch (error) {
    throw new PublicDatabaseBootstrapError(
      "database_reconciliation_failed",
      error,
    );
  }
  if (
    !main.isFile() ||
    main.isSymbolicLink() ||
    main.dev.toString() !== journal.staging_file_identity.dev ||
    main.ino.toString() !== journal.staging_file_identity.ino
  ) {
    throw new PublicDatabaseBootstrapError("database_reconciliation_failed");
  }
  for (const suffix of SQLITE_SIDE_SUFFIXES) {
    const candidate = `${stagingPath}${suffix}`;
    if (!existsSync(candidate)) continue;
    const stats = lstatSync(candidate);
    if (!stats.isFile() || stats.isSymbolicLink()) {
      throw new PublicDatabaseBootstrapError(
        "database_reconciliation_failed",
      );
    }
    cleanupExactRegularFile(candidate);
  }
  cleanupExactRegularFile(stagingPath);
}

function removeUnverifiedNewPublicationOrRetain({ databasePath, lock, cause }) {
  try {
    removeOperationOwnedPublishedFamily(
      databasePath,
      lock.published_family ?? lock.staged_family,
    );
  } catch (cleanupError) {
    const failure = new PublicDatabaseBootstrapError(
      "database_reconciliation_required",
      cleanupError,
    );
    failure.retainBootstrapLock = true;
    throw failure;
  }
  throw cause;
}

function cleanupExactRegularFile(filePath) {
  if (!filePath) return;
  try {
    const stats = lstatSync(filePath);
    if (!stats.isFile() || stats.isSymbolicLink()) {
      throw new PublicDatabaseBootstrapError(
        "database_reconciliation_required",
      );
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
  const verification = inspectRecoveryDatabaseFile(databasePath);
  if (
    verification.schema_classification !== "current" ||
    verification.schema_signature !==
      canonicalStructuralSchemaContractSignature()
  ) {
    throw new PublicDatabaseBootstrapError("database_reconciliation_failed");
  }
}

function assertJournalPublishedDatabase(databasePath, journal) {
  if (
    journal.schema_version !==
    LEGACY_DATABASE_BOOTSTRAP_JOURNAL_SCHEMA_VERSION
  ) {
    assertCanonicalCurrentDatabase(databasePath);
    return;
  }
  const classification = classifyExistingDatabase(databasePath);
  if (!["current", "old"].includes(classification.state)) {
    throw new PublicDatabaseBootstrapError("database_reconciliation_failed");
  }
  verifyDatabaseFile(databasePath);
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

function databaseFamilyUsesRecordedFileIdentities(databasePath, expected) {
  if (!validFamilyIdentity(expected) || !databaseFamilyExists(databasePath)) {
    return false;
  }
  let observedMain = false;
  for (const suffix of ["", ...SQLITE_SIDE_SUFFIXES]) {
    const candidate = `${databasePath}${suffix}`;
    if (!existsSync(candidate)) continue;
    const expectedMember = expected.find((entry) => entry.suffix === suffix);
    if (!expectedMember) return false;
    try {
      const stats = lstatSync(candidate, { bigint: true });
      if (
        !stats.isFile() ||
        stats.isSymbolicLink() ||
        stats.dev.toString() !== expectedMember.dev ||
        stats.ino.toString() !== expectedMember.ino
      ) {
        return false;
      }
    } catch {
      return false;
    }
    if (suffix === "") observedMain = true;
  }
  return observedMain;
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

function recoveryBackupExists(backupPath, legacy) {
  if (!backupPath) return false;
  if (legacy) return regularFileExists(backupPath);
  try {
    const stats = lstatSync(backupPath);
    return stats.isDirectory() && !stats.isSymbolicLink();
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
    journal.schema_version === DATABASE_BOOTSTRAP_JOURNAL_SCHEMA_VERSION &&
    !journal.source_was_missing &&
    journal.phase !== "acquired" &&
    !/^sha256:[a-f0-9]{64}$/u.test(journal.original_logical_identity)
  ) {
    return false;
  }
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
    "restart_verification_pending",
    "cleanup_complete",
    "original_restored",
    "restoring_original",
    "restore_failed",
  ]);
  if (
    stagedPhases.has(journal.phase) &&
    !validFamilyIdentity(journal.staged_family)
  ) {
    return false;
  }
  const originalPhases = new Set([
    "moving_original",
    "original_moved",
    "publishing_staging",
    "staging_published",
    "published_verified",
    "restart_verification_pending",
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
    "restart_verification_pending",
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

function validDirectoryIdentityOrNull(value) {
  return (
    value === null ||
    (value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof value.dev === "string" &&
      /^\d+$/.test(value.dev) &&
      typeof value.ino === "string" &&
      /^\d+$/.test(value.ino))
  );
}

function validReusableRecoveryBackupOrNull(value) {
  return (
    value === null ||
    (value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).sort().join(",") ===
        "backupDirectoryIdentity,backupId,backupIdentity,backupPath,manifestFileIdentity,payloadFileIdentity,sourceFamily,stateDirectoryIdentity" &&
      typeof value.backupPath === "string" &&
      path.isAbsolute(value.backupPath) &&
      /^recovery:[0-9a-f-]{36}$/iu.test(value.backupId ?? "") &&
      /^sha256:[a-f0-9]{64}$/u.test(value.backupIdentity ?? "") &&
      validDirectoryIdentityOrNull(value.backupDirectoryIdentity) &&
      value.backupDirectoryIdentity !== null &&
      validDirectoryIdentityOrNull(value.stateDirectoryIdentity) &&
      value.stateDirectoryIdentity !== null &&
      validDirectoryIdentityOrNull(value.manifestFileIdentity) &&
      value.manifestFileIdentity !== null &&
      validDirectoryIdentityOrNull(value.payloadFileIdentity) &&
      value.payloadFileIdentity !== null &&
      (value.sourceFamily === null || validFamilyIdentity(value.sourceFamily)))
  );
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

async function classifyBootstrapJournalOwner(
  journal,
  { recoveryOwner = null } = {},
) {
  const classification = await classifyPrivateProcessOwnership({
    contract: journal.contract,
    schemaVersion: journal.schema_version,
    repositoryFingerprint: journal.repository_fingerprint,
    ownershipId: journal.operation_id,
    ownerPid: journal.supervisor_pid,
    ownerProcessIdentity: journal.owner_process_identity,
    probePort: journal.owner_probe_port,
    probeToken: journal.owner_probe_token,
    ownershipBinding: journal.owner_probe_binding,
  });
  if (classification === "verified_live") return classification;
  if (
    recoveryOwner !== null &&
    recoveryOwner.supervisorPid === process.pid &&
    recoveryOwner.supervisorPid === journal.supervisor_pid &&
    recoveryOwner.runtimeInstanceId === journal.runtime_instance_id &&
    recoveryOwner.runtimeOwnershipGeneration ===
      journal.runtime_ownership_generation
  ) {
    return "stale";
  }
  return classification;
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

function canonicalMissingPackageIdentityGuardSignature() {
  if (canonicalMissingPackageIdentityGuardSignatureCache) {
    return canonicalMissingPackageIdentityGuardSignatureCache;
  }
  const database = new Database(":memory:");
  try {
    database.pragma("foreign_keys = ON");
    applyCanonicalDatabaseMigrations(database);
    database.exec("DROP TABLE augnes_package_identity_guard");
    verifyOpenDatabase(database);
    canonicalMissingPackageIdentityGuardSignatureCache =
      structuralSchemaContractSignature(database);
    return canonicalMissingPackageIdentityGuardSignatureCache;
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
      while (
        index < input.length &&
        !(input[index] === "*" && input[index + 1] === "/")
      ) {
        index += 1;
      }
      index += 2;
      continue;
    }
    if (
      character === "'" ||
      character === '"' ||
      character === "`" ||
      character === "["
    ) {
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
    if (
      ["<=", ">=", "!=", "<>", "==", "||", "->", "->>"].includes(
        twoCharacterOperator,
      )
    ) {
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
  for (const candidate of [
    databasePath,
    ...SQLITE_SIDE_SUFFIXES.map((s) => `${databasePath}${s}`),
  ]) {
    try {
      const stats = lstatSync(candidate);
      if (stats.isFile() && !stats.isSymbolicLink()) unlinkSync(candidate);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
}

function cleanupRecordedOperationFamily(
  databasePath,
  expectedFamily,
  stagingFileIdentity = null,
) {
  if (!databaseFamilyExists(databasePath)) return;
  if (validFamilyIdentity(expectedFamily)) {
    removeExactOperationFamily(databasePath, expectedFamily);
    return;
  }
  try {
    removeJournalStagingFamily(databasePath, {
      staged_family: null,
      staging_file_identity: stagingFileIdentity,
    });
  } catch (error) {
    throw new PublicDatabaseBootstrapError(
      "database_reconciliation_required",
      error,
    );
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

function normalizeTargetCompatibility(value, fallbackScope) {
  const source = value ?? {};
  const applicationScopeFingerprint =
    source.applicationScopeFingerprint ?? fallbackScope;
  const schemaSignature =
    source.schemaSignature ?? canonicalStructuralSchemaContractSignature();
  const migrationIds = source.migrationIds ?? [
    ...CANONICAL_DATABASE_MIGRATION_IDS,
  ];
  if (
    !/^[a-f0-9]{64}$/u.test(applicationScopeFingerprint ?? "") ||
    schemaSignature !== canonicalStructuralSchemaContractSignature() ||
    JSON.stringify(migrationIds) !==
      JSON.stringify(CANONICAL_DATABASE_MIGRATION_IDS)
  ) {
    throw new PublicDatabaseBootstrapError("database_package_incompatible");
  }
  return {
    applicationScopeFingerprint,
    schemaSignature,
    migrationIds: [...migrationIds],
    recoveryActionId:
      typeof source.recoveryActionId === "string" &&
      /^[0-9a-f-]{36}$/iu.test(source.recoveryActionId)
        ? source.recoveryActionId
        : null,
    sourceApplication: source.sourceApplication ?? {
      application_version: null,
      build_identity: null,
      package_contract: null,
      package_contract_version: null,
      runtime_contract: null,
      runtime_schema_version: null,
    },
  };
}

function normalizeBootstrapError(error) {
  if (error instanceof PublicDatabaseBootstrapError) return error;
  if (error instanceof PublicRecoveryBackupError) {
    if (error.code === "restore_migration_failed") {
      return new PublicDatabaseBootstrapError(
        "database_migration_failed",
        error,
      );
    }
    if (error.code === "post_migration_verification_failed") {
      return new PublicDatabaseBootstrapError(error.code, error);
    }
    const backupCreationCodes = new Set([
      "recovery_backup_creation_failed",
      "recovery_source_invalid",
    ]);
    const code = backupCreationCodes.has(error.code)
      ? "database_backup_failed"
      : error.code.startsWith("restore_")
        ? error.code
        : "database_backup_verification_failed";
    return new PublicDatabaseBootstrapError(code, error);
  }
  return new PublicDatabaseBootstrapError(
    classifyBootstrapFailure(error),
    error,
  );
}
