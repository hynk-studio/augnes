#!/usr/bin/env node

import assert from "node:assert/strict";
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
