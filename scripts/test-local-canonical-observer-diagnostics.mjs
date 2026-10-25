import assert from "node:assert/strict";
import fs from "node:fs";
import cp from "node:child_process";
import path from "node:path";
import { syncBuiltinESMExports } from "node:module";
import { freezeInputContract, monitorInputContract, boundedObservationDiagnostic, deriveOperationalDisposition } from "./local-canonical-inputs.mjs";
import { runCanonicalChild } from "./canonical-child-runner.mjs";
import { createCanonicalTestResourceRoot, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse, cleanupCanonicalTestResources, buildCanonicalChildEnvironment } from "./canonical-test-environment.mjs";
import { runPhasesSequentially } from "./run-local-canonical-verification.mjs";
import { finalizeReceipt } from "./local-canonical-receipt.mjs";
import { baseReceipt } from "./fixtures/local-canonical-receipt-v3.mjs";
import { createPrivateReviewExport } from "./local-canonical-review-export.mjs";

// Controlled OS/helper fault injection into the actual observer, not an injected
// replacement reader. Each patch is restricted to our disposable file/helper;
// all bindings are restored before any resource cleanup or another case.
const owner = createCanonicalTestResourceRoot("ag-resource-test-");
beginCanonicalTestResourceUse(owner);
const quiet = { write() {} }, rows = [];
const saved = { ...Object.fromEntries(["lstatSync", "openSync", "readFileSync", "closeSync"].map(k => [k, fs[k]])), execFileSync: cp.execFileSync };
const sentinel = "untrusted-private-path-command-output-must-not-be-retained";
const error = code => Object.assign(new Error(sentinel), { code, path: sentinel, stdout: Buffer.from(sentinel), stderr: Buffer.from(sentinel) });
let lastResult = null;
try {
  for (const [mode, operation, code] of [
    ["read", "file_read", "EIO"], ["open", "file_open", "EACCES"], ["stat", "path_stat", "EIO"],
    ["race", "identity_check", "input_observation_race"], ["helper", "permission_acl", "ETIMEDOUT"],
    ["helper-unknown", "permission_acl", "unknown"], ["helper-malformed", "permission_snapshot", "input_executable_permissions_unknown"],
    ["close", "descriptor_close", "EIO"],
  ]) {
    const file = path.join(owner.root, mode), alias = `${file}.alias`;
    fs.writeFileSync(file, "disposable executable input\n", { mode: 0o700 });
    const frozen = freezeInputContract({ resources: [{ id: "browser-executable", file, classification: "execution", readOnlyExecutable: true }], pathKind: "isolated-model-free-v1", binding: {} });
    const controller = new AbortController(), monitor = monitorInputContract(frozen, controller, { intervalMs: 10000 });
    let injected = false, childStarted = false, started = 0;
    const fds = new Set();
    fs.lstatSync = (p, ...args) => { if (p === file && mode === "stat") throw error("EIO"); return saved.lstatSync(p, ...args); };
    fs.openSync = (p, ...args) => {
      if (p === file && mode === "open") throw error("EACCES");
      const fd = saved.openSync(p, ...args); if (p === file) fds.add(fd); return fd;
    };
    fs.readFileSync = (fd, ...args) => {
      if (fds.has(fd) && mode === "read") throw error("EIO");
      const bytes = saved.readFileSync(fd, ...args);
      if (fds.has(fd) && mode === "race" && !injected) { fs.linkSync(file, alias); injected = true; }
      return bytes;
    };
    fs.closeSync = fd => { const target = fds.delete(fd); saved.closeSync(fd); if (target && mode === "close") throw error("EIO"); };
    cp.execFileSync = (tool, args, options) => {
      if (tool === "/bin/ls" && args.includes(file)) {
        if (mode === "helper") throw error("ETIMEDOUT");
        if (mode === "helper-unknown") throw error(sentinel);
        if (mode === "helper-malformed") return sentinel;
      }
      return saved.execFileSync(tool, args, options);
    };
    syncBuiltinESMExports();
    let timer;
    try {
      const results = await runPhasesSequentially({ phases: [{ id: "observed-child" }, { id: "must-not-start" }], signal: controller.signal, execute: async () => {
        started++;
        lastResult = await runCanonicalChild({ suite: "observer-diagnostic-control", label: mode, command: process.execPath,
          args: ["-e", "process.on('SIGTERM',()=>process.exit(0));setInterval(()=>{},1000)"], cwd: owner.root,
          env: buildCanonicalChildEnvironment({ temporaryRoot: owner.root }), timeoutMs: 1500, termGraceMs: 100, killGraceMs: 100,
          stdout: quiet, stderr: quiet, signal: controller.signal, log(line) {
            if (line.includes(" child_spawn ")) { childStarted = true; timer = setTimeout(() => monitor.check(), 60); }
          } });
        return { status: "failure", failure_code: "phase_cancelled", cleanup: { completed: lastResult.cleanup_completed, remaining_owned_processes: lastResult.remaining_owned_processes } };
      } });
      assert.equal(results.length, 1); assert.equal(started, 1); assert(childStarted);
      assert(lastResult.cancelled); assert(lastResult.exit_observed && lastResult.streams_closed && lastResult.cleanup_completed); assert.equal(lastResult.remaining_owned_processes, 0);
      const snapshot = frozen.snapshot(), event = snapshot.events[0];
      assert.equal(snapshot.first_fault.disposition, "observer_failure"); assert.equal(event.after, null);
      assert.deepEqual(event.diagnostic, { contract: "augnes.input-observation-diagnostic.v1", operation, code });
      assert.equal(deriveOperationalDisposition({ phases: results, fault: snapshot.first_fault, cleanup: true }), "unknown_relevance");
      const receipt = finalizeReceipt({ ...structuredClone(baseReceipt), inputs: snapshot });
      const exported = createPrivateReviewExport(receipt);
      assert.deepEqual(exported.inputs.events[0].diagnostic, event.diagnostic);
      assert(!JSON.stringify(snapshot).includes(sentinel)); assert(!JSON.stringify(exported).includes(sentinel));
      rows.push({ mode, diagnostic: event.diagnostic, disposition: "unknown_relevance", cancelled: lastResult.cancelled, completed_cleanup: lastResult.cleanup_completed, owned_processes: 0, later_phase_started: false });
    } finally {
      clearTimeout(timer); monitor.stop();
      for (const name of ["lstatSync", "openSync", "readFileSync", "closeSync"]) fs[name] = saved[name];
      cp.execFileSync = saved.execFileSync; syncBuiltinESMExports();
    }
    // Successful later reads do not erase the failed observation or its latch.
    frozen.check({ force: true }); assert(controller.signal.aborted); assert.equal(frozen.snapshot().first_fault.disposition, "observer_failure");
  }
  assert.deepEqual(boundedObservationDiagnostic({ operation: sentinel, code: sentinel, message: sentinel }), { contract: "augnes.input-observation-diagnostic.v1", operation: "unknown", code: "unknown" });
  console.log(JSON.stringify({ schema: "augnes.observer-diagnostic-controls.v1", historical_cause: "UNKNOWN", rows }, null, 2));
} finally {
  if (lastResult) settleCanonicalTestResourceUse(owner, lastResult);
  const [cleanup] = cleanupCanonicalTestResources([owner]); assert(cleanup.completed, JSON.stringify(cleanup));
}
