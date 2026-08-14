#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  COMPANION_SERVICE_CONTRACT,
  COMPANION_SERVICE_PUBLIC_STATES,
  acquireCompanionServiceMaintenance,
  buildLaunchAgentPlist,
  installCompanionService,
  inspectCompanionService,
  lifecycleAuthority,
  publicCompanionServiceProjection,
  resolveCompanionServiceLayout,
  selectSupportedNode24Binary,
  startCompanionService,
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
    deterministic_checkout_label: true,
    node24_exact_binary_binding: true,
    install_failure_exact_rollback: true,
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
