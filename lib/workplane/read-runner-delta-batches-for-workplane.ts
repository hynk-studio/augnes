import Database from "better-sqlite3";
import { existsSync } from "node:fs";

import { getDatabasePath } from "@/lib/db";
import {
  autonomyRunnerLedgerSchemaExistsV01,
  type AutonomyRunnerLedgerDb,
} from "@/lib/autonomy/runner-ledger";
import { getAutonomyRun, listAutonomyRuns } from "@/lib/autonomy/runner";
import type {
  AutonomyRunRecord,
  AutonomyRunnerAuthorityBoundary,
  AutonomyRunnerSourceRefs,
  RecoveredAutonomyDeltaBatch,
} from "@/types/autonomy-runner-execution";
import type { AugnesDelta } from "@/types/augnes-delta";

export type WorkplaneRunnerDeltaBatchStatus = "ready" | "empty" | "fallback";

export type WorkplaneRunnerDeltaBatchSourceStatus =
  | "runner_ledger"
  | "empty"
  | "fallback";

export type WorkplaneRunnerDeltaBatchAuthorityBoundary = {
  surface: "agent_workplane_runner_delta_batch_read";
  read_only_operator_view: true;
  can_write_runner_ledger: false;
  can_recover_delta_batch: false;
  can_execute_runner: false;
  can_create_run: false;
  can_tick_run: false;
  can_pause_resume_cancel_run: false;
  can_schedule_run: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_execute_codex: false;
  can_write_db_from_workplane_read: false;
  can_write_proof_evidence: false;
  can_apply_durable_memory: false;
  can_apply_perspective: false;
  can_auto_apply_delta: false;
  notes: string[];
};

export type WorkplaneRunnerDeltaBatchSummary = {
  run_id: string;
  run_title: string;
  run_status: string;
  batch_id: string;
  batch_status: RecoveredAutonomyDeltaBatch["status"];
  title: string;
  summary: string;
  created_at: string;
  delta_count: number;
  validation_status:
    RecoveredAutonomyDeltaBatch["validation"]["validation_status"];
  source_refs: string[];
  source_ref_count: number;
  related_step_ids: string[];
  related_event_ids: string[];
  related_delta_ids: string[];
  authority_boundary: WorkplaneRunnerDeltaBatchAuthorityBoundary;
  runner_authority_boundary_notes: string[];
};

export type WorkplaneRunnerDeltaBatchRead = {
  status: WorkplaneRunnerDeltaBatchStatus;
  scope: string;
  limit: number;
  as_of: string | null;
  recovered_batch_count: number;
  recovered_delta_count: number;
  latest_batch_id: string | null;
  latest_run_id: string | null;
  latest_validation_status:
    | RecoveredAutonomyDeltaBatch["validation"]["validation_status"]
    | null;
  batches: WorkplaneRunnerDeltaBatchSummary[];
  empty_state: string;
  source_status: WorkplaneRunnerDeltaBatchSourceStatus;
  fallback_reason: string | null;
  staleness: {
    status: "fresh" | "empty" | "fallback" | "unknown";
    as_of: string | null;
    updated_at: string | null;
    notes: string[];
  };
  fallback_status: {
    status: "runtime" | "empty_fallback" | "fallback";
    reason: string | null;
    source_status: WorkplaneRunnerDeltaBatchSourceStatus;
    notes: string[];
  };
  authority_boundary: WorkplaneRunnerDeltaBatchAuthorityBoundary;
  validation_summary: {
    status: "partial";
    smoke_refs: string[];
    notes: string[];
  };
  debug_notes: string[];
};

export type ReadRunnerDeltaBatchesForWorkplaneOptions = {
  dbPath?: string;
  scope?: string;
  limit?: number;
};

type ReadSourceResult = {
  source_status: WorkplaneRunnerDeltaBatchSourceStatus;
  fallback_reason: string | null;
  batches: WorkplaneRunnerDeltaBatchSummary[];
};

type DeltaBatchRow = {
  batch_id: string;
  run_id: string;
  batch_status: string;
  batch_title: string;
  batch_summary: string;
  batch_created_at: string;
  delta_count: number;
  deltas_json: string;
  source_refs_json: string;
  validation_json: string;
  authority_boundary_json: string;
  run_scope: string;
  run_title: string;
  run_status: string;
};

const DEFAULT_WORKPLANE_RUNNER_SCOPE = "project:augnes";
const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 25;

export const WORKPLANE_RUNNER_DELTABATCH_AUTHORITY_BOUNDARY: WorkplaneRunnerDeltaBatchAuthorityBoundary =
  {
    surface: "agent_workplane_runner_delta_batch_read",
    read_only_operator_view: true,
    can_write_runner_ledger: false,
    can_recover_delta_batch: false,
    can_execute_runner: false,
    can_create_run: false,
    can_tick_run: false,
    can_pause_resume_cancel_run: false,
    can_schedule_run: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_write_db_from_workplane_read: false,
    can_write_proof_evidence: false,
    can_apply_durable_memory: false,
    can_apply_perspective: false,
    can_auto_apply_delta: false,
    notes: [
      "Agent Workplane reads recovered runner DeltaBatches as review-only context.",
      "Workplane reads do not recover DeltaBatches, tick runs, schedule runs, write the runner ledger, write proof/evidence, call providers, call GitHub, execute Codex, apply durable memory, apply Perspective, or auto-apply deltas.",
      "Recovered runner DeltaBatches are separate from projected Delta Projection batches.",
    ],
  };

export function readRunnerDeltaBatchesForWorkplane(
  options: ReadRunnerDeltaBatchesForWorkplaneOptions = {},
): WorkplaneRunnerDeltaBatchRead {
  const scope = options.scope ?? DEFAULT_WORKPLANE_RUNNER_SCOPE;
  const limit = normalizeLimit(options.limit);

  try {
    const result = options.dbPath
      ? readWithExistingLedgerHelpers({
          dbPath: options.dbPath,
          scope,
          limit,
        })
      : readDefaultLedgerReadonly({ scope, limit });

    return buildRunnerDeltaBatchRead({
      scope,
      limit,
      batches: result.batches,
      source_status: result.source_status,
      fallback_reason: result.fallback_reason,
    });
  } catch (error) {
    return buildRunnerDeltaBatchRead({
      scope,
      limit,
      batches: [],
      source_status: "fallback",
      fallback_reason:
        error instanceof Error
          ? `runner_delta_batch_read_failed:${error.message}`
          : "runner_delta_batch_read_failed",
    });
  }
}

function readWithExistingLedgerHelpers({
  dbPath,
  scope,
  limit,
}: {
  dbPath: string;
  scope: string;
  limit: number;
}): ReadSourceResult {
  const runs = listAutonomyRuns({
    dbPath,
    scope,
    limit: Math.max(limit * 4, 100),
  });
  const batches = runs.flatMap((runSummary) => {
    const run = getAutonomyRun(runSummary.run_id, { dbPath });
    if (!run) return [];
    return run.delta_batches.map((batch) => buildBatchSummary(batch, run));
  });

  return {
    source_status: batches.length > 0 ? "runner_ledger" : "empty",
    fallback_reason: null,
    batches: sortLatestBatches(batches).slice(0, limit),
  };
}

function readDefaultLedgerReadonly({
  scope,
  limit,
}: {
  scope: string;
  limit: number;
}): ReadSourceResult {
  const dbPath = getDatabasePath();

  if (!existsSync(dbPath)) {
    return {
      source_status: "empty",
      fallback_reason: `runner ledger database not found at ${dbPath}; Workplane returned an explicit empty state.`,
      batches: [],
    };
  }

  const db = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    db.pragma("query_only = ON");
    if (!autonomyRunnerLedgerSchemaExistsV01(db)) {
      return {
        source_status: "empty",
        fallback_reason:
          "runner ledger schema is absent; Workplane returned an explicit empty state.",
        batches: [],
      };
    }

    const rows = db
      .prepare(
        `SELECT
          batch.batch_id,
          batch.run_id,
          batch.status AS batch_status,
          batch.title AS batch_title,
          batch.summary AS batch_summary,
          batch.created_at AS batch_created_at,
          batch.delta_count,
          batch.deltas_json,
          batch.source_refs_json,
          batch.validation_json,
          batch.authority_boundary_json,
          run.scope AS run_scope,
          run.title AS run_title,
          run.status AS run_status
        FROM autonomy_run_delta_batches batch
        INNER JOIN autonomy_runs run ON run.run_id = batch.run_id
        WHERE run.scope = ?
        ORDER BY batch.created_at DESC, batch.batch_id ASC
        LIMIT ?`,
      )
      .all(scope, limit) as DeltaBatchRow[];

    const batches = rows.map((row) => buildBatchSummaryFromRow(db, row));
    return {
      source_status: batches.length > 0 ? "runner_ledger" : "empty",
      fallback_reason: null,
      batches,
    };
  } finally {
    db.close();
  }
}

function buildRunnerDeltaBatchRead({
  scope,
  limit,
  batches,
  source_status,
  fallback_reason,
}: {
  scope: string;
  limit: number;
  batches: WorkplaneRunnerDeltaBatchSummary[];
  source_status: WorkplaneRunnerDeltaBatchSourceStatus;
  fallback_reason: string | null;
}): WorkplaneRunnerDeltaBatchRead {
  const latest = batches[0] ?? null;
  const recoveredDeltaCount = batches.reduce(
    (count, batch) => count + batch.delta_count,
    0,
  );
  const status: WorkplaneRunnerDeltaBatchStatus =
    source_status === "fallback"
      ? "fallback"
      : batches.length > 0
        ? "ready"
        : "empty";

  return {
    status,
    scope,
    limit,
    as_of: latest?.created_at ?? null,
    recovered_batch_count: batches.length,
    recovered_delta_count: recoveredDeltaCount,
    latest_batch_id: latest?.batch_id ?? null,
    latest_run_id: latest?.run_id ?? null,
    latest_validation_status: latest?.validation_status ?? null,
    batches,
    empty_state:
      "No recovered runner DeltaBatch is available for this Workplane read context.",
    source_status,
    fallback_reason,
    staleness: {
      status:
        source_status === "fallback"
          ? "fallback"
          : batches.length > 0
            ? "fresh"
            : "empty",
      as_of: latest?.created_at ?? null,
      updated_at: latest?.created_at ?? null,
      notes: [
        batches.length > 0
          ? `Latest recovered runner DeltaBatch read from ledger at ${latest?.created_at}.`
          : "No recovered runner DeltaBatch timestamp is available.",
        "Recovered runner DeltaBatches are local ledger readback candidates, not live runner execution state.",
      ],
    },
    fallback_status: {
      status:
        source_status === "runner_ledger"
          ? "runtime"
          : source_status === "empty"
            ? "empty_fallback"
            : "fallback",
      reason: fallback_reason,
      source_status,
      notes: [
        "Empty or fallback runner DeltaBatch state is explicit and must not be presented as applied or approved output.",
      ],
    },
    authority_boundary: WORKPLANE_RUNNER_DELTABATCH_AUTHORITY_BOUNDARY,
    validation_summary: {
      status: "partial",
      smoke_refs: ["smoke:workplane-runner-deltabatch-integration-v0-1"],
      notes: [
        "Smoke coverage creates a temp runner ledger fixture, recovers a DeltaBatch through existing runner APIs, and verifies the Workplane reader can read it back.",
        "Normal Workplane reads remain read-only and do not call runner recovery, runner ticks, scheduler behavior, providers, GitHub, Codex, durable memory apply, Perspective apply, proof/evidence writes, or delta auto-apply.",
      ],
    },
    debug_notes: [
      "Recovered runner DeltaBatches are review candidates, not approvals or applies.",
      "Projected Delta Projection batches remain separate from recovered runner DeltaBatches.",
      "The default app ledger path is opened read-only and falls back to an explicit empty state when the ledger or schema is absent.",
    ],
  };
}

function buildBatchSummary(
  batch: RecoveredAutonomyDeltaBatch,
  run: AutonomyRunRecord,
): WorkplaneRunnerDeltaBatchSummary {
  const sourceRefs = collectBatchSourceRefs(batch);
  const relatedStepIds = uniqueStrings([
    ...run.steps.map((step) => step.step_id),
    ...extractPrefixedIds(sourceRefs, "autonomy_run_step:"),
  ]);
  const relatedEventIds = uniqueStrings([
    ...run.events.map((event) => event.event_id),
    ...extractPrefixedIds(sourceRefs, "autonomy_run_event:"),
  ]);
  const relatedDeltaIds = uniqueStrings(
    batch.deltas.map((delta) => delta.delta_id),
  );

  return {
    run_id: batch.run_id,
    run_title: run.title,
    run_status: run.status,
    batch_id: batch.batch_id,
    batch_status: batch.status,
    title: batch.title,
    summary: batch.summary,
    created_at: batch.created_at,
    delta_count: batch.delta_count,
    validation_status: batch.validation.validation_status,
    source_refs: uniqueStrings([
      `autonomy_run:${batch.run_id}`,
      `autonomy_run_delta_batch:${batch.batch_id}`,
      ...sourceRefs,
      ...relatedDeltaIds.map((deltaId) => `delta:${deltaId}`),
    ]),
    source_ref_count: sourceRefs.length,
    related_step_ids: relatedStepIds,
    related_event_ids: relatedEventIds,
    related_delta_ids: relatedDeltaIds,
    authority_boundary: WORKPLANE_RUNNER_DELTABATCH_AUTHORITY_BOUNDARY,
    runner_authority_boundary_notes: batch.authority_boundary.notes,
  };
}

function buildBatchSummaryFromRow(
  db: AutonomyRunnerLedgerDb,
  row: DeltaBatchRow,
): WorkplaneRunnerDeltaBatchSummary {
  const deltas = parseJson<AugnesDelta[]>(row.deltas_json, []);
  const sourceRefs = flattenSourceRefs(
    parseJson<Partial<AutonomyRunnerSourceRefs>>(row.source_refs_json, {}),
  );
  const validation = parseJson<RecoveredAutonomyDeltaBatch["validation"]>(
    row.validation_json,
    {
      validation_status: "needs_review",
      completed_checks: [],
      skipped_checks: [],
      notes: [],
    },
  );
  const runnerAuthority = parseJson<Partial<AutonomyRunnerAuthorityBoundary>>(
    row.authority_boundary_json,
    {},
  );
  const relatedStepIds = uniqueStrings([
    ...readStepIds(db, row.run_id),
    ...extractPrefixedIds(sourceRefs, "autonomy_run_step:"),
  ]);
  const relatedEventIds = uniqueStrings([
    ...readEventIds(db, row.run_id),
    ...extractPrefixedIds(sourceRefs, "autonomy_run_event:"),
  ]);
  const relatedDeltaIds = uniqueStrings(deltas.map((delta) => delta.delta_id));

  return {
    run_id: row.run_id,
    run_title: row.run_title,
    run_status: row.run_status,
    batch_id: row.batch_id,
    batch_status: row.batch_status as RecoveredAutonomyDeltaBatch["status"],
    title: row.batch_title,
    summary: row.batch_summary,
    created_at: row.batch_created_at,
    delta_count: row.delta_count,
    validation_status: validation.validation_status,
    source_refs: uniqueStrings([
      `autonomy_run:${row.run_id}`,
      `autonomy_run_delta_batch:${row.batch_id}`,
      ...sourceRefs,
      ...relatedDeltaIds.map((deltaId) => `delta:${deltaId}`),
    ]),
    source_ref_count: sourceRefs.length,
    related_step_ids: relatedStepIds,
    related_event_ids: relatedEventIds,
    related_delta_ids: relatedDeltaIds,
    authority_boundary: WORKPLANE_RUNNER_DELTABATCH_AUTHORITY_BOUNDARY,
    runner_authority_boundary_notes: runnerAuthority.notes ?? [],
  };
}

function collectBatchSourceRefs(batch: RecoveredAutonomyDeltaBatch) {
  return flattenSourceRefs(batch.source_refs);
}

function flattenSourceRefs(sourceRefs: Partial<AutonomyRunnerSourceRefs>) {
  const entries: string[] = [];
  for (const [key, value] of Object.entries(sourceRefs)) {
    if (!Array.isArray(value)) continue;
    const label = key.replace(/_refs$/, "");
    for (const ref of value) {
      if (typeof ref !== "string" || ref.length === 0) continue;
      entries.push(ref.includes(":") ? ref : `${label}:${ref}`);
    }
  }
  return uniqueStrings(entries);
}

function readStepIds(db: AutonomyRunnerLedgerDb, runId: string) {
  const rows = db
    .prepare(
      `SELECT step_id FROM autonomy_run_steps
       WHERE run_id = ?
       ORDER BY step_index ASC, step_id ASC`,
    )
    .all(runId) as { step_id: string }[];
  return rows.map((row) => row.step_id);
}

function readEventIds(db: AutonomyRunnerLedgerDb, runId: string) {
  const rows = db
    .prepare(
      `SELECT event_id FROM autonomy_run_events
       WHERE run_id = ?
       ORDER BY created_at ASC, event_id ASC`,
    )
    .all(runId) as { event_id: string }[];
  return rows.map((row) => row.event_id);
}

function sortLatestBatches(batches: WorkplaneRunnerDeltaBatchSummary[]) {
  return [...batches].sort((left, right) => {
    const leftCreatedAt = Date.parse(left.created_at);
    const rightCreatedAt = Date.parse(right.created_at);
    const createdDelta =
      Number.isFinite(rightCreatedAt) && Number.isFinite(leftCreatedAt)
        ? rightCreatedAt - leftCreatedAt
        : 0;
    if (createdDelta !== 0) return createdDelta;
    return left.batch_id.localeCompare(right.batch_id);
  });
}

function extractPrefixedIds(values: readonly string[], prefix: string) {
  return values
    .filter((value) => value.startsWith(prefix))
    .map((value) => value.slice(prefix.length));
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeLimit(limit: number | undefined) {
  if (typeof limit !== "number" || !Number.isFinite(limit)) {
    return DEFAULT_LIMIT;
  }
  return Math.max(1, Math.min(Math.trunc(limit), MAX_LIMIT));
}

function uniqueStrings(values: readonly string[]) {
  return [...new Set(values.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
}
