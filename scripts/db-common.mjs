import Database from "better-sqlite3";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { configureOwnedDatabase } from "../lib/db/connection-ownership.mjs";
import { assertPreparedDatabase, openPreparedDatabase } from "../lib/db/prepared-database.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const dbPath =
  process.env.AUGNES_DB_PATH ?? path.join(rootDir, "data", "augnes.db");

export function ensureDataDirectory() {
  mkdirSync(path.dirname(dbPath), { recursive: true });
}

export function openDatabase() {
  return openPreparedDatabase(dbPath);
}

// Only explicit CLI/fixture preparation owns creation; ordinary access never
// calls this entry. A supplied handle remains owned by its supplying caller.
export function openDatabaseForPreparation() {
  ensureDataDirectory();
  return configureOwnedDatabase(new Database(dbPath), (db) => {
    db.pragma("foreign_keys = ON");
  });
}

export function initializeDatabase(db) {
  const prepare = (connection) => {
    applyCanonicalDatabaseMigrations(connection);
    assertPreparedDatabase(connection);
  };
  if (db) {
    prepare(db);
    return db;
  }
  return configureOwnedDatabase(openDatabaseForPreparation(), prepare);
}

export function resetDatabase() {
  if (existsSync(dbPath)) {
    rmSync(dbPath);
  }

  for (const suffix of ["-shm", "-wal", "-journal"]) {
    const artifactPath = `${dbPath}${suffix}`;
    if (existsSync(artifactPath)) {
      rmSync(artifactPath);
    }
  }

  return initializeDatabase();
}

export function encodeValue(value) {
  return JSON.stringify(value);
}
