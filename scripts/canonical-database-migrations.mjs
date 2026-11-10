import {
  CANONICAL_DATABASE_MIGRATION_CONTRACT,
  CANONICAL_DATABASE_MIGRATION_CONTRACT_VERSION,
  CANONICAL_DATABASE_MIGRATION_IDS,
  verifyCanonicalPackageIdentityGuard,
} from "../lib/db/canonical-database-contract.mjs";
export * from "../lib/db/canonical-database-contract.mjs";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeRecoveryPrivateMaterial } from "../lib/db/recovery-private-material-contract.mjs";

import { applyCanonicalCompatibility } from "./database-migrations/canonical-compatibility.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema =
  typeof __AUGNES_BUNDLED_SCHEMA_SQL__ === "string"
    ? __AUGNES_BUNDLED_SCHEMA_SQL__
    : readFileSync(path.join(rootDir, "lib", "db", "schema.sql"), "utf8");

/**
 * Shared preparation entry for db:init, db:migrate and supervised bootstrap.
 * Family SQL and results belong to the fixed canonical compatibility composition.
 * Private-material normalization and the ledger remain last, outside any new
 * encompassing transaction; a failed earlier migration must propagate unchanged.
 */
export function applyCanonicalDatabaseMigrations(db) {
  const compatibilityResults = applyCanonicalCompatibility(db, schema);
  const recoveryPrivateMaterialResult = normalizeRecoveryPrivateMaterial(db);
  const migrationLedgerResult = ensureCanonicalDatabaseMigrationLedger(db);

  return {
    ...compatibilityResults,
    recoveryPrivateMaterialResult,
    migrationLedgerResult,
  };
}

export function requireCanonicalPackageIdentityGuard(db, updatedAt) {
  if (
    typeof updatedAt !== "string" ||
    new Date(updatedAt).toISOString() !== updatedAt
  ) {
    throw new Error("database_package_identity_guard_timestamp_invalid");
  }
  verifyCanonicalPackageIdentityGuard(db);
  db.prepare(
    `UPDATE augnes_package_identity_guard
        SET identity_state = 'package_identity_required', updated_at = ?
      WHERE singleton = 1 AND identity_state <> 'package_identity_required'`,
  ).run(updatedAt);
  return verifyCanonicalPackageIdentityGuard(db);
}

function ensureCanonicalDatabaseMigrationLedger(db) {
  const inserted = [];
  const statement = db.prepare(
    `INSERT OR IGNORE INTO augnes_schema_migrations (
       migration_id, migration_contract, migration_contract_version, applied_at
     ) VALUES (?, ?, ?, ?)`,
  );
  const appliedAt = new Date().toISOString();
  for (const migrationId of CANONICAL_DATABASE_MIGRATION_IDS) {
    const result = statement.run(
      migrationId,
      CANONICAL_DATABASE_MIGRATION_CONTRACT,
      CANONICAL_DATABASE_MIGRATION_CONTRACT_VERSION,
      appliedAt,
    );
    if (result.changes === 1) inserted.push(migrationId);
  }
  return {
    contract: CANONICAL_DATABASE_MIGRATION_CONTRACT,
    contract_version: CANONICAL_DATABASE_MIGRATION_CONTRACT_VERSION,
    migration_ids: [...CANONICAL_DATABASE_MIGRATION_IDS],
    inserted_migration_ids: inserted,
  };
}
