import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
} from "./db-migrations.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = readFileSync(path.join(rootDir, "lib", "db", "schema.sql"), "utf8");

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

  return {
    result: combineMigrationResults(preSchemaResult, postSchemaResult),
    vNextDurableSemanticStoreResult,
    vNextLocalOperatorSessionResult,
    vNextProjectIdentityRegistryResult,
    vNextProjectLifecycleResult,
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
