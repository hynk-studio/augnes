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

CREATE TABLE IF NOT EXISTS work_items (
  work_id TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'project:augnes',
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  priority TEXT NOT NULL DEFAULT 'normal',
  summary TEXT NOT NULL DEFAULT '',
  next_action TEXT NOT NULL DEFAULT '',
  user_attention_required INTEGER NOT NULL DEFAULT 0,
  related_state_keys TEXT NOT NULL DEFAULT '[]',
  links TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (scope, work_id)
);

CREATE INDEX IF NOT EXISTS idx_work_items_scope_updated
  ON work_items(scope, updated_at DESC);

CREATE TABLE IF NOT EXISTS work_events (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'project:augnes',
  actor TEXT NOT NULL,
  event_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  result_status TEXT,
  result_kind TEXT,
  related_action_id TEXT,
  related_pr TEXT,
  related_state_keys TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (scope, work_id) REFERENCES work_items(scope, work_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_work_events_scope_work_time
  ON work_events(scope, work_id, created_at DESC);

CREATE TABLE IF NOT EXISTS handoffs (
  handoff_id TEXT PRIMARY KEY,
  scope TEXT NOT NULL DEFAULT 'project:augnes',
  work_id TEXT,
  source_state_brief_ref TEXT,
  source_work_brief_ref TEXT,
  target_agent TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN (
      'draft',
      'ready',
      'delivered',
      'acknowledged',
      'reviewed',
      'superseded',
      'expired'
    )
  ),
  current_committed_state_summary TEXT NOT NULL,
  task_brief TEXT NOT NULL,
  expected_files TEXT NOT NULL DEFAULT '[]',
  expected_state_keys TEXT NOT NULL DEFAULT '[]',
  expected_checks TEXT NOT NULL DEFAULT '[]',
  expected_execution_surfaces TEXT NOT NULL DEFAULT '[]',
  safety_boundaries TEXT NOT NULL DEFAULT '[]',
  completion_record_fields TEXT NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  supersedes_handoff_id TEXT,
  FOREIGN KEY (supersedes_handoff_id) REFERENCES handoffs(handoff_id)
);

CREATE INDEX IF NOT EXISTS idx_handoffs_scope_time
  ON handoffs(scope, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_handoffs_scope_work_time
  ON handoffs(scope, work_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_handoffs_scope_status_time
  ON handoffs(scope, status, created_at DESC);

CREATE TABLE IF NOT EXISTS mailbox_messages (
  message_id TEXT PRIMARY KEY,
  scope TEXT NOT NULL DEFAULT 'project:augnes',
  work_id TEXT,
  from_agent TEXT NOT NULL,
  to_agent TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (
    message_type IN (
      'handoff',
      'review_request',
      'blocked_notice',
      'result_report',
      'approval_needed',
      'verification_needed'
    )
  ),
  summary TEXT NOT NULL,
  payload_ref TEXT,
  requires_ack INTEGER NOT NULL DEFAULT 0 CHECK (requires_ack IN (0, 1)),
  status TEXT NOT NULL CHECK (
    status IN (
      'draft',
      'ready',
      'delivered',
      'acknowledged',
      'reviewed',
      'superseded',
      'expired'
    )
  ),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  acknowledged_at TEXT,
  supersedes_message_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_mailbox_messages_scope_time
  ON mailbox_messages(scope, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mailbox_messages_scope_work_time
  ON mailbox_messages(scope, work_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mailbox_messages_scope_status_time
  ON mailbox_messages(scope, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mailbox_messages_scope_type_time
  ON mailbox_messages(scope, message_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mailbox_messages_scope_to_time
  ON mailbox_messages(scope, to_agent, created_at DESC);

CREATE TABLE IF NOT EXISTS coordination_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'handoff_created',
      'handoff_ready',
      'handoff_delivered',
      'handoff_acknowledged',
      'work_event_recorded',
      'action_result_recorded',
      'result_review_created',
      'record_draft_created',
      'publication_draft_created',
      'publication_sent',
      'publication_failed',
      'publication_acknowledged',
      'mailbox_message_created',
      'mailbox_message_delivered',
      'mailbox_message_acknowledged',
      'mailbox_message_reviewed',
      'mailbox_message_superseded',
      'mailbox_message_expired'
    )
  ),
  scope TEXT NOT NULL DEFAULT 'project:augnes',
  work_id TEXT,
  actor TEXT NOT NULL,
  target TEXT,
  source_surface TEXT NOT NULL,
  authority_level TEXT NOT NULL CHECK (
    authority_level IN (
      'raw_observation',
      'interpretation_only',
      'handoff_guidance',
      'execution_trace',
      'action_proof',
      'publication_notice',
      'acknowledged_notice',
      'committed_state'
    )
  ),
  state_keys TEXT NOT NULL DEFAULT '[]',
  causal_parent_id TEXT,
  payload_ref TEXT,
  result_status TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (causal_parent_id) REFERENCES coordination_events(event_id)
);

CREATE INDEX IF NOT EXISTS idx_coordination_events_scope_time
  ON coordination_events(scope, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_coordination_events_scope_work_time
  ON coordination_events(scope, work_id, created_at DESC);
