#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import {
  appendAutonomyRunLedgerEvent,
  buildAutonomyRunEventRecord,
  insertAutonomyRunLedgerRecord,
  readAutonomyRunLedgerRecord,
  updateAutonomyRunLedgerFields,
} from "../lib/autonomy/runner-ledger";
import {
  confirmLocalProjectOnboardingV01,
  pickAndInspectLocalProjectV01,
} from "../lib/vnext/onboarding/local-project-onboarding";
import {
  readActiveProjectSelectionV01,
  selectActiveProjectV01,
} from "../lib/vnext/persistence/project-lifecycle-registry";
import {
  insertRepositoryRunResumeCheckpointInsideTransactionV01,
  listRepositoryRunResumeCheckpointsV01,
  readRepositoryExecutionAttachmentV01,
} from "../lib/vnext/persistence/repository-execution-store";
import { canonicalizeProtocolValueV01, createProtocolSha256V01 } from "../lib/vnext/protocol-primitives";
import {
  grantRepositoryExecutionDecisionFromBrowserSessionV01,
  prepareRepositoryExecutionV01,
  readExpectedDatabaseAdmissionStateV01,
} from "../lib/vnext/repository-execution/repository-execution";
import {
  cancelRepositoryManagedDelegationV01,
  prepareRepositoryManagedDelegationV01,
  RepositoryManagedDelegationErrorV01,
  startRepositoryManagedDelegationV01,
} from "../lib/vnext/repository-execution/repository-managed-delegation";
import { inspectRepositoryWorktreeV01 } from "../lib/vnext/repository-execution/worktree-observation";
import { classifyRepositoryEnvelopeCommandV01 } from "../lib/vnext/native-host/codex-app-server-adapter";
import { createDeterministicCodexAdapterV01 } from "../lib/vnext/native-host/deterministic-codex-adapter";
import { createCanonicalRepositoryDelegationTestAdapterV01 } from "../lib/vnext/native-host/canonical-repository-delegation-test-adapter";
import {
  admitRepositoryRunResumeCheckpointV01,
  readRepositoryRunResumeEligibilityV01,
} from "../lib/vnext/repository-execution/repository-run-resume";
import { defineInitialProjectWorkV01 } from "../lib/vnext/runtime/project-work-initialization";
import { revisePreExecutionProjectWorkV01 } from "../lib/vnext/runtime/project-work-revision";
import {
  consumeVNextLocalOperatorBootstrapV01,
  issueVNextLocalOperatorBootstrapV01,
  issueVNextRepositoryDecisionChallengeV01,
  type VNextLocalOperatorPilotConfigV01,
} from "../lib/vnext/runtime/local-operator-session";
import {
  LiveNativeHostRunServiceV01,
  repositoryEnvelopeDecisionV01,
} from "../lib/vnext/runtime/live-native-host-run-service";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import {
  migrateVNextRepositoryExecutionStoreV01,
  vNextRepositoryExecutionStoreSchemaSqlV01,
} from "./db-migrations.mjs";
import type { RepositoryExecutionDecisionRequestProjectionV01 } from "../types/vnext/repository-execution";
import type {
  NativeHostApprovalRequestV01,
  NativeHostLifecycleEventV01,
  NativeHostRequestV01,
} from "../types/vnext/native-host-adapter";
import { REPOSITORY_RUN_RESUME_LIMITS_V01 } from "../types/vnext/repository-run-resume";

const ROOT = mkdtempSync(path.join(tmpdir(), "augnes-cdx2b2b-"));
const DATABASE_PATH = path.join(ROOT, "augnes.db");
const originalEnvironment = { ...process.env };
let invocationCount = 0;

void main().finally(() => {
  process.env = originalEnvironment;
  rmSync(ROOT, { recursive: true, force: true });
});

async function main(): Promise<void> {
  process.env.AUGNES_CANONICAL_TEST_MODE = "1";
  process.env.AUGNES_VNEXT_REPOSITORY_DELEGATION_TEST_ADAPTER = "1";
  process.env.AUGNES_CANONICAL_TEMP_ROOT = ROOT;
  process.env.AUGNES_DB_PATH = DATABASE_PATH;
  assertRepositoryExecutionMigrationV01();
  const db = openDatabaseV01();
  const service = new LiveNativeHostRunServiceV01({
    open_database: () => openDatabaseV01(),
    adapter_factory: () => {
      const delegate = createDeterministicCodexAdapterV01({
        now: () => "2026-08-04T01:00:20.000Z",
      });
      return {
        ...delegate,
        invoke(request, control) {
          invocationCount += 1;
          return delegate.invoke(request, control);
        },
      };
    },
    now: () => "2026-08-04T01:00:20.000Z",
  });
  try {
    const projectA = await createPreparedFixtureV01(
      db,
      "repository-a",
      "Repository A",
      "2026-08-04T01:00:00.000Z",
    );
    const projectB = await createPreparedFixtureV01(
      db,
      "repository-b",
      "Repository B",
      "2026-08-04T01:00:03.000Z",
    );
    selectProjectV01(db, projectA.workspace_id, projectB.project_id);
    writeFileSync(path.join(projectB.root, "browser-b-only.txt"), "B changed only\n", "utf8");

    const request = await prepareRepositoryManagedDelegationV01(db, {
      workspace_id: projectA.workspace_id,
      project_id: projectA.project_id,
      attachment_id: projectA.attachment_id,
    }, service, {
      now: () => "2026-08-04T01:00:10.000Z",
      platform: "darwin",
    });
    assert.equal(request.status, "decision_required");
    assert.equal(request.authority.managed_run_created, false);
    assert(request.decision_request);
    assert(request.execution_envelope);
    const granted = grantDecisionV01(
      db,
      request.decision_request,
      "2026-08-04T01:00:11.000Z",
    );
    const result = await startRepositoryManagedDelegationV01(db, {
      config: operatorConfig(projectA.workspace_id, projectA.project_id),
      workspace_id: projectA.workspace_id,
      project_id: projectA.project_id,
      attachment_id: projectA.attachment_id,
      expected_attachment_binding_fingerprint: projectA.binding_fingerprint,
      expected_execution_envelope_fingerprint:
        request.execution_envelope.envelope_fingerprint,
      decision_request_fingerprint: granted.request_fingerprint,
      decision_grant_fingerprint: granted.grant_fingerprint!,
    }, service, {
      now: () => "2026-08-04T01:00:12.000Z",
      platform: "darwin",
    });
    assert.equal(result.status, "accepted", JSON.stringify(result));
    assert.equal(result.authority.attachment_consumed, true);
    assert.equal(result.authority.managed_run_created, true);
    assert.equal(result.authority.semantic_authority_granted, false);
    assert.equal(readActiveProjectSelectionV01(db, projectA.workspace_id)?.project_id, projectB.project_id);
    const consumed = readRepositoryExecutionAttachmentV01(db, projectA.attachment_id);
    assert.equal(consumed?.lifecycle, "consumed");
    assert.equal(consumed?.consumed_run_id, result.run_id);
    assert.equal(countWhere(db, "autonomy_runs", `run_id = '${result.run_id}'`), 1);
    assert.equal(invocationCount, 1);

    const replay = await startRepositoryManagedDelegationV01(db, {
      config: operatorConfig(projectA.workspace_id, projectA.project_id),
      workspace_id: projectA.workspace_id,
      project_id: projectA.project_id,
      attachment_id: projectA.attachment_id,
      expected_attachment_binding_fingerprint: projectA.binding_fingerprint,
      expected_execution_envelope_fingerprint:
        request.execution_envelope.envelope_fingerprint,
      decision_request_fingerprint: granted.request_fingerprint,
      decision_grant_fingerprint: granted.grant_fingerprint!,
    }, service, {
      now: () => "2026-08-04T01:00:13.000Z",
      platform: "darwin",
    });
    assert.equal(replay.status, "exact_replay");
    assert.equal(replay.run_id, result.run_id);
    assert.equal(replay.authority.worker_started, false);
    assert.match(replay.ordinary_text, /current state is/u);
    assert.equal(invocationCount, 1, "exact replay must not launch a second worker");
    await assert.rejects(
      startRepositoryManagedDelegationV01(db, {
        config: operatorConfig(projectA.workspace_id, projectA.project_id),
        workspace_id: projectA.workspace_id,
        project_id: projectA.project_id,
        attachment_id: projectA.attachment_id,
        expected_attachment_binding_fingerprint: projectA.binding_fingerprint,
        expected_execution_envelope_fingerprint: `sha256:${"f".repeat(64)}`,
        decision_request_fingerprint: granted.request_fingerprint,
        decision_grant_fingerprint: granted.grant_fingerprint!,
      }, service),
      (error: unknown) =>
        error instanceof RepositoryManagedDelegationErrorV01 &&
        error.code === "repository_delegation_replay_conflict",
    );

    await assertAtomicRollbackBoundariesV01(db, service, projectA.workspace_id);
    await assertPreTransactionPacketRaceV01(db, service, projectA.workspace_id);
    await assertPreTransactionBaselineRaceV01(db, service, projectA.workspace_id);
    await assertPreTransactionManagedRunRaceV01(db, service, projectA.workspace_id);
    await assertPostCommitPacketRaceV01(db, service, projectA.workspace_id);
    await assertPostCommitWorktreeRaceV01(db, service, projectA.workspace_id);
    await assertPostCommitPhysicalRaceV01(db, service, projectA.workspace_id);
    await assertPostCommitRootRaceV01(db, service, projectA.workspace_id);
    await assertPostCommitManagedRunRaceV01(db, service, projectA.workspace_id);
    await assertAdapterCapabilityRaceV01(db, projectA.workspace_id);
    await assertExactReplayStateMatrixV01(db, projectA.workspace_id);
    await assertQueuedCancellationV01(db, service, projectA.workspace_id);
    await assertRunningCancellationV01(db, projectA.workspace_id);
    await assertCancellationDriftMatrixV01(db, projectA.workspace_id);
    await assertCancellationWithoutControllerV01(db, projectA.workspace_id);
    await assertAdapterLaunchFailureV01(db, projectA.workspace_id);
    await assertStartDecisionMismatchAndExpiryV01(db, service, projectA.workspace_id);
    assertExecutionEnvelopeAuthorityV01();
    assertSecretBoundaryDocumentationV01();
    await assertPlatformAndNonGitRefusalV01(db, service, projectA.workspace_id);
    await assertRepositoryResumeCheckpointEligibilityV01(
      db,
      projectA.workspace_id,
      projectB.project_id,
    );

    await waitForTerminalV01(db, result.run_id);
    const terminal = readAutonomyRunLedgerRecord(result.run_id, { db });
    assert(terminal);
    assert.equal(terminal.metadata.invocation_origin, "repository_attachment");
    assert.equal(terminal.metadata.repository_attachment_id, projectA.attachment_id);
    assert.equal(terminal.metadata.semantic_mutation_authorized, false);
    assert.equal(typeof terminal.metadata.run_receipt_id, "string");
    assert.equal(terminal.metadata.run_assessment_proposal_status, "available");
    assert.equal(countWhere(db, "vnext_core_records", "record_kind = 'review_decision'"), 0);
    assert.equal(countWhere(db, "vnext_core_records", "record_kind = 'state_transition_receipt'"), 0);
    assert.equal(invocationCount >= 1, true);
    const completedReplay = await startRepositoryManagedDelegationV01(
      db,
      {
        config: operatorConfig(projectA.workspace_id, projectA.project_id),
        workspace_id: projectA.workspace_id,
        project_id: projectA.project_id,
        attachment_id: projectA.attachment_id,
        expected_attachment_binding_fingerprint: projectA.binding_fingerprint,
        expected_execution_envelope_fingerprint:
          request.execution_envelope.envelope_fingerprint,
        decision_request_fingerprint: granted.request_fingerprint,
        decision_grant_fingerprint: granted.grant_fingerprint!,
      },
      service,
    );
    assertExactReplayProjectionV01(completedReplay, "completed");

    console.log(JSON.stringify({
      status: "pass",
      contract: "repository_managed_delegation_start.v0.1",
      attachment_consumed_once: true,
      consumed_run_id_exact: true,
      exact_replay_worker_count: invocationCount,
      selection_independent_start: true,
      atomic_rollback_boundaries: [
        "run_claim_admitted",
        "attachment_consumed",
        "decision_consumed",
      ],
      pre_transaction_packet_race_refused: true,
      pre_transaction_baseline_race_refused: true,
      pre_transaction_managed_run_race_refused: true,
      post_commit_packet_race_blocked_before_worker: true,
      post_commit_worktree_race_blocked_before_worker: true,
      post_commit_physical_root_race_blocked_before_worker: true,
      post_commit_root_binding_race_blocked_before_worker: true,
      post_commit_managed_run_race_blocked_before_worker: true,
      adapter_capability_race_blocked_before_worker: true,
      exact_replay_state_matrix_truthful: true,
      queued_cancellation_idempotent: true,
      running_cancellation_idempotent: true,
      cancellation_execution_eligibility_independent: true,
      cancellation_missing_controller_truthful: true,
      adapter_launch_failure_preserves_consumption: true,
      start_decision_mismatch_and_expiry_refused: true,
      execution_envelope_authority_classification: true,
      in_repository_secret_scope_claim_bounded: true,
      cdx2b2a_schema_migration_preserved_and_upgraded: true,
      resume_checkpoint_exact_replay_and_monotonicity: true,
      resume_checkpoint_strict_operation_lifecycle_grammar: true,
      resume_checkpoint_exact_lifecycle_event_replay: true,
      resume_candidate_selection_bounded_and_canonical: true,
      resume_candidate_relations_fail_closed: true,
      resume_eligibility_state_matrix: true,
      resume_eligibility_browser_selection_independent: true,
      resume_eligibility_zero_effect_read: true,
      repository_attachment_resume_still_refused: true,
      windows_status: "unsupported_no_run",
      linux_status: "non_product_no_run",
      non_git_status: "unsupported_no_run",
      run_receipt_recorded: true,
      proposal_pending_review: true,
      semantic_decisions_created: 0,
      transitions_created: 0,
    }, null, 2));
  } finally {
    await service.shutdown();
    db.close();
  }
}

async function assertRepositoryResumeCheckpointEligibilityV01(
  db: Database.Database,
  workspaceId: string,
  browserProjectId: string,
): Promise<void> {
  const fixture = await createPreparedFixtureV01(
    db,
    "resume-checkpoint-repository",
    "Resume Checkpoint Repository",
    "2026-08-04T02:00:00.000Z",
  );
  process.env.AUGNES_VNEXT_REPOSITORY_CHECKPOINT_HOLD = "1";
  const runtimeInstance = `sha256:${"8".repeat(64)}`;
  const runtimeGeneration = `sha256:${"9".repeat(64)}`;
  const service = new LiveNativeHostRunServiceV01({
    open_database: () => openDatabaseV01(),
    adapter_factory: () =>
      createCanonicalRepositoryDelegationTestAdapterV01(process.env),
    runtime_instance_fingerprint: runtimeInstance,
    runtime_generation_fingerprint: runtimeGeneration,
  });
  try {
    const request = await requestAndGrantV01(
      db,
      service,
      fixture,
      "2026-08-04T02:00:10.000Z",
    );
    const started = await startRepositoryManagedDelegationV01(
      db,
      startInputV01(fixture, request),
      service,
      { now: () => "2026-08-04T02:00:12.000Z", platform: "darwin" },
    );
    assert.equal(started.status, "accepted");
    await waitForCheckpointCountV01(db, started.run_id, 4);
    const admittedCheckpointCount = countWhere(
      db,
      "vnext_repository_run_resume_checkpoints",
      `run_id = '${started.run_id}'`,
    );
    assert.equal(
      admittedCheckpointCount,
      4,
      JSON.stringify(readAutonomyRunLedgerRecord(started.run_id, { db }), null, 2),
    );
    const admittedCheckpoints = listRepositoryRunResumeCheckpointsV01(db, {
      workspace_id: workspaceId,
      project_id: fixture.project_id,
      run_id: started.run_id,
    });
    assert.deepEqual(
      admittedCheckpoints.map((checkpoint) => checkpoint.operation_certainty),
      ["not_started", "completed", "not_started", "completed"],
    );
    assert.equal(
      admittedCheckpoints.every((checkpoint, index) =>
        index === 0 ||
        checkpoint.effect_ledger_high_water_mark >
          admittedCheckpoints[index - 1]!.effect_ledger_high_water_mark
      ),
      true,
    );
    db.exec("BEGIN IMMEDIATE");
    assert.equal(
      insertRepositoryRunResumeCheckpointInsideTransactionV01(
        db,
        admittedCheckpoints.at(-1)!,
      ),
      "exact_replay",
    );
    db.exec("COMMIT");
    let latestCheckpoint = admittedCheckpoints.at(-1)!;
    const conflictingMaterial = {
      ...latestCheckpoint,
      operation_certainty: "failed" as const,
    };
    const { checkpoint_fingerprint: _priorFingerprint, ...conflictingBasis } =
      conflictingMaterial;
    const conflictingCheckpoint = {
      ...conflictingBasis,
      checkpoint_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(conflictingBasis),
      ),
    };
    db.exec("BEGIN IMMEDIATE");
    assert.throws(() =>
      insertRepositoryRunResumeCheckpointInsideTransactionV01(
        db,
        conflictingCheckpoint,
      ),
    );
    db.exec("ROLLBACK");
    const config = operatorConfig(workspaceId, fixture.project_id);
    const active = await readRepositoryRunResumeEligibilityV01(db, {
      config,
      generated_at: "2026-08-04T02:00:20.000Z",
    }, {
      read_controller: (exactConfig, runId) =>
        service.readRepositoryControllerObservationV01(exactConfig, runId),
      read_capability: () => service.readCapabilityContractV01(),
      platform: "darwin",
    });
    assert.equal(active.status, "active_owned");
    const mismatchedController = await readRepositoryRunResumeEligibilityV01(db, {
      config,
      generated_at: "2026-08-04T02:00:20.500Z",
    }, {
      read_controller: () => ({
        owned: true,
        controller_generation: 2,
        runtime_instance_fingerprint: runtimeInstance,
        runtime_generation_fingerprint: runtimeGeneration,
      }),
      read_capability: () => service.readCapabilityContractV01(),
      platform: "darwin",
    });
    assert.equal(mismatchedController.status, "reconciliation_required");

    const restarted = new LiveNativeHostRunServiceV01({
      open_database: () => openDatabaseV01(),
      adapter_factory: () =>
        createCanonicalRepositoryDelegationTestAdapterV01(process.env),
      runtime_instance_fingerprint: `sha256:${"a".repeat(64)}`,
      runtime_generation_fingerprint: `sha256:${"b".repeat(64)}`,
    });
    const zeroEffectBefore = {
      runs: count(db, "autonomy_runs"),
      attachments: count(db, "vnext_repository_execution_attachments"),
      decisions: count(db, "vnext_repository_execution_decision_requests"),
      results: countWhere(db, "vnext_core_records", "record_kind = 'run_receipt'"),
      proposals: countWhere(db, "vnext_core_records", "record_kind = 'run_assessment_proposal'"),
    };
    const readRestarted = () => readRepositoryRunResumeEligibilityV01(db, {
      config,
      generated_at: "2026-08-04T02:00:21.000Z",
    }, {
      read_controller: (exactConfig, runId) =>
        restarted.readRepositoryControllerObservationV01(exactConfig, runId),
      read_capability: () => restarted.readCapabilityContractV01(),
      platform: "darwin",
    });
    let ready = await readRestarted();
    assert.equal(ready.status, "resume_ready", JSON.stringify(ready));
    assert.equal(ready.authority.starts_or_resumes_worker, false);
    assert.equal(ready.authority.writes_database, false);
    assert.equal(ready.last_confirmed_operation?.certainty, "completed");
    const lifecycleReplaySource = db.prepare(
      `SELECT payload_json FROM autonomy_run_events
        WHERE run_id = ? AND json_extract(payload_json, '$.event_kind') = 'work_checkpoint'
        ORDER BY rowid DESC LIMIT 1`,
    ).pluck().get(started.run_id) as string;
    const replaySourcePayload = JSON.parse(lifecycleReplaySource) as {
      host_refs: NativeHostLifecycleEventV01["host_refs"];
    };
    const replayOperationRef = createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        run_id: started.run_id,
        operation: "exact-lifecycle-replay",
      }),
    );
    const replayEvent: NativeHostLifecycleEventV01 = {
      event_id: "native-host-event:exact-lifecycle-replay",
      run_id: started.run_id,
      state: "running",
      event_kind: "work_checkpoint",
      observed_at: "2026-08-04T02:00:21.500Z",
      coverage: "observed",
      host_refs: replaySourcePayload.host_refs,
      bounded_metadata: {
        checkpoint_kind: "file_change",
        phase: "declared",
        status: "active",
        operation_ref: replayOperationRef,
        certainty: "not_started",
        change_count: 0,
      },
    };
    const controller = [...(
      service as unknown as {
        controllers: Map<string, { report_event(event: NativeHostLifecycleEventV01): Promise<void> }>;
      }
    ).controllers.values()][0]!;
    await controller.report_event(replayEvent);
    const lifecycleRowsAfterFirstAdmission = countWhere(
      db,
      "autonomy_run_events",
      `json_extract(payload_json, '$.event_id') = '${replayEvent.event_id}'`,
    );
    const checkpointsAfterFirstAdmission = countWhere(
      db,
      "vnext_repository_run_resume_checkpoints",
      `run_id = '${started.run_id}'`,
    );
    await controller.report_event(replayEvent);
    assert.equal(countWhere(
      db,
      "autonomy_run_events",
      `json_extract(payload_json, '$.event_id') = '${replayEvent.event_id}'`,
    ), lifecycleRowsAfterFirstAdmission);
    assert.equal(countWhere(
      db,
      "vnext_repository_run_resume_checkpoints",
      `run_id = '${started.run_id}'`,
    ), checkpointsAfterFirstAdmission);
    latestCheckpoint = listRepositoryRunResumeCheckpointsV01(db, {
      workspace_id: workspaceId,
      project_id: fixture.project_id,
      run_id: started.run_id,
    }).at(-1)!;
    ready = await readRestarted();
    assert.equal(ready.status, "resume_ready");
    const insertAttachmentRunCandidate = (
      label: string,
      status: "running" | "paused" | "completed" | "failed",
      updatedAt: string,
    ) => {
      const sourceRun = readAutonomyRunLedgerRecord(started.run_id, { db })!;
      const candidateRunId = `host-run:resume-candidate:${label}`;
      const candidateAttachmentId = createProtocolSha256V01(
        canonicalizeProtocolValueV01({ label, kind: "attachment" }),
      );
      const candidateBinding = createProtocolSha256V01(
        canonicalizeProtocolValueV01({ label, kind: "binding" }),
      );
      db.prepare(
        `INSERT INTO vnext_repository_execution_attachments (
           attachment_id, attachment_version, workspace_id, project_id,
           node_scope_fingerprint, physical_root_baseline_fingerprint,
           root_binding_fingerprint, task_context_packet_id,
           task_context_packet_fingerprint, current_work_fingerprint,
           project_execution_admission_fingerprint,
           worktree_observation_fingerprint, managed_run_state_fingerprint,
           binding_fingerprint, prepared_at, freshness_policy_json, lifecycle,
           stale_reason, lifecycle_updated_at, consumed_run_id
         )
         SELECT ?, attachment_version, workspace_id, project_id,
                node_scope_fingerprint, physical_root_baseline_fingerprint,
                root_binding_fingerprint, task_context_packet_id,
                task_context_packet_fingerprint, current_work_fingerprint,
                project_execution_admission_fingerprint,
                worktree_observation_fingerprint, managed_run_state_fingerprint,
                ?, prepared_at, freshness_policy_json, 'consumed', NULL, ?, ?
           FROM vnext_repository_execution_attachments WHERE attachment_id = ?`,
      ).run(
        candidateAttachmentId,
        candidateBinding,
        updatedAt,
        candidateRunId,
        fixture.attachment_id,
      );
      insertAutonomyRunLedgerRecord({
        ...sourceRun,
        run_id: candidateRunId,
        status,
        updated_at: updatedAt,
        finished_at: status === "completed" || status === "failed"
          ? updatedAt
          : null,
        metadata: {
          ...sourceRun.metadata,
          repository_attachment_id: candidateAttachmentId,
          repository_attachment_binding_fingerprint: candidateBinding,
        },
      }, [], [], { db });
      return {
        run_id: candidateRunId,
        attachment_id: candidateAttachmentId,
        remove: () => {
          db.prepare("DELETE FROM autonomy_runs WHERE run_id = ?").run(
            candidateRunId,
          );
          db.prepare(
            "DELETE FROM vnext_repository_execution_attachments WHERE attachment_id = ?",
          ).run(candidateAttachmentId);
        },
      };
    };

    const newerTerminal = insertAttachmentRunCandidate(
      "newer-terminal",
      "completed",
      "2026-08-04T02:10:00.000Z",
    );
    assert.equal((await readRestarted()).status, "resume_ready");
    const selectedControllerRunIds: string[] = [];
    const olderActiveWithNewerTerminal = await readRepositoryRunResumeEligibilityV01(
      db,
      { config, generated_at: "2026-08-04T02:10:01.000Z" },
      {
        read_controller: (_exactConfig, runId) => {
          selectedControllerRunIds.push(runId);
          return runId === started.run_id
            ? {
                owned: true,
                controller_generation: Number(
                  readAutonomyRunLedgerRecord(runId, { db })!.metadata
                    .controller_generation,
                ),
                runtime_instance_fingerprint: runtimeInstance,
                runtime_generation_fingerprint: runtimeGeneration,
              }
            : {
                owned: false,
                controller_generation: null,
                runtime_instance_fingerprint: null,
                runtime_generation_fingerprint: null,
              };
        },
        read_capability: () => restarted.readCapabilityContractV01(),
        platform: "darwin",
      },
    );
    assert.equal(olderActiveWithNewerTerminal.status, "active_owned");
    assert.deepEqual(selectedControllerRunIds, [started.run_id]);
    const wrongCandidateController = await readRepositoryRunResumeEligibilityV01(
      db,
      { config, generated_at: "2026-08-04T02:10:02.000Z" },
      {
        read_controller: (_exactConfig, runId) => ({
          owned: runId === newerTerminal.run_id,
          controller_generation: runId === newerTerminal.run_id ? 1 : null,
          runtime_instance_fingerprint:
            runId === newerTerminal.run_id ? runtimeInstance : null,
          runtime_generation_fingerprint:
            runId === newerTerminal.run_id ? runtimeGeneration : null,
        }),
        read_capability: () => restarted.readCapabilityContractV01(),
        platform: "darwin",
      },
    );
    assert.equal(wrongCandidateController.status, "resume_ready");
    updateAutonomyRunLedgerFields(started.run_id, { status: "paused" }, { db });
    assert.equal((await readRestarted()).status, "resume_ready");
    updateAutonomyRunLedgerFields(started.run_id, { status: "running" }, { db });

    updateAutonomyRunLedgerFields(newerTerminal.run_id, {
      status: "running",
      finished_at: null,
    }, { db });
    assert.equal((await readRestarted()).status, "unavailable");
    updateAutonomyRunLedgerFields(newerTerminal.run_id, {
      status: "completed",
      finished_at: "2026-08-04T02:10:00.000Z",
    }, { db });
    newerTerminal.remove();

    const originalRunForCandidateRelations = readAutonomyRunLedgerRecord(
      started.run_id,
      { db },
    )!;
    updateAutonomyRunLedgerFields(started.run_id, {
      metadata: {
        ...originalRunForCandidateRelations.metadata,
        repository_attachment_id: `sha256:${"0".repeat(64)}`,
      },
    }, { db });
    assert.equal((await readRestarted()).status, "unavailable");
    updateAutonomyRunLedgerFields(started.run_id, {
      metadata: {
        ...originalRunForCandidateRelations.metadata,
        repository_attachment_binding_fingerprint: `sha256:${"1".repeat(64)}`,
      },
    }, { db });
    assert.equal((await readRestarted()).status, "unavailable");
    updateAutonomyRunLedgerFields(started.run_id, {
      metadata: originalRunForCandidateRelations.metadata,
    }, { db });

    updateAutonomyRunLedgerFields(started.run_id, {
      status: "completed",
      finished_at: "2026-08-04T02:11:00.000Z",
    }, { db });
    const secondTerminal = insertAttachmentRunCandidate(
      "second-terminal",
      "failed",
      "2026-08-04T02:12:00.000Z",
    );
    assert.equal((await readRestarted()).status, "terminal");
    const consumedRunId = db.prepare(
      "SELECT consumed_run_id FROM vnext_repository_execution_attachments WHERE attachment_id = ?",
    ).pluck().get(secondTerminal.attachment_id) as string;
    db.prepare(
      "UPDATE vnext_repository_execution_attachments SET consumed_run_id = ? WHERE attachment_id = ?",
    ).run("host-run:wrong-terminal-consumer", secondTerminal.attachment_id);
    assert.equal((await readRestarted()).status, "unavailable");
    db.prepare(
      "UPDATE vnext_repository_execution_attachments SET consumed_run_id = ? WHERE attachment_id = ?",
    ).run(consumedRunId, secondTerminal.attachment_id);
    secondTerminal.remove();
    updateAutonomyRunLedgerFields(started.run_id, {
      status: "running",
      finished_at: null,
    }, { db });
    const publicEligibility = JSON.stringify(ready);
    assert(
      Buffer.byteLength(publicEligibility, "utf8") <=
        REPOSITORY_RUN_RESUME_LIMITS_V01.public_serialized_bytes,
    );
    for (const forbidden of [
      "provider_thread_ref",
      "last_turn_ref",
      "operation_ref",
      "worktree_observation_fingerprint",
      fixture.root,
    ]) {
      assert.equal(publicEligibility.includes(forbidden), false, forbidden);
    }
    assert.equal(
      (await inspectRepositoryWorktreeV01(fixture.root)).observation_fingerprint,
      db.prepare(
        `SELECT worktree_observation_fingerprint
           FROM vnext_repository_run_resume_checkpoints
          WHERE run_id = ? ORDER BY effect_ledger_high_water_mark DESC LIMIT 1`,
      ).pluck().get(started.run_id),
    );
    assert.notEqual(
      (await inspectRepositoryWorktreeV01(fixture.root)).observation_fingerprint,
      readRepositoryExecutionAttachmentV01(db, fixture.attachment_id)?.worktree_observation_fingerprint,
    );

    selectProjectV01(db, workspaceId, browserProjectId);
    assert.deepEqual(await readRestarted(), ready);
    assert.deepEqual({
      runs: count(db, "autonomy_runs"),
      attachments: count(db, "vnext_repository_execution_attachments"),
      decisions: count(db, "vnext_repository_execution_decision_requests"),
      results: countWhere(db, "vnext_core_records", "record_kind = 'run_receipt'"),
      proposals: countWhere(db, "vnext_core_records", "record_kind = 'run_assessment_proposal'"),
    }, zeroEffectBefore);

    const driftPath = path.join(fixture.root, "after-safe-checkpoint.txt");
    writeFileSync(driftPath, "drift\n", "utf8");
    assert.equal((await readRestarted()).status, "stale");
    rmSync(driftPath);
    assert.equal((await readRestarted()).status, "resume_ready");

    const unsupported = await readRepositoryRunResumeEligibilityV01(db, {
      config,
      generated_at: "2026-08-04T02:00:22.000Z",
    }, {
      read_controller: () => ({
        owned: false,
        controller_generation: null,
        runtime_instance_fingerprint: null,
        runtime_generation_fingerprint: null,
      }),
      read_capability: () => ({
        ...restarted.readCapabilityContractV01(),
        resumable_after_detach: false,
      }),
      platform: "darwin",
    });
    assert.equal(unsupported.status, "unsupported");

    const run = readAutonomyRunLedgerRecord(started.run_id, { db });
    assert(run);
    const originalMetadata = run.metadata;
    for (const metadata of [
      { ...originalMetadata, host_thread_ref: null },
      { ...originalMetadata, host_turn_ref: null },
      { ...originalMetadata, host_thread_ref: { malformed: true } },
    ]) {
      updateAutonomyRunLedgerFields(started.run_id, { metadata }, { db });
      assert.equal((await readRestarted()).status, "unsupported");
    }
    for (const metadata of [
      {
        ...originalMetadata,
        repository_execution_envelope_fingerprint: `sha256:${"d".repeat(64)}`,
      },
      { ...originalMetadata, adapter_version: "drifted-adapter.v0.1" },
      { ...originalMetadata, capability_version: "drifted-capability.v0.1" },
      { ...originalMetadata, packet_fingerprint: `sha256:${"e".repeat(64)}` },
    ]) {
      updateAutonomyRunLedgerFields(started.run_id, { metadata }, { db });
      assert.equal((await readRestarted()).status, "stale");
    }
    updateAutonomyRunLedgerFields(started.run_id, {
      status: "waiting_for_approval",
      metadata: { ...originalMetadata, pending_approval: { malformed: true } },
    }, { db });
    assert.equal((await readRestarted()).status, "reconciliation_required");
    updateAutonomyRunLedgerFields(started.run_id, {
      status: "running",
      metadata: originalMetadata,
    }, { db });

    const conflictRunId = "host-run:resume-eligibility-conflict";
    insertAutonomyRunLedgerRecord({
      ...run,
      run_id: conflictRunId,
      status: "running",
      metadata: {
        ...run.metadata,
        invocation_origin: "interactive",
      },
    }, [], [], { db });
    assert.equal((await readRestarted()).status, "stale");
    db.prepare("DELETE FROM autonomy_runs WHERE run_id = ?").run(conflictRunId);
    assert.equal((await readRestarted()).status, "resume_ready");

    const baselineIdentity = db.prepare(
      `SELECT filesystem_object_identity
         FROM vnext_physical_root_baselines
        WHERE workspace_id = ? AND project_id = ?`,
    ).pluck().get(workspaceId, fixture.project_id) as string;
    db.prepare(
      `UPDATE vnext_physical_root_baselines
          SET filesystem_object_identity = ?
        WHERE workspace_id = ? AND project_id = ?`,
    ).run(`${baselineIdentity}:drift`, workspaceId, fixture.project_id);
    assert.equal((await readRestarted()).status, "stale");
    db.prepare(
      `UPDATE vnext_physical_root_baselines
          SET filesystem_object_identity = ?
        WHERE workspace_id = ? AND project_id = ?`,
    ).run(baselineIdentity, workspaceId, fixture.project_id);

    const rootBinding = db.prepare(
      `SELECT normalized_root FROM vnext_project_root_bindings
        WHERE workspace_id = ? AND project_id = ?`,
    ).pluck().get(workspaceId, fixture.project_id) as string;
    db.prepare(
      `UPDATE vnext_project_root_bindings SET normalized_root = ?
        WHERE workspace_id = ? AND project_id = ?`,
    ).run(`${rootBinding}-drift`, workspaceId, fixture.project_id);
    assert.equal((await readRestarted()).status, "stale");
    db.prepare(
      `UPDATE vnext_project_root_bindings SET normalized_root = ?
        WHERE workspace_id = ? AND project_id = ?`,
    ).run(rootBinding, workspaceId, fixture.project_id);

    const multipleBasis = {
      ...latestCheckpoint,
      operation_ref: `sha256:${"f".repeat(64)}`,
    };
    const { checkpoint_fingerprint: _multiplePrior, ...multipleMaterial } =
      multipleBasis;
    const multipleCheckpoint = {
      ...multipleMaterial,
      checkpoint_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(multipleMaterial),
      ),
    };
    db.exec("BEGIN IMMEDIATE");
    assert.equal(
      insertRepositoryRunResumeCheckpointInsideTransactionV01(
        db,
        multipleCheckpoint,
      ),
      "inserted",
    );
    db.exec("COMMIT");
    assert.equal((await readRestarted()).status, "reconciliation_required");
    db.prepare(
      "DELETE FROM vnext_repository_run_resume_checkpoints WHERE checkpoint_fingerprint = ?",
    ).run(multipleCheckpoint.checkpoint_fingerprint);

    db.prepare(
      `UPDATE vnext_repository_run_resume_checkpoints
          SET provider_thread_ref_json = '{"malformed":true}'
        WHERE checkpoint_fingerprint = ?`,
    ).run(latestCheckpoint.checkpoint_fingerprint);
    assert.equal((await readRestarted()).status, "reconciliation_required");
    db.prepare(
      `UPDATE vnext_repository_run_resume_checkpoints
          SET provider_thread_ref_json = ?
        WHERE checkpoint_fingerprint = ?`,
    ).run(
      JSON.stringify(latestCheckpoint.provider_thread_ref),
      latestCheckpoint.checkpoint_fingerprint,
    );

    const checkpointsBeforeHistoryDeletion =
      listRepositoryRunResumeCheckpointsV01(db, {
        workspace_id: workspaceId,
        project_id: fixture.project_id,
        run_id: started.run_id,
      });
    db.prepare(
      "DELETE FROM vnext_repository_run_resume_checkpoints WHERE run_id = ?",
    ).run(started.run_id);
    assert.equal((await readRestarted()).status, "reconciliation_required");
    db.exec("BEGIN IMMEDIATE");
    for (const checkpoint of checkpointsBeforeHistoryDeletion) {
      assert.equal(
        insertRepositoryRunResumeCheckpointInsideTransactionV01(db, checkpoint),
        "inserted",
      );
    }
    db.exec("COMMIT");
    assert.equal((await readRestarted()).status, "resume_ready");

    const appendTerminalLifecycle = (
      label: string,
      certainty: "completed" | "failed" | "cancelled",
      includeDeclaration = true,
    ) => {
      const current = readAutonomyRunLedgerRecord(started.run_id, { db })!;
      const step = current.steps[0]!;
      const operationRef = createProtocolSha256V01(
        canonicalizeProtocolValueV01({ run_id: started.run_id, label }),
      );
      const lifecycleEventIds: string[] = [];
      const phases = includeDeclaration
        ? ["declared", "started", "completed"]
        : ["started", "completed"];
      for (const [index, phase] of phases.entries()) {
        const lifecycleEventId = `native-host-event:${label}:${phase}`;
        lifecycleEventIds.push(lifecycleEventId);
        appendAutonomyRunLedgerEvent(buildAutonomyRunEventRecord({
          run_id: started.run_id,
          step_id: step.step_id,
          event_type: "host_event_observed",
          status: "running",
          message: "A bounded native-host lifecycle event was admitted.",
          payload: {
            event_id: lifecycleEventId,
            event_kind: "work_checkpoint",
            checkpoint: {
              kind: "command_execution",
              phase,
              status: phase === "completed" ? certainty : "active",
              operation_ref: operationRef,
              certainty: phase === "declared"
                ? "not_started"
                : phase === "started"
                  ? "started"
                  : certainty,
              change_count: null,
            },
            control_revision: Number(current.metadata.control_revision),
            controller_generation: Number(current.metadata.controller_generation),
            runtime_instance_fingerprint: runtimeInstance,
            runtime_generation_fingerprint: runtimeGeneration,
            raw_protocol_persisted: false,
          },
          created_at: `2026-08-04T02:00:${30 + index}.000Z`,
        }), { db });
      }
      return {
        event_ids: lifecycleEventIds,
        admission: {
          config,
          run_id: started.run_id,
          lifecycle_event_id: lifecycleEventIds.at(-1)!,
          controller_generation: Number(current.metadata.controller_generation),
          runtime_instance_fingerprint: runtimeInstance,
          runtime_generation_fingerprint: runtimeGeneration,
          expected_run_control_revision: Number(current.metadata.control_revision),
          expected_step_control_revision: Number(step.output.control_revision),
          operation_ref: operationRef,
          operation_class: "command_execution" as const,
          checkpoint_phase: "post_operation" as const,
          operation_certainty: certainty,
          observed_at: "2026-08-04T02:00:33.000Z",
        },
      };
    };
    const removeLifecycleEvents = (eventIds: string[]) => {
      for (const lifecycleEventId of eventIds) {
        db.prepare(
          "DELETE FROM autonomy_run_events WHERE json_extract(payload_json, '$.event_id') = ?",
        ).run(lifecycleEventId);
      }
    };
    const admissionDependencies = {
      read_capability: () => service.readCapabilityContractV01(),
      platform: "darwin" as const,
    };

    const failedBoundary = appendTerminalLifecycle(
      "failed-boundary",
      "failed",
      false,
    );
    await admitRepositoryRunResumeCheckpointV01(
      db,
      failedBoundary.admission,
      admissionDependencies,
    );
    assert.equal((await readRestarted()).last_confirmed_operation?.certainty, "failed");

    const cancelledBoundary = appendTerminalLifecycle(
      "cancelled-boundary",
      "cancelled",
      false,
    );
    await admitRepositoryRunResumeCheckpointV01(
      db,
      cancelledBoundary.admission,
      admissionDependencies,
    );
    assert.equal(
      (await readRestarted()).last_confirmed_operation?.certainty,
      "cancelled",
    );

    const finalCompletedBoundary = appendTerminalLifecycle(
      "final-completed-boundary",
      "completed",
    );
    await admitRepositoryRunResumeCheckpointV01(
      db,
      finalCompletedBoundary.admission,
      admissionDependencies,
    );
    assert.equal(
      (await readRestarted()).last_confirmed_operation?.certainty,
      "completed",
    );

    await assert.rejects(
      admitRepositoryRunResumeCheckpointV01(db, {
        ...finalCompletedBoundary.admission,
        controller_generation:
          finalCompletedBoundary.admission.controller_generation - 1,
      }, admissionDependencies),
    );

    const noPostState = appendTerminalLifecycle("missing-post-state", "completed");
    await assert.rejects(
      admitRepositoryRunResumeCheckpointV01(db, noPostState.admission, {
        ...admissionDependencies,
        inspect_worktree: async () => ({
          observation_version: "repository_worktree_observation.v0.1",
          status: "unavailable" as const,
          repository_kind: "unknown" as const,
          reason: "deterministic_post_state_unavailable",
          observed_at: "2026-08-04T02:00:34.000Z",
          observation_fingerprint: `sha256:${"1".repeat(64)}`,
        }),
      }),
    );
    assert.equal((await readRestarted()).status, "reconciliation_required");
    removeLifecycleEvents(noPostState.event_ids);
    assert.equal((await readRestarted()).status, "resume_ready");

    const persistenceFailure = appendTerminalLifecycle(
      "persistence-failure",
      "completed",
    );
    await assert.rejects(
      admitRepositoryRunResumeCheckpointV01(db, persistenceFailure.admission, {
        ...admissionDependencies,
        before_checkpoint_insert: () => {
          throw new Error("deterministic_checkpoint_persistence_failure");
        },
      }),
    );
    assert.equal((await readRestarted()).status, "reconciliation_required");
    removeLifecycleEvents(persistenceFailure.event_ids);
    assert.equal((await readRestarted()).status, "resume_ready");

    const admissionRace = appendTerminalLifecycle("admission-race", "completed");
    const beforeRace = readAutonomyRunLedgerRecord(started.run_id, { db })!;
    await assert.rejects(
      admitRepositoryRunResumeCheckpointV01(db, admissionRace.admission, {
        ...admissionDependencies,
        before_checkpoint_transaction: () => {
          updateAutonomyRunLedgerFields(started.run_id, {
            metadata: {
              ...beforeRace.metadata,
              control_revision: Number(beforeRace.metadata.control_revision) + 1,
            },
          }, { db });
        },
      }),
    );
    updateAutonomyRunLedgerFields(started.run_id, {
      metadata: beforeRace.metadata,
    }, { db });
    assert.equal((await readRestarted()).status, "reconciliation_required");
    removeLifecycleEvents(admissionRace.event_ids);
    assert.equal((await readRestarted()).status, "resume_ready");

    const declaredRun = readAutonomyRunLedgerRecord(started.run_id, { db })!;
    const declaredStep = declaredRun.steps[0]!;
    const declaredOperationRef = createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        run_id: started.run_id,
        label: "definitely-not-started",
      }),
    );
    const declaredLifecycleEventId =
      "native-host-event:definitely-not-started:declared";
    appendAutonomyRunLedgerEvent(buildAutonomyRunEventRecord({
      run_id: started.run_id,
      step_id: declaredStep.step_id,
      event_type: "host_event_observed",
      status: "running",
      message: "A bounded native-host lifecycle event was admitted.",
      payload: {
        event_id: declaredLifecycleEventId,
        event_kind: "work_checkpoint",
        checkpoint: {
          kind: "file_change",
          phase: "declared",
          status: "active",
          operation_ref: declaredOperationRef,
          certainty: "not_started",
          change_count: 1,
        },
        control_revision: Number(declaredRun.metadata.control_revision),
        controller_generation: Number(declaredRun.metadata.controller_generation),
        runtime_instance_fingerprint: runtimeInstance,
        runtime_generation_fingerprint: runtimeGeneration,
        raw_protocol_persisted: false,
      },
      created_at: "2026-08-04T02:00:36.000Z",
    }), { db });
    await admitRepositoryRunResumeCheckpointV01(db, {
      config,
      run_id: started.run_id,
      lifecycle_event_id: declaredLifecycleEventId,
      controller_generation: Number(declaredRun.metadata.controller_generation),
      runtime_instance_fingerprint: runtimeInstance,
      runtime_generation_fingerprint: runtimeGeneration,
      expected_run_control_revision: Number(declaredRun.metadata.control_revision),
      expected_step_control_revision: Number(declaredStep.output.control_revision),
      operation_ref: declaredOperationRef,
      operation_class: "file_change",
      checkpoint_phase: "declared_pre_start",
      operation_certainty: "not_started",
      observed_at: "2026-08-04T02:00:36.000Z",
    }, admissionDependencies);
    assert.equal(
      (await readRestarted()).last_confirmed_operation?.certainty,
      "not_started",
    );

    type GrammarEventV01 = {
      operation: string;
      phase: "declared" | "started" | "completed" | "future_phase";
      certainty:
        | "not_started"
        | "started"
        | "completed"
        | "failed"
        | "cancelled"
        | "waiting_for_approval"
        | "future_certainty";
      operation_class?: "command_execution" | "file_change";
      step_id?: string;
      lifecycle_event_id?: string;
      controller_generation?: number;
    };
    const foreignStepId = db.prepare(
      "SELECT step_id FROM autonomy_run_steps WHERE run_id <> ? ORDER BY step_id LIMIT 1",
    ).pluck().get(started.run_id) as string;
    assert.equal(typeof foreignStepId, "string");
    const assertRejectedGrammarV01 = async (
      label: string,
      sequence: GrammarEventV01[],
      boundaryIndex = sequence.length - 1,
    ) => {
      const current = readAutonomyRunLedgerRecord(started.run_id, { db })!;
      const step = current.steps[0]!;
      const insertedEventIds: string[] = [];
      const operationRefs = new Map<string, string>();
      for (const [index, candidate] of sequence.entries()) {
        const operationRef = operationRefs.get(candidate.operation) ??
          createProtocolSha256V01(canonicalizeProtocolValueV01({
            label,
            operation: candidate.operation,
          }));
        operationRefs.set(candidate.operation, operationRef);
        const lifecycleEventId = candidate.lifecycle_event_id ??
          `native-host-event:grammar:${label}:${index}`;
        const event = buildAutonomyRunEventRecord({
          run_id: started.run_id,
          step_id: candidate.step_id ?? step.step_id,
          event_type: "host_event_observed",
          status: "running",
          message: "A bounded native-host lifecycle event was admitted.",
          payload: {
            event_id: lifecycleEventId,
            event_kind: "work_checkpoint",
            checkpoint: {
              kind: candidate.operation_class ?? "command_execution",
              phase: candidate.phase,
              status: candidate.phase === "completed" ? "completed" : "active",
              operation_ref: operationRef,
              certainty: candidate.certainty,
              change_count: null,
            },
            control_revision: Number(current.metadata.control_revision),
            controller_generation: candidate.controller_generation ??
              Number(current.metadata.controller_generation),
            runtime_instance_fingerprint: runtimeInstance,
            runtime_generation_fingerprint: runtimeGeneration,
            raw_protocol_persisted: false,
          },
          created_at: `2026-08-04T02:${20 + boundaryIndex}:${
            String(index).padStart(2, "0")
          }.000Z`,
        });
        insertedEventIds.push(event.event_id);
        appendAutonomyRunLedgerEvent(event, { db });
      }
      const boundary = sequence[boundaryIndex]!;
      const operationRef = operationRefs.get(boundary.operation)!;
      await assert.rejects(admitRepositoryRunResumeCheckpointV01(db, {
        config,
        run_id: started.run_id,
        lifecycle_event_id: boundary.lifecycle_event_id ??
          `native-host-event:grammar:${label}:${boundaryIndex}`,
        controller_generation: Number(current.metadata.controller_generation),
        runtime_instance_fingerprint: runtimeInstance,
        runtime_generation_fingerprint: runtimeGeneration,
        expected_run_control_revision: Number(current.metadata.control_revision),
        expected_step_control_revision: Number(step.output.control_revision),
        operation_ref: operationRef,
        operation_class: boundary.operation_class ?? "command_execution",
        checkpoint_phase: boundary.phase === "declared"
          ? "declared_pre_start"
          : "post_operation",
        operation_certainty: boundary.certainty === "not_started"
          ? "not_started"
          : ["completed", "failed", "cancelled"].includes(boundary.certainty)
            ? boundary.certainty as "completed" | "failed" | "cancelled"
            : "completed",
        observed_at: "2026-08-04T02:59:59.000Z",
      }, admissionDependencies));
      assert.equal((await readRestarted()).status, "reconciliation_required");
      for (const eventId of insertedEventIds) {
        db.prepare("DELETE FROM autonomy_run_events WHERE event_id = ?").run(eventId);
      }
      assert.equal((await readRestarted()).status, "resume_ready");
    };

    await assertRejectedGrammarV01("terminal-without-start", [
      { operation: "one", phase: "completed", certainty: "completed" },
    ]);
    await assertRejectedGrammarV01("start-without-terminal", [
      { operation: "one", phase: "started", certainty: "started" },
      { operation: "boundary", phase: "declared", certainty: "not_started" },
    ]);
    await assertRejectedGrammarV01("duplicate-start", [
      { operation: "one", phase: "started", certainty: "started" },
      { operation: "one", phase: "started", certainty: "started" },
      { operation: "one", phase: "completed", certainty: "completed" },
    ]);
    await assertRejectedGrammarV01("duplicate-terminal", [
      { operation: "one", phase: "started", certainty: "started" },
      { operation: "one", phase: "completed", certainty: "completed" },
      { operation: "one", phase: "completed", certainty: "completed" },
    ]);
    await assertRejectedGrammarV01("terminal-before-start", [
      { operation: "one", phase: "completed", certainty: "completed" },
      { operation: "one", phase: "started", certainty: "started" },
      { operation: "one", phase: "completed", certainty: "completed" },
    ]);
    await assertRejectedGrammarV01("duplicate-declaration", [
      { operation: "one", phase: "declared", certainty: "not_started" },
      { operation: "one", phase: "declared", certainty: "not_started" },
    ]);
    await assertRejectedGrammarV01("repeated-lifecycle-event-id", [
      {
        operation: "one",
        phase: "declared",
        certainty: "not_started",
        lifecycle_event_id: "native-host-event:grammar:repeated-id",
      },
      {
        operation: "two",
        phase: "declared",
        certainty: "not_started",
        lifecycle_event_id: "native-host-event:grammar:repeated-id",
      },
    ]);
    await assertRejectedGrammarV01("operation-class-drift", [
      {
        operation: "one",
        operation_class: "command_execution",
        phase: "declared",
        certainty: "not_started",
      },
      {
        operation: "one",
        operation_class: "file_change",
        phase: "started",
        certainty: "started",
      },
      {
        operation: "one",
        operation_class: "file_change",
        phase: "completed",
        certainty: "completed",
      },
    ]);
    await assertRejectedGrammarV01("operation-step-drift", [
      { operation: "one", phase: "declared", certainty: "not_started" },
      {
        operation: "one",
        phase: "started",
        certainty: "started",
        step_id: foreignStepId,
      },
      {
        operation: "one",
        phase: "completed",
        certainty: "completed",
        step_id: foreignStepId,
      },
    ]);
    await assertRejectedGrammarV01("operation-generation-drift", [
      { operation: "one", phase: "declared", certainty: "not_started" },
      {
        operation: "one",
        phase: "started",
        certainty: "started",
        controller_generation: Number(declaredRun.metadata.controller_generation) + 1,
      },
      {
        operation: "one",
        phase: "completed",
        certainty: "completed",
        controller_generation: Number(declaredRun.metadata.controller_generation) + 1,
      },
    ]);
    await assertRejectedGrammarV01("phase-certainty-mismatch", [
      { operation: "one", phase: "started", certainty: "completed" },
      { operation: "boundary", phase: "declared", certainty: "not_started" },
    ]);
    await assertRejectedGrammarV01("approval-is-not-terminal", [
      {
        operation: "one",
        phase: "completed",
        certainty: "waiting_for_approval",
      },
      { operation: "boundary", phase: "declared", certainty: "not_started" },
    ]);
    await assertRejectedGrammarV01("unknown-future-phase", [
      { operation: "one", phase: "future_phase", certainty: "future_certainty" },
      { operation: "boundary", phase: "declared", certainty: "not_started" },
    ]);
    await assertRejectedGrammarV01("later-lifecycle-activity", [
      { operation: "boundary", phase: "declared", certainty: "not_started" },
      { operation: "later", phase: "declared", certainty: "not_started" },
    ], 0);

    updateAutonomyRunLedgerFields(started.run_id, {
      status: "waiting_for_approval",
      metadata: {
        ...run.metadata,
        pending_approval: {
          approval_version: "native_host_approval.v0.1",
          approval_id: "approval:resume-checkpoint",
          operation_class: "file_change",
          resource_summary: "One bounded file change",
          public_reason: "Review one bounded file change.",
          public_risk_summary: "The local repository may change.",
          available_decisions: ["approve_once", "decline", "cancel_run"],
          expires_at: null,
          control_revision: Number(run.metadata.control_revision),
          decision_submitted: false,
        },
      },
    }, { db });
    assert.equal((await readRestarted()).status, "approval_pending");
    const pendingApprovalRun = readAutonomyRunLedgerRecord(started.run_id, { db })!;
    updateAutonomyRunLedgerFields(started.run_id, {
      metadata: {
        ...pendingApprovalRun.metadata,
        repository_attachment_binding_fingerprint: `sha256:${"2".repeat(64)}`,
      },
    }, { db });
    assert.equal((await readRestarted()).status, "unavailable");
    updateAutonomyRunLedgerFields(started.run_id, {
      status: "running",
      metadata: run.metadata,
    }, { db });
    assert.equal((await readRestarted()).status, "resume_ready");

    updateAutonomyRunLedgerFields(started.run_id, {
      status: "completed",
      finished_at: "2026-08-04T02:00:23.000Z",
    }, { db });
    assert.equal((await readRestarted()).status, "terminal");
    updateAutonomyRunLedgerFields(started.run_id, {
      status: "running",
      finished_at: null,
    }, { db });

    const incompleteOperationRef = `sha256:${"c".repeat(64)}`;
    const incompleteEvent = buildAutonomyRunEventRecord({
      run_id: started.run_id,
      step_id: readAutonomyRunLedgerRecord(started.run_id, { db })!.steps[0]!.step_id,
      event_type: "host_event_observed",
      status: "running",
      message: "A bounded native-host lifecycle event was admitted.",
      payload: {
        event_id: "native-host-event:incomplete-resume-test",
        event_kind: "work_checkpoint",
        checkpoint: {
          kind: "file_change",
          phase: "started",
          status: "active",
          operation_ref: incompleteOperationRef,
          certainty: "started",
          change_count: 1,
        },
        control_revision: 2,
        controller_generation: Number(
          readAutonomyRunLedgerRecord(started.run_id, { db })!.metadata
            .controller_generation,
        ),
        runtime_instance_fingerprint: runtimeInstance,
        runtime_generation_fingerprint: runtimeGeneration,
        raw_protocol_persisted: false,
      },
      created_at: "2026-08-04T02:00:23.500Z",
    });
    appendAutonomyRunLedgerEvent(incompleteEvent, { db });
    assert.equal((await readRestarted()).status, "reconciliation_required");
    db.prepare("DELETE FROM autonomy_run_events WHERE event_id = ?").run(
      incompleteEvent.event_id,
    );
    assert.equal((await readRestarted()).status, "resume_ready");

    selectProjectV01(db, workspaceId, fixture.project_id);
    const credential = operatorCredentialV01(
      db,
      config,
      "2026-08-04T02:00:24.000Z",
    );
    updateAutonomyRunLedgerFields(started.run_id, { status: "paused" }, { db });
    const paused = readAutonomyRunLedgerRecord(started.run_id, { db })!;
    await assert.rejects(
      service.resume({
        config,
        run_ref: started.run_id,
        control_revision: Number(paused.metadata.control_revision),
        credential,
        clock: { now: () => "2026-08-04T02:00:25.000Z" },
      }),
      (error: unknown) =>
        error instanceof Error &&
        error.message === "live_host_repository_resume_not_supported",
    );
  } finally {
    delete process.env.AUGNES_VNEXT_REPOSITORY_CHECKPOINT_HOLD;
    await service.shutdown();
  }
}

function assertRepositoryExecutionMigrationV01(): void {
  const legacy = new Database(":memory:");
  try {
    const currentAttachmentLifecycle = `lifecycle TEXT NOT NULL CHECK (lifecycle IN ('prepared', 'stale', 'superseded', 'revoked', 'consumed')),
    stale_reason TEXT CHECK (stale_reason IS NULL OR stale_reason IN ('physical_root_mismatch', 'root_binding_changed', 'packet_changed', 'current_work_changed', 'project_unavailable', 'managed_run_conflict', 'worktree_changed', 'freshness_expired', 'explicitly_revoked', 'superseded')),
    lifecycle_updated_at TEXT NOT NULL CHECK (length(trim(lifecycle_updated_at)) > 0),
    consumed_run_id TEXT,
    CHECK ((lifecycle = 'consumed' AND consumed_run_id IS NOT NULL AND length(trim(consumed_run_id)) > 0) OR (lifecycle <> 'consumed' AND consumed_run_id IS NULL)),`;
    const legacyAttachmentLifecycle = `lifecycle TEXT NOT NULL CHECK (lifecycle IN ('prepared', 'stale', 'superseded', 'revoked', 'consumed')),
    stale_reason TEXT CHECK (stale_reason IS NULL OR stale_reason IN ('physical_root_mismatch', 'root_binding_changed', 'packet_changed', 'current_work_changed', 'project_unavailable', 'managed_run_conflict', 'worktree_changed', 'freshness_expired', 'explicitly_revoked', 'superseded')),
    lifecycle_updated_at TEXT NOT NULL CHECK (length(trim(lifecycle_updated_at)) > 0),
    consumed_run_id TEXT CHECK (consumed_run_id IS NULL),`;
    const consumedIndex = `  CREATE UNIQUE INDEX IF NOT EXISTS idx_vnext_repository_execution_consumed_run
    ON vnext_repository_execution_attachments(consumed_run_id) WHERE consumed_run_id IS NOT NULL;\n`;
    const legacySql = vNextRepositoryExecutionStoreSchemaSqlV01
      .replace(currentAttachmentLifecycle, legacyAttachmentLifecycle)
      .replace(", 'start_repository_managed_delegation'", "")
      .replace(consumedIndex, "")
      .replace(
        /  CREATE TABLE IF NOT EXISTS vnext_repository_run_resume_checkpoints[\s\S]*?  CREATE TABLE IF NOT EXISTS vnext_repository_root_rebind_receipts/u,
        "  CREATE TABLE IF NOT EXISTS vnext_repository_root_rebind_receipts",
      );
    assert(!legacySql.includes("lifecycle = 'consumed' AND consumed_run_id IS NOT NULL"));
    assert(!legacySql.includes("start_repository_managed_delegation"));
    legacy.exec(`CREATE TABLE vnext_project_identities (
      workspace_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      PRIMARY KEY (workspace_id, project_id)
    );
    INSERT INTO vnext_project_identities VALUES ('workspace:migration', 'project:migration');`);
    legacy.exec(legacySql);
    const fingerprint = (value: string) => `sha256:${value.repeat(64).slice(0, 64)}`;
    legacy.prepare(`INSERT INTO vnext_repository_execution_attachments (
      attachment_id, attachment_version, workspace_id, project_id,
      node_scope_fingerprint, physical_root_baseline_fingerprint,
      root_binding_fingerprint, task_context_packet_id,
      task_context_packet_fingerprint, current_work_fingerprint,
      project_execution_admission_fingerprint, worktree_observation_fingerprint,
      managed_run_state_fingerprint, binding_fingerprint, prepared_at,
      freshness_policy_json, lifecycle, stale_reason, lifecycle_updated_at,
      consumed_run_id
    ) VALUES (?, 'repository_execution_attachment.v0.1', 'workspace:migration',
      'project:migration', ?, ?, ?, 'packet:migration', ?, ?, ?, ?, ?, ?,
      '2026-08-04T00:00:00.000Z', '{}', 'prepared', NULL,
      '2026-08-04T00:00:00.000Z', NULL)`).run(
        fingerprint("a"),
        fingerprint("b"),
        fingerprint("c"),
        fingerprint("d"),
        fingerprint("e"),
        fingerprint("f"),
        fingerprint("1"),
        fingerprint("2"),
        fingerprint("3"),
        fingerprint("4"),
      );
    migrateVNextRepositoryExecutionStoreV01(legacy);
    const migrated = legacy.prepare(
      "SELECT lifecycle, consumed_run_id FROM vnext_repository_execution_attachments",
    ).get() as { lifecycle: string; consumed_run_id: string | null };
    assert.deepEqual(migrated, { lifecycle: "prepared", consumed_run_id: null });
    const attachmentSql = String(legacy.prepare(
      "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'vnext_repository_execution_attachments'",
    ).pluck().get());
    const decisionSql = String(legacy.prepare(
      "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'vnext_repository_execution_decision_requests'",
    ).pluck().get());
    assert(attachmentSql.includes("lifecycle = 'consumed' AND consumed_run_id IS NOT NULL"));
    assert(decisionSql.includes("start_repository_managed_delegation"));
    assert(legacy.prepare(
      "SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = 'idx_vnext_repository_execution_consumed_run'",
    ).get());
  } finally {
    legacy.close();
  }
}

async function assertPreTransactionBaselineRaceV01(
  db: Database.Database,
  service: LiveNativeHostRunServiceV01,
  workspaceId: string,
): Promise<void> {
  const fixture = await createPreparedFixtureV01(
    db,
    "baseline-race-repository",
    "Baseline Race Repository",
    "2026-08-04T01:02:20.000Z",
  );
  selectProjectV01(db, workspaceId, fixture.project_id);
  const request = await requestAndGrantV01(db, service, fixture, "2026-08-04T01:02:30.000Z");
  await assert.rejects(startRepositoryManagedDelegationV01(db, startInputV01(fixture, request), service, {
    now: () => "2026-08-04T01:02:32.000Z",
    platform: "darwin",
    before_start_transaction: () => {
      db.prepare(
        "DELETE FROM vnext_physical_root_baselines WHERE workspace_id = ? AND project_id = ?",
      ).run(workspaceId, fixture.project_id);
    },
  }));
  assert.equal(countWhere(db, "autonomy_runs", `scope = '${fixture.project_id}'`), 0);
  assert.equal(readRepositoryExecutionAttachmentV01(db, fixture.attachment_id)?.lifecycle, "prepared");
}

async function assertPreTransactionManagedRunRaceV01(
  db: Database.Database,
  service: LiveNativeHostRunServiceV01,
  workspaceId: string,
): Promise<void> {
  const fixture = await createPreparedFixtureV01(
    db,
    "managed-run-race-repository",
    "Managed Run Race Repository",
    "2026-08-04T01:02:40.000Z",
  );
  selectProjectV01(db, workspaceId, fixture.project_id);
  const request = await requestAndGrantV01(db, service, fixture, "2026-08-04T01:02:50.000Z");
  await assert.rejects(startRepositoryManagedDelegationV01(db, startInputV01(fixture, request), service, {
    now: () => "2026-08-04T01:02:52.000Z",
    platform: "darwin",
    before_start_transaction: () => insertManagedRunFixtureV01(
      db,
      workspaceId,
      fixture.project_id,
      "host-run:managed-race-fixture",
      "2026-08-04T01:02:51.500Z",
    ),
  }));
  assert.equal(
    countWhere(db, "autonomy_runs", `scope = '${fixture.project_id}'`),
    1,
  );
  assert.equal(readRepositoryExecutionAttachmentV01(db, fixture.attachment_id)?.lifecycle, "prepared");
}

async function assertAtomicRollbackBoundariesV01(
  db: Database.Database,
  service: LiveNativeHostRunServiceV01,
  workspaceId: string,
): Promise<void> {
  const fixture = await createPreparedFixtureV01(
    db,
    "rollback-repository",
    "Rollback Repository",
    "2026-08-04T01:01:00.000Z",
  );
  selectProjectV01(db, workspaceId, fixture.project_id);
  const request = await requestAndGrantV01(db, service, fixture, "2026-08-04T01:01:10.000Z");
  for (const boundary of [
    "after_run_claim_admitted_inside_transaction",
    "after_attachment_consumed_inside_transaction",
    "after_decision_consumed_inside_transaction",
  ] as const) {
    await assert.rejects(startRepositoryManagedDelegationV01(db, startInputV01(fixture, request), service, {
      now: () => "2026-08-04T01:01:12.000Z",
      platform: "darwin",
      [boundary]: () => { throw new Error(`injected_${boundary}`); },
    }), new RegExp(`injected_${boundary}`, "u"));
    assert.equal(readRepositoryExecutionAttachmentV01(db, fixture.attachment_id)?.lifecycle, "prepared");
    assert.equal(countWhere(db, "autonomy_runs", `scope = '${fixture.project_id}'`), 0);
  }
}

async function assertPreTransactionPacketRaceV01(
  db: Database.Database,
  service: LiveNativeHostRunServiceV01,
  workspaceId: string,
): Promise<void> {
  const fixture = await createPreparedFixtureV01(
    db,
    "packet-race-repository",
    "Packet Race Repository",
    "2026-08-04T01:02:00.000Z",
  );
  selectProjectV01(db, workspaceId, fixture.project_id);
  const request = await requestAndGrantV01(db, service, fixture, "2026-08-04T01:02:10.000Z");
  await assert.rejects(startRepositoryManagedDelegationV01(db, startInputV01(fixture, request), service, {
    now: () => "2026-08-04T01:02:12.000Z",
    platform: "darwin",
    before_start_transaction: () => reviseWorkV01(
      db,
      fixture.project_id,
      fixture.work,
      "Packet race changed work",
      "2026-08-04T01:02:11.500Z",
    ),
  }));
  assert.equal(readRepositoryExecutionAttachmentV01(db, fixture.attachment_id)?.lifecycle, "prepared");
  assert.equal(countWhere(db, "autonomy_runs", `scope = '${fixture.project_id}'`), 0);
}

async function assertPostCommitPacketRaceV01(
  db: Database.Database,
  service: LiveNativeHostRunServiceV01,
  workspaceId: string,
): Promise<void> {
  const fixture = await createPreparedFixtureV01(
    db,
    "post-packet-race-repository",
    "Post Packet Race Repository",
    "2026-08-04T01:03:00.000Z",
  );
  selectProjectV01(db, workspaceId, fixture.project_id);
  const request = await requestAndGrantV01(db, service, fixture, "2026-08-04T01:03:10.000Z");
  let observations = 0;
  const before = invocationCount;
  const result = await startRepositoryManagedDelegationV01(db, startInputV01(fixture, request), service, {
    now: () => "2026-08-04T01:03:12.000Z",
    platform: "darwin",
    inspect_worktree: async (root, options) => {
      const observation = await inspectRepositoryWorktreeV01(root, options);
      observations += 1;
      if (observations === 2) {
        reviseWorkV01(
          db,
          fixture.project_id,
          fixture.work,
          "Post-commit packet race changed work",
          "2026-08-04T01:03:12.500Z",
        );
      }
      return observation;
    },
  });
  assert.equal(result.status, "blocked");
  assert.equal(invocationCount, before);
  assert.equal(readRepositoryExecutionAttachmentV01(db, fixture.attachment_id)?.lifecycle, "consumed");
}

async function assertPostCommitWorktreeRaceV01(
  db: Database.Database,
  service: LiveNativeHostRunServiceV01,
  workspaceId: string,
): Promise<void> {
  const fixture = await createPreparedFixtureV01(
    db,
    "post-worktree-race-repository",
    "Post Worktree Race Repository",
    "2026-08-04T01:04:00.000Z",
  );
  selectProjectV01(db, workspaceId, fixture.project_id);
  const request = await requestAndGrantV01(db, service, fixture, "2026-08-04T01:04:10.000Z");
  let observations = 0;
  const before = invocationCount;
  const result = await startRepositoryManagedDelegationV01(db, startInputV01(fixture, request), service, {
    now: () => "2026-08-04T01:04:12.000Z",
    platform: "darwin",
    inspect_worktree: async (root, options) => {
      const observation = await inspectRepositoryWorktreeV01(root, options);
      observations += 1;
      if (observations === 2) {
        writeFileSync(path.join(root, "race.txt"), "changed during launch gate\n", "utf8");
      }
      return observation;
    },
  });
  assert.equal(result.status, "blocked");
  assert.equal(invocationCount, before);
  assert.equal(readRepositoryExecutionAttachmentV01(db, fixture.attachment_id)?.lifecycle, "consumed");
}

async function assertPostCommitPhysicalRaceV01(
  db: Database.Database,
  service: LiveNativeHostRunServiceV01,
  workspaceId: string,
): Promise<void> {
  const fixture = await createPreparedFixtureV01(
    db,
    "post-physical-race-repository",
    "Post Physical Race Repository",
    "2026-08-04T01:04:20.000Z",
  );
  selectProjectV01(db, workspaceId, fixture.project_id);
  const request = await requestAndGrantV01(db, service, fixture, "2026-08-04T01:04:30.000Z");
  const before = invocationCount;
  const result = await startRepositoryManagedDelegationV01(db, startInputV01(fixture, request), service, {
    now: () => "2026-08-04T01:04:32.000Z",
    platform: "darwin",
    after_start_transaction_commit: () => {
      renameSync(fixture.root, `${fixture.root}-replaced`);
      mkdirSync(fixture.root);
    },
  });
  assert.equal(result.status, "blocked");
  assert.equal(invocationCount, before);
  assert.equal(readRepositoryExecutionAttachmentV01(db, fixture.attachment_id)?.lifecycle, "consumed");
}

async function assertPostCommitRootRaceV01(
  db: Database.Database,
  service: LiveNativeHostRunServiceV01,
  workspaceId: string,
): Promise<void> {
  const fixture = await createPreparedFixtureV01(
    db,
    "post-root-race-repository",
    "Post Root Race Repository",
    "2026-08-04T01:04:40.000Z",
  );
  selectProjectV01(db, workspaceId, fixture.project_id);
  const request = await requestAndGrantV01(db, service, fixture, "2026-08-04T01:04:50.000Z");
  let observations = 0;
  const before = invocationCount;
  const result = await startRepositoryManagedDelegationV01(db, startInputV01(fixture, request), service, {
    now: () => "2026-08-04T01:04:52.000Z",
    platform: "darwin",
    inspect_worktree: async (root, options) => {
      const observation = await inspectRepositoryWorktreeV01(root, options);
      observations += 1;
      if (observations === 2) {
        db.prepare(
          "UPDATE vnext_project_root_bindings SET bound_at = ? WHERE workspace_id = ? AND project_id = ?",
        ).run("2026-08-04T01:04:52.500Z", workspaceId, fixture.project_id);
      }
      return observation;
    },
  });
  assert.equal(result.status, "blocked");
  assert.equal(invocationCount, before);
  assert.equal(readRepositoryExecutionAttachmentV01(db, fixture.attachment_id)?.lifecycle, "consumed");
}

async function assertPostCommitManagedRunRaceV01(
  db: Database.Database,
  service: LiveNativeHostRunServiceV01,
  workspaceId: string,
): Promise<void> {
  const fixture = await createPreparedFixtureV01(
    db,
    "post-run-race-repository",
    "Post Run Race Repository",
    "2026-08-04T01:05:00.000Z",
  );
  selectProjectV01(db, workspaceId, fixture.project_id);
  const request = await requestAndGrantV01(db, service, fixture, "2026-08-04T01:05:10.000Z");
  let observations = 0;
  const before = invocationCount;
  const result = await startRepositoryManagedDelegationV01(db, startInputV01(fixture, request), service, {
    now: () => "2026-08-04T01:05:12.000Z",
    platform: "darwin",
    inspect_worktree: async (root, options) => {
      const observation = await inspectRepositoryWorktreeV01(root, options);
      observations += 1;
      if (observations === 2) {
        insertManagedRunFixtureV01(
          db,
          workspaceId,
          fixture.project_id,
          "host-run:post-commit-managed-race",
          "2026-08-04T01:05:12.500Z",
        );
      }
      return observation;
    },
  });
  assert.equal(result.status, "blocked");
  assert.equal(invocationCount, before);
  assert.equal(readRepositoryExecutionAttachmentV01(db, fixture.attachment_id)?.lifecycle, "consumed");
}

async function assertAdapterCapabilityRaceV01(
  db: Database.Database,
  workspaceId: string,
): Promise<void> {
  let adapterVersion = "deterministic-codex-adapter.v0.1";
  let capabilityVersion = "deterministic-codex-capability.v0.1";
  let localInvocations = 0;
  const service = new LiveNativeHostRunServiceV01({
    open_database: () => openDatabaseV01(),
    adapter_factory: () => {
      const delegate = createDeterministicCodexAdapterV01();
      return {
        ...delegate,
        adapter_version: adapterVersion,
        capability_version: capabilityVersion,
        invoke(request, control) {
          localInvocations += 1;
          return delegate.invoke(request, control);
        },
      };
    },
    now: () => "2026-08-04T01:05:32.000Z",
  });
  try {
    const fixture = await createPreparedFixtureV01(
      db,
      "adapter-race-repository",
      "Adapter Race Repository",
      "2026-08-04T01:05:20.000Z",
    );
    selectProjectV01(db, workspaceId, fixture.project_id);
    const request = await requestAndGrantV01(db, service, fixture, "2026-08-04T01:05:30.000Z");
    const result = await startRepositoryManagedDelegationV01(db, startInputV01(fixture, request), service, {
      now: () => "2026-08-04T01:05:32.000Z",
      platform: "darwin",
      after_post_commit_launch_gate: () => {
        adapterVersion = "deterministic-codex-adapter.v0.1.changed";
        capabilityVersion = "deterministic-codex-capability.v0.1.changed";
      },
    });
    assert.equal(result.status, "blocked");
    assert.equal(localInvocations, 0);
    assert.equal(readRepositoryExecutionAttachmentV01(db, fixture.attachment_id)?.lifecycle, "consumed");
  } finally {
    await service.shutdown();
  }
}

type ManagedCancellationCountersV01 = {
  invocations: number;
  cancellation_signals: number;
};

function createCancellableRepositoryServiceV01(
  now: () => string,
  counters: ManagedCancellationCountersV01,
): LiveNativeHostRunServiceV01 {
  return new LiveNativeHostRunServiceV01({
    open_database: () => openDatabaseV01(),
    adapter_factory: () => {
      const delegate = createDeterministicCodexAdapterV01({ now });
      return {
        ...delegate,
        invoke(request, control) {
          counters.invocations += 1;
          let settled = false;
          let resolveResult!: (
            value: Awaited<ReturnType<typeof delegate.invoke>["result"]>,
          ) => void;
          let rejectResult!: (error: unknown) => void;
          const result = new Promise<
            Awaited<ReturnType<typeof delegate.invoke>["result"]>
          >((resolve, reject) => {
            resolveResult = resolve;
            rejectResult = reject;
          });
          const finish = () => {
            if (settled) return;
            settled = true;
            try {
              const delegated = delegate.invoke(request, control);
              void delegated.result.then(resolveResult, rejectResult);
            } catch (error) {
              rejectResult(error);
            }
          };
          const observeCancellation = () => {
            counters.cancellation_signals += 1;
            finish();
          };
          control.cancellation_signal.addEventListener(
            "abort",
            observeCancellation,
            { once: true },
          );
          if (control.cancellation_signal.aborted) observeCancellation();
          return {
            result,
            settled: result.then(() => undefined, () => undefined),
            request_stop: async () => { finish(); },
          };
        },
      };
    },
    now,
  });
}

async function assertExactReplayStateMatrixV01(
  db: Database.Database,
  workspaceId: string,
): Promise<void> {
  const queuedFixture = await createPreparedFixtureV01(
    db,
    "replay-queued-repository",
    "Replay Queued Repository",
    "2026-08-04T01:05:33.000Z",
  );
  const queuedService = new LiveNativeHostRunServiceV01({
    open_database: () => openDatabaseV01(),
    adapter_factory: () => createDeterministicCodexAdapterV01(),
    now: () => "2026-08-04T01:05:39.000Z",
  });
  try {
    const request = await requestAndGrantV01(
      db,
      queuedService,
      queuedFixture,
      "2026-08-04T01:05:36.000Z",
    );
    let queuedReplay: Awaited<
      ReturnType<typeof startRepositoryManagedDelegationV01>
    > | null = null;
    const before = invocationCount;
    const blocked = await startRepositoryManagedDelegationV01(
      db,
      startInputV01(queuedFixture, request),
      queuedService,
      {
        now: () => "2026-08-04T01:05:38.000Z",
        platform: "darwin",
        after_start_transaction_commit: async () => {
          queuedReplay = await startRepositoryManagedDelegationV01(
            db,
            startInputV01(queuedFixture, request),
            queuedService,
          );
          throw new Error("injected_post_commit_block_after_queued_replay");
        },
      },
    );
    assert(queuedReplay);
    assertExactReplayProjectionV01(queuedReplay, "queued");
    assert.equal(blocked.status, "blocked");
    const blockedReplay = await startRepositoryManagedDelegationV01(
      db,
      startInputV01(queuedFixture, request),
      queuedService,
    );
    assertExactReplayProjectionV01(blockedReplay, "blocked");
    assert.equal(invocationCount, before);
  } finally {
    await queuedService.shutdown();
  }

  const counters = { invocations: 0, cancellation_signals: 0 };
  let now = "2026-08-04T01:05:55.000Z";
  const service = createCancellableRepositoryServiceV01(() => now, counters);
  try {
    const fixture = await createPreparedFixtureV01(
      db,
      "replay-live-repository",
      "Replay Live Repository",
      "2026-08-04T01:05:42.000Z",
    );
    const request = await requestAndGrantV01(
      db,
      service,
      fixture,
      "2026-08-04T01:05:50.000Z",
    );
    const input = startInputV01(fixture, request);
    const started = await startRepositoryManagedDelegationV01(
      db,
      input,
      service,
      { now: () => "2026-08-04T01:05:52.000Z", platform: "darwin" },
    );
    assert.equal(started.status, "accepted");
    setManagedRunStatusV01(db, started.run_id, "running", now);
    const runningReplay = await startRepositoryManagedDelegationV01(
      db,
      input,
      service,
    );
    assertExactReplayProjectionV01(runningReplay, "running");

    now = "2026-08-04T01:05:56.000Z";
    setManagedRunStatusV01(db, started.run_id, "waiting_for_approval", now);
    const waitingReplay = await startRepositoryManagedDelegationV01(
      db,
      input,
      service,
    );
    assertExactReplayProjectionV01(waitingReplay, "waiting_for_approval");

    const disconnectedService = new LiveNativeHostRunServiceV01({
      open_database: () => openDatabaseV01(),
      adapter_factory: () => createDeterministicCodexAdapterV01(),
    });
    try {
      const disconnectedReplay = await startRepositoryManagedDelegationV01(
        db,
        input,
        disconnectedService,
      );
      assertExactReplayProjectionV01(disconnectedReplay, "paused");
      assert.equal(disconnectedReplay.projection.reconciliation_required, true);
      assert.match(disconnectedReplay.ordinary_text, /paused and disconnected/u);
    } finally {
      await disconnectedService.shutdown();
    }

    const waiting = readAutonomyRunLedgerRecord(started.run_id, { db });
    assert(waiting);
    const cancelled = await cancelRepositoryManagedDelegationV01(db, {
      config: operatorConfig(workspaceId, fixture.project_id),
      attachment_id: fixture.attachment_id,
      expected_attachment_binding_fingerprint: fixture.binding_fingerprint,
      run_id: started.run_id,
      control_revision: Number(waiting.metadata.control_revision),
    }, service);
    assert.equal(cancelled.status, "cancel_requested");
    assert.equal(counters.cancellation_signals, 1);
    await waitForTerminalV01(db, started.run_id);
    const cancelledReplay = await startRepositoryManagedDelegationV01(
      db,
      input,
      service,
    );
    assertExactReplayProjectionV01(cancelledReplay, "cancelled");
    assert.equal(counters.invocations, 1);
  } finally {
    await service.shutdown();
  }
}

function assertExactReplayProjectionV01(
  result: Awaited<ReturnType<typeof startRepositoryManagedDelegationV01>>,
  expectedStatus: "queued" | "running" | "waiting_for_approval" | "paused" | "blocked" | "completed" | "cancelled",
): void {
  assert.equal(result.status, "exact_replay");
  assert.equal(result.projection.status, expectedStatus);
  assert.equal(result.authority.worker_started, false);
  assert.equal(result.authority.project_files_may_be_written, false);
  assert.equal(result.authority.project_commands_may_be_executed, false);
  assert.equal(result.authority.provider_egress_may_occur, false);
  const expectedText = expectedStatus === "waiting_for_approval"
    ? "waiting for approval"
    : expectedStatus;
  assert.equal(result.ordinary_text.includes(expectedText), true, result.ordinary_text);
}

function setManagedRunStatusV01(
  db: Database.Database,
  runId: string,
  status: "running" | "waiting_for_approval",
  now: string,
): void {
  const run = readAutonomyRunLedgerRecord(runId, { db });
  assert(run);
  updateAutonomyRunLedgerFields(runId, {
    status,
    updated_at: now,
    metadata: {
      ...run.metadata,
      control_revision: Number(run.metadata.control_revision) + 1,
      reconciliation_required: false,
      public_reason: null,
    },
  }, { db });
}

function injectCurrentPacketDriftV01(
  db: Database.Database,
  fixture: PreparedFixtureV01,
): void {
  const attachment = readRepositoryExecutionAttachmentV01(
    db,
    fixture.attachment_id,
  );
  assert(attachment);
  const row = db.prepare(`SELECT payload_json
    FROM vnext_core_records
    WHERE workspace_id = ? AND project_id = ?
      AND record_kind = 'task_context_packet' AND record_id = ?`).get(
        fixture.workspace_id,
        fixture.project_id,
        attachment.task_context_packet_id,
      ) as { payload_json: string } | undefined;
  assert(row);
  const packet = JSON.parse(row.payload_json) as {
    task?: { goal?: string };
  };
  assert(packet.task);
  packet.task.goal = "Injected post-admission packet drift";
  db.exec("DROP TRIGGER trg_vnext_core_records_immutable_update");
  try {
    db.prepare(`UPDATE vnext_core_records SET payload_json = ?
      WHERE workspace_id = ? AND project_id = ?
        AND record_kind = 'task_context_packet' AND record_id = ?`).run(
          JSON.stringify(packet),
          fixture.workspace_id,
          fixture.project_id,
          attachment.task_context_packet_id,
        );
  } finally {
    db.exec(`CREATE TRIGGER trg_vnext_core_records_immutable_update
      BEFORE UPDATE ON vnext_core_records
      BEGIN SELECT RAISE(ABORT, 'vnext_core_records_immutable'); END`);
  }
  const current = readExpectedDatabaseAdmissionStateV01(db, {
    workspace_id: fixture.workspace_id,
    project_id: fixture.project_id,
    node_scope_fingerprint: attachment.node_scope_fingerprint,
  });
  assert.notEqual(current.task_context_packet_fingerprint, attachment.task_context_packet_fingerprint);
  assert.notEqual(current.current_work_fingerprint, attachment.current_work_fingerprint);
}

async function assertCancellationDriftMatrixV01(
  db: Database.Database,
  workspaceId: string,
): Promise<void> {
  const cases: Array<{
    id: string;
    mutate: (input: {
      fixture: PreparedFixtureV01;
      run_id: string;
      set_now: (value: string) => void;
    }) => void | Promise<void>;
  }> = [
    {
      id: "packet_expired",
      mutate: ({ set_now }) => set_now("2036-08-04T01:00:00.000Z"),
    },
    {
      id: "current_work_packet_changed",
      mutate: ({ fixture }) => injectCurrentPacketDriftV01(db, fixture),
    },
    {
      id: "root_unavailable",
      mutate: ({ fixture }) => {
        renameSync(fixture.root, `${fixture.root}-unavailable`);
      },
    },
    {
      id: "root_binding_changed",
      mutate: ({ fixture }) => {
        const replacementRoot = createRepositoryV01("cancel-root-binding-new-root");
        db.prepare(`UPDATE vnext_project_root_bindings
          SET normalized_root = ?, bound_at = ?
          WHERE workspace_id = ? AND project_id = ?`).run(
            replacementRoot,
            "2026-08-04T01:08:31.000Z",
            fixture.workspace_id,
            fixture.project_id,
          );
      },
    },
    {
      id: "physical_baseline_unavailable",
      mutate: ({ fixture }) => {
        const removed = db.prepare(`DELETE FROM vnext_physical_root_baselines
          WHERE workspace_id = ? AND project_id = ?`).run(
            fixture.workspace_id,
            fixture.project_id,
          );
        assert.equal(removed.changes, 1);
      },
    },
    {
      id: "same_path_replaced",
      mutate: ({ fixture }) => {
        const before = statSync(fixture.root);
        renameSync(fixture.root, `${fixture.root}-original`);
        initializeRepositoryAtPathV01(fixture.root, "same-path-replacement");
        const after = statSync(fixture.root);
        assert.notEqual(`${before.dev}:${before.ino}`, `${after.dev}:${after.ino}`);
      },
    },
    {
      id: "browser_project_b_selected",
      mutate: async ({ fixture }) => {
        const projectB = await createPreparedFixtureV01(
          db,
          `cancel-browser-b-${fixture.project_id.slice(-8)}`,
          "Cancellation Browser B",
          "2026-08-04T01:08:32.000Z",
        );
        selectProjectV01(db, workspaceId, projectB.project_id);
        assert.equal(
          readActiveProjectSelectionV01(db, workspaceId)?.project_id,
          projectB.project_id,
        );
      },
    },
    {
      id: "waiting_for_approval",
      mutate: ({ run_id }) => {
        setManagedRunStatusV01(
          db,
          run_id,
          "waiting_for_approval",
          "2026-08-04T01:08:33.000Z",
        );
      },
    },
  ];

  for (let index = 0; index < cases.length; index += 1) {
    const entry = cases[index]!;
    let now = new Date(Date.parse("2026-08-04T01:08:00.000Z") + index * 60_000)
      .toISOString();
    const counters = { invocations: 0, cancellation_signals: 0 };
    const service = createCancellableRepositoryServiceV01(() => now, counters);
    try {
      const fixture = await createPreparedFixtureV01(
        db,
        `cancel-drift-${entry.id}`,
        `Cancel Drift ${entry.id}`,
        now,
      );
      const request = await requestAndGrantV01(
        db,
        service,
        fixture,
        new Date(Date.parse(now) + 10_000).toISOString(),
      );
      const started = await startRepositoryManagedDelegationV01(
        db,
        startInputV01(fixture, request),
        service,
        {
          now: () => new Date(Date.parse(now) + 12_000).toISOString(),
          platform: "darwin",
        },
      );
      assert.equal(started.status, "accepted", entry.id);
      setManagedRunStatusV01(
        db,
        started.run_id,
        "running",
        new Date(Date.parse(now) + 13_000).toISOString(),
      );
      const runCount = count(db, "autonomy_runs");
      const decisions = countWhere(db, "vnext_core_records", "record_kind = 'review_decision'");
      const transitions = countWhere(db, "vnext_core_records", "record_kind = 'state_transition_receipt'");
      await entry.mutate({
        fixture,
        run_id: started.run_id,
        set_now: (value) => { now = value; },
      });
      const run = readAutonomyRunLedgerRecord(started.run_id, { db });
      assert(run);
      const cancelled = await cancelRepositoryManagedDelegationV01(db, {
        config: operatorConfig(workspaceId, fixture.project_id),
        attachment_id: fixture.attachment_id,
        expected_attachment_binding_fingerprint: fixture.binding_fingerprint,
        run_id: started.run_id,
        control_revision: Number(run.metadata.control_revision),
      }, service);
      assert.equal(cancelled.status, "cancel_requested", entry.id);
      assert.equal(cancelled.run_id, started.run_id, entry.id);
      assert.equal(counters.invocations, 1, entry.id);
      assert.equal(counters.cancellation_signals, 1, entry.id);
      assert.equal(count(db, "autonomy_runs"), runCount, entry.id);
      assert.equal(
        countWhere(db, "vnext_core_records", "record_kind = 'review_decision'"),
        decisions,
        entry.id,
      );
      assert.equal(
        countWhere(db, "vnext_core_records", "record_kind = 'state_transition_receipt'"),
        transitions,
        entry.id,
      );
    } finally {
      await service.shutdown();
      assert.equal(counters.cancellation_signals, 1, entry.id);
    }
  }
}

async function assertCancellationWithoutControllerV01(
  db: Database.Database,
  workspaceId: string,
): Promise<void> {
  let now = "2026-08-04T01:20:00.000Z";
  const counters = { invocations: 0, cancellation_signals: 0 };
  const owner = createCancellableRepositoryServiceV01(() => now, counters);
  const observer = new LiveNativeHostRunServiceV01({
    open_database: () => openDatabaseV01(),
    adapter_factory: () => createDeterministicCodexAdapterV01(),
  });
  try {
    const fixture = await createPreparedFixtureV01(
      db,
      "cancel-controller-missing",
      "Cancel Controller Missing",
      now,
    );
    const request = await requestAndGrantV01(
      db,
      owner,
      fixture,
      "2026-08-04T01:20:10.000Z",
    );
    const started = await startRepositoryManagedDelegationV01(
      db,
      startInputV01(fixture, request),
      owner,
      { now: () => "2026-08-04T01:20:12.000Z", platform: "darwin" },
    );
    setManagedRunStatusV01(db, started.run_id, "running", "2026-08-04T01:20:13.000Z");
    const run = readAutonomyRunLedgerRecord(started.run_id, { db });
    assert(run);
    const runCount = count(db, "autonomy_runs");
    const result = await cancelRepositoryManagedDelegationV01(db, {
      config: operatorConfig(workspaceId, fixture.project_id),
      attachment_id: fixture.attachment_id,
      expected_attachment_binding_fingerprint: fixture.binding_fingerprint,
      run_id: started.run_id,
      control_revision: Number(run.metadata.control_revision),
    }, observer);
    assert.equal(result.status, "reconciliation_required");
    assert.equal(result.projection.status, "paused");
    assert.equal(result.projection.reconciliation_required, true);
    assert.equal(result.projection.capability.status, "disconnected");
    assert.match(result.ordinary_text, /no owned worker was available to signal/u);
    assert.equal(counters.cancellation_signals, 0);
    assert.equal(count(db, "autonomy_runs"), runCount);
  } finally {
    await observer.shutdown();
    await owner.shutdown();
    assert.equal(counters.cancellation_signals, 1);
    now = "2026-08-04T01:20:20.000Z";
  }
}

async function assertQueuedCancellationV01(
  db: Database.Database,
  service: LiveNativeHostRunServiceV01,
  workspaceId: string,
): Promise<void> {
  const fixture = await createPreparedFixtureV01(
    db,
    "queued-cancel-repository",
    "Queued Cancel Repository",
    "2026-08-04T01:05:40.000Z",
  );
  selectProjectV01(db, workspaceId, fixture.project_id);
  const request = await requestAndGrantV01(db, service, fixture, "2026-08-04T01:05:50.000Z");
  const before = invocationCount;
  const config = operatorConfig(workspaceId, fixture.project_id);
  let cancelledRunId = "";
  const result = await startRepositoryManagedDelegationV01(db, startInputV01(fixture, request), service, {
    now: () => "2026-08-04T01:05:52.000Z",
    platform: "darwin",
    after_start_transaction_commit: async ({ run_id }) => {
      cancelledRunId = run_id;
      const queued = readAutonomyRunLedgerRecord(run_id, { db });
      assert(queued);
      await service.cancelRepositoryDelegationV01({
        config,
        run_ref: run_id,
        attachment_id: fixture.attachment_id,
        expected_attachment_binding_fingerprint: fixture.binding_fingerprint,
        control_revision: Number(queued.metadata.control_revision),
      });
    },
  });
  assert.equal(result.status, "blocked");
  assert.equal(invocationCount, before);
  assert.equal(readAutonomyRunLedgerRecord(cancelledRunId, { db })?.status, "cancelled");
  const replay = await cancelRepositoryManagedDelegationV01(db, {
    config,
    attachment_id: fixture.attachment_id,
    expected_attachment_binding_fingerprint: fixture.binding_fingerprint,
    run_id: cancelledRunId,
    control_revision: 0,
  }, service);
  assert.equal(replay.status, "exact_replay");
  assert.equal(replay.run_id, cancelledRunId);
  assert.equal(readAutonomyRunLedgerRecord(cancelledRunId, { db })?.status, "cancelled");
}

async function assertRunningCancellationV01(
  db: Database.Database,
  workspaceId: string,
): Promise<void> {
  let invocations = 0;
  const service = new LiveNativeHostRunServiceV01({
    open_database: () => openDatabaseV01(),
    adapter_factory: () => {
      const delegate = createDeterministicCodexAdapterV01({
        now: () => "2026-08-04T01:06:20.000Z",
      });
      return {
        ...delegate,
        invoke(request, control) {
          invocations += 1;
          let settled = false;
          let resolveResult!: (value: Awaited<ReturnType<typeof delegate.invoke>["result"]>) => void;
          const result = new Promise<Awaited<ReturnType<typeof delegate.invoke>["result"]>>(
            (resolve) => { resolveResult = resolve; },
          );
          const finish = () => {
            if (settled) return;
            settled = true;
            void delegate.invoke(request, control).result.then(resolveResult);
          };
          control.cancellation_signal.addEventListener("abort", finish, { once: true });
          if (control.cancellation_signal.aborted) finish();
          return {
            result,
            settled: result.then(() => undefined, () => undefined),
            request_stop: async () => { finish(); },
          };
        },
      };
    },
    now: () => "2026-08-04T01:06:20.000Z",
  });
  try {
    const fixture = await createPreparedFixtureV01(
      db,
      "running-cancel-repository",
      "Running Cancel Repository",
      "2026-08-04T01:06:00.000Z",
    );
    selectProjectV01(db, workspaceId, fixture.project_id);
    const request = await requestAndGrantV01(db, service, fixture, "2026-08-04T01:06:10.000Z");
    const started = await startRepositoryManagedDelegationV01(
      db,
      startInputV01(fixture, request),
      service,
      { now: () => "2026-08-04T01:06:12.000Z", platform: "darwin" },
    );
    assert.equal(started.status, "accepted");
    assert.equal(invocations, 1);
    const running = readAutonomyRunLedgerRecord(started.run_id, { db });
    assert(running);
    const cancelled = await cancelRepositoryManagedDelegationV01(db, {
      config: operatorConfig(workspaceId, fixture.project_id),
      attachment_id: fixture.attachment_id,
      expected_attachment_binding_fingerprint: fixture.binding_fingerprint,
      run_id: started.run_id,
      control_revision: Number(running.metadata.control_revision),
    }, service);
    assert.equal(cancelled.status, "cancel_requested");
    assert.equal(cancelled.run_id, started.run_id);
    await waitForTerminalV01(db, started.run_id);
    assert.equal(readAutonomyRunLedgerRecord(started.run_id, { db })?.status, "cancelled");
    const replay = await cancelRepositoryManagedDelegationV01(db, {
      config: operatorConfig(workspaceId, fixture.project_id),
      attachment_id: fixture.attachment_id,
      expected_attachment_binding_fingerprint: fixture.binding_fingerprint,
      run_id: started.run_id,
      control_revision: 0,
    }, service);
    assert.equal(replay.status, "exact_replay");
    assert.equal(replay.run_id, started.run_id);
    assert.equal(invocations, 1);
  } finally {
    await service.shutdown();
  }
}

async function assertAdapterLaunchFailureV01(
  db: Database.Database,
  workspaceId: string,
): Promise<void> {
  let invocations = 0;
  const service = new LiveNativeHostRunServiceV01({
    open_database: () => openDatabaseV01(),
    adapter_factory: () => ({
      ...createDeterministicCodexAdapterV01(),
      invoke() {
        invocations += 1;
        throw new Error("injected_repository_adapter_launch_failure");
      },
    }),
    now: () => "2026-08-04T01:06:50.000Z",
  });
  try {
    const fixture = await createPreparedFixtureV01(
      db,
      "launch-failure-repository",
      "Launch Failure Repository",
      "2026-08-04T01:06:30.000Z",
    );
    selectProjectV01(db, workspaceId, fixture.project_id);
    const request = await requestAndGrantV01(db, service, fixture, "2026-08-04T01:06:40.000Z");
    const result = await startRepositoryManagedDelegationV01(
      db,
      startInputV01(fixture, request),
      service,
      { now: () => "2026-08-04T01:06:42.000Z", platform: "darwin" },
    );
    assert.equal(result.status, "blocked");
    assert.equal(invocations, 1);
    assert.equal(readRepositoryExecutionAttachmentV01(db, fixture.attachment_id)?.lifecycle, "consumed");
    const run = readAutonomyRunLedgerRecord(result.run_id, { db });
    assert(run);
    assert(["failed", "paused", "blocked"].includes(run.status));
  } finally {
    await service.shutdown();
  }
}

async function assertStartDecisionMismatchAndExpiryV01(
  db: Database.Database,
  service: LiveNativeHostRunServiceV01,
  workspaceId: string,
): Promise<void> {
  const fixture = await createPreparedFixtureV01(
    db,
    "decision-expiry-repository",
    "Decision Expiry Repository",
    "2026-08-04T01:07:00.000Z",
  );
  selectProjectV01(db, workspaceId, fixture.project_id);
  const request = await requestAndGrantV01(db, service, fixture, "2026-08-04T01:07:10.000Z");
  await assert.rejects(
    startRepositoryManagedDelegationV01(db, {
      ...startInputV01(fixture, request),
      decision_grant_fingerprint: `sha256:${"0".repeat(64)}`,
    }, service, {
      now: () => "2026-08-04T01:07:12.000Z",
      platform: "darwin",
    }),
  );
  await assert.rejects(
    startRepositoryManagedDelegationV01(
      db,
      startInputV01(fixture, request),
      service,
      {
        now: () => "2026-08-04T01:23:00.000Z",
        platform: "darwin",
      },
    ),
    (error: unknown) =>
      error instanceof RepositoryManagedDelegationErrorV01 &&
      error.code === "repository_execution_decision_expired",
  );
  assert.equal(readRepositoryExecutionAttachmentV01(db, fixture.attachment_id)?.lifecycle, "prepared");
  assert.equal(countWhere(db, "autonomy_runs", `scope = '${fixture.project_id}'`), 0);
}

function assertExecutionEnvelopeAuthorityV01(): void {
  for (const command of [
    "git status",
    "git diff --stat",
    "git switch task-branch",
    "git commit --no-verify -m bounded",
    "npm test",
    "npm run build",
    "npx tsc --noEmit",
  ]) {
    assert.equal(classifyRepositoryEnvelopeCommandV01(command), "preauthorized", command);
  }
  for (const command of [
    "git push origin task-branch",
    "gh pr create",
    "npm install left-pad",
    "curl https://example.com",
    "sudo touch /tmp/outside",
    "npm publish",
  ]) {
    assert.equal(classifyRepositoryEnvelopeCommandV01(command), "refused", command);
  }
  assert.equal(classifyRepositoryEnvelopeCommandV01("rm -rf generated"), "approval_required");
  const request = {
    mode: "repository_attachment",
    repository_delegation_context: {
      protected_untracked_paths: ["new.ts"],
    },
  } as unknown as NativeHostRequestV01;
  const approval = {
    operation_class: "file_change",
    repository_envelope_classification: "preauthorized",
    repository_relative_paths: ["."],
  } as unknown as NativeHostApprovalRequestV01;
  assert.equal(repositoryEnvelopeDecisionV01(request, approval), "defer");
  assert.equal(repositoryEnvelopeDecisionV01(request, {
    ...approval,
    repository_relative_paths: ["src"],
  }), "approve");
  assert.equal(repositoryEnvelopeDecisionV01(request, {
    ...approval,
    operation_class: "network_permission",
    repository_envelope_classification: "refused",
  }), "decline");
}

function assertSecretBoundaryDocumentationV01(): void {
  const contract = readFileSync(
    path.join(process.cwd(), "docs/REPOSITORY_EXECUTION_ATTACHMENT_V0_1.md"),
    "utf8",
  );
  const architecture = readFileSync(
    path.join(process.cwd(), "docs/vnext/02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md"),
    "utf8",
  );
  const adapter = readFileSync(
    path.join(process.cwd(), "lib/vnext/native-host/codex-app-server-adapter.ts"),
    "utf8",
  );
  for (const source of [contract, architecture, adapter]) {
    assert.match(source, /Files already (?:present )?inside the exact repository|file already inside the exact root/u);
    assert.match(source, /does not claim|do not claim|not made technically unreadable/u);
    assert.match(source, /outside-root/u);
  }
  assert.match(contract, /no such content or secret-detection result is added to\s+MCP output/u);
  assert.match(adapter, /their contents must not be exposed through the bounded result surface/u);
}

async function assertPlatformAndNonGitRefusalV01(
  db: Database.Database,
  service: LiveNativeHostRunServiceV01,
  workspaceId: string,
): Promise<void> {
  const fixture = await createPreparedFixtureV01(
    db,
    "platform-repository",
    "Platform Repository",
    "2026-08-04T01:05:00.000Z",
  );
  const before = count(db, "autonomy_runs");
  for (const platform of ["win32", "linux"] as const) {
    const result = await prepareRepositoryManagedDelegationV01(db, {
      workspace_id: workspaceId,
      project_id: fixture.project_id,
      attachment_id: fixture.attachment_id,
    }, service, {
      now: () => "2026-08-04T01:05:10.000Z",
      platform,
    });
    assert.equal(result.status, "blocked");
    assert.equal(result.decision_request, null);
  }
  assert.equal(count(db, "autonomy_runs"), before);

  const plainRoot = path.join(ROOT, "plain-folder");
  mkdirSync(plainRoot);
  writeFileSync(path.join(plainRoot, "README.md"), "plain\n", "utf8");
  process.env.AUGNES_TEST_FOLDER_PICKER_PATH = plainRoot;
  const picked = await pickAndInspectLocalProjectV01({
    open_database: openDatabaseV01,
    now: () => "2026-08-04T01:05:20.000Z",
  });
  assert.equal(picked.status, "selected");
  const onboarded = await confirmLocalProjectOnboardingV01(db, {
    selection_token: picked.selection_token,
    inspection_fingerprint: picked.inspection.inspection_fingerprint,
    display_name: "Plain Folder",
  }, { now: () => "2026-08-04T01:05:20.000Z" });
  selectProjectV01(db, workspaceId, onboarded.project.project_id);
  defineWorkV01(db, onboarded.project.project_id, "Plain work", "2026-08-04T01:05:21.000Z");
  const preparation = await prepareRepositoryExecutionV01(db, {
    workspace_id: workspaceId,
    project_id: onboarded.project.project_id,
  }, { now: () => "2026-08-04T01:05:22.000Z" });
  assert.equal(preparation.status, "blocked");
  assert.equal(preparation.reason, "non_git_execution_unsupported");
  assert.equal(count(db, "autonomy_runs"), before);
}

type PreparedFixtureV01 = Awaited<ReturnType<typeof createPreparedFixtureV01>>;

async function requestAndGrantV01(
  db: Database.Database,
  service: LiveNativeHostRunServiceV01,
  fixture: PreparedFixtureV01,
  now: string,
) {
  const preparation = await prepareRepositoryManagedDelegationV01(db, {
    workspace_id: fixture.workspace_id,
    project_id: fixture.project_id,
    attachment_id: fixture.attachment_id,
  }, service, { now: () => now, platform: "darwin" });
  assert.equal(preparation.status, "decision_required");
  assert(preparation.decision_request && preparation.execution_envelope);
  return {
    preparation,
    granted: grantDecisionV01(
      db,
      preparation.decision_request,
      new Date(Date.parse(now) + 1_000).toISOString(),
    ),
  };
}

function startInputV01(fixture: PreparedFixtureV01, request: Awaited<ReturnType<typeof requestAndGrantV01>>) {
  return {
    config: operatorConfig(fixture.workspace_id, fixture.project_id),
    workspace_id: fixture.workspace_id,
    project_id: fixture.project_id,
    attachment_id: fixture.attachment_id,
    expected_attachment_binding_fingerprint: fixture.binding_fingerprint,
    expected_execution_envelope_fingerprint:
      request.preparation.execution_envelope!.envelope_fingerprint,
    decision_request_fingerprint: request.granted.request_fingerprint,
    decision_grant_fingerprint: request.granted.grant_fingerprint!,
  };
}

async function createPreparedFixtureV01(
  db: Database.Database,
  name: string,
  displayName: string,
  now: string,
) {
  const root = createRepositoryV01(name);
  process.env.AUGNES_TEST_FOLDER_PICKER_PATH = root;
  const picked = await pickAndInspectLocalProjectV01({
    open_database: openDatabaseV01,
    now: () => now,
  });
  assert.equal(picked.status, "selected");
  const onboarded = await confirmLocalProjectOnboardingV01(db, {
    selection_token: picked.selection_token,
    inspection_fingerprint: picked.inspection.inspection_fingerprint,
    display_name: displayName,
  }, { now: () => now });
  const project = onboarded.project;
  selectProjectV01(db, project.workspace_id, project.project_id);
  const work = defineWorkV01(
    db,
    project.project_id,
    `${displayName} exact work`,
    new Date(Date.parse(now) + 1_000).toISOString(),
  );
  const prepared = await prepareRepositoryExecutionV01(db, {
    workspace_id: project.workspace_id,
    project_id: project.project_id,
  }, { now: () => new Date(Date.parse(now) + 2_000).toISOString() });
  assert.equal(prepared.status, "prepared");
  assert(prepared.attachment);
  return {
    root,
    workspace_id: project.workspace_id,
    project_id: project.project_id,
    attachment_id: prepared.attachment.attachment_id,
    binding_fingerprint: prepared.attachment.binding_fingerprint,
    work,
  };
}

function defineWorkV01(db: Database.Database, projectId: string, goal: string, now: string) {
  const workspaceId = projectScopeV01(db, projectId);
  const config = operatorConfig(workspaceId, projectId);
  const credential = operatorCredentialV01(db, config, now);
  return defineInitialProjectWorkV01(db, {
    config,
    credential,
    request: {
      action: "define_initial_project_work",
      workspace_id: workspaceId,
      project_id: projectId,
      expected_active_project_id: projectId,
      expected_active_selection_revision:
        readActiveProjectSelectionV01(db, workspaceId)!.selection_revision,
      expected_initialization_state: "not_defined",
      goal,
      success_criteria: ["One exact managed repository run"],
      non_goals: ["No semantic approval or external publication"],
    },
    clock: { now: () => now },
  });
}

function reviseWorkV01(
  db: Database.Database,
  projectId: string,
  initial: ReturnType<typeof defineInitialProjectWorkV01>,
  goal: string,
  now: string,
): void {
  const workspaceId = projectScopeV01(db, projectId);
  selectProjectV01(db, workspaceId, projectId);
  const config = {
    ...operatorConfig(workspaceId, projectId),
    operator_id: `operator:cdx2b2b-revision:${projectId}`,
  };
  const credential = operatorCredentialV01(db, config, now);
  revisePreExecutionProjectWorkV01(db, {
    config,
    credential,
    request: {
      action: "revise_pre_execution_project_work",
      workspace_id: workspaceId,
      project_id: projectId,
      expected_active_project_id: projectId,
      expected_active_selection_revision:
        readActiveProjectSelectionV01(db, workspaceId)!.selection_revision,
      expected_current_packet_id: initial.packet.packet_id,
      expected_current_packet_fingerprint: initial.packet.integrity.fingerprint,
      expected_current_lineage_kind: "initial_user_defined",
      goal,
      success_criteria: ["Stale start state is refused"],
      non_goals: ["No worker invocation"],
    },
    clock: { now: () => now },
  });
}

function grantDecisionV01(
  db: Database.Database,
  request: RepositoryExecutionDecisionRequestProjectionV01,
  now: string,
): RepositoryExecutionDecisionRequestProjectionV01 {
  const config = operatorConfig(request.workspace_id, request.project_id);
  const session = browserDecisionSessionV01(db, config, now);
  const challenge = issueVNextRepositoryDecisionChallengeV01(db, {
    request_fingerprint: request.request_fingerprint,
    workspace_id: request.workspace_id,
    project_id: request.project_id,
    credential: session.repository_decision_session.credential,
    clock: { now: () => now },
  });
  return grantRepositoryExecutionDecisionFromBrowserSessionV01(db, {
    request_fingerprint: request.request_fingerprint,
    workspace_id: request.workspace_id,
    project_id: request.project_id,
    challenge_fingerprint: challenge.challenge_fingerprint,
    credential: session.repository_decision_session.credential,
  }, { now: () => now }).decision;
}

function browserDecisionSessionV01(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  now: string,
) {
  const base = Date.parse(now);
  const issued = issueVNextLocalOperatorBootstrapV01(db, {
    config,
    clock: { now: () => new Date(base - 2_000).toISOString() },
  });
  return consumeVNextLocalOperatorBootstrapV01(db, {
    config,
    bootstrap_token: issued.bootstrap_token,
    clock: { now: () => new Date(base - 1_000).toISOString() },
  });
}

function operatorCredentialV01(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  now: string,
) {
  const base = Date.parse(now);
  const issued = issueVNextLocalOperatorBootstrapV01(db, {
    config,
    clock: { now: () => new Date(base - 2_000).toISOString() },
  });
  return consumeVNextLocalOperatorBootstrapV01(db, {
    config,
    bootstrap_token: issued.bootstrap_token,
    clock: { now: () => new Date(base - 1_000).toISOString() },
  }).credential;
}

function operatorConfig(workspaceId: string, projectId: string): VNextLocalOperatorPilotConfigV01 {
  return {
    enabled: true,
    workspace_id: workspaceId,
    project_id: projectId,
    operator_id: `operator:cdx2b2b:${projectId}`,
    database_path: DATABASE_PATH,
  };
}

function selectProjectV01(db: Database.Database, workspaceId: string, projectId: string): void {
  const active = readActiveProjectSelectionV01(db, workspaceId);
  if (active?.project_id === projectId) return;
  selectActiveProjectV01(db, {
    workspace_id: workspaceId,
    project_id: projectId,
    expected_project_id: active?.project_id ?? null,
    expected_revision: active?.selection_revision ?? null,
    now: "2026-08-04T00:59:59.000Z",
  });
}

function projectScopeV01(db: Database.Database, projectId: string): string {
  const row = db.prepare(
    "SELECT workspace_id FROM vnext_project_identities WHERE project_id = ?",
  ).get(projectId) as { workspace_id: string } | undefined;
  assert(row);
  return row.workspace_id;
}

function createRepositoryV01(name: string): string {
  const root = path.join(ROOT, name);
  initializeRepositoryAtPathV01(root, name);
  return root;
}

function initializeRepositoryAtPathV01(root: string, name: string): void {
  mkdirSync(root, { recursive: true });
  writeFileSync(path.join(root, "README.md"), `# ${name}\n`, "utf8");
  execFileSync("git", ["init", "--quiet", root]);
  execFileSync("git", ["-C", root, "add", "README.md"]);
  execFileSync("git", [
    "-C", root,
    "-c", "user.name=Augnes Test",
    "-c", "user.email=test@augnes.local",
    "commit", "--quiet", "-m", "fixture",
  ]);
}

function openDatabaseV01(): Database.Database {
  const db = new Database(DATABASE_PATH);
  db.pragma("foreign_keys = ON");
  applyCanonicalDatabaseMigrations(db);
  return db;
}

async function waitForTerminalV01(db: Database.Database, runId: string): Promise<void> {
  for (let index = 0; index < 100; index += 1) {
    const run = readAutonomyRunLedgerRecord(runId, { db });
    if (run && ["completed", "failed", "blocked", "cancelled", "timed_out"].includes(run.status)) return;
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
  assert.fail("managed repository run did not settle within the bounded test loop");
}

async function waitForCheckpointCountV01(
  db: Database.Database,
  runId: string,
  expectedCount: number,
): Promise<void> {
  for (let index = 0; index < 20_000; index += 1) {
    if (
      countWhere(
        db,
        "vnext_repository_run_resume_checkpoints",
        `run_id = '${runId}'`,
      ) >= expectedCount
    ) return;
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
}

function count(db: Database.Database, table: string): number {
  return (db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number }).count;
}

function countWhere(db: Database.Database, table: string, where: string): number {
  return (db.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE ${where}`).get() as { count: number }).count;
}

function insertManagedRunFixtureV01(
  db: Database.Database,
  workspaceId: string,
  projectId: string,
  runId: string,
  now: string,
): void {
  db.prepare(
    `INSERT INTO autonomy_runs (
      run_id, scope, autonomy_contract_ref, title, status, scheduled_for,
      started_at, finished_at, created_at, updated_at, stop_reason,
      source_refs_json, authority_boundary_json, budget_snapshot_json,
      metadata_json
    ) VALUES (?, ?, NULL, ?, 'queued', NULL, NULL, NULL, ?, ?, NULL, '{}', '{}', '{}', ?)`,
  ).run(
    runId,
    projectId,
    "CDX2B2B managed-run race fixture",
    now,
    now,
    JSON.stringify({
      workspace_id: workspaceId,
      project_id: projectId,
      lifecycle_mode: "managed_live",
    }),
  );
}
