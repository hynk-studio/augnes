import assert from "node:assert/strict";
import childProcess from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { fileURLToPath } from "node:url";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { registerOwnedChild, terminateOwnedProcessTree } from "./test-harness-process-lifecycle.mjs";

export async function assertWorkHandoffLifecycleObservation() {
  const root = mkdtempSync(path.join(tmpdir(), "augnes-handoff-lifecycle-"));
  const browserRoot = path.join(root, "browser-owned");
  const trigger = path.join(root, "recreate");
  const marker = path.join(browserRoot, "descendant-wrote");
  const ready = path.join(root, "ready.json");
  const originalSpawnSync = childProcess.spawnSync;
  const owner = new Set();
  let leader, descendantIdentity, cleanupCompleted = false;
  const observations = [];
  const failures = [], cleanupFailures = [];

  async function until(predicate, label) {
    const deadline = Date.now() + 5_000;
    while (!predicate()) {
      if (Date.now() >= deadline) throw new Error(`handoff_lifecycle_timeout:${label}`);
      await delay(20);
    }
  }

  function identity(pid) {
    const result = originalSpawnSync("/bin/ps", ["-p", String(pid), "-o", "pid=,pgid=,state=,lstart="], {
      encoding: "utf8", timeout: 2_000,
    });
    if (result.status === 1 && !result.error && result.stdout.trim() === "") return null;
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0);
    const match = result.stdout.trim().match(/^(\d+)\s+(\d+)\s+(\S+)\s+(.+)$/);
    assert.ok(match, "known owned descendant observation must be complete");
    if (match[3].startsWith("Z")) return null;
    return { pid: Number(match[1]), pgid: Number(match[2]), started: match[4] };
  }

  try {
    mkdirSync(browserRoot);
    const descendantSource = `
      const fs = require('node:fs'), path = require('node:path');
      const root = process.argv[1], trigger = path.join(root, 'recreate');
      fs.writeFileSync(path.join(root, 'ready.json'), JSON.stringify({pid:process.pid}));
      setInterval(() => {
        if (!fs.existsSync(trigger)) return;
        const target = path.join(root, 'browser-owned');
        fs.mkdirSync(target, {recursive:true});
        fs.writeFileSync(path.join(target, 'descendant-wrote'), 'known owned descendant');
        fs.rmSync(trigger);
      }, 20);
      setTimeout(() => process.exit(0), 20_000);
    `;
    const leaderSource = `
      const child = require('node:child_process').spawn(process.execPath,
        ['-e', ${JSON.stringify(descendantSource)}, ${JSON.stringify(root)}],
        {stdio:'ignore', detached:false});
      child.unref();
    `;
    leader = registerOwnedChild(owner, childProcess.spawn(process.execPath, ["-e", leaderSource], {
      detached: true, stdio: "ignore",
    }), { label: "handoff lifecycle known group leader" });
    await until(() => leader.closed && existsSync(ready), "leader exit and descendant ready");
    assert.equal(leader.closeResult.code, 0);
    descendantIdentity = identity(JSON.parse(readFileSync(ready, "utf8")).pid);
    assert.ok(descendantIdentity);
    assert.equal(descendantIdentity.pgid, leader.pid);

    for (const [label, snapshot] of [
      ["spawn_error", { status: null, error: Object.assign(new Error("controlled snapshot failure"), { code: "ETIMEDOUT" }), stdout: "" }],
      ["nonzero_exit", { status: 1, stdout: "" }],
      ["empty_output", { status: 0, stdout: "" }],
      ["malformed_output", { status: 0, stdout: "not a process snapshot\n" }],
    ]) {
      let returned = null, errorCode = null;
      childProcess.spawnSync = (command, ...args) => {
        if (command === "ps" || command === "/bin/ps") return snapshot;
        return originalSpawnSync(command, ...args);
      };
      syncBuiltinESMExports();
      try { returned = await terminateOwnedProcessTree(leader); }
      catch (error) { errorCode = error.code ?? null; }
      finally { childProcess.spawnSync = originalSpawnSync; syncBuiltinESMExports(); }
      assert.deepEqual(identity(descendantIdentity.pid), descendantIdentity);
      let recreatedAfterFalseSettlement = false;
      if (returned !== null) {
        // Demonstrate the unsafe resource release only inside this owned fixture.
        rmSync(browserRoot, { recursive: true });
        writeFileSync(trigger, "release after reported settlement");
        await until(() => existsSync(marker), "known descendant recreates released directory");
        recreatedAfterFalseSettlement = true;
      }
      const observation = { case: label, error_code: errorCode, returned, descendant_alive: true,
        filesystem_release_refused: returned === null, recreated_after_false_settlement: recreatedAfterFalseSettlement };
      observations.push(observation);
      console.log(JSON.stringify(observation));
    }

    const settled = await terminateOwnedProcessTree(leader);
    assert.equal(settled.term_sent, true);
    await until(() => identity(descendantIdentity.pid) === null, "real descendant settlement");
    rmSync(browserRoot, { recursive: true });
    writeFileSync(trigger, "must not recreate after actual settlement");
    await delay(100);
    assert.equal(existsSync(browserRoot), false);
    console.log(JSON.stringify({ real_owned_group_settlement: "PASS", directory_recreation_after_settlement: false }));
    for (const observation of observations) {
      assert.equal(observation.error_code, "owned_process_observation_unknown", observation.case);
      assert.equal(observation.filesystem_release_refused, true, observation.case);
    }
  } catch (error) {
    failures.push(error);
  } finally {
    let mockRestored = false, ownedSettled = !leader;
    try {
      childProcess.spawnSync = originalSpawnSync;
      syncBuiltinESMExports();
      mockRestored = childProcess.spawnSync === originalSpawnSync;
    } catch (error) { cleanupFailures.push(error); }
    if (leader && mockRestored) {
      try { await terminateOwnedProcessTree(leader); ownedSettled = true; }
      catch (error) { cleanupFailures.push(error); }
    }
    if (descendantIdentity) {
      try { assert.equal(identity(descendantIdentity.pid), null, "only settled owned resources may be removed"); }
      catch (error) { ownedSettled = false; cleanupFailures.push(error); }
    }
    try { assert.equal(owner.size, 0); }
    catch (error) { ownedSettled = false; cleanupFailures.push(error); }
    if (ownedSettled && mockRestored) {
      try {
        rmSync(root, { recursive: true, force: true });
        cleanupCompleted = !existsSync(root);
        assert.equal(cleanupCompleted, true);
      } catch (error) { cleanupFailures.push(error); }
    }
    const rootRetained = existsSync(root);
    console.log(JSON.stringify({ fixture_cleanup_completed: cleanupCompleted, child_process_mock_restored: mockRestored,
      owned_process_settlement: ownedSettled ? "settled" : "UNKNOWN", fixture_root_retained: rootRetained,
      retained_root: rootRetained ? root : null, cleanup_failure_codes: cleanupFailures.map(error => error?.code ?? error?.name ?? "unknown") }));
  }
  failures.push(...cleanupFailures);
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1) throw new AggregateError(failures, "handoff lifecycle regression and cleanup failed");
  assert.equal(cleanupCompleted, true);
  console.log(JSON.stringify({ handoff_lifecycle_observation_refusal: "PASS", cases: observations.length }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void assertWorkHandoffLifecycleObservation().catch(error => { console.error(error); process.exitCode = 1; });
}
