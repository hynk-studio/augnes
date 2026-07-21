#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalChildFailure,
  runCanonicalChild,
  runCanonicalChildGroups,
} from "./canonical-child-runner.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const fixture = path.join(
  repositoryRoot,
  "scripts",
  "fixtures",
  "canonical-child-runner-fixture.mjs",
);
const temporaryRoot = mkdtempSync(
  path.join(tmpdir(), "augnes-canonical-child-runner-"),
);
const repositoryDatabasePath = path.join(repositoryRoot, "data", "augnes.db");
const repositoryDatabaseBefore = snapshotFile(repositoryDatabasePath);
const privateSentinel = "canonical-runner-private-credential-sentinel";
const privatePathSentinel = "/private/canonical-runner/path-sentinel";
const observedPids = new Set();
const observedPorts = new Set();
const summaries = [];

try {
  const success = await runFixture("fast-success", {
    timeoutMs: 2_000,
  });
  assert.equal(success.exit_code, 0);
  assert.equal(success.signal, null);
  assert.equal(success.timed_out, false);
  assert(success.duration_ms >= 0);

  const inheritedStreamState = path.join(
    temporaryRoot,
    "exit-with-inherited-stream.json",
  );
  const inheritedStream = await runFixture("exit-with-inherited-stream", {
    statePath: inheritedStreamState,
    timeoutMs: 2_000,
  });
  assert.equal(inheritedStream.exit_code, 0);
  assert.equal(inheritedStream.timed_out, false);
  assert.equal(inheritedStream.exit_observed, true);
  assert.equal(inheritedStream.streams_closed, true);
  assert.equal(inheritedStream.cleanup_completed, true);
  assert.equal(inheritedStream.remaining_owned_processes, 0);
  assert.equal(
    inheritedStream.termination_reason,
    process.platform === "win32"
      ? "natural_exit"
      : "exited_with_owned_descendant_cleanup",
  );
  const inheritedStreamIdentity = JSON.parse(
    readFileSync(inheritedStreamState, "utf8"),
  );
  observedPids.add(inheritedStreamIdentity.child_pid);
  if (Number.isInteger(inheritedStreamIdentity.grandchild_pid)) {
    observedPids.add(inheritedStreamIdentity.grandchild_pid);
  }
  await assertProcessGone(inheritedStreamIdentity.child_pid);
  await assertProcessGone(inheritedStreamIdentity.grandchild_pid);

  const nonzero = await runFixture("nonzero", { timeoutMs: 2_000 });
  assert.equal(nonzero.exit_code, 7);
  assert.equal(nonzero.timed_out, false);
  const nonzeroFailure = canonicalChildFailure(nonzero, {
    suite: "runner-regression",
    timeoutMs: 2_000,
  });
  assert.equal(nonzeroFailure.code, "canonical_child_failed");
  assert.match(nonzeroFailure.message, /suite=runner-regression/);
  assert.match(nonzeroFailure.message, /label=nonzero/);

  const directState = path.join(temporaryRoot, "direct-signal.txt");
  const direct = await runFixture("hang", {
    statePath: directState,
    timeoutMs: 400,
  });
  assert.equal(direct.timed_out, true);
  assert.equal(readFileSync(directState, "utf8"), "sigterm_received\n");
  observedPids.add(direct.pid);
  await assertProcessGone(direct.pid);

  const treeState = path.join(temporaryRoot, "tree.json");
  const tree = await runFixture("tree", {
    statePath: treeState,
    timeoutMs: 1_000,
  });
  assert.equal(tree.timed_out, true);
  assert.equal(existsSync(treeState), true);
  const treeIdentity = JSON.parse(readFileSync(treeState, "utf8"));
  observedPids.add(treeIdentity.child_pid);
  observedPids.add(treeIdentity.grandchild_pid);
  observedPorts.add(treeIdentity.port);
  await assertProcessGone(treeIdentity.child_pid);
  await assertProcessGone(treeIdentity.grandchild_pid);
  assert.equal(await canConnect(treeIdentity.port), false);

  const resistant = await runFixture("term-resistant", {
    timeoutMs: 400,
    termGraceMs: 300,
    killGraceMs: 2_000,
  });
  assert.equal(resistant.timed_out, true);
  if (process.platform !== "win32") assert.equal(resistant.signal, "SIGKILL");
  observedPids.add(resistant.pid);
  await assertProcessGone(resistant.pid);

  const privateOutput = { stdout: "", stderr: "", logs: [] };
  const privateResult = await runFixture("private-output", {
    timeoutMs: 400,
    environment: {
      PRIVATE_FIXTURE_SENTINEL: privateSentinel,
      PRIVATE_FIXTURE_PATH: privatePathSentinel,
    },
    capture: privateOutput,
  });
  assert.equal(privateResult.timed_out, true);
  assert.equal(privateOutput.stdout.includes(privateSentinel), true);
  assert.equal(privateOutput.stderr.includes(privatePathSentinel), true);
  const privateFailure = canonicalChildFailure(privateResult, {
    suite: "runner-regression",
    timeoutMs: 400,
  });
  const publicDiagnostics = JSON.stringify({
    message: privateFailure.message,
    code: privateFailure.code,
    result: privateFailure.canonicalResult,
    logs: privateOutput.logs,
  });
  assert.equal(publicDiagnostics.includes(privateSentinel), false);
  assert.equal(publicDiagnostics.includes(privatePathSentinel), false);
  assert.equal(publicDiagnostics.includes("PRIVATE_FIXTURE"), false);

  const concurrentTreeState = path.join(temporaryRoot, "concurrent-tree.json");
  const concurrentLogs = [];
  let concurrentFailure;
  try {
    await runCanonicalChildGroups({
      suite: "runner-regression",
      maxConcurrency: 2,
      groups: [
        {
          id: "failure-lane",
          children: [
            groupFixture("concurrent-nonzero", "nonzero", 2_000),
            groupFixture("concurrent-after-failure", "fast-success", 2_000),
          ],
        },
        {
          id: "timeout-lane",
          children: [
            groupFixture(
              "concurrent-tree-timeout",
              "tree",
              1_000,
              concurrentTreeState,
            ),
            groupFixture("concurrent-after-timeout", "fast-success", 2_000),
          ],
        },
      ],
      log: (line) => concurrentLogs.push(line),
      runChild: (child) =>
        runCanonicalChild({
          ...child,
          heartbeatMs: 100,
          termGraceMs: 500,
          killGraceMs: 2_000,
          stdout: { write: () => {} },
          stderr: { write: () => {} },
          log: (line) => concurrentLogs.push(line),
        }),
    });
  } catch (error) {
    concurrentFailure = error;
  }
  assert.equal(concurrentFailure?.code, "canonical_concurrent_group_failed");
  assert.deepEqual(
    concurrentFailure.canonicalResults.map((result) => result.label),
    [
      "concurrent-nonzero",
      "concurrent-after-failure",
      "concurrent-tree-timeout",
      "concurrent-after-timeout",
    ],
  );
  assert.equal(
    concurrentFailure.canonicalIssues.some(
      (issue) => issue.code === "child_failed",
    ),
    true,
  );
  assert.equal(
    concurrentFailure.canonicalIssues.some(
      (issue) => issue.code === "child_timed_out",
    ),
    true,
  );
  assert.equal(
    concurrentLogs.some((line) => line.includes("group_start")),
    true,
  );
  assert.equal(
    concurrentLogs.some((line) => line.includes("child_active")),
    true,
  );
  assert.equal(
    concurrentLogs.some((line) => line.includes("group_result")),
    true,
  );
  const concurrentTreeIdentity = JSON.parse(
    readFileSync(concurrentTreeState, "utf8"),
  );
  observedPids.add(concurrentTreeIdentity.child_pid);
  observedPids.add(concurrentTreeIdentity.grandchild_pid);
  observedPorts.add(concurrentTreeIdentity.port);
  await assertProcessGone(concurrentTreeIdentity.child_pid);
  await assertProcessGone(concurrentTreeIdentity.grandchild_pid);
  assert.equal(await canConnect(concurrentTreeIdentity.port), false);

  await assert.rejects(
    () =>
      runCanonicalChildGroups({
        suite: "runner-regression",
        maxConcurrency: 1,
        groups: [
          {
            id: "incomplete-lane",
            children: [groupFixture("missing-result", "fast-success", 2_000)],
          },
        ],
        runChild: async () => undefined,
        log: () => {},
      }),
    (error) =>
      error?.code === "canonical_concurrent_group_failed" &&
      error.canonicalIssues.some(
        (issue) => issue.code === "child_result_missing",
      ),
  );
  await assert.rejects(
    () =>
      runCanonicalChildGroups({
        suite: "runner-regression",
        maxConcurrency: 1,
        groups: [
          {
            id: "conflict-lane",
            children: [groupFixture("expected-label", "fast-success", 2_000)],
          },
        ],
        runChild: async () => ({
          label: "conflicting-label",
          exit_code: 0,
          signal: null,
          timed_out: false,
          duration_ms: 1,
          spawn_error_code: null,
        }),
        log: () => {},
      }),
    (error) =>
      error?.code === "canonical_concurrent_group_failed" &&
      error.canonicalIssues.some(
        (issue) => issue.code === "child_result_conflicting_label",
      ),
  );
  await assert.rejects(
    () =>
      runCanonicalChildGroups({
        suite: "runner-regression",
        maxConcurrency: 2,
        groups: [
          {
            id: "duplicate-a",
            children: [groupFixture("duplicate-child", "fast-success", 2_000)],
          },
          {
            id: "duplicate-b",
            children: [groupFixture("duplicate-child", "fast-success", 2_000)],
          },
        ],
      }),
    /canonical concurrent child ownership is invalid/,
  );

  assert.deepEqual(snapshotFile(repositoryDatabasePath), repositoryDatabaseBefore);
  summaries.push(
    success,
    inheritedStream,
    nonzero,
    direct,
    tree,
    resistant,
    privateResult,
  );
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

assert.equal(existsSync(temporaryRoot), false);
for (const pid of observedPids) await assertProcessGone(pid);
for (const port of observedPorts) assert.equal(await canConnect(port), false);
assert.deepEqual(snapshotFile(repositoryDatabasePath), repositoryDatabaseBefore);

console.log(
  JSON.stringify(
    {
      test: "canonical-child-runner",
      status: "pass",
      fast_success: true,
      exited_child_inherited_stream_reaped_without_timeout: true,
      nonzero_failure_normalized: true,
      hanging_direct_child_terminated: true,
      hanging_process_tree_terminated: true,
      sigterm_escalation_verified: true,
      privacy_safe_diagnostics: true,
      concurrent_groups_bounded_and_deterministic: true,
      concurrent_failure_timeout_and_cleanup_fail_closed: true,
      concurrent_incomplete_conflicting_and_duplicate_results_refused: true,
      temporary_root_removed: true,
      repository_database_unchanged: true,
      owned_processes_after: 0,
      owned_ports_after: 0,
      results: summaries.map(({ pid: _pid, ...result }) => result),
    },
    null,
    2,
  ),
);

async function runFixture(
  mode,
  {
    statePath = path.join(temporaryRoot, `${mode}.state`),
    timeoutMs,
    termGraceMs = 500,
    killGraceMs = 2_000,
    environment = {},
    capture = { stdout: "", stderr: "", logs: [] },
  },
) {
  let pid = null;
  const result = await runCanonicalChild({
    suite: "runner-regression",
    label: mode,
    command: process.execPath,
    args: [fixture, mode, statePath],
    cwd: repositoryRoot,
    env: { ...process.env, ...environment },
    timeoutMs,
    heartbeatMs: 100,
    termGraceMs,
    killGraceMs,
    stdout: { write: (chunk) => (capture.stdout += chunk.toString()) },
    stderr: { write: (chunk) => (capture.stderr += chunk.toString()) },
    log: (line) => capture.logs.push(line),
    onSpawn: (childPid) => {
      pid = childPid;
    },
  });
  return { ...result, pid };
}

function groupFixture(label, mode, timeoutMs, statePath = path.join(
  temporaryRoot,
  `${label}.state`,
)) {
  return {
    suite: "runner-regression",
    label,
    command: process.execPath,
    args: [fixture, mode, statePath],
    cwd: repositoryRoot,
    env: process.env,
    timeoutMs,
  };
}

async function assertProcessGone(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return;
  const deadline = Date.now() + 3_000;
  while (Date.now() < deadline) {
    if (!isProcessAlive(pid)) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.equal(isProcessAlive(pid), false, "owned fixture process remained alive");
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === "EPERM";
  }
}

function canConnect(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    const finish = (value) => {
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(300, () => finish(false));
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
  });
}

function snapshotFile(filePath) {
  if (!existsSync(filePath)) return null;
  const stats = statSync(filePath, { bigint: true });
  return {
    size: stats.size.toString(),
    mtime_ns: stats.mtimeNs.toString(),
    sha256: createHash("sha256").update(readFileSync(filePath)).digest("hex"),
  };
}
