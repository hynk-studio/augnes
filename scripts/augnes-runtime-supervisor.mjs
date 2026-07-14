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
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { createServer as createHttpServer, request as httpRequest } from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { buildRuntimeChildEnvironment } from "./runtime-child-environment.mjs";

export const RUNTIME_CONTRACT = "augnes-local-runtime-supervisor-v1";
export const RUNTIME_SCHEMA_VERSION = 1;
export const LOOPBACK_HOST = "127.0.0.1";
export const DEFAULT_UI_PORT = 3000;
export const DEFAULT_BRIDGE_PORT = 8787;
export const PORT_SEARCH_SIZE = 20;

const STARTUP_TIMEOUT_MS = 90_000;
const OWNERSHIP_REQUEST_TIMEOUT_MS = 1_500;
const GRACEFUL_CHILD_STOP_MS = 8_000;
const FORCED_CHILD_STOP_MS = 4_000;
const STOP_COMMAND_TIMEOUT_MS = 20_000;
const OWNERSHIP_RACE_WAIT_MS = 3_000;
const MAX_CONTROL_RESPONSE_BYTES = 64 * 1024;
const OUTPUT_TAIL_BYTES = 32 * 1024;
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = realpathSync(path.resolve(scriptDirectory, ".."));
const nextBin = path.join(repositoryRoot, "node_modules", "next", "dist", "bin", "next");
const bridgeRoot = path.join(repositoryRoot, "apps", "augnes_apps");
const bridgeServer = path.join(bridgeRoot, "src", "server.ts");

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
  });
}

export function resolveRuntimePaths({
  environment = process.env,
  repositoryFingerprint = fingerprint(repositoryRoot),
  repositoryRootPath = repositoryRoot,
} = {}) {
  const configured = nonEmptyString(environment.AUGNES_RUNTIME_STATE_DIR);
  let directory;

  if (configured) {
    if (!path.isAbsolute(configured)) {
      throw new PublicRuntimeError("runtime_state_path_must_be_absolute");
    }
    directory = path.resolve(configured);
  } else {
    const home = resolveHomeDirectory(environment);
    const checkoutDirectory = `checkout-${repositoryFingerprint.slice(0, 16)}`;
    if (process.platform === "darwin") {
      directory = path.join(
        home,
        "Library",
        "Application Support",
        "Augnes",
        "runtime",
        checkoutDirectory,
      );
    } else if (process.platform === "win32") {
      const localAppData = nonEmptyString(environment.LOCALAPPDATA) ?? home;
      directory = path.join(localAppData, "Augnes", "runtime", checkoutDirectory);
    } else {
      const xdgRuntime = nonEmptyString(environment.XDG_RUNTIME_DIR);
      const xdgState = nonEmptyString(environment.XDG_STATE_HOME);
      const root = xdgRuntime
        ? path.resolve(xdgRuntime)
        : xdgState
          ? path.join(path.resolve(xdgState), "augnes", "runtime")
          : path.join(home, ".local", "state", "augnes", "runtime");
      directory = path.join(root, checkoutDirectory);
    }
  }

  resolvePhysicalRuntimeStateDestination({
    candidate: directory,
    repositoryRoot: repositoryRootPath,
  });
  try {
    const stats = lstatSync(directory);
    if (!stats.isDirectory() || stats.isSymbolicLink()) {
      throw new PublicRuntimeError("runtime_state_directory_invalid");
    }
  } catch (error) {
    if (error instanceof PublicRuntimeError) throw error;
    if (error?.code !== "ENOENT") {
      throw new PublicRuntimeError("runtime_state_directory_invalid");
    }
  }

  return {
    directory,
    manifest: path.join(directory, "runtime.json"),
    lock: path.join(directory, "owner.lock"),
    token: path.join(directory, "control-token.json"),
    bridgeEnvironment: path.join(directory, "bridge-supervisor.env"),
  };
}

export function resolvePhysicalRuntimeStateDestination({
  candidate,
  repositoryRoot: repositoryRootPath = repositoryRoot,
}) {
  if (!path.isAbsolute(candidate)) {
    throw new PublicRuntimeError("runtime_state_path_must_be_absolute");
  }

  const lexicalDestination = path.resolve(candidate);
  let existingAncestor = lexicalDestination;
  const missingSegments = [];
  while (!existsSync(existingAncestor)) {
    const parent = path.dirname(existingAncestor);
    if (parent === existingAncestor) {
      throw new PublicRuntimeError("runtime_state_path_invalid");
    }
    missingSegments.unshift(path.basename(existingAncestor));
    existingAncestor = parent;
  }

  let physicalRepositoryRoot;
  let physicalAncestor;
  try {
    physicalRepositoryRoot = realpathSync(repositoryRootPath);
    physicalAncestor = realpathSync(existingAncestor);
  } catch {
    throw new PublicRuntimeError("runtime_state_path_invalid");
  }
  const physicalDestination = path.resolve(physicalAncestor, ...missingSegments);
  assertRuntimeStateOutsideRepository(
    physicalRepositoryRoot,
    physicalDestination,
  );
  return {
    lexical_destination: lexicalDestination,
    physical_destination: physicalDestination,
    physical_repository_root: physicalRepositoryRoot,
  };
}

export async function readVerifiedRuntimeStatus({
  paths,
  repositoryFingerprint = fingerprint(repositoryRoot),
}) {
  const manifestResult = readManifest(paths.manifest);
  if (manifestResult.state === "missing") {
    return { verified: false, reason: "not_running", manifest_present: false };
  }
  if (manifestResult.state !== "valid") {
    return {
      verified: false,
      reason: "ownership_unverified",
      manifest_present: true,
    };
  }

  const manifest = manifestResult.value;
  if (manifest.repository_fingerprint !== repositoryFingerprint) {
    return {
      verified: false,
      reason: "ownership_unverified",
      manifest_present: true,
    };
  }
  if (!isProcessAlive(manifest.supervisor_pid)) {
    return {
      verified: false,
      reason: "ownership_unverified",
      manifest_present: true,
    };
  }

  let response;
  try {
    response = await requestControlJson({
      port: manifest.control_port,
      path: "/v1/identity",
      method: "GET",
    });
  } catch {
    return {
      verified: false,
      reason: "ownership_unverified",
      manifest_present: true,
    };
  }

  if (
    response.statusCode !== 200 ||
    !isVerifiedIdentity(response.body, manifest, repositoryFingerprint)
  ) {
    return {
      verified: false,
      reason: "ownership_unverified",
      manifest_present: true,
    };
  }

  return {
    verified: true,
    manifest_present: true,
    manifest,
    identity: response.body,
  };
}

async function runStatusCommand({ paths, repositoryFingerprint }) {
  const status = await readVerifiedRuntimeStatus({ paths, repositoryFingerprint });
  if (status.verified) {
    emitResult(publicStatusResult("status", "observed", status.identity));
    return 0;
  }
  if (!status.manifest_present) {
    emitResult({
      command: "status",
      result: "observed",
      state: "stopped",
      verified: false,
      effective_url: null,
      ui_port: null,
      bridge_port: null,
      children: [],
    });
    return 0;
  }

  emitResult({
    command: "status",
    result: "refused",
    state: "unavailable",
    verified: false,
    reason: status.reason,
    effective_url: null,
    ui_port: null,
    bridge_port: null,
    children: [],
  });
  return 2;
}

async function runStopCommand({ paths, repositoryFingerprint }) {
  const status = await readVerifiedRuntimeStatus({ paths, repositoryFingerprint });
  if (!status.verified) {
    if (!status.manifest_present) {
      emitResult({
        command: "stop",
        result: "already_stopped",
        state: "stopped",
        verified: false,
        effective_url: null,
      });
      return 0;
    }
    emitResult({
      command: "stop",
      result: "refused",
      state: "unavailable",
      verified: false,
      reason: "ownership_unverified",
      effective_url: null,
    });
    return 2;
  }

  const tokenRecord = readOwnedToken(paths.token, status.identity.instance_id);
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
}) {
  const existing = await readVerifiedRuntimeStatus({ paths, repositoryFingerprint });
  if (existing.verified) {
    emitResult(publicStatusResult("start", "existing", existing.identity));
    return existing.identity.lifecycle_state === "failed" ? 2 : 0;
  }

  if (hasOwnershipSideFiles(paths)) {
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
      reason: "ownership_unverified",
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
  const instanceId = randomUUID();
  const lockRecord = {
    schema_version: RUNTIME_SCHEMA_VERSION,
    contract: RUNTIME_CONTRACT,
    instance_id: instanceId,
    supervisor_pid: process.pid,
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
        reason: "ownership_unverified",
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

  const startedAt = new Date().toISOString();
  const runtime = {
    paths,
    environment,
    uiNextArguments: options.uiNextArguments,
    repositoryFingerprint,
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
      instance_id: instanceId,
      token: runtime.controlToken,
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
    });

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
  effectiveUrl = null,
  port = null,
}) {
  if (role === "ui") {
    return {
      NODE_ENV: "development",
      NEXT_TELEMETRY_DISABLED: "1",
      AUGNES_DB_PATH: nonEmptyString(environment.AUGNES_DB_PATH),
      AUGNES_RUNTIME_INSTANCE_ID: instanceId,
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
      AUGNES_RUNTIME_INSTANCE_ID: instanceId,
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
    effectiveUrl: runtime.effectiveUrl,
    port,
  });
  const childEnvironment = buildRuntimeChildEnvironment({
    role,
    ambientEnvironment: runtime.environment,
    values: authoredValues,
  });
  const args =
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
  const child = spawn(process.execPath, args, {
    cwd: role === "ui" ? repositoryRoot : bridgeRoot,
    env: childEnvironment,
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "pipe"],
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
  };

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

  if (ownsLock(runtime.paths.lock, runtime.instanceId)) {
    removeOwnedJson(runtime.paths.manifest, runtime.instanceId);
    removeOwnedJson(runtime.paths.token, runtime.instanceId);
    removeRegularFile(runtime.paths.bridgeEnvironment);
    removeOwnedJson(runtime.paths.lock, runtime.instanceId);
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
    instance_id: runtime.instanceId,
    repository_fingerprint: runtime.repositoryFingerprint,
    supervisor_pid: runtime.supervisorPid,
    control_host: LOOPBACK_HOST,
    control_port: runtime.controlPort,
    children: publicChildren(runtime),
    effective_url: runtime.effectiveUrl,
    ui_port: runtime.uiPort,
    bridge_port: runtime.bridgePort,
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
    instance_id: runtime.instanceId,
    repository_fingerprint: runtime.repositoryFingerprint,
    supervisor_pid: runtime.supervisorPid,
    lifecycle_state: runtime.lifecycleState,
    effective_url: runtime.effectiveUrl,
    ui_port: runtime.uiPort,
    bridge_port: runtime.bridgePort,
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
    children: Array.isArray(identity.children) ? identity.children : [],
    started_at: identity.started_at,
    last_transition_at: identity.last_transition_at,
    failure: identity.failure ?? null,
  };
}

function readManifest(manifestPath) {
  const value = readJsonRegularFile(manifestPath);
  if (value === null) return { state: "missing" };
  if (!isManifest(value)) return { state: "invalid" };
  return { state: "valid", value };
}

function isManifest(value) {
  return (
    isObject(value) &&
    value.schema_version === RUNTIME_SCHEMA_VERSION &&
    value.contract === RUNTIME_CONTRACT &&
    typeof value.instance_id === "string" &&
    value.instance_id.length > 0 &&
    typeof value.repository_fingerprint === "string" &&
    Number.isInteger(value.supervisor_pid) &&
    value.supervisor_pid > 0 &&
    value.control_host === LOOPBACK_HOST &&
    isPort(value.control_port) &&
    isLifecycleState(value.lifecycle_state)
  );
}

function isVerifiedIdentity(identity, manifest, repositoryFingerprint) {
  return (
    isObject(identity) &&
    identity.schema_version === RUNTIME_SCHEMA_VERSION &&
    identity.contract === RUNTIME_CONTRACT &&
    identity.instance_id === manifest.instance_id &&
    identity.repository_fingerprint === repositoryFingerprint &&
    identity.supervisor_pid === manifest.supervisor_pid &&
    isLifecycleState(identity.lifecycle_state) &&
    identity.ui_port === manifest.ui_port &&
    identity.bridge_port === manifest.bridge_port
  );
}

function readOwnedToken(tokenPath, instanceId) {
  const value = readJsonRegularFile(tokenPath);
  if (
    !isObject(value) ||
    value.schema_version !== RUNTIME_SCHEMA_VERSION ||
    value.contract !== RUNTIME_CONTRACT ||
    value.instance_id !== instanceId ||
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

function hasOwnershipSideFiles(paths) {
  return [paths.manifest, paths.lock, paths.token, paths.bridgeEnvironment].some(
    (filePath) => existsSync(filePath),
  );
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

export function ensureRuntimeDirectory({
  directory,
  repositoryRoot: repositoryRootPath = repositoryRoot,
}) {
  const existedBefore = existsSync(directory);
  let firstCreatedDirectory;
  try {
    firstCreatedDirectory = mkdirSync(directory, { recursive: true, mode: 0o700 });
    const stats = lstatSync(directory);
    if (!stats.isDirectory() || stats.isSymbolicLink()) {
      throw new PublicRuntimeError("runtime_state_directory_invalid");
    }

    let physicalRepositoryRoot;
    let physicalDirectory;
    try {
      physicalRepositoryRoot = realpathSync(repositoryRootPath);
      physicalDirectory = realpathSync(directory);
    } catch {
      throw new PublicRuntimeError("runtime_state_directory_invalid");
    }
    assertRuntimeStateOutsideRepository(physicalRepositoryRoot, physicalDirectory);

    try {
      chmodSync(directory, 0o700);
    } catch {
      // Windows does not implement POSIX mode semantics.
    }
    return physicalDirectory;
  } catch (error) {
    if (!existedBefore && firstCreatedDirectory) {
      removeCreatedEmptyDirectoryChain(directory, firstCreatedDirectory);
    }
    if (error instanceof PublicRuntimeError) throw error;
    throw new PublicRuntimeError("runtime_state_directory_invalid");
  }
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
  } finally {
    if (descriptor !== null) closeSync(descriptor);
    if (existsSync(temporaryPath)) removeRegularFile(temporaryPath);
  }
}

function ownsLock(lockPath, instanceId) {
  const value = readJsonRegularFile(lockPath);
  return isObject(value) && value.instance_id === instanceId;
}

function removeOwnedJson(filePath, instanceId) {
  const value = readJsonRegularFile(filePath);
  if (isObject(value) && value.instance_id === instanceId) removeRegularFile(filePath);
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
  if (["start", "status", "stop"].includes(args[0])) command = args.shift();
  else if (args[0] && !args[0].startsWith("-")) {
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

function resolveHomeDirectory(environment) {
  const configured =
    nonEmptyString(environment.HOME) ?? nonEmptyString(environment.USERPROFILE);
  const home = configured ? path.resolve(configured) : os.homedir();
  if (!path.isAbsolute(home)) throw new PublicRuntimeError("home_path_invalid");
  return home;
}

function isInsideOrEqual(root, candidate) {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return (
    relative === "" ||
    (relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
}

function assertRuntimeStateOutsideRepository(
  physicalRepositoryRoot,
  physicalDestination,
) {
  if (isInsideOrEqual(physicalRepositoryRoot, physicalDestination)) {
    throw new PublicRuntimeError(
      "runtime_state_path_must_be_outside_repository",
    );
  }
}

function removeCreatedEmptyDirectoryChain(directory, firstCreatedDirectory) {
  const boundary = path.resolve(firstCreatedDirectory);
  let current = path.resolve(directory);
  while (isInsideOrEqual(boundary, current)) {
    try {
      const stats = lstatSync(current);
      if (!stats.isDirectory() || stats.isSymbolicLink()) return;
      rmdirSync(current);
    } catch {
      return;
    }
    if (current === boundary) return;
    current = path.dirname(current);
  }
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

function isLifecycleState(value) {
  return ["starting", "ready", "stopping", "failed"].includes(value);
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
