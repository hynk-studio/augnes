import Database from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  migrateDeliveryExternalArtifacts,
  migrateSessionBindingColumns,
  migrateStateDeltaProposalScoring,
  migrateVerificationEvidenceRecords,
} from "./db-migrations.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const dbPath =
  process.env.AUGNES_DB_PATH ?? path.join(rootDir, "data", "augnes.db");

export function ensureDataDirectory() {
  mkdirSync(path.dirname(dbPath), { recursive: true });
}

export function openDatabase() {
  ensureDataDirectory();
  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  return db;
}

export function initializeDatabase(db = openDatabase()) {
  const schemaPath = path.join(rootDir, "lib", "db", "schema.sql");
  const schema = readFileSync(schemaPath, "utf8");
  if (hasStateDeltaProposalsTable(db)) {
    migrateStateDeltaProposalScoring(db);
  }
  db.exec(schema);
  migrateStateDeltaProposalScoring(db);
  migrateSessionBindingColumns(db);
  migrateDeliveryExternalArtifacts(db);
  migrateVerificationEvidenceRecords(db);
  return db;
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

function hasStateDeltaProposalsTable(db) {
  return Boolean(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'table' AND name = 'state_delta_proposals'
        `,
      )
      .get(),
  );
}
