import type Database from "better-sqlite3";
import { openDatabase } from "@/lib/db";
import {
  parseConfirmedMappingRecordRow,
  type AgWorkResumeConfirmedMappingRecord,
} from "@/lib/ag-work-resume-confirmed-mapping";

export type AgWorkResumeConfirmedMappingReadStatus =
  | "active"
  | "superseded"
  | "withdrawn"
  | "revoked";

export type AgWorkResumeConfirmedMappingReadInput = {
  mapping_id?: unknown;
  foreign_scope?: unknown;
  foreign_work_id?: unknown;
  local_scope?: unknown;
  local_work_id?: unknown;
  source_proposal_id?: unknown;
  packet_id?: unknown;
  packet_hash?: unknown;
  status?: unknown;
  limit?: unknown;
  db?: Database.Database;
};

export type AgWorkResumeConfirmedMappingReadAuthorityBoundary = {
  read_only: true;
  mapping_identity_metadata_only: true;
  confirmed_mapping_created: false;
  confirmed_mapping_updated: false;
  confirmed_mapping_deleted: false;
  proposal_record_created: false;
  proposal_record_updated: false;
  proposal_record_deleted: false;
  import_record_created: false;
  imported_context_created: false;
  work_item_created: false;
  work_event_created: false;
  proof_recorded: false;
  evidence_recorded: false;
  session_bound: false;
  codex_executed: false;
  approval_granted: false;
  publish_retry_replay_authority: false;
  merge_authority: false;
  durable_approval: "user/Core gated";
  statement: string;
};

export type AgWorkResumeConfirmedMappingReadResult = {
  ok: boolean;
  status: "fetched" | "listed" | "invalid_input" | "not_found" | "db_error";
  record: AgWorkResumeConfirmedMappingRecord | null;
  records: AgWorkResumeConfirmedMappingRecord[];
  filters: {
    mapping_id: string | null;
    foreign_scope: string | null;
    foreign_work_id: string | null;
    local_scope: string | null;
    local_work_id: string | null;
    source_proposal_id: string | null;
    packet_id: string | null;
    packet_hash: string | null;
    status: AgWorkResumeConfirmedMappingReadStatus | null;
  };
  limit: number | null;
  warnings: string[];
  failures: string[];
  authority_boundary: AgWorkResumeConfirmedMappingReadAuthorityBoundary;
  recommended_next_step: string;
};

type NormalizedReadInput =
  | {
      mode: "single";
      mapping_id: string;
      filters: AgWorkResumeConfirmedMappingReadResult["filters"];
      limit: null;
    }
  | {
      mode: "list";
      filters: AgWorkResumeConfirmedMappingReadResult["filters"];
      limit: number;
    };

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const STATUS_VALUES = [
  "active",
  "superseded",
  "withdrawn",
  "revoked",
] as const;
const READ_STATEMENT =
  "AG Resume confirmed mapping reads are read-only mapping identity metadata only and not import/proof/evidence/session/Codex/merge authority.";

export function readAgWorkResumeConfirmedMappings(
  input: AgWorkResumeConfirmedMappingReadInput,
): AgWorkResumeConfirmedMappingReadResult {
  const validation = normalizeReadInput(input);
  if ("error" in validation) {
    return failureResult({
      status: "invalid_input",
      failures: [validation.error],
      recommended_next_step:
        "Provide mapping_id, or a supported list filter: foreign_scope plus foreign_work_id, local_scope plus local_work_id, source_proposal_id, packet_id plus packet_hash, or status.",
    });
  }

  const normalized = validation.value;
  const db = input.db ?? openDatabase();
  const ownsDb = !input.db;

  try {
    if (normalized.mode === "single") {
      const row = db
        .prepare(
          `
            SELECT *
            FROM ag_work_resume_confirmed_mappings
            WHERE mapping_id = ?
          `,
        )
        .get(normalized.mapping_id) as Record<string, unknown> | undefined;

      if (!row) {
        return {
          ok: false,
          status: "not_found",
          record: null,
          records: [],
          filters: normalized.filters,
          limit: null,
          warnings: [],
          failures: [`Confirmed mapping not found: ${normalized.mapping_id}`],
          authority_boundary: buildReadAuthorityBoundary(),
          recommended_next_step:
            "Check the mapping_id or list confirmed mappings by foreign work, local work, source proposal, packet identity, or status.",
        };
      }

      const record = parseConfirmedMappingRecordRow(row);
      return {
        ok: true,
        status: "fetched",
        record,
        records: [record],
        filters: normalized.filters,
        limit: null,
        warnings: [],
        failures: [],
        authority_boundary: buildReadAuthorityBoundary(),
        recommended_next_step:
          "User/Core may review this confirmed mapping identity association. This read result is not import authorization, proof/evidence authorization, session binding, Codex execution authority, or merge/publish authority.",
      };
    }

    const { where, params } = buildListWhereClause(normalized.filters);
    const rows = db
      .prepare(
        `
          SELECT *
          FROM ag_work_resume_confirmed_mappings
          WHERE ${where.join(" AND ")}
          ORDER BY created_at DESC, mapping_id ASC
          LIMIT ?
        `,
      )
      .all(...params, normalized.limit) as Record<string, unknown>[];
    const records = rows.map(parseConfirmedMappingRecordRow);

    return {
      ok: true,
      status: "listed",
      record: null,
      records,
      filters: normalized.filters,
      limit: normalized.limit,
      warnings: [],
      failures: [],
      authority_boundary: buildReadAuthorityBoundary(),
      recommended_next_step:
        "User/Core may review these confirmed mapping identity associations. Read results are not import authorization, proof/evidence authorization, session binding, Codex execution authority, or merge/publish authority.",
    };
  } catch (error) {
    return failureResult({
      status: "db_error",
      failures: [
        `Failed to read confirmed mappings: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
      recommended_next_step:
        "Stop. Inspect the database read error before retrying confirmed mapping reads.",
    });
  } finally {
    if (ownsDb) db.close();
  }
}

function normalizeReadInput(
  input: AgWorkResumeConfirmedMappingReadInput,
): { value: NormalizedReadInput } | { error: string } {
  if (!isRecord(input)) {
    return { error: "Confirmed mapping read input must be a JSON object." };
  }

  const unknownKeys = Object.keys(input).filter(
    (key) =>
      ![
        "mapping_id",
        "foreign_scope",
        "foreign_work_id",
        "local_scope",
        "local_work_id",
        "source_proposal_id",
        "packet_id",
        "packet_hash",
        "status",
        "limit",
        "db",
      ].includes(key),
  );
  if (unknownKeys.length > 0) {
    return {
      error: `Unsupported read input field(s): ${unknownKeys.join(", ")}.`,
    };
  }

  const mappingId = cleanString(input.mapping_id);
  const foreignScope = cleanString(input.foreign_scope);
  const foreignWorkId = cleanString(input.foreign_work_id);
  const localScope = cleanString(input.local_scope);
  const localWorkId = cleanString(input.local_work_id);
  const sourceProposalId = cleanString(input.source_proposal_id);
  const packetId = cleanString(input.packet_id);
  const packetHash = cleanString(input.packet_hash);
  const status = normalizeStatus(input.status);
  const limit = normalizeLimit(input.limit);
  const filters = {
    mapping_id: mappingId,
    foreign_scope: foreignScope,
    foreign_work_id: foreignWorkId,
    local_scope: localScope,
    local_work_id: localWorkId,
    source_proposal_id: sourceProposalId,
    packet_id: packetId,
    packet_hash: packetHash,
    status: status.value,
  };

  if (status.error) {
    return { error: status.error };
  }
  if (limit.error) {
    return { error: limit.error };
  }
  if (Boolean(foreignScope) !== Boolean(foreignWorkId)) {
    return {
      error: "foreign_scope and foreign_work_id must be supplied together.",
    };
  }
  if (Boolean(localScope) !== Boolean(localWorkId)) {
    return {
      error: "local_scope and local_work_id must be supplied together.",
    };
  }
  if (Boolean(packetId) !== Boolean(packetHash)) {
    return {
      error: "packet_id and packet_hash must be supplied together.",
    };
  }

  const hasListFilter = Boolean(
    (foreignScope && foreignWorkId) ||
      (localScope && localWorkId) ||
      sourceProposalId ||
      (packetId && packetHash) ||
      status.value,
  );
  if (mappingId) {
    if (hasListFilter || isSupplied(input.limit)) {
      return {
        error:
          "mapping_id fetch must not be combined with list filters or limit.",
      };
    }
    return {
      value: {
        mode: "single",
        mapping_id: mappingId,
        filters,
        limit: null,
      },
    };
  }

  if (!hasListFilter) {
    return {
      error:
        "At least one supported read filter is required: mapping_id, foreign work, local work, source_proposal_id, packet identity, or status.",
    };
  }

  return {
    value: {
      mode: "list",
      filters,
      limit: limit.value,
    },
  };
}

function buildListWhereClause(
  filters: AgWorkResumeConfirmedMappingReadResult["filters"],
) {
  const where = ["1 = 1"];
  const params: string[] = [];
  if (filters.foreign_scope && filters.foreign_work_id) {
    where.push("foreign_scope = ?");
    params.push(filters.foreign_scope);
    where.push("foreign_work_id = ?");
    params.push(filters.foreign_work_id);
  }
  if (filters.local_scope && filters.local_work_id) {
    where.push("local_scope = ?");
    params.push(filters.local_scope);
    where.push("local_work_id = ?");
    params.push(filters.local_work_id);
  }
  if (filters.source_proposal_id) {
    where.push("source_proposal_id = ?");
    params.push(filters.source_proposal_id);
  }
  if (filters.packet_id && filters.packet_hash) {
    where.push("packet_id = ?");
    params.push(filters.packet_id);
    where.push("packet_hash = ?");
    params.push(filters.packet_hash);
  }
  if (filters.status) {
    where.push("status = ?");
    params.push(filters.status);
  }
  return { where, params };
}

function normalizeStatus(
  value: unknown,
): { value: AgWorkResumeConfirmedMappingReadStatus | null; error?: string } {
  if (value === undefined || value === null || value === "") {
    return { value: null };
  }
  if (
    typeof value === "string" &&
    STATUS_VALUES.includes(value as AgWorkResumeConfirmedMappingReadStatus)
  ) {
    return { value: value as AgWorkResumeConfirmedMappingReadStatus };
  }
  return {
    value: null,
    error: `status must be one of: ${STATUS_VALUES.join(", ")}.`,
  };
}

function normalizeLimit(value: unknown): { value: number; error?: string } {
  if (value === undefined || value === null || value === "") {
    return { value: DEFAULT_LIMIT };
  }
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return { value: DEFAULT_LIMIT, error: "limit must be a positive integer." };
  }
  return { value: Math.min(parsed, MAX_LIMIT) };
}

function buildReadAuthorityBoundary(): AgWorkResumeConfirmedMappingReadAuthorityBoundary {
  return {
    read_only: true,
    mapping_identity_metadata_only: true,
    confirmed_mapping_created: false,
    confirmed_mapping_updated: false,
    confirmed_mapping_deleted: false,
    proposal_record_created: false,
    proposal_record_updated: false,
    proposal_record_deleted: false,
    import_record_created: false,
    imported_context_created: false,
    work_item_created: false,
    work_event_created: false,
    proof_recorded: false,
    evidence_recorded: false,
    session_bound: false,
    codex_executed: false,
    approval_granted: false,
    publish_retry_replay_authority: false,
    merge_authority: false,
    durable_approval: "user/Core gated",
    statement: READ_STATEMENT,
  };
}

function failureResult({
  status,
  failures,
  recommended_next_step,
}: {
  status: "invalid_input" | "db_error";
  failures: string[];
  recommended_next_step: string;
}): AgWorkResumeConfirmedMappingReadResult {
  return {
    ok: false,
    status,
    record: null,
    records: [],
    filters: {
      mapping_id: null,
      foreign_scope: null,
      foreign_work_id: null,
      local_scope: null,
      local_work_id: null,
      source_proposal_id: null,
      packet_id: null,
      packet_hash: null,
      status: null,
    },
    limit: null,
    warnings: [],
    failures,
    authority_boundary: buildReadAuthorityBoundary(),
    recommended_next_step,
  };
}

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function isSupplied(value: unknown) {
  return value !== undefined && value !== null && value !== "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
