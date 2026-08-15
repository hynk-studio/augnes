import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

export const LOCAL_CANONICAL_RECEIPT_SCHEMA =
  "augnes.local-canonical-receipt.v1";
export const LOCAL_CANONICAL_EXECUTOR_VERSION = 1;
export const MAX_RECEIPT_BYTES = 512 * 1024;

const SHA_PATTERN = /^[0-9a-f]{40}$/u;
const SHA256_PATTERN = /^[0-9a-f]{64}$/u;
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
    currentIdentity = null,
    currentLocks = null,
    currentExecutorFingerprint = null,
    expectedSelectedPlan = null,
    currentEnvironment = null,
    expectedPhaseIds = null,
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
  if (!verifyReceiptIntegrity(receipt)) {
    issues.push("receipt_integrity_mismatch");
  }
  for (const field of [
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
  if (
    !["quick", "changed", "full"].includes(mode) ||
    (mode === "quick" && selectedPlan !== "quick-feedback") ||
    (mode === "changed" &&
      !["documentation-only", "full-canonical"].includes(selectedPlan)) ||
    (mode === "full" && selectedPlan !== "full-canonical")
  ) {
    issues.push("receipt_mode_or_plan_invalid");
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
      receipt?.dependencies?.nested_lock_sha256 !== currentLocks.nested
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

  return {
    valid_deciding_evidence: issues.length === 0,
    status: issues.length === 0 ? "valid" : "non_deciding_or_stale",
    issues: [...new Set(issues)].sort(),
    content_fingerprint:
      receipt?.integrity?.content_fingerprint ?? null,
  };
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
