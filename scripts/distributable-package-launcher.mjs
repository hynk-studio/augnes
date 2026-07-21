#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  chmodSync,
  closeSync,
  fstatSync,
  lstatSync,
  mkdtempSync,
  openSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  DISTRIBUTABLE_MANIFEST_FILE,
  DISTRIBUTABLE_SUPERVISOR_BUNDLE_FILE,
  PublicDistributablePackageError,
  compareVersions,
  detectDistributablePlatform,
  validateDistributableManifest,
  verifyDistributableFileEntries,
} from "./distributable-package-contract.mjs";

export const DISTRIBUTABLE_LAUNCHER_CONTRACT =
  "augnes.distributable.launcher.v2";
export const DISTRIBUTABLE_LAUNCHER_SCHEMA_VERSION = 2;

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultPackageRoot = path.resolve(scriptDirectory, "..");
const MAX_MANIFEST_BYTES = 16 * 1024 * 1024;
const NATIVE_BINDING_FILE =
  "node_modules/better-sqlite3/build/Release/better_sqlite3.node";
const VERIFIED_SQLITE_ADDON_SYMBOL = Symbol.for(
  "augnes.verified-sqlite-addon.v1",
);
const PUBLIC_COMMANDS = new Set(["diagnostics", "start", "status", "stop"]);
const PACKAGE_INCOMPATIBILITY_REASONS = new Set([
  "package_architecture_unsupported",
  "package_libc_unsupported",
  "package_native_dependency_invalid",
  "package_node_modules_abi_unsupported",
  "package_node_napi_unsupported",
  "package_node_version_unsupported",
  "package_platform_unsupported",
]);

export async function runDistributableLauncher(
  argv = process.argv.slice(2),
  {
    packageRoot = defaultPackageRoot,
    platform = detectDistributablePlatform(),
    runtime = {
      nodeVersion: process.versions.node,
      nodeModulesAbi: process.versions.modules,
      nodeNapi: process.versions.napi,
    },
    output = (value) => console.log(value),
    display = (value) => console.error(value),
    importSupervisor = defaultImportSupervisor,
    validateNativeDependency = true,
  } = {},
) {
  let preflightCompleted = false;
  try {
    const preflight = preflightDistributablePackage({
      packageRoot,
      platform,
      runtime,
      validateNativeDependency,
    });
    const supervisor = await importSupervisor(preflight);
    if (typeof supervisor?.runRuntimeSupervisorCli !== "function") {
      throw new PublicDistributablePackageError(
        "package_supervisor_entry_invalid",
      );
    }
    preflightCompleted = true;
    return await supervisor.runRuntimeSupervisorCli(argv, process.env);
  } catch (error) {
    const reason = publicLauncherFailureReason(error);
    const command = publicCommand(argv);
    const failure = publicLauncherFailure({
      command,
      reason,
      preflightCompleted,
    });
    output(
      JSON.stringify({
        schema_version: DISTRIBUTABLE_LAUNCHER_SCHEMA_VERSION,
        contract: DISTRIBUTABLE_LAUNCHER_CONTRACT,
        command,
        result: "failed",
        state: "unavailable",
        reason,
        reason_code: reason,
        outcome: failure.outcome,
        package_compatibility: failure.packageCompatibility,
        database_state: failure.databaseState,
        data_preserved: failure.dataPreserved,
        next_action: failure.nextAction,
        recovery_entry: failure.recoveryEntry,
      }),
    );
    if (!preflightCompleted && command === "start") {
      displayPreflightRecoveryCard(display, {
        reason,
        outcome: failure.outcome,
      });
    }
    return 2;
  }
}

export function preflightDistributablePackage({
  packageRoot = defaultPackageRoot,
  platform = detectDistributablePlatform(),
  runtime = {
    nodeVersion: process.versions.node,
    nodeModulesAbi: process.versions.modules,
    nodeNapi: process.versions.napi,
  },
  validateNativeDependency = true,
} = {}) {
  let physicalPackageRoot;
  try {
    if (!path.isAbsolute(packageRoot)) {
      throw new Error("package root is not absolute");
    }
    const rootStats = lstatSync(packageRoot);
    if (!rootStats.isDirectory() || rootStats.isSymbolicLink()) {
      throw new Error("package root is not a regular directory");
    }
    physicalPackageRoot = realpathSync(packageRoot);
  } catch (error) {
    throw new PublicDistributablePackageError(
      "package_integrity_failed",
      error,
    );
  }

  const manifest = readPackageManifest(physicalPackageRoot);
  validateDistributableManifest(manifest);
  validatePlatformAndRuntime(manifest, platform, runtime);
  verifyDistributableFileEntries(physicalPackageRoot, manifest);
  const supervisorIdentity = captureSupervisorIdentity(physicalPackageRoot);
  const nativeDependency = validateNativeDependency
    ? verifyNativeDependency(physicalPackageRoot, manifest)
    : null;
  return Object.freeze({
    packageRoot: physicalPackageRoot,
    manifest,
    supervisorIdentity,
    nativeDependency,
  });
}

function readPackageManifest(packageRoot) {
  const manifestPath = path.join(packageRoot, DISTRIBUTABLE_MANIFEST_FILE);
  try {
    const stats = lstatSync(manifestPath);
    if (
      !stats.isFile() ||
      stats.isSymbolicLink() ||
      stats.size === 0 ||
      stats.size > MAX_MANIFEST_BYTES
    ) {
      throw new Error("invalid manifest file");
    }
    return JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    throw new PublicDistributablePackageError(
      "package_manifest_invalid",
      error,
    );
  }
}

function validatePlatformAndRuntime(manifest, platform, runtime) {
  if (manifest.platform.os !== platform?.os) {
    throw new PublicDistributablePackageError(
      "package_platform_unsupported",
    );
  }
  if (manifest.platform.arch !== platform?.arch) {
    throw new PublicDistributablePackageError(
      "package_architecture_unsupported",
    );
  }
  if (manifest.platform.libc !== platform?.libc) {
    throw new PublicDistributablePackageError(
      "package_libc_unsupported",
    );
  }
  try {
    if (
      compareVersions(runtime?.nodeVersion, manifest.runtime.node_minimum) < 0
    ) {
      throw new PublicDistributablePackageError(
        "package_node_version_unsupported",
      );
    }
  } catch (error) {
    if (error instanceof PublicDistributablePackageError) throw error;
    throw new PublicDistributablePackageError(
      "package_node_version_unsupported",
      error,
    );
  }
  if (
    String(runtime?.nodeModulesAbi ?? "") !==
    manifest.runtime.node_modules_abi
  ) {
    throw new PublicDistributablePackageError(
      "package_node_modules_abi_unsupported",
    );
  }
  if (
    !/^\d+$/.test(String(runtime?.nodeNapi ?? "")) ||
    Number(runtime.nodeNapi) < Number(manifest.runtime.node_napi)
  ) {
    throw new PublicDistributablePackageError(
      "package_node_napi_unsupported",
    );
  }
}

function verifyNativeDependency(packageRoot, manifest) {
  try {
    return Object.freeze({
      addon: loadVerifiedDistributableNativeAddon(packageRoot, manifest),
    });
  } catch (error) {
    if (error instanceof PublicDistributablePackageError) throw error;
    throw new PublicDistributablePackageError(
      "package_native_dependency_invalid",
      error,
    );
  }
}

export function loadVerifiedDistributableNativeAddon(packageRoot, manifest) {
  let stageDirectory = null;
  try {
    if (
      typeof packageRoot !== "string" ||
      !path.isAbsolute(packageRoot) ||
      !manifest ||
      !Array.isArray(manifest.files)
    ) {
      throw new Error("native preflight is incomplete");
    }
    const expectedEntries = manifest.files.filter(
      (entry) => entry?.path === NATIVE_BINDING_FILE,
    );
    if (expectedEntries.length !== 1) {
      throw new Error("native binding manifest entry is missing");
    }
    const expected = expectedEntries[0];
    const nativePath = path.join(
      packageRoot,
      ...NATIVE_BINDING_FILE.split("/"),
    );
    const verified = readStableManifestFile(nativePath, expected);
    stageDirectory = mkdtempSync(
      path.join(tmpdir(), "augnes-native-preflight-"),
    );
    chmodSync(stageDirectory, 0o700);
    const stagedPath = path.join(stageDirectory, "better_sqlite3.node");
    writeFileSync(stagedPath, verified.bytes, { flag: "wx", mode: 0o600 });
    chmodSync(stagedPath, 0o600);
    const staged = readStableManifestFile(stagedPath, {
      ...expected,
      mode: 0o600,
    });
    if (
      staged.identity.dev === verified.identity.dev &&
      staged.identity.ino === verified.identity.ino
    ) {
      throw new Error("native staging identity was not independent");
    }
    const packageRequire = createRequire(import.meta.url);
    const addon = packageRequire(stagedPath);
    const afterLoad = lstatSync(stagedPath, { bigint: true });
    if (
      afterLoad.dev.toString() !== staged.identity.dev ||
      afterLoad.ino.toString() !== staged.identity.ino ||
      typeof addon?.Database !== "function" ||
      typeof addon?.setErrorConstructor !== "function"
    ) {
      throw new Error("native binding load changed");
    }
    delete packageRequire.cache[stagedPath];
    return addon;
  } catch (error) {
    if (error instanceof PublicDistributablePackageError) throw error;
    throw new PublicDistributablePackageError(
      "package_native_dependency_invalid",
      error,
    );
  } finally {
    if (stageDirectory !== null) {
      rmSync(stageDirectory, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 20,
      });
    }
  }
}

function readStableManifestFile(filePath, expected) {
  let descriptor = null;
  try {
    const beforePath = lstatSync(filePath, { bigint: true });
    const identity = {
      dev: beforePath.dev.toString(),
      ino: beforePath.ino.toString(),
    };
    assertManifestFile(beforePath, expected, identity);
    descriptor = openSync(filePath, "r");
    const beforeDescriptor = fstatSync(descriptor, { bigint: true });
    assertManifestFile(beforeDescriptor, expected, identity);
    const bytes = readFileSync(descriptor);
    const afterDescriptor = fstatSync(descriptor, { bigint: true });
    const afterPath = lstatSync(filePath, { bigint: true });
    assertManifestFile(afterDescriptor, expected, identity);
    assertManifestFile(afterPath, expected, identity);
    if (
      bytes.length !== expected.size ||
      createHash("sha256").update(bytes).digest("hex") !== expected.sha256
    ) {
      throw new Error("manifest file bytes changed");
    }
    return { bytes, identity };
  } finally {
    if (descriptor !== null) closeSync(descriptor);
  }
}

function assertManifestFile(stats, expected, identity) {
  if (
    !stats.isFile() ||
    stats.isSymbolicLink() ||
    stats.dev.toString() !== identity.dev ||
    stats.ino.toString() !== identity.ino ||
    Number(stats.size) !== expected.size ||
    !compatibleExtractedMode(Number(stats.mode & 0o777n), expected.mode)
  ) {
    throw new Error("manifest file identity changed");
  }
}

function captureSupervisorIdentity(packageRoot) {
  try {
    const filePath = path.join(
      packageRoot,
      ...DISTRIBUTABLE_SUPERVISOR_BUNDLE_FILE.split("/"),
    );
    const stats = lstatSync(filePath, { bigint: true });
    if (!stats.isFile() || stats.isSymbolicLink()) {
      throw new Error("supervisor bundle is not a regular file");
    }
    return Object.freeze({
      dev: stats.dev.toString(),
      ino: stats.ino.toString(),
    });
  } catch (error) {
    throw new PublicDistributablePackageError(
      "package_integrity_failed",
      error,
    );
  }
}

export function loadVerifiedDistributableSupervisor(preflight) {
  let descriptor = null;
  try {
    const packageRoot = preflight?.packageRoot;
    const manifest = preflight?.manifest;
    const expectedIdentity = preflight?.supervisorIdentity;
    const addon = preflight?.nativeDependency?.addon;
    if (
      typeof packageRoot !== "string" ||
      !path.isAbsolute(packageRoot) ||
      !manifest ||
      !Array.isArray(manifest.files) ||
      typeof addon?.Database !== "function" ||
      typeof expectedIdentity?.dev !== "string" ||
      typeof expectedIdentity?.ino !== "string"
    ) {
      throw new Error("verified supervisor preflight is incomplete");
    }
    const expectedEntries = manifest.files.filter(
      (entry) => entry?.path === DISTRIBUTABLE_SUPERVISOR_BUNDLE_FILE,
    );
    if (expectedEntries.length !== 1) {
      throw new Error("verified supervisor manifest entry is missing");
    }
    const expected = expectedEntries[0];
    const bundlePath = path.join(
      packageRoot,
      ...DISTRIBUTABLE_SUPERVISOR_BUNDLE_FILE.split("/"),
    );
    const beforePath = lstatSync(bundlePath, { bigint: true });
    assertSupervisorFile(beforePath, expected, expectedIdentity);
    descriptor = openSync(bundlePath, "r");
    const beforeDescriptor = fstatSync(descriptor, { bigint: true });
    assertSupervisorFile(beforeDescriptor, expected, expectedIdentity);
    const source = readFileSync(descriptor);
    const afterDescriptor = fstatSync(descriptor, { bigint: true });
    const afterPath = lstatSync(bundlePath, { bigint: true });
    assertSupervisorFile(afterDescriptor, expected, expectedIdentity);
    assertSupervisorFile(afterPath, expected, expectedIdentity);
    if (
      source.length !== expected.size ||
      createHash("sha256").update(source).digest("hex") !== expected.sha256
    ) {
      throw new Error("verified supervisor bytes changed");
    }
    return evaluateVerifiedSupervisorSource(source.toString("utf8"), {
      bundlePath,
      addon,
      expectedSchemaSignature: manifest.database?.schema_signature,
    });
  } catch (error) {
    if (error instanceof PublicDistributablePackageError) throw error;
    throw new PublicDistributablePackageError(
      "package_integrity_failed",
      error,
    );
  } finally {
    if (descriptor !== null) closeSync(descriptor);
  }
}

function assertSupervisorFile(stats, expected, expectedIdentity) {
  const mode = Number(stats.mode & 0o777n);
  if (
    !stats.isFile() ||
    stats.isSymbolicLink() ||
    stats.dev.toString() !== expectedIdentity.dev ||
    stats.ino.toString() !== expectedIdentity.ino ||
    Number(stats.size) !== expected.size ||
    !compatibleExtractedMode(mode, expected.mode)
  ) {
    throw new Error("verified supervisor identity changed");
  }
}

function evaluateVerifiedSupervisorSource(
  source,
  { bundlePath, addon, expectedSchemaSignature },
) {
  const launcherRequire = createRequire(import.meta.url);
  const Module = launcherRequire("node:module");
  const loaded = new Module(bundlePath);
  loaded.filename = bundlePath;
  loaded.paths = Module._nodeModulePaths(path.dirname(bundlePath));
  globalThis[VERIFIED_SQLITE_ADDON_SYMBOL] = addon;
  try {
    loaded._compile(source, bundlePath);
  } finally {
    delete globalThis[VERIFIED_SQLITE_ADDON_SYMBOL];
  }
  if (
    typeof loaded.exports?.verifyRuntimeNativeDependency !== "function" ||
    typeof loaded.exports?.verifyRuntimeBundledSchemaContract !== "function"
  ) {
    throw new Error("verified supervisor self-checks are missing");
  }
  loaded.exports.verifyRuntimeNativeDependency();
  loaded.exports.verifyRuntimeBundledSchemaContract(expectedSchemaSignature);
  return loaded.exports;
}

function compatibleExtractedMode(actual, expected) {
  if (process.platform === "win32") return true;
  return (
    (actual & ~expected) === 0 &&
    (actual & (expected === 0o755 ? 0o500 : 0o400)) ===
      (expected === 0o755 ? 0o500 : 0o400)
  );
}

async function defaultImportSupervisor(preflight) {
  return loadVerifiedDistributableSupervisor(preflight);
}

function publicCommand(argv) {
  const candidate = argv[0] ?? "start";
  return PUBLIC_COMMANDS.has(candidate) ? candidate : "invalid";
}

function publicLauncherFailureReason(error) {
  if (
    error instanceof PublicDistributablePackageError &&
    typeof error.code === "string" &&
    /^[a-z][a-z0-9_]{0,127}$/u.test(error.code)
  ) {
    return error.code;
  }
  return "package_preflight_failed";
}

function publicLauncherFailure({ command, reason, preflightCompleted }) {
  if (preflightCompleted) {
    return {
      outcome: "package_runtime_unavailable",
      packageCompatibility: "verified",
      databaseState: "unknown",
      dataPreserved: null,
      nextAction: "review_runtime_status",
      recoveryEntry: null,
    };
  }
  const incompatible = PACKAGE_INCOMPATIBILITY_REASONS.has(reason);
  const nextAction =
    command === "stop"
      ? "use_previous_verified_compatible_package_to_stop_runtime"
      : command === "diagnostics" || command === "status"
        ? "use_previous_verified_compatible_package_for_status"
        : command === "invalid"
          ? "use_a_supported_package_command"
          : "launch_previous_verified_compatible_package";
  return {
    outcome: incompatible ? "incompatible_package" : "package_integrity_failed",
    packageCompatibility: incompatible ? "incompatible" : "verification_failed",
    databaseState: "not_opened",
    dataPreserved: true,
    nextAction,
    recoveryEntry: "launcher_guidance",
  };
}

function displayPreflightRecoveryCard(display, { reason, outcome }) {
  if (typeof display !== "function") return;
  const card = [
    "Augnes package recovery",
    outcome === "incompatible_package"
      ? "Status: This package is not compatible with this computer."
      : "Status: This package did not pass integrity verification.",
    `Reason code: ${reason}`,
    "Data status: No Augnes data was changed by this launch.",
    "Next safe action: Start Augnes with the previous verified compatible package.",
  ].join("\n");
  try {
    display(card);
  } catch {
    // Machine-readable stdout remains available if the human display is closed.
  }
}

function isDirectExecution() {
  return (
    Boolean(process.argv[1]) &&
    pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  );
}

if (isDirectExecution()) {
  void runDistributableLauncher().then((code) => {
    process.exitCode = code;
  });
}
