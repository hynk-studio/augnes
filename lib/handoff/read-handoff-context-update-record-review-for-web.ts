import { existsSync } from "node:fs";
import { resolve } from "node:path";

import Database from "better-sqlite3";

import { buildApprovedHandoffContextUpdateRecordReviewV01 } from "@/lib/handoff/handoff-context-update-record-review";
import {
  HANDOFF_CONTEXT_UPDATE_WRITE_TABLE,
  handoffContextUpdateWriteSchemaExistsV01,
  type HandoffContextUpdateWriteDbLike,
} from "@/lib/handoff/handoff-context-update-write";
import type { ApprovedHandoffContextUpdateRecordReview } from "@/types/handoff-context-update-record-review";
import { OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_SCOPE } from "@/types/handoff-context-update-write";

export const HANDOFF_CONTEXT_UPDATE_RECORD_REVIEW_FOR_WEB_REF =
  "handoff_context_update_record_review_for_web.v0.1" as const;

export interface HandoffContextUpdateRecordReviewForWebInput {
  db_path?: string | null;
  selected_record_id?: string | null;
  limit?: number;
  as_of?: string;
  source_refs?: string[];
}

const safeContextUpdateDbPathPrefixes = [
  "tmp/handoff-context-updates/",
  ".tmp/handoff-context-updates/",
] as const;

const privateDbPathMarkers = [
  "/users/",
  "\\users\\",
  "/home/",
  "\\home\\",
  "/private/",
  ".env",
  "file://",
  "sk-",
  "ghp_",
  "github_pat_",
  "xoxb-",
  "password:",
  "secret:",
] as const;

interface HandoffContextUpdateRecordReviewRow {
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: string;
  operator_ref: string;
  record_fingerprint: string;
  record_json: string;
  receipt_json: string;
}

export function readHandoffContextUpdateRecordReviewForWebV01(
  input: HandoffContextUpdateRecordReviewForWebInput = {},
): ApprovedHandoffContextUpdateRecordReview {
  const dbPath =
    input.db_path ?? process.env.AUGNES_HANDOFF_CONTEXT_UPDATE_DB_PATH ?? "";
  const sourceRefs = uniqueSortedStrings([
    HANDOFF_CONTEXT_UPDATE_RECORD_REVIEW_FOR_WEB_REF,
    ...(input.source_refs ?? []),
  ]);
  const baseInput = {
    scope: OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_SCOPE,
    as_of: input.as_of,
    selected_record_id: input.selected_record_id ?? null,
    source_refs: sourceRefs,
  };

  if (!dbPath) {
    return reviewWithReason(
      buildApprovedHandoffContextUpdateRecordReviewV01({
        ...baseInput,
        records: [],
      }),
      "handoff_context_update_review_db_path_missing",
    );
  }

  if (!isSafeHandoffContextUpdateRecordReviewDbPathV01(dbPath)) {
    return reviewWithReason(
      buildApprovedHandoffContextUpdateRecordReviewV01({
        ...baseInput,
        records: [],
      }),
      "handoff_context_update_review_db_path_unsafe",
    );
  }

  const resolvedPath = resolve(process.cwd(), dbPath);
  if (!existsSync(resolvedPath)) {
    return reviewWithReason(
      buildApprovedHandoffContextUpdateRecordReviewV01({
        ...baseInput,
        records: [],
      }),
      "handoff_context_update_review_db_missing",
    );
  }

  let db: (Database.Database & HandoffContextUpdateWriteDbLike) | null = null;
  try {
    db = new Database(resolvedPath, {
      readonly: true,
      fileMustExist: true,
    }) as Database.Database & HandoffContextUpdateWriteDbLike;
    db.pragma("query_only = ON");

    if (!handoffContextUpdateWriteSchemaExistsV01(db)) {
      return reviewWithReason(
        buildApprovedHandoffContextUpdateRecordReviewV01({
          ...baseInput,
          records: [],
        }),
        "handoff_context_update_review_schema_missing",
      );
    }

    let records = listPersistedHandoffContextUpdateReviewRecordsV01({
      db,
      limit: input.limit,
    });
    let selectedRecordReason: string | null = null;

    if (input.selected_record_id) {
      const selectedRecordAlreadyListed = records.some(
        (record) =>
          recordIdFromReviewRecord(record) === input.selected_record_id,
      );
      if (!selectedRecordAlreadyListed) {
        const selectedRecord =
          readPersistedHandoffContextUpdateReviewRecordByIdV01(
            db,
            input.selected_record_id,
          );
        if (selectedRecord) {
          records = [selectedRecord, ...records];
        } else {
          selectedRecordReason =
            "handoff_context_update_review_selected_record_not_found";
        }
      }
    }

    const review = buildApprovedHandoffContextUpdateRecordReviewV01({
      ...baseInput,
      records,
    });
    return selectedRecordReason
      ? reviewWithReason(review, selectedRecordReason)
      : review;
  } catch {
    return reviewWithReason(
      buildApprovedHandoffContextUpdateRecordReviewV01({
        ...baseInput,
        records: [],
      }),
      "handoff_context_update_review_read_failed",
    );
  } finally {
    db?.close();
  }
}

function listPersistedHandoffContextUpdateReviewRecordsV01({
  db,
  limit,
}: {
  db: HandoffContextUpdateWriteDbLike;
  limit?: number;
}): unknown[] {
  const limitValue = Math.max(1, Math.min(limit ?? 50, 100));
  const rows = db
    .prepare(
      `SELECT record_id, idempotency_key, created_at, scope, operator_ref, record_fingerprint, record_json, receipt_json
       FROM ${HANDOFF_CONTEXT_UPDATE_WRITE_TABLE}
       WHERE scope = ?
       ORDER BY created_at DESC, record_id DESC
       LIMIT ?`,
    )
    .all(
      OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_SCOPE,
      limitValue,
    ) as HandoffContextUpdateRecordReviewRow[];
  return rows.map(rowToReviewRecord);
}

function readPersistedHandoffContextUpdateReviewRecordByIdV01(
  db: HandoffContextUpdateWriteDbLike,
  recordId: string,
): unknown | null {
  const row = db
    .prepare(
      `SELECT record_id, idempotency_key, created_at, scope, operator_ref, record_fingerprint, record_json, receipt_json
       FROM ${HANDOFF_CONTEXT_UPDATE_WRITE_TABLE}
       WHERE record_id = ? AND scope = ?
       LIMIT 1`,
    )
    .get(
      recordId,
      OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_SCOPE,
    ) as HandoffContextUpdateRecordReviewRow | undefined;
  return row ? rowToReviewRecord(row) : null;
}

export function isSafeHandoffContextUpdateRecordReviewDbPathV01(
  value: unknown,
): value is string {
  if (typeof value !== "string") return false;
  if (!value.endsWith(".sqlite") && !value.endsWith(".db")) return false;
  if (value.startsWith("/") || /^[A-Za-z]:/.test(value)) return false;
  if (
    value.includes("\\") ||
    value.includes("//") ||
    value.includes("..") ||
    value.includes("\0")
  ) {
    return false;
  }
  if (!safeContextUpdateDbPathPrefixes.some((prefix) => value.startsWith(prefix))) {
    return false;
  }
  const normalized = value.toLowerCase();
  return !privateDbPathMarkers.some((marker) => normalized.includes(marker));
}

function reviewWithReason(
  review: ApprovedHandoffContextUpdateRecordReview,
  reason: string,
): ApprovedHandoffContextUpdateRecordReview {
  return {
    ...review,
    source_refs: uniqueSortedStrings([
      ...review.source_refs,
      HANDOFF_CONTEXT_UPDATE_RECORD_REVIEW_FOR_WEB_REF,
    ]),
    insufficient_data_reasons: uniqueSortedStrings([
      ...review.insufficient_data_reasons,
      reason,
    ]),
  };
}

function rowToReviewRecord(row: HandoffContextUpdateRecordReviewRow): unknown {
  const parsedRecord = safeParseRecordJson(row);
  const persistedNoSideEffects = safeParseReceiptNoSideEffects(row.receipt_json);
  if (!isRecord(parsedRecord)) return parsedRecord;

  const recordWithoutNoSideEffects = { ...parsedRecord };
  delete recordWithoutNoSideEffects.no_side_effects;
  if (persistedNoSideEffects) {
    return {
      ...recordWithoutNoSideEffects,
      no_side_effects: persistedNoSideEffects,
    };
  }
  return recordWithoutNoSideEffects;
}

function safeParseRecordJson(row: HandoffContextUpdateRecordReviewRow): unknown {
  try {
    const parsed = JSON.parse(row.record_json) as unknown;
    if (isRecord(parsed)) return parsed;
  } catch {
    // Keep the review builder responsible for marking malformed rows invalid.
  }
  return {
    record_id: row.record_id,
    idempotency_key: row.idempotency_key,
    created_at: row.created_at,
    scope: row.scope,
    record_fingerprint: row.record_fingerprint,
  };
}

function safeParseReceiptNoSideEffects(
  receiptJson: string,
): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(receiptJson) as unknown;
    if (!isRecord(parsed)) return null;
    const noSideEffects = parsed.no_side_effects;
    return isRecord(noSideEffects) ? noSideEffects : null;
  } catch {
    return null;
  }
}

function recordIdFromReviewRecord(record: unknown): string | null {
  return isRecord(record) && typeof record.record_id === "string"
    ? record.record_id
    : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function uniqueSortedStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}
