/** Private readiness contract for the observation-checkpoint process fixture. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { closeSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { registerOwnedChild, terminateOwnedProcessTree } from "./test-harness-process-lifecycle.mjs";

export const CHECKPOINT_STARTUP_TIMEOUT_MS = 10_000;
const fail = code => { throw Object.assign(new Error(code), { code }); };
const stagingPath = ready => `${ready}.publishing`;

export function publishCheckpointReady(ready, notification) {
  if (existsSync(ready)) fail("checkpoint_ready_already_exists");
  const staging = stagingPath(ready);
  let created = false;
  try {
    const descriptor = openSync(staging, "wx", 0o600); created = true;
    try { writeFileSync(descriptor, JSON.stringify(notification)); } finally { closeSync(descriptor); }
    // Same-directory rename publishes the closed, complete file in one step.
    renameSync(staging, ready);
  } finally { if (created) rmSync(staging, { force: true }); }
}

function readCheckpointReady(record, ready, nonce) {
  if (!existsSync(ready)) return undefined;
  const stat = lstatSync(ready);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1024) fail("checkpoint_ready_file_invalid");
  let state;
  try { state = JSON.parse(readFileSync(ready, "utf8")); }
  catch { fail("checkpoint_ready_malformed_json"); }
  if (!state || typeof state !== "object" || Array.isArray(state) ||
      Object.keys(state).sort().join(",") !== "nonce,origin,pid")
    fail("checkpoint_ready_notification_invalid");
  if (!Number.isInteger(record.pid) || state.pid !== record.pid) fail("checkpoint_ready_child_mismatch");
  if (state.nonce !== nonce) fail("checkpoint_ready_attempt_mismatch");
  if (typeof state.origin !== "string" || !/^http:\/\/127\.0\.0\.1:[1-9][0-9]{0,4}$/u.test(state.origin))
    fail("checkpoint_ready_origin_invalid");
  try { if (new URL(state.origin).origin !== state.origin) fail("checkpoint_ready_origin_invalid"); }
  catch { fail("checkpoint_ready_origin_invalid"); }
  return state;
}

function fileState(file) {
  try {
    const stat = lstatSync(file);
    return { kind: stat.isFile() ? "file" : "other", bytes: stat.size };
  } catch (error) { return { kind: error.code === "ENOENT" ? "missing" : "unavailable" }; }
}

export async function waitForCheckpointReady(record, { ready, nonce, timeoutMs = CHECKPOINT_STARTUP_TIMEOUT_MS }) {
  // Only regression controls shorten this bound; fixture startup always uses 10s.
  assert.ok(timeoutMs > 0 && timeoutMs <= CHECKPOINT_STARTUP_TIMEOUT_MS);
  let stderr = "";
  const capture = chunk => { stderr = (stderr + chunk).slice(-2000); };
  record.child.stderr?.on("data", capture);
  const until = performance.now() + timeoutMs;
  try {
    for (;;) {
      if (record.spawnErrorCode) fail("checkpoint_startup_spawn_failed");
      if (record.exited || record.closed) fail("checkpoint_startup_exited");
      if (performance.now() >= until) fail("checkpoint_startup_timeout");
      const state = readCheckpointReady(record, ready, nonce);
      if (state) return state;
      await delay(Math.min(25, Math.max(1, until - performance.now())));
    }
  } catch (error) {
    let cleanupError;
    try { await terminateOwnedProcessTree(record); } catch (failure) { cleanupError = failure; }
    const diagnostic = {
      reason: error.code ?? "checkpoint_startup_read_failed", pid: record.pid,
      publication: fileState(ready), staging: fileState(stagingPath(ready)),
      spawn_error: record.spawnErrorCode, exit: record.exitResult,
      closed: record.closed, cleanup_complete: !cleanupError && record.closed, stderr,
    };
    throw Object.assign(new Error(`checkpoint_startup_failed ${JSON.stringify(diagnostic)}`, {
      cause: cleanupError ? new AggregateError([error, cleanupError], "checkpoint_startup_and_cleanup_failed") : error,
    }), { code: diagnostic.reason, diagnostic });
  } finally { record.child.stderr?.off("data", capture); }
}

// Deterministic controls run inside the existing --observation-checkpoint owner.
export async function checkpointReadinessContract(parent) {
  const dir = path.join(parent, "checkpoint-readiness-controls"), owned = new Set(), results = [];
  let stagedWait;
  mkdirSync(dir);
  function launch(mode, command = process.execPath) {
    const ready = path.join(dir, `${mode}.json`), nonce = randomUUID();
    const record = registerOwnedChild(owned, spawn(command,
      [fileURLToPath(import.meta.url), "--control", JSON.stringify({ mode, ready, nonce })],
      { detached: true, stdio: ["ignore", "ignore", "pipe", "ipc"] }), { label: `checkpoint-readiness-${mode}` });
    return { ready, nonce, record };
  }
  try {
    const staged = launch("staged");
    const barrier = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("checkpoint_control_barrier_timeout")), CHECKPOINT_STARTUP_TIMEOUT_MS);
      staged.record.child.once("message", message => { clearTimeout(timer); resolve(message); });
      staged.record.child.once("close", () => { clearTimeout(timer); reject(new Error("checkpoint_control_exited_before_barrier")); });
    });
    const waiting = stagedWait = waitForCheckpointReady(staged.record, staged);
    // Both outcomes are observed even if a control fails before reaching its gate.
    const observation = Promise.all([barrier, waiting]);
    observation.catch(() => {});
    assert.equal(await barrier, "staging-incomplete");
    assert.equal(existsSync(staged.ready), false);
    assert.equal(readFileSync(stagingPath(staged.ready), "utf8"), "{");
    assert.equal(readCheckpointReady(staged.record, staged.ready, staged.nonce), undefined);
    staged.record.child.send("complete");
    const [, state] = await observation;
    assert.deepEqual(state, { origin: "http://127.0.0.1:12345", pid: staged.record.pid, nonce: staged.nonce });
    assert.equal(existsSync(stagingPath(staged.ready)), false);
    await terminateOwnedProcessTree(staged.record);
    results.push("incomplete_staging_not_consumed_then_complete");

    const complete = launch("complete");
    assert.deepEqual(await waitForCheckpointReady(complete.record, complete),
      { origin: "http://127.0.0.1:12345", pid: complete.record.pid, nonce: complete.nonce });
    assert.equal(existsSync(stagingPath(complete.ready)), false);
    await terminateOwnedProcessTree(complete.record);
    results.push("complete_atomic_publication");

    for (const [mode, reason] of [
      ["malformed", "checkpoint_ready_malformed_json"],
      ["wrong-pid", "checkpoint_ready_child_mismatch"],
      ["wrong-nonce", "checkpoint_ready_attempt_mismatch"],
      ["wrong-origin", "checkpoint_ready_origin_invalid"],
      ["interrupted", "checkpoint_startup_exited"],
      ["early-exit", "checkpoint_startup_exited"],
      ["timeout", "checkpoint_startup_timeout"],
      ["spawn-failure", "checkpoint_startup_spawn_failed"],
    ]) {
      const control = launch(mode, mode === "spawn-failure" ? path.join(dir, "missing-node") : process.execPath);
      if (mode === "timeout") writeFileSync(stagingPath(control.ready), "{", { flag: "wx" });
      await assert.rejects(waitForCheckpointReady(control.record, { ...control, ...(mode === "timeout" ? { timeoutMs: 100 } : {}) }), error => {
        assert.equal(error.code, reason); assert.equal(error.diagnostic.cleanup_complete, true);
        assert.equal(error.diagnostic.closed, true);
        if (["malformed", "interrupted", "early-exit"].includes(mode)) assert.match(error.diagnostic.stderr, new RegExp(`controlled_${mode}`));
        if (mode === "malformed") {
          assert.equal(error.diagnostic.publication.bytes, 1);
          assert.equal(readFileSync(control.ready, "utf8"), "{", "Malformed completed publication is never retried or repaired");
        }
        if (mode === "interrupted") {
          assert.equal(error.diagnostic.publication.kind, "missing"); assert.equal(error.diagnostic.staging.bytes, 1);
          assert.deepEqual(control.record.exitResult, { code: 1, signal: null });
        }
        if (mode === "early-exit") assert.deepEqual(control.record.exitResult, { code: 1, signal: null });
        if (mode === "spawn-failure") assert.equal(error.diagnostic.spawn_error, "ENOENT");
        if (mode === "timeout") assert.equal(error.diagnostic.staging.bytes, 1);
        return true;
      });
      results.push(mode);
      assert.equal(owned.size, 0);
    }
    const collision = path.join(dir, "collision.json"); writeFileSync(collision, "retained");
    assert.throws(() => publishCheckpointReady(collision, {}), { code: "checkpoint_ready_already_exists" });
    assert.equal(readFileSync(collision, "utf8"), "retained");
    assert.equal(existsSync(stagingPath(collision)), false); results.push("existing_publication_refused");
    const unfinished = path.join(dir, "unfinished.json"); writeFileSync(stagingPath(unfinished), "retained-staging");
    assert.throws(() => publishCheckpointReady(unfinished, {}), { code: "EEXIST" });
    assert.equal(readFileSync(stagingPath(unfinished), "utf8"), "retained-staging");
    assert.equal(existsSync(unfinished), false); results.push("existing_staging_retained");
    const failed = path.join(dir, "failed.json"), circular = {}; circular.self = circular;
    assert.throws(() => publishCheckpointReady(failed, circular), TypeError);
    assert.equal(existsSync(failed), false); assert.equal(existsSync(stagingPath(failed)), false);
    results.push("failed_publication_removes_only_owned_staging");
  } finally {
    for (const record of owned) await terminateOwnedProcessTree(record);
    await Promise.allSettled(stagedWait ? [stagedWait] : []);
    assert.equal(owned.size, 0); rmSync(dir, { recursive: true, force: true }); assert.equal(existsSync(dir), false);
  }
  console.log(JSON.stringify({ checkpoint_readiness_contract: results, startup_bound_ms: CHECKPOINT_STARTUP_TIMEOUT_MS, owned_processes: 0, files_removed: true }));
}

if (process.argv[2] === "--control") {
  const { mode, ready, nonce } = JSON.parse(process.argv[3]);
  const notification = { origin: "http://127.0.0.1:12345", pid: process.pid, nonce };
  process.on("message", message => {
    if (mode === "staged" && message === "complete") {
      writeFileSync(stagingPath(ready), JSON.stringify(notification)); renameSync(stagingPath(ready), ready);
    }
  });
  if (mode === "staged") {
    writeFileSync(stagingPath(ready), "{", { flag: "wx" }); process.send("staging-incomplete");
  } else if (mode === "interrupted" || mode === "early-exit") {
    if (mode === "interrupted") writeFileSync(stagingPath(ready), "{", { flag: "wx" });
    console.error(`controlled_${mode}`); process.exitCode = 1; process.disconnect();
  } else if (mode === "malformed") {
    console.error("controlled_malformed"); writeFileSync(ready, "{", { flag: "wx" });
  } else if (mode !== "timeout") {
    publishCheckpointReady(ready, { ...notification,
      ...(mode === "wrong-pid" ? { pid: process.pid + 1 } : {}),
      ...(mode === "wrong-nonce" ? { nonce: "another-attempt" } : {}),
      ...(mode === "wrong-origin" ? { origin: "https://example.invalid" } : {}),
    });
  }
}
