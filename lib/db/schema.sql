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

CREATE TABLE IF NOT EXISTS autonomy_runs (
  run_id TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  autonomy_contract_ref TEXT,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  scheduled_for TEXT,
  started_at TEXT,
  finished_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  stop_reason TEXT,
  source_refs_json TEXT NOT NULL,
  authority_boundary_json TEXT NOT NULL,
  budget_snapshot_json TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_autonomy_runs_scope_status_schedule
  ON autonomy_runs(scope, status, scheduled_for, updated_at);

CREATE INDEX IF NOT EXISTS idx_autonomy_runs_scope_updated
  ON autonomy_runs(scope, updated_at DESC);

CREATE TABLE IF NOT EXISTS autonomy_run_steps (
  step_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  step_index INTEGER NOT NULL,
  action_kind TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT,
  output_json TEXT NOT NULL DEFAULT '{}',
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES autonomy_runs(run_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_autonomy_run_steps_run_index
  ON autonomy_run_steps(run_id, step_index);

CREATE INDEX IF NOT EXISTS idx_autonomy_run_steps_run_status
  ON autonomy_run_steps(run_id, status, step_index);

CREATE TABLE IF NOT EXISTS autonomy_run_events (
  event_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  step_id TEXT,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES autonomy_runs(run_id) ON DELETE CASCADE,
  FOREIGN KEY (step_id) REFERENCES autonomy_run_steps(step_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_autonomy_run_events_run_time
  ON autonomy_run_events(run_id, created_at, event_id);

CREATE TABLE IF NOT EXISTS autonomy_run_delta_batches (
  batch_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  batch_version TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TEXT NOT NULL,
  delta_count INTEGER NOT NULL,
  deltas_json TEXT NOT NULL,
  source_refs_json TEXT NOT NULL,
  validation_json TEXT NOT NULL,
  authority_boundary_json TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES autonomy_runs(run_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_autonomy_run_delta_batches_run_time
  ON autonomy_run_delta_batches(run_id, created_at, batch_id);

CREATE TABLE IF NOT EXISTS autonomy_delegation_grants (
  grant_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
  grant_status TEXT NOT NULL,
  grant_mode TEXT NOT NULL,
  approval_ref TEXT NOT NULL,
  approved_by TEXT,
  approved_at TEXT,
  approval_basis TEXT,
  approval_text_fingerprint TEXT NOT NULL,
  source_contract_id TEXT,
  source_contract_fingerprint TEXT,
  source_contract_version TEXT,
  source_autonomy_mode TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  allowed_work_classes_json TEXT NOT NULL,
  forbidden_work_classes_json TEXT NOT NULL,
  allowed_actions_json TEXT NOT NULL,
  forbidden_actions_json TEXT NOT NULL,
  budget_json TEXT NOT NULL,
  reporting_cadence_json TEXT NOT NULL,
  stop_conditions_json TEXT NOT NULL,
  allowed_outputs_json TEXT NOT NULL,
  forbidden_outputs_json TEXT NOT NULL,
  revocation_json TEXT NOT NULL,
  authority_boundary_json TEXT NOT NULL,
  persisted_material_boundary_json TEXT NOT NULL,
  validation_json TEXT NOT NULL,
  row_count_write_summary_json TEXT NOT NULL,
  grant_fingerprint TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_autonomy_delegation_grants_scope_created
  ON autonomy_delegation_grants(scope, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_autonomy_delegation_grants_scope_status_created
  ON autonomy_delegation_grants(scope, grant_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_autonomy_delegation_grants_scope_mode_created
  ON autonomy_delegation_grants(scope, grant_mode, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_autonomy_delegation_grants_approval_ref
  ON autonomy_delegation_grants(approval_ref);

CREATE INDEX IF NOT EXISTS idx_autonomy_delegation_grants_source_contract_fingerprint
  ON autonomy_delegation_grants(source_contract_fingerprint);

CREATE TABLE IF NOT EXISTS autohunt_work_queue_candidates (
  candidate_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
  candidate_status TEXT NOT NULL,
  candidate_origin TEXT NOT NULL,
  source_grant_id TEXT NOT NULL,
  source_grant_fingerprint TEXT NOT NULL,
  source_grant_status TEXT NOT NULL,
  source_grant_mode TEXT NOT NULL,
  work_class TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  title_summary_fingerprint TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  source_refs_json TEXT NOT NULL,
  source_fingerprints_json TEXT NOT NULL,
  evidence_refs_json TEXT NOT NULL,
  required_context_refs_json TEXT NOT NULL,
  proposed_files_or_globs_json TEXT NOT NULL,
  expected_outputs_json TEXT NOT NULL,
  required_checks_json TEXT NOT NULL,
  blocked_actions_json TEXT NOT NULL,
  stop_conditions_json TEXT NOT NULL,
  budget_projection_json TEXT NOT NULL,
  grant_fit_json TEXT NOT NULL,
  authority_boundary_json TEXT NOT NULL,
  persisted_material_boundary_json TEXT NOT NULL,
  validation_json TEXT NOT NULL,
  row_count_write_summary_json TEXT NOT NULL,
  candidate_fingerprint TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_autohunt_work_queue_candidates_scope_created
  ON autohunt_work_queue_candidates(scope, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_autohunt_work_queue_candidates_source_grant_id_created
  ON autohunt_work_queue_candidates(source_grant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_autohunt_work_queue_candidates_source_grant_fingerprint_created
  ON autohunt_work_queue_candidates(source_grant_fingerprint, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_autohunt_work_queue_candidates_candidate_status_created
  ON autohunt_work_queue_candidates(candidate_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_autohunt_work_queue_candidates_candidate_origin_created
  ON autohunt_work_queue_candidates(candidate_origin, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_autohunt_work_queue_candidates_work_class_created
  ON autohunt_work_queue_candidates(work_class, created_at DESC);

CREATE TABLE IF NOT EXISTS autohunt_preflight_packets (
  preflight_packet_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
  preflight_status TEXT NOT NULL,
  source_grant_id TEXT NOT NULL,
  source_grant_fingerprint TEXT NOT NULL,
  source_grant_status TEXT NOT NULL,
  source_grant_mode TEXT NOT NULL,
  selected_candidate_ids_json TEXT NOT NULL,
  selected_candidate_fingerprints_json TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  source_queue_readback_json TEXT NOT NULL,
  selected_candidates_json TEXT NOT NULL,
  aggregate_budget_projection_json TEXT NOT NULL,
  grant_budget_remaining_projection_json TEXT NOT NULL,
  preflight_checks_json TEXT NOT NULL,
  blocked_actions_json TEXT NOT NULL,
  stop_conditions_json TEXT NOT NULL,
  required_checks_json TEXT NOT NULL,
  next_allowed_outputs_json TEXT NOT NULL,
  forbidden_outputs_json TEXT NOT NULL,
  authority_boundary_json TEXT NOT NULL,
  persisted_material_boundary_json TEXT NOT NULL,
  validation_json TEXT NOT NULL,
  row_count_write_summary_json TEXT NOT NULL,
  preflight_packet_fingerprint TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_autohunt_preflight_packets_scope_created
  ON autohunt_preflight_packets(scope, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_autohunt_preflight_packets_source_grant_id_created
  ON autohunt_preflight_packets(source_grant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_autohunt_preflight_packets_source_grant_fingerprint_created
  ON autohunt_preflight_packets(source_grant_fingerprint, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_autohunt_preflight_packets_preflight_status_created
  ON autohunt_preflight_packets(preflight_status, created_at DESC);

CREATE TABLE IF NOT EXISTS perspective_promotion_decisions (
  promotion_decision_id text primary key,
  scope text not null,
  decision_kind text not null,
  decision_status text not null,
  operator_actor_ref text not null,
  explicit_user_action_required integer not null,
  future_operator_decision_only integer not null,
  review_record_ref text not null,
  gate_report_ref text not null,
  unresolved_tension_policy text not null,
  knowledge_gap_policy text not null,
  formation_receipt_policy text not null,
  promotion_executed integer not null default 0,
  decision_store_written integer not null default 1,
  formation_receipt_written integer not null default 0,
  durable_state_applied integer not null default 0,
  proof_or_evidence_created integer not null default 0,
  claim_or_evidence_written integer not null default 0,
  product_write_executed integer not null default 0,
  boundary_json text not null,
  reason_codes_json text not null,
  boundary_notes_json text not null,
  basis_claim_candidate_refs_json text not null default '[]',
  basis_evidence_candidate_refs_json text not null default '[]',
  perspective_delta_candidate_refs_json text not null default '[]',
  accepted_evidence_refs_json text not null default '[]',
  unresolved_tension_refs_json text not null default '[]',
  knowledge_gap_refs_json text not null default '[]',
  created_at text not null,
  updated_at text not null,
  discarded_at text,
  discard_reason text
);

CREATE TABLE IF NOT EXISTS perspective_promotion_decision_basis_refs (
  id text primary key,
  promotion_decision_id text not null,
  basis_id text not null,
  basis_kind text not null,
  basis_ref text not null,
  bounded_summary text not null,
  source_refs_json text not null,
  candidate_refs_json text not null,
  review_record_refs_json text not null,
  rag_context_preview_refs_json text not null,
  retrieval_candidate_refs_json text not null,
  provider_candidate_refs_json text not null,
  feedback_refs_json text not null,
  reason_codes_json text not null
);

CREATE TABLE IF NOT EXISTS perspective_promotion_decision_activity (
  activity_id text primary key,
  promotion_decision_id text not null,
  activity_kind text not null,
  actor_ref text not null,
  summary text not null,
  reason_codes_json text not null,
  created_at text not null
);

CREATE INDEX IF NOT EXISTS idx_perspective_promotion_decisions_status
  ON perspective_promotion_decisions(scope, decision_status, created_at);

CREATE INDEX IF NOT EXISTS idx_perspective_promotion_decisions_review_record
  ON perspective_promotion_decisions(scope, review_record_ref, created_at);

CREATE INDEX IF NOT EXISTS idx_perspective_promotion_decision_basis_refs_decision
  ON perspective_promotion_decision_basis_refs(promotion_decision_id, basis_kind);

CREATE INDEX IF NOT EXISTS idx_perspective_promotion_decision_activity_decision
  ON perspective_promotion_decision_activity(promotion_decision_id, created_at);

CREATE TABLE IF NOT EXISTS perspective_formation_receipts (
  receipt_id text primary key,
  scope text not null,
  promotion_decision_id text not null,
  review_record_ref text not null,
  operator_actor_ref text not null,
  receipt_status text not null,
  formation_receipt_written integer not null default 1,
  durable_state_applied integer not null default 0,
  promotion_executed integer not null default 0,
  proof_or_evidence_created integer not null default 0,
  claim_or_evidence_written integer not null default 0,
  product_write_executed integer not null default 0,
  geometry_digest_ref text not null,
  agent_substrate_warning_refs_json text not null,
  context_packet_ref text not null,
  feedback_event_refs_json text not null,
  unresolved_tensions_preserved_json text not null,
  knowledge_gaps_preserved_json text not null,
  boundary_acknowledgements_json text not null,
  authority_boundary_json text not null,
  reason_codes_json text not null,
  boundary_notes_json text not null,
  created_at text not null,
  updated_at text not null,
  discarded_at text,
  discard_reason text
);

CREATE TABLE IF NOT EXISTS perspective_formation_receipt_selected_candidates (
  id text primary key,
  receipt_id text not null,
  candidate_ref text not null,
  candidate_kind text not null,
  bounded_summary text not null,
  source_refs_json text not null,
  reason_codes_json text not null
);

CREATE TABLE IF NOT EXISTS perspective_formation_receipt_omitted_candidates (
  id text primary key,
  receipt_id text not null,
  candidate_ref text not null,
  candidate_kind text not null,
  bounded_summary text not null,
  source_refs_json text not null,
  reason_codes_json text not null
);

CREATE TABLE IF NOT EXISTS perspective_formation_receipt_deferred_candidates (
  id text primary key,
  receipt_id text not null,
  candidate_ref text not null,
  candidate_kind text not null,
  bounded_summary text not null,
  source_refs_json text not null,
  reason_codes_json text not null
);

CREATE TABLE IF NOT EXISTS perspective_formation_receipt_sources (
  id text primary key,
  receipt_id text not null,
  source_ref text not null,
  bounded_summary text not null,
  reason_codes_json text not null
);

CREATE TABLE IF NOT EXISTS perspective_formation_receipt_activity (
  activity_id text primary key,
  receipt_id text not null,
  activity_kind text not null,
  actor_ref text not null,
  summary text not null,
  reason_codes_json text not null,
  created_at text not null
);

CREATE INDEX IF NOT EXISTS idx_perspective_formation_receipts_promotion_decision
  ON perspective_formation_receipts(scope, promotion_decision_id, created_at);
CREATE INDEX IF NOT EXISTS idx_perspective_formation_receipts_review_record
  ON perspective_formation_receipts(scope, review_record_ref, created_at);
CREATE INDEX IF NOT EXISTS idx_perspective_formation_receipt_selected_candidates
  ON perspective_formation_receipt_selected_candidates(receipt_id, candidate_kind);
CREATE INDEX IF NOT EXISTS idx_perspective_formation_receipt_omitted_candidates
  ON perspective_formation_receipt_omitted_candidates(receipt_id, candidate_kind);
CREATE INDEX IF NOT EXISTS idx_perspective_formation_receipt_deferred_candidates
  ON perspective_formation_receipt_deferred_candidates(receipt_id, candidate_kind);
CREATE INDEX IF NOT EXISTS idx_perspective_formation_receipt_sources
  ON perspective_formation_receipt_sources(receipt_id, source_ref);
CREATE INDEX IF NOT EXISTS idx_perspective_formation_receipt_activity
  ON perspective_formation_receipt_activity(receipt_id, created_at);

CREATE TABLE IF NOT EXISTS perspective_states (
  perspective_id text primary key,
  scope text not null,
  state_version text not null,
  current_thesis text not null,
  salience_state_json text not null,
  reuse_conditions_json text not null,
  promotion_history_json text not null,
  retirement_history_json text not null,
  formation_receipt_refs_json text not null,
  authority_boundary_json text not null,
  reason_codes_json text not null,
  created_at text not null,
  updated_at text not null
);

CREATE TABLE IF NOT EXISTS perspective_state_prior_theses (
  id text primary key,
  perspective_id text not null,
  thesis text not null,
  reason_codes_json text not null
);

CREATE TABLE IF NOT EXISTS perspective_state_claims (
  id text primary key,
  perspective_id text not null,
  claim_ref text not null,
  claim_status text not null,
  bounded_summary text not null,
  source_refs_json text not null,
  reason_codes_json text not null
);

CREATE TABLE IF NOT EXISTS perspective_state_evidence_refs (
  id text primary key,
  perspective_id text not null,
  evidence_ref text not null,
  evidence_relation text not null,
  reason_codes_json text not null
);

CREATE TABLE IF NOT EXISTS perspective_state_tensions (
  id text primary key,
  perspective_id text not null,
  tension_ref text not null,
  tension_status text not null,
  bounded_summary text not null,
  source_refs_json text not null,
  reason_codes_json text not null
);

CREATE TABLE IF NOT EXISTS perspective_state_knowledge_gaps (
  id text primary key,
  perspective_id text not null,
  knowledge_gap_ref text not null,
  gap_status text not null,
  bounded_summary text not null,
  source_refs_json text not null,
  reason_codes_json text not null
);

CREATE TABLE IF NOT EXISTS perspective_state_apply_events (
  apply_event_id text primary key,
  perspective_id text not null,
  promotion_decision_id text not null,
  formation_receipt_id text not null,
  review_record_ref text not null,
  operator_actor_ref text not null,
  apply_operation text not null,
  applied_at text not null,
  prior_state_version text,
  next_state_version text not null,
  selected_candidate_refs_json text not null,
  omitted_candidate_refs_json text not null,
  deferred_candidate_refs_json text not null,
  unresolved_tensions_preserved_json text not null,
  knowledge_gaps_preserved_json text not null,
  durable_state_applied integer not null default 1,
  formation_receipt_written integer not null default 1,
  promotion_executed integer not null default 0,
  proof_or_evidence_created integer not null default 0,
  claim_or_evidence_written integer not null default 0,
  product_write_executed integer not null default 0,
  reason_codes_json text not null,
  authority_boundary_json text not null
);

CREATE TABLE IF NOT EXISTS perspective_state_activity (
  activity_id text primary key,
  perspective_id text not null,
  activity_kind text not null,
  actor_ref text not null,
  summary text not null,
  reason_codes_json text not null,
  created_at text not null
);

CREATE INDEX IF NOT EXISTS idx_perspective_state_apply_events_perspective
  ON perspective_state_apply_events(perspective_id, applied_at);
CREATE INDEX IF NOT EXISTS idx_perspective_state_apply_events_receipt
  ON perspective_state_apply_events(formation_receipt_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_perspective_state_apply_events_receipt_unique
  ON perspective_state_apply_events(formation_receipt_id);

CREATE TABLE IF NOT EXISTS project_constellation_manual_anchors (
  anchor_id text primary key,
  scope text not null,
  layout_id text not null,
  perspective_id text not null,
  state_version_ref text not null,
  node_ref text not null,
  anchor_position_json text not null,
  anchor_reason text not null,
  created_by_ref text not null,
  applies_to_layout_scope text not null,
  explicit_operator_action_required integer not null,
  persistence_now integer not null,
  display_hint_only integer not null,
  authority_boundary_json text not null,
  reason_codes_json text not null,
  boundary_notes_json text not null,
  created_at text not null,
  updated_at text not null,
  discarded_at text,
  discard_reason text
);

CREATE TABLE IF NOT EXISTS project_constellation_manual_anchor_activity (
  activity_id text primary key,
  anchor_id text not null,
  activity_kind text not null,
  actor_ref text not null,
  summary text not null,
  reason_codes_json text not null,
  created_at text not null
);

CREATE INDEX IF NOT EXISTS idx_project_constellation_manual_anchors_layout
  ON project_constellation_manual_anchors(layout_id, discarded_at);
CREATE INDEX IF NOT EXISTS idx_project_constellation_manual_anchors_perspective
  ON project_constellation_manual_anchors(perspective_id, discarded_at);
CREATE INDEX IF NOT EXISTS idx_project_constellation_manual_anchors_node
  ON project_constellation_manual_anchors(node_ref, discarded_at);
CREATE INDEX IF NOT EXISTS idx_project_constellation_manual_anchor_activity_anchor
  ON project_constellation_manual_anchor_activity(anchor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_perspective_state_activity
  ON perspective_state_activity(perspective_id, created_at);

CREATE TABLE IF NOT EXISTS ag_work_resume_mapping_proposals (
  proposal_id TEXT PRIMARY KEY,
  record_kind TEXT NOT NULL CHECK (
    record_kind = 'ag_work_resume_mapping_proposal'
  ),
  schema TEXT NOT NULL CHECK (
    schema = 'augnes.ag_work_resume_mapping_proposal.v0_1'
  ),
  status TEXT NOT NULL CHECK (
    status IN (
      'proposed',
      'needs_review',
      'superseded',
      'withdrawn',
      'rejected',
      'expired'
    )
  ),
  foreign_scope TEXT NOT NULL,
  foreign_work_id TEXT NOT NULL,
  foreign_title TEXT NOT NULL,
  foreign_status TEXT,
  foreign_next_action TEXT,
  candidate_local_scope TEXT NOT NULL,
  candidate_local_work_id TEXT NOT NULL,
  candidate_title TEXT NOT NULL,
  candidate_status TEXT,
  candidate_next_action TEXT,
  packet_id TEXT NOT NULL,
  packet_hash TEXT NOT NULL,
  source_runtime_instance_id TEXT,
  source_packet_created_at TEXT,
  proposal_preview_id TEXT NOT NULL,
  proposal_preview_hash TEXT NOT NULL,
  match_confidence_label TEXT,
  comparison_summary TEXT NOT NULL DEFAULT '[]',
  gaps_summary TEXT NOT NULL DEFAULT '[]',
  conflicts_summary TEXT NOT NULL DEFAULT '[]',
  questions_summary TEXT NOT NULL DEFAULT '[]',
  foreign_refs_summary TEXT NOT NULL DEFAULT '{}',
  repo_context_summary TEXT NOT NULL DEFAULT '{}',
  redaction_summary TEXT NOT NULL DEFAULT '{}',
  proposed_by TEXT NOT NULL,
  proposed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  proposal_reason TEXT NOT NULL,
  expires_at TEXT,
  supersedes_proposal_id TEXT,
  superseded_by_proposal_id TEXT,
  reviewed_by TEXT,
  reviewed_at TEXT,
  review_note TEXT,
  authority_boundary TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_ag_mapping_proposals_foreign_work_time
  ON ag_work_resume_mapping_proposals(foreign_scope, foreign_work_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ag_mapping_proposals_candidate_time
  ON ag_work_resume_mapping_proposals(candidate_local_scope, candidate_local_work_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ag_mapping_proposals_status_time
  ON ag_work_resume_mapping_proposals(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ag_mapping_proposals_packet_hash
  ON ag_work_resume_mapping_proposals(packet_id, packet_hash);

CREATE INDEX IF NOT EXISTS idx_ag_mapping_proposals_preview_hash
  ON ag_work_resume_mapping_proposals(proposal_preview_id, proposal_preview_hash);

CREATE INDEX IF NOT EXISTS idx_ag_mapping_proposals_expires_at
  ON ag_work_resume_mapping_proposals(expires_at);

CREATE INDEX IF NOT EXISTS idx_ag_mapping_proposals_supersedes
  ON ag_work_resume_mapping_proposals(supersedes_proposal_id);

CREATE INDEX IF NOT EXISTS idx_ag_mapping_proposals_superseded_by
  ON ag_work_resume_mapping_proposals(superseded_by_proposal_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ag_mapping_proposals_active_unique
  ON ag_work_resume_mapping_proposals(
    foreign_scope,
    foreign_work_id,
    candidate_local_scope,
    candidate_local_work_id
  )
  WHERE status IN ('proposed', 'needs_review');

CREATE TABLE IF NOT EXISTS ag_work_resume_confirmed_mappings (
  mapping_id TEXT PRIMARY KEY,
  record_kind TEXT NOT NULL CHECK (
    record_kind = 'ag_work_resume_confirmed_mapping'
  ),
  schema TEXT NOT NULL CHECK (
    schema = 'augnes.ag_work_resume_confirmed_mapping.v0_1'
  ),
  status TEXT NOT NULL CHECK (
    status IN ('active', 'superseded', 'withdrawn', 'revoked')
  ),
  foreign_scope TEXT NOT NULL,
  foreign_work_id TEXT NOT NULL,
  local_scope TEXT NOT NULL,
  local_work_id TEXT NOT NULL,
  source_proposal_id TEXT NOT NULL,
  packet_id TEXT NOT NULL,
  packet_hash TEXT NOT NULL,
  source_runtime_instance_id TEXT,
  confirmed_by TEXT NOT NULL,
  confirmed_at TEXT NOT NULL,
  confirmation_reason TEXT NOT NULL,
  supersedes_mapping_id TEXT,
  superseded_by_mapping_id TEXT,
  revoked_by TEXT,
  revoked_at TEXT,
  revocation_reason TEXT,
  authority_boundary TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ag_confirmed_mappings_active_foreign
  ON ag_work_resume_confirmed_mappings(foreign_scope, foreign_work_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_ag_confirmed_mappings_foreign_time
  ON ag_work_resume_confirmed_mappings(foreign_scope, foreign_work_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ag_confirmed_mappings_local_time
  ON ag_work_resume_confirmed_mappings(local_scope, local_work_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ag_confirmed_mappings_source_proposal
  ON ag_work_resume_confirmed_mappings(source_proposal_id);

CREATE INDEX IF NOT EXISTS idx_ag_confirmed_mappings_packet_hash
  ON ag_work_resume_confirmed_mappings(packet_id, packet_hash);

CREATE INDEX IF NOT EXISTS idx_ag_confirmed_mappings_status_time
  ON ag_work_resume_confirmed_mappings(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ag_confirmed_mappings_supersedes
  ON ag_work_resume_confirmed_mappings(supersedes_mapping_id);

CREATE INDEX IF NOT EXISTS idx_ag_confirmed_mappings_superseded_by
  ON ag_work_resume_confirmed_mappings(superseded_by_mapping_id);

CREATE TABLE IF NOT EXISTS ag_work_resume_imported_contexts (
  import_id TEXT PRIMARY KEY,
  record_kind TEXT NOT NULL CHECK (
    record_kind = 'ag_work_resume_imported_context'
  ),
  schema TEXT NOT NULL CHECK (
    schema = 'augnes.ag_work_resume_imported_context.v0_1'
  ),
  status TEXT NOT NULL CHECK (
    status IN ('review_metadata', 'superseded', 'withdrawn', 'revoked')
  ),
  mapping_id TEXT NOT NULL,
  foreign_scope TEXT NOT NULL,
  foreign_work_id TEXT NOT NULL,
  local_scope TEXT NOT NULL,
  local_work_id TEXT NOT NULL,
  packet_id TEXT NOT NULL,
  packet_hash TEXT NOT NULL,
  source_runtime_instance_id TEXT,
  imported_summary TEXT NOT NULL,
  imported_expected_files TEXT NOT NULL DEFAULT '[]',
  imported_expected_checks TEXT NOT NULL DEFAULT '[]',
  foreign_refs_summary TEXT NOT NULL DEFAULT '{}',
  redaction_report TEXT NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  import_reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  authority_boundary TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_ag_imported_contexts_mapping_time
  ON ag_work_resume_imported_contexts(mapping_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ag_imported_contexts_foreign_time
  ON ag_work_resume_imported_contexts(foreign_scope, foreign_work_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ag_imported_contexts_local_time
  ON ag_work_resume_imported_contexts(local_scope, local_work_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ag_imported_contexts_packet_hash
  ON ag_work_resume_imported_contexts(packet_id, packet_hash);

CREATE INDEX IF NOT EXISTS idx_ag_imported_contexts_status_time
  ON ag_work_resume_imported_contexts(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ag_imported_contexts_created_by_time
  ON ag_work_resume_imported_contexts(created_by, created_at DESC);

CREATE TABLE IF NOT EXISTS ag_work_resume_proof_evidence_reconciliation_candidates (
  candidate_id TEXT PRIMARY KEY,
  record_kind TEXT NOT NULL CHECK (
    record_kind = 'ag_work_resume_proof_evidence_reconciliation_candidate'
  ),
  schema TEXT NOT NULL CHECK (
    schema = 'augnes.ag_work_resume_proof_evidence_reconciliation_candidate.v0_1'
  ),
  status TEXT NOT NULL CHECK (
    status IN (
      'proposed',
      'accepted_for_future_recording',
      'rejected',
      'deferred',
      'superseded',
      'withdrawn',
      'revoked'
    )
  ),
  import_id TEXT NOT NULL,
  mapping_id TEXT NOT NULL,
  foreign_ref_type TEXT NOT NULL CHECK (
    foreign_ref_type IN (
      'proof',
      'evidence',
      'action',
      'session',
      'git',
      'evidence_pack',
      'handoff',
      'other'
    )
  ),
  foreign_ref_id TEXT NOT NULL,
  local_target_scope TEXT NOT NULL,
  local_target_work_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  redaction_status TEXT NOT NULL DEFAULT '{}',
  proposed_by TEXT NOT NULL,
  proposed_reason TEXT NOT NULL,
  reviewed_by TEXT,
  reviewed_at TEXT,
  review_note TEXT,
  supersedes_candidate_id TEXT,
  superseded_by_candidate_id TEXT,
  authority_boundary TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_ag_reconciliation_candidates_import_time
  ON ag_work_resume_proof_evidence_reconciliation_candidates(import_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ag_reconciliation_candidates_mapping_time
  ON ag_work_resume_proof_evidence_reconciliation_candidates(mapping_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ag_reconciliation_candidates_foreign_ref
  ON ag_work_resume_proof_evidence_reconciliation_candidates(foreign_ref_type, foreign_ref_id);

CREATE INDEX IF NOT EXISTS idx_ag_reconciliation_candidates_local_target_time
  ON ag_work_resume_proof_evidence_reconciliation_candidates(local_target_scope, local_target_work_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ag_reconciliation_candidates_status_time
  ON ag_work_resume_proof_evidence_reconciliation_candidates(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ag_reconciliation_candidates_proposed_by_time
  ON ag_work_resume_proof_evidence_reconciliation_candidates(proposed_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ag_reconciliation_candidates_reviewed_by_time
  ON ag_work_resume_proof_evidence_reconciliation_candidates(reviewed_by, reviewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_ag_reconciliation_candidates_supersedes
  ON ag_work_resume_proof_evidence_reconciliation_candidates(supersedes_candidate_id);

CREATE INDEX IF NOT EXISTS idx_ag_reconciliation_candidates_superseded_by
  ON ag_work_resume_proof_evidence_reconciliation_candidates(superseded_by_candidate_id);

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

CREATE TABLE IF NOT EXISTS ag_work_resume_proof_evidence_recording_links (
  recording_link_id TEXT PRIMARY KEY,
  record_kind TEXT NOT NULL CHECK (
    record_kind = 'ag_work_resume_proof_evidence_recording_link'
  ),
  schema TEXT NOT NULL CHECK (
    schema = 'augnes.ag_work_resume_proof_evidence_recording_link.v0_1'
  ),
  candidate_id TEXT NOT NULL,
  import_id TEXT NOT NULL,
  mapping_id TEXT NOT NULL,
  local_target_scope TEXT NOT NULL CHECK (
    length(trim(local_target_scope)) > 0
  ),
  local_target_work_id TEXT NOT NULL CHECK (
    length(trim(local_target_work_id)) > 0
  ),
  target_record_kind TEXT NOT NULL CHECK (
    target_record_kind = 'verification_evidence'
  ),
  target_evidence_id TEXT NOT NULL,
  target_action_id TEXT CHECK (target_action_id IS NULL),
  idempotency_key TEXT NOT NULL CHECK (
    length(trim(idempotency_key)) > 0
  ),
  actor TEXT NOT NULL CHECK (length(trim(actor)) > 0),
  reason TEXT NOT NULL CHECK (
    length(trim(reason)) > 0 AND length(reason) <= 4000
  ),
  redaction_summary TEXT NOT NULL DEFAULT '{}' CHECK (
    CASE
      WHEN json_valid(redaction_summary)
      THEN json_type(redaction_summary) = 'object'
      ELSE 0
    END
  ),
  trust_provenance_label TEXT NOT NULL CHECK (
    trust_provenance_label IN ('foreign_summary_user_core_attested')
  ),
  provenance_json TEXT NOT NULL DEFAULT '{}' CHECK (
    CASE
      WHEN json_valid(provenance_json)
      THEN json_type(provenance_json) = 'object'
      ELSE 0
    END
  ),
  recording_status TEXT NOT NULL CHECK (
    recording_status = 'recorded'
  ),
  failure_reason TEXT CHECK (failure_reason IS NULL),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (updated_at = created_at),
  FOREIGN KEY (candidate_id)
    REFERENCES ag_work_resume_proof_evidence_reconciliation_candidates(candidate_id)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT,
  FOREIGN KEY (import_id)
    REFERENCES ag_work_resume_imported_contexts(import_id)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT,
  FOREIGN KEY (mapping_id)
    REFERENCES ag_work_resume_confirmed_mappings(mapping_id)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT,
  FOREIGN KEY (target_evidence_id)
    REFERENCES verification_evidence_records(evidence_id)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ag_recording_links_candidate_unique
  ON ag_work_resume_proof_evidence_recording_links(candidate_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ag_recording_links_idempotency_unique
  ON ag_work_resume_proof_evidence_recording_links(idempotency_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ag_recording_links_target_evidence_unique
  ON ag_work_resume_proof_evidence_recording_links(target_evidence_id);

CREATE INDEX IF NOT EXISTS idx_ag_recording_links_import_time
  ON ag_work_resume_proof_evidence_recording_links(import_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ag_recording_links_mapping_time
  ON ag_work_resume_proof_evidence_recording_links(mapping_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ag_recording_links_local_target_time
  ON ag_work_resume_proof_evidence_recording_links(
    local_target_scope,
    local_target_work_id,
    created_at DESC
  );

CREATE INDEX IF NOT EXISTS idx_ag_recording_links_status_time
  ON ag_work_resume_proof_evidence_recording_links(recording_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ag_recording_links_actor_time
  ON ag_work_resume_proof_evidence_recording_links(actor, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ag_recording_links_trust_label_time
  ON ag_work_resume_proof_evidence_recording_links(
    trust_provenance_label,
    created_at DESC
  );

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

CREATE TABLE IF NOT EXISTS temporal_preview_review_artifact_idempotency (
  idempotency_key_hash TEXT PRIMARY KEY,
  scope TEXT NOT NULL DEFAULT 'project:augnes',
  artifact_id TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  work_id TEXT NOT NULL,
  source_ref TEXT,
  preview_hash TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (artifact_id) REFERENCES temporal_preview_review_artifacts(artifact_id),
  FOREIGN KEY (scope, work_id) REFERENCES work_items(scope, work_id)
);

CREATE INDEX IF NOT EXISTS idx_temporal_review_artifact_idem_scope_source_hash
  ON temporal_preview_review_artifact_idempotency(scope, work_id, source_ref, preview_hash);

CREATE INDEX IF NOT EXISTS idx_temporal_review_artifact_idem_scope_artifact
  ON temporal_preview_review_artifact_idempotency(scope, artifact_id);

CREATE TABLE IF NOT EXISTS research_candidate_manual_note_preview_drafts (
  preview_draft_id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('preview_draft')),
  scope TEXT NOT NULL DEFAULT 'project:augnes' CHECK (scope IN ('project:augnes')),
  source_kind TEXT NOT NULL CHECK (source_kind IN ('manual_paste')),
  operator_note_label TEXT,
  parser_version TEXT NOT NULL,
  preview_version TEXT NOT NULL,
  input_fingerprint TEXT NOT NULL,
  manual_note_text_stored INTEGER NOT NULL DEFAULT 0 CHECK (manual_note_text_stored = 0),
  preview_json TEXT NOT NULL,
  warnings_json TEXT NOT NULL DEFAULT '[]',
  authority_json TEXT NOT NULL,
  runtime_boundary_json TEXT NOT NULL,
  no_side_effects_json TEXT NOT NULL,
  promoted_at TEXT CHECK (promoted_at IS NULL),
  canonical_perspective_id TEXT CHECK (canonical_perspective_id IS NULL),
  proof_id TEXT CHECK (proof_id IS NULL),
  evidence_id TEXT CHECK (evidence_id IS NULL),
  work_item_id TEXT CHECK (work_item_id IS NULL),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_note_preview_drafts_scope_time
  ON research_candidate_manual_note_preview_drafts(scope, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_note_preview_drafts_status_time
  ON research_candidate_manual_note_preview_drafts(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_note_preview_drafts_input
  ON research_candidate_manual_note_preview_drafts(input_fingerprint);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_note_preview_drafts_source
  ON research_candidate_manual_note_preview_drafts(source_kind, created_at DESC);

CREATE TABLE IF NOT EXISTS research_candidate_manual_note_preview_draft_discards (
  discard_id TEXT PRIMARY KEY,
  preview_draft_id TEXT NOT NULL UNIQUE,
  scope TEXT NOT NULL DEFAULT 'project:augnes' CHECK (scope IN ('project:augnes')),
  discarded_at TEXT NOT NULL,
  discarded_by TEXT NOT NULL,
  discard_reason TEXT NOT NULL DEFAULT '',
  authority_json TEXT NOT NULL,
  no_side_effects_json TEXT NOT NULL,
  FOREIGN KEY (preview_draft_id) REFERENCES research_candidate_manual_note_preview_drafts(preview_draft_id)
);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_note_preview_draft_discards_scope_time
  ON research_candidate_manual_note_preview_draft_discards(scope, discarded_at DESC);

CREATE TABLE IF NOT EXISTS research_candidate_manual_note_preview_draft_activities (
  activity_id TEXT PRIMARY KEY,
  preview_draft_id TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'project:augnes' CHECK (scope IN ('project:augnes')),
  activity_type TEXT NOT NULL CHECK (activity_type IN ('preview_draft_created', 'label_updated', 'label_cleared', 'preview_draft_discarded')),
  activity_at TEXT NOT NULL,
  activity_by TEXT NOT NULL,
  summary TEXT NOT NULL,
  before_json TEXT NOT NULL DEFAULT '{}',
  after_json TEXT NOT NULL DEFAULT '{}',
  authority_json TEXT NOT NULL,
  no_side_effects_json TEXT NOT NULL,
  FOREIGN KEY (preview_draft_id) REFERENCES research_candidate_manual_note_preview_drafts(preview_draft_id)
);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_note_preview_draft_activities_draft_time
  ON research_candidate_manual_note_preview_draft_activities(preview_draft_id, activity_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_note_preview_draft_activities_scope_time
  ON research_candidate_manual_note_preview_draft_activities(scope, activity_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_note_preview_draft_activities_type_time
  ON research_candidate_manual_note_preview_draft_activities(activity_type, activity_at DESC);

CREATE TABLE IF NOT EXISTS research_candidate_manual_result_write_receipts (
  receipt_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
  source_preview_session_id TEXT NOT NULL,
  source_handoff_seed_fingerprint TEXT NOT NULL,
  source_result_intake_ref TEXT NOT NULL,
  source_result_intake_fingerprint TEXT NOT NULL,
  source_operator_review_ref TEXT NOT NULL,
  source_operator_review_fingerprint TEXT NOT NULL,
  source_record_contract_ref TEXT NOT NULL,
  source_record_contract_fingerprint TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  write_status TEXT NOT NULL CHECK (
    write_status IN (
      'committed',
      'duplicate_replayed',
      'superseded',
      'rolled_back'
    )
  ),
  operator_decision TEXT NOT NULL,
  authority_profile TEXT NOT NULL,
  receipt_fingerprint TEXT NOT NULL,
  supersedes_receipt_id TEXT,
  rollback_of_receipt_id TEXT,
  rollback_reason TEXT,
  FOREIGN KEY (supersedes_receipt_id) REFERENCES research_candidate_manual_result_write_receipts(receipt_id),
  FOREIGN KEY (rollback_of_receipt_id) REFERENCES research_candidate_manual_result_write_receipts(receipt_id)
);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_result_receipts_scope_time
  ON research_candidate_manual_result_write_receipts(scope, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_result_receipts_seed
  ON research_candidate_manual_result_write_receipts(source_handoff_seed_fingerprint, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_result_receipts_status
  ON research_candidate_manual_result_write_receipts(scope, write_status, created_at DESC);

CREATE TABLE IF NOT EXISTS research_candidate_manual_expected_observed_delta_records (
  record_id TEXT PRIMARY KEY,
  receipt_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
  expected_summary TEXT NOT NULL,
  observed_summary TEXT,
  mismatch_or_gap_summary TEXT NOT NULL,
  source_handoff_seed_fingerprint TEXT NOT NULL,
  source_result_text_fingerprint TEXT NOT NULL,
  source_preview_session_id TEXT NOT NULL,
  source_refs_json TEXT NOT NULL,
  authority_profile TEXT NOT NULL,
  record_fingerprint TEXT NOT NULL,
  FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_result_write_receipts(receipt_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_eod_records_receipt
  ON research_candidate_manual_expected_observed_delta_records(receipt_id);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_eod_records_scope_time
  ON research_candidate_manual_expected_observed_delta_records(scope, created_at DESC);

CREATE TABLE IF NOT EXISTS research_candidate_manual_reuse_outcome_records (
  record_id TEXT PRIMARY KEY,
  receipt_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
  outcome_label TEXT NOT NULL,
  selected_candidate_context_refs_json TEXT NOT NULL,
  source_line TEXT,
  warning_reasons_json TEXT NOT NULL,
  source_handoff_seed_fingerprint TEXT NOT NULL,
  source_result_text_fingerprint TEXT NOT NULL,
  source_preview_session_id TEXT NOT NULL,
  authority_profile TEXT NOT NULL,
  record_fingerprint TEXT NOT NULL,
  FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_result_write_receipts(receipt_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_reuse_records_receipt
  ON research_candidate_manual_reuse_outcome_records(receipt_id);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_reuse_records_scope_time
  ON research_candidate_manual_reuse_outcome_records(scope, created_at DESC);

CREATE TABLE IF NOT EXISTS research_candidate_manual_result_write_rollbacks (
  rollback_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  receipt_id TEXT NOT NULL,
  rollback_reason TEXT NOT NULL,
  authority_profile TEXT NOT NULL,
  rollback_fingerprint TEXT NOT NULL,
  FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_result_write_receipts(receipt_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_result_rollbacks_receipt
  ON research_candidate_manual_result_write_rollbacks(receipt_id);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_result_rollbacks_time
  ON research_candidate_manual_result_write_rollbacks(created_at DESC);

CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_ledger_receipts (
  receipt_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
  source_contract_fingerprint TEXT NOT NULL,
  source_contract_ref TEXT NOT NULL,
  source_authorization_review_fingerprint TEXT NOT NULL,
  source_manual_receipt_id TEXT NOT NULL,
  source_bridge_preview_fingerprint TEXT NOT NULL,
  source_handoff_seed_fingerprint TEXT NOT NULL,
  source_result_text_fingerprint TEXT NOT NULL,
  source_expected_observed_delta_record_ref TEXT NOT NULL,
  source_reuse_outcome_record_ref TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  ledger_write_status TEXT NOT NULL CHECK (
    ledger_write_status IN (
      'committed',
      'duplicate_replayed',
      'superseded',
      'rolled_back'
    )
  ),
  authority_profile TEXT NOT NULL,
  receipt_fingerprint TEXT NOT NULL,
  supersedes_receipt_id TEXT,
  rollback_of_receipt_id TEXT,
  rollback_reason TEXT,
  FOREIGN KEY (supersedes_receipt_id) REFERENCES research_candidate_manual_global_dogfood_ledger_receipts(receipt_id),
  FOREIGN KEY (rollback_of_receipt_id) REFERENCES research_candidate_manual_global_dogfood_ledger_receipts(receipt_id)
);

CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_ledger_records (
  ledger_record_id TEXT PRIMARY KEY,
  receipt_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
  source_manual_receipt_id TEXT NOT NULL,
  source_handoff_seed_fingerprint TEXT NOT NULL,
  source_result_text_fingerprint TEXT NOT NULL,
  source_expected_observed_delta_record_ref TEXT NOT NULL,
  source_reuse_outcome_record_ref TEXT NOT NULL,
  outcome_label TEXT NOT NULL,
  selected_candidate_context_refs_json TEXT NOT NULL,
  expected_summary TEXT NOT NULL,
  observed_summary TEXT,
  mismatch_or_gap_summary TEXT NOT NULL,
  source_line TEXT,
  manual_only_context_refs_json TEXT NOT NULL,
  warning_reasons_json TEXT NOT NULL,
  compatibility_findings_json TEXT NOT NULL,
  authority_profile TEXT NOT NULL,
  ledger_record_fingerprint TEXT NOT NULL,
  FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_ledger_receipts(receipt_id)
);

CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_ledger_rollbacks (
  rollback_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  receipt_id TEXT NOT NULL,
  rollback_reason TEXT NOT NULL,
  authority_profile TEXT NOT NULL,
  rollback_fingerprint TEXT NOT NULL,
  FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_ledger_receipts(receipt_id)
);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_receipts_scope_time
  ON research_candidate_manual_global_dogfood_ledger_receipts(scope, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_receipts_status
  ON research_candidate_manual_global_dogfood_ledger_receipts(scope, ledger_write_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_receipts_source_manual
  ON research_candidate_manual_global_dogfood_ledger_receipts(source_manual_receipt_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_receipts_contract
  ON research_candidate_manual_global_dogfood_ledger_receipts(source_contract_fingerprint, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_records_receipt
  ON research_candidate_manual_global_dogfood_ledger_records(receipt_id);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_records_scope_time
  ON research_candidate_manual_global_dogfood_ledger_records(scope, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_rollbacks_receipt
  ON research_candidate_manual_global_dogfood_ledger_rollbacks(receipt_id);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_rollbacks_time
  ON research_candidate_manual_global_dogfood_ledger_rollbacks(created_at DESC);

CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_metric_snapshot_receipts (
  receipt_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
  source_metric_contract_fingerprint TEXT NOT NULL,
  source_metric_review_fingerprint TEXT NOT NULL,
  source_projection_fingerprint TEXT NOT NULL,
  source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
  source_global_dogfood_ledger_record_id TEXT NOT NULL,
  source_manual_receipt_id TEXT NOT NULL,
  source_handoff_seed_fingerprint TEXT NOT NULL,
  source_result_text_fingerprint TEXT NOT NULL,
  source_expected_observed_delta_record_ref TEXT NOT NULL,
  source_reuse_outcome_record_ref TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  write_status TEXT NOT NULL CHECK (
    write_status IN (
      'committed',
      'duplicate_replayed',
      'superseded',
      'rolled_back'
    )
  ),
  authority_profile TEXT NOT NULL,
  receipt_fingerprint TEXT NOT NULL,
  supersedes_receipt_id TEXT,
  rollback_of_receipt_id TEXT,
  rollback_reason TEXT,
  FOREIGN KEY (supersedes_receipt_id) REFERENCES research_candidate_manual_global_dogfood_metric_snapshot_receipts(receipt_id),
  FOREIGN KEY (rollback_of_receipt_id) REFERENCES research_candidate_manual_global_dogfood_metric_snapshot_receipts(receipt_id)
);

CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_metric_snapshot_records (
  metric_snapshot_record_id TEXT PRIMARY KEY,
  receipt_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
  source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
  source_global_dogfood_ledger_record_id TEXT NOT NULL,
  source_projection_fingerprint TEXT NOT NULL,
  source_metric_contract_fingerprint TEXT NOT NULL,
  source_metric_review_fingerprint TEXT NOT NULL,
  outcome_label TEXT NOT NULL,
  outcome_signal TEXT NOT NULL CHECK (outcome_signal IN ('positive', 'negative', 'ambiguous')),
  proposed_metric_dimensions_json TEXT NOT NULL,
  proposed_metric_counters_json TEXT NOT NULL,
  proposed_metric_labels_json TEXT NOT NULL,
  selected_candidate_context_refs_json TEXT NOT NULL,
  expected_summary_present INTEGER NOT NULL,
  observed_summary_present INTEGER NOT NULL,
  mismatch_or_gap_present INTEGER NOT NULL,
  source_refs_json TEXT NOT NULL,
  manual_only_context_refs_json TEXT NOT NULL,
  warning_reasons_json TEXT NOT NULL,
  compatibility_findings_json TEXT NOT NULL,
  authority_profile TEXT NOT NULL,
  metric_snapshot_record_fingerprint TEXT NOT NULL,
  FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_metric_snapshot_receipts(receipt_id)
);

CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_metric_snapshot_rollbacks (
  rollback_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  receipt_id TEXT NOT NULL,
  rollback_reason TEXT NOT NULL,
  authority_profile TEXT NOT NULL,
  rollback_fingerprint TEXT NOT NULL,
  FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_metric_snapshot_receipts(receipt_id)
);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_metric_snapshot_receipts_scope_time
  ON research_candidate_manual_global_dogfood_metric_snapshot_receipts(scope, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_metric_snapshot_receipts_status
  ON research_candidate_manual_global_dogfood_metric_snapshot_receipts(scope, write_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_metric_snapshot_receipts_source_projection
  ON research_candidate_manual_global_dogfood_metric_snapshot_receipts(source_projection_fingerprint, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_metric_snapshot_receipts_source_ledger
  ON research_candidate_manual_global_dogfood_metric_snapshot_receipts(source_global_dogfood_ledger_receipt_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_metric_snapshot_records_receipt
  ON research_candidate_manual_global_dogfood_metric_snapshot_records(receipt_id);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_metric_snapshot_records_scope_time
  ON research_candidate_manual_global_dogfood_metric_snapshot_records(scope, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_metric_snapshot_rollbacks_receipt
  ON research_candidate_manual_global_dogfood_metric_snapshot_rollbacks(receipt_id);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_metric_snapshot_rollbacks_time
  ON research_candidate_manual_global_dogfood_metric_snapshot_rollbacks(created_at DESC);

CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_next_work_signal_receipts (
  receipt_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
  source_next_work_contract_fingerprint TEXT NOT NULL,
  source_next_work_review_fingerprint TEXT NOT NULL,
  source_projection_fingerprint TEXT NOT NULL,
  source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
  source_global_dogfood_ledger_record_id TEXT NOT NULL,
  source_metric_snapshot_receipt_id TEXT NOT NULL,
  source_metric_snapshot_record_id TEXT NOT NULL,
  source_manual_receipt_id TEXT NOT NULL,
  source_handoff_seed_fingerprint TEXT NOT NULL,
  source_result_text_fingerprint TEXT NOT NULL,
  source_expected_observed_delta_record_ref TEXT NOT NULL,
  source_reuse_outcome_record_ref TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  write_status TEXT NOT NULL CHECK (
    write_status IN (
      'committed',
      'duplicate_replayed',
      'superseded',
      'rolled_back'
    )
  ),
  authority_profile TEXT NOT NULL,
  receipt_fingerprint TEXT NOT NULL,
  supersedes_receipt_id TEXT,
  rollback_of_receipt_id TEXT,
  rollback_reason TEXT,
  FOREIGN KEY (supersedes_receipt_id) REFERENCES research_candidate_manual_global_dogfood_next_work_signal_receipts(receipt_id),
  FOREIGN KEY (rollback_of_receipt_id) REFERENCES research_candidate_manual_global_dogfood_next_work_signal_receipts(receipt_id)
);

CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_next_work_signal_records (
  next_work_signal_record_id TEXT PRIMARY KEY,
  receipt_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
  source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
  source_global_dogfood_ledger_record_id TEXT NOT NULL,
  source_metric_snapshot_receipt_id TEXT NOT NULL,
  source_metric_snapshot_record_id TEXT NOT NULL,
  source_projection_fingerprint TEXT NOT NULL,
  source_next_work_contract_fingerprint TEXT NOT NULL,
  source_next_work_review_fingerprint TEXT NOT NULL,
  recommended_next_work_label TEXT NOT NULL,
  rationale TEXT NOT NULL,
  outcome_label TEXT NOT NULL,
  outcome_signal TEXT NOT NULL CHECK (outcome_signal IN ('positive', 'negative', 'ambiguous')),
  candidate_priority_hint TEXT NOT NULL CHECK (candidate_priority_hint IN ('high', 'medium', 'low', 'blocked')),
  decision_status TEXT NOT NULL,
  mismatch_or_gap_summary TEXT,
  expected_summary TEXT,
  observed_summary TEXT,
  source_line TEXT,
  selected_candidate_context_refs_json TEXT NOT NULL,
  source_next_work_candidate_card_ids_json TEXT NOT NULL,
  blockers_json TEXT NOT NULL,
  warnings_json TEXT NOT NULL,
  manual_only_context_refs_json TEXT NOT NULL,
  source_refs_json TEXT NOT NULL,
  authority_profile TEXT NOT NULL,
  next_work_signal_record_fingerprint TEXT NOT NULL,
  FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_next_work_signal_receipts(receipt_id)
);

CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_next_work_signal_rollbacks (
  rollback_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  receipt_id TEXT NOT NULL,
  rollback_reason TEXT NOT NULL,
  authority_profile TEXT NOT NULL,
  rollback_fingerprint TEXT NOT NULL,
  FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_next_work_signal_receipts(receipt_id)
);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_signal_receipts_scope_time
  ON research_candidate_manual_global_dogfood_next_work_signal_receipts(scope, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_signal_receipts_status
  ON research_candidate_manual_global_dogfood_next_work_signal_receipts(scope, write_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_signal_receipts_source_projection
  ON research_candidate_manual_global_dogfood_next_work_signal_receipts(source_projection_fingerprint, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_signal_receipts_source_ledger
  ON research_candidate_manual_global_dogfood_next_work_signal_receipts(source_global_dogfood_ledger_receipt_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_signal_receipts_source_metric
  ON research_candidate_manual_global_dogfood_next_work_signal_receipts(source_metric_snapshot_receipt_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_signal_records_receipt
  ON research_candidate_manual_global_dogfood_next_work_signal_records(receipt_id);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_signal_records_scope_time
  ON research_candidate_manual_global_dogfood_next_work_signal_records(scope, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_signal_rollbacks_receipt
  ON research_candidate_manual_global_dogfood_next_work_signal_rollbacks(receipt_id);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_signal_rollbacks_time
  ON research_candidate_manual_global_dogfood_next_work_signal_rollbacks(created_at DESC);

CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_next_work_bias_receipts (
  receipt_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
  source_next_work_bias_contract_fingerprint TEXT NOT NULL,
  source_next_work_bias_review_fingerprint TEXT NOT NULL,
  source_next_work_signal_receipt_id TEXT NOT NULL,
  source_next_work_signal_record_id TEXT NOT NULL,
  source_next_work_signal_record_fingerprint TEXT NOT NULL,
  source_projection_fingerprint TEXT NOT NULL,
  source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
  source_global_dogfood_ledger_record_id TEXT NOT NULL,
  source_metric_snapshot_receipt_id TEXT NOT NULL,
  source_metric_snapshot_record_id TEXT NOT NULL,
  source_manual_receipt_id TEXT NOT NULL,
  source_handoff_seed_fingerprint TEXT NOT NULL,
  source_result_text_fingerprint TEXT NOT NULL,
  source_expected_observed_delta_record_ref TEXT NOT NULL,
  source_reuse_outcome_record_ref TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  write_status TEXT NOT NULL CHECK (
    write_status IN (
      'committed',
      'duplicate_replayed',
      'superseded',
      'rolled_back'
    )
  ),
  authority_profile TEXT NOT NULL,
  receipt_fingerprint TEXT NOT NULL,
  supersedes_receipt_id TEXT,
  rollback_of_receipt_id TEXT,
  rollback_reason TEXT,
  FOREIGN KEY (supersedes_receipt_id) REFERENCES research_candidate_manual_global_dogfood_next_work_bias_receipts(receipt_id),
  FOREIGN KEY (rollback_of_receipt_id) REFERENCES research_candidate_manual_global_dogfood_next_work_bias_receipts(receipt_id)
);

CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_next_work_bias_records (
  next_work_bias_record_id TEXT PRIMARY KEY,
  receipt_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
  source_next_work_signal_receipt_id TEXT NOT NULL,
  source_next_work_signal_record_id TEXT NOT NULL,
  source_projection_fingerprint TEXT NOT NULL,
  source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
  source_global_dogfood_ledger_record_id TEXT NOT NULL,
  source_metric_snapshot_receipt_id TEXT NOT NULL,
  source_metric_snapshot_record_id TEXT NOT NULL,
  recommended_next_work_label TEXT NOT NULL,
  rationale TEXT NOT NULL,
  outcome_label TEXT NOT NULL,
  outcome_signal TEXT NOT NULL CHECK (outcome_signal IN ('positive', 'negative', 'ambiguous')),
  bias_strength_hint TEXT NOT NULL CHECK (bias_strength_hint IN ('low', 'medium', 'high', 'blocked')),
  selected_candidate_context_refs_json TEXT NOT NULL,
  source_next_work_candidate_card_ids_json TEXT NOT NULL,
  expected_summary TEXT,
  observed_summary TEXT,
  mismatch_or_gap_summary TEXT,
  source_line TEXT,
  blockers_json TEXT NOT NULL,
  warnings_json TEXT NOT NULL,
  manual_only_context_refs_json TEXT NOT NULL,
  source_refs_json TEXT NOT NULL,
  authority_profile TEXT NOT NULL,
  next_work_bias_record_fingerprint TEXT NOT NULL,
  FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_next_work_bias_receipts(receipt_id)
);

CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_next_work_bias_rollbacks (
  rollback_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  receipt_id TEXT NOT NULL,
  rollback_reason TEXT NOT NULL,
  authority_profile TEXT NOT NULL,
  rollback_fingerprint TEXT NOT NULL,
  FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_next_work_bias_receipts(receipt_id)
);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_receipts_scope_time
  ON research_candidate_manual_global_dogfood_next_work_bias_receipts(scope, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_receipts_status
  ON research_candidate_manual_global_dogfood_next_work_bias_receipts(scope, write_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_receipts_source_signal
  ON research_candidate_manual_global_dogfood_next_work_bias_receipts(source_next_work_signal_receipt_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_receipts_source_projection
  ON research_candidate_manual_global_dogfood_next_work_bias_receipts(source_projection_fingerprint, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_receipts_source_ledger
  ON research_candidate_manual_global_dogfood_next_work_bias_receipts(source_global_dogfood_ledger_receipt_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_receipts_source_metric
  ON research_candidate_manual_global_dogfood_next_work_bias_receipts(source_metric_snapshot_receipt_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_records_receipt
  ON research_candidate_manual_global_dogfood_next_work_bias_records(receipt_id);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_records_scope_time
  ON research_candidate_manual_global_dogfood_next_work_bias_records(scope, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_rollbacks_receipt
  ON research_candidate_manual_global_dogfood_next_work_bias_rollbacks(receipt_id);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_rollbacks_time
  ON research_candidate_manual_global_dogfood_next_work_bias_rollbacks(created_at DESC);

CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_relay_receipts (
  receipt_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
  source_perspective_relay_contract_fingerprint TEXT NOT NULL,
  source_perspective_relay_review_fingerprint TEXT NOT NULL,
  source_next_work_signal_receipt_id TEXT NOT NULL,
  source_next_work_signal_record_id TEXT NOT NULL,
  source_next_work_signal_record_fingerprint TEXT NOT NULL,
  source_next_work_bias_receipt_id TEXT NOT NULL,
  source_next_work_bias_record_id TEXT NOT NULL,
  source_next_work_bias_record_fingerprint TEXT NOT NULL,
  source_projection_fingerprint TEXT NOT NULL,
  source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
  source_global_dogfood_ledger_record_id TEXT NOT NULL,
  source_metric_snapshot_receipt_id TEXT NOT NULL,
  source_metric_snapshot_record_id TEXT NOT NULL,
  source_manual_receipt_id TEXT NOT NULL,
  source_handoff_seed_fingerprint TEXT NOT NULL,
  source_result_text_fingerprint TEXT NOT NULL,
  source_expected_observed_delta_record_ref TEXT NOT NULL,
  source_reuse_outcome_record_ref TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  write_status TEXT NOT NULL CHECK (
    write_status IN (
      'committed',
      'duplicate_replayed',
      'superseded',
      'rolled_back'
    )
  ),
  authority_profile TEXT NOT NULL,
  receipt_fingerprint TEXT NOT NULL,
  supersedes_receipt_id TEXT,
  rollback_of_receipt_id TEXT,
  rollback_reason TEXT,
  FOREIGN KEY (supersedes_receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_relay_receipts(receipt_id),
  FOREIGN KEY (rollback_of_receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_relay_receipts(receipt_id)
);

CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_relay_records (
  perspective_relay_record_id TEXT PRIMARY KEY,
  receipt_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
  source_next_work_signal_receipt_id TEXT NOT NULL,
  source_next_work_signal_record_id TEXT NOT NULL,
  source_next_work_bias_receipt_id TEXT NOT NULL,
  source_next_work_bias_record_id TEXT NOT NULL,
  source_projection_fingerprint TEXT NOT NULL,
  source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
  source_global_dogfood_ledger_record_id TEXT NOT NULL,
  source_metric_snapshot_receipt_id TEXT NOT NULL,
  source_metric_snapshot_record_id TEXT NOT NULL,
  relay_update_label TEXT NOT NULL,
  relay_update_rationale TEXT NOT NULL,
  recommended_next_work_label TEXT NOT NULL,
  outcome_label TEXT NOT NULL,
  outcome_signal TEXT NOT NULL CHECK (outcome_signal IN ('positive', 'negative', 'ambiguous')),
  expected_summary TEXT,
  observed_summary TEXT,
  mismatch_or_gap_summary TEXT,
  selected_candidate_context_refs_json TEXT NOT NULL,
  source_next_work_candidate_card_ids_json TEXT NOT NULL,
  manual_only_context_refs_json TEXT NOT NULL,
  source_line TEXT,
  blockers_json TEXT NOT NULL,
  warnings_json TEXT NOT NULL,
  source_refs_json TEXT NOT NULL,
  authority_profile TEXT NOT NULL,
  perspective_relay_record_fingerprint TEXT NOT NULL,
  FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_relay_receipts(receipt_id)
);

CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_relay_rollbacks (
  rollback_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  receipt_id TEXT NOT NULL,
  rollback_reason TEXT NOT NULL,
  authority_profile TEXT NOT NULL,
  rollback_fingerprint TEXT NOT NULL,
  FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_relay_receipts(receipt_id)
);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_receipts_scope_time
  ON research_candidate_manual_global_dogfood_perspective_relay_receipts(scope, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_receipts_status
  ON research_candidate_manual_global_dogfood_perspective_relay_receipts(scope, write_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_receipts_source_signal
  ON research_candidate_manual_global_dogfood_perspective_relay_receipts(source_next_work_signal_receipt_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_receipts_source_bias
  ON research_candidate_manual_global_dogfood_perspective_relay_receipts(source_next_work_bias_receipt_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_receipts_source_projection
  ON research_candidate_manual_global_dogfood_perspective_relay_receipts(source_projection_fingerprint, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_receipts_source_ledger
  ON research_candidate_manual_global_dogfood_perspective_relay_receipts(source_global_dogfood_ledger_receipt_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_receipts_source_metric
  ON research_candidate_manual_global_dogfood_perspective_relay_receipts(source_metric_snapshot_receipt_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_records_receipt
  ON research_candidate_manual_global_dogfood_perspective_relay_records(receipt_id);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_records_scope_time
  ON research_candidate_manual_global_dogfood_perspective_relay_records(scope, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_rollbacks_receipt
  ON research_candidate_manual_global_dogfood_perspective_relay_rollbacks(receipt_id);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_rollbacks_time
  ON research_candidate_manual_global_dogfood_perspective_relay_rollbacks(created_at DESC);

CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_canonical_perspective_update_receipts (
  receipt_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
  source_canonical_perspective_update_contract_fingerprint TEXT NOT NULL,
  source_canonical_perspective_update_review_fingerprint TEXT NOT NULL,
  source_perspective_relay_receipt_id TEXT NOT NULL,
  source_perspective_relay_record_id TEXT NOT NULL,
  source_perspective_relay_record_fingerprint TEXT NOT NULL,
  source_next_work_signal_receipt_id TEXT NOT NULL,
  source_next_work_signal_record_id TEXT NOT NULL,
  source_next_work_signal_record_fingerprint TEXT NOT NULL,
  source_next_work_bias_receipt_id TEXT NOT NULL,
  source_next_work_bias_record_id TEXT NOT NULL,
  source_next_work_bias_record_fingerprint TEXT NOT NULL,
  source_projection_fingerprint TEXT NOT NULL,
  source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
  source_global_dogfood_ledger_record_id TEXT NOT NULL,
  source_metric_snapshot_receipt_id TEXT NOT NULL,
  source_metric_snapshot_record_id TEXT NOT NULL,
  source_manual_receipt_id TEXT NOT NULL,
  source_handoff_seed_fingerprint TEXT NOT NULL,
  source_result_text_fingerprint TEXT NOT NULL,
  source_expected_observed_delta_record_ref TEXT NOT NULL,
  source_reuse_outcome_record_ref TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  write_status TEXT NOT NULL CHECK (
    write_status IN (
      'committed',
      'duplicate_replayed',
      'superseded',
      'rolled_back'
    )
  ),
  authority_profile TEXT NOT NULL,
  receipt_fingerprint TEXT NOT NULL,
  supersedes_receipt_id TEXT,
  rollback_of_receipt_id TEXT,
  rollback_reason TEXT,
  FOREIGN KEY (supersedes_receipt_id) REFERENCES research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(receipt_id),
  FOREIGN KEY (rollback_of_receipt_id) REFERENCES research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(receipt_id)
);

CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_canonical_perspective_update_records (
  canonical_perspective_update_record_id TEXT PRIMARY KEY,
  receipt_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
  source_perspective_relay_receipt_id TEXT NOT NULL,
  source_perspective_relay_record_id TEXT NOT NULL,
  source_next_work_signal_receipt_id TEXT NOT NULL,
  source_next_work_signal_record_id TEXT NOT NULL,
  source_next_work_bias_receipt_id TEXT NOT NULL,
  source_next_work_bias_record_id TEXT NOT NULL,
  source_projection_fingerprint TEXT NOT NULL,
  source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
  source_global_dogfood_ledger_record_id TEXT NOT NULL,
  source_metric_snapshot_receipt_id TEXT NOT NULL,
  source_metric_snapshot_record_id TEXT NOT NULL,
  canonical_update_label TEXT NOT NULL,
  canonical_update_rationale TEXT NOT NULL,
  relay_update_label TEXT NOT NULL,
  relay_update_rationale TEXT NOT NULL,
  recommended_next_work_label TEXT NOT NULL,
  outcome_label TEXT NOT NULL,
  outcome_signal TEXT NOT NULL CHECK (outcome_signal IN ('positive', 'negative', 'ambiguous')),
  update_scope_hint TEXT NOT NULL CHECK (update_scope_hint IN ('canonical_perspective_state')),
  update_strength_hint TEXT NOT NULL CHECK (update_strength_hint IN ('low', 'medium', 'high')),
  expected_summary TEXT,
  observed_summary TEXT,
  mismatch_or_gap_summary TEXT,
  selected_candidate_context_refs_json TEXT NOT NULL,
  source_next_work_candidate_card_ids_json TEXT NOT NULL,
  manual_only_context_refs_json TEXT NOT NULL,
  source_line TEXT,
  blockers_json TEXT NOT NULL,
  warnings_json TEXT NOT NULL,
  compatibility_findings_json TEXT NOT NULL,
  existing_perspective_update_compatibility_json TEXT NOT NULL,
  source_refs_json TEXT NOT NULL,
  authority_profile TEXT NOT NULL,
  canonical_perspective_update_record_fingerprint TEXT NOT NULL,
  FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(receipt_id)
);

CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_canonical_perspective_update_rollbacks (
  rollback_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  receipt_id TEXT NOT NULL,
  rollback_reason TEXT NOT NULL,
  authority_profile TEXT NOT NULL,
  rollback_fingerprint TEXT NOT NULL,
  FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(receipt_id)
);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_scope_time
  ON research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(scope, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_status
  ON research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(scope, write_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_source_relay
  ON research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(source_perspective_relay_receipt_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_source_signal
  ON research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(source_next_work_signal_receipt_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_source_bias
  ON research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(source_next_work_bias_receipt_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_source_projection
  ON research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(source_projection_fingerprint, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_source_ledger
  ON research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(source_global_dogfood_ledger_receipt_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_source_metric
  ON research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(source_metric_snapshot_receipt_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_records_receipt
  ON research_candidate_manual_global_dogfood_canonical_perspective_update_records(receipt_id);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_records_scope_time
  ON research_candidate_manual_global_dogfood_canonical_perspective_update_records(scope, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_rollbacks_receipt
  ON research_candidate_manual_global_dogfood_canonical_perspective_update_rollbacks(receipt_id);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_rollbacks_time
  ON research_candidate_manual_global_dogfood_canonical_perspective_update_rollbacks(created_at DESC);

CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_apply_receipts (
  receipt_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
  source_perspective_apply_contract_fingerprint TEXT NOT NULL,
  source_perspective_apply_review_fingerprint TEXT NOT NULL,
  source_canonical_perspective_update_receipt_id TEXT NOT NULL,
  source_canonical_perspective_update_record_id TEXT NOT NULL,
  source_canonical_perspective_update_record_fingerprint TEXT NOT NULL,
  source_perspective_relay_receipt_id TEXT NOT NULL,
  source_perspective_relay_record_id TEXT NOT NULL,
  source_perspective_relay_record_fingerprint TEXT NOT NULL,
  source_next_work_signal_receipt_id TEXT NOT NULL,
  source_next_work_signal_record_id TEXT NOT NULL,
  source_next_work_signal_record_fingerprint TEXT NOT NULL,
  source_next_work_bias_receipt_id TEXT NOT NULL,
  source_next_work_bias_record_id TEXT NOT NULL,
  source_next_work_bias_record_fingerprint TEXT NOT NULL,
  source_projection_fingerprint TEXT NOT NULL,
  source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
  source_global_dogfood_ledger_record_id TEXT NOT NULL,
  source_metric_snapshot_receipt_id TEXT NOT NULL,
  source_metric_snapshot_record_id TEXT NOT NULL,
  source_manual_receipt_id TEXT NOT NULL,
  source_handoff_seed_fingerprint TEXT NOT NULL,
  source_result_text_fingerprint TEXT NOT NULL,
  source_expected_observed_delta_record_ref TEXT NOT NULL,
  source_reuse_outcome_record_ref TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  write_status TEXT NOT NULL CHECK (
    write_status IN (
      'committed',
      'duplicate_replayed',
      'superseded',
      'rolled_back'
    )
  ),
  authority_profile TEXT NOT NULL,
  receipt_fingerprint TEXT NOT NULL,
  supersedes_receipt_id TEXT,
  rollback_of_receipt_id TEXT,
  rollback_reason TEXT,
  FOREIGN KEY (supersedes_receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_apply_receipts(receipt_id),
  FOREIGN KEY (rollback_of_receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_apply_receipts(receipt_id)
);

CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_apply_records (
  perspective_apply_record_id TEXT PRIMARY KEY,
  receipt_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
  source_canonical_perspective_update_receipt_id TEXT NOT NULL,
  source_canonical_perspective_update_record_id TEXT NOT NULL,
  source_perspective_relay_receipt_id TEXT NOT NULL,
  source_perspective_relay_record_id TEXT NOT NULL,
  source_next_work_signal_receipt_id TEXT NOT NULL,
  source_next_work_signal_record_id TEXT NOT NULL,
  source_next_work_bias_receipt_id TEXT NOT NULL,
  source_next_work_bias_record_id TEXT NOT NULL,
  source_projection_fingerprint TEXT NOT NULL,
  source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
  source_global_dogfood_ledger_record_id TEXT NOT NULL,
  source_metric_snapshot_receipt_id TEXT NOT NULL,
  source_metric_snapshot_record_id TEXT NOT NULL,
  apply_label TEXT NOT NULL,
  apply_rationale TEXT NOT NULL,
  canonical_update_label TEXT NOT NULL,
  canonical_update_rationale TEXT NOT NULL,
  relay_update_label TEXT NOT NULL,
  relay_update_rationale TEXT NOT NULL,
  recommended_next_work_label TEXT NOT NULL,
  outcome_label TEXT NOT NULL,
  outcome_signal TEXT NOT NULL CHECK (outcome_signal IN ('positive', 'negative', 'ambiguous')),
  intended_future_apply_target TEXT NOT NULL CHECK (intended_future_apply_target IN ('canonical_perspective_state')),
  apply_scope_hint TEXT NOT NULL CHECK (apply_scope_hint IN ('canonical_perspective_state')),
  apply_strength_hint TEXT NOT NULL CHECK (apply_strength_hint IN ('low', 'medium', 'high')),
  expected_summary TEXT,
  observed_summary TEXT,
  mismatch_or_gap_summary TEXT,
  selected_candidate_context_refs_json TEXT NOT NULL,
  source_next_work_candidate_card_ids_json TEXT NOT NULL,
  manual_only_context_refs_json TEXT NOT NULL,
  source_line TEXT,
  blockers_json TEXT NOT NULL,
  warnings_json TEXT NOT NULL,
  compatibility_findings_json TEXT NOT NULL,
  existing_apply_path_compatibility_json TEXT NOT NULL,
  source_refs_json TEXT NOT NULL,
  authority_profile TEXT NOT NULL,
  perspective_apply_record_fingerprint TEXT NOT NULL,
  FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_apply_receipts(receipt_id)
);

CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_apply_rollbacks (
  rollback_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  receipt_id TEXT NOT NULL,
  rollback_reason TEXT NOT NULL,
  authority_profile TEXT NOT NULL,
  rollback_fingerprint TEXT NOT NULL,
  FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_apply_receipts(receipt_id)
);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_apply_receipts_scope_time
  ON research_candidate_manual_global_dogfood_perspective_apply_receipts(scope, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_apply_receipts_status
  ON research_candidate_manual_global_dogfood_perspective_apply_receipts(scope, write_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_apply_receipts_source_canonical_update
  ON research_candidate_manual_global_dogfood_perspective_apply_receipts(source_canonical_perspective_update_receipt_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_apply_receipts_source_relay
  ON research_candidate_manual_global_dogfood_perspective_apply_receipts(source_perspective_relay_receipt_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_apply_receipts_source_signal
  ON research_candidate_manual_global_dogfood_perspective_apply_receipts(source_next_work_signal_receipt_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_apply_receipts_source_bias
  ON research_candidate_manual_global_dogfood_perspective_apply_receipts(source_next_work_bias_receipt_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_apply_receipts_source_projection
  ON research_candidate_manual_global_dogfood_perspective_apply_receipts(source_projection_fingerprint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_apply_receipts_source_ledger
  ON research_candidate_manual_global_dogfood_perspective_apply_receipts(source_global_dogfood_ledger_receipt_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_apply_receipts_source_metric
  ON research_candidate_manual_global_dogfood_perspective_apply_receipts(source_metric_snapshot_receipt_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_apply_records_receipt
  ON research_candidate_manual_global_dogfood_perspective_apply_records(receipt_id);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_apply_records_scope_time
  ON research_candidate_manual_global_dogfood_perspective_apply_records(scope, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_apply_rollbacks_receipt
  ON research_candidate_manual_global_dogfood_perspective_apply_rollbacks(receipt_id);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_apply_rollbacks_time
  ON research_candidate_manual_global_dogfood_perspective_apply_rollbacks(created_at DESC);

CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_state_mutation_receipts (
  receipt_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
  source_perspective_state_mutation_contract_fingerprint TEXT NOT NULL,
  source_perspective_state_mutation_review_fingerprint TEXT NOT NULL,
  source_perspective_apply_receipt_id TEXT NOT NULL,
  source_perspective_apply_record_id TEXT NOT NULL,
  source_perspective_apply_record_fingerprint TEXT NOT NULL,
  source_canonical_perspective_update_receipt_id TEXT NOT NULL,
  source_canonical_perspective_update_record_id TEXT NOT NULL,
  source_canonical_perspective_update_record_fingerprint TEXT NOT NULL,
  source_perspective_relay_receipt_id TEXT NOT NULL,
  source_perspective_relay_record_id TEXT NOT NULL,
  source_perspective_relay_record_fingerprint TEXT NOT NULL,
  source_next_work_signal_receipt_id TEXT NOT NULL,
  source_next_work_signal_record_id TEXT NOT NULL,
  source_next_work_signal_record_fingerprint TEXT NOT NULL,
  source_next_work_bias_receipt_id TEXT NOT NULL,
  source_next_work_bias_record_id TEXT NOT NULL,
  source_next_work_bias_record_fingerprint TEXT NOT NULL,
  source_projection_fingerprint TEXT NOT NULL,
  source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
  source_global_dogfood_ledger_record_id TEXT NOT NULL,
  source_metric_snapshot_receipt_id TEXT NOT NULL,
  source_metric_snapshot_record_id TEXT NOT NULL,
  source_manual_receipt_id TEXT NOT NULL,
  source_handoff_seed_fingerprint TEXT NOT NULL,
  source_result_text_fingerprint TEXT NOT NULL,
  source_expected_observed_delta_record_ref TEXT NOT NULL,
  source_reuse_outcome_record_ref TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  write_status TEXT NOT NULL CHECK (
    write_status IN (
      'committed',
      'duplicate_replayed',
      'superseded',
      'rolled_back'
    )
  ),
  authority_profile TEXT NOT NULL,
  receipt_fingerprint TEXT NOT NULL,
  supersedes_receipt_id TEXT,
  rollback_of_receipt_id TEXT,
  rollback_reason TEXT,
  FOREIGN KEY (supersedes_receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_state_mutation_receipts(receipt_id),
  FOREIGN KEY (rollback_of_receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_state_mutation_receipts(receipt_id)
);

CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_state_mutation_records (
  perspective_state_mutation_record_id TEXT PRIMARY KEY,
  receipt_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
  source_perspective_apply_receipt_id TEXT NOT NULL,
  source_perspective_apply_record_id TEXT NOT NULL,
  source_canonical_perspective_update_receipt_id TEXT NOT NULL,
  source_canonical_perspective_update_record_id TEXT NOT NULL,
  source_perspective_relay_receipt_id TEXT NOT NULL,
  source_perspective_relay_record_id TEXT NOT NULL,
  source_next_work_signal_receipt_id TEXT NOT NULL,
  source_next_work_signal_record_id TEXT NOT NULL,
  source_next_work_bias_receipt_id TEXT NOT NULL,
  source_next_work_bias_record_id TEXT NOT NULL,
  source_projection_fingerprint TEXT NOT NULL,
  source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
  source_global_dogfood_ledger_record_id TEXT NOT NULL,
  source_metric_snapshot_receipt_id TEXT NOT NULL,
  source_metric_snapshot_record_id TEXT NOT NULL,
  mutation_label TEXT NOT NULL,
  mutation_rationale TEXT NOT NULL,
  apply_label TEXT NOT NULL,
  apply_rationale TEXT NOT NULL,
  canonical_update_label TEXT NOT NULL,
  canonical_update_rationale TEXT NOT NULL,
  relay_update_label TEXT NOT NULL,
  relay_update_rationale TEXT NOT NULL,
  recommended_next_work_label TEXT NOT NULL,
  outcome_label TEXT NOT NULL,
  outcome_signal TEXT NOT NULL CHECK (outcome_signal IN ('positive', 'negative', 'ambiguous')),
  intended_future_mutation_target TEXT NOT NULL CHECK (intended_future_mutation_target IN ('canonical_perspective_state')),
  mutation_scope_hint TEXT NOT NULL CHECK (mutation_scope_hint IN ('canonical_perspective_state')),
  mutation_strength_hint TEXT NOT NULL CHECK (mutation_strength_hint IN ('low', 'medium', 'high')),
  intended_future_apply_target TEXT NOT NULL CHECK (intended_future_apply_target IN ('canonical_perspective_state')),
  apply_scope_hint TEXT NOT NULL CHECK (apply_scope_hint IN ('canonical_perspective_state')),
  apply_strength_hint TEXT NOT NULL CHECK (apply_strength_hint IN ('low', 'medium', 'high')),
  expected_summary TEXT,
  observed_summary TEXT,
  mismatch_or_gap_summary TEXT,
  selected_candidate_context_refs_json TEXT NOT NULL,
  source_next_work_candidate_card_ids_json TEXT NOT NULL,
  manual_only_context_refs_json TEXT NOT NULL,
  source_line TEXT,
  blockers_json TEXT NOT NULL,
  warnings_json TEXT NOT NULL,
  compatibility_findings_json TEXT NOT NULL,
  existing_state_apply_compatibility_json TEXT NOT NULL,
  source_refs_json TEXT NOT NULL,
  authority_profile TEXT NOT NULL,
  perspective_state_mutation_record_fingerprint TEXT NOT NULL,
  FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_state_mutation_receipts(receipt_id)
);

CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_state_mutation_rollbacks (
  rollback_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  receipt_id TEXT NOT NULL,
  rollback_reason TEXT NOT NULL,
  authority_profile TEXT NOT NULL,
  rollback_fingerprint TEXT NOT NULL,
  FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_state_mutation_receipts(receipt_id)
);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_mutation_receipts_scope_time
  ON research_candidate_manual_global_dogfood_perspective_state_mutation_receipts(scope, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_mutation_receipts_status
  ON research_candidate_manual_global_dogfood_perspective_state_mutation_receipts(scope, write_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_mutation_receipts_source_apply
  ON research_candidate_manual_global_dogfood_perspective_state_mutation_receipts(source_perspective_apply_receipt_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_mutation_receipts_source_canonical_update
  ON research_candidate_manual_global_dogfood_perspective_state_mutation_receipts(source_canonical_perspective_update_receipt_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_mutation_receipts_source_relay
  ON research_candidate_manual_global_dogfood_perspective_state_mutation_receipts(source_perspective_relay_receipt_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_mutation_receipts_source_signal
  ON research_candidate_manual_global_dogfood_perspective_state_mutation_receipts(source_next_work_signal_receipt_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_mutation_receipts_source_bias
  ON research_candidate_manual_global_dogfood_perspective_state_mutation_receipts(source_next_work_bias_receipt_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_mutation_receipts_source_projection
  ON research_candidate_manual_global_dogfood_perspective_state_mutation_receipts(source_projection_fingerprint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_mutation_receipts_source_ledger
  ON research_candidate_manual_global_dogfood_perspective_state_mutation_receipts(source_global_dogfood_ledger_receipt_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_mutation_receipts_source_metric
  ON research_candidate_manual_global_dogfood_perspective_state_mutation_receipts(source_metric_snapshot_receipt_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_mutation_records_receipt
  ON research_candidate_manual_global_dogfood_perspective_state_mutation_records(receipt_id);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_mutation_records_scope_time
  ON research_candidate_manual_global_dogfood_perspective_state_mutation_records(scope, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_mutation_rollbacks_receipt
  ON research_candidate_manual_global_dogfood_perspective_state_mutation_rollbacks(receipt_id);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_mutation_rollbacks_time
  ON research_candidate_manual_global_dogfood_perspective_state_mutation_rollbacks(created_at DESC);

CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_adapter_receipts (
  receipt_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
  source_perspective_adapter_contract_fingerprint TEXT NOT NULL,
  source_perspective_adapter_review_fingerprint TEXT NOT NULL,
  source_perspective_state_mutation_receipt_id TEXT NOT NULL,
  source_perspective_state_mutation_record_id TEXT NOT NULL,
  source_perspective_state_mutation_record_fingerprint TEXT NOT NULL,
  source_perspective_apply_receipt_id TEXT NOT NULL,
  source_perspective_apply_record_id TEXT NOT NULL,
  source_perspective_apply_record_fingerprint TEXT NOT NULL,
  source_canonical_perspective_update_receipt_id TEXT NOT NULL,
  source_canonical_perspective_update_record_id TEXT NOT NULL,
  source_canonical_perspective_update_record_fingerprint TEXT NOT NULL,
  source_perspective_relay_receipt_id TEXT NOT NULL,
  source_perspective_relay_record_id TEXT NOT NULL,
  source_perspective_relay_record_fingerprint TEXT NOT NULL,
  source_next_work_signal_receipt_id TEXT NOT NULL,
  source_next_work_signal_record_id TEXT NOT NULL,
  source_next_work_signal_record_fingerprint TEXT NOT NULL,
  source_next_work_bias_receipt_id TEXT NOT NULL,
  source_next_work_bias_record_id TEXT NOT NULL,
  source_next_work_bias_record_fingerprint TEXT NOT NULL,
  source_projection_fingerprint TEXT NOT NULL,
  source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
  source_global_dogfood_ledger_record_id TEXT NOT NULL,
  source_metric_snapshot_receipt_id TEXT NOT NULL,
  source_metric_snapshot_record_id TEXT NOT NULL,
  source_manual_receipt_id TEXT NOT NULL,
  source_handoff_seed_fingerprint TEXT NOT NULL,
  source_result_text_fingerprint TEXT NOT NULL,
  source_expected_observed_delta_record_ref TEXT NOT NULL,
  source_reuse_outcome_record_ref TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  write_status TEXT NOT NULL CHECK (
    write_status IN (
      'committed',
      'duplicate_replayed',
      'superseded',
      'rolled_back'
    )
  ),
  authority_profile TEXT NOT NULL,
  receipt_fingerprint TEXT NOT NULL,
  supersedes_receipt_id TEXT,
  rollback_of_receipt_id TEXT,
  rollback_reason TEXT,
  FOREIGN KEY (supersedes_receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_adapter_receipts(receipt_id),
  FOREIGN KEY (rollback_of_receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_adapter_receipts(receipt_id)
);

CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_adapter_records (
  perspective_adapter_record_id TEXT PRIMARY KEY,
  receipt_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
  source_perspective_state_mutation_receipt_id TEXT NOT NULL,
  source_perspective_state_mutation_record_id TEXT NOT NULL,
  source_perspective_apply_receipt_id TEXT NOT NULL,
  source_perspective_apply_record_id TEXT NOT NULL,
  source_canonical_perspective_update_receipt_id TEXT NOT NULL,
  source_canonical_perspective_update_record_id TEXT NOT NULL,
  source_perspective_relay_receipt_id TEXT NOT NULL,
  source_perspective_relay_record_id TEXT NOT NULL,
  source_next_work_signal_receipt_id TEXT NOT NULL,
  source_next_work_signal_record_id TEXT NOT NULL,
  source_next_work_bias_receipt_id TEXT NOT NULL,
  source_next_work_bias_record_id TEXT NOT NULL,
  source_projection_fingerprint TEXT NOT NULL,
  source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
  source_global_dogfood_ledger_record_id TEXT NOT NULL,
  source_metric_snapshot_receipt_id TEXT NOT NULL,
  source_metric_snapshot_record_id TEXT NOT NULL,
  adapter_label TEXT NOT NULL,
  adapter_rationale TEXT NOT NULL,
  mutation_label TEXT NOT NULL,
  mutation_rationale TEXT NOT NULL,
  apply_label TEXT NOT NULL,
  apply_rationale TEXT NOT NULL,
  canonical_update_label TEXT NOT NULL,
  canonical_update_rationale TEXT NOT NULL,
  relay_update_label TEXT NOT NULL,
  relay_update_rationale TEXT NOT NULL,
  recommended_next_work_label TEXT NOT NULL,
  outcome_label TEXT NOT NULL,
  outcome_signal TEXT NOT NULL CHECK (outcome_signal IN ('positive', 'negative', 'ambiguous')),
  intended_future_adapter_target TEXT NOT NULL CHECK (
    intended_future_adapter_target IN (
      'manual_specific_canonical_state_adapter',
      'manual_specific_current_working_adapter'
    )
  ),
  default_future_adapter_target TEXT NOT NULL CHECK (
    default_future_adapter_target IN (
      'manual_specific_canonical_state_adapter',
      'manual_specific_current_working_adapter'
    )
  ),
  adapter_scope_hint TEXT NOT NULL CHECK (
    adapter_scope_hint IN (
      'manual_specific_canonical_state_adapter',
      'manual_specific_current_working_adapter'
    )
  ),
  adapter_strength_hint TEXT NOT NULL CHECK (adapter_strength_hint IN ('low', 'medium', 'high')),
  expected_future_write_scope TEXT NOT NULL CHECK (expected_future_write_scope IN ('adapter_record_only')),
  recommended_storage_path TEXT NOT NULL CHECK (recommended_storage_path IN ('manual_specific_perspective_adapter_tables')),
  expected_summary TEXT,
  observed_summary TEXT,
  mismatch_or_gap_summary TEXT,
  selected_candidate_context_refs_json TEXT NOT NULL,
  source_next_work_candidate_card_ids_json TEXT NOT NULL,
  manual_only_context_refs_json TEXT NOT NULL,
  source_line TEXT,
  blockers_json TEXT NOT NULL,
  warnings_json TEXT NOT NULL,
  compatibility_findings_json TEXT NOT NULL,
  existing_current_working_adapter_compatibility_json TEXT NOT NULL,
  existing_canonical_state_adapter_compatibility_json TEXT NOT NULL,
  manual_adapter_write_path_json TEXT NOT NULL,
  source_refs_json TEXT NOT NULL,
  authority_profile TEXT NOT NULL,
  perspective_adapter_record_fingerprint TEXT NOT NULL,
  FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_adapter_receipts(receipt_id)
);

CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_adapter_rollbacks (
  rollback_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  receipt_id TEXT NOT NULL,
  rollback_reason TEXT NOT NULL,
  authority_profile TEXT NOT NULL,
  rollback_fingerprint TEXT NOT NULL,
  FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_adapter_receipts(receipt_id)
);

CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_receipts_scope_time
  ON research_candidate_manual_global_dogfood_perspective_adapter_receipts(scope, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_receipts_status
  ON research_candidate_manual_global_dogfood_perspective_adapter_receipts(scope, write_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_receipts_source_state_mutation
  ON research_candidate_manual_global_dogfood_perspective_adapter_receipts(source_perspective_state_mutation_receipt_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_receipts_source_apply
  ON research_candidate_manual_global_dogfood_perspective_adapter_receipts(source_perspective_apply_receipt_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_receipts_source_canonical_update
  ON research_candidate_manual_global_dogfood_perspective_adapter_receipts(source_canonical_perspective_update_receipt_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_receipts_source_relay
  ON research_candidate_manual_global_dogfood_perspective_adapter_receipts(source_perspective_relay_receipt_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_receipts_source_signal
  ON research_candidate_manual_global_dogfood_perspective_adapter_receipts(source_next_work_signal_receipt_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_receipts_source_bias
  ON research_candidate_manual_global_dogfood_perspective_adapter_receipts(source_next_work_bias_receipt_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_receipts_source_projection
  ON research_candidate_manual_global_dogfood_perspective_adapter_receipts(source_projection_fingerprint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_receipts_source_ledger
  ON research_candidate_manual_global_dogfood_perspective_adapter_receipts(source_global_dogfood_ledger_receipt_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_receipts_source_metric
  ON research_candidate_manual_global_dogfood_perspective_adapter_receipts(source_metric_snapshot_receipt_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_records_receipt
  ON research_candidate_manual_global_dogfood_perspective_adapter_records(receipt_id);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_records_scope_time
  ON research_candidate_manual_global_dogfood_perspective_adapter_records(scope, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_rollbacks_receipt
  ON research_candidate_manual_global_dogfood_perspective_adapter_rollbacks(receipt_id);
CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_rollbacks_time
  ON research_candidate_manual_global_dogfood_perspective_adapter_rollbacks(created_at DESC);

CREATE TABLE IF NOT EXISTS perspective_memory_product_persistence_boundary_records (
  record_id TEXT PRIMARY KEY,
  boundary_status TEXT NOT NULL CHECK (
    boundary_status IN (
      'product_persistence_boundary_recorded',
      'locally_reviewing_boundary_record',
      'kept_for_later',
      'retracted_before_memory_write'
    )
  ),
  source_checklist_id TEXT NOT NULL,
  source_proposal_id TEXT NOT NULL,
  source_queue_item_id TEXT NOT NULL,
  source_candidate_draft_id TEXT NOT NULL,
  source_validation_result_state TEXT NOT NULL CHECK (
    source_validation_result_state IN ('PASS', 'PASS with follow-up')
  ),
  source_validation_summary_hash TEXT NOT NULL,
  source_input_ref TEXT NOT NULL,
  source_input_hash TEXT NOT NULL,
  prepare_summary_ref TEXT NOT NULL,
  prepare_execution_summary_hash TEXT NOT NULL,
  returned_envelope_hash TEXT NOT NULL,
  source_proposal_hash TEXT NOT NULL,
  record_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_perspective_memory_boundary_status_time
  ON perspective_memory_product_persistence_boundary_records(boundary_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_perspective_memory_boundary_checklist
  ON perspective_memory_product_persistence_boundary_records(source_checklist_id);

CREATE INDEX IF NOT EXISTS idx_perspective_memory_boundary_proposal
  ON perspective_memory_product_persistence_boundary_records(source_proposal_id);

CREATE INDEX IF NOT EXISTS idx_perspective_memory_boundary_queue
  ON perspective_memory_product_persistence_boundary_records(source_queue_item_id);

CREATE TABLE IF NOT EXISTS perspective_memory_items (
  item_id TEXT PRIMARY KEY,
  item_status TEXT NOT NULL CHECK (
    item_status IN (
      'accepted',
      'reviewing',
      'retracted',
      'superseded',
      'deprecated'
    )
  ),
  memory_kind TEXT NOT NULL CHECK (
    memory_kind IN ('perspective_candidate')
  ),
  source_boundary_record_id TEXT NOT NULL UNIQUE,
  source_checklist_id TEXT NOT NULL,
  source_proposal_id TEXT NOT NULL,
  source_queue_item_id TEXT NOT NULL,
  source_candidate_draft_id TEXT NOT NULL,
  source_validation_result_state TEXT NOT NULL CHECK (
    source_validation_result_state IN ('PASS', 'PASS with follow-up')
  ),
  source_validation_summary_hash TEXT NOT NULL,
  source_input_ref TEXT NOT NULL,
  source_input_hash TEXT NOT NULL,
  prepare_summary_ref TEXT NOT NULL,
  prepare_execution_summary_hash TEXT NOT NULL,
  returned_envelope_hash TEXT NOT NULL,
  source_proposal_hash TEXT NOT NULL,
  item_title TEXT NOT NULL,
  item_summary TEXT NOT NULL,
  item_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_perspective_memory_items_status_time
  ON perspective_memory_items(item_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_perspective_memory_items_kind_time
  ON perspective_memory_items(memory_kind, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_perspective_memory_items_boundary
  ON perspective_memory_items(source_boundary_record_id);

CREATE INDEX IF NOT EXISTS idx_perspective_memory_items_validation
  ON perspective_memory_items(source_validation_result_state, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_perspective_memory_items_source_candidate
  ON perspective_memory_items(source_candidate_draft_id);

CREATE TABLE IF NOT EXISTS research_candidate_review_records (
  review_record_id text primary key,
  record_version text not null,
  db_store_version text not null,
  contract_version text not null,
  scope text not null,
  record_status text not null,
  record_kind text not null,
  lifecycle_state text not null,
  review_decision text not null,
  review_action text,
  reviewer_actor_ref text not null,
  bounded_summary text not null,
  reviewer_note_summary text,
  boundary_acknowledgements_json text not null,
  privacy_report_json text not null,
  authority_boundary_json text not null,
  reason_codes_json text not null,
  related_record_refs_json text not null,
  created_at text not null,
  updated_at text not null,
  discard_reason text,
  supersedes_record_ref text,
  superseded_by_record_ref text,
  record_fingerprint text not null
);

CREATE TABLE IF NOT EXISTS research_candidate_review_record_candidates (
  id text primary key,
  review_record_id text not null,
  candidate_ref text not null,
  created_at text not null,
  foreign key (review_record_id) references research_candidate_review_records(review_record_id) on delete cascade
);

CREATE TABLE IF NOT EXISTS research_candidate_review_record_sources (
  id text primary key,
  review_record_id text not null,
  source_surface text not null,
  source_ref text not null,
  source_version text,
  public_safe integer not null,
  created_at text not null,
  foreign key (review_record_id) references research_candidate_review_records(review_record_id) on delete cascade
);

CREATE TABLE IF NOT EXISTS research_candidate_review_record_activity (
  activity_id text primary key,
  review_record_id text not null,
  activity_kind text not null,
  actor_ref text not null,
  summary text not null,
  reason_codes_json text not null,
  created_at text not null,
  foreign key (review_record_id) references research_candidate_review_records(review_record_id) on delete cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_review_record_candidates_unique
  ON research_candidate_review_record_candidates(review_record_id, candidate_ref);

CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_review_record_sources_unique
  ON research_candidate_review_record_sources(review_record_id, source_surface, source_ref);

CREATE INDEX IF NOT EXISTS idx_research_candidate_review_records_lifecycle
  ON research_candidate_review_records(scope, lifecycle_state, updated_at, review_record_id);

CREATE INDEX IF NOT EXISTS idx_research_candidate_review_records_decision
  ON research_candidate_review_records(scope, review_decision, updated_at, review_record_id);

CREATE INDEX IF NOT EXISTS idx_research_candidate_review_record_candidates_ref
  ON research_candidate_review_record_candidates(candidate_ref, review_record_id);

CREATE INDEX IF NOT EXISTS idx_research_candidate_review_record_sources_ref
  ON research_candidate_review_record_sources(source_ref, review_record_id);

CREATE INDEX IF NOT EXISTS idx_research_candidate_review_record_activity_record
  ON research_candidate_review_record_activity(review_record_id, created_at, activity_id);

CREATE TABLE IF NOT EXISTS research_candidate_feedback_events (
  event_id TEXT PRIMARY KEY,
  event_version TEXT NOT NULL,
  event_type TEXT NOT NULL,
  target_kind TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_fingerprint TEXT,
  source_ref_ids_json TEXT NOT NULL,
  operator_note TEXT,
  correction_text TEXT,
  reason TEXT,
  created_at TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  authority_boundary_json TEXT NOT NULL,
  event_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_research_candidate_feedback_events_event_type
  ON research_candidate_feedback_events(event_type);

CREATE INDEX IF NOT EXISTS idx_research_candidate_feedback_events_target
  ON research_candidate_feedback_events(target_kind, target_id);

CREATE INDEX IF NOT EXISTS idx_research_candidate_feedback_events_created_at
  ON research_candidate_feedback_events(created_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_feedback_events_idempotency
  ON research_candidate_feedback_events(idempotency_key);

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

CREATE TABLE IF NOT EXISTS dogfooding_records (
  record_id text primary key,
  scope text not null,
  status text not null,
  operator_actor_ref text not null,
  recorded_at text not null,
  bounded_context_summary text not null,
  privacy_class text not null,
  redaction_status text not null,
  public_safe integer not null,
  boundary_notes_json text not null,
  reason_codes_json text not null,
  authority_boundary_json text not null,
  record_fingerprint text not null,
  created_at text not null
);

CREATE TABLE IF NOT EXISTS dogfooding_signals (
  signal_id text primary key,
  record_id text not null,
  signal_kind text not null,
  surface text not null,
  surface_ref text not null,
  severity text not null,
  bounded_summary text not null,
  refs_json text not null,
  privacy_class text not null,
  redaction_status text not null,
  public_safe integer not null,
  reason_codes_json text not null,
  authority_boundary_json text not null,
  foreign key (record_id) references dogfooding_records(record_id) on delete cascade
);

CREATE TABLE IF NOT EXISTS dogfooding_review_cues (
  review_cue_id text primary key,
  record_id text not null,
  cue_kind text not null,
  target_surface text not null,
  target_surface_ref text not null,
  target_signal_refs_json text not null,
  bounded_summary text not null,
  severity text not null,
  candidate_only integer not null,
  product_write_request_only integer not null,
  product_write_executed integer not null,
  reason_codes_json text not null,
  authority_boundary_json text not null,
  foreign key (record_id) references dogfooding_records(record_id) on delete cascade
);

CREATE INDEX IF NOT EXISTS idx_dogfooding_records_status
  ON dogfooding_records(scope, status, recorded_at, record_id);

CREATE INDEX IF NOT EXISTS idx_dogfooding_records_operator
  ON dogfooding_records(scope, operator_actor_ref, recorded_at, record_id);

CREATE INDEX IF NOT EXISTS idx_dogfooding_signals_record
  ON dogfooding_signals(record_id, signal_id);

CREATE INDEX IF NOT EXISTS idx_dogfooding_review_cues_record
  ON dogfooding_review_cues(record_id, review_cue_id);

    CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_state_application_receipts (
      receipt_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      source_perspective_state_application_contract_fingerprint TEXT NOT NULL,
      source_perspective_state_application_review_fingerprint TEXT NOT NULL,
      source_perspective_adapter_receipt_id TEXT NOT NULL,
      source_perspective_adapter_record_id TEXT NOT NULL,
      source_perspective_adapter_record_fingerprint TEXT NOT NULL,
      source_perspective_state_mutation_receipt_id TEXT NOT NULL,
      source_perspective_state_mutation_record_id TEXT NOT NULL,
      source_perspective_state_mutation_record_fingerprint TEXT NOT NULL,
      source_perspective_apply_receipt_id TEXT NOT NULL,
      source_perspective_apply_record_id TEXT NOT NULL,
      source_perspective_apply_record_fingerprint TEXT NOT NULL,
      source_canonical_perspective_update_receipt_id TEXT NOT NULL,
      source_canonical_perspective_update_record_id TEXT NOT NULL,
      source_canonical_perspective_update_record_fingerprint TEXT NOT NULL,
      source_perspective_relay_receipt_id TEXT NOT NULL,
      source_perspective_relay_record_id TEXT NOT NULL,
      source_perspective_relay_record_fingerprint TEXT NOT NULL,
      source_next_work_signal_receipt_id TEXT NOT NULL,
      source_next_work_signal_record_id TEXT NOT NULL,
      source_next_work_signal_record_fingerprint TEXT NOT NULL,
      source_next_work_bias_receipt_id TEXT NOT NULL,
      source_next_work_bias_record_id TEXT NOT NULL,
      source_next_work_bias_record_fingerprint TEXT NOT NULL,
      source_projection_fingerprint TEXT NOT NULL,
      source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
      source_global_dogfood_ledger_record_id TEXT NOT NULL,
      source_metric_snapshot_receipt_id TEXT NOT NULL,
      source_metric_snapshot_record_id TEXT NOT NULL,
      source_manual_receipt_id TEXT NOT NULL,
      source_handoff_seed_fingerprint TEXT NOT NULL,
      source_result_text_fingerprint TEXT NOT NULL,
      source_expected_observed_delta_record_ref TEXT NOT NULL,
      source_reuse_outcome_record_ref TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      write_status TEXT NOT NULL CHECK (
        write_status IN (
          'committed',
          'duplicate_replayed',
          'superseded',
          'rolled_back'
        )
      ),
      authority_profile TEXT NOT NULL,
      receipt_fingerprint TEXT NOT NULL,
      supersedes_receipt_id TEXT,
      rollback_of_receipt_id TEXT,
      rollback_reason TEXT,
      FOREIGN KEY (supersedes_receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_state_application_receipts(receipt_id),
      FOREIGN KEY (rollback_of_receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_state_application_receipts(receipt_id)
    );

    CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_state_application_records (
      perspective_state_application_record_id TEXT PRIMARY KEY,
      receipt_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      source_perspective_adapter_receipt_id TEXT NOT NULL,
      source_perspective_adapter_record_id TEXT NOT NULL,
      source_perspective_state_mutation_receipt_id TEXT NOT NULL,
      source_perspective_state_mutation_record_id TEXT NOT NULL,
      source_perspective_apply_receipt_id TEXT NOT NULL,
      source_perspective_apply_record_id TEXT NOT NULL,
      source_canonical_perspective_update_receipt_id TEXT NOT NULL,
      source_canonical_perspective_update_record_id TEXT NOT NULL,
      source_perspective_relay_receipt_id TEXT NOT NULL,
      source_perspective_relay_record_id TEXT NOT NULL,
      source_next_work_signal_receipt_id TEXT NOT NULL,
      source_next_work_signal_record_id TEXT NOT NULL,
      source_next_work_bias_receipt_id TEXT NOT NULL,
      source_next_work_bias_record_id TEXT NOT NULL,
      source_projection_fingerprint TEXT NOT NULL,
      source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
      source_global_dogfood_ledger_record_id TEXT NOT NULL,
      source_metric_snapshot_receipt_id TEXT NOT NULL,
      source_metric_snapshot_record_id TEXT NOT NULL,
      state_application_label TEXT NOT NULL,
      state_application_rationale TEXT NOT NULL,
      adapter_label TEXT NOT NULL,
      adapter_rationale TEXT NOT NULL,
      mutation_label TEXT NOT NULL,
      mutation_rationale TEXT NOT NULL,
      apply_label TEXT NOT NULL,
      apply_rationale TEXT NOT NULL,
      canonical_update_label TEXT NOT NULL,
      canonical_update_rationale TEXT NOT NULL,
      relay_update_label TEXT NOT NULL,
      relay_update_rationale TEXT NOT NULL,
      recommended_next_work_label TEXT NOT NULL,
      outcome_label TEXT NOT NULL,
      outcome_signal TEXT NOT NULL CHECK (outcome_signal IN ('positive', 'negative', 'ambiguous')),
      intended_future_state_application_target TEXT NOT NULL CHECK (
        intended_future_state_application_target IN (
          'manual_specific_existing_canonical_state_application_adapter',
          'manual_specific_current_working_application_adapter'
        )
      ),
      default_future_state_application_target TEXT NOT NULL CHECK (
        default_future_state_application_target IN (
          'manual_specific_existing_canonical_state_application_adapter',
          'manual_specific_current_working_application_adapter'
        )
      ),
      state_application_scope_hint TEXT NOT NULL CHECK (
        state_application_scope_hint IN (
          'manual_specific_existing_canonical_state_application_adapter',
          'manual_specific_current_working_application_adapter'
        )
      ),
      state_application_strength_hint TEXT NOT NULL CHECK (state_application_strength_hint IN ('low', 'medium', 'high')),
      expected_future_write_scope TEXT NOT NULL CHECK (expected_future_write_scope IN ('state_application_record_only')),
      recommended_storage_path TEXT NOT NULL CHECK (recommended_storage_path IN ('manual_specific_perspective_state_application_tables')),
      expected_summary TEXT,
      observed_summary TEXT,
      mismatch_or_gap_summary TEXT,
      selected_candidate_context_refs_json TEXT NOT NULL,
      source_next_work_candidate_card_ids_json TEXT NOT NULL,
      manual_only_context_refs_json TEXT NOT NULL,
      source_line TEXT,
      blockers_json TEXT NOT NULL,
      warnings_json TEXT NOT NULL,
      compatibility_findings_json TEXT NOT NULL,
      existing_current_working_application_compatibility_json TEXT NOT NULL,
      existing_canonical_state_application_compatibility_json TEXT NOT NULL,
      manual_state_application_write_path_json TEXT NOT NULL,
      source_refs_json TEXT NOT NULL,
      authority_profile TEXT NOT NULL,
      perspective_state_application_record_fingerprint TEXT NOT NULL,
      FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_state_application_receipts(receipt_id)
    );

    CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_state_application_rollbacks (
      rollback_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      receipt_id TEXT NOT NULL,
      rollback_reason TEXT NOT NULL,
      authority_profile TEXT NOT NULL,
      rollback_fingerprint TEXT NOT NULL,
      FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_state_application_receipts(receipt_id)
    );

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_receipts_scope_time
      ON research_candidate_manual_global_dogfood_perspective_state_application_receipts(scope, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_receipts_status
      ON research_candidate_manual_global_dogfood_perspective_state_application_receipts(scope, write_status, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_receipts_source_adapter
      ON research_candidate_manual_global_dogfood_perspective_state_application_receipts(source_perspective_adapter_receipt_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_receipts_source_state_mutation
      ON research_candidate_manual_global_dogfood_perspective_state_application_receipts(source_perspective_state_mutation_receipt_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_receipts_source_apply
      ON research_candidate_manual_global_dogfood_perspective_state_application_receipts(source_perspective_apply_receipt_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_receipts_source_canonical_update
      ON research_candidate_manual_global_dogfood_perspective_state_application_receipts(source_canonical_perspective_update_receipt_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_receipts_source_relay
      ON research_candidate_manual_global_dogfood_perspective_state_application_receipts(source_perspective_relay_receipt_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_receipts_source_signal
      ON research_candidate_manual_global_dogfood_perspective_state_application_receipts(source_next_work_signal_receipt_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_receipts_source_bias
      ON research_candidate_manual_global_dogfood_perspective_state_application_receipts(source_next_work_bias_receipt_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_receipts_source_projection
      ON research_candidate_manual_global_dogfood_perspective_state_application_receipts(source_projection_fingerprint, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_receipts_source_ledger
      ON research_candidate_manual_global_dogfood_perspective_state_application_receipts(source_global_dogfood_ledger_receipt_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_receipts_source_metric
      ON research_candidate_manual_global_dogfood_perspective_state_application_receipts(source_metric_snapshot_receipt_id, created_at DESC);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_records_receipt
      ON research_candidate_manual_global_dogfood_perspective_state_application_records(receipt_id);

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_records_scope_time
      ON research_candidate_manual_global_dogfood_perspective_state_application_records(scope, created_at DESC);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_rollbacks_receipt
      ON research_candidate_manual_global_dogfood_perspective_state_application_rollbacks(receipt_id);

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_rollbacks_time
      ON research_candidate_manual_global_dogfood_perspective_state_application_rollbacks(created_at DESC);

    CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts (
      receipt_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      source_perspective_writer_compatibility_contract_fingerprint TEXT NOT NULL,
      source_perspective_writer_compatibility_review_fingerprint TEXT NOT NULL,
      source_perspective_state_application_receipt_id TEXT NOT NULL,
      source_perspective_state_application_record_id TEXT NOT NULL,
      source_perspective_state_application_record_fingerprint TEXT NOT NULL,
      source_perspective_adapter_receipt_id TEXT NOT NULL,
      source_perspective_adapter_record_id TEXT NOT NULL,
      source_perspective_adapter_record_fingerprint TEXT NOT NULL,
      source_perspective_state_mutation_receipt_id TEXT NOT NULL,
      source_perspective_state_mutation_record_id TEXT NOT NULL,
      source_perspective_state_mutation_record_fingerprint TEXT NOT NULL,
      source_perspective_apply_receipt_id TEXT NOT NULL,
      source_perspective_apply_record_id TEXT NOT NULL,
      source_perspective_apply_record_fingerprint TEXT NOT NULL,
      source_canonical_perspective_update_receipt_id TEXT NOT NULL,
      source_canonical_perspective_update_record_id TEXT NOT NULL,
      source_canonical_perspective_update_record_fingerprint TEXT NOT NULL,
      source_perspective_relay_receipt_id TEXT NOT NULL,
      source_perspective_relay_record_id TEXT NOT NULL,
      source_perspective_relay_record_fingerprint TEXT NOT NULL,
      source_next_work_signal_receipt_id TEXT NOT NULL,
      source_next_work_signal_record_id TEXT NOT NULL,
      source_next_work_signal_record_fingerprint TEXT NOT NULL,
      source_next_work_bias_receipt_id TEXT NOT NULL,
      source_next_work_bias_record_id TEXT NOT NULL,
      source_next_work_bias_record_fingerprint TEXT NOT NULL,
      source_projection_fingerprint TEXT NOT NULL,
      source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
      source_global_dogfood_ledger_record_id TEXT NOT NULL,
      source_metric_snapshot_receipt_id TEXT NOT NULL,
      source_metric_snapshot_record_id TEXT NOT NULL,
      source_manual_receipt_id TEXT NOT NULL,
      source_handoff_seed_fingerprint TEXT NOT NULL,
      source_result_text_fingerprint TEXT NOT NULL,
      source_expected_observed_delta_record_ref TEXT NOT NULL,
      source_reuse_outcome_record_ref TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      write_status TEXT NOT NULL CHECK (
        write_status IN (
          'committed',
          'duplicate_replayed',
          'superseded',
          'rolled_back'
        )
      ),
      authority_profile TEXT NOT NULL,
      receipt_fingerprint TEXT NOT NULL,
      supersedes_receipt_id TEXT,
      rollback_of_receipt_id TEXT,
      rollback_reason TEXT,
      FOREIGN KEY (supersedes_receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(receipt_id),
      FOREIGN KEY (rollback_of_receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(receipt_id)
    );

    CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_writer_compatibility_records (
      perspective_writer_compatibility_record_id TEXT PRIMARY KEY,
      receipt_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      source_perspective_state_application_receipt_id TEXT NOT NULL,
      source_perspective_state_application_record_id TEXT NOT NULL,
      source_perspective_adapter_receipt_id TEXT NOT NULL,
      source_perspective_adapter_record_id TEXT NOT NULL,
      source_perspective_state_mutation_receipt_id TEXT NOT NULL,
      source_perspective_state_mutation_record_id TEXT NOT NULL,
      source_perspective_apply_receipt_id TEXT NOT NULL,
      source_perspective_apply_record_id TEXT NOT NULL,
      source_canonical_perspective_update_receipt_id TEXT NOT NULL,
      source_canonical_perspective_update_record_id TEXT NOT NULL,
      source_perspective_relay_receipt_id TEXT NOT NULL,
      source_perspective_relay_record_id TEXT NOT NULL,
      source_next_work_signal_receipt_id TEXT NOT NULL,
      source_next_work_signal_record_id TEXT NOT NULL,
      source_next_work_bias_receipt_id TEXT NOT NULL,
      source_next_work_bias_record_id TEXT NOT NULL,
      source_projection_fingerprint TEXT NOT NULL,
      source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
      source_global_dogfood_ledger_record_id TEXT NOT NULL,
      source_metric_snapshot_receipt_id TEXT NOT NULL,
      source_metric_snapshot_record_id TEXT NOT NULL,
      writer_compatibility_label TEXT NOT NULL,
      writer_compatibility_rationale TEXT NOT NULL,
      state_application_label TEXT NOT NULL,
      state_application_rationale TEXT NOT NULL,
      adapter_label TEXT NOT NULL,
      adapter_rationale TEXT NOT NULL,
      mutation_label TEXT NOT NULL,
      mutation_rationale TEXT NOT NULL,
      apply_label TEXT NOT NULL,
      apply_rationale TEXT NOT NULL,
      canonical_update_label TEXT NOT NULL,
      canonical_update_rationale TEXT NOT NULL,
      relay_update_label TEXT NOT NULL,
      relay_update_rationale TEXT NOT NULL,
      recommended_next_work_label TEXT NOT NULL,
      outcome_label TEXT NOT NULL,
      outcome_signal TEXT NOT NULL CHECK (outcome_signal IN ('positive', 'negative', 'ambiguous')),
      intended_future_writer_target TEXT NOT NULL CHECK (
        intended_future_writer_target IN (
          'manual_specific_existing_canonical_state_writer_adapter',
          'manual_specific_current_working_writer_adapter'
        )
      ),
      default_future_writer_target TEXT NOT NULL CHECK (
        default_future_writer_target IN (
          'manual_specific_existing_canonical_state_writer_adapter',
          'manual_specific_current_working_writer_adapter'
        )
      ),
      writer_compatibility_scope_hint TEXT NOT NULL CHECK (
        writer_compatibility_scope_hint IN (
          'manual_specific_existing_canonical_state_writer_adapter',
          'manual_specific_current_working_writer_adapter'
        )
      ),
      writer_compatibility_strength_hint TEXT NOT NULL CHECK (writer_compatibility_strength_hint IN ('low', 'medium', 'high')),
      expected_future_write_scope TEXT NOT NULL CHECK (expected_future_write_scope IN ('writer_compatibility_record_only')),
      recommended_storage_path TEXT NOT NULL CHECK (recommended_storage_path IN ('manual_specific_perspective_writer_compatibility_tables')),
      expected_summary TEXT,
      observed_summary TEXT,
      mismatch_or_gap_summary TEXT,
      selected_candidate_context_refs_json TEXT NOT NULL,
      source_next_work_candidate_card_ids_json TEXT NOT NULL,
      manual_only_context_refs_json TEXT NOT NULL,
      source_line TEXT,
      blockers_json TEXT NOT NULL,
      warnings_json TEXT NOT NULL,
      compatibility_findings_json TEXT NOT NULL,
      existing_current_working_writer_compatibility_json TEXT NOT NULL,
      existing_canonical_state_writer_compatibility_json TEXT NOT NULL,
      manual_writer_compatibility_path_json TEXT NOT NULL,
      source_refs_json TEXT NOT NULL,
      authority_profile TEXT NOT NULL,
      perspective_writer_compatibility_record_fingerprint TEXT NOT NULL,
      FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(receipt_id)
    );

    CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_writer_compatibility_rollbacks (
      rollback_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      receipt_id TEXT NOT NULL,
      rollback_reason TEXT NOT NULL,
      authority_profile TEXT NOT NULL,
      rollback_fingerprint TEXT NOT NULL,
      FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(receipt_id)
    );

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts_scope_time
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts_status
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(scope, write_status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts_source_state_application
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(source_perspective_state_application_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts_source_adapter
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(source_perspective_adapter_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts_source_state_mutation
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(source_perspective_state_mutation_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts_source_apply
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(source_perspective_apply_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts_source_canonical_update
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(source_canonical_perspective_update_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts_source_relay
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(source_perspective_relay_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts_source_signal
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(source_next_work_signal_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts_source_bias
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(source_next_work_bias_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts_source_projection
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(source_projection_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts_source_ledger
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(source_global_dogfood_ledger_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts_source_metric
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(source_metric_snapshot_receipt_id, created_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_records_receipt
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_records(receipt_id);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_records_scope_time
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_records(scope, created_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_rollbacks_receipt
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_rollbacks(receipt_id);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_rollbacks_time
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_rollbacks(created_at DESC);

    CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_records (
      record_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      source_entrypoint_review_fingerprint TEXT NOT NULL,
      source_entrypoint_fingerprint TEXT NOT NULL,
      source_contract_fingerprint TEXT NOT NULL,
      source_review_fingerprint TEXT NOT NULL,
      source_dry_run_result_fingerprint TEXT NOT NULL,
      source_perspective_writer_compatibility_receipt_id TEXT NOT NULL,
      source_perspective_writer_compatibility_record_id TEXT NOT NULL,
      source_perspective_writer_compatibility_record_fingerprint TEXT NOT NULL,
      safe_adapter_target TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      accepted_entrypoint_summary_json TEXT NOT NULL,
      source_row_count_summary_json TEXT NOT NULL,
      source_non_mutation_summary_json TEXT NOT NULL,
      source_binding_summary_json TEXT NOT NULL,
      source_explicit_non_write_boundary_json TEXT NOT NULL,
      result_record_write_boundary_json TEXT NOT NULL,
      row_count_write_summary_json TEXT NOT NULL,
      persisted_material_boundary_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      record_fingerprint TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_records_scope_time
      ON research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_records(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_records_source_review
      ON research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_records(source_entrypoint_review_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_records_source_entrypoint
      ON research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_records(source_entrypoint_fingerprint, created_at DESC);
