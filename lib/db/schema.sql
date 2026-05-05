PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'runtime',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  agent_id TEXT,
  scope TEXT NOT NULL,
  title TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at TEXT,
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  agent_id TEXT,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES sessions(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

CREATE TABLE IF NOT EXISTS state_delta_proposals (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  state_key TEXT NOT NULL,
  before_value TEXT,
  after_value TEXT NOT NULL,
  operation TEXT NOT NULL,
  temporal_scope TEXT NOT NULL,
  valid_from TEXT,
  valid_until TEXT,
  stability TEXT NOT NULL,
  change_type TEXT NOT NULL,
  source_agent_id TEXT,
  source_session_id TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  proposed_at TEXT NOT NULL DEFAULT (datetime('now')),
  decided_at TEXT,
  prediction_error_score REAL NOT NULL DEFAULT 0,
  salience_score REAL NOT NULL DEFAULT 0,
  evidence_score REAL NOT NULL DEFAULT 0,
  conflict_score REAL NOT NULL DEFAULT 0,
  self_impact_score REAL NOT NULL DEFAULT 0,
  consolidation_status TEXT NOT NULL DEFAULT 'candidate',
  reinforcement_count INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT,
  last_evaluated_at TEXT,
  scoring_version TEXT NOT NULL DEFAULT 'v0.2-rule-001',
  scoring_reason TEXT,
  score_breakdown TEXT,
  FOREIGN KEY (source_agent_id) REFERENCES agents(id),
  FOREIGN KEY (source_session_id) REFERENCES sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_state_delta_proposals_scope_key
  ON state_delta_proposals(scope, state_key);

CREATE INDEX IF NOT EXISTS idx_state_delta_proposals_scope_consolidation
  ON state_delta_proposals(scope, status, consolidation_status, salience_score);

CREATE INDEX IF NOT EXISTS idx_state_delta_proposals_expires_at
  ON state_delta_proposals(expires_at);

CREATE TABLE IF NOT EXISTS state_entries (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  state_key TEXT NOT NULL,
  value TEXT NOT NULL,
  temporal_scope TEXT NOT NULL,
  valid_from TEXT,
  valid_until TEXT,
  stability TEXT NOT NULL,
  change_type TEXT NOT NULL,
  source_agent_id TEXT,
  source_session_id TEXT,
  source_transition_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_agent_id) REFERENCES agents(id),
  FOREIGN KEY (source_session_id) REFERENCES sessions(id),
  FOREIGN KEY (source_transition_id) REFERENCES state_transitions(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_state_entries_scope_key_current
  ON state_entries(scope, state_key);

CREATE TABLE IF NOT EXISTS state_transitions (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  state_key TEXT NOT NULL,
  before_value TEXT,
  after_value TEXT NOT NULL,
  temporal_scope TEXT NOT NULL,
  valid_from TEXT,
  valid_until TEXT,
  stability TEXT NOT NULL,
  change_type TEXT NOT NULL,
  source_agent_id TEXT,
  source_session_id TEXT,
  source_proposal_id TEXT,
  reason TEXT,
  committed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_agent_id) REFERENCES agents(id),
  FOREIGN KEY (source_session_id) REFERENCES sessions(id),
  FOREIGN KEY (source_proposal_id) REFERENCES state_delta_proposals(id)
);

CREATE INDEX IF NOT EXISTS idx_state_transitions_scope_key_time
  ON state_transitions(scope, state_key, committed_at);

CREATE TABLE IF NOT EXISTS state_tensions (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  state_key TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  severity TEXT NOT NULL DEFAULT 'medium',
  source_agent_id TEXT,
  source_session_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT,
  FOREIGN KEY (source_agent_id) REFERENCES agents(id),
  FOREIGN KEY (source_session_id) REFERENCES sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_state_tensions_scope_status
  ON state_tensions(scope, status);

CREATE TABLE IF NOT EXISTS action_records (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  state_key TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  source_agent_id TEXT,
  source_session_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (source_agent_id) REFERENCES agents(id),
  FOREIGN KEY (source_session_id) REFERENCES sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_action_records_scope_status
  ON action_records(scope, status);
