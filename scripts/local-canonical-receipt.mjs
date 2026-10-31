import { CLOSEOUT_SCHEMA, isCloseout, validCloseoutAttempt } from "./local-canonical-1559-closeout.mjs";
import { COMPANION_TIMEOUT_SCHEMA, isCompanionTimeout, validCompanionTimeoutAttempt } from "./local-canonical-companion-timeout-succession.mjs";
import { GUIDE_CORRECTION_SCHEMA, isGuideCorrection, validGuideCorrectionAttempt } from "./local-canonical-guide-correction.mjs";
import { isObserverRepair, validObserverAttempt } from "./local-canonical-observer-succession.mjs";
import { TIMEOUT_REPAIR_SCHEMA, isCorrectedTimeout, validTimeoutAttempt } from "./local-canonical-timeout-succession.mjs";
import { CONDITION_REQUALIFICATION_SCHEMA, isConditionRequalification, validConditionRequalificationAttempt } from "./local-canonical-condition-requalification.mjs";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { CANONICAL_REPOSITORY_ID } from "./canonical-repository-identity.mjs";
import { INTEGRATION_BASE_CONTRACT, INTEGRATION_BASE_SOURCE } from "./local-canonical-integration-base.mjs";
import { requiresCheckoutVerificationOwnership } from "./local-canonical-checkout-ownership.mjs";
import { CODEX_REUSE_OWNER_IDS, CODEX_REUSE_PHASE_IDS } from "./codex-reuse-verification-ownership.mjs";
import { VERIFICATION_CONTEXT_CONTRACT } from "./local-canonical-verification-context.mjs";
import { VERIFICATION_CAPACITY_CONTRACT, verificationCapacityLimit } from "./local-canonical-capacity.mjs";
import { HISTORICAL_INPUT_CONTRACT } from "./local-canonical-historical-inputs.mjs";
import { supportedInputContract, digest, deriveOperationalDisposition, nonFaultInputChange, classifyInputChange, effectiveInputObservation, inputEventIdentity, validObservationDiagnostic, validInputFailureDiagnostics } from "./local-canonical-inputs.mjs";
import { ATTEMPT_CONTRACT } from "./local-canonical-attempts.mjs";
import { validPhaseBrowserUse } from "./local-canonical-browser-identity.mjs";
import { BROWSER_INPUT_CONTRACT } from "./local-canonical-browser-input.mjs";
import { BROWSER_REPLACEMENT_CONTRACT, BROWSER_REPLACEMENT_PHASES, isStrictBrowserSourceRevision } from "./local-canonical-browser-replacement.mjs";
import { validBrowserBundle } from "./local-canonical-browser-bundle.mjs";

export const LOCAL_CANONICAL_RECEIPT_SCHEMA =
  "augnes.local-canonical-receipt.v1";
export const LOCAL_CANONICAL_RECEIPT_VERSION = 4;
export const LOCAL_CANONICAL_EXECUTOR_VERSION = 4;
export const MAX_RECEIPT_BYTES = 512 * 1024;

const SHA_PATTERN = /^[0-9a-f]{40}$/u;
const SHA256_PATTERN = /^[0-9a-f]{64}$/u;
const OWNER_TARGETED_DEPENDENCY_PHASES = Object.freeze([
  {
    id: "dependencies-root",
    command: "npm ci --no-audit --no-fund",
    cwd_scope: "root",
  },
  {
    id: "dependencies-nested",
    command: "npm ci --no-audit --no-fund",
    cwd_scope: "nested-app",
  },
  {
    id: "dependencies-web-planning",
    command: "npm ci --no-audit --no-fund",
    cwd_scope: "web-planning-app",
  },
]);
const PRIVATE_PATH_PATTERNS = Object.freeze([
  /\/Users\/[^/]+\//u,
  /\/home\/(?!user\/|username\/|example\/)[^/]+\//u,
  /[A-Za-z]:\\Users\\[^\\]+\\/u,
  /file:\/\/\/(?:Users|home)\//u,
]);
const SECRET_PATTERNS = Object.freeze([
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{8,}\b/u,
  /\bgh[pousr]_[A-Za-z0-9_]{8,}\b/u,
  /\bgithub_pat_[A-Za-z0-9_]{8,}\b/u,
  /\bBearer\s+[A-Za-z0-9._~+/-]{8,}/iu,
]);
const FORBIDDEN_FIELD_NAMES = new Set([
  "credentials",
  "database_content",
  "database_contents",
  "environment_dump",
  "env",
  "hostname",
  "model_output",
  "prompt",
  "raw_command_output",
  "raw_output",
  "secret",
  "secrets",
  "stderr",
  "stdout",
  "token",
  "tokens",
  "username",
]);

export function canonicalSerialize(value) {
  return JSON.stringify(sortCanonicalValue(value));
}

export function fingerprintCanonicalValue(value) {
  return createHash("sha256").update(canonicalSerialize(value)).digest("hex");
}

export function finalizeReceipt(receipt) {
  const withoutIntegrity = structuredClone(receipt);
  delete withoutIntegrity.integrity;
  assertPublicSafeReceipt(withoutIntegrity);
  const fingerprint = fingerprintCanonicalValue(withoutIntegrity);
  const finalized = {
    ...withoutIntegrity,
    integrity: {
      algorithm: "sha256",
      canonicalization: "json-sorted-keys-v1",
      content_fingerprint: fingerprint,
      trust_boundary:
        "content integrity and local provenance only; no independent attestation",
    },
  };
  assertPublicSafeReceipt(finalized);
  return finalized;
}

export function verifyReceiptIntegrity(receipt) {
  if (
    receipt?.integrity?.algorithm !== "sha256" ||
    receipt?.integrity?.canonicalization !== "json-sorted-keys-v1" ||
    !/^[0-9a-f]{64}$/u.test(
      receipt?.integrity?.content_fingerprint ?? "",
    )
  ) {
    return false;
  }
  const withoutIntegrity = structuredClone(receipt);
  const expected = withoutIntegrity.integrity.content_fingerprint;
  delete withoutIntegrity.integrity;
  return fingerprintCanonicalValue(withoutIntegrity) === expected;
}

export function assertPublicSafeReceipt(receipt) {
  assertSafeFieldNames(receipt);
  const serialized = canonicalSerialize(receipt);
  if (Buffer.byteLength(serialized, "utf8") > MAX_RECEIPT_BYTES) {
    throw receiptError(
      "receipt_exceeds_size_bound",
      "local canonical receipt exceeds its public-safe size bound",
    );
  }
  for (const pattern of [...PRIVATE_PATH_PATTERNS, ...SECRET_PATTERNS]) {
    if (pattern.test(serialized)) {
      throw receiptError(
        "receipt_contains_private_material",
        "local canonical receipt contains forbidden private material",
      );
    }
  }
}

export function inspectReceiptForDecision(receipt, options = {}) {
  const {
    currentInputStateValid = null,
    currentBrowserInputValid = null,
    currentAttemptRecordsValid = null,
    currentIdentity = null,
    currentLocks = null,
    currentExecutorFingerprint = null,
    expectedSelectedPlan = null,
    currentEnvironment = null,
    expectedPhaseIds = null,
    expectedOwnerIds = null,
    expectedTargetedPhaseIds = null,
    currentIntegrationBase = null,
    currentCheckoutFingerprint = null,
    currentVerificationContext = null,
    expectedRunId = null,
  } = options ?? {};
  const issues = [];
  try {
    assertPublicSafeReceipt(receipt);
  } catch (error) {
    issues.push(error?.code ?? "receipt_public_safety_failed");
  }
  if (receipt?.schema !== LOCAL_CANONICAL_RECEIPT_SCHEMA) {
    issues.push("receipt_schema_mismatch");
  }
  if (![3, 4, 5].includes(receipt?.receipt_version)) {
    issues.push("receipt_version_mismatch");
  }
  if (!verifyReceiptIntegrity(receipt)) {
    issues.push("receipt_integrity_mismatch");
  }
  for (const field of [
    "repository",
    "integration_base",
    "checkout_ownership",
    "verification_context",
    "capacity_ownership",
    "evidence",
    "environment",
    "dependencies",
    "executor",
    "phases",
    "run",
    "cleanup",
    "final",
  ]) {
    if (!(field in (receipt ?? {}))) issues.push(`receipt_missing_${field}`);
  }
  if (
    !SHA_PATTERN.test(receipt?.repository?.base_sha ?? "") ||
    !SHA_PATTERN.test(receipt?.repository?.head_sha ?? "") ||
    typeof receipt?.repository?.repository_id !== "string" ||
    typeof receipt?.repository?.origin !== "string" ||
    typeof receipt?.repository?.detached !== "boolean" ||
    !(
      receipt?.repository?.branch === null ||
      typeof receipt?.repository?.branch === "string"
    )
  ) {
    issues.push("receipt_git_identity_invalid");
  }
  if (
    !SHA256_PATTERN.test(
      receipt?.dependencies?.root_lock_sha256 ?? "",
    ) ||
    !SHA256_PATTERN.test(
      receipt?.dependencies?.nested_lock_sha256 ?? "",
    ) ||
    !SHA256_PATTERN.test(
      receipt?.dependencies?.web_planning_lock_sha256 ?? "",
    ) ||
    !SHA256_PATTERN.test(
      receipt?.executor?.source_fingerprint ?? "",
    )
  ) {
    issues.push("receipt_source_identity_invalid");
  }
  if (
    !/^[0-9a-f]{32}$/u.test(
      receipt?.environment?.machine_fingerprint ?? "",
    )
  ) {
    issues.push("receipt_machine_identity_invalid");
  }
  const mode = receipt?.evidence?.mode;
  const selectedPlan = receipt?.evidence?.selected_plan;
  const context = receipt?.verification_context;
  const isolated = context?.kind === "isolated-worktree";
  if (context?.contract !== VERIFICATION_CONTEXT_CONTRACT ||
      !["canonical", "isolated-worktree"].includes(context?.kind) ||
      context?.repository_id !== CANONICAL_REPOSITORY_ID ||
      context?.admission !== (isolated ? "registered_worktree_of_authorized_mac" : "fixed_canonical_root") ||
      ![context?.anchor_fingerprint, context?.checkout_fingerprint, context?.git_common_fingerprint].every(value => SHA256_PATTERN.test(value ?? "")) ||
      (isolated && (context.checkout_fingerprint === context.anchor_fingerprint || receipt?.environment?.operating_system !== "macOS"))) {
    issues.push("receipt_verification_context_invalid");
  }
  if (!currentVerificationContext || canonicalSerialize(context) !== canonicalSerialize(currentVerificationContext))
    issues.push("receipt_stale_verification_context");
  if (!/^[0-9a-f]{32}$/u.test(receipt?.run?.invocation_id ?? "") ||
      !Array.isArray(receipt?.phases) || receipt.phases.some(phase => phase?.invocation_id !== receipt.run.invocation_id))
    issues.push("receipt_invocation_identity_invalid");
  if (typeof receipt?.run?.id !== "string" || !/^[A-Za-z0-9_-]{1,160}$/u.test(receipt.run.id) ||
      (expectedRunId !== null && expectedRunId !== receipt.run.id)) issues.push("receipt_run_identity_invalid");
  if (selectedPlan === "documentation-only") issues.push("documentation_feedback_not_deciding");
  if (mode === "changed" || mode === "full") {
    if (!validAdmittedIntegrationBase(receipt?.integration_base, receipt?.repository) ||
        Date.parse(receipt.integration_base?.observation?.observed_at) < Date.parse(receipt?.run?.started_at) ||
        Date.parse(receipt.integration_base?.checked_at) > Date.parse(receipt?.run?.finished_at)) {
      issues.push("receipt_integration_base_provenance_invalid");
    }
    if (!currentIntegrationBase?.observation) {
      issues.push("receipt_current_integration_base_unavailable");
    } else if (currentIntegrationBase.observation.sha !== receipt?.repository?.base_sha) {
      issues.push("receipt_stale_integration_base");
    } else if (!validAdmittedIntegrationBase(currentIntegrationBase, receipt?.repository) ||
        Date.parse(currentIntegrationBase.observation.observed_at) < Date.parse(receipt?.run?.finished_at) ||
        Date.parse(currentIntegrationBase.checked_at) < Date.parse(receipt?.run?.finished_at)) {
      issues.push("receipt_current_integration_base_invalid");
    }
    if (Array.isArray(receipt?.phases) && receipt.phases.some((phase) =>
      Date.parse(phase?.started_at) < Date.parse(receipt?.integration_base?.checked_at))) {
      issues.push("receipt_phases_precede_base_admission");
    }
  }
  const ownership = receipt?.checkout_ownership;
  const ownershipRequired = requiresCheckoutVerificationOwnership(selectedPlan) || isolated || ([4, 5].includes(receipt?.receipt_version) && mode !== "quick" && receipt?.phases?.length > 0);
  if (ownership?.required !== ownershipRequired || (ownershipRequired && (
    ownership?.acquired !== true || ownership?.released !== true || ownership?.failure_code !== null ||
    !SHA256_PATTERN.test(ownership?.checkout_fingerprint ?? "") ||
    !/^[0-9a-f]{32}$/u.test(ownership?.ownership_id ?? "") ||
    !isIsoTimestamp(ownership?.acquired_at) || !isIsoTimestamp(ownership?.released_at) ||
    Date.parse(ownership.acquired_at) < Date.parse(receipt?.run?.started_at) ||
    Date.parse(ownership.released_at) < Date.parse(ownership.acquired_at) ||
    Date.parse(ownership.released_at) > Date.parse(receipt?.run?.finished_at) ||
    (Array.isArray(receipt?.phases) && receipt.phases.some((phase) =>
      Date.parse(phase?.started_at) < Date.parse(ownership.acquired_at) ||
      Date.parse(phase?.finished_at) > Date.parse(ownership.released_at)))
  ))) {
    issues.push("receipt_checkout_ownership_invalid");
  }
  if (ownershipRequired && ownership?.checkout_fingerprint !== currentCheckoutFingerprint) {
    issues.push("receipt_stale_checkout_identity");
  }
  const capacity = receipt?.capacity_ownership;
  const capacityRequired = receipt?.environment?.operating_system === "macOS" && ["full-canonical", "owner-targeted"].includes(selectedPlan);
  if (capacity?.required !== capacityRequired || (capacityRequired && (
    capacity?.contract !== VERIFICATION_CAPACITY_CONTRACT || capacity?.acquired !== true || capacity?.released !== true ||
    capacity?.failure_code !== null || ![1, 2].includes(capacity?.limit) ||
    capacity.limit !== verificationCapacityLimit(receipt?.environment?.resources ?? {}) ||
    !Number.isSafeInteger(capacity?.slot) || capacity.slot < 1 || capacity.slot > capacity.limit ||
    capacity?.invocation_id !== receipt?.run?.invocation_id ||
    !SHA256_PATTERN.test(capacity?.checkout_fingerprint ?? "") || !/^[0-9a-f]{32}$/u.test(capacity?.ownership_id ?? "") ||
    !isIsoTimestamp(capacity?.acquired_at) || !isIsoTimestamp(capacity?.released_at) ||
    Date.parse(capacity.acquired_at) < Date.parse(receipt?.run?.started_at) ||
    Date.parse(capacity.released_at) > Date.parse(receipt?.run?.finished_at) ||
    Date.parse(capacity.released_at) < Date.parse(capacity.acquired_at) ||
    (Array.isArray(receipt?.phases) && receipt.phases.some(phase =>
      Date.parse(phase?.started_at) < Date.parse(capacity.acquired_at) || Date.parse(phase?.finished_at) > Date.parse(capacity.released_at)))
  ))) issues.push("receipt_capacity_ownership_invalid");
  const isolatedResources = receipt?.cleanup?.isolated_resources;
  if (isolatedResources?.required !== isolated || (isolated && (
    isolatedResources?.prepared !== true || isolatedResources?.completed !== true ||
    isolatedResources?.failure_count !== 0 || !Array.isArray(isolatedResources?.failures) || isolatedResources.failures.length !== 0 ||
    isolatedResources?.invocation_id !== receipt?.run?.invocation_id ||
    !SHA256_PATTERN.test(isolatedResources?.fingerprint ?? "") ||
    isolatedResources?.policy !== "private_outer_home_temp_cache_database_runtime"
  ))) issues.push("receipt_isolated_resource_provenance_invalid");
  const historical = receipt?.historical_inputs;
  const historicalRequired = isolated && Array.isArray(receipt?.phases) && receipt.phases.some(phase => phase?.id === "authority");
  if (historical?.required !== historicalRequired || (historicalRequired && (historical?.prepared !== true ||
    historical?.contract !== HISTORICAL_INPUT_CONTRACT || historical?.invocation_id !== receipt?.run?.invocation_id ||
    historical?.anchor_fingerprint !== receipt?.verification_context?.anchor_fingerprint ||
    !SHA256_PATTERN.test(historical?.source_fingerprint ?? "") || !SHA256_PATTERN.test(historical?.content_fingerprint ?? "") ||
    !Number.isSafeInteger(historical?.file_count) || historical.file_count < 1 ||
    !Number.isSafeInteger(historical?.byte_count) || historical.byte_count < 1 ||
    historical?.unchanged !== true || historical?.completed !== true ||
    !Array.isArray(historical?.failures) || historical.failures.length !== 0)))
    issues.push("receipt_historical_input_provenance_invalid");
  const service = receipt?.cleanup?.companion_service;
  if (isolated && ["before", "after"].some(side => {
    const state = service?.[side], observation = service?.observations?.[side];
    return state?.preservation_valid !== true || !SHA256_PATTERN.test(state?.preservation_binding ?? "") ||
      !["augnes.companion-preservation-observation.v1", "augnes.companion-preservation-observation.v2"].includes(observation?.contract) ||
      (observation?.contract === "augnes.companion-preservation-observation.v2" &&
        (!SHA256_PATTERN.test(observation.repository_binding_before ?? "") || observation.repository_binding_before !== observation.repository_binding_after ||
          observation.repository_observation_before !== "observed" || observation.repository_observation_after !== "observed")) ||
      observation?.samples !== 1 || observation?.coherent !== true || observation?.live_identity_valid !== true ||
      observation?.before_binding !== state.preservation_binding || observation?.after_binding !== state.preservation_binding ||
      !Number.isFinite(Date.parse(observation?.started_at)) || !Number.isFinite(Date.parse(observation?.finished_at)) ||
      Date.parse(observation.finished_at) < Date.parse(observation.started_at);
  })) issues.push("receipt_companion_observation_invalid");
  if (service?.scope !== (isolated ? "accepted_checkout_read_only" : "installed_checkout_lifecycle") ||
      (isolated && (service.maintenance_acquired !== false || service.before == null ||
        canonicalSerialize(service.before) !== canonicalSerialize(service.after))))
    issues.push("receipt_companion_scope_invalid");
  if (
    !["quick", "changed", "full"].includes(mode) ||
    (mode === "quick" && selectedPlan !== "quick-feedback") ||
    (mode === "changed" &&
      ![
        "documentation-only",
        "operating-policy-only",
        "owner-targeted",
        "full-canonical",
      ].includes(selectedPlan)) ||
    (mode === "full" && selectedPlan !== "full-canonical")
  ) {
    issues.push("receipt_mode_or_plan_invalid");
  }
  const plannerOwnerIds = receipt?.evidence?.planner_owner_ids;
  const plannerTargetedPhaseIds =
    receipt?.evidence?.planner_targeted_phase_ids;
  if (
    !Array.isArray(plannerOwnerIds) ||
    (mode !== "quick" && plannerOwnerIds.length === 0) ||
    new Set(plannerOwnerIds).size !== plannerOwnerIds.length ||
    plannerOwnerIds.some(
      (ownerId) =>
        typeof ownerId !== "string" ||
        !/^[a-z0-9][a-z0-9-]{0,79}$/u.test(ownerId),
    ) ||
    !Array.isArray(plannerTargetedPhaseIds) ||
    new Set(plannerTargetedPhaseIds).size !== plannerTargetedPhaseIds.length
  ) {
    issues.push("receipt_planner_ownership_invalid");
  }
  if (
    (mode === "quick" &&
      receipt?.evidence?.planner_event !== "local_quick") ||
    ((mode === "changed" || mode === "full") &&
      receipt?.evidence?.planner_event !== "pull_request")
  ) {
    issues.push("receipt_planner_event_invalid");
  }
  if (
    !isIsoTimestamp(receipt?.run?.started_at) ||
    !isIsoTimestamp(receipt?.run?.finished_at) ||
    !Number.isFinite(receipt?.run?.duration_ms) ||
    receipt.run.duration_ms < 0
  ) {
    issues.push("receipt_run_timing_invalid");
  }

  const phases = Array.isArray(receipt?.phases) ? receipt.phases : [];
  if (phases.length === 0) issues.push("receipt_missing_phases");
  if (
    expectedPhaseIds &&
    JSON.stringify(phases.map((phase) => phase?.id ?? null)) !==
      JSON.stringify(expectedPhaseIds)
  ) {
    issues.push("receipt_phase_inventory_mismatch");
  }
  if (
    selectedPlan === "owner-targeted" &&
    JSON.stringify(phases.map((phase) => phase?.id ?? null)) !==
      JSON.stringify(plannerTargetedPhaseIds)
  ) {
    issues.push("receipt_targeted_phase_inventory_mismatch");
  }
  if (selectedPlan === "owner-targeted") {
    const reusePhases = phases.filter((phase) => CODEX_REUSE_PHASE_IDS.includes(phase?.id));
    const requiresReuseChecks = Array.isArray(plannerOwnerIds) &&
      plannerOwnerIds.some((id) => CODEX_REUSE_OWNER_IDS.includes(id));
    const hasAggregateUnit = phases.some((phase) => phase?.id === "unit");
    if ((requiresReuseChecks && !hasAggregateUnit) || reusePhases.length > 0) {
      if (hasAggregateUnit ||
          JSON.stringify(reusePhases.map((phase) => phase.id)) !== JSON.stringify(CODEX_REUSE_PHASE_IDS)) {
        issues.push("receipt_codex_reuse_inventory_invalid");
      }
      for (const phase of reusePhases) {
        if (phase.command !== `node scripts/run-canonical-test-suite.mjs ${phase.id}` ||
            phase.cwd_scope !== "root" || phase.exclusive !== true || phase.browser !== false ||
            phase.cleanup?.termination_reason !== "natural_exit" ||
            phase.cleanup?.exit_observed !== true || phase.cleanup?.streams_closed !== true) {
          issues.push("receipt_codex_reuse_execution_invalid");
        }
      }
    }
    const dependencyPhases = phases.slice(
      1,
      1 + OWNER_TARGETED_DEPENDENCY_PHASES.length,
    );
    const dependencyPreparationValid =
      receipt?.dependencies?.policy ===
        "owner_targeted_clean_npm_ci_root_and_nested" &&
      receipt?.dependencies?.download_cache ===
        (isolated ? "invocation_private_cache_not_authoritative" : "npm_cache_reuse_permitted_not_authoritative") &&
      receipt?.dependencies?.installed_trees ===
        "replaced_from_lockfiles_by_npm_ci" &&
      dependencyPhases.length === OWNER_TARGETED_DEPENDENCY_PHASES.length &&
      dependencyPhases.every((phase, index) => {
        const expected = OWNER_TARGETED_DEPENDENCY_PHASES[index];
        return (
          phase?.id === expected.id &&
          phase?.command === expected.command &&
          phase?.cwd_scope === expected.cwd_scope &&
          phase?.exclusive === true &&
          phase?.browser === false
        );
      });
    if (!dependencyPreparationValid) {
      issues.push("receipt_targeted_dependency_provenance_invalid");
    }
  }
  if (
    selectedPlan === "owner-targeted" ||
    selectedPlan === "full-canonical"
  ) {
    const generatedNext = receipt?.cleanup?.generated_next;
    const generatedNextProvenanceValid =
      typeof generatedNext?.present_before === "boolean" &&
      typeof generatedNext?.removed_before_execution === "boolean" &&
      typeof generatedNext?.removed_after_execution === "boolean" &&
      generatedNext?.present_after_execution_cleanup === false &&
      typeof generatedNext?.present_after === "boolean" &&
      generatedNext.removed_before_execution ===
        generatedNext.present_before &&
      (generatedNext.present_after === false ||
        (["live", "starting"].includes(
          receipt?.cleanup?.companion_service?.before?.status,
        ) &&
          receipt?.cleanup?.companion_service?.after?.status === "live" &&
          receipt?.cleanup?.companion_service?.restored === true));
    if (!generatedNextProvenanceValid) {
      issues.push("receipt_generated_next_provenance_invalid");
    }
  }
  for (const phase of phases) {
    const browserLifecycleInvalid =
      phase?.browser === true &&
      (phase?.base_sha !== receipt?.repository?.base_sha ||
        phase?.head_sha !== receipt?.repository?.head_sha ||
        phase?.cleanup?.termination_reason !== "natural_exit" ||
        phase?.cleanup?.exit_observed !== true ||
        phase?.cleanup?.streams_closed !== true ||
        phase?.cleanup?.listener_residue_count !== 0);
    if (
      phase?.status !== "pass" ||
      phase?.exit_status !== 0 ||
      phase?.timed_out !== false ||
      phase?.cleanup?.completed !== true ||
      phase?.cleanup?.remaining_owned_processes !== 0 ||
      !Number.isFinite(phase?.duration_ms) ||
      phase.duration_ms < 0 ||
      !isIsoTimestamp(phase?.started_at) ||
      !isIsoTimestamp(phase?.finished_at) ||
      browserLifecycleInvalid
    ) {
      issues.push(`phase_not_passing:${safeIdentifier(phase?.id)}`);
    }
  }
  if (
    receipt?.cleanup?.completed !== true ||
    receipt?.cleanup?.remaining_owned_processes !== 0
  ) {
    issues.push("receipt_cleanup_incomplete");
  }
  if (
    receipt?.cleanup?.companion_service?.restored !== true ||
    receipt?.cleanup?.companion_service?.maintenance_released !== true
  ) {
    issues.push("receipt_companion_service_not_restored");
  }
  if (
    receipt?.final?.result !== "pass" ||
    receipt?.final?.exit_status !== 0
  ) {
    issues.push("receipt_final_result_not_pass");
  }
  if (
    receipt?.environment?.node?.canonical_match !== true ||
    receipt?.environment?.node?.actual_version !==
      receipt?.environment?.node?.canonical_version
  ) {
    issues.push("receipt_canonical_node_mismatch");
  }
  if (
    receipt?.evidence?.deciding !== true ||
    receipt?.evidence?.transferable !== true
  ) {
    issues.push("receipt_non_deciding");
  }
  if (
    receipt?.repository?.worktree_before !== "clean" ||
    receipt?.repository?.worktree_after !== "clean"
  ) {
    issues.push("receipt_dirty_worktree");
  }

  if (currentIdentity) {
    if (receipt?.repository?.head_sha !== currentIdentity.head_sha) {
      issues.push("receipt_stale_head");
    }
    if (currentIdentity.worktree_dirty) {
      issues.push("receipt_current_worktree_dirty");
    }
    if (receipt?.repository?.origin !== currentIdentity.origin) {
      issues.push("receipt_stale_origin");
    }
    if (
      receipt?.repository?.branch !== currentIdentity.branch ||
      receipt?.repository?.detached !== currentIdentity.detached
    ) {
      issues.push("receipt_stale_branch_state");
    }
  }
  if (currentLocks) {
    if (
      receipt?.dependencies?.root_lock_sha256 !== currentLocks.root ||
      receipt?.dependencies?.nested_lock_sha256 !== currentLocks.nested ||
      receipt?.dependencies?.web_planning_lock_sha256 !== currentLocks.webPlanning
    ) {
      issues.push("receipt_stale_lockfiles");
    }
  }
  if (
    currentExecutorFingerprint &&
    receipt?.executor?.source_fingerprint !== currentExecutorFingerprint
  ) {
    issues.push("receipt_stale_executor");
  }
  if (
    expectedSelectedPlan &&
    receipt?.evidence?.selected_plan !== expectedSelectedPlan
  ) {
    issues.push("receipt_stale_plan");
  }
  if (
    expectedOwnerIds &&
    JSON.stringify(plannerOwnerIds) !== JSON.stringify(expectedOwnerIds)
  ) {
    issues.push("receipt_stale_owners");
  }
  if (
    expectedTargetedPhaseIds &&
    JSON.stringify(plannerTargetedPhaseIds) !==
      JSON.stringify(expectedTargetedPhaseIds)
  ) {
    issues.push("receipt_stale_targeted_phases");
  }
  if (currentEnvironment) {
    for (const [receiptPath, currentValue] of [
      ["machine_fingerprint", currentEnvironment.machine_fingerprint],
      ["operating_system", currentEnvironment.operating_system],
      [
        "operating_system_version",
        currentEnvironment.operating_system_version,
      ],
      [
        "operating_system_build",
        currentEnvironment.operating_system_build,
      ],
      ["architecture", currentEnvironment.architecture],
      ["npm_version", currentEnvironment.npm_version],
    ]) {
      if (receipt?.environment?.[receiptPath] !== currentValue) {
        issues.push("receipt_stale_environment");
      }
    }
    if (
      receipt?.environment?.node?.actual_version !==
        currentEnvironment.node.actual_version ||
      receipt?.environment?.node?.path_version !==
        currentEnvironment.node.path_version ||
      receipt?.environment?.node?.canonical_version !==
        currentEnvironment.node.canonical_version ||
      receipt?.environment?.node?.compatibility_range !==
        currentEnvironment.node.compatibility_range
    ) {
      issues.push("receipt_stale_environment");
    }
  }

  // Route markers cannot evade classified checks by claiming the supported
  // legacy receipt version. Genuine legacy records remain under their old rules.
  if (receipt?.receipt_version !== 4 && (receipt?.attempt?.source_correction?.schema === CLOSEOUT_SCHEMA ||
      receipt?.attempt?.source_correction?.kind === "issue_1559_closeout" || receipt?.attempt?.closeout_authority || receipt?.attempt?.closeout_consumed))
    issues.push("receipt_1559_closeout_invalid");
  if ([4, 5].includes(receipt?.receipt_version)) {
    inspectClassifiedEvidence(receipt, issues);
    if (currentAttemptRecordsValid !== true) issues.push("receipt_attempt_records_unverified");
    if (currentInputStateValid !== true) issues.push("receipt_current_inputs_unverified");
  }
  if (receipt?.receipt_version === 5) {
    const b = receipt.browser_input, replacement = receipt.attempt?.browser_replacement, correction = receipt.attempt?.source_correction;
    const strictSource = isStrictBrowserSourceRevision(correction) && receipt.attempt?.input_replacement_consumed === true;
    const proof = replacement ?? correction;
    if (b?.contract !== BROWSER_INPUT_CONTRACT || !validBrowserBundle(b?.bundle) || !SHA256_PATTERN.test(b?.fingerprint ?? "") ||
        digest(b) !== digest(receipt.inputs?.binding?.browser_input) || (replacement ? replacement.contract !== BROWSER_REPLACEMENT_CONTRACT || !!correction : !strictSource) ||
        digest(b) !== proof?.browser_input_sha256 || receipt.attempt?.recovery || receipt.attempt?.number !== 1 ||
        receipt.browser_guard?.acquired !== true || receipt.browser_guard?.released !== true || receipt.browser_guard?.run_id !== receipt.run?.id ||
        digest(receipt.phases?.map(p => p.id)) !== digest(BROWSER_REPLACEMENT_PHASES) || receipt.evidence?.mode !== "full" ||
        currentBrowserInputValid !== true || !receipt.inputs?.resources?.some(r => r?.id === "browser-bundle" && r.browserBundle === true && digest(r.before) === digest(b.bundle))) issues.push("receipt_browser_input_invalid");
  } else if (receipt?.browser_input || receipt?.browser_guard || receipt?.attempt?.browser_replacement || receipt?.attempt?.source_correction?.browser_input_path || receipt?.inputs?.binding?.browser_input || (Array.isArray(receipt?.inputs?.resources) && receipt.inputs.resources.some(r => r?.browserBundle))) issues.push("receipt_browser_input_downgrade");
  const applicabilityCodes = new Set(["receipt_stale_integration_base", "receipt_current_integration_base_unavailable", "receipt_current_integration_base_invalid", "receipt_stale_head", "receipt_current_worktree_dirty", "receipt_stale_branch_state", "receipt_current_inputs_unverified"]);
  return {
    valid_deciding_evidence: issues.length === 0,
    status: issues.length === 0 ? "valid" : "non_deciding_or_stale",
    issues: [...new Set(issues)].sort(),
    dimensions: {
      execution: phases.every(p => p?.status === "pass" && p?.exit_status === 0 && !p?.timed_out) && phases.length > 0 ? "complete_pass" : "incomplete_or_failed",
      historical_integrity: verifyReceiptIntegrity(receipt) ? "intact" : "invalid",
      evidence_validity: issues.filter(code => !applicabilityCodes.has(code)).length === 0 ? "valid_in_recorded_context" : "invalid_or_incomplete",
      safety: [4, 5].includes(receipt?.receipt_version) ? receipt?.outcome?.safety ?? "unknown" : "legacy_recorded_scope",
      current_merge_applicability: issues.some(code => applicabilityCodes.has(code)) ? "blocked" : "matches_observed_context",
    },
    content_fingerprint:
      receipt?.integrity?.content_fingerprint ?? null,
  };
}

function inspectClassifiedEvidence(receipt, issues) {
  const input = receipt.inputs;
  if (!input || !supportedInputContract(input.contract) || !Array.isArray(input.resources) || !Array.isArray(input.events) ||
      !input.resources.every(r => r && typeof r === "object") || !input.events.every(e => e && typeof e === "object") ||
      !Array.isArray(receipt.phases) || !receipt.phases.every(p => p && typeof p === "object")) {
    issues.push("receipt_input_contract_missing"); return;
  }
  const declaration = { contract: input.contract, path_kind: input.path_kind, binding: input.binding, resources: input.resources };
  if (input.fingerprint !== digest(declaration) || input.binding?.head !== receipt.repository.head_sha ||
      input.binding?.tree !== receipt.repository.tree_sha || !SHA_PATTERN.test(receipt.repository.tree_sha ?? "") ||
      input.binding?.executor_fingerprint !== receipt.executor.source_fingerprint || (!Number.isSafeInteger(input.checks) || input.checks < 1) ||
      !["isolated-model-free-v1", "canonical-conservative-v1"].includes(input.path_kind) ||
      (input.path_kind === "isolated-model-free-v1" && receipt.verification_context.kind !== "isolated-worktree")) issues.push("receipt_input_binding_invalid");
  if (input.first_fault || input.events.some(e => !nonFaultInputChange(e.disposition))) issues.push("receipt_input_observation_blocked");
  if (!validInputFailureDiagnostics(input) ||
      ((input.first_fault?.diagnostic !== undefined || receipt.outcome?.first_fault?.diagnostic !== undefined) &&
       digest(input.first_fault ?? null) !== digest(receipt.outcome?.first_fault ?? null))) issues.push("receipt_input_diagnostic_invalid");
  for (const event of input.events) {
    const resource = input.resources.find(r => r.id === event.resource);
    const observedFailure = event.disposition === "observer_failure" && event.after === null && validObservationDiagnostic(event.diagnostic);
    if (!resource || event.classification !== resource.classification ||
        (!observedFailure && (!event.after || event.diagnostic !== undefined || classifyInputChange(resource.before, event.after, resource, input) !== event.disposition)) ||
        event.identity !== inputEventIdentity(event)) issues.push("receipt_input_event_invalid");
  }
  if (input.resources.some(r => r.readOnlyExecutable && (r.classification !== "execution" || r.metadataOnly || r.excludePreferences))) issues.push("receipt_input_role_invalid");
  try { for (const resource of input.resources) effectiveInputObservation(resource.before, resource, input); }
  catch { issues.push("receipt_input_role_invalid"); }
  const environments = input.binding?.phase_environment_fingerprints;
  if (!Array.isArray(environments) || !environments.every(e => e && typeof e === "object") || environments.length !== receipt.phases.length ||
      new Set(environments.map(e => e.id)).size !== environments.length || receipt.phases.some(p => !environments.some(e =>
        e.id === p.id && SHA256_PATTERN.test(e.fingerprint ?? "") && e.fingerprint === p.environment_fingerprint)))
    issues.push("receipt_phase_environment_binding_invalid");
  if (input.resources.some(r => r.excludePreferences && (input.path_kind !== "isolated-model-free-v1" || r.classification !== "ambient"))) issues.push("receipt_input_exclusion_invalid");
  if (new Set(input.resources.map(r => r.id)).size !== input.resources.length ||
      ["codex-preferences", "user-instructions", "auth-location", "git-config", "node-executable"].some(id => !input.resources.some(r => r.id === id))) issues.push("receipt_input_inventory_invalid");
  const attempt = receipt.attempt;
  if (attempt?.source_correction?.schema === CLOSEOUT_SCHEMA || attempt?.source_correction?.kind === "issue_1559_closeout" || attempt?.closeout_authority || attempt?.closeout_consumed) {
    if (receipt.receipt_version !== 4 || !validCloseoutAttempt(attempt) || receipt.evidence.mode !== "full" ||
        receipt.verification_context.kind !== "isolated-worktree" || attempt.source_correction.base !== receipt.repository.base_sha ||
        digest(receipt.phases.map(p => p.id)) !== digest(BROWSER_REPLACEMENT_PHASES)) issues.push("receipt_1559_closeout_invalid");
  }
  if (attempt?.source_correction?.schema === "augnes.local-canonical-source-correction.v3" || attempt?.observer_authority) {
    if (receipt.receipt_version !== 4 || !validObserverAttempt(attempt) || receipt.evidence.mode !== "full" ||
        receipt.verification_context.kind !== "isolated-worktree" || attempt.source_correction.base !== receipt.repository.base_sha ||
        digest(receipt.phases.map(p => p.id)) !== digest(BROWSER_REPLACEMENT_PHASES)) issues.push("receipt_observer_succession_invalid");
  }
  if (attempt?.source_correction?.schema === COMPANION_TIMEOUT_SCHEMA || attempt?.source_correction?.kind === "companion_readiness_timeout" || attempt?.companion_timeout_authority || attempt?.companion_timeout_consumed) {
    if (receipt.receipt_version !== 4 || !validCompanionTimeoutAttempt(attempt) || receipt.evidence.mode !== "full" ||
        receipt.verification_context.kind !== "isolated-worktree" || attempt.source_correction.base !== receipt.repository.base_sha ||
        digest(receipt.phases.map(p => p.id)) !== digest(BROWSER_REPLACEMENT_PHASES)) issues.push("receipt_companion_timeout_succession_invalid");
  }
  if (attempt?.source_correction?.schema === TIMEOUT_REPAIR_SCHEMA || attempt?.timeout_authority) {
    if (receipt.receipt_version !== 4 || !validTimeoutAttempt(attempt) || receipt.evidence.mode !== "full" ||
        receipt.verification_context.kind !== "isolated-worktree" || attempt.source_correction.base !== receipt.repository.base_sha ||
        digest(receipt.phases.map(p => p.id)) !== digest(BROWSER_REPLACEMENT_PHASES)) issues.push("receipt_timeout_succession_invalid");
  }
  if (attempt?.source_correction?.schema === CONDITION_REQUALIFICATION_SCHEMA || attempt?.source_correction?.kind === "condition_requalification" || attempt?.condition_authority || attempt?.condition_requalification_consumed) {
    if (receipt.receipt_version !== 4 || !validConditionRequalificationAttempt(attempt) || receipt.evidence.mode !== "full" ||
        receipt.verification_context.kind !== "isolated-worktree" || attempt.source_correction.base !== receipt.repository.base_sha ||
        digest(receipt.phases.map(p => p.id)) !== digest(BROWSER_REPLACEMENT_PHASES)) issues.push("receipt_condition_requalification_invalid");
  }

  if (attempt?.source_correction?.schema === GUIDE_CORRECTION_SCHEMA || attempt?.source_correction?.kind === "guide_cancellation_correction" || attempt?.guide_authority || attempt?.guide_correction_consumed) {
    if (receipt.receipt_version !== 4 || !validGuideCorrectionAttempt(attempt) || receipt.evidence.mode !== "full" ||
        receipt.verification_context.kind !== "isolated-worktree" || attempt.source_correction.base !== receipt.repository.base_sha ||
        digest(receipt.phases.map(p => p.id)) !== digest(BROWSER_REPLACEMENT_PHASES)) issues.push("receipt_guide_correction_invalid");
  }

  if (receipt.evidence.mode !== "quick" && (attempt?.contract !== ATTEMPT_CONTRACT || ![1, 2].includes(attempt.number) ||
      attempt.attempt_id !== receipt.run.id || attempt.head !== receipt.repository.head_sha || attempt.tree !== receipt.repository.tree_sha ||
      attempt.contract_fingerprint !== input.fingerprint || attempt.budget?.initial !== 1 || attempt.budget?.recovery !== (receipt.receipt_version === 5 || isObserverRepair(attempt.source_correction) || isCorrectedTimeout(attempt.source_correction) || isConditionRequalification(attempt.source_correction) || isGuideCorrection(attempt.source_correction) || isCompanionTimeout(attempt.source_correction) || isCloseout(attempt.source_correction) ? 0 : 1) ||
      (attempt.number === 1 && (attempt.prior_attempt_id !== null || attempt.recovery !== null)) ||
      (attempt.number === 2 && (!SHA256_PATTERN.test(attempt.prior_receipt_fingerprint ?? "") || !attempt.recovery)))) issues.push("receipt_attempt_lineage_invalid");
  const expectedBrowser = input.resources.find(r => r.id === "browser-executable");
  let actualVersion = null;
  for (const phase of receipt.phases) {
    if (phase.status === "not_run") {
      if (phase.browser_use?.length) issues.push(`receipt_browser_identity_invalid:${safeIdentifier(phase.id)}`);
      continue;
    }
    if (!validPhaseBrowserUse(phase, phase.browser_use ?? [], expectedBrowser ? { ...expectedBrowser, actual_version: actualVersion, ...(receipt.receipt_version === 5 ? { browser_input: receipt.browser_input } : {}) } : null))
      issues.push(`receipt_browser_identity_invalid:${safeIdentifier(phase.id)}`);
    actualVersion ??= phase.browser_use?.[0]?.actual_version ?? null;
  }
  const disposition = deriveOperationalDisposition({ phases: receipt.phases, admitted: true,
    fault: input.first_fault, cleanup: receipt.cleanup.completed });
  if (receipt.outcome?.disposition !== disposition || disposition !== "completed_success" ||
      receipt.outcome?.validity !== "valid_within_observed_scope" || receipt.outcome?.safety !== "preserved_within_observed_scope") issues.push("receipt_classified_outcome_not_passing");
}

function validAdmittedIntegrationBase(value, repository) {
  const observation = value?.observation;
  return value?.contract === INTEGRATION_BASE_CONTRACT &&
    value?.status === "admitted" && value?.reason_code === null &&
    value?.requested_base_sha === repository?.base_sha &&
    value?.tested_head_sha === repository?.head_sha &&
    value?.requested_base_sha !== value?.tested_head_sha &&
    value?.base_matches_current_main === true && value?.base_is_ancestor_of_head === true &&
    observation?.source === INTEGRATION_BASE_SOURCE &&
    observation?.repository_id === CANONICAL_REPOSITORY_ID &&
    observation?.repository_id === repository?.repository_id && observation?.branch === "main" &&
    observation?.sha === repository?.base_sha && SHA_PATTERN.test(observation?.sha ?? "") &&
    isIsoTimestamp(observation?.observed_at) && isIsoTimestamp(value?.checked_at) &&
    Date.parse(value.checked_at) >= Date.parse(observation.observed_at);
}

function isIsoTimestamp(value) {
  return (
    typeof value === "string" &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}

export function readReceiptFile(receiptPath) {
  const source = readFileSync(receiptPath, "utf8");
  if (Buffer.byteLength(source, "utf8") > MAX_RECEIPT_BYTES + 1) {
    throw receiptError(
      "receipt_exceeds_size_bound",
      "local canonical receipt file exceeds its size bound",
    );
  }
  return JSON.parse(source);
}

function sortCanonicalValue(value) {
  if (Array.isArray(value)) return value.map(sortCanonicalValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort(compareCodeUnits)
        .map((key) => [key, sortCanonicalValue(value[key])]),
    );
  }
  return value;
}

function assertSafeFieldNames(value) {
  if (Array.isArray(value)) {
    value.forEach(assertSafeFieldNames);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_FIELD_NAMES.has(key.toLowerCase())) {
      throw receiptError(
        "receipt_contains_forbidden_field",
        "local canonical receipt contains a forbidden field",
      );
    }
    assertSafeFieldNames(child);
  }
}

function receiptError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function safeIdentifier(value) {
  return typeof value === "string" && /^[a-z0-9_-]{1,80}$/u.test(value)
    ? value
    : "unknown";
}

function compareCodeUnits(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}
