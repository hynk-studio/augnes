#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  existsSync,
  chmodSync,
  lstatSync,
  mkdirSync,
  renameSync,
  symlinkSync,
  writeFileSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "./test-canonical-child-groups.mjs";

import {
  assertCanonicalConcurrentChildLabelsV01,
  canonicalChildAcceptanceFailure,
  canonicalChildFailure,
  normalizeCanonicalConcurrentChildLabelV01,
  runCanonicalChild,
  runCanonicalChildGroups,
} from "./canonical-child-runner.mjs";

import {
  buildCanonicalChildEnvironment, createCanonicalTestResourceRoot,
  beginCanonicalTestResourceUse, cleanupCanonicalTestResources,
} from "./canonical-test-environment.mjs";

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
const groupResourceOwners = [];

try {
  await assertParentResourceCleanup();
  const maximumSafeLabel = "a".repeat(160);
  assert.equal(
    normalizeCanonicalConcurrentChildLabelV01(maximumSafeLabel),
    maximumSafeLabel,
  );
  assert.equal(
    normalizeCanonicalConcurrentChildLabelV01("ordinary existing label"),
    "ordinary existing label",
  );
  assert.throws(
    () => normalizeCanonicalConcurrentChildLabelV01(""),
    /canonical concurrent child ownership is invalid/,
  );
  for (const overlongLabel of ["a".repeat(161), "a".repeat(162)]) {
    assert.throws(
      () => normalizeCanonicalConcurrentChildLabelV01(overlongLabel),
      /canonical concurrent child ownership is invalid/,
    );
  }
  assert.throws(
    () => normalizeCanonicalConcurrentChildLabelV01("unsafe[label]"),
    /canonical concurrent child ownership is invalid/,
  );
  assert.throws(
    () =>
      assertCanonicalConcurrentChildLabelsV01([
        "duplicate safe label",
        "duplicate safe label",
      ]),
    /canonical concurrent child ownership is invalid/,
  );

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

  const naturalResult = {
    label: "natural-exit-contract",
    exit_code: 0,
    signal: null,
    timed_out: false,
    duration_ms: 1,
    spawn_error_code: null,
    exit_observed: true,
    streams_closed: true,
    cleanup_completed: true,
    remaining_owned_processes: 0,
    termination_reason: "natural_exit",
  };
  assert.equal(
    canonicalChildAcceptanceFailure(naturalResult, {
      suite: "project-experience-contract",
      timeoutMs: 360_000,
      requireNaturalExit: true,
    }),
    null,
  );
  for (const [label, override, expectedCode, expectedIssue] of [
    [
      "exited-with-descendant-cleanup",
      { termination_reason: "exited_with_owned_descendant_cleanup" },
      "canonical_child_natural_exit_required",
      "termination_not_natural",
    ],
    [
      "closed-with-descendant-cleanup",
      { termination_reason: "closed_with_owned_descendant_cleanup" },
      "canonical_child_natural_exit_required",
      "termination_not_natural",
    ],
    [
      "exit-not-observed",
      { exit_observed: false },
      "canonical_child_natural_exit_required",
      "exit_not_observed",
    ],
    [
      "stream-closure-false",
      { streams_closed: false },
      "canonical_child_natural_exit_required",
      "streams_not_closed",
    ],
    [
      "cleanup-incomplete",
      { cleanup_completed: false },
      "canonical_child_natural_exit_required",
      "cleanup_incomplete",
    ],
    [
      "owned-process-residue",
      { remaining_owned_processes: 1 },
      "canonical_child_natural_exit_required",
      "owned_process_residue",
    ],
    [
      "timeout",
      { timed_out: true, termination_reason: "bounded_timeout" },
      "canonical_child_timeout",
      null,
    ],
    [
      "nonzero-exit",
      { exit_code: 7 },
      "canonical_child_failed",
      null,
    ],
  ]) {
    const failure = canonicalChildAcceptanceFailure(
      { ...naturalResult, label, ...override },
      {
        suite: "project-experience-contract",
        timeoutMs: 360_000,
        requireNaturalExit: true,
      },
    );
    assert.equal(failure?.code, expectedCode, label);
    if (expectedIssue) {
      assert.equal(failure.canonicalResult.issue, expectedIssue, label);
    }
  }

  const directState = path.join(temporaryRoot, "direct-signal.txt");
  const direct = await runFixture("hang", {
    statePath: directState,
    timeoutMs: 400,
  });
  assert.equal(direct.timed_out, true);
  if (process.platform === "win32") {
    assert.equal(existsSync(directState), false);
  } else {
    assert.equal(readFileSync(directState, "utf8"), "sigterm_received\n");
  }
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
      "concurrent-tree-timeout",
    ],
  );
  assert.equal(concurrentFailure.canonicalInventory.selected_count, 4);
  assert.equal(concurrentFailure.canonicalInventory.started_count, 2);
  assert.equal(concurrentFailure.canonicalInventory.completed_count, 2);
  assert.equal(concurrentFailure.canonicalInventory.failed_count, 2);
  assert.deepEqual(concurrentFailure.canonicalInventory.children
    .filter((entry) => !entry.started).map((entry) => entry.label),
  ["concurrent-after-failure", "concurrent-after-timeout"]);
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
  const groupCleanup = cleanupCanonicalTestResources(groupResourceOwners);
  rmSync(temporaryRoot, { recursive: true, force: true });
  assert(groupCleanup.every((result) => result.completed),
    "both started and unstarted child resource roots must be removed");
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
      sigterm_escalation_verified: process.platform !== "win32",
      windows_forced_tree_termination_verified: process.platform === "win32",
      privacy_safe_diagnostics: true,
      concurrent_label_160_characters_accepted: true,
      concurrent_label_161_and_162_characters_refused: true,
      concurrent_empty_unsafe_and_duplicate_labels_refused: true,
      concurrent_groups_bounded_and_deterministic: true,
      concurrent_failure_timeout_and_cleanup_fail_closed: true,
      concurrent_incomplete_conflicting_and_duplicate_results_refused: true,
      owner_specific_natural_exit_acceptance_refusal_matrix: true,
      parent_owned_interrupted_snapshot_cleanup: true,
      replaced_root_and_unsettled_cleanup_refused: true,
      symlink_targets_untouched_and_independent_cleanup_continues: true,
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
  const resourceOwner = createCanonicalTestResourceRoot("ag-resource-test-");
  groupResourceOwners.push(resourceOwner);
  writeFileSync(path.join(resourceOwner.root, "prepared-resource"), "owned fixture");
  return {
    suite: "runner-regression",
    label,
    command: process.execPath,
    args: [fixture, mode, statePath],
    cwd: repositoryRoot,
    env: process.env,
    timeoutMs,
    resourceOwner,
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


async function assertParentResourceCleanup() {
  const resources = [];
  const create = () => { const owner = createCanonicalTestResourceRoot("ag-resource-test-"); resources.push(owner); return owner; };
  let failure;
  try {
  // Reproduce the nested readonly-removal failure in a disposable tree. It is
  // platform-dependent; the parent result below must be absence, not an error label.
  const readonly = create();
  const snapshot = path.join(readonly.root, "snapshot");
  mkdirSync(snapshot); writeFileSync(path.join(snapshot, "input.txt"), "synthetic"); chmodSync(snapshot, 0o500);
  let plainRemoval = "removed";
  try { rmSync(readonly.root, { recursive: true, force: true }); } catch (error) { plainRemoval = error.code; }
  const readonlyResult = cleanupCanonicalTestResources([readonly]);
  assert(readonlyResult[0].completed); assert.equal(existsSync(readonly.root), false);
  console.log(JSON.stringify({ readonly_plain_rm: plainRemoval, parent_cleanup: readonlyResult }));

  for (const point of ["snapshot", "host"]) {
    const owner = create();
    for (const sub of ["home/AppData/Local", "home/AppData/Roaming", "runtime-state"])
      mkdirSync(path.join(owner.root, sub), { recursive: true, mode: 0o700 });
    let output = ""; let errors = ""; let childPid;
    const result = await runCanonicalChild({
      suite: "runner-regression", label: `interrupted scoped ${point}`,
      command: process.execPath,
      args: ["--import", "tsx", "scripts/test-vnext-project-work-initialization.ts", `--interrupt-scoped-after-${point}`],
      cwd: repositoryRoot,
      env: buildCanonicalChildEnvironment({ temporaryRoot: owner.root, resourceRoot: owner.root }),
      resourceOwner: owner, timeoutMs: 5_000, heartbeatMs: 0, termGraceMs: 250, killGraceMs: 2_000,
      stdout: { write: chunk => { output += chunk.toString(); assert(output.length < 32_768); } },
      stderr: { write: chunk => { errors += chunk.toString(); assert(errors.length < 32_768); } },
      onSpawn: pid => { childPid = pid; },
    });
    const marker = output.split("\n").filter(line => line.startsWith("{")).map(line => JSON.parse(line))
      .find(row => row.scoped_interruption === point);
    assert(marker, `interruption must occur after actual ${point} preparation: ${errors}`);
    assert.equal(path.dirname(marker.snapshot_root), owner.root);
    assert.equal(lstatSync(marker.snapshot_root).isSymbolicLink(), false);
    assert.equal(result.timed_out, true); assert.notEqual(result.exit_code, 0);
    assert.equal(result.cleanup_completed, true); assert.equal(result.remaining_owned_processes, 0);
    assert(canonicalChildAcceptanceFailure(result, { suite: "runner-regression", timeoutMs: 5_000 }),
      "expected interruption must remain a failed execution result");
    await assertProcessGone(childPid);
    if (point === "host") { assert(marker.fake_host_pid); await assertProcessGone(marker.fake_host_pid); }
    const cleanup = cleanupCanonicalTestResources([owner]);
    assert(cleanup[0].completed); assert.equal(existsSync(owner.root), false);
    assert.equal(existsSync(marker.snapshot_root), false);
    console.log(JSON.stringify({ expected_interruption: point, timed_out: result.timed_out, resource_cleanup: cleanup }));
  }

  const outside = path.join(temporaryRoot, "resource-outside"); mkdirSync(outside);
  writeFileSync(path.join(outside, "sentinel.txt"), "outside sentinel");
  const linked = create(); symlinkSync(outside, path.join(linked.root, "outside"), "dir");
  assert(cleanupCanonicalTestResources([linked])[0].completed);
  assert.equal(readFileSync(path.join(outside, "sentinel.txt"), "utf8"), "outside sentinel");

  const replaced = create(); const original = replaced.root + "-original";
  renameSync(replaced.root, original); symlinkSync(outside, replaced.root, "dir");
  const independent = create();
  try {
    const combined = cleanupCanonicalTestResources([replaced, independent]);
    assert.equal(combined[0].completed, false); assert(combined[0].failures.includes("resource_root_changed"));
    assert.equal(combined[1].completed, true); assert.equal(existsSync(independent.root), false);
    assert.equal(readFileSync(path.join(outside, "sentinel.txt"), "utf8"), "outside sentinel");
  } finally { rmSync(replaced.root); renameSync(original, replaced.root); }
  // Restoring this test's original physical directory permits ordinary cleanup.
  assert(cleanupCanonicalTestResources([replaced])[0].completed);

  const replacedDirectory = create(); const heldOriginal = replacedDirectory.root + "-original";
  renameSync(replacedDirectory.root, heldOriginal); mkdirSync(replacedDirectory.root);
  try {
    assert.equal(cleanupCanonicalTestResources([replacedDirectory])[0].completed, false);
  } finally { rmSync(replacedDirectory.root, { recursive: true }); renameSync(heldOriginal, replacedDirectory.root); }
  assert(cleanupCanonicalTestResources([replacedDirectory])[0].completed);

  const active = create(); beginCanonicalTestResourceUse(active);
  try {
    assert.deepEqual(cleanupCanonicalTestResources([active])[0].failures, ["resource_consumers_unsettled"]);
  } finally {
    // No child was actually started in this synthetic refusal; remove only the
    // empty directory this test just created, without inventing a settled result.
    rmSync(active.root, { recursive: true });
  }
  const missing = create(); rmSync(missing.root, { recursive: true });
  assert.throws(() => beginCanonicalTestResourceUse(missing), /resource_root_missing/);
  assert.equal(cleanupCanonicalTestResources([{ root: outside }])[0].completed, false);
  assert.equal(readFileSync(path.join(outside, "sentinel.txt"), "utf8"), "outside sentinel");
  for (const owner of resources) assert.equal(existsSync(owner.root), false);
  } catch (error) { failure = error; }
  finally {
    const pending = resources.filter(owner => lstatSync(owner.root, { throwIfNoEntry: false }));
    const cleanup = cleanupCanonicalTestResources(pending);
    const failures = cleanup.filter(result => !result.completed)
      .map(result => new Error(`resource regression cleanup refused: ${result.root}: ${result.failures.join(",")}`));
    if (failure) failures.unshift(failure);
    if (failures.length) throw new AggregateError(failures, "resource regression or cleanup failed");
  }
}
