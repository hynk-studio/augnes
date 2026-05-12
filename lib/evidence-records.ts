import { randomUUID } from "node:crypto";
import { openDatabase } from "@/lib/db";
import { normalizeScope, normalizeWorkId } from "@/lib/work";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export const EVIDENCE_KINDS = [
  "command_run",
  "check_passed",
  "check_failed",
  "check_skipped",
  "replay_observed",
  "duplicate_block_observed",
] as const;

export const EVIDENCE_STATUSES = [
  "passed",
  "failed",
  "skipped",
  "observed",
  "blocked",
  "needs_review",
] as const;

export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];
export type EvidenceMetadata = Record<string, unknown>;

export type EvidenceRecord = {
  evidence_id: string;
  scope: string;
  work_id: string | null;
  publication_id: string | null;
  delivery_id: string | null;
  target_surface: string | null;
  target_ref: string | null;
  evidence_kind: EvidenceKind;
  label: string;
  status: EvidenceStatus;
  command: string | null;
  result_summary: string;
  skipped_reason: string | null;
  observed_behavior: string | null;
  source_surface: string;
  source_ref: string | null;
  related_action_id: string | null;
  related_work_event_id: string | null;
  metadata: EvidenceMetadata;
  created_by: string;
  created_at: string;
};

export type EvidenceRecordInput = {
  evidence_id?: string | null;
  scope?: string | null;
  work_id?: string | null;
  publication_id?: string | null;
  delivery_id?: string | null;
  target_surface?: string | null;
  target_ref?: string | null;
  evidence_kind: string;
  label: string;
  status: string;
  command?: string | null;
  result_summary: string;
  skipped_reason?: string | null;
  observed_behavior?: string | null;
  source_surface: string;
  source_ref?: string | null;
  related_action_id?: string | null;
  related_work_event_id?: string | null;
  metadata?: EvidenceMetadata | string | null;
  created_by: string;
  created_at?: string | null;
};

export type EvidenceRecordFilters = {
  scope?: string | null;
  work_id?: string | null;
  publication_id?: string | null;
  delivery_id?: string | null;
  target_surface?: string | null;
  target_ref?: string | null;
  evidence_kind?: string | null;
  status?: string | null;
  limit?: number | null;
};

type EvidenceRecordRow = Omit<EvidenceRecord, "metadata"> & {
  metadata: string;
};

export class EvidenceRecordValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvidenceRecordValidationError";
  }
}

export class EvidenceRecordNotFoundError extends Error {
  constructor(evidenceId: string, scope?: string | null) {
    super(
      scope
        ? `Unknown evidence_id ${evidenceId} for scope ${scope}.`
        : `Unknown evidence_id ${evidenceId}.`,
    );
    this.name = "EvidenceRecordNotFoundError";
  }
}

export function createEvidenceRecord(input: EvidenceRecordInput) {
  const row = normalizeEvidenceRecordInput(input);
  const db = openDatabase();

  try {
    db.prepare(
      `
        INSERT INTO verification_evidence_records (
          evidence_id,
          scope,
          work_id,
          publication_id,
          delivery_id,
          target_surface,
          target_ref,
          evidence_kind,
          label,
          status,
          command,
          result_summary,
          skipped_reason,
          observed_behavior,
          source_surface,
          source_ref,
          related_action_id,
          related_work_event_id,
          metadata,
          created_by,
          created_at
        )
        VALUES (
          @evidence_id,
          @scope,
          @work_id,
          @publication_id,
          @delivery_id,
          @target_surface,
          @target_ref,
          @evidence_kind,
          @label,
          @status,
          @command,
          @result_summary,
          @skipped_reason,
          @observed_behavior,
          @source_surface,
          @source_ref,
          @related_action_id,
          @related_work_event_id,
          @metadata,
          @created_by,
          @created_at
        )
      `,
    ).run({
      ...row,
      metadata: JSON.stringify(row.metadata),
    });

    return selectEvidenceRecordById(db, row.evidence_id, row.scope);
  } finally {
    db.close();
  }
}

export function listEvidenceRecords(filters: EvidenceRecordFilters = {}) {
  const normalizedScope = normalizeScope(filters.scope);
  const clauses = ["scope = ?"];
  const params: Array<string | number> = [normalizedScope];

  addOptionalClause(clauses, params, "work_id", normalizeNullableWorkId(filters.work_id));
  addOptionalClause(clauses, params, "publication_id", cleanNullableString(filters.publication_id));
  addOptionalClause(clauses, params, "delivery_id", cleanNullableString(filters.delivery_id));
  addOptionalClause(clauses, params, "target_surface", cleanNullableString(filters.target_surface));
  addOptionalClause(clauses, params, "target_ref", cleanNullableString(filters.target_ref));

  const evidenceKind = cleanNullableString(filters.evidence_kind);
  if (evidenceKind) {
    assertEvidenceKind(evidenceKind);
    addOptionalClause(clauses, params, "evidence_kind", evidenceKind);
  }

  const status = cleanNullableString(filters.status);
  if (status) {
    assertEvidenceStatus(status);
    addOptionalClause(clauses, params, "status", status);
  }

  params.push(normalizeLimit(filters.limit));
  const db = openDatabase();

  try {
    const rows = db
      .prepare(
        `
          SELECT
            evidence_id,
            scope,
            work_id,
            publication_id,
            delivery_id,
            target_surface,
            target_ref,
            evidence_kind,
            label,
            status,
            command,
            result_summary,
            skipped_reason,
            observed_behavior,
            source_surface,
            source_ref,
            related_action_id,
            related_work_event_id,
            metadata,
            created_by,
            created_at
          FROM verification_evidence_records
          WHERE ${clauses.join(" AND ")}
          ORDER BY created_at DESC, evidence_id ASC
          LIMIT ?
        `,
      )
      .all(...params) as EvidenceRecordRow[];

    return rows.map(parseEvidenceRecordRow);
  } finally {
    db.close();
  }
}

export function getEvidenceRecord(evidenceId: string, scope?: string | null) {
  const normalizedId = requireNonEmptyString(evidenceId, "evidence_id");
  const normalizedScope = scope ? normalizeScope(scope) : null;
  const db = openDatabase();

  try {
    const row = selectEvidenceRecordRow(db, normalizedId, normalizedScope);
    return row ? parseEvidenceRecordRow(row) : null;
  } finally {
    db.close();
  }
}

function normalizeEvidenceRecordInput(input: EvidenceRecordInput): EvidenceRecord {
  const evidenceKind = requireNonEmptyString(input.evidence_kind, "evidence_kind");
  const status = requireNonEmptyString(input.status, "status");
  const command = cleanNullableString(input.command);
  const skippedReason = cleanNullableString(input.skipped_reason);
  const publicationId = cleanNullableString(input.publication_id);
  const deliveryId = cleanNullableString(input.delivery_id);
  const targetRef = cleanNullableString(input.target_ref);
  const sourceRef = cleanNullableString(input.source_ref);

  assertEvidenceKind(evidenceKind);
  assertEvidenceStatus(status);

  if (evidenceKind === "command_run" && !command) {
    throw new EvidenceRecordValidationError(
      "command is required when evidence_kind is command_run.",
    );
  }

  if (evidenceKind === "check_skipped" && !skippedReason) {
    throw new EvidenceRecordValidationError(
      "skipped_reason is required when evidence_kind is check_skipped.",
    );
  }

  if (
    evidenceKind === "replay_observed" &&
    !deliveryId &&
    !publicationId &&
    !sourceRef
  ) {
    throw new EvidenceRecordValidationError(
      "replay_observed records require delivery_id, publication_id, or source_ref.",
    );
  }

  if (
    evidenceKind === "duplicate_block_observed" &&
    !deliveryId &&
    !publicationId &&
    !targetRef &&
    !sourceRef
  ) {
    throw new EvidenceRecordValidationError(
      "duplicate_block_observed records require delivery_id, publication_id, target_ref, or source_ref.",
    );
  }

  return {
    evidence_id:
      cleanNullableString(input.evidence_id) ?? `evidence:${randomUUID()}`,
    scope: normalizeScope(input.scope),
    work_id: normalizeNullableWorkId(input.work_id),
    publication_id: publicationId,
    delivery_id: deliveryId,
    target_surface: cleanNullableString(input.target_surface),
    target_ref: targetRef,
    evidence_kind: evidenceKind,
    label: requireNonEmptyString(input.label, "label"),
    status,
    command,
    result_summary: requireNonEmptyString(input.result_summary, "result_summary"),
    skipped_reason: skippedReason,
    observed_behavior: cleanNullableString(input.observed_behavior),
    source_surface: requireNonEmptyString(input.source_surface, "source_surface"),
    source_ref: sourceRef,
    related_action_id: cleanNullableString(input.related_action_id),
    related_work_event_id: cleanNullableString(input.related_work_event_id),
    metadata: normalizeMetadata(input.metadata),
    created_by: requireNonEmptyString(input.created_by, "created_by"),
    created_at: cleanNullableString(input.created_at) ?? new Date().toISOString(),
  };
}

function selectEvidenceRecordById(
  db: ReturnType<typeof openDatabase>,
  evidenceId: string,
  scope?: string | null,
) {
  const row = selectEvidenceRecordRow(db, evidenceId, scope);
  if (!row) {
    throw new EvidenceRecordNotFoundError(evidenceId, scope);
  }

  return parseEvidenceRecordRow(row);
}

function selectEvidenceRecordRow(
  db: ReturnType<typeof openDatabase>,
  evidenceId: string,
  scope?: string | null,
) {
  return db
    .prepare(
      `
        SELECT
          evidence_id,
          scope,
          work_id,
          publication_id,
          delivery_id,
          target_surface,
          target_ref,
          evidence_kind,
          label,
          status,
          command,
          result_summary,
          skipped_reason,
          observed_behavior,
          source_surface,
          source_ref,
          related_action_id,
          related_work_event_id,
          metadata,
          created_by,
          created_at
        FROM verification_evidence_records
        WHERE evidence_id = ?
          ${scope ? "AND scope = ?" : ""}
      `,
    )
    .get(...([evidenceId, scope].filter(Boolean) as string[])) as
    | EvidenceRecordRow
    | undefined;
}

function parseEvidenceRecordRow(row: EvidenceRecordRow): EvidenceRecord {
  return {
    ...row,
    metadata: normalizeMetadata(row.metadata),
  };
}

function normalizeMetadata(
  value: EvidenceMetadata | string | null | undefined,
): EvidenceMetadata {
  if (value === undefined || value === null) {
    return {};
  }

  const parsed = typeof value === "string" ? parseMetadataString(value) : value;
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed)
  ) {
    throw new EvidenceRecordValidationError("metadata must be a JSON object.");
  }

  return parsed as EvidenceMetadata;
}

function parseMetadataString(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new EvidenceRecordValidationError(
      "metadata must be a valid JSON object.",
    );
  }
}

function addOptionalClause(
  clauses: string[],
  params: Array<string | number>,
  column: string,
  value: string | null,
) {
  if (!value) {
    return;
  }

  clauses.push(`${column} = ?`);
  params.push(value);
}

function normalizeNullableWorkId(value: string | null | undefined) {
  const clean = cleanNullableString(value);
  return clean ? normalizeWorkId(clean) : null;
}

function normalizeLimit(value: number | null | undefined) {
  if (!Number.isFinite(value ?? NaN)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(MAX_LIMIT, Math.max(1, Math.floor(value as number)));
}

function assertEvidenceKind(value: string): asserts value is EvidenceKind {
  if (!EVIDENCE_KINDS.includes(value as EvidenceKind)) {
    throw new EvidenceRecordValidationError(
      `evidence_kind must be one of: ${EVIDENCE_KINDS.join(", ")}.`,
    );
  }
}

function assertEvidenceStatus(value: string): asserts value is EvidenceStatus {
  if (!EVIDENCE_STATUSES.includes(value as EvidenceStatus)) {
    throw new EvidenceRecordValidationError(
      `status must be one of: ${EVIDENCE_STATUSES.join(", ")}.`,
    );
  }
}

function requireNonEmptyString(value: unknown, key: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new EvidenceRecordValidationError(`${key} is required.`);
  }

  return value.trim();
}

function cleanNullableString(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new EvidenceRecordValidationError("Expected a string value.");
  }

  return value.trim() || null;
}
