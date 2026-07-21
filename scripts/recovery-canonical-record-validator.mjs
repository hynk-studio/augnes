import { createHash } from "node:crypto";
import {
  closeSync,
  existsSync,
  fstatSync,
  lstatSync,
  openSync,
  readFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CONTRACT = "augnes.recovery-canonical-record-validator.v1";
const CONTRACT_VERSION = 1;
const VALID_CODE = "canonical_records_valid";
const LOAD_FAILURE_CODE = "database_reader_incompatible";
const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.dirname(SCRIPT_DIRECTORY);
const PACKAGE_MANIFEST_PATH = path.join(PACKAGE_ROOT, "augnes-package.json");
const TYPESCRIPT_ENTRY_PATH = path.join(
  SCRIPT_DIRECTORY,
  "recovery-canonical-record-validator.ts",
);
const PACKAGED_BUNDLE_PATH = path.join(
  SCRIPT_DIRECTORY,
  "recovery-canonical-record-validator.bundle.cjs",
);
const PACKAGED_BUNDLE_RELATIVE_PATH =
  "scripts/recovery-canonical-record-validator.bundle.cjs";
const MAX_PACKAGE_MANIFEST_BYTES = 16 * 1024 * 1024;
const require = createRequire(import.meta.url);

function invalidResult() {
  return {
    contract: CONTRACT,
    contract_version: CONTRACT_VERSION,
    status: "invalid",
    code: LOAD_FAILURE_CODE,
    record_count: 0,
  };
}

function regularFileIdentity(filePath) {
  const entry = lstatSync(filePath);
  if (!entry.isFile() || entry.isSymbolicLink()) throw new Error(LOAD_FAILURE_CODE);
  return { device: String(entry.dev), inode: String(entry.ino) };
}

function sameIdentity(left, right) {
  return left.device === right.device && left.inode === right.inode;
}

function compatibleExtractedMode(actual, expected) {
  return (
    (actual & ~expected) === 0 &&
    (actual & (expected === 0o755 ? 0o500 : 0o400)) ===
      (expected === 0o755 ? 0o500 : 0o400)
  );
}

function readStableRegularFile(filePath, maximumBytes) {
  let descriptor = null;
  try {
    const beforePath = lstatSync(filePath, { bigint: true });
    if (!beforePath.isFile() || beforePath.isSymbolicLink()) {
      throw new Error(LOAD_FAILURE_CODE);
    }
    if (
      beforePath.size <= 0n ||
      beforePath.size > BigInt(maximumBytes)
    ) {
      throw new Error(LOAD_FAILURE_CODE);
    }
    descriptor = openSync(filePath, "r");
    const beforeDescriptor = fstatSync(descriptor, { bigint: true });
    if (!sameBigIntIdentity(beforePath, beforeDescriptor)) {
      throw new Error(LOAD_FAILURE_CODE);
    }
    const bytes = readFileSync(descriptor);
    const afterDescriptor = fstatSync(descriptor, { bigint: true });
    const afterPath = lstatSync(filePath, { bigint: true });
    if (
      !sameBigIntIdentity(beforePath, afterDescriptor) ||
      !sameBigIntIdentity(beforePath, afterPath) ||
      BigInt(bytes.length) !== beforePath.size
    ) {
      throw new Error(LOAD_FAILURE_CODE);
    }
    return { bytes, stats: beforePath };
  } finally {
    if (descriptor !== null) closeSync(descriptor);
  }
}

function sameBigIntIdentity(left, right) {
  return (
    right.isFile() &&
    !right.isSymbolicLink() &&
    left.dev === right.dev &&
    left.ino === right.ino &&
    left.size === right.size
  );
}

function validatePackagedBundleSource() {
  const manifestRead = readStableRegularFile(
    PACKAGE_MANIFEST_PATH,
    MAX_PACKAGE_MANIFEST_BYTES,
  );
  if (
    manifestRead.stats.size <= 0n ||
    manifestRead.stats.size > BigInt(MAX_PACKAGE_MANIFEST_BYTES)
  ) {
    throw new Error(LOAD_FAILURE_CODE);
  }
  const manifest = JSON.parse(manifestRead.bytes.toString("utf8"));
  if (!manifest || typeof manifest !== "object" || !Array.isArray(manifest.files)) {
    throw new Error(LOAD_FAILURE_CODE);
  }
  const entries = manifest.files.filter(
    (entry) =>
      entry &&
      typeof entry === "object" &&
      entry.path === PACKAGED_BUNDLE_RELATIVE_PATH,
  );
  if (entries.length !== 1) throw new Error(LOAD_FAILURE_CODE);
  const expected = entries[0];
  if (
    Object.keys(expected).sort().join("\u0000") !==
      ["mode", "path", "sha256", "size"].sort().join("\u0000") ||
    !Number.isSafeInteger(expected.size) ||
    expected.size < 1 ||
    !/^[a-f0-9]{64}$/u.test(expected.sha256 ?? "") ||
    (expected.mode !== 0o644 && expected.mode !== 0o755)
  ) {
    throw new Error(LOAD_FAILURE_CODE);
  }
  const actual = readStableRegularFile(PACKAGED_BUNDLE_PATH, expected.size);
  if (
    Number(actual.stats.size) !== expected.size ||
    !compatibleExtractedMode(
      Number(actual.stats.mode & 0o777n),
      expected.mode,
    ) ||
    createHash("sha256").update(actual.bytes).digest("hex") !== expected.sha256
  ) {
    throw new Error(LOAD_FAILURE_CODE);
  }
  return actual.bytes.toString("utf8");
}

function compileSourceEntry() {
  regularFileIdentity(TYPESCRIPT_ENTRY_PATH);
  const esbuild = require("esbuild");
  const result = esbuild.buildSync({
    absWorkingDir: PACKAGE_ROOT,
    entryPoints: [TYPESCRIPT_ENTRY_PATH],
    bundle: true,
    external: ["better-sqlite3"],
    format: "cjs",
    platform: "node",
    target: "node20.9",
    write: false,
    sourcemap: false,
    legalComments: "none",
    logLevel: "silent",
    tsconfig: path.join(PACKAGE_ROOT, "tsconfig.json"),
  });
  if (result.outputFiles?.length !== 1) throw new Error(LOAD_FAILURE_CODE);
  const source = result.outputFiles[0].text;
  if (typeof source !== "string" || source.length === 0) {
    throw new Error(LOAD_FAILURE_CODE);
  }
  return source;
}

function evaluateCommonJsSource(source) {
  const Module = require("node:module");
  const filename = path.join(
    SCRIPT_DIRECTORY,
    ".recovery-canonical-record-validator.in-memory.cjs",
  );
  const loaded = new Module(filename);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(SCRIPT_DIRECTORY);
  loaded._compile(source, filename);
  return loaded.exports;
}

function loadValidator() {
  try {
    const exports = existsSync(PACKAGE_MANIFEST_PATH)
      ? (() => {
          const source = validatePackagedBundleSource();
          return evaluateCommonJsSource(source);
        })()
      : evaluateCommonJsSource(compileSourceEntry());
    if (
      !exports ||
      typeof exports.validateRecoveryCanonicalDatabaseV01 !== "function"
    ) {
      throw new Error(LOAD_FAILURE_CODE);
    }
    return {
      validate: exports.validateRecoveryCanonicalDatabaseV01,
      status: "available",
    };
  } catch {
    return { validate: null, status: "unavailable" };
  }
}

const loadedValidator = loadValidator();

function isDatabase(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.prepare === "function" &&
    typeof value.pragma === "function"
  );
}

function validateOpenDatabase(database) {
  if (!loadedValidator.validate) return invalidResult();
  try {
    const result = loadedValidator.validate(database);
    if (
      !result ||
      typeof result !== "object" ||
      result.contract !== CONTRACT ||
      result.contract_version !== CONTRACT_VERSION ||
      !["valid", "invalid"].includes(result.status) ||
      typeof result.code !== "string" ||
      !Number.isSafeInteger(result.record_count) ||
      result.record_count < 0 ||
      (result.status === "valid" && result.code !== VALID_CODE) ||
      (result.status === "invalid" && result.record_count !== 0)
    ) {
      return invalidResult();
    }
    return result;
  } catch {
    return invalidResult();
  }
}

/**
 * Synchronously validates either an already-open better-sqlite3 database or
 * an absolute regular database file. No validator exception or database
 * material crosses this public recovery boundary.
 */
export function validateRecoveryCanonicalDatabaseV01(databaseOrPath) {
  if (isDatabase(databaseOrPath)) {
    return validateOpenDatabase(databaseOrPath);
  }
  if (typeof databaseOrPath !== "string" || !path.isAbsolute(databaseOrPath)) {
    return invalidResult();
  }
  let before;
  let database;
  try {
    before = regularFileIdentity(databaseOrPath);
    const Database = require("better-sqlite3");
    database = new Database(databaseOrPath, {
      readonly: true,
      fileMustExist: true,
    });
    database.pragma("foreign_keys = ON");
    const result = validateOpenDatabase(database);
    const after = regularFileIdentity(databaseOrPath);
    return sameIdentity(before, after) ? result : invalidResult();
  } catch {
    return invalidResult();
  } finally {
    try {
      database?.close();
    } catch {
      // The public result already fails closed without exposing close errors.
    }
  }
}

export const validateRecoveryCanonicalDatabaseFileV01 =
  validateRecoveryCanonicalDatabaseV01;

export function getRecoveryCanonicalRecordValidatorStatusV01() {
  return {
    contract: CONTRACT,
    contract_version: CONTRACT_VERSION,
    status: loadedValidator.status,
  };
}

export class PublicRecoveryCanonicalRecordValidationErrorV01 extends Error {
  constructor(code = "database_canonical_invariant_failed") {
    super(code);
    this.name = "PublicRecoveryCanonicalRecordValidationErrorV01";
    this.code = code;
  }
}

export function assertRecoveryCanonicalDatabaseV01(databaseOrPath) {
  const result = validateRecoveryCanonicalDatabaseV01(databaseOrPath);
  if (result.status !== "valid") {
    throw new PublicRecoveryCanonicalRecordValidationErrorV01(result.code);
  }
  return result;
}
