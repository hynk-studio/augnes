#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  closeSync,
  existsSync,
  lstatSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  writeSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  OWNER_TARGETED_PLAN,
  OWNER_TARGETED_DEPENDENCY_PHASE_IDS,
  PERMANENT_BROWSER_PHASE_IDS,
  TARGETED_PHASE_ORDER,
  planCanonicalChange,
} from "./canonical-change-planner.mjs";
import { runCanonicalChild } from "./canonical-child-runner.mjs";
import {
  CANONICAL_AMBIENT_ENVIRONMENT_ALLOWLIST,
  CANONICAL_OPTIONAL_AMBIENT_ENVIRONMENT_ALLOWLIST,
} from "./canonical-test-environment.mjs";
import {
  CANONICAL_NODE_COMPATIBILITY,
  CANONICAL_NODE_VERSION,
  FULL_MINIMUM_DISK_BYTES,
  LOCAL_ARTIFACT_DIRECTORY,
  QUICK_MINIMUM_DISK_BYTES,
  assertCommitExists,
  assertDecidingEnvironment,
  assertExactSha,
  collectDiskObservation,
  collectHostEnvironment,
  collectRepositoryIdentity,
  ensureBoundedLocalDirectory,
  ensureMachineFingerprint,
  evaluateNodePolicy,
  hashFile,
  runGit,
} from "./local-canonical-environment.mjs";
import {
  LOCAL_CANONICAL_EXECUTOR_VERSION,
  LOCAL_CANONICAL_RECEIPT_SCHEMA,
  canonicalSerialize,
  finalizeReceipt,
  inspectReceiptForDecision,
  readReceiptFile,
} from "./local-canonical-receipt.mjs";
import {
  acquireCompanionServiceMaintenance,
  boundedLifecycleState,
  inspectCompanionService,
  releaseCompanionServiceMaintenance,
} from "../plugins/augnes-operator/mcp/companion-service-core.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const nestedAppRoot = path.join(repositoryRoot, "apps", "augnes_apps");
const artifactRoot = path.join(repositoryRoot, LOCAL_ARTIFACT_DIRECTORY);
const receiptRoot = path.join(artifactRoot, "receipts");
const logRoot = path.join(artifactRoot, "logs");
const generatedNextRoot = path.join(repositoryRoot, ".next");
const generatedWindowsHelperRoot = path.join(
  repositoryRoot,
  "native",
  "windows-x64",
);
const GENERATED_NEXT_DIRECTORY = ".next";
const EXECUTOR_SOURCE_FILES = Object.freeze([
  "scripts/browser-verification-owners.v1.json",
  "scripts/canonical-change-planner.mjs",
  "scripts/canonical-child-runner.mjs",
  "scripts/canonical-test-environment.mjs",
  "scripts/canonical-repository-identity.mjs",
  "scripts/local-canonical-environment.mjs",
  "scripts/local-canonical-change-owners.v1.json",
  "scripts/local-canonical-receipt.mjs",
  "plugins/augnes-operator/mcp/companion-service-core.mjs",
  "scripts/run-local-canonical-verification.mjs",
  "scripts/test-harness-process-lifecycle.mjs",
  "scripts/validate-canonical-docs-change.mjs",
]);
const RECEIPT_RETENTION = 20;
const LOG_RUN_RETENTION = 5;
const MAX_PHASE_LOG_BYTES = 2 * 1024 * 1024;
const VALID_MODES = new Set(["quick", "changed", "full", "validate"]);

export const QUICK_PHASE_IDS = Object.freeze([
  "typecheck",
  "local-executor-contract",
  "local-receipt-contract",
  "local-pr-evidence-contract",
  "local-pr-evidence-transport-contract",
  "local-canonical-contract",
]);
export const OPERATING_POLICY_PHASE_IDS = Object.freeze([
  "operating-policy-validator",
  "operating-policy-planner-contract",
  "operating-policy-executor-contract",
  "operating-policy-receipt-contract",
  "operating-policy-verification-contract",
]);
export const FULL_PHASE_IDS = Object.freeze([
  "dependencies-root",
  "dependencies-nested",
  ...(process.platform === "win32" ? ["native-windows-identity"] : []),
  "typecheck",
  "build",
  "unit",
  "authority",
  "integration",
  "operability",
  "e2e-project-experience",
  "e2e-operator-review-control",
  "e2e-operator-native-host-execution",
  "e2e-operator-multi-candidate",
  "e2e-continuity",
  "e2e-golden",
]);
export const RESOURCE_EXCLUSIVE_PHASE_IDS = Object.freeze([
  "dependencies-root",
  "dependencies-nested",
  ...(process.platform === "win32" ? ["native-windows-identity"] : []),
  "build",
  "unit",
  "authority",
  "integration",
  "operability",
  "e2e-project-experience",
  "e2e-operator-review-control",
  "e2e-operator-native-host-execution",
  "e2e-operator-multi-candidate",
  "e2e-continuity",
  "e2e-golden",
]);

export function managesGeneratedNextState(selectedPlan) {
  return (
    selectedPlan === "full-canonical" || selectedPlan === OWNER_TARGETED_PLAN
  );
}

export function generatedNextEntryPresent(candidate = generatedNextRoot) {
  return lstatSync(candidate, { throwIfNoEntry: false }) !== undefined;
}

export function removeBoundedGeneratedNextState({
  root = repositoryRoot,
  candidate = path.join(root, GENERATED_NEXT_DIRECTORY),
} = {}) {
  const resolvedRoot = realpathSync(root);
  const resolvedCandidate = path.resolve(candidate);
  const resolvedCandidateParent = realpathSync(
    path.dirname(resolvedCandidate),
  );
  const boundedCandidate = path.join(
    resolvedCandidateParent,
    path.basename(resolvedCandidate),
  );
  const expectedCandidate = path.join(
    resolvedRoot,
    GENERATED_NEXT_DIRECTORY,
  );
  if (boundedCandidate !== expectedCandidate) {
    const error = new Error("generated Next state path is outside its owner");
    error.code = "generated_next_path_out_of_bounds";
    throw error;
  }
  const stats = lstatSync(boundedCandidate, { throwIfNoEntry: false });
  if (stats === undefined) return false;
  if (!stats.isDirectory() || stats.isSymbolicLink()) {
    const error = new Error(
      "generated Next state must be a real repository-owned directory",
    );
    error.code = "unsafe_generated_next_path";
    throw error;
  }
  rmSync(boundedCandidate, { recursive: true, force: true });
  if (lstatSync(boundedCandidate, { throwIfNoEntry: false }) !== undefined) {
    const error = new Error("generated Next state cleanup is incomplete");
    error.code = "generated_next_cleanup_incomplete";
    throw error;
  }
  return true;
}

export function evaluateWorktreePolicy({ mode, worktreeDirty }) {
  if (mode === "quick") {
    return {
      allowed: true,
      deciding: false,
      transferable: false,
      reason: worktreeDirty
        ? "quick_dirty_feedback_only"
        : "quick_feedback_only",
    };
  }
  return {
    allowed: !worktreeDirty,
    deciding: !worktreeDirty,
    transferable: !worktreeDirty,
    reason: worktreeDirty
      ? "deciding_mode_requires_clean_worktree"
      : "clean_exact_head_candidate",
  };
}

export function isPostExecutionIdentityValid({
  mode,
  expectedHeadSha,
  identityBefore,
  identityAfter,
}) {
  return (
    mode === "quick" ||
    (identityAfter.head_sha === expectedHeadSha &&
      identityAfter.worktree_dirty === false &&
      identityAfter.repository_id === identityBefore.repository_id &&
      identityAfter.origin === identityBefore.origin &&
      identityAfter.branch === identityBefore.branch &&
      identityAfter.detached === identityBefore.detached)
  );
}

export function resolveVerificationPlan({
  mode,
  baseSha,
  headSha,
  planner = planCanonicalChange,
}) {
  if (mode === "quick") {
    return {
      planner_event: "local_quick",
      planner_status: "not_applicable",
      planner_plan: null,
      selected_plan: "quick-feedback",
      planner_reason: "quick_mode_has_fixed_bounded_feedback_surface",
    };
  }
  if (baseSha === headSha) {
    const error = new Error("local canonical base and head must differ");
    error.code = "identical_base_and_head";
    throw error;
  }
  try {
    const result = planner({
      eventName: "pull_request",
      baseSha,
      headSha,
      cwd: repositoryRoot,
    });
    return {
      planner_event: result.event,
      planner_status: "pass",
      planner_plan: result.plan,
      selected_plan: mode === "full" ? "full-canonical" : result.plan,
      planner_reason:
        mode === "full" && result.plan !== "full-canonical"
          ? "full_mode_explicitly_expands_narrow_plan"
          : result.reason,
      planner_change_count: result.change_count,
      planner_changed_paths: result.changed_paths,
      planner_full_reasons: result.full_reasons,
      planner_owner_ids: result.owner_ids,
      planner_targeted_phase_ids: result.targeted_phase_ids,
      planner_browser_phase_ids:
        mode === "full"
          ? [...PERMANENT_BROWSER_PHASE_IDS]
          : result.browser_phase_ids,
    };
  } catch (error) {
    if (mode === "changed") {
      return {
        planner_event: "pull_request",
        planner_status: "failed_closed_to_full",
        planner_plan: null,
        selected_plan: "full-canonical",
        planner_reason: "planner_failure_requires_full_canonical",
        planner_error_code: safeErrorCode(error),
        planner_owner_ids: ["planner-failure"],
        planner_targeted_phase_ids: [],
        planner_browser_phase_ids: [...PERMANENT_BROWSER_PHASE_IDS],
      };
    }
    throw error;
  }
}

export function buildPhasePlan({
  mode,
  selectedPlan,
  baseSha,
  headSha,
  browserPhaseIds = [...PERMANENT_BROWSER_PHASE_IDS],
  targetedPhaseIds = [],
}) {
  if (mode === "quick") return quickPhases();
  if (selectedPlan === "documentation-only") {
    return [
      phaseDefinition({
        id: "documentation-validator",
        label: "exact-head documentation validator",
        command: process.execPath,
        args: [
          "scripts/validate-canonical-docs-change.mjs",
          "--base",
          baseSha,
          "--head",
          headSha,
        ],
        display: `node scripts/validate-canonical-docs-change.mjs --base ${baseSha} --head ${headSha}`,
        timeoutMs: 120_000,
      }),
    ];
  }
  if (selectedPlan === "operating-policy-only") {
    return operatingPolicyPhases({ baseSha, headSha });
  }
  if (selectedPlan === OWNER_TARGETED_PLAN) {
    return ownerTargetedPhases({
      baseSha,
      headSha,
      targetedPhaseIds,
    });
  }
  if (selectedPlan !== "full-canonical") {
    const error = new Error("unsupported local canonical selected plan");
    error.code = "unsupported_selected_plan";
    throw error;
  }
  return fullPhases({ baseSha, headSha, browserPhaseIds });
}

export async function runPhasesSequentially({
  phases,
  execute,
  onStart = () => {},
  onResult = () => {},
}) {
  const results = [];
  for (const phase of phases) {
    onStart(phase);
    const result = await execute(phase);
    results.push(result);
    onResult(phase, result);
    if (result.status !== "pass") break;
  }
  return results;
}

export function computeExecutorSourceFingerprint(
  root = repositoryRoot,
  sourceFiles = EXECUTOR_SOURCE_FILES,
) {
  const hash = createHash("sha256");
  for (const relativePath of [...sourceFiles].sort(compareCodeUnits)) {
    hash.update(relativePath);
    hash.update("\0");
    hash.update(readFileSync(path.join(root, relativePath)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

export async function executeLocalCanonicalVerification({
  mode,
  baseSha: requestedBaseSha = null,
  headSha: requestedHeadSha = null,
}) {
  const startedMs = Date.now();
  const startedAt = new Date(startedMs).toISOString();
  const identityBefore = collectRepositoryIdentity(repositoryRoot);
  const baseSha =
    requestedBaseSha ??
    (mode === "quick"
      ? runGit(repositoryRoot, ["rev-parse", "origin/main"]).trim()
      : null);
  const headSha =
    requestedHeadSha ?? (mode === "quick" ? identityBefore.head_sha : null);
  assertExactSha(baseSha, "base");
  assertExactSha(headSha, "head");
  assertCommitExists(repositoryRoot, baseSha, "base");
  assertCommitExists(repositoryRoot, headSha, "head");

  const hostResult = collectHostEnvironment(repositoryRoot);
  const host = hostResult.public;
  const nodePolicy = evaluateNodePolicy();
  const locks = collectLockFingerprints();
  const executorFingerprint = computeExecutorSourceFingerprint();
  ensureBoundedLocalDirectory(repositoryRoot, artifactRoot);
  const machineFingerprint = ensureMachineFingerprint(artifactRoot);
  const runId = safeRunId(startedAt, mode, headSha);
  const runLogRoot = path.join(logRoot, runId);
  const worktreePolicy = evaluateWorktreePolicy({
    mode,
    worktreeDirty: identityBefore.worktree_dirty,
  });
  const plan = resolveVerificationPlan({
    mode,
    baseSha,
    headSha,
  });
  const phaseDefinitions = buildPhasePlan({
    mode,
    selectedPlan: plan.selected_plan,
    baseSha,
    headSha,
    browserPhaseIds: plan.planner_browser_phase_ids,
    targetedPhaseIds: plan.planner_targeted_phase_ids,
  });
  const phaseReceipts = phaseDefinitions.map(notRunPhaseReceipt);
  const serviceLifecycleBefore = boundedLifecycleState(
    await inspectCompanionService({ repositoryRoot }),
  );
  let serviceLifecycleAfter = serviceLifecycleBefore;
  let dependencyMaintenance = null;
  let dependencyMaintenanceRelease = null;
  const preflightIssues = [];
  const selectedBrowserPhases = phaseDefinitions.filter(
    (phase) => phase.browser === true,
  );
  const diskMinimumBytes =
    plan.selected_plan === "full-canonical" ||
    plan.selected_plan === OWNER_TARGETED_PLAN ||
    selectedBrowserPhases.length > 0
      ? FULL_MINIMUM_DISK_BYTES
      : QUICK_MINIMUM_DISK_BYTES;

  if (identityBefore.head_sha !== headSha) {
    preflightIssues.push("intended_head_mismatch");
  }
  if (!worktreePolicy.allowed) {
    preflightIssues.push("deciding_mode_dirty_worktree");
  }
  if (mode !== "quick") {
    try {
      assertDecidingEnvironment({
        host,
        nodePolicy,
        diskMinimumBytes,
      });
    } catch (error) {
      preflightIssues.push(safeErrorCode(error));
    }
  } else if (host.disk_free_bytes_at_start < diskMinimumBytes) {
    preflightIssues.push("insufficient_disk_space");
  }
  if (
    selectedBrowserPhases.length > 0 &&
    host.browser.available !== true
  ) {
    preflightIssues.push("canonical_browser_unavailable");
  }

  console.log(
    `[local-canonical] start mode=${mode} selected_plan=${plan.selected_plan}`,
  );
  console.log(`[local-canonical] base=${baseSha}`);
  console.log(`[local-canonical] head=${headSha}`);
  console.log(
    `[local-canonical] worktree=${identityBefore.worktree_dirty ? "dirty" : "clean"} node=${host.node_version} canonical_node=${CANONICAL_NODE_VERSION}`,
  );
  if (mode === "quick" && !nodePolicy.canonical_match) {
    console.warn(
      `[local-canonical] warning code=canonical_node_mismatch quick evidence is non-deciding`,
    );
  }
  if (preflightIssues.length > 0) {
    console.error(
      `[local-canonical] failure phase=preflight reasons=${preflightIssues.join(",")}`,
    );
  }

  const generatedNextManaged = managesGeneratedNextState(plan.selected_plan);
  const nextState = {
    present_before: generatedNextEntryPresent(),
    removed_before_execution: false,
    removed_after_execution: false,
  };
  const windowsHelperState = {
    required: process.platform === "win32" && process.arch === "x64",
    present_before: existsSync(generatedWindowsHelperRoot),
    removed_before_execution: false,
    removed_after_execution: false,
  };
  let executionFailure = preflightIssues.length > 0;
  let cleanupComplete = true;
  let cleanupReason = null;

  try {
    if (!executionFailure) {
      ensureBoundedLocalDirectory(repositoryRoot, runLogRoot);
      if (
        plan.selected_plan === "full-canonical" ||
        plan.selected_plan === OWNER_TARGETED_PLAN
      ) {
        dependencyMaintenance = await acquireCompanionServiceMaintenance({
          repositoryRoot,
          operationId: `local-canonical-dependencies:${runId}`,
        });
      }
      if (generatedNextManaged && nextState.present_before) {
        nextState.removed_before_execution = removeBoundedGeneratedNextState();
        console.log(
          "[local-canonical] cleanup generated=.next action=removed_before_execution",
        );
      }
      if (
        plan.selected_plan === "full-canonical" &&
        windowsHelperState.required &&
        windowsHelperState.present_before
      ) {
        rmSync(generatedWindowsHelperRoot, { recursive: true, force: true });
        windowsHelperState.removed_before_execution = true;
        console.log(
          "[local-canonical] cleanup generated=native/windows-x64 action=removed_before_execution",
        );
      }
      const completed = await runPhasesSequentially({
        phases: phaseDefinitions,
        execute: (phase) => executePhase({
          phase,
          mode,
          runLogRoot,
          browserExecutablePath: hostResult.browserExecutablePath,
        }),
        onStart: (phase) => {
          console.log(
            `[local-canonical] phase_start id=${phase.id} timeout_ms=${phase.timeoutMs}`,
          );
        },
        onResult: (phase, result) => {
          const target = phaseReceipts.find(
            (candidate) => candidate.id === phase.id,
          );
          Object.assign(target, result);
          console.log(
            `[local-canonical] phase_result id=${phase.id} status=${result.status} duration_ms=${result.duration_ms}`,
          );
          if (result.status !== "pass") {
            console.error(
              `[local-canonical] failure phase=${phase.id} code=${result.failure_code}`,
            );
          }
        },
      });
      executionFailure =
        completed.length !== phaseDefinitions.length ||
        completed.some((result) => result.status !== "pass");
    }
  } catch (error) {
    executionFailure = true;
    cleanupComplete = false;
    cleanupReason = safeErrorCode(error);
    console.error(
      `[local-canonical] failure phase=executor code=${cleanupReason}`,
    );
  } finally {
    console.log("[local-canonical] cleanup_start");
    if (dependencyMaintenance && !dependencyMaintenanceRelease) {
      try {
        dependencyMaintenanceRelease = await releaseCompanionServiceMaintenance({
          repositoryRoot,
          lease: dependencyMaintenance.lease,
        });
      } catch (error) {
        cleanupComplete = false;
        cleanupReason = safeErrorCode(error);
      }
    }
    if (generatedNextManaged && generatedNextEntryPresent()) {
      try {
        nextState.removed_after_execution =
          removeBoundedGeneratedNextState();
      } catch (error) {
        cleanupComplete = false;
        cleanupReason = safeErrorCode(error);
      }
    }
    if (
      plan.selected_plan === "full-canonical" &&
      windowsHelperState.required &&
      existsSync(generatedWindowsHelperRoot)
    ) {
      try {
        rmSync(generatedWindowsHelperRoot, { recursive: true, force: true });
        windowsHelperState.removed_after_execution = true;
      } catch (error) {
        cleanupComplete = false;
        cleanupReason = safeErrorCode(error);
      }
    }
    try {
      enforceArtifactRetention({
        receiptMaximum: RECEIPT_RETENTION - 1,
        logMaximum: LOG_RUN_RETENTION,
      });
    } catch (error) {
      cleanupComplete = false;
      cleanupReason = safeErrorCode(error);
    }
    serviceLifecycleAfter = boundedLifecycleState(
      await inspectCompanionService({ repositoryRoot }),
    );
  }

  const serviceLifecycleRestored = lifecycleStateRestored(
    serviceLifecycleBefore,
    serviceLifecycleAfter,
  );
  if (!serviceLifecycleRestored) {
    executionFailure = true;
    cleanupComplete = false;
    cleanupReason ??= "companion_service_not_restored";
  }
  const generatedNextPresentAfter = generatedNextEntryPresent();
  if (generatedNextManaged && generatedNextPresentAfter) {
    executionFailure = true;
    cleanupComplete = false;
    cleanupReason ??= "generated_next_cleanup_incomplete";
  }
  const cleanupRemaining = phaseReceipts.some(
    (phase) =>
      phase.status !== "not_run" &&
      phase.cleanup.remaining_owned_processes !== 0,
  )
    ? "unknown"
    : "0";
  console.log(
    `[local-canonical] cleanup_result completed=${cleanupComplete} remaining_owned_processes=${cleanupRemaining} generated_next_present=${generatedNextPresentAfter} generated_windows_helper_present=${existsSync(generatedWindowsHelperRoot)}`,
  );

  let identityAfter;
  try {
    identityAfter = collectRepositoryIdentity(repositoryRoot);
  } catch (error) {
    identityAfter = {
      ...identityBefore,
      worktree_dirty: true,
    };
    executionFailure = true;
    preflightIssues.push(safeErrorCode(error));
  }
  if (
    !isPostExecutionIdentityValid({
      mode,
      expectedHeadSha: headSha,
      identityBefore,
      identityAfter,
    })
  ) {
    executionFailure = true;
    preflightIssues.push("post_execution_identity_mismatch");
  }
  if (!cleanupComplete) executionFailure = true;

  const allSelectedPhasesPassed =
    phaseReceipts.length > 0 &&
    phaseReceipts.every(
      (phase) =>
        phase.status === "pass" &&
        phase.exit_status === 0 &&
        phase.timed_out === false &&
        phase.cleanup.completed === true &&
        phase.cleanup.remaining_owned_processes === 0,
    );
  const passing =
    !executionFailure &&
    preflightIssues.length === 0 &&
    cleanupComplete &&
    allSelectedPhasesPassed;
  const deciding =
    passing &&
    mode !== "quick" &&
    nodePolicy.canonical_match &&
    !identityBefore.worktree_dirty &&
    !identityAfter.worktree_dirty;
  const finishedMs = Date.now();
  const finishedAt = new Date(finishedMs).toISOString();
  const remainingOwnedProcesses = phaseReceipts.some(
    (phase) =>
      phase.status !== "not_run" &&
      phase.cleanup.remaining_owned_processes !== 0,
  )
    ? null
    : 0;
  const reasonCodes = [
    ...preflightIssues,
    ...(cleanupReason ? [cleanupReason] : []),
    ...phaseReceipts
      .filter((phase) => phase.status === "failure")
      .map((phase) => phase.failure_code),
    ...(!allSelectedPhasesPassed ? ["selected_phases_incomplete"] : []),
    ...(mode === "quick" ? [worktreePolicy.reason] : []),
    ...(!nodePolicy.canonical_match ? ["canonical_node_mismatch"] : []),
  ];
  const receipt = finalizeReceipt({
    schema: LOCAL_CANONICAL_RECEIPT_SCHEMA,
    receipt_version: 1,
    repository: {
      repository_id: identityBefore.repository_id,
      origin: identityBefore.origin,
      base_sha: baseSha,
      head_sha: headSha,
      branch: identityBefore.branch,
      detached: identityBefore.detached,
      worktree_before: identityBefore.worktree_dirty ? "dirty" : "clean",
      worktree_after: identityAfter.worktree_dirty ? "dirty" : "clean",
    },
    evidence: {
      mode,
      planner_event: plan.planner_event,
      planner_status: plan.planner_status,
      planner_plan: plan.planner_plan,
      planner_reason: plan.planner_reason,
      planner_change_count: plan.planner_change_count ?? null,
      planner_changed_paths: plan.planner_changed_paths ?? [],
      planner_full_reasons: plan.planner_full_reasons ?? [],
      planner_owner_ids: plan.planner_owner_ids ?? [],
      planner_targeted_phase_ids: plan.planner_targeted_phase_ids ?? [],
      planner_error_code: plan.planner_error_code ?? null,
      planner_browser_phase_ids: plan.planner_browser_phase_ids ?? [],
      selected_plan: plan.selected_plan,
      deciding,
      transferable: deciding,
      worktree_policy: worktreePolicy.reason,
    },
    environment: {
      machine_fingerprint: machineFingerprint,
      operating_system: host.operating_system,
      operating_system_version: host.operating_system_version,
      operating_system_build: host.operating_system_build,
      architecture: host.architecture,
      node: {
        actual_version: nodePolicy.actual_version,
        path_version: host.path_node_version,
        canonical_version: CANONICAL_NODE_VERSION,
        compatibility_range: CANONICAL_NODE_COMPATIBILITY,
        canonical_match: nodePolicy.canonical_match,
        compatibility_match: nodePolicy.compatibility_match,
      },
      npm_version: host.npm_version,
      browser: host.browser,
      sleep_prevention: host.sleep_prevention,
      resources: {
        logical_cpu_count: host.logical_cpu_count,
        physical_memory_bytes: host.physical_memory_bytes,
        free_memory_bytes_at_start: host.free_memory_bytes_at_start,
        disk_free_bytes_at_start: host.disk_free_bytes_at_start,
        disk_free_bytes_at_finish:
          collectDiskObservation(repositoryRoot).free_bytes,
        disk_minimum_bytes: diskMinimumBytes,
      },
    },
    dependencies: {
      policy:
        plan.selected_plan === "full-canonical"
          ? "clean_npm_ci_root_and_nested"
          : plan.selected_plan === "operating-policy-only"
            ? "operating_policy_only_no_dependency_install"
            : plan.selected_plan === OWNER_TARGETED_PLAN
              ? "owner_targeted_clean_npm_ci_root_and_nested"
              : mode === "quick"
                ? "existing_installed_trees_feedback_only"
                : "documentation_only_no_dependency_install",
      download_cache: "npm_cache_reuse_permitted_not_authoritative",
      installed_trees:
        (plan.selected_plan === "full-canonical" ||
          plan.selected_plan === OWNER_TARGETED_PLAN) &&
        phaseReceipts
          .filter((phase) => phase.id.startsWith("dependencies-"))
          .length === OWNER_TARGETED_DEPENDENCY_PHASE_IDS.length &&
        phaseReceipts
          .filter((phase) => phase.id.startsWith("dependencies-"))
          .every((phase) => phase.status === "pass")
          ? "replaced_from_lockfiles_by_npm_ci"
          : plan.selected_plan === "full-canonical" ||
              plan.selected_plan === OWNER_TARGETED_PLAN
            ? "not_prepared_or_incomplete"
            : "not_deciding_authority",
      root_lock_sha256: locks.root,
      nested_lock_sha256: locks.nested,
    },
    executor: {
      version: LOCAL_CANONICAL_EXECUTOR_VERSION,
      source_files: EXECUTOR_SOURCE_FILES,
      source_fingerprint: executorFingerprint,
      scheduling:
        "outer_phases_sequential; existing integration runner retains isolated two-lane concurrency",
      resource_exclusive_phases: RESOURCE_EXCLUSIVE_PHASE_IDS,
    },
    phases: phaseReceipts,
    run: {
      started_at: startedAt,
      finished_at: finishedAt,
      duration_ms: finishedMs - startedMs,
    },
    cleanup: {
      completed: cleanupComplete && remainingOwnedProcesses === 0,
      remaining_owned_processes: remainingOwnedProcesses,
      companion_service: {
        before: serviceLifecycleBefore,
        after: serviceLifecycleAfter,
        maintenance_acquired: dependencyMaintenance?.acquired === true,
        maintenance_released:
          dependencyMaintenance === null ||
          dependencyMaintenanceRelease?.released === true ||
          dependencyMaintenance?.acquired === false,
        restored: serviceLifecycleRestored,
      },
      generated_next: {
        ...nextState,
        present_after: generatedNextPresentAfter,
      },
      generated_windows_helper: {
        ...windowsHelperState,
        present_after: existsSync(generatedWindowsHelperRoot),
      },
      artifact_retention: {
        receipt_files: RECEIPT_RETENTION,
        log_run_directories: LOG_RUN_RETENTION,
        maximum_phase_log_bytes: MAX_PHASE_LOG_BYTES,
      },
    },
    final: {
      result: passing ? "pass" : "failure",
      exit_status: passing ? 0 : 1,
      reason_codes: [...new Set(reasonCodes.filter(Boolean))].sort(),
      limitations: [
        `one local execution on one shared ${host.operating_system === "win32" ? "Windows" : "Mac"} host`,
        "content integrity is not independent cryptographic attestation",
        "no hosted reproduction or external status-check identity",
        "download-cache reuse does not make cached or installed dependencies authoritative",
      ],
    },
  });

  const receiptRelativePath = writeReceipt(receipt, {
    mode,
    headSha,
    startedAt,
  });
  console.log(
    `[local-canonical] receipt=${receiptRelativePath} fingerprint=${receipt.integrity.content_fingerprint}`,
  );
  console.log(
    `[local-canonical] final result=${receipt.final.result} deciding=${receipt.evidence.deciding} duration_ms=${receipt.run.duration_ms}`,
  );
  return {
    receipt,
    receiptRelativePath,
    exitCode: receipt.final.exit_status,
  };
}

function lifecycleStateRestored(before, after) {
  if (before.status === "live" || before.status === "starting") {
    return after.status === "live";
  }
  if (before.status === "installed_stopped") {
    return after.status === "installed_stopped";
  }
  return before.status === after.status &&
    before.checkout_relation === after.checkout_relation &&
    before.service_identity === after.service_identity;
}

export function validateReceiptAgainstCurrentRepository(relativeReceiptPath) {
  const receiptPath = resolveArtifactPath(relativeReceiptPath);
  const receipt = readReceiptFile(receiptPath);
  const identity = collectRepositoryIdentity(repositoryRoot);
  const locks = collectLockFingerprints();
  const executorFingerprint = computeExecutorSourceFingerprint();
  ensureBoundedLocalDirectory(repositoryRoot, artifactRoot);
  const host = collectHostEnvironment(repositoryRoot).public;
  const nodePolicy = evaluateNodePolicy();
  const machineFingerprint = ensureMachineFingerprint(artifactRoot);
  let expectedSelectedPlan = null;
  let expectedPhaseIds = null;
  let expectedOwnerIds = [];
  let expectedTargetedPhaseIds = [];
  let expectedBrowserPhaseIds = [...PERMANENT_BROWSER_PHASE_IDS];
  if (receipt?.evidence?.mode === "full") {
    const fullPlan = resolveVerificationPlan({
      mode: "full",
      baseSha: receipt?.repository?.base_sha,
      headSha: receipt?.repository?.head_sha,
    });
    expectedSelectedPlan = "full-canonical";
    expectedOwnerIds = fullPlan.planner_owner_ids ?? [];
    expectedTargetedPhaseIds = fullPlan.planner_targeted_phase_ids ?? [];
    expectedBrowserPhaseIds = fullPlan.planner_browser_phase_ids;
  } else if (receipt?.evidence?.mode === "changed") {
    const changedPlan = resolveVerificationPlan({
      mode: "changed",
      baseSha: receipt?.repository?.base_sha,
      headSha: receipt?.repository?.head_sha,
    });
    expectedSelectedPlan = changedPlan.selected_plan;
    expectedOwnerIds = changedPlan.planner_owner_ids ?? [];
    expectedTargetedPhaseIds =
      changedPlan.planner_targeted_phase_ids ?? [];
    expectedBrowserPhaseIds = changedPlan.planner_browser_phase_ids;
  } else if (receipt?.evidence?.mode === "quick") {
    expectedSelectedPlan = "quick-feedback";
  }
  if (expectedSelectedPlan) {
    expectedPhaseIds = buildPhasePlan({
      mode: receipt.evidence.mode,
      selectedPlan: expectedSelectedPlan,
      baseSha: receipt?.repository?.base_sha,
      headSha: receipt?.repository?.head_sha,
      browserPhaseIds: expectedBrowserPhaseIds,
      targetedPhaseIds: expectedTargetedPhaseIds,
    }).map((phase) => phase.id);
  }
  return inspectReceiptForDecision(receipt, {
    currentIdentity: identity,
    currentLocks: locks,
    currentExecutorFingerprint: executorFingerprint,
    expectedSelectedPlan,
    expectedPhaseIds,
    expectedOwnerIds,
    expectedTargetedPhaseIds,
    currentEnvironment: {
      machine_fingerprint: machineFingerprint,
      operating_system: host.operating_system,
      operating_system_version: host.operating_system_version,
      operating_system_build: host.operating_system_build,
      architecture: host.architecture,
      npm_version: host.npm_version,
      node: {
        actual_version: nodePolicy.actual_version,
        path_version: host.path_node_version,
        canonical_version: CANONICAL_NODE_VERSION,
        compatibility_range: CANONICAL_NODE_COMPATIBILITY,
      },
    },
  });
}

function quickPhases() {
  return [
    npmPhase("typecheck", "TypeScript typecheck", ["run", "typecheck"], 300_000),
    phaseDefinition({
      id: "local-executor-contract",
      label: "local canonical executor contract",
      command: process.execPath,
      args: ["scripts/test-local-canonical-executor.mjs"],
      display: "node scripts/test-local-canonical-executor.mjs",
      timeoutMs: 60_000,
    }),
    phaseDefinition({
      id: "local-receipt-contract",
      label: "local canonical receipt contract",
      command: process.execPath,
      args: ["scripts/test-local-canonical-receipt.mjs"],
      display: "node scripts/test-local-canonical-receipt.mjs",
      timeoutMs: 60_000,
    }),
    phaseDefinition({
      id: "local-pr-evidence-contract",
      label: "local canonical PR evidence contract",
      command: process.execPath,
      args: ["scripts/test-local-canonical-pr-evidence.mjs"],
      display: "node scripts/test-local-canonical-pr-evidence.mjs",
      timeoutMs: 60_000,
    }),
    phaseDefinition({
      id: "local-pr-evidence-transport-contract",
      label: "local canonical PR evidence transport contract",
      command: process.execPath,
      args: [
        "scripts/test-local-canonical-pr-evidence-transport.mjs",
      ],
      display:
        "node scripts/test-local-canonical-pr-evidence-transport.mjs",
      timeoutMs: 60_000,
    }),
    phaseDefinition({
      id: "local-canonical-contract",
      label: "existing local Canonical contract",
      command: process.execPath,
      args: ["scripts/test-local-canonical-verification-contract.mjs"],
      display: "node scripts/test-local-canonical-verification-contract.mjs",
      timeoutMs: 60_000,
    }),
  ];
}

function operatingPolicyPhases({ baseSha, headSha }) {
  return [
    phaseDefinition({
      id: "operating-policy-validator",
      label: "exact-head operating-policy Markdown validator",
      command: process.execPath,
      args: [
        "scripts/validate-canonical-docs-change.mjs",
        "--base",
        baseSha,
        "--head",
        headSha,
        "--plan",
        "operating-policy-only",
      ],
      display:
        `node scripts/validate-canonical-docs-change.mjs --base ${baseSha} --head ${headSha} --plan operating-policy-only`,
      timeoutMs: 120_000,
    }),
    phaseDefinition({
      id: "operating-policy-planner-contract",
      label: "operating-policy planner contract",
      command: process.execPath,
      args: ["scripts/test-canonical-change-planner.mjs"],
      display: "node scripts/test-canonical-change-planner.mjs",
      timeoutMs: 60_000,
    }),
    phaseDefinition({
      id: "operating-policy-executor-contract",
      label: "operating-policy local executor contract",
      command: process.execPath,
      args: ["scripts/test-local-canonical-executor.mjs"],
      display: "node scripts/test-local-canonical-executor.mjs",
      timeoutMs: 60_000,
    }),
    phaseDefinition({
      id: "operating-policy-receipt-contract",
      label: "operating-policy local receipt contract",
      command: process.execPath,
      args: ["scripts/test-local-canonical-receipt.mjs"],
      display: "node scripts/test-local-canonical-receipt.mjs",
      timeoutMs: 60_000,
    }),
    phaseDefinition({
      id: "operating-policy-verification-contract",
      label: "repository operating-policy verification contract",
      command: process.execPath,
      args: ["scripts/test-local-canonical-verification-contract.mjs"],
      display: "node scripts/test-local-canonical-verification-contract.mjs",
      timeoutMs: 60_000,
    }),
  ];
}

function ownerTargetedPhases({ baseSha, headSha, targetedPhaseIds }) {
  if (
    !Array.isArray(targetedPhaseIds) ||
    targetedPhaseIds.length < 4 ||
    targetedPhaseIds[0] !== "targeted-change-validator" ||
    targetedPhaseIds[1] !== "dependencies-root" ||
    targetedPhaseIds[2] !== "dependencies-nested" ||
    new Set(targetedPhaseIds).size !== targetedPhaseIds.length ||
    JSON.stringify(targetedPhaseIds) !==
      JSON.stringify(
        TARGETED_PHASE_ORDER.filter((phaseId) =>
          targetedPhaseIds.includes(phaseId)
        ),
      )
  ) {
    const error = new Error("invalid owner-targeted phase inventory");
    error.code = "invalid_owner_targeted_phase_inventory";
    throw error;
  }
  return targetedPhaseIds.map((phaseId) => {
    if (phaseId === "targeted-change-validator") {
      return phaseDefinition({
        id: phaseId,
        label: "exact-head owner-targeted change validator",
        command: process.execPath,
        args: [
          "scripts/validate-canonical-docs-change.mjs",
          "--base",
          baseSha,
          "--head",
          headSha,
          "--plan",
          OWNER_TARGETED_PLAN,
        ],
        display:
          `node scripts/validate-canonical-docs-change.mjs --base ${baseSha} --head ${headSha} --plan ${OWNER_TARGETED_PLAN}`,
        timeoutMs: 120_000,
      });
    }
    return targetedCanonicalPhaseDefinition(phaseId, { baseSha, headSha });
  });
}

function targetedCanonicalPhaseDefinition(id, { baseSha, headSha }) {
  const canonicalSuitePhases = {
    "dependencies-root": () =>
      npmPhase(
        "dependencies-root",
        "root clean dependency installation",
        ["ci", "--no-audit", "--no-fund"],
        600_000,
      ),
    "dependencies-nested": () =>
      npmPhase(
        "dependencies-nested",
        "nested application clean dependency installation",
        ["ci", "--no-audit", "--no-fund"],
        600_000,
        "nested-app",
      ),
    typecheck: () =>
      npmPhase("typecheck", "TypeScript typecheck", ["run", "typecheck"], 300_000),
    unit: () => npmPhase("unit", "Canonical unit suite", ["test"], 3_600_000),
    authority: () =>
      npmPhase(
        "authority",
        "Canonical authority suite",
        ["run", "test:authority"],
        2_400_000,
      ),
    integration: () =>
      npmPhase(
        "integration",
        "Canonical integration suite",
        ["run", "test:integration"],
        4_200_000,
      ),
    operability: () =>
      npmPhase(
        "operability",
        "Canonical operability suite",
        ["run", "test:operability"],
        1_800_000,
      ),
  };
  if (Object.hasOwn(canonicalSuitePhases, id)) {
    return canonicalSuitePhases[id]();
  }
  if (PERMANENT_BROWSER_PHASE_IDS.includes(id)) {
    return browserPhaseDefinition(id, { baseSha, headSha });
  }
  const error = new Error(`unsupported owner-targeted phase: ${id}`);
  error.code = "unsupported_owner_targeted_phase";
  throw error;
}

function fullPhases({ baseSha, headSha, browserPhaseIds }) {
  // Suite-level bounds cover the sum of their existing finite child bounds and
  // cleanup margin. They do not replace or widen any child-owned timeout.
  return [
    npmPhase(
      "dependencies-root",
      "root clean dependency installation",
      ["ci", "--no-audit", "--no-fund"],
      600_000,
    ),
    npmPhase(
      "dependencies-nested",
      "nested application clean dependency installation",
      ["ci", "--no-audit", "--no-fund"],
      600_000,
      "nested-app",
    ),
    ...(process.platform === "win32"
      ? [
          npmPhase(
            "native-windows-identity",
            "fresh Windows physical-root helper build",
            ["run", "build:native:windows-identity"],
            120_000,
          ),
        ]
      : []),
    npmPhase("typecheck", "TypeScript typecheck", ["run", "typecheck"], 300_000),
    npmPhase("build", "isolated production build", ["run", "build"], 600_000),
    npmPhase("unit", "Canonical unit suite", ["test"], 3_600_000),
    npmPhase(
      "authority",
      "Canonical authority suite",
      ["run", "test:authority"],
      2_400_000,
    ),
    npmPhase(
      "integration",
      "Canonical integration suite",
      ["run", "test:integration"],
      4_200_000,
    ),
    npmPhase(
      "operability",
      "Canonical operability suite",
      ["run", "test:operability"],
      1_800_000,
    ),
    ...browserPhaseIds.map((id) =>
      browserPhaseDefinition(id, { baseSha, headSha }),
    ),
  ];
}

function browserPhaseDefinition(id, { baseSha, headSha }) {
  const definitions = {
    "e2e-project-experience": {
      label: "Canonical project experience Browser owner",
      suite: "e2e-project-experience",
      timeoutMs: 480_000,
    },
    "e2e-operator-review-control": {
      label: "Canonical operator review and control Browser owner",
      suite: "e2e-operator-review-control",
      timeoutMs: 420_000,
    },
    "e2e-operator-native-host-execution": {
      label: "Canonical operator native-host Browser owner",
      suite: "e2e-operator-native-host-execution",
      timeoutMs: 420_000,
    },
    "e2e-operator-multi-candidate": {
      label: "Canonical operator multi-candidate Browser owner",
      suite: "e2e-operator-multi-candidate",
      timeoutMs: 420_000,
    },
    "e2e-continuity": {
      label: "Canonical continuity Browser owner",
      suite: "e2e-continuity",
      timeoutMs: 600_000,
    },
    "e2e-golden": {
      label: "Canonical cross-boundary golden Browser path",
      suite: "e2e-golden",
      timeoutMs: 420_000,
    },
  };
  const selected = definitions[id];
  if (!selected) {
    const error = new Error(`unsupported_browser_phase:${id}`);
    error.code = "unsupported_browser_phase";
    throw error;
  }
  return phaseDefinition({
    id,
    label: selected.label,
    command: process.execPath,
    args: ["scripts/run-canonical-test-suite.mjs", selected.suite],
    display: `node scripts/run-canonical-test-suite.mjs ${selected.suite}`,
    timeoutMs: selected.timeoutMs,
    browser: true,
    baseSha,
    headSha,
  });
}

function npmPhase(id, label, args, timeoutMs, cwdScope = "root") {
  const windowsNpmCli = path.join(
    path.dirname(process.execPath),
    "node_modules",
    "npm",
    "bin",
    "npm-cli.js",
  );
  return phaseDefinition({
    id,
    label,
    command: process.platform === "win32" ? process.execPath : "npm",
    args: process.platform === "win32" ? [windowsNpmCli, ...args] : args,
    display: `npm ${args.join(" ")}`,
    timeoutMs,
    cwdScope,
  });
}

function phaseDefinition({
  id,
  label,
  command,
  args,
  display,
  timeoutMs,
  cwdScope = "root",
  browser = false,
  baseSha = null,
  headSha = null,
}) {
  return {
    id,
    label,
    command,
    args,
    display,
    timeoutMs,
    cwdScope,
    exclusive: RESOURCE_EXCLUSIVE_PHASE_IDS.includes(id),
    browser,
    base_sha: baseSha,
    head_sha: headSha,
  };
}

async function executePhase({
  phase,
  mode,
  runLogRoot,
  browserExecutablePath = null,
}) {
  const startedMs = Date.now();
  const startedAt = new Date(startedMs).toISOString();
  const logRelativePath = path.posix.join(
    LOCAL_ARTIFACT_DIRECTORY,
    "logs",
    path.basename(runLogRoot),
    `${phase.id}.log`,
  );
  const logPath = path.join(repositoryRoot, logRelativePath);
  const capture = createBoundedCapture(logPath);
  let result;
  try {
    result = await runCanonicalChild({
      suite: `local-${mode}`,
      label: phase.label,
      command: phase.command,
      args: phase.args,
      cwd: phase.cwdScope === "nested-app" ? nestedAppRoot : repositoryRoot,
      env: buildLocalPhaseEnvironment(process.env, {
        browserExecutablePath: phase.browser ? browserExecutablePath : null,
      }),
      timeoutMs: phase.timeoutMs,
      stdout: capture.stdout,
      stderr: capture.stderr,
    });
  } catch (error) {
    capture.close();
    const finishedMs = Date.now();
    return {
      id: phase.id,
      label: phase.label,
      command: phase.display,
      cwd_scope: phase.cwdScope,
      exclusive: phase.exclusive,
      browser: phase.browser,
      base_sha: phase.base_sha,
      head_sha: phase.head_sha,
      status: "failure",
      started_at: startedAt,
      finished_at: new Date(finishedMs).toISOString(),
      duration_ms: finishedMs - startedMs,
      exit_status: null,
      timed_out: false,
      failure_code: safeErrorCode(error),
      cleanup: {
        completed: false,
        remaining_owned_processes: null,
      },
      log: capture.summary(logRelativePath),
    };
  }
  capture.close();
  const finishedMs = Date.now();
  const lifecyclePassed =
    phase.browser !== true ||
    (result.termination_reason === "natural_exit" &&
      result.exit_observed === true &&
      result.streams_closed === true);
  const passed =
    result.exit_code === 0 &&
    result.timed_out === false &&
    result.cleanup_completed === true &&
    result.remaining_owned_processes === 0 &&
    lifecyclePassed;
  return {
    id: phase.id,
    label: phase.label,
    command: phase.display,
    cwd_scope: phase.cwdScope,
    exclusive: phase.exclusive,
    browser: phase.browser,
    base_sha: phase.base_sha,
    head_sha: phase.head_sha,
    status: passed ? "pass" : "failure",
    started_at: startedAt,
    finished_at: new Date(finishedMs).toISOString(),
    duration_ms: result.duration_ms,
    exit_status: result.exit_code,
    timed_out: result.timed_out,
    failure_code: passed
      ? null
      : result.timed_out
        ? "phase_timed_out"
        : result.exit_code !== 0
          ? "phase_failed"
          : "phase_cleanup_incomplete",
    cleanup: {
      completed: result.cleanup_completed,
      remaining_owned_processes: result.remaining_owned_processes,
      termination_reason: result.termination_reason,
      exit_observed: result.exit_observed,
      streams_closed: result.streams_closed,
      listener_residue_count: passed && phase.browser ? 0 : null,
    },
    log: capture.summary(logRelativePath),
  };
}

function notRunPhaseReceipt(phase) {
  return {
    id: phase.id,
    label: phase.label,
    command: phase.display,
    cwd_scope: phase.cwdScope,
    exclusive: phase.exclusive,
    browser: phase.browser,
    base_sha: phase.base_sha,
    head_sha: phase.head_sha,
    status: "not_run",
    started_at: null,
    finished_at: null,
    duration_ms: null,
    exit_status: null,
    timed_out: false,
    failure_code: "phase_not_run",
    cleanup: {
      completed: false,
      remaining_owned_processes: null,
      termination_reason: null,
      exit_observed: false,
      streams_closed: false,
      listener_residue_count: null,
    },
    log: {
      relative_path: null,
      bytes: 0,
      truncated: false,
    },
  };
}

function createBoundedCapture(logPath) {
  ensureBoundedLocalDirectory(repositoryRoot, path.dirname(logPath));
  const descriptor = openSync(logPath, "wx", 0o600);
  let bytes = 0;
  let truncated = false;
  let closed = false;
  const write = (destination, chunk) => {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    destination.write(buffer);
    const remaining = MAX_PHASE_LOG_BYTES - bytes;
    if (remaining > 0) {
      const bounded = buffer.subarray(0, remaining);
      writeSync(descriptor, bounded);
      bytes += bounded.length;
    }
    if (buffer.length > remaining) truncated = true;
  };
  return {
    stdout: { write: (chunk) => write(process.stdout, chunk) },
    stderr: { write: (chunk) => write(process.stderr, chunk) },
    close() {
      if (!closed) {
        closeSync(descriptor);
        closed = true;
      }
    },
    summary(relativePath) {
      return {
        relative_path: relativePath,
        bytes,
        truncated,
      };
    },
  };
}

function collectLockFingerprints() {
  return {
    root: hashFile(path.join(repositoryRoot, "package-lock.json")),
    nested: hashFile(
      path.join(repositoryRoot, "apps", "augnes_apps", "package-lock.json"),
    ),
  };
}

function buildLocalPhaseEnvironment(
  ambientEnvironment = process.env,
  { browserExecutablePath = null } = {},
) {
  const environment = {};
  for (const key of [
    ...CANONICAL_AMBIENT_ENVIRONMENT_ALLOWLIST,
    ...CANONICAL_OPTIONAL_AMBIENT_ENVIRONMENT_ALLOWLIST,
  ]) {
    const value = ambientEnvironment[key];
    if (typeof value === "string" && value.length > 0) {
      environment[key] = value;
    }
  }
  if (browserExecutablePath) {
    environment.AUGNES_BROWSER_EXECUTABLE_PATH = browserExecutablePath;
  }
  return environment;
}

function writeReceipt(receipt, { mode, headSha, startedAt }) {
  ensureBoundedLocalDirectory(repositoryRoot, receiptRoot);
  const fileName = `${startedAt.replace(/[:.]/gu, "-")}-${mode}-${headSha.slice(0, 12)}.json`;
  const receiptPath = path.join(receiptRoot, fileName);
  writeFileSync(receiptPath, `${canonicalSerialize(receipt)}\n`, {
    encoding: "utf8",
    flag: "wx",
    mode: 0o600,
  });
  return path.posix.join(
    LOCAL_ARTIFACT_DIRECTORY,
    "receipts",
    fileName,
  );
}

function resolveArtifactPath(relativeReceiptPath) {
  if (
    typeof relativeReceiptPath !== "string" ||
    relativeReceiptPath.length === 0 ||
    path.isAbsolute(relativeReceiptPath)
  ) {
    const error = new Error("receipt path must be repository-relative");
    error.code = "invalid_receipt_path";
    throw error;
  }
  const resolved = path.resolve(repositoryRoot, relativeReceiptPath);
  const relative = path.relative(artifactRoot, resolved);
  if (
    relative === "" ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    const error = new Error("receipt path escapes the local artifact root");
    error.code = "receipt_path_escape";
    throw error;
  }
  if (!existsSync(resolved)) {
    const error = new Error("receipt file does not exist");
    error.code = "missing_receipt_file";
    throw error;
  }
  const stats = lstatSync(resolved);
  if (!stats.isFile() || stats.isSymbolicLink()) {
    const error = new Error("receipt path must be a real file");
    error.code = "unsafe_receipt_file";
    throw error;
  }
  const realArtifactRoot = realpathSync(artifactRoot);
  const realReceiptPath = realpathSync(resolved);
  const realRelative = path.relative(realArtifactRoot, realReceiptPath);
  if (
    realRelative === "" ||
    realRelative === ".." ||
    realRelative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(realRelative)
  ) {
    const error = new Error("receipt file resolves outside the artifact root");
    error.code = "receipt_path_escape";
    throw error;
  }
  return realReceiptPath;
}

function enforceArtifactRetention({
  receiptMaximum = RECEIPT_RETENTION,
  logMaximum = LOG_RUN_RETENTION,
} = {}) {
  ensureBoundedLocalDirectory(repositoryRoot, receiptRoot);
  ensureBoundedLocalDirectory(repositoryRoot, logRoot);
  retainNewestFiles(receiptRoot, receiptMaximum, (entry) =>
    entry.isFile() && entry.name.endsWith(".json"),
  );
  retainNewestFiles(logRoot, logMaximum, (entry) => entry.isDirectory());
}

function retainNewestFiles(root, maximum, include) {
  if (!existsSync(root)) return;
  const ownedEntries = readdirSync(root, { withFileTypes: true })
    .filter(include)
    .map((entry) => {
      const entryPath = path.join(root, entry.name);
      return {
        entryPath,
        modified: statSync(entryPath).mtimeMs,
      };
    })
    .sort((left, right) => right.modified - left.modified);
  for (const entry of ownedEntries.slice(maximum)) {
    rmSync(entry.entryPath, { recursive: true, force: true });
  }
}

function safeRunId(startedAt, mode, headSha) {
  return `${startedAt.replace(/[:.]/gu, "-")}-${mode}-${headSha.slice(0, 12)}`;
}

function safeErrorCode(error) {
  const candidate = error?.code;
  if (
    typeof candidate === "string" &&
    /^[a-z0-9_.:-]{1,80}$/u.test(candidate)
  ) {
    return candidate;
  }
  return "local_canonical_failure";
}

function compareCodeUnits(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function parseCli(argv) {
  const mode = argv[0];
  if (!VALID_MODES.has(mode)) {
    const error = new Error(
      "usage: run-local-canonical-verification.mjs <quick|changed|full|validate>",
    );
    error.code = "invalid_local_canonical_mode";
    throw error;
  }
  const options = new Map();
  for (let index = 1; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || value === undefined) {
      const error = new Error(
        "local canonical arguments must be --key value pairs",
      );
      error.code = "invalid_local_canonical_arguments";
      throw error;
    }
    const normalized = key.slice(2);
    if (options.has(normalized)) {
      const error = new Error("duplicate local canonical argument");
      error.code = "duplicate_local_canonical_argument";
      throw error;
    }
    options.set(normalized, value);
  }
  const allowed =
    mode === "validate" ? new Set(["receipt"]) : new Set(["base", "head"]);
  for (const key of options.keys()) {
    if (!allowed.has(key)) {
      const error = new Error("unknown local canonical argument");
      error.code = "unknown_local_canonical_argument";
      throw error;
    }
  }
  if (mode === "validate" && !options.get("receipt")) {
    const error = new Error("validate mode requires --receipt");
    error.code = "missing_receipt_argument";
    throw error;
  }
  if (
    (mode === "changed" || mode === "full") &&
    (!options.get("base") || !options.get("head"))
  ) {
    const error = new Error(
      `${mode} mode requires exact --base and --head SHAs`,
    );
    error.code = "missing_exact_git_identity";
    throw error;
  }
  return {
    mode,
    baseSha: options.get("base") ?? null,
    headSha: options.get("head") ?? null,
    receipt: options.get("receipt") ?? null,
  };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const command = parseCli(process.argv.slice(2));
    if (command.mode === "validate") {
      const result = validateReceiptAgainstCurrentRepository(command.receipt);
      console.log(JSON.stringify(result));
      process.exitCode = result.valid_deciding_evidence ? 0 : 1;
    } else {
      const result = await executeLocalCanonicalVerification(command);
      process.exitCode = result.exitCode;
    }
  } catch (error) {
    console.error(
      `[local-canonical] fatal code=${safeErrorCode(error)} message=${error instanceof Error ? error.message : "unknown failure"}`,
    );
    process.exitCode = 1;
  }
}
