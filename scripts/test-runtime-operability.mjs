#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import {
  appendFileSync,
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { createServer as createHttpServer } from "node:http";
import { createRequire } from "node:module";
import net from "node:net";
import { networkInterfaces, tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import {
  DEFAULT_BRIDGE_PORT,
  DEFAULT_UI_PORT,
  RUNTIME_CONTRACT,
  RUNTIME_SCHEMA_VERSION,
  buildSupervisorChildValues,
  ensureRuntimeDirectory,
  resolvePhysicalRuntimeStateDestination,
  resolveRuntimePaths,
} from "./augnes-runtime-supervisor.mjs";
import {
  buildRuntimeChildEnvironment,
  findForbiddenRuntimeChildEnvironmentKeys,
} from "./runtime-child-environment.mjs";

const repoRoot = process.cwd();
const requireMcpSdk = createRequire(
  path.join(repoRoot, "apps", "augnes_apps", "package.json"),
);
const supervisorScript = path.join(repoRoot, "scripts", "augnes-runtime-supervisor.mjs");
const temporaryRoot = mkdtempSync(path.join(tmpdir(), "augnes-runtime-operability-"));
const homeRoot = path.join(temporaryRoot, "home");
const tempRoot = path.join(temporaryRoot, "tmp");
const logRoot = path.join(temporaryRoot, "logs");
const databasePath = path.join(temporaryRoot, "data", "runtime.db");
const repositoryDatabasePath = path.join(repoRoot, "data", "augnes.db");
const runtimeMarkerScope = "project:runtime-supervisor-mcp-behavior-v0-1";
const runtimeMarkerStateKey = "runtime_supervisor.mcp_behavior_marker";
const runtimeMarkerValue = "disposable-root-runtime-marker-v0-1";
const publicSecretSentinel = "must-not-escape-runtime-parent";
const publicModelSentinel = "reviewed-model-sentinel-must-not-escape";
const reviewedBridgeCompatibilityEnvironment = Object.freeze({
  AUGNES_APP_PROFILE: "chrono_lab",
  AUGNES_APP_TOOL_SURFACE: "work_loop_readonly",
  AUGNES_APP_DOMAIN: "https://app.runtime-compat.example",
  AUGNES_CONNECT_DOMAIN: "https://connect.runtime-compat.example",
  AUGNES_RESOURCE_DOMAIN: "https://resources.runtime-compat.example",
});
const blockedBridgeFileEnvironment = Object.freeze({
  AUGNES_WORKING_VIEW_FILE: path.join(temporaryRoot, "working-view.json"),
  AUGNES_CASEFILE_FILE: path.join(temporaryRoot, "casefile.json"),
  AUGNES_EVIDENCE_INDEX_FILE: path.join(temporaryRoot, "evidence-index.json"),
  AUGNES_CONTINUITY_REPORT_FILE: path.join(temporaryRoot, "continuity.json"),
  AUGNES_BOUNDARY_PACKET_FILE: path.join(temporaryRoot, "boundary.json"),
  AUGNES_STRATEGY_RATIONALE_FILE: path.join(temporaryRoot, "strategy.json"),
  AUGNES_GOVERNANCE_AUDIT_FILE: path.join(temporaryRoot, "audit.json"),
  AUGNES_REPO_NAVIGATION_FILE: path.join(temporaryRoot, "repo-navigation.json"),
});
const trackedSupervisors = new Set();
const selectedPorts = [];
const observedOwnedPids = new Set();
let pathFixtureSkipReason = null;
let proxyRequestCount = 0;
let unrelatedProcess = null;
let unrelatedIdentityServer = null;
let proxyServer = null;
let mcpBehaviorVerified = false;
let legacyRootRequestCount = 0;

mkdirSync(homeRoot, { recursive: true });
mkdirSync(tempRoot, { recursive: true });
mkdirSync(logRoot, { recursive: true });
mkdirSync(path.dirname(databasePath), { recursive: true });

const repositoryDatabaseBefore = snapshotDatabaseFamily(repositoryDatabasePath);
const ambientRuntimeProcessesBefore = listSupervisorProcessIds();
const ownedProcessCountBefore = observedOwnedPids.size;

try {
  initializeDisposableDatabase(databasePath);
  assertRuntimeEnvironmentIsolation();
  await testRuntimeStatePathSafety();

  proxyServer = createHttpServer((_request, response) => {
    proxyRequestCount += 1;
    response.writeHead(502, { "content-type": "text/plain" });
    response.end("runtime test proxy sentinel");
  });
  const proxyPort = await listenHttpServer(proxyServer);

  unrelatedProcess = spawn(
    process.execPath,
    ["--eval", "setInterval(() => {}, 1000)"],
    { stdio: "ignore" },
  );
  assert(Number.isInteger(unrelatedProcess.pid));

  await testReadyDuplicateStatusAndStop();
  await testPoisonedEnvironmentRestart(proxyPort);
  await testParentSignalCleanup();
  await testRequiredChildFailure();
  await testUnverifiedOwnershipRefusal();

  assert.equal(mcpBehaviorVerified, true, "real public and StateRuntime MCP tools must be verified");
  assert.equal(legacyRootRequestCount, 0, "legacy proposed routes must not reach the root runtime");
  assert.equal(proxyRequestCount, 0, "supervised startup must not make provider/proxy requests");
  assert.equal(isProcessAlive(unrelatedProcess.pid), true, "unrelated PID sentinel must remain alive");
  assert.deepEqual(
    snapshotDatabaseFamily(repositoryDatabasePath),
    repositoryDatabaseBefore,
    "the repository database and side files must remain byte/stat identical",
  );
  for (const pid of observedOwnedPids) {
    assert.equal(isProcessAlive(pid), false, `owned process ${pid} must not remain after tests`);
  }
  const ownedProcessCountAfter = [...observedOwnedPids].filter(isProcessAlive).length;
  assert.equal(ownedProcessCountAfter, 0);
  const ambientRuntimeProcessesAfter = listSupervisorProcessIds();
  assert.deepEqual(
    ambientRuntimeProcessesAfter,
    ambientRuntimeProcessesBefore,
    "the focused test must leave the ambient supervisor process count unchanged",
  );

  const summary = {
    test: "canonical-runtime-supervisor-operability",
    status: "pass",
    canonical_commands: ["start", "status", "stop"],
    real_processes: ["next-ui", "http-mcp-bridge"],
    loopback_only: true,
    preferred_ui_port: DEFAULT_UI_PORT,
    preferred_bridge_port: DEFAULT_BRIDGE_PORT,
    selected_ports: selectedPorts,
    ready_state_verified: true,
    duplicate_launch_reused: true,
    graceful_stop: true,
    parent_signal_cleanup: true,
    required_child_failure_observed: true,
    unverified_pid_never_signaled: true,
    environment_isolation_verified: true,
    reviewed_ui_provider_environment_verified: true,
    bridge_core_mode: "mock",
    public_mcp_mock_tool_verified: mcpBehaviorVerified,
    state_runtime_mcp_tool_verified: mcpBehaviorVerified,
    state_runtime_disposable_marker_verified: mcpBehaviorVerified,
    legacy_root_requests_observed: legacyRootRequestCount,
    runtime_state_physical_path_verified: true,
    path_fixture_skip_reason: pathFixtureSkipReason,
    provider_credentials_required: false,
    provider_or_proxy_requests: proxyRequestCount,
    repository_database_unchanged: true,
    owned_process_count_before: ownedProcessCountBefore,
    owned_process_count_after: ownedProcessCountAfter,
    ambient_supervisor_process_count_before: ambientRuntimeProcessesBefore.length,
    ambient_supervisor_process_count_after: ambientRuntimeProcessesAfter.length,
    owned_ports_after: 0,
    runtime_state_files_after: 0,
    disposable_database_preserved: true,
  };
  summary.normalized_public_result_sha256 = createHash("sha256")
    .update(
      JSON.stringify({
        test: summary.test,
        status: summary.status,
        canonical_commands: summary.canonical_commands,
        real_processes: summary.real_processes,
        loopback_only: summary.loopback_only,
        ready_state_verified: summary.ready_state_verified,
        duplicate_launch_reused: summary.duplicate_launch_reused,
        graceful_stop: summary.graceful_stop,
        parent_signal_cleanup: summary.parent_signal_cleanup,
        required_child_failure_observed: summary.required_child_failure_observed,
        unverified_pid_never_signaled: summary.unverified_pid_never_signaled,
        reviewed_ui_provider_environment_verified:
          summary.reviewed_ui_provider_environment_verified,
        bridge_core_mode: summary.bridge_core_mode,
        public_mcp_mock_tool_verified: summary.public_mcp_mock_tool_verified,
        state_runtime_mcp_tool_verified: summary.state_runtime_mcp_tool_verified,
        state_runtime_disposable_marker_verified:
          summary.state_runtime_disposable_marker_verified,
        legacy_root_requests_observed: summary.legacy_root_requests_observed,
        runtime_state_physical_path_verified:
          summary.runtime_state_physical_path_verified,
        provider_or_proxy_requests: summary.provider_or_proxy_requests,
        repository_database_unchanged: summary.repository_database_unchanged,
        owned_process_count_after: summary.owned_process_count_after,
        owned_ports_after: summary.owned_ports_after,
        runtime_state_files_after: summary.runtime_state_files_after,
      }),
    )
    .digest("hex");
  console.log(JSON.stringify(summary, null, 2));
} finally {
  for (const managed of trackedSupervisors) {
    await terminateManagedProcess(managed);
  }
  if (unrelatedIdentityServer) await closeServer(unrelatedIdentityServer);
  if (proxyServer) await closeServer(proxyServer);
  if (unrelatedProcess && unrelatedProcess.exitCode === null) {
    unrelatedProcess.kill("SIGTERM");
    await waitForExit(unrelatedProcess, 5_000).catch(() => {
      unrelatedProcess.kill("SIGKILL");
    });
  }
  rmSync(temporaryRoot, { recursive: true, force: true });
}

async function testRuntimeStatePathSafety() {
  const fixtureRoot = path.join(temporaryRoot, "runtime-path-safety");
  const fakeRepositoryRoot = path.join(fixtureRoot, "fake-repository");
  const outsideRoot = path.join(fixtureRoot, "outside");
  mkdirSync(fakeRepositoryRoot, { recursive: true });
  mkdirSync(outsideRoot, { recursive: true });
  writeFileSync(path.join(fakeRepositoryRoot, "repository-sentinel"), "unchanged\n");
  const fakeRepositoryBefore = listRelativeEntriesRecursively(fakeRepositoryRoot);

  const normalOutside = path.join(outsideRoot, "normal", "runtime-state");
  const normalResolution = resolvePhysicalRuntimeStateDestination({
    candidate: normalOutside,
    repositoryRoot: fakeRepositoryRoot,
  });
  assert.equal(
    normalResolution.physical_destination,
    path.join(realpathSync(outsideRoot), "normal", "runtime-state"),
  );
  assert.equal(
    ensureRuntimeDirectory({
      directory: normalOutside,
      repositoryRoot: fakeRepositoryRoot,
    }),
    realpathSync(normalOutside),
  );

  const directInside = path.join(fakeRepositoryRoot, "direct-inside");
  assertRuntimePathError(
    () =>
      resolvePhysicalRuntimeStateDestination({
        candidate: directInside,
        repositoryRoot: fakeRepositoryRoot,
      }),
    "runtime_state_path_must_be_outside_repository",
    [directInside, fakeRepositoryRoot, publicSecretSentinel],
  );
  assert.equal(existsSync(directInside), false);

  const outsideLink = path.join(fixtureRoot, "outside-link");
  if (!createDirectoryLink(outsideRoot, outsideLink)) {
    assert.deepEqual(
      listRelativeEntriesRecursively(fakeRepositoryRoot),
      fakeRepositoryBefore,
    );
    return;
  }

  const acceptedViaLink = path.join(outsideLink, "linked", "runtime-state");
  const linkedResolution = resolvePhysicalRuntimeStateDestination({
    candidate: acceptedViaLink,
    repositoryRoot: fakeRepositoryRoot,
  });
  assert.equal(
    linkedResolution.physical_destination,
    path.join(realpathSync(outsideRoot), "linked", "runtime-state"),
  );
  ensureRuntimeDirectory({
    directory: acceptedViaLink,
    repositoryRoot: fakeRepositoryRoot,
  });
  assert.equal(
    realpathSync(acceptedViaLink),
    path.join(realpathSync(outsideRoot), "linked", "runtime-state"),
  );

  const nestedMissing = path.join(outsideLink, "missing-one", "missing-two", "runtime");
  const nestedResolution = resolvePhysicalRuntimeStateDestination({
    candidate: nestedMissing,
    repositoryRoot: fakeRepositoryRoot,
  });
  assert.equal(
    nestedResolution.physical_destination,
    path.join(realpathSync(outsideRoot), "missing-one", "missing-two", "runtime"),
  );

  const repositoryLink = path.join(fixtureRoot, "repository-link");
  assert.equal(createDirectoryLink(fakeRepositoryRoot, repositoryLink), true);
  const redirectedInside = path.join(repositoryLink, "redirected", "runtime-state");
  assertRuntimePathError(
    () =>
      resolvePhysicalRuntimeStateDestination({
        candidate: redirectedInside,
        repositoryRoot: fakeRepositoryRoot,
      }),
    "runtime_state_path_must_be_outside_repository",
    [redirectedInside, fakeRepositoryRoot, publicSecretSentinel],
  );
  assert.equal(
    existsSync(path.join(fakeRepositoryRoot, "redirected")),
    false,
    "a symlinked parent into the repository must be refused before mkdir",
  );

  const symlinkTarget = path.join(outsideRoot, "existing-runtime-target");
  const runtimeDirectoryLink = path.join(fixtureRoot, "runtime-directory-link");
  mkdirSync(symlinkTarget, { recursive: true });
  assert.equal(createDirectoryLink(symlinkTarget, runtimeDirectoryLink), true);
  assertRuntimePathError(
    () =>
      resolveRuntimePaths({
        environment: { AUGNES_RUNTIME_STATE_DIR: runtimeDirectoryLink },
        repositoryRootPath: fakeRepositoryRoot,
        repositoryFingerprint: "path-safety-fixture",
      }),
    "runtime_state_directory_invalid",
    [runtimeDirectoryLink, fakeRepositoryRoot, publicSecretSentinel],
  );
  assert.equal(lstatSync(runtimeDirectoryLink).isSymbolicLink(), true);

  const checkoutLink = path.join(fixtureRoot, "actual-checkout-link");
  assert.equal(createDirectoryLink(repoRoot, checkoutLink), true);
  const repositorySideName = `.augnes-runtime-path-safety-${path.basename(temporaryRoot)}`;
  const repositorySideDirectory = path.join(repoRoot, repositorySideName);
  assert.equal(existsSync(repositorySideDirectory), false);
  const publicScenario = {
    name: "runtime-path-public-error",
    root: fixtureRoot,
    stateDirectory: path.join(checkoutLink, repositorySideName),
    logRoot: path.join(logRoot, "runtime-path-public-error"),
  };
  mkdirSync(publicScenario.logRoot, { recursive: true });
  const publicEnvironment = scenarioEnvironment(publicScenario, {
    uiPort: DEFAULT_UI_PORT,
    bridgePort: DEFAULT_BRIDGE_PORT,
    providerMode: "absent",
  });
  const publicResult = await runCli(
    ["status"],
    publicEnvironment,
    publicScenario,
    "symlinked-repository-refusal",
  );
  assert.equal(publicResult.code, 2, publicResult.output);
  assert.deepEqual(lastJsonResult(publicResult.stdout), {
    schema_version: RUNTIME_SCHEMA_VERSION,
    contract: RUNTIME_CONTRACT,
    command: "status",
    result: "failed",
    state: "unavailable",
    reason: "runtime_state_path_must_be_outside_repository",
  });
  for (const forbidden of [
    publicScenario.stateDirectory,
    repoRoot,
    publicSecretSentinel,
    publicModelSentinel,
    "control-token.json",
    "bridge-supervisor.env",
  ]) {
    assert.equal(
      publicResult.output.includes(forbidden),
      false,
      "public runtime-path refusal must expose only the stable reason",
    );
  }
  assert.equal(existsSync(repositorySideDirectory), false);
  assert.deepEqual(
    listRelativeEntriesRecursively(fakeRepositoryRoot),
    fakeRepositoryBefore,
    "path safety checks must leave the fake repository unchanged",
  );
  removeScenarioLogs(publicScenario);
}

async function testReadyDuplicateStatusAndStop() {
  const scenario = createScenario("ready-stop");
  const uiBlocker = await createTcpSentinel(DEFAULT_UI_PORT);
  const bridgeBlocker = await createTcpSentinel(DEFAULT_BRIDGE_PORT);
  const environment = scenarioEnvironment(scenario, {
    uiPort: uiBlocker.port,
    bridgePort: bridgeBlocker.port,
    providerMode: "absent",
  });

  const managed = startManagedSupervisor(
    environment,
    scenario,
    "ready-stop",
    "canonical",
  );
  const ready = await waitForJsonEvent(
    managed,
    (event) => event.command === "start" && event.result === "ready",
  );
  assertReadyResult(ready);
  assert.notEqual(ready.ui_port, uiBlocker.port, "occupied UI port must be skipped");
  assert.notEqual(ready.bridge_port, bridgeBlocker.port, "occupied bridge port must be skipped");
  selectedPorts.push({ scenario: scenario.name, ui: ready.ui_port, bridge: ready.bridge_port });
  rememberOwnedPids(ready);

  assert.equal(await canConnect(uiBlocker.port), true, "unrelated UI listener must remain alive");
  assert.equal(
    await canConnect(bridgeBlocker.port),
    true,
    "unrelated bridge listener must remain alive",
  );
  if (uiBlocker.connectionCount) {
    assert.equal(uiBlocker.connectionCount() > 0, true, "occupied UI listener must remain responsive");
  }
  if (bridgeBlocker.connectionCount) {
    assert.equal(
      bridgeBlocker.connectionCount() > 0,
      true,
      "occupied bridge listener must remain responsive",
    );
  }

  await assertReadyEndpoints(ready, environment, scenario, managed);
  await assertLoopbackOnly(ready.ui_port);
  await assertLoopbackOnly(ready.bridge_port);
  const manifest = assertOwnershipFiles(scenario.stateDirectory, ready);
  assertPublicSafe(JSON.stringify(manifest), "manifest");
  assertPublicSafe(managed.output(), "start output");

  const databaseBeforeStatus = snapshotDatabaseFamily(databasePath);
  const status = await runCli(
    ["status"],
    environment,
    scenario,
    "status",
    "canonical",
  );
  assert.equal(status.code, 0, status.output);
  const statusResult = lastJsonResult(status.stdout);
  assert.equal(statusResult.state, "ready");
  assert.equal(statusResult.verified, true);
  assert.equal(statusResult.effective_url, ready.effective_url);
  assert.deepEqual(statusResult.children, ready.children);
  assertPublicSafe(status.output, "status output");
  assert.deepEqual(
    snapshotDatabaseFamily(databasePath),
    databaseBeforeStatus,
    "status must not mutate the disposable DB or side files",
  );

  const duplicate = await runCli(
    ["--webpack", "--hostname", "127.0.0.1", "--port", String(uiBlocker.port)],
    environment,
    scenario,
    "duplicate",
    "dev",
  );
  assert.equal(duplicate.code, 0, duplicate.output);
  const duplicateResult = lastJsonResult(duplicate.stdout);
  assert.equal(duplicateResult.result, "existing");
  assert.equal(duplicateResult.instance_id, ready.instance_id);
  assert.deepEqual(duplicateResult.children, ready.children);
  assertPublicSafe(duplicate.output, "duplicate output");
  assert.equal(managed.child.exitCode, null, "the original supervisor must remain alive");

  const widenedHost = await runCli(
    ["--hostname", "0.0.0.0"],
    environment,
    scenario,
    "non-loopback-refusal",
    "dev",
  );
  assert.equal(widenedHost.code, 2, widenedHost.output);
  assert.equal(lastJsonResult(widenedHost.stdout).reason, "non_loopback_hostname_refused");
  assertPublicSafe(widenedHost.output, "non-loopback refusal output");
  assert.equal(managed.child.exitCode, null, "a refused bind override must not affect the runtime");

  const ownedProcessTree = processTreePids(ready);
  for (const pid of ownedProcessTree) observedOwnedPids.add(pid);
  const databaseBeforeStop = snapshotDatabaseFamily(databasePath);
  const stop = await runCli(["stop"], environment, scenario, "stop", "canonical");
  assert.equal(stop.code, 0, stop.output);
  assert.equal(lastJsonResult(stop.stdout).state, "stopped");
  const supervisorExit = await waitForExit(managed.child, 20_000);
  assert.equal(supervisorExit.code, 0, managed.output());
  trackedSupervisors.delete(managed);

  await assertStoppedScenario(scenario, ready, ownedProcessTree);
  assert.equal(await canConnect(uiBlocker.port), true, "unrelated UI listener must survive stop");
  assert.equal(
    await canConnect(bridgeBlocker.port),
    true,
    "unrelated bridge listener must survive stop",
  );
  assert.equal(
    hashFile(databasePath),
    databaseBeforeStop.get(databasePath)?.sha256,
    "graceful stop must preserve the disposable database",
  );

  if (uiBlocker.server) await closeServer(uiBlocker.server);
  if (bridgeBlocker.server) await closeServer(bridgeBlocker.server);
  removeScenarioLogs(scenario);
}

async function testPoisonedEnvironmentRestart(proxyPort) {
  const scenario = createScenario("poisoned-restart");
  const uiBlocker = await createTcpSentinel(DEFAULT_UI_PORT);
  const bridgeBlocker = await createTcpSentinel(DEFAULT_BRIDGE_PORT);
  const environment = scenarioEnvironment(scenario, {
    uiPort: uiBlocker.port,
    bridgePort: bridgeBlocker.port,
    providerMode: "poisoned",
    proxyPort,
  });
  environment.AUGNES_UNRELATED_PID_SENTINEL = String(unrelatedProcess.pid);
  environment.AUGNES_REPOSITORY_DB_SENTINEL = repositoryDatabasePath;

  const managed = startManagedSupervisor(environment, scenario, "poisoned-restart");
  const ready = await waitForJsonEvent(
    managed,
    (event) => event.command === "start" && event.result === "ready",
  );
  assertReadyResult(ready);
  assert.notEqual(ready.ui_port, uiBlocker.port);
  assert.notEqual(ready.bridge_port, bridgeBlocker.port);
  selectedPorts.push({ scenario: scenario.name, ui: ready.ui_port, bridge: ready.bridge_port });
  rememberOwnedPids(ready);
  const bridgeHealth = await fetchJson(
    `http://127.0.0.1:${ready.bridge_port}/healthz`,
  );
  assert.equal(bridgeHealth.statusCode, 200);
  assert.equal(bridgeHealth.body.mode, "mock");
  assert.equal(bridgeHealth.body.runtime_instance_id, ready.instance_id);
  assert.equal(bridgeHealth.body.profile, "chrono_lab");
  assertPublicSafe(JSON.stringify(bridgeHealth.body), "poisoned bridge health");
  assertOwnershipFiles(scenario.stateDirectory, ready);
  assertPublicSafe(managed.output(), "poisoned start output");
  assertProcessCommandLinesPublicSafe(processTreePids(ready));
  assert.equal(proxyRequestCount, 0, "poisoned proxy variables must not reach runtime children");
  assert.equal(isProcessAlive(unrelatedProcess.pid), true, "unrelated PID sentinel must stay alive");

  const status = await runCli(["status"], environment, scenario, "poisoned-status");
  assert.equal(status.code, 0, status.output);
  assertPublicSafe(status.output, "poisoned status output");

  const processTree = processTreePids(ready);
  for (const pid of processTree) observedOwnedPids.add(pid);
  const stop = await runCli(["stop"], environment, scenario, "poisoned-stop");
  assert.equal(stop.code, 0, stop.output);
  assertPublicSafe(stop.output, "poisoned stop output");
  const supervisorExit = await waitForExit(managed.child, 20_000);
  assert.equal(supervisorExit.code, 0, managed.output());
  assertPublicSafe(managed.output(), "poisoned lifecycle output");
  trackedSupervisors.delete(managed);
  await assertStoppedScenario(scenario, ready, processTree);
  assert.equal(proxyRequestCount, 0, "restart must not make provider/proxy requests");
  assert.equal(isProcessAlive(unrelatedProcess.pid), true, "restart/stop must not signal unrelated PID");
  assert.equal(await canConnect(uiBlocker.port), true, "poisoned UI blocker must survive");
  assert.equal(await canConnect(bridgeBlocker.port), true, "poisoned bridge blocker must survive");
  assertDirectoryPublicSafe(scenario.logRoot, "poisoned lifecycle logs");
  if (uiBlocker.server) await closeServer(uiBlocker.server);
  if (bridgeBlocker.server) await closeServer(bridgeBlocker.server);
  removeScenarioLogs(scenario);
}

async function testParentSignalCleanup() {
  const scenario = createScenario("parent-signal");
  const environment = scenarioEnvironment(scenario, {
    uiPort: await findPreferredPort(),
    bridgePort: await findPreferredPort(),
    providerMode: "absent",
  });
  const managed = startManagedSupervisor(environment, scenario, "parent-signal");
  const ready = await waitForJsonEvent(
    managed,
    (event) => event.command === "start" && event.result === "ready",
  );
  assertReadyResult(ready);
  selectedPorts.push({ scenario: scenario.name, ui: ready.ui_port, bridge: ready.bridge_port });
  rememberOwnedPids(ready);
  const processTree = processTreePids(ready);
  for (const pid of processTree) observedOwnedPids.add(pid);

  managed.child.kill("SIGTERM");
  const exit = await waitForExit(managed.child, 20_000);
  assert.equal(exit.code, 0, managed.output());
  trackedSupervisors.delete(managed);
  await assertStoppedScenario(scenario, ready, processTree);
  assert.match(managed.output(), /signal_sigterm/, "signal cleanup result must be observable");
  removeScenarioLogs(scenario);
}

async function testRequiredChildFailure() {
  const scenario = createScenario("child-failure");
  const environment = scenarioEnvironment(scenario, {
    uiPort: await findPreferredPort(),
    bridgePort: await findPreferredPort(),
    providerMode: "absent",
  });
  const managed = startManagedSupervisor(environment, scenario, "child-failure");
  const ready = await waitForJsonEvent(
    managed,
    (event) => event.command === "start" && event.result === "ready",
  );
  assertReadyResult(ready);
  selectedPorts.push({ scenario: scenario.name, ui: ready.ui_port, bridge: ready.bridge_port });
  rememberOwnedPids(ready);
  const processTree = processTreePids(ready);
  for (const pid of processTree) observedOwnedPids.add(pid);
  const bridge = ready.children.find((child) => child.role === "bridge");
  assert(bridge, "ready result must identify the bridge child");

  process.kill(bridge.pid, "SIGKILL");
  const failed = await waitForJsonEvent(
    managed,
    (event) =>
      event.command === "start" &&
      event.result === "failed" &&
      event.reason === "required_child_exited",
  );
  assert.equal(failed.failed_role, "bridge");
  const exit = await waitForExit(managed.child, 20_000);
  assert.notEqual(exit.code, 0, "required child failure must make supervisor nonzero");
  trackedSupervisors.delete(managed);
  await assertStoppedScenario(scenario, ready, processTree);
  assertPublicSafe(managed.output(), "child failure output");
  removeScenarioLogs(scenario);
}

async function testUnverifiedOwnershipRefusal() {
  const scenario = createScenario("unverified-owner");
  unrelatedIdentityServer = createHttpServer((_request, response) => {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(
      JSON.stringify({
        schema_version: RUNTIME_SCHEMA_VERSION,
        contract: "unrelated-service",
        state: "ready",
      }),
    );
  });
  const controlPort = await listenHttpServer(unrelatedIdentityServer);
  const environment = scenarioEnvironment(scenario, {
    uiPort: await findPreferredPort(),
    bridgePort: await findPreferredPort(),
    providerMode: "absent",
  });
  const fakeManifest = {
    schema_version: RUNTIME_SCHEMA_VERSION,
    contract: RUNTIME_CONTRACT,
    instance_id: "unverified-live-pid-sentinel",
    repository_fingerprint: createHash("sha256").update(repoRoot).digest("hex"),
    supervisor_pid: unrelatedProcess.pid,
    control_host: "127.0.0.1",
    control_port: controlPort,
    children: [],
    effective_url: "http://127.0.0.1:65500",
    ui_port: 65500,
    bridge_port: 65499,
    lifecycle_state: "ready",
    started_at: new Date(0).toISOString(),
    last_transition_at: new Date(0).toISOString(),
    failure: null,
  };
  const manifestPath = path.join(scenario.stateDirectory, "runtime.json");
  writeFileSync(manifestPath, `${JSON.stringify(fakeManifest)}\n`, { mode: 0o600 });
  chmodSync(manifestPath, 0o600);

  const status = await runCli(["status"], environment, scenario, "unverified-status");
  assert.equal(status.code, 2, status.output);
  const statusResult = lastJsonResult(status.stdout);
  assert.equal(statusResult.state, "unavailable");
  assert.equal(statusResult.verified, false);
  assert.equal("supervisor_pid" in statusResult, false, "unverified PID must not be echoed");
  assertPublicSafe(status.output, "unverified status output");
  assert.equal(isProcessAlive(unrelatedProcess.pid), true, "status must not signal unrelated PID");

  const stop = await runCli(["stop"], environment, scenario, "unverified-stop");
  assert.equal(stop.code, 2, stop.output);
  const stopResult = lastJsonResult(stop.stdout);
  assert.equal(stopResult.result, "refused");
  assert.equal(stopResult.reason, "ownership_unverified");
  assert.equal(isProcessAlive(unrelatedProcess.pid), true, "stop must not signal unrelated PID");
  assert.equal(await canConnect(controlPort), true, "unrelated control listener must remain alive");

  unlinkSync(manifestPath);
  await closeServer(unrelatedIdentityServer);
  unrelatedIdentityServer = null;
  assertNoRuntimeStateFiles(scenario.stateDirectory);
  removeScenarioLogs(scenario);
}

function createScenario(name) {
  const root = path.join(temporaryRoot, "scenarios", name);
  const stateDirectory = path.join(root, "runtime-state");
  const scenarioLogRoot = path.join(logRoot, name);
  mkdirSync(stateDirectory, { recursive: true, mode: 0o700 });
  mkdirSync(scenarioLogRoot, { recursive: true });
  return { name, root, stateDirectory, logRoot: scenarioLogRoot };
}

function scenarioEnvironment(
  scenario,
  { uiPort, bridgePort, providerMode, proxyPort = null },
) {
  const environment = {
    ...process.env,
    HOME: homeRoot,
    USERPROFILE: homeRoot,
    TMPDIR: tempRoot,
    TMP: tempRoot,
    TEMP: tempRoot,
    AUGNES_RUNTIME_STATE_DIR: scenario.stateDirectory,
    AUGNES_RUNTIME_LOG_DIR: scenario.logRoot,
    AUGNES_DB_PATH: databasePath,
    AUGNES_UI_PREFERRED_PORT: String(uiPort),
    AUGNES_BRIDGE_PREFERRED_PORT: String(bridgePort),
  };

  for (const key of [
    "OPENAI_API_KEY",
    "OPENAI_MODEL",
    "GITHUB_TOKEN",
    "GH_TOKEN",
    "HTTP_PROXY",
    "HTTPS_PROXY",
    "ALL_PROXY",
    "NO_PROXY",
    "http_proxy",
    "https_proxy",
    "all_proxy",
    "no_proxy",
    "ANTHROPIC_API_KEY",
    "AZURE_OPENAI_API_KEY",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "GOOGLE_API_KEY",
    "AUGNES_CORE_MODE",
    "AUGNES_USE_MOCK",
    "AUGNES_ENABLE_AGENT_BRIDGE",
    "AUGNES_APP_PROFILE",
    "AUGNES_APP_TOOL_SURFACE",
    "AUGNES_APP_DOMAIN",
    "AUGNES_CONNECT_DOMAIN",
    "AUGNES_RESOURCE_DOMAIN",
    "AUGNES_WORKING_VIEW_FILE",
    "AUGNES_CASEFILE_FILE",
    "AUGNES_EVIDENCE_INDEX_FILE",
    "AUGNES_CONTINUITY_REPORT_FILE",
    "AUGNES_BOUNDARY_PACKET_FILE",
    "AUGNES_STRATEGY_RATIONALE_FILE",
    "AUGNES_GOVERNANCE_AUDIT_FILE",
    "AUGNES_REPO_NAVIGATION_FILE",
  ]) {
    delete environment[key];
  }

  if (providerMode === "poisoned") {
    const proxyUrl = `http://127.0.0.1:${proxyPort}`;
    Object.assign(environment, {
      OPENAI_API_KEY: publicSecretSentinel,
      OPENAI_MODEL: publicModelSentinel,
      GITHUB_TOKEN: publicSecretSentinel,
      GH_TOKEN: publicSecretSentinel,
      ANTHROPIC_API_KEY: publicSecretSentinel,
      AZURE_OPENAI_API_KEY: publicSecretSentinel,
      AWS_ACCESS_KEY_ID: publicSecretSentinel,
      AWS_SECRET_ACCESS_KEY: publicSecretSentinel,
      GOOGLE_API_KEY: publicSecretSentinel,
      HTTP_PROXY: proxyUrl,
      HTTPS_PROXY: proxyUrl,
      ALL_PROXY: proxyUrl,
      NO_PROXY: "poisoned-no-proxy-value",
      AUGNES_UNRELATED_PARENT_VALUE: publicSecretSentinel,
      AUGNES_CORE_MODE: "http",
      AUGNES_USE_MOCK: "false",
      AUGNES_ENABLE_AGENT_BRIDGE: "false",
      ...blockedBridgeFileEnvironment,
      ...reviewedBridgeCompatibilityEnvironment,
    });
  }

  return environment;
}

function startManagedSupervisor(environment, scenario, label, surface = "direct") {
  const managed = spawnManaged(["start"], environment, scenario, label, surface);
  trackedSupervisors.add(managed);
  return managed;
}

function spawnManaged(args, environment, scenario, label, surface = "direct") {
  const stdoutLog = path.join(scenario.logRoot, `${label}.stdout.log`);
  const stderrLog = path.join(scenario.logRoot, `${label}.stderr.log`);
  const invocation = buildInvocation(surface, args);
  const child = spawn(invocation.command, invocation.args, {
    cwd: repoRoot,
    env: environment,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  const managed = {
    child,
    stdout: "",
    stderr: "",
    stdoutRemainder: "",
    events: [],
    stdoutLog,
    stderrLog,
    output() {
      return `${this.stdout}\n${this.stderr}`;
    },
  };
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    managed.stdout += chunk;
    appendFileSync(stdoutLog, chunk, { mode: 0o600 });
    managed.stdoutRemainder += chunk;
    const lines = managed.stdoutRemainder.split(/\r?\n/);
    managed.stdoutRemainder = lines.pop() ?? "";
    for (const line of lines) {
      const parsed = parseJsonLine(line);
      if (parsed) managed.events.push(parsed);
    }
  });
  child.stderr.on("data", (chunk) => {
    managed.stderr += chunk;
    appendFileSync(stderrLog, chunk, { mode: 0o600 });
  });
  return managed;
}

async function runCli(args, environment, scenario, label, surface = "direct") {
  const managed = spawnManaged(args, environment, scenario, label, surface);
  const exit = await waitForExit(managed.child, 25_000);
  if (managed.stdoutRemainder.length > 0) {
    const parsed = parseJsonLine(managed.stdoutRemainder);
    if (parsed) managed.events.push(parsed);
  }
  return {
    code: exit.code,
    signal: exit.signal,
    stdout: managed.stdout,
    stderr: managed.stderr,
    output: managed.output(),
  };
}

function buildInvocation(surface, args) {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  if (surface === "canonical") {
    return { command: npmCommand, args: ["run", "augnes", "--", ...args] };
  }
  if (surface === "dev") {
    return { command: npmCommand, args: ["run", "dev", "--", ...args] };
  }
  return { command: process.execPath, args: [supervisorScript, ...args] };
}

async function waitForJsonEvent(managed, predicate, timeoutMs = 100_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const match = managed.events.find(predicate);
    if (match) return match;
    if (managed.child.exitCode !== null) {
      throw new Error(
        `managed runtime exited before expected event (${managed.child.exitCode}): ${managed.output()}`,
      );
    }
    await delay(50);
  }
  throw new Error(`timed out waiting for runtime event: ${managed.output()}`);
}

function parseJsonLine(line) {
  try {
    const value = JSON.parse(line);
    return value && typeof value === "object" ? value : null;
  } catch {
    return null;
  }
}

function lastJsonResult(output) {
  const parsed = output
    .split(/\r?\n/)
    .map(parseJsonLine)
    .filter(Boolean);
  assert(parsed.length > 0, `expected JSON command output: ${output}`);
  return parsed.at(-1);
}

function assertReadyResult(result) {
  assert.equal(result.schema_version, RUNTIME_SCHEMA_VERSION);
  assert.equal(result.contract, RUNTIME_CONTRACT);
  assert.equal(result.state, "ready");
  assert.equal(result.verified, true);
  assert.equal(result.effective_url, `http://127.0.0.1:${result.ui_port}`);
  assert(Number.isInteger(result.supervisor_pid));
  assert.deepEqual(
    result.children.map((child) => child.role).sort(),
    ["bridge", "ui"],
  );
  for (const child of result.children) {
    assert(Number.isInteger(child.pid) && child.pid > 0);
    assert.equal(child.state, "ready");
    assert.equal(isProcessAlive(child.pid), true);
  }
}

async function assertReadyEndpoints(ready, environment, scenario, managed) {
  const uiHealth = await fetchJson(`${ready.effective_url}/api/healthz`);
  assert.equal(uiHealth.statusCode, 200);
  assert.equal(uiHealth.body.runtime_instance_id, ready.instance_id);
  assert.equal(uiHealth.body.status, "ready");

  const rootResponse = await fetch(`${ready.effective_url}/`, {
    signal: AbortSignal.timeout(15_000),
  });
  assert.equal(rootResponse.status, 200, "real UI root must render successfully");
  await rootResponse.arrayBuffer();

  const bridgeHealth = await fetchJson(`http://127.0.0.1:${ready.bridge_port}/healthz`);
  assert.equal(bridgeHealth.statusCode, 200);
  assert.equal(bridgeHealth.body.runtime_instance_id, ready.instance_id);
  assert.equal(bridgeHealth.body.ok, true);
  assert.equal(bridgeHealth.body.mode, "mock");
  assertPublicSafe(JSON.stringify(uiHealth.body), "UI health response");
  assertPublicSafe(JSON.stringify(bridgeHealth.body), "bridge health response");
  await assertSupervisedMcpAdapterSplit({ environment, ready, scenario, managed });
}

async function assertSupervisedMcpAdapterSplit({ environment, ready, scenario, managed }) {
  const values = buildSupervisorChildValues({
    role: "bridge",
    environment,
    paths: { bridgeEnvironment: path.join(scenario.stateDirectory, "bridge-supervisor.env") },
    instanceId: ready.instance_id,
    effectiveUrl: ready.effective_url,
    port: ready.bridge_port,
  });
  const childEnvironment = buildRuntimeChildEnvironment({
    role: "bridge",
    ambientEnvironment: environment,
    values,
  });
  assert.equal(values.AUGNES_CORE_MODE, "mock");
  assert.equal(values.AUGNES_API_BASE_URL, ready.effective_url);
  assert.equal(values.AUGNES_ENABLE_AGENT_BRIDGE, "true");
  assert.equal(values.AUGNES_RUNTIME_INSTANCE_ID, ready.instance_id);
  assert.equal(childEnvironment.AUGNES_CORE_MODE, "mock");
  assert.equal(childEnvironment.AUGNES_API_BASE_URL, ready.effective_url);
  assert.equal(childEnvironment.AUGNES_ENABLE_AGENT_BRIDGE, "true");
  assert.equal(childEnvironment.AUGNES_RUNTIME_INSTANCE_ID, ready.instance_id);
  assert.equal(Object.hasOwn(childEnvironment, "OPENAI_API_KEY"), false);
  assert.equal(Object.hasOwn(childEnvironment, "OPENAI_MODEL"), false);

  const databaseBeforeMcpReads = snapshotDatabaseFamily(databasePath);
  const { Client } = requireMcpSdk("@modelcontextprotocol/sdk/client/index.js");
  const { StreamableHTTPClientTransport } = requireMcpSdk(
    "@modelcontextprotocol/sdk/client/streamableHttp.js",
  );
  const client = new Client({
    name: "augnes-runtime-operability",
    version: "0.1.0",
  });
  const transport = new StreamableHTTPClientTransport(
    new URL(`http://127.0.0.1:${ready.bridge_port}/mcp`),
  );

  let publicResult;
  let runtimeResult;
  try {
    await withTimeout(client.connect(transport), 15_000, "MCP client connect");
    const tools = await withTimeout(client.listTools(), 15_000, "MCP tool listing");
    const toolNames = tools.tools.map((tool) => tool.name);
    assert.equal(toolNames.includes("get_working_view"), true);
    assert.equal(toolNames.includes("augnes_get_state_brief"), true);

    publicResult = await withTimeout(
      client.callTool({
        name: "get_working_view",
        arguments: { scope: runtimeMarkerScope },
      }),
      15_000,
      "public MCP tool call",
    );
    assert.notEqual(publicResult.isError, true);
    assert.equal(Object.hasOwn(publicResult.structuredContent ?? {}, "error"), false);
    assert.deepEqual(publicResult.structuredContent?.workingView?.claimIds, [
      "claim-augnes-app-01",
    ]);
    assert.equal(
      publicResult.structuredContent?.workingView?.summary,
      "Shipping Augnes as an Evidence & Continuity Console inside ChatGPT. Current emphasis: read-only tools, strong rationale surface, boundary packet review, continuity visibility.",
    );

    runtimeResult = await withTimeout(
      client.callTool({
        name: "augnes_get_state_brief",
        arguments: { scope: runtimeMarkerScope },
      }),
      15_000,
      "state runtime MCP tool call",
    );
    assert.notEqual(runtimeResult.isError, true);
    assert.equal(Object.hasOwn(runtimeResult.structuredContent ?? {}, "error"), false);
    const stateBrief = runtimeResult.structuredContent?.brief;
    assert.equal(stateBrief?.scope, runtimeMarkerScope);
    assert.equal(Array.isArray(stateBrief?.active_state), true);
    const markerEntry = stateBrief.active_state.find(
      (entry) => entry?.state_key === runtimeMarkerStateKey,
    );
    assert.equal(markerEntry?.value, runtimeMarkerValue);
  } finally {
    await withTimeout(client.close(), 10_000, "MCP client close");
  }

  const mcpPublicOutput = JSON.stringify({ publicResult, runtimeResult });
  assertPublicSafe(mcpPublicOutput, "real MCP tool results");
  assert.equal(mcpPublicOutput.includes(runtimeMarkerValue), true);
  assert.deepEqual(
    snapshotDatabaseFamily(databasePath),
    databaseBeforeMcpReads,
    "read-only MCP tool calls must not mutate the disposable DB or side files",
  );

  const legacyRoutePattern = /\b(?:GET|POST)\s+\/(?:search|working-view|casefile|strategy|boundary-packet|continuity-report|repo\/navigate|governance-audit)(?:[?\s]|$)/g;
  const legacyRequests = managed.output().match(legacyRoutePattern) ?? [];
  legacyRootRequestCount += legacyRequests.length;
  assert.deepEqual(
    legacyRequests,
    [],
    "legacy public MCP tools must not target proposed dev-read API paths on the root runtime",
  );
  mcpBehaviorVerified = true;
}

function assertOwnershipFiles(stateDirectory, ready) {
  const expected = [
    "bridge-supervisor.env",
    "control-token.json",
    "owner.lock",
    "runtime.json",
  ];
  assert.deepEqual(readdirSync(stateDirectory).sort(), expected);
  const directoryMode = statSync(stateDirectory).mode & 0o777;
  if (process.platform !== "win32") assert.equal(directoryMode, 0o700);
  for (const name of expected) {
    const filePath = path.join(stateDirectory, name);
    const mode = statSync(filePath).mode & 0o777;
    if (process.platform !== "win32") assert.equal(mode, 0o600, `${name} must be mode 0600`);
    const contents = readFileSync(filePath, "utf8");
    assertPublicSafe(contents, `${name} contents`);
    if (name === "bridge-supervisor.env") {
      assert.equal(contents, "", "the bridge dotenv isolation file must remain empty");
    }
  }
  const manifest = JSON.parse(readFileSync(path.join(stateDirectory, "runtime.json"), "utf8"));
  assert.equal(manifest.instance_id, ready.instance_id);
  assert.equal(manifest.supervisor_pid, ready.supervisor_pid);
  assert.equal(manifest.lifecycle_state, "ready");
  assert.equal(manifest.control_host, "127.0.0.1");
  assert(Number.isInteger(manifest.control_port));
  assert.equal(manifest.effective_url, ready.effective_url);
  assert.deepEqual(manifest.children, ready.children);
  assert.equal("token" in manifest, false, "public ownership manifest must exclude control token");
  assert.equal("database_path" in manifest, false, "manifest must exclude database path");
  return manifest;
}

async function assertStoppedScenario(scenario, ready, processTree) {
  await waitForPortClosed(ready.ui_port);
  await waitForPortClosed(ready.bridge_port);
  await waitForPidsExit(processTree, 10_000);
  assertNoRuntimeStateFiles(scenario.stateDirectory);
  for (const suffix of ["-wal", "-shm", "-journal"]) {
    assert.equal(
      existsSync(`${databasePath}${suffix}`),
      false,
      `disposable database side file must be closed after lifecycle test: ${suffix}`,
    );
  }
}

function assertNoRuntimeStateFiles(stateDirectory) {
  if (!existsSync(stateDirectory)) return;
  const files = listFilesRecursively(stateDirectory);
  assert.deepEqual(files, [], `runtime state must be empty after cleanup: ${files.join(", ")}`);
}

function assertRuntimeEnvironmentIsolation() {
  const bridgeEnvironmentPath = path.join(temporaryRoot, "environment-isolation.env");
  writeFileSync(bridgeEnvironmentPath, "", { mode: 0o600 });
  const ambientEnvironment = {
    ...process.env,
    HOME: homeRoot,
    TMPDIR: tempRoot,
    AUGNES_DB_PATH: databasePath,
    OPENAI_API_KEY: publicSecretSentinel,
    OPENAI_MODEL: publicModelSentinel,
    GITHUB_TOKEN: publicSecretSentinel,
    GH_TOKEN: publicSecretSentinel,
    ANTHROPIC_API_KEY: publicSecretSentinel,
    AZURE_OPENAI_API_KEY: publicSecretSentinel,
    AWS_ACCESS_KEY_ID: publicSecretSentinel,
    AWS_SECRET_ACCESS_KEY: publicSecretSentinel,
    GOOGLE_API_KEY: publicSecretSentinel,
    HTTP_PROXY: "http://127.0.0.1:9",
    HTTPS_PROXY: "http://127.0.0.1:9",
    ALL_PROXY: "http://127.0.0.1:9",
    NO_PROXY: "poisoned",
    AUGNES_UNRELATED_PARENT_VALUE: publicSecretSentinel,
    AUGNES_CORE_MODE: "file",
    AUGNES_USE_MOCK: "false",
    AUGNES_ENABLE_AGENT_BRIDGE: "false",
    AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "false",
    AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: "reviewed-workspace",
    AUGNES_VNEXT_OPERATOR_PROJECT_ID: "reviewed-project",
    AUGNES_VNEXT_OPERATOR_ID: "reviewed-operator",
    AUGNES_VNEXT_OPERATOR_PREVIEW_MAX_AGE_MS: "45000",
    AUGNES_VNEXT_OPERATOR_GATE_TTL_MS: "60000",
    ...blockedBridgeFileEnvironment,
    ...reviewedBridgeCompatibilityEnvironment,
  };
  const sharedArguments = {
    paths: { bridgeEnvironment: bridgeEnvironmentPath },
    instanceId: "environment-isolation-instance",
    effectiveUrl: "http://127.0.0.1:3000",
    port: 8787,
  };

  const absentProviderEnvironment = { ...ambientEnvironment };
  delete absentProviderEnvironment.OPENAI_API_KEY;
  delete absentProviderEnvironment.OPENAI_MODEL;
  const absentUiValues = buildSupervisorChildValues({
    role: "ui",
    environment: absentProviderEnvironment,
    ...sharedArguments,
  });
  const absentUiEnvironment = buildRuntimeChildEnvironment({
    role: "ui",
    ambientEnvironment: absentProviderEnvironment,
    values: absentUiValues,
  });
  assert.equal(Object.hasOwn(absentUiEnvironment, "OPENAI_API_KEY"), false);
  assert.equal(Object.hasOwn(absentUiEnvironment, "OPENAI_MODEL"), false);

  const uiValues = buildSupervisorChildValues({
    role: "ui",
    environment: ambientEnvironment,
    ...sharedArguments,
  });
  assert.equal(uiValues.OPENAI_API_KEY, publicSecretSentinel);
  assert.equal(uiValues.OPENAI_MODEL, publicModelSentinel);
  assert.equal(uiValues.AUGNES_DB_PATH, databasePath);
  const uiEnvironment = buildRuntimeChildEnvironment({
    role: "ui",
    ambientEnvironment,
    values: uiValues,
  });
  assert.equal(uiEnvironment.OPENAI_API_KEY, publicSecretSentinel);
  assert.equal(uiEnvironment.OPENAI_MODEL, publicModelSentinel);
  assert.equal(uiEnvironment.AUGNES_VNEXT_OPERATOR_PILOT_ENABLED, "false");
  assert.equal(uiEnvironment.AUGNES_VNEXT_OPERATOR_WORKSPACE_ID, "reviewed-workspace");
  assert.equal(uiEnvironment.AUGNES_VNEXT_OPERATOR_PROJECT_ID, "reviewed-project");
  assert.equal(uiEnvironment.AUGNES_VNEXT_OPERATOR_ID, "reviewed-operator");
  assert.equal(uiEnvironment.AUGNES_VNEXT_OPERATOR_PREVIEW_MAX_AGE_MS, "45000");
  assert.equal(uiEnvironment.AUGNES_VNEXT_OPERATOR_GATE_TTL_MS, "60000");

  const bridgeValues = buildSupervisorChildValues({
    role: "bridge",
    environment: ambientEnvironment,
    ...sharedArguments,
  });
  assert.equal(bridgeValues.AUGNES_CORE_MODE, "mock");
  assert.equal(bridgeValues.AUGNES_API_BASE_URL, sharedArguments.effectiveUrl);
  assert.equal(bridgeValues.AUGNES_ENABLE_AGENT_BRIDGE, "true");
  for (const [key, value] of Object.entries(reviewedBridgeCompatibilityEnvironment)) {
    assert.equal(bridgeValues[key], value);
  }
  const bridgeEnvironment = buildRuntimeChildEnvironment({
    role: "bridge",
    ambientEnvironment,
    values: bridgeValues,
  });
  assert.equal(bridgeEnvironment.AUGNES_CORE_MODE, "mock");
  assert.equal(bridgeEnvironment.AUGNES_API_BASE_URL, sharedArguments.effectiveUrl);
  assert.equal(bridgeEnvironment.AUGNES_ENABLE_AGENT_BRIDGE, "true");
  assert.equal(Object.hasOwn(bridgeEnvironment, "OPENAI_API_KEY"), false);
  assert.equal(Object.hasOwn(bridgeEnvironment, "OPENAI_MODEL"), false);
  for (const uiOnlyKey of [
    "AUGNES_DB_PATH",
    "AUGNES_VNEXT_OPERATOR_PILOT_ENABLED",
    "AUGNES_VNEXT_OPERATOR_WORKSPACE_ID",
    "AUGNES_VNEXT_OPERATOR_PROJECT_ID",
    "AUGNES_VNEXT_OPERATOR_ID",
    "AUGNES_VNEXT_OPERATOR_PREVIEW_MAX_AGE_MS",
    "AUGNES_VNEXT_OPERATOR_GATE_TTL_MS",
  ]) {
    assert.equal(Object.hasOwn(bridgeEnvironment, uiOnlyKey), false);
  }

  for (const [role, values, childEnvironment] of [
    ["ui", uiValues, uiEnvironment],
    ["bridge", bridgeValues, bridgeEnvironment],
  ]) {
    assert.deepEqual(
      findForbiddenRuntimeChildEnvironmentKeys({
        role,
        childEnvironment,
        authoredValues: values,
      }),
      [],
    );
    for (const forbidden of [
      "GITHUB_TOKEN",
      "GH_TOKEN",
      "ANTHROPIC_API_KEY",
      "AZURE_OPENAI_API_KEY",
      "AWS_ACCESS_KEY_ID",
      "AWS_SECRET_ACCESS_KEY",
      "GOOGLE_API_KEY",
      "HTTP_PROXY",
      "HTTPS_PROXY",
      "ALL_PROXY",
      "NO_PROXY",
      "AUGNES_UNRELATED_PARENT_VALUE",
      "AUGNES_USE_MOCK",
      ...Object.keys(blockedBridgeFileEnvironment),
    ]) {
      assert.equal(
        Object.hasOwn(childEnvironment, forbidden),
        false,
        `${role} child must not inherit ${forbidden}`,
      );
    }
  }

  for (const key of [
    "OPENAI_API_KEY",
    "OPENAI_MODEL",
    "AUGNES_CORE_MODE",
    "AUGNES_API_BASE_URL",
    "AUGNES_ENABLE_AGENT_BRIDGE",
    "AUGNES_APP_PROFILE",
    "AUGNES_APP_TOOL_SURFACE",
    "AUGNES_APP_DOMAIN",
    "AUGNES_CONNECT_DOMAIN",
    "AUGNES_RESOURCE_DOMAIN",
  ]) {
    assert.equal(
      Object.hasOwn(roleEnvironment(key.startsWith("OPENAI") ? "bridge" : "ui"), key),
      false,
      `${key} must remain limited to its reviewed child role`,
    );
  }

  function roleEnvironment(role) {
    return role === "ui" ? uiEnvironment : bridgeEnvironment;
  }
}

function assertPublicSafe(value, label) {
  assert.equal(value.includes(publicSecretSentinel), false, `${label} exposed secret sentinel`);
  assert.equal(value.includes(publicModelSentinel), false, `${label} exposed model sentinel`);
  assert.doesNotMatch(
    value,
    /OPENAI_API_KEY|OPENAI_MODEL|GITHUB_TOKEN|GH_TOKEN|ANTHROPIC_API_KEY|AZURE_OPENAI_API_KEY|AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|GOOGLE_API_KEY|HTTP_PROXY|HTTPS_PROXY|ALL_PROXY/,
  );
  assert.doesNotMatch(value, /control-token\.json|AUGNES_DB_PATH/);
}

function assertProcessCommandLinesPublicSafe(pids) {
  if (process.platform === "win32") return;
  const result = spawnSync("ps", ["-axo", "pid=,command="], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const owned = new Set(pids);
  const commandLines = result.stdout
    .split(/\r?\n/)
    .filter((line) => owned.has(Number(line.trim().split(/\s+/, 1)[0])))
    .join("\n");
  assertPublicSafe(commandLines, "owned child command lines");
}

function assertDirectoryPublicSafe(directory, label) {
  for (const filePath of listFilesRecursively(directory)) {
    assertPublicSafe(readFileSync(filePath, "utf8"), `${label}: ${path.basename(filePath)}`);
  }
}

function rememberOwnedPids(ready) {
  observedOwnedPids.add(ready.supervisor_pid);
  for (const child of ready.children) observedOwnedPids.add(child.pid);
}

function processTreePids(ready) {
  const pids = new Set([ready.supervisor_pid]);
  for (const child of ready.children) {
    pids.add(child.pid);
    if (process.platform !== "win32") {
      const result = spawnSync("ps", ["-axo", "pid=,pgid="], { encoding: "utf8" });
      if (result.status === 0) {
        for (const line of result.stdout.split(/\r?\n/)) {
          const [pidText, pgidText] = line.trim().split(/\s+/);
          if (Number(pgidText) === child.pid) pids.add(Number(pidText));
        }
      }
    }
  }
  return [...pids].filter((pid) => Number.isInteger(pid) && pid > 0);
}

function listSupervisorProcessIds() {
  if (process.platform === "win32") return [];
  const result = spawnSync("ps", ["-axo", "pid=,command="], { encoding: "utf8" });
  if (result.status !== 0) return [];
  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.includes(supervisorScript))
    .map((line) => Number(line.split(/\s+/, 1)[0]))
    .filter((pid) => Number.isInteger(pid) && pid !== process.pid)
    .sort((left, right) => left - right);
}

function initializeDisposableDatabase(targetPath) {
  const environment = { ...process.env, AUGNES_DB_PATH: targetPath };
  delete environment.OPENAI_API_KEY;
  delete environment.GITHUB_TOKEN;
  const result = spawnSync(process.execPath, ["scripts/db-init.mjs"], {
    cwd: repoRoot,
    env: environment,
    encoding: "utf8",
  });
  assert.equal(
    result.status,
    0,
    `disposable database initialization failed: ${result.stderr || result.stdout}`,
  );
  const database = new Database(targetPath);
  try {
    database
      .prepare(
        `INSERT INTO state_entries (
          id, scope, state_key, value, temporal_scope, stability, change_type,
          source_agent_id, source_session_id, source_transition_id,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?)`,
      )
      .run(
        "runtime-supervisor-mcp-behavior-marker",
        runtimeMarkerScope,
        runtimeMarkerStateKey,
        JSON.stringify(runtimeMarkerValue),
        "current",
        "temporary",
        "runtime_operability_fixture",
        "2000-01-01T00:00:00.000Z",
        "2000-01-01T00:00:00.000Z",
      );
  } finally {
    database.close();
  }
}

function snapshotDatabaseFamily(basePath) {
  const snapshot = new Map();
  for (const candidate of [basePath, `${basePath}-wal`, `${basePath}-shm`, `${basePath}-journal`]) {
    if (!existsSync(candidate)) continue;
    const stats = statSync(candidate, { bigint: true });
    snapshot.set(candidate, {
      sha256: hashFile(candidate),
      size: stats.size.toString(),
      mtime_ns: stats.mtimeNs.toString(),
      mode: (stats.mode & 0o777n).toString(8),
    });
  }
  return snapshot;
}

function hashFile(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

async function createTcpSentinel(preferredPort = 0) {
  let connections = 0;
  const sockets = new Set();
  const server = net.createServer((socket) => {
    connections += 1;
    sockets.add(socket);
    socket.once("close", () => sockets.delete(socket));
    socket.end();
  });
  server.testSockets = sockets;
  try {
    const port = await listenTcpServer(server, preferredPort);
    return { server, port, connectionCount: () => connections };
  } catch (error) {
    if (error?.code !== "EADDRINUSE" || !(await canConnect(preferredPort))) throw error;
    return { server: null, port: preferredPort, connectionCount: null };
  }
}

async function findPreferredPort() {
  const server = net.createServer();
  const port = await listenTcpServer(server);
  await closeServer(server);
  return port;
}

async function listenTcpServer(server, preferredPort = 0) {
  while (true) {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(
        { host: "127.0.0.1", port: preferredPort, exclusive: true },
        resolve,
      );
    });
    const address = server.address();
    assert(address && typeof address === "object");
    if (address.port <= 65_535 - 20) return address.port;
    if (preferredPort !== 0) throw new Error("preferred test port exceeds bounded range");
    await closeServer(server);
  }
}

async function listenHttpServer(server) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen({ host: "127.0.0.1", port: 0, exclusive: true }, resolve);
  });
  const address = server.address();
  assert(address && typeof address === "object");
  return address.port;
}

async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
  return { statusCode: response.status, body: await response.json() };
}

async function assertLoopbackOnly(port) {
  const addresses = Object.values(networkInterfaces())
    .flatMap((entries) => entries ?? [])
    .filter((entry) => !entry.internal && entry.family === "IPv4")
    .map((entry) => entry.address);
  for (const address of addresses) {
    assert.equal(
      await canConnect(port, address),
      false,
      `owned listener ${port} must not accept non-loopback address ${address}`,
    );
  }
}

function canConnect(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.setTimeout(1_000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function waitForPortClosed(port) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (!(await canConnect(port))) return;
    await delay(100);
  }
  throw new Error(`owned runtime port ${port} remained open`);
}

async function waitForPidsExit(pids, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (pids.every((pid) => !isProcessAlive(pid))) return;
    await delay(50);
  }
  const alive = pids.filter(isProcessAlive);
  assert.deepEqual(alive, [], `owned PIDs remained alive: ${alive.join(", ")}`);
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

function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve({ code: child.exitCode, signal: child.signalCode });
  }
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`process ${child.pid} did not exit within ${timeoutMs}ms`));
    }, timeoutMs);
    const onExit = (code, signal) => {
      cleanup();
      resolve({ code, signal });
    };
    const cleanup = () => {
      clearTimeout(timeout);
      child.off("exit", onExit);
    };
    child.once("exit", onExit);
  });
}

async function terminateManagedProcess(managed) {
  if (!managed?.child || managed.child.exitCode !== null) return;
  const ownedIdentity = [...managed.events]
    .reverse()
    .find((event) => Number.isInteger(event.supervisor_pid) && event.verified === true);
  if (ownedIdentity && isProcessAlive(ownedIdentity.supervisor_pid)) {
    process.kill(ownedIdentity.supervisor_pid, "SIGTERM");
  } else {
    managed.child.kill("SIGTERM");
  }
  try {
    await waitForExit(managed.child, 12_000);
  } catch {
    if (ownedIdentity && isProcessAlive(ownedIdentity.supervisor_pid)) {
      process.kill(ownedIdentity.supervisor_pid, "SIGKILL");
    }
    if (managed.child.exitCode === null) managed.child.kill("SIGKILL");
    await waitForExit(managed.child, 5_000).catch(() => {});
  }
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    if (!server?.listening) {
      resolve();
      return;
    }
    for (const socket of server.testSockets ?? []) socket.destroy();
    server.close((error) => (error ? reject(error) : resolve()));
    server.closeAllConnections?.();
  });
}

function listFilesRecursively(root) {
  if (!existsSync(root)) return [];
  const results = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFilesRecursively(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results.sort();
}

function listRelativeEntriesRecursively(root, relativeRoot = "") {
  if (!existsSync(root)) return [];
  const results = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const relativePath = path.join(relativeRoot, entry.name);
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      results.push(`directory:${relativePath}`);
      results.push(...listRelativeEntriesRecursively(fullPath, relativePath));
    } else if (entry.isSymbolicLink()) {
      results.push(`symlink:${relativePath}`);
    } else {
      results.push(`file:${relativePath}`);
    }
  }
  return results.sort();
}

function createDirectoryLink(target, linkPath) {
  try {
    symlinkSync(target, linkPath, process.platform === "win32" ? "junction" : "dir");
    return true;
  } catch (error) {
    if (
      process.platform === "win32" &&
      ["EPERM", "EACCES", "UNKNOWN"].includes(error?.code)
    ) {
      pathFixtureSkipReason = `directory_junction_unavailable_${error?.code ?? "unknown"}`;
      return false;
    }
    throw error;
  }
}

function assertRuntimePathError(callback, expectedCode, forbiddenValues) {
  let caught;
  try {
    callback();
  } catch (error) {
    caught = error;
  }
  assert(caught, `expected runtime path error ${expectedCode}`);
  assert.equal(caught.code, expectedCode);
  assert.equal(caught.message, expectedCode);
  const publicFailure = JSON.stringify({ reason: caught.code });
  for (const forbidden of forbiddenValues) {
    assert.equal(
      publicFailure.includes(forbidden),
      false,
      "runtime path error must not expose internal path or credential material",
    );
  }
}

function removeScenarioLogs(scenario) {
  rmSync(scenario.logRoot, { recursive: true, force: true });
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function withTimeout(promise, timeoutMs, label) {
  let timeout;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}
