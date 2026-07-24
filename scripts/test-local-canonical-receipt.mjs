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
    repository_id: "hynk-studio/augnes-perspective-lab",
    origin: "https://github.com/hynk-studio/augnes-perspective-lab.git",
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
    generated_next: {
      present_before: false,
      removed_before_execution: false,
      removed_after_execution: false,
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
    origin: "https://github.com/hynk-studio/augnes-perspective-lab.git",
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
      incomplete_failed_timed_out_and_cleanup_incomplete_refused: true,
      quick_dirty_explicitly_non_deciding: true,
      canonical_node_mismatch_refused: true,
    },
    null,
    2,
  ),
);
