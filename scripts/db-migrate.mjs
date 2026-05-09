import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dbPath, openDatabase } from "./db-common.mjs";
import {
  migrateMailboxCoordinationEventTypes,
  migrateStateDeltaProposalScoring,
} from "./db-migrations.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const db = openDatabase();

try {
  const schemaPath = path.join(rootDir, "lib", "db", "schema.sql");
  let preSchemaResult = null;
  if (hasStateDeltaProposalsTable(db)) {
    preSchemaResult = migrateStateDeltaProposalScoring(db);
  }

  db.exec(readFileSync(schemaPath, "utf8"));
  const postSchemaResult = migrateStateDeltaProposalScoring(db);
  const mailboxResult = migrateMailboxCoordinationEventTypes(db);
  if (mailboxResult.rebuilt_coordination_events) {
    db.exec(readFileSync(schemaPath, "utf8"));
  }
  const result = combineMigrationResults(preSchemaResult, postSchemaResult);

  if (!result.table_found) {
    console.log(
      `Migration skipped: state_delta_proposals table was not found at ${dbPath}`,
    );
  } else if (
    result.added_columns.length === 0 &&
    result.created_indexes.length === 0
  ) {
    console.log(`Migration no-op: v0.2 proposal scoring schema is current at ${dbPath}`);
  } else {
    console.log(`Migrated Augnes SQLite database at ${dbPath}`);
    console.log(
      `Added columns: ${
        result.added_columns.length > 0
          ? result.added_columns.join(", ")
          : "none"
      }`,
    );
    console.log(
      `Created indexes: ${
        result.created_indexes.length > 0
          ? result.created_indexes.join(", ")
          : "none"
      }`,
    );
  }

  if (mailboxResult.rebuilt_coordination_events) {
    console.log(
      `Migrated coordination_events event_type constraint for mailbox lifecycle events at ${dbPath}`,
    );
  }
} finally {
  db.close();
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

function combineMigrationResults(first, second) {
  if (!first) {
    return second;
  }

  return {
    table_found: first.table_found || second.table_found,
    added_columns: [...first.added_columns, ...second.added_columns],
    created_indexes: [...first.created_indexes, ...second.created_indexes],
  };
}
