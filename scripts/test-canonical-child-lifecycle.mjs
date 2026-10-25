#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, readFileSync, renameSync, truncateSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const self = fileURLToPath(import.meta.url);
const quiet = { write() {} };

// The unchanged probe also runs against an extracted accepted-source owner.
// Fault injection changes only this disposable process's OS-reader binding.
if (process.argv[2] === "--ledger-probe") {
  const { runCanonicalChild } = await import("./canonical-child-runner.mjs");
  const result = await runCanonicalChild({ suite: "nested-lifecycle", label: "selected nested child",
    command: process.execPath, args: ["-e", "process.exit(0)"], cwd: here, env: process.env,
    timeoutMs: 2000, heartbeatMs: 0, stdout: quiet, stderr: quiet, log() {},
  });
  assert.equal(result.exit_code, 0); assert.equal(result.remaining_owned_processes, 0);
} else if (process.argv[2] === "--snapshot-probe") {
  const { default: cp } = await import("node:child_process");
  const { syncBuiltinESMExports } = await import("node:module");
  const original = cp.spawnSync;
  const fault = process.argv[4];
  cp.spawnSync = (command, args, options) => ["ps", "/bin/ps"].includes(command)
    ? fault === "malformed" ? { status: 0, stdout: "unparseable process inventory\n" }
      : fault === "empty" ? { status: 0, stdout: "" }
        : fault === "missing-self" ? { status: 0, stdout: "1 0 1 S fixture-process-start\n" }
          : fault === "duplicate" ? { status: 0, stdout: `${process.pid} 1 ${process.pid} S fixture-process-start\n`.repeat(2) }
        : { status: 1, stdout: "", error: Object.assign(new Error("fixture reader unavailable"), { code: "EIO" }) }
    : original(command, args, options);
  syncBuiltinESMExports();
  const { runCanonicalChild } = await import(pathToFileURL(path.join(process.argv[3], "canonical-child-runner.mjs")));
  await assert.rejects(runCanonicalChild({ suite: "lifecycle-fault", label: "natural exited child",
    command: process.execPath, args: ["-e", "process.exit(0)"], cwd: here, env: process.env,
    timeoutMs: 2000, heartbeatMs: 0, termGraceMs: 100, killGraceMs: 100,
    stdout: quiet, stderr: quiet, log() {},
  }), error => error.code === "owned_process_observation_unknown");
  cp.spawnSync = original; syncBuiltinESMExports();
  console.log(JSON.stringify({ control: fault, observation: "UNKNOWN", cleanup_claim: false }));
} else {
  const { runCanonicalChild } = await import("./canonical-child-runner.mjs");
  const { createOwnedChildLifecycleCollector, OWNED_CHILD_LIFECYCLE_SCHEMA, OWNED_CHILD_LIFECYCLE_PREFIX, registerOwnedChild, cleanupOwnedProcesses,
    initializeOwnedChildLifecycleFile, readOwnedChildLifecycleFile, appendOwnedChildLifecycleEvent,
    inspectOwnedChildLifecycleBytes, MAX_OWNED_CHILD_LIFECYCLE_BYTES, MAX_OWNED_CHILD_REGISTRATIONS } = await import("./test-harness-process-lifecycle.mjs");
  const { createCanonicalTestResourceRoot, buildCanonicalChildEnvironment, cleanupCanonicalTestResources,
    beginCanonicalTestResourceUse, settleCanonicalTestResourceUse } = await import("./canonical-test-environment.mjs");
  const roots = [];
  let failure;
  try {
    for (const fault of ["read-error", "empty", "malformed", "missing-self", "duplicate"]) {
      const owner = createCanonicalTestResourceRoot("ag-resource-test-"); roots.push(owner);
      // Deliberate observer faults have a separate owned fixture ledger. The
      // outer real child remains in the invocation ledger and must settle.
      const fixtureFile = path.join(owner.root, "negative-fixture-children.jsonl");
      const fixtureLedger = initializeOwnedChildLifecycleFile(fixtureFile);
      let diagnostic = "";
      const result = await runCanonicalChild({ suite: "lifecycle-controls", label: fault,
        command: process.execPath, args: [self, "--snapshot-probe", here, fault], cwd: here,
        env: { ...buildCanonicalChildEnvironment({ temporaryRoot: owner.root }), ...fixtureLedger.environment }, resourceOwner: owner,
        timeoutMs: 5000, heartbeatMs: 0, termGraceMs: 300, killGraceMs: 300,
        stdout: quiet, stderr: { write(chunk) { diagnostic += chunk.toString(); } }, log() {},
      });
      assert.equal(result.exit_code, 0, diagnostic); assert.equal(result.remaining_owned_processes, 0);
      assert.equal(result.cleanup_completed, true);
      const fixtureEvidence = readOwnedChildLifecycleFile(fixtureFile, fixtureLedger.identity);
      assert.equal(fixtureEvidence.started_count, 1); assert.equal(fixtureEvidence.unknown_count, 1);
      assert.equal(fixtureEvidence.complete, false);
      console.log(JSON.stringify({ expected_observer_failure: fault, fixture_ledger: fixtureEvidence,
        outer_child_settled: result.owned_child_lifecycle?.event === "settled" }));
    }
    for (const kind of ["spawn-callback", "output-callback", "post-spawn-log", "post-result-log", "lifecycle-start", "lifecycle-terminal"]) {
      const owner = createCanonicalTestResourceRoot("ag-resource-test-"); roots.push(owner);
      const collector = createOwnedChildLifecycleCollector();
      let pid;
      await assert.rejects(runCanonicalChild({ suite: "lifecycle-controls", label: kind,
        command: process.execPath, args: ["-e", kind === "post-result-log" || kind.startsWith("lifecycle-") ? "console.log('ready')" : "console.log('ready');setInterval(()=>{},1000)"], cwd: here,
        env: buildCanonicalChildEnvironment({ temporaryRoot: owner.root }), resourceOwner: owner,
        timeoutMs: 2000, heartbeatMs: 0, termGraceMs: 300, killGraceMs: 300,
        stdout: { write() { if (kind === "output-callback") throw new Error("fixture-output-failure"); } }, stderr: quiet,
        onLifecycle(event) {
          collector.record(event);
          if ((kind === "lifecycle-start" && event.event === "started") ||
              (kind === "lifecycle-terminal" && event.event === "settled"))
            throw new Error("fixture-lifecycle-observer-failure");
        },
        onSpawn(value) { pid = value; if (kind === "spawn-callback") throw new Error("fixture-spawn-failure"); },
        log(line) { if ((kind === "post-spawn-log" && line.includes("child_spawn")) ||
          (kind === "post-result-log" && line.includes("child_result"))) throw new Error("fixture-log-failure"); },
      }), error => kind.startsWith("lifecycle-")
        ? error.code === "owned_process_evidence_failed" && error.owned_child_lifecycle?.event === "settled"
        : /^fixture-(?:spawn|output|log)-failure$/u.test(error.message));
      assert(pid > 0); assert.throws(() => process.kill(pid, 0), error => error.code === "ESRCH");
      const inventory = collector.snapshot();
      assert.equal(inventory.started_count, 1); assert.equal(inventory.settled_count, 1); assert.equal(inventory.complete, true);
      assert.equal(cleanupCanonicalTestResources([owner])[0].completed, true);
    }
    const directRoot = createCanonicalTestResourceRoot("ag-resource-test-"); roots.push(directRoot);
    const directOwner = new Set(), directInventory = createOwnedChildLifecycleCollector();
    beginCanonicalTestResourceUse(directRoot);
    const direct = registerOwnedChild(directOwner, spawn(process.execPath, ["-e", "process.exit(0)"], {
      cwd: here, env: buildCanonicalChildEnvironment({ temporaryRoot: directRoot.root }), detached: process.platform !== "win32", stdio: "ignore",
    }), { label: "direct lifecycle owner", onLifecycle: directInventory.record });
    await direct.closePromise;
    assert.equal(directOwner.size, 1, "closed records stay owned until explicit process-tree settlement");
    assert.equal(directInventory.snapshot().unknown_count, 1);
    await cleanupOwnedProcesses(directOwner);
    assert.equal(directOwner.size, 0); assert.equal(directInventory.snapshot().complete, true);
    settleCanonicalTestResourceUse(directRoot, { exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0 });
    const nestedRoot = createCanonicalTestResourceRoot("ag-resource-test-"); roots.push(nestedRoot);
    const nestedInventory = createOwnedChildLifecycleCollector(); let nestedOutput = "";
    const nestedResult = await runCanonicalChild({ suite: "lifecycle-controls", label: "nested inventory",
      command: process.execPath, args: [self, "--ledger-probe"], cwd: here,
      env: { ...buildCanonicalChildEnvironment({ temporaryRoot: nestedRoot.root }), AUGNES_CANONICAL_CHILD_LEDGER: "1" },
      resourceOwner: nestedRoot, timeoutMs: 5000, heartbeatMs: 0,
      onLifecycle: nestedInventory.record, stdout: { write(chunk) { nestedOutput += chunk.toString(); } }, stderr: quiet, log() {},
    });
    assert.equal(nestedResult.exit_code, 0);
    for (const line of nestedOutput.trim().split("\n")) {
      assert(line.startsWith(OWNED_CHILD_LIFECYCLE_PREFIX));
      nestedInventory.record(JSON.parse(line.slice(OWNED_CHILD_LIFECYCLE_PREFIX.length)));
    }
    assert.equal(nestedInventory.snapshot().started_count, 2);
    assert.equal(nestedInventory.snapshot().settled_count, 2); assert.equal(nestedInventory.snapshot().complete, true);
    const sinkRoot = createCanonicalTestResourceRoot("ag-resource-test-"); roots.push(sinkRoot);
    const sinkFile = path.join(sinkRoot.root, "children.jsonl");
    const sink = initializeOwnedChildLifecycleFile(sinkFile);
    const sinkResult = await runCanonicalChild({ suite: "lifecycle-controls", label: "swallowed stdout ledger",
      command: process.execPath, args: [self, "--ledger-probe"], cwd: here,
      env: { ...buildCanonicalChildEnvironment({ temporaryRoot: sinkRoot.root }), ...sink.environment },
      resourceOwner: sinkRoot, timeoutMs: 5000, heartbeatMs: 0, stdout: quiet, stderr: quiet, log() {},
      onLifecycle: event => appendOwnedChildLifecycleEvent(sinkFile, sink.identity, event),
    });
    assert.equal(sinkResult.exit_code, 0);
    const persisted = readOwnedChildLifecycleFile(sinkFile, sink.identity);
    assert.equal(persisted.started_count, 2); assert.equal(persisted.settled_count, 2); assert.equal(persisted.complete, true);
    assert.equal(persisted.content_sha256, createHash("sha256").update(readFileSync(sinkFile)).digest("hex"));
    const { identity, ...logical } = persisted;
    assert.deepEqual(inspectOwnedChildLifecycleBytes(readFileSync(sinkFile)), logical);
    chmodSync(sinkFile, 0o644); assert.throws(() => readOwnedChildLifecycleFile(sinkFile, sink.identity), /owned_child_ledger_unsafe/);
    chmodSync(sinkFile, 0o600);
    const originalSink = `${sinkFile}.original`; renameSync(sinkFile, originalSink);
    writeFileSync(sinkFile, readFileSync(originalSink), { mode: 0o600 });
    assert.throws(() => readOwnedChildLifecycleFile(sinkFile, sink.identity), /owned_child_ledger_owner_changed/);
    const start = id => ({ schema: OWNED_CHILD_LIFECYCLE_SCHEMA, child_id: id.repeat(32), event: "started",
      label_fingerprint: createHash("sha256").update("fixture").digest("hex"), observed_at: "2026-01-01T00:00:00.000Z" });
    const terminal = id => ({ schema: OWNED_CHILD_LIFECYCLE_SCHEMA, child_id: id.repeat(32), event: "settled",
      observed_at: "2026-01-01T00:00:01.000Z", exit_observed: true, streams_closed: true,
      exit_code: 0, signal: null, remaining_owned_processes: 0 });
    const missing = createOwnedChildLifecycleCollector(); missing.record(start("a"));
    missing.record(start("b")); missing.record(terminal("b"));
    assert.equal(missing.snapshot().started_count, 2); assert.equal(missing.snapshot().unknown_count, 1);
    assert.equal(missing.snapshot().complete, false, "one completed child must not hide an unmatched start");
    for (const events of [
      [terminal("a")], [start("a"), start("a"), terminal("a")],
      [start("a"), terminal("a"), terminal("a")],
      [start("a"), { ...terminal("a"), remaining_owned_processes: null }],
      [start("a"), { ...terminal("a"), private_payload: "must not be retained" }],
      [start("a"), { ...terminal("a"), event: "unknown", remaining_owned_processes: null, reason: "owned_process_observation_unknown" }],
    ]) {
      const collector = createOwnedChildLifecycleCollector(); events.forEach(collector.record);
      assert.equal(collector.snapshot().complete, false);
      assert(!JSON.stringify(collector.snapshot()).includes("must not be retained"));
    }
    const overflow = createOwnedChildLifecycleCollector({ maximumChildren: 1 });
    [start("a"), terminal("a"), start("b"), terminal("b")].forEach(overflow.record);
    assert.equal(overflow.snapshot().complete, false); assert(overflow.snapshot().issues.includes("owned_child_inventory_overflow"));
    assert.equal(MAX_OWNED_CHILD_LIFECYCLE_BYTES, 64 * 1024 * 1024);
    assert.equal(MAX_OWNED_CHILD_REGISTRATIONS, 131072);
    assert.throws(() => createOwnedChildLifecycleCollector({ maximumChildren: MAX_OWNED_CHILD_REGISTRATIONS + 1 }));
    const boundedFile = path.join(sinkRoot.root, "bounded.jsonl"), bounded = initializeOwnedChildLifecycleFile(boundedFile);
    truncateSync(boundedFile, MAX_OWNED_CHILD_LIFECYCLE_BYTES + 1);
    assert.throws(() => appendOwnedChildLifecycleEvent(boundedFile, bounded.identity, start("a")), /owned_child_ledger_overflow/);
    assert.throws(() => readOwnedChildLifecycleFile(boundedFile, bounded.identity), /owned_child_ledger_overflow/);
    assert.equal(createOwnedChildLifecycleCollector().snapshot().complete, false);
    console.log(JSON.stringify({ controls: ["ps-error-unknown", "ps-empty-unknown", "ps-malformed-unknown", "ps-incomplete-unknown", "ps-duplicate-unknown",
      "spawn-callback-settled", "output-callback-settled", "post-spawn-log-settled", "post-result-log-settled",
      "lifecycle-start-observer-failure-settled", "lifecycle-terminal-observer-failure-settled",
      "closed-record-retained-until-settlement", "nested-selected-event-channel", "stdout-independent-owned-ledger",
      "ledger-mode-and-replacement-refused", "complete-start-inventory",
      "missing-duplicate-conflicting-extra-events-refused", "bounded-overflow-refused"], status: "pass" }));
  } catch (error) { failure = error; }
  finally {
    const pending = roots.filter(owner => existsSync(owner.root));
    const cleanup = cleanupCanonicalTestResources(pending);
    const errors = cleanup.filter(result => !result.completed).map(result => new Error(result.failures.join(",")));
    if (failure) errors.unshift(failure);
    if (errors.length) throw new AggregateError(errors, "lifecycle controls or owned cleanup failed");
  }
  await import("./test-owned-sync-child-lifecycle.mjs");
}
