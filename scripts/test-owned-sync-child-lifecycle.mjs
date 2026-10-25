#!/usr/bin/env node
import assert from "node:assert/strict";
import childProcess from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import path from "node:path";
import { createCanonicalTestResourceRoot, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";
import { initializeOwnedChildLifecycleFile, readOwnedChildLifecycleFile,
  runOwnedSyncChild, withOwnedSyncLifecycle, ownedSpawnSync, ownedExecFileSync } from "./test-harness-process-lifecycle.mjs";
import { withCheckoutIdentityProbe, observeCheckoutIdentity } from "../plugins/augnes-operator/mcp/checkout-identity.mjs";
import { withCompanionProcessProbe } from "../plugins/augnes-operator/mcp/companion-service-core.mjs";

const owners = [], pending = new Set(), originalSpawn = childProcess.spawnSync, originalKill = process.kill;
const fixture = label => {
  const owner = createCanonicalTestResourceRoot("ag-resource-test-"); owners.push(owner);
  const file = path.join(owner.root, `${label}.jsonl`), ledger = initializeOwnedChildLifecycleFile(file);
  return { owner, file, ...ledger };
};
const observe = fixture => readOwnedChildLifecycleFile(fixture.file, fixture.identity);
const execute = (fixture, command, args, options = {}) => withOwnedSyncLifecycle(fixture,
  () => runOwnedSyncChild(command, args, { encoding: "utf8", timeout: 2000, ...options }));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const live = pid => { try { process.kill(pid, 0); return true; } catch (error) { if (error.code === "ESRCH") return false; throw error; } };
let primary;
try {
  const natural = fixture("natural");
  let result, emptyGroupProofs = 0, unnecessarySnapshots = 0;
  process.kill = (pid, signal) => {
    if (pid < 0) assert.equal(signal, 0, "group observer must never send a real signal");
    try { return originalKill(pid, signal); }
    catch (error) { if (pid < 0 && error.code === "ESRCH") emptyGroupProofs += 1; throw error; }
  };
  childProcess.spawnSync = (command, args, options) => {
    if (command === "/bin/ps") unnecessarySnapshots += 1;
    return originalSpawn(command, args, options);
  };
  syncBuiltinESMExports();
  try { result = execute(natural, process.execPath, ["-e", "console.log('sync-natural')"]); }
  finally { process.kill = originalKill; childProcess.spawnSync = originalSpawn; syncBuiltinESMExports(); }
  assert.equal(result.status, 0); assert.equal(result.stdout, "sync-natural\n");
  assert.equal(result.owned_child_lifecycle.event, "settled");
  assert.equal(observe(natural).started_count, 1); assert.equal(observe(natural).complete, true);
  assert.equal(emptyGroupProofs, 1); assert.equal(unnecessarySnapshots, 0);

  const timeout = fixture("timeout"), started = Date.now();
  const expired = execute(timeout, process.execPath, ["-e", "process.on('SIGTERM',()=>{});setInterval(()=>{},1000)"], { timeout: 100 });
  assert.equal(expired.error.code, "ETIMEDOUT"); assert.equal(expired.signal, "SIGKILL");
  assert.equal(expired.owned_child_lifecycle.event, "settled"); assert.equal(observe(timeout).complete, true);
  assert(Date.now() - started < 3000, "timeout and observation remain bounded"); assert.equal(live(expired.pid), false);

  const failed = fixture("failed-spawn"); let spawnFailure;
  assert.throws(() => execute(failed, path.join(failed.owner.root, "missing-executable"), []), error => {
    spawnFailure = error; return error.code === "owned_sync_spawn_unconfirmed";
  });
  assert.equal(spawnFailure.result.error.code, "ENOENT"); assert.equal(observe(failed).unknown_count, 1);
  assert.equal(observe(failed).children[0].terminal.exit_observed, false);

  const ambiguous = [];
  for (const code of ["EPERM", "EIO"]) {
    const denied = fixture(`ambiguous-observation-${code}`); ambiguous.push(denied);
    let ambiguousResult;
    process.kill = (pid, signal) => {
      if (pid < 0 && signal === 0) throw Object.assign(new Error("fixture group probe failure"), { code });
      return originalKill(pid, signal);
    };
    try {
      assert.throws(() => execute(denied, process.execPath, ["-e", "process.exit(0)"]), error => {
        ambiguousResult = error.result; return error.code === "owned_process_observation_unknown";
      });
    } finally { process.kill = originalKill; }
    assert.equal(ambiguousResult.status, 0); assert.equal(observe(denied).unknown_count, 1);
    assert.equal(live(ambiguousResult.pid), false);
  }

  const group = fixture("remaining-group"), pidFile = path.join(group.owner.root, "descendant.pid");
  const code = "const {spawn}=require('node:child_process');const {writeFileSync}=require('node:fs');" +
    "const child=spawn(process.execPath,['-e','setTimeout(()=>{},1200)'],{stdio:'ignore'});" +
    `writeFileSync(${JSON.stringify(pidFile)},String(child.pid));child.unref();`;
  let groupFailure;
  try { execute(group, process.execPath, ["-e", code]); } catch (error) { groupFailure = error; }
  finally { if (existsSync(pidFile)) pending.add(Number(readFileSync(pidFile, "utf8"))); }
  assert.equal(groupFailure?.code, "owned_sync_group_unsettled");
  const descendant = Number(readFileSync(pidFile, "utf8"));
  assert.equal(observe(group).unknown_count, 1); assert.equal(live(descendant), true);
  const until = Date.now() + 3000;
  while (live(descendant) && Date.now() < until) await sleep(20);
  assert.equal(live(descendant), false, "fixture descendant must naturally exit before resource cleanup"); pending.delete(descendant);
  assert.equal(observe(group).unknown_count, 1, "later natural exit does not rewrite UNKNOWN history");

  const unreadableGroup = fixture("remaining-group-snapshot-failure"), unreadablePidFile = path.join(unreadableGroup.owner.root, "descendant.pid");
  const unreadableCode = "const {spawn}=require('node:child_process');const {writeFileSync}=require('node:fs');" +
    "const child=spawn(process.execPath,['-e','setTimeout(()=>{},1200)'],{stdio:'ignore'});" +
    `writeFileSync(${JSON.stringify(unreadablePidFile)},String(child.pid));child.unref();`;
  let unreadableFailure, requiredSnapshots = 0;
  childProcess.spawnSync = (command, args, options) => {
    if (command === "/bin/ps") {
      requiredSnapshots += 1;
      return { status: 1, stdout: "", error: Object.assign(new Error("fixture snapshot failure"), { code: "EIO" }) };
    }
    return originalSpawn(command, args, options);
  };
  syncBuiltinESMExports();
  try { execute(unreadableGroup, process.execPath, ["-e", unreadableCode]); } catch (error) { unreadableFailure = error; }
  finally {
    childProcess.spawnSync = originalSpawn; syncBuiltinESMExports();
    if (existsSync(unreadablePidFile)) pending.add(Number(readFileSync(unreadablePidFile, "utf8")));
  }
  assert.equal(unreadableFailure?.code, "owned_process_observation_unknown"); assert.equal(requiredSnapshots, 1);
  const unreadableDescendant = Number(readFileSync(unreadablePidFile, "utf8"));
  assert.equal(live(unreadableDescendant), true); assert.equal(observe(unreadableGroup).unknown_count, 1);
  const unreadableUntil = Date.now() + 3000;
  while (live(unreadableDescendant) && Date.now() < unreadableUntil) await sleep(20);
  assert.equal(live(unreadableDescendant), false); pending.delete(unreadableDescendant);
  assert.equal(observe(unreadableGroup).unknown_count, 1, "restoring the observer never rewrites UNKNOWN");

  const timedGroup = fixture("timed-group"), timedPidFile = path.join(timedGroup.owner.root, "descendant.pid");
  const timedCode = "const {spawn}=require('node:child_process');const {writeFileSync}=require('node:fs');" +
    "const child=spawn(process.execPath,['-e','setTimeout(()=>{},1200)'],{stdio:'inherit'});" +
    `writeFileSync(${JSON.stringify(timedPidFile)},String(child.pid));setInterval(()=>{},1000);`;
  let timedFailure;
  const timedStart = Date.now();
  try { execute(timedGroup, process.execPath, ["-e", timedCode], { timeout: 150 }); } catch (error) { timedFailure = error; }
  finally { if (existsSync(timedPidFile)) pending.add(Number(readFileSync(timedPidFile, "utf8"))); }
  assert.equal(timedFailure?.code, "owned_sync_group_unsettled");
  assert.equal(timedFailure.result.error.code, "ETIMEDOUT");
  assert(Date.now() - timedStart < 1000, "inherited descendant pipes must not evade the supplied synchronous timeout");
  const timedDescendant = Number(readFileSync(timedPidFile, "utf8"));
  assert.equal(live(timedDescendant), true, "runner does not signal a remaining unverified group");
  const timedUntil = Date.now() + 3000;
  while (live(timedDescendant) && Date.now() < timedUntil) await sleep(20);
  assert.equal(live(timedDescendant), false); pending.delete(timedDescendant);
  assert.equal(observe(timedGroup).unknown_count, 1);

  const invalid = fixture("invalid-timeout");
  for (const timeout of [0, -1, Infinity, 120001])
    assert.throws(() => execute(invalid, process.execPath, ["-e", "process.exit(0)"], { timeout }), /owned_sync_timeout_invalid/);
  assert.equal(observe(invalid).started_count, 0, "invalid bounds refuse before dispatch");

  const adapters = fixture("adapters-success");
  withOwnedSyncLifecycle(adapters, () => {
    const bytes = ownedExecFileSync(process.execPath, ["-e", "process.stdin.pipe(process.stdout)"], {
      input: Buffer.from("binary-input\0fixture"), timeout: 1000, stdio: ["pipe", "pipe", "pipe"],
    });
    assert(Buffer.isBuffer(bytes)); assert.deepEqual(bytes, Buffer.from("binary-input\0fixture"));
    assert.equal(ownedExecFileSync(process.execPath, { input: "process.stdout.write('exec-options-overload')", encoding: "utf8", timeout: 1000 }), "exec-options-overload");
    const spawned = ownedSpawnSync(process.execPath, { input: "process.stdout.write('spawn-options-overload')", encoding: "utf8", timeout: 1000 });
    assert.equal(spawned.status, 0); assert.equal(spawned.stdout, "spawn-options-overload");
    const failedSpawn = ownedSpawnSync(process.execPath, ["-e", "process.exit(4)"], { timeout: 1000 });
    assert.equal(failedSpawn.status, 4); assert.equal(failedSpawn.owned_child_lifecycle.event, "settled");
  });
  assert.equal(observe(adapters).started_count, 4); assert.equal(observe(adapters).complete, true);

  const execFailure = fixture("adapter-exec-failure");
  withOwnedSyncLifecycle(execFailure, () => assert.throws(() => ownedExecFileSync(process.execPath,
    ["-e", "process.stdout.write('failure-output');process.stderr.write('failure-diagnostic');process.exit(7)"],
    { encoding: "utf8", timeout: 1000, stdio: ["ignore", "pipe", "pipe"] }), error => {
    assert.equal(error.status, 7); assert.equal(error.signal, null); assert.equal(error.error, undefined);
    assert.equal(error.stdout, "failure-output"); assert.equal(error.stderr, "failure-diagnostic");
    assert.deepEqual(error.output, [null, "failure-output", "failure-diagnostic"]);
    assert.equal(error.owned_child_lifecycle.event, "settled"); return true;
  }));
  assert.equal(observe(execFailure).complete, true, "a settled failed command still throws its original execution failure");

  const execTimeout = fixture("adapter-exec-timeout");
  withOwnedSyncLifecycle(execTimeout, () => assert.throws(() => ownedExecFileSync(process.execPath,
    ["-e", "process.on('SIGTERM',()=>{});setInterval(()=>{},1000)"], { timeout: 100, stdio: ["ignore", "pipe", "pipe"] }), error => {
    assert.equal(error.code, "ETIMEDOUT"); assert.equal(error.status, null); assert.equal(error.signal, "SIGKILL");
    assert.equal(error.error, error); assert(Buffer.isBuffer(error.stdout)); assert(Buffer.isBuffer(error.stderr));
    assert.equal(error.output[1], error.stdout); assert.equal(error.output[2], error.stderr);
    assert.equal(error.owned_child_lifecycle.event, "settled"); assert.equal(live(error.pid), false); return true;
  }));
  assert.equal(observe(execTimeout).complete, true);

  const adapterUnknown = fixture("adapters-unknown");
  process.kill = (pid, signal) => {
    if (pid < 0 && signal === 0) throw Object.assign(new Error("fixture adapter group failure"), { code: "EPERM" });
    return originalKill(pid, signal);
  };
  try {
    withOwnedSyncLifecycle(adapterUnknown, () => {
      assert.throws(() => ownedExecFileSync(process.execPath, ["-e", "process.stdout.write('unknown-output')"], { encoding: "utf8", timeout: 1000, stdio: ["ignore", "pipe", "pipe"] }), error => {
        assert.equal(error.code, "owned_process_observation_unknown"); assert.equal(error.status, 0);
        assert.equal(error.stdout, "unknown-output"); assert.deepEqual(error.output, [null, "unknown-output", ""]);
        assert.equal(live(error.pid), false); return true;
      });
      assert.throws(() => ownedSpawnSync(process.execPath, ["-e", "process.exit(0)"], { timeout: 1000 }), error => {
        assert.equal(error.code, "owned_process_observation_unknown"); assert.equal(error.result.status, 0);
        assert.equal(live(error.result.pid), false); return true;
      });
    });
  } finally { process.kill = originalKill; }
  assert.equal(observe(adapterUnknown).started_count, 2); assert.equal(observe(adapterUnknown).unknown_count, 2);
  assert.equal(observe(adapterUnknown).complete, false);

  if (process.platform === "darwin") {
    const helpers = fixture("scoped-real-helper-probes");
    withOwnedSyncLifecycle(helpers, () => {
      const direct = withCheckoutIdentityProbe(runOwnedSyncChild, () => observeCheckoutIdentity(helpers.owner.root));
      assert.equal(direct.durable_observation, "observed");
      const companion = withCompanionProcessProbe(runOwnedSyncChild, () => observeCheckoutIdentity(helpers.owner.root));
      assert.deepEqual(companion, direct);
    });
    assert.equal(observe(helpers).started_count, 2); assert.equal(observe(helpers).settled_count, 2);
    assert.equal(observe(helpers).complete, true);
  }

  // The absence of a selected ledger preserves ordinary spawnSync callers.
  const saved = Object.fromEntries(["AUGNES_CANONICAL_CHILD_LEDGER_PATH", "AUGNES_CANONICAL_CHILD_LEDGER_IDENTITY", "AUGNES_CANONICAL_CHILD_LEDGER_ANCESTORS"].map(key => [key, process.env[key]]));
  try {
    for (const key of Object.keys(saved)) delete process.env[key];
    const legacy = runOwnedSyncChild(process.execPath, ["-e", "process.exit(3)"], { encoding: "utf8", timeout: 1000 });
    assert.equal(legacy.status, 3); assert.equal(legacy.owned_child_lifecycle, undefined);
    const legacyAdapter = ownedSpawnSync(process.execPath, { input: "process.exit(2)", timeout: 0 });
    assert.equal(legacyAdapter.status, 2); assert.equal(legacyAdapter.owned_child_lifecycle, undefined);
    assert.equal(ownedExecFileSync(process.execPath, ["-e", "process.stdout.write('legacy-exec')"], { encoding: "utf8", timeout: 0 }), "legacy-exec");
  } finally { for (const [key,value] of Object.entries(saved)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } }
  console.log(JSON.stringify({ status: "pass", deciding: false,
    controls: ["natural-settlement", "native-esrch-empty-group-no-ps", "timeout-preserved-with-settlement", "spawn-failure-unknown",
      "native-probe-eperm-and-eio-unknown", "required-snapshot-failure-unknown", "remaining-group-unknown-no-signal", "timeout-with-inherited-pipes",
      "invalid-bound-before-start", "adapter-buffer-encoding-input-and-overloads", "adapter-failure-properties", "adapter-timeout-properties", "adapter-unknown-ledger", "scoped-real-helper-probes", "legacy-pass-through"],
    negative_fixture_inventories: [failed, ...ambiguous, group, unreadableGroup, timedGroup, adapterUnknown].map(observe) }));
} catch (error) { primary = error; }
finally {
  process.kill = originalKill; childProcess.spawnSync = originalSpawn; syncBuiltinESMExports();
  const until = Date.now() + 3000;
  while ([...pending].some(live) && Date.now() < until) await sleep(20);
  const unsettled = [...pending].filter(live);
  const cleanup = unsettled.length ? [] : cleanupCanonicalTestResources(owners);
  if (primary || unsettled.length || cleanup.some(result => !result.completed)) throw new AggregateError([
    ...(primary ? [primary] : []), ...(unsettled.length ? [new Error("fixture descendant cleanup UNKNOWN; roots preserved")] : []),
    ...cleanup.filter(result => !result.completed).map(result => new Error(result.failures.join(","))),
  ], "owned sync child control or cleanup failed");
}
for (const owner of owners) assert.equal(existsSync(owner.root), false);
