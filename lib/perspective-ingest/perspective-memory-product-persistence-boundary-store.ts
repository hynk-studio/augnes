import { randomUUID } from "node:crypto";
import { openDatabase } from "@/lib/db";

import {
  PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_MAX_RECORDS,
  PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_RECORD_LIST_VERSION,
  buildPerspectiveMemoryProductPersistenceBoundaryRecord,
  createEmptyPerspectiveMemoryProductPersistenceBoundaryRecordList,
  isPerspectiveMemoryProductPersistenceBoundaryStatus,
  normalizePerspectiveMemoryProductPersistenceBoundaryRecordList,
  safeParsePerspectiveMemoryProductPersistenceBoundaryRecord,
  updatePerspectiveMemoryProductPersistenceBoundaryRecordStatus,
  type PerspectiveMemoryProductPersistenceBoundaryCreateInput,
  type PerspectiveMemoryProductPersistenceBoundaryRecordListV0,
  type PerspectiveMemoryProductPersistenceBoundaryRecordV0,
  type PerspectiveMemoryProductPersistenceBoundaryStatus,
} from "@/lib/perspective-ingest/perspective-memory-product-persistence-boundary";

export const PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_STORE_BACKEND =
  "sqlite:lib/db.ts";

export type ProductPersistenceBoundaryCreateStoreInput = Omit<
  PerspectiveMemoryProductPersistenceBoundaryCreateInput,
  "nowIso" | "recordId"
> & {
  nowIso?: string;
  recordId?: string;
};

export type ProductPersistenceBoundaryCreateStoreResult =
  | {
      ok: true;
      created: boolean;
      idempotent_replay: boolean;
      record: PerspectiveMemoryProductPersistenceBoundaryRecordV0;
    }
  | {
      ok: false;
      blocked_reasons: string[];
    };

export type ProductPersistenceBoundaryStatusUpdateResult =
  | {
      ok: true;
      record: PerspectiveMemoryProductPersistenceBoundaryRecordV0;
    }
  | {
      ok: false;
      blocked_reasons: string[];
    };

type BoundaryRecordRow = {
  record_id: string;
  boundary_status: PerspectiveMemoryProductPersistenceBoundaryStatus | string;
  source_checklist_id: string;
  source_proposal_id: string;
  source_queue_item_id: string;
  source_candidate_draft_id: string;
  source_validation_result_state: string;
  source_validation_summary_hash: string;
  source_input_ref: string;
  source_input_hash: string;
  prepare_summary_ref: string;
  prepare_execution_summary_hash: string;
  returned_envelope_hash: string;
  source_proposal_hash: string;
  record_json: string;
  created_at: string;
  updated_at: string;
};

export function createPerspectiveMemoryProductPersistenceBoundaryRecord(
  input: ProductPersistenceBoundaryCreateStoreInput,
): ProductPersistenceBoundaryCreateStoreResult {
  const nowIso = input.nowIso ?? new Date().toISOString();
  const recordId =
    input.recordId ?? `perspective-memory-boundary:${randomUUID()}`;
  const built = buildPerspectiveMemoryProductPersistenceBoundaryRecord({
    ...input,
    nowIso,
    recordId,
  });
  if (!built.ok) return built;

  const db = openDatabase();
  try {
    const createRecord = db.transaction(
      (): ProductPersistenceBoundaryCreateStoreResult => {
        const existing = selectBoundaryRecordRowById(db, built.record.record_id);
        if (existing) {
          const existingRecord =
            safeParsePerspectiveMemoryProductPersistenceBoundaryRecord(
              existing.record_json,
            );
          if (existingRecord) {
            return {
              ok: true,
              created: false,
              idempotent_replay: true,
              record: existingRecord,
            };
          }
          return {
            ok: false,
            blocked_reasons: [
              `existing boundary record is invalid: ${built.record.record_id}`,
            ],
          };
        }

        db.prepare(
          `
            INSERT INTO perspective_memory_product_persistence_boundary_records (
              record_id,
              boundary_status,
              source_checklist_id,
              source_proposal_id,
              source_queue_item_id,
              source_candidate_draft_id,
              source_validation_result_state,
              source_validation_summary_hash,
              source_input_ref,
              source_input_hash,
              prepare_summary_ref,
              prepare_execution_summary_hash,
              returned_envelope_hash,
              source_proposal_hash,
              record_json,
              created_at,
              updated_at
            )
            VALUES (
              @record_id,
              @boundary_status,
              @source_checklist_id,
              @source_proposal_id,
              @source_queue_item_id,
              @source_candidate_draft_id,
              @source_validation_result_state,
              @source_validation_summary_hash,
              @source_input_ref,
              @source_input_hash,
              @prepare_summary_ref,
              @prepare_execution_summary_hash,
              @returned_envelope_hash,
              @source_proposal_hash,
              @record_json,
              @created_at,
              @updated_at
            )
          `,
        ).run(recordToRow(built.record));

        return {
          ok: true,
          created: true,
          idempotent_replay: false,
          record: built.record,
        };
      },
    );
    return createRecord();
  } finally {
    db.close();
  }
}

export function listPerspectiveMemoryProductPersistenceBoundaryRecords({
  boundaryStatus,
  sourceChecklistId,
  sourceProposalId,
  limit = 50,
}: {
  boundaryStatus?: PerspectiveMemoryProductPersistenceBoundaryStatus | null;
  sourceChecklistId?: string | null;
  sourceProposalId?: string | null;
  limit?: number | null;
} = {}): PerspectiveMemoryProductPersistenceBoundaryRecordListV0 {
  const clauses: string[] = [];
  const params: Array<string | number> = [];
  if (boundaryStatus) {
    clauses.push("boundary_status = ?");
    params.push(boundaryStatus);
  }
  if (sourceChecklistId) {
    clauses.push("source_checklist_id = ?");
    params.push(sourceChecklistId);
  }
  if (sourceProposalId) {
    clauses.push("source_proposal_id = ?");
    params.push(sourceProposalId);
  }
  params.push(normalizeLimit(limit));
  const db = openDatabase();
  try {
    const rows = db
      .prepare(
        `
          SELECT
            record_id,
            boundary_status,
            source_checklist_id,
            source_proposal_id,
            source_queue_item_id,
            source_candidate_draft_id,
            source_validation_result_state,
            source_validation_summary_hash,
            source_input_ref,
            source_input_hash,
            prepare_summary_ref,
            prepare_execution_summary_hash,
            returned_envelope_hash,
            source_proposal_hash,
            record_json,
            created_at,
            updated_at
          FROM perspective_memory_product_persistence_boundary_records
          ${clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : ""}
          ORDER BY created_at DESC, record_id ASC
          LIMIT ?
        `,
      )
      .all(...params) as BoundaryRecordRow[];
    return normalizePerspectiveMemoryProductPersistenceBoundaryRecordList(
      {
        boundary_record_list_version:
          PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_RECORD_LIST_VERSION,
        updated_at: new Date().toISOString(),
        records: rows
          .map((row) =>
            safeParsePerspectiveMemoryProductPersistenceBoundaryRecord(
              row.record_json,
            ),
          )
          .filter(
            (
              record,
            ): record is PerspectiveMemoryProductPersistenceBoundaryRecordV0 =>
              record != null,
          ),
      },
      new Date().toISOString(),
    );
  } finally {
    db.close();
  }
}

export function getPerspectiveMemoryProductPersistenceBoundaryRecord(
  recordId: string,
) {
  const db = openDatabase();
  try {
    const row = selectBoundaryRecordRowById(db, recordId);
    return row
      ? safeParsePerspectiveMemoryProductPersistenceBoundaryRecord(row.record_json)
      : null;
  } finally {
    db.close();
  }
}

export function updatePerspectiveMemoryProductPersistenceBoundaryRecordStatusInStore({
  recordId,
  boundaryStatus,
}: {
  recordId: string;
  boundaryStatus: PerspectiveMemoryProductPersistenceBoundaryStatus;
}): ProductPersistenceBoundaryStatusUpdateResult {
  if (!isPerspectiveMemoryProductPersistenceBoundaryStatus(boundaryStatus)) {
    return {
      ok: false,
      blocked_reasons: ["boundary_status is not supported"],
    };
  }
  const nowIso = new Date().toISOString();
  const db = openDatabase();
  try {
    const updateRecord = db.transaction(
      (): ProductPersistenceBoundaryStatusUpdateResult => {
        const row = selectBoundaryRecordRowById(db, recordId);
        if (!row) {
          return {
            ok: false,
            blocked_reasons: [`unknown boundary record: ${recordId}`],
          };
        }
        const current =
          safeParsePerspectiveMemoryProductPersistenceBoundaryRecord(
            row.record_json,
          );
        if (!current) {
          return {
            ok: false,
            blocked_reasons: [`boundary record is invalid: ${recordId}`],
          };
        }
        const nextRecord =
          updatePerspectiveMemoryProductPersistenceBoundaryRecordStatus(
            current,
            boundaryStatus,
            nowIso,
          );
        db.prepare(
          `
            UPDATE perspective_memory_product_persistence_boundary_records
            SET
              boundary_status = @boundary_status,
              record_json = @record_json,
              updated_at = @updated_at
            WHERE record_id = @record_id
          `,
        ).run(recordToRow(nextRecord));
        return { ok: true, record: nextRecord };
      },
    );
    return updateRecord();
  } finally {
    db.close();
  }
}

export function emptyPerspectiveMemoryProductPersistenceBoundaryRecordList() {
  return createEmptyPerspectiveMemoryProductPersistenceBoundaryRecordList(
    new Date().toISOString(),
  );
}

function selectBoundaryRecordRowById(
  db: ReturnType<typeof openDatabase>,
  recordId: string,
) {
  return (
    db
      .prepare(
        `
          SELECT
            record_id,
            boundary_status,
            source_checklist_id,
            source_proposal_id,
            source_queue_item_id,
            source_candidate_draft_id,
            source_validation_result_state,
            source_validation_summary_hash,
            source_input_ref,
            source_input_hash,
            prepare_summary_ref,
            prepare_execution_summary_hash,
            returned_envelope_hash,
            source_proposal_hash,
            record_json,
            created_at,
            updated_at
          FROM perspective_memory_product_persistence_boundary_records
          WHERE record_id = ?
        `,
      )
      .get(recordId) as BoundaryRecordRow | undefined
  );
}

function recordToRow(record: PerspectiveMemoryProductPersistenceBoundaryRecordV0) {
  return {
    record_id: record.record_id,
    boundary_status: record.boundary_status,
    source_checklist_id: record.source_checklist_id,
    source_proposal_id: record.source_proposal_id,
    source_queue_item_id: record.source_queue_item_id,
    source_candidate_draft_id: record.source_candidate_draft_id,
    source_validation_result_state: record.source_validation_result_state,
    source_validation_summary_hash: record.source_validation_summary_hash,
    source_input_ref: record.source_input_ref,
    source_input_hash: record.source_input_hash,
    prepare_summary_ref: record.prepare_summary_ref,
    prepare_execution_summary_hash: record.prepare_execution_summary_hash,
    returned_envelope_hash: record.returned_envelope_hash,
    source_proposal_hash: record.source_proposal_hash,
    record_json: JSON.stringify(record),
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

function normalizeLimit(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return 50;
  return Math.max(
    1,
    Math.min(
      Math.trunc(value),
      PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_MAX_RECORDS,
    ),
  );
}

export default {
  createPerspectiveMemoryProductPersistenceBoundaryRecord,
  emptyPerspectiveMemoryProductPersistenceBoundaryRecordList,
  getPerspectiveMemoryProductPersistenceBoundaryRecord,
  listPerspectiveMemoryProductPersistenceBoundaryRecords,
  updatePerspectiveMemoryProductPersistenceBoundaryRecordStatusInStore,
};
