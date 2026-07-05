import { existsSync } from "node:fs";
import { resolve } from "node:path";

import Database from "better-sqlite3";

import { buildHandoffContextUpdateContractRecordReviewV01 } from "./handoff-context-update-contract-record-review";
import {
  handoffContextUpdateContractWriteSchemaExistsV01,
  listHandoffContextUpdateContractRecordsV01,
  readHandoffContextUpdateContractRecordByIdV01,
  readHandoffContextUpdateContractRecordByIdempotencyKeyV01,
  type HandoffContextUpdateContractWriteDbLike,
} from "./handoff-context-update-contract-write";
import type {
  HandoffContextUpdateContractRecordReview,
  HandoffContextUpdateContractRecordReviewInput,
} from "@/types/handoff-context-update-contract-record-review";
import type { HandoffContextUpdateContractStoreResult } from "@/types/handoff-context-update-contract-write";

const safeDbPathPrefixes = [
  "tmp/handoff-context-update-contracts/",
  ".tmp/handoff-context-update-contracts/",
] as const;

export interface ReadHandoffContextUpdateContractRecordReviewForWebInput
  extends HandoffContextUpdateContractRecordReviewInput {
  db_path?: string | null;
  idempotency_key?: string | null;
  operator_ref?: string | null;
  limit?: number;
}

export function readHandoffContextUpdateContractRecordReviewForWebV01(
  input: ReadHandoffContextUpdateContractRecordReviewForWebInput = {},
): HandoffContextUpdateContractRecordReview {
  if (input.store_result || input.records) {
    return buildHandoffContextUpdateContractRecordReviewV01(input);
  }
  if (!input.db_path) {
    return buildHandoffContextUpdateContractRecordReviewV01(input);
  }
  if (!isSafeHandoffContextUpdateContractReviewDbPathV01(input.db_path)) {
    return buildHandoffContextUpdateContractRecordReviewV01({
      ...input,
      records: [
        {
          record_version: "handoff_context_update_contract_record.v0.1",
          problem: "invalid_db_path",
        },
      ],
    });
  }
  const resolvedPath = resolve(process.cwd(), input.db_path);
  if (!existsSync(resolvedPath)) {
    return buildHandoffContextUpdateContractRecordReviewV01(input);
  }

  let db: (Database.Database & HandoffContextUpdateContractWriteDbLike) | null =
    null;
  try {
    db = new Database(resolvedPath, { readonly: true, fileMustExist: true });
    let storeResult: HandoffContextUpdateContractStoreResult;
    if (!handoffContextUpdateContractWriteSchemaExistsV01(db)) {
      storeResult = {
        store_version: "handoff_context_update_contract_store.v0.1",
        scope: "project:augnes",
        status: "schema_missing",
        ok: false,
        record: null,
        records: [],
        receipt: {
          receipt_version: "handoff_context_update_contract_receipt.v0.1",
          record_id: null,
          idempotency_key: input.idempotency_key ?? null,
          wrote: false,
          idempotent_replay: false,
          created_at: new Date().toISOString(),
          refused: true,
          refusal_reasons: ["schema_missing"],
          validation_hash: null,
          record_fingerprint: null,
          store_ref: null,
          source_refs: [],
          no_side_effects: {
            handoff_context_update_contract_record_written: false,
            handoff_context_update_contract_receipt_written: false,
            handoff_context_update_contract_persisted: false,
            handoff_context_update_contract_written: false,
            handoff_context_updated: false,
            handoff_context_mutated: false,
            handoff_context_applied: false,
            handoff_sent: false,
            selected_refs_written_to_live_handoff: false,
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
          },
        },
        error_code: "schema_missing",
        no_side_effects: {
          handoff_context_update_contract_record_written: false,
          handoff_context_update_contract_receipt_written: false,
          handoff_context_update_contract_persisted: false,
          handoff_context_update_contract_written: false,
          handoff_context_updated: false,
          handoff_context_mutated: false,
          handoff_context_applied: false,
          handoff_sent: false,
          selected_refs_written_to_live_handoff: false,
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
        },
      };
    } else if (input.selected_record_id) {
      storeResult = readHandoffContextUpdateContractRecordByIdV01(
        input.selected_record_id,
        { db },
      );
    } else if (input.idempotency_key) {
      storeResult = readHandoffContextUpdateContractRecordByIdempotencyKeyV01(
        input.idempotency_key,
        { db },
      );
    } else {
      storeResult = listHandoffContextUpdateContractRecordsV01({
        db,
        operator_ref: input.operator_ref ?? undefined,
        limit: input.limit,
      });
    }
    return buildHandoffContextUpdateContractRecordReviewV01({
      ...input,
      store_result: storeResult,
    });
  } catch {
    return buildHandoffContextUpdateContractRecordReviewV01(input);
  } finally {
    db?.close();
  }
}

export function isSafeHandoffContextUpdateContractReviewDbPathV01(
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
