import type Database from "better-sqlite3";

const MAX_MANAGED_RUN_HISTORY_ROWS_V01 = 4_096;

export type ProjectManagedRunHistoryInspectionV01 =
  | {
      status: "none";
      reason: "no_project_run_history";
      inspected_count: number;
    }
  | {
      status: "present";
      reason: "project_scope_history";
      inspected_count: number;
    }
  | {
      status: "unavailable";
      reason:
        | "history_bound_exceeded"
        | "history_source_unavailable"
        | "metadata_invalid"
        | "metadata_scope_conflict";
      inspected_count: number;
    };

/**
 * Conservatively inspects the bounded managed-run ledger for project history.
 * The exact ledger scope is the durable owner: metadata may corroborate it but
 * cannot erase it. Exact project metadata attached to another scope is a
 * conflict, and malformed metadata fails closed instead of being ignored.
 */
export function inspectProjectManagedRunHistoryV01(
  db: Database.Database,
  input: {
    workspace_id: string;
    project_id: string;
    created_at_lte?: string;
  },
): ProjectManagedRunHistoryInspectionV01 {
  let rows: Array<{
    scope: string;
    metadata_json: string;
  }>;
  try {
    rows = db
      .prepare(
        `SELECT scope, metadata_json
           FROM autonomy_runs
          ${input.created_at_lte ? "WHERE created_at <= ?" : ""}
          ORDER BY created_at, run_id
          LIMIT ?`,
      )
      .all(
        ...(input.created_at_lte ? [input.created_at_lte] : []),
        MAX_MANAGED_RUN_HISTORY_ROWS_V01 + 1,
      ) as Array<{ scope: string; metadata_json: string }>;
  } catch {
    return {
      status: "unavailable",
      reason: "history_source_unavailable",
      inspected_count: 0,
    };
  }
  if (rows.length > MAX_MANAGED_RUN_HISTORY_ROWS_V01) {
    return {
      status: "unavailable",
      reason: "history_bound_exceeded",
      inspected_count: MAX_MANAGED_RUN_HISTORY_ROWS_V01,
    };
  }

  let projectScopeHistory = false;
  for (const row of rows) {
    let metadata: unknown;
    try {
      metadata = JSON.parse(row.metadata_json);
    } catch {
      return {
        status: "unavailable",
        reason: "metadata_invalid",
        inspected_count: rows.length,
      };
    }
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
      return {
        status: "unavailable",
        reason: "metadata_invalid",
        inspected_count: rows.length,
      };
    }
    if (row.scope === input.project_id) {
      projectScopeHistory = true;
      continue;
    }
    const values = metadata as Record<string, unknown>;
    if (
      values.workspace_id === input.workspace_id &&
      values.project_id === input.project_id
    ) {
      return {
        status: "unavailable",
        reason: "metadata_scope_conflict",
        inspected_count: rows.length,
      };
    }
  }
  return projectScopeHistory
    ? {
        status: "present",
        reason: "project_scope_history",
        inspected_count: rows.length,
      }
    : {
        status: "none",
        reason: "no_project_run_history",
        inspected_count: rows.length,
      };
}
