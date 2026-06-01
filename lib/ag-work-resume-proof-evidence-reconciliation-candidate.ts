import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { openDatabase } from "@/lib/db";
import {
  parseImportedContextRecordRow,
  type AgWorkResumeImportedContextRecord,
} from "@/lib/ag-work-resume-imported-context";

export type AgWorkResumeProofEvidenceReconciliationCandidateCreateInput = {
  import_id: unknown;
  mapping_id?: unknown;
  foreign_ref_type: unknown;
  foreign_ref_id: unknown;
  local_target_scope: unknown;
  local_target_work_id: unknown;
  summary: unknown;
  redaction_status: unknown;
  proposed_by: unknown;
  proposed_reason: unknown;
  created_at?: unknown;
  db?: Database.Database;
  now?: string;
};

export type AgWorkResumeProofEvidenceReconciliationCandidateAuthorityBoundary = {
  reconciliation_candidate_created: boolean;
  review_metadata_only: true;
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

export type AgWorkResumeProofEvidenceReconciliationCandidateRecord = {
  candidate_id: string;
  record_kind: "ag_work_resume_proof_evidence_reconciliation_candidate";
  schema: "augnes.ag_work_resume_proof_evidence_reconciliation_candidate.v0_1";
  status:
    | "proposed"
    | "accepted_for_future_recording"
    | "rejected"
    | "deferred"
    | "superseded"
    | "withdrawn"
    | "revoked";
  import_id: string;
  mapping_id: string;
  foreign_ref_type: ForeignRefType;
  foreign_ref_id: string;
  local_target_scope: string;
  local_target_work_id: string;
  summary: string;
  redaction_status: Record<string, unknown>;
  proposed_by: string;
  proposed_reason: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  supersedes_candidate_id: string | null;
  superseded_by_candidate_id: string | null;
  authority_boundary: AgWorkResumeProofEvidenceReconciliationCandidateAuthorityBoundary;
  created_at: string;
  updated_at: string;
};

export type AgWorkResumeProofEvidenceReconciliationCandidateCreateResult = {
  ok: boolean;
  status:
    | "created"
    | "invalid_input"
    | "imported_context_not_found"
    | "imported_context_not_allowed"
    | "imported_context_mismatch"
    | "redaction_blocked"
    | "duplicate_candidate"
    | "db_error";
  candidate_id: string | null;
  record: AgWorkResumeProofEvidenceReconciliationCandidateRecord | null;
  imported_context: AgWorkResumeImportedContextRecord | null;
  warnings: string[];
  failures: string[];
  authority_boundary: AgWorkResumeProofEvidenceReconciliationCandidateAuthorityBoundary;
  recommended_next_step: string;
};

type ForeignRefType =
  | "proof"
  | "evidence"
  | "action"
  | "session"
  | "git"
  | "evidence_pack"
  | "handoff"
  | "other";

type NormalizedCreateInput = {
  import_id: string;
  mapping_id?: string;
  foreign_ref_type: ForeignRefType;
  foreign_ref_id: string;
  local_target_scope: string;
  local_target_work_id: string;
  summary: string;
  redaction_status: Record<string, unknown>;
  proposed_by: string;
  proposed_reason: string;
  created_at: string;
};

type CandidateInsertRow = {
  candidate_id: string;
  record_kind: "ag_work_resume_proof_evidence_reconciliation_candidate";
  schema: "augnes.ag_work_resume_proof_evidence_reconciliation_candidate.v0_1";
  status: "proposed";
  import_id: string;
  mapping_id: string;
  foreign_ref_type: ForeignRefType;
  foreign_ref_id: string;
  local_target_scope: string;
  local_target_work_id: string;
  summary: string;
  redaction_status: string;
  proposed_by: string;
  proposed_reason: string;
  authority_boundary: string;
  created_at: string;
  updated_at: string;
};

const RECORD_KIND = "ag_work_resume_proof_evidence_reconciliation_candidate" as const;
const RECORD_SCHEMA =
  "augnes.ag_work_resume_proof_evidence_reconciliation_candidate.v0_1" as const;
const RESULT_STATEMENT =
  "Reconciliation candidate creation is review metadata only and not proof/evidence/session/Codex/merge authority.";
const MAX_TEXT_LENGTH = 4000;
const MAX_JSON_TEXT_LENGTH = 12000;
const FOREIGN_REF_TYPES = new Set<ForeignRefType>([
  "proof",
  "evidence",
  "action",
  "session",
  "git",
  "evidence_pack",
  "handoff",
  "other",
]);
const ACTIVE_DUPLICATE_STATUSES = ["proposed", "accepted_for_future_recording"] as const;

export function createAgWorkResumeProofEvidenceReconciliationCandidate(
  input: AgWorkResumeProofEvidenceReconciliationCandidateCreateInput,
): AgWorkResumeProofEvidenceReconciliationCandidateCreateResult {
  const validation = normalizeCreateInput(input);
  if ("error" in validation) {
    return failureResult({
      status: validation.status ?? "invalid_input",
      failures: [validation.error],
      recommended_next_step:
        validation.status === "redaction_blocked"
          ? "Stop. Provide redaction_status with safe true and all raw/secret payload flags false before creating candidate review metadata."
          : "Stop. Provide import_id, foreign_ref_type, foreign_ref_id, local target identity, summary, redaction_status, proposed_by, and proposed_reason.",
    });
  }

  const normalized = validation.value;
  const db = input.db ?? openDatabase();
  const ownsDb = !input.db;

  try {
    return db.transaction(() => {
      const importedContextRow = selectImportedContextRecordRow(
        db,
        normalized.import_id,
      );
      if (!importedContextRow) {
        return failureResult({
          status: "imported_context_not_found",
          failures: [`Imported context not found: ${normalized.import_id}`],
          recommended_next_step:
            "Stop. Create or select an existing imported context review metadata row before proposing reconciliation candidates.",
        });
      }

      const importedContext = parseImportedContextRecordRow(importedContextRow);
      if (importedContext.status !== "review_metadata") {
        return failureResult({
          status: "imported_context_not_allowed",
          imported_context: importedContext,
          failures: [
            `Imported context ${importedContext.import_id} is ${importedContext.status}, not review_metadata.`,
          ],
          recommended_next_step:
            "Stop. Reconciliation candidate creation requires imported context review_metadata status.",
        });
      }

      const mismatchFailures = importedContextMismatchFailures(
        normalized,
        importedContext,
      );
      if (mismatchFailures.length > 0) {
        return failureResult({
          status: "imported_context_mismatch",
          imported_context: importedContext,
          failures: mismatchFailures,
          recommended_next_step:
            "Stop. Candidate mapping and local target identity must match the imported context row.",
        });
      }

      if (
        !localWorkExists(
          db,
          normalized.local_target_scope,
          normalized.local_target_work_id,
        )
      ) {
        return failureResult({
          status: "imported_context_mismatch",
          imported_context: importedContext,
          failures: [
            `Local target work not found: ${normalized.local_target_scope}/${normalized.local_target_work_id}.`,
          ],
          recommended_next_step:
            "Stop. Candidate local target identity must refer to existing local work.",
        });
      }

      const mappingId = normalized.mapping_id ?? importedContext.mapping_id;
      const duplicate = selectActiveDuplicateCandidate(db, normalized, mappingId);
      if (duplicate) {
        return failureResult({
          status: "duplicate_candidate",
          candidate_id: stringField(duplicate.candidate_id),
          imported_context: importedContext,
          failures: [
            `A proposed or accepted_for_future_recording candidate already exists for ${normalized.import_id}/${normalized.foreign_ref_type}/${normalized.foreign_ref_id}/${normalized.local_target_scope}/${normalized.local_target_work_id}.`,
          ],
          recommended_next_step:
            "Stop. Review the existing reconciliation candidate before proposing another active candidate for the same imported context foreign ref.",
        });
      }

      const insertRow = buildInsertRow(normalized, importedContext, mappingId);
      try {
        db.prepare(
          `
            INSERT INTO ag_work_resume_proof_evidence_reconciliation_candidates (
              candidate_id,
              record_kind,
              schema,
              status,
              import_id,
              mapping_id,
              foreign_ref_type,
              foreign_ref_id,
              local_target_scope,
              local_target_work_id,
              summary,
              redaction_status,
              proposed_by,
              proposed_reason,
              authority_boundary,
              created_at,
              updated_at
            )
            VALUES (
              @candidate_id,
              @record_kind,
              @schema,
              @status,
              @import_id,
              @mapping_id,
              @foreign_ref_type,
              @foreign_ref_id,
              @local_target_scope,
              @local_target_work_id,
              @summary,
              @redaction_status,
              @proposed_by,
              @proposed_reason,
              @authority_boundary,
              @created_at,
              @updated_at
            )
          `,
        ).run(insertRow);
      } catch (error) {
        if (isConstraintConflict(error)) {
          return failureResult({
            status: "duplicate_candidate",
            candidate_id: insertRow.candidate_id,
            imported_context: importedContext,
            failures: [
              `Candidate id already exists or violates a uniqueness constraint: ${insertRow.candidate_id}.`,
            ],
            recommended_next_step:
              "Stop. Review the existing reconciliation candidate before retrying.",
          });
        }
        throw error;
      }

      const insertedRow = selectCandidateRecordRow(db, insertRow.candidate_id);
      if (!insertedRow) {
        throw new Error("Inserted reconciliation candidate could not be read back.");
      }

      return {
        ok: true,
        status: "created" as const,
        candidate_id: insertRow.candidate_id,
        record: parseCandidateRecordRow(insertedRow),
        imported_context: importedContext,
        warnings: [],
        failures: [],
        authority_boundary: buildAuthorityBoundary(true),
        recommended_next_step:
          "User/Core may review the reconciliation candidate metadata. It is not proof/evidence recording, session binding, Codex execution authority, approval, publish, retry, replay, or merge authority.",
      };
    })();
  } catch (error) {
    return failureResult({
      status: "db_error",
      failures: [
        `Failed to create reconciliation candidate: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
      recommended_next_step:
        "Stop. Inspect the database error before retrying reconciliation candidate creation.",
    });
  } finally {
    if (ownsDb) db.close();
  }
}

function normalizeCreateInput(
  input: AgWorkResumeProofEvidenceReconciliationCandidateCreateInput,
):
  | { value: NormalizedCreateInput }
  | {
      error: string;
      status?: Exclude<
        AgWorkResumeProofEvidenceReconciliationCandidateCreateResult["status"],
        "created"
      >;
    } {
  if (!isRecord(input)) {
    return { error: "Reconciliation candidate input must be a JSON object." };
  }

  const allowedKeys = new Set([
    "import_id",
    "mapping_id",
    "foreign_ref_type",
    "foreign_ref_id",
    "local_target_scope",
    "local_target_work_id",
    "summary",
    "redaction_status",
    "proposed_by",
    "proposed_reason",
    "created_at",
    "db",
    "now",
  ]);
  const unknownKeys = Object.keys(input).filter((key) => !allowedKeys.has(key));
  if (unknownKeys.length > 0) {
    return { error: `Unknown field(s): ${unknownKeys.join(", ")}.` };
  }

  const importId = cleanString(input.import_id);
  if (!importId) return { error: "import_id must be a non-empty string." };

  const mappingId = normalizeOptionalString(input.mapping_id, "mapping_id");
  if ("error" in mappingId) return { error: mappingId.error };

  const foreignRefType = cleanString(input.foreign_ref_type);
  if (!foreignRefType) {
    return { error: "foreign_ref_type must be a supported non-empty string." };
  }
  if (!FOREIGN_REF_TYPES.has(foreignRefType as ForeignRefType)) {
    return {
      error:
        "foreign_ref_type must be one of proof, evidence, action, session, git, evidence_pack, handoff, or other.",
    };
  }

  const foreignRefId = cleanString(input.foreign_ref_id);
  if (!foreignRefId) {
    return { error: "foreign_ref_id must be a non-empty string." };
  }

  const localTargetScope = cleanString(input.local_target_scope);
  if (!localTargetScope) {
    return { error: "local_target_scope must be a non-empty string." };
  }

  const localTargetWorkId = cleanString(input.local_target_work_id);
  if (!localTargetWorkId) {
    return { error: "local_target_work_id must be a non-empty string." };
  }

  const summary = boundedRequiredString(input.summary, "summary");
  if ("error" in summary) return summary;

  const proposedBy = cleanString(input.proposed_by);
  if (!proposedBy) return { error: "proposed_by must be a non-empty string." };

  const proposedReason = boundedRequiredString(
    input.proposed_reason,
    "proposed_reason",
  );
  if ("error" in proposedReason) return proposedReason;

  const now = normalizeOptionalTimestamp(input.now, "now");
  if ("error" in now) return { error: now.error };
  const createdAt = normalizeCreatedAt(input.created_at, now.value);
  if ("error" in createdAt) return { error: createdAt.error };

  const redactionStatus = normalizeRequiredRedactionStatus(input.redaction_status);
  if ("error" in redactionStatus) {
    return { error: redactionStatus.error, status: "redaction_blocked" };
  }

  return {
    value: {
      import_id: importId,
      mapping_id: mappingId.value,
      foreign_ref_type: foreignRefType as ForeignRefType,
      foreign_ref_id: foreignRefId,
      local_target_scope: localTargetScope,
      local_target_work_id: localTargetWorkId,
      summary: summary.value,
      redaction_status: redactionStatus.value,
      proposed_by: proposedBy,
      proposed_reason: proposedReason.value,
      created_at: createdAt.value,
    },
  };
}

function importedContextMismatchFailures(
  input: NormalizedCreateInput,
  importedContext: AgWorkResumeImportedContextRecord,
) {
  const failures: string[] = [];
  if (input.mapping_id !== undefined && input.mapping_id !== importedContext.mapping_id) {
    failures.push(
      `mapping_id mismatch: supplied ${input.mapping_id}, imported context has ${importedContext.mapping_id}.`,
    );
  }
  if (input.local_target_scope !== importedContext.local_scope) {
    failures.push(
      `local_target_scope mismatch: supplied ${input.local_target_scope}, imported context has ${importedContext.local_scope}.`,
    );
  }
  if (input.local_target_work_id !== importedContext.local_work_id) {
    failures.push(
      `local_target_work_id mismatch: supplied ${input.local_target_work_id}, imported context has ${importedContext.local_work_id}.`,
    );
  }
  return failures;
}

function buildInsertRow(
  input: NormalizedCreateInput,
  importedContext: AgWorkResumeImportedContextRecord,
  mappingId: string,
): CandidateInsertRow {
  const authorityBoundary = buildAuthorityBoundary(true);
  const candidateId = buildCandidateId({
    import_id: input.import_id,
    mapping_id: mappingId,
    foreign_ref_type: input.foreign_ref_type,
    foreign_ref_id: input.foreign_ref_id,
    local_target_scope: input.local_target_scope,
    local_target_work_id: input.local_target_work_id,
    summary: input.summary,
    proposed_by: input.proposed_by,
    proposed_reason: input.proposed_reason,
    created_at: input.created_at,
  });

  return {
    candidate_id: candidateId,
    record_kind: RECORD_KIND,
    schema: RECORD_SCHEMA,
    status: "proposed",
    import_id: importedContext.import_id,
    mapping_id: mappingId,
    foreign_ref_type: input.foreign_ref_type,
    foreign_ref_id: input.foreign_ref_id,
    local_target_scope: input.local_target_scope,
    local_target_work_id: input.local_target_work_id,
    summary: input.summary,
    redaction_status: stableStringify(input.redaction_status),
    proposed_by: input.proposed_by,
    proposed_reason: input.proposed_reason,
    authority_boundary: stableStringify(authorityBoundary),
    created_at: input.created_at,
    updated_at: input.created_at,
  };
}

function selectImportedContextRecordRow(db: Database.Database, importId: string) {
  return db
    .prepare("SELECT * FROM ag_work_resume_imported_contexts WHERE import_id = ?")
    .get(importId) as Record<string, unknown> | undefined;
}

function selectCandidateRecordRow(db: Database.Database, candidateId: string) {
  return db
    .prepare(
      "SELECT * FROM ag_work_resume_proof_evidence_reconciliation_candidates WHERE candidate_id = ?",
    )
    .get(candidateId) as Record<string, unknown> | undefined;
}

function selectActiveDuplicateCandidate(
  db: Database.Database,
  input: NormalizedCreateInput,
  mappingId: string,
) {
  return db
    .prepare(
      `
        SELECT *
        FROM ag_work_resume_proof_evidence_reconciliation_candidates
        WHERE import_id = ?
          AND mapping_id = ?
          AND foreign_ref_type = ?
          AND foreign_ref_id = ?
          AND local_target_scope = ?
          AND local_target_work_id = ?
          AND status IN (${ACTIVE_DUPLICATE_STATUSES.map(() => "?").join(", ")})
        ORDER BY created_at DESC, candidate_id ASC
        LIMIT 1
      `,
    )
    .get(
      input.import_id,
      mappingId,
      input.foreign_ref_type,
      input.foreign_ref_id,
      input.local_target_scope,
      input.local_target_work_id,
      ...ACTIVE_DUPLICATE_STATUSES,
    ) as Record<string, unknown> | undefined;
}

function localWorkExists(db: Database.Database, scope: string, workId: string) {
  return Boolean(
    db
      .prepare("SELECT 1 FROM work_items WHERE scope = ? AND work_id = ?")
      .get(scope, workId),
  );
}

export function parseReconciliationCandidateRecordRow(
  row: Record<string, unknown>,
): AgWorkResumeProofEvidenceReconciliationCandidateRecord {
  return parseCandidateRecordRow(row);
}

function parseCandidateRecordRow(
  row: Record<string, unknown>,
): AgWorkResumeProofEvidenceReconciliationCandidateRecord {
  return {
    candidate_id: stringField(row.candidate_id),
    record_kind: RECORD_KIND,
    schema: RECORD_SCHEMA,
    status: stringField(
      row.status,
    ) as AgWorkResumeProofEvidenceReconciliationCandidateRecord["status"],
    import_id: stringField(row.import_id),
    mapping_id: stringField(row.mapping_id),
    foreign_ref_type: stringField(row.foreign_ref_type) as ForeignRefType,
    foreign_ref_id: stringField(row.foreign_ref_id),
    local_target_scope: stringField(row.local_target_scope),
    local_target_work_id: stringField(row.local_target_work_id),
    summary: stringField(row.summary),
    redaction_status: parseJsonObjectField(row.redaction_status),
    proposed_by: stringField(row.proposed_by),
    proposed_reason: stringField(row.proposed_reason),
    reviewed_by: nullableStringField(row.reviewed_by),
    reviewed_at: nullableStringField(row.reviewed_at),
    review_note: nullableStringField(row.review_note),
    supersedes_candidate_id: nullableStringField(row.supersedes_candidate_id),
    superseded_by_candidate_id: nullableStringField(row.superseded_by_candidate_id),
    authority_boundary: parseJsonObjectField(
      row.authority_boundary,
    ) as AgWorkResumeProofEvidenceReconciliationCandidateAuthorityBoundary,
    created_at: stringField(row.created_at),
    updated_at: stringField(row.updated_at),
  };
}

function buildAuthorityBoundary(
  reconciliationCandidateCreated: boolean,
): AgWorkResumeProofEvidenceReconciliationCandidateAuthorityBoundary {
  return {
    reconciliation_candidate_created: reconciliationCandidateCreated,
    review_metadata_only: true,
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
    statement: RESULT_STATEMENT,
  };
}

function failureResult({
  status,
  candidate_id = null,
  record = null,
  imported_context = null,
  warnings = [],
  failures = [],
  recommended_next_step,
}: {
  status: Exclude<
    AgWorkResumeProofEvidenceReconciliationCandidateCreateResult["status"],
    "created"
  >;
  candidate_id?: string | null;
  record?: null;
  imported_context?: AgWorkResumeImportedContextRecord | null;
  warnings?: string[];
  failures?: string[];
  recommended_next_step: string;
}): AgWorkResumeProofEvidenceReconciliationCandidateCreateResult {
  return {
    ok: false,
    status,
    candidate_id,
    record,
    imported_context,
    warnings,
    failures,
    authority_boundary: buildAuthorityBoundary(false),
    recommended_next_step,
  };
}

function buildCandidateId(value: Record<string, unknown>) {
  return `ag-resume-proof-evidence-reconciliation-candidate:${createHash("sha256")
    .update(stableStringify(value))
    .digest("hex")
    .slice(0, 24)}`;
}

function normalizeCreatedAt(
  value: unknown,
  now: string | undefined,
): { value: string } | { error: string } {
  if (value === undefined || value === null) {
    return { value: now ?? new Date().toISOString() };
  }
  return normalizeRequiredTimestamp(value, "created_at");
}

function normalizeOptionalTimestamp(
  value: unknown,
  field: string,
): { value: string | undefined } | { error: string } {
  if (value === undefined || value === null) return { value: undefined };
  const normalized = normalizeRequiredTimestamp(value, field);
  if ("error" in normalized) return normalized;
  return { value: normalized.value };
}

function normalizeRequiredTimestamp(
  value: unknown,
  field: string,
): { value: string } | { error: string } {
  if (typeof value !== "string" || value.trim().length === 0) {
    return {
      error: `${field} must be an ISO UTC timestamp with millisecond precision.`,
    };
  }
  const timestamp = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(timestamp)) {
    return {
      error: `${field} must be an ISO UTC timestamp with millisecond precision.`,
    };
  }
  const parsed = Date.parse(timestamp);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== timestamp) {
    return { error: `${field} must be a valid ISO UTC timestamp.` };
  }
  return { value: timestamp };
}

function normalizeOptionalString(
  value: unknown,
  field: string,
): { value: string | undefined } | { error: string } {
  if (value === undefined || value === null) return { value: undefined };
  const cleaned = cleanString(value);
  if (!cleaned) return { error: `${field} must be omitted or a non-empty string.` };
  return { value: cleaned };
}

function boundedRequiredString(
  value: unknown,
  field: string,
): { value: string } | { error: string } {
  const cleaned = cleanString(value);
  if (!cleaned) return { error: `${field} must be a non-empty string.` };
  if (cleaned.length > MAX_TEXT_LENGTH) {
    return { error: `${field} must be ${MAX_TEXT_LENGTH} characters or fewer.` };
  }
  return { value: cleaned };
}

function normalizeRequiredRedactionStatus(
  value: unknown,
): { value: Record<string, unknown> } | { error: string } {
  if (!isRecord(value)) {
    return { error: "redaction_status must be a JSON object." };
  }
  if (value.safe !== true) {
    return { error: "redaction_status.safe must be true." };
  }
  const blockedFields = [
    "secrets_included",
    "raw_db_paths_included",
    "session_payloads_included",
    "proof_payloads_included",
  ];
  for (const field of blockedFields) {
    if (value[field] !== false) {
      return {
        error: `redaction_status.${field} must be false before candidate creation.`,
      };
    }
  }
  if (stableStringify(value).length > MAX_JSON_TEXT_LENGTH) {
    return { error: "redaction_status must be a bounded JSON object." };
  }
  return { value };
}

function stableStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (isRecord(value)) {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = canonicalize(value[key]);
        return acc;
      }, {});
  }
  return value;
}

function parseJsonObjectField(value: unknown) {
  const parsed = JSON.parse(stringField(value));
  return isRecord(parsed) ? parsed : {};
}

function stringField(value: unknown) {
  return typeof value === "string" ? value : String(value ?? "");
}

function nullableStringField(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isConstraintConflict(error: unknown) {
  if (!(error instanceof Error)) return false;
  return /constraint|unique|primary/i.test(error.message);
}
