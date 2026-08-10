#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";
import {
  RUNTIME_OPERABILITY_INTENTIONALLY_REPEATED_RESPONSIBILITIES,
  RUNTIME_OPERABILITY_MAX_CHILD_TIMEOUT_MS,
  RUNTIME_OPERABILITY_OWNERS,
  RUNTIME_OPERABILITY_RESPONSIBILITY_CONTRACTS,
  buildRuntimeOperabilityCanonicalSteps,
  runtimeOperabilityOwnerForSelector,
  validateRuntimeOperabilityOwnership,
} from "./runtime-operability-ownership.mjs";

const rootNode = (...args) => ({
  command: process.execPath,
  args,
  cwd: process.cwd(),
});
const ownerIds = (owners) => owners.map((owner) => owner.id);
const lifecycleOwner = RUNTIME_OPERABILITY_OWNERS.find(
  (owner) => owner.selector === "lifecycle",
);
const resumeOwner = RUNTIME_OPERABILITY_OWNERS.find(
  (owner) => owner.selector === "resume",
);
assert(lifecycleOwner);
assert(resumeOwner);

const darwinOwnership = validateRuntimeOperabilityOwnership(
  RUNTIME_OPERABILITY_OWNERS,
  "darwin",
);
const linuxOwnership = validateRuntimeOperabilityOwnership(
  RUNTIME_OPERABILITY_OWNERS,
  "linux",
);
const windowsOwnership = validateRuntimeOperabilityOwnership(
  RUNTIME_OPERABILITY_OWNERS,
  "win32",
);
assert.deepEqual(ownerIds(darwinOwnership.applicableOwners), [
  "runtime-supervisor-lifecycle",
  "runtime-supervisor-resume",
]);
assert.deepEqual(
  ownerIds(linuxOwnership.applicableOwners),
  ownerIds(darwinOwnership.applicableOwners),
);
assert.deepEqual(ownerIds(windowsOwnership.applicableOwners), [
  "runtime-supervisor-lifecycle",
]);

const darwinSteps = buildRuntimeOperabilityCanonicalSteps(rootNode, "darwin");
const windowsSteps = buildRuntimeOperabilityCanonicalSteps(rootNode, "win32");
assert.deepEqual(
  darwinSteps.map((step) => step.id),
  ownerIds(darwinOwnership.applicableOwners),
);
assert.deepEqual(
  windowsSteps.map((step) => step.id),
  ownerIds(windowsOwnership.applicableOwners),
);
assert.deepEqual(
  darwinSteps.map((step) => step.args),
  [
    ["scripts/test-runtime-operability.mjs", "lifecycle"],
    ["scripts/test-runtime-operability.mjs", "resume"],
  ],
);
assert.deepEqual(windowsSteps.map((step) => step.args), [
  ["scripts/test-runtime-operability.mjs", "lifecycle"],
]);
assert.deepEqual(
  darwinSteps.map((step) => [step.id, step.timeoutMs]),
  [
    ["runtime-supervisor-lifecycle", 90_000],
    ["runtime-supervisor-resume", 105_000],
  ],
);
for (const step of [...darwinSteps, ...windowsSteps]) {
  assert.equal(step.shard, "operability-supervisor");
  assert.equal(step.requireNaturalExit, true);
  assert(
    Number.isInteger(step.timeoutMs) &&
      step.timeoutMs > 0 &&
      step.timeoutMs <= RUNTIME_OPERABILITY_MAX_CHILD_TIMEOUT_MS,
  );
  assert(step.requirements.includes("process-owning"));
  assert(step.requirements.includes("listener-port-owning"));
  assert(step.requirements.includes("nested-app-runtime"));
}
assert.throws(
  () => runtimeOperabilityOwnerForSelector("resume", "win32"),
  { code: "runtime_operability_owner_inapplicable" },
);

const nonWindowsResponsibilityIds =
  RUNTIME_OPERABILITY_RESPONSIBILITY_CONTRACTS.filter(
    (contract) => !contract.platforms.includes("win32"),
  ).map((contract) => contract.id);
assert.deepEqual(nonWindowsResponsibilityIds, [
  "resume-eligibility-after-required-child-crash-and-restart",
  "resume-read-selection-independence-and-worktree-drift",
  "browser-confirmed-same-run-resume-and-pre-marker-reacquisition",
  "resume-exact-replay-generation-checkpoint-and-terminal-result",
  "ambiguous-operation-reconciliation",
  "pending-approval-preservation",
]);
for (const responsibilityId of nonWindowsResponsibilityIds) {
  assert(windowsOwnership.nonApplicableResponsibilityIds.includes(responsibilityId));
  assert.equal(
    windowsOwnership.responsibilityOwnershipCounts[responsibilityId],
    0,
    `Windows must not falsely count non-applicable proof: ${responsibilityId}`,
  );
}
for (const responsibilityId of RUNTIME_OPERABILITY_INTENTIONALLY_REPEATED_RESPONSIBILITIES) {
  assert.equal(
    darwinOwnership.responsibilityOwnershipCounts[responsibilityId],
    darwinOwnership.applicableOwners.length,
  );
  assert.equal(
    windowsOwnership.responsibilityOwnershipCounts[responsibilityId],
    windowsOwnership.applicableOwners.length,
  );
}

const ownershipSource = readFileSync(
  path.join(process.cwd(), "scripts", "runtime-operability-ownership.mjs"),
  "utf8",
);
assert.equal(
  ownershipSource.includes("RUNTIME_OPERABILITY_REPEATED_INVARIANTS"),
  false,
  "repeated invariants must not retain a decorative second vocabulary",
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
  "aggregate operability must select every platform-applicable runtime owner",
);
assert.equal(
  localCanonicalExecutor.includes('["run", "test:operability"]'),
  true,
  "Local Canonical must retain the complete aggregate operability phase",
);

assert.throws(
  () => validateRuntimeOperabilityOwnership([lifecycleOwner], "darwin"),
  { code: "runtime_operability_owner_missing" },
);
assert.throws(
  () => validateRuntimeOperabilityOwnership([resumeOwner], "win32"),
  { code: "runtime_operability_owner_missing" },
);
assert.throws(
  () =>
    validateRuntimeOperabilityOwnership(
      [lifecycleOwner, lifecycleOwner, resumeOwner],
      "darwin",
    ),
  { code: "runtime_operability_owner_duplicate" },
);
assert.throws(
  () =>
    validateRuntimeOperabilityOwnership(
      [
        lifecycleOwner,
        {
          ...resumeOwner,
          responsibilities: [
            ...resumeOwner.responsibilities,
            "source-ui-core-and-bridge-readiness",
          ],
        },
      ],
      "darwin",
    ),
  { code: "runtime_operability_responsibility_duplicate" },
);
assert.throws(
  () =>
    validateRuntimeOperabilityOwnership(
      [
        {
          ...lifecycleOwner,
          responsibilities: [
            ...lifecycleOwner.responsibilities,
            nonWindowsResponsibilityIds[0],
          ],
        },
        resumeOwner,
      ],
      "win32",
    ),
  { code: "runtime_operability_responsibility_inapplicable" },
);
assert.throws(
  () =>
    validateRuntimeOperabilityOwnership(
      [
        lifecycleOwner,
        {
          ...resumeOwner,
          responsibilities: resumeOwner.responsibilities.filter(
            (responsibilityId) =>
              responsibilityId !==
              RUNTIME_OPERABILITY_INTENTIONALLY_REPEATED_RESPONSIBILITIES[0],
          ),
        },
      ],
      "darwin",
    ),
  { code: "runtime_operability_repeated_invariant_incomplete" },
);
assert.throws(
  () =>
    validateRuntimeOperabilityOwnership(
      [
        {
          ...lifecycleOwner,
          timeoutMs: RUNTIME_OPERABILITY_MAX_CHILD_TIMEOUT_MS + 1,
        },
        resumeOwner,
      ],
      "darwin",
    ),
  { code: "runtime_operability_timeout_invalid" },
);
assert.throws(
  () =>
    validateRuntimeOperabilityOwnership(
      [
        lifecycleOwner,
        { ...resumeOwner, requireNaturalExit: false },
      ],
      "darwin",
    ),
  { code: "runtime_operability_natural_exit_not_required" },
);
assert.throws(
  () => validateRuntimeOperabilityOwnership(RUNTIME_OPERABILITY_OWNERS, "aix"),
  { code: "runtime_operability_platform_unsupported" },
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

console.log(
  JSON.stringify({
    test: "runtime-operability-ownership",
    status: "pass",
    owners_by_platform: {
      darwin: ownerIds(darwinOwnership.applicableOwners),
      linux: ownerIds(linuxOwnership.applicableOwners),
      win32: ownerIds(windowsOwnership.applicableOwners),
    },
    responsibility_count_by_platform: {
      darwin: darwinOwnership.applicableResponsibilityIds.length,
      linux: linuxOwnership.applicableResponsibilityIds.length,
      win32: windowsOwnership.applicableResponsibilityIds.length,
    },
    windows_non_applicable_responsibilities: nonWindowsResponsibilityIds,
    repeated_responsibility_count:
      RUNTIME_OPERABILITY_INTENTIONALLY_REPEATED_RESPONSIBILITIES.length,
    finite_bounds_and_natural_exit_unchanged: true,
    missing_failed_timed_out_and_cleanup_incomplete_fail_closed: true,
  }),
);
