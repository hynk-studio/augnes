#!/usr/bin/env node

import { createRequire } from "node:module";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  DISTRIBUTABLE_MANIFEST_FILE,
  PublicDistributablePackageError,
  compareVersions,
  detectDistributablePlatform,
  validateDistributableManifest,
  verifyDistributableFileEntries,
} from "./distributable-package-contract.mjs";

export const DISTRIBUTABLE_LAUNCHER_CONTRACT =
  "augnes.distributable.launcher.v1";
export const DISTRIBUTABLE_LAUNCHER_SCHEMA_VERSION = 1;

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultPackageRoot = path.resolve(scriptDirectory, "..");
const MAX_MANIFEST_BYTES = 16 * 1024 * 1024;
const PUBLIC_COMMANDS = new Set(["diagnostics", "start", "status", "stop"]);

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
    importSupervisor = defaultImportSupervisor,
    validateNativeDependency = true,
  } = {},
) {
  try {
    const preflight = preflightDistributablePackage({
      packageRoot,
      platform,
      runtime,
      validateNativeDependency,
    });
    const supervisor = await importSupervisor(preflight.packageRoot);
    if (typeof supervisor?.runRuntimeSupervisorCli !== "function") {
      throw new PublicDistributablePackageError(
        "package_supervisor_entry_invalid",
      );
    }
    return await supervisor.runRuntimeSupervisorCli(argv, process.env);
  } catch (error) {
    output(
      JSON.stringify({
        schema_version: DISTRIBUTABLE_LAUNCHER_SCHEMA_VERSION,
        contract: DISTRIBUTABLE_LAUNCHER_CONTRACT,
        command: publicCommand(argv),
        result: "failed",
        state: "unavailable",
        reason:
          error instanceof PublicDistributablePackageError
            ? error.code
            : "package_preflight_failed",
      }),
    );
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
  if (validateNativeDependency) {
    verifyNativeDependency(physicalPackageRoot);
  }
  return Object.freeze({
    packageRoot: physicalPackageRoot,
    manifest,
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

function verifyNativeDependency(packageRoot) {
  try {
    const packageRequire = createRequire(path.join(packageRoot, "server.js"));
    const resolvedModule = realpathSync(
      packageRequire.resolve("better-sqlite3"),
    );
    assertInside(packageRoot, resolvedModule);
    const nativeBinding = path.join(
      packageRoot,
      "node_modules",
      "better-sqlite3",
      "build",
      "Release",
      "better_sqlite3.node",
    );
    const bindingStats = lstatSync(nativeBinding);
    if (!bindingStats.isFile() || bindingStats.isSymbolicLink()) {
      throw new Error("native binding is not a regular file");
    }
    assertInside(packageRoot, realpathSync(nativeBinding));
    const Database = packageRequire("better-sqlite3");
    const database = new Database(":memory:");
    try {
      if (database.prepare("SELECT 1 AS ready").get()?.ready !== 1) {
        throw new Error("native dependency query failed");
      }
    } finally {
      database.close();
    }
  } catch (error) {
    throw new PublicDistributablePackageError(
      "package_native_dependency_invalid",
      error,
    );
  }
}

async function defaultImportSupervisor(packageRoot) {
  return import(
    pathToFileURL(
      path.join(packageRoot, "scripts", "augnes-runtime-supervisor.mjs"),
    ).href
  );
}

function assertInside(root, candidate) {
  const relative = path.relative(root, candidate);
  if (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  ) {
    return;
  }
  throw new PublicDistributablePackageError("package_integrity_failed");
}

function publicCommand(argv) {
  const candidate = argv[0] ?? "start";
  return PUBLIC_COMMANDS.has(candidate) ? candidate : "invalid";
}

function isDirectExecution() {
  return (
    Boolean(process.argv[1]) &&
    pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  );
}

if (isDirectExecution()) {
  process.exitCode = await runDistributableLauncher();
}
