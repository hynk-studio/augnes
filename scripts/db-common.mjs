import Database from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const proposalScoringColumns = [
  ["prediction_error_score", "REAL NOT NULL DEFAULT 0"],
  ["salience_score", "REAL NOT NULL DEFAULT 0"],
  ["evidence_score", "REAL NOT NULL DEFAULT 0"],
  ["conflict_score", "REAL NOT NULL DEFAULT 0"],
  ["self_impact_score", "REAL NOT NULL DEFAULT 0"],
  ["consolidation_status", "TEXT NOT NULL DEFAULT 'candidate'"],
  ["reinforcement_count", "INTEGER NOT NULL DEFAULT 0"],
  ["expires_at", "TEXT"],
  ["last_evaluated_at", "TEXT"],
  ["scoring_version", "TEXT NOT NULL DEFAULT 'v0.2-rule-001'"],
  ["scoring_reason", "TEXT"],
  ["score_breakdown", "TEXT"],
];

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
  db.exec(schema);
  migrateStateDeltaProposalScoringColumns(db);
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

function migrateStateDeltaProposalScoringColumns(db) {
  const table = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table' AND name = 'state_delta_proposals'
      `,
    )
    .get();

  if (!table) {
    return;
  }

  const existingColumns = new Set(
    db
      .prepare("PRAGMA table_info(state_delta_proposals)")
      .all()
      .map((column) => column.name),
  );

  for (const [name, definition] of proposalScoringColumns) {
    if (!existingColumns.has(name)) {
      db.prepare(
        `ALTER TABLE state_delta_proposals ADD COLUMN ${name} ${definition}`,
      ).run();
    }
  }
}
