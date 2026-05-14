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
  surface TEXT CHECK (
    surface IS NULL OR surface IN (
      'chatgpt',
      'codex',
      'cockpit',
      'browser',
      'github',
      'local_runtime',
      'other'
    )
  ),
  actor TEXT,
  related_work_id TEXT,
  related_pr TEXT,
  summary TEXT,
  handoff_ref TEXT,
  evidence_pack_ref TEXT,
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_scope_surface_time
  ON sessions(scope, surface, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_scope_work_time
  ON sessions(scope, related_work_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_scope_pr_time
  ON sessions(scope, related_pr, started_at DESC);

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

CREATE INDEX IF NOT EXISTS idx_mailbox_messages_scope_payload_time
  ON mailbox_messages(scope, payload_ref, created_at DESC);

CREATE TABLE IF NOT EXISTS publication_drafts (
  publication_id TEXT PRIMARY KEY,
  scope TEXT NOT NULL DEFAULT 'project:augnes',
  work_id TEXT,
  source_event_id TEXT,
  target_surface TEXT NOT NULL,
  target_ref TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN (
      'draft',
      'approved',
      'sent',
      'failed',
      'cancelled'
    )
  ),
  preview_body TEXT NOT NULL,
  created_by TEXT NOT NULL,
  approved_by TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  sent_at TEXT,
  FOREIGN KEY (scope, work_id) REFERENCES work_items(scope, work_id),
  FOREIGN KEY (source_event_id) REFERENCES coordination_events(event_id)
);

CREATE INDEX IF NOT EXISTS idx_publication_drafts_scope_time
  ON publication_drafts(scope, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_publication_drafts_scope_work_time
  ON publication_drafts(scope, work_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_publication_drafts_scope_status_time
  ON publication_drafts(scope, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_publication_drafts_scope_target_time
  ON publication_drafts(scope, target_surface, target_ref, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_publication_drafts_scope_sent_time
  ON publication_drafts(scope, sent_at DESC);

CREATE TABLE IF NOT EXISTS publication_approval_requests (
  approval_request_id TEXT PRIMARY KEY,
  scope TEXT NOT NULL DEFAULT 'project:augnes',
  publication_id TEXT NOT NULL,
  work_id TEXT,
  target_surface TEXT NOT NULL,
  target_ref TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  requested_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  status TEXT NOT NULL CHECK (
    status IN (
      'requested',
      'superseded',
      'cancelled',
      'expired'
    )
  ),
  decision_prompt TEXT NOT NULL,
  side_effect_summary TEXT NOT NULL,
  required_gate_checks TEXT NOT NULL DEFAULT '[]',
  authority_boundaries TEXT NOT NULL DEFAULT '[]',
  source_control_packet_ref TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  supersedes_request_id TEXT,
  FOREIGN KEY (publication_id) REFERENCES publication_drafts(publication_id),
  FOREIGN KEY (supersedes_request_id) REFERENCES publication_approval_requests(approval_request_id)
);

CREATE INDEX IF NOT EXISTS idx_publication_approval_requests_scope_time
  ON publication_approval_requests(scope, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_publication_approval_requests_scope_publication_time
  ON publication_approval_requests(scope, publication_id, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_publication_approval_requests_scope_status_time
  ON publication_approval_requests(scope, status, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_publication_approval_requests_scope_target_time
  ON publication_approval_requests(scope, target_surface, target_ref, requested_at DESC);

CREATE TABLE IF NOT EXISTS publication_approval_decisions (
  approval_decision_id TEXT PRIMARY KEY,
  scope TEXT NOT NULL DEFAULT 'project:augnes',
  approval_request_id TEXT NOT NULL,
  publication_id TEXT NOT NULL,
  work_id TEXT,
  target_surface TEXT NOT NULL,
  target_ref TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (
    decision IN (
      'approved'
    )
  ),
  decided_by TEXT NOT NULL,
  decided_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  decision_reason TEXT NOT NULL,
  gate_checks TEXT NOT NULL DEFAULT '[]',
  authority_boundaries TEXT NOT NULL DEFAULT '[]',
  source_control_packet_ref TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (approval_request_id) REFERENCES publication_approval_requests(approval_request_id),
  FOREIGN KEY (publication_id) REFERENCES publication_drafts(publication_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_publication_approval_decisions_request_decision
  ON publication_approval_decisions(approval_request_id, decision);

CREATE INDEX IF NOT EXISTS idx_publication_approval_decisions_scope_time
  ON publication_approval_decisions(scope, decided_at DESC);

CREATE INDEX IF NOT EXISTS idx_publication_approval_decisions_scope_publication_time
  ON publication_approval_decisions(scope, publication_id, decided_at DESC);

CREATE INDEX IF NOT EXISTS idx_publication_approval_decisions_scope_request_time
  ON publication_approval_decisions(scope, approval_request_id, decided_at DESC);

CREATE INDEX IF NOT EXISTS idx_publication_approval_decisions_scope_target_time
  ON publication_approval_decisions(scope, target_surface, target_ref, decided_at DESC);

CREATE TABLE IF NOT EXISTS publication_readiness_checks (
  readiness_check_id TEXT PRIMARY KEY,
  scope TEXT NOT NULL DEFAULT 'project:augnes',
  publication_id TEXT NOT NULL,
  approval_request_id TEXT NOT NULL,
  approval_decision_id TEXT NOT NULL,
  work_id TEXT,
  target_surface TEXT NOT NULL,
  target_ref TEXT NOT NULL,
  dry_run INTEGER NOT NULL DEFAULT 1 CHECK (dry_run IN (0, 1)),
  status TEXT NOT NULL CHECK (
    status IN (
      'ready',
      'blocked'
    )
  ),
  checked_by TEXT NOT NULL,
  checked_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  gate_checks TEXT NOT NULL DEFAULT '[]',
  blocked_reasons TEXT NOT NULL DEFAULT '[]',
  readiness_summary TEXT NOT NULL,
  idempotency_key_required INTEGER NOT NULL DEFAULT 1 CHECK (idempotency_key_required IN (0, 1)),
  publish_route_required TEXT NOT NULL DEFAULT 'future_core_gated_publish_route',
  source_control_packet_ref TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (publication_id) REFERENCES publication_drafts(publication_id),
  FOREIGN KEY (approval_request_id) REFERENCES publication_approval_requests(approval_request_id),
  FOREIGN KEY (approval_decision_id) REFERENCES publication_approval_decisions(approval_decision_id)
);

CREATE INDEX IF NOT EXISTS idx_publication_readiness_checks_scope_time
  ON publication_readiness_checks(scope, checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_publication_readiness_checks_scope_publication_time
  ON publication_readiness_checks(scope, publication_id, checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_publication_readiness_checks_scope_decision_time
  ON publication_readiness_checks(scope, approval_decision_id, checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_publication_readiness_checks_scope_status_time
  ON publication_readiness_checks(scope, status, checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_publication_readiness_checks_scope_target_time
  ON publication_readiness_checks(scope, target_surface, target_ref, checked_at DESC);

CREATE TABLE IF NOT EXISTS delivery_ledger (
  delivery_id TEXT PRIMARY KEY,
  publication_id TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'project:augnes',
  target_surface TEXT NOT NULL,
  target_ref TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN (
      'pending',
      'sent',
      'failed',
      'acknowledged'
    )
  ),
  sent_at TEXT,
  acknowledged_at TEXT,
  error_message TEXT,
  idempotency_key TEXT,
  external_artifact_id TEXT,
  external_artifact_url TEXT,
  external_artifact_type TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (publication_id) REFERENCES publication_drafts(publication_id)
);

CREATE INDEX IF NOT EXISTS idx_delivery_ledger_scope_time
  ON delivery_ledger(scope, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_delivery_ledger_publication_time
  ON delivery_ledger(publication_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_delivery_ledger_scope_status_time
  ON delivery_ledger(scope, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_delivery_ledger_scope_target_time
  ON delivery_ledger(scope, target_surface, target_ref, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_delivery_ledger_scope_sent_time
  ON delivery_ledger(scope, sent_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_ledger_idempotency_key
  ON delivery_ledger(publication_id, target_surface, target_ref, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS verification_evidence_records (
  evidence_id TEXT PRIMARY KEY,
  scope TEXT NOT NULL DEFAULT 'project:augnes',
  work_id TEXT,
  publication_id TEXT,
  delivery_id TEXT,
  target_surface TEXT,
  target_ref TEXT,
  evidence_kind TEXT NOT NULL CHECK (
    evidence_kind IN (
      'command_run',
      'check_passed',
      'check_failed',
      'check_skipped',
      'replay_observed',
      'duplicate_block_observed'
    )
  ),
  label TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN (
      'passed',
      'failed',
      'skipped',
      'observed',
      'blocked',
      'needs_review'
    )
  ),
  command TEXT,
  result_summary TEXT NOT NULL,
  skipped_reason TEXT,
  observed_behavior TEXT,
  source_surface TEXT NOT NULL,
  source_ref TEXT,
  related_action_id TEXT,
  related_work_event_id TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (scope, work_id) REFERENCES work_items(scope, work_id),
  FOREIGN KEY (publication_id) REFERENCES publication_drafts(publication_id),
  FOREIGN KEY (delivery_id) REFERENCES delivery_ledger(delivery_id),
  FOREIGN KEY (related_action_id) REFERENCES action_records(id),
  FOREIGN KEY (related_work_event_id) REFERENCES work_events(id)
);

CREATE INDEX IF NOT EXISTS idx_verification_evidence_scope_time
  ON verification_evidence_records(scope, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_verification_evidence_scope_work_time
  ON verification_evidence_records(scope, work_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_verification_evidence_scope_publication_time
  ON verification_evidence_records(scope, publication_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_verification_evidence_scope_delivery_time
  ON verification_evidence_records(scope, delivery_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_verification_evidence_scope_target_time
  ON verification_evidence_records(scope, target_surface, target_ref, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_verification_evidence_scope_kind_time
  ON verification_evidence_records(scope, evidence_kind, created_at DESC);

CREATE TABLE IF NOT EXISTS temporal_preview_review_artifacts (
  artifact_id TEXT PRIMARY KEY,
  scope TEXT NOT NULL DEFAULT 'project:augnes',
  work_id TEXT NOT NULL,
  source_route TEXT NOT NULL,
  source_surface TEXT NOT NULL,
  source_ref TEXT,
  generator TEXT NOT NULL,
  model TEXT,
  as_of TEXT NOT NULL,
  capture_mode TEXT NOT NULL CHECK (
    capture_mode IN (
      'mock',
      'openai',
      'mock_fallback',
      'route_capture',
      'cockpit_capture'
    )
  ),
  preview_excerpt TEXT NOT NULL,
  bounded_preview_json TEXT NOT NULL,
  preview_hash TEXT,
  source_refs TEXT NOT NULL DEFAULT '[]',
  evidence_anchor_refs TEXT NOT NULL DEFAULT '[]',
  summary_refs TEXT NOT NULL DEFAULT '[]',
  counterexample_refs TEXT NOT NULL DEFAULT '[]',
  residual_tension_refs TEXT NOT NULL DEFAULT '[]',
  admission_decisions_json TEXT NOT NULL DEFAULT '[]',
  guardrail_passed INTEGER NOT NULL CHECK (guardrail_passed IN (0, 1)),
  guardrail_warnings_json TEXT NOT NULL DEFAULT '[]',
  reviewer_verdict TEXT NOT NULL CHECK (
    reviewer_verdict IN (
      'pass',
      'pass_with_notes',
      'fail',
      'not_reviewed'
    )
  ),
  reviewer_notes TEXT,
  manual_review_report_path TEXT,
  linked_evidence_record_ids TEXT NOT NULL DEFAULT '[]',
  linked_session_id TEXT,
  linked_pr_url TEXT,
  redaction_status TEXT NOT NULL CHECK (
    redaction_status IN (
      'redacted',
      'bounded',
      'raw_disallowed'
    )
  ),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (scope, work_id) REFERENCES work_items(scope, work_id),
  FOREIGN KEY (linked_session_id) REFERENCES sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_temporal_review_artifacts_scope_work_time
  ON temporal_preview_review_artifacts(scope, work_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_temporal_review_artifacts_scope_generator_time
  ON temporal_preview_review_artifacts(scope, generator, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_temporal_review_artifacts_scope_verdict_time
  ON temporal_preview_review_artifacts(scope, reviewer_verdict, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_temporal_review_artifacts_scope_guardrail_time
  ON temporal_preview_review_artifacts(scope, guardrail_passed, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_temporal_review_artifacts_scope_session_time
  ON temporal_preview_review_artifacts(scope, linked_session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_temporal_review_artifacts_scope_pr_time
  ON temporal_preview_review_artifacts(scope, linked_pr_url, created_at DESC);

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
