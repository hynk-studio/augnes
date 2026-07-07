import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dbPath, openDatabase } from "./db-common.mjs";
import {
  migrateDeliveryExternalArtifacts,
  migrateMailboxCoordinationEventTypes,
  migrateSessionBindingColumns,
  migrateStateDeltaProposalScoring,
  migrateTemporalPreviewReviewArtifactIdempotency,
  migrateTemporalPreviewReviewArtifacts,
  migrateVerificationEvidenceRecords,
  migrateResearchCandidateManualNotePreviewDrafts,
  migrateResearchCandidateManualNotePreviewDraftDiscards,
  migrateResearchCandidateManualNotePreviewDraftActivities,
  migrateResearchCandidateManualResultRecords,
  migrateResearchCandidateManualGlobalDogfoodLedger,
  migrateResearchCandidateManualGlobalDogfoodMetricSnapshot,
  migrateResearchCandidateManualGlobalDogfoodNextWorkSignal,
  migrateResearchCandidateManualGlobalDogfoodNextWorkBias,
  migrateResearchCandidateManualGlobalDogfoodPerspectiveRelay,
  migratePerspectiveMemoryProductPersistenceBoundaryRecords,
  migratePerspectiveMemoryItems,
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
  const temporalReviewArtifactIdempotencyResult =
    migrateTemporalPreviewReviewArtifactIdempotency(db);
  const researchCandidateManualNotePreviewDraftsResult =
    migrateResearchCandidateManualNotePreviewDrafts(db);
  const researchCandidateManualNotePreviewDraftDiscardsResult =
    migrateResearchCandidateManualNotePreviewDraftDiscards(db);
  const researchCandidateManualNotePreviewDraftActivitiesResult =
    migrateResearchCandidateManualNotePreviewDraftActivities(db);
  const researchCandidateManualResultRecordsResult =
    migrateResearchCandidateManualResultRecords(db);
  const researchCandidateManualGlobalDogfoodLedgerResult =
    migrateResearchCandidateManualGlobalDogfoodLedger(db);
  const researchCandidateManualGlobalDogfoodMetricSnapshotResult =
    migrateResearchCandidateManualGlobalDogfoodMetricSnapshot(db);
  const researchCandidateManualGlobalDogfoodNextWorkSignalResult =
    migrateResearchCandidateManualGlobalDogfoodNextWorkSignal(db);
  const researchCandidateManualGlobalDogfoodNextWorkBiasResult =
    migrateResearchCandidateManualGlobalDogfoodNextWorkBias(db);
  const researchCandidateManualGlobalDogfoodPerspectiveRelayResult =
    migrateResearchCandidateManualGlobalDogfoodPerspectiveRelay(db);
  const perspectiveMemoryBoundaryResult =
    migratePerspectiveMemoryProductPersistenceBoundaryRecords(db);
  const perspectiveMemoryItemsResult = migratePerspectiveMemoryItems(db);
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

  if (temporalReviewArtifactIdempotencyResult.created_table) {
    console.log(
      `Created temporal_preview_review_artifact_idempotency table at ${dbPath}`,
    );
  } else if (
    temporalReviewArtifactIdempotencyResult.created_indexes.length === 0
  ) {
    console.log(
      `Temporal review artifact idempotency migration no-op: temporal_preview_review_artifact_idempotency schema is current at ${dbPath}`,
    );
  } else {
    console.log(
      `Migrated temporal_preview_review_artifact_idempotency indexes at ${dbPath}`,
    );
  }
  if (temporalReviewArtifactIdempotencyResult.created_indexes.length > 0) {
    console.log(
      `Created indexes: ${temporalReviewArtifactIdempotencyResult.created_indexes.join(", ")}`,
    );
  }

  if (researchCandidateManualNotePreviewDraftsResult.created_table) {
    console.log(
      `Created research_candidate_manual_note_preview_drafts table at ${dbPath}`,
    );
  } else if (
    researchCandidateManualNotePreviewDraftsResult.created_indexes.length === 0
  ) {
    console.log(
      `Research candidate manual note preview drafts migration no-op: schema is current at ${dbPath}`,
    );
  } else {
    console.log(
      `Migrated research_candidate_manual_note_preview_drafts indexes at ${dbPath}`,
    );
  }
  if (researchCandidateManualNotePreviewDraftsResult.created_indexes.length > 0) {
    console.log(
      `Created indexes: ${researchCandidateManualNotePreviewDraftsResult.created_indexes.join(", ")}`,
    );
  }

  if (researchCandidateManualNotePreviewDraftDiscardsResult.created_table) {
    console.log(
      `Created research_candidate_manual_note_preview_draft_discards table at ${dbPath}`,
    );
  } else if (
    researchCandidateManualNotePreviewDraftDiscardsResult.created_indexes
      .length === 0
  ) {
    console.log(
      `Research candidate manual note preview draft discards migration no-op: schema is current at ${dbPath}`,
    );
  } else {
    console.log(
      `Migrated research_candidate_manual_note_preview_draft_discards indexes at ${dbPath}`,
    );
  }
  if (
    researchCandidateManualNotePreviewDraftDiscardsResult.created_indexes
      .length > 0
  ) {
    console.log(
      `Created indexes: ${researchCandidateManualNotePreviewDraftDiscardsResult.created_indexes.join(", ")}`,
    );
  }

  if (researchCandidateManualNotePreviewDraftActivitiesResult.created_table) {
    console.log(
      `Created research_candidate_manual_note_preview_draft_activities table at ${dbPath}`,
    );
  } else if (
    researchCandidateManualNotePreviewDraftActivitiesResult.created_indexes
      .length === 0
  ) {
    console.log(
      `Research candidate manual note preview draft activities migration no-op: schema is current at ${dbPath}`,
    );
  } else {
    console.log(
      `Migrated research_candidate_manual_note_preview_draft_activities indexes at ${dbPath}`,
    );
  }
  if (
    researchCandidateManualNotePreviewDraftActivitiesResult.created_indexes
      .length > 0
  ) {
    console.log(
      `Created indexes: ${researchCandidateManualNotePreviewDraftActivitiesResult.created_indexes.join(", ")}`,
    );
  }

  if (researchCandidateManualResultRecordsResult.created_tables.length > 0) {
    console.log(
      `Created manual Research Candidate result record tables at ${dbPath}: ${researchCandidateManualResultRecordsResult.created_tables.join(", ")}`,
    );
  } else if (
    researchCandidateManualResultRecordsResult.created_indexes.length === 0
  ) {
    console.log(
      `Manual Research Candidate result record migration no-op: schema is current at ${dbPath}`,
    );
  } else {
    console.log(
      `Migrated manual Research Candidate result record indexes at ${dbPath}`,
    );
  }
  if (researchCandidateManualResultRecordsResult.created_indexes.length > 0) {
    console.log(
      `Created indexes: ${researchCandidateManualResultRecordsResult.created_indexes.join(", ")}`,
    );
  }

  if (researchCandidateManualGlobalDogfoodLedgerResult.created_tables.length > 0) {
    console.log(
      `Created manual Research Candidate global dogfood ledger tables at ${dbPath}: ${researchCandidateManualGlobalDogfoodLedgerResult.created_tables.join(", ")}`,
    );
  } else if (
    researchCandidateManualGlobalDogfoodLedgerResult.created_indexes.length === 0
  ) {
    console.log(
      `Manual Research Candidate global dogfood ledger migration no-op: schema is current at ${dbPath}`,
    );
  } else {
    console.log(
      `Migrated manual Research Candidate global dogfood ledger indexes at ${dbPath}`,
    );
  }
  if (researchCandidateManualGlobalDogfoodLedgerResult.created_indexes.length > 0) {
    console.log(
      `Created indexes: ${researchCandidateManualGlobalDogfoodLedgerResult.created_indexes.join(", ")}`,
    );
  }

  if (
    researchCandidateManualGlobalDogfoodMetricSnapshotResult.created_tables.length >
    0
  ) {
    console.log(
      `Created manual Research Candidate global dogfood metric snapshot tables at ${dbPath}: ${researchCandidateManualGlobalDogfoodMetricSnapshotResult.created_tables.join(", ")}`,
    );
  } else if (
    researchCandidateManualGlobalDogfoodMetricSnapshotResult.created_indexes
      .length === 0
  ) {
    console.log(
      `Manual Research Candidate global dogfood metric snapshot migration no-op: schema is current at ${dbPath}`,
    );
  } else {
    console.log(
      `Migrated manual Research Candidate global dogfood metric snapshot indexes at ${dbPath}`,
    );
  }
  if (
    researchCandidateManualGlobalDogfoodMetricSnapshotResult.created_indexes.length >
    0
  ) {
    console.log(
      `Created indexes: ${researchCandidateManualGlobalDogfoodMetricSnapshotResult.created_indexes.join(", ")}`,
    );
  }

  if (
    researchCandidateManualGlobalDogfoodNextWorkSignalResult.created_tables.length >
    0
  ) {
    console.log(
      `Created manual Research Candidate global dogfood next-work signal tables at ${dbPath}: ${researchCandidateManualGlobalDogfoodNextWorkSignalResult.created_tables.join(", ")}`,
    );
  } else if (
    researchCandidateManualGlobalDogfoodNextWorkSignalResult.created_indexes
      .length === 0
  ) {
    console.log(
      `Manual Research Candidate global dogfood next-work signal migration no-op: schema is current at ${dbPath}`,
    );
  } else {
    console.log(
      `Migrated manual Research Candidate global dogfood next-work signal indexes at ${dbPath}`,
    );
  }
  if (
    researchCandidateManualGlobalDogfoodNextWorkSignalResult.created_indexes.length >
    0
  ) {
    console.log(
      `Created indexes: ${researchCandidateManualGlobalDogfoodNextWorkSignalResult.created_indexes.join(", ")}`,
    );
  }

  if (
    researchCandidateManualGlobalDogfoodNextWorkBiasResult.created_tables.length >
    0
  ) {
    console.log(
      `Created manual Research Candidate global dogfood next-work bias tables at ${dbPath}: ${researchCandidateManualGlobalDogfoodNextWorkBiasResult.created_tables.join(", ")}`,
    );
  } else if (
    researchCandidateManualGlobalDogfoodNextWorkBiasResult.created_indexes
      .length === 0
  ) {
    console.log(
      `Manual Research Candidate global dogfood next-work bias migration no-op: schema is current at ${dbPath}`,
    );
  } else {
    console.log(
      `Migrated manual Research Candidate global dogfood next-work bias indexes at ${dbPath}`,
    );
  }
  if (
    researchCandidateManualGlobalDogfoodNextWorkBiasResult.created_indexes.length >
    0
  ) {
    console.log(
      `Created indexes: ${researchCandidateManualGlobalDogfoodNextWorkBiasResult.created_indexes.join(", ")}`,
    );
  }

  if (
    researchCandidateManualGlobalDogfoodPerspectiveRelayResult.created_tables
      .length > 0
  ) {
    console.log(
      `Created manual Research Candidate global dogfood Perspective relay tables at ${dbPath}: ${researchCandidateManualGlobalDogfoodPerspectiveRelayResult.created_tables.join(", ")}`,
    );
  } else if (
    researchCandidateManualGlobalDogfoodPerspectiveRelayResult.created_indexes
      .length === 0
  ) {
    console.log(
      `Manual Research Candidate global dogfood Perspective relay migration no-op: schema is current at ${dbPath}`,
    );
  } else {
    console.log(
      `Migrated manual Research Candidate global dogfood Perspective relay indexes at ${dbPath}`,
    );
  }
  if (
    researchCandidateManualGlobalDogfoodPerspectiveRelayResult.created_indexes
      .length > 0
  ) {
    console.log(
      `Created indexes: ${researchCandidateManualGlobalDogfoodPerspectiveRelayResult.created_indexes.join(", ")}`,
    );
  }

  if (perspectiveMemoryBoundaryResult.created_table) {
    console.log(
      `Created perspective_memory_product_persistence_boundary_records table at ${dbPath}`,
    );
  } else if (perspectiveMemoryBoundaryResult.created_indexes.length === 0) {
    console.log(
      `Perspective memory product persistence boundary migration no-op: schema is current at ${dbPath}`,
    );
  } else {
    console.log(
      `Migrated perspective_memory_product_persistence_boundary_records indexes at ${dbPath}`,
    );
  }
  if (perspectiveMemoryBoundaryResult.created_indexes.length > 0) {
    console.log(
      `Created indexes: ${perspectiveMemoryBoundaryResult.created_indexes.join(", ")}`,
    );
  }

  if (perspectiveMemoryItemsResult.created_table) {
    console.log(`Created perspective_memory_items table at ${dbPath}`);
  } else if (perspectiveMemoryItemsResult.created_indexes.length === 0) {
    console.log(
      `Perspective memory items migration no-op: schema is current at ${dbPath}`,
    );
  } else {
    console.log(`Migrated perspective_memory_items indexes at ${dbPath}`);
  }
  if (perspectiveMemoryItemsResult.created_indexes.length > 0) {
    console.log(
      `Created indexes: ${perspectiveMemoryItemsResult.created_indexes.join(", ")}`,
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
