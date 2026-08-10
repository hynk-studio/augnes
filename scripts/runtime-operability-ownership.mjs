export const RUNTIME_OPERABILITY_MAX_CHILD_TIMEOUT_MS = 120_000;

export const RUNTIME_OPERABILITY_REQUIRED_RESPONSIBILITIES = Object.freeze([
  "runtime-distribution-update-recovery-environment-and-path-contracts",
  "source-supervisor-ready-status-duplicate-collision-and-stop",
  "source-ui-core-and-bridge-readiness",
  "official-mcp-client-stdio-and-private-companion-boundary",
  "companion-discovery-identity-and-public-privacy",
  "repository-onboarding-registration-and-physical-root-identity",
  "initial-work-definition-and-pre-execution-revision",
  "repository-continuity-browser-selection-and-attachment-binding",
  "managed-start-exact-replay-result-receipt-and-proposal",
  "same-path-physical-replacement-refusal",
  "poisoned-environment-restart",
  "parent-signal-cleanup",
  "required-child-failure",
  "unverified-ownership-refusal",
  "resume-eligibility-after-required-child-crash-and-restart",
  "resume-read-selection-independence-and-worktree-drift",
  "browser-confirmed-same-run-resume-and-pre-marker-reacquisition",
  "resume-exact-replay-generation-checkpoint-and-terminal-result",
  "ambiguous-operation-reconciliation",
  "pending-approval-preservation",
  "provider-network-repository-database-and-project-file-isolation",
  "final-process-listener-port-stream-runtime-and-temp-cleanup",
]);

export const RUNTIME_OPERABILITY_REPEATED_INVARIANTS = Object.freeze([
  "real-source-runtime-ui-core-and-bridge",
  "official-mcp-client-over-stdio-companion-proxy-and-strict-ui-core-path",
  "browser-confirmed-repository-decision-boundary",
  "isolated-writable-database-runtime-repository-session-and-process-state",
  "zero-provider-network-and-ambient-repository-effects",
  "natural-exit-observed-exit-closed-streams-complete-cleanup-and-zero-residue",
]);

export const RUNTIME_OPERABILITY_INTENTIONALLY_REPEATED_RESPONSIBILITIES =
  Object.freeze([
    "provider-network-repository-database-and-project-file-isolation",
    "final-process-listener-port-stream-runtime-and-temp-cleanup",
  ]);

export const RUNTIME_OPERABILITY_OWNERS = Object.freeze([
  Object.freeze({
    id: "runtime-supervisor-lifecycle",
    selector: "lifecycle",
    shard: "operability-supervisor",
    label:
      "supervisor lifecycle, official MCP, managed Start, ownership, and cleanup",
    timeoutMs: 90_000,
    measuredResponsibilityMs: 42_267,
    requireNaturalExit: true,
    requirements: Object.freeze([
      "database",
      "migrations",
      "process-owning",
      "listener-port-owning",
      "filesystem",
      "project-root",
      "nested-app-runtime",
    ]),
    responsibilities: Object.freeze([
      "runtime-distribution-update-recovery-environment-and-path-contracts",
      "source-supervisor-ready-status-duplicate-collision-and-stop",
      "source-ui-core-and-bridge-readiness",
      "official-mcp-client-stdio-and-private-companion-boundary",
      "companion-discovery-identity-and-public-privacy",
      "repository-onboarding-registration-and-physical-root-identity",
      "initial-work-definition-and-pre-execution-revision",
      "repository-continuity-browser-selection-and-attachment-binding",
      "managed-start-exact-replay-result-receipt-and-proposal",
      "same-path-physical-replacement-refusal",
      "poisoned-environment-restart",
      "parent-signal-cleanup",
      "required-child-failure",
      "unverified-ownership-refusal",
      "provider-network-repository-database-and-project-file-isolation",
      "final-process-listener-port-stream-runtime-and-temp-cleanup",
    ]),
  }),
  Object.freeze({
    id: "runtime-supervisor-resume",
    selector: "resume",
    shard: "operability-supervisor",
    label:
      "supervisor same-run Resume, reconciliation, approval, and cleanup",
    timeoutMs: 105_000,
    measuredResponsibilityMs: 70_351,
    requireNaturalExit: true,
    requirements: Object.freeze([
      "database",
      "migrations",
      "process-owning",
      "listener-port-owning",
      "filesystem",
      "project-root",
      "nested-app-runtime",
    ]),
    responsibilities: Object.freeze([
      "resume-eligibility-after-required-child-crash-and-restart",
      "resume-read-selection-independence-and-worktree-drift",
      "browser-confirmed-same-run-resume-and-pre-marker-reacquisition",
      "resume-exact-replay-generation-checkpoint-and-terminal-result",
      "ambiguous-operation-reconciliation",
      "pending-approval-preservation",
      "provider-network-repository-database-and-project-file-isolation",
      "final-process-listener-port-stream-runtime-and-temp-cleanup",
    ]),
  }),
]);

export function validateRuntimeOperabilityOwnership(owners) {
  if (!Array.isArray(owners) || owners.length !== 2) {
    throw ownershipError("runtime_operability_owner_missing");
  }
  const ownerIds = owners.map((owner) => owner.id);
  const selectors = owners.map((owner) => owner.selector);
  if (
    new Set(ownerIds).size !== ownerIds.length ||
    new Set(selectors).size !== selectors.length
  ) {
    throw ownershipError("runtime_operability_owner_duplicate");
  }
  for (const owner of owners) {
    if (
      !Number.isInteger(owner.timeoutMs) ||
      owner.timeoutMs <= 0 ||
      owner.timeoutMs > RUNTIME_OPERABILITY_MAX_CHILD_TIMEOUT_MS
    ) {
      throw ownershipError("runtime_operability_timeout_invalid");
    }
    if (owner.requireNaturalExit !== true) {
      throw ownershipError("runtime_operability_natural_exit_not_required");
    }
    if (!Array.isArray(owner.requirements) || owner.requirements.length === 0) {
      throw ownershipError("runtime_operability_requirements_missing");
    }
  }

  const ownershipCounts = new Map(
    RUNTIME_OPERABILITY_REQUIRED_RESPONSIBILITIES.map((id) => [id, 0]),
  );
  for (const owner of owners) {
    for (const responsibility of owner.responsibilities) {
      if (!ownershipCounts.has(responsibility)) {
        throw ownershipError("runtime_operability_responsibility_unknown");
      }
      ownershipCounts.set(
        responsibility,
        ownershipCounts.get(responsibility) + 1,
      );
    }
  }
  for (const [responsibility, count] of ownershipCounts) {
    const repeated =
      RUNTIME_OPERABILITY_INTENTIONALLY_REPEATED_RESPONSIBILITIES.includes(
        responsibility,
      );
    if (count === 0) {
      throw ownershipError(
        "runtime_operability_responsibility_missing",
        responsibility,
      );
    }
    if (repeated && count !== owners.length) {
      throw ownershipError(
        "runtime_operability_repeated_invariant_incomplete",
        responsibility,
      );
    }
    if (!repeated && count !== 1) {
      throw ownershipError(
        "runtime_operability_responsibility_duplicate",
        responsibility,
      );
    }
  }
  return true;
}

export function runtimeOperabilityOwnerForSelector(selector) {
  const owner = RUNTIME_OPERABILITY_OWNERS.find(
    (candidate) => candidate.selector === selector,
  );
  if (!owner) throw ownershipError("runtime_operability_owner_unknown");
  return owner;
}

export function buildRuntimeOperabilityCanonicalSteps(rootNode) {
  validateRuntimeOperabilityOwnership(RUNTIME_OPERABILITY_OWNERS);
  return RUNTIME_OPERABILITY_OWNERS.map((owner) => ({
    id: owner.id,
    shard: owner.shard,
    requirements: owner.requirements,
    label: owner.label,
    ...rootNode("scripts/test-runtime-operability.mjs", owner.selector),
    timeoutMs: owner.timeoutMs,
    requireNaturalExit: owner.requireNaturalExit,
  }));
}

function ownershipError(code, responsibility = null) {
  const error = new Error(
    responsibility ? `${code}: ${responsibility}` : code,
  );
  error.code = code;
  return error;
}

validateRuntimeOperabilityOwnership(RUNTIME_OPERABILITY_OWNERS);
