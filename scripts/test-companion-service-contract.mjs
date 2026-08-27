#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  COMPANION_SERVICE_CONTRACT,
  COMPANION_SERVICE_DESIRED_STATE_CONTRACT,
  COMPANION_SERVICE_DESIRED_STATE_SCHEMA_VERSION,
  COMPANION_SERVICE_PUBLIC_STATES,
  appendCompanionSupervisorAttemptOutput,
  acquireCompanionServiceMaintenance,
  buildLaunchAgentPlist,
  computeServiceSourceFingerprint,
  createCompanionSupervisorAttemptDiagnostics,
  installCompanionService,
  inspectCompanionService,
  lifecycleAuthority,
  observeCompanionSupervisorAttemptExit,
  publicCompanionServiceProjection,
  readCompanionSupervisorFailureProvenance,
  resolveCompanionServiceLayout,
  selectSupportedNode24Binary,
  snapshotCompanionSupervisorFailureProvenance,
  startCompanionService,
  stopCompanionService,
  uninstallCompanionService,
} from "../plugins/augnes-operator/mcp/companion-service-core.mjs";

const repositoryRoot = process.cwd();
const root = mkdtempSync(path.join(os.tmpdir(), "augnes-service-contract-"));
const home = path.join(root, "home");
const environment = {
  ...process.env,
  AUGNES_COMPANION_SERVICE_TEST_MODE: "1",
  AUGNES_COMPANION_SERVICE_TEST_ROOT: path.join(root, "state"),
  AUGNES_COMPANION_SERVICE_TEST_SCOPE: "contract-primary",
};
const options = {
  repositoryRoot,
  environment,
  homeDirectory: home,
  testScope: "contract-primary",
};

try {
  assert.equal(COMPANION_SERVICE_CONTRACT, "augnes-companion-service.v0.1");
  assert.equal(
    COMPANION_SERVICE_DESIRED_STATE_CONTRACT,
    "augnes-companion-service-desired-state.v0.1",
  );
  assert.deepEqual(COMPANION_SERVICE_PUBLIC_STATES, [
    "unsupported",
    "not_installed",
    "installed_stopped",
    "starting",
    "live",
    "maintenance",
    "service_update_required",
    "recovery_required",
    "ambiguous",
  ]);
  const layout = resolveCompanionServiceLayout(options);
  assert.deepEqual(resolveCompanionServiceLayout(options), layout);
  const physicalIdentityOverride = {
    device: layout.repository.device,
    inode: differentCanonicalStatIdentity(layout.repository.inode),
  };
  const overriddenLayout = resolveCompanionServiceLayout({
    ...options,
    testRepositoryPhysicalIdentityOverride: physicalIdentityOverride,
  });
  assert.equal(overriddenLayout.repository.realpath, layout.repository.realpath);
  assert.equal(
    overriddenLayout.repository.repository_fingerprint,
    layout.repository.repository_fingerprint,
  );
  assert.equal(overriddenLayout.service_identity, layout.service_identity);
  assert.equal(overriddenLayout.service_label, layout.service_label);
  assert.equal(overriddenLayout.repository.device, physicalIdentityOverride.device);
  assert.equal(overriddenLayout.repository.inode, physicalIdentityOverride.inode);
  for (const override of [
    { device: "123-changed", inode: "1" },
    { device: "-1", inode: "1" },
    { device: "+1", inode: "1" },
    { device: " 1", inode: "1" },
    { device: "1 ", inode: "1" },
    { device: "device", inode: "1" },
    { device: "", inode: "1" },
    { device: "01", inode: "1" },
    { device: "1", inode: "0" },
    { inode: "1" },
    { device: "1" },
    { device: "1", inode: "2", root: repositoryRoot },
  ]) {
    assert.throws(
      () => resolveCompanionServiceLayout({
        ...options,
        testRepositoryPhysicalIdentityOverride: override,
      }),
      (error) => error?.code ===
        "companion_service_test_physical_identity_override_refused",
    );
  }
  assert.throws(
    () => resolveCompanionServiceLayout({
      repositoryRoot,
      environment: { ...process.env },
      homeDirectory: home,
      testRepositoryPhysicalIdentityOverride: physicalIdentityOverride,
    }),
    (error) => error?.code ===
      "companion_service_test_physical_identity_override_refused",
  );
  await assert.rejects(
    installCompanionService({
      ...options,
      testRepositoryPhysicalIdentityOverride: physicalIdentityOverride,
    }),
    (error) => error?.code ===
      "companion_service_test_physical_identity_override_refused",
  );
  const otherScope = resolveCompanionServiceLayout({
    ...options,
    environment: {
      ...environment,
      AUGNES_COMPANION_SERVICE_TEST_SCOPE: "contract-secondary",
    },
    testScope: "contract-secondary",
  });
  assert.notEqual(layout.service_label, otherScope.service_label);

  const absent = await inspectCompanionService(options);
  assert.equal(absent.status, "not_installed");
  const publicAbsent = publicCompanionServiceProjection(absent);
  assert.equal(publicAbsent.start_available, false);
  assert.equal(publicAbsent.canonical_resume_available, false);
  const serialized = JSON.stringify(publicAbsent);
  for (const forbidden of [
    repositoryRoot,
    root,
    "node_path",
    "plist",
    "desired_state",
    "desired-state.json",
    "lifecycle.lock",
    "supervisor_pid",
    "bridge_pid",
    "proxy_token",
    "cookie",
    "nonce",
    "database_path",
  ]) assert.equal(serialized.includes(forbidden), false, forbidden);

  const unsupported = await inspectCompanionService({
    ...options,
    platform: "linux",
  });
  assert.equal(unsupported.status, "unsupported");
  await assert.rejects(
    startCompanionService(options),
    (error) => error?.code === "companion_service_setup_required",
  );
  const maintenance = await acquireCompanionServiceMaintenance({
    ...options,
    operationId: "contract:no-service",
  });
  assert.equal(maintenance.acquired, false);
  assert.equal(maintenance.before.status, "not_installed");

  const authority = lifecycleAuthority(true);
  assert.equal(authority.runtime_lifecycle_effect, true);
  for (const [key, value] of Object.entries(authority)) {
    if (key !== "runtime_lifecycle_effect") assert.equal(value, false, key);
  }
  const node = selectSupportedNode24Binary({ candidates: [process.execPath] });
  assert.match(node.version, /^v24\./u);

  let loaded = false;
  const launchAgentDirectory = path.join(home, "Library", "LaunchAgents");
  mkdirSync(launchAgentDirectory, { recursive: true, mode: 0o755 });
  chmodSync(launchAgentDirectory, 0o755);
  const launchAgentDirectoryMode = statSync(launchAgentDirectory).mode & 0o777;
  const launchctl = (args) => {
    if (args[0] === "bootstrap") loaded = true;
    if (args[0] === "bootout") loaded = false;
    return { status: args[0] === "print" ? (loaded ? 0 : 113) : 0 };
  };
  await assert.rejects(
    installCompanionService({
      ...options,
      nodePath: node.path,
      launchctl,
      waitMs: 1,
    }),
    (error) => error?.code === "companion_service_manager_state_unavailable",
  );
  assert.equal(loaded, false);
  assert.equal(
    statSync(launchAgentDirectory).mode & 0o777,
    launchAgentDirectoryMode,
  );
  assert.equal((await inspectCompanionService(options)).status, "not_installed");

  const stoppedFixture = writeInstalledServiceFixture({
    options,
    node,
    desiredState: "stopped",
  });
  loaded = true;
  const stoppedWhileLoaded = await inspectCompanionService({
    ...options,
    launchctl,
  });
  assert.equal(stoppedWhileLoaded.status, "installed_stopped");
  assert.equal(stoppedWhileLoaded.desired_state, "stopped");
  assert.equal(stoppedWhileLoaded.runtime.verified, false);
  const stoppedProjection = publicCompanionServiceProjection(stoppedWhileLoaded);
  assert.equal(stoppedProjection.status, "installed_stopped");
  assert.equal(JSON.stringify(stoppedProjection).includes("desired-state.json"), false);
  loaded = false;
  const stopReplay = await stopCompanionService({ ...options, launchctl });
  assert.equal(stopReplay.result, "exact_replay");
  const stoppedMaintenance = await acquireCompanionServiceMaintenance({
    ...options,
    launchctl,
    operationId: "contract:stopped-service",
  });
  assert.equal(stoppedMaintenance.acquired, false);
  assert.equal(stoppedMaintenance.reason, "companion_service_maintenance_not_required");
  assert.equal(existsSync(stoppedFixture.layout.maintenance_lease_path), false);

  const exactStoppedManagerState = writeExplicitStoppedManagerState(
    stoppedFixture,
  );
  const staleConfiguration = {
    ...stoppedFixture.configuration,
    service_source_fingerprint: "f".repeat(64),
  };
  writeJson(stoppedFixture.layout.configuration_path, staleConfiguration);
  const staleStopped = await inspectCompanionService({ ...options, launchctl });
  assert.equal(staleStopped.status, "service_update_required");
  assert.equal(staleStopped.reason, "companion_service_configuration_stale");
  assert.equal(staleStopped.checkout_relation, "exact");
  assert.equal(staleStopped.desired_state, "stopped");
  assert.equal(staleStopped.loaded, false);
  assert.equal(staleStopped.runtime.verified, false);
  const staleStoppedProjection = publicCompanionServiceProjection(staleStopped);
  assert.equal(staleStoppedProjection.status, "service_update_required");
  assert.equal(staleStoppedProjection.reason, "companion_service_configuration_stale");
  assert.equal(staleStoppedProjection.checkout_relation, "exact");
  const staleStoppedSerialized = JSON.stringify(staleStoppedProjection);
  for (const forbidden of [
    repositoryRoot,
    root,
    "desired_state",
    "loaded",
    "manager_pid",
    "supervisor_pid",
    "runtime_ownership",
    "maintenance_lease",
    "OPENAI_API_KEY",
    "provider_response",
    "model_output",
    "stdout",
    "stderr",
  ]) assert.equal(staleStoppedSerialized.includes(forbidden), false, forbidden);
  const staleStoppedMaintenance = await acquireCompanionServiceMaintenance({
    ...options,
    launchctl,
    operationId: "contract:stale-stopped-service",
  });
  assert.equal(staleStoppedMaintenance.acquired, false);
  assert.equal(staleStoppedMaintenance.lease, null);
  assert.equal(
    staleStoppedMaintenance.reason,
    "companion_service_maintenance_not_required",
  );
  assert.deepEqual(staleStoppedMaintenance.before, {
    status: "service_update_required",
    checkout_relation: "exact",
    service_identity: `sha256:${stoppedFixture.layout.service_identity}`,
  });
  assert.equal(existsSync(stoppedFixture.layout.maintenance_lease_path), false);

  writeJson(stoppedFixture.layout.configuration_path, {
    ...stoppedFixture.configuration,
    node_version: node.version === "v24.0.0" ? "v24.0.1" : "v24.0.0",
  });
  await assertMaintenanceUpdateRequired({
    options,
    launchctl,
    operationId: "contract:stopped-node-binding-stale",
  });
  writeJson(stoppedFixture.layout.configuration_path, staleConfiguration);

  writeDesiredState(stoppedFixture, "running");
  await assertMaintenanceUpdateRequired({
    options,
    launchctl,
    operationId: "contract:stale-running-service",
  });
  writeDesiredState(stoppedFixture, "stopped");

  loaded = true;
  await assertMaintenanceUpdateRequired({
    options,
    launchctl,
    operationId: "contract:stale-stopped-loaded-service",
  });
  loaded = false;

  const verifiedRuntime = await writeVerifiedRuntimeFixture(stoppedFixture);
  try {
    const staleStoppedWithRuntime = await inspectCompanionService({
      ...options,
      launchctl,
    });
    assert.equal(staleStoppedWithRuntime.runtime.verified, true);
    await assertMaintenanceUpdateRequired({
      options,
      launchctl,
      operationId: "contract:stale-stopped-verified-runtime",
    });
  } finally {
    await verifiedRuntime.close();
  }

  for (const [role, file] of [
    ["manifest", stoppedFixture.layout.runtime_manifest_path],
    ["token", stoppedFixture.layout.runtime_token_path],
    ["access", stoppedFixture.layout.runtime_access_path],
    ["lock", stoppedFixture.layout.runtime_lock_path],
    ["bridge-environment", stoppedFixture.layout.runtime_bridge_environment_path],
  ]) {
    writeFileSync(file, "residual-generation-material\n", { mode: 0o600 });
    await assertMaintenanceUpdateRequired({
      options,
      launchctl,
      operationId: `contract:stale-stopped-runtime-${role}-residue`,
    });
    rmSync(file, { force: true });
  }

  rmSync(stoppedFixture.layout.manager_state_path, { force: true });
  await assertMaintenanceNotRequired({
    options,
    launchctl,
    operationId: "contract:stale-stopped-manager-missing",
  });

  const historicalLiveManagerState = makeHistoricalLiveManagerState(
    stoppedFixture,
  );
  writeJson(
    stoppedFixture.layout.manager_state_path,
    historicalLiveManagerState,
  );
  await assertMaintenanceNotRequired({
    options,
    launchctl,
    operationId: "contract:stale-stopped-manager-historical-live",
  });

  writeJson(stoppedFixture.layout.manager_state_path, {
    ...exactStoppedManagerState,
    manager_pid: process.pid,
    manager_process_identity: currentProcessIdentity(),
  });
  await assertMaintenanceUpdateRequired({
    options,
    launchctl,
    operationId: "contract:stale-stopped-manager-current",
  });

  writeJson(stoppedFixture.layout.manager_state_path, {
    ...historicalLiveManagerState,
    supervisor_pid: process.pid,
    supervisor_process_identity: currentProcessIdentity(),
  });
  await assertMaintenanceUpdateRequired({
    options,
    launchctl,
    operationId: "contract:stale-stopped-supervisor-current",
  });

  const liveProcessGroup = currentProcessGroupOwnership(1);
  writeJson(stoppedFixture.layout.manager_state_path, {
    ...historicalLiveManagerState,
    runtime_ownership: makeRuntimeOwnership({
      uiGroup: liveProcessGroup,
      bridgeGroup: liveProcessGroup,
    }),
  });
  await assertMaintenanceUpdateRequired({
    options,
    launchctl,
    operationId: "contract:stale-stopped-runtime-owner-current",
  });

  writeFileSync(stoppedFixture.layout.manager_state_path, "not-json\n", {
    mode: 0o600,
  });
  await assertMaintenanceUpdateRequired({
    options,
    launchctl,
    operationId: "contract:stale-stopped-manager-malformed",
  });
  writeJson(stoppedFixture.layout.manager_state_path, {
    ...exactStoppedManagerState,
    service_identity: "foreign-service",
  });
  await assertMaintenanceUpdateRequired({
    options,
    launchctl,
    operationId: "contract:stale-stopped-manager-foreign",
  });
  writeJson(stoppedFixture.layout.manager_state_path, {
    ...exactStoppedManagerState,
    status: "starting",
  });
  await assertMaintenanceUpdateRequired({
    options,
    launchctl,
    operationId: "contract:stale-stopped-manager-conflicting",
  });
  const { manager_process_identity: _omittedIdentity, ...ownershipIncomplete } =
    exactStoppedManagerState;
  writeJson(stoppedFixture.layout.manager_state_path, ownershipIncomplete);
  await assertMaintenanceUpdateRequired({
    options,
    launchctl,
    operationId: "contract:stale-stopped-manager-ownership-incomplete",
  });
  writeJson(stoppedFixture.layout.manager_state_path, {
    ...historicalLiveManagerState,
    runtime_ownership: makeRuntimeOwnership({
      uiGroup: { ...liveProcessGroup, identity: "c".repeat(64), members: [{
        pid: liveProcessGroup.pid,
        identity: "c".repeat(64),
      }] },
      bridgeGroup: liveProcessGroup,
    }),
  });
  await assert.rejects(
    acquireCompanionServiceMaintenance({
      ...options,
      launchctl,
      operationId: "contract:stale-stopped-runtime-group-changed",
    }),
    (error) =>
      error?.code === "companion_service_runtime_ownership_unverifiable",
  );
  writeJson(stoppedFixture.layout.manager_state_path, exactStoppedManagerState);

  const managerLock = {
    contract: COMPANION_SERVICE_CONTRACT,
    schema_version: 1,
    service_identity: stoppedFixture.configuration.service_identity,
    repository_fingerprint:
      stoppedFixture.configuration.repository_fingerprint,
    manager_id: "contract-active-manager-lock",
    owner_pid: process.pid,
    owner_process_identity: currentProcessIdentity(),
    acquired_at: new Date().toISOString(),
  };
  writeJson(stoppedFixture.layout.manager_lock_path, managerLock);
  await assertMaintenanceUpdateRequired({
    options,
    launchctl,
    operationId: "contract:stale-stopped-manager-lock-active",
  });
  writeJson(stoppedFixture.layout.manager_lock_path, {});
  await assertMaintenanceUpdateRequired({
    options,
    launchctl,
    operationId: "contract:stale-stopped-manager-lock-ambiguous",
  });
  writeJson(stoppedFixture.layout.manager_lock_path, {
    ...managerLock,
    manager_id: "contract-stale-manager-lock",
    owner_pid: 2_147_483_647,
    owner_process_identity: "d".repeat(64),
  });
  await assertMaintenanceNotRequired({
    options,
    launchctl,
    operationId: "contract:stale-stopped-manager-lock-stale",
  });
  rmSync(stoppedFixture.layout.manager_lock_path, { force: true });

  writeJson(stoppedFixture.layout.maintenance_lease_path, {});
  await assertMaintenanceUpdateRequired({
    options,
    launchctl,
    operationId: "contract:stale-stopped-maintenance-ambiguous",
  });
  const maintenanceLease = {
    contract: COMPANION_SERVICE_CONTRACT,
    schema_version: 1,
    service_identity: stoppedFixture.configuration.service_identity,
    repository_fingerprint:
      stoppedFixture.configuration.repository_fingerprint,
    operation_id: "contract:stale-stopped-active-maintenance",
    owner_pid: process.pid,
    owner_process_identity: currentProcessIdentity(),
    pre_maintenance_desired_state: "stopped",
    acquired_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 60_000).toISOString(),
  };
  writeJson(stoppedFixture.layout.maintenance_lease_path, maintenanceLease);
  await assertMaintenanceUpdateRequired({
    options,
    launchctl,
    operationId: "contract:stale-stopped-maintenance-active",
  });
  writeJson(stoppedFixture.layout.maintenance_lease_path, {
    ...maintenanceLease,
    operation_id: "contract:stale-stopped-maintenance-stale",
    owner_pid: 2_147_483_647,
    owner_process_identity: "a".repeat(64),
  });
  await assertMaintenanceUpdateRequired({
    options,
    launchctl,
    operationId: "contract:stale-stopped-maintenance-stale",
  });
  rmSync(stoppedFixture.layout.maintenance_lease_path, { force: true });

  writeJson(
    stoppedFixture.layout.configuration_path,
    stoppedFixture.configuration,
  );

  rmSync(stoppedFixture.layout.desired_state_path);
  const missingDesired = await inspectCompanionService({ ...options, launchctl });
  assert.equal(missingDesired.status, "ambiguous");
  assert.equal(missingDesired.reason, "companion_service_desired_state_missing");
  writeFileSync(stoppedFixture.layout.desired_state_path, "not-json\n", { mode: 0o600 });
  const malformedDesired = await inspectCompanionService({ ...options, launchctl });
  assert.equal(malformedDesired.status, "ambiguous");
  assert.equal(malformedDesired.reason, "companion_service_desired_state_invalid");
  await assert.rejects(
    uninstallCompanionService({ ...options, launchctl }),
    (error) => error?.code === "companion_service_desired_state_invalid",
  );
  writeFileSync(
    stoppedFixture.layout.desired_state_path,
    `${JSON.stringify({
      ...stoppedFixture.desiredState,
      repository_fingerprint: "f".repeat(64),
    })}\n`,
    { mode: 0o600 },
  );
  const foreignDesired = await inspectCompanionService({ ...options, launchctl });
  assert.equal(foreignDesired.status, "ambiguous");
  assert.equal(foreignDesired.reason, "companion_service_desired_state_conflict");
  writeFileSync(
    stoppedFixture.layout.desired_state_path,
    `${JSON.stringify(stoppedFixture.desiredState)}\n`,
    { mode: 0o600 },
  );
  const uninstalledFixture = await uninstallCompanionService({
    ...options,
    launchctl,
  });
  assert.equal(uninstalledFixture.service.status, "not_installed");
  assert.equal(existsSync(stoppedFixture.layout.desired_state_path), false);

  const staleDecommission = await runStaleCheckoutDecommissionContract({
    root,
    repositoryRoot,
    node,
  });

  const singletonRoot = path.join(root, "singleton");
  const singletonHome = path.join(singletonRoot, "home");
  const repositoryA = makeServiceRepositoryFixture({
    root: singletonRoot,
    name: "repository-a",
    sourceRepository: repositoryRoot,
  });
  const repositoryB = makeServiceRepositoryFixture({
    root: singletonRoot,
    name: "repository-b",
    sourceRepository: repositoryRoot,
  });
  const productionA = {
    repositoryRoot: repositoryA,
    homeDirectory: singletonHome,
    environment: { ...process.env, HOME: singletonHome },
  };
  const productionB = {
    repositoryRoot: repositoryB,
    homeDirectory: singletonHome,
    environment: { ...process.env, HOME: singletonHome },
  };
  const serviceA = writeInstalledServiceFixture({
    options: productionA,
    node,
    desiredState: "running",
  });
  const serviceB = writeInstalledServiceFixture({
    options: productionB,
    node,
    desiredState: "stopped",
  });
  const foreignBefore = serviceMaterialFingerprint(serviceA.layout);
  const refusedCheckoutBefore = serviceMaterialFingerprint(serviceB.layout);
  await assert.rejects(
    installCompanionService({
      ...productionB,
      nodePath: node.path,
      launchctl,
      waitMs: 1,
    }),
    (error) => error?.code === "companion_service_other_checkout_conflict",
  );
  await assert.rejects(
    startCompanionService({ ...productionB, launchctl, waitMs: 1 }),
    (error) => error?.code === "companion_service_other_checkout_conflict",
  );
  assert.equal(serviceMaterialFingerprint(serviceA.layout), foreignBefore);
  assert.equal(
    serviceMaterialFingerprint(serviceB.layout),
    refusedCheckoutBefore,
  );

  writeFileSync(serviceA.layout.desired_state_path, "{}\n", { mode: 0o600 });
  await assert.rejects(
    startCompanionService({ ...productionB, launchctl, waitMs: 1 }),
    (error) => error?.code === "companion_service_other_checkout_ambiguous",
  );
  assert.equal(
    readFileSync(serviceA.layout.desired_state_path, "utf8"),
    "{}\n",
  );
  writeFileSync(
    serviceA.layout.desired_state_path,
    `${JSON.stringify(serviceA.desiredState)}\n`,
    { mode: 0o600 },
  );

  let isolatedLoaded = false;
  const isolatedLaunchctl = (args) => {
    if (args[0] === "bootstrap") isolatedLoaded = true;
    if (args[0] === "bootout") isolatedLoaded = false;
    return { status: args[0] === "print" ? (isolatedLoaded ? 0 : 113) : 0 };
  };
  await assert.rejects(
    installCompanionService({
      ...options,
      homeDirectory: singletonHome,
      nodePath: node.path,
      launchctl: isolatedLaunchctl,
      waitMs: 1,
    }),
    (error) => error?.code === "companion_service_manager_state_unavailable",
  );
  assert.equal(serviceMaterialFingerprint(serviceA.layout), foreignBefore);
  assert.equal(serviceB.desiredState.desired_state, "stopped");

  const coreSource = readFileSync(
    path.join(repositoryRoot, "plugins", "augnes-operator", "mcp", "companion-service-core.mjs"),
    "utf8",
  );
  for (const forbiddenImport of [
    "better-sqlite3",
    'from "next',
    "apps/augnes_apps",
    "node_modules",
  ]) assert.equal(coreSource.includes(forbiddenImport), false, forbiddenImport);
  assert.equal(
    coreSource.match(
      /"\/usr\/bin\/python3",\s*\[\s*"-I",\s*"-S",\s*"-c"/gu,
    )?.length,
    2,
  );
  const pythonIsolationRoot = path.join(root, "python-isolation");
  const pythonIsolationMarker = path.join(pythonIsolationRoot, "site-loaded");
  mkdirSync(pythonIsolationRoot, { recursive: true, mode: 0o700 });
  writeFileSync(
    path.join(pythonIsolationRoot, "sitecustomize.py"),
    `from pathlib import Path\nPath(${JSON.stringify(pythonIsolationMarker)}).write_text("loaded")\n`,
    { mode: 0o600 },
  );
  const isolatedPython = spawnSync(
    "/usr/bin/python3",
    ["-I", "-S", "-c", "pass"],
    {
      cwd: pythonIsolationRoot,
      encoding: "utf8",
      env: {
        PATH: "/usr/bin:/bin",
        PYTHONPATH: pythonIsolationRoot,
      },
    },
  );
  assert.equal(isolatedPython.status, 0, isolatedPython.stderr);
  assert.equal(existsSync(pythonIsolationMarker), false);
  const sampleConfiguration = {
    service_label: layout.service_label,
    node_path: node.path,
    manager_entry_path: path.join(repositoryRoot, "scripts", "augnes-companion-service.mjs"),
    configuration_path: layout.configuration_path,
    repository_root: repositoryRoot,
  };
  const plist = buildLaunchAgentPlist(sampleConfiguration);
  assert.match(plist, /<key>RunAtLoad<\/key>/u);
  assert.match(plist, /<key>KeepAlive<\/key>/u);
  assert.match(plist, /<key>ThrottleInterval<\/key>/u);
  assert.match(plist, /<key>SuccessfulExit<\/key>/u);
  for (const secretName of ["OPENAI_API_KEY", "token", "cookie", "nonce"]) {
    assert.equal(plist.includes(secretName), false);
  }

  const birthAttempt = createCompanionSupervisorAttemptDiagnostics();
  appendCompanionSupervisorAttemptOutput(birthAttempt, "birth-attempt-output");
  const birthFailure = snapshotCompanionSupervisorFailureProvenance({
    attempt: birthAttempt,
    failureOrigin: "child_birth_identity_unavailable",
    restartCount: 1,
  });
  assert.deepEqual(birthFailure, {
    failure_origin: "child_birth_identity_unavailable",
    child_exit_status: null,
    child_exit_signal_present: false,
    restart_count: 1,
    restart_reason: "companion_service_restart_backoff",
    attempt_tail_sha256: tailFingerprint("birth-attempt-output"),
  });

  const observedExitAttempt = createCompanionSupervisorAttemptDiagnostics();
  appendCompanionSupervisorAttemptOutput(observedExitAttempt, "observed-exit-output");
  observeCompanionSupervisorAttemptExit(observedExitAttempt, 17, null);
  const observedExitFailure = snapshotCompanionSupervisorFailureProvenance({
    attempt: observedExitAttempt,
    failureOrigin: "managed_child_exit_observed",
    restartCount: 2,
  });
  assert.equal(observedExitFailure.failure_origin, "managed_child_exit_observed");
  assert.equal(observedExitFailure.child_exit_status, 17);
  assert.equal(observedExitFailure.child_exit_signal_present, false);

  const observedSignalAttempt = createCompanionSupervisorAttemptDiagnostics();
  observeCompanionSupervisorAttemptExit(observedSignalAttempt, null, "SIGTERM");
  const observedSignalFailure = snapshotCompanionSupervisorFailureProvenance({
    attempt: observedSignalAttempt,
    failureOrigin: "managed_child_exit_observed",
    restartCount: 3,
  });
  assert.equal(observedSignalFailure.child_exit_status, null);
  assert.equal(observedSignalFailure.child_exit_signal_present, true);

  const identityLostAttempt = createCompanionSupervisorAttemptDiagnostics();
  const privateAttemptOutput = [
    "OPENAI_API_KEY=not-a-real-secret",
    "/private/example/home",
    "raw supervisor failure",
  ].join("\n");
  appendCompanionSupervisorAttemptOutput(identityLostAttempt, privateAttemptOutput);
  const identityLostFailure = snapshotCompanionSupervisorFailureProvenance({
    attempt: identityLostAttempt,
    failureOrigin: "managed_child_identity_lost",
    restartCount: 4,
  });
  assert.equal(identityLostFailure.child_exit_status, null);
  assert.equal(identityLostFailure.child_exit_signal_present, false);
  assert.equal(identityLostFailure.attempt_tail_sha256, tailFingerprint(privateAttemptOutput));
  const persistedFailure = JSON.stringify(identityLostFailure);
  for (const forbidden of [
    "OPENAI_API_KEY",
    "not-a-real-secret",
    "/private/example/home",
    "raw supervisor failure",
    "output_tail",
    "exit_observation",
  ]) assert.equal(persistedFailure.includes(forbidden), false, forbidden);

  const separateAttempt = createCompanionSupervisorAttemptDiagnostics();
  appendCompanionSupervisorAttemptOutput(separateAttempt, "separate-attempt-output");
  const separateFailure = snapshotCompanionSupervisorFailureProvenance({
    attempt: separateAttempt,
    failureOrigin: "managed_child_identity_lost",
    restartCount: 5,
  });
  assert.equal(
    separateFailure.attempt_tail_sha256,
    tailFingerprint("separate-attempt-output"),
  );
  assert.notEqual(
    separateFailure.attempt_tail_sha256,
    identityLostFailure.attempt_tail_sha256,
  );
  assert.deepEqual(
    readCompanionSupervisorFailureProvenance({
      unrelated_manager_state_field: true,
      supervisor_failure_provenance: observedExitFailure,
    }),
    observedExitFailure,
  );
  assert.equal(
    readCompanionSupervisorFailureProvenance({
      supervisor_failure_provenance: {
        ...observedExitFailure,
        raw_tail: "forbidden",
      },
    }),
    null,
  );

  const healthyObservation = {
    status: "live",
    checkout_relation: "exact",
    service_identity: "a".repeat(64),
    start_available: false,
    resume_available: true,
    reason: "companion_service_live",
  };
  assert.deepEqual(
    publicCompanionServiceProjection({
      ...healthyObservation,
      supervisor_failure_provenance: observedExitFailure,
    }),
    publicCompanionServiceProjection(healthyObservation),
  );
  assert.equal(
    JSON.stringify(publicCompanionServiceProjection(healthyObservation))
      .includes("supervisor_failure_provenance"),
    false,
  );

  console.log(JSON.stringify({
    status: "pass",
    contract: COMPANION_SERVICE_CONTRACT,
    desired_state_contract: COMPANION_SERVICE_DESIRED_STATE_CONTRACT,
    deterministic_checkout_label: true,
    node24_exact_binary_binding: true,
    install_failure_exact_rollback: true,
    durable_stop_loaded_projection: true,
    desired_state_missing_malformed_and_foreign_refused: true,
    stopped_maintenance_noop: true,
    stale_source_exact_stopped_maintenance_noop: true,
    stale_node_binding_maintenance_refused: true,
    stale_source_running_loaded_runtime_and_residue_refused: true,
    stale_source_missing_and_historical_manager_state_noop: true,
    stale_source_live_and_conflicting_ownership_refused: true,
    stale_source_manager_lock_classified_without_mutation: true,
    stale_source_maintenance_requires_exact_none: true,
    stale_source_public_projection_unchanged: true,
    desired_state_exact_uninstall_cleanup: true,
    stale_checkout_decommission_cases: staleDecommission,
    production_singleton_foreign_install_and_start_refused: true,
    production_singleton_zero_foreign_mutation: true,
    test_scoped_service_singleton_exempt: true,
    existing_launch_agent_directory_mode_preserved: true,
    public_projection_private_fields: 0,
    arbitrary_command_or_label_inputs: 0,
    manager_node_module_imports: 0,
    stale_decommission_helper_isolated_from_user_site: true,
    supervisor_failure_origins_bounded: true,
    supervisor_failure_exit_observation_bounded: true,
    supervisor_failure_attempt_tail_isolated: true,
    supervisor_failure_raw_output_persisted: false,
    supervisor_failure_public_projection_fields: 0,
    lifecycle_authority_flags_false: true,
    real_provider_calls: 0,
  }, null, 2));
} finally {
  rmSync(root, { recursive: true, force: true });
}

function writeInstalledServiceFixture({ options: fixtureOptions, node, desiredState }) {
  const layout = resolveCompanionServiceLayout(fixtureOptions);
  const configuration = {
    contract: COMPANION_SERVICE_CONTRACT,
    schema_version: 1,
    manager_version: 1,
    service_label: layout.service_label,
    service_identity: layout.service_identity,
    repository_root: layout.repository.realpath,
    repository_fingerprint: layout.repository.repository_fingerprint,
    repository_device: layout.repository.device,
    repository_inode: layout.repository.inode,
    node_path: node.path,
    node_version: node.version,
    manager_entry_path: path.join(
      layout.repository.realpath,
      "scripts",
      "augnes-companion-service.mjs",
    ),
    service_source_fingerprint: computeServiceSourceFingerprint(
      layout.repository.realpath,
    ),
    runtime_state_directory: layout.runtime_directory,
    runtime_home_directory: layout.test
      ? path.join(layout.test.root, "home")
      : layout.home,
    database_path: layout.test
      ? path.join(layout.test.root, "data", "augnes.db")
      : null,
    configuration_path: layout.configuration_path,
    launch_agent_path: layout.launch_agent_path,
    installed_at: new Date().toISOString(),
    test_scope: layout.test?.scope ?? null,
    test_root: layout.test?.root ?? null,
  };
  const desiredStateRecord = {
    contract: COMPANION_SERVICE_DESIRED_STATE_CONTRACT,
    schema_version: COMPANION_SERVICE_DESIRED_STATE_SCHEMA_VERSION,
    service_identity: configuration.service_identity,
    repository_fingerprint: configuration.repository_fingerprint,
    desired_state: desiredState,
    updated_at: new Date().toISOString(),
  };
  mkdirSync(layout.service_directory, { recursive: true, mode: 0o700 });
  mkdirSync(path.dirname(layout.launch_agent_path), {
    recursive: true,
    mode: 0o755,
  });
  writeFileSync(
    layout.configuration_path,
    `${JSON.stringify(configuration)}\n`,
    { mode: 0o600 },
  );
  writeFileSync(
    layout.desired_state_path,
    `${JSON.stringify(desiredStateRecord)}\n`,
    { mode: 0o600 },
  );
  writeFileSync(layout.launch_agent_path, buildLaunchAgentPlist(configuration), {
    mode: 0o600,
  });
  return { layout, configuration, desiredState: desiredStateRecord };
}

async function runStaleCheckoutDecommissionContract({
  root: fixtureRoot,
  repositoryRoot: fixtureRepositoryRoot,
  node,
}) {
  const stateRoot = path.join(fixtureRoot, "stale-checkout-decommission");
  const makeOptions = (scope) => ({
    repositoryRoot: fixtureRepositoryRoot,
    homeDirectory: path.join(stateRoot, scope, "home"),
    environment: {
      ...process.env,
      AUGNES_COMPANION_SERVICE_TEST_MODE: "1",
      AUGNES_COMPANION_SERVICE_TEST_ROOT: stateRoot,
      AUGNES_COMPANION_SERVICE_TEST_SCOPE: scope,
    },
    testScope: scope,
  });
  const writeStaleFixture = ({
    scope,
    desiredState = "stopped",
    changed = "inode",
    overrides = {},
  }) => {
    const fixtureOptions = makeOptions(scope);
    const fixture = writeInstalledServiceFixture({
      options: fixtureOptions,
      node,
      desiredState,
    });
    const configuration = {
      ...fixture.configuration,
      ...(changed === "device"
        ? {
            repository_device: differentCanonicalStatIdentity(
              fixture.configuration.repository_device,
            ),
          }
        : {
            repository_inode: differentCanonicalStatIdentity(
              fixture.configuration.repository_inode,
            ),
          }),
      ...overrides,
    };
    writeJson(fixture.layout.configuration_path, configuration);
    return { ...fixture, options: fixtureOptions, configuration };
  };
  const makeLaunchctl = (
    initiallyLoaded = false,
    configuration = null,
    jobOverrides = {},
  ) => {
    let loaded = initiallyLoaded;
    const actions = [];
    return {
      actions,
      launchctl: (args) => {
        actions.push([...args]);
        if (args[0] === "bootout") loaded = false;
        if (args[0] === "bootstrap" || args[0] === "kickstart") loaded = true;
        if (args[0] !== "print") return { status: 0, stdout: "" };
        if (!loaded) return { status: 113, stdout: "" };
        assert.notEqual(configuration, null);
        const job = {
          label: configuration.service_label,
          path: configuration.launch_agent_path,
          program: configuration.node_path,
          arguments: [
            configuration.node_path,
            configuration.manager_entry_path,
            "run",
            "--config",
            configuration.configuration_path,
          ],
          working_directory: configuration.repository_root,
          ...jobOverrides,
        };
        return {
          status: 0,
          stdout: [
            `gui/${process.getuid()}/${job.label} = {`,
            `\tpath = ${job.path}`,
            `\tprogram = ${job.program}`,
            "\targuments = {",
            ...job.arguments.map((value) => `\t\t${value}`),
            "\t}",
            `\tworking directory = ${job.working_directory}`,
            "}",
            "",
          ].join("\n"),
        };
      },
    };
  };
  const assertStaleProjection = async (fixture, launchctl) => {
    const observation = await inspectCompanionService({
      ...fixture.options,
      launchctl,
    });
    assert.equal(observation.status, "recovery_required");
    assert.equal(observation.checkout_relation, "substituted_or_moved");
    assert.equal(
      observation.reason,
      "companion_service_checkout_identity_changed",
    );
    const projection = publicCompanionServiceProjection(observation);
    assert.equal(projection.start_available, false);
    assert.equal(projection.canonical_resume_available, false);
    assert.equal(
      projection.next_action,
      "Decommission the stale Companion service explicitly.",
    );
    const serialized = JSON.stringify(projection);
    for (const forbidden of [
      fixtureRepositoryRoot,
      fixtureRoot,
      fixture.configuration.node_path,
      fixture.configuration.manager_entry_path,
      "repository_device",
      "repository_inode",
      "configuration_path",
      "launch_agent_path",
      "manager_pid",
      "process_identity",
      "proxy_token",
      "OPENAI_API_KEY",
      "provider_response",
    ]) assert.equal(serialized.includes(forbidden), false, forbidden);
  };
  const assertDecommissionRefused = async ({
    fixture,
    launchctl,
    codes = ["companion_service_stale_checkout_decommission_refused"],
  }) => {
    const configurationBefore = existsSync(fixture.layout.configuration_path)
      ? readFileSync(fixture.layout.configuration_path, "utf8")
      : null;
    const plistBefore = existsSync(fixture.layout.launch_agent_path)
      ? readFileSync(fixture.layout.launch_agent_path, "utf8")
      : null;
    await assert.rejects(
      uninstallCompanionService({ ...fixture.options, launchctl }),
      (error) => codes.includes(error?.code),
    );
    if (configurationBefore !== null) {
      assert.equal(
        readFileSync(fixture.layout.configuration_path, "utf8"),
        configurationBefore,
      );
    }
    if (plistBefore !== null) {
      assert.equal(
        readFileSync(fixture.layout.launch_agent_path, "utf8"),
        plistBefore,
      );
    }
  };

  const inodeFixture = writeStaleFixture({ scope: "stale-inode-success" });
  assert.match(inodeFixture.configuration.repository_device, /^(?:0|[1-9][0-9]*)$/u);
  assert.match(inodeFixture.configuration.repository_inode, /^[1-9][0-9]*$/u);
  assert.equal(
    String(BigInt(inodeFixture.configuration.repository_device)),
    inodeFixture.configuration.repository_device,
  );
  assert.equal(
    String(BigInt(inodeFixture.configuration.repository_inode)),
    inodeFixture.configuration.repository_inode,
  );
  assert.notEqual(
    inodeFixture.configuration.repository_inode,
    inodeFixture.layout.repository.inode,
  );
  const inodeLaunchctl = makeLaunchctl();
  const unrelatedLaunchAgent = path.join(
    path.dirname(inodeFixture.layout.launch_agent_path),
    "com.example.unrelated.plist",
  );
  writeFileSync(unrelatedLaunchAgent, "unrelated\n", { mode: 0o600 });
  await assertStaleProjection(inodeFixture, inodeLaunchctl.launchctl);
  await assert.rejects(
    startCompanionService({
      ...inodeFixture.options,
      launchctl: inodeLaunchctl.launchctl,
      waitMs: 1,
    }),
    (error) => error?.code === "companion_service_recovery_refused",
  );
  await assert.rejects(
    stopCompanionService({
      ...inodeFixture.options,
      launchctl: inodeLaunchctl.launchctl,
      waitMs: 1,
    }),
    (error) => error?.code === "companion_service_stop_refused",
  );
  const inodeResult = await uninstallCompanionService({
    ...inodeFixture.options,
    launchctl: inodeLaunchctl.launchctl,
  });
  assert.equal(inodeResult.result, "changed");
  assert.equal(inodeResult.service.status, "not_installed");
  assert.equal(inodeResult.authority.runtime_lifecycle_effect, true);
  for (const [key, value] of Object.entries(inodeResult.authority)) {
    if (key !== "runtime_lifecycle_effect") assert.equal(value, false, key);
  }
  for (const file of [
    inodeFixture.layout.configuration_path,
    inodeFixture.layout.desired_state_path,
    inodeFixture.layout.manager_state_path,
    inodeFixture.layout.manager_lock_path,
    inodeFixture.layout.lifecycle_lock_path,
    inodeFixture.layout.maintenance_lease_path,
    inodeFixture.layout.launch_agent_path,
    inodeFixture.layout.runtime_manifest_path,
    inodeFixture.layout.runtime_token_path,
    inodeFixture.layout.runtime_access_path,
    inodeFixture.layout.runtime_lock_path,
    inodeFixture.layout.runtime_bridge_environment_path,
  ]) assert.equal(existsSync(file), false, file);
  assert.equal(readFileSync(unrelatedLaunchAgent, "utf8"), "unrelated\n");
  assert.equal(
    inodeLaunchctl.actions.some(([command]) =>
      command === "bootstrap" || command === "kickstart"
    ),
    false,
  );
  const inodeReplay = await uninstallCompanionService({
    ...inodeFixture.options,
    launchctl: inodeLaunchctl.launchctl,
  });
  assert.equal(inodeReplay.result, "exact_replay");

  const deviceFixture = writeStaleFixture({
    scope: "stale-device-success",
    changed: "device",
  });
  assert.equal(
    String(BigInt(deviceFixture.configuration.repository_device)),
    deviceFixture.configuration.repository_device,
  );
  assert.notEqual(
    deviceFixture.configuration.repository_device,
    deviceFixture.layout.repository.device,
  );
  const deviceLaunchctl = makeLaunchctl();
  await assertStaleProjection(deviceFixture, deviceLaunchctl.launchctl);
  assert.equal(
    (await uninstallCompanionService({
      ...deviceFixture.options,
      launchctl: deviceLaunchctl.launchctl,
    })).service.status,
    "not_installed",
  );

  const unstableSnapshotFixture = writeStaleFixture({
    scope: "stale-live-snapshot-unstable",
  });
  writeExplicitStoppedManagerState(unstableSnapshotFixture);
  const unstableSnapshotLaunchctl = makeLaunchctl(
    true,
    unstableSnapshotFixture.configuration,
  );
  let unstableSnapshotAttempts = 0;
  await assert.rejects(
    uninstallCompanionService({
      ...unstableSnapshotFixture.options,
      launchctl: unstableSnapshotLaunchctl.launchctl,
      testStaleDecommissionStageHook: ({
        stage,
        snapshot_kind: snapshotKind,
      }) => {
        if (
          stage !== "live_snapshot_after_manager_state_a" ||
          snapshotKind !== "initial"
        ) return;
        unstableSnapshotAttempts += 1;
        const managerState = JSON.parse(readFileSync(
          unstableSnapshotFixture.layout.manager_state_path,
          "utf8",
        ));
        writeJson(unstableSnapshotFixture.layout.manager_state_path, {
          ...managerState,
          restart_count: managerState.restart_count + 1,
          updated_at: new Date(Date.now() + unstableSnapshotAttempts).toISOString(),
        });
      },
    }),
    (error) =>
      error?.code === "companion_service_stale_checkout_decommission_refused" &&
      error?.cause?.code === "live_snapshot_unstable",
  );
  assert.equal(unstableSnapshotAttempts, 3);
  assert.equal(
    unstableSnapshotLaunchctl.actions.some(([command]) => command === "bootout"),
    false,
  );
  assert.equal(
    existsSync(unstableSnapshotFixture.layout.stale_decommission_path),
    false,
  );
  assert.equal(
    existsSync(unstableSnapshotFixture.layout.configuration_path),
    true,
  );

  const immutableRaceFixture = writeStaleFixture({
    scope: "stale-immutable-pre-effect-changed",
  });
  writeExplicitStoppedManagerState(immutableRaceFixture);
  const immutableRaceLaunchctl = makeLaunchctl(
    true,
    immutableRaceFixture.configuration,
  );
  await assert.rejects(
    uninstallCompanionService({
      ...immutableRaceFixture.options,
      launchctl: immutableRaceLaunchctl.launchctl,
      testStaleDecommissionStageHook: ({ stage }) => {
        if (stage !== "before_first_effect_revalidation") return;
        const desired = JSON.parse(readFileSync(
          immutableRaceFixture.layout.desired_state_path,
          "utf8",
        ));
        writeJson(immutableRaceFixture.layout.desired_state_path, {
          ...desired,
          updated_at: new Date(Date.now() + 1_000).toISOString(),
        });
      },
    }),
    (error) =>
      error?.code === "companion_service_stale_checkout_decommission_refused" &&
      error?.cause?.code === "immutable_material_changed",
  );
  assert.equal(
    immutableRaceLaunchctl.actions.some(([command]) => command === "bootout"),
    false,
  );
  assert.equal(existsSync(immutableRaceFixture.layout.configuration_path), true);
  assert.equal(existsSync(immutableRaceFixture.layout.stale_decommission_path), false);

  const launchJobRaceFixture = writeStaleFixture({
    scope: "stale-launch-job-pre-effect-changed",
  });
  writeExplicitStoppedManagerState(launchJobRaceFixture);
  const launchJobRaceBase = makeLaunchctl(
    true,
    launchJobRaceFixture.configuration,
  );
  let launchJobChanged = false;
  const launchJobRaceLaunchctl = (args) => {
    if (launchJobChanged && args[0] === "print") {
      return makeLaunchctl(
        true,
        launchJobRaceFixture.configuration,
        { program: "/usr/bin/false" },
      ).launchctl(args);
    }
    return launchJobRaceBase.launchctl(args);
  };
  await assert.rejects(
    uninstallCompanionService({
      ...launchJobRaceFixture.options,
      launchctl: launchJobRaceLaunchctl,
      testStaleDecommissionStageHook: ({ stage }) => {
        if (stage === "before_first_effect_revalidation") {
          launchJobChanged = true;
        }
      },
    }),
    (error) =>
      error?.code === "companion_service_stale_checkout_decommission_refused" &&
      error?.cause?.code === "launch_job_changed",
  );
  assert.equal(
    launchJobRaceBase.actions.some(([command]) => command === "bootout"),
    false,
  );
  assert.equal(existsSync(launchJobRaceFixture.layout.configuration_path), true);
  assert.equal(existsSync(launchJobRaceFixture.layout.stale_decommission_path), false);

  const ownershipRaceFixture = writeStaleFixture({
    scope: "stale-process-ownership-pre-effect-changed",
  });
  writeExplicitStoppedManagerState(ownershipRaceFixture);
  const ownershipRaceLaunchctl = makeLaunchctl(
    true,
    ownershipRaceFixture.configuration,
  );
  await assert.rejects(
    uninstallCompanionService({
      ...ownershipRaceFixture.options,
      launchctl: ownershipRaceLaunchctl.launchctl,
      testStaleDecommissionStageHook: ({ stage }) => {
        if (stage !== "before_first_effect_revalidation") return;
        const managerState = JSON.parse(readFileSync(
          ownershipRaceFixture.layout.manager_state_path,
          "utf8",
        ));
        writeJson(ownershipRaceFixture.layout.manager_state_path, {
          ...managerState,
          restart_count: managerState.restart_count + 1,
          updated_at: new Date(Date.now() + 1_000).toISOString(),
        });
      },
    }),
    (error) =>
      error?.code === "companion_service_stale_checkout_decommission_refused" &&
      error?.cause?.code === "process_ownership_changed",
  );
  assert.equal(
    ownershipRaceLaunchctl.actions.some(([command]) => command === "bootout"),
    false,
  );
  assert.equal(existsSync(ownershipRaceFixture.layout.configuration_path), true);
  assert.equal(existsSync(ownershipRaceFixture.layout.stale_decommission_path), false);

  const malformedPhysicalIdentities = [
    ["suffix", "repository_device", "123-changed"],
    ["negative", "repository_device", "-1"],
    ["positive-sign", "repository_device", "+1"],
    ["leading-space", "repository_device", " 1"],
    ["trailing-space", "repository_device", "1 "],
    ["nondecimal", "repository_device", "device"],
    ["empty", "repository_device", ""],
    ["leading-zero", "repository_device", "01"],
    ["zero-inode", "repository_inode", "0"],
    ["missing-device", "repository_device", undefined],
    ["missing-inode", "repository_inode", undefined],
  ];
  for (const [name, field, value] of malformedPhysicalIdentities) {
    const malformedFixture = writeStaleFixture({
      scope: `stale-malformed-physical-${name}`,
      overrides: { [field]: value },
    });
    await assertDecommissionRefused({
      fixture: malformedFixture,
      launchctl: makeLaunchctl().launchctl,
    });
  }

  const loadedFixture = writeStaleFixture({ scope: "stale-loaded-success" });
  writeExplicitStoppedManagerState(loadedFixture);
  const loadedLaunchctl = makeLaunchctl(
    true,
    loadedFixture.configuration,
  );
  assert.equal(
    (await uninstallCompanionService({
      ...loadedFixture.options,
      launchctl: loadedLaunchctl.launchctl,
    })).service.status,
    "not_installed",
  );
  assert.equal(
    loadedLaunchctl.actions.filter(([command]) => command === "bootout").length,
    1,
  );
  assert.deepEqual(
    loadedLaunchctl.actions.find(([command]) => command === "bootout"),
    ["bootout", `gui/${process.getuid()}/${loadedFixture.configuration.service_label}`],
  );

  const definitionFallbackFixture = writeStaleFixture({
    scope: "stale-loaded-definition-fd-fallback",
  });
  writeExplicitStoppedManagerState(definitionFallbackFixture);
  const definitionFallbackBase = makeLaunchctl(
    true,
    definitionFallbackFixture.configuration,
  );
  const definitionFallbackLaunchctl = (args) => {
    if (
      args[0] === "bootout" &&
      args[1] ===
        `gui/${process.getuid()}/${definitionFallbackFixture.configuration.service_label}`
    ) {
      definitionFallbackBase.actions.push([...args]);
      return { status: 64, stdout: "" };
    }
    if (
      args[0] === "bootout" &&
      args[1] === `gui/${process.getuid()}` &&
      typeof args[2] === "string"
    ) {
      const helper = readFileSync(args[2], "utf8");
      assert.equal(
        helper.includes(definitionFallbackFixture.configuration.service_label),
        true,
      );
      assert.equal(
        helper.includes(definitionFallbackFixture.configuration.manager_entry_path),
        false,
      );
      assert.equal(
        helper.includes(definitionFallbackFixture.configuration.repository_root),
        false,
      );
    }
    return definitionFallbackBase.launchctl(args);
  };
  assert.equal(
    (await uninstallCompanionService({
      ...definitionFallbackFixture.options,
      launchctl: definitionFallbackLaunchctl,
    })).service.status,
    "not_installed",
  );
  const definitionFallbackBootouts = definitionFallbackBase.actions.filter(
    ([command]) => command === "bootout",
  );
  assert.equal(definitionFallbackBootouts.length, 2);
  assert.deepEqual(definitionFallbackBootouts[0], [
    "bootout",
    `gui/${process.getuid()}/${definitionFallbackFixture.configuration.service_label}`,
  ]);
  assert.equal(definitionFallbackBootouts[1][0], "bootout");
  assert.equal(definitionFallbackBootouts[1][1], `gui/${process.getuid()}`);
  assert.equal(
    path.dirname(definitionFallbackBootouts[1][2]),
    definitionFallbackFixture.layout.service_directory,
  );
  assert.match(
    path.basename(definitionFallbackBootouts[1][2]),
    /^\.stale-decommission-launch-agent-[a-f0-9-]+\.plist$/u,
  );

  const bootoutRaceFixture = writeStaleFixture({
    scope: "stale-loaded-plist-swap-contained",
  });
  writeExplicitStoppedManagerState(bootoutRaceFixture);
  const bootoutRaceLaunchctl = makeLaunchctl(
    true,
    bootoutRaceFixture.configuration,
  );
  const foreignPlist = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<plist version=\"1.0\"><dict>",
    "<key>Label</key><string>com.example.unrelated</string>",
    "<key>ProgramArguments</key><array><string>/usr/bin/false</string></array>",
    "</dict></plist>",
    "",
  ].join("\n");
  const launchctlWithBootoutSwap = (args) => {
    if (args[0] === "bootout") {
      assert.deepEqual(args, [
        "bootout",
        `gui/${process.getuid()}/${bootoutRaceFixture.configuration.service_label}`,
      ]);
      writeFileSync(
        bootoutRaceFixture.layout.launch_agent_path,
        foreignPlist,
        { mode: 0o600 },
      );
    }
    return bootoutRaceLaunchctl.launchctl(args);
  };
  await assert.rejects(
    uninstallCompanionService({
      ...bootoutRaceFixture.options,
      launchctl: launchctlWithBootoutSwap,
    }),
    (error) =>
      error?.code === "companion_service_stale_checkout_decommission_refused",
  );
  assert.equal(
    readFileSync(bootoutRaceFixture.layout.launch_agent_path, "utf8"),
    foreignPlist,
  );

  const staleMaintenanceFixture = writeStaleFixture({
    scope: "stale-maintenance-success",
  });
  writeJson(staleMaintenanceFixture.layout.maintenance_lease_path, {
    contract: COMPANION_SERVICE_CONTRACT,
    schema_version: 1,
    service_identity: staleMaintenanceFixture.configuration.service_identity,
    repository_fingerprint:
      staleMaintenanceFixture.configuration.repository_fingerprint,
    operation_id: "contract:stale-decommission-expired-maintenance",
    owner_pid: 2_147_483_647,
    owner_process_identity: "a".repeat(64),
    pre_maintenance_desired_state: "stopped",
    acquired_at: new Date(Date.now() - 120_000).toISOString(),
    expires_at: new Date(Date.now() - 60_000).toISOString(),
  });
  assert.equal(
    (await uninstallCompanionService({
      ...staleMaintenanceFixture.options,
      launchctl: makeLaunchctl().launchctl,
    })).service.status,
    "not_installed",
  );

  const movedRootFixture = writeStaleFixture({
    scope: "stale-moved-root-refused",
    overrides: {
      repository_root: path.join(fixtureRoot, "moved-repository"),
      manager_entry_path: path.join(
        fixtureRoot,
        "moved-repository",
        "scripts",
        "augnes-companion-service.mjs",
      ),
    },
  });
  await assertDecommissionRefused({
    fixture: movedRootFixture,
    launchctl: makeLaunchctl().launchctl,
  });

  const foreignIdentityFixture = writeStaleFixture({
    scope: "stale-foreign-identity-refused",
    overrides: { service_identity: "f".repeat(64) },
  });
  await assertDecommissionRefused({
    fixture: foreignIdentityFixture,
    launchctl: makeLaunchctl().launchctl,
  });

  const foreignRepositoryFixture = writeStaleFixture({
    scope: "stale-foreign-repository-refused",
    overrides: { repository_fingerprint: "e".repeat(64) },
  });
  await assertDecommissionRefused({
    fixture: foreignRepositoryFixture,
    launchctl: makeLaunchctl().launchctl,
  });

  const modifiedPlistFixture = writeStaleFixture({
    scope: "stale-modified-plist-refused",
  });
  writeFileSync(
    modifiedPlistFixture.layout.launch_agent_path,
    `${buildLaunchAgentPlist(modifiedPlistFixture.configuration)}<!-- changed -->\n`,
    { mode: 0o600 },
  );
  await assertDecommissionRefused({
    fixture: modifiedPlistFixture,
    launchctl: makeLaunchctl().launchctl,
  });

  const missingConfigurationFixture = writeStaleFixture({
    scope: "stale-missing-configuration-refused",
  });
  rmSync(missingConfigurationFixture.layout.configuration_path);
  await assertDecommissionRefused({
    fixture: missingConfigurationFixture,
    launchctl: makeLaunchctl().launchctl,
    codes: ["companion_service_uninstall_refused"],
  });

  const missingDesiredFixture = writeStaleFixture({
    scope: "stale-missing-desired-refused",
  });
  rmSync(missingDesiredFixture.layout.desired_state_path);
  await assertDecommissionRefused({
    fixture: missingDesiredFixture,
    launchctl: makeLaunchctl().launchctl,
  });

  const ambiguousMaintenanceFixture = writeStaleFixture({
    scope: "stale-ambiguous-maintenance-refused",
  });
  writeJson(ambiguousMaintenanceFixture.layout.maintenance_lease_path, {});
  await assertDecommissionRefused({
    fixture: ambiguousMaintenanceFixture,
    launchctl: makeLaunchctl().launchctl,
  });

  const activeMaintenanceFixture = writeStaleFixture({
    scope: "stale-active-maintenance-refused",
  });
  writeJson(activeMaintenanceFixture.layout.maintenance_lease_path, {
    contract: COMPANION_SERVICE_CONTRACT,
    schema_version: 1,
    service_identity: activeMaintenanceFixture.configuration.service_identity,
    repository_fingerprint:
      activeMaintenanceFixture.configuration.repository_fingerprint,
    operation_id: "contract:stale-decommission-active-maintenance",
    owner_pid: process.pid,
    owner_process_identity: currentProcessIdentity(),
    pre_maintenance_desired_state: "stopped",
    acquired_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 60_000).toISOString(),
  });
  await assertDecommissionRefused({
    fixture: activeMaintenanceFixture,
    launchctl: makeLaunchctl().launchctl,
    codes: ["companion_service_maintenance_active"],
  });

  const ambiguousManagerFixture = writeStaleFixture({
    scope: "stale-ambiguous-manager-refused",
  });
  writeJson(ambiguousManagerFixture.layout.manager_state_path, {});
  await assertDecommissionRefused({
    fixture: ambiguousManagerFixture,
    launchctl: makeLaunchctl().launchctl,
  });

  const ambiguousRuntimeFixture = writeStaleFixture({
    scope: "stale-ambiguous-runtime-refused",
  });
  writeJson(ambiguousRuntimeFixture.layout.runtime_manifest_path, {});
  await assertDecommissionRefused({
    fixture: ambiguousRuntimeFixture,
    launchctl: makeLaunchctl().launchctl,
  });

  const changedBirthFixture = writeStaleFixture({
    scope: "stale-process-birth-refused",
  });
  writeJson(changedBirthFixture.layout.manager_state_path, {
    ...writeExplicitStoppedManagerState(changedBirthFixture),
    manager_pid: process.pid,
    manager_process_identity: "0".repeat(64),
  });
  await assertDecommissionRefused({
    fixture: changedBirthFixture,
    launchctl: makeLaunchctl().launchctl,
  });

  const matchingForeignProcessFixture = writeStaleFixture({
    scope: "stale-matching-foreign-process-refused",
  });
  const matchingForeignState = writeExplicitStoppedManagerState(
    matchingForeignProcessFixture,
  );
  writeJson(matchingForeignProcessFixture.layout.manager_state_path, {
    ...matchingForeignState,
    manager_pid: process.pid,
    manager_process_identity: currentProcessIdentity(),
  });
  await assertDecommissionRefused({
    fixture: matchingForeignProcessFixture,
    launchctl: makeLaunchctl().launchctl,
  });
  assert.doesNotThrow(() => process.kill(process.pid, 0));

  const foreignLoadedJobFixture = writeStaleFixture({
    scope: "stale-foreign-loaded-job-refused",
  });
  writeExplicitStoppedManagerState(foreignLoadedJobFixture);
  const foreignLoadedJobLaunchctl = makeLaunchctl(
    true,
    foreignLoadedJobFixture.configuration,
    { program: "/usr/bin/false" },
  );
  await assertDecommissionRefused({
    fixture: foreignLoadedJobFixture,
    launchctl: foreignLoadedJobLaunchctl.launchctl,
  });
  assert.equal(
    foreignLoadedJobLaunchctl.actions.some(([command]) => command === "bootout"),
    false,
  );

  const serviceSymlinkFixture = writeStaleFixture({
    scope: "stale-service-parent-symlink-refused",
  });
  const serviceSymlinkTarget = `${serviceSymlinkFixture.layout.service_directory}-target`;
  renameSync(serviceSymlinkFixture.layout.service_directory, serviceSymlinkTarget);
  symlinkSync(serviceSymlinkTarget, serviceSymlinkFixture.layout.service_directory);
  await assertDecommissionRefused({
    fixture: serviceSymlinkFixture,
    launchctl: makeLaunchctl().launchctl,
  });
  assert.equal(existsSync(path.join(serviceSymlinkTarget, "service.json")), true);

  const runtimeSymlinkFixture = writeStaleFixture({
    scope: "stale-runtime-parent-symlink-refused",
  });
  const runtimeSymlinkTarget = `${runtimeSymlinkFixture.layout.runtime_directory}-target`;
  mkdirSync(runtimeSymlinkTarget, { recursive: true, mode: 0o700 });
  symlinkSync(runtimeSymlinkTarget, runtimeSymlinkFixture.layout.runtime_directory);
  await assertDecommissionRefused({
    fixture: runtimeSymlinkFixture,
    launchctl: makeLaunchctl().launchctl,
  });

  const launchParentSymlinkFixture = writeStaleFixture({
    scope: "stale-launch-parent-symlink-refused",
  });
  const launchParent = path.dirname(
    launchParentSymlinkFixture.layout.launch_agent_path,
  );
  const launchParentTarget = `${launchParent}-target`;
  renameSync(launchParent, launchParentTarget);
  symlinkSync(launchParentTarget, launchParent);
  await assertDecommissionRefused({
    fixture: launchParentSymlinkFixture,
    launchctl: makeLaunchctl().launchctl,
  });
  assert.equal(
    existsSync(path.join(
      launchParentTarget,
      path.basename(launchParentSymlinkFixture.layout.launch_agent_path),
    )),
    true,
  );

  const replaySteps = [
    "journal",
    "bootout",
    "configuration",
    "desired_state",
    "launch_agent",
    "manager_state",
    "manager_lock",
    "maintenance_lease",
    "runtime_manifest",
    "runtime_token",
    "runtime_access",
    "runtime_lock",
    "runtime_bridge_environment",
  ];
  for (const [index, step] of replaySteps.entries()) {
    const fixture = writeStaleFixture({
      scope: `stale-replay-${index}-${step.replaceAll("_", "-")}`,
    });
    const fixtureLaunchctl = makeLaunchctl();
    await assert.rejects(
      uninstallCompanionService({
        ...fixture.options,
        launchctl: fixtureLaunchctl.launchctl,
        testFaultAfterStep: step,
      }),
      (error) =>
        error?.code === "companion_service_stale_decommission_test_fault",
    );
    const interrupted = await inspectCompanionService({
      ...fixture.options,
      launchctl: fixtureLaunchctl.launchctl,
    });
    assert.equal(interrupted.status, "recovery_required");
    assert.equal(
      interrupted.reason,
      step === "bootout"
        ? "companion_service_checkout_identity_changed"
        : "companion_service_stale_decommission_incomplete",
    );
    const interruptedProjection = JSON.stringify(
      publicCompanionServiceProjection(interrupted),
    );
    for (const forbidden of [
      fixtureRepositoryRoot,
      fixtureRoot,
      fixture.configuration.node_path,
      fixture.configuration.manager_entry_path,
      "manager_pid",
      "process_identity",
    ]) assert.equal(interruptedProjection.includes(forbidden), false, forbidden);
    await assert.rejects(
      startCompanionService({
        ...fixture.options,
        launchctl: fixtureLaunchctl.launchctl,
        waitMs: 1,
      }),
      (error) => error?.code === "companion_service_recovery_refused",
    );
    const actionsBeforeInstallRefusal = fixtureLaunchctl.actions.length;
    await assert.rejects(
      installCompanionService({
        ...fixture.options,
        nodePath: node.path,
        launchctl: fixtureLaunchctl.launchctl,
        waitMs: 1,
      }),
      (error) => error?.code === (
        step === "bootout"
          ? "companion_service_installation_conflict"
          : "companion_service_stale_decommission_incomplete"
      ),
    );
    assert.equal(
      fixtureLaunchctl.actions
        .slice(actionsBeforeInstallRefusal)
        .some(([command]) => command === "bootstrap" || command === "kickstart"),
      false,
      step,
    );
    const replayed = await uninstallCompanionService({
      ...fixture.options,
      launchctl: fixtureLaunchctl.launchctl,
    });
    assert.equal(replayed.service.status, "not_installed", step);
  }

  const liveMutationReplayFixture = writeStaleFixture({
    scope: "stale-live-mutation-before-journal-replay",
  });
  writeExplicitStoppedManagerState(liveMutationReplayFixture);
  const liveMutationLaunchctl = makeLaunchctl(
    true,
    liveMutationReplayFixture.configuration,
  );
  await assert.rejects(
    uninstallCompanionService({
      ...liveMutationReplayFixture.options,
      launchctl: liveMutationLaunchctl.launchctl,
      testFaultAfterStep: "bootout",
    }),
    (error) =>
      error?.code === "companion_service_stale_decommission_test_fault",
  );
  assert.equal(
    existsSync(liveMutationReplayFixture.layout.stale_decommission_path),
    false,
  );
  writeExplicitStoppedManagerState(liveMutationReplayFixture);
  assert.equal(
    (await uninstallCompanionService({
      ...liveMutationReplayFixture.options,
      launchctl: liveMutationLaunchctl.launchctl,
    })).service.status,
    "not_installed",
  );

  const unlinkSwapFixture = writeStaleFixture({
    scope: "stale-unlink-swap-refused",
  });
  const unlinkSwapLaunchctl = makeLaunchctl();
  await assert.rejects(
    uninstallCompanionService({
      ...unlinkSwapFixture.options,
      launchctl: unlinkSwapLaunchctl.launchctl,
      testFaultAfterStep: "journal",
    }),
    (error) =>
      error?.code === "companion_service_stale_decommission_test_fault",
  );
  const originalConfigurationText = readFileSync(
    unlinkSwapFixture.layout.configuration_path,
    "utf8",
  );
  const displacedConfigurationPath = path.join(
    unlinkSwapFixture.layout.service_directory,
    "service-original.json",
  );
  let swapped = false;
  await assert.rejects(
    uninstallCompanionService({
      ...unlinkSwapFixture.options,
      launchctl: unlinkSwapLaunchctl.launchctl,
      testBeforeUnlink: ({ material_key: materialKey, file }) => {
        if (materialKey !== "configuration" || swapped) return;
        swapped = true;
        renameSync(file, displacedConfigurationPath);
        writeFileSync(file, "foreign replacement\n", { mode: 0o600 });
      },
    }),
    (error) =>
      error?.code === "companion_service_stale_checkout_decommission_refused",
  );
  assert.equal(swapped, true);
  assert.equal(
    readFileSync(unlinkSwapFixture.layout.configuration_path, "utf8"),
    "foreign replacement\n",
  );
  assert.equal(
    readFileSync(displacedConfigurationPath, "utf8"),
    originalConfigurationText,
  );

  const ancestorSwapFixture = writeStaleFixture({
    scope: "stale-ancestor-swap-contained",
  });
  const ancestorSwapLaunchctl = makeLaunchctl();
  await assert.rejects(
    uninstallCompanionService({
      ...ancestorSwapFixture.options,
      launchctl: ancestorSwapLaunchctl.launchctl,
      testFaultAfterStep: "journal",
    }),
    (error) =>
      error?.code === "companion_service_stale_decommission_test_fault",
  );
  const displacedServiceDirectory =
    `${ancestorSwapFixture.layout.service_directory}-displaced`;
  let ancestorSwapped = false;
  await assert.rejects(
    uninstallCompanionService({
      ...ancestorSwapFixture.options,
      launchctl: ancestorSwapLaunchctl.launchctl,
      testBeforeUnlink: ({ material_key: materialKey }) => {
        if (materialKey !== "configuration" || ancestorSwapped) return;
        ancestorSwapped = true;
        renameSync(
          ancestorSwapFixture.layout.service_directory,
          displacedServiceDirectory,
        );
        mkdirSync(ancestorSwapFixture.layout.service_directory, {
          recursive: true,
          mode: 0o700,
        });
        writeFileSync(
          ancestorSwapFixture.layout.configuration_path,
          "foreign ancestor replacement\n",
          { mode: 0o600 },
        );
      },
    }),
    (error) =>
      error?.code === "companion_service_stale_checkout_decommission_refused",
  );
  assert.equal(ancestorSwapped, true);
  assert.equal(
    readFileSync(ancestorSwapFixture.layout.configuration_path, "utf8"),
    "foreign ancestor replacement\n",
  );
  assert.equal(
    existsSync(path.join(displacedServiceDirectory, "service.json")),
    false,
  );

  const internalSwapFixture = writeStaleFixture({
    scope: "stale-helper-internal-swap-refused",
  });
  const internalSwapLaunchctl = makeLaunchctl();
  await assert.rejects(
    uninstallCompanionService({
      ...internalSwapFixture.options,
      launchctl: internalSwapLaunchctl.launchctl,
      testFaultAfterStep: "journal",
    }),
    (error) =>
      error?.code === "companion_service_stale_decommission_test_fault",
  );
  await assert.rejects(
    uninstallCompanionService({
      ...internalSwapFixture.options,
      launchctl: internalSwapLaunchctl.launchctl,
      testSwapInsideUnlinkMaterial: "configuration",
    }),
    (error) =>
      error?.code === "companion_service_stale_checkout_decommission_refused",
  );
  assert.equal(
    readFileSync(internalSwapFixture.layout.configuration_path, "utf8"),
    "foreign helper replacement\n",
  );
  assert.equal(
    readdirSync(internalSwapFixture.layout.service_directory).some((name) =>
      name.startsWith(".stale-decommission-quarantine-") &&
      name.endsWith(".expected")
    ),
    true,
  );

  const substitutedJournalFixture = writeStaleFixture({
    scope: "stale-substituted-journal-refused",
  });
  await assert.rejects(
    uninstallCompanionService({
      ...substitutedJournalFixture.options,
      launchctl: makeLaunchctl().launchctl,
      testFaultAfterStep: "journal",
    }),
    (error) =>
      error?.code === "companion_service_stale_decommission_test_fault",
  );
  const substitutedJournal = JSON.parse(readFileSync(
    substitutedJournalFixture.layout.stale_decommission_path,
    "utf8",
  ));
  writeJson(substitutedJournalFixture.layout.stale_decommission_path, {
    ...substitutedJournal,
    repository_fingerprint: "d".repeat(64),
  });
  const substitutedJournalObservation = await inspectCompanionService({
    ...substitutedJournalFixture.options,
    launchctl: makeLaunchctl().launchctl,
  });
  assert.equal(substitutedJournalObservation.status, "ambiguous");
  assert.equal(
    substitutedJournalObservation.reason,
    "companion_service_stale_decommission_record_conflict",
  );
  await assert.rejects(
    uninstallCompanionService({
      ...substitutedJournalFixture.options,
      launchctl: makeLaunchctl().launchctl,
    }),
    (error) => error?.code === "companion_service_uninstall_refused",
  );
  assert.equal(
    existsSync(substitutedJournalFixture.layout.configuration_path),
    true,
  );

  const malformedParentJournalFixture = writeStaleFixture({
    scope: "stale-malformed-parent-journal-refused",
  });
  await assert.rejects(
    uninstallCompanionService({
      ...malformedParentJournalFixture.options,
      launchctl: makeLaunchctl().launchctl,
      testFaultAfterStep: "journal",
    }),
    (error) =>
      error?.code === "companion_service_stale_decommission_test_fault",
  );
  const malformedParentJournal = JSON.parse(readFileSync(
    malformedParentJournalFixture.layout.stale_decommission_path,
    "utf8",
  ));
  writeJson(malformedParentJournalFixture.layout.stale_decommission_path, {
    ...malformedParentJournal,
    materials: {
      ...malformedParentJournal.materials,
      configuration: {
        ...malformedParentJournal.materials.configuration,
        parent: {
          ...malformedParentJournal.materials.configuration.parent,
          device: "01",
        },
      },
    },
  });
  const malformedParentObservation = await inspectCompanionService({
    ...malformedParentJournalFixture.options,
    launchctl: makeLaunchctl().launchctl,
  });
  assert.equal(malformedParentObservation.status, "ambiguous");
  assert.equal(
    malformedParentObservation.reason,
    "companion_service_stale_decommission_record_conflict",
  );

  return {
    exact_uninstall_unchanged: true,
    installed_stat_identity_shape_required: true,
    test_only_physical_identity_override_is_closed_and_non_persistent: true,
    malformed_installed_stat_identities_refused: true,
    inode_and_device_replacement_decommissioned: true,
    moved_root_refused: true,
    stale_start_stop_and_resume_authority_denied: true,
    foreign_identity_and_repository_refused: true,
    modified_plist_refused: true,
    missing_configuration_or_desired_state_refused: true,
    active_and_ambiguous_maintenance_refused: true,
    ambiguous_manager_and_runtime_refused: true,
    changed_process_birth_identity_refused: true,
    matching_birth_foreign_process_untouched: true,
    loaded_job_identity_bound_beyond_label: true,
    loaded_job_bootout_uses_authenticated_label_target: true,
    loaded_job_definition_fallback_uses_decommission_only_helper: true,
    service_runtime_and_launch_parent_symlinks_refused: true,
    interrupted_cleanup_replayable_at_every_step: true,
    incomplete_decommission_install_and_start_refused: true,
    pre_journal_live_mutation_remains_replayable: true,
    semantically_changed_live_snapshot_refused_after_three_attempts: true,
    immutable_material_change_refused_before_effect: true,
    launch_job_change_refused_before_effect: true,
    process_ownership_change_refused_before_effect: true,
    descriptor_relative_unlink_swap_refused: true,
    descriptor_relative_ancestor_swap_contained: true,
    helper_internal_swap_foreign_replacement_survives: true,
    substituted_decommission_journal_refused: true,
    malformed_journal_stat_identity_refused: true,
    unrelated_launch_agent_untouched: true,
    no_manager_or_runtime_spawned: true,
    exact_cleanup_and_replay: true,
    public_private_fields: 0,
    execution_semantic_provider_publication_authority: 0,
  };
}

function makeServiceRepositoryFixture({ root: fixtureRoot, name, sourceRepository }) {
  const repository = path.join(fixtureRoot, name);
  const sources = [
    "scripts/augnes-companion-service.mjs",
    "plugins/augnes-operator/mcp/companion-service-core.mjs",
  ];
  for (const relativePath of sources) {
    const destination = path.join(repository, relativePath);
    mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
    copyFileSync(path.join(sourceRepository, relativePath), destination);
  }
  return realpathSync(repository);
}

function serviceMaterialFingerprint(layout) {
  const material = [
    layout.configuration_path,
    layout.desired_state_path,
    layout.launch_agent_path,
  ].map((file) => readFileSync(file, "utf8"));
  return material.join("\0");
}

function writeExplicitStoppedManagerState(fixture) {
  const state = {
    contract: COMPANION_SERVICE_CONTRACT,
    schema_version: 1,
    service_identity: fixture.configuration.service_identity,
    repository_fingerprint: fixture.configuration.repository_fingerprint,
    status: "installed_stopped",
    reason: "companion_service_explicitly_stopped",
    manager_pid: 2_147_483_647,
    manager_process_identity: "b".repeat(64),
    supervisor_pid: null,
    supervisor_process_identity: null,
    runtime_ownership: null,
    restart_count: 0,
    restart_after: null,
    updated_at: new Date().toISOString(),
  };
  writeJson(fixture.layout.manager_state_path, state);
  return state;
}

function makeHistoricalLiveManagerState(fixture) {
  return {
    contract: COMPANION_SERVICE_CONTRACT,
    schema_version: 1,
    service_identity: fixture.configuration.service_identity,
    repository_fingerprint: fixture.configuration.repository_fingerprint,
    status: "live",
    reason: "companion_service_live",
    manager_pid: 2_147_483_645,
    manager_process_identity: "a".repeat(64),
    supervisor_pid: 2_147_483_644,
    supervisor_process_identity: "b".repeat(64),
    runtime_ownership: makeRuntimeOwnership(),
    restart_count: 0,
    restart_after: null,
    updated_at: new Date().toISOString(),
  };
}

function makeRuntimeOwnership({
  uiGroup = absentProcessGroup(2_147_483_643, "e"),
  bridgeGroup = absentProcessGroup(2_147_483_642, "f"),
} = {}) {
  return {
    generation_id: "contract-historical-generation",
    instance_id: "contract-historical-instance",
    process_groups: [
      { role: "ui", ...uiGroup },
      { role: "bridge", ...bridgeGroup },
    ],
  };
}

function absentProcessGroup(pid, identityCharacter) {
  const identity = identityCharacter.repeat(64);
  return {
    pid,
    identity,
    process_group: pid,
    members: [{ pid, identity }],
  };
}

function writeDesiredState(fixture, desiredState) {
  const record = {
    ...fixture.desiredState,
    desired_state: desiredState,
    updated_at: new Date().toISOString(),
  };
  writeJson(fixture.layout.desired_state_path, record);
}

function writeJson(file, value) {
  mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  writeFileSync(file, `${JSON.stringify(value)}\n`, { mode: 0o600 });
}

async function assertMaintenanceUpdateRequired({
  options: fixtureOptions,
  launchctl,
  operationId,
}) {
  await assert.rejects(
    acquireCompanionServiceMaintenance({
      ...fixtureOptions,
      launchctl,
      operationId,
    }),
    (error) => error?.code === "companion_service_update_required",
  );
}

async function assertMaintenanceNotRequired({
  options: fixtureOptions,
  launchctl,
  operationId,
}) {
  const result = await acquireCompanionServiceMaintenance({
    ...fixtureOptions,
    launchctl,
    operationId,
  });
  assert.equal(result.acquired, false);
  assert.equal(result.lease, null);
  assert.equal(result.reason, "companion_service_maintenance_not_required");
}

function currentProcessIdentity(pid = process.pid) {
  const result = spawnSync(
    "/bin/ps",
    ["-o", "lstart=", "-o", "command=", "-p", String(pid)],
    {
      encoding: "utf8",
      timeout: 1_500,
      env: { PATH: "/usr/bin:/bin" },
    },
  );
  assert.equal(result.status, 0);
  const birthMaterial = result.stdout.trim();
  assert.notEqual(birthMaterial, "");
  return createHash("sha256")
    .update(`${process.platform}:${pid}:${birthMaterial}`)
    .digest("hex");
}

function currentProcessGroupOwnership(pid) {
  const groupResult = spawnSync(
    "/bin/ps",
    ["-o", "pgid=", "-p", String(pid)],
    {
      encoding: "utf8",
      timeout: 1_500,
      env: { PATH: "/usr/bin:/bin" },
    },
  );
  assert.equal(groupResult.status, 0);
  assert.equal(Number(groupResult.stdout.trim()), pid);
  const membersResult = spawnSync("/bin/ps", ["-axo", "pid=,pgid="], {
    encoding: "utf8",
    timeout: 1_500,
    env: { PATH: "/usr/bin:/bin" },
  });
  assert.equal(membersResult.status, 0);
  const members = membersResult.stdout.split("\n").flatMap((line) => {
    const match = line.trim().match(/^(\d+)\s+(\d+)$/u);
    if (!match || Number(match[2]) !== pid) return [];
    const memberPid = Number(match[1]);
    return [{ pid: memberPid, identity: currentProcessIdentity(memberPid) }];
  });
  assert.equal(members.some((member) => member.pid === pid), true);
  return {
    pid,
    identity: currentProcessIdentity(pid),
    process_group: pid,
    members,
  };
}

async function writeVerifiedRuntimeFixture(fixture) {
  const generationId = "contract-generation";
  const instanceId = "contract-instance";
  const uiPort = 19_001;
  const bridgePort = 19_002;
  const uiOwnershipPort = 19_003;
  const bridgeOwnershipPort = 19_004;
  const runtime = {
    contract: "augnes-local-runtime-supervisor-v1",
    schema_version: 2,
    generation_version: 1,
    generation_id: generationId,
    instance_id: instanceId,
    repository_fingerprint: fixture.configuration.repository_fingerprint,
    supervisor_pid: process.pid,
    lifecycle_state: "ready",
    database_state: "ready",
    effective_url: `http://127.0.0.1:${uiPort}`,
    ui_port: uiPort,
    bridge_port: bridgePort,
    children: [
      {
        role: "ui",
        state: "ready",
        port: uiPort,
        ownership_port: uiOwnershipPort,
        pid: process.pid,
      },
      {
        role: "bridge",
        state: "ready",
        port: bridgePort,
        ownership_port: bridgeOwnershipPort,
        pid: process.pid,
      },
    ],
  };
  const generation = {
    contract: runtime.contract,
    schema_version: runtime.schema_version,
    generation_version: runtime.generation_version,
    generation_id: generationId,
    instance_id: instanceId,
    repository_fingerprint: runtime.repository_fingerprint,
  };
  writeJson(fixture.layout.runtime_manifest_path, runtime);
  writeJson(fixture.layout.runtime_token_path, {
    ...generation,
    token: "t".repeat(32),
    child_ownership_token: "o".repeat(32),
  });
  writeJson(fixture.layout.runtime_access_path, {
    ...generation,
    access_version: "augnes-companion-proxy-access.v0.1",
    proxy_token: "p".repeat(32),
  });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    let value;
    if (url.pathname === "/api/healthz") {
      value = {
        ok: true,
        service: "augnes-ui",
        status: "ready",
        recovery_mode: false,
        runtime_instance_id: instanceId,
        runtime_generation_id: generationId,
        runtime_repository_fingerprint: runtime.repository_fingerprint,
      };
    } else if (url.pathname === "/healthz") {
      value = {
        ok: true,
        name: "augnes-console",
        mode: "http",
        live_core_status: "ready",
        runtime_instance_id: instanceId,
        runtime_generation_id: generationId,
        runtime_repository_fingerprint: runtime.repository_fingerprint,
      };
    } else {
      const child = Number(url.port) === uiOwnershipPort
        ? runtime.children[0]
        : runtime.children[1];
      value = runtimeChildOwnership(child, fixture, {
        generationId,
        instanceId,
      });
    }
    return new Response(JSON.stringify(value), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  return {
    close: async () => {
      for (const file of [
        fixture.layout.runtime_manifest_path,
        fixture.layout.runtime_token_path,
        fixture.layout.runtime_access_path,
      ]) rmSync(file, { force: true });
      globalThis.fetch = originalFetch;
    },
  };
}

function runtimeChildOwnership(child, fixture, { generationId, instanceId }) {
  return {
    ownership_verified: true,
    contract: "augnes-local-runtime-supervisor-v1",
    schema_version: 2,
    generation_version: 1,
    generation_id: generationId,
    repository_fingerprint: fixture.configuration.repository_fingerprint,
    instance_id: instanceId,
    role: child.role,
    child_root_pid: child.pid,
    process_pid: child.pid,
    loopback_port: child.port,
  };
}

function tailFingerprint(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function differentCanonicalStatIdentity(value) {
  assert.match(value, /^(?:0|[1-9][0-9]*)$/u);
  const changed = String(BigInt(value) + 1n);
  assert.match(changed, /^[1-9][0-9]*$/u);
  assert.equal(String(BigInt(changed)), changed);
  assert.notEqual(changed, value);
  return changed;
}
