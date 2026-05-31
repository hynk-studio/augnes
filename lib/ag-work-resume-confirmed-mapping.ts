import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { openDatabase } from "@/lib/db";
import {
  parseProposalRecordRow,
  type AgWorkResumeMappingProposalRecord,
} from "@/lib/ag-work-resume-mapping-proposal-record";

export type AgWorkResumeConfirmedMappingCreateInput = {
  source_proposal_id: unknown;
  foreign_scope?: unknown;
  foreign_work_id?: unknown;
  local_scope?: unknown;
  local_work_id?: unknown;
  packet_id?: unknown;
  packet_hash?: unknown;
  source_runtime_instance_id?: unknown;
  confirmed_by: unknown;
  confirmation_reason: unknown;
  confirmed_at?: unknown;
  db?: Database.Database;
  now?: string;
};

export type AgWorkResumeConfirmedMappingAuthorityBoundary = {
  confirmed_mapping_created: boolean;
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

export type AgWorkResumeConfirmedMappingRecord = {
  mapping_id: string;
  record_kind: "ag_work_resume_confirmed_mapping";
  schema: "augnes.ag_work_resume_confirmed_mapping.v0_1";
  status: "active" | "superseded" | "withdrawn" | "revoked";
  foreign_scope: string;
  foreign_work_id: string;
  local_scope: string;
  local_work_id: string;
  source_proposal_id: string;
  packet_id: string;
  packet_hash: string;
  source_runtime_instance_id: string | null;
  confirmed_by: string;
  confirmed_at: string;
  confirmation_reason: string;
  supersedes_mapping_id: string | null;
  superseded_by_mapping_id: string | null;
  revoked_by: string | null;
  revoked_at: string | null;
  revocation_reason: string | null;
  authority_boundary: AgWorkResumeConfirmedMappingAuthorityBoundary;
  created_at: string;
  updated_at: string;
};

export type AgWorkResumeConfirmedMappingCreateResult = {
  ok: boolean;
  status:
    | "created"
    | "invalid_input"
    | "proposal_not_found"
    | "proposal_not_active"
    | "local_work_not_found"
    | "proposal_mismatch"
    | "duplicate_active_mapping"
    | "db_error";
  mapping_id: string | null;
  record: AgWorkResumeConfirmedMappingRecord | null;
  source_proposal: AgWorkResumeMappingProposalRecord | null;
  warnings: string[];
  failures: string[];
  authority_boundary: AgWorkResumeConfirmedMappingAuthorityBoundary;
  recommended_next_step: string;
};

type NormalizedCreateInput = {
  source_proposal_id: string;
  foreign_scope?: string;
  foreign_work_id?: string;
  local_scope?: string;
  local_work_id?: string;
  packet_id?: string;
  packet_hash?: string;
  source_runtime_instance_id?: string;
  confirmed_by: string;
  confirmation_reason: string;
  confirmed_at: string;
};

type ConfirmedMappingInsertRow = {
  mapping_id: string;
  record_kind: "ag_work_resume_confirmed_mapping";
  schema: "augnes.ag_work_resume_confirmed_mapping.v0_1";
  status: "active";
  foreign_scope: string;
  foreign_work_id: string;
  local_scope: string;
  local_work_id: string;
  source_proposal_id: string;
  packet_id: string;
  packet_hash: string;
  source_runtime_instance_id: string | null;
  confirmed_by: string;
  confirmed_at: string;
  confirmation_reason: string;
  authority_boundary: string;
  created_at: string;
  updated_at: string;
};

const RECORD_KIND = "ag_work_resume_confirmed_mapping" as const;
const RECORD_SCHEMA = "augnes.ag_work_resume_confirmed_mapping.v0_1" as const;
const ACTIVE_PROPOSAL_STATUSES = new Set(["proposed", "needs_review"]);
const RESULT_STATEMENT =
  "Confirmed mapping creation is only a foreign/local identity association and not import/proof/evidence/session/Codex/merge authority.";

export function createAgWorkResumeConfirmedMapping(
  input: AgWorkResumeConfirmedMappingCreateInput,
): AgWorkResumeConfirmedMappingCreateResult {
  const validation = normalizeCreateInput(input);
  if ("error" in validation) {
    return failureResult({
      status: "invalid_input",
      failures: [validation.error],
      recommended_next_step:
        "Stop. Provide source_proposal_id, confirmed_by, confirmation_reason, and optional matching proposal identity fields.",
    });
  }

  const normalized = validation.value;
  const db = input.db ?? openDatabase();
  const ownsDb = !input.db;

  try {
    return db.transaction(() => {
      const proposalRow = selectProposalRecordRow(db, normalized.source_proposal_id);
      if (!proposalRow) {
        return failureResult({
          status: "proposal_not_found",
          failures: [`Source proposal not found: ${normalized.source_proposal_id}`],
          recommended_next_step:
            "Stop. Create or select an existing Stage B mapping proposal before confirming a mapping.",
        });
      }

      const sourceProposal = parseProposalRecordRow(proposalRow);
      if (!ACTIVE_PROPOSAL_STATUSES.has(sourceProposal.status)) {
        return failureResult({
          status: "proposal_not_active",
          source_proposal: sourceProposal,
          failures: [
            `Source proposal ${sourceProposal.proposal_id} is ${sourceProposal.status}, not proposed or needs_review.`,
          ],
          recommended_next_step:
            "Stop. Only proposed or needs_review proposal records may be confirmed into a mapping.",
        });
      }

      const mismatchFailures = proposalMismatchFailures(normalized, sourceProposal);
      if (mismatchFailures.length > 0) {
        return failureResult({
          status: "proposal_mismatch",
          source_proposal: sourceProposal,
          failures: mismatchFailures,
          recommended_next_step:
            "Stop. Confirmed mapping input fields must match the reviewed source proposal row.",
        });
      }

      const derived = deriveMappingFields(normalized, sourceProposal);
      if (!localWorkExists(db, derived.local_scope, derived.local_work_id)) {
        return failureResult({
          status: "local_work_not_found",
          source_proposal: sourceProposal,
          failures: [
            `Local work not found: ${derived.local_scope}/${derived.local_work_id}`,
          ],
          recommended_next_step:
            "Stop. Confirmed mappings may point only at existing local work items.",
        });
      }

      const duplicate = selectActiveMappingForForeign(
        db,
        derived.foreign_scope,
        derived.foreign_work_id,
      );
      if (duplicate) {
        return failureResult({
          status: "duplicate_active_mapping",
          source_proposal: sourceProposal,
          mapping_id: stringField(duplicate.mapping_id),
          failures: [
            `An active confirmed mapping already exists for ${derived.foreign_scope}/${derived.foreign_work_id}.`,
          ],
          recommended_next_step:
            "Stop. Supersession or replacement requires a separately scoped confirmed mapping lifecycle design.",
        });
      }

      const insertRow = buildInsertRow({ normalized, sourceProposal, derived });
      db.prepare(
        `
          INSERT INTO ag_work_resume_confirmed_mappings (
            mapping_id,
            record_kind,
            schema,
            status,
            foreign_scope,
            foreign_work_id,
            local_scope,
            local_work_id,
            source_proposal_id,
            packet_id,
            packet_hash,
            source_runtime_instance_id,
            confirmed_by,
            confirmed_at,
            confirmation_reason,
            authority_boundary,
            created_at,
            updated_at
          )
          VALUES (
            @mapping_id,
            @record_kind,
            @schema,
            @status,
            @foreign_scope,
            @foreign_work_id,
            @local_scope,
            @local_work_id,
            @source_proposal_id,
            @packet_id,
            @packet_hash,
            @source_runtime_instance_id,
            @confirmed_by,
            @confirmed_at,
            @confirmation_reason,
            @authority_boundary,
            @created_at,
            @updated_at
          )
        `,
      ).run(insertRow);

      const insertedRow = selectConfirmedMappingRecordRow(db, insertRow.mapping_id);
      if (!insertedRow) {
        throw new Error("Inserted confirmed mapping record could not be read back.");
      }

      return {
        ok: true,
        status: "created" as const,
        mapping_id: insertRow.mapping_id,
        record: parseConfirmedMappingRecordRow(insertedRow),
        source_proposal: sourceProposal,
        warnings: [],
        failures: [],
        authority_boundary: buildAuthorityBoundary(true),
        recommended_next_step:
          "User/Core may review the confirmed mapping identity association. This is not import authorization, proof/evidence authorization, session binding, Codex execution authority, or merge/publish authority.",
      };
    })();
  } catch (error) {
    if (isDuplicateConstraintError(error)) {
      return failureResult({
        status: "duplicate_active_mapping",
        failures: [
          "An active confirmed mapping already exists for this foreign work identity.",
        ],
        recommended_next_step:
          "Stop. Supersession or replacement requires a separately scoped confirmed mapping lifecycle design.",
      });
    }

    return failureResult({
      status: "db_error",
      failures: [
        `Failed to create confirmed mapping: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
      recommended_next_step:
        "Stop. Inspect the database error before retrying confirmed mapping creation.",
    });
  } finally {
    if (ownsDb) db.close();
  }
}

function normalizeCreateInput(
  input: AgWorkResumeConfirmedMappingCreateInput,
): { value: NormalizedCreateInput } | { error: string } {
  if (!isRecord(input)) {
    return { error: "Confirmed mapping input must be a JSON object." };
  }

  const unknownKeys = Object.keys(input).filter(
    (key) =>
      ![
        "source_proposal_id",
        "foreign_scope",
        "foreign_work_id",
        "local_scope",
        "local_work_id",
        "packet_id",
        "packet_hash",
        "source_runtime_instance_id",
        "confirmed_by",
        "confirmation_reason",
        "confirmed_at",
        "db",
        "now",
      ].includes(key),
  );
  if (unknownKeys.length > 0) {
    return { error: `Unknown field(s): ${unknownKeys.join(", ")}.` };
  }

  const sourceProposalId = cleanString(input.source_proposal_id);
  if (!sourceProposalId) {
    return { error: "source_proposal_id must be a non-empty string." };
  }
  const confirmedBy = cleanString(input.confirmed_by);
  if (!confirmedBy) {
    return { error: "confirmed_by must be a non-empty string." };
  }
  const confirmationReason = cleanString(input.confirmation_reason);
  if (!confirmationReason) {
    return { error: "confirmation_reason must be a non-empty string." };
  }

  const now = normalizeOptionalTimestamp(input.now, "now");
  if ("error" in now) {
    return { error: now.error };
  }
  const confirmedAt = normalizeConfirmedAt(input.confirmed_at, now.value);
  if ("error" in confirmedAt) {
    return { error: confirmedAt.error };
  }

  const foreignScope = normalizeOptionalString(input.foreign_scope, "foreign_scope");
  if ("error" in foreignScope) {
    return { error: foreignScope.error };
  }
  const foreignWorkId = normalizeOptionalString(input.foreign_work_id, "foreign_work_id");
  if ("error" in foreignWorkId) {
    return { error: foreignWorkId.error };
  }
  const localScope = normalizeOptionalString(input.local_scope, "local_scope");
  if ("error" in localScope) {
    return { error: localScope.error };
  }
  const localWorkId = normalizeOptionalString(input.local_work_id, "local_work_id");
  if ("error" in localWorkId) {
    return { error: localWorkId.error };
  }
  const packetId = normalizeOptionalString(input.packet_id, "packet_id");
  if ("error" in packetId) {
    return { error: packetId.error };
  }
  const packetHash = normalizeOptionalString(input.packet_hash, "packet_hash");
  if ("error" in packetHash) {
    return { error: packetHash.error };
  }
  const sourceRuntimeInstanceId = normalizeOptionalString(
    input.source_runtime_instance_id,
    "source_runtime_instance_id",
  );
  if ("error" in sourceRuntimeInstanceId) {
    return { error: sourceRuntimeInstanceId.error };
  }

  return {
    value: {
      source_proposal_id: sourceProposalId,
      foreign_scope: foreignScope.value,
      foreign_work_id: foreignWorkId.value,
      local_scope: localScope.value,
      local_work_id: localWorkId.value,
      packet_id: packetId.value,
      packet_hash: packetHash.value,
      source_runtime_instance_id: sourceRuntimeInstanceId.value,
      confirmed_by: confirmedBy,
      confirmation_reason: confirmationReason,
      confirmed_at: confirmedAt.value,
    },
  };
}

function proposalMismatchFailures(
  input: NormalizedCreateInput,
  proposal: AgWorkResumeMappingProposalRecord,
) {
  const checks: Array<[keyof NormalizedCreateInput, string | null]> = [
    ["foreign_scope", proposal.foreign_scope],
    ["foreign_work_id", proposal.foreign_work_id],
    ["local_scope", proposal.candidate_local_scope],
    ["local_work_id", proposal.candidate_local_work_id],
    ["packet_id", proposal.packet_id],
    ["packet_hash", proposal.packet_hash],
    ["source_runtime_instance_id", proposal.source_runtime_instance_id],
  ];

  return checks.flatMap(([field, expected]) => {
    const supplied = input[field];
    if (supplied === undefined) return [];
    if (supplied === expected) return [];
    return [
      `${field} mismatch: supplied ${supplied}, proposal has ${
        expected ?? "null"
      }.`,
    ];
  });
}

function deriveMappingFields(
  input: NormalizedCreateInput,
  proposal: AgWorkResumeMappingProposalRecord,
) {
  return {
    foreign_scope: input.foreign_scope ?? proposal.foreign_scope,
    foreign_work_id: input.foreign_work_id ?? proposal.foreign_work_id,
    local_scope: input.local_scope ?? proposal.candidate_local_scope,
    local_work_id: input.local_work_id ?? proposal.candidate_local_work_id,
    packet_id: input.packet_id ?? proposal.packet_id,
    packet_hash: input.packet_hash ?? proposal.packet_hash,
    source_runtime_instance_id:
      input.source_runtime_instance_id ?? proposal.source_runtime_instance_id,
  };
}

function buildInsertRow({
  normalized,
  sourceProposal,
  derived,
}: {
  normalized: NormalizedCreateInput;
  sourceProposal: AgWorkResumeMappingProposalRecord;
  derived: ReturnType<typeof deriveMappingFields>;
}): ConfirmedMappingInsertRow {
  const authorityBoundary = buildAuthorityBoundary(true);
  const mappingId = buildMappingId({
    source_proposal_id: sourceProposal.proposal_id,
    foreign_scope: derived.foreign_scope,
    foreign_work_id: derived.foreign_work_id,
    local_scope: derived.local_scope,
    local_work_id: derived.local_work_id,
    packet_id: derived.packet_id,
    packet_hash: derived.packet_hash,
    source_runtime_instance_id: derived.source_runtime_instance_id,
    confirmed_by: normalized.confirmed_by,
    confirmed_at: normalized.confirmed_at,
    confirmation_reason: normalized.confirmation_reason,
  });

  return {
    mapping_id: mappingId,
    record_kind: RECORD_KIND,
    schema: RECORD_SCHEMA,
    status: "active",
    foreign_scope: derived.foreign_scope,
    foreign_work_id: derived.foreign_work_id,
    local_scope: derived.local_scope,
    local_work_id: derived.local_work_id,
    source_proposal_id: sourceProposal.proposal_id,
    packet_id: derived.packet_id,
    packet_hash: derived.packet_hash,
    source_runtime_instance_id: derived.source_runtime_instance_id,
    confirmed_by: normalized.confirmed_by,
    confirmed_at: normalized.confirmed_at,
    confirmation_reason: normalized.confirmation_reason,
    authority_boundary: JSON.stringify(authorityBoundary),
    created_at: normalized.confirmed_at,
    updated_at: normalized.confirmed_at,
  };
}

function selectProposalRecordRow(db: Database.Database, proposalId: string) {
  return db
    .prepare(
      `
        SELECT *
        FROM ag_work_resume_mapping_proposals
        WHERE proposal_id = ?
      `,
    )
    .get(proposalId) as Record<string, unknown> | undefined;
}

function selectConfirmedMappingRecordRow(db: Database.Database, mappingId: string) {
  return db
    .prepare(
      `
        SELECT *
        FROM ag_work_resume_confirmed_mappings
        WHERE mapping_id = ?
      `,
    )
    .get(mappingId) as Record<string, unknown> | undefined;
}

function selectActiveMappingForForeign(
  db: Database.Database,
  foreignScope: string,
  foreignWorkId: string,
) {
  return db
    .prepare(
      `
        SELECT mapping_id
        FROM ag_work_resume_confirmed_mappings
        WHERE foreign_scope = ?
          AND foreign_work_id = ?
          AND status = 'active'
        LIMIT 1
      `,
    )
    .get(foreignScope, foreignWorkId) as Record<string, unknown> | undefined;
}

function localWorkExists(
  db: Database.Database,
  localScope: string,
  localWorkId: string,
) {
  return Boolean(
    db
      .prepare("SELECT work_id FROM work_items WHERE scope = ? AND work_id = ?")
      .get(localScope, localWorkId),
  );
}

export function parseConfirmedMappingRecordRow(
  row: Record<string, unknown>,
): AgWorkResumeConfirmedMappingRecord {
  return {
    mapping_id: stringField(row.mapping_id),
    record_kind: RECORD_KIND,
    schema: RECORD_SCHEMA,
    status: stringField(row.status) as AgWorkResumeConfirmedMappingRecord["status"],
    foreign_scope: stringField(row.foreign_scope),
    foreign_work_id: stringField(row.foreign_work_id),
    local_scope: stringField(row.local_scope),
    local_work_id: stringField(row.local_work_id),
    source_proposal_id: stringField(row.source_proposal_id),
    packet_id: stringField(row.packet_id),
    packet_hash: stringField(row.packet_hash),
    source_runtime_instance_id: nullableStringField(row.source_runtime_instance_id),
    confirmed_by: stringField(row.confirmed_by),
    confirmed_at: stringField(row.confirmed_at),
    confirmation_reason: stringField(row.confirmation_reason),
    supersedes_mapping_id: nullableStringField(row.supersedes_mapping_id),
    superseded_by_mapping_id: nullableStringField(row.superseded_by_mapping_id),
    revoked_by: nullableStringField(row.revoked_by),
    revoked_at: nullableStringField(row.revoked_at),
    revocation_reason: nullableStringField(row.revocation_reason),
    authority_boundary: parseJsonObjectField(
      row.authority_boundary,
    ) as AgWorkResumeConfirmedMappingAuthorityBoundary,
    created_at: stringField(row.created_at),
    updated_at: stringField(row.updated_at),
  };
}

function buildAuthorityBoundary(
  confirmedMappingCreated: boolean,
): AgWorkResumeConfirmedMappingAuthorityBoundary {
  return {
    confirmed_mapping_created: confirmedMappingCreated,
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
    statement: RESULT_STATEMENT,
  };
}

function failureResult({
  status,
  mapping_id = null,
  record = null,
  source_proposal = null,
  warnings = [],
  failures = [],
  recommended_next_step,
}: {
  status: Exclude<AgWorkResumeConfirmedMappingCreateResult["status"], "created">;
  mapping_id?: string | null;
  record?: null;
  source_proposal?: AgWorkResumeMappingProposalRecord | null;
  warnings?: string[];
  failures?: string[];
  recommended_next_step: string;
}): AgWorkResumeConfirmedMappingCreateResult {
  return {
    ok: false,
    status,
    mapping_id,
    record,
    source_proposal,
    warnings,
    failures,
    authority_boundary: buildAuthorityBoundary(false),
    recommended_next_step,
  };
}

function buildMappingId(value: Record<string, unknown>) {
  return `ag-resume-confirmed-mapping:${createHash("sha256")
    .update(stableStringify(value))
    .digest("hex")
    .slice(0, 24)}`;
}

function normalizeConfirmedAt(
  value: unknown,
  now: string | undefined,
): { value: string } | { error: string } {
  if (value === undefined || value === null) {
    return { value: now ?? new Date().toISOString() };
  }
  return normalizeRequiredTimestamp(value, "confirmed_at");
}

function normalizeOptionalTimestamp(
  value: unknown,
  field: string,
): { value: string | undefined } | { error: string } {
  if (value === undefined || value === null) {
    return { value: undefined };
  }
  const normalized = normalizeRequiredTimestamp(value, field);
  if ("error" in normalized) {
    return normalized;
  }
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
  if (value === undefined || value === null) {
    return { value: undefined };
  }
  const cleaned = cleanString(value);
  if (!cleaned) {
    return { error: `${field} must be omitted or a non-empty string.` };
  }
  return { value: cleaned };
}

function stableStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
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

function isDuplicateConstraintError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return /UNIQUE constraint failed|SQLITE_CONSTRAINT_UNIQUE|constraint failed/i.test(
    error.message,
  );
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
