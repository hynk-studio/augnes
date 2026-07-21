import { createHash } from "node:crypto";

import Database from "better-sqlite3";

import { recordRunReconciliationResult } from "./continuity-operational-status.mjs";

export const RUN_RECONCILIATION_CONTRACT =
  "augnes.run-reconciliation-result.v1";
export const RUN_RECONCILIATION_SCHEMA_VERSION = 1;

export const RUN_RECONCILIATION_STATUS_MAPPING = Object.freeze({
  queued: "queued",
  starting: "starting",
  planned: "queued",
  running: "running",
  waiting_for_approval: "waiting_for_approval",
  cancelling: "cancelling",
  paused: "orphaned_or_indeterminate",
  blocked: "orphaned_or_indeterminate",
  completed: "completed",
  needs_review: "orphaned_or_indeterminate",
  cancelled: "cancelled",
  timed_out: "timed_out",
  created: "queued",
  scheduled: "queued",
  failed: "failed",
  stopped: "cancelled",
  cancel_requested: "cancelling",
});

const TERMINAL = new Set([
  "blocked",
  "completed",
  "needs_review",
  "cancelled",
  "timed_out",
  "failed",
  "stopped",
]);
const ACTIVE_OPERATION = new Set([
  "starting",
  "running",
  "cancelling",
  "cancel_requested",
]);
const QUEUED = new Set(["queued", "planned", "created", "scheduled"]);
const MAX_RUNS = 1_000;

export function mapRunStatusForRestart(status) {
  return RUN_RECONCILIATION_STATUS_MAPPING[status] ?? null;
}

/**
 * @param {{databasePath: string, observedAt?: string, recordResult?: boolean}} [options]
 * @returns {any}
 */
export function reconcileDurableRunsAtStartup({
  databasePath,
  observedAt = new Date().toISOString(),
  recordResult = true,
} = {}) {
  if (
    typeof databasePath !== "string" ||
    databasePath.length === 0 ||
    !Number.isFinite(Date.parse(observedAt)) ||
    new Date(observedAt).toISOString() !== observedAt
  ) {
    throw new Error("run_reconciliation_input_invalid");
  }
  const db = new Database(databasePath, { fileMustExist: true });
  let result;
  try {
    db.pragma("foreign_keys = ON");
    db.pragma("busy_timeout = 5000");
    if (!tableExists(db, "autonomy_runs")) {
      result = emptyResult(observedAt);
    } else {
      result = reconcileDatabase(db, observedAt);
    }
  } finally {
    db.close();
  }
  if (recordResult) {
    try {
      recordRunReconciliationResult({ databasePath, result });
    } catch {
      // Operational status is rebuildable and non-authoritative. Failure to
      // publish it must not undo a completed, fail-closed ledger pass.
    }
  }
  return result;
}

function reconcileDatabase(db, observedAt) {
  const total = Number(
    db.prepare("SELECT COUNT(*) AS count FROM autonomy_runs").get().count,
  );
  const rows = db.prepare(
    `SELECT run_id, scope, status, updated_at, metadata_json
       FROM autonomy_runs
      ORDER BY updated_at DESC, run_id ASC LIMIT ?`,
  ).all(MAX_RUNS);
  const counts = emptyCounts();
  const reasons = new Set();
  let exactReplays = 0;
  let conflicts = 0;
  let waiting = 0;
  let orphaned = 0;
  let unsupported = 0;
  let noRetry = 0;
  let eventsCreated = 0;

  db.exec("BEGIN IMMEDIATE");
  try {
    for (const row of rows) {
      const mapped = mapRunStatusForRestart(row.status);
      if (!mapped) {
        conflicts += 1;
        noRetry += 1;
        reasons.add("run_status_unsupported");
        continue;
      }
      counts[mapped] += 1;
      let metadata;
      try {
        metadata = JSON.parse(row.metadata_json);
      } catch {
        conflicts += 1;
        noRetry += 1;
        reasons.add("run_metadata_invalid");
        continue;
      }
      if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
        conflicts += 1;
        noRetry += 1;
        reasons.add("run_metadata_invalid");
        continue;
      }

      if (TERMINAL.has(row.status)) {
        const replay = inspectTerminalReceiptReplay(db, row, metadata);
        exactReplays += replay.exact;
        conflicts += replay.conflict;
        if (replay.conflict > 0) reasons.add("terminal_receipt_conflict");
        if (mapped === "orphaned_or_indeterminate") {
          orphaned += 1;
          reasons.add("terminal_run_review_needed");
        }
        noRetry += 1;
        continue;
      }
      if (row.status === "waiting_for_approval") {
        waiting += 1;
        noRetry += 1;
        reasons.add("approval_remains_pending");
        continue;
      }

      const hostBound = metadata.lifecycle_mode === "managed_live";
      const activeOperation = ACTIVE_OPERATION.has(row.status);
      if (hostBound || activeOperation || row.status === "paused") {
        unsupported += hostBound || activeOperation ? 1 : 0;
        orphaned += 1;
        noRetry += 1;
        if (mapped !== "orphaned_or_indeterminate") {
          counts[mapped] -= 1;
          counts.orphaned_or_indeterminate += 1;
        }
        reasons.add("host_observation_unsupported_after_restart");
        eventsCreated += pauseForReviewIfNeeded(db, row, metadata, observedAt);
        continue;
      }
      if (QUEUED.has(row.status)) {
        noRetry += 1;
        reasons.add("queued_run_requires_explicit_invocation");
        continue;
      }
      conflicts += 1;
      noRetry += 1;
      reasons.add("run_state_indeterminate");
    }
    db.exec("COMMIT");
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  }
  if (total > rows.length) reasons.add("run_inventory_bounded");
  const outcome = conflicts > 0
    ? "conflict_refused"
    : orphaned > 0 || waiting > 0 || total > rows.length
      ? "review_needed"
      : "reconciled";
  return {
    contract: RUN_RECONCILIATION_CONTRACT,
    schema_version: RUN_RECONCILIATION_SCHEMA_VERSION,
    observed_at: observedAt,
    outcome,
    total_runs_available: total,
    total_runs_considered: rows.length,
    counts,
    exact_replays_reused: exactReplays,
    conflicts_refused: conflicts,
    waiting_for_approval_count: waiting,
    orphaned_review_needed_count: orphaned,
    unsupported_host_coverage_count: unsupported,
    no_retry_count: noRetry,
    reconciliation_events_created: eventsCreated,
    reason_codes: [...reasons].sort(),
    next_safe_action:
      conflicts > 0 || orphaned > 0
        ? "review_orphaned_runs"
        : waiting > 0
          ? "review_pending_approvals"
          : total > rows.length
            ? "review_bounded_run_inventory"
            : "none",
    automatic_retry_started: false,
    semantic_authority_created: false,
    external_action_created: false,
  };
}

function inspectTerminalReceiptReplay(db, row, metadata) {
  const receiptId = typeof metadata.run_receipt_id === "string"
    ? metadata.run_receipt_id
    : null;
  const receiptFingerprint = typeof metadata.run_receipt_fingerprint === "string"
    ? metadata.run_receipt_fingerprint
    : null;
  if (receiptId === null && receiptFingerprint === null) return { exact: 0, conflict: 0 };
  if (
    receiptId === null ||
    receiptFingerprint === null ||
    !/^sha256:[a-f0-9]{64}$/u.test(receiptFingerprint) ||
    !tableExists(db, "vnext_core_records")
  ) {
    return { exact: 0, conflict: 1 };
  }
  const record = db.prepare(
    `SELECT workspace_id, project_id, fingerprint, payload_json
       FROM vnext_core_records
      WHERE record_kind = 'run_receipt' AND record_id = ?`,
  ).get(receiptId);
  if (!record) return { exact: 0, conflict: 1 };
  let payload;
  try { payload = JSON.parse(record.payload_json); } catch { return { exact: 0, conflict: 1 }; }
  return record.fingerprint === receiptFingerprint &&
    payload?.run_id === row.run_id &&
    payload?.workspace_id === metadata.workspace_id &&
    payload?.project_id === metadata.project_id &&
    record.workspace_id === metadata.workspace_id &&
    record.project_id === metadata.project_id
    ? { exact: 1, conflict: 0 }
    : { exact: 0, conflict: 1 };
}

function pauseForReviewIfNeeded(db, row, metadata, observedAt) {
  const bindingComplete =
    typeof metadata.workspace_id === "string" &&
    typeof metadata.project_id === "string" &&
    row.scope === metadata.project_id &&
    typeof metadata.packet_id === "string" &&
    /^sha256:[a-f0-9]{64}$/u.test(metadata.packet_fingerprint ?? "");
  const reason = bindingComplete
    ? "restart_host_observation_unsupported"
    : "restart_run_binding_incomplete";
  const priorStatus = typeof metadata.restart_prior_status === "string"
    ? metadata.restart_prior_status
    : row.status;
  const nextMetadata = {
    ...metadata,
    reconciliation_required: true,
    automatic_retry: false,
    public_reason: reason,
    restart_prior_status: priorStatus,
    restart_reconciliation_version: "startup_run_reconciliation.v1",
  };
  const alreadyPaused =
    row.status === "paused" &&
    metadata.reconciliation_required === true &&
    metadata.public_reason === reason &&
    metadata.restart_reconciliation_version === "startup_run_reconciliation.v1";
  if (!alreadyPaused) {
    const update = db.prepare(
      `UPDATE autonomy_runs
          SET status = 'paused', updated_at = ?, stop_reason = ?, metadata_json = ?
        WHERE run_id = ? AND status = ? AND metadata_json = ?`,
    ).run(
      observedAt,
      reason,
      JSON.stringify(nextMetadata),
      row.run_id,
      row.status,
      row.metadata_json,
    );
    if (update.changes !== 1) {
      throw new Error("run_reconciliation_state_conflict");
    }
  }
  const eventId = `run-reconciliation:${createHash("sha256")
    .update(`${row.run_id}\0startup_run_reconciliation.v1`)
    .digest("hex")}`;
  const existing = db.prepare(
    "SELECT status, event_type, payload_json FROM autonomy_run_events WHERE event_id = ?",
  ).get(eventId);
  const payload = {
    reconciliation_version: "startup_run_reconciliation.v1",
    reason,
    prior_status: priorStatus,
    host_observation_supported: false,
    automatic_retry_started: false,
    semantic_authority_created: false,
    external_action_created: false,
  };
  if (existing) {
    if (
      existing.status !== "paused" ||
      existing.event_type !== "run_reconciliation_required" ||
      existing.payload_json !== JSON.stringify(payload)
    ) {
      throw new Error("run_reconciliation_event_conflict");
    }
    return 0;
  }
  db.prepare(
    `INSERT INTO autonomy_run_events (
      event_id, run_id, step_id, event_type, status,
      message, payload_json, created_at
    ) VALUES (?, ?, NULL, 'run_reconciliation_required', 'paused', ?, ?, ?)`,
  ).run(
    eventId,
    row.run_id,
    "Restart found no supported observer for the exact prior host operation; review is required and no retry was started.",
    JSON.stringify(payload),
    observedAt,
  );
  return 1;
}

function emptyResult(observedAt) {
  return {
    contract: RUN_RECONCILIATION_CONTRACT,
    schema_version: RUN_RECONCILIATION_SCHEMA_VERSION,
    observed_at: observedAt,
    outcome: "reconciled",
    total_runs_available: 0,
    total_runs_considered: 0,
    counts: emptyCounts(),
    exact_replays_reused: 0,
    conflicts_refused: 0,
    waiting_for_approval_count: 0,
    orphaned_review_needed_count: 0,
    unsupported_host_coverage_count: 0,
    no_retry_count: 0,
    reconciliation_events_created: 0,
    reason_codes: [],
    next_safe_action: "none",
    automatic_retry_started: false,
    semantic_authority_created: false,
    external_action_created: false,
  };
}

function emptyCounts() {
  return {
    queued: 0,
    starting: 0,
    running: 0,
    waiting_for_approval: 0,
    cancelling: 0,
    completed: 0,
    failed: 0,
    timed_out: 0,
    cancelled: 0,
    orphaned_or_indeterminate: 0,
  };
}

function tableExists(db, name) {
  return Boolean(db.prepare(
    "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?",
  ).get(name));
}
