import { existsSync } from "node:fs";
import { resolve } from "node:path";

import Database from "better-sqlite3";

import { buildApprovedHandoffContextUpdateRecordReviewV01 } from "@/lib/handoff/handoff-context-update-record-review";
import {
  handoffContextUpdateWriteSchemaExistsV01,
  listHandoffContextUpdateRecordsV01,
  readHandoffContextUpdateRecordByIdV01,
  type HandoffContextUpdateWriteDbLike,
} from "@/lib/handoff/handoff-context-update-write";
import type { ApprovedHandoffContextUpdateRecordReview } from "@/types/handoff-context-update-record-review";
import {
  OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_SCOPE,
  type OperatorApprovedHandoffContextUpdateNoSideEffects,
  type OperatorApprovedHandoffContextUpdateRecord,
} from "@/types/handoff-context-update-write";

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

    const listResult = listHandoffContextUpdateRecordsV01({
      db,
      limit: input.limit,
    });
    let records = withStoreNoSideEffects(
      listResult.records,
      listResult.no_side_effects,
    );
    let selectedRecordReason: string | null = null;

    if (input.selected_record_id) {
      const selectedRecordAlreadyListed = records.some(
        (record) => record.record_id === input.selected_record_id,
      );
      if (!selectedRecordAlreadyListed) {
        const selectedResult = readHandoffContextUpdateRecordByIdV01(
          input.selected_record_id,
          { db },
        );
        if (selectedResult.record) {
          records = [
            ...withStoreNoSideEffects(
              [selectedResult.record],
              selectedResult.no_side_effects,
            ),
            ...records,
          ];
        } else {
          selectedRecordReason =
            "handoff_context_update_review_selected_record_not_found";
        }
      }
    }

    const review = buildApprovedHandoffContextUpdateRecordReviewV01({
      ...baseInput,
      records,
      store_result: listResult,
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

function withStoreNoSideEffects(
  records: OperatorApprovedHandoffContextUpdateRecord[],
  noSideEffects: OperatorApprovedHandoffContextUpdateNoSideEffects,
): OperatorApprovedHandoffContextUpdateRecord[] {
  return records.map((record) =>
    "no_side_effects" in record ? record : { ...record, no_side_effects: noSideEffects },
  );
}

function uniqueSortedStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}
