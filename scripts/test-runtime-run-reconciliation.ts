import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import {
  buildSemanticReviewLoopRunReceiptFixture,
  buildSemanticReviewLoopTaskContextPacketFixture,
} from "../fixtures/vnext/protocol/semantic-review-loop-v0-1";
import {
  insertVNextCoreRecordV01,
} from "../lib/vnext/persistence/durable-semantic-store";
import { admitStructuredRunReceiptV01 } from "../lib/vnext/persistence/structured-run-receipt-admission";
import {
  createRunReceiptFingerprintV01,
  deriveRunReceiptIdV01,
  validateRunReceiptV01,
} from "../lib/vnext/run-receipt";
import {
  AUTONOMY_RUNNER_INTERNAL_STATUSES,
  AUTONOMY_RUNNER_PUBLIC_STATUSES,
} from "../types/autonomy-runner-execution";
import type { RunReceiptV01 } from "../types/vnext/run-receipt";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import {
  CONTINUITY_OPERATION_FILE,
  buildRedactedSupportReport,
  readContinuityOperationalStatus,
} from "./continuity-operational-status.mjs";
import {
  RUN_RECONCILIATION_STATUS_MAPPING,
  mapRunStatusForRestart,
  reconcileDurableRunsAtStartup,
} from "./runtime-run-reconciliation.mjs";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";

const root = mkdtempSync(path.join(tmpdir(), "augnes-run-reconciliation-"));
chmodSync(root, 0o700);
const databasePath = path.join(root, "augnes.db");
const observedAt = "2026-07-21T05:00:00.000Z";
const network = installZeroNetworkGuard({
  allowLoopback: false,
  errorPrefix: "run_reconciliation_external_network_forbidden",
});

async function main(): Promise<void> {
  try {
    const database = new Database(databasePath);
    database.pragma("foreign_keys = ON");
    applyCanonicalDatabaseMigrations(database);

    const project = {
      fixture_id: "restart-reconciliation",
      workspace_id: "workspace:restart-reconciliation",
      project_id: "project:restart-reconciliation",
      run_id: "run:restart-reconciliation-completed",
    };
    const packet = buildSemanticReviewLoopTaskContextPacketFixture(project);
    const receipt = buildSemanticReviewLoopRunReceiptFixture(project, packet);
    insertVNextCoreRecordV01(database, {
      record_kind: "task_context_packet",
      record_id: packet.packet_id,
      workspace_id: packet.workspace_id,
      project_id: packet.project_id,
      fingerprint: packet.integrity.fingerprint,
      idempotency_key: null,
      payload: packet,
      created_at: packet.generated_at,
    });
    assert.equal(admitStructuredRunReceiptV01(database, receipt).status, "inserted");
    assert.equal(admitStructuredRunReceiptV01(database, receipt).status, "exact_replay");

    const conflictingReceipt = structuredClone(receipt) as RunReceiptV01;
    conflictingReceipt.result_summary.summary =
      "A different but valid normalized replay payload must fail closed.";
    conflictingReceipt.receipt_id = deriveRunReceiptIdV01(conflictingReceipt);
    conflictingReceipt.integrity.fingerprint =
      createRunReceiptFingerprintV01(conflictingReceipt);
    const conflictingValidation = validateRunReceiptV01(conflictingReceipt);
    assert.equal(
      conflictingValidation.status,
      "valid",
      JSON.stringify(conflictingValidation),
    );
    assert.throws(
      () => admitStructuredRunReceiptV01(database, conflictingReceipt),
      /vnext_core_record_conflict/u,
    );

    const actualStatuses = [
      ...AUTONOMY_RUNNER_PUBLIC_STATUSES,
      ...AUTONOMY_RUNNER_INTERNAL_STATUSES,
    ];
    assert.deepEqual(
      Object.keys(RUN_RECONCILIATION_STATUS_MAPPING).sort(),
      [...actualStatuses].sort(),
      "startup mapping must enumerate every and only current durable status",
    );
    for (const status of actualStatuses) {
      assert.notEqual(mapRunStatusForRestart(status), null);
    }

    for (const status of actualStatuses) {
      const runId = status === "completed"
        ? receipt.run_id
        : `run:restart-reconciliation:${status}`;
      seedRun(database, {
        runId,
        status,
        workspaceId: project.workspace_id,
        projectId: project.project_id,
        packetId: packet.packet_id,
        packetFingerprint: packet.integrity.fingerprint,
        receipt:
          status === "completed"
            ? {
                id: receipt.receipt_id,
                fingerprint: receipt.integrity.fingerprint,
              }
            : null,
      });
    }
    seedRun(database, {
      runId: "run:restart-reconciliation:terminal-conflict",
      status: "failed",
      workspaceId: project.workspace_id,
      projectId: project.project_id,
      packetId: packet.packet_id,
      packetFingerprint: packet.integrity.fingerprint,
      receipt: {
        id: receipt.receipt_id,
        fingerprint: `sha256:${"f".repeat(64)}`,
      },
    });

    const protectedSnapshots = new Map(
      database.prepare(
        `SELECT run_id, source_refs_json, authority_boundary_json,
                budget_snapshot_json
           FROM autonomy_runs`,
      ).all().map((row) => {
        const record = row as Record<string, string>;
        return [record.run_id, {
          source_refs_json: record.source_refs_json,
          authority_boundary_json: record.authority_boundary_json,
          budget_snapshot_json: record.budget_snapshot_json,
        }];
      }),
    );
    const canonicalBefore = Number(
      (database.prepare("SELECT COUNT(*) AS count FROM vnext_core_records").get() as { count: number }).count,
    );
    database.close();

    const first = reconcileDurableRunsAtStartup({
      databasePath,
      observedAt,
    });
    assert.equal(first.outcome, "conflict_refused");
    assert.equal(first.total_runs_considered, actualStatuses.length + 1);
    assert.equal(first.waiting_for_approval_count, 1);
    assert.equal(first.exact_replays_reused, 1);
    assert.equal(first.conflicts_refused, 1);
    assert.equal(first.orphaned_review_needed_count, 7);
    assert.equal(first.unsupported_host_coverage_count, 4);
    assert.equal(first.reconciliation_events_created, 5);
    assert.equal(first.automatic_retry_started, false);
    assert.equal(first.semantic_authority_created, false);
    assert.equal(first.external_action_created, false);
    assert(first.reason_codes.includes("approval_remains_pending"));
    assert(first.reason_codes.includes("host_observation_unsupported_after_restart"));
    assert(first.reason_codes.includes("terminal_receipt_conflict"));

    const verification = new Database(databasePath, { fileMustExist: true });
    verification.pragma("foreign_keys = ON");
    for (const [runId, expected] of protectedSnapshots) {
      const row = verification.prepare(
        `SELECT source_refs_json, authority_boundary_json, budget_snapshot_json
           FROM autonomy_runs WHERE run_id = ?`,
      ).get(runId) as Record<string, string>;
      assert.deepEqual(row, expected, `restart must not drift authority for ${runId}`);
    }
    for (const status of ["starting", "running", "cancelling", "cancel_requested"]) {
      const row = verification.prepare(
        "SELECT status, metadata_json FROM autonomy_runs WHERE run_id = ?",
      ).get(`run:restart-reconciliation:${status}`) as {
        status: string;
        metadata_json: string;
      };
      const metadata = JSON.parse(row.metadata_json) as Record<string, unknown>;
      assert.equal(row.status, "paused");
      assert.equal(metadata.restart_prior_status, status);
      assert.equal(metadata.automatic_retry, false);
      assert.equal(metadata.reconciliation_required, true);
    }
    const waiting = verification.prepare(
      "SELECT status, metadata_json FROM autonomy_runs WHERE run_id = ?",
    ).get("run:restart-reconciliation:waiting_for_approval") as {
      status: string;
      metadata_json: string;
    };
    assert.equal(waiting.status, "waiting_for_approval");
    assert.equal((JSON.parse(waiting.metadata_json) as Record<string, unknown>).approval_inferred, false);
    for (const status of ["completed", "failed", "timed_out", "cancelled"]) {
      const runId = status === "completed"
        ? receipt.run_id
        : `run:restart-reconciliation:${status}`;
      assert.equal(
        (verification.prepare("SELECT status FROM autonomy_runs WHERE run_id = ?").get(runId) as { status: string }).status,
        status,
      );
    }
    assert.equal(
      Number((verification.prepare("SELECT COUNT(*) AS count FROM vnext_core_records").get() as { count: number }).count),
      canonicalBefore,
    );
    verification.close();

    const second = reconcileDurableRunsAtStartup({
      databasePath,
      observedAt: "2026-07-21T05:01:00.000Z",
    });
    assert.equal(second.reconciliation_events_created, 0);
    assert.equal(second.exact_replays_reused, 1);
    assert.equal(second.conflicts_refused, 1);

    const continuity = readContinuityOperationalStatus({ databasePath });
    assert.equal(continuity.reconciliation?.reconciliation_events_created, 0);
    assert.equal(statSync(path.join(root, CONTINUITY_OPERATION_FILE)).mode & 0o777, 0o600);
    const report = buildRedactedSupportReport({
      recoveryStatus: {
        application: {
          version: "0.1.0",
          build_identity: `sha256:${"a".repeat(64)}`,
          compatibility: "verified_package",
          package_contract: "augnes.distributable.v1",
          package_contract_version: 2,
        },
        database: {
          state: "current",
          schema_contract: "augnes.sqlite.structural-schema.v1",
          schema_classification: "current",
          migration_state: "current",
        },
        runtime: {
          runtime_contract: "augnes-local-runtime-supervisor-v1",
          bridge_health: "ready",
          capability_availability: "runtime_and_bridge",
        },
        latest_operation: null,
      },
      continuityStatus: continuity,
      generatedAt: "2026-07-21T05:02:00.000Z",
    });
    const reportText = JSON.stringify(report);
    for (const forbidden of [
      "sk-proj-private-sentinel",
      "raw prompt sentinel",
      databasePath,
      project.project_id,
      receipt.receipt_id,
    ]) {
      assert.equal(reportText.includes(forbidden), false);
    }
    assert.equal(report.actions_created.semantic, false);
    assert.equal(report.actions_created.host, false);
    assert.equal(report.actions_created.external, false);

    assert.equal(network.attempts.length, 0);
    network.restore();
    rmSync(root, { recursive: true, force: true });
    assert.equal(existsSync(root), false);
    console.log(JSON.stringify({
      test: "runtime-run-reconciliation",
      status: "pass",
      actual_statuses_mapped: actualStatuses.length,
      terminal_states_preserved: true,
      waiting_approval_preserved: true,
      exact_receipt_replay_reused: true,
      conflicting_receipt_refused: true,
      active_host_runs_review_needed: 4,
      terminal_runs_already_review_needed: 2,
      duplicate_reconciliation_events: 0,
      automatic_retry_started: false,
      semantic_authority_created: false,
      external_action_created: false,
      public_safe_support_report_verified: true,
      external_network_attempts: 0,
      residue_after_cleanup: 0,
    }, null, 2));
  } finally {
    network.restore();
    rmSync(root, { recursive: true, force: true });
  }
}

function seedRun(
  database: Database.Database,
  input: {
    runId: string;
    status: string;
    workspaceId: string;
    projectId: string;
    packetId: string;
    packetFingerprint: string;
    receipt: null | { id: string; fingerprint: string };
  },
): void {
  const active = ["starting", "running", "cancelling", "cancel_requested"].includes(input.status);
  const metadata = {
    workspace_id: input.workspaceId,
    project_id: input.projectId,
    work_id: "work:restart-reconciliation",
    packet_id: input.packetId,
    packet_fingerprint: input.packetFingerprint,
    lifecycle_mode: active ? "managed_live" : "deterministic_local",
    host_external_ref: {
      ref_version: "external_ref.v0.1",
      ref_type: "native_host_run",
      external_id: `host:${input.runId}`,
    },
    policy_id: "policy:restart-reconciliation",
    grant_id: "grant:restart-reconciliation",
    budget_id: "budget:restart-reconciliation",
    capability_scope: "local_project_only",
    operation_scope: "exact_run_only",
    automatic_retry: false,
    approval_inferred: false,
    ...(input.status === "waiting_for_approval"
      ? {
          pending_approval: {
            approval_id: "approval:restart-reconciliation",
            expires_at: "2026-07-20T00:00:00.000Z",
          },
        }
      : {}),
    ...(input.receipt
      ? {
          run_receipt_id: input.receipt.id,
          run_receipt_fingerprint: input.receipt.fingerprint,
        }
      : {}),
  };
  const time = "2026-07-20T00:00:00.000Z";
  database.prepare(
    `INSERT INTO autonomy_runs (
      run_id, scope, autonomy_contract_ref, title, status, scheduled_for,
      started_at, finished_at, created_at, updated_at, stop_reason,
      source_refs_json, authority_boundary_json, budget_snapshot_json,
      metadata_json
    ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, NULL, ?, ?, ?, ?)`,
  ).run(
    input.runId,
    input.projectId,
    active ? "direct_native_host_round_trip.v0.1" : "autonomy_runner_execution.v0.1",
    `Restart reconciliation fixture ${input.status}`,
    input.status,
    active ? time : null,
    ["completed", "failed", "timed_out", "cancelled", "blocked", "needs_review", "stopped"].includes(input.status)
      ? time
      : null,
    time,
    time,
    JSON.stringify({ project_id: input.projectId, packet_id: input.packetId }),
    JSON.stringify({ can_retry_replay_deploy: false, can_publish_external: false }),
    JSON.stringify({ budget_id: "budget:restart-reconciliation", max_external_calls: 0 }),
    JSON.stringify(metadata),
  );
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
