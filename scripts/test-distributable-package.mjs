#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
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
  DISTRIBUTABLE_APPLICATION_SCOPE_FINGERPRINT,
  DISTRIBUTABLE_SUPPORTED_OPERATING_SYSTEMS,
  assertAllowedDistributablePayloadPath,
  detectDistributablePlatform,
  formatDistributablePlatformLabel,
  validateDistributableManifest,
} from "./distributable-package-contract.mjs";

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
let fakePackageManagerSentinel = null;
let suiteError = null;
let cleanupError = null;
let childNetworkEvidence = { blockedAttempts: 0, guardedProcesses: 0 };

const networkGuard = installZeroNetworkGuard({
  allowLoopback: true,
  errorPrefix: "distributable_package_external_network_forbidden",
});

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

  await assertDirectSupervisorCannotBypassPreflight(packageRoot);
  await assertInvalidCanonicalImportRefusesBeforeDurableMutation(packageRoot);
  await assertPlatformRefusalBeforeDurableMutation(packageRoot, packageManifest);

  const lifecycleStartedAt = Date.now();
  await testFreshAndCurrentPackagedRuntime(packageRoot, packageManifest);
  durations.fresh_and_current_runtime_ms = Date.now() - lifecycleStartedAt;

  const startupFailureStartedAt = Date.now();
  await testInvalidBridgeProfileCleanup(packageRoot);
  durations.startup_failure_cleanup_ms = Date.now() - startupFailureStartedAt;

  const startupTimeoutStartedAt = Date.now();
  await testStartupTimeoutCleanup(packageRoot);
  durations.startup_timeout_cleanup_ms = Date.now() - startupTimeoutStartedAt;

  const requiredCrashStartedAt = Date.now();
  await testRequiredBridgeCrashCleanup(packageRoot);
  durations.required_child_crash_cleanup_ms = Date.now() - requiredCrashStartedAt;

  const reconciliationStartedAt = Date.now();
  await testHardCrashReconciliation(packageRoot);
  durations.hard_crash_reconciliation_ms = Date.now() - reconciliationStartedAt;

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

console.log(
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
      source_checkout_runtime_dependency: false,
      package_manager_runtime_invocations: 0,
      initial_database_created_without_demo_seed: true,
      current_database_restart_verified: true,
      missing_provider_and_host_capabilities_truthful: true,
      occupied_preferred_ports_skipped: true,
      duplicate_launch_reused: true,
      startup_child_failure_cleanup_verified: true,
      startup_timeout_cleanup_verified: true,
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

function findPackageRoot(destination) {
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
    path.basename(artifactPath).replace(/\.tar\.gz$/, ""),
  );
  return realpathSync(candidates[0]);
}

function validatePackageContents(root) {
  const manifestPath = path.join(root, "augnes-package.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  assert.equal(manifest.contract, PACKAGE_CONTRACT);
  assert.equal(manifest.package_contract_version, 1);
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

async function assertDirectSupervisorCannotBypassPreflight(root) {
  const scenario = createRuntimeScenario("direct-supervisor-preflight");
  const environment = runtimeEnvironment(scenario, {
    uiPort: await availablePreferredPort(),
    bridgePort: await availablePreferredPort(),
  });
  const serverPath = path.join(root, "server.js");
  const manifestPath = path.join(root, "augnes-package.json");
  const manifestBackupPath = path.join(root, ".augnes-package.test-backup.json");
  const original = readFileSync(serverPath);
  const originalMode = lstatSync(serverPath).mode & 0o777;
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
    assert.equal(lastJsonLine(result.output).reason, "package_integrity_failed");

    writeFileSync(serverPath, original);
    if (process.platform !== "win32") chmodSync(serverPath, originalMode);
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
    assert.equal(
      lastJsonLine(missingManifest.output).reason,
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
    removeRuntimeScenario(scenario);
  }
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
    const code = await launcher.runDistributableLauncher([], {
      packageRoot: root,
      platform: refusalCase.platform,
      runtime: refusalCase.runtime,
      validateNativeDependency: false,
      output: (value) => output.push(value),
      importSupervisor: async () => {
        mkdirSync(durableRoot, { recursive: true });
        throw new Error("supervisor import must be unreachable after refusal");
      },
    });
    assert.equal(code, 2);
    assert.equal(output.length, 1);
    const refusal = JSON.parse(output[0]);
    assert.equal(refusal.result, "failed");
    assert.equal(refusal.state, "unavailable");
    assert.equal(refusal.reason, refusalCase.expectedReason);
    assert.equal(existsSync(durableRoot), false);
  }
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
  removeRuntimeScenario(scenario);
}

async function testInvalidBridgeProfileCleanup(root) {
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
  removeRuntimeScenario(scenario);
}

async function testStartupTimeoutCleanup(root) {
  const scenario = createRuntimeScenario("startup-timeout");
  const uiPort = await availablePreferredPort();
  let bridgePort = await availablePreferredPort();
  while (bridgePort === uiPort) bridgePort = await availablePreferredPort();
  observedOwnedPorts.add(uiPort);
  observedOwnedPorts.add(bridgePort);
  const environment = runtimeEnvironment(scenario, {
    uiPort,
    bridgePort,
    extra: {
      AUGNES_TEST_RUNTIME_STALL_READINESS_ROLE: "bridge",
      AUGNES_TEST_RUNTIME_STARTUP_TIMEOUT_MS: "750",
    },
  });
  const managed = startPackagedRuntime(root, environment, "packaged startup timeout");
  const exit = await waitForManagedProcess(managed, PROCESS_EXIT_TIMEOUT_MS);
  assert.notEqual(exit.code, 0, managed.output());
  const failed = managed.events.find(
    (event) =>
      event.command === "start" &&
      event.result === "failed" &&
      event.reason === "bridge_startup_timeout",
  );
  assert(failed, managed.output());
  await assertFailureScenarioClean(scenario, environment);
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

function packageBuildEnvironment() {
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
    TMPDIR: buildTemporaryRoot,
    TMP: buildTemporaryRoot,
    TEMP: buildTemporaryRoot,
    HOME: packageToolHomeRoot,
    USERPROFILE: packageToolHomeRoot,
    NODE_ENV: "production",
    NODE_OPTIONS: `--import=${pathToFileURL(packageNetworkGuardImport).href}`,
    NEXT_TELEMETRY_DISABLED: "1",
    AUGNES_CANONICAL_TEST_MODE: "1",
    AUGNES_CANONICAL_TEMP_ROOT: testRoot,
    AUGNES_CANONICAL_TEST_NODE_IMPORT: packageNetworkGuardImport,
    AUGNES_PACKAGE_OUTPUT_DIR: artifactOutputRoot,
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
  const packageBuildPids = new Set(
    ready
      .filter((record) => record.label === "package-build")
      .map((record) => record.pid),
  );
  assert(
    packageBuildPids.size >= 3,
    "npm, the package builder, and nested production-build Node processes must install the zero-network guard",
  );
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

function listBuildTemporaryEntries() {
  return readdirSync(buildTemporaryRoot)
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
  observedOwnedPorts.add(ready.ui_port);
  observedOwnedPorts.add(ready.bridge_port);
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
  const server = trackServerConnections(net.createServer());
  ownedServers.add(server);
  await listenServer(server, 0);
  const address = server.address();
  assert(address && typeof address === "object");
  const port = address.port;
  await closeTrackedServer(server, { timeoutMs: 3_000 });
  ownedServers.delete(server);
  return port;
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
  return { status: response.status, body: await response.text(), url: response.url };
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
