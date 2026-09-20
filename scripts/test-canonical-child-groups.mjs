#!/usr/bin/env node

import assert from "node:assert/strict";
import { runCanonicalChildGroups } from "./canonical-child-runner.mjs";

const success = (label, overrides = {}) => ({
  label, exit_code: 0, signal: null, timed_out: false, duration_ms: 1,
  spawn_error_code: null, exit_observed: true, streams_closed: true,
  cleanup_started: true, cleanup_completed: true, remaining_owned_processes: 0,
  termination_reason: "natural_exit", ...overrides,
});
const deferred = () => Promise.withResolvers();
const groups = [
  { id: "first", children: [{ label: "failure" }, { label: "same-group-later" }] },
  { id: "second", children: [{ label: "in-flight" }, { label: "other-group-later" }] },
  { id: "queued", children: [{ label: "queued-child" }] },
];
const inFlightStarted = deferred();
const releaseInFlight = deferred();
const failureObserved = deferred();
const started = [];
const completed = [];
let observedFailure = false;
let startsAfterFailure = 0;
let returned = false;
const execution = runCanonicalChildGroups({
  suite: "group-contract", groups, maxConcurrency: 2,
  log: (line) => {
    // A group result follows the helper's observation of its first child's
    // result. This barrier works on both the old and corrected scheduler.
    if (line.includes("group_result group=first")) failureObserved.resolve();
  },
  runChild: async ({ label }) => {
    started.push(label);
    if (observedFailure) startsAfterFailure += 1;
    if (label === "failure") {
      await inFlightStarted.promise;
      observedFailure = true;
      completed.push(label);
      return success(label, { exit_code: 7 });
    }
    if (label === "in-flight") {
      inFlightStarted.resolve();
      await releaseInFlight.promise;
    }
    completed.push(label);
    return success(label);
  },
}).then(
  () => { returned = true; return null; },
  (error) => { returned = true; return error; },
);
await failureObserved.promise;
const waitedForInFlight = !returned;
releaseInFlight.resolve();
const error = await execution;
console.log(JSON.stringify({
  test: "canonical-child-groups-admission-comparison", deciding: false,
  selected: groups.flatMap((group) => group.children).length,
  started: started.length, completed: completed.length,
  unstarted: 5 - started.length,
  additional_starts_after_first_failure: startsAfterFailure,
  in_flight_settled: completed.includes("in-flight"),
}));
assert.equal(waitedForInFlight, true);
assert.equal(error?.code, "canonical_concurrent_group_failed");
assert.deepEqual(started, ["failure", "in-flight"],
  "no same-group, other-group or queued child may start after observed failure");
assert.equal(startsAfterFailure, 0);
assert.deepEqual(completed, ["failure", "in-flight"]);
assert.deepEqual(error.canonicalInventory, {
  selected_count: 5, started_count: 2, settled_count: 2,
  completed_count: 2, failed_count: 1, unstarted_count: 3,
  children: [
    { group: "first", label: "failure", started: true, settled: true, completed: true, outcome: "failed" },
    { group: "first", label: "same-group-later", started: false, settled: false, completed: false, outcome: "not_started_after_failure" },
    { group: "second", label: "in-flight", started: true, settled: true, completed: true, outcome: "passed" },
    { group: "second", label: "other-group-later", started: false, settled: false, completed: false, outcome: "not_started_after_failure" },
    { group: "queued", label: "queued-child", started: false, settled: false, completed: false, outcome: "not_started_after_failure" },
  ],
});
assert.deepEqual(error.canonicalResults.map((result) => result.label), ["failure", "in-flight"]);

await assertCompleteSuccess();
await assertFailureMatrix();
await assertSecondaryFailures();
console.log(JSON.stringify({ test: "canonical-child-groups", status: "pass",
  complete_success_order_uniqueness_and_concurrency: true,
  same_other_and_queued_admission_stopped: true,
  in_flight_settlement_and_secondary_errors_preserved: true,
  malformed_and_incomplete_cleanup_refused: true,
  selected_started_settled_completed_failed_unstarted_distinguished: true,
}));

async function assertCompleteSuccess() {
  const labels = ["a1", "a2", "b1", "b2", "c1"];
  const gates = new Map(labels.map((label) => [label, deferred()]));
  const admissions = new Map(labels.map((label) => [label, deferred()]));
  const starts = [];
  const logs = [];
  let active = 0;
  let maximum = 0;
  const task = runCanonicalChildGroups({
    suite: "success-contract", maxConcurrency: 2,
    groups: [
      { id: "a", children: [{ label: "a1" }, { label: "a2" }] },
      { id: "b", children: [{ label: "b1" }, { label: "b2" }] },
      { id: "c", children: [{ label: "c1" }] },
    ],
    log: (line) => logs.push(line),
    runChild: async ({ label }) => {
      starts.push(label);
      maximum = Math.max(maximum, ++active);
      admissions.get(label).resolve();
      await gates.get(label).promise;
      active -= 1;
      return success(label);
    },
  });
  try {
    await Promise.all([admissions.get("a1").promise, admissions.get("b1").promise]);
    assert.deepEqual(starts, ["a1", "b1"]);
    gates.get("b1").resolve();
    await admissions.get("b2").promise;
    assert.deepEqual(starts, ["a1", "b1", "b2"]);
    gates.get("b2").resolve();
    await admissions.get("c1").promise;
    assert.equal(active, 2);
    gates.get("c1").resolve();
    gates.get("a1").resolve();
    await admissions.get("a2").promise;
    gates.get("a2").resolve();
  } finally {
    for (const gate of gates.values()) gate.resolve();
  }
  const results = await task;
  assert.equal(maximum, 2);
  assert.equal(active, 0);
  assert.deepEqual(results.map((result) => result.label), labels);
  assert.equal(new Set(starts).size, labels.length);
  assert.deepEqual(starts, ["a1", "b1", "b2", "c1", "a2"]);
  const inventory = JSON.parse(logs.find((line) => line.includes("group_inventory ")).split("group_inventory ")[1]);
  assert.equal(inventory.selected_count, 5);
  assert.equal(inventory.started_count, 5);
  assert.equal(inventory.completed_count, 5);
  assert.equal(inventory.failed_count, 0);
  assert.equal(inventory.unstarted_count, 0);
  assert(inventory.children.every((entry) => entry.outcome === "passed"));
}

async function assertFailureMatrix() {
  const cases = [
    ["nonzero", () => success("first", { exit_code: 7 }), "child_failed", true],
    ["timeout", () => success("first", { timed_out: true, exit_code: null, signal: "SIGTERM", termination_reason: "bounded_timeout" }), "child_timed_out", true],
    ["spawn", () => success("first", { exit_code: null, spawn_error_code: "ENOENT", exit_observed: false }), "child_spawn_failed", true],
    ["sync-throw", () => { throw Object.assign(new Error("private detail"), { code: "EIO" }); }, "child_runner_rejected", false],
    ["rejection", () => Promise.reject(new Error("private detail")), "child_runner_rejected", false],
    ["missing", () => undefined, "child_result_missing", false],
    ["primitive", () => 0, "child_result_missing", false],
    ["conflicting", () => success("other"), "child_result_conflicting_label", false],
    ["empty", () => ({ label: "first" }), "child_result_incomplete", false],
    ["zero-only", () => ({ label: "first", exit_code: 0 }), "child_result_incomplete", false],
    ["invalid-duration", () => success("first", { duration_ms: NaN }), "child_result_incomplete", false],
    ["conflicting-exit", () => success("first", { signal: "SIGTERM" }), "child_result_incomplete", false],
    ["missing-timeout", () => success("first", { timed_out: undefined }), "child_result_incomplete", false],
    ["missing-cleanup", () => success("first", { cleanup_completed: undefined }), "child_result_incomplete", false],
    ["conflicting-cleanup", () => success("first", { cleanup_started: false }), "child_result_incomplete", false],
    ["empty-spawn-code", () => success("first", { spawn_error_code: "" }), "child_result_incomplete", false],
    ["unknown-termination", () => success("first", { termination_reason: "unknown" }), "child_result_incomplete", false],
    ["conflicting-timeout", () => success("first", { termination_reason: "bounded_timeout" }), "child_result_incomplete", false],
    ["cleanup", () => success("first", { cleanup_completed: false }), "child_failed", true],
    ["streams", () => success("first", { streams_closed: false }), "child_failed", true],
    ["exit-unobserved", () => success("first", { exit_observed: false }), "child_failed", true],
    ["residue", () => success("first", { remaining_owned_processes: 1 }), "child_failed", true],
    ["unknown-residue", () => success("first", { remaining_owned_processes: null }), "child_failed", true],
    ["natural-exit-required", () => success("first", { termination_reason: "exited_with_owned_descendant_cleanup" }), "child_failed", true],
  ];
  for (const [name, outcome, code, complete] of cases) {
    const starts = [];
    await assert.rejects(runCanonicalChildGroups({
      suite: "failure-contract", maxConcurrency: 1,
      groups: [
        { id: "first", children: [{ label: "first", requireNaturalExit: name === "natural-exit-required" }, { label: "same-later" }] },
        { id: "queued", children: [{ label: "queued-later" }] },
      ],
      log: () => {},
      runChild: (child) => { starts.push(child.label); return outcome(); },
    }), (failure) => {
      assert.equal(failure.code, "canonical_concurrent_group_failed", name);
      assert.equal(failure.canonicalIssues[0].code, code, name);
      assert.deepEqual(starts, ["first"], name);
      assert.equal(failure.canonicalInventory.selected_count, 3, name);
      assert.equal(failure.canonicalInventory.started_count, 1, name);
      assert.equal(failure.canonicalInventory.settled_count, 1, name);
      assert.equal(failure.canonicalInventory.completed_count, Number(complete), name);
      assert.equal(failure.canonicalInventory.failed_count, 1, name);
      assert.equal(failure.canonicalInventory.unstarted_count, 2, name);
      assert.equal(JSON.stringify(failure).includes("private detail"), false);
      return true;
    });
  }
  // A synchronous runner error can stop even the second worker before it admits
  // its group. With no active child, selected-but-unstarted groups cannot wait.
  const starts = [];
  await assert.rejects(runCanonicalChildGroups({
    suite: "early-error", groups, maxConcurrency: 2, log: () => {},
    runChild: ({ label }) => { starts.push(label); throw new Error("early error"); },
  }), (failure) => {
    assert.deepEqual(starts, ["failure"]);
    assert.equal(failure.canonicalInventory.unstarted_count, 4);
    return true;
  });
  await assert.rejects(runCanonicalChildGroups({
    suite: "report-error", groups, maxConcurrency: 1,
    log: (line) => { if (line.includes("group_inventory")) throw new Error("output unavailable"); },
    runChild: ({ label }) => success(label, { exit_code: 7 }),
  }), (failure) => {
    assert.deepEqual(failure.canonicalIssues.map((issue) => issue.code), ["child_failed", "group_report_rejected"]);
    assert.equal(failure.canonicalInventory.unstarted_count, 4);
    return true;
  });
  // Preserve the existing per-child natural-exit opt-in for a complete cleanup
  // result; the ordinary serial acceptance default remains unchanged as well.
  const cleaned = await runCanonicalChildGroups({
    suite: "cleanup-policy", maxConcurrency: 1,
    groups: [{ id: "a", children: [{ label: "cleaned" }] }], log: () => {},
    runChild: ({ label }) => success(label, { termination_reason: "exited_with_owned_descendant_cleanup" }),
  });
  assert.equal(cleaned.length, 1);
}

async function assertSecondaryFailures() {
  for (const [name, secondary, expectedCode] of [
    ["cleanup-rejection", () => Promise.reject(Object.assign(new Error("private cleanup detail"), { code: "resource_consumers_unsettled" })), "child_runner_rejected"],
    ["timeout", () => success("in-flight", { timed_out: true, exit_code: null, signal: "SIGTERM", termination_reason: "bounded_timeout" }), "child_timed_out"],
    ["cleanup-result", () => success("in-flight", { cleanup_completed: false }), "child_failed"],
  ]) {
    const admitted = deferred();
    const observed = deferred();
    const release = deferred();
    const starts = [];
    let finished = false;
    const task = runCanonicalChildGroups({
      suite: "secondary-errors", groups, maxConcurrency: 2,
      log: (line) => { if (line.includes("group_result group=first")) observed.resolve(); },
      runChild: async ({ label }) => {
        starts.push(label);
        if (label === "failure") {
          await admitted.promise;
          return success(label, { exit_code: 7 });
        }
        admitted.resolve();
        await release.promise;
        return secondary();
      },
    }).then(() => { finished = true; return null; }, (failure) => { finished = true; return failure; });
    await observed.promise;
    const pending = !finished;
    release.resolve();
    const failure = await task;
    assert.equal(pending, true, name);
    assert.deepEqual(starts, ["failure", "in-flight"], name);
    assert.deepEqual(failure.canonicalIssues.map((issue) => issue.code), ["child_failed", expectedCode], name);
    assert.equal(failure.canonicalInventory.settled_count, 2, name);
    assert.equal(failure.canonicalInventory.failed_count, 2, name);
    if (name === "cleanup-rejection") {
      assert.equal(failure.canonicalIssues[1].detail, "resource_consumers_unsettled");
      assert.equal(failure.canonicalInventory.completed_count, 1);
      assert.equal(failure.canonicalResults.length, 1, "rejection supplies no fabricated cleanup result");
    } else {
      assert.equal(failure.canonicalInventory.completed_count, 2);
      assert.equal(failure.canonicalResults.length, 2);
    }
  }
}
