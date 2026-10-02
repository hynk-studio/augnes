export const PROJECT_DIRECTION_SCHEMA = `
CREATE TABLE IF NOT EXISTS vnext_project_direction_records (
  ordinal INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('decision','grant','proposal','return','binding','revocation')),
  ref TEXT NOT NULL UNIQUE,
  recorded_at TEXT NOT NULL,
  body_json TEXT NOT NULL CHECK (json_valid(body_json) AND length(body_json) <= 32768),
  FOREIGN KEY (workspace_id,project_id) REFERENCES vnext_project_identities(workspace_id,project_id)
);
CREATE INDEX IF NOT EXISTS idx_vnext_project_direction_scope
  ON vnext_project_direction_records(workspace_id,project_id,kind,recorded_at,ordinal);
CREATE TRIGGER IF NOT EXISTS trg_vnext_project_direction_update
  BEFORE UPDATE ON vnext_project_direction_records BEGIN SELECT RAISE(ABORT,'project_direction_immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_vnext_project_direction_delete
  BEFORE DELETE ON vnext_project_direction_records BEGIN SELECT RAISE(ABORT,'project_direction_immutable'); END;
CREATE TABLE IF NOT EXISTS vnext_project_direction_credentials (
  grant_ref TEXT PRIMARY KEY REFERENCES vnext_project_direction_records(ref),
  token_hash TEXT UNIQUE,
  sequence INTEGER NOT NULL DEFAULT 0 CHECK (sequence >= 0),
  suspended INTEGER NOT NULL DEFAULT 0 CHECK (suspended IN (0,1))
);
`;
export function ensureProjectDirectionSchema(db) { db.exec(PROJECT_DIRECTION_SCHEMA); }
