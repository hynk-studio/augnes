export const RUNTIME_OPERABILITY_MAX_CHILD_TIMEOUT_MS = 120_000;

export const RUNTIME_OPERABILITY_CANONICAL_PLATFORMS = Object.freeze([
  "darwin",
  "linux",
  "win32",
]);

const RUNTIME_OPERABILITY_NON_WINDOWS_PLATFORMS = Object.freeze([
  "darwin",
  "linux",
]);

const ALL_PLATFORMS = RUNTIME_OPERABILITY_CANONICAL_PLATFORMS;
const NON_WINDOWS_PLATFORMS = RUNTIME_OPERABILITY_NON_WINDOWS_PLATFORMS;

export const RUNTIME_OPERABILITY_RESPONSIBILITY_CONTRACTS = Object.freeze([
  responsibility(
    "runtime-distribution-update-recovery-environment-and-path-contracts",
    ALL_PLATFORMS,
  ),
  responsibility(
    "source-supervisor-ready-status-duplicate-collision-and-stop",
    ALL_PLATFORMS,
  ),
  responsibility("source-ui-core-and-bridge-readiness", ALL_PLATFORMS),
  responsibility(
    "official-mcp-client-stdio-and-private-companion-boundary",
    ALL_PLATFORMS,
  ),
  responsibility(
    "companion-discovery-identity-and-public-privacy",
    ALL_PLATFORMS,
  ),
  responsibility(
    "repository-onboarding-registration-and-physical-root-identity",
    ALL_PLATFORMS,
  ),
  responsibility(
    "initial-work-definition-and-pre-execution-revision",
    ALL_PLATFORMS,
  ),
  responsibility(
    "repository-continuity-browser-selection-and-attachment-binding",
    ALL_PLATFORMS,
  ),
  responsibility(
    "managed-start-exact-replay-result-receipt-and-proposal",
    ALL_PLATFORMS,
  ),
  responsibility("same-path-physical-replacement-refusal", ALL_PLATFORMS),
  responsibility("poisoned-environment-restart", ALL_PLATFORMS),
  responsibility("parent-signal-cleanup", ALL_PLATFORMS),
  responsibility("required-child-failure", ALL_PLATFORMS),
  responsibility("unverified-ownership-refusal", ALL_PLATFORMS),
  responsibility(
    "resume-eligibility-after-required-child-crash-and-restart",
    NON_WINDOWS_PLATFORMS,
  ),
  responsibility(
    "resume-read-selection-independence-and-worktree-drift",
    NON_WINDOWS_PLATFORMS,
  ),
  responsibility(
    "browser-confirmed-same-run-resume-and-pre-marker-reacquisition",
    NON_WINDOWS_PLATFORMS,
  ),
  responsibility(
    "resume-exact-replay-generation-checkpoint-and-terminal-result",
    NON_WINDOWS_PLATFORMS,
  ),
  responsibility("ambiguous-operation-reconciliation", NON_WINDOWS_PLATFORMS),
  responsibility("pending-approval-preservation", NON_WINDOWS_PLATFORMS),
  responsibility("real-source-runtime-ui-core-and-bridge", ALL_PLATFORMS),
  responsibility(
    "official-mcp-client-over-stdio-companion-proxy-and-strict-ui-core-path",
    ALL_PLATFORMS,
  ),
  responsibility(
    "browser-confirmed-repository-decision-boundary",
    ALL_PLATFORMS,
  ),
  responsibility(
    "isolated-writable-database-runtime-repository-session-and-process-state",
    ALL_PLATFORMS,
  ),
  responsibility(
    "zero-provider-network-and-ambient-repository-effects",
    ALL_PLATFORMS,
  ),
  responsibility(
    "natural-exit-observed-exit-closed-streams-complete-cleanup-and-zero-residue",
    ALL_PLATFORMS,
  ),
]);

export const RUNTIME_OPERABILITY_INTENTIONALLY_REPEATED_RESPONSIBILITIES =
  Object.freeze([
    "real-source-runtime-ui-core-and-bridge",
    "official-mcp-client-over-stdio-companion-proxy-and-strict-ui-core-path",
    "browser-confirmed-repository-decision-boundary",
    "isolated-writable-database-runtime-repository-session-and-process-state",
    "zero-provider-network-and-ambient-repository-effects",
    "natural-exit-observed-exit-closed-streams-complete-cleanup-and-zero-residue",
  ]);

const REPEATED_RESPONSIBILITIES =
  RUNTIME_OPERABILITY_INTENTIONALLY_REPEATED_RESPONSIBILITIES;

export const RUNTIME_OPERABILITY_OWNERS = Object.freeze([
  Object.freeze({
    id: "runtime-supervisor-lifecycle",
    selector: "lifecycle",
    platforms: ALL_PLATFORMS,
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
      ...REPEATED_RESPONSIBILITIES,
    ]),
  }),
  Object.freeze({
    id: "runtime-supervisor-resume",
    selector: "resume",
    platforms: NON_WINDOWS_PLATFORMS,
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
      ...REPEATED_RESPONSIBILITIES,
    ]),
  }),
]);

export function validateRuntimeOperabilityOwnership(
  owners,
  platform = process.platform,
) {
  assertCanonicalPlatform(platform);
  if (!Array.isArray(owners)) {
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

  for (const owner of owners) validateOwnerDeclaration(owner);

  const applicableOwners = owners.filter((owner) =>
    owner.platforms.includes(platform),
  );
  const expectedOwnerIds = RUNTIME_OPERABILITY_OWNERS.filter((owner) =>
    owner.platforms.includes(platform),
  ).map((owner) => owner.id);
  const applicableOwnerIds = applicableOwners.map((owner) => owner.id);
  if (expectedOwnerIds.some((id) => !applicableOwnerIds.includes(id))) {
    throw ownershipError("runtime_operability_owner_missing");
  }
  if (applicableOwnerIds.some((id) => !expectedOwnerIds.includes(id))) {
    throw ownershipError("runtime_operability_owner_unknown");
  }

  const responsibilityContracts = new Map(
    RUNTIME_OPERABILITY_RESPONSIBILITY_CONTRACTS.map((contract) => [
      contract.id,
      contract,
    ]),
  );
  const ownershipCounts = new Map(
    RUNTIME_OPERABILITY_RESPONSIBILITY_CONTRACTS.map((contract) => [
      contract.id,
      0,
    ]),
  );
  for (const owner of applicableOwners) {
    for (const responsibilityId of owner.responsibilities) {
      const contract = responsibilityContracts.get(responsibilityId);
      if (!contract) {
        throw ownershipError("runtime_operability_responsibility_unknown");
      }
      if (!contract.platforms.includes(platform)) {
        throw ownershipError(
          "runtime_operability_responsibility_inapplicable",
          responsibilityId,
        );
      }
      ownershipCounts.set(
        responsibilityId,
        ownershipCounts.get(responsibilityId) + 1,
      );
    }
  }

  const applicableResponsibilityIds = [];
  const nonApplicableResponsibilityIds = [];
  for (const contract of RUNTIME_OPERABILITY_RESPONSIBILITY_CONTRACTS) {
    const applicable = contract.platforms.includes(platform);
    const count = ownershipCounts.get(contract.id);
    if (!applicable) {
      nonApplicableResponsibilityIds.push(contract.id);
      if (count !== 0) {
        throw ownershipError(
          "runtime_operability_responsibility_inapplicable",
          contract.id,
        );
      }
      continue;
    }

    applicableResponsibilityIds.push(contract.id);
    const repeated = REPEATED_RESPONSIBILITIES.includes(contract.id);
    if (count === 0) {
      throw ownershipError(
        "runtime_operability_responsibility_missing",
        contract.id,
      );
    }
    if (repeated && count !== applicableOwners.length) {
      throw ownershipError(
        "runtime_operability_repeated_invariant_incomplete",
        contract.id,
      );
    }
    if (!repeated && count !== 1) {
      throw ownershipError(
        "runtime_operability_responsibility_duplicate",
        contract.id,
      );
    }
  }

  return Object.freeze({
    platform,
    applicableOwners: Object.freeze([...applicableOwners]),
    applicableResponsibilityIds: Object.freeze(applicableResponsibilityIds),
    nonApplicableResponsibilityIds: Object.freeze(
      nonApplicableResponsibilityIds,
    ),
    responsibilityOwnershipCounts: Object.freeze(
      Object.fromEntries(ownershipCounts),
    ),
  });
}

export function runtimeOperabilityOwnerForSelector(
  selector,
  platform = process.platform,
) {
  assertCanonicalPlatform(platform);
  const owner = RUNTIME_OPERABILITY_OWNERS.find(
    (candidate) => candidate.selector === selector,
  );
  if (!owner) throw ownershipError("runtime_operability_owner_unknown");
  if (!owner.platforms.includes(platform)) {
    throw ownershipError("runtime_operability_owner_inapplicable");
  }
  return owner;
}

export function buildRuntimeOperabilityCanonicalSteps(
  rootNode,
  platform = process.platform,
) {
  const ownership = validateRuntimeOperabilityOwnership(
    RUNTIME_OPERABILITY_OWNERS,
    platform,
  );
  return ownership.applicableOwners.map((owner) => ({
    id: owner.id,
    shard: owner.shard,
    requirements: owner.requirements,
    label: owner.label,
    ...rootNode("scripts/test-runtime-operability.mjs", owner.selector),
    timeoutMs: owner.timeoutMs,
    requireNaturalExit: owner.requireNaturalExit,
  }));
}

function responsibility(id, platforms) {
  return Object.freeze({ id, platforms });
}

function assertCanonicalPlatform(platform) {
  if (!RUNTIME_OPERABILITY_CANONICAL_PLATFORMS.includes(platform)) {
    throw ownershipError("runtime_operability_platform_unsupported");
  }
}

function validateOwnerDeclaration(owner) {
  if (
    !Array.isArray(owner.platforms) ||
    owner.platforms.length === 0 ||
    owner.platforms.some(
      (platform) =>
        !RUNTIME_OPERABILITY_CANONICAL_PLATFORMS.includes(platform),
    )
  ) {
    throw ownershipError("runtime_operability_owner_platform_invalid");
  }
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
  if (
    !Array.isArray(owner.responsibilities) ||
    owner.responsibilities.length === 0
  ) {
    throw ownershipError("runtime_operability_responsibilities_missing");
  }
}

function ownershipError(code, responsibilityId = null) {
  const error = new Error(
    responsibilityId ? `${code}: ${responsibilityId}` : code,
  );
  error.code = code;
  return error;
}

validateRuntimeOperabilityOwnership(
  RUNTIME_OPERABILITY_OWNERS,
  process.platform,
);
