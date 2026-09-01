#!/usr/bin/env node

import assert from "node:assert/strict";

import {
  LOCAL_CANONICAL_RECEIPT_SCHEMA,
  assertPublicSafeReceipt,
  canonicalSerialize,
  finalizeReceipt,
  inspectReceiptForDecision,
  verifyReceiptIntegrity,
} from "./local-canonical-receipt.mjs";

const baseReceipt = {
  schema: LOCAL_CANONICAL_RECEIPT_SCHEMA,
  receipt_version: 1,
  repository: {
    repository_id: "hynk-studio/augnes",
    origin: "https://github.com/hynk-studio/augnes.git",
    base_sha: "1".repeat(40),
    head_sha: "2".repeat(40),
    branch: "codex/local-canonical-harness",
    detached: false,
    worktree_before: "clean",
    worktree_after: "clean",
  },
  evidence: {
    mode: "changed",
    planner_event: "pull_request",
    planner_status: "pass",
    planner_plan: "documentation-only",
    planner_reason: "all_changes_match_documentation_allowlist",
    planner_change_count: 1,
    planner_changed_paths: ["README.md"],
    planner_full_reasons: [],
    planner_error_code: null,
    planner_owner_ids: ["documentation"],
    planner_targeted_phase_ids: [],
    planner_browser_phase_ids: [],
    selected_plan: "documentation-only",
    deciding: true,
    transferable: true,
    worktree_policy: "clean_exact_head_candidate",
  },
  environment: {
    machine_fingerprint: "a".repeat(32),
    operating_system: "macOS",
    operating_system_version: "26.5.2",
    operating_system_build: "25F84",
    architecture: "arm64",
    node: {
      actual_version: "24.18.0",
      path_version: "24.18.0",
      canonical_version: "24.18.0",
      compatibility_range: "^22.0.0 || ^24.0.0",
      canonical_match: true,
      compatibility_match: true,
    },
    npm_version: "11.7.0",
    browser: {
      available: true,
      name: "Google Chrome",
      source: "repository_candidate_order",
    },
    sleep_prevention: { available: true, used: false },
    resources: {
      logical_cpu_count: 10,
      physical_memory_bytes: 25_769_803_776,
      free_memory_bytes_at_start: 8_000_000_000,
      disk_free_bytes_at_start: 300_000_000_000,
      disk_free_bytes_at_finish: 299_000_000_000,
      disk_minimum_bytes: 1_073_741_824,
    },
  },
  dependencies: {
    policy: "documentation_only_no_dependency_install",
    download_cache: "npm_cache_reuse_permitted_not_authoritative",
    installed_trees: "not_deciding_authority",
    root_lock_sha256: "3".repeat(64),
    nested_lock_sha256: "4".repeat(64),
  },
  executor: {
    version: 1,
    source_files: [
      "scripts/local-canonical-environment.mjs",
      "scripts/local-canonical-receipt.mjs",
      "scripts/run-local-canonical-verification.mjs",
    ],
    source_fingerprint: "5".repeat(64),
    scheduling: "outer_phases_sequential",
    resource_exclusive_phases: [],
  },
  phases: [
    {
      id: "documentation-validator",
      label: "exact-head documentation validator",
      command:
        `node scripts/validate-canonical-docs-change.mjs --base ${"1".repeat(40)} --head ${"2".repeat(40)}`,
      cwd_scope: "root",
      exclusive: false,
      status: "pass",
      started_at: "2026-07-24T00:00:00.000Z",
      finished_at: "2026-07-24T00:00:01.000Z",
      duration_ms: 1000,
      exit_status: 0,
      timed_out: false,
      failure_code: null,
      cleanup: {
        completed: true,
        remaining_owned_processes: 0,
        termination_reason: "natural_exit",
        streams_closed: true,
      },
      log: {
        relative_path:
          ".augnes-local-verification/logs/run/documentation-validator.log",
        bytes: 100,
        truncated: false,
      },
    },
  ],
  run: {
    started_at: "2026-07-24T00:00:00.000Z",
    finished_at: "2026-07-24T00:00:01.000Z",
    duration_ms: 1000,
  },
  cleanup: {
    completed: true,
    remaining_owned_processes: 0,
    companion_service: {
      before: {
        status: "not_installed",
        checkout_relation: "exact",
        service_identity: null,
      },
      after: {
        status: "not_installed",
        checkout_relation: "exact",
        service_identity: null,
      },
      maintenance_acquired: false,
      maintenance_released: true,
      restored: true,
    },
    generated_next: {
      present_before: false,
      removed_before_execution: false,
      removed_after_execution: false,
      present_after_execution_cleanup: false,
      present_after: false,
    },
    artifact_retention: {
      receipt_files: 20,
      log_run_directories: 5,
      maximum_phase_log_bytes: 2_097_152,
    },
  },
  final: {
    result: "pass",
    exit_status: 0,
    reason_codes: [],
    limitations: [
      "one local execution on one shared Mac",
      "content integrity is not independent cryptographic attestation",
    ],
  },
};

assert.equal(
  canonicalSerialize({ z: 1, a: { d: 2, c: 3 } }),
  '{"a":{"c":3,"d":2},"z":1}',
);
const finalized = finalizeReceipt(baseReceipt);
assert.equal(verifyReceiptIntegrity(finalized), true);
assert.match(finalized.integrity.content_fingerprint, /^[0-9a-f]{64}$/u);
assert.doesNotThrow(() => assertPublicSafeReceipt(finalized));
const tampered = structuredClone(finalized);
tampered.final.result = "failure";
assert.equal(verifyReceiptIntegrity(tampered), false);
assert(
  inspectReceiptForDecision(tampered).issues.includes(
    "receipt_integrity_mismatch",
  ),
);

const validContext = {
  currentIdentity: {
    head_sha: "2".repeat(40),
    origin: "https://github.com/hynk-studio/augnes.git",
    branch: "codex/local-canonical-harness",
    detached: false,
    worktree_dirty: false,
  },
  currentLocks: {
    root: "3".repeat(64),
    nested: "4".repeat(64),
  },
  currentExecutorFingerprint: "5".repeat(64),
  expectedSelectedPlan: "documentation-only",
  expectedOwnerIds: ["documentation"],
  expectedTargetedPhaseIds: [],
  expectedPhaseIds: ["documentation-validator"],
  currentEnvironment: {
    machine_fingerprint: "a".repeat(32),
    operating_system: "macOS",
    operating_system_version: "26.5.2",
    operating_system_build: "25F84",
    architecture: "arm64",
    npm_version: "11.7.0",
    node: {
      actual_version: "24.18.0",
      path_version: "24.18.0",
      canonical_version: "24.18.0",
      compatibility_range: "^22.0.0 || ^24.0.0",
    },
  },
};
assert.deepEqual(inspectReceiptForDecision(finalized, validContext), {
  valid_deciding_evidence: true,
  status: "valid",
  issues: [],
  content_fingerprint: finalized.integrity.content_fingerprint,
});

const operatingPolicyReceipt = structuredClone(baseReceipt);
operatingPolicyReceipt.evidence.planner_plan = "operating-policy-only";
operatingPolicyReceipt.evidence.planner_reason =
  "exact_safe_agents_operating_policy_change";
operatingPolicyReceipt.evidence.planner_changed_paths = ["AGENTS.md"];
operatingPolicyReceipt.evidence.planner_owner_ids = [
  "repository-operating-policy",
];
operatingPolicyReceipt.evidence.selected_plan = "operating-policy-only";
operatingPolicyReceipt.dependencies.policy =
  "operating_policy_only_no_dependency_install";
const operatingPolicyPhaseIds = [
  "operating-policy-validator",
  "operating-policy-planner-contract",
  "operating-policy-executor-contract",
  "operating-policy-receipt-contract",
  "operating-policy-verification-contract",
];
operatingPolicyReceipt.phases = operatingPolicyPhaseIds.map((id) => ({
  ...structuredClone(baseReceipt.phases[0]),
  id,
}));
const finalizedOperatingPolicyReceipt = finalizeReceipt(operatingPolicyReceipt);
assert.deepEqual(
  inspectReceiptForDecision(finalizedOperatingPolicyReceipt, {
    ...validContext,
    expectedSelectedPlan: "operating-policy-only",
    expectedOwnerIds: ["repository-operating-policy"],
    expectedPhaseIds: operatingPolicyPhaseIds,
  }),
  {
    valid_deciding_evidence: true,
    status: "valid",
    issues: [],
    content_fingerprint:
      finalizedOperatingPolicyReceipt.integrity.content_fingerprint,
  },
);

const targetedReceipt = structuredClone(baseReceipt);
const targetedPhaseIds = [
  "targeted-change-validator",
  "dependencies-root",
  "dependencies-nested",
  "unit",
];
targetedReceipt.evidence.planner_plan = "owner-targeted";
targetedReceipt.evidence.planner_reason =
  "all_changes_have_owner_complete_targeted_coverage";
targetedReceipt.evidence.planner_changed_paths = [
  "scripts/augnes-codex-user-reuse-hook.mjs",
];
targetedReceipt.evidence.planner_owner_ids = ["codex-user-reuse-hook"];
targetedReceipt.evidence.planner_targeted_phase_ids = targetedPhaseIds;
targetedReceipt.evidence.selected_plan = "owner-targeted";
targetedReceipt.dependencies.policy =
  "owner_targeted_clean_npm_ci_root_and_nested";
targetedReceipt.dependencies.installed_trees =
  "replaced_from_lockfiles_by_npm_ci";
targetedReceipt.phases = [
  {
    ...structuredClone(baseReceipt.phases[0]),
    id: "targeted-change-validator",
    browser: false,
  },
  {
    ...structuredClone(baseReceipt.phases[0]),
    id: "dependencies-root",
    label: "root clean dependency installation",
    command: "npm ci --no-audit --no-fund",
    cwd_scope: "root",
    exclusive: true,
    browser: false,
  },
  {
    ...structuredClone(baseReceipt.phases[0]),
    id: "dependencies-nested",
    label: "nested application clean dependency installation",
    command: "npm ci --no-audit --no-fund",
    cwd_scope: "nested-app",
    exclusive: true,
    browser: false,
  },
  {
    ...structuredClone(baseReceipt.phases[0]),
    id: "unit",
    browser: false,
  },
];
const finalizedTargetedReceipt = finalizeReceipt(targetedReceipt);
const targetedContext = {
  ...validContext,
  expectedSelectedPlan: "owner-targeted",
  expectedOwnerIds: ["codex-user-reuse-hook"],
  expectedTargetedPhaseIds: targetedPhaseIds,
  expectedPhaseIds: targetedPhaseIds,
};
assert.deepEqual(
  inspectReceiptForDecision(finalizedTargetedReceipt, targetedContext),
  {
    valid_deciding_evidence: true,
    status: "valid",
    issues: [],
    content_fingerprint:
      finalizedTargetedReceipt.integrity.content_fingerprint,
  },
);
const targetedPhaseTamper = structuredClone(targetedReceipt);
targetedPhaseTamper.phases.reverse();
assert(
  inspectReceiptForDecision(
    finalizeReceipt(targetedPhaseTamper),
    targetedContext,
  ).issues.includes("receipt_targeted_phase_inventory_mismatch"),
);
const targetedOwnerTamper = structuredClone(targetedContext);
targetedOwnerTamper.expectedOwnerIds = ["different-owner"];
assert(
  inspectReceiptForDecision(
    finalizedTargetedReceipt,
    targetedOwnerTamper,
  ).issues.includes("receipt_stale_owners"),
);
for (const mutate of [
  (receipt) => {
    receipt.dependencies.policy =
      "owner_targeted_existing_trees_with_exact_lock_fingerprints";
  },
  (receipt) => {
    receipt.dependencies.installed_trees =
      "used_without_replacement_not_independent_dependency_attestation";
  },
  (receipt) => {
    receipt.phases[1].command = "npm test";
  },
  (receipt) => {
    receipt.phases[2].cwd_scope = "root";
  },
]) {
  const candidate = structuredClone(targetedReceipt);
  mutate(candidate);
  assert(
    inspectReceiptForDecision(
      finalizeReceipt(candidate),
      targetedContext,
    ).issues.includes("receipt_targeted_dependency_provenance_invalid"),
  );
}
const targetedMissingPreparation = structuredClone(targetedReceipt);
targetedMissingPreparation.phases.splice(1, 1);
targetedMissingPreparation.evidence.planner_targeted_phase_ids =
  targetedMissingPreparation.phases.map((phase) => phase.id);
assert(
  inspectReceiptForDecision(
    finalizeReceipt(targetedMissingPreparation),
    {
      ...targetedContext,
      expectedTargetedPhaseIds:
        targetedMissingPreparation.evidence.planner_targeted_phase_ids,
      expectedPhaseIds:
        targetedMissingPreparation.evidence.planner_targeted_phase_ids,
    },
  ).issues.includes("receipt_targeted_dependency_provenance_invalid"),
);
const targetedFailedPreparation = structuredClone(targetedReceipt);
targetedFailedPreparation.phases[1].status = "failure";
targetedFailedPreparation.phases[1].exit_status = 1;
assert(
  inspectReceiptForDecision(
    finalizeReceipt(targetedFailedPreparation),
    targetedContext,
  ).issues.includes("phase_not_passing:dependencies-root"),
);
assert(
  inspectReceiptForDecision(finalizedTargetedReceipt, {
    ...targetedContext,
    currentLocks: {
      ...targetedContext.currentLocks,
      root: "7".repeat(64),
    },
  }).issues.includes("receipt_stale_lockfiles"),
);
const targetedPreexistingGeneratedState = structuredClone(targetedReceipt);
targetedPreexistingGeneratedState.cleanup.generated_next.present_before = true;
targetedPreexistingGeneratedState.cleanup.generated_next.removed_before_execution =
  false;
assert(
  inspectReceiptForDecision(
    finalizeReceipt(targetedPreexistingGeneratedState),
    targetedContext,
  ).issues.includes("receipt_generated_next_provenance_invalid"),
);
const targetedGeneratedStateSurvived = structuredClone(targetedReceipt);
targetedGeneratedStateSurvived.cleanup.generated_next.present_after_execution_cleanup =
  true;
assert(
  inspectReceiptForDecision(
    finalizeReceipt(targetedGeneratedStateSurvived),
    targetedContext,
  ).issues.includes("receipt_generated_next_provenance_invalid"),
);
const targetedGeneratedCleanupFailure = structuredClone(targetedReceipt);
targetedGeneratedCleanupFailure.cleanup.generated_next.present_after_execution_cleanup =
  true;
targetedGeneratedCleanupFailure.cleanup.completed = false;
const targetedGeneratedCleanupFailureResult = inspectReceiptForDecision(
  finalizeReceipt(targetedGeneratedCleanupFailure),
  targetedContext,
);
assert.equal(
  targetedGeneratedCleanupFailureResult.valid_deciding_evidence,
  false,
);
assert(
  targetedGeneratedCleanupFailureResult.issues.includes(
    "receipt_generated_next_provenance_invalid",
  ),
);
assert(
  targetedGeneratedCleanupFailureResult.issues.includes(
    "receipt_cleanup_incomplete",
  ),
);
const targetedRestoredServiceGeneratedState = structuredClone(targetedReceipt);
targetedRestoredServiceGeneratedState.cleanup.companion_service.before.status =
  "starting";
targetedRestoredServiceGeneratedState.cleanup.companion_service.after.status =
  "live";
targetedRestoredServiceGeneratedState.cleanup.generated_next.present_after =
  true;
assert.equal(
  inspectReceiptForDecision(
    finalizeReceipt(targetedRestoredServiceGeneratedState),
    targetedContext,
  ).valid_deciding_evidence,
  true,
);
const targetedUnownedFinalGeneratedState = structuredClone(targetedReceipt);
targetedUnownedFinalGeneratedState.cleanup.generated_next.present_after = true;
assert(
  inspectReceiptForDecision(
    finalizeReceipt(targetedUnownedFinalGeneratedState),
    targetedContext,
  ).issues.includes("receipt_generated_next_provenance_invalid"),
);

const browserReceipt = structuredClone(baseReceipt);
browserReceipt.phases = [
  {
    ...browserReceipt.phases[0],
    id: "e2e-golden",
    browser: true,
    base_sha: browserReceipt.repository.base_sha,
    head_sha: browserReceipt.repository.head_sha,
    cleanup: {
      ...browserReceipt.phases[0].cleanup,
      exit_observed: true,
      listener_residue_count: 0,
    },
  },
];
const browserContext = {
  ...validContext,
  expectedPhaseIds: ["e2e-golden"],
};
assert.equal(
  inspectReceiptForDecision(finalizeReceipt(browserReceipt), browserContext)
    .valid_deciding_evidence,
  true,
);
for (const mutate of [
  (phase) => {
    phase.base_sha = "9".repeat(40);
  },
  (phase) => {
    phase.head_sha = "9".repeat(40);
  },
  (phase) => {
    phase.cleanup.termination_reason = "exited_with_descendant_cleanup";
  },
  (phase) => {
    phase.cleanup.exit_observed = false;
  },
  (phase) => {
    phase.cleanup.streams_closed = false;
  },
  (phase) => {
    phase.cleanup.listener_residue_count = 1;
  },
]) {
  const candidate = structuredClone(browserReceipt);
  mutate(candidate.phases[0]);
  assert.equal(
    inspectReceiptForDecision(finalizeReceipt(candidate), browserContext).issues.includes(
      "phase_not_passing:e2e-golden",
    ),
    true,
  );
}

for (const [name, mutate, issue] of [
  [
    "stale-head",
    (receipt) => {
      receipt.repository.head_sha = "6".repeat(40);
    },
    "receipt_stale_head",
  ],
  [
    "dirty-current-tree",
    (_receipt, context) => {
      context.currentIdentity.worktree_dirty = true;
    },
    "receipt_current_worktree_dirty",
  ],
  [
    "stale-lock",
    (_receipt, context) => {
      context.currentLocks.root = "7".repeat(64);
    },
    "receipt_stale_lockfiles",
  ],
  [
    "stale-branch-state",
    (_receipt, context) => {
      context.currentIdentity.branch = null;
      context.currentIdentity.detached = true;
    },
    "receipt_stale_branch_state",
  ],
  [
    "stale-executor",
    (_receipt, context) => {
      context.currentExecutorFingerprint = "8".repeat(64);
    },
    "receipt_stale_executor",
  ],
  [
    "stale-plan",
    (_receipt, context) => {
      context.expectedSelectedPlan = "full-canonical";
    },
    "receipt_stale_plan",
  ],
  [
    "stale-environment",
    (_receipt, context) => {
      context.currentEnvironment.operating_system_version = "26.6";
    },
    "receipt_stale_environment",
  ],
  [
    "phase-skipped",
    (receipt) => {
      receipt.phases[0].status = "not_run";
      receipt.phases[0].exit_status = null;
    },
    "phase_not_passing:documentation-validator",
  ],
  [
    "phase-timeout",
    (receipt) => {
      receipt.phases[0].timed_out = true;
    },
    "phase_not_passing:documentation-validator",
  ],
  [
    "phase-failed",
    (receipt) => {
      receipt.phases[0].status = "failure";
      receipt.phases[0].exit_status = 1;
    },
    "phase_not_passing:documentation-validator",
  ],
  [
    "phase-cleanup-incomplete",
    (receipt) => {
      receipt.phases[0].cleanup.completed = false;
      receipt.phases[0].cleanup.remaining_owned_processes = 1;
    },
    "phase_not_passing:documentation-validator",
  ],
  [
    "final-cleanup-incomplete",
    (receipt) => {
      receipt.cleanup.completed = false;
      receipt.cleanup.remaining_owned_processes = 1;
    },
    "receipt_cleanup_incomplete",
  ],
  [
    "node-mismatch",
    (receipt) => {
      receipt.environment.node.actual_version = "25.9.0";
      receipt.environment.node.canonical_match = false;
    },
    "receipt_canonical_node_mismatch",
  ],
  [
    "non-deciding",
    (receipt) => {
      receipt.evidence.deciding = false;
      receipt.evidence.transferable = false;
    },
    "receipt_non_deciding",
  ],
  [
    "dirty-receipt",
    (receipt) => {
      receipt.repository.worktree_before = "dirty";
    },
    "receipt_dirty_worktree",
  ],
]) {
  const candidate = structuredClone(baseReceipt);
  const context = structuredClone(validContext);
  mutate(candidate, context);
  const result = inspectReceiptForDecision(finalizeReceipt(candidate), context);
  assert.equal(result.valid_deciding_evidence, false, name);
  assert.equal(result.issues.includes(issue), true, name);
}

const missingPhases = structuredClone(baseReceipt);
missingPhases.phases = [];
const missingPhaseResult = inspectReceiptForDecision(
  finalizeReceipt(missingPhases),
  validContext,
);
assert(missingPhaseResult.issues.includes("receipt_missing_phases"));
assert(
  missingPhaseResult.issues.includes("receipt_phase_inventory_mismatch"),
);

const quickDirty = structuredClone(baseReceipt);
quickDirty.evidence.mode = "quick";
quickDirty.evidence.selected_plan = "quick-feedback";
quickDirty.evidence.deciding = false;
quickDirty.evidence.transferable = false;
quickDirty.evidence.worktree_policy = "quick_dirty_feedback_only";
quickDirty.repository.worktree_before = "dirty";
quickDirty.repository.worktree_after = "dirty";
const quickResult = inspectReceiptForDecision(
  finalizeReceipt(quickDirty),
  null,
);
assert.equal(quickResult.valid_deciding_evidence, false);
assert(quickResult.issues.includes("receipt_non_deciding"));
assert(quickResult.issues.includes("receipt_dirty_worktree"));

for (const unsafe of [
  { private_path: "/Users/private/project/file" },
  { username: "private-user" },
  { hostname: "private-host" },
  { environment_dump: { PRIVATE_VALUE: "hidden" } },
  { credentials: "hidden" },
  { token: "hidden" },
  { raw_output: "command output" },
  { prompt: "hidden prompt" },
  { model_output: "hidden model text" },
  { database_content: "private row" },
  { credential_value: "sk-proj-1234567890abcdef" },
]) {
  assert.throws(() => assertPublicSafeReceipt(unsafe));
}

for (const requiredField of [
  "schema",
  "repository",
  "evidence",
  "environment",
  "dependencies",
  "executor",
  "phases",
  "run",
  "cleanup",
  "final",
  "integrity",
]) {
  assert.equal(requiredField in finalized, true, requiredField);
}
for (const requiredField of [
  "repository",
  "evidence",
  "environment",
  "dependencies",
  "executor",
  "phases",
  "run",
  "cleanup",
  "final",
]) {
  const incomplete = structuredClone(baseReceipt);
  delete incomplete[requiredField];
  const result = inspectReceiptForDecision(
    finalizeReceipt(incomplete),
    validContext,
  );
  assert.equal(result.valid_deciding_evidence, false, requiredField);
  assert(
    result.issues.includes(`receipt_missing_${requiredField}`),
    requiredField,
  );
}

const invalidNestedIdentity = structuredClone(baseReceipt);
delete invalidNestedIdentity.executor.source_fingerprint;
assert(
  inspectReceiptForDecision(
    finalizeReceipt(invalidNestedIdentity),
    validContext,
  ).issues.includes("receipt_source_identity_invalid"),
);

console.log(
  JSON.stringify(
    {
      test: "local-canonical-receipt",
      status: "pass",
      deterministic_canonical_serialization: true,
      content_integrity_verified: true,
      required_fields_verified: true,
      private_material_excluded: true,
      stale_head_lock_executor_and_plan_refused: true,
      operating_policy_plan_deciding_and_validated: true,
      owner_targeted_plan_deciding_and_validated: true,
      owner_targeted_inventory_and_owner_drift_refused: true,
      owner_targeted_stale_tampered_and_unattested_dependencies_refused: true,
      owner_targeted_stale_and_residual_generated_next_refused: true,
      owner_targeted_generated_next_cleanup_failure_refused: true,
      restored_service_generated_next_separate_from_execution_provenance: true,
      incomplete_failed_timed_out_and_cleanup_incomplete_refused: true,
      quick_dirty_explicitly_non_deciding: true,
      canonical_node_mismatch_refused: true,
    },
    null,
    2,
  ),
);
