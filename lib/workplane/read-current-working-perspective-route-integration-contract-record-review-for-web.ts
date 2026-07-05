import { existsSync } from "node:fs";
import { resolve } from "node:path";

import Database from "better-sqlite3";

import { buildCurrentWorkingPerspectiveRouteIntegrationContractRecordReviewV01 } from "@/lib/workplane/current-working-perspective-route-integration-contract-record-review";
import {
  currentWorkingPerspectiveRouteIntegrationContractWriteSchemaExistsV01,
  listCurrentWorkingPerspectiveRouteIntegrationContractRecordsV01,
  type CurrentWorkingPerspectiveRouteIntegrationContractWriteDbLike,
} from "@/lib/workplane/current-working-perspective-route-integration-contract-write";
import type { CurrentWorkingPerspectiveRouteIntegrationContractRecordReview } from "@/types/current-working-perspective-route-integration-contract-record-review";

export function readCurrentWorkingPerspectiveRouteIntegrationContractRecordReviewForWebV01(
  input: {
    db_path?: string | null;
    limit?: number;
    as_of?: string;
    source_refs?: string[];
  } = {},
): CurrentWorkingPerspectiveRouteIntegrationContractRecordReview {
  if (!input.db_path) {
    return buildCurrentWorkingPerspectiveRouteIntegrationContractRecordReviewV01({
      records: [],
      as_of: input.as_of,
      source_refs: input.source_refs,
    });
  }
  if (
    !isSafeCurrentWorkingPerspectiveRouteIntegrationContractReadDbPathV01(
      input.db_path,
    )
  ) {
    return buildCurrentWorkingPerspectiveRouteIntegrationContractRecordReviewV01({
      records: [],
      as_of: input.as_of,
      source_refs: input.source_refs,
    });
  }
  const resolvedPath = resolve(process.cwd(), input.db_path);
  if (!existsSync(resolvedPath)) {
    return buildCurrentWorkingPerspectiveRouteIntegrationContractRecordReviewV01({
      records: [],
      as_of: input.as_of,
      source_refs: input.source_refs,
    });
  }
  const db = new Database(resolvedPath, {
    readonly: true,
    fileMustExist: true,
  }) as Database.Database &
    CurrentWorkingPerspectiveRouteIntegrationContractWriteDbLike;
  try {
    if (!currentWorkingPerspectiveRouteIntegrationContractWriteSchemaExistsV01(db)) {
      return buildCurrentWorkingPerspectiveRouteIntegrationContractRecordReviewV01({
        store_result: {
          store_version:
            "current_working_perspective_route_integration_contract_store.v0.1",
          scope: "project:augnes",
          status: "schema_missing",
          ok: false,
          record: null,
          records: [],
          receipt: {
            receipt_version:
              "current_working_perspective_route_integration_contract_receipt.v0.1",
            record_id: null,
            idempotency_key: null,
            wrote: false,
            idempotent_replay: false,
            created_at: new Date(0).toISOString(),
            refused: true,
            refusal_reasons: ["schema_missing"],
            validation_hash: null,
            record_fingerprint: null,
            store_ref: null,
            source_refs: [],
            no_side_effects: {
              current_working_perspective_route_integration_contract_record_written:
                false,
              current_working_perspective_route_integration_contract_receipt_written:
                false,
              current_working_perspective_route_integration_contract_persisted:
                false,
              current_working_perspective_route_integration_contract_written:
                false,
              api_perspective_current_route_modified: false,
              current_working_perspective_route_response_replaced: false,
              upstream_current_working_perspective_source_tables_updated: false,
              upstream_current_working_perspective_source_tables_mutated: false,
              applied_current_working_perspective_snapshot_written: false,
              current_working_perspective_apply_record_written: false,
              current_working_perspective_update_contract_record_written: false,
              perspective_unit_written: false,
              next_work_bias_written: false,
              continuity_relay_written: false,
              continuity_relay_updated: false,
              live_relay_state_applied: false,
              handoff_context_mutated: false,
              handoff_context_applied: false,
              selected_refs_written_to_live_handoff: false,
              handoff_sent: false,
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
            current_working_perspective_route_integration_contract_record_written:
              false,
            current_working_perspective_route_integration_contract_receipt_written:
              false,
            current_working_perspective_route_integration_contract_persisted:
              false,
            current_working_perspective_route_integration_contract_written:
              false,
            api_perspective_current_route_modified: false,
            current_working_perspective_route_response_replaced: false,
            upstream_current_working_perspective_source_tables_updated: false,
            upstream_current_working_perspective_source_tables_mutated: false,
            applied_current_working_perspective_snapshot_written: false,
            current_working_perspective_apply_record_written: false,
            current_working_perspective_update_contract_record_written: false,
            perspective_unit_written: false,
            next_work_bias_written: false,
            continuity_relay_written: false,
            continuity_relay_updated: false,
            live_relay_state_applied: false,
            handoff_context_mutated: false,
            handoff_context_applied: false,
            selected_refs_written_to_live_handoff: false,
            handoff_sent: false,
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
        as_of: input.as_of,
        source_refs: input.source_refs,
      });
    }
    const storeResult =
      listCurrentWorkingPerspectiveRouteIntegrationContractRecordsV01({
        db,
        limit: input.limit,
      });
    return buildCurrentWorkingPerspectiveRouteIntegrationContractRecordReviewV01({
      store_result: storeResult,
      as_of: input.as_of,
      source_refs: input.source_refs,
    });
  } finally {
    db.close();
  }
}

export function isSafeCurrentWorkingPerspectiveRouteIntegrationContractReadDbPathV01(
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
      "tmp/current-working-perspective-route-integration-contracts/",
      ".tmp/current-working-perspective-route-integration-contracts/",
    ].some((prefix) => value.startsWith(prefix))
  ) {
    return false;
  }
  return !/token|secret|password|private|credential|key/i.test(value);
}
