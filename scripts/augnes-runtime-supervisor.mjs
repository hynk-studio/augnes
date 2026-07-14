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

import { buildRuntimeChildEnvironment } from "./runtime-child-environment.mjs";
import {
  ensureApplicationDirectory,
  resolveAugnesLocalPaths,
  resolvePhysicalLocalDestination,
} from "./augnes-local-paths.mjs";
import {
  inspectDatabaseReconciliation,
  inspectRuntimeDatabase,
  prepareRuntimeDatabase,
  reconcileInterruptedDatabaseBootstrap,
} from "./runtime-database-bootstrap.mjs";
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

const STARTUP_TIMEOUT_MS = 90_000;
const OWNERSHIP_REQUEST_TIMEOUT_MS = 1_500;
const GRACEFUL_CHILD_STOP_MS = 8_000;
const FORCED_CHILD_STOP_MS = 4_000;
const EXITED_CHILD_DRAIN_MS = 1_000;
const STOP_COMMAND_TIMEOUT_MS = 20_000;
const OWNERSHIP_RACE_WAIT_MS = 3_000;
const MAX_CONTROL_RESPONSE_BYTES = 64 * 1024;
const OUTPUT_TAIL_BYTES = 32 * 1024;
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

  const repositoryFingerprint = fingerprint(repositoryRoot);
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
    return runDiagnosticsCommand({ paths, repositoryFingerprint });
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
    dependencies,
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

async function runDiagnosticsCommand({ paths, repositoryFingerprint }) {
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
  dependencies = {},
}) {
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
  if (existing.verified) {
    emitResult(publicStatusResult("start", "existing", existing.identity));
    return existing.identity.lifecycle_state === "failed" ? 2 : 0;
  }

  let reconciliationResult = {
    performed: false,
    orphanChildrenStopped: 0,
    databaseStateReconciled: false,
    recoveryBackupPreserved: false,
  };
  const databaseReconciliation = await inspectDatabaseReconciliation({
    databasePath: paths.local.database_path,
    backupDirectory: paths.local.backup_directory,
    repositoryFingerprint,
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
    recoveryBackupPreserved: reconciliationResult.recoveryBackupPreserved,
  };
  runtime.shutdownPromise = new Promise((resolve) => {
    runtime.resolveShutdown = resolve;
  });

  let cleanupError = null;
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
      const databaseResult = await (
        dependencies.prepareRuntimeDatabase ?? prepareRuntimeDatabase
      )({
        databasePath: runtime.databasePath,
        backupDirectory: paths.local.backup_directory,
        repositoryRoot,
        instanceId: runtime.instanceId,
        databaseOverrideActive: paths.local.database_override_active,
        repositoryFingerprint: runtime.repositoryFingerprint,
        runtimeOwnershipGeneration: runtime.generationId,
      });
      runtime.databaseState = databaseResult.databaseState;
      runtime.databaseSchemaVersion = databaseResult.schemaVersion;
      runtime.recoveryBackupCreated = databaseResult.recoveryBackupCreated;
      writeRuntimeManifest(runtime);
    } catch (error) {
      runtime.databaseState = "failed";
      runtime.recoveryBackupCreated = error?.recoveryBackupCreated === true;
      writeRuntimeManifest(runtime);
      throw error;
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

    transitionRuntime(runtime, "ready");
    emitResult(publicStatusResult("start", "ready", buildControlIdentity(runtime)));
    await runtime.shutdownPromise;
  } catch (error) {
    if (!(error instanceof ShutdownDuringStartupError) && !runtime.shutdownRequested) {
      await failRuntime(runtime, {
        code: publicErrorCode(error, "startup_failed"),
        role: error?.role ?? null,
        exit_code: integerOrNull(error?.exitCode),
        signal: nonEmptyString(error?.signal),
      });
    }
  } finally {
    try {
      await cleanupOwnedRuntime(runtime);
    } catch (error) {
      cleanupError = error;
      runtime.exitCode = 1;
    }
    removeSignalHandlers(runtime);
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

export function buildSupervisorChildValues({
  role,
  environment = process.env,
  paths,
  instanceId,
  repositoryFingerprint = null,
  generationId = null,
  childOwnershipToken = null,
  effectiveUrl = null,
  port = null,
  databasePath = nonEmptyString(environment.AUGNES_DB_PATH),
}) {
  const ownershipValues = {
    AUGNES_RUNTIME_INSTANCE_ID: instanceId,
    AUGNES_RUNTIME_CONTRACT: RUNTIME_CONTRACT,
    AUGNES_RUNTIME_SCHEMA_VERSION: String(RUNTIME_SCHEMA_VERSION),
    AUGNES_RUNTIME_REPOSITORY_FINGERPRINT: repositoryFingerprint,
    AUGNES_RUNTIME_GENERATION_ID: generationId,
    AUGNES_RUNTIME_GENERATION_VERSION: String(RUNTIME_GENERATION_VERSION),
    AUGNES_RUNTIME_CHILD_ROLE: role,
    AUGNES_RUNTIME_CHILD_PORT: port === null ? null : String(port),
    AUGNES_RUNTIME_OWNERSHIP_TOKEN: childOwnershipToken,
  };
  if (role === "ui") {
    return {
      NODE_ENV: "development",
      NEXT_TELEMETRY_DISABLED: "1",
      AUGNES_DB_PATH: databasePath,
      ...ownershipValues,
      OPENAI_API_KEY: nonEmptyString(environment.OPENAI_API_KEY),
      OPENAI_MODEL: nonEmptyString(environment.OPENAI_MODEL),
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
    };
  }

  if (role === "bridge") {
    return {
      NODE_ENV: "development",
      PORT: String(port),
      DOTENV_CONFIG_PATH: paths.bridgeEnvironment,
      AUGNES_CORE_MODE: "mock",
      AUGNES_API_BASE_URL: effectiveUrl,
      AUGNES_ENABLE_AGENT_BRIDGE: "true",
      ...ownershipValues,
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
    repositoryFingerprint: runtime.repositoryFingerprint,
    generationId: runtime.generationId,
    childOwnershipToken: runtime.childOwnershipToken,
    effectiveUrl: runtime.effectiveUrl,
    port,
    databasePath: runtime.databasePath,
  });
  const childEnvironment = buildRuntimeChildEnvironment({
    role,
    ambientEnvironment: runtime.environment,
    values: authoredValues,
  });
  const childArguments =
    role === "ui"
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
    cwd: role === "ui" ? repositoryRoot : bridgeRoot,
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
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (runtime.shutdownRequested) return "shutdown";
    if (runtime.startupFailure) return "required_child_exit";
    if (record.spawnError) return "spawn_failed";
    if (isPortCollisionOutput(record.outputTail)) return "collision";
    if (record.exit) {
      return isPortCollisionOutput(record.outputTail) ? "collision" : "child_exit";
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
    respondJson(response, 404, { error: "not_found" });
  });
  server.keepAliveTimeout = 1_000;
  server.headersTimeout = 2_000;

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen({ host: LOOPBACK_HOST, port: 0, exclusive: true }, resolve);
  });
  return server;
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

  signalOwnedProcessTree(record, "SIGTERM");
  if (await waitForProcessTreeExit(record, GRACEFUL_CHILD_STOP_MS)) return;

  signalOwnedProcessTree(record, "SIGKILL");
  if (await waitForProcessTreeExit(record, FORCED_CHILD_STOP_MS)) return;
  throw new PublicRuntimeError("owned_child_stop_timeout");
}

function signalOwnedProcessTree(record, signal) {
  try {
    if (process.platform === "win32") {
      const args = ["/PID", String(record.pid), "/T"];
      if (signal === "SIGKILL") args.push("/F");
      spawnSync("taskkill", args, { stdio: "ignore", windowsHide: true });
    } else {
      process.kill(-record.pid, signal);
    }
  } catch (error) {
    if (error?.code !== "ESRCH") throw error;
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

async function reconcileRuntimeOwnership({
  paths,
  repositoryFingerprint,
  databaseReconciliation = null,
}) {
  databaseReconciliation ??= await inspectDatabaseReconciliation({
    databasePath: paths.local.database_path,
    backupDirectory: paths.local.backup_directory,
    repositoryFingerprint,
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

function closeServer(server) {
  return new Promise((resolve, reject) => {
    if (!server.listening) {
      resolve();
      return;
    }
    server.close((error) => (error ? reject(error) : resolve()));
    server.closeAllConnections?.();
  });
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

function isDirectExecution() {
  return Boolean(process.argv[1]) && pathToFileURL(process.argv[1]).href === import.meta.url;
}

if (isDirectExecution()) {
  process.exitCode = await runRuntimeSupervisorCli();
}
