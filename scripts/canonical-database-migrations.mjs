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
  migrateVNextRepositoryExecutionStoreV01,
  migrateVNextProjectLifecycleV01,
  migrateVNextProjectControlsV01,
  migrateVNextProjectContinuityPinsV01,
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
    // Exact CUX1 pre-Pinned schema. CUX2 migrates it additively.
    "91f244d9ecda6e7702370a9cc0382c244bb9bf7929bc5abd722fa833ff1c5e7e",
    // Exact CUX2 structural predecessor used by the ledgerless recovery lane.
    "a6fb21f4cf5a33df52d130f4b05b9b26094ac151afff274592979f9fe535d302",
    // Exact CDX2B2A structural predecessor used by the ledgerless recovery
    // lane. The migration ledger and package identity guard are both absent;
    // arbitrary partial schemas remain fail-closed.
    "cdc300623c2a79fadba08eb452d34aeb3a009ae15c4e45737e5edc7e004bdd53",
    // Exact corrected CDX2B2A structural contract with the migration ledger
    // and package identity guard removed by the bounded recovery fixture.
    // This admits only that complete ledgerless contract for one-way repair;
    // arbitrary partial schemas remain fail-closed.
    "e218d8bc2c60b991c50f1b0982abb74361ca0e38bccaa28e6ec43d18165132b0",
    // Exact Browser decision-session CDX2B2A structural contract with the
    // migration ledger and package identity guard removed by the bounded
    // recovery fixture. Only this complete ledgerless contract is accepted.
    "94b48f5951c32e4ffc27578970e08bda305e332f102ee54c3bd798fd9bad2b46",
    // Exact CDX2B2B structural contract with the migration ledger and package
    // identity guard removed by the bounded recovery fixture. The start/run
    // migration remains one-way and arbitrary partial schemas still refuse.
    "d28eb1500f9cd646cb3979d6a499745cb79e4448c7ba36d7990090594e26a7c3",
    // Exact merged CDX2B2B schema. CDX2B3A rebuilds only the physical-root
    // baseline constraint/columns and preserves every valid prior row.
    "96d291d31d72154309598d4a308f8c9c8bd5182dbbcdb39ab51239e39a2355f3",
    // Exact CDX2B3A structural contract with the migration ledger and package
    // identity guard removed by the bounded recovery fixture.
    "b6a39ad73850ab0839e2f41975e61966d1a23f260cc09bf90ae5c9a877230e79",
    // Exact CDX2B4A structural contract with the migration ledger and package
    // identity guard removed by the bounded recovery fixture. The checkpoint
    // table remains machine-local run history; only this complete ledgerless
    // contract is accepted for one-way repair.
    "4fcaf45675a2a4604fa5c2a0b545366621dca967dce33bd6bab0759ee3c18db4",
    // Exact CDX2B4B structural contract with the migration ledger and package
    // identity guard removed by the bounded recovery fixture. Resume attempts
    // remain private machine-local history and arbitrary partial stores fail.
    "0bbd52cf5430bce8102865ea347b15aa90341e60d822b2000282080018698d8a",
    // Exact corrected CDX2B4B structural contract with the migration ledger
    // and package identity guard removed by the bounded recovery fixture.
    // Runtime claims, their stale-claim history, and cancellation intent stay
    // private machine-local history; partial stores remain unsupported.
    "6ba9e92e9632a88373805fa6c123d24b5fbd3e311052a76be953815e8e98190f",
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
  const vNextRepositoryExecutionStoreResult =
    migrateVNextRepositoryExecutionStoreV01(db);
  const vNextProjectLifecycleResult = migrateVNextProjectLifecycleV01(db);
  const vNextProjectControlResult = migrateVNextProjectControlsV01(db);
  const vNextProjectContinuityPinResult =
    migrateVNextProjectContinuityPinsV01(db);

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
    vNextRepositoryExecutionStoreResult,
    vNextProjectLifecycleResult,
    vNextProjectControlResult,
    vNextProjectContinuityPinResult,
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
