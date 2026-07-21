#!/usr/bin/env node

import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import {
  chmodSync,
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { createServer as createHttpServer, request as httpRequest } from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import Database from "better-sqlite3";

import { buildRuntimeChildEnvironment } from "./runtime-child-environment.mjs";
import { isPathInsideOrEqual } from "./canonical-test-environment.mjs";
import { preflightDistributablePackage } from "./distributable-package-launcher.mjs";
import {
  DISTRIBUTABLE_DATABASE_MIGRATION_CONTRACT,
  DISTRIBUTABLE_DATABASE_MIGRATION_CONTRACT_VERSION,
  DISTRIBUTABLE_DATABASE_MIGRATION_IDS,
  DISTRIBUTABLE_DATABASE_READER_CONTRACTS,
  DISTRIBUTABLE_DATABASE_RECORD_CONTRACT,
  DISTRIBUTABLE_DATABASE_RECORD_CONTRACT_VERSION,
  DISTRIBUTABLE_DATABASE_SCHEMA_CONTRACT,
  DISTRIBUTABLE_DATABASE_SCHEMA_COMPATIBILITY,
  DISTRIBUTABLE_DATABASE_SUPPORTED_SOURCE_SCHEMA_SIGNATURES,
  detectDistributablePlatform,
  formatDistributablePlatformLabel,
} from "./distributable-package-contract.mjs";
import {
  ensureApplicationDirectory,
  resolveAugnesLocalPaths,
  resolvePhysicalLocalDestination,
} from "./augnes-local-paths.mjs";
import {
  canonicalStructuralSchemaContractSignature,
  inspectDatabaseReconciliation,
  inspectLegacyRecoveryAdoptionSourceDatabaseFile,
  inspectRecoveryDatabaseFile,
  inspectSafetyRecoveryDatabaseFile,
  inspectRecoverySourceDatabaseFile,
  inspectRuntimePackageIdentityGuard,
  inspectRuntimeDatabase,
  prepareRuntimeDatabase,
  reconcileInterruptedDatabaseBootstrap,
  restoreRuntimeDatabase,
} from "./runtime-database-bootstrap.mjs";
import {
  clearPendingRecoveryAction,
  clearPendingPackageIdentity,
  completePendingPackageUpdate,
  completePendingRecoveryAction,
  createRecoveryBackup,
  adoptLegacyRecoveryBackups,
  listRecoveryBackups,
  readRecoveryOperationResults,
  reconcileRecoveryBackupOperation,
  writePendingRecoveryAction,
  writeInstalledPackageIdentity,
  writePendingPackageIdentity,
  writeRecoveryOperationResult,
} from "./recovery-backup.mjs";
import {
  RUNTIME_CONTRACT,
  RUNTIME_GENERATION_VERSION,
  RUNTIME_SCHEMA_VERSION,
  PublicRuntimeReconciliationError,
  acquireRuntimeReconciliationLease,
  classifyRuntimeState,
  cleanupRuntimeOwnershipBundle,
  createRuntimeGeneration,
  publicRuntimeClassification,
  reclaimStaleRuntimeReconciliationLease,
  releaseRuntimeReconciliationLease,
  stopVerifiedOrphanChildren,
  withRuntimeReconciliationPath,
} from "./runtime-reconciliation.mjs";

export {
  RUNTIME_CONTRACT,
  RUNTIME_GENERATION_VERSION,
  RUNTIME_SCHEMA_VERSION,
};
export const LOOPBACK_HOST = "127.0.0.1";
export const DEFAULT_UI_PORT = 3000;
export const DEFAULT_BRIDGE_PORT = 8787;
export const PORT_SEARCH_SIZE = 20;
export const DISTRIBUTABLE_PACKAGE_CONTRACT = "augnes.distributable.v1";
export const DISTRIBUTABLE_PACKAGE_CONTRACT_VERSION = 2;

export function verifyRuntimeNativeDependency() {
  const database = new Database(":memory:");
  try {
    if (database.prepare("SELECT 1 AS ready").get()?.ready !== 1) {
      throw new Error("package_native_dependency_invalid");
    }
  } finally {
    database.close();
  }
}

export function verifyRuntimeBundledSchemaContract(expectedSignature) {
  const actual = canonicalStructuralSchemaContractSignature();
  if (
    !/^[a-f0-9]{64}$/u.test(expectedSignature ?? "") ||
    actual !== expectedSignature
  ) {
    throw new Error("package_schema_bundle_invalid");
  }
  return actual;
}

const STARTUP_TIMEOUT_MS = 90_000;
const OWNERSHIP_REQUEST_TIMEOUT_MS = 1_500;
const GRACEFUL_CHILD_STOP_MS = 8_000;
const FORCED_CHILD_STOP_MS = 4_000;
const EXITED_CHILD_DRAIN_MS = 1_000;
const STOP_COMMAND_TIMEOUT_MS = 20_000;
const OWNERSHIP_RACE_WAIT_MS = 3_000;
const SERVER_CLOSE_TIMEOUT_MS = 5_000;
const MAX_CONTROL_RESPONSE_BYTES = 64 * 1024;
const OUTPUT_TAIL_BYTES = 32 * 1024;
const ownedServerSockets = new WeakMap();
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = realpathSync(path.resolve(scriptDirectory, ".."));
const nextBin = path.join(repositoryRoot, "node_modules", "next", "dist", "bin", "next");
const bridgeRoot = path.join(repositoryRoot, "apps", "augnes_apps");
const bridgeServer = path.join(bridgeRoot, "src", "server.ts");
const runtimeChildLauncher = path.join(
  repositoryRoot,
  "scripts",
  "runtime-child-launcher.mjs",
);

class PublicRuntimeError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = "PublicRuntimeError";
    this.code = code;
  }
}

class ShutdownDuringStartupError extends Error {
  constructor() {
    super("runtime shutdown requested during startup");
    this.name = "ShutdownDuringStartupError";
  }
}

export async function runRuntimeSupervisorCli(
  argv = process.argv.slice(2),
  environment = process.env,
  dependencies = {},
) {
  let options;
  try {
    options = parseCli(argv, environment);
  } catch (error) {
    emitResult({
      command: "invalid",
      result: "failed",
      state: "unavailable",
      reason: publicErrorCode(error, "invalid_arguments"),
    });
    return 2;
  }

  let runtimeDistribution;
  try {
    runtimeDistribution = resolveRuntimeDistribution();
  } catch (error) {
    emitResult({
      command: options.command,
      result: "failed",
      state: "unavailable",
      reason: publicErrorCode(error, "package_contract_invalid"),
    });
    return 2;
  }

  const repositoryFingerprint = runtimeDistribution.applicationScopeFingerprint;
  let paths;
  try {
    paths = resolveRuntimePaths({
      environment,
      repositoryFingerprint,
    });
  } catch (error) {
    emitResult({
      command: options.command,
      result: "failed",
      state: "unavailable",
      reason: publicErrorCode(error, "runtime_state_path_invalid"),
    });
    return 2;
  }

  if (options.command === "diagnostics") {
    return runDiagnosticsCommand({
      paths,
      repositoryFingerprint,
      runtimeDistribution,
    });
  }
  if (options.command === "status") {
    return runStatusCommand({ paths, repositoryFingerprint });
  }
  if (options.command === "stop") {
    return runStopCommand({ paths, repositoryFingerprint });
  }
  return runStartCommand({
    environment,
    options,
    paths,
    repositoryFingerprint,
    runtimeDistribution,
    dependencies,
  });
}

export function resolveRuntimeDistribution({
  repositoryRootPath = repositoryRoot,
} = {}) {
  const manifestPath = path.join(repositoryRootPath, "augnes-package.json");
  if (!existsSync(manifestPath)) {
    return sourceRuntimeDistribution(repositoryRootPath);
  }

  const manifest = readPackageManifest(manifestPath);
  validatePackageManifest(manifest);
  if (
    manifest.database.schema_signature !==
    canonicalStructuralSchemaContractSignature()
  ) {
    throw new PublicRuntimeError("package_database_contract_unsupported");
  }
  const uiServer = path.join(repositoryRootPath, "server.js");
  const bridgeServerPath = path.join(
    repositoryRootPath,
    "bridge",
    "dist",
    "server.mjs",
  );
  assertPackagedRuntimeEntry(repositoryRootPath, uiServer);
  assertPackagedRuntimeEntry(repositoryRootPath, bridgeServerPath);

  return Object.freeze({
    mode: "packaged",
    applicationVersion: manifest.application_version,
    packageContract: manifest.contract,
    packageContractVersion: manifest.package_contract_version,
    buildIdentity: manifest.build_identity,
    applicationScopeFingerprint: manifest.application_scope_fingerprint,
    packagePlatform: formatDistributablePlatformLabel(
      manifest.platform,
      manifest.runtime.node_modules_abi,
    ),
    runtimeContract: manifest.runtime.runtime_contract,
    runtimeSchemaVersion: manifest.runtime.runtime_schema_version,
    databaseSchemaCompatibility: manifest.database.schema_compatibility,
    databaseSchemaContract: manifest.database.schema_contract,
    databaseSchemaSignature: manifest.database.schema_signature,
    databaseMigrationContract: manifest.database.migration_contract,
    databaseMigrationContractVersion:
      manifest.database.migration_contract_version,
    databaseMigrationIds: [...manifest.database.migration_ids],
    databaseRecordContract: manifest.database.record_contract,
    databaseRecordContractVersion: manifest.database.record_contract_version,
    databaseReaderContracts: [...manifest.database.reader_contracts],
    uiServer,
    uiWorkingDirectory: repositoryRootPath,
    bridgeServer: bridgeServerPath,
    bridgeWorkingDirectory: path.join(repositoryRootPath, "bridge"),
  });
}

export function resolveRuntimePaths({
  environment = process.env,
  repositoryFingerprint = fingerprint(repositoryRoot),
  repositoryRootPath = repositoryRoot,
} = {}) {
  const localPaths = resolveAugnesLocalPaths({
    environment,
    repositoryRoot: repositoryRootPath,
    repositoryFingerprint,
  });
  const directory = localPaths.runtime_directory;

  return withRuntimeReconciliationPath({
    directory,
    manifest: path.join(directory, "runtime.json"),
    lock: path.join(directory, "owner.lock"),
    token: path.join(directory, "control-token.json"),
    bridgeEnvironment: path.join(directory, "bridge-supervisor.env"),
    local: localPaths,
  });
}

export function resolvePhysicalRuntimeStateDestination({
  candidate,
  repositoryRoot: repositoryRootPath = repositoryRoot,
}) {
  if (!path.isAbsolute(candidate)) {
    throw new PublicRuntimeError("runtime_state_path_must_be_absolute");
  }
  return resolvePhysicalLocalDestination({
    candidate,
    repositoryRoot: repositoryRootPath,
    insideRepositoryCode: "runtime_state_path_must_be_outside_repository",
    invalidCode: "runtime_state_path_invalid",
  });
}

export async function readVerifiedRuntimeStatus({
  paths,
  repositoryFingerprint = fingerprint(repositoryRoot),
  ownedLease = null,
}) {
  const classified = await classifyRuntimeState({
    paths,
    repositoryFingerprint,
    ownedLease,
  });
  if (classified.state === "verified_live") {
    return {
      verified: true,
      manifest_present: true,
      manifest: classified.manifest,
      identity: classified.identity,
      classification: classified,
    };
  }
  return {
    verified: false,
    reason:
      classified.state === "clean"
        ? "not_running"
        : classified.reason ?? "runtime_ownership_unverifiable",
    manifest_present: classified.state !== "clean",
    classification: classified,
  };
}

async function runDiagnosticsCommand({
  paths,
  repositoryFingerprint,
  runtimeDistribution,
}) {
  const runtime = await classifyRuntimeState({ paths, repositoryFingerprint });
  const databaseReconciliation = await inspectDatabaseReconciliation({
    databasePath: paths.local.database_path,
    backupDirectory: paths.local.backup_directory,
    repositoryFingerprint,
  });
  let database;
  try {
    database = await inspectRuntimeDatabase({
      databasePath: paths.local.database_path,
    });
  } catch (error) {
    database = {
      database_state: "unavailable",
      schema_classification: "unavailable",
      schema_version: null,
      reason: publicErrorCode(error, "database_open_failed"),
    };
  }
  emitResult({
    command: "diagnostics",
    result: "observed",
    state: "diagnostics",
    ...publicRuntimeDiagnostics(runtimeDistribution, {
      databaseSchemaCompatibility:
        database.schema_version ??
        runtimeDistribution.databaseSchemaCompatibility,
    }),
    path_layout_version: paths.local.layout_version,
    checkout_scope: paths.local.checkout_scope,
    paths: {
      data_directory: paths.local.data_directory,
      config_directory: paths.local.config_directory,
      backup_directory: paths.local.backup_directory,
      runtime_directory: paths.local.runtime_directory,
      database_path: paths.local.database_path,
    },
    database: {
      exists: existsSync(paths.local.database_path),
      state: database.database_state,
      schema_classification: database.schema_classification,
      schema_version: database.schema_version,
      override_active: paths.local.database_override_active,
      reason: database.reason ?? null,
    },
    runtime_reconciliation: publicRuntimeClassification(runtime),
    database_reconciliation: databaseReconciliation,
  });
  return database.database_state === "unavailable" ? 1 : 0;
}

async function runStatusCommand({ paths, repositoryFingerprint }) {
  const status = await readVerifiedRuntimeStatus({ paths, repositoryFingerprint });
  if (status.verified) {
    emitResult(publicStatusResult("status", "observed", status.identity));
    return 0;
  }
  const databaseReconciliation = await inspectDatabaseReconciliation({
    databasePath: paths.local.database_path,
    backupDirectory: paths.local.backup_directory,
    repositoryFingerprint,
  });
  if (
    status.classification?.state === "clean" &&
    databaseReconciliation.state === "clean"
  ) {
    emitResult({
      command: "status",
      result: "observed",
      state: "stopped",
      verified: false,
      effective_url: null,
      ui_port: null,
      bridge_port: null,
      children: [],
      database_state: null,
      database_schema_version: null,
      recovery_backup_created: false,
    });
    return 0;
  }

  const runtimeState = status.classification?.state;
  const observedState =
    runtimeState === "owned_orphan_children"
      ? "orphaned"
      : status.classification?.recoverable ||
          databaseReconciliation.state === "recoverable"
        ? "stale"
        : "reconciliation_required";
  emitResult({
    command: "status",
    result:
      status.classification?.recoverable ||
      databaseReconciliation.state === "recoverable"
        ? "observed"
        : "refused",
    state: observedState,
    verified: false,
    reason:
      status.classification?.state === "clean"
        ? databaseReconciliation.reason
        : status.reason,
    effective_url: null,
    ui_port: null,
    bridge_port: null,
    children: [],
    database_state: null,
    database_schema_version: null,
    recovery_backup_created: false,
    reconciliation: publicRuntimeClassification(status.classification),
    database_reconciliation: databaseReconciliation,
  });
  return status.classification?.recoverable ||
    databaseReconciliation.state === "recoverable"
    ? 0
    : 2;
}

async function runStopCommand({ paths, repositoryFingerprint }) {
  const status = await readVerifiedRuntimeStatus({ paths, repositoryFingerprint });
  if (!status.verified) {
    const databaseReconciliation = await inspectDatabaseReconciliation({
      databasePath: paths.local.database_path,
      backupDirectory: paths.local.backup_directory,
      repositoryFingerprint,
    });
    if (
      status.classification?.state === "clean" &&
      databaseReconciliation.state === "clean"
    ) {
      emitResult({
        command: "stop",
        result: "already_stopped",
        state: "stopped",
        verified: false,
        effective_url: null,
      });
      return 0;
    }
    try {
      ensureRuntimeDirectory({ directory: paths.directory });
      const reconciled = await reconcileRuntimeOwnership({
        paths,
        repositoryFingerprint,
        databaseReconciliation,
      });
      if (reconciled.existing?.verified) {
        return runStopCommand({ paths, repositoryFingerprint });
      }
      emitResult({
        command: "stop",
        result: "reconciled",
        state: "stopped",
        verified: true,
        effective_url: null,
        reconciliation_performed: reconciled.performed,
        orphan_children_stopped: reconciled.orphanChildrenStopped,
        database_state_reconciled: reconciled.databaseStateReconciled,
        recovery_backup_preserved: reconciled.recoveryBackupPreserved,
      });
      return 0;
    } catch (error) {
      emitResult({
        command: "stop",
        result: "refused",
        state: "reconciliation_required",
        verified: false,
        reason: publicErrorCode(error, "runtime_reconciliation_failed"),
        effective_url: null,
      });
      return 2;
    }
  }

  const tokenRecord = readOwnedToken(
    paths.token,
    status.identity.instance_id,
    status.identity.generation_id,
  );
  if (!tokenRecord) {
    emitResult({
      command: "stop",
      result: "refused",
      state: status.identity.lifecycle_state,
      verified: true,
      reason: "control_token_unavailable",
      effective_url: status.identity.effective_url,
    });
    return 2;
  }

  let stopResponse;
  try {
    stopResponse = await requestControlJson({
      port: status.manifest.control_port,
      path: "/v1/stop",
      method: "POST",
      headers: {
        "x-augnes-runtime-token": tokenRecord.token,
        "x-augnes-runtime-instance": status.identity.instance_id,
      },
    });
  } catch {
    emitResult({
      command: "stop",
      result: "refused",
      state: "unavailable",
      verified: false,
      reason: "ownership_changed_before_stop",
      effective_url: null,
    });
    return 2;
  }

  if (stopResponse.statusCode !== 202 || stopResponse.body?.accepted !== true) {
    emitResult({
      command: "stop",
      result: "refused",
      state: status.identity.lifecycle_state,
      verified: true,
      reason: "stop_request_rejected",
      effective_url: status.identity.effective_url,
    });
    return 2;
  }

  const deadline = Date.now() + STOP_COMMAND_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (!existsSync(paths.manifest) && !isProcessAlive(status.identity.supervisor_pid)) {
      emitResult({
        command: "stop",
        result: "stopped",
        state: "stopped",
        verified: true,
        effective_url: null,
      });
      return 0;
    }
    await delay(100);
  }

  emitResult({
    command: "stop",
    result: "failed",
    state: "stopping",
    verified: true,
    reason: "shutdown_timeout",
    effective_url: status.identity.effective_url,
  });
  return 1;
}

async function runStartCommand({
  environment,
  options,
  paths,
  repositoryFingerprint,
  runtimeDistribution,
  dependencies = {},
}) {
  let canonicalNodeOptions;
  try {
    canonicalNodeOptions = canonicalTestNodeOptions(environment);
  } catch (error) {
    emitResult({
      command: "start",
      result: "failed",
      state: "unavailable",
      verified: false,
      reason: publicErrorCode(error, "canonical_test_node_import_invalid"),
      effective_url: null,
    });
    return 2;
  }
  try {
    ensureRuntimeDirectory({ directory: paths.directory });
  } catch (error) {
    emitResult({
      command: "start",
      result: "failed",
      state: "unavailable",
      verified: false,
      reason: publicErrorCode(error, "runtime_state_directory_invalid"),
      effective_url: null,
    });
    return 2;
  }

  const existing = await readVerifiedRuntimeStatus({ paths, repositoryFingerprint });
  let requestedRecoveryAction = options.recoveryAction ?? null;
  let requestedRecoveryBackupId = options.recoveryBackupId ?? null;
  let requestedRecoveryBackupIdentity =
    options.recoveryBackupIdentity ?? null;
  let requestedRecoveryBackupDirectoryIdentity =
    options.recoveryBackupDirectoryIdentity ?? null;
  let recoveredPendingAction = null;
  let recoveredCompletedAction = null;
  let recoveryActionRequested = requestedRecoveryAction !== null;
  const recoveryJournalOwner = options.recoveryJournalOwner ?? null;
  let updateHandoff = null;
  let startupCompatibilityRefusal = null;
  let recoveryOperationStateAvailable = true;
  let recoveredPublishedOperation = null;
  if (!existing.verified && runtimeDistribution.mode === "packaged") {
    let packageState;
    try {
      packageState = readRecoveryOperationResults(
        paths.local.backup_directory,
      );
      recoveredCompletedAction = packageState.completed_action;
      const latestOperation = findPublishedRestartPending(
        packageState.events,
        runtimeDistribution,
      );
      if (latestOperation !== null) {
        if (
          publishedRestartMatchesDistribution(
            latestOperation,
            runtimeDistribution,
          )
        ) {
          recoveredPublishedOperation = latestOperation;
        } else {
          startupCompatibilityRefusal = "recovery_action_target_changed";
        }
      }
      if (packageState.pending_action !== null) {
        if (
          pendingRecoveryActionMatchesDistribution(
            packageState.pending_action,
            runtimeDistribution,
          ) &&
          (requestedRecoveryAction === null ||
            pendingRecoveryActionMatchesRequest(
              packageState.pending_action,
              {
                action: requestedRecoveryAction,
                backupId: requestedRecoveryBackupId,
                backupIdentity: requestedRecoveryBackupIdentity,
                backupDirectoryIdentity:
                  requestedRecoveryBackupDirectoryIdentity,
              },
            ))
        ) {
          recoveredPendingAction = packageState.pending_action;
          requestedRecoveryAction = packageState.pending_action.action;
          requestedRecoveryBackupId =
            packageState.pending_action.selected_backup_id;
          requestedRecoveryBackupIdentity =
            packageState.pending_action.selected_backup_identity;
          requestedRecoveryBackupDirectoryIdentity =
            packageState.pending_action.selected_backup_directory_identity;
          recoveryActionRequested = true;
        } else {
          startupCompatibilityRefusal = "recovery_action_target_changed";
        }
      }
    } catch (error) {
      recoveryOperationStateAvailable = false;
      startupCompatibilityRefusal = publicErrorCode(
        error,
        "recovery_result_unavailable",
      );
      packageState = null;
    }
    const installedUpdate = packageState?.installed_package == null
      ? null
      : classifyRuntimeUpdate(
          packageState.installed_package,
          runtimeDistribution,
        );
    const pendingUpdate = packageState?.pending_package == null
      ? null
      : classifyRuntimeUpdate(
          packageState.pending_package,
          runtimeDistribution,
        );
    const persistedSourceUpdate =
      packageState?.pending_update_source === null ||
      packageState?.pending_update_source === undefined
        ? null
        : classifyRuntimeUpdate(
            packageState.pending_update_source,
            runtimeDistribution,
          );
    if (
      pendingUpdate?.outcome === "no_update_required" &&
      persistedSourceUpdate?.outcome === "update_ready"
    ) {
      updateHandoff = persistedSourceUpdate;
    }
    const resumingInstalledBeforePendingMutation =
      installedUpdate?.outcome === "no_update_required";
    for (const stoppedUpdate of [
      resumingInstalledBeforePendingMutation ? null : pendingUpdate,
      installedUpdate,
    ]) {
      if (stoppedUpdate === null) continue;
      if (
        stoppedUpdate.outcome !== "no_update_required" &&
        stoppedUpdate.outcome !== "update_ready"
      ) {
        startupCompatibilityRefusal ??= stoppedUpdate.outcome;
        break;
      }
      if (stoppedUpdate.outcome === "update_ready") {
        updateHandoff = stoppedUpdate;
      }
    }
  }
  if (existing.verified) {
    const updateDecision = classifyRuntimeUpdate(
      existing.identity,
      runtimeDistribution,
    );
    if (
      updateDecision.outcome === "no_update_required" &&
      !recoveryActionRequested
    ) {
      emitResult(
        publicStatusResult(
          "start",
          existing.identity.lifecycle_state === "failed" &&
            existing.identity.effective_url?.endsWith("/recovery")
            ? "recovery_available"
            : "existing",
          existing.identity,
        ),
      );
      return existing.identity.lifecycle_state === "failed" ? 2 : 0;
    }
    if (
      updateDecision.outcome !== "update_ready" &&
      updateDecision.outcome !== "no_update_required"
    ) {
      emitResult({
        command: "start",
        result: "refused",
        state: existing.identity.lifecycle_state,
        verified: true,
        reason: updateDecision.outcome,
        effective_url: existing.identity.effective_url,
      });
      return 2;
    }
    try {
      await handoffVerifiedRuntimeForUpdate({
        paths,
        repositoryFingerprint,
        existing,
        runtimeDistribution,
        updateDecision,
      });
      updateHandoff =
        updateDecision.outcome === "update_ready" ? updateDecision : null;
    } catch (error) {
      emitResult({
        command: "start",
        result: "refused",
        state: "unavailable",
        verified: false,
        reason: publicErrorCode(error, "update_ownership_conflict"),
        effective_url: null,
      });
      return 2;
    }
  }

  let reconciliationResult = {
    performed: false,
    orphanChildrenStopped: 0,
    databaseStateReconciled: false,
    recoveryBackupPreserved: false,
  };
  let reconciledRecoveryActionCompleted = false;
  let reconciledPublishedOperation = null;
  const databaseReconciliation = await inspectDatabaseReconciliation({
    databasePath: paths.local.database_path,
    backupDirectory: paths.local.backup_directory,
    repositoryFingerprint,
    recoveryOwner: recoveryJournalOwner,
  });
  if (
    existing.classification?.state !== "clean" ||
    databaseReconciliation.state !== "clean"
  ) {
    try {
      reconciliationResult = await reconcileRuntimeOwnership({
        paths,
        repositoryFingerprint,
        databaseReconciliation,
        recoveryJournalOwner,
        completeRecoveryAction: (operation) => {
          const pendingActionMatches =
            recoveredPendingAction !== null &&
            operation.recoveryActionId === recoveredPendingAction.action_id &&
            (operation.selectedBackupId === null ||
              (operation.selectedBackupId ===
                recoveredPendingAction.selected_backup_id &&
                operation.selectedBackupIdentity ===
                  recoveredPendingAction.selected_backup_identity &&
                JSON.stringify(operation.selectedBackupDirectoryIdentity) ===
                  JSON.stringify(
                    recoveredPendingAction.selected_backup_directory_identity,
                  )));
          const completedActionMatches =
            recoveredCompletedAction !== null &&
            operation.recoveryActionId === recoveredCompletedAction.action_id;
          if (!pendingActionMatches && !completedActionMatches) {
            return false;
          }
          const committed =
            operation.result === "database_verified_publish_committed";
          if (
            completedActionMatches &&
            (recoveredCompletedAction.event.operation_kind !== "restore" ||
              recoveredCompletedAction.event.outcome !==
                (committed
                  ? "restore_published_restart_pending"
                  : "restore_failed_preserved_current_state") ||
              recoveredCompletedAction.event.target_application_version !==
                runtimeDistribution.applicationVersion ||
              recoveredCompletedAction.event.target_build_identity !==
                runtimeDistribution.buildIdentity ||
              recoveredCompletedAction.event.protected_backup_id !==
                operation.protectedBackupId ||
              recoveredCompletedAction.event.protected_backup_identity !==
                operation.protectedBackupIdentity)
          ) {
            return false;
          }
          const completedEvent = completePendingRecoveryAction({
            backupDirectory: paths.local.backup_directory,
            expectedActionId: operation.recoveryActionId,
            event: {
              operation_kind: "restore",
              outcome: committed
                ? "restore_published_restart_pending"
                : "restore_failed_preserved_current_state",
              reason_code: committed
                ? "interrupted_restore_restart_pending"
                : "interrupted_restore_reconciled",
              finished_at: new Date().toISOString(),
              application_version:
                updateHandoff?.source_application_version ?? null,
              target_application_version:
                runtimeDistribution.applicationVersion,
              target_build_identity: runtimeDistribution.buildIdentity,
              database_state: committed ? "restored" : "recovery_required",
              protected_backup_id: operation.protectedBackupId,
              protected_backup_identity: operation.protectedBackupIdentity,
              backup_verified:
                operation.protectedBackupId !== null &&
                operation.protectedBackupIdentity !== null,
              safety_backup_created: operation.protectedBackupId !== null,
              data_preserved: true,
              next_action: committed
                ? "retry_packaged_restart"
                : "retry_restore_or_choose_another_verified_backup",
            },
          });
          if (committed) {
            reconciledPublishedOperation = completedEvent;
          }
          reconciledRecoveryActionCompleted = true;
          return true;
        },
      });
    } catch (error) {
      emitResult({
        command: "start",
        result: "refused",
        state: "reconciliation_required",
        verified: false,
        reason: publicErrorCode(error, "runtime_reconciliation_failed"),
        effective_url: null,
      });
      return 2;
    }
    if (reconciliationResult.existing?.verified) {
      const reconciledUpdate = classifyRuntimeUpdate(
        reconciliationResult.existing.identity,
        runtimeDistribution,
      );
      if (
        recoveryActionRequested &&
        (reconciledUpdate.outcome === "no_update_required" ||
          reconciledUpdate.outcome === "update_ready")
      ) {
        try {
          await handoffVerifiedRuntimeForUpdate({
            paths,
            repositoryFingerprint,
            existing: reconciliationResult.existing,
            runtimeDistribution,
            updateDecision: reconciledUpdate,
            allowedPendingActionId:
              recoveredPendingAction?.action_id ?? null,
          });
          updateHandoff =
            reconciledUpdate.outcome === "update_ready"
              ? reconciledUpdate
              : null;
        } catch (error) {
          emitResult({
            command: "start",
            result: "refused",
            state: "unavailable",
            verified: false,
            reason: publicErrorCode(error, "update_ownership_conflict"),
            effective_url: null,
          });
          return 2;
        }
      } else if (reconciledUpdate.outcome !== "no_update_required") {
        emitResult({
          command: "start",
          result: "refused",
          state: reconciliationResult.existing.identity.lifecycle_state,
          verified: true,
          reason:
            reconciledUpdate.outcome === "update_ready"
              ? "update_ownership_conflict"
              : reconciledUpdate.outcome,
          effective_url:
            reconciliationResult.existing.identity.effective_url,
        });
        return 2;
      } else {
        emitResult(
          publicStatusResult(
            "start",
            "existing",
            reconciliationResult.existing.identity,
          ),
        );
        return reconciliationResult.existing.identity.lifecycle_state === "failed"
          ? 2
          : 0;
      }
    }
  }

  try {
    ensureRuntimeDirectory({ directory: paths.directory });
  } catch (error) {
    emitResult({
      command: "start",
      result: "failed",
      state: "unavailable",
      verified: false,
      reason: publicErrorCode(error, "runtime_state_directory_invalid"),
      effective_url: null,
    });
    return 2;
  }

  const instanceId = randomUUID();
  const generation = createRuntimeGeneration();
  const startedAt = new Date().toISOString();
  const reconciledDatabaseOperation =
    reconciliationResult.reconciliationOperation ?? null;
  const reconciledRequestedRestore =
    requestedRecoveryAction === "restore_backup" &&
    reconciledDatabaseOperation?.operationKind === "restore" &&
    recoveredPendingAction !== null &&
    reconciledDatabaseOperation.recoveryActionId ===
      recoveredPendingAction.action_id &&
    reconciledDatabaseOperation.selectedBackupId ===
      requestedRecoveryBackupId &&
    reconciledDatabaseOperation.selectedBackupIdentity ===
      requestedRecoveryBackupIdentity &&
    JSON.stringify(
      reconciledDatabaseOperation.selectedBackupDirectoryIdentity,
    ) === JSON.stringify(requestedRecoveryBackupDirectoryIdentity);
  const effectiveRecoveryAction =
    reconciledRecoveryActionCompleted || reconciledRequestedRestore
      ? null
      : requestedRecoveryAction;
  const lockRecord = {
    schema_version: RUNTIME_SCHEMA_VERSION,
    contract: RUNTIME_CONTRACT,
    generation_version: RUNTIME_GENERATION_VERSION,
    generation_id: generation.generationId,
    instance_id: instanceId,
    repository_fingerprint: repositoryFingerprint,
    supervisor_pid: process.pid,
    started_at: startedAt,
  };
  try {
    createExclusiveJson(paths.lock, lockRecord);
  } catch (error) {
    if (error?.code === "EEXIST") {
      const racedOwner = await waitForVerifiedOwner({ paths, repositoryFingerprint });
      if (racedOwner?.verified) {
        const racedUpdate = classifyRuntimeUpdate(
          racedOwner.identity,
          runtimeDistribution,
        );
        if (
          recoveryActionRequested ||
          racedUpdate.outcome !== "no_update_required"
        ) {
          emitResult({
            command: "start",
            result: "refused",
            state: racedOwner.identity.lifecycle_state,
            verified: true,
            reason:
              racedUpdate.outcome === "update_ready"
                ? "update_ownership_conflict"
                : racedUpdate.outcome,
            effective_url: racedOwner.identity.effective_url,
          });
          return 2;
        }
        emitResult(publicStatusResult("start", "existing", racedOwner.identity));
        return racedOwner.identity.lifecycle_state === "failed" ? 2 : 0;
      }
      emitResult({
        command: "start",
        result: "refused",
        state: "unavailable",
        verified: false,
        reason: "runtime_ownership_unverifiable",
        effective_url: null,
      });
      return 2;
    }
    emitResult({
      command: "start",
      result: "failed",
      state: "unavailable",
      verified: false,
      reason: "runtime_lock_create_failed",
      effective_url: null,
    });
    return 1;
  }

  const runtime = {
    paths,
    environment,
    uiNextArguments: options.uiNextArguments,
    uiPreferredPort: options.uiPreferredPort,
    runtimeDistribution,
    canonicalNodeOptions,
    repositoryFingerprint,
    generationId: generation.generationId,
    childOwnershipToken: generation.childOwnershipToken,
    instanceId,
    supervisorPid: process.pid,
    controlPort: null,
    controlServer: null,
    controlToken: randomBytes(32).toString("hex"),
    lifecycleState: "starting",
    startedAt,
    lastTransitionAt: startedAt,
    effectiveUrl: null,
    uiPort: null,
    bridgePort: null,
    databasePath: paths.local.database_path,
    databaseState: "preparing",
    databaseSchemaVersion: null,
    recoveryBackupCreated: false,
    protectedRecoveryBackupId:
      reconciledDatabaseOperation?.protectedBackupId ??
      recoveredPublishedOperation?.protected_backup_id ??
      null,
    protectedRecoveryBackupIdentity:
      reconciledDatabaseOperation?.protectedBackupIdentity ??
      recoveredPublishedOperation?.protected_backup_identity ??
      null,
    safetyBackupCreated:
      (reconciledDatabaseOperation?.operationKind === "restore" &&
        reconciledDatabaseOperation?.protectedBackupId !== null) ||
      recoveredPublishedOperation?.safety_backup_created === true,
    failure: null,
    children: new Map(),
    startupFailure: null,
    shutdownRequested: false,
    shutdownReason: null,
    exitCode: 0,
    manifestCreated: false,
    signalHandlers: [],
    resolveShutdown: null,
    shutdownPromise: null,
    reconciliationPerformed: reconciliationResult.performed,
    orphanChildrenStopped: reconciliationResult.orphanChildrenStopped,
    databaseStateReconciled: reconciliationResult.databaseStateReconciled,
    databaseReconciliationResult: reconciliationResult.result ?? null,
    databaseReconciliationOperation:
      reconciliationResult.reconciliationOperation ?? null,
    reusableRecoveryBackup:
      reconciliationResult.reusableRecoveryBackup ?? null,
    databaseSourceApplicationVersion: null,
    recoveryBackupPreserved:
      reconciliationResult.recoveryBackupPreserved ||
      recoveredPublishedOperation?.backup_verified === true,
    updateHandoff,
    recoveryAction: effectiveRecoveryAction,
    recoveryBackupId: requestedRecoveryBackupId,
    recoveryBackupIdentity: requestedRecoveryBackupIdentity,
    recoveryBackupDirectoryIdentity:
      requestedRecoveryBackupDirectoryIdentity,
    pendingRecoveryActionId: reconciledRecoveryActionCompleted
      ? null
      : recoveredPendingAction?.action_id ?? null,
    pendingRecoveryAction: reconciledRecoveryActionCompleted
      ? null
      : recoveredPendingAction,
    reconciledRecoveryActionCompleted,
    publishedOperationPending:
      reconciledPublishedOperation ?? recoveredPublishedOperation,
    publishedOperationFinalized: false,
    packageIdentityAdoption: false,
    recoveryMode: false,
    recoveryRequest: null,
    recoveryOperationStateAvailable,
    recoveryRetryAvailable: false,
    recoveryRestoreAvailable: recoveryOperationStateAvailable,
    legacyBackupAdoption: {
      adopted: [],
      already_adopted: [],
      rejected: [],
    },
  };
  runtime.shutdownPromise = new Promise((resolve) => {
    runtime.resolveShutdown = resolve;
  });

  let cleanupError = null;
  let databaseResult = null;
  try {
    installSignalHandlers(runtime);
    runtime.controlServer = await startControlServer(runtime);
    runtime.controlPort = runtime.controlServer.address().port;
    atomicWriteJson(paths.token, {
      schema_version: RUNTIME_SCHEMA_VERSION,
      contract: RUNTIME_CONTRACT,
      generation_version: RUNTIME_GENERATION_VERSION,
      generation_id: runtime.generationId,
      instance_id: instanceId,
      repository_fingerprint: runtime.repositoryFingerprint,
      token: runtime.controlToken,
      child_ownership_token: runtime.childOwnershipToken,
    });
    atomicWriteText(paths.bridgeEnvironment, "");
    writeRuntimeManifest(runtime);
    runtime.manifestCreated = true;
    emitResult({
      command: "start",
      result: "starting",
      state: "starting",
      verified: true,
      instance_id: runtime.instanceId,
      supervisor_pid: runtime.supervisorPid,
      effective_url: null,
      ui_port: null,
      bridge_port: null,
      children: [],
      database_state: runtime.databaseState,
      database_schema_version: runtime.databaseSchemaVersion,
      recovery_backup_created: runtime.recoveryBackupCreated,
      reconciliation_performed: runtime.reconciliationPerformed,
      orphan_children_stopped: runtime.orphanChildrenStopped,
      database_state_reconciled: runtime.databaseStateReconciled,
      recovery_backup_preserved: runtime.recoveryBackupPreserved,
    });

    try {
      const databaseOperation = runtime.recoveryAction === "restore_backup"
        ? dependencies.restoreRuntimeDatabase ?? restoreRuntimeDatabase
        : dependencies.prepareRuntimeDatabase ?? prepareRuntimeDatabase;
      const targetCompatibility = databaseTargetCompatibility(
        runtime.runtimeDistribution,
        runtime.updateHandoff ??
          (runtime.recoveryAction === "restore_backup"
            ? restoreSourcePackageIdentity(runtime)
            : null),
        runtime.pendingRecoveryActionId,
      );
      runtime.databaseSourceApplicationVersion =
        targetCompatibility.sourceApplication.application_version;
      if (startupCompatibilityRefusal !== null) {
        throw new PublicRuntimeError(startupCompatibilityRefusal);
      }
      runtime.recoveryBackupOperationReconciliation =
        await reconcileRecoveryBackupOperation({
          backupDirectory: paths.local.backup_directory,
          applicationScopeFingerprint:
            targetCompatibility.applicationScopeFingerprint,
          inspectDatabase: inspectRecoveryDatabaseFile,
          inspectSafetyDatabase: inspectSafetyRecoveryDatabaseFile,
        });
      if (runtime.runtimeDistribution.mode === "packaged") {
        runtime.legacyBackupAdoption = await adoptLegacyRecoveryBackups({
          backupDirectory: paths.local.backup_directory,
          applicationScopeFingerprint:
            targetCompatibility.applicationScopeFingerprint,
          inspectDatabase: inspectRecoveryDatabaseFile,
          inspectSourceDatabase:
            inspectLegacyRecoveryAdoptionSourceDatabaseFile,
        });
      }
      if (
        runtime.recoveryAction === "retry_update" &&
        runtime.recoveryBackupId !== null
      ) {
        runtime.reusableRecoveryBackup =
          resolveRuntimeReusableRecoveryBackup(runtime);
      }
      preparePendingPackageIdentity(runtime);
      databaseResult = await databaseOperation({
        databasePath: runtime.databasePath,
        backupDirectory: paths.local.backup_directory,
        repositoryRoot,
        instanceId: runtime.instanceId,
        databaseOverrideActive: paths.local.database_override_active,
        forceCurrentRecoveryBackup: runtime.packageIdentityAdoption,
        requirePackageIdentityGuard:
          runtime.runtimeDistribution.mode === "packaged",
        reusableRecoveryBackup: runtime.reusableRecoveryBackup,
        repositoryFingerprint: runtime.repositoryFingerprint,
        runtimeOwnershipGeneration: runtime.generationId,
        targetCompatibility,
        dependencies: {
          deferPublicationCleanup:
            runtime.runtimeDistribution.mode === "packaged",
          afterJournalPhase: ({ phase }) =>
            holdAtDatabaseJournalPhaseForCanonicalTest(runtime, phase),
          afterPublishedVerified: (publication) =>
            completePublishedDatabaseOperation(runtime, publication),
        },
        ...(runtime.recoveryAction === "restore_backup"
          ? {
              selectedBackupId: runtime.recoveryBackupId ?? "latest",
              expectedSelectedBackupIdentity:
                runtime.recoveryBackupIdentity,
              expectedSelectedBackupDirectoryIdentity:
                runtime.recoveryBackupDirectoryIdentity,
              expectedSelectedStateDirectoryIdentity:
                runtime.pendingRecoveryAction
                  ?.selected_backup_state_directory_identity ?? null,
              expectedSelectedManifestFileIdentity:
                runtime.pendingRecoveryAction
                  ?.selected_backup_manifest_file_identity ?? null,
              expectedSelectedPayloadFileIdentity:
                runtime.pendingRecoveryAction
                  ?.selected_backup_payload_file_identity ?? null,
            }
          : {}),
      });
      runtime.databaseState = databaseResult.databaseState;
      runtime.databaseSchemaVersion = databaseResult.schemaVersion;
      runtime.recoveryBackupCreated = databaseResult.recoveryBackupCreated;
      runtime.safetyBackupCreated =
        databaseResult.safetyBackupCreated === true ||
        runtime.safetyBackupCreated;
      runtime.protectedRecoveryBackupId =
        databaseResult.safetyBackupId ??
        databaseResult.recoveryBackupId ??
        runtime.protectedRecoveryBackupId;
      runtime.protectedRecoveryBackupIdentity =
        databaseResult.safetyBackupIdentity ??
        databaseResult.recoveryBackupIdentity ??
        runtime.protectedRecoveryBackupIdentity;
      if (
        runtime.environment.AUGNES_CANONICAL_TEST_MODE === "1" &&
        runtime.environment.AUGNES_TEST_HOLD_AFTER_DATABASE_PREPARE === "1" &&
        (runtime.packageIdentityAdoption ||
          runtime.publishedOperationPending !== null)
      ) {
        emitResult({
          command: "test",
          result: "database_prepared_before_package_identity_commit",
        });
        await new Promise(() => {});
      }
      if (runtime.publishedOperationPending === null) {
        clearRuntimePendingRecoveryAction(runtime);
      }
      writeRuntimeManifest(runtime);
    } catch (error) {
      runtime.recoveryBackupCreated = error?.recoveryBackupCreated === true;
      runtime.safetyBackupCreated = error?.safetyBackupCreated === true;
      runtime.protectedRecoveryBackupId = error?.recoveryBackupId ?? null;
      runtime.protectedRecoveryBackupIdentity =
        error?.recoveryBackupIdentity ?? null;
      const recoveryFailureCode = publicErrorCode(error, "update_recovered");
      runtime.recoveryRetryAvailable = recoveryOperationStateAvailable;
      runtime.recoveryRestoreAvailable = recoveryOperationStateAvailable;
      if (
        recoveryFailureCode === "incompatible_database" ||
        recoveryFailureCode === "current_database_identity_unverified"
      ) {
        runtime.recoveryRetryAvailable = false;
      } else if (
        [
          "installed_package_identity_missing",
          "incompatible_package",
          "recovery_action_target_changed",
          "unsupported_downgrade",
          "recovery_result_unavailable",
        ].includes(recoveryFailureCode)
      ) {
        runtime.recoveryRetryAvailable = false;
        runtime.recoveryRestoreAvailable = false;
      }
      recordFailedRecoveryOperation(runtime, error);
      try {
        clearRuntimePendingRecoveryAction(runtime);
      } catch {
        runtime.recoveryRetryAvailable = false;
        runtime.recoveryRestoreAvailable = false;
      }
      if (runtime.runtimeDistribution.mode !== "packaged") {
        runtime.databaseState = "failed";
        throw error;
      }
      runtime.databaseState = "recovery_required";
      writeRuntimeManifest(runtime);
      await enterRecoveryMode(runtime, error);
      await runtime.shutdownPromise;
      if (!runtime.recoveryRequest) return runtime.exitCode;
      throw new ShutdownDuringStartupError();
    }

    const ui = await launchWithPortSelection({
      runtime,
      role: "ui",
      preferredPort: options.uiPreferredPort,
      readinessPath: "/api/healthz",
      isReady: (body) =>
        body?.ok === true &&
        body?.service === "augnes-ui" &&
        body?.status === "ready" &&
        body?.runtime_instance_id === runtime.instanceId,
    });
    runtime.uiPort = ui.port;
    runtime.effectiveUrl = `http://${LOOPBACK_HOST}:${ui.port}`;
    writeRuntimeManifest(runtime);

    const bridge = await launchWithPortSelection({
      runtime,
      role: "bridge",
      preferredPort: options.bridgePreferredPort,
      readinessPath: "/healthz",
      isReady: (body) =>
        body?.ok === true &&
        body?.name === "augnes-console" &&
        body?.mode === "mock" &&
        body?.runtime_instance_id === runtime.instanceId,
    });
    runtime.bridgePort = bridge.port;

    if (runtime.startupFailure) {
      throw childExitError(runtime.startupFailure);
    }
    if (runtime.shutdownRequested) throw new ShutdownDuringStartupError();

    await commitPreparedDatabasePublication(databaseResult);
    finalizePublishedOperation(runtime);
    recordInstalledPackage(runtime);
    transitionRuntime(runtime, "ready");
    recordSuccessfulRecoveryOperation(runtime, databaseResult);
    emitResult(publicStatusResult("start", "ready", buildControlIdentity(runtime)));
    await runtime.shutdownPromise;
  } catch (error) {
    if (!(error instanceof ShutdownDuringStartupError) && !runtime.shutdownRequested) {
      if (shouldOfferPackagedRestartRecovery(runtime, databaseResult)) {
        try {
          await stopRuntimeChildrenForRecovery(runtime);
          const publicationRolledBack =
            await rollbackPreparedDatabasePublication(runtime, databaseResult);
          recordPackagedRestartFailure(runtime, error, databaseResult, {
            publicationRolledBack,
          });
          await enterRecoveryMode(runtime, error);
          await runtime.shutdownPromise;
        } catch (recoverySurfaceError) {
          if (!runtime.shutdownRequested) {
            await failRuntime(runtime, {
              code: publicErrorCode(
                recoverySurfaceError,
                "packaged_recovery_surface_failed",
              ),
              role: recoverySurfaceError?.role ?? error?.role ?? null,
              exit_code: integerOrNull(
                recoverySurfaceError?.exitCode ?? error?.exitCode,
              ),
              signal: nonEmptyString(
                recoverySurfaceError?.signal ?? error?.signal,
              ),
            });
          }
        }
      } else {
        recordPackagedRestartFailure(runtime, error, databaseResult);
        await failRuntime(runtime, {
          code: publicErrorCode(error, "startup_failed"),
          role: error?.role ?? null,
          exit_code: integerOrNull(error?.exitCode),
          signal: nonEmptyString(error?.signal),
        });
      }
    }
  } finally {
    if (databaseResult?.publicationControl) {
      try {
        await rollbackPreparedDatabasePublication(runtime, databaseResult);
      } catch (error) {
        cleanupError ??= error;
      }
    }
    try {
      await cleanupOwnedRuntime(runtime);
    } catch (error) {
      cleanupError ??= error;
      runtime.exitCode = 1;
    }
    removeSignalHandlers(runtime);
  }

  if (runtime.recoveryRequest && cleanupError === null) {
    try {
      verifyCurrentPackagedDistribution(runtime);
    } catch (error) {
      emitResult({
        command: "start",
        result: "refused",
        state: "recovery_required",
        verified: false,
        reason: publicErrorCode(error, "package_integrity_failed"),
        effective_url: null,
        database_state: runtime.databaseState,
        database_schema_version: runtime.databaseSchemaVersion,
        recovery_backup_created: runtime.recoveryBackupCreated,
      });
      return 2;
    }
    return runStartCommand({
      environment,
      options: {
        ...options,
        recoveryAction: runtime.recoveryRequest.action,
        recoveryBackupId: runtime.recoveryRequest.backupId ?? null,
        recoveryBackupIdentity:
          runtime.recoveryRequest.backupIdentity ?? null,
        recoveryBackupDirectoryIdentity:
          runtime.recoveryRequest.backupDirectoryIdentity ?? null,
        recoveryJournalOwner: {
          supervisorPid: runtime.supervisorPid,
          runtimeInstanceId: runtime.instanceId,
          runtimeOwnershipGeneration: runtime.generationId,
        },
      },
      paths,
      repositoryFingerprint,
      runtimeDistribution,
      dependencies,
    });
  }

  if (cleanupError) {
    emitResult({
      command: "start",
      result: "failed",
      state: "failed",
      verified: true,
      reason: "owned_cleanup_failed",
      effective_url: null,
      database_state: runtime.databaseState,
      database_schema_version: runtime.databaseSchemaVersion,
      recovery_backup_created: runtime.recoveryBackupCreated,
    });
    return 1;
  }

  if (runtime.exitCode !== 0) {
    emitResult({
      command: "start",
      result: "failed",
      state: "failed",
      verified: true,
      reason: runtime.failure?.code ?? "runtime_failed",
      failed_role: runtime.failure?.role ?? null,
      exit_code: runtime.exitCode,
      effective_url: null,
      database_state: runtime.databaseState,
      database_schema_version: runtime.databaseSchemaVersion,
      recovery_backup_created: runtime.recoveryBackupCreated,
    });
    return runtime.exitCode;
  }

  emitResult({
    command: "start",
    result: "stopped",
    state: "stopped",
    verified: true,
    reason: runtime.shutdownReason ?? "normal_exit",
    effective_url: null,
    database_state: runtime.databaseState,
    database_schema_version: runtime.databaseSchemaVersion,
    recovery_backup_created: runtime.recoveryBackupCreated,
  });
  return 0;
}

async function launchWithPortSelection({
  runtime,
  role,
  preferredPort,
  readinessPath,
  isReady,
}) {
  for (let offset = 0; offset < PORT_SEARCH_SIZE; offset += 1) {
    if (runtime.shutdownRequested) throw new ShutdownDuringStartupError();
    if (runtime.startupFailure) throw childExitError(runtime.startupFailure);

    const port = preferredPort + offset;
    if (port > 65_535) break;
    if (runtimeOwnsPort(runtime, port)) continue;
    const record = spawnRuntimeChild({ runtime, role, port });
    runtime.children.set(role, record);
    writeRuntimeManifest(runtime);

    const readiness = await waitForChildReadiness({
      runtime,
      record,
      url: `http://${LOOPBACK_HOST}:${port}${readinessPath}`,
      isReady,
    });

    if (readiness === "ready") {
      record.state = "ready";
      record.active = true;
      writeRuntimeManifest(runtime);
      return record;
    }

    record.expectedExit = true;
    await stopOwnedChild(record);
    runtime.children.delete(role);
    writeRuntimeManifest(runtime);

    if (readiness === "collision") continue;
    if (readiness === "shutdown") throw new ShutdownDuringStartupError();
    if (runtime.startupFailure) throw childExitError(runtime.startupFailure);
    throw new PublicRuntimeError(`${role}_startup_${readiness}`);
  }

  throw new PublicRuntimeError(`${role}_port_range_exhausted`);
}

export function runtimeOwnsPort(runtime, port) {
  if (
    runtime.controlPort === port ||
    runtime.uiPort === port ||
    runtime.bridgePort === port
  ) {
    return true;
  }
  return [...runtime.children.values()].some(
    (record) => record.port === port || record.ownershipPort === port,
  );
}

export function buildSupervisorChildValues({
  role,
  environment = process.env,
  paths,
  instanceId,
  runtimeDistribution = sourceRuntimeDistribution(repositoryRoot),
  repositoryFingerprint = null,
  generationId = null,
  childOwnershipToken = null,
  effectiveUrl = null,
  controlPort = null,
  recoveryMode = false,
  port = null,
  databasePath = nonEmptyString(environment.AUGNES_DB_PATH),
  databaseSchemaCompatibility = null,
  canonicalNodeOptions = canonicalTestNodeOptions(environment),
}) {
  const packaged = runtimeDistribution.mode === "packaged";
  const ownershipValues = {
    AUGNES_RUNTIME_INSTANCE_ID: instanceId,
    AUGNES_RUNTIME_CONTRACT: RUNTIME_CONTRACT,
    AUGNES_RUNTIME_SCHEMA_VERSION: String(RUNTIME_SCHEMA_VERSION),
    AUGNES_RUNTIME_REPOSITORY_FINGERPRINT: repositoryFingerprint,
    AUGNES_RUNTIME_GENERATION_ID: generationId,
    AUGNES_RUNTIME_GENERATION_VERSION: String(RUNTIME_GENERATION_VERSION),
    AUGNES_RUNTIME_CHILD_ROLE: role,
    AUGNES_RUNTIME_CHILD_PORT: port === null ? null : String(port),
    ...(role === "ui"
      ? {
          AUGNES_RUNTIME_CONTROL_PORT:
            controlPort === null ? null : String(controlPort),
        }
      : {}),
    AUGNES_RUNTIME_OWNERSHIP_TOKEN: childOwnershipToken,
  };
  const diagnosticValues = runtimeDiagnosticEnvironmentValues(
    runtimeDistribution,
    databaseSchemaCompatibility,
  );
  if (role === "ui") {
    return {
      NODE_ENV: packaged ? "production" : "development",
      NODE_OPTIONS: canonicalNodeOptions,
      HOSTNAME: packaged ? LOOPBACK_HOST : null,
      PORT: packaged ? String(port) : null,
      NEXT_TELEMETRY_DISABLED: "1",
      AUGNES_DB_PATH: databasePath,
      AUGNES_RECOVERY_MODE: recoveryMode ? "1" : null,
      ...ownershipValues,
      ...diagnosticValues,
      OPENAI_API_KEY: recoveryMode
        ? null
        : nonEmptyString(environment.OPENAI_API_KEY),
      OPENAI_MODEL: recoveryMode
        ? null
        : nonEmptyString(environment.OPENAI_MODEL),
      CODEX_HOME: recoveryMode ? null : nonEmptyString(environment.CODEX_HOME),
      CODEX_SQLITE_HOME: recoveryMode
        ? null
        : nonEmptyString(environment.CODEX_SQLITE_HOME),
      AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: nonEmptyString(
        environment.AUGNES_VNEXT_OPERATOR_PILOT_ENABLED,
      ),
      AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: nonEmptyString(
        environment.AUGNES_VNEXT_OPERATOR_WORKSPACE_ID,
      ),
      AUGNES_VNEXT_OPERATOR_PROJECT_ID: nonEmptyString(
        environment.AUGNES_VNEXT_OPERATOR_PROJECT_ID,
      ),
      AUGNES_VNEXT_OPERATOR_ID: nonEmptyString(
        environment.AUGNES_VNEXT_OPERATOR_ID,
      ),
      AUGNES_VNEXT_OPERATOR_PREVIEW_MAX_AGE_MS: nonEmptyString(
        environment.AUGNES_VNEXT_OPERATOR_PREVIEW_MAX_AGE_MS,
      ),
      AUGNES_VNEXT_OPERATOR_GATE_TTL_MS: nonEmptyString(
        environment.AUGNES_VNEXT_OPERATOR_GATE_TTL_MS,
      ),
      AUGNES_CANONICAL_TEST_MODE:
        environment.AUGNES_CANONICAL_TEST_MODE === "1" ? "1" : null,
      AUGNES_CANONICAL_TEMP_ROOT:
        environment.AUGNES_CANONICAL_TEST_MODE === "1"
          ? nonEmptyString(environment.AUGNES_CANONICAL_TEMP_ROOT)
          : null,
      AUGNES_TEST_FOLDER_PICKER_PATH:
        environment.AUGNES_CANONICAL_TEST_MODE === "1"
          ? nonEmptyString(environment.AUGNES_TEST_FOLDER_PICKER_PATH)
          : null,
      AUGNES_TEST_FOLDER_PICKER_OUTCOME:
        environment.AUGNES_CANONICAL_TEST_MODE === "1"
          ? nonEmptyString(environment.AUGNES_TEST_FOLDER_PICKER_OUTCOME)
          : null,
      AUGNES_VNEXT_BOUNDED_CYCLE_DETERMINISTIC_ADAPTER:
        environment.AUGNES_CANONICAL_TEST_MODE === "1" &&
        environment.AUGNES_VNEXT_BOUNDED_CYCLE_DETERMINISTIC_ADAPTER === "1"
          ? "1"
          : null,
    };
  }

  if (role === "bridge") {
    return {
      NODE_ENV: packaged ? "production" : "development",
      NODE_OPTIONS: canonicalNodeOptions,
      PORT: String(port),
      DOTENV_CONFIG_PATH: paths.bridgeEnvironment,
      AUGNES_CORE_MODE: "mock",
      AUGNES_API_BASE_URL: effectiveUrl,
      AUGNES_ENABLE_AGENT_BRIDGE: "true",
      ...ownershipValues,
      ...diagnosticValues,
      AUGNES_APP_PROFILE: nonEmptyString(environment.AUGNES_APP_PROFILE),
      AUGNES_APP_TOOL_SURFACE: nonEmptyString(
        environment.AUGNES_APP_TOOL_SURFACE,
      ),
      AUGNES_APP_DOMAIN: nonEmptyString(environment.AUGNES_APP_DOMAIN),
      AUGNES_CONNECT_DOMAIN: nonEmptyString(environment.AUGNES_CONNECT_DOMAIN),
      AUGNES_RESOURCE_DOMAIN: nonEmptyString(environment.AUGNES_RESOURCE_DOMAIN),
    };
  }

  throw new Error(`unknown supervised child role: ${role}`);
}

function spawnRuntimeChild({ runtime, role, port }) {
  const authoredValues = buildSupervisorChildValues({
    role,
    environment: runtime.environment,
    paths: runtime.paths,
    instanceId: runtime.instanceId,
    runtimeDistribution: runtime.runtimeDistribution,
    repositoryFingerprint: runtime.repositoryFingerprint,
    generationId: runtime.generationId,
    childOwnershipToken: runtime.childOwnershipToken,
    effectiveUrl: runtime.effectiveUrl,
    controlPort: runtime.controlPort,
    recoveryMode: runtime.recoveryMode,
    port,
    databasePath: runtime.databasePath,
    databaseSchemaCompatibility: runtime.databaseSchemaVersion,
    canonicalNodeOptions: runtime.canonicalNodeOptions,
  });
  const childEnvironment = buildRuntimeChildEnvironment({
    role,
    ambientEnvironment: runtime.environment,
    values: authoredValues,
  });
  const packaged = runtime.runtimeDistribution.mode === "packaged";
  const childArguments = packaged
    ? role === "ui"
      ? [runtime.runtimeDistribution.uiServer]
      : [runtime.runtimeDistribution.bridgeServer]
    : role === "ui"
      ? [
          nextBin,
          "dev",
          ...runtime.uiNextArguments,
          "--hostname",
          LOOPBACK_HOST,
          "--port",
          String(port),
        ]
      : ["--import", "tsx", bridgeServer];
  const args = [runtimeChildLauncher, ...childArguments];
  const child = spawn(process.execPath, args, {
    cwd: packaged
      ? role === "ui"
        ? runtime.runtimeDistribution.uiWorkingDirectory
        : runtime.runtimeDistribution.bridgeWorkingDirectory
      : role === "ui"
        ? repositoryRoot
        : bridgeRoot,
    env: childEnvironment,
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "pipe", "ipc"],
    windowsHide: true,
  });
  const record = {
    role,
    port,
    child,
    pid: child.pid ?? null,
    state: "starting",
    active: false,
    expectedExit: false,
    exit: null,
    spawnError: null,
    outputTail: "",
    ownershipPort: null,
  };

  child.on("message", (message) => {
    if (
      message?.type !== "augnes-runtime-child-ownership-ready" ||
      message.pid !== record.pid ||
      !isPort(message.port)
    ) {
      return;
    }
    record.ownershipPort = message.port;
    if (runtime.manifestCreated) writeRuntimeManifestBestEffort(runtime);
  });

  for (const stream of [child.stdout, child.stderr]) {
    stream.setEncoding("utf8");
    stream.on("data", (chunk) => {
      record.outputTail = `${record.outputTail}${chunk}`.slice(-OUTPUT_TAIL_BYTES);
      process.stderr.write(`[augnes:${role}] ${chunk}`);
    });
  }
  child.once("error", (error) => {
    record.spawnError = error;
  });
  child.once("exit", (code, signal) => {
    record.exit = { code: integerOrNull(code), signal: nonEmptyString(signal) };
    record.state = record.expectedExit ? "stopped" : "failed";
    if (runtime.manifestCreated) writeRuntimeManifestBestEffort(runtime);
    if (record.expectedExit || runtime.shutdownRequested || !record.active) return;
    if (runtime.lifecycleState === "ready") {
      void failRuntime(runtime, {
        code: "required_child_exited",
        role: record.role,
        exit_code: record.exit.code,
        signal: record.exit.signal,
      });
    } else {
      runtime.startupFailure = record;
    }
  });
  return record;
}

async function waitForChildReadiness({ runtime, record, url, isReady }) {
  const deadline = Date.now() + runtimeStartupTimeoutMs(runtime);
  while (Date.now() < deadline) {
    if (runtime.shutdownRequested) return "shutdown";
    if (runtime.startupFailure) return "required_child_exit";
    if (record.spawnError) return "spawn_failed";
    if (isPortCollisionOutput(record.outputTail)) return "collision";
    if (record.exit) {
      return isPortCollisionOutput(record.outputTail) ? "collision" : "child_exit";
    }

    if (canonicalTestStallsReadiness(runtime, record.role)) {
      await delay(50);
      continue;
    }

    try {
      const response = await requestJsonUrl(url, 1_500);
      if (response.statusCode === 200 && isReady(response.body) && !record.exit) {
        return "ready";
      }
    } catch {
      // The selected child has not reached its owned readiness response yet.
    }
    await delay(150);
  }
  return "timeout";
}

function runtimeStartupTimeoutMs(runtime) {
  if (runtime.environment.AUGNES_CANONICAL_TEST_MODE !== "1") {
    return STARTUP_TIMEOUT_MS;
  }
  const candidate = Number(
    runtime.environment.AUGNES_TEST_RUNTIME_STARTUP_TIMEOUT_MS,
  );
  return Number.isInteger(candidate) && candidate >= 250 && candidate <= 5_000
    ? candidate
    : STARTUP_TIMEOUT_MS;
}

function canonicalTestStallsReadiness(runtime, role) {
  return (
    runtime.environment.AUGNES_CANONICAL_TEST_MODE === "1" &&
    runtime.environment.AUGNES_TEST_RUNTIME_STALL_READINESS_ROLE === role
  );
}

async function failRuntime(runtime, failure) {
  if (runtime.shutdownRequested) return;
  runtime.failure = publicFailure(failure);
  runtime.exitCode = 1;
  transitionRuntime(runtime, "failed", runtime.failure);
  emitResult({
    command: "start",
    result: "failed",
    state: "failed",
    verified: true,
    reason: runtime.failure.code,
    failed_role: runtime.failure.role,
    child_exit_code: runtime.failure.exit_code,
    child_signal: runtime.failure.signal,
    effective_url: runtime.effectiveUrl,
    database_state: runtime.databaseState,
    database_schema_version: runtime.databaseSchemaVersion,
    recovery_backup_created: runtime.recoveryBackupCreated,
  });
  runtime.shutdownRequested = true;
  runtime.shutdownReason = runtime.failure.code;
  runtime.resolveShutdown();
}

async function enterRecoveryMode(runtime, error) {
  const protection = runtimeRecoveryProtection(runtime);
  runtime.recoveryMode = true;
  runtime.failure = {
    code: publicErrorCode(error, "update_recovered"),
    role: null,
    exit_code: null,
    signal: null,
  };
  runtime.exitCode = 2;
  const ui = await launchWithPortSelection({
    runtime,
    role: "ui",
    preferredPort: runtime.uiPreferredPort,
    readinessPath: "/api/healthz",
    isReady: (body) =>
      body?.ok === true &&
      body?.service === "augnes-ui" &&
      body?.status === "ready" &&
      body?.runtime_instance_id === runtime.instanceId,
  });
  runtime.uiPort = ui.port;
  runtime.effectiveUrl = `http://${LOOPBACK_HOST}:${ui.port}/recovery`;
  transitionRuntime(runtime, "failed", runtime.failure);
  emitResult({
    command: "start",
    result: "recovery_available",
    state: "failed",
    verified: true,
    reason: runtime.failure.code,
    instance_id: runtime.instanceId,
    supervisor_pid: runtime.supervisorPid,
    effective_url: runtime.effectiveUrl,
    ui_port: runtime.uiPort,
    bridge_port: null,
    children: publicChildren(runtime),
    database_state: runtime.databaseState,
    database_schema_version: runtime.databaseSchemaVersion,
    recovery_backup_created: runtime.recoveryBackupCreated,
    data_preserved: true,
    backup_verified: protection.backupVerified,
    next_action: protection.nextAction,
  });
}

function shouldOfferPackagedRestartRecovery(runtime, databaseResult) {
  return (
    runtime.runtimeDistribution.mode === "packaged" &&
    databaseResult !== null &&
    (runtime.recoveryAction !== null ||
      runtime.updateHandoff !== null ||
      runtime.packageIdentityAdoption ||
      runtime.publishedOperationPending !== null ||
      databaseResult.databaseState === "migrated" ||
      runtime.databaseStateReconciled)
  );
}

async function stopRuntimeChildrenForRecovery(runtime) {
  const records = [...runtime.children.values()].reverse();
  for (const record of records) {
    record.expectedExit = true;
    if (record.state !== "stopped") record.state = "stopping";
  }
  if (records.length > 0) writeRuntimeManifestBestEffort(runtime);
  const results = await Promise.allSettled(
    records.map((record) => stopOwnedChild(record)),
  );
  if (results.some((result) => result.status === "rejected")) {
    throw new PublicRuntimeError("owned_child_cleanup_failed");
  }
  runtime.children.clear();
  runtime.uiPort = null;
  runtime.bridgePort = null;
  runtime.effectiveUrl = null;
  runtime.startupFailure = null;
  writeRuntimeManifest(runtime);
}

function recordSuccessfulRecoveryOperation(runtime, databaseResult) {
  if (!databaseResult) return;
  if (runtime.reconciledRecoveryActionCompleted) return;
  if (runtime.publishedOperationFinalized) return;
  const meaningfulUpdate =
    runtime.updateHandoff !== null ||
    runtime.packageIdentityAdoption ||
    databaseResult.databaseState === "migrated" ||
    runtime.databaseStateReconciled;
  if (runtime.recoveryAction === null && !meaningfulUpdate) return;
  const noUpdateRequired =
    runtime.recoveryAction === "retry_update" && !meaningfulUpdate;
  const reconciledOperation = runtime.databaseReconciliationOperation;
  const restore =
    runtime.recoveryAction === "restore_backup" ||
    reconciledOperation?.operationKind === "restore";
  const reconciledRestoreCommitted =
    restore &&
    runtime.recoveryAction === null &&
    reconciledOperation?.result === "database_verified_publish_committed";
  const reconciledRestoreRolledBack =
    restore &&
    runtime.recoveryAction === null &&
    reconciledOperation?.result === "database_rollback_restored";
  const reconciledUpdate =
    !restore && runtime.databaseStateReconciled;
  const protectedBackupVerified = runtimeProtectedBackupVerified(runtime);
  try {
    writeRecoveryOperationResult({
      backupDirectory: runtime.paths.local.backup_directory,
      event: {
        operation_kind: restore ? "restore" : "update",
        outcome: reconciledRestoreRolledBack
          ? "restore_failed_preserved_current_state"
          : restore
          ? "restore_completed"
          : reconciledUpdate
            ? "update_recovered"
            : noUpdateRequired
              ? "no_update_required"
            : "updated",
        reason_code: reconciledRestoreRolledBack
          ? "interrupted_restore_reconciled"
          : reconciledRestoreCommitted
            ? "interrupted_restore_committed"
          : restore
          ? "restore_completed"
          : reconciledUpdate
            ? "interrupted_update_reconciled"
            : noUpdateRequired
              ? "no_update_required"
            : "update_verified",
        finished_at: new Date().toISOString(),
      application_version:
        runtime.updateHandoff?.source_application_version ??
        runtime.databaseSourceApplicationVersion,
        target_application_version:
          runtime.runtimeDistribution.applicationVersion,
        target_build_identity: runtime.runtimeDistribution.buildIdentity,
        database_state: reconciledRestoreCommitted
          ? "restored"
          : databaseResult.databaseState,
        protected_backup_id: runtime.protectedRecoveryBackupId,
        protected_backup_identity: runtime.protectedRecoveryBackupIdentity,
        backup_verified: protectedBackupVerified,
        safety_backup_created: runtime.safetyBackupCreated,
        data_preserved: true,
        next_action: "continue_with_current_data",
      },
    });
  } catch {
    // The authoritative database result is not downgraded by a bounded,
    // non-authoritative operational-history write failure.
  }
}

function holdAtDatabaseJournalPhaseForCanonicalTest(runtime, phase) {
  if (
    runtime.environment.AUGNES_CANONICAL_TEST_MODE !== "1" ||
    runtime.environment.AUGNES_TEST_HOLD_AT_DATABASE_JOURNAL_PHASE !== phase
  ) {
    return;
  }
  emitResult({
    command: "test",
    result: "database_journal_phase_hold",
    phase,
  });
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
}

function completePublishedDatabaseOperation(runtime, publication) {
  if (
    publication?.operationKind === "update" &&
    runtime.packageIdentityAdoption
  ) {
    const backupVerified = runtimeRecoveryInventory(runtime).verified.some(
      (backup) =>
        backup.manifest.backup_id === publication.recoveryBackupId &&
        backup.manifest.backup_identity ===
          publication.recoveryBackupIdentity &&
        JSON.stringify(backup.backupDirectoryIdentity) ===
          JSON.stringify(publication.recoveryBackupDirectoryIdentity),
    );
    if (!backupVerified) {
      throw new PublicRuntimeError("database_backup_verification_failed");
    }
    const pendingEvent = writeRecoveryOperationResult({
      backupDirectory: runtime.paths.local.backup_directory,
      event: {
        operation_kind: "update",
        outcome: "update_published_restart_pending",
        reason_code: "update_restart_pending",
        finished_at: new Date().toISOString(),
        application_version:
          runtime.updateHandoff?.source_application_version ??
          runtime.databaseSourceApplicationVersion,
        target_application_version:
          runtime.runtimeDistribution.applicationVersion,
        target_build_identity: runtime.runtimeDistribution.buildIdentity,
        database_state: "updated",
        protected_backup_id: publication.recoveryBackupId,
        protected_backup_identity: publication.recoveryBackupIdentity,
        backup_verified: true,
        safety_backup_created: false,
        data_preserved: true,
        next_action: "retry_packaged_restart",
      },
    });
    runtime.protectedRecoveryBackupId = publication.recoveryBackupId;
    runtime.protectedRecoveryBackupIdentity =
      publication.recoveryBackupIdentity;
    runtime.publishedOperationPending = pendingEvent;
    return;
  }
  if (
    runtime.recoveryAction !== "restore_backup" ||
    runtime.pendingRecoveryActionId === null ||
    publication?.operationKind !== "restore"
  ) {
    return;
  }
  if (
    publication.recoveryActionId !== runtime.pendingRecoveryActionId ||
    publication.selectedBackupId !== runtime.recoveryBackupId ||
    publication.selectedBackupIdentity !== runtime.recoveryBackupIdentity
  ) {
    throw new PublicRuntimeError("recovery_action_changed");
  }
  const safetyBackupCreated = publication.recoveryBackupId !== null;
  const recoveryInventory = runtimeRecoveryInventory(runtime);
  const safetyBackupVerified = recoveryInventory.verified.some(
    (backup) =>
      backup.manifest.backup_id === publication.recoveryBackupId &&
      backup.manifest.backup_identity === publication.recoveryBackupIdentity &&
      JSON.stringify(backup.backupDirectoryIdentity) ===
        JSON.stringify(publication.recoveryBackupDirectoryIdentity),
  );
  const protectedBackupId = safetyBackupVerified
    ? publication.recoveryBackupId
    : publication.selectedBackupId;
  const protectedBackupIdentity = safetyBackupVerified
    ? publication.recoveryBackupIdentity
    : publication.selectedBackupIdentity;
  const protectedBackupDirectoryIdentity = safetyBackupVerified
    ? publication.recoveryBackupDirectoryIdentity
    : runtime.recoveryBackupDirectoryIdentity;
  const protectedBackupVerified = recoveryInventory.verified.some(
    (backup) =>
      backup.manifest.backup_id === protectedBackupId &&
      backup.manifest.backup_identity === protectedBackupIdentity &&
      JSON.stringify(backup.backupDirectoryIdentity) ===
        JSON.stringify(protectedBackupDirectoryIdentity),
  );
  if (!protectedBackupVerified) {
    throw new PublicRuntimeError("database_backup_verification_failed");
  }
  const pendingEvent = writeRecoveryOperationResult({
    backupDirectory: runtime.paths.local.backup_directory,
    event: {
      operation_kind: "restore",
      outcome: "restore_published_restart_pending",
      reason_code: "restore_restart_pending",
      finished_at: new Date().toISOString(),
      application_version:
        runtime.updateHandoff?.source_application_version ??
        runtime.databaseSourceApplicationVersion,
      target_application_version:
        runtime.runtimeDistribution.applicationVersion,
      target_build_identity: runtime.runtimeDistribution.buildIdentity,
      database_state: "restored",
      protected_backup_id: protectedBackupId,
      protected_backup_identity: protectedBackupIdentity,
      backup_verified: true,
      safety_backup_created: safetyBackupCreated,
      data_preserved: true,
      next_action: "retry_packaged_restart",
    },
  });
  runtime.protectedRecoveryBackupId = protectedBackupId;
  runtime.protectedRecoveryBackupIdentity = protectedBackupIdentity;
  runtime.safetyBackupCreated = safetyBackupCreated;
  runtime.publishedOperationPending = pendingEvent;
}

function finalizePublishedOperation(runtime) {
  const pending = runtime.publishedOperationPending;
  if (pending === null) return;
  if (
    !isProtectedBackupVerified(
      runtimeRecoveryInventory(runtime),
      pending.protected_backup_id,
      pending.protected_backup_identity,
    )
  ) {
    throw new PublicRuntimeError("database_backup_verification_failed");
  }
  const restore = pending.operation_kind === "restore";
  const completedEvent = {
    ...pending,
    outcome: restore ? "restore_completed" : "updated",
    reason_code: restore
      ? "restore_restart_verified"
      : "update_restart_verified",
    finished_at: new Date().toISOString(),
    database_state: restore ? "restored" : "updated",
    next_action: "continue_with_current_data",
  };
  if (restore && runtime.pendingRecoveryActionId !== null) {
    completePendingRecoveryAction({
      backupDirectory: runtime.paths.local.backup_directory,
      expectedActionId: runtime.pendingRecoveryActionId,
      event: completedEvent,
    });
    runtime.pendingRecoveryActionId = null;
    runtime.pendingRecoveryAction = null;
  } else if (!restore) {
    completePendingPackageUpdate({
      backupDirectory: runtime.paths.local.backup_directory,
      expectedBuildIdentity: runtime.runtimeDistribution.buildIdentity,
      event: completedEvent,
    });
    clearRuntimePendingRecoveryAction(runtime);
  } else {
    writeRecoveryOperationResult({
      backupDirectory: runtime.paths.local.backup_directory,
      event: completedEvent,
    });
  }
  runtime.publishedOperationPending = null;
  runtime.publishedOperationFinalized = true;
}

function isPublishedRestartPending(event) {
  return (
    event?.outcome === "update_published_restart_pending" ||
    event?.outcome === "restore_published_restart_pending"
  );
}

function findPublishedRestartPending(events, runtimeDistribution) {
  if (!Array.isArray(events)) return null;
  for (const event of events) {
    if (
      event?.target_build_identity !== runtimeDistribution.buildIdentity ||
      event?.target_application_version !==
        runtimeDistribution.applicationVersion
    ) {
      continue;
    }
    if (
      (event.operation_kind === "restore" &&
        event.outcome === "restore_completed" &&
        event.reason_code === "restore_restart_verified") ||
      (event.operation_kind === "update" &&
        event.outcome === "updated" &&
        event.reason_code === "update_restart_verified") ||
      event.outcome === "update_recovered" ||
      event.outcome === "restore_failed_preserved_current_state"
    ) {
      return null;
    }
    if (isPublishedRestartPending(event)) return event;
  }
  return null;
}

function publishedRestartMatchesDistribution(event, runtimeDistribution) {
  return (
    isPublishedRestartPending(event) &&
    event.target_application_version ===
      runtimeDistribution.applicationVersion &&
    event.target_build_identity === runtimeDistribution.buildIdentity
  );
}

function recordInstalledPackage(runtime) {
  if (runtime.runtimeDistribution.mode !== "packaged") return;
  const identity = packageIdentityForRuntimeDistribution(
    runtime.runtimeDistribution,
  );
  const packageState = readRecoveryOperationResults(
    runtime.paths.local.backup_directory,
  );
  if (
    runtime.recoveryAction !== "restore_backup" &&
    packageState.installed_package !== null &&
    packageState.pending_package === null &&
    samePackageIdentity(packageState.installed_package, identity)
  ) {
    return;
  }
  writeInstalledPackageIdentity({
    backupDirectory: runtime.paths.local.backup_directory,
    identity,
  });
}

function preparePendingPackageIdentity(runtime) {
  if (runtime.runtimeDistribution.mode !== "packaged") return;
  const packageState = readRecoveryOperationResults(
    runtime.paths.local.backup_directory,
  );
  const installedDecision = packageState.installed_package === null
    ? null
    : classifyRuntimeUpdate(
        packageState.installed_package,
        runtime.runtimeDistribution,
      );
  const pendingDecision = packageState.pending_package === null
    ? null
    : classifyRuntimeUpdate(
        packageState.pending_package,
        runtime.runtimeDistribution,
      );
  if (
    runtime.recoveryAction !== "restore_backup" &&
    packageState.installed_package !== null &&
    existsSync(runtime.databasePath)
  ) {
    let guard;
    try {
      guard = inspectRuntimePackageIdentityGuard(runtime.databasePath);
    } catch (error) {
      throw new PublicRuntimeError(
        "current_database_identity_unverified",
        error?.message,
      );
    }
    if (
      guard.identity_state !== "package_identity_required" &&
      !isVerifiedV1PackageAdoption(
        packageState.installed_package,
        runtime.runtimeDistribution,
        installedDecision,
      )
    ) {
      throw new PublicRuntimeError("current_database_identity_unverified");
    }
    if (guard.identity_state !== "package_identity_required") {
      runtime.packageIdentityAdoption = true;
    }
  }
  if (
    installedDecision?.outcome === "no_update_required" &&
    pendingDecision !== null &&
    pendingDecision.outcome !== "no_update_required"
  ) {
    let inspection;
    try {
      inspection = inspectRecoverySourceDatabaseFile(runtime.databasePath);
    } catch {
      throw new PublicRuntimeError(pendingDecision.outcome);
    }
    if (
      !databaseInspectionMatchesPackageIdentity(
        inspection,
        packageState.installed_package,
      )
    ) {
      throw new PublicRuntimeError(pendingDecision.outcome);
    }
    clearPendingPackageIdentity({
      backupDirectory: runtime.paths.local.backup_directory,
    });
    return;
  }
  for (const decision of [pendingDecision, installedDecision]) {
    if (decision === null) continue;
    if (
      decision.outcome !== "no_update_required" &&
      decision.outcome !== "update_ready"
    ) {
      throw new PublicRuntimeError(decision.outcome);
    }
  }
  if (
    runtime.recoveryAction !== "restore_backup" &&
    packageState.installed_package === null &&
    existsSync(runtime.databasePath)
  ) {
    let inspection;
    try {
      inspection = inspectRecoverySourceDatabaseFile(runtime.databasePath);
    } catch (error) {
      throw new PublicRuntimeError("incompatible_database", error?.message);
    }
    if (["current", "old"].includes(inspection.schema_classification)) {
      let guard = null;
      try {
        guard = inspectRuntimePackageIdentityGuard(runtime.databasePath);
      } catch (error) {
        if (inspection.schema_classification === "current") {
          throw new PublicRuntimeError(
            "installed_package_identity_missing",
            error?.message,
          );
        }
      }
      const pendingMatchesCurrentTarget =
        packageState.pending_package !== null &&
        samePackageIdentity(
          packageState.pending_package,
          packageIdentityForRuntimeDistribution(runtime.runtimeDistribution),
        );
      if (
        guard?.identity_state === "package_identity_required" &&
        !pendingMatchesCurrentTarget
      ) {
        throw new PublicRuntimeError("installed_package_identity_missing");
      }
      if (
        guard?.identity_state === "package_identity_required" &&
        pendingMatchesCurrentTarget
      ) {
        runtime.recoveryActionDurablyCompleted = true;
      }
      runtime.packageIdentityAdoption =
        guard?.identity_state !== "package_identity_required";
    }
  }
  const identity = packageIdentityForRuntimeDistribution(
    runtime.runtimeDistribution,
  );
  if (
    packageState.pending_package !== null &&
    samePackageIdentity(packageState.pending_package, identity)
  ) {
    return;
  }
  if (
    packageState.pending_package === null &&
    packageState.installed_package !== null &&
    samePackageIdentity(packageState.installed_package, identity)
  ) {
    return;
  }
  writePendingPackageIdentity({
    backupDirectory: runtime.paths.local.backup_directory,
    identity,
  });
}

function isVerifiedV1PackageAdoption(
  installedPackage,
  targetDistribution,
  updateDecision,
) {
  return (
    updateDecision?.outcome === "update_ready" &&
    installedPackage?.package_contract === "augnes.distributable.v1" &&
    installedPackage?.package_contract_version === 1 &&
    targetDistribution.packageContract === "augnes.distributable.v1" &&
    targetDistribution.packageContractVersion === 2 &&
    installedPackage.runtime_contract === targetDistribution.runtimeContract &&
    installedPackage.runtime_schema_version ===
      targetDistribution.runtimeSchemaVersion &&
    installedPackage.application_scope_fingerprint ===
      targetDistribution.applicationScopeFingerprint
  );
}

function persistVerifiedUpdateIntent({
  paths,
  runtimeDistribution,
  updateDecision,
}) {
  if (updateDecision?.outcome !== "update_ready") return;
  writePendingPackageIdentity({
    backupDirectory: paths.local.backup_directory,
    identity: packageIdentityForRuntimeDistribution(runtimeDistribution),
    sourceIdentity: {
      application_version: updateDecision.source_application_version,
      build_identity: updateDecision.source_build_identity,
      package_contract: updateDecision.package_contract,
      package_contract_version: updateDecision.package_contract_version,
      runtime_contract: updateDecision.runtime_contract,
      runtime_schema_version: updateDecision.runtime_schema_version,
    },
  });
}

async function handoffVerifiedRuntimeForUpdate({
  paths,
  repositoryFingerprint,
  existing,
  runtimeDistribution,
  updateDecision,
  allowedPendingActionId = null,
}) {
  let lease;
  try {
    lease = await acquireRuntimeReconciliationLease({
      paths,
      repositoryFingerprint,
    });
  } catch (error) {
    throw new PublicRuntimeError(
      error?.code === "runtime_reconciliation_in_progress"
        ? "update_ownership_conflict"
        : "runtime_reconciliation_failed",
      error,
    );
  }

  try {
    const current = await readVerifiedRuntimeStatus({
      paths,
      repositoryFingerprint,
      ownedLease: lease,
    });
    if (
      !current.verified ||
      current.identity.instance_id !== existing.identity.instance_id ||
      current.identity.generation_id !== existing.identity.generation_id ||
      current.identity.supervisor_pid !== existing.identity.supervisor_pid ||
      current.manifest.control_port !== existing.manifest.control_port
    ) {
      throw new PublicRuntimeError("update_ownership_conflict");
    }

    await stopVerifiedRuntimeForUpdate({ paths, existing: current });

    const operationState = readRecoveryOperationResults(
      paths.local.backup_directory,
    );
    if (
      (allowedPendingActionId === null &&
        operationState.pending_action !== null) ||
      (allowedPendingActionId !== null &&
        operationState.pending_action?.action_id !== allowedPendingActionId) ||
      (operationState.pending_package !== null &&
        operationState.pending_package.build_identity !==
          runtimeDistribution.buildIdentity)
    ) {
      throw new PublicRuntimeError("update_ownership_conflict");
    }

    persistVerifiedUpdateIntent({
      paths,
      runtimeDistribution,
      updateDecision,
    });
  } finally {
    await releaseRuntimeReconciliationLease({ paths, lease });
  }
}

function packageIdentityForRuntimeDistribution(runtimeDistribution) {
  return {
    application_version: runtimeDistribution.applicationVersion,
    build_identity: runtimeDistribution.buildIdentity,
    application_scope_fingerprint:
      runtimeDistribution.applicationScopeFingerprint,
    package_contract: runtimeDistribution.packageContract,
    package_contract_version:
      runtimeDistribution.packageContractVersion,
    package_platform: runtimeDistribution.packagePlatform,
    runtime_contract: runtimeDistribution.runtimeContract,
    runtime_schema_version: runtimeDistribution.runtimeSchemaVersion,
    database_schema_contract:
      runtimeDistribution.databaseSchemaContract,
    database_schema_signature:
      runtimeDistribution.databaseSchemaSignature,
    database_migration_contract:
      runtimeDistribution.databaseMigrationContract,
    database_migration_contract_version:
      runtimeDistribution.databaseMigrationContractVersion,
    database_migration_ids: [
      ...runtimeDistribution.databaseMigrationIds,
    ],
    database_record_contract: runtimeDistribution.databaseRecordContract,
    database_record_contract_version:
      runtimeDistribution.databaseRecordContractVersion,
    database_reader_contracts: [
      ...runtimeDistribution.databaseReaderContracts,
    ],
    recorded_at: new Date().toISOString(),
  };
}

function samePackageIdentity(left, right) {
  return (
    JSON.stringify({ ...left, recorded_at: null }) ===
    JSON.stringify({ ...right, recorded_at: null })
  );
}

function databaseInspectionMatchesPackageIdentity(inspection, identity) {
  return (
    inspection.schema_signature === identity.database_schema_signature &&
    inspection.migration_contract === identity.database_migration_contract &&
    inspection.migration_contract_version ===
      identity.database_migration_contract_version &&
    JSON.stringify(inspection.migration_ids) ===
      JSON.stringify(identity.database_migration_ids) &&
    inspection.record_contract === identity.database_record_contract &&
    inspection.record_contract_version ===
      identity.database_record_contract_version
  );
}

async function commitPreparedDatabasePublication(databaseResult) {
  if (!databaseResult?.publicationControl) return false;
  const control = databaseResult.publicationControl;
  await control.commit();
  databaseResult.publicationControl = null;
  return true;
}

async function rollbackPreparedDatabasePublication(runtime, databaseResult) {
  if (!databaseResult?.publicationControl) return false;
  const control = databaseResult.publicationControl;
  const rollback = await control.rollback();
  databaseResult.publicationControl = null;
  databaseResult.publicationRolledBack = true;
  databaseResult.databaseState = "recovered";
  runtime.databaseState = "recovered";
  runtime.databaseSchemaVersion =
    rollback.inspection?.schema_classification === "current"
      ? "current"
      : "outdated";
  runtime.publishedOperationPending = null;
  return true;
}

function recordPackagedRestartFailure(
  runtime,
  error,
  databaseResult,
  { publicationRolledBack = false } = {},
) {
  if (!databaseResult) return;
  const meaningfulUpdate =
    runtime.recoveryAction !== null ||
    runtime.updateHandoff !== null ||
    runtime.packageIdentityAdoption ||
    databaseResult.databaseState === "migrated" ||
    runtime.databaseStateReconciled;
  if (!meaningfulUpdate) return;
  const restore =
    runtime.recoveryAction === "restore_backup" ||
    runtime.publishedOperationPending?.operation_kind === "restore" ||
    runtime.databaseReconciliationOperation?.operationKind === "restore";
  const protectedBackupVerified = runtimeProtectedBackupVerified(runtime);
  try {
    const event = {
      operation_kind: restore ? "restore" : "update",
      outcome: publicationRolledBack
        ? restore
          ? "restore_failed_preserved_current_state"
          : "update_recovered"
        : "recovery_available",
      reason_code: publicErrorCode(error, "packaged_restart_failed"),
      finished_at: new Date().toISOString(),
      application_version:
        runtime.updateHandoff?.source_application_version ??
        runtime.databaseSourceApplicationVersion,
      target_application_version:
        runtime.runtimeDistribution.applicationVersion,
      target_build_identity: runtime.runtimeDistribution.buildIdentity,
      database_state: publicationRolledBack
        ? "recovered"
        : databaseResult.databaseState,
      protected_backup_id: runtime.protectedRecoveryBackupId,
      protected_backup_identity: runtime.protectedRecoveryBackupIdentity,
      backup_verified: protectedBackupVerified,
      safety_backup_created: databaseResult.safetyBackupCreated === true,
      data_preserved: true,
      next_action: publicationRolledBack
        ? restore
          ? "retry_restore_or_choose_another_verified_backup"
          : "retry_update"
        : protectedBackupVerified
          ? "retry_update_or_restore_verified_backup"
          : "retry_packaged_restart",
    };
    if (publicationRolledBack && runtime.pendingRecoveryActionId !== null) {
      completePendingRecoveryAction({
        backupDirectory: runtime.paths.local.backup_directory,
        expectedActionId: runtime.pendingRecoveryActionId,
        event,
      });
      runtime.pendingRecoveryActionId = null;
      runtime.pendingRecoveryAction = null;
    } else {
      writeRecoveryOperationResult({
        backupDirectory: runtime.paths.local.backup_directory,
        event,
      });
    }
  } catch {
    // A bounded operational-history failure never changes the already
    // verified database publication or its retained recovery backup.
  }
}

function recordFailedRecoveryOperation(runtime, error) {
  const restore = runtime.recoveryAction === "restore_backup";
  const protection = runtimeRecoveryProtection(runtime);
  const protectedBackupVerified = runtimeProtectedBackupVerified(runtime);
  try {
    const event = {
      operation_kind: restore ? "restore" : "update",
      outcome: restore
        ? "restore_failed_preserved_current_state"
        : "update_recovered",
      reason_code: publicErrorCode(
        error,
        restore ? "restore_failed" : "update_failed",
      ),
      finished_at: new Date().toISOString(),
      application_version:
        runtime.updateHandoff?.source_application_version ??
        runtime.databaseSourceApplicationVersion,
      target_application_version:
        runtime.runtimeDistribution.applicationVersion,
      target_build_identity: runtime.runtimeDistribution.buildIdentity,
      database_state: "recovery_required",
      protected_backup_id: runtime.protectedRecoveryBackupId,
      protected_backup_identity: runtime.protectedRecoveryBackupIdentity,
      backup_verified: protectedBackupVerified,
      safety_backup_created: error?.safetyBackupCreated === true,
      data_preserved: true,
      next_action: recoveryNextAction(runtime, protection),
    };
    if (runtime.pendingRecoveryActionId !== null) {
      completePendingRecoveryAction({
        backupDirectory: runtime.paths.local.backup_directory,
        expectedActionId: runtime.pendingRecoveryActionId,
        event,
      });
      runtime.pendingRecoveryActionId = null;
      runtime.pendingRecoveryAction = null;
    } else {
      writeRecoveryOperationResult({
        backupDirectory: runtime.paths.local.backup_directory,
        event,
      });
    }
  } catch {
    // The database remains preserved even when the operational sidecar cannot
    // be updated; the recovery UI reports the sidecar as unavailable.
  }
}

function requestNormalShutdown(runtime, reason) {
  if (runtime.shutdownRequested) return;
  runtime.shutdownRequested = true;
  runtime.shutdownReason = reason;
  runtime.exitCode = 0;
  transitionRuntime(runtime, "stopping");
  runtime.resolveShutdown();
}

function installSignalHandlers(runtime) {
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
    const handler = () => requestNormalShutdown(runtime, `signal_${signal.toLowerCase()}`);
    process.on(signal, handler);
    runtime.signalHandlers.push([signal, handler]);
  }
}

function removeSignalHandlers(runtime) {
  for (const [signal, handler] of runtime.signalHandlers) {
    process.off(signal, handler);
  }
}

async function startControlServer(runtime) {
  const server = createHttpServer((request, response) => {
    const requestUrl = new URL(request.url ?? "/", `http://${LOOPBACK_HOST}`);
    if (request.method === "GET" && requestUrl.pathname === "/v1/identity") {
      respondJson(response, 200, buildControlIdentity(runtime));
      return;
    }
    if (request.method === "POST" && requestUrl.pathname === "/v1/stop") {
      const suppliedToken = singleHeader(request.headers["x-augnes-runtime-token"]);
      const suppliedInstance = singleHeader(request.headers["x-augnes-runtime-instance"]);
      if (
        suppliedInstance !== runtime.instanceId ||
        !constantTimeStringEqual(suppliedToken, runtime.controlToken)
      ) {
        respondJson(response, 403, { accepted: false, reason: "ownership_unverified" });
        return;
      }
      respondJson(response, 202, {
        accepted: true,
        instance_id: runtime.instanceId,
        state: runtime.lifecycleState,
      });
      queueMicrotask(() => requestNormalShutdown(runtime, "stop_requested"));
      return;
    }
    if (requestUrl.pathname === "/v1/recovery") {
      void handleRecoveryControlRequest(
        runtime,
        request,
        response,
        requestUrl,
      );
      return;
    }
    respondJson(response, 404, { error: "not_found" });
  });
  server.keepAliveTimeout = 1_000;
  server.headersTimeout = 2_000;
  const sockets = new Set();
  ownedServerSockets.set(server, sockets);
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.once("close", () => sockets.delete(socket));
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen({ host: LOOPBACK_HOST, port: 0, exclusive: true }, resolve);
  });
  return server;
}

export async function handleRecoveryControlRequest(
  runtime,
  request,
  response,
  requestUrl,
) {
  const suppliedToken = singleHeader(
    request.headers["x-augnes-child-ownership"],
  );
  const suppliedInstance = singleHeader(
    request.headers["x-augnes-runtime-instance"],
  );
  if (
    suppliedInstance !== runtime.instanceId ||
    !constantTimeStringEqual(suppliedToken, runtime.childOwnershipToken)
  ) {
    respondJson(response, 403, {
      accepted: false,
      outcome: "refused",
      reason_code: "ownership_unverified",
      next_action: "retry_from_the_owned_recovery_page",
    });
    return;
  }

  if (request.method === "GET") {
    let backupPage;
    try {
      backupPage = parseRecoveryInventoryPage(requestUrl);
    } catch {
      respondJson(response, 400, { error: "recovery_request_invalid" });
      return;
    }
    respondJson(
      response,
      200,
      buildRecoveryProductStatus(runtime, { backupPage }),
    );
    return;
  }
  if (request.method !== "POST") {
    respondJson(response, 405, { error: "method_not_allowed" });
    return;
  }
  if (requestUrl.search.length > 0) {
    respondJson(response, 400, {
      accepted: false,
      outcome: "refused",
      reason_code: "recovery_request_invalid",
      next_action: "choose_an_available_recovery_action",
    });
    return;
  }
  if (runtime.recoveryRequest !== null || runtime.shutdownRequested) {
    respondJson(response, 409, {
      accepted: false,
      outcome: "refused",
      reason_code: "recovery_action_in_progress",
      next_action: "wait_for_the_current_action",
    });
    return;
  }
  try {
    verifyCurrentPackagedDistribution(runtime);
  } catch (error) {
    respondJson(response, 409, {
      accepted: false,
      outcome: "refused",
      reason_code: publicErrorCode(error, "package_integrity_failed"),
      next_action: "relaunch_a_verified_augnes_package",
    });
    return;
  }

  const recoveryRequest = {
    action: "request_pending",
    requestId: randomUUID(),
  };
  runtime.recoveryRequest = recoveryRequest;
  let retainRecoveryRequest = false;
  try {
  let action;
  try {
    action = await readBoundedRecoveryAction(request);
  } catch {
    respondJson(response, 400, {
      accepted: false,
      outcome: "refused",
      reason_code: "recovery_request_invalid",
      next_action: "choose_an_available_recovery_action",
    });
    return;
  }
  if (
    (action.action === "retry_update" && !runtime.recoveryRetryAvailable) ||
    (action.action === "restore_backup" && !runtime.recoveryRestoreAvailable) ||
    (action.action === "create_backup" &&
      !runtime.recoveryOperationStateAvailable)
  ) {
    respondJson(response, 409, {
      accepted: false,
      outcome: "refused",
      reason_code: "recovery_action_unavailable",
      next_action: "preserve_the_recovery_state_and_relaunch_after_review",
    });
    return;
  }
  if (action.action === "create_backup") {
    recoveryRequest.action = "create_backup";
    try {
      const sourceIdentity = restoreSourcePackageIdentity(runtime);
      if (
        runtime.runtimeDistribution.mode === "packaged" &&
        sourceIdentity === null
      ) {
        throw new PublicRuntimeError("installed_package_identity_missing");
      }
      const targetCompatibility = databaseTargetCompatibility(
        runtime.runtimeDistribution,
        sourceIdentity,
      );
      const protectedBackupIds =
        runtime.protectedRecoveryBackupId === null
          ? []
          : [runtime.protectedRecoveryBackupId];
      const backup = await createRecoveryBackup({
        databasePath: runtime.databasePath,
        backupDirectory: runtime.paths.local.backup_directory,
        applicationScopeFingerprint:
          targetCompatibility.applicationScopeFingerprint,
        sourceApplication: targetCompatibility.sourceApplication,
        reason: "manual_recovery",
        inspectDatabase: inspectRecoveryDatabaseFile,
        protectedBackupIds,
      });
      runtime.protectedRecoveryBackupId = backup.manifest.backup_id;
      runtime.protectedRecoveryBackupIdentity =
        backup.manifest.backup_identity;
      writeRecoveryOperationResult({
        backupDirectory: runtime.paths.local.backup_directory,
        event: {
          operation_kind: "backup",
          outcome: "recovery_backup_created",
          reason_code: "manual_recovery_backup_verified",
          finished_at: new Date().toISOString(),
          application_version:
            targetCompatibility.sourceApplication.application_version,
          target_application_version:
            runtime.runtimeDistribution.applicationVersion,
          target_build_identity: runtime.runtimeDistribution.buildIdentity,
          database_state: runtime.databaseState,
          protected_backup_id: backup.manifest.backup_id,
          protected_backup_identity: backup.manifest.backup_identity,
          backup_verified: true,
          safety_backup_created: false,
          data_preserved: true,
          next_action: "continue_with_current_data",
        },
      });
      respondJson(response, 201, {
        accepted: true,
        outcome: "backup_created",
        next_action: "continue_with_current_data",
      });
    } catch (error) {
      respondJson(response, 409, {
        accepted: false,
        outcome: "refused",
        reason_code: publicErrorCode(
          error,
          "recovery_backup_creation_failed",
        ),
        next_action: "review_the_current_recovery_status",
      });
    }
  } else if (action.action === "restore_backup") {
    let inventory;
    try {
      inventory = runtimeRecoveryInventory(runtime);
    } catch {
      respondJson(response, 409, {
        accepted: false,
        outcome: "refused",
        reason_code: "recovery_backup_inventory_unavailable",
        next_action: "review_the_current_recovery_status",
      });
      return;
    }
    const selectedBackup = inventory.verified.find(
      (backup) => backup.manifest.backup_id === action.backup_id,
    );
    if (!selectedBackup) {
      respondJson(response, 409, {
        accepted: false,
        outcome: "refused",
        reason_code: "recovery_backup_not_found",
        next_action: "choose_a_verified_recovery_backup",
      });
      return;
    }
    let pendingAction;
    try {
      pendingAction = persistRuntimeRecoveryAction(runtime, {
        action: "restore_backup",
        selectedBackupId: action.backup_id,
        selectedBackupIdentity: selectedBackup.manifest.backup_identity,
        selectedBackupDirectoryIdentity:
          selectedBackup.backupDirectoryIdentity,
        selectedBackupStateDirectoryIdentity:
          selectedBackup.stateDirectoryIdentity,
        selectedBackupManifestFileIdentity:
          selectedBackup.manifestFileIdentity,
        selectedBackupPayloadFileIdentity:
          selectedBackup.payloadFileIdentity,
      });
    } catch (error) {
      respondJson(response, 409, {
        accepted: false,
        outcome: "refused",
        reason_code: publicErrorCode(error, "recovery_result_unavailable"),
        next_action: "preserve_the_recovery_state_and_relaunch_after_review",
      });
      return;
    }
    Object.assign(recoveryRequest, {
      action: "restore_backup",
      backupId: action.backup_id,
      backupIdentity: selectedBackup.manifest.backup_identity,
      backupDirectoryIdentity: selectedBackup.backupDirectoryIdentity,
    });
    runtime.pendingRecoveryActionId = pendingAction.action_id;
    requestShutdownAfterResponse(runtime, response);
    retainRecoveryRequest = true;
    respondJson(response, 202, {
      accepted: true,
      outcome: "restore_scheduled",
      next_action: "wait_for_augnes_to_restart",
    });
  } else {
    let reusableBackup = null;
    let pendingAction;
    try {
      if (
        runtime.protectedRecoveryBackupId !== null &&
        runtime.protectedRecoveryBackupIdentity !== null
      ) {
        const protectedBackup = runtimeRecoveryInventory(runtime).verified.find(
          (backup) =>
            backup.manifest.backup_id ===
              runtime.protectedRecoveryBackupId &&
            backup.manifest.backup_identity ===
              runtime.protectedRecoveryBackupIdentity,
        );
        if (!protectedBackup) {
          throw new PublicRuntimeError("recovery_backup_changed");
        }
        reusableBackup =
          protectedBackup.manifest.reason === "pre_update"
            ? protectedBackup
            : null;
      }
      pendingAction = persistRuntimeRecoveryAction(runtime, {
        action: "retry_update",
        selectedBackupId: reusableBackup?.manifest.backup_id ?? null,
        selectedBackupIdentity:
          reusableBackup?.manifest.backup_identity ?? null,
        selectedBackupDirectoryIdentity:
          reusableBackup?.backupDirectoryIdentity ?? null,
        selectedBackupStateDirectoryIdentity:
          reusableBackup?.stateDirectoryIdentity ?? null,
        selectedBackupManifestFileIdentity:
          reusableBackup?.manifestFileIdentity ?? null,
        selectedBackupPayloadFileIdentity:
          reusableBackup?.payloadFileIdentity ?? null,
      });
    } catch (error) {
      respondJson(response, 409, {
        accepted: false,
        outcome: "refused",
        reason_code: publicErrorCode(error, "recovery_result_unavailable"),
        next_action: "preserve_the_recovery_state_and_relaunch_after_review",
      });
      return;
    }
    Object.assign(recoveryRequest, {
      action: "retry_update",
      backupId: reusableBackup?.manifest.backup_id ?? null,
      backupIdentity: reusableBackup?.manifest.backup_identity ?? null,
      backupDirectoryIdentity:
        reusableBackup?.backupDirectoryIdentity ?? null,
    });
    runtime.pendingRecoveryActionId = pendingAction.action_id;
    requestShutdownAfterResponse(runtime, response);
    retainRecoveryRequest = true;
    respondJson(response, 202, {
      accepted: true,
      outcome: "retry_scheduled",
      next_action: "wait_for_augnes_to_restart",
    });
  }
  } finally {
    if (!retainRecoveryRequest && runtime.recoveryRequest === recoveryRequest) {
      runtime.recoveryRequest = null;
    }
  }
}

function persistRuntimeRecoveryAction(
  runtime,
  {
    action,
    selectedBackupId = null,
    selectedBackupIdentity = null,
    selectedBackupDirectoryIdentity = null,
    selectedBackupStateDirectoryIdentity = null,
    selectedBackupManifestFileIdentity = null,
    selectedBackupPayloadFileIdentity = null,
  },
) {
  return writePendingRecoveryAction({
    backupDirectory: runtime.paths.local.backup_directory,
    action: {
      action_id: randomUUID(),
      action,
      accepted_at: new Date().toISOString(),
      application_scope_fingerprint:
        runtime.runtimeDistribution.applicationScopeFingerprint,
      target_application_version:
        runtime.runtimeDistribution.applicationVersion,
      target_build_identity: runtime.runtimeDistribution.buildIdentity,
      target_package_contract: runtime.runtimeDistribution.packageContract,
      target_package_contract_version:
        runtime.runtimeDistribution.packageContractVersion,
      target_runtime_contract: runtime.runtimeDistribution.runtimeContract,
      target_runtime_schema_version:
        runtime.runtimeDistribution.runtimeSchemaVersion,
      requesting_runtime_instance_id: runtime.instanceId,
      requesting_runtime_generation_id: runtime.generationId,
      selected_backup_id: selectedBackupId,
      selected_backup_identity: selectedBackupIdentity,
      selected_backup_directory_identity: selectedBackupDirectoryIdentity,
      selected_backup_state_directory_identity:
        selectedBackupStateDirectoryIdentity,
      selected_backup_manifest_file_identity:
        selectedBackupManifestFileIdentity,
      selected_backup_payload_file_identity:
        selectedBackupPayloadFileIdentity,
    },
  });
}

function pendingRecoveryActionMatchesDistribution(action, distribution) {
  return (
    action.application_scope_fingerprint ===
      distribution.applicationScopeFingerprint &&
    action.target_application_version === distribution.applicationVersion &&
    action.target_build_identity === distribution.buildIdentity &&
    action.target_package_contract === distribution.packageContract &&
    action.target_package_contract_version ===
      distribution.packageContractVersion &&
    action.target_runtime_contract === distribution.runtimeContract &&
    action.target_runtime_schema_version === distribution.runtimeSchemaVersion
  );
}

function restoreSourcePackageIdentity(runtime) {
  try {
    return readRecoveryOperationResults(
      runtime.paths.local.backup_directory,
    ).installed_package;
  } catch {
    return null;
  }
}

function pendingRecoveryActionMatchesRequest(action, request) {
  return (
    action.action === request.action &&
    action.selected_backup_id === request.backupId &&
    action.selected_backup_identity === request.backupIdentity &&
    JSON.stringify(action.selected_backup_directory_identity) ===
      JSON.stringify(request.backupDirectoryIdentity)
  );
}

function clearRuntimePendingRecoveryAction(runtime) {
  if (runtime.pendingRecoveryActionId === null) return false;
  const cleared = clearPendingRecoveryAction({
    backupDirectory: runtime.paths.local.backup_directory,
    expectedActionId: runtime.pendingRecoveryActionId,
  });
  runtime.pendingRecoveryActionId = null;
  runtime.pendingRecoveryAction = null;
  return cleared;
}

function resolveRuntimeReusableRecoveryBackup(runtime) {
  const candidate = runtimeRecoveryInventory(runtime).verified.find(
    (backup) =>
      backup.manifest.backup_id === runtime.recoveryBackupId &&
      backup.manifest.backup_identity === runtime.recoveryBackupIdentity &&
      JSON.stringify(backup.backupDirectoryIdentity) ===
        JSON.stringify(runtime.recoveryBackupDirectoryIdentity) &&
      JSON.stringify(backup.stateDirectoryIdentity) ===
        JSON.stringify(
          runtime.pendingRecoveryAction
            ?.selected_backup_state_directory_identity ?? null,
        ) &&
      JSON.stringify(backup.manifestFileIdentity) ===
        JSON.stringify(
          runtime.pendingRecoveryAction
            ?.selected_backup_manifest_file_identity ?? null,
        ) &&
      JSON.stringify(backup.payloadFileIdentity) ===
        JSON.stringify(
          runtime.pendingRecoveryAction
            ?.selected_backup_payload_file_identity ?? null,
        ),
  );
  if (!candidate || candidate.manifest.reason !== "pre_update") {
    throw new PublicRuntimeError("recovery_backup_changed");
  }
  return {
    backupPath: candidate.backupPath,
    backupId: candidate.manifest.backup_id,
    backupIdentity: candidate.manifest.backup_identity,
    backupDirectoryIdentity: candidate.backupDirectoryIdentity,
    stateDirectoryIdentity: candidate.stateDirectoryIdentity,
    manifestFileIdentity: candidate.manifestFileIdentity,
    payloadFileIdentity: candidate.payloadFileIdentity,
    sourceFamily: null,
  };
}

export function requestShutdownAfterResponse(runtime, response) {
  let completionObserved = false;
  const completeAcceptedAction = () => {
    if (completionObserved) return;
    completionObserved = true;
    response.off("finish", completeAcceptedAction);
    response.off("close", completeAcceptedAction);
    queueMicrotask(() => {
      if (
        runtime.environment?.AUGNES_CANONICAL_TEST_MODE === "1" &&
        runtime.environment?.AUGNES_TEST_HOLD_AFTER_RECOVERY_ACCEPT === "1"
      ) {
        emitResult({
          command: "test",
          result: "recovery_action_durably_accepted",
          state: "recovery_required",
          verified: true,
        });
        return;
      }
      requestNormalShutdown(runtime, "recovery_action_requested");
    });
  };
  response.once("finish", completeAcceptedAction);
  response.once("close", completeAcceptedAction);
}

function buildRecoveryProductStatus(runtime, { backupPage = 1 } = {}) {
  let databaseState = runtime.databaseState;
  let schemaContract = null;
  let schemaClassification = "unavailable";
  let migrationState =
    runtime.databaseSchemaVersion === "current" ? "current" : "unknown";
  try {
    if (existsSync(runtime.databasePath)) {
      const database = inspectRecoverySourceDatabaseFile(runtime.databasePath);
      databaseState = database.schema_classification;
      schemaContract = database.schema_contract;
      schemaClassification = database.schema_classification;
      migrationState =
        database.schema_classification === "current" ? "current" : "update_ready";
    }
  } catch {
    databaseState = "recovery_required";
    migrationState = "incompatible_or_unavailable";
  }
  let inventory = { verified: [], rejected: [] };
  let inventoryState = "available";
  try {
    inventory = runtimeRecoveryInventory(runtime);
  } catch {
    inventoryState = "unavailable";
  }
  const protection = recoveryProtectionDecision({
    inventoryState,
    verifiedBackupCount: inventory.verified.length,
  });
  let latestOperation = null;
  try {
    latestOperation = readRecoveryOperationResults(
      runtime.paths.local.backup_directory,
    ).events[0] ?? null;
  } catch {
    latestOperation = null;
  }
  if (latestOperation !== null) {
    latestOperation = {
      ...latestOperation,
      backup_verified: isProtectedBackupVerified(
        inventory,
        latestOperation.protected_backup_id,
        latestOperation.protected_backup_identity,
      ),
    };
  }
  if (runtime.recoveryMode || databaseState === "recovery_required") {
    const persistedOperation = latestOperation;
    const protectedBackupId =
      runtime.protectedRecoveryBackupId ??
      persistedOperation?.protected_backup_id ??
      null;
    const protectedBackupIdentity =
      runtime.protectedRecoveryBackupIdentity ??
      persistedOperation?.protected_backup_identity ??
      null;
    const publishedDatabaseNeedsRestart =
      runtime.recoveryMode && runtime.publishedOperationPending !== null;
    latestOperation = {
      operation_kind:
        persistedOperation?.operation_kind ??
        (runtime.recoveryAction === "restore_backup" ? "restore" : "update"),
      outcome: publishedDatabaseNeedsRestart
        ? "recovery_available"
        : runtime.recoveryAction === "restore_backup"
          ? "restore_failed_preserved_current_state"
          : "update_recovered",
      reason_code: runtime.failure?.code ?? "recovery_required",
      finished_at: new Date().toISOString(),
      application_version:
        persistedOperation?.application_version ??
        runtime.updateHandoff?.source_application_version ??
        runtime.databaseSourceApplicationVersion ??
        null,
      target_application_version:
        persistedOperation?.target_application_version ??
        runtime.runtimeDistribution.applicationVersion ??
        null,
      target_build_identity:
        persistedOperation?.target_build_identity ??
        runtime.runtimeDistribution.buildIdentity ??
        null,
      database_state: publishedDatabaseNeedsRestart
        ? runtime.databaseState
        : persistedOperation?.database_state ?? databaseState,
      protected_backup_id: protectedBackupId,
      protected_backup_identity: protectedBackupIdentity,
      backup_verified: isProtectedBackupVerified(
        inventory,
        protectedBackupId,
        protectedBackupIdentity,
      ),
      safety_backup_created:
        runtime.safetyBackupCreated ||
        persistedOperation?.safety_backup_created === true,
      data_preserved: true,
      next_action: recoveryNextAction(runtime, protection),
    };
  }
  const paginatedInventory = paginateRecoveryInventory(
    inventory.verified,
    backupPage,
  );
  return {
    contract: "augnes.recovery-product.v1",
    schema_version: 1,
    recovery_mode: runtime.recoveryMode,
    application: {
      version: runtime.runtimeDistribution.applicationVersion ?? "unknown",
      build_identity:
        runtime.runtimeDistribution.buildIdentity ?? "source_runtime",
      compatibility:
        runtime.runtimeDistribution.mode === "packaged"
          ? "verified_package"
          : "source_runtime",
    },
    database: {
      state: databaseState ?? "unknown",
      schema_contract: schemaContract,
      schema_classification: schemaClassification,
      migration_state: migrationState,
    },
    latest_operation: latestOperation,
    backup_inventory_state: inventoryState,
    legacy_backup_count:
      runtime.legacyBackupAdoption.adopted.length +
      runtime.legacyBackupAdoption.already_adopted.length +
      runtime.legacyBackupAdoption.rejected.length,
    legacy_backup_unavailable_count:
      runtime.legacyBackupAdoption.rejected.length,
    backup_count: inventory.verified.length,
    backup_inventory_truncated: paginatedInventory.page_count > 1,
    backup_page: paginatedInventory.page,
    backup_page_count: paginatedInventory.page_count,
    backups: paginatedInventory.items.map((backup) => backup.public),
    actions: {
      create_backup:
        runtime.recoveryOperationStateAvailable &&
        schemaClassification === "current" &&
        runtime.recoveryRequest === null &&
        !runtime.shutdownRequested,
      retry_update: runtime.recoveryRetryAvailable,
      restore_backup:
        runtime.runtimeDistribution.mode === "packaged" &&
        runtime.recoveryRestoreAvailable &&
        protection.restoreAvailable,
    },
  };
}

function parseRecoveryInventoryPage(requestUrl) {
  const entries = [...requestUrl.searchParams.entries()];
  if (entries.length === 0) return 1;
  if (
    entries.length !== 1 ||
    entries[0][0] !== "page" ||
    !/^[1-9]\d{0,2}$/u.test(entries[0][1])
  ) {
    throw new PublicRuntimeError("recovery_request_invalid");
  }
  const page = Number(entries[0][1]);
  if (!Number.isSafeInteger(page) || page > 100) {
    throw new PublicRuntimeError("recovery_request_invalid");
  }
  return page;
}

export function paginateRecoveryInventory(
  verifiedBackups,
  requestedPage,
  pageSize = 100,
) {
  if (
    !Array.isArray(verifiedBackups) ||
    !Number.isSafeInteger(requestedPage) ||
    requestedPage < 1 ||
    requestedPage > 100 ||
    pageSize !== 100
  ) {
    throw new PublicRuntimeError("recovery_request_invalid");
  }
  const pageCount = Math.max(1, Math.ceil(verifiedBackups.length / pageSize));
  const page = Math.min(requestedPage, pageCount);
  const offset = (page - 1) * pageSize;
  return {
    page,
    page_count: pageCount,
    items: verifiedBackups.slice(offset, offset + pageSize),
  };
}

export function recoveryProtectionDecision({
  inventoryState,
  verifiedBackupCount,
}) {
  const restoreAvailable =
    inventoryState === "available" &&
    Number.isSafeInteger(verifiedBackupCount) &&
    verifiedBackupCount > 0;
  return {
    backupVerified: restoreAvailable,
    restoreAvailable,
    nextAction: restoreAvailable
      ? "restore_latest_verified_backup"
      : inventoryState === "unavailable"
        ? "review_recovery_backup_inventory"
        : "retry_update_or_continue_current_data",
  };
}

function runtimeRecoveryProtection(runtime) {
  try {
    const inventory = runtimeRecoveryInventory(runtime);
    return recoveryProtectionDecision({
      inventoryState: "available",
      verifiedBackupCount: inventory.verified.length,
    });
  } catch {
    return recoveryProtectionDecision({
      inventoryState: "unavailable",
      verifiedBackupCount: 0,
    });
  }
}

function recoveryNextAction(runtime, protection) {
  if (!runtime.recoveryRetryAvailable && !runtime.recoveryRestoreAvailable) {
    return "relaunch_a_compatible_verified_package";
  }
  if (!runtime.recoveryRetryAvailable && protection.restoreAvailable) {
    return "restore_a_verified_recovery_backup";
  }
  if (!runtime.recoveryRetryAvailable) {
    return "preserve_current_data_and_relaunch_a_compatible_verified_package";
  }
  return protection.nextAction;
}

function runtimeProtectedBackupVerified(runtime) {
  try {
    return isProtectedBackupVerified(
      runtimeRecoveryInventory(runtime),
      runtime.protectedRecoveryBackupId,
      runtime.protectedRecoveryBackupIdentity,
    );
  } catch {
    return false;
  }
}

function isProtectedBackupVerified(inventory, backupId, backupIdentity) {
  if (
    typeof backupId !== "string" ||
    typeof backupIdentity !== "string" ||
    !Array.isArray(inventory?.verified)
  ) {
    return false;
  }
  return inventory.verified.some(
    (backup) =>
      backup.manifest.backup_id === backupId &&
      backup.manifest.backup_identity === backupIdentity,
  );
}

function runtimeRecoveryInventory(runtime) {
  return listRecoveryBackups({
    backupDirectory: runtime.paths.local.backup_directory,
    applicationScopeFingerprint: runtime.repositoryFingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
  });
}

function verifyCurrentPackagedDistribution(runtime) {
  if (runtime.runtimeDistribution.mode !== "packaged") return;
  const preflight = preflightDistributablePackage({
    packageRoot: repositoryRoot,
    // The launcher already loaded and retained the verified native module for
    // this in-memory supervisor bundle. Recheck every package file here before
    // durable work without resolving mutable native JavaScript a second time.
    validateNativeDependency: false,
  });
  if (
    preflight.manifest.build_identity !==
      runtime.runtimeDistribution.buildIdentity ||
    preflight.manifest.application_version !==
      runtime.runtimeDistribution.applicationVersion ||
    preflight.manifest.application_scope_fingerprint !==
      runtime.runtimeDistribution.applicationScopeFingerprint ||
    preflight.manifest.runtime.runtime_contract !==
      runtime.runtimeDistribution.runtimeContract ||
    preflight.manifest.runtime.runtime_schema_version !==
      runtime.runtimeDistribution.runtimeSchemaVersion
  ) {
    throw new PublicRuntimeError("package_integrity_failed");
  }
}

async function readBoundedRecoveryAction(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 4_096) throw new Error("request too large");
    chunks.push(chunk);
  }
  const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (!isObject(value)) throw new Error("request invalid");
  const keys = Object.keys(value).sort();
  if (
    value.action === "create_backup" &&
    JSON.stringify(keys) === '["action"]'
  ) {
    return { action: "create_backup", backup_id: null };
  }
  if (value.action === "retry_update" && JSON.stringify(keys) === '["action"]') {
    return { action: "retry_update", backup_id: null };
  }
  if (
    value.action === "restore_backup" &&
    JSON.stringify(keys) === '["action","backup_id"]' &&
    /^recovery:[0-9a-f-]{36}$/iu.test(value.backup_id ?? "")
  ) {
    return { action: "restore_backup", backup_id: value.backup_id };
  }
  throw new Error("request invalid");
}

async function cleanupOwnedRuntime(runtime) {
  const records = [...runtime.children.values()];
  for (const record of records) {
    record.expectedExit = true;
    if (record.state !== "stopped") record.state = "stopping";
  }
  if (runtime.manifestCreated) writeRuntimeManifestBestEffort(runtime);

  const results = await Promise.allSettled(
    records.reverse().map((record) => stopOwnedChild(record)),
  );
  const childCleanupFailed = results.some((result) => result.status === "rejected");

  if (runtime.controlServer) {
    await closeServer(runtime.controlServer);
  }

  if (ownsLock(runtime.paths.lock, runtime)) {
    removeOwnedGenerationJson(runtime.paths.manifest, runtime);
    removeOwnedGenerationJson(runtime.paths.token, runtime);
    removeRegularFile(runtime.paths.bridgeEnvironment);
    removeOwnedGenerationJson(runtime.paths.lock, runtime);
    removeDirectoryIfEmpty(runtime.paths.directory);
  }

  if (childCleanupFailed) {
    throw new PublicRuntimeError("owned_child_cleanup_failed");
  }
}

async function stopOwnedChild(record) {
  if (!record.pid) return;
  record.expectedExit = true;
  if (!isOwnedProcessTreeAlive(record)) return;
  if (
    record.exit &&
    (await waitForProcessTreeExit(record, EXITED_CHILD_DRAIN_MS))
  ) {
    return;
  }

  await signalOwnedProcessTree(record, "SIGTERM");
  if (await waitForProcessTreeExit(record, GRACEFUL_CHILD_STOP_MS)) return;

  await signalOwnedProcessTree(record, "SIGKILL");
  if (await waitForProcessTreeExit(record, FORCED_CHILD_STOP_MS)) return;
  throw new PublicRuntimeError("owned_child_stop_timeout");
}

async function signalOwnedProcessTree(record, signal) {
  try {
    if (process.platform === "win32") {
      const args = ["/PID", String(record.pid), "/T"];
      if (signal === "SIGKILL") args.push("/F");
      const result = spawnSync("taskkill", args, {
        stdio: "ignore",
        timeout: 3_000,
        windowsHide: true,
      });
      if (result.error || result.status !== 0) {
        if (await waitForProcessTreeExit(record, EXITED_CHILD_DRAIN_MS)) return;
        throw new PublicRuntimeError("owned_child_signal_failed");
      }
    } else {
      process.kill(-record.pid, signal);
    }
  } catch (error) {
    if (error?.code === "ESRCH") return;
    if (
      error?.code === "EPERM" &&
      (await waitForProcessTreeExit(record, EXITED_CHILD_DRAIN_MS))
    ) {
      return;
    }
    throw new PublicRuntimeError("owned_child_signal_failed");
  }
}

function isOwnedProcessTreeAlive(record) {
  try {
    process.kill(process.platform === "win32" ? record.pid : -record.pid, 0);
    return true;
  } catch (error) {
    if (error?.code === "EPERM") return true;
    if (error?.code === "ESRCH") return false;
    return false;
  }
}

async function waitForProcessTreeExit(record, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!isOwnedProcessTreeAlive(record)) return true;
    await delay(50);
  }
  return !isOwnedProcessTreeAlive(record);
}

function transitionRuntime(runtime, state, failure = runtime.failure) {
  runtime.lifecycleState = state;
  runtime.failure = failure ?? null;
  runtime.lastTransitionAt = new Date().toISOString();
  if (runtime.manifestCreated) writeRuntimeManifest(runtime);
}

function writeRuntimeManifest(runtime) {
  atomicWriteJson(runtime.paths.manifest, buildManifest(runtime));
}

function writeRuntimeManifestBestEffort(runtime) {
  try {
    writeRuntimeManifest(runtime);
  } catch {
    // Cleanup still uses the in-memory ownership record and exclusive lock.
  }
}

function buildManifest(runtime) {
  return {
    schema_version: RUNTIME_SCHEMA_VERSION,
    contract: RUNTIME_CONTRACT,
    generation_version: RUNTIME_GENERATION_VERSION,
    generation_id: runtime.generationId,
    instance_id: runtime.instanceId,
    repository_fingerprint: runtime.repositoryFingerprint,
    supervisor_pid: runtime.supervisorPid,
    control_host: LOOPBACK_HOST,
    control_port: runtime.controlPort,
    children: manifestChildren(runtime),
    effective_url: runtime.effectiveUrl,
    ui_port: runtime.uiPort,
    bridge_port: runtime.bridgePort,
    database_state: runtime.databaseState,
    database_schema_version: runtime.databaseSchemaVersion,
    recovery_backup_created: runtime.recoveryBackupCreated,
    reconciliation_performed: runtime.reconciliationPerformed,
    database_state_reconciled: runtime.databaseStateReconciled,
    recovery_backup_preserved: runtime.recoveryBackupPreserved,
    lifecycle_state: runtime.lifecycleState,
    started_at: runtime.startedAt,
    last_transition_at: runtime.lastTransitionAt,
    failure: runtime.failure,
  };
}

function buildControlIdentity(runtime) {
  return {
    schema_version: RUNTIME_SCHEMA_VERSION,
    contract: RUNTIME_CONTRACT,
    generation_version: RUNTIME_GENERATION_VERSION,
    generation_id: runtime.generationId,
    instance_id: runtime.instanceId,
    repository_fingerprint: runtime.repositoryFingerprint,
    supervisor_pid: runtime.supervisorPid,
    lifecycle_state: runtime.lifecycleState,
    effective_url: runtime.effectiveUrl,
    ui_port: runtime.uiPort,
    bridge_port: runtime.bridgePort,
    database_state: runtime.databaseState,
    database_schema_version: runtime.databaseSchemaVersion,
    recovery_backup_created: runtime.recoveryBackupCreated,
    ...publicRuntimeDiagnostics(runtime.runtimeDistribution, {
      databaseSchemaCompatibility: runtime.databaseSchemaVersion,
    }),
    database_schema_contract:
      runtime.runtimeDistribution.databaseSchemaContract ?? null,
    database_schema_signature:
      runtime.runtimeDistribution.databaseSchemaSignature ?? null,
    database_migration_contract:
      runtime.runtimeDistribution.databaseMigrationContract ?? null,
    database_migration_contract_version:
      runtime.runtimeDistribution.databaseMigrationContractVersion ?? null,
    database_migration_ids:
      runtime.runtimeDistribution.databaseMigrationIds ?? null,
    database_record_contract:
      runtime.runtimeDistribution.databaseRecordContract ?? null,
    database_record_contract_version:
      runtime.runtimeDistribution.databaseRecordContractVersion ?? null,
    database_reader_contracts:
      runtime.runtimeDistribution.databaseReaderContracts ?? null,
    children: publicChildren(runtime),
    started_at: runtime.startedAt,
    last_transition_at: runtime.lastTransitionAt,
    failure: runtime.failure,
  };
}

function publicChildren(runtime) {
  return [...runtime.children.values()]
    .filter((record) => Number.isInteger(record.pid) && record.pid > 0)
    .map((record) => ({
      role: record.role,
      pid: record.pid,
      port: record.port,
      state: record.state,
    }))
    .sort((left, right) => left.role.localeCompare(right.role));
}

function manifestChildren(runtime) {
  return [...runtime.children.values()]
    .filter((record) => Number.isInteger(record.pid) && record.pid > 0)
    .map((record) => ({
      role: record.role,
      pid: record.pid,
      port: record.port,
      ownership_port: record.ownershipPort,
      state: record.state,
    }))
    .sort((left, right) => left.role.localeCompare(right.role));
}

function publicStatusResult(command, result, identity) {
  return {
    command,
    result,
    state: identity.lifecycle_state,
    verified: true,
    instance_id: identity.instance_id,
    supervisor_pid: identity.supervisor_pid,
    effective_url: identity.effective_url,
    ui_port: identity.ui_port,
    bridge_port: identity.bridge_port,
    database_state: identity.database_state ?? null,
    database_schema_version: identity.database_schema_version ?? null,
    recovery_backup_created: identity.recovery_backup_created === true,
    distribution_mode: identity.distribution_mode ?? null,
    application_version: identity.application_version ?? null,
    package_contract: identity.package_contract ?? null,
    package_contract_version: identity.package_contract_version ?? null,
    build_identity: identity.build_identity ?? null,
    package_platform: identity.package_platform ?? null,
    runtime_contract: identity.runtime_contract ?? RUNTIME_CONTRACT,
    runtime_schema_version:
      identity.runtime_schema_version ?? RUNTIME_SCHEMA_VERSION,
    database_schema_compatibility:
      identity.database_schema_compatibility ??
      identity.database_schema_version ??
      null,
    children: Array.isArray(identity.children) ? identity.children : [],
    started_at: identity.started_at,
    last_transition_at: identity.last_transition_at,
    failure: identity.failure ?? null,
  };
}

function readOwnedToken(tokenPath, instanceId, generationId = null) {
  const value = readJsonRegularFile(tokenPath);
  if (
    !isObject(value) ||
    value.schema_version !== RUNTIME_SCHEMA_VERSION ||
    value.contract !== RUNTIME_CONTRACT ||
    value.instance_id !== instanceId ||
    (generationId !== null && value.generation_id !== generationId) ||
    typeof value.token !== "string" ||
    value.token.length < 32
  ) {
    return null;
  }
  return value;
}

function readJsonRegularFile(filePath) {
  try {
    const stats = lstatSync(filePath);
    if (!stats.isFile() || stats.isSymbolicLink()) return undefined;
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    return undefined;
  }
}

async function waitForVerifiedOwner({ paths, repositoryFingerprint }) {
  const deadline = Date.now() + OWNERSHIP_RACE_WAIT_MS;
  while (Date.now() < deadline) {
    const status = await readVerifiedRuntimeStatus({ paths, repositoryFingerprint });
    if (status.verified) return status;
    await delay(75);
  }
  return null;
}

export function classifyRuntimeUpdate(existingIdentity, targetDistribution) {
  if (targetDistribution.mode !== "packaged") {
    return { outcome: "no_update_required" };
  }
  const packageContractVersionCompatible =
    existingIdentity.package_contract_version ===
      targetDistribution.packageContractVersion ||
    (existingIdentity.package_contract_version === 1 &&
      targetDistribution.packageContractVersion === 2);
  if (
    existingIdentity.package_contract !== targetDistribution.packageContract ||
    !packageContractVersionCompatible ||
    existingIdentity.runtime_contract !== targetDistribution.runtimeContract ||
    existingIdentity.runtime_schema_version !==
      targetDistribution.runtimeSchemaVersion
  ) {
    return { outcome: "incompatible_package" };
  }
  const optionalCompatibilityPairs = [
    [
      existingIdentity.application_scope_fingerprint,
      targetDistribution.applicationScopeFingerprint,
    ],
    [existingIdentity.package_platform, targetDistribution.packagePlatform],
    [existingIdentity.database_schema_contract, targetDistribution.databaseSchemaContract],
    [existingIdentity.database_migration_contract, targetDistribution.databaseMigrationContract],
    [
      existingIdentity.database_migration_contract_version,
      targetDistribution.databaseMigrationContractVersion,
    ],
    [existingIdentity.database_record_contract, targetDistribution.databaseRecordContract],
    [
      existingIdentity.database_record_contract_version,
      targetDistribution.databaseRecordContractVersion,
    ],
  ];
  if (
    optionalCompatibilityPairs.some(
      ([existingValue, targetValue]) =>
        existingValue !== null &&
        existingValue !== undefined &&
        existingValue !== targetValue,
    ) ||
    (Array.isArray(existingIdentity.database_migration_ids) &&
      !isOrderedPrefix(
        existingIdentity.database_migration_ids,
        targetDistribution.databaseMigrationIds,
      ))
  ) {
    return { outcome: "incompatible_package" };
  }
  if (existingIdentity.build_identity === targetDistribution.buildIdentity) {
    return { outcome: "no_update_required" };
  }
  const versionOrder = compareApplicationVersions(
    existingIdentity.application_version,
    targetDistribution.applicationVersion,
  );
  if (versionOrder === null) return { outcome: "incompatible_package" };
  if (versionOrder > 0) return { outcome: "unsupported_downgrade" };
  if (versionOrder === 0) return { outcome: "incompatible_package" };
  return {
    outcome: "update_ready",
    source_application_version: existingIdentity.application_version,
    source_build_identity: existingIdentity.build_identity,
    package_contract: existingIdentity.package_contract,
    package_contract_version: existingIdentity.package_contract_version,
    runtime_contract: existingIdentity.runtime_contract,
    runtime_schema_version: existingIdentity.runtime_schema_version,
    target_application_version: targetDistribution.applicationVersion,
    target_build_identity: targetDistribution.buildIdentity,
  };
}

function isOrderedPrefix(existingValues, targetValues) {
  return (
    Array.isArray(existingValues) &&
    Array.isArray(targetValues) &&
    existingValues.length <= targetValues.length &&
    existingValues.every((value, index) => targetValues[index] === value)
  );
}

async function stopVerifiedRuntimeForUpdate({ paths, existing }) {
  const tokenRecord = readOwnedToken(
    paths.token,
    existing.identity.instance_id,
    existing.identity.generation_id,
  );
  if (!tokenRecord) throw new PublicRuntimeError("update_ownership_conflict");
  const response = await requestControlJson({
    port: existing.manifest.control_port,
    path: "/v1/stop",
    method: "POST",
    headers: {
      "x-augnes-runtime-token": tokenRecord.token,
      "x-augnes-runtime-instance": existing.identity.instance_id,
    },
  });
  if (response.statusCode !== 202 || response.body?.accepted !== true) {
    throw new PublicRuntimeError("update_ownership_conflict");
  }
  const deadline = Date.now() + STOP_COMMAND_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (
      !existsSync(paths.manifest) &&
      !isProcessAlive(existing.identity.supervisor_pid)
    ) {
      return;
    }
    await delay(100);
  }
  throw new PublicRuntimeError("update_handoff_timeout");
}

function compareApplicationVersions(left, right) {
  const leftVersion = exactApplicationVersion(left);
  const rightVersion = exactApplicationVersion(right);
  if (!leftVersion || !rightVersion) return null;
  for (let index = 0; index < 3; index += 1) {
    if (leftVersion.core[index] > rightVersion.core[index]) return 1;
    if (leftVersion.core[index] < rightVersion.core[index]) return -1;
  }
  if (leftVersion.prerelease === null && rightVersion.prerelease === null) return 0;
  if (leftVersion.prerelease === null) return 1;
  if (rightVersion.prerelease === null) return -1;
  const length = Math.max(
    leftVersion.prerelease.length,
    rightVersion.prerelease.length,
  );
  for (let index = 0; index < length; index += 1) {
    const leftIdentifier = leftVersion.prerelease[index];
    const rightIdentifier = rightVersion.prerelease[index];
    if (leftIdentifier === undefined) return -1;
    if (rightIdentifier === undefined) return 1;
    if (leftIdentifier.numeric && rightIdentifier.numeric) {
      if (leftIdentifier.value > rightIdentifier.value) return 1;
      if (leftIdentifier.value < rightIdentifier.value) return -1;
      continue;
    }
    if (leftIdentifier.numeric !== rightIdentifier.numeric) {
      return leftIdentifier.numeric ? -1 : 1;
    }
    if (leftIdentifier.value !== rightIdentifier.value) {
      return leftIdentifier.value > rightIdentifier.value ? 1 : -1;
    }
  }
  return 0;
}

function exactApplicationVersion(value) {
  if (typeof value !== "string") return null;
  const match = value.match(
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/u,
  );
  if (!match) return null;
  const prereleaseIdentifiers = match[4] ? match[4].split(".") : null;
  if (
    prereleaseIdentifiers?.some(
      (identifier) =>
        /^\d+$/u.test(identifier) &&
        identifier.length > 1 &&
        identifier.startsWith("0"),
    )
  ) {
    return null;
  }
  const prerelease = prereleaseIdentifiers
    ? prereleaseIdentifiers.map((identifier) => {
        const numeric = /^\d+$/u.test(identifier);
        return {
          numeric,
          value: numeric ? BigInt(identifier) : identifier,
        };
      })
    : null;
  return {
    core: [BigInt(match[1]), BigInt(match[2]), BigInt(match[3])],
    prerelease,
  };
}

async function reconcileRuntimeOwnership({
  paths,
  repositoryFingerprint,
  databaseReconciliation = null,
  recoveryJournalOwner = null,
  completeRecoveryAction = null,
}) {
  databaseReconciliation ??= await inspectDatabaseReconciliation({
    databasePath: paths.local.database_path,
    backupDirectory: paths.local.backup_directory,
    repositoryFingerprint,
    recoveryOwner: recoveryJournalOwner,
  });
  let classified = await classifyRuntimeState({ paths, repositoryFingerprint });
  if (classified.state === "verified_live") {
    return {
      performed: false,
      orphanChildrenStopped: 0,
      databaseStateReconciled: false,
      recoveryBackupPreserved: false,
      existing: {
        verified: true,
        manifest: classified.manifest,
        identity: classified.identity,
      },
    };
  }
  if (
    classified.state === "clean" &&
    databaseReconciliation.state === "clean"
  ) {
    return {
      performed: false,
      orphanChildrenStopped: 0,
      databaseStateReconciled: false,
      recoveryBackupPreserved: false,
    };
  }
  if (classified.state === "reconciliation_in_progress") {
    classified = await waitForRuntimeReconciliation({
      paths,
      repositoryFingerprint,
    });
    if (classified.state === "verified_live") {
      return {
        performed: false,
        orphanChildrenStopped: 0,
        databaseStateReconciled: false,
        recoveryBackupPreserved: false,
        existing: {
          verified: true,
          manifest: classified.manifest,
          identity: classified.identity,
        },
      };
    }
  }
  if (classified.state === "stale_reconciliation_lease") {
    await reclaimStaleRuntimeReconciliationLease({
      paths,
      repositoryFingerprint,
      classified,
    });
    classified = await classifyRuntimeState({ paths, repositoryFingerprint });
  }
  if (classified.state !== "clean" && !classified.recoverable) {
    throw new PublicRuntimeReconciliationError(
      classified.reason ?? "runtime_ownership_unverifiable",
    );
  }

  let lease;
  try {
    lease = await acquireRuntimeReconciliationLease({
      paths,
      repositoryFingerprint,
    });
  } catch (error) {
    if (error?.code !== "runtime_reconciliation_in_progress") throw error;
    const afterWait = await waitForRuntimeReconciliation({
      paths,
      repositoryFingerprint,
    });
    if (afterWait.state === "verified_live") {
      return {
        performed: false,
        orphanChildrenStopped: 0,
        databaseStateReconciled: false,
        recoveryBackupPreserved: false,
        existing: {
          verified: true,
          manifest: afterWait.manifest,
          identity: afterWait.identity,
        },
      };
    }
    const databaseAfterWait = await inspectDatabaseReconciliation({
      databasePath: paths.local.database_path,
      backupDirectory: paths.local.backup_directory,
      repositoryFingerprint,
      recoveryOwner: recoveryJournalOwner,
    });
    if (
      afterWait.state === "clean" &&
      databaseAfterWait.state === "clean"
    ) {
      return {
        performed: false,
        orphanChildrenStopped: 0,
        databaseStateReconciled: false,
        recoveryBackupPreserved: false,
      };
    }
    throw new PublicRuntimeReconciliationError(
      afterWait.reason ?? "runtime_reconciliation_in_progress",
    );
  }

  try {
    const owned = await classifyRuntimeState({
      paths,
      repositoryFingerprint,
      ownedLease: lease,
    });
    if (owned.state === "verified_live") {
      return {
        performed: false,
        orphanChildrenStopped: 0,
        databaseStateReconciled: false,
        recoveryBackupPreserved: false,
        existing: {
          verified: true,
          manifest: owned.manifest,
          identity: owned.identity,
        },
      };
    }
    if (owned.state !== "clean" && !owned.recoverable) {
      throw new PublicRuntimeReconciliationError(
        owned.reason ?? "runtime_ownership_unverifiable",
      );
    }
    let orphanChildrenStopped = 0;
    let runtimeStateReconciled = false;
    if (owned.state !== "clean") {
      orphanChildrenStopped = await stopVerifiedOrphanChildren(owned);
      cleanupRuntimeOwnershipBundle({ paths, classified: owned });
      runtimeStateReconciled = true;
    }
    const currentDatabaseReconciliation = await inspectDatabaseReconciliation({
      databasePath: paths.local.database_path,
      backupDirectory: paths.local.backup_directory,
      repositoryFingerprint,
      recoveryOwner: recoveryJournalOwner,
    });
    let databaseResult = {
      databaseStateReconciled: false,
      recoveryBackupPreserved: false,
    };
    if (currentDatabaseReconciliation.state === "recoverable") {
      databaseResult = await reconcileInterruptedDatabaseBootstrap({
        databasePath: paths.local.database_path,
        backupDirectory: paths.local.backup_directory,
        repositoryFingerprint,
        reconciliationLeaseOwned: true,
        recoveryOwner: recoveryJournalOwner,
        completeRecoveryAction,
      });
    } else if (currentDatabaseReconciliation.state !== "clean") {
      throw new PublicRuntimeError(
        currentDatabaseReconciliation.reason ??
          "database_reconciliation_required",
      );
    }
    return {
      performed:
        runtimeStateReconciled || databaseResult.databaseStateReconciled,
      orphanChildrenStopped,
      databaseStateReconciled: databaseResult.databaseStateReconciled,
      recoveryBackupPreserved: databaseResult.recoveryBackupPreserved,
      result: databaseResult.result ?? null,
      reusableRecoveryBackup:
        databaseResult.reusableRecoveryBackup ?? null,
      reconciliationOperation:
        databaseResult.reconciliationOperation ?? null,
    };
  } finally {
    await releaseRuntimeReconciliationLease({ paths, lease });
  }
}

async function waitForRuntimeReconciliation({ paths, repositoryFingerprint }) {
  const deadline = Date.now() + OWNERSHIP_RACE_WAIT_MS;
  let classified;
  while (Date.now() < deadline) {
    classified = await classifyRuntimeState({ paths, repositoryFingerprint });
    if (
      classified.state === "verified_live" ||
      classified.state === "clean"
    ) {
      return classified;
    }
    if (classified.state !== "reconciliation_in_progress") return classified;
    await delay(75);
  }
  return (
    classified ??
    (await classifyRuntimeState({ paths, repositoryFingerprint }))
  );
}

export function ensureRuntimeDirectory({
  directory,
  repositoryRoot: repositoryRootPath = repositoryRoot,
}) {
  return ensureApplicationDirectory({
    directory,
    repositoryRoot: repositoryRootPath,
    insideRepositoryCode: "runtime_state_path_must_be_outside_repository",
    invalidCode: "runtime_state_directory_invalid",
  });
}

function createExclusiveJson(filePath, value) {
  const descriptor = openSync(filePath, "wx", 0o600);
  try {
    writeFileSync(descriptor, `${JSON.stringify(value)}\n`, "utf8");
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
  try {
    chmodSync(filePath, 0o600);
  } catch {
    // Windows does not implement POSIX mode semantics.
  }
  fsyncDirectoryBestEffort(path.dirname(filePath));
}

function atomicWriteJson(filePath, value) {
  atomicWriteText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function atomicWriteText(filePath, value) {
  const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  let descriptor = null;
  try {
    descriptor = openSync(temporaryPath, "wx", 0o600);
    writeFileSync(descriptor, value, "utf8");
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = null;
    renameSync(temporaryPath, filePath);
    try {
      chmodSync(filePath, 0o600);
    } catch {
      // Windows does not implement POSIX mode semantics.
    }
    fsyncDirectoryBestEffort(path.dirname(filePath));
  } finally {
    if (descriptor !== null) closeSync(descriptor);
    if (existsSync(temporaryPath)) removeRegularFile(temporaryPath);
  }
}

function ownsLock(lockPath, runtime) {
  const value = readJsonRegularFile(lockPath);
  return (
    isObject(value) &&
    value.schema_version === RUNTIME_SCHEMA_VERSION &&
    value.contract === RUNTIME_CONTRACT &&
    value.generation_version === RUNTIME_GENERATION_VERSION &&
    value.generation_id === runtime.generationId &&
    value.instance_id === runtime.instanceId &&
    value.repository_fingerprint === runtime.repositoryFingerprint
  );
}

function removeOwnedGenerationJson(filePath, runtime) {
  const value = readJsonRegularFile(filePath);
  if (
    isObject(value) &&
    value.schema_version === RUNTIME_SCHEMA_VERSION &&
    value.contract === RUNTIME_CONTRACT &&
    value.generation_version === RUNTIME_GENERATION_VERSION &&
    value.generation_id === runtime.generationId &&
    value.instance_id === runtime.instanceId &&
    value.repository_fingerprint === runtime.repositoryFingerprint
  ) {
    removeRegularFile(filePath);
  }
}

function removeRegularFile(filePath) {
  try {
    const stats = lstatSync(filePath);
    if (stats.isFile() && !stats.isSymbolicLink()) unlinkSync(filePath);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

function removeDirectoryIfEmpty(directory) {
  try {
    rmdirSync(directory);
  } catch (error) {
    if (!["ENOENT", "ENOTEMPTY", "EEXIST"].includes(error?.code)) throw error;
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

function requestJsonUrl(rawUrl, timeoutMs) {
  const url = new URL(rawUrl);
  if (url.hostname !== LOOPBACK_HOST) {
    throw new PublicRuntimeError("non_loopback_readiness_url_refused");
  }
  return requestControlJson({
    port: Number(url.port),
    path: `${url.pathname}${url.search}`,
    method: "GET",
    timeoutMs,
  });
}

function requestControlJson({
  port,
  path: requestPath,
  method,
  headers = {},
  timeoutMs = OWNERSHIP_REQUEST_TIMEOUT_MS,
}) {
  return new Promise((resolve, reject) => {
    const request = httpRequest(
      {
        host: LOOPBACK_HOST,
        port,
        path: requestPath,
        method,
        headers,
        agent: false,
      },
      (response) => {
        response.setEncoding("utf8");
        let body = "";
        response.on("data", (chunk) => {
          body += chunk;
          if (body.length > MAX_CONTROL_RESPONSE_BYTES) {
            request.destroy(new Error("control response exceeded limit"));
          }
        });
        response.on("end", () => {
          try {
            resolve({
              statusCode: response.statusCode ?? 0,
              body: body.length > 0 ? JSON.parse(body) : null,
            });
          } catch (error) {
            reject(error);
          }
        });
      },
    );
    request.setTimeout(timeoutMs, () => request.destroy(new Error("request timed out")));
    request.once("error", reject);
    request.end();
  });
}

async function closeServer(server) {
  const sockets = ownedServerSockets.get(server) ?? new Set();
  for (const socket of sockets) socket.destroy();
  server.closeAllConnections?.();
  server.closeIdleConnections?.();
  if (!server.listening) return;

  let settled = false;
  let closeError = null;
  const closed = new Promise((resolve) => {
    server.close((error) => {
      settled = true;
      closeError = error ?? null;
      resolve();
    });
  });
  const finished = await Promise.race([
    closed.then(() => true),
    delay(SERVER_CLOSE_TIMEOUT_MS).then(() => false),
  ]);
  if (!finished) {
    for (const socket of sockets) socket.destroy();
    server.closeAllConnections?.();
    server.closeIdleConnections?.();
    await Promise.race([closed, delay(250)]);
  }
  if (!settled || server.listening) {
    throw new PublicRuntimeError("control_server_close_timeout");
  }
  if (closeError) throw closeError;
}

function respondJson(response, statusCode, value) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(value));
}

function parseCli(argv, environment) {
  const args = [...argv];
  let command = "start";
  if (["start", "status", "stop", "diagnostics"].includes(args[0])) {
    command = args.shift();
  } else if (args[0] && !args[0].startsWith("-")) {
    throw new PublicRuntimeError("unknown_subcommand");
  }

  let uiPreferredPort = parsePreferredPort(
    nonEmptyString(environment.AUGNES_UI_PREFERRED_PORT),
    DEFAULT_UI_PORT,
    "ui_port_invalid",
  );
  let bridgePreferredPort = parsePreferredPort(
    nonEmptyString(environment.AUGNES_BRIDGE_PREFERRED_PORT),
    DEFAULT_BRIDGE_PORT,
    "bridge_port_invalid",
  );
  const uiNextArguments = [];

  while (args.length > 0) {
    const argument = args.shift();
    if (command !== "start") throw new PublicRuntimeError("unexpected_arguments");
    if (["--port", "--ui-port", "-p"].includes(argument)) {
      uiPreferredPort = parsePreferredPort(args.shift(), null, "ui_port_invalid");
      continue;
    }
    if (argument === "--bridge-port") {
      bridgePreferredPort = parsePreferredPort(args.shift(), null, "bridge_port_invalid");
      continue;
    }
    if (argument === "--webpack") {
      if (!uiNextArguments.includes("--webpack")) uiNextArguments.push("--webpack");
      continue;
    }
    if (argument === "--hostname") {
      if (args.shift() !== LOOPBACK_HOST) {
        throw new PublicRuntimeError("non_loopback_hostname_refused");
      }
      continue;
    }
    throw new PublicRuntimeError("unknown_option");
  }

  return { command, uiPreferredPort, bridgePreferredPort, uiNextArguments };
}

function parsePreferredPort(value, fallback, errorCode) {
  if (value === undefined || value === null || value === "") {
    if (fallback !== null) return fallback;
    throw new PublicRuntimeError(errorCode);
  }
  if (!/^\d+$/.test(String(value))) throw new PublicRuntimeError(errorCode);
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1_024 || port > 65_535 - PORT_SEARCH_SIZE) {
    throw new PublicRuntimeError(errorCode);
  }
  return port;
}

function sourceRuntimeDistribution(repositoryRootPath) {
  return Object.freeze({
    mode: "source",
    applicationVersion: readSourceApplicationVersion(repositoryRootPath),
    packageContract: null,
    packageContractVersion: null,
    buildIdentity: null,
    applicationScopeFingerprint: fingerprint(realpathSync(repositoryRootPath)),
    packagePlatform: null,
    runtimeContract: RUNTIME_CONTRACT,
    runtimeSchemaVersion: RUNTIME_SCHEMA_VERSION,
    databaseSchemaCompatibility: null,
    databaseSchemaContract: null,
    databaseSchemaSignature: null,
    databaseMigrationContract: null,
    databaseMigrationContractVersion: null,
    databaseMigrationIds: null,
    databaseRecordContract: null,
    databaseRecordContractVersion: null,
    databaseReaderContracts: null,
    uiServer: null,
    uiWorkingDirectory: repositoryRootPath,
    bridgeServer: null,
    bridgeWorkingDirectory: path.join(repositoryRootPath, "apps", "augnes_apps"),
  });
}

function readSourceApplicationVersion(repositoryRootPath) {
  try {
    const value = JSON.parse(
      readFileSync(path.join(repositoryRootPath, "package.json"), "utf8"),
    );
    return validDiagnosticString(value?.version) ? value.version : null;
  } catch {
    return null;
  }
}

function readPackageManifest(manifestPath) {
  try {
    const stats = lstatSync(manifestPath);
    if (!stats.isFile() || stats.isSymbolicLink() || stats.size > 16 * 1024 * 1024) {
      throw new PublicRuntimeError("package_manifest_invalid");
    }
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    if (!isObject(manifest)) {
      throw new PublicRuntimeError("package_manifest_invalid");
    }
    return manifest;
  } catch (error) {
    if (error instanceof PublicRuntimeError) throw error;
    throw new PublicRuntimeError("package_manifest_invalid");
  }
}

function validatePackageManifest(manifest) {
  if (
    manifest.contract !== DISTRIBUTABLE_PACKAGE_CONTRACT ||
    manifest.package_contract_version !==
      DISTRIBUTABLE_PACKAGE_CONTRACT_VERSION ||
    !validDiagnosticString(manifest.application_version) ||
    !validDiagnosticString(manifest.build_identity) ||
    !/^[a-f0-9]{64}$/.test(manifest.application_scope_fingerprint ?? "") ||
    !isObject(manifest.platform) ||
    !isObject(manifest.runtime) ||
    !isObject(manifest.database) ||
    !numericVersion(manifest.runtime.node_minimum) ||
    !/^\d+$/.test(String(manifest.runtime.node_modules_abi ?? "")) ||
    !/^\d+$/.test(String(manifest.runtime.node_napi ?? "")) ||
    !validDiagnosticString(manifest.database.schema_compatibility) ||
    manifest.database.schema_compatibility !==
      DISTRIBUTABLE_DATABASE_SCHEMA_COMPATIBILITY ||
    manifest.database.schema_contract !==
      DISTRIBUTABLE_DATABASE_SCHEMA_CONTRACT ||
    !/^[a-f0-9]{64}$/u.test(manifest.database.schema_signature ?? "") ||
    manifest.database.migration_contract !==
      DISTRIBUTABLE_DATABASE_MIGRATION_CONTRACT ||
    manifest.database.migration_contract_version !==
      DISTRIBUTABLE_DATABASE_MIGRATION_CONTRACT_VERSION ||
    JSON.stringify(manifest.database.migration_ids) !==
      JSON.stringify(DISTRIBUTABLE_DATABASE_MIGRATION_IDS) ||
    manifest.database.record_contract !==
      DISTRIBUTABLE_DATABASE_RECORD_CONTRACT ||
    manifest.database.record_contract_version !==
      DISTRIBUTABLE_DATABASE_RECORD_CONTRACT_VERSION ||
    JSON.stringify(manifest.database.reader_contracts) !==
      JSON.stringify(DISTRIBUTABLE_DATABASE_READER_CONTRACTS) ||
    JSON.stringify(
      manifest.database.supported_source_schema_signatures,
    ) !==
      JSON.stringify(
        DISTRIBUTABLE_DATABASE_SUPPORTED_SOURCE_SCHEMA_SIGNATURES,
      ) ||
    JSON.stringify(manifest.database.supported_source_schema_states) !==
      JSON.stringify(["current", "old"])
  ) {
    throw new PublicRuntimeError("package_contract_invalid");
  }
  if (
    manifest.runtime.runtime_contract !== RUNTIME_CONTRACT ||
    manifest.runtime.runtime_schema_version !== RUNTIME_SCHEMA_VERSION
  ) {
    throw new PublicRuntimeError("package_runtime_contract_unsupported");
  }
  const currentPlatform = detectDistributablePlatform();
  if (
    manifest.platform.os !== currentPlatform.os ||
    manifest.platform.arch !== currentPlatform.arch ||
    manifest.platform.libc !== currentPlatform.libc
  ) {
    throw new PublicRuntimeError("package_platform_unsupported");
  }
  if (String(manifest.runtime.node_modules_abi) !== process.versions.modules) {
    throw new PublicRuntimeError("package_node_abi_unsupported");
  }
  if (Number(process.versions.napi) < Number(manifest.runtime.node_napi)) {
    throw new PublicRuntimeError("package_node_napi_unsupported");
  }
  if (!runtimeMeetsMinimum(process.versions.node, manifest.runtime.node_minimum)) {
    throw new PublicRuntimeError("package_node_version_unsupported");
  }
}

function assertPackagedRuntimeEntry(repositoryRootPath, candidate) {
  try {
    const stats = lstatSync(candidate);
    if (!stats.isFile() || stats.isSymbolicLink()) {
      throw new PublicRuntimeError("package_runtime_entry_invalid");
    }
    const physicalRoot = realpathSync(repositoryRootPath);
    const physicalCandidate = realpathSync(candidate);
    const relative = path.relative(physicalRoot, physicalCandidate);
    if (relative === "" || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      throw new PublicRuntimeError("package_runtime_entry_invalid");
    }
  } catch (error) {
    if (error instanceof PublicRuntimeError) throw error;
    throw new PublicRuntimeError("package_runtime_entry_missing");
  }
}

function runtimeMeetsMinimum(runtimeVersion, minimumVersion) {
  const runtime = numericVersion(runtimeVersion);
  const minimum = numericVersion(minimumVersion);
  if (!runtime || !minimum) return false;
  for (let index = 0; index < 3; index += 1) {
    if (runtime[index] > minimum[index]) return true;
    if (runtime[index] < minimum[index]) return false;
  }
  return true;
}

function numericVersion(value) {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(?:>=\s*)?(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0)];
}

function validDiagnosticString(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 256 &&
    /^[A-Za-z0-9][A-Za-z0-9._:+\-/]*$/.test(value)
  );
}

function publicRuntimeDiagnostics(
  runtimeDistribution,
  { databaseSchemaCompatibility = null } = {},
) {
  return {
    distribution_mode: runtimeDistribution.mode,
    application_version: runtimeDistribution.applicationVersion,
    package_contract: runtimeDistribution.packageContract,
    package_contract_version: runtimeDistribution.packageContractVersion,
    build_identity: runtimeDistribution.buildIdentity,
    package_platform: runtimeDistribution.packagePlatform,
    runtime_contract: runtimeDistribution.runtimeContract,
    runtime_schema_version: runtimeDistribution.runtimeSchemaVersion,
    database_schema_compatibility:
      databaseSchemaCompatibility ??
      runtimeDistribution.databaseSchemaCompatibility,
  };
}

function runtimeDiagnosticEnvironmentValues(
  runtimeDistribution,
  databaseSchemaCompatibility,
) {
  const diagnostics = publicRuntimeDiagnostics(runtimeDistribution, {
    databaseSchemaCompatibility,
  });
  return {
    AUGNES_DISTRIBUTION_MODE: diagnostics.distribution_mode,
    AUGNES_APPLICATION_VERSION: diagnostics.application_version,
    AUGNES_PACKAGE_CONTRACT: diagnostics.package_contract,
    AUGNES_PACKAGE_CONTRACT_VERSION:
      diagnostics.package_contract_version === null
        ? null
        : String(diagnostics.package_contract_version),
    AUGNES_BUILD_IDENTITY: diagnostics.build_identity,
    AUGNES_PACKAGE_PLATFORM: diagnostics.package_platform,
    AUGNES_DATABASE_SCHEMA_COMPATIBILITY:
      diagnostics.database_schema_compatibility,
  };
}

function databaseTargetCompatibility(
  runtimeDistribution,
  sourceIdentity = null,
  recoveryActionId = null,
) {
  return {
    applicationScopeFingerprint:
      runtimeDistribution.applicationScopeFingerprint,
    sourceApplication: {
      application_version:
        sourceIdentity?.source_application_version ??
        sourceIdentity?.application_version ??
        null,
      build_identity:
        sourceIdentity?.source_build_identity ??
        sourceIdentity?.build_identity ??
        null,
      package_contract: sourceIdentity?.package_contract ?? null,
      package_contract_version:
        sourceIdentity?.package_contract_version ?? null,
      runtime_contract: sourceIdentity?.runtime_contract ?? null,
      runtime_schema_version:
        sourceIdentity?.runtime_schema_version ?? null,
    },
    schemaSignature: runtimeDistribution.databaseSchemaSignature,
    migrationIds: runtimeDistribution.databaseMigrationIds,
    recoveryActionId,
  };
}

function fingerprint(value) {
  return createHash("sha256").update(value).digest("hex");
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

function isPort(value) {
  return Number.isInteger(value) && value >= 1 && value <= 65_535;
}

function isPortCollisionOutput(output) {
  return /EADDRINUSE|address already in use|already in use/i.test(output);
}

function childExitError(record) {
  const error = new PublicRuntimeError("required_child_exited_during_startup");
  error.role = record.role;
  error.exitCode = record.exit?.code ?? null;
  error.signal = record.exit?.signal ?? null;
  return error;
}

function publicFailure(failure) {
  return {
    code: nonEmptyString(failure?.code) ?? "runtime_failed",
    role: nonEmptyString(failure?.role),
    exit_code: integerOrNull(failure?.exit_code),
    signal: nonEmptyString(failure?.signal),
  };
}

function publicErrorCode(error, fallback) {
  return nonEmptyString(error?.code) ?? fallback;
}

function constantTimeStringEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function singleHeader(value) {
  return Array.isArray(value) ? value[0] : value;
}

function nonEmptyString(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function canonicalTestNodeOptions(environment) {
  if (environment.AUGNES_CANONICAL_TEST_MODE !== "1") return null;
  const configuredImport = nonEmptyString(
    environment.AUGNES_CANONICAL_TEST_NODE_IMPORT,
  );
  if (configuredImport === null) return null;
  const configuredRoot = nonEmptyString(environment.AUGNES_CANONICAL_TEMP_ROOT);
  try {
    if (
      configuredRoot === null ||
      !path.isAbsolute(configuredRoot) ||
      !path.isAbsolute(configuredImport)
    ) {
      throw new Error("canonical test paths must be absolute");
    }
    const physicalRoot = realpathSync(configuredRoot);
    const physicalImport = realpathSync(configuredImport);
    const importStats = lstatSync(configuredImport);
    if (
      !importStats.isFile() ||
      importStats.isSymbolicLink() ||
      !isPathInsideOrEqual(physicalRoot, physicalImport)
    ) {
      throw new Error("canonical test import must be an owned regular file");
    }
    return `--import=${pathToFileURL(physicalImport).href}`;
  } catch (error) {
    throw new PublicRuntimeError(
      "canonical_test_node_import_invalid",
      error instanceof Error ? error.message : undefined,
    );
  }
}

function integerOrNull(value) {
  return Number.isInteger(value) ? value : null;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function emitResult(value) {
  console.log(
    JSON.stringify({
      schema_version: RUNTIME_SCHEMA_VERSION,
      contract: RUNTIME_CONTRACT,
      ...value,
    }),
  );
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
