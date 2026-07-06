import { existsSync } from "node:fs";
import { resolve } from "node:path";

import Database from "better-sqlite3";

import { buildHandoffContextApplyRecordReviewV01 } from "./handoff-context-apply-record-review";
import {
  handoffContextApplyWriteSchemaExistsV01,
  listHandoffContextApplyRecordsV01,
  readHandoffContextApplyRecordByAppliedSnapshotRefV01,
  readHandoffContextApplyRecordByIdV01,
  readHandoffContextApplyRecordByIdempotencyKeyV01,
  type HandoffContextApplyWriteDbLike,
} from "./handoff-context-apply-write";
import type {
  HandoffContextApplyRecordReview,
  HandoffContextApplyRecordReviewInput,
} from "@/types/handoff-context-apply-record-review";
import type {
  HandoffContextApplyNoSideEffects,
  HandoffContextApplyStoreResult,
} from "@/types/handoff-context-apply-write";

const safeDbPathPrefixes = [
  "tmp/handoff-context-applies/",
  ".tmp/handoff-context-applies/",
] as const;

export interface ReadHandoffContextApplyRecordReviewForWebInput
  extends HandoffContextApplyRecordReviewInput {
  db_path?: string | null;
  idempotency_key?: string | null;
  operator_ref?: string | null;
  limit?: number;
}

export function readHandoffContextApplyRecordReviewForWebV01(
  input: ReadHandoffContextApplyRecordReviewForWebInput = {},
): HandoffContextApplyRecordReview {
  if (input.store_result || input.records) {
    return buildHandoffContextApplyRecordReviewV01(input);
  }
  if (!input.db_path) {
    return buildHandoffContextApplyRecordReviewV01(input);
  }
  if (!isSafeHandoffContextApplyReviewDbPathV01(input.db_path)) {
    return buildHandoffContextApplyRecordReviewV01({
      ...input,
      records: [
        {
          record_version: "handoff_context_apply_record.v0.1",
          problem: "invalid_db_path",
        },
      ],
    });
  }
  const resolvedPath = resolve(process.cwd(), input.db_path);
  if (!existsSync(resolvedPath)) {
    return buildHandoffContextApplyRecordReviewV01(input);
  }

  let db: (Database.Database & HandoffContextApplyWriteDbLike) | null = null;
  try {
    db = new Database(resolvedPath, { readonly: true, fileMustExist: true });
    let storeResult: HandoffContextApplyStoreResult;
    if (!handoffContextApplyWriteSchemaExistsV01(db)) {
      storeResult = schemaMissingStoreResult(input.idempotency_key ?? null);
    } else if (input.selected_record_id) {
      storeResult = readHandoffContextApplyRecordByIdV01(input.selected_record_id, {
        db,
      });
    } else if (input.selected_applied_handoff_context_snapshot_ref) {
      storeResult = readHandoffContextApplyRecordByAppliedSnapshotRefV01(
        input.selected_applied_handoff_context_snapshot_ref,
        { db },
      );
    } else if (input.idempotency_key) {
      storeResult = readHandoffContextApplyRecordByIdempotencyKeyV01(
        input.idempotency_key,
        { db },
      );
    } else {
      storeResult = listHandoffContextApplyRecordsV01({
        db,
        operator_ref: input.operator_ref ?? undefined,
        limit: input.limit,
      });
    }
    return buildHandoffContextApplyRecordReviewV01({
      ...input,
      store_result: storeResult,
    });
  } catch {
    return buildHandoffContextApplyRecordReviewV01(input);
  } finally {
    db?.close();
  }
}

export function isSafeHandoffContextApplyReviewDbPathV01(
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
  if (!safeDbPathPrefixes.some((prefix) => value.startsWith(prefix))) {
    return false;
  }
  return !/(private|secret|token|password|credential|key)/i.test(value);
}

function schemaMissingStoreResult(
  idempotencyKey: string | null,
): HandoffContextApplyStoreResult {
  const noSideEffects = {
    handoff_context_apply_record_written: false,
    handoff_context_apply_receipt_written: false,
    handoff_context_apply_persisted: false,
    applied_handoff_context_snapshot_written: false,
    handoff_context_update_applied_to_local_snapshot: false,
    live_handoff_context_updated: false,
    live_handoff_context_mutated: false,
    handoff_context_applied_live: false,
    handoff_context_mutated: false,
    handoff_sent: false,
    selected_refs_written_to_live_handoff: false,
    handoff_packet_copy_exported: false,
    handoff_packet_sent: false,
    api_perspective_current_route_modified: false,
    current_working_perspective_route_response_replaced: false,
    upstream_current_working_perspective_source_tables_updated: false,
    upstream_current_working_perspective_source_tables_mutated: false,
    applied_current_working_perspective_snapshot_written: false,
    current_working_perspective_apply_record_written: false,
    current_working_perspective_update_contract_record_written: false,
    route_integration_contract_record_written: false,
    handoff_context_update_contract_record_written: false,
    perspective_unit_written: false,
    next_work_bias_written: false,
    continuity_relay_written: false,
    continuity_relay_updated: false,
    live_relay_state_applied: false,
    memory_written: false,
    memory_promoted: false,
    memory_mutated: false,
    dogfood_metrics_written: false,
    dogfood_metrics_global_state_updated: false,
    dogfood_metric_snapshot_written: false,
    reuse_outcome_ledger_written: false,
    expected_observed_delta_written: false,
    work_episode_written: false,
    provider_called: false,
    github_called: false,
    codex_executed: false,
    pr_created: false,
    pr_merged: false,
    autonomous_action_run: false,
    graph_or_vector_store_created: false,
    rag_stack_created: false,
    browser_observed: false,
    crawler_or_browser_observer_created: false,
    workbench_action_button_rendered: false,
  } satisfies HandoffContextApplyNoSideEffects;
  return {
    store_version: "handoff_context_apply_store.v0.1",
    scope: "project:augnes",
    status: "schema_missing",
    ok: false,
    record: null,
    records: [],
    applied_snapshot: null,
    applied_snapshots: [],
    receipt: {
      receipt_version: "handoff_context_apply_receipt.v0.1",
      record_id: null,
      idempotency_key: idempotencyKey,
      wrote: false,
      idempotent_replay: false,
      created_at: new Date().toISOString(),
      refused: true,
      refusal_reasons: ["schema_missing"],
      validation_hash: null,
      record_fingerprint: null,
      store_ref: null,
      source_refs: [],
      no_side_effects: noSideEffects,
    },
    error_code: "schema_missing",
    no_side_effects: noSideEffects,
  };
}
