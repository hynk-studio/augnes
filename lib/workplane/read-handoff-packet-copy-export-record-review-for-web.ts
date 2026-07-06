import { existsSync } from "node:fs";
import { resolve } from "node:path";

import Database from "better-sqlite3";

import {
  buildHandoffPacketCopyExportRecordReviewV01,
} from "@/lib/workplane/handoff-packet-copy-export-record-review";
import {
  handoffPacketCopyExportWriteSchemaExistsV01,
  listHandoffPacketCopyExportRecordsV01,
  readHandoffPacketCopyExportRecordByIdV01,
  type HandoffPacketCopyExportWriteDbLike,
} from "@/lib/workplane/handoff-packet-copy-export-write";
import type { HandoffPacketCopyExportRecordReview } from "@/types/handoff-packet-copy-export-record-review";
import type { HandoffPacketCopyExportStoreResult } from "@/types/handoff-packet-copy-export-write";

export function readHandoffPacketCopyExportRecordReviewForWebV01(
  input: {
    store_result?: HandoffPacketCopyExportStoreResult | null;
    records?: unknown[];
    selected_record_id?: string | null;
    selected_exported_artifact_ref?: string | null;
    db_path?: string | null;
    source_refs?: string[];
  } = {},
): HandoffPacketCopyExportRecordReview {
  if (input.store_result || input.records) {
    return buildHandoffPacketCopyExportRecordReviewV01({
      store_result: input.store_result ?? null,
      records: input.records,
      selected_record_id: input.selected_record_id ?? null,
      selected_exported_artifact_ref: input.selected_exported_artifact_ref ?? null,
      source_refs: input.source_refs,
    });
  }
  if (!input.db_path) {
    return buildHandoffPacketCopyExportRecordReviewV01({
      records: [],
      selected_record_id: input.selected_record_id ?? null,
      selected_exported_artifact_ref: input.selected_exported_artifact_ref ?? null,
      source_refs: input.source_refs,
    });
  }
  if (!isSafeHandoffPacketCopyExportReadDbPathV01(input.db_path)) {
    return buildHandoffPacketCopyExportRecordReviewV01({
      records: [{ record_id: "invalid-db-path", problem: "invalid_db_path" }],
      source_refs: input.source_refs,
    });
  }
  const resolvedPath = resolve(process.cwd(), input.db_path);
  if (!existsSync(resolvedPath)) {
    return buildHandoffPacketCopyExportRecordReviewV01({
      records: [],
      selected_record_id: input.selected_record_id ?? null,
      selected_exported_artifact_ref: input.selected_exported_artifact_ref ?? null,
      source_refs: input.source_refs,
    });
  }
  const db = new Database(resolvedPath, {
    readonly: true,
    fileMustExist: true,
  }) as Database.Database & HandoffPacketCopyExportWriteDbLike;
  try {
    if (!handoffPacketCopyExportWriteSchemaExistsV01(db)) {
      return buildHandoffPacketCopyExportRecordReviewV01({
        store_result: {
          store_version: "handoff_packet_copy_export_store.v0.1",
          scope: "project:augnes",
          status: "schema_missing",
          ok: false,
          record: null,
          records: [],
          exported_artifact: null,
          exported_artifacts: [],
          receipt: {
            receipt_version: "handoff_packet_copy_export_receipt.v0.1",
            record_id: null,
            idempotency_key: null,
            wrote: false,
            idempotent_replay: false,
            created_at: new Date().toISOString(),
            refused: true,
            refusal_reasons: ["schema_missing"],
            validation_hash: null,
            record_fingerprint: null,
            store_ref: null,
            source_refs: [],
            no_side_effects: createEmptyNoSideEffects(),
          },
          error_code: "schema_missing",
          no_side_effects: createEmptyNoSideEffects(),
        },
        selected_record_id: input.selected_record_id ?? null,
        selected_exported_artifact_ref: input.selected_exported_artifact_ref ?? null,
        source_refs: input.source_refs,
      });
    }
    const result = input.selected_record_id
      ? readHandoffPacketCopyExportRecordByIdV01(input.selected_record_id, {
          db,
        })
      : listHandoffPacketCopyExportRecordsV01({ db, limit: 50 });
    return buildHandoffPacketCopyExportRecordReviewV01({
      store_result: result,
      selected_record_id: input.selected_record_id ?? null,
      selected_exported_artifact_ref: input.selected_exported_artifact_ref ?? null,
      source_refs: input.source_refs,
    });
  } finally {
    db.close();
  }
}

export function isSafeHandoffPacketCopyExportReadDbPathV01(
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
  if (
    ![
      "tmp/handoff-packet-copy-exports/",
      ".tmp/handoff-packet-copy-exports/",
    ].some((prefix) => value.startsWith(prefix))
  ) {
    return false;
  }
  return !/token|secret|password|private|credential|key/i.test(value);
}

function createEmptyNoSideEffects() {
  return {
    handoff_packet_copy_export_record_written: false,
    handoff_packet_copy_export_receipt_written: false,
    handoff_packet_copy_export_persisted: false,
    handoff_packet_exported_artifact_written: false,
    handoff_packet_materialized_to_local_artifact: false,
    handoff_packet_copied_to_clipboard: false,
    handoff_packet_exported_to_file: false,
    handoff_packet_download_created: false,
    clipboard_written: false,
    file_download_created: false,
    arbitrary_file_written: false,
    handoff_packet_file_written: false,
    handoff_packet_copied: false,
    handoff_packet_exported: false,
    handoff_sent: false,
    live_handoff_context_updated: false,
    live_handoff_context_mutated: false,
    handoff_context_applied_live: false,
    handoff_context_mutated: false,
    selected_refs_written_to_live_handoff: false,
    handoff_packet_copy_export_contract_record_written: false,
    handoff_context_apply_record_written: false,
    applied_handoff_context_snapshot_written: false,
    handoff_context_update_contract_record_written: false,
    api_perspective_current_route_modified: false,
    current_working_perspective_route_response_replaced: false,
    upstream_current_working_perspective_source_tables_updated: false,
    upstream_current_working_perspective_source_tables_mutated: false,
    applied_current_working_perspective_snapshot_written: false,
    current_working_perspective_apply_record_written: false,
    current_working_perspective_update_contract_record_written: false,
    route_integration_contract_record_written: false,
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
  } as const;
}
