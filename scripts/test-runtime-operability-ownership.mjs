#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";
import {
  RUNTIME_OPERABILITY_MAX_CHILD_TIMEOUT_MS,
  RUNTIME_OPERABILITY_OWNERS,
  RUNTIME_OPERABILITY_REQUIRED_RESPONSIBILITIES,
  RUNTIME_OPERABILITY_INTENTIONALLY_REPEATED_RESPONSIBILITIES,
  buildRuntimeOperabilityCanonicalSteps,
  validateRuntimeOperabilityOwnership,
} from "./runtime-operability-ownership.mjs";

assert.equal(validateRuntimeOperabilityOwnership(RUNTIME_OPERABILITY_OWNERS), true);

const steps = buildRuntimeOperabilityCanonicalSteps((...args) => ({
  command: process.execPath,
  args,
  cwd: process.cwd(),
}));
assert.deepEqual(
  steps.map((step) => step.id),
  RUNTIME_OPERABILITY_OWNERS.map((owner) => owner.id),
);
assert.deepEqual(
  steps.map((step) => step.args),
  RUNTIME_OPERABILITY_OWNERS.map((owner) => [
    "scripts/test-runtime-operability.mjs",
    owner.selector,
  ]),
);
assert.equal(steps.every((step) => step.shard === "operability-supervisor"), true);
assert.equal(steps.every((step) => step.requireNaturalExit === true), true);
assert.equal(
  steps.every(
    (step) =>
      Number.isInteger(step.timeoutMs) &&
      step.timeoutMs > 0 &&
      step.timeoutMs <= RUNTIME_OPERABILITY_MAX_CHILD_TIMEOUT_MS,
  ),
  true,
);
assert.equal(
  steps.every((step) => step.requirements.includes("process-owning")),
  true,
);
assert.equal(
  steps.every((step) => step.requirements.includes("listener-port-owning")),
  true,
);

const canonicalSuite = readFileSync(
  path.join(process.cwd(), "scripts", "run-canonical-test-suite.mjs"),
  "utf8",
);
const localCanonicalExecutor = readFileSync(
  path.join(process.cwd(), "scripts", "run-local-canonical-verification.mjs"),
  "utf8",
);
assert.equal(
  canonicalSuite.includes("...buildRuntimeOperabilityCanonicalSteps(rootNode)"),
  true,
  "aggregate operability must include every permanent runtime owner",
);
assert.equal(
  localCanonicalExecutor.includes('["run", "test:operability"]'),
  true,
  "Local Canonical must retain the complete aggregate operability phase",
);

const responsibilityCounts = new Map();
for (const owner of RUNTIME_OPERABILITY_OWNERS) {
  for (const responsibility of owner.responsibilities) {
    responsibilityCounts.set(
      responsibility,
      (responsibilityCounts.get(responsibility) ?? 0) + 1,
    );
  }
}
for (const responsibility of RUNTIME_OPERABILITY_REQUIRED_RESPONSIBILITIES) {
  const expectedCount =
    RUNTIME_OPERABILITY_INTENTIONALLY_REPEATED_RESPONSIBILITIES.includes(
      responsibility,
    )
      ? RUNTIME_OPERABILITY_OWNERS.length
      : 1;
  assert.equal(
    responsibilityCounts.get(responsibility),
    expectedCount,
    `responsibility ownership count is invalid: ${responsibility}`,
  );
}

assert.throws(
  () => validateRuntimeOperabilityOwnership(RUNTIME_OPERABILITY_OWNERS.slice(0, 1)),
  { code: "runtime_operability_owner_missing" },
);
assert.throws(
  () => validateRuntimeOperabilityOwnership([
    RUNTIME_OPERABILITY_OWNERS[0],
    RUNTIME_OPERABILITY_OWNERS[0],
  ]),
  { code: "runtime_operability_owner_duplicate" },
);
assert.throws(
  () => validateRuntimeOperabilityOwnership([
    {
      ...RUNTIME_OPERABILITY_OWNERS[0],
      timeoutMs: RUNTIME_OPERABILITY_MAX_CHILD_TIMEOUT_MS + 1,
    },
    RUNTIME_OPERABILITY_OWNERS[1],
  ]),
  { code: "runtime_operability_timeout_invalid" },
);

const acceptedLifecycle = {
  exit_code: 0,
  timed_out: false,
  termination_reason: "natural_exit",
  exit_observed: true,
  streams_closed: true,
  cleanup_completed: true,
  remaining_owned_processes: 0,
};
for (const owner of RUNTIME_OPERABILITY_OWNERS) {
  assert.equal(
    canonicalChildAcceptanceFailure(acceptedLifecycle, {
      suite: owner.shard,
      timeoutMs: owner.timeoutMs,
      requireNaturalExit: owner.requireNaturalExit,
    }),
    null,
  );
  for (const rejected of [
    { ...acceptedLifecycle, exit_code: 1 },
    { ...acceptedLifecycle, timed_out: true },
    { ...acceptedLifecycle, termination_reason: "bounded_timeout" },
    { ...acceptedLifecycle, exit_observed: false },
    { ...acceptedLifecycle, streams_closed: false },
    { ...acceptedLifecycle, cleanup_completed: false },
    { ...acceptedLifecycle, remaining_owned_processes: 1 },
  ]) {
    assert(
      canonicalChildAcceptanceFailure(rejected, {
        suite: owner.shard,
        timeoutMs: owner.timeoutMs,
        requireNaturalExit: owner.requireNaturalExit,
      }),
      `owner must fail closed: ${owner.id}`,
    );
  }
}

console.log(JSON.stringify({
  test: "runtime-operability-ownership",
  status: "pass",
  owners: RUNTIME_OPERABILITY_OWNERS.map((owner) => ({
    id: owner.id,
    selector: owner.selector,
    timeout_ms: owner.timeoutMs,
    measured_responsibility_ms: owner.measuredResponsibilityMs,
    responsibility_count: owner.responsibilities.length,
  })),
  required_responsibility_count:
    RUNTIME_OPERABILITY_REQUIRED_RESPONSIBILITIES.length,
  missing_failed_timed_out_and_cleanup_incomplete_fail_closed: true,
}));
