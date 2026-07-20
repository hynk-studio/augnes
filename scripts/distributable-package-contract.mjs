import { createHash } from "node:crypto";
import {
  closeSync,
  lstatSync,
  openSync,
  readSync,
  readdirSync,
} from "node:fs";
import path from "node:path";

export const DISTRIBUTABLE_PACKAGE_CONTRACT = "augnes.distributable.v1";
export const DISTRIBUTABLE_PACKAGE_CONTRACT_VERSION = 2;
export const DISTRIBUTABLE_MANIFEST_FILE = "augnes-package.json";
export const DISTRIBUTABLE_NODE_MINIMUM = "20.9.0";
export const DISTRIBUTABLE_RUNTIME_CONTRACT =
  "augnes-local-runtime-supervisor-v1";
export const DISTRIBUTABLE_RUNTIME_SCHEMA_VERSION = 2;
export const DISTRIBUTABLE_DATABASE_SCHEMA_COMPATIBILITY = "current";
export const DISTRIBUTABLE_DATABASE_SCHEMA_CONTRACT =
  "augnes.sqlite.structural-schema.v1";
export const DISTRIBUTABLE_DATABASE_MIGRATION_CONTRACT =
  "augnes.canonical-database-migrations.v1";
export const DISTRIBUTABLE_DATABASE_MIGRATION_CONTRACT_VERSION = 1;
export const DISTRIBUTABLE_DATABASE_MIGRATION_IDS = Object.freeze([
  "0001_r8_recovery_contract",
]);
export const DISTRIBUTABLE_DATABASE_RECORD_CONTRACT =
  "augnes.vnext-canonical-records.v1";
export const DISTRIBUTABLE_DATABASE_RECORD_CONTRACT_VERSION = 1;
export const DISTRIBUTABLE_DATABASE_SUPPORTED_SOURCE_SCHEMA_SIGNATURES =
  Object.freeze([
    "800d9cdf741cf7b85362e8ee9c101b6b33d923a41ff1efdddc098e32df776a4a",
  ]);
export const DISTRIBUTABLE_DATABASE_READER_CONTRACTS = Object.freeze([
  "project_home.v0.1",
  "decision_centered_semantic_workbench.v0.1",
  "shared_project_inspector.v0.1",
]);
export const DISTRIBUTABLE_SUPPORTED_OPERATING_SYSTEMS = Object.freeze([
  "darwin",
  "linux",
]);
export const DISTRIBUTABLE_APPLICATION_SCOPE_FINGERPRINT = createHash("sha256")
  .update("hynk-studio/augnes\0augnes.application.scope.v1")
  .digest("hex");

export const DISTRIBUTABLE_RUNTIME_SCRIPTS = Object.freeze([
  "scripts/augnes-local-paths.mjs",
  "scripts/augnes-runtime-supervisor.mjs",
  "scripts/augnes-runtime-supervisor-core.mjs",
  "scripts/canonical-database-migrations.mjs",
  "scripts/canonical-test-environment.mjs",
  "scripts/db-migrations.mjs",
  "scripts/distributable-package-contract.mjs",
  "scripts/distributable-package-launcher.mjs",
  "scripts/local-process-ownership.mjs",
  "scripts/runtime-child-environment.mjs",
  "scripts/runtime-child-launcher.mjs",
  "scripts/runtime-database-bootstrap.mjs",
  "scripts/runtime-reconciliation.mjs",
  "scripts/recovery-backup.mjs",
  "scripts/recovery-canonical-record-validator.mjs",
]);

export const DISTRIBUTABLE_SUPERVISOR_BUNDLE_FILE =
  "scripts/augnes-runtime-supervisor.bundle.cjs";
export const DISTRIBUTABLE_RECOVERY_VALIDATOR_BUNDLE_FILE =
  "scripts/recovery-canonical-record-validator.bundle.cjs";
export const DISTRIBUTABLE_COMPILED_RUNTIME_FILES = Object.freeze([
  DISTRIBUTABLE_SUPERVISOR_BUNDLE_FILE,
  DISTRIBUTABLE_RECOVERY_VALIDATOR_BUNDLE_FILE,
]);

export const DISTRIBUTABLE_REQUIRED_FILES = Object.freeze([
  "augnes",
  "augnes.mjs",
  "bridge/dist/server.mjs",
  "bridge/public/console-widget.html",
  "lib/db/proposal-scoring-schema.json",
  "lib/db/recovery-private-material-contract.mjs",
  "lib/db/schema.sql",
  "node_modules/better-sqlite3/build/Release/better_sqlite3.node",
  "package.json",
  "server.js",
  ...DISTRIBUTABLE_RUNTIME_SCRIPTS,
  ...DISTRIBUTABLE_COMPILED_RUNTIME_FILES,
]);

const ROOT_RUNTIME_FILES = new Set([
  "augnes",
  "augnes.mjs",
  "package.json",
  "server.js",
]);
const NEXT_RUNTIME_METADATA = new Set([
  ".next/BUILD_ID",
  ".next/app-path-routes-manifest.json",
  ".next/build-manifest.json",
  ".next/package.json",
  ".next/prerender-manifest.json",
  ".next/required-server-files.json",
  ".next/routes-manifest.json",
]);
const BRIDGE_RUNTIME_FILES = new Set([
  "bridge/dist/server.mjs",
  "bridge/public/console-widget.html",
]);
const DATABASE_RUNTIME_FILES = new Set([
  "lib/db/proposal-scoring-schema.json",
  "lib/db/recovery-private-material-contract.mjs",
  "lib/db/schema.sql",
]);
const RUNTIME_SCRIPT_SET = new Set(DISTRIBUTABLE_RUNTIME_SCRIPTS);
const COMPILED_RUNTIME_FILE_SET = new Set(
  DISTRIBUTABLE_COMPILED_RUNTIME_FILES,
);
const FORBIDDEN_FILE_SUFFIXES = [
  ".db",
  ".env",
  ".key",
  ".map",
  ".pem",
  ".sqlite",
  ".sqlite3",
  ".ts",
  ".tsx",
];
const MAX_MANIFEST_FILES = 100_000;
const MAX_MANIFEST_PATH_BYTES = 4_096;
const HASH_BUFFER = Buffer.allocUnsafe(1024 * 1024);

export class PublicDistributablePackageError extends Error {
  constructor(code, cause) {
    super(code, cause ? { cause } : undefined);
    this.name = "PublicDistributablePackageError";
    this.code = code;
  }
}

export function createDistributableManifest({
  applicationVersion,
  platform = detectDistributablePlatform(),
  runtime = {
    node_minimum: DISTRIBUTABLE_NODE_MINIMUM,
    node_modules_abi: process.versions.modules,
    node_napi: process.versions.napi,
    runtime_contract: DISTRIBUTABLE_RUNTIME_CONTRACT,
    runtime_schema_version: DISTRIBUTABLE_RUNTIME_SCHEMA_VERSION,
  },
  database,
  files,
} = {}) {
  const manifestWithoutIdentity = {
    contract: DISTRIBUTABLE_PACKAGE_CONTRACT,
    package_contract_version: DISTRIBUTABLE_PACKAGE_CONTRACT_VERSION,
    application_version: applicationVersion,
    application_scope_fingerprint:
      DISTRIBUTABLE_APPLICATION_SCOPE_FINGERPRINT,
    platform,
    runtime,
    database,
    files,
  };
  const manifest = {
    contract: manifestWithoutIdentity.contract,
    package_contract_version: manifestWithoutIdentity.package_contract_version,
    application_version: manifestWithoutIdentity.application_version,
    build_identity: calculateDistributableBuildIdentity(
      manifestWithoutIdentity,
    ),
    application_scope_fingerprint:
      manifestWithoutIdentity.application_scope_fingerprint,
    platform: manifestWithoutIdentity.platform,
    runtime: manifestWithoutIdentity.runtime,
    database: manifestWithoutIdentity.database,
    files: manifestWithoutIdentity.files,
  };
  validateDistributableManifest(manifest);
  return manifest;
}

export function validateDistributableManifest(manifest) {
  try {
    assertPlainRecord(manifest);
    assertExactKeys(manifest, [
      "application_scope_fingerprint",
      "application_version",
      "build_identity",
      "contract",
      "database",
      "files",
      "package_contract_version",
      "platform",
      "runtime",
    ]);
    if (
      manifest.contract !== DISTRIBUTABLE_PACKAGE_CONTRACT ||
      manifest.package_contract_version !==
        DISTRIBUTABLE_PACKAGE_CONTRACT_VERSION ||
      !validApplicationVersion(manifest.application_version) ||
      !/^sha256:[a-f0-9]{64}$/.test(manifest.build_identity ?? "") ||
      manifest.application_scope_fingerprint !==
        DISTRIBUTABLE_APPLICATION_SCOPE_FINGERPRINT
    ) {
      throw new Error("invalid package identity");
    }

    assertPlainRecord(manifest.platform);
    assertExactKeys(manifest.platform, ["arch", "libc", "os"]);
    if (
      !/^[a-z0-9_]+$/.test(manifest.platform.os ?? "") ||
      !/^[a-z0-9_]+$/.test(manifest.platform.arch ?? "") ||
      !/^[a-z0-9_]+$/.test(manifest.platform.libc ?? "") ||
      !DISTRIBUTABLE_SUPPORTED_OPERATING_SYSTEMS.includes(manifest.platform.os)
    ) {
      throw new Error("invalid package platform");
    }

    assertPlainRecord(manifest.runtime);
    assertExactKeys(manifest.runtime, [
      "node_minimum",
      "node_modules_abi",
      "node_napi",
      "runtime_contract",
      "runtime_schema_version",
    ]);
    parseThreePartVersion(manifest.runtime.node_minimum);
    if (
      compareVersions(
        manifest.runtime.node_minimum,
        DISTRIBUTABLE_NODE_MINIMUM,
      ) < 0 ||
      !/^\d+$/.test(manifest.runtime.node_modules_abi ?? "") ||
      !/^\d+$/.test(manifest.runtime.node_napi ?? "") ||
      manifest.runtime.runtime_contract !==
        DISTRIBUTABLE_RUNTIME_CONTRACT ||
      manifest.runtime.runtime_schema_version !==
        DISTRIBUTABLE_RUNTIME_SCHEMA_VERSION
    ) {
      throw new Error("invalid package runtime");
    }

    assertPlainRecord(manifest.database);
    assertExactKeys(manifest.database, [
      "migration_contract",
      "migration_contract_version",
      "migration_ids",
      "reader_contracts",
      "record_contract",
      "record_contract_version",
      "schema_compatibility",
      "schema_contract",
      "schema_signature",
      "supported_source_schema_signatures",
      "supported_source_schema_states",
    ]);
    if (
      manifest.database.schema_compatibility !==
        DISTRIBUTABLE_DATABASE_SCHEMA_COMPATIBILITY ||
      manifest.database.schema_contract !==
        DISTRIBUTABLE_DATABASE_SCHEMA_CONTRACT ||
      !/^[a-f0-9]{64}$/u.test(manifest.database.schema_signature ?? "") ||
      manifest.database.migration_contract !==
        DISTRIBUTABLE_DATABASE_MIGRATION_CONTRACT ||
      manifest.database.migration_contract_version !==
        DISTRIBUTABLE_DATABASE_MIGRATION_CONTRACT_VERSION ||
      JSON.stringify(manifest.database.migration_ids) !==
        JSON.stringify(DISTRIBUTABLE_DATABASE_MIGRATION_IDS) ||
      manifest.database.record_contract !==
        DISTRIBUTABLE_DATABASE_RECORD_CONTRACT ||
      manifest.database.record_contract_version !==
        DISTRIBUTABLE_DATABASE_RECORD_CONTRACT_VERSION ||
      JSON.stringify(manifest.database.reader_contracts) !==
        JSON.stringify(DISTRIBUTABLE_DATABASE_READER_CONTRACTS) ||
      JSON.stringify(
        manifest.database.supported_source_schema_signatures,
      ) !==
        JSON.stringify(
          DISTRIBUTABLE_DATABASE_SUPPORTED_SOURCE_SCHEMA_SIGNATURES,
        ) ||
      JSON.stringify(manifest.database.supported_source_schema_states) !==
        JSON.stringify(["current", "old"])
    ) {
      throw new Error("invalid database compatibility");
    }

    if (
      !Array.isArray(manifest.files) ||
      manifest.files.length === 0 ||
      manifest.files.length > MAX_MANIFEST_FILES
    ) {
      throw new Error("invalid package file list");
    }
    let priorPath = null;
    const filePaths = new Set();
    for (const file of manifest.files) {
      assertPlainRecord(file);
      assertExactKeys(file, ["mode", "path", "sha256", "size"]);
      assertSafeDistributablePath(file.path);
      assertAllowedDistributablePayloadPath(file.path);
      if (
        priorPath !== null &&
        lexicalCompare(priorPath, file.path) >= 0
      ) {
        throw new Error("package file list is not strictly sorted");
      }
      if (
        !Number.isSafeInteger(file.size) ||
        file.size < 0 ||
        (file.mode !== 0o644 && file.mode !== 0o755) ||
        !/^[a-f0-9]{64}$/.test(file.sha256 ?? "")
      ) {
        throw new Error("invalid package file entry");
      }
      priorPath = file.path;
      filePaths.add(file.path);
    }
    for (const requiredPath of DISTRIBUTABLE_REQUIRED_FILES) {
      if (!filePaths.has(requiredPath)) {
        throw new Error(`missing required package file: ${requiredPath}`);
      }
    }
    if (
      !manifest.files.some((file) => file.path.startsWith(".next/server/")) ||
      !manifest.files.some((file) => file.path.startsWith(".next/static/"))
    ) {
      throw new Error("missing Next runtime output");
    }
    if (
      calculateDistributableBuildIdentity(manifest) !==
      manifest.build_identity
    ) {
      throw new PublicDistributablePackageError(
        "package_build_identity_invalid",
      );
    }
    return manifest;
  } catch (error) {
    if (error instanceof PublicDistributablePackageError) throw error;
    throw new PublicDistributablePackageError(
      "package_manifest_invalid",
      error,
    );
  }
}

export function calculateDistributableBuildIdentity(manifest) {
  const identityInput = {
    contract: manifest.contract,
    package_contract_version: manifest.package_contract_version,
    application_version: manifest.application_version,
    application_scope_fingerprint: manifest.application_scope_fingerprint,
    platform: manifest.platform,
    runtime: manifest.runtime,
    database: manifest.database,
    files: manifest.files,
  };
  return `sha256:${createHash("sha256")
    .update("augnes.distributable.build.v1\0")
    .update(JSON.stringify(identityInput))
    .digest("hex")}`;
}

export function collectDistributableFileEntries(packageRoot, {
  includeManifest = false,
} = {}) {
  const rootStats = lstatSync(packageRoot);
  if (!rootStats.isDirectory() || rootStats.isSymbolicLink()) {
    throw new PublicDistributablePackageError("package_integrity_failed");
  }
  const paths = [];
  walkRegularFiles(packageRoot, "", paths);
  const selectedPaths = paths
    .filter(
      (relativePath) =>
        includeManifest || relativePath !== DISTRIBUTABLE_MANIFEST_FILE,
    )
    .sort(lexicalCompare);
  return selectedPaths.map((relativePath) => {
    assertSafeDistributablePath(relativePath);
    if (relativePath !== DISTRIBUTABLE_MANIFEST_FILE) {
      assertAllowedDistributablePayloadPath(relativePath);
    }
    const absolutePath = path.join(packageRoot, ...relativePath.split("/"));
    const stats = lstatSync(absolutePath);
    return {
      path: relativePath,
      size: stats.size,
      mode:
        process.platform === "win32"
          ? relativePath === "augnes"
            ? 0o755
            : 0o644
          : stats.mode & 0o777,
      sha256: sha256File(absolutePath),
    };
  });
}

export function verifyDistributableFileEntries(packageRoot, manifest) {
  let actualEntries;
  try {
    actualEntries = collectDistributableFileEntries(packageRoot);
  } catch (error) {
    throw new PublicDistributablePackageError(
      "package_integrity_failed",
      error,
    );
  }
  if (actualEntries.length !== manifest.files.length) {
    throw new PublicDistributablePackageError("package_integrity_failed");
  }
  for (let index = 0; index < actualEntries.length; index += 1) {
    const actual = actualEntries[index];
    const expected = manifest.files[index];
    if (
      actual.path !== expected.path ||
      actual.size !== expected.size ||
      !compatibleExtractedMode(actual.mode, expected.mode) ||
      actual.sha256 !== expected.sha256
    ) {
      throw new PublicDistributablePackageError("package_integrity_failed");
    }
  }
}

export function assertSafeDistributablePath(candidate) {
  if (
    typeof candidate !== "string" ||
    candidate.length === 0 ||
    Buffer.byteLength(candidate) > MAX_MANIFEST_PATH_BYTES ||
    candidate.includes("\\") ||
    candidate.includes("\0") ||
    /[\u0000-\u001f\u007f:]/.test(candidate) ||
    path.posix.isAbsolute(candidate) ||
    path.win32.isAbsolute(candidate)
  ) {
    throw new PublicDistributablePackageError("package_path_unsafe");
  }
  const segments = candidate.split("/");
  if (
    segments.some(
      (segment) => segment.length === 0 || segment === "." || segment === "..",
    ) ||
    candidate.startsWith("-") ||
    path.posix.normalize(candidate) !== candidate
  ) {
    throw new PublicDistributablePackageError("package_path_unsafe");
  }
  return candidate;
}

export function assertAllowedDistributablePayloadPath(candidate) {
  assertSafeDistributablePath(candidate);
  const lowerPath = candidate.toLowerCase();
  const basename = path.posix.basename(lowerPath);
  if (
    candidate === DISTRIBUTABLE_MANIFEST_FILE ||
    lowerPath.startsWith(".git/") ||
    lowerPath.startsWith("app/") ||
    lowerPath.startsWith("apps/") ||
    lowerPath.startsWith("docs/") ||
    lowerPath.startsWith("fixtures/") ||
    lowerPath.startsWith("test/") ||
    lowerPath.startsWith("tests/") ||
    lowerPath.startsWith("types/") ||
    FORBIDDEN_FILE_SUFFIXES.some((suffix) => lowerPath.endsWith(suffix)) ||
    basename === ".env" ||
    basename.startsWith(".env.") ||
    /\.(?:db|sqlite|sqlite3)(?:(?:-(?:wal|shm|journal))|(?:[.-](?:bak|backup|old)))$/.test(
      basename,
    ) ||
    /\.(?:key|pem|p12|pfx|crt|cer)(?:[.-](?:bak|backup|old))?$/.test(
      basename,
    )
  ) {
    throw new PublicDistributablePackageError("package_source_leak");
  }
  if (
    ROOT_RUNTIME_FILES.has(candidate) ||
    NEXT_RUNTIME_METADATA.has(candidate) ||
    candidate.startsWith(".next/server/") ||
    candidate.startsWith(".next/static/") ||
    candidate.startsWith(".next/node_modules/") ||
    candidate.startsWith("node_modules/") ||
    BRIDGE_RUNTIME_FILES.has(candidate) ||
    DATABASE_RUNTIME_FILES.has(candidate) ||
    RUNTIME_SCRIPT_SET.has(candidate) ||
    COMPILED_RUNTIME_FILE_SET.has(candidate)
  ) {
    return candidate;
  }
  throw new PublicDistributablePackageError("package_source_leak");
}

export function compareVersions(left, right) {
  const leftParts = parseThreePartVersion(left);
  const rightParts = parseThreePartVersion(right);
  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] !== rightParts[index]) {
      return leftParts[index] < rightParts[index] ? -1 : 1;
    }
  }
  return 0;
}

export function detectDistributablePlatform() {
  let libc = "none";
  if (process.platform === "linux") {
    const report = process.report?.getReport?.();
    const glibcVersion = report?.header?.glibcVersionRuntime;
    if (typeof glibcVersion === "string" && glibcVersion.length > 0) {
      libc = "glibc";
    } else if (
      Array.isArray(report?.sharedObjects) &&
      report.sharedObjects.some((value) => /musl/i.test(String(value)))
    ) {
      libc = "musl";
    } else {
      libc = "unknown";
    }
  }
  return Object.freeze({
    os: process.platform,
    arch: process.arch,
    libc,
  });
}

export function formatDistributablePlatformLabel(
  platform,
  nodeModulesAbi = process.versions.modules,
) {
  const base = `${platform.os}-${platform.arch}-node${nodeModulesAbi}`;
  return platform.libc === "none" ? base : `${base}-${platform.libc}`;
}

export function sha256File(filePath) {
  const hash = createHash("sha256");
  const descriptor = openSync(filePath, "r");
  try {
    let bytesRead;
    do {
      bytesRead = readSync(
        descriptor,
        HASH_BUFFER,
        0,
        HASH_BUFFER.length,
        null,
      );
      if (bytesRead > 0) hash.update(HASH_BUFFER.subarray(0, bytesRead));
    } while (bytesRead > 0);
  } finally {
    closeSync(descriptor);
  }
  return hash.digest("hex");
}

function walkRegularFiles(root, relativeDirectory, output) {
  const absoluteDirectory = relativeDirectory
    ? path.join(root, ...relativeDirectory.split("/"))
    : root;
  const names = readdirSync(absoluteDirectory).sort(lexicalCompare);
  for (const name of names) {
    const relativePath = relativeDirectory
      ? `${relativeDirectory}/${name}`
      : name;
    assertSafeDistributablePath(relativePath);
    const absolutePath = path.join(root, ...relativePath.split("/"));
    const stats = lstatSync(absolutePath);
    if (stats.isSymbolicLink()) {
      throw new PublicDistributablePackageError("package_symlink_unsafe");
    }
    if (stats.isDirectory()) {
      walkRegularFiles(root, relativePath, output);
      continue;
    }
    if (!stats.isFile()) {
      throw new PublicDistributablePackageError("package_entry_unsafe");
    }
    output.push(relativePath);
  }
}

function parseThreePartVersion(value) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(value ?? "");
  if (!match) throw new Error("invalid semantic version");
  return match.slice(1, 4).map(Number);
}

function compatibleExtractedMode(actual, expected) {
  if (process.platform === "win32") return actual === expected;
  if (!Number.isInteger(actual) || !Number.isInteger(expected)) return false;
  if ((actual & ~expected) !== 0) return false;
  const requiredOwnerBits = expected === 0o755 ? 0o500 : 0o400;
  return (actual & requiredOwnerBits) === requiredOwnerBits;
}

function validApplicationVersion(value) {
  try {
    parseThreePartVersion(value);
    return true;
  } catch {
    return false;
  }
}

function assertPlainRecord(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("expected object");
  }
}

function assertExactKeys(value, expectedKeys) {
  const actualKeys = Object.keys(value).sort(lexicalCompare);
  const sortedExpectedKeys = [...expectedKeys].sort(lexicalCompare);
  if (
    actualKeys.length !== sortedExpectedKeys.length ||
    actualKeys.some((key, index) => key !== sortedExpectedKeys[index])
  ) {
    throw new Error("unexpected contract field");
  }
}

function lexicalCompare(left, right) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}
