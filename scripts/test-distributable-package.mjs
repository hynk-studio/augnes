#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import {
  chmodSync,
  cpSync,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmdirSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { gunzipSync } from "node:zlib";

import Database from "better-sqlite3";

import {
  RECOVERY_PRIVATE_MATERIAL_MARKER,
  RECOVERY_PRIVATE_LEGACY_OBSERVE_REASON,
  RECOVERY_PRIVATE_LEGACY_OBSERVE_SOURCE_AGENT_ID,
  RECOVERY_PRIVATE_LEGACY_OBSERVE_STATE_KEYS,
  RECOVERY_PRIVATE_STATE_VALUE_MARKER,
} from "../lib/db/recovery-private-material-contract.mjs";
import {
  DISTRIBUTABLE_APPLICATION_SCOPE_FINGERPRINT,
  DISTRIBUTABLE_PACKAGE_CONTRACT_VERSION,
  DISTRIBUTABLE_SUPERVISOR_BUNDLE_FILE,
  DISTRIBUTABLE_SUPPORTED_OPERATING_SYSTEMS,
  assertAllowedDistributablePayloadPath,
  assertSafeDistributablePath,
  createDistributableManifest,
  detectDistributablePlatform,
  formatDistributablePlatformLabel,
  validateDistributableManifest,
} from "./distributable-package-contract.mjs";
import { resolveAugnesLocalPaths } from "./augnes-local-paths.mjs";
import {
  bootstrapJournalPath,
  inspectRecoveryDatabaseFile,
  inspectRecoverySourceDatabaseFile,
  inspectRuntimePackageIdentityGuard,
} from "./runtime-database-bootstrap.mjs";
import {
  PORT_SEARCH_SIZE,
  resolveRuntimePaths,
} from "./augnes-runtime-supervisor-core.mjs";
import {
  RECOVERY_DATABASE_PAYLOAD,
  RECOVERY_OPERATION_FILE,
  listRecoveryBackups,
  readRecoveryOperationResults,
} from "./recovery-backup.mjs";

import {
  cleanupOwnedProcesses,
  closeTrackedServer,
  registerOwnedChild,
  terminateOwnedProcessTree,
  trackServerConnections,
  waitForOwnedProcessExit,
} from "./test-harness-process-lifecycle.mjs";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";

const PACKAGE_CONTRACT = "augnes.distributable.v1";
const RUNTIME_CONTRACT = "augnes-local-runtime-supervisor-v1";
const RUNTIME_SCHEMA_VERSION = 2;
const PACKAGE_COMMAND_TIMEOUT_MS = 180_000;
const PROCESS_EXIT_TIMEOUT_MS = 45_000;
const READY_TIMEOUT_MS = 60_000;
const TEST_UI_PORT_RANGE = Object.freeze([20_000, 23_999]);
const TEST_BRIDGE_PORT_RANGE = Object.freeze([24_000, 27_999]);
const PACKAGE_MANAGER_NAMES = ["npm", "npx", "pnpm", "yarn", "bun"];
const SQLITE_SIDE_SUFFIXES = ["-wal", "-shm", "-journal"];
const MERGED_R8A_COMMIT =
  "e3a35bb36457d5444e7601ba5e8ed416c9bf7c3a";
const MERGED_R8A_TREE = "aef09f2e88096fc553755b8c7e3ddc814353e023";
const MERGED_R8A_APPLICATION_VERSION = "0.1.0";
const MERGED_R8A_SOURCE_SCHEMA_SIGNATURE =
  "800d9cdf741cf7b85362e8ee9c101b6b33d923a41ff1efdddc098e32df776a4a";
const MERGED_R8A_RAW_OBSERVE_SENTINEL =
  "Merged R8A Observe input sk-proj-r8a-private-6fc8e219";
const MERGED_R8A_RAW_OBSERVE_BEFORE_SENTINEL =
  "Merged R8A earlier input sk-proj-r8a-before-25d79c4a";

const repositoryRoot = realpathSync(process.cwd());
const APPLICATION_VERSION = JSON.parse(
  readFileSync(path.join(repositoryRoot, "package.json"), "utf8"),
).version;
const PRIVATE_BUILD_SENTINEL =
  "augnes-private-package-build-credential-sentinel";
const PACKAGE_PLATFORM = detectDistributablePlatform();
const PACKAGE_PLATFORM_LABEL = formatDistributablePlatformLabel(
  PACKAGE_PLATFORM,
);
const artifactName =
  `augnes-${APPLICATION_VERSION}-${PACKAGE_PLATFORM_LABEL}.tar.gz`;
const canonicalTemporaryRoot = canonicalRootFromEnvironment();
const ownsCanonicalTemporaryRoot = canonicalTemporaryRoot === null;
const testParent = canonicalTemporaryRoot ?? mkdtempSync(
  path.join(tmpdir(), "augnes-distributable-package-parent-"),
);
const testRoot = mkdtempSync(path.join(testParent, "package-operability-"));
const artifactOutputRoot = path.join(testRoot, "artifact-output");
const artifactPath = path.join(artifactOutputRoot, artifactName);
const buildTemporaryRoot = path.join(testRoot, "package-tool-temp");
mkdirSync(buildTemporaryRoot, { mode: 0o700 });
const packageToolHomeRoot = path.join(testRoot, "package-tool-home");
mkdirSync(packageToolHomeRoot, { mode: 0o700 });
const buildTemporaryPrefixes = [
  "augnes-distributable-build-",
  "augnes-production-build-",
];
const buildTemporaryBaseline = new Set(listBuildTemporaryEntries());
const unpackRoot = path.join(testRoot, "unpacked");
const artifactCopy = path.join(testRoot, "artifact-copy", artifactName);
mkdirSync(path.dirname(artifactCopy), { mode: 0o700 });
const networkEvidencePath = path.join(testRoot, "zero-network-evidence.jsonl");
writeFileSync(networkEvidencePath, "", { flag: "wx", mode: 0o600 });
const packageNetworkGuardImport = createChildNetworkGuard(
  testRoot,
  "package-build",
);
const expectedPackageBuildNetworkGuardLabels = new Set(["package-build"]);
const ownedProcesses = new Set();
const allProcessRecords = [];
const observedOwnedPids = new Set();
const observedLauncherPids = new Set();
const observedOwnedPorts = new Set();
const ownedServers = new Set();
const scenarioRoots = [];
const cleanupRuntimeEnvironments = new Map();
const expectedRuntimeNetworkGuardLabels = new Set();
const durations = {};
let packageRoot = null;
let packageManifest = null;
let mergedR8ABuildIdentity = null;
let fakePackageManagerSentinel = null;
let suiteError = null;
let cleanupError = null;
let childNetworkEvidence = { blockedAttempts: 0, guardedProcesses: 0 };

const networkGuard = installZeroNetworkGuard({
  allowLoopback: true,
  errorPrefix: "distributable_package_external_network_forbidden",
});
const focusedScenarioArgument = process.argv.find((value) =>
  value.startsWith("--focus="),
);
const focusedScenario = focusedScenarioArgument?.slice("--focus=".length) ?? null;
if (
  focusedScenario !== null &&
  !new Set(["migration-restore", "startup-timeout", "v1-handoff"]).has(
    focusedScenario,
  )
) {
  throw new Error("unsupported distributable package focus");
}

try {
  assert(
    DISTRIBUTABLE_SUPPORTED_OPERATING_SYSTEMS.includes(process.platform),
    `distributable package test is unsupported on ${process.platform}`,
  );
  assertContractRejectsForbiddenPayloads();
  const packageStartedAt = Date.now();
  const packageResult = await runCapturedProcess({
    command: process.platform === "win32" ? "npm.cmd" : "npm",
    args: ["run", "package"],
    cwd: repositoryRoot,
    environment: packageBuildEnvironment(),
    label: "canonical distributable package command",
    timeoutMs: PACKAGE_COMMAND_TIMEOUT_MS,
  });
  durations.package_command_ms = Date.now() - packageStartedAt;
  assert.equal(packageResult.code, 0, packageResult.output);
  assert.equal(packageResult.output.includes(PRIVATE_BUILD_SENTINEL), false);
  assert.equal(existsSync(artifactPath), true, "npm run package must create the canonical artifact");
  copyFileSync(artifactPath, artifactCopy);

  const archiveStartedAt = Date.now();
  await validateAndExtractArchive(artifactCopy, unpackRoot);
  durations.archive_validation_and_extract_ms = Date.now() - archiveStartedAt;
  packageRoot = findPackageRoot(unpackRoot);
  assertOutsideRepository(packageRoot, "unpacked package root");
  packageManifest = validatePackageContents(packageRoot);
  applyRestrictiveExtractionModes(packageRoot, packageManifest);
  await assertPostPreflightSupervisorReplacementRefused(
    packageRoot,
    packageManifest,
  );

  if (focusedScenario === null) {
    await assertDirectSupervisorCannotBypassPreflight(packageRoot);
    await assertInvalidCanonicalImportRefusesBeforeDurableMutation(packageRoot);
    await assertPlatformRefusalBeforeDurableMutation(packageRoot, packageManifest);
  }

  if (focusedScenario === null) {
    const lifecycleStartedAt = Date.now();
    await testFreshAndCurrentPackagedRuntime(packageRoot, packageManifest);
    durations.fresh_and_current_runtime_ms = Date.now() - lifecycleStartedAt;

    const adoptionStartedAt = Date.now();
    await testLegacyPackageIdentityAdoption(packageRoot, packageManifest);
    durations.legacy_package_identity_adoption_ms =
      Date.now() - adoptionStartedAt;

    const handoffStartedAt = Date.now();
    await testCompatibleDifferentBuildHandoff(packageRoot, packageManifest);
    durations.compatible_build_handoff_ms = Date.now() - handoffStartedAt;
  }

  if (focusedScenario === null || focusedScenario === "v1-handoff") {
    const v1HandoffStartedAt = Date.now();
    await testV1ContractMigrationHandoff(packageRoot, packageManifest);
    durations.v1_contract_migration_handoff_ms =
      Date.now() - v1HandoffStartedAt;
  }

  if (focusedScenario === "startup-timeout") {
    const startupTimeoutStartedAt = Date.now();
    await testStartupTimeoutRecoverySurface(packageRoot, packageManifest);
    durations.startup_timeout_cleanup_ms = Date.now() - startupTimeoutStartedAt;
  }

  if (focusedScenario === "migration-restore") {
    const recoveryStartedAt = Date.now();
    await testPackagedMigrationAndRestore(packageRoot, packageManifest);
    durations.packaged_update_and_restore_ms = Date.now() - recoveryStartedAt;
  }

  if (focusedScenario === null) {
    const recoveryStartedAt = Date.now();
    await testPackagedMigrationAndRestore(packageRoot, packageManifest);
    durations.packaged_update_and_restore_ms = Date.now() - recoveryStartedAt;

    const startupFailureStartedAt = Date.now();
    await testInvalidBridgeProfileCleanup(packageRoot, packageManifest);
    durations.startup_failure_cleanup_ms = Date.now() - startupFailureStartedAt;

    const startupTimeoutStartedAt = Date.now();
    await testStartupTimeoutRecoverySurface(packageRoot, packageManifest);
    durations.startup_timeout_cleanup_ms = Date.now() - startupTimeoutStartedAt;

    const requiredCrashStartedAt = Date.now();
    await testRequiredBridgeCrashCleanup(packageRoot);
    durations.required_child_crash_cleanup_ms = Date.now() - requiredCrashStartedAt;

    const reconciliationStartedAt = Date.now();
    await testHardCrashReconciliation(packageRoot);
    durations.hard_crash_reconciliation_ms = Date.now() - reconciliationStartedAt;
  }

  assert.equal(
    existsSync(fakePackageManagerSentinel),
    false,
    "the unpacked runtime must not invoke npm, npx, pnpm, yarn, or bun",
  );
  assert.deepEqual(
    networkGuard.attempts,
    [],
    "the package test process must make no non-loopback network attempt",
  );
  childNetworkEvidence = assertChildNetworkEvidence();
  assert.deepEqual(
    listNewBuildTemporaryEntries(),
    [],
    "package/build temporary roots must be removed by their owners",
  );
} catch (error) {
  suiteError = error;
} finally {
  networkGuard.restore();
  const cleanupErrors = [];
  if (packageRoot && existsSync(packageRoot)) {
    for (const { scenario, environment } of cleanupRuntimeEnvironments.values()) {
      if (!existsSync(scenario.root)) continue;
      try {
        const stop = await runPackagedCli(
          packageRoot,
          ["stop"],
          environment,
          `cleanup ${scenario.name}`,
        );
        if (stop.code !== 0) throw new Error(stop.output);
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
  }
  try {
    await cleanupOwnedProcesses(ownedProcesses, {
      termGraceMs: 10_000,
      killGraceMs: 5_000,
    });
  } catch (error) {
    cleanupErrors.push(error);
  }
  for (const record of allProcessRecords) {
    try {
      await terminateOwnedProcessTree(record, {
        termGraceMs: 5_000,
        killGraceMs: 3_000,
      });
    } catch (error) {
      cleanupErrors.push(error);
    }
  }
  for (const server of ownedServers) {
    try {
      await closeTrackedServer(server, { timeoutMs: 3_000 });
    } catch (error) {
      cleanupErrors.push(error);
    }
  }

  try {
    const buildResidue = listNewBuildTemporaryEntries();
    for (const name of buildResidue) {
      const candidate = path.join(buildTemporaryRoot, name);
      assertInsideRoot(buildTemporaryRoot, realpathSync(candidate), name);
      rmSync(candidate, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    }
    if (buildResidue.length > 0) {
      throw new Error(`package/build temporary residue remained: ${buildResidue.join(", ")}`);
    }
  } catch (error) {
    cleanupErrors.push(error);
  }

  try {
    rmSync(testRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    if (ownsCanonicalTemporaryRoot) {
      rmSync(testParent, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    }
  } catch (error) {
    cleanupErrors.push(error);
  }

  if (cleanupErrors.length > 0) {
    cleanupError = new AggregateError(
      cleanupErrors,
      "distributable package test cleanup failed",
    );
  }
}

if (suiteError && cleanupError) {
  throw new AggregateError(
    [suiteError, cleanupError],
    "distributable package test and cleanup failed",
  );
}
if (suiteError) throw suiteError;
if (cleanupError) throw cleanupError;

assert.equal(existsSync(testRoot), false, "package test root must be removed");
for (const scenarioRoot of scenarioRoots) {
  assert.equal(existsSync(scenarioRoot), false, "scenario root must be removed");
}
for (const pid of new Set([...observedOwnedPids, ...observedLauncherPids])) {
  assert.equal(isProcessAlive(pid), false, `owned packaged-runtime PID ${pid} remained alive`);
}
for (const port of observedOwnedPorts) {
  assert.equal(await canConnect(port), false, `owned packaged-runtime port ${port} remained open`);
}

if (focusedScenario !== null) {
  console.log(
    JSON.stringify(
      {
        test: "distributable-package-focused-scenario",
        status: "pass",
        focused_scenario: focusedScenario,
        package_contract: packageManifest.contract,
        build_identity: packageManifest.build_identity,
        supervisor_bundle_exact_bytes_verified: true,
        verified_native_stage_and_replacement_refusal: true,
        bundled_schema_replacement_isolation_verified: true,
        merged_r8a_commit:
          focusedScenario === "v1-handoff" ? MERGED_R8A_COMMIT : null,
        merged_r8a_tree:
          focusedScenario === "v1-handoff" ? MERGED_R8A_TREE : null,
        merged_r8a_build_identity:
          focusedScenario === "v1-handoff" ? mergedR8ABuildIdentity : null,
        external_network_attempts:
          networkGuard.attempts.length + childNetworkEvidence.blockedAttempts,
        owned_processes_after: 0,
        owned_ports_after: 0,
        package_test_roots_after: 0,
        build_temp_roots_after: 0,
        durations,
      },
      null,
      2,
    ),
  );
} else console.log(
  JSON.stringify(
    {
      test: "distributable-package-and-packaged-runtime",
      status: "pass",
      package_contract: packageManifest.contract,
      application_version: packageManifest.application_version,
      build_identity: packageManifest.build_identity,
      platform: packageManifest.platform,
      package_command: "npm run package",
      artifact: path.basename(artifactPath),
      archive_entries_validated_before_extract: true,
      manifest_integrity_verified: true,
      supervisor_bundle_exact_bytes_verified: true,
      verified_native_stage_and_replacement_refusal: true,
      bundled_schema_replacement_isolation_verified: true,
      canonical_validator_bundle_integrity_verified: true,
      source_checkout_runtime_dependency: false,
      package_manager_runtime_invocations: 0,
      initial_database_created_without_demo_seed: true,
      current_database_restart_verified: true,
      compatible_different_build_handoff_verified: true,
      actual_merged_r8a_package_handoff_verified: true,
      packaged_old_schema_update_verified: true,
      verified_recovery_backup_and_atomic_restore: true,
      product_recovery_action_verified: true,
      recovery_html_security_headers_verified: true,
      recovery_schema_contract_status_verified: true,
      missing_provider_and_host_capabilities_truthful: true,
      occupied_preferred_ports_skipped: true,
      duplicate_launch_reused: true,
      startup_child_failure_cleanup_verified: true,
      startup_timeout_recovery_surface_verified: true,
      packaged_restart_failure_preserved_verified_backup: true,
      required_child_crash_cleanup_verified: true,
      stale_owner_orphan_reconciliation_verified: true,
      package_diagnostics_verified: true,
      project_home_workbench_inspector_available: true,
      external_network_attempts:
        networkGuard.attempts.length + childNetworkEvidence.blockedAttempts,
      guarded_node_processes: childNetworkEvidence.guardedProcesses,
      owned_processes_after: 0,
      owned_ports_after: 0,
      package_test_roots_after: 0,
      build_temp_roots_after: 0,
      durations,
    },
    null,
    2,
  ),
);

async function validateAndExtractArchive(archivePath, destination) {
  assertOutsideRepository(destination, "archive extraction destination");
  const listing = await runCapturedProcess({
    command: "tar",
    args: ["-tzf", archivePath],
    cwd: testRoot,
    environment: process.env,
    label: "list distributable archive",
    timeoutMs: 30_000,
  });
  assert.equal(listing.code, 0, listing.output);
  const entries = listing.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .map(normalizeArchiveEntry);
  assert(entries.length > 0, "distributable archive must not be empty");
  assert.equal(new Set(entries).size, entries.length, "archive entries must be unique");
  for (const entry of entries) assertSafeRelativePath(entry, "archive entry");
  const expectedRoot = path.basename(archivePath).replace(/\.tar\.gz$/, "");
  assert(
    entries.every((entry) => entry.startsWith(`${expectedRoot}/`)),
    "every archive entry must remain inside the versioned package root",
  );
  assert.deepEqual(validateRawTarHeaders(archivePath), entries);

  mkdirSync(destination, { recursive: true, mode: 0o700 });
  const extracted = await runCapturedProcess({
    command: "tar",
    args: ["-xzf", archivePath, "-C", destination],
    cwd: testRoot,
    environment: process.env,
    label: "extract distributable archive",
    timeoutMs: 60_000,
  });
  assert.equal(extracted.code, 0, extracted.output);
}

function validateRawTarHeaders(archivePath) {
  const archive = gunzipSync(readFileSync(archivePath));
  const entries = [];
  let offset = 0;
  let consecutiveZeroBlocks = 0;
  while (offset + 512 <= archive.length) {
    const header = archive.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) {
      consecutiveZeroBlocks += 1;
      offset += 512;
      if (consecutiveZeroBlocks >= 2) break;
      continue;
    }
    assert.equal(consecutiveZeroBlocks, 0, "tar data followed a zero header block");
    const storedChecksum = parseTarOctal(header, 148, 8);
    let calculatedChecksum = 0;
    for (let index = 0; index < header.length; index += 1) {
      calculatedChecksum += index >= 148 && index < 156 ? 0x20 : header[index];
    }
    assert.equal(storedChecksum, calculatedChecksum, "tar header checksum mismatch");
    assert.match(readTarText(header, 257, 6), /^ustar/);
    const name = readTarText(header, 0, 100);
    const prefix = readTarText(header, 345, 155);
    const entry = prefix ? `${prefix}/${name}` : name;
    assertSafeRelativePath(entry, "raw tar header path");
    assert.equal(parseTarOctal(header, 108, 8), 0, `${entry} leaked archive uid`);
    assert.equal(parseTarOctal(header, 116, 8), 0, `${entry} leaked archive gid`);
    assert.equal(
      parseTarOctal(header, 136, 12),
      946_684_800,
      `${entry} has a non-normalized archive mtime`,
    );
    assert(
      ["", "root"].includes(readTarText(header, 265, 32)),
      `${entry} leaked archive user metadata`,
    );
    assert(
      ["", "root"].includes(readTarText(header, 297, 32)),
      `${entry} leaked archive group metadata`,
    );
    const type = readTarText(header, 156, 1);
    assert(["", "0"].includes(type), `${entry} is not a regular ustar entry`);
    const expectedMode = entry.endsWith("/augnes") ? 0o755 : 0o644;
    assert.equal(parseTarOctal(header, 100, 8), expectedMode);
    const size = parseTarOctal(header, 124, 12);
    entries.push(entry);
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  assert(consecutiveZeroBlocks >= 2, "tar archive lacks its zero-block terminator");
  assert(
    archive.subarray(offset).every((byte) => byte === 0),
    "tar archive contains data after its terminator",
  );
  return entries;
}

function readTarText(header, offset, length) {
  const field = header.subarray(offset, offset + length);
  const nul = field.indexOf(0);
  return field.subarray(0, nul === -1 ? field.length : nul).toString("utf8").trim();
}

function parseTarOctal(header, offset, length) {
  const value = readTarText(header, offset, length).replaceAll("\0", "").trim();
  assert.match(value, /^[0-7]+$/);
  return Number.parseInt(value, 8);
}

function findPackageRoot(destination, expectedArtifactPath = artifactPath) {
  assert.equal(
    existsSync(path.join(destination, "augnes-package.json")),
    false,
    "the archive must not place package files directly in the extraction directory",
  );
  const candidates = readdirSync(destination, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
    .map((entry) => path.join(destination, entry.name))
    .filter((directory) => existsSync(path.join(directory, "augnes-package.json")));
  assert.equal(candidates.length, 1, "archive must contain exactly one package root");
  assert.equal(
    path.basename(candidates[0]),
    path.basename(expectedArtifactPath).replace(/\.tar\.gz$/, ""),
  );
  return realpathSync(candidates[0]);
}

function validatePackageContents(root) {
  const manifestPath = path.join(root, "augnes-package.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  assert.equal(manifest.contract, PACKAGE_CONTRACT);
  assert.equal(
    manifest.package_contract_version,
    DISTRIBUTABLE_PACKAGE_CONTRACT_VERSION,
  );
  assert.equal(manifest.application_version, APPLICATION_VERSION);
  assert.match(manifest.build_identity, /^sha256:[0-9a-f]{64}$/);
  assert.equal(
    manifest.application_scope_fingerprint,
    DISTRIBUTABLE_APPLICATION_SCOPE_FINGERPRINT,
  );
  assert.throws(
    () =>
      validateDistributableManifest({
        ...manifest,
        application_scope_fingerprint: "c".repeat(64),
      }),
    (error) => error?.code === "package_manifest_invalid",
  );
  assert.deepEqual(manifest.platform, PACKAGE_PLATFORM);
  assert.equal(manifest.runtime?.node_modules_abi, process.versions.modules);
  assert.equal(manifest.runtime?.node_napi, process.versions.napi);
  assert.equal(manifest.runtime?.runtime_contract, RUNTIME_CONTRACT);
  assert.equal(manifest.runtime?.runtime_schema_version, RUNTIME_SCHEMA_VERSION);
  assert.equal(manifest.database?.schema_compatibility, "current");
  assert.equal(
    manifest.database?.schema_contract,
    "augnes.sqlite.structural-schema.v1",
  );
  assert.match(manifest.database?.schema_signature, /^[0-9a-f]{64}$/);
  assert.equal(
    manifest.database?.migration_contract,
    "augnes.canonical-database-migrations.v1",
  );
  assert.equal(manifest.database?.migration_contract_version, 1);
  assert.deepEqual(manifest.database?.migration_ids, [
    "0001_r8_recovery_contract",
  ]);
  assert.equal(
    manifest.database?.record_contract,
    "augnes.vnext-canonical-records.v1",
  );
  assert.equal(manifest.database?.record_contract_version, 1);
  assert.deepEqual(manifest.database?.reader_contracts, [
    "project_home.v0.1",
    "decision_centered_semantic_workbench.v0.1",
    "shared_project_inspector.v0.1",
  ]);
  assert.deepEqual(manifest.database?.supported_source_schema_states, [
    "current",
    "old",
  ]);
  assert.deepEqual(manifest.database?.supported_source_schema_signatures, [
    "800d9cdf741cf7b85362e8ee9c101b6b33d923a41ff1efdddc098e32df776a4a",
  ]);
  assert(Array.isArray(manifest.files) && manifest.files.length > 0);

  const declaredPaths = manifest.files.map((entry) => entry.path);
  assert.deepEqual(
    declaredPaths,
    [...declaredPaths].sort(compareCodeUnits),
    "manifest files must use deterministic code-unit order",
  );
  assert.equal(new Set(declaredPaths).size, declaredPaths.length);

  for (const entry of manifest.files) {
    assertSafeRelativePath(entry.path, "manifest file");
    assert.equal(typeof entry.size, "number");
    assert.equal(Number.isSafeInteger(entry.size) && entry.size >= 0, true);
    assert.equal(Number.isInteger(entry.mode), true);
    assert.match(entry.sha256, /^[0-9a-f]{64}$/);
    const filePath = path.join(root, ...entry.path.split("/"));
    const stats = lstatSync(filePath);
    assert.equal(stats.isFile(), true, `manifest entry must be a regular file: ${entry.path}`);
    assert.equal(stats.isSymbolicLink(), false, `manifest entry must not be a symlink: ${entry.path}`);
    assert.equal(stats.size, entry.size, `manifest size mismatch: ${entry.path}`);
    if (process.platform !== "win32") {
      assert.equal(
        compatibleExtractedMode(stats.mode & 0o777, entry.mode),
        true,
        `manifest mode mismatch: ${entry.path}`,
      );
    }
    assert.equal(hashFile(filePath), entry.sha256, `manifest hash mismatch: ${entry.path}`);
    assertInsideRoot(root, realpathSync(filePath), entry.path);
  }

  const actualFiles = listRegularFiles(root).map((filePath) =>
    toPosixRelative(root, filePath),
  );
  assert.deepEqual(
    actualFiles,
    [...declaredPaths, "augnes-package.json"].sort(compareCodeUnits),
    "manifest must cover the exact unpacked package file set",
  );

  for (const required of [
    "augnes",
    "augnes.mjs",
    "server.js",
    "bridge/dist/server.mjs",
    "scripts/recovery-canonical-record-validator.mjs",
    "scripts/recovery-canonical-record-validator.bundle.cjs",
  ]) {
    assert.equal(declaredPaths.includes(required), true, `package is missing ${required}`);
  }
  if (process.platform !== "win32") {
    assert.notEqual(statSync(path.join(root, "augnes")).mode & 0o111, 0);
  }

  for (const entry of declaredPaths) {
    const dependencyEntry = entry.startsWith("node_modules/")
      || entry.includes("/node_modules/");
    if (!dependencyEntry) {
      assert.doesNotMatch(
        entry,
        /(^|\/)(?:\.git|fixtures|apps|components|types)(?:\/|$)/,
      );
    }
    assert.doesNotMatch(entry, /(^|\/)bridge\/src(?:\/|$)/);
    assert.doesNotMatch(entry, /(^|\/)node_modules\/tsx(?:\/|$)/);
    assert.doesNotMatch(entry, /(^|\/)scripts\/test[^/]*(?:\/|$)/);
    assert.doesNotMatch(entry, /(^|\/)(?:package-lock\.json|\.env(?:\..*)?)(?:$|\/)/);
  }

  const repositoryBytes = Buffer.from(repositoryRoot);
  const privateBuildBytes = Buffer.from(PRIVATE_BUILD_SENTINEL);
  const privateBuildPathBytes = Array.from(
    new Set(
      [testRoot, realpathSync(testRoot)].flatMap((value) => [
        value,
        value.split(path.sep).join("/"),
        JSON.stringify(value).slice(1, -1),
      ]),
    ),
    (value) => Buffer.from(value),
  );
  for (const filePath of listRegularFiles(root)) {
    const contents = readFileSync(filePath);
    assert.equal(
      contents.includes(repositoryBytes),
      false,
      `package file leaked the source checkout path: ${toPosixRelative(root, filePath)}`,
    );
    assert.equal(
      contents.includes(privateBuildBytes),
      false,
      `package file leaked a build credential sentinel: ${toPosixRelative(root, filePath)}`,
    );
    for (const privatePath of privateBuildPathBytes) {
      assert.equal(
        contents.includes(privatePath),
        false,
        `package file leaked a package-test path: ${toPosixRelative(root, filePath)}`,
      );
    }
  }
  const launchMaterialPaths = [
    "augnes",
    "augnes.mjs",
    "server.js",
    "bridge/dist/server.mjs",
    ...declaredPaths.filter(
      (relativePath) =>
        relativePath.startsWith("scripts/") && relativePath.endsWith(".mjs"),
    ),
  ];
  const launchMaterial = [...new Set(launchMaterialPaths)]
    .map((relativePath) => readFileSync(path.join(root, relativePath), "utf8"))
    .join("\n");
  assert.doesNotMatch(launchMaterial, /--import\s+tsx|next\s+dev|npm\s+(?:install|ci)/);

  return manifest;
}

function applyRestrictiveExtractionModes(root, manifest) {
  if (process.platform === "win32") return;
  for (const entry of manifest.files) {
    chmodSync(
      path.join(root, ...entry.path.split("/")),
      entry.mode === 0o755 ? 0o700 : 0o600,
    );
  }
  chmodSync(path.join(root, "augnes-package.json"), 0o600);
}

function compatibleExtractedMode(actual, expected) {
  return (
    (actual & ~expected) === 0 &&
    (actual & (expected === 0o755 ? 0o500 : 0o400)) ===
      (expected === 0o755 ? 0o500 : 0o400)
  );
}

function assertContractRejectsForbiddenPayloads() {
  assert.equal(
    assertAllowedDistributablePayloadPath(
      ".next/static/-valid-next-build-id/_buildManifest.js",
    ),
    ".next/static/-valid-next-build-id/_buildManifest.js",
    "valid nested Next build IDs may begin with a dash",
  );
  assert.throws(
    () => assertSafeDistributablePath("-unsafe-archive-entry"),
    (error) => error?.code === "package_path_unsafe",
    "a root archive entry beginning with a dash must remain forbidden",
  );
  for (const candidate of [
    ".next/server/.env.local",
    ".next/server/runtime.db-wal",
    ".next/server/runtime.sqlite-shm",
    ".next/server/runtime.db.backup",
    ".next/server/runtime.sqlite.old",
    ".next/server/signing.key.backup",
    "node_modules/example/private.pem.old",
  ]) {
    assert.throws(
      () => assertAllowedDistributablePayloadPath(candidate),
      (error) => error?.code === "package_source_leak",
      candidate,
    );
  }
}

function assertLauncherPreflightRecoveryCard(value, reason) {
  assert.equal(value.trim(), launcherPreflightRecoveryCard(reason));
  assert.equal(value.includes(repositoryRoot), false);
  assert.equal(value.includes(testRoot), false);
  assert.equal(value.includes(PRIVATE_BUILD_SENTINEL), false);
}

function launcherPreflightRecoveryCard(reason) {
  const outcome = launcherPreflightOutcome(reason);
  return [
    "Augnes package recovery",
    outcome === "incompatible_package"
      ? "Status: This package is not compatible with this computer."
      : "Status: This package did not pass integrity verification.",
    `Reason code: ${reason}`,
    "Data status: No Augnes data was changed by this launch.",
    "Next safe action: Start Augnes with the previous verified compatible package.",
  ].join("\n");
}

function launcherPreflightOutcome(reason) {
  return new Set([
    "package_architecture_unsupported",
    "package_libc_unsupported",
    "package_native_dependency_invalid",
    "package_node_modules_abi_unsupported",
    "package_node_napi_unsupported",
    "package_node_version_unsupported",
    "package_platform_unsupported",
  ]).has(reason)
    ? "incompatible_package"
    : "package_integrity_failed";
}

function assertLauncherPreflightFailureEvent(
  event,
  reason,
  { command = "start", nextAction = "launch_previous_verified_compatible_package" } = {},
) {
  assert.equal(event.schema_version, 2);
  assert.equal(event.contract, "augnes.distributable.launcher.v2");
  assert.equal(event.command, command);
  assert.equal(event.result, "failed");
  assert.equal(event.state, "unavailable");
  assert.equal(event.reason, reason);
  assert.equal(event.reason_code, reason);
  assert.equal(event.outcome, launcherPreflightOutcome(reason));
  assert.equal(
    event.package_compatibility,
    event.outcome === "incompatible_package"
      ? "incompatible"
      : "verification_failed",
  );
  assert.equal(event.database_state, "not_opened");
  assert.equal(event.data_preserved, true);
  assert.equal(event.next_action, nextAction);
  assert.equal(event.recovery_entry, "launcher_guidance");
}

async function assertDirectSupervisorCannotBypassPreflight(root) {
  const scenario = createRuntimeScenario("direct-supervisor-preflight");
  const environment = runtimeEnvironment(scenario, {
    uiPort: await availablePreferredPort(),
    bridgePort: await availablePreferredPort(),
  });
  const serverPath = path.join(root, "server.js");
  const validatorBundlePath = path.join(
    root,
    "scripts",
    "recovery-canonical-record-validator.bundle.cjs",
  );
  const manifestPath = path.join(root, "augnes-package.json");
  const manifestBackupPath = path.join(root, ".augnes-package.test-backup.json");
  const original = readFileSync(serverPath);
  const originalMode = lstatSync(serverPath).mode & 0o777;
  const originalValidatorBundle = readFileSync(validatorBundlePath);
  const originalValidatorBundleMode =
    lstatSync(validatorBundlePath).mode & 0o777;
  const forgedSourceMarkers = [
    path.join(root, "next.config.ts"),
    path.join(root, "scripts", "build-with-isolated-db.mjs"),
    path.join(root, "apps", "augnes_apps", "src", "server.ts"),
  ];
  const sourceDirectoryCandidates = [
    path.join(root, "apps"),
    path.join(root, "apps", "augnes_apps"),
    path.join(root, "apps", "augnes_apps", "src"),
  ];
  const createdSourceDirectories = sourceDirectoryCandidates.filter(
    (directory) => !existsSync(directory),
  );
  forgedSourceMarkers.forEach((markerPath) => {
    assert.equal(existsSync(markerPath), false, markerPath);
    mkdirSync(path.dirname(markerPath), { recursive: true, mode: 0o700 });
    writeFileSync(markerPath, "// forged source checkout marker\n", {
      mode: 0o600,
    });
  });
  try {
    writeFileSync(serverPath, Buffer.concat([original, Buffer.from("\n// tampered\n")]));
    const result = await runCapturedProcess({
      command: process.execPath,
      args: [path.join(root, "scripts", "augnes-runtime-supervisor.mjs"), "start"],
      cwd: root,
      environment,
      label: "direct packaged supervisor preflight",
      timeoutMs: 30_000,
    });
    assert.equal(result.code, 2, result.output);
    assertLauncherPreflightFailureEvent(
      lastJsonLine(result.stdout),
      "package_integrity_failed",
    );
    assertLauncherPreflightRecoveryCard(
      result.stderr,
      "package_integrity_failed",
    );

    writeFileSync(serverPath, original);
    if (process.platform !== "win32") chmodSync(serverPath, originalMode);
    writeFileSync(
      validatorBundlePath,
      Buffer.concat([
        originalValidatorBundle,
        Buffer.from("\n// tampered validator\n"),
      ]),
    );
    const validatorTamper = await runCapturedProcess({
      command: process.execPath,
      args: [path.join(root, "scripts", "augnes-runtime-supervisor.mjs"), "start"],
      cwd: root,
      environment,
      label: "direct packaged recovery validator preflight",
      timeoutMs: 30_000,
    });
    assert.equal(validatorTamper.code, 2, validatorTamper.output);
    assertLauncherPreflightFailureEvent(
      lastJsonLine(validatorTamper.stdout),
      "package_integrity_failed",
    );
    assertLauncherPreflightRecoveryCard(
      validatorTamper.stderr,
      "package_integrity_failed",
    );

    writeFileSync(validatorBundlePath, originalValidatorBundle);
    if (process.platform !== "win32") {
      chmodSync(validatorBundlePath, originalValidatorBundleMode);
    }
    renameSync(manifestPath, manifestBackupPath);
    const missingManifest = await runCapturedProcess({
      command: process.execPath,
      args: [path.join(root, "scripts", "augnes-runtime-supervisor.mjs"), "start"],
      cwd: root,
      environment,
      label: "direct packaged supervisor missing manifest",
      timeoutMs: 30_000,
    });
    assert.equal(missingManifest.code, 2, missingManifest.output);
    assertLauncherPreflightFailureEvent(
      lastJsonLine(missingManifest.stdout),
      "package_manifest_invalid",
    );
    assertLauncherPreflightRecoveryCard(
      missingManifest.stderr,
      "package_manifest_invalid",
    );
    await assertFailureScenarioClean(scenario, environment);
    assert.equal(existsSync(scenario.databasePath), false);
    assert.equal(existsSync(scenario.runtimeStateRoot), false);
  } finally {
    if (existsSync(manifestBackupPath)) {
      renameSync(manifestBackupPath, manifestPath);
    }
    writeFileSync(serverPath, original);
    if (process.platform !== "win32") chmodSync(serverPath, originalMode);
    writeFileSync(validatorBundlePath, originalValidatorBundle);
    if (process.platform !== "win32") {
      chmodSync(validatorBundlePath, originalValidatorBundleMode);
    }
    forgedSourceMarkers.forEach((markerPath) => {
      if (existsSync(markerPath)) unlinkSync(markerPath);
    });
    createdSourceDirectories.reverse().forEach((directory) => {
      if (existsSync(directory)) rmdirSync(directory);
    });
    removeRuntimeScenario(scenario);
  }
}

async function assertPostPreflightSupervisorReplacementRefused(
  root,
  manifest,
) {
  const launcherUrl = `${pathToFileURL(
    path.join(root, "scripts", "distributable-package-launcher.mjs"),
  ).href}?supervisor-race=${Date.now()}`;
  const launcher = await import(launcherUrl);
  const preflight = launcher.preflightDistributablePackage({
    packageRoot: root,
  });
  const bundlePath = path.join(
    root,
    ...DISTRIBUTABLE_SUPERVISOR_BUNDLE_FILE.split("/"),
  );
  const heldPath = path.join(testRoot, "held-verified-supervisor.bundle.cjs");
  const expected = manifest.files.find(
    (entry) => entry.path === DISTRIBUTABLE_SUPERVISOR_BUNDLE_FILE,
  );
  assert(expected);
  const attackMarker = "__augnesSupervisorReplacementAttackExecuted";
  const attackPrefix = Buffer.from(
    `globalThis.${attackMarker}=true;module.exports={runRuntimeSupervisorCli:async()=>0};`,
  );
  assert(attackPrefix.length < expected.size);
  const replacement = Buffer.alloc(expected.size, 0x20);
  attackPrefix.copy(replacement);
  renameSync(bundlePath, heldPath);
  try {
    writeFileSync(bundlePath, replacement, { mode: expected.mode });
    if (process.platform !== "win32") chmodSync(bundlePath, expected.mode);
    assert.throws(
      () => launcher.loadVerifiedDistributableSupervisor(preflight),
      (error) => error?.code === "package_integrity_failed",
    );
    assert.equal(globalThis[attackMarker], undefined);
  } finally {
    if (existsSync(bundlePath)) unlinkSync(bundlePath);
    renameSync(heldPath, bundlePath);
    if (process.platform !== "win32") chmodSync(bundlePath, expected.mode);
    delete globalThis[attackMarker];
  }

  const nativeRelativePath =
    "node_modules/better-sqlite3/build/Release/better_sqlite3.node";
  const nativePath = path.join(root, ...nativeRelativePath.split("/"));
  const heldNativePath = path.join(testRoot, "held-verified-better-sqlite3.node");
  const expectedNative = manifest.files.find(
    (entry) => entry.path === nativeRelativePath,
  );
  assert(expectedNative);
  const nativeRootsBefore = listNativePreflightRoots();
  renameSync(nativePath, heldNativePath);
  try {
    writeFileSync(nativePath, Buffer.alloc(expectedNative.size, 0x41), {
      mode: expectedNative.mode,
    });
    if (process.platform !== "win32") chmodSync(nativePath, expectedNative.mode);
    assert.throws(
      () =>
        launcher.loadVerifiedDistributableNativeAddon(
          root,
          preflight.manifest,
        ),
      (error) => error?.code === "package_native_dependency_invalid",
    );
  } finally {
    if (existsSync(nativePath)) unlinkSync(nativePath);
    renameSync(heldNativePath, nativePath);
    if (process.platform !== "win32") chmodSync(nativePath, expectedNative.mode);
  }
  assert.deepEqual(listNativePreflightRoots(), nativeRootsBefore);

  const schemaRelativePath = "lib/db/schema.sql";
  const schemaPath = path.join(root, ...schemaRelativePath.split("/"));
  const heldSchemaPath = path.join(testRoot, "held-verified-schema.sql");
  const expectedSchema = manifest.files.find(
    (entry) => entry.path === schemaRelativePath,
  );
  assert(expectedSchema);
  const maliciousSchema = Buffer.alloc(expectedSchema.size, 0x20);
  Buffer.from(
    "CREATE TABLE augnes_unverified_replacement(value TEXT);\n",
  ).copy(maliciousSchema);
  renameSync(schemaPath, heldSchemaPath);
  try {
    writeFileSync(schemaPath, maliciousSchema, { mode: expectedSchema.mode });
    if (process.platform !== "win32") chmodSync(schemaPath, expectedSchema.mode);
    const loaded = launcher.loadVerifiedDistributableSupervisor(preflight);
    assert.equal(typeof loaded.runRuntimeSupervisorCli, "function");
    assert.equal(
      loaded.verifyRuntimeBundledSchemaContract(
        manifest.database.schema_signature,
      ),
      manifest.database.schema_signature,
    );
  } finally {
    if (existsSync(schemaPath)) unlinkSync(schemaPath);
    renameSync(heldSchemaPath, schemaPath);
    if (process.platform !== "win32") chmodSync(schemaPath, expectedSchema.mode);
  }
  const verifiedAgain = launcher.preflightDistributablePackage({
    packageRoot: root,
  });
  assert.equal(
    verifiedAgain.manifest.build_identity,
    manifest.build_identity,
  );
}

function listNativePreflightRoots() {
  return readdirSync(tmpdir())
    .filter((name) => name.startsWith("augnes-native-preflight-"))
    .sort();
}

async function assertInvalidCanonicalImportRefusesBeforeDurableMutation(root) {
  const scenario = createRuntimeScenario("invalid-canonical-import");
  const environment = runtimeEnvironment(scenario, {
    uiPort: await availablePreferredPort(),
    bridgePort: await availablePreferredPort(),
    extra: {
      AUGNES_CANONICAL_TEST_NODE_IMPORT: path.join(
        scenario.root,
        "missing-preload.mjs",
      ),
    },
  });
  const managed = startPackagedRuntime(
    root,
    environment,
    "invalid canonical import preflight",
  );
  const exit = await waitForManagedProcess(managed, PROCESS_EXIT_TIMEOUT_MS);
  assert.equal(exit.code, 2, managed.output());
  assert.equal(
    lastJsonLine(managed.output()).reason,
    "canonical_test_node_import_invalid",
  );
  assert.equal(existsSync(scenario.databasePath), false);
  assert.equal(existsSync(scenario.runtimeStateRoot), false);
  removeRuntimeScenario(scenario);
}

async function assertPlatformRefusalBeforeDurableMutation(root, manifest) {
  const durableRoot = path.join(testRoot, "platform-refusal-durable");
  assert.equal(existsSync(durableRoot), false);
  const launcherUrl = `${pathToFileURL(
    path.join(root, "scripts", "distributable-package-launcher.mjs"),
  ).href}?preflight=${Date.now()}`;
  const launcher = await import(launcherUrl);
  assert.equal(typeof launcher.preflightDistributablePackage, "function");
  assert.equal(typeof launcher.runDistributableLauncher, "function");
  for (const refusalCase of [
    {
      platform: {
        os: manifest.platform.os === "linux" ? "darwin" : "linux",
        arch: manifest.platform.arch,
        libc: manifest.platform.libc,
      },
      runtime: {
        nodeVersion: process.versions.node,
        nodeModulesAbi: process.versions.modules,
        nodeNapi: process.versions.napi,
      },
      expectedReason: "package_platform_unsupported",
    },
    {
      platform: manifest.platform,
      runtime: {
        nodeVersion: process.versions.node,
        nodeModulesAbi: `${process.versions.modules}0`,
        nodeNapi: process.versions.napi,
      },
      expectedReason: "package_node_modules_abi_unsupported",
    },
  ]) {
    const output = [];
    const display = [];
    const code = await launcher.runDistributableLauncher([], {
      packageRoot: root,
      platform: refusalCase.platform,
      runtime: refusalCase.runtime,
      validateNativeDependency: false,
      output: (value) => output.push(value),
      display: (value) => display.push(value),
      importSupervisor: async () => {
        mkdirSync(durableRoot, { recursive: true });
        throw new Error("supervisor import must be unreachable after refusal");
      },
    });
    assert.equal(code, 2);
    assert.equal(output.length, 1);
    const refusal = JSON.parse(output[0]);
    assertLauncherPreflightFailureEvent(
      refusal,
      refusalCase.expectedReason,
    );
    assert.deepEqual(display, [
      launcherPreflightRecoveryCard(refusalCase.expectedReason),
    ]);
    assert.equal(existsSync(durableRoot), false);
  }

  const stopOutput = [];
  const stopDisplay = [];
  const stopCode = await launcher.runDistributableLauncher(["stop"], {
    packageRoot: root,
    platform: {
      os: manifest.platform.os === "linux" ? "darwin" : "linux",
      arch: manifest.platform.arch,
      libc: manifest.platform.libc,
    },
    runtime: {
      nodeVersion: process.versions.node,
      nodeModulesAbi: process.versions.modules,
      nodeNapi: process.versions.napi,
    },
    validateNativeDependency: false,
    output: (value) => stopOutput.push(value),
    display: (value) => stopDisplay.push(value),
  });
  assert.equal(stopCode, 2);
  assert.equal(stopOutput.length, 1);
  assertLauncherPreflightFailureEvent(
    JSON.parse(stopOutput[0]),
    "package_platform_unsupported",
    {
      command: "stop",
      nextAction:
        "use_previous_verified_compatible_package_to_stop_runtime",
    },
  );
  assert.deepEqual(stopDisplay, []);
}

async function testFreshAndCurrentPackagedRuntime(root, manifest) {
  const scenario = createRuntimeScenario("fresh-current");
  const blockers = await createSeparatedPortBlockers();
  try {
    const environment = runtimeEnvironment(scenario, {
      uiPort: blockers.ui.port,
      bridgePort: blockers.bridge.port,
    });
    const managed = startPackagedRuntime(root, environment, "packaged fresh start");
    const ready = await waitForJsonEvent(
      managed,
      (event) => event.command === "start" && event.result === "ready",
    );
    rememberRuntimeOwnership(ready);
    assert.equal(ready.database_state, "created");
    assertDistributionMetadata(ready, manifest);
    assert.notEqual(ready.ui_port, blockers.ui.port);
    assert.notEqual(ready.bridge_port, blockers.bridge.port);
    assert.equal(await canConnect(blockers.ui.port), true);
    assert.equal(await canConnect(blockers.bridge.port), true);
    assertFreshDatabaseHasNoDemoSeed(scenario.databasePath);
    assert.equal(
      inspectRuntimePackageIdentityGuard(scenario.databasePath).identity_state,
      "package_identity_required",
    );
    const freshLocalPaths = packagedLocalPaths(root, manifest, environment);
    assert.equal(
      listRecoveryBackups({
        backupDirectory: freshLocalPaths.backup_directory,
        applicationScopeFingerprint: manifest.application_scope_fingerprint,
        inspectDatabase: inspectRecoveryDatabaseFile,
      }).verified.length,
      0,
      "a fresh database has no prior durable state to back up",
    );

    const uiHealth = await fetchJson(`${ready.effective_url}/api/healthz`);
    assert.equal(uiHealth.status, 200);
    assert.equal(uiHealth.body.ok, true);
    assert.equal(uiHealth.body.runtime_instance_id, ready.instance_id);
    assertDistributionMetadata(uiHealth.body, manifest);
    const bridgeHealth = await fetchJson(`http://127.0.0.1:${ready.bridge_port}/healthz`);
    assert.equal(bridgeHealth.status, 200);
    assert.equal(bridgeHealth.body.ok, true);
    assert.equal(bridgeHealth.body.mode, "mock");
    assert.equal(bridgeHealth.body.runtime_instance_id, ready.instance_id);
    assertDistributionMetadata(bridgeHealth.body, manifest);

    const diagnostics = await runPackagedCli(
      root,
      ["diagnostics"],
      environment,
      "packaged diagnostics",
    );
    assert.equal(diagnostics.code, 0, diagnostics.output);
    const diagnosticResult = lastJsonLine(diagnostics.output);
    assertDistributionMetadata(diagnosticResult, manifest);
    assert.equal(diagnosticResult.database?.schema_compatibility ?? diagnosticResult.database_schema_compatibility, "current");
    assert.equal(diagnostics.output.includes(scenario.privateSentinel), false);
    assert.equal(diagnostics.output.includes(scenario.projectExecutionSentinel), false);

    const duplicate = await runPackagedCli(
      root,
      [],
      environment,
      "duplicate packaged launch",
    );
    assert.equal(duplicate.code, 0, duplicate.output);
    const duplicateResult = lastJsonLine(duplicate.output);
    assert.equal(duplicateResult.result, "existing");
    assert.equal(duplicateResult.instance_id, ready.instance_id);
    assert.equal(managed.child.exitCode, null);

    await onboardDisposableProject(ready.effective_url, scenario);
    const projectHome = await fetchText(`${ready.effective_url}/`);
    assert.equal(projectHome.status, 200);
    assert.match(projectHome.body, /Project Home|Choose a project/);
    assert.match(projectHome.body, /No local OpenAI credential is configured/);
    assert.match(projectHome.body, /No trusted local Codex or native-host readiness status is available/);
    const workbench = await fetchText(`${ready.effective_url}/workbench/semantic-review`);
    assert.equal(workbench.status, 200);
    assert.match(workbench.body, /Semantic Workbench|Semantic Review Workbench/);
    const inspector = await fetchText(`${ready.effective_url}/workbench/inspector`);
    assert.equal(inspector.status, 200);
    assert.match(inspector.body, /Shared Inspector|Private Inspector locked/);
    assert.equal(existsSync(scenario.projectExecutionSentinel), false);

    const stop = await runPackagedCli(root, ["stop"], environment, "stop fresh package");
    assert.equal(stop.code, 0, stop.output);
    assert.equal(lastJsonLine(stop.output).state, "stopped");
    const exit = await waitForManagedProcess(managed, PROCESS_EXIT_TIMEOUT_MS);
    assert.equal(exit.code, 0, managed.output());
    await assertRuntimeStopped(scenario, ready);
  } finally {
    await closePortBlocker(blockers.ui);
    await closePortBlocker(blockers.bridge);
  }

  const restartEnvironment = runtimeEnvironment(scenario, {
    uiPort: await availablePreferredPort(),
    bridgePort: await availablePreferredPort(),
  });
  const restarted = startPackagedRuntime(root, restartEnvironment, "packaged current restart");
  const current = await waitForJsonEvent(
    restarted,
    (event) => event.command === "start" && event.result === "ready",
  );
  rememberRuntimeOwnership(current);
  assert.equal(current.database_state, "current");
  assertDistributionMetadata(current, manifest);
  const homeAfterRestart = await fetchText(`${current.effective_url}/`);
  assert.equal(homeAfterRestart.status, 200);
  assert.match(homeAfterRestart.body, /Project Home/);
  const currentLocalPaths = packagedLocalPaths(
    root,
    manifest,
    restartEnvironment,
  );
  const authorityBeforeManualBackup = readAuthorityCounts(
    scenario.databasePath,
  );
  const healthyRecoveryStatus = await fetchJson(
    `${current.effective_url}/api/recovery`,
  );
  assert.equal(healthyRecoveryStatus.status, 200);
  assert.equal(healthyRecoveryStatus.body.recovery_mode, false);
  assert.equal(healthyRecoveryStatus.body.actions.create_backup, true);
  const manualBackup = await postRecoveryAction(
    current.effective_url,
    { action: "create_backup" },
    current.effective_url,
  );
  assert.equal(manualBackup.status, 201);
  assert.equal(manualBackup.body.accepted, true);
  assert.equal(manualBackup.body.outcome, "backup_created");
  const manualInventory = listRecoveryBackups({
    backupDirectory: currentLocalPaths.backup_directory,
    applicationScopeFingerprint: manifest.application_scope_fingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
  });
  assert.equal(manualInventory.verified.length, 1);
  assert.equal(manualInventory.verified[0].manifest.reason, "manual_recovery");
  assert.deepEqual(
    readAuthorityCounts(scenario.databasePath),
    authorityBeforeManualBackup,
  );
  const statusAfterManualBackup = await fetchJson(
    `${current.effective_url}/api/recovery`,
  );
  assert.equal(statusAfterManualBackup.status, 200);
  assert.equal(
    statusAfterManualBackup.body.latest_operation.outcome,
    "recovery_backup_created",
  );
  assert.equal(statusAfterManualBackup.body.backup_count, 1);
  const stop = await runPackagedCli(
    root,
    ["stop"],
    restartEnvironment,
    "stop current package",
  );
  assert.equal(stop.code, 0, stop.output);
  const exit = await waitForManagedProcess(restarted, PROCESS_EXIT_TIMEOUT_MS);
  assert.equal(exit.code, 0, restarted.output());
  await assertRuntimeStopped(scenario, current);

  const stoppedDatabaseBeforeDowngrade = readFileSync(scenario.databasePath);
  const localPaths = packagedLocalPaths(root, manifest, restartEnvironment);
  const operationPath = path.join(
    localPaths.backup_directory,
    RECOVERY_OPERATION_FILE,
  );
  const validOperationState = readFileSync(operationPath);
  const databaseBeforeSidecarFailures = readFileSync(scenario.databasePath);

  const malformedOperationState = Buffer.from("{malformed-recovery-state\n");
  writeFileSync(operationPath, malformedOperationState, { mode: 0o600 });
  const malformedManaged = startPackagedRuntime(
    root,
    restartEnvironment,
    "malformed recovery sidecar bounded entry",
  );
  const malformedRecovery = await waitForJsonEvent(
    malformedManaged,
    (event) =>
      event.command === "start" &&
      event.result === "recovery_available" &&
      event.reason === "recovery_result_unavailable",
  );
  rememberRuntimeOwnership(malformedRecovery);
  const malformedOrigin = new URL(malformedRecovery.effective_url).origin;
  const malformedStatus = await fetchJson(
    `${malformedOrigin}/api/recovery`,
  );
  assert.equal(malformedStatus.status, 200);
  assert.equal(malformedStatus.body.actions.retry_update, false);
  assert.equal(malformedStatus.body.actions.restore_backup, false);
  const malformedRetry = await postRecoveryAction(
    malformedOrigin,
    { action: "retry_update" },
    malformedOrigin,
  );
  assert.equal(malformedRetry.status, 409);
  assert.equal(malformedRetry.body.reason_code, "recovery_action_unavailable");
  assert.deepEqual(readFileSync(operationPath), malformedOperationState);
  assert.deepEqual(
    readFileSync(scenario.databasePath),
    databaseBeforeSidecarFailures,
  );
  const stopMalformed = await runPackagedCli(
    root,
    ["stop"],
    restartEnvironment,
    "stop malformed recovery sidecar entry",
  );
  assert.equal(stopMalformed.code, 0, stopMalformed.output);
  const malformedExit = await waitForManagedProcess(
    malformedManaged,
    PROCESS_EXIT_TIMEOUT_MS,
  );
  assert.equal(malformedExit.code, 0, malformedManaged.output());
  await assertFailureScenarioClean(scenario, restartEnvironment);
  writeFileSync(operationPath, validOperationState, { mode: 0o600 });

  unlinkSync(operationPath);
  const missingIdentityManaged = startPackagedRuntime(
    root,
    restartEnvironment,
    "missing installed package identity bounded entry",
  );
  const missingIdentityRecovery = await waitForJsonEvent(
    missingIdentityManaged,
    (event) =>
      event.command === "start" &&
      event.result === "recovery_available" &&
      event.reason === "installed_package_identity_missing",
  );
  rememberRuntimeOwnership(missingIdentityRecovery);
  const missingIdentityOrigin = new URL(
    missingIdentityRecovery.effective_url,
  ).origin;
  const missingIdentityStatus = await fetchJson(
    `${missingIdentityOrigin}/api/recovery`,
  );
  assert.equal(missingIdentityStatus.status, 200);
  assert.equal(missingIdentityStatus.body.actions.retry_update, false);
  assert.equal(missingIdentityStatus.body.actions.restore_backup, false);
  const missingIdentityRetry = await postRecoveryAction(
    missingIdentityOrigin,
    { action: "retry_update" },
    missingIdentityOrigin,
  );
  assert.equal(missingIdentityRetry.status, 409);
  assert.equal(
    missingIdentityRetry.body.reason_code,
    "recovery_action_unavailable",
  );
  assert.equal(
    inspectRuntimePackageIdentityGuard(scenario.databasePath).identity_state,
    "package_identity_required",
  );
  assert.deepEqual(
    readFileSync(scenario.databasePath),
    databaseBeforeSidecarFailures,
  );
  const stopMissingIdentity = await runPackagedCli(
    root,
    ["stop"],
    restartEnvironment,
    "stop missing installed identity entry",
  );
  assert.equal(stopMissingIdentity.code, 0, stopMissingIdentity.output);
  const missingIdentityExit = await waitForManagedProcess(
    missingIdentityManaged,
    PROCESS_EXIT_TIMEOUT_MS,
  );
  assert.equal(missingIdentityExit.code, 0, missingIdentityManaged.output());
  await assertFailureScenarioClean(scenario, restartEnvironment);
  writeFileSync(operationPath, validOperationState, { mode: 0o600 });

  const recoveryBeforeDowngrade = readRecoveryOperationResults(
    localPaths.backup_directory,
  );
  const downgradePackageRoot = path.join(
    testRoot,
    "stopped-runtime-downgrade-package",
  );
  cpSync(root, downgradePackageRoot, {
    recursive: true,
    force: false,
    errorOnExist: true,
    preserveTimestamps: true,
  });
  const downgradeManifest = createDistributableManifest({
    applicationVersion: "0.0.1",
    platform: manifest.platform,
    runtime: manifest.runtime,
    database: manifest.database,
    files: manifest.files,
  });
  writeFileSync(
    path.join(downgradePackageRoot, "augnes-package.json"),
    `${JSON.stringify(downgradeManifest, null, 2)}\n`,
    { mode: 0o600 },
  );
  applyRestrictiveExtractionModes(downgradePackageRoot, downgradeManifest);
  const stoppedDowngrade = startPackagedRuntime(
    downgradePackageRoot,
    restartEnvironment,
    "stopped packaged runtime downgrade refusal",
  );
  const downgradeRecovery = await waitForJsonEvent(
    stoppedDowngrade,
    (event) =>
      event.command === "start" &&
      event.result === "recovery_available" &&
      event.reason === "unsupported_downgrade",
  );
  rememberRuntimeOwnership(downgradeRecovery);
  assert.match(downgradeRecovery.effective_url, /\/recovery$/u);
  const downgradeRecoveryPage = await fetchText(
    downgradeRecovery.effective_url,
  );
  assert.equal(downgradeRecoveryPage.status, 200);
  assert.match(
    downgradeRecoveryPage.body,
    /data-recovery-product-surface="v0\.1"/u,
  );
  const stoppedDowngradeState = readRecoveryOperationResults(
    localPaths.backup_directory,
  );
  assert.equal(
    stoppedDowngradeState.installed_package?.build_identity,
    recoveryBeforeDowngrade.installed_package?.build_identity,
  );
  assert.equal(stoppedDowngradeState.pending_package, null);
  assert.deepEqual(
    readFileSync(scenario.databasePath),
    stoppedDatabaseBeforeDowngrade,
    "a stopped-runtime downgrade must not mutate the authoritative database",
  );
  const stopDowngradeRecovery = await runPackagedCli(
    downgradePackageRoot,
    ["stop"],
    restartEnvironment,
    "stop downgrade recovery entry",
  );
  assert.equal(stopDowngradeRecovery.code, 0, stopDowngradeRecovery.output);
  const downgradeExit = await waitForManagedProcess(
    stoppedDowngrade,
    PROCESS_EXIT_TIMEOUT_MS,
  );
  assert.equal(downgradeExit.code, 0, stoppedDowngrade.output());
  await assertFailureScenarioClean(scenario, restartEnvironment);
  removeRuntimeScenario(scenario);
}

async function testLegacyPackageIdentityAdoption(root, manifest) {
  const scenario = createRuntimeScenario("legacy-package-identity-adoption");
  const markerId = "agent:legacy-package-identity-adoption";
  mkdirSync(path.dirname(scenario.databasePath), {
    recursive: true,
    mode: 0o700,
  });
  const writer = new Database(scenario.databasePath);
  let walReader = null;
  try {
    writer.pragma("foreign_keys = ON");
    writer.exec(readFileSync(path.join(root, "lib", "db", "schema.sql"), "utf8"));
    writer.exec(
      "DROP TABLE augnes_schema_migrations;" +
        "DROP TABLE augnes_package_identity_guard;",
    );
    assert.equal(
      inspectRecoveryDatabaseFile(scenario.databasePath).schema_classification,
      "old",
    );
    assert.equal(writer.pragma("journal_mode = WAL", { simple: true }), "wal");
    writer.pragma("wal_autocheckpoint = 0");
    writer
      .prepare(
        "INSERT INTO agents (id, name, kind, created_at) VALUES (?, ?, ?, ?)",
      )
      .run(
        markerId,
        "Legacy package adoption marker",
        "runtime",
        "2026-07-20T00:00:00.000Z",
      );
    walReader = new Database(scenario.databasePath, {
      readonly: true,
      fileMustExist: true,
    });
    walReader.exec("BEGIN");
    assert.equal(
      walReader
        .prepare("SELECT COUNT(*) AS count FROM agents WHERE id = ?")
        .get(markerId).count,
      1,
    );
  } finally {
    writer.close();
  }
  if (process.platform !== "win32") {
    assert.equal(existsSync(`${scenario.databasePath}-wal`), true);
  }

  const environment = runtimeEnvironment(scenario, {
    uiPort: await availablePreferredPort(),
    bridgePort: await availablePreferredPort(),
  });
  const localPaths = packagedLocalPaths(root, manifest, environment);
  const managed = startPackagedRuntime(
    root,
    environment,
    "legacy package identity adoption",
  );
  let ready;
  try {
    ready = await waitForJsonEvent(
      managed,
      (event) => event.command === "start" && event.result === "ready",
    );
  } finally {
    if (walReader) {
      if (walReader.inTransaction) walReader.exec("ROLLBACK");
      walReader.close();
    }
  }
  rememberRuntimeOwnership(ready);
  assert.equal(ready.database_state, "migrated");
  assert.equal(ready.recovery_backup_created, true);
  assert.equal(readAgentMarker(scenario.databasePath, markerId), true);
  assert.equal(
    inspectRuntimePackageIdentityGuard(scenario.databasePath).identity_state,
    "package_identity_required",
  );
  let inventory = listRecoveryBackups({
    backupDirectory: localPaths.backup_directory,
    applicationScopeFingerprint: manifest.application_scope_fingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
  });
  assert.equal(inventory.rejected.length, 0);
  assert.equal(inventory.verified.length, 1);
  assert.equal(inventory.verified[0].manifest.reason, "pre_update");
  assert.equal(readAgentMarker(inventory.verified[0].payloadPath, markerId), true);
  const installed = readRecoveryOperationResults(localPaths.backup_directory);
  assert.equal(installed.pending_package, null);
  assert.equal(installed.installed_package?.build_identity, manifest.build_identity);

  const stop = await runPackagedCli(
    root,
    ["stop"],
    environment,
    "stop legacy package identity adoption",
  );
  assert.equal(stop.code, 0, stop.output);
  const exit = await waitForManagedProcess(managed, PROCESS_EXIT_TIMEOUT_MS);
  assert.equal(exit.code, 0, managed.output());
  await assertRuntimeStopped(scenario, ready);

  const replayEnvironment = runtimeEnvironment(scenario, {
    uiPort: await availablePreferredPort(),
    bridgePort: await availablePreferredPort(),
  });
  const replay = startPackagedRuntime(
    root,
    replayEnvironment,
    "replay adopted package identity",
  );
  const replayReady = await waitForJsonEvent(
    replay,
    (event) => event.command === "start" && event.result === "ready",
  );
  rememberRuntimeOwnership(replayReady);
  assert.equal(replayReady.database_state, "current");
  assert.equal(replayReady.recovery_backup_created, false);
  inventory = listRecoveryBackups({
    backupDirectory: localPaths.backup_directory,
    applicationScopeFingerprint: manifest.application_scope_fingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
  });
  assert.equal(
    inventory.verified.length,
    1,
    "successful adoption replay must not create another backup",
  );
  const replayStop = await runPackagedCli(
    root,
    ["stop"],
    replayEnvironment,
    "stop replayed package identity adoption",
  );
  assert.equal(replayStop.code, 0, replayStop.output);
  const replayExit = await waitForManagedProcess(replay, PROCESS_EXIT_TIMEOUT_MS);
  assert.equal(replayExit.code, 0, replay.output());
  await assertRuntimeStopped(scenario, replayReady);
  assertNoRecoveryResidue(localPaths.backup_directory);
  removeRuntimeScenario(scenario);
}

async function testCompatibleDifferentBuildHandoff(root, manifest) {
  const scenario = createRuntimeScenario("compatible-build-handoff");
  const oldPackageRoot = path.join(testRoot, "compatible-old-package");
  cpSync(root, oldPackageRoot, {
    recursive: true,
    force: false,
    errorOnExist: true,
    preserveTimestamps: true,
  });
  const oldManifest = createDistributableManifest({
    applicationVersion: "0.1.0",
    platform: manifest.platform,
    runtime: manifest.runtime,
    database: manifest.database,
    files: manifest.files,
  });
  writeFileSync(
    path.join(oldPackageRoot, "augnes-package.json"),
    `${JSON.stringify(oldManifest, null, 2)}\n`,
    { mode: 0o600 },
  );
  applyRestrictiveExtractionModes(oldPackageRoot, oldManifest);

  const environment = runtimeEnvironment(scenario, {
    uiPort: await availablePreferredPort(),
    bridgePort: await availablePreferredPort(),
  });
  const oldManaged = startPackagedRuntime(
    oldPackageRoot,
    environment,
    "compatible old packaged runtime",
  );
  const oldReady = await waitForJsonEvent(
    oldManaged,
    (event) => event.command === "start" && event.result === "ready",
  );
  rememberRuntimeOwnership(oldReady);
  assert.equal(oldReady.application_version, "0.1.0");
  assert.equal(oldReady.database_state, "created");

  const targetManaged = startPackagedRuntime(
    root,
    environment,
    "compatible target packaged update",
  );
  const targetReady = await waitForJsonEvent(
    targetManaged,
    (event) =>
      event.command === "start" &&
      event.result === "ready" &&
      event.instance_id !== oldReady.instance_id,
  );
  rememberRuntimeOwnership(targetReady);
  assertDistributionMetadata(targetReady, manifest);
  assert.equal(targetReady.database_state, "current");
  const oldExit = await waitForManagedProcess(
    oldManaged,
    PROCESS_EXIT_TIMEOUT_MS,
  );
  assert.equal(oldExit.code, 0, oldManaged.output());

  const localPaths = packagedLocalPaths(root, manifest, environment);
  const inventory = listRecoveryBackups({
    backupDirectory: localPaths.backup_directory,
    applicationScopeFingerprint: manifest.application_scope_fingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
  });
  assert.equal(
    inventory.verified.length,
    0,
    "a compatible build handoff over a current database must not create a backup",
  );
  const operations = readRecoveryOperationResults(localPaths.backup_directory);
  assert.equal(operations.events[0]?.outcome, "updated");
  assert.equal(operations.events[0]?.backup_verified, false);

  const duplicate = await runPackagedCli(
    root,
    [],
    environment,
    "same target build replay",
  );
  assert.equal(duplicate.code, 0, duplicate.output);
  assert.equal(lastJsonLine(duplicate.output).result, "existing");
  assert.equal(
    listRecoveryBackups({
      backupDirectory: localPaths.backup_directory,
      applicationScopeFingerprint: manifest.application_scope_fingerprint,
      inspectDatabase: inspectRecoveryDatabaseFile,
    }).verified.length,
    0,
  );

  const stop = await runPackagedCli(
    root,
    ["stop"],
    environment,
    "stop compatible target package",
  );
  assert.equal(stop.code, 0, stop.output);
  const targetExit = await waitForManagedProcess(
    targetManaged,
    PROCESS_EXIT_TIMEOUT_MS,
  );
  assert.equal(targetExit.code, 0, targetManaged.output());
  await assertRuntimeStopped(scenario, targetReady);
  assertNoRecoveryResidue(localPaths.backup_directory);
  removeRuntimeScenario(scenario);
}

async function buildMergedR8APackage() {
  const proofRoot = path.join(testRoot, "merged-r8a-package-proof");
  const sourceRoot = path.join(proofRoot, "source");
  const sourceArchive = path.join(proofRoot, "source.tar");
  const outputRoot = path.join(proofRoot, "artifact-output");
  const unpackedRoot = path.join(proofRoot, "unpacked");
  const temporaryRoot = path.join(proofRoot, "build-temp");
  const homeRoot = path.join(proofRoot, "build-home");
  for (const directory of [proofRoot, sourceRoot, temporaryRoot, homeRoot]) {
    mkdirSync(directory, { recursive: true, mode: 0o700 });
  }

  const sourceEnvironment = packageBuildEnvironment({
    temporaryRoot,
    homeRoot,
    outputRoot,
    canonicalRoot: proofRoot,
    networkGuardImport: packageNetworkGuardImport,
  });
  const commit = await runCapturedProcess({
    command: "git",
    args: ["cat-file", "-e", `${MERGED_R8A_COMMIT}^{commit}`],
    cwd: repositoryRoot,
    environment: sourceEnvironment,
    label: "verify merged R8A commit",
    timeoutMs: 30_000,
  });
  assert.equal(
    commit.code,
    0,
    `merged #1118 commit is unavailable locally: ${commit.output}`,
  );
  const tree = await runCapturedProcess({
    command: "git",
    args: ["rev-parse", `${MERGED_R8A_COMMIT}^{tree}`],
    cwd: repositoryRoot,
    environment: sourceEnvironment,
    label: "verify merged R8A tree",
    timeoutMs: 30_000,
  });
  assert.equal(tree.code, 0, tree.output);
  assert.equal(tree.stdout.trim(), MERGED_R8A_TREE);
  const archived = await runCapturedProcess({
    command: "git",
    args: [
      "archive",
      "--format=tar",
      `--output=${sourceArchive}`,
      MERGED_R8A_COMMIT,
    ],
    cwd: repositoryRoot,
    environment: sourceEnvironment,
    label: "archive merged R8A source",
    timeoutMs: 30_000,
  });
  assert.equal(archived.code, 0, archived.output);
  chmodSync(sourceArchive, 0o600);
  const extractedSource = await runCapturedProcess({
    command: "tar",
    args: ["-xf", sourceArchive, "-C", sourceRoot],
    cwd: proofRoot,
    environment: sourceEnvironment,
    label: "extract merged R8A source",
    timeoutMs: 30_000,
  });
  assert.equal(extractedSource.code, 0, extractedSource.output);
  assert.equal(
    JSON.parse(readFileSync(path.join(sourceRoot, "package.json"), "utf8"))
      .version,
    MERGED_R8A_APPLICATION_VERSION,
  );
  assertDependencyLockCompatibility(sourceRoot, repositoryRoot);
  copyIsolatedPackageDependencies(sourceRoot, repositoryRoot);
  const dependencySnapshot = packageDependencySnapshot(sourceRoot);

  const legacyNetworkGuardImport = createChildNetworkGuard(
    proofRoot,
    "package-build-r8a",
  );
  expectedPackageBuildNetworkGuardLabels.add("package-build-r8a");
  const legacyBuildEnvironment = packageBuildEnvironment({
    temporaryRoot,
    homeRoot,
    outputRoot,
    canonicalRoot: proofRoot,
    networkGuardImport: legacyNetworkGuardImport,
  });
  const packageStartedAt = Date.now();
  const packaged = await runCapturedProcess({
    command: process.platform === "win32" ? "npm.cmd" : "npm",
    args: ["run", "package"],
    cwd: sourceRoot,
    environment: legacyBuildEnvironment,
    label: "canonical merged R8A package command",
    timeoutMs: PACKAGE_COMMAND_TIMEOUT_MS,
  });
  durations.merged_r8a_package_command_ms = Date.now() - packageStartedAt;
  assert.equal(packaged.code, 0, packaged.output);
  assert.equal(packaged.output.includes(PRIVATE_BUILD_SENTINEL), false);
  assert.deepEqual(packageDependencySnapshot(sourceRoot), dependencySnapshot);
  assert.deepEqual(
    listBuildTemporaryEntries(temporaryRoot),
    [],
    "the merged R8A package build must remove its owned temporary roots",
  );

  const artifactName =
    `augnes-${MERGED_R8A_APPLICATION_VERSION}-${PACKAGE_PLATFORM_LABEL}.tar.gz`;
  const artifactPath = path.join(outputRoot, artifactName);
  assert.equal(existsSync(artifactPath), true, packaged.output);
  const archiveStartedAt = Date.now();
  await validateAndExtractArchive(artifactPath, unpackedRoot);
  durations.merged_r8a_archive_validation_and_extract_ms =
    Date.now() - archiveStartedAt;
  const root = findPackageRoot(unpackedRoot, artifactPath);
  assertOutsideRepository(root, "merged R8A unpacked package root");
  const manifest = await validateMergedR8APackageContents(root);
  applyRestrictiveExtractionModes(root, manifest);
  return { root, manifest };
}

async function validateMergedR8APackageContents(root) {
  const contractModule = await import(
    `${pathToFileURL(path.join(root, "scripts", "distributable-package-contract.mjs")).href}?merged-r8a=${MERGED_R8A_TREE}`
  );
  const manifest = JSON.parse(
    readFileSync(path.join(root, "augnes-package.json"), "utf8"),
  );
  contractModule.validateDistributableManifest(manifest);
  contractModule.verifyDistributableFileEntries(root, manifest);
  assert.equal(
    contractModule.DISTRIBUTABLE_PACKAGE_CONTRACT_VERSION,
    1,
  );
  assert.equal(manifest.contract, PACKAGE_CONTRACT);
  assert.equal(manifest.package_contract_version, 1);
  assert.equal(manifest.application_version, MERGED_R8A_APPLICATION_VERSION);
  assert.equal(
    manifest.application_scope_fingerprint,
    DISTRIBUTABLE_APPLICATION_SCOPE_FINGERPRINT,
  );
  assert.deepEqual(manifest.platform, PACKAGE_PLATFORM);
  assert.equal(manifest.runtime.node_modules_abi, process.versions.modules);
  assert.equal(manifest.runtime.node_napi, process.versions.napi);
  assert.equal(manifest.runtime.runtime_contract, RUNTIME_CONTRACT);
  assert.equal(manifest.runtime.runtime_schema_version, RUNTIME_SCHEMA_VERSION);
  assert.deepEqual(manifest.database, { schema_compatibility: "current" });
  assert.match(manifest.build_identity, /^sha256:[a-f0-9]{64}$/u);
  for (const required of [
    "augnes",
    "augnes.mjs",
    "server.js",
    "bridge/dist/server.mjs",
    "scripts/distributable-package-launcher.mjs",
    "scripts/runtime-database-bootstrap.mjs",
  ]) {
    assert.equal(
      manifest.files.some((entry) => entry.path === required),
      true,
      `merged R8A package is missing ${required}`,
    );
  }
  return manifest;
}

function assertDependencyLockCompatibility(legacyRoot, currentRoot) {
  for (const relativePath of [
    "package-lock.json",
    path.join("apps", "augnes_apps", "package-lock.json"),
  ]) {
    assert.deepEqual(
      normalizedDependencyLock(path.join(legacyRoot, relativePath)),
      normalizedDependencyLock(path.join(currentRoot, relativePath)),
      `${relativePath} dependency graph changed since merged #1118`,
    );
  }
}

function normalizedDependencyLock(filePath) {
  const lock = JSON.parse(readFileSync(filePath, "utf8"));
  delete lock.version;
  if (lock.packages?.[""]) delete lock.packages[""].version;
  return lock;
}

function copyIsolatedPackageDependencies(legacyRoot, currentRoot) {
  for (const relativePath of [
    "node_modules",
    path.join("apps", "augnes_apps", "node_modules"),
  ]) {
    const source = path.join(currentRoot, relativePath);
    const target = path.join(legacyRoot, relativePath);
    const sourceStats = lstatSync(source, { bigint: true });
    assert.equal(sourceStats.isDirectory(), true);
    assert.equal(sourceStats.isSymbolicLink(), false);
    cpSync(source, target, {
      recursive: true,
      force: false,
      errorOnExist: true,
      preserveTimestamps: true,
      verbatimSymlinks: true,
    });
    const targetStats = lstatSync(target, { bigint: true });
    assert.equal(targetStats.isDirectory(), true);
    assert.equal(targetStats.isSymbolicLink(), false);
    const sentinelPackage =
      relativePath === "node_modules" ? "next" : "esbuild";
    const sourceSentinel = lstatSync(
      path.join(source, sentinelPackage, "package.json"),
      { bigint: true },
    );
    const targetSentinel = lstatSync(
      path.join(target, sentinelPackage, "package.json"),
      { bigint: true },
    );
    assert.notEqual(
      `${sourceSentinel.dev}:${sourceSentinel.ino}`,
      `${targetSentinel.dev}:${targetSentinel.ino}`,
      "merged R8A dependencies must be copied, not shared by inode",
    );
  }
}

function packageDependencySnapshot(root) {
  return Object.fromEntries(
    [
      "node_modules/next/package.json",
      "node_modules/better-sqlite3/package.json",
      "node_modules/better-sqlite3/build/Release/better_sqlite3.node",
      "node_modules/esbuild/package.json",
      "apps/augnes_apps/node_modules/esbuild/package.json",
      "apps/augnes_apps/node_modules/typescript/package.json",
    ].map((relativePath) => [
      relativePath,
      hashFile(path.join(root, ...relativePath.split("/"))),
    ]),
  );
}

async function testV1ContractMigrationHandoff(root, manifest) {
  const legacyPackage = await buildMergedR8APackage();
  const legacyPackageRoot = legacyPackage.root;
  const legacyManifest = legacyPackage.manifest;
  mergedR8ABuildIdentity = legacyManifest.build_identity;
  const scenario = createRuntimeScenario("v1-contract-migration-handoff");
  assert.equal(legacyManifest.application_version, MERGED_R8A_APPLICATION_VERSION);
  assert.equal(legacyManifest.package_contract_version, 1);
  assert.equal(
    legacyManifest.application_scope_fingerprint,
    manifest.application_scope_fingerprint,
  );
  assert.equal(
    legacyManifest.runtime.runtime_contract,
    manifest.runtime.runtime_contract,
  );
  assert.equal(
    legacyManifest.runtime.runtime_schema_version,
    manifest.runtime.runtime_schema_version,
  );

  const environment = runtimeEnvironment(scenario, {
    uiPort: await availablePreferredPort(),
    bridgePort: await availablePreferredPort(),
  });
  const legacyManaged = startPackagedRuntime(
    legacyPackageRoot,
    environment,
    "live package-contract-v1 runtime",
  );
  const legacyReady = await waitForJsonEvent(
    legacyManaged,
    (event) => event.command === "start" && event.result === "ready",
  );
  rememberRuntimeOwnership(legacyReady);
  assert.equal(
    legacyReady.application_version,
    MERGED_R8A_APPLICATION_VERSION,
  );
  assert.equal(legacyReady.build_identity, legacyManifest.build_identity);
  assert.equal(legacyReady.package_contract_version, 1);
  const projectSelection = await onboardDisposableProject(
    legacyReady.effective_url,
    scenario,
  );
  await assertProductReaders(
    legacyReady.effective_url,
    scenario,
    projectSelection,
  );
  const marker = "agent:v1-contract-migration-handoff";
  writeAgentMarker(scenario.databasePath, marker);
  const replayFixture = writePackagedHandoffReplayFixture(
    scenario.databasePath,
    projectSelection.projectId,
  );
  const privateMaterialBeforeUpdate = writeMergedR8APrivateMaterialFixture(
    scenario.databasePath,
    projectSelection.projectId,
  );
  assertMergedR8APrivateMaterialRaw(scenario.databasePath);
  const authorityCountsBeforeUpdate = readAuthorityCounts(
    scenario.databasePath,
  );
  const legacyInspection = inspectRecoverySourceDatabaseFile(
    scenario.databasePath,
  );
  assert.equal(
    legacyInspection.schema_classification,
    "old",
  );
  assert.equal(
    legacyInspection.schema_signature,
    MERGED_R8A_SOURCE_SCHEMA_SIGNATURE,
  );
  assert.deepEqual(legacyInspection.migration_ids, []);
  assert.equal(
    readPackagedHandoffReplayFixture(scenario.databasePath),
    replayFixture,
  );
  const legacyLocalPaths = packagedLocalPaths(
    legacyPackageRoot,
    legacyManifest,
    environment,
  );
  const legacyOperationPath = path.join(
    legacyLocalPaths.backup_directory,
    RECOVERY_OPERATION_FILE,
  );
  assert.equal(
    existsSync(legacyOperationPath),
    false,
    "the actual merged #1118 runtime predates the recovery operation sidecar",
  );

  const targetManaged = startPackagedRuntime(
    root,
    environment,
    "v2 target over live v1 old-schema runtime",
  );
  const targetReady = await waitForJsonEvent(
    targetManaged,
    (event) =>
      event.command === "start" &&
      event.result === "ready" &&
      event.instance_id !== legacyReady.instance_id,
  );
  rememberRuntimeOwnership(targetReady);
  assertDistributionMetadata(targetReady, manifest);
  assert.equal(targetReady.database_state, "migrated");
  assert.equal(targetReady.recovery_backup_created, true);
  assert.equal(readAgentMarker(scenario.databasePath, marker), true);
  assert.equal(
    readPackagedHandoffReplayFixture(scenario.databasePath),
    replayFixture,
  );
  assert.deepEqual(
    readMergedR8APrivateMaterialFixture(scenario.databasePath),
    normalizedMergedR8APrivateMaterialSnapshot(privateMaterialBeforeUpdate),
  );
  assertMergedR8APrivateMaterialNormalized(scenario.databasePath);
  assertNoMergedR8ARawPrivateBytes(scenario.databasePath);
  assert.deepEqual(
    readAuthorityCounts(scenario.databasePath),
    authorityCountsBeforeUpdate,
  );
  await assertProductReaders(
    targetReady.effective_url,
    scenario,
    projectSelection,
  );
  const legacyExit = await waitForManagedProcess(
    legacyManaged,
    PROCESS_EXIT_TIMEOUT_MS,
  );
  assert.equal(legacyExit.code, 0, legacyManaged.output());
  for (const pid of [
    legacyReady.supervisor_pid,
    ...(legacyReady.children ?? []).map((child) => child.pid),
  ]) {
    await waitForProcessGone(pid, 10_000);
  }

  const localPaths = packagedLocalPaths(root, manifest, environment);
  assert.equal(
    localPaths.backup_directory,
    legacyLocalPaths.backup_directory,
    "old and new packages must resolve the same application-owned backup scope",
  );
  const inventory = listRecoveryBackups({
    backupDirectory: localPaths.backup_directory,
    applicationScopeFingerprint: manifest.application_scope_fingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
  });
  assert.equal(inventory.rejected.length, 0);
  assert.equal(inventory.verified.length, 1);
  const updateBackup = inventory.verified[0];
  assert.equal(updateBackup.manifest.reason, "pre_update");
  assert.equal(updateBackup.manifest.portable, false);
  assert.equal(
    updateBackup.manifest.database.schema_classification,
    "old",
  );
  assert.equal(
    updateBackup.manifest.database.schema_signature,
    MERGED_R8A_SOURCE_SCHEMA_SIGNATURE,
  );
  assert.deepEqual(updateBackup.manifest.database.migration_ids, []);
  assert.equal(
    updateBackup.manifest.source_application.application_version,
    MERGED_R8A_APPLICATION_VERSION,
  );
  assert.equal(
    updateBackup.manifest.source_application.build_identity,
    legacyManifest.build_identity,
  );
  assert.equal(
    updateBackup.manifest.source_application.package_contract,
    legacyManifest.contract,
  );
  assert.equal(
    updateBackup.manifest.source_application.package_contract_version,
    1,
  );
  assert.equal(
    updateBackup.manifest.source_application.runtime_contract,
    legacyManifest.runtime.runtime_contract,
  );
  assert.equal(
    updateBackup.manifest.source_application.runtime_schema_version,
    legacyManifest.runtime.runtime_schema_version,
  );
  assert.equal(readAgentMarker(updateBackup.payloadPath, marker), true);
  assert.deepEqual(
    readMergedR8APrivateMaterialFixture(updateBackup.payloadPath),
    normalizedMergedR8APrivateMaterialSnapshot(privateMaterialBeforeUpdate),
  );
  assertMergedR8APrivateMaterialNormalized(updateBackup.payloadPath);
  assertNoMergedR8ARawPrivateBytes(updateBackup.backupPath);
  assert.equal(
    readPackagedHandoffReplayFixture(updateBackup.payloadPath),
    replayFixture,
  );
  assert.deepEqual(
    readAuthorityCounts(updateBackup.payloadPath),
    authorityCountsBeforeUpdate,
  );
  const migratedInspection = inspectRecoveryDatabaseFile(
    scenario.databasePath,
  );
  assert.equal(migratedInspection.schema_classification, "current");
  assert.equal(
    migratedInspection.schema_signature,
    manifest.database.schema_signature,
  );
  assert.deepEqual(
    migratedInspection.migration_ids,
    manifest.database.migration_ids,
  );
  assert.equal(
    inspectRuntimePackageIdentityGuard(scenario.databasePath).identity_state,
    "package_identity_required",
  );
  const packageState = readRecoveryOperationResults(
    localPaths.backup_directory,
  );
  assert.equal(packageState.installed_package?.package_contract_version, 2);
  assert.equal(
    packageState.installed_package?.build_identity,
    manifest.build_identity,
  );
  assert.equal(packageState.events[0]?.outcome, "updated");
  assert.equal(packageState.events[0]?.backup_verified, true);
  const inventoryBeforeReplay = recoveryInventoryIdentitySnapshot(inventory);
  const operationPath = path.join(
    localPaths.backup_directory,
    RECOVERY_OPERATION_FILE,
  );
  const operationBeforeReplay = readFileSync(operationPath);

  const activeReplay = await runPackagedCli(
    root,
    [],
    environment,
    "same merged-r8a target build active replay",
  );
  assert.equal(activeReplay.code, 0, activeReplay.output);
  const activeReplayResult = lastJsonLine(activeReplay.output);
  assert.equal(activeReplayResult.result, "existing");
  assert.equal(activeReplayResult.instance_id, targetReady.instance_id);
  assert.deepEqual(
    recoveryInventoryIdentitySnapshot(
      listRecoveryBackups({
        backupDirectory: localPaths.backup_directory,
        applicationScopeFingerprint: manifest.application_scope_fingerprint,
        inspectDatabase: inspectRecoveryDatabaseFile,
      }),
    ),
    inventoryBeforeReplay,
  );
  assert.deepEqual(readFileSync(operationPath), operationBeforeReplay);

  const stop = await runPackagedCli(
    root,
    ["stop"],
    environment,
    "stop v2 target after v1 migration handoff",
  );
  assert.equal(stop.code, 0, stop.output);
  const targetExit = await waitForManagedProcess(
    targetManaged,
    PROCESS_EXIT_TIMEOUT_MS,
  );
  assert.equal(targetExit.code, 0, targetManaged.output());
  await assertRuntimeStopped(scenario, targetReady);

  const replayEnvironment = runtimeEnvironment(scenario, {
    uiPort: await availablePreferredPort(),
    bridgePort: await availablePreferredPort(),
  });
  const replayManaged = startPackagedRuntime(
    root,
    replayEnvironment,
    "cold replay after actual merged-r8a update",
  );
  const replayReady = await waitForJsonEvent(
    replayManaged,
    (event) => event.command === "start" && event.result === "ready",
  );
  rememberRuntimeOwnership(replayReady);
  assertDistributionMetadata(replayReady, manifest);
  assert.equal(replayReady.database_state, "current");
  assert.equal(replayReady.recovery_backup_created, false);
  assert.equal(readAgentMarker(scenario.databasePath, marker), true);
  assert.equal(
    readPackagedHandoffReplayFixture(scenario.databasePath),
    replayFixture,
  );
  assert.deepEqual(
    readMergedR8APrivateMaterialFixture(scenario.databasePath),
    normalizedMergedR8APrivateMaterialSnapshot(privateMaterialBeforeUpdate),
  );
  assertNoMergedR8ARawPrivateBytes(scenario.databasePath);
  assert.deepEqual(
    readAuthorityCounts(scenario.databasePath),
    authorityCountsBeforeUpdate,
  );
  await assertProductReaders(
    replayReady.effective_url,
    scenario,
    projectSelection,
  );
  assert.deepEqual(
    recoveryInventoryIdentitySnapshot(
      listRecoveryBackups({
        backupDirectory: localPaths.backup_directory,
        applicationScopeFingerprint: manifest.application_scope_fingerprint,
        inspectDatabase: inspectRecoveryDatabaseFile,
      }),
    ),
    inventoryBeforeReplay,
  );
  assert.deepEqual(readFileSync(operationPath), operationBeforeReplay);
  const replayStop = await runPackagedCli(
    root,
    ["stop"],
    replayEnvironment,
    "stop cold replay after actual merged-r8a update",
  );
  assert.equal(replayStop.code, 0, replayStop.output);
  const replayExit = await waitForManagedProcess(
    replayManaged,
    PROCESS_EXIT_TIMEOUT_MS,
  );
  assert.equal(replayExit.code, 0, replayManaged.output());
  await assertRuntimeStopped(scenario, replayReady);
  assertNoRecoveryResidue(localPaths.backup_directory);
  removeRuntimeScenario(scenario);
}

async function testPackagedMigrationAndRestore(root, manifest) {
  const scenario = createRuntimeScenario("packaged-update-restore");
  const environment = runtimeEnvironment(scenario, {
    uiPort: await availablePreferredPort(),
    bridgePort: await availablePreferredPort(),
  });
  const localPaths = packagedLocalPaths(root, manifest, environment);

  const freshManaged = startPackagedRuntime(
    root,
    environment,
    "recovery fixture packaged start",
  );
  const freshReady = await waitForJsonEvent(
    freshManaged,
    (event) => event.command === "start" && event.result === "ready",
  );
  rememberRuntimeOwnership(freshReady);
  const projectSelection = await onboardDisposableProject(
    freshReady.effective_url,
    scenario,
  );
  await assertProductReaders(
    freshReady.effective_url,
    scenario,
    projectSelection,
  );
  const stopFresh = await runPackagedCli(
    root,
    ["stop"],
    environment,
    "stop recovery fixture package",
  );
  assert.equal(stopFresh.code, 0, stopFresh.output);
  const freshExit = await waitForManagedProcess(
    freshManaged,
    PROCESS_EXIT_TIMEOUT_MS,
  );
  assert.equal(freshExit.code, 0, freshManaged.output());
  await assertRuntimeStopped(scenario, freshReady);

  makeSupportedOldSchema(scenario.databasePath);
  unlinkSync(path.join(localPaths.backup_directory, RECOVERY_OPERATION_FILE));
  assert.equal(
    inspectRecoveryDatabaseFile(scenario.databasePath).schema_classification,
    "old",
  );

  const interruptedUpdateEnvironment = runtimeEnvironment(scenario, {
    uiPort: await availablePreferredPort(),
    bridgePort: await availablePreferredPort(),
    extra: { AUGNES_TEST_HOLD_AFTER_DATABASE_PREPARE: "1" },
  });
  const interruptedUpdate = startPackagedRuntime(
    root,
    interruptedUpdateEnvironment,
    "packaged old schema update interrupted before identity commit",
  );
  await waitForJsonEvent(
    interruptedUpdate,
    (event) =>
      event.command === "test" &&
      event.result === "database_prepared_before_package_identity_commit",
  );
  process.kill(interruptedUpdate.child.pid, "SIGKILL");
  const interruptedUpdateExit = await waitForManagedProcess(
    interruptedUpdate,
    PROCESS_EXIT_TIMEOUT_MS,
  );
  assert.notEqual(interruptedUpdateExit.code, 0, interruptedUpdate.output());
  const interruptedPackageState = readRecoveryOperationResults(
    localPaths.backup_directory,
  );
  assert.equal(interruptedPackageState.installed_package, null);
  assert.equal(
    interruptedPackageState.pending_package?.build_identity,
    manifest.build_identity,
  );
  assert.equal(
    JSON.parse(
      readFileSync(bootstrapJournalPath(scenario.databasePath), "utf8"),
    ).phase,
    "restart_verification_pending",
  );
  assert.equal(
    interruptedPackageState.events[0]?.outcome,
    "update_published_restart_pending",
  );
  assert.equal(
    inspectRecoveryDatabaseFile(scenario.databasePath).schema_classification,
    "current",
  );

  const updateManaged = startPackagedRuntime(
    root,
    environment,
    "resume packaged old schema update after identity-commit crash",
  );
  const updated = await waitForJsonEvent(
    updateManaged,
    (event) => event.command === "start" && event.result === "ready",
  );
  rememberRuntimeOwnership(updated);
  assert.equal(updated.database_state, "migrated");
  assert.equal(updated.recovery_backup_created, true);
  assert.equal(
    updateManaged.events.some(
      (event) =>
        event.command === "start" &&
        event.result === "starting" &&
        event.database_state_reconciled === true,
    ),
    true,
  );
  assert.equal(
    inspectRecoveryDatabaseFile(scenario.databasePath).schema_classification,
    "current",
  );
  await assertProductReaders(updated.effective_url, scenario, projectSelection);

  let inventory = listRecoveryBackups({
    backupDirectory: localPaths.backup_directory,
    applicationScopeFingerprint: manifest.application_scope_fingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
  });
  assert.equal(inventory.verified.length, 1);
  const updateBackup = inventory.verified[0];
  assert.equal(updateBackup.manifest.reason, "pre_update");
  assert.equal(updateBackup.manifest.database.schema_classification, "old");
  assert.equal(updateBackup.manifest.database.recovery_eligible, true);
  assert.equal(updateBackup.public.verified, true);
  assert.equal(
    inspectRecoveryDatabaseFile(updateBackup.payloadPath).schema_classification,
    "old",
  );
  const updateOperation = readRecoveryOperationResults(
    localPaths.backup_directory,
  ).events[0];
  assert.equal(updateOperation?.outcome, "updated");
  assert.equal(
    updateOperation?.application_version,
    null,
    "offline old-schema data must not be attributed to the target package",
  );
  assert.equal(
    updateOperation?.target_application_version,
    manifest.application_version,
  );

  const stopUpdated = await runPackagedCli(
    root,
    ["stop"],
    environment,
    "stop migrated package before restore fixture mutation",
  );
  assert.equal(stopUpdated.code, 0, stopUpdated.output);
  const updatedExit = await waitForManagedProcess(
    updateManaged,
    PROCESS_EXIT_TIMEOUT_MS,
  );
  assert.equal(updatedExit.code, 0, updateManaged.output());
  await assertRuntimeStopped(scenario, updated);

  const postUpdateMarker = "agent:packaged-post-update-marker";
  writeAgentMarker(scenario.databasePath, postUpdateMarker);
  assert.equal(readAgentMarker(scenario.databasePath, postUpdateMarker), true);
  const authorityCountsBeforeRestore = readAuthorityCounts(
    scenario.databasePath,
  );

  const restoreEnvironment = runtimeEnvironment(scenario, {
    uiPort: await availablePreferredPort(),
    bridgePort: await availablePreferredPort(),
    extra: {
      AUGNES_TEST_HOLD_AT_DATABASE_JOURNAL_PHASE: "cleanup_complete",
    },
  });
  const restoreManaged = startPackagedRuntime(
    root,
    restoreEnvironment,
    "packaged recovery action runtime",
  );
  const currentForRestore = await waitForJsonEvent(
    restoreManaged,
    (event) => event.command === "start" && event.result === "ready",
  );
  rememberRuntimeOwnership(currentForRestore);
  assert.equal(currentForRestore.database_state, "current");
  assert.equal(
    listRecoveryBackups({
      backupDirectory: localPaths.backup_directory,
      applicationScopeFingerprint: manifest.application_scope_fingerprint,
      inspectDatabase: inspectRecoveryDatabaseFile,
    }).verified.length,
    1,
    "a current same-build restart must not create another backup",
  );

  const recoveryPage = await fetchText(
    `${currentForRestore.effective_url}/recovery`,
  );
  assert.equal(recoveryPage.status, 200);
  assert.match(
    recoveryPage.body,
    /data-recovery-product-surface="v0\.1"/u,
  );
  assert.match(recoveryPage.headers.get("cache-control") ?? "", /no-store/u);
  assert.equal(recoveryPage.headers.get("referrer-policy"), "no-referrer");
  assert.equal(recoveryPage.headers.get("x-content-type-options"), "nosniff");
  assert.equal(recoveryPage.headers.get("x-frame-options"), "DENY");
  assert.match(
    recoveryPage.headers.get("content-security-policy") ?? "",
    /frame-ancestors 'none'/u,
  );
  const statusBefore = await fetchJson(
    `${currentForRestore.effective_url}/api/recovery`,
  );
  const directStatus = await fetchDirectRecoveryStatus(
    root,
    manifest,
    restoreEnvironment,
    currentForRestore,
  );
  assert.equal(directStatus.status, 200, JSON.stringify(directStatus.body));
  assert.equal(
    statusBefore.status,
    200,
    JSON.stringify(statusBefore.body),
  );
  assert.equal(statusBefore.body.actions.restore_backup, true);
  assert.equal(
    statusBefore.body.actions.retry_update,
    false,
    "a healthy current package must not advertise a no-op update retry",
  );
  assert.equal(statusBefore.body.latest_operation.backup_verified, true);
  assert.equal(
    statusBefore.body.database.schema_contract,
    manifest.database.schema_contract,
  );
  assert.equal(statusBefore.body.database.schema_classification, "current");
  assert.equal("schema_version" in statusBefore.body.database, false);
  assert.equal(statusBefore.body.backup_page, 1);
  assert.equal(statusBefore.body.backup_page_count, 1);
  assert.equal(statusBefore.body.backups[0].backup_id, updateBackup.manifest.backup_id);
  const clampedBackupPage = await fetchJson(
    `${currentForRestore.effective_url}/api/recovery?page=100`,
  );
  assert.equal(clampedBackupPage.status, 200);
  assert.equal(clampedBackupPage.body.backup_page, 1);
  assert.equal(
    clampedBackupPage.body.backups[0].backup_id,
    updateBackup.manifest.backup_id,
  );
  const invalidBackupPage = await fetchJson(
    `${currentForRestore.effective_url}/api/recovery?page=101`,
  );
  assert.equal(invalidBackupPage.status, 400);

  const missingOrigin = await postRecoveryAction(
    currentForRestore.effective_url,
    { action: "restore_backup", backup_id: updateBackup.manifest.backup_id },
    null,
  );
  assert.equal(missingOrigin.status, 400);
  assert.equal(missingOrigin.body.reason_code, "recovery_request_invalid");
  const wrongOrigin = await postRecoveryAction(
    currentForRestore.effective_url,
    { action: "restore_backup", backup_id: updateBackup.manifest.backup_id },
    "http://127.0.0.1:1",
  );
  assert.equal(wrongOrigin.status, 400);

  const packagedServerPath = path.join(root, "server.js");
  const packagedServerBeforeTamper = readFileSync(packagedServerPath);
  const packagedServerModeBeforeTamper = lstatSync(packagedServerPath).mode & 0o777;
  const databaseBeforeTamperedRecovery = readFileSync(scenario.databasePath);
  const recoveryBeforeTamperedRecovery = readRecoveryOperationResults(
    localPaths.backup_directory,
  );
  try {
    writeFileSync(
      packagedServerPath,
      Buffer.concat([
        packagedServerBeforeTamper,
        Buffer.from("\n// recovery-action package tamper\n"),
      ]),
    );
    const tamperedRecovery = await postRecoveryAction(
      currentForRestore.effective_url,
      { action: "restore_backup", backup_id: updateBackup.manifest.backup_id },
      currentForRestore.effective_url,
    );
    assert.equal(tamperedRecovery.status, 409);
    assert.equal(tamperedRecovery.body.accepted, false);
    assert.equal(tamperedRecovery.body.outcome, "refused");
    assert.equal(
      tamperedRecovery.body.reason_code,
      "package_integrity_failed",
    );
    assert.deepEqual(
      readFileSync(scenario.databasePath),
      databaseBeforeTamperedRecovery,
      "package tampering during recovery must preserve the authoritative database",
    );
    assert.deepEqual(
      readRecoveryOperationResults(localPaths.backup_directory),
      recoveryBeforeTamperedRecovery,
      "package tampering during recovery must not mutate recovery history",
    );
    const pageAfterTamperedRecovery = await fetchText(
      `${currentForRestore.effective_url}/recovery`,
    );
    assert.equal(pageAfterTamperedRecovery.status, 200);
  } finally {
    writeFileSync(packagedServerPath, packagedServerBeforeTamper);
    if (process.platform !== "win32") {
      chmodSync(packagedServerPath, packagedServerModeBeforeTamper);
    }
  }

  const scheduled = await postRecoveryAction(
    currentForRestore.effective_url,
    { action: "restore_backup", backup_id: updateBackup.manifest.backup_id },
    currentForRestore.effective_url,
  );
  assert.equal(scheduled.status, 202, JSON.stringify(scheduled.body));
  assert.equal(scheduled.body.accepted, true);
  assert.equal(scheduled.body.outcome, "restore_scheduled");

  await waitForJsonEvent(
    restoreManaged,
    (event) =>
      event.command === "test" &&
      event.result === "database_journal_phase_hold" &&
      event.phase === "cleanup_complete",
    READY_TIMEOUT_MS * 2,
  );
  const interruptedRestoreState = readRecoveryOperationResults(
    localPaths.backup_directory,
  );
  const interruptedRestoreJournal = JSON.parse(
    readFileSync(bootstrapJournalPath(scenario.databasePath), "utf8"),
  );
  assert.equal(interruptedRestoreJournal.phase, "cleanup_complete");
  assert.equal(readAgentMarker(scenario.databasePath, postUpdateMarker), false);
  assert.equal(
    interruptedRestoreState.pending_action?.action,
    "restore_backup",
    "the restore action must remain durable until committed-journal reconciliation",
  );
  assert.equal(
    interruptedRestoreState.events[0]?.outcome,
    "restore_published_restart_pending",
    "the verified publication remains restart-pending until exact journal reconciliation",
  );
  process.kill(restoreManaged.child.pid, "SIGKILL");
  const interruptedRestoreExit = await waitForManagedProcess(
    restoreManaged,
    PROCESS_EXIT_TIMEOUT_MS,
  );
  assert.notEqual(interruptedRestoreExit.code, 0, restoreManaged.output());

  const reconciledRestoreEnvironment = runtimeEnvironment(scenario, {
    uiPort: await availablePreferredPort(),
    bridgePort: await availablePreferredPort(),
  });
  const reconciledRestoreManaged = startPackagedRuntime(
    root,
    reconciledRestoreEnvironment,
    "reconcile committed restore before packaged restart",
  );
  const restored = await waitForJsonEvent(
    reconciledRestoreManaged,
    (event) =>
      event.command === "start" && event.result === "ready",
    READY_TIMEOUT_MS * 2,
  );
  rememberRuntimeOwnership(restored);
  const publishedRestoreState = readRecoveryOperationResults(
    localPaths.backup_directory,
  );
  assert.equal(publishedRestoreState.pending_action, null);
  assert.equal(
    publishedRestoreState.events[0]?.outcome,
    "restore_completed",
  );
  assert.equal(
    publishedRestoreState.events[0]?.reason_code,
    "restore_restart_verified",
  );
  assert.equal(
    publishedRestoreState.events[1]?.outcome,
    "restore_published_restart_pending",
  );
  assert.equal(
    existsSync(bootstrapJournalPath(scenario.databasePath)),
    false,
    "committed restore reconciliation must release its exact journal",
  );
  assert.equal(restored.database_state, "current");
  assert.equal(readAgentMarker(scenario.databasePath, postUpdateMarker), false);
  assert.deepEqual(
    readAuthorityCounts(scenario.databasePath),
    authorityCountsBeforeRestore,
  );
  assert.equal(
    inspectRecoveryDatabaseFile(scenario.databasePath).schema_classification,
    "current",
  );
  await assertProductReaders(restored.effective_url, scenario, projectSelection);

  inventory = listRecoveryBackups({
    backupDirectory: localPaths.backup_directory,
    applicationScopeFingerprint: manifest.application_scope_fingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
  });
  assert.equal(inventory.verified.length, 2);
  const safetyBackup = inventory.verified.find(
    (backup) => backup.manifest.reason === "pre_restore_safety",
  );
  assert(safetyBackup, "restore must retain its verified safety backup");
  assert.equal(readAgentMarker(safetyBackup.payloadPath, postUpdateMarker), true);
  assert.equal(
    path.basename(safetyBackup.payloadPath),
    path.basename(RECOVERY_DATABASE_PAYLOAD),
  );
  const operations = readRecoveryOperationResults(localPaths.backup_directory);
  assert.equal(operations.events[0]?.outcome, "restore_completed");
  assert.equal(operations.events[0]?.reason_code, "restore_restart_verified");
  assert.equal(operations.events[0]?.safety_backup_created, true);
  assert.equal(operations.events[0]?.data_preserved, true);
  const statusAfter = await fetchJson(`${restored.effective_url}/api/recovery`);
  assert.equal(statusAfter.status, 200);
  assert.equal(statusAfter.body.latest_operation.outcome, "restore_completed");
  assert.equal(statusAfter.body.latest_operation.safety_backup_created, true);
  assert.equal(statusAfter.body.backup_count, 2);

  const stopRestored = await runPackagedCli(
    root,
    ["stop"],
    environment,
    "stop restored packaged runtime",
  );
  assert.equal(stopRestored.code, 0, stopRestored.output);
  const restoreExit = await waitForManagedProcess(
    reconciledRestoreManaged,
    PROCESS_EXIT_TIMEOUT_MS,
  );
  assert.equal(restoreExit.code, 0, reconciledRestoreManaged.output());
  await assertRuntimeStopped(scenario, restored);

  const corruptGuardDatabase = new Database(scenario.databasePath, {
    fileMustExist: true,
  });
  try {
    corruptGuardDatabase.exec("DROP TABLE augnes_package_identity_guard;");
  } finally {
    corruptGuardDatabase.close();
  }
  const guardRecoveryManaged = startPackagedRuntime(
    root,
    environment,
    "installed package database guard recovery",
  );
  const guardRecovery = await waitForJsonEvent(
    guardRecoveryManaged,
    (event) =>
      event.command === "start" &&
      event.result === "recovery_available" &&
      event.reason === "current_database_identity_unverified",
  );
  rememberRuntimeOwnership(guardRecovery);
  const guardRecoveryStatus = await fetchJson(
    `${new URL(guardRecovery.effective_url).origin}/api/recovery`,
  );
  assert.equal(guardRecoveryStatus.status, 200);
  assert.equal(guardRecoveryStatus.body.actions.retry_update, false);
  assert.equal(guardRecoveryStatus.body.actions.restore_backup, true);
  const guardRestoreScheduled = await postRecoveryAction(
    guardRecovery.effective_url,
    {
      action: "restore_backup",
      backup_id: updateBackup.manifest.backup_id,
    },
    guardRecovery.effective_url,
  );
  assert.equal(guardRestoreScheduled.status, 202);
  const guardRestored = await waitForJsonEvent(
    guardRecoveryManaged,
    (event) =>
      event.command === "start" &&
      event.result === "ready" &&
      event.instance_id !== guardRecovery.instance_id,
    READY_TIMEOUT_MS * 2,
  );
  rememberRuntimeOwnership(guardRestored);
  assert.equal(guardRestored.database_state, "restored");
  assert.equal(
    inspectRuntimePackageIdentityGuard(scenario.databasePath).identity_state,
    "package_identity_required",
  );
  assert.equal(
    readRecoveryOperationResults(localPaths.backup_directory).pending_action,
    null,
  );
  await assertProductReaders(
    guardRestored.effective_url,
    scenario,
    projectSelection,
  );
  const stopGuardRestored = await runPackagedCli(
    root,
    ["stop"],
    environment,
    "stop package database guard recovery",
  );
  assert.equal(stopGuardRestored.code, 0, stopGuardRestored.output);
  const guardRestoreExit = await waitForManagedProcess(
    guardRecoveryManaged,
    PROCESS_EXIT_TIMEOUT_MS,
  );
  assert.equal(guardRestoreExit.code, 0, guardRecoveryManaged.output());
  await assertRuntimeStopped(scenario, guardRestored);
  assertNoRecoveryResidue(localPaths.backup_directory);
  assert.equal(existsSync(scenario.projectExecutionSentinel), false);
  removeRuntimeScenario(scenario);
}

async function testInvalidBridgeProfileCleanup(root, manifest) {
  const scenario = createRuntimeScenario("invalid-bridge-profile");
  const environment = runtimeEnvironment(scenario, {
    uiPort: await availablePreferredPort(),
    bridgePort: await availablePreferredPort(),
    extra: { AUGNES_APP_PROFILE: "invalid-package-test-profile" },
  });
  const managed = startPackagedRuntime(root, environment, "invalid bridge profile");
  const exit = await waitForManagedProcess(managed, PROCESS_EXIT_TIMEOUT_MS);
  assert.notEqual(exit.code, 0, managed.output());
  const failed = managed.events.find(
    (event) => event.command === "start" && event.result === "failed",
  );
  assert(failed, managed.output());
  await assertFailureScenarioClean(scenario, environment);

  const localPaths = packagedLocalPaths(root, manifest, environment);
  const interruptedState = readRecoveryOperationResults(
    localPaths.backup_directory,
  );
  assert.equal(interruptedState.installed_package, null);
  assert.equal(
    interruptedState.pending_package?.build_identity,
    manifest.build_identity,
    "a verified target must remain pending across first-start failure",
  );
  const databaseAfterInterruptedFirstStart = readFileSync(scenario.databasePath);

  const downgradePackageRoot = path.join(
    testRoot,
    "pending-first-start-downgrade-package",
  );
  cpSync(root, downgradePackageRoot, {
    recursive: true,
    force: false,
    errorOnExist: true,
    preserveTimestamps: true,
  });
  const downgradeManifest = createDistributableManifest({
    applicationVersion: "0.0.1",
    platform: manifest.platform,
    runtime: manifest.runtime,
    database: manifest.database,
    files: manifest.files,
  });
  writeFileSync(
    path.join(downgradePackageRoot, "augnes-package.json"),
    `${JSON.stringify(downgradeManifest, null, 2)}\n`,
    { mode: 0o600 },
  );
  applyRestrictiveExtractionModes(downgradePackageRoot, downgradeManifest);
  const refusedDowngrade = startPackagedRuntime(
    downgradePackageRoot,
    environment,
    "pending first-start downgrade refusal",
  );
  const pendingDowngradeRecovery = await waitForJsonEvent(
    refusedDowngrade,
    (event) =>
      event.command === "start" &&
      event.result === "recovery_available" &&
      event.reason === "unsupported_downgrade",
  );
  rememberRuntimeOwnership(pendingDowngradeRecovery);
  const pendingDowngradePage = await fetchText(
    pendingDowngradeRecovery.effective_url,
  );
  assert.equal(pendingDowngradePage.status, 200);
  assert.deepEqual(
    readFileSync(scenario.databasePath),
    databaseAfterInterruptedFirstStart,
  );
  const stateAfterPendingDowngrade = readRecoveryOperationResults(
    localPaths.backup_directory,
  );
  assert.equal(stateAfterPendingDowngrade.installed_package, null);
  assert.equal(
    stateAfterPendingDowngrade.pending_package?.build_identity,
    interruptedState.pending_package?.build_identity,
  );
  const stopPendingDowngrade = await runPackagedCli(
    downgradePackageRoot,
    ["stop"],
    environment,
    "stop pending downgrade recovery entry",
  );
  assert.equal(stopPendingDowngrade.code, 0, stopPendingDowngrade.output);
  const refusedDowngradeExit = await waitForManagedProcess(
    refusedDowngrade,
    PROCESS_EXIT_TIMEOUT_MS,
  );
  assert.equal(refusedDowngradeExit.code, 0, refusedDowngrade.output());
  await assertFailureScenarioClean(scenario, environment);

  const retryEnvironment = runtimeEnvironment(scenario, {
    uiPort: await availablePreferredPort(),
    bridgePort: await availablePreferredPort(),
  });
  const retried = startPackagedRuntime(
    root,
    retryEnvironment,
    "resume pending first packaged start",
  );
  const ready = await waitForJsonEvent(
    retried,
    (event) => event.command === "start" && event.result === "ready",
  );
  rememberRuntimeOwnership(ready);
  const promotedState = readRecoveryOperationResults(
    localPaths.backup_directory,
  );
  assert.equal(promotedState.pending_package, null);
  assert.equal(
    promotedState.installed_package?.build_identity,
    manifest.build_identity,
  );
  const stop = await runPackagedCli(
    root,
    ["stop"],
    retryEnvironment,
    "stop resumed first packaged start",
  );
  assert.equal(stop.code, 0, stop.output);
  const retryExit = await waitForManagedProcess(retried, PROCESS_EXIT_TIMEOUT_MS);
  assert.equal(retryExit.code, 0, retried.output());
  await assertRuntimeStopped(scenario, ready);
  removeRuntimeScenario(scenario);
}

async function testStartupTimeoutRecoverySurface(root, manifest) {
  const scenario = createRuntimeScenario("startup-timeout");
  const durableMarker = "agent:packaged-restart-failure-preserved";
  createSupportedOldSchemaPackageDatabase(root, scenario.databasePath, durableMarker);
  assert.equal(
    inspectRecoveryDatabaseFile(scenario.databasePath).schema_classification,
    "old",
  );
  const uiPort = await availablePreferredPort();
  let bridgePort = await availablePreferredPort();
  while (bridgePort === uiPort) bridgePort = await availablePreferredPort();
  observedOwnedPorts.add(uiPort);
  observedOwnedPorts.add(bridgePort);
  const environment = runtimeEnvironment(scenario, {
    uiPort,
    bridgePort,
    extra: {
      AUGNES_TEST_HOLD_AFTER_RECOVERY_ACCEPT: "1",
      AUGNES_TEST_RUNTIME_STALL_READINESS_ROLE: "bridge",
      AUGNES_TEST_RUNTIME_STARTUP_TIMEOUT_MS: "750",
    },
  });
  const managed = startPackagedRuntime(root, environment, "packaged startup timeout");
  const recovery = await waitForJsonEvent(
    managed,
    (event) =>
      event.command === "start" &&
      event.result === "recovery_available" &&
      event.reason === "bridge_startup_timeout",
    READY_TIMEOUT_MS,
  );
  assert.equal(recovery.database_state, "recovered");
  assert.equal(recovery.recovery_backup_created, true);
  assert.equal(recovery.backup_verified, true);
  assert.equal(recovery.bridge_port, null);
  assert.equal(
    inspectRecoveryDatabaseFile(scenario.databasePath).schema_classification,
    "old",
  );
  assert.equal(readAgentMarker(scenario.databasePath, durableMarker), true);

  const origin = new URL(recovery.effective_url).origin;
  const page = await fetchText(recovery.effective_url);
  assert.equal(page.status, 200);
  assert.match(page.body, /data-recovery-product-surface="v0\.1"/u);
  const status = await fetchJson(`${origin}/api/recovery`);
  assert.equal(status.status, 200);
  assert.equal(status.body.latest_operation.outcome, "update_recovered");
  assert.equal(status.body.database.schema_classification, "old");
  assert.equal(status.body.latest_operation.data_preserved, true);
  assert.equal(status.body.latest_operation.backup_verified, true);
  assert.equal(status.body.actions.restore_backup, true);

  const localPaths = packagedLocalPaths(root, manifest, environment);
  const inventory = listRecoveryBackups({
    backupDirectory: localPaths.backup_directory,
    applicationScopeFingerprint: manifest.application_scope_fingerprint,
    inspectDatabase: inspectRecoveryDatabaseFile,
  });
  assert.equal(inventory.rejected.length, 0);
  assert.equal(inventory.verified.length, 1);
  assert.equal(inventory.verified[0].manifest.reason, "pre_update");
  assert.equal(
    inspectRecoveryDatabaseFile(inventory.verified[0].payloadPath)
      .schema_classification,
    "old",
  );
  assert.equal(readAgentMarker(inventory.verified[0].payloadPath, durableMarker), true);
  assert.equal(
    readRecoveryOperationResults(localPaths.backup_directory).events[0]?.outcome,
    "update_recovered",
  );
  const interruptedPackageState = readRecoveryOperationResults(
    localPaths.backup_directory,
  );
  assert.equal(interruptedPackageState.installed_package, null);
  assert.equal(
    interruptedPackageState.pending_package?.build_identity,
    manifest.build_identity,
  );

  const scheduled = await postRecoveryAction(
    origin,
    {
      action: "restore_backup",
      backup_id: inventory.verified[0].manifest.backup_id,
    },
    origin,
  );
  assert.equal(scheduled.status, 202, JSON.stringify(scheduled.body));
  await waitForJsonEvent(
    managed,
    (event) =>
      event.command === "test" &&
      event.result === "recovery_action_durably_accepted",
  );
  const acceptedState = readRecoveryOperationResults(
    localPaths.backup_directory,
  );
  assert.equal(acceptedState.pending_action?.action, "restore_backup");
  assert.equal(
    acceptedState.pending_action?.selected_backup_id,
    inventory.verified[0].manifest.backup_id,
  );
  process.kill(managed.child.pid, "SIGKILL");
  const crashed = await waitForManagedProcess(
    managed,
    PROCESS_EXIT_TIMEOUT_MS,
  );
  assert.notEqual(crashed.code, 0, managed.output());

  const wrongTargetRoot = path.join(
    testRoot,
    "pending-recovery-action-wrong-target",
  );
  cpSync(root, wrongTargetRoot, {
    recursive: true,
    force: false,
    errorOnExist: true,
    preserveTimestamps: true,
  });
  const wrongTargetManifest = createDistributableManifest({
    applicationVersion: "0.0.1",
    platform: manifest.platform,
    runtime: manifest.runtime,
    database: manifest.database,
    files: manifest.files,
  });
  writeFileSync(
    path.join(wrongTargetRoot, "augnes-package.json"),
    `${JSON.stringify(wrongTargetManifest, null, 2)}\n`,
    { mode: 0o600 },
  );
  applyRestrictiveExtractionModes(wrongTargetRoot, wrongTargetManifest);
  const wrongTargetEnvironment = runtimeEnvironment(scenario, {
    uiPort: await availablePreferredPort(),
    bridgePort: await availablePreferredPort(),
  });
  const backupsBeforeWrongTarget = readdirSync(
    localPaths.backup_directory,
  ).filter((name) => name.endsWith(".backup"));
  const wrongTarget = startPackagedRuntime(
    wrongTargetRoot,
    wrongTargetEnvironment,
    "pending recovery action wrong target refusal",
  );
  const wrongTargetRecovery = await waitForJsonEvent(
    wrongTarget,
    (event) =>
      event.command === "start" &&
      event.result === "recovery_available" &&
      event.reason === "recovery_action_target_changed",
  );
  rememberRuntimeOwnership(wrongTargetRecovery);
  const wrongTargetStatus = await fetchJson(
    `${new URL(wrongTargetRecovery.effective_url).origin}/api/recovery`,
  );
  assert.equal(wrongTargetStatus.status, 200);
  assert.equal(wrongTargetStatus.body.actions.retry_update, false);
  assert.equal(wrongTargetStatus.body.actions.restore_backup, false);
  const wrongTargetAction = await postRecoveryAction(
    wrongTargetRecovery.effective_url,
    { action: "retry_update" },
    wrongTargetRecovery.effective_url,
  );
  assert.equal(wrongTargetAction.status, 409);
  assert.equal(
    readRecoveryOperationResults(localPaths.backup_directory).pending_action
      ?.action_id,
    acceptedState.pending_action.action_id,
  );
  assert.deepEqual(
    readdirSync(localPaths.backup_directory).filter((name) =>
      name.endsWith(".backup"),
    ),
    backupsBeforeWrongTarget,
  );
  const stopWrongTarget = await runPackagedCli(
    wrongTargetRoot,
    ["stop"],
    wrongTargetEnvironment,
    "stop pending recovery action wrong target entry",
  );
  assert.equal(stopWrongTarget.code, 0, stopWrongTarget.output);
  const wrongTargetExit = await waitForManagedProcess(
    wrongTarget,
    PROCESS_EXIT_TIMEOUT_MS,
  );
  assert.equal(wrongTargetExit.code, 0, wrongTarget.output());
  await assertFailureScenarioClean(scenario, wrongTargetEnvironment);

  const retryEnvironment = runtimeEnvironment(scenario, {
    uiPort: await availablePreferredPort(),
    bridgePort: await availablePreferredPort(),
  });
  const retried = startPackagedRuntime(
    root,
    retryEnvironment,
    "resume pending migrated packaged start",
  );
  const ready = await waitForJsonEvent(
    retried,
    (event) => event.command === "start" && event.result === "ready",
  );
  rememberRuntimeOwnership(ready);
  assert.equal(ready.database_state, "restored");
  assert.equal(readAgentMarker(scenario.databasePath, durableMarker), true);
  const promotedPackageState = readRecoveryOperationResults(
    localPaths.backup_directory,
  );
  assert.equal(promotedPackageState.pending_package, null);
  assert.equal(promotedPackageState.pending_action, null);
  assert.equal(
    promotedPackageState.installed_package?.build_identity,
    manifest.build_identity,
  );
  assert.equal(
    listRecoveryBackups({
      backupDirectory: localPaths.backup_directory,
      applicationScopeFingerprint: manifest.application_scope_fingerprint,
      inspectDatabase: inspectRecoveryDatabaseFile,
    }).verified.length,
    2,
    "resuming the durably accepted restore must retain the pre-update source and one current-state safety backup",
  );
  const stopRetried = await runPackagedCli(
    root,
    ["stop"],
    retryEnvironment,
    "stop resumed migrated package",
  );
  assert.equal(stopRetried.code, 0, stopRetried.output);
  const retryExit = await waitForManagedProcess(retried, PROCESS_EXIT_TIMEOUT_MS);
  assert.equal(retryExit.code, 0, retried.output());
  await assertRuntimeStopped(scenario, ready);
  removeRuntimeScenario(scenario);
}

async function testRequiredBridgeCrashCleanup(root) {
  const scenario = createRuntimeScenario("required-bridge-crash");
  const environment = runtimeEnvironment(scenario, {
    uiPort: await availablePreferredPort(),
    bridgePort: await availablePreferredPort(),
  });
  const managed = startPackagedRuntime(root, environment, "required bridge crash");
  const ready = await waitForJsonEvent(
    managed,
    (event) => event.command === "start" && event.result === "ready",
  );
  rememberRuntimeOwnership(ready);
  const bridge = ready.children.find((child) => child.role === "bridge");
  assert(bridge, "ready package runtime must identify its bridge child");
  process.kill(bridge.pid, "SIGKILL");
  const failed = await waitForJsonEvent(
    managed,
    (event) =>
      event.command === "start" &&
      event.result === "failed" &&
      event.reason === "required_child_exited",
  );
  assert.equal(failed.failed_role, "bridge");
  const exit = await waitForManagedProcess(managed, PROCESS_EXIT_TIMEOUT_MS);
  assert.notEqual(exit.code, 0, managed.output());
  await assertRuntimeStopped(scenario, ready);
  removeRuntimeScenario(scenario);
}

async function testHardCrashReconciliation(root) {
  const scenario = createRuntimeScenario("hard-crash-reconciliation");
  const environment = runtimeEnvironment(scenario, {
    uiPort: await availablePreferredPort(),
    bridgePort: await availablePreferredPort(),
  });
  const crashed = startPackagedRuntime(root, environment, "hard-crashed supervisor");
  const firstReady = await waitForJsonEvent(
    crashed,
    (event) => event.command === "start" && event.result === "ready",
  );
  rememberRuntimeOwnership(firstReady);
  process.kill(firstReady.supervisor_pid, "SIGKILL");
  const crashedExit = await waitForManagedProcess(crashed, PROCESS_EXIT_TIMEOUT_MS);
  assert.notEqual(crashedExit.code, 0);
  assert.equal(existsSync(path.join(scenario.runtimeStateRoot, "runtime.json")), true);

  const replacement = startPackagedRuntime(root, environment, "reconciled packaged restart");
  const reconciliation = await waitForJsonEvent(
    replacement,
    (event) => event.command === "start" && event.result === "starting",
  );
  assert.equal(reconciliation.reconciliation_performed, true);
  assert.equal(reconciliation.orphan_children_stopped >= 1, true);
  const replacementReady = await waitForJsonEvent(
    replacement,
    (event) => event.command === "start" && event.result === "ready",
  );
  rememberRuntimeOwnership(replacementReady);
  for (const child of firstReady.children) {
    await waitForProcessGone(child.pid, 15_000);
  }
  const stop = await runPackagedCli(
    root,
    ["stop"],
    environment,
    "stop reconciled package",
  );
  assert.equal(stop.code, 0, stop.output);
  const replacementExit = await waitForManagedProcess(
    replacement,
    PROCESS_EXIT_TIMEOUT_MS,
  );
  assert.equal(replacementExit.code, 0, replacement.output());
  await assertRuntimeStopped(scenario, replacementReady);
  removeRuntimeScenario(scenario);
}

function createRuntimeScenario(name) {
  const root = path.join(testRoot, "scenarios", name);
  const homeRoot = path.join(root, "home");
  const tempRoot = path.join(root, "tmp");
  const projectRoot = path.join(root, "project");
  const fakeBinRoot = path.join(root, "fake-bin");
  const databasePath = path.join(root, "database", "augnes.db");
  const runtimeStateRoot = path.join(root, "runtime-state");
  const privateSentinel = `private-package-sentinel-${name}`;
  const projectExecutionSentinel = path.join(root, "project-code-executed");
  const packageManagerSentinel = path.join(root, "package-manager-invoked");
  for (const directory of [homeRoot, tempRoot, projectRoot, fakeBinRoot]) {
    mkdirSync(directory, { recursive: true, mode: 0o700 });
  }
  writeFileSync(
    path.join(projectRoot, "package.json"),
    `${JSON.stringify({
      name: `package-test-project-${name}`,
      private: true,
      scripts: {
        postinstall: `node -e \"require('node:fs').writeFileSync(${JSON.stringify(projectExecutionSentinel)},'executed')\"`,
      },
    })}\n`,
    { mode: 0o600 },
  );
  writeFileSync(path.join(projectRoot, "README.md"), `# ${name}\n`, { mode: 0o600 });
  for (const command of PACKAGE_MANAGER_NAMES) {
    const executable = path.join(fakeBinRoot, command);
    const contents =
      `#!/bin/sh\nprintf invoked > ${shellQuote(packageManagerSentinel)}\nexit 97\n`;
    writeFileSync(executable, contents, { mode: 0o700 });
    chmodSync(executable, 0o700);
  }
  const networkGuardLabel = `runtime-${name}`;
  expectedRuntimeNetworkGuardLabels.add(networkGuardLabel);
  const networkGuardImport = createChildNetworkGuard(root, networkGuardLabel);
  scenarioRoots.push(root);
  fakePackageManagerSentinel = packageManagerSentinel;
  return {
    name,
    root,
    homeRoot,
    tempRoot,
    projectRoot,
    fakeBinRoot,
    databasePath,
    runtimeStateRoot,
    privateSentinel,
    projectExecutionSentinel,
    packageManagerSentinel,
    networkGuardImport,
  };
}

function runtimeEnvironment(scenario, { uiPort, bridgePort, extra = {} }) {
  const inherited = {};
  for (const key of [
    "SystemRoot",
    "WINDIR",
    "COMSPEC",
    "PATHEXT",
    "LANG",
    "LANGUAGE",
    "LC_ALL",
    "LC_CTYPE",
    "TZ",
    "TERM",
    "NO_COLOR",
    "CI",
  ]) {
    if (typeof process.env[key] === "string" && process.env[key].length > 0) {
      inherited[key] = process.env[key];
    }
  }
  const nodeDirectory = path.dirname(process.execPath);
  const systemPath = process.platform === "win32"
    ? process.env.Path ?? process.env.PATH ?? ""
    : "/usr/bin:/bin";
  const executablePath = [scenario.fakeBinRoot, nodeDirectory, systemPath]
    .filter(Boolean)
    .join(path.delimiter);
  const environment = {
    ...inherited,
    PATH: executablePath,
    Path: executablePath,
    HOME: scenario.homeRoot,
    USERPROFILE: scenario.homeRoot,
    TMPDIR: scenario.tempRoot,
    TMP: scenario.tempRoot,
    TEMP: scenario.tempRoot,
    XDG_DATA_HOME: path.join(scenario.homeRoot, "xdg-data"),
    XDG_CONFIG_HOME: path.join(scenario.homeRoot, "xdg-config"),
    XDG_STATE_HOME: path.join(scenario.homeRoot, "xdg-state"),
    XDG_RUNTIME_DIR: path.join(scenario.homeRoot, "xdg-runtime"),
    NEXT_TELEMETRY_DISABLED: "1",
    AUGNES_DB_PATH: scenario.databasePath,
    AUGNES_RUNTIME_STATE_DIR: scenario.runtimeStateRoot,
    AUGNES_UI_PREFERRED_PORT: String(uiPort),
    AUGNES_BRIDGE_PREFERRED_PORT: String(bridgePort),
    AUGNES_CANONICAL_TEST_MODE: "1",
    AUGNES_CANONICAL_TEMP_ROOT: scenario.root,
    AUGNES_CANONICAL_TEST_NODE_IMPORT: scenario.networkGuardImport,
    AUGNES_TEST_FOLDER_PICKER_PATH: scenario.projectRoot,
    AUGNES_UNRELATED_PRIVATE_SENTINEL: scenario.privateSentinel,
    NODE_OPTIONS: `--import=${pathToFileURL(scenario.networkGuardImport).href}`,
    ...extra,
  };
  cleanupRuntimeEnvironments.set(scenario.runtimeStateRoot, {
    scenario,
    environment,
  });
  return environment;
}

function packageBuildEnvironment({
  temporaryRoot = buildTemporaryRoot,
  homeRoot = packageToolHomeRoot,
  outputRoot = artifactOutputRoot,
  canonicalRoot = testRoot,
  networkGuardImport = packageNetworkGuardImport,
} = {}) {
  const environment = {};
  for (const key of [
    "PATH",
    "Path",
    "HOME",
    "USERPROFILE",
    "TMPDIR",
    "TMP",
    "TEMP",
    "SystemRoot",
    "WINDIR",
    "COMSPEC",
    "PATHEXT",
    "LANG",
    "LANGUAGE",
    "LC_ALL",
    "LC_CTYPE",
    "TZ",
    "TERM",
    "NO_COLOR",
    "CI",
  ]) {
    if (typeof process.env[key] === "string" && process.env[key].length > 0) {
      environment[key] = process.env[key];
    }
  }
  return {
    ...environment,
    TMPDIR: temporaryRoot,
    TMP: temporaryRoot,
    TEMP: temporaryRoot,
    HOME: homeRoot,
    USERPROFILE: homeRoot,
    NODE_ENV: "production",
    NODE_OPTIONS: `--import=${pathToFileURL(networkGuardImport).href}`,
    NEXT_TELEMETRY_DISABLED: "1",
    AUGNES_CANONICAL_TEST_MODE: "1",
    AUGNES_CANONICAL_TEMP_ROOT: canonicalRoot,
    AUGNES_CANONICAL_TEST_NODE_IMPORT: networkGuardImport,
    AUGNES_PACKAGE_OUTPUT_DIR: outputRoot,
    OPENAI_API_KEY: PRIVATE_BUILD_SENTINEL,
    GH_TOKEN: PRIVATE_BUILD_SENTINEL,
    GITHUB_TOKEN: PRIVATE_BUILD_SENTINEL,
    HTTP_PROXY: `http://${PRIVATE_BUILD_SENTINEL}.invalid`,
    HTTPS_PROXY: `http://${PRIVATE_BUILD_SENTINEL}.invalid`,
    AUGNES_UNRELATED_PRIVATE_SENTINEL: PRIVATE_BUILD_SENTINEL,
    npm_config_audit: "false",
    npm_config_fund: "false",
    npm_config_offline: "true",
    npm_config_update_notifier: "false",
  };
}

function createChildNetworkGuard(root, label) {
  const instrumentationRoot = path.join(
    root,
    `zero-network-${label.replaceAll(/[^a-z0-9-]/gi, "-")}`,
  );
  mkdirSync(instrumentationRoot, { recursive: true, mode: 0o700 });
  const guardPath = path.join(instrumentationRoot, "guard.mjs");
  const preloadPath = path.join(instrumentationRoot, "preload.mjs");
  copyFileSync(
    path.join(repositoryRoot, "scripts", "test-harness-zero-network-guard.mjs"),
    guardPath,
  );
  writeFileSync(
    preloadPath,
    [
      'import { appendFileSync } from "node:fs";',
      'import { installZeroNetworkGuard } from "./guard.mjs";',
      `const evidencePath = ${JSON.stringify(networkEvidencePath)};`,
      `const label = ${JSON.stringify(label)};`,
      "let recordBlockedAttempts = false;",
      "const guard = installZeroNetworkGuard({",
      "  allowLoopback: true,",
      '  errorPrefix: "distributable_child_external_network_forbidden",',
      "  onBlockedAttempt: (attempt) => {",
      "    if (!recordBlockedAttempts) return;",
      "    appendFileSync(evidencePath, `${JSON.stringify({ type: \"blocked\", label, pid: process.pid, method: attempt.method })}\\n`);",
      "  },",
      "});",
      "let probeBlocked = false;",
      "try {",
      '  await fetch("https://augnes-zero-network-probe.invalid/");',
      "} catch (error) {",
      '  probeBlocked = error?.code === "test_external_network_forbidden";',
      "}",
      'if (!probeBlocked) throw new Error("zero_network_guard_probe_failed");',
      "guard.attempts.length = 0;",
      "recordBlockedAttempts = true;",
      "appendFileSync(evidencePath, `${JSON.stringify({ type: \"ready\", label, pid: process.pid })}\\n`);",
      "",
    ].join("\n"),
    { flag: "wx", mode: 0o600 },
  );
  return preloadPath;
}

function assertChildNetworkEvidence() {
  const records = readFileSync(networkEvidencePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const ready = records.filter((record) => record.type === "ready");
  const blocked = records.filter((record) => record.type === "blocked");
  assert.equal(blocked.length, 0, JSON.stringify(blocked));
  for (const label of expectedPackageBuildNetworkGuardLabels) {
    const packageBuildPids = new Set(
      ready
        .filter((record) => record.label === label)
        .map((record) => record.pid),
    );
    assert(
      packageBuildPids.size >= 3,
      `${label} npm, package builder, and nested production-build processes must install the zero-network guard`,
    );
  }
  const guardedPids = new Set(ready.map((record) => record.pid));
  for (const pid of observedOwnedPids) {
    assert(
      guardedPids.has(pid),
      `packaged-runtime PID ${pid} did not install the zero-network guard`,
    );
  }
  const guardedLabels = new Set(ready.map((record) => record.label));
  for (const label of expectedRuntimeNetworkGuardLabels) {
    assert(
      guardedLabels.has(label),
      `packaged runtime ${label} did not install the zero-network guard`,
    );
  }
  return {
    blockedAttempts: blocked.length,
    guardedProcesses: guardedPids.size,
  };
}

function listBuildTemporaryEntries(root = buildTemporaryRoot) {
  return readdirSync(root)
    .filter((name) => buildTemporaryPrefixes.some((prefix) => name.startsWith(prefix)))
    .sort(compareCodeUnits);
}

function listNewBuildTemporaryEntries() {
  return listBuildTemporaryEntries().filter(
    (name) => !buildTemporaryBaseline.has(name),
  );
}

function startPackagedRuntime(root, environment, label) {
  return spawnManagedLauncher(root, [], environment, label);
}

function spawnManagedLauncher(root, args, environment, label) {
  const launcher = path.join(root, "augnes");
  const child = spawn(launcher, args, {
    cwd: root,
    env: environment,
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  const managed = {
    child,
    stdout: "",
    stderr: "",
    stdoutRemainder: "",
    stderrRemainder: "",
    events: [],
    output() {
      return `${this.stdout}\n${this.stderr}`;
    },
  };
  managed.processRecord = registerOwnedChild(ownedProcesses, child, { label });
  allProcessRecords.push(managed.processRecord);
  if (Number.isInteger(child.pid)) {
    observedLauncherPids.add(child.pid);
    if (process.platform !== "win32") observedOwnedPids.add(child.pid);
  }
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => captureManagedChunk(managed, "stdout", chunk));
  child.stderr.on("data", (chunk) => captureManagedChunk(managed, "stderr", chunk));
  return managed;
}

function captureManagedChunk(managed, streamName, chunk) {
  managed[streamName] = `${managed[streamName]}${chunk}`.slice(-512 * 1024);
  const remainderName = `${streamName}Remainder`;
  managed[remainderName] += chunk;
  const lines = managed[remainderName].split(/\r?\n/);
  managed[remainderName] = lines.pop() ?? "";
  for (const line of lines) {
    const event = parseJson(line);
    if (event) managed.events.push(event);
  }
}

async function runPackagedCli(root, args, environment, label) {
  const managed = spawnManagedLauncher(root, args, environment, label);
  const exit = await waitForManagedProcess(managed, PROCESS_EXIT_TIMEOUT_MS);
  flushManagedRemainders(managed);
  return {
    code: exit.code,
    signal: exit.signal,
    stdout: managed.stdout,
    stderr: managed.stderr,
    output: managed.output(),
  };
}

async function waitForManagedProcess(managed, timeoutMs) {
  const result = await waitForOwnedProcessExit(managed.processRecord, timeoutMs, {
    termGraceMs: 10_000,
    killGraceMs: 5_000,
  });
  if (result.code !== 0 || result.signal !== null) {
    await terminateOwnedProcessTree(managed.processRecord, {
      termGraceMs: 5_000,
      killGraceMs: 3_000,
    });
  }
  flushManagedRemainders(managed);
  return result;
}

function flushManagedRemainders(managed) {
  for (const streamName of ["stdout", "stderr"]) {
    const remainderName = `${streamName}Remainder`;
    if (!managed[remainderName]) continue;
    const event = parseJson(managed[remainderName]);
    if (event) managed.events.push(event);
    managed[remainderName] = "";
  }
}

async function waitForJsonEvent(managed, predicate, timeoutMs = READY_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const event = managed.events.find(predicate);
    if (event) return event;
    if (managed.child.exitCode !== null || managed.child.signalCode !== null) {
      flushManagedRemainders(managed);
      const finalEvent = managed.events.find(predicate);
      if (finalEvent) return finalEvent;
      throw new Error(`packaged runtime exited before expected event: ${managed.output()}`);
    }
    await delay(50);
  }
  throw new Error(`timed out waiting for packaged runtime event: ${managed.output()}`);
}

function rememberRuntimeOwnership(ready) {
  assert(Number.isInteger(ready.supervisor_pid) && ready.supervisor_pid > 0);
  observedOwnedPids.add(ready.supervisor_pid);
  for (const child of ready.children ?? []) {
    assert(Number.isInteger(child.pid) && child.pid > 0);
    assert(Number.isInteger(child.port) && child.port > 0);
    observedOwnedPids.add(child.pid);
    observedOwnedPorts.add(child.port);
  }
  for (const port of [ready.ui_port, ready.bridge_port]) {
    if (port === null || port === undefined) continue;
    assert(Number.isInteger(port) && port > 0);
    observedOwnedPorts.add(port);
  }
}

function assertDistributionMetadata(value, manifest) {
  assert.equal(value.distribution_mode, "packaged");
  assert.equal(value.application_version, manifest.application_version);
  assert.equal(value.package_contract, manifest.contract);
  assert.equal(value.package_contract_version, manifest.package_contract_version);
  assert.equal(value.build_identity, manifest.build_identity);
  assert.equal(
    value.package_platform,
    formatDistributablePlatformLabel(
      manifest.platform,
      manifest.runtime.node_modules_abi,
    ),
  );
  assert.equal(value.runtime_contract, manifest.runtime.runtime_contract);
  assert.equal(value.runtime_schema_version, manifest.runtime.runtime_schema_version);
  assert.equal(value.database_schema_compatibility, manifest.database.schema_compatibility);
}

async function onboardDisposableProject(origin, scenario) {
  const headers = {
    "content-type": "application/json",
    origin,
    "sec-fetch-site": "same-origin",
  };
  const selectedResponse = await fetch(`${origin}/api/vnext/projects`, {
    method: "POST",
    headers,
    body: JSON.stringify({ action: "choose_folder" }),
    signal: AbortSignal.timeout(10_000),
  });
  assert.equal(selectedResponse.status, 200);
  const selected = await selectedResponse.json();
  assert.equal(selected.ok, true);
  assert.equal(selected.picker?.status, "selected");
  const selectedProjectPath = selected.picker.inspection.normalized_path
    ?? selected.picker.inspection.local_root?.normalized_path;
  assert.equal(realpathSync(selectedProjectPath), realpathSync(scenario.projectRoot));
  const confirmResponse = await fetch(`${origin}/api/vnext/projects`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      action: "confirm",
      selection_token: selected.picker.selection_token,
      inspection_fingerprint: selected.picker.inspection.inspection_fingerprint,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  assert.equal(confirmResponse.status, 200);
  const confirmed = await confirmResponse.json();
  assert.equal(confirmed.ok, true);
  assert.match(confirmed.result.destination, /^\/projects\//);
  const destination = await fetchText(`${origin}${confirmed.result.destination}`);
  assert.equal(destination.status, 200);
  assert.match(destination.body, /Project Home/);
  assert.equal(existsSync(scenario.projectExecutionSentinel), false);
  return {
    destination: confirmed.result.destination,
    projectId: confirmed.result.project.project_id,
  };
}

async function assertProductReaders(origin, scenario, projectSelection = null) {
  const home = await fetchText(`${origin}/`);
  assert.equal(home.status, 200);
  assert.match(home.body, /Project Home/);
  if (projectSelection) {
    const projectHome = await fetchText(
      `${origin}${projectSelection.destination}`,
    );
    assert.equal(projectHome.status, 200);
    assert.match(projectHome.body, /Project Home/);
    const projectRead = await fetchJson(
      `${origin}/api/vnext/projects?project_id=${encodeURIComponent(projectSelection.projectId)}`,
    );
    assert.equal(projectRead.status, 200);
    assert.equal(projectRead.body.ok, true);
    assert.equal(
      projectRead.body.project.project.project_id,
      projectSelection.projectId,
    );
    assert.equal(
      projectRead.body.project.active_selection.project_id,
      projectSelection.projectId,
    );
    assert.equal(projectRead.body.project.root_availability, "available");
  }
  const workbench = await fetchText(
    `${origin}/workbench/semantic-review`,
  );
  assert.equal(workbench.status, 200);
  assert.match(workbench.body, /Semantic Workbench|Semantic Review Workbench/);
  const inspector = await fetchText(`${origin}/workbench/inspector`);
  assert.equal(inspector.status, 200);
  assert.match(inspector.body, /Shared Inspector|Private Inspector locked/);
  assert.equal(existsSync(scenario.projectExecutionSentinel), false);
}

function packagedLocalPaths(root, manifest, environment) {
  return resolveAugnesLocalPaths({
    environment,
    repositoryRoot: root,
    repositoryFingerprint: manifest.application_scope_fingerprint,
  });
}

function makeSupportedOldSchema(databasePath) {
  const database = new Database(databasePath, { fileMustExist: true });
  try {
    database.pragma("journal_mode = DELETE");
    database.exec(
      "DROP TABLE augnes_schema_migrations;" +
        "DROP TABLE augnes_package_identity_guard;",
    );
  } finally {
    database.close();
  }
}

function createSupportedOldSchemaPackageDatabase(root, databasePath, markerId) {
  mkdirSync(path.dirname(databasePath), { recursive: true, mode: 0o700 });
  const database = new Database(databasePath);
  try {
    database.pragma("foreign_keys = ON");
    database.exec(readFileSync(path.join(root, "lib", "db", "schema.sql"), "utf8"));
    database.exec(
      "DROP TABLE augnes_schema_migrations;" +
        "DROP TABLE augnes_package_identity_guard;",
    );
    database
      .prepare(
        "INSERT INTO agents (id, name, kind, created_at) VALUES (?, ?, ?, ?)",
      )
      .run(
        markerId,
        "Packaged restart recovery marker",
        "runtime",
        "2026-07-20T00:00:00.000Z",
      );
  } finally {
    database.close();
  }
  chmodSync(databasePath, 0o600);
}

function writeAgentMarker(databasePath, markerId) {
  const database = new Database(databasePath, { fileMustExist: true });
  try {
    database.pragma("journal_mode = DELETE");
    database
      .prepare("INSERT INTO agents (id, name, kind) VALUES (?, ?, ?)")
      .run(markerId, "packaged restore marker", "runtime");
  } finally {
    database.close();
  }
}

function readAgentMarker(databasePath, markerId) {
  const database = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    return (
      database
        .prepare("SELECT COUNT(*) AS count FROM agents WHERE id = ?")
        .get(markerId).count === 1
    );
  } finally {
    database.close();
  }
}

function writePackagedHandoffReplayFixture(databasePath, projectId) {
  const database = new Database(databasePath, { fileMustExist: true });
  try {
    database.pragma("foreign_keys = ON");
    const scope = database
      .prepare(
        `SELECT workspace_id, project_id
           FROM vnext_project_identities
          WHERE project_id = ?
          ORDER BY workspace_id`,
      )
      .all(projectId);
    assert.equal(scope.length, 1);
    database
      .prepare(
        `INSERT INTO vnext_local_operator_sessions (
           session_id, workspace_id, project_id, operator_id,
           bootstrap_token_hash, session_token_hash, issued_at, expires_at,
           bootstrap_consumed_at, revoked_at, action_nonce_hash,
           action_nonce_expires_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)`,
      )
      .run(
        "session:r8a-package-handoff-replay",
        scope[0].workspace_id,
        scope[0].project_id,
        "operator:r8a-package-handoff",
        `sha256:${"1".repeat(64)}`,
        `sha256:${"2".repeat(64)}`,
        "2026-07-20T00:00:00.000Z",
        "2099-07-20T00:00:00.000Z",
        "2026-07-20T00:00:01.000Z",
        `sha256:${"3".repeat(64)}`,
        "2099-07-20T00:00:00.000Z",
        "2026-07-20T00:00:01.000Z",
      );
    return readPackagedHandoffReplayFixture(databasePath);
  } finally {
    database.close();
  }
}

function readPackagedHandoffReplayFixture(databasePath) {
  const database = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    const row = database
      .prepare(
        `SELECT session_id, workspace_id, project_id, operator_id,
                bootstrap_token_hash, session_token_hash, issued_at,
                expires_at, bootstrap_consumed_at, revoked_at,
                action_nonce_hash, action_nonce_expires_at, updated_at
           FROM vnext_local_operator_sessions
          WHERE session_id = ?`,
      )
      .get("session:r8a-package-handoff-replay");
    assert(row, "the packaged handoff replay fixture must remain present");
    return JSON.stringify(row);
  } finally {
    database.close();
  }
}

function writeMergedR8APrivateMaterialFixture(
  databasePath,
  projectId,
) {
  const database = new Database(databasePath, { fileMustExist: true });
  try {
    database.pragma("foreign_keys = ON");
    database.pragma("journal_mode = DELETE");
    const project = database
      .prepare(
        `SELECT workspace_id, project_id
           FROM vnext_project_identities
          WHERE project_id = ?
          ORDER BY workspace_id`,
      )
      .all(projectId);
    assert.equal(project.length, 1);
    const sessionId = "session:r8a-private-material";
    const createdAt = "2026-07-20T00:00:10.000Z";
    database
      .prepare(
        `INSERT OR IGNORE INTO agents (id, name, kind, created_at)
         VALUES (?, 'Temporal Delta Compiler', 'compiler', ?)`,
      )
      .run(RECOVERY_PRIVATE_LEGACY_OBSERVE_SOURCE_AGENT_ID, createdAt);
    database
      .prepare(
        `INSERT INTO sessions (
           id, agent_id, scope, title, started_at, surface, actor,
           related_work_id, summary
         ) VALUES (?, ?, ?, ?, ?, 'local_runtime', ?, ?, ?)`,
      )
      .run(
        sessionId,
        RECOVERY_PRIVATE_LEGACY_OBSERVE_SOURCE_AGENT_ID,
        project[0].project_id,
        "Observe user message",
        createdAt,
        "operator:r8a-private-material",
        "work:r8a-private-material",
        "Bounded metadata retained across recovery normalization.",
      );
    database
      .prepare(
        `INSERT INTO messages (
           id, session_id, agent_id, role, content, created_at
         ) VALUES (?, ?, NULL, 'user', ?, ?)`,
      )
      .run(
        "message:r8a-private-material",
        sessionId,
        MERGED_R8A_RAW_OBSERVE_SENTINEL,
        createdAt,
      );
    const proposalStatement = database.prepare(
        `INSERT INTO state_delta_proposals (
           id, scope, state_key, before_value, after_value, operation,
           temporal_scope, stability, change_type, source_agent_id,
           source_session_id, reason, status, proposed_at, decided_at,
           consolidation_status
         ) VALUES (
           ?, ?, ?, ?, ?, 'update', 'current_task', 'tentative', 'refinement',
           ?, ?, ?, 'committed', ?, ?,
           'committed'
         )`,
      );
    const transitionStatement = database.prepare(
        `INSERT INTO state_transitions (
           id, scope, state_key, before_value, after_value, temporal_scope,
           stability, change_type, source_agent_id, source_session_id,
           source_proposal_id, reason, committed_at
         ) VALUES (
           ?, ?, ?, ?, ?, 'current_task', 'tentative', 'refinement', ?, ?, ?,
           ?, ?
         )`,
      );
    const entryStatement = database.prepare(
        `INSERT INTO state_entries (
           id, scope, state_key, value, temporal_scope, stability, change_type,
           source_agent_id, source_session_id, source_transition_id,
           created_at, updated_at
         ) VALUES (
           ?, ?, ?, ?, 'current_task', 'tentative', 'refinement', ?, ?, ?, ?, ?
         )`,
      );
    for (const [index, stateKey] of RECOVERY_PRIVATE_LEGACY_OBSERVE_STATE_KEYS.entries()) {
      const suffix = stateKey.replaceAll(".", "-");
      const proposalId = `proposal:r8a-private-material:${suffix}`;
      const transitionId = `transition:r8a-private-material:${suffix}`;
      proposalStatement.run(
        proposalId,
        project[0].project_id,
        stateKey,
        JSON.stringify(MERGED_R8A_RAW_OBSERVE_BEFORE_SENTINEL),
        JSON.stringify(MERGED_R8A_RAW_OBSERVE_SENTINEL),
        RECOVERY_PRIVATE_LEGACY_OBSERVE_SOURCE_AGENT_ID,
        sessionId,
        RECOVERY_PRIVATE_LEGACY_OBSERVE_REASON,
        createdAt,
        `2026-07-20T00:00:1${index + 1}.000Z`,
      );
      transitionStatement.run(
        transitionId,
        project[0].project_id,
        stateKey,
        JSON.stringify(MERGED_R8A_RAW_OBSERVE_BEFORE_SENTINEL),
        JSON.stringify(MERGED_R8A_RAW_OBSERVE_SENTINEL),
        RECOVERY_PRIVATE_LEGACY_OBSERVE_SOURCE_AGENT_ID,
        sessionId,
        proposalId,
        RECOVERY_PRIVATE_LEGACY_OBSERVE_REASON,
        `2026-07-20T00:00:2${index}.000Z`,
      );
      entryStatement.run(
        `entry:r8a-private-material:${suffix}`,
        project[0].project_id,
        stateKey,
        JSON.stringify(MERGED_R8A_RAW_OBSERVE_SENTINEL),
        RECOVERY_PRIVATE_LEGACY_OBSERVE_SOURCE_AGENT_ID,
        sessionId,
        transitionId,
        `2026-07-20T00:00:2${index}.000Z`,
        `2026-07-20T00:00:3${index}.000Z`,
      );
    }
    return readMergedR8APrivateMaterialFixtureFromDatabase(database);
  } finally {
    database.close();
  }
}

function readMergedR8APrivateMaterialFixture(databasePath) {
  const database = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    return readMergedR8APrivateMaterialFixtureFromDatabase(database);
  } finally {
    database.close();
  }
}

function readMergedR8APrivateMaterialFixtureFromDatabase(database) {
  const sessionId = "session:r8a-private-material";
  return {
    messages: database
      .prepare("SELECT * FROM messages WHERE session_id = ? ORDER BY id")
      .all(sessionId),
    proposals: database
      .prepare(
        `SELECT * FROM state_delta_proposals
          WHERE source_agent_id = ? AND reason = ? AND source_session_id = ?
          ORDER BY id`,
      )
      .all(
        RECOVERY_PRIVATE_LEGACY_OBSERVE_SOURCE_AGENT_ID,
        RECOVERY_PRIVATE_LEGACY_OBSERVE_REASON,
        sessionId,
      ),
    entries: database
      .prepare(
        `SELECT * FROM state_entries
          WHERE source_session_id = ?
          ORDER BY id`,
      )
      .all(sessionId),
    transitions: database
      .prepare(
        `SELECT * FROM state_transitions
          WHERE source_agent_id = ? AND reason = ? AND source_session_id = ?
          ORDER BY id`,
      )
      .all(
        RECOVERY_PRIVATE_LEGACY_OBSERVE_SOURCE_AGENT_ID,
        RECOVERY_PRIVATE_LEGACY_OBSERVE_REASON,
        sessionId,
      ),
  };
}

function normalizedMergedR8APrivateMaterialSnapshot(snapshot) {
  const normalized = structuredClone(snapshot);
  for (const row of normalized.messages) {
    row.content = RECOVERY_PRIVATE_MATERIAL_MARKER;
  }
  for (const row of normalized.proposals) {
    row.before_value = RECOVERY_PRIVATE_STATE_VALUE_MARKER;
    row.after_value = RECOVERY_PRIVATE_STATE_VALUE_MARKER;
  }
  for (const row of normalized.entries) {
    row.value = RECOVERY_PRIVATE_STATE_VALUE_MARKER;
  }
  for (const row of normalized.transitions) {
    row.before_value = RECOVERY_PRIVATE_STATE_VALUE_MARKER;
    row.after_value = RECOVERY_PRIVATE_STATE_VALUE_MARKER;
  }
  return normalized;
}

function assertMergedR8APrivateMaterialRaw(databasePath) {
  const fixture = readMergedR8APrivateMaterialFixture(databasePath);
  assert.equal(fixture.messages[0].content, MERGED_R8A_RAW_OBSERVE_SENTINEL);
  assert.deepEqual(
    fixture.proposals.map((row) => row.state_key).sort(),
    [...RECOVERY_PRIVATE_LEGACY_OBSERVE_STATE_KEYS].sort(),
  );
  assert.equal(fixture.entries.length, 3);
  assert.equal(fixture.transitions.length, 3);
  for (const row of fixture.proposals) {
    assert.equal(
      row.before_value,
      JSON.stringify(MERGED_R8A_RAW_OBSERVE_BEFORE_SENTINEL),
    );
    assert.equal(
      row.after_value,
      JSON.stringify(MERGED_R8A_RAW_OBSERVE_SENTINEL),
    );
  }
  for (const row of fixture.entries) {
    assert.equal(
      row.value,
      JSON.stringify(MERGED_R8A_RAW_OBSERVE_SENTINEL),
    );
  }
  for (const row of fixture.transitions) {
    assert.equal(
      row.before_value,
      JSON.stringify(MERGED_R8A_RAW_OBSERVE_BEFORE_SENTINEL),
    );
    assert.equal(
      row.after_value,
      JSON.stringify(MERGED_R8A_RAW_OBSERVE_SENTINEL),
    );
  }
}

function assertMergedR8APrivateMaterialNormalized(databasePath) {
  const fixture = readMergedR8APrivateMaterialFixture(databasePath);
  assert.equal(fixture.messages[0].content, RECOVERY_PRIVATE_MATERIAL_MARKER);
  assert.deepEqual(
    fixture.proposals.map((row) => row.state_key).sort(),
    [...RECOVERY_PRIVATE_LEGACY_OBSERVE_STATE_KEYS].sort(),
  );
  assert.equal(fixture.entries.length, 3);
  assert.equal(fixture.transitions.length, 3);
  for (const row of fixture.proposals) {
    assert.equal(row.before_value, RECOVERY_PRIVATE_STATE_VALUE_MARKER);
    assert.equal(row.after_value, RECOVERY_PRIVATE_STATE_VALUE_MARKER);
  }
  for (const row of fixture.entries) {
    assert.equal(row.value, RECOVERY_PRIVATE_STATE_VALUE_MARKER);
  }
  for (const row of fixture.transitions) {
    assert.equal(row.before_value, RECOVERY_PRIVATE_STATE_VALUE_MARKER);
    assert.equal(row.after_value, RECOVERY_PRIVATE_STATE_VALUE_MARKER);
  }
}

function assertNoMergedR8ARawPrivateBytes(rootPath) {
  const stats = lstatSync(rootPath);
  const files = stats.isDirectory() ? listRegularFiles(rootPath) : [rootPath];
  for (const filePath of files) {
    const bytes = readFileSync(filePath);
    for (const sentinel of [
      MERGED_R8A_RAW_OBSERVE_SENTINEL,
      MERGED_R8A_RAW_OBSERVE_BEFORE_SENTINEL,
    ]) {
      assert.equal(
        bytes.includes(Buffer.from(sentinel)),
        false,
        `${path.relative(testRoot, filePath)} retained merged-R8A raw Observe bytes`,
      );
    }
  }
}

function recoveryInventoryIdentitySnapshot(inventory) {
  assert.equal(inventory.rejected.length, 0);
  return inventory.verified
    .map((backup) => ({
      backup_id: backup.manifest.backup_id,
      backup_identity: backup.manifest.backup_identity,
      backup_basename: path.basename(backup.backupPath),
      inode: lstatSync(backup.backupPath, { bigint: true }).ino.toString(),
    }))
    .sort((left, right) => compareCodeUnits(left.backup_id, right.backup_id));
}

function readAuthorityCounts(databasePath) {
  const database = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    return Object.fromEntries(
      [
        "episode_delta_proposal",
        "review_decision",
        "run_receipt",
        "state_transition_receipt",
      ].map((recordKind) => [
        recordKind,
        database
          .prepare(
            "SELECT COUNT(*) AS count FROM vnext_core_records WHERE record_kind = ?",
          )
          .get(recordKind).count,
      ]),
    );
  } finally {
    database.close();
  }
}

async function postRecoveryAction(origin, body, requestOrigin) {
  const actionOrigin = new URL(origin).origin;
  const response = await fetch(`${actionOrigin}/api/recovery`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/json",
      ...(requestOrigin === null
        ? {}
        : { origin: new URL(requestOrigin).origin }),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  const text = await response.text();
  let parsedBody;
  try {
    parsedBody = JSON.parse(text);
  } catch {
    parsedBody = {
      error_code: "recovery_response_not_json",
      location: response.headers.get("location"),
      response_url: response.url,
      content_type: response.headers.get("content-type"),
    };
  }
  return { status: response.status, body: parsedBody };
}

async function fetchDirectRecoveryStatus(
  root,
  manifest,
  environment,
  ready,
) {
  const paths = resolveRuntimePaths({
    environment,
    repositoryFingerprint: manifest.application_scope_fingerprint,
    repositoryRootPath: root,
  });
  const runtimeManifest = JSON.parse(readFileSync(paths.manifest, "utf8"));
  const token = JSON.parse(readFileSync(paths.token, "utf8"));
  assert.equal(runtimeManifest.instance_id, ready.instance_id);
  assert.equal(token.instance_id, ready.instance_id);
  const response = await fetch(
    `http://127.0.0.1:${runtimeManifest.control_port}/v1/recovery`,
    {
      headers: {
        "x-augnes-runtime-instance": ready.instance_id,
        "x-augnes-child-ownership": token.child_ownership_token,
      },
      signal: AbortSignal.timeout(10_000),
    },
  );
  return { status: response.status, body: await response.json() };
}

async function assertRuntimeStopped(scenario, ready) {
  await waitForPortClosed(ready.ui_port);
  await waitForPortClosed(ready.bridge_port);
  for (const child of ready.children ?? []) await waitForProcessGone(child.pid, 10_000);
  assertRuntimeStateEmpty(scenario.runtimeStateRoot);
  assertNoDatabaseResidue(scenario.databasePath);
  assert.equal(existsSync(scenario.packageManagerSentinel), false);
  assert.equal(existsSync(scenario.projectExecutionSentinel), false);
}

async function assertFailureScenarioClean(scenario, environment) {
  await waitForPortClosed(Number(environment.AUGNES_UI_PREFERRED_PORT));
  await waitForPortClosed(Number(environment.AUGNES_BRIDGE_PREFERRED_PORT));
  assertRuntimeStateEmpty(scenario.runtimeStateRoot);
  assertNoDatabaseResidue(scenario.databasePath);
  assert.equal(existsSync(scenario.packageManagerSentinel), false);
}

function assertRuntimeStateEmpty(runtimeRoot) {
  if (!existsSync(runtimeRoot)) return;
  assert.deepEqual(listRegularFiles(runtimeRoot), []);
  assert.deepEqual(
    readdirSync(runtimeRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()),
    [],
  );
}

function assertNoDatabaseResidue(databasePath) {
  for (const suffix of SQLITE_SIDE_SUFFIXES) {
    assert.equal(existsSync(`${databasePath}${suffix}`), false, `${suffix} remained`);
  }
  const directory = path.dirname(databasePath);
  if (!existsSync(directory)) return;
  const residue = readdirSync(directory).filter(
    (name) =>
      name.includes(".augnes-stage-") ||
      name.includes(".augnes-rollback-") ||
      name.includes(".augnes-bootstrap.lock"),
  );
  assert.deepEqual(residue, [], `database operation residue remained: ${residue.join(", ")}`);
}

function assertNoRecoveryResidue(backupDirectory) {
  if (!existsSync(backupDirectory)) return;
  const entries = readdirSync(backupDirectory);
  const topLevelResidue = entries.filter(
    (name) =>
      name.startsWith(".augnes-recovery-incomplete-") ||
      name.includes(".write-") ||
      name.includes(".augnes-stage-") ||
      name.includes(".augnes-rollback-"),
  );
  assert.deepEqual(
    topLevelResidue,
    [],
    `recovery operation residue remained: ${topLevelResidue.join(", ")}`,
  );
  const sqliteResidue = listRegularFiles(backupDirectory)
    .map((filePath) => path.basename(filePath))
    .filter((name) => SQLITE_SIDE_SUFFIXES.some((suffix) => name.endsWith(suffix)));
  assert.deepEqual(
    sqliteResidue,
    [],
    `recovery SQLite residue remained: ${sqliteResidue.join(", ")}`,
  );
}

function assertFreshDatabaseHasNoDemoSeed(databasePath) {
  const database = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    assert.equal(database.pragma("integrity_check", { simple: true }), "ok");
    assert.equal(
      database.prepare("SELECT COUNT(*) AS count FROM agents WHERE id = ?").get("agent:demo-runtime").count,
      0,
    );
    assert.equal(
      database.prepare("SELECT COUNT(*) AS count FROM sessions WHERE id = ?").get("session:demo-runtime-core").count,
      0,
    );
    assert.equal(
      database.prepare("SELECT COUNT(*) AS count FROM state_entries WHERE scope = ?").get("project:augnes").count,
      0,
    );
  } finally {
    database.close();
  }
}

async function createSeparatedPortBlockers() {
  const ui = await createPortBlocker(TEST_UI_PORT_RANGE);
  const bridge = await createPortBlocker(TEST_BRIDGE_PORT_RANGE);
  return { ui, bridge };
}

async function createPortBlocker([firstPort, lastPort]) {
  for (let port = firstPort; port <= lastPort; port += 1) {
    const server = trackServerConnections(net.createServer((socket) => socket.end()));
    ownedServers.add(server);
    try {
      await listenServer(server, port);
      return { server, port };
    } catch (error) {
      ownedServers.delete(server);
      if (error?.code === "EADDRINUSE" || error?.code === "EACCES") continue;
      throw error;
    }
  }
  throw new Error(
    `no deterministic test port is available in ${firstPort}-${lastPort}`,
  );
}

async function closePortBlocker(blocker) {
  if (!blocker?.server) return;
  await closeTrackedServer(blocker.server, { timeoutMs: 3_000 });
  ownedServers.delete(blocker.server);
  blocker.server = null;
}

async function availablePreferredPort() {
  for (let attempt = 0; attempt < PORT_SEARCH_SIZE; attempt += 1) {
    const server = trackServerConnections(net.createServer());
    ownedServers.add(server);
    await listenServer(server, 0);
    const address = server.address();
    assert(address && typeof address === "object");
    const port = address.port;
    await closeTrackedServer(server, { timeoutMs: 3_000 });
    ownedServers.delete(server);
    if (port <= 65_535 - PORT_SEARCH_SIZE) return port;
  }
  throw new Error("no valid bounded preferred port was assigned");
}

function listenServer(server, port) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen({ host: "127.0.0.1", port, exclusive: true }, resolve);
  });
}

async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  return { status: response.status, body: await response.json() };
}

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(10_000),
  });
  return {
    status: response.status,
    body: await response.text(),
    headers: response.headers,
    url: response.url,
  };
}

async function waitForPortClosed(port) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (!(await canConnect(port))) return;
    await delay(50);
  }
  assert.equal(await canConnect(port), false, `owned port ${port} remained open`);
}

function canConnect(port) {
  if (!Number.isInteger(port) || port <= 0) return Promise.resolve(false);
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.setTimeout(1_000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function runCapturedProcess({
  command,
  args,
  cwd,
  environment,
  label,
  timeoutMs,
}) {
  const child = spawn(command, args, {
    cwd,
    env: environment,
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdout = `${stdout}${chunk}`.slice(-1024 * 1024);
  });
  child.stderr.on("data", (chunk) => {
    stderr = `${stderr}${chunk}`.slice(-1024 * 1024);
  });
  const record = registerOwnedChild(ownedProcesses, child, { label });
  allProcessRecords.push(record);
  const result = await waitForOwnedProcessExit(record, timeoutMs, {
    termGraceMs: 10_000,
    killGraceMs: 5_000,
  });
  if (result.code !== 0 || result.signal !== null) {
    await terminateOwnedProcessTree(record, {
      termGraceMs: 3_000,
      killGraceMs: 3_000,
    });
  }
  return {
    ...result,
    stdout,
    stderr,
    output: `${stdout}\n${stderr}`,
  };
}

function listRegularFiles(root) {
  if (!existsSync(root)) return [];
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const candidate = path.join(root, entry.name);
    const stats = lstatSync(candidate);
    assert.equal(stats.isSymbolicLink(), false, `symlink is forbidden: ${candidate}`);
    if (stats.isDirectory()) files.push(...listRegularFiles(candidate));
    else if (stats.isFile()) files.push(candidate);
    else assert.fail(`non-regular package entry is forbidden: ${candidate}`);
  }
  return files.sort((left, right) => compareCodeUnits(
    toPosixRelative(root, left),
    toPosixRelative(root, right),
  ));
}

function normalizeArchiveEntry(value) {
  const withoutDot = value.startsWith("./") ? value.slice(2) : value;
  return withoutDot.endsWith("/") ? withoutDot.slice(0, -1) : withoutDot;
}

function assertSafeRelativePath(value, label) {
  assert.equal(typeof value, "string");
  assert(value.length > 0 && value.length <= 512, `${label} has invalid length`);
  assert.equal(value.includes("\\"), false, `${label} contains a backslash`);
  assert.equal(value.includes("\0"), false, `${label} contains NUL`);
  assert.equal(path.posix.isAbsolute(value), false, `${label} is absolute`);
  assert.equal(path.posix.normalize(value), value, `${label} is not normalized`);
  assert.equal(
    value.split("/").some((segment) => segment === "" || segment === "." || segment === ".."),
    false,
    `${label} contains an unsafe path segment`,
  );
}

function assertOutsideRepository(candidate, label) {
  const resolved = path.resolve(candidate);
  const relative = path.relative(repositoryRoot, resolved);
  assert(
    relative === ".." || relative.startsWith(`..${path.sep}`),
    `${label} must be outside the source checkout`,
  );
}

function assertInsideRoot(root, candidate, label) {
  const relative = path.relative(realpathSync(root), candidate);
  assert(
    relative === "" ||
      (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)),
    `package path escapes root: ${label}`,
  );
}

function toPosixRelative(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function hashFile(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function parseJson(value) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function lastJsonLine(output) {
  const values = output.split(/\r?\n/).map(parseJson).filter(Boolean);
  assert(values.length > 0, `expected JSON output: ${output}`);
  return values.at(-1);
}

function canonicalRootFromEnvironment() {
  const configured = process.env.AUGNES_CANONICAL_TEMP_ROOT;
  if (!configured || !path.isAbsolute(configured) || !existsSync(configured)) return null;
  const resolved = realpathSync(configured);
  assertOutsideRepository(resolved, "canonical temporary root");
  return resolved;
}

function removeRuntimeScenario(scenario) {
  rmSync(scenario.root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}

async function waitForProcessGone(pid, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!isProcessAlive(pid)) return;
    await delay(50);
  }
  assert.equal(isProcessAlive(pid), false, `owned PID ${pid} remained alive`);
}

function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === "EPERM";
  }
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", `'"'"'`)}'`;
}

function compareCodeUnits(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
