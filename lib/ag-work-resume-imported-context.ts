import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { openDatabase } from "@/lib/db";
import {
  parseConfirmedMappingRecordRow,
  type AgWorkResumeConfirmedMappingRecord,
} from "@/lib/ag-work-resume-confirmed-mapping";

export type AgWorkResumeImportedContextCreateInput = {
  mapping_id: unknown;
  packet_id: unknown;
  packet_hash: unknown;
  source_runtime_instance_id?: unknown;
  foreign_scope?: unknown;
  foreign_work_id?: unknown;
  local_scope?: unknown;
  local_work_id?: unknown;
  imported_summary: unknown;
  imported_expected_files?: unknown;
  imported_expected_checks?: unknown;
  foreign_refs_summary?: unknown;
  redaction_report: unknown;
  created_by: unknown;
  import_reason: unknown;
  created_at?: unknown;
  db?: Database.Database;
  now?: string;
};

export type AgWorkResumeImportedContextAuthorityBoundary = {
  imported_context_created: boolean;
  review_metadata_only: true;
  confirmed_mapping_required: true;
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

export type AgWorkResumeImportedContextRecord = {
  import_id: string;
  record_kind: "ag_work_resume_imported_context";
  schema: "augnes.ag_work_resume_imported_context.v0_1";
  status: "review_metadata" | "superseded" | "withdrawn" | "revoked";
  mapping_id: string;
  foreign_scope: string;
  foreign_work_id: string;
  local_scope: string;
  local_work_id: string;
  packet_id: string;
  packet_hash: string;
  source_runtime_instance_id: string | null;
  imported_summary: string;
  imported_expected_files: string[];
  imported_expected_checks: string[];
  foreign_refs_summary: Record<string, unknown>;
  redaction_report: Record<string, unknown>;
  created_by: string;
  import_reason: string;
  created_at: string;
  updated_at: string;
  authority_boundary: AgWorkResumeImportedContextAuthorityBoundary;
};

export type AgWorkResumeImportedContextCreateResult = {
  ok: boolean;
  status:
    | "created"
    | "invalid_input"
    | "mapping_not_found"
    | "mapping_not_active"
    | "mapping_mismatch"
    | "redaction_blocked"
    | "db_error";
  import_id: string | null;
  record: AgWorkResumeImportedContextRecord | null;
  source_mapping: AgWorkResumeConfirmedMappingRecord | null;
  warnings: string[];
  failures: string[];
  authority_boundary: AgWorkResumeImportedContextAuthorityBoundary;
  recommended_next_step: string;
};

type NormalizedCreateInput = {
  mapping_id: string;
  packet_id: string;
  packet_hash: string;
  source_runtime_instance_id?: string;
  foreign_scope?: string;
  foreign_work_id?: string;
  local_scope?: string;
  local_work_id?: string;
  imported_summary: string;
  imported_expected_files: string[];
  imported_expected_checks: string[];
  foreign_refs_summary: Record<string, unknown>;
  redaction_report: Record<string, unknown>;
  created_by: string;
  import_reason: string;
  created_at: string;
};

type ImportedContextInsertRow = {
  import_id: string;
  record_kind: "ag_work_resume_imported_context";
  schema: "augnes.ag_work_resume_imported_context.v0_1";
  status: "review_metadata";
  mapping_id: string;
  foreign_scope: string;
  foreign_work_id: string;
  local_scope: string;
  local_work_id: string;
  packet_id: string;
  packet_hash: string;
  source_runtime_instance_id: string | null;
  imported_summary: string;
  imported_expected_files: string;
  imported_expected_checks: string;
  foreign_refs_summary: string;
  redaction_report: string;
  created_by: string;
  import_reason: string;
  created_at: string;
  updated_at: string;
  authority_boundary: string;
};

const RECORD_KIND = "ag_work_resume_imported_context" as const;
const RECORD_SCHEMA = "augnes.ag_work_resume_imported_context.v0_1" as const;
const RESULT_STATEMENT =
  "Imported context is bounded review metadata only and not proof/evidence/session/Codex/merge authority.";
const MAX_TEXT_LENGTH = 4000;
const MAX_JSON_TEXT_LENGTH = 12000;

export function createAgWorkResumeImportedContext(
  input: AgWorkResumeImportedContextCreateInput,
): AgWorkResumeImportedContextCreateResult {
  const validation = normalizeCreateInput(input);
  if ("error" in validation) {
    return failureResult({
      status: validation.status ?? "invalid_input",
      failures: [validation.error],
      recommended_next_step:
        validation.status === "redaction_blocked"
          ? "Stop. Remove secrets, raw DB paths, raw session payloads, and raw proof payloads before creating imported context review metadata."
          : "Stop. Provide mapping_id, packet_id, packet_hash, imported_summary, redaction_report, created_by, and import_reason.",
    });
  }

  const normalized = validation.value;
  const db = input.db ?? openDatabase();
  const ownsDb = !input.db;

  try {
    return db.transaction(() => {
      const mappingRow = selectConfirmedMappingRecordRow(db, normalized.mapping_id);
      if (!mappingRow) {
        return failureResult({
          status: "mapping_not_found",
          failures: [`Confirmed mapping not found: ${normalized.mapping_id}`],
          recommended_next_step:
            "Stop. Create or select an existing active confirmed mapping before importing context review metadata.",
        });
      }

      const sourceMapping = parseConfirmedMappingRecordRow(mappingRow);
      if (sourceMapping.status !== "active") {
        return failureResult({
          status: "mapping_not_active",
          source_mapping: sourceMapping,
          failures: [
            `Confirmed mapping ${sourceMapping.mapping_id} is ${sourceMapping.status}, not active.`,
          ],
          recommended_next_step:
            "Stop. Imported context rows require an active confirmed mapping.",
        });
      }

      const mismatchFailures = mappingMismatchFailures(normalized, sourceMapping);
      if (mismatchFailures.length > 0) {
        return failureResult({
          status: "mapping_mismatch",
          source_mapping: sourceMapping,
          failures: mismatchFailures,
          recommended_next_step:
            "Stop. Imported context identity and packet fields must match the active confirmed mapping.",
        });
      }

      const insertRow = buildInsertRow(normalized, sourceMapping);
      db.prepare(
        `
          INSERT INTO ag_work_resume_imported_contexts (
            import_id,
            record_kind,
            schema,
            status,
            mapping_id,
            foreign_scope,
            foreign_work_id,
            local_scope,
            local_work_id,
            packet_id,
            packet_hash,
            source_runtime_instance_id,
            imported_summary,
            imported_expected_files,
            imported_expected_checks,
            foreign_refs_summary,
            redaction_report,
            created_by,
            import_reason,
            created_at,
            updated_at,
            authority_boundary
          )
          VALUES (
            @import_id,
            @record_kind,
            @schema,
            @status,
            @mapping_id,
            @foreign_scope,
            @foreign_work_id,
            @local_scope,
            @local_work_id,
            @packet_id,
            @packet_hash,
            @source_runtime_instance_id,
            @imported_summary,
            @imported_expected_files,
            @imported_expected_checks,
            @foreign_refs_summary,
            @redaction_report,
            @created_by,
            @import_reason,
            @created_at,
            @updated_at,
            @authority_boundary
          )
        `,
      ).run(insertRow);

      const insertedRow = selectImportedContextRecordRow(db, insertRow.import_id);
      if (!insertedRow) {
        throw new Error("Inserted imported context record could not be read back.");
      }

      return {
        ok: true,
        status: "created" as const,
        import_id: insertRow.import_id,
        record: parseImportedContextRecordRow(insertedRow),
        source_mapping: sourceMapping,
        warnings: [],
        failures: [],
        authority_boundary: buildAuthorityBoundary(true),
        recommended_next_step:
          "User/Core may review the imported context metadata. It is not proof/evidence authorization, session binding, Codex execution authority, approval, publish, retry, replay, or merge authority.",
      };
    })();
  } catch (error) {
    return failureResult({
      status: "db_error",
      failures: [
        `Failed to create imported context: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
      recommended_next_step:
        "Stop. Inspect the database error before retrying imported context creation.",
    });
  } finally {
    if (ownsDb) db.close();
  }
}

function normalizeCreateInput(
  input: AgWorkResumeImportedContextCreateInput,
):
  | { value: NormalizedCreateInput }
  | {
      error: string;
      status?: Exclude<AgWorkResumeImportedContextCreateResult["status"], "created">;
    } {
  if (!isRecord(input)) {
    return { error: "Imported context input must be a JSON object." };
  }

  const allowedKeys = new Set([
    "mapping_id",
    "packet_id",
    "packet_hash",
    "source_runtime_instance_id",
    "foreign_scope",
    "foreign_work_id",
    "local_scope",
    "local_work_id",
    "imported_summary",
    "imported_expected_files",
    "imported_expected_checks",
    "foreign_refs_summary",
    "redaction_report",
    "created_by",
    "import_reason",
    "created_at",
    "db",
    "now",
  ]);
  const unknownKeys = Object.keys(input).filter((key) => !allowedKeys.has(key));
  if (unknownKeys.length > 0) {
    return { error: `Unknown field(s): ${unknownKeys.join(", ")}.` };
  }

  const mappingId = cleanString(input.mapping_id);
  if (!mappingId) return { error: "mapping_id must be a non-empty string." };
  const packetId = cleanString(input.packet_id);
  if (!packetId) return { error: "packet_id must be a non-empty string." };
  const packetHash = cleanString(input.packet_hash);
  if (!packetHash) return { error: "packet_hash must be a non-empty string." };
  const importedSummary = boundedRequiredString(
    input.imported_summary,
    "imported_summary",
  );
  if ("error" in importedSummary) return importedSummary;
  const createdBy = cleanString(input.created_by);
  if (!createdBy) return { error: "created_by must be a non-empty string." };
  const importReason = boundedRequiredString(input.import_reason, "import_reason");
  if ("error" in importReason) return importReason;

  const now = normalizeOptionalTimestamp(input.now, "now");
  if ("error" in now) return { error: now.error };
  const createdAt = normalizeCreatedAt(input.created_at, now.value);
  if ("error" in createdAt) return { error: createdAt.error };

  const sourceRuntimeInstanceId = normalizeOptionalString(
    input.source_runtime_instance_id,
    "source_runtime_instance_id",
  );
  if ("error" in sourceRuntimeInstanceId) return { error: sourceRuntimeInstanceId.error };
  const foreignScope = normalizeOptionalString(input.foreign_scope, "foreign_scope");
  if ("error" in foreignScope) return { error: foreignScope.error };
  const foreignWorkId = normalizeOptionalString(
    input.foreign_work_id,
    "foreign_work_id",
  );
  if ("error" in foreignWorkId) return { error: foreignWorkId.error };
  const localScope = normalizeOptionalString(input.local_scope, "local_scope");
  if ("error" in localScope) return { error: localScope.error };
  const localWorkId = normalizeOptionalString(input.local_work_id, "local_work_id");
  if ("error" in localWorkId) return { error: localWorkId.error };

  const expectedFiles = normalizeStringArray(
    input.imported_expected_files,
    "imported_expected_files",
  );
  if ("error" in expectedFiles) return { error: expectedFiles.error };
  const expectedChecks = normalizeStringArray(
    input.imported_expected_checks,
    "imported_expected_checks",
  );
  if ("error" in expectedChecks) return { error: expectedChecks.error };
  const foreignRefsSummary = normalizeObject(
    input.foreign_refs_summary,
    "foreign_refs_summary",
    {},
  );
  if ("error" in foreignRefsSummary) return { error: foreignRefsSummary.error };
  const redactionReport = normalizeRequiredRedactionReport(input.redaction_report);
  if ("error" in redactionReport) {
    return { error: redactionReport.error, status: "redaction_blocked" };
  }

  return {
    value: {
      mapping_id: mappingId,
      packet_id: packetId,
      packet_hash: packetHash,
      source_runtime_instance_id: sourceRuntimeInstanceId.value,
      foreign_scope: foreignScope.value,
      foreign_work_id: foreignWorkId.value,
      local_scope: localScope.value,
      local_work_id: localWorkId.value,
      imported_summary: importedSummary.value,
      imported_expected_files: expectedFiles.value,
      imported_expected_checks: expectedChecks.value,
      foreign_refs_summary: foreignRefsSummary.value,
      redaction_report: redactionReport.value,
      created_by: createdBy,
      import_reason: importReason.value,
      created_at: createdAt.value,
    },
  };
}

function mappingMismatchFailures(
  input: NormalizedCreateInput,
  mapping: AgWorkResumeConfirmedMappingRecord,
) {
  const checks: Array<[keyof NormalizedCreateInput, string | null]> = [
    ["foreign_scope", mapping.foreign_scope],
    ["foreign_work_id", mapping.foreign_work_id],
    ["local_scope", mapping.local_scope],
    ["local_work_id", mapping.local_work_id],
    ["packet_id", mapping.packet_id],
    ["packet_hash", mapping.packet_hash],
    ["source_runtime_instance_id", mapping.source_runtime_instance_id],
  ];

  return checks.flatMap(([field, expected]) => {
    const supplied = input[field];
    if (supplied === undefined) return [];
    if (supplied === expected) return [];
    return [
      `${field} mismatch: supplied ${String(supplied)}, confirmed mapping has ${
        expected ?? "null"
      }.`,
    ];
  });
}

function buildInsertRow(
  input: NormalizedCreateInput,
  mapping: AgWorkResumeConfirmedMappingRecord,
): ImportedContextInsertRow {
  const authorityBoundary = buildAuthorityBoundary(true);
  const sourceRuntimeInstanceId =
    input.source_runtime_instance_id ?? mapping.source_runtime_instance_id;
  const importId = buildImportId({
    mapping_id: mapping.mapping_id,
    packet_id: input.packet_id,
    packet_hash: input.packet_hash,
    source_runtime_instance_id: sourceRuntimeInstanceId,
    created_by: input.created_by,
    import_reason: input.import_reason,
    created_at: input.created_at,
  });

  return {
    import_id: importId,
    record_kind: RECORD_KIND,
    schema: RECORD_SCHEMA,
    status: "review_metadata",
    mapping_id: mapping.mapping_id,
    foreign_scope: mapping.foreign_scope,
    foreign_work_id: mapping.foreign_work_id,
    local_scope: mapping.local_scope,
    local_work_id: mapping.local_work_id,
    packet_id: input.packet_id,
    packet_hash: input.packet_hash,
    source_runtime_instance_id: sourceRuntimeInstanceId,
    imported_summary: input.imported_summary,
    imported_expected_files: stableStringify(input.imported_expected_files),
    imported_expected_checks: stableStringify(input.imported_expected_checks),
    foreign_refs_summary: stableStringify(input.foreign_refs_summary),
    redaction_report: stableStringify(input.redaction_report),
    created_by: input.created_by,
    import_reason: input.import_reason,
    created_at: input.created_at,
    updated_at: input.created_at,
    authority_boundary: stableStringify(authorityBoundary),
  };
}

function selectConfirmedMappingRecordRow(db: Database.Database, mappingId: string) {
  return db
    .prepare("SELECT * FROM ag_work_resume_confirmed_mappings WHERE mapping_id = ?")
    .get(mappingId) as Record<string, unknown> | undefined;
}

function selectImportedContextRecordRow(db: Database.Database, importId: string) {
  return db
    .prepare("SELECT * FROM ag_work_resume_imported_contexts WHERE import_id = ?")
    .get(importId) as Record<string, unknown> | undefined;
}

export function parseImportedContextRecordRow(
  row: Record<string, unknown>,
): AgWorkResumeImportedContextRecord {
  return {
    import_id: stringField(row.import_id),
    record_kind: RECORD_KIND,
    schema: RECORD_SCHEMA,
    status: stringField(row.status) as AgWorkResumeImportedContextRecord["status"],
    mapping_id: stringField(row.mapping_id),
    foreign_scope: stringField(row.foreign_scope),
    foreign_work_id: stringField(row.foreign_work_id),
    local_scope: stringField(row.local_scope),
    local_work_id: stringField(row.local_work_id),
    packet_id: stringField(row.packet_id),
    packet_hash: stringField(row.packet_hash),
    source_runtime_instance_id: nullableStringField(row.source_runtime_instance_id),
    imported_summary: stringField(row.imported_summary),
    imported_expected_files: parseJsonArrayField(row.imported_expected_files),
    imported_expected_checks: parseJsonArrayField(row.imported_expected_checks),
    foreign_refs_summary: parseJsonObjectField(row.foreign_refs_summary),
    redaction_report: parseJsonObjectField(row.redaction_report),
    created_by: stringField(row.created_by),
    import_reason: stringField(row.import_reason),
    created_at: stringField(row.created_at),
    updated_at: stringField(row.updated_at),
    authority_boundary: parseJsonObjectField(
      row.authority_boundary,
    ) as AgWorkResumeImportedContextAuthorityBoundary,
  };
}

function buildAuthorityBoundary(
  importedContextCreated: boolean,
): AgWorkResumeImportedContextAuthorityBoundary {
  return {
    imported_context_created: importedContextCreated,
    review_metadata_only: true,
    confirmed_mapping_required: true,
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
    statement: RESULT_STATEMENT,
  };
}

function failureResult({
  status,
  import_id = null,
  record = null,
  source_mapping = null,
  warnings = [],
  failures = [],
  recommended_next_step,
}: {
  status: Exclude<AgWorkResumeImportedContextCreateResult["status"], "created">;
  import_id?: string | null;
  record?: null;
  source_mapping?: AgWorkResumeConfirmedMappingRecord | null;
  warnings?: string[];
  failures?: string[];
  recommended_next_step: string;
}): AgWorkResumeImportedContextCreateResult {
  return {
    ok: false,
    status,
    import_id,
    record,
    source_mapping,
    warnings,
    failures,
    authority_boundary: buildAuthorityBoundary(false),
    recommended_next_step,
  };
}

function buildImportId(value: Record<string, unknown>) {
  return `ag-resume-imported-context:${createHash("sha256")
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

function normalizeStringArray(
  value: unknown,
  field: string,
): { value: string[] } | { error: string } {
  if (value === undefined || value === null) return { value: [] };
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    return { error: `${field} must be an array of strings.` };
  }
  if (stableStringify(value).length > MAX_JSON_TEXT_LENGTH) {
    return { error: `${field} must be a bounded JSON array.` };
  }
  return { value };
}

function normalizeObject(
  value: unknown,
  field: string,
  defaultValue?: Record<string, unknown>,
): { value: Record<string, unknown> } | { error: string } {
  if (value === undefined || value === null) return { value: defaultValue ?? {} };
  if (!isRecord(value)) return { error: `${field} must be a JSON object.` };
  if (stableStringify(value).length > MAX_JSON_TEXT_LENGTH) {
    return { error: `${field} must be a bounded JSON object.` };
  }
  return { value };
}

function normalizeRequiredRedactionReport(
  value: unknown,
): { value: Record<string, unknown> } | { error: string } {
  if (!isRecord(value)) {
    return { error: "redaction_report must be a JSON object." };
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
        error: `redaction_report.${field} must be false before imported context creation.`,
      };
    }
  }
  if (stableStringify(value).length > MAX_JSON_TEXT_LENGTH) {
    return { error: "redaction_report must be a bounded JSON object." };
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

function parseJsonArrayField(value: unknown) {
  const parsed = JSON.parse(stringField(value));
  return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
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
