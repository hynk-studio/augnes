import type Database from "better-sqlite3";
import { openDatabase } from "@/lib/db";
import {
  parseReconciliationCandidateRecordRow,
  type AgWorkResumeProofEvidenceReconciliationCandidateRecord,
} from "@/lib/ag-work-resume-proof-evidence-reconciliation-candidate";

export type AgWorkResumeProofEvidenceReconciliationCandidateReadStatus =
  | "proposed"
  | "accepted_for_future_recording"
  | "rejected"
  | "deferred"
  | "superseded"
  | "withdrawn"
  | "revoked";

export type AgWorkResumeProofEvidenceReconciliationCandidateForeignRefType =
  | "proof"
  | "evidence"
  | "action"
  | "session"
  | "git"
  | "evidence_pack"
  | "handoff"
  | "other";

export type AgWorkResumeProofEvidenceReconciliationCandidateReadInput = {
  candidate_id?: unknown;
  import_id?: unknown;
  mapping_id?: unknown;
  foreign_ref_type?: unknown;
  foreign_ref_id?: unknown;
  local_target_scope?: unknown;
  local_target_work_id?: unknown;
  status?: unknown;
  proposed_by?: unknown;
  reviewed_by?: unknown;
  limit?: unknown;
  db?: Database.Database;
};

export type AgWorkResumeProofEvidenceReconciliationCandidateReadAuthorityBoundary = {
  read_only: true;
  review_metadata_only: true;
  reconciliation_candidate_created: false;
  reconciliation_candidate_updated: false;
  reconciliation_candidate_deleted: false;
  proof_recorded: false;
  evidence_recorded: false;
  session_bound: false;
  codex_executed: false;
  work_item_created: false;
  work_event_created: false;
  imported_context_updated: false;
  confirmed_mapping_updated: false;
  proposal_record_updated: false;
  approval_granted: false;
  publish_retry_replay_authority: false;
  merge_authority: false;
  durable_approval: "user/Core gated";
  statement: string;
};

export type AgWorkResumeProofEvidenceReconciliationCandidateReadResult = {
  ok: boolean;
  status: "fetched" | "listed" | "invalid_input" | "not_found" | "db_error";
  record: AgWorkResumeProofEvidenceReconciliationCandidateRecord | null;
  records: AgWorkResumeProofEvidenceReconciliationCandidateRecord[];
  filters: {
    candidate_id: string | null;
    import_id: string | null;
    mapping_id: string | null;
    foreign_ref_type: AgWorkResumeProofEvidenceReconciliationCandidateForeignRefType | null;
    foreign_ref_id: string | null;
    local_target_scope: string | null;
    local_target_work_id: string | null;
    status: AgWorkResumeProofEvidenceReconciliationCandidateReadStatus | null;
    proposed_by: string | null;
    reviewed_by: string | null;
  };
  limit: number | null;
  warnings: string[];
  failures: string[];
  authority_boundary: AgWorkResumeProofEvidenceReconciliationCandidateReadAuthorityBoundary;
  recommended_next_step: string;
};

type NormalizedReadInput =
  | {
      mode: "single";
      candidate_id: string;
      filters: AgWorkResumeProofEvidenceReconciliationCandidateReadResult["filters"];
      limit: null;
    }
  | {
      mode: "list";
      filters: AgWorkResumeProofEvidenceReconciliationCandidateReadResult["filters"];
      limit: number;
    };

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const STATUS_VALUES = [
  "proposed",
  "accepted_for_future_recording",
  "rejected",
  "deferred",
  "superseded",
  "withdrawn",
  "revoked",
] as const;
const FOREIGN_REF_TYPES = [
  "proof",
  "evidence",
  "action",
  "session",
  "git",
  "evidence_pack",
  "handoff",
  "other",
] as const;
const READ_STATEMENT =
  "Reconciliation candidate reads expose review metadata only and are not proof/evidence/session/Codex/merge authority.";

export function readAgWorkResumeProofEvidenceReconciliationCandidates(
  input: AgWorkResumeProofEvidenceReconciliationCandidateReadInput,
): AgWorkResumeProofEvidenceReconciliationCandidateReadResult {
  const validation = normalizeReadInput(input);
  if ("error" in validation) {
    return failureResult({
      status: "invalid_input",
      failures: [validation.error],
      recommended_next_step:
        "Provide candidate_id, or a supported list filter: import_id, mapping_id, foreign_ref_type plus foreign_ref_id, local_target_scope plus local_target_work_id, status, proposed_by, or reviewed_by.",
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
            FROM ag_work_resume_proof_evidence_reconciliation_candidates
            WHERE candidate_id = ?
          `,
        )
        .get(normalized.candidate_id) as Record<string, unknown> | undefined;

      if (!row) {
        return {
          ok: false,
          status: "not_found",
          record: null,
          records: [],
          filters: normalized.filters,
          limit: null,
          warnings: [],
          failures: [`Reconciliation candidate not found: ${normalized.candidate_id}`],
          authority_boundary: buildReadAuthorityBoundary(),
          recommended_next_step:
            "Check the candidate_id or list reconciliation candidate review metadata by import, mapping, foreign ref, local target, status, proposer, or reviewer.",
        };
      }

      const record = parseReconciliationCandidateRecordRow(row);
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
          "User/Core may review this reconciliation candidate metadata. This read result is not proof/evidence recording, session binding, Codex execution authority, work item/event creation, approval, publish, retry, replay, or merge authority.",
      };
    }

    const { where, params } = buildListWhereClause(normalized.filters);
    const rows = db
      .prepare(
        `
          SELECT *
          FROM ag_work_resume_proof_evidence_reconciliation_candidates
          WHERE ${where.join(" AND ")}
          ORDER BY created_at DESC, candidate_id ASC
          LIMIT ?
        `,
      )
      .all(...params, normalized.limit) as Record<string, unknown>[];
    const records = rows.map(parseReconciliationCandidateRecordRow);

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
        "User/Core may review these reconciliation candidate metadata rows. Read results are not proof/evidence recording, session binding, Codex execution authority, work item/event creation, approval, publish, retry, replay, or merge authority.",
    };
  } catch (error) {
    return failureResult({
      status: "db_error",
      failures: [
        `Failed to read reconciliation candidates: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
      recommended_next_step:
        "Stop. Inspect the database read error before retrying reconciliation candidate reads.",
    });
  } finally {
    if (ownsDb) db.close();
  }
}

function normalizeReadInput(
  input: AgWorkResumeProofEvidenceReconciliationCandidateReadInput,
): { value: NormalizedReadInput } | { error: string } {
  if (!isRecord(input)) {
    return { error: "Reconciliation candidate read input must be a JSON object." };
  }

  const unknownKeys = Object.keys(input).filter(
    (key) =>
      ![
        "candidate_id",
        "import_id",
        "mapping_id",
        "foreign_ref_type",
        "foreign_ref_id",
        "local_target_scope",
        "local_target_work_id",
        "status",
        "proposed_by",
        "reviewed_by",
        "limit",
        "db",
      ].includes(key),
  );
  if (unknownKeys.length > 0) {
    return {
      error: `Unsupported read input field(s): ${unknownKeys.join(", ")}.`,
    };
  }

  const candidateId = cleanString(input.candidate_id);
  const importId = cleanString(input.import_id);
  const mappingId = cleanString(input.mapping_id);
  const foreignRefType = normalizeForeignRefType(input.foreign_ref_type);
  const foreignRefId = cleanString(input.foreign_ref_id);
  const localTargetScope = cleanString(input.local_target_scope);
  const localTargetWorkId = cleanString(input.local_target_work_id);
  const status = normalizeStatus(input.status);
  const proposedBy = cleanString(input.proposed_by);
  const reviewedBy = cleanString(input.reviewed_by);
  const limit = normalizeLimit(input.limit);
  const filters = {
    candidate_id: candidateId,
    import_id: importId,
    mapping_id: mappingId,
    foreign_ref_type: foreignRefType.value,
    foreign_ref_id: foreignRefId,
    local_target_scope: localTargetScope,
    local_target_work_id: localTargetWorkId,
    status: status.value,
    proposed_by: proposedBy,
    reviewed_by: reviewedBy,
  };

  if (foreignRefType.error) {
    return { error: foreignRefType.error };
  }
  if (status.error) {
    return { error: status.error };
  }
  if (limit.error) {
    return { error: limit.error };
  }
  if (Boolean(foreignRefType.value) !== Boolean(foreignRefId)) {
    return {
      error: "foreign_ref_type and foreign_ref_id must be supplied together.",
    };
  }
  if (Boolean(localTargetScope) !== Boolean(localTargetWorkId)) {
    return {
      error:
        "local_target_scope and local_target_work_id must be supplied together.",
    };
  }

  const hasListFilter = Boolean(
    importId ||
      mappingId ||
      (foreignRefType.value && foreignRefId) ||
      (localTargetScope && localTargetWorkId) ||
      status.value ||
      proposedBy ||
      reviewedBy,
  );
  if (candidateId) {
    if (hasListFilter || isSupplied(input.limit)) {
      return {
        error:
          "candidate_id fetch must not be combined with list filters or limit.",
      };
    }
    return {
      value: {
        mode: "single",
        candidate_id: candidateId,
        filters,
        limit: null,
      },
    };
  }

  if (!hasListFilter) {
    return {
      error:
        "At least one supported read filter is required: candidate_id, import_id, mapping_id, foreign ref, local target, status, proposed_by, or reviewed_by.",
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
  filters: AgWorkResumeProofEvidenceReconciliationCandidateReadResult["filters"],
) {
  const where = ["1 = 1"];
  const params: string[] = [];
  if (filters.import_id) {
    where.push("import_id = ?");
    params.push(filters.import_id);
  }
  if (filters.mapping_id) {
    where.push("mapping_id = ?");
    params.push(filters.mapping_id);
  }
  if (filters.foreign_ref_type && filters.foreign_ref_id) {
    where.push("foreign_ref_type = ?");
    params.push(filters.foreign_ref_type);
    where.push("foreign_ref_id = ?");
    params.push(filters.foreign_ref_id);
  }
  if (filters.local_target_scope && filters.local_target_work_id) {
    where.push("local_target_scope = ?");
    params.push(filters.local_target_scope);
    where.push("local_target_work_id = ?");
    params.push(filters.local_target_work_id);
  }
  if (filters.status) {
    where.push("status = ?");
    params.push(filters.status);
  }
  if (filters.proposed_by) {
    where.push("proposed_by = ?");
    params.push(filters.proposed_by);
  }
  if (filters.reviewed_by) {
    where.push("reviewed_by = ?");
    params.push(filters.reviewed_by);
  }
  return { where, params };
}

function normalizeForeignRefType(
  value: unknown,
): {
  value: AgWorkResumeProofEvidenceReconciliationCandidateForeignRefType | null;
  error?: string;
} {
  if (value === undefined || value === null || value === "") {
    return { value: null };
  }
  if (
    typeof value === "string" &&
    FOREIGN_REF_TYPES.includes(
      value as AgWorkResumeProofEvidenceReconciliationCandidateForeignRefType,
    )
  ) {
    return {
      value:
        value as AgWorkResumeProofEvidenceReconciliationCandidateForeignRefType,
    };
  }
  return {
    value: null,
    error: `foreign_ref_type must be one of: ${FOREIGN_REF_TYPES.join(", ")}.`,
  };
}

function normalizeStatus(
  value: unknown,
): {
  value: AgWorkResumeProofEvidenceReconciliationCandidateReadStatus | null;
  error?: string;
} {
  if (value === undefined || value === null || value === "") {
    return { value: null };
  }
  if (
    typeof value === "string" &&
    STATUS_VALUES.includes(
      value as AgWorkResumeProofEvidenceReconciliationCandidateReadStatus,
    )
  ) {
    return { value: value as AgWorkResumeProofEvidenceReconciliationCandidateReadStatus };
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

function buildReadAuthorityBoundary(): AgWorkResumeProofEvidenceReconciliationCandidateReadAuthorityBoundary {
  return {
    read_only: true,
    review_metadata_only: true,
    reconciliation_candidate_created: false,
    reconciliation_candidate_updated: false,
    reconciliation_candidate_deleted: false,
    proof_recorded: false,
    evidence_recorded: false,
    session_bound: false,
    codex_executed: false,
    work_item_created: false,
    work_event_created: false,
    imported_context_updated: false,
    confirmed_mapping_updated: false,
    proposal_record_updated: false,
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
}): AgWorkResumeProofEvidenceReconciliationCandidateReadResult {
  return {
    ok: false,
    status,
    record: null,
    records: [],
    filters: {
      candidate_id: null,
      import_id: null,
      mapping_id: null,
      foreign_ref_type: null,
      foreign_ref_id: null,
      local_target_scope: null,
      local_target_work_id: null,
      status: null,
      proposed_by: null,
      reviewed_by: null,
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
