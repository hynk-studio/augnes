#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";
import {
  RUNTIME_OPERABILITY_INTENTIONALLY_REPEATED_RESPONSIBILITIES,
  RUNTIME_OPERABILITY_LIFECYCLE_STRATEGIES,
  RUNTIME_OPERABILITY_MAX_CHILD_TIMEOUT_MS,
  RUNTIME_OPERABILITY_OWNERS,
  buildRuntimeOperabilityCanonicalSteps,
  createRuntimeOperabilityContext,
  detectRuntimeOperabilityDistributionMode,
  executeRuntimeOperabilityLifecycleStrategy,
  readCurrentRuntimeOperabilityContext,
  runtimeOperabilityLifecycleStrategy,
  runtimeOperabilityOwnerForSelector,
  validateRuntimeOperabilityLifecycleEvidence,
  validateRuntimeOperabilityOwnership,
} from "./runtime-operability-ownership.mjs";

const rootNode = (...args) => ({
  command: process.execPath,
  args,
  cwd: process.cwd(),
});
const ownerIds = (ownership) =>
  ownership.applicableOwners.map((owner) => owner.id);
const context = (input) => createRuntimeOperabilityContext(input);
const exactWindowsIdentity = Object.freeze({
  status: "exact_fixed_ntfs",
  reason: null,
});
const supportedWindows = context({
  platform: "win32",
  architecture: "x64",
  windows_version: "10.0.26200",
  distribution_mode: "source",
  windows_physical_identity: exactWindowsIdentity,
});
const contexts = Object.freeze({
  darwin: context({ platform: "darwin" }),
  linux: context({ platform: "linux" }),
  windows_11_source_fixed_ntfs: supportedWindows,
  windows_10_source_fixed_ntfs: context({
    platform: "win32",
    architecture: "x64",
    windows_version: "10.0.19045",
    distribution_mode: "source",
    windows_physical_identity: exactWindowsIdentity,
  }),
  windows_11_arm64: context({
    platform: "win32",
    architecture: "arm64",
    windows_version: "10.0.26200",
    distribution_mode: "source",
    windows_physical_identity: exactWindowsIdentity,
  }),
  windows_11_packaged: context({
    platform: "win32",
    architecture: "x64",
    windows_version: "10.0.26200",
    distribution_mode: "packaged",
    windows_physical_identity: exactWindowsIdentity,
  }),
  windows_11_malformed_distribution: context({
    platform: "win32",
    architecture: "x64",
    windows_version: "10.0.26200",
    distribution_mode: "preview",
    windows_physical_identity: exactWindowsIdentity,
  }),
  windows_11_unsupported_root: context({
    platform: "win32",
    architecture: "x64",
    windows_version: "10.0.26200",
    distribution_mode: "source",
    windows_physical_identity: {
      status: "unavailable",
      reason: "windows_physical_identity_root_unsupported",
    },
  }),
});
const ownership = Object.fromEntries(
  Object.entries(contexts).map(([name, value]) => [
    name,
    validateRuntimeOperabilityOwnership(RUNTIME_OPERABILITY_OWNERS, value),
  ]),
);
const lifecycleOwner = RUNTIME_OPERABILITY_OWNERS.find(
  (owner) => owner.selector === "lifecycle",
);
const resumeOwner = RUNTIME_OPERABILITY_OWNERS.find(
  (owner) => owner.selector === "resume",
);
assert(lifecycleOwner);
assert(resumeOwner);

const bothOwnerIds = [
  "runtime-supervisor-lifecycle",
  "runtime-supervisor-resume",
];
assert.deepEqual(ownerIds(ownership.darwin), bothOwnerIds);
assert.deepEqual(ownerIds(ownership.linux), bothOwnerIds);
assert.deepEqual(
  ownerIds(ownership.windows_11_source_fixed_ntfs),
  bothOwnerIds,
);
for (const name of [
  "windows_10_source_fixed_ntfs",
  "windows_11_arm64",
  "windows_11_packaged",
  "windows_11_malformed_distribution",
  "windows_11_unsupported_root",
]) {
  assert.deepEqual(ownerIds(ownership[name]), ["runtime-supervisor-lifecycle"]);
}

const supportedWindowsSteps = buildRuntimeOperabilityCanonicalSteps(
  rootNode,
  supportedWindows,
);
const unsupportedWindowsSteps = buildRuntimeOperabilityCanonicalSteps(
  rootNode,
  contexts.windows_10_source_fixed_ntfs,
);
assert.deepEqual(
  supportedWindowsSteps.map((step) => step.args),
  [
    ["scripts/test-runtime-operability.mjs", "lifecycle"],
    ["scripts/test-runtime-operability.mjs", "resume"],
  ],
);
assert.deepEqual(unsupportedWindowsSteps.map((step) => step.args), [
  ["scripts/test-runtime-operability.mjs", "lifecycle"],
]);
assert.deepEqual(
  supportedWindowsSteps.map((step) => [step.id, step.timeoutMs]),
  [
    ["runtime-supervisor-lifecycle", 90_000],
    ["runtime-supervisor-resume", 105_000],
  ],
);
for (const step of [...supportedWindowsSteps, ...unsupportedWindowsSteps]) {
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
assert.equal(
  runtimeOperabilityOwnerForSelector("resume", supportedWindows).id,
  "runtime-supervisor-resume",
);
assert.throws(
  () =>
    runtimeOperabilityOwnerForSelector(
      "resume",
      contexts.windows_10_source_fixed_ntfs,
    ),
  { code: "runtime_operability_owner_inapplicable" },
);

const positiveStartResponsibility =
  "managed-start-exact-replay-result-receipt-and-proposal";
const positiveResumeResponsibilities = [
  "resume-eligibility-after-required-child-crash-and-restart",
  "resume-read-selection-independence-and-worktree-drift",
  "browser-confirmed-same-run-resume-and-pre-marker-reacquisition",
  "resume-exact-replay-generation-checkpoint-and-terminal-result",
  "ambiguous-operation-reconciliation",
  "pending-approval-preservation",
];
const unsupportedWindowsResponsibility =
  "unsupported-windows-managed-start-and-resume-zero-effect-refusal";
for (const responsibilityId of [
  positiveStartResponsibility,
  ...positiveResumeResponsibilities,
]) {
  assert(
    ownership.windows_11_source_fixed_ntfs.applicableResponsibilityIds.includes(
      responsibilityId,
    ),
  );
  assert.equal(
    ownership.windows_11_source_fixed_ntfs.responsibilityOwnershipCounts[
      responsibilityId
    ],
    1,
  );
  for (const name of [
    "windows_10_source_fixed_ntfs",
    "windows_11_arm64",
    "windows_11_packaged",
    "windows_11_malformed_distribution",
    "windows_11_unsupported_root",
  ]) {
    assert(ownership[name].nonApplicableResponsibilityIds.includes(responsibilityId));
    assert.equal(ownership[name].responsibilityOwnershipCounts[responsibilityId], 0);
  }
}
assert(
  ownership.windows_11_source_fixed_ntfs.nonApplicableResponsibilityIds.includes(
    unsupportedWindowsResponsibility,
  ),
);
assert.equal(
  ownership.windows_11_source_fixed_ntfs.responsibilityOwnershipCounts[
    unsupportedWindowsResponsibility
  ],
  0,
);
for (const name of [
  "windows_10_source_fixed_ntfs",
  "windows_11_arm64",
  "windows_11_packaged",
  "windows_11_malformed_distribution",
  "windows_11_unsupported_root",
]) {
  assert(ownership[name].applicableResponsibilityIds.includes(unsupportedWindowsResponsibility));
  assert.equal(ownership[name].responsibilityOwnershipCounts[unsupportedWindowsResponsibility], 1);
}

assert.equal(detectRuntimeOperabilityDistributionMode({}), "source");
assert.equal(
  detectRuntimeOperabilityDistributionMode({
    AUGNES_DISTRIBUTION_MODE: "source",
  }),
  "source",
);
assert.equal(
  detectRuntimeOperabilityDistributionMode({
    AUGNES_DISTRIBUTION_MODE: "packaged",
  }),
  "packaged",
);
for (const malformed of ["", "preview", "SOURCE"]) {
  assert.equal(
    detectRuntimeOperabilityDistributionMode({
      AUGNES_DISTRIBUTION_MODE: malformed,
    }),
    malformed,
    "an explicit malformed distribution must never be promoted to source",
  );
  assert.equal(
    context({
      platform: "win32",
      architecture: "x64",
      windows_version: "10.0.26200",
      distribution_mode: malformed,
      windows_physical_identity: exactWindowsIdentity,
    }).windows_managed_execution.reason,
    "repository_managed_delegation_windows_source_runtime_required",
  );
}

for (const name of ["darwin", "linux", "windows_11_source_fixed_ntfs"]) {
  assert.equal(
    runtimeOperabilityLifecycleStrategy(contexts[name]).id,
    RUNTIME_OPERABILITY_LIFECYCLE_STRATEGIES.MANAGED_EXECUTION_POSITIVE,
  );
}
for (const name of [
  "windows_10_source_fixed_ntfs",
  "windows_11_arm64",
  "windows_11_packaged",
  "windows_11_malformed_distribution",
  "windows_11_unsupported_root",
]) {
  const strategy = runtimeOperabilityLifecycleStrategy(contexts[name]);
  assert.equal(
    strategy.id,
    RUNTIME_OPERABILITY_LIFECYCLE_STRATEGIES.UNSUPPORTED_WINDOWS_REFUSAL,
  );
  assert(
    ownership[name].applicableResponsibilityIds.includes(
      strategy.responsibility_id,
    ),
  );
}

const positiveLifecycleEvidence = {
  registered_repository: {
    verified: true,
    lifecycle_strategy:
      RUNTIME_OPERABILITY_LIFECYCLE_STRATEGIES.MANAGED_EXECUTION_POSITIVE,
    responsibility_id: positiveStartResponsibility,
    continuity_verified: true,
    selection_independent_continuity: true,
    start_or_execution_created: true,
    selection_independent_attachment: true,
    attachment_stale_reason: "packet_changed",
    same_path_replacement_blocked: true,
    managed_run_status: "completed",
    proposal_status: "available",
  },
  repository_resume: null,
};
assert.equal(
  validateRuntimeOperabilityLifecycleEvidence(
    positiveLifecycleEvidence,
    supportedWindows,
  ).id,
  RUNTIME_OPERABILITY_LIFECYCLE_STRATEGIES.MANAGED_EXECUTION_POSITIVE,
);
const refusalLifecycleEvidence = {
  registered_repository: {
    verified: true,
    lifecycle_strategy:
      RUNTIME_OPERABILITY_LIFECYCLE_STRATEGIES.UNSUPPORTED_WINDOWS_REFUSAL,
    responsibility_id: unsupportedWindowsResponsibility,
    registration_mode: "persisted_existing_registration",
    continuity_verified: true,
    selection_independent_continuity: true,
    windows_start_refused: true,
    start_preparation_or_request_refused: true,
    start_or_execution_created: false,
    start_decision_grant_created: false,
    attachment_consumed: false,
    worker_or_provider_invocation: false,
    project_files_unchanged: true,
  },
  repository_resume: {
    windows_resume_request_refused: true,
    windows_resume_refused: true,
    windows_resume_zero_effects: true,
    resume_attempt_created: false,
    resume_runtime_claim_created: false,
    semantic_effect_created: false,
    external_effect_created: false,
  },
};
assert.equal(
  validateRuntimeOperabilityLifecycleEvidence(
    refusalLifecycleEvidence,
    contexts.windows_11_packaged,
  ).id,
  RUNTIME_OPERABILITY_LIFECYCLE_STRATEGIES.UNSUPPORTED_WINDOWS_REFUSAL,
);
assert.throws(
  () =>
    validateRuntimeOperabilityLifecycleEvidence(
      {
        ...refusalLifecycleEvidence,
        repository_resume: {
          ...refusalLifecycleEvidence.repository_resume,
          windows_resume_zero_effects: false,
        },
      },
      contexts.windows_11_packaged,
    ),
  { code: "runtime_operability_refusal_evidence_incomplete" },
);
let positiveExecutions = 0;
let refusalExecutions = 0;
const executePositive = async () => {
  positiveExecutions += 1;
  return positiveLifecycleEvidence;
};
const executeRefusal = async () => {
  refusalExecutions += 1;
  return refusalLifecycleEvidence;
};
await executeRuntimeOperabilityLifecycleStrategy({
  context: supportedWindows,
  run_positive: executePositive,
  run_refusal: executeRefusal,
});
for (const name of [
  "windows_10_source_fixed_ntfs",
  "windows_11_arm64",
  "windows_11_packaged",
  "windows_11_malformed_distribution",
  "windows_11_unsupported_root",
]) {
  await executeRuntimeOperabilityLifecycleStrategy({
    context: contexts[name],
    run_positive: executePositive,
    run_refusal: executeRefusal,
  });
}
assert.equal(positiveExecutions, 1);
assert.equal(refusalExecutions, 5);
for (const responsibilityId of RUNTIME_OPERABILITY_INTENTIONALLY_REPEATED_RESPONSIBILITIES) {
  for (const result of Object.values(ownership)) {
    assert.equal(
      result.responsibilityOwnershipCounts[responsibilityId],
      result.applicableOwners.length,
    );
  }
}

const currentContext = readCurrentRuntimeOperabilityContext();
if (process.platform === "win32") {
  assert.equal(currentContext.architecture, "x64");
  assert.equal(currentContext.distribution_mode, "source");
  assert.equal(currentContext.windows_physical_identity.status, "exact_fixed_ntfs");
  assert.equal(currentContext.windows_managed_execution.status, "available");
  assert.deepEqual(
    ownerIds(
      validateRuntimeOperabilityOwnership(
        RUNTIME_OPERABILITY_OWNERS,
        currentContext,
      ),
    ),
    bothOwnerIds,
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
  "aggregate operability must select every context-applicable runtime owner",
);
assert.equal(
  localCanonicalExecutor.includes('["run", "test:operability"]'),
  true,
  "Local Canonical must retain the complete aggregate operability phase",
);

assert.throws(
  () => validateRuntimeOperabilityOwnership([lifecycleOwner], supportedWindows),
  { code: "runtime_operability_owner_missing" },
);
assert.throws(
  () =>
    validateRuntimeOperabilityOwnership(
      [resumeOwner],
      contexts.windows_10_source_fixed_ntfs,
    ),
  { code: "runtime_operability_owner_missing" },
);
assert.throws(
  () =>
    validateRuntimeOperabilityOwnership(
      [lifecycleOwner, lifecycleOwner, resumeOwner],
      supportedWindows,
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
      supportedWindows,
    ),
  { code: "runtime_operability_responsibility_duplicate" },
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
            unsupportedWindowsResponsibility,
          ],
        },
      ],
      supportedWindows,
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
      supportedWindows,
    ),
  { code: "runtime_operability_repeated_invariant_incomplete" },
);
assert.throws(
  () =>
    validateRuntimeOperabilityOwnership(
      [
        { ...lifecycleOwner, timeoutMs: RUNTIME_OPERABILITY_MAX_CHILD_TIMEOUT_MS + 1 },
        resumeOwner,
      ],
      supportedWindows,
    ),
  { code: "runtime_operability_timeout_invalid" },
);
assert.throws(
  () =>
    validateRuntimeOperabilityOwnership(
      [lifecycleOwner, { ...resumeOwner, requireNaturalExit: false }],
      supportedWindows,
    ),
  { code: "runtime_operability_natural_exit_not_required" },
);
assert.throws(
  () => createRuntimeOperabilityContext({ platform: "aix" }),
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
    owners_by_context: Object.fromEntries(
      Object.entries(ownership).map(([name, value]) => [name, ownerIds(value)]),
    ),
    windows_exclusions: {
      windows_10: contexts.windows_10_source_fixed_ntfs.windows_managed_execution.reason,
      arm64: contexts.windows_11_arm64.windows_managed_execution.reason,
      packaged: contexts.windows_11_packaged.windows_managed_execution.reason,
      unsupported_root:
        contexts.windows_11_unsupported_root.windows_managed_execution.reason,
    },
    current_context: currentContext,
    repeated_responsibility_count:
      RUNTIME_OPERABILITY_INTENTIONALLY_REPEATED_RESPONSIBILITIES.length,
    finite_bounds_and_natural_exit_unchanged: true,
    missing_failed_timed_out_and_cleanup_incomplete_fail_closed: true,
  }),
);
