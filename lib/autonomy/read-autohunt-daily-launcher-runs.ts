import { openDatabase } from "@/lib/db";
import type { AutonomyDelegationGrantDbLike } from "@/lib/autonomy/read-autonomy-delegation-grants";
import {
  allValuesFalse,
  fingerprint,
} from "@/lib/research-candidate-review/shared-source-chain-guards";
import {
  AUTOHUNT_DAILY_LAUNCHER_RUN_KIND,
  AUTOHUNT_DAILY_LAUNCHER_RUN_READBACK_KIND,
  AUTOHUNT_DAILY_LAUNCHER_RUN_READBACK_VERSION,
  AUTOHUNT_DAILY_LAUNCHER_RUN_TABLE,
  AUTOHUNT_DAILY_LAUNCHER_RUN_VERSION,
  type AutohuntDailyLauncherRun,
  type AutohuntDailyLauncherRunAuthorityBoundary,
  type AutohuntDailyLauncherRunReadback,
  type AutohuntDailyLauncherRunRowCountWriteSummary,
  type AutohuntDailyLauncherRunScope,
  type AutohuntDailyLauncherRunSelectedSummary,
  type AutohuntDailyLauncherRunSelectionStatus,
  type AutohuntDailyLauncherRunStatus,
} from "@/types/autohunt-daily-launcher-run";

export interface ReadAutohuntDailyLauncherRunsOptions {
  db?: AutonomyDelegationGrantDbLike;
  scope?: AutohuntDailyLauncherRunScope;
  source_execution_contract_id?: string | null;
  launcher_run_status?: AutohuntDailyLauncherRunStatus | null;
  launcher_run_id?: string | null;
  limit?: number;
}

type AutohuntDailyLauncherRunRow = {
  launcher_run_id: string;
  created_at: string;
  scope: AutohuntDailyLauncherRunScope;
  launcher_run_status: AutohuntDailyLauncherRunStatus;
  source_execution_contract_id: string;
  source_execution_contract_fingerprint: string;
  source_execution_contract_status: string;
  launch_mode: string;
  active_grant_id: string;
  active_grant_fingerprint: string;
  ready_preflight_packet_id: string;
  ready_preflight_packet_fingerprint: string;
  operator_decision_id: string;
  operator_decision_fingerprint: string;
  copy_export_preview_fingerprint: string;
  confirmation_ref: string;
  confirmed_by: string | null;
  confirmed_at: string | null;
  confirmation_fingerprint: string;
  handoff_packet_id: string;
  handoff_packet_fingerprint: string;
  idempotency_key: string;
  handoff_packet_json: string;
  launcher_run_boundary_json: string;
  structured_result_report_fixture_json: string | null;
  linked_result_intake_json: string | null;
  authority_boundary_json: string;
  persisted_material_boundary_json: string;
  validation_json: string;
  row_count_write_summary_json: string;
  launcher_run_fingerprint: string;
};

const DEFAULT_SCOPE: AutohuntDailyLauncherRunScope = "project:augnes";

export function ensureAutohuntDailyLauncherRunSchema(
  db: AutonomyDelegationGrantDbLike,
) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS autohunt_daily_launcher_runs (
      launcher_run_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      launcher_run_status TEXT NOT NULL,
      source_execution_contract_id TEXT NOT NULL,
      source_execution_contract_fingerprint TEXT NOT NULL,
      source_execution_contract_status TEXT NOT NULL,
      launch_mode TEXT NOT NULL,
      active_grant_id TEXT NOT NULL,
      active_grant_fingerprint TEXT NOT NULL,
      ready_preflight_packet_id TEXT NOT NULL,
      ready_preflight_packet_fingerprint TEXT NOT NULL,
      operator_decision_id TEXT NOT NULL,
      operator_decision_fingerprint TEXT NOT NULL,
      copy_export_preview_fingerprint TEXT NOT NULL,
      confirmation_ref TEXT NOT NULL,
      confirmed_by TEXT,
      confirmed_at TEXT,
      confirmation_fingerprint TEXT NOT NULL,
      handoff_packet_id TEXT NOT NULL,
      handoff_packet_fingerprint TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      handoff_packet_json TEXT NOT NULL,
      launcher_run_boundary_json TEXT NOT NULL,
      structured_result_report_fixture_json TEXT,
      linked_result_intake_json TEXT,
      authority_boundary_json TEXT NOT NULL,
      persisted_material_boundary_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      row_count_write_summary_json TEXT NOT NULL,
      launcher_run_fingerprint TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_autohunt_daily_launcher_runs_scope_created
      ON autohunt_daily_launcher_runs(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_daily_launcher_runs_source_execution_contract_id_created
      ON autohunt_daily_launcher_runs(source_execution_contract_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_daily_launcher_runs_source_execution_contract_fingerprint_created
      ON autohunt_daily_launcher_runs(source_execution_contract_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_daily_launcher_runs_launcher_run_status_created
      ON autohunt_daily_launcher_runs(launcher_run_status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_daily_launcher_runs_handoff_packet_fingerprint_created
      ON autohunt_daily_launcher_runs(handoff_packet_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_daily_launcher_runs_confirmation_fingerprint_created
      ON autohunt_daily_launcher_runs(confirmation_fingerprint, created_at DESC);
  `);
}

export function readAutohuntDailyLauncherRuns({
  db: providedDb,
  scope = DEFAULT_SCOPE,
  source_execution_contract_id = null,
  launcher_run_status = null,
  launcher_run_id = null,
  limit = 50,
}: ReadAutohuntDailyLauncherRunsOptions = {}): AutohuntDailyLauncherRunReadback {
  const db = providedDb ?? openDatabase();
  const shouldClose = !providedDb && hasClose(db);

  try {
    ensureAutohuntDailyLauncherRunSchema(db);
    const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
    const rows = readRows(db, {
      scope,
      source_execution_contract_id,
      launcher_run_status,
      launcher_run_id,
      limit: safeLimit,
    });
    const allRows = readRows(db, {
      scope,
      source_execution_contract_id,
      launcher_run_status: null,
      launcher_run_id: null,
      limit: safeLimit,
    });
    const { records, invalidRecordCount } = parseValidRecords(rows);
    const { records: allRecords, invalidRecordCount: allInvalidRecordCount } =
      parseValidRecords(allRows);
    const latestLauncherRun = allRecords.find((record) =>
      [
        "result_intake_recorded",
        "result_fixture_recorded",
        "handoff_packet_prepared",
      ].includes(record.launcher_run_status),
    ) ?? null;
    const selectedRun = selectLauncherRun({
      records,
      latestLauncherRun,
      launcher_run_id,
    });

    return createReadback({
      scope,
      source_execution_contract_id,
      launcher_run_status,
      launcher_run_id,
      selection_status: getSelectionStatus({
        selectedRun,
        launcher_run_id,
        allRecords,
      }),
      selected_launcher_run: selectedRun,
      latest_launcher_run: latestLauncherRun,
      launcher_runs: records,
      all_launcher_runs: allRecords,
      invalid_record_count: Math.max(
        invalidRecordCount,
        allInvalidRecordCount,
      ),
    });
  } finally {
    if (shouldClose) {
      db.close();
    }
  }
}

export function computeAutohuntDailyLauncherRunFingerprint(
  launcherRun: Omit<AutohuntDailyLauncherRun, "launcher_run_fingerprint"> & {
    launcher_run_fingerprint?: string;
  },
) {
  const {
    launcher_run_fingerprint: _launcherRunFingerprint,
    ...fingerprintSource
  } = launcherRun;
  return fingerprint(fingerprintSource);
}

export function parseAutohuntDailyLauncherRunRow(
  row: AutohuntDailyLauncherRunRow,
): AutohuntDailyLauncherRun | null {
  try {
    return {
      launcher_run_kind: AUTOHUNT_DAILY_LAUNCHER_RUN_KIND,
      launcher_run_version: AUTOHUNT_DAILY_LAUNCHER_RUN_VERSION,
      launcher_run_id: row.launcher_run_id,
      scope: row.scope,
      created_at: row.created_at,
      launcher_run_status: row.launcher_run_status,
      source_execution_contract: {
        contract_id: row.source_execution_contract_id,
        contract_fingerprint: row.source_execution_contract_fingerprint,
        contract_status: row.source_execution_contract_status as never,
        launch_mode: row.launch_mode as never,
        active_grant_id: row.active_grant_id,
        active_grant_fingerprint: row.active_grant_fingerprint,
        ready_preflight_packet_id: row.ready_preflight_packet_id,
        ready_preflight_packet_fingerprint:
          row.ready_preflight_packet_fingerprint,
        operator_decision_id: row.operator_decision_id,
        operator_decision_fingerprint: row.operator_decision_fingerprint,
        copy_export_preview_fingerprint: row.copy_export_preview_fingerprint,
      },
      daily_confirmation: {
        confirmation_ref: row.confirmation_ref,
        confirmed_by: row.confirmed_by,
        confirmed_at: row.confirmed_at,
        confirmation_fingerprint: row.confirmation_fingerprint,
        raw_confirmation_text_persisted: false,
      },
      handoff_packet: parseJson(row.handoff_packet_json),
      launcher_run_boundary: parseJson(row.launcher_run_boundary_json),
      structured_result_report_fixture:
        row.structured_result_report_fixture_json
          ? parseJson(row.structured_result_report_fixture_json)
          : null,
      linked_result_intake: row.linked_result_intake_json
        ? parseJson(row.linked_result_intake_json)
        : null,
      authority_boundary: parseJson(row.authority_boundary_json),
      persisted_material_boundary: parseJson(
        row.persisted_material_boundary_json,
      ),
      validation: parseJson(row.validation_json),
      row_count_write_summary: parseJson(
        row.row_count_write_summary_json,
      ) as AutohuntDailyLauncherRunRowCountWriteSummary,
      idempotency_key: row.idempotency_key,
      launcher_run_fingerprint: row.launcher_run_fingerprint,
    };
  } catch {
    return null;
  }
}

export function buildAutohuntDailyLauncherRunAuthorityBoundary(): AutohuntDailyLauncherRunAuthorityBoundary {
  return {
    can_start_daemon: false,
    can_schedule_runner: false,
    can_execute_codex: false,
    can_call_github: false,
    can_create_branch_or_pr: false,
    can_merge: false,
    can_deploy: false,
    can_publish_external: false,
    can_call_provider_or_openai: false,
    can_fetch_sources: false,
    can_run_retrieval: false,
    can_write_memory: false,
    can_promote_perspective: false,
    can_mutate_cwp: false,
    can_mutate_work: false,
    can_write_proof_or_evidence: false,
    can_auto_apply_delta: false,
  };
}

function readRows(
  db: AutonomyDelegationGrantDbLike,
  {
    scope,
    source_execution_contract_id,
    launcher_run_status,
    launcher_run_id,
    limit,
  }: {
    scope: AutohuntDailyLauncherRunScope;
    source_execution_contract_id: string | null;
    launcher_run_status: AutohuntDailyLauncherRunStatus | null;
    launcher_run_id: string | null;
    limit: number;
  },
) {
  if (launcher_run_id) {
    return db
      .prepare(
        `
          SELECT *
          FROM ${AUTOHUNT_DAILY_LAUNCHER_RUN_TABLE}
          WHERE scope = ?
            AND launcher_run_id = ?
          ORDER BY created_at DESC, launcher_run_id DESC
          LIMIT 1
        `,
      )
      .all(scope, launcher_run_id) as AutohuntDailyLauncherRunRow[];
  }

  const conditions = ["scope = ?"];
  const params: unknown[] = [scope];
  if (source_execution_contract_id) {
    conditions.push("source_execution_contract_id = ?");
    params.push(source_execution_contract_id);
  }
  if (launcher_run_status) {
    conditions.push("launcher_run_status = ?");
    params.push(launcher_run_status);
  }
  params.push(limit);

  return db
    .prepare(
      `
        SELECT *
        FROM ${AUTOHUNT_DAILY_LAUNCHER_RUN_TABLE}
        WHERE ${conditions.join(" AND ")}
        ORDER BY created_at DESC, launcher_run_id DESC
        LIMIT ?
      `,
    )
    .all(...params) as AutohuntDailyLauncherRunRow[];
}

function parseValidRecords(rows: AutohuntDailyLauncherRunRow[]) {
  const records: AutohuntDailyLauncherRun[] = [];
  let invalidRecordCount = 0;

  for (const row of rows) {
    const record = parseAutohuntDailyLauncherRunRow(row);
    if (
      record &&
      record.launcher_run_fingerprint ===
        computeAutohuntDailyLauncherRunFingerprint(record)
    ) {
      records.push(record);
    } else {
      invalidRecordCount += 1;
    }
  }

  return { records, invalidRecordCount };
}

function selectLauncherRun({
  records,
  latestLauncherRun,
  launcher_run_id,
}: {
  records: AutohuntDailyLauncherRun[];
  latestLauncherRun: AutohuntDailyLauncherRun | null;
  launcher_run_id: string | null;
}) {
  if (launcher_run_id) return records[0] ?? null;
  return records[0] ?? latestLauncherRun;
}

function getSelectionStatus({
  selectedRun,
  launcher_run_id,
  allRecords,
}: {
  selectedRun: AutohuntDailyLauncherRun | null;
  launcher_run_id: string | null;
  allRecords: AutohuntDailyLauncherRun[];
}): AutohuntDailyLauncherRunSelectionStatus {
  if (launcher_run_id) {
    return selectedRun
      ? "selected_by_launcher_run_id"
      : "launcher_run_id_not_found";
  }
  return allRecords.length > 0
    ? "selected_latest_launcher_run"
    : "no_launcher_runs";
}

function createReadback({
  scope,
  source_execution_contract_id,
  launcher_run_status,
  launcher_run_id,
  selection_status,
  selected_launcher_run,
  latest_launcher_run,
  launcher_runs,
  all_launcher_runs,
  invalid_record_count,
}: {
  scope: AutohuntDailyLauncherRunScope;
  source_execution_contract_id: string | null;
  launcher_run_status: AutohuntDailyLauncherRunStatus | null;
  launcher_run_id: string | null;
  selection_status: AutohuntDailyLauncherRunSelectionStatus;
  selected_launcher_run: AutohuntDailyLauncherRun | null;
  latest_launcher_run: AutohuntDailyLauncherRun | null;
  launcher_runs: AutohuntDailyLauncherRun[];
  all_launcher_runs: AutohuntDailyLauncherRun[];
  invalid_record_count: number;
}): AutohuntDailyLauncherRunReadback {
  const selectedSummary = selected_launcher_run
    ? createSelectedSummary(selected_launcher_run)
    : null;
  return {
    readback_kind: AUTOHUNT_DAILY_LAUNCHER_RUN_READBACK_KIND,
    readback_version: AUTOHUNT_DAILY_LAUNCHER_RUN_READBACK_VERSION,
    scope,
    source_execution_contract_id_filter: source_execution_contract_id,
    launcher_run_status_filter: launcher_run_status,
    launcher_run_id_filter: launcher_run_id,
    selection_status,
    selected_launcher_run,
    selected_launcher_run_summary: selectedSummary,
    latest_launcher_run,
    launcher_runs,
    all_launcher_runs,
    invalid_record_count,
    linked_result_intake_summary:
      selected_launcher_run?.linked_result_intake ?? null,
    no_external_no_execution_boundary:
      buildAutohuntDailyLauncherRunAuthorityBoundary(),
    raw_material_persisted: false,
    codex_executed: false,
    github_called: false,
    provider_openai_called: false,
    sources_fetched: false,
    retrieval_run: false,
    branch_or_pr_created: false,
  };
}

function createSelectedSummary(
  launcherRun: AutohuntDailyLauncherRun,
): AutohuntDailyLauncherRunSelectedSummary {
  return {
    launcher_run_id: launcherRun.launcher_run_id,
    launcher_run_status: launcherRun.launcher_run_status,
    source_execution_contract_id:
      launcherRun.source_execution_contract.contract_id,
    handoff_packet_id: launcherRun.handoff_packet.handoff_packet_id,
    handoff_packet_fingerprint:
      launcherRun.handoff_packet.handoff_packet_fingerprint,
    linked_result_intake_id:
      launcherRun.linked_result_intake?.result_intake_id ?? null,
    codex_executed: false,
    github_called: false,
    branch_or_pr_created: false,
    authority_boundary_all_false: allValuesFalse(
      launcherRun.authority_boundary,
    ),
  };
}

function parseJson(value: string) {
  return JSON.parse(value);
}

function hasClose(
  db: AutonomyDelegationGrantDbLike,
): db is AutonomyDelegationGrantDbLike & { close: () => void } {
  return typeof (db as { close?: unknown }).close === "function";
}
