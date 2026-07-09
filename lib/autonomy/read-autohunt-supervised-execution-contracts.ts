import { openDatabase } from "@/lib/db";
import type { AutonomyDelegationGrantDbLike } from "@/lib/autonomy/read-autonomy-delegation-grants";
import {
  allValuesFalse,
  fingerprint,
} from "@/lib/research-candidate-review/shared-source-chain-guards";
import { AUTOHUNT_EXECUTION_READINESS_AUTHORITY_FLAG_NAMES } from "@/types/autohunt-execution-readiness-gate";
import {
  AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_KIND,
  AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_READBACK_KIND,
  AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_READBACK_VERSION,
  AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_TABLE,
  AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_VERSION,
  type AutohuntSupervisedExecutionContract,
  type AutohuntSupervisedExecutionContractAuthorityBoundary,
  type AutohuntSupervisedExecutionContractReadback,
  type AutohuntSupervisedExecutionContractScope,
  type AutohuntSupervisedExecutionContractSelectedSummary,
  type AutohuntSupervisedExecutionContractSelectionStatus,
  type AutohuntSupervisedExecutionContractStatus,
  type AutohuntSupervisedExecutionRowCountWriteSummary,
} from "@/types/autohunt-supervised-execution-contract";

export interface ReadAutohuntSupervisedExecutionContractsOptions {
  db?: AutonomyDelegationGrantDbLike;
  scope?: AutohuntSupervisedExecutionContractScope;
  contract_status?: AutohuntSupervisedExecutionContractStatus | null;
  source_readiness_gate_fingerprint?: string | null;
  contract_id?: string | null;
  limit?: number;
}

type AutohuntSupervisedExecutionContractRow = {
  contract_id: string;
  created_at: string;
  scope: AutohuntSupervisedExecutionContractScope;
  contract_status: AutohuntSupervisedExecutionContractStatus;
  source_readiness_gate_fingerprint: string;
  active_grant_id: string;
  active_grant_fingerprint: string;
  latest_queued_candidate_id: string;
  latest_queued_candidate_fingerprint: string;
  ready_preflight_packet_id: string;
  ready_preflight_packet_fingerprint: string;
  handoff_plan_id: string;
  handoff_plan_fingerprint: string;
  operator_decision_id: string;
  operator_decision_fingerprint: string;
  copy_export_preview_fingerprint: string;
  launch_mode: string;
  idempotency_key: string;
  freshness_contract_json: string;
  launch_envelope_json: string;
  launcher_may_json: string;
  launcher_must_not_json: string;
  launch_guard_checks_json: string;
  launch_guard_result_json: string;
  authority_boundary_json: string;
  persisted_material_boundary_json: string;
  validation_json: string;
  row_count_write_summary_json: string;
  contract_fingerprint: string;
};

const DEFAULT_SCOPE: AutohuntSupervisedExecutionContractScope =
  "project:augnes";

export function ensureAutohuntSupervisedExecutionContractSchema(
  db: AutonomyDelegationGrantDbLike,
) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS autohunt_supervised_execution_contracts (
      contract_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      contract_status TEXT NOT NULL,
      source_readiness_gate_fingerprint TEXT NOT NULL,
      active_grant_id TEXT NOT NULL,
      active_grant_fingerprint TEXT NOT NULL,
      latest_queued_candidate_id TEXT NOT NULL,
      latest_queued_candidate_fingerprint TEXT NOT NULL,
      ready_preflight_packet_id TEXT NOT NULL,
      ready_preflight_packet_fingerprint TEXT NOT NULL,
      handoff_plan_id TEXT NOT NULL,
      handoff_plan_fingerprint TEXT NOT NULL,
      operator_decision_id TEXT NOT NULL,
      operator_decision_fingerprint TEXT NOT NULL,
      copy_export_preview_fingerprint TEXT NOT NULL,
      launch_mode TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      freshness_contract_json TEXT NOT NULL,
      launch_envelope_json TEXT NOT NULL,
      launcher_may_json TEXT NOT NULL,
      launcher_must_not_json TEXT NOT NULL,
      launch_guard_checks_json TEXT NOT NULL,
      launch_guard_result_json TEXT NOT NULL,
      authority_boundary_json TEXT NOT NULL,
      persisted_material_boundary_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      row_count_write_summary_json TEXT NOT NULL,
      contract_fingerprint TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_autohunt_supervised_execution_contracts_scope_created
      ON autohunt_supervised_execution_contracts(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_supervised_execution_contracts_contract_status_created
      ON autohunt_supervised_execution_contracts(contract_status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_supervised_execution_contracts_source_readiness_gate_fingerprint_created
      ON autohunt_supervised_execution_contracts(source_readiness_gate_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_supervised_execution_contracts_active_grant_fingerprint_created
      ON autohunt_supervised_execution_contracts(active_grant_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_supervised_execution_contracts_ready_preflight_packet_fingerprint_created
      ON autohunt_supervised_execution_contracts(ready_preflight_packet_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_supervised_execution_contracts_operator_decision_fingerprint_created
      ON autohunt_supervised_execution_contracts(operator_decision_fingerprint, created_at DESC);
  `);
}

export function readAutohuntSupervisedExecutionContracts({
  db: providedDb,
  scope = DEFAULT_SCOPE,
  contract_status = null,
  source_readiness_gate_fingerprint = null,
  contract_id = null,
  limit = 50,
}: ReadAutohuntSupervisedExecutionContractsOptions = {}): AutohuntSupervisedExecutionContractReadback {
  const db = providedDb ?? openDatabase();
  const shouldClose = !providedDb && hasClose(db);

  try {
    ensureAutohuntSupervisedExecutionContractSchema(db);
    const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
    const rows = readRows(db, {
      scope,
      contract_status,
      source_readiness_gate_fingerprint,
      contract_id,
      limit: safeLimit,
    });
    const allRows = readRows(db, {
      scope,
      contract_status: null,
      source_readiness_gate_fingerprint,
      contract_id: null,
      limit: safeLimit,
    });
    const { records, invalidRecordCount } = parseValidRecords(rows);
    const { records: allRecords, invalidRecordCount: allInvalidRecordCount } =
      parseValidRecords(allRows);
    const latestReadyContract =
      allRecords.find(
        (record) =>
          record.contract_status === "ready_for_future_limited_launcher",
      ) ?? null;
    const selectedContract = selectContract({
      records,
      latestReadyContract,
      contract_id,
      contract_status,
    });
    const selectionStatus = getSelectionStatus({
      selectedContract,
      latestReadyContract,
      contract_id,
      allRecords,
    });

    return createReadback({
      scope,
      contract_status,
      source_readiness_gate_fingerprint,
      contract_id,
      selection_status: selectionStatus,
      selected_contract: selectedContract,
      latest_ready_contract: latestReadyContract,
      contracts: records,
      all_contracts: allRecords,
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

export function computeAutohuntSupervisedExecutionContractFingerprint(
  contract: Omit<AutohuntSupervisedExecutionContract, "contract_fingerprint"> & {
    contract_fingerprint?: string;
  },
) {
  const { contract_fingerprint: _contractFingerprint, ...fingerprintSource } =
    contract;
  return fingerprint(fingerprintSource);
}

export function parseAutohuntSupervisedExecutionContractRow(
  row: AutohuntSupervisedExecutionContractRow,
): AutohuntSupervisedExecutionContract | null {
  try {
    const launchEnvelope = parseJson(row.launch_envelope_json);
    return {
      execution_contract_kind: AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_KIND,
      execution_contract_version:
        AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_VERSION,
      contract_id: row.contract_id,
      scope: row.scope,
      created_at: row.created_at,
      contract_status: row.contract_status,
      source_readiness_gate: {
        gate_fingerprint: row.source_readiness_gate_fingerprint,
        readiness_status: "ready_for_future_supervised_execution_design",
        active_grant_id: row.active_grant_id,
        active_grant_fingerprint: row.active_grant_fingerprint,
        latest_queued_candidate_id: row.latest_queued_candidate_id,
        latest_queued_candidate_fingerprint:
          row.latest_queued_candidate_fingerprint,
        ready_preflight_packet_id: row.ready_preflight_packet_id,
        ready_preflight_packet_fingerprint:
          row.ready_preflight_packet_fingerprint,
        handoff_plan_id: row.handoff_plan_id,
        handoff_plan_fingerprint: row.handoff_plan_fingerprint,
        operator_decision_id: row.operator_decision_id,
        operator_decision_fingerprint: row.operator_decision_fingerprint,
        copy_export_preview_fingerprint: row.copy_export_preview_fingerprint,
      },
      freshness_contract: parseJson(row.freshness_contract_json),
      launch_envelope: launchEnvelope,
      launcher_may: parseJson(row.launcher_may_json),
      launcher_must_not: parseJson(row.launcher_must_not_json),
      launch_guard_checks: parseJson(row.launch_guard_checks_json),
      launch_guard_result: parseJson(row.launch_guard_result_json),
      authority_boundary: parseJson(row.authority_boundary_json),
      persisted_material_boundary: parseJson(
        row.persisted_material_boundary_json,
      ),
      validation: parseJson(row.validation_json),
      row_count_write_summary: parseJson(
        row.row_count_write_summary_json,
      ) as AutohuntSupervisedExecutionRowCountWriteSummary,
      idempotency_key: row.idempotency_key,
      contract_fingerprint: row.contract_fingerprint,
    };
  } catch {
    return null;
  }
}

export function buildAutohuntSupervisedExecutionContractAuthorityBoundary(): AutohuntSupervisedExecutionContractAuthorityBoundary {
  return Object.fromEntries(
    AUTOHUNT_EXECUTION_READINESS_AUTHORITY_FLAG_NAMES.map((flagName) => [
      flagName,
      false,
    ]),
  ) as AutohuntSupervisedExecutionContractAuthorityBoundary;
}

function readRows(
  db: AutonomyDelegationGrantDbLike,
  {
    scope,
    contract_status,
    source_readiness_gate_fingerprint,
    contract_id,
    limit,
  }: {
    scope: AutohuntSupervisedExecutionContractScope;
    contract_status: AutohuntSupervisedExecutionContractStatus | null;
    source_readiness_gate_fingerprint: string | null;
    contract_id: string | null;
    limit: number;
  },
) {
  if (contract_id) {
    return db
      .prepare(
        `
          SELECT *
          FROM ${AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_TABLE}
          WHERE scope = ?
            AND contract_id = ?
          ORDER BY created_at DESC, contract_id DESC
          LIMIT 1
        `,
      )
      .all(scope, contract_id) as AutohuntSupervisedExecutionContractRow[];
  }

  const conditions = ["scope = ?"];
  const params: unknown[] = [scope];
  if (contract_status) {
    conditions.push("contract_status = ?");
    params.push(contract_status);
  }
  if (source_readiness_gate_fingerprint) {
    conditions.push("source_readiness_gate_fingerprint = ?");
    params.push(source_readiness_gate_fingerprint);
  }
  params.push(limit);

  return db
    .prepare(
      `
        SELECT *
        FROM ${AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_TABLE}
        WHERE ${conditions.join(" AND ")}
        ORDER BY created_at DESC, contract_id DESC
        LIMIT ?
      `,
    )
    .all(...params) as AutohuntSupervisedExecutionContractRow[];
}

function parseValidRecords(rows: AutohuntSupervisedExecutionContractRow[]) {
  const records: AutohuntSupervisedExecutionContract[] = [];
  let invalidRecordCount = 0;

  for (const row of rows) {
    const record = parseAutohuntSupervisedExecutionContractRow(row);
    if (
      record &&
      record.contract_fingerprint ===
        computeAutohuntSupervisedExecutionContractFingerprint(record)
    ) {
      records.push(record);
    } else {
      invalidRecordCount += 1;
    }
  }

  return { records, invalidRecordCount };
}

function selectContract({
  records,
  latestReadyContract,
  contract_id,
  contract_status,
}: {
  records: AutohuntSupervisedExecutionContract[];
  latestReadyContract: AutohuntSupervisedExecutionContract | null;
  contract_id: string | null;
  contract_status: AutohuntSupervisedExecutionContractStatus | null;
}) {
  if (contract_id) return records[0] ?? null;
  if (!contract_status) return latestReadyContract;
  return records[0] ?? null;
}

function getSelectionStatus({
  selectedContract,
  latestReadyContract,
  contract_id,
  allRecords,
}: {
  selectedContract: AutohuntSupervisedExecutionContract | null;
  latestReadyContract: AutohuntSupervisedExecutionContract | null;
  contract_id: string | null;
  allRecords: AutohuntSupervisedExecutionContract[];
}): AutohuntSupervisedExecutionContractSelectionStatus {
  if (contract_id) {
    return selectedContract ? "selected_by_contract_id" : "contract_id_not_found";
  }
  if (
    selectedContract?.contract_status === "ready_for_future_limited_launcher"
  ) {
    return "selected_latest_ready_contract";
  }
  if (latestReadyContract) return "selected_latest_ready_contract";
  return allRecords.length > 0 ? "no_ready_contract" : "no_contracts";
}

function createReadback({
  scope,
  contract_status,
  source_readiness_gate_fingerprint,
  contract_id,
  selection_status,
  selected_contract,
  latest_ready_contract,
  contracts,
  all_contracts,
  invalid_record_count,
}: Pick<
  AutohuntSupervisedExecutionContractReadback,
  | "scope"
  | "selection_status"
  | "selected_contract"
  | "latest_ready_contract"
  | "contracts"
  | "all_contracts"
  | "invalid_record_count"
> & {
  contract_status: AutohuntSupervisedExecutionContractStatus | null;
  source_readiness_gate_fingerprint: string | null;
  contract_id: string | null;
}): AutohuntSupervisedExecutionContractReadback {
  const boundary = buildAutohuntSupervisedExecutionContractAuthorityBoundary();
  const selected = selected_contract ?? latest_ready_contract ?? null;

  return {
    readback_kind: AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_READBACK_KIND,
    readback_version: AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_READBACK_VERSION,
    scope,
    contract_status_filter: contract_status,
    source_readiness_gate_fingerprint_filter:
      source_readiness_gate_fingerprint,
    contract_id_filter: contract_id,
    selection_status,
    selected_contract: selected,
    selected_contract_summary: selected ? summarizeSelectedContract(selected) : null,
    latest_ready_contract,
    contracts,
    all_contracts,
    ready_contracts: all_contracts.filter(
      (contract) =>
        contract.contract_status === "ready_for_future_limited_launcher",
    ),
    blocked_contracts: all_contracts.filter(
      (contract) => contract.contract_status !== "ready_for_future_limited_launcher",
    ),
    invalid_record_count,
    launch_guard_result: selected?.launch_guard_result ?? null,
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

function summarizeSelectedContract(
  contract: AutohuntSupervisedExecutionContract,
): AutohuntSupervisedExecutionContractSelectedSummary {
  return {
    contract_id: contract.contract_id,
    contract_status: contract.contract_status,
    launch_mode: contract.launch_envelope.launch_mode,
    source_readiness_gate_fingerprint:
      contract.source_readiness_gate.gate_fingerprint,
    launcher_design_allowed:
      contract.launch_guard_result.launcher_design_allowed,
    launch_now_allowed: false,
    execution_started: false,
    authority_boundary_all_false: allValuesFalse(contract.authority_boundary),
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
