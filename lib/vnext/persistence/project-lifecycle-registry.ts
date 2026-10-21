import { randomBytes } from "node:crypto";
import { migrateProjectSelectionV02, projectSelectionSchemaSqlV02, migrateProjectOrganizationV01, projectOrganizationSchemaSqlV01 } from "./project-lifecycle-schema.mjs";
import { isCurrentProjectSelectionRevision, type ProjectSelectionRevision } from "../project-selection";
import type Database from "better-sqlite3";

import {
  ACTIVE_PROJECT_SELECTION_VERSION_V01,
  RECENT_PROJECT_ENTRY_VERSION_V01,
  type ActiveProjectSelectionV01,
  type ProjectOrganizationV01,
} from "@/types/vnext/project-onboarding";

export const VNEXT_PROJECT_LIFECYCLE_SCHEMA_SQL_V01 = `
  CREATE TABLE IF NOT EXISTS vnext_recent_projects (
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    recent_project_entry_version TEXT NOT NULL CHECK (
      recent_project_entry_version = 'recent_project_entry.v0.1'
    ),
    created_at TEXT NOT NULL CHECK (length(trim(created_at)) > 0),
    last_opened_at TEXT NOT NULL CHECK (length(trim(last_opened_at)) > 0),
    PRIMARY KEY (workspace_id, project_id),
    FOREIGN KEY (workspace_id, project_id)
      REFERENCES vnext_project_identities(workspace_id, project_id)
      ON UPDATE RESTRICT ON DELETE RESTRICT
  );
  CREATE INDEX IF NOT EXISTS idx_vnext_recent_projects_workspace_opened
    ON vnext_recent_projects(workspace_id, last_opened_at DESC, project_id);

  ${projectSelectionSchemaSqlV02}
  ${projectOrganizationSchemaSqlV01}
`;

export class ProjectLifecycleErrorV01 extends Error {
  constructor(readonly code: "project_scope_conflict" | "active_selection_conflict" | "project_not_recent" | "project_organization_conflict" | "project_archived") {
    super(code);
    this.name = "ProjectLifecycleErrorV01";
  }
}

export function ensureVNextProjectLifecycleSchemaV01(db: Database.Database): void {
  db.pragma("foreign_keys = ON");
  migrateProjectSelectionV02(db);
  migrateProjectOrganizationV01(db);
  db.exec(VNEXT_PROJECT_LIFECYCLE_SCHEMA_SQL_V01);
}

export function touchRecentProjectV01(db: Database.Database, input: {
  workspace_id: string; project_id: string; now: string;
}): void {
  requireProject(db, input.workspace_id, input.project_id);
  db.prepare(`INSERT INTO vnext_recent_projects (
    workspace_id, project_id, recent_project_entry_version, created_at, last_opened_at
  ) VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(workspace_id, project_id) DO UPDATE SET last_opened_at = excluded.last_opened_at`)
    .run(input.workspace_id, input.project_id, RECENT_PROJECT_ENTRY_VERSION_V01, input.now, input.now);
}

/** Read the cleared state too. A never-selected new workspace has no row. */
export function readProjectSelectionStateV02(db: Database.Database, workspaceId: string) {
  const row = db.prepare(`SELECT * FROM vnext_active_project_selections WHERE workspace_id = ?`)
    .get(workspaceId) as { workspace_id: string; project_id: string | null; active_project_selection_version: string; selection_revision: string; selected_at: string } | undefined;
  if (row && (row.active_project_selection_version !== ACTIVE_PROJECT_SELECTION_VERSION_V01 ||
      !isCurrentProjectSelectionRevision(row.selection_revision))) throw new Error("project_selection_integrity");
  return row ?? null;
}

export function readActiveProjectSelectionV01(db: Database.Database, workspaceId: string): ActiveProjectSelectionV01 | null {
  const row = readProjectSelectionStateV02(db, workspaceId);
  return row?.project_id ? { ...row, project_id: row.project_id,
    active_project_selection_version: ACTIVE_PROJECT_SELECTION_VERSION_V01 } : null;
}

export function selectActiveProjectV01(db: Database.Database, input: {
  workspace_id: string; project_id: string; now: string;
  expected_project_id: string | null; expected_revision: ProjectSelectionRevision | null;
}): ActiveProjectSelectionV01 {
  return db.transaction(() => {
    requireProject(db, input.workspace_id, input.project_id);
    assertSelection(db, input);
    db.prepare(`INSERT INTO vnext_active_project_selections (
      workspace_id, project_id, active_project_selection_version, selection_revision, selected_at
    ) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(workspace_id) DO UPDATE SET project_id = excluded.project_id,
      selection_revision = excluded.selection_revision, selected_at = excluded.selected_at`)
      .run(input.workspace_id, input.project_id, ACTIVE_PROJECT_SELECTION_VERSION_V01,
        `selection:${randomBytes(16).toString("hex")}`, input.now);
    return readActiveProjectSelectionV01(db, input.workspace_id)!;
  }).immediate();
}

function assertSelection(db: Database.Database, input: {
  workspace_id: string; expected_project_id: string | null; expected_revision: ProjectSelectionRevision | null;
}) {
  const current = readProjectSelectionStateV02(db, input.workspace_id);
  if ((current?.project_id ?? null) !== input.expected_project_id ||
      (current?.selection_revision ?? null) !== input.expected_revision) {
    throw new ProjectLifecycleErrorV01("active_selection_conflict");
  }
}

export function removeRecentProjectV01(db: Database.Database, input: {
  workspace_id: string; project_id: string;
  expected_project_id: string | null; expected_revision: ProjectSelectionRevision | null;
}): boolean {
  return db.transaction(() => {
    assertSelection(db, input);
    const removed = db.prepare(`DELETE FROM vnext_recent_projects WHERE workspace_id = ? AND project_id = ?`)
      .run(input.workspace_id, input.project_id).changes === 1;
    db.prepare(`UPDATE vnext_active_project_selections SET project_id = NULL, selection_revision = ?, selected_at = ?
      WHERE workspace_id = ? AND project_id = ?`)
      .run(`selection:${randomBytes(16).toString("hex")}`, new Date().toISOString(), input.workspace_id, input.project_id);
    return removed;
  }).immediate();
}

export function listRecentProjectRowsV01(db: Database.Database, workspaceId: string) {
  return db.prepare(`SELECT r.workspace_id, r.project_id, r.created_at, r.last_opened_at
    FROM vnext_recent_projects r
    JOIN vnext_project_organization o USING(workspace_id, project_id)
    WHERE r.workspace_id = ? AND o.organization_state = 'working'
    ORDER BY r.last_opened_at DESC, r.project_id ASC`).all(workspaceId) as Array<{
      workspace_id: string; project_id: string; created_at: string; last_opened_at: string;
    }>;
}

function requireProject(db: Database.Database, workspaceId: string, projectId: string): void {
  const found = db.prepare(`SELECT 1 FROM vnext_project_identities WHERE workspace_id = ? AND project_id = ?`)
    .get(workspaceId, projectId);
  if (!found) throw new ProjectLifecycleErrorV01("project_scope_conflict");
}

export function readProjectOrganizationV01(db: Database.Database, scope: { workspace_id: string; project_id: string }): ProjectOrganizationV01 {
  const row = db.prepare(`SELECT organization_state AS state, organization_revision AS revision
    FROM vnext_project_organization WHERE workspace_id=? AND project_id=?`).get(scope.workspace_id, scope.project_id) as ProjectOrganizationV01 | undefined;
  if (!row || !["working", "archived"].includes(row.state) || !/^organization:[0-9a-f]{32}$/u.test(row.revision)) throw new Error("project_organization_integrity");
  return row;
}

export function readProjectOrganizationListRevisionV01(db: Database.Database, workspace: string): string | null {
  const row = db.prepare(`SELECT change_sequence, organization_revision FROM vnext_project_organization
    WHERE workspace_id=? ORDER BY change_sequence DESC LIMIT 1`).get(workspace) as { change_sequence: number; organization_revision: string } | undefined;
  return row ? `${row.change_sequence}:${row.organization_revision}` : null;
}

export function changeProjectOrganizationV01(db: Database.Database, input: {
  workspace_id: string; project_id: string; state: ProjectOrganizationV01["state"]; expected_organization_revision: string;
  expected_project_id: string | null; expected_revision: ProjectSelectionRevision | null;
}) {
  return db.transaction(() => {
    requireProject(db, input.workspace_id, input.project_id);
    assertSelection(db, input);
    const before = readProjectOrganizationV01(db, input);
    if (before.revision !== input.expected_organization_revision) throw new ProjectLifecycleErrorV01("project_organization_conflict");
    if (before.state !== input.state) {
      db.prepare(`UPDATE vnext_project_organization SET organization_state=?, organization_revision=?,
        change_sequence=(SELECT max(change_sequence)+1 FROM vnext_project_organization WHERE workspace_id=?)
        WHERE workspace_id=? AND project_id=?`).run(input.state, `organization:${randomBytes(16).toString("hex")}`,
        input.workspace_id, input.workspace_id, input.project_id);
      if (input.state === "archived") removeRecentProjectV01(db, input);
    }
    return { organization: readProjectOrganizationV01(db, input), selection: readProjectSelectionStateV02(db, input.workspace_id) };
  }).immediate();
}
