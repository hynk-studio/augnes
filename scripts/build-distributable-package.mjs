#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createRequire } from "node:module";
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
  unlinkSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  DISTRIBUTABLE_DATABASE_MIGRATION_CONTRACT,
  DISTRIBUTABLE_DATABASE_MIGRATION_CONTRACT_VERSION,
  DISTRIBUTABLE_DATABASE_MIGRATION_IDS,
  DISTRIBUTABLE_DATABASE_READER_CONTRACTS,
  DISTRIBUTABLE_DATABASE_RECORD_CONTRACT,
  DISTRIBUTABLE_DATABASE_RECORD_CONTRACT_VERSION,
  DISTRIBUTABLE_DATABASE_SCHEMA_CONTRACT,
  DISTRIBUTABLE_DATABASE_SCHEMA_COMPATIBILITY,
  DISTRIBUTABLE_DATABASE_SUPPORTED_SOURCE_SCHEMA_SIGNATURES,
  DISTRIBUTABLE_MANIFEST_FILE,
  DISTRIBUTABLE_NODE_MINIMUM,
  DISTRIBUTABLE_PACKAGE_CONTRACT,
  DISTRIBUTABLE_PACKAGE_CONTRACT_VERSION,
  DISTRIBUTABLE_RUNTIME_CONTRACT,
  DISTRIBUTABLE_RUNTIME_SCHEMA_VERSION,
  DISTRIBUTABLE_RUNTIME_SCRIPTS,
  DISTRIBUTABLE_RECOVERY_VALIDATOR_BUNDLE_FILE,
  DISTRIBUTABLE_SUPERVISOR_BUNDLE_FILE,
  DISTRIBUTABLE_SUPPORTED_OPERATING_SYSTEMS,
  PublicDistributablePackageError,
  assertAllowedDistributablePayloadPath,
  assertSafeDistributablePath,
  collectDistributableFileEntries,
  compareVersions,
  createDistributableManifest,
  detectDistributablePlatform,
  formatDistributablePlatformLabel,
  verifyDistributableFileEntries,
} from "./distributable-package-contract.mjs";
import { canonicalStructuralSchemaContractSignature } from "./runtime-database-bootstrap.mjs";
import {
  registerOwnedChild,
  terminateOwnedProcessTree,
  waitForOwnedProcessExit,
} from "./test-harness-process-lifecycle.mjs";

const defaultRepositoryRoot = realpathSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
);
const NORMALIZED_MODIFICATION_TIME = new Date("2000-01-01T00:00:00.000Z");
const PACKAGE_BUILD_TIMEOUT_MS = 150_000;
const ARCHIVE_TOOL_TIMEOUT_MS = 30_000;
const PACKAGE_TOOL_ENVIRONMENT_KEYS = Object.freeze([
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
]);
const TEXT_FILE_SUFFIXES = new Set([
  "",
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".rsc",
  ".sql",
  ".txt",
]);

export async function buildDistributablePackage({
  repositoryRoot = defaultRepositoryRoot,
  environment = process.env,
} = {}) {
  const sourceRoot = realpathSync(repositoryRoot);
  assertRepositoryRoot(sourceRoot);
  assertBuildRuntime();
  assertRuntimeContractMatchesSource(sourceRoot);

  const sourcePackage = readSourcePackage(sourceRoot);
  const platform = detectDistributablePlatform();
  const platformLabel = formatDistributablePlatformLabel(platform);
  const artifactName = `augnes-${sourcePackage.version}-${platformLabel}.tar.gz`;
  const packageDirectory = artifactName.slice(0, -".tar.gz".length);
  assertSafeDistributablePath(packageDirectory);
  const artifactDirectory = resolveArtifactDirectory(sourceRoot, environment);
  const artifactPath = path.join(artifactDirectory.path, artifactName);
  const temporaryArchivePath = path.join(
    artifactDirectory.path,
    `.augnes-package-${process.pid}-${Date.now()}.tar.gz`,
  );
  const temporaryDirectory = mkdtempSync(
    path.join(os.tmpdir(), "augnes-distributable-build-"),
  );
  const archiveRoot = path.join(temporaryDirectory, "archive");
  const stagingRoot = path.join(archiveRoot, packageDirectory);
  const archiveListPath = path.join(temporaryDirectory, "archive-files.txt");
  const toolEnvironment = createPackageToolEnvironment(environment);

  try {
    mkdirSync(stagingRoot, { recursive: true, mode: 0o755 });
    await runProductionBuild(sourceRoot, toolEnvironment);
    stageStandaloneRuntime(sourceRoot, stagingRoot);
    buildBridgeBundle(sourceRoot, stagingRoot);
    await buildSupervisorBundle(sourceRoot, stagingRoot);
    buildRecoveryCanonicalValidatorBundle(sourceRoot, stagingRoot);
    stageRuntimeSupport(sourceRoot, stagingRoot, sourcePackage);
    sanitizePrivateBuildPaths(stagingRoot, sourceRoot, environment);
    normalizePackageMetadata(stagingRoot);
    validateStagedNativeDependency(stagingRoot);

    const files = collectDistributableFileEntries(stagingRoot);
    const manifest = createDistributableManifest({
      applicationVersion: sourcePackage.version,
      platform,
      runtime: {
        node_minimum: DISTRIBUTABLE_NODE_MINIMUM,
        node_modules_abi: process.versions.modules,
        node_napi: process.versions.napi,
        runtime_contract: DISTRIBUTABLE_RUNTIME_CONTRACT,
        runtime_schema_version: DISTRIBUTABLE_RUNTIME_SCHEMA_VERSION,
      },
      database: {
        schema_compatibility:
          DISTRIBUTABLE_DATABASE_SCHEMA_COMPATIBILITY,
        schema_contract: DISTRIBUTABLE_DATABASE_SCHEMA_CONTRACT,
        schema_signature: canonicalStructuralSchemaContractSignature(),
        migration_contract: DISTRIBUTABLE_DATABASE_MIGRATION_CONTRACT,
        migration_contract_version:
          DISTRIBUTABLE_DATABASE_MIGRATION_CONTRACT_VERSION,
        migration_ids: [...DISTRIBUTABLE_DATABASE_MIGRATION_IDS],
        record_contract: DISTRIBUTABLE_DATABASE_RECORD_CONTRACT,
        record_contract_version:
          DISTRIBUTABLE_DATABASE_RECORD_CONTRACT_VERSION,
        reader_contracts: [...DISTRIBUTABLE_DATABASE_READER_CONTRACTS],
        supported_source_schema_signatures: [
          ...DISTRIBUTABLE_DATABASE_SUPPORTED_SOURCE_SCHEMA_SIGNATURES,
        ],
        supported_source_schema_states: ["current", "old"],
      },
      files,
    });
    const manifestPath = path.join(stagingRoot, DISTRIBUTABLE_MANIFEST_FILE);
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o644,
      flag: "wx",
    });
    normalizeFileMetadata(manifestPath, 0o644);
    verifyDistributableFileEntries(stagingRoot, manifest);

    const archiveEntries = collectDistributableFileEntries(stagingRoot, {
      includeManifest: true,
    }).map((entry) => `${packageDirectory}/${entry.path}`);
    writeFileSync(archiveListPath, `${archiveEntries.join("\n")}\n`, {
      encoding: "utf8",
      mode: 0o600,
      flag: "wx",
    });
    await createArchive({
      stagingRoot: archiveRoot,
      archiveListPath,
      temporaryArchivePath,
      environment: toolEnvironment,
    });
    publishArchive(temporaryArchivePath, artifactPath);

    const result = {
      contract: DISTRIBUTABLE_PACKAGE_CONTRACT,
      package_contract_version: DISTRIBUTABLE_PACKAGE_CONTRACT_VERSION,
      result: "created",
      artifact: artifactDirectory.publicPath(artifactName),
      package_root: packageDirectory,
      application_version: sourcePackage.version,
      build_identity: manifest.build_identity,
      platform: manifest.platform,
      file_count: manifest.files.length,
    };
    console.log(JSON.stringify(result));
    return { ...result, artifactPath, manifest };
  } finally {
    removeRegularFileIfPresent(temporaryArchivePath);
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

async function runProductionBuild(sourceRoot, environment) {
  await runNode(
    sourceRoot,
    path.join(sourceRoot, "scripts", "build-with-isolated-db.mjs"),
    [],
    {
      ...environment,
      NEXT_TELEMETRY_DISABLED: "1",
    },
    "package_ui_build_failed",
  );
}

function stageStandaloneRuntime(sourceRoot, stagingRoot) {
  const standaloneRoot = path.join(sourceRoot, ".next", "standalone");
  assertSafeSourceDirectory(sourceRoot, standaloneRoot);

  copyRuntimeFile(
    sourceRoot,
    path.join(standaloneRoot, "server.js"),
    stagingRoot,
    "server.js",
  );
  copyRuntimeTree(
    sourceRoot,
    path.join(standaloneRoot, ".next"),
    stagingRoot,
    ".next",
    { omitSourceMaps: true, materializeNextNativeAliases: true },
  );
  copyRuntimeTree(
    sourceRoot,
    path.join(sourceRoot, ".next", "static"),
    stagingRoot,
    ".next/static",
    { omitSourceMaps: true },
  );
  copyRuntimeTree(
    sourceRoot,
    path.join(standaloneRoot, "node_modules"),
    stagingRoot,
    "node_modules",
    { omitSourceMaps: true },
  );
}

function buildBridgeBundle(sourceRoot, stagingRoot) {
  const bridgeEntry = path.join(
    sourceRoot,
    "apps",
    "augnes_apps",
    "src",
    "server.ts",
  );
  const bridgeOutput = packagePath(stagingRoot, "bridge/dist/server.mjs");
  assertSafeSourceFile(sourceRoot, bridgeEntry);
  mkdirSync(path.dirname(bridgeOutput), { recursive: true, mode: 0o755 });
  try {
    const sourceRequire = createRequire(path.join(sourceRoot, "package.json"));
    const { buildSync } = sourceRequire("esbuild");
    buildSync({
      entryPoints: [bridgeEntry],
      bundle: true,
      platform: "node",
      format: "esm",
      target: "node20.9",
      charset: "utf8",
      legalComments: "none",
      logLevel: "warning",
      outfile: bridgeOutput,
      banner: {
        js: "import { createRequire as __augnesCreateRequire } from \"node:module\"; const require = __augnesCreateRequire(import.meta.url);",
      },
      define: {
        "process.env.NODE_ENV": JSON.stringify("production"),
      },
    });
  } catch (error) {
    throw new PublicDistributablePackageError(
      "package_bridge_build_failed",
      error,
    );
  }
}

function buildRecoveryCanonicalValidatorBundle(sourceRoot, stagingRoot) {
  const validatorEntry = path.join(
    sourceRoot,
    "scripts",
    "recovery-canonical-record-validator.ts",
  );
  const validatorOutput = packagePath(
    stagingRoot,
    DISTRIBUTABLE_RECOVERY_VALIDATOR_BUNDLE_FILE,
  );
  assertSafeSourceFile(sourceRoot, validatorEntry);
  mkdirSync(path.dirname(validatorOutput), { recursive: true, mode: 0o755 });
  try {
    const sourceRequire = createRequire(path.join(sourceRoot, "package.json"));
    const { buildSync } = sourceRequire("esbuild");
    buildSync({
      absWorkingDir: sourceRoot,
      entryPoints: [validatorEntry],
      bundle: true,
      external: ["better-sqlite3"],
      platform: "node",
      format: "cjs",
      target: "node20.9",
      charset: "utf8",
      legalComments: "none",
      logLevel: "warning",
      outfile: validatorOutput,
      tsconfig: path.join(sourceRoot, "tsconfig.json"),
      define: {
        "process.env.NODE_ENV": JSON.stringify("production"),
      },
    });
  } catch (error) {
    throw new PublicDistributablePackageError(
      "package_recovery_validator_build_failed",
      error,
    );
  }
}

async function buildSupervisorBundle(sourceRoot, stagingRoot) {
  const supervisorEntry = path.join(
    sourceRoot,
    "scripts",
    "augnes-runtime-supervisor-core.mjs",
  );
  const supervisorOutput = packagePath(
    stagingRoot,
    DISTRIBUTABLE_SUPERVISOR_BUNDLE_FILE,
  );
  const validatorEntry = path.join(
    sourceRoot,
    "scripts",
    "recovery-canonical-record-validator.ts",
  );
  const schemaEntry = path.join(sourceRoot, "lib", "db", "schema.sql");
  assertSafeSourceFile(sourceRoot, supervisorEntry);
  assertSafeSourceFile(sourceRoot, validatorEntry);
  assertSafeSourceFile(sourceRoot, schemaEntry);
  const bundledSchema = readFileSync(schemaEntry, "utf8");
  mkdirSync(path.dirname(supervisorOutput), { recursive: true, mode: 0o755 });
  try {
    const sourceRequire = createRequire(path.join(sourceRoot, "package.json"));
    const { build } = sourceRequire("esbuild");
    await build({
      absWorkingDir: sourceRoot,
      entryPoints: [supervisorEntry],
      bundle: true,
      plugins: [
        {
          name: "augnes-verified-recovery-validator",
          setup(build) {
            build.onResolve(
              { filter: /recovery-canonical-record-validator\.mjs$/ },
              () => ({ path: validatorEntry }),
            );
          },
        },
        {
          name: "augnes-verified-sqlite-addon",
          setup(build) {
            build.onResolve({ filter: /^bindings$/ }, () => ({
              path: "verified-sqlite-addon",
              namespace: "augnes-native",
            }));
            build.onLoad(
              { filter: /.*/, namespace: "augnes-native" },
              () => ({
                contents:
                  "module.exports = () => __augnesVerifiedSqliteAddon;",
                loader: "js",
              }),
            );
          },
        },
      ],
      platform: "node",
      format: "cjs",
      target: "node20.9",
      charset: "utf8",
      legalComments: "none",
      logLevel: "warning",
      outfile: supervisorOutput,
      banner: {
        js: 'const __augnesImportMetaUrl = require("node:url").pathToFileURL(__filename).href; const __augnesVerifiedSqliteAddon = globalThis[Symbol.for("augnes.verified-sqlite-addon.v1")]; if (!__augnesVerifiedSqliteAddon) throw new Error("verified sqlite addon missing");',
      },
      define: {
        __AUGNES_BUNDLED_SCHEMA_SQL__: JSON.stringify(bundledSchema),
        "import.meta.url": "__augnesImportMetaUrl",
        "process.env.NODE_ENV": JSON.stringify("production"),
      },
    });
  } catch (error) {
    throw new PublicDistributablePackageError(
      "package_supervisor_bundle_build_failed",
      error,
    );
  }
}

function stageRuntimeSupport(sourceRoot, stagingRoot, sourcePackage) {
  for (const relativePath of DISTRIBUTABLE_RUNTIME_SCRIPTS) {
    copyRuntimeFile(
      sourceRoot,
      packagePath(sourceRoot, relativePath),
      stagingRoot,
      relativePath,
    );
  }
  for (const relativePath of [
    "lib/db/schema.sql",
    "lib/db/proposal-scoring-schema.json",
    "lib/db/recovery-private-material-contract.mjs",
    "apps/augnes_apps/public/console-widget.html",
  ]) {
    const destination =
      relativePath === "apps/augnes_apps/public/console-widget.html"
        ? "bridge/public/console-widget.html"
        : relativePath;
    copyRuntimeFile(
      sourceRoot,
      packagePath(sourceRoot, relativePath),
      stagingRoot,
      destination,
    );
  }

  writePackageFile(
    stagingRoot,
    "package.json",
    `${JSON.stringify(
      {
        name: sourcePackage.name,
        version: sourcePackage.version,
        private: true,
      },
      null,
      2,
    )}\n`,
    0o644,
  );
  writePackageFile(
    stagingRoot,
    "augnes.mjs",
    [
      'import path from "node:path";',
      'import { pathToFileURL } from "node:url";',
      'import { runDistributableLauncher } from "./scripts/distributable-package-launcher.mjs";',
      "",
      'export { preflightDistributablePackage, runDistributableLauncher } from "./scripts/distributable-package-launcher.mjs";',
      "",
      "const directExecution =",
      "  Boolean(process.argv[1]) &&",
      "  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;",
      "if (directExecution) process.exitCode = await runDistributableLauncher();",
      "",
    ].join("\n"),
    0o644,
  );
  writePackageFile(
    stagingRoot,
    "augnes",
    [
      "#!/bin/sh",
      "set -eu",
      'AUGNES_PACKAGE_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)',
      'exec node "$AUGNES_PACKAGE_ROOT/augnes.mjs" "$@"',
      "",
    ].join("\n"),
    0o755,
  );
}

function sanitizePrivateBuildPaths(stagingRoot, sourceRoot, environment) {
  const sourceRootVariants = privatePathVariants(sourceRoot);
  const privateVariants = Array.from(
    new Set(
      [
        environment.HOME,
        environment.USERPROFILE,
        environment.AUGNES_CANONICAL_TEST_MODE === "1"
          ? environment.AUGNES_CANONICAL_TEMP_ROOT
          : null,
      ].flatMap(privatePathVariants),
    ),
  );
  const files = collectAllRegularFiles(stagingRoot);
  for (const relativePath of files) {
    if (!TEXT_FILE_SUFFIXES.has(path.extname(relativePath).toLowerCase())) {
      continue;
    }
    const absolutePath = packagePath(stagingRoot, relativePath);
    const buffer = readFileSync(absolutePath);
    if (buffer.includes(0)) continue;
    let contents = buffer.toString("utf8");
    let changed = false;
    for (const privatePath of sourceRootVariants) {
      if (!privatePath || !contents.includes(privatePath)) continue;
      contents = contents.split(privatePath).join(".");
      changed = true;
    }
    if (changed) writeFileSync(absolutePath, contents, "utf8");
    for (const privatePath of [...sourceRootVariants, ...privateVariants]) {
      if (privatePath && contents.includes(privatePath)) {
        throw new PublicDistributablePackageError(
          "package_private_path_leak",
        );
      }
    }
  }
}

function normalizePackageMetadata(stagingRoot) {
  const visit = (directory) => {
    for (const name of readdirSync(directory).sort(lexicalCompare)) {
      const candidate = path.join(directory, name);
      const stats = lstatSync(candidate);
      if (stats.isSymbolicLink()) {
        throw new PublicDistributablePackageError("package_symlink_unsafe");
      }
      if (stats.isDirectory()) {
        chmodSync(candidate, 0o755);
        visit(candidate);
        utimesSync(
          candidate,
          NORMALIZED_MODIFICATION_TIME,
          NORMALIZED_MODIFICATION_TIME,
        );
        continue;
      }
      if (!stats.isFile()) {
        throw new PublicDistributablePackageError("package_entry_unsafe");
      }
      const relativePath = path
        .relative(stagingRoot, candidate)
        .split(path.sep)
        .join("/");
      assertAllowedDistributablePayloadPath(relativePath);
      normalizeFileMetadata(candidate, relativePath === "augnes" ? 0o755 : 0o644);
    }
  };
  visit(stagingRoot);
  chmodSync(stagingRoot, 0o755);
  utimesSync(
    stagingRoot,
    NORMALIZED_MODIFICATION_TIME,
    NORMALIZED_MODIFICATION_TIME,
  );
}

function validateStagedNativeDependency(stagingRoot) {
  try {
    const physicalStagingRoot = realpathSync(stagingRoot);
    const packageRequire = createRequire(path.join(stagingRoot, "server.js"));
    const resolvedModule = packageRequire.resolve("better-sqlite3");
    assertInside(physicalStagingRoot, realpathSync(resolvedModule));
    const Database = packageRequire("better-sqlite3");
    const database = new Database(":memory:");
    try {
      const row = database.prepare("SELECT 1 AS ready").get();
      if (row?.ready !== 1) throw new Error("native query failed");
    } finally {
      database.close();
    }
    const nativeBinding = packagePath(
      stagingRoot,
      "node_modules/better-sqlite3/build/Release/better_sqlite3.node",
    );
    const bindingStats = lstatSync(nativeBinding);
    if (!bindingStats.isFile() || bindingStats.isSymbolicLink()) {
      throw new Error("native binding is not a regular file");
    }
  } catch (error) {
    throw new PublicDistributablePackageError(
      "package_native_dependency_invalid",
      error,
    );
  }
}

async function createArchive({
  stagingRoot,
  archiveListPath,
  temporaryArchivePath,
  environment,
}) {
  const metadataArguments = await tarMetadataArguments(environment);
  const result = await runOwnedCommand({
    command: "tar",
    args: [
      "-czf",
      temporaryArchivePath,
      "--format=ustar",
      "--no-xattrs",
      ...metadataArguments,
      "-C",
      stagingRoot,
      "--no-recursion",
      "-T",
      archiveListPath,
    ],
    cwd: stagingRoot,
    environment: { ...environment, COPYFILE_DISABLE: "1" },
    label: "create distributable archive",
    timeoutMs: ARCHIVE_TOOL_TIMEOUT_MS,
    captureOutput: true,
  });
  if (result.code !== 0) {
    throw new PublicDistributablePackageError(
      "package_archive_creation_failed",
      new Error(publicToolOutput(result.stderr)),
    );
  }
  const stats = lstatSync(temporaryArchivePath);
  if (!stats.isFile() || stats.isSymbolicLink() || stats.size === 0) {
    throw new PublicDistributablePackageError(
      "package_archive_creation_failed",
    );
  }
}

function publishArchive(temporaryArchivePath, artifactPath) {
  if (existsSync(artifactPath)) {
    const stats = lstatSync(artifactPath);
    if (!stats.isFile() || stats.isSymbolicLink()) {
      throw new PublicDistributablePackageError(
        "package_artifact_destination_unsafe",
      );
    }
    unlinkSync(artifactPath);
  }
  renameSync(temporaryArchivePath, artifactPath);
}

function copyRuntimeTree(
  sourceRoot,
  sourceDirectory,
  stagingRoot,
  destinationDirectory,
  {
    omitSourceMaps = false,
    materializeNextNativeAliases = false,
  } = {},
) {
  assertSafeSourceDirectory(sourceRoot, sourceDirectory);
  const visit = (currentSource, currentDestination) => {
    mkdirSync(packagePath(stagingRoot, currentDestination), {
      recursive: true,
      mode: 0o755,
    });
    for (const name of readdirSync(currentSource).sort(lexicalCompare)) {
      const sourcePath = path.join(currentSource, name);
      const destinationPath = `${currentDestination}/${name}`;
      const stats = lstatSync(sourcePath);
      if (stats.isSymbolicLink()) {
        if (
          materializeNextNativeAliases &&
          currentDestination === ".next/node_modules" &&
          /^better-sqlite3-[a-f0-9]{16}$/.test(name)
        ) {
          const physicalTarget = realpathSync(sourcePath);
          const expectedTarget = realpathSync(
            path.join(
              sourceRoot,
              ".next",
              "standalone",
              "node_modules",
              "better-sqlite3",
            ),
          );
          if (physicalTarget !== expectedTarget) {
            throw new PublicDistributablePackageError(
              "package_symlink_unsafe",
            );
          }
          visit(physicalTarget, destinationPath);
          continue;
        }
        throw new PublicDistributablePackageError("package_symlink_unsafe");
      }
      if (stats.isDirectory()) {
        visit(sourcePath, destinationPath);
        continue;
      }
      if (!stats.isFile()) {
        throw new PublicDistributablePackageError("package_entry_unsafe");
      }
      if (omitSourceMaps && name.toLowerCase().endsWith(".map")) continue;
      copyRuntimeFile(
        sourceRoot,
        sourcePath,
        stagingRoot,
        destinationPath,
      );
    }
  };
  visit(sourceDirectory, destinationDirectory);
}

function copyRuntimeFile(sourceRoot, sourcePath, stagingRoot, relativePath) {
  assertSafeDistributablePath(relativePath);
  assertAllowedDistributablePayloadPath(relativePath);
  assertSafeSourceFile(sourceRoot, sourcePath);
  const destinationPath = packagePath(stagingRoot, relativePath);
  if (existsSync(destinationPath)) {
    throw new PublicDistributablePackageError(
      "package_duplicate_destination",
    );
  }
  mkdirSync(path.dirname(destinationPath), { recursive: true, mode: 0o755 });
  copyFileSync(sourcePath, destinationPath);
}

function writePackageFile(stagingRoot, relativePath, contents, mode) {
  assertAllowedDistributablePayloadPath(relativePath);
  const destinationPath = packagePath(stagingRoot, relativePath);
  mkdirSync(path.dirname(destinationPath), { recursive: true, mode: 0o755 });
  writeFileSync(destinationPath, contents, {
    encoding: "utf8",
    flag: "wx",
    mode,
  });
}

function collectAllRegularFiles(root) {
  const output = [];
  const visit = (directory, relativeDirectory = "") => {
    for (const name of readdirSync(directory).sort(lexicalCompare)) {
      const absolutePath = path.join(directory, name);
      const relativePath = relativeDirectory
        ? `${relativeDirectory}/${name}`
        : name;
      const stats = lstatSync(absolutePath);
      if (stats.isSymbolicLink()) {
        throw new PublicDistributablePackageError("package_symlink_unsafe");
      }
      if (stats.isDirectory()) visit(absolutePath, relativePath);
      else if (stats.isFile()) output.push(relativePath);
      else throw new PublicDistributablePackageError("package_entry_unsafe");
    }
  };
  visit(root);
  return output;
}

function normalizeFileMetadata(filePath, mode) {
  chmodSync(filePath, mode);
  utimesSync(
    filePath,
    NORMALIZED_MODIFICATION_TIME,
    NORMALIZED_MODIFICATION_TIME,
  );
}

async function runNode(cwd, scriptPath, args, environment, failureCode) {
  const result = await runOwnedCommand({
    command: process.execPath,
    args: [scriptPath, ...args],
    cwd,
    environment,
    label: failureCode,
    timeoutMs: PACKAGE_BUILD_TIMEOUT_MS,
  });
  if (result.code !== 0) {
    throw new PublicDistributablePackageError(failureCode);
  }
}

function createPackageToolEnvironment(environment) {
  const isolated = {
    NODE_ENV: "production",
    NEXT_TELEMETRY_DISABLED: "1",
  };
  for (const key of PACKAGE_TOOL_ENVIRONMENT_KEYS) {
    const value = environment[key];
    if (typeof value === "string" && value.length > 0) isolated[key] = value;
  }
  if (environment.AUGNES_CANONICAL_TEST_MODE === "1") {
    const configuredRoot = environment.AUGNES_CANONICAL_TEMP_ROOT;
    const configuredImport = environment.AUGNES_CANONICAL_TEST_NODE_IMPORT;
    if (configuredImport) {
      try {
        if (
          typeof configuredRoot !== "string" ||
          !path.isAbsolute(configuredRoot) ||
          typeof configuredImport !== "string" ||
          !path.isAbsolute(configuredImport)
        ) {
          throw new Error("canonical test paths must be absolute");
        }
        const physicalRoot = realpathSync(configuredRoot);
        const physicalImport = realpathSync(configuredImport);
        const importStats = lstatSync(configuredImport);
        assertInside(physicalRoot, physicalImport);
        if (!importStats.isFile() || importStats.isSymbolicLink()) {
          throw new Error("canonical test import must be a regular file");
        }
        isolated.NODE_OPTIONS = `--import=${pathToFileURL(physicalImport).href}`;
      } catch (error) {
        throw new PublicDistributablePackageError(
          "package_test_environment_invalid",
          error,
        );
      }
    }
  }
  return isolated;
}

async function tarMetadataArguments(environment) {
  const version = await runOwnedCommand({
    command: "tar",
    args: ["--version"],
    environment,
    label: "inspect archive tool",
    timeoutMs: ARCHIVE_TOOL_TIMEOUT_MS,
    captureOutput: true,
  });
  const output = `${version.stdout ?? ""}\n${version.stderr ?? ""}`;
  if (version.code !== 0) {
    throw new PublicDistributablePackageError(
      "package_archive_tool_unsupported",
    );
  }
  if (/bsdtar|libarchive/i.test(output)) {
    return [
      "--no-mac-metadata",
      "--uid",
      "0",
      "--gid",
      "0",
      "--uname",
      "root",
      "--gname",
      "root",
    ];
  }
  if (/gnu tar/i.test(output)) {
    return ["--owner=0", "--group=0", "--numeric-owner"];
  }
  throw new PublicDistributablePackageError(
    "package_archive_tool_unsupported",
  );
}

async function runOwnedCommand({
  command,
  args,
  cwd = defaultRepositoryRoot,
  environment,
  label,
  timeoutMs,
  captureOutput = false,
}) {
  const owned = new Set();
  const child = spawn(command, args, {
    cwd,
    env: environment,
    detached: process.platform !== "win32",
    stdio: captureOutput ? ["ignore", "pipe", "pipe"] : "inherit",
    windowsHide: true,
  });
  let stdout = "";
  let stderr = "";
  if (captureOutput) {
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout = `${stdout}${chunk}`.slice(-4_096);
    });
    child.stderr.on("data", (chunk) => {
      stderr = `${stderr}${chunk}`.slice(-4_096);
    });
  }
  const record = registerOwnedChild(owned, child, { label });
  try {
    const result = await waitForOwnedProcessExit(record, timeoutMs, {
      termGraceMs: 5_000,
      killGraceMs: 5_000,
    });
    await terminateOwnedProcessTree(record, {
      termGraceMs: 2_000,
      killGraceMs: 2_000,
    });
    return { ...result, stdout, stderr };
  } catch (error) {
    await terminateOwnedProcessTree(record, {
      termGraceMs: 2_000,
      killGraceMs: 2_000,
    });
    throw error;
  }
}

function readSourcePackage(sourceRoot) {
  let sourcePackage;
  try {
    sourcePackage = JSON.parse(
      readFileSync(path.join(sourceRoot, "package.json"), "utf8"),
    );
  } catch (error) {
    throw new PublicDistributablePackageError(
      "package_source_contract_invalid",
      error,
    );
  }
  if (
    sourcePackage?.name !== "augnes" ||
    !/^\d+\.\d+\.\d+(?:[-+].*)?$/.test(sourcePackage?.version ?? "")
  ) {
    throw new PublicDistributablePackageError(
      "package_source_contract_invalid",
    );
  }
  return sourcePackage;
}

function assertRepositoryRoot(sourceRoot) {
  for (const relativePath of [
    "next.config.ts",
    "package.json",
    "scripts/build-with-isolated-db.mjs",
  ]) {
    assertSafeSourceFile(sourceRoot, packagePath(sourceRoot, relativePath));
  }
}

function assertRuntimeContractMatchesSource(sourceRoot) {
  const source = readFileSync(
    path.join(sourceRoot, "scripts", "runtime-reconciliation.mjs"),
    "utf8",
  );
  if (
    !source.includes(
      `export const RUNTIME_CONTRACT = "${DISTRIBUTABLE_RUNTIME_CONTRACT}"`,
    ) ||
    !source.includes(
      `export const RUNTIME_SCHEMA_VERSION = ${DISTRIBUTABLE_RUNTIME_SCHEMA_VERSION}`,
    )
  ) {
    throw new PublicDistributablePackageError(
      "package_runtime_contract_mismatch",
    );
  }
}

function assertBuildRuntime() {
  if (
    !DISTRIBUTABLE_SUPPORTED_OPERATING_SYSTEMS.includes(process.platform) ||
    compareVersions(process.versions.node, DISTRIBUTABLE_NODE_MINIMUM) < 0 ||
    !/^\d+$/.test(process.versions.modules ?? "") ||
    !/^\d+$/.test(process.versions.napi ?? "")
  ) {
    throw new PublicDistributablePackageError(
      "package_build_runtime_unsupported",
    );
  }
}

function ensureSafeBuildDirectory(sourceRoot, directory) {
  assertInside(sourceRoot, directory);
  if (existsSync(directory)) {
    const stats = lstatSync(directory);
    if (!stats.isDirectory() || stats.isSymbolicLink()) {
      throw new PublicDistributablePackageError(
        "package_artifact_destination_unsafe",
      );
    }
    return;
  }
  mkdirSync(directory, { mode: 0o755 });
}

function resolveArtifactDirectory(sourceRoot, environment) {
  const configured = environment.AUGNES_PACKAGE_OUTPUT_DIR;
  if (environment.AUGNES_CANONICAL_TEST_MODE !== "1" || !configured) {
    const directory = path.join(sourceRoot, "dist");
    ensureSafeBuildDirectory(sourceRoot, directory);
    return {
      path: directory,
      publicPath: (artifactName) => `dist/${artifactName}`,
    };
  }
  try {
    const canonicalRoot = environment.AUGNES_CANONICAL_TEMP_ROOT;
    if (
      typeof canonicalRoot !== "string" ||
      !path.isAbsolute(canonicalRoot) ||
      typeof configured !== "string" ||
      !path.isAbsolute(configured)
    ) {
      throw new Error("canonical package output paths must be absolute");
    }
    const physicalRoot = realpathSync(canonicalRoot);
    if (existsSync(configured)) {
      const stats = lstatSync(configured);
      if (!stats.isDirectory() || stats.isSymbolicLink()) {
        throw new Error("canonical package output must be a regular directory");
      }
      assertInside(physicalRoot, realpathSync(configured));
    } else {
      const physicalParent = realpathSync(path.dirname(configured));
      assertInside(
        physicalRoot,
        path.join(physicalParent, path.basename(configured)),
      );
      mkdirSync(configured, { mode: 0o700 });
    }
    return {
      path: configured,
      publicPath: (artifactName) => artifactName,
    };
  } catch (error) {
    throw new PublicDistributablePackageError(
      "package_artifact_destination_unsafe",
      error,
    );
  }
}

function assertSafeSourceDirectory(sourceRoot, sourcePath) {
  assertInside(sourceRoot, realpathSync(sourcePath));
  const stats = lstatSync(sourcePath);
  if (!stats.isDirectory() || stats.isSymbolicLink()) {
    throw new PublicDistributablePackageError("package_source_path_unsafe");
  }
}

function assertSafeSourceFile(sourceRoot, sourcePath) {
  assertInside(sourceRoot, realpathSync(sourcePath));
  const stats = lstatSync(sourcePath);
  if (!stats.isFile() || stats.isSymbolicLink()) {
    throw new PublicDistributablePackageError("package_source_path_unsafe");
  }
}

function assertInside(root, candidate) {
  const relative = path.relative(root, candidate);
  if (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))
  ) {
    return;
  }
  throw new PublicDistributablePackageError("package_path_unsafe");
}

function packagePath(root, relativePath) {
  assertSafeDistributablePath(relativePath);
  const candidate = path.join(root, ...relativePath.split("/"));
  assertInside(root, candidate);
  return candidate;
}

function privatePathVariants(candidate) {
  if (!candidate) return [];
  const normalized = path.resolve(candidate);
  return Array.from(
    new Set([
      normalized,
      normalized.split(path.sep).join("/"),
      JSON.stringify(normalized).slice(1, -1),
    ]),
  ).sort((left, right) => right.length - left.length);
}

function removeRegularFileIfPresent(filePath) {
  if (!existsSync(filePath)) return;
  const stats = lstatSync(filePath);
  if (stats.isFile() && !stats.isSymbolicLink()) unlinkSync(filePath);
}

function publicToolOutput(value) {
  return typeof value === "string" ? value.slice(0, 4_096) : "tool failed";
}

function lexicalCompare(left, right) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function isDirectExecution() {
  return (
    Boolean(process.argv[1]) &&
    pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  );
}

if (isDirectExecution()) {
  try {
    await buildDistributablePackage();
  } catch (error) {
    console.error(
      JSON.stringify({
        contract: DISTRIBUTABLE_PACKAGE_CONTRACT,
        package_contract_version: DISTRIBUTABLE_PACKAGE_CONTRACT_VERSION,
        result: "failed",
        reason:
          error instanceof PublicDistributablePackageError
            ? error.code
            : "package_build_failed",
      }),
    );
    process.exitCode = 1;
  }
}
