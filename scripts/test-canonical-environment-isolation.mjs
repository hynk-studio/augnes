#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  buildCanonicalChildEnvironment,
  findForbiddenAmbientKeysForwarded,
  isPathInsideOrEqual,
} from "./canonical-test-environment.mjs";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const canonicalTemporaryRoot =
  process.env.AUGNES_CANONICAL_TEMP_ROOT?.trim() ?? "";
assert.equal(path.isAbsolute(canonicalTemporaryRoot), true);
assert.equal(existsSync(canonicalTemporaryRoot), true);

const regressionRoot = path.join(
  canonicalTemporaryRoot,
  "environment-isolation-regression",
);
const sentinelRoot = mkdtempSync(
  path.join(
    path.dirname(canonicalTemporaryRoot),
    "augnes-canonical-environment-sentinel-",
  ),
);
assert.equal(isPathInsideOrEqual(canonicalTemporaryRoot, sentinelRoot), false);
assert.equal(isPathInsideOrEqual(sentinelRoot, canonicalTemporaryRoot), false);
mkdirSync(regressionRoot, { recursive: false, mode: 0o700 });

const sentinelDatabasePath = path.join(sentinelRoot, "sentinel.db");
const sentinelManifestPath = path.join(sentinelRoot, "sentinel-manifest.json");
const sentinelFilePath = path.join(sentinelRoot, "sentinel-material.txt");
const browserExecutablePath = path.join(sentinelRoot, "allowed-browser-binary");
const safeChildDatabasePath = path.join(regressionRoot, "child.db");
const sentinelPaths = [
  sentinelDatabasePath,
  sentinelManifestPath,
  sentinelFilePath,
  browserExecutablePath,
];

const poisonedKeys = [
  "AUGNES_DB_PATH",
  "AUGNES_M3D_RUNNER_RUNTIME_ROOT",
  "AUGNES_M3D_RUNNER_WORKING_DB_PATH",
  "AUGNES_M3D_RUNNER_DB_PREINITIALIZED",
  "AUGNES_M3D_RUNNER_PHASE_PROTOCOL_PATH",
  "AUGNES_M3D_RUNNER_INJECT_FAILURE_PHASE",
  "AUGNES_M3D_RUNNER_BROWSER_MANIFEST_PATH",
  "AUGNES_BROWSER_EXISTING_DB_PATH",
  "AUGNES_BROWSER_EXISTING_MANIFEST_PATH",
  "AUGNES_BROWSER_APP_REPO",
  "AUGNES_VNEXT_OPERATOR_PILOT_BROWSER_FIXTURE_DIR",
  "OPENAI_API_KEY",
  "GITHUB_TOKEN",
  "ANTHROPIC_API_KEY",
  "AWS_SECRET_ACCESS_KEY",
  "AZURE_OPENAI_API_KEY",
  "GOOGLE_API_KEY",
];

let summary;

try {
  createSentinelMaterial();
  const before = snapshotSentinelMaterial();
  const poisonedEnvironment = Object.fromEntries(Object.entries(process.env));
  Object.assign(poisonedEnvironment, {
    AUGNES_DB_PATH: sentinelDatabasePath,
    AUGNES_M3D_RUNNER_RUNTIME_ROOT: sentinelRoot,
    AUGNES_M3D_RUNNER_WORKING_DB_PATH: sentinelDatabasePath,
    AUGNES_M3D_RUNNER_DB_PREINITIALIZED: "1",
    AUGNES_M3D_RUNNER_PHASE_PROTOCOL_PATH: sentinelFilePath,
    AUGNES_M3D_RUNNER_INJECT_FAILURE_PHASE: "MECHANICAL_REHEARSAL",
    AUGNES_M3D_RUNNER_BROWSER_MANIFEST_PATH: sentinelManifestPath,
    AUGNES_BROWSER_EXISTING_DB_PATH: sentinelDatabasePath,
    AUGNES_BROWSER_EXISTING_MANIFEST_PATH: sentinelManifestPath,
    AUGNES_BROWSER_APP_REPO: sentinelRoot,
    AUGNES_VNEXT_OPERATOR_PILOT_BROWSER_FIXTURE_DIR: sentinelRoot,
    AUGNES_BROWSER_EXECUTABLE_PATH: browserExecutablePath,
    OPENAI_API_KEY: "poisoned-openai-credential",
    GITHUB_TOKEN: "poisoned-github-credential",
    ANTHROPIC_API_KEY: "poisoned-anthropic-credential",
    AWS_SECRET_ACCESS_KEY: "poisoned-aws-credential",
    AZURE_OPENAI_API_KEY: "poisoned-azure-credential",
    GOOGLE_API_KEY: "poisoned-google-credential",
    NODE_ENV: "production",
  });

  assert.throws(
    () =>
      buildCanonicalChildEnvironment({
        ambientEnvironment: poisonedEnvironment,
        stepEnvironment: { AUGNES_DB_PATH: sentinelDatabasePath },
        temporaryRoot: canonicalTemporaryRoot,
      }),
    /canonical step path must remain inside the child resource root/,
  );
  const stepEnvironment = { AUGNES_DB_PATH: safeChildDatabasePath };
  const childEnvironment = buildCanonicalChildEnvironment({
    ambientEnvironment: poisonedEnvironment,
    stepEnvironment,
    temporaryRoot: canonicalTemporaryRoot,
  });
  const unexpectedForwarded = findForbiddenAmbientKeysForwarded({
    ambientEnvironment: poisonedEnvironment,
    childEnvironment,
    stepEnvironment,
  });
  assert.deepEqual(unexpectedForwarded, []);

  const forbiddenProbeKeys = poisonedKeys.filter(
    (key) => key !== "AUGNES_DB_PATH",
  );
  const probe = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      `const forbidden = ${JSON.stringify(forbiddenProbeKeys)};
const result = {
  node_env: process.env.NODE_ENV ?? null,
  database_path: process.env.AUGNES_DB_PATH ?? null,
  canonical_temp_root: process.env.AUGNES_CANONICAL_TEMP_ROOT ?? null,
  runtime_state_dir: process.env.AUGNES_RUNTIME_STATE_DIR ?? null,
  home: process.env.HOME ?? null,
  tmpdir: process.env.TMPDIR ?? null,
  browser_executable_path: process.env.AUGNES_BROWSER_EXECUTABLE_PATH ?? null,
  forbidden_keys_present: forbidden.filter((key) => Object.hasOwn(process.env, key)),
};
process.stdout.write(JSON.stringify(result));`,
    ],
    {
      cwd: regressionRoot,
      env: childEnvironment,
      encoding: "utf8",
    },
  );
  assert.equal(probe.error, undefined);
  assert.equal(probe.status, 0, probe.stderr);
  const probeResult = JSON.parse(probe.stdout);
  assert.equal(probeResult.node_env, "test");
  assert.equal(probeResult.database_path, safeChildDatabasePath);
  assert.equal(
    isPathInsideOrEqual(canonicalTemporaryRoot, probeResult.database_path),
    true,
  );
  assert.notEqual(probeResult.database_path, sentinelDatabasePath);
  for (const childOwnedPath of [
    probeResult.canonical_temp_root,
    probeResult.runtime_state_dir,
    probeResult.home,
    probeResult.tmpdir,
  ]) {
    assert.equal(
      isPathInsideOrEqual(canonicalTemporaryRoot, childOwnedPath),
      true,
    );
    assert.equal(isPathInsideOrEqual(sentinelRoot, childOwnedPath), false);
  }
  assert.equal(probeResult.browser_executable_path, browserExecutablePath);
  assert.deepEqual(probeResult.forbidden_keys_present, []);
  assert.equal(existsSync(safeChildDatabasePath), false);

  const after = snapshotSentinelMaterial();
  assert.deepEqual(after, before);
  const sentinel = new Database(sentinelDatabasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    assert.deepEqual(
      sentinel
        .prepare("SELECT id, value FROM sentinel_rows ORDER BY id")
        .all(),
      [
        {
          id: "canonical-environment-sentinel-row",
          value: "must-remain-byte-identical",
        },
      ],
    );
  } finally {
    sentinel.close();
  }

  summary = {
    test: "canonical_environment_isolation",
    status: "pass",
    forbidden_environment_keys_forwarded: unexpectedForwarded.length,
    forbidden_probe_keys_present: probeResult.forbidden_keys_present.length,
    allowed_browser_executable_path_preserved: true,
    explicit_step_database_inside_canonical_root: true,
    explicit_step_database_outside_canonical_root_refused: true,
    child_home_tmp_runtime_and_database_uniquely_owned: true,
    sentinel_outside_canonical_root_verified: true,
    sentinel_material_unchanged: true,
    sentinel_before: before,
    sentinel_after: after,
  };
} finally {
  rmSync(regressionRoot, { recursive: true, force: true });
  rmSync(sentinelRoot, { recursive: true, force: true });
}

assert(summary);
assert.equal(existsSync(regressionRoot), false);
assert.equal(existsSync(sentinelRoot), false);
summary.regression_temporary_root_removed = true;
summary.sentinel_temporary_root_removed = true;
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

function createSentinelMaterial() {
  const database = new Database(sentinelDatabasePath);
  try {
    database.exec(
      "CREATE TABLE sentinel_rows (id TEXT PRIMARY KEY, value TEXT NOT NULL)",
    );
    database
      .prepare("INSERT INTO sentinel_rows (id, value) VALUES (?, ?)")
      .run(
        "canonical-environment-sentinel-row",
        "must-remain-byte-identical",
      );
  } finally {
    database.close();
  }
  writeFileSync(
    sentinelManifestPath,
    `${JSON.stringify({ sentinel: "canonical-environment-manifest" })}\n`,
    { encoding: "utf8", mode: 0o600 },
  );
  writeFileSync(sentinelFilePath, "canonical-environment-sentinel-file\n", {
    encoding: "utf8",
    mode: 0o600,
  });
  writeFileSync(browserExecutablePath, "browser-selection-sentinel\n", {
    encoding: "utf8",
    mode: 0o700,
  });
  chmodSync(sentinelDatabasePath, 0o600);
  chmodSync(sentinelManifestPath, 0o600);
  chmodSync(sentinelFilePath, 0o600);
  chmodSync(browserExecutablePath, 0o700);
}

function snapshotSentinelMaterial() {
  return Object.fromEntries(
    sentinelPaths.map((filePath) => [path.basename(filePath), snapshotFile(filePath)]),
  );
}

function snapshotFile(filePath) {
  const digest = createHash("sha256").update(readFileSync(filePath)).digest("hex");
  const entry = statSync(filePath, { bigint: true });
  return {
    sha256: digest,
    size: entry.size.toString(),
    mode: (entry.mode & 0o777n).toString(8).padStart(4, "0"),
    mtime_ns: entry.mtimeNs.toString(),
    ctime_ns: entry.ctimeNs.toString(),
    birthtime_ns: entry.birthtimeNs.toString(),
  };
}
