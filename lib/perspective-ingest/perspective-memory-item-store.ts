import { randomUUID } from "node:crypto";
import { openDatabase } from "@/lib/db";
import { getPerspectiveMemoryProductPersistenceBoundaryRecord } from "@/lib/perspective-ingest/perspective-memory-product-persistence-boundary-store";
import {
  PERSPECTIVE_MEMORY_ITEM_LIST_VERSION,
  PERSPECTIVE_MEMORY_ITEM_MAX_ITEMS,
  PERSPECTIVE_MEMORY_ITEM_STORE_BACKEND,
  buildPerspectiveMemoryItemFromBoundaryRecord,
  createEmptyPerspectiveMemoryItemList,
  filterPerspectiveMemoryItems,
  isPerspectiveMemoryItemStatus,
  normalizePerspectiveMemoryItemList,
  safeParsePerspectiveMemoryItem,
  updatePerspectiveMemoryItemStatus,
  type PerspectiveMemoryItemCreateInput,
  type PerspectiveMemoryItemKind,
  type PerspectiveMemoryItemListV0,
  type PerspectiveMemoryItemStatus,
  type PerspectiveMemoryItemUserConfirmation,
  type PerspectiveMemoryItemV0,
} from "@/lib/perspective-ingest/perspective-memory-item";

export type PerspectiveMemoryItemCreateStoreInput = {
  sourceBoundaryRecordId: string;
  userConfirmation: PerspectiveMemoryItemUserConfirmation;
  nowIso?: string;
  itemId?: string;
};

export type PerspectiveMemoryItemCreateStoreResult =
  | {
      ok: true;
      created: boolean;
      idempotent_replay: boolean;
      item: PerspectiveMemoryItemV0;
    }
  | {
      ok: false;
      blocked_reasons: string[];
    };

export type PerspectiveMemoryItemStatusUpdateResult =
  | {
      ok: true;
      item: PerspectiveMemoryItemV0;
    }
  | {
      ok: false;
      blocked_reasons: string[];
    };

type PerspectiveMemoryItemRow = {
  item_id: string;
  item_status: PerspectiveMemoryItemStatus | string;
  memory_kind: PerspectiveMemoryItemKind | string;
  source_boundary_record_id: string;
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
  item_title: string;
  item_summary: string;
  item_json: string;
  created_at: string;
  updated_at: string;
};

export function createPerspectiveMemoryItemFromBoundaryRecord(
  input: PerspectiveMemoryItemCreateStoreInput,
): PerspectiveMemoryItemCreateStoreResult {
  const boundaryRecord = getPerspectiveMemoryProductPersistenceBoundaryRecord(
    input.sourceBoundaryRecordId,
  );
  if (!boundaryRecord) {
    return {
      ok: false,
      blocked_reasons: [
        `unknown source boundary record: ${input.sourceBoundaryRecordId}`,
      ],
    };
  }

  const nowIso = input.nowIso ?? new Date().toISOString();
  const itemId = input.itemId ?? `perspective-memory-item:${randomUUID()}`;
  const buildInput: PerspectiveMemoryItemCreateInput = {
    nowIso,
    itemId,
    boundaryRecord,
    userConfirmation: input.userConfirmation,
  };
  const built = buildPerspectiveMemoryItemFromBoundaryRecord(buildInput);
  if (!built.ok) return built;

  const db = openDatabase();
  try {
    const createItem = db.transaction(
      (): PerspectiveMemoryItemCreateStoreResult => {
        const existingByBoundary = selectPerspectiveMemoryItemRowByBoundaryId(
          db,
          boundaryRecord.record_id,
        );
        if (existingByBoundary) {
          const existingItem = safeParsePerspectiveMemoryItem(
            existingByBoundary.item_json,
          );
          if (existingItem) {
            return {
              ok: true,
              created: false,
              idempotent_replay: true,
              item: existingItem,
            };
          }
          return {
            ok: false,
            blocked_reasons: [
              `existing perspective-memory item is invalid for boundary record: ${boundaryRecord.record_id}`,
            ],
          };
        }

        db.prepare(
          `
            INSERT INTO perspective_memory_items (
              item_id,
              item_status,
              memory_kind,
              source_boundary_record_id,
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
              item_title,
              item_summary,
              item_json,
              created_at,
              updated_at
            )
            VALUES (
              @item_id,
              @item_status,
              @memory_kind,
              @source_boundary_record_id,
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
              @item_title,
              @item_summary,
              @item_json,
              @created_at,
              @updated_at
            )
          `,
        ).run(itemToRow(built.item));

        return {
          ok: true,
          created: true,
          idempotent_replay: false,
          item: built.item,
        };
      },
    );
    return createItem();
  } finally {
    db.close();
  }
}

export function listPerspectiveMemoryItems({
  itemStatus,
  memoryKind,
  sourceBoundaryRecordId,
  sourceValidationResultState,
  limit = 50,
}: {
  itemStatus?: PerspectiveMemoryItemStatus | null;
  memoryKind?: PerspectiveMemoryItemKind | null;
  sourceBoundaryRecordId?: string | null;
  sourceValidationResultState?: "PASS" | "PASS with follow-up" | null;
  limit?: number | null;
} = {}): PerspectiveMemoryItemListV0 {
  const clauses: string[] = [];
  const params: Array<string | number> = [];
  if (itemStatus) {
    clauses.push("item_status = ?");
    params.push(itemStatus);
  }
  if (memoryKind) {
    clauses.push("memory_kind = ?");
    params.push(memoryKind);
  }
  if (sourceBoundaryRecordId) {
    clauses.push("source_boundary_record_id = ?");
    params.push(sourceBoundaryRecordId);
  }
  params.push(normalizeLimit(limit));
  const nowIso = new Date().toISOString();
  const db = openDatabase();
  try {
    const rows = db
      .prepare(
        `
          SELECT
            item_id,
            item_status,
            memory_kind,
            source_boundary_record_id,
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
            item_title,
            item_summary,
            item_json,
            created_at,
            updated_at
          FROM perspective_memory_items
          ${clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : ""}
          ORDER BY created_at DESC, item_id ASC
          LIMIT ?
        `,
      )
      .all(...params) as PerspectiveMemoryItemRow[];
    return normalizePerspectiveMemoryItemList(
      {
        item_list_version: PERSPECTIVE_MEMORY_ITEM_LIST_VERSION,
        updated_at: nowIso,
        items: filterPerspectiveMemoryItems(
          rows
            .map((row) => safeParsePerspectiveMemoryItem(row.item_json))
            .filter((item): item is PerspectiveMemoryItemV0 => item != null),
          {
            itemStatus,
            memoryKind,
            sourceBoundaryRecordId,
            sourceValidationResultState,
            limit,
          },
        ),
      },
      nowIso,
    );
  } finally {
    db.close();
  }
}

export function getPerspectiveMemoryItem(itemId: string) {
  const db = openDatabase();
  try {
    const row = selectPerspectiveMemoryItemRowById(db, itemId);
    return row ? safeParsePerspectiveMemoryItem(row.item_json) : null;
  } finally {
    db.close();
  }
}

export function getPerspectiveMemoryItemBySourceBoundaryRecord(
  sourceBoundaryRecordId: string,
) {
  const db = openDatabase();
  try {
    const row = selectPerspectiveMemoryItemRowByBoundaryId(
      db,
      sourceBoundaryRecordId,
    );
    return row ? safeParsePerspectiveMemoryItem(row.item_json) : null;
  } finally {
    db.close();
  }
}

export function updatePerspectiveMemoryItemStatusInStore({
  itemId,
  itemStatus,
}: {
  itemId: string;
  itemStatus: PerspectiveMemoryItemStatus;
}): PerspectiveMemoryItemStatusUpdateResult {
  if (!isPerspectiveMemoryItemStatus(itemStatus)) {
    return { ok: false, blocked_reasons: ["item_status is not supported"] };
  }
  const nowIso = new Date().toISOString();
  const db = openDatabase();
  try {
    const updateItem = db.transaction(
      (): PerspectiveMemoryItemStatusUpdateResult => {
        const row = selectPerspectiveMemoryItemRowById(db, itemId);
        if (!row) {
          return {
            ok: false,
            blocked_reasons: [`unknown perspective-memory item: ${itemId}`],
          };
        }
        const current = safeParsePerspectiveMemoryItem(row.item_json);
        if (!current) {
          return {
            ok: false,
            blocked_reasons: [`perspective-memory item is invalid: ${itemId}`],
          };
        }
        const nextItem = updatePerspectiveMemoryItemStatus(
          current,
          itemStatus,
          nowIso,
        );
        db.prepare(
          `
            UPDATE perspective_memory_items
            SET
              item_status = @item_status,
              item_json = @item_json,
              updated_at = @updated_at
            WHERE item_id = @item_id
          `,
        ).run(itemToRow(nextItem));
        return { ok: true, item: nextItem };
      },
    );
    return updateItem();
  } finally {
    db.close();
  }
}

export function emptyPerspectiveMemoryItemList() {
  return createEmptyPerspectiveMemoryItemList(new Date().toISOString());
}

function selectPerspectiveMemoryItemRowById(
  db: ReturnType<typeof openDatabase>,
  itemId: string,
) {
  return (
    db
      .prepare(
        `
          SELECT
            item_id,
            item_status,
            memory_kind,
            source_boundary_record_id,
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
            item_title,
            item_summary,
            item_json,
            created_at,
            updated_at
          FROM perspective_memory_items
          WHERE item_id = ?
        `,
      )
      .get(itemId) as PerspectiveMemoryItemRow | undefined
  );
}

function selectPerspectiveMemoryItemRowByBoundaryId(
  db: ReturnType<typeof openDatabase>,
  sourceBoundaryRecordId: string,
) {
  return (
    db
      .prepare(
        `
          SELECT
            item_id,
            item_status,
            memory_kind,
            source_boundary_record_id,
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
            item_title,
            item_summary,
            item_json,
            created_at,
            updated_at
          FROM perspective_memory_items
          WHERE source_boundary_record_id = ?
        `,
      )
      .get(sourceBoundaryRecordId) as PerspectiveMemoryItemRow | undefined
  );
}

function itemToRow(item: PerspectiveMemoryItemV0) {
  return {
    item_id: item.item_id,
    item_status: item.item_status,
    memory_kind: item.memory_kind,
    source_boundary_record_id: item.source_boundary_record_id,
    source_checklist_id: item.source_checklist_id,
    source_proposal_id: item.source_proposal_id,
    source_queue_item_id: item.source_queue_item_id,
    source_candidate_draft_id: item.source_candidate_draft_id,
    source_validation_result_state: item.source_validation_result_state,
    source_validation_summary_hash: item.source_validation_summary_hash,
    source_input_ref: item.source_input_ref,
    source_input_hash: item.source_input_hash,
    prepare_summary_ref: item.prepare_summary_ref,
    prepare_execution_summary_hash: item.prepare_execution_summary_hash,
    returned_envelope_hash: item.returned_envelope_hash,
    source_proposal_hash: item.source_proposal_hash,
    item_title: item.content.title,
    item_summary: item.content.summary,
    item_json: JSON.stringify(item),
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

function normalizeLimit(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return 50;
  return Math.max(1, Math.min(Math.trunc(value), PERSPECTIVE_MEMORY_ITEM_MAX_ITEMS));
}

export default {
  PERSPECTIVE_MEMORY_ITEM_STORE_BACKEND,
  createPerspectiveMemoryItemFromBoundaryRecord,
  emptyPerspectiveMemoryItemList,
  getPerspectiveMemoryItem,
  getPerspectiveMemoryItemBySourceBoundaryRecord,
  listPerspectiveMemoryItems,
  updatePerspectiveMemoryItemStatusInStore,
};
