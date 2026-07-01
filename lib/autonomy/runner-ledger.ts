import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { openDatabase } from "../db";
import {
  AUTONOMY_RUNNER_DELTA_BATCH_VERSION,
  type AutonomyRunEventRecord,
  type AutonomyRunListOptions,
  type AutonomyRunRecord,
  type AutonomyRunStepRecord,
  type AutonomyRunSummary,
  type AutonomyRunnerEventType,
  type AutonomyRunnerLedgerOptions,
  type AutonomyRunnerStatus,
  type AutonomyRunnerStepStatus,
  type JsonObject,
  type RecoveredAutonomyDeltaBatch,
} from "../../types/autonomy-runner-execution";
import {
  buildDefaultRunnerAuthorityBoundary,
  buildDefaultRunnerBudgetSnapshot,
  buildDefaultRunnerSourceRefs,
} from "./runner-state";

export type AutonomyRunnerLedgerDb = Database.Database;

export type AutonomyRunnerLedgerDbOptions = AutonomyRunnerLedgerOptions & {
  db?: AutonomyRunnerLedgerDb;
};

type RunRow = {
  run_id: string;
  scope: string;
  autonomy_contract_ref: string | null;
  title: string;
  status: string;
  scheduled_for: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
  stop_reason: string | null;
  source_refs_json: string;
  authority_boundary_json: string;
  budget_snapshot_json: string;
  metadata_json: string;
};

type StepRow = {
  step_id: string;
  run_id: string;
  step_index: number;
  action_kind: string;
  status: string;
  title: string;
  summary: string;
  started_at: string | null;
  finished_at: string | null;
  output_json: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

type EventRow = {
  event_id: string;
  run_id: string;
  step_id: string | null;
  event_type: string;
  status: string;
  message: string;
  payload_json: string;
  created_at: string;
};

type DeltaBatchRow = {
  batch_id: string;
  run_id: string;
  batch_version: string;
  status: string;
  title: string;
  summary: string;
  created_at: string;
  delta_count: number;
  deltas_json: string;
  source_refs_json: string;
  validation_json: string;
  authority_boundary_json: string;
};

export const autonomyRunnerLedgerSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS autonomy_runs (
  run_id TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  autonomy_contract_ref TEXT,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  scheduled_for TEXT,
  started_at TEXT,
  finished_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  stop_reason TEXT,
  source_refs_json TEXT NOT NULL,
  authority_boundary_json TEXT NOT NULL,
  budget_snapshot_json TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_autonomy_runs_scope_status_schedule
  ON autonomy_runs(scope, status, scheduled_for, updated_at);

CREATE INDEX IF NOT EXISTS idx_autonomy_runs_scope_updated
  ON autonomy_runs(scope, updated_at DESC);

CREATE TABLE IF NOT EXISTS autonomy_run_steps (
  step_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  step_index INTEGER NOT NULL,
  action_kind TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT,
  output_json TEXT NOT NULL DEFAULT '{}',
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES autonomy_runs(run_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_autonomy_run_steps_run_index
  ON autonomy_run_steps(run_id, step_index);

CREATE INDEX IF NOT EXISTS idx_autonomy_run_steps_run_status
  ON autonomy_run_steps(run_id, status, step_index);

CREATE TABLE IF NOT EXISTS autonomy_run_events (
  event_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  step_id TEXT,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES autonomy_runs(run_id) ON DELETE CASCADE,
  FOREIGN KEY (step_id) REFERENCES autonomy_run_steps(step_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_autonomy_run_events_run_time
  ON autonomy_run_events(run_id, created_at, event_id);

CREATE TABLE IF NOT EXISTS autonomy_run_delta_batches (
  batch_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  batch_version TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TEXT NOT NULL,
  delta_count INTEGER NOT NULL,
  deltas_json TEXT NOT NULL,
  source_refs_json TEXT NOT NULL,
  validation_json TEXT NOT NULL,
  authority_boundary_json TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES autonomy_runs(run_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_autonomy_run_delta_batches_run_time
  ON autonomy_run_delta_batches(run_id, created_at, batch_id);
`;

export function ensureAutonomyRunnerLedgerSchemaV01(
  db: AutonomyRunnerLedgerDb,
): void {
  db.exec(autonomyRunnerLedgerSchemaSqlV01);
}

export function autonomyRunnerLedgerSchemaExistsV01(
  db: AutonomyRunnerLedgerDb,
): boolean {
  const requiredTables = [
    "autonomy_runs",
    "autonomy_run_steps",
    "autonomy_run_events",
    "autonomy_run_delta_batches",
  ];
  const rows = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name IN (?, ?, ?, ?)`,
    )
    .all(...requiredTables) as { name: string }[];
  const names = new Set(rows.map((row) => row.name));
  return requiredTables.every((table) => names.has(table));
}

export function withAutonomyRunnerLedgerDb<T>(
  options: AutonomyRunnerLedgerDbOptions,
  callback: (db: AutonomyRunnerLedgerDb) => T,
): T {
  if (options.db) {
    ensureAutonomyRunnerLedgerSchemaV01(options.db);
    return callback(options.db);
  }

  const db = options.dbPath
    ? openStandaloneDatabase(options.dbPath)
    : openDatabase();

  try {
    ensureAutonomyRunnerLedgerSchemaV01(db);
    return callback(db);
  } finally {
    db.close();
  }
}

export function insertAutonomyRunLedgerRecord(
  run: AutonomyRunSummary,
  steps: AutonomyRunStepRecord[],
  initialEvents: AutonomyRunEventRecord[],
  options: AutonomyRunnerLedgerDbOptions = {},
): AutonomyRunRecord {
  return withAutonomyRunnerLedgerDb(options, (db) => {
    db.prepare("BEGIN IMMEDIATE").run();
    try {
      db.prepare(
        `INSERT INTO autonomy_runs (
          run_id,
          scope,
          autonomy_contract_ref,
          title,
          status,
          scheduled_for,
          started_at,
          finished_at,
          created_at,
          updated_at,
          stop_reason,
          source_refs_json,
          authority_boundary_json,
          budget_snapshot_json,
          metadata_json
        ) VALUES (
          @run_id,
          @scope,
          @autonomy_contract_ref,
          @title,
          @status,
          @scheduled_for,
          @started_at,
          @finished_at,
          @created_at,
          @updated_at,
          @stop_reason,
          @source_refs_json,
          @authority_boundary_json,
          @budget_snapshot_json,
          @metadata_json
        )`,
      ).run(serializeRun(run));

      const insertStep = db.prepare(
        `INSERT INTO autonomy_run_steps (
          step_id,
          run_id,
          step_index,
          action_kind,
          status,
          title,
          summary,
          started_at,
          finished_at,
          output_json,
          error_message,
          created_at,
          updated_at
        ) VALUES (
          @step_id,
          @run_id,
          @step_index,
          @action_kind,
          @status,
          @title,
          @summary,
          @started_at,
          @finished_at,
          @output_json,
          @error_message,
          @created_at,
          @updated_at
        )`,
      );
      for (const step of steps) insertStep.run(serializeStep(step));

      const insertEvent = db.prepare(
        `INSERT INTO autonomy_run_events (
          event_id,
          run_id,
          step_id,
          event_type,
          status,
          message,
          payload_json,
          created_at
        ) VALUES (
          @event_id,
          @run_id,
          @step_id,
          @event_type,
          @status,
          @message,
          @payload_json,
          @created_at
        )`,
      );
      for (const event of initialEvents) insertEvent.run(serializeEvent(event));

      db.prepare("COMMIT").run();
    } catch (error) {
      db.prepare("ROLLBACK").run();
      throw error;
    }

    const inserted = readAutonomyRunLedgerRecord(run.run_id, { db });
    if (!inserted) throw new Error(`autonomy_run_insert_failed:${run.run_id}`);
    return inserted;
  });
}

export function readAutonomyRunLedgerRecord(
  runId: string,
  options: AutonomyRunnerLedgerDbOptions = {},
): AutonomyRunRecord | null {
  return withAutonomyRunnerLedgerDb(options, (db) => {
    const row = db
      .prepare("SELECT * FROM autonomy_runs WHERE run_id = ?")
      .get(runId) as RunRow | undefined;
    if (!row) return null;
    return {
      ...parseRun(row),
      steps: listStepRecords(db, runId),
      events: listEventRecords(db, runId),
      delta_batches: listDeltaBatchRecords(db, runId),
    };
  });
}

export function listAutonomyRunLedgerRecords(
  options: AutonomyRunListOptions & AutonomyRunnerLedgerDbOptions = {},
): AutonomyRunSummary[] {
  return withAutonomyRunnerLedgerDb(options, (db) => {
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (options.scope) {
      clauses.push("scope = ?");
      params.push(options.scope);
    }
    if (options.status) {
      clauses.push("status = ?");
      params.push(options.status);
    }
    const limit = Math.max(1, Math.min(options.limit ?? 100, 500));
    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = db
      .prepare(
        `SELECT * FROM autonomy_runs ${where}
         ORDER BY updated_at DESC, run_id ASC
         LIMIT ?`,
      )
      .all(...params, limit) as RunRow[];
    return rows.map(parseRun);
  });
}

export function updateAutonomyRunLedgerFields(
  runId: string,
  fields: Partial<
    Pick<
      AutonomyRunSummary,
      | "status"
      | "scheduled_for"
      | "started_at"
      | "finished_at"
      | "updated_at"
      | "stop_reason"
      | "metadata"
    >
  >,
  options: AutonomyRunnerLedgerDbOptions = {},
): AutonomyRunRecord {
  return withAutonomyRunnerLedgerDb(options, (db) => {
    const assignments: string[] = [];
    const values: Record<string, unknown> = { run_id: runId };
    for (const [key, value] of Object.entries(fields)) {
      if (key === "metadata") {
        assignments.push("metadata_json = @metadata_json");
        values.metadata_json = serializeJson(value ?? {});
      } else {
        assignments.push(`${key} = @${key}`);
        values[key] = value;
      }
    }
    if (assignments.length > 0) {
      db.prepare(
        `UPDATE autonomy_runs SET ${assignments.join(", ")} WHERE run_id = @run_id`,
      ).run(values);
    }
    const updated = readAutonomyRunLedgerRecord(runId, { db });
    if (!updated) throw new Error(`autonomy_run_not_found:${runId}`);
    return updated;
  });
}

export function updateAutonomyRunStepLedgerFields(
  stepId: string,
  fields: Partial<
    Pick<
      AutonomyRunStepRecord,
      | "status"
      | "started_at"
      | "finished_at"
      | "output"
      | "error_message"
      | "updated_at"
    >
  >,
  options: AutonomyRunnerLedgerDbOptions = {},
): AutonomyRunStepRecord {
  return withAutonomyRunnerLedgerDb(options, (db) => {
    const assignments: string[] = [];
    const values: Record<string, unknown> = { step_id: stepId };
    for (const [key, value] of Object.entries(fields)) {
      if (key === "output") {
        assignments.push("output_json = @output_json");
        values.output_json = serializeJson(value ?? {});
      } else {
        assignments.push(`${key} = @${key}`);
        values[key] = value;
      }
    }
    if (assignments.length > 0) {
      db.prepare(
        `UPDATE autonomy_run_steps SET ${assignments.join(", ")} WHERE step_id = @step_id`,
      ).run(values);
    }
    const row = db
      .prepare("SELECT * FROM autonomy_run_steps WHERE step_id = ?")
      .get(stepId) as StepRow | undefined;
    if (!row) throw new Error(`autonomy_run_step_not_found:${stepId}`);
    return parseStep(row);
  });
}

export function appendAutonomyRunLedgerEvent(
  event: AutonomyRunEventRecord,
  options: AutonomyRunnerLedgerDbOptions = {},
): AutonomyRunEventRecord {
  return withAutonomyRunnerLedgerDb(options, (db) => {
    db.prepare(
      `INSERT INTO autonomy_run_events (
        event_id,
        run_id,
        step_id,
        event_type,
        status,
        message,
        payload_json,
        created_at
      ) VALUES (
        @event_id,
        @run_id,
        @step_id,
        @event_type,
        @status,
        @message,
        @payload_json,
        @created_at
      )`,
    ).run(serializeEvent(event));
    return event;
  });
}

export function insertAutonomyRunDeltaBatchLedgerRecord(
  batch: RecoveredAutonomyDeltaBatch,
  options: AutonomyRunnerLedgerDbOptions = {},
): RecoveredAutonomyDeltaBatch {
  return withAutonomyRunnerLedgerDb(options, (db) => {
    db.prepare(
      `INSERT OR REPLACE INTO autonomy_run_delta_batches (
        batch_id,
        run_id,
        batch_version,
        status,
        title,
        summary,
        created_at,
        delta_count,
        deltas_json,
        source_refs_json,
        validation_json,
        authority_boundary_json
      ) VALUES (
        @batch_id,
        @run_id,
        @batch_version,
        @status,
        @title,
        @summary,
        @created_at,
        @delta_count,
        @deltas_json,
        @source_refs_json,
        @validation_json,
        @authority_boundary_json
      )`,
    ).run(serializeDeltaBatch(batch));
    return batch;
  });
}

export function readAutonomyRunDeltaBatchLedgerRecord(
  batchId: string,
  options: AutonomyRunnerLedgerDbOptions = {},
): RecoveredAutonomyDeltaBatch | null {
  return withAutonomyRunnerLedgerDb(options, (db) => {
    const row = db
      .prepare("SELECT * FROM autonomy_run_delta_batches WHERE batch_id = ?")
      .get(batchId) as DeltaBatchRow | undefined;
    return row ? parseDeltaBatch(row) : null;
  });
}

export function listAutonomyRunDeltaBatchLedgerRecords(
  runId: string,
  options: AutonomyRunnerLedgerDbOptions = {},
): RecoveredAutonomyDeltaBatch[] {
  return withAutonomyRunnerLedgerDb(options, (db) => listDeltaBatchRecords(db, runId));
}

export function countAutonomyRunnerLedgerRows(
  options: AutonomyRunnerLedgerDbOptions = {},
): Record<string, number> {
  return withAutonomyRunnerLedgerDb(options, (db) => {
    const tables = [
      "autonomy_runs",
      "autonomy_run_steps",
      "autonomy_run_events",
      "autonomy_run_delta_batches",
    ];
    return Object.fromEntries(
      tables.map((table) => {
        const row = db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as {
          count: number;
        };
        return [table, row.count];
      }),
    );
  });
}

export function buildAutonomyRunEventRecord({
  run_id,
  step_id = null,
  event_type,
  status,
  message,
  payload = {},
  created_at,
}: {
  run_id: string;
  step_id?: string | null;
  event_type: AutonomyRunnerEventType;
  status: AutonomyRunnerStatus | AutonomyRunnerStepStatus | "ok" | "skipped";
  message: string;
  payload?: JsonObject;
  created_at: string;
}): AutonomyRunEventRecord {
  return {
    event_id: `${run_id}.event.${created_at}.${event_type}.${step_id ?? "run"}.${randomUUID()}`,
    run_id,
    step_id,
    event_type,
    status,
    message,
    payload,
    created_at,
  };
}

function openStandaloneDatabase(dbPath: string) {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath, { fileMustExist: false });
  db.pragma("foreign_keys = ON");
  return db;
}

function listStepRecords(
  db: AutonomyRunnerLedgerDb,
  runId: string,
): AutonomyRunStepRecord[] {
  const rows = db
    .prepare(
      `SELECT * FROM autonomy_run_steps
       WHERE run_id = ?
       ORDER BY step_index ASC, step_id ASC`,
    )
    .all(runId) as StepRow[];
  return rows.map(parseStep);
}

function listEventRecords(
  db: AutonomyRunnerLedgerDb,
  runId: string,
): AutonomyRunEventRecord[] {
  const rows = db
    .prepare(
      `SELECT * FROM autonomy_run_events
       WHERE run_id = ?
       ORDER BY created_at ASC, event_id ASC`,
    )
    .all(runId) as EventRow[];
  return rows.map(parseEvent);
}

function listDeltaBatchRecords(
  db: AutonomyRunnerLedgerDb,
  runId: string,
): RecoveredAutonomyDeltaBatch[] {
  const rows = db
    .prepare(
      `SELECT * FROM autonomy_run_delta_batches
       WHERE run_id = ?
       ORDER BY created_at ASC, batch_id ASC`,
    )
    .all(runId) as DeltaBatchRow[];
  return rows.map(parseDeltaBatch);
}

function serializeRun(run: AutonomyRunSummary): RunRow {
  return {
    run_id: run.run_id,
    scope: run.scope,
    autonomy_contract_ref: run.autonomy_contract_ref,
    title: run.title,
    status: run.status,
    scheduled_for: run.scheduled_for,
    started_at: run.started_at,
    finished_at: run.finished_at,
    created_at: run.created_at,
    updated_at: run.updated_at,
    stop_reason: run.stop_reason,
    source_refs_json: serializeJson(run.source_refs),
    authority_boundary_json: serializeJson(run.authority_boundary),
    budget_snapshot_json: serializeJson(run.budget_snapshot),
    metadata_json: serializeJson(run.metadata),
  };
}

function parseRun(row: RunRow): AutonomyRunSummary {
  return {
    run_id: row.run_id,
    scope: row.scope,
    autonomy_contract_ref: row.autonomy_contract_ref,
    title: row.title,
    status: row.status as AutonomyRunnerStatus,
    scheduled_for: row.scheduled_for,
    started_at: row.started_at,
    finished_at: row.finished_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    stop_reason: row.stop_reason,
    source_refs: {
      ...buildDefaultRunnerSourceRefs(),
      ...parseJson(row.source_refs_json, {}),
    },
    authority_boundary: {
      ...buildDefaultRunnerAuthorityBoundary(),
      ...parseJson(row.authority_boundary_json, {}),
    },
    budget_snapshot: {
      ...buildDefaultRunnerBudgetSnapshot(),
      ...parseJson(row.budget_snapshot_json, {}),
    },
    metadata: parseJson(row.metadata_json, {}),
  };
}

function serializeStep(step: AutonomyRunStepRecord): StepRow {
  return {
    step_id: step.step_id,
    run_id: step.run_id,
    step_index: step.step_index,
    action_kind: step.action_kind,
    status: step.status,
    title: step.title,
    summary: step.summary,
    started_at: step.started_at,
    finished_at: step.finished_at,
    output_json: serializeJson(step.output),
    error_message: step.error_message,
    created_at: step.created_at,
    updated_at: step.updated_at,
  };
}

function parseStep(row: StepRow): AutonomyRunStepRecord {
  return {
    step_id: row.step_id,
    run_id: row.run_id,
    step_index: row.step_index,
    action_kind: row.action_kind as AutonomyRunStepRecord["action_kind"],
    status: row.status as AutonomyRunStepRecord["status"],
    title: row.title,
    summary: row.summary,
    started_at: row.started_at,
    finished_at: row.finished_at,
    output: parseJson(row.output_json, {}),
    error_message: row.error_message,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function serializeEvent(event: AutonomyRunEventRecord): EventRow {
  return {
    event_id: event.event_id,
    run_id: event.run_id,
    step_id: event.step_id,
    event_type: event.event_type,
    status: event.status,
    message: event.message,
    payload_json: serializeJson(event.payload),
    created_at: event.created_at,
  };
}

function parseEvent(row: EventRow): AutonomyRunEventRecord {
  return {
    event_id: row.event_id,
    run_id: row.run_id,
    step_id: row.step_id,
    event_type: row.event_type as AutonomyRunEventRecord["event_type"],
    status: row.status as AutonomyRunEventRecord["status"],
    message: row.message,
    payload: parseJson(row.payload_json, {}),
    created_at: row.created_at,
  };
}

function serializeDeltaBatch(
  batch: RecoveredAutonomyDeltaBatch,
): DeltaBatchRow {
  return {
    batch_id: batch.batch_id,
    run_id: batch.run_id,
    batch_version: batch.batch_version,
    status: batch.status,
    title: batch.title,
    summary: batch.summary,
    created_at: batch.created_at,
    delta_count: batch.delta_count,
    deltas_json: serializeJson(batch.deltas),
    source_refs_json: serializeJson(batch.source_refs),
    validation_json: serializeJson(batch.validation),
    authority_boundary_json: serializeJson(batch.authority_boundary),
  };
}

function parseDeltaBatch(row: DeltaBatchRow): RecoveredAutonomyDeltaBatch {
  return {
    batch_id: row.batch_id,
    run_id: row.run_id,
    batch_version: AUTONOMY_RUNNER_DELTA_BATCH_VERSION,
    status: row.status as RecoveredAutonomyDeltaBatch["status"],
    title: row.title,
    summary: row.summary,
    created_at: row.created_at,
    delta_count: row.delta_count,
    deltas: parseJson(row.deltas_json, []),
    source_refs: {
      ...buildDefaultRunnerSourceRefs(),
      ...parseJson(row.source_refs_json, {}),
    },
    validation: parseJson(row.validation_json, {
      validation_status: "needs_review",
      completed_checks: [],
      skipped_checks: [],
      notes: [],
    }),
    authority_boundary: {
      ...buildDefaultRunnerAuthorityBoundary(),
      ...parseJson(row.authority_boundary_json, {}),
    },
  };
}

function serializeJson(value: unknown): string {
  return JSON.stringify(value ?? {});
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
