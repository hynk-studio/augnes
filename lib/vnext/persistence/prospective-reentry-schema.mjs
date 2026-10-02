// Machine-local operational eligibility only. Core packets and grants retain
// their existing owners. Portable project export deliberately omits this table.
export const PROSPECTIVE_REENTRY_SCHEMA = `
CREATE TABLE IF NOT EXISTS vnext_prospective_reentry (
  workspace_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  agenda_ref TEXT NOT NULL,
  host_fingerprint TEXT NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('armed','claimed','settled','stopped')),
  revision INTEGER NOT NULL CHECK (revision > 0),
  recovery_suspended INTEGER NOT NULL DEFAULT 0 CHECK (recovery_suspended IN (0,1)),
  body_json TEXT NOT NULL CHECK (json_valid(body_json) AND length(body_json) <= 200000),
  fingerprint TEXT NOT NULL,
  PRIMARY KEY (workspace_id, project_id, agenda_ref),
  FOREIGN KEY (workspace_id, project_id)
    REFERENCES vnext_project_identities(workspace_id, project_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vnext_prospective_active_host
  ON vnext_prospective_reentry(host_fingerprint) WHERE phase IN ('armed','claimed','settled');
CREATE UNIQUE INDEX IF NOT EXISTS idx_vnext_prospective_active_project
  ON vnext_prospective_reentry(workspace_id, project_id) WHERE phase IN ('armed','claimed','settled');
`;

export function ensureProspectiveReentrySchema(db) { db.exec(PROSPECTIVE_REENTRY_SCHEMA); }
