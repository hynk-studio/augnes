import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  accessSync,
  chmodSync,
  closeSync,
  constants as fsConstants,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import net from "node:net";
import path from "node:path";

import {
  canonicalizeExistingPathV01,
  canonicalizeProspectivePathV01,
  classifyPathScopeV01,
  doCanonicalPathsOverlapV01,
  getLexicalPathEntryKindV01,
  isPathWithinCanonicalRootV01,
  validateAbsolutePathInputV01,
} from "./m3d-evidence-runner-path-policy-v0-1.mjs";

export const M3D_EVIDENCE_RUNNER_QUALIFICATION_VERSION_V01 =
  "vnext_m3d_evidence_runner_qualification.v0.1";

const SUPPORTED_PLATFORMS = new Set(["darwin", "linux"]);
const MINIMUM_NODE_MAJOR = 22;
const PROBE_TIMEOUT_MS = 5_000;
const MAX_PROBE_OUTPUT_BYTES = 8 * 1024;
const CHROME_EXECUTABLE_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];

export async function qualifyM3dEvidenceRunnerV01(input) {
  const mode = input.mode;
  const platform = input.platform ?? process.platform;
  const architecture = input.architecture ?? process.arch;
  const nodeVersion = input.nodeVersion ?? process.version;
  const checks = [];
  let applicationCommit = null;
  let rootLockHash = null;
  let nestedLockHash = null;
  let dependenciesComplete = false;
  let pathPolicyQualified = false;
  let loopbackQualified = false;
  let browserQualified = mode === "portable" ? null : false;
  let browserIdentity = null;
  let canonicalRoots = {
    repository: "unavailable",
    runtime: "unavailable",
    evidence: "unavailable",
  };

  addCheck(
    checks,
    "qualification_mode",
    mode === "portable" || mode === "local_full",
    "malformed_invocation",
    mode === "portable" || mode === "local_full"
      ? `Qualification mode ${mode} is supported.`
      : "Qualification mode is unsupported.",
  );

  const platformSupported = SUPPORTED_PLATFORMS.has(platform);
  addCheck(
    checks,
    "supported_platform",
    platformSupported,
    "unsupported_platform",
    platformSupported
      ? `Platform ${platform} is supported by v0.1.`
      : "Platform is unsupported by v0.1.",
  );

  const nodeMajor = parseNodeMajor(nodeVersion);
  const nodeSupported =
    Number.isInteger(nodeMajor) && nodeMajor >= MINIMUM_NODE_MAJOR;
  addCheck(
    checks,
    "node_version",
    nodeSupported,
    "node_version_unsupported",
    nodeSupported
      ? `Node major ${nodeMajor} satisfies the v0.1 minimum.`
      : `Node ${MINIMUM_NODE_MAJOR} or newer is required.`,
  );

  try {
    const pathResult = runPathQualification(input, checks);
    pathPolicyQualified = pathResult.qualified;
    canonicalRoots = pathResult.publicRoots;
  } catch (error) {
    addCheck(
      checks,
      "canonical_path_policy",
      false,
      publicReasonCode(error, "path_input_invalid"),
      "Canonical path qualification failed.",
    );
  }

  try {
    const dependencyResult = runDependencyQualification(input.repoRoot, checks);
    applicationCommit = dependencyResult.applicationCommit;
    rootLockHash = dependencyResult.rootLockHash;
    nestedLockHash = dependencyResult.nestedLockHash;
    dependenciesComplete = dependencyResult.qualified;
  } catch (error) {
    addCheck(
      checks,
      "dependency_boundaries",
      false,
      publicReasonCode(error, "repository_root_invalid"),
      "Dependency qualification failed.",
    );
  }

  if (platformSupported) {
    try {
      await qualifyLoopbackV01();
      loopbackQualified = true;
      addCheck(
        checks,
        "loopback_allocation_release",
        true,
        null,
        "A temporary 127.0.0.1 listener was allocated, closed, and refused reuse.",
      );
    } catch {
      addCheck(
        checks,
        "loopback_allocation_release",
        false,
        "loopback_bind_failed",
        "The loopback allocation and release probe failed.",
      );
    }
  } else {
    addNotApplicable(
      checks,
      "loopback_allocation_release",
      "Loopback qualification is not run on an unsupported platform.",
    );
  }

  if (mode === "local_full" && platformSupported) {
    try {
      const browserResult = qualifyBrowserExecutableV01({
        explicitPath: input.browserExecutable,
        environment: input.environment ?? process.env,
      });
      browserQualified = true;
      browserIdentity = browserResult.identity;
      addCheck(
        checks,
        "browser_version_probe",
        true,
        null,
        "The selected browser executable completed a bounded --version probe.",
      );
    } catch (error) {
      browserQualified = false;
      addCheck(
        checks,
        "browser_version_probe",
        false,
        publicReasonCode(error, "browser_version_probe_failed"),
        "Browser executable qualification failed.",
      );
    }
  } else if (mode === "portable") {
    addNotApplicable(
      checks,
      "browser_version_probe",
      "Portable mode does not require a browser executable.",
    );
  } else {
    addNotApplicable(
      checks,
      "browser_version_probe",
      "Browser qualification is not run on an unsupported platform.",
    );
  }

  const qualified = checks.every(
    (check) => check.status === "pass" || check.status === "not_applicable",
  );
  const reasonCodes = [
    ...new Set(
      checks
        .filter((check) => check.status === "fail")
        .map((check) => check.reason_code),
    ),
  ];

  return {
    qualification_version: M3D_EVIDENCE_RUNNER_QUALIFICATION_VERSION_V01,
    status: qualified ? "qualified" : "unqualified",
    mode,
    application_commit: applicationCommit,
    platform,
    architecture,
    node_version: nodeVersion,
    node_major_version: nodeMajor,
    root_package_lock_sha256: rootLockHash,
    nested_package_lock_sha256: nestedLockHash,
    checks,
    reason_codes: reasonCodes,
    canonical_roots: canonicalRoots,
    dependencies_complete: dependenciesComplete,
    path_policy_qualified: pathPolicyQualified,
    loopback_qualified: loopbackQualified,
    browser_qualified: browserQualified,
    browser_identity: browserIdentity,
    semantic_execution_started: false,
    database_opened: false,
    default_database_inspected: false,
    credential_material_included: false,
  };
}

export function qualifyBrowserExecutableV01({
  explicitPath,
  environment = process.env,
}) {
  const candidates = listChromeExecutableCandidatesV01({
    explicitPath,
    environment,
  });
  const executablePath = candidates.find((candidate) => {
    try {
      validateAbsolutePathInputV01(candidate);
      return existsSync(candidate);
    } catch {
      return false;
    }
  });
  if (!executablePath) {
    throw qualificationError(
      "browser_executable_missing",
      "No browser executable candidate exists.",
    );
  }

  let canonicalExecutable;
  try {
    canonicalExecutable = realpathSync.native(executablePath);
    if (!statSync(canonicalExecutable).isFile()) throw new Error("not_file");
    accessSync(canonicalExecutable, fsConstants.X_OK);
  } catch {
    throw qualificationError(
      "browser_executable_missing",
      "The selected browser executable is not an executable regular file.",
    );
  }

  const probe = spawnSync(canonicalExecutable, ["--version"], {
    encoding: "utf8",
    timeout: PROBE_TIMEOUT_MS,
    maxBuffer: MAX_PROBE_OUTPUT_BYTES,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (probe.error || probe.status !== 0 || probe.signal) {
    throw qualificationError(
      "browser_version_probe_failed",
      "The selected browser executable did not complete its version probe.",
    );
  }
  const versionSummary = `${probe.stdout ?? ""} ${probe.stderr ?? ""}`
    .trim()
    .replace(/\s+/gu, " ")
    .slice(0, 256);
  if (!versionSummary) {
    throw qualificationError(
      "browser_version_probe_failed",
      "The browser version probe returned no bounded version summary.",
    );
  }
  return {
    identity: {
      executable_name: path.basename(canonicalExecutable),
      executable_sha256: hashFile(canonicalExecutable),
      version_summary: versionSummary,
    },
  };
}

export function listChromeExecutableCandidatesV01({
  explicitPath,
  environment = process.env,
} = {}) {
  const override = explicitPath || environment.AUGNES_BROWSER_EXECUTABLE_PATH;
  return [override, ...CHROME_EXECUTABLE_CANDIDATES].filter(Boolean);
}

export function writeQualificationReceiptV01({
  receipt,
  serializedReceipt,
  outputPath,
  repoRoot,
  runtimeRoot,
  evidenceRoot,
  workingDbPath,
  canonicalCheckoutRoot,
}) {
  const lexicalOutputPath = validateAbsolutePathInputV01(outputPath);
  const canonicalRepository = canonicalizeExistingPathV01(repoRoot);
  const canonicalCheckout = canonicalizeExistingPathV01(canonicalCheckoutRoot);
  const canonicalRuntime = canonicalizeProspectivePathV01(runtimeRoot);
  const canonicalEvidence = canonicalizeProspectivePathV01(evidenceRoot);
  const canonicalOutputPath = canonicalizeProspectiveLeafWithoutInspectionV01(
    lexicalOutputPath,
  );
  const canonicalOutputParent = path.dirname(canonicalOutputPath);
  const canonicalWorkingDatabase =
    canonicalizeProspectiveLeafWithoutInspectionV01(workingDbPath);

  if (
    doCanonicalPathsOverlapV01(
      canonicalWorkingDatabase,
      canonicalOutputPath,
    )
  ) {
    throw qualificationError(
      "qualification_output_conflicts_with_working_db",
      "Qualification output conflicts with the working database path.",
    );
  }
  if (doCanonicalPathsOverlapV01(canonicalRepository, canonicalOutputPath)) {
    throw qualificationError(
      "qualification_output_inside_execution_repository",
      "Qualification output must remain outside the execution repository.",
    );
  }

  if (
    !isPathStrictlyWithinCanonicalRootV01(
      canonicalEvidence,
      canonicalOutputPath,
    )
  ) {
    throw qualificationError(
      "qualification_output_outside_evidence",
      "Qualification output must be strictly inside the evidence root.",
    );
  }
  if (doCanonicalPathsOverlapV01(canonicalRuntime, canonicalOutputPath)) {
    throw qualificationError(
      "qualification_output_outside_evidence",
      "Qualification output must remain outside runtime.",
    );
  }
  if (doCanonicalPathsOverlapV01(canonicalCheckout, canonicalOutputPath)) {
    throw qualificationError(
      "qualification_output_outside_evidence",
      "Qualification output must remain outside the canonical checkout.",
    );
  }
  const outputEntryKind = getLexicalPathEntryKindV01(lexicalOutputPath);
  if (outputEntryKind === "symlink") {
    throw qualificationError(
      "qualification_output_symlink",
      "Qualification output must not be a symlink.",
    );
  }
  if (outputEntryKind !== "missing") {
    throw qualificationError(
      "qualification_output_exists",
      "Qualification output must not already exist.",
    );
  }

  let descriptor = null;
  let created = false;
  try {
    mkdirSync(canonicalEvidence, { recursive: true, mode: 0o700 });
    mkdirSync(canonicalOutputParent, { recursive: true, mode: 0o700 });
    const actualEvidence = canonicalizeExistingPathV01(canonicalEvidence);
    const actualOutputParent = canonicalizeExistingPathV01(
      canonicalOutputParent,
    );
    if (
      actualEvidence !== canonicalEvidence ||
      !isPathWithinCanonicalRootV01(actualEvidence, actualOutputParent)
    ) {
      throw qualificationError(
        "symlink_escape",
        "Qualification output parent changed canonical identity.",
      );
    }
    descriptor = openSync(
      canonicalOutputPath,
      fsConstants.O_WRONLY |
        fsConstants.O_CREAT |
        fsConstants.O_EXCL |
        (fsConstants.O_NOFOLLOW ?? 0),
      0o600,
    );
    created = true;
    writeFileSync(descriptor, serializedReceipt, { encoding: "utf8" });
    closeSync(descriptor);
    descriptor = null;
    chmodSync(canonicalOutputPath, 0o600);
    const actualOutput = canonicalizeExistingPathV01(canonicalOutputPath);
    if (
      actualOutput !== canonicalOutputPath ||
      !isPathStrictlyWithinCanonicalRootV01(actualEvidence, actualOutput) ||
      !statSync(actualOutput).isFile()
    ) {
      throw qualificationError(
        "symlink_escape",
        "Created qualification output failed canonical requalification.",
      );
    }
    return {
      receipt,
      canonical_output_path: actualOutput,
    };
  } catch (error) {
    if (descriptor !== null) closeSync(descriptor);
    if (created) {
      try {
        unlinkSync(canonicalOutputPath);
      } catch {
        // Preserve the original bounded failure after best-effort cleanup.
      }
    }
    if (error?.code === "EEXIST") {
      throw qualificationError(
        "qualification_output_exists",
        "Qualification output appeared before exclusive creation.",
      );
    }
    throw error;
  }
}

export async function qualifyLoopbackV01() {
  const server = net.createServer((socket) => socket.destroy());
  let port = null;
  try {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen({ host: "127.0.0.1", port: 0, exclusive: true }, resolve);
    });
    const address = server.address();
    if (
      !address ||
      typeof address === "string" ||
      address.address !== "127.0.0.1" ||
      address.family !== "IPv4"
    ) {
      throw new Error("unexpected_loopback_address");
    }
    port = address.port;
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    const refused = await connectionIsRefused(port);
    if (!refused) throw new Error("closed_listener_accepted_connection");
    return { qualified: true };
  } finally {
    if (server.listening) {
      await new Promise((resolve) => server.close(() => resolve()));
    }
  }
}

export function isLoopbackReleaseRefusalV01(error) {
  return error?.code === "ECONNREFUSED";
}

function runPathQualification(input, checks) {
  let repositoryRoot;
  let canonicalCheckoutRoot;
  let runtimeRoot;
  let evidenceRoot;
  let structuralWorkingDatabase;
  try {
    repositoryRoot = canonicalizeExistingPathV01(input.repoRoot);
    canonicalCheckoutRoot = canonicalizeExistingPathV01(
      input.canonicalCheckoutRoot,
    );
    runtimeRoot = canonicalizeProspectivePathV01(input.runtimeRoot);
    evidenceRoot = canonicalizeProspectivePathV01(input.evidenceRoot);
    structuralWorkingDatabase =
      canonicalizeProspectiveLeafWithoutInspectionV01(input.workingDbPath);
  } catch (error) {
    throw qualificationError(
      publicReasonCode(error, "path_input_invalid"),
      "A supplied root could not be canonicalized.",
    );
  }

  const repositoryValid =
    existsSync(path.join(repositoryRoot, "package.json")) &&
    existsSync(path.join(repositoryRoot, ".git"));
  addCheck(
    checks,
    "repository_root",
    repositoryValid,
    "repository_root_invalid",
    repositoryValid
      ? "Repository root is canonical and contains the expected repository markers."
      : "Repository root is missing expected repository markers.",
  );

  const executionRepositoryIsolated = !doCanonicalPathsOverlapV01(
    repositoryRoot,
    canonicalCheckoutRoot,
  );
  addCheck(
    checks,
    "execution_repository_checkout_isolation",
    executionRepositoryIsolated,
    "execution_repository_checkout_overlap",
    executionRepositoryIsolated
      ? "Execution repository and canonical checkout are structurally separate."
      : "Execution repository overlaps the canonical checkout.",
  );

  const executionRepositoryRuntimeIsolated = !doCanonicalPathsOverlapV01(
    repositoryRoot,
    runtimeRoot,
  );
  addCheck(
    checks,
    "execution_repository_runtime_isolation",
    executionRepositoryRuntimeIsolated,
    "execution_repository_runtime_overlap",
    executionRepositoryRuntimeIsolated
      ? "Runtime is structurally separate from the execution repository."
      : "Runtime overlaps the execution repository.",
  );

  const executionRepositoryEvidenceIsolated = !doCanonicalPathsOverlapV01(
    repositoryRoot,
    evidenceRoot,
  );
  addCheck(
    checks,
    "execution_repository_evidence_isolation",
    executionRepositoryEvidenceIsolated,
    "execution_repository_evidence_overlap",
    executionRepositoryEvidenceIsolated
      ? "Evidence storage is structurally separate from the execution repository."
      : "Evidence storage overlaps the execution repository.",
  );

  const checkoutIsolated =
    !doCanonicalPathsOverlapV01(canonicalCheckoutRoot, runtimeRoot) &&
    !doCanonicalPathsOverlapV01(canonicalCheckoutRoot, evidenceRoot);
  addCheck(
    checks,
    "canonical_checkout_isolation",
    checkoutIsolated,
    "canonical_checkout_overlap",
    checkoutIsolated
      ? "Runtime and evidence roots are structurally outside the canonical checkout."
      : "A runtime or evidence root overlaps the canonical checkout.",
  );

  const rootsIsolated = !doCanonicalPathsOverlapV01(runtimeRoot, evidenceRoot);
  addCheck(
    checks,
    "runtime_evidence_isolation",
    rootsIsolated,
    "path_scope_escape",
    rootsIsolated
      ? "Runtime and evidence roots are structurally separate."
      : "Runtime and evidence roots overlap.",
  );

  const rootDerivationQualified =
    path.dirname(runtimeRoot) === path.dirname(evidenceRoot);
  addCheck(
    checks,
    "canonical_run_root_derivation",
    rootDerivationQualified,
    "path_scope_escape",
    rootDerivationQualified
      ? "Runtime and evidence roots are derived from one canonical run root."
      : "Runtime and evidence roots are not siblings below one canonical run root.",
  );

  const workingDatabaseStructurallyValid =
    isPathStrictlyWithinCanonicalRootV01(
      runtimeRoot,
      structuralWorkingDatabase,
    ) &&
    !doCanonicalPathsOverlapV01(
      canonicalCheckoutRoot,
      structuralWorkingDatabase,
    );
  addCheck(
    checks,
    "working_database_scope",
    workingDatabaseStructurallyValid,
    "working_db_path_invalid",
    workingDatabaseStructurallyValid
      ? "The prospective working database is inside runtime and outside the canonical checkout."
      : "The prospective working database violates structural isolation.",
  );

  const executionRepositoryWorkingDatabaseIsolated =
    !doCanonicalPathsOverlapV01(repositoryRoot, structuralWorkingDatabase);
  addCheck(
    checks,
    "execution_repository_working_database_isolation",
    executionRepositoryWorkingDatabaseIsolated,
    "execution_repository_working_db_overlap",
    executionRepositoryWorkingDatabaseIsolated
      ? "The working database is structurally separate from the execution repository."
      : "The working database overlaps the execution repository.",
  );

  let workingDatabaseFresh = false;
  let workingDatabaseFreshReason = "working_db_path_invalid";
  if (structuralWorkingDatabase === runtimeRoot) {
    workingDatabaseFreshReason = "working_db_path_invalid_type";
  } else if (
    workingDatabaseStructurallyValid &&
    executionRepositoryWorkingDatabaseIsolated
  ) {
    const freshLeaf = classifyWorkingDatabaseFreshLeafV01(input.workingDbPath);
    workingDatabaseFresh = freshLeaf.qualified;
    workingDatabaseFreshReason = freshLeaf.reasonCode;
  }
  addCheck(
    checks,
    "working_database_fresh_leaf",
    workingDatabaseFresh,
    workingDatabaseFreshReason,
    workingDatabaseFresh
      ? "The working database is a missing prospective leaf."
      : "The working database must be a missing prospective leaf.",
  );

  let fixtureQualified = false;
  let fixtureRoot = null;
  try {
    if (
      !checkoutIsolated ||
      !executionRepositoryIsolated ||
      !executionRepositoryRuntimeIsolated ||
      !executionRepositoryEvidenceIsolated ||
      !rootsIsolated ||
      !rootDerivationQualified ||
      !workingDatabaseStructurallyValid ||
      !executionRepositoryWorkingDatabaseIsolated ||
      !workingDatabaseFresh
    ) {
      throw qualificationError(
        "path_scope_escape",
        "Unsafe roots must not be used for qualification fixtures.",
      );
    }
    mkdirSync(runtimeRoot, { recursive: true, mode: 0o700 });
    const actualRuntimeRoot = canonicalizeExistingPathV01(runtimeRoot);
    if (actualRuntimeRoot !== runtimeRoot) {
      throw qualificationError(
        "symlink_escape",
        "Runtime root identity changed after creation.",
      );
    }
    fixtureRoot = mkdtempSync(
      path.join(actualRuntimeRoot, ".m3d-qualification-path-policy-"),
    );
    const allowedRoot = path.join(fixtureRoot, "allowed");
    const outsideRoot = path.join(fixtureRoot, "outside");
    mkdirSync(allowedRoot, { mode: 0o700 });
    mkdirSync(outsideRoot, { mode: 0o700 });
    const prospectiveChild = path.join(allowedRoot, "future", "child");
    const prospectiveIdentity = canonicalizeProspectivePathV01(prospectiveChild);
    mkdirSync(prospectiveChild, { recursive: true, mode: 0o700 });
    const existingIdentity = canonicalizeExistingPathV01(prospectiveChild);
    if (prospectiveIdentity !== existingIdentity) {
      throw qualificationError(
        "symlink_escape",
        "Prospective path identity changed after creation.",
      );
    }
    symlinkSync(outsideRoot, path.join(allowedRoot, "escape"), "dir");
    const escapeResult = classifyPathScopeV01({
      rootPath: allowedRoot,
      candidatePath: path.join(allowedRoot, "escape", "candidate"),
      rootKind: "existing",
      candidateKind: "prospective",
    });
    if (
      escapeResult.status !== "fail" ||
      escapeResult.reason_code !== "symlink_escape"
    ) {
      throw qualificationError(
        "symlink_escape",
        "Symlink escape fixture was not rejected.",
      );
    }
    fixtureQualified = true;
  } finally {
    if (fixtureRoot) rmSync(fixtureRoot, { recursive: true, force: true });
  }
  addCheck(
    checks,
    "path_policy_fixture",
    fixtureQualified,
    "symlink_escape",
    fixtureQualified
      ? "Prospective identity and symlink escape fixtures passed and were removed."
      : "The bounded path-policy fixture failed.",
  );

  const qualified = [
    repositoryValid,
    executionRepositoryIsolated,
    executionRepositoryRuntimeIsolated,
    executionRepositoryEvidenceIsolated,
    checkoutIsolated,
    rootsIsolated,
    rootDerivationQualified,
    workingDatabaseStructurallyValid,
    executionRepositoryWorkingDatabaseIsolated,
    workingDatabaseFresh,
    fixtureQualified,
  ].every(Boolean);
  return {
    qualified,
    publicRoots: {
      repository: publicRootLabel(repositoryRoot),
      runtime: publicRootLabel(runtimeRoot),
      evidence: publicRootLabel(evidenceRoot),
    },
  };
}

function runDependencyQualification(repoRootInput, checks) {
  const repositoryRoot = canonicalizeExistingPathV01(repoRootInput);
  const nestedRoot = path.join(repositoryRoot, "apps", "augnes_apps");
  const rootPackage = path.join(repositoryRoot, "package.json");
  const rootLock = path.join(repositoryRoot, "package-lock.json");
  const rootModules = path.join(repositoryRoot, "node_modules");
  const nestedPackage = path.join(nestedRoot, "package.json");
  const nestedLock = path.join(nestedRoot, "package-lock.json");
  const nestedModules = path.join(nestedRoot, "node_modules");
  const rootTsx = path.join(rootModules, ".bin", "tsx");
  const rootTsc = path.join(rootModules, ".bin", "tsc");
  const rootNext = path.join(rootModules, ".bin", "next");
  const nestedTsx = path.join(nestedModules, ".bin", "tsx");
  const nestedTsc = path.join(nestedModules, ".bin", "tsc");

  const rootLockPresent = regularFileExists(rootLock);
  const nestedLockPresent = regularFileExists(nestedLock);
  const rootDependenciesPresent =
    regularFileExists(rootPackage) && directoryExistsWithoutSymlink(rootModules);
  const nestedDependenciesPresent =
    regularFileExists(nestedPackage) &&
    directoryExistsWithoutSymlink(nestedModules);
  addCheck(
    checks,
    "root_lockfile",
    rootLockPresent,
    "root_lock_missing",
    rootLockPresent ? "Root lockfile is present." : "Root lockfile is missing.",
  );
  addCheck(
    checks,
    "nested_lockfile",
    nestedLockPresent,
    "nested_lock_missing",
    nestedLockPresent
      ? "Nested app lockfile is present."
      : "Nested app lockfile is missing.",
  );
  addCheck(
    checks,
    "root_dependency_boundary",
    rootDependenciesPresent,
    "root_dependencies_missing",
    rootDependenciesPresent
      ? "Root dependency boundary is provisioned without a node_modules symlink."
      : "Root dependency boundary is incomplete or symlinked.",
  );
  addCheck(
    checks,
    "nested_dependency_boundary",
    nestedDependenciesPresent,
    "nested_dependencies_missing",
    nestedDependenciesPresent
      ? "Nested app dependency boundary is provisioned without a node_modules symlink."
      : "Nested app dependency boundary is incomplete or symlinked.",
  );

  const rootTsxProbe = probeDependencyExecutable(rootModules, rootTsx);
  const rootTscProbe = probeDependencyExecutable(rootModules, rootTsc);
  const rootNextProbe = probeDependencyExecutable(rootModules, rootNext);
  const rootNativeDependencyAvailable = probeRootNativeDependency(repositoryRoot);
  const nestedTsxProbe = probeDependencyExecutable(nestedModules, nestedTsx);
  const nestedTscProbe = probeDependencyExecutable(nestedModules, nestedTsc);
  addCheck(
    checks,
    "root_tsx",
    rootTsxProbe,
    "root_tsx_missing",
    rootTsxProbe
      ? "Root tsx is executable and completed a bounded version probe."
      : "Root tsx is missing, outside root node_modules, or failed its probe.",
  );
  addCheck(
    checks,
    "root_tsc",
    rootTscProbe,
    "root_tsc_missing",
    rootTscProbe
      ? "Root tsc is executable and completed a bounded version probe."
      : "Root tsc is missing, outside root node_modules, or failed its probe.",
  );
  addCheck(
    checks,
    "root_next",
    rootNextProbe,
    "root_next_missing",
    rootNextProbe
      ? "Root Next executable completed a bounded version probe."
      : "Root Next executable is missing or failed its probe.",
  );
  addCheck(
    checks,
    "root_native_dependency",
    rootNativeDependencyAvailable,
    "root_native_dependency_unavailable",
    rootNativeDependencyAvailable
      ? "The exact repo-local better-sqlite3 module is loadable."
      : "A repo-local better-sqlite3 module is unavailable.",
  );
  addCheck(
    checks,
    "nested_tsx",
    nestedTsxProbe,
    "nested_tsx_missing",
    nestedTsxProbe
      ? "Nested tsx is executable and completed a bounded version probe."
      : "Nested tsx is missing, outside nested node_modules, or failed its probe.",
  );
  addCheck(
    checks,
    "nested_tsc",
    nestedTscProbe,
    "nested_tsc_missing",
    nestedTscProbe
      ? "Nested tsc is executable and completed a bounded version probe."
      : "Nested tsc is missing, outside nested node_modules, or failed its probe.",
  );

  const applicationCommit = readApplicationCommit(repositoryRoot);
  const executionRepositoryClean = isExecutionRepositoryClean(repositoryRoot);
  const qualified = [
    rootLockPresent,
    nestedLockPresent,
    rootDependenciesPresent,
    nestedDependenciesPresent,
    rootTsxProbe,
    rootTscProbe,
    rootNextProbe,
    rootNativeDependencyAvailable,
    nestedTsxProbe,
    nestedTscProbe,
    applicationCommit !== null,
    executionRepositoryClean,
  ].every(Boolean);
  addCheck(
    checks,
    "application_commit",
    applicationCommit !== null,
    "repository_root_invalid",
    applicationCommit
      ? "Application commit was resolved from the repository."
      : "Application commit could not be resolved.",
  );
  addCheck(
    checks,
    "execution_repository_clean",
    executionRepositoryClean,
    "execution_repository_dirty",
    executionRepositoryClean
      ? "Execution repository exactly matches its recorded HEAD."
      : "Execution repository has tracked or untracked changes.",
  );
  return {
    qualified,
    applicationCommit,
    rootLockHash: rootLockPresent ? hashFile(rootLock) : null,
    nestedLockHash: nestedLockPresent ? hashFile(nestedLock) : null,
  };
}

function probeDependencyExecutable(modulesRoot, executablePath) {
  try {
    accessSync(executablePath, fsConstants.X_OK);
    const canonicalModules = canonicalizeExistingPathV01(modulesRoot);
    const canonicalExecutable = canonicalizeExistingPathV01(executablePath);
    if (!isPathWithinCanonicalRootV01(canonicalModules, canonicalExecutable)) {
      return false;
    }
    if (!statSync(canonicalExecutable).isFile()) return false;
    const probe = spawnSync(executablePath, ["--version"], {
      encoding: "utf8",
      timeout: PROBE_TIMEOUT_MS,
      maxBuffer: MAX_PROBE_OUTPUT_BYTES,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return !probe.error && probe.status === 0 && !probe.signal;
  } catch {
    return false;
  }
}

function probeRootNativeDependency(repositoryRoot) {
  try {
    const rootModules = canonicalizeExistingPathV01(
      path.join(repositoryRoot, "node_modules"),
    );
    if (!isPathWithinCanonicalRootV01(repositoryRoot, rootModules)) return false;
    const probeOptions = {
      cwd: repositoryRoot,
      env: isolatedNodeProbeEnvironmentV01(),
      encoding: "utf8",
      timeout: PROBE_TIMEOUT_MS,
      maxBuffer: MAX_PROBE_OUTPUT_BYTES,
      stdio: ["ignore", "pipe", "pipe"],
    };
    const resolution = spawnSync(
      process.execPath,
      [
        "-e",
        [
          'const { createRequire } = require("node:module");',
          'const path = require("node:path");',
          'const rootRequire = createRequire(path.join(process.argv[1], "package.json"));',
          'process.stdout.write(rootRequire.resolve("better-sqlite3"));',
        ].join(""),
        repositoryRoot,
      ],
      probeOptions,
    );
    if (resolution.error || resolution.status !== 0 || resolution.signal) {
      return false;
    }
    const resolvedModule = resolution.stdout?.trim();
    if (!resolvedModule || !path.isAbsolute(resolvedModule)) return false;
    const canonicalResolvedModule = canonicalizeExistingPathV01(resolvedModule);
    if (
      !isPathWithinCanonicalRootV01(rootModules, canonicalResolvedModule) ||
      !statSync(canonicalResolvedModule).isFile()
    ) {
      return false;
    }
    const load = spawnSync(
      process.execPath,
      ["-e", "require(process.argv[1])", canonicalResolvedModule],
      probeOptions,
    );
    return !load.error && load.status === 0 && !load.signal;
  } catch {
    return false;
  }
}

function isExecutionRepositoryClean(repositoryRoot) {
  const result = spawnSync(
    "git",
    ["-C", repositoryRoot, "status", "--porcelain", "--untracked-files=all"],
    {
      encoding: "utf8",
      timeout: PROBE_TIMEOUT_MS,
      maxBuffer: MAX_PROBE_OUTPUT_BYTES,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  return !result.error && result.status === 0 && result.stdout === "";
}

function readApplicationCommit(repositoryRoot) {
  const result = spawnSync("git", ["-C", repositoryRoot, "rev-parse", "HEAD"], {
    encoding: "utf8",
    timeout: PROBE_TIMEOUT_MS,
    maxBuffer: MAX_PROBE_OUTPUT_BYTES,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const commit = result.stdout?.trim();
  return !result.error && result.status === 0 && /^[0-9a-f]{40}$/u.test(commit)
    ? commit
    : null;
}

function connectionIsRefused(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, 500);
    socket.once("connect", () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(false);
    });
    socket.once("error", (error) => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(isLoopbackReleaseRefusalV01(error));
    });
  });
}

function classifyWorkingDatabaseFreshLeafV01(workingDbPath) {
  const lexicalWorkingDatabase = validateAbsolutePathInputV01(workingDbPath);
  const entryKind = getLexicalPathEntryKindV01(lexicalWorkingDatabase);
  if (entryKind === "missing") {
    return { qualified: true, reasonCode: null };
  }
  if (entryKind === "file" || entryKind === "directory") {
    return { qualified: false, reasonCode: "working_db_path_exists" };
  }
  if (entryKind !== "symlink") {
    return { qualified: false, reasonCode: "working_db_path_invalid_type" };
  }
  try {
    realpathSync.native(lexicalWorkingDatabase);
  } catch {
    return { qualified: false, reasonCode: "dangling_symlink" };
  }
  return { qualified: false, reasonCode: "symlink_escape" };
}

function isolatedNodeProbeEnvironmentV01() {
  const environment = {};
  for (const key of [
    "HOME",
    "LANG",
    "LC_ALL",
    "PATH",
    "TEMP",
    "TMP",
    "TMPDIR",
  ]) {
    if (typeof process.env[key] === "string") environment[key] = process.env[key];
  }
  return environment;
}

function canonicalizeProspectiveLeafWithoutInspectionV01(pathValue) {
  const lexicalPath = validateAbsolutePathInputV01(pathValue);
  const canonicalParent = canonicalizeProspectivePathV01(
    path.dirname(lexicalPath),
  );
  return path.join(canonicalParent, path.basename(lexicalPath));
}

function isPathStrictlyWithinCanonicalRootV01(root, candidate) {
  return root !== candidate && isPathWithinCanonicalRootV01(root, candidate);
}

function addCheck(checks, checkId, passed, reasonCode, publicSummary) {
  checks.push({
    check_id: checkId,
    status: passed ? "pass" : "fail",
    reason_code: passed ? null : reasonCode,
    public_summary: publicSummary,
  });
}

function addNotApplicable(checks, checkId, publicSummary) {
  checks.push({
    check_id: checkId,
    status: "not_applicable",
    reason_code: null,
    public_summary: publicSummary,
  });
}

function regularFileExists(filePath) {
  try {
    return statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function directoryExistsWithoutSymlink(directoryPath) {
  try {
    return (
      lstatSync(directoryPath).isDirectory() &&
      !lstatSync(directoryPath).isSymbolicLink()
    );
  } catch {
    return false;
  }
}

function hashFile(filePath) {
  return `sha256:${createHash("sha256")
    .update(readFileSync(filePath))
    .digest("hex")}`;
}

function parseNodeMajor(nodeVersion) {
  const match = /^v?(\d+)\./u.exec(nodeVersion ?? "");
  return match ? Number.parseInt(match[1], 10) : null;
}

function publicRootLabel(rootPath) {
  return path.basename(rootPath) || "filesystem-root";
}

function qualificationError(reasonCode, message) {
  const error = new Error(message);
  error.reasonCode = reasonCode;
  return error;
}

function publicReasonCode(error, fallback) {
  return typeof error?.reasonCode === "string" ? error.reasonCode : fallback;
}
