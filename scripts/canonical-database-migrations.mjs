import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeRecoveryPrivateMaterial } from "../lib/db/recovery-private-material-contract.mjs";

import {
  migrateAutohuntDailyLauncherRuns,
  migrateAutohuntHandoffPlanOperatorReviewDecisions,
  migrateAutohuntHandoffPlanPreviews,
  migrateAutohuntPreflightPackets,
  migrateAutohuntResultIntakes,
  migrateAutohuntSupervisedExecutionContracts,
  migrateAutohuntWorkQueueCandidates,
  migrateAutonomyDelegationGrants,
  migrateDeliveryExternalArtifacts,
  migrateMailboxCoordinationEventTypes,
  migratePerspectiveMemoryItems,
  migratePerspectiveMemoryProductPersistenceBoundaryRecords,
  migrateResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdate,
  migrateResearchCandidateManualGlobalDogfoodLedger,
  migrateResearchCandidateManualGlobalDogfoodMetricSnapshot,
  migrateResearchCandidateManualGlobalDogfoodNextWorkBias,
  migrateResearchCandidateManualGlobalDogfoodNextWorkSignal,
  migrateResearchCandidateManualGlobalDogfoodPerspectiveAdapter,
  migrateResearchCandidateManualGlobalDogfoodPerspectiveApply,
  migrateResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecord,
  migrateResearchCandidateManualGlobalDogfoodPerspectiveRelay,
  migrateResearchCandidateManualGlobalDogfoodPerspectiveStateApplication,
  migrateResearchCandidateManualGlobalDogfoodPerspectiveStateMutation,
  migrateResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibility,
  migrateResearchCandidateManualNotePreviewDraftActivities,
  migrateResearchCandidateManualNotePreviewDraftDiscards,
  migrateResearchCandidateManualNotePreviewDrafts,
  migrateResearchCandidateManualResultRecords,
  migrateSessionBindingColumns,
  migrateStateDeltaProposalScoring,
  migrateTemporalPreviewReviewArtifactIdempotency,
  migrateTemporalPreviewReviewArtifacts,
  migrateVerificationEvidenceRecords,
  migrateVNextDurableSemanticStoreV01,
  migrateVNextLocalOperatorSessionsV01,
  migrateVNextProjectIdentityRegistryV01,
  migrateVNextProjectLifecycleV01,
  migrateVNextProjectControlsV01,
} from "./db-migrations.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema =
  typeof __AUGNES_BUNDLED_SCHEMA_SQL__ === "string"
    ? __AUGNES_BUNDLED_SCHEMA_SQL__
    : readFileSync(path.join(rootDir, "lib", "db", "schema.sql"), "utf8");

export const CANONICAL_DATABASE_SCHEMA_CONTRACT =
  "augnes.sqlite.structural-schema.v1";
export const CANONICAL_DATABASE_MIGRATION_CONTRACT =
  "augnes.canonical-database-migrations.v1";
export const CANONICAL_DATABASE_MIGRATION_CONTRACT_VERSION = 1;
export const CANONICAL_DATABASE_RECORD_CONTRACT =
  "augnes.vnext-canonical-records.v1";
export const CANONICAL_DATABASE_RECORD_CONTRACT_VERSION = 1;
// Exact structural contract shipped by merged R8-A PR #1118. Recovery accepts
// only enumerated prior contracts; arbitrary partial SQLite files are never
// treated as migratable Augnes state.
export const CANONICAL_DATABASE_SUPPORTED_SOURCE_SCHEMA_SIGNATURES =
  Object.freeze([
    "800d9cdf741cf7b85362e8ee9c101b6b33d923a41ff1efdddc098e32df776a4a",
  ]);
export const CANONICAL_DATABASE_MIGRATION_IDS = Object.freeze([
  "0001_r8_recovery_contract",
]);

/**
 * The single script-side migration orchestration used by db:init, db:migrate,
 * and supervised bootstrap. Individual migration SQL remains owned by
 * db-migrations.mjs.
 */
export function applyCanonicalDatabaseMigrations(db) {
  let preSchemaResult = null;
  if (hasStateDeltaProposalsTable(db)) {
    preSchemaResult = migrateStateDeltaProposalScoring(db);
  }
  const vNextDurableSemanticStoreResult = migrateVNextDurableSemanticStoreV01(db);
  const vNextLocalOperatorSessionResult = migrateVNextLocalOperatorSessionsV01(db);
  const vNextProjectIdentityRegistryResult =
    migrateVNextProjectIdentityRegistryV01(db);
  const vNextProjectLifecycleResult = migrateVNextProjectLifecycleV01(db);
  const vNextProjectControlResult = migrateVNextProjectControlsV01(db);

  db.exec(schema);
  const postSchemaResult = migrateStateDeltaProposalScoring(db);
  const mailboxResult = migrateMailboxCoordinationEventTypes(db);
  if (mailboxResult.rebuilt_coordination_events) db.exec(schema);
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
  const researchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateResult =
    migrateResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdate(db);
  const researchCandidateManualGlobalDogfoodPerspectiveApplyResult =
    migrateResearchCandidateManualGlobalDogfoodPerspectiveApply(db);
  const researchCandidateManualGlobalDogfoodPerspectiveStateMutationResult =
    migrateResearchCandidateManualGlobalDogfoodPerspectiveStateMutation(db);
  const researchCandidateManualGlobalDogfoodPerspectiveAdapterResult =
    migrateResearchCandidateManualGlobalDogfoodPerspectiveAdapter(db);
  const researchCandidateManualGlobalDogfoodPerspectiveStateApplicationResult =
    migrateResearchCandidateManualGlobalDogfoodPerspectiveStateApplication(db);
  const researchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityResult =
    migrateResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibility(db);
  const researchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordResult =
    migrateResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecord(
      db,
    );
  const autonomyDelegationGrantResult = migrateAutonomyDelegationGrants(db);
  const autohuntWorkQueueCandidateResult = migrateAutohuntWorkQueueCandidates(db);
  const autohuntPreflightPacketResult = migrateAutohuntPreflightPackets(db);
  const autohuntHandoffPlanPreviewResult = migrateAutohuntHandoffPlanPreviews(db);
  const autohuntHandoffPlanOperatorReviewDecisionResult =
    migrateAutohuntHandoffPlanOperatorReviewDecisions(db);
  const autohuntSupervisedExecutionContractResult =
    migrateAutohuntSupervisedExecutionContracts(db);
  const autohuntResultIntakeResult = migrateAutohuntResultIntakes(db);
  const autohuntDailyLauncherRunResult = migrateAutohuntDailyLauncherRuns(db);
  const perspectiveMemoryBoundaryResult =
    migratePerspectiveMemoryProductPersistenceBoundaryRecords(db);
  const perspectiveMemoryItemsResult = migratePerspectiveMemoryItems(db);
  const recoveryPrivateMaterialResult = normalizeRecoveryPrivateMaterial(db);
  const migrationLedgerResult = ensureCanonicalDatabaseMigrationLedger(db);

  return {
    result: combineMigrationResults(preSchemaResult, postSchemaResult),
    vNextDurableSemanticStoreResult,
    vNextLocalOperatorSessionResult,
    vNextProjectIdentityRegistryResult,
    vNextProjectLifecycleResult,
    vNextProjectControlResult,
    mailboxResult,
    sessionBindingResult,
    deliveryArtifactsResult,
    verificationEvidenceResult,
    temporalReviewArtifactResult,
    temporalReviewArtifactIdempotencyResult,
    researchCandidateManualNotePreviewDraftsResult,
    researchCandidateManualNotePreviewDraftDiscardsResult,
    researchCandidateManualNotePreviewDraftActivitiesResult,
    researchCandidateManualResultRecordsResult,
    researchCandidateManualGlobalDogfoodLedgerResult,
    researchCandidateManualGlobalDogfoodMetricSnapshotResult,
    researchCandidateManualGlobalDogfoodNextWorkSignalResult,
    researchCandidateManualGlobalDogfoodNextWorkBiasResult,
    researchCandidateManualGlobalDogfoodPerspectiveRelayResult,
    researchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateResult,
    researchCandidateManualGlobalDogfoodPerspectiveApplyResult,
    researchCandidateManualGlobalDogfoodPerspectiveStateMutationResult,
    researchCandidateManualGlobalDogfoodPerspectiveAdapterResult,
    researchCandidateManualGlobalDogfoodPerspectiveStateApplicationResult,
    researchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityResult,
    researchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordResult,
    autonomyDelegationGrantResult,
    autohuntWorkQueueCandidateResult,
    autohuntPreflightPacketResult,
    autohuntHandoffPlanPreviewResult,
    autohuntHandoffPlanOperatorReviewDecisionResult,
    autohuntSupervisedExecutionContractResult,
    autohuntResultIntakeResult,
    autohuntDailyLauncherRunResult,
    perspectiveMemoryBoundaryResult,
    perspectiveMemoryItemsResult,
    recoveryPrivateMaterialResult,
    migrationLedgerResult,
  };
}

export function readCanonicalDatabaseMigrationLedger(db) {
  const table = db
    .prepare(
      "SELECT name FROM sqlite_schema WHERE type = 'table' AND name = 'augnes_schema_migrations'",
    )
    .get();
  if (!table) return null;
  return db
    .prepare(
      `SELECT migration_id, migration_contract, migration_contract_version,
              applied_at
       FROM augnes_schema_migrations
       ORDER BY migration_id`,
    )
    .all()
    .map((row) => ({
      migration_id: row.migration_id,
      migration_contract: row.migration_contract,
      migration_contract_version: Number(row.migration_contract_version),
      applied_at: row.applied_at,
    }));
}

export function verifyCanonicalDatabaseMigrationLedger(db) {
  const entries = readCanonicalDatabaseMigrationLedger(db);
  if (!entries) throw new Error("database_migration_ledger_missing");
  if (
    entries.length !== CANONICAL_DATABASE_MIGRATION_IDS.length ||
    entries.some(
      (entry, index) =>
        entry.migration_id !== CANONICAL_DATABASE_MIGRATION_IDS[index] ||
        entry.migration_contract !== CANONICAL_DATABASE_MIGRATION_CONTRACT ||
        entry.migration_contract_version !==
          CANONICAL_DATABASE_MIGRATION_CONTRACT_VERSION ||
        typeof entry.applied_at !== "string" ||
        entry.applied_at.length === 0 ||
        entry.applied_at.length > 64,
    )
  ) {
    throw new Error("database_migration_ledger_unsupported");
  }
  return entries;
}

export function readCanonicalPackageIdentityGuard(db) {
  const table = db
    .prepare(
      "SELECT name FROM sqlite_schema WHERE type = 'table' AND name = 'augnes_package_identity_guard'",
    )
    .get();
  if (!table) return null;
  const rows = db
    .prepare(
      `SELECT singleton, identity_state, updated_at
         FROM augnes_package_identity_guard
        ORDER BY singleton`,
    )
    .all();
  if (
    rows.length !== 1 ||
    Number(rows[0].singleton) !== 1 ||
    !["legacy_unadopted", "package_identity_required"].includes(
      rows[0].identity_state,
    ) ||
    typeof rows[0].updated_at !== "string" ||
    rows[0].updated_at.length === 0 ||
    rows[0].updated_at.length > 64
  ) {
    throw new Error("database_package_identity_guard_invalid");
  }
  return {
    identity_state: rows[0].identity_state,
    updated_at: rows[0].updated_at,
  };
}

export function verifyCanonicalPackageIdentityGuard(db) {
  const guard = readCanonicalPackageIdentityGuard(db);
  if (!guard) throw new Error("database_package_identity_guard_missing");
  return guard;
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

function hasStateDeltaProposalsTable(db) {
  return Boolean(
    db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'state_delta_proposals'",
      )
      .get(),
  );
}

function combineMigrationResults(first, second) {
  if (!first) return second;
  return {
    table_found: first.table_found || second.table_found,
    added_columns: [...first.added_columns, ...second.added_columns],
    created_indexes: [...first.created_indexes, ...second.created_indexes],
  };
}
