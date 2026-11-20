#!/usr/bin/env node
import assert from "node:assert/strict";
import childProcess, { spawn, spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import os from "node:os";
import path from "node:path";
import { mock } from "node:test";
import { pathToFileURL } from "node:url";
import * as core from "../plugins/augnes-operator/mcp/companion-service-core.mjs";
import { checkoutObservationBinding } from "../plugins/augnes-operator/mcp/checkout-identity.mjs";
import {
  cleanupOwnedProcesses,
  registerOwnedChild,
  terminateOwnedProcessTree,
  waitForOwnedProcessExit,
} from "./test-harness-process-lifecycle.mjs";
import {
  fixtureProcessIdentity,
  runCompanionFixtureScenario,
} from "./companion-service-fixture-observation.mjs";

// The imported recovery source acts on a separately bound, disposable installed
// source. launchctl is only an exact-definition observer and bootout counter;
// neither this fixture nor its applier subprocess enters real launchd.
const sourceRoot = fs.realpathSync(path.join(import.meta.dirname, ".."));
const sources = [
  "scripts/augnes-companion-service.mjs",
  "plugins/augnes-operator/mcp/companion-service-core.mjs",
  "plugins/augnes-operator/mcp/checkout-identity.mjs",
  "plugins/augnes-operator/mcp/checkout-identity-darwin.py",
  "plugins/augnes-operator/mcp/node-runtime-policy.mjs",
];
const runtimeKeys = [
  "runtime_manifest_path", "runtime_lock_path", "runtime_token_path",
  "runtime_access_path", "runtime_bridge_environment_path",
];
const digest = value => createHash("sha256").update(value).digest("hex");
const json = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  fs.writeFileSync(file, JSON.stringify(value) + "\n", { mode: 0o600 });
};
const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
const birth = pid => {
  const value = fixtureProcessIdentity(pid);
  return value === null ? null : digest(`${process.platform}:${pid}:${value}`);
};
const recoveryRefusal = error => /^companion_service_recovery_/u.test(error?.code ?? error?.message ?? "");
const lifecycleRefusal = error => recoveryRefusal(error) || /^companion_service_lifecycle_(busy|lock_ambiguous)$/u.test(error?.code ?? "");
const idleSource = "process.send({ready:true}); setInterval(()=>{},1000);\n";

let installedReaderPath = null, only = null;
for (let index = 2; index < process.argv.length; index++) {
  const flag = process.argv[index], value = process.argv[++index];
  assert(value && ["--installed-reader", "--scenario"].includes(flag), "unsupported fixture argument");
  if (flag === "--installed-reader") {
    assert(path.isAbsolute(value), "installed reader must be an absolute file path");
    installedReaderPath = value;
  } else only = value;
}
const installedReader = installedReaderPath ? await import(pathToFileURL(installedReaderPath).href) : core;

async function message(record, label) {
  let timer, receive;
  const ready = new Promise(resolve => {
    receive = value => resolve(value);
    record.child.once("message", receive);
  });
  try {
    return await Promise.race([
      ready,
      record.closePromise.then(() => { throw new Error(`fixture child exited before ${label}`); }),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`fixture child did not reach ${label}`)), 5_000); }),
    ]);
  } finally {
    clearTimeout(timer);
    record.child.off("message", receive);
  }
}

function material(file) {
  const parent = fs.statSync(path.dirname(file), { bigint: true });
  return { state: "valid", sha256: digest(fs.readFileSync(file)),
    parent: { device: String(parent.dev), inode: String(parent.ino) } };
}

async function fixture() {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ag-stale-manager-")));
  const repositoryRoot = path.join(root, "source"), home = path.join(root, "home");
  const owned = new Set();
  let layout = null, protectedBytes = [], loaded = true, bootouts = 0;
  let jobPid = null, jobProgram = null;
  const cleanup = async () => {
    await cleanupOwnedProcesses(owned);
    assert.equal(owned.size, 0);
    for (const [file, bytes] of protectedBytes) assert.deepEqual(fs.readFileSync(file), bytes, `preserved ${path.basename(file)}`);
    if (layout) assert(!fs.existsSync(layout.lifecycle_lock_path), "no fixture lifecycle lock survives");
    fs.rmSync(root, { recursive: true });
    assert(!fs.existsSync(root));
  };
  try {
    for (const relative of sources) {
      const output = path.join(repositoryRoot, relative);
      fs.mkdirSync(path.dirname(output), { recursive: true, mode: 0o700 });
      fs.copyFileSync(path.join(sourceRoot, relative), output);
    }
    fs.appendFileSync(path.join(repositoryRoot, sources[0]), "\n// Independently bound disposable installed source.\n");
    fs.writeFileSync(path.join(root, "idle.mjs"), idleSource, { mode: 0o600 });
    const environment = { HOME: home, PATH: path.dirname(process.execPath),
      AUGNES_COMPANION_SERVICE_TEST_MODE: "1", AUGNES_COMPANION_SERVICE_TEST_ROOT: root,
      AUGNES_COMPANION_SERVICE_TEST_SCOPE: "stale-manager-recovery" };
    const options = { repositoryRoot, homeDirectory: home, environment, testScope: "stale-manager-recovery", waitMs: 0 };
    layout = core.resolveCompanionServiceLayout(options);
    assert.equal(layout.stale_manager_recovery_path, path.join(layout.service_directory, "stale-manager-recovery.json"));
    const configuration = { contract: core.COMPANION_SERVICE_CONTRACT, schema_version: 2, manager_version: 1,
      service_label: layout.service_label, service_identity: layout.service_identity,
      repository_root: repositoryRoot, repository_fingerprint: layout.repository.repository_fingerprint,
      repository_device: layout.repository.device, repository_inode: layout.repository.inode,
      repository_identity: layout.repository.durable_identity,
      node_path: process.execPath, node_version: process.version, manager_entry_path: path.join(repositoryRoot, sources[0]),
      service_source_fingerprint: core.computeServiceSourceFingerprint(repositoryRoot),
      runtime_state_directory: layout.runtime_directory, runtime_home_directory: home,
      database_path: path.join(root, "data/augnes.db"), configuration_path: layout.configuration_path,
      launch_agent_path: layout.launch_agent_path, installed_at: new Date().toISOString(),
      test_scope: "stale-manager-recovery", test_root: root };
    const desired = { contract: core.COMPANION_SERVICE_DESIRED_STATE_CONTRACT, schema_version: 1,
      service_identity: configuration.service_identity, repository_fingerprint: configuration.repository_fingerprint,
      desired_state: "running", updated_at: new Date().toISOString() };
    json(layout.configuration_path, configuration);
    json(layout.desired_state_path, desired);
    fs.mkdirSync(path.dirname(layout.launch_agent_path), { recursive: true, mode: 0o700 });
    fs.writeFileSync(layout.launch_agent_path, core.buildLaunchAgentPlist(configuration), { mode: 0o600 });
    fs.mkdirSync(path.dirname(configuration.database_path), { mode: 0o700 });
    fs.writeFileSync(configuration.database_path, "disposable database bytes; never opened\n", { mode: 0o600 });
    const idle = async role => {
      const child = spawn(process.execPath, [path.join(root, "idle.mjs")], {
        cwd: root, env: environment, detached: true, stdio: ["ignore", "pipe", "pipe", "ipc"],
      });
      const record = registerOwnedChild(owned, child, { label: `stale-manager-${role}` });
      assert.equal((await message(record, `${role}-ready`)).ready, true);
      const identity = birth(child.pid);
      assert(identity, "fixture process must have a real birth witness");
      return { pid: child.pid, identity, record };
    };
    const unrelated = await idle("unrelated");
    const liveWitness = await idle("live-witness");
    const dead = {};
    for (const role of ["supervisor", "ui", "bridge"]) {
      const value = await idle(role);
      await terminateOwnedProcessTree(value.record);
      assert.equal(birth(value.pid), null, `${role} really exited`);
      dead[role] = { pid: value.pid, identity: value.identity };
    }
    const historicalBirth = digest(`historical manager before PID reuse:${unrelated.pid}`);
    assert.notEqual(historicalBirth, unrelated.identity);
    const groups = ["ui", "bridge"].map(role => ({ role, ...dead[role], process_group: dead[role].pid,
      members: [{ ...dead[role] }] }));
    const manager = { contract: core.COMPANION_SERVICE_CONTRACT, schema_version: 1,
      service_identity: configuration.service_identity, repository_fingerprint: configuration.repository_fingerprint,
      status: "live", reason: "companion_service_live", manager_pid: unrelated.pid, manager_process_identity: historicalBirth,
      supervisor_pid: dead.supervisor.pid, supervisor_process_identity: dead.supervisor.identity,
      runtime_ownership: { generation_id: randomUUID(), instance_id: randomUUID(), process_groups: groups },
      restart_count: 0, restart_after: null, updated_at: new Date().toISOString() };
    const managerLock = { contract: core.COMPANION_SERVICE_CONTRACT, schema_version: 1,
      service_identity: configuration.service_identity, repository_fingerprint: configuration.repository_fingerprint,
      manager_id: randomUUID(), owner_pid: unrelated.pid, owner_process_identity: historicalBirth,
      acquired_at: manager.updated_at };
    json(layout.manager_state_path, manager);
    json(layout.manager_lock_path, managerLock);

    // A valid original settled history, from a different recovery source, is
    // already present. The new operation must preserve its exact file bytes.
    const evidence = { repository_binding: checkoutObservationBinding(layout.repository),
      recovery_source: digest("original settled fixture recovery source"),
      installed_source: digest("original settled fixture installed source"),
      material: Object.fromEntries(["configuration_path", "launch_agent_path", "desired_state_path"].map(key => [key, material(layout[key])])),
      desired: structuredClone(desired), manager: { ...manager, manager_pid: dead.supervisor.pid,
        manager_process_identity: dead.supervisor.identity }, manager_lock: { ...managerLock,
        owner_pid: dead.supervisor.pid, owner_process_identity: dead.supervisor.identity },
      supervisor: { ...dead.supervisor, parent_pid: dead.supervisor.pid,
        command_fingerprint: digest("historical disposable supervisor") },
      generation_id: randomUUID(), instance_id: randomUUID(), groups,
      runtime_material: Object.fromEntries(runtimeKeys.map(key => [key, { state: "missing", parent: null }])) };
    const historical = { contract: "augnes.companion-ownership-retirement.v1",
      service_identity: configuration.service_identity, status: "settled", evidence,
      operation_binding: digest(JSON.stringify(evidence)), decision_binding: digest("original settled decision"),
      stopped_desired: { ...desired, desired_state: "stopped" } };
    json(layout.ownership_recovery_path, historical);
    const launchctl = args => {
      assert.equal(args[1], `gui/${process.getuid()}/${configuration.service_label}`);
      if (args[0] === "print") return loaded ? { status: 0,
        stdout: `${args[1]} = {\n path = ${layout.launch_agent_path}\n program = ${jobProgram ?? configuration.node_path}\n working directory = ${repositoryRoot}\n${jobPid === null ? "" : ` pid = ${jobPid}\n`} arguments = {\n ${configuration.node_path}\n ${configuration.manager_entry_path}\n run\n --config\n ${layout.configuration_path}\n }\n}\n` } : { status: 113, stdout: "" };
      assert.deepEqual(args, ["bootout", `gui/${process.getuid()}/${configuration.service_label}`]);
      assert.equal(jobPid, null, "only the exact definition without an active PID may be booted out");
      bootouts++;
      loaded = false;
      return { status: 0 };
    };
    protectedBytes = [layout.configuration_path, layout.launch_agent_path, configuration.database_path,
      layout.ownership_recovery_path, ...sources.map(relative => path.join(repositoryRoot, relative))]
      .map(file => [file, fs.readFileSync(file)]);
    return { root, repositoryRoot, layout, configuration, desired, manager, managerLock, historical, dead, unrelated, liveWitness,
      owned, environment, options: { ...options, launchctl }, idle, cleanup, effects: () => bootouts,
      setJobPid: value => { jobPid = value; }, setJobProgram: value => { jobProgram = value; } };
  } catch (error) {
    try { await cleanup(); }
    catch (cleanupError) { throw new AggregateError([error, cleanupError], "stale-manager fixture setup and cleanup failed"); }
    throw error;
  }
}

async function guarded(action) {
  const originalKill = process.kill, originalRun = childProcess.spawnSync;
  const patches = [
    mock.method(process, "kill", (pid, signal = "SIGTERM") => {
      assert.equal(signal, 0, "recovery may observe processes but must never signal one");
      return originalKill(pid, signal);
    }),
    mock.method(childProcess, "spawn", () => { throw new Error("recovery_must_not_start_a_process"); }),
    mock.method(childProcess, "spawnSync", (command, args, options) => {
      assert.notEqual(command, "/bin/launchctl", "real launchctl is forbidden in disposable fixtures");
      return originalRun(command, args, options);
    }),
  ];
  syncBuiltinESMExports();
  try { return await action(); }
  finally { for (const patch of patches.reverse()) patch.mock.restore(); syncBuiltinESMExports(); }
}

const scenarios = [];
const run = (name, action) => scenarios.push([name, action]);
const apply = (f, decision, extra = {}) => core.applyCompanionStaleManagerRecovery({ ...f.options, decision, ...extra });
async function assertStopped(f) {
  const status = await core.inspectCompanionService(f.options);
  assert.equal(status.status, "installed_stopped");
  assert.equal(status.checkout_relation, "exact");
  assert.equal(read(f.layout.desired_state_path).desired_state, "stopped");
  const manager = read(f.layout.manager_state_path);
  assert.equal(manager.status, "installed_stopped");
  assert.equal(manager.supervisor_pid, null);
  assert.equal(manager.supervisor_process_identity, null);
  assert.equal(manager.runtime_ownership, null);
  assert(!fs.existsSync(f.layout.manager_lock_path));
  for (const key of runtimeKeys) assert(!fs.existsSync(f.layout[key]));
  assert.equal(birth(f.unrelated.pid), f.unrelated.identity, "the reused, unrelated PID survives unchanged");
  assert.equal(birth(f.liveWitness.pid), f.liveWitness.identity, "unrelated live witnesses survive unchanged");
}

function productionLayout(f, suffix) {
  const home = path.join(f.root, suffix);
  fs.mkdirSync(home, { mode: 0o700 });
  const calls = [];
  const options = { repositoryRoot: f.repositoryRoot, homeDirectory: home,
    environment: { HOME: home, PATH: path.dirname(process.execPath) }, nodePath: process.execPath, waitMs: 0,
    launchctl: args => {
      assert.deepEqual(args, ["print", `gui/${process.getuid()}/${layout.service_label}`],
        "a disposable stopped installation may only observe launchd");
      calls.push([...args]);
      return { status: 113, stdout: "" };
    } };
  const layout = core.resolveCompanionServiceLayout(options);
  assert.equal(layout.test, null);
  assert.equal(layout.home, home);
  return { options, layout, calls };
}

run("fresh-production-layout-stopped-install", async f => {
  const { options, layout, calls } = productionLayout(f, "fresh-production-home");
  const checkouts = path.join(layout.home, "Library", "Application Support", "Augnes", "v1", "checkouts");
  assert(!fs.existsSync(checkouts), "production-shaped intermediate directories begin absent");
  assert(!fs.existsSync(path.dirname(layout.service_directory)));
  assert.equal((await core.inspectCompanionService(options)).status, "not_installed");
  assert(!fs.existsSync(checkouts), "inspection must not manufacture missing installation parents");
  const installed = await core.installCompanionService({ ...options, start: false });
  assert.equal(installed.service.status, "installed_stopped");
  assert.equal(installed.service.checkout_relation, "exact");
  const observed = await core.inspectCompanionService(options);
  assert.equal(observed.status, "installed_stopped");
  assert.equal(observed.checkout_relation, "exact");
  assert(calls.length > 0, "the private launch observer was used");
  assert.equal(read(layout.desired_state_path).desired_state, "stopped");
  assert.equal(read(layout.configuration_path).database_path, null);
  assert(!fs.existsSync(layout.lifecycle_lock_path));
  assert(!fs.existsSync(layout.manager_state_path));
  assert(!fs.existsSync(layout.stale_manager_recovery_path));
  assert(!fs.existsSync(layout.runtime_directory), "stopped installation creates no runtime resources");
  assert.equal(f.effects(), 0);
});

run("present-invalid-production-sidecar-refused", async f => {
  const { options, layout, calls } = productionLayout(f, "invalid-production-home");
  const malformedRecord = { contract: "augnes-companion-stale-manager-recovery.v0.1",
    service_identity: layout.service_identity, status: "retiring", evidence: {},
    created_at: new Date().toISOString(), target: {}, operation_binding: "0".repeat(64), lifecycle_owners: [] };
  for (const kind of ["malformed-json", "malformed-record", "unreadable"]) {
    const bytes = kind === "malformed-json" ? "{invalid JSON\n" : JSON.stringify(malformedRecord) + "\n";
    fs.mkdirSync(layout.service_directory, { recursive: true, mode: 0o700 });
    fs.writeFileSync(layout.stale_manager_recovery_path, bytes, { mode: 0o600 });
    try {
      if (kind === "unreadable") {
        fs.chmodSync(layout.stale_manager_recovery_path, 0o000);
        assert.throws(() => fs.readFileSync(layout.stale_manager_recovery_path), { code: "EACCES" },
          "the real private sidecar must be unreadable, not an absence simulation");
      }
      const observed = await core.inspectCompanionService(options);
      assert.equal(observed.status, "recovery_required", kind);
      assert.equal(observed.start_available, false, kind);
      const refusal = kind === "unreadable" ? /companion_service_stale_checkout_decommission_refused/u
        : /companion_service_recovery_stale_manager_record_invalid/u;
      assert.match(observed.reason, refusal, kind);
      await assert.rejects(core.installCompanionService({ ...options, start: false }), refusal);
      for (const key of ["configuration_path", "desired_state_path", "launch_agent_path", "lifecycle_lock_path"])
        assert(!fs.existsSync(layout[key]), `${kind} must not admit installation`);
      assert.equal(calls.length, 0, "invalid present sidecars refuse before any launch observer/effect");
    } finally {
      fs.chmodSync(layout.stale_manager_recovery_path, 0o600);
      assert.equal(fs.readFileSync(layout.stale_manager_recovery_path, "utf8"), bytes);
      fs.unlinkSync(layout.stale_manager_recovery_path);
    }
  }
  assert.equal(f.effects(), 0);
});

run("reused-manager-stopped-history-and-replay", async f => {
  const originalBytes = fs.readFileSync(f.layout.ownership_recovery_path);
  const before = await core.inspectCompanionService(f.options);
  assert.equal(before.status, "recovery_required");
  // Enter the unchanged manager only far enough to exercise its existing
  // ownership refusal. The Start API itself would ask launchd to kickstart.
  await assert.rejects(core.runCompanionServiceManager({ configurationPath: f.layout.configuration_path,
    launchEnvironment: f.environment }), /process_ownership_unverifiable/u);
  assert.equal(f.effects(), 0);
  const inspect = await core.inspectCompanionStaleManagerRecovery(f.options);
  assert.equal(inspect.result, "retirement_available");
  assert.notEqual(inspect.installed_source, inspect.recovery_source);
  assert.notEqual(f.historical.evidence.installed_source, inspect.installed_source);
  assert.notEqual(f.historical.evidence.recovery_source, inspect.recovery_source);
  const preparedAt = Date.now(), preview = await core.prepareCompanionStaleManagerRecovery(f.options);
  const expiry = Date.parse(preview.decision.expires_at);
  assert(expiry >= preparedAt + 299_000 && expiry <= Date.now() + 300_000, "decision has a bounded five-minute lifetime");
  const result = await apply(f, preview.decision);
  assert.equal(result.result, "settled");
  assert.equal(result.remaining_owned_processes, 0);
  assert.equal(f.effects(), 1);
  await assertStopped(f);
  assert.deepEqual(fs.readFileSync(f.layout.ownership_recovery_path), originalBytes);
  const sidecar = read(f.layout.stale_manager_recovery_path);
  assert.equal(sidecar.status, "settled");
  assert(JSON.stringify(sidecar).includes(f.manager.manager_process_identity), "sidecar preserves the old manager witness");
  assert.equal((await apply(f, preview.decision)).result, "settled");
  assert.equal(f.effects(), 1, "settled replay has no new effect");
  const preserved = await installedReader.inspectCompanionPreservation(f.options);
  assert.equal(preserved.state.status, "installed_stopped");
  assert.equal(preserved.state.checkout_relation, "exact");
  assert.equal(preserved.state.preservation_valid, true);
  assert.equal(preserved.diagnostics.coherent, true);
  assert.deepEqual(fs.readFileSync(f.layout.ownership_recovery_path), originalBytes);
});

run("confirmed-missing-manager", async f => {
  json(f.layout.manager_state_path, { ...f.manager, manager_pid: f.dead.supervisor.pid,
    manager_process_identity: f.dead.supervisor.identity });
  json(f.layout.manager_lock_path, { ...f.managerLock, owner_pid: f.dead.supervisor.pid,
    owner_process_identity: f.dead.supervisor.identity });
  const preview = await core.prepareCompanionStaleManagerRecovery(f.options);
  assert.equal((await apply(f, preview.decision)).result, "settled");
  await assertStopped(f);
});

for (const role of ["manager", "supervisor", "member"]) run(`live-${role}-refused`, async f => {
  const state = structuredClone(f.manager);
  if (role === "manager") {
    state.manager_process_identity = f.unrelated.identity;
    json(f.layout.manager_lock_path, { ...f.managerLock, owner_process_identity: f.unrelated.identity });
  } else if (role === "supervisor") {
    state.supervisor_pid = f.liveWitness.pid;
    state.supervisor_process_identity = f.liveWitness.identity;
  } else state.runtime_ownership.process_groups[0].members.push({ pid: f.liveWitness.pid, identity: f.liveWitness.identity });
  json(f.layout.manager_state_path, state);
  await assert.rejects(core.prepareCompanionStaleManagerRecovery(f.options), /companion_service_recovery_process_still_live/u);
  assert.equal(f.effects(), 0);
  assert(!fs.existsSync(f.layout.stale_manager_recovery_path));
  assert.equal(birth(f.unrelated.pid), f.unrelated.identity);
  assert.equal(birth(f.liveWitness.pid), f.liveWitness.identity);
});

for (const mode of ["unavailable", "changing"]) run(`${mode}-process-observation-refused`, async f => {
  const original = childProcess.spawnSync;
  let samples = 0;
  const patch = mock.method(childProcess, "spawnSync", (command, args, options) => {
    const result = original(command, args, options);
    if (command !== "/bin/ps" || args[1] !== "lstart=" || args.at(-1) !== String(f.unrelated.pid)) return result;
    if (mode === "unavailable") return { status: 1, stdout: "" };
    samples++;
    return { ...result, stdout: result.stdout + (samples > 1 ? " changed birth observation" : "") };
  });
  syncBuiltinESMExports();
  try { await assert.rejects(core.prepareCompanionStaleManagerRecovery(f.options), mode === "unavailable"
    ? /companion_service_recovery_process_witness_unavailable/u : /companion_service_recovery_observation_changed/u); }
  finally { patch.mock.restore(); syncBuiltinESMExports(); }
  assert.equal(f.effects(), 0);
  assert(!fs.existsSync(f.layout.stale_manager_recovery_path));
});

run("changed-process-witness-after-preparation-refused", async f => {
  const preview = await core.prepareCompanionStaleManagerRecovery(f.options);
  const original = childProcess.spawnSync;
  let changed = false;
  const patch = mock.method(childProcess, "spawnSync", (command, args, options) => {
    const result = original(command, args, options);
    return changed && command === "/bin/ps" && args[1] === "lstart=" && args.at(-1) === String(f.unrelated.pid)
      ? { ...result, stdout: result.stdout + " changed since preparation" } : result;
  });
  syncBuiltinESMExports();
  try {
    await assert.rejects(apply(f, preview.decision, { testStaleManagerRecoveryStageHook: stage => {
      if (stage === "before_effect") changed = true;
    } }), /companion_service_recovery_decision_stale/u);
    assert.equal(changed, true, "the process observation actually changed at the effect boundary");
  } finally { patch.mock.restore(); syncBuiltinESMExports(); }
  assert.equal(f.effects(), 0);
  assert(!fs.existsSync(f.layout.stale_manager_recovery_path));
});

run("unrecorded-retained-group-member-refused", async f => {
  const original = childProcess.spawnSync;
  const patch = mock.method(childProcess, "spawnSync", (command, args, options) => {
    const result = original(command, args, options);
    if (command !== "/bin/ps" || args[0] !== "-axo" || args[1] !== "pid=,pgid=") return result;
    // The real unrelated child supplies a live birth witness, but was not
    // recorded as a retained member. Simulate only its group membership.
    return { ...result, stdout: result.stdout + `\n${f.unrelated.pid} ${f.dead.supervisor.pid}\n` };
  });
  syncBuiltinESMExports();
  try { await assert.rejects(core.prepareCompanionStaleManagerRecovery(f.options), /companion_service_recovery_process_group_present/u); }
  finally { patch.mock.restore(); syncBuiltinESMExports(); }
  assert.equal(f.effects(), 0);
  assert(!fs.existsSync(f.layout.stale_manager_recovery_path));
  assert.equal(birth(f.unrelated.pid), f.unrelated.identity);
});

run("active-launch-pid-refused", async f => {
  f.setJobPid(f.unrelated.pid);
  await assert.rejects(core.prepareCompanionStaleManagerRecovery(f.options), /companion_service_recovery_loaded_manager_present/u);
  f.setJobPid(null);
  assert.equal(f.effects(), 0);
});

for (const key of runtimeKeys) run(`present-${key}-refused`, async f => {
  json(f.layout[key], { unrelated: true });
  await assert.rejects(core.prepareCompanionStaleManagerRecovery(f.options), /companion_service_recovery_runtime_material_present/u);
  assert.equal(f.effects(), 0);
  fs.unlinkSync(f.layout[key]);
});

const mutations = {
  configuration: f => json(f.layout.configuration_path, { ...f.configuration, installed_at: new Date(0).toISOString() }),
  source: f => fs.appendFileSync(path.join(f.repositoryRoot, sources[0]), "\n// Changed after explicit preparation.\n"),
  launch: f => f.setJobProgram("/unrelated-program"),
  manager: f => json(f.layout.manager_state_path, { ...f.manager, restart_count: 1 }),
  "manager-lock": f => json(f.layout.manager_lock_path, { ...f.managerLock, manager_id: "replacement" }),
  "historical-record": f => json(f.layout.ownership_recovery_path, { ...f.historical, decision_binding: digest("changed history") }),
  "runtime-material": f => json(f.layout.runtime_token_path, { foreign: true }),
};
for (const [name, mutate] of Object.entries(mutations)) run(`changed-${name}-at-effect-refused`, async f => {
  const files = [f.layout.configuration_path, f.layout.manager_state_path, f.layout.manager_lock_path,
    f.layout.ownership_recovery_path, path.join(f.repositoryRoot, sources[0])].map(file => [file, fs.readFileSync(file)]);
  const preview = await core.prepareCompanionStaleManagerRecovery(f.options);
  let mutated = false;
  try {
    await assert.rejects(apply(f, preview.decision, { testStaleManagerRecoveryStageHook: stage => {
      if (stage === "before_effect") { mutate(f); mutated = true; }
    } }), error => recoveryRefusal(error) || /companion_service_stale_checkout_decommission_refused/u.test(error?.code ?? ""));
    assert.equal(mutated, true, "the selected material mutation actually fired");
    assert.equal(f.effects(), 0);
    assert(!fs.existsSync(f.layout.stale_manager_recovery_path));
  } finally {
    for (const [file, bytes] of files) fs.writeFileSync(file, bytes);
    f.setJobProgram(null);
    if (fs.existsSync(f.layout.runtime_token_path)) fs.unlinkSync(f.layout.runtime_token_path);
  }
});

run("stale-decision-refused", async f => {
  const preview = await core.prepareCompanionStaleManagerRecovery(f.options);
  for (const decision of [
    { ...preview.decision, expires_at: new Date(0).toISOString() },
    { ...preview.decision, expires_at: new Date(Date.now() + 600_000).toISOString() },
    { ...preview.decision, expected_binding: "0".repeat(64) },
  ]) await assert.rejects(apply(f, decision), /companion_service_recovery_decision_stale/u);
  assert.equal(f.effects(), 0);
  assert(!fs.existsSync(f.layout.stale_manager_recovery_path));
});

run("active-maintenance-refused", async f => {
  const now = Date.now();
  const lease = { contract: core.COMPANION_SERVICE_CONTRACT, schema_version: 1,
    service_identity: f.configuration.service_identity, repository_fingerprint: f.configuration.repository_fingerprint,
    operation_id: randomUUID(), owner_pid: f.unrelated.pid, owner_process_identity: f.unrelated.identity,
    pre_maintenance_desired_state: "running", acquired_at: new Date(now).toISOString(), expires_at: new Date(now + 60_000).toISOString() };
  json(f.layout.maintenance_lease_path, lease);
  const bytes = fs.readFileSync(f.layout.maintenance_lease_path);
  try {
    await assert.rejects(core.prepareCompanionStaleManagerRecovery(f.options), recoveryRefusal);
    assert.deepEqual(fs.readFileSync(f.layout.maintenance_lease_path), bytes);
    assert.equal(f.effects(), 0);
  } finally { fs.unlinkSync(f.layout.maintenance_lease_path); }
});

for (const owner of ["active", "unrelated-dead", "reused"]) run(`${owner}-lifecycle-lock-refused`, async f => {
  const preview = await core.prepareCompanionStaleManagerRecovery(f.options);
  const witness = owner === "unrelated-dead" ? f.dead.supervisor : f.unrelated;
  const lock = { contract: core.COMPANION_SERVICE_CONTRACT, schema_version: 1,
    service_identity: f.configuration.service_identity, repository_fingerprint: f.configuration.repository_fingerprint,
    lifecycle_operation_id: randomUUID(), owner_pid: witness.pid,
    owner_process_identity: owner === "reused" ? f.manager.manager_process_identity : witness.identity,
    acquired_at: new Date().toISOString() };
  json(f.layout.lifecycle_lock_path, lock);
  const bytes = fs.readFileSync(f.layout.lifecycle_lock_path);
  try {
    await assert.rejects(apply(f, preview.decision), lifecycleRefusal);
    assert.deepEqual(fs.readFileSync(f.layout.lifecycle_lock_path), bytes);
    assert.equal(f.effects(), 0);
  } finally { fs.unlinkSync(f.layout.lifecycle_lock_path); }
});

for (const stage of ["after_record", "after_bootout", "after_desired", "after_manager", "after_lock"]) run(`interrupted-${stage}-fresh-decision`, async f => {
  const preview = await core.prepareCompanionStaleManagerRecovery(f.options);
  await assert.rejects(apply(f, preview.decision, { testStaleManagerRecoveryStageHook: current => {
    if (current === stage) throw new Error(`interrupted_${stage}`);
  } }), new RegExp(`interrupted_${stage}`, "u"));
  assert.equal(read(f.layout.stale_manager_recovery_path).status, "retiring");
  assert.equal((await core.inspectCompanionStaleManagerRecovery(f.options)).result, "incomplete");
  for (const command of [core.installCompanionService, core.startCompanionService, core.stopCompanionService, core.uninstallCompanionService])
    await assert.rejects(command(f.options), /companion_service_recovery_stale_manager_incomplete/u);
  await assert.rejects(core.runCompanionServiceManager({ configurationPath: f.layout.configuration_path,
    launchEnvironment: f.environment }), /companion_service_recovery_stale_manager_incomplete/u);
  await assert.rejects(apply(f, preview.decision), /companion_service_recovery_decision_stale/u);
  const resumed = await core.prepareCompanionStaleManagerRecovery(f.options);
  assert.equal((await apply(f, resumed.decision)).result, "settled");
  assert.equal(f.effects(), 1);
  await assertStopped(f);
  const bytes = fs.readFileSync(f.layout.stale_manager_recovery_path);
  assert.equal((await apply(f, resumed.decision)).result, "settled");
  assert.deepEqual(fs.readFileSync(f.layout.stale_manager_recovery_path), bytes);
  assert.equal(f.effects(), 1);
});

run("crashed-applier-exact-journal-recovery", async f => {
  const preview = await guarded(() => core.prepareCompanionStaleManagerRecovery(f.options));
  const applier = path.join(f.root, "applier.mjs"), input = path.join(f.root, "applier-input.json");
  json(input, { options: { ...f.options, launchctl: undefined }, decision: preview.decision,
    entry: path.join(sourceRoot, sources[1]) });
  fs.writeFileSync(applier, `
import fs from 'node:fs';
import childProcess from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import {pathToFileURL} from 'node:url';
const {options,decision,entry}=JSON.parse(fs.readFileSync(process.argv[2]));
const kill=process.kill,run=childProcess.spawnSync;
process.kill=(pid,signal)=>{if(signal!==0)throw Error('child_recovery_signal_forbidden');return kill(pid,signal);};
childProcess.spawn=()=>{throw Error('child_recovery_spawn_forbidden');};
childProcess.spawnSync=(command,args,settings)=>{if(command==='/bin/launchctl')throw Error('real_launchctl_forbidden');return run(command,args,settings);};
syncBuiltinESMExports();
const core=await import(pathToFileURL(entry));
options.launchctl=args=>{if(args[0]!=='print')throw Error('unexpected_child_effect');const c=JSON.parse(fs.readFileSync(core.resolveCompanionServiceLayout(options).configuration_path));return{status:0,stdout:args[1]+' = {\\n path = '+c.launch_agent_path+'\\n program = '+c.node_path+'\\n working directory = '+c.repository_root+'\\n arguments = {\\n '+c.node_path+'\\n '+c.manager_entry_path+'\\n run\\n --config\\n '+c.configuration_path+'\\n }\\n}\\n'};};
options.testStaleManagerRecoveryStageHook=stage=>{if(stage==='after_record'){process.send({stage});Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,30000);throw Error('fixture_parent_did_not_interrupt');}};
await core.applyCompanionStaleManagerRecovery({...options,decision});
`, { mode: 0o600 });
  // This deliberately interrupted child is a fixture-owned applier, not a
  // service manager. Its only allowed pre-crash effect is writing the journal.
  const child = spawn(process.execPath, [applier, input], { cwd: f.root, env: f.environment,
    detached: true, stdio: ["ignore", "pipe", "pipe", "ipc"] });
  const record = registerOwnedChild(f.owned, child, { label: "stale-manager-interrupted-applier" });
  assert.equal((await message(record, "after-record")).stage, "after_record");
  const lock = read(f.layout.lifecycle_lock_path), journal = read(f.layout.stale_manager_recovery_path);
  assert.equal(lock.owner_pid, child.pid);
  assert.equal(journal.lifecycle_owners.filter(owner => JSON.stringify(owner) === JSON.stringify(lock)).length, 1,
    "crash journal owns exactly the retained lock");
  await guarded(async () => {
    const original = childProcess.spawnSync;
    for (const observation of ["live", "unavailable", "reused"]) {
      const patch = mock.method(childProcess, "spawnSync", (command, args, options) => {
        const result = original(command, args, options);
        if (command !== "/bin/ps" || args[1] !== "lstart=" || args.at(-1) !== String(child.pid)) return result;
        if (observation === "unavailable") return { status: 1, stdout: "" };
        return observation === "reused" ? { ...result, stdout: result.stdout + " different birth" } : result;
      });
      syncBuiltinESMExports();
      try { await assert.rejects(core.prepareCompanionStaleManagerRecovery(f.options), /companion_service_recovery_lifecycle_conflict/u); }
      finally { patch.mock.restore(); syncBuiltinESMExports(); }
      assert.deepEqual(read(f.layout.lifecycle_lock_path), lock, "a journal alone cannot reclaim a live, reused or unavailable owner");
      assert.equal(f.effects(), 0);
    }
  });
  child.kill("SIGKILL");
  await waitForOwnedProcessExit(record, 5_000);
  assert.equal(birth(child.pid), null, "the journaled applier is confirmed missing");
  assert.deepEqual(read(f.layout.lifecycle_lock_path), lock);
  assert.equal((await guarded(() => core.inspectCompanionStaleManagerRecovery(f.options))).result, "incomplete");
  const resumed = await guarded(() => core.prepareCompanionStaleManagerRecovery(f.options));
  assert.equal((await guarded(() => apply(f, resumed.decision))).result, "settled");
  assert.equal(f.effects(), 1);
  assert(!fs.existsSync(f.layout.lifecycle_lock_path));
  await guarded(() => assertStopped(f));
});

if (only) assert(scenarios.some(([name]) => name === only), "unknown fixture scenario");
for (const [name, action] of scenarios.filter(([name]) => only === null || name === only)) {
  // The crash fixture owns an explicit applier spawn/termination. All recovery
  // calls in every other scenario have process-start and signal prohibitions.
  await runCompanionFixtureScenario(name, fixture,
    f => name === "crashed-applier-exact-journal-recovery" ? action(f) : guarded(() => action(f)));
}
