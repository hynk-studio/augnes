import { existsSync } from "node:fs";
import { resolve } from "node:path";

import Database from "better-sqlite3";

import {
  handoffContextApplyWriteSchemaExistsV01,
  readLatestAppliedHandoffContextSnapshotV01,
  type HandoffContextApplyWriteDbLike,
} from "@/lib/workplane/handoff-context-apply-write";
import type {
  AppliedHandoffContextSnapshot,
  HandoffContextApplyRecord,
  HandoffContextApplyStoreResult,
} from "@/types/handoff-context-apply-write";

export type AppliedHandoffContextReadStatus =
  | "no_applied_handoff_context_snapshot"
  | "schema_missing"
  | "latest_applied_handoff_context_snapshot_available"
  | "db_missing"
  | "invalid_db_path";

export interface AppliedHandoffContextRead {
  read_version: "applied_handoff_context_read.v0.1";
  status: AppliedHandoffContextReadStatus;
  scope: "project:augnes";
  latest_applied_snapshot: AppliedHandoffContextSnapshot | null;
  latest_record: HandoffContextApplyRecord | null;
  summary: {
    applied_handoff_context_snapshot_ref: string | null;
    source_contract_record_ref: string | null;
    source_route_integration_read_ref: string | null;
    as_of: string | null;
    section_counts: Record<string, number>;
    entry_count: number;
    previous_context_used: boolean;
    copy_export_still_pending: boolean;
    send_still_pending: boolean;
  };
  authority_boundary: {
    read_only: true;
    can_write_db: false;
    can_create_schema: false;
    can_apply_handoff_context_update_live: false;
    can_send_handoff: false;
    can_copy_export_handoff_packet: false;
    can_mutate_memory: false;
    can_call_github: false;
    can_call_provider_openai: false;
  };
}

export function readAppliedHandoffContextForWebV01(
  input: {
    store_result?: HandoffContextApplyStoreResult | null;
    records?: HandoffContextApplyRecord[];
    db_path?: string | null;
  } = {},
): AppliedHandoffContextRead {
  const fromStore =
    input.store_result?.applied_snapshot ??
    input.store_result?.applied_snapshots?.[0] ??
    input.records?.[0]?.applied_snapshot ??
    null;
  const record =
    input.store_result?.record ??
    input.store_result?.records?.[0] ??
    input.records?.[0] ??
    null;
  if (fromStore) {
    return readResult(
      "latest_applied_handoff_context_snapshot_available",
      fromStore,
      record,
    );
  }
  if (input.db_path) {
    if (!isSafeAppliedHandoffContextReadDbPathV01(input.db_path)) {
      return readResult("invalid_db_path", null, null);
    }
    const resolvedPath = resolve(process.cwd(), input.db_path);
    if (!existsSync(resolvedPath)) return readResult("db_missing", null, null);
    const db = new Database(resolvedPath, {
      readonly: true,
      fileMustExist: true,
    }) as Database.Database & HandoffContextApplyWriteDbLike;
    try {
      if (!handoffContextApplyWriteSchemaExistsV01(db)) {
        return readResult("schema_missing", null, null);
      }
      const latest = readLatestAppliedHandoffContextSnapshotV01({ db });
      return latest.applied_snapshot
        ? readResult(
            "latest_applied_handoff_context_snapshot_available",
            latest.applied_snapshot,
            latest.record,
          )
        : readResult("no_applied_handoff_context_snapshot", null, null);
    } finally {
      db.close();
    }
  }
  return readResult("no_applied_handoff_context_snapshot", null, null);
}

export function isSafeAppliedHandoffContextReadDbPathV01(
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
      "tmp/handoff-context-applies/",
      ".tmp/handoff-context-applies/",
    ].some((prefix) => value.startsWith(prefix))
  ) {
    return false;
  }
  return !/token|secret|password|private|credential|key/i.test(value);
}

function readResult(
  status: AppliedHandoffContextReadStatus,
  snapshot: AppliedHandoffContextSnapshot | null,
  record: HandoffContextApplyRecord | null,
): AppliedHandoffContextRead {
  const context = snapshot?.applied_handoff_context ?? null;
  return {
    read_version: "applied_handoff_context_read.v0.1",
    status,
    scope: "project:augnes",
    latest_applied_snapshot: snapshot,
    latest_record: record,
    summary: {
      applied_handoff_context_snapshot_ref:
        snapshot?.applied_handoff_context_snapshot_ref ?? null,
      source_contract_record_ref:
        snapshot?.source_handoff_context_update_contract_record_ref ?? null,
      source_route_integration_read_ref:
        snapshot?.source_route_integration_read_ref ?? null,
      as_of: snapshot?.as_of ?? null,
      section_counts: snapshot
        ? countBy(
            snapshot.applied_handoff_context_entries.map(
              (entry) => entry.handoff_section,
            ),
          )
        : {},
      entry_count: snapshot?.applied_entry_count ?? 0,
      previous_context_used: context?.previous_context_summary.supplied ?? false,
      copy_export_still_pending:
        context?.apply_metadata.future_copy_export_required ?? false,
      send_still_pending: context?.apply_metadata.future_send_required ?? false,
    },
    authority_boundary: {
      read_only: true,
      can_write_db: false,
      can_create_schema: false,
      can_apply_handoff_context_update_live: false,
      can_send_handoff: false,
      can_copy_export_handoff_packet: false,
      can_mutate_memory: false,
      can_call_github: false,
      can_call_provider_openai: false,
    },
  };
}

function countBy(values: unknown[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, value) => {
    if (typeof value !== "string" || !value) return acc;
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}
