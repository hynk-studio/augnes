import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dbPath, openDatabase } from "./db-common.mjs";
import {
  migrateDeliveryExternalArtifacts,
  migrateMailboxCoordinationEventTypes,
  migrateSessionBindingColumns,
  migrateStateDeltaProposalScoring,
  migrateTemporalPreviewReviewArtifacts,
  migrateVerificationEvidenceRecords,
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
  const sessionBindingResult = migrateSessionBindingColumns(db);
  const deliveryArtifactsResult = migrateDeliveryExternalArtifacts(db);
  const verificationEvidenceResult = migrateVerificationEvidenceRecords(db);
  const temporalReviewArtifactResult = migrateTemporalPreviewReviewArtifacts(db);
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

  if (!sessionBindingResult.table_found) {
    console.log(
      `Session binding migration skipped: sessions table was not found at ${dbPath}`,
    );
  } else if (
    sessionBindingResult.added_columns.length === 0 &&
    sessionBindingResult.created_indexes.length === 0
  ) {
    console.log(`Session binding migration no-op: sessions schema is current at ${dbPath}`);
  } else {
    console.log(`Migrated session binding columns at ${dbPath}`);
    console.log(
      `Added columns: ${
        sessionBindingResult.added_columns.length > 0
          ? sessionBindingResult.added_columns.join(", ")
          : "none"
      }`,
    );
    console.log(
      `Created indexes: ${
        sessionBindingResult.created_indexes.length > 0
          ? sessionBindingResult.created_indexes.join(", ")
          : "none"
      }`,
    );
  }

  if (!deliveryArtifactsResult.table_found) {
    console.log(
      `Delivery artifact migration skipped: delivery_ledger table was not found at ${dbPath}`,
    );
  } else if (deliveryArtifactsResult.added_columns.length === 0) {
    console.log(`Delivery artifact migration no-op: delivery_ledger schema is current at ${dbPath}`);
  } else {
    console.log(`Migrated delivery_ledger external artifact columns at ${dbPath}`);
    console.log(`Added columns: ${deliveryArtifactsResult.added_columns.join(", ")}`);
  }

  if (verificationEvidenceResult.created_table) {
    console.log(`Created verification_evidence_records table at ${dbPath}`);
  } else if (verificationEvidenceResult.created_indexes.length === 0) {
    console.log(
      `Verification evidence migration no-op: verification_evidence_records schema is current at ${dbPath}`,
    );
  } else {
    console.log(`Migrated verification_evidence_records indexes at ${dbPath}`);
  }
  if (verificationEvidenceResult.created_indexes.length > 0) {
    console.log(
      `Created indexes: ${verificationEvidenceResult.created_indexes.join(", ")}`,
    );
  }

  if (temporalReviewArtifactResult.created_table) {
    console.log(`Created temporal_preview_review_artifacts table at ${dbPath}`);
  } else if (temporalReviewArtifactResult.created_indexes.length === 0) {
    console.log(
      `Temporal review artifact migration no-op: temporal_preview_review_artifacts schema is current at ${dbPath}`,
    );
  } else {
    console.log(`Migrated temporal_preview_review_artifacts indexes at ${dbPath}`);
  }
  if (temporalReviewArtifactResult.created_indexes.length > 0) {
    console.log(
      `Created indexes: ${temporalReviewArtifactResult.created_indexes.join(", ")}`,
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
