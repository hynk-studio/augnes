import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync } from "node:fs";
import { release as operatingSystemRelease } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const RUNTIME_OPERABILITY_MAX_CHILD_TIMEOUT_MS = 120_000;

export const RUNTIME_OPERABILITY_CANONICAL_PLATFORMS = Object.freeze([
  "darwin",
  "linux",
  "win32",
]);

const ALL_PLATFORMS = RUNTIME_OPERABILITY_CANONICAL_PLATFORMS;
const ALL_CANONICAL_CONTEXTS = "all_canonical";
const MANAGED_EXECUTION_SUPPORTED_CONTEXTS = "managed_execution_supported";
const UNSUPPORTED_WINDOWS_CONTEXTS = "unsupported_windows";
const RUNTIME_OPERABILITY_APPLICABILITY_KINDS = Object.freeze([
  ALL_CANONICAL_CONTEXTS,
  MANAGED_EXECUTION_SUPPORTED_CONTEXTS,
  UNSUPPORTED_WINDOWS_CONTEXTS,
]);
const WINDOWS_MANAGED_EXECUTION_MINIMUM_BUILD = 22_000;
const WINDOWS_HELPER_CONTRACT = "augnes.windows_physical_root_helper.v0.1";
const WINDOWS_HELPER_MANIFEST_CONTRACT =
  "augnes.windows_physical_root_helper_manifest.v0.1";
const WINDOWS_IDENTITY_VERSION = "physical_root_identity.windows.v0.1";
const WINDOWS_HELPER_RELATIVE_PATH =
  "native/windows-x64/augnes-windows-physical-root-v0.1.exe";
const WINDOWS_HELPER_MANIFEST_RELATIVE_PATH =
  "native/windows-x64/augnes-windows-physical-root-v0.1.json";
const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

export const RUNTIME_OPERABILITY_RESPONSIBILITY_CONTRACTS = Object.freeze([
  responsibility(
    "runtime-distribution-update-recovery-environment-and-path-contracts",
    ALL_CANONICAL_CONTEXTS,
  ),
  responsibility(
    "source-supervisor-ready-status-duplicate-collision-and-stop",
    ALL_CANONICAL_CONTEXTS,
  ),
  responsibility("source-ui-core-and-bridge-readiness", ALL_CANONICAL_CONTEXTS),
  responsibility(
    "official-mcp-client-stdio-and-private-companion-boundary",
    ALL_CANONICAL_CONTEXTS,
  ),
  responsibility(
    "companion-discovery-identity-and-public-privacy",
    ALL_CANONICAL_CONTEXTS,
  ),
  responsibility(
    "repository-onboarding-registration-and-physical-root-identity",
    ALL_CANONICAL_CONTEXTS,
  ),
  responsibility(
    "initial-work-definition-and-pre-execution-revision",
    ALL_CANONICAL_CONTEXTS,
  ),
  responsibility(
    "repository-continuity-browser-selection-and-attachment-binding",
    ALL_CANONICAL_CONTEXTS,
  ),
  responsibility(
    "managed-start-exact-replay-result-receipt-and-proposal",
    MANAGED_EXECUTION_SUPPORTED_CONTEXTS,
  ),
  responsibility(
    "unsupported-windows-managed-start-and-resume-zero-effect-refusal",
    UNSUPPORTED_WINDOWS_CONTEXTS,
  ),
  responsibility("same-path-physical-replacement-refusal", ALL_CANONICAL_CONTEXTS),
  responsibility("poisoned-environment-restart", ALL_CANONICAL_CONTEXTS),
  responsibility("parent-signal-cleanup", ALL_CANONICAL_CONTEXTS),
  responsibility("required-child-failure", ALL_CANONICAL_CONTEXTS),
  responsibility("unverified-ownership-refusal", ALL_CANONICAL_CONTEXTS),
  responsibility(
    "resume-eligibility-after-required-child-crash-and-restart",
    MANAGED_EXECUTION_SUPPORTED_CONTEXTS,
  ),
  responsibility(
    "resume-read-selection-independence-and-worktree-drift",
    MANAGED_EXECUTION_SUPPORTED_CONTEXTS,
  ),
  responsibility(
    "browser-confirmed-same-run-resume-and-pre-marker-reacquisition",
    MANAGED_EXECUTION_SUPPORTED_CONTEXTS,
  ),
  responsibility(
    "resume-exact-replay-generation-checkpoint-and-terminal-result",
    MANAGED_EXECUTION_SUPPORTED_CONTEXTS,
  ),
  responsibility("ambiguous-operation-reconciliation", MANAGED_EXECUTION_SUPPORTED_CONTEXTS),
  responsibility("pending-approval-preservation", MANAGED_EXECUTION_SUPPORTED_CONTEXTS),
  responsibility("real-source-runtime-ui-core-and-bridge", ALL_CANONICAL_CONTEXTS),
  responsibility(
    "official-mcp-client-over-stdio-companion-proxy-and-strict-ui-core-path",
    ALL_CANONICAL_CONTEXTS,
  ),
  responsibility(
    "browser-confirmed-repository-decision-boundary",
    ALL_CANONICAL_CONTEXTS,
  ),
  responsibility(
    "isolated-writable-database-runtime-repository-session-and-process-state",
    ALL_CANONICAL_CONTEXTS,
  ),
  responsibility(
    "zero-provider-network-and-ambient-repository-effects",
    ALL_CANONICAL_CONTEXTS,
  ),
  responsibility(
    "natural-exit-observed-exit-closed-streams-complete-cleanup-and-zero-residue",
    ALL_CANONICAL_CONTEXTS,
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
    applicability: ALL_CANONICAL_CONTEXTS,
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
      "unsupported-windows-managed-start-and-resume-zero-effect-refusal",
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
    platforms: ALL_PLATFORMS,
    applicability: MANAGED_EXECUTION_SUPPORTED_CONTEXTS,
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
  context = readCurrentRuntimeOperabilityContext(),
) {
  const normalizedContext = createRuntimeOperabilityContext(context);
  const { platform } = normalizedContext;
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

  const responsibilityContracts = new Map(
    RUNTIME_OPERABILITY_RESPONSIBILITY_CONTRACTS.map((contract) => [
      contract.id,
      contract,
    ]),
  );
  for (const owner of owners) {
    validateOwnerDeclaration(owner, responsibilityContracts);
  }

  const applicableOwners = owners
    .filter((owner) =>
      applicabilityMatches(owner.applicability, normalizedContext),
    )
    .map((owner) =>
      resolveOwnerForContext(
        owner,
        normalizedContext,
        responsibilityContracts,
      ),
    );
  const expectedOwnerIds = RUNTIME_OPERABILITY_OWNERS.filter((owner) =>
    applicabilityMatches(owner.applicability, normalizedContext),
  ).map((owner) => owner.id);
  const applicableOwnerIds = applicableOwners.map((owner) => owner.id);
  if (expectedOwnerIds.some((id) => !applicableOwnerIds.includes(id))) {
    throw ownershipError("runtime_operability_owner_missing");
  }
  if (applicableOwnerIds.some((id) => !expectedOwnerIds.includes(id))) {
    throw ownershipError("runtime_operability_owner_unknown");
  }

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
      ownershipCounts.set(
        responsibilityId,
        ownershipCounts.get(responsibilityId) + 1,
      );
    }
  }

  const applicableResponsibilityIds = [];
  const nonApplicableResponsibilityIds = [];
  for (const contract of RUNTIME_OPERABILITY_RESPONSIBILITY_CONTRACTS) {
    const applicable = applicabilityMatches(
      contract.applicability,
      normalizedContext,
    );
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
    context: normalizedContext,
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
  context = readCurrentRuntimeOperabilityContext(),
) {
  const declared = RUNTIME_OPERABILITY_OWNERS.find(
    (candidate) => candidate.selector === selector,
  );
  if (!declared) throw ownershipError("runtime_operability_owner_unknown");
  const ownership = validateRuntimeOperabilityOwnership(
    RUNTIME_OPERABILITY_OWNERS,
    context,
  );
  const owner = ownership.applicableOwners.find(
    (candidate) => candidate.selector === selector,
  );
  if (!owner) throw ownershipError("runtime_operability_owner_inapplicable");
  return owner;
}

export function buildRuntimeOperabilityCanonicalSteps(
  rootNode,
  context = readCurrentRuntimeOperabilityContext(),
) {
  const ownership = validateRuntimeOperabilityOwnership(
    RUNTIME_OPERABILITY_OWNERS,
    context,
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

export function readCurrentRuntimeOperabilityContext() {
  const platform = process.platform;
  const architecture = process.arch;
  const distributionMode = detectDistributionMode();
  const windowsVersion = platform === "win32" ? operatingSystemRelease() : null;
  const windowsPhysicalIdentity =
    platform === "win32"
      ? observeCurrentWindowsPhysicalIdentity()
      : Object.freeze({ status: "not_applicable", reason: null });
  return createRuntimeOperabilityContext({
    platform,
    architecture,
    distribution_mode: distributionMode,
    windows_version: windowsVersion,
    windows_physical_identity: windowsPhysicalIdentity,
  });
}

export function createRuntimeOperabilityContext(input = {}) {
  const source = typeof input === "string" ? { platform: input } : input;
  const platform = source.platform ?? process.platform;
  assertCanonicalPlatform(platform);
  const architecture = source.architecture ?? (platform === process.platform
    ? process.arch
    : platform === "win32"
      ? "x64"
      : "x64");
  const distributionMode = source.distribution_mode ?? "source";
  const windowsVersion = source.windows_version ??
    (platform === "win32" ? "10.0.22000" : null);
  const windowsPhysicalIdentity = normalizeWindowsPhysicalIdentity(
    platform,
    source.windows_physical_identity,
  );
  const windowsManagedExecution = classifyWindowsManagedExecution({
    platform,
    architecture,
    distribution_mode: distributionMode,
    windows_version: windowsVersion,
    windows_physical_identity: windowsPhysicalIdentity,
  });
  return Object.freeze({
    platform,
    architecture,
    distribution_mode: distributionMode,
    windows_version: windowsVersion,
    windows_physical_identity: windowsPhysicalIdentity,
    windows_managed_execution: windowsManagedExecution,
  });
}

function detectDistributionMode() {
  return process.env.AUGNES_DISTRIBUTION_MODE === "packaged"
    ? "packaged"
    : "source";
}

function observeCurrentWindowsPhysicalIdentity() {
  const unavailable = (reason) => Object.freeze({ status: "unavailable", reason });
  const helperPath = path.join(repositoryRoot, WINDOWS_HELPER_RELATIVE_PATH);
  const manifestPath = path.join(
    repositoryRoot,
    WINDOWS_HELPER_MANIFEST_RELATIVE_PATH,
  );
  try {
    if (!existsSync(helperPath) || !existsSync(manifestPath)) {
      return unavailable("windows_physical_identity_helper_unavailable");
    }
    const helperStats = lstatSync(helperPath);
    const manifestStats = lstatSync(manifestPath);
    if (
      !helperStats.isFile() ||
      helperStats.isSymbolicLink() ||
      !manifestStats.isFile() ||
      manifestStats.isSymbolicLink()
    ) {
      return unavailable("windows_physical_identity_helper_invalid");
    }
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const helperSha256 = createHash("sha256")
      .update(readFileSync(helperPath))
      .digest("hex");
    if (
      manifest.contract !== WINDOWS_HELPER_MANIFEST_CONTRACT ||
      manifest.helper_contract !== WINDOWS_HELPER_CONTRACT ||
      manifest.helper_file !== WINDOWS_HELPER_RELATIVE_PATH ||
      manifest.helper_sha256 !== helperSha256 ||
      manifest.identity_version !== WINDOWS_IDENTITY_VERSION ||
      manifest.platform !== "win32" ||
      manifest.architecture !== "x64"
    ) {
      return unavailable("windows_physical_identity_manifest_invalid");
    }
    const environment = {};
    for (const key of ["SystemRoot", "WINDIR"]) {
      if (typeof process.env[key] === "string") environment[key] = process.env[key];
    }
    environment.NODE_ENV = "test";
    const stdout = execFileSync(
      helperPath,
      ["--contract", WINDOWS_HELPER_CONTRACT, "--path", repositoryRoot],
      {
        cwd: repositoryRoot,
        encoding: "utf8",
        env: environment,
        maxBuffer: 64 * 1024,
        timeout: 10_000,
        windowsHide: true,
      },
    );
    const identity = JSON.parse(stdout);
    if (
      identity.contract !== WINDOWS_HELPER_CONTRACT ||
      identity.identity_version !== WINDOWS_IDENTITY_VERSION ||
      identity.status !== "exact" ||
      identity.platform !== "win32" ||
      identity.architecture !== "x64" ||
      identity.filesystem_family !== "NTFS" ||
      identity.drive_type !== "fixed"
    ) {
      return unavailable("windows_physical_identity_root_unsupported");
    }
    return Object.freeze({ status: "exact_fixed_ntfs", reason: null });
  } catch {
    return unavailable("windows_physical_identity_observation_failed");
  }
}

function normalizeWindowsPhysicalIdentity(platform, value) {
  if (platform !== "win32") {
    return Object.freeze({ status: "not_applicable", reason: null });
  }
  if (value?.status === "exact_fixed_ntfs") {
    return Object.freeze({ status: "exact_fixed_ntfs", reason: null });
  }
  return Object.freeze({
    status: "unavailable",
    reason: value?.reason ?? "windows_physical_identity_unavailable",
  });
}

function classifyWindowsManagedExecution(context) {
  if (context.platform !== "win32") {
    return Object.freeze({ status: "available", reason: null });
  }
  if (context.architecture !== "x64") {
    return Object.freeze({
      status: "unavailable",
      reason: "repository_managed_delegation_windows_architecture_unsupported",
    });
  }
  if (context.distribution_mode !== "source") {
    return Object.freeze({
      status: "unavailable",
      reason: "repository_managed_delegation_windows_source_runtime_required",
    });
  }
  const versionMatch = /^(\d+)\.(\d+)\.(\d+)(?:\D.*)?$/u.exec(
    context.windows_version ?? "",
  );
  const build = versionMatch ? Number(versionMatch[3]) : Number.NaN;
  if (
    !versionMatch ||
    versionMatch[1] !== "10" ||
    versionMatch[2] !== "0" ||
    !Number.isSafeInteger(build) ||
    build < WINDOWS_MANAGED_EXECUTION_MINIMUM_BUILD
  ) {
    return Object.freeze({
      status: "unavailable",
      reason: "repository_managed_delegation_windows_version_unsupported",
    });
  }
  if (context.windows_physical_identity.status !== "exact_fixed_ntfs") {
    return Object.freeze({
      status: "unavailable",
      reason: context.windows_physical_identity.reason,
    });
  }
  return Object.freeze({ status: "available", reason: null });
}

function applicabilityMatches(applicability, context) {
  if (applicability === ALL_CANONICAL_CONTEXTS) return true;
  if (applicability === MANAGED_EXECUTION_SUPPORTED_CONTEXTS) {
    return context.windows_managed_execution.status === "available";
  }
  if (applicability === UNSUPPORTED_WINDOWS_CONTEXTS) {
    return context.platform === "win32" &&
      context.windows_managed_execution.status === "unavailable";
  }
  throw ownershipError("runtime_operability_applicability_invalid");
}

function resolveOwnerForContext(owner, context, responsibilityContracts) {
  return Object.freeze({
    ...owner,
    responsibilities: Object.freeze(
      owner.responsibilities.filter((responsibilityId) =>
        applicabilityMatches(
          responsibilityContracts.get(responsibilityId).applicability,
          context,
        ),
      ),
    ),
    applicability_context: context,
  });
}

function responsibility(id, applicability) {
  return Object.freeze({ id, applicability });
}

function assertCanonicalPlatform(platform) {
  if (!RUNTIME_OPERABILITY_CANONICAL_PLATFORMS.includes(platform)) {
    throw ownershipError("runtime_operability_platform_unsupported");
  }
}

function validateOwnerDeclaration(owner, responsibilityContracts) {
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
  if (!RUNTIME_OPERABILITY_APPLICABILITY_KINDS.includes(owner.applicability)) {
    throw ownershipError("runtime_operability_applicability_invalid");
  }
  if (new Set(owner.responsibilities).size !== owner.responsibilities.length) {
    throw ownershipError("runtime_operability_responsibility_duplicate");
  }
  for (const responsibilityId of owner.responsibilities) {
    const contract = responsibilityContracts.get(responsibilityId);
    if (!contract) {
      throw ownershipError("runtime_operability_responsibility_unknown");
    }
    if (
      owner.applicability !== ALL_CANONICAL_CONTEXTS &&
      contract.applicability !== ALL_CANONICAL_CONTEXTS &&
      contract.applicability !== owner.applicability
    ) {
      throw ownershipError(
        "runtime_operability_responsibility_inapplicable",
        responsibilityId,
      );
    }
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
  readCurrentRuntimeOperabilityContext(),
);
