import { existsSync } from "node:fs";
import { resolve } from "node:path";

import Database from "better-sqlite3";

import {
  currentWorkingPerspectiveApplyWriteSchemaExistsV01,
  readLatestAppliedCurrentWorkingPerspectiveSnapshotV01,
  type CurrentWorkingPerspectiveApplyWriteDbLike,
} from "@/lib/workplane/current-working-perspective-apply-write";
import type {
  CurrentWorkingPerspectiveAppliedSnapshot,
  CurrentWorkingPerspectiveApplyRecord,
  CurrentWorkingPerspectiveApplyStoreResult,
} from "@/types/current-working-perspective-apply-write";

export type AppliedCurrentWorkingPerspectiveReadStatus =
  | "no_applied_snapshot"
  | "schema_missing"
  | "latest_applied_snapshot_available"
  | "db_missing"
  | "invalid_db_path";

export interface AppliedCurrentWorkingPerspectiveRead {
  read_version: "applied_current_working_perspective_read.v0.1";
  status: AppliedCurrentWorkingPerspectiveReadStatus;
  scope: "project:augnes";
  latest_applied_snapshot: CurrentWorkingPerspectiveAppliedSnapshot | null;
  latest_record: CurrentWorkingPerspectiveApplyRecord | null;
  summary: {
    applied_snapshot_ref: string | null;
    source_contract_record_ref: string | null;
    source_current_working_perspective_ref: string | null;
    as_of: string | null;
    current_frame_summary: string | null;
    current_thesis_summary: string | null;
    active_goal_count: number;
    open_question_count: number;
    active_risk_count: number;
    next_candidate_count: number;
    staleness_status: string | null;
    applied_patch_count: number;
  };
  authority_boundary: {
    read_only: true;
    can_write_db: false;
    can_create_schema: false;
    can_mutate_current_working_perspective: false;
    can_replace_current_working_perspective_route_response: false;
  };
}

export function readAppliedCurrentWorkingPerspectiveForWebV01(
  input: {
    store_result?: CurrentWorkingPerspectiveApplyStoreResult | null;
    records?: CurrentWorkingPerspectiveApplyRecord[];
    db_path?: string | null;
  } = {},
): AppliedCurrentWorkingPerspectiveRead {
  const fromStore =
    input.store_result?.applied_snapshot ??
    input.store_result?.applied_snapshots?.[0] ??
    input.records?.[0]?.applied_snapshot ??
    null;
  const record =
    input.store_result?.record ?? input.store_result?.records?.[0] ??
    input.records?.[0] ??
    null;
  if (fromStore) return readResult("latest_applied_snapshot_available", fromStore, record);

  if (input.db_path) {
    if (!isSafeAppliedCurrentWorkingPerspectiveReadDbPathV01(input.db_path)) {
      return readResult("invalid_db_path", null, null);
    }
    const resolvedPath = resolve(process.cwd(), input.db_path);
    if (!existsSync(resolvedPath)) return readResult("db_missing", null, null);
    const db = new Database(resolvedPath, {
      readonly: true,
      fileMustExist: true,
    }) as Database.Database & CurrentWorkingPerspectiveApplyWriteDbLike;
    try {
      if (!currentWorkingPerspectiveApplyWriteSchemaExistsV01(db)) {
        return readResult("schema_missing", null, null);
      }
      const latest = readLatestAppliedCurrentWorkingPerspectiveSnapshotV01({
        db,
      });
      return latest.applied_snapshot
        ? readResult(
            "latest_applied_snapshot_available",
            latest.applied_snapshot,
            latest.record,
          )
        : readResult("no_applied_snapshot", null, null);
    } finally {
      db.close();
    }
  }

  return readResult("no_applied_snapshot", null, null);
}

export function isSafeAppliedCurrentWorkingPerspectiveReadDbPathV01(
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
      "tmp/current-working-perspective-applies/",
      ".tmp/current-working-perspective-applies/",
    ].some((prefix) => value.startsWith(prefix))
  ) {
    return false;
  }
  return !/token|secret|password|private|credential|key/i.test(value);
}

function readResult(
  status: AppliedCurrentWorkingPerspectiveReadStatus,
  snapshot: CurrentWorkingPerspectiveAppliedSnapshot | null,
  record: CurrentWorkingPerspectiveApplyRecord | null,
): AppliedCurrentWorkingPerspectiveRead {
  const cwp = snapshot?.applied_current_working_perspective ?? null;
  return {
    read_version: "applied_current_working_perspective_read.v0.1",
    status,
    scope: "project:augnes",
    latest_applied_snapshot: snapshot,
    latest_record: record,
    summary: {
      applied_snapshot_ref: snapshot?.applied_snapshot_ref ?? null,
      source_contract_record_ref: snapshot?.source_contract_record_ref ?? null,
      source_current_working_perspective_ref:
        snapshot?.source_current_working_perspective_ref ?? null,
      as_of: snapshot?.as_of ?? null,
      current_frame_summary: cwp?.current_frame?.summary ?? null,
      current_thesis_summary: cwp?.current_thesis?.summary ?? null,
      active_goal_count: cwp?.active_goals?.length ?? 0,
      open_question_count: cwp?.open_questions?.length ?? 0,
      active_risk_count: cwp?.active_risks?.length ?? 0,
      next_candidate_count: cwp?.next_candidates?.length ?? 0,
      staleness_status: cwp?.staleness?.status ?? null,
      applied_patch_count: snapshot?.applied_patch_count ?? 0,
    },
    authority_boundary: {
      read_only: true,
      can_write_db: false,
      can_create_schema: false,
      can_mutate_current_working_perspective: false,
      can_replace_current_working_perspective_route_response: false,
    },
  };
}
