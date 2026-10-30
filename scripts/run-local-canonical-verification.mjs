#!/usr/bin/env node
import { isCompanionTimeout, authorizeCompanionTimeout } from "./local-canonical-companion-timeout-succession.mjs";

import { isObserverRepair, authorizeObserverRepair } from "./local-canonical-observer-succession.mjs";
import { isCorrectedTimeout, authorizeCorrectedTimeout } from "./local-canonical-timeout-succession.mjs";

import { createHash, randomBytes } from "node:crypto";
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
import os from "node:os";
import { freezeInputContract, monitorInputContract, digest, deriveOperationalDisposition, createInputReader, classifyInputChange, nonFaultInputChange, inputReadOptions, commonInputResources, supportedInputContract, createGitTrackingResource } from "./local-canonical-inputs.mjs";
import { readBrowserInputBinding, browserInputEnvironment, selectedBrowserInput, acquireBrowserInputGuard, releaseBrowserInputGuard, assertBrowserInputGuard } from "./local-canonical-browser-input.mjs";
import { readBrowserReplacementProof, authorizeBrowserReplacement, BROWSER_REPLACEMENT_PHASES, isStrictBrowserSourceRevision } from "./local-canonical-browser-replacement.mjs";
import { beginAttempt, finishAttempt, readRecoveryProof, readSourceCorrectionProof, inspectAttemptRecords } from "./local-canonical-attempts.mjs";
import { pinVerificationEvidence, readPinnedEvidence } from "./local-canonical-evidence-retention.mjs";
import { BROWSER_IDENTITY_PREFIX, validPhaseBrowserUse, browserConsumersForPhase, MAX_BROWSER_USE_RECORDS, parseBrowserUseLine } from "./local-canonical-browser-identity.mjs";
import { fileURLToPath } from "node:url";

import {
  OWNER_TARGETED_PLAN,
  OWNER_TARGETED_DEPENDENCY_PHASE_IDS,
  PERMANENT_BROWSER_PHASE_IDS,
  TARGETED_PHASE_ORDER,
  planCanonicalChange,
} from "./canonical-change-planner.mjs";
import { runCanonicalChild } from "./canonical-child-runner.mjs";
import { CODEX_REUSE_PHASE_IDS } from "./codex-reuse-verification-ownership.mjs";
import { admitIntegrationBase } from "./local-canonical-integration-base.mjs";
import { admitVerificationContext, assertVerificationContext, verificationAnchorRoot, inspectVerificationCompanionPreservation } from "./local-canonical-verification-context.mjs";
import { acquireVerificationCapacity, assertVerificationCapacity, releaseVerificationCapacity } from "./local-canonical-capacity.mjs";
import { createIsolatedInvocationResources, isolatedInvocationEnvironment, cleanupIsolatedInvocationResources } from "./local-canonical-isolated-resources.mjs";
import { R8A_PROVISION_MANIFEST } from "./merged-r8a-dependency-provision.mjs";
import { DURABLE_PROVISION_MANIFEST } from "./durable-work-dependency-provision.mjs";
import { prepareHistoricalInputs, finishHistoricalInputs } from "./local-canonical-historical-inputs.mjs";
import {
  acquireCheckoutVerificationOwnership,
  assertCheckoutVerificationOwnership,
  checkoutVerificationFingerprint,
  releaseCheckoutVerificationOwnership,
  requiresCheckoutVerificationOwnership,
} from "./local-canonical-checkout-ownership.mjs";
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
  readMachineFingerprint,
  evaluateNodePolicy,
  hashFile,
  runGit,
} from "./local-canonical-environment.mjs";
import {
  LOCAL_CANONICAL_EXECUTOR_VERSION,
  LOCAL_CANONICAL_RECEIPT_SCHEMA,
  LOCAL_CANONICAL_RECEIPT_VERSION,
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
const webPlanningRoot = path.join(repositoryRoot, "apps", "web_planning");
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
  "scripts/local-canonical-browser-bundle.mjs",
  "scripts/local-canonical-browser-input.mjs",
  "scripts/local-canonical-browser-replacement.mjs",
  "scripts/browser-verification-owners.v1.json",
  "scripts/canonical-change-planner.mjs",
  "scripts/codex-reuse-verification-ownership.mjs",
  "scripts/canonical-research-registration.mjs",
  "scripts/canonical-research-tests.v1.json",
  "scripts/run-canonical-test-suite.mjs",
  "scripts/canonical-child-runner.mjs",
  "scripts/canonical-test-environment.mjs",
  "scripts/canonical-repository-identity.mjs",
  "scripts/local-canonical-environment.mjs",
  "scripts/merged-r8a-dependency-provision.mjs",
  "scripts/merged-r8a-fixture-dependencies.mjs",
  "scripts/prepare-merged-r8a-dependencies.mjs",
  "plugins/augnes-operator/mcp/node-runtime-policy.mjs",
  "scripts/local-canonical-change-owners.v1.json",
  "scripts/local-canonical-receipt.mjs",
  "scripts/local-canonical-inputs.mjs",
  "scripts/local-canonical-attempts.mjs",
  "scripts/local-canonical-observer-succession.mjs",
  "scripts/local-canonical-timeout-succession.mjs",
  "scripts/local-canonical-companion-timeout-succession.mjs",
  "scripts/local-canonical-evidence-retention.mjs",
  "scripts/local-canonical-review-export.mjs",
  "scripts/export-local-canonical-review.mjs",
  "scripts/local-canonical-browser-identity.mjs",
  "scripts/browser-validate-project-experience-v1.mjs",
  "scripts/browser-validate-continuity-v1.mjs",
  "scripts/operator-execution-browser-lifecycle-v1.mjs",
  "scripts/test-durable-work-surfaces.ts",
  "scripts/test-durable-work-resumption.ts",
  "scripts/test-cumulative-work-history.ts",
  "scripts/test-project-client-browser.ts",
  "scripts/browser-validate-web-planning.mjs",
  "scripts/test-operator-browser-navigation-diagnostics-v1.mjs",
  "scripts/local-canonical-integration-base.mjs",
  "scripts/github-main-branch-transport.mjs",
  "scripts/local-canonical-checkout-ownership.mjs",
  "scripts/local-canonical-verification-context.mjs",
  "scripts/local-canonical-capacity.mjs",
  "scripts/local-canonical-isolated-resources.mjs",
  "scripts/local-canonical-historical-inputs.mjs",
  "scripts/canonical-historical-evidence.mjs",
  "scripts/local-process-ownership.mjs",
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
  "dependencies-web-planning",
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
  "e2e-operator-work-expectation",
  "e2e-operator-multi-candidate",
  "e2e-continuity",
  "e2e-golden",
]);
export const RESOURCE_EXCLUSIVE_PHASE_IDS = Object.freeze([
  "dependencies-root",
  "dependencies-nested",
  "dependencies-web-planning",
  ...(process.platform === "win32" ? ["native-windows-identity"] : []),
  "build",
  "unit",
  ...CODEX_REUSE_PHASE_IDS,
  "authority",
  "integration",
  "operability",
  "e2e-project-experience",
  "e2e-operator-review-control",
  "e2e-operator-native-host-execution",
  "e2e-operator-work-expectation",
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
  checkoutOwner,
} = {}) {
  assertCheckoutVerificationOwnership(checkoutOwner, root);
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

export async function admitAndResolveVerificationPlan({
  mode, baseSha, headSha, root = repositoryRoot, transport, planner,
}) {
  const integrationBase = mode === "quick" ? null : await admitIntegrationBase({
    repositoryRoot: root, baseSha, headSha, transport,
  });
  // A refused base must never reach responsibility selection, including its
  // fail-closed-to-full fallback. Preserve a failed receipt with no phases.
  const plan = integrationBase?.status === "refused" ? {
    planner_event: "pull_request",
    planner_status: "not_run",
    planner_plan: null,
    selected_plan: "not-admitted",
    planner_reason: integrationBase.reason_code,
  } : resolveVerificationPlan({ mode, baseSha, headSha, planner });
  return { integrationBase, plan };
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
  signal,
}) {
  const results = [];
  for (const phase of phases) {
    if (signal?.aborted) break;
    onStart(phase);
    if (signal?.aborted) break;
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
  checkoutContext = "canonical",
  signal: externalSignal,
  recoveryProofPath = null,
  sourceCorrectionProofPath = null,
  browserReplacementProofPath = null,
}) {
  const controller = new AbortController();
  const forwardCancellation = () => controller.abort({ disposition: "user_cancellation" });
  externalSignal?.addEventListener("abort", forwardCancellation, { once: true });
  if (externalSignal?.aborted) forwardCancellation();
  const signal = controller.signal;
  const startedMs = Date.now();
  const startedAt = new Date(startedMs).toISOString();
  const verificationContext = admitVerificationContext({ repositoryRoot, kind: checkoutContext });
  const identityBefore = collectRepositoryIdentity(repositoryRoot, { verificationContext });
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

  const { integrationBase, plan } = await admitAndResolveVerificationPlan({
    mode, baseSha, headSha,
  });

  const browserReplacement = browserReplacementProofPath ? readBrowserReplacementProof(browserReplacementProofPath, repositoryRoot) : null;
  const sourceCorrection = sourceCorrectionProofPath ? readSourceCorrectionProof(resolveArtifactPath(sourceCorrectionProofPath), repositoryRoot) : null;
  if (isObserverRepair(sourceCorrection) && (mode !== "full" || checkoutContext !== "isolated-worktree" || recoveryProofPath || browserReplacement || plan.selected_plan !== "full-canonical"))
    throw Object.assign(new Error("observer_full_route_required"), { code: "observer_full_route_required" });
  if (isCompanionTimeout(sourceCorrection) && (mode !== "full" || checkoutContext !== "isolated-worktree" || recoveryProofPath || browserReplacement || plan.selected_plan !== "full-canonical"))
    throw Object.assign(new Error("companion_timeout_full_route_required"), { code: "companion_timeout_full_route_required" });
  if (isCorrectedTimeout(sourceCorrection) && (mode !== "full" || checkoutContext !== "isolated-worktree" || recoveryProofPath || browserReplacement || plan.selected_plan !== "full-canonical"))
    throw Object.assign(new Error("timeout_full_route_required"), { code: "timeout_full_route_required" });
  const strictProof = browserReplacement ?? (isStrictBrowserSourceRevision(sourceCorrection) ? sourceCorrection : null);
  const browserInput = strictProof ? readBrowserInputBinding(strictProof.browser_input_path, repositoryRoot) : selectedBrowserInput({ repositoryRoot });
  if ((browserInput && !strictProof) || (strictProof && (mode !== "full" || checkoutContext !== "isolated-worktree" || recoveryProofPath)) || (browserReplacement && sourceCorrection)) throw Object.assign(new Error("browser_replacement_route_required"), { code: "browser_replacement_route_required" });
  const hostResult = collectHostEnvironment(repositoryRoot, { browserInput });
  const host = hostResult.public;
  const nodePolicy = evaluateNodePolicy();
  const locks = collectLockFingerprints();
  const executorFingerprint = computeExecutorSourceFingerprint();
  ensureBoundedLocalDirectory(repositoryRoot, artifactRoot);
  const machineFingerprint = ensureMachineFingerprint(ensureBoundedLocalDirectory(
    verificationAnchorRoot(verificationContext),
    path.join(verificationAnchorRoot(verificationContext), LOCAL_ARTIFACT_DIRECTORY),
  ));
  const runId = safeRunId(startedAt, mode, headSha);
  const invocationId = randomBytes(16).toString("hex");
  const runLogRoot = path.join(logRoot, runId);
  const worktreePolicy = evaluateWorktreePolicy({
    mode,
    worktreeDirty: identityBefore.worktree_dirty,
  });
  const phaseDefinitions = integrationBase?.status === "refused" ? [] : buildPhasePlan({
    mode,
    selectedPlan: plan.selected_plan,
    baseSha,
    headSha,
    browserPhaseIds: plan.planner_browser_phase_ids,
    targetedPhaseIds: plan.planner_targeted_phase_ids,
  });
  const phaseReceipts = phaseDefinitions.map(phase => ({ ...notRunPhaseReceipt(phase), invocation_id: invocationId }));
  let serviceLifecycleBefore = null;
  let serviceLifecycleAfter = null;
  let serviceObservations = { before: null, after: null };
  let dependencyMaintenance = null;
  let dependencyMaintenanceRelease = null;
  const preflightIssues = integrationBase?.status === "refused"
    ? [integrationBase.reason_code] : [];
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
  let inputs = null, inputMonitor = null, attempt = null, browserGuard = null, browserGuardReleased = false;
  let checkoutOwner = null;
  const checkoutOwnership = {
    required: requiresCheckoutVerificationOwnership(plan.selected_plan) || checkoutContext === "isolated-worktree" || (mode !== "quick" && phaseDefinitions.length > 0),
    acquired: false,
    released: false,
    checkout_fingerprint: null,
    ownership_id: null,
    acquired_at: null,
    released_at: null,
    failure_code: null,
  };
  let capacityLease = null;
  const capacityOwnership = {
    required: process.platform === "darwin" && ["full-canonical", OWNER_TARGETED_PLAN].includes(plan.selected_plan),
    acquired: false, released: false, failure_code: null,
  };
  let isolatedResources = null;
  let isolatedResourceCleanup = null;
  const historicalInputsRequired = checkoutContext === "isolated-worktree" && phaseDefinitions.some(phase => phase.id === "authority");
  let historicalInputs = null;
  let historicalInputCleanup = null;
  const nextState = {
    present_before: null,
    removed_before_execution: false,
    removed_after_execution: false,
  };
  const windowsHelperState = {
    required: process.platform === "win32" && process.arch === "x64",
    present_before: null,
    removed_before_execution: false,
    removed_after_execution: false,
  };
  let executionFailure = preflightIssues.length > 0;
  let cleanupComplete = true;
  let cleanupReason = null;
  // A selected plan is not ownership. Acquisition must return successfully
  // before this invocation may mutate (or finally remove) shared build state.
  let sharedGeneratedStateOwned = false;
  let checkoutConsumersSettled = true;
  let generatedNextPresentAfterExecutionCleanup = nextState.present_before;
  let generatedNextPresentAfter = nextState.present_before;
  let generatedWindowsHelperPresentAfter = null;

  try {
    if (!executionFailure) {
      if (signal?.aborted) throw Object.assign(new Error("verification_cancelled"), { code: "verification_cancelled" });
      assertVerificationContext(verificationContext, repositoryRoot);
      // Reserve host capacity before publishing a canonical-checkout owner.
      // A refused contender must not look like an unaccounted legacy owner to
      // already-running isolated lanes, even for a brief acquisition window.
      if (capacityOwnership.required) {
        capacityLease = acquireVerificationCapacity({ context: verificationContext, host, invocationId });
        Object.assign(capacityOwnership, capacityLease, { acquired: true });
      }
      if (checkoutOwnership.required) {
        checkoutOwner = acquireCheckoutVerificationOwnership({ repositoryRoot });
        Object.assign(checkoutOwnership, {
          acquired: true,
          checkout_fingerprint: checkoutOwner.metadata.checkout_fingerprint,
          ownership_id: checkoutOwner.metadata.ownership_id,
          acquired_at: checkoutOwner.metadata.acquired_at,
        });
      }
      if (checkoutContext === "isolated-worktree") {
        isolatedResources = createIsolatedInvocationResources(invocationId);
        if (historicalInputsRequired) historicalInputs = prepareHistoricalInputs({
          context: verificationContext, repositoryRoot, checkoutOwner, invocationId,
        });
        const observed = await inspectVerificationCompanionPreservation(verificationContext);
        serviceLifecycleBefore = observed.state;
        serviceObservations.before = observed.diagnostics;
        if (!observed.state.preservation_valid) throw Object.assign(
          new Error("companion_preservation_observation_invalid"),
          { code: "companion_preservation_observation_invalid" });
      } else if (
        plan.selected_plan === "full-canonical" ||
        plan.selected_plan === OWNER_TARGETED_PLAN
      ) {
        dependencyMaintenance = await acquireCompanionServiceMaintenance({
          repositoryRoot,
          operationId: `local-canonical-dependencies:${runId}`,
        });
        // The maintenance owner supplies the lifecycle it will restore, as
        // observed after checkout acquisition. An earlier snapshot can be stale.
        serviceLifecycleBefore = dependencyMaintenance.before;
      } else {
        serviceLifecycleBefore = boundedLifecycleState(
          await inspectCompanionService({ repositoryRoot }),
        );
      }
      sharedGeneratedStateOwned = checkoutOwner !== null;
      if (sharedGeneratedStateOwned) {
        assertCheckoutVerificationOwnership(checkoutOwner, repositoryRoot);
        // These are the authoritative baselines, after both required owners.
        // Refused/unowned attempts leave them null rather than claiming absence.
        nextState.present_before = generatedNextEntryPresent();
        windowsHelperState.present_before = existsSync(generatedWindowsHelperRoot);
      }
      if (generatedNextManaged && nextState.present_before) {
        nextState.removed_before_execution = removeBoundedGeneratedNextState({ checkoutOwner });
        console.log(
          "[local-canonical] cleanup generated=.next action=removed_before_execution",
        );
      }
      if (
        plan.selected_plan === "full-canonical" &&
        windowsHelperState.required &&
        windowsHelperState.present_before
      ) {
        assertCheckoutVerificationOwnership(checkoutOwner, repositoryRoot);
        rmSync(generatedWindowsHelperRoot, { recursive: true, force: true });
        windowsHelperState.removed_before_execution = true;
        console.log(
          "[local-canonical] cleanup generated=native/windows-x64 action=removed_before_execution",
        );
      }
      // Refused checkout contenders need a receipt, but have no phase logs.
      ensureBoundedLocalDirectory(repositoryRoot, runLogRoot);
      if (browserInput) browserGuard = acquireBrowserInputGuard({ repositoryRoot, checkoutOwner, binding: browserInput, runId });
      inputs = prepareInvocationInputs({ verificationContext, isolatedResources, browserExecutablePath: hostResult.browserExecutablePath, browserInput, headSha, executorFingerprint, phaseDefinitions });
      const assertOwnedInputs = () => {
        if (checkoutOwner) assertCheckoutVerificationOwnership(checkoutOwner, repositoryRoot);
        if (capacityLease) assertVerificationCapacity(capacityLease, verificationContext);
        if (mode !== "quick") assertFrozenSource(identityBefore, verificationContext);
        if (browserGuard) assertBrowserInputGuard(browserGuard);
      };
      inputMonitor = monitorInputContract(inputs, controller, { assertOwner: assertOwnedInputs });
      if (inputMonitor.check()) throw Object.assign(new Error("input_admission_refused"), { code: "input_admission_refused" });
      let actualBrowserVersion = null;
      const completed = await runPhasesSequentially({
        phases: phaseDefinitions,
        signal,
        execute: async (phase) => {
          if (checkoutOwnership.required) assertCheckoutVerificationOwnership(checkoutOwner, repositoryRoot);
          if (capacityLease) assertVerificationCapacity(capacityLease);
          assertVerificationContext(verificationContext, repositoryRoot);
          if (inputMonitor.check() || signal.aborted) throw Object.assign(new Error("input_invalidation"), { code: "input_invalidation" });
          if (mode !== "quick") assertFrozenSource(identityBefore, verificationContext);
          if (!attempt && mode !== "quick" && plan.selected_plan !== "documentation-only" && phaseDefinitions.length > 0 && checkoutOwner) {
            const observerAuthorization = isObserverRepair(sourceCorrection) ? await authorizeObserverRepair(sourceCorrection) : null;
            if (observerAuthorization && (inputMonitor.check() || signal.aborted)) throw Object.assign(new Error("input_admission_refused"), { code: "input_admission_refused" });
            if (observerAuthorization && digest(phaseDefinitions.map(p => p.id)) !== digest(BROWSER_REPLACEMENT_PHASES)) throw Object.assign(new Error("observer_workload_invalid"), { code: "observer_workload_invalid" });
            const companionTimeoutAuthorization = isCompanionTimeout(sourceCorrection) ? await authorizeCompanionTimeout(sourceCorrection) : null;
            if (companionTimeoutAuthorization && (inputMonitor.check() || signal.aborted)) throw Object.assign(new Error("input_admission_refused"), { code: "input_admission_refused" });
            if (companionTimeoutAuthorization && digest(phaseDefinitions.map(p => p.id)) !== digest(BROWSER_REPLACEMENT_PHASES)) throw Object.assign(new Error("companion_timeout_workload_invalid"), { code: "companion_timeout_workload_invalid" });
            const timeoutAuthorization = isCorrectedTimeout(sourceCorrection) ? await authorizeCorrectedTimeout(sourceCorrection) : null;
            if (timeoutAuthorization && (inputMonitor.check() || signal.aborted)) throw Object.assign(new Error("input_admission_refused"), { code: "input_admission_refused" });
            if (timeoutAuthorization && digest(phaseDefinitions.map(p => p.id)) !== digest(BROWSER_REPLACEMENT_PHASES)) throw Object.assign(new Error("timeout_workload_invalid"), { code: "timeout_workload_invalid" });
            const browserAuthorization = strictProof ? await authorizeBrowserReplacement(strictProof) : null;
            if (strictProof && digest(phaseDefinitions.map(p => p.id)) !== digest(BROWSER_REPLACEMENT_PHASES)) throw Object.assign(new Error("browser_replacement_workload_invalid"), { code: "browser_replacement_workload_invalid" });
            attempt = beginAttempt({ anchorRoot: verificationAnchorRoot(verificationContext), repositoryRoot, checkoutOwner,
              branch: identityBefore.branch, head: headSha, tree: inputs.snapshot().binding.tree, runId,
              contractFingerprint: inputs.snapshot().fingerprint, acceptedMain: baseSha,
              recoveryProof: recoveryProofPath ? readRecoveryProof(resolveArtifactPath(recoveryProofPath)) : null,
              sourceCorrection, observerAuthorization, timeoutAuthorization, companionTimeoutAuthorization,
              browserReplacement, browserAuthorization,
              browserLive: browserInput ? browserReplacementLiveBinding({ browserInput, host, machineFingerprint, nodePolicy, executorFingerprint, phaseDefinitions, inputs: inputs.snapshot() }) : null });
            pinVerificationEvidence({ root: repositoryRoot, checkoutOwner, runId, reason: "attempt_family" });
          }
          checkoutConsumersSettled = false;
          const result = await executePhase({
            phase, mode, runLogRoot, isolatedResources, signal, invocationId, browserInput,
            browserExecutablePath: hostResult.browserExecutablePath,
            expectedBrowser: { ...inputs.snapshot().resources.find(r => r.id === "browser-executable"), actual_version: actualBrowserVersion, ...(browserInput ? { browser_input: browserInput.publicBinding } : {}) },
          });
          actualBrowserVersion ??= result.browser_use?.[0]?.actual_version ?? null;
          checkoutConsumersSettled = result.cleanup?.completed === true &&
            result.cleanup?.remaining_owned_processes === 0;
          return result;
        },
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
    if (error.isolatedResourceCleanup) isolatedResourceCleanup = error.isolatedResourceCleanup;
    if (error.historicalInputCleanup) historicalInputCleanup = error.historicalInputCleanup;
    if (checkoutOwnership.required && !checkoutOwnership.acquired) {
      checkoutOwnership.failure_code = cleanupReason;
    }
    if (capacityOwnership.required && !capacityOwnership.acquired) capacityOwnership.failure_code = cleanupReason;
    console.error(
      `[local-canonical] failure phase=executor code=${cleanupReason}`,
    );
  } finally {
    console.log("[local-canonical] cleanup_start");
    try {
      if (sharedGeneratedStateOwned && checkoutConsumersSettled && generatedNextManaged && generatedNextEntryPresent()) {
        try {
          nextState.removed_after_execution =
            removeBoundedGeneratedNextState({ checkoutOwner });
        } catch (error) {
          cleanupComplete = false;
          cleanupReason = safeErrorCode(error);
        }
      }
      if (sharedGeneratedStateOwned) {
        assertCheckoutVerificationOwnership(checkoutOwner, repositoryRoot);
        generatedNextPresentAfterExecutionCleanup = generatedNextEntryPresent();
      }
      if (sharedGeneratedStateOwned && generatedNextManaged && generatedNextPresentAfterExecutionCleanup) {
        cleanupComplete = false;
        cleanupReason ??= "generated_next_cleanup_incomplete";
      }
      if (
        sharedGeneratedStateOwned &&
        checkoutConsumersSettled &&
        plan.selected_plan === "full-canonical" &&
        windowsHelperState.required &&
        existsSync(generatedWindowsHelperRoot)
      ) {
        try {
          assertCheckoutVerificationOwnership(checkoutOwner, repositoryRoot);
          rmSync(generatedWindowsHelperRoot, { recursive: true, force: true });
          windowsHelperState.removed_after_execution = true;
        } catch (error) {
          cleanupComplete = false;
          cleanupReason = safeErrorCode(error);
        }
      }
      if (checkoutConsumersSettled && dependencyMaintenance && !dependencyMaintenanceRelease) {
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
      try {
        // A refused contender cannot prune the active owner's logs. Static
        // feedback leaves pruning to the next checkout-owned invocation.
        if (checkoutOwner) {
          assertCheckoutVerificationOwnership(checkoutOwner, repositoryRoot);
          enforceArtifactRetention({
            checkoutOwner,
            currentRunId: runId,
            receiptMaximum: RECEIPT_RETENTION - 1,
            logMaximum: LOG_RUN_RETENTION,
          });
        }
      } catch (error) {
        cleanupComplete = false;
        cleanupReason = safeErrorCode(error);
      }
      if (serviceLifecycleBefore !== null) {
        if (checkoutContext === "isolated-worktree") {
          const observed = await inspectVerificationCompanionPreservation(verificationContext);
          serviceLifecycleAfter = observed.state;
          serviceObservations.after = observed.diagnostics;
        } else {
          serviceLifecycleAfter = boundedLifecycleState(
            await inspectCompanionService({ repositoryRoot: verificationAnchorRoot(verificationContext) }),
          );
        }
      }
      if (sharedGeneratedStateOwned) {
        assertCheckoutVerificationOwnership(checkoutOwner, repositoryRoot);
        generatedNextPresentAfter = generatedNextEntryPresent();
        generatedWindowsHelperPresentAfter = existsSync(generatedWindowsHelperRoot);
      }
    } catch (error) {
      cleanupComplete = false;
      cleanupReason = safeErrorCode(error);
    } finally {
      if (historicalInputs) {
        try {
          historicalInputCleanup = finishHistoricalInputs(historicalInputs, { consumersSettled: checkoutConsumersSettled });
          if (!historicalInputCleanup.completed || !historicalInputCleanup.unchanged) {
            cleanupComplete = false;
            cleanupReason ??= "historical_inputs_not_preserved";
          }
        } catch (error) { cleanupComplete = false; cleanupReason = safeErrorCode(error); }
      }
      if (isolatedResources) {
        try {
          isolatedResourceCleanup = cleanupIsolatedInvocationResources(isolatedResources, { consumersSettled: checkoutConsumersSettled });
          if (!isolatedResourceCleanup.completed) {
            cleanupComplete = false;
            cleanupReason ??= "isolated_resources_cleanup_incomplete";
          }
        } catch (error) { cleanupComplete = false; cleanupReason = safeErrorCode(error); }
      }
      inputMonitor?.stop();
      if (inputMonitor?.fault()) executionFailure = true;
      if (browserGuard) {
        try { releaseBrowserInputGuard(browserGuard, { settled: checkoutConsumersSettled }); browserGuardReleased = true; }
        catch (error) { cleanupComplete = false; cleanupReason = safeErrorCode(error); }
      }
      if (checkoutOwner) {
        try {
          Object.assign(checkoutOwnership, releaseCheckoutVerificationOwnership(checkoutOwner, repositoryRoot, {
            consumersSettled: checkoutConsumersSettled && (!historicalInputs || historicalInputCleanup?.completed === true),
          }));
        } catch (error) {
          cleanupComplete = false;
          cleanupReason = safeErrorCode(error);
          checkoutOwnership.failure_code = cleanupReason;
        }
      }
      if (capacityLease) {
        try {
          Object.assign(capacityOwnership, releaseVerificationCapacity(capacityLease, {
            consumersSettled: checkoutConsumersSettled && (!isolatedResources || isolatedResourceCleanup?.completed === true) &&
              (!historicalInputs || historicalInputCleanup?.completed === true),
          }));
        } catch (error) {
          cleanupComplete = false; cleanupReason = safeErrorCode(error);
          capacityOwnership.failure_code = cleanupReason;
        }
      }
    }
  }

  const serviceLifecycleRestored = checkoutContext === "isolated-worktree"
    ? serviceLifecycleBefore?.preservation_valid === true && serviceLifecycleAfter?.preservation_valid === true && JSON.stringify(serviceLifecycleBefore) === JSON.stringify(serviceLifecycleAfter)
    : lifecycleStateRestored(
    serviceLifecycleBefore,
    serviceLifecycleAfter,
  );
  if (!serviceLifecycleRestored) {
    inputs?.reportSafetyEvent("installed_service_change");
    executionFailure = true;
    cleanupComplete = false;
    cleanupReason ??= "companion_service_not_restored";
  }
  const cleanupRemaining = !checkoutConsumersSettled || phaseReceipts.some(
    (phase) =>
      phase.status !== "not_run" &&
      phase.cleanup.remaining_owned_processes !== 0,
  )
    ? "unknown"
    : "0";
  console.log(
    `[local-canonical] cleanup_result completed=${cleanupComplete} remaining_owned_processes=${cleanupRemaining} generated_next_present_after_execution_cleanup=${generatedNextPresentAfterExecutionCleanup} generated_next_present_after_service_restore=${generatedNextPresentAfter} generated_windows_helper_present=${generatedWindowsHelperPresentAfter}`,
  );

  let identityAfter;
  try {
    identityAfter = collectRepositoryIdentity(repositoryRoot, { verificationContext });
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
  if (!cleanupComplete || signal?.aborted) executionFailure = true;

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
    plan.selected_plan !== "documentation-only" &&
    nodePolicy.canonical_match &&
    !identityBefore.worktree_dirty &&
    !identityAfter.worktree_dirty;
  const finishedMs = Date.now();
  const finishedAt = new Date(finishedMs).toISOString();
  const remainingOwnedProcesses = !checkoutConsumersSettled || phaseReceipts.some(
    (phase) =>
      phase.status !== "not_run" &&
      phase.cleanup.remaining_owned_processes !== 0,
  )
    ? null
    : 0;
  const reasonCodes = [
    ...(signal?.aborted ? ["verification_cancelled"] : []),
    ...preflightIssues,
    ...(cleanupReason ? [cleanupReason] : []),
    ...phaseReceipts
      .filter((phase) => phase.status === "failure")
      .map((phase) => phase.failure_code),
    ...(!allSelectedPhasesPassed ? ["selected_phases_incomplete"] : []),
    ...(mode === "quick" ? [worktreePolicy.reason] : []),
    ...(plan.selected_plan === "documentation-only" ? ["documentation_feedback_not_deciding"] : []),
    ...(!nodePolicy.canonical_match ? ["canonical_node_mismatch"] : []),
  ];
  const disposition = deriveOperationalDisposition({ phases: phaseReceipts, admitted: preflightIssues.length === 0,
    fault: inputMonitor?.fault(), cancelled: signal.aborted && !inputMonitor?.fault(), cleanup: cleanupComplete && remainingOwnedProcesses === 0 });
  const receipt = finalizeReceipt({
    schema: LOCAL_CANONICAL_RECEIPT_SCHEMA,
    receipt_version: browserInput ? 5 : LOCAL_CANONICAL_RECEIPT_VERSION,
    repository: {
      repository_id: identityBefore.repository_id,
      origin: identityBefore.origin,
      base_sha: baseSha,
      head_sha: headSha,
      tree_sha: runGit(repositoryRoot, ["rev-parse", `${headSha}^{tree}`]).trim(),
      branch: identityBefore.branch,
      detached: identityBefore.detached,
      worktree_before: identityBefore.worktree_dirty ? "dirty" : "clean",
      worktree_after: identityAfter.worktree_dirty ? "dirty" : "clean",
    },
    inputs: inputs?.snapshot() ?? null,
    ...(browserInput ? { browser_input: browserInput.publicBinding, browser_guard: { acquired: browserGuard !== null, released: browserGuardReleased, run_id: runId } } : {}),
    attempt: attempt ? { ...attempt } : null,
    outcome: { disposition, first_fault: inputMonitor?.fault() ?? null, execution: allSelectedPhasesPassed ? "complete_pass" : "incomplete_or_failed",
      validity: inputs && !inputMonitor?.fault() && cleanupComplete ? "valid_within_observed_scope" : "invalid_or_unknown",
      safety: inputMonitor?.fault() ? "blocked" : cleanupComplete ? "preserved_within_observed_scope" : "unknown",
      applicability_at_admission: integrationBase?.status === "admitted" ? "current_base" : "blocked" },
    integration_base: integrationBase,
    verification_context: verificationContext,
    checkout_ownership: checkoutOwnership,
    capacity_ownership: capacityOwnership,
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
      download_cache: checkoutContext === "isolated-worktree" ? "invocation_private_cache_not_authoritative" : "npm_cache_reuse_permitted_not_authoritative",
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
      web_planning_lock_sha256: locks.webPlanning,
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
    historical_inputs: {
      required: historicalInputsRequired, prepared: historicalInputs !== null,
      ...(historicalInputs ?? {}), ...(historicalInputCleanup ?? {}),
    },
    run: {
      id: runId,
      invocation_id: invocationId,
      started_at: startedAt,
      finished_at: finishedAt,
      duration_ms: finishedMs - startedMs,
    },
    cleanup: {
      completed: cleanupComplete && remainingOwnedProcesses === 0,
      remaining_owned_processes: remainingOwnedProcesses,
      isolated_resources: {
        required: checkoutContext === "isolated-worktree",
        prepared: isolatedResources !== null,
        ...(isolatedResources ?? {}),
        ...(isolatedResourceCleanup ?? {}),
      },
      companion_service: {
        scope: checkoutContext === "isolated-worktree" ? "accepted_checkout_read_only" : "installed_checkout_lifecycle",
        before: serviceLifecycleBefore,
        after: serviceLifecycleAfter,
        observations: serviceObservations,
        maintenance_acquired: dependencyMaintenance?.acquired === true,
        maintenance_released:
          dependencyMaintenance === null ||
          dependencyMaintenanceRelease?.released === true ||
          dependencyMaintenance?.acquired === false,
        restored: serviceLifecycleRestored,
      },
      generated_next: {
        ...nextState,
        present_after_execution_cleanup:
          generatedNextPresentAfterExecutionCleanup,
        present_after: generatedNextPresentAfter,
      },
      generated_windows_helper: {
        ...windowsHelperState,
        present_after: generatedWindowsHelperPresentAfter,
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
        "integration base was observed at admission; validation re-observes main but does not reserve or atomically verify GitHub's later merge result",
      ],
    },
  });

  const receiptRelativePath = writeReceipt(receipt, { runId });
  if (attempt) finishAttempt(attempt, { receiptFingerprint: receipt.integrity.content_fingerprint,
    disposition, cleanupComplete: receipt.cleanup.completed,
    infrastructureCode: phaseReceipts.find(p => p.spawn_error_code)?.spawn_error_code ?? null });
  externalSignal?.removeEventListener("abort", forwardCancellation);
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

export function prepareInvocationInputs({ verificationContext, isolatedResources, browserExecutablePath, browserInput = null, headSha, executorFingerprint, phaseDefinitions }) {
  if ((verificationContext.kind === "isolated-worktree") !== Boolean(isolatedResources))
    throw Object.assign(new Error("input_isolation_context_mismatch"), { code: "input_isolation_context_mismatch" });
  const environments = phaseDefinitions.map(phase => ({ id: phase.id, values: phaseEnvironment({ phase, isolatedResources, browserExecutablePath, browserInput }) }));
  const resources = invocationInputResources({ verificationContext, browserExecutablePath, browserInput });
  return freezeInputContract({ resources, pathKind: isolatedResources ? "isolated-model-free-v1" : "canonical-conservative-v1",
    binding: { head: headSha, tree: runGit(repositoryRoot, ["rev-parse", `${headSha}^{tree}`]).trim(),
      executor_fingerprint: executorFingerprint, phase_inventory: digest(phaseDefinitions),
      phase_environment_fingerprints: environments.map(e => ({ id: e.id, fingerprint: digest(e.values) })),
      environment_keys: [...new Set(environments.flatMap(e => Object.keys(e.values)))].sort(), authenticated_transport: "github_authenticated_main_branch_get",
      provider_policy: "no_live_model_calls;private_fixture_adapters_only", ...(browserInput ? { browser_input: browserInput.publicBinding } : {}) } });
}

function invocationInputResources({ verificationContext, browserExecutablePath, browserInput = null }) {
  const isolated = verificationContext.kind === "isolated-worktree";
  const userHome = os.userInfo().homedir;
  return [
    ...(browserInput ? [{ id: "browser-bundle", file: browserInput.root, classification: "execution", browserBundle: true },
      { id: "browser-binding", file: browserInput.file, classification: "execution" }, { id: "browser-reference", file: browserInput.referenceFile, classification: "execution" }] : []),
    { id: "codex-preferences", file: path.join(userHome, ".codex", "config.toml"), classification: isolated ? "ambient" : "unknown", excludePreferences: isolated },
    { id: "user-instructions", file: path.join(userHome, ".codex", "AGENTS.md"), classification: "safety" },
    { id: "auth-location", file: path.join(userHome, ".codex", "auth.json"), classification: "safety", metadataOnly: true },
    { id: "github-auth-location", file: path.join(process.env.GH_CONFIG_DIR ?? path.join(process.env.XDG_CONFIG_HOME ?? path.join(userHome, ".config"), "gh"), "hosts.yml"), classification: "safety", metadataOnly: true },
    { id: "git-user-config", file: path.join(userHome, ".gitconfig"), classification: "execution", metadataOnly: true },
    ...(isolated ? [createGitTrackingResource(path.join(verificationAnchorRoot(verificationContext), ".git", "config"), [repositoryRoot, verificationAnchorRoot(verificationContext)])]
      : [{ id: "git-config", file: path.join(verificationAnchorRoot(verificationContext), ".git", "config"), classification: "execution" }]),
    { id: "node-executable", file: realpathSync(process.execPath), classification: "execution" },
    ...["npm", "git", "gh"].map(name => ({ id: `${name}-executable`, file: resolveExecutionTool(name), classification: "execution" })),
    ...[".npmrc", "apps/augnes_apps/.npmrc", "apps/web_planning/.npmrc", "AGENTS.md", ".github/LOCAL_CANONICAL_VERIFICATION.md"].map((file, i) => ({ id: `declared-config-${i}`, file: path.join(repositoryRoot, file), classification: "execution" })),
    { id: "npm-prefix-config", file: path.join(path.dirname(path.dirname(process.execPath)), "etc", "npmrc"), classification: "execution" },
    { id: "historical-r8a-provision", file: path.join(repositoryRoot, R8A_PROVISION_MANIFEST), classification: "execution" },
    { id: "historical-durable-provision", file: path.join(repositoryRoot, DURABLE_PROVISION_MANIFEST), classification: "execution" },
    ...["package-lock.json", "apps/augnes_apps/package-lock.json", "apps/web_planning/package-lock.json", ...EXECUTOR_SOURCE_FILES].map((file, i) => ({ id: `source-${i}`, file: path.join(repositoryRoot, file), classification: "execution" })),
    ...(browserExecutablePath ? [{ id: "executable-permissions-reader", file: "/bin/ls", classification: "execution", readOnlyExecutable: true },
      ...(process.platform === "darwin" ? [{ id: "executable-flags-reader", file: "/usr/bin/stat", classification: "execution", readOnlyExecutable: true }, { id: "executable-attributes-reader", file: "/usr/bin/xattr", classification: "execution", readOnlyExecutable: true }] : []),
      { id: "browser-executable", file: browserExecutablePath, classification: "execution", readOnlyExecutable: true }] : []),
  ];
}

function currentInputEvidenceValid(receipt, verificationContext, browserExecutablePath, browserInput = null) {
  try {
    const resources = invocationInputResources({ verificationContext, browserExecutablePath, browserInput });
    const readInput = createInputReader();
    const declared = receipt.inputs?.resources;
    if (!supportedInputContract(receipt.inputs?.contract) || !Array.isArray(declared) || resources.length !== declared.length) return false;
    return resources.every(resource => {
      const prior = declared.find(r => r.id === resource.id);
      if (!prior || prior.location_fingerprint !== digest(resource.file) || prior.classification !== resource.classification ||
          prior.excludePreferences !== resource.excludePreferences || prior.metadataOnly !== resource.metadataOnly || prior.readOnlyExecutable !== resource.readOnlyExecutable || prior.browserBundle !== resource.browserBundle) return false;
      if (prior.gitTracking && digest(prior.gitTracking) !== digest(resource.gitTracking)) return false;
      // An old declaration keeps its original reader and whole-file meaning.
      const interpreted = { ...resource, gitTracking: prior.gitTracking };
      const current = readInput(resource.file, { ...inputReadOptions(interpreted, receipt.inputs), force: true });
      return nonFaultInputChange(classifyInputChange(prior.before, current, interpreted, receipt.inputs));
    });
  } catch { return false; }
}

function resolveExecutionTool(name) {
  const extensions = process.platform === "win32" ? [".exe", ".cmd", ""] : [""];
  for (const directory of (process.env.PATH ?? process.env.Path ?? "").split(path.delimiter)) {
    for (const extension of extensions) {
      const candidate = path.resolve(directory, name + extension);
      if (existsSync(candidate) && statSync(candidate).isFile()) return realpathSync(candidate);
    }
  }
  throw Object.assign(new Error("declared_tool_unavailable"), { code: "declared_tool_unavailable" });
}

export function browserReplacementLiveBinding({ browserInput, host, machineFingerprint, nodePolicy, executorFingerprint, phaseDefinitions, inputs }) {
  return { browserInput, executorFingerprint,
    environmentFingerprint: digest({ machine_fingerprint: machineFingerprint, operating_system: host.operating_system,
      operating_system_version: host.operating_system_version, operating_system_build: host.operating_system_build,
      architecture: host.architecture, node: nodePolicy.actual_version, path_node: host.path_node_version, npm: host.npm_version,
      tool_inputs: inputs.resources.filter(r => ["node-executable", "npm-executable", "git-executable", "gh-executable"].includes(r.id)) }),
    workloadFingerprint: digest(phaseDefinitions), commonInputsSha256: digest(commonInputResources(inputs)) };
}

function assertFrozenSource(identityBefore, verificationContext) {
  // The full physical-context admission remains at each phase boundary. This
  // small poll covers tracked/untracked source without rescanning node_modules.
  const head = runGit(repositoryRoot, ["rev-parse", "HEAD"]).trim();
  const dirty = runGit(repositoryRoot, ["status", "--porcelain", "--untracked-files=normal"]).trim();
  if (head !== identityBefore.head_sha || dirty) throw Object.assign(new Error("source_input_changed"), { code: "source_input_changed" });
}

function lifecycleStateRestored(before, after) {
  if (!before || !after) return false;
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

export function readStockBrowserInput(receipt, root = repositoryRoot) {
  if (![3, 4, 5].includes(receipt?.receipt_version)) throw Object.assign(new Error("stock_receipt_version_unsupported"), { code: "stock_receipt_version_unsupported" });
  if (receipt.receipt_version === 5) return readBrowserInputBinding(receipt.browser_input?.local_relative_path, root);
  if (receipt.browser_input || receipt.browser_guard || receipt.attempt?.browser_replacement || receipt.attempt?.source_correction?.browser_input_path || receipt.inputs?.binding?.browser_input ||
      (Array.isArray(receipt.inputs?.resources) && receipt.inputs.resources.some(r => r?.browserBundle))) throw Object.assign(new Error("stock_browser_input_downgrade"), { code: "stock_browser_input_downgrade" });
  return null;
}

export async function validateReceiptAgainstCurrentRepository(relativeReceiptPath, { checkoutContext = "canonical" } = {}) {
  const verificationContext = admitVerificationContext({ repositoryRoot, kind: checkoutContext });
  const receiptPath = resolveArtifactPath(relativeReceiptPath);
  const receipt = readReceiptFile(receiptPath);
  const browserInput = readStockBrowserInput(receipt);
  const identity = collectRepositoryIdentity(repositoryRoot, { verificationContext });
  const locks = collectLockFingerprints();
  const executorFingerprint = computeExecutorSourceFingerprint();
  // This path reconstructs only. In particular the new lane cannot acquire a
  // guard, create a machine identity or claim/repair a successor during stock.
  const validationHost = collectHostEnvironment(repositoryRoot, { browserInput });
  const host = validationHost.public;
  const nodePolicy = evaluateNodePolicy();
  const machineRoot = path.join(verificationAnchorRoot(verificationContext), LOCAL_ARTIFACT_DIRECTORY);
  const machineFingerprint = browserInput ? readMachineFingerprint(machineRoot) : ensureMachineFingerprint(machineRoot);
  let currentIntegrationBase = null;
  if (["changed", "full"].includes(receipt?.evidence?.mode)) {
    try {
      currentIntegrationBase = await admitIntegrationBase({
        repositoryRoot,
        baseSha: receipt?.repository?.base_sha,
        headSha: receipt?.repository?.head_sha,
      });
    } catch {
      // Invalid historical identity is not current integration-base evidence.
    }
  }
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
  let browserAuthorization = null, browserLive = null;
  if (browserInput) {
    try {
      browserAuthorization = await authorizeBrowserReplacement(receipt.attempt?.browser_replacement ?? receipt.attempt?.source_correction);
      const phases = buildPhasePlan({ mode: "full", selectedPlan: "full-canonical", baseSha: receipt.repository.base_sha, headSha: receipt.repository.head_sha, browserPhaseIds: expectedBrowserPhaseIds, targetedPhaseIds: [] });
      browserLive = browserReplacementLiveBinding({ browserInput, host, nodePolicy, machineFingerprint, executorFingerprint, phaseDefinitions: phases, inputs: receipt.inputs });
    } catch { /* reported as unverified, never repaired */ }
  }
  let observerAuthorization = null;
  if (isObserverRepair(receipt.attempt?.source_correction)) {
    try { observerAuthorization = await authorizeObserverRepair(receipt.attempt.source_correction); } catch { /* stock refuses unavailable authority */ }
  }
  let companionTimeoutAuthorization = null;
  if (isCompanionTimeout(receipt.attempt?.source_correction)) {
    try {
      // A fresh stock process has no evidence capability from admission.
      // Re-read the exact local proof and all retained evidence before auth;
      // this inspection cannot create or repair a successor reservation.
      const saved = receipt.attempt.source_correction;
      const observed = readSourceCorrectionProof(path.join(repositoryRoot, saved.local_relative_path ?? ""), repositoryRoot);
      if (digest(observed) !== digest(saved)) throw new Error("companion_timeout_stock_proof_changed");
      companionTimeoutAuthorization = await authorizeCompanionTimeout(observed);
    } catch { /* stock refuses changed evidence or unavailable authority */ }
  }
  let timeoutAuthorization = null;
  if (isCorrectedTimeout(receipt.attempt?.source_correction)) {
    try { timeoutAuthorization = await authorizeCorrectedTimeout(receipt.attempt.source_correction); } catch { /* stock refuses unavailable authority */ }
  }
  return inspectReceiptForDecision(receipt, {
    currentInputStateValid: [4, 5].includes(receipt.receipt_version) ? currentInputEvidenceValid(receipt, verificationContext, validationHost.browserExecutablePath, browserInput) : null,
    currentAttemptRecordsValid: [4, 5].includes(receipt.receipt_version) ? inspectAttemptRecords({ anchorRoot: verificationAnchorRoot(verificationContext), repositoryRoot, receipt, browserAuthorization, browserLive, observerAuthorization, timeoutAuthorization, companionTimeoutAuthorization }) : null,
    currentBrowserInputValid: browserInput ? digest(browserInput.publicBinding) === digest(receipt.browser_input) && !existsSync(path.join(repositoryRoot, ".augnes-local-verification/browser-input-active.json")) : null,
    currentVerificationContext: verificationContext,
    expectedRunId: path.basename(receiptPath, ".json"),
    currentIntegrationBase,
    currentCheckoutFingerprint: checkoutVerificationFingerprint(repositoryRoot),
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
      args: ["scripts/test-local-canonical-verification-contract.mjs", "--head", headSha],
      display: `node scripts/test-local-canonical-verification-contract.mjs --head ${headSha}`,
      timeoutMs: 60_000,
    }),
  ];
}

function ownerTargetedPhases({ baseSha, headSha, targetedPhaseIds }) {
  const reuseIds = Array.isArray(targetedPhaseIds)
    ? targetedPhaseIds.filter((id) => CODEX_REUSE_PHASE_IDS.includes(id)) : [];
  if (
    !Array.isArray(targetedPhaseIds) ||
    targetedPhaseIds.length < 5 ||
    targetedPhaseIds[0] !== "targeted-change-validator" ||
    targetedPhaseIds[1] !== "dependencies-root" ||
    targetedPhaseIds[2] !== "dependencies-nested" ||
    targetedPhaseIds[3] !== "dependencies-web-planning" ||
    new Set(targetedPhaseIds).size !== targetedPhaseIds.length ||
    (reuseIds.length > 0 && (targetedPhaseIds.includes("unit") ||
      JSON.stringify(reuseIds) !== JSON.stringify(CODEX_REUSE_PHASE_IDS))) ||
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
  if (CODEX_REUSE_PHASE_IDS.includes(id)) {
    return phaseDefinition({
      id,
      label: `Canonical ${id} check`,
      command: process.execPath,
      args: ["scripts/run-canonical-test-suite.mjs", id],
      display: `node scripts/run-canonical-test-suite.mjs ${id}`,
      // Retain the child's 30s bound plus bounded suite startup/cleanup.
      timeoutMs: 60_000,
    });
  }
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
    "dependencies-web-planning": () =>
      npmPhase(
        "dependencies-web-planning",
        "isolated web planning clean development dependency installation",
        ["ci", "--no-audit", "--no-fund"],
        600_000,
        "web-planning-app",
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
    npmPhase(
      "dependencies-web-planning",
      "isolated web planning clean development dependency installation",
      ["ci", "--no-audit", "--no-fund"],
      600_000,
      "web-planning-app",
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
    "e2e-operator-work-expectation": {
      label: "Canonical operator work-expectation Browser owner",
      suite: "e2e-operator-work-expectation",
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
    browser_consumers: browserConsumersForPhase(id),
    base_sha: baseSha,
    head_sha: headSha,
  };
}

export async function executePhase({
  phase,
  mode,
  runLogRoot,
  browserExecutablePath = null,
  browserInput = null,
  expectedBrowser = null,
  isolatedResources = null,
  signal,
  invocationId,
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
  const browserUse = [];
  const environment = phaseEnvironment({ phase, isolatedResources, browserExecutablePath, browserInput });
  const environmentFingerprint = digest(environment);
  const capture = createBoundedCapture(logPath, record => {
    // One overflow entry preserves refusal without unbounded capture.
    if (browserUse.length <= MAX_BROWSER_USE_RECORDS) browserUse.push(record);
  });
  let result;
  try {
    result = await runCanonicalChild({
      suite: `local-${mode}`,
      label: phase.label,
      command: phase.command,
      args: phase.args,
      cwd: phase.cwdScope === "nested-app" ? nestedAppRoot :
        phase.cwdScope === "web-planning-app" ? webPlanningRoot : repositoryRoot,
      env: environment,
      timeoutMs: phase.timeoutMs,
      signal,
      stdout: capture.stdout,
      stderr: capture.stderr,
    });
  } catch (error) {
    capture.close();
    const finishedMs = Date.now();
    return {
      environment_fingerprint: environmentFingerprint,
      invocation_id: invocationId,
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
    (Object.keys(browserConsumersForPhase(phase.id)).length === 0 && phase.browser !== true && !CODEX_REUSE_PHASE_IDS.includes(phase.id)) ||
    (result.termination_reason === "natural_exit" &&
      result.exit_observed === true &&
      result.streams_closed === true);
  const passed =
    result.cancelled !== true &&
    result.exit_code === 0 &&
    result.timed_out === false &&
    result.cleanup_completed === true &&
    result.remaining_owned_processes === 0 &&
    lifecyclePassed && validPhaseBrowserUse(phase, browserUse, expectedBrowser);
  return {
    environment_fingerprint: environmentFingerprint,
    invocation_id: invocationId,
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
    spawn_error_code: result.spawn_error_code ?? null,
    browser_use: browserUse,
    failure_code: passed
      ? null
      : result.cancelled
        ? "phase_cancelled"
      : result.timed_out
        ? "phase_timed_out"
        : result.exit_code !== 0
          ? "phase_failed"
        : !validPhaseBrowserUse(phase, browserUse, expectedBrowser)
          ? "browser_identity_invalid"
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

export function phaseEnvironment({ phase, isolatedResources, browserExecutablePath, browserInput = null }) {
  const environment = isolatedResources ? {
    ...isolatedInvocationEnvironment(isolatedResources),
    ...(browserExecutablePath ? { AUGNES_BROWSER_EXECUTABLE_PATH: browserExecutablePath } : {}),
  } : buildLocalPhaseEnvironment(process.env, {
    browserExecutablePath,
  });
  return browserInput ? { ...environment, ...browserInputEnvironment(browserInput) } : environment;
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

function createBoundedCapture(logPath, onBrowserUse = () => {}) {
  ensureBoundedLocalDirectory(repositoryRoot, path.dirname(logPath));
  const descriptor = openSync(logPath, "wx", 0o600);
  let bytes = 0;
  let truncated = false;
  let closed = false;
  const pendingLines = { stdout: "", stderr: "" };
  const write = (stream, destination, chunk) => {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    destination.write(buffer);
    let pendingLine = pendingLines[stream];
    pendingLine += buffer.toString("utf8");
    for (let newline; (newline = pendingLine.indexOf("\n")) >= 0;) {
      const line = pendingLine.slice(0, newline); pendingLine = pendingLine.slice(newline + 1);
      if (line.startsWith(BROWSER_IDENTITY_PREFIX)) {
        onBrowserUse(parseBrowserUseLine(line));
      }
    }
    if (pendingLine.length > 65536) pendingLine = "";
    pendingLines[stream] = pendingLine;
    const remaining = MAX_PHASE_LOG_BYTES - bytes;
    if (remaining > 0) {
      const bounded = buffer.subarray(0, remaining);
      writeSync(descriptor, bounded);
      bytes += bounded.length;
    }
    if (buffer.length > remaining) truncated = true;
  };
  return {
    stdout: { write: (chunk) => write("stdout", process.stdout, chunk) },
    stderr: { write: (chunk) => write("stderr", process.stderr, chunk) },
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
    webPlanning: hashFile(path.join(webPlanningRoot, "package-lock.json")),
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

function writeReceipt(receipt, { runId }) {
  ensureBoundedLocalDirectory(repositoryRoot, receiptRoot);
  const fileName = `${runId}.json`;
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

export function enforceArtifactRetention({
  root = repositoryRoot,
  checkoutOwner,
  currentRunId,
  receiptMaximum = RECEIPT_RETENTION,
  logMaximum = LOG_RUN_RETENTION,
} = {}) {
  assertCheckoutVerificationOwnership(checkoutOwner, root);
  if (!/^[A-Za-z0-9_-]{1,160}$/u.test(currentRunId ?? "") ||
      !Number.isSafeInteger(receiptMaximum) || receiptMaximum < 0 ||
      !Number.isSafeInteger(logMaximum) || logMaximum < 1) {
    throw Object.assign(new Error("invalid artifact retention boundary"), {
      code: "invalid_artifact_retention_boundary",
    });
  }
  const receipts = path.join(root, LOCAL_ARTIFACT_DIRECTORY, "receipts");
  const logs = path.join(root, LOCAL_ARTIFACT_DIRECTORY, "logs");
  ensureBoundedLocalDirectory(root, receipts);
  ensureBoundedLocalDirectory(root, logs);
  const pinned = readPinnedEvidence(root);
  pinned.add(currentRunId);
  retainNewestFiles(receipts, receiptMaximum, (entry) =>
    entry.isFile() && entry.name.endsWith(".json"),
    { protectedEntries: new Set([...pinned].map(id => path.join(receipts, `${id}.json`))) },
  );
  retainNewestFiles(logs, logMaximum, (entry) => entry.isDirectory(), {
    protectedEntries: new Set([...pinned].map(id => path.join(logs, id))),
  });
}

function retainNewestFiles(root, maximum, include, { protectedEntries = new Set() } = {}) {
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
  // The current run counts toward the bound, regardless of mtime. Newer
  // feedback/failed attempts must never evict the logs its receipt references.
  const protectedCount = ownedEntries.filter((entry) => protectedEntries.has(entry.entryPath)).length;
  const eligible = ownedEntries.filter((entry) => !protectedEntries.has(entry.entryPath));
  for (const entry of eligible.slice(Math.max(0, maximum - protectedCount))) {
    rmSync(entry.entryPath, { recursive: true, force: true });
  }
}

function safeRunId(startedAt, mode, headSha) {
  return `${startedAt.replace(/[:.]/gu, "-")}-${mode}-${headSha.slice(0, 12)}-${randomBytes(8).toString("hex")}`;
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
    mode === "validate" ? new Set(["receipt", "checkout-context"]) : new Set(["base", "head", "checkout-context", "recovery-proof", "source-correction-proof", "browser-replacement-proof"]);
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
    checkoutContext: options.get("checkout-context") ?? "canonical",
    recoveryProofPath: options.get("recovery-proof") ?? null,
    sourceCorrectionProofPath: options.get("source-correction-proof") ?? null,
    browserReplacementProofPath: options.get("browser-replacement-proof") ?? null,
  };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const command = parseCli(process.argv.slice(2));
    if (command.mode === "validate") {
      const result = await validateReceiptAgainstCurrentRepository(command.receipt, command);
      console.log(JSON.stringify(result));
      process.exitCode = result.valid_deciding_evidence ? 0 : 1;
    } else {
      const controller = new AbortController();
      const cancel = () => controller.abort();
      process.on("SIGINT", cancel); process.on("SIGTERM", cancel);
      try {
        const result = await executeLocalCanonicalVerification({ ...command, signal: controller.signal });
        process.exitCode = result.exitCode;
      } finally {
        process.removeListener("SIGINT", cancel); process.removeListener("SIGTERM", cancel);
      }
    }
  } catch (error) {
    console.error(
      `[local-canonical] fatal code=${safeErrorCode(error)} message=${error instanceof Error ? error.message : "unknown failure"}`,
    );
    process.exitCode = 1;
  }
}
