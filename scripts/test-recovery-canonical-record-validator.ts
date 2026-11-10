#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  chmodSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";
import { runLocalContextUseProbeV01 } from "../lib/vnext/adapters/local-context-use-probe";
import { buildDurableLocalSemanticGateScenariosV01 } from "../fixtures/vnext/runtime/durable-local-closed-loop-v0-1";

import {
  LOCAL_PROJECT_ROOT_VERIFICATION_EXPECTED_OUTPUTS_V01,
  LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01,
  LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01,
  LOCAL_PROJECT_ROOT_VERIFICATION_TITLE_V01,
} from "../lib/vnext/automation/local-project-root-verification-profile";
import {
  admitBoundedAutomationCapabilityGrantV01,
  admitQueuedVNextAutomationWorkV01,
  createVNextAutomationWorkSourceV01,
} from "../lib/vnext/persistence/bounded-automation-authority";
import {
  ensureVNextDurableSemanticStoreSchemaV01,
  insertVNextCoreRecordV01,
  type VNextCoreRecordKindV01,
} from "../lib/vnext/persistence/durable-semantic-store";
import { admitStructuredRunReceiptV01 } from "../lib/vnext/persistence/structured-run-receipt-admission";
import {
  readProjectHomeDatabaseCompatibilityV01,
  readProjectHomeProjectionV01,
} from "../lib/vnext/project-home/project-home-projection";
import {
  canonicalizeProtocolValueV01,
  compareExternalRefsV01,
  createProtocolSha256V01,
} from "../lib/vnext/protocol-primitives";
import {
  buildRunReceiptV01,
  createRunReceiptFingerprintV01,
  createRunReceiptIdempotencyKeyV01,
  deriveRunReceiptIdV01,
  validateRunReceiptV01,
} from "../lib/vnext/run-receipt";
import { validateTaskContextPacketTransitionRelationV01 } from "../lib/vnext/state-transition-eligibility";
import {
  createTaskContextPacketFingerprintV01,
  deriveTaskContextPacketIdV01,
  validateTaskContextPacketV01,
} from "../lib/vnext/task-context-packet";
import {
  buildBoundedAutomationCapabilityGrantV01,
  type BoundedAutomationHostContractV01,
} from "../lib/vnext/runtime/bounded-automation-cycle";
import {
  consumeVNextLocalOperatorBootstrapV01,
  issueVNextLocalOperatorBootstrapV01,
  type VNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSecretSourceV01,
} from "../lib/vnext/runtime/local-operator-session";
import { recordVNextOperatorPilotContextUseReviewV01 } from "../lib/vnext/runtime/operator-pilot-context-use-review";
import { readVNextOperatorPilotProposalDurableLineageV01 } from "../lib/vnext/runtime/operator-pilot-workbench-lineage";
import { readSharedProjectInspectorV01 } from "../lib/vnext/runtime/shared-project-inspector";
import {
  commitVNextSemanticTransitionV01,
  persistVNextSemanticReviewMaterialV01,
  prepareVNextSemanticCommitPreviewV01,
  recordVNextSemanticCommitAuthorizationV01,
} from "../lib/vnext/runtime/durable-semantic-transition";
import {
  compileTaskContextPacketFromPersistedSemanticStateV01,
  VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
} from "../lib/vnext/runtime/persisted-semantic-context-compiler";
import type { BoundedAutomationBudgetV01 } from "../types/vnext/bounded-automation-cycle";
import type { EpisodeDeltaProposalV01 } from "../types/vnext/episode-delta-proposal";
import type { ExternalRefV01 } from "../types/vnext/external-ref";
import type { RunReceiptV01 } from "../types/vnext/run-receipt";
import type { StateTransitionReceiptV01 } from "../types/vnext/state-transition-receipt";
import type { TaskContextPacketV01 } from "../types/vnext/task-context-packet";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import {
  createRecoveryBackup,
  listRecoveryBackups,
  validateRecoveryBackup,
} from "./recovery-backup.mjs";
import {
  getRecoveryCanonicalRecordValidatorStatusV01,
  validateRecoveryCanonicalDatabaseV01,
} from "./recovery-canonical-record-validator.mjs";
import { validateRecoveryCanonicalDatabaseV01 as validateRecoveryInMemoryV01 } from "./recovery-canonical-record-validator";
import {
  inspectRecoveryDatabaseFile,
  restoreRuntimeDatabase,
} from "./runtime-database-bootstrap.mjs";
import { buildVNextOperatorBrowserFixtureV01 } from "./vnext-operator-browser-fixture-builder-v0-1";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";

interface CoreRecordRowV01 {
  record_id: string;
  payload_json: string;
}

interface CanonicalRecordPayloadRowV01 extends CoreRecordRowV01 {
  record_kind: VNextCoreRecordKindV01;
  fingerprint: string;
}

const EXPECTED_CANONICAL_RECORD_KINDS_V01 = [
  "automation_work_item",
  "capability_grant",
  "claim_evidence_relation",
  "claim_record",
  "context_use_review",
  "episode_delta_proposal",
  "evidence_record",
  "review_decision",
  "run_receipt",
  "semantic_commit_gate",
  "semantic_state",
  "state_transition_receipt",
  "task_context_packet",
] as const satisfies readonly VNextCoreRecordKindV01[];

const APPLICATION_SCOPE_FINGERPRINT_V01 = "a".repeat(64);
const SOURCE_APPLICATION_V01 = Object.freeze({
  application_version: "0.1.0",
  build_identity: `sha256:${"c".repeat(64)}`,
  package_contract: "augnes.distributable.v1",
  package_contract_version: 1,
  runtime_contract: "augnes-local-runtime-supervisor-v1",
  runtime_schema_version: 2,
});

interface RecoveryBackupFixtureV01 {
  backupPath: string;
  payloadPath: string;
  manifest: {
    backup_id: string;
    backup_identity: string;
    reason: string;
    database: {
      canonical_record_count: number;
      recovery_eligible: boolean;
    };
  };
}

interface RestoreResultFixtureV01 {
  databaseState: string;
  schemaVersion: string;
  selectedBackupId: string;
  safetyBackupCreated: boolean;
  safetyBackupRecoveryEligible: boolean;
  safetyBackupPath: string | null;
  safetyBackupId: string | null;
}

const createRecoveryBackupForTestV01 =
  createRecoveryBackup as unknown as (input: {
    databasePath: string;
    backupDirectory: string;
    applicationScopeFingerprint: string;
    sourceApplication: typeof SOURCE_APPLICATION_V01;
    reason: "manual_recovery";
    inspectDatabase: typeof inspectRecoveryDatabaseFile;
    backupBasename: string;
    stagingBasename: string;
    now: () => Date;
  }) => Promise<RecoveryBackupFixtureV01>;

const validateRecoveryBackupForTestV01 =
  validateRecoveryBackup as unknown as (input: {
    backupPath: string;
    expectedApplicationScopeFingerprint: string;
    inspectDatabase: typeof inspectRecoveryDatabaseFile;
    expectedBackupId?: string | null;
    expectedBackupIdentity?: string | null;
  }) => RecoveryBackupFixtureV01;

const listRecoveryBackupsForTestV01 =
  listRecoveryBackups as unknown as (input: {
    backupDirectory: string;
    applicationScopeFingerprint: string;
    inspectDatabase: typeof inspectRecoveryDatabaseFile;
  }) => {
    verified: RecoveryBackupFixtureV01[];
    rejected: Array<{ backup_basename: string; reason: string }>;
  };

const restoreRuntimeDatabaseForTestV01 =
  restoreRuntimeDatabase as unknown as (input: {
    databasePath: string;
    backupDirectory: string;
    repositoryRoot: string;
    instanceId: string;
    repositoryFingerprint: string;
    runtimeOwnershipGeneration: string;
    databaseOverrideActive: boolean;
    selectedBackupId: string;
    targetCompatibility: {
      applicationScopeFingerprint: string;
      sourceApplication: typeof SOURCE_APPLICATION_V01;
    };
  }) => Promise<RestoreResultFixtureV01>;

async function main(): Promise<void> {
  const root = mkdtempSync(
    path.join(
      canonicalTemporaryParentV01(),
      "augnes-recovery-canonical-validator-",
    ),
  );
  const fixtureDirectory = path.join(root, "production-fixture");
  const fixtureDatabasePath = path.join(fixtureDirectory, "operator-pilot.db");
  const backupDirectory = path.join(root, "recovery-backups");
  const restoredDatabasePath = path.join(root, "restored-operator-pilot.db");
  const runMutationPath = path.join(root, "run-authority-mutation.db");
  const missingRunPacketRelationPath = path.join(
    root,
    "missing-run-packet-relation.db",
  );
  const crossProjectRunPacketRelationPath = path.join(
    root,
    "cross-project-run-packet-relation.db",
  );
  const missingRunTransitionRelationPath = path.join(
    root,
    "missing-run-transition-relation.db",
  );
  const crossProjectRunTransitionRelationPath = path.join(
    root,
    "cross-project-run-transition-relation.db",
  );
  const gateMutationPath = path.join(root, "gate-chronology-mutation.db");
  const packetLineageMutationPath = path.join(
    root,
    "compiled-packet-lineage-mutation.db",
  );
  const productReaderMutationPath = path.join(
    root,
    "product-reader-projection-mutation.db",
  );
  mkdirSync(fixtureDirectory, { mode: 0o700 });

  try {
    const fixture = await buildVNextOperatorBrowserFixtureV01({
      output_directory: fixtureDirectory,
      reference_time: "2026-07-21T00:00:00.000Z",
    });
    assert.equal(fixture.status, "pass");

    const networkGuard = installZeroNetworkGuard({
      allowLoopback: true,
      errorPrefix: "recovery_canonical_validator_external_io_blocked",
    });
    let validatedRecordCount = 0;
    try {
      assertHistoricalProbeRecoveryV01();
      const addedRecords =
        addMissingProductionCanonicalRecordsV01(fixtureDatabasePath);
      assert.deepEqual(addedRecords, {
        automation_work_item: 1,
        capability_grant: 1,
        context_use_review: 1,
      });
      assert.deepEqual(
        readCanonicalRecordKindsV01(fixtureDatabasePath),
        [...EXPECTED_CANONICAL_RECORD_KINDS_V01].sort(),
        "the semantic-rich recovery fixture must cover every supported canonical record kind",
      );

      assert.deepEqual(getRecoveryCanonicalRecordValidatorStatusV01(), {
        contract: "augnes.recovery-canonical-record-validator.v1",
        contract_version: 1,
        status: "available",
      });

      await assertInspectionImageReuseV01(fixtureDatabasePath, root);
      assertInvocationScopedReaderInvalidationV01(fixtureDatabasePath);

      const preProbePath = path.join(root, "pre-probe.db");
      await sqliteBackupV01(fixtureDatabasePath, preProbePath);
      const beforeProbe = readLogicalDatabaseSnapshotV01(fixtureDatabasePath);
      const recoveryBeforeProbe = validateRecoveryCanonicalDatabaseV01(fixtureDatabasePath);
      assert.equal(recoveryBeforeProbe.status, "valid");
      assert.deepEqual(readLogicalDatabaseSnapshotV01(fixtureDatabasePath), beforeProbe);
      const probeDatabase = new Database(fixtureDatabasePath, { fileMustExist: true });
      try {
        const lineage = loadContextReviewLineageV01(probeDatabase);
        const probe = runLocalContextUseProbeV01(probeDatabase, {
          workspace_id: lineage.later_packet.workspace_id,
          project_id: lineage.later_packet.project_id,
          prior_packet_id: lineage.prior_packet.packet_id,
          prior_packet_fingerprint: lineage.prior_packet.integrity.fingerprint,
          later_packet_id: lineage.later_packet.packet_id,
          later_packet_fingerprint: lineage.later_packet.integrity.fingerprint,
          expected_transition_receipt_id: lineage.transition_receipt.transition_receipt_id,
          expected_transition_receipt_fingerprint: lineage.transition_receipt.integrity.fingerprint,
          clock: { now: () => "2026-07-21T00:12:00.000Z" },
        });
        assert.equal(probe.status, "inserted");
        assert.equal(probe.relation.status, "valid");
        assert.equal(probe.receipt.task_context_packet_ref?.ref_type, "later_task_context_packet");
        assert.equal(probe.receipt.task_context_packet_ref.external_id, lineage.later_packet.packet_id);
        assert.equal(probe.receipt.task_context_packet_ref.source_ref, lineage.later_packet.integrity.fingerprint);
        const afterProbe = readLogicalDatabaseSnapshotV01(fixtureDatabasePath);
        const recoveryAfterProbe = validateRecoveryCanonicalDatabaseV01(fixtureDatabasePath);
        assert.deepEqual(readLogicalDatabaseSnapshotV01(fixtureDatabasePath), afterProbe,
          "recovery acceptance or refusal must not mutate probe-bearing data");
        console.log(JSON.stringify({ probe_recovery_regression: {
          before: recoveryBeforeProbe, after: recoveryAfterProbe,
          packet_ref: probe.receipt.task_context_packet_ref, writes_by_validation: 0,
        } }));
        assert.equal(recoveryAfterProbe.status, "valid");
        assert.equal(recoveryAfterProbe.record_count, recoveryBeforeProbe.record_count + 1);
        await assertProbeRelationRefusalsV01(root, preProbePath, probe.receipt);
        assert.deepEqual(readLogicalDatabaseSnapshotV01(fixtureDatabasePath), afterProbe,
          "negative fixtures must leave the original probe receipt and all historical bytes untouched");
      } finally {
        probeDatabase.close();
      }

      const validFileResult =
        validateRecoveryCanonicalDatabaseV01(fixtureDatabasePath);
      assert.equal(validFileResult.status, "valid");
      assert.equal(validFileResult.code, "canonical_records_valid");
      assert.equal(validFileResult.record_count >= 30, true);
      validatedRecordCount = validFileResult.record_count;

      const openDatabase = new Database(fixtureDatabasePath, {
        readonly: true,
        fileMustExist: true,
      });
      try {
        assert.deepEqual(
          validateRecoveryCanonicalDatabaseV01(openDatabase),
          validFileResult,
        );
      } finally {
        openDatabase.close();
      }

      const selectedSnapshot =
        readLogicalDatabaseSnapshotV01(fixtureDatabasePath);
      const productReadersBefore =
        await readProductReaderSnapshotV01(fixtureDatabasePath);
      assert.deepEqual(
        readLogicalDatabaseSnapshotV01(fixtureDatabasePath),
        selectedSnapshot,
        "Project Home, Workbench, and Inspector must remain read-only",
      );
      const authorityCountsBefore =
        readSemanticAuthorityCountsV01(fixtureDatabasePath);
      const selectedBackup = await createRecoveryBackupForTestV01({
        databasePath: fixtureDatabasePath,
        backupDirectory,
        applicationScopeFingerprint: APPLICATION_SCOPE_FINGERPRINT_V01,
        sourceApplication: SOURCE_APPLICATION_V01,
        reason: "manual_recovery",
        inspectDatabase: inspectRecoveryDatabaseFile,
        backupBasename: "augnes-recovery-20260721T001500-11111111.backup",
        stagingBasename:
          ".augnes-recovery-incomplete-11111111-1111-4111-8111-111111111111",
        now: () => new Date("2026-07-21T00:15:00.000Z"),
      });
      assert.equal(
        selectedBackup.manifest.database.canonical_record_count,
        validatedRecordCount,
      );
      const verifiedSelectedBackup = validateRecoveryBackupForTestV01({
        backupPath: selectedBackup.backupPath,
        expectedApplicationScopeFingerprint: APPLICATION_SCOPE_FINGERPRINT_V01,
        inspectDatabase: inspectRecoveryDatabaseFile,
        expectedBackupId: selectedBackup.manifest.backup_id,
        expectedBackupIdentity: selectedBackup.manifest.backup_identity,
      });
      assert.deepEqual(
        readLogicalDatabaseSnapshotV01(verifiedSelectedBackup.payloadPath),
        selectedSnapshot,
        "independently verified recovery payload must preserve every durable table, ledger row, replay row, canonical record, and schema object",
      );

      await sqliteBackupV01(fixtureDatabasePath, restoredDatabasePath);
      addDisplacedStateMarkerV01(restoredDatabasePath);
      const displacedSnapshot =
        readLogicalDatabaseSnapshotV01(restoredDatabasePath);
      assert.notDeepEqual(displacedSnapshot, selectedSnapshot);

      const restoreResult = await restoreRuntimeDatabaseForTestV01({
        databasePath: restoredDatabasePath,
        backupDirectory,
        repositoryRoot: process.cwd(),
        instanceId: "recovery-canonical-validator-restore",
        repositoryFingerprint: APPLICATION_SCOPE_FINGERPRINT_V01,
        runtimeOwnershipGeneration: "recovery-canonical-validator-generation-1",
        databaseOverrideActive: true,
        selectedBackupId: selectedBackup.manifest.backup_id,
        targetCompatibility: {
          applicationScopeFingerprint: APPLICATION_SCOPE_FINGERPRINT_V01,
          sourceApplication: SOURCE_APPLICATION_V01,
        },
      });
      assert.equal(restoreResult.databaseState, "restored");
      assert.equal(restoreResult.schemaVersion, "current");
      assert.equal(
        restoreResult.selectedBackupId,
        selectedBackup.manifest.backup_id,
      );
      assert.equal(restoreResult.safetyBackupCreated, true);
      assert.equal(restoreResult.safetyBackupRecoveryEligible, true);
      const restoredSnapshot = readLogicalDatabaseSnapshotV01(restoredDatabasePath);
      assertFreshSelectionRestoreV02(selectedSnapshot, restoredSnapshot);
      assert.throws(() => assertFreshSelectionRestoreV02(selectedSnapshot, selectedSnapshot),
        /restore must invalidate the old selection observation/u);
      const staleOrganization = structuredClone(restoredSnapshot);
      staleOrganization.tables.find(table => table.table_name === "vnext_project_organization")!.rows[0]!.organization_revision =
        selectedSnapshot.tables.find(table => table.table_name === "vnext_project_organization")!.rows[0]!.organization_revision;
      assert.throws(() => assertFreshSelectionRestoreV02(selectedSnapshot, staleOrganization),
        /restore must invalidate the old organization observation/u);
      const changedOrganization = structuredClone(restoredSnapshot);
      changedOrganization.tables.find(table => table.table_name === "vnext_project_organization")!.rows[0]!.organization_state = "archived";
      assert.throws(() => assertFreshSelectionRestoreV02(selectedSnapshot, changedOrganization),
        /restore must preserve every other field/u);
      const changedHistory = structuredClone(restoredSnapshot);
      changedHistory.tables.find(table => table.table_name === "vnext_core_records")!.rows[0]!.payload_json = "{}";
      assert.throws(() => assertFreshSelectionRestoreV02(selectedSnapshot, changedHistory),
        /restore must preserve every other field/u);
      assert.deepEqual(
        readSemanticAuthorityCountsV01(restoredDatabasePath),
        authorityCountsBefore,
        "backup and restore must create no Decision, Transition, proposal acceptance, run, gate, or semantic-state authority",
      );
      const productReadersAfter =
        await readProductReaderSnapshotV01(restoredDatabasePath);
      assert.deepEqual(
        productReadersAfter,
        productReadersBefore,
        "restored canonical data must produce the exact same Project Home, Semantic Workbench, and shared Inspector projections",
      );
      assert.deepEqual(
        readLogicalDatabaseSnapshotV01(restoredDatabasePath),
        restoredSnapshot,
        "restored product reader verification must remain read-only",
      );

      assert(restoreResult.safetyBackupPath);
      const verifiedSafetyBackup = validateRecoveryBackupForTestV01({
        backupPath: restoreResult.safetyBackupPath,
        expectedApplicationScopeFingerprint: APPLICATION_SCOPE_FINGERPRINT_V01,
        inspectDatabase: inspectRecoveryDatabaseFile,
        expectedBackupId: restoreResult.safetyBackupId,
      });
      assert.equal(verifiedSafetyBackup.manifest.reason, "pre_restore_safety");
      assert.deepEqual(
        readLogicalDatabaseSnapshotV01(verifiedSafetyBackup.payloadPath),
        displacedSnapshot,
        "the verified safety backup must preserve the exact displaced durable state",
      );
      const inventory = listRecoveryBackupsForTestV01({
        backupDirectory,
        applicationScopeFingerprint: APPLICATION_SCOPE_FINGERPRINT_V01,
        inspectDatabase: inspectRecoveryDatabaseFile,
      });
      assert.equal(inventory.rejected.length, 0);
      assert.equal(inventory.verified.length, 2);
      assert.equal(
        inventory.verified.some(
          (backup) =>
            backup.manifest.backup_id === selectedBackup.manifest.backup_id,
        ),
        true,
      );
      assert.equal(
        inventory.verified.some(
          (backup) =>
            backup.manifest.backup_id === restoreResult.safetyBackupId,
        ),
        true,
      );

      await sqliteBackupV01(fixtureDatabasePath, runMutationPath);
      mutateRunAuthorityV01(runMutationPath);
      const runMutationResult =
        validateRecoveryCanonicalDatabaseV01(runMutationPath);
      assert.deepEqual(runMutationResult, {
        contract: "augnes.recovery-canonical-record-validator.v1",
        contract_version: 1,
        status: "invalid",
        code: "database_canonical_invariant_failed",
        record_count: 0,
      });
      assert.equal(
        JSON.stringify(runMutationResult).includes("authorizes_merge"),
        false,
        "public result must not expose rejected canonical material",
      );

      await sqliteBackupV01(fixtureDatabasePath, missingRunPacketRelationPath);
      insertRefingerprintedRunRelationMutationV01(
        missingRunPacketRelationPath,
        "missing_task_context_packet",
      );
      assertCanonicalRefusalV01(
        missingRunPacketRelationPath,
        "database_canonical_invariant_failed",
      );

      await sqliteBackupV01(
        fixtureDatabasePath,
        crossProjectRunPacketRelationPath,
      );
      insertRefingerprintedRunRelationMutationV01(
        crossProjectRunPacketRelationPath,
        "cross_project_task_context_packet",
      );
      assertCanonicalRefusalV01(
        crossProjectRunPacketRelationPath,
        "database_cross_project_reference",
      );

      await sqliteBackupV01(
        fixtureDatabasePath,
        missingRunTransitionRelationPath,
      );
      insertRefingerprintedRunRelationMutationV01(
        missingRunTransitionRelationPath,
        "missing_state_transition_receipt",
      );
      assertCanonicalRefusalV01(
        missingRunTransitionRelationPath,
        "database_canonical_invariant_failed",
      );

      await sqliteBackupV01(
        fixtureDatabasePath,
        crossProjectRunTransitionRelationPath,
      );
      insertRefingerprintedRunRelationMutationV01(
        crossProjectRunTransitionRelationPath,
        "cross_project_state_transition_receipt",
      );
      assertCanonicalRefusalV01(
        crossProjectRunTransitionRelationPath,
        "database_cross_project_reference",
      );

      await sqliteBackupV01(fixtureDatabasePath, gateMutationPath);
      mutateGateChronologyV01(gateMutationPath);
      const gateMutationResult =
        validateRecoveryCanonicalDatabaseV01(gateMutationPath);
      assert.deepEqual(gateMutationResult, {
        contract: "augnes.recovery-canonical-record-validator.v1",
        contract_version: 1,
        status: "invalid",
        code: "database_canonical_invariant_failed",
        record_count: 0,
      });
      assert.equal(
        JSON.stringify(gateMutationResult).includes("not-a-timestamp"),
        false,
        "public result must not expose rejected gate material",
      );

      await sqliteBackupV01(fixtureDatabasePath, packetLineageMutationPath);
      mutateCompiledPacketLineageV01(packetLineageMutationPath);
      const packetLineageMutationResult = validateRecoveryCanonicalDatabaseV01(
        packetLineageMutationPath,
      );
      assert.deepEqual(packetLineageMutationResult, {
        contract: "augnes.recovery-canonical-record-validator.v1",
        contract_version: 1,
        status: "invalid",
        code: "database_canonical_invariant_failed",
        record_count: 0,
      });
      assert.equal(
        JSON.stringify(packetLineageMutationResult).includes(
          "compiled-packet-lineage-drift",
        ),
        false,
        "public result must not expose rejected packet lineage material",
      );

      await sqliteBackupV01(fixtureDatabasePath, productReaderMutationPath);
      assert.equal(inspectRecoveryDatabaseFile(productReaderMutationPath).recovery_eligible, true);
      mutateProductReaderProjectionV01(productReaderMutationPath);
      const readerMutationSnapshot = readLogicalDatabaseSnapshotV01(
        productReaderMutationPath,
      );
      assert.deepEqual(
        validateRecoveryCanonicalDatabaseV01(productReaderMutationPath),
        {
          contract: "augnes.recovery-canonical-record-validator.v1",
          contract_version: 1,
          status: "invalid",
          code: "database_reader_incompatible",
          record_count: 0,
        },
        "the staged validator must invoke the strict production reader cores",
      );
      assert.throws(
        () => inspectRecoveryDatabaseFile(productReaderMutationPath),
        (error: unknown) =>
          error instanceof Error &&
          "code" in error &&
          error.code === "database_reader_incompatible",
        "database inspection must refuse a real Product Home projection mismatch before publication",
      );
      assert.deepEqual(
        readLogicalDatabaseSnapshotV01(productReaderMutationPath),
        readerMutationSnapshot,
        "reader compatibility refusal must not mutate the candidate database",
      );

      assertZeroRecoveryOperationResidueV01(root);
      assert.equal(
        networkGuard.attempts.length,
        0,
        "canonical backup and atomic restore must make zero network attempts",
      );
    } finally {
      networkGuard.restore();
    }

    process.stdout.write(
      `${JSON.stringify({
        status: "pass",
        contract: "augnes.recovery-canonical-record-validator.v1",
        production_fixture: true,
        canonical_record_count: validatedRecordCount,
        all_supported_record_kinds: EXPECTED_CANONICAL_RECORD_KINDS_V01.length,
        valid_file_and_open_database: true,
        normal_probe_receipt_recovery_and_restore: true,
        probe_packet_source_role_and_transition_refusals: true,
        exact_durable_canonical_ledger_replay_round_trip: true,
        restored_selection_observation: "fresh_only_field_change",
        project_home_workbench_inspector_round_trip: true,
        safety_backup_preserved_displaced_state: true,
        semantic_authority_created_by_recovery: false,
        refingerprinted_run_authority_mutation_refused: true,
        refingerprinted_run_packet_relation_mutations_refused: true,
        refingerprinted_run_transition_relation_mutations_refused: true,
        standalone_run_relation_mutations_without_context_review_refused: true,
        refingerprinted_gate_chronology_mutation_refused: true,
        refingerprinted_compiled_packet_lineage_mutation_refused: true,
        production_reader_projection_mismatch_refused_before_publication: true,
        recovery_operation_residue: 0,
        external_network_attempts: 0,
      })}\n`,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

void main().catch((error: unknown) => {
  const cause =
    error instanceof Error && error.cause instanceof Error
      ? `\ncaused by: ${error.cause.stack ?? error.cause.message}`
      : "";
  process.stderr.write(
    `${error instanceof Error ? (error.stack ?? error.message) : String(error)}${cause}\n`,
  );
  process.exitCode = 1;
});

async function assertProbeRelationRefusalsV01(
  root: string,
  preProbePath: string,
  original: RunReceiptV01,
): Promise<void> {
  // Each candidate is newly built/admitted into a copy of the pre-probe store.
  // No persisted record is updated, deleted or resealed; immutable triggers stay on.
  const cases: Array<{
    name: string;
    mutate: (receipt: RunReceiptV01) => void;
    code?: "database_cross_project_reference";
    admissionRefusal?: boolean;
  }> = [
    { name: "missing-state-observation", mutate: (r) => {
      r.observations = r.observations.filter((o) => o.observation_kind !== "local_semantic_state_resolution");
    } },
    { name: "coherent-observer-substitution", mutate: (r) => visitRefs(r, "local_context_use_observer", (ref) => {
      ref.source_ref = `sha256:${"a".repeat(64)}`;
      ref.external_id = `local-context-use-observer:${ref.source_ref.slice(7, 31)}`;
    }) },
    { name: "state-record-fingerprint", mutate: (r) => visitRefs(r, "persisted_semantic_state_record", (ref) => {
      ref.source_ref = `sha256:${"b".repeat(64)}`;
    }) },
    { name: "historical-projection-fingerprint", mutate: (r) => visitRefs(r, "current_semantic_state_projection", (ref) => {
      ref.source_ref = `sha256:${"b".repeat(64)}`;
    }) },
    { name: "malformed", admissionRefusal: true, mutate: (r) => { r.task_context_packet_ref!.external_id = ""; } },
    { name: "missing-fingerprint", mutate: (r) => { r.task_context_packet_ref!.source_ref = null; } },
    { name: "unsupported", mutate: (r) => { r.task_context_packet_ref!.ref_type = "other_packet"; } },
    { name: "wrong-role", mutate: (r) => {
      r.task_context_packet_ref = r.source_refs.find((ref) => ref.ref_type === "prior_task_context_packet")!;
    } },
    { name: "foreign-project", code: "database_cross_project_reference", mutate: (r) => { r.project_id = "project:foreign-probe"; } },
    { name: "foreign-workspace", code: "database_cross_project_reference", mutate: (r) => { r.workspace_id = "workspace:foreign-probe"; } },
    ...["prior_task_context_packet", "later_task_context_packet", "state_transition_receipt"].flatMap((role) => [
      { name: `${role}-missing`, mutate: (r: RunReceiptV01) => visitRefs(r, role, (ref) => { ref.external_id = `${role}:missing`; }) },
      { name: `${role}-fingerprint`, mutate: (r: RunReceiptV01) => visitRefs(r, role, (ref) => { ref.source_ref = `sha256:${"a".repeat(64)}`; }) },
    ]),
    { name: "namespace", mutate: (r) => visitRefs(r, "later_task_context_packet", (ref) => { ref.compatibility_namespace = "unsupported.probe.v1"; }) },
    { name: "extra-source-attribution", mutate: (r) => visitRefs(r, "later_task_context_packet", (ref) => { ref.provider = "unobserved-provider"; }) },
    { name: "contract", mutate: (r) => { r.compatibility.source_contracts = ["unsupported.probe.v1"]; } },
    { name: "observer", mutate: (r) => { r.reporter_ref = { ...r.reporter_ref!, external_id: "observer:unrelated" }; } },
    { name: "read-source", mutate: (r) => {
      const observation = r.observations.find((o) => o.observation_kind === "local_later_task_context_packet_read")!;
      observation.source_refs = [r.source_refs.find((ref) => ref.ref_type === "prior_task_context_packet")!];
    } },
    { name: "wrong-prior", mutate: (r) => visitRefs(r, "prior_task_context_packet", (ref) => {
      ref.external_id = original.task_context_packet_ref!.external_id;
      ref.source_ref = original.task_context_packet_ref!.source_ref;
    }) },
  ];
  for (const test of cases) {
    const databasePath = path.join(root, `probe-${test.name}.db`);
    await sqliteBackupV01(preProbePath, databasePath);
    const input = structuredClone(original);
    test.mutate(input);
    const candidate = buildRunReceiptV01(input);
    const beforeAdmission = readLogicalDatabaseSnapshotV01(databasePath);
    const db = new Database(databasePath, { fileMustExist: true });
    try {
      if (test.admissionRefusal) {
        assert.equal(validateRunReceiptV01(candidate).status, "invalid", test.name);
        assert.throws(() => admitStructuredRunReceiptV01(db, candidate), /structured_run_receipt_invalid/);
        assert.deepEqual(readLogicalDatabaseSnapshotV01(databasePath), beforeAdmission);
        continue;
      }
      assert.equal(validateRunReceiptV01(candidate).status, "valid", test.name);
      assert.equal(admitStructuredRunReceiptV01(db, candidate).status, "inserted", test.name);
    } finally { db.close(); }
    const before = readLogicalDatabaseSnapshotV01(databasePath);
    assertCanonicalRefusalV01(databasePath, test.code ?? "database_canonical_invariant_failed");
    assert.deepEqual(readLogicalDatabaseSnapshotV01(databasePath), before,
      `${test.name} recovery refusal must be read-only`);
  }
  console.log(JSON.stringify({ probe_relation_refusals: cases.map((test) => test.name),
    immutable_records_rewritten: 0, writes_by_validation: 0 }));
}

function assertHistoricalProbeRecoveryV01(): void {
  for (const successor of ["retract", "supersede"] as const) {
    const db = new Database(":memory:");
    try {
      ensureVNextDurableSemanticStoreSchemaV01(db);
      const scenarios = buildDurableLocalSemanticGateScenariosV01();
      const initial = successor === "supersede" ? {
        ...scenarios.create, proposal: scenarios.supersede.proposal,
        decision: scenarios.supersede_prior_accept_decision,
      } : scenarios.create;
      let prior = scenarios.prefix.prior_packet;
      insertVNextCoreRecordV01(db, {
        record_kind: "task_context_packet", record_id: prior.packet_id,
        workspace_id: prior.workspace_id, project_id: prior.project_id,
        fingerprint: prior.integrity.fingerprint, idempotency_key: null,
        payload: prior, created_at: prior.generated_at,
      });
      const clock = (...minutes: number[]) => {
        let index = 0;
        return { now: () => `2026-07-10T14:${String(minutes[Math.min(index++, minutes.length - 1)]).padStart(2, "0")}:00.000Z` };
      };
      let originalReceiptRow: unknown;
      let originalReceiptId = "";
      // Normal writes advance the live projection after the first probe.
      // Retraction removes it; supersession selects a different state candidate.
      for (const [scenario, offset] of [[initial, 0], [scenarios[successor], 8]] as const) {
        const scope = { workspace_id: prior.workspace_id, project_id: prior.project_id };
        persistVNextSemanticReviewMaterialV01(db, { proposal: scenario.proposal, decision: scenario.decision });
        const identity = {
          ...scope, proposal_id: scenario.proposal.proposal_id,
          proposal_fingerprint: scenario.proposal.integrity.fingerprint,
          decision_id: scenario.decision.decision_id, decision_fingerprint: scenario.decision.integrity.fingerprint,
        };
        const preview = prepareVNextSemanticCommitPreviewV01(db, {
          ...identity, authorized_applier_identity: {
            ref_type: "semantic_transition_applier", external_id: `local-core-applier:${scenario.scenario_id}:${scope.project_id}`,
          }, gate_ttl_ms: 30 * 60 * 1000, clock: clock(offset, offset + 1),
        });
        const authorization = recordVNextSemanticCommitAuthorizationV01(db, {
          preview, confirmation_digest: preview.confirmation_digest,
          operator_actor_ref: scenario.decision.actor_ref, clock: clock(offset + 2, offset + 3, offset + 4),
        });
        const committed = commitVNextSemanticTransitionV01(db, {
          ...identity, gate_record_id: authorization.gate_record.gate_record_id,
          gate_record_fingerprint: authorization.gate_record.integrity.fingerprint,
          clock: clock(offset + 5, offset + 6),
        });
        assert.equal(committed.status, "applied");
        const transition = committed.transition_receipt;
        const later = compileTaskContextPacketFromPersistedSemanticStateV01(db, {
          ...scope, prior_packet: prior, transition_receipt_id: transition.transition_receipt_id,
          transition_receipt_fingerprint: transition.integrity.fingerprint,
          expiry_policy: { mode: "reuse_prior" }, clock: clock(offset + 7),
        }).later_packet;
        const probe = runLocalContextUseProbeV01(db, {
          ...scope, prior_packet_id: prior.packet_id, prior_packet_fingerprint: prior.integrity.fingerprint,
          later_packet_id: later.packet_id, later_packet_fingerprint: later.integrity.fingerprint,
          expected_transition_receipt_id: transition.transition_receipt_id,
          expected_transition_receipt_fingerprint: transition.integrity.fingerprint, clock: clock(offset + 8),
        });
        assert.equal(probe.relation.status, "valid");
        assert.equal(probe.resolved_states.length, offset === 0 || successor === "supersede" ? 1 : 0);
        assert.equal(probe.retracted_target_refs.length, offset === 0 || successor === "supersede" ? 0 : 1);
        const before = db.serialize();
        assert.equal(validateRecoveryInMemoryV01(db).status, "valid", scenario.scenario_id);
        assert.deepEqual(db.serialize(), before, "historical recovery validation must not write");
        if (offset === 0) {
          originalReceiptId = probe.receipt.receipt_id;
          originalReceiptRow = db.prepare("SELECT * FROM vnext_core_records WHERE record_kind = 'run_receipt' AND record_id = ?").get(originalReceiptId);
        } else {
          assert.deepEqual(db.prepare("SELECT * FROM vnext_core_records WHERE record_kind = 'run_receipt' AND record_id = ?").get(originalReceiptId), originalReceiptRow,
            "normal state advancement and recovery must preserve every original receipt byte and fingerprint");
        }
        prior = later;
      }
      console.log(JSON.stringify({ historical_probe_after_normal_state_advancement: successor, original_and_later_probe_recovery: "valid", writes_by_validation: 0 }));
    } finally { db.close(); }
  }
}

function visitRefs(value: unknown, role: string, mutate: (ref: ExternalRefV01) => void): void {
  if (!value || typeof value !== "object") return;
  const ref = value as ExternalRefV01;
  if (ref.ref_version === "external_ref.v0.1" && ref.ref_type === role) mutate(ref);
  for (const child of Object.values(value)) visitRefs(child, role, mutate);
}

function canonicalTemporaryParentV01(): string {
  const configured = process.env.AUGNES_CANONICAL_TEMP_ROOT?.trim();
  if (!configured) return tmpdir();
  if (!path.isAbsolute(configured)) {
    throw new Error("canonical temporary root must be absolute");
  }
  const stats = lstatSync(configured);
  if (!stats.isDirectory() || stats.isSymbolicLink()) {
    throw new Error("canonical temporary root must be a regular directory");
  }
  return path.resolve(configured);
}

function addMissingProductionCanonicalRecordsV01(
  databasePath: string,
): Record<
  "automation_work_item" | "capability_grant" | "context_use_review",
  number
> {
  const db = new Database(databasePath, { fileMustExist: true });
  try {
    db.pragma("foreign_keys = ON");
    applyCanonicalDatabaseMigrations(db);
    const lineage = loadContextReviewLineageV01(db);
    const sourceGrant = lineage.later_packet.capability_grant;
    assert(
      sourceGrant?.grant_external_ref,
      "production later packet must preserve an enforced capability grant",
    );
    assert.equal(sourceGrant.coverage, "enforced");

    const workBudget = {
      max_work_items: 1,
      max_active_runs: 1,
      max_attempts: 1,
      max_commands: 8,
      max_runtime_ms: 60_000,
      augnes_model_invocations: 0,
      augnes_model_tokens: 0,
      augnes_model_cost_units: 0,
      native_host_model_scope: "none",
      network_access: "denied",
    } as const;
    const work = createVNextAutomationWorkSourceV01({
      workspace_id: lineage.later_packet.workspace_id,
      project_id: lineage.later_packet.project_id,
      work_class: "bounded_project_task",
      operation_profile: "local_project_root_verification.v0.1",
      title: LOCAL_PROJECT_ROOT_VERIFICATION_TITLE_V01,
      task: structuredClone(LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01),
      source_task: structuredClone(lineage.later_packet.task),
      source_packet: {
        packet_id: lineage.later_packet.packet_id,
        packet_fingerprint: lineage.later_packet.integrity.fingerprint,
      },
      source_capability_grant: structuredClone(sourceGrant),
      source_capability_grant_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(sourceGrant),
      ),
      source_grant_record_status: "packet_bound_summary",
      required_context_refs: lineage.later_packet.selected_context.flatMap(
        (entry) => (entry.external_ref ? [entry.external_ref] : []),
      ),
      proposed_files: [],
      required_checks: [...LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01],
      expected_outputs: [
        ...LOCAL_PROJECT_ROOT_VERIFICATION_EXPECTED_OUTPUTS_V01,
      ],
      blocked_actions: [
        ...new Set([
          ...lineage.later_packet.constraints.forbidden_actions,
          ...sourceGrant.forbidden_capabilities,
        ]),
      ].sort(),
      stop_conditions: [
        "budget_exhausted",
        "cancellation_requested",
        "review_needed",
        "timeout",
      ],
      budget_projection: workBudget,
      created_at: "2026-07-21T00:10:00.000Z",
    });
    const workWrite = admitQueuedVNextAutomationWorkV01(db, {
      source: work,
      observed_at: "2026-07-21T00:10:00.000Z",
    });
    assert.equal(workWrite.status, "inserted");

    const policyFingerprint = `sha256:${"d".repeat(64)}`;
    const policyRef: ExternalRefV01 = {
      ref_version: "external_ref.v0.1",
      ref_type: "automation_policy",
      external_id: "automation-policy:recovery-validator",
      trust_class: "direct_local_observation",
      observed_at: "2026-07-21T00:10:00.000Z",
      source_ref: policyFingerprint,
      compatibility_namespace: "recovery_validator_automation_fixture.v0.1",
    };
    const grantBudget: BoundedAutomationBudgetV01 = {
      budget_version: "bounded_automation_budget.v0.1",
      max_work_items: 1,
      max_active_runs: 1,
      max_attempts: 1,
      max_runtime_ms: workBudget.max_runtime_ms,
      max_commands: workBudget.max_commands,
      max_augnes_model_invocations: 0,
      max_augnes_model_tokens: 0,
      max_augnes_model_cost_units: 0,
      native_host_model_scope: "none",
      host_egress: "local_in_process_only",
      network_access: "denied",
      automatic_retry: false,
    };
    const host: BoundedAutomationHostContractV01 = {
      adapter_version: "recovery-validator-adapter.v0.1",
      capability_version: "recovery-validator-capability.v0.1",
      timeout_ms: 60_000,
      execution_profile: "deterministic_zero_model",
      provider_egress: "forbidden",
    };
    const grant = buildBoundedAutomationCapabilityGrantV01({
      config: {
        workspace_id: work.workspace_id,
        project_id: work.project_id,
      },
      work,
      source_packet: lineage.later_packet,
      policy_ref: policyRef,
      policy_fingerprint: policyFingerprint,
      control_revision: 1,
      host,
      root_fingerprint: `sha256:${"e".repeat(64)}`,
      issued_at: "2026-07-21T00:11:00.000Z",
      expires_at: "2026-07-21T00:40:00.000Z",
      budget: grantBudget,
    });
    assert.equal(
      admitBoundedAutomationCapabilityGrantV01(db, grant).status,
      "inserted",
    );
    assert.equal(grant.grants_semantic_authority, false);
    assert.equal(grant.grants_external_action_authority, false);
    assert.equal(grant.can_merge, false);

    const reviewWrite = admitProductionContextUseReviewV01(db, lineage);
    assert.equal(reviewWrite, "inserted");
    assertDatabaseStructurallyHealthyV01(db);
    return {
      automation_work_item: 1,
      capability_grant: 1,
      context_use_review: 1,
    };
  } finally {
    db.close();
  }
}

function loadContextReviewLineageV01(db: Database.Database): {
  prior_packet: TaskContextPacketV01;
  later_packet: TaskContextPacketV01;
  transition_receipt: StateTransitionReceiptV01;
  later_run_receipt: RunReceiptV01;
} {
  const records = db
    .prepare(
      `SELECT record_kind, record_id, fingerprint, payload_json
         FROM vnext_core_records
        WHERE record_kind IN (
          'task_context_packet',
          'state_transition_receipt',
          'run_receipt'
        )
        ORDER BY created_at, record_id`,
    )
    .all() as CanonicalRecordPayloadRowV01[];
  const packets = new Map(
    records
      .filter((record) => record.record_kind === "task_context_packet")
      .map((record) => [
        record.record_id,
        JSON.parse(record.payload_json) as TaskContextPacketV01,
      ]),
  );
  const transitions = new Map(
    records
      .filter((record) => record.record_kind === "state_transition_receipt")
      .map((record) => [
        record.record_id,
        JSON.parse(record.payload_json) as StateTransitionReceiptV01,
      ]),
  );
  const runs = records
    .filter((record) => record.record_kind === "run_receipt")
    .map((record) => JSON.parse(record.payload_json) as RunReceiptV01)
    .sort((left, right) => right.recorded_at.localeCompare(left.recorded_at));

  for (const run of runs) {
    const packetRef = run.task_context_packet_ref;
    if (packetRef?.ref_type !== "task_context_packet" || !packetRef.source_ref) continue;
    const laterPacket = packets.get(packetRef.external_id);
    if (
      !laterPacket ||
      laterPacket.integrity.fingerprint !== packetRef.source_ref
    ) {
      continue;
    }
    for (const transitionRef of run.external_refs.filter(
      (ref) => ref.ref_type === "state_transition_receipt" && ref.source_ref,
    )) {
      const transition = transitions.get(transitionRef.external_id);
      if (
        !transition ||
        transition.integrity.fingerprint !== transitionRef.source_ref
      ) {
        continue;
      }
      const priorCandidates = laterPacket.compatibility.source_refs
        .filter(
          (ref) => ref.ref_type === "task_context_packet" && ref.source_ref,
        )
        .flatMap((ref) => {
          const packet = packets.get(ref.external_id);
          return packet && packet.integrity.fingerprint === ref.source_ref
            ? [packet]
            : [];
        })
        .filter(
          (priorPacket) =>
            validateTaskContextPacketTransitionRelationV01(
              priorPacket,
              transition,
              laterPacket,
            ).status === "valid",
        );
      if (priorCandidates.length === 1) {
        return {
          prior_packet: priorCandidates[0]!,
          later_packet: laterPacket,
          transition_receipt: transition,
          later_run_receipt: run,
        };
      }
    }
  }
  throw new Error("production fixture lacks one exact context-review lineage");
}

function admitProductionContextUseReviewV01(
  db: Database.Database,
  lineage: ReturnType<typeof loadContextReviewLineageV01>,
): "inserted" | "exact_replay" {
  const operator = db
    .prepare(
      `SELECT operator_id
         FROM vnext_local_operator_sessions
        WHERE workspace_id = ? AND project_id = ?
        ORDER BY issued_at, session_id
        LIMIT 1`,
    )
    .get(lineage.later_packet.workspace_id, lineage.later_packet.project_id) as
    { operator_id: string } | undefined;
  assert(operator, "production fixture must preserve an operator identity");
  const config: VNextLocalOperatorPilotConfigV01 = {
    enabled: true,
    workspace_id: lineage.later_packet.workspace_id,
    project_id: lineage.later_packet.project_id,
    operator_id: operator.operator_id,
    database_path: db.name,
  };
  const secretSource = createDeterministicSecretSourceV01();
  const bootstrap = issueVNextLocalOperatorBootstrapV01(db, {
    config,
    clock: { now: () => "2026-07-21T00:18:00.000Z" },
    secret_source: secretSource,
  });
  const session = consumeVNextLocalOperatorBootstrapV01(db, {
    config,
    bootstrap_token: bootstrap.bootstrap_token,
    clock: { now: () => "2026-07-21T00:18:01.000Z" },
    secret_source: secretSource,
  });
  const result = recordVNextOperatorPilotContextUseReviewV01(db, {
    config,
    credential: session.credential,
    clock: { now: () => "2026-07-21T00:20:00.000Z" },
    secret_source: secretSource,
    request: {
      action: "record_context_use_review",
      later_run_receipt_id: lineage.later_run_receipt.receipt_id,
      later_run_receipt_fingerprint:
        lineage.later_run_receipt.integrity.fingerprint,
      actually_used: "unknown",
      assessment: "not_applicable",
      correction_summaries: [],
      notes: [
        "Recovery round-trip coverage records no claim about actual context use.",
      ],
      metrics: {
        wrong_context_correction_count: null,
        repeated_explanation_estimate: null,
        missing_critical_context_count: null,
        context_refs_used_count: null,
      },
    },
  });
  assert.equal(result.semantic_state_changed, false);
  assert.equal(result.transition_created, false);
  assert.equal(result.packet_created, false);
  assert.equal(result.review.authority_summary.record_is_evidence, false);
  assert.equal(result.review.authority_summary.applies_state_transition, false);
  assert.equal(result.review.authority_summary.mutates_perspective, false);
  assert.equal(result.review.authority_summary.closes_work, false);
  return result.status;
}

function createDeterministicSecretSourceV01(): VNextLocalOperatorSecretSourceV01 {
  let sequence = 1;
  return {
    bytes(size: number): Uint8Array {
      const value = new Uint8Array(size);
      for (let index = 0; index < size; index += 1) {
        value[index] = (sequence * 37 + index * 17) % 256;
      }
      sequence += 1;
      return value;
    },
  };
}

async function readProductReaderSnapshotV01(
  databasePath: string,
): Promise<unknown> {
  const db = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    const scope = db
      .prepare(
        `SELECT workspace_id, project_id, operator_id, session_id
           FROM vnext_local_operator_sessions
          ORDER BY issued_at, session_id
          LIMIT 1`,
      )
      .get() as
      | {
          workspace_id: string;
          project_id: string;
          operator_id: string;
          session_id: string;
        }
      | undefined;
    assert(scope, "production fixture must preserve one operator session");
    const transitionRecord = db
      .prepare(
        `SELECT payload_json
           FROM vnext_core_records
          WHERE record_kind = 'state_transition_receipt'
            AND workspace_id = ?
            AND project_id = ?
          ORDER BY created_at DESC, record_id DESC
          LIMIT 1`,
      )
      .get(scope.workspace_id, scope.project_id) as
      { payload_json: string } | undefined;
    assert(
      transitionRecord,
      "production fixture must preserve an applied transition",
    );
    const transition = JSON.parse(
      transitionRecord.payload_json,
    ) as StateTransitionReceiptV01;
    const proposalRecord = db
      .prepare(
        `SELECT fingerprint, payload_json
           FROM vnext_core_records
          WHERE record_kind = 'episode_delta_proposal'
            AND record_id = ?
            AND workspace_id = ?
            AND project_id = ?`,
      )
      .get(
        transition.source_proposal.proposal_id,
        scope.workspace_id,
        scope.project_id,
      ) as { fingerprint: string; payload_json: string } | undefined;
    assert(proposalRecord, "transition source proposal must remain readable");
    const proposal = JSON.parse(
      proposalRecord.payload_json,
    ) as EpisodeDeltaProposalV01;
    assert.equal(
      proposal.integrity.fingerprint,
      transition.source_proposal.proposal_fingerprint,
    );
    assert.equal(proposalRecord.fingerprint, proposal.integrity.fingerprint);

    const config: VNextLocalOperatorPilotConfigV01 = {
      enabled: true,
      workspace_id: scope.workspace_id,
      project_id: scope.project_id,
      operator_id: scope.operator_id,
      database_path: databasePath,
    };
    const observedAt = "2026-07-21T00:30:00.000Z";
    const projectHome = await readProjectHomeProjectionV01(
      db,
      {
        workspace_id: scope.workspace_id,
        project_id: scope.project_id,
      },
      {
        now: () => observedAt,
        operator_config: config,
        automation_host_contract: {
          adapter_version: "recovery-validator-adapter.v0.1",
          capability_version: "recovery-validator-capability.v0.1",
          timeout_ms: 60_000,
          execution_profile: "deterministic_zero_model",
          provider_egress: "forbidden",
        },
      },
    );
    assert.equal(projectHome.workspace_id, scope.workspace_id);
    assert.equal(projectHome.project_id, scope.project_id);
    assert.equal(projectHome.coordination.projection_only, true);
    assert.equal(projectHome.coordination.semantic_authority_granted, false);

    const workbench = readVNextOperatorPilotProposalDurableLineageV01(db, {
      config,
      proposal,
      clock: { now: () => observedAt },
    });
    assert.equal(workbench.proposal_id, proposal.proposal_id);
    assert.equal(
      workbench.proposal_fingerprint,
      proposal.integrity.fingerprint,
    );
    assert.equal(workbench.overall_status, "packet_compiled");
    assert.equal(workbench.read_only, true);
    assert.equal(workbench.semantic_authority_granted, false);

    const inspector = readSharedProjectInspectorV01(db, {
      config,
      authenticated_session_id: scope.session_id,
      observed_at: observedAt,
      target: {
        target_kind: "episode_delta_proposal",
        record_id: proposal.proposal_id,
        expected_fingerprint: proposal.integrity.fingerprint,
      },
    });
    assert.equal(inspector.workspace_id, scope.workspace_id);
    assert.equal(inspector.project_id, scope.project_id);
    assert.equal(inspector.target.target_kind, "episode_delta_proposal");
    if (inspector.target.target_kind !== "episode_delta_proposal") {
      throw new Error("shared inspector proposal target changed unexpectedly");
    }
    assert.equal(inspector.target.record_id, proposal.proposal_id);
    assert.equal(inspector.authority.read_only, true);
    assert.equal(inspector.authority.writes_database, false);
    assert.equal(inspector.authority.creates_review_decision, false);
    assert.equal(inspector.authority.applies_transition, false);
    assert.equal(inspector.authority.calls_model_or_provider, false);
    assert.equal(
      inspector.sections.some(
        (section) =>
          section.section_kind === "transition_current_head" &&
          section.status === "available",
      ),
      true,
    );

    return {
      source: {
        workspace_id: scope.workspace_id,
        project_id: scope.project_id,
        proposal_id: proposal.proposal_id,
        proposal_fingerprint: proposal.integrity.fingerprint,
        transition_receipt_id: transition.transition_receipt_id,
        transition_receipt_fingerprint: transition.integrity.fingerprint,
      },
      project_home: projectHome,
      semantic_workbench: workbench,
      shared_inspector: inspector,
    };
  } finally {
    db.close();
  }
}

function readCanonicalRecordKindsV01(databasePath: string): string[] {
  const db = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    return (
      db
        .prepare(
          `SELECT DISTINCT record_kind
             FROM vnext_core_records
            ORDER BY record_kind`,
        )
        .all() as Array<{ record_kind: string }>
    ).map((row) => row.record_kind);
  } finally {
    db.close();
  }
}

function readSemanticAuthorityCountsV01(
  databasePath: string,
): Record<string, number> {
  const authorityKinds = [
    "context_use_review",
    "episode_delta_proposal",
    "review_decision",
    "run_receipt",
    "semantic_commit_gate",
    "semantic_state",
    "state_transition_receipt",
  ];
  const db = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    const counts = Object.fromEntries(
      authorityKinds.map((recordKind) => [recordKind, 0]),
    );
    const rows = db
      .prepare(
        `SELECT record_kind, COUNT(*) AS count
           FROM vnext_core_records
          GROUP BY record_kind`,
      )
      .all() as Array<{ record_kind: string; count: number }>;
    for (const row of rows) {
      if (row.record_kind in counts) counts[row.record_kind] = row.count;
    }
    return counts;
  } finally {
    db.close();
  }
}

function addDisplacedStateMarkerV01(databasePath: string): void {
  const db = new Database(databasePath, { fileMustExist: true });
  try {
    db.pragma("foreign_keys = ON");
    db.prepare(
      `INSERT INTO agents (id, name, kind, created_at)
       VALUES (?, ?, ?, ?)`,
    ).run(
      "agent:recovery-validator-displaced-state",
      "Recovery validator displaced-state marker",
      "runtime",
      "2026-07-21T00:16:00.000Z",
    );
    assertDatabaseStructurallyHealthyV01(db);
  } finally {
    db.close();
  }
  chmodSync(databasePath, 0o600);
}

async function assertInspectionImageReuseV01(databasePath: string, root: string) {
  const before = readLogicalDatabaseSnapshotV01(databasePath);
  const first = inspectWithCanonicalPassCountV01(databasePath);
  assert.equal(first.inspection.schema_classification, "current");
  assert.deepEqual(first.passes, [{ source: true, transaction: true }],
    "an unchanged migration image must use one complete canonical/ordinary-reader pass in the captured source transaction");
  assert.deepEqual(inspectWithCanonicalPassCountV01(databasePath), first,
    "a new inspection must validate again instead of reusing a path/process result");
  assert.deepEqual(readLogicalDatabaseSnapshotV01(databasePath), before);

  const predecessorPath = path.join(root, "inspection-generation-predecessor.db");
  await sqliteBackupV01(databasePath, predecessorPath);
  const predecessor = new Database(predecessorPath, { fileMustExist: true });
  try {
    // The supported pre-generation callback schema used by request-bound review.
    predecessor.exec("DROP TRIGGER trg_vnext_project_organization_initialize; DROP TABLE vnext_project_organization");
    for (const table of ["vnext_external_shares", "vnext_external_records", "vnext_external_materials", "vnext_external_envelopes"]) {
      assert.equal((predecessor.prepare(`SELECT count(*) n FROM ${table}`).get() as { n: number }).n, 0);
      predecessor.exec(`DROP TABLE ${table}`);
    }
    predecessor.exec("ALTER TABLE vnext_review_callback_policies DROP COLUMN generation");
  } finally { predecessor.close(); }
  const predecessorBefore = readLogicalDatabaseSnapshotV01(predecessorPath);
  const migrated = inspectWithCanonicalPassCountV01(predecessorPath);
  assert.equal(migrated.inspection.schema_signature, "579d73c1aa80fec79b567854b2857b7d099b1a2637c5172aa2cfc26a19df72c9");
  assert.equal(migrated.inspection.schema_classification, "old");
  assert.deepEqual(migrated.passes, [
    { source: true, transaction: true }, { source: false, transaction: false },
  ], "changed migration images must receive a separate complete canonical/ordinary-reader pass");
  assert.deepEqual(readLogicalDatabaseSnapshotV01(predecessorPath), predecessorBefore,
    "migration inspection must leave the source schema, records and permission state unchanged");

  const concurrentPath = path.join(root, "inspection-concurrent-writer.db");
  await sqliteBackupV01(databasePath, concurrentPath);
  const writer = new Database(concurrentPath, { fileMustExist: true });
  try {
    writer.pragma("journal_mode = WAL");
    let writes = 0;
    const captured = inspectWithCanonicalPassCountV01(concurrentPath, () => {
      writes++;
      mutateProductReaderProjectionV01(concurrentPath);
    });
    assert.equal(writes, 1);
    assert.deepEqual(captured, first,
      "a concurrent WAL writer cannot change the source image between canonical validation and serialization");
    const changed = readLogicalDatabaseSnapshotV01(concurrentPath);
    assert.notDeepEqual(changed, before);
    assert.throws(() => inspectRecoveryDatabaseFile(concurrentPath),
      (error: unknown) => error instanceof Error && "code" in error && error.code === "database_reader_incompatible",
      "the next inspection must reject the changed image, not reuse the earlier permission/reader result");
    assert.deepEqual(readLogicalDatabaseSnapshotV01(concurrentPath), changed);
  } finally {
    try {
      writer.pragma("wal_checkpoint(TRUNCATE)");
      writer.pragma("journal_mode = DELETE");
    } finally { writer.close(); }
  }
  console.log(JSON.stringify({ recovery_inspection_image_reuse: {
    current_passes: first.passes.length, repeated_inspection_passes: first.passes.length,
    migrated_passes: migrated.passes.length, source_unchanged: true, concurrent_snapshot_and_later_refusal: true,
  } }));
}

function assertInvocationScopedReaderInvalidationV01(databasePath: string): void {
  const source = new Database(databasePath, { readonly: true, fileMustExist: true });
  let bytes: Buffer;
  try { bytes = source.serialize(); }
  finally { source.close(); }
  const db = new Database(bytes);
  try {
    const lineage = loadContextReviewLineageV01(db);
    const receipt = lineage.transition_receipt;
    const scope = { workspace_id: receipt.workspace_id, project_id: receipt.project_id };
    const readHome = (database: Database.Database) => readProjectHomeDatabaseCompatibilityV01(database, scope, {
      now: () => "2026-07-21T00:30:00.000Z",
    });
    const expectedHome = readHome(db);
    const expectedRecovery = validateRecoveryInMemoryV01(db);
    assert.equal(expectedRecovery.status, "valid");
    const immutableMutation = (database: Database.Database, work: () => void) => {
      const triggers = database.prepare(`SELECT name, sql FROM sqlite_schema WHERE type = 'trigger'
        AND name IN ('trg_vnext_core_records_immutable_update', 'trg_vnext_core_records_immutable_delete')`)
        .all() as Array<{ name: string; sql: string }>;
      assert.equal(triggers.length, 2);
      for (const trigger of triggers) database.exec(`DROP TRIGGER ${quoteSqliteIdentifierV01(trigger.name)}`);
      work();
      for (const trigger of triggers) database.exec(trigger.sql);
    };
    const removeHistoricalGate = (database: Database.Database) => immutableMutation(database, () => {
      assert.equal(database.prepare("DELETE FROM vnext_core_records WHERE record_kind = 'semantic_commit_gate' AND record_id = ?")
        .run(receipt.semantic_commit_gate.evaluation_ref.external_id).changes, 1);
    });
    const mutations = [
      { name: "missing-historical-gate", mutate: () => removeHistoricalGate(db) },
      { name: "missing-source-decision", mutate: () => immutableMutation(db, () => {
        assert.equal(db.prepare("DELETE FROM vnext_core_records WHERE record_kind = 'review_decision' AND record_id = ?")
          .run(receipt.source_decision.decision_id).changes, 1);
      }) },
      { name: "cross-workspace-source", mutate: () => immutableMutation(db, () => {
        assert.equal(db.prepare("UPDATE vnext_core_records SET workspace_id = ? WHERE record_kind = 'review_decision' AND record_id = ?")
          .run("workspace:foreign-invocation", receipt.source_decision.decision_id).changes, 1);
      }) },
      { name: "current-projection-drift", mutate: () => {
        assert(db.prepare(`UPDATE vnext_semantic_state_entries SET current_state_fingerprint = ?
          WHERE workspace_id = ? AND project_id = ?`).run(`sha256:${"8".repeat(64)}`, scope.workspace_id, scope.project_id).changes > 0);
      } },
      { name: "current-head-drift", mutate: () => {
        assert(db.prepare(`UPDATE vnext_semantic_target_heads SET updated_at = ?
          WHERE workspace_id = ? AND project_id = ?`).run("2000-01-01T00:00:00.000Z", scope.workspace_id, scope.project_id).changes > 0);
      } },
    ];
    for (const mutation of mutations) {
      // Each pair is a new top-level invocation. No session survives a write,
      // rollback, or reopen; this also detects accidental process-global reuse.
      assert.deepEqual(readHome(db), expectedHome);
      assert.deepEqual(validateRecoveryInMemoryV01(db), expectedRecovery);
      const before = readLogicalDatabaseSnapshotV01(db);
      const rollback = new Error(`rollback-reader-invalidation:${mutation.name}`);
      try {
        db.transaction(() => {
          mutation.mutate();
          const changed = readLogicalDatabaseSnapshotV01(db);
          assert.throws(() => readHome(db), `${mutation.name}: a warm Home read must not hide later invalidation`);
          assert.equal(validateRecoveryInMemoryV01(db).status, "invalid",
            `${mutation.name}: a warm recovery read must not hide later invalidation`);
          assert.deepEqual(readLogicalDatabaseSnapshotV01(db), changed, `${mutation.name}: refusing readers remain read-only`);
          throw rollback;
        })();
        assert.fail(`${mutation.name}: the injected rollback must settle by throwing`);
      } catch (error) {
        if (error !== rollback) {
          throw new Error(`reader_invalidation_control_failed:${mutation.name}`, { cause: error });
        }
      }
      assert.deepEqual(readLogicalDatabaseSnapshotV01(db), before, `${mutation.name}: rollback preserves schema and all pre-mutation records`);
    }
    // A Buffer-backed database's serialization can retain its committed image
    // during an active transaction. Commit the corrupt disposable clone before
    // serialization so this reopen control observes the intended missing gate.
    const corruptClone = new Database(db.serialize());
    let corruptBytes: Buffer;
    try {
      removeHistoricalGate(corruptClone);
      assert.equal(corruptClone.inTransaction, false);
      corruptBytes = corruptClone.serialize();
    } finally { corruptClone.close(); }
    const corruptReopened = new Database(corruptBytes);
    try {
      const gateCount = corruptReopened.prepare("SELECT count(*) AS count FROM vnext_core_records WHERE record_kind = 'semantic_commit_gate' AND record_id = ?")
        .get(receipt.semantic_commit_gate.evaluation_ref.external_id) as { count: number };
      assert.equal(gateCount.count, 0,
      "the reopened corruption fixture must actually lack the historical gate");
      assert.throws(() => readHome(corruptReopened), "reopened committed corruption must remain refused by Home");
      assert.equal(validateRecoveryInMemoryV01(corruptReopened).status, "invalid",
        "reopened committed corruption must remain refused by recovery");
    } finally { corruptReopened.close(); }
    const reopened = new Database(db.serialize());
    try {
      assert.deepEqual(readHome(reopened), expectedHome);
      assert.deepEqual(validateRecoveryInMemoryV01(reopened), expectedRecovery);
    } finally { reopened.close(); }
    console.log(JSON.stringify({ invocation_scoped_reader_invalidation: {
      cases: mutations.map((mutation) => mutation.name), warm_reads: true,
      later_refusals: true, rollback_and_reopen: true, writes_by_validation: 0,
    } }));
  } finally { db.close(); }
}

function inspectWithCanonicalPassCountV01(databasePath: string, duringSourceRead?: () => void) {
  const prepare = Database.prototype.prepare;
  const passes: Array<{ source: boolean; transaction: boolean }> = [];
  try {
    Database.prototype.prepare = function (this: Database.Database, sql: string) {
      if (sql.replace(/\s+/gu, " ").trim() ===
        "SELECT record_kind, record_id, workspace_id, project_id, fingerprint, idempotency_key, payload_json, created_at FROM vnext_core_records ORDER BY record_kind, record_id") {
        passes.push({ source: this.name === databasePath, transaction: this.inTransaction });
        if (this.name === databasePath) duringSourceRead?.();
      }
      return prepare.call(this, sql);
    } as typeof prepare;
    return { inspection: inspectRecoveryDatabaseFile(databasePath), passes };
  } finally { Database.prototype.prepare = prepare; }
}

function readLogicalDatabaseSnapshotV01(database: string | Database.Database) {
  const ownsHandle = typeof database === "string";
  const db = typeof database === "string"
    ? new Database(database, { readonly: true, fileMustExist: true })
    : database;
  try {
    assertDatabaseStructurallyHealthyV01(db);
    const schema = db
      .prepare(
        `SELECT type, name, tbl_name, sql
           FROM sqlite_schema
          ORDER BY type, name`,
      )
      .all();
    const tableNames = (
      db
        .prepare(
          `SELECT name
             FROM sqlite_schema
            WHERE type = 'table'
            ORDER BY name`,
        )
        .all() as Array<{ name: string }>
    ).map((row) => row.name);
    const tables = tableNames.map((tableName) => {
      const quotedTable = quoteSqliteIdentifierV01(tableName);
      const columns = (
        db.prepare(`PRAGMA table_info(${quotedTable})`).all() as Array<{
          name: string;
        }>
      ).map((column) => column.name);
      const rows = (
        db.prepare(`SELECT * FROM ${quotedTable}`).all() as Array<
          Record<string, unknown>
        >
      )
        .map((row) => normalizeSqliteRowV01(row, columns))
        .sort((left, right) =>
          JSON.stringify(left).localeCompare(JSON.stringify(right)),
        );
      return { table_name: tableName, columns, rows };
    });
    return {
      pragmas: {
        application_id: db.pragma("application_id", { simple: true }),
        encoding: db.pragma("encoding", { simple: true }),
        user_version: db.pragma("user_version", { simple: true }),
      },
      schema,
      tables,
    };
  } finally {
    if (ownsHandle) db.close();
  }
}

function assertFreshSelectionRestoreV02(
  before: ReturnType<typeof readLogicalDatabaseSnapshotV01>,
  after: ReturnType<typeof readLogicalDatabaseSnapshotV01>,
): void {
  const expected = structuredClone(before);
  const selected = expected.tables.find(table => table.table_name === "vnext_active_project_selections");
  const restored = after.tables.find(table => table.table_name === "vnext_active_project_selections");
  assert(selected && restored);
  assert.equal(selected.rows.length, 1, "semantic fixture must bind one workspace selection");
  assert.equal(restored.rows.length, 1);
  const freshRevision = restored.rows[0]!.selection_revision;
  assert.equal(typeof freshRevision, "string");
  assert.match(freshRevision as string, /^selection:[0-9a-f]{32}$/u);
  assert.notEqual(freshRevision, selected.rows[0]!.selection_revision,
    "restore must invalidate the old selection observation");
  selected.rows[0]!.selection_revision = freshRevision;
  const organization = expected.tables.find(table => table.table_name === "vnext_project_organization");
  const restoredOrganization = after.tables.find(table => table.table_name === "vnext_project_organization");
  assert(organization && restoredOrganization);
  assert.equal(organization.rows.length, 1, "semantic fixture must retain one project organization");
  assert.equal(restoredOrganization.rows.length, 1);
  const freshOrganizationRevision = restoredOrganization.rows[0]!.organization_revision;
  assert.equal(typeof freshOrganizationRevision, "string");
  assert.match(freshOrganizationRevision as string, /^organization:[0-9a-f]{32}$/u);
  assert.notEqual(freshOrganizationRevision, organization.rows[0]!.organization_revision,
    "restore must invalidate the old organization observation");
  organization.rows[0]!.organization_revision = freshOrganizationRevision;
  assert.deepEqual(after, expected,
    "restore must preserve every other field, historical row, ledger, replay record and schema object");
}

function quoteSqliteIdentifierV01(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function normalizeSqliteRowV01(
  row: Record<string, unknown>,
  columns: string[],
): Record<string, unknown> {
  return Object.fromEntries(
    columns.map((column) => {
      const value = row[column];
      return [
        column,
        Buffer.isBuffer(value)
          ? { sqlite_blob_hex: value.toString("hex") }
          : value,
      ];
    }),
  );
}

function assertZeroRecoveryOperationResidueV01(root: string): void {
  const residue = listPathsRecursivelyV01(root).filter((candidate) => {
    const basename = path.basename(candidate);
    return (
      basename === ".augnes-bootstrap.lock" ||
      basename.includes(".augnes-stage-") ||
      basename.includes(".augnes-rollback-") ||
      basename.startsWith(".augnes-recovery-incomplete-") ||
      basename.endsWith("-wal") ||
      basename.endsWith("-shm") ||
      basename.endsWith("-journal")
    );
  });
  assert.deepEqual(residue, [], `unexpected recovery residue: ${residue}`);
}

function listPathsRecursivelyV01(root: string): string[] {
  const paths: string[] = [];
  for (const entry of readdirSync(root)) {
    const candidate = path.join(root, entry);
    paths.push(candidate);
    const stats = lstatSync(candidate);
    if (stats.isDirectory() && !stats.isSymbolicLink()) {
      paths.push(...listPathsRecursivelyV01(candidate));
    }
  }
  return paths.sort();
}

async function sqliteBackupV01(sourcePath: string, destinationPath: string) {
  const source = new Database(sourcePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    await source.backup(destinationPath);
  } finally {
    source.close();
  }
  chmodSync(destinationPath, 0o600);
}

function mutateProductReaderProjectionV01(databasePath: string): void {
  const db = new Database(databasePath, { fileMustExist: true });
  try {
    db.pragma("foreign_keys = ON");
    const entry = db
      .prepare(
        `SELECT workspace_id, project_id, target_key,
                current_state_fingerprint
           FROM vnext_semantic_state_entries
          ORDER BY workspace_id, project_id, target_key
          LIMIT 1`,
      )
      .get() as
      | {
          workspace_id: string;
          project_id: string;
          target_key: string;
          current_state_fingerprint: string;
        }
      | undefined;
    assert(
      entry,
      "production fixture must preserve one accepted-state projection",
    );
    const incompatibleFingerprint = `sha256:${"8".repeat(64)}`;
    assert.notEqual(entry.current_state_fingerprint, incompatibleFingerprint);
    const result = db
      .prepare(
        `UPDATE vnext_semantic_state_entries
            SET current_state_fingerprint = ?
          WHERE workspace_id = ? AND project_id = ? AND target_key = ?`,
      )
      .run(
        incompatibleFingerprint,
        entry.workspace_id,
        entry.project_id,
        entry.target_key,
      );
    assert.equal(result.changes, 1);
    assertDatabaseStructurallyHealthyV01(db);
  } finally {
    db.close();
  }
}

function mutateCompiledPacketLineageV01(databasePath: string): void {
  const db = new Database(databasePath, { fileMustExist: true });
  try {
    db.pragma("foreign_keys = ON");
    const lineage = loadContextReviewLineageV01(db);
    const compiled = compileTaskContextPacketFromPersistedSemanticStateV01(db, {
      workspace_id: lineage.later_packet.workspace_id,
      project_id: lineage.later_packet.project_id,
      prior_packet: lineage.prior_packet,
      transition_receipt_id: lineage.transition_receipt.transition_receipt_id,
      transition_receipt_fingerprint:
        lineage.transition_receipt.integrity.fingerprint,
      expiry_policy: { mode: "reuse_prior" },
      clock: { now: () => "2026-07-20T23:49:00.000Z" },
    });
    assert.equal(compiled.status, "inserted");
    assert.equal(compiled.full_chain_relation.status, "valid");

    const originalPacketId = compiled.later_packet.packet_id;
    const packet = structuredClone(compiled.later_packet);
    const priorRef = packet.compatibility.source_refs.find(
      (ref) =>
        ref.ref_type === "task_context_packet" &&
        ref.compatibility_namespace ===
          VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
    );
    assert(priorRef?.source_ref);
    priorRef.source_ref = `sha256:${"9".repeat(64)}`;
    packet.compatibility.source_refs.sort(compareExternalRefsV01);
    packet.packet_id = deriveTaskContextPacketIdV01(packet);
    packet.integrity.fingerprint =
      createTaskContextPacketFingerprintV01(packet);
    const standaloneValidation = validateTaskContextPacketV01(packet, {
      evaluated_at: packet.generated_at,
    });
    assert.equal(
      standaloneValidation.status,
      "valid",
      JSON.stringify(standaloneValidation),
    );

    removeImmutableCoreRecordTriggersV01(db);
    const update = db
      .prepare(
        `UPDATE vnext_core_records
            SET record_id = ?, fingerprint = ?, payload_json = ?
          WHERE record_kind = 'task_context_packet' AND record_id = ?`,
      )
      .run(
        packet.packet_id,
        packet.integrity.fingerprint,
        JSON.stringify(packet),
        originalPacketId,
      );
    assert.equal(update.changes, 1);
    assertDatabaseStructurallyHealthyV01(db);
  } finally {
    db.close();
  }
}

function mutateRunAuthorityV01(databasePath: string): void {
  const db = new Database(databasePath, { fileMustExist: true });
  try {
    db.pragma("foreign_keys = ON");
    removeImmutableCoreRecordTriggersV01(db);
    const row = db
      .prepare(
        `SELECT record_id, payload_json
           FROM vnext_core_records
          WHERE record_kind = 'run_receipt'
          ORDER BY record_id
          LIMIT 1`,
      )
      .get() as CoreRecordRowV01 | undefined;
    assert(row, "production fixture must contain a RunReceipt");
    const receipt = JSON.parse(row.payload_json) as RunReceiptV01;
    assert.equal(receipt.authority_summary.authorizes_merge, false);
    (
      receipt.authority_summary as { authorizes_merge: boolean }
    ).authorizes_merge = true;
    receipt.integrity.fingerprint = createRunReceiptFingerprintV01(receipt);
    db.prepare(
      `UPDATE vnext_core_records
          SET fingerprint = ?, payload_json = ?
        WHERE record_kind = 'run_receipt' AND record_id = ?`,
    ).run(
      receipt.integrity.fingerprint,
      JSON.stringify(receipt),
      row.record_id,
    );
    assertDatabaseStructurallyHealthyV01(db);
  } finally {
    db.close();
  }
}

type RunRelationMutationV01 =
  | "missing_task_context_packet"
  | "cross_project_task_context_packet"
  | "missing_state_transition_receipt"
  | "cross_project_state_transition_receipt";

function insertRefingerprintedRunRelationMutationV01(
  databasePath: string,
  mutation: RunRelationMutationV01,
): void {
  const db = new Database(databasePath, { fileMustExist: true });
  try {
    db.pragma("foreign_keys = ON");
    const receipt = structuredClone(
      loadContextReviewLineageV01(db).later_run_receipt,
    );
    receipt.run_id = `${receipt.run_id}:recovery-${mutation}`;

    if (mutation === "missing_task_context_packet") {
      assert(receipt.task_context_packet_ref);
      receipt.task_context_packet_ref.external_id =
        "task-context-packet:missing-recovery-relation";
      receipt.task_context_packet_ref.source_ref = `sha256:${"1".repeat(64)}`;
    } else if (mutation === "cross_project_task_context_packet") {
      assert(receipt.task_context_packet_ref?.source_ref);
      receipt.workspace_id = "workspace:foreign-recovery-relation";
      receipt.project_id = "project:foreign-recovery-relation";
      receipt.external_refs = receipt.external_refs.filter(
        (ref) => ref.ref_type !== "state_transition_receipt",
      );
      receipt.source_refs = receipt.source_refs.filter(
        (ref) => ref.ref_type !== "state_transition_receipt",
      );
    } else {
      const transitionRefs = [
        ...receipt.external_refs,
        ...receipt.source_refs,
      ].filter((ref) => ref.ref_type === "state_transition_receipt");
      assert.equal(
        transitionRefs.length > 0,
        true,
        "production lineage RunReceipt must preserve a Transition relation ref",
      );
      if (mutation === "missing_state_transition_receipt") {
        for (const ref of transitionRefs) {
          ref.external_id =
            "state-transition-receipt:missing-recovery-relation";
          ref.source_ref = `sha256:${"2".repeat(64)}`;
        }
      } else {
        receipt.workspace_id = "workspace:foreign-recovery-relation";
        receipt.project_id = "project:foreign-recovery-relation";
        receipt.task_context_packet_ref = null;
      }
      receipt.external_refs.sort(compareExternalRefsV01);
      receipt.source_refs.sort(compareExternalRefsV01);
    }

    receipt.idempotency_key = createRunReceiptIdempotencyKeyV01(receipt);
    receipt.receipt_id = deriveRunReceiptIdV01(receipt);
    receipt.integrity.fingerprint = createRunReceiptFingerprintV01(receipt);
    const validation = validateRunReceiptV01(receipt);
    assert.equal(
      validation.status,
      "valid",
      `relation mutation must remain structurally valid after re-fingerprinting: ${JSON.stringify(validation)}`,
    );
    const dependentReviewCount = db
      .prepare(
        `SELECT COUNT(*) AS count
           FROM vnext_core_records
          WHERE record_kind = 'context_use_review'
            AND instr(payload_json, ?) > 0`,
      )
      .get(receipt.receipt_id) as { count: number };
    assert.equal(
      dependentReviewCount.count,
      0,
      "standalone relation mutation must have no ContextUseReview dependency",
    );
    db.prepare(
      `INSERT INTO vnext_core_records (
         record_kind, record_id, workspace_id, project_id, fingerprint,
         idempotency_key, payload_json, created_at
       ) VALUES ('run_receipt', ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      receipt.receipt_id,
      receipt.workspace_id,
      receipt.project_id,
      receipt.integrity.fingerprint,
      receipt.idempotency_key,
      canonicalizeProtocolValueV01(receipt),
      receipt.recorded_at,
    );
    assertDatabaseStructurallyHealthyV01(db);
  } finally {
    db.close();
  }
}

function assertCanonicalRefusalV01(
  databasePath: string,
  code:
    "database_canonical_invariant_failed" | "database_cross_project_reference",
): void {
  assert.deepEqual(validateRecoveryCanonicalDatabaseV01(databasePath), {
    contract: "augnes.recovery-canonical-record-validator.v1",
    contract_version: 1,
    status: "invalid",
    code,
    record_count: 0,
  });
}

function mutateGateChronologyV01(databasePath: string): void {
  const db = new Database(databasePath, { fileMustExist: true });
  try {
    db.pragma("foreign_keys = ON");
    removeImmutableCoreRecordTriggersV01(db);
    const row = db
      .prepare(
        `SELECT record_id, payload_json
           FROM vnext_core_records
          WHERE record_kind = 'semantic_commit_gate'
          ORDER BY record_id
          LIMIT 1`,
      )
      .get() as CoreRecordRowV01 | undefined;
    assert(row, "production fixture must contain a semantic commit gate");
    const gate = JSON.parse(row.payload_json) as Record<string, unknown> & {
      confirmed_at: string;
      integrity: {
        algorithm: string;
        fingerprint_scope: string;
        fingerprint: string;
      };
    };
    gate.confirmed_at = "not-a-timestamp";
    gate.integrity.fingerprint = createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        ...gate,
        integrity: { ...gate.integrity, fingerprint: undefined },
      }),
    );
    db.prepare(
      `UPDATE vnext_core_records
          SET fingerprint = ?, payload_json = ?, created_at = ?
        WHERE record_kind = 'semantic_commit_gate' AND record_id = ?`,
    ).run(
      gate.integrity.fingerprint,
      JSON.stringify(gate),
      gate.confirmed_at,
      row.record_id,
    );
    assertDatabaseStructurallyHealthyV01(db);
  } finally {
    db.close();
  }
}

function removeImmutableCoreRecordTriggersV01(db: Database.Database): void {
  db.exec("DROP TRIGGER trg_vnext_core_records_immutable_update");
  db.exec("DROP TRIGGER trg_vnext_core_records_immutable_delete");
}

function assertDatabaseStructurallyHealthyV01(db: Database.Database): void {
  assert.deepEqual(db.pragma("integrity_check"), [{ integrity_check: "ok" }]);
  assert.deepEqual(db.pragma("foreign_key_check"), []);
}
