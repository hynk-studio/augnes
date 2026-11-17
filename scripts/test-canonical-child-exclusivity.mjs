#!/usr/bin/env node

import assert from "node:assert/strict";
import { runCanonicalChildGroups } from "./canonical-child-runner.mjs";

const deferred = () => Promise.withResolvers();
const turn = () => new Promise((resolve) => setImmediate(resolve));
const success = (label, overrides = {}) => ({
  label, exit_code: 0, signal: null, timed_out: false, duration_ms: 1,
  spawn_error_code: null, exit_observed: true, streams_closed: true,
  cleanup_started: true, cleanup_completed: true, remaining_owned_processes: 0,
  termination_reason: "natural_exit", ...overrides,
});

// The normal group is deliberately listed first, as in integration. The idle
// scheduler must consider both ready heads before starting either child.
const gates = new Map(["normal", "exclusive", "after"].map((label) => [label, deferred()]));
const starts = [];
const logs = [];
let active = 0;
let maximum = 0;
const task = runCanonicalChildGroups({
  suite: "exclusive-contract", maxConcurrency: 2,
  groups: [
    { id: "ordinary", children: [{ label: "normal" }] },
    { id: "isolated", children: [{ label: "exclusive", exclusive: true }, { label: "after" }] },
  ],
  log: (line) => logs.push(line),
  runChild: async ({ label }) => {
    starts.push(label);
    maximum = Math.max(maximum, ++active);
    try { await gates.get(label).promise; }
    finally { active -= 1; }
    return success(label);
  },
});
let results;
try {
  await turn();
  assert.deepEqual(starts, ["exclusive"], "a ready exclusive owner starts alone before ordinary owners");
  assert.equal(active, 1);
  gates.get("exclusive").resolve();
  await turn();
  assert.deepEqual(new Set(starts), new Set(["exclusive", "normal", "after"]));
  assert.equal(active, 2, "ordinary children retain two-way concurrency after the exclusive owner settles");
} finally {
  // The unchanged fixture must terminate naturally on the old scheduler too.
  for (const gate of gates.values()) gate.resolve();
  results = await task;
}
assert.equal(active, 0);
assert.equal(maximum, 2);
assert.deepEqual(results.map((result) => result.label), ["normal", "exclusive", "after"]);
const inventory = JSON.parse(logs.find((line) => line.includes("group_inventory ")).split("group_inventory ")[1]);
assert.equal(inventory.selected_count, 3);
assert.equal(inventory.started_count, 3);
assert.equal(inventory.completed_count, 3);
assert.equal(inventory.unstarted_count, 0);

// A later exclusive head waits for both active owners and takes priority over
// the next ordinary head once the last active permission is released.
const pendingGates = new Map(["a", "b", "solo", "later"].map((label) => [label, deferred()]));
const pendingStarts = [];
let pendingActive = 0;
const pending = runCanonicalChildGroups({
  suite: "pending-exclusive", maxConcurrency: 2,
  groups: [
    { id: "a", children: [{ label: "a" }, { label: "solo", exclusive: true }] },
    { id: "b", children: [{ label: "b" }, { label: "later" }] },
  ], log: () => {},
  runChild: async ({ label, exclusive }) => {
    if (exclusive) assert.equal(pendingActive, 0);
    pendingStarts.push(label); pendingActive += 1;
    try { await pendingGates.get(label).promise; }
    finally { pendingActive -= 1; }
    return success(label);
  },
});
try {
  await turn();
  assert.deepEqual(pendingStarts, ["a", "b"]);
  pendingGates.get("a").resolve();
  await turn();
  assert.deepEqual(pendingStarts, ["a", "b"]);
  pendingGates.get("b").resolve();
  await turn();
  assert.deepEqual(pendingStarts, ["a", "b", "solo"]);
  pendingGates.get("solo").resolve();
  await turn();
  assert.deepEqual(pendingStarts, ["a", "b", "solo", "later"]);
} finally {
  for (const gate of pendingGates.values()) gate.resolve();
  await pending;
}
assert.equal(pendingActive, 0);

// Failure validation must latch before releasing exclusive admission. Waiting
// groups are denied and settled, including a rejected/malformed/unclean result.
for (const [name, outcome] of [
  ["nonzero", (label) => success(label, { exit_code: 7 })],
  ["rejected", () => { throw new Error("controlled rejection"); }],
  ["missing", () => undefined],
  ["cleanup", (label) => success(label, { cleanup_completed: false })],
]) {
  const admitted = [];
  await assert.rejects(runCanonicalChildGroups({
    suite: "exclusive-failure", maxConcurrency: 2,
    groups: [
      { id: "normal", children: [{ label: "waiting" }] },
      { id: "exclusive", children: [{ label: "failing", exclusive: true }, { label: "suffix" }] },
      { id: "queued", children: [{ label: "queued" }] },
    ], log: () => {},
    runChild: ({ label }) => { admitted.push(label); return outcome(label); },
  }), (error) => {
    assert.equal(error.code, "canonical_concurrent_group_failed", name);
    assert.deepEqual(admitted, ["failing"], name);
    assert.equal(error.canonicalInventory.started_count, 1, name);
    assert.equal(error.canonicalInventory.settled_count, 1, name);
    assert.equal(error.canonicalInventory.unstarted_count, 3, name);
    return true;
  });
}
for (const exclusive of ["true", 1, null]) {
  let called = false;
  await assert.rejects(runCanonicalChildGroups({
    suite: "malformed-exclusive", maxConcurrency: 1,
    groups: [{ id: "a", children: [{ label: "invalid", exclusive }] }],
    log: () => {}, runChild: () => { called = true; },
  }), /canonical concurrent child exclusivity is invalid/);
  assert.equal(called, false);
}
console.log(JSON.stringify({ test: "canonical-child-exclusivity", status: "pass",
  initial_and_pending_exclusive_priority: true, ordinary_concurrency_two: true,
  failure_denies_waiters_and_suffixes: true, inventory_and_result_order_preserved: true,
}));
