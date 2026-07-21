#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  appendFileSync,
  chmodSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import {
  RECOVERY_PRIVATE_MATERIAL_MARKER,
  RECOVERY_PRIVATE_LEGACY_OBSERVE_REASON,
  RECOVERY_PRIVATE_LEGACY_OBSERVE_SOURCE_AGENT_ID,
  RECOVERY_PRIVATE_LEGACY_OBSERVE_STATE_KEYS,
  RECOVERY_PRIVATE_OBSERVATION_STATE_KEY,
  RECOVERY_PRIVATE_STATE_VALUE_MARKER,
  createRecoveryPrivateMaterialReadBoundary,
  projectRecoveryPrivateMaterialStateEntryForAuthoritativeRead,
  recoveryPrivateMaterialManifestContract,
} from "../lib/db/recovery-private-material-contract.mjs";
import {
  CANONICAL_DATABASE_MIGRATION_CONTRACT,
  CANONICAL_DATABASE_MIGRATION_CONTRACT_VERSION,
  CANONICAL_DATABASE_MIGRATION_IDS,
  applyCanonicalDatabaseMigrations,
  readCanonicalDatabaseMigrationLedger,
  verifyCanonicalDatabaseMigrationLedger,
} from "./canonical-database-migrations.mjs";
import { runCanonicalChild } from "./canonical-child-runner.mjs";
import { buildCanonicalChildEnvironment } from "./canonical-test-environment.mjs";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";
import {
  PublicDatabaseBootstrapError,
  inspectLegacyRecoveryAdoptionSourceDatabaseFile,
  inspectRecoveryDatabaseFile,
  inspectSafetyRecoveryDatabaseFile,
  restoreRuntimeDatabase,
} from "./runtime-database-bootstrap.mjs";
import {
  PublicRecoveryBackupError,
  LEGACY_RECOVERY_ADOPTION_CONTRACT,
  LEGACY_RECOVERY_ADOPTION_FILE,
  LEGACY_RECOVERY_ADOPTION_SCHEMA_VERSION,
  RECOVERY_BACKUP_CONTRACT,
  RECOVERY_BACKUP_CONTRACT_VERSION,
  RECOVERY_BACKUP_OPERATION_FILE,
  RECOVERY_DATABASE_PAYLOAD,
  RECOVERY_MANIFEST_FILE,
  RECOVERY_OPERATION_CONTRACT,
  RECOVERY_OPERATION_FILE,
  RECOVERY_OPERATION_SCHEMA_VERSION,
  clearPendingRecoveryAction,
  clearPendingPackageIdentity,
  completePendingRecoveryAction,
  adoptLegacyRecoveryBackups,
  createRecoveryBackup,
  listRecoveryBackups,
  readInstalledPackageIdentity,
  readPendingPackageIdentity,
  readRecoveryOperationResults,
  reconcileRecoveryBackupOperation,
  recoveryContractFileMode,
  removeIncompleteRecoveryBackup,
  selectRecoveryBackup,
  stageRecoveryBackupDatabase,
  validateRecoveryBackup,
  writeInstalledPackageIdentity,
  writePendingRecoveryAction,
  writePendingPackageIdentity,
  writeRecoveryOperationResult,
} from "./recovery-backup.mjs";

const repositoryRoot = process.cwd();
const applicationScopeFingerprint = "a".repeat(64);
const wrongApplicationScopeFingerprint = "b".repeat(64);
const sourceApplication = Object.freeze({
  application_version: "0.1.0+source.build.1",
  build_identity: `sha256:${"c".repeat(64)}`,
  package_contract: "augnes.distributable.v1",
  package_contract_version: 1,
  runtime_contract: "augnes-local-runtime-supervisor-v1",
  runtime_schema_version: 2,
});
if (process.argv[2] === "--backup-operation-crash-helper") {
  await runBackupOperationCrashHelper(JSON.parse(process.argv[3]));
  process.exit(0);
}
const temporaryRoot = mkdtempSync(
  path.join(canonicalTemporaryParent(), "augnes-recovery-backup-"),
);
const backupDirectory = path.join(temporaryRoot, "backups");
const sourceDatabasePath = path.join(temporaryRoot, "current.db");
const oldDatabasePath = path.join(temporaryRoot, "old.db");
const restoredCurrentPath = path.join(temporaryRoot, "restored-current.db");
const restoredOldPath = path.join(temporaryRoot, "restored-old.db");
const currentBackupName =
  "augnes-recovery-20260720T000000-11111111.backup";
const manualBackupName =
  "augnes-recovery-20260720T000100-22222222.backup";
const oldBackupName =
  "augnes-recovery-20260720T000200-33333333.backup";
const safetyBackupName =
  "augnes-recovery-20260720T000300-44444444.backup";
const currentStagingName =
  ".augnes-recovery-incomplete-11111111-1111-4111-8111-111111111111";
const manualStagingName =
  ".augnes-recovery-incomplete-22222222-2222-4222-8222-222222222222";
const oldStagingName =
  ".augnes-recovery-incomplete-33333333-3333-4333-8333-333333333333";
const safetyStagingName =
  ".augnes-recovery-incomplete-44444444-4444-4444-8444-444444444444";
const markerId = "agent:recovery-backup-marker";
const oldMarkerId = "agent:recovery-backup-old-marker";
const replaySessionId = "operator-session:recovery-backup-replay";
const providerSecretSentinel = "sk-proj-recovery-backup-must-not-persist";
const privatePathSentinel = "/Users/private/recovery-backup.db";
const rawObserveInputSentinel =
  "Legacy Observe input sk-proj-recovery-private-material-7f63e2d4";
const rawObserveBeforeSentinel =
  "Earlier Observe input sk-proj-recovery-private-before-9b5e1a60";
const safeImplementationStackValue =
  "TypeScript and SQLite with explicit review boundaries.";
const safeImplementationStackReason =
  "Reviewed implementation stack predecessor.";
const deletedObserveInputSentinel =
  "Deleted Observe input sk-proj-recovery-deleted-2e6bc159 ".repeat(16);
const PINNED_MERGED_R8A_LEGACY_SCHEMA_SIGNATURE =
  "1c6625843bae76075cea39176bd9955d63d90e0432465e99521bdce8c3687433";

let suiteError = null;
let sourceWriter = null;
const networkGuard = installZeroNetworkGuard({
  allowLoopback: true,
  errorPrefix: "recovery_backup_external_network_forbidden",
});

try {
  assertRecoveryModuleHasNoNetworkImports();
  assertDemoSeedUsesRecoveryPrivateMaterialContract();
  assert.equal(recoveryContractFileMode(0o100666, "win32"), 0o600);
  assert.equal(recoveryContractFileMode(0o100600, "linux"), 0o600);
  sourceWriter = createCanonicalFixture(sourceDatabasePath, {
    markerId,
    replaySessionId,
    keepWalOpen: true,
    includePrivateMaterial: true,
  });
  createCanonicalFixture(oldDatabasePath, {
    markerId: oldMarkerId,
    replaySessionId,
    removeMigrationLedger: true,
    includePrivateMaterial: true,
  });

  const sourceSnapshot = readDurableFixtureSnapshot(sourceDatabasePath);
  const expectedSanitizedSourceSnapshot = normalizedPrivateMaterialSnapshot(
    sourceSnapshot,
  );
  const sourceFamilyBeforeBackup = snapshotDatabaseFamily(sourceDatabasePath);
  const currentBackup = await createRecoveryBackup({
    databasePath: sourceDatabasePath,
    backupDirectory,
    applicationScopeFingerprint,
    sourceApplication,
    reason: "pre_update",
    inspectDatabase: inspectRecoveryDatabaseFile,
    backupBasename: currentBackupName,
    stagingBasename: currentStagingName,
    now: () => new Date("2026-07-20T00:00:00.000Z"),
  });
  assert.deepEqual(
    snapshotDatabaseFamily(sourceDatabasePath),
    sourceFamilyBeforeBackup,
    "creating a privacy-normalized backup must not mutate the authoritative SQLite family",
  );
  assert.deepEqual(
    readDurableFixtureSnapshot(sourceDatabasePath),
    sourceSnapshot,
    "creating a privacy-normalized backup must leave every authoritative source row exact",
  );
  assertPrivateMaterialRaw(sourceDatabasePath);
  assertNoPrivateMaterialBytes(currentBackup.backupPath);
  testCreatedBackupContract(currentBackup, expectedSanitizedSourceSnapshot);

  const manualBackup = await createRecoveryBackup({
    databasePath: sourceDatabasePath,
    backupDirectory,
    applicationScopeFingerprint,
    sourceApplication,
    reason: "manual_recovery",
    inspectDatabase: inspectRecoveryDatabaseFile,
    backupBasename: manualBackupName,
    stagingBasename: manualStagingName,
    now: () => new Date("2026-07-20T00:01:00.000Z"),
  });
  testInventoryAndSelection({ currentBackup, manualBackup });
  await testValidationRefusals(currentBackup);

  const selectedCurrent = validateRecoveryBackup({
    backupPath: currentBackup.backupPath,
    expectedApplicationScopeFingerprint: applicationScopeFingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
  });
  const restoredCurrentInspection = await stageRecoveryBackupDatabase({
    selectedBackup: selectedCurrent,
    targetPath: restoredCurrentPath,
    inspectDatabase: inspectRecoveryDatabaseFile,
    migrateDatabase: applyCanonicalDatabaseMigrations,
  });
  assert.equal(restoredCurrentInspection.schema_classification, "current");
  assert.deepEqual(
    readDurableFixtureSnapshot(restoredCurrentPath),
    expectedSanitizedSourceSnapshot,
    "current recovery must preserve metadata, ledger, replay rows, and fixed privacy markers exactly",
  );
  assertPrivateMaterialMetadataPreserved(
    sourceSnapshot,
    readDurableFixtureSnapshot(restoredCurrentPath),
  );
  assertPrivateMaterialNormalized(restoredCurrentPath);
  assertNoPrivateMaterialBytes(restoredCurrentPath);

  const oldSourceSnapshot = readDurableFixtureSnapshot(oldDatabasePath);
  assert.deepEqual(oldSourceSnapshot.migration_ledger, []);
  const oldBackup = await createRecoveryBackup({
    databasePath: oldDatabasePath,
    backupDirectory,
    applicationScopeFingerprint,
    sourceApplication,
    reason: "pre_update",
    inspectDatabase: inspectRecoveryDatabaseFile,
    backupBasename: oldBackupName,
    stagingBasename: oldStagingName,
    now: () => new Date("2026-07-20T00:02:00.000Z"),
  });
  assertPrivateMaterialRaw(oldDatabasePath);
  assertNoPrivateMaterialBytes(oldBackup.backupPath);
  assert.equal(oldBackup.manifest.database.schema_classification, "old");
  assert.deepEqual(oldBackup.manifest.database.migration_ids, []);
  const selectedOld = validateRecoveryBackup({
    backupPath: oldBackup.backupPath,
    expectedApplicationScopeFingerprint: applicationScopeFingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
  });
  const restoredOldInspection = await stageRecoveryBackupDatabase({
    selectedBackup: selectedOld,
    targetPath: restoredOldPath,
    inspectDatabase: inspectRecoveryDatabaseFile,
    migrateDatabase: applyCanonicalDatabaseMigrations,
  });
  assert.equal(restoredOldInspection.schema_classification, "current");
  assert.deepEqual(
    restoredOldInspection.migration_ids,
    [...CANONICAL_DATABASE_MIGRATION_IDS],
  );
  const restoredOldSnapshot = readDurableFixtureSnapshot(restoredOldPath);
  assert.deepEqual(restoredOldSnapshot.agents, oldSourceSnapshot.agents);
  assert.deepEqual(restoredOldSnapshot.core_records, oldSourceSnapshot.core_records);
  assert.deepEqual(restoredOldSnapshot.replay_rows, oldSourceSnapshot.replay_rows);
  assert.deepEqual(
    restoredOldSnapshot.safe_predecessor,
    oldSourceSnapshot.safe_predecessor,
  );
  assertPrivateMaterialMetadataPreserved(oldSourceSnapshot, restoredOldSnapshot);
  assert.deepEqual(
    restoredOldSnapshot.private_material,
    normalizedPrivateMaterialSnapshot(oldSourceSnapshot).private_material,
  );
  assertPrivateMaterialNormalized(restoredOldPath);
  assertNoPrivateMaterialBytes(restoredOldPath);
  assert.deepEqual(
    restoredOldSnapshot.migration_ledger.map((entry) => ({
      migration_id: entry.migration_id,
      migration_contract: entry.migration_contract,
      migration_contract_version: entry.migration_contract_version,
    })),
    CANONICAL_DATABASE_MIGRATION_IDS.map((migrationId) => ({
      migration_id: migrationId,
      migration_contract: CANONICAL_DATABASE_MIGRATION_CONTRACT,
      migration_contract_version:
        CANONICAL_DATABASE_MIGRATION_CONTRACT_VERSION,
    })),
  );

  const safetySourceSnapshot = readDurableFixtureSnapshot(restoredCurrentPath);
  const safetyBackup = await createRecoveryBackup({
    databasePath: restoredCurrentPath,
    backupDirectory,
    applicationScopeFingerprint,
    sourceApplication,
    reason: "pre_restore_safety",
    inspectDatabase: inspectRecoveryDatabaseFile,
    backupBasename: safetyBackupName,
    stagingBasename: safetyStagingName,
    now: () => new Date("2026-07-20T00:03:00.000Z"),
  });
  assert.equal(safetyBackup.manifest.reason, "pre_restore_safety");
  assert.deepEqual(
    readDurableFixtureSnapshot(
      validateRecoveryBackup({
        backupPath: safetyBackup.backupPath,
        expectedApplicationScopeFingerprint: applicationScopeFingerprint,
        inspectDatabase: inspectRecoveryDatabaseFile,
      }).payloadPath,
    ),
    safetySourceSnapshot,
  );
  const finalInventory = listRecoveryBackups({
    backupDirectory,
    applicationScopeFingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
  });
  assert.equal(finalInventory.verified.length, 4);
  assert.equal(finalInventory.rejected.length, 0);
  assert.equal(selectRecoveryBackup(finalInventory).manifest.reason, "pre_restore_safety");

  const legacyBackupPath = path.join(
    backupDirectory,
    "augnes-pre-migration-2026-07-20T000400-000Z-55555555.db",
  );
  createPinnedMergedR8ALegacyFixture(
    legacyBackupPath,
    "agent:legacy-adoption-main",
  );
  const legacySourceSnapshot = readDurableFixtureSnapshot(legacyBackupPath);
  assertPrivateMaterialRaw(legacyBackupPath);
  assert.equal(
    readFileSync(legacyBackupPath).includes(Buffer.from(rawObserveInputSentinel)),
    true,
  );
  assert.throws(
    () => inspectRecoveryDatabaseFile(legacyBackupPath),
    (error) =>
      error instanceof PublicDatabaseBootstrapError &&
      error.code === "database_private_material_unsupported",
  );
  const legacySourceInspection =
    inspectLegacyRecoveryAdoptionSourceDatabaseFile(legacyBackupPath);
  assert.equal(legacySourceInspection.schema_classification, "old");
  assert.equal(
    legacySourceInspection.schema_signature,
    PINNED_MERGED_R8A_LEGACY_SCHEMA_SIGNATURE,
  );
  const legacyAdoption = await adoptLegacyRecoveryBackups({
    backupDirectory,
    applicationScopeFingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
    inspectSourceDatabase: inspectLegacyRecoveryAdoptionSourceDatabaseFile,
  });
  assert.equal(
    legacyAdoption.adopted.length,
    1,
    JSON.stringify(legacyAdoption),
  );
  assert.equal(legacyAdoption.rejected.length, 0);
  assert.equal(existsSync(legacyBackupPath), false);
  const adoptedLegacyBackup = listRecoveryBackups({
    backupDirectory,
    applicationScopeFingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
  }).verified.find(
    (backup) => backup.manifest.backup_id === legacyAdoption.adopted[0].backup_id,
  );
  assert(adoptedLegacyBackup);
  assert.equal(
    adoptedLegacyBackup.manifest.database.schema_classification,
    "current",
  );
  assert.deepEqual(
    adoptedLegacyBackup.manifest.database.migration_ids,
    [...CANONICAL_DATABASE_MIGRATION_IDS],
  );
  const adoptedLegacySnapshot = readDurableFixtureSnapshot(
    adoptedLegacyBackup.payloadPath,
  );
  const expectedAdoptedLegacySnapshot = normalizedPrivateMaterialSnapshot(
    legacySourceSnapshot,
  );
  assert.deepEqual(
    adoptedLegacySnapshot.agents,
    expectedAdoptedLegacySnapshot.agents,
  );
  assert.deepEqual(
    adoptedLegacySnapshot.core_records,
    expectedAdoptedLegacySnapshot.core_records,
  );
  assert.deepEqual(
    adoptedLegacySnapshot.replay_rows,
    expectedAdoptedLegacySnapshot.replay_rows,
  );
  assert.deepEqual(
    adoptedLegacySnapshot.safe_predecessor,
    expectedAdoptedLegacySnapshot.safe_predecessor,
  );
  assert.deepEqual(
    adoptedLegacySnapshot.private_material,
    expectedAdoptedLegacySnapshot.private_material,
  );
  assert.deepEqual(
    adoptedLegacySnapshot.migration_ledger.map((entry) => entry.migration_id),
    [...CANONICAL_DATABASE_MIGRATION_IDS],
  );
  assertNoPrivateMaterialBytes(adoptedLegacyBackup.backupPath);
  assertNoPrivateMaterialBytes(backupDirectory);
  const repeatedLegacyAdoption = await adoptLegacyRecoveryBackups({
    backupDirectory,
    applicationScopeFingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
    inspectSourceDatabase: inspectLegacyRecoveryAdoptionSourceDatabaseFile,
  });
  assert.equal(repeatedLegacyAdoption.adopted.length, 0);
  assert.equal(repeatedLegacyAdoption.already_adopted.length, 1);
  assert.equal(repeatedLegacyAdoption.rejected.length, 0);
  assert.equal(existsSync(legacyBackupPath), false);
  assert.equal(
    listRecoveryBackups({
      backupDirectory,
      applicationScopeFingerprint,
      inspectDatabase: inspectRecoveryDatabaseFile,
    }).verified.length,
    5,
  );
  await testLegacyAdoptionRetentionIdempotency();
  await testLegacyAdoptionCrashAndIdentityRecovery();
  await testBackupOperationHardCrashReconciliation();

  await testAtomicRestoreLifecycle({
    selectedBackup: currentBackup,
    selectedSnapshot: expectedSanitizedSourceSnapshot,
  });
  await testUnknownSchemaRestoreRefusal({ selectedBackup: currentBackup });
  await testSelectedBackupReplacementRefusal({
    selectedBackup: currentBackup,
  });
  await testSelectedBackupFileIdentityReplacementRefusal({
    selectedBackup: currentBackup,
  });

  testOperationalResults();
  await testRecoveryRetention({ currentBackup, manualBackup });
  testBoundedRecoveryInventory();
  sourceWriter.pragma("wal_checkpoint(TRUNCATE)");
  sourceWriter.close();
  sourceWriter = null;

  assert.equal(
    networkGuard.attempts.length,
    0,
    "recovery backup must make no non-loopback network attempt",
  );
  assertZeroOperationResidue();

  console.log(
    JSON.stringify(
      {
        test: "recovery-backup-contract",
        status: "pass",
        sqlite_backup_verified: true,
        manifest_identity_payload_hash_and_modes_verified: true,
        scope_inventory_and_selection_verified: true,
        tamper_and_unsafe_package_refusal_verified: true,
        old_schema_migration_verified: true,
        exact_data_ledger_and_replay_round_trip_verified: true,
        recovery_private_material_normalization_verified: true,
        safe_predecessor_before_value_and_lineage_preserved: true,
        source_database_unchanged_during_backup_verified: true,
        raw_observe_and_token_shaped_backup_bytes: 0,
        private_material_metadata_and_lineage_preserved: true,
        recomputed_unsanitized_backup_refused: true,
        safety_backup_verified: true,
        atomic_restore_verified: true,
        selected_backup_identity_race_refused_before_mutation: true,
        restore_failure_boundaries_verified: [
          "before_replacement",
          "after_original_move",
          "after_publication",
          "post_publication_verification",
        ],
        exact_current_state_preserved_on_restore_failure: true,
        unknown_schema_restore_refused_before_mutation: true,
        unknown_schema_safety_backups_created: 0,
        unknown_schema_exact_current_state_preserved: true,
        restore_journal_stage_rollback_residue: 0,
        bounded_public_safe_operational_result_verified: true,
        bounded_verified_backup_retention_verified: true,
        legacy_recovery_backup_adoption_verified: true,
        verified_legacy_source_removed_after_durable_ledger: true,
        legacy_adoption_ledger_crash_replay_verified: true,
        legacy_adoption_identity_race_refused_with_source_preserved: true,
        adopted_backup_root_raw_private_material_bytes: 0,
        legacy_recovery_adoption_retention_replay_verified: true,
        backup_operation_hard_crash_reconciliation_verified: true,
        backup_operation_live_owner_and_identity_race_refusal_verified: true,
        provider_or_external_requests: networkGuard.attempts.length,
        incomplete_backup_residue: 0,
        sqlite_side_file_residue: 0,
        operation_write_residue: 0,
      },
      null,
      2,
    ),
  );
} catch (error) {
  suiteError = error;
} finally {
  try {
    sourceWriter?.close();
  } catch {
    // The primary test failure is more useful than a duplicate close failure.
  }
  networkGuard.restore();
  rmSync(temporaryRoot, { recursive: true, force: true });
}

if (suiteError) throw suiteError;

function canonicalTemporaryParent() {
  const configured = process.env.AUGNES_CANONICAL_TEMP_ROOT?.trim();
  if (!configured) return tmpdir();
  if (!path.isAbsolute(configured)) {
    throw new Error("canonical temporary root must be absolute");
  }
  const stats = lstatSync(configured);
  if (!stats.isDirectory() || stats.isSymbolicLink()) {
    throw new Error("canonical temporary root must be a regular directory");
  }
  return realpathSync(configured);
}

function createCanonicalFixture(
  databasePath,
  {
    markerId: fixtureMarkerId,
    replaySessionId: fixtureReplaySessionId,
    removeMigrationLedger = false,
    keepWalOpen = false,
    includePrivateMaterial = false,
  },
) {
  mkdirSync(path.dirname(databasePath), { recursive: true, mode: 0o700 });
  const database = new Database(databasePath);
  database.pragma("foreign_keys = ON");
  applyCanonicalDatabaseMigrations(database);
  database
    .prepare("INSERT INTO agents (id, name, kind, created_at) VALUES (?, ?, ?, ?)")
    .run(
      fixtureMarkerId,
      "Recovery backup durable marker",
      "runtime",
      "2026-07-20T00:00:00.000Z",
    );
  database
    .prepare(
      `INSERT INTO vnext_local_operator_sessions (
         session_id, workspace_id, project_id, operator_id,
         bootstrap_token_hash, session_token_hash, issued_at, expires_at,
         bootstrap_consumed_at, revoked_at, action_nonce_hash,
         action_nonce_expires_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, NULL, NULL, NULL, NULL, ?)`,
    )
    .run(
      fixtureReplaySessionId,
      "workspace:recovery-backup",
      "project:recovery-backup",
      "operator:recovery-backup",
      `sha256:${"f".repeat(64)}`,
      "2026-07-20T00:00:00.000Z",
      "2026-07-21T00:00:00.000Z",
      "2026-07-20T00:00:00.000Z",
    );
  if (includePrivateMaterial) {
    insertLegacyRecoveryPrivateMaterialFixture(database, fixtureMarkerId);
  }
  if (removeMigrationLedger) {
    database.exec(
      "DROP TABLE augnes_schema_migrations;" +
        "DROP TABLE augnes_package_identity_guard;",
    );
  }
  if (keepWalOpen) {
    assert.equal(database.pragma("journal_mode = WAL", { simple: true }), "wal");
    database
      .prepare("UPDATE agents SET name = ? WHERE id = ?")
      .run("Recovery backup marker from active WAL", fixtureMarkerId);
  }
  chmodSync(databasePath, 0o600);
  if (keepWalOpen) return database;
  database.close();
  return null;
}

function createPinnedMergedR8ALegacyFixture(databasePath, fixtureMarkerId) {
  createCanonicalFixture(databasePath, {
    markerId: fixtureMarkerId,
    replaySessionId: `operator-session:${fixtureMarkerId}`,
    removeMigrationLedger: true,
    includePrivateMaterial: true,
  });
  const database = new Database(databasePath, { fileMustExist: true });
  try {
    database.pragma("foreign_keys = ON");
    database.exec("DROP TABLE perspective_memory_items");
    assert.equal(database.pragma("integrity_check", { simple: true }), "ok");
    assert.deepEqual(database.pragma("foreign_key_check"), []);
  } finally {
    database.close();
  }
  chmodSync(databasePath, 0o600);
}

async function runBackupOperationCrashHelper(options) {
  const helperNetworkGuard = installZeroNetworkGuard({
    allowLoopback: true,
    errorPrefix: "recovery_backup_helper_external_network_forbidden",
    onBlockedAttempt() {
      writeFileSync(`${options.ready_path}.network-violation`, "blocked\n", {
        mode: 0o600,
      });
    },
  });
  const afterSnapshotCreated = async () => {
    if (options.crash_phase !== "after_snapshot") return;
    writeFileSync(options.ready_path, "snapshot_ready\n", { mode: 0o600 });
    if (options.hold === true) {
      await new Promise((resolve) => setTimeout(resolve, 60_000));
    } else {
      process.kill(process.pid, "SIGKILL");
      await new Promise(() => {});
    }
  };
  const afterBackupPublished = () => {
    if (options.crash_phase !== "after_publish") return;
    writeFileSync(options.ready_path, "published_ready\n", { mode: 0o600 });
    process.kill(process.pid, "SIGKILL");
  };
  try {
    if (options.kind === "legacy_adoption") {
      await adoptLegacyRecoveryBackups({
        backupDirectory: options.backup_directory,
        applicationScopeFingerprint,
        inspectDatabase: inspectRecoveryDatabaseFile,
        inspectSourceDatabase: inspectLegacyRecoveryAdoptionSourceDatabaseFile,
        dependencies: { afterSnapshotCreated },
      });
      return;
    }
    await createRecoveryBackup({
      databasePath: options.database_path,
      backupDirectory: options.backup_directory,
      applicationScopeFingerprint,
      sourceApplication,
      reason: options.reason,
      inspectDatabase:
        options.reason === "pre_restore_safety"
          ? inspectSafetyRecoveryDatabaseFile
          : inspectRecoveryDatabaseFile,
      allowIneligible: options.reason === "pre_restore_safety",
      operationUuid: options.operation_uuid,
      now: () => new Date(options.created_at),
      dependencies: {
        afterSnapshotCreated,
        afterBackupPublished,
      },
    });
  } finally {
    assert.equal(helperNetworkGuard.attempts.length, 0);
    helperNetworkGuard.restore();
  }
}

async function testBackupOperationHardCrashReconciliation() {
  const root = path.join(temporaryRoot, "backup-operation-hard-crash");
  const directory = path.join(root, "backups");
  const databasePath = path.join(root, "current.db");
  const readyPath = path.join(root, "manual.ready");
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  createCanonicalFixture(databasePath, {
    markerId: "agent:backup-operation-hard-crash",
    replaySessionId: "operator-session:backup-operation-hard-crash",
    includePrivateMaterial: true,
  });
  const operationUuid = "55555555-5555-4555-8555-555555555555";
  const createdAt = "2026-07-20T03:00:00.000Z";
  const live = startCrashHelper({
    kind: "manual",
    database_path: databasePath,
    backup_directory: directory,
    ready_path: readyPath,
    operation_uuid: operationUuid,
    created_at: createdAt,
    reason: "manual_recovery",
    crash_phase: "after_snapshot",
    hold: true,
  }, "manual-live-owner");
  await waitForPath(readyPath, live, 10_000);
  let liveResult;
  try {
    await expectRecoveryError(
      () =>
        reconcileRecoveryBackupOperation({
          backupDirectory: directory,
          applicationScopeFingerprint,
          inspectDatabase: inspectRecoveryDatabaseFile,
        }),
      "recovery_backup_operation_in_progress",
    );
  } finally {
    try {
      process.kill(live.pid, "SIGKILL");
    } catch (error) {
      if (error?.code !== "ESRCH") throw error;
    }
    liveResult = await live.result;
  }
  assert.equal(liveResult.timed_out, false);
  assert.equal(liveResult.signal, "SIGKILL");

  const journalPath = path.join(directory, RECOVERY_BACKUP_OPERATION_FILE);
  assert.equal(existsSync(journalPath), true);
  const stagingPath = path.join(
    directory,
    `.augnes-recovery-incomplete-${operationUuid}`,
  );
  assert.equal(existsSync(stagingPath), true);
  assert.equal(filesContainingPrivateMaterial(stagingPath).length > 0, true);
  let heldPath = null;
  await expectRecoveryError(
    () =>
      reconcileRecoveryBackupOperation({
        backupDirectory: directory,
        applicationScopeFingerprint,
        inspectDatabase: inspectRecoveryDatabaseFile,
        dependencies: {
          beforeStagingRemoval({ stagingPath: exactPath }) {
            heldPath = `${exactPath}.held`;
            renameSync(exactPath, heldPath);
            mkdirSync(exactPath, { mode: 0o700 });
          },
        },
      }),
    "recovery_backup_operation_changed",
  );
  assert(heldPath);
  rmSync(stagingPath, { recursive: true, force: true });
  renameSync(heldPath, stagingPath);
  const reconciled = await reconcileRecoveryBackupOperation({
    backupDirectory: directory,
    applicationScopeFingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
  });
  assert.equal(reconciled.outcome, "stale_backup_stage_removed");
  assert.equal(existsSync(journalPath), false);
  assert.equal(existsSync(stagingPath), false);

  const replayed = await createRecoveryBackup({
    databasePath,
    backupDirectory: directory,
    applicationScopeFingerprint,
    sourceApplication,
    reason: "manual_recovery",
    inspectDatabase: inspectRecoveryDatabaseFile,
    operationUuid,
    now: () => new Date(createdAt),
  });
  assertNoPrivateMaterialBytes(replayed.backupPath);

  const legacyRoot = path.join(root, "legacy");
  const legacyDirectory = path.join(legacyRoot, "backups");
  const legacyPath = path.join(
    legacyDirectory,
    "augnes-pre-migration-2026-07-20T040000-000Z-hard-crash.db",
  );
  const legacyReadyPath = path.join(legacyRoot, "legacy.ready");
  mkdirSync(legacyDirectory, { recursive: true, mode: 0o700 });
  createPinnedMergedR8ALegacyFixture(
    legacyPath,
    "agent:legacy-operation-hard-crash",
  );
  const legacy = startCrashHelper({
    kind: "legacy_adoption",
    backup_directory: legacyDirectory,
    ready_path: legacyReadyPath,
    crash_phase: "after_snapshot",
    hold: false,
  }, "legacy-adoption-hard-crash");
  await waitForPath(legacyReadyPath, legacy, 10_000);
  const legacyResult = await legacy.result;
  assert.equal(legacyResult.timed_out, false);
  assert.equal(legacyResult.signal, "SIGKILL");
  assert.equal(
    readdirSync(legacyDirectory).some((entry) =>
      entry.startsWith(".augnes-recovery-incomplete-"),
    ),
    true,
  );
  await reconcileRecoveryBackupOperation({
    backupDirectory: legacyDirectory,
    applicationScopeFingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
  });
  const legacyReplay = await adoptLegacyRecoveryBackups({
    backupDirectory: legacyDirectory,
    applicationScopeFingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
    inspectSourceDatabase: inspectLegacyRecoveryAdoptionSourceDatabaseFile,
  });
  assert.equal(legacyReplay.adopted.length, 1);
  assert.equal(legacyReplay.rejected.length, 0);
  assert.equal(existsSync(legacyPath), false);
  assertNoPrivateMaterialBytes(legacyDirectory);

  const safetyRoot = path.join(root, "published-safety");
  const safetyDirectory = path.join(safetyRoot, "backups");
  const safetyDatabasePath = path.join(safetyRoot, "current.db");
  const safetyReadyPath = path.join(safetyRoot, "safety.ready");
  mkdirSync(safetyDirectory, { recursive: true, mode: 0o700 });
  createCanonicalFixture(safetyDatabasePath, {
    markerId: "agent:published-safety-reconciliation",
    replaySessionId: "operator-session:published-safety-reconciliation",
    includePrivateMaterial: false,
  });
  const safetyDatabase = new Database(safetyDatabasePath);
  safetyDatabase.exec("DROP TABLE augnes_package_identity_guard");
  safetyDatabase.close();
  const safety = startCrashHelper({
    kind: "manual",
    database_path: safetyDatabasePath,
    backup_directory: safetyDirectory,
    ready_path: safetyReadyPath,
    operation_uuid: "66666666-6666-4666-8666-666666666666",
    created_at: "2026-07-20T05:00:00.000Z",
    reason: "pre_restore_safety",
    crash_phase: "after_publish",
    hold: false,
  }, "published-safety-hard-crash");
  await waitForPath(safetyReadyPath, safety, 10_000);
  const safetyResult = await safety.result;
  assert.equal(safetyResult.signal, "SIGKILL");
  const safetyReconciled = await reconcileRecoveryBackupOperation({
    backupDirectory: safetyDirectory,
    applicationScopeFingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
    inspectSafetyDatabase: inspectSafetyRecoveryDatabaseFile,
  });
  assert.equal(safetyReconciled.outcome, "published_backup_preserved");
  assert.equal(existsSync(path.join(safetyDirectory, RECOVERY_BACKUP_OPERATION_FILE)), false);

  for (const candidate of [directory, legacyDirectory, safetyDirectory]) {
    assert.equal(
      walkFiles(candidate).some((entry) =>
        path.basename(entry).startsWith(".augnes-recovery-incomplete-") ||
        path.basename(entry) === RECOVERY_BACKUP_OPERATION_FILE ||
        path.basename(entry).startsWith(`${RECOVERY_BACKUP_OPERATION_FILE}.write-`),
      ),
      false,
    );
  }
}

function startCrashHelper(options, label) {
  let pid = null;
  let stderr = "";
  const result = runCanonicalChild({
    suite: "recovery-backup",
    label,
    command: process.execPath,
    args: [process.argv[1], "--backup-operation-crash-helper", JSON.stringify(options)],
    cwd: repositoryRoot,
    env: buildCanonicalChildEnvironment({
      temporaryRoot,
      resourceRoot: temporaryRoot,
    }),
    timeoutMs: 15_000,
    heartbeatMs: 0,
    termGraceMs: 500,
    killGraceMs: 2_000,
    stdout: { write() {} },
    stderr: { write: (chunk) => { stderr += chunk.toString(); } },
    log() {},
    onSpawn(childPid) {
      pid = childPid;
    },
  });
  return {
    get pid() { return pid; },
    get stderr() { return stderr; },
    result,
  };
}

async function waitForPath(filePath, child, timeoutMs) {
  const startedAt = Date.now();
  while (!existsSync(filePath)) {
    if (Date.now() - startedAt >= timeoutMs) {
      if (child.pid) process.kill(child.pid, "SIGKILL");
      await child.result;
      throw new Error(`crash helper did not become ready: ${child.stderr}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

async function testLegacyAdoptionRetentionIdempotency() {
  const root = path.join(temporaryRoot, "legacy-adoption-retention");
  const directory = path.join(root, "backups");
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const templatePath = path.join(root, "pinned-r8a-template.db");
  createPinnedMergedR8ALegacyFixture(
    templatePath,
    "agent:legacy-adoption-retention-template",
  );
  assert.equal(
    inspectLegacyRecoveryAdoptionSourceDatabaseFile(templatePath)
      .schema_signature,
    PINNED_MERGED_R8A_LEGACY_SCHEMA_SIGNATURE,
  );
  const legacyPaths = [];
  for (let index = 0; index < 7; index += 1) {
    const legacyPath = path.join(
      directory,
      `augnes-pre-migration-2026-07-20T01${String(index).padStart(2, "0")}00-000Z-${String(index + 1).padStart(8, "0")}.db`,
    );
    cpSync(templatePath, legacyPath);
    chmodSync(legacyPath, 0o600);
    legacyPaths.push(legacyPath);
  }
  const sourceFamilies = new Map(
    legacyPaths.map((legacyPath) => [
      legacyPath,
      snapshotDatabaseFamily(legacyPath),
    ]),
  );

  const first = await adoptLegacyRecoveryBackups({
    backupDirectory: directory,
    applicationScopeFingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
    inspectSourceDatabase: inspectLegacyRecoveryAdoptionSourceDatabaseFile,
  });
  assert.equal(first.adopted.length, 6);
  assert.equal(first.already_adopted.length, 0);
  assert.equal(first.rejected.length, 1);
  assert.equal(
    first.rejected[0].reason,
    "legacy_backup_retained_after_adoption",
  );
  const retainedLegacyPaths = legacyPaths.filter((legacyPath) =>
    existsSync(legacyPath),
  );
  assert.equal(retainedLegacyPaths.length, 1);
  assert.equal(
    path.basename(retainedLegacyPaths[0]),
    first.rejected[0].legacy_basename,
  );
  assert.deepEqual(
    snapshotDatabaseFamily(retainedLegacyPaths[0]),
    sourceFamilies.get(retainedLegacyPaths[0]),
    "the unadoptable legacy source must remain exact",
  );
  assert.equal(
    legacyPaths.filter((legacyPath) => !existsSync(legacyPath)).length,
    6,
    "every verified adopted source must be removed",
  );

  const firstInventory = listRecoveryBackups({
    backupDirectory: directory,
    applicationScopeFingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
  });
  assert.equal(firstInventory.verified.length, 6);
  assert.equal(firstInventory.rejected.length, 0);
  for (const backup of firstInventory.verified) {
    assertNoPrivateMaterialBytes(backup.backupPath);
  }
  assert.deepEqual(
    filesContainingPrivateMaterial(directory),
    [retainedLegacyPaths[0]],
    "only the exact unadoptable legacy source may retain raw material",
  );

  const adoptionStatePath = path.join(
    directory,
    LEGACY_RECOVERY_ADOPTION_FILE,
  );
  const adoptionState = JSON.parse(readFileSync(adoptionStatePath, "utf8"));
  assert.equal(adoptionState.contract, LEGACY_RECOVERY_ADOPTION_CONTRACT);
  assert.equal(
    adoptionState.schema_version,
    LEGACY_RECOVERY_ADOPTION_SCHEMA_VERSION,
  );
  assert.equal(
    adoptionState.application_scope_fingerprint,
    applicationScopeFingerprint,
  );
  assert.equal(adoptionState.entries.length, 7);
  assert.deepEqual(
    adoptionState.entries.map((entry) => entry.legacy_basename),
    legacyPaths.map((legacyPath) => path.basename(legacyPath)),
  );
  assert.equal(
    adoptionState.entries.every(
      (entry) =>
        entry.source_mode === 0o600 &&
        Number.isSafeInteger(entry.source_size) &&
        entry.source_size > 0 &&
        /^[a-f0-9]{64}$/u.test(entry.source_sha256) &&
        /^recovery:[0-9a-f-]{36}$/iu.test(entry.adopted_backup_id) &&
        /^sha256:[a-f0-9]{64}$/u.test(entry.adopted_backup_identity),
    ),
    true,
  );
  assertRestrictedMode(adoptionStatePath, 0o600);
  assert.equal(
    lstatSync(adoptionStatePath).size <= 1024 * 1024,
    true,
  );

  const namesBeforeReplay = readdirSync(directory).sort();
  const markerBeforeReplay = {
    bytes: readFileSync(adoptionStatePath),
    inode: lstatSync(adoptionStatePath, { bigint: true }).ino,
  };
  const backupsBeforeReplay = firstInventory.verified.map((backup) => ({
    backup_basename: backup.backupPath.split(path.sep).at(-1),
    backup_id: backup.manifest.backup_id,
    backup_identity: backup.manifest.backup_identity,
    inode: lstatSync(backup.backupPath, { bigint: true }).ino,
  }));

  const repeated = await adoptLegacyRecoveryBackups({
    backupDirectory: directory,
    applicationScopeFingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
    inspectSourceDatabase: inspectLegacyRecoveryAdoptionSourceDatabaseFile,
  });
  assert.equal(repeated.adopted.length, 0);
  assert.equal(repeated.already_adopted.length, 6);
  assert.equal(repeated.rejected.length, 1);
  assert.equal(
    repeated.rejected[0].reason,
    "legacy_backup_retained_after_adoption",
  );
  assert.deepEqual(
    readdirSync(directory).sort(),
    namesBeforeReplay,
    "repeated legacy adoption must not rotate or recreate backup paths",
  );
  assert.deepEqual(readFileSync(adoptionStatePath), markerBeforeReplay.bytes);
  assert.equal(
    lstatSync(adoptionStatePath, { bigint: true }).ino,
    markerBeforeReplay.inode,
    "an unchanged adoption ledger must not be republished",
  );
  const repeatedInventory = listRecoveryBackups({
    backupDirectory: directory,
    applicationScopeFingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
  });
  assert.deepEqual(
    repeatedInventory.verified.map((backup) => ({
      backup_basename: backup.backupPath.split(path.sep).at(-1),
      backup_id: backup.manifest.backup_id,
      backup_identity: backup.manifest.backup_identity,
      inode: lstatSync(backup.backupPath, { bigint: true }).ino,
    })),
    backupsBeforeReplay,
    "repeated adoption must preserve the exact six retained backup identities",
  );
  assert.deepEqual(
    legacyPaths.filter((legacyPath) => existsSync(legacyPath)),
    retainedLegacyPaths,
  );
  assert.equal(
    readdirSync(directory).some((name) =>
      name.startsWith(`${LEGACY_RECOVERY_ADOPTION_FILE}.write-`),
    ),
    false,
  );
}

async function testLegacyAdoptionCrashAndIdentityRecovery() {
  const crashRoot = path.join(temporaryRoot, "legacy-adoption-ledger-crash");
  const crashDirectory = path.join(crashRoot, "backups");
  const crashBasename =
    "augnes-pre-migration-2026-07-20T020000-000Z-crash.db";
  const crashPath = path.join(crashDirectory, crashBasename);
  mkdirSync(crashDirectory, { recursive: true, mode: 0o700 });
  createPinnedMergedR8ALegacyFixture(
    crashPath,
    "agent:legacy-adoption-ledger-crash",
  );
  const crashSourceFamily = snapshotDatabaseFamily(crashPath);
  let crashHookProof = null;
  await assert.rejects(
    adoptLegacyRecoveryBackups({
      backupDirectory: crashDirectory,
      applicationScopeFingerprint,
      inspectDatabase: inspectRecoveryDatabaseFile,
      inspectSourceDatabase: inspectLegacyRecoveryAdoptionSourceDatabaseFile,
      dependencies: {
        afterLegacyAdoptionLedgerPersisted(proof) {
          assert.equal(proof.legacyBasename, crashBasename);
          assert.match(proof.backupId, /^recovery:[0-9a-f-]{36}$/iu);
          const ledger = JSON.parse(
            readFileSync(
              path.join(crashDirectory, LEGACY_RECOVERY_ADOPTION_FILE),
              "utf8",
            ),
          );
          assert.equal(
            ledger.entries.some(
              (entry) =>
                entry.legacy_basename === crashBasename &&
                entry.adopted_backup_id === proof.backupId,
            ),
            true,
          );
          const inventory = listRecoveryBackups({
            backupDirectory: crashDirectory,
            applicationScopeFingerprint,
            inspectDatabase: inspectRecoveryDatabaseFile,
          });
          assert.equal(inventory.verified.length, 1);
          assert.equal(inventory.verified[0].manifest.backup_id, proof.backupId);
          crashHookProof = proof;
          throw new Error("injected ledger-before-source-delete crash");
        },
      },
    }),
    /injected ledger-before-source-delete crash/u,
  );
  assert(crashHookProof);
  assert.deepEqual(snapshotDatabaseFamily(crashPath), crashSourceFamily);
  assert.deepEqual(filesContainingPrivateMaterial(crashDirectory), [crashPath]);

  const crashReplay = await adoptLegacyRecoveryBackups({
    backupDirectory: crashDirectory,
    applicationScopeFingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
    inspectSourceDatabase: inspectLegacyRecoveryAdoptionSourceDatabaseFile,
  });
  assert.equal(crashReplay.adopted.length, 0);
  assert.equal(crashReplay.already_adopted.length, 1);
  assert.equal(crashReplay.rejected.length, 0);
  assert.equal(
    crashReplay.already_adopted[0].backup_id,
    crashHookProof.backupId,
  );
  assert.equal(existsSync(crashPath), false);
  assertNoPrivateMaterialBytes(crashDirectory);
  const crashNamesBeforeLedgerReplay = readdirSync(crashDirectory).sort();
  const crashLedgerBeforeReplay = readFileSync(
    path.join(crashDirectory, LEGACY_RECOVERY_ADOPTION_FILE),
  );
  const ledgerOnlyReplay = await adoptLegacyRecoveryBackups({
    backupDirectory: crashDirectory,
    applicationScopeFingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
    inspectSourceDatabase: inspectLegacyRecoveryAdoptionSourceDatabaseFile,
  });
  assert.equal(ledgerOnlyReplay.adopted.length, 0);
  assert.equal(ledgerOnlyReplay.already_adopted.length, 1);
  assert.equal(ledgerOnlyReplay.rejected.length, 0);
  assert.deepEqual(readdirSync(crashDirectory).sort(), crashNamesBeforeLedgerReplay);
  assert.deepEqual(
    readFileSync(path.join(crashDirectory, LEGACY_RECOVERY_ADOPTION_FILE)),
    crashLedgerBeforeReplay,
  );

  const raceRoot = path.join(temporaryRoot, "legacy-adoption-identity-race");
  const raceDirectory = path.join(raceRoot, "backups");
  const raceBasename =
    "augnes-pre-migration-2026-07-20T021000-000Z-identity.db";
  const racePath = path.join(raceDirectory, raceBasename);
  const replacementPath = path.join(raceRoot, "replacement.db");
  const heldOriginalPath = path.join(raceRoot, "held-original.db");
  mkdirSync(raceDirectory, { recursive: true, mode: 0o700 });
  createPinnedMergedR8ALegacyFixture(
    racePath,
    "agent:legacy-adoption-identity-original",
  );
  createPinnedMergedR8ALegacyFixture(
    replacementPath,
    "agent:legacy-adoption-identity-replacement",
  );
  const originalFamily = snapshotDatabaseFamily(racePath);
  const replacementFamily = snapshotDatabaseFamily(replacementPath);
  assert.notDeepEqual(replacementFamily, originalFamily);
  let raceHookCalls = 0;
  const raceResult = await adoptLegacyRecoveryBackups({
    backupDirectory: raceDirectory,
    applicationScopeFingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
    inspectSourceDatabase: inspectLegacyRecoveryAdoptionSourceDatabaseFile,
    dependencies: {
      afterLegacyAdoptionLedgerPersisted({ legacyBasename, backupId }) {
        raceHookCalls += 1;
        assert.equal(legacyBasename, raceBasename);
        assert.match(backupId, /^recovery:[0-9a-f-]{36}$/iu);
        renameSync(racePath, heldOriginalPath);
        renameSync(replacementPath, racePath);
      },
    },
  });
  assert.equal(raceHookCalls, 1);
  assert.equal(raceResult.adopted.length, 0);
  assert.equal(raceResult.already_adopted.length, 0);
  assert.deepEqual(raceResult.rejected, [
    {
      legacy_basename: raceBasename,
      reason: "legacy_backup_changed",
    },
  ]);
  assert.deepEqual(
    snapshotDatabaseFamily(racePath),
    replacementFamily,
    "identity mismatch must preserve the exact replacement source",
  );
  assert.deepEqual(snapshotDatabaseFamily(heldOriginalPath), originalFamily);
  assert.deepEqual(filesContainingPrivateMaterial(raceDirectory), [racePath]);
  const raceInventory = listRecoveryBackups({
    backupDirectory: raceDirectory,
    applicationScopeFingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
  });
  assert.equal(raceInventory.verified.length, 1);
  assert.equal(raceInventory.rejected.length, 0);
  assertNoPrivateMaterialBytes(raceInventory.verified[0].backupPath);
  assert.equal(
    readdirSync(raceDirectory).some((name) =>
      name.startsWith(`${LEGACY_RECOVERY_ADOPTION_FILE}.write-`),
    ),
    false,
  );
}

async function testAtomicRestoreLifecycle({
  selectedBackup,
  selectedSnapshot,
}) {
  const success = await createRestoreScenario({
    name: "success",
    selectedBackup,
  });
  const successResult = await restoreRuntimeDatabase(
    restoreArguments(success, selectedBackup),
  );
  assert.equal(successResult.databaseState, "restored");
  assert.equal(successResult.schemaVersion, "current");
  assert.equal(
    successResult.selectedBackupId,
    selectedBackup.manifest.backup_id,
  );
  assert.equal(successResult.safetyBackupCreated, true);
  assert.equal(successResult.recoveryBackupCreated, true);
  assert.equal(existsSync(successResult.safetyBackupPath), true);
  assert.deepEqual(
    readDurableFixtureSnapshot(success.databasePath),
    selectedSnapshot,
    "atomic restore must publish the exact selected canonical, ledger, and replay state",
  );
  assertSafetyBackupPreservedDisplacedState({
    scenario: success,
    safetyBackupPath: successResult.safetyBackupPath,
  });
  assertRestoreScenarioClean(success, {
    expectedBackupCount: 2,
    selectedBackupId: selectedBackup.manifest.backup_id,
  });

  const failurePoints = [
    {
      name: "before-replacement",
      dependencies: {
        beforeReplacement() {
          throw new Error("injected restore failure before replacement");
        },
      },
    },
    {
      name: "after-original-move",
      dependencies: {
        afterOriginalMoved() {
          throw new Error("injected restore failure after original move");
        },
      },
    },
    {
      name: "after-publication",
      dependencies: {
        afterStagingPublished() {
          throw new Error("injected restore failure after publication");
        },
      },
    },
    {
      name: "post-publication-verification",
      dependencies: {
        afterStagingPublished({ databasePath }) {
          writeFileSync(databasePath, "not a sqlite database\n", {
            mode: 0o600,
          });
        },
      },
    },
  ];

  for (const failurePoint of failurePoints) {
    const scenario = await createRestoreScenario({
      name: failurePoint.name,
      selectedBackup,
    });
    let failure = null;
    try {
      await restoreRuntimeDatabase({
        ...restoreArguments(scenario, selectedBackup),
        dependencies: failurePoint.dependencies,
      });
    } catch (error) {
      failure = error;
    }
    assert.equal(
      failure instanceof PublicDatabaseBootstrapError,
      true,
      `${failurePoint.name} must fail through the public bootstrap boundary`,
    );
    assert.equal(failure.code, "database_bootstrap_failed");
    assert.deepEqual(
      snapshotDatabaseFamily(scenario.databasePath),
      scenario.displacedFamily,
      `${failurePoint.name} must preserve the exact authoritative database family`,
    );
    assert.deepEqual(
      readDurableFixtureSnapshot(scenario.databasePath),
      scenario.displacedSnapshot,
      `${failurePoint.name} must preserve canonical, ledger, and replay state`,
    );
    const inventory = listRecoveryBackups({
      backupDirectory: scenario.backupDirectory,
      applicationScopeFingerprint,
      inspectDatabase: inspectRecoveryDatabaseFile,
    });
    assert.equal(inventory.rejected.length, 0);
    assert.equal(inventory.verified.length, 2);
    const retainedSelected = inventory.verified.find(
      (backup) =>
        backup.manifest.backup_id === selectedBackup.manifest.backup_id,
    );
    const retainedSafety = inventory.verified.find(
      (backup) => backup.manifest.reason === "pre_restore_safety",
    );
    assert(retainedSelected, `${failurePoint.name} must retain selected backup`);
    assert(retainedSafety, `${failurePoint.name} must retain safety backup`);
    assert.equal(
      retainedSelected.manifest.backup_identity,
      selectedBackup.manifest.backup_identity,
    );
    assertSafetyBackupPreservedDisplacedState({
      scenario,
      safetyBackupPath: retainedSafety.backupPath,
    });
    assertRestoreScenarioClean(scenario, {
      expectedBackupCount: 2,
      selectedBackupId: selectedBackup.manifest.backup_id,
    });
  }
}

async function createRestoreScenario({ name, selectedBackup }) {
  const root = path.join(temporaryRoot, "restore-scenarios", name);
  const databasePath = path.join(root, "database", "augnes.db");
  const scenarioBackupDirectory = path.join(root, "backups");
  mkdirSync(scenarioBackupDirectory, { recursive: true, mode: 0o700 });
  const selectedDestination = path.join(
    scenarioBackupDirectory,
    selectedBackup.backupBasename,
  );
  cpSync(selectedBackup.backupPath, selectedDestination, {
    recursive: true,
    preserveTimestamps: true,
  });
  chmodSync(selectedDestination, 0o700);
  chmodSync(path.join(selectedDestination, "state"), 0o700);
  chmodSync(
    path.join(selectedDestination, RECOVERY_MANIFEST_FILE),
    0o600,
  );
  chmodSync(
    path.join(selectedDestination, RECOVERY_DATABASE_PAYLOAD),
    0o600,
  );

  createCanonicalFixture(databasePath, {
    markerId: `agent:restore-displaced-${name}`,
    replaySessionId: `operator-session:restore-displaced-${name}`,
  });
  return {
    name,
    root,
    databasePath,
    backupDirectory: scenarioBackupDirectory,
    displacedFamily: snapshotDatabaseFamily(databasePath),
    displacedSnapshot: readDurableFixtureSnapshot(databasePath),
  };
}

async function testSelectedBackupReplacementRefusal({ selectedBackup }) {
  const scenario = await createRestoreScenario({
    name: "selected-backup-replaced-after-action",
    selectedBackup,
  });
  const acceptedInventory = listRecoveryBackups({
    backupDirectory: scenario.backupDirectory,
    applicationScopeFingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
  });
  const accepted = selectRecoveryBackup(
    acceptedInventory,
    selectedBackup.manifest.backup_id,
  );
  const selectedPath = accepted.backupPath;
  const retainedAcceptedPath = path.join(
    scenario.root,
    "accepted-backup-before-replacement",
  );
  renameSync(selectedPath, retainedAcceptedPath);
  copyRecoveryBackup(selectedBackup, scenario.backupDirectory);
  mutateManifest(
    selectedPath,
    (manifest) => {
      manifest.created_at = "2026-07-20T00:00:01.000Z";
    },
    { recomputeIdentity: true },
  );
  const replacement = validateRecoveryBackup({
    backupPath: selectedPath,
    expectedApplicationScopeFingerprint: applicationScopeFingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
  });
  assert.notDeepEqual(
    replacement.backupDirectoryIdentity,
    accepted.backupDirectoryIdentity,
  );
  assert.notEqual(
    replacement.manifest.backup_identity,
    accepted.manifest.backup_identity,
  );

  await assert.rejects(
    restoreRuntimeDatabase({
      ...restoreArguments(scenario, selectedBackup),
      expectedSelectedBackupIdentity: accepted.manifest.backup_identity,
      expectedSelectedBackupDirectoryIdentity:
        accepted.backupDirectoryIdentity,
    }),
    (error) =>
      error instanceof PublicDatabaseBootstrapError &&
      error.code === "restore_backup_changed",
  );
  assert.deepEqual(
    snapshotDatabaseFamily(scenario.databasePath),
    scenario.displacedFamily,
    "a backup replacement after action acceptance must not mutate current data",
  );
  const inventoryAfter = listRecoveryBackups({
    backupDirectory: scenario.backupDirectory,
    applicationScopeFingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
  });
  assert.equal(inventoryAfter.verified.length, 1);
  assert.equal(
    inventoryAfter.verified.some(
      (backup) => backup.manifest.reason === "pre_restore_safety",
    ),
    false,
    "selection identity mismatch must be refused before creating a safety backup",
  );
  assertRestoreScenarioResidueEmpty(scenario);
}

async function testSelectedBackupFileIdentityReplacementRefusal({
  selectedBackup,
}) {
  for (const [name, relativePath, identityKey] of [
    ["manifest", RECOVERY_MANIFEST_FILE, "manifestFileIdentity"],
    ["payload", RECOVERY_DATABASE_PAYLOAD, "payloadFileIdentity"],
  ]) {
    const scenario = await createRestoreScenario({
      name: `selected-backup-${name}-inode-replaced`,
      selectedBackup,
    });
    const accepted = selectRecoveryBackup(
      listRecoveryBackups({
        backupDirectory: scenario.backupDirectory,
        applicationScopeFingerprint,
        inspectDatabase: inspectRecoveryDatabaseFile,
      }),
      selectedBackup.manifest.backup_id,
    );
    const target = path.join(accepted.backupPath, relativePath);
    const replacement = `${target}.replacement`;
    writeFileSync(replacement, readFileSync(target), { mode: 0o600 });
    renameSync(replacement, target);
    chmodSync(target, 0o600);
    const replacementStats = lstatSync(target, { bigint: true });
    assert.notDeepEqual(
      {
        dev: replacementStats.dev.toString(),
        ino: replacementStats.ino.toString(),
      },
      accepted[identityKey],
    );

    await assert.rejects(
      restoreRuntimeDatabase({
        ...restoreArguments(scenario, selectedBackup),
        expectedSelectedBackupIdentity: accepted.manifest.backup_identity,
        expectedSelectedBackupDirectoryIdentity:
          accepted.backupDirectoryIdentity,
        expectedSelectedStateDirectoryIdentity:
          accepted.stateDirectoryIdentity,
        expectedSelectedManifestFileIdentity:
          accepted.manifestFileIdentity,
        expectedSelectedPayloadFileIdentity:
          accepted.payloadFileIdentity,
      }),
      (error) =>
        error instanceof PublicDatabaseBootstrapError &&
        error.code === "restore_backup_changed",
    );
    assert.deepEqual(
      snapshotDatabaseFamily(scenario.databasePath),
      scenario.displacedFamily,
    );
    assert.equal(
      listRecoveryBackups({
        backupDirectory: scenario.backupDirectory,
        applicationScopeFingerprint,
        inspectDatabase: inspectRecoveryDatabaseFile,
      }).verified.some(
        (backup) => backup.manifest.reason === "pre_restore_safety",
      ),
      false,
    );
    assertRestoreScenarioResidueEmpty(scenario);
  }
}

async function testUnknownSchemaRestoreRefusal({ selectedBackup }) {
  const scenario = createIncompatibleRestoreScenario({
    name: "unknown-schema-refusal",
    selectedBackup,
  });
  let snapshotAttempts = 0;

  await assert.rejects(
    restoreRuntimeDatabase({
      ...restoreArguments(scenario, selectedBackup),
      dependencies: {
        async backupDatabase() {
          snapshotAttempts += 1;
          throw new Error("unknown_schema_snapshot_must_not_start");
        },
      },
    }),
    (error) => {
      assert.equal(error instanceof PublicDatabaseBootstrapError, true);
      assert.equal(error.code, "database_backup_verification_failed");
      assert.equal(error.recoveryBackupCreated, false);
      assert.equal(error.safetyBackupCreated, false);
      assert.equal(error.cause?.code, "recovery_backup_verification_failed");
      assert.equal(error.cause?.cause?.code, "database_schema_unsupported");
      return true;
    },
  );
  assert.equal(
    snapshotAttempts,
    0,
    "unknown current schemas must be refused before a recovery snapshot starts",
  );
  assert.deepEqual(
    snapshotDatabaseFamily(scenario.databasePath),
    scenario.displacedFamily,
    "unknown current schemas must be refused without changing their exact file family",
  );
  assertIncompatibleDatabaseSecret(
    scenario.databasePath,
    scenario.secretId,
    scenario.secretValue,
  );
  assertIncompatibleRestoreInventoryAndResidue(scenario, selectedBackup);
}

function createIncompatibleRestoreScenario({ name, selectedBackup }) {
  const root = path.join(
    temporaryRoot,
    "incompatible-restore-scenarios",
    name,
  );
  const databasePath = path.join(root, "database", "augnes.db");
  const scenarioBackupDirectory = path.join(root, "backups");
  mkdirSync(path.dirname(databasePath), { recursive: true, mode: 0o700 });
  mkdirSync(scenarioBackupDirectory, { recursive: true, mode: 0o700 });
  copyRecoveryBackup(selectedBackup, scenarioBackupDirectory);

  const secretId = `secret:${name}`;
  const secretValue =
    `sk-proj-unknown-schema-${name}-` + "private-token-material-".repeat(32);
  const database = new Database(databasePath);
  database.pragma("foreign_keys = ON");
  database.exec(
    `CREATE TABLE secrets (
       secret_id TEXT PRIMARY KEY NOT NULL,
       secret_value TEXT NOT NULL
     )`,
  );
  database
    .prepare("INSERT INTO secrets (secret_id, secret_value) VALUES (?, ?)")
    .run(secretId, secretValue);
  assert.equal(database.pragma("integrity_check", { simple: true }), "ok");
  assert.deepEqual(database.pragma("foreign_key_check"), []);
  database.close();
  chmodSync(databasePath, 0o600);
  assert.throws(
    () => inspectRecoveryDatabaseFile(databasePath),
    (error) =>
      error instanceof PublicDatabaseBootstrapError &&
      error.code === "database_schema_unsupported",
  );

  return {
    name,
    root,
    databasePath,
    backupDirectory: scenarioBackupDirectory,
    displacedFamily: snapshotDatabaseFamily(databasePath),
    secretId,
    secretValue,
  };
}

function copyRecoveryBackup(selectedBackup, destinationDirectory) {
  const destination = path.join(
    destinationDirectory,
    selectedBackup.backupBasename,
  );
  cpSync(selectedBackup.backupPath, destination, {
    recursive: true,
    preserveTimestamps: true,
  });
  chmodSync(destination, 0o700);
  chmodSync(path.join(destination, "state"), 0o700);
  chmodSync(path.join(destination, RECOVERY_MANIFEST_FILE), 0o600);
  chmodSync(path.join(destination, RECOVERY_DATABASE_PAYLOAD), 0o600);
}

function assertIncompatibleDatabaseSecret(
  databasePath,
  expectedSecretId,
  expectedSecretValue,
) {
  const database = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    assert.equal(database.pragma("integrity_check", { simple: true }), "ok");
    assert.deepEqual(database.pragma("foreign_key_check"), []);
    assert.deepEqual(
      database
        .prepare("SELECT secret_id, secret_value FROM secrets")
        .get(),
      {
        secret_id: expectedSecretId,
        secret_value: expectedSecretValue,
      },
    );
  } finally {
    database.close();
  }
}

function assertIncompatibleRestoreInventoryAndResidue(
  scenario,
  selectedBackup,
) {
  const inventory = listRecoveryBackups({
    backupDirectory: scenario.backupDirectory,
    applicationScopeFingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
  });
  assert.equal(inventory.verified.length, 1);
  assert.equal(
    inventory.verified[0].manifest.backup_id,
    selectedBackup.manifest.backup_id,
  );
  assert.equal(inventory.rejected.length, 0);
  assert.equal(
    inventory.verified.some(
      (backup) => backup.manifest.reason === "pre_restore_safety",
    ),
    false,
  );
  assertRestoreScenarioResidueEmpty(scenario);
}

function restoreArguments(scenario, selectedBackup) {
  return {
    databasePath: scenario.databasePath,
    backupDirectory: scenario.backupDirectory,
    repositoryRoot,
    instanceId: `restore-test-${scenario.name}`,
    repositoryFingerprint: applicationScopeFingerprint,
    runtimeOwnershipGeneration: `restore-generation-${scenario.name}`,
    databaseOverrideActive: true,
    selectedBackupId: selectedBackup.manifest.backup_id,
    targetCompatibility: {
      applicationScopeFingerprint,
    },
  };
}

function assertSafetyBackupPreservedDisplacedState({
  scenario,
  safetyBackupPath,
}) {
  const safetyBackup = validateRecoveryBackup({
    backupPath: safetyBackupPath,
    expectedApplicationScopeFingerprint: applicationScopeFingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
  });
  assert.equal(safetyBackup.manifest.reason, "pre_restore_safety");
  assert.deepEqual(
    readDurableFixtureSnapshot(safetyBackup.payloadPath),
    scenario.displacedSnapshot,
    `${scenario.name} safety backup must preserve displaced canonical, ledger, and replay state`,
  );
}

function assertRestoreScenarioClean(
  scenario,
  { expectedBackupCount, selectedBackupId },
) {
  const inventory = listRecoveryBackups({
    backupDirectory: scenario.backupDirectory,
    applicationScopeFingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
  });
  assert.equal(inventory.rejected.length, 0);
  assert.equal(inventory.verified.length, expectedBackupCount);
  assert(
    inventory.verified.some(
      (backup) => backup.manifest.backup_id === selectedBackupId,
    ),
    `${scenario.name} selected backup must remain retained`,
  );
  assertRestoreScenarioResidueEmpty(scenario);
}

function assertRestoreScenarioResidueEmpty(scenario) {
  const residue = walkFiles(scenario.root)
    .filter((entry) => {
      const basename = path.basename(entry);
      return (
        basename.includes(".augnes-stage-") ||
        basename.includes(".augnes-rollback-") ||
        basename.includes(".augnes-bootstrap") ||
        basename.startsWith(".augnes-recovery-incomplete-") ||
        basename === RECOVERY_BACKUP_OPERATION_FILE ||
        basename.startsWith(`${RECOVERY_BACKUP_OPERATION_FILE}.write-`) ||
        basename.endsWith("-wal") ||
        basename.endsWith("-shm") ||
        basename.endsWith("-journal")
      );
    })
    .map((entry) => path.relative(scenario.root, entry));
  assert.deepEqual(
    residue,
    [],
    `${scenario.name} restore residue remained: ${residue.join(", ")}`,
  );
}

function snapshotDatabaseFamily(databasePath) {
  return ["", "-wal", "-shm", "-journal"].map((suffix) => {
    const filePath = `${databasePath}${suffix}`;
    if (!existsSync(filePath)) return null;
    const stats = lstatSync(filePath);
    return {
      suffix,
      size: stats.size,
      mode: stats.mode,
      mtimeMs: stats.mtimeMs,
      sha256: createHash("sha256").update(readFileSync(filePath)).digest("hex"),
    };
  });
}

function readDurableFixtureSnapshot(databasePath) {
  const database = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    assert.equal(database.pragma("integrity_check", { simple: true }), "ok");
    assert.deepEqual(database.pragma("foreign_key_check"), []);
    const ledger = readCanonicalDatabaseMigrationLedger(database) ?? [];
    if (ledger.length > 0) verifyCanonicalDatabaseMigrationLedger(database);
    return {
      agents: database
        .prepare("SELECT id, name, kind, created_at FROM agents ORDER BY id")
        .all(),
      core_records: database
        .prepare(
          `SELECT record_kind, record_id, workspace_id, project_id, fingerprint,
                  idempotency_key, payload_json, created_at
           FROM vnext_core_records ORDER BY record_kind, record_id`,
        )
        .all(),
      replay_rows: database
        .prepare(
          `SELECT session_id, workspace_id, project_id, operator_id,
                  bootstrap_token_hash, session_token_hash, issued_at,
                  expires_at, bootstrap_consumed_at, revoked_at,
                  action_nonce_hash, action_nonce_expires_at, updated_at
          FROM vnext_local_operator_sessions ORDER BY session_id`,
        )
        .all(),
      safe_predecessor: {
        proposals: database
          .prepare(
            `SELECT * FROM state_delta_proposals
              WHERE reason = ?
              ORDER BY id`,
          )
          .all(safeImplementationStackReason),
        transitions: database
          .prepare(
            `SELECT * FROM state_transitions
              WHERE reason = ?
              ORDER BY id`,
          )
          .all(safeImplementationStackReason),
      },
      private_material: readRecoveryPrivateMaterialFixture(database),
      migration_ledger: ledger,
    };
  } finally {
    database.close();
  }
}

function insertLegacyRecoveryPrivateMaterialFixture(database, fixtureMarkerId) {
  const sessionId = `session:recovery-private:${fixtureMarkerId}`;
  const messageId = `message:recovery-private:${fixtureMarkerId}`;
  const scope = `project:recovery-private:${fixtureMarkerId}`;
  const createdAt = "2026-07-19T23:59:00.000Z";
  database
    .prepare(
      `INSERT OR IGNORE INTO agents (id, name, kind, created_at)
       VALUES (?, 'Temporal Delta Compiler', 'compiler', ?)`,
    )
    .run(RECOVERY_PRIVATE_LEGACY_OBSERVE_SOURCE_AGENT_ID, createdAt);
  database
    .prepare(
      `INSERT INTO sessions (
         id, agent_id, scope, title, started_at, ended_at, surface, actor,
         related_work_id, related_pr, summary, handoff_ref, evidence_pack_ref
       ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, NULL, ?, NULL, NULL)`,
    )
    .run(
      sessionId,
      RECOVERY_PRIVATE_LEGACY_OBSERVE_SOURCE_AGENT_ID,
      scope,
      "Observe user message",
      createdAt,
      "local_runtime",
      "operator:recovery-private",
      "work:recovery-private",
      "Bounded session summary that is not raw Observe input.",
    );
  database
    .prepare(
      `INSERT INTO messages (
         id, session_id, agent_id, role, content, created_at
       ) VALUES (?, ?, NULL, 'user', ?, ?)`,
    )
    .run(messageId, sessionId, rawObserveInputSentinel, createdAt);
  const proposalStatement = database.prepare(
      `INSERT INTO state_delta_proposals (
         id, scope, state_key, before_value, after_value, operation,
         temporal_scope, valid_from, valid_until, stability, change_type,
         source_agent_id, source_session_id, reason, status, proposed_at,
         decided_at, prediction_error_score, salience_score, evidence_score,
         conflict_score, self_impact_score, consolidation_status,
         reinforcement_count, expires_at, last_evaluated_at, scoring_version,
         scoring_reason, score_breakdown
       ) VALUES (
         ?, ?, ?, ?, ?, 'update', 'current_task', NULL, NULL, 'tentative',
         'refinement', ?, ?, ?, 'committed', ?, ?, 0.1, 0.2, 0.3, 0.4, 0.5,
         'committed', 2, NULL, ?, 'v0.2-rule-001', ?, ?
       )`,
    );
  const transitionStatement = database.prepare(
      `INSERT INTO state_transitions (
         id, scope, state_key, before_value, after_value, temporal_scope,
         valid_from, valid_until, stability, change_type, source_agent_id,
         source_session_id, source_proposal_id, reason, committed_at
       ) VALUES (
         ?, ?, ?, ?, ?, 'current_task', NULL, NULL, 'tentative', 'refinement',
         ?, ?, ?, ?, ?
       )`,
    );
  const entryStatement = database.prepare(
      `INSERT OR REPLACE INTO state_entries (
         id, scope, state_key, value, temporal_scope, valid_from, valid_until,
         stability, change_type, source_agent_id, source_session_id,
         source_transition_id, created_at, updated_at
       ) VALUES (
         ?, ?, ?, ?, 'current_task', NULL, NULL, 'tentative', 'refinement',
         ?, ?, ?, ?, ?
       )`,
    );
  const safeAgentId = `agent:recovery-safe-predecessor:${fixtureMarkerId}`;
  const safeSessionId = `session:recovery-safe-predecessor:${fixtureMarkerId}`;
  const safeProposalId = `proposal:recovery-safe-predecessor:${fixtureMarkerId}`;
  const safeTransitionId = `transition:recovery-safe-predecessor:${fixtureMarkerId}`;
  const mismatchedProposalId =
    `proposal:recovery-mismatched-predecessor:${fixtureMarkerId}`;
  const mismatchedTransitionId =
    `transition:recovery-mismatched-predecessor:${fixtureMarkerId}`;
  const mismatchedStateKey = "timeline.deadline_note";
  const mismatchedValue = JSON.stringify(
    "Reviewed deadline state unrelated to the legacy fallback before-value.",
  );
  database
    .prepare(
      `INSERT INTO agents (id, name, kind, created_at)
       VALUES (?, 'Reviewed state predecessor', 'runtime', ?)`,
    )
    .run(safeAgentId, createdAt);
  database
    .prepare(
      `INSERT INTO sessions (
         id, agent_id, scope, title, started_at, surface, actor, summary
       ) VALUES (?, ?, ?, 'Reviewed state predecessor', ?, 'local_runtime',
                 'operator:recovery-safe-predecessor',
                 'Reviewed durable implementation state.')`,
    )
    .run(safeSessionId, safeAgentId, scope, createdAt);
  proposalStatement.run(
    safeProposalId,
    scope,
    "implementation.stack",
    null,
    JSON.stringify(safeImplementationStackValue),
    safeAgentId,
    safeSessionId,
    safeImplementationStackReason,
    "2026-07-19T23:58:00.000Z",
    "2026-07-19T23:58:01.000Z",
    "2026-07-19T23:58:02.000Z",
    "Reviewed scoring metadata.",
    JSON.stringify({ scoring: "reviewed" }),
  );
  transitionStatement.run(
    safeTransitionId,
    scope,
    "implementation.stack",
    null,
    JSON.stringify(safeImplementationStackValue),
    safeAgentId,
    safeSessionId,
    safeProposalId,
    safeImplementationStackReason,
    "2026-07-19T23:58:03.000Z",
  );
  proposalStatement.run(
    mismatchedProposalId,
    scope,
    mismatchedStateKey,
    null,
    mismatchedValue,
    safeAgentId,
    safeSessionId,
    "Reviewed mismatched deadline predecessor.",
    "2026-07-19T23:58:04.000Z",
    "2026-07-19T23:58:05.000Z",
    "2026-07-19T23:58:06.000Z",
    "Reviewed scoring metadata.",
    JSON.stringify({ scoring: "reviewed" }),
  );
  transitionStatement.run(
    mismatchedTransitionId,
    scope,
    mismatchedStateKey,
    null,
    mismatchedValue,
    safeAgentId,
    safeSessionId,
    mismatchedProposalId,
    "Reviewed mismatched deadline predecessor.",
    "2026-07-19T23:58:07.000Z",
  );
  entryStatement.run(
    `entry:recovery-safe-predecessor:${fixtureMarkerId}`,
    scope,
    "implementation.stack",
    JSON.stringify(safeImplementationStackValue),
    safeAgentId,
    safeSessionId,
    safeTransitionId,
    "2026-07-19T23:58:03.000Z",
    "2026-07-19T23:58:04.000Z",
  );
  for (const [index, stateKey] of RECOVERY_PRIVATE_LEGACY_OBSERVE_STATE_KEYS.entries()) {
    const suffix = stateKey.replaceAll(".", "-");
    const proposalId = `proposal:recovery-private:${suffix}:${fixtureMarkerId}`;
    const transitionId = `transition:recovery-private:${suffix}:${fixtureMarkerId}`;
    proposalStatement.run(
      proposalId,
      scope,
      stateKey,
      stateKey === "implementation.stack"
        ? JSON.stringify(safeImplementationStackValue)
        : JSON.stringify(rawObserveBeforeSentinel),
      JSON.stringify(rawObserveInputSentinel),
      RECOVERY_PRIVATE_LEGACY_OBSERVE_SOURCE_AGENT_ID,
      sessionId,
      RECOVERY_PRIVATE_LEGACY_OBSERVE_REASON,
      createdAt,
      `2026-07-19T23:59:0${index + 1}.000Z`,
      "2026-07-19T23:59:05.000Z",
      "Legacy scoring metadata.",
      JSON.stringify({ scoring: "bounded" }),
    );
    transitionStatement.run(
      transitionId,
      scope,
      stateKey,
      stateKey === "implementation.stack"
        ? JSON.stringify(safeImplementationStackValue)
        : JSON.stringify(rawObserveBeforeSentinel),
      JSON.stringify(rawObserveInputSentinel),
      RECOVERY_PRIVATE_LEGACY_OBSERVE_SOURCE_AGENT_ID,
      sessionId,
      proposalId,
      RECOVERY_PRIVATE_LEGACY_OBSERVE_REASON,
      `2026-07-19T23:59:1${index}.000Z`,
    );
    entryStatement.run(
      `entry:recovery-private:${suffix}:${fixtureMarkerId}`,
      scope,
      stateKey,
      JSON.stringify(rawObserveInputSentinel),
      RECOVERY_PRIVATE_LEGACY_OBSERVE_SOURCE_AGENT_ID,
      sessionId,
      transitionId,
      `2026-07-19T23:59:1${index}.000Z`,
      `2026-07-19T23:59:2${index}.000Z`,
    );
  }
}

function readRecoveryPrivateMaterialFixture(database) {
  const sessionPrefix = "session:recovery-private:%";
  return {
    messages: database
      .prepare(
        `SELECT * FROM messages
          WHERE session_id LIKE ?
          ORDER BY id`,
      )
      .all(sessionPrefix),
    proposals: database
      .prepare(
        `SELECT * FROM state_delta_proposals
          WHERE source_agent_id = ? AND reason = ? AND source_session_id LIKE ?
          ORDER BY id`,
      )
      .all(
        RECOVERY_PRIVATE_LEGACY_OBSERVE_SOURCE_AGENT_ID,
        RECOVERY_PRIVATE_LEGACY_OBSERVE_REASON,
        sessionPrefix,
      ),
    entries: database
      .prepare(
        `SELECT * FROM state_entries
          WHERE source_session_id LIKE ?
          ORDER BY id`,
      )
      .all(sessionPrefix),
    transitions: database
      .prepare(
        `SELECT * FROM state_transitions
          WHERE source_agent_id = ? AND reason = ? AND source_session_id LIKE ?
          ORDER BY id`,
      )
      .all(
        RECOVERY_PRIVATE_LEGACY_OBSERVE_SOURCE_AGENT_ID,
        RECOVERY_PRIVATE_LEGACY_OBSERVE_REASON,
        sessionPrefix,
      ),
  };
}

function normalizedPrivateMaterialSnapshot(snapshot) {
  const normalized = structuredClone(snapshot);
  for (const row of normalized.private_material.messages) {
    row.content = RECOVERY_PRIVATE_MATERIAL_MARKER;
  }
  for (const row of normalized.private_material.proposals) {
    row.before_value =
      row.state_key === "implementation.stack"
        ? JSON.stringify(safeImplementationStackValue)
        : RECOVERY_PRIVATE_STATE_VALUE_MARKER;
    row.after_value = RECOVERY_PRIVATE_STATE_VALUE_MARKER;
  }
  for (const row of normalized.private_material.entries) {
    row.value = RECOVERY_PRIVATE_STATE_VALUE_MARKER;
  }
  for (const row of normalized.private_material.transitions) {
    row.before_value =
      row.state_key === "implementation.stack"
        ? JSON.stringify(safeImplementationStackValue)
        : RECOVERY_PRIVATE_STATE_VALUE_MARKER;
    row.after_value = RECOVERY_PRIVATE_STATE_VALUE_MARKER;
  }
  return normalized;
}

function assertPrivateMaterialMetadataPreserved(sourceSnapshot, targetSnapshot) {
  assert.deepEqual(
    targetSnapshot.private_material,
    normalizedPrivateMaterialSnapshot(sourceSnapshot).private_material,
    "privacy normalization may change only the exact raw-content fields; metadata and lineage must remain exact",
  );
}

function assertPrivateMaterialRaw(databasePath) {
  const bytes = databaseFamilyBytes(databasePath);
  assert.equal(bytes.includes(Buffer.from(rawObserveInputSentinel)), true);
  const database = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    const fixture = readRecoveryPrivateMaterialFixture(database);
    assert.equal(fixture.messages.length, 1);
    assert.equal(fixture.messages[0].content, rawObserveInputSentinel);
    assert.deepEqual(
      fixture.proposals.map((row) => row.state_key).sort(),
      [...RECOVERY_PRIVATE_LEGACY_OBSERVE_STATE_KEYS].sort(),
    );
    assert.equal(fixture.entries.length, 3);
    assert.equal(fixture.transitions.length, 3);
    for (const row of fixture.proposals) {
      assert.equal(
        row.before_value,
        row.state_key === "implementation.stack"
          ? JSON.stringify(safeImplementationStackValue)
          : JSON.stringify(rawObserveBeforeSentinel),
      );
      assert.equal(row.after_value, JSON.stringify(rawObserveInputSentinel));
    }
    for (const row of fixture.entries) {
      assert.equal(row.value, JSON.stringify(rawObserveInputSentinel));
    }
    for (const row of fixture.transitions) {
      assert.equal(
        row.before_value,
        row.state_key === "implementation.stack"
          ? JSON.stringify(safeImplementationStackValue)
          : JSON.stringify(rawObserveBeforeSentinel),
      );
      assert.equal(row.after_value, JSON.stringify(rawObserveInputSentinel));
    }
    assertSafePredecessorLineage(database, fixture, {
      expectedCurrentValue: JSON.stringify(rawObserveInputSentinel),
    });
  } finally {
    database.close();
  }
}

function assertPrivateMaterialNormalized(databasePath) {
  const database = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    const fixture = readRecoveryPrivateMaterialFixture(database);
    assert.equal(fixture.messages.length, 1);
    assert.equal(fixture.messages[0].content, RECOVERY_PRIVATE_MATERIAL_MARKER);
    assert.deepEqual(
      fixture.proposals.map((row) => row.state_key).sort(),
      [...RECOVERY_PRIVATE_LEGACY_OBSERVE_STATE_KEYS].sort(),
    );
    assert.equal(fixture.entries.length, 3);
    assert.equal(fixture.transitions.length, 3);
    for (const row of fixture.proposals) {
      assert.equal(
        row.before_value,
        row.state_key === "implementation.stack"
          ? JSON.stringify(safeImplementationStackValue)
          : RECOVERY_PRIVATE_STATE_VALUE_MARKER,
      );
      assert.equal(row.after_value, RECOVERY_PRIVATE_STATE_VALUE_MARKER);
    }
    for (const row of fixture.entries) {
      assert.equal(row.value, RECOVERY_PRIVATE_STATE_VALUE_MARKER);
    }
    for (const row of fixture.transitions) {
      assert.equal(
        row.before_value,
        row.state_key === "implementation.stack"
          ? JSON.stringify(safeImplementationStackValue)
          : RECOVERY_PRIVATE_STATE_VALUE_MARKER,
      );
      assert.equal(row.after_value, RECOVERY_PRIVATE_STATE_VALUE_MARKER);
    }
    assertSafePredecessorLineage(database, fixture, {
      expectedCurrentValue: RECOVERY_PRIVATE_STATE_VALUE_MARKER,
    });
    const mismatchedEntry = fixture.entries.find(
      (row) => row.state_key === "timeline.deadline_note",
    );
    assert(mismatchedEntry);
    const boundary = createRecoveryPrivateMaterialReadBoundary(database, {
      scope: mismatchedEntry.scope,
    });
    assert.equal(
      projectRecoveryPrivateMaterialStateEntryForAuthoritativeRead(
        mismatchedEntry,
        boundary,
      ),
      null,
      "an unrelated historical transition must not become authoritative current state",
    );
  } finally {
    database.close();
  }
}

function assertSafePredecessorLineage(
  database,
  fixture,
  { expectedCurrentValue },
) {
  const implementationEntry = fixture.entries.find(
    (row) => row.state_key === "implementation.stack",
  );
  assert(implementationEntry);
  assert.equal(implementationEntry.value, expectedCurrentValue);
  const safeProposal = database
    .prepare(
      `SELECT id, scope, state_key, before_value, after_value, status, reason
         FROM state_delta_proposals
        WHERE scope = ? AND state_key = 'implementation.stack' AND reason = ?`,
    )
    .get(implementationEntry.scope, safeImplementationStackReason);
  const safeTransition = database
    .prepare(
      `SELECT id, scope, state_key, before_value, after_value,
              source_proposal_id, reason
         FROM state_transitions
        WHERE scope = ? AND state_key = 'implementation.stack' AND reason = ?`,
    )
    .get(implementationEntry.scope, safeImplementationStackReason);
  assert(safeProposal);
  assert(safeTransition);
  assert.equal(safeProposal.before_value, null);
  assert.equal(
    safeProposal.after_value,
    JSON.stringify(safeImplementationStackValue),
  );
  assert.equal(safeProposal.status, "committed");
  assert.equal(safeTransition.before_value, null);
  assert.equal(
    safeTransition.after_value,
    JSON.stringify(safeImplementationStackValue),
  );
  assert.equal(safeTransition.source_proposal_id, safeProposal.id);
  assert.deepEqual(
    database
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM state_delta_proposals WHERE scope = ?) AS proposals,
           (SELECT COUNT(*) FROM state_transitions WHERE scope = ?) AS transitions,
           (SELECT COUNT(*) FROM state_entries WHERE scope = ?) AS entries`,
      )
      .get(
        implementationEntry.scope,
        implementationEntry.scope,
        implementationEntry.scope,
      ),
    { proposals: 5, transitions: 5, entries: 3 },
    "privacy recovery must preserve lineage without creating semantic events",
  );
}

function databaseFamilyBytes(databasePath) {
  return Buffer.concat(
    ["", "-wal", "-shm", "-journal"]
      .map((suffix) => `${databasePath}${suffix}`)
      .filter((filePath) => existsSync(filePath))
      .map((filePath) => readFileSync(filePath)),
  );
}

function assertNoPrivateMaterialBytes(rootPath) {
  const forbidden = [rawObserveInputSentinel, rawObserveBeforeSentinel];
  const files = lstatSync(rootPath).isDirectory()
    ? walkFiles(rootPath).filter((filePath) => lstatSync(filePath).isFile())
    : [rootPath];
  for (const filePath of files) {
    const bytes = readFileSync(filePath);
    for (const value of forbidden) {
      assert.equal(
        bytes.includes(Buffer.from(value)),
        false,
        `${path.relative(temporaryRoot, filePath)} retained raw private material bytes`,
      );
    }
  }
}

function filesContainingPrivateMaterial(rootPath) {
  const forbidden = [rawObserveInputSentinel, rawObserveBeforeSentinel].map(
    (value) => Buffer.from(value),
  );
  return walkFiles(rootPath)
    .filter((filePath) => lstatSync(filePath).isFile())
    .filter((filePath) => {
      const bytes = readFileSync(filePath);
      return forbidden.some((value) => bytes.includes(value));
    })
    .sort();
}

function testCreatedBackupContract(currentBackup, sourceSnapshot) {
  assert.equal(currentBackup.backupBasename, currentBackupName);
  assert.equal(currentBackup.stagingBasename, currentStagingName);
  assert.equal(existsSync(path.join(backupDirectory, currentStagingName)), false);
  const backupStats = lstatSync(currentBackup.backupPath);
  assert.equal(backupStats.isDirectory(), true);
  assert.equal(backupStats.isSymbolicLink(), false);
  const stateDirectory = path.join(currentBackup.backupPath, "state");
  const manifestPath = path.join(
    currentBackup.backupPath,
    RECOVERY_MANIFEST_FILE,
  );
  const payloadPath = path.join(
    currentBackup.backupPath,
    RECOVERY_DATABASE_PAYLOAD,
  );
  assert.deepEqual(readdirSync(currentBackup.backupPath).sort(), [
    RECOVERY_MANIFEST_FILE,
    "state",
  ]);
  assert.deepEqual(readdirSync(stateDirectory), ["augnes.db"]);
  assertRestrictedMode(currentBackup.backupPath, 0o700);
  assertRestrictedMode(stateDirectory, 0o700);
  assertRestrictedMode(manifestPath, 0o600);
  assertRestrictedMode(payloadPath, 0o600);

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  assert.equal(manifest.contract, RECOVERY_BACKUP_CONTRACT);
  assert.equal(manifest.contract_version, RECOVERY_BACKUP_CONTRACT_VERSION);
  assert.equal(manifest.portable, false);
  assert.equal(
    manifest.application_scope_fingerprint,
    applicationScopeFingerprint,
  );
  assert.equal(manifest.created_at, "2026-07-20T00:00:00.000Z");
  assert.equal(manifest.reason, "pre_update");
  assert.deepEqual(manifest.source_application, sourceApplication);
  assert.match(manifest.backup_id, /^recovery:[0-9a-f-]{36}$/iu);
  assert.deepEqual(Object.keys(manifest).sort(), [
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
  assert.deepEqual(
    manifest.private_material,
    recoveryPrivateMaterialManifestContract(),
  );
  const { backup_identity: ignoredIdentity, ...withoutIdentity } = manifest;
  void ignoredIdentity;
  assert.equal(
    manifest.backup_identity,
    `sha256:${createHash("sha256")
      .update(JSON.stringify(withoutIdentity))
      .digest("hex")}`,
  );
  assert.deepEqual(manifest.payloads, [
    {
      path: RECOVERY_DATABASE_PAYLOAD,
      size: lstatSync(payloadPath).size,
      mode: 0o600,
      sha256: createHash("sha256").update(readFileSync(payloadPath)).digest("hex"),
    },
  ]);
  assert.equal(
    readFileSync(payloadPath).subarray(0, 16).toString("binary"),
    "SQLite format 3\u0000",
  );
  assert.equal(manifest.database.schema_classification, "current");
  assert.deepEqual(
    manifest.database.migration_ids,
    [...CANONICAL_DATABASE_MIGRATION_IDS],
  );
  assert.equal(
    manifest.database.canonical_record_count,
    sourceSnapshot.core_records.length,
  );
  assert.deepEqual(readDurableFixtureSnapshot(payloadPath), sourceSnapshot);
  assert.equal(existsSync(`${payloadPath}-wal`), false);
  assert.equal(existsSync(`${payloadPath}-shm`), false);
  assert.equal(existsSync(`${payloadPath}-journal`), false);
  assert.deepEqual(currentBackup.public, {
    backup_id: manifest.backup_id,
    label: "pre update · 2026-07-20T00:00:00.000Z",
    created_at: "2026-07-20T00:00:00.000Z",
    reason: "pre_update",
    source_application_version: sourceApplication.application_version,
    verified: true,
    recovery_eligible: true,
  });
}

function testInventoryAndSelection({ currentBackup, manualBackup }) {
  const inventory = listRecoveryBackups({
    backupDirectory,
    applicationScopeFingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
  });
  assert.equal(inventory.verified.length, 2);
  assert.equal(inventory.rejected.length, 0);
  assert.deepEqual(
    inventory.verified.map((backup) => backup.manifest.reason),
    ["manual_recovery", "pre_update"],
  );
  assert.equal(
    selectRecoveryBackup(inventory).manifest.backup_id,
    manualBackup.manifest.backup_id,
  );
  assert.equal(
    selectRecoveryBackup(inventory, currentBackup.manifest.backup_id).manifest
      .backup_id,
    currentBackup.manifest.backup_id,
  );
  assert.throws(
    () => selectRecoveryBackup(inventory, "recovery:missing"),
    (error) => recoveryErrorMatches(error, "recovery_backup_not_found"),
  );
}

async function testValidationRefusals(currentBackup) {
  await expectRecoveryError(
    () =>
      validateRecoveryBackup({
        backupPath: currentBackup.backupPath,
        expectedApplicationScopeFingerprint: wrongApplicationScopeFingerprint,
        inspectDatabase: inspectRecoveryDatabaseFile,
      }),
    "restore_validation_failed",
  );

  const manifestTamper = copyAttackFixture(currentBackup.backupPath, 10);
  mutateManifest(manifestTamper, (manifest) => {
    manifest.source_application.application_version = "9.9.9";
  });
  await expectRecoveryError(
    () => validateAttackFixture(manifestTamper),
    "restore_manifest_tampered",
  );
  rmSync(manifestTamper, { recursive: true, force: true });

  const malformedManifest = copyAttackFixture(currentBackup.backupPath, 11);
  writeFileSync(
    path.join(malformedManifest, RECOVERY_MANIFEST_FILE),
    "{not-json\n",
    { mode: 0o600 },
  );
  await expectRecoveryError(
    () => validateAttackFixture(malformedManifest),
    "restore_manifest_invalid",
  );
  rmSync(malformedManifest, { recursive: true, force: true });

  const payloadTamper = copyAttackFixture(currentBackup.backupPath, 12);
  appendFileSync(path.join(payloadTamper, RECOVERY_DATABASE_PAYLOAD), "tampered");
  await expectRecoveryError(
    () => validateAttackFixture(payloadTamper),
    "restore_payload_tampered",
  );
  rmSync(payloadTamper, { recursive: true, force: true });

  const recomputedUnsanitized = copyAttackFixture(
    currentBackup.backupPath,
    20,
  );
  const recomputedUnsanitizedPayload = path.join(
    recomputedUnsanitized,
    RECOVERY_DATABASE_PAYLOAD,
  );
  rewriteRecoveryPrivateMaterialAsRaw(recomputedUnsanitizedPayload);
  mutateManifest(
    recomputedUnsanitized,
    (manifest) => {
      manifest.payloads[0] = {
        path: RECOVERY_DATABASE_PAYLOAD,
        size: lstatSync(recomputedUnsanitizedPayload).size,
        mode: 0o600,
        sha256: createHash("sha256")
          .update(readFileSync(recomputedUnsanitizedPayload))
          .digest("hex"),
      };
    },
    { recomputeIdentity: true },
  );
  await assert.rejects(
    async () => inspectRecoveryDatabaseFile(recomputedUnsanitizedPayload),
    (error) => error?.code === "database_private_material_unsupported",
    "the strict database inspector must reject reintroduced raw private material",
  );
  await assert.rejects(
    async () => validateAttackFixture(recomputedUnsanitized),
    (error) => error?.code === "restore_database_contract_mismatch",
    "an unsanitized payload must fail semantic privacy validation even when its payload hash and manifest identity are recomputed",
  );
  rmSync(recomputedUnsanitized, { recursive: true, force: true });

  const recomputedDeletedBytes = copyAttackFixture(
    currentBackup.backupPath,
    21,
  );
  const recomputedDeletedBytesPayload = path.join(
    recomputedDeletedBytes,
    RECOVERY_DATABASE_PAYLOAD,
  );
  leaveDeletedPrivateMaterialBytes(recomputedDeletedBytesPayload);
  assert.equal(
    readFileSync(recomputedDeletedBytesPayload).includes(
      Buffer.from(deletedObserveInputSentinel),
    ),
    true,
    "the attack fixture must retain deleted raw material outside canonical rows",
  );
  mutateManifest(
    recomputedDeletedBytes,
    (manifest) => {
      manifest.payloads[0] = {
        path: RECOVERY_DATABASE_PAYLOAD,
        size: lstatSync(recomputedDeletedBytesPayload).size,
        mode: 0o600,
        sha256: createHash("sha256")
          .update(readFileSync(recomputedDeletedBytesPayload))
          .digest("hex"),
      };
    },
    { recomputeIdentity: true },
  );
  await assert.rejects(
    async () => validateAttackFixture(recomputedDeletedBytes),
    (error) => error?.code === "restore_database_contract_mismatch",
    "a hash-consistent backup must reject deleted raw private bytes even when every live row contains only the fixed marker",
  );
  rmSync(recomputedDeletedBytes, { recursive: true, force: true });

  const unsafePayloadMode = copyAttackFixture(currentBackup.backupPath, 13);
  chmodSync(path.join(unsafePayloadMode, RECOVERY_DATABASE_PAYLOAD), 0o644);
  await expectRecoveryError(
    () => validateAttackFixture(unsafePayloadMode),
    "restore_payload_invalid",
  );
  rmSync(unsafePayloadMode, { recursive: true, force: true });

  const unexpectedFile = copyAttackFixture(currentBackup.backupPath, 14);
  writeFileSync(path.join(unexpectedFile, "unexpected.txt"), "refuse me", {
    mode: 0o600,
  });
  await expectRecoveryError(
    () => validateAttackFixture(unexpectedFile),
    "restore_unexpected_files",
  );
  rmSync(unexpectedFile, { recursive: true, force: true });

  const portableMasquerade = copyAttackFixture(currentBackup.backupPath, 15);
  mutateManifest(
    portableMasquerade,
    (manifest) => {
      manifest.contract = "augnes.portable-project-export.v1";
      manifest.portable = true;
    },
    { recomputeIdentity: true },
  );
  await expectRecoveryError(
    () => validateAttackFixture(portableMasquerade),
    "restore_validation_failed",
  );
  rmSync(portableMasquerade, { recursive: true, force: true });

  const symlinkRoot = attackFixturePath(16);
  symlinkSync(currentBackup.backupPath, symlinkRoot, "dir");
  await expectRecoveryError(
    () => validateAttackFixture(symlinkRoot),
    "restore_validation_failed",
  );
  rmSync(symlinkRoot, { force: true });

  const symlinkPayload = copyAttackFixture(currentBackup.backupPath, 17);
  const symlinkPayloadPath = path.join(
    symlinkPayload,
    RECOVERY_DATABASE_PAYLOAD,
  );
  rmSync(symlinkPayloadPath, { force: true });
  symlinkSync(sourceDatabasePath, symlinkPayloadPath);
  await expectRecoveryError(
    () => validateAttackFixture(symlinkPayload),
    "restore_payload_invalid",
  );
  rmSync(symlinkPayload, { recursive: true, force: true });

  const stateSwap = copyAttackFixture(currentBackup.backupPath, 18);
  const stateSwapPath = path.join(stateSwap, "state");
  const heldStateSwapPath = path.join(temporaryRoot, "held-state-swap");
  await expectRecoveryError(
    () =>
      validateRecoveryBackup({
        backupPath: stateSwap,
        expectedApplicationScopeFingerprint: applicationScopeFingerprint,
        inspectDatabase: inspectRecoveryDatabaseFile,
        dependencies: {
          afterStateDirectoryOpened() {
            renameSync(stateSwapPath, heldStateSwapPath);
            symlinkSync(heldStateSwapPath, stateSwapPath, "dir");
          },
        },
      }),
    "restore_backup_changed",
  );
  unlinkSync(stateSwapPath);
  rmSync(heldStateSwapPath, { recursive: true, force: true });
  rmSync(stateSwap, { recursive: true, force: true });

  const stageStateSwap = copyAttackFixture(currentBackup.backupPath, 19);
  const selectedStageStateSwap = validateAttackFixture(stageStateSwap);
  const stageStatePath = path.join(stageStateSwap, "state");
  const heldStageStatePath = path.join(temporaryRoot, "held-stage-state-swap");
  const refusedStageTarget = path.join(temporaryRoot, "refused-stage-swap.db");
  await expectRecoveryError(
    () =>
      stageRecoveryBackupDatabase({
        selectedBackup: selectedStageStateSwap,
        targetPath: refusedStageTarget,
        inspectDatabase: inspectRecoveryDatabaseFile,
        dependencies: {
          beforePayloadCopy() {
            renameSync(stageStatePath, heldStageStatePath);
            symlinkSync(heldStageStatePath, stageStatePath, "dir");
          },
        },
      }),
    "restore_backup_changed",
  );
  assert.equal(existsSync(refusedStageTarget), false);
  unlinkSync(stageStatePath);
  rmSync(heldStageStatePath, { recursive: true, force: true });
  rmSync(stageStateSwap, { recursive: true, force: true });

  const incompletePath = path.join(
    backupDirectory,
    ".augnes-recovery-incomplete-99999999-9999-4999-8999-999999999999",
  );
  mkdirSync(incompletePath, { mode: 0o700 });
  await expectRecoveryError(
    () =>
      validateRecoveryBackup({
        backupPath: incompletePath,
        expectedApplicationScopeFingerprint: applicationScopeFingerprint,
        inspectDatabase: inspectRecoveryDatabaseFile,
        allowStagingName: true,
      }),
    "restore_unexpected_files",
  );
  const inventoryWithIncomplete = listRecoveryBackups({
    backupDirectory,
    applicationScopeFingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
  });
  assert.equal(inventoryWithIncomplete.verified.length, 2);
  assert.equal(inventoryWithIncomplete.rejected.length, 0);
  removeIncompleteRecoveryBackup(incompletePath);
  assert.equal(existsSync(incompletePath), false);
}

function rewriteRecoveryPrivateMaterialAsRaw(databasePath) {
  const database = new Database(databasePath, { fileMustExist: true });
  try {
    database.pragma("journal_mode = DELETE");
    database
      .prepare(
        `UPDATE messages
            SET content = ?
          WHERE session_id LIKE 'session:recovery-private:%'`,
      )
      .run(rawObserveInputSentinel);
    database
      .prepare(
        `UPDATE state_delta_proposals
            SET before_value = ?, after_value = ?
          WHERE state_key = ? AND source_session_id LIKE 'session:recovery-private:%'`,
      )
      .run(
        JSON.stringify(rawObserveBeforeSentinel),
        JSON.stringify(rawObserveInputSentinel),
        RECOVERY_PRIVATE_OBSERVATION_STATE_KEY,
      );
    database
      .prepare(
        `UPDATE state_entries
            SET value = ?
          WHERE state_key = ? AND source_session_id LIKE 'session:recovery-private:%'`,
      )
      .run(
        JSON.stringify(rawObserveInputSentinel),
        RECOVERY_PRIVATE_OBSERVATION_STATE_KEY,
      );
    database
      .prepare(
        `UPDATE state_transitions
            SET before_value = ?, after_value = ?
          WHERE state_key = ? AND source_session_id LIKE 'session:recovery-private:%'`,
      )
      .run(
        JSON.stringify(rawObserveBeforeSentinel),
        JSON.stringify(rawObserveInputSentinel),
        RECOVERY_PRIVATE_OBSERVATION_STATE_KEY,
      );
  } finally {
    database.close();
  }
  chmodSync(databasePath, 0o600);
}

function leaveDeletedPrivateMaterialBytes(databasePath) {
  const database = new Database(databasePath, { fileMustExist: true });
  try {
    database.pragma("journal_mode = DELETE");
    database.pragma("secure_delete = OFF");
    assert.equal(database.pragma("auto_vacuum", { simple: true }), 0);
    const sessionId = database
      .prepare(
        `SELECT id FROM sessions
          WHERE id LIKE 'session:recovery-private:%'
          ORDER BY id
          LIMIT 1`,
      )
      .get().id;
    const deletedMessageId = "message:recovery-private:deleted-byte-attack";
    const deletedContent = deletedObserveInputSentinel.repeat(512);
    database
      .prepare(
        `INSERT INTO messages (
           id, session_id, agent_id, role, content, created_at
         ) VALUES (?, ?, NULL, 'user', ?, ?)`,
      )
      .run(
        deletedMessageId,
        sessionId,
        deletedContent,
        "2026-07-20T00:00:00.000Z",
      );
    assert.equal(
      database.prepare("DELETE FROM messages WHERE id = ?").run(deletedMessageId)
        .changes,
      1,
    );
    assert.equal(
      database.prepare("SELECT COUNT(*) AS count FROM messages WHERE id = ?")
        .get(deletedMessageId).count,
      0,
    );
  } finally {
    database.close();
  }
  chmodSync(databasePath, 0o600);
}

function testOperationalResults() {
  for (let index = 0; index < 25; index += 1) {
    writeRecoveryOperationResult({
      backupDirectory,
      event: operationEvent(index),
    });
  }
  const results = readRecoveryOperationResults(backupDirectory);
  assert.equal(results.contract, RECOVERY_OPERATION_CONTRACT);
  assert.equal(results.schema_version, RECOVERY_OPERATION_SCHEMA_VERSION);
  assert.equal(results.installed_package, null);
  assert.equal(results.pending_package, null);
  assert.equal(results.pending_update_source, null);
  assert.equal(results.pending_action, null);
  assert.equal(results.completed_action, null);
  assert.equal(results.events.length, 20);
  assert.equal(results.events[0].reason_code, "result_24");
  assert.equal(results.events.at(-1).reason_code, "result_5");
  assert.equal(
    results.events.every(
      (event) =>
        event.backup_verified === true &&
        event.data_preserved === true &&
        event.safety_backup_created === (Number(event.reason_code.slice(7)) % 2 === 0),
    ),
    true,
  );
  const operationPath = path.join(backupDirectory, RECOVERY_OPERATION_FILE);
  assertRestrictedMode(operationPath, 0o600);
  assert.equal(lstatSync(operationPath).size <= 256 * 1024, true);
  const serialized = readFileSync(operationPath, "utf8");
  assert.equal(serialized.includes(providerSecretSentinel), false);
  assert.equal(serialized.includes(privatePathSentinel), false);
  writeRecoveryOperationResult({
    backupDirectory,
    event: {
      ...operationEvent(25),
      application_version: "0.1.0+legacy.build.7",
      target_application_version: "0.1.1+recovery.build.2",
    },
  });
  assert.equal(
    readRecoveryOperationResults(backupDirectory).events[0]
      .target_application_version,
    "0.1.1+recovery.build.2",
  );
  assert.throws(
    () =>
      writeRecoveryOperationResult({
        backupDirectory,
        event: {
          ...operationEvent(26),
          reason_code: `Error: ${privatePathSentinel} token=${providerSecretSentinel}`,
        },
      }),
    (error) => recoveryErrorMatches(error, "recovery_result_invalid"),
  );
  assert.equal(readRecoveryOperationResults(backupDirectory).events.length, 20);
  const pendingAction = writePendingRecoveryAction({
    backupDirectory,
    action: pendingRecoveryActionFixture(),
  });
  assert.deepEqual(
    readRecoveryOperationResults(backupDirectory).pending_action,
    pendingAction,
  );
  assert.throws(
    () =>
      writePendingRecoveryAction({
        backupDirectory,
        action: pendingRecoveryActionFixture(),
      }),
    (error) => recoveryErrorMatches(error, "recovery_action_in_progress"),
  );
  const pendingPackage = writePendingPackageIdentity({
    backupDirectory,
    identity: installedPackageFixture(),
    sourceIdentity: sourceApplication,
  });
  assert.deepEqual(readPendingPackageIdentity(backupDirectory), pendingPackage);
  assert.deepEqual(
    readRecoveryOperationResults(backupDirectory).pending_update_source,
    sourceApplication,
  );
  assert.equal(readInstalledPackageIdentity(backupDirectory), null);
  assert.equal(readRecoveryOperationResults(backupDirectory).events.length, 20);
  assert.equal(clearPendingPackageIdentity({ backupDirectory }), true);
  assert.equal(readPendingPackageIdentity(backupDirectory), null);
  assert.equal(
    readRecoveryOperationResults(backupDirectory).pending_update_source,
    null,
  );
  assert.equal(clearPendingPackageIdentity({ backupDirectory }), false);
  writePendingPackageIdentity({
    backupDirectory,
    identity: installedPackageFixture(),
  });
  const installedPackage = writeInstalledPackageIdentity({
    backupDirectory,
    identity: installedPackageFixture(),
  });
  assert.deepEqual(readInstalledPackageIdentity(backupDirectory), installedPackage);
  assert.equal(readPendingPackageIdentity(backupDirectory), null);
  assert.equal(
    readRecoveryOperationResults(backupDirectory).pending_action.action_id,
    pendingAction.action_id,
    "package identity writes must preserve an accepted recovery action",
  );
  assert.throws(
    () =>
      clearPendingRecoveryAction({
        backupDirectory,
        expectedActionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    }),
    (error) => recoveryErrorMatches(error, "recovery_action_changed"),
  );
  const completionEvent = operationEvent(27);
  const completedActionEvent = completePendingRecoveryAction({
    backupDirectory,
    expectedActionId: pendingAction.action_id,
    event: completionEvent,
  });
  assert.deepEqual(completedActionEvent, completionEvent);
  const completedActionState = readRecoveryOperationResults(backupDirectory);
  assert.equal(completedActionState.pending_action, null);
  assert.deepEqual(completedActionState.completed_action, {
    action_id: pendingAction.action_id,
    event: completionEvent,
  });
  const completedEventCount = completedActionState.events.length;
  assert.deepEqual(
    completePendingRecoveryAction({
      backupDirectory,
      expectedActionId: pendingAction.action_id,
      event: operationEvent(28),
    }),
    completionEvent,
    "replaying the same durable completion must return its first terminal event",
  );
  assert.deepEqual(
    readRecoveryOperationResults(backupDirectory).completed_action,
    completedActionState.completed_action,
  );
  assert.equal(
    readRecoveryOperationResults(backupDirectory).events.length,
    completedEventCount,
  );
  assert.throws(
    () =>
      completePendingRecoveryAction({
        backupDirectory,
        expectedActionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        event: operationEvent(29),
      }),
    (error) => recoveryErrorMatches(error, "recovery_action_changed"),
  );
  assert.throws(
    () =>
      writePendingRecoveryAction({
        backupDirectory,
        action: pendingRecoveryActionFixture(),
      }),
    (error) => recoveryErrorMatches(error, "recovery_action_in_progress"),
  );
  const secondPendingAction = writePendingRecoveryAction({
    backupDirectory,
    action: {
      ...pendingRecoveryActionFixture(),
      action_id: "99999999-9999-4999-8999-999999999998",
      accepted_at: "2026-07-20T00:12:00.000Z",
    },
  });
  assert.equal(
    clearPendingRecoveryAction({
      backupDirectory,
      expectedActionId: secondPendingAction.action_id,
    }),
    true,
  );
  assert.equal(readRecoveryOperationResults(backupDirectory).pending_action, null);
  assert.deepEqual(
    readRecoveryOperationResults(backupDirectory).completed_action,
    completedActionState.completed_action,
  );
  assert.equal(clearPendingRecoveryAction({ backupDirectory }), false);
  assert.equal(readRecoveryOperationResults(backupDirectory).events.length, 20);

  const heldOperationPath = `${operationPath}.held`;
  const stableOperationBytes = readFileSync(operationPath);
  assert.throws(
    () =>
      readRecoveryOperationResults(backupDirectory, {
        afterDescriptorOpened() {
          renameSync(operationPath, heldOperationPath);
          writeFileSync(operationPath, stableOperationBytes, { mode: 0o600 });
        },
      }),
    (error) => recoveryErrorMatches(error, "recovery_result_unavailable"),
  );
  unlinkSync(operationPath);
  renameSync(heldOperationPath, operationPath);
  renameSync(operationPath, heldOperationPath);
  symlinkSync(heldOperationPath, operationPath);
  assert.throws(
    () => readRecoveryOperationResults(backupDirectory),
    (error) => recoveryErrorMatches(error, "recovery_result_unavailable"),
  );
  unlinkSync(operationPath);
  renameSync(heldOperationPath, operationPath);

  const deadWriterResidue = `${operationPath}.write-999999999-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`;
  writeFileSync(deadWriterResidue, "incomplete\n", { mode: 0o600 });
  assert.equal(readRecoveryOperationResults(backupDirectory).events.length, 20);
  assert.equal(existsSync(deadWriterResidue), false);

  const liveWriterResidue = `${operationPath}.write-${process.pid}-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb`;
  writeFileSync(liveWriterResidue, "incomplete\n", { mode: 0o600 });
  assert.throws(
    () => readRecoveryOperationResults(backupDirectory),
    (error) => recoveryErrorMatches(error, "recovery_result_unavailable"),
  );
  assert.equal(existsSync(liveWriterResidue), true);
  unlinkSync(liveWriterResidue);
}

function testBoundedRecoveryInventory() {
  const boundedDirectory = path.join(temporaryRoot, "bounded-inventory");
  mkdirSync(boundedDirectory, { mode: 0o700 });
  for (let index = 0; index < 21; index += 1) {
    const basename = `augnes-recovery-20260720T0100${String(index).padStart(2, "0")}-${index.toString(16).padStart(8, "0")}.backup`;
    mkdirSync(path.join(boundedDirectory, basename), { mode: 0o700 });
  }
  let inspections = 0;
  assert.throws(
    () =>
      listRecoveryBackups({
        backupDirectory: boundedDirectory,
        applicationScopeFingerprint,
        inspectDatabase() {
          inspections += 1;
          throw new Error("inventory limit must apply before validation");
        },
      }),
    (error) =>
      recoveryErrorMatches(error, "recovery_backup_inventory_too_large"),
  );
  assert.equal(inspections, 0);
  rmSync(boundedDirectory, { recursive: true, force: true });
}

async function testRecoveryRetention({ currentBackup, manualBackup }) {
  for (const [uuid, createdAt] of [
    ["66666666-6666-4666-8666-666666666666", "2026-07-20T00:05:00.000Z"],
    ["77777777-7777-4777-8777-777777777777", "2026-07-20T00:06:00.000Z"],
  ]) {
    await createRecoveryBackup({
      databasePath: sourceDatabasePath,
      backupDirectory,
      applicationScopeFingerprint,
      sourceApplication,
      reason: "manual_recovery",
      inspectDatabase: inspectRecoveryDatabaseFile,
      operationUuid: uuid,
      now: () => new Date(createdAt),
      protectedBackupIds: [currentBackup.manifest.backup_id],
    });
  }
  const retained = listRecoveryBackups({
    backupDirectory,
    applicationScopeFingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
  });
  assert.equal(retained.verified.length, 6);
  assert.equal(
    retained.verified.some(
      (backup) =>
        backup.manifest.backup_id === currentBackup.manifest.backup_id,
    ),
    true,
    "explicitly protected last-known-good backup must survive rotation",
  );
  assert.equal(
    existsSync(manualBackup.backupPath),
    false,
    "the oldest unprotected verified backup should rotate only after replacement verification",
  );
}

function pendingRecoveryActionFixture() {
  return {
    action_id: "99999999-9999-4999-8999-999999999999",
    action: "retry_update",
    accepted_at: "2026-07-20T00:11:00.000Z",
    application_scope_fingerprint: applicationScopeFingerprint,
    target_application_version: "0.1.1+target.build.1",
    target_build_identity: `sha256:${"3".repeat(64)}`,
    target_package_contract: "augnes.distributable.v1",
    target_package_contract_version: 2,
    target_runtime_contract: "augnes-local-runtime-supervisor-v1",
    target_runtime_schema_version: 2,
    requesting_runtime_instance_id:
      "77777777-7777-4777-8777-777777777777",
    requesting_runtime_generation_id:
      "88888888-8888-4888-8888-888888888888",
    selected_backup_id: null,
    selected_backup_identity: null,
    selected_backup_directory_identity: null,
    selected_backup_state_directory_identity: null,
    selected_backup_manifest_file_identity: null,
    selected_backup_payload_file_identity: null,
  };
}

function installedPackageFixture() {
  return {
    application_version: "0.1.0+installed.build.1",
    build_identity: `sha256:${"1".repeat(64)}`,
    application_scope_fingerprint: applicationScopeFingerprint,
    package_contract: "augnes.distributable.v1",
    package_contract_version: 1,
    package_platform: "darwin-arm64-node141",
    runtime_contract: "augnes-local-runtime-supervisor-v1",
    runtime_schema_version: 2,
    database_schema_contract: "augnes.sqlite.structural-schema.v1",
    database_schema_signature: "2".repeat(64),
    database_migration_contract: "augnes.canonical-database-migrations.v1",
    database_migration_contract_version: 1,
    database_migration_ids: ["0001_r8_recovery_contract"],
    database_record_contract: "augnes.vnext-canonical-records.v1",
    database_record_contract_version: 1,
    database_reader_contracts: [
      "project_home.v0.1",
      "decision_centered_semantic_workbench.v0.1",
      "shared_project_inspector.v0.1",
    ],
    recorded_at: "2026-07-20T00:10:00.000Z",
  };
}

function operationEvent(index) {
  return {
    operation_kind: index % 2 === 0 ? "restore" : "update",
    outcome: index % 2 === 0 ? "restore_completed" : "updated",
    reason_code: `result_${index}`,
    finished_at: new Date(Date.UTC(2026, 6, 20, 1, 0, index)).toISOString(),
    application_version: "0.1.0",
    target_application_version: "0.1.1",
    target_build_identity: `sha256:${"1".repeat(64)}`,
    database_state: "current",
    protected_backup_id: "recovery:00000000-0000-4000-8000-000000000001",
    protected_backup_identity: `sha256:${"2".repeat(64)}`,
    backup_verified: true,
    safety_backup_created: index % 2 === 0,
    data_preserved: true,
    next_action: "continue_current_data",
  };
}

function validateAttackFixture(backupPath) {
  return validateRecoveryBackup({
    backupPath,
    expectedApplicationScopeFingerprint: applicationScopeFingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
  });
}

function copyAttackFixture(sourcePath, suffix) {
  const destination = attackFixturePath(suffix);
  cpSync(sourcePath, destination, { recursive: true, preserveTimestamps: true });
  chmodSync(destination, 0o700);
  chmodSync(path.join(destination, "state"), 0o700);
  chmodSync(path.join(destination, RECOVERY_MANIFEST_FILE), 0o600);
  chmodSync(path.join(destination, RECOVERY_DATABASE_PAYLOAD), 0o600);
  return destination;
}

function attackFixturePath(suffix) {
  return path.join(
    backupDirectory,
    `augnes-recovery-20260720T01${String(suffix).padStart(4, "0")}-${String(suffix).padStart(8, "0")}.backup`,
  );
}

function mutateManifest(
  backupPath,
  mutate,
  { recomputeIdentity = false } = {},
) {
  const manifestPath = path.join(backupPath, RECOVERY_MANIFEST_FILE);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  mutate(manifest);
  if (recomputeIdentity) {
    const { backup_identity: ignoredIdentity, ...withoutIdentity } = manifest;
    void ignoredIdentity;
    manifest.backup_identity = `sha256:${createHash("sha256")
      .update(JSON.stringify(withoutIdentity))
      .digest("hex")}`;
  }
  writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`, { mode: 0o600 });
  chmodSync(manifestPath, 0o600);
}

async function expectRecoveryError(action, code) {
  try {
    await action();
    assert.fail(`expected recovery error: ${code}`);
  } catch (error) {
    if (error?.code === "ERR_ASSERTION") throw error;
    assert.equal(error instanceof PublicRecoveryBackupError, true);
    assert.equal(error.code, code);
  }
}

function recoveryErrorMatches(error, code) {
  return error instanceof PublicRecoveryBackupError && error.code === code;
}

function assertRestrictedMode(filePath, expectedMode) {
  if (process.platform === "win32") return;
  assert.equal(
    lstatSync(filePath).mode & 0o777,
    expectedMode,
    `${filePath} must use mode ${expectedMode.toString(8)}`,
  );
}

function assertZeroOperationResidue() {
  const residue = [];
  for (const entry of walkFiles(temporaryRoot)) {
    const basename = path.basename(entry);
    if (
      basename.startsWith(".augnes-recovery-incomplete-") ||
      basename.includes(`${RECOVERY_OPERATION_FILE}.write-`) ||
      basename === RECOVERY_BACKUP_OPERATION_FILE ||
      basename.startsWith(`${RECOVERY_BACKUP_OPERATION_FILE}.write-`) ||
      basename.endsWith("-wal") ||
      basename.endsWith("-shm") ||
      basename.endsWith("-journal")
    ) {
      residue.push(path.relative(temporaryRoot, entry));
    }
  }
  assert.deepEqual(residue, [], `recovery residue remained: ${residue.join(", ")}`);
}

function walkFiles(root) {
  const entries = [];
  for (const name of readdirSync(root)) {
    const candidate = path.join(root, name);
    const stats = lstatSync(candidate);
    entries.push(candidate);
    if (stats.isDirectory() && !stats.isSymbolicLink()) {
      entries.push(...walkFiles(candidate));
    }
  }
  return entries;
}

function assertRecoveryModuleHasNoNetworkImports() {
  const source = readFileSync(
    path.join(repositoryRoot, "scripts", "recovery-backup.mjs"),
    "utf8",
  );
  assert.doesNotMatch(
    source,
    /(?:from|import\s*)\s*\(?["']node:(?:http|https|net|tls|dns)|\bfetch\s*\(/u,
  );
}

function assertDemoSeedUsesRecoveryPrivateMaterialContract() {
  const source = readFileSync(
    path.join(repositoryRoot, "scripts", "demo-seed.mjs"),
    "utf8",
  );
  assert.match(
    source,
    /import \{ RECOVERY_PRIVATE_MATERIAL_MARKER \} from "\.\.\/lib\/db\/recovery-private-material-contract\.mjs";/u,
  );
  assert.match(source, /content:\s*RECOVERY_PRIVATE_MATERIAL_MARKER/u);
  assert.doesNotMatch(
    source,
    /content:\s*["']Seeded state for Augnes temporal runtime API verification\./u,
  );
}
