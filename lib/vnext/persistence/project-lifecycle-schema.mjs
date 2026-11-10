// Both application startup and the canonical migration owner use this one
// forward migration. A cleared selection retains its observation identity.
export const projectSelectionSchemaSqlV02 = `
  CREATE TABLE IF NOT EXISTS vnext_active_project_selections (
    workspace_id TEXT PRIMARY KEY,
    project_id TEXT,
    active_project_selection_version TEXT NOT NULL CHECK (
      active_project_selection_version = 'active_project_selection.v0.2'
    ),
    selection_revision TEXT NOT NULL CHECK (
      length(selection_revision) = 42 AND substr(selection_revision, 1, 10) = 'selection:'
      AND substr(selection_revision, 11) NOT GLOB '*[^0-9a-f]*'
    ),
    selected_at TEXT NOT NULL CHECK (length(trim(selected_at)) > 0),
    FOREIGN KEY (workspace_id) REFERENCES vnext_workspace_identities(workspace_id)
      ON UPDATE RESTRICT ON DELETE RESTRICT,
    FOREIGN KEY (workspace_id, project_id)
      REFERENCES vnext_project_identities(workspace_id, project_id)
      ON UPDATE RESTRICT ON DELETE RESTRICT
  );
  CREATE TRIGGER IF NOT EXISTS trg_vnext_project_selection_retain
    BEFORE DELETE ON vnext_active_project_selections
    BEGIN SELECT RAISE(ABORT, 'project_selection_delete_refused'); END;
`;

const legacyTableSql = `CREATE TABLE vnext_active_project_selections (
  workspace_id TEXT PRIMARY KEY, project_id TEXT NOT NULL,
  active_project_selection_version TEXT NOT NULL CHECK (active_project_selection_version = 'active_project_selection.v0.1'),
  selection_revision INTEGER NOT NULL CHECK (selection_revision > 0),
  selected_at TEXT NOT NULL CHECK (length(trim(selected_at)) > 0),
  FOREIGN KEY (workspace_id, project_id) REFERENCES vnext_project_identities(workspace_id, project_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
)`;
const normalizedTable = sql => sql.replace(/IF NOT EXISTS\s+/gu, "").replace(/\s+/gu, " ").replace(/\s*([(),=])\s*/gu, "$1").trim();
const currentTableSql = projectSelectionSchemaSqlV02.slice(0, projectSelectionSchemaSqlV02.indexOf(";"));

// Local organization belongs to the existing project lifecycle. The sequence
// orders changes for bounded list observations; the random revision is the
// exact project's CAS identity and is refreshed by every restore.
export const projectOrganizationSchemaSqlV01 = `
  CREATE TABLE IF NOT EXISTS vnext_project_organization (
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    organization_state TEXT NOT NULL CHECK (organization_state IN ('working', 'archived')),
    organization_revision TEXT NOT NULL CHECK (
      length(organization_revision) = 45 AND substr(organization_revision, 1, 13) = 'organization:'
      AND substr(organization_revision, 14) NOT GLOB '*[^0-9a-f]*'
    ),
    change_sequence INTEGER NOT NULL CHECK (change_sequence > 0 AND change_sequence <= 9007199254740991),
    PRIMARY KEY (workspace_id, project_id),
    UNIQUE (workspace_id, change_sequence),
    FOREIGN KEY (workspace_id, project_id)
      REFERENCES vnext_project_identities(workspace_id, project_id)
      ON UPDATE RESTRICT ON DELETE RESTRICT
  );
  CREATE TRIGGER IF NOT EXISTS trg_vnext_project_organization_initialize
    AFTER INSERT ON vnext_project_identities
    BEGIN
      INSERT INTO vnext_project_organization
      VALUES (NEW.workspace_id, NEW.project_id, 'working', 'organization:' || lower(hex(randomblob(16))),
        (SELECT coalesce(max(change_sequence), 0) + 1 FROM vnext_project_organization WHERE workspace_id = NEW.workspace_id));
    END;
  CREATE TRIGGER IF NOT EXISTS trg_vnext_project_organization_retain
    BEFORE DELETE ON vnext_project_organization
    BEGIN SELECT RAISE(ABORT, 'project_organization_delete_refused'); END;
`;

export function migrateProjectOrganizationV01(db) {
  const table = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='vnext_project_organization'").get();
  if (table) {
    if (normalizedTable(table.sql) !== normalizedTable(projectOrganizationSchemaSqlV01.split(';')[0])) throw new Error("project_organization_schema_incompatible");
    return;
  }
  db.transaction(() => {
    db.exec(projectOrganizationSchemaSqlV01);
    // Not being recent never meant archived. Every predecessor project starts
    // working, independently of selection, recency, direction or root presence.
    db.exec(`INSERT INTO vnext_project_organization
      SELECT workspace_id, project_id, 'working', 'organization:' || lower(hex(randomblob(16))),
        row_number() OVER (PARTITION BY workspace_id ORDER BY rowid)
      FROM vnext_project_identities;`);
  }).immediate();
}

export function invalidateRestoredProjectOrganizationV01(db) {
  db.exec("UPDATE vnext_project_organization SET organization_revision='organization:' || lower(hex(randomblob(16)))");
}

/** Only the unpublished restore stage may discard live observation authority.
 * Keep the selected project/time and all history; each restore gets fresh CAS
 * identities, including workspaces that had never selected a project. */
export function invalidateRestoredProjectSelectionsV02(db) {
  const table = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='vnext_active_project_selections'").get();
  if (!table || normalizedTable(table.sql) !== normalizedTable(currentTableSql)) throw new Error("project_selection_schema_incompatible");
  db.transaction(() => {
    db.exec(`UPDATE vnext_active_project_selections SET selection_revision='selection:' || lower(hex(randomblob(16)));
      INSERT INTO vnext_active_project_selections
      SELECT w.workspace_id,NULL,'active_project_selection.v0.2','selection:' || lower(hex(randomblob(16))),w.created_at
      FROM vnext_workspace_identities w
      WHERE NOT EXISTS(SELECT 1 FROM vnext_active_project_selections a WHERE a.workspace_id=w.workspace_id);`);
  }).immediate();
}

export function migrateProjectSelectionV02(db) {
  const table = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='vnext_active_project_selections'").get();
  if (!table) {
    db.transaction(() => {
      db.exec(projectSelectionSchemaSqlV02);
      db.exec(`INSERT INTO vnext_active_project_selections
        SELECT workspace_id,NULL,'active_project_selection.v0.2',
          'selection:' || lower(hex(randomblob(16))),created_at FROM vnext_workspace_identities;`);
    }).immediate();
    return;
  }
  if (normalizedTable(table.sql) === normalizedTable(currentTableSql)) {
    db.exec(projectSelectionSchemaSqlV02);
    return;
  }
  if (normalizedTable(table.sql) !== normalizedTable(legacyTableSql)) {
    throw new Error("project_selection_schema_incompatible");
  }
  db.transaction(() => {
    db.exec(`ALTER TABLE vnext_active_project_selections RENAME TO vnext_active_project_selections_v01;`);
    db.exec(projectSelectionSchemaSqlV02);
    // Invalidate every pre-upgrade numeric or empty observation. The old writer
    // discarded cleared counters, so a maximum or timestamp cannot prove fresh.
    db.exec(`INSERT INTO vnext_active_project_selections
      SELECT w.workspace_id, a.project_id, 'active_project_selection.v0.2',
        'selection:' || lower(hex(randomblob(16))), coalesce(a.selected_at, w.created_at)
      FROM vnext_workspace_identities w
      LEFT JOIN vnext_active_project_selections_v01 a ON a.workspace_id=w.workspace_id;
      DROP TABLE vnext_active_project_selections_v01;`);
  }).immediate();
}
