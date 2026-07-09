import { openDatabase } from "@/lib/db";
import type { AutonomyDelegationGrantDbLike } from "@/lib/autonomy/read-autonomy-delegation-grants";
import { buildAutohuntSupervisedExecutionContractAuthorityBoundary } from "@/lib/autonomy/read-autohunt-supervised-execution-contracts";
import {
  allValuesFalse,
  fingerprint,
} from "@/lib/research-candidate-review/shared-source-chain-guards";
import {
  AUTOHUNT_RESULT_INTAKE_KIND,
  AUTOHUNT_RESULT_INTAKE_READBACK_KIND,
  AUTOHUNT_RESULT_INTAKE_READBACK_VERSION,
  AUTOHUNT_RESULT_INTAKE_TABLE,
  AUTOHUNT_RESULT_INTAKE_VERSION,
  type AutohuntResultIntake,
  type AutohuntResultIntakeReadback,
  type AutohuntResultIntakeRowCountWriteSummary,
  type AutohuntResultIntakeScope,
  type AutohuntResultIntakeSelectedSummary,
  type AutohuntResultIntakeSelectionStatus,
  type AutohuntResultIntakeStatus,
} from "@/types/autohunt-result-intake";
import type { AutohuntSupervisedExecutionContractStatus } from "@/types/autohunt-supervised-execution-contract";

export interface ReadAutohuntResultIntakesOptions {
  db?: AutonomyDelegationGrantDbLike;
  scope?: AutohuntResultIntakeScope;
  source_execution_contract_id?: string | null;
  result_intake_status?: AutohuntResultIntakeStatus | null;
  result_intake_id?: string | null;
  limit?: number;
}

type AutohuntResultIntakeRow = {
  result_intake_id: string;
  created_at: string;
  scope: AutohuntResultIntakeScope;
  result_intake_status: AutohuntResultIntakeStatus;
  source_execution_contract_id: string;
  source_execution_contract_fingerprint: string;
  source_execution_contract_status: AutohuntSupervisedExecutionContractStatus;
  source_readiness_gate_fingerprint: string;
  active_grant_id: string;
  active_grant_fingerprint: string;
  ready_preflight_packet_id: string;
  ready_preflight_packet_fingerprint: string;
  operator_decision_id: string;
  operator_decision_fingerprint: string;
  copy_export_preview_fingerprint: string;
  result_report_id: string;
  result_report_fingerprint: string;
  result_status: string;
  idempotency_key: string;
  structured_result_report_json: string;
  expected_observed_delta_candidate_json: string;
  reuse_outcome_candidate_json: string;
  residual_diagnostic_candidate_json: string;
  learning_loop_summary_json: string;
  authority_boundary_json: string;
  persisted_material_boundary_json: string;
  validation_json: string;
  row_count_write_summary_json: string;
  result_intake_fingerprint: string;
};

const DEFAULT_SCOPE: AutohuntResultIntakeScope = "project:augnes";

export function ensureAutohuntResultIntakeSchema(
  db: AutonomyDelegationGrantDbLike,
) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS autohunt_result_intakes (
      result_intake_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      result_intake_status TEXT NOT NULL,
      source_execution_contract_id TEXT NOT NULL,
      source_execution_contract_fingerprint TEXT NOT NULL,
      source_execution_contract_status TEXT NOT NULL,
      source_readiness_gate_fingerprint TEXT NOT NULL,
      active_grant_id TEXT NOT NULL,
      active_grant_fingerprint TEXT NOT NULL,
      ready_preflight_packet_id TEXT NOT NULL,
      ready_preflight_packet_fingerprint TEXT NOT NULL,
      operator_decision_id TEXT NOT NULL,
      operator_decision_fingerprint TEXT NOT NULL,
      copy_export_preview_fingerprint TEXT NOT NULL,
      result_report_id TEXT NOT NULL,
      result_report_fingerprint TEXT NOT NULL,
      result_status TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      structured_result_report_json TEXT NOT NULL,
      expected_observed_delta_candidate_json TEXT NOT NULL,
      reuse_outcome_candidate_json TEXT NOT NULL,
      residual_diagnostic_candidate_json TEXT NOT NULL,
      learning_loop_summary_json TEXT NOT NULL,
      authority_boundary_json TEXT NOT NULL,
      persisted_material_boundary_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      row_count_write_summary_json TEXT NOT NULL,
      result_intake_fingerprint TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_autohunt_result_intakes_scope_created
      ON autohunt_result_intakes(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_result_intakes_source_execution_contract_id_created
      ON autohunt_result_intakes(source_execution_contract_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_result_intakes_source_execution_contract_fingerprint_created
      ON autohunt_result_intakes(source_execution_contract_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_result_intakes_result_intake_status_created
      ON autohunt_result_intakes(result_intake_status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_result_intakes_result_report_fingerprint_created
      ON autohunt_result_intakes(result_report_fingerprint, created_at DESC);
  `);
}

export function readAutohuntResultIntakes({
  db: providedDb,
  scope = DEFAULT_SCOPE,
  source_execution_contract_id = null,
  result_intake_status = null,
  result_intake_id = null,
  limit = 50,
}: ReadAutohuntResultIntakesOptions = {}): AutohuntResultIntakeReadback {
  const db = providedDb ?? openDatabase();
  const shouldClose = !providedDb && hasClose(db);

  try {
    ensureAutohuntResultIntakeSchema(db);
    const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
    const rows = readRows(db, {
      scope,
      source_execution_contract_id,
      result_intake_status,
      result_intake_id,
      limit: safeLimit,
    });
    const allRows = readRows(db, {
      scope,
      source_execution_contract_id,
      result_intake_status: null,
      result_intake_id: null,
      limit: safeLimit,
    });
    const { records, invalidRecordCount } = parseValidRecords(rows);
    const { records: allRecords, invalidRecordCount: allInvalidRecordCount } =
      parseValidRecords(allRows);
    const latestRecordedResultIntake =
      allRecords.find(
        (record) => record.result_intake_status === "result_intake_recorded",
      ) ?? null;
    const selectedResultIntake = selectResultIntake({
      records,
      latestRecordedResultIntake,
      result_intake_id,
      result_intake_status,
    });
    const selectionStatus = getSelectionStatus({
      selectedResultIntake,
      latestRecordedResultIntake,
      result_intake_id,
      allRecords,
    });

    return createReadback({
      scope,
      source_execution_contract_id,
      result_intake_status,
      result_intake_id,
      selection_status: selectionStatus,
      selected_result_intake: selectedResultIntake,
      latest_recorded_result_intake: latestRecordedResultIntake,
      result_intakes: records,
      all_result_intakes: allRecords,
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

export function computeAutohuntResultIntakeFingerprint(
  intake: Omit<AutohuntResultIntake, "result_intake_fingerprint"> & {
    result_intake_fingerprint?: string;
  },
) {
  const {
    result_intake_fingerprint: _resultIntakeFingerprint,
    ...fingerprintSource
  } = intake;
  return fingerprint(fingerprintSource);
}

export function parseAutohuntResultIntakeRow(
  row: AutohuntResultIntakeRow,
): AutohuntResultIntake | null {
  try {
    const structuredResultReport = parseJson(row.structured_result_report_json);
    return {
      result_intake_kind: AUTOHUNT_RESULT_INTAKE_KIND,
      result_intake_version: AUTOHUNT_RESULT_INTAKE_VERSION,
      result_intake_id: row.result_intake_id,
      scope: row.scope,
      created_at: row.created_at,
      result_intake_status: row.result_intake_status,
      source_execution_contract: {
        contract_id: row.source_execution_contract_id,
        contract_fingerprint: row.source_execution_contract_fingerprint,
        contract_status: row.source_execution_contract_status,
        launch_mode:
          structuredResultReport.source_contract_launch_mode ??
          "supervised_codex_handoff_only",
        source_readiness_gate_fingerprint:
          row.source_readiness_gate_fingerprint,
        active_grant_id: row.active_grant_id,
        active_grant_fingerprint: row.active_grant_fingerprint,
        ready_preflight_packet_id: row.ready_preflight_packet_id,
        ready_preflight_packet_fingerprint:
          row.ready_preflight_packet_fingerprint,
        operator_decision_id: row.operator_decision_id,
        operator_decision_fingerprint: row.operator_decision_fingerprint,
        copy_export_preview_fingerprint: row.copy_export_preview_fingerprint,
      },
      structured_result_report: structuredResultReport,
      expected_observed_delta_candidate: parseJson(
        row.expected_observed_delta_candidate_json,
      ),
      reuse_outcome_candidate: parseJson(row.reuse_outcome_candidate_json),
      residual_diagnostic_candidate: parseJson(
        row.residual_diagnostic_candidate_json,
      ),
      learning_loop_summary: parseJson(row.learning_loop_summary_json),
      authority_boundary: parseJson(row.authority_boundary_json),
      persisted_material_boundary: parseJson(
        row.persisted_material_boundary_json,
      ),
      validation: parseJson(row.validation_json),
      row_count_write_summary: parseJson(
        row.row_count_write_summary_json,
      ) as AutohuntResultIntakeRowCountWriteSummary,
      idempotency_key: row.idempotency_key,
      result_intake_fingerprint: row.result_intake_fingerprint,
    };
  } catch {
    return null;
  }
}

export function buildAutohuntResultIntakeAuthorityBoundary(): AutohuntResultIntake["authority_boundary"] {
  return buildAutohuntSupervisedExecutionContractAuthorityBoundary();
}

function readRows(
  db: AutonomyDelegationGrantDbLike,
  {
    scope,
    source_execution_contract_id,
    result_intake_status,
    result_intake_id,
    limit,
  }: {
    scope: AutohuntResultIntakeScope;
    source_execution_contract_id: string | null;
    result_intake_status: AutohuntResultIntakeStatus | null;
    result_intake_id: string | null;
    limit: number;
  },
) {
  if (result_intake_id) {
    return db
      .prepare(
        `
          SELECT *
          FROM ${AUTOHUNT_RESULT_INTAKE_TABLE}
          WHERE scope = ?
            AND result_intake_id = ?
          ORDER BY created_at DESC, result_intake_id DESC
          LIMIT 1
        `,
      )
      .all(scope, result_intake_id) as AutohuntResultIntakeRow[];
  }

  const conditions = ["scope = ?"];
  const params: unknown[] = [scope];
  if (source_execution_contract_id) {
    conditions.push("source_execution_contract_id = ?");
    params.push(source_execution_contract_id);
  }
  if (result_intake_status) {
    conditions.push("result_intake_status = ?");
    params.push(result_intake_status);
  }
  params.push(limit);

  return db
    .prepare(
      `
        SELECT *
        FROM ${AUTOHUNT_RESULT_INTAKE_TABLE}
        WHERE ${conditions.join(" AND ")}
        ORDER BY created_at DESC, result_intake_id DESC
        LIMIT ?
      `,
    )
    .all(...params) as AutohuntResultIntakeRow[];
}

function parseValidRecords(rows: AutohuntResultIntakeRow[]) {
  const records: AutohuntResultIntake[] = [];
  let invalidRecordCount = 0;

  for (const row of rows) {
    const record = parseAutohuntResultIntakeRow(row);
    if (
      record &&
      record.result_intake_fingerprint ===
        computeAutohuntResultIntakeFingerprint(record)
    ) {
      records.push(record);
    } else {
      invalidRecordCount += 1;
    }
  }

  return { records, invalidRecordCount };
}

function selectResultIntake({
  records,
  latestRecordedResultIntake,
  result_intake_id,
  result_intake_status,
}: {
  records: AutohuntResultIntake[];
  latestRecordedResultIntake: AutohuntResultIntake | null;
  result_intake_id: string | null;
  result_intake_status: AutohuntResultIntakeStatus | null;
}) {
  if (result_intake_id) return records[0] ?? null;
  if (!result_intake_status) return latestRecordedResultIntake;
  return records[0] ?? null;
}

function getSelectionStatus({
  selectedResultIntake,
  latestRecordedResultIntake,
  result_intake_id,
  allRecords,
}: {
  selectedResultIntake: AutohuntResultIntake | null;
  latestRecordedResultIntake: AutohuntResultIntake | null;
  result_intake_id: string | null;
  allRecords: AutohuntResultIntake[];
}): AutohuntResultIntakeSelectionStatus {
  if (result_intake_id) {
    return selectedResultIntake
      ? "selected_by_result_intake_id"
      : "result_intake_id_not_found";
  }
  if (
    selectedResultIntake?.result_intake_status === "result_intake_recorded"
  ) {
    return "selected_latest_result_intake";
  }
  if (latestRecordedResultIntake) return "selected_latest_result_intake";
  return allRecords.length > 0
    ? "no_recorded_result_intake"
    : "no_result_intakes";
}

function createReadback({
  scope,
  source_execution_contract_id,
  result_intake_status,
  result_intake_id,
  selection_status,
  selected_result_intake,
  latest_recorded_result_intake,
  result_intakes,
  all_result_intakes,
  invalid_record_count,
}: Pick<
  AutohuntResultIntakeReadback,
  | "scope"
  | "selection_status"
  | "selected_result_intake"
  | "latest_recorded_result_intake"
  | "result_intakes"
  | "all_result_intakes"
  | "invalid_record_count"
> & {
  source_execution_contract_id: string | null;
  result_intake_status: AutohuntResultIntakeStatus | null;
  result_intake_id: string | null;
}): AutohuntResultIntakeReadback {
  const boundary = buildAutohuntResultIntakeAuthorityBoundary();
  const selected = selected_result_intake ?? latest_recorded_result_intake ?? null;

  return {
    readback_kind: AUTOHUNT_RESULT_INTAKE_READBACK_KIND,
    readback_version: AUTOHUNT_RESULT_INTAKE_READBACK_VERSION,
    scope,
    source_execution_contract_id_filter: source_execution_contract_id,
    result_intake_status_filter: result_intake_status,
    result_intake_id_filter: result_intake_id,
    selection_status,
    selected_result_intake: selected,
    selected_result_intake_summary: selected
      ? summarizeSelectedResultIntake(selected)
      : null,
    latest_recorded_result_intake,
    result_intakes,
    all_result_intakes,
    recorded_result_intakes: all_result_intakes.filter(
      (record) => record.result_intake_status === "result_intake_recorded",
    ),
    blocked_result_intakes: all_result_intakes.filter(
      (record) => record.result_intake_status !== "result_intake_recorded",
    ),
    invalid_record_count,
    latest_expected_observed_delta_candidate:
      selected?.expected_observed_delta_candidate ?? null,
    latest_reuse_outcome_candidate: selected?.reuse_outcome_candidate ?? null,
    latest_residual_diagnostic_candidate:
      selected?.residual_diagnostic_candidate ?? null,
    learning_loop_summary: selected?.learning_loop_summary ?? null,
    no_run_no_execution_boundary: boundary,
    raw_material_persisted: false,
    runner_started: false,
    scheduler_started: false,
    codex_executed: false,
    github_called: false,
    provider_openai_called: false,
    sources_fetched: false,
    retrieval_run: false,
    memory_written: false,
    perspective_promoted: false,
    cwp_mutated: false,
    work_mutated: false,
    proof_or_evidence_written: false,
    product_or_delivery_state_written: false,
  };
}

function summarizeSelectedResultIntake(
  intake: AutohuntResultIntake,
): AutohuntResultIntakeSelectedSummary {
  return {
    result_intake_id: intake.result_intake_id,
    result_intake_status: intake.result_intake_status,
    source_execution_contract_id:
      intake.source_execution_contract.contract_id,
    result_report_id: intake.structured_result_report.result_report_id,
    result_status: intake.structured_result_report.result_status,
    delta_status:
      intake.expected_observed_delta_candidate.delta_status,
    reuse_outcome_helpfulness:
      intake.reuse_outcome_candidate.source_chain_helpfulness,
    residual_category:
      intake.residual_diagnostic_candidate.residual_category,
    ready_for_next_daily_autohunt_cycle:
      intake.learning_loop_summary.ready_for_next_daily_autohunt_cycle,
    authority_boundary_all_false: allValuesFalse(intake.authority_boundary),
  };
}

function parseJson(value: string) {
  return JSON.parse(value);
}

function hasClose(
  db: AutonomyDelegationGrantDbLike,
): db is AutonomyDelegationGrantDbLike & { close(): void } {
  return typeof (db as { close?: unknown }).close === "function";
}
