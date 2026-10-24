import { LOCAL_CANONICAL_RECEIPT_SCHEMA } from "../local-canonical-receipt.mjs";

const baseReceipt = {
  schema: LOCAL_CANONICAL_RECEIPT_SCHEMA,
  receipt_version: 3,
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
  integration_base: {
    contract: "augnes.local-canonical-integration-base.v1",
    requested_base_sha: "1".repeat(40),
    tested_head_sha: "2".repeat(40),
    status: "admitted",
    observation: {
      source: "github_authenticated_main_branch_get",
      repository_id: "hynk-studio/augnes",
      branch: "main",
      sha: "1".repeat(40),
      observed_at: "2026-07-24T00:00:00.000Z",
    },
    base_matches_current_main: true,
    base_is_ancestor_of_head: true,
    checked_at: "2026-07-24T00:00:00.000Z",
    reason_code: null,
  },
  checkout_ownership: {
    required: false,
    acquired: false,
    released: false,
    checkout_fingerprint: null,
    ownership_id: null,
    acquired_at: null,
    released_at: null,
    failure_code: null,
  },
  evidence: {
    mode: "changed",
    planner_event: "pull_request",
    planner_status: "pass",
    planner_plan: "operating-policy-only",
    planner_reason: "registered_documentation_responsibilities",
    planner_change_count: 1,
    planner_changed_paths: ["README.md"],
    planner_full_reasons: [],
    planner_error_code: null,
    planner_owner_ids: ["repository-verification-documentation"],
    planner_targeted_phase_ids: [],
    planner_browser_phase_ids: [],
    selected_plan: "operating-policy-only",
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
    policy: "operating_policy_only_no_dependency_install",
    download_cache: "npm_cache_reuse_permitted_not_authoritative",
    installed_trees: "not_deciding_authority",
    root_lock_sha256: "3".repeat(64),
    nested_lock_sha256: "4".repeat(64),
    web_planning_lock_sha256: "6".repeat(64),
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
      id: "operating-policy-validator",
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
          ".augnes-local-verification/logs/run/operating-policy-validator.log",
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

const policyPhaseIds = ["operating-policy-validator", "operating-policy-planner-contract", "operating-policy-executor-contract", "operating-policy-receipt-contract", "operating-policy-verification-contract"];
baseReceipt.verification_context = {
  contract: "augnes.local-canonical-verification-context.v1", kind: "canonical",
  repository_id: "hynk-studio/augnes", admission: "fixed_canonical_root",
  anchor_fingerprint: "a".repeat(64), checkout_fingerprint: "a".repeat(64), git_common_fingerprint: "b".repeat(64),
};
baseReceipt.capacity_ownership = { required: false, acquired: false, released: false, failure_code: null };
baseReceipt.run.id = "fixture-run";
baseReceipt.run.invocation_id = "f".repeat(32);
baseReceipt.phases[0].invocation_id = baseReceipt.run.invocation_id;
baseReceipt.cleanup.isolated_resources = { required: false, prepared: false };
baseReceipt.historical_inputs = { required: false, prepared: false };
baseReceipt.cleanup.companion_service.scope = "installed_checkout_lifecycle";
baseReceipt.phases = policyPhaseIds.map((id) => ({ ...structuredClone(baseReceipt.phases[0]), id }));

const validContext = {
  currentVerificationContext: baseReceipt.verification_context,
  expectedRunId: baseReceipt.run.id,
  currentIntegrationBase: {
    ...structuredClone(baseReceipt.integration_base),
    observation: { ...baseReceipt.integration_base.observation, observed_at: "2026-07-24T00:00:02.000Z" },
    checked_at: "2026-07-24T00:00:02.000Z",
  },
  currentCheckoutFingerprint: "c".repeat(64),
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
    webPlanning: "6".repeat(64),
  },
  currentExecutorFingerprint: "5".repeat(64),
  expectedSelectedPlan: "operating-policy-only",
  expectedOwnerIds: ["repository-verification-documentation"],
  expectedTargetedPhaseIds: [],
  expectedPhaseIds: policyPhaseIds,
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
export { baseReceipt, validContext, policyPhaseIds };
