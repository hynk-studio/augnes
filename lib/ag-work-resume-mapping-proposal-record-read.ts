import type Database from "better-sqlite3";
import { openDatabase } from "@/lib/db";
import {
  parseProposalRecordRow,
  type AgWorkResumeMappingProposalRecord,
} from "@/lib/ag-work-resume-mapping-proposal-record";

export type AgWorkResumeMappingProposalRecordReadStatus =
  | "proposed"
  | "needs_review"
  | "superseded"
  | "withdrawn"
  | "rejected"
  | "expired";

export type AgWorkResumeMappingProposalRecordReadInput = {
  proposal_id?: unknown;
  foreign_scope?: unknown;
  foreign_work_id?: unknown;
  candidate_local_scope?: unknown;
  candidate_local_work_id?: unknown;
  status?: unknown;
  limit?: unknown;
  db?: Database.Database;
};

export type AgWorkResumeMappingProposalRecordReadAuthorityBoundary = {
  read_only: true;
  proposal_review_metadata_only: true;
  proposal_record_created: false;
  proposal_record_updated: false;
  proposal_record_deleted: false;
  confirmed_mapping_created: false;
  import_record_created: false;
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

export type AgWorkResumeMappingProposalRecordReadResult = {
  ok: boolean;
  status: "fetched" | "listed" | "not_found" | "invalid_input" | "db_error";
  record: AgWorkResumeMappingProposalRecord | null;
  records: AgWorkResumeMappingProposalRecord[];
  filters: {
    proposal_id: string | null;
    foreign_scope: string | null;
    foreign_work_id: string | null;
    candidate_local_scope: string | null;
    candidate_local_work_id: string | null;
    status: AgWorkResumeMappingProposalRecordReadStatus | null;
  };
  limit: number | null;
  warnings: string[];
  failures: string[];
  authority_boundary: AgWorkResumeMappingProposalRecordReadAuthorityBoundary;
  recommended_next_step: string;
};

type NormalizedReadInput =
  | {
      mode: "single";
      proposal_id: string;
      filters: AgWorkResumeMappingProposalRecordReadResult["filters"];
      limit: null;
    }
  | {
      mode: "list";
      filters: AgWorkResumeMappingProposalRecordReadResult["filters"];
      limit: number;
    };

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const STATUS_VALUES = [
  "proposed",
  "needs_review",
  "superseded",
  "withdrawn",
  "rejected",
  "expired",
] as const;
const READ_STATEMENT =
  "AG Resume mapping proposal record reads are read-only review metadata. They do not confirm mappings, import context, record proof/evidence, bind sessions, execute Codex, approve, publish, retry, replay, or merge.";

export function readAgWorkResumeMappingProposalRecords(
  input: AgWorkResumeMappingProposalRecordReadInput,
): AgWorkResumeMappingProposalRecordReadResult {
  const validation = normalizeReadInput(input);
  if ("error" in validation) {
    return failureResult({
      status: "invalid_input",
      failures: [validation.error],
      recommended_next_step:
        "Provide proposal_id, or a supported list filter: foreign_scope plus foreign_work_id, candidate_local_scope plus candidate_local_work_id, or status.",
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
            FROM ag_work_resume_mapping_proposals
            WHERE proposal_id = ?
          `,
        )
        .get(normalized.proposal_id) as Record<string, unknown> | undefined;

      if (!row) {
        return {
          ok: false,
          status: "not_found",
          record: null,
          records: [],
          filters: normalized.filters,
          limit: null,
          warnings: [],
          failures: [`Proposal record not found: ${normalized.proposal_id}`],
          authority_boundary: buildReadAuthorityBoundary(),
          recommended_next_step:
            "Check the proposal_id or list by foreign work, candidate work, or status.",
        };
      }

      const record = parseProposalRecordRow(row);
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
          "User/Core may review this proposal record. This read result is not mapping confirmation, import authorization, proof/evidence authorization, session binding, Codex execution authority, or merge/publish authority.",
      };
    }

    const { where, params } = buildListWhereClause(normalized.filters);
    const rows = db
      .prepare(
        `
          SELECT *
          FROM ag_work_resume_mapping_proposals
          WHERE ${where.join(" AND ")}
          ORDER BY created_at DESC, proposal_id ASC
          LIMIT ?
        `,
      )
      .all(...params, normalized.limit) as Record<string, unknown>[];
    const records = rows.map(parseProposalRecordRow);

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
        "User/Core may review these proposal records. Read results are not mapping confirmation, import authorization, proof/evidence authorization, session binding, Codex execution authority, or merge/publish authority.",
    };
  } catch (error) {
    return failureResult({
      status: "db_error",
      failures: [
        `Failed to read mapping proposal records: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
      recommended_next_step:
        "Stop. Inspect the database read error before retrying proposal record reads.",
    });
  } finally {
    if (ownsDb) db.close();
  }
}

function normalizeReadInput(
  input: AgWorkResumeMappingProposalRecordReadInput,
): { value: NormalizedReadInput } | { error: string } {
  const unknownKeys = Object.keys(input).filter(
    (key) =>
      ![
        "proposal_id",
        "foreign_scope",
        "foreign_work_id",
        "candidate_local_scope",
        "candidate_local_work_id",
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

  const proposalId = cleanString(input.proposal_id);
  const foreignScope = cleanString(input.foreign_scope);
  const foreignWorkId = cleanString(input.foreign_work_id);
  const candidateLocalScope = cleanString(input.candidate_local_scope);
  const candidateLocalWorkId = cleanString(input.candidate_local_work_id);
  const status = normalizeStatus(input.status);
  const limit = normalizeLimit(input.limit);
  const filters = {
    proposal_id: proposalId,
    foreign_scope: foreignScope,
    foreign_work_id: foreignWorkId,
    candidate_local_scope: candidateLocalScope,
    candidate_local_work_id: candidateLocalWorkId,
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
  if (Boolean(candidateLocalScope) !== Boolean(candidateLocalWorkId)) {
    return {
      error:
        "candidate_local_scope and candidate_local_work_id must be supplied together.",
    };
  }

  const hasListFilter = Boolean(
    (foreignScope && foreignWorkId) ||
      (candidateLocalScope && candidateLocalWorkId) ||
      status.value,
  );
  if (proposalId) {
    if (hasListFilter || isSupplied(input.limit)) {
      return {
        error:
          "proposal_id fetch must not be combined with list filters or limit.",
      };
    }
    return {
      value: {
        mode: "single",
        proposal_id: proposalId,
        filters,
        limit: null,
      },
    };
  }

  if (!hasListFilter) {
    return {
      error:
        "At least one supported read filter is required: proposal_id, foreign work, candidate local work, or status.",
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
  filters: AgWorkResumeMappingProposalRecordReadResult["filters"],
) {
  const where = ["1 = 1"];
  const params: string[] = [];
  if (filters.foreign_scope && filters.foreign_work_id) {
    where.push("foreign_scope = ?");
    params.push(filters.foreign_scope);
    where.push("foreign_work_id = ?");
    params.push(filters.foreign_work_id);
  }
  if (filters.candidate_local_scope && filters.candidate_local_work_id) {
    where.push("candidate_local_scope = ?");
    params.push(filters.candidate_local_scope);
    where.push("candidate_local_work_id = ?");
    params.push(filters.candidate_local_work_id);
  }
  if (filters.status) {
    where.push("status = ?");
    params.push(filters.status);
  }
  return { where, params };
}

function normalizeStatus(
  value: unknown,
): { value: AgWorkResumeMappingProposalRecordReadStatus | null; error?: string } {
  if (value === undefined || value === null || value === "") {
    return { value: null };
  }
  if (
    typeof value === "string" &&
    STATUS_VALUES.includes(value as AgWorkResumeMappingProposalRecordReadStatus)
  ) {
    return { value: value as AgWorkResumeMappingProposalRecordReadStatus };
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

function buildReadAuthorityBoundary(): AgWorkResumeMappingProposalRecordReadAuthorityBoundary {
  return {
    read_only: true,
    proposal_review_metadata_only: true,
    proposal_record_created: false,
    proposal_record_updated: false,
    proposal_record_deleted: false,
    confirmed_mapping_created: false,
    import_record_created: false,
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
}): AgWorkResumeMappingProposalRecordReadResult {
  return {
    ok: false,
    status,
    record: null,
    records: [],
    filters: {
      proposal_id: null,
      foreign_scope: null,
      foreign_work_id: null,
      candidate_local_scope: null,
      candidate_local_work_id: null,
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
