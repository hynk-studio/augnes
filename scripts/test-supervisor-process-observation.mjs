#!/usr/bin/env node

import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  compareSupervisorObservations,
  observeSupervisorProcesses,
  withSupervisorProcessPreservation,
} from "./supervisor-process-observation.mjs";

const supervisorScript = "/fixture/repository/scripts/augnes-runtime-supervisor.mjs";
const empty = { status: 0, stdout: "" };
const commandFailure = { status: 1, stdout: "", stderr: "private fixture diagnostic" };
const rows = (...pids) => ({
  status: 0,
  stdout: pids.map((pid) => ` ${pid} /fixture/node ${supervisorScript} start`).join("\n"),
});
const options = (runCommand, platform = "darwin") => ({
  supervisorScript,
  ownPid: 999,
  platform,
  runCommand,
});
const observe = (result, platform = "darwin") => observeSupervisorProcesses(options(() => result, platform));
const comparison = (before, after) => compareSupervisorObservations(observe(before), observe(after));

for (const platform of ["darwin", "linux"]) {
  let calls = 0;
  assert.deepEqual(observeSupervisorProcesses(options((command, args, settings) => {
    calls += 1;
    assert.equal(command, "ps");
    assert.deepEqual(args, ["-axo", "pid=,command="]);
    assert.deepEqual(settings, { encoding: "utf8", timeout: 2_000 });
    return empty;
  }, platform)), { status: "observed", reason: null, pids: [] });
  assert.equal(calls, 1, "observation never retries");
}
assert.deepEqual(observe({ status: 0, stdout: " \n\r\n" }).pids, []);
assert.deepEqual(observe({
  status: 0,
  stdout: `${rows(42, 7, 999).stdout}\n 0 kernel_task\n 81 /fixture/unrelated-command\n`,
}).pids, [7, 42], "retain sorted exact matching identities and exclude self/unrelated rows");

for (const [result, reason] of [
  [commandFailure, "command_nonzero_exit"],
  [{ status: null, error: { code: "ETIMEDOUT" }, stdout: "" }, "command_timeout"],
  [{ status: null, error: { code: "ENOENT" }, stdout: "" }, "command_spawn_failed"],
  [{ status: null, signal: "SIGTERM", stdout: "" }, "command_signalled"],
  [{ status: null, stdout: "" }, "command_status_unavailable"],
  [undefined, "command_status_unavailable"],
  [{ status: 0, stdout: null }, "command_output_unusable"],
  [{ status: 0, stdout: "\0" }, "command_output_unusable"],
  [{ status: 0, stdout: "not a process row" }, "command_output_malformed"],
  [{ status: 0, stdout: " 41 " }, "command_output_malformed"],
  [{ status: 0, stdout: " -1 command" }, "command_output_malformed"],
  [{ status: 0, stdout: " 9007199254740992 command" }, "command_output_malformed"],
  [rows(7, 7), "command_output_malformed"],
  [rows(0), "command_output_malformed"],
  [{ status: 0, stdout: `${rows(7).stdout}\nmalformed unrelated row` }, "command_output_malformed"],
]) {
  const actual = observe(result);
  assert.deepEqual(actual, { status: "observation_failed", reason, pids: null });
  assert.notDeepEqual(actual, observe(empty), "failed observation is never observed empty");
  assert.equal(compareSupervisorObservations(actual, actual).status, "observation_failed");
  assert.equal(compareSupervisorObservations(actual, observe(empty)).status, "observation_failed");
  assert.equal(compareSupervisorObservations(observe(empty), actual).status, "observation_failed");
  assert.equal(JSON.stringify(actual).includes("private fixture diagnostic"), false);
}
for (const [code, reason] of [["ETIMEDOUT", "command_timeout"], ["EACCES", "command_spawn_failed"]]) {
  assert.equal(observeSupervisorProcesses(options(() => {
    throw Object.assign(new Error("private command or path"), { code });
  })).reason, reason);
}

assert.equal(comparison(empty, empty).status, "preserved");
assert.equal(comparison(rows(42, 7), rows(7, 42)).status, "preserved");
for (const [before, after, added, missing] of [
  [rows(7), rows(7, 42), 1, 0],
  [rows(7, 42), rows(7), 0, 1],
  [rows(7), rows(42), 1, 1],
]) {
  const actual = comparison(before, after);
  assert.equal(actual.status, "changed", "equal counts cannot substitute for equal identities");
  assert.equal(actual.added_count, added);
  assert.equal(actual.missing_count, missing);
  assert.equal(actual.reason, "supervisor_identities_changed");
  assert.equal(JSON.stringify(actual).includes(supervisorScript), false);
}
const windows = observeSupervisorProcesses(options(() => assert.fail("Windows must not call ps"), "win32"));
assert.deepEqual(windows, { status: "not_applicable", reason: "windows_ps_not_applicable", pids: null });
assert.equal(compareSupervisorObservations(windows, windows).status, "not_applicable");
assert.equal(compareSupervisorObservations(windows, windows).before.count, null);
assert.equal(compareSupervisorObservations(windows, observe(empty)).status, "observation_failed");

async function exercise({ before = empty, after = empty, runError, cleanupError, platform = "darwin" } = {}) {
  // The temporary resource exists before baseline observation, as in the suite.
  const root = mkdtempSync(path.join(tmpdir(), "augnes-supervisor-observation-"));
  const sentinel = path.join(root, "owned-temporary-resource");
  writeFileSync(sentinel, "fixture");
  const events = [];
  const responses = [before, after];
  let result;
  let error;
  try {
    result = await withSupervisorProcessPreservation({
      observationOptions: options(() => {
        events.push(responses.length === 2 ? "baseline" : "final");
        if (responses.length === 1) assert.equal(existsSync(root), false, "cleanup precedes final observation");
        assert(responses.length > 0, "no observation retries");
        return responses.shift();
      }, platform),
      run: async () => {
        events.push("run");
        assert(existsSync(sentinel));
        if (runError) throw runError;
        return "functional assertions completed";
      },
      cleanup: async () => {
        events.push("cleanup");
        rmSync(root, { recursive: true, force: true });
        if (cleanupError) throw cleanupError;
      },
    });
  } catch (caught) {
    error = caught;
  } finally {
    const residue = existsSync(root);
    rmSync(root, { recursive: true, force: true });
    assert.equal(residue, false, "wrapper must clean resources after any observation disposition");
  }
  return { result, error, events };
}

const success = await exercise();
assert.equal(success.error, undefined);
assert.equal(success.result.preservation.status, "preserved");
assert.deepEqual(success.events, ["baseline", "run", "cleanup", "final"]);
for (const [before, after, events] of [
  [commandFailure, empty, ["baseline", "cleanup", "final"]],
  [empty, commandFailure, ["baseline", "run", "cleanup", "final"]],
  [commandFailure, commandFailure, ["baseline", "cleanup", "final"]],
]) {
  const actual = await exercise({ before, after });
  assert.equal(actual.result, undefined, "no passing suite result escapes a failed observation");
  assert.equal(actual.error.code, "ambient_supervisor_observation_failed");
  assert.deepEqual(actual.events, events);
}
const changed = await exercise({ before: rows(7), after: rows(42) });
assert.equal(changed.error.code, "ambient_supervisor_identities_changed");
assert.equal(changed.result, undefined);
const original = new Error("original functional failure (including owned leak/sentinel assertions)");
const cleanupFailure = new Error("original cleanup failure");
assert.equal((await exercise({ runError: original })).error, original);
const combined = await exercise({ runError: original, cleanupError: cleanupFailure, after: commandFailure });
assert(combined.error instanceof AggregateError);
assert.equal(combined.result, undefined);
assert.equal(combined.error.errors[0], original, "preserve the earlier functional failure unchanged");
assert.equal(combined.error.errors[1], cleanupFailure);
assert.equal(combined.error.errors[2].code, "ambient_supervisor_observation_failed");
assert.deepEqual(combined.events, ["baseline", "run", "cleanup", "final"]);
const windowsRun = await exercise({ platform: "win32" });
assert.equal(windowsRun.error, undefined);
assert.deepEqual(windowsRun.events, ["run", "cleanup"], "non-applicability does not skip mandatory functional/cleanup checks");
assert.equal(windowsRun.result.preservation.status, "not_applicable");

const owner = readFileSync(new URL("./test-runtime-operability.mjs", import.meta.url), "utf8");
assert.match(owner, /import \{ withSupervisorProcessPreservation \} from "\.\/supervisor-process-observation\.mjs"/);
assert.match(owner, /await withSupervisorProcessPreservation\(\{/);
assert.doesNotMatch(owner, /function listSupervisorProcessIds/);
assert.match(owner, /owned process \$\{pid\} must not remain after tests/);
assert.match(owner, /unrelated PID sentinel must remain alive/);
assert.match(owner, /the repository database and side files must remain byte\/stat identical/);
assert.match(owner, /cleanupOwnedProcesses\(ownedProcesses, \{ termGraceMs: 12_000 \}\)/);

console.log(JSON.stringify({
  test: "supervisor-process-observation",
  status: "pass",
  controlled_command_only: true,
  observation_failure_distinct_from_empty: true,
  exact_identity_preservation: true,
  cleanup_and_original_failure_preserved: true,
  windows_ps_not_applicable: true,
  owned_temporary_resources_after: 0,
}));
