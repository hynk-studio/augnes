#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temporaryDirectory = mkdtempSync(
  path.join(tmpdir(), "augnes-production-build-"),
);
const buildDatabasePath = path.join(temporaryDirectory, "build.db");
const defaultDatabaseGuardPath = path.join(
  temporaryDirectory,
  "default-data",
  "augnes.db",
);
const absentDefaultGuardMode = process.argv.includes(
  "--absent-default-guard",
);
const staticBakeSentinel = `augnes-build-db-sentinel:${createHash("sha256")
  .update(temporaryDirectory)
  .digest("hex")}`;
const ownedDatabaseFiles = [
  buildDatabasePath,
  `${buildDatabasePath}-wal`,
  `${buildDatabasePath}-shm`,
  `${buildDatabasePath}-journal`,
];
let defaultDatabaseGuardBaseline = null;

try {
  if (!absentDefaultGuardMode) {
    defaultDatabaseGuardBaseline = createDefaultDatabaseGuardFixture(
      defaultDatabaseGuardPath,
    );
  }
  const buildEnvironment = {
    ...process.env,
    AUGNES_DB_PATH: buildDatabasePath,
    AUGNES_BUILD_ISOLATION: "1",
    AUGNES_BUILD_DEFAULT_DB_GUARD_PATH: defaultDatabaseGuardPath,
    NEXT_TELEMETRY_DISABLED: "1",
  };
  runNodeScript("scripts/db-reset.mjs", buildEnvironment);
  seedStaticBakeSentinel(buildDatabasePath, staticBakeSentinel);
  runNodeScript("node_modules/next/dist/bin/next", buildEnvironment, ["build"]);
  assertStaticBuildDoesNotContainSentinel(staticBakeSentinel);
  assertDefaultDatabaseGuardUnchanged(
    defaultDatabaseGuardPath,
    defaultDatabaseGuardBaseline,
  );
  console.log(
    `Augnes production build used an isolated temporary database; no seeded database material was statically baked and the ${
      absentDefaultGuardMode ? "absent" : "existing"
    } injected default database guard was unchanged.`,
  );
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

assert.equal(
  existsSync(temporaryDirectory),
  false,
  "production build must remove its temporary database directory",
);
for (const filePath of ownedDatabaseFiles) {
  assert.equal(
    existsSync(filePath),
    false,
    `production build must remove temporary database artifact ${filePath}`,
  );
}

function runNodeScript(relativeScriptPath, environment, args = []) {
  const result = spawnSync(
    process.execPath,
    [path.join(rootDir, relativeScriptPath), ...args],
    {
      cwd: rootDir,
      env: environment,
      stdio: "inherit",
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `isolated_build_command_failed:${relativeScriptPath}:${String(result.status)}`,
    );
  }
}

function seedStaticBakeSentinel(databasePath, sentinel) {
  const database = new Database(databasePath);
  try {
    database.pragma("foreign_keys = ON");
    database
      .prepare(
        `INSERT INTO state_entries (
          id, scope, state_key, value, temporal_scope, stability, change_type,
          source_agent_id, source_session_id, source_transition_id,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?)`,
      )
      .run(
        "build-isolation-sentinel",
        "project:build-isolation-sentinel",
        "build_isolation_sentinel",
        JSON.stringify(sentinel),
        "current",
        "temporary",
        "build_isolation_probe",
        "2000-01-01T00:00:00.000Z",
        "2000-01-01T00:00:00.000Z",
      );
  } finally {
    database.close();
  }
}

function createDefaultDatabaseGuardFixture(databasePath) {
  mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new Database(databasePath);
  try {
    database.exec(
      `CREATE TABLE build_default_guard (
        id TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      INSERT INTO build_default_guard (id, value)
      VALUES ('guard-row', 'must-remain-byte-identical');`,
    );
  } finally {
    database.close();
  }
  return readDefaultDatabaseGuardSnapshot(databasePath);
}

function assertDefaultDatabaseGuardUnchanged(databasePath, baseline) {
  if (baseline === null) {
    assert.equal(
      existsSync(databasePath),
      false,
      "plain production build must not create an absent injected default database",
    );
    for (const suffix of ["-wal", "-shm", "-journal"]) {
      assert.equal(
        existsSync(`${databasePath}${suffix}`),
        false,
        `plain production build must not create injected default database side file ${suffix}`,
      );
    }
    return;
  }
  assert.deepEqual(
    readDefaultDatabaseGuardSnapshot(databasePath),
    baseline,
    "plain production build must preserve existing default DB bytes, schema objects, and row hashes",
  );
}

function readDefaultDatabaseGuardSnapshot(databasePath) {
  const database = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    const schemaObjects = database
      .prepare(
        `SELECT type, name, tbl_name, sql
         FROM sqlite_master
         WHERE name NOT LIKE 'sqlite_%'
         ORDER BY type, name`,
      )
      .all();
    const rows = database
      .prepare("SELECT id, value FROM build_default_guard ORDER BY id")
      .all();
    return {
      file_hash: createHash("sha256")
        .update(readFileSync(databasePath))
        .digest("hex"),
      schema_objects: schemaObjects,
      row_hash: createHash("sha256")
        .update(JSON.stringify(rows))
        .digest("hex"),
    };
  } finally {
    database.close();
  }
}

function assertStaticBuildDoesNotContainSentinel(sentinel) {
  const buildOutputRoot = path.join(rootDir, ".next", "server");
  assert.equal(
    existsSync(buildOutputRoot),
    true,
    "Next production build must create server output before the sentinel scan",
  );
  for (const filePath of recursivelyListFiles(buildOutputRoot)) {
    assert.equal(
      readFileSync(filePath).includes(Buffer.from(sentinel)),
      false,
      `database-derived sentinel must not be statically baked into ${path.relative(rootDir, filePath)}`,
    );
  }
}

function recursivelyListFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory)) {
    const absolutePath = path.join(directory, entry);
    if (statSync(absolutePath).isDirectory()) {
      files.push(...recursivelyListFiles(absolutePath));
    } else {
      files.push(absolutePath);
    }
  }
  return files;
}
