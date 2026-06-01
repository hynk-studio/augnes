import type Database from "better-sqlite3";
import { openDatabase } from "@/lib/db";
import {
  parseImportedContextRecordRow,
  type AgWorkResumeImportedContextRecord,
} from "@/lib/ag-work-resume-imported-context";

export type AgWorkResumeImportedContextReadStatus =
  | "review_metadata"
  | "superseded"
  | "withdrawn"
  | "revoked";

export type AgWorkResumeImportedContextReadInput = {
  import_id?: unknown;
  mapping_id?: unknown;
  foreign_scope?: unknown;
  foreign_work_id?: unknown;
  local_scope?: unknown;
  local_work_id?: unknown;
  packet_id?: unknown;
  packet_hash?: unknown;
  status?: unknown;
  created_by?: unknown;
  limit?: unknown;
  db?: Database.Database;
};

export type AgWorkResumeImportedContextReadAuthorityBoundary = {
  read_only: true;
  review_metadata_only: true;
  imported_context_created: false;
  imported_context_updated: false;
  imported_context_deleted: false;
  confirmed_mapping_created: false;
  confirmed_mapping_updated: false;
  proposal_record_updated: false;
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

export type AgWorkResumeImportedContextReadResult = {
  ok: boolean;
  status: "fetched" | "listed" | "invalid_input" | "not_found" | "db_error";
  record: AgWorkResumeImportedContextRecord | null;
  records: AgWorkResumeImportedContextRecord[];
  filters: {
    import_id: string | null;
    mapping_id: string | null;
    foreign_scope: string | null;
    foreign_work_id: string | null;
    local_scope: string | null;
    local_work_id: string | null;
    packet_id: string | null;
    packet_hash: string | null;
    status: AgWorkResumeImportedContextReadStatus | null;
    created_by: string | null;
  };
  limit: number | null;
  warnings: string[];
  failures: string[];
  authority_boundary: AgWorkResumeImportedContextReadAuthorityBoundary;
  recommended_next_step: string;
};

type NormalizedReadInput =
  | {
      mode: "single";
      import_id: string;
      filters: AgWorkResumeImportedContextReadResult["filters"];
      limit: null;
    }
  | {
      mode: "list";
      filters: AgWorkResumeImportedContextReadResult["filters"];
      limit: number;
    };

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const STATUS_VALUES = [
  "review_metadata",
  "superseded",
  "withdrawn",
  "revoked",
] as const;
const READ_STATEMENT =
  "Imported context reads expose bounded review metadata only and are not proof/evidence/session/Codex/merge authority.";

export function readAgWorkResumeImportedContexts(
  input: AgWorkResumeImportedContextReadInput,
): AgWorkResumeImportedContextReadResult {
  const validation = normalizeReadInput(input);
  if ("error" in validation) {
    return failureResult({
      status: "invalid_input",
      failures: [validation.error],
      recommended_next_step:
        "Provide import_id, or a supported list filter: mapping_id, foreign_scope plus foreign_work_id, local_scope plus local_work_id, packet_id plus packet_hash, status, or created_by.",
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
            FROM ag_work_resume_imported_contexts
            WHERE import_id = ?
          `,
        )
        .get(normalized.import_id) as Record<string, unknown> | undefined;

      if (!row) {
        return {
          ok: false,
          status: "not_found",
          record: null,
          records: [],
          filters: normalized.filters,
          limit: null,
          warnings: [],
          failures: [`Imported context not found: ${normalized.import_id}`],
          authority_boundary: buildReadAuthorityBoundary(),
          recommended_next_step:
            "Check the import_id or list imported context review metadata by mapping, foreign work, local work, packet identity, status, or creator.",
        };
      }

      const record = parseImportedContextRecordRow(row);
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
          "User/Core may review this imported context metadata. This read result is not proof/evidence authorization, session binding, Codex execution authority, work item/event creation, approval, publish, retry, replay, or merge authority.",
      };
    }

    const { where, params } = buildListWhereClause(normalized.filters);
    const rows = db
      .prepare(
        `
          SELECT *
          FROM ag_work_resume_imported_contexts
          WHERE ${where.join(" AND ")}
          ORDER BY created_at DESC, import_id ASC
          LIMIT ?
        `,
      )
      .all(...params, normalized.limit) as Record<string, unknown>[];
    const records = rows.map(parseImportedContextRecordRow);

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
        "User/Core may review these imported context metadata rows. Read results are not proof/evidence authorization, session binding, Codex execution authority, work item/event creation, approval, publish, retry, replay, or merge authority.",
    };
  } catch (error) {
    return failureResult({
      status: "db_error",
      failures: [
        `Failed to read imported contexts: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
      recommended_next_step:
        "Stop. Inspect the database read error before retrying imported context reads.",
    });
  } finally {
    if (ownsDb) db.close();
  }
}

function normalizeReadInput(
  input: AgWorkResumeImportedContextReadInput,
): { value: NormalizedReadInput } | { error: string } {
  if (!isRecord(input)) {
    return { error: "Imported context read input must be a JSON object." };
  }

  const unknownKeys = Object.keys(input).filter(
    (key) =>
      ![
        "import_id",
        "mapping_id",
        "foreign_scope",
        "foreign_work_id",
        "local_scope",
        "local_work_id",
        "packet_id",
        "packet_hash",
        "status",
        "created_by",
        "limit",
        "db",
      ].includes(key),
  );
  if (unknownKeys.length > 0) {
    return {
      error: `Unsupported read input field(s): ${unknownKeys.join(", ")}.`,
    };
  }

  const importId = cleanString(input.import_id);
  const mappingId = cleanString(input.mapping_id);
  const foreignScope = cleanString(input.foreign_scope);
  const foreignWorkId = cleanString(input.foreign_work_id);
  const localScope = cleanString(input.local_scope);
  const localWorkId = cleanString(input.local_work_id);
  const packetId = cleanString(input.packet_id);
  const packetHash = cleanString(input.packet_hash);
  const status = normalizeStatus(input.status);
  const createdBy = cleanString(input.created_by);
  const limit = normalizeLimit(input.limit);
  const filters = {
    import_id: importId,
    mapping_id: mappingId,
    foreign_scope: foreignScope,
    foreign_work_id: foreignWorkId,
    local_scope: localScope,
    local_work_id: localWorkId,
    packet_id: packetId,
    packet_hash: packetHash,
    status: status.value,
    created_by: createdBy,
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
    mappingId ||
      (foreignScope && foreignWorkId) ||
      (localScope && localWorkId) ||
      (packetId && packetHash) ||
      status.value ||
      createdBy,
  );
  if (importId) {
    if (hasListFilter || isSupplied(input.limit)) {
      return {
        error:
          "import_id fetch must not be combined with list filters or limit.",
      };
    }
    return {
      value: {
        mode: "single",
        import_id: importId,
        filters,
        limit: null,
      },
    };
  }

  if (!hasListFilter) {
    return {
      error:
        "At least one supported read filter is required: import_id, mapping_id, foreign work, local work, packet identity, status, or created_by.",
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
  filters: AgWorkResumeImportedContextReadResult["filters"],
) {
  const where = ["1 = 1"];
  const params: string[] = [];
  if (filters.mapping_id) {
    where.push("mapping_id = ?");
    params.push(filters.mapping_id);
  }
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
  if (filters.created_by) {
    where.push("created_by = ?");
    params.push(filters.created_by);
  }
  return { where, params };
}

function normalizeStatus(
  value: unknown,
): { value: AgWorkResumeImportedContextReadStatus | null; error?: string } {
  if (value === undefined || value === null || value === "") {
    return { value: null };
  }
  if (
    typeof value === "string" &&
    STATUS_VALUES.includes(value as AgWorkResumeImportedContextReadStatus)
  ) {
    return { value: value as AgWorkResumeImportedContextReadStatus };
  }
  return {
    value: null,
    error: `status must be one of: ${STATUS_VALUES.join(", ")}.`,
  };
}

function normalizeLimit(value: unknown): { value: number; error?: string } {
  if (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim().length === 0)
  ) {
    return { value: DEFAULT_LIMIT };
  }
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return { value: DEFAULT_LIMIT, error: "limit must be a positive integer." };
  }
  return { value: Math.min(parsed, MAX_LIMIT) };
}

function buildReadAuthorityBoundary(): AgWorkResumeImportedContextReadAuthorityBoundary {
  return {
    read_only: true,
    review_metadata_only: true,
    imported_context_created: false,
    imported_context_updated: false,
    imported_context_deleted: false,
    confirmed_mapping_created: false,
    confirmed_mapping_updated: false,
    proposal_record_updated: false,
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
}): AgWorkResumeImportedContextReadResult {
  return {
    ok: false,
    status,
    record: null,
    records: [],
    filters: {
      import_id: null,
      mapping_id: null,
      foreign_scope: null,
      foreign_work_id: null,
      local_scope: null,
      local_work_id: null,
      packet_id: null,
      packet_hash: null,
      status: null,
      created_by: null,
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
