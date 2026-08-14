#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import {
  acquireCompanionServiceMaintenance,
  inspectCompanionService,
  releaseCompanionServiceMaintenance,
  resolveCompanionServiceLayout,
  startCompanionService,
  stopCompanionService,
  uninstallCompanionService,
} from "../plugins/augnes-operator/mcp/companion-service-core.mjs";
import { discoverVerifiedCompanionV01 } from
  "../plugins/augnes-operator/mcp/companion-proxy.mjs";

if (process.platform !== "darwin") {
  console.log(JSON.stringify({
    status: "skipped",
    reason: "companion_service_platform_unsupported",
    real_provider_calls: 0,
  }));
  process.exit(0);
}

const repositoryRoot = process.cwd();
const testRoot = mkdtempSync(path.join(os.tmpdir(), "augnes-clh1-native-"));
const testScope = `clh1-native-${process.pid}`;
const environment = {
  ...process.env,
  AUGNES_COMPANION_SERVICE_TEST_MODE: "1",
  AUGNES_COMPANION_SERVICE_TEST_ROOT: testRoot,
  AUGNES_COMPANION_SERVICE_TEST_SCOPE: testScope,
};
const options = {
  repositoryRoot,
  environment,
  testScope,
  waitMs: 120_000,
};
const layout = resolveCompanionServiceLayout(options);
environment.AUGNES_RUNTIME_STATE_DIR = layout.runtime_directory;
const serviceEntry = path.join(repositoryRoot, "scripts", "augnes-companion-service.mjs");
const proxyEntry = path.join(repositoryRoot, "plugins", "augnes-operator", "mcp", "companion-proxy.mjs");
const maintenanceProbe = path.join(repositoryRoot, "scripts", "companion-service-maintenance-probe.mjs");
const requireMcpSdk = createRequire(path.join(repositoryRoot, "apps", "augnes_apps", "package.json"));
const { Client } = requireMcpSdk("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = requireMcpSdk("@modelcontextprotocol/sdk/client/stdio.js");
const observedProcesses = new Map();
const observedEndpoints = [];
const networkEvidencePath = path.join(testRoot, "proxy-network-evidence.jsonl");
const networkGuardImport = createProxyNetworkGuard();
environment.NODE_OPTIONS = `--import=${networkGuardImport}`;
environment.NEXT_TELEMETRY_DISABLED = "1";
let uninstalled = false;
let authorityStateUnchanged = false;
let projectFilesUnchanged = false;

try {
  const install = await runCli(["install"]);
  assert.equal(install.status, 0, install.stderr);
  assert.equal(JSON.parse(install.stdout).service.status, "live");

  let live = await waitForStatus("live", 120_000);
  rememberRuntime(live);
  const staleConfiguration = JSON.parse(
    readFileSync(layout.configuration_path, "utf8"),
  );
  staleConfiguration.service_source_fingerprint = "0".repeat(64);
  writeFileSync(
    layout.configuration_path,
    `${JSON.stringify(staleConfiguration)}\n`,
    { mode: 0o600 },
  );
  const staleService = await waitForRuntimeVerification(false, 10_000);
  assert.equal(staleService.status, "service_update_required");
  const stoppedForUpdate = await stopCompanionService(options);
  assert.equal(stoppedForUpdate.command, "stop");
  assert.equal(stoppedForUpdate.authority.runtime_lifecycle_effect, true);
  const stoppedStale = await inspectCompanionService(options);
  assert.equal(stoppedStale.status, "service_update_required");
  assert.equal(stoppedStale.loaded, false);
  const update = await runCli(["install"]);
  assert.equal(update.status, 0, update.stderr);
  live = await waitForStatus("live", 120_000);
  rememberRuntime(live);
  const oldManifestPath = path.join(testRoot, "old-runtime.json");
  const oldAccessPath = path.join(testRoot, "companion-access.json");

  const firstManagerState = JSON.parse(
    readFileSync(layout.manager_state_path, "utf8"),
  );
  process.kill(firstManagerState.manager_pid, "SIGKILL");
  const adoptedAfterManagerCrash = await waitForManagerChange(
    firstManagerState.manager_pid,
    45_000,
  );
  live = adoptedAfterManagerCrash;
  rememberRuntime(live);
  const firstGeneration = live.runtime.generation_id;
  copyFileSync(layout.runtime_manifest_path, oldManifestPath);
  copyFileSync(layout.runtime_access_path, oldAccessPath);

  const freshStatus = await runCli(["status"]);
  assert.equal(freshStatus.status, 0, freshStatus.stderr);
  assert.equal(JSON.parse(freshStatus.stdout).status, "live");

  const initialProjectFingerprint = projectFileFingerprint();
  const initialAuthorityState = authorityStateSnapshot();
  const client = new Client({ name: "augnes-clh1-native", version: "0.1.0" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [proxyEntry],
    cwd: repositoryRoot,
    env: environment,
    stderr: "pipe",
  });
  try {
    await client.connect(transport);
    const lifecycle = await client.callTool({
      name: "augnes_companion_lifecycle_status",
      arguments: { repositoryRoot },
    });
    assert.equal(lifecycle.isError, undefined);
    assert.equal(lifecycle.structuredContent?.service?.status, "live");
    assert.equal(
      lifecycle.structuredContent?.companion_verification,
      "exactly_one_verified",
    );
    const resume = await client.callTool({
      name: "augnes_resume_repository",
      arguments: { repositoryRoot },
    });
    assert.equal(resume.isError, undefined);
    assert.equal(
      resume.structuredContent?.repository_resolution?.status,
      "project_not_registered",
    );
  } finally {
    await client.close();
  }
  assert.equal(projectFileFingerprint(), initialProjectFingerprint);
  assert.deepEqual(authorityStateSnapshot(), initialAuthorityState);

  process.kill(-live.runtime.supervisor_pid, "SIGKILL");
  live = await waitForGenerationChange(firstGeneration, 45_000);
  rememberRuntime(live);
  assert.notEqual(live.runtime.generation_id, firstGeneration);
  assert.equal((await discoverVerifiedCompanionV01({
    ...environment,
    AUGNES_COMPANION_RUNTIME_MANIFEST: oldManifestPath,
    AUGNES_COMPANION_TEST_MODE: "1",
  })).status, "companion_unavailable");

  const duplicate = await Promise.all([
    startCompanionService(options),
    startCompanionService(options),
  ]);
  assert.deepEqual(duplicate.map((result) => result.result), [
    "exact_replay",
    "exact_replay",
  ]);
  assert.equal((await discoverVerifiedCompanionV01(environment)).status, "resolved");

  const stopped = await stopCompanionService(options);
  assert.equal(stopped.service.status, "installed_stopped");
  const stoppedFresh = await runCli(["status"]);
  assert.equal(JSON.parse(stoppedFresh.stdout).status, "installed_stopped");
  assert.equal(
    spawnSync("/bin/launchctl", [
      "print",
      `gui/${process.getuid()}/${layout.service_label}`,
    ]).status,
    113,
  );

  const stoppedProjectFingerprint = projectFileFingerprint();
  const stoppedAuthorityState = authorityStateSnapshot();
  const coldClient = new Client({ name: "augnes-clh1-cold-start", version: "0.1.0" });
  const coldTransport = new StdioClientTransport({
    command: process.execPath,
    args: [proxyEntry],
    cwd: repositoryRoot,
    env: environment,
    stderr: "pipe",
  });
  try {
    await coldClient.connect(coldTransport);
    const lifecycle = await coldClient.callTool({
      name: "augnes_companion_lifecycle_status",
      arguments: { repositoryRoot },
    });
    assert.equal(lifecycle.isError, undefined);
    assert.equal(lifecycle.structuredContent?.service?.status, "installed_stopped");
    assert.equal(lifecycle.structuredContent?.companion_verification, "not_attempted");
    assert.equal(lifecycle.structuredContent?.authority?.runtime_lifecycle_effect, false);
    const start = await coldClient.callTool({
      name: "augnes_start_companion_service",
      arguments: { repositoryRoot },
    });
    assert.equal(start.isError, undefined);
    assert.equal(start.structuredContent?.service?.status, "live");
    assert.equal(start.structuredContent?.companion_verification, "exactly_one_verified");
    assert.equal(start.structuredContent?.authority?.runtime_lifecycle_effect, true);
    const resume = await coldClient.callTool({
      name: "augnes_resume_repository",
      arguments: { repositoryRoot },
    });
    assert.equal(resume.isError, undefined);
    assert.equal(
      resume.structuredContent?.repository_resolution?.status,
      "project_not_registered",
    );
  } finally {
    await coldClient.close();
  }
  projectFilesUnchanged = projectFileFingerprint() === stoppedProjectFingerprint;
  authorityStateUnchanged = JSON.stringify(authorityStateSnapshot()) ===
    JSON.stringify(stoppedAuthorityState);
  assert.equal(projectFilesUnchanged, true);
  assert.equal(authorityStateUnchanged, true);
  await stopCompanionService(options);
  const concurrentColdStarts = await Promise.all([
    startCompanionService(options),
    startCompanionService(options),
  ]);
  assert.equal(
    concurrentColdStarts.filter((result) => result.result === "changed").length,
    1,
  );
  assert.equal(
    concurrentColdStarts.filter((result) => result.result === "exact_replay").length,
    1,
  );
  live = await waitForStatus("live", 120_000);
  rememberRuntime(live);
  const maintenance = await acquireCompanionServiceMaintenance({
    ...options,
    operationId: `native-maintenance:${process.pid}`,
  });
  assert.equal(maintenance.acquired, true);
  const duringMaintenance = await inspectCompanionService(options);
  assert.equal(duringMaintenance.status, "maintenance");
  assert.equal(duringMaintenance.runtime.verified, false);
  assert.equal(existsSync(layout.runtime_manifest_path), false);
  await assert.rejects(
    stopCompanionService(options),
    (error) => error?.code === "companion_service_maintenance_active",
  );
  await assert.rejects(
    uninstallCompanionService(options),
    (error) => error?.code === "companion_service_maintenance_active",
  );
  const joinedProbe = spawn(process.execPath, [maintenanceProbe], {
    cwd: repositoryRoot,
    env: {
      ...environment,
      AUGNES_COMPANION_MAINTENANCE_JOIN_ANCESTOR: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const joinedLine = await firstLine(joinedProbe.stdout, 10_000);
  assert.equal(JSON.parse(joinedLine).acquired, false);
  await childExit(joinedProbe, 10_000);
  const released = await releaseCompanionServiceMaintenance({
    ...options,
    lease: maintenance.lease,
  });
  assert.equal(released.after.status, "live");
  live = await waitForStatus("live", 120_000);
  rememberRuntime(live);

  const probe = spawn(process.execPath, [maintenanceProbe], {
    cwd: repositoryRoot,
    env: environment,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const probeLine = await firstLine(probe.stdout, 45_000);
  assert.equal(JSON.parse(probeLine).acquired, true);
  probe.kill("SIGKILL");
  await childExit(probe, 10_000);
  const recoveredFromStaleOwner = await waitForStatus("live", 45_000);
  rememberRuntime(recoveredFromStaleOwner);

  const finalManagerState = JSON.parse(
    readFileSync(layout.manager_state_path, "utf8"),
  );
  const finalManagerIdentity = processIdentity(finalManagerState.manager_pid);
  assert.notEqual(finalManagerIdentity, null);
  process.kill(finalManagerState.manager_pid, "SIGKILL");
  spawnSync("/bin/launchctl", [
    "bootout",
    `gui/${process.getuid()}/${layout.service_label}`,
  ]);
  await waitForProcessIdentitiesGone(
    new Map([[finalManagerState.manager_pid, finalManagerIdentity]]),
    10_000,
  );
  const exactResidual = await inspectCompanionService(options);
  assert.equal(exactResidual.status, "recovery_required");
  assert.equal(exactResidual.loaded, false);
  assert.equal(exactResidual.runtime.verified, true);

  const finalStaleConfiguration = JSON.parse(
    readFileSync(layout.configuration_path, "utf8"),
  );
  finalStaleConfiguration.service_source_fingerprint = "f".repeat(64);
  writeFileSync(
    layout.configuration_path,
    `${JSON.stringify(finalStaleConfiguration)}\n`,
    { mode: 0o600 },
  );
  assert.equal(
    (await inspectCompanionService(options)).status,
    "service_update_required",
  );
  const uninstall = await uninstallCompanionService(options);
  uninstalled = true;
  assert.equal(uninstall.service.status, "not_installed");
  assert.equal(existsSync(layout.launch_agent_path), false);
  assert.equal(existsSync(layout.configuration_path), false);
  assert.equal(
    spawnSync("/bin/launchctl", [
      "print",
      `gui/${process.getuid()}/${layout.service_label}`,
    ]).status,
    113,
  );
  await waitForProcessIdentitiesGone(observedProcesses, 10_000);
  await waitForOwnedEndpointsGone(observedEndpoints, 10_000);

  console.log(JSON.stringify({
    status: "pass",
    service_contract: "augnes-companion-service.v0.1",
    temporary_launch_agent: true,
    installer_parent_exit_survived: true,
    manager_crash_restart_recovered_service: true,
    official_stdio_lifecycle_without_prior_session: true,
    official_stdio_start_then_resume_once: true,
    readonly_resume_after_start: true,
    crash_recovery_generation_rotated: true,
    old_generation_access_refused: true,
    duplicate_start_single_runtime: true,
    concurrent_cold_start_one_lifecycle_effect: true,
    explicit_stop_remained_stopped: true,
    explicit_restart_succeeded: true,
    explicit_service_update_succeeded: true,
    stale_service_stop_and_uninstall_succeeded: true,
    exact_orphan_runtime_stopped_on_uninstall: true,
    maintenance_pause_and_restore: true,
    nested_maintenance_joined_ancestor: true,
    stale_owner_recovery: true,
    uninstall_exact_cleanup: true,
    zero_process_listener_runtime_service_residue: true,
    repository_commands_from_lifecycle_tools: 0,
    project_file_writes_from_lifecycle_tools: 0,
    managed_run_count_unchanged: authorityStateUnchanged,
    current_work_and_task_context_packet_unchanged: authorityStateUnchanged,
    approvals_unchanged: authorityStateUnchanged,
    review_decision_transition_and_state_unchanged: authorityStateUnchanged,
    project_files_unchanged: projectFilesUnchanged,
    provider_model_calls: 0,
    external_network_calls: proxyNetworkBlockedAttempts(),
    real_provider_calls: 0,
  }, null, 2));
} finally {
  if (!uninstalled) {
    try {
      await uninstallCompanionService(options);
    } catch {
      spawnSync("/bin/launchctl", [
        "bootout",
        `gui/${process.getuid()}/${layout.service_label}`,
      ]);
      rmSync(layout.launch_agent_path, { force: true });
    }
  }
  rmSync(testRoot, { recursive: true, force: true });
}

async function runCli(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [serviceEntry, ...args], {
      cwd: repositoryRoot,
      env: environment,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve({
      status: code,
      signal,
      stdout,
      stderr,
    }));
  });
}

function createProxyNetworkGuard() {
  const preloadPath = path.join(testRoot, "proxy-network-guard.mjs");
  const guardModule = path.join(repositoryRoot, "scripts", "test-harness-zero-network-guard.mjs");
  writeFileSync(preloadPath, [
    'import { appendFileSync } from "node:fs";',
    `import { installZeroNetworkGuard } from ${JSON.stringify(guardModule)};`,
    `const evidencePath = ${JSON.stringify(networkEvidencePath)};`,
    "const guard = installZeroNetworkGuard({",
    "  allowLoopback: true,",
    '  errorPrefix: "companion_proxy_external_network_forbidden",',
    "  onBlockedAttempt: (attempt) => appendFileSync(evidencePath, `${JSON.stringify({ type: \"blocked\", pid: process.pid, method: attempt.method })}\\n`),",
    "});",
    "appendFileSync(evidencePath, `${JSON.stringify({ type: \"ready\", pid: process.pid, guarded_methods: guard.guarded_methods.length })}\\n`);",
    "",
  ].join("\n"), { mode: 0o600 });
  return preloadPath;
}

function proxyNetworkBlockedAttempts() {
  const records = readFileSync(networkEvidencePath, "utf8")
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  assert(records.filter((record) => record.type === "ready").length >= 2);
  const blocked = records.filter((record) => record.type === "blocked");
  assert.deepEqual(blocked, []);
  return blocked.length;
}

function projectFileFingerprint() {
  const listed = spawnSync(
    "/usr/bin/git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: repositoryRoot, encoding: "buffer" },
  );
  assert.equal(listed.status, 0, listed.stderr?.toString("utf8"));
  const files = listed.stdout.toString("utf8").split("\0").filter(Boolean).sort();
  const hash = createHash("sha256");
  for (const relativePath of files) {
    hash.update(relativePath);
    hash.update("\0");
    hash.update(readFileSync(path.join(repositoryRoot, relativePath)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function authorityStateSnapshot() {
  const databasePath = path.join(testRoot, "data", "augnes.db");
  const database = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    const tables = database.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    ).all().map((row) => row.name).filter((name) =>
      /^(?:autonomy_|vnext_core_records$|vnext_semantic_|.*approval.*|.*decision.*|.*transition.*)/u.test(name),
    );
    return Object.fromEntries(tables.map((name) => [
      name,
      database.prepare(`SELECT COUNT(*) AS count FROM ${quotedIdentifier(name)}`).get().count,
    ]));
  } finally {
    database.close();
  }
}

function quotedIdentifier(value) {
  assert.match(value, /^[a-z0-9_]+$/u);
  return `"${value}"`;
}

async function waitForStatus(status, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let observation = await inspectCompanionService(options);
  while (observation.status !== status && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    observation = await inspectCompanionService(options);
  }
  assert.equal(observation.status, status, observation.reason);
  return observation;
}

async function waitForGenerationChange(generation, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let observation = await inspectCompanionService(options);
  while (
    !(
      observation.status === "live" &&
      observation.runtime?.generation_id !== generation
    ) &&
    Date.now() < deadline
  ) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    observation = await inspectCompanionService(options);
  }
  assert.equal(observation.status, "live", observation.reason);
  assert.notEqual(observation.runtime.generation_id, generation);
  return observation;
}

async function waitForRuntimeVerification(verified, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let observation = await inspectCompanionService(options);
  while (
    observation.runtime?.verified !== verified &&
    Date.now() < deadline
  ) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    observation = await inspectCompanionService(options);
  }
  assert.equal(observation.runtime?.verified, verified);
  return observation;
}

async function waitForManagerChange(managerPid, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let observation = await inspectCompanionService(options);
  let currentManagerPid = managerPid;
  while (
    !(observation.status === "live" && currentManagerPid !== managerPid) &&
    Date.now() < deadline
  ) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    observation = await inspectCompanionService(options);
    try {
      currentManagerPid = JSON.parse(
        readFileSync(layout.manager_state_path, "utf8"),
      ).manager_pid;
    } catch {
      currentManagerPid = managerPid;
    }
  }
  assert.equal(observation.status, "live", observation.reason);
  assert.notEqual(currentManagerPid, managerPid);
  return observation;
}

function rememberRuntime(observation) {
  observedProcesses.set(
    observation.runtime.supervisor_pid,
    processIdentity(observation.runtime.supervisor_pid),
  );
  const manifest = JSON.parse(readFileSync(layout.runtime_manifest_path, "utf8"));
  observedEndpoints.push({
    url: `${manifest.effective_url}/api/healthz`,
    runtime_instance_id: manifest.instance_id,
    runtime_generation_id: manifest.generation_id,
    runtime_repository_fingerprint: manifest.repository_fingerprint,
  });
  observedEndpoints.push({
    url: `http://127.0.0.1:${manifest.bridge_port}/healthz`,
    runtime_instance_id: manifest.instance_id,
    runtime_generation_id: manifest.generation_id,
    runtime_repository_fingerprint: manifest.repository_fingerprint,
  });
}

function firstLine(stream, timeoutMs) {
  return new Promise((resolve, reject) => {
    let buffer = "";
    const timeout = setTimeout(
      () => reject(new Error("maintenance_probe_timeout")),
      timeoutMs,
    );
    stream.setEncoding("utf8");
    stream.on("data", (chunk) => {
      buffer += chunk;
      const newline = buffer.indexOf("\n");
      if (newline >= 0) {
        clearTimeout(timeout);
        resolve(buffer.slice(0, newline));
      }
    });
  });
}

function childExit(child, timeoutMs) {
  return new Promise((resolve, reject) => {
    if (child.exitCode !== null || child.signalCode !== null) return resolve();
    const timeout = setTimeout(() => reject(new Error("child_exit_timeout")), timeoutMs);
    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

function processIdentity(pid) {
  const result = spawnSync(
    "/bin/ps",
    ["-o", "lstart=", "-o", "command=", "-p", String(pid)],
    {
    encoding: "utf8",
    },
  );
  const birthMaterial = result.status === 0 ? result.stdout.trim() : "";
  return birthMaterial || null;
}

async function waitForProcessIdentitiesGone(processes, timeoutMs) {
  for (const identity of processes.values()) assert.notEqual(identity, null);
  const deadline = Date.now() + timeoutMs;
  let remaining = [];
  do {
    remaining = [...processes].filter(
      ([pid, identity]) => processIdentity(pid) === identity,
    );
    if (remaining.length === 0) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  } while (Date.now() < deadline);
  assert.deepEqual(remaining, [], "owned service process identities must exit");
}

async function exactOwnedEndpointResponds(endpoint) {
  try {
    const response = await fetch(endpoint.url, {
      signal: AbortSignal.timeout(500),
    });
    if (!response.ok) return false;
    const body = await response.json();
    return body.runtime_instance_id === endpoint.runtime_instance_id &&
      body.runtime_generation_id === endpoint.runtime_generation_id &&
      body.runtime_repository_fingerprint ===
        endpoint.runtime_repository_fingerprint;
  } catch {
    return false;
  }
}

async function waitForOwnedEndpointsGone(endpoints, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let remaining = [];
  do {
    remaining = [];
    for (const endpoint of endpoints) {
      if (await exactOwnedEndpointResponds(endpoint)) remaining.push(endpoint);
    }
    if (remaining.length === 0) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  } while (Date.now() < deadline);
  assert.deepEqual(
    remaining,
    [],
    "owned service endpoint identities must be unavailable after uninstall",
  );
}
