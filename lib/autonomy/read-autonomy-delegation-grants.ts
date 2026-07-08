import { openDatabase } from "@/lib/db";
import {
  allValuesFalse,
  fingerprint,
} from "@/lib/research-candidate-review/shared-source-chain-guards";
import type {
  AutonomyDelegationGrant,
  AutonomyDelegationGrantAuthorityBoundary,
  AutonomyDelegationGrantMode,
  AutonomyDelegationGrantReadback,
  AutonomyDelegationGrantReadbackSelectionStatus,
  AutonomyDelegationGrantRowCountWriteSummary,
  AutonomyDelegationGrantScope,
  AutonomyDelegationGrantSelectedSummary,
  AutonomyDelegationGrantStatus,
} from "@/types/autonomy-delegation-grant";
import {
  AUTONOMY_DELEGATION_GRANT_AUTHORITY_FLAG_NAMES,
  AUTONOMY_DELEGATION_GRANT_KIND,
  AUTONOMY_DELEGATION_GRANT_READBACK_KIND,
  AUTONOMY_DELEGATION_GRANT_READBACK_VERSION,
  AUTONOMY_DELEGATION_GRANT_TABLE,
  AUTONOMY_DELEGATION_GRANT_VERSION,
} from "@/types/autonomy-delegation-grant";

export interface AutonomyDelegationGrantDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

export interface ReadAutonomyDelegationGrantsOptions {
  db?: AutonomyDelegationGrantDbLike;
  scope?: AutonomyDelegationGrantScope;
  grant_status?: AutonomyDelegationGrantStatus | null;
  grant_mode?: AutonomyDelegationGrantMode | null;
  grant_id?: string | null;
  limit?: number;
}

type AutonomyDelegationGrantRow = {
  grant_id: string;
  created_at: string;
  scope: AutonomyDelegationGrantScope;
  grant_status: AutonomyDelegationGrantStatus;
  grant_mode: AutonomyDelegationGrantMode;
  approval_ref: string;
  approved_by: string | null;
  approved_at: string | null;
  approval_basis: string | null;
  approval_text_fingerprint: string;
  source_contract_id: string | null;
  source_contract_fingerprint: string | null;
  source_contract_version: string | null;
  source_autonomy_mode: string | null;
  idempotency_key: string;
  allowed_work_classes_json: string;
  forbidden_work_classes_json: string;
  allowed_actions_json: string;
  forbidden_actions_json: string;
  budget_json: string;
  reporting_cadence_json: string;
  stop_conditions_json: string;
  allowed_outputs_json: string;
  forbidden_outputs_json: string;
  revocation_json: string;
  authority_boundary_json: string;
  persisted_material_boundary_json: string;
  validation_json: string;
  row_count_write_summary_json: string;
  grant_fingerprint: string;
};

const DEFAULT_SCOPE: AutonomyDelegationGrantScope = "project:augnes";

export function ensureAutonomyDelegationGrantSchema(
  db: AutonomyDelegationGrantDbLike,
) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS autonomy_delegation_grants (
      grant_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      grant_status TEXT NOT NULL,
      grant_mode TEXT NOT NULL,
      approval_ref TEXT NOT NULL,
      approved_by TEXT,
      approved_at TEXT,
      approval_basis TEXT,
      approval_text_fingerprint TEXT NOT NULL,
      source_contract_id TEXT,
      source_contract_fingerprint TEXT,
      source_contract_version TEXT,
      source_autonomy_mode TEXT,
      idempotency_key TEXT NOT NULL UNIQUE,
      allowed_work_classes_json TEXT NOT NULL,
      forbidden_work_classes_json TEXT NOT NULL,
      allowed_actions_json TEXT NOT NULL,
      forbidden_actions_json TEXT NOT NULL,
      budget_json TEXT NOT NULL,
      reporting_cadence_json TEXT NOT NULL,
      stop_conditions_json TEXT NOT NULL,
      allowed_outputs_json TEXT NOT NULL,
      forbidden_outputs_json TEXT NOT NULL,
      revocation_json TEXT NOT NULL,
      authority_boundary_json TEXT NOT NULL,
      persisted_material_boundary_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      row_count_write_summary_json TEXT NOT NULL,
      grant_fingerprint TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_autonomy_delegation_grants_scope_created
      ON autonomy_delegation_grants(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autonomy_delegation_grants_scope_status_created
      ON autonomy_delegation_grants(scope, grant_status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autonomy_delegation_grants_scope_mode_created
      ON autonomy_delegation_grants(scope, grant_mode, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autonomy_delegation_grants_approval_ref
      ON autonomy_delegation_grants(approval_ref);
    CREATE INDEX IF NOT EXISTS idx_autonomy_delegation_grants_source_contract_fingerprint
      ON autonomy_delegation_grants(source_contract_fingerprint);
  `);
}

export function readAutonomyDelegationGrants({
  db: providedDb,
  scope = DEFAULT_SCOPE,
  grant_status = null,
  grant_mode = null,
  grant_id = null,
  limit = 50,
}: ReadAutonomyDelegationGrantsOptions = {}): AutonomyDelegationGrantReadback {
  const db = providedDb ?? openDatabase();
  const shouldClose = !providedDb && hasClose(db);

  try {
    ensureAutonomyDelegationGrantSchema(db);
    const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
    const rows = readRows(db, {
      scope,
      grant_status,
      grant_mode,
      grant_id,
      limit: safeLimit,
    });
    const allRows = readRows(db, {
      scope,
      grant_status: null,
      grant_mode: null,
      grant_id: null,
      limit: safeLimit,
    });
    const { records, invalidRecordCount } = parseValidRecords(rows);
    const { records: allRecords, invalidRecordCount: allInvalidRecordCount } =
      parseValidRecords(allRows);
    const latestActiveGrant =
      allRecords.find((record) => record.grant_status === "active") ?? null;
    const selectedGrant = selectGrant({
      records,
      latestActiveGrant,
      grant_id,
      grant_status,
      grant_mode,
    });
    const selectionStatus = getSelectionStatus({
      selectedGrant,
      latestActiveGrant,
      grant_id,
      allRecords,
    });

    return createReadback({
      scope,
      grant_status,
      grant_mode,
      grant_id,
      selection_status: selectionStatus,
      selected_grant: selectedGrant,
      latest_active_grant: latestActiveGrant,
      grants: records,
      all_grants: allRecords,
      invalid_record_count: Math.max(invalidRecordCount, allInvalidRecordCount),
    });
  } finally {
    if (shouldClose) {
      db.close();
    }
  }
}

export function createAutonomyDelegationGrantEmptyReadback({
  scope = DEFAULT_SCOPE,
  grant_status = null,
  grant_mode = null,
  grant_id = null,
}: {
  scope?: AutonomyDelegationGrantScope;
  grant_status?: AutonomyDelegationGrantStatus | null;
  grant_mode?: AutonomyDelegationGrantMode | null;
  grant_id?: string | null;
} = {}): AutonomyDelegationGrantReadback {
  return createReadback({
    scope,
    grant_status,
    grant_mode,
    grant_id,
    selection_status: grant_id ? "grant_id_not_found" : "no_grants",
    selected_grant: null,
    latest_active_grant: null,
    grants: [],
    all_grants: [],
    invalid_record_count: 0,
  });
}

export function computeAutonomyDelegationGrantFingerprint(
  grant: Omit<AutonomyDelegationGrant, "grant_fingerprint"> & {
    grant_fingerprint?: string;
  },
) {
  const { grant_fingerprint: _grantFingerprint, ...fingerprintSource } = grant;
  return fingerprint(fingerprintSource);
}

export function parseAutonomyDelegationGrantRow(
  row: AutonomyDelegationGrantRow,
): AutonomyDelegationGrant | null {
  try {
    const grant: AutonomyDelegationGrant = {
      grant_kind: AUTONOMY_DELEGATION_GRANT_KIND,
      grant_version: AUTONOMY_DELEGATION_GRANT_VERSION,
      grant_id: row.grant_id,
      scope: row.scope,
      created_at: row.created_at,
      grant_status: row.grant_status,
      grant_mode: row.grant_mode,
      idempotency_key: row.idempotency_key,
      explicit_user_approval: {
        approval_ref: row.approval_ref,
        approved_by: row.approved_by,
        approved_at: row.approved_at,
        approval_basis: row.approval_basis,
        approval_text_fingerprint: row.approval_text_fingerprint,
        raw_approval_text_persisted: false,
      },
      source_autonomy_contract: {
        contract_id: row.source_contract_id,
        contract_fingerprint: row.source_contract_fingerprint,
        contract_version: row.source_contract_version,
        autonomy_mode: row.source_autonomy_mode,
        source_refs: [],
      },
      allowed_work_classes: parseJson(row.allowed_work_classes_json),
      forbidden_work_classes: parseJson(row.forbidden_work_classes_json),
      allowed_actions: parseJson(row.allowed_actions_json),
      forbidden_actions: parseJson(row.forbidden_actions_json),
      budget: parseJson(row.budget_json),
      reporting_cadence: parseJson(row.reporting_cadence_json),
      stop_conditions: parseJson(row.stop_conditions_json),
      allowed_outputs: parseJson(row.allowed_outputs_json),
      forbidden_outputs: parseJson(row.forbidden_outputs_json),
      revocation: parseJson(row.revocation_json),
      authority_boundary: parseJson(row.authority_boundary_json),
      persisted_material_boundary: parseJson(row.persisted_material_boundary_json),
      validation: parseJson(row.validation_json),
      row_count_write_summary: parseJson(
        row.row_count_write_summary_json,
      ) as AutonomyDelegationGrantRowCountWriteSummary,
      grant_fingerprint: row.grant_fingerprint,
    };
    return grant;
  } catch {
    return null;
  }
}

export function buildAutonomyDelegationGrantAuthorityBoundary(): AutonomyDelegationGrantAuthorityBoundary {
  return Object.fromEntries(
    AUTONOMY_DELEGATION_GRANT_AUTHORITY_FLAG_NAMES.map((field) => [
      field,
      false,
    ]),
  ) as AutonomyDelegationGrantAuthorityBoundary;
}

function readRows(
  db: AutonomyDelegationGrantDbLike,
  {
    scope,
    grant_status,
    grant_mode,
    grant_id,
    limit,
  }: {
    scope: AutonomyDelegationGrantScope;
    grant_status: AutonomyDelegationGrantStatus | null;
    grant_mode: AutonomyDelegationGrantMode | null;
    grant_id: string | null;
    limit: number;
  },
) {
  if (grant_id) {
    return db
      .prepare(
        `
          SELECT *
          FROM ${AUTONOMY_DELEGATION_GRANT_TABLE}
          WHERE scope = ?
            AND grant_id = ?
          ORDER BY created_at DESC, grant_id DESC
          LIMIT 1
        `,
      )
      .all(scope, grant_id) as AutonomyDelegationGrantRow[];
  }

  const conditions = ["scope = ?"];
  const params: unknown[] = [scope];
  if (grant_status) {
    conditions.push("grant_status = ?");
    params.push(grant_status);
  }
  if (grant_mode) {
    conditions.push("grant_mode = ?");
    params.push(grant_mode);
  }
  params.push(limit);

  return db
    .prepare(
      `
        SELECT *
        FROM ${AUTONOMY_DELEGATION_GRANT_TABLE}
        WHERE ${conditions.join(" AND ")}
        ORDER BY created_at DESC, grant_id DESC
        LIMIT ?
      `,
    )
    .all(...params) as AutonomyDelegationGrantRow[];
}

function parseValidRecords(rows: AutonomyDelegationGrantRow[]) {
  const records: AutonomyDelegationGrant[] = [];
  let invalidRecordCount = 0;

  for (const row of rows) {
    const record = parseAutonomyDelegationGrantRow(row);
    if (
      record &&
      record.grant_fingerprint ===
        computeAutonomyDelegationGrantFingerprint(record)
    ) {
      records.push(record);
    } else {
      invalidRecordCount += 1;
    }
  }

  return { records, invalidRecordCount };
}

function selectGrant({
  records,
  latestActiveGrant,
  grant_id,
  grant_status,
  grant_mode,
}: {
  records: AutonomyDelegationGrant[];
  latestActiveGrant: AutonomyDelegationGrant | null;
  grant_id: string | null;
  grant_status: AutonomyDelegationGrantStatus | null;
  grant_mode: AutonomyDelegationGrantMode | null;
}) {
  if (grant_id) return records[0] ?? null;
  if (!grant_status && !grant_mode) return latestActiveGrant;
  if (grant_status === "active" || (!grant_status && grant_mode)) {
    return records.find((record) => record.grant_status === "active") ?? null;
  }
  return records[0] ?? null;
}

function getSelectionStatus({
  selectedGrant,
  latestActiveGrant,
  grant_id,
  allRecords,
}: {
  selectedGrant: AutonomyDelegationGrant | null;
  latestActiveGrant: AutonomyDelegationGrant | null;
  grant_id: string | null;
  allRecords: AutonomyDelegationGrant[];
}): AutonomyDelegationGrantReadbackSelectionStatus {
  if (grant_id) return selectedGrant ? "selected_by_grant_id" : "grant_id_not_found";
  if (selectedGrant?.grant_status === "active") return "selected_latest_active_grant";
  if (latestActiveGrant) return "selected_latest_active_grant";
  return allRecords.length > 0 ? "no_active_grant" : "no_grants";
}

function createReadback({
  scope,
  grant_status,
  grant_mode,
  grant_id,
  selection_status,
  selected_grant,
  latest_active_grant,
  grants,
  all_grants,
  invalid_record_count,
}: Pick<
  AutonomyDelegationGrantReadback,
  | "scope"
  | "selection_status"
  | "selected_grant"
  | "latest_active_grant"
  | "grants"
  | "invalid_record_count"
> & {
  grant_status: AutonomyDelegationGrantStatus | null;
  grant_mode: AutonomyDelegationGrantMode | null;
  grant_id: string | null;
  all_grants: AutonomyDelegationGrant[];
}): AutonomyDelegationGrantReadback {
  const boundary = buildAutonomyDelegationGrantAuthorityBoundary();

  return {
    readback_kind: AUTONOMY_DELEGATION_GRANT_READBACK_KIND,
    readback_version: AUTONOMY_DELEGATION_GRANT_READBACK_VERSION,
    scope,
    grant_status_filter: grant_status,
    grant_mode_filter: grant_mode,
    grant_id_filter: grant_id,
    selection_status,
    selected_grant,
    selected_grant_summary: selected_grant
      ? summarizeSelectedGrant(selected_grant)
      : null,
    latest_active_grant,
    grants,
    active_grants: all_grants.filter((grant) => grant.grant_status === "active"),
    paused_grants: all_grants.filter((grant) => grant.grant_status === "paused"),
    revoked_grants: all_grants.filter((grant) => grant.grant_status === "revoked"),
    superseded_grants: all_grants.filter(
      (grant) => grant.grant_status === "superseded",
    ),
    expired_grants: all_grants.filter((grant) => grant.grant_status === "expired"),
    invalid_record_count,
    no_run_no_execution_boundary: boundary,
    raw_material_persisted: false,
    runner_started: false,
    scheduler_started: false,
    daemon_started: false,
    background_work_started: false,
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

function summarizeSelectedGrant(
  grant: AutonomyDelegationGrant,
): AutonomyDelegationGrantSelectedSummary {
  return {
    grant_id: grant.grant_id,
    grant_status: grant.grant_status,
    grant_mode: grant.grant_mode,
    approval_ref: grant.explicit_user_approval.approval_ref,
    approval_text_fingerprint:
      grant.explicit_user_approval.approval_text_fingerprint,
    source_contract_fingerprint:
      grant.source_autonomy_contract.contract_fingerprint ?? null,
    budget_summary: [
      `iterations=${grant.budget.max_iterations}`,
      `codex_tasks=${grant.budget.max_codex_tasks}`,
      `draft_prs=${grant.budget.max_draft_prs}`,
      `file_changes=${grant.budget.max_file_changes}`,
    ].join(", "),
    stop_condition_count: grant.stop_conditions.length,
    forbidden_action_count: grant.forbidden_actions.length,
    authority_boundary_all_false: allValuesFalse(grant.authority_boundary),
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
