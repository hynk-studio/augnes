import Database from "better-sqlite3";
import { existsSync } from "node:fs";
import {
  CANONICAL_DATABASE_SUPPORTED_SOURCE_SCHEMA_SIGNATURES,
  verifyCanonicalDatabaseMigrationLedger,
  verifyCanonicalPackageIdentityGuard,
} from "./canonical-database-contract.mjs";
import { configureOwnedDatabase } from "./connection-ownership.mjs";
import { structuralSchemaContractSignature } from "./structural-schema-contract.mjs";

// Bound to the canonical migration output by the database-access regression.
// This is source identity, never a cached observation of a path or connection.
export const PREPARED_DATABASE_SCHEMA_SIGNATURE =
  "d85cac38c48dcbf31f1534b89053d72a71d8cd218b48237be17e641b2e7d540d";

const messages = {
  database_missing: "Augnes storage is missing. Start Augnes through its supported launcher to prepare storage.",
  database_unprepared: "Augnes storage needs preparation. Restart through the supported launcher to complete setup or upgrade.",
  database_incompatible: "Augnes storage is incompatible. Use the supported recovery flow or a compatible Augnes version.",
  database_unavailable: "Augnes storage is unavailable. Check storage access and restart through the supported launcher.",
};

export class DatabaseAccessError extends Error {
  constructor(code, cause) {
    super(messages[code], cause === undefined ? undefined : { cause });
    this.name = "DatabaseAccessError";
    this.code = code;
  }
}

export function assertPreparedDatabase(database) {
  // A fresh read transaction binds the entire check to this connection's
  // database image. No process/path cache survives restore or replacement.
  database.transaction(() => {
    const signature = structuralSchemaContractSignature(database);
    if (signature !== PREPARED_DATABASE_SCHEMA_SIGNATURE) {
      const empty = !database.prepare(
        "SELECT 1 FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' LIMIT 1",
      ).get();
      throw new DatabaseAccessError(
        empty || CANONICAL_DATABASE_SUPPORTED_SOURCE_SCHEMA_SIGNATURES.includes(signature)
          ? "database_unprepared" : "database_incompatible",
      );
    }
    try {
      verifyCanonicalDatabaseMigrationLedger(database);
      verifyCanonicalPackageIdentityGuard(database);
    } catch (cause) {
      throw new DatabaseAccessError("database_incompatible", cause);
    }
  })();
}

export function openPreparedDatabase(databasePath) {
  // fileMustExist also protects the constructor against a removal race. The
  // explicit existence check only classifies the public error; it creates nothing.
  if (typeof databasePath !== "string" || !existsSync(databasePath)) {
    throw new DatabaseAccessError("database_missing");
  }
  let database;
  try {
    database = new Database(databasePath, { fileMustExist: true });
  } catch (cause) {
    throw new DatabaseAccessError(
      existsSync(databasePath) ? "database_unavailable" : "database_missing", cause,
    );
  }
  return configureOwnedDatabase(database, (connection) => {
    try {
      connection.pragma("foreign_keys = ON");
      assertPreparedDatabase(connection);
    } catch (cause) {
      if (cause instanceof DatabaseAccessError) throw cause;
      throw new DatabaseAccessError(
        cause?.code === "SQLITE_NOTADB" || cause?.code === "SQLITE_CORRUPT"
          ? "database_incompatible" : "database_unavailable", cause,
      );
    }
  });
}
