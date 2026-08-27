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
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import {
  COMPANION_SERVICE_CONTRACT,
  COMPANION_SERVICE_DESIRED_STATE_CONTRACT,
  COMPANION_SERVICE_DESIRED_STATE_SCHEMA_VERSION,
  acquireCompanionServiceMaintenance,
  inspectCompanionService,
  readCompanionSupervisorFailureProvenance,
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
const observedTestProcessGroups = new Map();
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
  assert.equal(install.status, 0, installFailureDiagnostic(install));
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
  assert.equal(readDesiredState().desired_state, "stopped");
  const stoppedFresh = await runCli(["status"]);
  assert.equal(JSON.parse(stoppedFresh.stdout).status, "installed_stopped");
  assert.equal(
    spawnSync("/bin/launchctl", [
      "print",
      `gui/${process.getuid()}/${layout.service_label}`,
    ]).status,
    113,
  );
  const stoppedManagerState = JSON.parse(
    readFileSync(layout.manager_state_path, "utf8"),
  );
  const reload = spawnSync("/bin/launchctl", [
    "bootstrap",
    `gui/${process.getuid()}`,
    layout.launch_agent_path,
  ]);
  assert.equal(reload.status, 0, reload.stderr?.toString("utf8"));
  const reloadedStoppedManager = await waitForFreshStoppedManager(
    stoppedManagerState.manager_pid,
    10_000,
  );
  await waitForManagerProcessGone(reloadedStoppedManager, 10_000);
  const stoppedAfterReload = await inspectCompanionService(options);
  assert.equal(stoppedAfterReload.status, "installed_stopped");
  assert.equal(readDesiredState().desired_state, "stopped");
  for (const file of [
    layout.runtime_manifest_path,
    layout.runtime_access_path,
    layout.runtime_token_path,
    layout.runtime_lock_path,
    layout.runtime_bridge_environment_path,
  ]) assert.equal(existsSync(file), false, file);

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
    assert.equal(readDesiredState().desired_state, "running");
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
  assert.equal(readDesiredState().desired_state, "stopped");
  const stoppedMaintenance = await acquireCompanionServiceMaintenance({
    ...options,
    operationId: `native-stopped-maintenance:${process.pid}`,
  });
  assert.equal(stoppedMaintenance.acquired, false);
  assert.equal(stoppedMaintenance.reason, "companion_service_maintenance_not_required");
  assert.equal(existsSync(layout.maintenance_lease_path), false);
  const stoppedRelease = await releaseCompanionServiceMaintenance({
    ...options,
    lease: stoppedMaintenance.lease,
  });
  assert.equal(stoppedRelease.released, false);
  assert.equal(stoppedRelease.after.status, "installed_stopped");

  const staleStoppedLease = {
    contract: COMPANION_SERVICE_CONTRACT,
    schema_version: 1,
    service_identity: layout.service_identity,
    repository_fingerprint: layout.repository.repository_fingerprint,
    operation_id: `native-stale-stopped:${process.pid}`,
    owner_pid: 2_147_483_647,
    owner_process_identity: "a".repeat(64),
    pre_maintenance_desired_state: "stopped",
    acquired_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 60_000).toISOString(),
  };
  writeFileSync(
    layout.maintenance_lease_path,
    `${JSON.stringify(staleStoppedLease)}\n`,
    { mode: 0o600 },
  );
  const beforeStaleStoppedReload = JSON.parse(
    readFileSync(layout.manager_state_path, "utf8"),
  );
  const staleStoppedReload = spawnSync("/bin/launchctl", [
    "bootstrap",
    `gui/${process.getuid()}`,
    layout.launch_agent_path,
  ]);
  assert.equal(
    staleStoppedReload.status,
    0,
    staleStoppedReload.stderr?.toString("utf8"),
  );
  const staleStoppedManager = await waitForFreshStoppedManager(
    beforeStaleStoppedReload.manager_pid,
    10_000,
  );
  await waitForManagerProcessGone(staleStoppedManager, 10_000);
  assert.equal(existsSync(layout.maintenance_lease_path), false);
  assert.equal(readDesiredState().desired_state, "stopped");
  assert.equal((await inspectCompanionService(options)).status, "installed_stopped");
  assert.equal(existsSync(layout.runtime_manifest_path), false);
  const concurrentColdStartSettled = await Promise.allSettled([
    startCompanionService(options),
    startCompanionService(options),
  ]);
  assert.deepEqual(
    concurrentColdStartSettled.map((result) => result.status),
    ["fulfilled", "fulfilled"],
  );
  const concurrentColdStarts = concurrentColdStartSettled.map(
    (result) => result.value,
  );
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
  assert.equal(existsSync(layout.desired_state_path), false);
  assert.equal(
    spawnSync("/bin/launchctl", [
      "print",
      `gui/${process.getuid()}/${layout.service_label}`,
    ]).status,
    113,
  );
  await waitForProcessIdentitiesGone(observedProcesses, 10_000);
  await waitForOwnedEndpointsGone(observedEndpoints, 10_000);

  uninstalled = false;
  const staleCheckoutInstall = await runCli(["install"]);
  assert.equal(staleCheckoutInstall.status, 0, staleCheckoutInstall.stderr);
  const staleCheckoutLive = await waitForStatus("live", 120_000);
  rememberRuntime(staleCheckoutLive);
  const staleCheckoutManagerState = JSON.parse(
    readFileSync(layout.manager_state_path, "utf8"),
  );
  assert.equal(staleCheckoutManagerState.status, "live");
  const staleCheckoutManagerIdentity = processIdentity(
    staleCheckoutManagerState.manager_pid,
  );
  assert.notEqual(staleCheckoutManagerIdentity, null);
  assert.equal(
    processIdentityFingerprint(
      staleCheckoutManagerState.manager_pid,
      staleCheckoutManagerIdentity,
    ),
    staleCheckoutManagerState.manager_process_identity,
  );
  const staleCheckoutSupervisorIdentity = processIdentity(
    staleCheckoutManagerState.supervisor_pid,
  );
  assert.notEqual(staleCheckoutSupervisorIdentity, null);
  assert.equal(
    processIdentityFingerprint(
      staleCheckoutManagerState.supervisor_pid,
      staleCheckoutSupervisorIdentity,
    ),
    staleCheckoutManagerState.supervisor_process_identity,
  );
  const staleRuntimeManifestText = readFileSync(
    layout.runtime_manifest_path,
    "utf8",
  );
  const staleRuntimeManifest = JSON.parse(staleRuntimeManifestText);
  assert.equal(
    staleCheckoutManagerState.supervisor_pid,
    staleRuntimeManifest.supervisor_pid,
  );
  assert.equal(
    staleCheckoutManagerState.runtime_ownership.generation_id,
    staleRuntimeManifest.generation_id,
  );
  assert.equal(
    staleCheckoutManagerState.runtime_ownership.instance_id,
    staleRuntimeManifest.instance_id,
  );
  const staleRuntimeProcessIdentities = captureRecordedRuntimeProcesses(
    staleCheckoutManagerState.runtime_ownership,
    staleRuntimeManifest,
  );
  const staleOwnedProcessIdentities = new Map([
    [staleCheckoutManagerState.manager_pid, staleCheckoutManagerIdentity],
    [
      staleCheckoutManagerState.supervisor_pid,
      staleCheckoutSupervisorIdentity,
    ],
    ...staleRuntimeProcessIdentities,
  ]);
  const staleOwnedEndpoints = runtimeEndpoints(staleRuntimeManifest);
  for (const endpoint of staleOwnedEndpoints) {
    assert.equal(await exactOwnedEndpointResponds(endpoint), true);
  }
  const staleRuntimeMaterialPaths = [
    layout.runtime_manifest_path,
    layout.runtime_token_path,
    layout.runtime_access_path,
    layout.runtime_lock_path,
    layout.runtime_bridge_environment_path,
  ];
  const staleRuntimeMaterialFingerprints = materialFingerprints(
    staleRuntimeMaterialPaths,
  );
  const staleLaunchJobBeforeDrift = readExactTestLaunchdJob();
  assert.equal(
    staleLaunchJobBeforeDrift.pid,
    staleCheckoutManagerState.manager_pid,
  );
  const unrelatedLaunchAgent = path.join(
    path.dirname(layout.launch_agent_path),
    "com.example.unrelated-live-stale.plist",
  );
  writeFileSync(unrelatedLaunchAgent, "unrelated\n", { mode: 0o600 });
  const staleCheckoutConfigurationText = readFileSync(
    layout.configuration_path,
    "utf8",
  );
  const staleCheckoutConfigurationFingerprint = createHash("sha256")
    .update(staleCheckoutConfigurationText)
    .digest("hex");
  const staleCheckoutConfiguration = JSON.parse(
    staleCheckoutConfigurationText,
  );
  const testRepositoryPhysicalIdentityOverride = {
    device: staleCheckoutConfiguration.repository_device,
    inode: differentCanonicalStatIdentity(
      staleCheckoutConfiguration.repository_inode,
    ),
  };
  assert.equal(
    String(BigInt(testRepositoryPhysicalIdentityOverride.inode)),
    testRepositoryPhysicalIdentityOverride.inode,
  );
  assert.notEqual(
    testRepositoryPhysicalIdentityOverride.inode,
    layout.repository.inode,
  );
  const staleObservationOptions = {
    ...options,
    testRepositoryPhysicalIdentityOverride,
  };
  assert.equal(
    createHash("sha256")
      .update(readFileSync(layout.configuration_path))
      .digest("hex"),
    staleCheckoutConfigurationFingerprint,
  );
  const staleCheckoutObservation = await inspectCompanionService(
    staleObservationOptions,
  );
  assert.equal(staleCheckoutObservation.status, "recovery_required");
  assert.equal(
    staleCheckoutObservation.checkout_relation,
    "substituted_or_moved",
  );
  assert.equal(
    staleCheckoutObservation.reason,
    "companion_service_checkout_identity_changed",
  );
  assert.equal(staleCheckoutObservation.start_available, false);
  assert.equal(staleCheckoutObservation.resume_available, false);
  assert.equal((await inspectCompanionService(options)).status, "live");
  assert.equal(
    createHash("sha256")
      .update(readFileSync(layout.configuration_path))
      .digest("hex"),
    staleCheckoutConfigurationFingerprint,
  );
  assert.deepEqual(readExactTestLaunchdJob(), staleLaunchJobBeforeDrift);
  assertProcessIdentitiesPresent(staleOwnedProcessIdentities);
  for (const endpoint of staleOwnedEndpoints) {
    assert.equal(await exactOwnedEndpointResponds(endpoint), true);
  }

  const refusedAuthorityActions = [];
  const refusedAuthorityLaunchctl = recordingNativeLaunchctl(
    refusedAuthorityActions,
  );
  await assert.rejects(
    startCompanionService({
      ...staleObservationOptions,
      launchctl: refusedAuthorityLaunchctl,
    }),
    (error) => error?.code === "companion_service_recovery_refused",
  );
  await assert.rejects(
    stopCompanionService({
      ...staleObservationOptions,
      launchctl: refusedAuthorityLaunchctl,
    }),
    (error) => error?.code === "companion_service_stop_refused",
  );
  await assert.rejects(
    acquireCompanionServiceMaintenance({
      ...staleObservationOptions,
      launchctl: refusedAuthorityLaunchctl,
      operationId: `native-stale-live-maintenance:${process.pid}`,
    }),
    (error) => error?.code === "companion_service_maintenance_refused",
  );
  assert.equal(readDesiredState().desired_state, "running");
  assert.equal(
    refusedAuthorityActions.some(([command]) =>
      ["bootstrap", "bootout", "kickstart"].includes(command)
    ),
    false,
  );

  assert.equal(staleRuntimeManifest.children.length > 0, true);
  assert.notEqual(staleRuntimeManifest.children[0].pid, process.pid);
  const substitutedUnrelatedIdentity = processIdentity(process.pid);
  assert.notEqual(substitutedUnrelatedIdentity, null);
  const substitutedRuntimeManifest = {
    ...staleRuntimeManifest,
    children: [{
      ...staleRuntimeManifest.children[0],
      pid: process.pid,
    }, ...staleRuntimeManifest.children.slice(1)],
  };
  assert.equal(
    substitutedRuntimeManifest.generation_id,
    staleRuntimeManifest.generation_id,
  );
  assert.equal(
    substitutedRuntimeManifest.instance_id,
    staleRuntimeManifest.instance_id,
  );
  writeFileSync(
    layout.runtime_manifest_path,
    `${JSON.stringify(substitutedRuntimeManifest)}\n`,
    { mode: 0o600 },
  );
  const liveNegativeOwnedFiles = [
    layout.configuration_path,
    layout.desired_state_path,
    layout.launch_agent_path,
    layout.manager_state_path,
    layout.manager_lock_path,
    ...staleRuntimeMaterialPaths,
  ];
  for (const file of liveNegativeOwnedFiles) {
    assert.equal(existsSync(file), true, file);
  }
  const liveNegativeActions = [];
  await assert.rejects(
    uninstallCompanionService({
      ...staleObservationOptions,
      launchctl: recordingNativeLaunchctl(liveNegativeActions),
    }),
    (error) =>
      error?.code === "companion_service_stale_checkout_decommission_refused",
  );
  assert.equal(
    liveNegativeActions.some(([command]) => command === "bootout"),
    false,
  );
  for (const file of liveNegativeOwnedFiles) {
    assert.equal(existsSync(file), true, file);
  }
  assertProcessIdentitiesPresent(staleOwnedProcessIdentities);
  assert.equal(
    processIdentity(process.pid),
    substitutedUnrelatedIdentity,
  );
  for (const endpoint of staleOwnedEndpoints) {
    assert.equal(await exactOwnedEndpointResponds(endpoint), true);
  }
  assert.equal(existsSync(unrelatedLaunchAgent), true);
  assert.deepEqual(readExactTestLaunchdJob(), staleLaunchJobBeforeDrift);

  writeFileSync(
    layout.runtime_manifest_path,
    staleRuntimeManifestText,
    { mode: 0o600 },
  );
  const restoredStaleManagerState = await waitForManagerRuntimeOwnership({
    managerPid: staleCheckoutManagerState.manager_pid,
    supervisorPid: staleCheckoutManagerState.supervisor_pid,
    generationId: staleRuntimeManifest.generation_id,
    instanceId: staleRuntimeManifest.instance_id,
    timeoutMs: 10_000,
  });
  captureRecordedRuntimeProcesses(
    restoredStaleManagerState.runtime_ownership,
    staleRuntimeManifest,
  );
  assert.deepEqual(
    materialFingerprints(staleRuntimeMaterialPaths),
    staleRuntimeMaterialFingerprints,
  );
  assert.equal(
    createHash("sha256")
      .update(readFileSync(layout.configuration_path))
      .digest("hex"),
    staleCheckoutConfigurationFingerprint,
  );

  const staleDecommissionActions = [];
  const staleDecommissionLaunchctlResults = [];
  let periodicManagerStateRewriteCount = 0;
  let periodicManagerStateGeneration = null;
  let periodicManagerStateInstance = null;
  let staleCheckoutDecommission;
  try {
    staleCheckoutDecommission = await uninstallCompanionService({
      ...staleObservationOptions,
      launchctl: recordingNativeLaunchctl(
        staleDecommissionActions,
        staleDecommissionLaunchctlResults,
      ),
      testStaleDecommissionStageHook: ({
        stage,
        snapshot_kind: snapshotKind,
        attempt,
      }) => {
        if (
          stage !== "live_snapshot_after_manager_state_a" ||
          snapshotKind !== "initial" ||
          attempt !== 1 ||
          periodicManagerStateRewriteCount !== 0
        ) return;
        const managerStateText = readFileSync(
          layout.manager_state_path,
          "utf8",
        );
        const managerState = JSON.parse(managerStateText);
        periodicManagerStateGeneration =
          managerState.runtime_ownership?.generation_id ?? null;
        periodicManagerStateInstance =
          managerState.runtime_ownership?.instance_id ?? null;
        const rewritten = {
          ...managerState,
          updated_at: new Date(
            Math.max(Date.now(), Date.parse(managerState.updated_at) + 1),
          ).toISOString(),
        };
        assert.notEqual(rewritten.updated_at, managerState.updated_at);
        const temporaryManagerStatePath =
          `${layout.manager_state_path}.periodic-${process.pid}`;
        writeFileSync(
          temporaryManagerStatePath,
          `${JSON.stringify(rewritten)}\n`,
          { mode: 0o600 },
        );
        renameSync(temporaryManagerStatePath, layout.manager_state_path);
        periodicManagerStateRewriteCount += 1;
      },
    });
  } catch (error) {
    throw new Error(JSON.stringify({
      stale_decommission_error: error?.code ?? "unknown",
      stale_decommission_cause: error?.cause?.code ?? null,
      launchctl_results: Object.values(
        staleDecommissionLaunchctlResults.reduce((summary, result) => {
          const key = JSON.stringify(result);
          const current = summary[key] ?? { ...result, count: 0 };
          current.count += 1;
          summary[key] = current;
          return summary;
        }, {}),
      ),
    }));
  }
  uninstalled = true;
  assert.equal(periodicManagerStateRewriteCount, 1);
  assert.equal(
    periodicManagerStateGeneration,
    staleRuntimeManifest.generation_id,
  );
  assert.equal(periodicManagerStateInstance, staleRuntimeManifest.instance_id);
  assert.equal(staleCheckoutDecommission.result, "changed");
  assert.equal(staleCheckoutDecommission.service.status, "not_installed");
  assert.equal(
    staleCheckoutDecommission.authority.runtime_lifecycle_effect,
    true,
  );
  for (const [key, value] of Object.entries(staleCheckoutDecommission.authority)) {
    if (key !== "runtime_lifecycle_effect") assert.equal(value, false, key);
  }
  const staleBootoutActions = staleDecommissionActions.filter(
    ([command]) => command === "bootout",
  );
  assert.equal(staleBootoutActions.length, 2);
  assert.deepEqual(staleBootoutActions[0], [
    "bootout",
    `gui/${process.getuid()}/${layout.service_label}`,
  ]);
  assert.equal(staleBootoutActions[1][0], "bootout");
  assert.equal(staleBootoutActions[1][1], `gui/${process.getuid()}`);
  assert.equal(path.dirname(staleBootoutActions[1][2]), layout.service_directory);
  assert.match(
    path.basename(staleBootoutActions[1][2]),
    /^\.stale-decommission-launch-agent-[a-f0-9-]+\.plist$/u,
  );
  assert.equal(
    staleDecommissionActions.some(([command]) =>
      ["bootstrap", "kickstart"].includes(command)
    ),
    false,
  );
  assert.equal(existsSync(layout.launch_agent_path), false);
  assert.equal(existsSync(layout.configuration_path), false);
  assert.equal(existsSync(layout.desired_state_path), false);
  assert.equal(existsSync(layout.manager_state_path), false);
  assert.equal(existsSync(layout.manager_lock_path), false);
  assert.equal(existsSync(layout.lifecycle_lock_path), false);
  assert.equal(existsSync(layout.maintenance_lease_path), false);
  for (const file of [
    layout.runtime_manifest_path,
    layout.runtime_access_path,
    layout.runtime_token_path,
    layout.runtime_lock_path,
    layout.runtime_bridge_environment_path,
  ]) assert.equal(existsSync(file), false, file);
  assert.equal(existsSync(layout.stale_decommission_path), false);
  assertNoStaleDecommissionResidue();
  assert.equal(existsSync(unrelatedLaunchAgent), true);
  assert.equal(
    spawnSync("/bin/launchctl", [
      "print",
      `gui/${process.getuid()}/${layout.service_label}`,
    ]).status,
    113,
  );
  await waitForProcessIdentitiesGone(staleOwnedProcessIdentities, 10_000);
  await waitForOwnedEndpointsGone(staleOwnedEndpoints, 10_000);
  assert.equal((await inspectCompanionService(options)).status, "not_installed");
  const staleCheckoutReplay = await uninstallCompanionService(options);
  assert.equal(staleCheckoutReplay.result, "exact_replay");

  uninstalled = false;
  const freshAfterStaleDecommission = await runCli(["install"]);
  assert.equal(
    freshAfterStaleDecommission.status,
    0,
    freshAfterStaleDecommission.stderr,
  );
  const freshAfterStaleLive = await waitForStatus("live", 120_000);
  rememberRuntime(freshAfterStaleLive);
  const finalFreshUninstall = await uninstallCompanionService(options);
  uninstalled = true;
  assert.equal(finalFreshUninstall.service.status, "not_installed");
  await waitForProcessIdentitiesGone(observedProcesses, 10_000);
  await waitForOwnedEndpointsGone(observedEndpoints, 10_000);

  console.log(JSON.stringify({
    status: "pass",
    service_contract: "augnes-companion-service.v0.1",
    desired_state_contract: COMPANION_SERVICE_DESIRED_STATE_CONTRACT,
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
    explicit_stop_fresh_manager_reload_remained_stopped: true,
    explicit_start_changed_desired_state_to_running: true,
    explicit_restart_succeeded: true,
    explicit_service_update_succeeded: true,
    stale_service_stop_and_uninstall_succeeded: true,
    exact_orphan_runtime_stopped_on_uninstall: true,
    maintenance_pause_and_restore: true,
    maintenance_stopped_state_noop: true,
    stale_stopped_maintenance_recovery_did_not_wake_service: true,
    nested_maintenance_joined_ancestor: true,
    stale_owner_recovery: true,
    uninstall_exact_cleanup: true,
    stale_checkout_physical_identity_is_install_shaped: true,
    stale_checkout_control_observation_did_not_mutate_configuration: true,
    stale_checkout_periodic_manager_state_rewrite_admitted: true,
    stale_checkout_live_runtime_ownership_authenticated: true,
    stale_checkout_live_child_binding_substitution_refused_before_bootout: true,
    stale_checkout_live_exact_label_bootout: true,
    stale_checkout_live_process_and_endpoint_cleanup: true,
    stale_checkout_live_decommission_exact_cleanup: true,
    stale_checkout_decommission_exact_replay: true,
    fresh_install_after_stale_decommission: true,
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
      nativeLaunchctl([
        "bootout",
        `gui/${process.getuid()}/${layout.service_label}`,
      ]);
      await stopObservedTestProcessGroups();
      rmSync(layout.launch_agent_path, { force: true });
    }
  }
  await stopObservedTestProcessGroups();
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

function installFailureDiagnostic(result) {
  let publicResult = null;
  let provenance = null;
  try {
    publicResult = JSON.parse(result.stdout);
  } catch {
    publicResult = { result: "unparseable_public_result" };
  }
  try {
    const managerState = JSON.parse(
      readFileSync(layout.manager_state_path, "utf8"),
    );
    provenance = readCompanionSupervisorFailureProvenance(managerState);
  } catch {
    provenance = null;
  }
  return JSON.stringify({
    exit_status: result.status,
    public_result: publicResult,
    supervisor_failure_provenance: provenance,
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

async function waitForFreshStoppedManager(previousManagerPid, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let state = null;
  while (Date.now() < deadline) {
    try {
      state = JSON.parse(readFileSync(layout.manager_state_path, "utf8"));
    } catch {
      state = null;
    }
    if (
      state?.status === "installed_stopped" &&
      Number.isInteger(state.manager_pid) &&
      state.manager_pid !== previousManagerPid &&
      typeof state.manager_process_identity === "string"
    ) return state;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.equal(state?.status, "installed_stopped");
  assert.notEqual(state?.manager_pid, previousManagerPid);
  return state;
}

async function waitForManagerProcessGone(managerState, timeoutMs) {
  const exactManagerAlive = () => {
    const material = processIdentity(managerState.manager_pid);
    if (material === null) return false;
    return createHash("sha256")
      .update(`${process.platform}:${managerState.manager_pid}:${material}`)
      .digest("hex") === managerState.manager_process_identity;
  };
  const deadline = Date.now() + timeoutMs;
  while (exactManagerAlive() && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.equal(exactManagerAlive(), false);
}

function readDesiredState() {
  const state = JSON.parse(readFileSync(layout.desired_state_path, "utf8"));
  assert.equal(state.contract, COMPANION_SERVICE_DESIRED_STATE_CONTRACT);
  assert.equal(
    state.schema_version,
    COMPANION_SERVICE_DESIRED_STATE_SCHEMA_VERSION,
  );
  assert.equal(state.service_identity, layout.service_identity);
  assert.equal(
    state.repository_fingerprint,
    layout.repository.repository_fingerprint,
  );
  assert.match(state.updated_at, /^\d{4}-\d{2}-\d{2}T/u);
  assert.deepEqual(Object.keys(state).sort(), [
    "contract",
    "desired_state",
    "repository_fingerprint",
    "schema_version",
    "service_identity",
    "updated_at",
  ]);
  return state;
}

function rememberRuntime(observation) {
  observedProcesses.set(
    observation.runtime.supervisor_pid,
    processIdentity(observation.runtime.supervisor_pid),
  );
  const manifest = JSON.parse(readFileSync(layout.runtime_manifest_path, "utf8"));
  rememberTestProcessGroup(manifest.supervisor_pid);
  for (const child of manifest.children) rememberTestProcessGroup(child.pid);
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

function rememberTestProcessGroup(pid) {
  const groupResult = spawnSync(
    "/bin/ps",
    ["-o", "pgid=", "-p", String(pid)],
    { encoding: "utf8" },
  );
  assert.equal(groupResult.status, 0, groupResult.stderr);
  const processGroup = Number(groupResult.stdout.trim());
  assert.equal(processGroup, pid);
  observedTestProcessGroups.set(processGroup, new Map(
    currentProcessGroupMembers(processGroup).map((member) => [
      member.pid,
      member.birth_material,
    ]),
  ));
}

async function stopObservedTestProcessGroups() {
  for (const [processGroup, captured] of observedTestProcessGroups) {
    let current = exactObservedTestGroupMembers(processGroup, captured);
    if (current.length === 0) continue;
    process.kill(-processGroup, "SIGTERM");
    const gracefulDeadline = Date.now() + 8_000;
    while (Date.now() < gracefulDeadline) {
      current = exactObservedTestGroupMembers(processGroup, captured);
      if (current.length === 0) break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (current.length === 0) continue;
    exactObservedTestGroupMembers(processGroup, captured);
    process.kill(-processGroup, "SIGKILL");
    const forcedDeadline = Date.now() + 4_000;
    while (Date.now() < forcedDeadline) {
      current = exactObservedTestGroupMembers(processGroup, captured);
      if (current.length === 0) break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.deepEqual(current, [], "exact test process group must stop");
  }
}

function exactObservedTestGroupMembers(processGroup, captured) {
  const current = currentProcessGroupMembers(processGroup);
  for (const member of current) {
    assert.equal(
      captured.get(member.pid),
      member.birth_material,
      `unowned process in test group ${processGroup}`,
    );
  }
  return current;
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

function processIdentityFingerprint(pid, birthMaterial = processIdentity(pid)) {
  assert.notEqual(birthMaterial, null);
  return createHash("sha256")
    .update(`${process.platform}:${pid}:${birthMaterial}`)
    .digest("hex");
}

function currentProcessGroupMembers(processGroup) {
  const result = spawnSync("/bin/ps", ["-axo", "pid=,pgid="], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.split("\n").flatMap((line) => {
    const match = line.trim().match(/^(\d+)\s+(\d+)$/u);
    if (!match || Number(match[2]) !== processGroup) return [];
    const pid = Number(match[1]);
    const birthMaterial = processIdentity(pid);
    if (birthMaterial === null || /\s<defunct>$/u.test(birthMaterial)) return [];
    return [{
      pid,
      birth_material: birthMaterial,
      identity: processIdentityFingerprint(pid, birthMaterial),
    }];
  }).sort((left, right) => left.pid - right.pid);
}

function captureRecordedRuntimeProcesses(ownership, manifest) {
  assert.equal(ownership.generation_id, manifest.generation_id);
  assert.equal(ownership.instance_id, manifest.instance_id);
  const children = new Map(manifest.children.map((child) => [child.role, child]));
  const identities = new Map();
  assert.deepEqual(
    ownership.process_groups.map((group) => group.role).sort(),
    ["bridge", "ui"],
  );
  for (const group of ownership.process_groups) {
    assert.equal(group.pid, children.get(group.role).pid);
    assert.equal(group.process_group, group.pid);
    const processGroup = spawnSync(
      "/bin/ps",
      ["-o", "pgid=", "-p", String(group.pid)],
      { encoding: "utf8" },
    );
    assert.equal(processGroup.status, 0, processGroup.stderr);
    assert.equal(Number(processGroup.stdout.trim()), group.process_group);
    const currentMembers = currentProcessGroupMembers(group.process_group);
    assert.deepEqual(
      currentMembers.map(({ pid, identity }) => ({ pid, identity })),
      group.members,
    );
    assert.equal(
      currentMembers.some((member) =>
        member.pid === group.pid && member.identity === group.identity
      ),
      true,
    );
    for (const member of currentMembers) {
      identities.set(member.pid, member.birth_material);
    }
  }
  return identities;
}

function assertProcessIdentitiesPresent(processes) {
  for (const [pid, identity] of processes) {
    assert.equal(processIdentity(pid), identity, String(pid));
  }
}

function runtimeEndpoints(manifest) {
  return [{
    url: `${manifest.effective_url}/api/healthz`,
    runtime_instance_id: manifest.instance_id,
    runtime_generation_id: manifest.generation_id,
    runtime_repository_fingerprint: manifest.repository_fingerprint,
  }, {
    url: `http://127.0.0.1:${manifest.bridge_port}/healthz`,
    runtime_instance_id: manifest.instance_id,
    runtime_generation_id: manifest.generation_id,
    runtime_repository_fingerprint: manifest.repository_fingerprint,
  }];
}

function materialFingerprints(files) {
  return Object.fromEntries(files.map((file) => [
    file,
    createHash("sha256").update(readFileSync(file)).digest("hex"),
  ]));
}

function nativeLaunchctl(args) {
  return spawnSync("/bin/launchctl", args, {
    encoding: "utf8",
    env: {
      PATH: "/usr/bin:/bin:/usr/sbin:/sbin",
      HOME: os.homedir(),
    },
  });
}

function recordingNativeLaunchctl(actions, results = null) {
  return (args) => {
    actions.push([...args]);
    const result = nativeLaunchctl(args);
    results?.push({
      command: args[0],
      target_kind: args[1]?.endsWith(layout.service_label)
        ? "exact_service_label"
        : args[0] === "bootout" &&
            args[1] === `gui/${process.getuid()}` &&
            typeof args[2] === "string" &&
            path.dirname(args[2]) === layout.service_directory
          ? "decommission_only_service_definition"
          : args[0] === "print"
            ? "other_print"
            : "other",
      status: result.status,
      signal_present: result.signal !== null,
      error_present: result.error !== undefined,
    });
    return result;
  };
}

function readExactTestLaunchdJob() {
  const result = nativeLaunchctl([
    "print",
    `gui/${process.getuid()}/${layout.service_label}`,
  ]);
  assert.equal(result.status, 0, result.stderr);
  const output = result.stdout;
  const configuration = JSON.parse(
    readFileSync(layout.configuration_path, "utf8"),
  );
  const job = {
    label: output.match(/^\s*([^\s=]+)\s*=\s*\{\s*$/mu)?.[1]
      ?.split("/").at(-1) ?? null,
    path: launchctlPrintScalar(output, "path"),
    program: launchctlPrintScalar(output, "program"),
    arguments: launchctlPrintArguments(output),
    working_directory: launchctlPrintScalar(output, "working directory"),
    pid: Number(launchctlPrintScalar(output, "pid")),
  };
  assert.equal(job.label, layout.service_label);
  assert.equal(job.path, layout.launch_agent_path);
  assert.equal(job.program, configuration.node_path);
  assert.deepEqual(job.arguments, [
    configuration.node_path,
    configuration.manager_entry_path,
    "run",
    "--config",
    configuration.configuration_path,
  ]);
  assert.equal(job.working_directory, configuration.repository_root);
  assert.equal(Number.isInteger(job.pid) && job.pid > 0, true);
  return job;
}

function launchctlPrintScalar(output, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  return output.match(
    new RegExp(`^\\s*${escaped}\\s*=\\s*(.+?)\\s*$`, "mu"),
  )?.[1] ?? null;
}

function launchctlPrintArguments(output) {
  const lines = output.split("\n");
  const start = lines.findIndex((line) =>
    /^\s*arguments\s*=\s*\{\s*$/u.test(line)
  );
  if (start < 0) return null;
  const values = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (line === "}") return values;
    if (line.length > 0) values.push(line.replace(/^\d+\s*=\s*/u, ""));
  }
  return null;
}

async function waitForManagerRuntimeOwnership({
  managerPid,
  supervisorPid,
  generationId,
  instanceId,
  timeoutMs,
}) {
  const deadline = Date.now() + timeoutMs;
  let state = null;
  while (Date.now() < deadline) {
    try {
      state = JSON.parse(readFileSync(layout.manager_state_path, "utf8"));
    } catch {
      state = null;
    }
    if (
      state?.status === "live" &&
      state.manager_pid === managerPid &&
      state.supervisor_pid === supervisorPid &&
      state.runtime_ownership?.generation_id === generationId &&
      state.runtime_ownership?.instance_id === instanceId
    ) return state;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.equal(state?.status, "live");
  assert.equal(state?.runtime_ownership?.generation_id, generationId);
  assert.equal(state?.runtime_ownership?.instance_id, instanceId);
  return state;
}

function assertNoStaleDecommissionResidue() {
  for (const directory of [
    layout.service_directory,
    layout.runtime_directory,
    path.dirname(layout.launch_agent_path),
  ]) {
    if (!existsSync(directory)) continue;
    for (const name of readdirSync(directory)) {
      assert.equal(name.startsWith(".stale-decommission-quarantine-"), false);
      assert.equal(/^\.stale-decommission-[a-f0-9-]+\.tmp$/u.test(name), false);
    }
  }
}

function differentCanonicalStatIdentity(value) {
  assert.match(value, /^(?:0|[1-9][0-9]*)$/u);
  const changed = String(BigInt(value) + 1n);
  assert.match(changed, /^[1-9][0-9]*$/u);
  assert.equal(String(BigInt(changed)), changed);
  assert.notEqual(changed, value);
  return changed;
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
