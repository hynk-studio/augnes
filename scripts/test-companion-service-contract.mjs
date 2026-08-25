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
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  COMPANION_SERVICE_CONTRACT,
  COMPANION_SERVICE_DESIRED_STATE_CONTRACT,
  COMPANION_SERVICE_DESIRED_STATE_SCHEMA_VERSION,
  COMPANION_SERVICE_PUBLIC_STATES,
  acquireCompanionServiceMaintenance,
  buildLaunchAgentPlist,
  computeServiceSourceFingerprint,
  installCompanionService,
  inspectCompanionService,
  lifecycleAuthority,
  publicCompanionServiceProjection,
  resolveCompanionServiceLayout,
  selectSupportedNode24Binary,
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
    production_singleton_foreign_install_and_start_refused: true,
    production_singleton_zero_foreign_mutation: true,
    test_scoped_service_singleton_exempt: true,
    existing_launch_agent_directory_mode_preserved: true,
    public_projection_private_fields: 0,
    arbitrary_command_or_label_inputs: 0,
    manager_node_module_imports: 0,
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
